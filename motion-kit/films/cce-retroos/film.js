// CCE — "15 Retro OS" founder split-screen. Pure function of time: window.seek(t) paints frame t.
// Grid = seconds (u === t). Cut to the speaker's word timings. Motion on top, founder below.
// Style: Counsel-Blue desktop with scanlines; 1-bit cream/black windows (striped title bars, close box,
// thick borders, hard offset shadows); pixel icons; pixel type; segmented progress bars; buttons; checkboxes.
// Animated through OS behaviour: zoom-rect window opens/closes, a pixel cursor that moves, drags and clicks,
// segmented bars filling, files dragged to the trash, an image loading line by line, windows cascading.
import * as M from './lib/motion.js';

const { W, H, E, prog, clamp, lerp, spring, springKeys, SPRING, wobble, font, hash01, mulberry32, cover } = M;

const DW = 1080, DH = 1920, S = W / DW, TAU = M.TAU;
const C = { blue: '#0B4DB0', blue2: '#083E91', cream: '#F1ECDD', black: '#0B0B0B' };
const DISPLAY = 'Display', UI = 'UI';
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 1358;
const SEAM = 980;

const HITS = [
  [1.2, 'window', 'click', { gain: 0.5 }],
  [2.15, 'grab', 'click', { gain: 0.5 }],
  [2.2, 'drag', 'whoosh', { len: 1.7, from: 500, to: 1500, gain: 0.2 }],
  [4.1, 'drop', 'thud+blip', { pitch: 'E6', gain: 0.55 }],
  [5.6, 'window', 'click', { gain: 0.45 }],
  [6.48, 'sun', 'blip', { pitch: 'A6', gain: 0.4 }],
  [6.95, 'calc opens', 'click', { gain: 0.45 }],
  [8.38, 'C', 'tick', { gain: 0.6 }],
  [9.28, '1', 'tick', { gain: 0.6 }],
  [9.6, '-', 'tick', { gain: 0.5 }],
  [9.94, '5', 'tick', { gain: 0.6 }],
  [10.18, '%', 'blip', { pitch: 'C6', gain: 0.4 }],
  [10.95, 'slider opens', 'click', { gain: 0.45 }],
  [13.45, 'grab', 'click', { gain: 0.5 }],
  [14.3, 'release', 'thud', { gain: 0.45 }],
  [17.14, 'tooltip', 'blip', { pitch: 'G6', gain: 0.4 }],
  [19.5, 'window', 'click', { gain: 0.45 }],
  [19.9, 'six', 'pop', { pitch: 'C5', gain: 0.45 }],
  [20.55, 'user', 'blip', { pitch: 'E6', gain: 0.35 }],
  [20.72, 'user', 'blip', { pitch: 'A6', gain: 0.35 }],
  [21.5, 'cascade', 'click', { gain: 0.4 }], [21.9, 'cascade', 'click', { gain: 0.4 }], [22.3, 'cascade', 'click', { gain: 0.4 }], [22.7, 'cascade', 'click', { gain: 0.4 }],
  [23.08, 'again', 'bell', { pitch: 'D6', gain: 0.35 }],
  [32.5, 'icons', 'type', { len: 0.4, gain: 0.3 }],
  [34.48, 'trash 1', 'thud', { gain: 0.4 }], [34.9, 'trash 2', 'thud', { gain: 0.35 }], [35.38, 'trash all', 'thud+click', { gain: 0.55 }],
  [36.42, '13', 'bell', { pitch: 'D6', gain: 0.35 }],
  [38.54, '10 ticks', 'click', { gain: 0.55 }],
  [41.0, 'marquee', 'tick', { gain: 0.4 }],
  [43.6, 'badges', 'coins', { gain: 0.4 }],
  [50.8, 'loading', 'type', { len: 1.1, gain: 0.25 }],
  [51.94, 'image done', 'blip', { pitch: 'E6', gain: 0.4 }],
  [53.98, '21x', 'bell', { pitch: 'E6', gain: 0.4 }],
  [56.95, 'badge window', 'thud', { gain: 0.6 }],
  [57.65, 'play click', 'click', { gain: 0.6 }],
];

// ------------------------------------------------------------------ helpers
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);
const P = (t, a, b, ease = E.inOutCubic) => ease(prog(t, a, b));
const antic = (t, t0, dur = 0.2) => { const p = prog(t, t0 - dur, t0 + 0.02); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; };
const step = (x, n) => Math.floor(clamp(x) * n) / n;          // posterize: retro stepped motion
let FH = DH;
const Y = (y) => y - (FH - SEAM);
function txt(ctx, s, x, y, size, family, color, align = 'left') {
  if (size < 0.5) return; ctx.save(); ctx.font = font(size, 700, family); ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(s, x, y); ctx.restore();
}
// 1-bit bitmap: 'X' black, 'o' cream, '.' clear
function bmp(ctx, rows, x, y, px, { center = true, inv = false } = {}) {
  const w = rows[0].length * px, h = rows.length * px, x0 = center ? x - w / 2 : x, y0 = center ? y - h / 2 : y;
  for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) {
    const ch = rows[j][i]; if (ch === '.') continue;
    ctx.fillStyle = (ch === 'X') !== inv ? C.black : C.cream; ctx.fillRect(x0 + i * px, y0 + j * px, px + 0.5, px + 0.5);
  }
}
function pixCircle(ctx, cx, cy, r, px, color, ring = 0) {
  ctx.fillStyle = color; const n = Math.ceil(r / px);
  for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) { const d = Math.hypot(i, j) * px; if (d <= r && (!ring || d >= r - ring)) ctx.fillRect(cx + i * px - px / 2, cy + j * px - px / 2, px + 0.5, px + 0.5); }
}

