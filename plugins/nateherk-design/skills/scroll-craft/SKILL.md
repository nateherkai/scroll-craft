---
name: scroll-craft
description: >
  Build premium scroll-driven landing pages with dimensional hero layering,
  distinct page grammars, feeling curves, and bespoke signature moves. Use
  supplied photos/footage or kie.ai generation, write semantic HTML, verify
  desktop, mobile, and reduced-motion states visually, and optionally package
  for Squarespace. Use for "scrollcraft", "scroll craft", "layered hero",
  "scrollytelling", "Apple-style landing page", or "3D scroll world".
---

# scroll-craft

Scroll is the only input every visitor already knows how to use. This skill
treats it as a timeline: the wheel is a scrubber, the page is a film with real
text on top, and each section behaves differently enough that the visitor keeps
going to find out what the next one does.

**Cross-agent note:** Works in Antigravity, Gemini CLI, Claude Code, and Codex on
Windows, macOS, and Linux. In every command below, `<skill>` means the folder
containing this `SKILL.md`. All tooling runs through Node (`node <skill>/scripts/*.mjs`)
with no Bash dependency required. Use your own native file, shell, question, and
browser tools.

**What you produce:** an interview brief, a page grammar, a customer-journey map,
a feeling curve with one engineered peak, a scroll score, one signature move,
prepared assets, one semantic HTML page on a token-driven design floor, a strip
of screenshots proving it holds up at every scroll position, and (when targeting
Squarespace) a verified `/s/` + Code Injection / Embed deployment bundle.

## What this is not

It is not "generate a flythrough and drop text on it." Five sections that behave
identically are one section shown five times. Four spine rules prevent that:

1. **Variety is the product.** Use at least four device families and never the
   same device twice in a row. Read [references/devices.md](references/devices.md).
2. **Photographic by default unless the brand is genuinely illustrated.** Soft
   matte low-poly clay diorama is banned as a default. Read
   [references/worlds.md](references/worlds.md).
3. **No continuous chain by default.** Vary devices so cuts disappear for free;
   chain only when the brief is literally "one continuous journey."
4. **A different world is not a different page.** Decide page structure
   deliberately from all eight grammars. Read
   [references/uniqueness.md](references/uniqueness.md).

## Standing hero preference & approved collection standard

- **Dimensional hero layering** ([references/hero-depth.md](references/hero-depth.md)):
  Plan independently moving background, subject, foreground, and atmospheric
  planes before requesting assets. A single background with fading text does not
  qualify. Honor explicit static/simpler briefs and keep depth in static reduced-motion
  frames. Do not repeat example scenes or impose pinning on grammars that forbid it.
- **Approved collection standard** ([references/approved-collection.md](references/approved-collection.md)):
  Read before planning a premium marketing site. Distills the approved ten-site
  rebuild: real brand research, layer contracts, meaningful pointer/scroll depth,
  distinct nav and endings, useful controls, mobile art direction, and
  final-package verification evidence.

## Step 0: The brief and creative authority

**Establish the brief before generating anything.** Reuse answers and assets
already provided. When the user explicitly delegates creative direction (e.g.
"use your judgment"), write a `Self-authored under explicit creative delegation`
brief and proceed without forcing another checkpoint. Otherwise interview for
the missing decisions in one short pass (8 questions):

1. **Vibe in 3-5 words**, plus up to 3 references from any medium (film, album,
   shop, magazine, game; not existing websites).
2. **The scroll journey, section by section**, in their words.
3. **The energy curve:** where it feels calm versus intense.
4. **Feeling curve & peak:** stage-by-stage emotion and the ONE moment a visitor
   should remember ([references/feel.md](references/feel.md)).
5. **One thing this site should do that no site they have seen does** (seed of
   the signature move; push past vague answers like "be memorable").
6. **Distance from premium-minimal:** brutalist, maximalist, playful, retro,
   dense, editorial, or premium-minimal ([references/uniqueness.md](references/uniqueness.md)).
7. **One unbroken world, or distinct scenes?** Continuous worldflight
   ([references/worldflight.md](references/worldflight.md)) vs. separate scenes/chapters.
   Offer both plainly; neither is the default.
8. **Existing assets:** photos, footage, product shots, brand kit. "Nothing" is
   valid and selects generated imagery.

Write `<workspace>/builds/<name>/BRIEF.md` in the user's words before act
planning. Minimum contents ([references/feel.md](references/feel.md)):

