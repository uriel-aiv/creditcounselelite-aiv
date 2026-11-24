// CCE — "09 Desktop Mind" founder split-screen. Pure function of time: window.seek(t) paints frame t.
// Grid = seconds (u === t). Cut to the speaker's word timings. Motion (a Mac-style desktop) on top, founder below.
// The desktop behaves like the real thing: a pointer that clicks, drags and drops, label highlights,
// marquee selection, Finder window, widgets, a notification banner, Quick Look, duplicates, Finder tags,
// dock magnification. File thumbnails are Nano Banana 2.1 images (assets/files). No Apple marks or app icons.
import * as M from './lib/motion.js';
import * as BR from './lib/brand.js';

const { W, H, E, prog, clamp, lerp, spring, springKeys, SPRING, wobble, font, mulberry32, cover, rrect } = M;

const DW = 1080, DH = 1920, S = W / DW, TAU = M.TAU;
const C = { maroon: '#6B0505', green: '#266235', teal: '#008C96', pbBlue: '#114BA7', gold: '#CB9938', light: '#ADC8E3',  white: '#FFFFFF', ink: '#1D1D1F', grey: '#86868B', sel: '#004AAD', red: '#FF5F57', yel: '#FEBC2E', grn: '#28C840', tagGreen: '#34C759' };
const DISPLAY = 'Display', UI = 'UI';
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 1358;
const SEAM = 980;

const HITS = [
  [1.3, 'icons', 'pop', { pitch: 'C6', gain: 0.25 }],
  [2.0, 'click', 'click', { gain: 0.45 }],
  [4.1, 'drop', 'pop', { pitch: 'E5', gain: 0.5 }],
  [6.15, 'notification', 'bell', { pitch: 'G6', gain: 0.3 }],
  [7.1, 'widget', 'pop', { pitch: 'A5', gain: 0.35 }],
  [9.28, '1', 'tick', { gain: 0.55 }],
  [9.94, '5%', 'pop', { pitch: 'D6', gain: 0.45 }],
  [10.95, 'window', 'whoosh', { len: 0.3, gain: 0.25 }],
  [13.55, 'select', 'tick', { gain: 0.35 }],
  [14.3, '24', 'click', { gain: 0.45 }],
  [16.95, 'double click', 'click', { gain: 0.45 }],
  [17.14, 'tag 18', 'pop', { pitch: 'G5', gain: 0.4 }],
  [19.05, 'file', 'pop', { pitch: 'C6', gain: 0.3 }],
  [20.55, 'you', 'blip', { pitch: 'E6', gain: 0.35 }],
  [20.72, 'spouse', 'blip', { pitch: 'A6', gain: 0.35 }],
  [21.5, 'dup', 'click', { gain: 0.35 }], [21.9, 'dup', 'click', { gain: 0.35 }], [22.3, 'dup', 'click', { gain: 0.35 }], [22.7, 'dup', 'click', { gain: 0.35 }], [23.08, 'dup', 'click', { gain: 0.45 }],
  [32.5, 'icons', 'pop', { pitch: 'C6', gain: 0.25 }],
  [34.45, 'drag', 'whoosh', { len: 0.8, gain: 0.25 }],
  [35.38, 'trash', 'thud+click', { gain: 0.5 }],
  [36.42, '13', 'bell', { pitch: 'D6', gain: 0.35 }],
  [38.54, '10', 'click', { gain: 0.5 }],
  [41.0, 'select all', 'tick', { gain: 0.35 }],
  [43.6, 'tags', 'coins', { gain: 0.35 }],
  [49.95, 'icons', 'pop', { pitch: 'C6', gain: 0.25 }],
  [51.94, 'quick look', 'whoosh', { len: 0.35, from: 600, to: 2200, gain: 0.35 }],
  [53.98, '21x', 'bell', { pitch: 'E6', gain: 0.35 }],
  [56.7, 'to desktop', 'whoosh', { len: 0.5, gain: 0.4 }],
];

// ------------------------------------------------------------------ helpers
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);
const P = (t, a, b, ease = E.inOutCubic) => ease(prog(t, a, b));
const antic = (t, t0, dur = 0.2) => { const p = prog(t, t0 - dur, t0 + 0.02); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; };
const pop = (t, t0) => clamp(sp(t, t0, { stiffness: 340, damping: 22 }));
let FH = DH;
const Y = (y) => y - (FH - SEAM);
function txt(ctx, s, x, y, size, weight, color, align = 'left', alpha = 1) {
  if (alpha <= 0) return; ctx.save(); ctx.globalAlpha *= alpha; ctx.font = font(size, weight, weight >= 700 ? DISPLAY : UI); ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(s, x, y); ctx.restore();
}
function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }
function blit(ctx, c, x, y, s = 1, alpha = 1, rot = 0) {
  if (!c || s <= 0.01 || alpha <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s / S, s / S); ctx.drawImage(c, -c.width / 2, -c.height / 2); ctx.restore();
}
// a baked sprite: draw in design units, with a soft shadow, at render resolution
function bake(w, h, fn, shadow = 18) {
  const pad = shadow * 2 + 8, c = canvas((w + pad * 2) * S, (h + pad * 2) * S), x = c.getContext('2d');
  x.scale(S, S); x.translate(pad, pad);
  x.shadowColor = 'rgba(0,0,0,0.35)'; x.shadowBlur = shadow * S; x.shadowOffsetY = shadow * 0.35 * S;
  fn(x, w, h); return c;
}

