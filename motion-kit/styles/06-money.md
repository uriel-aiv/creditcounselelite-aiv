# 06 Money — style playbook

Purpose: make a new clip in the 06 Money style at the approved quality.
Source: rounds 1–3 of the CCE code motion tests. Last updated: 2026-11-25.

**Latest films:** `films/cce-ft06-money` (Video 29, v06) and `films/cce-r2-06-money` (Video 12, v03). Copy the r2 film. The approved version is the brand blue (06B is the green original recoloured).

## The look
Linen-textured ground in brand blue; LED dot-matrix and halftone sprites (white) that tumble and turn into other icons; huge condensed type moments; target compositions (concentric dashed rings + arrows converging on a halftone object); a camera that pushes through the scene.

## Assets
None generated: sprites are built from masks in code (`makeSprite`, `sampleMask`, `buildSprites`, `buildHalftones`); linen in `buildTextures()`.

## Engine
`ICON` / `SP` dot-matrix sprites, `COIN`, `halftone`, `camera` / `through` / `arrive`, `rings`, `arrowTo`, `bigType`, `orbits`, `accents`; shared anatomy in `README.md`.

## Must
- Halftone sprites in white (not mint) so they read on the blue; coins carry an inner ring, never a currency symbol.
- Everything big: hero objects 3x+, key numbers 300–380 px, labels 84–120 px.
- Each line of the script gets its own visual change (card → fee chip → row of cards; banks → 12-month ring; a meter that slides 3% → 5%).
- Moving objects travel to where their meaning lands (coins pour into the paid bar); their paths never cross text.
- Meters are thick framed bars with big tick labels.
- Motion-only clock: 1.4x at the top half, coins orbit at a fixed radius outside the face, the line sits below the orbit.

## Never
- A "$" sprite (the dot-matrix "dollar" became a coin); paths that cross a headline.
