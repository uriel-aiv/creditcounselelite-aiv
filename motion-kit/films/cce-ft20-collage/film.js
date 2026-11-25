// CCE — "20 Photo Collage 2.5D" founder split-screen. Pure function of time: window.seek(t) paints frame t.
// Style: After Effects-style 2.5D photo animation. Every shot is flat photo layers placed at depths in front of a
// camera: a clean background plate (subject erased + filled by Nano Banana 2.1), the subject cut out, and flat
// front-on props (cut out from Nano Banana 2.1 flat lays). Nothing is puppeted: people stay still, elements are never
// spun or tilted. All the motion is the camera dollying/craning through the layers (parallax), elements flying in fast
// with motion blur and settling into a slow drift, props dropping toward the camera's subject plane, and a depth-of-
// field model (near/far layers blur, focus racks between them). On top: flash cuts, a fog wipe, a whip, chromatic
// aberration on hits, glow, light leaks, marker strokes, grain and a vignette.
// Clip: Video 3 "Sign-up bonuses" (1,200 / walked away with 15,600 free cash / statement credit / travel / 7 to 21x).
import * as M from './lib/motion.js';
import * as BR from './lib/brand.js';

const { W, H, E, prog, clamp, lerp, spring, springKeys, font, mulberry32, noise1 } = M;
const DW = 1080, DH = 1920, S = W / DW, F = 1000;
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 478;
const SEAM = 980, IW = 1080, IH = 1935;
const GOLD = '#F2C14E', RED = '#E5392F', INK = '#0B0B10';
const P = (t, a, b, ease = E.inOutCubic) => ease(prog(t, a, b));
const antic = (t, t0, dur = 0.2) => { const p = prog(t, t0 - dur, t0 + 0.02); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; };
const pop = (t, t0, cfg = { stiffness: 260, damping: 15 }) => (t < t0 ? 0 : spring(t - t0, cfg));
let FH = DH;
const Y = (y) => (FH >= SEAM ? y - (FH - SEAM) : y + (SEAM - FH) * 0.48);

// ================================================================== timeline (seconds; Video 3 word timings)
const T = { office: 0.8, cash: 4.84, statement: 7.84, passport: 10.3, tarmac: 11.35, villa: 14.35 };
const END = 17.29; window.__END = END;
const FH_KEYS = [[0, 1920], [0.8, SEAM], [T.tarmac, 0]];
function footH(t) {
  let v = springKeys(t, FH_KEYS, { stiffness: 150, damping: 17 });
  for (let i = 1; i < FH_KEYS.length; i++) v -= Math.sign(FH_KEYS[i][1] - FH_KEYS[i - 1][1]) * 34 * antic(t, FH_KEYS[i][0], 0.22);
  return clamp(v, 0, DH);
}
const FULL_WINDOWS = [[0, 0.8]];
const sceneAt = (t) => (t < T.cash ? 'office' : t < T.tarmac ? 'desk' : t < T.villa ? 'tarmac' : 'villa');
const LEAKS = [[T.cash, 0], [T.tarmac, 1], [T.villa, 2]];
const POSTER = 12;   // Posterize Time frame rate for the photo panel   // light-leak burns that carry every cut

