// CCE — "18C Card Structures 3D" founder split-screen. Pure function of time: window.seek(t) paints frame t.
// Variant of 18 Card Ribbon: the same white credit cards on riso blue, but built into real 3D structures:
// a bank of stacked and leaning cards, piles that deal from one to another, a spinning hero card on a ribbon ring,
// a riffle shuffle that combines two piles, and a house of cards for "stack it up".
// Every card is a true 3D plane (white front with card art, blue back with a magnetic stripe), lit, shadowed, depth-sorted.
// Clip: Video 17 "Moving limits".
import * as M from './lib/motion.js';
import * as BR from './lib/brand.js';

const { W, H, E, prog, clamp, lerp, spring, springKeys, SPRING, font, mulberry32, cover, hash01 } = M;
const DW = 1080, DH = 1920, S = W / DW, TAU = M.TAU;
const C = { bg: '#0B48C8', ink: '#123A9E', card: '#FFFFFF', back: '#9DB8F2', stripe: '#0C2466', white: '#FFFFFF', gold: '#CB9938' };
const DISPLAY = 'Display', UI = 'UI';
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 423;
const SEAM = 980;
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);
const P = (t, a, b, ease = E.inOutCubic) => ease(prog(t, a, b));
const antic = (t, t0, dur = 0.2) => { const p = prog(t, t0 - dur, t0 + 0.02); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; };
const outK = (t, t0, d = 0.25) => 1 - E.inBack(prog(t, t0, t0 + d), 1.7);
let FH = DH;
const Y = (y) => (FH >= SEAM ? y - (FH - SEAM) : y + (SEAM - FH) * 0.48);

// ================================================================== vector helpers
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
function rot(v, ax, an) { const c = Math.cos(an), s = Math.sin(an), d = dot(ax, v), x = cross(ax, v); return [v[0] * c + x[0] * s + ax[0] * d * (1 - c), v[1] * c + x[1] * s + ax[1] * d * (1 - c), v[2] * c + x[2] * s + ax[2] * d * (1 - c)]; }
const UP = [0, 1, 0];
// world axes for building: A = screen-right on the ground, B = into the screen (away from the viewer), turned off the iso axes
const GA = Math.PI / 4 + 0.26;
const GR = [Math.cos(GA), 0, -Math.sin(GA)], GU = [-Math.sin(GA), 0, -Math.cos(GA)];
const W3 = (a, y, b) => [GR[0] * a + GU[0] * b, y, GR[2] * a + GU[2] * b];

// ================================================================== camera + projection
let CAM = { K: 60, ux: 0, uy: 0, sx: 540, sy: 560 };
const proj1 = (p) => [(p[0] - p[2]) * 0.866, (p[0] + p[2]) * 0.5 - p[1]];
function proj(p) { const q = proj1(p); return [CAM.sx + CAM.K * (q[0] - CAM.ux), CAM.sy + CAM.K * (q[1] - CAM.uy)]; }
const VIEW = norm([1, 1.15, 1]);                     // towards the viewer
const LIGHT = norm([-0.35, 1, 0.65]);                // key light, high and from the front-left
const CL = 1.0, CS = 0.63;                           // card long side, short side

// a card frame: centre c, unit long axis ex, unit short axis ey, scale sc
const F = (c, ex, ey, sc = 1, vis = 1) => ({ c, ex: norm(ex), ey: norm(ey), sc, vis });
const corners = (f) => { const hx = mul(f.ex, CL * f.sc / 2), hy = mul(f.ey, CS * f.sc / 2); return [sub(sub(f.c, hx), hy), sub(add(f.c, hx), hy), add(add(f.c, hx), hy), add(sub(f.c, hx), hy)]; };
// fit a set of frames into a box below the headline
function fit(frames, bw = 860, bh = 480) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  frames.forEach((f) => { if (f.vis < 0.5) return; corners(f).forEach((p) => { const q = proj1(p); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }); });
  return { K: Math.min(bw / (x1 - x0), bh / (y1 - y0)), ux: (x0 + x1) / 2, uy: (y0 + y1) / 2 };
}

