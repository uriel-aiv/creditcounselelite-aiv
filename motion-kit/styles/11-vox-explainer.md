# 11 Vox Explainer — style playbook

Purpose: make a new clip in the 11 Vox Explainer style at the approved quality.
Source: rounds 1–3 of the CCE code motion tests. Last updated: 2026-11-25.

**Latest films:** `films/cce-ft11-vox` (Video 3, v02) and `films/cce-r2-11-vox` (Video 14, v01). Copy the r2 film.

## The look
Stop-motion paper collage on a desk of grid paper seen top-down: printed photos with worn cream borders slapped down and taped, yellow marker labels, blue ballpoint ovals/arrows/notes drawn on live, highlighter swipes. The camera glides across one continuous desk from station to station. Pieces are pushed on in held steps (12 per second) with a slight boil, no bounce.

## Assets (generated in AIVideo, then cut in code-side tools)
- Paper textures: Nano Banana Pro. Cards and props: GPT Image with **transparent background**.
- `tools/cutfx.py` / `tools/trfx.py` / `tools/printfx.py` give each piece a hand-scissored polygon paper margin and print treatments; results live in the brand film's `assets/pieces`, `prints`, `paper`, `cut`, `gpt`.
- Prompts are stored on each asset in the AIVideo project "CCE Art Direction" (see `../../prompts/README.md`).

## Must
- Hand-made cuts only: scissor polygons (no perfect masks), paper scraps cut with straight scissor cuts, square prints with crooked borders, close-up crops of just the important part.
- Shadows hard and close (paper lies on the surface).
- Red chisel-tip marker marks sit on their subject (circles around faces, not across them); blue ballpoint handwriting stays on paper and writes on letter by letter.
- Anton for headlines.

## Never
- Floating images, bounce, torn edges, unfold effects, halftone/print effect on the photos, serif fonts.
