// CCE — "18 Card Ribbon" founder split-screen. Pure function of time: window.seek(t) paints frame t.
// Style: isometric shapes built from hundreds of white credit cards standing edge to edge (a card ribbon),
// on flat riso blue. Every unit in a shape is a credit card. Cards stand up in domino waves to build a shape,
// fly in flocks from one shape to the next, stream along a path, and stack flat into piles.
// Clip: Video 17 "Moving limits" (call the bank, transfer the limit to a 0% card, combine, stack it up).
import * as M from './lib/motion.js';
import * as BR from './lib/brand.js';

const { W, H, E, prog, clamp, lerp, spring, springKeys, SPRING, font, mulberry32, cover, hash01 } = M;
const DW = 1080, DH = 1920, S = W / DW, TAU = M.TAU;
const C = { bg: '#0B48C8', bg2: '#0838A8', ink: '#123A9E', inkSoft: '#3D63C9', card: '#FFFFFF', shade: '#C9D6F5', white: '#FFFFFF', gold: '#CB9938', light: '#ADC8E3', speck: '#06205E' };
const DISPLAY = 'Display', UI = 'UI';
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 423;
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
const N = 600;                                   // every shape is made of the same 600 cards
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
const BANK = [
  seg([-6.2, 0], [6.2, 0]),                                     // base
  ...[-4.3, -1.45, 1.45, 4.3].map((x) => seg([x, 1.3], [x, 6.3])), // four columns
  seg([-6.2, 7.5], [6.2, 7.5]),                                 // beam
  [[-6.6, 8.7], [0, 12.6], [6.6, 8.7]],                         // pediment
];
const ARC = [arc(0, 1, 6.6, 5.2, Math.PI * 0.96, Math.PI * 0.04, 90)];   // the transfer arc (cards stream along it)
const ZERO_PCT = [
  arc(-3.9, 5, 2.7, 4.6, Math.PI / 2, Math.PI / 2 + TAU, 96),   // 0
  seg([0.6, 0.4], [6.4, 9.6]),                                  // slash
  arc(1.7, 7.9, 1.25, 1.6, -Math.PI / 2, -Math.PI / 2 + TAU, 40),
  arc(5.3, 2.1, 1.25, 1.6, Math.PI / 2, Math.PI / 2 + TAU, 40),
];
const K20 = [   // "20K" spelled in cards
  [...arc(-7.2, 7.2, 2.2, 2.3, Math.PI * 0.95, -Math.PI * 0.28, 40), [-9.4, 0.4], [-4.8, 0.4]],   // 2
  arc(-1.4, 4.9, 2.3, 4.5, Math.PI / 2, Math.PI / 2 + TAU, 80),                                // 0
  seg([3.2, 0.2], [3.2, 9.6]), seg([8.6, 9.6], [4.6, 5.2]), seg([5.6, 4.6], [8.8, 0.2]),         // K
];
const MERGE = [bez([-7, 11], [-7, 6], [0, 7.5], [0, 3]), bez([7, 11], [7, 6], [0, 7.5], [0, 3]), seg([0, 3], [0, -0.5])];

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
  SH.bank = shape(BANK, { pile: [0, 0], scale: 0.62 });
  SH.arc = shape(ARC, { pile: [-6.6, 1], scale: 0.75 });
  SH.zero = shape(ZERO_PCT, { pile: [0, 5], scale: 0.7 });
  SH.coil = shape(K20, { pile: [0, 5], scale: 0.62 });
  SH.merge = shape(MERGE, { pile: [0, -1], scale: 0.78 });
  SH.stacks = piles([[-5.2, -1.2, 30], [-2.6, -0.6, 60], [0, 0, 95], [2.6, 0.6, 135], [5.2, 1.2, 180]]);
  CF.bank = fit(SH.bank); CF.arc = fit(SH.arc, 860, 440, [G(-6.6 * 0.75 - 0.6, -1.6 + 0.75, 2.4), G(6.6 * 0.75 + 0.6, -1.6 + 0.75, 2.4), G(-6.6 * 0.75 - 0.6, -1.6, 0), G(6.6 * 0.75 + 0.6, -1.6, 0)]);
  CF.zero = fit(SH.zero); CF.coil = fit(SH.coil, 800, 470); CF.merge = fit(SH.merge, 900, 520, [G(0, -0.5 * 0.78 - 1.9, 2.5), G(0, -0.5 * 0.78 - 1.9, 0), G(-1.2, -0.5 * 0.78 - 1.9, 0), G(1.2, -0.5 * 0.78 - 1.9, 0)]); CF.stacks = fit(SH.stacks, 820, 560);
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

