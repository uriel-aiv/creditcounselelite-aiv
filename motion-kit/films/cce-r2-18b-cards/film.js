// CCE — "18 Card Ribbon" founder split-screen. Pure function of time: window.seek(t) paints frame t.
// Style: isometric shapes built from hundreds of white credit cards standing edge to edge (a card ribbon),
// on flat riso blue. Every unit in a shape is a credit card. Cards stand up in domino waves to build a shape,
// fly in flocks from one shape to the next, stream along a path, and stack flat into piles.
// Clip: Video 12 "Watch out for the fee" (about 3%, some banks, the last year, closer to 5%, flat fee).
import * as M from './lib/motion.js';
import * as BR from './lib/brand.js';

const { W, H, E, prog, clamp, lerp, spring, springKeys, SPRING, font, mulberry32, cover, hash01 } = M;
const DW = 1080, DH = 1920, S = W / DW, TAU = M.TAU;
const C = { bg: '#0B48C8', bg2: '#0838A8', ink: '#123A9E', inkSoft: '#3D63C9', card: '#FFFFFF', shade: '#C9D6F5', white: '#FFFFFF', gold: '#CB9938', light: '#ADC8E3', speck: '#06205E' };
const DISPLAY = 'Display', UI = 'UI';
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 369;
const SEAM = 980;
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);
const P = (t, a, b, ease = E.inOutCubic) => ease(prog(t, a, b));
const antic = (t, t0, dur = 0.2) => { const p = prog(t, t0 - dur, t0 + 0.02); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; };
const outK = (t, t0, d = 0.25) => 1 - E.inBack(prog(t, t0, t0 + d), 1.7);
let FH = DH;
const Y = (y) => (FH >= SEAM ? y - (FH - SEAM) : y + (SEAM - FH) * 0.48);

// ================================================================== card world
// World units: one card is 1.0 wide (across its ribbon) and 0.63 tall. Cards stand perpendicular to their path.
const CW = 1.0, CH = 0.63, SPC = 0.1;          // card size, spacing along a ribbon
const N = 760;                                   // every shape is made of the same 760 cards
const v3 = (x, y, z) => [x, y, z];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const UP = [0, 1, 0];
// glyph space (u right, v up, in card widths) -> ground plane. Screen-right on the ground is (1,0,-1)/√2,
// screen-up is (-1,0,-1)/√2; v is stretched so shapes read upright through the isometric squash.
const GA = Math.PI / 4 + 0.26;   // shapes turned a little off the isometric axes so straight ribbons show their depth
const GR = [Math.cos(GA), 0, -Math.sin(GA)], GU = [-Math.sin(GA), 0, -Math.cos(GA)], VS = 1.45;
const G = (u, v, y = CH / 2) => [GR[0] * u + GU[0] * v * VS, y, GR[2] * u + GU[2] * v * VS];
// camera: isometric projection, scale K px per unit, centred on a world point
let CAM = { K: 46, ux: 0, uy: 0, sx: 540, sy: 470 };
const proj1 = (p) => [(p[0] - p[2]) * 0.866, (p[0] + p[2]) * 0.5 - p[1]];
function proj(p) { const q = proj1(p); return [CAM.sx + CAM.K * (q[0] - CAM.ux), CAM.sy + CAM.K * (q[1] - CAM.uy)]; }
// frame a shape: its projected bounds (cards included) fill a box of bw x bh px
function fit(cards, bw = 860, bh = 470, extra = []) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  const pts = []; cards.forEach((c) => { if (c.vis) { pts.push(c.p, add(c.p, [0, CH / 2, 0]), sub(c.p, [0, CH / 2, 0])); } }); extra.forEach((p) => pts.push(p));
  pts.forEach((p) => { const q = proj1(p); x0 = Math.min(x0, q[0] - 0.5); x1 = Math.max(x1, q[0] + 0.5); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
  return { K: Math.min(bw / (x1 - x0), bh / (y1 - y0)), ux: (x0 + x1) / 2, uy: (y0 + y1) / 2 };
}
const VIEW = norm([1, 1.15, 1]);                 // towards the viewer

// ---- shapes: lists of strokes (polylines in glyph space), sampled to cards at fixed spacing
const seg = (a, b) => [a, b];
const arc = (cx, cy, rx, ry, a0, a1, n = 64) => Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const bez = (p0, c0, c1, p1, n = 60) => Array.from({ length: n + 1 }, (_, i) => { const k = i / n, m = 1 - k; return [m * m * m * p0[0] + 3 * m * m * k * c0[0] + 3 * m * k * k * c1[0] + k * k * k * p1[0], m * m * m * p0[1] + 3 * m * m * k * c0[1] + 3 * m * k * k * c1[1] + k * k * k * p1[1]]; });
function sampleStroke(pts, step) {
  const out = []; let acc = 0, need = step / 2;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    while (acc + L >= need) { const k = (need - acc) / L; out.push({ u: lerp(a[0], b[0], k), v: lerp(a[1], b[1], k), tu: (b[0] - a[0]) / L, tv: (b[1] - a[1]) / L }); need += step; }
    acc += L;
  }
  return out;
}
// a shape -> N card slots {p, T (path tangent = card face normal), vis, s (0..1 build order)}; spare cards hide in `pile`
function shape(strokes, { pile = [0, 0], scale = 1, y = CH / 2 } = {}) {
  const cards = [];
  strokes.forEach((st) => sampleStroke(st.map(([u, v]) => [u * scale, v * scale]), SPC).forEach((c) => {
    const p = G(c.u, c.v, y), T = norm([GR[0] * c.tu + GU[0] * c.tv * VS, 0, GR[2] * c.tu + GU[2] * c.tv * VS]);
    cards.push({ p, T, vis: 1 });
  }));
  if (cards.length > N) console.warn('shape has', cards.length, 'cards > N');
  const used = cards.length;
  cards.forEach((c, i) => (c.s = i / Math.max(1, used - 1)));
  const pp = G(pile[0] * scale, pile[1] * scale, CH / 2);
  while (cards.length < N) cards.push({ p: pp, T: norm(GU), vis: 0, s: 1 });
  cards.used = used;
  return cards;
}
// piles: cards lying flat, stacked up (the path runs straight up, so every card lies flat)
function piles(list) {   // list of [u, v, count]
  const cards = []; const TH = 0.034;
  list.forEach(([u, v, n], pi) => { const g = G(u, v, 0); for (let i = 0; i < n; i++) { const j = pi * 1000 + i; cards.push({ p: [g[0] + 0.05 * (hash01(j, 4) - 0.5), 0.02 + i * TH, g[2] + 0.05 * (hash01(j, 5) - 0.5)], T: UP, vis: 1, flat: true, yaw: 0.12 * (hash01(j, 6) - 0.5), pile: pi }); } });
  const used = cards.length; cards.forEach((c, i) => (c.s = i / Math.max(1, used - 1)));
  while (cards.length < N) cards.push({ p: G(0, 0, 0), T: UP, vis: 0, s: 1 });
  cards.used = used; return cards;
}

