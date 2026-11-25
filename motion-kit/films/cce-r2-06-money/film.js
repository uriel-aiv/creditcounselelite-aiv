// CCE — "06 Money Green" founder split-screen, v02. Pure function of time: window.seek(t) paints frame t.
// Grid = seconds (u === t). Cut to the speaker's word timings. Motion on top, founder below.
// What the references do, and what this film animates:
//   * pattern fields of LED dot-matrix icons that tumble and turn into other icons (cards -> $)
//   * huge condensed type moments
//   * target compositions: concentric dashed rings + white arrows converging on a halftone object
//   * cycle diagrams with icons at the nodes
// Scenes enter and leave with in/out moves and a camera that pushes through; lines draw on, hold, draw off.
import * as M from './lib/motion.js';
import * as BR from './lib/brand.js';

const { W, H, E, prog, clamp, lerp, spring, springKeys, SPRING, wobble, font, hash01, mulberry32, cover } = M;

const DW = 1080, DH = 1920, S = W / DW, TAU = M.TAU;
const C = { maroon: '#6B0505', green: '#266235', teal: '#008C96', pbBlue: '#114BA7', gold: '#CB9938', light: '#ADC8E3',  bg: '#004AAD', bg2: '#003A8A', mint: '#ADC8E3', mintHi: '#FFFFFF', dim: '#2F64B8', white: '#F4F7FB', orange: '#CB9938', capBg: '#000000' };
const DISPLAY = 'Display', UI = 'UI';
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 369;
const SEAM = 980;

const HITS = [
  [0.95, 'card', 'whoosh', { len: 0.4, gain: 0.25 }], [1.35, 'chip', 'whoosh', { len: 0.4, from: 800, to: 2400, gain: 0.25 }], [1.7, '3%', 'thud', { gain: 0.55 }],
  [3.0, 'cards', 'type', { len: 0.4, gain: 0.25 }], [3.65, 'chips', 'pop', { pitch: 'E6', gain: 0.3 }], [5.05, 'chase', 'pop', { pitch: 'C6', gain: 0.4 }], [6.35, 'banks', 'pop', { pitch: 'G5', gain: 0.3 }],
  [7.4, 'year', 'type', { len: 1.8, gain: 0.2 }], [10.95, '5%', 'thud', { gain: 0.6 }], [11.85, 'flat', 'pop', { pitch: 'C6', gain: 0.4 }],
  [12.95, 'to end', 'whoosh', { len: 0.5, from: 500, to: 2400, gain: 0.4 }], [13.2, 'badge', 'thud', { gain: 0.7 }],
];

