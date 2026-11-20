// Cross-platform ffmpeg/Chrome resolver, doctor, workspace, and native Node encoder tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPTS = path.join(REPO, "plugins", "nateherk-design", "skills", "scroll-craft", "scripts");

const { findFfmpeg, findFfprobe, getChromeCandidates, detectAgent } = await import(
  new URL("../plugins/nateherk-design/skills/scroll-craft/scripts/ffmpeg.mjs", import.meta.url)
);
const { encodeClip } = await import(
  new URL("../plugins/nateherk-design/skills/scroll-craft/scripts/encode.mjs", import.meta.url)
);

test("detectAgent recognises Antigravity, Gemini CLI, Claude Code, Codex, and generic", () => {
  assert.equal(detectAgent({ ANTIGRAVITY_AGENT: "1" }), "antigravity");
  assert.equal(detectAgent({ GEMINI_CLI: "1" }), "gemini-cli");
  assert.equal(detectAgent({ CLAUDECODE: "1" }), "claude");
  assert.equal(detectAgent({ CODEX_SANDBOX: "1" }), "codex");
  assert.equal(detectAgent({}), "generic");
});

test("getChromeCandidates preserves Windows Edge x86 and per-user %LOCALAPPDATA% Chrome paths (issue #8)", () => {
  const list = getChromeCandidates({ LOCALAPPDATA: "C:/LocalAppDataTest" });
  assert.ok(list.includes("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"));
  assert.ok(list.includes("C:/Program Files/Microsoft/Edge/Application/msedge.exe"));
  assert.ok(list.includes("C:/LocalAppDataTest/Google/Chrome/Application/chrome.exe"));
});

test("doctor.mjs --json reports ready and finds full ffmpeg (>200 filters)", () => {
  const r = spawnSync(process.execPath, [path.join(SCRIPTS, "doctor.mjs"), "--json"], {
    cwd: REPO,
    encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const data = JSON.parse(r.stdout);
  assert.equal(data.ready, true);
  assert.equal(data.hardFails, 0);
  const ffRow = data.checks.find((c) => c.name === "ffmpeg (full build)");
  assert.ok(ffRow && ffRow.ok, `Expected full ffmpeg check to pass: ${JSON.stringify(ffRow)}`);
});

test("workspace.mjs --ensure creates builds/, lab/, and seeds FINGERPRINTS.md", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sc-ws-"));
  try {
    const r = spawnSync(process.execPath, [path.join(SCRIPTS, "workspace.mjs"), "--ensure", "--json"], {
      cwd: tmp,
      env: { ...process.env, SCROLLCRAFT_HOME: path.join(tmp, "ws") },
      encoding: "utf8",
    });
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(r.stdout);
    assert.equal(out.seeded, true);
    assert.ok(fs.existsSync(out.builds));
    assert.ok(fs.existsSync(out.fingerprints));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("encode.mjs encodes desktop, mobile, and portrait clips with stripped audio and matching poster", () => {
  const ff = findFfmpeg();
  assert.ok(ff.full && ff.path, "Full ffmpeg build required for encoding test");
  const ffprobe = findFfprobe(ff.path);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sc-enc-"));
  try {
    const srcMp4 = path.join(tmp, "raw.mp4");
    const synth = spawnSync(ff.path, [
      "-y", "-hide_banner", "-loglevel", "error",
      "-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=24:duration=1.5",
      "-f", "lavfi", "-i", "sine=frequency=440:duration=1.5",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest",
      srcMp4,
    ], { encoding: "utf8" });
    assert.equal(synth.status, 0, synth.stderr);

    const desktopOut = path.join(tmp, "assets", "01.mp4");
    const posterExt = ff.hasLibwebp ? ".webp" : ".png";
    const posterOut = path.join(tmp, "assets", `01-poster${posterExt}`);
    const dRes = encodeClip({ input: srcMp4, output: desktopOut, mode: "desktop", poster: posterOut });
    assert.ok(fs.existsSync(desktopOut) && dRes.size > 1000);
    assert.ok(fs.existsSync(posterOut) && fs.statSync(posterOut).size > 200);
    assert.equal(dRes.gop, 8);
    assert.equal(dRes.overSquarespaceLimit, false);

    const mobileOut = path.join(tmp, "assets", "01-m.mp4");
    const mRes = encodeClip({ input: srcMp4, output: mobileOut, mode: "mobile" });
    assert.ok(fs.existsSync(mobileOut) && mRes.size > 1000);
    assert.equal(mRes.gop, 4);

    const portraitOut = path.join(tmp, "assets", "01-p.mp4");
    const pRes = encodeClip({ input: srcMp4, output: portraitOut, mode: "portrait", cropPortrait: true });
    assert.ok(fs.existsSync(portraitOut) && pRes.size > 1000);
    assert.equal(pRes.gop, 4);

    if (ffprobe) {
      const aProbe = spawnSync(ffprobe, [
        "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", desktopOut,
      ], { encoding: "utf8" });
      assert.equal(aProbe.stdout.trim(), "", "Audio stream must be stripped");

      const vProbe = spawnSync(ffprobe, [
        "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", portraitOut,
      ], { encoding: "utf8" });
      const [w, h] = vProbe.stdout.trim().split(",").map(Number);
      assert.equal(w, 720, `Expected portrait width 720, got ${w}`);
      assert.ok(h > w, `Expected portrait height > width, got ${w}x${h}`);
    }

    assert.throws(() => encodeClip({ input: srcMp4, output: desktopOut, crfArg: "abc" }), /crf must be an integer/);
    assert.throws(() => encodeClip({ input: srcMp4, output: desktopOut, mode: "4k" }), /Invalid mode/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
