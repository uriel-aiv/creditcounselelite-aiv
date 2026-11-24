// CCE — "17 Brand Native" founder split-screen. Pure function of time: window.seek(t) paints frame t.
// Built only from the CCE Brand Style Guidelines 2025:
//   * black ground with background B: twisted light sheets of fine lines and a dot band (from the guide's cover)
//   * gold metal plaques with chamfered corners and bolts (the official metal logo)
//   * ANTON headers in caps, Poppins body, letterspaced labels between blue rules (the guide's section heads)
//   * white neon tube type on black (the Neoneon rule) and a white brush swoosh (the cover's underline)
//   * the 0% Capital Playbook four steps (Foundation, Fix, Build, Leverage) as the film's spine
// Motion on top, founder below; full-screen founder on the key lines; brand end card (lib/brand.js).
import * as M from './lib/motion.js';
import * as BR from './lib/brand.js';

const { W, E, prog, clamp, lerp, spring, springKeys, SPRING, font, mulberry32, cover, rrect } = M;
const DW = 1080, DH = 1920, S = W / DW, TAU = M.TAU;
const C = { blue: '#004AAD', black: '#000000', white: '#FFFFFF', light: '#ADC8E3', gold: '#CB9938', pbBlue: '#114BA7', maroon: '#6B0505', green: '#266235', teal: '#008C96', ink: '#05070B' };
const DISPLAY = 'Display', UI = 'UI';
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 1358, SEAM = 980;

const HITS = [
  [1.3, 'plaque', 'thud', { gain: 0.45 }],
  [2.2, 'transfer', 'whoosh', { len: 1.4, from: 400, to: 2400, gain: 0.35 }],
  [4.1, 'bank plaque', 'thud', { gain: 0.5 }],
  [6.26, 'neon on', 'tick', { gain: 0.4 }],
  [6.4, 'neon hum', 'blip', { pitch: 'A5', gain: 0.25 }],
  [7.0, 'step 2', 'click', { gain: 0.5 }],
  [8.38, 'flat fee', 'whoosh', { len: 0.3, from: 2600, to: 800, gain: 0.3 }],
  [9.28, '1%', 'thud', { gain: 0.5 }],
  [9.94, '5%', 'pop', { pitch: 'A5', gain: 0.45 }],
  [11.3, 'flip', 'whoosh', { len: 0.3, gain: 0.3 }],
  [11.42, '0% neon', 'tick', { gain: 0.4 }],
  [12.3, 'step 3', 'click', { gain: 0.5 }],
  [13.6, 'ticks', 'type', { len: 0.7, gain: 0.25 }],
  [14.3, '24', 'thud', { gain: 0.45 }],
  [17.14, '18', 'bell', { pitch: 'D6', gain: 0.4 }],
  [19.9, 'six', 'thud', { gain: 0.5 }],
  [20.55, 'person', 'blip', { pitch: 'E6', gain: 0.35 }],
  [20.75, 'person', 'blip', { pitch: 'A6', gain: 0.35 }],
  [21.45, 'round 1', 'click', { gain: 0.55 }],
  [22.3, 'round 2', 'click', { gain: 0.55 }],
  [23.08, 'round 3', 'click', { gain: 0.6 }],
  [32.4, 'step 4', 'click', { gain: 0.5 }],
  [33.1, 'plaque', 'thud', { gain: 0.5 }],
  [33.94, '150,000', 'bell', { pitch: 'E6', gain: 0.35 }],
  [35.38, 'brush strike', 'whoosh', { len: 0.3, from: 3000, to: 900, gain: 0.35 }],
  [36.42, '13', 'thud', { gain: 0.5 }],
  [36.6, 'fan', 'whoosh', { len: 0.8, from: 600, to: 2600, gain: 0.3 }],
  [38.54, '10 days', 'click', { gain: 0.6 }],
  [43.6, 'bonus', 'coins', { gain: 0.45 }],
  [51.94, 'take off', 'whoosh', { len: 1.0, from: 400, to: 2600, gain: 0.4 }],
  [53.32, 'seven', 'type', { len: 0.3, gain: 0.3 }],
  [53.98, '21x', 'bell', { pitch: 'E6', gain: 0.4 }],
  [56.7, 'to end', 'whoosh', { len: 0.5, from: 500, to: 2400, gain: 0.45 }],
  [56.95, 'badge', 'thud', { gain: 0.7 }],
];

// ------------------------------------------------------------------ timing helpers
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);
const P = (t, a, b, ease = E.inOutCubic) => ease(prog(t, a, b));
const pop = (t, t0, cfg = SPRING.bouncy) => Math.max(0, sp(t, t0, cfg));
const kIn = (t, t0, cfg = { stiffness: 260, damping: 20 }) => clamp(Math.max(0, sp(t, t0, cfg)), 0, 1.08);
const outK = (t, t0, d = 0.3) => 1 - P(t, t0, t0 + d, E.inCubic);
const antic = (t, t0, dur = 0.2) => { const p = prog(t, t0 - dur, t0 + 0.02); return p > 0 && p < 1 ? Math.sin(p * Math.PI) : 0; };
const fr = (x) => x - Math.floor(x);
const rnd = (i) => fr(Math.sin(i * 12.9898 + 78.233) * 43758.5453);
let FH = DH;
const Y = (y) => y - (FH - SEAM);

