// CCE — "18C Card Structures 3D" founder split-screen. Pure function of time: window.seek(t) paints frame t.
// Variant of 18 Card Ribbon: the same white credit cards on riso blue, but built into real 3D structures:
// a bank of stacked and leaning cards, piles that deal from one to another, a spinning hero card on a ribbon ring,
// a riffle shuffle that combines two piles, and a house of cards for "stack it up".
// Every card is a true 3D plane (white front with card art, blue back with a magnetic stripe), lit, shadowed, depth-sorted.
// Clip: Video 14 "The small transaction" (no new transactions on the card, a little availability, one transaction,
// interest on all of it, a mistake made a few times, call in and they'll reverse it).
import * as M from './lib/motion.js';
import * as BR from './lib/brand.js';

const { W, H, E, prog, clamp, lerp, spring, springKeys, SPRING, font, mulberry32, cover, hash01 } = M;
const DW = 1080, DH = 1920, S = W / DW, TAU = M.TAU;
const C = { bg: '#0B48C8', ink: '#123A9E', card: '#FFFFFF', back: '#9DB8F2', stripe: '#0C2466', white: '#FFFFFF', gold: '#CB9938', maroon: '#6B0505' };
const DISPLAY = 'Display', UI = 'UI';
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 567;
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

// ================================================================== structures
const N = 96;
const flat = (a, y, b, sc, yaw = 0) => F(W3(a, y, b), rot(GR, UP, yaw), rot(GU, UP, yaw), sc);
const TH = 0.035, PS = 1.35;                         // card thickness in a pile (per unit of scale), pile card scale
const NB = 40, NT = 2, NI = 24, NM = 24;             // balance cards, transactions, interest cards, "a few times" cards
const I_T = NB, I_I = NB + NT, I_M = NB + NT + NI;   // first index of each group
const BASE = 0.06;                                   // pile base height (on top of the card lying flat)
const pileF = (k) => flat(0.04 * (hash01(k, 1) - 0.5), BASE + k * TH * PS, 0.04 * (hash01(k, 2) - 0.5), PS, 0.08 * (hash01(k, 3) - 0.5));
// where each card lands when the pile topples: thrown out along +A (the fall direction), higher cards further
function scatterF(k) {
  const h = k / (NB + NT + NI), r = 0.8 + 3.6 * h + 0.8 * hash01(k, 41), an = (hash01(k, 42) - 0.5) * 2.2;
  return flat(0.9 + Math.cos(an) * r, 0.03 + 0.0025 * k, Math.sin(an) * r * 0.9, PS, TAU * hash01(k, 43));
}
// "a few times": three small piles drop on the left and topple in turn
const MP = [[-3.4, 1.8], [-4.4, -0.6], [-2.6, -2.6]], MPT = [13.75, 14.25, 14.75];
const miniF = (m, k) => flat(MP[m][0] + 0.03 * (hash01(m * 9 + k, 5) - 0.5), 0.03 + k * TH * 1.0, MP[m][1], 1.0, 0.1 * (hash01(m * 9 + k, 6) - 0.5));
const miniScatter = (m, k) => { const an = hash01(m * 9 + k, 7) * TAU, r = 0.4 + 1.2 * hash01(m * 9 + k, 8); return flat(MP[m][0] + Math.cos(an) * r, 0.02 + 0.002 * k, MP[m][1] + Math.sin(an) * r * 0.8, 1.0, TAU * hash01(m * 9 + k, 9)); };

