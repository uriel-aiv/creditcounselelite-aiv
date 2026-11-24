// CCE — "12 Soft Systems" founder split-screen, in blues only. Pure function of time: window.seek(t) paints frame t.
// Motion: a parametric radial system runs under every beat (rotating dashed rings, breathing spokes, nodes in
// orbit, a Lissajous trace); pills burst out of the centre along radial vectors and drift on their own small orbits.
// Look: warm off-white paper with drifting soft colour fog; blurred glowing pills (labels in Inter); dashed curved
// connectors with small dark square nodes and dots travelling along them; translucent light beams projecting from a
// small source onto monotone photo tiles; contour-map patches; a clean sans headline (Inter) with a light second line.
// Palette: royal blue (azul rey), sky (cielo), teal, navy, periwinkle, ice. One idea at a time; the system keeps moving.
import * as M from './lib/motion.js';
import * as BR from './lib/brand.js';

const { W, H, E, prog, clamp, lerp, spring, springKeys, SPRING, wobble, font, mulberry32, cover, rrect } = M;
const DW = 1080, DH = 1920, S = W / DW, TAU = M.TAU;
const C = { maroon: '#6B0505', green: '#266235', teal: '#008C96', pbBlue: '#114BA7', gold: '#CB9938', light: '#ADC8E3',  paper: '#F2F1EC', ink: '#16202E', node: '#1A2233', dash: 'rgba(22,32,46,0.55)' };
const B = { royal: [0, 74, 173], sky: [173, 200, 227], teal: [0, 140, 150], navy: [17, 75, 167], peri: [110, 140, 210], ice: [214, 228, 242], cyan: [0, 140, 150], maroon: [107, 5, 5], green: [38, 98, 53], gold: [203, 153, 56] };
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const SERIF = 'Display', UI = 'UI';
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 346;
const SEAM = 980;
{ const arc0 = CanvasRenderingContext2D.prototype.arc; CanvasRenderingContext2D.prototype.arc = function (x, y, r, a0, a1, ccw) { return arc0.call(this, x, y, Math.max(0, r), a0, a1, ccw); }; }

const HITS = [
  [1.2, 'title', 'whoosh', { len: 0.4, from: 800, to: 2200, gain: 0.25 }], [1.95, 'big', 'pop', { pitch: 'C6', gain: 0.4 }], [2.95, 'regional', 'pop', { pitch: 'E6', gain: 0.4 }],
  [4.3, 'local', 'pop', { pitch: 'G6', gain: 0.4 }], [6.9, 'power', 'bell', { pitch: 'E6', gain: 0.35 }], [7.05, 'people', 'blip', { pitch: 'A5', gain: 0.3 }],
  [9.3, 'different', 'whoosh', { len: 0.4, gain: 0.25 }], [9.95, 'spread', 'pop', { pitch: 'C6', gain: 0.3 }], [11.85, 'to end', 'whoosh', { len: 0.5, from: 500, to: 2400, gain: 0.4 }], [12.1, 'badge', 'thud', { gain: 0.7 }],
];

// ------------------------------------------------------------------ helpers
const pop = (t, t0, cfg = { stiffness: 260, damping: 18 }) => (t < t0 ? 0 : Math.max(0, spring(t - t0, cfg)));
const P = (t, a, b, ease = E.inOutCubic) => ease(prog(t, a, b));
const antic = (t, t0, dur = 0.2) => { const p = prog(t, t0 - dur, t0 + 0.02); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; };
const outK = (t, t0, d = 0.4) => clamp(1 - E.inCubic(prog(t, t0, t0 + d)));
const hashT = (s) => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 997; return h / 997 * 6.283; };
let FH = DH, TNOW = 0; const CEN = [540, 470];
const Y = (y) => y - (FH - SEAM);
function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }
const bez3 = (a, c1, c2, b, n = 50) => Array.from({ length: n + 1 }, (_, i) => { const k = i / n, u = 1 - k; return [u * u * u * a[0] + 3 * u * u * k * c1[0] + 3 * u * k * k * c2[0] + k * k * k * b[0], u * u * u * a[1] + 3 * u * u * k * c1[1] + 3 * u * k * k * c2[1] + k * k * k * b[1]]; });
const along = (pts, k) => { const n = pts.length - 1, f = clamp(k) * n, i = Math.min(n - 1, Math.floor(f)); return [lerp(pts[i][0], pts[i + 1][0], f - i), lerp(pts[i][1], pts[i + 1][1], f - i)]; };