// ------------------------------------------------------------------ brand primitives
function goldGrad(ctx, x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x + w * 0.35, y + h);
  g.addColorStop(0, '#F6DE9A'); g.addColorStop(0.28, '#CB9938'); g.addColorStop(0.5, '#7A5518'); g.addColorStop(0.72, '#E9C778'); g.addColorStop(1, '#8F6422');
  return g;
}
function chamfer(ctx, x, y, w, h, c) {
  ctx.beginPath(); ctx.moveTo(x + c, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c); ctx.lineTo(x + w, y + h - c); ctx.lineTo(x + w - c, y + h); ctx.lineTo(x + c, y + h); ctx.lineTo(x, y + h - c); ctx.lineTo(x, y + c); ctx.closePath();
}
// a gold metal plaque (the logo's frame): bevel, black face, inner hairline, bolts. inner(ctx) draws in local space.
function plaque(ctx, cx, cy, w, h, k, inner, { rot = 0, sy = 1 } = {}) {
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(k, k * sy);
  const c = Math.min(30, h * 0.2);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 14;
  chamfer(ctx, -w / 2, -h / 2, w, h, c); ctx.fillStyle = goldGrad(ctx, -w / 2, -h / 2, w, h); ctx.fill(); ctx.restore();
  chamfer(ctx, -w / 2 + 12, -h / 2 + 12, w - 24, h - 24, c * 0.7);
  const f = ctx.createLinearGradient(0, -h / 2, 0, h / 2); f.addColorStop(0, '#11161F'); f.addColorStop(1, '#030407'); ctx.fillStyle = f; ctx.fill();
  chamfer(ctx, -w / 2 + 20, -h / 2 + 20, w - 40, h - 40, c * 0.55); ctx.strokeStyle = 'rgba(203,153,56,0.7)'; ctx.lineWidth = 2; ctx.stroke();
  for (const sx of [-1, 1]) { const bx = sx * (w / 2 - 6), g = ctx.createRadialGradient(bx - 2, -2, 1, bx, 0, 7); g.addColorStop(0, '#FFF2C8'); g.addColorStop(1, '#7A5518'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, 0, 6, 0, TAU); ctx.fill(); }
  inner && inner(ctx);
  ctx.restore();
}
function txt(ctx, s, x, y, size, family, color, { align = 'center', track = 0, alpha = 1, weight = 400 } = {}) {
  if (alpha <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.font = font(size, weight, family); ctx.letterSpacing = `${track}px`; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(s, x, y); ctx.restore();
}
// Anton header that rises out of a mask line (k 0..1)
function rise(ctx, s, x, y, size, color, k, align = 'center', track = 1) {
  if (k <= 0.001) return;
  ctx.save(); ctx.font = font(size, 400, DISPLAY); ctx.letterSpacing = `${track}px`; const w = ctx.measureText(s).width;
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.beginPath(); ctx.rect(x0 - 20, y - size * 1.05, w + 40, size * 1.25); ctx.clip();
  ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.fillText(s, x0, y + (1 - E.outCubic(clamp(k))) * size * 1.1); ctx.restore();
}
// neon tube type: white tube, light-blue glow, flickers on from t0
function flick(t, t0, dur = 0.42) { if (t < t0) return 0; const d = t - t0; if (d > dur) return 1; const i = Math.floor(d / 0.035); return rnd(i + t0 * 31) < 0.25 + 0.75 * (d / dur) ? 1 : 0.15; }
function neon(ctx, s, x, y, size, a, { align = 'center', family = DISPLAY, track = 4 } = {}) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.font = font(size, 400, family); ctx.letterSpacing = `${track}px`; ctx.textAlign = align; ctx.lineJoin = 'round';
  ctx.shadowColor = '#3F7FE0'; ctx.shadowBlur = size * 0.45; ctx.strokeStyle = 'rgba(173,200,227,0.85)'; ctx.lineWidth = size * 0.085; ctx.strokeText(s, x, y);
  ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = size * 0.14; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = size * 0.038; ctx.strokeText(s, x, y);
  ctx.restore();
}
// white brush swoosh (the cover's underline): tapered, dry tail, draws on with p
function brush(ctx, x0, y0, x1, y1, bend, w, p, seed = 1, color = C.white) {
  if (p <= 0.002) return;
  const n = 70, r = mulberry32(seed), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + bend, L = [], R = [];
  const m = Math.max(2, Math.floor(n * clamp(p)));
  for (let i = 0; i <= m; i++) {
    const k = i / n, q = 1 - k, x = q * q * x0 + 2 * q * k * cx + k * k * x1, y = q * q * y0 + 2 * q * k * cy + k * k * y1;
    const dx = 2 * q * (cx - x0) + 2 * k * (x1 - cx), dy = 2 * q * (cy - y0) + 2 * k * (y1 - cy), d = Math.hypot(dx, dy) || 1;
    const prof = Math.pow(Math.sin(Math.PI * Math.min(1, k * 1.15 + 0.04)), 0.55) * (1 - 0.45 * k), ww = w * prof * (0.92 + 0.16 * r());
    L.push([x - (dy / d) * ww / 2, y + (dx / d) * ww / 2]); R.push([x + (dy / d) * ww / 2, y - (dx / d) * ww / 2]);
  }
  ctx.save(); ctx.fillStyle = color; ctx.beginPath(); L.forEach((v, i) => (i ? ctx.lineTo(...v) : ctx.moveTo(...v))); R.reverse().forEach((v) => ctx.lineTo(...v)); ctx.closePath(); ctx.fill(); ctx.restore();
}
// letterspaced label between two blue rules (the guide's section heads)
function ruleLabel(ctx, s, x, y, a, size = 24, half = 420, color = C.white) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.font = font(size, 500, UI); ctx.letterSpacing = `${size * 0.45}px`; const w = ctx.measureText(s).width;
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(s, x + size * 0.22, y);
  ctx.fillStyle = C.blue; const g = 26, l = Math.max(0, half - w / 2 - g) * a;
  ctx.fillRect(x - w / 2 - g - l, y - size * 0.36, l, 3); ctx.fillRect(x + w / 2 + g, y - size * 0.36, l, 3); ctx.restore();
}
const quadPt = (a, c, b, k) => { const q = 1 - k; return [q * q * a[0] + 2 * q * k * c[0] + k * k * b[0], q * q * a[1] + 2 * q * k * c[1] + k * k * b[1]]; };
// a blue light beam along a curve with a bright comet head (from..to along the curve)
function beam(ctx, a, c, b, from, to, alpha = 1, w = 4) {
  if (to - from < 0.003 || alpha <= 0.01) return;
  const n = 60; ctx.save(); ctx.globalAlpha *= alpha; ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (let i = Math.floor(from * n); i < Math.ceil(to * n); i++) {
    const k0 = Math.max(from, i / n), k1 = Math.min(to, (i + 1) / n), h = (k1 - from) / Math.max(0.001, to - from);
    const p0 = quadPt(a, c, b, k0), p1 = quadPt(a, c, b, k1);
    ctx.strokeStyle = `rgba(${Math.round(lerp(0, 173, h))},${Math.round(lerp(74, 200, h))},${Math.round(lerp(173, 227, h))},${0.25 + 0.75 * h})`;
    ctx.lineWidth = w * (0.5 + h); ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.stroke();
  }
  const hd = quadPt(a, c, b, to), g = ctx.createRadialGradient(hd[0], hd[1], 0, hd[0], hd[1], 30); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.3, 'rgba(173,200,227,0.6)'); g.addColorStop(1, 'rgba(0,74,173,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hd[0], hd[1], 30, 0, TAU); ctx.fill(); ctx.restore();
}
// a members card (no numbers): black / blue / Playbook faces with a gold edge and chip
function card(ctx, x, y, rot, k, face, w = 210) {
  if (k <= 0.01) return; const h = w * 0.63;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, face); g.addColorStop(1, face === C.ink ? '#1C2230' : shade(face, -0.45)); ctx.fillStyle = g; rrect(ctx, -w / 2, -h / 2, w, h, 12); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = goldGrad(ctx, -w / 2, -h / 2, w, h); ctx.lineWidth = 3; rrect(ctx, -w / 2 + 1.5, -h / 2 + 1.5, w - 3, h - 3, 11); ctx.stroke();
  ctx.fillStyle = goldGrad(ctx, -w / 2 + 22, -10, 34, 26); rrect(ctx, -w / 2 + 22, -12, 36, 27, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-w / 2 + 70, 1, 6 + i * 6, -0.7, 0.7); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-w / 2 + 22, h / 2 - 30, w * 0.42, 5);
  ctx.restore();
}
function shade(hex, f) { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(clamp(v * (1 + f), 0, 255))); return `rgb(${c.join(',')})`; }
function docIcon(ctx, x, y, s, a, rot = 0) {
  if (a <= 0.01) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  ctx.strokeStyle = C.white; ctx.lineWidth = 4; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-34, -46); ctx.lineTo(16, -46); ctx.lineTo(34, -28); ctx.lineTo(34, 46); ctx.lineTo(-34, 46); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16, -46); ctx.lineTo(16, -28); ctx.lineTo(34, -28); ctx.stroke();
  for (let i = 0; i < 4; i++) ctx.fillRect(-22, -14 + i * 14, i === 3 ? 26 : 44, 4); ctx.restore();
}
function person(ctx, x, y, s, col, k) {
  if (k <= 0.01) return; ctx.save(); ctx.translate(x, y); ctx.scale(k * s, k * s);
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 46, 0, TAU); ctx.fill();
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(0, -12, 13, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, 24, 24, 15, 0, Math.PI, TAU); ctx.fill(); ctx.restore();
}
function plane(ctx, x, y, rot, s, a = 1) {
  if (a <= 0.01) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a; ctx.fillStyle = C.white;
  ctx.beginPath(); ctx.moveTo(60, 0); ctx.quadraticCurveTo(54, -8, 40, -8); ctx.lineTo(8, -8); ctx.lineTo(-18, -46); ctx.lineTo(-30, -46); ctx.lineTo(-14, -8); ctx.lineTo(-42, -8); ctx.lineTo(-54, -24); ctx.lineTo(-62, -24); ctx.lineTo(-54, 0);
  ctx.lineTo(-62, 24); ctx.lineTo(-54, 24); ctx.lineTo(-42, 8); ctx.lineTo(-14, 8); ctx.lineTo(-30, 46); ctx.lineTo(-18, 46); ctx.lineTo(8, 8); ctx.lineTo(40, 8); ctx.quadraticCurveTo(54, 8, 60, 0); ctx.fill(); ctx.restore();
}

