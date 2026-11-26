# Image prompts — 20 Photo Collage 2.5D (scenes, clean plates, flat props)

Purpose: the exact prompts and templates that made the Photo Collage layers, so new clips match.
Source: AIVideo project "Final CCE Directions" `29c40ecf12724d03bec9c2e5cada7c31`, 2026-11-25. Last updated: 2026-11-25.

**Model:** Nano Banana 2.1 (`nano-banana-2-1`), resolution **2K** (6 credits; 1K is 4), orientations as noted. Playbook: `motion-kit/styles/20-photo-collage-2-5d.md`. After generating: `motion-kit/tools/collage/make_layers.py` (cut-outs), then check each over a coloured background.

## 1. Scene (a person in a place) — template, 9:16
```
Cinematic photograph, vertical frame. <WHO, age, wardrobe> <DOING something still and readable: standing, holding X toward the camera, sitting, raising a glass> in <PLACE with 3–5 concrete details>. Full body visible from the knees up, centered in the lower two thirds, clear space above his head. <LIGHT: warm practical lamp light / golden hour / neon and fluorescent>, shallow depth of field, 35mm film look, subtle grain. No text, no logos<, no readable signs>.
```
- Recurring character: pass the first hero image in `reference_ids` (`slotField: "image_urls"`) and start with "The same man from the reference image" (works for "about 20 years younger" too).
- Never ask for walking poses you would have to animate: people stay still in this style.

## 2. Clean plate — template (reference = the scene image), same orientation
```
Edit this image: remove <the man and the cards he is holding | the man and his suitcase, and his shadow> completely. Fill the space with what would be behind him: <the desk, the floor, the window with the skyline...>, continuing naturally. Keep everything else exactly the same: same framing, same camera, same lighting, same colors, same grain. No people, no text.
```

## 3. Flat prop — template, 1:1 (or 16:9 / 3:4 for long or tall props)
```
Flat front view of <a single OBJECT with materials and details>, perfectly straight and level, orthographic like a scan, no perspective, no tilt, no shadow, centered on a pure white background. No logos, no text, no numbers<, no dollar signs>.
```
Use "Flat top-down view of … flat lay" for things lying on a desk. Grids: "<N> separate <items> laid out in a neat <rows by cols> grid with white gaps between them" (split later on the gutters). Clouds: "… isolated on a pure black background" (luminance → alpha).

## Prompts used (2K)
**Scenes**
- Office (9:16): Cinematic photograph, vertical frame. A confident man in his 40s in a tailored navy suit and white shirt stands behind a dark walnut executive desk in a modern high-rise office, holding a fan of five matte black and gold credit cards toward the camera with one hand, slight smile. Floor-to-ceiling window behind him with a soft-focus city skyline at dusk. Full body visible from knees up, centered, clear space above his head. Warm practical lamp light, teal-blue window light, shallow depth of field, 35mm film look, subtle grain. The cards have no logos, no text, no numbers. No text anywhere in the image.
- Tarmac (9:16): Cinematic photograph, vertical frame. A man in his 40s in a navy suit, sunglasses on, walks toward the camera across a private airport tarmac pulling a black carry-on suitcase, a white private jet parked behind him with its stairs down, golden hour sun low behind the jet, long shadows, warm haze. Full body visible, centered, clear sky above. Shallow depth of field, 35mm film look, subtle grain. No logos or registration text on the jet, no text anywhere. *(Use a still pose next time; the walk is never animated.)*
- Villa (9:16): Cinematic photograph, vertical frame. A relaxed man in his 40s in a white linen shirt and sunglasses sits on a white sun lounger beside a turquoise infinity pool at a luxury cliffside villa, raising a glass of iced drink, ocean horizon behind, bright midday tropical light, palm fronds at the frame edge. Full body visible, centered in the lower half, clear sky above. Shallow depth of field, 35mm film look, subtle grain. No text anywhere.
- Empty desk (9:16): Top-down flat lay photograph, vertical frame: an empty dark walnut wooden desk surface filling the whole frame, rich wood grain, a few subtle scratches, soft warm overhead light with gentle vignette at the edges. Nothing on the desk. No objects, no text.
- Diner, younger self (9:16, reference = office man): Cinematic photograph, vertical frame. The same man from the reference image but about 20 years younger (early 20s), working as a busboy in a small worn-out 1990s American diner at night: white t-shirt, dark apron, wiping a formica table with a rag, head slightly down, tired. Full body visible from the knees up, centered in the lower two thirds, clear space above his head. Red vinyl booths, checkered floor, a neon glow through the window, fluorescent light, shallow depth of field, 35mm film look, subtle grain. No text, no signs with readable words.
- Rooftop (9:16, reference = office man): Cinematic photograph, vertical frame. The same man from the reference image, in a navy suit, standing confidently with hands in pockets on a rooftop terrace, behind him a skyline of modern apartment buildings and towers at golden hour. Full body visible from the knees up, centered in the lower two thirds, clear sky above his head. Warm sunlight, shallow depth of field, 35mm film look, subtle grain. No text, no logos.