// ------------------------------------------------------------------ sprites
const SPR = {}, IMGS = ['card_black', 'card_navy', 'card_gold', 'card_white', 'card_green', 'paperwork', 'folder_docs', 'man', 'woman', 'wing', 'beach', 'pool', 'planner', 'trip_1', 'trip_2', 'trip_3', 'trip_4', 'trip_5', 'trip_6', 'trip_7', 'trip_8', 'trip_9', 'trip_10'];
function thumb(img, size = 170) {
  return bake(size, size, (x, w, h) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.shadowColor = 'transparent'; x.drawImage(img, 4, 4, w - 8, h - 8); });
}
function folderIcon(size = 170, dark = false) {
  return bake(size, size * 0.8, (x, w, h) => {
    const g1 = x.createLinearGradient(0, 0, 0, h); g1.addColorStop(0, dark ? '#4A8FE0' : '#73B4F7'); g1.addColorStop(1, dark ? '#3A7BD0' : '#5DA3F2');
    x.fillStyle = g1; rrect(x, 0, 0, w * 0.42, h * 0.3, 10); x.fill(); rrect(x, 0, h * 0.1, w, h * 0.9, 12); x.fill();
    x.shadowColor = 'transparent';
    const g2 = x.createLinearGradient(0, h * 0.2, 0, h); g2.addColorStop(0, dark ? '#6AA9EE' : '#9ED0FF'); g2.addColorStop(1, dark ? '#4A92E6' : '#74B7FB');
    x.fillStyle = g2; rrect(x, 0, h * 0.24, w, h * 0.76, 12); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(6, h * 0.24 + 4, w - 12, 3);
  }, 12);
}
function docIcon(size = 150) {
  return bake(size * 0.78, size, (x, w, h) => {
    x.fillStyle = '#fff'; x.beginPath(); x.moveTo(0, 0); x.lineTo(w - 36, 0); x.lineTo(w, 36); x.lineTo(w, h); x.lineTo(0, h); x.closePath(); x.fill();
    x.shadowColor = 'transparent'; x.fillStyle = '#E8E8ED'; x.beginPath(); x.moveTo(w - 36, 0); x.lineTo(w - 36, 36); x.lineTo(w, 36); x.closePath(); x.fill();
    x.fillStyle = '#C7C7CC'; for (let i = 0; i < 6; i++) x.fillRect(14, 30 + i * 13, (i % 3 === 2 ? 0.45 : 0.72) * w, 5);
    x.fillStyle = '#6B0505'; rrect(x, 10, h - 46, w - 20, 32, 6); x.fill();
    x.fillStyle = '#fff'; x.font = font(22, 700, DISPLAY); x.textAlign = 'center'; x.fillText('PDF', w / 2, h - 22);
  }, 12);
}
function tile(drawGlyph, bg) {
  return bake(96, 96, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]); x.fillStyle = g; rrect(x, 0, 0, w, h, 22); x.fill(); x.shadowColor = 'transparent'; drawGlyph(x, w, h); }, 10);
}
function buildSprites(IMG) {
  for (const k of IMGS) if (IMG[k]) { SPR[k] = thumb(IMG[k]); SPR[k + '_s'] = thumb(IMG[k], 118); }
  SPR.folder = folderIcon(); SPR.folderHot = folderIcon(170, true); SPR.folderS = folderIcon(92); SPR.folderSHot = folderIcon(92, true);
  SPR.doc = docIcon();
  const line = (x, pts, w = 6, c = '#fff') => { x.strokeStyle = c; x.lineWidth = w; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(...pts[0]); pts.slice(1).forEach((p) => x.lineTo(...p)); x.stroke(); };
  SPR.dock = [
    tile((x) => { x.fillStyle = '#fff'; rrect(x, 20, 30, 56, 40, 6); x.fill(); x.fillRect(20, 26, 22, 10); }, ['#14A9B3', '#008C96']),
    tile((x) => { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(26, 18); x.lineTo(58, 18); x.lineTo(72, 32); x.lineTo(72, 78); x.lineTo(26, 78); x.closePath(); x.fill(); x.fillStyle = '#C7C7CC'; for (let i = 0; i < 4; i++) x.fillRect(34, 40 + i * 9, 28, 4); }, ['#F5F5F7', '#D9D9DE']),
    tile((x) => { x.fillStyle = '#fff'; x.fillRect(18, 22, 60, 50); x.fillStyle = '#7FC6FF'; x.fillRect(22, 26, 52, 42); x.fillStyle = '#2FA24B'; x.beginPath(); x.moveTo(22, 68); x.lineTo(44, 44); x.lineTo(74, 68); x.fill(); x.fillStyle = '#FFD60A'; x.beginPath(); x.arc(62, 38, 6, 0, TAU); x.fill(); }, ['#E0B45A', '#CB9938']),
    tile((x) => { x.fillStyle = '#fff'; rrect(x, 18, 28, 60, 42, 6); x.fill(); line(x, [[20, 31], [48, 52], [76, 31]], 4, '#3A8BF0'); }, ['#2F7D45', '#266235']),
    tile((x) => { x.fillStyle = '#6B0505'; rrect(x, 0, 0, 96, 30, 22); x.fill(); x.fillRect(0, 14, 96, 16); x.fillStyle = '#1D1D1F'; x.font = font(46, 700, DISPLAY); x.textAlign = 'center'; x.fillText('20', 48, 78); }, ['#FFFFFF', '#F0F0F2']),
    tile((x) => { x.strokeStyle = '#fff'; x.lineWidth = 7; x.beginPath(); x.arc(48, 48, 18, 0, TAU); x.stroke(); for (let a = 0; a < 8; a++) { const r = a * TAU / 8; line(x, [[48 + Math.cos(r) * 22, 48 + Math.sin(r) * 22], [48 + Math.cos(r) * 32, 48 + Math.sin(r) * 32]], 9); } }, ['#9A9AA0', '#6E6E73']),
  ];
  SPR.trash = tile((x) => { x.fillStyle = 'rgba(255,255,255,0.9)'; x.beginPath(); x.moveTo(24, 26); x.lineTo(72, 26); x.lineTo(66, 82); x.lineTo(30, 82); x.closePath(); x.fill(); x.strokeStyle = '#A1A1A6'; x.lineWidth = 3; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(34 + i * 9.5, 32); x.lineTo(36 + i * 8.5, 78); x.stroke(); } }, ['rgba(220,220,230,0.55)', 'rgba(190,190,205,0.55)']);
  SPR.trashFull = tile((x) => { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(48, 30, 26, 12, 0, 0, TAU); x.fill(); x.fillStyle = '#E8E8ED'; x.beginPath(); x.ellipse(40, 24, 10, 8, 0.4, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,0.9)'; x.beginPath(); x.moveTo(24, 30); x.lineTo(72, 30); x.lineTo(66, 82); x.lineTo(30, 82); x.closePath(); x.fill(); }, ['rgba(220,220,230,0.55)', 'rgba(190,190,205,0.55)']);
}

// ------------------------------------------------------------------ wallpaper: gradient + CCE badge (built once)
let WALL;
function buildWallpaper(IMG) {
  WALL = canvas(W, H); const x = WALL.getContext('2d'); x.scale(S, S);
  const g = x.createLinearGradient(0, 0, DW, DH); g.addColorStop(0, '#00163A'); g.addColorStop(0.5, '#004AAD'); g.addColorStop(1, '#000000');
  x.fillStyle = g; x.fillRect(0, 0, DW, DH);
  x.filter = `blur(${90 * S}px)`;
  const blob = (cx, cy, rx, ry, rot, col) => { x.save(); x.translate(cx, cy); x.rotate(rot); x.fillStyle = col; x.beginPath(); x.ellipse(0, 0, rx, ry, 0, 0, TAU); x.fill(); x.restore(); };
  blob(260, 360, 620, 260, -0.5, 'rgba(0,74,173,0.95)');
  blob(860, 760, 520, 220, -0.6, 'rgba(41,121,255,0.7)');
  blob(560, 1250, 700, 260, 0.3, 'rgba(0,74,173,0.75)');
  blob(950, 180, 260, 160, -0.3, 'rgba(216,177,90,0.35)');
  blob(120, 1600, 380, 200, 0.4, 'rgba(216,177,90,0.18)');
  x.filter = 'none';
  // fine grain so the gradient doesn't band
  const r = mulberry32(9); for (let i = 0; i < 26000; i++) { x.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.05)'; x.fillRect(r() * DW, r() * DH, 1.5, 1.5); }
}
function wallpaper(ctx, t, IMG) {
  ctx.drawImage(WALL, 0, 0);
  if (!IMG.badge) return;
  const end = P(t, 56.6, 57.2, E.inOutCubic);
  const cy = lerp(Y(610), 700, end), s = lerp(210, 520, end), ar = IMG.badge.height / IMG.badge.width;
  ctx.save(); ctx.scale(S, S); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 40 * S; ctx.shadowOffsetY = 12 * S;
  ctx.drawImage(IMG.badge, 540 - s / 2, cy - s * ar / 2, s, s * ar); ctx.restore();
}

// ------------------------------------------------------------------ chrome: menu bar, dock, labels, windows, widgets
function menuBar(ctx, t, IMG) {
  const y = Math.min(Y(0), 0);
  ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(0, y, DW, 50);
  if (IMG.badge) ctx.drawImage(IMG.badge, 22, y + 9, 42, 42 * IMG.badge.height / IMG.badge.width);
  txt(ctx, 'Finder', 84, y + 34, 26, 700, C.white);
  ['File', 'Edit', 'View', 'Window'].reduce((x0, w) => { txt(ctx, w, x0, y + 34, 25, 500, C.white); return x0 + w.length * 14 + 34; }, 190);
  // status: wifi, battery, search, clock
  ctx.save(); ctx.strokeStyle = C.white; ctx.fillStyle = C.white; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  const wx = 610, wy = y + 36; for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(wx, wy, i * 7, -Math.PI * 0.75, -Math.PI * 0.25); ctx.stroke(); }
  ctx.lineWidth = 2.5; rrect(ctx, 648, y + 16, 42, 20, 5); ctx.stroke(); ctx.fillRect(652, y + 20, 30, 12); ctx.fillRect(692, y + 22, 3, 8);
  ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(724, y + 24, 8, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(730, y + 30); ctx.lineTo(737, y + 37); ctx.stroke();
  ctx.restore();
  txt(ctx, 'Fri Nov 20  9:41', 1060, y + 34, 25, 500, C.white, 'right');
}
const DOCK_Y = 840;
function dock(ctx, t) {
  const [cx, cy] = cursorAt(t); const near = cursorVisible(t) ? clamp(1 - Math.abs(cy - DOCK_Y) / 140) : 0;
  const n = SPR.dock.length + 1, base = 96, gap = 18;
  // magnification: each icon scales with its distance to the pointer
  const xs = []; let total = 0;
  for (let i = 0; i < n; i++) { const x0 = 540 - ((n - 1) * (base + gap)) / 2 + i * (base + gap) + (i === n - 1 ? 20 : 0); const m = 1 + 0.45 * near * Math.exp(-(((cx - x0) / 120) ** 2)); xs.push([x0, m]); total += base * m + gap; }
  const w = total + 50, y = Y(DOCK_Y);
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; rrect(ctx, 540 - w / 2, y - 66, w, 132, 36); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.stroke();
  let x = 540 - total / 2 + 0;
  xs.forEach(([, m], i) => {
    const s = base * m; x += s / 2;
    const isTrash = i === n - 1;
    if (isTrash) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - s / 2 - 20, y - 46, 2, 92); }
    const spr = isTrash ? (t > 35.38 && t < 36.2 ? SPR.trashFull : SPR.trash) : SPR.dock[i];
    const bounce = isTrash ? 14 * Math.max(0, wobble(t - 35.38, 2.5, 5)) * (t > 35.38 ? 1 : 0) : 0;
    blit(ctx, spr, x, y - (s - base) / 2 - bounce, m);
    if (isTrash) DOCK_TRASH = [x, y];
    x += s / 2 + gap;
  });
}
let DOCK_TRASH = [900, DOCK_Y];
function label(ctx, s, x, y, selected, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.font = font(22, 500, UI); const w = ctx.measureText(s).width;
  if (selected) { ctx.fillStyle = C.sel; rrect(ctx, x - w / 2 - 10, y - 22, w + 20, 31, 7); ctx.fill(); ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.fillText(s, x, y); }
  else { ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillText(s, x + 1, y + 2); ctx.fillStyle = C.white; ctx.fillText(s, x, y); }
  ctx.restore();
}
// a desktop item: sprite + label; `sel` draws the macOS selected look (grey box + blue label)
function item(ctx, spr, name, x, y, k, sel = false, alpha = 1, h = 170) {
  if (k <= 0.01) return;
  if (sel) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; rrect(ctx, x - h / 2 - 12, y - h / 2 - 12, h + 24, h + 24, 14); ctx.fill(); }
  blit(ctx, spr, x, y, k, alpha);
  label(ctx, name, x, y + h / 2 + 40, sel, alpha * clamp(k * 1.5 - 0.3));
}
function macWindow(ctx, x, y, w, h, title, k, alpha = 1) {
  if (k <= 0.01 || alpha <= 0.01) return false;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-(x + w / 2), -(y + h / 2));
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 50 * S; ctx.shadowOffsetY = 20 * S;
  ctx.fillStyle = '#FBFBFD'; rrect(ctx, x, y, w, h, 24); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#EDEDF0'; rrect(ctx, x, y, w, 70, 24); ctx.fill(); ctx.fillRect(x, y + 40, w, 30); ctx.fillStyle = '#D9D9DE'; ctx.fillRect(x, y + 70, w, 2);
  [C.red, C.yel, C.grn].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 34 + i * 30, y + 35, 10, 0, TAU); ctx.fill(); });
  txt(ctx, title, x + w / 2, y + 44, 26, 700, '#3A3A3C', 'center');
  return true;
}
function widget(ctx, x, y, w, h, k, alpha = 1) {
  if (k <= 0.01 || alpha <= 0.01) return false;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-(x + w / 2), -(y + h / 2));
  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 40 * S; ctx.shadowOffsetY = 14 * S;
  ctx.fillStyle = 'rgba(250,250,252,0.86)'; rrect(ctx, x, y, w, h, 44); ctx.fill(); ctx.shadowColor = 'transparent';
  return true;
}
const winIn = (t, a) => ({ k: lerp(0.9, 1, P(t, a, a + 0.28, E.outBack)), a: P(t, a, a + 0.18) });
const winOut = (t, b) => ({ k: lerp(1, 0.9, P(t, b, b + 0.22, E.inCubic)), a: 1 - P(t, b, b + 0.22) });

