// CCE — "10 Odd One Out" founder split-screen. Pure function of time: window.seek(t) paints frame t.
// Grid = seconds (u === t). Motion on top, founder below; key lines go full-screen.
// Look: Visualize Value — pure black, thin white geometric line diagrams, small spaced uppercase labels. Each beat is
// a concept (containers, a wedge, a distribution, an orbit, a path, a fan, a curve), drawn on stroke by stroke and
// morphing into the next. Outline vs solid white marks the one thing that matters (the odd one out).
import * as M from './lib/motion.js';
import * as BR from './lib/brand.js';

const { W, H, E, prog, clamp, lerp, spring, springKeys, SPRING, wobble, font, mulberry32, cover, rrect } = M;
const DW = 1080, DH = 1920, S = W / DW, TAU = M.TAU;
const C = { maroon: '#6B0505', green: '#266235', teal: '#008C96', pbBlue: '#114BA7', gold: '#CB9938', light: '#ADC8E3',  bg: '#030304', white: '#F4F5F7', dim: 'rgba(244,245,247,0.28)', blue: '#004AAD', glow: '#3A78D6', ink: '#000' };
for (const k of ['maroon', 'green', 'teal', 'pbBlue', 'gold', 'light', 'blue']) C[k] = '#F4F5F7'; C.glow = 'rgba(255,255,255,0.55)';  // Visualize Value: black and white only
const DISPLAY = 'Display', UI = 'UI';
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 890;
const SEAM = 980;

const HITS = [
  [0.4, 'circle', 'blip', { pitch: 'C5', gain: 0.25 }], [1.7, 'shield', 'whoosh', { len: 0.6, from: 600, to: 2000, gain: 0.25 }], [3.4, 'fill', 'pop', { pitch: 'E6', gain: 0.3 }],
  [4.6, 'arrow', 'whoosh', { len: 0.4, gain: 0.2 }], [5.0, 'apps', 'click', { gain: 0.35 }], [7.4, 'loan', 'blip', { pitch: 'C5', gain: 0.25 }], [8.4, 'strike', 'whoosh', { len: 0.3, from: 3000, to: 900, gain: 0.3 }],
  [10.2, 'you', 'pop', { pitch: 'E6', gain: 0.3 }], [11.2, 'direct', 'whoosh', { len: 0.6, gain: 0.25 }], [12.0, 'bank', 'blip', { pitch: 'G5', gain: 0.25 }], [13.8, 'best', 'pop', { pitch: 'C6', gain: 0.3 }],
  [16.0, 'day', 'whoosh', { len: 0.8, from: 400, to: 1600, gain: 0.2 }], [17.3, '30 min', 'pop', { pitch: 'E6', gain: 0.35 }], [22.4, 'people', 'blip', { pitch: 'C5', gain: 0.25 }],
  [24.45, 'path', 'whoosh', { len: 0.5, gain: 0.2 }], [25.2, 'fork', 'blip', { pitch: 'G5', gain: 0.25 }], [29.7, 'dots', 'type', { len: 1.2, gain: 0.2 }], [33.0, 'forward', 'whoosh', { len: 0.4, from: 500, to: 2600, gain: 0.35 }],
  [34.55, 'to end', 'whoosh', { len: 0.5, from: 500, to: 2400, gain: 0.4 }], [34.8, 'badge', 'thud', { gain: 0.7 }],
];

// ------------------------------------------------------------------ helpers
{ const arc0 = CanvasRenderingContext2D.prototype.arc; CanvasRenderingContext2D.prototype.arc = function (x, y, r, a0, a1, ccw) { return arc0.call(this, x, y, Math.max(0, r), a0, a1, ccw); };
  const el0 = CanvasRenderingContext2D.prototype.ellipse; CanvasRenderingContext2D.prototype.ellipse = function (x, y, rx, ry, ...rest) { return el0.call(this, x, y, Math.max(0, rx), Math.max(0, ry), ...rest); }; }
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);
const pop = (t, t0, cfg = { stiffness: 300, damping: 18 }) => (t < t0 ? 0 : spring(t - t0, cfg));
const P = (t, a, b, ease = E.inOutCubic) => ease(prog(t, a, b));
const antic = (t, t0, dur = 0.2) => { const p = prog(t, t0 - dur, t0 + 0.02); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; };
const outK = (t, t0, d = 0.35) => 1 - E.inBack(prog(t, t0, t0 + d), 1.7);
let FH = DH;
const Y = (y) => (FH >= SEAM ? y - (FH - SEAM) : y + (SEAM - FH) * 0.48);
function txt(ctx, s, x, y, size, weight, color, align = 'center', alpha = 1, italic = false) {
  if (alpha <= 0.01) return; ctx.save(); ctx.globalAlpha *= alpha; ctx.font = font(size, weight, UI); ctx.fillStyle = color; ctx.textAlign = align;
  if (italic) { ctx.translate(x, y); ctx.transform(1, 0, -0.2, 1, 0, 0); ctx.fillText(s, 0, 0); } else ctx.fillText(s, x, y);
  ctx.restore();
}
// neon: draw fn twice with a blue shadow, then a soft halo behind
function halo(ctx, x, y, r, a = 1) {
  if (a <= 0.01 || r <= 1) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(31,107,255,${0.55 * a})`); g.addColorStop(0.4, `rgba(31,107,255,${0.18 * a})`); g.addColorStop(1, 'rgba(31,107,255,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function neon(ctx, a, fn) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.shadowColor = C.glow; ctx.shadowBlur = 38; fn(); ctx.shadowBlur = 14; fn(); ctx.restore();
  ctx.save(); ctx.globalAlpha *= a; fn(); ctx.restore();
}
const mixC = (k) => { const a = [244, 245, 247], b = [31, 107, 255]; return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], k))).join(',')})`; };

