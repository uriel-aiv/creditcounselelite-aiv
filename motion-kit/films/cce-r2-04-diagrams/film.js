// CCE — "Instructional Diagrams" founder split-screen, v03. Pure function of time: window.seek(t) paints frame t.
// Grid = seconds (beats.json period 1), so u === t. Cut to the speaker's word timings (assets/words.json).
// Layout: motion panel on top, founder footage below. Designed in 1080x1920, scaled to the render size.
// Panel items use Y(local): the panel rides up and away when the footage goes full frame.
// No slides: each scene collapses into a baton object that becomes the next scene. Pictures, not labels.
import * as M from './lib/motion.js';
import * as BR from './lib/brand.js';

const { W, H, E, prog, clamp, lerp, spring, springKeys, SPRING, wobble, font, hash01, mulberry32, cover, rrect } = M;

const DW = 1080, DH = 1920, S = W / DW;
const C = { maroon: '#6B0505', green: '#266235', teal: '#008C96', pbBlue: '#114BA7', gold: '#CB9938', light: '#ADC8E3',  paper: '#EFEDE6', ink: '#000000', blue: '#004AAD', white: '#FFFFFF', cream: '#F4F1E8', grey: '#BDBDBD' };
const DISPLAY = 'Display', UI = 'UI';
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 550;
const SEAM = 980;          // footage height in split mode (panel above is 940 tall)
const TAU = M.TAU;

// ------------------------------------------------------------------ hits (seconds) -> SFX
const HITS = [
  [1.25, 'gauge', 'whoosh', { len: 0.5, gain: 0.25 }], [2.6, 'needle', 'whoosh', { len: 0.6, from: 500, to: 2400, gain: 0.3 }], [3.25, '800', 'pop', { pitch: 'E6', gain: 0.45 }],
  [3.45, 'calendar', 'thud', { gain: 0.4 }], [5.6, 'wrench', 'click', { gain: 0.45 }], [6.1, 'wrench', 'click', { gain: 0.45 }], [6.65, 'done', 'pop', { pitch: 'C6', gain: 0.4 }],
  [7.35, 'sheet', 'whoosh', { len: 0.4, gain: 0.25 }], [7.9, 'boxes', 'type', { len: 0.6, gain: 0.25 }], [10.0, 'three', 'pop', { pitch: 'G5', gain: 0.35 }],
  [12.1, 'late', 'thud', { gain: 0.45 }], [15.3, 'collection', 'thud', { gain: 0.45 }], [17.1, 'charge-off', 'thud', { gain: 0.45 }], [18.6, 'inquiry', 'whoosh', { len: 0.4, gain: 0.25 }],
  [20.5, 'to end', 'whoosh', { len: 0.5, from: 500, to: 2400, gain: 0.4 }], [20.75, 'badge', 'thud', { gain: 0.7 }],
];

// ------------------------------------------------------------------ helpers
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);
const P = (t, a, b, ease = E.inOutCubic) => ease(prog(t, a, b));
const pop = (t, t0, cfg = { stiffness: 300, damping: 18 }) => (t < t0 ? 0 : spring(t - t0, cfg));
const antic = (t, t0, dur = 0.2) => { const p = prog(t, t0 - dur, t0 + 0.02); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; };
const out = (t, t0, d = 0.32) => 1 - E.inBack(prog(t, t0, t0 + d), 1.9);   // 1 -> a touch over -> 0
const bob = (t, ph, amp = 6, f = 0.45) => amp * Math.sin(TAU * f * t + ph);
let BOIL = 0, FH = DH;
const Y = (y) => (FH >= SEAM ? y - (FH - SEAM) : y + (SEAM - FH) * 0.48);      // panel local -> screen (panel rides up as the footage grows)

function resample(pts, step = 12) {
  const o = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 1; k <= n; k++) o.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
  }
  return o;
}
function jitter(pts, seed, amp) {
  return pts.map(([x, y], i) => [x + (hash01(i * 2 + 1, seed + BOIL * 31) - 0.5) * amp * 2, y + (hash01(i * 2 + 2, seed + BOIL * 31) - 0.5) * amp * 2]);
}
function partial(pts, p, from = 0) {
  if (p <= from) return [];
  let L = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  const a = L * clamp(from), b = L * clamp(p);
  const o = []; let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = seg[i - 1], s0 = acc, s1 = acc + d; acc = s1;
    if (s1 < a || d === 0) continue;
    if (s0 > b) break;
    const k0 = clamp((a - s0) / d), k1 = clamp((b - s0) / d);
    const A = [lerp(pts[i - 1][0], pts[i][0], k0), lerp(pts[i - 1][1], pts[i][1], k0)];
    const B = [lerp(pts[i - 1][0], pts[i][0], k1), lerp(pts[i - 1][1], pts[i][1], k1)];
    if (!o.length) o.push(A);
    o.push(B);
  }
  return o;
}
function stroke(ctx, pts, { w = 6, color = C.ink, p = 1, from = 0, seed = 1, amp = 1.6, dash = null, march = 0, cap = 'round' } = {}) {
  let q = partial(resample(pts), p, from);
  if (q.length < 2) return null;
  q = jitter(q, seed, amp);
  ctx.save();
  ctx.lineWidth = w; ctx.strokeStyle = color; ctx.lineCap = cap; ctx.lineJoin = 'round';
  if (dash) { ctx.setLineDash(dash); ctx.lineDashOffset = -march; }
  ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]);
  for (let i = 1; i < q.length; i++) ctx.lineTo(q[i][0], q[i][1]);
  ctx.stroke(); ctx.restore();
  const a = q[q.length - 2], b = q[q.length - 1];
  return { tip: b, dir: Math.atan2(b[1] - a[1], b[0] - a[0]) };
}
const quad = (p0, c, p1, n = 48) => Array.from({ length: n + 1 }, (_, i) => {
  const k = i / n, m = 1 - k;
  return [m * m * p0[0] + 2 * m * k * c[0] + k * k * p1[0], m * m * p0[1] + 2 * m * k * c[1] + k * k * p1[1]];
});
const arcPts = (cx, cy, rx, ry, a0, a1, n = 64) => Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
function quadAt(p0, c, p1, k) {
  const m = 1 - k;
  return { x: m * m * p0[0] + 2 * m * k * c[0] + k * k * p1[0], y: m * m * p0[1] + 2 * m * k * c[1] + k * k * p1[1],
    a: Math.atan2(2 * m * (c[1] - p0[1]) + 2 * k * (p1[1] - c[1]), 2 * m * (c[0] - p0[0]) + 2 * k * (p1[0] - c[0])) };
}
function arrowHead(ctx, tip, dir, size = 26, color = C.ink) {
  if (size <= 0.5) return;
  ctx.save(); ctx.translate(tip[0], tip[1]); ctx.rotate(dir);
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(size * 0.35, 0); ctx.lineTo(-size * 0.75, -size * 0.55); ctx.lineTo(-size * 0.45, 0); ctx.lineTo(-size * 0.75, size * 0.55); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function burst(ctx, x, y, r, k, seed = 7, color = C.blue, spikes = 13, rot = 0, spk = 1) {
  if (k <= 0.001 || r <= 0.1) return;
  const rng = mulberry32(seed);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  ctx.fillStyle = color; ctx.beginPath();
  if (spk < 0.02) ctx.arc(0, 0, r, 0, TAU);
  else {
    const n = spikes * 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + (rng() - 0.5) * 0.12 * spk;
      const rr0 = i % 2 === 0 ? r * (0.78 + rng() * 0.32) : r * (0.38 + rng() * 0.1);
      ctx.lineTo(Math.cos(a) * lerp(r, rr0, spk), Math.sin(a) * lerp(r, rr0, spk));
    }
    ctx.closePath();
  }
  ctx.fill(); ctx.restore();
}
function txt(ctx, s, x, y, size, family, color, { align = 'left', p = 1 } = {}) {
  const n = Math.round([...s].length * clamp(p));
  if (n <= 0 || size <= 0.5) return;
  ctx.save(); ctx.font = font(size, family === DISPLAY ? 800 : 400, family); ctx.fillStyle = color; ctx.textAlign = align;
  ctx.fillText([...s].slice(0, n).join(''), x, y); ctx.restore();
}
// true visual centre and width of a text run (from glyph bounds), so strike lines sit dead centre on X and Y
function textBox(ctx, s, x, y, size, family, align = 'left') {
  ctx.save(); ctx.font = font(size, family === DISPLAY ? 800 : 400, family); ctx.textAlign = align; const m = ctx.measureText(s); ctx.restore();
  const l = x - m.actualBoundingBoxLeft, r = x + m.actualBoundingBoxRight, top = y - m.actualBoundingBoxAscent, bot = y + m.actualBoundingBoxDescent;
  return { cx: (l + r) / 2, cy: (top + bot) / 2, w: r - l, h: bot - top };
}
function grp(ctx, k, cx, cy, fn, rot = 0) {
  if (k <= 0.002) return;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(k, k); ctx.translate(-cx, -cy); fn(); ctx.restore();
}
function footer(ctx) { txt(ctx, 'individual results vary. education only.', 64, Y(70), 24, UI, '#555'); }

