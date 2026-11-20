# Deploying Scroll Craft to Squarespace 7.1

This guide documents **Squarespace-only deployment** (`/s/` static files +
Page Header Code Injection + Code Blocks) and dual-mode publishing (manual paste,
Squarespace MCP when connected, or authenticated browser push against `/config/pages`).

## Why standard scroll-video builds break on Squarespace

1. **Cross-origin `/s/` redirects without CORS:**
   Files uploaded to Squarespace `/s/<file>` redirect (`301`/`302`) to
   `https://static1.squarespace.com/...`, which usually omits
   `Access-Control-Allow-Origin` for custom domains (such as `https://example.com`).
   A `fetch()` -> `Blob` loader fails on custom domains.
   - **Solution:** `scrollcraft.js` supports `data-sc-load="direct"` (and automatic
     `direct-fallback` on non-HTTP CORS rejections over `http:`/`https:`), streaming
     dense-GOP `+faststart` clips directly via HTTP byte-range requests without
     requiring CORS, while preserving `file://` enforcement and HTTP 404 detection.
2. **Flat `/s/` namespace & 20 MB per-file cap:**
   Squarespace `/s/` has no folders and rejects files > 20 MB.
   - **Solution:** `scripts/squarespace-pack.mjs` flattens all asset filenames with a
     build-slug prefix into `upload-to-s/`, hashes every file (SHA-256), rewrites HTML
     and CSS URLs, and warns if any file exceeds 20 MB.
3. **Fluid Engine `overflow: hidden` breaking `position: sticky`:**
   Squarespace 7.1 wraps Code Blocks inside `.page-section`, `.content-wrapper`, and
   `.fluid-engine` containers that break `position: sticky` unless overridden.
   - **Solution:** `squarespace-pack.mjs` emits:
     - **Full-Bleed Blank Page Takeover** (`blank-page-head.html` + `blank-page-body.html`):
       Hides Squarespace header/footer and zeroes wrapper padding/overflow strictly under
       `body:not(.sqs-edit-mode-active)` so `/config/pages` remains editable.
     - **Scoped Fluid Engine Code Block** (`code-block-embed.html`):
       Scopes `scrollcraft.css` resets under `[data-sc-embed]`, overrides ancestor
       `overflow: visible` via `.page-section:has([data-sc-embed])`, and scopes
       `data-sc-drift` to the embed container so site chrome stays untouched.
     - **Iframe Embed** (`iframe-embed.html`):
       Full-viewport responsive wrapper if hosting the page standalone.

## Packaging Command

```bash
node plugins/nateherk-design/skills/scroll-craft/scripts/squarespace-pack.mjs \
  --in <workspace>/builds/<name> \
  --site https://example.com \
  --editor-url https://your-site.squarespace.com/config/pages
```

Add `--inline-engine` to inline `scrollcraft.css` and `scrollcraft.js` inside the
HTML snippets instead of uploading them to `/s/`.

## Publishing Workflow (Dual Mode)

1. **Verify locally first** (Step 5: `serve.mjs` + `shoot.mjs` desktop, mobile 390x844,
   and reduced motion).
2. **Pack the build** with `squarespace-pack.mjs` and check `squarespace/manifest.json`
   for zero `over20MB` or missing-asset warnings.
3. **Push via Squarespace MCP (when connected)** using `manifest.json`, **OR**
   **Push via Authenticated Browser Editor / Manual Paste**:
   - Sign in to your Squarespace editor (`/config/pages`).
   - Upload every file in `squarespace/upload-to-s/` via
     **Pages -> Not Linked -> + -> Link -> File** (published at `/s/<uploadFile>`).
   - Paste `blank-page-head.html` into **Page Settings -> Advanced -> Page Header Code Injection**
     and `blank-page-body.html` into a full-width **Code Block** (or paste
     `code-block-embed.html` into an existing Fluid Engine page section).
4. **Verify live:** confirm zero console errors, confirm every video paints with
   `data-sc-load-mode="direct"` (or `"direct-fallback"`), confirm pinned acts hold
   `position: sticky`, and verify on a real phone.