// ------------------------------------------------------------------ pointer: keyed path (local coords), presses, drags
// app layouts (local panel coords)
const CALC = { x: 330, y: 80, w: 420, h: 660 };
const KEYS = [['AC', '±', '%', '÷'], ['7', '8', '9', '×'], ['4', '5', '6', '−'], ['1', '2', '3', '+'], ['0', '', '.', '=']];
function keyAt(lbl) { for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) if (KEYS[r][c] === lbl) return keyPos(r, c); return [0, 0]; }
function keyPos(r, c) { return [CALC.x + 24 + c * 98 + 42 + (r === 4 && c === 0 ? 49 : 0), CALC.y + 230 + r * 84 + 36]; }
const CAL = { x: 60, y: 80, w: 960, h: 690 };
function calTile(m) { const i = m - 1; return [CAL.x + 40 + (i % 6) * 150 + 70, CAL.y + 150 + Math.floor(i / 6) * 128 + 57]; }
const POP = { x: 420, y: 395, w: 380, h: 260 };
const popRow = (n) => [POP.x + 290, POP.y + (n === 1 ? 128 : 198)];
const PH = { x: 50, y: 80, w: 980, h: 690 };
function photoPos(i) { return [PH.x + 230 + (i % 5) * 148 + 70, PH.y + 170 + Math.floor(i / 5) * 148 + 70]; }
const CUR = [
  [1.25, 1000, 700], [1.95, 240, 330], [2.15, 250, 335], [4.1, 800, 330], [4.6, 860, 470], [6.6, 900, 560],
  [7.6, 820, 700], [8.33, ...keyAt('AC')], [9.24, ...keyAt('1')], [9.42, ...keyAt('%')], [9.57, ...keyAt('−')], [9.9, ...keyAt('5')], [10.12, ...keyAt('%')], [10.6, 840, 720],
  [11.6, 900, 740], [13.5, ...calTile(6)], [14.3, ...calTile(24)], [15.6, 960, 760], [16.9, ...calTile(18)], [18.7, ...popRow(1)], [19.88, ...popRow(1)], [20.45, ...popRow(2)], [21.45, 980, 760], [23.8, 990, 770],
  [32.6, 950, 680], [33.55, 90, 80], [34.38, 1000, 600], [34.45, 930, 420], [35.38, 900, 840], [35.9, 900, 760],
  [36.6, 960, 760], [40.4, photoPos(0)[0] - 90, photoPos(0)[1] - 90], [41.0, photoPos(12)[0] + 90, photoPos(12)[1] + 90], [42.6, 980, 760], [44.3, 990, 770],
  [50.1, 900, 650], [51.1, 760, 620], [51.5, 540, 330], [52.9, 860, 640], [54.4, 840, 600], [55.3, 900, 680],
];
const PRESS = [2.0, 2.15, 8.38, 9.28, 9.45, 9.6, 9.94, 10.15, 13.5, 14.3, 16.9, 17.0, 19.9, 20.5, 33.55, 34.45, 40.4, 51.5];
const DRAGS = [[2.15, 4.1], [13.5, 14.3], [33.55, 34.38], [34.45, 35.38], [40.4, 41.0]];
function cursorVisible(t) { return FH < 1500 && t > 1.2 && t < 56.6; }
function cursorAt(t) {
  let i = 0; while (i < CUR.length - 1 && CUR[i + 1][0] <= t) i++;
  if (t <= CUR[0][0]) return [CUR[0][1], CUR[0][2]];
  if (i >= CUR.length - 1) return [CUR[CUR.length - 1][1], CUR[CUR.length - 1][2]];
  const [ta, xa, ya] = CUR[i], [tb, xb, yb] = CUR[i + 1];
  const drag = DRAGS.some(([a, b]) => Math.abs(a - ta) < 0.06 && Math.abs(b - tb) < 0.06);
  const dur = drag ? tb - ta : clamp(Math.hypot(xb - xa, yb - ya) / 1500, 0.25, 0.65);
  const k = P(t, tb - dur, tb, drag ? E.inOutSine : E.inOutCubic);
  return [lerp(xa, xb, k), lerp(ya, yb, k) + Math.sin(Math.PI * k) * (drag ? -24 : 14)];
}
function pointer(ctx, t) {
  if (!cursorVisible(t)) return;
  const [x, y] = cursorAt(t), pr = PRESS.some((p) => t > p - 0.02 && t < p + 0.1);
  ctx.save(); ctx.translate(x, Y(y)); ctx.scale(pr ? 0.88 : 1, pr ? 0.88 : 1);
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 46); ctx.lineTo(11, 36); ctx.lineTo(19, 54); ctx.lineTo(27, 50); ctx.lineTo(19, 33); ctx.lineTo(34, 33); ctx.closePath();
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.beginPath(); ctx.moveTo(4, 8); ctx.lineTo(4, 37); ctx.lineTo(12, 30); ctx.lineTo(20, 47); ctx.lineTo(23, 45.5); ctx.lineTo(15, 29); ctx.lineTo(25, 29); ctx.closePath(); ctx.fillStyle = '#000'; ctx.fill();
  ctx.restore();
}
const held = (t, a, b) => t > a && t < b;

