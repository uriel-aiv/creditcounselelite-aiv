# Code motion tests — founder split-screen rules and per-style notes

Purpose: the rules and decisions behind the code-rendered CCE motion tests, so any future build follows the same direction.
Source: the creative lead's direction in chat, Nov 19–25 2026. Last updated: 2026-11-25 (footage rounds 1–2, QA pass, Toy Brick physics).

**To build or change a film, use `motion-kit/` (code, art, tools) and follow `motion-kit/README.md` step by step.** This file holds the rules; add every new piece of feedback here in the same turn you act on it.

## Format
- Founder split-screen. Motion on the **top half**, founder on the **bottom half**.
- Key spoken lines go from split to **full-screen founder**; overlays on full screen stay minimal and non-invasive.
- First drafts: 720x1280 vertical, 23.976 fps. Test footage: `highlights/highlights_1x1.mp4`.
- Motion is code-rendered (canvas / three.js). Never generate video in AIVideo unless the creative lead asks for it. AIVideo reference images are style references only: recreate their texture, treatment and vector style in code.

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
- Never overwrite: bump the version (`_vNN_`) and keep old files. Brand versions go to `motion-tests/brand/`, originals to `motion-tests/<NN-style>/` in the team's shared CCE folder (`$CCE_ROOT`).
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
- **04 Instructional Diagrams (round 3 feedback, "improve")** — the pictogram figure and props fill the panel (figure about 1.3x, thought cloud, magnifier and card larger); bigger labels (84–96 px). Thought bubbles must never touch the header. Gauges carry end labels (300 / 850). When a sheet lists items (the six boxes), the camera zooms into each item as it is named (about 2x, clipped to the motion panel so it never covers the founder), then moves to the next one; headers hide while zoomed.
- **06 Money (round 3 feedback, "improve")** — halftone sprites in white (not mint) so they read on the blue; coins carry an inner ring, never a currency symbol. Every element is big: hero objects at 3x+, key numbers 300–380 px, labels 84–120 px. Each line of the script gets its own visual change (card → fee chip → row of cards; banks → 12-month ring; meter slides 3% → 5%). Moving objects travel to where their meaning lands (coins pour into the paid bar) and their paths never cross text. Meters are thick framed bars with big tick labels.
- **QA rule (all styles)** — before delivery, check the encoded file at 2–4 frames per second, not just a few stills: look for strikes or crosses that vanish before their scene ends, idle stretches over about 1.5 s with nothing moving, text that appears before the object it names, and objects that touch or overlap.
- **05B Toy Brick: physics and building (round 3 feedback)**
  - Builds happen part by part, bottom-up. Each part falls under gravity (accelerating, not eased), lands on its studs with a short damped squash, and gets its own click; pitch rises as the model grows.
  - A model that is leaving must be gone before the next one starts to fall; no two objects share space at any moment.
  - Stacks move as one body: plates above ride with the plate below, and gaps never open inside a stack.
  - Comet trails are short (tail about a third of the path behind the head) and disappear the instant the object lands. Ink pops last about 0.3 s.
  - Starbursts and rings grow in and shrink out within about a second; no 2D accent sits on screen unchanged.
  - Every spoken idea moves something (a hop on "0% card", a ripple up the stack on "20,000", the yellow brick rocking on "mid to lower"). Figures spring up from the ground instead of falling into frame from the edge.
  - The sound list is generated from the same timing constants as the picture, so every landing, hop and build step has a sound exactly on its frame.
- **Text layout (all styles, round 3 feedback)** — every label is placed from measured bounds, never by eye:
  - Labels inside a box or card are measured (`measureText`) and shrunk to fit the space left of or right of the icon with a margin. A label never touches or crosses its box edge.
  - Box numbers sit in their corner, clear of the icon, so the icon is scaled down and moved in.
  - A headline or caption keeps clear of the object it names and of any moving accents (coins, rings, trails). Moving accents travel on paths that stay outside the text's bounds for the whole move, not only on the frame that was checked.
  - In motion-only moments the panel is scaled up (about 1.25x in the 2D styles), so check those spans separately: things that fit in the split layout can collide there.
