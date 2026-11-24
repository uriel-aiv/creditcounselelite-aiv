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
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 867, SEAM = 980;

const HITS = [
  [0.05, 'title', 'whoosh', { len: 0.4, from: 2400, to: 700, gain: 0.3 }],
  [1.5, 'income', 'thud', { gain: 0.45 }], [2.25, 'strike', 'whoosh', { len: 0.25, from: 3200, to: 900, gain: 0.3 }],
  [3.4, 'hustle', 'thud', { gain: 0.45 }], [4.05, 'strike', 'whoosh', { len: 0.25, from: 3200, to: 900, gain: 0.3 }],
  [4.7, 'score', 'thud', { gain: 0.45 }], [5.25, 'strike', 'whoosh', { len: 0.25, from: 3200, to: 900, gain: 0.3 }],
  [5.85, 'neon', 'tick', { gain: 0.35 }], [7.15, 'bank draws', 'type', { len: 0.7, gain: 0.2 }], [8.85, 'against', 'thud', { gain: 0.55 }],
  [10.1, 'dependent', 'blip', { pitch: 'E5', gain: 0.3 }], [12.95, 'rules', 'thud', { gain: 0.5 }], [14.45, 'unlock', 'click', { gain: 0.6 }],
  [15.8, 'binder opens', 'whoosh', { len: 0.6, from: 600, to: 2400, gain: 0.3 }], [17.0, 'check', 'pop', { pitch: 'C6', gain: 0.35 }], [17.35, 'check', 'pop', { pitch: 'E6', gain: 0.35 }], [17.7, 'check', 'pop', { pitch: 'G6', gain: 0.35 }],
  [18.45, 'neon', 'tick', { gain: 0.35 }], [19.3, 'profile', 'thud', { gain: 0.45 }], [20.7, 'application', 'whoosh', { len: 0.4, gain: 0.25 }],
  [21.6, 'typing', 'type', { len: 1.4, gain: 0.25 }], [23.05, 'stamp', 'thud', { gain: 0.6 }], [24.15, '90 plaque', 'thud', { gain: 0.5 }], [24.95, '90%', 'bell', { pitch: 'E6', gain: 0.35 }],
  [27.0, 'link', 'whoosh', { len: 0.3, gain: 0.25 }], [30.35, 'you', 'click', { gain: 0.5 }], [30.75, 'family', 'click', { gain: 0.5 }], [31.3, 'finances', 'click', { gain: 0.55 }],
  [32.55, 'more', 'tick', { gain: 0.35 }], [33.6, 'to end', 'whoosh', { len: 0.5, from: 500, to: 2400, gain: 0.4 }], [33.85, 'badge', 'thud', { gain: 0.7 }],
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
const Y = (y) => (FH >= SEAM ? y - (FH - SEAM) : y + (SEAM - FH) * 0.48);   // motion-only: panel centred in the frame

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

// ------------------------------------------------------------------ footage test: VSL Cutdown #4 "The Blank Binder" (film time = source time)
function bank(ctx, cx, cy, w, p, col = C.gold) {   // gold line-art bank that draws on with p
  if (p <= 0.001) return; const h = w * 0.78, lw = w * 0.022;
  ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const seg = (k0, k1) => clamp((p - k0) / (k1 - k0));
  const a = seg(0, 0.3); ctx.beginPath(); ctx.moveTo(-w / 2, -h * 0.22); ctx.lineTo(-w / 2 + w / 2 * Math.min(1, a * 2), -h * 0.22 - h * 0.28 * Math.min(1, a * 2));
  if (a > 0.5) ctx.lineTo(lerp(0, w / 2, (a - 0.5) * 2), lerp(-h * 0.5, -h * 0.22, (a - 0.5) * 2)); ctx.stroke();
  const c = seg(0.25, 0.75); for (let i = 0; i < 5; i++) { const x = lerp(-w * 0.38, w * 0.38, i / 4), k = clamp(c * 5 - i); if (k > 0) { ctx.beginPath(); ctx.moveTo(x, -h * 0.14); ctx.lineTo(x, -h * 0.14 + h * 0.5 * k); ctx.stroke(); } }
  const d = seg(0.7, 1); ctx.beginPath(); ctx.moveTo(-w / 2, h * 0.42); ctx.lineTo(-w / 2 + w * d, h * 0.42); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-w / 2, -h * 0.17); ctx.lineTo(-w / 2 + w * d, -h * 0.17); ctx.stroke();
  ctx.restore();
}
function lock(ctx, cx, cy, s, open, k = 1, col = C.gold) {
  if (k <= 0.01) return; ctx.save(); ctx.translate(cx, cy); ctx.scale(k * s, k * s);
  ctx.strokeStyle = col; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.save(); ctx.translate(18, -6 - open * 26); ctx.rotate(-open * 0.5); ctx.translate(-18, 0);
  ctx.beginPath(); ctx.arc(0, -6, 22, Math.PI, 0); ctx.lineTo(22, 4); ctx.moveTo(-22, -6); ctx.lineTo(-22, 4 + (1 - open) * 0); ctx.stroke(); ctx.restore();
  ctx.fillStyle = goldGrad(ctx, -34, 0, 68, 54); rrect(ctx, -34, 0, 68, 54, 9); ctx.fill();
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(0, 22, 7, 0, TAU); ctx.fill(); ctx.fillRect(-3, 22, 6, 16); ctx.restore();
}
function strikePlaque(ctx, t, label, y, tin, tstrike, seed) {
  plaque(ctx, 540, y, 600, 140, kIn(t, tin), (x) => { txt(x, label, 0, 30, 84, DISPLAY, t > tstrike + 0.1 ? 'rgba(255,255,255,0.55)' : C.white, { track: 2 }); });
  brush(ctx, 250, y + 22, 830, y - 18, -10, 26, P(t, tstrike, tstrike + 0.22, E.outCubic), seed, C.white);
}
// A: the real problem isn't income, side hustle, or even the credit score (0-5.85; motion-only to 2.85, then split)
function sA(ctx, t) {
  if (t > 6.1) return; const ex = P(t, 5.6, 5.9, E.inCubic); ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(-ex * 260, 0);
  rise(ctx, 'THE REAL PROBLEM', 540, Y(150), 96, C.white, P(t, 0.05, 0.4, E.outCubic));
  strikePlaque(ctx, t, 'INCOME', Y(330), 1.5, 2.25, 3);
  strikePlaque(ctx, t, 'SIDE HUSTLE', Y(530), 3.4, 4.05, 5);
  strikePlaque(ctx, t, 'CREDIT SCORE', Y(730), 4.7, 5.25, 7);
  ctx.restore();
}
// B: the banks design the system against you (5.85-9.95, motion-only)
function sB(ctx, t) {
  if (t < 5.7 || t > 10.1) return; const ex = P(t, 9.6, 9.9, E.inCubic); ctx.save(); ctx.globalAlpha = P(t, 5.8, 6.05) * (1 - ex); ctx.translate(0, -ex * 120);
  neon(ctx, 'THE REAL PROBLEM', 540, Y(110), 84, flick(t, 5.85));
  bank(ctx, 540, Y(330), 440, P(t, 7.15, 7.9, E.inOutSine));
  rise(ctx, 'THE SYSTEM', 540, Y(610), 90, C.white, P(t, 8.35, 8.65, E.outCubic));
  const k = kIn(t, 8.85), shake = t > 9.2 ? Math.sin((t - 9.2) * 40) * 6 * Math.exp(-(t - 9.2) * 4) : 0;
  beam(ctx, [540, Y(635)], [610, Y(690)], [540 + shake, Y(735)], 0, P(t, 8.8, 9.2, E.inOutSine), 1, 4);
  person(ctx, 540 + shake, Y(780), 1.0, C.blue, k);
  rise(ctx, 'AGAINST YOU', 540, Y(910), 80, C.light, P(t, 8.85, 9.15, E.outCubic));
  ctx.restore();
}
// C: dependent on them, instead of you knowing how the rules work in your favor (9.95-15.65)
function sC(ctx, t) {
  if (t < 9.8 || t > 15.9) return; const ex = P(t, 15.4, 15.7, E.inCubic); ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(ex * 220, 0);
  const d1 = 1 - P(t, 12.4, 12.8, E.inCubic);   // the dependency scene hands off to the binder
  if (d1 > 0.01) {
    ctx.save(); ctx.globalAlpha *= d1;
    rise(ctx, 'DEPENDENT ON THEM', 540, Y(170), 88, C.white, P(t, 10.0, 10.3, E.outCubic));
    bank(ctx, 790, Y(520), 300, P(t, 10.05, 10.6, E.inOutSine));
    const k = kIn(t, 10.1), sway = Math.sin(t * 2.2) * 8;
    person(ctx, 280, Y(560) + sway, 1.3, C.blue, k);
    beam(ctx, [330, Y(560) + sway], [540, Y(700)], [650, Y(560)], 0, P(t, 10.4, 10.9, E.inOutSine), 1, 4);
    ctx.restore();
  }
  const kb = kIn(t, 12.95), open = P(t, 14.45, 14.85, E.outBack);
  plaque(ctx, 540, Y(470), 520, 380, kb, (x) => {
    txt(x, 'THE', 0, -112, 44, DISPLAY, C.light, { track: 2 }); txt(x, 'RULES', 0, 18, 120, DISPLAY, C.white, { track: 3 });
    lock(x, 0, 78, 1.0, open, 1, C.gold);
  });
  if (open > 0.05) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(540, Y(470), 40, 540, Y(470), 380); g.addColorStop(0, `rgba(203,153,56,${0.35 * Math.min(1, open)})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, Y(40), DW, 860); ctx.restore(); }
  rise(ctx, 'IN YOUR FAVOR', 540, Y(860), 80, C.white, P(t, 14.85, 15.15, E.outCubic));
  ctx.restore();
}
// D: but we do have the rules that work, through the game of credit (15.65-19.2)
function sD(ctx, t) {
  if (t < 15.5 || t > 19.4) return; const ex = P(t, 18.95, 19.2, E.inCubic); ctx.save(); ctx.globalAlpha = P(t, 15.6, 15.85) * (1 - ex); ctx.translate(0, -ex * 140);
  rise(ctx, 'WE HAVE THE RULES', 540, Y(170), 92, C.white, P(t, 16.75, 17.05, E.outCubic));
  const op = P(t, 15.8, 16.5, E.inOutCubic);
  for (const sdir of [-1, 1]) plaque(ctx, 540 + sdir * 200 * op, Y(480), 380, 420, 1, (x) => {
    if (sdir < 0) { txt(x, 'THE', 0, -40, 44, DISPLAY, C.light, { track: 2 }); txt(x, 'RULES', 0, 70, 104, DISPLAY, C.white, { track: 3 }); return; }
    [[17.0, 'APPLY'], [17.35, 'OPTIMIZE'], [17.7, 'REPEAT']].forEach(([tt, w], i) => { const k = P(t, tt, tt + 0.25, E.outCubic); if (k <= 0) return;
      x.save(); x.globalAlpha *= k; x.fillStyle = C.gold; x.beginPath(); x.arc(-130, -95 + i * 95, 16, 0, TAU); x.fill();
      x.strokeStyle = C.ink; x.lineWidth = 5; x.beginPath(); x.moveTo(-138, -95 + i * 95); x.lineTo(-131, -88 + i * 95); x.lineTo(-121, -103 + i * 95); x.stroke();
      txt(x, w, -96 + (1 - k) * 20, -78 + i * 95, 52, DISPLAY, C.white, { align: 'left', track: 1 }); x.restore(); });
  }, { sy: 1 });
  neon(ctx, 'GAME OF CREDIT', 540, Y(860), 92, flick(t, 18.45));
  ctx.restore();
}
// E: how to optimize your credit profile (19.2-20.6, motion-only)
function sE(ctx, t) {
  if (t < 19.05 || t > 20.85) return; const ex = P(t, 20.45, 20.7, E.inCubic); ctx.save(); ctx.globalAlpha = P(t, 19.15, 19.4) * (1 - ex);
  rise(ctx, 'OPTIMIZE', 540, Y(200), 120, C.white, P(t, 19.6, 19.9, E.outCubic));
  plaque(ctx, 540, Y(520), 640, 330, kIn(t, 19.3), (x) => {
    x.fillStyle = C.blue; x.beginPath(); x.arc(-200, -20, 62, 0, TAU); x.fill(); x.fillStyle = C.white; x.beginPath(); x.arc(-200, -38, 20, 0, TAU); x.fill(); x.beginPath(); x.ellipse(-200, 2, 32, 20, 0, Math.PI, TAU); x.fill();
    [0.55, 0.8, 0.95].forEach((v, i) => { const k = P(t, 19.8 + i * 0.12, 20.3 + i * 0.12, E.outCubic); x.fillStyle = 'rgba(255,255,255,0.15)'; x.fillRect(-100, -70 + i * 50, 300, 22); x.fillStyle = [C.gold, C.light, C.teal][i]; x.fillRect(-100, -70 + i * 50, 300 * v * k, 22); });
    txt(x, 'CREDIT PROFILE', 50, 118, 40, DISPLAY, C.light, { track: 1 });
  });
  ctx.restore();
}
// F: what to say on these applications, for up to 90% approval odds (20.6-26.3)
function sF(ctx, t) {
  if (t < 20.5 || t > 26.5) return; const ex = P(t, 26.0, 26.3, E.inCubic); ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(-ex * 240, 0);
  const f1 = 1 - P(t, 23.75, 24.1, E.inCubic);
  if (f1 > 0.01) {
    ctx.save(); ctx.globalAlpha *= f1; ctx.translate(0, -(1 - f1) * 160);
    rise(ctx, 'WHAT TO SAY', 540, Y(170), 92, C.white, P(t, 21.95, 22.25, E.outCubic));
    const k = kIn(t, 20.7); ctx.save(); ctx.translate(540, Y(530)); ctx.scale(k, k); ctx.rotate(-0.03);
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10; ctx.fillStyle = '#F4F6FA'; rrect(ctx, -260, -250, 520, 500, 14); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = C.blue; ctx.fillRect(-260, -250, 520, 70); txt(ctx, 'APPLICATION', 0, -200, 40, DISPLAY, C.white, { track: 2 });
    for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-210, -130 + i * 72, 420, 32); const w = P(t, 21.6 + i * 0.28, 21.9 + i * 0.28, E.outCubic); ctx.fillStyle = '#1C2230'; ctx.fillRect(-200, -122 + i * 72, (180 + 200 * rnd(i + 3)) * w, 16); }
    const st = kIn(t, 23.05); if (st > 0.01) { ctx.save(); ctx.translate(170, 170); ctx.rotate(-0.25); ctx.scale(st, st); ctx.strokeStyle = C.gold; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, 70, 0, TAU); ctx.stroke(); ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(-32, 0); ctx.lineTo(-6, 26); ctx.lineTo(36, -26); ctx.stroke(); ctx.restore(); }
    ctx.restore(); ctx.restore();
  }
  const k2 = kIn(t, 24.15);
  plaque(ctx, 540, Y(470), 620, 330, k2, (x) => {
    txt(x, 'UP TO', 0, -92, 38, DISPLAY, C.light, { track: 1 });
    const v = Math.round(lerp(0, 90, P(t, 24.4, 24.95, E.outCubic))); txt(x, `${v}%`, 0, 80, 190, DISPLAY, C.white, { track: 2 });
  });
  rise(ctx, 'APPROVAL ODDS', 540, Y(800), 92, C.white, P(t, 25.35, 25.65, E.outCubic));
  ctx.restore();
}
// G: find out what's possible for you, your family, your finances, and so much more (26.3-33.5)
function sG(ctx, t) {
  if (t < 26.2 || t > 33.6) return; ctx.save(); ctx.globalAlpha = P(t, 26.3, 26.6);
  const f1 = 1 - P(t, 28.9, 29.25, E.inCubic);
  if (f1 > 0.01) { ctx.save(); ctx.globalAlpha *= f1; rise(ctx, 'CLICK THE LINK', 540, Y(360), 110, C.white, P(t, 27.0, 27.3, E.outCubic)); brush(ctx, 300, Y(420), 780, Y(405), 12, 22, P(t, 27.35, 27.6, E.outCubic), 9); 
    const dy = Math.sin((t - 27.6) * 5) * 14; beam(ctx, [540, Y(520)], [560, Y(640)], [540, Y(760) + dy], 0, P(t, 27.7, 28.2, E.inOutSine), 1, 5); ctx.restore(); }
  rise(ctx, "WHAT'S POSSIBLE", 540, Y(170), 96, C.white, P(t, 29.3, 29.6, E.outCubic));
  [['FOR YOU', 30.35], ['YOUR FAMILY', 30.75], ['YOUR FINANCES', 31.3]].forEach(([w, tt], i) => plaque(ctx, 540, Y(340) + i * 165, 560, 130, kIn(t, tt), (x) => txt(x, w, 0, 28, 74, DISPLAY, C.white, { track: 2 })));
  neon(ctx, '+ SO MUCH MORE', 540, Y(870), 78, flick(t, 32.55));
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
const END = 33.51; window.__END = END;
const LAYOUT = [[0, 'M'], [2.85, 'S'], [5.8, 'M'], [9.9, 'S'], [19.2, 'M'], [20.6, 'S'], [END, 'M']];
const FHV = { M: 0, S: SEAM, F: DH };
const FH_KEYS = LAYOUT.map(([t, m]) => [t, FHV[m]]);
function footH(t) {
  let v = springKeys(t, FH_KEYS, { stiffness: 150, damping: 17 });
  for (let i = 1; i < FH_KEYS.length; i++) v -= Math.sign(FH_KEYS[i][1] - FH_KEYS[i - 1][1]) * 34 * antic(t, FH_KEYS[i][0], 0.22);
  return clamp(v, 0, DH);
}
const FULL_WINDOWS = [];
const CLAIM_FULL = [];
const CLAIM_PANEL = [[24.0, 26.3]];

// ------------------------------------------------------------------ captions
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

// ------------------------------------------------------------------ footage
let FOOT = null; const FCACHE = new Map();
async function loadFrame(t) {
  const idx = Math.min(SRC_FRAMES, Math.max(1, Math.floor(t * SRC_FPS) + 1));
  if (!FCACHE.has(idx)) { const im = new Image(); im.src = `assets/footage/f_${String(idx).padStart(5, '0')}.jpg`; try { await im.decode(); } catch { return; } FCACHE.set(idx, im); while (FCACHE.size > 8) FCACHE.delete(FCACHE.keys().next().value); }
  FOOT = FCACHE.get(idx);
}
function pushIn(t) { for (const [a, b] of FULL_WINDOWS) if (t >= a - 0.5 && t < b + 0.8) return Math.pow(1.1, P(t, a, b + 0.8, E.inOutSine)); return 1; }
const FAST = [0.05, 1.5, 2.25, 2.85, 3.4, 4.05, 4.7, 5.25, 5.6, 7.15, 8.85, 9.6, 10.1, 12.4, 12.95, 14.45, 15.4, 15.8, 17.0, 18.45, 18.95, 19.3, 20.45, 21.6, 23.05, 23.75, 24.15, 26.0, 27.0, 28.9, 30.35, 31.3, 33.5]; const _OLD_FAST = [1.15, 2.2, 4.1, 6.26, 6.8, 8.3, 9.2, 9.94, 11.15, 12.1, 13.5, 14.3, 17.0, 18.25, 19.85, 21.45, 22.3, 23.08, 23.85, 32.3, 33.1, 34.48, 35.3, 35.8, 36.4, 38.5, 40.5, 43.58, 44.25, 49.6, 51.9, 53.3, 55.1, 56.7];
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
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, DW, DH); ctx.save(); ctx.translate(0, Y(0)); background(ctx, t); ctx.restore();
    { const m = 1 + 0.25 * clamp(1 - fh / SEAM); ctx.save(); ctx.translate(540, 960); ctx.scale(m, m); ctx.translate(-540, -960);   // motion-only: graphics grow to fill the frame
    sA(ctx, t); sB(ctx, t); sC(ctx, t); sD(ctx, t); sE(ctx, t); sF(ctx, t); sG(ctx, t); ctx.restore(); }
    // tracker removed (user: no small text on top)
    if (CLAIM_PANEL.some(([a, b]) => t > a && t < b)) txt(ctx, 'Individual results vary. Education only.', 540, Y(170), 24, UI, C.white, { alpha: 0.8 * pa, weight: 500 });
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