// ---- timeline (seconds; Video 17 word timings)
const T_BUILD = 0.98, T_BUILD_D = 1.05;          // "call that bank, like Chase": the bank stands up in a domino wave
const T_RIFFLE = 1.8;                             // "like Chase": a riffle runs through the bank
const T_M1 = 2.3;                                 // bank -> transfer arc
const T_FLOW = [3.1, 5.45], TRAIN = 0.78;                       // "transfer the limit over into": cards stream from card A to card B
const T_M2 = 5.55;                                // arc -> "0%"
const T_M3 = 8.05;                                // "0%" -> coil ("20,000")
const T_M4 = 9.35;                                // coil -> merge ("combine it")
const T_FLOW2 = [10.1, 11.6];                     // "transfer the rest of the limit": the two branches stream into one
const T_HERO = 11.76;                             // "this 0% interest card": the hero card at the end lifts
const T_M5 = 12.95;                               // merge -> stacks ("smart to be able to stack it up")
const T_STACK = 14.02;                            // "stack it up": the piles pop, tallest last

function state(t) {
  if (t < T_M1) {
    // build: card i stands up when the wave reaches it (falls in from lying flat, with overshoot)
    return SH.bank.map((c, i) => {
      const st = T_BUILD + T_BUILD_D * c.s, d = t - st;
      if (!c.vis || d < -0.02) return { p: c.p, T: c.T, a: 0, vis: 0, sc: 0 };
      const ang = d < 0.16 ? (Math.PI / 2) * (1 - E.outCubic(d / 0.16)) : -0.18 * Math.exp(-(d - 0.16) * 9) * Math.sin((d - 0.16) * 30);
      let a = ang;
      const rd = t - T_RIFFLE - c.s * 0.45; if (rd > 0 && rd < 0.3) a += -0.5 * Math.sin(Math.PI * rd / 0.3);   // riffle
      return { p: c.p, T: c.T, a, vis: 1, sc: clamp(d / 0.06) };
    });
  }
  if (t < T_M2) {
    let S = t < T_M1 + 1.2 ? morph(SH.bank, SH.arc, t, T_M1, 0.5, 0.5) : still(SH.arc);
    // transfer: trains of cards run along the arc from card A to card B (each train lands in B with a pulse)
    if (t > T_FLOW[0]) {
      const used = SH.arc.used, settle = P(t, T_FLOW[1] - 0.35, T_FLOW[1]);
      S = S.map((c, i) => {
        if (i >= used) return c;
        const s0 = SH.arc[i].s, ph = (t - T_FLOW[0]) / TRAIN;              // trains leave every TRAIN seconds
        const head = ph % 1 * 1.45, inTrain = s0 <= head && s0 >= head - 0.45;
        const k = inTrain ? 1 : 0.16;   // the empty track stays as a faint ghost
        const lift = inTrain ? 0.35 * Math.sin(Math.PI * clamp((head - s0) / 0.45)) : 0;
        return { ...c, p: add(c.p, [0, lift, 0]), vis: lerp(k, 1, settle), sc: lerp(k, 1, settle) };
      });
    }
    return S;
  }
  if (t < T_M3) return ripple(morph(SH.arc, SH.zero, t, T_M2, 0.5, 0.5, 3), SH.zero, t, T_M2 + 1.2, 1.1);
  if (t < T_M4) return ripple(morph(SH.zero, SH.coil, t, T_M3, 0.4, 0.45, 2.2), SH.coil, t, T_M3 + 0.9, 0.7);
  if (t < T_M5) {
    let S = morph(SH.coil, SH.merge, t, T_M4, 0.5, 0.5, 2.4);
    if (t > T_FLOW2[0] - 0.4) {   // pulses run down both branches into the trunk and the 0% card
      const used = SH.merge.used;
      S = S.map((c, i) => {
        if (i >= used) return c;
        const s0 = SH.merge[i].s, br = s0 < 0.4 ? s0 / 0.4 : s0 < 0.8 ? (s0 - 0.4) / 0.4 : 1 + (s0 - 0.8) / 0.2 * 0.5;   // position down the Y (0..1.5)
        let lift = 0; for (let q = 0; q < 4; q++) { const ph = (t - T_FLOW2[0] - q * 0.42) * 1.6 - br; if (ph > 0 && ph < 0.25) lift += 0.42 * Math.sin(Math.PI * ph / 0.25); }
        return { ...c, p: add(c.p, [0, lift * (1 - P(t, 12.6, 12.9)), 0]) };
      });
    }
    return S;
  }
  // stacks: cards fly in and lie flat on three piles; on "stack it up" the piles pop (tallest last)
  // cards fly in and land flat; piles fill left to right, so the staircase rises as it fills
  return morph(SH.merge, SH.stacks, t, T_M5, 0.75, 0.5, 3).map((c, i) => {
    const sc = SH.stacks[i];
    if (t > T_STACK && sc.vis) { const d = t - T_STACK - sc.pile * 0.07; if (d > 0) c.p = add(c.p, [0, 0.45 * Math.max(0, Math.sin(d * 10)) * Math.exp(-d * 4) * (0.3 + sc.p[1] / 6), 0]); }
    return c;
  });
}

