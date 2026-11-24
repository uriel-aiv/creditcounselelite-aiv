// CCE — "11 Vox Explainer" founder split-screen, with printed photos as the evidence. Pure function of time.
// Look: a desk of grid paper seen top-down; printed photos (the Nano Banana iPhone set, run through halftone, duotone,
// screen print and photocopy treatments) with worn cream borders, slapped down and taped; yellow marker labels stuck on;
// blue ballpoint ovals, arrows, underlines and notes drawn on live; highlighter swipes; a newsprint serif headline.
// The camera glides across one continuous desk from station to station, so every beat stays on the same table.
import * as M from './lib/motion.js';
import * as BR from './lib/brand.js';

const { W, H, E, prog, clamp, lerp, spring, springKeys, SPRING, wobble, font, mulberry32, cover, rrect } = M;
const DW = 1080, DH = 1920, S = W / DW, TAU = M.TAU;
const C = { maroon: '#6B0505', green: '#266235', teal: '#008C96', pbBlue: '#114BA7', gold: '#CB9938', light: '#ADC8E3',  paper: '#ECEDE9', grid: 'rgba(110,128,160,0.20)', grid5: 'rgba(110,128,160,0.34)', ink: '#1B1B1B', pen: '#004AAD', yellow: '#CB9938', cream: '#F2EDE1' };
const SERIF = 'Display' /* Anton: condensed sans */, UI = 'UI', MARK = 'Marker', HAND = 'Hand';
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 478;
const SEAM = 980;
{ const arc0 = CanvasRenderingContext2D.prototype.arc; CanvasRenderingContext2D.prototype.arc = function (x, y, r, a0, a1, ccw) { return arc0.call(this, x, y, Math.max(0, r), a0, a1, ccw); }; }

const HITS = [
  [1.15, 'gift', 'whoosh', { len: 0.4, from: 800, to: 2200, gain: 0.25 }], [1.9, 'coins', 'coins', { gain: 0.4 }], [2.6, 'label', 'click', { gain: 0.45 }], [3.0, 'pen', 'type', { len: 0.6, gain: 0.2 }],
  [4.55, 'hand', 'type', { len: 0.45, gain: 0.25 }], [4.6, 'marker', 'whoosh', { len: 0.4, from: 2600, to: 1200, gain: 0.25 }], [5.3, 'camera', 'whoosh', { len: 0.6, from: 400, to: 1800, gain: 0.3 }],
  [6.0, 'envelope', 'whoosh', { len: 0.4, gain: 0.25 }], [8.55, 'label', 'click', { gain: 0.45 }], [8.9, 'marker', 'whoosh', { len: 0.4, from: 2600, to: 1200, gain: 0.25 }], [9.4, 'hand', 'type', { len: 0.8, gain: 0.25 }],
  [10.3, 'camera', 'whoosh', { len: 0.6, from: 400, to: 1800, gain: 0.3 }], [11.15, 'cross', 'whoosh', { len: 0.25, from: 3200, to: 900, gain: 0.35 }], [11.4, 'cross', 'whoosh', { len: 0.25, from: 3200, to: 900, gain: 0.35 }],
  [12.9, 'beach', 'whoosh', { len: 0.4, gain: 0.25 }], [13.0, 'travel', 'click', { gain: 0.5 }], [14.6, 'count', 'type', { len: 1.0, gain: 0.25 }], [15.6, '21x', 'bell', { pitch: 'E6', gain: 0.4 }],
  [17.4, 'to end', 'whoosh', { len: 0.5, from: 500, to: 2400, gain: 0.4 }], [17.65, 'badge', 'thud', { gain: 0.7 }],
];

// ------------------------------------------------------------------ helpers
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);
const pop = (t, t0, cfg = { stiffness: 300, damping: 18 }) => (t < t0 ? 0 : Math.max(0, spring(t - t0, cfg)));
const P = (t, a, b, ease = E.inOutCubic) => ease(prog(t, a, b));
const antic = (t, t0, dur = 0.2) => { const p = prog(t, t0 - dur, t0 + 0.02); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; };
let FH = DH;
const Y = (y) => y - (FH - SEAM);
function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }

// ------------------------------------------------------------------ stop motion: everything on the collage moves in held steps and boils
const FPS_SM = 12;                  // collage animates at 12 steps a second (on twos), like hand-pushed paper
let BOIL = 0;                       // changes every step: re-jitters every cut edge, pen line and letter
const BOILAMT = 0.5;
const jit = (seed, amt) => { const r = mulberry32((seed * 7919 + BOIL * 104729) >>> 0); return [(r() - 0.5) * amt * BOILAMT, (r() - 0.5) * amt * BOILAMT, r()]; };
const hashS = (s) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };

// ------------------------------------------------------------------ hand-made pieces (pre-cut PNGs: scissor polygons, torn scraps, square prints)
const PIECES = ['cut_card_navy', 'cut_card_gold', 'cut_man', 'cut_woman', 'cut_paperwork', 'cut_folder_docs', 'sq_planner', 'sq_beach', 'sq_pool',
  'det_planner', 'det_wing', 'det_card_black', 'det_card_white', 'det_card_green', 'det_card_navy', 'det_card_gold',
  'scr_kraft', 'scr_news', 'scr_notebook', 'scr_notebook2', 'scr_blue', 'scr_cardboard', 'scr_yellow', 'scr_kraft2', 'scr_news2',
  'g_card_black', 'g_card_navy', 'g_card_gold', 'g_card_white', 'g_card_green', 'g_fan', 'g_envelope', 'g_coins', 'g_boarding', 'g_hourglass', 'g_gift', 'sq_bank', 'det_calendar',
  'st_1', 'st_2', 'st_3', 'st_4', 'st_5', 'st_6',
  'tr_docs', 'tr_gift', 'tr_window', 'tr_hourglass', 'tr_card_navy', 'tr_coins', 'tr_card_white', 'tr_boarding', 'tr_flip', 'tr_calendar', 'tr_envelope', 'tr_bank', 'tr_card_gold', 'tr_fan', 'tr_card_green', 'tr_card_black'];