// ------------------------------------------------------------------ 0% Capital Playbook tracker (the film's spine)
const STEPS = [[1.15, 'THE FOUNDATION', C.pbBlue], [7.0, 'FIX', C.maroon], [12.3, 'BUILD', C.green], [32.35, 'LEVERAGE', C.teal]];
function tracker(ctx, t, a) {
  if (a <= 0.01 || t < 1.2) return;
  let i = 0; while (i + 1 < STEPS.length && t >= STEPS[i + 1][0]) i++;
  const y = Y(84), ch = P(t, STEPS[i][0], STEPS[i][0] + 0.35, E.outCubic), on = P(t, 1.3, 1.7, E.outCubic);
  ctx.save(); ctx.globalAlpha *= a * on;
  // label swaps by rising
  ctx.save(); ctx.beginPath(); ctx.rect(0, y - 34, DW, 46); ctx.clip();
  if (i > 0 && ch < 1) ruleLabel(ctx, `STEP 0${i}  ·  ${STEPS[i - 1][1]}`, 540, y - ch * 44, 1, 23, 400);
  ruleLabel(ctx, `STEP 0${i + 1}  ·  ${STEPS[i][1]}`, 540, y + (1 - (i > 0 ? ch : 1)) * 44, 1, 23, 400);
  ctx.restore();
  // four Playbook dots
  STEPS.forEach(([t0, , col], j) => {
    const x = 540 + (j - 1.5) * 44, done = t >= t0, k = done ? clamp(pop(t, t0)) : 0, r = j === i ? 10 + 3 * k : 8;
    ctx.strokeStyle = j <= i ? col : 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y + 34, r, 0, TAU); ctx.stroke();
    if (done) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y + 34, r * Math.min(1, k), 0, TAU); ctx.fill(); }
  });
  ctx.restore();
}