- **06 Money, motion-only clock** — the clock is 1.4x at the top half and the coins orbit it at a fixed radius outside the face; "REALLY QUICK" sits below the orbit.
- **04 Instructional, six-box sheet** — box number inset from the corner (clear of the box line by at least its own stroke width; the drawn lines wobble), icon in the left half at 0.78x, label fitted into the right half and centred on the box's height.
- **18 Card Ribbon (new style, 2026-11-25)** — reference: an isometric "$" built from hundreds of envelopes standing edge to edge on riso blue. Our version uses credit cards and never draws a currency symbol. Film: `motion-kit/films/cce-r2-18-cards` (Video 17).
  - **Look:** flat riso blue background with dark specks heavier at the edges and fine grain. White cards with rounded corners, outlined in deep ink blue. Card art (chip, number groups, name line, network rings) appears only where a face is big enough to read. A soft contact shadow sits under each card. Hero cards are big single cards; the 0% card carries a gold tag with "0%".
  - **Geometry:** every unit is a card 1.0 wide x 0.63 tall, standing perpendicular to its path at 0.1 spacing. Shapes are strokes in glyph space, mapped to the ground and turned 15° off the isometric axes so straight ribbons show depth instead of going edge-on. Cards are depth-sorted. Card art always reads left to right.
  - **Motion vocabulary:**
    - Build: cards stand up in a domino wave along the strokes.
    - Riffle: a lift wave runs through a held shape so it never sits still.
    - Flight: all 600 cards fly in a staggered flock with a low arc to form the next shape; spare cards shrink into a pile.
    - Train: windows of cards run along a faint ghost track from card A to card B, B pulses on each arrival, and A shrinks while B grows.
    - Pulses: lift waves run down the branches of a merge into the hero card.
    - Stacks: cards land flat on piles that rise like a staircase.
  - **Framing:** each shape is auto-fitted (about 860 x 470 px) below the headline, centred on the panel. The disclaimer sits under the headline, never at the seam, where the caption pill covers it.
  - **Sound:** card flicks follow the build wave, a whoosh and a run of landing ticks accompany each flock, and riffles and clicks mark each train arriving.
  - **Second test (Video 12, film `cce-r2-18b-cards`):** "3%" builds; a hero card with a gold "3%" tag pops on "fee"; one bank becomes three banks on "other banks"; a clock ring with 12 month ticks sweeps on "the last year"; "5%"; then on "flat fee" the cards fly into one row and topple flat like dominoes. Shapes, timings and sounds all live in the film; the engine (card drawing, shape sampling, flock morph, ripple, build, auto-fit) is identical in both films, so copy a `cce-r2-18*` film to start a new clip.
- **18C Card Structures 3D (variant of 18, 2026-11-25)** — reference: a house of playing cards. Same white credit cards on riso blue, but built into real 3D structures; the card ribbon is kept wherever a flat ribbon reads better (the ring under the hero card). Film: `motion-kit/films/cce-r2-18c-cards3d` (Video 17).
  - **Cards:** every card is a true 3D plane with a long axis, a short axis and a scale. The front is white with card art (chip, numbers, rings, optional gold tag); the back is blue with a dark magnetic stripe and a white signature strip. Each card is lit by one key light (high, front-left), with brightness from its face angle, and painter-sorted by depth toward the viewer. All shadows are projected onto the ground along the light, drawn opaque on one layer, then laid down at 26% so overlaps don't darken. Mirrored art is flipped so text always reads.
  - **Structures:**
    - bank: a stepped base of flat cards, four cards standing on end as columns (fronts to the viewer), a beam of flat cards and a pediment of two cards leaning at about 30°;
    - piles: flat cards 0.035 apart, with slight jitter and yaw;
    - house of cards: four levels of leaning pairs at about 19° from vertical, with flat floor cards between levels.
  - **Motion:**
    - parts drop in bottom-up with gravity and a settle;
    - cards fly in staggered flocks with a low arc and whole tumbles, so they land in the right orientation;
    - the transfer deals cards one by one from pile A to pile B, with a tick on each landing;
    - the 0% card turns once on the spot;
    - "20,000" deals a tall pile;
    - "combine" riffles two piles into one;
    - the 0% card drops face up on top;
    - the house of cards is placed card by card, so the top pair lands on "stack it up".
  - **Second test (Video 14, film `cce-r2-18d-cards3d`):**
    - the card blocks new transactions: small cards bounce off it;
    - it lies down and the balance is dealt onto it under a floating gold "LIMIT" card, leaving a visible gap (the availability);
    - two cards (a transaction, a subscription) fill the gap;
    - a tremor builds, then maroon interest cards rain on top and push the limit card up;
    - on "all of it" the whole balance turns maroon from bottom to top;
    - in the host shot the pile topples, and three small piles fall in turn for "a few times";
    - the card stands up on "call in" and rocks on "complain";
    - everything rewinds into a white pile while the interest cards lift away.
  - **Shared rules:**
    - interest or cost is shown with playbook maroon on the cards themselves;
    - a claim about what a bank will do is hedged ("THEY MAY REVERSE IT");
    - camera framings are fitted to the actual scene at key times (`framesAt(t)`), so new scenes frame themselves.
  - **Keep in mind:**
    - flight arcs must stay below the headline (lift no more than about 1.4 units for the transfer);
    - start the first build after the founder panel has finished sliding away (≥1.15 s on this clip), or cards appear at the frame edge.
