# CCE motion kit — code-rendered founder split-screen tests

Purpose: everything a new chat or agent needs to rebuild, change and deliver the CCE code motion tests exactly as they were made: film source, generated art, render/sound/mix tools, setup and delivery steps.
Source: built with Uriel in chat, Nov 19–23 2026. Last updated: 2026-11-23.

**Read first, every time:** `../workflows/code-motion-tests.md` (the rules and every piece of feedback per style), `../business/compliance-and-legal.md`, `../visual/brand-guide.md`. The rules there beat anything you'd do by default.

## What the films are
- One 59 s founder clip (`highlights_1x1.mp4`, 1080x1080, 23.976 fps, 56.6 s) cut into a vertical split-screen: **motion on top, founder below**, going full-screen founder on the key lines, then a brand end card from 56.6 s.
- Every film is a canvas page whose frame at time t is `window.seek(t)`: a pure function of time (no timers, no `Math.random`, seeded noise only). three.js is used in 05B Bricks.
- Output: **720x1280, 23.976 fps, H.264 + AAC, 59.0 s**, audio mastered to -14 LUFS (voice from the footage + synthesized SFX on each film's `HITS`; no music bed).

## Folder map
```
motion-kit/
  setup.sh          one-time: npm deps, Chromium, footage frames, audio stems
  stills.sh         QA stills at chosen seconds (look at them before any full render)
  render-film.sh    full render -> SFX -> mix -> delivery MP4
  tools/            render.mjs (frame-exact renderer), pw.mjs, sfx.mjs + mix.mjs (motion-reel skill copies),
                    brand.js (brand captions + end card + Anton caps hook), mkbrand.py (made the *-brand copies),
                    accent.py (line-anchored palette patcher), cutfx.py / printfx.py / trfx.py (built the Vox paper pieces),
                    shot.mjs (screenshots of an HTML page)
  films/<film>/     index.html, film.js, film.json, lib/motion.js (+ lib/brand.js), fonts/, assets/, beats.json
  films/<film>/assets/footage -> ../../../footage   (frames, made by setup.sh, not committed)
  bg-tests/         cce_bg-tests_v02.html — the background study; 17 Brand Native uses variant B
```
Original (non-brand) films link their generated art to the `-brand` copy (`assets/<x> -> ../../cce-<film>-brand/assets/<x>`), so it is stored once.

## Film index (latest delivered versions)
| # | Style | Original film dir → latest | Brand film dir → latest |
|---|---|---|---|
| 04 | Instructional Diagrams | `cce-diagrams` → v03 | `cce-diagrams-brand` → v03 |
| 05B | Toy Brick 3D | `cce-bricks` → v03 | `cce-bricks-brand` → v04 (saturation boost) |
| 06 | Money Green | `cce-moneygreen` → v02; 06B blue `cce-moneyblue` → v01 | `cce-moneygreen-brand` → v03 |
| 09 | Desktop Mind | `cce-desktop` → v03 | `cce-desktop-brand` → v03 |
| 10 | Odd One Out (Visualize Value) | `cce-oddone` → v03 | `cce-oddone-brand` → v03 (black and white only) |
| 11 | Vox Explainer | `cce-vox` → v06 | `cce-vox-brand` → v03 |
| 12 | Soft Systems (blue) | `cce-soft` → v07 | `cce-soft-brand` → v03 |
| 15 | Retro OS | `cce-retroos` → v01 | `cce-retroos-brand` → v03 |
| 16 | Board Game | `cce-board` → v03 | `cce-board-brand` → v03 |
| 17 | Brand Native | — | `cce-brandnative` → v03 |

The code in `films/` is the state of the latest version in this table. Next delivery of a film = that number + 1.

## Setup (once per machine)
```bash
cd motion-kit
./setup.sh /Users/uriel/UU/creditcounsel/highlights/highlights_1x1.mp4   # or wherever the clip is
```
Needs node 18+, ffmpeg, and for the asset scripts python3 + Pillow. In a cloud session without the Mac, stage the clip first (it is 1080x1080, ~57 s) and pass that path. Expect 1358 frames.

## Change a film, check it, deliver it
1. Read the rules doc and the film's notes. Make the change in `films/<film>/film.js` (timings are in seconds; the script's word timings are in `assets/words.json`).
2. Stills before any render, at the beats you touched, and look at every one:
   `./stills.sh cce-brandnative 3.5,10.2,17.8,23.5,35.6,44.1,54.6` → `films/out/<film>/stills/`
   Check: nothing on the frame edges, no overlaps between separate ideas, readable at phone size, no small letterspaced labels, compliance line during claims.