// glowing pill: blurred colour aura + pale gradient body + label
function pill(ctx, text, x, y, col, k, { glow = 0.6, size = 40, dim = 0, w = null, fixed = false } = {}) {
  if (k <= 0.01) return;
  if (!fixed) { const h = hashT(text + col.join('')), cy0 = Y(CEN[1]), kk = clamp(k); x = lerp(CEN[0], x, kk) + 9 * Math.sin(TNOW * 0.9 + h); y = lerp(cy0, y, kk) + 7 * Math.cos(TNOW * 1.1 + h * 1.3); }
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.font = font(size, 500, UI); ctx.letterSpacing = `${-0.02 * size}px`; const tw = w || ctx.measureText(text).width + size * 1.5, th = size * 1.9;
  const c = dim ? [160, 168, 180] : col;
  ctx.shadowColor = rgba(c, 0.9 * glow + 0.15); ctx.shadowBlur = 34 + glow * 40;
  ctx.fillStyle = rgba(c, 0.55); rrect(ctx, -tw / 2, -th / 2, tw, th, th / 2); ctx.fill(); ctx.fill();
  ctx.shadowBlur = 0; const g = ctx.createLinearGradient(0, -th / 2, 0, th / 2); g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(1, rgba(c, 0.25));
  ctx.fillStyle = g; rrect(ctx, -tw / 2 + 5, -th / 2 + 5, tw - 10, th - 10, th / 2 - 5); ctx.fill();
  if (text) { ctx.fillStyle = dim ? 'rgba(22,32,46,0.55)' : C.ink; ctx.textAlign = 'center'; ctx.fillText(text, 0, size * 0.36); }
  ctx.restore();
}
// glass icon (Nano Banana Pro PNG, same material as the pills): bursts out of the centre, drifts on its own orbit
let ICONS = {};
function icon(ctx, key, x, y, size, k, { rot = 0, fixed = false, alpha = 1 } = {}) {
  const im = ICONS[key]; if (!im || k <= 0.01 || alpha <= 0.01) return;
  if (!fixed) { const h = hashT(key) + Math.round(x / 50), kk = clamp(k); x = lerp(CEN[0], x, kk) + 10 * Math.sin(TNOW * 0.8 + h); y = lerp(Y(CEN[1]), y, kk) + 8 * Math.cos(TNOW * 1.05 + h); }
  const w = size * k, h2 = w * im.height / im.width;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot + 0.03 * Math.sin(TNOW * 0.9 + hashT(key))); ctx.shadowColor = 'rgba(20,40,100,0.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6; ctx.drawImage(im, -w / 2, -h2 / 2, w, h2); if (key === 'people') { ctx.shadowColor = 'transparent'; ctx.drawImage(im, -w / 2, -h2 / 2, w, h2); } ctx.restore();
}
// dashed connector drawn on from 0..p (erased from q); square nodes at given fractions; optional travelling dots
function dashed(ctx, pts, p, q = 0, { nodes = [], dots = 0, t = 0, speed = 0.5, w = 2.5 } = {}) {
  p = clamp(p); q = clamp(q); if (p - q < 0.004) return;
  const n = pts.length - 1, i0 = Math.floor(q * n), i1 = Math.ceil(p * n);
  ctx.save(); ctx.strokeStyle = C.dash; ctx.lineWidth = w; ctx.setLineDash([9, 9]); ctx.lineDashOffset = -t * 30; ctx.beginPath();
  for (let i = i0; i <= i1; i++) { const pt = i === i0 ? along(pts, q) : i === i1 ? along(pts, p) : pts[i]; i === i0 ? ctx.moveTo(...pt) : ctx.lineTo(...pt); }
  ctx.stroke(); ctx.setLineDash([]);
  nodes.forEach((f) => { if (f > q && f < p) { const [x, y] = along(pts, f); ctx.fillStyle = C.node; ctx.fillRect(x - 6, y - 6, 12, 12); } });
  for (let d = 0; d < dots; d++) { const f = ((t * speed + d / dots) % 1); if (f > q && f < p) { const [x, y] = along(pts, f); ctx.fillStyle = rgba(B.royal, 0.9); ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); } }
  ctx.restore();
}
// translucent light beam from a source point to a rect's two near corners
function beam(ctx, sx, sy, rx, ry, rw, rh, col, a) {
  if (a <= 0.01) return;
  const corners = [[rx, ry], [rx + rw, ry], [rx + rw, ry + rh], [rx, ry + rh]];
  // choose the two corners that make the widest angle from the source
  let best = [0, 1], bestA = -1;
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const a1 = Math.atan2(corners[i][1] - sy, corners[i][0] - sx), a2 = Math.atan2(corners[j][1] - sy, corners[j][0] - sx); let d = Math.abs(a1 - a2); if (d > Math.PI) d = TAU - d; if (d > bestA) { bestA = d; best = [i, j]; } }
  const [c1, c2] = [corners[best[0]], corners[best[1]]], mx = (c1[0] + c2[0]) / 2, my = (c1[1] + c2[1]) / 2;
  const g = ctx.createLinearGradient(sx, sy, mx, my); g.addColorStop(0, rgba(col, 0.55 * a)); g.addColorStop(1, rgba(col, 0.18 * a));
  ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(...c1); ctx.lineTo(...c2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(B.navy, 0.25 * a); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(...c1); ctx.lineTo(sx, sy); ctx.lineTo(...c2); ctx.stroke();
  [c1, c2].forEach(([x, y]) => { ctx.fillStyle = rgba(B.navy, 0.7 * a); ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); });
  ctx.restore();
}
// image tile: a tinted glass rectangle with a transparent GPT object centred in it (blue-toned), grain pass on top
let OBJ = {}, TGRAIN = null;
function toneObj(img, col) {          // blue duotone that keeps the object's alpha
  const c = canvas(img.width, img.height), x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height), p = d.data, dk = B.navy, lt = [236, 244, 255];
  for (let i = 0; i < p.length; i += 4) { const l = (0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2]) / 255, m = l < 0.5 ? l * 2 : 1, n = l < 0.5 ? 0 : (l - 0.5) * 2;
    for (let k = 0; k < 3; k++) p[i + k] = l < 0.5 ? lerp(dk[k], col[k], m) : lerp(col[k], lt[k], n); }
  x.putImageData(d, 0, 0); return c;
}
function tile(ctx, key, x, y, w, h, k, col = B.sky) {
  const im = OBJ[key + col.join()]; if (!im || k <= 0.01) return;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k);
  ctx.shadowColor = rgba(col, 0.75); ctx.shadowBlur = 30; ctx.fillStyle = rgba(col, 0.5); rrect(ctx, -w / 2, -h / 2, w, h, 12); ctx.fill();
  ctx.shadowBlur = 0; ctx.save(); rrect(ctx, -w / 2, -h / 2, w, h, 12); ctx.clip();
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, 'rgba(255,255,255,0.92)'); g.addColorStop(1, rgba(col, 0.55)); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  const s = Math.min(w * 0.78 / im.width, h * 0.78 / im.height); ctx.shadowColor = 'rgba(20,40,100,0.3)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
  ctx.drawImage(im, -im.width * s / 2, -im.height * s / 2, im.width * s, im.height * s); ctx.shadowColor = 'transparent';
  if (TGRAIN) { ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(TGRAIN, -w / 2, -h / 2, w, h); ctx.globalCompositeOperation = 'source-over'; }
  ctx.restore(); ctx.restore();
}
function serif(ctx, s, x, y, size, a, italic = false, align = 'center', col = C.ink) {
  if (a <= 0.01) return; ctx.save(); ctx.globalAlpha *= a; ctx.font = font(size, 400, 'Display'); ctx.letterSpacing = `${-0.02 * size}px`; ctx.fillStyle = col; ctx.textAlign = align; ctx.fillText(s, x, y + (1 - a) * 18); ctx.restore();
}
function small(ctx, s, x, y, a, size = 26, align = 'center') { if (a <= 0.01) return; ctx.save(); ctx.globalAlpha *= a; ctx.font = font(size, 500, UI); ctx.letterSpacing = `${-0.02 * size}px`; ctx.fillStyle = 'rgba(22,32,46,0.75)'; ctx.textAlign = align; ctx.fillText(s, x, y); ctx.restore(); }

