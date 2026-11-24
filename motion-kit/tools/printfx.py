# Print treatments for the Vox prints: halftone, duotone halftone, screen print, distressed copy. Deterministic.
import os
FILMS = os.environ.get('CCE_FILMS', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'films'))  # motion-kit/films
import sys, math, numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageEnhance
SRC = FILMS + '/cce-desktop/assets/files/'; OUT = FILMS + '/cce-vox/assets/prints/'
N = 900; CREAM = (242, 236, 222); INK = (24, 24, 26); BLUE = (37, 71, 217); YEL = (246, 214, 52)
rng = np.random.default_rng(7)
def load(k):
    im = Image.open(SRC + k + '.jpg').convert('RGB').resize((N, N), Image.LANCZOS); return im
def paper(seed):
    r = np.random.default_rng(seed); a = np.ones((N, N, 3)) * np.array(CREAM)
    a += r.normal(0, 4, (N, N, 1)); return a
def dots(gray, cell, angle, gain=1.0, seed=0):
    """gray 0..1 (1 = ink). returns mask 0..1 of round dots on a rotated grid."""
    h, w = gray.shape; yy, xx = np.mgrid[0:h, 0:w].astype(float)
    ca, sa = math.cos(angle), math.sin(angle); u = (xx * ca + yy * sa) / cell; v = (-xx * sa + yy * ca) / cell
    fu, fv = u - np.floor(u) - 0.5, v - np.floor(v) - 0.5; d = np.sqrt(fu * fu + fv * fv)
    # sample darkness at the cell centre
    cu, cv = np.floor(u) + 0.5, np.floor(v) + 0.5; cx = (cu * ca - cv * sa) * cell; cy = (cu * sa + cv * ca) * cell
    g = gray[np.clip(cy, 0, h - 1).astype(int), np.clip(cx, 0, w - 1).astype(int)]
    r = np.sqrt(np.clip(g * gain, 0, 1)) * 0.62
    return np.clip((r - d) * cell * 0.9 + 0.5, 0, 1)
def tone(im, contrast=1.3, bright=1.0):
    im = ImageEnhance.Contrast(im).enhance(contrast); im = ImageEnhance.Brightness(im).enhance(bright)
    return 1 - np.asarray(ImageOps.grayscale(im), float) / 255
def distress(a, seed, amount=1.0):
    r = np.random.default_rng(seed)
    # ink dropouts: blotchy low-frequency noise
    n = Image.fromarray((r.random((N // 18, N // 18)) * 255).astype('uint8')).resize((N, N), Image.BICUBIC).filter(ImageFilter.GaussianBlur(6))
    yy, xx = np.mgrid[0:N, 0:N]; edge = np.minimum(np.minimum(xx, N - xx), np.minimum(yy, N - yy)) / N
    thr = 0.93 - 0.06 * amount + edge * 0.25
    m = (np.asarray(n, float) / 255 > thr)[..., None]
    a = np.where(m, a * 0.45 + np.array(CREAM) * 0.55, a)
    # specks + scratches
    for _ in range(int(350 * amount)): y, x = r.integers(0, N, 2); a[y:y + 2, x:x + 2] = CREAM if r.random() < 0.6 else INK
    img = Image.fromarray(np.clip(a, 0, 255).astype('uint8')); dr = ImageDraw.Draw(img)
    for _ in range(int(4 * amount)):
        x = r.integers(0, N); dr.line([(x, 0), (x + r.integers(-60, 60), N)], fill=(225, 219, 205), width=1)
    return img
def halftone_bw(k, seed):
    g = tone(load(k), 1.35); a = paper(seed); m = dots(g, 7.5, math.radians(45), 1.1)[..., None]
    a = a * (1 - m) + np.array(INK) * m; return distress(a, seed, 0.6)
def duotone(k, seed):
    im = load(k); g = tone(im, 1.25); a = paper(seed)
    mb = dots(np.clip(g * 1.1, 0, 1), 8, math.radians(15), 1.0)[..., None]
    mk = dots(np.clip((g - 0.35) * 1.6, 0, 1), 8, math.radians(75), 1.0)
    mk = np.roll(np.roll(mk, 3, 0), -2, 1)[..., None]                    # misregistration
    a = a * (1 - mb * 0.9) + np.array(BLUE) * mb * 0.9; a = a * (1 - mk) + np.array(INK) * mk
    return distress(a, seed, 0.7)
def screenprint(k, seed):
    im = load(k).filter(ImageFilter.MedianFilter(5)); g = tone(im, 1.3, 1.18)
    a = paper(seed)
    def layer(mask, col, dx, dy, op=0.92):
        mask = np.roll(np.roll(mask, dy, 0), dx, 1)
        rough = Image.fromarray((mask * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2))
        mm = (np.asarray(rough, float) / 255 > 0.5)[..., None] * op
        return mm, col
    out = a.copy()
    for mask, col, dx, dy in [((g > 0.14).astype(float), YEL, 0, 0), ((g > 0.5).astype(float), BLUE, 5, -3), ((g > 0.78).astype(float), INK, -3, 4)]:
        mm, c = layer(mask, col, dx, dy); out = out * (1 - mm) + np.array(c) * mm * 0.97 + out * mm * 0.03
    return distress(out, seed, 1.0)
def copy_distress(k, seed):
    g = tone(load(k), 2.0, 1.05); r = np.random.default_rng(seed)
    g = np.clip(g + r.normal(0, 0.12, g.shape), 0, 1); g = (g > 0.5).astype(float) * 0.92
    g = np.asarray(Image.fromarray((g * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.8)), float)[..., None] / 255
    a = paper(seed); a = a * (1 - g) + np.array(INK) * g
    return distress(a, seed, 1.2)
JOBS = {'card_navy': duotone, 'card_gold': screenprint, 'planner': halftone_bw, 'man': screenprint, 'woman': duotone,
        'paperwork': copy_distress, 'folder_docs': halftone_bw, 'card_black': halftone_bw, 'card_white': copy_distress, 'card_green': screenprint,
        'wing': screenprint, 'beach': duotone, 'pool': halftone_bw}
for i, (k, fn) in enumerate(JOBS.items()):
    fn(k, 10 + i).save(OUT + k + '.jpg', quality=90)
print('ok', len(JOBS))