// ================================================================== motion
function fly(a, b, k, lift = 2, turns = 1, axisSeed = 0) {
  const e = E.inOutCubic(k), c = lerp3(a.c, b.c, e); c[1] += Math.sin(Math.PI * e) * lift;
  let ex = lerp3(a.ex, b.ex, e), ey = lerp3(a.ey, b.ey, e);
  if (Math.hypot(...ex) < 0.2) ex = a.ex;
  ex = norm(ex); ey = norm(sub(ey, mul(ex, dot(ey, ex)))); if (Math.hypot(...ey) < 0.2) ey = norm(cross(ex, UP));
  if (turns) { const ax = norm(lerp3(ex, ey, hash01(axisSeed, 5))), an = TAU * turns * E.inOutSine(k); ex = rot(ex, ax, an); ey = rot(ey, ax, an); }
  return F(c, ex, ey, lerp(a.sc, b.sc, e), lerp(a.vis, b.vis, Math.min(1, e * 1.4)));
}
function drop(f, t, tl, h = 2.2, dur = 0.22) {
  if (t < tl - dur) return { ...f, vis: 0 };
  if (t < tl) { const k = (t - (tl - dur)) / dur; return { ...f, c: add(f.c, [0, h * (1 - k * k), 0]), vis: 1 }; }
  const d = t - tl, bob = 0.05 * Math.exp(-d * 10) * Math.sin(d * 34) * f.sc;
  return { ...f, c: add(f.c, [0, Math.max(0, bob), 0]) };
}
const settle = (f, t, tl) => { const d = t - tl; return d > 0 ? { ...f, c: add(f.c, [0, Math.max(0, 0.05 * Math.exp(-d * 12) * Math.sin(d * 30)), 0]) } : f; };

// ---- timeline (seconds; Video 14 word timings)
const T_CARD = 0.95;                         // "you can't use that credit card": the card drops in, standing
const T_BLOCK = [2.3, 3.2];                  // "for any new transactions": small cards fly at it and bounce off
const T_LAY = 3.35;                          // the card lies down; the balance is dealt onto it
const T_DEAL = 3.5, DEAL_DT = 0.027;
const T_TX = [6.55, 7.5];                    // "a transaction or a subscription": two cards fill the gap under the limit
const T_INT = 9.7, INT_DT = 0.05;            // "start hitting you with interest": interest cards rain onto the pile
const T_ALL = 11.15;                         // "for all of it": the whole balance turns maroon, bottom to top
const T_FALL = 12.0;                         // (host shot) the pile topples
const T_UP = 16.45;                          // "luckily you can call in": the card stands back up
const T_COMPLAIN = 17.6;                     // "complain": it rocks
const T_REV = 18.7;                          // "they'll reverse it": everything flies back, interest lifts away, white again

