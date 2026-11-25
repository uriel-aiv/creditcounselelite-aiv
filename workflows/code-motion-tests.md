# Code motion tests — founder split-screen rules and per-style notes

Purpose: the rules and decisions behind the code-rendered CCE motion tests, so any future build follows the same direction.
Source: Uriel's direction in chat, Nov 19–23 2026. Last updated: 2026-11-23 (brand round, 17 Brand Native).

**To build or change a film, use `motion-kit/` (code, art, tools) and follow `motion-kit/README.md` step by step.** This file holds the rules; add every new piece of feedback here in the same turn you act on it.

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

## Brand (CCE Brand Style Guidelines 2025)
- Never use small, widely letterspaced labels (e.g. "E V E R Y  6  M O N T H S" between two rules) or small step text at the top of the frame. Secondary words use the header face at a readable size.
- Corporate colours: blue `#004AAD` (main), black `#000000`, white `#FFFFFF`. Accents: light blue `#ADC8E3`, gold `#CB9938`. 0% Capital Playbook colours (Foundation, Fix, Build, Leverage): blue `#114BA7`, maroon `#6B0505`, green `#266235`, teal `#008C96`. The PDF's hex labels for gold and the Playbook colours are wrong; these values are sampled from the swatches.
- Fonts: ANTON for headers, always ALL CAPS; Poppins for body text (Montserrat 2nd choice). Poppins as a header must be ALL CAPS + bold.
- The official logo sits on black. Titles use the corporate colours only. Text over images gets a black overlay.
- Motion-test brand kit (`lib/brand.js`): captions are white Poppins on a black overlay pill with a thin blue rule; the end card is the metal logo on black with "LEARN THE PLAYBOOK" in Anton (white + blue).
- Playbook colours (blue, maroon, green, teal) expand the palette on the animated objects only: cards, dots, bars, tape labels, window title bars, icon discs, beams, dock tiles. Corporate blue stays the dominant colour, and gold and light blue stay as accents. Titles and big numbers stay in corporate colours. Captions keep the blue rule; no colour-changing divider. Exception: 10 Odd One Out (Visualize Value) stays strictly black and white, with no brand or Playbook colours.

