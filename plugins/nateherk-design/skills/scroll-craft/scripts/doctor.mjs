#!/usr/bin/env node
/**
 * Preflight. Run this BEFORE the interview, not after the first failure.
 *
 *   node scripts/doctor.mjs            check everything
 *   node scripts/doctor.mjs --probe    also spend one API call to read the balance
 *   node scripts/doctor.mjs --json     machine-readable report
 *
 * Every check that can fail deep inside a build with a misleading message is
 * checked here with an honest one:
 *   - stripped ffmpeg (~50 filters, missing scale/fps/psnr/libwebp)
 *   - optional KIE_AI_API_KEY (zero-key bring-your-own-assets mode supported)
 *   - playwright-core resolving from the build folder (or fallback)
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { paths } from "./workspace.mjs";
import { findFfmpeg, findFfprobe, findChrome, resolvePlaywright, detectAgent } from "./ffmpeg.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const JSON_MODE = process.argv.includes("--json");
const rows = [];
const add = (sev, name, ok, detail, fix) => rows.push({ sev, name, ok, detail, fix });

// --------------------------------------------------------------- runtime ----
const agent = detectAgent();
add("info", "agent", true, agent, "");

const major = Number(process.versions.node.split(".")[0]);
add("required", "node", major >= 18, `v${process.versions.node}`,
  "Install Node 18 or newer.");

// -------------------------------------------------------------- ffmpeg ----
const ff = findFfmpeg();
add("required", "ffmpeg (full build)", ff.full,
  ff.path ? `${ff.path}  (${ff.filterCount} filters)` : "not found",
  "A stripped ffmpeg lacks scale/fps/psnr and the webp muxer. Install a full build (Windows: winget install Gyan.FFmpeg) or set SCROLLCRAFT_FFMPEG.");

if (ff.full) {
  const probeBin = findFfprobe(ff.path);
  add("optional", "  └ ffprobe", Boolean(probeBin), probeBin || "not found",
    "Used by encode.mjs to report clip duration.");
  add("optional", "  └ libwebp encoder", ff.hasLibwebp,
    ff.hasLibwebp ? "present" : "missing",
    "Posters fall back to PNG/JPEG. Not fatal, just heavier.");
}

// ---------------------------------------------------------- playwright ----
const pw = resolvePlaywright(process.cwd(), HERE);
const pwDetail = pw.mod
  ? (pw.where === "cwd" ? "resolves from cwd" : `resolves from ${pw.where}`)
  : "not installed";
add("verify", "playwright-core", Boolean(pw.mod), pwDetail,
  "Run `npm i playwright-core` inside the build folder (or set SCROLLCRAFT_PLAYWRIGHT). Needed for Step 5 verification.");

const chrome = findChrome();
add("verify", "Chrome", Boolean(chrome), chrome || "not found",
  "Install Chrome or Edge, or set SCROLLCRAFT_CHROME to an executable.");

// ------------------------------------------------------------- kie key ----
function findKey() {
  if (process.env.KIE_AI_API_KEY) return "env";
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    const p = path.join(dir, ".env");
    if (fs.existsSync(p) && /^\s*KIE_AI_API_KEY\s*=\s*\S+/m.test(fs.readFileSync(p, "utf8"))) return p;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}
const keyWhere = findKey();
add("optional", "KIE_AI_API_KEY", Boolean(keyWhere), keyWhere || "not set",
  "Only needed to GENERATE imagery. Building from your own photos and footage needs no key and no spend. Copy .env.example to .env to set one.");

// ----------------------------------------------------------- workspace ----
let ws = null;
try {
  ws = paths();
  add("required", "workspace", true, `${ws.workspace} (via ${ws.via})`, "");
  add("optional", "  └ registry", fs.existsSync(ws.fingerprints),
    fs.existsSync(ws.fingerprints) ? "present" : "not created yet",
    "Run `node scripts/workspace.mjs --ensure` to create it.");
} catch (e) {
  add("required", "workspace", false, e.message, "Fix or delete the offending .scrollcraft.json.");
}

const hardFails = rows.filter((r) => !r.ok && r.sev === "required");
const softFails = rows.filter((r) => !r.ok && r.sev !== "required");

if (JSON_MODE) {
  let credit = null;
  if (process.argv.includes("--probe") && keyWhere) {
    try {
      credit = execFileSync(process.execPath, [path.join(HERE, "kie.mjs"), "probe"], { encoding: "utf8" })
        .trim()
        .replace(/^credit:\s*/, "");
    } catch (e) {
      credit = `probe failed: ${e.message}`;
    }
  }
  console.log(JSON.stringify({
    ready: hardFails.length === 0,
    agent,
    hardFails: hardFails.length,
    warnings: softFails.length,
    credit,
    checks: rows,
  }, null, 2));
  process.exit(hardFails.length ? 1 : 0);
}

// -------------------------------------------------------------- report ----
const mark = (r) => (r.ok ? "\u001b[32m ok \u001b[0m" : r.sev === "required" ? "\u001b[31mFAIL\u001b[0m" : "\u001b[33mwarn\u001b[0m");
console.log("\nscrollcraft preflight\n");
for (const r of rows) {
  console.log(` [${mark(r)}] ${r.name.padEnd(22)} ${r.detail}`);
  if (!r.ok && r.fix) console.log(`        \u001b[2m${r.fix}\u001b[0m`);
}

console.log("");
if (hardFails.length) {
  console.log(`\u001b[31m${hardFails.length} required check(s) failed. Fix these before building.\u001b[0m\n`);
  process.exit(1);
}
console.log(softFails.length
  ? `\u001b[33mReady, with ${softFails.length} optional item(s) missing (see above).\u001b[0m\n`
  : "\u001b[32mReady.\u001b[0m\n");

if (process.argv.includes("--probe") && keyWhere) {
  try {
    console.log("credit: " + execFileSync(process.execPath, [path.join(HERE, "kie.mjs"), "probe"], { encoding: "utf8" }).trim().replace(/^credit:\s*/, ""));
  } catch (e) {
    console.log("balance probe failed: " + e.message);
  }
}