function pileAt(k, t) {   // balance + transaction + interest card k, before the topple
  if (k < NB) return drop(pileF(k), t, T_DEAL + k * DEAL_DT, 0.8, 0.14);
  if (k < I_I) { const j = k - NB, tl = T_TX[j], from = flat(3.8, 2.2, 1.6, PS, 1.2), k2 = prog(t, tl - 0.5, tl); return k2 <= 0 ? { ...from, vis: 0 } : k2 >= 1 ? settle(pileF(k), t, tl) : fly(from, pileF(k), k2, 1.0, 1, k); }
  return drop(pileF(k), t, T_INT + (k - I_I) * INT_DT, 1.0, 0.16);
}
function cardsAt(t) {
  const out = [];
  for (let k = 0; k < I_M; k++) {
    let f = pileAt(k, t);
    // "then it will actually start…": a tremor builds in the pile before the interest hits
    if (t > 8.4 && t < T_FALL) { const g = P(t, 8.4, T_INT, E.inCubic) * (1 - P(t, T_INT + 0.2, T_INT + 0.6)); if (g > 0) f = { ...f, c: add(f.c, mul(GR, 0.035 * g * Math.sin(t * 61 + k * 1.7))) }; }
    const tFall = T_FALL + (1 - k / I_M) * 0.18;   // the top goes first
    if (t > tFall) { const kk = prog(t, tFall, tFall + 0.55); f = kk >= 1 ? settle(scatterF(k), t, tFall + 0.55) : fly(pileF(k), scatterF(k), kk, 0.5 + 0.8 * (k / I_M), 0.5, k); }
    // reverse: the balance flies back into a neat pile (top card first); interest cards lift away
    if (t > T_REV) {
      if (k < I_I) { const tb = T_REV + 0.05 + (k / I_I) * 0.35, kk = prog(t, tb, tb + 0.45); f = kk <= 0 ? scatterF(k) : kk >= 1 ? settle(pileF(k), t, tb + 0.45) : fly(scatterF(k), pileF(k), kk, 1.2, 0.5, k + 3); }
      else { const kk = prog(t, T_REV + 0.02 * (k - I_I), T_REV + 0.02 * (k - I_I) + 0.5); const gone = { ...scatterF(k), c: add(scatterF(k).c, [0, 4, 0]), vis: 0, sc: 0.4 }; f = kk >= 1 ? gone : fly(scatterF(k), gone, kk, 1.5, 1, k); }
    }
    // tint: transactions show gold edges? no — the interest is maroon; on "all of it" the whole balance turns maroon; reversed back to white
    let tint = k >= I_I ? 1 : clamp((t - T_ALL - (k / I_I) * 0.45) / 0.08);
    if (t > T_REV + 0.4) tint *= 1 - clamp((t - T_REV - 0.4 - (1 - k / I_I) * 0.4) / 0.1);
    out.push({ ...f, tint });
  }
  // "a few times": three small piles drop and topple, one after another; they lift away on the reverse
  for (let m = 0; m < 3; m++) for (let k = 0; k < 8; k++) {
    const t0 = MPT[m], i = m * 8 + k;
    let f = drop(miniF(m, k), t, t0 - 0.25 + k * 0.025, 1.2, 0.15);
    const tf = t0 + 0.12 + (1 - k / 8) * 0.06; if (t > tf) { const kk = prog(t, tf, tf + 0.35); f = kk >= 1 ? miniScatter(m, k) : fly(miniF(m, k), miniScatter(m, k), kk, 0.4, 0.5, i); }
    if (t > T_REV) { const kk = prog(t, T_REV + 0.01 * i, T_REV + 0.01 * i + 0.45); const gone = { ...miniScatter(m, k), c: add(miniScatter(m, k).c, [0, 4, 0]), vis: 0, sc: 0.4 }; f = kk >= 1 ? gone : fly(miniScatter(m, k), gone, kk, 1.4, 1, i); }
    out.push({ ...f, tint: 1 });
  }
  return out;
}
// the hero card (the balance-transfer card) and the limit card
const CARD_STAND = (t) => F(W3(0, 0.63 * 3.2 / 2 + 0.06 + 0.06 * Math.sin(t * 2), 0), rot(GR, UP, 0.3 + 0.15 * Math.sin(t * 0.8)), UP, 3.2);
const CARD_FLAT = () => F(W3(0, 0.02, 0), GR, GU, 2.6);
const CARD_SIDE = (t) => F(W3(-3.4, 0.63 * 2.4 / 2 + 0.05, 1.4), rot(GR, UP, 0.5), UP, 2.4);
function heroes(t) {
  const out = [];
  let h = null;
  if (t > T_CARD - 0.25) {
    if (t < T_LAY) h = drop(CARD_STAND(t), t, T_CARD, 2.0, 0.25);
    else if (t < T_UP) { const k = prog(t, T_LAY, T_LAY + 0.4); h = k >= 1 ? CARD_FLAT() : fly(CARD_STAND(t), CARD_FLAT(), k, 0.3, 0); }
    else { const k = prog(t, T_UP, T_UP + 0.5); h = k >= 1 ? CARD_SIDE(t) : fly(CARD_FLAT(), CARD_SIDE(t), k, 1.2, 0); }
    // "complain": two rocks
    if (t > T_COMPLAIN && t < T_COMPLAIN + 0.8) { const d = t - T_COMPLAIN, a = 0.22 * Math.sin(d * 18) * Math.exp(-d * 4); h = { ...h, ex: rot(h.ex, GU, a), ey: rot(h.ey, GU, a) }; }
    out.push({ ...h, hero: true, tag: '0%', faceUp: t >= T_LAY && t < T_UP });
  }
  // the limit: a gold-tagged card floating above the pile, a small gap above the balance
  const lidK = clamp(sp(t, T_DEAL + NB * DEAL_DT + 0.1, SPRING.bouncy)) * (t < T_FALL ? 1 : 0);
  if (lidK > 0.01) {
    const limitY = BASE + (NB + NT + 3) * TH * PS, top = BASE + countOn(t) * TH * PS + 0.08;
    const trem = P(t, 8.4, T_INT, E.inCubic) * (1 - P(t, T_INT + 0.2, T_INT + 0.6));
    const y = Math.max(limitY, top) + 0.04 * Math.sin(t * 3) + 0.05 * trem * Math.abs(Math.sin(t * 47));
    out.push({ ...flat(0, y, 0, PS * 1.15 * lidK, 0.04), hero: true, tag: 'LIMIT', lid: true });
  }
  return out;
}
function countOn(t) { let n = 0; for (let k = 0; k < I_M; k++) { const tl = k < NB ? T_DEAL + k * DEAL_DT : k < I_I ? T_TX[k - NB] : T_INT + (k - I_I) * INT_DT; if (t > tl) n = k + 1; } return n; }
// small "new transaction" cards that fly at the standing card and bounce off (blocked)
function blocked(t) {
  const out = [];
  for (let j = 0; j < 5; j++) {
    const t0 = T_BLOCK[0] + j * 0.16, k = prog(t, t0, t0 + 0.32); if (k <= 0 || t > t0 + 0.75) continue;
    const from = W3(4.6, 1.4 + 0.5 * (j % 3), 1.2 + 0.4 * (j - 2)), hit = W3(1.0, 1.0 + 0.4 * (j % 3), 0.6 + 0.3 * (j - 2));
    let c = k < 1 ? lerp3(from, hit, E.inCubic(k)) : hit;
    const d = t - t0 - 0.32; if (d > 0) c = add(hit, [0.9 * d * 3, 2.2 * d - 9 * d * d, 0.4 * d]);   // bounce back and fall
    const f = F(c, rot(GR, UP, 1.3 + j), rot(GU, UP, 1.3 + j), 0.9, clamp(1 - (d - 0.25) * 4));
    out.push({ ...f, ex: rot(f.ex, GR, d > 0 ? d * 9 : 0), ey: rot(f.ey, GR, d > 0 ? d * 9 : 0) });
  }
  return out;
}

