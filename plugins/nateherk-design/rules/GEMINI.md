# Scroll Craft (Antigravity & Gemini CLI Rules)

When the user asks to build a scroll-driven landing page, dimensional hero, scrollytelling experience, or Squarespace scroll page, read `skills/scroll-craft/SKILL.md` first and follow its complete workflow (Step 0 brief through Step 5 visual verification, plus Step 6 Squarespace packaging when requested).

## Cross-Platform & Windows Runtime Rules

- Resolve `<skill>` to `skills/scroll-craft/` inside this plugin directory (`plugins/nateherk-design/skills/scroll-craft/` from the repository root).
- Run all helper scripts directly with Node (no Bash required):
  - `node <skill>/scripts/doctor.mjs` (preflight; supports `--json`)
  - `node <skill>/scripts/workspace.mjs --ensure`
  - `node <skill>/scripts/encode.mjs <in> <out> [desktop|mobile|portrait] [crf] [--poster <out.webp>]`
  - `node <skill>/scripts/serve.mjs --root <buildDir> --port 4500` (binds `127.0.0.1` by default; pass `--lan` only for real-phone Wi-Fi testing)
  - `node <skill>/scripts/shoot.mjs --url http://localhost:4500 --out lab/shots`
  - `node <skill>/scripts/squarespace-pack.mjs --in <buildDir> --site https://example.com`
- On Windows agent shells, start `serve.mjs` as a background/daemon process rather than using trailing `&`, verify the served `<title>` and asset HTTP 200 before running `shoot.mjs`, and inspect `sheet.png` directly.
- For Squarespace-only `/s/` hosting, read `<skill>/references/squarespace.md`. `scrollcraft.js` supports `data-sc-load="direct"` and automatic non-HTTP CORS fallback so `/s/` redirects to `static1.squarespace.com` stream cleanly via byte-range requests.
