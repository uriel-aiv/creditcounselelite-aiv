# Motion QA checklist (run on every delivery)

Purpose: the quality gate every code-rendered CCE motion film passes before it is sent to anyone. It was written from real review feedback, so each line is a mistake that already shipped once.
Source: CCE motion test feedback rounds, Nov 2026. Last updated: 2026-11-25.

## 1. Look at the encoded file, not the code
- Pull a contact sheet from the delivered MP4 at **4 frames per second** (2 fps for long films), cropped to the motion panel, with the timecode burned in:
  `ffmpeg -i film.mp4 -vf "fps=4,crop=720:720:0:0,scale=150:150,drawtext=text='%{pts\:flt}':x=2:y=2:fontsize=11:fontcolor=red,tile=14x6" -frames:v 1 sheet.png`
- Check the **motion-only spans** (founder hidden, panel scaled up) separately at full size. They are where most layout bugs hide.
- Read every frame. A handful of stills is not QA.

## 2. Layout
- [ ] No text touches or crosses a box, card or frame edge; nothing sits on the frame edges.
- [ ] No text overlaps another text or an object, including **mid-transition** and while accents move past it.
- [ ] Labels are measured and fitted to their space; box numbers clear of icons.
- [ ] Strike-throughs and Xs are centred on X and Y of their target (measured from glyph or object bounds) and **stay on until their scene leaves**.
- [ ] Text never appears before the object it names, and never lingers after it is gone.
- [ ] The founder's face is in frame in every split and full shot (face-tracked crop).

## 3. Motion
- [ ] Every spoken idea moves something on screen. Nothing sits idle for more than about 1.5 s.
- [ ] Physical objects obey physics: gravity drops accelerate, landings squash and settle, stacks move as one body, nothing passes through anything, a leaving object is gone before the next one falls into its space.
- [ ] Builds are visible: models assemble part by part (bottom-up) rather than popping in whole.
- [ ] 2D accents (starbursts, rings, pops, trails) animate **in and out** within about a second. Trails are short and vanish on landing.
- [ ] Figures enter from the ground or the side of the subject, never falling into frame from the edge.

## 4. Sound
- [ ] Every landing, hop, build step and key word has its sound, on the exact frame. Generate the sound list from the same timing constants as the picture.
- [ ] Repeated sounds vary (pitch steps, alternate voices) so a build reads as rising, not as a machine gun.
- [ ] Mix: -14 LUFS; SFX at -9 dB under podcast voice, -12 dB under VSLs.

## 5. Compliance (see `../business/compliance-and-legal.md`)
- [ ] No "$" in graphics or captions; coins carry no currency symbol.
- [ ] "Individual results vary. Education only." is on screen during claims.
- [ ] No promises; CCE is not credit repair.

## 6. Then deliver
- [ ] Pull one frame from the final MP4 and check it.
- [ ] Bump the version (`_vNN_`); never overwrite.
- [ ] Record new feedback in `code-motion-tests.md`, update the film index in `motion-kit/README.md`, commit and push.