// ------------------------------------------------------------------ background: paper + drifting blue fog (baked blob sprites)
let FOG = [], TOPO = null, GRAIN = null;
function buildBG() {
  const cols = [B.sky, B.royal, B.teal, B.peri, B.ice, B.cyan];
  FOG = cols.map((c, i) => { const s = 520, cv = canvas(s, s), x = cv.getContext('2d'), g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, rgba(c, 0.30)); g.addColorStop(0.55, rgba(c, 0.12)); g.addColorStop(1, rgba(c, 0)); x.fillStyle = g; x.fillRect(0, 0, s, s); return cv; });
  // contour-map patch
  TOPO = canvas(420, 340); const x = TOPO.getContext('2d'), r = mulberry32(9); x.strokeStyle = rgba(B.royal, 0.55); x.lineWidth = 1.6;
  for (const [cx, cy] of [[120, 120], [300, 230], [330, 70]]) for (let k = 1; k < 14; k++) { x.beginPath(); for (let i = 0; i <= 90; i++) { const a = (i / 90) * TAU, rr = k * 14 * (1 + 0.18 * Math.sin(a * 3 + k * 0.7) + 0.08 * Math.sin(a * 7 + cx)); const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * 0.8; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
  GRAIN = canvas(W, H); const gx = GRAIN.getContext('2d'), gr = mulberry32(4);
  for (let i = 0; i < W * H / 12; i++) { gx.fillStyle = gr() < 0.5 ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.05)'; gx.fillRect(gr() * W, gr() * H, 1, 1); }
}
function background(ctx, t) {
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, DW, DH);
  FOG.forEach((f, i) => { const x = 540 + Math.sin(t * 0.13 + i * 1.9) * 380, y = Y(460) + Math.cos(t * 0.11 + i * 1.3) * 300, s = 900 + 200 * Math.sin(t * 0.2 + i); ctx.drawImage(f, x - s / 2, y - s / 2, s, s); });
}