## Footage tests (new clips)
- Final chosen styles (2026-11-24): 04 Instructional Diagrams, Toy Brick (Lego), 06 Money, 09 Desktop Mind, 10 Odd One Out, 11 Vox Explainer, 12 Soft Systems, 17 Brand Native. For new clips, build on the last approved versions (the brand versions; Lego = saturated v04; Odd One Out = black and white).
- Each style gets its own new visuals for the clip's script, in that style's language; never reuse another style's visuals.
- Clips with heavy baked-in graphics (VSL cutdowns): use the voice as voiceover with motion full-screen wherever the face is covered, and crop his face (above the burned captions) wherever it is clear. Never show a VSL founder full-screen.
- Podcast clips: crop Brandon per shot (face-tracked); host-only shots become motion-only moments.
- No "$" in captions or graphics; numbers without currency symbols, always with "Individual results vary. Education only." during claims (bonuses, 7–21x, 90% approval odds, portfolio, members).
- The brand end card starts right after the last spoken word.
- Every scene must show what Brandon is saying at that moment (feedback 2026-11-24, v02): read the transcript line by line and draw the specific thing (a statement with a credit row for "statement credit", a week calendar packed with shifts for "busboy", a day as 48 half-hour squares with one filled for "30 minutes a day", map areas for "different in your area"). Generic shapes or label pills that only repeat the words are not enough; add detail.
- Before a voiceover-only moment, check the source frames: switch to motion-only before the baked graphic appears, not after.
- In voiceover-only moments the background must fill the whole frame (no hard edge or black band above it).
- Feedback 2026-11-24 (v03 and round 2):
  - **Strike-throughs, Xs and cut lines** sit dead centre on their target, on X and Y: measure the real glyph box (`measureText` bounds, cap height of "H") or the object's bounding box; never place them by eye. Applies to every style.
  - **10 Odd One Out (Visualize Value)** shows no objects at all: no gauges, banks, megaphones, documents, check marks or icons. Only shape and movement metaphors: dots, circles, rings, lines, squares, grids, forks, paths, ripples; solid vs outline marks the one that matters.
  - **09 Desktop Mind** explains with real-looking app windows (sidebars, toolbars, segmented controls, toggles, calendar grids, charts, map pins, album tiles), never a window that only holds text. In voiceover-only moments don't scale the desktop up (windows must stay off the frame edges).
  - **04 Instructional Diagrams** people are manual pictograms: head with nose, neck, tapered jacket with white collar and tie, capsule limbs with hands and shoes, paper-coloured outline on front limbs. Thought clouds are bumpy outlines, not loose arcs, and never overlap a head or title.
  - **Toy Brick**: no little toy figures standing on a card (it reads as a kid). Brick people use adult proportions (long legs, shoulder plate, small head) and stand clear of the card and titles; extra cards represent extra card users.
  - **No text overlaps, even mid-transition**: a title must finish leaving before the next one starts typing in; an outgoing scene must be gone before the next one's main object lands on it; labels stay inside their boxes and clear of drawings (feedback 2026-11-24 on 04 Instructional Diagrams).
  - **09 Desktop Mind UI must be clean** (feedback 2026-11-24): every label, number and button sits inside its window; nothing runs under the dock or menu bar; no wallpaper badge peeking from behind windows; Finder-style labels inside windows are dark text (blue pill when selected). The menu bar app name is "CCE", not "Finder".
  - **VSL face framing**: when Brandon moves around in a cutdown, track his face shot by shot (`VSL_TRACK` in prep.py) instead of one fixed crop; the crop stays above the burned-in captions and his whole head stays in frame.
  - **Toy Brick realism** (feedback 2026-11-24, "improve the lego to the max"): ABS-plastic MeshPhysicalMaterial (clearcoat 1, clearcoat roughness ~0.08, roughness ~0.3), rounded-edge bricks (RoundedBoxGeometry) with lathe-profile studs and hairline gaps, Neutral tone mapping, a soft VSM key light from high top-left + a big RectAreaLight for broad highlights, a ShadowMaterial ground so bricks cast soft shadows on the paper, and a GTAO ambient-occlusion pass multiplied over the panel for crevice/contact shading. Toy colours: red C4161C, blue 0A57D1, yellow FFC81F. Riso grain/halftone stays but light (grain 0.55, dots 0.05) so it doesn't read as noise on the plastic.
  - **Toy Brick construction must be buildable** (feedback 2026-11-24): every part sits on the stud grid (even-width parts centred on whole units, odd-width on half units), heights are only plates (0.4) and bricks (1.2), parts plug into open studs (never onto smooth tiles), nothing floats, sinks into the table or overlaps another part, objects that connect stay square to each other. People: two 2x1 leg bricks, 2x1 torso brick, 4x1 shoulder plate, 1x2 jumper plate, round 1x1 head. Screens are brick walls with coloured bricks as the display.
  - **06 Money**: the dot-matrix "dollar" sprite is a coin now; no "$" anywhere, graphics included.
  - Round 2 clips: 04 Video 19 (six boxes), Toy Brick Video 17 (moving limits), 06 Video 12 (the fee), 09 VSL #5 (skill for life), 10 VSL #1 (45 rules), 11 Video 14 (small transaction), 12 Video 6 (transaction activity), 17 Video 13 (fine print). Skipped: the credit-repair timeline clips and VSL #3 (bankruptcy-removal claims), since CCE isn't credit repair and never promises outcomes.
- Full steps: `motion-kit/README.md` → "Footage tests".

## Delivery
- Look at stills of every changed beat before rendering; look at one frame of the final MP4 after.
- Never overwrite: bump the version (`_vNN_`) and keep old files. Brand versions go to `motion-tests/brand/`, originals to `motion-tests/<NN-style>/` on Uriel's Mac.
- After delivering, reply with what changed in a few lines and the folder path; no long recaps.

## Compliance in graphics
- Read `business/compliance-and-legal.md` first. No guarantees; not credit repair.
- No $ amounts in graphics. "0%" is an intro period.
- Show "Individual results vary. Education only." during member-result claims; the end card carries the full disclaimer.