// hero cards: big single cards at the ends of the transfer ("card A" → "card B") and at the merge
function heroes(t) {
  const H = [];
  const kA = clamp(sp(t, T_M1 + 0.35, SPRING.bouncy)) * outK(t, T_M2 + 0.1), kB = clamp(sp(t, T_M1 + 0.55, SPRING.bouncy)) * outK(t, T_M2 + 0.15);
  const pA = G(-6.6 * 0.75 - 0.6, 1 * 0.75 - 1.6, 0), pB = G(6.6 * 0.75 + 0.6, 1 * 0.75 - 1.6, 0);
  const moved = P(t, T_FLOW[0], T_FLOW[1], (x) => x), sA = lerp(3.4, 2.5, moved), sB = lerp(3.0, 3.9, moved);
  if (kA > 0.01) H.push({ c: add(pA, [0, CH * sA / 2 * kA, 0]), T: norm(GU), sc: sA * kA, tilt: 0.25 });
  if (kB > 0.01) { const ar = (t - T_FLOW[0]) / TRAIN - 1 / 1.45, pd = (ar - Math.floor(ar)) * TRAIN, pulse = t > T_FLOW[0] + TRAIN / 1.45 && t < T_FLOW[1] ? 1 + 0.08 * Math.exp(-pd * 9) * Math.sin(Math.min(pd * 22, Math.PI)) : 1; H.push({ c: add(pB, [0, CH * sB * pulse / 2 * kB, 0]), T: norm(GU), sc: sB * kB * pulse, tilt: -0.25, gold: true }); }
  // merge hero: the 0% card at the end of the trunk
  const kM = clamp(sp(t, T_M4 + 0.6, SPRING.bouncy)) * outK(t, T_M5 + 0.15), lift = t > T_HERO ? 0.9 * E.outBack(prog(t, T_HERO, T_HERO + 0.35)) * (1 - P(t, 12.7, 12.95)) : 0;
  if (kM > 0.01) { const p = G(0, -0.5 * 0.78 - 1.9, 0); H.push({ c: add(p, [0, CH * 3.6 / 2 * kM + lift, 0]), T: norm(GU), sc: 3.6 * kM, tilt: 0, gold: t > T_HERO }); }
  return H;
}

// camera: each scene frames its shape (auto-fit), easing from one framing to the next while the cards fly
const CAMK = [[0, 'bank'], [T_M1, 'arc'], [T_M2, 'zero'], [T_M3, 'coil'], [T_M4, 'merge'], [T_M5, 'stacks']];
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
  for (const h of heroes(t)) { const T = norm(add(h.T, mul(GR, h.tilt))), f = cardFrame(add(h.c, [0, 0, 0]), T, 0, h.sc); list.push({ f, d: f.c[0] + f.c[2] + 0.4, hero: true, gold: h.gold }); }
  // shadows first, then cards back to front
  ctx.save(); ctx.fillStyle = 'rgba(3,22,80,0.22)'; for (const it of list) cardShadow(ctx, it.f, 1); ctx.restore();
  list.sort((a, b) => a.d - b.d);
  for (const it of list) drawCard(ctx, it.f, { alpha: it.alpha ?? 1, hero: it.hero });
  // the gold edge on a hero 0% card (a thin gold rule on its face)
  for (const it of list) if (it.gold) { const o = proj(it.f.o), px = proj(add(it.f.o, it.f.ex)), py = proj(add(it.f.o, it.f.ey)); ctx.save(); ctx.transform(px[0] - o[0], px[1] - o[1], py[0] - o[0], py[1] - o[1], o[0], o[1]); ctx.beginPath(); ctx.rect(0.62, 0.62, 0.3, 0.2); ctx.restore(); ctx.fillStyle = C.gold; ctx.fill(); txtAt(ctx, it.f, '0%', 0.77, 0.72, 0.17); }
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
  label(ctx, 'CALL THE BANK', t, 0.9, 2.2, 116);
  label(ctx, 'TRANSFER THE LIMIT', t, 3.1, 5.35, 104);
  label(ctx, '20,000', t, 8.2, 9.3, 150);
  label(ctx, 'COMBINE IT', t, 9.42, 11.6, 132);
  label(ctx, 'ON THE 0% CARD', t, 11.76, 12.85, 112);
  label(ctx, 'STACK IT UP', t, 14.0, END - 0.25, 140);
  // compliance line during the 0% / transfer claims
  const dk = P(t, 3.2, 3.5) * (1 - P(t, 12.8, 13.0));
  if (dk > 0.01) { ctx.save(); ctx.globalAlpha = 0.85 * dk; ctx.font = font(24, 500, UI); ctx.textAlign = 'center'; ctx.fillStyle = C.white; ctx.fillText('Individual results vary. Education only.', 540, Y(285) - Math.max(0, SEAM - FH) * 0.26); ctx.restore(); }
}