// ------------------------------------------------------------------ illustrations
function card(ctx, x, y, w, h, rot, color, sx = 1, sy = 1) {
  if (sx <= 0.001 || sy <= 0.001) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sx, sy);
  rrect(ctx, -w / 2, -h / 2, w, h, h * 0.12); ctx.fillStyle = color; ctx.fill();
  const cw = w * 0.17, ch = h * 0.25, cx = -w / 2 + w * 0.12, cy = -h / 2 + h * 0.26;
  rrect(ctx, cx, cy, cw, ch, 4); ctx.fillStyle = C.white; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.5, w * 0.008);
  ctx.beginPath(); ctx.moveTo(cx, cy + ch * 0.5); ctx.lineTo(cx + cw, cy + ch * 0.5); ctx.moveTo(cx + cw * 0.5, cy); ctx.lineTo(cx + cw * 0.5, cy + ch); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let g = 0; g < 4; g++) for (let d = 0; d < 4; d++) ctx.fillRect(-w / 2 + w * 0.12 + g * w * 0.19 + d * w * 0.038, h * 0.12, w * 0.024, h * 0.07);
  ctx.restore();
}
// side-view figure built from limbs, so it can walk. phase = walk cycle (radians), walk 0..1 = stride.
// Instruction-manual pictogram: round head with hair, tapered jacket torso with a white collar and tie, capsule limbs
// with hands and shoes; front limbs carry a thin paper-coloured outline so overlaps stay readable.
function person(ctx, x, y, s, color, phase = 0, walk = 0, dir = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const lift = 4 * walk * Math.abs(Math.cos(phase)), breathe = 0;
  const hip = [0, -152 - lift], sh = [4, -254 - lift + breathe];
  const seg = (a, b, w, col, sep) => { if (sep) { ctx.strokeStyle = C.paper; ctx.lineWidth = w + 9; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); } ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); };
  const shade = (c, k) => { const n = parseInt(c.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, bl = n & 255; return `rgb(${Math.round(lerp(r, 255, k))},${Math.round(lerp(g, 255, k))},${Math.round(lerp(bl, 255, k))})`; };
  const back = shade(color, 0.28);
  const leg = (ph, isBack) => {
    const col = isBack ? back : color, th = walk * 0.5 * Math.sin(ph), bend = walk * 0.8 * Math.max(0, Math.sin(ph - 1.2));
    const knee = [hip[0] + 76 * Math.sin(th), hip[1] + 76 * Math.cos(th)], t2 = th - bend, foot = [knee[0] + 70 * Math.sin(t2), knee[1] + 70 * Math.cos(t2)];
    seg(hip, knee, 32, col, !isBack); seg(knee, foot, 26, col, !isBack);
    // shoe: rounded wedge pointing forward
    ctx.save(); ctx.translate(...foot); ctx.rotate(t2 * 0.3); ctx.fillStyle = isBack ? back : color; if (!isBack) { ctx.strokeStyle = C.paper; ctx.lineWidth = 6; }
    ctx.beginPath(); ctx.moveTo(-16, -8); ctx.quadraticCurveTo(-18, 12, -10, 14); ctx.lineTo(34, 14); ctx.quadraticCurveTo(38, 2, 22, -4); ctx.closePath(); if (!isBack) ctx.stroke(); ctx.fill(); ctx.restore();
  };
  const arm = (ph, isBack) => {
    const col = isBack ? back : color, th = -walk * 0.55 * Math.sin(ph) + 0.1, el = 0.3 + walk * 0.45 * Math.max(0, Math.sin(ph));
    const s0 = [sh[0], sh[1] + 14], elbow = [s0[0] + 60 * Math.sin(th), s0[1] + 60 * Math.cos(th)], hand = [elbow[0] + 54 * Math.sin(th + el), elbow[1] + 54 * Math.cos(th + el)];
    seg(s0, elbow, 24, col, !isBack); seg(elbow, hand, 20, col, !isBack);
    ctx.fillStyle = isBack ? back : color; ctx.beginPath(); ctx.arc(hand[0] + 2, hand[1] + 4, 12, 0, TAU); ctx.fill();
  };
  leg(phase + Math.PI, true); arm(phase, true);
  // torso: jacket, wider at the chest, tapered to the waist
  ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(sh[0] - 26, sh[1] - 2); ctx.quadraticCurveTo(sh[0] + 6, sh[1] - 16, sh[0] + 30, sh[1] + 4);
  ctx.quadraticCurveTo(sh[0] + 40, sh[1] + 50, hip[0] + 26, hip[1] + 4); ctx.lineTo(hip[0] - 24, hip[1] + 4);
  ctx.quadraticCurveTo(sh[0] - 34, sh[1] + 50, sh[0] - 26, sh[1] - 2); ctx.closePath(); ctx.fill();
  // collar and tie on the front edge
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.moveTo(sh[0] + 8, sh[1] - 10); ctx.lineTo(sh[0] + 30, sh[1] + 2); ctx.lineTo(sh[0] + 26, sh[1] + 40); ctx.closePath(); ctx.fill();
  ctx.fillStyle = color === C.blue ? C.ink : C.blue; ctx.beginPath(); ctx.moveTo(sh[0] + 24, sh[1] + 2); ctx.lineTo(sh[0] + 30, sh[1] + 8); ctx.lineTo(sh[0] + 31, sh[1] + 54); ctx.lineTo(sh[0] + 25, sh[1] + 62); ctx.lineTo(sh[0] + 20, sh[1] + 52); ctx.closePath(); ctx.fill();
  // belt line
  ctx.fillStyle = shade(color, 0.18); ctx.fillRect(hip[0] - 24, hip[1] - 4, 50, 8);
  // neck, head, hair, ear
  ctx.fillStyle = color; ctx.fillRect(sh[0] + 1, sh[1] - 16, 18, 16);
  const hx = sh[0] + 12, hy = sh[1] - 40;
  ctx.beginPath(); ctx.ellipse(hx, hy, 24, 27, 0.12, 0, TAU); ctx.fill();
  // nose bump on the facing side
  ctx.beginPath(); ctx.ellipse(hx + 24, hy + 2, 6, 8, 0.2, 0, TAU); ctx.fill();
  leg(phase, false); arm(phase + Math.PI, false);
  ctx.restore();
}
// side-view airliner, nose right
function plane(ctx, s, color) {
  ctx.save(); ctx.scale(s, s); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(10, -22); ctx.lineTo(-34, -50); ctx.lineTo(-52, -50); ctx.lineTo(-22, -22); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(182, 6); ctx.quadraticCurveTo(174, -20, 124, -25); ctx.lineTo(-108, -25);
  ctx.quadraticCurveTo(-150, -27, -182, -44); ctx.lineTo(-188, -34); ctx.quadraticCurveTo(-166, 8, -112, 17);
  ctx.lineTo(112, 19); ctx.quadraticCurveTo(168, 19, 182, 6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-118, -25); ctx.lineTo(-170, -104); ctx.lineTo(-190, -104); ctx.lineTo(-180, -38); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-138, -8); ctx.lineTo(-204, 8); ctx.lineTo(-186, 13); ctx.lineTo(-122, 3); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(34, 8); ctx.lineTo(-44, 70); ctx.lineTo(-76, 74); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill();
  rrect(ctx, -14, 26, 58, 22, 11); ctx.fill();
  ctx.fillStyle = C.white;
  for (let i = 0; i < 12; i++) { rrect(ctx, -92 + i * 17, -11, 8, 9, 3); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(146, -14); ctx.lineTo(166, -10); ctx.lineTo(164, -4); ctx.lineTo(144, -6); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C.white; ctx.lineWidth = 2.5;
  ctx.strokeRect(118, -14, 12, 24);
  ctx.beginPath(); ctx.moveTo(-14, 37); ctx.lineTo(44, 37); ctx.stroke();
  ctx.restore();
}
function cloud(ctx, x, y, s, seed) {
  if (s <= 0.01) return;
  stroke(ctx, [...arcPts(x - 40 * s, y, 34 * s, 30 * s, Math.PI * 0.95, Math.PI * 1.9, 14), ...arcPts(x + 10 * s, y - 14 * s, 44 * s, 40 * s, Math.PI * 1.15, Math.PI * 2.0, 14), ...arcPts(x + 60 * s, y, 30 * s, 26 * s, Math.PI * 1.25, Math.PI * 2.1, 12), [x - 74 * s, y + 4 * s]], { w: 5, seed, amp: 1.2 });
}
// tear-off calendar: a grid of days, one marked
function calendar(ctx, x, y, w, h, mark, k = 1, rot = 0) {
  if (k <= 0.002) return;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.scale(k, k); ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = C.white; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, w, h * 0.2);
  stroke(ctx, [[0, 0], [w, 0], [w, h], [0, h], [0, 0]], { w: 5, seed: 300 });
  for (const rx of [w * 0.28, w * 0.72]) stroke(ctx, arcPts(rx, 0, 10, 20, Math.PI, TAU, 10), { w: 6, seed: 301 + rx });
  const cols = 4, rows = 3, cw = (w - 30) / cols, ch = (h * 0.8 - 30) / rows;
  for (let i = 0; i < cols * rows; i++) {
    const cx = 15 + (i % cols) * cw, cy = h * 0.2 + 15 + Math.floor(i / cols) * ch;
    if (i === mark) { ctx.fillStyle = C.teal; ctx.fillRect(cx + 4, cy + 4, cw - 8, ch - 8); }
    else stroke(ctx, [[cx + 6, cy + ch / 2], [cx + cw - 6, cy + ch / 2]], { w: 3, color: '#A8A8A8', seed: 310 + i, amp: 0.5 });
  }
  ctx.restore();
}

// ------------------------------------------------------------------ layout over time
const END = 20.29; window.__END = END;
const FH_KEYS = [[0, 1920], [0.9, SEAM], [END, 0]];
const FH_SPRING = { stiffness: 150, damping: 17 };
function footH(t) {
  let v = springKeys(t, FH_KEYS, FH_SPRING);
  for (let i = 1; i < FH_KEYS.length; i++) v -= Math.sign(FH_KEYS[i][1] - FH_KEYS[i - 1][1]) * 34 * antic(t, FH_KEYS[i][0], 0.22);
  return clamp(v, 0, DH);
}
const CLAIM_FULL = [];
const FULL_WINDOWS = [[0, 0.9]];

// ------------------------------------------------------------------ S0: open full frame; a small card slides in at the right edge, then rises into the panel
const A0 = [[1160, 1420], [960, 1200], [860, 1400]];
const CARD1 = [190, 720];
function s0(ctx, t) {
  if (t > 1.6) return;
  const dp = P(t, 0.05, 0.75, E.outCubic), er = P(t, 0.9, 1.3, E.inCubic);
  stroke(ctx, quad(...A0), { w: 5, color: C.cream, p: dp, from: er, dash: [18, 14], march: t * 50, seed: 2, amp: 1 });
}
function cardPath(t) {
  if (t < 1.15) {
    const k = P(t, 0.1, 0.85, E.outCubic), q = quadAt(...A0, k);
    return { x: q.x, y: q.y + bob(t, 0, 4, 1.1) * prog(t, 0.85, 1), r: q.a * 0.5 * (1 - prog(t, 0.6, 1.0)) - 0.15 * prog(t, 0.6, 1.0), s: 0.7 };
  }
  const k = P(t, 1.15, 1.5, E.inOutCubic);
  return { x: lerp(860, CARD1[0], k), y: lerp(1400, Y(CARD1[1]), k) - Math.sin(Math.PI * k) * 120, r: lerp(-0.15, -0.35, k) - Math.sin(Math.PI * k) * 0.9, s: lerp(0.7, 1, k) };
}