- **19 Pixel Wealth (new style, 2026-11-25)** — "ultra wealthy" life in Habbo-style isometric pixel art, with no realistic people. Film: `motion-kit/films/cce-ft19-pixel` (Video 3, sign-up bonuses).
  - **Pipeline:**
    - **Rooms:** generated with GPT Image 2.6 Sunburst in AIVideo (Standard, high, 7 credits each): penthouse, private vault, private airfield, island villa. Prompts ask for Habbo-style 2:1 isometric, 1-px dark outlines, flat 2–3 tone shading, no people, no text, no logos, no currency symbols.
    - **Retrace:** each room is put on a true pixel grid with `tools/pixel-retrace.py in.png out.png 216 40` (box-average to 216x216, 40-colour k-means palette, no dithering, stray single pixels removed).
    - **Characters, props, headlines and transitions are drawn in code** on the same grid, so they animate frame-exactly:
      - the avatar is a code-drawn sprite: big head, black sunglasses, slicked hair, navy blazer, gold chain;
      - animations: walk (4 frames), wave (2), cheer (2), carry (4);
      - props: case, banded cash brick (plain green, no symbols), gold bar, black card, jet, thought bubble, sparkles.
    - **Sprite sheet:** `node tools/sprite-sheet.mjs films/cce-ft19-pixel out.png` exports the avatar's sheet; the current one is `assets/avatar-sprite-sheet.png`.
  - **Look:**
    - one art pixel is 6x6 screen pixels;
    - the camera window is 180 art px wide and follows the avatar in whole-pixel steps (never smoothed);
    - rooms change with a 4x4 Bayer dither dissolve;
    - headlines are a 5x7 pixel font on a navy Habbo notice banner with a gold top rule, typed in letter by letter;
    - no motion blur (samples 1), and the seam is a gold rule.
  - **Round 2 feedback ("choppy in and out; zoom; more movement"):**
    - **Camera:** eased per-scene keys `[t, cx, cy, zoom]`, interpolated in log-zoom with a slow drift, drawn with nearest-neighbour so pixels stay hard. It pushes in before each cut and pulls out after.
    - **Cuts:** a retro mosaic (the frame drops to big blocks and builds back up over ±0.16 s); no dither dissolve.
    - **Ambient life in every room**, from masks found in the retraced art:
      - water shimmers in moving bands;
      - windows and lamps flicker;
      - glints travel across gold;
      - twinkle sprites appear;
      - birds flap across the sky.
    - **Objects move:**
      - cash bricks drop with gravity and bounce;
      - notes flutter down on "free cash";
      - confetti bursts on cheers;
      - the statement shakes as it prints;
      - the case bobs as he walks.
    - **Banners:** spring down, type in, then lift and fade out (never reverse-type).
    - **Framing:** keep the avatar's head below the banners (avatar in the lower 60% of the panel). The disclaimer sits above the caption pill.
  - **Keep in mind:**
    - banners auto-shrink to fit the 180-px window;
    - walking paths must keep the avatar's head inside the window;
    - a cross over a thought is drawn on the grid and centred on the plane.