// ------------------------------------------------------------------ helpers
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);
const P = (t, a, b, ease = E.inOutCubic) => ease(prog(t, a, b));
const antic = (t, t0, dur = 0.2) => { const p = prog(t, t0 - dur, t0 + 0.02); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; };
const out = (t, t0, d = 0.32) => 1 - E.inBack(prog(t, t0, t0 + d), 1.9);
const pop = (t, t0, cfg = SPRING.bouncy) => Math.max(0, sp(t, t0, cfg));
let FH = DH;
const Y = (y) => (FH >= SEAM ? y - (FH - SEAM) : y + (SEAM - FH) * 0.48);
const quad = (p0, c, p1, n = 48) => Array.from({ length: n + 1 }, (_, i) => { const k = i / n, m = 1 - k; return [m * m * p0[0] + 2 * m * k * c[0] + k * k * p1[0], m * m * p0[1] + 2 * m * k * c[1] + k * k * p1[1]]; });
function qAt(p0, c, p1, k) { const m = 1 - k; return [m * m * p0[0] + 2 * m * k * c[0] + k * k * p1[0], m * m * p0[1] + 2 * m * k * c[1] + k * k * p1[1]]; }
const arcPts = (cx, cy, r, a0, a1, n = 96) => Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
function trim(pts, from, to) {
  if (to <= from) return [];
  let L = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  const a = L * clamp(from), b = L * clamp(to), o = []; let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = seg[i - 1], s0 = acc, s1 = acc + d; acc = s1;
    if (s1 < a || d === 0) continue; if (s0 > b) break;
    const k0 = clamp((a - s0) / d), k1 = clamp((b - s0) / d);
    if (!o.length) o.push([lerp(pts[i - 1][0], pts[i][0], k0), lerp(pts[i - 1][1], pts[i][1], k0)]);
    o.push([lerp(pts[i - 1][0], pts[i][0], k1), lerp(pts[i - 1][1], pts[i][1], k1)]);
  }
  return o;
}
// a line that draws on (inA..inB), holds, and draws off from its tail (outA..outB)
function line(ctx, pts, { w = 3, color = C.white, from = 0, to = 1, dash = null, march = 0, alpha = 1 } = {}) {
  const q = trim(pts, from, to); if (q.length < 2 || alpha <= 0) return null;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.lineWidth = w; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (dash) { ctx.setLineDash(dash); ctx.lineDashOffset = -march; }
  ctx.beginPath(); ctx.moveTo(...q[0]); for (let i = 1; i < q.length; i++) ctx.lineTo(...q[i]); ctx.stroke(); ctx.restore();
  const a = q[q.length - 2], b = q[q.length - 1];
  return { tip: b, dir: Math.atan2(b[1] - a[1], b[0] - a[0]) };
}
const life = (t, a, b, c, d, e1 = E.outCubic, e2 = E.inCubic) => [P(t, c, d, e2), P(t, a, b, e1)];   // [from, to]
function sweptHead(ctx, tip, dir, size = 40, color = C.white, w = 3, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(...tip); ctx.rotate(dir); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-size * 0.35, -size * 0.1, -size * 0.75, -size * 0.75);
  ctx.moveTo(0, 0); ctx.quadraticCurveTo(-size * 0.35, size * 0.1, -size * 0.75, size * 0.75); ctx.stroke(); ctx.restore();
}
function node(ctx, x, y, r = 9, k = 1, col = C.orange) { if (k <= 0.01) return; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r * k, 0, TAU); ctx.fill(); }
// an arrow that slides in along its own axis to a node, holds, then slides back out (never sits frozen)
function arrowTo(ctx, tip, dir, len, kin, kout, t) {
  const k = kin * (1 - kout); if (k <= 0.01) return;
  const back = (1 - kin) * 160 + kout * 120;
  const bx = Math.cos(dir), by = Math.sin(dir);
  const t1 = [tip[0] - bx * (back + 14), tip[1] - by * (back + 14)], t0 = [t1[0] - bx * len, t1[1] - by * len];
  const breathe = 6 * Math.sin(t * 3);
  const p1 = [t1[0] - bx * breathe, t1[1] - by * breathe];
  ctx.save(); ctx.globalAlpha *= clamp(k * 2);
  line(ctx, [t0, p1], { w: 3 }); sweptHead(ctx, p1, dir, 34);
  ctx.restore();
  node(ctx, tip[0], tip[1], 9, kin * (1 - kout));
}
function rings(ctx, cx, cy, radii, k, t, spin = 0.05) {
  if (k <= 0.01) return;
  radii.forEach((r, i) => line(ctx, arcPts(cx, cy, r * (0.7 + 0.3 * k), 0, TAU, 140), { w: 2.2, dash: [8, 10], march: t * 30 * (i % 2 ? -1 : 1) + i * 7, alpha: k * (0.55 - i * 0.1) }));
}
function txt(ctx, s, x, y, size, family, color, align = 'left', alpha = 1) {
  if (size < 0.5 || alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.font = font(size, family === DISPLAY ? 400 : 800, family); ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(s, x, y); ctx.restore();
}
// big condensed type, each glyph springs up from below its baseline (clip), staggered
function bigType(ctx, s, x, y, size, kIn, kOut, t0, t, color = C.mint, align = 'left') {
  ctx.save(); ctx.font = font(size, 400, DISPLAY);
  const w = ctx.measureText(s).width; let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.beginPath(); ctx.rect(cx - 40, y - size * 1.05, w + 80, size * 1.15); ctx.clip();
  [...s].forEach((ch, i) => {
    const cw = ctx.measureText(ch).width;
    const ki = pop(t, t0 + i * 0.05, { stiffness: 260, damping: 18 });
    const ko = E.inBack(clamp(kOut * 1.6 - i * 0.12), 1.6);
    ctx.fillStyle = color; ctx.fillText(ch, cx, y + (1 - ki) * size * 1.1 + ko * size * 1.2);
    cx += cw;
  });
  ctx.restore();
}

// ------------------------------------------------------------------ dot-matrix sprites
function sampleMask(drawFn, cells) {
  const R = cells * 4, c = document.createElement('canvas'); c.width = c.height = R;
  const x = c.getContext('2d', { willReadFrequently: true }); x.scale(R / 100, R / 100); x.fillStyle = '#fff'; x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineJoin = 'round';
  drawFn(x);
  const d = x.getImageData(0, 0, R, R).data, pts = [];
  for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++) { const px = i * 4 + 2, py = j * 4 + 2; if (d[(py * R + px) * 4 + 3] > 120) pts.push([i - cells / 2 + 0.5, j - cells / 2 + 0.5]); }
  return pts;
}
function makeSprite(pts, cell, color, r = 0.36) {
  const ext = Math.max(...pts.map(([i, j]) => Math.max(Math.abs(i), Math.abs(j)))) + 1.5;
  const size = Math.ceil(ext * 2 * cell * S) + 8, c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d'); x.translate(size / 2, size / 2); x.fillStyle = color;
  pts.forEach(([i, j]) => { const px = i * cell * S, py = j * cell * S, rr = r * cell * S; x.globalAlpha = 0.17; x.beginPath(); x.arc(px, py, rr * 2.1, 0, TAU); x.fill(); x.globalAlpha = 1; x.beginPath(); x.arc(px, py, rr, 0, TAU); x.fill(); });
  return c;
}
// draw a sprite centred (design coords), with scale/rotation/x-flip
function spr(ctx, c, x, y, s = 1, rot = 0, alpha = 1, sx = 1) {
  if (!c || s <= 0.01 || alpha <= 0.01 || Math.abs(sx) < 0.01) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s * sx / S, s / S); ctx.drawImage(c, -c.width / 2, -c.height / 2); ctx.restore();
}
const ICON = {
  dollar: (x) => { x.lineWidth = 9; x.beginPath(); x.arc(50, 50, 40, 0, TAU); x.stroke(); x.lineWidth = 6; x.beginPath(); x.arc(50, 50, 24, 0, TAU); x.stroke(); x.fillRect(46, 34, 8, 32); },   // a coin (no currency symbols on screen)
  card: (x) => { x.lineWidth = 8; x.beginPath(); x.roundRect(6, 22, 88, 58, 8); x.stroke(); x.fillRect(6, 34, 88, 10); x.fillRect(64, 62, 20, 9); },
  clock: (x) => { x.lineWidth = 7; x.beginPath(); x.arc(50, 50, 42, 0, TAU); x.stroke(); for (let a = 0; a < 12; a++) { const r = a * TAU / 12; x.lineWidth = a % 3 ? 4 : 7; x.beginPath(); x.moveTo(50 + Math.cos(r) * 30, 50 + Math.sin(r) * 30); x.lineTo(50 + Math.cos(r) * 36, 50 + Math.sin(r) * 36); x.stroke(); } },
  percent: (x) => { x.lineWidth = 9; x.beginPath(); x.arc(28, 28, 14, 0, TAU); x.stroke(); x.beginPath(); x.arc(72, 72, 14, 0, TAU); x.stroke(); x.lineWidth = 11; x.beginPath(); x.moveTo(80, 12); x.lineTo(20, 88); x.stroke(); },
  calendar: (x) => { x.lineWidth = 7; x.beginPath(); x.roundRect(10, 16, 80, 76, 6); x.stroke(); x.fillRect(10, 16, 80, 18); x.fillRect(26, 6, 8, 18); x.fillRect(66, 6, 8, 18); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) x.fillRect(20 + c * 17, 44 + r * 15, 9, 8); },
  person: (x) => { x.beginPath(); x.arc(50, 24, 16, 0, TAU); x.fill(); x.beginPath(); x.moveTo(20, 96); x.lineTo(20, 66); x.quadraticCurveTo(20, 44, 50, 44); x.quadraticCurveTo(80, 44, 80, 66); x.lineTo(80, 96); x.closePath(); x.fill(); },
  refresh: (x) => {
    x.lineWidth = 9; x.beginPath(); x.arc(50, 50, 30, Math.PI * 1.1, Math.PI * 1.85); x.stroke(); x.beginPath(); x.arc(50, 50, 30, Math.PI * 0.1, Math.PI * 0.85); x.stroke();
    const hd = (a, s) => { const px = 50 + Math.cos(a) * 30, py = 50 + Math.sin(a) * 30; x.beginPath(); x.moveTo(px + Math.cos(a + s) * 0, py); x.lineTo(px - 14 * Math.cos(a - 0.9 * s) , py - 14 * Math.sin(a - 0.9 * s)); x.lineTo(px + 14 * Math.cos(a + 0.7), py + 14 * Math.sin(a + 0.7)); x.closePath(); x.fill(); };
    hd(Math.PI * 1.85, 1); hd(Math.PI * 0.85, 1);
  },
  doc: (x) => { x.lineWidth = 7; x.beginPath(); x.moveTo(16, 6); x.lineTo(64, 6); x.lineTo(86, 28); x.lineTo(86, 94); x.lineTo(16, 94); x.closePath(); x.stroke(); x.beginPath(); x.moveTo(64, 6); x.lineTo(64, 28); x.lineTo(86, 28); x.stroke(); for (let i = 0; i < 5; i++) x.fillRect(28, 40 + i * 11, i === 4 ? 26 : 46, 5); },
  bank: (x) => { x.beginPath(); x.moveTo(8, 34); x.lineTo(50, 8); x.lineTo(92, 34); x.closePath(); x.fill(); for (let i = 0; i < 4; i++) x.fillRect(16 + i * 20, 42, 9, 40); x.fillRect(8, 86, 84, 8); },
  suitcase: (x) => { x.lineWidth = 7; x.beginPath(); x.roundRect(8, 30, 84, 58, 8); x.stroke(); x.beginPath(); x.roundRect(36, 12, 28, 22, 6); x.stroke(); x.fillRect(28, 30, 7, 58); x.fillRect(65, 30, 7, 58); x.fillRect(14, 88, 10, 6); x.fillRect(76, 88, 10, 6); },
};
const SP = {};
function buildSprites() {
  const def = { dollar: [22, 9], card: [24, 5.3], clock: [26, 12], percent: [24, 15], calendar: [22, 5.6], person: [18, 7], refresh: [22, 7], doc: [22, 7], suitcase: [22, 5.5], bank: [22, 6] };
  for (const [k, [cells, cell]] of Object.entries(def)) {
    const pts = sampleMask(ICON[k], cells);
    SP[k] = makeSprite(pts, cell, C.white); SP[k + 'O'] = makeSprite(pts, cell, C.orange); SP[k + 'D'] = makeSprite(pts, cell, C.dim);
  }
  // dashed outline used once a document is "gone"
  const c = document.createElement('canvas'), sz = Math.ceil(170 * S); c.width = c.height = sz; const x = c.getContext('2d');
  x.scale(S, S); x.strokeStyle = C.mint; x.globalAlpha = 0.45; x.lineWidth = 2.5; x.setLineDash([6, 6]); x.strokeRect(30, 15, 110, 140); SP.docGone = c;
}
// halftone objects (white, like the reference's gear)
let COIN, GEAR;
function halftone(R, inside, shade, pitch = 9) {
  const c = document.createElement('canvas'); c.width = c.height = Math.ceil(R * S); const x = c.getContext('2d'); x.scale(S, S); x.fillStyle = C.white;
  for (let yy = pitch / 2; yy < R; yy += pitch) for (let xx = pitch / 2 + (Math.round(yy / pitch) % 2) * pitch / 2; xx < R; xx += pitch) {
    if (!inside(xx, yy)) continue; const g = shade(xx, yy); if (g <= 0.05) continue;
    x.beginPath(); x.arc(xx, yy, (pitch * 0.48) * g, 0, TAU); x.fill();
  }
  return c;
}
function buildHalftones() {
  const R = 420, cx = R / 2;
  const m = document.createElement('canvas'); m.width = m.height = R; const mx = m.getContext('2d', { willReadFrequently: true });
  mx.font = '800 230px UI'; mx.textAlign = 'center'; mx.textBaseline = 'middle'; mx.fillStyle = '#fff'; mx.fillText('$', cx, cx + 12);
  const md = mx.getImageData(0, 0, R, R).data, inDollar = (xx, yy) => md[(Math.round(yy) * R + Math.round(xx)) * 4 + 3] > 128;
  COIN = halftone(R, (xx, yy) => Math.hypot(xx - cx, yy - cx) < 200, (xx, yy) => {
    const d = Math.hypot(xx - cx, yy - cx);
    if (d > 176) return 0.95;                                     // rim
    if (d > 168) return 0.15;
    if (Math.abs(Math.hypot(xx - cx, yy - cx) - 110) < 14) return 0.9;   // inner ring (no currency symbol)
    return 0.25 + 0.4 * (1 - (xx + yy) / (2 * R));               // face, lit from the top-left
  });
  const G = 460, gc = G / 2;
  GEAR = halftone(G, (xx, yy) => {
    const d = Math.hypot(xx - gc, yy - gc), a = Math.atan2(yy - gc, xx - gc);
    const tooth = ((a + TAU) % (TAU / 10)) < TAU / 20 ? 220 : 180;
    return d < tooth && d > 95;
  }, (xx, yy) => 0.55 + 0.45 * (1 - yy / G));
}

