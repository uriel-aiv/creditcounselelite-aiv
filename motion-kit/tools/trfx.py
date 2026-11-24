# Transparent GPT objects -> collage pieces: object kept crisp, cut out with a hand-scissored white paper margin (polygon).
import os
FILMS = os.environ.get('CCE_FILMS', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'films'))  # motion-kit/films
import numpy as np, cv2, sys
from PIL import Image, ImageDraw
OUT = FILMS + '/cce-vox/assets/pieces/'
MAP = {'docs': 'BgpB7lYt', 'gift': 'J-PU7nsP', 'window': 'J1793vAJ', 'hourglass': 'OkGAZYPr', 'card_navy': 'T9HakCNU', 'coins': 'VdoOGLrN', 'card_white': 'WNwd9LKY',
       'boarding': 'eKqtX5Ba', 'flip': 'jgbeSJiT', 'calendar': 'kp_xqe8P', 'envelope': 'mKKOtezQ', 'bank': 'rm5VV3hm', 'card_gold': 't3-bBcHS', 'fan': 'uVMrURUl', 'card_green': 'w4c3O_3T', 'card_black': 'yyJkeOyE'}
for i, (k, f) in enumerate(MAP.items()):
    im = Image.open(f + '.png').convert('RGBA'); im = im.crop(im.getbbox()); s = 1000 / max(im.size); im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    pad = 60; can = Image.new('RGBA', (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0)); can.paste(im, (pad, pad), im)
    a = (np.asarray(can.split()[-1]) > 40).astype(np.uint8) * 255
    m = cv2.dilate(a, np.ones((40, 40), np.uint8)); cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE); c = max(cs, key=cv2.contourArea)
    ap = cv2.approxPolyDP(c, 0.022 * cv2.arcLength(c, True), True)[:, 0, :]
    r = np.random.default_rng(200 + i); poly = [(x + r.uniform(-5, 5), y + r.uniform(-5, 5)) for x, y in ap]
    paper = Image.new('RGBA', can.size, (0, 0, 0, 0)); d = ImageDraw.Draw(paper); d.polygon(poly, fill=(246, 243, 234, 255))
    pa = np.asarray(paper).copy(); g = r.normal(0, 4, pa.shape[:2]); pa[..., :3] = np.clip(pa[..., :3] + g[..., None], 0, 255); paper = Image.fromarray(pa.astype('uint8'))
    paper.alpha_composite(can); paper = paper.crop(paper.getbbox()); paper.save(OUT + 'tr_' + k + '.png')
print('ok')