// ------------------------------------------------------------------ scenes
// S1: drag credit_card.jpg into the Bank folder; a notification arrives "tomorrow"
function s1(ctx, t) {
  if (t < 1.2 || t > 7.0) return;
  const out = 1 - P(t, 6.65, 6.95);
  const sel = t > 2.0 && t < 4.1;
  const card = [240, Y(330)], bank = [800, Y(330)];
  if (t < 2.15) item(ctx, SPR.card_black, 'credit_card.jpg', card[0], card[1], pop(t, 1.3), sel);
  else if (t < 4.1) item(ctx, SPR.card_black, 'credit_card.jpg', card[0], card[1], 1, true, 0.45);
  const hot = t > 3.75 && t < 4.15;
  const bounce = t > 4.1 ? 1 + 0.12 * wobble(t - 4.1, 3, 6) : 1;
  item(ctx, hot ? SPR.folderHot : SPR.folder, 'Bank', bank[0], bank[1] + 10, pop(t, 1.4) * bounce * out, false, out, 136);
  // the dragged ghost follows the pointer, then sucks into the folder
  if (t > 2.15 && t < 4.3) {
    const [cx, cy] = cursorAt(Math.min(t, 4.1)); const into = P(t, 4.05, 4.25, E.inCubic);
    blit(ctx, SPR.card_black_s, lerp(cx - 10, bank[0], into), lerp(Y(cy) - 20, bank[1], into), 1 - 0.8 * into, 0.85);
    if (t < 4.05) { ctx.fillStyle = C.tagGreen; ctx.beginPath(); ctx.arc(cx + 46, Y(cy) - 66, 17, 0, TAU); ctx.fill(); txt(ctx, '+', cx + 46, Y(cy) - 56, 30, 700, C.white, 'center'); }
  }
  // notification banner, lands on "day"
  const nIn = P(t, 6.05, 6.45, E.outBack), nOut = P(t, 6.75, 6.98, E.inCubic);
  if (nIn > 0) {
    const x = lerp(1120, 520, nIn) + nOut * 600, y = Y(80);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 30 * S; ctx.shadowOffsetY = 10 * S;
    ctx.fillStyle = 'rgba(246,246,248,0.92)'; rrect(ctx, x, y, 530, 124, 30); ctx.fill(); ctx.restore();
    blit(ctx, SPR.dock[4], x + 62, y + 62, 0.72);
    txt(ctx, 'Transfer', x + 120, y + 52, 26, 700, C.ink); txt(ctx, 'Arrives tomorrow', x + 120, y + 88, 24, 500, '#3A3A3C'); txt(ctx, 'now', x + 505, y + 52, 21, 500, C.grey, 'right');
  }
}
// S2: Calculator — AC on "fee", then 1 % on "one", − 5 % landing on "five"
function s2(ctx, t) {
  if (t < 7.0 || t > 10.95) return;
  const i = winIn(t, 7.05), o = winOut(t, 10.6);
  const { x, w, h } = CALC, y = Y(CALC.y), k = i.k * o.k, a = i.a * o.a;
  if (k <= 0.01 || a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-(x + w / 2), -(y + h / 2));
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 50 * S; ctx.shadowOffsetY = 20 * S;
  ctx.fillStyle = '#1C1C1E'; rrect(ctx, x, y, w, h, 28); ctx.fill(); ctx.shadowColor = 'transparent';
  [C.red, C.yel, C.grn].forEach((c, j) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 32 + j * 28, y + 30, 9, 0, TAU); ctx.fill(); });
  let disp = '0';
  if (t > 9.28) disp = '1'; if (t > 9.45) disp = '1%'; if (t > 9.6) disp = '1% −'; if (t > 9.94) disp = '1% − 5'; if (t > 10.15) disp = '1% − 5%';
  if (t > 8.38 && t < 8.5) disp = '';
  ctx.font = font(120, 500, UI); const dw = ctx.measureText(disp).width; const fs = Math.min(120, 120 * (w - 60) / Math.max(1, dw));
  const bump = t > 9.28 ? 1 + 0.05 * wobble(t - [10.15, 9.94, 9.6, 9.45, 9.28].find((p) => t > p), 3, 7) : 1;
  ctx.save(); ctx.translate(x + w - 30, y + 200); ctx.scale(bump, bump); txt(ctx, disp, 0, 0, fs, 500, C.white, 'right'); ctx.restore();
  const PRESSES = { AC: 8.38, '1': 9.28, '%': [9.45, 10.15], '−': 9.6, '5': 9.94 };
  for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
    const lbl = KEYS[r][c]; if (r === 4 && c === 1) continue;
    const [cx, cy0] = keyPos(r, c), cy = Y(cy0);
    const fn = r === 0 && c < 3, op = c === 3;
    const ts = [].concat(PRESSES[lbl] ?? []);
    const down = ts.some((p) => t > p - 0.02 && t < p + 0.16);
    const kw = r === 4 && c === 0 ? 182 : 84;
    ctx.fillStyle = down ? (op ? '#FFFFFF' : fn ? '#D9D9D9' : '#8E8E93') : (op ? '#CB9938' : fn ? '#A5A5A5' : '#3A3A3C');
    rrect(ctx, cx - kw / 2, cy - 36, kw, 72, 36); ctx.fill();
    txt(ctx, lbl, cx, cy + 13, 36, 500, down && op ? '#CB9938' : fn ? '#1C1C1E' : C.white, 'center');
  }
  ctx.restore();
}
// S3+S4: Calendar, year view of 2027–2028. Drag-select months 6..24 (lands on "24"); 18 gets today's red circle and a popover;
// the popover becomes a new event: Repeat "Every 6 Months" on "six", invitees on "per person"; repeats land month by month, last on "again"
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function s3(ctx, t) {
  if (t < 10.9 || t > 24.2) return;
  const i = winIn(t, 10.95), o = winOut(t, 23.9);
  const { x, w, h } = CAL, y = Y(CAL.y);
  if (!macWindow(ctx, x, y, w, h, '', i.k * o.k, i.a * o.a)) return;
  // segmented control: Day Week Month Year
  const seg = ['Day', 'Week', 'Month', 'Year'], sx = x + w / 2 - 210;
  ctx.fillStyle = '#E3E3E8'; rrect(ctx, sx, y + 16, 420, 40, 10); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; rrect(ctx, sx + 316, y + 19, 101, 34, 8); ctx.fill();
  seg.forEach((s, j) => txt(ctx, s, sx + 52 + j * 105, y + 44, 21, 500, '#3A3A3C', 'center'));
  txt(ctx, '2027 – 2028', x + 40, y + 128, 40, 700, C.ink);
  const lit = t < 13.5 ? 0 : Math.round(lerp(6, 24, P(t, 13.5, 14.3, E.inOutSine)));
  const span = clamp(1 - P(t, 21.2, 21.5));
  const repeats = [[6, 21.5], [12, 21.9], [18, 22.3], [24, 22.7]];
  for (let m = 1; m <= 24; m++) {
    const [cx, cy0] = calTile(m), cy = Y(cy0), k = pop(t, 11.05 + m * 0.012);
    if (k <= 0.01) continue;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
    const inRange = t > 13.5 && m >= 6 && m <= lit;
    if (inRange && span > 0) { ctx.fillStyle = `rgba(0,74,173,${0.14 * span})`; rrect(ctx, -70, -57, 140, 114, 12); ctx.fill(); }
    const flash = t > 23.08 ? Math.exp(-(t - 23.08) * 3) : 0;
    if (repeats.some(([rm]) => rm === m) && flash > 0) { ctx.fillStyle = `rgba(0,74,173,${0.25 * flash})`; rrect(ctx, -70, -57, 140, 114, 12); ctx.fill(); }
    txt(ctx, MON[(m - 1) % 12], -58, -30, 21, 700, (m - 1) % 12 === 0 ? C.maroon : C.ink);
    if ((m - 1) % 12 === 0) txt(ctx, m === 1 ? '2027' : '2028', 58, -30, 17, 500, C.grey, 'right');
    ctx.fillStyle = '#C7C7CC'; for (let d = 0; d < 35; d++) { if ((d + m * 3) % 37 > 30) continue; ctx.beginPath(); ctx.arc(-54 + (d % 7) * 18, -8 + Math.floor(d / 7) * 13, 2.6, 0, TAU); ctx.fill(); }
    // today circle on 18
    if (m === 18 && t > 16.95) { const kc = clamp(sp(t, 16.95, SPRING.bouncy)); ctx.fillStyle = '#004AAD'; ctx.beginPath(); ctx.arc(-4, 18, 15 * kc, 0, TAU); ctx.fill(); }
    // repeating event pill
    const rp = repeats.find(([rm]) => rm === m);
    if (rp && t > rp[1]) { const kp = clamp(sp(t, rp[1], SPRING.bouncy)); ctx.save(); ctx.scale(kp, kp); ctx.fillStyle = [C.sel, C.teal, C.green, C.maroon][Math.floor(m / 6) % 4]; rrect(ctx, -62, 34, 124, 22, 6); ctx.fill(); txt(ctx, 'Playbook', 0, 51, 15, 700, C.white, 'center'); ctx.restore(); }
    ctx.restore();
  }
  // popover: "Average" -> new event (repeat, invitees)
  const pin = clamp(sp(t, 17.05, { stiffness: 380, damping: 22 })), pout = P(t, 21.25, 21.45, E.inCubic);
  if (t > 17.0 && pout < 1) {
    const k = pin * (1 - pout), px = POP.x, py = Y(POP.y);
    ctx.save(); ctx.globalAlpha *= k; ctx.translate(px + POP.w, py + 120); ctx.scale(lerp(0.9, 1, k), lerp(0.9, 1, k)); ctx.translate(-(px + POP.w), -(py + 120));
    ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 40 * S; ctx.shadowOffsetY = 12 * S;
    ctx.fillStyle = 'rgba(248,248,250,0.97)'; rrect(ctx, px, py, POP.w, POP.h, 18); ctx.fill();
    ctx.beginPath(); ctx.moveTo(px + POP.w, py + 106); ctx.lineTo(px + POP.w + 20, py + 120); ctx.lineTo(px + POP.w, py + 134); ctx.fill(); ctx.shadowColor = 'transparent';
    const ed = P(t, 18.45, 18.75);
    if (ed < 1) { ctx.save(); ctx.globalAlpha *= 1 - ed; txt(ctx, 'Average', px + 28, py + 70, 34, 700, C.ink); txt(ctx, '18 months', px + 28, py + 112, 26, 500, C.grey); ctx.restore(); }
    if (ed > 0) {
      ctx.save(); ctx.globalAlpha *= ed;
      txt(ctx, 'Playbook round', px + 28, py + 62, 30, 700, C.ink);
      ctx.fillStyle = '#E5E5EA'; ctx.fillRect(px + 20, py + 88, POP.w - 40, 2);
      txt(ctx, 'Repeat', px + 28, py + 137, 23, 500, C.grey);
      const six = t > 19.9, hl = six ? Math.exp(-(t - 19.9) * 2.5) : 0;
      ctx.fillStyle = six ? `rgba(0,74,173,${0.12 + 0.6 * hl})` : '#ECECF0'; rrect(ctx, px + 150, py + 108, 205, 40, 9); ctx.fill();
      txt(ctx, six ? 'Every 6 Months' : 'Never', px + 252, py + 136, 21, 700, six ? C.sel : C.ink, 'center');
      txt(ctx, 'Invitees', px + 28, py + 207, 23, 500, C.grey);
      [['man', 20.55], ['woman', 20.72]].forEach(([n, td], j) => {
        const ka = clamp(sp(t, td, SPRING.bouncy)); if (ka <= 0 || !IMGR[n]) return;
        const ax = px + 185 + j * 62, ay = py + 198;
        ctx.save(); ctx.translate(ax, ay); ctx.scale(ka, ka); ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.clip(); ctx.drawImage(IMGR[n], -40, -30, 80, 80); ctx.restore();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ax, ay, 26 * ka, 0, TAU); ctx.stroke();
      });
      ctx.restore();
    }
    ctx.restore();
  }
  ctx.restore();
}
function s4() {}
// S5: paperwork on the desktop; marquee-select all on "without", drag to the Trash, landing on "documentation"
const DOCS5 = [['paperwork.jpg', 'paperwork', 180, 210], ['documents.jpg', 'folder_docs', 420, 210], ['pay_stubs.pdf', 'doc', 660, 210], ['tax_return.pdf', 'doc', 880, 210], ['bank_statements.pdf', 'doc', 300, 470], ['w2_forms.pdf', 'doc', 560, 470]];
function s5(ctx, t) {
  if (t < 32.4 || t > 36.1) return;
  const selAll = t > 33.9;
  DOCS5.forEach(([n, s, x, y0], i) => {
    const k = pop(t, 32.5 + i * 0.05);
    if (t < 34.45) item(ctx, SPR[s], n, x, Y(y0), k, selAll && t > 33.75 + i * 0.07, 1, 160);
    else if (t < 35.4) {
      // the selection travels with the pointer as a fanned stack, then drops into the trash
      const [cx, cy] = cursorAt(t); const into = P(t, 35.2, 35.4, E.inCubic);
      const sx = lerp(x, cx - 20 + i * 8, P(t, 34.45, 34.75, E.outCubic)), sy = lerp(Y(y0), Y(cy) - 40 - i * 6, P(t, 34.45, 34.75, E.outCubic));
      blit(ctx, SPR[s], lerp(sx, DOCK_TRASH[0], into), lerp(sy, DOCK_TRASH[1], into), (0.55 - 0.03 * i) * (1 - 0.8 * into), 0.9, (i - 2.5) * 0.06);
    }
  });
  if (t > 34.5 && t < 35.3) { const [cx, cy] = cursorAt(t); ctx.fillStyle = '#FF3B30'; ctx.beginPath(); ctx.arc(cx + 50, Y(cy) - 70, 20, 0, TAU); ctx.fill(); txt(ctx, '6', cx + 50, Y(cy) - 61, 26, 700, C.white, 'center'); }
  if (t > 33.55 && t < 34.4) { const [cx, cy] = cursorAt(t); const x0 = 90, y0 = Y(80); ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x0, y0, cx - x0, Y(cy) - y0); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, cx - x0, Y(cy) - y0); }
}
// S6: a Photos-style library of 13 card photos; the day range counts to 10; select all; every photo gets a favourite heart on "bonus for each"
const CARDS = ['card_black', 'card_navy', 'card_gold', 'card_white', 'card_green'];
function heart(ctx, x, y, r, fill) {
  ctx.beginPath(); ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.7, y - r * 1.1, x, y - r * 0.35);
  ctx.bezierCurveTo(x + r * 0.7, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.9);
  ctx.fillStyle = fill; ctx.fill();
}
function s6(ctx, t) {
  if (t < 35.8 || t > 44.7) return;
  const i0 = winIn(t, 35.85), o = winOut(t, 44.35);
  const { x, w, h } = PH, y = Y(PH.y);
  if (!macWindow(ctx, x, y, w, h, '', i0.k * o.k, i0.a * o.a)) return;
  ctx.fillStyle = '#F2F2F5'; ctx.fillRect(x, y + 72, 200, h - 96);
  [['Library', true], ['Favorites', false], ['Recents', false], ['Albums', false]].forEach(([s, on], j) => {
    if (on) { ctx.fillStyle = '#DCDCE2'; rrect(ctx, x + 12, y + 96 + j * 52, 176, 42, 9); ctx.fill(); }
    txt(ctx, s, x + 30, y + 124 + j * 52, 22, on ? 700 : 500, '#3A3A3C');
  });
  const landed = Math.min(13, Math.max(0, Math.floor(prog(t, 35.98, 36.44) * 13.99)));
  const days = Math.min(10, Math.max(1, Math.floor(prog(t, 37.95, 38.54) * 10) + 1));
  const kd = days === 10 ? 1 + 0.06 * wobble(t - 38.54, 3, 6) : 1;
  ctx.save(); ctx.translate(x + 230, y + 135); ctx.scale(kd, kd); txt(ctx, `Nov 1 – ${days}`, 0, 0, 40, 700, C.ink); ctx.restore();
  txt(ctx, `${landed} Photos`, x + w - 40, y + 133, 24, 500, C.grey, 'right');
  const sel = t > 40.6 && t < 43.4;
  for (let j = 0; j < 13; j++) {
    const [cx, cy0] = photoPos(j), cy = Y(cy0), k = pop(t, 36.0 + j * 0.033);
    if (k <= 0.01) continue;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
    const img = IMGR[CARDS[j % 5]];
    if (img) { ctx.save(); rrect(ctx, -70, -70, 140, 140, 6); ctx.clip(); const z = 1.15 + 0.1 * ((j * 7) % 3); ctx.drawImage(img, -70 * z, -70 * z, 140 * z, 140 * z); ctx.restore(); }
    if (sel && t > 40.6 + j * 0.02) { ctx.strokeStyle = C.sel; ctx.lineWidth = 6; rrect(ctx, -70, -70, 140, 140, 6); ctx.stroke(); ctx.fillStyle = C.sel; ctx.beginPath(); ctx.arc(52, 52, 13, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(45, 52); ctx.lineTo(50, 57); ctx.lineTo(59, 46); ctx.stroke(); }
    const kh = clamp(sp(t, 43.58 + j * 0.056, SPRING.bouncy));
    if (kh > 0) { ctx.save(); ctx.translate(-48, 48); ctx.scale(kh, kh); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 6; heart(ctx, 0, 0, 14, '#FFFFFF'); ctx.restore(); }
    ctx.restore();
  }
  if (t > 40.4 && t < 41.05) { const [cx, cy] = cursorAt(t); const x0 = photoPos(0)[0] - 90, y0 = Y(photoPos(0)[1] - 90); ctx.fillStyle = 'rgba(0,74,173,0.12)'; ctx.fillRect(x0, y0, cx - x0, Y(cy) - y0); ctx.strokeStyle = 'rgba(0,74,173,0.7)'; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, cx - x0, Y(cy) - y0); }
  ctx.restore();
}
// S7: travel photos; beach.jpg opens in Quick Look on "travel"; then a Finder "Trips" folder fills: 7 photos on "seven", 21 on "twenty-one"
const TRIPS = ['wing', 'beach', 'pool', 'trip_1', 'trip_2', 'trip_3', 'trip_4', 'trip_5', 'trip_6', 'trip_7', 'trip_8', 'trip_9', 'trip_10'];
const TR = { x: 60, y: 110, w: 960, h: 640 };
function tripPos(i) { return [TR.x + 80 + (i % 7) * 133, TR.y + 150 + Math.floor(i / 7) * 160]; }
function s7(ctx, t) {
  if (t < 49.7 || t > 55.6) return;
  const out = 1 - P(t, 55.2, 55.5);
  const files = [['wing.jpg', 'wing', 240, 250], ['beach.jpg', 'beach', 540, 250], ['pool.jpg', 'pool', 840, 250]];
  const ql = P(t, 51.94, 52.3, E.outCubic), qlOut = P(t, 52.95, 53.15, E.inCubic);
  const desk = 1 - P(t, 53.0, 53.2);
  files.forEach(([n, s, x, y], i) => item(ctx, SPR[s], n, x, Y(y), pop(t, 49.95 + i * 0.06) * desk, i === 1 && t > 51.5, desk * (i === 1 && ql > 0 && qlOut < 1 ? 0.35 : 1)));
  if (ql > 0 && qlOut < 1) {
    const k = ql * (1 - qlOut), x0 = 540, y0 = Y(250);
    const w = lerp(170, 600, k), h = lerp(170, 600, k), cx = lerp(x0, 540, k), cy = lerp(y0, Y(400), k);
    ctx.save(); ctx.globalAlpha = clamp(k * 3);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 50 * S; ctx.shadowOffsetY = 18 * S;
    ctx.fillStyle = 'rgba(40,40,44,0.92)'; rrect(ctx, cx - w / 2, cy - h / 2 - 54 * k, w, h + 54 * k, 22); ctx.fill(); ctx.shadowColor = 'transparent';
    if (IMGR.beach) { ctx.save(); rrect(ctx, cx - w / 2, cy - h / 2, w, h, 4); ctx.clip(); ctx.drawImage(IMGR.beach, cx - w / 2, cy - h / 2, w, h); ctx.restore(); }
    txt(ctx, 'beach.jpg', cx, cy - h / 2 - 17 * k, 24 * k, 700, '#E5E5EA', 'center');
    ctx.restore();
  }
  // Finder "Trips": photos land one row on "seven", the rest by "twenty-one"; the status bar counts
  const i0 = winIn(t, 53.05), o = winOut(t, 55.15);
  const x = TR.x, y = Y(TR.y);
  if (t > 53.0 && macWindow(ctx, x, y, TR.w, TR.h, 'Trips', i0.k * o.k, i0.a * o.a)) {
    let n = 0;
    for (let j = 0; j < 21; j++) {
      const td = j < 7 ? 53.28 + j * 0.03 : 53.55 + (j - 7) * 0.031;
      const k = pop(t, td); if (k <= 0.01) continue; n++;
      const [px, py0] = tripPos(j), py = Y(py0);
      blit(ctx, SPR[TRIPS[j % TRIPS.length] + '_s'], px, py, k * 0.92);
      ctx.save(); ctx.globalAlpha *= clamp(k); txt(ctx, `IMG_${String(4410 + j * 7)}.HEIC`, px, py + 78, 15, 500, '#3A3A3C', 'center'); ctx.restore();
    }
    const kc = n === 21 ? 1 + 0.08 * wobble(t - 53.98, 3, 6) : 1;
    ctx.fillStyle = '#F2F2F5'; ctx.fillRect(x, y + TR.h - 52, TR.w, 52 - 4);
    ctx.save(); ctx.translate(x + TR.w / 2, y + TR.h - 16); ctx.scale(kc, kc); txt(ctx, `${n} items`, 0, 0, 23, 700, '#3A3A3C', 'center'); ctx.restore();
    ctx.restore();
  }
}
function endCard(ctx, t) {
  if (t < 56.9) return;
  const a = P(t, 57.2, 57.6);
  txt(ctx, 'Learn the playbook.', 540, 1080, 78, 700, C.white, 'center', a);
  txt(ctx, 'creditcounselelite.com', 540, 1150, 34, 500, 'rgba(255,255,255,0.8)', 'center', P(t, 57.6, 58.0));
  txt(ctx, 'Education and coaching. Not a lender. Individual results vary.', 540, 1640, 22, 500, 'rgba(255,255,255,0.6)', 'center', P(t, 57.9, 58.3));
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

// ------------------------------------------------------------------ captions: system HUD pill
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
function captionsOld(ctx, t, fh) {
  if (t > 56.6) return;
  const c = CAPS.find((c) => t >= c.start - 0.04 && t < c.until);
  if (!c) return;
  const f = clamp((fh - SEAM) / (DH - SEAM)), y = lerp(DH - fh, 1600, f);
  ctx.save(); ctx.font = font(50, 700, DISPLAY);
  const w = ctx.measureText(c.text).width + 56;
  ctx.fillStyle = 'rgba(28,28,30,0.82)'; rrect(ctx, 540 - w / 2, y - 42, w, 84, 42); ctx.fill();
  ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.fillText(c.text, 540, y + 17); ctx.restore();
}

// ------------------------------------------------------------------ footage
let FOOT = null; const FCACHE = new Map(); let IMGR = {};
async function loadFrame(t) {
  const idx = Math.min(SRC_FRAMES, Math.max(1, Math.floor(t * SRC_FPS) + 1));
  if (!FCACHE.has(idx)) { const im = new Image(); im.src = `assets/footage/f_${String(idx).padStart(5, '0')}.jpg`; try { await im.decode(); } catch { return; } FCACHE.set(idx, im); while (FCACHE.size > 8) FCACHE.delete(FCACHE.keys().next().value); }
  FOOT = FCACHE.get(idx);
}
function pushIn(t) { for (const [a, b] of FULL_WINDOWS) if (t >= a - 0.5 && t < b + 0.8) return Math.pow(1.1, P(t, a, b + 0.8, E.inOutSine)); return 1; }
const near = (t) => FH_KEYS.some(([k]) => t > k - 0.25 && t < k + 0.8) || CUR.some(([k]) => t > k - 0.65 && t < k + 0.05) || (t > 51.9 && t < 52.4);

M.film({
  fonts: [font(96, 400, 'Display'), font(46, 600, 'UI'), font(34, 500, 'UI'), font(100, 700, DISPLAY), font(40, 500, UI)],
  images: Object.fromEntries([['badge', 'assets/badge.png'], ...IMGS.map((k) => [k, `assets/files/${k}.jpg`])]),
  hits: HITS,
  samples: (t) => (near(t) ? 6 : 2),
  async init(ctx, IMG) { IMGR = IMG; buildWallpaper(IMG); buildSprites(IMG); CAPS = buildCaptions(await fetch('assets/words.json').then((r) => r.json())); },
  prepare: (t) => loadFrame(t),
  draw(ctx, u, t, IMG) {
    const fh = footH(t); FH = fh;
    wallpaper(ctx, t, IMG);
    ctx.save(); ctx.scale(S, S);
    menuBar(ctx, t, IMG);
    s1(ctx, t); s2(ctx, t); s3(ctx, t); s4(ctx, t); s5(ctx, t); s6(ctx, t); s7(ctx, t);
    dock(ctx, t);
    pointer(ctx, t);
    if (FOOT && fh > 1) {
      cover(ctx, FOOT, 0, DH - fh, DW, fh, { fx: 0.5, fy: lerp(0.25, 0.45, clamp((fh - SEAM) / (DH - SEAM))), zoom: pushIn(t) });
      if (fh < DH - 2) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, DH - fh - 2, DW, 4); }
    }
    endCard(ctx, t);
    captions(ctx, t, fh);
    if (CLAIM_FULL.some(([a, b]) => t > a + 0.3 && t < b) && fh > 1700) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 6; txt(ctx, 'Individual results vary. Education only.', 540, 1860, 22, 500, C.white, 'center'); ctx.restore(); }
    if ((t > 32.7 && t < 44.4) || (t > 49.9 && t < 55.3)) txt(ctx, 'Individual results vary. Education only.', 1060, Y(78), 18, 500, 'rgba(255,255,255,0.65)', 'right');
    ctx.restore();
  },
});

// brand captions (black overlay, Poppins) — CCE Brand Style Guidelines 2025
function captions(ctx, t, fh) { BR.captions(ctx, t, fh, CAPS); }