// ================================================================== the 2.5D camera
// A layer is defined by where it sits on screen when the camera is at rest (x, y = centre, w = width) and by its
// depth Z. Moving the camera (x, y, z) re-projects every layer: near layers move and grow more than far ones.
let L = {};
function camKeys(t, keys) {   // [[t, {x,y,z,focus}], ...] eased between keys
  let i = 0; while (i < keys.length - 1 && t > keys[i + 1][0]) i++;
  const [ta, a] = keys[i], [tb, b] = keys[Math.min(i + 1, keys.length - 1)];
  const p = tb > ta ? E.inOutSine(clamp((t - ta) / (tb - ta))) : 0, o = {};
  for (const k of ['x', 'y', 'z', 'focus']) o[k] = lerp(a[k] ?? 0, b[k] ?? a[k] ?? 0, p);
  return o;
}
const outExpo = (p) => (p >= 1 ? 1 : 1 - 2 ** (-9 * p));
function layerState(ly, t) {   // entrance (fast in, hard ease-out), drop (falls away from camera to its depth), drift, exit
  let dx = 0, dy = 0, dz = 0, a = 1;
  if (ly.enter) {
    const e = ly.enter, p = clamp((t - e.t) / (e.d || 0.55));
    if (t < e.t) return null;
    if (e.drop) { const f = E.inCubic(p); dz = (e.dz ?? -1700) * (1 - f); a = clamp(p * 5); }
    else { const k = outExpo(p); dx = (e.dx || 0) * (1 - k); dy = (e.dy || 0) * (1 - k); dz = (e.dz || 0) * (1 - k); }
  }
  if (ly.drift) { const t0 = ly.enter ? ly.enter.t : 0, dt = Math.max(0, t - t0); dx += ly.drift[0] * dt; dy += ly.drift[1] * dt; }
  if (ly.fall) { const [t0, v, sway] = ly.fall; if (t < t0) return null; dy += (t - t0) * v; dx += Math.sin((t - t0) * 2.2 + ly.x) * sway; }
  if (ly.exit) { const x = ly.exit, p = E.inCubic(clamp((t - x.t) / (x.d || 0.35))); dx += (x.dx || 0) * p; dy += (x.dy || 0) * p; a *= 1 - (x.fade ? p : 0); }
  return { dx, dy, dz, a };
}
function drawLayers(c, layers, cam, t, ph, off) {
  const cx = DW / 2, cy = ph / 2, items = [];
  for (const ly of layers) {
    const img = L[ly.look ? ly.img + '@' + ly.look : ly.img] || L[ly.img]; if (!img) continue;
    const st = layerState(ly, t); if (!st) continue;
    const Zb = ly.Z, Ze = ly.Z + st.dz, Zr = Ze - cam.z; if (Zr < 60) continue;
    const sx = cx + ((ly.x + st.dx - cx) * Zb - cam.x * F) / Zr + off.x;
    const sy = cy + ((ly.y + st.dy - cy) * Zb - cam.y * F) / Zr + off.y;
    const w = ly.w * Zb / Zr, h = w * img.height / img.width;
    const blur = Math.min(34, 16 * (ly.dof ?? 1) * F * Math.abs(1 / Zr - 1 / Math.max(80, cam.focus - cam.z)));
    items.push({ ly, img, sx, sy, w, h, blur, a: st.a * (ly.alpha ?? 1), Zr, lift: Math.max(0, -st.dz) });
  }
  items.sort((a, b) => b.Zr - a.Zr);   // far to near
  for (const it of items) {
    const { ly, img, sx, sy, w, h } = it;
    c.save(); c.globalAlpha = it.a; if (ly.blend) c.globalCompositeOperation = ly.blend;
    c.filter = it.blur > 0.4 ? `blur(${it.blur.toFixed(1)}px)` : 'none';
    if (ly.shadow) { const k = clamp(it.lift / 1700); c.shadowColor = `rgba(0,0,0,${0.55 - k * 0.2})`; c.shadowBlur = 16 + k * 70; c.shadowOffsetX = 8 + k * 60; c.shadowOffsetY = 14 + k * 110; }
    c.translate(sx, sy); if (ly.flip) c.scale(-1, 1);
    c.drawImage(img, -w / 2, -h / 2, w, h);
    c.restore();
    if (ly.glow) { const g = ly.glow(t); if (g > 0.01) { c.save(); c.translate(sx, sy); c.globalCompositeOperation = 'screen'; c.globalAlpha = g; c.filter = `blur(${(22 + it.blur).toFixed(0)}px) saturate(2) brightness(1.25)`; c.drawImage(img, -w / 2, -h / 2, w, h); c.restore(); } }
    if (ly.after) { c.save(); c.translate(sx, sy); if (it.blur > 0.4) c.filter = `blur(${it.blur.toFixed(1)}px)`; ly.after(c, w, h, t); c.restore(); }
  }
  return items;
}
// a plate and its cut-out subject share one rest rectangle (so they register) but sit at different depths
const plate = (img, ph, fy, Z, k = 1.16) => ({ img, Z, w: IW * k, x: DW / 2, y: ph / 2 + (0.5 - fy) * IH * k });

// ================================================================== shots
const fly = (t, dx, dy, d = 0.55, dz = 0) => ({ t, dx, dy, d, dz });
const drop = (t, d = 0.36) => ({ t, d, drop: true });
const pulse = (...ts) => (t) => ts.reduce((m, t0) => Math.max(m, t > t0 ? 0.6 * Math.exp(-(t - t0) * 2.6) : 0), 0);

