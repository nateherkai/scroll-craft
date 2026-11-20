// Live headless Chrome E2E verification:
//   - serve.mjs loopback default, HTTP 206 Range, sibling traversal 403, dotfile 403, malformed URL 400
//   - same-origin Blob scrub + mount()/destroy() teardown regression (issue #6)
//   - cross-origin non-CORS Squarespace /s/ direct-fallback & direct load modes
//   - HTTP 404 non-masking in auto mode
//   - scoped Squarespace Fluid Engine Code Block sticky preservation + isolated drift
//   - real shoot.mjs desktop, mobile (390x844), and reduced-motion passes writing report.json + sheet.png
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILL = path.join(REPO, "plugins", "nateherk-design", "skills", "scroll-craft");
const SCRIPTS = path.join(SKILL, "scripts");
const ENGINE = path.join(SKILL, "engine");

const { findFfmpeg, findChrome, resolvePlaywright } = await import(
  new URL("../plugins/nateherk-design/skills/scroll-craft/scripts/ffmpeg.mjs", import.meta.url)
);
const { encodeClip } = await import(
  new URL("../plugins/nateherk-design/skills/scroll-craft/scripts/encode.mjs", import.meta.url)
);
const { packSquarespace } = await import(
  new URL("../plugins/nateherk-design/skills/scroll-craft/scripts/squarespace-pack.mjs", import.meta.url)
);

function startServe(rootDir, extraArgs = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(SCRIPTS, "serve.mjs"), "--root", rootDir, "--port", "0", ...extraArgs], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    const timer = setTimeout(() => { child.kill(); reject(new Error(`serve.mjs timeout: ${err}`)); }, 8000);
    child.stdout.on("data", (d) => {
      out += d.toString();
      const m = out.match(/http:\/\/[^\s:]+:(\d+)/);
      if (m) {
        clearTimeout(timer);
        resolve({ child, port: Number(m[1]), url: `http://127.0.0.1:${m[1]}` });
      }
    });
    child.stderr.on("data", (d) => { err += d.toString(); });
    child.on("exit", (code) => {
      clearTimeout(timer);
      if (!out.includes("http://")) reject(new Error(`serve.mjs exited ${code}: ${err}`));
    });
  });
}

function stopChild(child) {
  return new Promise((resolve) => {
    if (!child || child.killed || child.exitCode !== null) { resolve(); return; }
    child.once("exit", () => resolve());
    child.kill();
    setTimeout(() => resolve(), 1500);
  });
}

function rawGet(port, reqPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port, path: reqPath }, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on("error", reject);
    req.end();
  });
}