// ================================================================== layout over time
const END = 14.97; window.__END = END;
const FH_KEYS = [[0, 1920], [0.8, SEAM], [13.2, 0], [END, 0]];
function footH(t) {
  let v = springKeys(t, FH_KEYS, { stiffness: 150, damping: 17 });
  for (let i = 1; i < FH_KEYS.length; i++) v -= Math.sign(FH_KEYS[i][1] - FH_KEYS[i - 1][1]) * 34 * antic(t, FH_KEYS[i][0], 0.22);
  return clamp(v, 0, DH);
}
const FULL_WINDOWS = [[0, 0.8]];

// ================================================================== sound (from the same timing constants)
function buildHits() {
  const h = [];
  // the domino build: a riffle of card flicks that follows the wave (one flick every ~12 cards)
  const used = 580; for (let i = 0; i < used; i += 14) h.push([T_BUILD + T_BUILD_D * (i / used), 'flick', 'tick', { gain: 0.1 + 0.08 * hash01(i, 2) }]);
  h.push([T_BUILD + T_BUILD_D + 0.02, 'built', 'click', { gain: 0.35 }]);
  for (let i = 0; i < 8; i++) h.push([T_RIFFLE + i * 0.05, 'riffle', 'tick', { gain: 0.12 }]);
  const flock = (t0, n = 10, sp = 0.055, g = 0.1) => { h.push([t0, 'whoosh', 'whoosh', { len: 0.6, from: 500, to: 2600, gain: 0.22 }]); for (let i = 0; i < n; i++) h.push([t0 + 0.45 + i * sp, 'land', 'tick', { gain: g }]); };
  flock(T_M1); flock(T_M2); flock(T_M3, 8); flock(T_M4); flock(T_M5, 12, 0.06, 0.12);
  h.push([T_M1 + 0.35, 'card A', 'thud', { gain: 0.4 }], [T_M1 + 0.55, 'card B', 'thud', { gain: 0.4 }]);
  // each train of cards: a soft riffle as it leaves card A, a click as it lands in card B
  for (let q = 0; T_FLOW[0] + q * TRAIN < T_FLOW[1] - 0.3; q++) { const t0 = T_FLOW[0] + q * TRAIN; for (let i = 0; i < 6; i++) h.push([t0 + i * 0.06, 'train', 'tick', { gain: 0.08 }]); h.push([t0 + TRAIN / 1.45, 'lands in B', 'click', { gain: 0.32 }]); }
  // merge pulses arriving at the 0% card
  for (let q = 0; q < 4; q++) h.push([T_FLOW2[0] + q * 0.42 + 1.5 / 1.6, 'pulse lands', 'tok', { pitch: ['C5', 'D5', 'E5', 'G5'][q], gain: 0.22 }]);
  h.push([8.24, '20,000', 'bell', { pitch: 'G5', gain: 0.3 }], [T_M4 + 0.6, 'hero', 'thud', { gain: 0.35 }], [T_HERO, '0% card', 'boing', { pitch: 'C5', to: 'G5', gain: 0.25 }]);
  [0, 1, 2, 3, 4].forEach((k) => h.push([T_STACK + k * 0.07, 'stack', 'tok', { pitch: ['C5', 'D5', 'E5', 'G5', 'C6'][k], gain: 0.26 }]));
  h.push([T_STACK, 'stack', 'pop', { pitch: 'C6', gain: 0.35 }]);
  return h.sort((a, b) => a[0] - b[0]);
}

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
const FAST = [T_M1, T_M2, T_M3, T_M4, T_M5, T_BUILD, T_STACK];
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