// ================================================================== structures (each a list of N frames; spares hide in the deck)
const N = 400;
const DECK = F(W3(0, 0.02, 0), GR, GU, 0.2, 0);
const pad = (list) => { const out = list.slice(0, N); while (out.length < N) out.push({ ...DECK }); out.used = list.length; return out; };
const flat = (a, y, b, sc, yaw = 0) => F(W3(a, y, b), rot(GR, UP, yaw), rot(GU, UP, yaw), sc);
const TH = 0.035;                                    // card thickness in a pile (per unit of scale)
function pile(a, b, n, sc, seed = 1, y0 = 0.02) { return Array.from({ length: n }, (_, i) => flat(a + 0.05 * sc * (hash01(i, seed) - 0.5), y0 + i * TH * sc, b + 0.05 * sc * (hash01(i, seed + 9) - 0.5), sc, 0.1 * (hash01(i, seed + 3) - 0.5))); }

// the bank: a stepped base of flat cards, four card columns, a beam of flat cards, a pediment of two leaning cards
function bank() {
  const s = 1.5, L = CL * s, Sh = CS * s, out = [];
  for (const b of [-Sh / 2, Sh / 2]) for (const a of [-L, 0, L]) out.push(flat(a, 0.02, b, s));          // base, 6 cards
  for (const a of [-L, 0, L]) out.push(flat(a * 0.86, 0.02 + TH * s * 1.5, 0, s));                       // step, 3 cards
  const top = 0.08 + L;
  for (const a of [-1.92, -0.64, 0.64, 1.92]) out.push(F(W3(a, 0.08 + L / 2, 0), UP, mul(GR, -1), s));             // columns: cards on end, faces to the viewer
  for (const a of [-L * 0.98, 0, L * 0.98]) out.push(flat(a, top + 0.02, 0, s));                         // beam, 3 cards
  const rs = 1.75, rl = CL * rs, ang = 0.5;
  for (const sgn of [-1, 1]) { const ex = norm(add(mul(GR, -sgn * Math.cos(ang)), mul(UP, Math.sin(ang)))); const c = add(W3(sgn * (rl / 2) * Math.cos(ang), top + 0.06, 0), mul(UP, (rl / 2) * Math.sin(ang))); out.push(F(c, ex, GU, rs)); }   // pediment
  return out;
}
// two piles for the transfer: A (the old card's limit) on the left, B (the 0% card) on the right
const PA = [-2.4, 0], PB = [2.4, 0], PSC = 1.5, NA = 44, NB = 8, NMOVE = 26;
function piles2() { return [...pile(PA[0], PA[1], NA, PSC, 3), ...pile(PB[0], PB[1], NB, PSC, 7)]; }
// a ring of standing cards (the ribbon style) around the hero card's base
function ring(r = 3.2, sc = 0.85) {
  const n = Math.round((TAU * r) / (0.1 * sc * 1.1)), out = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, p = W3(Math.cos(a) * r, CS * sc / 2, Math.sin(a) * r * 0.9), T = norm(W3(-Math.sin(a), 0, Math.cos(a) * 0.9)); out.push(F(p, norm(cross(UP, T)), UP, sc)); }
  return out;
}
// "20,000": one tall pile, dealt card by card
const TALL = () => pile(0, 0, 150, 1.4, 11);
// combine: two piles that riffle into one
const NL = 40, NR = 40;
const SPLIT = () => [...pile(-2.5, 0, NL, 1.4, 13), ...pile(2.5, 0, NR, 1.4, 17)];
const MERGED = () => { const out = []; for (let i = 0; i < NL + NR; i++) { const j = (i % 2 === 0 ? i / 2 : NL + (i - 1) / 2); out[j] = flat(0.04 * (hash01(i, 21) - 0.5), 0.02 + i * TH * 1.4, 0.04 * (hash01(i, 22) - 0.5), 1.4, 0.12 * (hash01(i, 23) - 0.5)); } return out; };
// house of cards: four levels of leaning pairs with flat floor cards between levels
function house() {
  const s = 1.55, L = CL * s, th = 0.33, hF = L * Math.cos(th), half = L * Math.sin(th), d = 2 * half + 0.24, out = [];
  for (let lv = 0; lv < 4; lv++) {
    const n = 4 - lv, y0 = lv * (hF + 0.025) + 0.01;
    for (let i = 0; i < n; i++) {
      const a0 = (i - (n - 1) / 2) * d;
      for (const sgn of [-1, 1]) { const ex = norm(add(mul(UP, Math.cos(th)), mul(GR, -sgn * Math.sin(th)))); out.push({ ...F(W3(a0 + sgn * half / 2, y0 + hF / 2, 0), ex, GU, s), lv, kind: 'lean' }); }
    }
    if (lv < 3) for (let i = 0; i < n - 1; i++) { const a0 = (i - (n - 2) / 2) * d; out.push({ ...flat(a0, y0 + hF + 0.012, 0, s), lv, kind: 'floor' }); }
  }
  return out;
}