let IMGP = {};
function roughRect(r, x0, y0, x1, y1, amt, tornSide = -1) {
  const pts = [], side = (ax, ay, bx, by, k) => {
    const L = Math.hypot(bx - ax, by - ay), n = k === tornSide ? Math.round(L / 7) : 3 + Math.floor(r() * 4), nx = -(by - ay) / L, ny = (bx - ax) / L;
    for (let i = 0; i < n; i++) { const f = i / n, d = k === tornSide ? (r() - 0.3) * amt * 2.2 : (r() - 0.5) * amt; pts.push([lerp(ax, bx, f) + nx * d, lerp(ay, by, f) + ny * d]); }
  };
  side(x0, y0, x1, y0, 0); side(x1, y0, x1, y1, 1); side(x1, y1, x0, y1, 2); side(x0, y1, x0, y0, 3);
  return pts;
}

// pins, clips, tape: dropped on in two held steps, no travel
function deco(ctx, key, x, y, w, rot, k) { const im = IMGP[key]; if (!im || k <= 0.01) return; const [jx, jy] = jit(hashS(key) + Math.round(x), 2); const ww = w * (k < 1 ? 1.15 : 1);
  ctx.save(); ctx.translate(x + jx, y + jy); ctx.rotate(rot); ctx.shadowColor = 'rgba(25,20,10,0.45)'; ctx.shadowBlur = 1; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3; ctx.drawImage(im, -ww / 2, -ww * im.height / im.width / 2, ww, ww * im.height / im.width); ctx.restore(); }
