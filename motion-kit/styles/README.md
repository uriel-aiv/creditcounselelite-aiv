# Style playbooks — how to make each CCE motion style at full quality

Purpose: one recipe per style, so anyone (person or agent) can make a new clip in any style at the same quality as the approved tests. Read this page, then the style's file, then build.
Source: the CCE code motion tests, Nov 19–25 2026 (every rule here comes from a review round). Last updated: 2026-11-25.

**Order of authority:** `../../business/compliance-and-legal.md` → `../../workflows/code-motion-tests.md` (rules + full feedback history) → the style file here → the film code. If a style file and the history disagree, the style file is the current state (the history keeps superseded rounds for context).

## Style index
| # | Style | Status | Film to copy for a new clip | File |
|---|---|---|---|---|
| 04 | Instructional Diagrams | approved, footage-tested | `films/cce-r2-04-diagrams` | [04-instructional-diagrams.md](04-instructional-diagrams.md) |
| 05B | Toy Brick 3D | approved, footage-tested | `films/cce-r2-05b-bricks` | [05b-toy-brick-3d.md](05b-toy-brick-3d.md) |
| 06 | Money | approved, footage-tested | `films/cce-r2-06-money` | [06-money.md](06-money.md) |
| 09 | Desktop Mind | approved, footage-tested | `films/cce-r2-09-desktop` | [09-desktop-mind.md](09-desktop-mind.md) |
| 10 | Odd One Out (Visualize Value) | approved, footage-tested | `films/cce-r2-10-oddone` | [10-odd-one-out.md](10-odd-one-out.md) |
| 11 | Vox Explainer | approved, footage-tested | `films/cce-r2-11-vox` | [11-vox-explainer.md](11-vox-explainer.md) |
| 12 | Soft Systems | approved, footage-tested | `films/cce-r2-12-soft` | [12-soft-systems.md](12-soft-systems.md) |
| 15 | Retro OS | explored (not in footage tests) | `films/cce-retroos-brand` | [15-retro-os.md](15-retro-os.md) |
| 16 | Board Game | explored (not in footage tests) | `films/cce-board-brand` | [16-board-game.md](16-board-game.md) |
| 17 | Brand Native | approved, footage-tested | `films/cce-r2-17-brandnative` | [17-brand-native.md](17-brand-native.md) |
| 18 | Card Ribbon | new, 2 tests | `films/cce-r2-18b-cards` | [18-card-ribbon.md](18-card-ribbon.md) |
| 18C | Card Structures 3D | new, 2 tests | `films/cce-r2-18d-cards3d` | [18c-card-structures-3d.md](18c-card-structures-3d.md) |
| 19 | Pixel Wealth | new, 3 tests | `films/cce-ft19-pixel` (engine) + a scene file | [19-pixel-wealth.md](19-pixel-wealth.md) |
| 20 | Photo Collage 2.5D | new, 2 tests | `films/cce-ft20b-collage` | [20-photo-collage-2-5d.md](20-photo-collage-2-5d.md) |

Always copy the **newest** film of a style (it carries every fix). The step-by-step runbook from a raw clip to the AIVideo canvas is `../../workflows/new-footage-test.md`.

## What every film has in common (the shared anatomy)
Every film is `films/<film>/film.js`, a canvas page where frame t = `window.seek(t)`: a **pure function of time** (no timers, no `Math.random`; seeded `mulberry32` / `hash01` only). Rendered frame-exact by `tools/render.mjs`.

| Piece | What it is | What you change per clip |
|---|---|---|
| `DW = 1080, DH = 1920, S = W / DW` | design space, scaled to the 720x1280 render | nothing |
| `SEAM = 980` | y of the split: motion panel above, founder below | nothing |
| `FH_KEYS = [[t, h], ...]` + `footH(t)` | founder height over time, sprung: `1920` = founder full screen, `SEAM` = split, `0` = motion only (voiceover) | the layout for the new script |
| `Y(y)` | maps a panel y so content rides with the panel (`FH >= SEAM ? y - (FH - SEAM) : y + (SEAM - FH) * 0.48`) | nothing |
| `END` + `window.__END` | last spoken word; the brand end card starts here | from `footage-tests/<clip>/plan.json` (`end`) |
| `SRC_FRAMES` | frame count of the founder track | from `plan.json` (`frames`) |
| scenes (`sA…sG`, `s…`, `SHOTS`, `scene()`) | what is drawn on each beat | **everything**: one visual per spoken idea |
| claim window (`CLAIM_FULL`, `dk = P(t, a, b)`) | when "Individual results vary. Education only." shows | from the first claim to the end card |
| `HITS` / `buildHits()` | `[seconds, label, sfx, opts]` per accent; `sfx.mjs` synthesizes them | one per landing, pop, count, cut |
| `CAPS = buildCaptions(words)` + `BR.captions()` | brand captions from `assets/words.json` | fix mishears in `words.json`; strip `$` |
| `FOOT` / `loadFrame(t)` / `pushIn(t)` | founder frames from `assets/footage/f_00001.jpg…` | nothing (`FULL_WINDOWS` for push-ins) |
| `lib/brand.js` | captions (white Poppins on a black pill, blue rule), end card, Anton caps | nothing |

### Method that produced the approved quality (do all of it, every clip)
1. **Read the transcript word by word** (`assets/words.json` has `[start, end, word]` in film seconds). Mark every idea a viewer must remember and the word it lands on.
2. **One visual per idea, specific to the line**: draw the actual thing said (a statement with a credit row for "statement credit", a week of shifts for "busboy"), never a label that repeats the caption.
3. **Time everything from the word timings**: the key object lands on the word; numbers start counting just before so they finish on it; cuts sit on beats.
4. **Something moves at all times** (nothing idle over ~1.5 s): camera drift, ambient life, entrances, follow-through.
5. **Layout**: decide `FH_KEYS` from the clip: split for most talk, founder full screen on key lines (podcasts only), motion-only where the source face is covered (VSL graphics) or the host talks.
6. **Stills first** (`./stills.sh <film> t1,t2,...` at every beat; the first still in a batch can be a warm-up glitch), fix, then render.
7. **QA the encoded MP4** with `../../workflows/motion-qa-checklist.md` at 2–4 fps, fix, re-render. Then deliver and record feedback.

### Non-negotiables in every style
- Compliance: no "$" anywhere (graphics, captions, coins); "Individual results vary. Education only." during claims; "up to" / "as low as" for funding and rates; never promise; CCE is not credit repair (skip clips that claim removals).
- No text overlaps, even mid-transition; nothing on the frame edges; strikes and Xs centred on their target (measured bounds).
- Pictures, not labels; no small letterspaced labels; headlines only for the key number or term.
- Every landing and key word has its sound, generated from the same timing constants as the picture.
- Never generate video in AIVideo unless the creative lead asks. Images only when a style needs art (say the cost first).