// ---- the shapes of this film
const PCT = (du) => [seg([0.6 + du, 0.4], [6.4 + du, 9.6]), arc(1.7 + du, 7.9, 1.25, 1.6, -Math.PI / 2, -Math.PI / 2 + TAU, 40), arc(5.3 + du, 2.1, 1.25, 1.6, Math.PI / 2, Math.PI / 2 + TAU, 40)];
const THREE_PCT = [
  arc(-3.9, 7.3, 2.2, 2.2, Math.PI * 0.85, -Math.PI / 2, 50),      // 3: upper bowl
  arc(-3.9, 2.6, 2.6, 2.5, Math.PI / 2, -Math.PI * 0.85, 56),      // 3: lower bowl
  ...PCT(0),
];
const FIVE_PCT = [
  seg([-1.5, 9.6], [-5.6, 9.6]), seg([-5.6, 9.6], [-5.9, 5.4]),     // 5: top bar, stem
  arc(-3.7, 3.1, 2.6, 2.7, Math.PI * 0.8, -Math.PI * 0.85, 60),     // 5: bowl
  ...PCT(0),
];
const BANK = [
  seg([-6.2, 0], [6.2, 0]),
  ...[-4.3, -1.45, 1.45, 4.3].map((x) => seg([x, 1.3], [x, 6.3])),
  seg([-6.2, 7.5], [6.2, 7.5]),
  [[-6.6, 8.7], [0, 12.6], [6.6, 8.7]],
];
const shift = (strokes, du, dv = 0, sc = 1) => strokes.map((st) => st.map(([u, v]) => [u * sc + du, v * sc + dv]));
const BANKS3 = [...shift(BANK, -15.2, -1.2, 1), ...shift(BANK, 0, 1.2, 1), ...shift(BANK, 15.2, -1.2, 1)];
const RING = [
  arc(0, 5, 6, 5.2, Math.PI / 2, Math.PI / 2 - TAU, 120),           // the year: a clock ring, drawn clockwise from 12
  ...Array.from({ length: 12 }, (_, m) => { const a = Math.PI / 2 - (m / 12) * TAU; return seg([Math.cos(a) * 4.3, 5 + Math.sin(a) * 3.7], [Math.cos(a) * 3.3, 5 + Math.sin(a) * 2.85]); }),   // month ticks
];
const FLAT = [seg([-9, 4], [9, 4])];

