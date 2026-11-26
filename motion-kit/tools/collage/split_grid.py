# Split one generated image of several flat items on white (a grid of polaroids, buildings side by side, coins) into
# one PNG per item, cutting on the white gutters between them. Used by style 20 (Photo Collage 2.5D).
# Usage: python3 split_grid.py <grid.png> <out-dir> <prefix> [--cutout] [--min 60] [--white 240] [--max 560]
#   --cutout  also make the white around each item transparent (for items that are not rectangles, e.g. buildings)
#   --white   brightness that counts as gutter (raise to ~246 when the items themselves have white borders, e.g. polaroids)
# Items are numbered row by row, left to right: <prefix>0.png, <prefix>1.png, ...
import sys
import numpy as np
from PIL import Image

args = sys.argv[1:]
src, out, pre = args[:3]
opt = lambda k, d: type(d)(args[args.index(k) + 1]) if k in args else d
minlen, bgth, maxs = opt('--min', 60), opt('--white', 240), opt('--max', 560)


def runs(mask):   # contiguous True runs as (start, end)
    r, s = [], None
    for i, v in enumerate(mask):
        if v and s is None: s = i
        if not v and s is not None: r.append((s, i)); s = None
    if s is not None: r.append((s, len(mask)))
    return r


im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(int); bg = a.min(2) >= bgth
boxes = []
for c0, c1 in [r for r in runs(bg.mean(0) < 0.985) if r[1] - r[0] > minlen]:          # columns that hold items
    for r0, r1 in [r for r in runs(bg[:, c0:c1].mean(1) < 0.985) if r[1] - r[0] > minlen]:   # rows inside them
        boxes.append((c0, r0, c1, r1))
boxes.sort(key=lambda b: (b[1] // 200, b[0]))
for j, b in enumerate(boxes):
    c = np.asarray(im.crop(b).convert('RGBA')).copy()
    if '--cutout' in args: c[..., 3] = np.where(c[..., :3].min(2) >= bgth, 0, 255)
    p = Image.fromarray(c); p.thumbnail((maxs, maxs), Image.LANCZOS); p.save(f'{out}/{pre}{j}.png')
print(pre, len(boxes), 'items')
