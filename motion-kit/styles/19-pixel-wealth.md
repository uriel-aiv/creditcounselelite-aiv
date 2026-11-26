# 19 Pixel Wealth — style playbook

Purpose: make a new clip in the 19 Pixel Wealth style (Habbo-style isometric pixel art of an ultra-wealthy life) at the approved quality.
Source: CCE code motion tests, 2026-11-25 (5 feedback rounds). Last updated: 2026-11-25.

**Films:** `films/cce-ft19-pixel` (Video 3, v05; **this file holds the engine**), `films/cce-ft19b-pixel` (Video 24, v04), `films/cce-ft19c-pixel` (VSL #2 busboy, v04). The b and c films are generated from the engine + a scene file (`tools/pixel/sceneA.js`, `sceneB.js`).

## The look
Isometric 2:1 pixel rooms (penthouse, vault, airfield, villa, diner, city block, living room, home office) with code-drawn Habbo-style characters (big head, sunglasses, navy blazer, gold chain), code-drawn props on the same pixel grid, 1x pixel-font headlines on a navy notice banner with a gold top rule, retro mosaic cuts, an eased camera, ambient life in every room. No realistic people, no glow, no motion blur.

## 1. Rooms (generated art)
- **Model:** GPT Image 2.6 Sunburst in AIVideo, 1:1, Standard, ~7 credits each. Exact prompts: `../../prompts/image-gen-pixel-wealth.md` (one template + 8 rooms).
- **Retrace onto a true pixel grid:** `python3 tools/pixel-retrace.py room.png assets/bg/<room>.png 216 40` (box-average to 216x216, 40-colour k-means palette, no dithering, stray pixels removed). One art pixel = 6x6 screen pixels (`PXS = 6`).
- Look at the retraced room at 4x before using it: open floor in the middle is required (characters stand there).

## 2. Engine (`films/cce-ft19-pixel/film.js`)
- **Pixel buffers → sprites:** `buf`, `px`, `rect`, `poly` rasterise on pixel centres; `toCanvas(b, outline = true)` adds a 1-px dark plum outline (`OUT '#170d22'`). Props that belong to a room are drawn **without** the outline (see rules).
- **Characters:** `avatar(legs, arms, bob, look)`; `LOOKS` = boss, busboy, dad, mom, friend1, friend2; arm poses down, swing0/1, wave0/1, up, carry, scrub0/1, point; walking via `walker(t, path)` (path `[[t, x, y], ...]`, straight walks between keys); `drawAvatar(ctx, w, arms, flip, who)`. Sprite sheet export: `node tools/sprite-sheet.mjs films/cce-ft19-pixel out.png`.
- **Props:** briefcase, cash brick (plain green, no symbols), gold bar, black card, statement, plane, thought bubble, notes, sparkles; extras for the other clips in `tools/pixel/extras.js` (book, pin, arrow, wallet, cafe table, office boxes by flood-fill from `BOX_SEEDS`).
- **Camera:** `CAMK [t, cx, cy, zoom]` → `camAt(t)` (eased, log-zoom, slow drift), drawn nearest-neighbour; zoom is raised automatically so the room fills the panel (`max(z, ph/G, DW/G)`); the camera may look above the room (source y down to -40) to leave headroom for banners.
- **Cuts:** `mosaicAt(t)` around each time in `CUTS` (the frame drops to big blocks and builds back over ±0.16 s).
- **Ambient life:** `ambient()` from colour masks in the retraced art (water shimmer bands, flickering windows and lamps, glints on gold, twinkles); `flock` birds, `noteRain`, `confetti`.
- **Headlines:** `banner(ctx, s, cy, sc, t, a, b, col)` with the 5x7 `FONT`: springs down, types in letter by letter, lifts and fades out. Always scale 1, `cy ≤ 12` (very top of the panel).

## 3. New clip, step by step
1. Pick rooms that show the script (reuse existing ones; generate new ones with the prompt template if needed, then retrace).
2. Write a scene file like `tools/pixel/sceneB.js`: `ROOMS`, `T` (scene start times on the words), `CUTS`, `DISC` (claim window), `scene(t)`, `drawPixels(ctx, t)` (who walks where, poses, props, banners), `CAMK`, `END`, `FH_KEYS`, `FULL_WINDOWS`, `buildHits()`; first line `//SRC_FRAMES=<frames from plan.json>`.
3. Check every walking/standing position: `python3 tools/pixel/waypoints.py <room.png> '[[x,y],...]' out.png` draws each character's 22x44 footprint over a gridded room.
4. Build the film (from `motion-kit/`):
   ```bash
   python3 tools/footage/mkft.py films/cce-ft19-pixel <clip> films/<new-film>   # footage, audio, words, film.json
   cp <retraced rooms> films/<new-film>/assets/bg/
   cat tools/pixel/<your-scene>.js tools/pixel/common_tail.js > /tmp/scene.js
   python3 tools/pixel/build.py films/<new-film> /tmp/scene.js "<title>"
   ```
   Rebuild after every scene-file change; engine fixes go into `films/cce-ft19-pixel/film.js` (then rebuild the b/c films).
5. Stills at every beat, render, QA (`samples 1`; pixel art gets no motion blur).

## Must
- Characters stand and walk only on open floor with a small gap from furniture; never on tables, sofas, booths or loungers. A footprint box may sit in front of furniture (feet lower than its base) but feet never land inside it. Crowds in rows on open floor.
- Props sit on the surface they belong to (case on the coffee table, statement on the desk).
- A code-drawn prop placed in a room must match that room: sample the room's own palette, copy its shapes (the cafe table copies the diner's cream iso top, chrome pedestal, napkin holders), no dark outline.
- Separation from busy backgrounds by position, not effects.
- Text only for key numbers and terms (1,200 / 15,600 / 7X→21X; 14 MILLION / 50,000 A MONTH / 4,000+ MEMBERS / UP TO 500,000 / AS LOW AS 0%). Story beats are told by animation. The call to action is a bouncing arrow with no text.
- Keep the avatar's head below the banners (avatar in the lower 60% of the panel); disclaimer above the caption pill.
- Boss sunglasses: two shaped lenses with a two-pixel glint, gold brow bar and bridge, temple to the ear.
- Objects move: cash drops with gravity and bounce, notes flutter, confetti on cheers, the statement shakes as it prints.

## Never
- A soft glow / light rim around characters (rejected).
- Headlines larger than 1x or banners over a character or key prop.
- A character's feet inside furniture; props floating off their surface.
