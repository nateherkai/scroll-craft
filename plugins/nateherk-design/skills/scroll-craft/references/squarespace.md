# Squarespace Deployment (Squarespace-Only `/s/` + Code Injection + Embeds)

This reference covers deploying a verified `scroll-craft` build to Squarespace 7.1
using **Squarespace-only hosting** (`/s/` static files + Page Header Code Injection
+ Code Blocks) and supports dual-mode delivery: deterministic bundle generation
plus Squarespace MCP or authenticated browser push against `/config/pages`.

---

## 1. The three Squarespace 7.1 constraints (and how scroll-craft handles them)

1. **`/s/` redirect & CORS (`static1.squarespace.com`):**
   Files uploaded via Squarespace Link Editor are served at `https://<domain>/s/<file>`,
   which HTTP 301/302 redirects to `https://static1.squarespace.com/...` without
   `Access-Control-Allow-Origin` headers for custom domains. Upstream `fetch()` → `Blob`
   loading fails silently with a CORS error on custom domains.
   - **Fix in engine:** `scrollcraft.js` supports `data-sc-load="direct"` (and automatic
     `direct-fallback` on non-HTTP CORS rejections over `http(s):`) so dense-GOP,
     `+faststart` `.mp4` clips stream cleanly via HTTP byte-range requests with zero CORS
     errors. `squarespace-pack.mjs` sets `load: "direct"` by default for `/s/`.
   - **Alternative when video is not needed:** `data-sc-sequence` (WebP frames drawn via
     `new Image()` without `crossOrigin`) also works from `/s/` without CORS.
2. **Flat `/s/` namespace & 20 MB per-file cap:**
   Squarespace `/s/` has no subdirectories and rejects files larger than **20 MB**.
   `squarespace-pack.mjs` flattens all asset paths with a build-slug prefix
   (e.g. `assets/01.mp4` -> `/s/<slug>-01.mp4`), copies them into `upload-to-s/`,
   hashes every file (SHA-256), and warns if any file exceeds 20 MB.
3. **Fluid Engine `overflow: hidden` breaking `position: sticky` & global CSS resets:**
   - **Full-Bleed Blank Page Takeover (`blank-page-head.html` + `blank-page-body.html`):**
     Hides Squarespace's site header/footer and zeroes Fluid Engine padding/overflow
     under `body:not(.sqs-edit-mode-active)` so `/config/pages` remains fully editable.
   - **Scoped Code Block Embed (`code-block-embed.html`):**
     Derives a scoped stylesheet (`scrollcraft-embed.css`) under `[data-sc-embed]` so
     `scrollcraft.css` resets never touch Squarespace's navigation or footer, adds
     `.page-section:has([data-sc-embed]) ... { overflow: visible !important; }` to
     preserve `position: sticky`, and scopes `data-sc-drift` to the embed container.
   - **Iframe Embed (`iframe-embed.html`):**
     Responsive `100svh` wrapper for embedding a standalone hosted Scrollcraft page.

---

## 2. Pack a verified build for Squarespace

Run Step 5 local verification first (`serve.mjs` + `shoot.mjs`). Once green:

```bash
node <skill>/scripts/squarespace-pack.mjs \
  --in <workspace>/builds/<name> \
  --site https://example.com \
  --editor-url https://your-site.squarespace.com/config/pages
```

Options:
- `--out <dir>`: output directory (default `<buildDir>/squarespace`)
- `--asset-base /s/`: public prefix for uploaded assets (default `/s/`)
- `--prefix <slug->`: flat filename prefix to avoid `/s/` collisions
- `--load direct|auto|blob`: video loader mode (default `direct` for `/s/`)
- `--inline-engine`: inline `scrollcraft.css` and `scrollcraft.js` into the HTML snippets
  instead of uploading them to `/s/`

Generated bundle:
- `upload-to-s/`: exact flat files to upload to Squarespace `/s/`
- `blank-page-head.html` + `blank-page-body.html`: Full-Bleed Blank Page takeover
- `code-block-embed.html`: Scoped Fluid Engine Code Block embed
- `iframe-embed.html`: Responsive full-viewport iframe wrapper
- `manifest.json`: Upload list (byte sizes, SHA-256, 20 MB check), injection slots,
  and push instructions for manual, MCP, or browser workflows

---

## 3. Dual-mode push workflow

### Mode A: Squarespace MCP (when a Squarespace MCP server is connected)
Check connected MCP servers first. If a Squarespace MCP server exposing file upload
and page/code-injection tools is available:
1. Read `squarespace/manifest.json` and fail fast if `warnings` contains any `over20MB`
   or missing-asset entries.
2. Upload every entry in `manifest.uploads[]` from `upload-to-s/<uploadFile>` to `/s/`.
3. Apply either `modes.blankPageTakeover` (Page Header Code Injection + Code Block) or
   `modes.scopedCodeBlock` (Code Block) to the target page.
4. Verify the published/preview URL across desktop, mobile (390x844), and reduced motion.

### Mode B: Authenticated Browser Editor (`/config/pages`) or Manual Paste
Note: Squarespace's public REST API covers Commerce/Inventory/Orders, not CMS Fluid Engine
page editing, and preview origins (e.g. `https://your-site.squarespace.com/config/pages`)
redirect unauthenticated sessions to `https://login.squarespace.com/` (HTTP 401 on private sites).

1. Sign in to Squarespace in your browser (or open the browser pane and log in when prompted).
2. Upload every file in `squarespace/upload-to-s/` via **Pages -> Not Linked -> + -> Link -> File**
   (each uploaded file becomes live at `/s/<uploadFile>`).
3. **For Full-Bleed Blank Page Takeover:**
   - Create or open a Blank Page, add one full-width **Code Block**, and paste `blank-page-body.html`.
   - Open **Page Settings -> Advanced -> Page Header Code Injection** and paste `blank-page-head.html`.
   - Save and preview outside edit mode (the header/footer hide only when `body:not(.sqs-edit-mode-active)`).
4. **For Scoped Code Block Embed:**
   - Inside an existing Fluid Engine page section, add a **Code Block** spanning full grid width
     and paste `code-block-embed.html`.
5. **Post-deploy verification:**
   - Open the live or preview URL, confirm zero console errors, confirm every `/s/` clip paints
     (`data-sc-load-mode="direct"` or `"direct-fallback"`), confirm pinned stages compute
     `position: sticky` with no console warning from `[scrollcraft]`, and check on a real phone.