// a piece pushed on from off-table in held steps (k 0..1, no overshoot), boiling; `out` pushes it off again
function piece(ctx, key, x, y, w, rot, k, out = 0, dir = null) {
  const im = IMGP[key]; if (!im || k <= 0.001 || out >= 0.999) return null;
  const hs = hashS(key), ang = dir ?? (hs % 628) / 100, ks = E.outCubic(clamp(k)), ko = E.inCubic(clamp(out));
  const d = (1 - ks) * 1300 + ko * 1300, [jx, jy] = jit(hs, 2.6), [jr] = jit(hs + 1, 0.008), sc = w / im.width;
  const X = x + Math.cos(ang) * d + jx, Yy = y + Math.sin(ang) * d + jy, R = rot + (1 - ks + ko) * 0.15 * (hs % 2 ? 1 : -1) + jr;
  ctx.save(); ctx.translate(X, Yy); ctx.rotate(R); ctx.shadowColor = 'rgba(25,20,10,0.42)'; ctx.shadowBlur = 1.2; ctx.shadowOffsetX = 2.5; ctx.shadowOffsetY = 3.5;
  ctx.drawImage(im, -w / 2, -im.height * sc / 2, w, im.height * sc); ctx.restore();
  const h = im.height * sc; return (u, v) => { const lx = (u - 0.5) * w, ly = (v - 0.5) * h; return [x + lx * Math.cos(rot) - ly * Math.sin(rot), y + lx * Math.sin(rot) + ly * Math.cos(rot)]; };
}
function tape(ctx, x, y, rot, k, w = 150) {
  if (k <= 0.01) return; const r = mulberry32(Math.round(x * 7 + y)), [jx, jy] = jit(Math.round(x + y), 2);
  ctx.save(); ctx.translate(x + jx, y + jy); ctx.rotate(rot);
  const ww = w * (k < 1 ? 0.5 : 1);                                    // two-step stop-motion stick: half, then full
  ctx.fillStyle = 'rgba(232,224,204,0.8)'; ctx.beginPath(); ctx.moveTo(-ww / 2, -22);
  for (let i = 0; i <= 6; i++) ctx.lineTo(ww / 2 + (i % 2 ? 5 : -2), -22 + i * 44 / 6);
  for (let i = 6; i >= 0; i--) ctx.lineTo(-ww / 2 + (i % 2 ? -5 : 2), -22 + i * 44 / 6);
  ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-ww / 2, -22, ww, 8);
  for (let i = 0; i < 30; i++) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect((r() - 0.5) * ww, (r() - 0.5) * 40, 2, 2); }
  ctx.restore();
}
// yellow cut-paper label, hand-lettered in marker; pushed in from the side in steps
function label(ctx, s, x, y, rot, k, size = 46) {
  if (k <= 0.01) return;
  const hs = hashS(s), [jx, jy] = jit(hs, 2.4), [jr] = jit(hs + 3, 0.012), d = (1 - clamp(k)) * 160 * (hs % 2 ? 1 : -1);
  ctx.save(); ctx.translate(x + d + jx, y + jy); ctx.rotate(rot + jr); ctx.font = font(size, 400, MARK);
  const w = ctx.measureText(s).width + size * 0.9, h = size * 1.45, r = mulberry32(hs);
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 1; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3;
  const pts = roughRect(r, -w / 2, -h / 2, w / 2, h / 2, 7, -1);
  const LC = { 'BANK': C.teal, '6 – 24 MONTHS': C.green, 'PER PERSON': C.teal, 'DOCUMENTATION': C.maroon, '13 CARDS': C.green, 'TRAVEL': C.teal }[s] || C.yellow; ctx.fillStyle = LC; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.closePath(); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.fillStyle = LC === C.yellow ? C.ink : '#FFFFFF'; ctx.textAlign = 'left';
  // hand-lettered: each letter its own tilt and baseline, boiling
  let cx = -w / 2 + size * 0.45; for (let i = 0; i < s.length; i++) { const ch = s[i], cw = ctx.measureText(ch).width, [ox, oy] = jit(hs + i * 13, 2.2), [or] = jit(hs + i * 17, 0.07);
    ctx.save(); ctx.translate(cx + cw / 2 + ox, size * 0.36 + oy); ctx.rotate(or); ctx.fillText(ch, -cw / 2, 0); ctx.restore(); cx += cw; }
  ctx.restore();
}
// blue ballpoint: a jittered polyline drawn from 0..p (and erased from q); re-jittered every step (line boil)
function pen(ctx, pts, p, q = 0, w = 5, seed = 1) {
  if (p - q <= 0.005 || pts.length < 2) return;
  const r = mulberry32((seed * 9973 + BOIL * 31337) >>> 0), j = pts.map(([x, y], i) => [x + (r() - 0.5) * 1.8, y + (r() - 0.5) * 1.8]);
  const n = j.length - 1, a = Math.floor(q * n), b = Math.min(n, Math.ceil(p * n));
  ctx.save(); ctx.strokeStyle = C.pen; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha *= 0.92;
  for (let i = a; i < b; i++) { const f0 = i === a ? (q * n - a) : 0, f1 = i === b - 1 ? (p * n - (b - 1)) : 1; if (f1 <= f0) continue;
    const [x0, y0] = j[i], [x1, y1] = j[i + 1]; ctx.lineWidth = w * (0.75 + 0.5 * Math.sin(i * 0.37 + seed));
    ctx.beginPath(); ctx.moveTo(lerp(x0, x1, f0), lerp(y0, y1, f0)); ctx.lineTo(lerp(x0, x1, f1), lerp(y0, y1, f1)); ctx.stroke(); }
  ctx.restore();
}
// red chisel-tip marker (rectangular nib at 45°): stroke width depends on direction; used for marks over images
function marker(ctx, pts, p, q = 0, w = 16, seed = 1) {
  if (p - q <= 0.005 || pts.length < 2) return;
  const r = mulberry32((seed * 7717 + BOIL * 4513) >>> 0), j = pts.map(([x, y]) => [x + (r() - 0.5) * 2, y + (r() - 0.5) * 2]);
  const n = j.length - 1, a = Math.floor(q * n), b = Math.min(n, Math.ceil(p * n)), nx = Math.cos(-0.8) * w / 2, ny = Math.sin(-0.8) * w / 2;
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(214,38,38,0.86)';
  ctx.beginPath();
  for (let i = a; i < b; i++) { const f0 = i === a ? (q * n - a) : 0, f1 = i === b - 1 ? (p * n - (b - 1)) : 1; if (f1 <= f0) continue;
    const x0 = lerp(j[i][0], j[i + 1][0], f0), y0 = lerp(j[i][1], j[i + 1][1], f0), x1 = lerp(j[i][0], j[i + 1][0], f1), y1 = lerp(j[i][1], j[i + 1][1], f1);
    ctx.moveTo(x0 - nx, y0 - ny); ctx.lineTo(x0 + nx, y0 + ny); ctx.lineTo(x1 + nx, y1 + ny); ctx.lineTo(x1 - nx, y1 - ny); ctx.closePath(); }
  ctx.fill(); ctx.restore();
}
const oval = (cx, cy, rx, ry, tilt = -0.08, n = 70) => Array.from({ length: n + 1 }, (_, i) => { const a = -2.2 + (i / n) * (TAU + 0.6), rr = 1 + 0.05 * Math.sin(i * 0.3); const x = Math.cos(a) * rx * rr, y = Math.sin(a) * ry * rr; return [cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]; });
const bez = (a, c, b, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const k = i / n, u = 1 - k; return [u * u * a[0] + 2 * u * k * c[0] + k * k * b[0], u * u * a[1] + 2 * u * k * c[1] + k * k * b[1]]; });
function penArrow(ctx, a, c, b, p, q = 0, seed = 3) {
  const pts = bez(a, c, b); pen(ctx, pts, p, q, 5, seed);
  if (p > 0.95 && q < 0.5) { const d = Math.atan2(b[1] - pts[pts.length - 4][1], b[0] - pts[pts.length - 4][0]), s = 26, h = clamp((p - 0.95) / 0.05);
    pen(ctx, [[b[0] - Math.cos(d - 0.5) * s, b[1] - Math.sin(d - 0.5) * s], b, [b[0] - Math.cos(d + 0.5) * s, b[1] - Math.sin(d + 0.5) * s]], h, 0, 5, seed + 1); }
}
// handwriting: letters appear one at a time (the current one wiped on left->right), each with its own wobble; boils
function hand(ctx, s, x, y, rot, a, size = 54, reveal = 1) {
  if (a <= 0.01 || reveal <= 0) return;
  const hs = hashS(s);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.font = font(size, 700, HAND); ctx.fillStyle = C.pen; ctx.globalAlpha *= a * 0.95;
  const W0 = ctx.measureText(s).width, n = s.length, upto = reveal * n;
  let cx = -W0 / 2;
  for (let i = 0; i < n; i++) {
    const ch = s[i], cw = ctx.measureText(ch).width; if (i >= upto) break;
    const part = clamp(upto - i), [ox, oy] = jit(hs + i * 11, 1.8), [or] = jit(hs + i * 19, 0.05), dy = Math.sin(i * 1.7 + hs) * size * 0.04;
    ctx.save(); ctx.translate(cx + ox, dy + oy); ctx.rotate(or);
    if (part < 1) { ctx.beginPath(); ctx.rect(-2, -size, (cw + 4) * part, size * 1.6); ctx.clip(); }
    ctx.fillText(ch, 0, 0); ctx.restore(); cx += cw;
  }
  ctx.restore();
}
// a torn scrap of newsprint for collage layering (baked per seed)
const SCRAPS = {};
function scrap(ctx, x, y, w, h, rot, k, seed, words = '') {
  if (k <= 0.001) return;
  let sc = SCRAPS[seed];
  if (!sc) {
    const r = mulberry32(seed), c = canvas(w + 30, h + 30), g = c.getContext('2d'); g.translate(15, 15);
    const pts = roughRect(r, 0, 0, w, h, 10, seed % 4); g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.closePath();
    g.fillStyle = '#E4DFD2'; g.fill(); g.save(); g.clip();
    g.fillStyle = 'rgba(40,40,40,0.55)'; for (let ly = 18; ly < h - 8; ly += 15) { let lx = 12; while (lx < w - 12) { const ww = 12 + r() * 50; g.fillRect(lx, ly, Math.min(ww, w - 12 - lx), 5); lx += ww + 6; } }
    if (words) { g.fillStyle = '#E4DFD2'; g.fillRect(8, 6, w - 16, 70); g.fillStyle = '#151515'; g.font = font(60, 400, SERIF); g.fillText(words, 14, 60); }
    for (let i = 0; i < w * h / 200; i++) { g.fillStyle = `rgba(90,80,60,${0.04 + r() * 0.06})`; g.fillRect(r() * w, r() * h, 2, 1); }
    g.restore(); sc = SCRAPS[seed] = c;
  }
  const ang = (seed % 628) / 100, d = (1 - k) * 1200, [jx, jy] = jit(seed, 2.4);
  ctx.save(); ctx.translate(x + Math.cos(ang) * d + jx, y + Math.sin(ang) * d + jy); ctx.rotate(rot); ctx.shadowColor = 'rgba(25,20,10,0.38)'; ctx.shadowBlur = 1.2; ctx.shadowOffsetX = 2.5; ctx.shadowOffsetY = 3.5;
  ctx.drawImage(sc, -sc.width / 2, -sc.height / 2); ctx.restore();
}
function highlight(ctx, x, y, w, h, rot, p) {
  if (p <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(203,153,56,0.7)';
  ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2 + 4); ctx.lineTo(-w / 2 + w * p, -h / 2); ctx.lineTo(-w / 2 + w * p - 6, h / 2); ctx.lineTo(-w / 2 + 3, h / 2 - 3); ctx.closePath(); ctx.fill(); ctx.restore();
}
// headline: Anton on a torn scrap of the generated newsprint
function headline(ctx, lines, x, y, size, k, rot = 0, key = 'scr_news') {
  if (k <= 0.01) return;
  const m = piece(ctx, key, x, y, size * 3.6, rot, k); if (!m) return;
  const hs = hashS(key), ang = (hs % 628) / 100, d = (1 - E.outCubic(clamp(k))) * 1300, [jx, jy] = jit(hs, 2.6);
  ctx.save(); ctx.translate(x + Math.cos(ang) * d + jx, y + Math.sin(ang) * d + jy); ctx.rotate(rot); ctx.font = font(size, 400, SERIF); ctx.fillStyle = C.ink;
  ctx.fillRect(-size * 1.6, -size * (lines.length * 0.5 + 0.15), size * 3.2, 8);
  lines.forEach((l, i) => ctx.fillText(l, -size * 1.6, -size * (lines.length * 0.5 - 0.95) + i * size * 0.98)); ctx.restore();
}