// a thin arrow from a to b (screen), drawn on from q..p of its length; small open head at the tip
function arrow(ctx, x0, y0, x1, y1, p, q = 0, color = C.white, w = 3) {
  if (p - q < 0.02) return;
  const ax = lerp(x0, x1, q), ay = lerp(y0, y1, q), bx = lerp(x0, x1, p), by = lerp(y0, y1, p);
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  if (q < 0.9) { const d = Math.atan2(y1 - y0, x1 - x0), s = 13; ctx.beginPath(); ctx.moveTo(bx - Math.cos(d - 0.5) * s, by - Math.sin(d - 0.5) * s); ctx.lineTo(bx, by); ctx.lineTo(bx - Math.cos(d + 0.5) * s, by - Math.sin(d + 0.5) * s); ctx.stroke(); }
  ctx.restore();
}
// a polyline drawn from q..p of its length; dashed (marching) or solid; optional head
function path(ctx, pts, p, q = 0, { color = C.white, w = 3, dash = null, march = 0, head = true } = {}) {
  if (p - q < 0.01 || pts.length < 2) return;
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const tot = L[L.length - 1], a = q * tot, b = p * tot;
  const at = (s) => { let i = 1; while (i < L.length - 1 && L[i] < s) i++; const k = (s - L[i - 1]) / (L[i] - L[i - 1] || 1); return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]; };
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (dash) { ctx.setLineDash(dash); ctx.lineDashOffset = -march; }
  ctx.beginPath(); const n = 40; for (let i = 0; i <= n; i++) { const pt = at(lerp(a, b, i / n)); i ? ctx.lineTo(...pt) : ctx.moveTo(...pt); } ctx.stroke();
  ctx.setLineDash([]);
  if (head && q < 0.9) { const e = at(b), e0 = at(Math.max(a, b - 8)), d = Math.atan2(e[1] - e0[1], e[0] - e0[0]), s = 16; ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(e[0] + Math.cos(d) * 6, e[1] + Math.sin(d) * 6); ctx.lineTo(e[0] - Math.cos(d - 0.55) * s, e[1] - Math.sin(d - 0.55) * s); ctx.lineTo(e[0] - Math.cos(d + 0.55) * s, e[1] - Math.sin(d + 0.55) * s); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
// label + arrow pair: label appears, arrow draws to the target, both ease away
function callout(ctx, t, t0, t1, label, lx, ly, tx, ty) {
  const a = P(t, t0, t0 + 0.3) * (1 - P(t, t1, t1 + 0.3));
  if (a <= 0.01) return;
  txt(ctx, label, lx, ly, 34, 500, C.white, 'center', a);
  const dir = ty > ly ? 1 : -1;
  arrow(ctx, tx, ly + dir * 20, tx, ty, P(t, t0 + 0.1, t0 + 0.45, E.outCubic), P(t, t1 - 0.05, t1 + 0.3, E.inCubic));
}

// ------------------------------------------------------------------ Visualize Value primitives: thin white line, solid white = the one that matters
const LW = 3.5;
function lineOn(ctx, x0, y0, x1, y1, p, q = 0, w = LW, a = 1) {
  if (p - q < 0.003 || a <= 0.01) return; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = C.white; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(lerp(x0, x1, q), lerp(y0, y1, q)); ctx.lineTo(lerp(x0, x1, p), lerp(y0, y1, p)); ctx.stroke(); ctx.restore();
}
function circleOn(ctx, x, y, r, p, { fill = 0, w = LW, a = 1, start = -Math.PI / 2, col = C.blue } = {}) {
  if (r <= 0.5 || a <= 0.01) return; ctx.save(); ctx.globalAlpha *= a;
  if (fill > 0.001) { ctx.fillStyle = col; ctx.globalAlpha *= fill; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.globalAlpha /= fill; }
  if (p > 0.003) { ctx.strokeStyle = C.white; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, start, start + TAU * Math.min(1, p)); ctx.stroke(); }
  ctx.restore();
}
function rectOn(ctx, x, y, w, h, p, a = 1) {   // centred, drawn clockwise from top-left
  if (p <= 0.003 || a <= 0.01) return; const per = 2 * (w + h), L = p * per, pts = [[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2], [x - w / 2, y - h / 2]];
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = C.white; ctx.lineWidth = LW; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(...pts[0]); let acc = 0;
  for (let i = 1; i < 5; i++) { const seg = i % 2 ? w : h; if (acc + seg <= L) { ctx.lineTo(...pts[i]); acc += seg; } else { const f = (L - acc) / seg; ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); break; } }
  ctx.stroke(); ctx.restore();
}
function polyOn(ctx, pts, p, q = 0, w = LW, a = 1, dash = null) {
  p = clamp(p); q = clamp(q);
  if (p - q < 0.003 || a <= 0.01) return; const n = pts.length - 1, i0 = Math.floor(q * n), i1 = Math.ceil(p * n);
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = C.white; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); for (let i = i0; i <= i1; i++) { const f = i === i0 ? q * n - i0 : i === i1 ? 1 - (i1 - p * n) : 0; let pt = pts[i];
    if (i === i0 && i < n) pt = [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)];
    if (i === i1 && i > 0) pt = [lerp(pts[i - 1][0], pts[i][0], p * n - (i1 - 1)), lerp(pts[i - 1][1], pts[i][1], p * n - (i1 - 1))];
    i === i0 ? ctx.moveTo(...pt) : ctx.lineTo(...pt); }
  ctx.stroke(); ctx.restore();
}
function head(ctx, x, y, dir, a = 1, s = 16) { if (a <= 0.01) return; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = C.white; ctx.lineWidth = LW; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - Math.cos(dir - 0.5) * s, y - Math.sin(dir - 0.5) * s); ctx.lineTo(x, y); ctx.lineTo(x - Math.cos(dir + 0.5) * s, y - Math.sin(dir + 0.5) * s); ctx.stroke(); ctx.restore(); }
function cap(ctx, s, x, y, a = 1, size = 26, align = 'center') {   // small spaced uppercase label
  if (a <= 0.01) return; ctx.save(); ctx.globalAlpha *= a; ctx.font = font(size, 500, UI); ctx.fillStyle = C.white; ctx.textAlign = align; ctx.letterSpacing = `${size * 0.18}px`; ctx.fillText(s.toUpperCase(), x, y); ctx.restore();
}
const bez = (a, c, b, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const k = i / n, u = 1 - k; return [u * u * a[0] + 2 * u * k * c[0] + k * k * b[0], u * u * a[1] + 2 * u * k * c[1] + k * k * b[1]]; });
const along = (pts, k) => { const n = pts.length - 1, f = clamp(k) * n, i = Math.min(n - 1, Math.floor(f)); return [lerp(pts[i][0], pts[i + 1][0], f - i), lerp(pts[i][1], pts[i + 1][1], f - i)]; };
function background(ctx) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, DW, DH); }