// ------------------------------------------------------------------ S1 THE FOUNDATION: credit limit -> bank account -> next day
function s1(ctx, t) {
  if (t < 1.15 || t > 7.2) return;
  const ex = P(t, 6.75, 7.05, E.inCubic), dx = -ex * 260, a = 1 - ex;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(dx, 0);
  const A = [300, Y(380)], B = [790, Y(380)], c = [545, Y(200)];
  plaque(ctx, A[0], A[1], 400, 170, kIn(t, 1.28), (x) => { txt(x, 'CREDIT', 0, -6, 60, DISPLAY, C.white, { track: 2 }); txt(x, 'LIMIT', 0, 52, 46, DISPLAY, C.light, { track: 1 }); });
  // the transfer: a light beam carries the limit across
  const go = P(t, 2.2, 3.95, E.inOutSine), tail = P(t, 4.1, 4.7, E.inOutSine);
  beam(ctx, [A[0] + 190, A[1] - 20], c, [B[0] - 190, B[1] - 20], tail, go, 1, 4);
  plaque(ctx, B[0], B[1], 400, 170, kIn(t, 4.1) * (1 + 0.06 * Math.max(0, Math.sin((t - 4.1) * 18)) * Math.exp(-(t - 4.1) * 6) * (t > 4.1 ? 1 : 0)), (x) => { txt(x, 'BANK', 0, -6, 60, DISPLAY, C.white, { track: 2 }); txt(x, 'ACCOUNT', 0, 52, 46, DISPLAY, C.light, { track: 1 }); });
  // next day: neon on black, brush underline
  neon(ctx, 'NEXT DAY', 540, Y(700), 132, flick(t, 6.26));
  brush(ctx, 300, Y(752), 790, Y(738), 14, 22, P(t, 6.5, 6.75, E.outCubic), 4);
  ctx.restore();
}
// ------------------------------------------------------------------ S2 FIX: flat fee 1-5%, especially 0%
function s2(ctx, t) {
  if (t < 7.0 || t > 12.5) return;
  const ex = P(t, 12.1, 12.4, E.inCubic); ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(0, -ex * 120);
  rise(ctx, 'FLAT', 400, Y(250), 120, C.white, P(t, 8.3, 8.6, E.outCubic), 'right');
  rise(ctx, 'FEE', 430, Y(250), 120, C.blue, P(t, 8.7, 9.0, E.outCubic), 'left');
  const k = kIn(t, 9.2), flip = P(t, 11.15, 11.42, E.inOutCubic), sy = Math.abs(Math.cos(flip * Math.PI)) || 0.001, back = flip > 0.5;
  plaque(ctx, 540, Y(560), 560, 270, k, (x) => {
    if (!back) {
      const n = t < 9.6 ? 1 : Math.round(lerp(1, 5, P(t, 9.6, 9.94, E.inOutSine)));
      const s = t < 9.6 ? '1%' : `1–${n}%`;
      txt(x, s, 0, 62, 170, DISPLAY, C.white, { track: 2 });
    } else {
      neon(x, '0%', 0, 70, 190, flick(t, 11.42, 0.3));
    }
  }, { sy });
  brush(ctx, 330, Y(760), 760, Y(748), -10, 20, P(t, 11.6, 11.85, E.outCubic), 8);
  ctx.restore();
}
// ------------------------------------------------------------------ S3 BUILD: 6 to 24 months at 0%, 18 is common
const XM = (m) => lerp(140, 940, (m - 6) / 18);
function s3(ctx, t) {
  if (t < 12.3 || t > 18.7) return;
  const ex = P(t, 18.25, 18.55, E.inCubic); ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(-ex * 200, 0);
  rise(ctx, 'MONTHS AT 0%', 540, Y(270), 96, C.white, P(t, 12.45, 12.8, E.outCubic));
  const base = Y(640), dr = P(t, 13.45, 14.35, E.inOutSine);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(XM(6) - 10, base, (XM(24) - XM(6) + 20) * dr, 3);
  for (let m = 6; m <= 24; m++) { const k = P(t, 13.5 + (m - 6) * 0.045, 13.62 + (m - 6) * 0.045, E.outBack), big = m % 6 === 0, h = (big ? 46 : 24) * k; ctx.fillStyle = goldGrad(ctx, XM(m) - 2, base - h, 4, h); ctx.fillRect(XM(m) - 2.5, base - h, 5, h); }
  txt(ctx, '6', XM(6), base + 74, 64, DISPLAY, C.white, { alpha: P(t, 13.6, 13.8) });
  txt(ctx, '24', XM(24), base + 74, 64, DISPLAY, C.white, { alpha: P(t, 14.3, 14.5) });
  // the span glows from 6 to 24
  const gl = P(t, 14.3, 14.75, E.outCubic); if (gl > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(XM(6), 0, XM(24), 0); g.addColorStop(0, 'rgba(0,74,173,0.7)'); g.addColorStop(1, 'rgba(173,200,227,0.9)'); ctx.fillStyle = g; ctx.fillRect(XM(6), base - 10, (XM(24) - XM(6)) * gl, 8); ctx.restore(); }
  // 18: a plaque rises on a gold post
  const k18 = kIn(t, 17.14), post = P(t, 16.95, 17.2, E.outCubic);
  ctx.fillStyle = C.gold; ctx.fillRect(XM(18) - 2, base - 12 - 120 * post, 4, 120 * post);
  plaque(ctx, XM(18), base - 210, 300, 160, k18, (x) => { txt(x, 'MOST COMMON', 0, -20, 34, DISPLAY, C.light, { track: 1 }); txt(x, '18 MONTHS', 0, 40, 60, DISPLAY, C.white, { track: 2 }); });
  ctx.restore();
}
// ------------------------------------------------------------------ S4 BUILD: every 6 months, per person, repeat
function s4(ctx, t) {
  if (t < 18.5 || t > 24.4) return;
  const ex = P(t, 23.85, 24.15, E.inCubic); ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(0, ex * 140);
  const cx = 350, cy = Y(510), R = 200, dr = P(t, 18.8, 19.5, E.inOutSine);
  ctx.strokeStyle = 'rgba(0,74,173,0.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU * dr); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.setLineDash([6, 12]); ctx.lineDashOffset = -t * 30; ctx.beginPath(); ctx.arc(cx, cy, R + 34, 0, TAU * dr); ctx.stroke(); ctx.setLineDash([]);
  if (t > 19.4) { const a = -Math.PI / 2 + (t - 19.4) * 1.3; beam(ctx, [cx + Math.cos(a - 0.9) * R, cy + Math.sin(a - 0.9) * R], [cx + Math.cos(a - 0.45) * R * 1.12, cy + Math.sin(a - 0.45) * R * 1.12], [cx + Math.cos(a) * R, cy + Math.sin(a) * R], 0, 1, clamp(pop(t, 19.4)), 4); }
  rise(ctx, '6', cx, cy + 70, 230, C.white, P(t, 19.85, 20.15, E.outCubic));
  txt(ctx, 'MONTHS', cx, cy + 140, 44, DISPLAY, C.light, { track: 1, alpha: P(t, 20.1, 20.4) });
  person(ctx, cx - 150, cy - 175, 0.9, C.blue, kIn(t, 20.55));
  person(ctx, cx + 150, cy - 175, 0.9, C.teal, kIn(t, 20.75));
  rise(ctx, 'EVERY 6 MONTHS', 540, Y(872), 70, C.white, P(t, 19.5, 19.85, E.outCubic));
  // repeat: rounds stack as plaques on the right
  [21.45, 22.3, 23.08].forEach((r, i) => {
    const k = kIn(t, r, { stiffness: 320, damping: 19 }), drop = (1 - clamp(P(t, r - 0.08, r + 0.12, E.inCubic))) * -120;
    plaque(ctx, 800, Y(660) - i * 140 + drop, 330, 118, k, (x) => { txt(x, `ROUND ${i + 1}`, 0, 22, 56, DISPLAY, C.white, { track: 3 }); x.fillStyle = [C.blue, C.green, C.teal][i]; x.beginPath(); x.arc(-118, 0, 9, 0, TAU); x.fill(); });
  });
  ctx.restore();
}
// ------------------------------------------------------------------ S5 LEVERAGE: up to 150,000 without documentation
function s5(ctx, t) {
  if (t < 32.35 || t > 36.2) return;
  const ex = P(t, 35.8, 36.1, E.inCubic); ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(ex * 220, 0);
  plaque(ctx, 540, Y(370), 720, 250, kIn(t, 33.1), (x) => {
    txt(x, 'UP TO', 0, -54, 38, DISPLAY, C.light, { track: 1 });
    const v = Math.round(lerp(0, 150, P(t, 33.3, 33.94, E.outCubic))); txt(x, `${v === 150 ? '150' : v},000`, 0, 74, 150, DISPLAY, C.white, { track: 2 });
  });
  const gone = P(t, 35.55, 35.95, E.inCubic);
  for (let i = 0; i < 5; i++) { const k = kIn(t, 34.48 + i * 0.07), x = 230 + i * 155, y = Y(700) + gone * (160 + i * 30); docIcon(ctx, x, y, 1.05, Math.min(1, k) * (1 - gone), (rnd(i) - 0.5) * 0.25 + gone * (i % 2 ? 0.6 : -0.6)); }
  brush(ctx, 150, Y(735), 930, Y(660), -30, 30, P(t, 35.3, 35.55, E.outCubic), 12);
  rise(ctx, 'NO DOCUMENTATION', 540, Y(868), 72, C.white, P(t, 35.4, 35.7, E.outCubic));
  ctx.restore();
}
// ------------------------------------------------------------------ S6 LEVERAGE: 13 cards in 10 days, a bonus on each
const FACES = [C.ink, C.blue, C.ink, C.teal, C.ink, C.maroon, C.blue, C.ink, C.green, C.ink, C.blue, C.ink, C.pbBlue];
function s6(ctx, t) {
  if (t < 35.9 || t > 44.7) return;
  const ex = P(t, 44.25, 44.55, E.inCubic); ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(0, -ex * 160);
  rise(ctx, '13', 200, Y(460), 300, C.white, P(t, 36.4, 36.7, E.outCubic));
  rise(ctx, 'CARDS', 200, Y(540), 72, C.white, P(t, 36.7, 37.0, E.outCubic));
  const O = [690, Y(640)];
  for (let i = 0; i < 13; i++) {
    const f = P(t, 36.5 + i * 0.045, 37.1 + i * 0.045, E.outBack), a = lerp(-1.05, 1.05, i / 12) * f, r = 270;
    const wave = Math.max(0, Math.sin(Math.PI * prog(t, 40.5 + i * 0.04, 41.0 + i * 0.04))) * 18;
    const x = O[0] + Math.sin(a) * r * f, y = O[1] - Math.cos(a) * r * f - wave;
    card(ctx, x, y, a, clamp(pop(t, 36.45 + i * 0.03)), FACES[i], 150);
    // bonus: a gold chip pops above each card
    const kb = clamp(pop(t, 43.58 + i * 0.05)), bx = O[0] + Math.sin(a) * (r + 92), by = O[1] - Math.cos(a) * (r + 92) - wave;
    if (kb > 0.01) { ctx.save(); ctx.translate(bx, by); ctx.scale(kb, kb); ctx.fillStyle = goldGrad(ctx, -18, -18, 36, 36); ctx.beginPath(); ctx.arc(0, 0, 18, 0, TAU); ctx.fill(); ctx.fillStyle = C.ink; ctx.fillRect(-8, -2, 16, 4); ctx.fillRect(-2, -8, 4, 16); ctx.restore(); }
  }
  // 10 days: ten dots fill, then the label
  for (let d = 0; d < 10; d++) { const x = 80 + d * 36, y = Y(700), on = clamp(pop(t, 37.92 + d * 0.062)); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 11, 0, TAU); ctx.stroke(); if (on > 0) { ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(x, y, 11 * Math.min(1, on), 0, TAU); ctx.fill(); } }
  rise(ctx, 'IN 10 DAYS', 80, Y(800), 70, C.white, P(t, 38.5, 38.8, E.outCubic), 'left');
  rise(ctx, 'BONUS ON EACH', 700, Y(800), 58, C.white, P(t, 43.7, 44.0, E.outCubic));
  ctx.restore();
}
// ------------------------------------------------------------------ S7 LEVERAGE: travel, up to 7-21x value
function s7(ctx, t) {
  if (t < 49.4 || t > 55.6) return;
  const ex = P(t, 55.1, 55.4, E.inCubic); ctx.save(); ctx.globalAlpha = P(t, 49.55, 49.9) * (1 - ex);
  const a = [110, Y(560)], c = [420, Y(110)], b = [990, Y(250)], go = P(t, 51.9, 52.9, E.inOutCubic);
  beam(ctx, a, c, b, Math.max(0, go - 0.55), go, go > 0 ? 1 : 0, 4);
  const k = Math.max(0.0005, go), p = quadPt(a, c, b, k), q = quadPt(a, c, b, Math.min(1, k + 0.01)), ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
  plane(ctx, go > 0 ? p[0] : a[0], go > 0 ? p[1] : a[1], go > 0 ? ang : -0.6, 1.3 * clamp(pop(t, 49.95)), 1 - P(t, 52.75, 52.95));
  rise(ctx, 'TRAVEL', 120, Y(690), 120, C.white, P(t, 51.94, 52.25, E.outCubic), 'left');
  plaque(ctx, 760, Y(640), 420, 260, kIn(t, 53.3), (x) => {
    txt(x, 'UP TO', 0, -62, 34, DISPLAY, C.light, { track: 1 });
    const v = Math.round(lerp(7, 21, P(t, 53.45, 53.98, E.inOutSine)));
    if (t < 53.98) txt(x, `${v}X`, 0, 64, 140, DISPLAY, C.white, { track: 2 }); else neon(x, '7–21X', 0, 62, 118, flick(t, 53.98, 0.25), { track: 3 });
    txt(x, 'IN VALUE', 0, 104, 30, DISPLAY, C.light, { track: 1, alpha: P(t, 54.1, 54.4) });
  });
  ctx.restore();
}