3. Full render + sound + mix (about 1–3 min per film, longer for 3D):
   `./render-film.sh cce-brandnative cce_17-brand-native_split_v04_720p.mp4`
   It prints duration (59.017) and codecs (h264, aac). Pull one frame from the MP4 and look at it.
4. Deliver to Uriel's Mac, never overwriting older versions:
   - Brand versions: `/Users/uriel/UU/creditcounsel/motion-tests/brand/`
   - Originals: `/Users/uriel/UU/creditcounsel/motion-tests/<NN-style>/` (e.g. `11-vox-explainer/`)
   - From a Claude cloud session: `SendUserFile` the MP4, then `device_commit_files` with the returned **fileUuid** (a stagedPath fails for large files).
5. Write any new feedback into `../workflows/code-motion-tests.md` the same turn, commit and push.

**File names:** `cce_<NN>-<style>_split_vNN_720p.mp4` (originals; 10 is `..._10-odd-one-out-vv_...`, 12 is `..._12-soft-systems-blue_...`), `cce_<NN>-<style>_brand_split_vNN_720p.mp4` (brand versions, e.g. `cce_06-money_brand_...`), `cce_17-brand-native_split_vNN_720p.mp4`. Always bump the version; never reuse a number.

## How the pieces work (so changes stay consistent)
- **Layout:** design space 1080x1920 (`S = W / 1080`). `FH_KEYS` springs the founder height: split (`SEAM = 980`, founder below) ↔ full screen at `[24.15–32.35]` and `[44.55–49.55]`, end card from 56.6–56.7 s. `Y(y)` maps motion-panel y so content moves with the panel.
- **Script beats** (seconds): Foundation 1.15–7.0 (credit limit 1.28, transferred 2.2, bank 4.1, next day 6.26) · Fix 7.0–12.3 (flat 8.38, one 9.28, five 9.94, zero 11.36) · Build 12.3–24.2 (six 13.6, 24 14.3, 18 17.14, every six months 19.48–20.26, per person 20.54, repeat 21.45 / 22.3 / 23.08) · full screen 24.15–32.35 · Leverage 32.35–55.45 (150,000 33.3–33.94, documentation 35.38, 13 cards 36.42, 10 days 38.54, bonus 43.58, full 44.55–49.55, travel 51.94, seven→21 53.32–53.98) · end card 56.6+.
- **Sound:** list every accent in the film's `HITS` as `[seconds, label, sfx, opts]`; `render-film.sh` dumps them and `sfx.mjs` synthesizes them (`node tools/sfx.mjs --list` shows the palette). Mix uses `--sfx-db -9`.
- **Brand kit (`lib/brand.js`):** loaded by every `-brand` film and 17. Uppercases anything drawn in Anton (`Display` family); `BR.captions()` = white Poppins on a black pill with the blue rule; the end card (metal badge on black, LEARN THE / PLAYBOOK, URL, disclaimer) is drawn by a post-draw hook. Fonts: `fonts/display.woff2` = Anton, `fonts/poppins-*.woff2` = Poppins (family `UI`). Preload any face you draw on frame 0 in `M.film({ fonts: [...] })` or the first frames fall back to a serif.
- **Generated art:** Vox pieces (`cce-vox-brand/assets/pieces`) were built from AIVideo generations (Nano Banana Pro paper textures, GPT Image transparent objects) by `tools/cutfx.py` / `trfx.py`; Soft icons/objects and Board line drawings are AIVideo generations too. AIVideo project "CCE Art Direction" `77b9a3f28a694c7c885eb5978627a64b`, folder Style Round 1 → Code Motion Tests. **Never generate video in AIVideo unless Uriel asks;** images only when a style needs new art, and say the cost first.
- **Palette patches:** `tools/accent.py film.js patches.json` applies `[[line, old, new], ...]` and adds the Playbook colours to `C`; it refuses if a line doesn't match, so line numbers can't drift silently.

## Known gaps
- The real **Have Heart Two** and **Neoneon** fonts are not in the kit (17 Brand Native draws neon as glowing strokes on Anton and the brush in code). If Uriel supplies the files, add them to `films/cce-brandnative/fonts/` and register them in `index.html`.
- Footage frames and audio are not committed (large, and they come from one source clip). `setup.sh` rebuilds them exactly.
- `mkbrand.py` documents how the `-brand` copies were made from the originals; the copies already exist, so you only need it to rebrand a new style.
