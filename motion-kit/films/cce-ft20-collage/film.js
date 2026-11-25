// CCE — "20 Photo Collage 2.5D" founder split-screen. Pure function of time: window.seek(t) paints frame t.
// Style: After Effects-style 2.5D photo animation. Each shot is a real photo split into layers: a clean background
// plate (the subject erased and filled by Nano Banana 2.1), the subject cut out (rembg + plate-difference mask) and
// props generated on white and cut out. The camera pushes through the layers at different depths (parallax); props
// drop onto surfaces with real shadows; on top go blur-ins, motion blur, chromatic aberration, glow, fog wipes,
// hand-drawn marker strokes, film grain and a vignette.
// Clip: Video 3 "Sign-up bonuses" (1,200 / walked away with 15,600 free cash / statement credit / travel / 7 to 21x).
import * as M from './lib/motion.js';
import * as BR from './lib/brand.js';

const { W, H, E, prog, clamp, lerp, spring, springKeys, font, mulberry32, hash01, noise1 } = M;
const DW = 1080, DH = 1920, S = W / DW;
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 478;
const SEAM = 980, IW = 1080, IH = 1935;           // layer images are 1080 x 1935 (9:16 plates and aligned cut-outs)
const GOLD = '#F2C14E', RED = '#E5392F', INK = '#0B0B10';
const P = (t, a, b, ease = E.inOutCubic) => ease(prog(t, a, b));
const antic = (t, t0, dur = 0.2) => { const p = prog(t, t0 - dur, t0 + 0.02); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; };
const pop = (t, t0, cfg = { stiffness: 260, damping: 15 }) => (t < t0 ? 0 : spring(t - t0, cfg));
let FH = DH;
const Y = (y) => (FH >= SEAM ? y - (FH - SEAM) : y + (SEAM - FH) * 0.48);

// ================================================================== timeline (seconds; Video 3 word timings)
const T = { office: 0.8, cash: 4.84, statement: 7.84, passport: 10.3, tarmac: 11.35, villa: 14.35 };
const END = 17.29; window.__END = END;
const FH_KEYS = [[0, 1920], [0.8, SEAM], [T.tarmac, 0]];   // founder, split for the money talk, full-screen photos for travel
function footH(t) {
  let v = springKeys(t, FH_KEYS, { stiffness: 150, damping: 17 });
  for (let i = 1; i < FH_KEYS.length; i++) v -= Math.sign(FH_KEYS[i][1] - FH_KEYS[i - 1][1]) * 34 * antic(t, FH_KEYS[i][0], 0.22);
  return clamp(v, 0, DH);
}
const FULL_WINDOWS = [[0, 0.8]];
const WHIPS = [[T.cash, 0, 1], [T.villa, -1, 0]];        // [time, dirX, dirY]: a fast camera whip with motion blur
const FOG = T.tarmac;                                    // fog/cloud wipe into the travel shot

// ================================================================== scenes: plates, cut-outs, camera
// focus (fx, fy) = image point held at the panel centre; z = camera push over the shot; depth = how much a layer
// takes of that push (background < subject = parallax).
const SCN = {
  office: { plate: 'office_plate', subj: 'office_subj', fx: 0.36, fy: [0.37, 0.355], z: [1.0, 1.12], dx: [20, -30] },
  desk: { plate: 'desk_plate', fx: 0.5, fy: [0.5, 0.5], z: [1.04, 1.16], dx: [0, 0] },
  tarmac: { plate: 'tarmac_plate', subj: 'tarmac_subj', fx: 0.5, fy: [0.52, 0.5], z: [1.0, 1.1], dx: [0, 0] },
  villa: { plate: 'villa_plate', subj: 'villa_subj', fx: 0.48, fy: [0.62, 0.6], z: [1.0, 1.1], dx: [-40, 20] },
};
function sceneAt(t) { return t < T.cash ? ['office', T.office, T.cash] : t < T.tarmac ? ['desk', T.cash, T.tarmac] : t < T.villa ? ['tarmac', T.tarmac, T.villa] : ['villa', T.villa, END]; }

