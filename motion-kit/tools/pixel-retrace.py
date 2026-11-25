# Retrace an AI "pixel-style" image onto a true pixel grid: area-average down to the grid, then quantize to a small palette
# (k-means, no dithering) and remove single stray pixels (majority of 8 neighbours). Usage: retrace.py in.png out.png grid colors
import sys
from PIL import Image
from collections import Counter
src, dst, g, n = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
im = Image.open(src).convert('RGB').resize((g, g), Image.BOX)
q = im.quantize(colors=n, method=Image.Quantize.KMEANS if hasattr(Image.Quantize,'KMEANS') else 2, kmeans=4, dither=Image.Dither.NONE)
px = q.load(); W, H = q.size; out = q.copy(); po = out.load()
for y in range(1, H - 1):
    for x in range(1, W - 1):
        c = px[x, y]; nb = [px[x + dx, y + dy] for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy]
        if c not in nb: po[x, y] = Counter(nb).most_common(1)[0][0]
out.convert('RGB').save(dst)
