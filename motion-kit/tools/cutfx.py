# Hand-made collage pieces for the Vox film: scissor polygons (no perfect masks), torn paper scraps from the
# Nano Banana textures, square prints with crooked white borders, close-up detail cuts. Deterministic.
import os
FILMS = os.environ.get('CCE_FILMS', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'films'))  # motion-kit/films
import numpy as np, cv2, math
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
F = FILMS + '/cce-desktop/assets/files/'; CUT = FILMS + '/cce-vox/assets/cut/'
PAP = FILMS + '/cce-vox/assets/paper/'; OUT = FILMS + '/cce-vox/assets/pieces/'
import os; os.makedirs(OUT, exist_ok=True)
G = FILMS + '/cce-vox/assets/gpt/'
def photo(k, up=2):
    if k.startswith('g_'): up = 1
    im = Image.open((G + k[2:] if k.startswith('g_') else F + k) + '.jpg').convert('RGB'); im = im.resize((im.width * up, im.height * up), Image.LANCZOS)
    im = ImageEnhance.Contrast(im).enhance(1.05); im = ImageEnhance.Color(im).enhance(0.92)
    a = np.asarray(im, float); a = a * 0.95 + np.array([255, 244, 225]) * 0.05            # slight printed warmth
    a += np.random.default_rng(len(k)).normal(0, 5, a.shape[:2])[..., None]                # print grain
    return Image.fromarray(np.clip(a, 0, 255).astype('uint8'))
def jitter_poly(pts, amt, seed):
    r = np.random.default_rng(seed); return [(x + r.uniform(-amt, amt), y + r.uniform(-amt, amt)) for x, y in pts]
def piece(img, poly, rim=7, shadow=False):
    """cut img along a polygon; white paper rim along the cut (the printed border / paper core)"""
    W, H = img.size; m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon(poly, fill=255)
    rgba = img.convert('RGBA'); rgba.putalpha(m)
    if rim:
        rimm = Image.new('L', (W, H), 0); d = ImageDraw.Draw(rimm); d.polygon(poly, fill=255)
        inner = Image.new('L', (W, H), 0); ImageDraw.Draw(inner).polygon(poly, fill=255); inner = inner.filter(ImageFilter.MinFilter(rim * 2 + 1))
        ring = np.clip(np.asarray(rimm, int) - np.asarray(inner, int), 0, 255).astype('uint8')
        a = np.asarray(rgba).copy(); a[ring > 0, :3] = [246, 243, 234]; rgba = Image.fromarray(a)
    bb = rgba.getbbox(); return rgba.crop(bb)
# 1) cut-outs: a scissor polygon hugging the subject (dilated mask -> coarse polygon, jittered)
def cutout(k, margin=26, eps=0.018, seed=1):
    img = photo(k); m = np.asarray(Image.open(CUT + k + '.png').split()[-1].resize(img.size), np.uint8)
    m = (m > 100).astype(np.uint8) * 255; m = cv2.dilate(m, np.ones((margin * 2, margin * 2), np.uint8))
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE); c = max(cs, key=cv2.contourArea)
    ap = cv2.approxPolyDP(c, eps * cv2.arcLength(c, True), True)[:, 0, :]
    poly = jitter_poly([tuple(p) for p in ap], 6, seed); return piece(img, poly, rim=0)