// ================================================================== drawing one card
// corners from centre c, path tangent T; a = stand-up angle (0 = standing, π/2 = lying back along the path)
function cardFrame(c, T, a = 0, sc = 1, yaw = 0) {
  let e1 = cross(UP, T); if (Math.hypot(...e1) < 1e-3) e1 = [Math.cos(yaw) * GR[0] - Math.sin(yaw) * GR[2], 0, Math.sin(yaw) * GR[0] + Math.cos(yaw) * GR[2]]; e1 = norm(e1);
  let e2 = norm(cross(T, e1));
  if (e1[0] - e1[2] < 0) e1 = mul(e1, -1);   // card art always reads left-to-right on screen
  const w = CW * sc, h = CH * sc;
  if (a !== 0) { const bottom = sub(c, mul(e2, h / 2)); e2 = norm(sub(mul(e2, Math.cos(a)), mul(T, Math.sin(a)))); c = add(bottom, mul(e2, h / 2)); }
  return { o: sub(sub(c, mul(e1, w / 2)), mul(e2, h / 2)), ex: mul(e1, w), ey: mul(e2, h), c, n: cross(e1, e2) };
}
function rrPath(ctx, rx, ry) {   // rounded rect in unit card space (0..1 x 0..1)
  ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(1 - rx, 0); ctx.quadraticCurveTo(1, 0, 1, ry); ctx.lineTo(1, 1 - ry); ctx.quadraticCurveTo(1, 1, 1 - rx, 1);
  ctx.lineTo(rx, 1); ctx.quadraticCurveTo(0, 1, 0, 1 - ry); ctx.lineTo(0, ry); ctx.quadraticCurveTo(0, 0, rx, 0); ctx.closePath();
}
function drawCard(ctx, f, { alpha = 1, hero = false, tint = 0 } = {}) {
  const o = proj(f.o), px = proj(add(f.o, f.ex)), py = proj(add(f.o, f.ey));
  const ax = px[0] - o[0], ay = px[1] - o[1], bx = py[0] - o[0], by = py[1] - o[1];
  const area = Math.abs(ax * by - ay * bx);
  const facing = Math.abs(dot(norm(f.n), VIEW));
  ctx.save(); ctx.globalAlpha *= alpha;
  const base = ctx.getTransform();
  ctx.transform(ax, ay, bx, by, o[0], o[1]);
  rrPath(ctx, 0.07, 0.11);
  ctx.setTransform(base);
  ctx.fillStyle = M.mix(C.shade, C.card, clamp(0.35 + facing * 0.9 - tint)); ctx.fill();
  ctx.lineWidth = hero ? 2.4 : 1.25; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
  // card art, only where the face is big enough to read: chip, number groups, network rings, signature stripe
  if (area > 260) {
    const lw = hero ? 2.2 : 1.3, k = clamp((area - 260) / 500);
    ctx.globalAlpha *= k; ctx.strokeStyle = C.ink; ctx.lineWidth = lw; ctx.lineCap = 'round';
    const Q = (u, v) => [o[0] + ax * u + bx * v, o[1] + ay * u + by * v];
    const poly = (pts, close = false) => { ctx.beginPath(); pts.forEach(([u, v], i) => { const q = Q(u, v); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); if (close) ctx.closePath(); ctx.stroke(); };
    poly([[0.09, 0.56], [0.25, 0.56], [0.25, 0.8], [0.09, 0.8]], true);                       // chip
    poly([[0.09, 0.68], [0.25, 0.68]]); poly([[0.17, 0.56], [0.17, 0.8]]);
    for (let g = 0; g < 4; g++) poly([[0.09 + g * 0.21, 0.36], [0.24 + g * 0.21, 0.36]]);     // number groups
    poly([[0.09, 0.17], [0.42, 0.17]]);                                                       // name line
    for (const cx of [0.78, 0.86]) { ctx.beginPath(); for (let i = 0; i <= 24; i++) { const a = (i / 24) * TAU, q = Q(cx + 0.07 * Math.cos(a), 0.2 + 0.11 * Math.sin(a)); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); } ctx.stroke(); }
  }
  ctx.restore();
}
// soft contact shadow on the ground under a standing card (drawn before all cards)
function cardShadow(ctx, f, alpha) {
  if (alpha <= 0.01) return;
  const b0 = f.o, b1 = add(f.o, f.ex);
  if (b0[1] > 0.12 && b1[1] > 0.12) return;
  const off = [0.22, 0, 0.12];
  const q = [proj([b0[0], 0, b0[2]]), proj([b1[0], 0, b1[2]]), proj(add([b1[0], 0, b1[2]], off)), proj(add([b0[0], 0, b0[2]], off))];
  ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
}