const SH = {}, CF = {};
function buildShapes() {
  SH.bank = pad(bank()); SH.piles = pad(piles2()); SH.ring = pad(ring()); SH.tall = pad(TALL()); SH.split = pad(SPLIT()); SH.merged = pad(MERGED()); SH.house = pad(house());
  CF.bank = fit(SH.bank, 820, 470); CF.piles = fit(SH.piles, 820, 420); CF.ring = fit([...SH.ring, heroFrame(7)], 820, 470); CF.tall = fit(SH.tall, 700, 470);
  CF.split = fit(SH.split, 820, 420); CF.merged = fit([...SH.merged, ...SH.split], 820, 440); CF.house = fit(SH.house, 800, 600);
}

// ================================================================== motion
// fly from frame a to frame b: arc lift, and a tumble (whole turns, so it lands in the right orientation)
function fly(a, b, k, lift = 2, turns = 1, axisSeed = 0) {
  const e = E.inOutCubic(k), c = lerp3(a.c, b.c, e); c[1] += Math.sin(Math.PI * e) * lift;
  let ex = lerp3(a.ex, b.ex, e), ey = lerp3(a.ey, b.ey, e);
  if (Math.hypot(...ex) < 0.2) ex = a.ex;
  ex = norm(ex); ey = norm(sub(ey, mul(ex, dot(ey, ex)))); if (Math.hypot(...ey) < 0.2) ey = norm(cross(ex, UP));
  if (turns) { const ax = norm(lerp3(ex, ey, hash01(axisSeed, 5))), an = TAU * turns * E.inOutSine(k); ex = rot(ex, ax, an); ey = rot(ey, ax, an); }
  return F(c, ex, ey, lerp(a.sc, b.sc, e), lerp(a.vis, b.vis, Math.min(1, e * 1.4)));
}
// staggered flock: card i leaves at t0 + spread * order
function morph(A, B, t, t0, spread = 0.6, dur = 0.5, lift = 2.2, turns = 1, order = (i) => i / N) {
  return A.map((a, i) => { const st = t0 + spread * order(i) + 0.03 * hash01(i, 7), k = prog(t, st, st + dur); return k <= 0 ? a : k >= 1 ? B[i] : fly(a, B[i], k, lift, turns, i); });
}
// drop into place from above (gravity) with a small settle; returns the frame
function drop(f, t, tl, h = 2.2, dur = 0.24) {
  if (t < tl - dur) return { ...f, vis: 0 };
  if (t < tl) { const k = (t - (tl - dur)) / dur; return { ...f, c: add(f.c, [0, h * (1 - k * k), 0]), vis: 1 }; }
  const d = t - tl, bob = 0.06 * Math.exp(-d * 10) * Math.sin(d * 34) * f.sc;
  return { ...f, c: add(f.c, [0, Math.max(0, bob), 0]) };
}

// ---- timeline (seconds; Video 17 word timings)
const T_BANK = 1.18, T_BANK_DT = 0.05;     // "call that bank, like Chase": the bank builds part by part, bottom up
const T_M1 = 2.3;                           // bank -> two piles
const T_FLOW = 3.1, FLOW_DT = 0.085, FLOW_D = 0.42;   // "transfer the limit over into": cards fly from pile A to pile B, one by one
const T_M2 = 5.55;                          // piles -> ribbon ring + hero 0% card
const T_SPIN = [6.0, 7.1];                  // the hero card turns once ("your 0% interest card")
const T_M3 = 8.0;                           // -> one tall pile, dealt ("20,000")
const T_M4 = 9.35;                          // split into two piles ("combine it")
const T_SHUF = [10.1, 11.35];               // riffle the two piles into one ("transfer the rest of the limit")
const T_HERO = 11.76;                       // "this 0% interest card": the hero card drops face up on top
const T_M5 = 12.95;                         // -> house of cards
const T_STACK = 14.02;                      // "stack it up": the top pair lands

