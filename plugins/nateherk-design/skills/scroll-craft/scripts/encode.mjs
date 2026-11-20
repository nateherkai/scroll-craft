#!/usr/bin/env node
/**
 * scroll-craft: cross-platform dense-GOP video encoder (Node.js replacement for encode.sh).
 *
 * A normal web encode places a keyframe every 2-5 seconds. Scrubbing seeks to an
 * arbitrary time, and the decoder must walk from the previous keyframe to get there,
 * so a sparse-GOP file scrubs like mud. Dense keyframes cost file size and buy
 * responsiveness. Audio is always stripped.
 *
 * Usage:
 *   node encode.mjs <in> <out> [desktop|mobile|portrait] [crf]
 *                  [--poster <out.webp|png|jpg>] [--crop-portrait]
 *
 * Modes:
 *   desktop   scale=-2:1080, -g 8, crf 20   (default)
 *   mobile    scale=-2:720,  -g 4, crf 24
 *   portrait  scale=720:-2,  -g 4, crf 20   (add --crop-portrait for 16:9 -> 9:16 crop)
 *
 * Env:
 *   SCROLLCRAFT_FFMPEG  override full ffmpeg binary
 *   SCROLLCRAFT_CRF     default CRF override (positional [crf] wins)
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { findFfmpeg, findFfprobe } from "./ffmpeg.mjs";

const SQUARESPACE_LIMIT_BYTES = 20 * 1024 * 1024;

function parseArgs(argv) {
  const pos = [];
  let poster = null;
  let cropPortrait = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--poster") {
      if (!argv[i + 1]) throw new Error("--poster requires an output path");
      poster = argv[++i];
    } else if (a === "--crop-portrait") {
      cropPortrait = true;
    } else if (a === "-h" || a === "--help") {
      return { help: true };
    } else if (a.startsWith("--")) {
      throw new Error(`Unknown flag: ${a}`);
    } else {
      pos.push(a);
    }
  }

  return {
    help: false,
    input: pos[0],
    output: pos[1],
    mode: pos[2] || "desktop",
    crfArg: pos[3] || null,
    poster,
    cropPortrait,
  };
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${bytes}B`;
}

function buildPreset(mode, cropPortrait) {
  if (mode === "mobile") {
    return { vf: "scale=-2:720:flags=lanczos,format=yuv420p", gop: 4, defaultCrf: 24 };
  }
  if (mode === "portrait") {
    const scale = cropPortrait
      ? "crop=ih*9/16:ih,scale=720:-2:flags=lanczos,format=yuv420p"
      : "scale=720:-2:flags=lanczos,format=yuv420p";
    return { vf: scale, gop: 4, defaultCrf: 20 };
  }
  if (mode === "desktop") {
    return { vf: "scale=-2:1080:flags=lanczos,format=yuv420p", gop: 8, defaultCrf: 20 };
  }
  throw new Error(`Invalid mode "${mode}". Expected desktop, mobile, or portrait.`);
}

export function encodeClip(opts) {
  const { input, output, mode = "desktop", crfArg = null, poster = null, cropPortrait = false } = opts;
  if (!input || !output) {
    throw new Error("usage: node encode.mjs <in> <out> [desktop|mobile|portrait] [crf] [--poster <path>] [--crop-portrait]");
  }
  const absIn = path.resolve(input);
  const absOut = path.resolve(output);
  if (!fs.existsSync(absIn)) throw new Error(`Input file not found: ${absIn}`);

  const preset = buildPreset(mode, cropPortrait);
  const rawCrf = crfArg ?? process.env.SCROLLCRAFT_CRF ?? String(preset.defaultCrf);
  if (!/^\d+$/.test(String(rawCrf))) {
    throw new Error(`crf must be an integer, got '${rawCrf}'`);
  }
  const crf = Number(rawCrf);
  if (crf < 0 || crf > 51) {
    throw new Error(`crf must be between 0 and 51, got '${crf}'`);
  }

  const ff = findFfmpeg();
  if (!ff.full || !ff.path) {
    throw new Error("No full ffmpeg build (>200 filters) found. Install a full build or set SCROLLCRAFT_FFMPEG.");
  }

  fs.mkdirSync(path.dirname(absOut), { recursive: true });
  const args = [
    "-y", "-hide_banner", "-loglevel", "error",
    "-i", absIn,
    "-an",
    "-vf", preset.vf,
    "-c:v", "libx264", "-profile:v", "high", "-preset", "slow",
    "-crf", String(crf),
    "-g", String(preset.gop), "-keyint_min", String(preset.gop), "-sc_threshold", "0",
    "-movflags", "+faststart",
    absOut,
  ];
  const res = spawnSync(ff.path, args, { encoding: "utf8" });
  if (res.status !== 0) {
    throw new Error(`ffmpeg encode failed (exit ${res.status}): ${(res.stderr || "").trim()}`);
  }

  const size = fs.statSync(absOut).size;
  let duration = null;
  const ffprobe = findFfprobe(ff.path);
  if (ffprobe) {
    const pr = spawnSync(ffprobe, [
      "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", absOut,
    ], { encoding: "utf8" });
    if (pr.status === 0 && pr.stdout.trim()) {
      duration = Number.parseFloat(pr.stdout.trim());
    }
  }

  let posterPath = null;
  if (poster) {
    posterPath = path.resolve(poster);
    fs.mkdirSync(path.dirname(posterPath), { recursive: true });
    const ext = path.extname(posterPath).toLowerCase();
    const pArgs = ["-y", "-hide_banner", "-loglevel", "error", "-i", absOut, "-frames:v", "1"];
    if (ext === ".webp") {
      if (!ff.hasLibwebp) throw new Error("Resolved ffmpeg lacks libwebp; choose a .png or .jpg poster path.");
      pArgs.push("-c:v", "libwebp", "-quality", "82");
    } else if (ext === ".jpg" || ext === ".jpeg") {
      pArgs.push("-q:v", "2");
    }
    pArgs.push(posterPath);
    const pres = spawnSync(ff.path, pArgs, { encoding: "utf8" });
    if (pres.status !== 0) {
      throw new Error(`ffmpeg poster extraction failed (exit ${pres.status}): ${(pres.stderr || "").trim()}`);
    }
  }

  return {
    output: absOut,
    poster: posterPath,
    size,
    sizeLabel: formatBytes(size),
    duration,
    mode,
    gop: preset.gop,
    crf,
    overSquarespaceLimit: size > SQUARESPACE_LIMIT_BYTES,
  };
}

// ------------------------------------------------------------------- cli ----
import { fileURLToPath } from "node:url";
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    const parsed = parseArgs(process.argv.slice(2));
    if (parsed.help) {
      console.log(`usage: node encode.mjs <in> <out> [desktop|mobile|portrait] [crf] [--poster <out.webp|png|jpg>] [--crop-portrait]`);
      process.exit(0);
    }
    const r = encodeClip(parsed);
    const durStr = r.duration !== null ? `${r.duration.toFixed(2)}s` : "?s";
    console.log(`${parsed.output}  ${r.sizeLabel}  ${durStr}  mode=${r.mode}  gop=${r.gop}  crf=${r.crf}`);
    if (r.poster) console.log(`poster: ${parsed.poster}`);
    if (r.overSquarespaceLimit) {
      console.error(`WARN: ${r.sizeLabel} exceeds Squarespace's 20MB /s/ static file limit. Raise CRF (e.g. 23-25) or shorten clip.`);
    }
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    process.exit(1);
  }
}