const BM = {
  cursor: ['X...........', 'XX..........', 'XoX.........', 'XooX........', 'XoooX.......', 'XooooX......', 'XoooooX.....', 'XooooooX....', 'XoooooooX...', 'XooooooooX..', 'XoooooXXXXX.', 'XooXooX.....', 'XoX.XooX....', 'XX..XooX....', 'X....XooX...', '.....XooX...', '......XX....'],
  folder: ['..XXXXXX........', '.XooooooX.......', 'XXXXXXXXXXXXXXX.', 'XoooooooooooooXX', 'XoooooooooooooXX', 'XoooooooooooooXX', 'XoooooooooooooXX', 'XoooooooooooooXX', 'XoooooooooooooXX', 'XoooooooooooooXX', 'XXXXXXXXXXXXXXXX', '.XXXXXXXXXXXXXXX'],
  doc: ['XXXXXXXX....', 'XooooooXX...', 'XooooooXoX..', 'XooooooXXXX.', 'XoXXXXXXooX.', 'XoooooooooX.', 'XoXXXXXXXoX.', 'XoooooooooX.', 'XoXXXXXoooX.', 'XoooooooooX.', 'XoXXXXXXXoX.', 'XoooooooooX.', 'XXXXXXXXXXX.'],
  card: ['XXXXXXXXXXXXXXXX', 'XooooooooooooooX', 'XXXXXXXXXXXXXXXX', 'XooooooooooooooX', 'XoXXXooooooooooX', 'XoXoXooooooooooX', 'XoXXXooooooooooX', 'XooooooooooooooX', 'XoXXoXXoXXoXXooX', 'XooooooooooooooX', 'XXXXXXXXXXXXXXXX'],
  lid: ['....XXXX....', 'XXXXXXXXXXXX', 'XooooooooooX', 'XXXXXXXXXXXX'],
  can: ['.XXXXXXXXXX.', '.XooXooXooX.', '.XooXooXooX.', '.XooXooXooX.', '.XooXooXooX.', '.XooXooXooX.', '.XooXooXooX.', '.XooXooXooX.', '.XooXooXooX.', '.XXXXXXXXXX.'],
  hourglass: ['XXXXXXXXXX', 'XooooooooX', '.XXooooXX.', '..XXooXX..', '...XXXX...', '....XX....', '...XooX...', '..XooXoX..', '.XooXXXoX.', 'XoXXXXXXoX', 'XXXXXXXXXX'],
  face: ['...XXXXXX...', '..XooooooX..', '.XooooooooX.', 'XooXooooXooX', 'XooXooooXooX', 'XooooooooooX', 'XooooooooooX', 'XoXooooooXoX', 'XooXXXXXXooX', '.XooooooooX.', '..XooooooX..', '...XXXXXX...'],
  check: ['.........XX', '........XX.', 'XX.....XX..', '.XX...XX...', '..XX.XX....', '...XXX.....', '....X......'],
  star: ['.....X.....', '.....X.....', '....XXX....', 'XXXXXXXXXXX', '.XXXXXXXXX.', '..XXXXXXX..', '..XXX.XXX..', '.XX.....XX.'],
};

// ------------------------------------------------------------------ window chrome
// light: black title bar (stripes + close box) over a cream body; dark: black body with cream content
function chrome(ctx, x, y, w, h, { title = '', dark = false, shadow = 16 } = {}) {
  ctx.fillStyle = C.black; ctx.fillRect(x + shadow, y + shadow, w, h);
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = dark ? C.black : C.cream; ctx.fillRect(x + 7, y + 7, w - 14, h - 14);
  // title bar
  ctx.fillStyle = C.black; ctx.fillRect(x + 7, y + 7, w - 14, 56);
  ctx.fillStyle = C.cream; ctx.fillRect(x + 7, y + 63, w - 14, 5); ctx.fillStyle = C.black; ctx.fillRect(x + 7, y + 68, w - 14, 4);
  const sx0 = x + w - 250, sx1 = x + w - 80;
  ctx.fillStyle = C.cream; for (let i = 0; i < 5; i++) ctx.fillRect(sx0, y + 18 + i * 8, sx1 - sx0, 4);
  // close box
  ctx.strokeStyle = C.cream; ctx.lineWidth = 5; const bx = x + w - 62, by = y + 17;
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 34, by + 34); ctx.moveTo(bx + 34, by); ctx.lineTo(bx, by + 34); ctx.stroke();
  if (title) txt(ctx, title, x + 26, y + 50, 34, UI, C.cream);
}
// zoom rects + window life: open at t0 (rects grow from `from`), close at t1 (rects shrink to `to`)
function win(ctx, t, rect, t0, t1, from, to, opts, content) {
  const [x, y, w, h] = rect, D = 0.2;
  const rectAt = (pt, k) => [lerp(pt[0], x, k), lerp(pt[1], y, k), lerp(8, w, k), lerp(6, h, k)];
  const outline = (r) => { ctx.strokeStyle = C.cream; ctx.lineWidth = 4; ctx.strokeRect(...r); };
  if (t >= t0 - D && t < t0) { const q = step((t - (t0 - D)) / D, 6); [q, q - 0.2, q - 0.4].forEach((k) => k > 0 && outline(rectAt(from, E.outCubic(k)))); return; }
  if (t1 != null && t >= t1 && t < t1 + D) { const q = step((t - t1) / D, 6); [1 - q, 1.2 - q, 1.4 - q].forEach((k) => k > 0 && k <= 1 && outline(rectAt(to, E.inCubic(k)))); return; }
  if (t < t0 || (t1 != null && t >= t1 + D)) return;
  const k = 0.95 + 0.05 * clamp(sp(t, t0, { stiffness: 420, damping: 22 }));
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-(x + w / 2), -(y + h / 2));
  chrome(ctx, x, y, w, h, opts);
  ctx.save(); ctx.beginPath(); ctx.rect(x + 7, y + 72, w - 14, h - 79); ctx.clip(); content && content(x, y + 72, w, h - 72); ctx.restore();
  ctx.restore();
}
function bar(ctx, x, y, w, h, p, segs = 26, dark = false) {
  ctx.fillStyle = dark ? C.cream : C.black; ctx.fillRect(x, y, w, h); ctx.fillStyle = dark ? C.black : C.cream; ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
  const n = Math.floor(clamp(p) * segs), sw = (w - 20) / segs;
  ctx.fillStyle = dark ? C.cream : C.black; for (let i = 0; i < n; i++) ctx.fillRect(x + 10 + i * sw, y + 10, sw * 0.55, h - 20);
}
function button(ctx, x, y, w, h, label, pressed = false) {
  ctx.fillStyle = C.black; ctx.fillRect(x + (pressed ? 2 : 6), y + (pressed ? 2 : 6), w, h); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = pressed ? C.black : C.cream; ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
  if (label) txt(ctx, label, x + w / 2, y + h / 2 + 12, 32, UI, pressed ? C.cream : C.black, 'center');
}
function dither(ctx, x, y, w, h, px = 6) { ctx.fillStyle = C.black; for (let j = 0; j < h / px; j++) for (let i = (j % 2); i < w / px; i += 2) ctx.fillRect(x + i * px, y + j * px, px, px); }
function ants(ctx, x, y, w, h, t) { ctx.save(); ctx.strokeStyle = C.cream; ctx.lineWidth = 4; ctx.setLineDash([12, 10]); ctx.lineDashOffset = -t * 60; ctx.strokeRect(x, y, w, h); ctx.strokeStyle = C.black; ctx.lineDashOffset = -t * 60 + 11; ctx.strokeRect(x, y, w, h); ctx.restore(); }