function bankAt(t) {   // parts drop in bottom-up order
  return SH.bank.map((f, i) => (i < SH.bank.used ? drop(f, t, T_BANK + i * T_BANK_DT, 1.3, 0.2) : f));
}
function pilesAt(t) {  // the transfer: the top NMOVE cards of A fly to the top of B in turn
  const out = SH.piles.slice();
  for (let j = 0; j < NMOVE; j++) {
    const i = NA - 1 - j, t0 = T_FLOW + j * FLOW_DT, a = SH.piles[i], b = flat(PB[0] + 0.05 * (hash01(j, 31) - 0.5), 0.02 + (NB + j) * TH * PSC, PB[1], PSC, 0.1 * (hash01(j, 32) - 0.5));
    const k = prog(t, t0, t0 + FLOW_D);
    out[i] = k <= 0 ? a : k >= 1 ? b : fly(a, b, k, 1.35, 1, i);
    if (k >= 1) { const d = t - t0 - FLOW_D; out[i] = { ...b, c: add(b.c, [0, Math.max(0, 0.05 * Math.exp(-d * 12) * Math.sin(d * 30)), 0]) }; }
  }
  return out;
}
function state(t) {
  if (t < T_M1) return bankAt(t);
  if (t < T_M2) { const B = pilesAt(t); return t < T_M1 + 1.2 ? morph(bankAt(t), B, t, T_M1, 0.5, 0.5, 2.2, 1) : B; }
  if (t < T_M3) return morph(pilesAt(T_M2), SH.ring, t, T_M2, 0.55, 0.5, 2.0, 0.5);
  if (t < T_M4) return morph(SH.ring, SH.tall, t, T_M3, 0.62, 0.3, 1.6, 0.5, (i) => (i < SH.tall.used ? i / SH.tall.used : 1));   // dealt bottom to top
  if (t < T_SHUF[0]) return morph(SH.tall, SH.split, t, T_M4, 0.5, 0.42, 1.4, 0.5);
  if (t < T_M5) {   // riffle: cards leave the two piles alternately (top first) and land on the centre pile
    const out = SH.split.slice(), n = NL + NR, dt = (T_SHUF[1] - T_SHUF[0]) / n;
    for (let m = 0; m < n; m++) {
      const j = m % 2 === 0 ? m / 2 : NL + (m - 1) / 2, t0 = T_SHUF[0] + m * dt;   // alternate left, right
      const k = prog(t, t0, t0 + 0.3); out[j] = k <= 0 ? SH.split[j] : k >= 1 ? SH.merged[j] : fly(SH.split[j], SH.merged[j], k, 0.9, 0.5, j);
    }
    return out;
  }
  // house of cards: every card is placed in build order; leaning pairs land together, floors slide on
  const H = SH.house, n = H.used, T0 = T_M5 + 0.12, Tn = T_STACK, order = [];
  for (let i = 0; i < n; i++) order.push(i);
  return SH.merged.map((a, i) => {
    if (i >= n) { const k = prog(t, T_M5, T_M5 + 0.5); return k >= 1 ? H[i] : fly(a, H[i], k, 1.5, 0); }
    const tl = lerp(T0 + 0.35, Tn, i / (n - 1)), k = prog(t, tl - 0.4, tl);
    let f = k <= 0 ? a : k >= 1 ? H[i] : fly(a, H[i], k, 1.6 + H[i].lv * 0.6, 0.5, i);
    if (k >= 1) { const d = t - tl; f = { ...H[i], c: add(H[i].c, [0, Math.max(0, 0.05 * Math.exp(-d * 12) * Math.sin(d * 30)), 0]) }; }
    return f;
  });
}
// the hero 0% card: stands in the ring and turns once; later drops face-up on the merged pile
function heroFrame(t) {
  const sc = 3.2, spin = TAU * E.inOutCubic(prog(t, T_SPIN[0], T_SPIN[1])) + 0.35;
  const ex = rot(GR, UP, spin), ey = UP;
  return F(W3(0, CS * sc / 2 + 0.05 + 0.08 * Math.sin(t * 2), 0), ex, ey, sc);
}
function heroes(t) {
  const out = [];
  const k1 = clamp(sp(t, T_M2 + 0.45, SPRING.bouncy)) * outK(t, T_M3 + 0.05);
  if (k1 > 0.01) { const f = heroFrame(t); out.push({ ...f, sc: f.sc * k1, c: [f.c[0], f.c[1] * k1, f.c[2]], hero: true, tag: '0%' }); }
  const kd = prog(t, T_HERO - 0.3, T_HERO), ko = outK(t, T_M5 + 0.05);
  if (kd > 0 && ko > 0.01) {
    const top = 0.02 + (NL + NR) * TH * 1.4 + 0.03, h = 2.6 * (1 - kd * kd), d = t - T_HERO, bob = d > 0 ? 0.08 * Math.exp(-d * 9) * Math.sin(d * 30) : 0;
    const f = flat(0, top + h + Math.max(0, bob), 0, 2.0 * ko, 0.05); out.push({ ...f, hero: true, tag: '0%', faceUp: true });
  }
  return out;
}