let L = {};   // images
function camFor(name, t, t0, t1) {
  const c = SCN[name], p = E.inOutSine(prog(t, t0 - 0.3, t1 + 0.3));
  return { fx: c.fx, fy: lerp(c.fy[0], c.fy[1], p), z: lerp(c.z[0], c.z[1], p), dx: lerp(c.dx[0], c.dx[1], p) };
}
// image-space -> panel transform for a layer at a given depth
function layerXf(cam, ph, depth, whipX = 0, whipY = 0) {
  const base = Math.max(DW / IW, ph / IH) * 1.02;
  const k = base * (1 + (cam.z - 1) * depth);
  let ox = DW / 2 + cam.dx * depth - cam.fx * IW * k, oy = ph / 2 - cam.fy * IH * k;
  // keep the plate covering the panel (the same clamp shift is applied to every layer so they stay registered)
  const kb = base * (1 + (cam.z - 1) * 0.6);
  const bx = DW / 2 + cam.dx * 0.6 - cam.fx * IW * kb, by = ph / 2 - cam.fy * IH * kb;
  const sx = clamp(bx, DW - IW * kb, 0) - bx, sy = clamp(by, ph - IH * kb, 0) - by;
  return { k, ox: ox + sx + whipX, oy: oy + sy + whipY };
}
function drawLayer(c, img, xf, alpha = 1, extra) {
  if (!img) return;
  c.save(); c.globalAlpha *= alpha; c.translate(xf.ox, xf.oy); c.scale(xf.k, xf.k);
  if (extra) extra(c);
  c.drawImage(img, 0, 0, IW, IH); c.restore();
}