// ------------------------------------------------------------------ the cursor: keyed path (local panel coords), presses
// [arrive, x, y]; each move takes ~0.25-0.6 s and eases in/out, then waits
const CUR = [
  [1.2, 1100, 900], [1.75, 230, 420], [2.12, 240, 410],
  [4.1, 840, 400], [4.6, 900, 640], [5.55, 760, 600], [6.6, 760, 430],
  [7.6, 540, 560], [8.33, 395, 555], [9.24, 395, 745], [9.56, 665, 650], [9.9, 485, 650], [10.14, 665, 555], [10.6, 700, 700],
  [11.8, 700, 520], [13.4, mxS(6), 445], [14.3, mxS(24), 445], [15.4, mxS(24) - 40, 520], [16.8, mxS(18), 470], [18.2, mxS(18) + 20, 520],
  [19.3, 640, 560], [20.4, 540, 470], [21.45, 600, 610], [21.85, 640, 650], [22.25, 680, 690], [22.65, 720, 730], [23.05, 760, 770], [23.8, 820, 830],
  [32.6, 900, 900], [33.55, 170, 170], [34.48, 820, 520], [34.62, 170, 330], [34.9, 820, 520], [35.0, 170, 490], [35.2, 820, 520], [35.24, 170, 650], [35.38, 820, 520], [35.8, 900, 700],
  [36.6, 900, 820], [40.4, 470, 90], [41.0, 1030, 760], [42.5, 980, 840], [43.5, 600, 820], [44.3, 900, 860],
  [50.0, 900, 860], [50.7, 560, 580], [51.94, 570, 600], [53.2, 830, 560], [54.4, 850, 600], [55.2, 900, 700],
];
const PRESS = [2.15, 8.38, 9.28, 9.6, 9.94, 10.18, 13.45, 21.5, 21.9, 22.3, 22.7, 23.08, 33.58, 34.62, 35.0, 35.24, 40.45];
const DRAGS = [[2.15, 4.1], [13.45, 14.3], [33.58, 34.48], [34.62, 34.9], [35.0, 35.2], [35.24, 35.38], [40.45, 41.0]];
function mxS(m) { return lerp(150, 930, m / 24); }
function cursorAt(t) {
  let i = 0; while (i < CUR.length - 1 && CUR[i + 1][0] <= t) i++;
  if (t <= CUR[0][0]) return [CUR[0][1], CUR[0][2]];
  if (i >= CUR.length - 1) return [CUR[CUR.length - 1][1], CUR[CUR.length - 1][2]];
  const [ta, xa, ya] = CUR[i], [tb, xb, yb] = CUR[i + 1];
  const dragging = DRAGS.some(([a, b]) => Math.abs(a - ta) < 0.06 && Math.abs(b - tb) < 0.06);
  const dur = dragging ? tb - ta : clamp(Math.hypot(xb - xa, yb - ya) / 1500, 0.22, 0.6);
  const k = P(t, tb - dur, tb, dragging ? E.inOutSine : E.inOutCubic);
  const arc = Math.sin(Math.PI * k) * (dragging ? -30 : 18);
  return [lerp(xa, xb, k), lerp(ya, yb, k) + arc];
}
function drawCursor(ctx, t) {
  const panelVisible = FH < 1500 && t > 1.15 && t < 56.6;
  if (!panelVisible) return;
  const [x, y] = cursorAt(t);
  const pr = PRESS.some((p) => t > p - 0.02 && t < p + 0.12);
  ctx.save(); ctx.translate(x, Y(y)); ctx.scale(pr ? 0.86 : 1, pr ? 0.86 : 1); bmp(ctx, BM.cursor, 0, 0, 5, { center: false }); ctx.restore();
}
const pressed = (t, p) => t > p - 0.02 && t < p + 0.16;

