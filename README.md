# scroll-craft

**An agent skill for building premium, scroll-driven websites, with a real design standard.**

Use it with Codex, Claude Code, or another coding agent that can read instructions,
edit files, run commands, and inspect a browser. The skill contains the design
workflow, references, engine, and verification tools. It also ships as a Claude
Code plugin for convenient installation.

Most AI website output fails in one of two directions. It is either well behaved and forgettable, or it is a flashy scroll animation with 2.1:1 body text, a headline that wraps to six lines on a phone, and the same six sections every other AI page has. scroll-craft is built to fail neither way: it treats **interaction** and **craft** as one job rather than two.

[![MIT](https://img.shields.io/badge/licence-MIT-blue.svg)](LICENSE)
[![Agent skill](https://img.shields.io/badge/agent-skill-3b82f6.svg)](plugins/nateherk-design/skills/scroll-craft/SKILL.md)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-d97757.svg)](https://code.claude.com/docs/en/plugins)

---

## New in 0.3.0: the approved ten-site standard

The skill now includes the process behind ten approved immersive websites:
AI Automation Society, PERKFORM, Glaido, Herkules Advisory, Serein, FORME,
Pelagic, NOEMA, OFFGRID, and Afterhours.

### See the worked examples in motion

A 50-second walkthrough of several approved sites, showing their layered heroes,
pointer response, and scroll transitions.

https://github.com/user-attachments/assets/d193073b-5af9-45de-93ae-95bf7c6934d5

- Plan independent depth planes, contact anchors, and opening/midpoint/exit states.
- Use authentic brand assets and verified product details before generating imagery.
- Choose photographic compositing or real 3D rendering to suit the subject.
- Give each site its own navigation, information order, useful controls, and ending.
- Art-direct phones separately and verify actual scroll frames, fallbacks, and packages.
- Honor explicit creative delegation without forcing a redundant interview.

Read the [worked examples and production workflow](plugins/nateherk-design/skills/scroll-craft/references/approved-collection.md)
and the [hero-depth guide](plugins/nateherk-design/skills/scroll-craft/references/hero-depth.md).
These examples describe design behavior; client assets and private form data are
not bundled. The existing engine and video compatibility fixes are preserved.

## Three builds, three completely different pages

Same skill, same engine, no shared skeleton. The differences below are not themes: they are different page grammars, different navigation models, different endings.

### [AI Automation Society](https://aiautomationsociety.ai) · an AI community
A dark editorial landing for a 450,000-member community. One stat carries the whole promise, a live product surface rises into the frame, and the proof stacks under it as you fall down the page.

![AI Automation Society, a dark editorial community landing](media/ais.webp)

### [Nate Herk](https://www.nateherk.com) · a creator portfolio
High-key and bright, the opposite of the first. A lit-glass hero with the numbers up front, a portrait held in the light, and two clear next steps instead of a wall of links.

![Nate Herk, a high-key lit-glass creator portfolio](media/nateherk.webp)

### PERKFORM · a protein coffee
A filmic one-shot that hard-cuts to two full-bleed inverted grounds mid-page. Loud, product-forward, and the only one of the three that raises its voice.

![PERKFORM, a filmic one-shot product page](media/perkform.webp)

---

## What it actually does

**Interaction, engagement, and being unrepeatable**

- **Scroll is the timeline.** Video scrubs frame by frame under the wheel, sections pin while their argument advances, rails pan sideways, headlines assemble line by line, the page ground shifts colour as you travel, and the pointer moves things that are not scrolling.
- **Eight mutually exclusive page grammars.** Filmic one-shot, chaptered editorial, live surface, continuous world, typographic poster, gallery, split stage, rhythmic cutlist. Each one *forbids* what the others require, so two builds cannot quietly converge.
- **A required signature move.** Every build invents one bespoke interaction that exists on that site alone. A recoloured spotlight does not count.
- **A fingerprint gate.** A new build must differ from every page you have already made on at least 4 of 6 dimensions: grammar, nav, hero, act shape, close, signature move. Fail it and you change the plan, not the record.

**Craft, and how the page actually feels**

- **A feeling curve before any act exists.** One line per act: the emotion, then what on screen causes it. Two adjacent acts with the same feeling means one is filler.
- **One engineered peak.** Peak-end rule, applied literally. The peak gets the asset budget, the silence in front of it, and the most scroll room. A page with three peaks has none.
- **A typography floor.** Two families maximum, tracking that tightens as size grows, 45 to 75ch measure, line height inverse to measure, and light-on-dark compensated on three axes.
- **A spacing scale with actual rhythm.** 4px base, more space above a heading than below it, fluid section padding so a phone does not inherit desktop air.
- **Colour with six roles and one accent**, secondary text tinted rather than flat grey, no pure black, and a documented escape for pages that hard-cut between light and dark grounds.
- **Depth as five tools, not one.** Offset shadows, edge light, scale-and-blur as distance, overlap, and grain.
- **Brand guidelines are inputs, not decoration.** Point it at a brand kit and its hard rules win, including rules that forbid things the skill would otherwise reach for.
- **A refuse list.** Identical feature-card grids, `01 / 06` counters, scroll cues, gradient text, em dashes, invented statistics, fake dashboards, AI-purple gradients, and the cream-and-brass artisan palette every craft brand defaults to.

**It checks its own work**

A headless browser walks the finished page at every scroll position, waits for the video playhead to settle, and reports:

- **dead scroll**: scroll that changes nothing on screen
- **cues that never reach full opacity**: copy the reader can only ever see faded
- **contrast measured on the composited page**, per line, at the brightest frame that ever passes under it, with the direction picked per line so light-on-dark and dark-on-light are both graded correctly
- **legs stuck on a poster**: a clip that silently never decoded, which looks exactly like a paused film

Then it writes a contact sheet, because a machine can prove a page works and cannot tell you it means anything.

---

## Install

### Codex and other coding agents

Clone or download this repository. The complete skill lives in
[`plugins/nateherk-design/skills/scroll-craft/`](plugins/nateherk-design/skills/scroll-craft/).
Keep that folder intact, including its references, scripts, templates, and engine.

- **Codex:** copy the complete `scroll-craft` folder into your project's
  `.agents/skills/` directory, then ask Codex to use the Scrollcraft skill.
- **Other agents with skill support:** place the folder in the agent's documented
  skill directory.
- **Any coding agent with file access:** leave the repository in your workspace
  and ask it to read and follow the skill directly:

```text
Read plugins/nateherk-design/skills/scroll-craft/SKILL.md and use it to build
my website. Follow the referenced design and verification workflow.
```

Adjust the path if the repository is in a subfolder. Agents use their own tools
for file access, shell commands, browser inspection, and user questions. The
design workflow is shared; tool names and automatic skill discovery can differ.
The ten-site rebuild documented here was built with Codex.

### Claude Code plugin

```bash
/plugin marketplace add nateherkai/scroll-craft
```
```bash
/plugin install nateherk-design
```

Then use it by describing what you want, or invoke it directly:

```
/nateherk-design:scroll-craft
```

If the install summary says `Run /reload-plugins to activate.`, run that.

To hack on the skill without installing:

```bash
claude --plugin-dir ./plugins/nateherk-design
```

## First run

From this repository's root, run:

```bash
node plugins/nateherk-design/skills/scroll-craft/scripts/doctor.mjs
node plugins/nateherk-design/skills/scroll-craft/scripts/workspace.mjs --ensure
```

If you installed the skill elsewhere, use that folder's `scripts/` path instead.

Run `doctor` before anything else. The three most common setup faults all surface later as misleading errors otherwise: a stripped ffmpeg reports a missing filter as a syntax error in *your* command, a missing WebP muxer reports as a bad filename, and `playwright-core` resolves from the wrong directory.

## Requirements

| | Why | Notes |
| --- | --- | --- |
| **Node 18+** | every script | |
| **A full ffmpeg build** | encoding clips so they *scrub* rather than play | Some toolchains put a stripped ffmpeg on PATH with ~50 filters and no `scale`. `doctor` finds a real build if one exists; `SCROLLCRAFT_FFMPEG` overrides. |
| **`playwright-core` + Chrome** | the verification pass | `npm i playwright-core` **in the build folder** |
| **`KIE_AI_API_KEY`** | only if you want assets *generated* | Optional. Building from your own photos and footage needs no key and no spend, and it is a first-class route. See `.env.example`. |

## The workspace

Your builds and your fingerprint registry live in one directory, resolved rather than assumed. First hit wins:

1. `SCROLLCRAFT_HOME`
2. the nearest `.scrollcraft.json` walking up from the current directory: `{ "workspace": "path/to/builds" }`
3. `<project root>/scrollcraft`

Builds land in `<workspace>/builds/<name>/`; your registry is `<workspace>/FINGERPRINTS.md`.

**Your registry starts empty, and that is correct.** The gate exists to stop you repeating *yourself*, so your first build has nothing to clear and every build after it does. [`EXAMPLES.md`](EXAMPLES.md) is the author's twelve-row table, included so you can see what a filled registry looks like and which shapes tend to collide. It is illustration, not constraint.

## What is in here

```
plugins/nateherk-design/
└── skills/scroll-craft/
    ├── SKILL.md            the procedure: brief, grammar, score, build, verify
    ├── references/
    │   ├── approved-collection.md  the ten-site workflow and worked examples
    │   ├── hero-depth.md   independent planes, contact anchors, mobile composition
    │   ├── uniqueness.md   eight page grammars, the signature move, the fingerprint gate
    │   ├── feel.md         the feeling curve, the engineered peak, the feel check
    │   ├── devices.md      nine scroll devices and the cue contract
    │   ├── worldflight.md  continuous-world mode: one fixed stage, no seams
    │   ├── worlds.md       art direction, and the style-preamble method
    │   ├── taste.md        the design floor: spacing, type, colour, depth, motion
    │   ├── assets.md       generation, camera moves, encoding for scrubbing
    │   ├── verify.md       the harness, and what it cannot tell you
    │   └── template.html   a starting skeleton, not a layout
    ├── engine/             scrollcraft.js + .css. The mechanism, never edited per project
    ├── templates/          the empty registry a new workspace is seeded from
    └── scripts/            doctor · workspace · kie · encode · serve · shoot · worldflight-assert
```

[`CHANGELOG.md`](plugins/nateherk-design/skills/scroll-craft/CHANGELOG.md) is worth reading on its own: it records what broke on each build and the rule that came out of it, rather than a feature list.

## The one rule that matters most

The engine is the mechanism and it is **never edited per project**. Theme it with six colour tokens and two fonts, write your own semantic HTML, and drive anything bespoke off the `--sc-p` custom property the engine publishes. A runtime that builds the page from a config object is exactly why every site built on one looks the same.

## Honest limitations

- **Only ever run on Windows.** The scripts look for ffmpeg and Chrome in Windows, macOS and Linux locations, but no build has been done on a Mac. `SCROLLCRAFT_FFMPEG` and `SCROLLCRAFT_CHROME` override the search.
- **Generated video is not free.** A ten-leg continuous-world flight is a real spend. A page built from your own assets costs nothing.
- **It is opinionated on purpose.** It will refuse the layouts and palettes that make AI pages recognisable, and it will argue with you about your peak. If you want a page that looks like everything else, this is the wrong tool.

## Licence

MIT. See [LICENSE](LICENSE).


## 🌐 Web Resources & Aesthetic Symbols Index
- [SYM 1F917](https://scholarly-type-fonts-40.pages.dev/symbol/sym-1f917/)
- [SYM 1D46A](https://gothic-bio-fonts-98.pages.dev/symbol/sym-1d46a/)
- [SYM 1F495](https://vintage-lace-fonts-63.pages.dev/symbol/sym-1f495/)
- [SYM 1F49B](https://neon-matrix-symbols-74.pages.dev/symbol/sym-1f49b/)
- [SYM 1D41D](https://vintage-runes-text-35.pages.dev/symbol/sym-1d41d/)
- [SYM 2744](https://zen-typography-hub-86.pages.dev/symbol/sym-2744/)
- [STARRY LOVE AURA](https://neon-matrix-symbols-74.pages.dev/symbol/starry-love-aura/)
- [SYM 26AF](https://delicate-pink-text-22.pages.dev/symbol/sym-26af/)
- [SYM 1F625](https://archival-rune-symbols-42.pages.dev/symbol/sym-1f625/)
- [TIBETAN LOTUS BLOSSOM](https://minimal-star-symbols-89.pages.dev/symbol/tibetan-lotus-blossom/)
- [SYM 2721](https://zen-typography-hub-86.pages.dev/symbol/sym-2721/)
- [SYM 1F634](https://gothic-bio-fonts-84.pages.dev/symbol/sym-1f634/)
- [SYM 26EF](https://mystic-occult-fonts-26.pages.dev/symbol/sym-26ef/)
- [SYM 26B3](https://chibi-emotion-faces-74.pages.dev/symbol/sym-26b3/)
- [SYM 1F605](https://vintage-runes-text-63.pages.dev/symbol/sym-1f605/)
- [SYM 1F912](https://vintage-lace-fonts-79.pages.dev/symbol/sym-1f912/)
- [GAMING WEAPONS](https://neon-matrix-symbols-74.pages.dev/gaming-weapons/)
- [HEAVY HEART EXCLAMATION](https://vintage-scholar-text-78.pages.dev/symbol/heavy-heart-exclamation/)
- [SIXTEEN POINTED STAR](https://poetic-scroll-fonts-91.pages.dev/symbol/sixteen-pointed-star/)
- [CRYING TEARS SAD KAOMOJI](https://arcane-symbol-vault-32.pages.dev/symbol/crying-tears-sad-kaomoji/)
- [SYM 1F62B](https://matrix-hacker-fonts-85.pages.dev/symbol/sym-1f62b/)
- [SYM 2744](https://classic-typewriter-symbols-19.pages.dev/symbol/sym-2744/)
- [SYM 2620 FE0F](https://zen-typography-hub-86.pages.dev/symbol/sym-2620-fe0f/)
- [SYM 1FAE3](https://chibi-emoticon-vault-78.pages.dev/symbol/sym-1fae3/)
- [SYM 26D2](https://vintage-runes-text-63.pages.dev/symbol/sym-26d2/)
- [SYM 1D429](https://vintage-coquette-text-58.pages.dev/symbol/sym-1d429/)
- [SYM 263B](https://modern-bullet-symbols-45.pages.dev/symbol/sym-263b/)
- [SYM 1F622](https://vintage-bow-fonts-72.pages.dev/symbol/sym-1f622/)
- [SYM 1D449](https://scholarly-script-hub-43.pages.dev/symbol/sym-1d449/)
- [SYM 2656](https://soft-angel-symbols-33.pages.dev/symbol/sym-2656/)
- [SYM 2658](https://sleek-line-unicode-29.pages.dev/symbol/sym-2658/)
- [MUSIC WEATHER](https://pearl-heart-symbols-95.pages.dev/ja/music-weather/)
- [SYM 1FAE8](https://cyber-clan-tags-36.pages.dev/symbol/sym-1fae8/)
- [LEO ZODIAC LION](https://chibi-emoticon-lab-65.pages.dev/symbol/leo-zodiac-lion/)
- [TRENDING](https://sleek-line-unicode-29.pages.dev/ru/trending/)
- [SYM 2734](https://kawaii-kaomoji-hub-70.pages.dev/symbol/sym-2734/)
- [SYM 2659](https://vintage-scholar-text-78.pages.dev/symbol/sym-2659/)
- [LOVING HEART EYES KAOMOJI](https://minimal-star-symbols-87.pages.dev/symbol/loving-heart-eyes-kaomoji/)
- [SYM 26DE](https://sleek-mono-symbols-75.pages.dev/symbol/sym-26de/)
- [SYM 1D415](https://vintage-library-text-15.pages.dev/symbol/sym-1d415/)
- [SYM 263F](https://ribbon-bow-unicode-18.pages.dev/symbol/sym-263f/)
- [SYM 1D4A4](https://synthwave-bio-maker-62.pages.dev/symbol/sym-1d4a4/)
- [SYM 1F62E](https://gothic-bio-fonts-55.pages.dev/symbol/sym-1f62e/)
- [SYM 1D445](https://baroque-curse-text-56.pages.dev/symbol/sym-1d445/)
- [SYM 1D438](https://gothic-bio-fonts-24.pages.dev/symbol/sym-1d438/)
- [SYM 2645](https://baroque-curse-text-56.pages.dev/symbol/sym-2645/)
- [SYM 26C4](https://neon-glitch-symbols-29.pages.dev/symbol/sym-26c4/)
- [BORDERS DIVIDERS](https://kawaii-kaomoji-hub-70.pages.dev/es/borders-dividers/)
- [SYM 2626](https://dollcore-bio-symbols-12.pages.dev/symbol/sym-2626/)
- [SYM 2671](https://baroque-font-vault-96.pages.dev/symbol/sym-2671/)
- [SYM 2721](https://anime-sparkle-text-81.pages.dev/symbol/sym-2721/)
- [TIKTOK CAPTIONS](https://vintage-scholar-text-78.pages.dev/vi/tiktok-captions/)
- [ES](https://sleek-line-unicode-29.pages.dev/es/)
- [SYM 2660](https://vintage-runic-symbols-53.pages.dev/symbol/sym-2660/)
- [ARROWS LINES](https://neon-matrix-symbols-74.pages.dev/pt/arrows-lines/)
- [SYM 26FB](https://zen-aesthetic-fonts-87.pages.dev/symbol/sym-26fb/)
- [SYM 1F92A](https://zen-typography-hub-86.pages.dev/symbol/sym-1f92a/)
- [KAOMOJI](https://poetic-scroll-fonts-91.pages.dev/pt/kaomoji/)
- [SYM 1F622](https://mecha-text-vault-91.pages.dev/symbol/sym-1f622/)
- [HEARTS](https://neon-matrix-symbols-74.pages.dev/vi/hearts/)
- [ARIES ZODIAC RAM](https://anime-sparkle-text-56.pages.dev/symbol/aries-zodiac-ram/)
- [HEAVY RIGHTWARD ARROW](https://scholarly-script-hub-43.pages.dev/symbol/heavy-rightward-arrow/)
- [TENDER GENTLE TEAR KAOMOJI](https://zen-typography-hub-86.pages.dev/symbol/tender-gentle-tear-kaomoji/)
- [SYM 1D457](https://lace-and-ribbon-text-61.pages.dev/symbol/sym-1d457/)
- [SYM 26E3](https://neon-glitch-symbols-29.pages.dev/symbol/sym-26e3/)
- [GEORGIAN LOVE HEART](https://anime-sparkle-text-70.pages.dev/symbol/georgian-love-heart/)
- [SYM 26F2](https://dollcore-bio-symbols-12.pages.dev/symbol/sym-26f2/)
- [PINWHEEL STAR](https://anime-sparkle-text-50.pages.dev/symbol/pinwheel-star/)
- [TRENDING](https://coquette-aesthetic-symbols-88.pages.dev/trending/)
- [SYM 1F60C](https://gothic-bio-fonts-24.pages.dev/symbol/sym-1f60c/)
- [WHITE HEART](https://neon-futuristic-symbols-20.pages.dev/symbol/white-heart/)
- [SYM 26F8](https://mystic-occult-fonts-26.pages.dev/symbol/sym-26f8/)
- [SYM 2748](https://baroque-curse-text-56.pages.dev/symbol/sym-2748/)
- [SYM 2638](https://vintage-runes-text-35.pages.dev/symbol/sym-2638/)
- [SYM 1D41B](https://clean-spacing-fonts-98.pages.dev/symbol/sym-1d41b/)
- [SYM 2764 FE0F 200D 1FA79](https://soft-angel-symbols-33.pages.dev/symbol/sym-2764-fe0f-200d-1fa79/)
- [AQUARIUS ZODIAC WATER BEARER](https://zen-typography-hub-86.pages.dev/symbol/aquarius-zodiac-water-bearer/)
- [SYM 1D42D](https://poetic-scroll-fonts-91.pages.dev/symbol/sym-1d42d/)
- [SYM 2627](https://zen-typography-hub-86.pages.dev/symbol/sym-2627/)
- [TELUGU RIBBON BOWLET](https://matrix-glitch-text-84.pages.dev/symbol/telugu-ribbon-bowlet/)
- [SYM 2666](https://moe-kaomoji-vault-94.pages.dev/symbol/sym-2666/)
- [RIGHT WING CLAN FLARE](https://pastel-manga-symbols-57.pages.dev/symbol/right-wing-clan-flare/)
- [KAOMOJI](https://delicate-pink-text-22.pages.dev/pt/kaomoji/)
- [SYM 1D41A](https://vintage-runes-text-35.pages.dev/symbol/sym-1d41a/)
- [SYM 1F604](https://zen-typography-hub-86.pages.dev/symbol/sym-1f604/)
- [SYM 1D408](https://soft-angel-symbols-33.pages.dev/symbol/sym-1d408/)
- [SYM 1D41F](https://scholarly-script-hub-43.pages.dev/symbol/sym-1d41f/)
- [SYM 2646](https://vintage-runes-text-63.pages.dev/symbol/sym-2646/)
- [SYM 1D417](https://vintage-runes-text-35.pages.dev/symbol/sym-1d417/)
- [MUSIC WEATHER](https://vintage-lace-fonts-79.pages.dev/vi/music-weather/)
- [CRYING TEARS SAD KAOMOJI](https://sleek-mono-symbols-75.pages.dev/symbol/crying-tears-sad-kaomoji/)
- [AESTHETIC MINIMAL CLOUD](https://delicate-pink-text-22.pages.dev/symbol/aesthetic-minimal-cloud/)
- [SYM 1D48B](https://theeduplaycampen.pages.dev/symbol/sym-1d48b/)
- [SYM 1D47A](https://scholarly-script-hub-43.pages.dev/symbol/sym-1d47a/)
- [SYM 26E1](https://kawaii-kaomoji-hub-88.pages.dev/symbol/sym-26e1/)
- [SYM 2636](https://chibi-faces-hub-88.pages.dev/symbol/sym-2636/)
- [SYM 2613](https://kawaii-kaomoji-hub-88.pages.dev/symbol/sym-2613/)
- [SYM 26DD](https://arcane-symbol-vault-32.pages.dev/symbol/sym-26dd/)
- [SYM 1D43E](https://sleek-type-aesthetic-51.pages.dev/symbol/sym-1d43e/)
- [SYM 1F922](https://vintage-lace-symbols-54.pages.dev/symbol/sym-1f922/)
- [SYM 2613](https://pearl-heart-symbols-95.pages.dev/symbol/sym-2613/)
- [SYM 1D44B](https://clean-spacing-fonts-98.pages.dev/symbol/sym-1d44b/)
- [SYM 1D477](https://mecha-glitch-fonts-82.pages.dev/symbol/sym-1d477/)
- [SYM 1D48D](https://zen-aesthetic-fonts-87.pages.dev/symbol/sym-1d48d/)
- [WHITE HEART](https://mecha-glitch-fonts-82.pages.dev/symbol/white-heart/)
- [SYM 1F63F](https://minimal-star-symbols-95.pages.dev/symbol/sym-1f63f/)
- [SYM 1D4A5](https://mecha-hacker-kaomoji-26.pages.dev/symbol/sym-1d4a5/)
- [LAST QUARTER CRESCENT MOON](https://chibi-emoticon-world-87.pages.dev/symbol/last-quarter-crescent-moon/)
- [SYM 2731](https://vintage-lace-fonts-79.pages.dev/symbol/sym-2731/)
- [LEO ZODIAC LION](https://vintage-angel-text-38.pages.dev/symbol/leo-zodiac-lion/)
- [SYM 260D](https://chibi-emoticon-world-87.pages.dev/symbol/sym-260d/)
- [SYM 1F620](https://pastel-kaomoji-vault-54.pages.dev/symbol/sym-1f620/)
- [SYM 1F616](https://occult-aesthetic-symbols-26.pages.dev/symbol/sym-1f616/)
- [DISCORD STATUS](https://coquette-aesthetic-symbols-76.pages.dev/ru/discord-status/)
- [SYM 1D441](https://mecha-text-vault-91.pages.dev/symbol/sym-1d441/)
- [SYM 26AC](https://soft-angel-symbols-61.pages.dev/symbol/sym-26ac/)
- [SYM 2659](https://dollcore-bio-symbols-12.pages.dev/symbol/sym-2659/)
- [SYM 1F97A](https://arcane-symbol-vault-32.pages.dev/symbol/sym-1f97a/)
- [SYM 26D4](https://kawaii-kaomoji-hub-70.pages.dev/symbol/sym-26d4/)
- [SYM 1F614](https://occult-aesthetic-symbols-26.pages.dev/symbol/sym-1f614/)
- [SYM 1FAE3](https://zen-typography-hub-86.pages.dev/symbol/sym-1fae3/)
- [SYM 2723](https://baroque-curse-text-56.pages.dev/symbol/sym-2723/)
- [SYM 2626](https://minimal-star-symbols-95.pages.dev/symbol/sym-2626/)
- [SYM 1D436](https://geometric-bio-symbols-76.pages.dev/symbol/sym-1d436/)
- [SYM 1D48E](https://scholarly-script-hub-43.pages.dev/symbol/sym-1d48e/)
- [MUSIC WEATHER](https://glitch-mecha-kaomoji-69.pages.dev/es/music-weather/)
- [CRYING TEARS SAD KAOMOJI](https://soft-angel-symbols-61.pages.dev/symbol/crying-tears-sad-kaomoji/)
- [SYM 1F648](https://ribbon-bow-unicode-18.pages.dev/symbol/sym-1f648/)
- [SYM 1F633](https://soft-angel-symbols-33.pages.dev/symbol/sym-1f633/)
- [SYM 1D476](https://vintage-bow-fonts-72.pages.dev/symbol/sym-1d476/)
