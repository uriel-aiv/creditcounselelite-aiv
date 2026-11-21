# Code motion tests — founder split-screen rules and per-style notes

Purpose: the rules and decisions behind the code-rendered CCE motion tests, so any future build follows the same direction.
Source: Uriel's direction in chat, Nov 19–21 2026. Last updated: 2026-11-21 (round 3 feedback).

## Format
- Founder split-screen. Motion on the **top half**, founder on the **bottom half**.
- Key spoken lines go from split to **full-screen founder**; overlays on full screen stay minimal and non-invasive.
- First drafts: 720x1280 vertical, 23.976 fps. Test footage: `highlights/highlights_1x1.mp4`.
- Motion is code-rendered (canvas / three.js). Never generate video in AIVideo unless Uriel asks for it. AIVideo reference images are style references only: recreate their texture, treatment and vector style in code.

## Animation rules (apply to every style)
- Show the detail that makes the line click. Match the action to the idea.
- Cut on the spoken beat. Work backward from the word the viewer must remember (a number may start changing before the word so it lands on time).
- There is always animation: continuous, matching motion with the full principles of animation (anticipation, follow-through, overshoot, settle).
- Movement is smooth and dynamic: ease, accelerate, decelerate. Separate anticipation, action and hold.
- One job for the eye at a time. Preserve continuity between beats. Use rhythm to create expectation.
- No slide transitions between figures and no "FIG" labels. In/out animations are fine; morphing is optional.
- Lines and arrows draw on and ease away; they don't sit static. The canvas/camera may move.
- No small irrelevant text (it repeats the captions). Use accurate illustrations instead.
- Pick visuals per style; don't reuse another style's visuals.
- Everything stays well inside the frame, never on the edges; nothing overlaps.
- Keep render times short (JPEG frame pipe, fewer blur samples, cached assets).

## Compliance in graphics
- Read `business/compliance-and-legal.md` first. No guarantees; not credit repair.
- No $ amounts in graphics. "0%" is an intro period.
- Show "Individual results vary. Education only." during member-result claims; the end card carries the full disclaimer.

## Per-style notes
- **04 Instructional Diagrams** — print paper, worn ink; continuous hand-drawn baton morphs.
- **05B Toy Brick Multicolor (3D)** — real brick construction rules (cards = plates covered in tiles, open studs to attach things, documents built from plates and tiles, loose offset pile). Built bank and sun. No red arrows: yellow comet trails behind moving bricks, ink pop lines on landings. Captions are a plain yellow pill (no arrow box). Big numbers sit in one fixed top-centre slot.
- **06 Money Green** — linen texture, dot-matrix and halftone sprites, camera push-through. 06B is the same film recoloured to blue.
- **09 Desktop Mind** — must look and feel like a real Mac: apps that match the concept (Calculator, Calendar, Photos, Finder). Gradient wallpaper with the CCE badge. File images generated with Nano Banana 2.1 must look like iPhone photos.
- **10 Odd One Out** — imitate the Visualize Value animation style: pure black, thin white geometric line diagrams, small spaced uppercase labels, conceptual metaphors (containers, wedge, distribution, orbit, path, fan, exponential curve). Solid vs outline marks the one thing that matters. Graphics of separate ideas never overlap (several ideas can share one graphic if it stays legible).
- **11 Vox Explainer** — stop-motion collage, not floating images: pieces pushed on in held steps (12 per second), slight boil, no bounce. Handwriting writes on letter by letter. Hand-made cuts only: scissor polygons (no perfect masks), paper scraps cut with straight scissor cuts (no torn edges), square prints with crooked borders, close-up crops of just the important part. Paper textures from Nano Banana Pro; cards and props from GPT Image with **transparent background**, then given a hand-scissored polygon paper margin. Shadows are hard and close (paper lies on the surface). Marks over images use a red chisel-tip marker, checked so each mark sits on its subject (circles around faces, not across them); blue ballpoint handwriting stays on paper. No serif fonts (Anton for headlines). No halftone/print effect on the photos and no unfold effect.
- **12 Soft Systems** — blues only (royal / azul rey, sky / cielo, teal, navy, periwinkle, ice). Glowing pills, dashed paths with square nodes, light beams onto blue-toned photos. Glass icons generated in the same material as the pills. Icons must read clearly (not near-invisible glass). Background motion is minimal: slow faint rings only. No contour/topo textures. Element drift must stay smooth through layout changes (no jumps). Sans fonts only (Inter).
- **15 Retro OS** — 1-bit windows, pixel fonts, zoom rectangles, cursor keyframes.