**Flat props**
- Black card (1:1): Flat front view of a single matte black metal credit card with a gold EMV chip and thin gold edge, perfectly straight and level, orthographic like a scan, no perspective, no tilt, no shadow, centered on a pure white background. No logos, no text, no numbers, no names.
- Gold card (1:1): Flat front view of a single brushed gold metal credit card with a silver EMV chip, … (same tail).
- Coins (1:1): Flat top-down view of five shiny gold coins laid flat and spaced apart in a loose row, each coin seen perfectly face-on as a circle, generic engraved laurel pattern, no text, orthographic, no perspective, no shadow, on a pure white background.
- Banknote (16:9): Flat front view of a single green paper money note with a generic ornamental engraved design, not a real currency, perfectly flat and straight, orthographic like a scan, no perspective, no curl, no shadow, centered on a pure white background. No numbers, no text, no symbols. *(A request for a real US note failed.)*
- Cash stacks (1:1): Product photograph, top-down: three neat stacks of US paper banknotes held by paper bands, slightly fanned, crisp and new, centered on a pure seamless white background, soft even studio light, minimal soft shadow. No text overlays, no dollar signs printed on the bands, plain white bands.
- Statement (3:4): Product photograph, top-down: a single printed credit card statement sheet of paper, slightly curled at one corner, generic layout with a simple wordmark area left blank, rows of transaction lines rendered as illegible grey placeholder text, one line near the middle reading STATEMENT CREDIT in clean bold type, centered on a pure seamless white background, soft even studio light, minimal shadow. No logos, no real bank names, no dollar signs. *(cut with `--solid`)*
- Jet (16:9): Exact side profile view of a white private business jet in flight, flying to the right, perfectly level, landing gear up, orthographic side elevation like a technical photo, no perspective, warm soft light, isolated on a pure white background. No logos, no registration letters, no text. *(It came out facing left; check direction and set the fly-in side to match.)*
- Boarding pass (16:9): Flat front view of a single first class paper boarding pass ticket, perfectly straight and level, orthographic like a scan, no perspective, no curl, no shadow, generic design in navy and gold with the words FIRST CLASS and a barcode, no airline logos, no real names, no dollar signs, centered on a pure white background. *(cut with `--solid`)*
- Watch (1:1): Flat top-down view of a luxury gold wristwatch with a black dial lying perfectly straight, strap extended vertically, dial seen face-on as a circle, orthographic flat lay like a scan, no perspective, no shadow, centered on a pure white background. No brand name, no text on the dial.
- Sunglasses (16:9): Flat front view of a pair of gold aviator sunglasses with dark lenses, perfectly straight and level, symmetrical, arms folded behind, orthographic like a scan, no perspective, no shadow, centered on a pure white background. No logos.
- Passport (3:4): Flat top-down view of a closed dark navy passport with a blank gold ornamental crest, perfectly straight and level, a paper boarding pass sticking straight out of the top, orthographic flat lay like a scan, no perspective, no shadow, centered on a pure white background. No real country names, no airline logos, no text other than generic illegible print.
- Palm frond (1:1): Photograph of a single large green tropical palm frond leaf, backlit by sun, diagonal, isolated on a pure seamless white background, crisp detail.
- Clouds (16:9): Several separate soft fluffy white cumulus cloud puffs of different sizes spaced apart, photographed, isolated on a pure black background, soft wispy edges, no sky color.
- Wallet (1:1): Flat top-down view of an empty open brown leather bifold wallet with nothing inside, perfectly straight, orthographic flat lay like a scan, no perspective, no shadow, centered on a pure white background. No text, no logos.
- Keys (1:1): Flat top-down view of a bunch of four brass house keys on a single ring, laid flat and spread out, orthographic flat lay like a scan, no perspective, no shadow, centered on a pure white background. No text.
- Playbook (3:4): Flat front view of a single black leather notebook, closed, perfectly straight, with the word PLAYBOOK embossed in gold capitals in the center, orthographic like a scan, no perspective, no shadow, centered on a pure white background.
- Paperwork (3:4): Flat top-down view of a thick stack of paper documents and forms held with a black binder clip, the top sheet a generic application form with illegible grey placeholder text and empty boxes, perfectly straight, orthographic flat lay like a scan, no perspective, no shadow, centered on a pure white background. No logos, no real names, no dollar signs. *(cut with `--solid`)*
- Member polaroids (1:1): Flat front view of twelve separate instant-film polaroid photos laid out in a neat 4 by 3 grid with white gaps between them, each polaroid a warm portrait of a different smiling adult (diverse ages and backgrounds), perfectly straight, orthographic like a scan, no perspective, no shadow, on a pure white background. No text written on the polaroids.
- Buildings (16:9): Flat front elevation photographs of three separate modern apartment buildings standing side by side with clear white space between them, each a straight-on facade with balconies and windows, warm golden light, orthographic like an architectural elevation, no perspective, isolated on a pure white background. No text, no signs.
- Calendar page (3:4): Flat front view of a single month page torn from a desk calendar, a clean grid of 30 numbered days with every day blank and one row of small gold coin stickers along the first of the month, generic, no month name, no year, perfectly straight, orthographic like a scan, no perspective, no shadow, centered on a pure white background. No dollar signs. *(cut with `--solid`)*

## Rejected (don't repeat)
- Angled 3/4 product shots of props ("we are imitating flat image style, not isolated 3D assets").
- A real single US banknote (refused by the model).