// ------------------------------------------------------------------ scenes (centre of the panel ~ (540, Y(470)))
// A — transfer: the square (credit) drains into the circle (bank); then today -> next day
function sA(ctx, t) {
  if (t < 1.1 || t > 7.2) return;
  const ex = outK(t, 6.75), up = P(t, 4.45, 5.0, E.inOutCubic), cy = Y(lerp(430, 250, up)), sq = [300, cy], ci = [780, cy], R = 120;
  const drain = P(t, 2.4, 4.05, E.inOutSine);
  const kS = pop(t, 1.3) * ex, kC = pop(t, 1.45) * ex;
  // square: outline + fill level
  if (kS > 0.01) {
    ctx.save(); ctx.translate(...sq); ctx.scale(kS, kS);
    const lvl = 1 - drain; ctx.fillStyle = C.blue; ctx.fillRect(-R, R - 2 * R * lvl * P(t, 1.5, 1.9), 2 * R, 2 * R * lvl * P(t, 1.5, 1.9));
    ctx.restore(); rectOn(ctx, sq[0], sq[1], 2 * R * kS, 2 * R * kS, P(t, 1.3, 1.7) * ex);
  }
  // circle: fills from the bottom as the square drains
  if (kC > 0.01) {
    const rr = R * kC * (1 + 0.07 * wobble(Math.max(0, t - 4.1), 3, 6) * (t > 4.1 ? 1 : 0));
    ctx.save(); ctx.beginPath(); ctx.arc(ci[0], ci[1], rr, 0, TAU); ctx.clip(); ctx.fillStyle = C.blue; const h = 2 * rr * drain; ctx.fillRect(ci[0] - rr, ci[1] + rr - h, 2 * rr, h); ctx.restore();
    circleOn(ctx, ci[0], ci[1], rr, P(t, 1.45, 1.85) * ex);
  }
  // the pipe + packets
  const x0 = sq[0] + R + 30, x1 = ci[0] - R - 30;
  lineOn(ctx, x0, cy, x1, cy, P(t, 2.2, 2.55, E.outCubic) * ex, P(t, 4.05, 4.4, E.inCubic));
  for (let i = 0; i < 4; i++) { const k = prog(t, 2.5 + i * 0.35, 3.1 + i * 0.35); if (k > 0 && k < 1) circleOn(ctx, lerp(x0, x1, E.inOutSine(k)), cy, 9, 0, { fill: 1 }); }
  if (t > 2.6 && t < 4.4) head(ctx, x1, cy, 0, P(t, 2.5, 2.6) * (1 - P(t, 4.05, 4.3)));
  // today -> next day
  const ty = Y(690), a = P(t, 4.7, 5.1) * ex, xa = 380, xb = 700;
  lineOn(ctx, 160, ty, 920, ty, P(t, 4.6, 5.1, E.inOutCubic) * ex, 0, 2.5, 0.6);
  [xa, xb].forEach((x, i) => lineOn(ctx, x, ty - 18, x, ty + 18, P(t, 4.9 + i * 0.1, 5.1 + i * 0.1) * ex));
  cap(ctx, 'Today', xa, ty + 70, a); cap(ctx, 'Next day', xb, ty + 70, P(t, 5.0, 5.3) * ex);
  const hop = bez([xa, ty - 40], [(xa + xb) / 2, ty - 220], [xb, ty - 40]);
  polyOn(ctx, hop, P(t, 5.6, 6.2, E.inOutSine) * ex, P(t, 6.3, 6.7, E.inOutSine), 2.5, 0.8, [8, 10]);
  const kd = P(t, 6.0, 6.48, E.inOutCubic), dp = along(hop, kd);
  if (t > 5.3) circleOn(ctx, dp[0], dp[1] + (kd >= 1 ? 0 : 0), 22 * clamp(pop(t, 5.3)) * ex, 0, { fill: 1 });
}
// B — a whole circle; a thin wedge (1%, then 5%) comes out; it slides back: 0%
function sB(ctx, t) {
  if (t < 6.95 || t > 12.6) return;
  const cx = 540, cy = Y(470), R = 220 * pop(t, 7.1, { stiffness: 180, damping: 17 }) * outK(t, 12.15, 0.4);
  if (R <= 1) return;
  const pct = t < 9.28 ? 0 : t < 9.6 ? 0.01 : lerp(0.01, 0.05, P(t, 9.6, 9.94, E.inOutSine));
  const back = P(t, 10.95, 11.35, E.inOutCubic), wedge = pct * (1 - back), out = 26 * P(t, 9.28, 9.5, E.outBack) * (1 - back);
  const a0 = -Math.PI / 2 + 0.45, a1 = a0 + wedge * TAU;
  ctx.save(); ctx.fillStyle = C.blue;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a1, a0 + TAU); ctx.closePath(); ctx.fill();
  if (wedge > 0.0005) { const m = (a0 + a1) / 2; ctx.translate(Math.cos(m) * out, Math.sin(m) * out); ctx.fillStyle = C.maroon; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  circleOn(ctx, cx, cy, R + 26, P(t, 7.4, 8.1, E.inOutSine) * (1 - P(t, 12.0, 12.3)), { w: 2, a: 0.5 });
  // leader + label for the fee
  const m = (a0 + a1) / 2, lx = cx + Math.cos(m) * (R + 40), ly = cy + Math.sin(m) * (R + 40), la = P(t, 9.45, 9.75) * (1 - P(t, 10.9, 11.1));
  lineOn(ctx, lx, ly, lx + 120, ly - 80, la, 0, 2.5); cap(ctx, t < 9.6 ? '1%' : '1–5%', lx + 135, ly - 95, la, 36, 'left');
  cap(ctx, 'Flat fee', cx, Y(860), P(t, 8.0, 8.4) * (1 - P(t, 10.9, 11.1)), 30);
  const z = P(t, 11.3, 11.6) * outK(t, 12.1);
  if (z > 0.01) { ctx.save(); ctx.globalAlpha = z; ctx.font = font(110, 600, UI); ctx.fillStyle = C.bg; ctx.textAlign = 'center'; ctx.fillText('0%', cx, cy + 38); ctx.restore(); }
}
// C — a distribution of term lengths, 6 to 24 months; the peak sits at 18
function sC(ctx, t) {
  if (t < 12.2 || t > 18.7) return;
  const ex = outK(t, 18.25), base = Y(700), x0 = 140, x1 = 940, xm = (m) => lerp(x0, x1, (m - 6) / 18);
  lineOn(ctx, 540 - 450 * P(t, 12.35, 12.95, E.inOutCubic), base, 540 + 450 * P(t, 12.35, 12.95, E.inOutCubic), base, ex, 0, 2.5, 0.7);
  // skewed bell: peak at 18
  const curve = Array.from({ length: 81 }, (_, i) => { const m = 6 + (i / 80) * 18, s = m < 18 ? 4.2 : 2.6, v = Math.exp(-((m - 18) ** 2) / (2 * s * s)); return [xm(m), base - v * 380]; });
  polyOn(ctx, curve, P(t, 13.5, 14.3, E.inOutSine) * ex, 0, LW, 1);
  cap(ctx, '6', xm(6), base + 60, P(t, 13.5, 13.8) * ex, 30); cap(ctx, '24', xm(24), base + 60, P(t, 14.2, 14.5) * ex, 30);
  cap(ctx, 'Months at 0%', 540, Y(140), P(t, 12.6, 13.0) * (1 - P(t, 16.6, 16.9)), 28);
  const k = P(t, 16.95, 17.3, E.outCubic);
  lineOn(ctx, xm(18), base, xm(18), base - 380, k * ex, 0, 2.5, 0.8);
  circleOn(ctx, xm(18), base - 380, 18 * clamp(pop(t, 17.14)) * ex, 0, { fill: 1, col: C.green });
  cap(ctx, '18', xm(18), base - 420, P(t, 17.2, 17.5) * ex, 34);
}
// D — a cycle: one orbit every 6 months, a second orbit for a second person; each repeat stacks a bar
function sD(ctx, t) {
  if (t < 18.4 || t > 24.5) return;
  const ex = outK(t, 23.95), cx = 380, cy = Y(470), R1 = 170, R2 = 240;
  circleOn(ctx, cx, cy, R1, P(t, 18.9, 19.6, E.inOutSine) * ex);
  circleOn(ctx, cx, cy, R2, P(t, 20.72, 21.3, E.inOutSine) * ex, { w: 2.5, a: 0.75 });
  const lap1 = (t - 19.4) * 1.15, lap2 = (t - 20.9) * 0.95;
  if (t > 19.4) { const a = -Math.PI / 2 + lap1 * TAU; circleOn(ctx, cx + Math.cos(a) * R1, cy + Math.sin(a) * R1, 16 * clamp(pop(t, 19.4)) * ex, 0, { fill: 1, col: C.teal }); }
  if (t > 20.9) { const a = -Math.PI / 2 + lap2 * TAU; circleOn(ctx, cx + Math.cos(a) * R2, cy + Math.sin(a) * R2, 16 * clamp(pop(t, 20.9)) * ex, 0, { fill: 1, col: C.green }); }
  cap(ctx, '+1', cx, cy - R2 - 22, P(t, 20.72, 21.0) * ex, 24);
  // compounding bars
  const reps = [21.45, 22.3, 23.08];
  lineOn(ctx, 690, Y(700), 980, Y(700), P(t, 21.2, 21.5) * ex, 0, 2.5, 0.6);
  reps.forEach((r, i) => { const h = (120 + i * 110) * P(t, r, r + 0.35, E.outBack) * ex; if (h > 1) { ctx.save(); ctx.fillStyle = [C.blue, C.teal, C.green][i]; ctx.fillRect(715 + i * 90, Y(700) - h, 56, h); ctx.restore(); } });
  cap(ctx, 'Every 6 months', 540, Y(860), P(t, 19.3, 19.7) * ex, 28);
}
// E — a pile of paperwork stands between you and the capital; the line has to climb over it.
//     "without any documentation": the pile drops away sheet by sheet and the line straightens through.
function sE(ctx, t) {
  if (t < 32.3 || t > 36.6) return;
  const ex = outK(t, 35.85, 0.3), A = [170, Y(560)], B = [910, Y(560)], cx = 540, sw = 170, sh = 46, n = 6;
  circleOn(ctx, A[0], A[1], 16 * clamp(pop(t, 32.6)) * ex, 0, { fill: 1 });
  circleOn(ctx, B[0], B[1], 22 * clamp(pop(t, 32.7)) * ex, 1, { fill: P(t, 35.5, 35.8), col: C.teal });
  // the pile: six sheets stacked, each with two text lines; they fall top-first on "documentation"
  for (let i = 0; i < n; i++) {
    const tin = 32.8 + i * 0.07, tout = 34.8 + (n - 1 - i) * 0.08, f = prog(t, tout, tout + 0.45);
    const y = A[1] - sh / 2 - i * (sh + 6) + f * f * 520, k = P(t, tin, tin + 0.25) * (1 - P(t, tout + 0.25, tout + 0.45)) * ex;
    if (k <= 0.01) continue;
    ctx.save(); ctx.translate(cx, y); ctx.rotate(f * (i % 2 ? 0.5 : -0.5)); ctx.globalAlpha = k;
    rectOn(ctx, 0, 0, sw, sh, 1); lineOn(ctx, -sw / 2 + 22, -6, sw / 2 - 40, -6, 1, 0, 2.5, 0.6); lineOn(ctx, -sw / 2 + 22, 9, sw / 2 - 80, 9, 1, 0, 2.5, 0.6);
    ctx.restore();
  }
  // the path: up and over the pile, morphing to a straight line once the pile is gone
  const top = A[1] - n * (sh + 6) - 40, flat = P(t, 35.05, 35.55, E.inOutCubic);
  const detour = [[A[0] + 24, A[1]], [cx - sw / 2 - 40, A[1]], [cx - sw / 2 - 40, top], [cx + sw / 2 + 40, top], [cx + sw / 2 + 40, A[1]], [B[0] - 30, B[1]]];
  const pts = detour.map(([x, y]) => [x, lerp(y, A[1], flat)]);
  const dense = []; for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < 12; j++) { const f = j / 12; dense.push([lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]); } dense.push(pts[pts.length - 1]);
  polyOn(ctx, dense, P(t, 33.3, 34.2, E.inOutSine) * ex, 0, LW + flat * 1.5);
  if (t > 34.2) head(ctx, B[0] - 30, B[1], 0, ex);
  cap(ctx, 'Paperwork', cx, A[1] + 70, P(t, 33.0, 33.3) * (1 - P(t, 34.8, 35.0)) * ex, 26);
  cap(ctx, 'Direct', cx, A[1] + 70, P(t, 35.5, 35.8) * ex, 26);
  cap(ctx, 'Up to 150,000', B[0] + 25, B[1] - 50, P(t, 33.6, 34.0) * ex, 24, 'right');
}
// F — one becomes thirteen in ten days; every one drops a bonus into a single pool
function sF(ctx, t) {
  if (t < 35.9 || t > 44.9) return;
  const ex = outK(t, 44.35), O = [540, Y(560)], pool = [540, Y(780)];
  const pos = (i) => { const a = Math.PI * (1.08 + (i / 12) * 0.84); return [O[0] + Math.cos(a) * 360, O[1] + Math.sin(a) * 340]; };
  const count = Math.min(13, Math.max(0, Math.floor(prog(t, 36.2, 36.45) * 13) + (t > 36.2 ? 1 : 0)));
  circleOn(ctx, O[0], O[1], 16 * clamp(pop(t, 36.15)) * ex, 0, { fill: 1 });
  for (let i = 0; i < 13; i++) {
    if (i >= count) continue; const k = P(t, 36.2 + i * 0.02, 36.5 + i * 0.02, E.outCubic), [x, y] = pos(i);
    lineOn(ctx, O[0], O[1], lerp(O[0], x, k), lerp(O[1], y, k), ex, 0, 2, 0.45);
    const wave = Math.max(0, Math.sin(Math.PI * prog(t, 40.5 + i * 0.04, 41.0 + i * 0.04)));
    circleOn(ctx, lerp(O[0], x, k), lerp(O[1], y, k) - wave * 14, 20 * ex, 1, { fill: Math.max(wave, 0.85 * P(t, 36.4 + i * 0.03, 36.7 + i * 0.03)), col: [C.blue, C.teal, C.green, C.maroon][i % 4] });
    // bonus drop: a small dot falls from each into the pool
    const b = prog(t, 43.58 + i * 0.056, 44.0 + i * 0.056);
    if (b > 0 && b < 1) circleOn(ctx, lerp(x, pool[0], E.inCubic(b)), lerp(y, pool[1], E.inCubic(b)), 7, 0, { fill: 1, col: C.gold });
  }
  const pr = 20 + 34 * P(t, 43.8, 44.4, E.outBack);
  circleOn(ctx, pool[0], pool[1], pr * clamp(pop(t, 43.4)) * ex, 1, { fill: P(t, 43.7, 44.4), col: C.gold });
  // ten days: a bracket of ten ticks
  const dOut = 1 - P(t, 42.8, 43.2);
  lineOn(ctx, 300, Y(760), 780, Y(760), P(t, 37.8, 38.1) * ex * dOut, 0, 2, 0.5);
  for (let d = 0; d < 10; d++) lineOn(ctx, 315 + d * 50, Y(745), 315 + d * 50, Y(775), P(t, 37.95 + d * 0.059, 38.05 + d * 0.059) * ex * dOut);
  cap(ctx, '10 days', 540, Y(830), P(t, 38.5, 38.8) * ex * dOut, 26);
  cap(ctx, '13 cards', 540, Y(150), P(t, 36.4, 36.7) * ex, 30);
  cap(ctx, 'Bonus on each', 540, Y(880), P(t, 43.9, 44.2) * ex, 24);
}
// G — cash is linear; travel compounds: 7x to 21x
function sG(ctx, t) {
  if (t < 49.5 || t > 55.9) return;
  const ex = outK(t, 55.25), o = [170, Y(780)], X1 = 940, Y1 = Y(140);
  lineOn(ctx, o[0], o[1], o[0], Y1, P(t, 49.85, 50.3, E.inOutCubic) * ex, 0, 2.5, 0.7); lineOn(ctx, o[0], o[1], X1, o[1], P(t, 49.95, 50.4, E.inOutCubic) * ex, 0, 2.5, 0.7);
  lineOn(ctx, o[0], o[1], X1, o[1] - 90, P(t, 50.5, 51.2, E.inOutSine) * ex);
  cap(ctx, 'Cash', X1, o[1] - 120, P(t, 51.0, 51.3) * ex, 26, 'right');
  const curve = Array.from({ length: 60 }, (_, i) => { const k = i / 59; return [lerp(o[0], X1, k), o[1] - (Math.exp(k * 3.2) - 1) / (Math.exp(3.2) - 1) * (o[1] - Y1 - 40)]; });
  const kc = P(t, 51.94, 53.3, E.inOutSine);
  polyOn(ctx, curve, kc * ex, 0, LW + 1.5);
  if (kc > 0.02) { const e = along(curve, kc); circleOn(ctx, e[0], e[1], 14 * ex, 0, { fill: 1, col: C.teal }); }
  cap(ctx, 'Travel', 700, Y(300), P(t, 52.6, 52.9) * ex, 26, 'right');
  if (t > 53.3) { const v = Math.round(lerp(7, 21, P(t, 53.45, 53.98, E.inOutSine))); ctx.save(); ctx.globalAlpha = ex; ctx.font = font(96 * (1 + 0.05 * wobble(Math.max(0, t - 53.98), 3, 6) * (t > 53.98 ? 1 : 0)), 600, UI); ctx.fillStyle = C.white; ctx.textAlign = 'left'; ctx.fillText(`${v}x`, o[0] + 60, Y1 + 80); ctx.restore(); }
}
function endCard(ctx, t, IMG) {
  if (t < 56.6) return;
  const k = clamp(pop(t, 56.95, { stiffness: 200, damping: 16 }));
  circleOn(ctx, 540, 760, 300, P(t, 56.8, 57.6, E.inOutSine), { w: 2.5, a: 0.6 });
  if (IMG.badge && k > 0.01) { const s = 440 * lerp(0.8, 1, k), ar = IMG.badge.height / IMG.badge.width; ctx.save(); ctx.globalAlpha = clamp(k * 2); ctx.drawImage(IMG.badge, 540 - s / 2, 760 - s * ar / 2, s, s * ar); ctx.restore(); }
  cap(ctx, 'Learn the playbook', 540, 1200, P(t, 57.3, 57.7), 40);
  cap(ctx, 'creditcounselelite.com', 540, 1270, P(t, 57.6, 58.0) * 0.8, 24);
  txt(ctx, 'Education and coaching. Not a lender. Individual results vary.', 540, 1680, 22, 500, 'rgba(244,245,247,0.55)', 'center', P(t, 57.9, 58.3));
}