// ------------------------------------------------------------------ the desk and the camera
const ST = { s1: [0, 0], s2: [1180, 230], s3: [2360, 20], s4: [2560, 1100], s5: [1250, 1320], s6: [0, 1420], s7: [-1150, 640] };
const CAMK_OLD = [
  [0, [0, 30, 1.08]], [6.85, [1180, 230, 1.12]], [12.2, [2360, 30, 1.04]], [18.35, [2560, 1100, 1.04]], [24.3, [1250, 1320, 1.0]],
  [32.3, [1250, 1320, 1.1]], [36.05, [0, 1420, 1.04]], [44.6, [-1150, 640, 1.0]], [49.4, [-1150, 640, 1.06]],
];
const CAMK = [[0, [0, 0, 1.15]], [5.3, [1180, 230, 1.15]], [10.3, [2360, 20, 1.13]], [14.2, [2420, 60, 1.2]]];
function camera(t) {
  const v = springKeys(t, CAMK, { stiffness: 70, damping: 16 });
  const [jx, jy] = jit(1, 1.6); return { x: v[0] + jx, y: v[1] + jy, z: v[2], r: 0 };
}
function desk(ctx, cam) {
  // visible world rect (generous)
  const half = 1100 / cam.z, x0 = cam.x - half, x1 = cam.x + half, y0 = cam.y - half * 1.1, y1 = cam.y + half * 1.1;
  ctx.fillStyle = C.paper; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  const g = 30;
  for (let gx = Math.floor(x0 / g) * g; gx < x1; gx += g) { ctx.fillStyle = Math.round(gx / g) % 5 === 0 ? C.grid5 : C.grid; ctx.fillRect(gx, y0, Math.round(gx / g) % 5 === 0 ? 2 : 1.2, y1 - y0); }
  for (let gy = Math.floor(y0 / g) * g; gy < y1; gy += g) { ctx.fillStyle = Math.round(gy / g) % 5 === 0 ? C.grid5 : C.grid; ctx.fillRect(x0, gy, x1 - x0, Math.round(gy / g) % 5 === 0 ? 2 : 1.2); }
}
// push-in: the piece slides on from off-table over ~0.5 s, overshoots a hair, settles
const land = (t, t0) => (t < t0 - 0.75 ? 0 : prog(t, t0 - 0.75, t0));
const popM = (t, t0) => E.outCubic(prog(t, t0, t0 + 0.3));