// ------------------------------------------------------------------ S1: credit limit -> bank, next day (0 .. 7.3)
const BURST1 = [800, 470], DISC = [330, 400], DISC_R = 150;
function bank(ctx, t, bp) {
  const L = (pts, i, w = 4) => stroke(ctx, pts.map(([x, y]) => [x, Y(y)]), { w, p: clamp(bp * 14 - i * 0.6), seed: 20 + Math.round(i * 10) });
  L([[640, 300], [800, 222], [960, 300], [640, 300]], 0, 5);
  L([[680, 292], [800, 236], [920, 292], [680, 292]], 1, 3);
  if (bp > 0.15) stroke(ctx, arcPts(800, Y(268), 13, 13, 0, TAU, 20), { w: 3, seed: 18, p: clamp(bp * 6 - 1) });
  L([[630, 306], [970, 306]], 2, 5); L([[640, 326], [960, 326]], 3, 4);
  for (let d = 0; d < 16; d++) if (bp > 0.3) stroke(ctx, [[650 + d * 20, Y(311)], [650 + d * 20, Y(321)]], { w: 3, seed: 200 + d, amp: 0.4 });
  for (let c = 0; c < 6; c++) {
    const cx = 670 + c * 52;
    L([[cx, 334], [cx, 428]], 4 + c * 0.6); L([[cx + 24, 334], [cx + 24, 428]], 4.3 + c * 0.6);
    L([[cx - 5, 334], [cx + 29, 334]], 5 + c * 0.5, 3); L([[cx - 5, 428], [cx + 29, 428]], 5.2 + c * 0.5, 3);
    if (bp > 0.6) for (let hl = 0; hl < 7; hl++) stroke(ctx, [[cx + 15, Y(342 + hl * 13)], [cx + 22, Y(350 + hl * 13)]], { w: 2, seed: 230 + c * 10 + hl, amp: 0.4 });
  }
  L([[630, 436], [970, 436]], 9); L([[618, 448], [982, 448]], 10); L([[606, 460], [994, 460]], 11);
}
function s1(ctx, t) {
  if (t > 7.35) return;
  const cx = BURST1[0], cy = Y(BURST1[1]);
  const fp = P(t, 1.3, 1.85, E.outCubic), bp = P(t, 1.45, 2.5, E.outCubic);
  const sq = 0.05 * wobble(t - 4.1, 3, 6);
  if (t > 1.25) grp(ctx, out(t, 6.72), cx, cy, () => {
    ctx.save(); ctx.translate(800, Y(480) + bob(t, 1, 4, 0.35)); ctx.scale(1 + sq, 1 - sq); ctx.translate(-800, -Y(480));
    stroke(ctx, [[580, Y(190)], [1020, Y(190)], [1020, Y(480)], [580, Y(480)], [580, Y(190)]], { w: 5, p: fp, seed: 11 });
    bank(ctx, t, bp);
    ctx.restore();
  });
  const p0 = [CARD1[0], Y(CARD1[1])], c = [300, Y(230)], p1 = [780, Y(400)];
  const tp = P(t, 2.2, 4.1, E.bezier(0.55, 0, 0.35, 1));
  if (t > 2.05) grp(ctx, out(t, 6.6), cx, cy, () => {
    const d = stroke(ctx, quad(p0, c, p1), { w: 6, p: clamp(tp + 0.12), dash: [22, 16], march: t * 50, seed: 5, amp: 1 });
    if (d && tp < 0.95) arrowHead(ctx, d.tip, d.dir, 30);
    [0.28, 0.52, 0.74].forEach((k, i) => {
      if (tp < k) return;
      const q = quadAt(p0, c, p1, k), s = 0.85 - i * 0.1;
      card(ctx, q.x, q.y + bob(t, i * 1.7, 5, 0.6), 220 * s, 140 * s, q.a * 0.6 + 0.05 * Math.sin(t * 2 + i), [C.blue, C.maroon, C.green, C.teal, C.ink][i % 5], sp(t, 2.2 + k * 1.9, SPRING.bouncy), 1);
    });
  });
  if (t < 4.12) {
    let x, y, r, s, sx = 1, sy = 1;
    if (t < 1.5) ({ x, y, r, s } = cardPath(t));
    else {
      const a = antic(t, 2.2, 0.35), land = 0.12 * wobble(t - 1.5, 2.6, 5);
      const q = quadAt(p0, c, p1, tp);
      s = lerp(1, 0.35, E.inCubic(tp));
      r = lerp(-0.35, q.a * 0.6, P(t, 2.2, 2.6)) - 0.2 * a + 0.04 * Math.sin(t * 3) * (1 - prog(t, 2.0, 2.2));
      x = q.x - 30 * a; y = q.y + 26 * a + bob(t, 0, 4, 0.9) * (1 - prog(t, 2.0, 2.2));
      sx = 1 + 0.08 * a + land; sy = 1 - 0.1 * a - land;
    }
    card(ctx, x, y, 260 * s, 165 * s, r, C.blue, sx, sy);
  }
  // tear-off calendar drops in; the top page flies off on "day"
  if (t > 5.4) grp(ctx, out(t, 6.62), cx, cy, () => {
    const k = sp(t, 5.5, { stiffness: 220, damping: 13 });
    const x = 250, y = Y(560) - (1 - k) * 160 + bob(t, 0.5, 4, 0.5), w = 210, h = 230;
    calendar(ctx, x, y, w, h, 6, 1, -0.06 + 0.04 * wobble(t - 5.5, 2, 3));
    const f = P(t, 6.2, 6.6, E.inCubic);
    if (f < 1) calendar(ctx, x + f * 260, y - Math.sin(Math.PI * f) * 140 + f * 120, w, h, 5, 1 - 0.4 * f, -0.06 + f * 1.4);
  });
  if (t > 4.05) {
    const m = P(t, 6.8, 7.25, E.inOutCubic);
    const k = sp(t, 4.1, SPRING.bouncy) * (1 + 0.04 * Math.sin(t * 5) * (1 - m));
    const x = lerp(cx, DISC[0], m), y = lerp(cy, Y(DISC[1]), m) - Math.sin(Math.PI * m) * 120;
    burst(ctx, x, y, lerp(125, DISC_R, m), k, 3, C.blue, 13, 0.4 * (t - 4.1) * (1 - m), 1 - m);
  }
}

// ------------------------------------------------------------------ S2: flat fee 1–5% (6.9 .. 11.3)
function s2(ctx, t) {
  if (t < 6.9 || t > 11.4) return;
  const s = 440, x = DISC[0] - s / 2, y = Y(DISC[1]) - s * 0.47;
  const cx = DISC[0], cy = Y(DISC[1]), r = DISC_R;
  const unf = sp(t, 6.95, { stiffness: 200, damping: 16 }) * (1 - E.inBack(prog(t, 10.62, 10.95), 1.8));
  grp(ctx, unf, cx, cy, () => {
    ctx.fillStyle = C.ink; ctx.fillRect(x, y, s, s);
    ctx.fillStyle = C.white; ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.95, r * 1.25 * (1 + 0.03 * Math.sin(t * 2)), r * 0.32, 0, 0, TAU); ctx.fill();
  }, 0.02 * Math.sin(t * 0.9));
  if (t < 7.25) return;
  const a = antic(t, 8.38, 0.22), k = sp(t, 8.38, SPRING.bouncy);
  const fl = P(t, 10.72, 11.1, E.inOutCubic);
  const sxF = lerp(1, 410 / r, fl), syF = lerp(1, 0.03, fl);
  const w0 = -1.25, w1 = -0.55, spin = 0.25 * Math.sin(t * 0.8);
  ctx.save(); ctx.translate(lerp(cx, 520, fl), lerp(cy, Y(560), fl)); ctx.scale(sxF * (1 + 0.06 * a), syF * (1 - 0.06 * a) * (1 + 0.04 * wobble(t - 7.25, 2.5, 5)));
  ctx.rotate(spin * (1 - fl));
  ctx.fillStyle = C.blue; ctx.beginPath();
  if (t < 8.3 || fl > 0.2) ctx.arc(0, 0, r, 0, TAU); else { ctx.moveTo(0, 0); ctx.arc(0, 0, r, w1, w0 + TAU); ctx.closePath(); }
  ctx.fill(); ctx.restore();
  if (t >= 8.3) {
    const mid = (w0 + w1) / 2 + spin, off = 95 * k, fly = E.inBack(prog(t, 10.55, 10.9), 1.8);
    ctx.save(); ctx.translate(cx + Math.cos(mid) * off + fly * 700, cy + Math.sin(mid) * off - fly * 500 + bob(t, 2, 6, 0.7)); ctx.rotate(0.35 * k + Math.sin(t * 1.3) * 0.08 + fly * 2);
    ctx.fillStyle = C.grey; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, w0 + spin, w1 + spin); ctx.closePath(); ctx.fill();
    ctx.restore();
    const dp = P(t, 8.45, 8.85, E.outCubic);
    grp(ctx, unf, cx, cy, () => {
      const d = stroke(ctx, quad([cx + 40, cy - 40], [cx + 150, cy - 70], [cx + 105, cy - 205]), { w: 6, color: C.white, p: dp, dash: [14, 10], march: t * 40, seed: 9, amp: 1 });
      if (d && dp > 0.95) arrowHead(ctx, d.tip, d.dir, 22, C.white);
    });
  }
  if (t > 9.18) {
    const gone = 900 * E.inBack(prog(t, 10.5, 10.85), 1.8);
    ctx.save(); ctx.translate(gone, 0);
    const ka = sp(t, 9.18, SPRING.bouncy);
    const n = t < 9.6 ? null : Math.min(5, 2 + Math.floor(prog(t, 9.6, 9.94) * 3.999));
    const bx = 600, by = Y(470);
    ctx.font = font(170, 800, DISPLAY); const w1x = ctx.measureText('1').width;
    ctx.save(); ctx.translate(bx, by + bob(t, 0, 4, 0.5)); ctx.scale(1, ka); txt(ctx, '1', 0, 0, 170, DISPLAY, C.blue); ctx.restore();
    if (n) {
      const kb = (n === 5 ? sp(t, 9.94, SPRING.bouncy) : 0.9) * (1 + 0.02 * Math.sin(t * 3));
      ctx.save(); ctx.translate(bx + w1x + 6, by + bob(t, 0.6, 4, 0.5)); ctx.scale(kb, kb); txt(ctx, `–${n}%`, 0, 0, 170, DISPLAY, C.blue); ctx.restore();
    }
    ctx.restore();
  }
}

