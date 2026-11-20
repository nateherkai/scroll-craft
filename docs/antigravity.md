# Scroll Craft in Google Antigravity & Gemini CLI

`plugins/nateherk-design/` ships native discovery manifests for **Google Antigravity**
(`.antigravity-plugin/plugin.json` + `rules/GEMINI.md` + `assets/icon.png`),
**Gemini CLI** (`gemini-extension.json`), **Claude Code** (`.claude-plugin/plugin.json`),
and **Codex** (`skills/scroll-craft/`), all backed by one canonical skill at
`plugins/nateherk-design/skills/scroll-craft/SKILL.md`.

## Requirements

- [Node.js](https://nodejs.org) 18 or newer
- A full `ffmpeg` build (>200 filters; on Windows: `winget install Gyan.FFmpeg` or set `SCROLLCRAFT_FFMPEG`)
- Installed Google Chrome or Microsoft Edge (real H.264 decoder; override with `SCROLLCRAFT_CHROME`)
- `playwright-core` installed in the build project (`npm i playwright-core`) for Step 5 verification
- Optional `KIE_AI_API_KEY` (only if generating assets; supplied photos/footage need no key)

## Install & Validate

### Antigravity

```bash
agy plugin validate ./plugins/nateherk-design --strict --json
agy plugin install ./plugins/nateherk-design
agy plugin list --json
```

### Gemini CLI

Load `./plugins/nateherk-design` as an extension (`gemini-extension.json` points at
`rules/GEMINI.md`), or point Gemini CLI directly at
`plugins/nateherk-design/skills/scroll-craft/SKILL.md`.

### Claude Code

```bash
claude plugin validate .
claude plugin validate ./plugins/nateherk-design
```

## Windows Execution Notes

- **No Bash required:** `scripts/encode.mjs` replaces `encode.sh` natively in Node
  across Windows PowerShell, cmd, macOS, and Linux, supporting `desktop`, `mobile`,
  `portrait`, `--crop-portrait`, and `--poster`.
- **Shared binary resolver (`scripts/ffmpeg.mjs`):** Checks `SCROLLCRAFT_FFMPEG`,
  `PATH`, and `%USERPROFILE%\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_*`
  (avoiding unset `HOME` on Windows shells), verifies >200 filters, and includes
  Windows Edge (`Program Files (x86)` / `Program Files`) and per-user `%LOCALAPPDATA%`
  Chrome paths.
- **Background preview server (`serve.mjs`):** On Windows agent shells, launch
  `serve.mjs` as a background/daemon process (or dedicated terminal) rather than
  using trailing `&`. By default it binds to `127.0.0.1`; pass `--lan` only for
  real-phone Wi-Fi testing and stop it afterward.

## Preflight & Tests

```bash
node plugins/nateherk-design/skills/scroll-craft/scripts/doctor.mjs
node plugins/nateherk-design/skills/scroll-craft/scripts/workspace.mjs --ensure
npm test
```