// ------------------------------------------------------------------ grain
let BG, GRAIN = [];
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function buildTextures() {
  BG = makeCanvas(W, Math.round(DH * S)); const p = BG.getContext('2d'); p.scale(S, S);
  p.fillStyle = '#000'; p.fillRect(0, 0, DW, DH);
  const g = p.createRadialGradient(780, 1100, 60, 700, 900, 1300); g.addColorStop(0, 'rgba(0,58,140,0.55)'); g.addColorStop(0.55, 'rgba(0,30,80,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)'); p.fillStyle = g; p.fillRect(0, 0, DW, DH);
  for (let y = 0; y < DH; y += 16) for (let x = 0; x < DW; x += 16) { const d = Math.hypot(DW - x, y - 0) / 900, r = 3.4 * clamp(1 - d); if (r > 0.3) { p.fillStyle = 'rgba(70,120,210,0.28)'; p.beginPath(); p.arc(x + ((y / 16) % 2) * 8, y, r, 0, TAU); p.fill(); } }
  for (let v = 0; v < 4; v++) {
    const c = makeCanvas(W, Math.round(DH * S)), x = c.getContext('2d'), rr = mulberry32(300 + v), img = x.createImageData(c.width, c.height);
    for (let i = 0; i < img.data.length; i += 4) { const n = rr() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = n; img.data[i + 3] = 255; }
    x.putImageData(img, 0, 0); GRAIN.push(c);
  }
}
// background B (approved in the HTML tests): twisted light sheets of fine lines + a dot band, no core line
const PH = 1000, BG_OPACITY = 0.45;   // lowered so the content reads first   // compose in the motion panel's height
function bz(Q, s) { const q = 1 - s; return [q*q*q*Q[0][0] + 3*q*q*s*Q[1][0] + 3*q*s*s*Q[2][0] + s*s*s*Q[3][0], q*q*q*Q[0][1] + 3*q*q*s*Q[1][1] + 3*q*s*s*Q[2][1] + s*s*s*Q[3][1]]; }
function bzd(Q, s) { const q = 1 - s; return [3*q*q*(Q[1][0]-Q[0][0]) + 6*q*s*(Q[2][0]-Q[1][0]) + 3*s*s*(Q[3][0]-Q[2][0]), 3*q*q*(Q[1][1]-Q[0][1]) + 6*q*s*(Q[2][1]-Q[1][1]) + 3*s*s*(Q[3][1]-Q[2][1])]; }
const toPx = (Q) => Q.map(([x, y]) => [x * DW, y * PH]);
const drift = (Q, t, amp = 0.015, seed = 1) => Q.map(([x, y], i) => [x + amp * Math.sin(t * 0.21 + i * 1.7 + seed), y + amp * Math.cos(t * 0.17 + i * 2.3 + seed)]);
function ribbonPt(R, s, v, t) {
  const Cc = bz(R.P, s), D = bzd(R.P, s), d = Math.hypot(D[0], D[1]) || 1, N = [-D[1] / d, D[0] / d];
  const w = R.w * DW * (0.35 + 0.65 * Math.sin(Math.PI * clamp(s * 1.05))) * (1 + 0.08 * Math.sin(t * 0.3 + s * 4));
  const th = R.tw0 + R.tw * s + t * R.spin, c = Math.cos(th);
  return [Cc[0] + N[0] * w * v * c, Cc[1] + N[1] * w * v * c, Math.sin(th) * v];
}
function drawLines(ctx, R, t, { n = 64, steps = 90, alpha = 0.22, col = [70, 130, 255], hi = [190, 215, 255], width = 1.1 } = {}) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = width;
  for (let i = 0; i <= n; i++) {
    const v = -1 + 2 * i / n, edge = Math.pow(Math.abs(v), 6), k = 0.5 + 0.5 * v, c = [0, 1, 2].map((j) => Math.round(lerp(col[j], hi[j], k * 0.7 + edge * 0.3)));
    ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha * (0.45 + 0.55 * edge + 0.25 * rnd(i + R.seed))})`;
    ctx.beginPath(); for (let j = 0; j <= steps; j++) { const p = ribbonPt(R, j / steps, v, t); j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke();
  }
  ctx.restore();
}
function drawDots(ctx, R, t, { nu = 120, nv = 26, size = 3.2, alpha = 0.85 } = {}) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let j = 0; j <= nu; j++) for (let i = 0; i <= nv; i++) {
    const v = -1 + 2 * i / nv, p = ribbonPt(R, j / nu, v, t), depth = 0.5 + 0.5 * p[2], fade = Math.sin(Math.PI * (j / nu)) * (1 - Math.pow(Math.abs(v), 4));
    const a = alpha * fade * (0.25 + 0.75 * depth), z = size * (0.45 + 0.75 * depth); if (a < 0.03) continue;
    ctx.fillStyle = `rgba(${Math.round(lerp(90, 225, depth))},${Math.round(lerp(140, 235, depth))},255,${a})`; ctx.fillRect(p[0] - z / 2, p[1] - z / 2, z, z);
  }
  ctx.restore();
}
function sheet(ctx, R, t, o = {}) {
  drawLines(ctx, R, t, { n: o.n || 110, alpha: (o.alpha || 0.2) * 0.55, width: 9, col: [10, 60, 200], hi: [60, 120, 255] });
  drawLines(ctx, R, t, { n: o.n || 110, alpha: o.alpha || 0.2, width: 1.2, col: [40, 100, 255], hi: [180, 210, 255] });
}
function background(ctx, t) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, DW, DH);
  const g = ctx.createRadialGradient(0.5 * DW, 0.6 * PH, 40, 0.5 * DW, 0.6 * PH, PH * 1.1); g.addColorStop(0, 'rgba(0,60,170,0.4)'); g.addColorStop(0.5, 'rgba(0,30,95,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, DW, DH);
  const R1 = { P: toPx(drift([[-0.35, 0.3], [0.2, 0.55], [0.65, 0.36], [1.35, 0.5]], t, 0.012, 2)), w: 0.26, tw0: 0.2, tw: 2.6, spin: 0.05, seed: 4 };
  const R2 = { P: toPx(drift([[-0.3, 0.6], [0.35, 0.32], [0.75, 0.62], [1.3, 0.28]], t, 0.01, 5)), w: 0.22, tw0: 1.4, tw: 2.2, spin: -0.05, seed: 5 };
  ctx.save(); ctx.globalAlpha = BG_OPACITY;
  sheet(ctx, R1, t, { alpha: 0.2 });
  drawDots(ctx, R2, t, { nu: 95, nv: 20, size: 5, alpha: 0.75 });
  sheet(ctx, R2, t, { alpha: 0.08, n: 60 });
  ctx.restore();
}

// ------------------------------------------------------------------ layout over time (same founder cut as the other tests)
const FH_KEYS = [[0, 1920], [1.15, SEAM], [24.15, 1920], [32.35, SEAM], [44.55, 1920], [49.55, SEAM], [55.45, 1920], [56.7, 0]];
function footH(t) {
  let v = springKeys(t, FH_KEYS, { stiffness: 150, damping: 17 });
  for (let i = 1; i < FH_KEYS.length; i++) v -= Math.sign(FH_KEYS[i][1] - FH_KEYS[i - 1][1]) * 34 * antic(t, FH_KEYS[i][0], 0.22);
  return clamp(v, 0, DH);
}
const FULL_WINDOWS = [[0, 1.15], [24.15, 32.35], [44.55, 49.55], [55.45, 56.7]];
const CLAIM_FULL = [[24.15, 32.35], [44.55, 49.55]];
const CLAIM_PANEL = [[32.7, 44.4], [49.9, 55.3]];

// ------------------------------------------------------------------ captions
let CAPS = [];
function buildCaptions(words) {
  const fix = [];
  for (let i = 0; i < words.length; i++) {
    let [a, b, w] = words[i];
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

// ------------------------------------------------------------------ footage
let FOOT = null; const FCACHE = new Map();
async function loadFrame(t) {
  const idx = Math.min(SRC_FRAMES, Math.max(1, Math.floor(t * SRC_FPS) + 1));
  if (!FCACHE.has(idx)) { const im = new Image(); im.src = `assets/footage/f_${String(idx).padStart(5, '0')}.jpg`; try { await im.decode(); } catch { return; } FCACHE.set(idx, im); while (FCACHE.size > 8) FCACHE.delete(FCACHE.keys().next().value); }
  FOOT = FCACHE.get(idx);
}
function pushIn(t) { for (const [a, b] of FULL_WINDOWS) if (t >= a - 0.5 && t < b + 0.8) return Math.pow(1.1, P(t, a, b + 0.8, E.inOutSine)); return 1; }
const FAST = [1.15, 2.2, 4.1, 6.26, 6.8, 8.3, 9.2, 9.94, 11.15, 12.1, 13.5, 14.3, 17.0, 18.25, 19.85, 21.45, 22.3, 23.08, 23.85, 32.3, 33.1, 34.48, 35.3, 35.8, 36.4, 38.5, 40.5, 43.58, 44.25, 49.6, 51.9, 53.3, 55.1, 56.7];
const near = (t) => FAST.some((k) => t > k - 0.15 && t < k + 0.9) || FH_KEYS.some(([k]) => t > k - 0.25 && t < k + 0.8);

M.film({
  fonts: [font(96, 400, DISPLAY), font(46, 600, UI), font(34, 500, UI), font(24, 600, UI), font(22, 500, UI)],
  images: { badge: 'assets/badge.png' },
  hits: HITS,
  samples: (t) => (near(t) ? 8 : 3),
  async init() { buildTextures(); CAPS = buildCaptions(await fetch('assets/words.json').then((r) => r.json())); },
  prepare: (t) => loadFrame(t),
  draw(ctx, u, t, IMG) {
    const fh = footH(t); FH = fh; const pa = 1 - clamp((fh - SEAM) / (DH - SEAM));
    ctx.save(); ctx.scale(S, S);
    background(ctx, t);
    s1(ctx, t); s2(ctx, t); s3(ctx, t); s4(ctx, t); s5(ctx, t); s6(ctx, t); s7(ctx, t);
    // tracker removed (user: no small text on top)
    if (CLAIM_PANEL.some(([a, b]) => t > a && t < b)) txt(ctx, 'Individual results vary. Education only.', 540, Y(170), 20, UI, C.white, { alpha: 0.7 * pa, weight: 500 });
    if (FOOT && fh > 1) {
      cover(ctx, FOOT, 0, DH - fh, DW, fh, { fx: 0.5, fy: lerp(0.25, 0.45, clamp((fh - SEAM) / (DH - SEAM))), zoom: pushIn(t) });
      if (fh < DH - 2) { const g = ctx.createLinearGradient(0, 0, DW, 0); g.addColorStop(0, '#7A5518'); g.addColorStop(0.5, '#F2D48A'); g.addColorStop(1, '#7A5518'); ctx.fillStyle = g; ctx.fillRect(0, DH - fh - 3, DW, 6); }
    }
    BR.captions(ctx, t, fh, CAPS);
    if (CLAIM_FULL.some(([a, b]) => t > a + 0.3 && t < b) && fh > 1700) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8; txt(ctx, 'Individual results vary. Education only.', 540, 1860, 24, UI, C.white, { alpha: 0.9, weight: 500 }); ctx.restore(); }
    ctx.restore();
  },
  post(ctx, u, t) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.1; ctx.drawImage(GRAIN[Math.floor(t * 24) % 4], 0, 0); ctx.restore(); },
});