// ------------------------------------------------------------------ S3: intro-period ruler (10.9 .. 19.9)
const X0 = 110, X1 = 930, RY = 600, mx = (m) => lerp(X0, X1, m / 24);
function bandRect(t) {
  const grow = P(t, 13.55, 14.3, E.bezier(0.5, 0, 0.2, 1));
  const months = lerp(6.4, 24, grow);
  return { start: mx(6), end: mx(months) + 0.02 * wobble(t - 14.3, 3, 6) * 300, months, h: 110 + 5 * Math.sin(t * 2.2) };
}
function s3(ctx, t) {
  if (t < 10.95 || t > 19.9) return;
  const y = Y(RY);
  const fall = (i) => -1100 * E.inBack(prog(t, 18.3 + i * 0.03, 18.75 + i * 0.03), 1.6);
  if (t < 11.4) { const w = lerp(10, 0, P(t, 11.1, 11.4)); if (w > 0.3) { ctx.fillStyle = C.blue; ctx.fillRect(mx(0), Y(560) - w / 2, mx(24) - mx(0), w); } }
  ctx.save(); ctx.translate(0, fall(0) + lerp(Y(560) - y, 0, P(t, 10.98, 11.3)));
  const ax = P(t, 10.98, 11.2, E.outCubic);
  const d = stroke(ctx, [[lerp(520, X0, ax), y], [lerp(520, X1 + 30, ax), y]], { w: 6, seed: 31 });
  if (d && ax > 0.98) arrowHead(ctx, d.tip, 0, 30);
  ctx.restore();
  for (let m = 0; m <= 24; m++) {
    const k = sp(t, 11.15 + m * 0.022, SPRING.bouncy);
    if (k <= 0) continue;
    const major = m % 6 === 0;
    ctx.save(); ctx.translate(0, fall(1 + m * 0.4));
    stroke(ctx, [[mx(m), y], [mx(m), y + (major ? 34 : 16) * k]], { w: major ? 5 : 3, seed: 40 + m, amp: 0.8 });
    if (major && !(m === 6 && t > 18.5)) txt(ctx, String(m), mx(m), y + 84 - (1 - k) * 20, 42, UI, C.ink, { align: 'center' });
    ctx.restore();
  }
  const curl = P(t, 18.45, 19.4, E.inOutCubic);
  if (t > 13.5 && curl < 1) {
    const b = bandRect(t);
    if (curl <= 0) {
      ctx.fillStyle = C.green; ctx.fillRect(b.start, y - 34 - b.h, Math.max(4, b.end - b.start), b.h);
      stroke(ctx, [[b.start, y - 44 - b.h], [b.start, y - 6]], { w: 4, seed: 51 });
      stroke(ctx, [[b.end, y - 44 - b.h], [b.end, y - 6]], { w: 4, seed: 52 });
      ctx.save(); ctx.beginPath(); ctx.rect(b.start, y - 34 - b.h, Math.max(4, b.end - b.start), b.h); ctx.clip();
      for (let hx = b.start - b.h; hx < b.end; hx += 26) stroke(ctx, [[hx, y - 34], [hx + b.h, y - 34 - b.h]], { w: 3, color: 'rgba(255,255,255,0.5)', seed: 400 + Math.round(hx), amp: 0.6 });
      ctx.restore();
      txt(ctx, String(Math.round(b.months)), b.end, y - 64 - b.h, 90, DISPLAY, C.ink, { align: 'right' });
    } else {
      const N = 60, rcx = 540, rcy = Y(430), R = 250;
      const pts = Array.from({ length: N + 1 }, (_, i) => {
        const k = i / N, line = [lerp(b.start, b.end, k), y - 34 - b.h / 2];
        const a = -Math.PI / 2 + k * TAU * 0.999, circ = [rcx + R * Math.cos(a), rcy + R * Math.sin(a)];
        return [lerp(line[0], circ[0], curl), lerp(line[1], circ[1], curl) - Math.sin(Math.PI * curl) * 80];
      });
      const dashed = curl > 0.8;
      stroke(ctx, pts, { w: lerp(b.h, 7, E.outCubic(curl)), color: dashed ? C.ink : C.blue, seed: 55, amp: 1, cap: 'butt', ...(dashed ? { dash: [24, 16], march: t * 50 } : {}) });
    }
  }
  if (t > 15.1 && t < 18.5) {
    const k = sp(t, 15.1, SPRING.bouncy);
    const hunt = t < 16.7 ? 12 + 9 * Math.sin((t - 15.1) * 3.4) : lerp(12 + 9 * Math.sin(1.6 * 3.4), 18, P(t, 16.7, 16.95, E.outBack));
    const top = y - 34 - 110 - 40;
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(mx(hunt), top + 34 * k); ctx.arc(mx(hunt), top, 20 * k, Math.PI * 0.15, Math.PI * 0.85, true); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(mx(hunt), top, 7 * k, 0, TAU); ctx.fill();
    stroke(ctx, [[mx(hunt), top + 34], [mx(hunt), y - 4]], { w: 3, dash: [8, 8], march: t * 30, seed: 57, amp: 0.5, p: k });
  }
  const cp = P(t, 16.95, 17.2, E.outCubic);
  if (cp > 0) {
    ctx.save(); ctx.translate(0, fall(6));
    const loop = Array.from({ length: 80 }, (_, i) => { const a = -1.9 + (i / 79) * (TAU + 0.5); const r = 58 + 6 * Math.sin(i * 0.25); return [mx(18) + r * 1.15 * Math.cos(a), y + 66 + r * 0.8 * Math.sin(a)]; });
    stroke(ctx, loop, { w: 6, p: cp, seed: 60 });
    ctx.restore();
  }
  if (t > 18.5 && t < 19.86) {
    const k = P(t, 19.15, 19.85, E.bezier(0.6, -0.4, 0.3, 1));
    const fx = lerp(mx(6), 540, k), fy = lerp(y + 84, Y(430) + 82, k) - Math.sin(Math.PI * k) * 160;
    txt(ctx, '6', fx, fy, lerp(42, 240, k), k > 0.5 ? DISPLAY : UI, k > 0.4 ? C.blue : C.ink, { align: 'center' });
  }
}

// ------------------------------------------------------------------ S4: every 6 months, per person (19.4 .. 25)
const spinAt = (t) => 0.3 * (t - 19.4) + TAU * P(t, 21.45, 23.08, E.bezier(0.6, 0, 0.25, 1)) + 0.04 * wobble(t - 23.08, 3, 5);
function s4(ctx, t) {
  if (t < 19.4 || t > 25.2) return;
  const cx = 540, cy = Y(430), r = 250;
  const gap = 0.35 * P(t, 19.9, 20.3, E.outBack);
  const spin = spinAt(t);
  for (const off of [0, Math.PI]) {
    const a0 = -Math.PI / 2 + off + spin + gap / 2, a1 = a0 + Math.PI - gap;
    const d = stroke(ctx, arcPts(cx, cy, r, r, a0, a1, 50), { w: 7, dash: [24, 16], march: t * 50, seed: 70 + off, amp: 1 });
    if (d && gap > 0.05) arrowHead(ctx, d.tip, d.dir, 32 * clamp(gap / 0.35));
  }
  if (t >= 19.85) {
    const k6 = 1 + 0.15 * wobble(t - 19.85, 2.6, 5) + 0.03 * Math.sin(t * 2.4);
    ctx.save(); ctx.translate(cx, cy + 82); ctx.scale(k6, k6); txt(ctx, '6', 0, 0, 240, DISPLAY, C.blue, { align: 'center' }); ctx.restore();
  }
  // two people pop up on "per person", then walk alongside the loop as it turns
  const walk = clamp(prog(t, 21.0, 21.4)) * (1 - 0.6 * prog(t, 23.1, 23.6));
  const k1 = sp(t, 20.55, SPRING.bouncy), k2 = sp(t, 20.72, SPRING.bouncy);
  const ph = (t - 21) * 7;
  if (k1 > 0) { ctx.save(); ctx.translate(cx - 400, Y(860)); ctx.scale(1, k1); person(ctx, 0, 0, 1, C.teal, ph, walk, 1); ctx.restore(); }
  if (k2 > 0) { ctx.save(); ctx.translate(cx + 400, Y(860)); ctx.scale(1, k2); person(ctx, 0, 0, 1, C.ink, ph + 1.8, walk, -1); ctx.restore(); }
}

// ------------------------------------------------------------------ FULL A (26.2 .. 32.4): light accents in the side margins only
function fullA(ctx, t) {
  if (t < 26.2 || t > 32.4) return;
  const tip = [985, 1110];
  const gp = P(t, 26.3, 27.08, E.inCubic);
  grp(ctx, out(t, 31.95, 0.3), tip[0], tip[1], () => {
    const d = stroke(ctx, quad([1010, 1520], [1060, 1300], tip), { w: 5, color: C.cream, p: gp, dash: [16, 12], march: t * 40, seed: 140, amp: 1 });
    if (d) arrowHead(ctx, d.tip, d.dir, 24, C.cream);
  });
  const sp2 = P(t, 28.9, 29.68, E.outCubic), droop = P(t, 30.45, 30.98, E.bezier(0.5, 0, 0.6, 1.6));
  if (sp2 > 0) grp(ctx, out(t, 31.85, 0.3), 90, 1300, () => {
    const end = [lerp(95, 150, droop), lerp(1260, 1500, droop) + 6 * wobble(t - 29.68, 2, 3)];
    const d = stroke(ctx, quad([70, 1520], [lerp(40, 160, droop), lerp(1380, 1250, droop)], end), { w: 5, color: C.cream, p: sp2, dash: [14, 10], march: t * 30, seed: 141, amp: 1 });
    if (d) arrowHead(ctx, d.tip, d.dir, 22, C.cream);
  });
  const kb = sp(t, 27.08, SPRING.bouncy) * (1 - P(t, 32.05, 32.3, E.inBack));
  burst(ctx, tip[0], tip[1] - 20, 44 * (1 + 0.05 * Math.sin(t * 4)), kb, 77, C.gold, 13, 0.35 * (t - 27));
}

// ------------------------------------------------------------------ S5: no documentation (32.05 .. 36.0)
const DOC = { x: 330, y: 170, w: 420, h: 540 };
const DEAL = [540, 740], CP0 = [560, 760], CPC = [560, 130], CP1 = [1010, 170];
function docXform(t) {
  const land = [DOC.x + DOC.w / 2, Y(DOC.y + DOC.h / 2)];
  const k = P(t, 32.1, 32.75, E.inOutCubic);
  const x = lerp(985, land[0], k), y = lerp(1090, land[1], k) - Math.sin(Math.PI * k) * 160;
  const s = lerp(0.15, 1, P(t, 32.05, 32.5, E.outBack)) * out(t, 35.6, 0.35);
  const rot = lerp(-0.6, 0, k) + 0.025 * Math.sin(t * 1.4) + 0.05 * wobble(t - 32.75, 2.5, 4) + 1.4 * E.inCubic(prog(t, 35.6, 35.95));
  const sq = 0.08 * wobble(t - 32.75, 2.8, 5), cr = P(t, 35.6, 35.95, E.inCubic);
  return { x: lerp(x, DEAL[0], cr), y: lerp(y, Y(DEAL[1]), cr), s, rot, sq };
}
function s5(ctx, t) {
  if (t < 32.05 || t > 36.0) return;
  const { x, y, s, rot, sq } = docXform(t);
  if (s <= 0.002) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s * (1 + sq), s * (1 - sq)); ctx.translate(-DOC.w / 2, -DOC.h / 2);
  const { w, h } = DOC;
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w - 70, 0); ctx.lineTo(w, 70); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
  stroke(ctx, [[0, 0], [w - 70, 0], [w, 70], [w, h], [0, h], [0, 0]], { w: 5, seed: 80 });
  stroke(ctx, [[w - 70, 0], [w - 70, 70], [w, 70]], { w: 5, seed: 81 });
  const lp = P(t, 32.75, 33.4, E.outCubic);
  for (let i = 0; i < 8; i++) {
    const ly = 130 + i * 44, lw = i === 0 ? 180 : (i % 3 === 2 ? 200 : 320);
    stroke(ctx, [[50, ly], [50 + lw, ly]], { w: i === 0 ? 11 : 6, color: '#9A9A9A', p: clamp(lp * 8 - i * 0.6), seed: 90 + i, amp: 0.8 });
  }
  stroke(ctx, [[50, h - 70], [260, h - 70]], { w: 4, p: lp, seed: 98 });
  if (lp > 0.6) stroke(ctx, Array.from({ length: 30 }, (_, i) => [60 + i * 6.5, h - 85 - 14 * Math.sin(i * 0.9) * (1 - i / 40)]), { w: 4, color: C.blue, p: P(t, 33.1, 33.6), seed: 99 });
  const s1v = P(t, 34.48, 34.78, E.outCubic), s2v = P(t, 35.05, 35.38, E.outCubic);
  stroke(ctx, [[-40, 40], [w + 40, h - 40]], { w: 32, color: C.blue, p: s1v, seed: 95, amp: 3 });
  stroke(ctx, [[w + 40, 40], [-40, h - 40]], { w: 32, color: C.blue, p: s2v, seed: 96, amp: 3 });
  ctx.restore();
  if (t > 32.75) footer(ctx);
}