- All 8 topics (verbatim answers where supplied, labeled authored decisions where delegated).
- **The feeling curve:** one line per act (emotion + what on screen causes it).
- **The peak:** one sentence a visitor would tell a friend, plus which act owns it.
- **Completed tell-someone sentence:** "It's the site where ___" (an experience, not a device).
- Any authored silence so verification distinguishes it from dead scroll.

If the human is genuinely unreachable in a fully autonomous run, mark the file
`Self-authored, not interviewed` and note it in the final report.

## Bootstrap

Run preflight once the brief is clear and before Step 1:

```bash
node <skill>/scripts/doctor.mjs
node <skill>/scripts/workspace.mjs --ensure
```

`doctor.mjs` checks Node 18+, a full `ffmpeg` build (>200 filters, catching
stripped PATH builds), `ffprobe`, `libwebp`, `playwright-core`, installed Chrome/Edge,
optional `KIE_AI_API_KEY`, and workspace resolution (`--json` outputs structured
data). Report missing required items plainly instead of working around them.

**Workspace resolution** (first hit wins):
1. `SCROLLCRAFT_HOME`
2. Nearest `.scrollcraft.json` walking up from cwd (`{ "workspace": "..." }`)
3. `<project root>/scrollcraft` (nearest ancestor with `.git`, else cwd)

Builds live in `<workspace>/builds/<name>/`; registry lives in
`<workspace>/FINGERPRINTS.md` (starts empty).

**Optional generation & brand kits:**
- `KIE_AI_API_KEY` is **only needed when generating imagery**. Building from
  supplied photos/footage is a first-class zero-key route. Confirm credit with
  `node <skill>/scripts/kie.mjs probe`.
- Read any brand kit in the workspace before generating assets and obey its hard
  rules (e.g. no invented statistics).
- Copy `engine/scrollcraft.js` and `engine/scrollcraft.css` into the build
  folder. Never edit the engine per project; theme with tokens and write semantic
  markup.

## Step 1: The brief, journey first

Ask only what Step 0 did not cover, in plain prose (never a fabricated industry menu):

1. **What is this, and who is it for?** (1-2 sentences)
2. **What must the visitor believe by the end?** (One sentence, not a feature list)
3. **What does the visitor do next?** (One action, one label used everywhere)
4. **What do you already have?** (Logo, palette, photos, footage, brand doc)
5. **Art direction:** offer the worlds in [references/worlds.md](references/worlds.md)
   or let them define their own.

Write the **journey** as 4-7 beats (e.g. Recognition -> Tension -> Turn ->
Substance -> Range -> Commitment). Every section must serve a beat; cut any
section that does not. Resolve the journey before generating assets.

## Step 2: Grammar, gate, then score

Execute in strict order before act planning (full spec in
[references/uniqueness.md](references/uniqueness.md)):

1. **Pick a grammar** from the eight defined grammars (or define one with
   distinct nav, sequence, ending, and bans). Filmic one-shot requires explaining
   why the other seven lost. Nav, hero, and close follow from the grammar.
2. **Invent the signature move:** one bespoke interaction coded in the page off
   `--sc-p` and custom `data-sc-*` attributes (not an engine edit or parameter tweak).
3. **Run the fingerprint gate:** read `<workspace>/FINGERPRINTS.md` (path via
   `node <skill>/scripts/workspace.mjs`). Differ from **every** existing row on
   at least 4 of 6 dimensions (grammar, nav, hero device, act-sequence shape,
   close pattern, signature move). If it fails, change the plan, not the log.
4. **Write the feeling curve before the score table** ([references/feel.md](references/feel.md)):
   curve first, acts second; no two adjacent acts share a feeling; name the peak
   and give it the largest scroll room.
5. **Score each beat** into a table (Beat | Device | Why this one), obeying the
   chosen grammar's leans-on and bans list.