// ------------------------------------------------------------------ scenes (local panel coords; y via Y())
function sTransfer(ctx, t) {
  const R = [90, Y(150), 900, 560];
  win(ctx, t, R, 1.2, 6.55, [1060, Y(880)], [760, Y(430)], {}, (x, y, w, h) => {
    const L = [x + 170, y + 190], Rt = [x + w - 170, y + 190];
    const bounce = 1 + 0.15 * wobble(t - 4.1, 3, 6) * (t > 4.1 ? 1 : 0);
    bmp(ctx, BM.folder, L[0], L[1], 11);
    ctx.save(); ctx.translate(Rt[0], Rt[1]); ctx.scale(bounce, 2 - bounce); bmp(ctx, BM.folder, 0, 0, 11); ctx.restore();
    // a stream of copied pages flies between the folders while the drag happens (stepped like an OS copy)
    for (let i = 0; i < 6; i++) {
      const t0 = 2.3 + i * 0.28, k = step(prog(t, t0, t0 + 0.6), 8);
      if (k <= 0 || k >= 1 || t > 4.1) continue;
      bmp(ctx, BM.doc, lerp(L[0], Rt[0], k), L[1] - 40 - Math.sin(Math.PI * k) * 120, 6);
    }
    // the dragged page sits under the cursor
    if (t > 2.15 && t < 4.12) { const [cx, cy] = cursorAt(t); bmp(ctx, BM.doc, cx - 10, Y(cy) + 30, 8); }
    bar(ctx, x + 60, y + 330, w - 120, 60, P(t, 2.2, 4.1, E.linear), 30);
    txt(ctx, `${Math.round(100 * P(t, 2.2, 4.1, E.linear))}%`, x + w - 60, y + 450, 46, DISPLAY, C.black, 'right');
  });
  // next day: small dark window; the moon sinks and the sun steps up, landing on "day"
  win(ctx, t, [620, Y(40), 380, 330], 5.6, 6.62, [760, Y(600)], [760, Y(430)], { dark: true }, (x, y, w, h) => {
    const cx = x + w / 2, hz = y + h - 40;
    const moon = step(prog(t, 5.7, 6.15), 6), sun = step(P(t, 6.15, 6.48, E.outBack), 8);
    if (moon < 1) { pixCircle(ctx, cx, y + 110 + moon * 160, 50, 8, C.cream); pixCircle(ctx, cx + 22, y + 92 + moon * 160, 42, 8, C.black); }
    if (sun > 0) {
      pixCircle(ctx, cx, hz - sun * 130, 46, 8, C.cream);
      if (t > 6.48 && Math.floor(t * 8) % 2 === 0) for (let a = 0; a < 8; a++) { const r = a * TAU / 8; ctx.fillStyle = C.cream; ctx.fillRect(cx + Math.cos(r) * 78 - 8, hz - 130 + Math.sin(r) * 78 - 8, 16, 16); }
    }
    ctx.fillStyle = C.black; ctx.fillRect(x, hz, w, h); ctx.fillStyle = C.cream; ctx.fillRect(x + 20, hz, w - 40, 6);
  });
}

const KEYS = [['7', '8', '9', '%'], ['4', '5', '6', '-'], ['1', '2', '3', '+'], ['C', '0', '.', '=']];
const KEYPRESS = { 'C': 8.38, '1': 9.28, '-': 9.6, '5': 9.94, '%': 10.18 };
function sCalc(ctx, t) {
  win(ctx, t, [300, Y(60), 480, 820], 6.95, 10.62, [760, Y(430)], [700, Y(700)], {}, (x, y, w, h) => {
    ctx.fillStyle = C.black; ctx.fillRect(x + 25, y + 25, w - 50, 170);
    let disp = '0';
    if (t > 9.28) disp = '1'; if (t > 9.6) disp = '1-'; if (t > 9.94) disp = '1-5'; if (t > 10.18) disp = '1-5%';
    const flash = t > 8.38 && t < 8.6 && Math.floor(t * 20) % 2 === 0;
    if (flash) { ctx.fillStyle = C.cream; ctx.fillRect(x + 25, y + 25, w - 50, 170); }
    const kd = disp.length > 0 && t > 9.28 ? 1 + 0.1 * wobble(t - (t > 10.18 ? 10.18 : t > 9.94 ? 9.94 : 9.28), 3, 7) : 1;
    ctx.save(); ctx.translate(x + w - 45, y + 165); ctx.scale(kd, kd); txt(ctx, disp, 0, 0, 140, DISPLAY, flash ? C.black : C.cream, 'right'); ctx.restore();
    if (t < 8.38 && Math.floor(t * 2.5) % 2 === 0) { ctx.fillStyle = C.cream; ctx.fillRect(x + w - 70, y + 60, 18, 100); }   // blinking caret
    KEYS.forEach((row, r) => row.forEach((k, c) => {
      const bx = x + 25 + c * 108, by = y + 225 + r * 125;
      const tp = KEYPRESS[k];
      button(ctx, bx, by, 92, 105, '', tp != null && pressed(t, tp));
      txt(ctx, k, bx + 46, by + 70, 52, DISPLAY, tp != null && pressed(t, tp) ? C.cream : C.black, 'center');
    }));
  });
}