// ------------------------------------------------------------------ S6: 13 cards, 10 days, bonus on each (35.9 .. 50)
function cardPos(t, i) {
  const q = quadAt(CP0, CPC, CP1, i / 12);
  const wave = 6 * Math.sin(t * 2.2 - i * 0.5) + 34 * Math.max(0, Math.sin(Math.PI * prog(t, 40.5 + i * 0.04, 41.1 + i * 0.04)));
  return { x: q.x, y: Y(q.y) - wave, a: q.a * 0.5 + 0.03 * Math.sin(t * 1.8 + i) };
}
const BONUS = [0, 2, 4, 6, 8, 10, 12];
function s6(ctx, t) {
  if (t < 35.9 || t > 50.2) return;
  if (t < 45.6) {
    let landed = 0;
    for (let i = 0; i < 13; i++) {
      const tl = 36.0 + i * 0.035, k = sp(t, tl, { stiffness: 320, damping: 20 });
      if (k <= 0) continue;
      if (t >= tl + 0.05) landed++;
      const p = cardPos(t, i);
      card(ctx, lerp(DEAL[0], p.x, k), lerp(Y(DEAL[1]), p.y, k), 128, 82, p.a + (1 - k) * 1.2, [C.ink, C.blue, C.maroon, C.ink, C.green, C.teal][i % 6], clamp(k * 1.5), clamp(k * 1.5));
    }
    if (t > 35.98) {
      const n = Math.max(1, landed), kc = (n === 13 ? 1 + 0.12 * wobble(t - 36.42, 3, 6) : 1) * (1 + 0.015 * Math.sin(t * 2));
      ctx.save(); ctx.translate(70, Y(330)); ctx.scale(kc, kc); txt(ctx, String(n), 0, 0, 220, DISPLAY, C.blue); ctx.restore();
    }
    const ck = sp(t, 37.75, { stiffness: 220, damping: 15 });
    if (ck > 0) {
      const cx0 = 60, cy0 = Y(470) + bob(t, 0.3, 3, 0.4), cw = 440, chh = 330;
      ctx.save(); ctx.translate(cx0 + cw / 2, cy0 + chh); ctx.scale(ck, ck); ctx.translate(-(cx0 + cw / 2), -(cy0 + chh));
      ctx.fillStyle = C.white; ctx.fillRect(cx0, cy0, cw, chh); ctx.fillStyle = C.ink; ctx.fillRect(cx0, cy0, cw, 54);
      stroke(ctx, [[cx0, cy0], [cx0 + cw, cy0], [cx0 + cw, cy0 + chh], [cx0, cy0 + chh], [cx0, cy0]], { w: 5, seed: 330 });
      for (const rx of [cx0 + 110, cx0 + 330]) stroke(ctx, arcPts(rx, cy0, 12, 24, Math.PI, TAU, 10), { w: 7, seed: 331 + rx });
      const tp = P(t, 37.95, 38.54, E.linear);
      for (let i = 0; i < 10; i++) {
        const g = Math.floor(i / 5), j = i % 5, p = clamp(tp * 10 - i);
        if (p <= 0) continue;
        const bx = cx0 + 60 + g * 200, jig = 2 * Math.sin(t * 3 + i);
        if (j < 4) stroke(ctx, [[bx + j * 32, cy0 + 110 + jig], [bx + j * 32 + 4, cy0 + 270]], { w: 9, p, seed: 120 + i });
        else stroke(ctx, [[bx - 20, cy0 + 230], [bx + 140, cy0 + 140]], { w: 9, color: C.maroon, p, seed: 120 + i });
      }
      ctx.restore();
    }
    footer(ctx);
  }
  for (let i = 0; i < 13; i++) {
    const kb0 = sp(t, 43.58 + i * 0.056, SPRING.bouncy);
    if (kb0 <= 0) continue;
    const p = cardPos(Math.min(t, 44.5), i), home = [p.x + 44, p.y - 34];
    if (!BONUS.includes(i)) { burst(ctx, home[0], home[1], 34, kb0 * out(t, 44.45, 0.3), 100 + i, [C.blue, C.teal, C.green, C.maroon][i % 4], 11, 0.6 * t + i); continue; }
    const j = BONUS.indexOf(i), side = j % 2 ? 1 : -1, rng = mulberry32(500 + i);
    const edge = [540 + side * (440 + rng() * 60), 1120 + j * 55 + rng() * 40];
    const L = P(t, 44.5 + j * 0.05, 45.2 + j * 0.05, E.bezier(0.4, 0, 0.2, 1));
    const drift = [Math.sin(t * 0.9 + i) * 8, -Math.max(0, t - 45.2) * 10];
    let x = lerp(home[0], edge[0] + drift[0], L), y = lerp(home[1], edge[1] + drift[1], L);
    let r = lerp(34, 26, L);
    const F = P(t, 49.15 + j * 0.04, 49.75 + j * 0.04, E.inOutCubic);
    if (F > 0) { const rw = [90 + j * 80, Y(720)]; x = lerp(x, rw[0], F); y = lerp(y, rw[1], F) - Math.sin(Math.PI * F) * 80; r = lerp(r, 7, F); }
    if (F >= 1) continue;
    burst(ctx, x, y, r, kb0, 100 + i, C.blue, 11, 0.6 * t + i, 1 - F);
  }
}

// ------------------------------------------------------------------ S7: if used for travel (49.6 .. 56.75)
const PP0 = [230, 668], PPC = [760, 700], PP1 = [880, 250];
function planeState(t) {
  if (t < 51.94) {
    const roll = P(t, 49.75, 50.3, E.outCubic), back = 34 * antic(t, 51.94, 1.0) * prog(t, 50.76, 51.0);
    return { x: lerp(-220, PP0[0], roll) - back, y: Y(PP0[1]) + 1.5 * Math.sin(t * 40) * prog(t, 51.2, 51.9), r: -0.07 * wobble(t - 50.3, 2.2, 4) - 0.06 * back / 34 };
  }
  const fp = P(t, 51.94, 52.95, E.bezier(0.65, 0, 0.3, 1));
  const q = quadAt([PP0[0], Y(PP0[1])], [PPC[0], Y(PPC[1])], [PP1[0], Y(PP1[1])], fp);
  let x = q.x, y = q.y + (fp >= 1 ? 8 * Math.sin((t - 52.95) * 2.6) : 0), r = q.a * Math.min(1, fp * 4) + (fp >= 1 ? 0.06 * Math.sin((t - 52.95) * 2.6) : 0);
  const up = P(t, 55.25, 55.95, E.inCubic);
  if (up > 0) { const u2 = quadAt([x, y], [1080, Y(180)], [1320, -160], up); x = u2.x; y = u2.y; r = lerp(r, u2.a, Math.min(1, up * 3)); }
  return { x, y, r };
}
function s7(ctx, t) {
  if (t < 49.6 || t > 56.75) return;
  stroke(ctx, [[60, Y(720)], [620, Y(720)]], { w: 6, dash: [26, 18], march: t * 20, seed: 130, amp: 0.8, p: P(t, 49.7, 50.1, E.outCubic) });
  const ck = P(t, 49.8, 50.4, E.outBack);
  if (ck > 0) { cloud(ctx, 760 - (t - 49.8) * 12, Y(230) + bob(t, 0, 4, 0.3), ck, 150); cloud(ctx, 520 - (t - 49.8) * 8, Y(160) + bob(t, 1, 3, 0.25), 0.7 * ck, 151); }
  const fp = P(t, 51.94, 52.95, E.bezier(0.65, 0, 0.3, 1));
  if (t > 51.9) {
    const d = stroke(ctx, quad([PP0[0], Y(PP0[1])], [PPC[0], Y(PPC[1])], [PP1[0], Y(PP1[1])]), { w: 6, p: clamp(fp - 0.06), from: P(t, 55.2, 55.8), dash: [22, 16], march: t * 50, seed: 131, amp: 1 });
    if (d && fp < 0.97) arrowHead(ctx, d.tip, d.dir, 28);
  }
  if (t > 53.2) {
    const k = sp(t, 53.2, SPRING.bouncy) * (1 + 0.015 * Math.sin(t * 2.2)) * out(t, 55.3, 0.35);
    const n = Math.round(lerp(7, 21, P(t, 53.45, 53.98, E.inOutSine)));
    const kc = n === 21 ? 1 + 0.12 * wobble(t - 53.98, 3, 6) : 1;
    ctx.save(); ctx.translate(70, Y(370)); ctx.scale(k * kc, k * kc); txt(ctx, `${n}x`, 0, 0, 210, DISPLAY, C.blue); ctx.restore();
  }
  footer(ctx);
}
function planeLayer(ctx, t) {
  if (t < 49.7 || t > 56.95) return;
  if (t > 55.95 && t < 56.45) return;
  let st = planeState(t), s = 1;
  if (t >= 56.45) {
    const k = P(t, 56.45, 56.95, E.inCubic);
    const q = quadAt([-260, 420], [200, 360], [540, 760], k);
    st = { x: q.x, y: q.y, r: q.a }; s = lerp(1, 0.2, k);
  }
  ctx.save(); ctx.translate(st.x, st.y); ctx.rotate(st.r); plane(ctx, s, C.teal); ctx.restore();
}

// ------------------------------------------------------------------ end card
function endCard(ctx, t, IMG) {
  if (t < 56.45) return;
  const k = sp(t, 56.95, { stiffness: 260, damping: 15 });
  if (t < 57.2) stroke(ctx, quad([-260, 420], [200, 360], [540, 760]), { w: 6, p: P(t, 56.45, 56.95, E.inCubic), from: P(t, 56.8, 57.2), dash: [22, 16], march: t * 50, seed: 161, amp: 1 });
  if (IMG.badge && t > 56.93) {
    const s = 680 * (1.35 - 0.35 * k) * (1 + 0.01 * Math.sin(t * 2));
    const ar = IMG.badge.height / IMG.badge.width;
    ctx.save(); ctx.globalAlpha = clamp(k * 3); ctx.translate(540, 760 + bob(t, 0, 4, 0.4)); ctx.rotate(-0.08 * (1 - k) + 0.01 * Math.sin(t * 1.3));
    ctx.drawImage(IMG.badge, -s / 2, -s * ar / 2, s, s * ar); ctx.restore();
  }
  const op = P(t, 57.0, 57.6, E.outCubic);
  if (op > 0) stroke(ctx, arcPts(540, 760, 430, 300, -1.2 + t * 0.4, -1.2 + t * 0.4 + TAU * 0.8 * op, 60), { w: 6, dash: [22, 16], march: t * 40, seed: 160, amp: 1 });
  const tp = P(t, 57.3, 57.75, E.outCubic);
  if (tp > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 1100, 1080 * tp + 40, 220); ctx.clip(); txt(ctx, 'Learn the playbook.', 540, 1220, 76, DISPLAY, C.ink, { align: 'center' }); txt(ctx, 'creditcounselelite.com', 540, 1295, 38, UI, C.blue, { align: 'center' }); ctx.restore(); }
  txt(ctx, 'Education and coaching. Not a lender. Individual results vary.', 540, 1660, 22, UI, '#555', { align: 'center', p: P(t, 57.9, 58.3) });
}