function shotOffice(ph) {
  const fy = 0.37, pl = { ...plate('office_plate', ph, fy, 3000), look: 'ht' }, sb = plate('office_subj', ph, fy, 1800);
  return {
    cam: [[T.office - 0.4, { z: 0, x: 0, y: 0, focus: 420 }], [T.office + 0.35, { z: 40, x: 0, y: -20, focus: 1800 }], [T.cash, { z: 300, x: -50, y: -110, focus: 1800 }]],
    layers: [pl, { ...sb, glow: pulse(0.95, 4.0) },
      // cards fly in from the sides on "1,200" and settle beside him (flat, front-on)
      { img: 'card_black', look: 'ht', x: 175, y: 400, w: 230, Z: 1300, enter: fly(0.95, -520, 0), drift: [4, -3] },
      { img: 'card_gold', x: 910, y: 360, w: 230, Z: 1200, enter: fly(1.05, 520, -40), drift: [-4, 2] },
      { img: 'card_gold', x: 150, y: 690, w: 210, Z: 1550, enter: fly(1.15, -500, 60), drift: [3, 2] },
      { img: 'card_black', look: 'ht', x: 935, y: 700, w: 210, Z: 1450, enter: fly(1.25, 520, 40), drift: [-3, -2] },
      // a gold card right in front of the lens: big, out of focus, sliding slowly (fake depth of field)
      { img: 'card_gold', x: 1010, y: 860, w: 560, Z: 520, enter: fly(1.0, 600, 120, 0.8), drift: [-14, 0] },
      // notes fall through the frame at different depths on "fifteen thousand six hundred"
      ...[[150, 1300, 160], [420, 900, 120], [760, 1650, 150], [980, 1100, 140], [300, 2200, 120], [640, 620, 240]].map(([x, Z, w], i) => ({ img: 'note', look: i % 2 ? 'bw' : null, x, y: -180, w, Z, fall: [2.7 + i * 0.16, 260 + (i % 3) * 40, 24] })),
      ...[0, 1, 2, 3, 4].map((i) => ({ img: 'coin' + i, x: [210, 860, 120, 960, 540][i], y: [880, 880, 560, 560, 900][i], w: 90, Z: 1100 + i * 90, enter: fly(3.98 + i * 0.05, 0, 500, 0.5), drift: [0, -6] })),
    ],
    leak: true,
  };
}
const DESKZ = 2550;
function shotDesk(ph) {
  const cy = ph / 2, stW = 560, stX = 560, stY = cy + 20;
  const lx = (stX + stW * (0.465 - 0.5) - DW / 2) * DESKZ / F, lyy = (stY + stW * 900 / 639 * (0.522 - 0.5) - cy) * DESKZ / F;
  return {
    cam: [[T.cash, { z: -350, x: 0, y: 0, focus: DESKZ }], [8.45, { z: 300, x: 0, y: 0, focus: DESKZ }], [8.95, { z: 1050, x: lx, y: lyy, focus: DESKZ }],
      [9.9, { z: 1150, x: lx, y: lyy, focus: DESKZ }], [10.3, { z: 250, x: 0, y: 0, focus: DESKZ }], [T.tarmac, { z: 420, x: 0, y: 0, focus: DESKZ }]],
    layers: [{ img: 'desk_plate', Z: 2700, w: IW * 1.3, x: DW / 2, y: cy },
      { img: 'cash', x: 410, y: cy + 160, w: 500, Z: DESKZ, enter: drop(4.86), shadow: 1, glow: pulse(5.3, 9.7) },
      { img: 'cash', x: 700, y: cy - 90, w: 460, Z: DESKZ, enter: drop(5.1), shadow: 1, glow: pulse(5.5, 9.7) },
      { img: 'cash', x: 330, y: cy - 250, w: 420, Z: DESKZ, enter: drop(5.34), shadow: 1, glow: pulse(5.7, 9.7) },
      { img: 'watch', look: 'ht', x: 880, y: cy + 230, w: 170, Z: DESKZ, enter: drop(5.62), shadow: 1 },
      ...[0, 1, 2, 3].map((i) => ({ img: 'coin' + i, x: [170, 640, 860, 520][i], y: cy + [320, 360, -300, -380][i], w: 100, Z: DESKZ, enter: drop(5.85 + i * 0.09, 0.3), shadow: 1 })),
      { img: 'card_black', look: 'ht', x: 900, y: cy - 330, w: 300, Z: DESKZ, enter: fly(6.35, 600, 0, 0.6), shadow: 1 },
      { img: 'card_gold', x: 160, y: cy - 20, w: 280, Z: DESKZ, enter: fly(6.55, -600, 0, 0.6), shadow: 1 },
      // the statement lands on the pile; its line gets circled while the camera pushes in on it
      { img: 'statement', look: 'ht', x: stX, y: stY, w: stW, Z: DESKZ - 20, enter: drop(7.95), shadow: 1,
        after: (c, w, h, t) => scribbleEllipse(c, w * (0.465 - 0.5), h * (0.522 - 0.5), w * 0.34, h * 0.045, P(t, 8.95, 9.4, E.outCubic)) },
      { img: 'passport', x: 520, y: cy - 10, w: 520, Z: DESKZ - 40, enter: drop(10.32), shadow: 1,
        after: (c, w, h, t) => { if (t > 10.9) scribbleX(c, 0, 0, w * 0.36, P(t, 10.9, 11.15, E.outQuad)); } },
      // a loose note floats just under the lens, way out of focus
      { img: 'note', look: 'bw', x: 980, y: cy - 260, w: 380, Z: 650, enter: fly(5.0, 500, -200, 1.2), drift: [-26, 12], alpha: 0.95 },
    ],
  };
}
function shotTarmac(ph) {
  const fy = 0.52, pl = { ...plate('tarmac_plate', ph, fy, 3200, 1.14), look: 'duo' }, sb = plate('tarmac_subj', ph, fy, 2100, 1.14);
  return {
    cam: [[T.tarmac, { z: -150, x: 0, y: 40, focus: 2100 }], [12.85, { z: 220, x: 30, y: -10, focus: 2100 }], [13.15, { z: 260, x: 34, y: -16, focus: 820 }], [13.75, { z: 340, x: 40, y: -30, focus: 820 }], [14.1, { z: 380, x: 44, y: -40, focus: 2100 }], [T.villa, { z: 420, x: 46, y: -46, focus: 2100 }]],
    layers: [pl, sb,
      { img: 'jet', look: 'bw', x: 640, y: 360, w: 470, Z: 2700, enter: fly(11.75, 1100, 60, 1.1), drift: [-22, -4] },
      { img: 'cloud1', x: 200, y: 330, w: 620, Z: 2900, alpha: 0.55, drift: [10, 0], dof: 0.4 },
      { img: 'cloud0', x: 260, y: 1600, w: 1100, Z: 520, alpha: 0.32, drift: [26, 0] },
      { img: 'cloud2', x: 980, y: 260, w: 800, Z: 600, alpha: 0.45, drift: [-30, 0] },
      { img: 'pass', x: 570, y: 700, w: 430, Z: 820, enter: fly(12.85, -900, 0, 0.6), drift: [6, -4] },
    ],
    flare: { img: 'tarmac_plate', u: 0.63, v: 0.24 },
  };
}
function shotVilla(ph) {
  const fy = 0.6, pl = plate('villa_plate', ph, fy, 3000), sb = plate('villa_subj', ph, fy, 1900);
  const cx = [210, 870, 330, 760, 540], cy = [520, 520, 760, 760, 860];
  return {
    cam: [[T.villa, { z: -200, x: -40, y: -60, focus: 1900 }], [END, { z: 260, x: 20, y: 20, focus: 1900 }]],
    layers: [pl, sb,
      { img: 'palm', x: 1080, y: 150, w: 700, Z: 460, drift: [-5, 2] },
      { img: 'palm', look: 'bw', x: 70, y: 1720, w: 760, Z: 540, flip: 1, drift: [5, -2] },
      { img: 'card_gold', x: 870, y: 960, w: 250, Z: 1350, enter: fly(15.4, 700, 0, 0.6), drift: [-3, -2] },
      ...[0, 1, 2, 3, 4].map((i) => ({ img: 'coin' + i, x: cx[i], y: cy[i], w: 100, Z: 1150 + i * 80, enter: fly(15.78 + i * 0.04, 540 - cx[i], 430 - cy[i], 0.5), drift: [0, -5] })),
    ],
    leak: true,
  };
}
const SHOTS = { office: shotOffice, desk: shotDesk, tarmac: shotTarmac, villa: shotVilla };