// ------------------------------------------------------------------ camera (panel scenes): push-through between scenes
function camera(ctx, t, s, cx = 540, cy = 470, rot = 0) {
  const X = cx, Yc = Y(cy);
  ctx.translate(540, Y(470)); ctx.rotate(rot); ctx.scale(s, s); ctx.translate(-X, -Yc);
}
const through = (t, a, b) => ({ s: Math.pow(1.7, P(t, a, b, E.inCubic)), alpha: 1 - P(t, a + (b - a) * 0.4, b) });
const arrive = (t, a, b) => ({ s: lerp(0.72, 1, P(t, a, b, E.outCubic)), alpha: P(t, a, a + (b - a) * 0.5) });

// ------------------------------------------------------------------ S1  credit -> bank -> next day  (1.1 .. 7.0)
// $ field drifts; on "transferred" it tumbles and streams off right; target rings + arrows; halftone coin lands on "bank";
// on "next day" the coin flips to a clock whose hand sweeps once.
function s1(ctx, t) {
  if (t < 0.9 || t > 7.05) return;
  const th = through(t, 6.7, 7.05);
  ctx.save(); ctx.globalAlpha = th.alpha; camera(ctx, t, (1 + 0.04 * prog(t, 1.2, 6.7)) * th.s, 540, 470, 0.01 * Math.sin(t * 0.5));
  // field
  if (t < 4.0) {
    const drift = (t - 1.1) * 26;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) {
      const i = r * 7 + c, d = (c + r) * 0.03;
      const k = pop(t, 1.15 + d);
      const go = P(t, 2.2 + c * 0.11 + r * 0.04, 2.85 + c * 0.11 + r * 0.04, E.inBack);
      const x = 60 + c * 160 + ((r % 2) ? 80 : 0) + drift % 160 - 40 + go * 1100;
      const y = Y(110 + r * 170) - go * 40 * Math.sin(c + r);
      const rot = go * (2.5 + hash01(i, 2)) + 0.1 * Math.sin(t * 1.2 + i);
      const a = antic(t, 2.2 + c * 0.11, 0.25);
      spr(ctx, SP.dollar, x - 20 * a, y, k * (1 - 0.1 * a), rot, 0.75 + 0.25 * Math.sin(t * 2 + i));
    }
  }
  // target
  const kt = P(t, 3.55, 4.1, E.outBack);
  rings(ctx, 540, Y(470), [250, 340, 430], kt * out(t, 6.6, 0.3), t);
  const kin = P(t, 3.7, 4.1, E.outCubic), kout = P(t, 5.0, 5.4, E.inCubic);
  arrowTo(ctx, [540 - 250, Y(470)], 0, 170, kin, kout, t);
  arrowTo(ctx, [540 + 250, Y(470)], Math.PI, 170, kin, kout, t);
  // coin -> clock
  if (t > 3.8) {
    const kc = pop(t, 3.85, { stiffness: 240, damping: 14 });
    const flip = P(t, 5.75, 6.05, E.inOutCubic);
    const spin = Math.cos(Math.PI * flip) * (1 + 0.0 * t);
    const sx = flip < 0.5 ? Math.cos(Math.PI * flip) : -Math.cos(Math.PI * flip);
    const idle = 0.06 * Math.sin(t * 1.6);
    if (flip < 0.5) { ctx.save(); ctx.translate(540, Y(470)); ctx.rotate(idle); ctx.scale(kc * Math.max(0.02, sx), kc); ctx.drawImage(COIN, -COIN.width / (2 * S), -COIN.height / (2 * S), COIN.width / S, COIN.height / S); ctx.restore(); }
    else {
      spr(ctx, SP.clock, 540, Y(470), kc, 0, 1, Math.max(0.02, sx));
      const sweep = P(t, 6.05, 6.48, E.bezier(0.5, 0, 0.2, 1.2));
      const ang = -Math.PI / 2 + TAU * sweep;
      line(ctx, [[540, Y(470)], [540 + Math.cos(ang) * 120, Y(470) + Math.sin(ang) * 120]], { w: 6, color: C.white, alpha: sx });
      line(ctx, [[540, Y(470)], [540 + Math.cos(-Math.PI / 2 + TAU * sweep / 12) * 80, Y(470) + Math.sin(-Math.PI / 2 + TAU * sweep / 12) * 80]], { w: 8, color: C.white, alpha: sx });
      node(ctx, 540, Y(470), 11, sx);
      if (t > 6.48) rings(ctx, 540, Y(470), [170 + (t - 6.48) * 400], Math.exp(-(t - 6.48) * 4), t);
    }
  }
  ctx.restore();
}