// ------------------------------------------------------------------ footage test: Video 4 "Why investors don't use this strategy" (8.6 s)
// "It's just a lack of knowledge, man ... if people knew it was out there and it was possible, credit wasn't talked about in school and in many homes."
function bookShape(ctx, x, y, s, p, seed) {   // open book, ink
  const L = [[x, y + 20 * s], [x - 120 * s, y - 10 * s], [x - 130 * s, y + 120 * s], [x, y + 150 * s], [x, y + 20 * s]];
  const R = [[x, y + 20 * s], [x + 120 * s, y - 10 * s], [x + 130 * s, y + 120 * s], [x, y + 150 * s]];
  stroke(ctx, L, { w: 6, p: clamp(p * 2), seed }); stroke(ctx, R, { w: 6, p: clamp(p * 2 - 1), seed: seed + 1 });
}
function school(ctx, x, y, s, p, seed) {     // schoolhouse with bell tower + flag
  const pts = [[x - 150 * s, y + 120 * s], [x - 150 * s, y - 20 * s], [x, y - 110 * s], [x + 150 * s, y - 20 * s], [x + 150 * s, y + 120 * s], [x - 150 * s, y + 120 * s]];
  stroke(ctx, pts, { w: 6, p: clamp(p * 1.6), seed });
  stroke(ctx, [[x - 30 * s, y + 120 * s], [x - 30 * s, y + 40 * s], [x + 30 * s, y + 40 * s], [x + 30 * s, y + 120 * s]], { w: 5, p: clamp(p * 3 - 1.4), seed: seed + 2 });
  stroke(ctx, [[x, y - 110 * s], [x, y - 190 * s]], { w: 5, p: clamp(p * 3 - 1.6), seed: seed + 3 });
  if (p > 0.75) { ctx.fillStyle = C.blue; ctx.beginPath(); ctx.moveTo(x, y - 190 * s); ctx.lineTo(x + 60 * s * clamp((p - 0.75) * 4), y - 172 * s); ctx.lineTo(x, y - 154 * s); ctx.fill(); }
  for (const dx of [-95, 95]) stroke(ctx, [[x + (dx - 25) * s, y + 10 * s], [x + (dx + 25) * s, y + 10 * s], [x + (dx + 25) * s, y + 55 * s], [x + (dx - 25) * s, y + 55 * s], [x + (dx - 25) * s, y + 10 * s]], { w: 4, p: clamp(p * 3 - 1.8), seed: seed + 4 + dx });
}
function house(ctx, x, y, s, p, seed) {
  stroke(ctx, [[x - 120 * s, y + 120 * s], [x - 120 * s, y], [x, y - 110 * s], [x + 120 * s, y], [x + 120 * s, y + 120 * s], [x - 120 * s, y + 120 * s]], { w: 6, p: clamp(p * 1.6), seed });
  stroke(ctx, [[x - 25 * s, y + 120 * s], [x - 25 * s, y + 50 * s], [x + 25 * s, y + 50 * s], [x + 25 * s, y + 120 * s]], { w: 5, p: clamp(p * 3 - 1.5), seed: seed + 2 });
  stroke(ctx, [[x + 60 * s, y - 50 * s], [x + 60 * s, y - 95 * s], [x + 85 * s, y - 95 * s], [x + 85 * s, y - 28 * s]], { w: 5, p: clamp(p * 3 - 1.8), seed: seed + 3 });
}
function cross(ctx, x, y, r, p, seed) {        // hand-drawn X in maroon ink
  stroke(ctx, [[x - r, y - r], [x + r, y + r]], { w: 12, color: C.maroon, p: clamp(p * 2), seed });
  stroke(ctx, [[x + r, y - r], [x - r, y + r]], { w: 12, color: C.maroon, p: clamp(p * 2 - 1), seed: seed + 1 });
}
// D1 (0.9-5.2): an investor who doesn't know it exists -> a magnifier finds the 0% card out there -> it's possible
function magnifier(ctx, x, y, r, k, seed) {
  if (k <= 0.01) return;
  stroke(ctx, arcPts(x, y, r, r, 0, TAU, 40), { w: 7, seed }); stroke(ctx, [[x + r * 0.7, y + r * 0.7], [x + r * 1.6, y + r * 1.6]], { w: 14, seed: seed + 1 });
}
// thought cloud: an outline of overlapping bumps (union of circles), paper-filled so it sits over anything behind
function thought(ctx, x, y, s, seed) {
  if (s <= 0.01) return;
  const bumps = [[-110, 10, 52], [-62, -34, 60], [6, -52, 70], [78, -30, 58], [118, 14, 46], [60, 40, 52], [-36, 42, 56]];
  const pts = [];
  for (let i = 0; i <= 180; i++) { const a = (i / 180) * TAU, dx = Math.cos(a), dy = Math.sin(a) * 0.62; let best = 0;
    for (const [bx, by, r] of bumps) { const bdx = dx, bdy = dy; // ray from centre: furthest circle hit
      const B = bx * bdx + by * bdy, Cc = bx * bx + by * by - r * r, D = B * B - Cc * (bdx * bdx + bdy * bdy); if (D >= 0) { const tt = (B + Math.sqrt(D)) / (bdx * bdx + bdy * bdy); if (tt > best) best = tt; } }
    pts.push([x + dx * best * s, y + dy * best * s]); }
  ctx.save(); ctx.fillStyle = C.paper; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.closePath(); ctx.fill(); ctx.restore();
  stroke(ctx, pts, { w: 6, seed });
}
function d1(ctx, t) {
  if (t > 5.6) return;
  const k = sp(t, 0.95, SPRING.bouncy), sway = bob(t, 0.3, 5, 0.4), o1 = out(t, 5.05);
  grp(ctx, o1 * clamp(k), 230, Y(620), () => {
    person(ctx, 230, Y(840) + sway, 1.45, C.ink, 0, 0, 1);
    // briefcase: he's an investor
    ctx.save(); ctx.fillStyle = C.ink; rrect(ctx, 262, Y(700) + sway, 92, 66, 8); ctx.fill(); ctx.restore();
    stroke(ctx, [[288, Y(700) + sway], [288, Y(684) + sway], [328, Y(684) + sway], [328, Y(700) + sway]], { w: 5, seed: 12 });
    // thought: two small bubbles rise from the head into the cloud
    const tb = out(t, 2.9);
    [[292, Y(372), 10, 0.95], [330, Y(338), 16, 1.02]].forEach(([bx, by, r, t0]) => { const kb = clamp(sp(t, t0, SPRING.bouncy)) * tb; if (kb > 0.01) stroke(ctx, arcPts(bx, by + sway, r * kb, r * kb, 0, TAU, 20), { w: 5, seed: 22 + r }); });
    thought(ctx, 560, Y(380), 1.45 * clamp(P(t, 1.05, 1.45, E.outBack)) * tb, 21);
    txt(ctx, '?', 560, Y(418) + bob(t, 1, 6, 0.8), 120, DISPLAY, C.blue, { align: 'center', p: P(t, 1.25, 1.35) * out(t, 2.85) });
  });
  // "out there": a magnifier sweeps right and finds the 0% card
  const sw = P(t, 2.85, 3.6, E.inOutCubic), mx = lerp(560, 760, sw), my = Y(lerp(380, 470, sw)) + Math.sin(Math.PI * sw) * -60;
  if (t > 2.8) grp(ctx, out(t, 5.0), mx, my, () => magnifier(ctx, mx, my, 80, 1, 31));
  if (t > 3.5) {
    const kc = clamp(sp(t, 3.55, SPRING.bouncy)) * out(t, 5.1);
    burst(ctx, 760, Y(470), 190, sp(t, 4.45, SPRING.bouncy) * out(t, 5.1), 3, C.blue, 13, 0.3 * (t - 4.45));
    grp(ctx, kc, 760, Y(470), () => { card(ctx, 760, Y(470), 250, 160, -0.08 + 0.04 * Math.sin(t * 2), C.ink); txt(ctx, '0%', 790, Y(500), 70, DISPLAY, C.white, { align: 'center' }); });
  }
  txt(ctx, 'POSSIBLE', 760, Y(740), 70, DISPLAY, C.blue, { align: 'center', p: P(t, 4.5, 4.8) * out(t, 5.05) });
  txt(ctx, 'LACK OF KNOWLEDGE', 540, Y(150), 84, DISPLAY, C.ink, { align: 'center', p: P(t, 0.4, 1.0) * out(t, 2.75) });
  txt(ctx, "IF PEOPLE KNEW IT'S OUT THERE", 540, Y(150), 70, DISPLAY, C.ink, { align: 'center', p: P(t, 2.8, 3.4) * out(t, 5.0) });
}
// D2 (5.2-8.65): credit wasn't taught in school, and wasn't talked about at home
function chalkboard(ctx, x, y, t, t0) {
  const k = clamp(sp(t, t0, SPRING.bouncy)); if (k <= 0.01) return;
  grp(ctx, k, x, y, () => {
    ctx.save(); ctx.fillStyle = '#1F3A2E'; rrect(ctx, x - 200, y - 150, 400, 290, 10); ctx.fill(); ctx.restore();
    stroke(ctx, [[x - 210, y - 160], [x + 210, y - 160], [x + 210, y + 150], [x - 210, y + 150], [x - 210, y - 160]], { w: 8, seed: 141 });
    [['MATH', t0 + 0.2], ['SCIENCE', t0 + 0.35], ['HISTORY', t0 + 0.5], ['CREDIT', t0 + 0.75]].forEach(([w, tt], i) => {
      const yy = y - 95 + i * 66;
      txt(ctx, w, x - 160, yy + 16, 46, DISPLAY, i === 3 ? '#F4D9A6' : '#F2F2EE', { p: P(t, tt, tt + 0.2) });
      if (i < 3 && t > tt + 0.2) stroke(ctx, [[x + 90, yy], [x + 110, yy + 20], [x + 150, yy - 20]], { w: 7, color: '#F2F2EE', p: P(t, tt + 0.2, tt + 0.35), seed: 150 + i });
    });
  });
}
function d2(ctx, t) {
  if (t < 5.2) return;
  txt(ctx, 'NOT TAUGHT', 540, Y(150), 96, DISPLAY, C.blue, { align: 'center', p: P(t, 5.3, 5.75) });
  chalkboard(ctx, 290, Y(500), t, 5.85);
  txt(ctx, 'SCHOOL', 290, Y(760), 60, DISPLAY, C.ink, { align: 'center', p: P(t, 6.3, 6.6) });
  { const yy = Y(500) - 95 + 3 * 66, b = textBox(ctx, 'CREDIT', 290 - 160, yy + 16, 46, DISPLAY, 'left'), pad = 14;
    stroke(ctx, [[b.cx - b.w / 2 - pad, b.cy], [b.cx + b.w / 2 + pad, b.cy]], { w: 10, color: C.maroon, p: P(t, 6.95, 7.2, E.outCubic), seed: 71, amp: 0.8 });
    cross(ctx, 290 + 120, b.cy, 22, P(t, 7.1, 7.3, E.outCubic), 72); }
  const kh = sp(t, 7.0, SPRING.bouncy);
  grp(ctx, clamp(kh), 800, Y(540), () => {
    house(ctx, 800, Y(600), 1.2, P(t, 7.1, 7.65, E.outCubic), 81);
    // a speech bubble inside: "credit?" that nobody says
    const kb = P(t, 7.45, 7.7, E.outBack);
    grp(ctx, kb, 800, Y(330), () => { ctx.save(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(800, Y(330), 150, 75, 0, 0, TAU); ctx.fill(); ctx.restore(); stroke(ctx, [...arcPts(800, Y(330), 150, 75, 0, TAU, 50)], { w: 6, seed: 91 }); stroke(ctx, [[760, Y(398)], [735, Y(450)], [800, Y(404)]], { w: 6, seed: 92 }); txt(ctx, 'CREDIT?', 800, Y(352), 64, DISPLAY, C.ink, { align: 'center' }); });
  });
  txt(ctx, 'HOME', 800, Y(760), 60, DISPLAY, C.ink, { align: 'center', p: P(t, 7.55, 7.85) });
  cross(ctx, 800, Y(330), 90, P(t, 7.9, 8.25, E.outCubic), 101);
}

// ------------------------------------------------------------------ round 2: Video 19 "The six boxes in a credit profile" (20.3 s)
// "Getting to the 800 club in 30 days, all it comes down to is: after the fixing is done, there's six boxes that make up your
// credit profile. Three of those are fix-related: late payments / payment history, derogatory accounts (collections, charge-off), hard inquiries."
const disclaim = (ctx, a) => txt(ctx, 'Individual results vary. Education only.', 540, Y(955), 22, UI, '#6b6b6b', { align: 'center', p: a > 0.5 ? 1 : 0 });
function gauge(ctx, cx, cy, R, val, p, seed) {   // score dial 300..850 as a manual drawing; val drives the needle
  stroke(ctx, arcPts(cx, cy, R, R, Math.PI, TAU, 60), { w: 7, p: clamp(p * 1.4), seed });
  for (let i = 0; i <= 11; i++) { const a = Math.PI + (i / 11) * Math.PI, k = clamp(p * 1.6 - 0.4 - i * 0.03), r0 = R - (i % 2 ? 22 : 38);
    if (k > 0) stroke(ctx, [[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * (R - 6), cy + Math.sin(a) * (R - 6)]], { w: i % 2 ? 4 : 6, p: k, seed: seed + i }); }
  // the top band (800+) inked blue
  stroke(ctx, arcPts(cx, cy, R + 16, R + 16, Math.PI + Math.PI * (500 / 550), TAU, 16), { w: 14, color: C.blue, p: clamp(p * 1.4 - 0.4), seed: seed + 40 });
  const a = Math.PI + Math.PI * clamp((val - 300) / 550), L = R - 60;
  if (p > 0.6) { ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, TAU); ctx.fill(); ctx.restore(); }
}
function calendarIcon(ctx, x, y, s, t, t0, label) {   // tear-off pad: pages flip off as it counts
  const k = clamp(sp(t, t0, SPRING.bouncy)); if (k <= 0.01) return;
  grp(ctx, k, x, y, () => {
    ctx.save(); ctx.fillStyle = C.white; rrect(ctx, x - 110 * s, y - 100 * s, 220 * s, 210 * s, 14); ctx.fill(); ctx.fillStyle = C.blue; rrect(ctx, x - 110 * s, y - 100 * s, 220 * s, 56 * s, 14); ctx.fill(); ctx.fillRect(x - 110 * s, y - 64 * s, 220 * s, 20 * s); ctx.restore();
    stroke(ctx, [[x - 110 * s, y - 100 * s], [x + 110 * s, y - 100 * s], [x + 110 * s, y + 110 * s], [x - 110 * s, y + 110 * s], [x - 110 * s, y - 100 * s]], { w: 6, seed: 61 });
    [-50, 50].forEach((dx) => stroke(ctx, [[x + dx * s, y - 122 * s], [x + dx * s, y - 80 * s]], { w: 9, seed: 62 + dx }));
    txt(ctx, label, x, y + 70 * s, 120 * s, DISPLAY, C.ink, { align: 'center' });
    // a page flips away
    const f = prog(t, t0 + 0.15, t0 + 0.55); if (f > 0 && f < 1) { ctx.save(); ctx.globalAlpha = 1 - f; ctx.translate(x, y - 40 * s); ctx.rotate(-f * 0.9); ctx.fillStyle = C.cream; ctx.fillRect(-100 * s, -f * 140 * s, 200 * s, 140 * s); ctx.restore(); }
  });
}
function r1(ctx, t) {
  if (t < 0.9 || t > 5.7) return; const o = out(t, 5.25);
  grp(ctx, o, 540, Y(520), () => {
    txt(ctx, 'THE 800 CLUB', 540, Y(150), 100, DISPLAY, C.ink, { align: 'center', p: P(t, 2.0, 2.5) });
    const val = lerp(560, 805, P(t, 2.55, 3.25, E.outBack));
    gauge(ctx, 400, Y(640), 230, val, P(t, 1.2, 2.2, E.inOutSine), 300);
    const kn = clamp(sp(t, 3.25, SPRING.bouncy));
    burst(ctx, 400, Y(300), 100, kn * out(t, 4.6), 7, C.blue, 13, 0.4 * t);
    if (t > 2.55) txt(ctx, String(Math.round(val / 5) * 5 > 800 ? 800 : Math.round(val / 5) * 5), 400, Y(330), 84, DISPLAY, t > 3.25 ? C.white : C.ink, { align: 'center' });
    calendarIcon(ctx, 800, Y(560), 1.0, t, 3.4, '30');
    txt(ctx, 'DAYS', 800, Y(760), 64, DISPLAY, C.ink, { align: 'center', p: P(t, 3.7, 4.0) });
  });
  disclaim(ctx, P(t, 2.4, 2.6) * (1 - P(t, 5.2, 5.4)));
}
// "after the fixing is done": a wrench turns a bolt on the profile sheet twice; then a check, the fix is done
function wrench(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = C.ink;
  rrect(ctx, -14 * s, 0, 28 * s, 230 * s, 14 * s); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, 46 * s, 0, TAU); ctx.fill();
  ctx.fillStyle = C.paper; ctx.fillRect(-16 * s, -50 * s, 32 * s, 46 * s); ctx.restore();
}
function r2(ctx, t) {
  if (t < 5.2 || t > 7.5) return; const k = clamp(sp(t, 5.3, SPRING.bouncy)) * out(t, 6.95);
  grp(ctx, k, 540, Y(520), () => {
    txt(ctx, 'STEP 1: FIX', 540, Y(150), 100, DISPLAY, C.ink, { align: 'center' });
    // the bolt: a hexagon on a plate
    ctx.save(); ctx.fillStyle = C.white; rrect(ctx, 290, Y(330), 500, 380, 16); ctx.fill(); ctx.restore();
    stroke(ctx, [[290, Y(330)], [790, Y(330)], [790, Y(710)], [290, Y(710)], [290, Y(330)]], { w: 6, seed: 70 });
    const turn = P(t, 5.55, 5.85, E.inOutCubic) + P(t, 6.05, 6.35, E.inOutCubic), hx = 540, hy = Y(520);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(turn * Math.PI / 3); ctx.fillStyle = C.grey; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ctx.lineTo(Math.cos(a) * 34, Math.sin(a) * 34); } ctx.closePath(); ctx.fill(); ctx.restore();
    wrench(ctx, hx, hy, 1.0, -0.9 + turn * 0.7);
    // motion arcs while turning
    if ((t > 5.55 && t < 5.9) || (t > 6.05 && t < 6.4)) stroke(ctx, arcPts(hx, hy, 150, 150, -0.2, 0.9, 20), { w: 5, seed: 72 + Math.floor(t * 8) });
    const kc = clamp(sp(t, 6.65, SPRING.bouncy)); if (kc > 0.01) { burst(ctx, 760, Y(360), 80, kc, 9, C.blue, 11, t); stroke(ctx, [[728, Y(362)], [752, Y(388)], [796, Y(334)]], { w: 12, color: C.white, p: P(t, 6.7, 6.9), seed: 74 }); }
    txt(ctx, 'DONE', 540, Y(800), 72, DISPLAY, C.blue, { align: 'center', p: P(t, 6.7, 6.95) });
  });
}
// the profile sheet: six boxes; three of them are fix-related and get filled one by one as he names them
const BOX6 = [[330, 400], [750, 400], [330, 600], [750, 600], [330, 800], [750, 800]];   // left column (0,2,4) = fix-related
function boxIcon(ctx, i, x, y, t) {
  if (i === 0) {   // payment history: a calendar row of payments, one marked LATE in maroon
    const k = clamp(sp(t, 12.1, SPRING.bouncy)); if (k <= 0.01) return;
    grp(ctx, k, x - 80, y, () => { for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { const cx = x - 140 + c * 40, cy = y - 30 + r * 44, late = r === 1 && c === 2;
      ctx.save(); ctx.fillStyle = late ? C.maroon : C.ink; ctx.globalAlpha = late ? 1 : 0.85; rrect(ctx, cx - 15, cy - 15, 30, 30, 5); ctx.fill(); ctx.restore();
      if (!late) stroke(ctx, [[cx - 7, cy], [cx - 1, cy + 7], [cx + 9, cy - 7]], { w: 4, color: C.white, seed: 200 + r * 4 + c }); } });
    if (t > 12.4) { const kl = clamp(sp(t, 12.4, SPRING.bouncy)); grp(ctx, kl, x - 60, y + 58, () => { ctx.save(); ctx.translate(x - 60, y + 58); ctx.rotate(-0.12); ctx.strokeStyle = C.maroon; ctx.lineWidth = 5; ctx.strokeRect(-48, -20, 96, 40); ctx.restore(); txt(ctx, 'LATE', x - 60, y + 72, 34, DISPLAY, C.maroon, { align: 'center' }); }); }
  } else if (i === 2) {   // derogatory: a document stamped COLLECTION, then CHARGE-OFF
    const k = clamp(sp(t, 15.2, SPRING.bouncy)); if (k <= 0.01) return;
    grp(ctx, k, x - 100, y, () => { ctx.save(); ctx.fillStyle = C.white; rrect(ctx, x - 150, y - 60, 100, 124, 6); ctx.fill(); ctx.restore(); stroke(ctx, [[x - 150, y - 60], [x - 50, y - 60], [x - 50, y + 64], [x - 150, y + 64], [x - 150, y - 60]], { w: 4, seed: 210 }); for (let l = 0; l < 4; l++) stroke(ctx, [[x - 134, y - 34 + l * 24], [x - 66 - (l % 2) * 20, y - 34 + l * 24]], { w: 4, seed: 211 + l }); });
    [[16.3, 'COLLECTION', -40, -0.14], [17.1, 'CHARGE-OFF', 30, 0.1]].forEach(([ts, w, dy, r]) => { const ks = pop(t, ts); if (ks <= 0.01) return; const sc = lerp(1.6, 0.82, clamp(ks)); ctx.save(); ctx.translate(x - 100, y + dy); ctx.rotate(r); ctx.scale(sc, sc); ctx.globalAlpha = clamp(ks * 2); ctx.strokeStyle = C.maroon; ctx.lineWidth = 4; ctx.strokeRect(-72, -17, 144, 34); ctx.restore(); ctx.save(); ctx.translate(x - 100, y + dy); ctx.rotate(r); ctx.scale(sc, sc); ctx.globalAlpha = clamp(ks * 2); txt(ctx, w, 0, 10, 26, DISPLAY, C.maroon, { align: 'center' }); ctx.restore(); });
  } else if (i === 4) {   // hard inquiries: a magnifier sweeps over an application
    const k = clamp(sp(t, 18.3, SPRING.bouncy)); if (k <= 0.01) return;
    grp(ctx, k, x - 90, y, () => { ctx.save(); ctx.fillStyle = C.white; rrect(ctx, x - 150, y - 60, 100, 124, 6); ctx.fill(); ctx.restore(); stroke(ctx, [[x - 150, y - 60], [x - 50, y - 60], [x - 50, y + 64], [x - 150, y + 64], [x - 150, y - 60]], { w: 4, seed: 220 }); for (let l = 0; l < 4; l++) stroke(ctx, [[x - 134, y - 34 + l * 24], [x - 70, y - 34 + l * 24]], { w: 4, seed: 221 + l }); });
    const sw = P(t, 18.5, 19.3, E.inOutSine), mx = lerp(x - 140, x - 40, sw), my = y - 10 + Math.sin(sw * Math.PI * 2) * 16;
    if (t > 18.45) { stroke(ctx, arcPts(mx, my, 34, 34, 0, TAU, 30), { w: 7, seed: 225 }); stroke(ctx, [[mx + 24, my + 24], [mx + 60, my + 60]], { w: 11, seed: 226 }); }
  }
}
const BOXLBL = ['PAYMENT\nHISTORY', '', 'DEROGATORY\nACCOUNTS', '', 'HARD\nINQUIRIES', ''];
const BOXT = [13.4, 0, 15.2, 0, 18.7, 0];
function r3(ctx, t) {
  if (t < 7.1) return;
  const ks = clamp(sp(t, 7.4, SPRING.bouncy)), fx = P(t, 9.9, 10.4);
  txt(ctx, '6 BOXES = YOUR PROFILE', 540, Y(150), 84, DISPLAY, C.ink, { align: 'center', p: P(t, 7.4, 8.0) * (1 - P(t, 9.8, 9.9)) });
  txt(ctx, '3 ARE FIX-RELATED', 540, Y(150), 92, DISPLAY, C.blue, { align: 'center', p: P(t, 9.95, 10.5) });
  grp(ctx, ks, 540, Y(590), () => {
    ctx.save(); ctx.fillStyle = C.white; ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8; rrect(ctx, 120, Y(240), 840, 680, 18); ctx.fill(); ctx.restore();
    stroke(ctx, [[120, Y(240)], [960, Y(240)], [960, Y(920)], [120, Y(920)], [120, Y(240)]], { w: 6, seed: 180 });
    txt(ctx, 'CREDIT PROFILE', 160, Y(300), 44, DISPLAY, C.ink, { p: P(t, 7.5, 7.8) });
    BOX6.forEach(([x, y0], i) => {
      const y = Y(y0), kb = P(t, 7.75 + i * 0.09, 8.1 + i * 0.09, E.outCubic), fix = i % 2 === 0, dim = fix ? 0 : fx;
      ctx.save(); ctx.globalAlpha = 1 - 0.6 * dim;
      stroke(ctx, [[x - 180, y - 85], [x + 180, y - 85], [x + 180, y + 85], [x - 180, y + 85], [x - 180, y - 85]], { w: fix && fx > 0 ? lerp(5, 10, fx) : 5, color: fix && fx > 0.5 ? C.blue : C.ink, p: kb, seed: 190 + i, dash: !fix && fx > 0.5 ? [14, 12] : null });
      txt(ctx, String(i + 1), x - 160, y - 50, 34, DISPLAY, fix && fx > 0.5 ? C.blue : C.ink, { p: kb });
      ctx.restore();
      if (fix) { boxIcon(ctx, i, x, y, t); const lb = BOXLBL[i].split('\n'); lb.forEach((l, j) => txt(ctx, l, x + 22, y - 6 + j * 36, 32, DISPLAY, C.ink, { p: P(t, BOXT[i], BOXT[i] + 0.4) })); }
    });
  });
  disclaim(ctx, P(t, 12.0, 12.2));
}

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
  chunks.forEach((c, i) => { c.until = Math.min(chunks[i + 1] ? chunks[i + 1].start : c.end + 0.5, c.end + 0.6); c.text = c.text.replace(/[,]$/, ''); });
  return chunks;
}
function captionsOld(ctx, t, fh) {
  if (t > 56.6) return;
  const c = CAPS.find((c) => t >= c.start - 0.04 && t < c.until);
  if (!c) return;
  const f = clamp((fh - SEAM) / (DH - SEAM));
  const y = lerp(DH - fh, 1600, f);
  ctx.save(); ctx.font = font(52, 800, DISPLAY);
  const w = ctx.measureText(c.text).width;
  const full = f > 0.6;
  ctx.fillStyle = full ? C.cream : C.ink; ctx.fillRect(540 - w / 2 - 22, y - 44, w + 44, 88);
  ctx.fillStyle = full ? C.ink : C.white; ctx.textAlign = 'center'; ctx.fillText(c.text, 540, y + 18);
  ctx.restore();
}