// ------------------------------------------------------------------ the parametric system under everything
function system(ctx, t, a = 1) {
  const cx = CEN[0], cy = Y(CEN[1]); ctx.save(); ctx.globalAlpha = a;
  // rotating dashed rings with riding nodes
  [[190, 0.05, 3, B.royal], [320, -0.035, 4, B.teal], [450, 0.025, 5, B.sky]].forEach(([r, w, n, c], j) => {
    const rr = r * (1 + 0.01 * Math.sin(t * 0.3 + j));
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * w); ctx.strokeStyle = rgba(B.navy, 0.22); ctx.setLineDash([6, 12]); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, rr, rr * 0.82, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    for (let k = 0; k < n; k++) { const a2 = (k / n) * TAU + t * w * 2.2; ctx.fillStyle = k % 2 ? C.node : rgba(c, 0.9); const x = Math.cos(a2) * rr, y = Math.sin(a2) * rr * 0.82; k % 2 ? ctx.fillRect(x - 5, y - 5, 10, 10) : (ctx.beginPath(), ctx.arc(x, y, 6, 0, TAU), ctx.fill()); }
    ctx.restore();
  });
  ctx.restore();
}

// ------------------------------------------------------------------ scenes
let IMGR = {};
// A — credit limit -> bank account, next day
function sA(ctx, t) {
  if (t < 1.1 || t > 7.2) return;
  const ex = outK(t, 6.75), cy = Y(380);
  const a = [250, cy], b = [830, cy], path = bez3([a[0] + 120, cy], [440, cy - 260], [640, cy + 260], [b[0] - 130, cy]);
  dashed(ctx, path, P(t, 2.2, 3.4, E.inOutSine) * ex, 0, { nodes: [0.33, 0.66], dots: 3, t, speed: 0.7 });
  icon(ctx, 'card', a[0], a[1] - 150, 240, pop(t, 1.3) * ex);
  pill(ctx, 'Credit limit', a[0], a[1], B.royal, pop(t, 1.35) * ex, { glow: 0.7 });
  const g = P(t, 4.05, 4.4); pill(ctx, 'Bank account', b[0], b[1], B.teal, pop(t, 1.6) * ex * (1 + 0.05 * wobble(Math.max(0, t - 4.1), 3, 6) * (t > 4.1 ? 1 : 0)), { glow: 0.3 + g * 0.9, dim: 0 });
  icon(ctx, 'bank', b[0], b[1] - 155, 240 * (1 + 0.12 * wobble(Math.max(0, t - 4.1), 3, 6) * (t > 4.1 ? 1 : 0)), pop(t, 1.55) * ex, { alpha: lerp(0.55, 1, P(t, 3.8, 4.15)) });
  const nd = [540, Y(720)], drop = bez3([b[0], cy + 40], [b[0], Y(600)], [nd[0] + 200, nd[1]], [nd[0] + 110, nd[1]]);
  dashed(ctx, drop, P(t, 5.6, 6.3, E.inOutSine) * ex, 0, { nodes: [0.5], t });
  pill(ctx, 'Next day', nd[0], nd[1], B.sky, pop(t, 6.3) * ex, { glow: 0.9 });
  icon(ctx, 'calendar', nd[0] - 230, nd[1], 192, pop(t, 6.2) * ex);
}
// B — a flat fee, 1–5%; especially 0%
function sB(ctx, t) {
  if (t < 6.95 || t > 12.6) return;
  const ex = outK(t, 12.15);
  serif(ctx, 'A flat fee,', 540, Y(220), 92, P(t, 7.4, 7.9) * ex * (1 - P(t, 10.9, 11.2)));
  serif(ctx, 'usually 1–5%', 540, Y(320), 92, P(t, 9.3, 9.8) * ex * (1 - P(t, 10.9, 11.2)), true, 'center', 'rgb(0,74,173)');
  const merge = P(t, 10.95, 11.4, E.inOutCubic);
  const cols = [B.ice, B.sky, B.peri, B.royal, B.maroon];
  for (let i = 0; i < 5; i++) {
    const x0 = 540 + (i - 2) * 190, x = lerp(x0, 540, merge), on = i === 0 ? P(t, 9.28, 9.45) : P(t, 9.6 + (i - 1) * 0.11, 9.75 + (i - 1) * 0.11);
    pill(ctx, `${i + 1}%`, x, Y(560), cols[i], pop(t, 8.2 + i * 0.06) * ex * (1 - merge), { glow: on, dim: 1 - on, w: 150 });
  }
  icon(ctx, 'percent', 540, Y(790), 240, pop(t, 9.3) * ex);
  pill(ctx, '0%', 540, Y(560), B.royal, pop(t, 11.15, { stiffness: 200, damping: 14 }) * ex, { glow: 1.2, size: 64, w: 300 });
  serif(ctx, 'especially', 540, Y(380), 70, P(t, 11.3, 11.7) * ex, true);
}
// C — the 0% runs 6 to 24 months; 18 is common
function sC(ctx, t) {
  if (t < 12.2 || t > 18.7) return;
  const ex = outK(t, 18.25), y = Y(600), x0 = 110, x1 = 970;
  const wave = Array.from({ length: 81 }, (_, i) => { const k = i / 80; return [lerp(x0, x1, k), y + Math.sin(k * TAU * 1.5) * 34]; });
  const xm = (m) => (m - 6) / 18;
  dashed(ctx, wave, P(t, 12.4, 13.3, E.inOutSine) * ex, 0, { nodes: [xm(12), xm(18)], t });
  [[6, 13.5], [24, 14.3]].forEach(([m, t0]) => { const [x, yy] = along(wave, xm(m)); pill(ctx, `${m} mo`, x + (m === 6 ? 40 : -40), yy, B.sky, pop(t, t0) * ex, { glow: 0.5, size: 30 }); });
  // the source pill and the beam onto 18
  const src = [540, Y(200)];
  const [x18, y18] = along(wave, xm(18));
  pill(ctx, '0% intro', src[0], src[1], B.royal, pop(t, 12.6) * ex, { glow: 0.8 });
  icon(ctx, 'calendar', src[0] - 230, src[1], 192, pop(t, 12.75) * ex);
  beam(ctx, src[0], src[1] + 30, x18 - 100, y18 - 40, 200, 80, B.green, P(t, 16.95, 17.3) * ex);
  pill(ctx, '18 months', x18, y18, B.green, pop(t, 17.14) * ex, { glow: 1.1, size: 34 });
  small(ctx, 'most common', x18, y18 + 90, P(t, 17.4, 17.7) * ex);
}
// D — a loop: every 6 months, per person, repeat
function sD(ctx, t) {
  if (t < 18.4 || t > 24.5) return;
  const ex = outK(t, 23.95), cx = 540, cy = Y(470);
  const loop = Array.from({ length: 121 }, (_, i) => { const a = (i / 120) * TAU, d = 1 + Math.sin(a) ** 2; return [cx + 420 * Math.cos(a) / d, cy + 520 * Math.sin(a) * Math.cos(a) / d]; });
  dashed(ctx, loop, P(t, 18.9, 19.9, E.inOutSine) * ex, 0, { nodes: [0.25, 0.75, 0.0, 0.5], dots: 2, t, speed: 0.35 });
  const lbl = [['Apply', 0.07, B.royal], ['6 months', 0.43, B.sky], ['Repeat', 0.57, B.green], ['Again', 0.93, B.peri]];
  const reps = [21.45, 22.3, 23.08];
  lbl.forEach(([s, f, c], i) => { const [x, y] = along(loop, f); const flash = reps.some((r) => t > r && t < r + 0.4) && i === 2 ? 0.6 : 0; pill(ctx, s, x, y, c, pop(t, 19.1 + i * 0.12) * ex, { glow: 0.5 + flash }); });
  icon(ctx, 'loop', cx, cy, 240, pop(t, 19.3) * ex, { rot: t * 0.6, fixed: true });
  icon(ctx, 'people', 540, Y(775), 180, pop(t, 20.6) * ex);
  pill(ctx, 'You', 300, Y(850), B.royal, pop(t, 20.55) * ex, { size: 30, glow: 0.6 }); pill(ctx, 'Partner', 780, Y(850), B.teal, pop(t, 20.72) * ex, { size: 30, glow: 0.6 });
  dashed(ctx, bez3([360, Y(820)], [420, Y(760)], [480, Y(640)], [cx - 40, cy + 120]), P(t, 20.6, 21.0) * ex, 0, { t }); dashed(ctx, bez3([720, Y(820)], [660, Y(760)], [600, Y(640)], [cx + 40, cy + 120]), P(t, 20.8, 21.2) * ex, 0, { t });
}
// E — up to 150,000 without documentation: the paperwork pills fall away; the goal stays lit
function sE(ctx, t) {
  if (t < 32.3 || t > 36.6) return;
  const ex = outK(t, 36.2), goal = [760, Y(470)];
  const docs = [['Pay stubs', Y(240)], ['Tax returns', Y(470)], ['Statements', Y(700)]];
  docs.forEach(([s, y], i) => {
    const gone = P(t, 34.8 + i * 0.1, 35.3 + i * 0.1, E.inCubic), path = bez3([330, y], [480, y], [560, goal[1]], [goal[0] - 170, goal[1]]);
    dashed(ctx, path, P(t, 32.8 + i * 0.1, 33.4 + i * 0.1) * ex, gone, { nodes: [0.5], t });
    ctx.save(); ctx.globalAlpha = 1 - gone; pill(ctx, s, 230 - gone * 60, y + gone * 40, B.ice, pop(t, 32.6 + i * 0.08) * ex, { dim: 1, size: 30 }); ctx.restore();
  });
  icon(ctx, 'docs', 230, Y(110), 192, pop(t, 32.55) * ex, { alpha: 1 - P(t, 34.8, 35.3, E.inCubic) });
  icon(ctx, 'card', goal[0], goal[1] - 160, 224, pop(t, 33.2) * ex);
  pill(ctx, 'Up to 150,000', goal[0], goal[1], B.royal, pop(t, 33.3) * ex, { glow: 0.6 + P(t, 35.2, 35.6) * 0.8, size: 38 });
  small(ctx, 'no documentation', goal[0], goal[1] + 100, P(t, 35.4, 35.8) * ex, 28);
}
// F — 13 cards in 10 days: light beams project onto card photos; a bonus pill lands on each
const CARDS = ['card_navy', 'card_gold', 'card_black', 'card_white', 'card_green'];
const TCOL = () => [B.sky, B.royal, B.teal, B.green, B.maroon];
function sF(ctx, t) {
  if (t < 35.9 || t > 44.9) return;
  const ex = outK(t, 44.35), src = [130, Y(830)];
  const rects = [[300, Y(90), 220, 160], [600, Y(150), 220, 160], [820, Y(330), 200, 150], [430, Y(380), 220, 160], [700, Y(560), 220, 160]];
  rects.forEach(([x, y, w, h], i) => beam(ctx, src[0], src[1], x, y, w, h, TCOL()[i], P(t, 36.0 + i * 0.07, 36.35 + i * 0.07) * ex));
  rects.forEach(([x, y, w, h], i) => { const wave = Math.max(0, Math.sin(Math.PI * prog(t, 40.5 + i * 0.06, 41.0 + i * 0.06))); tile(ctx, CARDS[i], x, y - wave * 14, w, h, pop(t, 36.1 + i * 0.07) * ex, TCOL()[i]); });
  icon(ctx, 'card', src[0], src[1], 208, pop(t, 35.95) * ex, { fixed: true });
  icon(ctx, 'gift', 910, Y(820), 224, pop(t, 43.6) * ex);
  pill(ctx, '13 cards', 230, Y(620), B.royal, pop(t, 36.42) * ex, { glow: 0.8 });
  pill(ctx, '10 days', 230, Y(720), B.green, pop(t, 38.5) * ex, { glow: 0.6, size: 30 });
  rects.forEach(([x, y, w], i) => pill(ctx, '+ bonus', x + w - 30, y - 10, B.gold, pop(t, 43.58 + i * 0.09, { stiffness: 380, damping: 16 }) * ex, { size: 22, glow: 0.9 }));
}
// G — travel: light beams from the plane project onto three tiles (same triangle beams as the cards); 7x to 21x
function sG(ctx, t) {
  if (t < 49.5 || t > 55.9) return;
  const ex = outK(t, 55.25), src = [170, Y(790)];
  const tp = [['window', 330, Y(110), 260, 200, B.sky], ['boarding', 640, Y(250), 300, 200, B.teal], ['suitcase', 420, Y(450), 240, 200, B.green]];
  tp.forEach(([k, x, y, w, h, c], i) => beam(ctx, src[0], src[1], x, y, w, h, c, P(t, 50.0 + i * 0.1, 50.4 + i * 0.1) * ex));
  tp.forEach(([k, x, y, w, h, c], i) => tile(ctx, k, x, y, w, h, pop(t, 50.1 + i * 0.12) * ex, c));
  icon(ctx, 'plane', src[0], src[1], 230, pop(t, 49.9) * ex, { fixed: true, rot: -0.35 });
  pill(ctx, 'Travel', 360, Y(830), B.sky, pop(t, 51.94) * ex, { glow: 0.8 });
  if (t > 53.3) pill(ctx, `${Math.round(lerp(7, 21, P(t, 53.45, 53.98, E.inOutSine)))}x value`, 790, Y(720), B.royal, pop(t, 53.3) * ex * (1 + 0.05 * wobble(Math.max(0, t - 53.98), 3, 6) * (t > 53.98 ? 1 : 0)), { glow: 1.1, size: 40 });
}

