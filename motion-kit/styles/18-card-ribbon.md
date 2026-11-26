# 18 Card Ribbon — style playbook

Purpose: make a new clip in the 18 Card Ribbon style at the approved quality.
Source: CCE code motion tests, 2026-11-25. Last updated: 2026-11-25.

**Films:** `films/cce-r2-18-cards` (Video 17 "moving limits", v03) and `films/cce-r2-18b-cards` (Video 12 "the fee", v01). The engine is identical in both; copy `cce-r2-18b-cards`.
Reference: an isometric "$" built from hundreds of envelopes standing edge to edge on riso blue. Ours uses credit cards and never draws a currency symbol.

## The look
Flat riso blue background with dark specks heavier at the edges and fine grain. White cards with rounded corners outlined in deep ink blue, a soft contact shadow under each. Card art (chip, number groups, name line, network rings) only where a face is big enough to read. Hero cards are big single cards; the 0% card carries a gold "0%" tag.

## Assets
None generated: everything is code (`drawCard`, `cardFrame`, `cardShadow`, textures in `buildTextures()`).

## Engine (film.js sections)
- **Card world:** every unit is a card 1.0 wide x 0.63 tall standing perpendicular to its path at 0.1 spacing. Shapes are strokes in glyph space (`seg`, `arc`, `bez`, `sampleStroke`, `shape`), mapped to the ground and turned 15° off the isometric axes so straight ribbons show depth. Depth-sorted; card art always reads left to right.
- **Shapes:** `buildShapes()` makes the list for the clip (`BANK`, `ARC`, `ZERO_PCT`, `MERGE`, piles...). Each shape is auto-fitted (`fit`, about 860x470 px) below the headline, centred on the panel.
- **Motion vocabulary (`state(t)`):** build (domino wave stand-up), riffle (lift wave through a held shape), flight (`morph`: all 600 cards fly in a staggered flock on a low arc to the next shape; spares shrink into a pile), train (windows of cards run along a ghost track from A to B; B pulses on arrival), pulses down merge branches, stacks (cards land flat on rising piles). Timing constants `T_BUILD`, `T_RIFFLE`, `T_M`, `T_FLOW`, `T_HERO`, `T_STACK`.
- **Camera:** `CAMK` + `camAt(t)`.
- **Sound:** `buildHits()` from the same constants: card flicks follow the build wave; a whoosh and landing ticks per flock; riffles and clicks per train arrival.

## New clip, step by step
1. `mkft.py films/cce-r2-18b-cards <clip> films/cce-r2-18x-cards`.
2. For each idea, choose a shape and a move (build, flock to the next shape, train, merge, stack, topple). Write the strokes in `buildShapes()` and the timeline constants.
3. Labels in `labels()`: only key numbers/terms; the disclaimer sits under the headline, never at the seam (the caption pill covers it).
4. Stills at every move, render, QA.

## Examples (Video 12)
"3%" builds; a hero card with a gold "3%" tag pops on "fee"; one bank becomes three on "other banks"; a 12-tick month ring sweeps on "the last year"; "5%"; on "flat fee" the cards fly into one row and topple like dominoes.