// ================================================================== effects
let SC, SX, CH = [], CHX = [], FOGC, GRAIN = [], VIG;
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
// chromatic aberration: split the panel into R/G/B and offset red and blue
function chroma(dst, src, amt, ph) {
  if (amt < 0.4) { dst.drawImage(src, 0, 0); return; }
  const cols = ['#FF0000', '#00FF00', '#0000FF'], off = [amt, 0, -amt];
  for (let i = 0; i < 3; i++) {
    const x = CHX[i]; x.globalCompositeOperation = 'copy'; x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = cols[i]; x.fillRect(0, 0, src.width, src.height);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(src, 0, 0);
  }
  dst.save(); dst.fillStyle = '#000'; dst.fillRect(0, 0, src.width, Math.min(src.height, ph * S + 2)); dst.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) dst.drawImage(CH[i], off[i] * S, 0);
  dst.restore();
}
function buildFog() {   // a soft cloud bank: many overlapping white puffs, seeded
  FOGC = makeCanvas(540, 1400); const x = FOGC.getContext('2d'), rr = mulberry32(77);
  for (let i = 0; i < 260; i++) {
    const cx = rr() * 540, cy = rr() * 1400, r = 40 + rr() ** 2 * 170, g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    const a = 0.1 + rr() * 0.22; g.addColorStop(0, `rgba(245,247,250,${a})`); g.addColorStop(1, 'rgba(245,247,250,0)');
    x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
}
function fogAt(t) { return clamp(1 - Math.abs(t - FOG) / 0.55); }
function drawFog(c, t, ph) {
  const f = fogAt(t); if (f <= 0.01) return;
  const y = lerp(500, -1500, prog(t, FOG - 0.7, FOG + 0.7));
  c.save(); c.globalAlpha = clamp(f * 1.3);
  c.drawImage(FOGC, -60, y, DW + 120, 2800);
  c.globalAlpha = E.inOutSine(f) * 0.9; c.fillStyle = '#EEF1F4'; c.fillRect(0, 0, DW, ph);
  c.restore();
}
function whipAt(t) { for (const [w, dx, dy] of WHIPS) { const p = (t - w) / 0.22; if (p > -1 && p < 1) return { p, dx, dy, w, q: E.inOutCubic((p + 1) / 2) }; } return null; }

// ================================================================== type (Anton caps, one gold word, pops in sharp from a blur)
function title(c, lines, cy, t, a, b, size = 112) {
  if (t < a - 0.05 || t > b + 0.4) return;
  const out = P(t, b, b + 0.3, E.inCubic);
  c.save(); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  let y = cy; let wi = 0;
  for (const ln of lines) {
    const sz = ln.size || size; c.font = font(sz, 400, 'Display');
    const words = ln.words, gap = sz * 0.22, ws = words.map((w) => c.measureText(w.t).width), tw = ws.reduce((s, v) => s + v, 0) + gap * (words.length - 1);
    let x = DW / 2 - tw / 2;
    words.forEach((w, i) => {
      const t0 = a + (w.d ?? wi * 0.09), k = pop(t, t0, { stiffness: 320, damping: 17 }), bl = clamp(1 - prog(t, t0, t0 + 0.18)) * 14 + out * 16;
      if (k > 0.001) {
        c.save(); c.translate(x + ws[i] / 2, y - sz * 0.35 - out * 40); c.scale(lerp(1.5, 1, Math.min(1, k)) * (k > 1 ? k : 1), lerp(1.5, 1, Math.min(1, k)) * (k > 1 ? k : 1));
        c.globalAlpha = clamp(k * 2) * (1 - out); c.filter = bl > 0.3 ? `blur(${bl.toFixed(1)}px)` : 'none';
        c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 24; c.shadowOffsetY = 6;
        c.fillStyle = w.c || '#FFFFFF'; c.fillText(w.t, 0, sz * 0.35);
        c.restore();
      }
      x += ws[i] + gap; wi++;
    });
    y += sz * 0.98;
  }
  c.restore();
}
function counter(c, t, a, b, v0, v1, cy, suffix = '', size = 170, col = GOLD) {   // ticking number
  if (t < a - 0.05) return;
  const v = Math.round(lerp(v0, v1, P(t, a, b, E.outCubic))), s = v.toLocaleString('en-US') + suffix;
  title(c, [{ words: [{ t: s, c: col, d: 0 }], size }], cy, t, a - 0.12, 99);
}

// hand-drawn marker strokes (ref: dashed arrows, scribbled circles)
function scribbleEllipse(c, cx, cy, rx, ry, p, col = GOLD, wdt = 9) {
  if (p <= 0) return;
  c.save(); c.strokeStyle = col; c.lineWidth = wdt; c.lineCap = 'round'; c.lineJoin = 'round';
  c.shadowColor = col; c.shadowBlur = 16; c.beginPath();
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
function dashedArrow(c, x0, y0, x1, y1, bend, p, col = '#FFFFFF') {
  if (p <= 0) return;
  const qx = (x0 + x1) / 2 + bend, qy = (y0 + y1) / 2;
  const pt = (u) => [(1 - u) ** 2 * x0 + 2 * (1 - u) * u * qx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * qy + u * u * y1];
  c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 7; c.lineCap = 'round'; c.setLineDash([18, 16]); c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 10;
  c.beginPath(); for (let i = 0; i <= 40 * p; i++) { const [x, y] = pt(i / 40); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  if (p > 0.97) { const [ax, ay] = pt(1), [bx, by] = pt(0.95), an = Math.atan2(ay - by, ax - bx); c.setLineDash([]); c.translate(ax, ay); c.rotate(an); c.beginPath(); c.moveTo(6, 0); c.lineTo(-26, -16); c.lineTo(-26, 16); c.closePath(); c.fill(); }
  c.restore();
}

// a prop that drops onto the desk: starts big and high (big soft shadow), lands with a squash; shadow tightens
function dropProp(c, img, t, t0, x, y, w, rot, opts = {}) {
  if (!img || t < t0 - 0.02) return;
  const p = clamp((t - t0) / 0.32), fall = E.inCubic(p), land = t - t0 - 0.32;
  const h = 1 - fall;                                         // height above the desk (1 = high)
  const sq = land > 0 ? 1 + Math.exp(-land * 9) * Math.sin(land * 30) * 0.035 : 1;
  const s = (1 + h * 0.55) * sq, hh = w * img.height / img.width;
  const out = opts.out ? P(t, opts.out, opts.out + 0.35, E.inCubic) : 0;
  c.save(); c.translate(x + (opts.slide || 0) * out, y - h * 120 + out * (opts.slideY || 0)); c.rotate(rot + h * 0.25 * (opts.spin ?? 1)); c.scale(s, s);
  c.globalAlpha = clamp(p * 4) * (1 - (opts.fadeOut ? out : 0));
  c.filter = h > 0.05 ? `blur(${(h * 10).toFixed(1)}px)` : 'none';
  c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 18 + h * 60; c.shadowOffsetX = 10 + h * 70; c.shadowOffsetY = 18 + h * 110;
  c.drawImage(img, -w / 2, -hh / 2, w, hh);
  c.restore();
  if (opts.glow && land > 0) {   // glow pulse on top (screen): the money "lights up"
    const g = opts.glow(t); if (g > 0.01) {
      c.save(); c.translate(x + (opts.slide || 0) * out, y + out * (opts.slideY || 0)); c.rotate(rot); c.globalCompositeOperation = 'screen'; c.globalAlpha = g;
      c.filter = 'blur(26px) saturate(2.2) brightness(1.3)'; c.drawImage(img, -w / 2, -hh / 2, w, hh); c.restore();
    }
  }
}

// ================================================================== draw one shot into the panel canvas
const WIN = { office: [T.office, T.cash], desk: [T.cash, T.tarmac], tarmac: [T.tarmac, T.villa], villa: [T.villa, END] };
function drawShot(c, name, t, ph, off = { x: 0, y: 0 }) {
  const [t0, t1] = WIN[name];
  const cam = camFor(name, t, t0, t1), sc = SCN[name];
  const wx = off.x, wy = off.y;
  // blur-in at the head of each shot (defocus -> focus), plus a small overshoot zoom
  const head = Math.max(0, t - t0), bi = clamp(1 - head / 0.45) * (name === 'tarmac' ? 0 : 1), zIn = 1 + E.outCubic(clamp(1 - head / 0.6)) * 0.06;
  cam.z *= zIn;
  const plateXf = layerXf(cam, ph, 0.6, wx, wy), subjXf = layerXf(cam, ph, 1.35, wx, wy);
  c.save(); if (bi > 0.02) c.filter = `blur(${(bi * 16).toFixed(1)}px)`;
  drawLayer(c, L[sc.plate], plateXf);
  c.restore();

  if (name === 'office') {
    // gold rim light pulses behind the subject on the numbers, then the subject
    const g = 0.55 * Math.exp(-Math.max(0, t - 0.95) * 3) + 0.7 * Math.exp(-Math.max(0, t - 4.0) * 3) * (t > 3.95 ? 1 : 0);
    if (g > 0.02) drawLayer(c, L.office_subj, subjXf, g, (x) => { x.filter = 'blur(18px) brightness(0) invert(1) sepia(1) saturate(6) hue-rotate(-10deg)'; });
    drawLayer(c, L.office_subj, subjXf, 1, bi > 0.02 ? (x) => { x.filter = `blur(${(bi * 10).toFixed(1)}px)`; } : null);
    light(c, ph, 760, 260, 'rgba(255,190,110,0.32)', t);
  }
  if (name === 'desk') {
    const cx = DW / 2, cy = ph / 2 + 40, pdx = wx, pdy = wy;
    c.save(); c.translate(pdx, pdy);
    const cashGlow = (tt) => 0.55 * Math.exp(-Math.max(0, tt - 5.2) * 2.5) + (tt > 9.66 ? 0.6 * Math.exp(-(tt - 9.66) * 2.5) : 0);
    dropProp(c, L.cash, t, 4.86, cx - 90, cy + 150, 600, -0.18, { glow: cashGlow });
    dropProp(c, L.cash, t, 5.22, cx + 140, cy - 120, 560, 0.22, { glow: cashGlow, spin: -1 });
    dropProp(c, L.cash, t, 5.5, cx - 40, cy - 330, 520, -0.05, { glow: cashGlow });
    // statement credit: the paper lands over the cash; the line gets circled; an arrow points back to the cash
    dropProp(c, L.statement, t, 7.95, cx + 60, cy + 40, 560, 0.06, { out: 10.25, slide: 900, spin: 0.6 });
    if (t > 8.3 && t < 10.6) {
      const out = P(t, 10.25, 10.6, E.inCubic), sw = 560, sh = sw * 900 / 639;
      c.save(); c.translate(cx + 60 + out * 900, cy + 40); c.rotate(0.06);
      scribbleEllipse(c, sw * (0.465 - 0.5), sh * (0.522 - 0.5), sw * 0.33, 44, P(t, 8.64, 9.15, E.outCubic));
      c.restore();
    }
    // passport: he didn't want to travel -> a red marker X
    dropProp(c, L.passport, t, T.passport + 0.08, cx - 10, cy - 20, 640, -0.12, {});
    if (t > 10.9) scribbleX(c, cx - 10, cy - 20, 210, P(t, 10.9, 11.15, E.outQuad));
    c.restore();
  }
  if (name === 'tarmac') {
    // the traveller walks toward camera: his layer grows and bobs; the sun flares behind the jet
    const wk = prog(t, T.tarmac - 0.2, T.villa + 0.2), bob = Math.abs(Math.sin(wk * Math.PI * 7)) * 6;
    const xf = layerXf({ ...cam, z: cam.z * (1 + wk * 0.1) }, ph, 1.35, wx, wy); xf.oy -= bob;
    sunFlare(c, plateXf, t);
    drawLayer(c, L.tarmac_subj, xf);
  }
  if (name === 'villa') {
    drawLayer(c, L.villa_subj, subjXf);
    // glints off the glass and the water
    const gl = [[0.775, 0.553, 15.5], [0.62, 0.47, 15.0], [0.3, 0.5, 15.9]];
    for (const [gx, gy, tg] of gl) { const k = Math.exp(-((t - tg) ** 2) / 0.03); if (k > 0.02) star(c, subjXf.ox + gx * IW * subjXf.k, subjXf.oy + gy * IH * subjXf.k, 70 * k, k); }
  }
}
function light(c, ph, x, y, col, t) {   // a warm practical light leak breathing in the corner
  const a = 0.75 + 0.25 * Math.sin(t * 2.1);
  const g = c.createRadialGradient(x, y, 0, x, y, 700); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = a; c.fillStyle = g; c.fillRect(0, 0, DW, ph); c.restore();
}
function sunFlare(c, xf, t) {
  const sx = xf.ox + 0.63 * IW * xf.k, sy = xf.oy + 0.24 * IH * xf.k, a = 0.85 + 0.15 * Math.sin(t * 3);
  c.save(); c.globalCompositeOperation = 'screen';
  let g = c.createRadialGradient(sx, sy, 0, sx, sy, 520); g.addColorStop(0, `rgba(255,214,150,${0.75 * a})`); g.addColorStop(0.25, 'rgba(255,170,90,0.25)'); g.addColorStop(1, 'rgba(255,140,60,0)');
  c.fillStyle = g; c.fillRect(sx - 520, sy - 520, 1040, 1040);
  for (const [f, r, al] of [[0.6, 60, 0.18], [1.3, 110, 0.12], [1.8, 40, 0.2]]) {   // flare ghosts along the line through the centre
    const gx = sx + (DW / 2 - sx) * f, gy = sy + (900 - sy) * f;
    g = c.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, `rgba(255,220,170,${al})`); g.addColorStop(1, 'rgba(255,220,170,0)'); c.fillStyle = g; c.fillRect(gx - r, gy - r, 2 * r, 2 * r);
  }
  c.restore();
}
function star(c, x, y, r, k) {
  c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = k; c.fillStyle = '#FFFFFF'; c.shadowColor = '#FFF4D0'; c.shadowBlur = 20;
  c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r * 0.22, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r * 0.22, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
  c.beginPath(); c.moveTo(x - r * 0.6, y); c.quadraticCurveTo(x, y, x, y - r * 0.12); c.quadraticCurveTo(x, y, x + r * 0.6, y); c.quadraticCurveTo(x, y, x, y + r * 0.12); c.quadraticCurveTo(x, y, x - r * 0.6, y); c.fill();
  c.restore();
}

// headlines per shot (only the key numbers and terms), sitting at the top of the panel
function drawType(c, t, ph) {
  const top = 150;
  // 1,200 -> 15,600
  if (t < T.cash + 0.1) {
    title(c, [{ words: [{ t: 'WALKED AWAY WITH', d: 0 }], size: 56 }], 118, t, 2.0, T.cash - 0.25);
  }
  if (t >= T.cash - 0.3 && t < T.statement + 0.2) title(c, [{ words: [{ t: 'FREE', d: 0 }, { t: 'CASH', c: GOLD, d: 0.12 }] }], top + 40, t, T.cash + 0.05, T.statement - 0.25, 150);
  if (t >= T.statement && t < T.passport + 0.2) title(c, [{ words: [{ t: 'STATEMENT', d: 0 }, { t: 'CREDIT', c: GOLD, d: 0.1 }], size: 118 }], top + 20, t, 8.64, T.passport - 0.2);
  if (t >= T.tarmac && t < T.villa + 0.2) title(c, [{ words: [{ t: 'OR', d: 0 }, { t: 'TRAVEL', c: GOLD, d: 0.1 }] }], 300, t, 12.9, T.villa - 0.2, 170);
  if (t >= T.villa - 0.2) {
    title(c, [{ words: [{ t: 'EXTRA RETURN', d: 0 }], size: 62 }], 540, t, 15.76, END - 0.2);
    title(c, [{ words: [{ t: 'UP TO', d: 0 }], size: 62 }], 205, t, 15.3, END - 0.2);
  }
}
function numbers(c, t) {   // the two counters that tick (office, villa)
  const top = 150;
  if (t < T.cash - 0.25 + 0.3) {
    const out = P(t, T.cash - 0.25, T.cash, E.inCubic);
    const v = t < 2.66 ? Math.round(lerp(0, 1200, P(t, 0.95, 1.35, E.outCubic))) : Math.round(lerp(1200, 15600, P(t, 2.66, 4.0, E.outCubic)));
    if (t > 0.9) numberText(c, v.toLocaleString('en-US'), 268, t, 0.95, out, t > 2.66 && t < 4.05, 158);
  }
  if (t >= T.villa) {
    const out = P(t, END - 0.2, END, E.inCubic);
    const v = Math.round(lerp(7, 21, P(t, 15.15, 15.75, E.outCubic)));
    if (t > 14.6) numberText(c, v + 'X', 460, t, 14.6, out, t > 15.1 && t < 15.8, 260);
  }
}
function numberText(c, s, cy, t, t0, out, ticking, size = 190) {
  const k = pop(t, t0, { stiffness: 300, damping: 15 }), bl = clamp(1 - prog(t, t0, t0 + 0.2)) * 16 + out * 18 + (ticking ? 2.5 : 0);
  c.save(); c.textAlign = 'center'; c.font = font(size, 400, 'Display'); c.translate(DW / 2, cy - size * 0.35 - out * 40);
  const sc = lerp(1.5, 1, Math.min(1, k)) * (k > 1 ? k : 1); c.scale(sc, sc);
  c.globalAlpha = clamp(k * 2) * (1 - out); c.filter = bl > 0.3 ? `blur(${bl.toFixed(1)}px)` : 'none';
  c.shadowColor = 'rgba(242,193,78,0.55)'; c.shadowBlur = 40; c.fillStyle = GOLD; c.fillText(s, 0, size * 0.35);
  c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 20; c.shadowOffsetY = 8; c.fillText(s, 0, size * 0.35);
  c.restore();
}

// ================================================================== sound
function buildHits() {
  const h = [];
  h.push([0.8, 'focus in', 'whoosh', { len: 0.35, from: 2400, to: 500, gain: 0.16 }], [0.95, '1,200', 'bell', { pitch: 'E6', gain: 0.28 }]);
  for (let i = 0; i < 12; i++) h.push([2.68 + i * 0.1, 'count', 'tick', { gain: 0.07 + i * 0.006 }]);
  h.push([4.0, '15,600', 'coins', { gain: 0.3 }]);
  h.push([T.cash, 'whip', 'whoosh', { len: 0.45, from: 500, to: 3000, gain: 0.3 }], [T.cash + 0.05, 'free cash', 'pop', { pitch: 'C6', gain: 0.25 }]);
  for (const d of [4.86, 5.22, 5.5]) h.push([d + 0.32, 'cash lands', 'thud', { pitch: 'G2', to: 'C2', gain: 0.32 }]);
  h.push([5.6, 'glow', 'swell', { gain: 0.12 }]);
  h.push([7.95 + 0.32, 'paper lands', 'thud', { pitch: 'C3', to: 'G2', gain: 0.22 }], [8.64, 'marker', 'type', { n: 7, len: 0.5, gain: 0.12 }], [9.2, 'credit', 'blip', { pitch: 'G6', gain: 0.2 }]);
  h.push([9.7, 'cash glow', 'coins', { gain: 0.2 }], [10.25, 'slide out', 'whoosh', { len: 0.35, from: 800, to: 2600, gain: 0.18 }]);
  h.push([T.passport + 0.4, 'passport lands', 'thud', { pitch: 'A2', to: 'D2', gain: 0.3 }], [10.9, 'marker X', 'type', { n: 4, len: 0.25, gain: 0.16 }], [11.12, 'nope', 'boing', { pitch: 'E4', to: 'C4', gain: 0.18 }]);
  h.push([T.tarmac, 'fog', 'swell', { gain: 0.22 }], [T.tarmac + 0.5, 'jet air', 'whoosh', { len: 0.9, from: 300, to: 1200, gain: 0.14 }], [12.9, 'travel', 'pop', { pitch: 'E6', gain: 0.22 }]);
  h.push([T.villa, 'whip', 'whoosh', { len: 0.45, from: 600, to: 3200, gain: 0.3 }], [14.6, '7x', 'pop', { pitch: 'C6', gain: 0.28 }]);
  for (let i = 0; i < 12; i++) h.push([15.15 + i * 0.05, 'count', 'tick', { gain: 0.07 + i * 0.006 }]);
  h.push([15.78, '21x', 'bell', { pitch: 'C6', gain: 0.35 }], [15.5, 'glint', 'blip', { pitch: 'B6', gain: 0.12 }]);
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
const LAYERS = ['office_plate', 'office_subj', 'desk_plate', 'tarmac_plate', 'tarmac_subj', 'villa_plate', 'villa_subj', 'cash', 'statement', 'passport'];
const imgs = { badge: 'assets/badge.png' }; for (const n of LAYERS) imgs[n] = `assets/layers/${n}.${/plate/.test(n) ? 'jpg' : 'png'}`;
// motion blur only where things move fast (whips, drops, fog)
const fast = (t) => WHIPS.some(([w]) => Math.abs(t - w) < 0.3) || [4.95, 5.22, 5.5, 7.95, T.passport + 0.08].some((d) => t > d - 0.05 && t < d + 0.4) || Math.abs(t - 10.4) < 0.25;

M.film({
  fonts: [font(96, 400, 'Display'), font(46, 600, 'UI'), font(24, 500, 'UI')],
  images: imgs,
  hits: buildHits(),
  samples: (t) => (fast(t) ? 6 : 1),
  async init(IMG) {
    SC = makeCanvas(W, H); SX = SC.getContext('2d');
    for (let i = 0; i < 3; i++) { CH.push(makeCanvas(W, H)); CHX.push(CH[i].getContext('2d')); }
    buildFog();
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
    // ---- the photo panel, drawn into its own canvas (so chromatic aberration only touches the photos)
    SX.setTransform(1, 0, 0, 1, 0, 0); SX.clearRect(0, 0, W, H); SX.setTransform(S, 0, 0, S, 0, 0);
    const [name] = sceneAt(t), whip = whipAt(t);
    if (whip) {   // a whip: the outgoing shot slides out while the incoming one slides in from the other side (motion blur via sub-frames)
      const A = sceneAt(whip.w - 0.01)[0], B = sceneAt(whip.w + 0.01)[0], dx = whip.dx * DW, dy = whip.dy * ph;
      drawShot(SX, A, Math.min(t, whip.w - 0.001), ph, { x: -dx * whip.q, y: -dy * whip.q });
      drawShot(SX, B, Math.max(t, whip.w), ph, { x: dx * (1 - whip.q), y: dy * (1 - whip.q) });
    } else drawShot(SX, name, t, ph);
    drawFog(SX, t, ph);
    drawType(SX, t, ph); numbers(SX, t);
    // vignette + warm grade on the photos
    SX.save(); SX.setTransform(1, 0, 0, 1, 0, 0); SX.globalCompositeOperation = 'multiply'; SX.globalAlpha = 0.9; SX.drawImage(VIG, 0, 0, W, ph * S, 0, 0, W, ph * S); SX.restore();
    const ca = whip ? (1 - Math.abs(whip.p)) * 22 : 0, hitCA = [0.95, 4.0, 15.78].reduce((m, h) => Math.max(m, t > h ? 10 * Math.exp(-(t - h) * 9) : 0), 0);
    ctx.save(); ctx.translate(0, top * S);
    chroma(ctx, SC, Math.max(ca, hitCA, 1.5), ph);   // a faint permanent fringe, stronger on hits and whips
    ctx.restore();
    ctx.save(); ctx.scale(S, S);
    // compliance line during the claims
    const dk = P(t, 2.6, 2.85) * (1 - P(t, END - 0.2, END));
    if (dk > 0.01) { const yy = t < T.cash ? 318 : fh >= SEAM ? Y(858) : 1520; ctx.globalAlpha = 0.9 * dk; ctx.fillStyle = 'rgba(8,8,14,0.7)'; ctx.fillRect(300, yy - 22, 480, 34); ctx.globalAlpha = dk; ctx.font = font(22, 500, 'UI'); ctx.textAlign = 'center'; ctx.fillStyle = '#FFFFFF'; ctx.fillText('Individual results vary. Education only.', 540, yy); ctx.globalAlpha = 1; }
    if (FOOT && fh > 1) {
      M.cover(ctx, FOOT, 0, DH - fh, DW, fh, { fx: 0.5, fy: lerp(0.25, 0.45, clamp((fh - SEAM) / (DH - SEAM))), zoom: pushIn(t) });
      if (fh < DH - 2) { ctx.fillStyle = GOLD; ctx.fillRect(0, DH - fh - 3, DW, 6); }
    }
    BR.captions(ctx, t, fh, CAPS);
    ctx.restore();
  },
  post(ctx, u, t) {
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.16; ctx.drawImage(GRAIN[Math.floor(t * 24) % 4], 0, 0); ctx.restore();
  },
});