// ------------------------------------------------------------------ footage test: VSL Cutdown #6 "Objection Killer" (film t = source t - 2.75)
function question(ctx, t, a, b, s, y = Y(120)) { const k = P(t, a, a + 0.3) * (1 - P(t, b, b + 0.3)); txt(ctx, s, 540, y + (1 - k) * 20, 52, 600, C.white, 'center', k); }
function shield(ctx, x, y, s, p, a = 1) { const pts = [[x, y - 150 * s], [x + 125 * s, y - 100 * s], [x + 110 * s, y + 40 * s], [x, y + 150 * s], [x - 110 * s, y + 40 * s], [x - 125 * s, y - 100 * s], [x, y - 150 * s]]; polyOn(ctx, pts, p, 0, LW, a); }
function bankShape(ctx, x, y, s, p, a = 1) { polyOn(ctx, [[x - 120 * s, y - 50 * s], [x, y - 130 * s], [x + 120 * s, y - 50 * s], [x - 120 * s, y - 50 * s]], clamp(p * 2), 0, LW, a); rectOn(ctx, x, y + 40 * s, 200 * s, 150 * s, clamp(p * 2 - 1), a); }
// solid dot that travels a polyline (the thing that matters moves; everything else is outline)
function dotAt(ctx, pts, k, r = 12, a = 1) { if (k <= 0 || k >= 1 || a <= 0.01) return; const [x, y] = along(pts, k); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore(); }
function ripple(ctx, x, y, t, t0, r0 = 20, r1 = 120, a = 1) { const f = prog(t, t0, t0 + 0.7); if (f <= 0 || f >= 1) return; circleOn(ctx, x, y, lerp(r0, r1, E.outCubic(f)), 1, { w: 2.5, a: (1 - f) * a }); }
function check(ctx, x, y, s, p, a = 1, col = null) { const c0 = C.white; if (col) C.white = col; polyOn(ctx, [[x - 22 * s, y], [x - 6 * s, y + 16 * s], [x + 24 * s, y - 18 * s]], p, 0, LW + 1.5, a); C.white = c0; }
// Q1 0-6: will this hurt my credit? -> a solid circle (you) under pressure: lines press in from all sides; a ring closes
// around it and the lines deflect (protected). Then: scattered dots snap into order (optimize the profile) before a line
// is allowed out to three empty circles (applications). Shapes and motion only.
function q1(ctx, t) {
  if (t > 6.4) return; const ex = outK(t, 6.0);
  question(ctx, t, 0.1, 5.8, 'Will this hurt my credit?');
  const cx = 540, cy = Y(520), shrink = P(t, 3.0, 3.5, E.inOutCubic), X0 = lerp(cx, 260, shrink);
  const kc = clamp(pop(t, 0.35)) * ex, ring = P(t, 1.75, 2.35, E.inOutCubic);
  // pressure: 12 lines move in toward the circle; after the ring closes they bounce back out
  const g = 1 - shrink;
  if (g > 0.01) for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + 0.13, inn = P(t, 0.6 + (i % 3) * 0.08, 1.6, E.inOutSine), back = P(t, 2.3, 2.9, E.outBack);
    const r0 = lerp(340, 200, inn) + back * 120, r1 = r0 + 80;
    lineOn(ctx, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.72, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.72, 1, 0, LW, ex * g * (1 - P(t, 2.6, 3.0)));
  }
  const shake = t > 1.0 && t < 1.75 ? Math.sin(t * 60) * 5 * (1 - ring) : 0;
  circleOn(ctx, X0 + shake * g, cy, lerp(110, 120, shrink) * kc, 1, { fill: g * ex, col: C.white, a: ex });
  circleOn(ctx, X0, cy, 175, ring, { w: LW + 2, a: ex * g, start: Math.PI / 2 });
  if (t > 2.35) ripple(ctx, X0, cy, t, 2.35, 175, 300, ex * g);
  cap(ctx, 'Protected', X0, cy + 250, P(t, 2.4, 2.7) * g * ex, 26);
  // optimize: 9 dots inside the circle jump from scattered to a neat 3x3
  if (t > 3.0) {
    const ord = P(t, 3.6, 4.4, E.inOutCubic), r = mulberry32(31);
    for (let i = 0; i < 9; i++) { const sx = X0 + (r() - 0.5) * 150, sy = cy + (r() - 0.5) * 150, gx = X0 + ((i % 3) - 1) * 52, gy = cy + (Math.floor(i / 3) - 1) * 52;
      ctx.save(); ctx.globalAlpha = ex * P(t, 3.2, 3.45); ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(lerp(sx, gx, ord), lerp(sy, gy, ord), 12, 0, TAU); ctx.fill(); ctx.restore(); }
    cap(ctx, 'Profile first', X0, cy + 200, P(t, 3.6, 3.9) * ex, 24);
    if (t > 4.4) ripple(ctx, X0, cy, t, 4.4, 120, 220, ex);
  }
  // only then: the line goes out and the three circles light, one by one
  path(ctx, [[X0 + 140, cy], [700, cy]], P(t, 4.75, 5.15, E.outCubic) * ex);
  [[810, cy - 150], [860, cy], [810, cy + 150]].forEach(([x, y], i) => {
    circleOn(ctx, x, y, 44, P(t, 3.9 + i * 0.1, 4.3 + i * 0.1), { a: ex * 0.35, w: 2.5 });
    const on = P(t, 5.2 + i * 0.18, 5.4 + i * 0.18); circleOn(ctx, x, y, 44, on, { a: ex, fill: on >= 1 ? ex : 0, col: C.white });
  });
  cap(ctx, 'Then applications', 830, cy + 250, P(t, 5.3, 5.6) * ex, 24);
}
// Q2 7-14.8: is this a loan? -> no: the money line from us to you is cut; we teach (a ring passes to you);
// you go directly to the banks; of the offers, the best terms is the one solid bar
function q2(ctx, t) {
  if (t < 6.9 || t > 15.2) return; const ex = outK(t, 14.75);
  question(ctx, t, 7.0, 14.6, 'Is this a loan?');
  const US = [540, Y(320)], YOU = [210, Y(600)], BANK = [870, Y(600)];
  const ku = clamp(pop(t, 7.3)) * ex, kyou = clamp(pop(t, 7.45)) * ex;
  circleOn(ctx, US[0], US[1], 84 * ku, 1, { a: ex }); cap(ctx, 'Us', US[0], US[1] - 110, P(t, 7.4, 7.7) * ex, 24);
  circleOn(ctx, YOU[0], YOU[1], 60 * kyou, 1, { a: ex, fill: P(t, 10.6, 11.0) * ex, col: C.white }); cap(ctx, 'You', YOU[0], YOU[1] + 90, P(t, 7.6, 7.9) * ex, 24);
  // the loan line: money (solid dot) would flow us -> you; on "no" the line breaks and the dot drops away
  const L1 = [[US[0] - 66, US[1] + 52], [YOU[0] + 48, YOU[1] - 38]], cut = P(t, 8.1, 8.35, E.outCubic), drop = P(t, 8.35, 9.0, E.inCubic);
  const lineA = 1 - P(t, 9.2, 9.6);
  if (t > 7.6) {
    const mx = lerp(L1[0][0], L1[1][0], 0.5), my = lerp(L1[0][1], L1[1][1], 0.5), gap = 34 * cut, dx = (L1[1][0] - L1[0][0]), dy = (L1[1][1] - L1[0][1]), L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    lineOn(ctx, L1[0][0], L1[0][1], mx - ux * gap, my - uy * gap, P(t, 7.6, 8.0), 0, LW, ex * lineA);
    lineOn(ctx, mx + ux * gap, my + uy * gap, L1[1][0], L1[1][1], P(t, 7.75, 8.0), 0, LW, ex * lineA);
    cap(ctx, 'Loan', mx + 60, my - 30, P(t, 7.7, 7.9) * (1 - cut) * ex, 24, 'left');
    const fl = ((t - 7.6) * 0.9) % 1; if (t < 8.1) dotAt(ctx, L1, fl, 11, ex);
    if (t > 8.1 && drop < 1) { ctx.save(); ctx.globalAlpha = ex * (1 - drop); ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(mx, my + drop * 300, 11, 0, TAU); ctx.fill(); ctx.restore(); }
  }
  // teach: three rings ripple from us to you; you turn solid (you know how)
  if (t > 10.2 && t < 11.2) for (let i = 0; i < 3; i++) { const k = prog(t, 10.25 + i * 0.15, 10.85 + i * 0.15); if (k > 0 && k < 1) { const [x, y] = along([US, YOU], E.inOutSine(k)); circleOn(ctx, x, y, 26, 1, { w: 2.5, a: Math.sin(Math.PI * k) * ex }); } }
  cap(ctx, 'We teach', (US[0] + YOU[0]) / 2 - 40, (US[1] + YOU[1]) / 2 - 30, P(t, 10.3, 10.6) * (1 - P(t, 11.6, 11.9)) * ex, 24, 'right');
  // direct: you -> the banks, a straight line under us; money flows bank -> you
  const kb = clamp(pop(t, 11.9)) * ex;
  if (t > 11.8) { const bk = BANK; rectOn(ctx, bk[0], bk[1], 150 * clamp(kb), 150 * clamp(kb), P(t, 11.9, 12.4), ex); cap(ctx, 'The banks', bk[0], bk[1] + 125, P(t, 12.4, 12.7) * ex, 24); }
  const D = [[YOU[0] + 76, YOU[1]], [BANK[0] - 90, BANK[1]]];
  path(ctx, D, P(t, 11.4, 12.0, E.inOutCubic) * ex, 0, { head: true });
  cap(ctx, 'Directly', 540, YOU[1] - 26, P(t, 11.8, 12.1) * (1 - P(t, 13.2, 13.4)) * ex, 24);
  if (t > 12.6) for (let i = 0; i < 3; i++) { const f = ((t - 12.6) * 0.8 + i / 3) % 1; dotAt(ctx, [D[1], D[0]], f, 9, ex * P(t, 12.6, 12.9)); }
  // best terms: offers as bars; the shortest (lowest cost) fills solid
  const bars = [300, 420, 180, 360], bx0 = 540 - 210;
  bars.forEach((w, i) => { const y = Y(760 + i * 40), k = P(t, 13.4 + i * 0.07, 13.75 + i * 0.07, E.outCubic) * ex; if (i === 2) { rectOn(ctx, bx0 + w / 2, y, w, 22, k, ex); if (t > 13.9) { ctx.save(); ctx.globalAlpha = ex; ctx.fillStyle = C.white; ctx.fillRect(bx0, y - 11, w * P(t, 13.9, 14.2, E.outCubic), 22); ctx.restore(); ripple(ctx, bx0 + w / 2, y, t, 14.2, 20, 90, ex); } } else rectOn(ctx, bx0 + w / 2, y, w, 22, k, ex * 0.45); });
}
// Q3 15.6-19.6: I'm too busy -> 30 minutes a day: a day as 48 half-hour squares; only one is filled (the odd one out)
function q3(ctx, t) {
  if (t < 15.5 || t > 20.4) return; const ex = outK(t, 19.95);
  question(ctx, t, 15.6, 19.8, "I'm too busy.");
  const cols = 8, rows = 6, sz = 70, gap = 22, gw = cols * sz + (cols - 1) * gap, x0 = 540 - gw / 2 + sz / 2, y0 = Y(300);
  const pick = [5, 2];   // the one half hour
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c, x = x0 + c * (sz + gap), y = y0 + r * (sz + gap), k = P(t, 16.0 + i * 0.018, 16.3 + i * 0.018) * ex;
    const odd = c === pick[0] && r === pick[1], f = odd ? P(t, 17.3, 17.6, E.outCubic) : 0;
    const dim = odd ? 1 : 1 - 0.55 * P(t, 17.4, 17.8);
    rectOn(ctx, x, y, sz, sz, k, ex * dim);
    if (f > 0.01) { const s2 = sz * (1 + 0.12 * wobble(Math.max(0, t - 17.6), 3, 6)); ctx.save(); ctx.globalAlpha = ex; ctx.fillStyle = C.white; ctx.fillRect(x - s2 / 2 * f, y - s2 / 2 * f, s2 * f, s2 * f); ctx.restore(); }
  }
  const ox = x0 + pick[0] * (sz + gap), oy = y0 + pick[1] * (sz + gap);
  lineOn(ctx, ox, oy - sz / 2 - 14, ox, y0 - sz / 2 - 44, P(t, 17.6, 17.85, E.outCubic) * ex, 0, 2.5, ex);
  txt(ctx, '30 min', ox, y0 - sz / 2 - 60, 46, 600, C.white, 'center', P(t, 17.7, 18.0) * ex);
  cap(ctx, 'A day', 540, y0 + rows * (sz + gap) + 20, P(t, 16.8, 17.1) * ex, 24);
}
// a small strategy map (three nodes on a zig-zag path) drawn at x,y with scale s
function plan(ctx, x, y, s, p, a = 1) {
  const pts = [[x - 90 * s, y + 40 * s], [x - 30 * s, y - 30 * s], [x + 30 * s, y + 30 * s], [x + 90 * s, y - 40 * s]];
  polyOn(ctx, pts, p, 0, LW, a); pts.forEach(([px, py], i) => { if (p * 3 >= i) { ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(px, py, (i === 3 ? 11 : 7) * s, 0, TAU); ctx.fill(); ctx.restore(); } });
}
// Q4 20.5-29: just a sales pitch? -> a real strategy session: two seats at a table, a plan drawn between them;
// whether you work with us or not, the plan goes with you down both roads
function q4(ctx, t) {
  if (t < 20.4 || t > 29.4) return; const ex = outK(t, 28.95);
  question(ctx, t, 20.5, 28.8, 'Is the call a sales pitch?');
  const f1 = outK(t, 24.25);
  if (f1 > 0.01) {
    // the pitch: a row of arrows all pushing one way into a small circle (one-way pressure), then crossed out
    const mk = P(t, 20.9, 21.3) * (1 - P(t, 22.3, 22.6)), mx = 540, my = Y(470), push = (t - 20.9) * 1.6 % 1;
    for (let r = -1; r <= 1; r++) for (let i = 0; i < 3; i++) { const f = (push + i / 3 + r * 0.17 + 1) % 1, x0 = lerp(180, 560, f), yy = my + r * 70, al = mk * f1 * (0.35 + 0.65 * Math.sin(Math.PI * f)); lineOn(ctx, x0, yy, x0 + 100, yy, 1, 0, LW + 1, al); head(ctx, x0 + 100, yy, 0, al, 20); }
    circleOn(ctx, 760, my, 70, P(t, 20.9, 21.2), { a: mk * f1 });
    const sl = 220;   // cross centred on the whole figure (arrows 180..680 + circle 690..830 -> centre ~505)
    lineOn(ctx, 505 - sl * 1.4, my - sl * 0.75, 505 + sl * 1.4, my + sl * 0.75, P(t, 21.8, 22.05, E.outCubic), 0, 7, mk * f1);
    // the session: two seats, a table, and a plan that draws itself between them
    const sk = P(t, 22.4, 22.8) * f1;
    circleOn(ctx, 300, Y(430), 60 * clamp(pop(t, 22.45)), P(t, 22.45, 22.8), { a: sk }); circleOn(ctx, 780, Y(430), 60 * clamp(pop(t, 22.6)), P(t, 22.6, 22.95), { a: sk });
    lineOn(ctx, 220, Y(560), 860, Y(560), P(t, 22.8, 23.2, E.outCubic), 0, LW, sk);
    plan(ctx, 540, Y(440), 1.0, P(t, 23.0, 23.9, E.inOutSine), sk);
    cap(ctx, 'Strategy session', 540, Y(660), P(t, 23.3, 23.6) * f1, 26);
  }
  if (t > 24.2) {
    const st = [170, Y(560)], fk = [470, Y(560)];
    const up = bez(fk, [660, Y(560)], [840, Y(360)]), dn = bez(fk, [660, Y(560)], [840, Y(760)]);
    lineOn(ctx, st[0], st[1], fk[0], fk[1], P(t, 24.35, 24.8, E.outCubic), 0, LW, ex);
    polyOn(ctx, up, P(t, 25.0, 25.6, E.inOutSine), 0, LW, ex); polyOn(ctx, dn, P(t, 25.6, 26.2, E.inOutSine), 0, LW, ex);
    // the plan rides from the session to the fork, then a copy goes down each road
    const ride = P(t, 24.3, 24.9, E.inOutCubic), pr = [lerp(540, fk[0] - 60, ride), lerp(Y(440), fk[1] - 80, ride)];
    if (t < 25.2) plan(ctx, pr[0], pr[1], lerp(1, 0.55, ride), 1, ex);
    const r1 = 0.55 * P(t, 25.2, 25.8, E.inOutSine), r2 = 0.55 * P(t, 25.9, 26.5, E.inOutSine);
    if (t >= 25.2) { const [x, y] = along(up, r1); plan(ctx, x - 40, y - 60, 0.5, 1, ex); }
    if (t >= 25.9) { const [x, y] = along(dn, r2); plan(ctx, x + 40, y - 60, 0.5, 1, ex); }
    circleOn(ctx, 840, Y(360), 26, P(t, 25.55, 25.8), { a: ex, fill: P(t, 25.8, 26.0) * ex, col: C.white }); circleOn(ctx, 840, Y(760), 26, P(t, 26.15, 26.4), { a: ex, fill: P(t, 26.4, 26.6) * ex, col: C.white });
    ripple(ctx, 840, Y(360), t, 25.8, 26, 90, ex); ripple(ctx, 840, Y(760), t, 26.4, 26, 90, ex);
    circleOn(ctx, st[0], st[1], 16, 1, { fill: ex, col: C.white, a: ex });
    cap(ctx, 'Work with us', 840, Y(300), P(t, 25.4, 25.7) * ex, 22); cap(ctx, 'Or not', 840, Y(840), P(t, 26.1, 26.4) * ex, 22);
    cap(ctx, 'The path is yours', 300, Y(700), P(t, 26.7, 27.0) * ex, 22);
  }
}
// close 26.9-34.4: a road of ten stops; you've filled nine (this far); you're serious: your dot grows solid;
// don't stall now: it launches to the last stop; then an arrow points down to the link
function q5(ctx, t) {
  if (t < 29.2) return;
  const y = Y(520), xs = (i) => 140 + i * 89, cur = Math.min(8, Math.floor(P(t, 29.3, 30.0, E.inOutSine) * 9));
  lineOn(ctx, xs(0), y, xs(9), y, P(t, 29.25, 29.6), 0, 2.5, 0.35);
  for (let i = 0; i < 10; i++) { const on = i <= cur && t > 29.3 + i * 0.07; circleOn(ctx, xs(i), y, 13, P(t, 29.25 + i * 0.03, 29.45 + i * 0.03), { fill: on && i < 9 ? 1 : 0, col: C.white }); }
  // you (the ninth dot): serious = grows solid, then a stall-shake, then the launch
  const grow = P(t, 29.8, 30.2, E.outBack), launch = P(t, 30.9, 31.25, E.inOutCubic), shake = t > 30.5 && t < 30.9 ? Math.sin(t * 70) * 5 : 0;
  const ux = lerp(xs(8), xs(9), launch) + shake;
  ctx.save(); ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(ux, y, 13 + 15 * grow * (1 - 0.4 * launch), 0, TAU); ctx.fill(); ctx.restore();
  if (launch > 0 && launch < 1) for (let k = 1; k < 5; k++) lineOn(ctx, ux - 30 - k * 22, y - 12 + k * 6, ux - 14 - k * 22, y - 12 + k * 6, 1, 0, 2, (1 - launch) * 0.7);
  ripple(ctx, xs(9), y, t, 31.25, 20, 140);
  cap(ctx, 'This far', xs(8), y - 70, P(t, 29.0, 29.3) * (1 - P(t, 30.4, 30.6)), 24);
  txt(ctx, "Don't stall now.", 540, y + 170, 64, 600, C.white, 'center', P(t, 30.75, 31.05));
  // the link below
  const dn = P(t, 32.3, 32.9, E.outCubic); if (dn > 0) { path(ctx, [[540, y + 230], [540, y + 420]], dn); ripple(ctx, 540, y + 440, t, 32.9, 10, 80); }
}