// ================================================================== drawing
function rrPath(ctx, rx, ry) {
  ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(1 - rx, 0); ctx.quadraticCurveTo(1, 0, 1, ry); ctx.lineTo(1, 1 - ry); ctx.quadraticCurveTo(1, 1, 1 - rx, 1);
  ctx.lineTo(rx, 1); ctx.quadraticCurveTo(0, 1, 0, 1 - ry); ctx.lineTo(0, ry); ctx.quadraticCurveTo(0, 0, rx, 0); ctx.closePath();
}
function drawCard(ctx, f, { hero = false, tag = null } = {}) {
  let ex = f.ex, ey = f.ey;
  const n = norm(cross(ex, ey)), facing = dot(n, VIEW), front = facing >= 0;
  // keep the art readable: if we see the face mirrored, flip the long axis (and recentre via corners)
  const o3 = sub(sub(f.c, mul(ex, CL * f.sc / 2)), mul(ey, CS * f.sc / 2));
  let o = proj(o3), px = proj(add(o3, mul(ex, CL * f.sc))), py = proj(add(o3, mul(ey, CS * f.sc)));
  let ax = px[0] - o[0], ay = px[1] - o[1], bx = py[0] - o[0], by = py[1] - o[1];
  const area = Math.abs(ax * by - ay * bx);
  if (area < 0.4 && Math.hypot(ax, ay) < 1 && Math.hypot(bx, by) < 1) return;
  if (ax * by - ay * bx > 0) { o = [o[0] + ax, o[1] + ay]; ax = -ax; ay = -ay; }   // un-mirror
  const nv = front ? n : mul(n, -1), lit = 0.62 + 0.38 * Math.max(0, dot(nv, LIGHT)), shade = Math.abs(facing);
  ctx.save();
  const base = ctx.getTransform();
  ctx.transform(ax, ay, bx, by, o[0], o[1]);
  rrPath(ctx, 0.06, 0.1);
  ctx.setTransform(base);
  const col = front ? C.card : C.back;
  ctx.fillStyle = M.mix('#7F93C8', col, clamp(lit * (0.55 + 0.45 * shade) + 0.12)); ctx.fill();
  ctx.lineWidth = hero ? 2.2 : 1.15; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
  if (area > 220) {
    const k = clamp((area - 220) / 500), Q = (u, v) => [o[0] + ax * u + bx * v, o[1] + ay * u + by * v];
    const poly = (pts, close = false) => { ctx.beginPath(); pts.forEach(([u, v], i) => { const q = Q(u, v); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); if (close) ctx.closePath(); };
    ctx.globalAlpha *= k; ctx.lineWidth = hero ? 2 : 1.2; ctx.lineCap = 'round'; ctx.strokeStyle = C.ink;
    if (front) {
      poly([[0.09, 0.56], [0.25, 0.56], [0.25, 0.8], [0.09, 0.8]], true); ctx.stroke();
      poly([[0.09, 0.68], [0.25, 0.68]]); ctx.stroke(); poly([[0.17, 0.56], [0.17, 0.8]]); ctx.stroke();
      for (let g = 0; g < 4; g++) { poly([[0.09 + g * 0.21, 0.36], [0.24 + g * 0.21, 0.36]]); ctx.stroke(); }
      poly([[0.09, 0.17], [0.42, 0.17]]); ctx.stroke();
      for (const cx of [0.78, 0.86]) { ctx.beginPath(); for (let i = 0; i <= 24; i++) { const a = (i / 24) * TAU, q = Q(cx + 0.07 * Math.cos(a), 0.2 + 0.11 * Math.sin(a)); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); } ctx.stroke(); }
      if (tag) { poly([[0.6, 0.6], [0.92, 0.6], [0.92, 0.84], [0.6, 0.84]], true); ctx.fillStyle = C.gold; ctx.fill(); txtOn(ctx, o, ax, ay, bx, by, tag, 0.76, 0.72, 0.2); }
    } else {
      poly([[0, 0.7], [1, 0.7], [1, 0.86], [0, 0.86]], true); ctx.fillStyle = C.stripe; ctx.fill();          // magnetic stripe
      poly([[0.08, 0.42], [0.62, 0.42], [0.62, 0.56], [0.08, 0.56]], true); ctx.fillStyle = '#F4F7FF'; ctx.fill(); ctx.stroke();   // signature strip
    }
  }
  ctx.restore();
}
function txtOn(ctx, o, ax, ay, bx, by, s, u, v, size) {
  ctx.save(); ctx.transform(ax, ay, bx, by, o[0] + ax * u + bx * v, o[1] + ay * u + by * v); ctx.scale(1, -1);
  ctx.scale(size * 0.63 / 100, size / 100); ctx.font = font(100, 400, DISPLAY); ctx.textAlign = 'center'; ctx.fillStyle = C.ink; ctx.fillText(s, 0, 34); ctx.restore();
}
// shadows: every card's outline projected onto the ground along the light, drawn opaque on one layer, then laid down at low alpha
let SHC, SHX;
function shadowOf(ctx, f) {
  const q = corners(f).map((p) => { const g = sub(p, mul(LIGHT, p[1] / LIGHT[1])); return proj([g[0], 0, g[2]]); });
  ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
}