test("serve.mjs serves HTTP 206 byte ranges and blocks sibling traversal, dotfiles, and malformed URLs (issue #9)", async () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "sc-srv-"));
  const rootDir = path.join(parent, "acme");
  const siblingDir = path.join(parent, "acme-v2");
  fs.mkdirSync(rootDir, { recursive: true });
  fs.mkdirSync(siblingDir, { recursive: true });
  const srv = await startServe(rootDir);
  try {
    const payload = Buffer.from("0123456789abcdefghijklmnopqrstuvwxyz");
    fs.writeFileSync(path.join(rootDir, "sample.mp4"), payload);
    fs.writeFileSync(path.join(rootDir, ".env"), "SECRET=1");
    fs.writeFileSync(path.join(siblingDir, "secret.txt"), "sibling");

    const rRange = await fetch(`${srv.url}/sample.mp4`, { headers: { Range: "bytes=4-13" } });
    assert.equal(rRange.status, 206);
    assert.equal(rRange.headers.get("content-range"), `bytes 4-13/${payload.length}`);
    assert.equal(await rRange.text(), "456789abcd");

    assert.equal(await rawGet(srv.port, "/..%2facme-v2/secret.txt"), 403, "Sibling dir traversal must be 403");
    assert.equal(await rawGet(srv.port, "/.env"), 403, "Dotfile must be 403");
    assert.equal(await rawGet(srv.port, "/%E0%A4%A"), 400, "Malformed percent encoding must return 400 without crashing");

    // Confirm server stayed alive after malformed URL
    const alive = await fetch(`${srv.url}/sample.mp4`, { method: "HEAD" });
    assert.equal(alive.status, 200);
  } finally {
    await stopChild(srv.child);
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

const chromePath = findChrome();
const pwLookup = resolvePlaywright(REPO, SCRIPTS);
const ff = findFfmpeg();
const skipE2E = !chromePath || !pwLookup.mod || !ff.full;

test("real headless Chrome: Blob scrub, mount/destroy teardown, non-CORS Squarespace /s/ fallback, Fluid Engine sticky embed & shoot.mjs", { skip: skipE2E ? "requires Chrome, playwright-core, and full ffmpeg" : false }, async () => {
  const { chromium } = pwLookup.mod;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sc-e2e-"));
  const buildDir = path.join(tmp, "demo-e2e");
  const cdnDir = path.join(tmp, "static1-nocors");
  fs.mkdirSync(path.join(buildDir, "assets"), { recursive: true });
  fs.mkdirSync(cdnDir, { recursive: true });

  const rawMp4 = path.join(tmp, "raw.mp4");
  const synth = spawnSync(ff.path, [
    "-y", "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=24:duration=2",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", rawMp4,
  ], { encoding: "utf8" });
  assert.equal(synth.status, 0, synth.stderr);

  const posterExt = ff.hasLibwebp ? ".webp" : ".png";
  const clipDesktop = path.join(buildDir, "assets", "01.mp4");
  const posterDesktop = path.join(buildDir, "assets", `01-poster${posterExt}`);
  encodeClip({ input: rawMp4, output: clipDesktop, mode: "desktop", crfArg: "26", poster: posterDesktop });

  fs.copyFileSync(path.join(ENGINE, "scrollcraft.css"), path.join(buildDir, "scrollcraft.css"));
  fs.copyFileSync(path.join(ENGINE, "scrollcraft.js"), path.join(buildDir, "scrollcraft.js"));
  fs.copyFileSync(clipDesktop, path.join(cdnDir, "01.mp4"));

  const mainHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Scrollcraft E2E</title>
  <link rel="stylesheet" href="scrollcraft.css">
  <style>
    :root { --sc-canvas: #0b0d12; --sc-ink: #f4f2ef; --sc-accent: #d8ff3e; }
    .card { padding: 4rem; background: #141822; }
  </style>
</head>
<body>
  <main>
    <section id="act-hero" data-sc-act="scrub" data-sc-span="2.4" data-sc-drift="#0b0d12">
      <div data-sc-stage>
        <img class="sc-stage__poster" src="assets/01-poster${posterExt}" alt="">
        <video data-sc-scrub data-sc-src="assets/01.mp4" muted playsinline></video>
        <div class="sc-scrim sc-scrim--lead" aria-hidden="true"></div>
        <div class="sc-copy sc-copy--lead" data-sc-cue="0 0.85 0">
          <h1 class="sc-display sc-display--xl">Scroll moves time.</h1>
        </div>
      </div>
    </section>
    <section id="act-close" data-sc-act="pin" data-sc-span="1.4" data-sc-drift="#161b26">
      <div data-sc-stage class="card">
        <div class="sc-copy sc-copy--center" data-sc-cue="0.08">
          <h2 class="sc-display sc-display--lg">Resolved hold.</h2>
        </div>
      </div>
    </section>
  </main>
  <script src="scrollcraft.js"></script>
  <script>window.__scApi = ScrollCraft.mount(document.body);</script>
</body>
</html>`;
  fs.writeFileSync(path.join(buildDir, "index.html"), mainHtml, "utf8");

  const mainSrv = await startServe(buildDir);
  const nocorsSrv = await startServe(cdnDir);
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });

  try {
    // 1. Same-origin Blob scrub + mount()/destroy() teardown regression (issue #6)
    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.goto(mainSrv.url, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("html.sc-ready", { timeout: 10000 });
      await page.waitForSelector("video.sc-has-clip", { timeout: 10000 });
      const before = await page.evaluate(() => {
        const v = document.querySelector("video");
        return { mode: v.dataset.scLoadMode, t: v.currentTime, instances: ScrollCraft.instances.length };
      });
      assert.equal(before.mode, "blob");
      assert.equal(before.instances, 1);

      await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }));
      await page.waitForTimeout(700);
      const after = await page.evaluate(() => document.querySelector("video").currentTime);
      assert.ok(after > before.t + 0.1, `Expected blob video to advance on scroll (${before.t} -> ${after})`);

      // Verify idempotent destroy() tears down instance, sc-ready, and video src cleanly
      const destroyed = await page.evaluate(() => {
        window.__scApi.destroy();
        window.__scApi.destroy(); // idempotent second call
        const v = document.querySelector("video");
        return {
          instances: ScrollCraft.instances.length,
          readyClass: document.documentElement.classList.contains("sc-ready"),
          hasSrcAttr: v.hasAttribute("src"),
        };
      });
      assert.equal(destroyed.instances, 0);
      assert.equal(destroyed.readyClass, false);
      assert.equal(destroyed.hasSrcAttr, false);
      assert.deepEqual(errors, []);
      await page.close();
    }

    // 2. Cross-origin non-CORS Squarespace /s/ simulation: auto -> direct-fallback, explicit direct, and 404 non-masking
    const fallbackHtml = mainHtml.replace('data-sc-src="assets/01.mp4"', `data-sc-src="${nocorsSrv.url}/01.mp4"`);
    fs.writeFileSync(path.join(buildDir, "cors-fallback.html"), fallbackHtml, "utf8");
    const directHtml = fallbackHtml.replace("window.__scApi = ScrollCraft.mount(document.body);", 'window.__scApi = ScrollCraft.mount(document.body, { load: "direct" });');
    fs.writeFileSync(path.join(buildDir, "cors-direct.html"), directHtml, "utf8");
    const missing404Html = mainHtml.replace('data-sc-src="assets/01.mp4"', 'data-sc-src="assets/does-not-exist.mp4"');
    fs.writeFileSync(path.join(buildDir, "missing-404.html"), missing404Html, "utf8");

    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await page.goto(`${mainSrv.url}/cors-fallback.html`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("video.sc-has-clip", { timeout: 10000 });
      const mode = await page.evaluate(() => document.querySelector("video").dataset.scLoadMode);
      assert.equal(mode, "direct-fallback", "Cross-origin non-CORS clip must fall back cleanly in auto mode");
      await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }));
      await page.waitForTimeout(700);
      const t = await page.evaluate(() => document.querySelector("video").currentTime);
      assert.ok(t > 0.15, `Expected direct-fallback clip to scrub on scroll, got ${t}`);
      await page.close();
    }

    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const consoleErrors = [];
      page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
      await page.goto(`${mainSrv.url}/cors-direct.html`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("video.sc-has-clip", { timeout: 10000 });
      const state = await page.evaluate(() => {
        const mode = document.querySelector("video").dataset.scLoadMode;
        window.__scApi.destroy();
        return { mode, hasSrcAfterDestroy: document.querySelector("video").hasAttribute("src") };
      });
      assert.equal(state.mode, "direct");
      assert.equal(state.hasSrcAfterDestroy, false, "destroy() must also detach direct-stream video src");
      assert.deepEqual(consoleErrors, [], `Explicit direct mode must produce zero CORS console errors: ${consoleErrors.join(" | ")}`);
      await page.close();
    }

    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await page.goto(`${mainSrv.url}/missing-404.html`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("html.sc-ready", { timeout: 10000 });
      await page.waitForTimeout(600);
      const state = await page.evaluate(() => {
        const v = document.querySelector("video");
        return { mode: v.dataset.scLoadMode || null, painted: v.classList.contains("sc-has-clip") };
      });
      assert.equal(state.mode, null, "HTTP 404 must not mask failure with direct-fallback");
      assert.equal(state.painted, false);
      await page.close();
    }

    // 3. Scoped Squarespace Fluid Engine embed inside overflow:hidden wrappers
    const packed = packSquarespace({
      inDir: buildDir,
      outDir: path.join(buildDir, "sqs-out"),
      assetBase: "/sqs-out/upload-to-s/",
      inlineEngine: false,
    });
    const codeBlockSnippet = fs.readFileSync(path.join(packed.outDir, "code-block-embed.html"), "utf8");
    const sqsHostHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Simulated Squarespace 7.1 Host</title>
  <style>
    body { margin: 24px; background: rgb(245, 244, 240); color: rgb(20, 20, 20); font-family: Georgia, serif; }
    #header { height: 80px; background: rgb(30, 30, 30); color: white; }
    .page-section, .content-wrapper, .content, .fluid-engine, .sqs-block-code, .sqs-block-content { overflow: hidden; }
  </style>
</head>
<body>
  <header id="header">SQS Site Header</header>
  <section class="page-section">
    <div class="content-wrapper">
      <div class="content">
        <div class="fluid-engine">
          <div class="sqs-block-code">
            <div class="sqs-block-content">
              ${codeBlockSnippet}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  <footer id="footer-sections" style="height: 200px;">SQS Footer</footer>
</body>
</html>`;
    fs.writeFileSync(path.join(buildDir, "sqs-embed-test.html"), sqsHostHtml, "utf8");

    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await page.goto(`${mainSrv.url}/sqs-embed-test.html`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("video.sc-has-clip", { timeout: 10000 });
      await page.evaluate(() => window.scrollTo({ top: 500, behavior: "instant" }));
      await page.waitForTimeout(300);

      const sqsCheck = await page.evaluate(() => {
        const stage = document.querySelector("#act-hero .sc-stage");
        const header = document.getElementById("header");
        const embed = document.querySelector("[data-sc-embed]");
        return {
          stagePos: getComputedStyle(stage).position,
          stageTop: Math.round(stage.getBoundingClientRect().top),
          bodyBg: getComputedStyle(document.body).backgroundColor,
          headerVisible: getComputedStyle(header).display !== "none",
          htmlDrift: document.documentElement.style.getPropertyValue("--sc-canvas").trim(),
          embedDrift: embed.style.getPropertyValue("--sc-canvas").trim(),
        };
      });

      assert.equal(sqsCheck.stagePos, "sticky");
      assert.equal(sqsCheck.stageTop, 0, `Stage failed to pin inside Squarespace wrapper (top=${sqsCheck.stageTop})`);
      assert.equal(sqsCheck.bodyBg, "rgb(245, 244, 240)", "Scoped embed must not clobber Squarespace body background");
      assert.equal(sqsCheck.headerVisible, true, "Scoped embed must preserve Squarespace site header");
      assert.equal(sqsCheck.htmlDrift, "", "Scoped embed drift must not write --sc-canvas onto <html>");
      assert.ok(sqsCheck.embedDrift.length > 0, "Scoped embed drift must write --sc-canvas onto [data-sc-embed]");
      await page.close();
    }

    // 4. Real shoot.mjs verification passes: desktop, mobile (390x844), and reduced-motion
    const shootRuns = [
      { name: "shots", args: ["--steps", "4"] },
      { name: "mobile", args: ["--width", "390", "--height", "844", "--steps", "4"] },
      { name: "reduced", args: ["--reduced-motion", "--steps", "4"] },
    ];
    for (const run of shootRuns) {
      const out = path.join(tmp, "lab", run.name);
      const shootRes = spawnSync(process.execPath, [
        path.join(SCRIPTS, "shoot.mjs"),
        "--url", mainSrv.url,
        "--out", out,
        ...run.args,
      ], {
        cwd: REPO,
        env: { ...process.env, SCROLLCRAFT_PLAYWRIGHT: process.env.SCROLLCRAFT_PLAYWRIGHT || "" },
        encoding: "utf8",
      });
      assert.equal(shootRes.status, 0, `${run.name}: ${shootRes.stderr || shootRes.stdout}`);
      assert.ok(fs.existsSync(path.join(out, "report.json")), `${run.name}: shoot.mjs must write report.json`);
      assert.ok(fs.existsSync(path.join(out, "sheet.png")), `${run.name}: shoot.mjs must write contact sheet sheet.png`);
      assert.doesNotMatch(shootRes.stdout, /FROZEN CLIP/, `${run.name}: unexpected FROZEN CLIP`);
      assert.doesNotMatch(shootRes.stdout, /DEAD SCROLL/, `${run.name}: unexpected DEAD SCROLL`);
    }
  } finally {
    await browser.close();
    await stopChild(mainSrv.child);
    await stopChild(nocorsSrv.child);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