// ------------------------------------------------------------------ S2  flat fee, 1–5%  (6.9 .. 10.95): a type moment
function s2(ctx, t) {
  if (t < 6.85 || t > 10.95) return;
  const ar = arrive(t, 6.85, 7.3), th = through(t, 10.6, 10.95);
  ctx.save(); ctx.globalAlpha = ar.alpha * th.alpha; camera(ctx, t, ar.s * th.s * (1 + 0.05 * prog(t, 7.3, 10.6)), 540, 470, -0.015 + 0.01 * Math.sin(t * 0.6));
  rings(ctx, 540, Y(470), [300, 400], 1, t);
  // the % mark: breathes, gets cut flat on "fee", leaves before the number
  const cut = P(t, 8.3, 8.5, E.outCubic), sq = 1 - 0.45 * P(t, 8.38, 8.55, E.outBack) + 0.1 * wobble(t - 8.55, 2.5, 5);
  const kp = pop(t, 7.0) * out(t, 9.05, 0.25);
  spr(ctx, SP.percent, 540, Y(470) + 40 * (1 - sq), kp * (1 + 0.03 * Math.sin(t * 3)), 0, 1, 1 / Math.max(0.5, sq) * 0 + 1);
  ctx.save(); ctx.translate(540, Y(470)); ctx.scale(1, sq); ctx.translate(-540, -Y(470)); ctx.restore();
  // the cut line slices across, then retracts from its tail
  const [f1, t1] = life(t, 8.25, 8.45, 8.55, 8.85);
  line(ctx, [[60, Y(470)], [1020, Y(470)]], { w: 4, color: C.orange, from: f1, to: t1 });
  // 1 on "one", counts to 5 on "five"
  if (t > 9.1) {
    const n = t < 9.6 ? null : Math.min(5, 2 + Math.floor(prog(t, 9.6, 9.94) * 3.999));
    const sOut = prog(t, 10.45, 10.75);
    const k5 = n === 5 ? 1 + 0.08 * wobble(t - 9.94, 3, 6) : 1;
    ctx.save(); ctx.translate(540, Y(470)); ctx.scale(k5, k5); ctx.translate(-540, -Y(470));
    bigType(ctx, n ? `1–${n}%` : '1', 540, Y(470) + 190, 440, 1, sOut, n ? 9.6 : 9.15, t, C.mint, 'center');
    ctx.restore();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ S3  24 calendars, 6..24 light up, push into 18  (10.9 .. 18.6)
const CAL = (m) => { const i = m - 1, c = i % 6, r = Math.floor(i / 6); return [120 + c * 105, 230 + r * 150]; };
function s3(ctx, t) {
  if (t < 10.85 || t > 18.65) return;
  const ar = arrive(t, 10.85, 11.3), th = through(t, 18.3, 18.65);
  const c18 = CAL(18);
  const z = lerp(1, 1.55, P(t, 16.75, 17.2, E.inOutCubic));
  const fx = lerp(540, c18[0] + 120, P(t, 16.75, 17.2, E.inOutCubic)), fy = lerp(470, c18[1], P(t, 16.75, 17.2, E.inOutCubic));
  ctx.save(); ctx.globalAlpha = ar.alpha * th.alpha; camera(ctx, t, ar.s * th.s * z * (1 + 0.03 * prog(t, 11.3, 16.7)), fx, fy, 0.012 * Math.sin(t * 0.45));
  const lit = Math.round(lerp(5, 24, P(t, 13.55, 14.3, E.inOutSine)));
  for (let m = 1; m <= 24; m++) {
    const [x, y] = CAL(m);
    const k = pop(t, 10.95 + m * 0.025);
    const on = t > 13.5 && m >= 6 && m <= lit;
    const bump = on ? 1 + 0.25 * Math.exp(-Math.max(0, t - (13.55 + (m - 6) / 18 * 0.75)) * 7) : 1;
    const is18 = m === 18 && t > 17.0;
    const sprite = is18 ? SP.calendarO : on ? SP.calendar : SP.calendarD;
    spr(ctx, sprite, x, Y(y) + 4 * Math.sin(t * 2 + m * 0.7), k * bump, 0.03 * Math.sin(t * 1.3 + m));
  }
  // big counter at right
  if (t > 13.4) {
    const kc = (lit === 24 ? 1 + 0.08 * wobble(t - 14.3, 3, 6) : 1);
    ctx.save(); ctx.translate(900, Y(560)); ctx.scale(kc, kc); ctx.translate(-900, -Y(560));
    bigType(ctx, String(Math.max(6, lit)), 1010, Y(560), 300, 1, P(t, 16.6, 16.9), 13.4, t, C.mint, 'right');
    ctx.restore();
  }
  // 4 arrows converge on month 18; rings ping; arrows slide back out
  const kin = P(t, 16.85, 17.14, E.outBack), kout = P(t, 17.75, 18.1, E.inCubic);
  const cx = c18[0], cy = Y(c18[1]);
  [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => arrowTo(ctx, [cx - dx * 85, cy - dy * 85], Math.atan2(dy, dx), 110, kin, kout, t));
  if (t > 17.14) for (let r = 0; r < 3; r++) { const ph = ((t - 17.14) * 0.9 + r / 3) % 1; line(ctx, arcPts(cx, cy, 70 + ph * 200, 0, TAU, 80), { w: 2, dash: [6, 8], alpha: (1 - ph) * 0.6 * (1 - kout) }); }
  ctx.restore();
}

// ------------------------------------------------------------------ S4  cycle: every 6 months, per person, repeat  (18.5 .. 24.2)
function s4(ctx, t) {
  if (t < 18.45 || t > 24.4) return;
  const ar = arrive(t, 18.45, 18.95);
  const kOut = P(t, 23.9, 24.25, E.inBack);
  const turn = TAU * P(t, 21.45, 23.08, E.bezier(0.6, 0, 0.25, 1)) + 0.04 * wobble(t - 23.08, 3, 5);
  ctx.save(); ctx.globalAlpha = ar.alpha * (1 - kOut); camera(ctx, t, ar.s * (1 - 0.3 * kOut) * (1 + 0.04 * prog(t, 19, 23.9)), 540, 470, 0);
  const cx = 540, cy = Y(470), R = 290;
  // dashed circle draws on; halftone gear turns slowly behind the 6
  line(ctx, arcPts(cx, cy, R, -Math.PI / 2 + turn, -Math.PI / 2 + turn + TAU, 160), { w: 2.5, dash: [8, 10], march: t * 30, to: P(t, 18.55, 19.3, E.outCubic) });
  if (GEAR) { const kg = pop(t, 19.0, { stiffness: 140, damping: 14 }); ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.3 + turn * 0.5); ctx.scale(kg * 0.62, kg * 0.62); ctx.globalAlpha *= 0.85; ctx.drawImage(GEAR, -GEAR.width / (2 * S), -GEAR.height / (2 * S), GEAR.width / S, GEAR.height / S); ctx.restore(); }
  const k6 = pop(t, 19.75) * (1 + 0.03 * Math.sin(t * 2.4));
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k6, k6); ctx.fillStyle = C.bg; ctx.beginPath(); ctx.arc(0, 0, 92, 0, TAU); ctx.fill(); ctx.restore();
  if (t > 19.7) bigType(ctx, '6', cx, cy + 105, 270, 1, 0, 19.7, t, C.mint, 'center');
  // four nodes ride the circle; icons stay upright
  const icons = [['calendar', 19.3], ['person', 20.55], ['refresh', 19.45], ['person', 20.75]];
  icons.forEach(([nm, t0], i) => {
    const a = -Math.PI / 2 + i * TAU / 4 + turn;
    const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
    const k = pop(t, t0);
    const hot = nm === 'person' && t > t0 && t < 21.4;
    ctx.fillStyle = [C.teal, C.maroon, C.green, C.pbBlue][i]; ctx.beginPath(); ctx.arc(x, y, 70 * k, 0, TAU); ctx.fill();
    spr(ctx, hot ? SP[nm + 'O'] : SP[nm], x, y - (nm === 'person' ? Math.abs(Math.sin((t - t0) * 6)) * 12 * (hot ? 1 : 0) : 0), k, 0);
    node(ctx, cx + (R - 70) * Math.cos(a), cy + (R - 70) * Math.sin(a), 8, k);
  });
  // arrows chase between the nodes: each draws on and off in turn, so nothing sits still
  for (let i = 0; i < 4; i++) {
    const a0 = -Math.PI / 2 + i * TAU / 4 + turn + 0.33, a1 = a0 + TAU / 4 - 0.66;
    const ph = ((t - 19.5) * 0.8 - i * 0.25);
    const cyc = ph - Math.floor(ph);
    if (t < 19.5) continue;
    const from = P(cyc, 0.55, 0.95, E.inCubic), to = P(cyc, 0, 0.45, E.outCubic);
    const d = line(ctx, arcPts(cx, cy, R + 52, a0, a1, 40), { w: 3, from, to });
    if (d && to > 0.98 && from < 0.6) sweptHead(ctx, d.tip, d.dir, 26);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ S5  a field of paperwork flips away  (32.3 .. 36.0)
function s5(ctx, t) {
  if (t < 32.3 || t > 36.05) return;
  const kO = P(t, 35.6, 36.0, E.inBack);
  ctx.save(); ctx.globalAlpha = 1 - kO; camera(ctx, t, lerp(1.08, 1, P(t, 32.3, 33.2, E.outCubic)) * (1 - 0.25 * kO), 540, 470, -0.02 + 0.01 * Math.sin(t * 0.5));
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
    const i = r * 5 + c, x = 140 + c * 200, y0 = 140 + r * 210, up = (t - 32.3) * 18 * (c % 2 ? 1 : 0.6);
    const k = pop(t, 32.35 + (r + c) * 0.035);
    const fl = prog(t, 34.48 + c * 0.16 + r * 0.03, 34.75 + c * 0.16 + r * 0.03);
    const sx = Math.cos(Math.PI * fl);
    const y = Y(y0) - up + 5 * Math.sin(t * 2 + i);
    if (fl < 0.5) spr(ctx, SP.doc, x, y, k, 0.03 * Math.sin(t + i), 1, Math.max(0.02, sx));
    else { ctx.save(); ctx.translate(x, y); ctx.scale(-sx * k, k); ctx.drawImage(SP.docGone, -SP.docGone.width / (2 * S), -SP.docGone.height / (2 * S), SP.docGone.width / S, SP.docGone.height / S); ctx.restore(); }
  }
  ctx.restore();
}

// ------------------------------------------------------------------ S6  13 cards (giant 13), 10 days, every card turns into $  (35.9 .. 44.6)
const CSLOT = (i) => [520 + (i % 4) * 140, 150 + Math.floor(i / 4) * 160];
function s6(ctx, t) {
  if (t < 35.85 || t > 44.65) return;
  const ar = arrive(t, 35.85, 36.25), kO = P(t, 44.3, 44.65, E.inBack);
  ctx.save(); ctx.globalAlpha = ar.alpha * (1 - kO); camera(ctx, t, ar.s * (1 + 0.05 * prog(t, 36, 44)) * (1 - 0.25 * kO), 540, 470, 0.012 * Math.sin(t * 0.4));
  let landed = 0;
  for (let i = 0; i < 16; i++) {
    const [x, y0] = CSLOT(i);
    const tl = i < 13 ? 36.0 + i * 0.033 : 36.5 + (i - 13) * 0.05;
    const k = pop(t, tl, { stiffness: 300, damping: 18 });
    if (i < 13 && t > tl + 0.03) landed++;
    const wave = 6 * Math.sin(t * 2.3 - i * 0.6) + 22 * Math.max(0, Math.sin(Math.PI * prog(t, 40.5 + i * 0.04, 41.1 + i * 0.04)));
    const y = Y(y0) - wave;
    if (i >= 13) { spr(ctx, SP.cardD, x, y, k * 0.95, 0); continue; }
    // tumble: card spins half a turn and lands as a $ (like the reference's cards -> houses field)
    const fl = P(t, 43.58 + i * 0.056, 43.95 + i * 0.056, E.inOutCubic);
    const rot = fl * Math.PI * (i % 2 ? 1 : -1) + 0.05 * Math.sin(t * 1.5 + i);
    const sc = k * (1 - 0.35 * Math.sin(Math.PI * fl));
    spr(ctx, fl < 0.5 ? SP.card : SP.dollar, x, y, fl < 0.5 ? sc : sc * 0.62, fl < 0.5 ? rot : rot + Math.PI * (i % 2 ? 1 : -1), 1);
  }
  // giant 13
  if (t > 35.95) {
    const n = Math.max(1, landed);
    const k13 = n === 13 ? 1 + 0.06 * wobble(t - 36.42, 3, 6) : 1;
    ctx.save(); ctx.translate(230, Y(470)); ctx.scale(k13, k13); ctx.translate(-230, -Y(470));
    bigType(ctx, String(n), 230, Y(560), 400, 1, 0, 35.95, t, C.mint, 'center'); ctx.restore();
  }
  // ten days: a line draws on, ten orange nodes pop along it, then the line retracts and the nodes stay pulsing
  const [lf, lt] = life(t, 37.9, 38.54, 39.2, 39.6, E.linear);
  line(ctx, [[60, Y(700)], [420, Y(700)]], { w: 3, from: lf, to: lt });
  for (let d = 0; d < 10; d++) node(ctx, 70 + d * 38, Y(700), 10, pop(t, 37.92 + d * 0.062) * (1 + 0.15 * Math.sin(t * 4 + d)), [C.orange, C.teal, C.light][d % 3]);
  ctx.restore();
}

// ------------------------------------------------------------------ S7  one suitcase -> 7 -> 21  (49.6 .. 55.5)
const SUIT = (i) => [150 + (i % 7) * 130, 520 + Math.floor(i / 7) * 130];
function s7(ctx, t) {
  if (t < 49.6 || t > 55.6) return;
  const ar = arrive(t, 49.6, 50.0), kO = P(t, 55.2, 55.55, E.inBack);
  ctx.save(); ctx.globalAlpha = ar.alpha * (1 - kO); camera(ctx, t, ar.s * (1 + 0.05 * prog(t, 50, 55)) * (1 - 0.25 * kO), 540, 470, -0.01 + 0.012 * Math.sin(t * 0.5));
  // the single suitcase: pops in, shakes "no", winds up on "but if", hops along a dashed arc on "travel"
  const A = [200, 520], B = [820, 330], c = [520, 40];
  const hop = P(t, 51.94, 52.85, E.bezier(0.6, 0, 0.3, 1));
  const split = P(t, 53.2, 53.45, E.inOutCubic);
  if (split < 1) {
    const k = pop(t, 49.85);
    const no = 0.18 * Math.sin((t - 50.1) * 22) * Math.exp(-Math.max(0, t - 50.1) * 4) * (t > 50.1 ? 1 : 0);
    const a = antic(t, 51.94, 0.9) * prog(t, 50.76, 51.0);
    const p = hop > 0 ? qAt(A, c, B, hop) : [A[0] - 26 * a, A[1] + 10 * a];
    const s = (1.7 - 0.15 * a + 0.15 * Math.sin(Math.PI * hop)) * k * (1 - split);
    spr(ctx, SP.suitcase, lerp(p[0], SUIT(0)[0], split), lerp(Y(p[1]), Y(SUIT(0)[1]), split), s, no + 0.1 * a - 0.2 * Math.sin(Math.PI * hop) + 0.04 * Math.sin(t * 2) * (hop >= 1 ? 1 : 0));
  }
  const [hf, ht] = life(t, 51.9, 52.85, 53.0, 53.5);
  const d = line(ctx, quad([A[0], Y(A[1])], [c[0], Y(c[1])], [B[0], Y(B[1])]), { w: 3, dash: [10, 12], march: t * 50, from: hf, to: ht });
  node(ctx, A[0], Y(A[1]) + 80, 9, pop(t, 50.8) * out(t, 53.1, 0.3)); node(ctx, B[0], Y(B[1]) + 80, 9, pop(t, 52.85) * out(t, 53.2, 0.3), C.teal);
  // 7 on "seven", the rest fill to 21 on "twenty-one"
  for (let i = 0; i < 21; i++) {
    const t0 = i < 7 ? 53.3 + i * 0.03 : 53.55 + (i - 7) * 0.031;
    const k = pop(t, t0);
    if (k <= 0) continue;
    const [x, y] = SUIT(i);
    spr(ctx, i === 20 && t > 53.98 ? SP.suitcaseO : SP.suitcase, x, Y(y) + 5 * Math.sin(t * 2.2 - i * 0.4), k, 0.04 * Math.sin(t * 1.4 + i));
  }
  if (t > 53.25) {
    const n = Math.round(lerp(7, 21, P(t, 53.45, 53.98, E.inOutSine)));
    const k21 = n === 21 ? 1 + 0.06 * wobble(t - 53.98, 3, 6) : 1;
    ctx.save(); ctx.translate(540, Y(300)); ctx.scale(k21, k21); ctx.translate(-540, -Y(300));
    bigType(ctx, `${n}X`, 540, Y(390), 330, 1, 0, 53.25, t, C.mint, 'center'); ctx.restore();
  }
  ctx.restore();
}


const fr = (x) => x - Math.floor(x);
// ------------------------------------------------------------------ round 2: Video 12 "Watch out for the fee" (12.7 s)
// "It's common for about 3%. (That's a more common fee?) Yes. And some, like Chase or some of these other banks, the last
// year or so they've been doing more of that: closer to a 5% flat fee."
// a fee meter: a bar that fills to v% of a 0..6% scale, with tick nodes
function meter(ctx, x, y, w, v, k, t) {
  if (k <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= k;
  const wk = w * clamp(k * 1.2);
  ctx.strokeStyle = C.white; ctx.lineWidth = 5; ctx.strokeRect(x, y - 30, wk, 60);
  for (let i = 0; i <= 6; i++) { const xi = x + w * i / 6; if (xi > x + wk) break; ctx.fillStyle = C.white; ctx.fillRect(xi - 2, y + 34, 4, i % 3 ? 16 : 28); if (i % 3 === 0) txt(ctx, `${i}%`, xi, y + 110, 56, DISPLAY, C.white, 'center', 0.9); }
  ctx.fillStyle = C.orange; ctx.fillRect(x + 8, y - 22, Math.max(0, (w - 16) * v / 6), 44);
  node(ctx, x + 8 + (w - 16) * v / 6, y, 22, 1, C.orange);
  ctx.restore();
}
function n1(ctx, t) {
  if (t < 0.85 || t > 4.6) return;
  const ar = arrive(t, 0.85, 1.25), th = through(t, 4.2, 4.55);
  ctx.save(); ctx.globalAlpha = ar.alpha * th.alpha; camera(ctx, t, ar.s * th.s, 540, 470, 0.008 * Math.sin(t * 0.7));
  // a big card swipes in from the left; a fee chip peels off it and becomes the 3%
  const row = P(t, 2.9, 3.3, E.inOutCubic);   // "more common": the hero moves up to make room for the row
  const cy = Y(lerp(400, 300, row));
  spr(ctx, SP.card, 235 + (1 - E.outBack(clamp(P(t, 0.9, 1.3)))) * -420, cy, 3.4 * pop(t, 0.9) * lerp(1, 0.8, row), -0.06);
  const kc = P(t, 1.3, 1.75, E.inOutCubic); if (t > 1.3) { const q = qAt([340, cy], [520, Y(140)], [740, cy - 20], kc); spr(ctx, SP.percentO, q[0], q[1], 0.9 + 0.6 * kc, kc * 4, 1 - P(t, 1.62, 1.8)); }
  if (t > 1.6) bigType(ctx, `${Math.max(1, Math.round(lerp(0, 3, P(t, 1.6, 2.0))))}%`, 750, cy + 40, 340 * lerp(1, 0.85, row), 1, 0, 1.6, t, C.white, 'center');
  txt(ctx, 'COMMON FEE', 750, cy + 150 * lerp(1, 0.85, row), 84, DISPLAY, C.mint, 'center', P(t, 2.2, 2.5));
  rings(ctx, 750, cy - 40, [250, 330], P(t, 1.7, 2.1, E.outBack) * (1 - row), t);
  // "more common? yes": a row of cards, each one stamped with the same fee chip
  for (let i = 0; i < 4; i++) { const k = pop(t, 3.0 + i * 0.08), x = 165 + i * 250; spr(ctx, SP.card, x, Y(750), 1.4 * k, 0); if (t > 3.6 + i * 0.08) spr(ctx, SP.percentO, x + 30, Y(745), 0.6 * pop(t, 3.6 + i * 0.08), 0); }
  ctx.restore();
}
function n2(ctx, t) {
  if (t < 4.2 || t > 9.9) return;
  const ar = arrive(t, 4.2, 4.6), th = through(t, 9.5, 9.85);
  ctx.save(); ctx.globalAlpha = ar.alpha * th.alpha; camera(ctx, t, ar.s * th.s, 540, 470, -0.008 + 0.006 * Math.sin(t * 0.6));
  // "some, like Chase or some of these other banks": one bank lights orange, then the others join
  const up = P(t, 7.0, 7.45, E.inOutCubic);
  [[540, 5.0, true], [210, 6.3, false], [870, 6.5, false]].forEach(([x, t0, hot]) => { const k = pop(t, t0); spr(ctx, hot ? SP.bankO : SP.bank, lerp(x, 540 + (x - 540) * 0.62, up), Y(lerp(400, 230, up)) + 6 * Math.sin(t * 2 + x), lerp(2.8, 1.6, up) * k, 0); });
  txt(ctx, 'SOME BANKS', 540, Y(720), 120, DISPLAY, C.white, 'center', P(t, 4.6, 4.9) * (1 - P(t, 6.9, 7.1)));
  // "the last year or so": a 12-month ring fills month by month under the banks
  const yr = P(t, 7.4, 9.3, E.inOutSine), RX = 330, RY = 190, CY = Y(640);
  for (let m = 0; m < 12; m++) { const ang = -Math.PI / 2 + m * TAU / 12; node(ctx, 540 + Math.cos(ang) * RX, CY + Math.sin(ang) * RY, yr * 12 > m ? 18 : 12, P(t, 7.1 + m * 0.02, 7.3 + m * 0.02), yr * 12 > m ? C.orange : C.white); }
  if (yr > 0) line(ctx, arcPts(540, CY, RX, -Math.PI / 2, -Math.PI / 2 + TAU * yr, 80).map(([x, y]) => [x, CY + (y - CY) * RY / RX]), { w: 8, color: C.orange });
  txt(ctx, 'THE LAST', 540, CY - 20, 84, DISPLAY, C.white, 'center', P(t, 7.2, 7.5));
  txt(ctx, 'YEAR', 540, CY + 70, 84, DISPLAY, C.orange, 'center', P(t, 7.3, 7.6));
  ctx.restore();
}
function n3(ctx, t) {
  if (t < 9.6) return;
  const ar = arrive(t, 9.6, 10.0);
  ctx.save(); ctx.globalAlpha = ar.alpha; camera(ctx, t, ar.s * (1 + 0.03 * prog(t, 10.0, 12.7)), 540, 470);
  const v = lerp(3, 5, P(t, 10.9, 11.6, E.inOutCubic));
  // the meter: the fee slides from 3% to 5%
  meter(ctx, 120, Y(640), 840, v, P(t, 9.8, 10.3), t);
  bigType(ctx, `${Math.round(v)}%`, 540, Y(420), 380, 1, 0, 9.9, t, t > 10.9 ? C.orange : C.white, 'center');
  txt(ctx, 'MORE OF THAT', 540, Y(880), 100, DISPLAY, C.white, 'center', P(t, 9.9, 10.2) * (1 - P(t, 11.5, 11.7)));
  const kin = P(t, 11.0, 11.35, E.outCubic); arrowTo(ctx, [128 + 824 * v / 6, Y(560)], Math.PI / 2, 120, kin, 0, t);
  txt(ctx, 'FLAT FEE', 540, Y(880), 110, DISPLAY, C.orange, 'center', P(t, 11.75, 12.0));
  ctx.restore();
}

// ------------------------------------------------------------------ open + full-frame accents + end card
const NODE_A = [90, 1480], NODE_B = [990, 1460];
function accents(ctx, t, IMG) {
  // opening: a single orange node at the footage edge with two arrows converging, then it rises into the panel
  if (t < 1.4) {
    const k = pop(t, 0.15) * out(t, 1.05, 0.3);
    const N = [960, 1470];
    node(ctx, N[0], N[1], 11, k);
    const kin = P(t, 0.2, 0.6, E.outCubic), kout = P(t, 0.85, 1.1, E.inCubic);
    arrowTo(ctx, [N[0] - 30, N[1]], 0, 90, kin, kout, t); arrowTo(ctx, [N[0], N[1] - 30], Math.PI / 2, 90, kin, kout, t);
  }
  // full frame: one orange node in the margin, pinging quietly
  for (const [a, b, N, hit] of []) {
    if (t < a - 0.2 || t > b + 0.1) continue;
    const k = pop(t, a) * out(t, b - 0.2, 0.3);
    node(ctx, N[0], N[1], 10, k);
    for (let r = 0; r < 2; r++) { const ph = ((t - a) * 0.5 + r / 2) % 1; line(ctx, arcPts(N[0], N[1], 18 + ph * 70, 0, TAU, 50), { w: 2, dash: [5, 7], alpha: (1 - ph) * 0.55 * k }); }
    const big = t > hit ? Math.exp(-(t - hit) * 3) : 0;
    if (big > 0.02) line(ctx, arcPts(N[0], N[1], 30 + (1 - big) * 120, 0, TAU, 60), { w: 3, alpha: big * k });
  }
  // end card: target composition around the badge
  if (false) {
    const k = sp(t, 56.95, { stiffness: 260, damping: 15 });
    rings(ctx, 540, 760, [380, 470, 560], P(t, 56.8, 57.3, E.outCubic), t);
    if (IMG.badge) { const s = 560 * (1.35 - 0.35 * k), ar = IMG.badge.height / IMG.badge.width; ctx.save(); ctx.globalAlpha = clamp(k * 3); ctx.translate(540, 760); ctx.rotate(-0.08 * (1 - k)); ctx.drawImage(IMG.badge, -s / 2, -s * ar / 2, s, s * ar); ctx.restore(); }
    const kin = P(t, 57.05, 57.4, E.outBack);
    arrowTo(ctx, [540 - 380, 760], 0, 120, kin, 0, t); arrowTo(ctx, [540 + 380, 760], Math.PI, 120, kin, 0, t);
    if (t > 57.3) bigType(ctx, 'LEARN THE PLAYBOOK.', 540, 1330, 120, 1, 0, 57.3, t, C.mint, 'center');
    txt(ctx, 'creditcounselelite.com', 540, 1410, 36, UI, C.white, 'center', P(t, 57.9, 58.3));
    txt(ctx, 'Education and coaching. Not a lender. Individual results vary.', 540, 1680, 22, UI, C.white, 'center', 0.6 * P(t, 58.0, 58.4));
  }
  if (false) txt(ctx, 'individual results vary. education only.', 64, Y(60), 22, UI, C.white, 'left', 0.55);
}
// slow background orbits (panel only)
function orbits(ctx, t) { [[330, 1], [540, -1], [760, 1]].forEach(([r, d], i) => line(ctx, arcPts(540, Y(470), r, 0, TAU, 160), { w: 2, dash: [8, 10], march: t * 18 * d, alpha: 0.22 - i * 0.05 })); }

// ------------------------------------------------------------------ layout over time
const END = 12.71; window.__END = END;
const FH_KEYS = [[0, 1920], [0.9, SEAM], [END, 0]];
function footH(t) {
  let v = springKeys(t, FH_KEYS, { stiffness: 150, damping: 17 });
  for (let i = 1; i < FH_KEYS.length; i++) v -= Math.sign(FH_KEYS[i][1] - FH_KEYS[i - 1][1]) * 34 * antic(t, FH_KEYS[i][0], 0.22);
  return clamp(v, 0, DH);
}
const FULL_WINDOWS = [[0, 0.9]];
const CLAIM_FULL = [];

// ------------------------------------------------------------------ captions
let CAPS = [];
function buildCaptions(words) {
  const fix = [];
  for (let i = 0; i < words.length; i++) {
    let [a, b, w] = words[i]; if (!w || !w.trim()) continue; w = w.replace(/\$/g, '');
    if (/^,\d/.test(w) && fix.length) { fix[fix.length - 1][2] += w; fix[fix.length - 1][1] = b; continue; }
    if (w === 'processing') w = 'process';
    if (w === 'extra' && fix.length && fix[fix.length - 1][2] === '21') { fix[fix.length - 1][2] = '21x'; continue; }
    if (w === 'turnoff') w = 'return off';
    if (w === 'You' && words[i + 1] && words[i + 1][2] === 'got' && a > 39) w = 'He';
    fix.push([a, b, w]);
  }
  const chunks = []; let cur = null;
  for (const [a, b, w] of fix) {
    if (!cur || cur.n >= 3 || /[.,?]$/.test(cur.text) || a - cur.end > 0.35) { cur = { start: a, end: b, text: w, n: 1 }; chunks.push(cur); }
    else { cur.text += ' ' + w; cur.end = b; cur.n++; }
  }
  chunks.forEach((c, i) => { c.until = Math.min(chunks[i + 1] ? chunks[i + 1].start : c.end + 0.5, c.end + 0.6); c.text = c.text.replace(/[,]$/, '').toUpperCase(); });
  return chunks;
}
function captionsOld(ctx, t, fh) {
  if (t > 56.6) return;
  const c = CAPS.find((c) => t >= c.start - 0.04 && t < c.until);
  if (!c) return;
  const f = clamp((fh - SEAM) / (DH - SEAM)), y = lerp(DH - fh, 1600, f);
  ctx.save(); ctx.font = font(62, 400, DISPLAY);
  const w = ctx.measureText(c.text).width;
  ctx.fillStyle = C.capBg; ctx.fillRect(540 - w / 2 - 24, y - 46, w + 48, 92);
  ctx.fillStyle = C.mint; ctx.textAlign = 'center'; ctx.fillText(c.text, 540, y + 24); ctx.restore();
}

// ------------------------------------------------------------------ textures
let BG, GRAIN = [], LAYER, LCTX;
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function buildTextures() {
  BG = makeCanvas(W, H); const p = BG.getContext('2d'), r = mulberry32(21);
  const g = p.createRadialGradient(W / 2, H * 0.25, 50, W / 2, H * 0.35, H * 0.8); g.addColorStop(0, '#1557B8'); g.addColorStop(1, C.bg2);
  p.fillStyle = g; p.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 2) { p.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.07})`; p.fillRect(0, y, W, 1); }
  for (let x = 0; x < W; x += 2) { p.fillStyle = `rgba(255,255,255,${0.012 + r() * 0.03})`; p.fillRect(x, 0, 1, H); }
  for (let i = 0; i < W * H / 30; i++) { p.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(173,200,227,0.05)'; p.fillRect(r() * W, r() * H, 1 + r() * 2, 1); }
  for (let v = 0; v < 4; v++) {
    const c = makeCanvas(W, H), x = c.getContext('2d'), rr = mulberry32(300 + v), img = x.createImageData(W, H);
    for (let i = 0; i < img.data.length; i += 4) { const n = rr() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = n; img.data[i + 3] = 255; }
    x.putImageData(img, 0, 0); GRAIN.push(c);
  }
  LAYER = makeCanvas(W, H); LCTX = LAYER.getContext('2d');
}

// ------------------------------------------------------------------ footage
let FOOT = null; const FCACHE = new Map();
async function loadFrame(t) {
  const idx = Math.min(SRC_FRAMES, Math.max(1, Math.floor(t * SRC_FPS) + 1));
  if (!FCACHE.has(idx)) { const im = new Image(); im.src = `assets/footage/f_${String(idx).padStart(5, '0')}.jpg`; try { await im.decode(); } catch { return; } FCACHE.set(idx, im); while (FCACHE.size > 8) FCACHE.delete(FCACHE.keys().next().value); }
  FOOT = FCACHE.get(idx);
}
function pushIn(t) { for (const [a, b] of FULL_WINDOWS) if (t >= a - 0.5 && t < b + 0.8) return Math.pow(1.1, P(t, a, b + 0.8, E.inOutSine)); return 1; }
const FAST = [1.0, 1.45, 2.05, 3.05, 3.4, 3.75, 5.75, 6.3, 7.6, 8.2, 8.5, 8.8, 10.35, 11.15, 11.34, 11.6, 12.5, 13.15, 13.6, 14.3, 14.55, 15.4];
const near = (t) => FAST.some((k) => t > k - 0.15 && t < k + 0.9) || FH_KEYS.some(([k]) => t > k - 0.25 && t < k + 0.8);

M.film({
  fonts: [font(96, 400, 'Display'), font(46, 600, 'UI'), font(34, 500, 'UI'), font(100, 400, DISPLAY), font(40, 800, UI)],
  images: { badge: 'assets/badge.png' },
  hits: HITS,
  samples: (t) => (near(t) ? 8 : 3),
  async init() {
    buildTextures(); buildSprites(); buildHalftones();
    CAPS = buildCaptions(await fetch('assets/words.json').then((r) => r.json()));
  },
  prepare: (t) => loadFrame(t),
  draw(ctx, u, t, IMG) {
    const fh = footH(t); FH = fh;
    ctx.drawImage(BG, 0, 0);
    ctx.save(); ctx.scale(S, S); orbits(ctx, t); ctx.restore();
    LCTX.setTransform(1, 0, 0, 1, 0, 0); LCTX.clearRect(0, 0, W, H); LCTX.setTransform(S, 0, 0, S, 0, 0);
    { const m = 1 + 0.25 * clamp(1 - fh / SEAM); LCTX.translate(540, 960); LCTX.scale(m, m); LCTX.translate(-540, -960);
    n1(LCTX, t); n2(LCTX, t); n3(LCTX, t); }
    ctx.drawImage(LAYER, 0, 0);
    ctx.save(); ctx.scale(S, S);
    if (FOOT && fh > 1) {
      cover(ctx, FOOT, 0, DH - fh, DW, fh, { fx: 0.5, fy: lerp(0.25, 0.45, clamp((fh - SEAM) / (DH - SEAM))), zoom: pushIn(t) });
      if (fh < DH - 2) { ctx.fillStyle = C.mint; ctx.globalAlpha = 0.9; ctx.fillRect(0, DH - fh - 1.5, DW, 3); ctx.globalAlpha = 1; }
    }
    accents(ctx, t, IMG);
    captions(ctx, t, fh);
    if (CLAIM_FULL.some(([a, b]) => t > a + 0.3 && t < b) && fh > 1700) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8; txt(ctx, 'individual results vary. education only.', 540, 1860, 24, UI, C.white, 'center', 0.9); ctx.restore(); }
    ctx.restore();
  },
  post(ctx, u, t) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.12; ctx.drawImage(GRAIN[Math.floor(t * 24) % 4], 0, 0); ctx.restore(); },
});

// brand captions (black overlay, Poppins) — CCE Brand Style Guidelines 2025
function captions(ctx, t, fh) { BR.captions(ctx, t, fh, CAPS); }