function sSlider(ctx, t) {
  win(ctx, t, [60, Y(140), 960, 560], 10.95, 18.3, [700, Y(700)], [700, Y(520)], {}, (x, y, w, h) => {
    const ty = Y(445);
    const val = t < 13.45 ? 6 : lerp(6, 24, P(t, 13.45, 14.3, E.inOutSine));
    // range selection (dither) from 6 to the thumb
    if (t > 13.4) dither(ctx, mxS(6), ty - 18, mxS(val) - mxS(6), 36);
    ctx.fillStyle = C.black; ctx.fillRect(mxS(0), ty - 4, mxS(24) - mxS(0), 8);
    for (let m = 0; m <= 24; m++) { const major = m % 6 === 0; ctx.fillRect(mxS(m) - 3, ty + 26, 6, major ? 30 : 14); if (major) txt(ctx, String(m), mxS(m), ty + 100, 38, UI, C.black, 'center'); }
    // thumbs
    const thumb = (m, act) => { ctx.fillStyle = C.black; ctx.fillRect(mxS(m) - 22, ty - 46, 44, 92); ctx.fillStyle = act ? C.black : C.cream; ctx.fillRect(mxS(m) - 15, ty - 39, 30, 78); };
    thumb(6, false); thumb(val, t > 13.45 && t < 14.32);
    if (t > 13.5 && t < 16.7) ants(ctx, mxS(6) - 30, ty - 62, mxS(val) - mxS(6) + 60, 124, t);
    // spinbox
    const sv = Math.round(val), kb = sv === 24 ? 1 + 0.1 * wobble(t - 14.3, 3, 6) : 1;
    ctx.fillStyle = C.black; ctx.fillRect(x + w - 260, y + 30, 220, 150); ctx.fillStyle = C.cream; ctx.fillRect(x + w - 253, y + 37, 206, 136);
    ctx.save(); ctx.translate(x + w - 150, y + 155); ctx.scale(kb, kb); txt(ctx, String(sv), 0, 0, 130, DISPLAY, C.black, 'center'); ctx.restore();
    // tooltip balloon at 18, landing on "18"
    const tk = sp(t, 17.05, { stiffness: 380, damping: 18 });
    if (t > 17.0) {
      const bx = mxS(18), by = ty - 180;
      ctx.save(); ctx.translate(bx, by + 60); ctx.scale(tk, tk); ctx.translate(-bx, -(by + 60));
      ctx.fillStyle = C.black; ctx.fillRect(bx - 90 + 10, by - 60 + 10, 180, 110); ctx.fillRect(bx - 90, by - 60, 180, 110);
      ctx.beginPath(); ctx.moveTo(bx - 20, by + 50); ctx.lineTo(bx, by + 80); ctx.lineTo(bx + 20, by + 50); ctx.fill();
      ctx.fillStyle = C.cream; ctx.fillRect(bx - 84, by - 54, 168, 98);
      bmp(ctx, BM.star, bx, by - 5 + (Math.floor(t * 6) % 2 ? -3 : 0), 9);
      ctx.restore();
    }
  });
}

function sCascade(ctx, t) {
  const N = 5, times = [19.5, 21.5, 21.9, 22.3, 22.7];
  for (let i = 0; i < N; i++) {
    const R = [300 + i * 40, Y(150 + i * 40), 440, 420];
    win(ctx, t, R, times[i], 23.85 + (N - 1 - i) * 0.04, i ? [R[0] + 300, R[1] + 380] : [700, Y(520)], [820, Y(830)], {}, (x, y, w, h) => {
      const k6 = i === N - 1 && t > 23.08 ? 1 + 0.12 * wobble(t - 23.08, 3, 6) : 1;
      const pop6 = i === 0 ? clamp(sp(t, 19.85, SPRING.bouncy)) : 1;
      ctx.save(); ctx.translate(x + w / 2, y + 220); ctx.scale(k6 * pop6, k6 * pop6); txt(ctx, '6', 0, 0, 230, DISPLAY, C.black, 'center'); ctx.restore();
      bar(ctx, x + 40, y + h - 110, w - 80, 50, i === 0 ? P(t, 19.9, 21.4, E.linear) : P(t, times[i], times[i] + 0.38, E.linear), 16);
    });
  }
  // two users on "per person"
  [[40, 20.55], [790, 20.72]].forEach(([wx, t0], j) => {
    win(ctx, t, [wx, Y(560), 250, 290], t0, 23.85, [540, Y(470)], [820, Y(830)], { dark: j === 1 }, (x, y, w, h) => {
      const hop = t > t0 + 0.2 && t < 21.4 ? -Math.abs(Math.sin((t - t0) * 7)) * 14 : 0;
      bmp(ctx, BM.face, x + w / 2, y + h / 2 - 10 + hop, 13, { inv: j === 1 });
    });
  });
  if (t > 23.08 && t < 23.85) { const k = step(prog(t, 23.08, 23.5), 5); for (let a = 0; a < 8; a++) { const r = a * TAU / 8, d = 290 + k * 90; ctx.fillStyle = C.cream; ctx.fillRect(460 + 220 + Math.cos(r) * d - 8, Y(320 + 210) + Math.sin(r) * d - 8, 16, 16); } }
}

