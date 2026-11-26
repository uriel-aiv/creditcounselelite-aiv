# 05B Toy Brick 3D — style playbook

Purpose: make a new clip in the Toy Brick (Lego-like) 3D style at the approved quality.
Source: rounds 1–3 of the CCE code motion tests. Last updated: 2026-11-25.

**Latest films:** `films/cce-ft05b-bricks` (Video 24, v06) and `films/cce-r2-05b-bricks` (Video 17, v04). Copy the r2 film. Approved look = the saturated brand version (v04).

## The look
Classic multicolour toy bricks in real 3D (three.js), seen isometrically, on cream paper with a light riso grain/halftone. Models build part by part with gravity; yellow comet trails behind moving bricks, ink pop lines on landings, yellow starbursts, chunky black lettering, a plain yellow caption pill.

## Assets
None generated. Geometry and materials in code: `roundGeo` (RoundedBoxGeometry bricks), lathe-profile studs, `cardModel`, `docModel`, `sunModel`, `bankModel`.

## Engine
- `buildWorld()`, `put()`, `drop`/`fall`/`rise`, `CAMK` + `setCamera()`, `proj()` for 2D overlays.
- Materials: ABS plastic `MeshPhysicalMaterial` (clearcoat 1, clearcoat roughness ~0.08, roughness ~0.3), Neutral tone mapping, soft VSM key light high top-left + a big RectAreaLight, a ShadowMaterial ground, a GTAO pass multiplied over the panel.
- Colours: red `C4161C`, blue `0A57D1`, yellow `FFC81F`; saturation boost on the 3D layer (brand colours read desaturated under the lights).
- Overlays: `starburst`, `trail`, `pop`, `overlays()`; sound from `buildHits()` using the same constants.

## New clip, step by step
1. `mkft.py films/cce-r2-05b-bricks <clip> films/cce-ftNN-bricks`.
2. Design every model on the stud grid first (see Must), then the build order and timings.
3. Layout, claims, hits; stills; render (3D renders are slower; GPU if available).

## Must (buildable bricks)
- Every part sits on the stud grid (even widths on whole units, odd widths on half units); heights are only plates (0.4) and bricks (1.2); parts plug into open studs, never onto smooth tiles; nothing floats, sinks or overlaps; connected parts stay square.
- People: two 2x1 leg bricks, 2x1 torso brick, 4x1 shoulder plate, 1x2 jumper plate, round 1x1 head; adult proportions; they stand clear of cards and titles. Extra cards = extra card users (no toy figures standing on a card).
- Cards = plates covered in tiles; screens = brick walls with coloured bricks as the display.
- Builds go part by part, bottom-up: each part falls under gravity (accelerating), lands on its studs with a short damped squash and its own click; pitch rises as the model grows.
- A leaving model is gone before the next falls into its space; stacks move as one body.
- Comet trails are short (about a third of the path) and vanish on landing; ink pops ~0.3 s; starbursts and rings in and out within ~1 s.
- Every spoken idea moves something (hop, ripple up a stack, rocking brick). Figures spring up from the ground.
- Big numbers sit in one fixed top-centre slot. Riso grain 0.55, dots 0.05.

## Never
- Red arrows, floating parts, toy figures on a card, 2D accents that sit unchanged.
