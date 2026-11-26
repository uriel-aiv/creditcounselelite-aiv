import sys, json
from PIL import Image, ImageDraw
# Usage (from motion-kit/): python3 tools/pixel/waypoints.py <room name or path to a retraced room png> '[[x,y],...]' out.png
# Draws each character's 22x44 footprint (feet at x,y on the 216 grid) over the gridded room, to check nobody stands in furniture.
room, pts, out = sys.argv[1], json.loads(sys.argv[2]), sys.argv[3]
import os
src = room if room.endswith('.png') else next((p for p in (f'films/cce-ft19c-pixel/assets/bg/{room}.png', f'films/cce-ft19b-pixel/assets/bg/{room}.png', f'films/cce-ft19-pixel/assets/bg/{room}.png') if os.path.exists(p)), room)
S = 3; im = Image.open(src).convert('RGB').resize((216 * S, 216 * S), Image.NEAREST); d = ImageDraw.Draw(im, 'RGBA')
for g in range(0, 216, 10):
    c = (255, 255, 255, 90 if g % 50 else 160); d.line([(g * S, 0), (g * S, 216 * S)], fill=c, width=1); d.line([(0, g * S), (216 * S, g * S)], fill=c, width=1)
    if g % 20 == 0: d.text((g * S + 2, 2), str(g), fill=(255, 255, 0)); d.text((2, g * S + 2), str(g), fill=(255, 255, 0))
for i, (x, y) in enumerate(pts):
    d.rectangle([(x - 11) * S, (y - 44) * S, (x + 11) * S, y * S], outline=(255, 0, 255, 255), width=2, fill=(255, 0, 255, 50)); d.text(((x - 10) * S, (y - 42) * S), str(i), fill=(255, 255, 255))
im.save(out)
