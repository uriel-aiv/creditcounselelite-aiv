# 12 Soft Systems — style playbook

Purpose: make a new clip in the 12 Soft Systems style at the approved quality.
Source: rounds 1–3 of the CCE code motion tests. Last updated: 2026-11-25.

**Latest films:** `films/cce-ft12-soft` (Video 8, v02) and `films/cce-r2-12-soft` (Video 6, v01). Copy the r2 film.

## The look
Blues only (royal, sky, teal, navy, periwinkle, ice). Glowing blurred pills with Inter labels, dashed curved connectors with small square nodes and travelling dots, translucent light-beam triangles projecting from a source onto monotone photo tiles, a parametric radial system (rotating dashed rings, spokes, orbits) under every beat. Clean sans headline (Inter), tracking -2%.

## Assets
- Glass icons (`assets/icons`), transparent objects (`assets/obj`) and photo tiles (`assets/img`) were generated in AIVideo (GPT Image transparent objects, blue-toned; icons in the same glass material as the pills). Prompts: AIVideo project "CCE Art Direction".
- Grain pass and fog background in code (`buildBG`, `FOG`).

## Engine
`pill`, `icon`, `dashed`, `beam`, `tile`, `toneObj`, `system` (radial system), `background`, scene functions `sA…sL`, `sAreas`.

## Must
- Images are rectangle tiles with a transparent object centred inside, connected only with the light-beam triangle polygons.
- Icons must read clearly (not near-invisible glass).
- Background motion minimal (slow faint rings); element drift smooth through layout changes (no jumps).
- Sans fonts only (Inter).

## Never
- Non-blue colours, contour/topo textures, other line styles between images.