// ------------------------------------------------------------------ stations (everything inside x ±400, y ±320 of the station centre)
function bankSketch(ctx, x, y, sz, p, seed = 5) {
  const L = [[[-0.6, -0.15], [0, -0.55], [0.6, -0.15], [-0.6, -0.15]], [[-0.4, -0.05], [-0.4, 0.4]], [[-0.14, -0.05], [-0.14, 0.4]], [[0.14, -0.05], [0.14, 0.4]], [[0.4, -0.05], [0.4, 0.4]], [[-0.66, 0.48], [0.66, 0.48]], [[-0.72, 0.58], [0.72, 0.58]]];
  L.forEach((ln, i) => { const k = clamp(p * L.length - i); if (k > 0) pen(ctx, ln.flatMap((a, j) => j ? Array.from({ length: 8 }, (_, q) => [x + lerp(ln[j - 1][0], a[0], (q + 1) / 8) * sz, y + lerp(ln[j - 1][1], a[1], (q + 1) / 8) * sz]) : [[x + a[0] * sz, y + a[1] * sz]]), k, 0, 6, seed + i); });
}
function st1(ctx, t) {
  const [X, Yw] = ST.s1;
  piece(ctx, 'scr_kraft', X - 190, Yw - 40, 400, -0.05, land(t, 1.2));
  const m = piece(ctx, 'tr_envelope', X - 190, Yw - 60, 340, 0.05, land(t, 1.45)); if (!m) return;
  label(ctx, 'CREDIT LIMIT', X - 190, Yw + 115, -0.04, popM(t, 1.75));
  piece(ctx, 'tr_bank', X + 205, Yw - 75, 320, 0.03, land(t, 2.5));
  deco(ctx, 'st_3', X + 330, Yw - 175, 120, 0.4, P(t, 2.6, 2.7, E.linear) + P(t, 2.7, 2.78, E.linear));
  penArrow(ctx, [X - 60, Yw - 210], [X + 20, Yw - 290], [X + 75, Yw - 190], P(t, 2.25, 2.95, E.inOutSine), 0, 7);
  label(ctx, 'BANK', X + 205, Yw + 95, 0.04, popM(t, 4.1));
  marker(ctx, oval(X + 200, Yw - 72, 185, 140, -0.08), P(t, 4.05, 4.45, E.inOutSine), 0, 14, 9);
  piece(ctx, 'tr_calendar', X - 70, Yw + 235, 300, -0.03, land(t, 5.8), 0, Math.PI / 2);
  deco(ctx, 'st_5', X - 190, Yw + 175, 70, -0.3, P(t, 5.9, 6.0, E.linear) + P(t, 6.0, 6.08, E.linear));
  hand(ctx, 'next day!', X + 205, Yw + 250, -0.05, 1, 64, P(t, 6.2, 6.6, E.linear));
}
function st2(ctx, t) {
  const [X, Yw] = ST.s2;
  headline(ctx, ['FLAT', 'FEE'], X - 200, Yw - 150, 120, popM(t, 7.5), -0.03);
  deco(ctx, 'st_6', X - 15, Yw - 250, 70, 0.2, P(t, 7.7, 7.8, E.linear) + P(t, 7.8, 7.88, E.linear));
  const gone = P(t, 10.85, 11.25, E.linear);
  piece(ctx, 'tr_card_gold', X + 200, Yw - 40, 340, 0.08, land(t, 8.2), gone, 0);
  hand(ctx, '1 – 5%', X + 200, Yw + 190, -0.05, 1 - gone, 90, P(t, 9.28, 9.95, E.linear));
  pen(ctx, oval(X + 200, Yw + 162, 150, 64, -0.05), P(t, 9.95, 10.4, E.inOutSine) * (1 - gone), 0, 5, 13);
  if (t > 10.9) {
    piece(ctx, 'scr_yellow', X + 130, Yw + 140, 330, -0.04, land(t, 11.25));
    ctx.save(); const z = popM(t, 11.25); ctx.translate(X + 130, Yw + 190); ctx.scale(z, z); ctx.font = font(150, 400, SERIF); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText('0%', 0, 0); ctx.restore();
    hand(ctx, 'especially', X + 140, Yw - 10, -0.06, 1, 58, P(t, 10.95, 11.3, E.linear));
  }
}
function st3(ctx, t) {
  const [X, Yw] = ST.s3;
  const m = piece(ctx, 'sq_planner', X - 180, Yw - 50, 350, -0.04, land(t, 12.7)); if (!m) return;
  deco(ctx, 'st_1', X - 180, Yw - 235, 200, 0.05, P(t, 12.85, 12.92, E.linear) + P(t, 12.92, 13.0, E.linear));
  label(ctx, '6 – 24 MONTHS', X - 180, Yw + 150, -0.04, popM(t, 13.2));
  piece(ctx, 'tr_hourglass', X + 210, Yw - 90, 200, 0.06, land(t, 14.9));
  piece(ctx, 'scr_notebook2', X, Yw + 255, 640, 0.02, land(t, 13.4));
  const sx = X - 270, sy = Yw + 275, step = 30;
  for (let mth = 6; mth <= 24; mth++) { const x = sx + (mth - 6) * step; pen(ctx, [[x, sy], [x + 2, sy - (mth % 6 === 0 ? 40 : 24)]], P(t, 13.5 + (mth - 6) * 0.042, 13.6 + (mth - 6) * 0.042), 0, 4, 100 + mth); }
  pen(ctx, [[sx - 10, sy], [sx + 18 * step + 10, sy]], P(t, 13.45, 14.3), 0, 4, 99);
  hand(ctx, '6', sx - 40, sy + 4, 0, P(t, 13.6, 13.8), 44); hand(ctx, '24', sx + 18 * step + 50, sy + 4, 0, P(t, 14.2, 14.4), 44);
  const c18 = [sx + 12 * step, sy - 20];
  pen(ctx, oval(c18[0], c18[1], 34, 40, -0.1), P(t, 16.95, 17.3, E.inOutSine), 0, 6, 25);
  hand(ctx, '18 is common', X + 205, Yw + 115, -0.05, 1, 54, P(t, 17.3, 17.85, E.linear));
  penArrow(ctx, [X + 205, Yw + 145], [X + 190, Yw + 200], [c18[0] + 40, c18[1] - 30], P(t, 17.5, 17.85), 0, 27);
}
function st4(ctx, t) {
  const [X, Yw] = ST.s4;
  piece(ctx, 'scr_blue', X, Yw + 40, 780, -0.02, land(t, 18.9));
  piece(ctx, 'cut_man', X - 190, Yw + 30, 330, -0.05, land(t, 19.05)); piece(ctx, 'cut_woman', X + 190, Yw + 40, 330, 0.05, land(t, 19.2));
  label(ctx, 'EVERY 6 MONTHS', X, Yw - 255, -0.03, popM(t, 19.4));
  [19.8, 21.45, 22.3, 23.08].forEach((tr, i) => pen(ctx, oval(X, Yw - 255, 250 + i * 14, 62 + i * 8, (i % 2 ? 0.05 : -0.05), 60), P(t, tr, tr + 0.3, E.inOutSine), 0, 4, 30 + i));
  marker(ctx, oval(X - 180, Yw - 48, 88, 104, -0.06), P(t, 20.5, 20.8), 0, 13, 33); marker(ctx, oval(X + 205, Yw - 50, 88, 104, 0.05), P(t, 20.68, 20.98), 0, 13, 34);
  label(ctx, 'PER PERSON', X, Yw + 250, 0.03, popM(t, 20.6), 40);
}
function st5(ctx, t) {
  const [X, Yw] = ST.s5, off = P(t, 35.6, 35.95, E.linear);
  piece(ctx, 'scr_cardboard', X, Yw - 20, 700, 0.03, land(t, 32.55));
  piece(ctx, 'tr_docs', X - 140, Yw - 30, 340, -0.08, land(t, 32.75), off, Math.PI);
  piece(ctx, 'cut_folder_docs', X + 160, Yw - 10, 330, 0.07, land(t, 32.9), off, 0);
  label(ctx, 'DOCUMENTATION', X, Yw + 205, -0.03, popM(t, 33.3));
  marker(ctx, bez([X - 300, Yw - 200], [X, Yw - 30], [X + 300, Yw + 150], 24), P(t, 34.8, 35.05, E.outCubic) * (1 - off), 0, 22, 61);
  marker(ctx, bez([X + 300, Yw - 210], [X + 10, Yw - 40], [X - 300, Yw + 140], 24), P(t, 35.15, 35.4, E.outCubic) * (1 - off), 0, 22, 62);
  piece(ctx, 'tr_card_navy', X + 150, Yw - 50, 270, -0.06, land(t, 35.75));
  hand(ctx, 'up to 150,000', X, Yw - 270, -0.04, 1, 60, P(t, 33.5, 34.1, E.linear));
  hand(ctx, 'none needed', X - 170, Yw + 60, -0.05, 1, 66, P(t, 35.6, 36.05, E.linear));
}
function st6(ctx, t) {
  const [X, Yw] = ST.s6;
  piece(ctx, 'scr_kraft2', X - 60, Yw - 40, 760, 0.01, land(t, 36.0));
  const wave = Math.max(0, Math.sin(Math.PI * prog(t, 40.5, 41.1)));
  if (!piece(ctx, 'tr_fan', X - 150, Yw - 50 - wave * 16, 430, -0.04, land(t, 36.25))) return;
  label(ctx, '13 CARDS', X - 180, Yw - 255, -0.05, popM(t, 36.42));
  for (let i = 0; i < 10; i++) { const x = X - 330 + i * 30 + (i >= 5 ? 24 : 0), y = Yw + 255; if (i === 4 || i === 9) pen(ctx, [[x - 122, y - 6], [x + 8, y - 42]], P(t, 37.95 + i * 0.059, 38.1 + i * 0.059), 0, 5, 80 + i); else pen(ctx, [[x, y], [x + 4, y - 52]], P(t, 37.95 + i * 0.059, 38.08 + i * 0.059), 0, 5, 80 + i); }
  hand(ctx, 'in 10 days', X + 90, Yw + 250, -0.04, 1, 56, P(t, 38.5, 38.95, E.linear));
  piece(ctx, 'tr_coins', X + 240, Yw - 70, 210, 0.06, land(t, 43.65), 0, 0);
  piece(ctx, 'tr_gift', X + 250, Yw + 110, 180, -0.06, land(t, 43.85), 0, 0);
  label(ctx, 'BONUS ON EACH', X + 230, Yw - 255, 0.04, popM(t, 44.0), 40);
  for (let i = 0; i < 5; i++) { const t0 = 43.58 + i * 0.1, cx = X - 300 + i * 60, cy = Yw - 105 - i * 8; marker(ctx, [[cx - 18, cy], [cx + 18, cy]], P(t, t0, t0 + 0.1), 0, 12, 130 + i); marker(ctx, [[cx, cy - 18], [cx, cy + 18]], P(t, t0 + 0.06, t0 + 0.16), 0, 12, 140 + i); }
}
function st7(ctx, t) {
  const [X, Yw] = ST.s7;
  piece(ctx, 'scr_news2', X, Yw - 20, 820, -0.02, land(t, 49.8));
  piece(ctx, 'tr_boarding', X - 200, Yw - 100, 340, -0.07, land(t, 49.95));
  piece(ctx, 'tr_window', X - 190, Yw + 100, 190, 0.06, land(t, 50.15));
  const m = piece(ctx, 'sq_beach', X + 110, Yw - 100, 260, 0.04, land(t, 50.1));
  piece(ctx, 'sq_pool', X + 265, Yw + 65, 210, 0.09, land(t, 50.3)); if (!m) return;
  deco(ctx, 'st_2', X + 200, Yw - 245, 110, 1.2, P(t, 50.4, 50.47, E.linear) + P(t, 50.47, 50.55, E.linear));
  label(ctx, 'TRAVEL', X - 200, Yw + 250, -0.05, popM(t, 51.94));
  if (t > 53.3) { const v = Math.round(lerp(7, 21, P(t, 53.45, 53.98, E.inOutSine))); hand(ctx, `${v}x`, X + 225, Yw + 262, -0.08, 1, 110); }
  hand(ctx, 'up to', X + 60, Yw + 255, -0.04, 1, 56, P(t, 53.3, 53.7, E.linear));
  highlight(ctx, X + 225, Yw + 228, 190, 84, -0.05, P(t, 54.0, 54.3, E.outCubic));
}