## Per-style notes
- **04 Instructional Diagrams** — print paper, worn ink; continuous hand-drawn baton morphs.
- **05B Toy Brick Multicolor (3D)** — real brick construction rules (cards = plates covered in tiles, open studs to attach things, documents built from plates and tiles, loose offset pile). Built bank and sun. No red arrows: yellow comet trails behind moving bricks, ink pop lines on landings. Captions are a plain yellow pill (no arrow box). Big numbers sit in one fixed top-centre slot.
- **06 Money Green** — linen texture, dot-matrix and halftone sprites, camera push-through. 06B is the same film recoloured to blue.
- **09 Desktop Mind** — must look and feel like a real Mac: apps that match the concept (Calculator, Calendar, Photos, Finder). Gradient wallpaper with the CCE badge. File images generated with Nano Banana 2.1 must look like iPhone photos.
- **10 Odd One Out** — imitate the Visualize Value animation style: pure black, thin white geometric line diagrams, small uppercase labels (the one place small labels were accepted; keep them minimal), conceptual metaphors (containers, wedge, distribution, orbit, path, fan, exponential curve). Solid vs outline marks the one thing that matters. Graphics of separate ideas never overlap (several ideas can share one graphic if it stays legible).
- **11 Vox Explainer** — stop-motion collage, not floating images: pieces pushed on in held steps (12 per second), slight boil, no bounce. Handwriting writes on letter by letter. Hand-made cuts only: scissor polygons (no perfect masks), paper scraps cut with straight scissor cuts (no torn edges), square prints with crooked borders, close-up crops of just the important part. Paper textures from Nano Banana Pro; cards and props from GPT Image with **transparent background**, then given a hand-scissored polygon paper margin. Shadows are hard and close (paper lies on the surface). Marks over images use a red chisel-tip marker, checked so each mark sits on its subject (circles around faces, not across them); blue ballpoint handwriting stays on paper. No serif fonts (Anton for headlines). No halftone/print effect on the photos and no unfold effect.
- **12 Soft Systems** — blues only (royal / azul rey, sky / cielo, teal, navy, periwinkle, ice). Glowing pills, dashed paths with square nodes. Images are rectangle tiles with a transparent GPT object centred inside (blue-toned) and a grain pass on top; images always connect with the light-beam triangle polygons (no other line styles). Type tracking -2%. Glass icons generated in the same material as the pills. Icons must read clearly (not near-invisible glass). Background motion is minimal: slow faint rings only. No contour/topo textures. Element drift must stay smooth through layout changes (no jumps). Sans fonts only (Inter).
- **16 Board Game (original, no reference)** — an original property-trading board game (no third-party names, tokens or mascots): mint board of spaces named for the script's ideas, a pawn hopping on the beats, the board turning at corners, dice, houses/hotel. Cards follow the classic chance-card look: landscape pale yellow / orange stock, "PLAYBOOK" header, bold geometric sans (Jost) title and footer on the left, plain black pen line drawings on the right (no fills, no shading; GPT Image, transparent). Play-money bills carry no numbers or currency symbols. Characters must be clearly original (no top-hat moustache gentleman or other known mascots).
- **17 Brand Native (no reference, built only from the CCE Brand Style Guidelines 2025)** — black ground with background B from the HTML background tests (twisted light sheets of fine lines plus a dot band across the middle of the panel, at 45% opacity so content reads first; no bright core line); gold metal plaques with chamfered corners and bolts (the metal logo) hold the key words and numbers; ANTON caps headers, no small letterspaced labels or labels between rules (user dislikes them: all secondary words are Anton, tracking about 1px, light blue inside plaques); white neon tube type for single key moments (NEXT DAY, 0%, 7–21X) per the Neoneon rule; white brush swooshes from the cover. No small step text at the top (removed on feedback). Cards are members cards (no numbers) in black, blue and Playbook faces with gold edges. Gold seam line between motion and founder. The real Have Heart Two and Neoneon font files were not available, so neon is drawn as tube strokes on Anton and the brush is drawn in code.
- **05B Bricks brand:** saturation boosted (brighter brick colours, less sheen, saturate pass on the 3D layer); the brand colours read desaturated under the 3D lighting.
- **15 Retro OS** — 1-bit windows, pixel fonts, zoom rectangles, cursor keyframes.