Example filmic score (right for one grammar only; check your grammar's bans):

| Beat | Device | Why this one |
|---|---|---|
| Recognition | `scrub` | Camera under the reader's hand is the strongest open |
| Tension | `pin` + kinetic | Copy assembles line by line while the frame holds |
| Turn | `reveal` | Wipe expresses state change |
| Substance | `scrub` (macro) | Close texture the eye cannot get otherwise |
| Range | `pan` | Lateral travel reads as options |
| Commitment | `pin` + pointer | Page stops scrolling and responds |

**Pre-build checks:**
- Grammar bans hold without exception.
- At least 4 distinct device families; never the same family twice in a row.
- At most 2 `scrub` acts.
- No two adjacent acts carry the same feeling.
- One peak act owns the largest span by a visible margin; the act before it is quieter.
- Every act earns its scroll span (8-14vh is a pacing reference for cinematic
  pages, not a quota; keep editorial/gallery/live-surface pages shorter when done).
- Avoid repeating the 6-7 acts / 13.6-13.8vh band (now a fingerprint dimension).

## Step 3: Prepare the assets

Full pipeline, aspect-ratio rules, real-footage grading, and portrait recipes:
[references/assets.md](references/assets.md).

```bash
node <skill>/scripts/kie.mjs still "<style preamble>\n\n<scene>" out/01-hero.png --ar 16:9 [--ref brand.png]
node <skill>/scripts/kie.mjs shot  "<camera move>" out/01-hero.png out/01.mp4 --dur 5
node <skill>/scripts/encode.mjs out/01.mp4 assets/01.mp4 desktop --poster assets/01-poster.webp
node <skill>/scripts/encode.mjs out/01.mp4 assets/01-m.mp4 mobile
node <skill>/scripts/encode.mjs out/01.mp4 assets/01-p.mp4 portrait --crop-portrait --poster assets/01-poster-p.webp
```

(`scripts/encode.sh` remains available for Unix/Bash shells; `encode.mjs` runs
natively on Windows, macOS, and Linux and extracts matching WebP posters using
the verified full `ffmpeg` build.)

Four quality rules:
- **One verbatim style preamble** across every generated prompt so separate
  shots belong to one shoot.
- **Inspect every generated PNG** before using it; reroll bad frames early.
- **Encode for scrubbing, not playback:** dense GOP (`-g 8` desktop, `-g 4`
  mobile/portrait), audio stripped, `+faststart`.
- **Layer the hero:** cut independent planes with shared contact anchors and
  differential parallax ([references/hero-depth.md](references/hero-depth.md),
  [references/devices.md](references/devices.md)).

## Step 4: Build the page

Write real semantic HTML (`<h1>`, `<p>`, links, real reading order). The engine
reads `data-sc-*` attributes and never generates DOM.

Start from [references/template.html](references/template.html). Read
[references/devices.md](references/devices.md) and
[references/taste.md](references/taste.md) before writing markup. Theme by
overriding six colour tokens and two font families in `:root`:

```css
:root {
  --sc-canvas: #0A0806;  --sc-surface: #16110E;
  --sc-ink:    #F5EBDD;  --sc-ink-soft: #A2968A;
  --sc-accent: #FF5A3D;  --sc-accent-ink: #15110F;
  --sc-font-display: "Archivo", system-ui, sans-serif;
  --sc-font-text:    "Geist", system-ui, sans-serif;
}
```

## Step 5: Verify by scrolling it

Not optional. Apply
[approved-collection.md §7](references/approved-collection.md#7-require-visual-and-functional-evidence-before-delivery)
and [references/verify.md](references/verify.md). Disable native pointer lock in
headless verification (`shoot.mjs` already does).

```bash
cd <build project> && npm i playwright-core    # once
# Launch serve.mjs as a background daemon (or separate terminal on Windows):
node <skill>/scripts/serve.mjs --root . --port 4500

node <skill>/scripts/shoot.mjs --url http://localhost:4500 --out lab/shots
node <skill>/scripts/shoot.mjs --url http://localhost:4500 --out lab/mobile --width 390 --height 844
node <skill>/scripts/shoot.mjs --url http://localhost:4500 --out lab/reduced --reduced-motion
```

> **Windows shell tip:** Do not use trailing `&` in PowerShell or agent shells
> that terminate detached child processes when a command exits. Start `serve.mjs`
> in daemon/background mode or a dedicated terminal, verify the port serves your
> build title/assets before trusting `shoot.mjs`, and stop it after verification.

After the harness writes `report.json` and `sheet.png`:
1. **Inspect `sheet.png`** (desktop, mobile, and reduced motion): check
   composition, typography wrapping, contrast, and motion continuity, plus keyboard
   tab focus order.
2. **Run the feel check** ([references/feel.md](references/feel.md)): scroll cold,
   name one emotion per act, then diff against `BRIEF.md`. Fix mismatches in the
   page, confirm the peak owns the largest visual shift and scroll room, and
   confirm the closing screen resolves and holds.
3. **Report honestly what headless Chrome cannot prove: a real phone.** iOS
   decoders, autoplay policies, Low Power Mode, and touch inertia require real
   device checks. On any mobile report, deploy
   [references/device-diag.html](references/device-diag.html) on the first round.
   To open the page on a phone over Wi-Fi, start `serve.mjs` with `--lan` (by
   default it binds to `127.0.0.1` only), and stop it when you are done: `--lan`
   makes everything under `--root` readable by anyone on that network.

## Step 6 (Optional): Package and deploy to Squarespace

When deploying to Squarespace 7.1 (including Squarespace-only `/s/` hosting),
read [references/squarespace.md](references/squarespace.md) and run:

```bash
node <skill>/scripts/squarespace-pack.mjs --in <workspace>/builds/<name> --site https://example.com
```

This stages flat `/s/` uploads in `upload-to-s/` (checking Squarespace's 20 MB
per-file cap and hashing every file), rewrites asset URLs, enables CORS-free
`data-sc-load="direct"` byte-range streaming for `/s/` -> `static1.squarespace.com`
redirects, and emits:
- `blank-page-head.html` + `blank-page-body.html` (full-bleed Blank Page takeover
  with `body:not(.sqs-edit-mode-active)` editor protection)
- `code-block-embed.html` (scoped `[data-sc-embed]` Fluid Engine Code Block with
  sticky-preserving `overflow: visible` wrapper rules)
- `iframe-embed.html` (responsive full-viewport iframe wrapper)
- `manifest.json` (dual-mode upload/injection spec for manual paste, Squarespace
  MCP when connected, or authenticated browser editor push against `/config/pages`)

## Hard rules

Ship-blockers, not preferences:

| Never | Instead |
|---|---|
| Clay diorama / low-poly / claymation as default world | Photographic. See [references/worlds.md](references/worlds.md) |
| A "scroll" cue, arrow, or animated mouse icon | Nothing. They are looking at the hero; they know |
| `01 / 06` section counters | Delete them. Sequence is not information here |
| An eyebrow above every section heading | At most one per three sections |
| Em dash anywhere visible | Period, comma, colon, or parentheses |
| Centred copy in every act | Vary the anchor: lead, trail, centre, split |
| The same device twice in a row | Score the journey properly in Step 2 |
| Generating before the brief and creative authority are clear | Run Step 0 and write `BRIEF.md` |
| No engineered peak, or three competing peaks | One peak with the asset budget, prior silence, and largest span |
| An ending that trails off, fades out, or just becomes a footer | The close resolves and holds |
| Planning acts before the feeling curve exists | Curve first, devices second |
| Shipping without one bespoke signature move | Invent one coded in the page; not a parameter tweak |
| Clearing fewer than 4 of 6 fingerprint dimensions vs any row | Change the plan, not `FINGERPRINTS.md` |
| Editing the engine per project for bespoke behaviour | Bespoke JS in the page off `--sc-p` and custom `data-sc-*` |
| Defaulting to filmic one-shot out of habit | Pick from all eight grammars and explain why the other seven lost |
| A full-frame dark overlay to fix contrast | A scrim only where text sits |
| Text baked into a generated image | Real semantic HTML markup |
| Invented statistics in a counter | Real numbers only; no number, no counter |
| `transition: all`, or animating width/height/top/left | `transform`, `opacity`, and `clip-path` |
| Gradient text, neon glow, zero-offset coloured halo shadows | Weight and size for emphasis; offset + blur shadows |
| Autoplaying audio, or any audio track on a scrub clip | Strip audio (`encode.mjs` does this automatically) |
| Shipping without running Step 5 | Run Step 5 and read `sheet.png` |

## Output

Deliver the build folder (including `BRIEF.md`, and `squarespace/` if requested)
plus a concise report: grammar chosen and why the other seven lost, signature
move, fingerprint gate diff against each row, journey, feeling curve and peak,
feel-check diff and fixes, score table, assets prepared, what you verified with
screenshots, what you could not verify (real phone), whether the brief was
self-authored, and the local preview URL.

Then append the build's row to `<workspace>/FINGERPRINTS.md`. Changes to the
skill are tracked in [CHANGELOG.md](CHANGELOG.md).
