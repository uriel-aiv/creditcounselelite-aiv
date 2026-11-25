// CCE — "20 Photo Collage 2.5D" founder split-screen. Pure function of time: window.seek(t) paints frame t.
// Style: After Effects-style 2.5D photo animation. Every shot is flat photo layers placed at depths in front of a
// camera: a clean background plate (subject erased + filled by Nano Banana 2.1), the subject cut out, and flat
// front-on props (cut out from Nano Banana 2.1 flat lays). Nothing is puppeted: people stay still, elements are never
// spun or tilted. All the motion is the camera dollying/craning through the layers (parallax), elements flying in fast
// with motion blur and settling into a slow drift, props dropping toward the camera's subject plane, and a depth-of-
// field model (near/far layers blur, focus racks between them). On top: flash cuts, a fog wipe, a whip, chromatic
// aberration on hits, glow, light leaks, marker strokes, grain and a vignette.
// Clip: VSL #2 "Busboy" (busboy with nothing -> 14 million in real estate -> 50,000 a month -> 4,000 members ->
// up to 500,000 at as low as 0% -> click the link). The past is black-and-white halftone, the present is colour.
import * as M from './lib/motion.js';
import * as BR from './lib/brand.js';

const { W, H, E, prog, clamp, lerp, spring, springKeys, font, mulberry32, noise1 } = M;
const DW = 1080, DH = 1920, S = W / DW, F = 1000;
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 816;
const SEAM = 980, IW = 1080, IH = 1935;
const GOLD = '#F2C14E', RED = '#E5392F', INK = '#0B0B10';
const P = (t, a, b, ease = E.inOutCubic) => ease(prog(t, a, b));
const antic = (t, t0, dur = 0.2) => { const p = prog(t, t0 - dur, t0 + 0.02); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; };
const pop = (t, t0, cfg = { stiffness: 260, damping: 15 }) => (t < t0 ? 0 : spring(t - t0, cfg));
let FH = DH;
const Y = (y) => (FH >= SEAM ? y - (FH - SEAM) : y + (SEAM - FH) * 0.48);

// ================================================================== timeline (seconds; VSL #2 word timings)
const T = { diner: 0, alone: 4.8, roof: 9.45, desk: 14.9, members: 17.45, funding: 20.6, final: 27.3 };
const END = 31.39; window.__END = END;
const FH_KEYS = [[0, 0], [4.8, SEAM], [9.4, 0], [10.3, SEAM], [18.45, 0], [24.45, SEAM], [27.3, 0], [END, 0]];
function footH(t) {
  let v = springKeys(t, FH_KEYS, { stiffness: 150, damping: 17 });
  for (let i = 1; i < FH_KEYS.length; i++) v -= Math.sign(FH_KEYS[i][1] - FH_KEYS[i - 1][1]) * 34 * antic(t, FH_KEYS[i][0], 0.22);
  return clamp(v, 0, DH);
}
const FULL_WINDOWS = [];
const ORDER = ['diner', 'alone', 'roof', 'desk', 'members', 'funding', 'final'];
const sceneAt = (t) => { let n = ORDER[0]; for (const k of ORDER) if (t >= T[k]) n = k; return n; };
const LEAKS = ORDER.slice(1).map((k, i) => [T[k], i]);   // light-leak burns that carry every cut
const POSTER = 12;   // Posterize Time frame rate for the photo panel

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
const DESKZ = 2550;