// ------------------------------------------------------------------ textures
let PAPER, WEAR = [], GRAIN = [], INK, ICTX;
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function buildTextures() {
  PAPER = makeCanvas(W, H); const p = PAPER.getContext('2d'); const r = mulberry32(17);
  p.fillStyle = C.paper; p.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) { const gx = r() * W, gy = r() * H; const g = p.createRadialGradient(gx, gy, 0, gx, gy, 80 + r() * 260); g.addColorStop(0, 'rgba(120,110,90,0.05)'); g.addColorStop(1, 'rgba(120,110,90,0)'); p.fillStyle = g; p.fillRect(0, 0, W, H); }
  for (let i = 0; i < W * H / 55; i++) { p.fillStyle = `rgba(30,30,30,${0.12 + r() * 0.45})`; const s = 0.4 + r() * r() * 1.6; p.fillRect(r() * W, r() * H, s, s); }
  for (let i = 0; i < 260; i++) { p.fillStyle = r() < 0.6 ? 'rgba(17,80,194,0.6)' : 'rgba(170,40,40,0.5)'; const s = 0.6 + r() * 1.2; p.fillRect(r() * W, r() * H, s, s); }
  for (let v = 0; v < 3; v++) {
    const c = makeCanvas(W, H), x = c.getContext('2d'), rr = mulberry32(100 + v);
    for (let i = 0; i < W * H / 40; i++) { x.fillStyle = `rgba(0,0,0,${0.5 + rr() * 0.5})`; const s = 0.5 + rr() * rr() * 1.8; x.fillRect(rr() * W, rr() * H, s, s); }
    x.strokeStyle = 'rgba(0,0,0,0.8)'; x.lineWidth = 0.7;
    for (let i = 0; i < 900; i++) { const px = rr() * W, py = rr() * H, a = rr() * TAU, l = 2 + rr() * 6; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
    for (let i = 0; i < 40; i++) { const px = rr() * W, py = rr() * H, rad = 30 + rr() * 120; const g = x.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, 'rgba(0,0,0,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - rad, py - rad, rad * 2, rad * 2); }
    WEAR.push(c);
  }
  for (let v = 0; v < 4; v++) {
    const c = makeCanvas(W, H), x = c.getContext('2d'), rr = mulberry32(300 + v);
    const img = x.createImageData(W, H);
    for (let i = 0; i < img.data.length; i += 4) { const n = rr() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = n; img.data[i + 3] = 255; }
    x.putImageData(img, 0, 0); GRAIN.push(c);
  }
  INK = makeCanvas(W, H); ICTX = INK.getContext('2d');
}

// ------------------------------------------------------------------ footage
let FOOT = null; const FCACHE = new Map();
async function loadFrame(t) {
  const idx = Math.min(SRC_FRAMES, Math.max(1, Math.floor(t * SRC_FPS) + 1));
  if (!FCACHE.has(idx)) {
    const im = new Image(); im.src = `assets/footage/f_${String(idx).padStart(5, '0')}.jpg`;
    try { await im.decode(); } catch { return; }
    FCACHE.set(idx, im);
    while (FCACHE.size > 8) FCACHE.delete(FCACHE.keys().next().value);
  }
  FOOT = FCACHE.get(idx);
}
function pushIn(t) {
  for (const [a, b] of FULL_WINDOWS) if (t >= a - 0.5 && t < b + 0.8) return Math.pow(1.1, P(t, a, b + 0.8, E.inOutSine));
  return 1;
}
const near = (keys, t, a, b) => keys.some(([k]) => t > k - a && t < k + b);
const FAST = [[0.95], [3.25], [4.45], [5.0], [5.9], [6.95], [7.1], [7.9], [8.6]];

// ------------------------------------------------------------------ frame
M.film({
  fonts: [font(96, 400, 'Display'), font(46, 600, 'UI'), font(34, 500, 'UI'), font(100, 800, DISPLAY), font(40, 400, UI)],
  images: { badge: 'assets/badge.png' },
  hits: HITS,
  samples: (t) => (near(FAST, t, 0.2, 1.0) || near(FH_KEYS, t, 0.25, 0.8) ? 10 : 4),
  async init() {
    buildTextures();
    CAPS = buildCaptions(await fetch('assets/words.json').then((r) => r.json()));
  },
  prepare: (t) => loadFrame(t),
  draw(ctx, u, t, IMG) {
    BOIL = Math.floor(t * 8);
    const fh = footH(t); FH = fh;
    ctx.drawImage(PAPER, 0, 0);
    ctx.save(); ctx.scale(S, S);
    if (FOOT && fh > 1) cover(ctx, FOOT, 0, DH - fh, DW, fh, { fx: 0.5, fy: lerp(0.25, 0.45, clamp((fh - SEAM) / (DH - SEAM))), zoom: pushIn(t) });
    ctx.restore();
    ICTX.setTransform(1, 0, 0, 1, 0, 0); ICTX.globalCompositeOperation = 'source-over'; ICTX.clearRect(0, 0, W, H);
    ICTX.setTransform(S, 0, 0, S, 0, 0);
    ICTX.translate(540, 470); ICTX.rotate(0.006 * Math.sin(t * 0.37)); const z = 1 + 0.012 * Math.sin(t * 0.29); ICTX.scale(z, z);
    ICTX.translate(-540 + 6 * Math.sin(t * 0.23), -470 + 5 * Math.sin(t * 0.31));
    r1(ICTX, t); r2(ICTX, t); r3(ICTX, t);
    ICTX.setTransform(1, 0, 0, 1, 0, 0);
    ICTX.globalCompositeOperation = 'destination-out'; ICTX.drawImage(WEAR[BOIL % 3], 0, 0);
    ICTX.globalCompositeOperation = 'source-over';
    ctx.drawImage(INK, 0, 0);
    ctx.save(); ctx.scale(S, S);
    if (fh > 1 && fh < DH - 2) stroke(ctx, [[-10, DH - fh], [DW + 10, DH - fh]], { w: 6, seed: 3, amp: 1.2 });
    captions(ctx, t, fh);
    if (CLAIM_FULL.some(([a, b]) => t > a + 0.3 && t < b) && fh > 1700) {
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8;
      txt(ctx, 'individual results vary. education only.', 540, 1860, 24, UI, C.white, { align: 'center' }); ctx.restore();
    }
    ctx.restore();
  },
  post(ctx, u, t) {
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.16;
    ctx.drawImage(GRAIN[Math.floor(t * 24) % 4], 0, 0); ctx.restore();
  },
});

// brand captions (black overlay, Poppins) — CCE Brand Style Guidelines 2025
function captions(ctx, t, fh) { BR.captions(ctx, t, fh, CAPS); }