// ------------------------------------------------------------------ footage test: Video 3 "$15,600 in sign-up bonuses" (17.1 s)
// v1 0.8-5.3: walked away with the sign-up bonuses as free cash (no amounts on screen)
function v1(ctx, t) {
  const [X, Yw] = ST.s1;
  piece(ctx, 'scr_kraft', X - 160, Yw - 30, 430, -0.04, land(t, 0.9));
  const m = piece(ctx, 'tr_gift', X - 170, Yw - 70, 300, 0.05, land(t, 1.15)); if (!m) return;
  piece(ctx, 'tr_coins', X + 200, Yw - 60, 330, -0.04, land(t, 1.9));
  deco(ctx, 'st_3', X + 330, Yw - 190, 110, 0.35, P(t, 2.0, 2.1, E.linear) + P(t, 2.1, 2.18, E.linear));
  label(ctx, 'SIGN-UP BONUSES', X - 40, Yw + 140, -0.03, popM(t, 2.6), 50);
  penArrow(ctx, [X - 30, Yw - 220], [X + 40, Yw - 300], [X + 110, Yw - 200], P(t, 3.0, 3.6, E.inOutSine), 0, 7);
  hand(ctx, 'free cash!', X + 130, Yw + 265, -0.05, 1, 72, P(t, 4.55, 5.0, E.linear));
  marker(ctx, oval(X + 200, Yw - 60, 190, 150, -0.08), P(t, 4.6, 5.0, E.inOutSine), 0, 14, 9);
}
// v2 5.3-10.4: he took it as statement credit, because he just wanted the cash
function v2(ctx, t) {
  const [X, Yw] = ST.s2;
  piece(ctx, 'scr_notebook', X - 10, Yw - 10, 760, 0.02, land(t, 6.0));
  piece(ctx, 'tr_envelope', X - 190, Yw - 80, 330, -0.06, land(t, 6.3));
  piece(ctx, 'tr_card_white', X + 200, Yw - 90, 320, 0.07, land(t, 6.55));
  deco(ctx, 'st_6', X + 330, Yw - 230, 70, 0.2, P(t, 6.4, 6.5, E.linear) + P(t, 6.5, 6.58, E.linear));
  label(ctx, 'STATEMENT CREDIT', X + 10, Yw + 120, 0.03, popM(t, 8.55), 50);
  hand(ctx, 'just wanted the cash', X, Yw + 245, -0.04, 1, 58, P(t, 9.4, 10.2, E.linear));
  marker(ctx, oval(X + 200, Yw - 90, 180, 130, 0.06), P(t, 8.9, 9.3, E.inOutSine), 0, 14, 21);
}
// v3 10.3-17.3: he didn't want to travel; but for travel it could have been 7-21x
function v3(ctx, t) {
  const [X, Yw] = ST.s3;
  piece(ctx, 'scr_news2', X, Yw - 20, 820, -0.02, land(t, 10.9));
  const m = piece(ctx, 'tr_boarding', X - 200, Yw - 100, 340, -0.07, land(t, 11.0)); if (!m) return;
  piece(ctx, 'tr_window', X - 190, Yw + 100, 190, 0.06, land(t, 11.15));
  marker(ctx, [[X - 330, Yw - 200], [X - 70, Yw + 10]], P(t, 11.3, 11.5, E.inOutSine), P(t, 12.6, 12.9, E.inOutSine), 16, 31);
  marker(ctx, [[X - 70, Yw - 200], [X - 330, Yw + 10]], P(t, 11.5, 11.7, E.inOutSine), P(t, 12.7, 13.0, E.inOutSine), 16, 33);
  piece(ctx, 'sq_beach', X + 110, Yw - 100, 260, 0.04, land(t, 12.9));
  piece(ctx, 'sq_pool', X + 265, Yw + 65, 210, 0.09, land(t, 13.1));
  deco(ctx, 'st_2', X + 200, Yw - 245, 110, 1.2, P(t, 13.2, 13.27, E.linear) + P(t, 13.27, 13.35, E.linear));
  label(ctx, 'TRAVEL', X - 200, Yw + 250, -0.05, popM(t, 13.0));
  if (t > 14.6) { const v = Math.round(lerp(7, 21, P(t, 14.6, 15.6, E.inOutSine))); hand(ctx, `${v}x`, X + 225, Yw + 262, -0.08, 1, 110); }
  hand(ctx, 'up to', X + 60, Yw + 255, -0.04, 1, 56, P(t, 14.3, 14.6, E.linear));
  highlight(ctx, X + 225, Yw + 228, 190, 84, -0.05, P(t, 15.7, 16.0, E.outCubic));
}