// ================================================================== the card system over time
// Keyframes: each holds a shape; cards stand up (build), fly to the next shape (morph), or stream along it (flow).
// state(t) -> per card {p, T, a (stand angle), vis, sc}
const SH = {}, CF = {};
function buildShapes() {
  SH.three = shape(THREE_PCT, { pile: [0, 5], scale: 0.7 });
  SH.bank = shape(BANK, { pile: [0, 5], scale: 0.62 });
  SH.banks = shape(BANKS3, { pile: [0, 5], scale: 0.4 });
  SH.ring = shape(RING, { pile: [0, 5], scale: 0.72 });
  SH.five = shape(FIVE_PCT, { pile: [0, 5], scale: 0.7 });
  SH.flat = shape(FLAT, { pile: [0, 4], scale: 0.8 });
  CF.three = fit(SH.three, 820, 470, [G(6.6 * 0.7 + 1.5, 0.5, 2.6), G(6.6 * 0.7 + 1.5, -0.8, 0)]); CF.bank = fit(SH.bank); CF.banks = fit(SH.banks, 900, 470);
  CF.ring = fit(SH.ring, 760, 470); CF.five = fit(SH.five, 820, 470); CF.flat = fit(SH.flat, 860, 300);
}
// morph between shapes A -> B from t0 over `spread` (stagger) + `dur` (each card's flight), with an arc lift
function morph(A, B, t, t0, spread = 0.55, dur = 0.5, lift = 2.6) {
  const out = new Array(N);
  for (let i = 0; i < N; i++) {
    const a = A[i], b = B[i], st = t0 + spread * (i / N) + 0.03 * hash01(i, 7);
    const k = E.inOutCubic(prog(t, st, st + dur));
    const p = lerp3(a.p, b.p, k); p[1] += Math.sin(Math.PI * k) * lift * (0.85 + 0.3 * hash01(i, 3));
    let T = lerp3(a.T, b.T, k); T = add(T, mul(UP, Math.sin(Math.PI * k) * 0.45)); T = norm(T);   // cards tip forward in flight
    const vis = lerp(a.vis, b.vis, k), sc = vis;
    out[i] = { p, T, a: 0, vis, sc, k, yaw: lerp(a.yaw || 0, b.yaw || 0, k) };
  }
  return out;
}
// a travelling ripple: every `per` seconds a lift wave runs through the shape in build order (keeps held shapes alive)
function ripple(S, A, t, t0, per) {
  if (t < t0) return S;
  return S.map((c, i) => { if (!A[i].vis) return c; const ph = ((t - t0) / per) % 1.6 - A[i].s; const l = ph > 0 && ph < 0.12 ? 0.3 * Math.sin(Math.PI * ph / 0.12) : 0; return l ? { ...c, p: add(c.p, [0, l, 0]), a: -0.25 * Math.sin(Math.PI * ph / 0.12) } : c; });
}
const still = (A, extra = {}) => A.map((c) => ({ p: c.p, T: c.T, a: 0, vis: c.vis, sc: c.vis, yaw: c.yaw || 0, ...extra }));

// ---- timeline (seconds; Video 12 word timings)
const T_BUILD = 0.95, T_BUILD_D = 0.85;          // "about 3%": the 3% stands up in a domino wave
const T_FEE = 2.84;                               // "fee": a hero card with a 3% tag pops in front
const T_YES = 3.58;                               // "Yes": a riffle runs through the 3%
const T_M1 = 4.45;                                // 3% -> one bank ("some, like Chase")
const T_M2 = 6.45;                                // one bank -> three banks ("other banks")
const T_M3 = 7.95;                                // banks -> a year ring ("the last year or so")
const T_SWEEP = [8.62, 9.7];                      // the year sweeps around the ring
const T_M4 = 10.05;                               // ring -> 5% ("more of that, closer to 5%")
const T_M5 = 11.55;                               // 5% -> one flat row
const T_TOPPLE = 11.95;                           // "flat fee": the row topples flat like dominoes