const START = { office: T.office, desk: T.cash, tarmac: T.tarmac, villa: T.villa };
function drawShot(c, name, t, ph, off = { x: 0, y: 0 }) {
  const sh = SHOTS[name](ph), cam = camKeys(t, sh.cam);
  const rk = clamp((t - START[name]) / 0.6); if (rk < 1) cam.focus = lerp(cam.z + 260, cam.focus, E.outCubic(rk));
  const items = drawLayers(c, sh.layers, cam, t, ph, off);
  if (sh.flare) { const pl = items.find((i) => i.ly.img === sh.flare.img); if (pl) sunFlare(c, pl.sx - pl.w / 2 + sh.flare.u * pl.w, pl.sy - pl.h / 2 + sh.flare.v * pl.h, t, ph); }
  if (sh.leak) lightLeak(c, t, ph, name === 'villa' ? 1 : 0);
}

// ================================================================== effects
let SC, SX, CH = [], CHX = [], GRAIN = [], VIG, PAPER;
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function chroma(dst, src, amt, ph) {   // chromatic aberration: red and blue channels pulled apart
  if (amt < 0.4) { dst.drawImage(src, 0, 0); return; }
  const cols = ['#FF0000', '#00FF00', '#0000FF'], off = [amt, 0, -amt];
  for (let i = 0; i < 3; i++) { const x = CHX[i]; x.globalCompositeOperation = 'copy'; x.drawImage(src, 0, 0); x.globalCompositeOperation = 'multiply'; x.fillStyle = cols[i]; x.fillRect(0, 0, src.width, src.height); x.globalCompositeOperation = 'destination-in'; x.drawImage(src, 0, 0); }
  dst.save(); dst.fillStyle = '#000'; dst.fillRect(0, 0, src.width, Math.min(src.height, ph * S + 2)); dst.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) dst.drawImage(CH[i], off[i] * S, 0);
  dst.restore();
}
function sunFlare(c, sx, sy, t, ph) {
  const a = 0.85 + 0.15 * Math.sin(t * 3);
  c.save(); c.globalCompositeOperation = 'screen';
  let g = c.createRadialGradient(sx, sy, 0, sx, sy, 560); g.addColorStop(0, `rgba(255,214,150,${0.7 * a})`); g.addColorStop(0.25, 'rgba(255,170,90,0.22)'); g.addColorStop(1, 'rgba(255,140,60,0)');
  c.fillStyle = g; c.fillRect(sx - 560, sy - 560, 1120, 1120);
  for (const [f, r, al] of [[0.6, 60, 0.18], [1.3, 110, 0.12], [1.8, 40, 0.2]]) { const gx = sx + (DW / 2 - sx) * f, gy = sy + (ph * 0.55 - sy) * f; g = c.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, `rgba(255,220,170,${al})`); g.addColorStop(1, 'rgba(255,220,170,0)'); c.fillStyle = g; c.fillRect(gx - r, gy - r, 2 * r, 2 * r); }
  c.restore();
}
function lightLeak(c, t, ph, v) {   // warm film leaks drifting slowly across the frame
  c.save(); c.globalCompositeOperation = 'screen';
  for (let i = 0; i < 2; i++) {
    const x = DW * (0.15 + 0.7 * (0.5 + 0.5 * Math.sin(t * 0.35 + i * 2.4 + v))), y = ph * (i ? 0.85 : 0.1), r = 520 + 120 * Math.sin(t * 0.6 + i);
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, i ? 'rgba(255,120,60,0.2)' : 'rgba(255,200,120,0.24)'); g.addColorStop(1, 'rgba(255,120,60,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  c.restore();
}


// ---- textures (the aging reference: black-and-white halftone cut-outs, paper, dust)
const LOOKS = { office_plate: ['ht'], card_black: ['ht'], note: ['bw'], watch: ['ht'], statement: ['ht'], tarmac_plate: ['duo'], jet: ['bw'], palm: ['bw'] };
function bakeLooks(IMG) {
  for (const [n, looks] of Object.entries(LOOKS)) for (const lk of looks) { const im = IMG[n]; if (im) L[n + '@' + lk] = bake(im, lk); }
}
function bake(im, lk) {
  const k = Math.min(1, 1100 / Math.max(im.width, im.height)), w = Math.round(im.width * k), h = Math.round(im.height * k);
  const c = makeCanvas(w, h), x = c.getContext('2d');
  if (lk === 'duo') { x.filter = 'sepia(0.55) saturate(0.8) contrast(1.08) brightness(1.02)'; x.drawImage(im, 0, 0, w, h); return c; }
  x.filter = 'grayscale(1) contrast(1.35) brightness(1.04)'; x.drawImage(im, 0, 0, w, h); x.filter = 'none';
  if (lk === 'ht') {   // printed halftone: a dot screen sized by darkness, multiplied over the grey image
    const g = x.getImageData(0, 0, w, h).data, d = makeCanvas(w, h), dx = d.getContext('2d'), cell = Math.max(4, Math.round(w / 150));
    dx.fillStyle = '#FFFFFF'; dx.fillRect(0, 0, w, h); dx.fillStyle = '#121212';
    for (let yy = 0; yy < h; yy += cell) for (let xx = (yy / cell) % 2 ? cell / 2 : 0; xx < w; xx += cell) {
      const i = (Math.min(h - 1, Math.round(yy + cell / 2)) * w + Math.min(w - 1, Math.round(xx + cell / 2))) * 4, lum = (g[i] * 0.3 + g[i + 1] * 0.59 + g[i + 2] * 0.11) / 255;
      const r = cell * 0.62 * Math.sqrt(1 - lum); if (r > 0.3) { dx.beginPath(); dx.arc(xx + cell / 2, yy + cell / 2, r, 0, Math.PI * 2); dx.fill(); }
    }
    x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.55; x.drawImage(d, 0, 0); x.globalAlpha = 1;
  }
  x.globalCompositeOperation = 'multiply'; x.fillStyle = '#F1E8D8'; x.fillRect(0, 0, w, h);   // paper-warm whites
  x.globalCompositeOperation = 'destination-in'; x.drawImage(im, 0, 0, w, h);
  return c;
}
function buildPaper() {   // fibrous paper grain, multiplied over the photos
  PAPER = makeCanvas(540, 960); const x = PAPER.getContext('2d'), rr = mulberry32(21), img = x.createImageData(540, 960);
  for (let i = 0; i < img.data.length; i += 4) { const v = 225 + rr() * 30; img.data[i] = v; img.data[i + 1] = v - 3; img.data[i + 2] = v - 10; img.data[i + 3] = 255; }
  x.putImageData(img, 0, 0); x.strokeStyle = 'rgba(120,100,80,0.12)'; x.lineWidth = 1;
  for (let i = 0; i < 500; i++) { const a = rr() * 540, b = rr() * 960, l = 6 + rr() * 22, an = rr() * Math.PI; x.beginPath(); x.moveTo(a, b); x.lineTo(a + Math.cos(an) * l, b + Math.sin(an) * l); x.stroke(); }
}
function texture(c, t, ph) {
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.22; c.drawImage(PAPER, 0, 0, DW, Math.max(ph, 1920)); c.restore();
  // dust and hairs: a new handful 12 times a second
  const rr = mulberry32(Math.floor(t * 12) + 5); c.save();
  for (let i = 0; i < 14; i++) { const x = rr() * DW, y = rr() * ph, r = 1 + rr() * 2.6; c.globalAlpha = 0.25 + rr() * 0.35; c.fillStyle = rr() < 0.5 ? '#FFFFFF' : '#1A1410'; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
  if (rr() < 0.5) { c.globalAlpha = 0.35; c.strokeStyle = '#EDE3D0'; c.lineWidth = 1.5; const x = rr() * DW, y = rr() * ph; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + 30, y + 10, x + 10, y + 50, x + 40, y + 70); c.stroke(); }
  c.restore();
}
// light-leak transition: warm leaks sweep across, burn the frame toward white-orange on the cut, then clear
function leakBurn(c, t, t0, ph, seed) {
  const p = (t - t0) / 0.42; if (p < -1 || p > 1) return;
  const k = Math.pow(1 - Math.abs(p), 1.6), sweep = (p + 1) / 2, rr = mulberry32(900 + seed);
  c.save(); c.globalCompositeOperation = 'screen';
  const blobs = [['255,96,24', 0.8], ['255,44,20', 0.6], ['255,196,90', 0.7], ['255,236,200', 0.55]];
  blobs.forEach(([col, a], i) => {
    const x = lerp(-300 - rr() * 200, DW + 300 + rr() * 200, sweep * (0.8 + i * 0.12)) * (seed % 2 ? -1 : 1) + (seed % 2 ? DW : 0), y = ph * (0.15 + rr() * 0.7), r = 500 + rr() * 500;
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a * k})`); g.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = g; c.fillRect(0, 0, DW, ph);
  });
  c.globalAlpha = Math.pow(k, 2.6) * 0.38; c.fillStyle = '#FFD9A8'; c.fillRect(0, 0, DW, ph);
  c.restore();
}

// ================================================================== type (Anton caps, one gold word, pops in sharp from a blur)
const CREAM = '#F6ECDC';
function glowText(c, str, x, y, col, glow) {   // soft bloom (two wide shadows) under a crisp fill
  c.fillStyle = col; c.shadowColor = glow; c.shadowBlur = 34; c.fillText(str, x, y); c.shadowBlur = 14; c.fillText(str, x, y);
  c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 8; c.shadowOffsetY = 3; c.fillText(str, x, y); c.shadowOffsetY = 0;
}
function title(c, lines, cy, t, a, b, size = 112) {
  if (t < a - 0.05 || t > b + 0.4) return;
  const out = P(t, b, b + 0.3, E.inCubic);
  c.save(); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  let y = cy, li = 0;
  for (const ln of lines) {
    const sz = ln.size || size; c.font = font(sz, 800, 'Serif'); c.letterSpacing = '1px';
    const words = ln.words, gap = sz * 0.24, ws = words.map((w) => c.measureText(w.t).width), tw = ws.reduce((s, v) => s + v, 0) + gap * (words.length - 1);
    let x = DW / 2 - tw / 2;
    words.forEach((w, i) => {
      const t0 = a + (w.d ?? 0) + li * 0.1;
      for (let j = 0; j < w.t.length; j++) {   // letter by letter
        const tj = t0 + j * 0.03, k = E.outCubic(clamp((t - tj) / 0.28)); if (k <= 0) continue;
        const cx = x + c.measureText(w.t.slice(0, j)).width, bl = (1 - k) * 12 + out * 14;
        c.save(); c.globalAlpha = k * (1 - out); c.filter = bl > 0.3 ? `blur(${bl.toFixed(1)}px)` : 'none';
        c.translate(0, (1 - k) * 18 - out * 30);
        glowText(c, w.t[j], cx, y, w.c || CREAM, w.c ? 'rgba(242,193,78,0.75)' : 'rgba(255,236,205,0.7)');
        c.restore();
      }
      x += ws[i] + gap;
    });
    y += sz * 1.02; li++;
  }
  c.restore();
}
function numberText(c, s, cy, t, t0, out, ticking, size = 190) {
  const k = E.outCubic(clamp((t - t0) / 0.35)), bl = (1 - k) * 16 + out * 18 + (ticking ? 1.5 : 0);
  c.save(); c.textAlign = 'center'; c.font = font(size, 900, 'Serif'); c.translate(DW / 2, cy - out * 40 + (1 - k) * 30);
  c.globalAlpha = k * (1 - out); c.filter = bl > 0.3 ? `blur(${bl.toFixed(1)}px)` : 'none';
  glowText(c, s, 0, 0, GOLD, 'rgba(242,193,78,0.85)');
  c.restore();
}
function drawType(c, t) {
  if (t < T.cash + 0.1) title(c, [{ words: [{ t: 'WALKED AWAY WITH', d: 0 }], size: 50 }], 118, t, 2.0, T.cash - 0.25);
  if (t >= T.cash - 0.1 && t < T.statement + 0.2) title(c, [{ words: [{ t: 'FREE', d: 0 }, { t: 'CASH', c: GOLD, d: 0.12 }] }], 200, t, T.cash + 0.05, T.statement - 0.25, 124);
  if (t >= T.statement && t < T.passport + 0.2) title(c, [{ words: [{ t: 'STATEMENT', d: 0 }], size: 92 }, { words: [{ t: 'CREDIT', c: GOLD, d: 0.15 }], size: 120 }], 150, t, 8.64, T.passport - 0.2);
  if (t >= T.tarmac && t < T.villa + 0.2) title(c, [{ words: [{ t: 'OR', d: 0 }, { t: 'TRAVEL', c: GOLD, d: 0.08 }] }], 290, t, 12.9, T.villa - 0.2, 128);
  if (t >= T.villa - 0.2) { title(c, [{ words: [{ t: 'UP TO', d: 0 }], size: 56 }], 215, t, 15.3, END - 0.2); title(c, [{ words: [{ t: 'EXTRA RETURN', d: 0 }], size: 56 }], 545, t, 15.76, END - 0.2); }
  if (t < T.cash + 0.05) {
    const out = P(t, T.cash - 0.25, T.cash, E.inCubic);
    const v = t < 2.66 ? Math.round(lerp(0, 1200, P(t, 0.95, 1.35, E.outCubic))) : Math.round(lerp(1200, 15600, P(t, 2.66, 4.0, E.outCubic)));
    if (t > 0.9) numberText(c, v.toLocaleString('en-US'), 262, t, 0.95, out, t > 2.66 && t < 4.05, 140);
  }
  if (t >= T.villa) { const out = P(t, END - 0.2, END, E.inCubic), v = Math.round(lerp(7, 21, P(t, 15.15, 15.75, E.outCubic))); if (t > 14.6) numberText(c, v + 'X', 450, t, 14.6, out, t > 15.1 && t < 15.8, 240); }
}

// hand-drawn marker strokes
function scribbleEllipse(c, cx, cy, rx, ry, p, col = GOLD, wdt = 9) {
  if (p <= 0) return;
  c.save(); c.strokeStyle = col; c.lineWidth = wdt; c.lineCap = 'round'; c.lineJoin = 'round'; c.shadowColor = col; c.shadowBlur = 16; c.beginPath();
  const N = 90, turns = 1.18;
  for (let i = 0; i <= N * p; i++) { const u = i / N, a = -2.6 + u * turns * Math.PI * 2, wob = 1 + noise1(u * 9, 3) * 0.04 + u * 0.05; const x = cx + Math.cos(a) * rx * wob, y = cy + Math.sin(a) * ry * wob; i ? c.lineTo(x, y) : c.moveTo(x, y); }
  c.stroke(); c.restore();
}
function scribbleX(c, cx, cy, r, p, col = RED) {
  c.save(); c.strokeStyle = col; c.lineWidth = 22; c.lineCap = 'round'; c.shadowColor = 'rgba(0,0,0,0.4)'; c.shadowBlur = 12;
  const s1 = clamp(p * 2), s2 = clamp(p * 2 - 1);
  if (s1 > 0) { c.beginPath(); c.moveTo(cx - r, cy - r); c.lineTo(cx - r + 2 * r * s1, cy - r + 2 * r * s1 + Math.sin(s1 * 3) * 8); c.stroke(); }
  if (s2 > 0) { c.beginPath(); c.moveTo(cx + r, cy - r * 0.9); c.lineTo(cx + r - 2 * r * s2, cy - r * 0.9 + 2 * r * s2); c.stroke(); }
  c.restore();
}

// ================================================================== sound
function buildHits() {
  const h = [];
  h.push([0.8, 'focus in', 'whoosh', { len: 0.35, from: 2400, to: 500, gain: 0.16 }], [0.95, '1,200', 'bell', { pitch: 'E6', gain: 0.26 }]);
  for (const [tt, g] of [[0.95, 0.16], [1.05, 0.14], [1.15, 0.13], [1.25, 0.12]]) h.push([tt + 0.08, 'card in', 'whoosh', { len: 0.25, from: 1800, to: 4200, gain: g }]);
  for (let i = 0; i < 12; i++) h.push([2.68 + i * 0.1, 'count', 'tick', { gain: 0.07 + i * 0.006 }]);
  h.push([2.7, 'notes', 'swell', { gain: 0.1 }], [4.0, '15,600', 'coins', { gain: 0.3 }]);
  h.push([T.cash - 0.3, 'leak', 'swell', { gain: 0.2 }], [T.cash, 'cut', 'sub', { len: 0.5, gain: 0.3 }], [T.cash + 0.05, 'free cash', 'pop', { pitch: 'C6', gain: 0.22 }]);
  for (const d of [4.86, 5.1, 5.34]) h.push([d + 0.36, 'cash lands', 'thud', { pitch: 'G2', to: 'C2', gain: 0.32 }]);
  h.push([5.98, 'watch', 'click', { gain: 0.25 }]); for (let i = 0; i < 4; i++) h.push([6.15 + i * 0.09, 'coin', 'bell', { pitch: ['E7', 'G7', 'D7', 'A7'][i], gain: 0.08 }]);
  h.push([6.4, 'card slide', 'whoosh', { len: 0.3, from: 900, to: 3000, gain: 0.14 }], [6.6, 'card slide', 'whoosh', { len: 0.3, from: 900, to: 3000, gain: 0.14 }]);
  h.push([8.31, 'paper lands', 'thud', { pitch: 'C3', to: 'G2', gain: 0.22 }], [8.95, 'push in', 'riser', { len: 0.45, gain: 0.14 }], [8.95, 'marker', 'type', { n: 7, len: 0.45, gain: 0.12 }], [9.4, 'credit', 'blip', { pitch: 'G6', gain: 0.2 }]);
  h.push([9.7, 'cash glow', 'coins', { gain: 0.18 }], [10.3, 'pull out', 'whoosh', { len: 0.35, from: 2600, to: 700, gain: 0.16 }]);
  h.push([10.68, 'passport lands', 'thud', { pitch: 'A2', to: 'D2', gain: 0.3 }], [10.9, 'marker X', 'type', { n: 4, len: 0.25, gain: 0.16 }]);
  h.push([T.tarmac - 0.3, 'leak', 'swell', { gain: 0.22 }], [T.tarmac, 'cut', 'sub', { len: 0.5, gain: 0.26 }], [11.75, 'jet flyby', 'whoosh', { len: 1.1, from: 250, to: 1400, gain: 0.22 }], [12.85, 'pass in', 'whoosh', { len: 0.3, from: 1500, to: 3800, gain: 0.15 }], [12.9, 'travel', 'pop', { pitch: 'E6', gain: 0.2 }]);
  h.push([T.villa - 0.3, 'leak', 'swell', { gain: 0.2 }], [T.villa, 'cut', 'sub', { len: 0.5, gain: 0.26 }], [14.6, '7x', 'pop', { pitch: 'C6', gain: 0.26 }], [15.4, 'card in', 'whoosh', { len: 0.3, from: 1500, to: 3800, gain: 0.12 }]);
  for (let i = 0; i < 12; i++) h.push([15.15 + i * 0.05, 'count', 'tick', { gain: 0.07 + i * 0.006 }]);
  h.push([15.78, '21x', 'bell', { pitch: 'C6', gain: 0.35 }], [15.8, 'coins burst', 'coins', { gain: 0.2 }]);
  return h.sort((a, b) => a[0] - b[0]);
}

// ================================================================== captions
let CAPS = [];
function buildCaptions(words) {
  const fix = [];
  for (let i = 0; i < words.length; i++) {
    let [a, b, w] = words[i]; if (!w || !w.trim()) continue; w = w.replace(/\$/g, '');
    if (w === '1200') w = '1,200';
    if (w === 'turn' && words[i + 1] && /^off/.test(words[i + 1][2])) { w = 'return'; }
    if (/^,\d/.test(w) && fix.length) { fix[fix.length - 1][2] += w; fix[fix.length - 1][1] = b; continue; } fix.push([a, b, w]);
  }
  const chunks = []; let cur = null;
  for (const [a, b, w] of fix) { if (!cur || cur.n >= 3 || /[.,?]$/.test(cur.text) || a - cur.end > 0.35) { cur = { start: a, end: b, text: w, n: 1 }; chunks.push(cur); } else { cur.text += ' ' + w; cur.end = b; cur.n++; } }
  chunks.forEach((c, i) => { c.until = Math.min(chunks[i + 1] ? chunks[i + 1].start : c.end + 0.5, c.end + 0.6); c.text = c.text.replace(/[,]$/, '').toUpperCase(); });
  return chunks;
}

// ================================================================== footage + film
let FOOT = null; const FCACHE = new Map();
async function loadFrame(t) {
  const idx = Math.min(SRC_FRAMES, Math.max(1, Math.floor(t * SRC_FPS) + 1));
  if (!FCACHE.has(idx)) { const im = new Image(); im.src = `assets/footage/f_${String(idx).padStart(5, '0')}.jpg`; try { await im.decode(); } catch { return; } FCACHE.set(idx, im); while (FCACHE.size > 8) FCACHE.delete(FCACHE.keys().next().value); }
  FOOT = FCACHE.get(idx);
}
function pushIn(t) { for (const [a, b] of FULL_WINDOWS) if (t >= a - 0.5 && t < b + 0.8) return Math.pow(1.1, P(t, a, b + 0.8, E.inOutSine)); return 1; }
const LAYERS = ['office_plate', 'office_subj', 'desk_plate', 'tarmac_plate', 'tarmac_subj', 'villa_plate', 'villa_subj', 'cash', 'statement', 'passport',
  'card_black', 'card_gold', 'note', 'watch', 'jet', 'palm', 'pass', 'shades', 'cloud0', 'cloud1', 'cloud2', 'coin0', 'coin1', 'coin2', 'coin3', 'coin4'];
const imgs = { badge: 'assets/badge.png' }; for (const n of LAYERS) imgs[n] = `assets/layers/${n}.${/plate/.test(n) ? 'jpg' : 'png'}`;
// motion blur (sub-frames) only while something moves fast
const FASTS = [[0.95, 1.9], [2.7, 4.6], [3.98, 4.6], [T.cash - 0.05, 5.8], [5.85, 6.4], [6.35, 7.0], [7.95, 8.35], [8.45, 9.0], [10.25, 10.7], [11.75, 12.6], [12.85, 13.3], [T.villa - 0.1, T.villa + 0.3], [15.0, 15.6], [15.78, 16.3]];
const fast = (t) => FASTS.some(([a, b]) => t >= a && t <= b);

M.film({
  fonts: [font(96, 400, 'Display'), font(96, 800, 'Serif'), font(96, 900, 'Serif'), font(46, 600, 'UI'), font(24, 500, 'UI')],
  images: imgs,
  hits: buildHits(),
  samples: 1,
  async init(_ctx, IMG) {
    SC = makeCanvas(W, H); SX = SC.getContext('2d');
    for (let i = 0; i < 3; i++) { CH.push(makeCanvas(W, H)); CHX.push(CH[i].getContext('2d')); }
    bakeLooks(IMG); buildPaper();
    CAPS = buildCaptions(await fetch('assets/words.json').then((r) => r.json()));
    for (let v = 0; v < 4; v++) { const c = makeCanvas(W, H), x = c.getContext('2d'), rr = mulberry32(300 + v), img = x.createImageData(W, H); for (let i = 0; i < img.data.length; i += 4) { const n = rr() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = n; img.data[i + 3] = 255; } x.putImageData(img, 0, 0); GRAIN.push(c); }
    VIG = makeCanvas(W, H); const vx = VIG.getContext('2d'), g = vx.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.45, H * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); vx.fillStyle = g; vx.fillRect(0, 0, W, H);
  },
  prepare: (t) => loadFrame(t),
  draw(ctx, u, t, IMG) {
    for (const n of LAYERS) if (!L[n] && IMG[n]) L[n] = IMG[n];
    const fh = footH(t); FH = fh;
    const top = fh >= SEAM ? SEAM - fh : 0, ph = Math.max(10, DH - fh - top);
    ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H);
    SX.setTransform(1, 0, 0, 1, 0, 0); SX.clearRect(0, 0, W, H); SX.setTransform(S, 0, 0, S, 0, 0);
    // Posterize Time (After Effects): the photo panel animates on 12s; footage and captions stay at full rate
    const tp = Math.floor(t * POSTER + 1e-6) / POSTER;
    drawShot(SX, sceneAt(tp), tp, ph);
    texture(SX, tp, ph);
    for (const [t0, seed] of LEAKS) leakBurn(SX, tp, t0, ph, seed);
    { // a soft dark band under the headline zone so the cream type reads over bright photos
      const g = SX.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, 'rgba(8,6,4,0.55)'); g.addColorStop(0.55, 'rgba(8,6,4,0.25)'); g.addColorStop(1, 'rgba(8,6,4,0)');
      SX.save(); SX.fillStyle = g; SX.fillRect(0, 0, DW, Math.min(ph, 640)); SX.restore(); }
    drawType(SX, tp);
    SX.save(); SX.setTransform(1, 0, 0, 1, 0, 0); SX.globalCompositeOperation = 'multiply'; SX.globalAlpha = 0.9; SX.drawImage(VIG, 0, 0, W, ph * S, 0, 0, W, ph * S); SX.restore();
    const ca = Math.max(...LEAKS.map(([t0]) => 16 * Math.max(0, 1 - Math.abs(tp - t0) / 0.3)), ...[0.95, 4.0, 15.78].map((h) => (tp > h ? 12 * Math.exp(-(tp - h) * 9) : 0)), 1.5);
    ctx.save(); ctx.translate(0, top * S); chroma(ctx, SC, ca, ph); ctx.restore();
    ctx.save(); ctx.scale(S, S);
    const dk = P(t, 2.6, 2.85) * (1 - P(t, END - 0.2, END));
    if (dk > 0.01) { const yy = t < T.cash ? 318 : fh >= SEAM ? Y(858) : 1520; ctx.globalAlpha = 0.9 * dk; ctx.fillStyle = 'rgba(8,8,14,0.7)'; ctx.fillRect(300, yy - 22, 480, 34); ctx.globalAlpha = dk; ctx.font = font(22, 500, 'UI'); ctx.textAlign = 'center'; ctx.fillStyle = '#FFFFFF'; ctx.fillText('Individual results vary. Education only.', 540, yy); ctx.globalAlpha = 1; }
    if (FOOT && fh > 1) {
      M.cover(ctx, FOOT, 0, DH - fh, DW, fh, { fx: 0.5, fy: lerp(0.25, 0.45, clamp((fh - SEAM) / (DH - SEAM))), zoom: pushIn(t) });
      if (fh < DH - 2) { ctx.fillStyle = GOLD; ctx.fillRect(0, DH - fh - 3, DW, 6); }
    }
    BR.captions(ctx, t, fh, CAPS);
    ctx.restore();
  },
  post(ctx, u, t) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.16; ctx.drawImage(GRAIN[Math.floor(t * 24) % 4], 0, 0); ctx.restore(); },
});