// camera: auto-fit per scene, eased between scenes
const CAMK = [[0, 'bank'], [T_M1, 'piles'], [T_M2, 'ring'], [T_M3, 'tall'], [T_M4, 'split'], [T_SHUF[0] + 0.4, 'merged'], [T_M5, 'house']];
function camAt(t) {
  let i = 0; while (i < CAMK.length - 1 && t >= CAMK[i + 1][0]) i++;
  const b = CF[CAMK[i][1]], a = i ? CF[CAMK[i - 1][1]] : b, k = i ? E.inOutCubic(prog(t, CAMK[i][0] + 0.05, CAMK[i][0] + 0.85)) : 1;
  return { K: Math.exp(lerp(Math.log(a.K), Math.log(b.K), k)) * (1 + 0.012 * Math.sin(t * 0.6)), ux: lerp(a.ux, b.ux, k), uy: lerp(a.uy, b.uy, k) };
}
function drawCards(ctx, t) {
  CAM = { ...CAM, ...camAt(t), sx: 540, sy: Y(575) };
  const list = [];
  for (const f of state(t)) if (f.vis > 0.05 && f.sc > 0.02) list.push({ f, d: dot(f.c, VIEW) });
  for (const h of heroes(t)) list.push({ f: h, d: dot(h.c, VIEW) + (h.faceUp ? 0.2 : 0.3), hero: true, tag: h.tag });
  // shadow layer
  SHX.setTransform(1, 0, 0, 1, 0, 0); SHX.clearRect(0, 0, W, H); SHX.setTransform(ctx.getTransform()); SHX.fillStyle = '#021552';
  for (const it of list) shadowOf(SHX, it.f);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 0.26; ctx.drawImage(SHC, 0, 0); ctx.restore();
  list.sort((a, b) => a.d - b.d);
  for (const it of list) drawCard(ctx, it.f, { hero: it.hero, tag: it.tag });
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
  label(ctx, '0% INTEREST CARD', t, 5.85, 7.95, 108);
  label(ctx, '20,000', t, 8.2, 9.3, 150);
  label(ctx, 'COMBINE IT', t, 9.42, 11.6, 132);
  label(ctx, 'ON THE 0% CARD', t, 11.76, 12.85, 112);
  label(ctx, 'STACK IT UP', t, 14.0, END - 0.25, 140);
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

// ================================================================== sound (same timing constants as the picture)
function buildHits() {
  const h = [];
  for (let i = 0; i < 18; i++) h.push([T_BANK + i * T_BANK_DT, 'part', i < 9 ? 'click' : 'tok', i < 9 ? { gain: 0.22 } : { pitch: ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6'][i - 9], gain: 0.2 }]);
  const flock = (t0, n = 10, spc = 0.05, g = 0.1) => { h.push([t0, 'whoosh', 'whoosh', { len: 0.55, from: 500, to: 2600, gain: 0.22 }]); for (let i = 0; i < n; i++) h.push([t0 + 0.45 + i * spc, 'land', 'tick', { gain: g }]); };
  flock(T_M1); flock(T_M2); flock(T_M4, 8);
  for (let j = 0; j < NMOVE; j++) h.push([T_FLOW + j * FLOW_DT + FLOW_D, 'card lands on B', 'tick', { gain: 0.16 + 0.06 * hash01(j, 4) }]);
  h.push([T_FLOW + NMOVE * FLOW_DT + FLOW_D, 'done', 'click', { gain: 0.3 }]);
  h.push([T_M2 + 0.45, 'hero', 'thud', { gain: 0.4 }], [T_SPIN[0], 'spin', 'whoosh', { len: 0.9, from: 400, to: 1800, gain: 0.18 }], [T_SPIN[1], 'face', 'pop', { pitch: 'E6', gain: 0.28 }]);
  for (let i = 0; i < 20; i++) h.push([T_M3 + 0.3 + i * (0.62 / 20), 'deal', 'tick', { gain: 0.1 }]);
  h.push([8.24, '20,000', 'bell', { pitch: 'G5', gain: 0.3 }]);
  for (let m = 0; m < NL + NR; m += 2) h.push([T_SHUF[0] + m * ((T_SHUF[1] - T_SHUF[0]) / (NL + NR)) + 0.3, 'riffle', 'tick', { gain: 0.09 + 0.05 * hash01(m, 6) }]);
  h.push([T_SHUF[1] + 0.32, 'squared', 'click', { gain: 0.35 }], [T_HERO, '0% card', 'thud', { gain: 0.45 }], [T_HERO + 0.02, 'tag', 'pop', { pitch: 'G6', gain: 0.22 }]);
  const n = 26; for (let i = 0; i < n; i++) h.push([lerp(T_M5 + 0.47, T_STACK, i / (n - 1)), 'house', 'tok', { pitch: ['C5', 'D5', 'E5', 'G5'][Math.min(3, Math.floor(i / 7))], gain: 0.14 }]);
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
  SHC = makeCanvas(W, H); SHX = SHC.getContext('2d');
}

// ================================================================== footage
let FOOT = null; const FCACHE = new Map();
async function loadFrame(t) {
  const idx = Math.min(SRC_FRAMES, Math.max(1, Math.floor(t * SRC_FPS) + 1));
  if (!FCACHE.has(idx)) { const im = new Image(); im.src = `assets/footage/f_${String(idx).padStart(5, '0')}.jpg`; try { await im.decode(); } catch { return; } FCACHE.set(idx, im); while (FCACHE.size > 8) FCACHE.delete(FCACHE.keys().next().value); }
  FOOT = FCACHE.get(idx);
}
function pushIn(t) { for (const [a, b] of FULL_WINDOWS) if (t >= a - 0.5 && t < b + 0.8) return Math.pow(1.1, P(t, a, b + 0.8, E.inOutSine)); return 1; }
const FAST = [T_BANK, T_M1, T_FLOW, T_M2, T_SPIN[0], T_M3, T_M4, T_SHUF[0], T_M5];
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