function build(A, t, t0, dur) {
  return A.map((c) => {
    const st = t0 + dur * c.s, d = t - st;
    if (!c.vis || d < -0.02) return { p: c.p, T: c.T, a: 0, vis: 0, sc: 0 };
    const a = d < 0.16 ? (Math.PI / 2) * (1 - E.outCubic(d / 0.16)) : -0.18 * Math.exp(-(d - 0.16) * 9) * Math.sin((d - 0.16) * 30);
    return { p: c.p, T: c.T, a, vis: 1, sc: clamp(d / 0.06) };
  });
}
function state(t) {
  if (t < T_M1) {
    let S = build(SH.three, t, T_BUILD, T_BUILD_D);
    S = ripple(S, SH.three, t, 1.95, 0.85);
    const rd = (i) => t - T_YES - SH.three[i].s * 0.4;   // "Yes": one quick riffle
    return S.map((c, i) => { const d = rd(i); return d > 0 && d < 0.25 && c.vis ? { ...c, a: c.a - 0.55 * Math.sin(Math.PI * d / 0.25) } : c; });
  }
  if (t < T_M2) return ripple(morph(SH.three, SH.bank, t, T_M1, 0.5, 0.5, 2.6), SH.bank, t, T_M1 + 1.2, 0.8);
  if (t < T_M3) return ripple(morph(SH.bank, SH.banks, t, T_M2, 0.45, 0.45, 2.2), SH.banks, t, T_M2 + 0.95, 0.7);
  if (t < T_M4) {
    const S = morph(SH.banks, SH.ring, t, T_M3, 0.5, 0.45, 2.4);
    // the year: a lift wave sweeps once around the ring, clockwise from 12; the ticks pop as it passes
    const used = SH.ring.used, ringN = Math.round(used * 0.82);
    return S.map((c, i) => {
      if (i >= used) return c;
      const sweep = P(t, T_SWEEP[0], T_SWEEP[1], E.inOutSine), pos = i < ringN ? i / ringN : (Math.floor((i - ringN) / ((used - ringN) / 12)) + 0.5) / 12;
      const d = sweep - pos; const l = d > 0 && d < 0.1 ? Math.sin(Math.PI * d / 0.1) : 0;
      return l ? { ...c, p: add(c.p, [0, 0.45 * l, 0]), a: -0.35 * l } : c;
    });
  }
  if (t < T_M5) return ripple(morph(SH.ring, SH.five, t, T_M4, 0.45, 0.45, 2.6), SH.five, t, T_M4 + 1.0, 0.8);
  // flat fee: the 5% flies into one straight row, then the row topples flat in a domino run
  return morph(SH.five, SH.flat, t, T_M5, 0.3, 0.38, 2.0).map((c, i) => {
    if (!SH.flat[i].vis) return c;
    const d = t - T_TOPPLE - SH.flat[i].s * 0.45;
    if (d <= 0) return c;
    const a = d < 0.14 ? (Math.PI / 2 - 0.08) * E.inCubic(d / 0.14) : (Math.PI / 2 - 0.08) + 0.06 * Math.exp(-(d - 0.14) * 10) * Math.sin((d - 0.14) * 30);
    return { ...c, a: -a };
  });
}

// hero card: a card with a gold "3%" tag pops in front of the 3% on "fee", and leaves with the 3%
function heroes(t) {
  const H = [], k = clamp(sp(t, T_FEE, SPRING.bouncy)) * outK(t, T_M1 + 0.05);
  if (k > 0.01) { const p = G(6.6 * 0.7 + 1.5, -0.8, 0); H.push({ c: add(p, [0, CH * 3.3 / 2 * k, 0]), T: norm(GU), sc: 3.3 * k, tilt: -0.2, gold: true, tag: '3%' }); }
  return H;
}

// camera: each scene frames its shape (auto-fit), easing from one framing to the next while the cards fly
const CAMK = [[0, 'three'], [T_M1, 'bank'], [T_M2, 'banks'], [T_M3, 'ring'], [T_M4, 'five'], [T_M5, 'flat']];
function camAt(t) {
  let i = 0; while (i < CAMK.length - 1 && t >= CAMK[i + 1][0]) i++;
  const b = CF[CAMK[i][1]], a = i ? CF[CAMK[i - 1][1]] : b, k = i ? E.inOutCubic(prog(t, CAMK[i][0] + 0.1, CAMK[i][0] + 0.9)) : 1;
  const K = Math.exp(lerp(Math.log(a.K), Math.log(b.K), k)) * (1 + 0.012 * Math.sin(t * 0.6));
  return { K, ux: lerp(a.ux, b.ux, k), uy: lerp(a.uy, b.uy, k) };
}