// ------------------------------------------------------------------ footage test: Video 8 "The three levels of banks" (11.6 s)
const LV = [[Y0 => Y0(330), 'Big banks', B.royal, 1.95, 220], [Y0 => Y0(510), 'Regional banks', B.teal, 2.95, 170], [Y0 => Y0(690), 'Local credit unions', B.sky, 4.3, 130]];
function sL(ctx, t) {
  if (t < 0.7) return;
  serif(ctx, 'Three levels', 540, Y(165), 96, P(t, 1.2, 1.6) * (1 - P(t, 8.6, 8.9)));
  serif(ctx, 'Different in every area', 540, Y(165), 80, P(t, 9.3, 9.7), true, 'center', 'rgb(0,74,173)');
  const path = [[300, Y(330)], [300, Y(510)], [300, Y(690)]];
  dashed(ctx, path, P(t, 2.4, 4.6, E.inOutSine), 0, { nodes: [0, 0.5, 1], dots: 2, t, speed: 0.4 });
  const power = P(t, 6.9, 7.3), diff = P(t, 9.9, 10.4, E.outCubic);
  LV.forEach(([yf, label, col, t0, isz], i) => {
    const y = yf(Y), focus = i === 2, dimK = power * (focus ? 0 : 0.85);
    const k = pop(t, t0) * (focus ? 1 + 0.06 * Math.sin((t - 7.0) * 5) * power : 1 - 0.12 * dimK);
    small(ctx, `${i + 1}`, 190, y + 12, P(t, t0, t0 + 0.3) * (1 - 0.6 * dimK), 44);
    pill(ctx, label, 470, y, focus ? (power > 0.5 ? B.royal : col) : col, k, { glow: focus ? 0.6 + 0.8 * power : 0.6 * (1 - dimK), dim: dimK > 0.5 ? 1 : 0, fixed: true, size: 40, w: 420 });
    icon(ctx, 'bank', 830, y, isz, pop(t, t0 + 0.1), { fixed: true, alpha: 1 - 0.6 * dimK });
  });
  serif(ctx, 'Most power', 540, Y(830), 64, P(t, 7.0, 7.4) * (1 - P(t, 9.6, 9.9)), true, 'center', 'rgb(0,74,173)');
  // each one is different: the credit union splits into pills of different sizes around it
  [[250, 820, 120], [420, 800, 170], [590, 830, 90], [740, 805, 150], [880, 825, 110]].forEach(([x, y, w], j) => pill(ctx, '', x, Y(y), [B.sky, B.teal, B.peri, B.royal, B.navy][j], pop(t, 9.95 + j * 0.07) * diff, { glow: 0.5, fixed: true, w, size: 26 }));
}