// ================================================================== drawing
function rrPath(ctx, rx, ry) {
  ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(1 - rx, 0); ctx.quadraticCurveTo(1, 0, 1, ry); ctx.lineTo(1, 1 - ry); ctx.quadraticCurveTo(1, 1, 1 - rx, 1);
  ctx.lineTo(rx, 1); ctx.quadraticCurveTo(0, 1, 0, 1 - ry); ctx.lineTo(0, ry); ctx.quadraticCurveTo(0, 0, rx, 0); ctx.closePath();
}
function drawCard(ctx, f, { hero = false, tag = null, tint = 0 } = {}) {
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
  const col = M.mix(front ? C.card : C.back, C.maroon, tint * 0.9), lo = M.mix('#7F93C8', '#2A0202', tint);
  ctx.fillStyle = M.mix(lo, col, clamp(lit * (0.55 + 0.45 * shade) + 0.12)); ctx.fill();
  ctx.lineWidth = hero ? 2.2 : 1.15; ctx.strokeStyle = tint > 0.5 ? '#2A0202' : C.ink; ctx.lineJoin = 'round'; ctx.stroke();
  if (area > 220) {
    const k = clamp((area - 220) / 500), Q = (u, v) => [o[0] + ax * u + bx * v, o[1] + ay * u + by * v];
    const poly = (pts, close = false) => { ctx.beginPath(); pts.forEach(([u, v], i) => { const q = Q(u, v); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); if (close) ctx.closePath(); };
    ctx.globalAlpha *= k * (1 - 0.5 * tint); ctx.lineWidth = hero ? 2 : 1.2; ctx.lineCap = 'round'; ctx.strokeStyle = tint > 0.5 ? '#F2D6D6' : C.ink;
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
// camera: framings fitted to the actual scene at key times, eased between
const CAMK = [[0, 2.0, 640, 470], [T_LAY, 5.2, 640, 440], [T_INT, 11.6, 620, 470], [T_FALL - 0.1, 14.9, 680, 420], [15.25, 16.0, 780, 440], [T_UP, 17.0, 820, 450], [T_REV + 0.2, 20.5, 780, 450]];
function framesAt(t) { return [...cardsAt(t), ...heroes(t), ...blocked(t)].filter((f) => f.vis > 0.5 && f.sc > 0.05); }
function camAt(t) {
  let i = 0; while (i < CAMK.length - 1 && t >= CAMK[i + 1][0]) i++;
  const b = CF[i], a = i ? CF[i - 1] : b, k = i ? E.inOutCubic(prog(t, CAMK[i][0], CAMK[i][0] + 0.7)) : 1;
  return { K: Math.exp(lerp(Math.log(a.K), Math.log(b.K), k)) * (1 + 0.012 * Math.sin(t * 0.6)), ux: lerp(a.ux, b.ux, k), uy: lerp(a.uy, b.uy, k) };
}
const CF = [];
function buildShapes() { CAMK.forEach(([, tk, bw, bh], i) => (CF[i] = fit(framesAt(tk), bw, bh))); }
function drawCards(ctx, t) {
  CAM = { ...CAM, ...camAt(t), sx: 540, sy: Y(575) };
  const list = [];
  for (const f of cardsAt(t)) if (f.vis > 0.05 && f.sc > 0.02) list.push({ f, d: dot(f.c, VIEW), tint: f.tint });
  for (const f of blocked(t)) if (f.vis > 0.05) list.push({ f, d: dot(f.c, VIEW) });
  for (const h of heroes(t)) list.push({ f: h, d: h.faceUp ? -1e3 : dot(h.c, VIEW) + 0.2, hero: true, tag: h.tag });
  SHX.setTransform(1, 0, 0, 1, 0, 0); SHX.clearRect(0, 0, W, H); SHX.setTransform(ctx.getTransform()); SHX.fillStyle = '#021552';
  for (const it of list) shadowOf(SHX, it.f);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 0.26; ctx.drawImage(SHC, 0, 0); ctx.restore();
  list.sort((a, b) => a.d - b.d);
  for (const it of list) drawCard(ctx, it.f, { hero: it.hero, tag: it.tag, tint: it.tint || 0 });
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
  label(ctx, 'NO NEW TRANSACTIONS', t, 1.25, 3.3, 104);
  label(ctx, 'A LITTLE AVAILABILITY', t, 4.85, 6.15, 98);
  label(ctx, 'ONE TRANSACTION', t, 6.45, 7.1, 112);
  label(ctx, 'OR A SUBSCRIPTION', t, 7.38, 8.4, 108);
  label(ctx, 'INTEREST ON ALL OF IT', t, 9.65, 11.85, 100);
  label(ctx, "IT'S CRAZY", t, 12.7, 13.1, 140);
  label(ctx, 'LEARNED THAT MISTAKE', t, 13.4, 14.0, 104);
  label(ctx, 'A FEW TIMES', t, 14.3, 15.2, 130);
  label(ctx, 'CALL IN', t, 16.6, 18.35, 140);
  label(ctx, 'THEY MAY REVERSE IT', t, 18.68, 19.62, 104);
  label(ctx, 'TAKEN CARE OF', t, 19.92, END - 0.1, 120);
  const dk = P(t, 1.3, 1.6) * (1 - P(t, END - 0.2, END));
  if (dk > 0.01) { ctx.save(); ctx.globalAlpha = 0.85 * dk; ctx.font = font(24, 500, UI); ctx.textAlign = 'center'; ctx.fillStyle = C.white; ctx.fillText('Individual results vary. Education only.', 540, Y(285) - Math.max(0, SEAM - FH) * 0.26); ctx.restore(); }
}

// ================================================================== layout over time
const END = 20.99; window.__END = END;
const FH_KEYS = [[0, 1920], [0.8, SEAM], [11.95, 0], [15.25, SEAM], [END, 0]];
function footH(t) {
  let v = springKeys(t, FH_KEYS, { stiffness: 150, damping: 17 });
  for (let i = 1; i < FH_KEYS.length; i++) v -= Math.sign(FH_KEYS[i][1] - FH_KEYS[i - 1][1]) * 34 * antic(t, FH_KEYS[i][0], 0.22);
  return clamp(v, 0, DH);
}
const FULL_WINDOWS = [[0, 0.8]];

// ================================================================== sound (same timing constants as the picture)
function buildHits() {
  const h = [];
  h.push([T_CARD, 'card lands', 'thud', { gain: 0.45 }]);
  for (let j = 0; j < 5; j++) h.push([T_BLOCK[0] + j * 0.16 + 0.32, 'blocked', 'tok', { pitch: ['E4', 'D4', 'C4', 'D4', 'C4'][j], gain: 0.22 }]);
  h.push([T_LAY + 0.4, 'lies down', 'click', { gain: 0.3 }]);
  for (let k = 0; k < NB; k += 2) h.push([T_DEAL + k * DEAL_DT, 'deal', 'tick', { gain: 0.1 + 0.05 * hash01(k, 3) }]);
  h.push([T_DEAL + NB * DEAL_DT + 0.1, 'limit', 'pop', { pitch: 'E6', gain: 0.25 }]);
  T_TX.forEach((tl, j) => h.push([tl - 0.3, 'swipe', 'whoosh', { len: 0.35, from: 900, to: 2600, gain: 0.18 }], [tl, 'transaction lands', 'click', { gain: 0.38 }]));
  for (let j = 0; j < NI; j++) h.push([T_INT + j * INT_DT, 'interest', 'tick', { gain: 0.12 + 0.08 * (j / NI) }]);
  for (let i = 0; i < 8; i++) h.push([8.5 + i * 0.14, 'tremor', 'tick', { gain: 0.05 + 0.02 * i }]);
  h.push([T_ALL, 'all of it', 'boing', { pitch: 'G4', to: 'C4', gain: 0.25 }]);
  h.push([T_FALL, 'topple', 'whoosh', { len: 0.5, from: 1800, to: 400, gain: 0.25 }], [T_FALL + 0.5, 'crash', 'thud', { gain: 0.5 }]);
  for (let i = 0; i < 12; i++) h.push([T_FALL + 0.3 + i * 0.03, 'scatter', 'tick', { gain: 0.12 }]);
  MPT.forEach((t0) => h.push([t0 - 0.05, 'mini pile', 'click', { gain: 0.2 }], [t0 + 0.3, 'mini topple', 'thud', { gain: 0.28 }]));
  h.push([T_UP, 'stands up', 'whoosh', { len: 0.4, from: 500, to: 2000, gain: 0.2 }], [T_UP + 0.5, 'up', 'click', { gain: 0.3 }]);
  h.push([T_COMPLAIN, 'complain', 'tok', { pitch: 'C5', gain: 0.25 }], [T_COMPLAIN + 0.17, 'complain', 'tok', { pitch: 'C5', gain: 0.2 }]);
  h.push([T_REV, 'rewind', 'whoosh', { len: 0.7, from: 400, to: 2600, gain: 0.3 }]);
  for (let i = 0; i < 14; i++) h.push([T_REV + 0.5 + i * 0.03, 'restack', 'tick', { gain: 0.12 }]);
  h.push([T_REV + 0.95, 'white again', 'bell', { pitch: 'E6', gain: 0.3 }], [19.95, 'done', 'pop', { pitch: 'C6', gain: 0.3 }]);
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
const FAST = [T_CARD, T_BLOCK[0], T_LAY, T_DEAL, T_TX[0], T_TX[1], T_INT, T_FALL, 13.6, T_UP, T_REV];
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