// ------------------------------------------------------------------ layout over time
const END = 34.44; window.__END = END;
const FH_KEYS = [[0, 0], [0.45, SEAM], [32.0, 0], [END, 0]];
function footH(t) {
  let v = springKeys(t, FH_KEYS, { stiffness: 150, damping: 17 });
  for (let i = 1; i < FH_KEYS.length; i++) v -= Math.sign(FH_KEYS[i][1] - FH_KEYS[i - 1][1]) * 34 * antic(t, FH_KEYS[i][0], 0.22);
  return clamp(v, 0, DH);
}
const FULL_WINDOWS = [];
const CLAIM_FULL = [];

// ------------------------------------------------------------------ captions: clean white type, no box
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
  const k = clamp(pop(t, c.start - 0.04, { stiffness: 420, damping: 26 }));
  ctx.save(); ctx.font = font(48, 500, UI); const w = ctx.measureText(c.text).width + 60;
  ctx.globalAlpha = k; ctx.fillStyle = 'rgba(3,3,4,0.78)'; rrect(ctx, 540 - w / 2, y - 40, w, 80, 40); ctx.fill();
  ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.fillText(c.text, 540, y + 17 + (1 - k) * 10); ctx.restore();
}

// ------------------------------------------------------------------ footage
let FOOT = null; const FCACHE = new Map();
async function loadFrame(t) {
  const idx = Math.min(SRC_FRAMES, Math.max(1, Math.floor(t * SRC_FPS) + 1));
  if (!FCACHE.has(idx)) { const im = new Image(); im.src = `assets/footage/f_${String(idx).padStart(5, '0')}.jpg`; try { await im.decode(); } catch { return; } FCACHE.set(idx, im); while (FCACHE.size > 8) FCACHE.delete(FCACHE.keys().next().value); }
  FOOT = FCACHE.get(idx);
}
function pushIn(t) { for (const [a, b] of FULL_WINDOWS) if (t >= a - 0.5 && t < b + 0.8) return Math.pow(1.1, P(t, a, b + 0.8, E.inOutSine)); return 1; }
const MOVES = [0.4, 1.7, 3.0, 4.6, 7.4, 8.4, 10.2, 11.2, 12.0, 13.4, 16.0, 17.3, 22.4, 24.45, 25.2, 29.7, 33.0];
const near = (t) => FH_KEYS.some(([k]) => t > k - 0.25 && t < k + 0.8) || MOVES.some((k) => t > k - 0.1 && t < k + 0.9);