function endCard(ctx, t, IMG) {
  if (t < 56.6) return;
  FOG.forEach((f, i) => { const x = 540 + Math.sin(t * 0.13 + i * 1.9) * 300, y = 900 + Math.cos(t * 0.11 + i * 1.3) * 420; ctx.drawImage(f, x - 500, y - 500, 1000, 1000); });
  const k = clamp(pop(t, 56.95, { stiffness: 200, damping: 16 }));
  if (IMG.badge && k > 0.01) { const s = 480 * lerp(0.8, 1, k), ar = IMG.badge.height / IMG.badge.width; ctx.save(); ctx.globalAlpha = clamp(k * 2); ctx.shadowColor = rgba(B.sky, 0.9); ctx.shadowBlur = 60; ctx.drawImage(IMG.badge, 540 - s / 2, 740 - s * ar / 2, s, s * ar); ctx.restore(); }
  serif(ctx, 'Learn the', 540, 1170, 96, P(t, 57.3, 57.7)); serif(ctx, 'playbook.', 540, 1270, 96, P(t, 57.45, 57.85), true, 'center', 'rgb(0,74,173)');
  pill(ctx, 'creditcounselelite.com', 540, 1400, B.sky, pop(t, 57.8), { size: 30, glow: 0.7, fixed: true });
  small(ctx, 'Education and coaching. Not a lender. Individual results vary.', 540, 1690, P(t, 58.0, 58.4) * 0.8, 22);
}