# 2) square prints: crooked hand-trimmed white border around a square crop
def square(k, box=None, seed=2, border=46):
    img = photo(k); W, H = img.size; box = box or (0, 0, 1, 1)
    c = img.crop((int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H))); s = min(c.size); c = c.crop(((c.width - s) // 2, (c.height - s) // 2, (c.width - s) // 2 + s, (c.height - s) // 2 + s)).resize((900, 900), Image.LANCZOS)
    can = Image.new('RGB', (900 + border * 2, 900 + border * 2), (246, 243, 234)); can.paste(c, (border, border))
    r = np.random.default_rng(seed); n = (900 + border * 2)
    poly = [(r.uniform(0, 14), r.uniform(0, 14)), (n * r.uniform(0.4, 0.6), r.uniform(-4, 10)), (n - r.uniform(0, 14), r.uniform(0, 14)), (n - r.uniform(0, 12), n * r.uniform(0.45, 0.55)), (n - r.uniform(0, 14), n - r.uniform(0, 14)), (r.uniform(0, 14), n - r.uniform(0, 14))]
    return piece(can, poly, rim=0)
# 3) detail cut: an irregular 5-7 sided scissor piece of just the important part, rim of white
def detail(k, box, seed=3, n=6):
    img = photo(k); W, H = img.size; c = img.crop((int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H))); s = 900 / max(c.size); c = c.resize((int(c.width * s), int(c.height * s)), Image.LANCZOS)
    r = np.random.default_rng(seed); w, h = c.size; cx, cy = w / 2, h / 2
    poly = []
    for i in range(n):
        a = (i / n) * math.tau + r.uniform(-0.25, 0.25) + math.pi / n; rr = 1.0 + r.uniform(-0.05, 0.12)
        x = cx + math.cos(a) * w * 0.62 * rr; y = cy + math.sin(a) * h * 0.62 * rr; poly.append((min(w - 2, max(2, x)), min(h - 2, max(2, y))))
    return piece(c, poly, rim=9)
# 4) torn scraps of the generated papers
def scrap(tex, w, h, seed, torn=None):
    """a scissor-cut piece of the generated paper: a few straight cuts per side, no torn fibres"""
    t = Image.open(PAP + tex + '.jpg'); r = np.random.default_rng(seed); x0 = int(r.uniform(0, t.width - w)); y0 = int(r.uniform(0, t.height - h))
    c = t.crop((x0, y0, x0 + w, y0 + h)).convert('RGBA'); pts = []
    def edge(ax, ay, bx, by):
        L = math.hypot(bx - ax, by - ay); k = 1 + int(r.uniform(0, 3)); nx, ny = -(by - ay) / L, (bx - ax) / L
        for i in range(k): f = i / k + (r.uniform(-0.06, 0.06) if i else 0); d = r.uniform(0, 12); pts.append((ax + (bx - ax) * f + nx * d, ay + (by - ay) * f + ny * d))
    edge(0, 0, w, 0); edge(w, 0, w, h); edge(w, h, 0, h); edge(0, h, 0, 0)
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).polygon(pts, fill=255); c.putalpha(m); return c
JOBS = {
  'cut_card_navy': lambda: cutout('card_navy', 22, 0.03, 11), 'cut_card_gold': lambda: cutout('card_gold', 22, 0.03, 12),
  'cut_man': lambda: cutout('man', 30, 0.012, 13), 'cut_woman': lambda: cutout('woman', 30, 0.012, 14),
  'cut_paperwork': lambda: cutout('paperwork', 26, 0.02, 15), 'cut_folder_docs': lambda: cutout('folder_docs', 24, 0.02, 16),
  'sq_planner': lambda: square('planner', None, 21), 'sq_beach': lambda: square('beach', None, 22), 'sq_pool': lambda: square('pool', None, 23),
  'det_planner': lambda: detail('planner', (0.12, 0.3, 0.72, 0.85), 31), 'det_wing': lambda: detail('wing', (0.12, 0.1, 0.95, 0.9), 32, 7),
  'det_card_black': lambda: detail('card_black', (0.12, 0.42, 0.62, 0.8), 33), 'det_card_white': lambda: detail('card_white', (0.08, 0.38, 0.72, 0.92), 34),
  'det_card_green': lambda: detail('card_green', (0.18, 0.45, 0.82, 0.85), 35), 'det_card_navy': lambda: detail('card_navy', (0.1, 0.2, 0.8, 0.75), 36),
  'det_card_gold': lambda: detail('card_gold', (0.3, 0.45, 0.95, 0.9), 37),
  'scr_kraft': lambda: scrap('kraft', 520, 460, 41, (0, 1)), 'scr_news': lambda: scrap('news', 560, 330, 42, (1, 2)), 'scr_notebook': lambda: scrap('notebook', 460, 380, 43, (0,)),
  'scr_notebook2': lambda: scrap('notebook', 620, 170, 44, (2,)), 'scr_blue': lambda: scrap('blue', 820, 420, 45, (0, 2)), 'scr_cardboard': lambda: scrap('cardboard', 700, 470, 46, (1, 3)),
  'scr_yellow': lambda: scrap('yellow', 360, 160, 47, (1,)), 'scr_kraft2': lambda: scrap('kraft', 860, 300, 48, (0, 2)), 'scr_news2': lambda: scrap('news', 860, 360, 49, (0, 3)),
}
def parts(k, n=6, margin=10):
    """separate small objects (pins, clips, tape) each cut with its own scissor polygon"""
    img = photo(k); m = np.asarray(Image.open(CUT + k + '.png').split()[-1].resize(img.size), np.uint8); m = ((m > 100) * 255).astype(np.uint8)
    m = cv2.dilate(m, np.ones((margin * 2, margin * 2), np.uint8)); cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    out = []
    for i, c in enumerate(sorted(cs, key=cv2.contourArea, reverse=True)[:n]):
        ap = cv2.approxPolyDP(c, 0.03 * cv2.arcLength(c, True), True)[:, 0, :]; out.append(piece(img, jitter_poly([tuple(p) for p in ap], 4, 90 + i), rim=0))
    return out
JOBS.update({
  'g_card_black': lambda: cutout('g_card_black', 30, 0.04, 51), 'g_card_navy': lambda: cutout('g_card_navy', 30, 0.04, 52), 'g_card_gold': lambda: cutout('g_card_gold', 30, 0.04, 53),
  'g_card_white': lambda: cutout('g_card_white', 30, 0.04, 54), 'g_card_green': lambda: cutout('g_card_green', 30, 0.04, 55), 'g_fan': lambda: cutout('g_fan', 26, 0.02, 56),
  'g_envelope': lambda: cutout('g_envelope', 24, 0.03, 57), 'g_coins': lambda: cutout('g_coins', 22, 0.025, 58), 'g_boarding': lambda: cutout('g_boarding', 22, 0.03, 59),
  'g_hourglass': lambda: cutout('g_hourglass', 22, 0.025, 60), 'g_gift': lambda: cutout('g_gift', 22, 0.03, 61),
  'sq_bank': lambda: square('g_bank', None, 62), 'det_calendar': lambda: detail('g_calendar', (0.18, 0.3, 0.75, 0.75), 63),
})
import sys
ONLY = sys.argv[1] if len(sys.argv) > 1 else ''
for k, fn in JOBS.items():
    if k.startswith(ONLY): fn().save(OUT + k + '.png')
if not ONLY:
    for i, im in enumerate(parts('g_stationery', 7)): im.save(OUT + f'st_{i}.png')
print('ok', len(JOBS))