function drawCards(ctx, t) {
  const cm = camAt(t); CAM = { ...CAM, ...cm, sx: 540, sy: Y(575) };
  const S = state(t), list = [];
  for (let i = 0; i < N; i++) { const c = S[i]; if (c.vis < 0.02 || c.sc < 0.02) continue; const f = cardFrame(c.p, c.T, c.a, c.sc, c.yaw || 0); list.push({ f, d: f.c[0] + f.c[1] * 1.15 + f.c[2], alpha: clamp(c.vis * 1.5) }); }
  for (const h of heroes(t)) { const T = norm(add(h.T, mul(GR, h.tilt))), f = cardFrame(add(h.c, [0, 0, 0]), T, 0, h.sc); list.push({ f, d: f.c[0] + f.c[2] + 0.4, hero: true, gold: h.gold, tag: h.tag }); }
  // shadows first, then cards back to front
  ctx.save(); ctx.fillStyle = 'rgba(3,22,80,0.22)'; for (const it of list) cardShadow(ctx, it.f, 1); ctx.restore();
  list.sort((a, b) => a.d - b.d);
  for (const it of list) drawCard(ctx, it.f, { alpha: it.alpha ?? 1, hero: it.hero });
  // the gold edge on a hero 0% card (a thin gold rule on its face)
  for (const it of list) if (it.gold) { const o = proj(it.f.o), px = proj(add(it.f.o, it.f.ex)), py = proj(add(it.f.o, it.f.ey)); ctx.save(); ctx.transform(px[0] - o[0], px[1] - o[1], py[0] - o[0], py[1] - o[1], o[0], o[1]); ctx.beginPath(); ctx.rect(0.62, 0.62, 0.3, 0.2); ctx.restore(); ctx.fillStyle = C.gold; ctx.fill(); txtAt(ctx, it.f, it.tag || '0%', 0.77, 0.72, 0.17); }
}
// text printed on a card face (affine-mapped)
function txtAt(ctx, f, s, u, v, size) {
  const o = proj(f.o), px = proj(add(f.o, f.ex)), py = proj(add(f.o, f.ey));
  ctx.save(); ctx.transform(px[0] - o[0], px[1] - o[1], py[0] - o[0], py[1] - o[1], o[0], o[1]); ctx.translate(u, v); ctx.scale(1, -1);
  ctx.font = font(100, 400, DISPLAY); const w = ctx.measureText(s).width; ctx.scale(size / 100 * 0.63, size / 100); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText(s, 0, 34); ctx.restore();
}

// ================================================================== labels
function label(ctx, s, t, a, b, size = 120, y = 190) {
  if (t < a - 0.02 || t > b + 0.3) return;
  const k = clamp(sp(t, a, SPRING.bouncy)) * outK(t, b, 0.2);
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(540, Y(y) - Math.max(0, SEAM - FH) * 0.26); ctx.scale(lerp(0.85, 1, k), lerp(0.85, 1, k)); ctx.globalAlpha = clamp(k * 1.4);
  ctx.font = font(size, 400, DISPLAY); ctx.textAlign = 'center'; ctx.fillStyle = C.white; ctx.fillText(s, 0, size * 0.36);
  ctx.restore();
}
function labels(ctx, t) {
  label(ctx, 'COMMON FEE', t, 2.6, 4.35, 124);
  label(ctx, 'SOME BANKS', t, 4.55, 6.5, 124);
  label(ctx, 'OTHER BANKS', t, 6.6, 7.95, 124);
  label(ctx, 'THE LAST YEAR', t, 8.6, 9.95, 120);
  label(ctx, 'CLOSER TO', t, 10.68, 11.6, 124);
  label(ctx, 'FLAT FEE', t, 11.76, END - 0.1, 150);
  const dk = P(t, 1.0, 1.3) * (1 - P(t, END - 0.2, END));
  if (dk > 0.01) { ctx.save(); ctx.globalAlpha = 0.85 * dk; ctx.font = font(24, 500, UI); ctx.textAlign = 'center'; ctx.fillStyle = C.white; ctx.fillText('Individual results vary. Education only.', 540, Y(285) - Math.max(0, SEAM - FH) * 0.26); ctx.restore(); }
}