function sTrash(ctx, t) {
  if (t < 32.3 || t > 36.0) return;
  const kO = P(t, 35.6, 35.85, E.inBack);
  const trash = [820, Y(520)];
  // desktop icons: five pages in a column; each is dragged into the trash
  const grabs = [[33.58, 34.48], [34.62, 34.9], [35.0, 35.2], [35.24, 35.38], [35.24, 35.38]];
  for (let i = 0; i < 5; i++) {
    const home = [170, Y(170 + i * 160)];
    const k = clamp(sp(t, 32.45 + i * 0.06, SPRING.bouncy));
    const [g0, g1] = grabs[i];
    if (t >= g1) continue;
    let p = home;
    if (t > g0) { const [cx, cy] = cursorAt(t); p = [cx - 10 + (i === 4 ? 30 : 0), Y(cy) + 40 + (i === 4 ? 20 : 0)]; }
    if (k > 0) { ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(k * (1 - kO), k * (1 - kO)); bmp(ctx, BM.doc, 0, 0, 9); ctx.restore(); }
  }
  // trash can: lid pops up as a page arrives, bulges on the last drop
  const arr = [34.48, 34.9, 35.2, 35.38];
  const open = Math.max(...arr.map((a) => Math.max(0, Math.sin(Math.PI * prog(t, a - 0.2, a + 0.12)))));
  const bulge = 0.12 * wobble(t - 35.38, 3, 6) * (t > 35.38 ? 1 : 0);
  const kt = clamp(sp(t, 32.6, SPRING.bouncy)) * (1 - kO);
  ctx.save(); ctx.translate(trash[0], trash[1] + 60); ctx.scale(kt * (1 + bulge), kt * (1 - bulge)); ctx.translate(-trash[0], -(trash[1] + 60));
  bmp(ctx, BM.can, trash[0], trash[1] + 15, 17);
  ctx.save(); ctx.translate(trash[0] - 100, trash[1] - 90); ctx.rotate(-0.55 * open); bmp(ctx, BM.lid, 100, 0, 17); ctx.restore();
  ctx.restore();
}

const SLOT = (i) => [560 + (i % 4) * 125, Y(130 + Math.floor(i / 4) * 125)];
function sCards(ctx, t) {
  if (t < 35.9 || t > 44.7) return;
  const close = 44.4;
  // big 13
  win(ctx, t, [50, Y(60), 420, 380], 36.0, close, [540, Y(760)], [900, Y(860)], { dark: true }, (x, y, w, h) => {
    const n = Math.min(13, Math.max(1, Math.floor(prog(t, 36.0, 36.42) * 13) + 1));
    const k = n === 13 ? 1 + 0.1 * wobble(t - 36.42, 3, 6) : 1;
    ctx.save(); ctx.translate(x + w / 2, y + 220); ctx.scale(k, k); txt(ctx, String(n), 0, 0, 240, DISPLAY, C.cream, 'center'); ctx.restore();
  });
  // ten days: checklist, ticks landing on "10"
  win(ctx, t, [50, Y(500), 470, 320], 37.75, close, [540, Y(760)], [900, Y(860)], {}, (x, y, w, h) => {
    for (let d = 0; d < 10; d++) {
      const bx = x + 30 + (d % 5) * 84, by = y + 25 + Math.floor(d / 5) * 105;
      ctx.fillStyle = C.black; ctx.fillRect(bx, by, 64, 64); ctx.fillStyle = C.cream; ctx.fillRect(bx + 6, by + 6, 52, 52);
      if (t > 37.95 + d * 0.059) bmp(ctx, BM.check, bx + 34, by + 30, 5);
    }
  });
  // desktop card icons, 13 pop in; a marquee selection is dragged round them; each gets a badge on "bonus for each"
  const kO = P(t, close, close + 0.2, E.inBack);
  for (let i = 0; i < 13; i++) {
    const [x, y] = SLOT(i), k = clamp(sp(t, 36.0 + i * 0.033, SPRING.bouncy)) * (1 - kO);
    if (k <= 0) continue;
    const sel = t > 40.6 + i * 0.02 && t < 43.4;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    if (sel) { ctx.fillStyle = C.black; ctx.fillRect(-60, -42, 120, 84); }
    bmp(ctx, BM.card, 0, 0, 6.5, { inv: sel });
    const kb = clamp(sp(t, 43.58 + i * 0.056, SPRING.bouncy));
    if (kb > 0) { ctx.save(); ctx.translate(48, -36); ctx.scale(kb, kb); pixCircle(ctx, 0, 0, 26, 6, C.black); txt(ctx, '+', 0, 13, 40, DISPLAY, C.cream, 'center'); ctx.restore(); }
    ctx.restore();
  }
  if (t > 40.45 && t < 41.6) {
    const [cx, cy] = cursorAt(Math.min(t, 41.0)), x0 = 470, y0 = Y(70);
    ants(ctx, x0, y0, cx - x0, Y(cy) - y0, t);
  }
}