function shotDiner(ph) {   // the past: black-and-white halftone diner, the young busboy
  const fy = 0.5, pl = { ...plate('diner_plate', ph, fy, 3000), look: 'ht' }, sb = { ...plate('diner_subj', ph, fy, 1800), look: 'bw' };
  return {
    cam: [[0, { z: -150, x: 60, y: 0, focus: 1800 }], [3.3, { z: 180, x: 0, y: -20, focus: 1800 }], [3.7, { z: 220, x: -10, y: -25, focus: 1000 }], [T.alone, { z: 330, x: -40, y: -40, focus: 1000 }]],
    layers: [pl, sb,
      { img: 'wallet', x: 770, y: ph * 0.44, w: 320, Z: 1000, enter: fly(3.35, 500, 0, 0.6), drift: [-4, -4] },
      { img: 'cloud3', x: 900, y: ph * 0.88, w: 900, Z: 520, alpha: 0.18, drift: [-18, 0] },
    ],
  };
}
function shotAlone(ph) {   // no connections, no playbook: a bare black-and-white desk, then the playbook lands and lights up
  const cy = ph / 2;
  return {
    cam: [[T.alone, { z: -300, x: 0, y: 0, focus: DESKZ }], [T.roof, { z: 380, x: 0, y: 40, focus: DESKZ }]],
    layers: [{ img: 'desk_plate', look: 'bw', Z: 2700, w: IW * 1.3, x: DW / 2, y: cy },
      { img: 'wallet', x: 250, y: cy + 230, w: 300, Z: DESKZ, enter: drop(4.9), shadow: 1 },
      ...[0, 5, 10].map((k, i) => ({ img: 'pola' + k, x: [820, 900, 760][i], y: cy + [-120, 110, 330][i], w: 200, Z: DESKZ - 10 * i, enter: drop(5.2 + i * 0.12), shadow: 1, exit: { t: 6.0 + i * 0.05, d: 0.4, dx: 700, fade: 1 } })),
      { img: 'playbook', x: 520, y: cy + 110, w: 300, Z: DESKZ - 30, enter: drop(6.5), shadow: 1, glow: pulse(7.45, 8.7) },
      { img: 'note', look: 'bw', x: 980, y: cy - 300, w: 360, Z: 650, enter: fly(5.0, 500, -200, 1.2), drift: [-22, 10] },
    ],
  };
}
function shotRoof(ph) {   // today: colour, the same man on a rooftop; keys fly in, buildings rise in depth
  const fy = ph > 1500 ? 0.48 : 0.36, pl = plate('roof_plate', ph, fy, 3200), sb = plate('roof_subj', ph, fy, 2000);
  const by = ph + 120;
  return {
    cam: [[T.roof, { z: -200, x: 0, y: 0, focus: 2000 }], [T.desk, { z: 360, x: 50, y: -60, focus: 2000 }]],
    layers: [pl, sb,
      { img: 'bldg0', x: 150, y: by - 260, w: 300, Z: 1500, enter: fly(11.7, 0, 700, 0.7), drift: [0, -4] },
      { img: 'bldg1', x: 930, y: by - 300, w: 300, Z: 1350, enter: fly(11.82, 0, 700, 0.7), drift: [0, -4] },
      { img: 'bldg2', x: 60, y: by - 120, w: 460, Z: 700, enter: fly(11.95, 0, 800, 0.7), drift: [4, -6] },
      { img: 'keys', x: 890, y: ph * 0.62, w: 220, Z: 1100, enter: fly(9.95, 600, -100, 0.55), drift: [-4, 3], glow: pulse(10.4) },
    ],
    leak: true,
  };
}
function shotDesk(ph) {   // 50,000 a month: cash and the month page drop on the desk
  const cy = ph / 2;
  return {
    cam: [[T.desk, { z: -350, x: 0, y: 0, focus: DESKZ }], [T.members, { z: 420, x: 0, y: -30, focus: DESKZ }]],
    layers: [{ img: 'desk_plate', Z: 2700, w: IW * 1.3, x: DW / 2, y: cy },
      { img: 'cash', x: 330, y: cy + 180, w: 460, Z: DESKZ, enter: drop(14.95), shadow: 1, glow: pulse(15.4, 16.5) },
      { img: 'cash', x: 790, y: cy + 230, w: 420, Z: DESKZ, enter: drop(15.15), shadow: 1, glow: pulse(15.6, 16.5) },
      { img: 'calendar', x: 560, y: cy + 120, w: 380, Z: DESKZ - 20, enter: drop(15.45), shadow: 1 },
      ...[0, 1, 2].map((i) => ({ img: 'coin' + i, x: [120, 960, 600][i], y: cy + [60, 40, 400][i], w: 100, Z: DESKZ, enter: drop(15.9 + i * 0.1, 0.3), shadow: 1 })),
      { img: 'note', x: 100, y: cy + 380, w: 380, Z: 650, enter: fly(15.0, -500, 200, 1.2), drift: [22, -6] },
    ],
  };
}
function shotMembers(ph) {   // 4,000+ members: portraits land on a dark board while the camera pulls back
  const cy = ph / 2, rr = mulberry32(44), L2 = [];
  for (let i = 0; i < 12; i++) { const c = i % 4, r = Math.floor(i / 4); L2.push({ img: 'pola' + i, x: 170 + c * 250 + (rr() - 0.5) * 60, y: cy - 300 + r * 380 + (rr() - 0.5) * 60, w: 190, Z: DESKZ - rr() * 260, enter: drop(17.55 + i * 0.16, 0.32), shadow: 1 }); }
  return {
    cam: [[T.members, { z: 900, x: 0, y: -200, focus: DESKZ - 120 }], [T.funding, { z: 80, x: 0, y: 0, focus: DESKZ - 120 }]],
    layers: [{ img: 'desk_plate', look: 'bw', Z: 2700, w: IW * 1.6, x: DW / 2, y: cy, grade: 1 }, ...L2],
  };
}
function shotFunding(ph) {   // up to 500,000, as low as 0%: the same man, gold card in front; paperwork gets crossed out
  const fy = ph > 1500 ? 0.46 : 0.37, pl = { ...plate('office_plate', ph, fy, 3000), look: 'ht' }, sb = plate('office_subj', ph, fy, 1800);
  return {
    cam: [[T.funding, { z: -150, x: 0, y: 0, focus: 1800 }], [24.2, { z: 200, x: -30, y: -60, focus: 1800 }], [24.6, { z: 220, x: -30, y: -70, focus: 1000 }], [END, { z: 420, x: -60, y: -110, focus: 1000 }]],
    layers: [pl, { ...sb, glow: pulse(22.1, 24.8) },
      { img: 'card_black', look: 'ht', x: 170, y: ph * 0.3, w: 230, Z: 1300, enter: fly(21.0, -520, 0), drift: [4, -3] },
      { img: 'card_gold', x: 910, y: ph * 0.26, w: 230, Z: 1200, enter: fly(21.1, 520, -40), drift: [-4, 2] },
      { img: 'card_gold', x: 540, y: ph * 0.8, w: 520, Z: 900, enter: fly(22.0, 0, 900, 0.6), drift: [0, -6], glow: pulse(22.3, 24.8) },
      { img: 'card_gold', x: 1010, y: ph * 0.92, w: 560, Z: 520, enter: fly(21.0, 600, 120, 0.8), drift: [-14, 0] },
      { img: 'docs', look: 'ht', x: 760, y: ph * 0.62, w: 380, Z: 1000, enter: fly(25.3, 700, 0, 0.55), drift: [-3, 0],
        after: (c, w, h, t) => { if (t > 25.95) scribbleX(c, 0, 0, w * 0.4, P(t, 25.95, 26.3, E.outQuad)); } },
    ],
    leak: true,
  };
}
function shotFinal(ph) {   // what's possible: the villa, a jet crossing, an arrow to the link
  const fy = 0.6, pl = plate('villa_plate', ph, fy, 3000);
  return {
    cam: [[T.final, { z: -200, x: -40, y: -60, focus: 2400 }], [END + 1, { z: 320, x: 20, y: 20, focus: 2400 }]],
    layers: [pl,
      { img: 'jet', look: 'bw', x: 520, y: 560, w: 420, Z: 2600, enter: fly(27.6, 1100, 40, 1.2), drift: [-26, -3] },
      { img: 'palm', x: 1080, y: 150, w: 700, Z: 460, drift: [-5, 2] },
      { img: 'palm', look: 'bw', x: 70, y: 1720, w: 760, Z: 540, flip: 1, drift: [5, -2] },
      ...[0, 1, 2].map((i) => ({ img: 'coin' + i, x: [230, 860, 760][i], y: [900, 820, 1080][i], w: 90, Z: 1200 + i * 120, enter: fly(30.0 + i * 0.06, 540 - [230, 860, 760][i], 0, 0.5), drift: [0, -5] })),
    ],
    leak: true,
  };
}
const SHOTS = { diner: shotDiner, alone: shotAlone, roof: shotRoof, desk: shotDesk, members: shotMembers, funding: shotFunding, final: shotFinal };
const START = T;