// ================================================================== layout over time
const END = 12.71; window.__END = END;
const FH_KEYS = [[0, 1920], [0.9, SEAM], [END, 0]];
function footH(t) {
  let v = springKeys(t, FH_KEYS, { stiffness: 150, damping: 17 });
  for (let i = 1; i < FH_KEYS.length; i++) v -= Math.sign(FH_KEYS[i][1] - FH_KEYS[i - 1][1]) * 34 * antic(t, FH_KEYS[i][0], 0.22);
  return clamp(v, 0, DH);
}
const FULL_WINDOWS = [[0, 0.9]];

// ================================================================== sound (from the same timing constants)
function buildHits() {
  const h = [];
  const used = SH_USED.three; for (let i = 0; i < used; i += 12) h.push([T_BUILD + T_BUILD_D * (i / used), 'flick', 'tick', { gain: 0.1 + 0.08 * hash01(i, 2) }]);
  h.push([T_BUILD + T_BUILD_D + 0.02, 'built', 'click', { gain: 0.35 }]);
  h.push([T_FEE, 'fee card', 'thud', { gain: 0.42 }], [T_FEE + 0.05, 'tag', 'pop', { pitch: 'E6', gain: 0.25 }]);
  for (let i = 0; i < 7; i++) h.push([T_YES + i * 0.05, 'riffle', 'tick', { gain: 0.12 }]);
  const flock = (t0, n = 10, spc = 0.05, g = 0.1) => { h.push([t0, 'whoosh', 'whoosh', { len: 0.55, from: 500, to: 2600, gain: 0.22 }]); for (let i = 0; i < n; i++) h.push([t0 + 0.42 + i * spc, 'land', 'tick', { gain: g }]); };
  flock(T_M1); flock(T_M2); flock(T_M3); flock(T_M4); flock(T_M5, 6, 0.045);
  h.push([5.1, 'Chase', 'click', { gain: 0.3 }], [6.76, 'other banks', 'click', { gain: 0.3 }]);
  for (let m = 0; m < 12; m++) h.push([T_SWEEP[0] + (T_SWEEP[1] - T_SWEEP[0]) * E.inOutSine(m / 12) , 'month', 'tok', { pitch: ['C5', 'D5', 'E5', 'G5'][m % 4], gain: 0.14 }]);
  h.push([11.1, '5%', 'pop', { pitch: 'G5', gain: 0.3 }]);
  for (let i = 0; i < 16; i++) h.push([T_TOPPLE + 0.12 + i * 0.45 / 16, 'domino', 'tick', { gain: 0.16 + 0.1 * (i / 16) }]);
  h.push([T_TOPPLE + 0.62, 'flat', 'thud', { gain: 0.35 }]);
  return h.sort((a, b) => a[0] - b[0]);
}
const SH_USED = { three: 340 };

// ================================================================== captions
let CAPS = [];
function buildCaptions(words) {
  const fix = [];
  for (let i = 0; i < words.length; i++) { let [a, b, w] = words[i]; if (!w || !w.trim()) continue; w = w.replace(/\$/g, ''); if (/^,\d/.test(w) && fix.length) { fix[fix.length - 1][2] += w; fix[fix.length - 1][1] = b; continue; } fix.push([a, b, w]); }
  const chunks = []; let cur = null;
  for (const [a, b, w] of fix) { if (!cur || cur.n >= 3 || /[.,?]$/.test(cur.text) || a - cur.end > 0.35) { cur = { start: a, end: b, text: w, n: 1 }; chunks.push(cur); } else { cur.text += ' ' + w; cur.end = b; cur.n++; } }
  chunks.forEach((c, i) => { c.until = Math.min(chunks[i + 1] ? chunks[i + 1].start : c.end + 0.5, c.end + 0.6); c.text = c.text.replace(/[,]$/, '').toUpperCase(); });
  return chunks;
}

