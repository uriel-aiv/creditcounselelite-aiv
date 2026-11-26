# 04 Instructional Diagrams — style playbook

Purpose: make a new clip in the 04 Instructional Diagrams style at the approved quality.
Source: rounds 1–3 of the CCE code motion tests. Last updated: 2026-11-25.

**Latest films:** `films/cce-ft04-diagrams` (Video 4, v06) and `films/cce-r2-04-diagrams` (Video 19 "six boxes", v06). Copy the r2 film for a new clip.

## The look
Safety-card / instruction-manual drawings on warm print paper with worn ink. Manual pictograms act out the script; every scene collapses into a "baton" object that morphs into the next scene (no slides, no FIG labels). Labels are big and few.

## Assets
None generated: everything is drawn in code (strokes with slight wobble, paper texture built in `buildTextures()`).

## Engine (what is in the film)
- Drawing kit: `stroke`, `quad`, `arcPts`, `arrowHead`, `burst`, `txt`, `textBox`, `card`, `person` (the pictogram), `plane`, `cloud` (thought cloud), `calendar`, `bank`, `school`, `house`, `cross`, `magnifier`, `thought`, `chalkboard`.
- Scene states per beat (`s` blocks), `BOIL` (line boil), `jitter`, `partial` (draw-on).
- Shared anatomy: see `README.md`.

## New clip, step by step
1. `python3 tools/footage/mkft.py films/cce-r2-04-diagrams <clip> films/cce-ftNN-diagrams` (see the runbook for clip prep).
2. Rewrite the scene blocks for the new script: one pictogram action per idea, each ending in the baton object for the next.
3. Set `END`, `SRC_FRAMES`, `FH_KEYS`, claim window, `HITS`.
4. Stills at every beat → render → QA → deliver.

## Must
- Pictogram people are manual pictograms: head with nose, neck, tapered jacket with white collar and tie, capsule limbs with hands and shoes, paper-coloured outline on the front limbs.
- Figure and props fill the panel (figure about 1.3x); labels 84–96 px.
- Thought clouds are bumpy outlines, never loose arcs, and never touch a head or the header.
- Gauges carry end labels (300 / 850).
- Lists (e.g. six boxes): the camera zooms ~2x into each item as it is named (clipped to the motion panel), then moves to the next; headers hide while zoomed.
- Six-box sheet: box number inset from the corner (clear of the wobbly line by its stroke width), icon in the left half at 0.78x, label fitted in the right half and centred on the box height.
- Lines and arrows draw on and ease away.

## Never
- Slide transitions, "FIG" labels, small text that repeats the captions.
- A title that starts typing before the previous one has left; labels outside their boxes.

## Extra QA
Check the zoomed list beats and the motion-only spans (panel at 1.25x) for labels touching box lines.