// pixel beach picture, revealed line by line
function beach(ctx, x, y, w, h, t) {
  ctx.fillStyle = C.cream; ctx.fillRect(x, y, w, h);
  const px = 8, hz = y + h * 0.58;
  for (let j = 0; j < (hz - y) / px; j++) for (let i = 0; i < w / px; i++) if ((i + j) % 2 === 0 && j > ((hz - y) / px) * 0.55) { ctx.fillStyle = C.black; ctx.fillRect(x + i * px, y + j * px, px, px); }
  pixCircle(ctx, x + w * 0.68, y + h * 0.36, 54, px, C.black);
  pixCircle(ctx, x + w * 0.68, y + h * 0.36, 40, px, C.cream);
  ctx.fillStyle = C.black; ctx.fillRect(x, hz, w, h - (hz - y));
  for (let r = 0; r < 4; r++) for (let i = 0; i < w / 32; i++) { ctx.fillStyle = C.cream; ctx.fillRect(x + i * 32 + ((r + Math.floor(t * 4)) % 2) * 16, hz + 20 + r * 30, 16, 6); }
  // palm
  const sway = Math.round(Math.sin(t * 2) * 2) * px;
  for (let k = 0; k < 18; k++) { ctx.fillStyle = C.black; ctx.fillRect(x + w * 0.22 + Math.round(Math.sin(k * 0.12) * 3) * px + (k > 12 ? sway / 2 : 0), y + h * 0.88 - k * px * 2, px * 2, px * 2); }
  const top = [x + w * 0.24 + sway, y + h * 0.88 - 36 * px];
  for (const a of [-2.6, -2.0, -1.2, -0.6]) for (let k = 0; k < 9; k++) { ctx.fillStyle = C.black; ctx.fillRect(top[0] + Math.cos(a) * k * px * 1.6, top[1] + Math.sin(a) * k * px * 1.6 + k * k * 0.9, px * 2, px * 2); }
}
function sTravel(ctx, t) {
  win(ctx, t, [60, Y(110), 600, 640], 49.85, 55.2, [900, Y(860)], [900, Y(700)], {}, (x, y, w, h) => {
    const loaded = t < 50.76 ? lerp(0, 0.32, P(t, 50.0, 50.4, E.linear)) : lerp(0.32, 1, prog(t, 50.8, 51.94));
    const lines = step(loaded, 28);
    const ih = h - 160;
    ctx.save(); ctx.beginPath(); ctx.rect(x + 25, y + 25, w - 50, ih * lines); ctx.clip(); beach(ctx, x + 25, y + 25, w - 50, ih, t); ctx.restore();
    if (lines < 1) { ctx.fillStyle = C.black; ctx.fillRect(x + 25, y + 25 + ih * lines, w - 50, 4); }
    bar(ctx, x + 25, y + h - 110, w - 50, 60, loaded, 22);
    if (t > 50.2 && t < 50.76) bmp(ctx, BM.hourglass, x + w / 2, y + 25 + ih * 0.6, 9);
  });
  win(ctx, t, [600, Y(330), 430, 420], 53.2, 55.25, [830, Y(560)], [900, Y(700)], { dark: true }, (x, y, w, h) => {
    const n = Math.round(lerp(7, 21, P(t, 53.45, 53.98, E.inOutSine)));
    const k = n === 21 ? 1 + 0.1 * wobble(t - 53.98, 3, 6) : 1;
    ctx.save(); ctx.translate(x + w / 2, y + 205); ctx.scale(k, k); txt(ctx, `${n}X`, 0, 0, 200, DISPLAY, C.cream, 'center'); ctx.restore();
    bar(ctx, x + 30, y + h - 110, w - 60, 56, n / 21, 21, true);
  });
}

function sEnd(ctx, t, IMG) {
  if (t < 56.75) return;
  win(ctx, t, [150, 330, 780, 720], 56.95, null, [540, 1500], null, {}, (x, y, w, h) => {
    if (IMG.badge) { const s = 520, ar = IMG.badge.height / IMG.badge.width; ctx.drawImage(IMG.badge, x + w / 2 - s / 2, y + 40, s, s * ar); }
    button(ctx, x + w / 2 - 140, y + h - 160, 280, 90, 'PLAY', pressed(t, 57.65));
  });
  // cursor clicks PLAY
  if (t > 57.0) { const k = P(t, 57.05, 57.6, E.inOutCubic); const cx = lerp(980, 560, k), cy = lerp(1500, 1000, k) + Math.sin(Math.PI * k) * 20; ctx.save(); ctx.translate(cx, cy); const pr = pressed(t, 57.65); ctx.scale(pr ? 0.86 : 1, pr ? 0.86 : 1); bmp(ctx, BM.cursor, 0, 0, 5, { center: false }); ctx.restore(); }
  if (t > 57.7) { const k = step(prog(t, 57.7, 58.1), 10); ctx.save(); ctx.beginPath(); ctx.rect(0, 1150, 1080 * k, 200); ctx.clip(); txt(ctx, 'LEARN THE PLAYBOOK.', 540, 1250, 92, DISPLAY, C.cream, 'center'); ctx.restore(); }
  if (t > 58.0) txt(ctx, 'creditcounselelite.com', 540, 1320, 30, UI, C.cream, 'center');
  if (t > 58.2) txt(ctx, 'education and coaching. not a lender. results vary.', 540, 1680, 22, UI, C.cream, 'center');
}

// full-frame accent: a tiny hourglass in the margin that flips every couple of seconds
function accents(ctx, t) {
  for (const [a, b, x] of [[24.4, 32.1, 70], [44.7, 49.4, 1010]]) {
    if (t < a || t > b) continue;
    const k = clamp(sp(t, a, SPRING.bouncy)) * (1 - P(t, b - 0.25, b, E.inBack));
    const flip = step(((t - a) % 2.2) / 0.3, 4) * Math.PI;
    ctx.save(); ctx.translate(x, 1470); ctx.rotate(flip); ctx.scale(k, k); bmp(ctx, BM.hourglass, 0, 0, 6); ctx.restore();
  }
  if ((t > 32.7 && t < 44.4) || (t > 49.9 && t < 55.3)) txt(ctx, 'individual results vary. education only.', 30, Y(36), 20, UI, C.cream);
}

