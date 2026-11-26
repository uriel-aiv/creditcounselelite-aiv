# 18C Card Structures 3D — style playbook

Purpose: make a new clip in the 18C Card Structures 3D style at the approved quality.
Source: CCE code motion tests, 2026-11-25. Last updated: 2026-11-25.

**Films:** `films/cce-r2-18c-cards3d` (Video 17, v03) and `films/cce-r2-18d-cards3d` (Video 14, v02). Copy `cce-r2-18d-cards3d`.
Reference: a house of playing cards. Same white credit cards on riso blue as 18, built into real 3D structures; keep the flat ribbon where it reads better (the ring under the hero card).

## The look
Every card is a true 3D plane: white front with card art (chip, numbers, rings, optional gold tag), blue back with a dark magnetic stripe and a white signature strip. One key light (high, front-left), brightness from the face angle; painter-sorted by depth. All shadows are projected onto the ground along the light, drawn opaque on one layer, then laid down at 26% so overlaps don't darken. Mirrored art is flipped so text always reads.

## Engine
- Vector helpers and `CAM`/`proj`/`VIEW`/`LIGHT`; structures are lists of N card frames: `bank` (stepped base of flat cards, four standing columns, beam, two-card pediment at ~30°), `pile` (flat cards 0.035 apart, jitter and yaw), `house` (four levels of leaning pairs at ~19° from vertical with floor cards), `ring`, `TALL`, `SPLIT`/`MERGED`.
- Motion: `drop` (bottom-up with gravity and settle), `fly` (staggered flocks, low arc, whole tumbles so cards land in the right orientation), dealing one by one, the 0% card turning on the spot, riffle shuffle merge, house placed card by card (top pair lands on "stack it up").
- Camera framings are fitted to the actual scene at key times (`framesAt(t)`), so new scenes frame themselves.

## Must
- Interest or cost = Playbook maroon on the cards themselves.
- Claims about what a bank will do are hedged ("THEY MAY REVERSE IT").
- Flight arcs stay below the headline (lift ≤ ~1.4 units).
- Start the first build after the founder panel finishes sliding away (≥ 1.15 s) or cards appear at the frame edge.

## Example (Video 14)
Small cards bounce off the card (blocked transactions); it lies down and the balance is dealt onto it under a floating gold "LIMIT" card, leaving a visible gap; two cards fill the gap; maroon interest cards rain on top and push the limit card up; "all of it" turns the balance maroon bottom to top; the pile topples in the host shot; the card stands up on "call in" and rocks on "complain"; everything rewinds into a white pile.
