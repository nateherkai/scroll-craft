#!/usr/bin/env node
/**
 * scroll-craft Squarespace packager (Squarespace-only /s/ + Code Injection + Embed modes).
 *
 * Converts a verified scroll-craft build directory into a deployment bundle ready
 * for either manual paste, a Squarespace MCP workflow, or authenticated browser
 * editor push against /config/pages.
 *
 * Usage:
 *   node squarespace-pack.mjs --in <buildDir> [--out <dir>] [--asset-base /s/]
 *                             [--prefix <slug->] [--site https://example.com]
 *                             [--editor-url https://your-site.squarespace.com/config/pages]
 *                             [--load direct|auto|blob] [--inline-engine]
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SQUARESPACE_LIMIT_BYTES = 20 * 1024 * 1024;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ENGINE = path.resolve(HERE, "..", "engine");

function parseArgs(argv) {
  const opts = {
    inDir: null,
    outDir: null,
    assetBase: "/s/",
    prefix: null,
    site: "https://example.com",
    editorUrl: "https://your-site.squarespace.com/config/pages",
    load: "direct",
    inlineEngine: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") { opts.help = true; return opts; }
    else if (a === "--in") opts.inDir = argv[++i];
    else if (a === "--out") opts.outDir = argv[++i];
    else if (a === "--asset-base") opts.assetBase = argv[++i];
    else if (a === "--prefix") opts.prefix = argv[++i];
    else if (a === "--site") opts.site = argv[++i];
    else if (a === "--editor-url") opts.editorUrl = argv[++i];
    else if (a === "--load") opts.load = argv[++i];
    else if (a === "--inline-engine") opts.inlineEngine = true;
    else throw new Error(`Unknown flag: ${a}`);
  }
  return opts;
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function isLocalAssetUrl(raw) {
  const s = (raw || "").trim();
  if (!s) return false;
  if (/^(?:https?:|data:|blob:|mailto:|tel:|javascript:|#|\/\/)/i.test(s)) return false;
  return true;
}

function sanitizeSlug(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function flattenAssetName(relPath, prefix, preserveBraces = false) {
  const clean = relPath
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "")
    .replace(/^assets\//, "");
  const pattern = preserveBraces ? /[^a-zA-Z0-9._\-\{\}]/g : /[^a-zA-Z0-9._-]/g;
  const flattened = clean.replace(/\//g, "-").replace(pattern, "-");
  return `${prefix}${flattened}`;
}

/**
 * Scope scrollcraft.css so it can safely mount inside a Squarespace Fluid Engine
 * Code Block (`[data-sc-embed]`) without resetting Squarespace's site chrome.
 */
