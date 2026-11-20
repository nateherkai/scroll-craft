#!/usr/bin/env node
/**
 * Shared cross-platform binary and runtime resolvers for scroll-craft.
 *
 * Centralises:
 *   - full ffmpeg (>200 filters) + matching ffprobe lookup (Windows WinGet, PATH, macOS, Linux)
 *   - installed Chrome/Edge lookup (including Windows Edge x86 and %LOCALAPPDATA% Chrome)
 *   - playwright-core resolution (build cwd first, optional override, skill fallback)
 *   - active coding agent detection (Antigravity, Gemini CLI, Claude Code, Codex)
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const runOutput = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
};

function globWinGetFfmpeg() {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  if (!home) return [];
  const base = path.join(home, "AppData", "Local", "Microsoft", "WinGet", "Packages");
  if (!fs.existsSync(base)) return [];
  const out = [];
  for (const d of fs.readdirSync(base)) {
    if (!/^Gyan\.FFmpeg/i.test(d)) continue;
    const inner = path.join(base, d);
    let entries = [];
    try { entries = fs.readdirSync(inner); } catch { continue; }
    for (const e of entries) {
      const p = path.join(inner, e, "bin", "ffmpeg.exe");
      if (fs.existsSync(p)) out.push(p);
    }
  }
  return out;
}

export function findFfmpeg() {
  const candidates = [
    process.env.SCROLLCRAFT_FFMPEG,
    "ffmpeg",
    ...globWinGetFfmpeg(),
    "/usr/local/bin/ffmpeg",
    "/opt/homebrew/bin/ffmpeg",
    "/usr/bin/ffmpeg",
    "/snap/bin/ffmpeg",
  ].filter(Boolean);

  let best = null;
  let bestCount = 0;
  for (const c of candidates) {
    if (c !== "ffmpeg" && !fs.existsSync(c)) continue;
    const out = runOutput(c, ["-hide_banner", "-filters"]);
    if (!out) continue;
    const count = out.split(/\r?\n/).length;
    if (count > bestCount) {
      bestCount = count;
      best = c;
    }
    if (count > 200) break;
  }

  return {
    path: best,
    filterCount: bestCount,
    full: bestCount > 200,
    hasLibwebp: Boolean(best && bestCount > 200 && /libwebp/.test(runOutput(best, ["-hide_banner", "-encoders"]) || "")),
  };
}

export function findFfprobe(ffmpegPath) {
  const exe = process.platform === "win32" ? "ffprobe.exe" : "ffprobe";
  const candidates = [];
  if (ffmpegPath && ffmpegPath !== "ffmpeg") {
    candidates.push(path.join(path.dirname(ffmpegPath), exe));
  }
  candidates.push("ffprobe");
  for (const c of candidates) {
    if (c !== "ffprobe" && !fs.existsSync(c)) continue;
    if (runOutput(c, ["-version"]) !== null) return c;
  }
  return null;
}

export function getChromeCandidates(env = process.env) {
  return [
    env.SCROLLCRAFT_CHROME,
    // Windows
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    env.LOCALAPPDATA && `${env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    // Linux
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
  ].filter(Boolean);
}

export function findChrome(env = process.env) {
  return getChromeCandidates(env).find((p) => fs.existsSync(p)) || null;
}

export function resolvePlaywright(cwd = process.cwd(), fallbackDir = null) {
  const bases = [];
  if (process.env.SCROLLCRAFT_PLAYWRIGHT) {
    bases.push({ label: "SCROLLCRAFT_PLAYWRIGHT", dir: path.resolve(process.env.SCROLLCRAFT_PLAYWRIGHT) });
  }
  bases.push({ label: "cwd", dir: path.resolve(cwd) });
  if (fallbackDir) {
    bases.push({ label: "skill", dir: path.resolve(fallbackDir) });
  }

  for (const b of bases) {
    try {
      const target = fs.existsSync(b.dir) && fs.statSync(b.dir).isFile()
        ? b.dir
        : path.join(b.dir, "package.json");
      const mod = createRequire(target)("playwright-core");
      return { mod, where: b.label };
    } catch {
      // try next search root
    }
  }
  return { mod: null, where: "not installed" };
}

export function detectAgent(env = process.env) {
  if (env.ANTIGRAVITY_AGENT || env.ANTIGRAVITY_SESSION_ID) return "antigravity";
  if (env.GEMINI_CLI || env.GEMINI_EXTENSION_DIR) return "gemini-cli";
  if (env.CLAUDECODE || env.CLAUDE_CODE_ENTRYPOINT || env.CLAUDE_PLUGIN_ROOT) return "claude";
  if (env.CODEX_CI || env.CODEX_SANDBOX || env.CODEX_THREAD_ID) return "codex";
  return "generic";
}