function endCard(ctx, t, IMG) {
  if (t < 56.6) return;
  // full-screen desk, badge print slapped down, headline
  ctx.save(); const cam = { x: 0, y: 0, z: 1 }; ctx.translate(540, 960); desk(ctx, cam);
  const k = land(t, 56.95); if (IMG.badge && k > 0) { const w = 480, h = w * IMG.badge.height / IMG.badge.width, d = (1 - E.outCubic(k)) * 1300; ctx.save(); ctx.translate(0, -200 - d); ctx.rotate(-0.04); ctx.shadowColor = 'rgba(25,20,10,0.42)'; ctx.shadowBlur = 1.2; ctx.shadowOffsetX = 2.5; ctx.shadowOffsetY = 3.5; ctx.drawImage(IMG.badge, -w / 2, -h / 2, w, h); ctx.restore(); }
  headline(ctx, ['LEARN THE', 'PLAYBOOK'], 0, 330, 120, popM(t, 57.3), -0.02, 'scr_news2');
  highlight(ctx, 10, 445, 560, 90, -0.02, P(t, 57.65, 57.95, E.outCubic));
  label(ctx, 'creditcounselelite.com', 0, 560, -0.03, popM(t, 57.8), 40);
  ctx.globalAlpha = P(t, 58.0, 58.4) * 0.75; ctx.font = font(22, 500, UI); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText('Education and coaching. Not a lender. Individual results vary.', 0, 720);
  ctx.restore();
}