M.film({
  fonts: [font(96, 400, 'Display'), font(46, 600, 'UI'), font(34, 500, 'UI'), font(100, 600, UI), font(40, 300, UI)],
  images: { badge: 'assets/badge.png' },
  hits: HITS,
  samples: (t) => (near(t) ? 6 : 2),
  async init() { CAPS = buildCaptions(await fetch('assets/words.json').then((r) => r.json())); },
  prepare: (t) => loadFrame(t),
  draw(ctx, u, t, IMG) {
    const fh = footH(t); FH = fh;
    ctx.save(); ctx.scale(S, S);
    background(ctx);
    if (fh < DH - 4) {
      // slow camera breathing on the panel
      const z = 1 + 0.025 * Math.sin(t * 0.4), cx = 540, cy = Y(490);
      ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.rotate(0.006 * Math.sin(t * 0.31)); ctx.translate(-cx, -cy);
      const m = 1 + 0.25 * clamp(1 - fh / SEAM); ctx.translate(540, 960); ctx.scale(m, m); ctx.translate(-540, -960);
      q1(ctx, t); q2(ctx, t); q3(ctx, t); q4(ctx, t); q5(ctx, t);
      ctx.restore();
    }
    if (FOOT && fh > 1) {
      cover(ctx, FOOT, 0, DH - fh, DW, fh, { fx: 0.5, fy: lerp(0.25, 0.45, clamp((fh - SEAM) / (DH - SEAM))), zoom: pushIn(t) });
      if (fh < DH - 2) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, DH - fh - 2, DW, 4); }
    }
    endCard(ctx, t, IMG);
    captions(ctx, t, fh);
    if (CLAIM_FULL.some(([a, b]) => t > a + 0.3 && t < b) && fh > 1700) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 6; txt(ctx, 'Individual results vary. Education only.', 540, 1860, 22, 500, C.white, 'center'); ctx.restore(); }
    if (false) txt(ctx, 'Individual results vary. Education only.', 1060, Y(40), 18, 500, 'rgba(244,245,247,0.55)', 'right');
    ctx.restore();
  },
});

// brand captions (black overlay, Poppins) — CCE Brand Style Guidelines 2025
function captions(ctx, t, fh) { BR.captions(ctx, t, fh, CAPS); }