// ------------------------------------------------------------------ layout over time
const FH_KEYS = [[0, 1920], [1.15, SEAM], [24.15, 1920], [32.35, SEAM], [44.55, 1920], [49.55, SEAM], [55.45, 1920], [56.7, 0]];
function footH(t) {
  let v = springKeys(t, FH_KEYS, { stiffness: 150, damping: 17 });
  for (let i = 1; i < FH_KEYS.length; i++) v -= Math.sign(FH_KEYS[i][1] - FH_KEYS[i - 1][1]) * 34 * antic(t, FH_KEYS[i][0], 0.22);
  return clamp(v, 0, DH);
}
const FULL_WINDOWS = [[0, 1.15], [24.15, 32.35], [44.55, 49.55], [55.45, 56.7]];
const CLAIM_FULL = [[24.15, 32.35], [44.55, 49.55]];

// ------------------------------------------------------------------ captions: a little window
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
function captions(ctx, t, fh) {
  if (t > 56.6) return;
  const c = CAPS.find((c) => t >= c.start - 0.04 && t < c.until);
  if (!c) return;
  const f = clamp((fh - SEAM) / (DH - SEAM)), y = lerp(DH - fh, 1600, f);
  ctx.save(); ctx.font = font(54, 700, DISPLAY);
  const w = ctx.measureText(c.text).width + 50;
  ctx.fillStyle = C.black; ctx.fillRect(540 - w / 2 + 10, y - 44 + 10, w, 88); ctx.fillRect(540 - w / 2, y - 44, w, 88);
  ctx.fillStyle = C.cream; ctx.fillRect(540 - w / 2 + 6, y - 38, w - 12, 76);
  ctx.fillStyle = C.black; ctx.textAlign = 'center'; ctx.fillText(c.text, 540, y + 18); ctx.restore();
}

// ------------------------------------------------------------------ textures
let BG, SCAN;
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function buildTextures() {
  BG = makeCanvas(W, H); const p = BG.getContext('2d'), r = mulberry32(5);
  const g = p.createRadialGradient(W / 2, H * 0.25, 60, W / 2, H * 0.3, H * 0.9); g.addColorStop(0, '#0E56C2'); g.addColorStop(1, C.blue2);
  p.fillStyle = g; p.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 3) { p.fillStyle = 'rgba(0,0,30,0.16)'; p.fillRect(0, y, W, 1); }
  for (let i = 0; i < W * H / 60; i++) { p.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.04)'; p.fillRect(r() * W, r() * H, 1, 1); }
  SCAN = makeCanvas(W, 160); const s = SCAN.getContext('2d'); const sg = s.createLinearGradient(0, 0, 0, 160); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.05)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); s.fillStyle = sg; s.fillRect(0, 0, W, 160);
}

// ------------------------------------------------------------------ footage
let FOOT = null; const FCACHE = new Map();
async function loadFrame(t) {
  const idx = Math.min(SRC_FRAMES, Math.max(1, Math.floor(t * SRC_FPS) + 1));
  if (!FCACHE.has(idx)) { const im = new Image(); im.src = `assets/footage/f_${String(idx).padStart(5, '0')}.jpg`; try { await im.decode(); } catch { return; } FCACHE.set(idx, im); while (FCACHE.size > 8) FCACHE.delete(FCACHE.keys().next().value); }
  FOOT = FCACHE.get(idx);
}
function pushIn(t) { for (const [a, b] of FULL_WINDOWS) if (t >= a - 0.5 && t < b + 0.8) return Math.pow(1.1, P(t, a, b + 0.8, E.inOutSine)); return 1; }
const near = (t) => FH_KEYS.some(([k]) => t > k - 0.25 && t < k + 0.8) || CUR.some(([k]) => t > k - 0.6 && t < k + 0.05);

M.film({
  fonts: [font(100, 700, DISPLAY), font(40, 700, UI)],
  images: { badge: 'assets/badge.png' },
  hits: HITS,
  samples: (t) => (near(t) ? 6 : 2),
  async init() { buildTextures(); CAPS = buildCaptions(await fetch('assets/words.json').then((r) => r.json())); },
  prepare: (t) => loadFrame(t),
  draw(ctx, u, t, IMG) {
    const fh = footH(t); FH = fh;
    ctx.drawImage(BG, 0, 0);
    ctx.drawImage(SCAN, 0, ((t * 90) % (H + 160)) - 160);
    ctx.save(); ctx.scale(S, S);
    // slow desktop drift (the canvas breathes)
    ctx.save(); ctx.translate(540, Y(470)); ctx.rotate(0.004 * Math.sin(t * 0.4)); const z = 1 + 0.012 * Math.sin(t * 0.3); ctx.scale(z, z); ctx.translate(-540 + 5 * Math.sin(t * 0.27), -Y(470));
    sTransfer(ctx, t); sCalc(ctx, t); sSlider(ctx, t); sCascade(ctx, t); sTrash(ctx, t); sCards(ctx, t); sTravel(ctx, t);
    drawCursor(ctx, t);
    ctx.restore();
    if (FOOT && fh > 1) {
      cover(ctx, FOOT, 0, DH - fh, DW, fh, { fx: 0.5, fy: lerp(0.25, 0.45, clamp((fh - SEAM) / (DH - SEAM))), zoom: pushIn(t) });
      if (fh < DH - 2) { ctx.fillStyle = C.black; ctx.fillRect(0, DH - fh - 5, DW, 10); }
    }
    sEnd(ctx, t, IMG);
    accents(ctx, t);
    captions(ctx, t, fh);
    if (CLAIM_FULL.some(([a, b]) => t > a + 0.3 && t < b) && fh > 1700) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 6; txt(ctx, 'individual results vary. education only.', 540, 1860, 22, UI, C.cream, 'center'); ctx.restore(); }
    ctx.restore();
  },
});