// ------------------------------------------------------------------ layout over time
const END = 17.29; window.__END = END;
const FH_KEYS = [[0, 1920], [0.8, SEAM], [END, 0]];
function footH(t) {
  let v = springKeys(t, FH_KEYS, { stiffness: 150, damping: 17 });
  for (let i = 1; i < FH_KEYS.length; i++) v -= Math.sign(FH_KEYS[i][1] - FH_KEYS[i - 1][1]) * 34 * antic(t, FH_KEYS[i][0], 0.22);
  return clamp(v, 0, DH);
}
const FULL_WINDOWS = [[0, 0.8]];
const CLAIM_FULL = [];

// ------------------------------------------------------------------ captions: yellow marker tag
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
  chunks.forEach((c, i) => { c.until = Math.min(chunks[i + 1] ? chunks[i + 1].start : c.end + 0.5, c.end + 0.6); c.text = c.text.replace(/[,]$/, '').toUpperCase(); });
  return chunks;
}
function captionsOld(ctx, t, fh) {
  if (t > 56.6) return;
  const c = CAPS.find((c) => t >= c.start - 0.04 && t < c.until);
  if (!c) return;
  const f = clamp((fh - SEAM) / (DH - SEAM)), y = lerp(DH - fh, 1600, f), i = CAPS.indexOf(c);
  label(ctx, c.text, 540, y, (i % 2 ? 1 : -1) * 0.02, popM(t, c.start - 0.04), 46);
}

// ------------------------------------------------------------------ footage + paper grain (baked once)
let FOOT = null; const FCACHE = new Map(); let GRAIN = null;
async function loadFrame(t) {
  const idx = Math.min(SRC_FRAMES, Math.max(1, Math.floor(t * SRC_FPS) + 1));
  if (!FCACHE.has(idx)) { const im = new Image(); im.src = `assets/footage/f_${String(idx).padStart(5, '0')}.jpg`; try { await im.decode(); } catch { return; } FCACHE.set(idx, im); while (FCACHE.size > 8) FCACHE.delete(FCACHE.keys().next().value); }
  FOOT = FCACHE.get(idx);
}
function buildGrain() {
  GRAIN = canvas(W, H); const x = GRAIN.getContext('2d'), r = mulberry32(5);
  const g = x.createRadialGradient(W / 2, H * 0.27, W * 0.3, W / 2, H * 0.27, W * 0.95); g.addColorStop(0, 'rgba(60,50,30,0)'); g.addColorStop(1, 'rgba(60,50,30,0.22)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let i = 0; i < W * H / 14; i++) { x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'; x.fillRect(r() * W, r() * H, 1, 1); }
}
function pushIn(t) { for (const [a, b] of FULL_WINDOWS) if (t >= a - 0.5 && t < b + 0.8) return Math.pow(1.1, P(t, a, b + 0.8, E.inOutSine)); return 1; }
const near = (t) => FH_KEYS.some(([k]) => t > k - 0.25 && t < k + 0.8) || CAMK.some(([k]) => t > k && t < k + 1.0) || [0.9, 5.6, 10.6].some((k) => t > k - 0.3 && t < k + 0.1);

M.film({
  fonts: [font(96, 400, 'Display'), font(46, 600, 'UI'), font(34, 500, 'UI'), font(100, 400, SERIF), font(40, 500, UI), font(46, 400, MARK), font(54, 700, HAND)],
  images: Object.fromEntries([['badge', 'assets/badge.png'], ...PIECES.map((k) => [k, `assets/pieces/${k}.png`])]),
  hits: HITS,
  samples: (t) => (FH_KEYS.some(([k]) => t > k - 0.25 && t < k + 0.8) ? 4 : 1),
  async init(ctx, IMG) {
    IMGP = IMG;
    buildGrain();
    CAPS = buildCaptions(await fetch('assets/words.json').then((r) => r.json()));
  },
  prepare: (t) => loadFrame(t),
  draw(ctx, u, t, IMG) {
    const fh = footH(t); FH = fh;
    ctx.save(); ctx.scale(S, S);
    const tq = Math.floor(t * FPS_SM) / FPS_SM; BOIL = Math.floor(t * FPS_SM);
    if (fh < DH - 4 && t < END + 0.2) {
      const cam = camera(tq);
      ctx.save(); ctx.translate(540, Y(490)); ctx.scale(cam.z, cam.z); ctx.rotate(cam.r); ctx.translate(-cam.x, -cam.y);
      desk(ctx, cam);
      v1(ctx, tq); v2(ctx, tq); v3(ctx, tq);
      ctx.restore();
    }
    endCard(ctx, tq, IMG);
    ctx.restore();
    if (GRAIN && (fh < DH - 4)) ctx.drawImage(GRAIN, 0, 0);
    ctx.save(); ctx.scale(S, S);
    if (FOOT && fh > 1) {
      cover(ctx, FOOT, 0, DH - fh, DW, fh, { fx: 0.5, fy: lerp(0.25, 0.45, clamp((fh - SEAM) / (DH - SEAM))), zoom: pushIn(t) });
      if (fh < DH - 2) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, DH - fh - 2, DW, 4); }
    }
    captions(ctx, t, fh);
    const disc = (x, y, a, c) => { ctx.save(); ctx.font = font(20, 500, UI); ctx.fillStyle = c; ctx.textAlign = a; ctx.fillText('Individual results vary. Education only.', x, y); ctx.restore(); };
    if (CLAIM_FULL.some(([a, b]) => t > a + 0.3 && t < b) && fh > 1700) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 6; disc(540, 1860, 'center', '#fff'); ctx.restore(); }
    if ((t > 1.5 && t < 5.3) || (t > 13.5 && t < END)) disc(1050, Y(40), 'right', 'rgba(27,27,27,0.7)');
    ctx.restore();
  },
});

// brand captions (black overlay, Poppins) — CCE Brand Style Guidelines 2025
function captions(ctx, t, fh) { BR.captions(ctx, t, fh, CAPS); }