function drawShot(c, name, t, ph, off = { x: 0, y: 0 }) {
  const sh = SHOTS[name](ph), cam = camKeys(t, sh.cam);
  const rk = clamp((t - START[name]) / 0.6); if (rk < 1) cam.focus = lerp(cam.z + 260, cam.focus, E.outCubic(rk));
  const items = drawLayers(c, sh.layers, cam, t, ph, off);
  if (sh.flare) { const pl = items.find((i) => i.ly.img === sh.flare.img); if (pl) sunFlare(c, pl.sx - pl.w / 2 + sh.flare.u * pl.w, pl.sy - pl.h / 2 + sh.flare.v * pl.h, t, ph); }
  if (sh.leak) lightLeak(c, t, ph, name === 'final' ? 1 : 0);
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
const LOOKS = { diner_plate: ['ht'], diner_subj: ['bw'], desk_plate: ['bw'], note: ['bw'], office_plate: ['ht'], card_black: ['ht'], docs: ['ht'], jet: ['bw'], palm: ['bw'] };
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
  let y = cy, li = 0, prev = 0;
  for (const ln of lines) {
    const sz = ln.size || size; c.font = font(sz, 800, 'Serif'); c.letterSpacing = '1px';
    if (li) y += sz * 0.86 + prev * 0.24;
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
    prev = sz; li++;
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
  const S1 = (lines, y, a, b, size) => title(c, lines, y, t, a, b, size), w = (tx, d = 0, col) => ({ t: tx, d, c: col });
  S1([{ words: [w('THE'), w('BUSBOY', 0.1, GOLD)], size: 104 }], 250, 0.3, 3.2);
  S1([{ words: [w('NOTHING', 0)], size: 112 }, { words: [w('IN THE BANK', 0.15)], size: 58 }], 230, 3.4, T.alone - 0.2);
  S1([{ words: [w('NO CONNECTIONS', 0)], size: 70 }], 160, 5.2, 6.4);
  S1([{ words: [w('NO ONE HANDED ME', 0)], size: 50 }, { words: [w('THE PLAYBOOK', 0.15, GOLD)], size: 92 }], 120, 6.5, T.roof - 0.2);
  if (t >= T.roof - 0.1 && t < 12.6) {
    const out = P(t, 12.35, 12.6, E.inCubic), v = Math.round(lerp(0, 14, P(t, 10.35, 10.95, E.outCubic)));
    if (t > 10.3) numberText(c, v + ' MILLION', 262, t, 10.35, out, t > 10.35 && t < 10.95, 112);
    S1([{ words: [w('IN REAL ESTATE', 0)], size: 46 }], 330, 11.75, 12.35);
    S1([{ words: [w('TODAY', 0)], size: 50 }], 110, 9.6, 12.35);
  }
  S1([{ words: [w('ZERO', 0, GOLD)], size: 130 }, { words: [w('OUT OF POCKET', 0.15)], size: 54 }], 210, 12.7, T.desk - 0.2);
  if (t >= T.desk && t < T.members + 0.3) {
    const out = P(t, T.members - 0.25, T.members, E.inCubic), v = Math.round(lerp(0, 50000, P(t, 16.0, 16.6, E.outCubic)));
    if (t > 15.95) numberText(c, v.toLocaleString('en-US'), 250, t, 16.0, out, t > 16.0 && t < 16.6, 132);
    S1([{ words: [w('A MONTH', 0)], size: 54 }], 330, 16.9, T.members - 0.25);
  }
  S1([{ words: [w('SINCE 2017', 0)], size: 64 }], 230, 17.6, 19.4);
  if (t >= 19.4 && t < T.funding + 0.3) {
    const out = P(t, T.funding - 0.25, T.funding, E.inCubic), v = Math.round(lerp(0, 4000, P(t, 19.55, 20.15, E.outCubic)));
    numberText(c, v.toLocaleString('en-US') + '+', 330, t, 19.55, out, t < 20.15, 170);
    S1([{ words: [w('MEMBERS', 0)], size: 62 }], 420, 20.15, T.funding - 0.25);
  }
  if (t >= 21.7 && t < 24.0) {
    const out = P(t, 23.75, 24.0, E.inCubic), v = Math.round(lerp(0, 500000, P(t, 22.05, 22.65, E.outCubic)));
    S1([{ words: [w('UP TO', 0)], size: 56 }], 230, 21.75, 23.75);
    numberText(c, v.toLocaleString('en-US'), 410, t, 22.05, out, t < 22.65, 150);
  }
  S1([{ words: [w('AS LOW AS', 0)], size: 56 }, { words: [w('0%', 0.2, GOLD)], size: 150 }], 230, 24.1, 25.2);
  S1([{ words: [w('NO DOCUMENTATION', 0)], size: 62 }], 170, 25.4, T.final - 0.2);
  S1([{ words: [w('CLICK THE LINK', 0)], size: 64 }], 300, 28.0, 29.9);
  S1([{ words: [w("WHAT'S POSSIBLE", 0, GOLD)], size: 92 }, { words: [w('FOR YOU', 0.2)], size: 72 }], 300, 30.0, END - 0.2);
  if (t > 28.4 && t < 30.0) arrowDown(c, 540, 380, P(t, 28.4, 28.75, E.outCubic), t);
}
function arrowDown(c, x, y, p, t) {   // a hand-drawn gold arrow, bouncing, pointing at the link below
  const b = Math.sin((t - 28.4) * 9) * 10 * clamp((t - 28.75) * 4), L1 = 300 * p;
  c.save(); c.translate(x, y + b); c.strokeStyle = GOLD; c.lineWidth = 12; c.lineCap = 'round'; c.lineJoin = 'round'; c.shadowColor = 'rgba(242,193,78,0.8)'; c.shadowBlur = 24;
  c.beginPath(); for (let i = 0; i <= 20; i++) { const u = i / 20 * p; c.lineTo(Math.sin(u * 5) * 10, u * 300); } c.stroke();
  if (p > 0.95) { c.beginPath(); c.moveTo(-50, L1 - 60); c.lineTo(0, L1 + 6); c.lineTo(50, L1 - 60); c.stroke(); }
  c.restore();
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
  const h = [], lk = (t) => h.push([t - 0.3, 'leak', 'swell', { gain: 0.2 }], [t, 'cut', 'sub', { len: 0.5, gain: 0.26 }]);
  for (const k of ORDER.slice(1)) lk(T[k]);
  h.push([0.3, 'busboy', 'blip', { pitch: 'C5', gain: 0.14 }], [3.35, 'wallet', 'whoosh', { len: 0.3, from: 1500, to: 3800, gain: 0.14 }], [3.9, 'empty', 'boing', { pitch: 'E4', to: 'C4', gain: 0.14 }]);
  h.push([5.26, 'wallet lands', 'thud', { pitch: 'A2', to: 'D2', gain: 0.22 }]); for (let i = 0; i < 3; i++) h.push([5.52 + i * 0.12, 'photo lands', 'click', { gain: 0.16 }]);
  h.push([6.0, 'photos away', 'whoosh', { len: 0.35, from: 800, to: 2800, gain: 0.14 }], [6.86, 'playbook lands', 'thud', { pitch: 'G2', to: 'C2', gain: 0.3 }], [7.45, 'playbook', 'bell', { pitch: 'G5', gain: 0.2 }], [8.7, 'works', 'swell', { gain: 0.12 }]);
  h.push([9.95, 'keys', 'coins', { gain: 0.16 }], [10.35, '14 million', 'bell', { pitch: 'C6', gain: 0.3 }]);
  for (let i = 0; i < 3; i++) h.push([11.7 + i * 0.12, 'building up', 'whoosh', { len: 0.4, from: 300, to: 1400, gain: 0.14 }]);
  h.push([12.7, 'zero', 'pop', { pitch: 'C6', gain: 0.24 }]);
  for (const d of [14.95, 15.15, 15.45]) h.push([d + 0.36, 'lands', 'thud', { pitch: 'G2', to: 'C2', gain: 0.28 }]);
  for (let i = 0; i < 12; i++) h.push([16.0 + i * 0.05, 'count', 'tick', { gain: 0.07 + i * 0.006 }]);
  h.push([16.62, '50,000', 'coins', { gain: 0.28 }]);
  for (let i = 0; i < 12; i++) h.push([17.55 + i * 0.16 + 0.32, 'photo', 'click', { gain: 0.12 }]);
  for (let i = 0; i < 12; i++) h.push([19.55 + i * 0.05, 'count', 'tick', { gain: 0.07 + i * 0.006 }]);
  h.push([20.17, '4,000', 'bell', { pitch: 'E6', gain: 0.3 }]);
  h.push([21.05, 'cards', 'whoosh', { len: 0.3, from: 1500, to: 3800, gain: 0.14 }], [22.0, 'gold card', 'whoosh', { len: 0.4, from: 900, to: 3400, gain: 0.18 }]);
  for (let i = 0; i < 12; i++) h.push([22.05 + i * 0.05, 'count', 'tick', { gain: 0.07 + i * 0.006 }]);
  h.push([22.67, '500,000', 'bell', { pitch: 'C6', gain: 0.32 }], [24.3, '0%', 'pop', { pitch: 'C6', gain: 0.26 }]);
  h.push([25.3, 'docs in', 'whoosh', { len: 0.3, from: 1500, to: 3800, gain: 0.14 }], [25.95, 'marker X', 'type', { n: 4, len: 0.3, gain: 0.16 }]);
  h.push([27.6, 'jet', 'whoosh', { len: 1.2, from: 250, to: 1400, gain: 0.2 }], [28.4, 'arrow', 'pop', { pitch: 'G5', gain: 0.22 }], [30.0, 'possible', 'bell', { pitch: 'E6', gain: 0.28 }], [30.05, 'coins', 'coins', { gain: 0.16 }]);
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
const LAYERS = ['diner_plate', 'diner_subj', 'roof_plate', 'roof_subj', 'office_plate', 'office_subj', 'desk_plate', 'villa_plate', 'cash', 'card_black', 'card_gold', 'note', 'jet', 'palm', 'cloud3',
  'coin0', 'coin1', 'coin2', 'wallet', 'keys', 'playbook', 'docs', 'calendar', 'bldg0', 'bldg1', 'bldg2', ...Array.from({ length: 12 }, (_, i) => 'pola' + i)];
const imgs = { badge: 'assets/badge.png' }; for (const n of LAYERS) imgs[n] = `assets/layers/${n}.${/plate/.test(n) ? 'jpg' : 'png'}`;
// motion blur (sub-frames) only while something moves fast

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
    const ca = Math.max(...LEAKS.map(([t0]) => 16 * Math.max(0, 1 - Math.abs(tp - t0) / 0.3)), ...[10.35, 16.62, 20.17, 22.67, 24.3].map((h) => (tp > h ? 12 * Math.exp(-(tp - h) * 9) : 0)), 1.5);
    ctx.save(); ctx.translate(0, top * S); chroma(ctx, SC, ca, ph); ctx.restore();
    ctx.save(); ctx.scale(S, S);
    const dk = P(t, 10.3, 10.55) * (1 - P(t, END - 0.2, END));
    if (dk > 0.01) { const yy = fh >= SEAM ? Y(858) : 1520; ctx.globalAlpha = 0.9 * dk; ctx.fillStyle = 'rgba(8,8,14,0.7)'; ctx.fillRect(300, yy - 22, 480, 34); ctx.globalAlpha = dk; ctx.font = font(22, 500, 'UI'); ctx.textAlign = 'center'; ctx.fillStyle = '#FFFFFF'; ctx.fillText('Individual results vary. Education only.', 540, yy); ctx.globalAlpha = 1; }
    if (FOOT && fh > 1) {
      M.cover(ctx, FOOT, 0, DH - fh, DW, fh, { fx: 0.5, fy: lerp(0.25, 0.45, clamp((fh - SEAM) / (DH - SEAM))), zoom: pushIn(t) });
      if (fh < DH - 2) { ctx.fillStyle = GOLD; ctx.fillRect(0, DH - fh - 3, DW, 6); }
    }
    BR.captions(ctx, t, fh, CAPS);
    ctx.restore();
  },
  post(ctx, u, t) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.16; ctx.drawImage(GRAIN[Math.floor(t * 24) % 4], 0, 0); ctx.restore(); },
});
