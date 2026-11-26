# 20 Photo Collage 2.5D — style playbook

Purpose: make a new clip in the 20 Photo Collage 2.5D style (After Effects-style animation of normal photos in 2.5D space) at the approved quality.
Source: CCE code motion tests, 2026-11-25 (3 feedback rounds, 2 clips). Last updated: 2026-11-25.

**Films:** `films/cce-ft20-collage` (Video 3, v03) and `films/cce-ft20b-collage` (VSL #2 busboy, v02). **Copy `cce-ft20b-collage`** (newest engine: generic shots list, looks, posterize, leaks).
References (in the creative lead's chat, Nov 25): cut-out photo explainers (a wallet/salary/clock piece on grid paper, the D. B. Cooper story, a red "fear of aging" collage). What they do: real photos split into layers, a camera moving through depth, things flying in and drifting, heavy depth of field, light leaks, glowing serif type, black-and-white halftone cut-outs mixed with colour, paper/dust textures, choppy Posterize Time.

## The look
Each shot = a clean background plate + the subject cut out + 6–10 flat front-on props, each at a depth Z. The camera dollies/cranes/pans; near layers move and grow more; elements fly in fast and drift; out-of-focus foreground objects; focus racks between layers. Textures per layer (colour hero, B&W or halftone others, sepia grade). Cuts are light-leak burns. Type is a glowing serif. The panel animates on 12s.

## 1. Art (Nano Banana 2.1 in AIVideo, 2K, ~6 credits an image)
Exact prompts and templates: `../../prompts/image-gen-photo-collage.md`. In short:
- **Scenes:** normal cinematic photos, 9:16, subject full-body (knees up), centred in the lower two thirds, clear space above the head, no text or logos. For a recurring character, pass the first hero image as a reference (`reference_ids`, slot `image_urls`) and write "the same man from the reference image" (a younger self works too).
- **Clean plates:** edit the scene image (reference = the scene) with: "remove the <subject> completely, fill what would be behind, keep everything else exactly the same".
- **Props:** "flat front view / flat lay, perfectly straight, orthographic like a scan, no perspective, no tilt, no shadow, on a pure white background". Never angled 3D product shots (rejected). Grids of items (polaroids, buildings, coins) as one flat image with white gaps, split later. Real currency notes may be refused: ask for "a generic green paper money note, not a real currency".
- Download: the asset `public_url` (`https://d1gamhzqsikqux.cloudfront.net/video/<project>/assets/<id>.png`).

## 2. Cut-outs (`tools/collage/make_layers.py`, needs `requirements.txt`)
- Scene + plate → `<name>_plate.jpg` + `<name>_subj.png` (registered 1080x1935): `python3 tools/collage/make_layers.py scene.png plate.png films/<film>/assets/layers <name>`. It bounds the person with the plate difference, cuts the edge with a people-only model, mattes the edge band (pymatting) and decontaminates edge colours (no halo), fills only small holes.
- Props: `... prop.png - <dir> <name> --prop`; **white or light paper** (forms, statements, tickets, notes, calendars) needs `--prop --solid`, or the page goes see-through.
- Grids (polaroids, buildings): `python3 tools/collage/split_grid.py grid.png <dir> pola --white 246` (`--cutout` for non-rectangular items like buildings). Coin sheets: `make_layers.py ... --prop`, then split by connected components. Clouds on black: brightness becomes alpha.
- **Check every cut-out over a coloured background** before use: no halo, no missing parts (held objects like cards or a suitcase), no background chunks between arms and body, paper opaque (> ~90%).

## 3. Engine (`films/cce-ft20b-collage/film.js`)
- **Camera + layers:** a layer = `{ img, x, y, w, Z, look?, enter?, drift?, fall?, exit?, shadow?, glow?, after?, alpha?, flip?, dof? }`, defined by where it sits on screen at rest (centre x,y and width w) and its depth Z. `drawLayers()` re-projects with the camera `{x, y, z, focus}`: screen = centre + ((pos − centre)·Z − cam·F) / (Z − cam.z). `plate(img, ph, fy, Z, k)` gives a plate and its subject one shared rest rectangle (so they register) at different depths (plate ~3000, subject ~1800–2100).
- **Moves:** `fly(t, dx, dy, d)` (fast in, hard ease-out `outExpo`), `drop(t)` (falls from near the lens to its depth with gravity; shadow offset/blur shrink on landing), `drift: [vx, vy]` px/s, `fall: [t0, v, sway]` (notes falling), `exit`. No rotation, no flips of people, no puppeting.
- **Depth of field:** blur = 16·dof·F·|1/(Z − cam.z) − 1/(focus − cam.z)| (capped 34 px). Each shot opens racked to the lens and focuses in over 0.6 s (`START`); rack focus by animating `focus` in the shot's `cam` keys.
- **Shots:** one function per shot in `SHOTS` returning `{ cam: [[t, {x,y,z,focus}], ...], layers: [...], leak?, flare? }`; `T` holds shot start times on the words; `ORDER`, `sceneAt(t)`.
- **Looks (`LOOKS` map, baked once at init):** `ht` = black-and-white halftone dot screen on paper-warm whites; `bw` = grayscale, contrast; `duo` = warm sepia. Hero subject and money stay in colour. Paper grain + dust/hairs over the panel (`texture()`), vignette, faint colour fringe (`chroma`), stronger on hits.
- **Transitions:** `LEAKS` = light-leak burns on every cut (`leakBurn()`: warm orange/red/cream leaks sweep across and burn toward white on the cut).
- **Type:** Playfair Display 800/900 (`fonts/serif-800.woff2`, `serif-900.woff2`, OFL, registered as family `Serif` in `index.html`). `title()` reveals letter by letter out of a blur with a soft bloom (cream `#F6ECDC`, gold `#F2C14E` for the key word); `numberText()` for counters; a soft dark band at the top keeps it readable. `arrowDown()`, `scribbleEllipse()`, `scribbleX()` for hand-drawn marks (attach to a layer with `after`).
- **Posterize Time:** `POSTER = 12`: the photo panel, type and effects are drawn at `floor(t·12)/12`; founder footage and captions stay at full rate; `samples: 1`.
- **Gotcha:** `M.film({ init(ctx, IMG) })` — the images are the **second** argument.

## 4. New clip, step by step
1. Prep the clip and copy the film: `mkft.py films/cce-ft20b-collage <clip> films/cce-ftNN-collage` (layers from the old film come along; delete what you don't use).
2. Storyboard from the transcript: one shot per section (5–7 shots for 30 s), each with a hero (person or object), 6–10 props tied to the words, the key number/term, and where focus goes. Keep one recurring character for a "my story" script; past in B&W, present in colour.
3. Generate scenes → plates → props (say the cost first), cut out, check over colour.
4. Write `T`, `FH_KEYS` (split for talk, `0` for voiceover moments), `SHOTS`, `LOOKS`, `drawType()`, `buildHits()`, `LAYERS` (every image file), claim window (`dk`), `SRC_FRAMES`, `END`.
5. Stills at every beat (check: heads clear of headlines, props out of the headline zone, nothing important under the disclaimer/captions, focus where intended), render with `-12` for VSLs / `-9` for podcasts, QA at 2–4 fps.

## Must
- People stay still; all motion is camera + elements.
- Props are flat and never spin or tilt.
- Headline zone (top ~640 px of the panel) stays clear of props; a prop under a title reads as a stray mark.
- Key props are in focus when named (rack focus to them).
- Disclaimer from the first claim to the end card; "up to" / "as low as".

## Never
- Fake walks, bobs or poses; rotated/3D-angled props; see-through paper; halos; Anton or sans headlines in this style; whip pans or fog wipes (replaced by light leaks); motion blur sub-samples with Posterize Time.
