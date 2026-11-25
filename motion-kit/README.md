# CCE motion kit — code-rendered founder split-screen tests

Purpose: everything a new chat or agent needs to rebuild, change and deliver the CCE code motion tests exactly as they were made: film source, generated art, render/sound/mix tools, setup and delivery steps.
Source: built with the CCE creative lead in chat, Nov 19–25 2026. Last updated: 2026-11-25.

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
./setup.sh "$CCE_ROOT/highlights/highlights_1x1.mp4"   # or wherever your copy of the clip is
```
Needs node 18+, ffmpeg, and for the asset scripts python3 + Pillow. In a cloud session, stage the clip first (it is 1080x1080, ~57 s) and pass that path. Expect 1358 frames.

**Shared folder:** the scripts never assume a personal path. Set `CCE_ROOT` to your local copy of the team's shared CCE folder (the one that holds `highlights/`, `footage-tests/` and `motion-tests/`), for example `export CCE_ROOT=~/CCE`. The footage tools read clips from `FT_SRC` (default `$CCE_ROOT/footage-tests`).

## Change a film, check it, deliver it
1. Read the rules doc and the film's notes. Make the change in `films/<film>/film.js` (timings are in seconds; the script's word timings are in `assets/words.json`).
2. Stills before any render, at the beats you touched, and look at every one:
   `./stills.sh cce-brandnative 3.5,10.2,17.8,23.5,35.6,44.1,54.6` → `films/out/<film>/stills/`
   Check: nothing on the frame edges, no overlaps between separate ideas, readable at phone size, no small letterspaced labels, compliance line during claims.
3. Full render + sound + mix (about 1–3 min per film, longer for 3D):
   `./render-film.sh cce-brandnative cce_17-brand-native_split_v04_720p.mp4`
   It prints duration (59.017) and codecs (h264, aac). Pull one frame from the MP4 and look at it.
4. Deliver to the shared folder, never overwriting older versions:
   - Brand versions: `$CCE_ROOT/motion-tests/brand/`
   - Originals: `$CCE_ROOT/motion-tests/<NN-style>/` (e.g. `11-vox-explainer/`)
   - Footage tests: `$CCE_ROOT/motion-tests/footage-tests/`, with the newest version of each also copied to `footage-tests/for-aivideo-latest/` (that folder is what gets dragged into AIVideo).
   - From a Claude cloud session: `SendUserFile` the MP4, then `device_commit_files` with the returned **fileUuid** (a stagedPath fails for large files).
5. Write any new feedback into `../workflows/code-motion-tests.md` the same turn, commit and push.

**File names:** `cce_<NN>-<style>_split_vNN_720p.mp4` (originals; 10 is `..._10-odd-one-out-vv_...`, 12 is `..._12-soft-systems-blue_...`), `cce_<NN>-<style>_brand_split_vNN_720p.mp4` (brand versions, e.g. `cce_06-money_brand_...`), `cce_17-brand-native_split_vNN_720p.mp4`. Always bump the version; never reuse a number.

## How the pieces work (so changes stay consistent)
- **Layout:** design space 1080x1920 (`S = W / 1080`). `FH_KEYS` springs the founder height: split (`SEAM = 980`, founder below) ↔ full screen at `[24.15–32.35]` and `[44.55–49.55]`, end card from 56.6–56.7 s. `Y(y)` maps motion-panel y so content moves with the panel.
- **Script beats** (seconds): Foundation 1.15–7.0 (credit limit 1.28, transferred 2.2, bank 4.1, next day 6.26) · Fix 7.0–12.3 (flat 8.38, one 9.28, five 9.94, zero 11.36) · Build 12.3–24.2 (six 13.6, 24 14.3, 18 17.14, every six months 19.48–20.26, per person 20.54, repeat 21.45 / 22.3 / 23.08) · full screen 24.15–32.35 · Leverage 32.35–55.45 (150,000 33.3–33.94, documentation 35.38, 13 cards 36.42, 10 days 38.54, bonus 43.58, full 44.55–49.55, travel 51.94, seven→21 53.32–53.98) · end card 56.6+.
- **Sound:** list every accent in the film's `HITS` as `[seconds, label, sfx, opts]`; `render-film.sh` dumps them and `sfx.mjs` synthesizes them (`node tools/sfx.mjs --list` shows the palette). Mix uses `--sfx-db -9`.
- **Brand kit (`lib/brand.js`):** loaded by every `-brand` film and 17. Uppercases anything drawn in Anton (`Display` family); `BR.captions()` = white Poppins on a black pill with the blue rule; the end card (metal badge on black, LEARN THE / PLAYBOOK, URL, disclaimer) is drawn by a post-draw hook. Fonts: `fonts/display.woff2` = Anton, `fonts/poppins-*.woff2` = Poppins (family `UI`). Preload any face you draw on frame 0 in `M.film({ fonts: [...] })` or the first frames fall back to a serif.
- **Generated art:** Vox pieces (`cce-vox-brand/assets/pieces`) were built from AIVideo generations (Nano Banana Pro paper textures, GPT Image transparent objects) by `tools/cutfx.py` / `trfx.py`; Soft icons/objects and Board line drawings are AIVideo generations too. AIVideo project "CCE Art Direction" `77b9a3f28a694c7c885eb5978627a64b`, folder Style Round 1 → Code Motion Tests. **Never generate video in AIVideo unless the creative lead asks;** images only when a style needs new art, and say the cost first.
- **Palette patches:** `tools/accent.py film.js patches.json` applies `[[line, old, new], ...]` and adds the Playbook colours to `C`; it refuses if a line doesn't match, so line numbers can't drift silently.

## Footage tests: any new clip in an approved style
Done 2026-11-24 for 8 clips (5 podcast cuts from Drive "Raw Podcast Cuts", 3 VSL cutdowns from "Ads From VSL"). Films: `films/cce-ft*`, per-clip data: `footage-tests/<clip>/` (plan.json = crops/duration, words.json = timings in film time, raw.words.json = Whisper output).

| Style (approved brand version) | Clip | Film dir | Delivered |
|---|---|---|---|
| 04 Instructional Diagrams | Video 4 – Why investors don't use this strategy | `cce-ft04-diagrams` | `cce_04-instructional-diagrams_footage-video04_v01_720p.mp4` |
| 05B Toy Brick (v04, saturated) | Video 24 – The authorized-user strategy | `cce-ft05b-bricks` | `cce_05b-toy-brick-3d_footage-video24_v01_720p.mp4` |
| 06 Money (brand blue) | Video 29 – Paying a collection doesn't solve everything | `cce-ft06-money` | `cce_06-money_footage-video29_v01_720p.mp4` |
| 09 Desktop Mind | VSL Cutdown #2 – Bus Boy to $14M | `cce-ft09-desktop` | `cce_09-desktop-mind_footage-vsl2-busboy_v01_720p.mp4` |
| 10 Odd One Out (B&W) | VSL Cutdown #6 – Objection Killer | `cce-ft10-oddone` | `cce_10-odd-one-out_footage-vsl6-objections_v01_720p.mp4` |
| 11 Vox Explainer | Video 3 – $15,600 in sign-up bonuses | `cce-ft11-vox` | `cce_11-vox-explainer_footage-video03_v01_720p.mp4` |
| 12 Soft Systems | Video 8 – The three levels of banks | `cce-ft12-soft` | `cce_12-soft-systems_footage-video08_v01_720p.mp4` |
| 17 Brand Native | VSL Cutdown #4 – The Blank Binder | `cce-ft17-brandnative` | `cce_17-brand-native_footage-vsl4-blank-binder_v01_720p.mp4` |

Delivered to `$CCE_ROOT/motion-tests/footage-tests/`. Source clips (renamed `04_video04.mp4` …) are in `$CCE_ROOT/footage-tests/`.

### Latest footage-test versions (2026-11-25)
Round 1 films are `films/cce-ft*`, round 2 films `films/cce-r2-*`; per-clip data in `footage-tests/<clip>/`. The code in `films/` matches the newest file below; the next delivery of a film is that number + 1.

| Style | Round 1 (clip → latest) | Round 2 (clip → latest) |
|---|---|---|
| 04 Instructional Diagrams | Video 4 → `..._footage-video04_v06` | Video 19 → `..._r2-video19-six-boxes_v06` |
| 05B Toy Brick 3D | Video 24 → `..._footage-video24_v06` | Video 17 → `..._r2-video17-moving-limits_v04` |
| 06 Money | Video 29 → `..._footage-video29_v06` | Video 12 → `..._r2-video12-the-fee_v03` |
| 09 Desktop Mind | VSL #2 → `..._footage-vsl2-busboy_v03` | VSL #5 → `..._r2-vsl5-skill-for-life_v02` |
| 10 Odd One Out | VSL #6 → `..._footage-vsl6-objections_v03` | VSL #1 → `..._r2-vsl1-45-rules_v01` |
| 11 Vox Explainer | Video 3 → `..._footage-video03_v02` | Video 14 → `..._r2-video14-small-transaction_v01` |
| 12 Soft Systems | Video 8 → `..._footage-video08_v02` | Video 6 → `..._r2-video6-transaction-activity_v01` |
| 17 Brand Native | VSL #4 → `..._footage-vsl4-blank-binder_v03` | Video 13 → `..._r2-video13-fine-print_v01` (VSL #3 skipped: credit-repair claims) |
| **18 Card Ribbon (new)** | — | Video 17 → `cce_18-card-ribbon_r2-video17-moving-limits_v03` (film `cce-r2-18-cards`); Video 12 → `cce_18-card-ribbon_r2-video12-the-fee_v01` (film `cce-r2-18b-cards`) |
| **18C Card Structures 3D (new)** | — | Video 17 → `cce_18c-card-structures-3d_r2-video17-moving-limits_v03` (film `cce-r2-18c-cards3d`); Video 14 → `cce_18c-card-structures-3d_r2-video14-small-transaction_v02` (film `cce-r2-18d-cards3d`) |
| **19 Pixel Wealth (new)** | Video 3 → `cce_19-pixel-wealth_footage-video03_v01` (film `cce-ft19-pixel`) | — |

### Pipeline for a new clip (run from `motion-kit/tools/footage/`, `FT_SRC` = folder of clips)
1. **Get the clip.** Drive downloads are blocked from cloud shells; download in the browser (or ask the creative lead) into `$CCE_ROOT/footage-tests/`, then stage it.
2. **Transcribe** with word timings: `python3 tr.py` (faster-whisper; `WHISPER_MODEL` = model path or name). Fix obvious mishears in the film's `assets/words.json` (e.g. "Dragotour" → "charge-off", "turn off" → "return off").
3. **Find the cuts + thumbnails**: `python3 shots.py` → `shots.json`, `shots_<clip>.png`. Look at every shot.
4. **Find Brandon's face per shot**: `python3 faces.py` (Haar cascade; `HAAR` = path to `haarcascade_frontalface_default.xml`).
5. **Build the founder track**: `python3 prep.py <clip>` → `footage-tests/<clip>/` frames (1080², 23.976 fps, crop follows the face per shot), `audio/vo.wav` (cut 0.45 s after the last word), silent music, words in film time, `plan.json`.
   - Podcast single shots: square ≈ 3.4× the face box, face at 36 % from the top.
   - Podcast side-by-side shots (Brandon = right half): keep the crop **inside the source's white frame lines** (x 970–1882, y 46–1034), or a border shows.
   - Host-only or wide shots with no usable face → that span becomes a motion-only moment.
   - VSL (vertical, burned-in captions): fixed crop `(200, 30, 680)` = face and shoulders above the captions. Check a 4 fps sheet (`ffmpeg ... fps=4,tile`) for spans where graphics or b-roll cover the face; those are motion-only. Never show a VSL founder full-screen (their captions would clash with ours). Trim leading title cards with `CFG` offset (VSL #6 starts at 2.75 s).
6. **Make the film**: `python3 mkft.py films/<approved-brand-film> <clip> films/cce-ftNN-<style>`, then rewrite the sections for the new script in that style's own helpers (see any `cce-ft*` film): set `END` (= plan end) and `window.__END` (brand end card starts there), `FH_KEYS` from a layout of `0` (motion only, voiceover) / `SEAM` (split) / `1920` (full founder), `SRC_FRAMES`, `HITS`, `FAST`/`BUSY`, claim windows.
   - Motion-only moments: `Y()` centres the panel (`y + (SEAM - FH) * 0.48`) and the section group scales up to 1.25× (`m = 1 + 0.25 * clamp(1 - fh / SEAM)`), so graphics fill the frame. Check nothing runs off the sides at 1.25×.
   - Captions in motion-only moments sit at y 1640 (brand.js handles it).
7. **Stills, then render**: QA stills at every beat (the first still in a batch can be a warm-up glitch: re-render it alone before judging). Then `./render-film.sh <film> <name> <out-dir> <sfx-db>` (VSLs have their own music bed: use `-12`; podcasts `-9`). Before delivering, run the QA in `../workflows/motion-qa-checklist.md` on the encoded MP4.

## Known gaps
- The real **Have Heart Two** and **Neoneon** fonts are not in the kit (17 Brand Native draws neon as glowing strokes on Anton and the brush in code). If the team supplies the files, add them to `films/cce-brandnative/fonts/` and register them in `index.html`.
- Footage frames and audio are not committed (large, and they come from one source clip). `setup.sh` rebuilds them exactly.
- `mkbrand.py` documents how the `-brand` copies were made from the originals; the copies already exist, so you only need it to rebrand a new style.