// ------------------------------------------------------------------ layout over time
const END = 11.75; window.__END = END;
const FH_KEYS = [[0, 1920], [0.8, SEAM], [END, 0]];
function footH(t) {
  let v = springKeys(t, FH_KEYS, { stiffness: 150, damping: 17 });
  for (let i = 1; i < FH_KEYS.length; i++) v -= Math.sign(FH_KEYS[i][1] - FH_KEYS[i - 1][1]) * 34 * antic(t, FH_KEYS[i][0], 0.22);
  return clamp(v, 0, DH);
}
const FULL_WINDOWS = [[0, 0.8]];
const CLAIM_FULL = [];

// ------------------------------------------------------------------ captions: soft glowing pill
let CAPS = [];
function buildCaptions(words) {
  const fix = [];
  for (let i = 0; i < words.length; i++) {
    let [a, b, w] = words[i]; if (!w || !w.trim()) continue;
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
  chunks.forEach((c, i) => { c.until = Math.min(chunks[i + 1] ? chunks[i + 1].start : c.end + 0.5, c.end + 0.6); c.text = c.text.replace(/[,]$/, ''); });
  return chunks;
}
function captionsOld(ctx, t, fh) {
  if (t > 56.6) return;
  const c = CAPS.find((c) => t >= c.start - 0.04 && t < c.until);
  if (!c) return;
  const f = clamp((fh - SEAM) / (DH - SEAM)), y = lerp(DH - fh, 1600, f);
  pill(ctx, c.text, 540, y, B.sky, clamp(pop(t, c.start - 0.04, { stiffness: 420, damping: 26 })), { size: 44, glow: 0.5, fixed: true });
}

// ------------------------------------------------------------------ footage
let FOOT = null; const FCACHE = new Map();
async function loadFrame(t) {
  const idx = Math.min(SRC_FRAMES, Math.max(1, Math.floor(t * SRC_FPS) + 1));
  if (!FCACHE.has(idx)) { const im = new Image(); im.src = `assets/footage/f_${String(idx).padStart(5, '0')}.jpg`; try { await im.decode(); } catch { return; } FCACHE.set(idx, im); while (FCACHE.size > 8) FCACHE.delete(FCACHE.keys().next().value); }
  FOOT = FCACHE.get(idx);
}
function pushIn(t) { for (const [a, b] of FULL_WINDOWS) if (t >= a - 0.5 && t < b + 0.8) return Math.pow(1.1, P(t, a, b + 0.8, E.inOutSine)); return 1; }
const near = (t) => FH_KEYS.some(([k]) => t > k - 0.25 && t < k + 0.8);
const ICONK = ['card', 'bank', 'calendar', 'percent', 'people', 'docs', 'plane', 'gift', 'loop'];
const OBJK = ['card_black', 'card_navy', 'card_gold', 'card_white', 'card_green', 'window', 'boarding', 'suitcase'];
const IMGS = ['card_navy', 'card_gold', 'card_black', 'card_white', 'card_green', 'wing', 'beach', 'pool'];

M.film({
  fonts: [font(96, 400, 'Display'), font(46, 600, 'UI'), font(34, 500, 'UI'), font(100, 600, UI), font(100, 300, UI), font(40, 500, UI)],
  images: Object.fromEntries([['badge', 'assets/badge.png'], ...IMGS.map((k) => [k, `assets/img/${k}.jpg`]), ...ICONK.map((k) => ['i_' + k, `assets/icons/${k}.png`]), ...OBJK.map((k) => ['o_' + k, `assets/obj/${k}.png`])]),
  hits: HITS,
  samples: (t) => (near(t) ? 5 : 2),
  async init(ctx, IMG) { IMGR = IMG; ICONK.forEach((k) => (ICONS[k] = IMG['i_' + k]));
    const cols = [B.sky, B.royal, B.teal, B.peri, B.cyan, B.green, B.maroon, B.gold]; OBJK.forEach((k) => { if (IMG['o_' + k]) cols.forEach((c) => (OBJ[k + c.join()] = toneObj(IMG['o_' + k], c))); });
    TGRAIN = canvas(400, 300); { const gx = TGRAIN.getContext('2d'), r = mulberry32(12); gx.fillStyle = '#808080'; gx.fillRect(0, 0, 400, 300); for (let i = 0; i < 26000; i++) { const v = 128 + (r() - 0.5) * 150; gx.fillStyle = `rgb(${v},${v},${v})`; gx.fillRect(r() * 400, r() * 300, 1.2, 1.2); } } buildBG(); CAPS = buildCaptions(await fetch('assets/words.json').then((r) => r.json())); },
  prepare: (t) => loadFrame(t),
  draw(ctx, u, t, IMG) {
    const fh = footH(t); FH = fh; TNOW = t;
    ctx.save(); ctx.scale(S, S);
    background(ctx, t);
    if (fh < DH - 4) {
      const z = 1 + 0.012 * Math.sin(t * 0.3), cx = 540, cy = Y(480);
      ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.rotate(0.006 * Math.sin(t * 0.2)); ctx.translate(-cx, -cy);
      system(ctx, t, 0.3);
      sL(ctx, t);
      ctx.restore();
    }
    endCard(ctx, t, IMG);
    ctx.restore();
    if (GRAIN) ctx.drawImage(GRAIN, 0, 0);
    ctx.save(); ctx.scale(S, S);
    if (FOOT && fh > 1) {
      cover(ctx, FOOT, 0, DH - fh, DW, fh, { fx: 0.5, fy: lerp(0.25, 0.45, clamp((fh - SEAM) / (DH - SEAM))), zoom: pushIn(t) });
      if (fh < DH - 2) { ctx.fillStyle = 'rgba(20,40,100,0.25)'; ctx.fillRect(0, DH - fh - 2, DW, 4); }
    }
    captions(ctx, t, fh);
    const disc = (x, y, a, c) => { ctx.save(); ctx.font = font(20, 500, UI); ctx.fillStyle = c; ctx.textAlign = a; ctx.fillText('Individual results vary. Education only.', x, y); ctx.restore(); };
    if (CLAIM_FULL.some(([a, b]) => t > a + 0.3 && t < b) && fh > 1700) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 6; disc(540, 1860, 'center', '#fff'); ctx.restore(); }
    if (false) disc(1050, Y(40), 'right', 'rgba(22,32,46,0.6)');
    ctx.restore();
  },
});

// brand captions (black overlay, Poppins) — CCE Brand Style Guidelines 2025
function captions(ctx, t, fh) { BR.captions(ctx, t, fh, CAPS); }