// ================================================================== textures: flat riso blue, specks, grain
let BG, GRAIN = [], LAYER, LCTX;
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function buildTextures() {
  BG = makeCanvas(W, H); const p = BG.getContext('2d'), r = mulberry32(18);
  p.fillStyle = C.bg; p.fillRect(0, 0, W, H);
  const g = p.createRadialGradient(W / 2, H * 0.3, 40, W / 2, H * 0.35, H * 0.85); g.addColorStop(0, 'rgba(40,110,255,0.22)'); g.addColorStop(1, 'rgba(0,10,60,0.25)'); p.fillStyle = g; p.fillRect(0, 0, W, H);
  // riso specks: clustered dark flecks, heavier near the edges (like the print reference)
  for (let i = 0; i < 2600; i++) {
    const x = r() * W, y = r() * H, edge = Math.min(x, W - x, y, H - y) / (W * 0.5), keep = r() < 0.25 + 0.75 * (1 - clamp(edge * 2.2));
    if (!keep) continue; p.fillStyle = `rgba(6,26,90,${0.25 + r() * 0.45})`; const s = (0.6 + r() * 2.2) * S; p.beginPath(); p.ellipse(x, y, s, s * (0.5 + r()), r() * 3, 0, TAU); p.fill();
  }
  for (let i = 0; i < W * H / 26; i++) { p.fillStyle = r() < 0.5 ? 'rgba(0,10,50,0.08)' : 'rgba(150,190,255,0.06)'; p.fillRect(r() * W, r() * H, 1, 1); }
  for (let v = 0; v < 4; v++) {
    const c = makeCanvas(W, H), x = c.getContext('2d'), rr = mulberry32(300 + v), img = x.createImageData(W, H);
    for (let i = 0; i < img.data.length; i += 4) { const n = rr() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = n; img.data[i + 3] = 255; }
    x.putImageData(img, 0, 0); GRAIN.push(c);
  }
  LAYER = makeCanvas(W, H); LCTX = LAYER.getContext('2d');
}

// ================================================================== footage
let FOOT = null; const FCACHE = new Map();
async function loadFrame(t) {
  const idx = Math.min(SRC_FRAMES, Math.max(1, Math.floor(t * SRC_FPS) + 1));
  if (!FCACHE.has(idx)) { const im = new Image(); im.src = `assets/footage/f_${String(idx).padStart(5, '0')}.jpg`; try { await im.decode(); } catch { return; } FCACHE.set(idx, im); while (FCACHE.size > 8) FCACHE.delete(FCACHE.keys().next().value); }
  FOOT = FCACHE.get(idx);
}
function pushIn(t) { for (const [a, b] of FULL_WINDOWS) if (t >= a - 0.5 && t < b + 0.8) return Math.pow(1.1, P(t, a, b + 0.8, E.inOutSine)); return 1; }
const FAST = [T_M1, T_M2, T_M3, T_M4, T_M5, T_BUILD, T_TOPPLE];
const near = (t) => FAST.some((k) => t > k - 0.1 && t < k + 1.3) || FH_KEYS.some(([k]) => t > k - 0.25 && t < k + 0.8);

M.film({
  fonts: [font(96, 400, 'Display'), font(46, 600, 'UI'), font(24, 500, 'UI'), font(40, 800, UI)],
  images: { badge: 'assets/badge.png' },
  hits: buildHits(),
  samples: (t) => (near(t) ? 6 : 2),
  async init() {
    buildTextures(); buildShapes();
    CAPS = buildCaptions(await fetch('assets/words.json').then((r) => r.json()));
  },
  prepare: (t) => loadFrame(t),
  draw(ctx, u, t, IMG) {
    const fh = footH(t); FH = fh;
    ctx.drawImage(BG, 0, 0);
    LCTX.setTransform(1, 0, 0, 1, 0, 0); LCTX.clearRect(0, 0, W, H); LCTX.setTransform(S, 0, 0, S, 0, 0);
    { const m = 1 + 0.25 * clamp(1 - fh / SEAM); LCTX.translate(540, 960); LCTX.scale(m, m); LCTX.translate(-540, -960); drawCards(LCTX, t); }
    ctx.drawImage(LAYER, 0, 0);
    ctx.save(); ctx.scale(S, S);
    labels(ctx, t);
    if (FOOT && fh > 1) {
      cover(ctx, FOOT, 0, DH - fh, DW, fh, { fx: 0.5, fy: lerp(0.25, 0.45, clamp((fh - SEAM) / (DH - SEAM))), zoom: pushIn(t) });
      if (fh < DH - 2) { ctx.fillStyle = C.white; ctx.globalAlpha = 0.9; ctx.fillRect(0, DH - fh - 1.5, DW, 3); ctx.globalAlpha = 1; }
    }
    BR.captions(ctx, t, fh, CAPS);
    ctx.restore();
  },
  post(ctx, u, t) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.1; ctx.drawImage(GRAIN[Math.floor(t * 24) % 4], 0, 0); ctx.restore(); },
});