export function scopeCssForEmbed(rawCss) {
  const splitMarker = "/* ----------------------------------------------------------- typography -- */";
  const idx = rawCss.indexOf(splitMarker);
  const head = idx > -1 ? rawCss.slice(0, idx) : rawCss;
  const tail = idx > -1 ? rawCss.slice(idx) : "";

  const scopedHead = head
    .replace(/:root\s*\{/g, "[data-sc-embed] {")
    .replace(/\*\s*,\s*\*::before\s*,\s*\*::after\s*\{/g, "[data-sc-embed], [data-sc-embed] *, [data-sc-embed] *::before, [data-sc-embed] *::after {")
    .replace(/(^|\n)html\s*\{[^}]*\}/g, "$1")
    .replace(/(^|\n)@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*html\s*\{[^}]*\}\s*\}/g, "$1")
    .replace(/(^|\n)body\s*\{/g, "$1[data-sc-embed] {")
    .replace(/(^|\n)img,\s*video,\s*canvas,\s*svg\s*\{/g, "$1[data-sc-embed] :is(img, video, canvas, svg) {")
    .replace(/(^|\n)button,\s*input,\s*select,\s*textarea\s*\{/g, "$1[data-sc-embed] :is(button, input, select, textarea) {")
    .replace(/(^|\n)::selection\s*\{/g, "$1[data-sc-embed] ::selection {")
    .replace(/(^|\n):focus-visible\s*\{/g, "$1[data-sc-embed] :focus-visible {")
    .replace(/(^|\n):where\(a\)\s*\{/g, "$1[data-sc-embed] :where(a) {")
    .replace(/@supports\s*\(scrollbar-color:\s*auto\)\s*\{[\s\S]*?\n\}/g, "");

  const sqsBridge = `
/* ---------------------------------------- Squarespace Fluid Engine bridge -- */
[data-sc-embed] {
  position: relative;
  width: 100%;
  isolation: isolate;
}
/* Preserve position:sticky inside Squarespace 7.1 Fluid Engine wrappers.
   overflow:hidden or overflow-x:hidden breaks sticky; visible/clip preserves it. */
.page-section:has([data-sc-embed]),
.page-section:has([data-sc-embed]) .content-wrapper,
.page-section:has([data-sc-embed]) .content,
.page-section:has([data-sc-embed]) .fluid-engine,
.page-section:has([data-sc-embed]) .sqs-block-code,
.page-section:has([data-sc-embed]) .sqs-block-content {
  overflow: visible !important;
}
body:not(.sqs-edit-mode-active) .page-section:has([data-sc-embed]) .content-wrapper {
  padding-inline: 0 !important;
  max-width: none !important;
}
`;

  return `${scopedHead}${tail}\n${sqsBridge}`;
}

function scopeInlineStyleForEmbed(styleText) {
  return styleText
    .replace(/:root\s*\{/g, "[data-sc-embed] {")
    .replace(/(^|[}\s])body\s*\{/g, "$1[data-sc-embed] {");
}

function buildBlankPageResetCss() {
  return `/* Scrollcraft Blank Page takeover for Squarespace 7.1.
   Guarded by body:not(.sqs-edit-mode-active) so /config/pages stays editable. */
body:not(.sqs-edit-mode-active) #header,
body:not(.sqs-edit-mode-active) header.Header,
body:not(.sqs-edit-mode-active) #footer-sections,
body:not(.sqs-edit-mode-active) footer.Footer,
body:not(.sqs-edit-mode-active) .sqs-announcement-bar-dropzone {
  display: none !important;
}
body:not(.sqs-edit-mode-active) #siteWrapper,
body:not(.sqs-edit-mode-active) #page,
body:not(.sqs-edit-mode-active) #sections,
body:not(.sqs-edit-mode-active) .page-section,
body:not(.sqs-edit-mode-active) .page-section .content-wrapper,
body:not(.sqs-edit-mode-active) .page-section .content,
body:not(.sqs-edit-mode-active) .fluid-engine,
body:not(.sqs-edit-mode-active) .sqs-block-code,
body:not(.sqs-edit-mode-active) .sqs-block-content {
  overflow: visible !important;
  padding: 0 !important;
  margin: 0 !important;
  max-width: none !important;
  width: 100% !important;
}
body:not(.sqs-edit-mode-active) {
  overflow-x: clip !important;
}`;
}

export function packSquarespace(rawOpts) {
  const opts = {
    assetBase: "/s/",
    site: "https://example.com",
    editorUrl: "https://your-site.squarespace.com/config/pages",
    load: "direct",
    inlineEngine: false,
    ...rawOpts,
  };

  if (!opts.inDir) {
    throw new Error("usage: node squarespace-pack.mjs --in <buildDir> [--out <dir>] [--asset-base /s/] [--prefix <slug->]");
  }
  if (!["direct", "auto", "blob"].includes(opts.load)) {
    throw new Error(`Invalid --load mode "${opts.load}". Expected direct, auto, or blob.`);
  }

  const inDir = path.resolve(opts.inDir);
  const indexPath = path.join(inDir, "index.html");
  if (!fs.existsSync(indexPath)) throw new Error(`index.html not found in ${inDir}`);

  const outDir = path.resolve(opts.outDir || path.join(inDir, "squarespace"));
  const uploadDir = path.join(outDir, "upload-to-s");
  fs.mkdirSync(uploadDir, { recursive: true });

  const assetBase = opts.assetBase.endsWith("/") ? opts.assetBase : `${opts.assetBase}/`;
  const prefix = opts.prefix !== null && opts.prefix !== undefined
    ? opts.prefix
    : `${sanitizeSlug(path.basename(inDir)) || "sc"}-`;

  const html = fs.readFileSync(indexPath, "utf8");
  const engineCssPath = fs.existsSync(path.join(inDir, "scrollcraft.css"))
    ? path.join(inDir, "scrollcraft.css")
    : path.join(SKILL_ENGINE, "scrollcraft.css");
  const engineJsPath = fs.existsSync(path.join(inDir, "scrollcraft.js"))
    ? path.join(inDir, "scrollcraft.js")
    : path.join(SKILL_ENGINE, "scrollcraft.js");

  const engineCss = fs.readFileSync(engineCssPath, "utf8");
  const engineJs = fs.readFileSync(engineJsPath, "utf8");
  const embedCss = scopeCssForEmbed(engineCss);

  // Track uploaded files cleanly with collision checking.
  const uploadMap = new Map(); // absSource -> { sourceRel, uploadFile, publicPath, bytes, sha256, over20MB }
  const usedFlatNames = new Map(); // uploadFile -> absSource
  const missingAssets = [];

  function registerAsset(rawUrl) {
    const cleanRel = rawUrl.split(/[?#]/)[0].trim();
    const abs = path.resolve(inDir, cleanRel);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      missingAssets.push(rawUrl);
      return rawUrl;
    }
    if (uploadMap.has(abs)) return uploadMap.get(abs).publicPath;

    let flatName = flattenAssetName(cleanRel, prefix);
    if (usedFlatNames.has(flatName) && usedFlatNames.get(flatName) !== abs) {
      const ext = path.extname(flatName);
      const base = flatName.slice(0, -ext.length);
      let n = 2;
      while (usedFlatNames.has(`${base}-${n}${ext}`)) n++;
      flatName = `${base}-${n}${ext}`;
    }
    usedFlatNames.set(flatName, abs);

    const dest = path.join(uploadDir, flatName);
    fs.copyFileSync(abs, dest);
    const bytes = fs.statSync(dest).size;
    const rec = {
      source: path.relative(inDir, abs).replace(/\\/g, "/"),
      uploadFile: flatName,
      publicPath: `${assetBase}${flatName}`,
      bytes,
      sha256: sha256File(dest),
      over20MB: bytes > SQUARESPACE_LIMIT_BYTES,
    };
    uploadMap.set(abs, rec);
    return rec.publicPath;
  }

  function registerGeneratedAsset(flatName, content) {
    const dest = path.join(uploadDir, flatName);
    fs.writeFileSync(dest, content, "utf8");
    const bytes = fs.statSync(dest).size;
    const rec = {
      source: `(generated) ${flatName}`,
      uploadFile: flatName,
      publicPath: `${assetBase}${flatName}`,
      bytes,
      sha256: sha256File(dest),
      over20MB: bytes > SQUARESPACE_LIMIT_BYTES,
    };
    uploadMap.set(dest, rec);
    return rec.publicPath;
  }

  function rewriteHtmlAssets(snippet) {
    // 1. Standard single-URL attributes (excluding engine scripts/stylesheets handled separately)
    let out = snippet.replace(
      /\b(src|poster|data-sc-src|data-sc-src-mobile|href)=(["'])([^"']+)\2/gi,
      (full, attr, q, val) => {
        if (!isLocalAssetUrl(val)) return full;
        if (/scrollcraft\.(?:css|js)(?:[?#].*)?$/i.test(val)) return full;
        if (attr.toLowerCase() === "href" && !/\.(?:css|png|jpg|jpeg|webp|svg|ico|woff2?|mp4|webm|pdf)(?:[?#].*)?$/i.test(val)) {
          return full;
        }
        return `${attr}=${q}${registerAsset(val)}${q}`;
      }
    );

    // 2. srcset lists
    out = out.replace(/\bsrcset=(["'])([^"']+)\1/gi, (full, q, list) => {
      const rewritten = list
        .split(",")
        .map((entry) => {
          const parts = entry.trim().split(/\s+/);
          if (!parts[0] || !isLocalAssetUrl(parts[0])) return entry.trim();
          parts[0] = registerAsset(parts[0]);
          return parts.join(" ");
        })
        .join(", ");
      return `srcset=${q}${rewritten}${q}`;
    });

    // 3. CSS url(...)
    out = out.replace(/url\((['"]?)([^)'"]+)\1\)/gi, (full, q, val) => {
      if (!isLocalAssetUrl(val)) return full;
      return `url(${q}${registerAsset(val)}${q})`;
    });

    // 4. data-sc-sequence="path/{i}.webp:count:start"
    out = out.replace(/\bdata-sc-sequence=(["'])([^"']+)\1/gi, (full, q, spec) => {
      const parts = spec.split(":");
      const tpl = parts[0];
      const count = parseInt(parts[1], 10) || 0;
      const start = parseInt(parts[2], 10) || 0;
      if (!isLocalAssetUrl(tpl) || count <= 0) return full;
      for (let i = 0; i < count; i++) {
        const frameRel = tpl
          .replace("{i}", String(start + i))
          .replace("{ii}", String(start + i).padStart(2, "0"))
          .replace("{iii}", String(start + i).padStart(3, "0"))
          .replace("{iiii}", String(start + i).padStart(4, "0"));
        registerAsset(frameRel);
      }
      const flatTpl = `${assetBase}${flattenAssetName(tpl, prefix, true)}`;
      parts[0] = flatTpl;
      return `data-sc-sequence=${q}${parts.join(":")}${q}`;
    });

    return out;
  }

  // Extract head pieces (fonts, external links, brand styles) and body content.
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const rawHead = headMatch ? headMatch[1] : "";
  const rawBody = bodyMatch ? bodyMatch[1] : html;

  // Keep font/preconnect links & author <style> blocks; drop meta/title/icon/scrollcraft.css link
  const fontLinks = [...rawHead.matchAll(/<link\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((tag) => !/scrollcraft\.css/i.test(tag) && !/rel=["']icon["']/i.test(tag));

  const authorStyles = [...rawHead.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((m) => rewriteHtmlAssets(m[1].trim()));

  // Strip engine <script src="...scrollcraft.js"> and ScrollCraft.mount(...) from body so we emit clean mounting.
  let cleanBody = rawBody
    .replace(/<script\b[^>]*src=["'][^"']*scrollcraft\.js["'][^>]*>\s*<\/script>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?ScrollCraft\.mount\([\s\S]*?<\/script>/gi, "")
    .trim();

  cleanBody = rewriteHtmlAssets(cleanBody);

  // Register engine files for /s/ (unless --inline-engine is set).
  const cssUrl = opts.inlineEngine ? null : registerGeneratedAsset(`${prefix}scrollcraft.css`, engineCss);
  const embedCssUrl = opts.inlineEngine ? null : registerGeneratedAsset(`${prefix}scrollcraft-embed.css`, embedCss);
  const jsUrl = opts.inlineEngine ? null : registerGeneratedAsset(`${prefix}scrollcraft.js`, engineJs);

  // 1. Full-bleed Blank Page takeover: Head Injection + Code Block Body
  const blankHeadParts = [
    "<!-- Paste into Squarespace Page Settings -> Advanced -> Page Header Code Injection -->",
    ...fontLinks,
    cssUrl
      ? `<link rel="stylesheet" href="${cssUrl}">`
      : `<style data-sc-engine>\n${engineCss}\n</style>`,
    `<style data-sc-sqs-blank>\n${buildBlankPageResetCss()}\n</style>`,
    ...authorStyles.map((css) => `<style data-sc-brand>\n${css}\n</style>`),
  ];
  const blankHeadHtml = blankHeadParts.join("\n") + "\n";

  const blankBodyParts = [
    "<!-- Paste into a single full-width Squarespace Code Block on the Blank Page -->",
    `<div data-sc-sqs-page data-sc-load="${opts.load}">`,
    cleanBody,
    "</div>",
    jsUrl
      ? `<script src="${jsUrl}"></script>`
      : `<script data-sc-engine>\n${engineJs}\n</script>`,
    `<script>if(window.ScrollCraft){ScrollCraft.mount(document.body,{load:${JSON.stringify(opts.load)}});}</script>`,
  ];
  const blankBodyHtml = blankBodyParts.join("\n") + "\n";

  // 2. Scoped Fluid Engine Code Block embed (leaves Squarespace header/footer/page chrome intact)
  const embedId = `sc-embed-${sanitizeSlug(path.basename(inDir)) || "stage"}`;
  const scopedStyles = authorStyles.map(scopeInlineStyleForEmbed);
  const codeBlockParts = [
    "<!-- Paste into a Squarespace Code Block inside an existing Fluid Engine page -->",
    ...fontLinks,
    embedCssUrl
      ? `<link rel="stylesheet" href="${embedCssUrl}">`
      : `<style data-sc-engine-embed>\n${embedCss}\n</style>`,
    ...scopedStyles.map((css) => `<style data-sc-brand-embed>\n${css}\n</style>`),
    `<div id="${embedId}" data-sc-embed data-sc-load="${opts.load}">`,
    cleanBody,
    "</div>",
    jsUrl
      ? `<script src="${jsUrl}"></script>`
      : `<script data-sc-engine>\n${engineJs}\n</script>`,
    `<script>(function(){var r=document.getElementById(${JSON.stringify(embedId)});if(r&&window.ScrollCraft){ScrollCraft.mount(r,{load:${JSON.stringify(opts.load)}});}})();</script>`,
  ];
  const codeBlockHtml = codeBlockParts.join("\n") + "\n";

  // 3. Responsive full-viewport iframe wrapper (for external or standalone HTML page embed)
  const titleMatch = rawHead.match(/<title>([\s\S]*?)<\/title>/i);
  const pageTitle = (titleMatch ? titleMatch[1].trim() : "Scrollcraft Experience").replace(/"/g, "&quot;");
  const iframeHtml = [
    "<!-- Paste into a Squarespace Code Block when hosting the full Scrollcraft page at a standalone URL -->",
    `<div style="position:relative;width:100%;height:100vh;height:100svh;overflow:hidden;">`,
    `  <iframe src="${opts.site}/" title="${pageTitle}" loading="eager" allow="autoplay; fullscreen" style="border:0;width:100%;height:100%;display:block;"></iframe>`,
    `</div>`,
    "",
  ].join("\n");

  fs.writeFileSync(path.join(outDir, "blank-page-head.html"), blankHeadHtml, "utf8");
  fs.writeFileSync(path.join(outDir, "blank-page-body.html"), blankBodyHtml, "utf8");
  fs.writeFileSync(path.join(outDir, "code-block-embed.html"), codeBlockHtml, "utf8");
  fs.writeFileSync(path.join(outDir, "iframe-embed.html"), iframeHtml, "utf8");

  const uploads = [...uploadMap.values()];
  const overLimit = uploads.filter((u) => u.over20MB);
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    target: {
      siteUrl: opts.site,
      editorUrl: opts.editorUrl,
      assetBase,
      loadMode: opts.load,
      inlineEngine: opts.inlineEngine,
      corsNote:
        "Squarespace /s/ static files redirect to static1.squarespace.com without Access-Control-Allow-Origin headers. data-sc-load='direct' bypasses cross-origin fetch() Blob loading and streams dense-GOP +faststart clips via byte-range requests.",
    },
    modes: {
      blankPageTakeover: {
        headInjectionFile: "blank-page-head.html",
        codeBlockFile: "blank-page-body.html",
        preservesEditorChrome: true,
      },
      scopedCodeBlock: {
        codeBlockFile: "code-block-embed.html",
        mountSelector: `#${embedId}`,
      },
      iframeEmbed: {
        codeBlockFile: "iframe-embed.html",
      },
    },
    pushWorkflows: {
      manual: "Upload upload-to-s/* via Squarespace Link Editor -> File (maps to /s/<filename>), then paste blank-page-head.html + blank-page-body.html OR code-block-embed.html.",
      squarespaceMcp: "If a Squarespace MCP server is configured, upload manifest.uploads[] to static files and apply modes.blankPageTakeover or modes.scopedCodeBlock to the target page.",
      browserEditor: `Open ${opts.editorUrl} in an authenticated browser session, upload upload-to-s/* to /s/, inject the HTML snippets, save, and verify desktop + mobile + reduced-motion.`,
    },
    uploads,
    warnings: [
      ...overLimit.map((u) => `${u.uploadFile} is ${(u.bytes / (1024 * 1024)).toFixed(2)} MB (exceeds Squarespace 20 MB /s/ limit)`),
      ...missingAssets.map((m) => `Referenced local asset not found in build folder: ${m}`),
    ],
  };

  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

  return { outDir, uploadDir, manifest };
}

// ------------------------------------------------------------------- cli ----
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    const opts = parseArgs(process.argv.slice(2));
    if (opts.help) {
      console.log(`usage: node squarespace-pack.mjs --in <buildDir> [--out <dir>] [--asset-base /s/] [--prefix <slug->] [--site https://example.com] [--editor-url <url>] [--load direct|auto|blob] [--inline-engine]`);
      process.exit(0);
    }
    const { outDir, manifest } = packSquarespace(opts);
    console.log(`squarespace bundle: ${outDir}`);
    console.log(`  uploads (${manifest.uploads.length}): ${path.join(outDir, "upload-to-s")}`);
    console.log(`  modes: blank-page-head.html + blank-page-body.html | code-block-embed.html | iframe-embed.html`);
    if (manifest.warnings.length) {
      for (const w of manifest.warnings) console.error(`WARN: ${w}`);
    }
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    process.exit(1);
  }
}
