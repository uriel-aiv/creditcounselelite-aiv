// CCE — "19 Pixel Wealth" on Video 24 (authorized users) (19 Pixel Wealth engine, see cce-ft19-pixel). Pure function of time.
import * as M from './lib/motion.js';
import * as BR from './lib/brand.js';

const { W, H, E, prog, clamp, lerp, spring, springKeys, SPRING, font, mulberry32, cover, hash01 } = M;
const DW = 1080, DH = 1920, S = W / DW, TAU = M.TAU;
const DISPLAY = 'Display', UI = 'UI';
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 465;
const SEAM = 980, G = 216, PXS = 6, VW = 180;     // art grid, screen size of one art pixel (design px), camera window width (art px)
const P = (t, a, b, ease = E.inOutCubic) => ease(prog(t, a, b));
const antic = (t, t0, dur = 0.2) => { const p = prog(t, t0 - dur, t0 + 0.02); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; };
let FH = DH;
const Y = (y) => (FH >= SEAM ? y - (FH - SEAM) : y + (SEAM - FH) * 0.48);
const r = Math.round;
const OUT = '#170d22';                            // the one outline colour (Habbo-style dark plum)

// ================================================================== pixel buffers -> outlined sprites
function buf(w, h) { return { w, h, d: new Array(w * h).fill(null) }; }
function px(b, x, y, c) { x = r(x); y = r(y); if (x >= 0 && y >= 0 && x < b.w && y < b.h) b.d[y * b.w + x] = c; }
function rect(b, x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(b, x + i, y + j, c); }
function poly(b, pts, c) {   // rasterise a polygon on pixel centres (no anti-aliasing)
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
    let inside = false; const cx = x + 0.5, cy = y + 0.5;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > cy) !== (yj > cy) && cx < ((xj - xi) * (cy - yi)) / (yj - yi) + xi) inside = !inside; }
    if (inside) px(b, x, y, c);
  }
}
function toCanvas(b, outline = true, rim = false) {   // a 1-pixel dark outline around every filled region (+ optional light rim outside it)
  const c = document.createElement('canvas'); c.width = b.w + 2; c.height = b.h + 2; const x = c.getContext('2d');
  const at = (i, j) => (i < 0 || j < 0 || i >= b.w || j >= b.h ? null : b.d[j * b.w + i]);
  for (let j = -1; j <= b.h; j++) for (let i = -1; i <= b.w; i++) {
    const v = at(i, j);
    if (v) { x.fillStyle = v; x.fillRect(i + 1, j + 1, 1, 1); }
    else if (outline && (at(i - 1, j) || at(i + 1, j) || at(i, j - 1) || at(i, j + 1))) { x.fillStyle = OUT; x.fillRect(i + 1, j + 1, 1, 1); }
  }
  if (rim) {   // a soft light rim one pixel outside the outline separates characters from busy furniture behind them
    const d = x.getImageData(0, 0, c.width, c.height), a = (i, j) => (i < 0 || j < 0 || i >= c.width || j >= c.height ? 0 : d.data[(j * c.width + i) * 4 + 3]);
    const C2 = document.createElement('canvas'); C2.width = c.width + 2; C2.height = c.height + 2; const x2 = C2.getContext('2d'); x2.fillStyle = 'rgba(255,255,255,0.42)';
    for (let j = -1; j <= c.height; j++) for (let i = -1; i <= c.width; i++) if (!a(i, j) && (a(i - 1, j) || a(i + 1, j) || a(i, j - 1) || a(i, j + 1))) x2.fillRect(i + 1, j + 1, 1, 1);
    x2.drawImage(c, 1, 1); return C2;
  }
  return c;
}

// ================================================================== the avatar (Habbo-style, facing front-right; mirrored for front-left)
const KB = { skin: '#EDB98C', skinS: '#C98E63', hair: '#22160F', hairH: '#4A3326', suit: '#1F2C72', suitS: '#162058', suitH: '#33459A', shirt: '#F4F1EA', gold: '#F2C14E', goldS: '#B8862B', pants: '#141C4A', shoe: '#101014', shine: '#5A5A66', glass: '#0B0B12', lip: '#8C3B32' };
const K = KB;
// character looks: colour overrides + accessories
const LOOKS = {
  boss: {},
  busboy: { suit: '#F4F1EA', suitS: '#CFCBC0', suitH: '#FFFFFF', shirt: '#F4F1EA', pants: '#2A2A33', glasses: false, chain: false, apron: true, hair: '#3B2A1E', hairH: '#5C4433' },
  dad: { suit: '#5B6E4A', suitS: '#46573A', suitH: '#6E845B', shirt: '#E9E2CF', pants: '#3E3A33', hair: '#B9B9B9', hairH: '#DADADA', glasses: false, chain: false, specs: true, skin: '#E2A97E', skinS: '#B97F57' },
  mom: { suit: '#A8435A', suitS: '#86334A', suitH: '#C2586F', shirt: '#F3E6E9', pants: '#3A2E40', hair: '#C9C2B4', hairH: '#E5DFD3', glasses: false, chain: false, bun: true, skin: '#F0C4A0', skinS: '#C99B76' },
  friend1: { suit: '#2E8C7E', suitS: '#246E63', suitH: '#3AA595', shirt: '#F4F1EA', pants: '#2B3A55', hair: '#5A3418', hairH: '#7B4B26', glasses: false, chain: false, skin: '#C98B5E', skinS: '#A06A42' },
  friend2: { suit: '#E0A43A', suitS: '#B7832A', suitH: '#F0BA55', shirt: '#FFF8E6', pants: '#3A3F6B', hair: '#1A1410', hairH: '#3A2E24', glasses: false, chain: false, bun: true, skin: '#8D5A3B', skinS: '#6E432A' },
};
// pose: legs 0..3 (walk phase), arms: 'down' | 'swing0/1' | 'wave0/1' | 'up' | 'carry' | 'scrub0/1' | 'point'
function avatar(legs = 0, arms = 'down', bob = 0, look = {}) {
  const K = { ...KB, glasses: true, chain: true, ...look };
  const b = buf(34, 46), y0 = bob; const OX = 2;
  const _px = px; const pxo = (bb, x, y, c) => _px(bb, x + OX, y, c);
  // legs + shoes
  const L = [[10, 33, 16, 33], [9, 33, 17, 33], [10, 33, 16, 33], [11, 33, 15, 33]][legs], st = legs === 1 ? [1, -1] : legs === 3 ? [-1, 1] : [0, 0];
  rect(b, L[0], 33 + y0, 4, 8 + st[0], K.pants); rect(b, L[2], 33 + y0, 4, 8 + st[1], K.pants);
  rect(b, L[0] - 1, 41 + y0 + st[0], 5, 2, K.shoe); rect(b, L[2], 41 + y0 + st[1], 5, 2, K.shoe); px(b, L[2] + 3, 41 + y0 + st[1], K.shine);
  // far arm (behind the body)
  const swing = arms === 'swing0' ? -1 : arms === 'swing1' ? 1 : 0;
  if (arms === 'up') { for (let i = 0; i < 10; i++) rect(b, 6 - Math.floor(i / 2.5), 21 + y0 - i, 3, 2, K.suitS); rect(b, 1, 9 + y0, 3, 3, K.skinS); }
  else { rect(b, 6, 22 + y0 + swing, 3, 9, K.suitS); rect(b, 6, 31 + y0 + swing, 3, 2, K.skinS); }
  // torso: blazer, open white shirt, gold chain
  rect(b, 8, 21 + y0, 14, 12, K.suit); rect(b, 8, 21 + y0, 2, 12, K.suitS); rect(b, 20, 22 + y0, 2, 10, K.suitH);
  poly(b, [[12.5, 21 + y0], [18.5, 21 + y0], [15.5, 27 + y0]], K.shirt);
  if (K.chain) { [[12, 22], [13, 23], [14, 24], [15, 25], [16, 24], [17, 23], [18, 22]].forEach(([x, y]) => px(b, x, y + y0, K.gold)); px(b, 15, 26 + y0, K.goldS); }
  if (K.apron) { rect(b, 10, 26 + y0, 10, 12, '#22232B'); rect(b, 10, 26 + y0, 10, 1, '#3A3B46'); rect(b, 12, 28 + y0, 4, 3, '#33343F'); }
  rect(b, 8, 31 + y0, 14, 2, K.suitS); px(b, 15, 31 + y0, K.gold);   // belt + buckle
  // near arm
  if (arms === 'wave0' || arms === 'wave1' || arms === 'up') { const tilt = arms === 'wave1' ? 1.6 : 2.6; for (let i = 0; i < 10; i++) rect(b, 21 + Math.floor(i / tilt), 21 + y0 - i, 3, 2, K.suit); const hx = 21 + Math.floor(9 / tilt); rect(b, hx, 8 + y0, 3, 3, K.skin); px(b, hx + 1, 7 + y0, K.skin); px(b, hx + 3, 9 + y0, K.skin); rect(b, hx, 11 + y0, 3, 1, K.gold); }
  else if (arms === 'scrub0' || arms === 'scrub1') { const dx = arms === 'scrub1' ? 3 : 0; rect(b, 21, 22 + y0, 3, 5, K.suit); rect(b, 23 + dx, 26 + y0, 4, 3, K.suit); rect(b, 26 + dx, 26 + y0, 3, 3, K.skin); rect(b, 25 + dx, 29 + y0, 5, 2, '#F2E9A0'); }
  else if (arms === 'point') { rect(b, 21, 22 + y0, 3, 4, K.suit); rect(b, 23, 25 + y0, 6, 3, K.suit); rect(b, 29, 25 + y0, 3, 3, K.skin); px(b, 31, 28 + y0, K.skin); px(b, 31, 29 + y0, K.skin); }
  else if (arms === 'carry') { rect(b, 21, 22 + y0, 3, 9, K.suit); rect(b, 21, 31 + y0, 3, 2, K.skin); rect(b, 21, 29 + y0, 3, 1, K.gold); }
  else { rect(b, 21, 22 + y0 - swing, 3, 9, K.suit); rect(b, 21, 31 + y0 - swing, 3, 2, K.skin); rect(b, 21, 29 + y0 - swing, 3, 1, K.gold); }
  // neck + head (rounded block), slicked hair, sunglasses, smirk
  rect(b, 13, 19 + y0, 4, 3, K.skinS);
  rect(b, 7, 5 + y0, 16, 15, K.skin); [[7, 5], [22, 5], [7, 19], [22, 19]].forEach(([x, y]) => px(b, x, y + y0, null)); px(b, 8, 19 + y0, null);
  rect(b, 7, 6 + y0, 2, 12, K.skinS); rect(b, 9, 12 + y0, 2, 3, K.skinS);   // shade side + ear
  rect(b, 8, 3 + y0, 15, 4, K.hair); rect(b, 7, 5 + y0, 3, 6, K.hair); rect(b, 9, 2 + y0, 12, 2, K.hair); [[11, 3], [12, 3], [13, 3], [17, 3], [18, 2]].forEach(([x, y]) => px(b, x, y + y0, K.hairH));
  if (K.glasses) {
    for (const lx of [12, 18]) { rect(b, lx, 11 + y0, 5, 2, '#121522'); rect(b, lx + 1, 13 + y0, 3, 1, '#121522'); px(b, lx + 1, 11 + y0, '#A9BDFF'); px(b, lx + 2, 12 + y0, '#5E73C9'); px(b, lx + 4, 12 + y0, '#2A3150'); }
    rect(b, 12, 10 + y0, 11, 1, K.gold); px(b, 17, 11 + y0, K.gold); px(b, 11, 11 + y0, K.goldS); px(b, 10, 11 + y0, K.goldS);
  }
  else { rect(b, 13, 11 + y0, 2, 2, '#1A1420'); rect(b, 19, 11 + y0, 2, 2, '#1A1420'); px(b, 13, 11 + y0, '#FFFFFF'); px(b, 19, 11 + y0, '#FFFFFF'); rect(b, 12, 9 + y0, 3, 1, K.hair); rect(b, 18, 9 + y0, 3, 1, K.hair);
    if (K.specs) { for (const ex of [12, 18]) { rect(b, ex, 10 + y0, 4, 1, '#6B5B4B'); rect(b, ex, 13 + y0, 4, 1, '#6B5B4B'); px(b, ex, 11 + y0, '#6B5B4B'); px(b, ex, 12 + y0, '#6B5B4B'); px(b, ex + 3, 11 + y0, '#6B5B4B'); px(b, ex + 3, 12 + y0, '#6B5B4B'); } px(b, 16, 11 + y0, '#6B5B4B'); px(b, 17, 11 + y0, '#6B5B4B'); } }
  if (K.bun) { rect(b, 6, 6 + y0, 3, 10, K.hair); rect(b, 12, 0 + y0, 6, 3, K.hair); px(b, 13, 0 + y0, K.hairH); }
  px(b, 21, 15 + y0, K.skinS); rect(b, 16, 17 + y0, 4, 1, K.lip); px(b, 20, 16 + y0, K.lip);
  return b;
}
// props
function briefcase() { const b = buf(13, 10); rect(b, 0, 2, 13, 8, '#1C1C26'); rect(b, 0, 2, 13, 1, '#3A3A4C'); rect(b, 4, 0, 5, 1, K.gold); px(b, 4, 1, K.gold); px(b, 8, 1, K.gold); rect(b, 5, 4, 3, 2, K.gold); rect(b, 0, 8, 13, 2, '#121218'); return b; }
function cashBrick() {   // a banded stack of plain green notes, drawn isometric (no symbols)
  const b = buf(16, 10);
  poly(b, [[8, 0], [16, 4], [8, 8], [0, 4]], '#9BD38A');            // top face
  poly(b, [[0, 4], [8, 8], [8, 10], [0, 6]], '#4E9B4A');            // left face
  poly(b, [[8, 8], [16, 4], [16, 6], [8, 10]], '#3B7D3A');          // right face
  poly(b, [[6, 1], [8, 0], [8, 0], [10, 1], [6, 5], [4, 4]], '#E8D27A');   // paper band across the top
  for (const [x, y] of [[8, 3], [9, 4], [7, 4]]) px(b, x, y, '#6FB35E');  // the note's oval
  return b;
}
function goldBar() { const b = buf(12, 7); poly(b, [[3, 0], [9, 0], [12, 3], [0, 3]], K.gold); rect(b, 0, 3, 12, 3, K.goldS); px(b, 5, 1, '#FFF1B8'); px(b, 6, 1, '#FFF1B8'); return b; }
function blackCard() { const b = buf(16, 10); rect(b, 0, 0, 16, 10, '#15151C'); rect(b, 0, 0, 16, 1, '#3B3B4A'); rect(b, 2, 3, 3, 3, K.gold); rect(b, 2, 7, 9, 1, '#55556A'); rect(b, 12, 7, 3, 1, K.gold); return b; }
function statement(lines = 8) { const b = buf(18, 4 + lines * 3); rect(b, 0, 0, 18, 4 + lines * 3, '#FBFAF4'); rect(b, 2, 1, 8, 1, '#1F2C72'); for (let i = 0; i < lines; i++) { rect(b, 2, 4 + i * 3, 9 - (i % 3), 1, '#9AA3BF'); rect(b, 13, 4 + i * 3, 3, 1, '#6C7594'); } return b; }
function plane() { const b = buf(17, 9); rect(b, 1, 4, 15, 3, '#FFFFFF'); poly(b, [[15, 4], [17, 5.5], [15, 7]], '#FFFFFF'); poly(b, [[6, 4], [10, 4], [7, 0], [5, 0]], '#DDE3F2'); poly(b, [[6, 7], [10, 7], [7, 9], [5, 9]], '#DDE3F2'); rect(b, 0, 2, 3, 3, '#DDE3F2'); for (let i = 0; i < 4; i++) px(b, 6 + i * 2, 5, '#5A7BD8'); return b; }
function bubble(w, h) {   // Habbo thought bubble: white rounded box + two puffs
  const b = buf(w, h + 6); rect(b, 2, 0, w - 4, h, '#FFFFFF'); rect(b, 0, 2, w, h - 4, '#FFFFFF'); rect(b, 1, 1, w - 2, h - 2, '#FFFFFF');
  rect(b, 5, h + 1, 3, 2, '#FFFFFF'); px(b, 3, h + 4, '#FFFFFF'); px(b, 4, h + 4, '#FFFFFF'); return b;
}
function gull(f) { const b = buf(9, 4), c = '#FFFFFF'; if (f) { px(b, 0, 2, c); px(b, 1, 1, c); px(b, 2, 1, c); px(b, 3, 2, c); px(b, 4, 3, c); px(b, 5, 2, c); px(b, 6, 1, c); px(b, 7, 1, c); px(b, 8, 2, c); } else { px(b, 0, 0, c); px(b, 1, 1, c); px(b, 2, 2, c); px(b, 3, 2, c); px(b, 4, 3, c); px(b, 5, 2, c); px(b, 6, 2, c); px(b, 7, 1, c); px(b, 8, 0, c); } return b; }
function note(f) { const b = buf(8, 5); rect(b, 0, 0, 8, 5, f ? '#7CC46B' : '#9BD38A'); rect(b, 3, 1, 2, 3, f ? '#4E9B4A' : '#6FB35E'); return b; }
function sparkle(k) { const b = buf(7, 7), c = k < 0.5 ? '#FFFFFF' : '#FFE9A6'; const L = k < 0.33 ? 1 : k < 0.66 ? 3 : 2; for (let i = -L; i <= L; i++) { px(b, 3 + i, 3, c); px(b, 3, 3 + i, c); } return b; }

// ================================================================== pixel font (5x7) for headlines
const FONT = {
  'A': ['01110', '10001', '10001', '11111', '10001', '10001', '10001'], 'B': ['11110', '10001', '10001', '11110', '10001', '10001', '11110'], 'C': ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  'D': ['11110', '10001', '10001', '10001', '10001', '10001', '11110'], 'E': ['11111', '10000', '10000', '11110', '10000', '10000', '11111'], 'F': ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  'G': ['01111', '10000', '10000', '10011', '10001', '10001', '01111'], 'H': ['10001', '10001', '10001', '11111', '10001', '10001', '10001'], 'I': ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  'J': ['00111', '00010', '00010', '00010', '10010', '10010', '01100'], 'K': ['10001', '10010', '10100', '11000', '10100', '10010', '10001'], 'L': ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  'M': ['10001', '11011', '10101', '10101', '10001', '10001', '10001'], 'N': ['10001', '11001', '10101', '10011', '10001', '10001', '10001'], 'O': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  'P': ['11110', '10001', '10001', '11110', '10000', '10000', '10000'], 'Q': ['01110', '10001', '10001', '10001', '10101', '10010', '01101'], 'R': ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  'S': ['01111', '10000', '10000', '01110', '00001', '00001', '11110'], 'T': ['11111', '00100', '00100', '00100', '00100', '00100', '00100'], 'U': ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  'V': ['10001', '10001', '10001', '10001', '10001', '01010', '00100'], 'W': ['10001', '10001', '10001', '10101', '10101', '10101', '01010'], 'X': ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  'Y': ['10001', '10001', '01010', '00100', '00100', '00100', '00100'], 'Z': ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'], '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'], '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'], '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'], '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'], '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'], ',': ['00000', '00000', '00000', '00000', '00000', '00100', '01000'], '.': ['00000', '00000', '00000', '00000', '00000', '00000', '00100'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'], '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'], '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'], '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'], "'": ['00100', '00100', '00000', '00000', '00000', '00000', '00000'],
};
const textW = (s, sc) => s.length * 6 * sc - sc;
function pixText(ctx, s, x, y, sc, col, k = 1) {   // draws onto the pixel canvas; k reveals letters left to right
  const n = Math.ceil(s.length * clamp(k));
  for (let i = 0; i < n; i++) { const g = FONT[s[i]] || FONT[' ']; ctx.fillStyle = col; for (let j = 0; j < 7; j++) for (let q = 0; q < 5; q++) if (g[j][q] === '1') ctx.fillRect(x + (i * 6 + q) * sc, y + j * sc, sc, sc); }
}
// a Habbo-style notice banner: dark navy panel, gold top rule, white pixel text with a dark drop shadow
function banner(ctx, s, cy, sc, t, a, b, col = '#FFFFFF') {   // in at a (pops down + types), out at b (lifts + fades)
  if (t < a || t > b + 0.2) return;
  while (sc > 1 && textW(s, sc) + 10 > VW - 8) sc--;
  const kin = clamp(spring(t - a, { stiffness: 380, damping: 18 })), kout = P(t, b, b + 0.2, E.inCubic);
  const w = textW(s, sc) + 10, h = 7 * sc + 8, x = r((VW - w) / 2), y = r(cy - h / 2 - (1 - kin) * 10 - kout * 8);
  ctx.save(); ctx.globalAlpha = clamp(kin * 3) * (1 - kout);
  ctx.fillStyle = OUT; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#0E1B5C'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#F2C14E'; ctx.fillRect(x, y, r(w * clamp((t - a) / 0.25)), 1); ctx.fillStyle = '#2B3E9E'; ctx.fillRect(x, y + h - 1, w, 1);
  const typed = clamp((t - a) / Math.max(0.12, s.length * 0.025));
  pixText(ctx, s, x + 6, y + 5, sc, OUT, typed); pixText(ctx, s, x + 5, y + 4, sc, col, typed);
  ctx.restore();
}

// ================================================================== sprites (built once)
const SPR = {};
function buildSprites() {
  for (const [ln, lk] of Object.entries(LOOKS)) for (let l = 0; l < 4; l++) for (const a of ['down', 'swing0', 'swing1', 'wave0', 'wave1', 'up', 'carry', 'scrub0', 'scrub1', 'point']) SPR[`${ln === 'boss' ? 'av' : ln}_${l}_${a}`] = toCanvas(avatar(l, a, l === 1 || l === 3 ? -1 : 0, lk));
  SPR.case = toCanvas(briefcase()); SPR.cash = toCanvas(cashBrick()); SPR.bar = toCanvas(goldBar()); SPR.card = toCanvas(blackCard()); SPR.plane = toCanvas(plane());
  buildExtras(); SPR.bubble = toCanvas(bubble(26, 16)); SPR.g0 = toCanvas(gull(0), false); SPR.g1 = toCanvas(gull(1), false); SPR.n0 = toCanvas(note(0)); SPR.n1 = toCanvas(note(1)); for (let i = 0; i < 3; i++) SPR['sp' + i] = toCanvas(sparkle(i / 3 + 0.1), false);
  for (let n = 1; n <= 9; n++) SPR['st' + n] = toCanvas(statement(n));
  // sprite sheet (exported for the team): one row per animation, frames left to right, 3x scale
  const rows = [['WALK', [0, 1, 2, 3].map((l) => `av_${l}_${['down', 'swing0', 'down', 'swing1'][l]}`)], ['WAVE', ['av_0_wave0', 'av_0_wave1']], ['CHEER', ['av_0_up', 'av_1_up']], ['CARRY', ['av_0_carry', 'av_1_carry', 'av_2_carry', 'av_3_carry']], ['PROPS', ['case', 'cash', 'bar', 'card', 'plane', 'bubble']], ['CAST', ['av_0_down', 'busboy_0_down', 'dad_0_down', 'mom_0_down', 'friend1_0_down', 'friend2_0_down']], ['ACTIONS', ['busboy_0_scrub0', 'busboy_0_scrub1', 'av_0_point', 'dad_0_wave0', 'mom_0_carry', 'friend1_1_swing0']]];
  const sc = 3, cw = 36 * sc, ch = 50 * sc, sh = document.createElement('canvas'); sh.width = 6 * cw + 20; sh.height = rows.length * (ch + 10) + 10;
  const x = sh.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#C9D4E8'; x.fillRect(0, 0, sh.width, sh.height);
  rows.forEach(([, keys], j) => keys.forEach((k, i) => { const c = SPR[k]; x.drawImage(c, 10 + i * cw + (cw - c.width * sc) / 2, 10 + j * (ch + 10) + ch - c.height * sc, c.width * sc, c.height * sc); }));
  window.__sheet = sh.toDataURL('image/png');
}
function spr(ctx, name, x, y, flip = false, alpha = 1) {   // x,y = bottom-centre of the sprite on the grid
  const c = SPR[name]; if (!c) return; ctx.save(); ctx.globalAlpha *= alpha;
  if (flip) { ctx.translate(r(x), 0); ctx.scale(-1, 1); ctx.drawImage(c, -Math.floor(c.width / 2), r(y) - c.height); }
  else ctx.drawImage(c, r(x) - Math.floor(c.width / 2), r(y) - c.height);
  ctx.restore();
}
function shadow(ctx, x, y, w = 14) { ctx.fillStyle = 'rgba(10,6,30,0.35)'; ctx.fillRect(r(x - w / 2), r(y - 1), w, 2); ctx.fillRect(r(x - w / 2 + 2), r(y - 2), w - 4, 4); }
// the avatar walking along a path: returns sprite key + position; iso paths move 2 px across for 1 px down
function walker(t, path, speed = 22) {   // path: [[t0, x, y], [t1, x, y], ...] — straight walks between keys, idle otherwise
  let i = 0; while (i < path.length - 1 && t >= path[i + 1][0]) i++;
  const a = path[i], b = path[Math.min(i + 1, path.length - 1)];
  const k = b === a ? 1 : clamp((t - a[0]) / (b[0] - a[0])), moving = k > 0 && k < 1 && (a[1] !== b[1] || a[2] !== b[2]);
  const x = lerp(a[1], b[1], k), y = lerp(a[2], b[2], k), flip = b[1] < a[1];
  const phase = Math.floor(t * 8) % 4;
  return { x, y, moving, legs: moving ? phase : 0, arms: moving ? (phase === 1 ? 'swing0' : phase === 3 ? 'swing1' : 'down') : 'down', flip };
}
let CAMX = null;
function drawAvatar(ctx, w, arms = null, flip = null, who = 'av') {
  shadow(ctx, w.x, w.y);
  spr(ctx, `${who}_${w.legs}_${arms || w.arms}`, w.x, w.y + 1, flip ?? w.flip);
}

// ================================================================== rooms, ambient animation, camera
const BG = {};
// ambient pixel masks, found once from each retraced room: water (cyan/sea), lights (bright warm pixels), gold
const AMB = {};
function buildAmbient() {
  for (const n of ROOMS) {
    const c = document.createElement('canvas'); c.width = G; c.height = G; const x = c.getContext('2d'); x.drawImage(BG[n], 0, 0); const d = x.getImageData(0, 0, G, G).data;
    const water = [], light = [], gold = [];
    for (let y = 0; y < G; y++) for (let q = 0; q < G; q++) {
      const i = (y * G + q) * 4, R = d[i], Gc = d[i + 1], B = d[i + 2];
      if (Gc > 150 && B > 170 && R < 140) water.push([q, y, R, Gc, B]);
      else if (n === 'villa' && B > 110 && R < 70 && Gc < 140 && y < 150) water.push([q, y, R, Gc, B]);
      if (R > 225 && Gc > 200 && B < 170 && (n !== 'penthouse' || y < 95)) light.push([q, y]);
      if (R > 190 && Gc > 140 && Gc < 210 && B < 90) gold.push([q, y]);
    }
    AMB[n] = { water, light, gold };
  }
}
function ambient(ctx, n, t) {
  const A = AMB[n]; if (!A) return;
  const f6 = Math.floor(t * 6), f10 = Math.floor(t * 10);
  // water: a slow palette shimmer moving across the surface
  for (const [x, y, R, Gc, B] of A.water) { const w = Math.sin(x * 0.35 + y * 0.6 - t * 3.2) + 0.6 * Math.sin(x * 0.11 - y * 0.23 + t * 1.7); if (w > 1.15) { ctx.fillStyle = w > 1.45 ? '#FFFFFF' : `rgb(${Math.min(255, R + 70)},${Math.min(255, Gc + 50)},${Math.min(255, B + 30)})`; ctx.fillRect(x, y, 1, 1); } }
  // lights: windows and lamps flicker on and off
  for (const [x, y] of A.light) { const h = hash01(x * 977 + y * 131 + f6 * 7, 3); if (h < 0.06) { ctx.fillStyle = n === 'penthouse' ? '#152a7a' : '#FFF6D8'; ctx.fillRect(x, y, 1, 1); } }
  // gold: glints that travel across gold surfaces
  for (const [x, y] of A.gold) { const g = Math.sin((x + y) * 0.5 - t * 7); if (g > 0.93) { ctx.fillStyle = '#FFF4C4'; ctx.fillRect(x, y, 1, 1); } }
  // a few twinkle sprites on gold / lights
  const src = A.gold.length > 40 ? A.gold : A.light;
  if (src.length) for (let k = 0; k < 3; k++) { const ph = t * 1.6 + k / 3, cyc = Math.floor(ph), fr = ph - cyc, p = src[Math.floor(hash01(cyc * 13 + k, 9 + n.length) * src.length)]; if (fr < 0.6) spr(ctx, 'sp' + Math.min(2, Math.floor(fr / 0.2)), p[0], p[1] + 4); }
}
function flock(ctx, t, y0, dir = 1, n = 3) {   // birds flapping across the sky
  for (let i = 0; i < n; i++) { const x = ((t * 22 * dir + i * 70 + 400) % 300) - 40, y = y0 + i * 7 + Math.sin(t * 2 + i) * 3; spr(ctx, Math.floor(t * 6 + i) % 2 ? 'g0' : 'g1', dir > 0 ? x : G - x, y); }
}
function noteRain(ctx, t, t0, t1, cx) {   // green notes flutter down over a spot
  for (let i = 0; i < 14; i++) { const st = t0 + i * 0.06; if (t < st || t > t1) continue; const d = t - st, x = cx + (hash01(i, 3) - 0.5) * 120 + Math.sin(d * 5 + i) * 8, y = -10 + d * 55 + hash01(i, 4) * 20; spr(ctx, Math.floor(t * 8 + i) % 2 ? 'n0' : 'n1', x, y, false, 1 - P(t, t1 - 0.3, t1)); }
}
function confetti(ctx, t, t0, cx, cy) {   // gold and green pixels burst up and fall
  if (t < t0) return; const d = t - t0; if (d > 1.6) return;
  for (let i = 0; i < 40; i++) { const a = hash01(i, 5) * Math.PI - Math.PI, v = 40 + hash01(i, 6) * 60, x = cx + Math.cos(a) * v * d, y = cy + Math.sin(a) * v * d + 60 * d * d; ctx.fillStyle = ['#F2C14E', '#9BD38A', '#FFFFFF', '#FFE9A6'][i % 4]; ctx.globalAlpha = 1 - P(t, t0 + 1.1, t0 + 1.6); ctx.fillRect(r(x), r(y), (i % 3) ? 1 : 2, 1); }
  ctx.globalAlpha = 1;
}

// ================================================================== extras shared by the pixel films: office boxes, cast drawing, crowds, icons
const ROOM_FILES = ['penthouse', 'vault', 'airfield', 'villa', 'diner', 'city', 'living', 'office'];
FONT['+'] = ['00000', '00100', '00100', '11111', '00100', '00100', '00000'];
FONT['&'] = ['01100', '10010', '10100', '01000', '10101', '10010', '01101'];
const BOX_SEEDS = [[130, 37], [159, 50], [189, 65], [130, 68], [159, 81], [189, 94]];
let BOXPX = null;
function findBoxes() {   // flood-fill the six empty frames on the office wall from seed points
  const c = document.createElement('canvas'); c.width = G; c.height = G; const x = c.getContext('2d'); x.drawImage(BG.office, 0, 0); const d = x.getImageData(0, 0, G, G).data;
  const col = (q, y) => { const i = (y * G + q) * 4; return [d[i], d[i + 1], d[i + 2]]; };
  BOXPX = BOX_SEEDS.map(([sx, sy]) => {
    const c0 = col(sx, sy), seen = new Set([sy * G + sx]), st = [[sx, sy]], out = [];
    while (st.length && out.length < 1400) { const [q, y] = st.pop(); out.push([q, y]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nq = q + dx, ny = y + dy, k = ny * G + nq; if (nq < 0 || ny < 0 || nq >= G || ny >= G || seen.has(k)) continue; const c1 = col(nq, ny); if (Math.abs(c1[0] - c0[0]) + Math.abs(c1[1] - c0[1]) + Math.abs(c1[2] - c0[2]) < 70) { seen.add(k); st.push([nq, ny]); } } }
    return out;
  });
}
function fillBox(ctx, i, k, col, hi) {   // fill box i from the bottom up to fraction k
  const B = BOXPX && BOXPX[i]; if (!B || k <= 0) return; let y0 = 1e9, y1 = -1e9; for (const [, y] of B) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const lim = y1 + 1 - (y1 - y0 + 1) * clamp(k);
  for (const [q, y] of B) if (y >= lim) { ctx.fillStyle = (q + 2 * y) % 9 === 0 ? hi : col; ctx.fillRect(q, y, 1, 1); }
}
function boxCenter(i) { const B = BOXPX[i]; let sx = 0, sy = 0; for (const [q, y] of B) { sx += q; sy += y; } return [sx / B.length, sy / B.length]; }
// draw a cast list sorted by depth (y), so characters pass in front of / behind each other correctly
function cast(ctx, list) { list.filter(Boolean).sort((a, b) => a.w.y - b.w.y).forEach((c) => { if (c.draw) { c.draw(); return; } drawAvatar(ctx, c.w, c.arms || null, c.flip ?? null, c.who); if (c.after) c.after(c.w); }); }
// characters that pop up out of the floor (Habbo "enter room" puff), then idle with a small bob or wave
function popIn(ctx, t, t0, x, y, who, flip = false) {
  if (t < t0) return null; const k = clamp(spring(t - t0, { stiffness: 420, damping: 15 })), d = t - t0;
  if (d < 0.25) for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, rr = 4 + d * 40; ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = 1 - d / 0.25; ctx.fillRect(r(x + Math.cos(a) * rr), r(y - 4 + Math.sin(a) * rr * 0.5), 2, 2); ctx.globalAlpha = 1; }
  return { w: { x, y: y + (1 - k) * 6, legs: 0, arms: 'down', flip }, who, arms: hash01(x * 7 + y, 3) < 0.4 && Math.floor(t * 3 + x) % 4 === 0 ? 'wave0' : 'down' };
}
function iconBubble(ctx, x, y, k, icon, cross = 0) {   // thought bubble with an icon; cross (0..1) draws a red X centred on the icon
  if (k <= 0.01) return; spr(ctx, 'bubble', x, y, false, clamp(k)); icon(x, y - 9);
  if (cross > 0) { ctx.fillStyle = '#D6342B'; for (let i = -6; i <= 6; i++) { if ((i + 6) / 12 > cross) break; ctx.fillRect(x + i - 1, y - 13 + i, 2, 2); ctx.fillRect(x - i - 1, y - 13 + i, 2, 2); } }
}
function book() { const b = buf(12, 9); rect(b, 0, 0, 12, 9, '#1F2C72'); rect(b, 0, 0, 1, 9, '#F2C14E'); rect(b, 3, 2, 7, 1, '#F2C14E'); rect(b, 3, 4, 5, 1, '#9AA3BF'); rect(b, 1, 8, 11, 1, '#F4F1EA'); return b; }
function pin() { const b = buf(7, 10); rect(b, 1, 0, 5, 6, '#F2C14E'); rect(b, 0, 1, 7, 4, '#F2C14E'); rect(b, 2, 2, 3, 2, '#FFF4C4'); rect(b, 2, 6, 3, 2, '#C99A2E'); px(b, 3, 8, '#C99A2E'); px(b, 3, 9, '#C99A2E'); return b; }
function arrowDown() { const b = buf(11, 12); rect(b, 3, 0, 5, 6, '#F2C14E'); poly(b, [[0, 6], [11, 6], [5.5, 12]], '#F2C14E'); return b; }
function wallet() { const b = buf(14, 9); rect(b, 0, 0, 14, 9, '#5A3A22'); rect(b, 0, 0, 14, 2, '#7A5232'); rect(b, 9, 3, 5, 3, '#3E2716'); px(b, 11, 4, '#F2C14E'); return b; }
function cafeTable() {   // a small round-top diner table (two plates, a cup), seen from the iso angle
  const b = buf(24, 20);
  poly(b, [[12, 0], [24, 6], [12, 12], [0, 6]], '#F4E8CF'); poly(b, [[0, 6], [12, 12], [12, 14], [0, 8]], '#C9372C'); poly(b, [[12, 12], [24, 6], [24, 8], [12, 14]], '#A42A22');
  rect(b, 11, 14, 2, 5, '#8A8A92'); rect(b, 8, 18, 8, 2, '#5E5E66');
  for (const [x, y] of [[8, 5], [15, 7]]) { rect(b, x - 2, y - 1, 5, 3, '#FFFFFF'); px(b, x, y, '#B8863E'); px(b, x + 1, y, '#8C5A2B'); }
  rect(b, 12, 2, 2, 2, '#E9E2CF'); px(b, 12, 2, '#6B3A1E');
  return b;
}
function buildExtras() { SPR.ctable = toCanvas(cafeTable()); SPR.book = toCanvas(book()); SPR.pin = toCanvas(pin()); SPR.arrow = toCanvas(arrowDown()); SPR.wallet = toCanvas(wallet()); }

// ================================================================== Video 24 "Authorized users" (16.7 s) //SRC_FRAMES=465
const ROOMS = ['office', 'living'];
const T = { liv: 10.05, off2: 13.0 };
const CUTS = [T.liv, T.off2];
const DISC = [4.1];
const MON = [151, 100];
function scene(t) { return t < T.liv ? 'office' : t < T.off2 ? 'living' : 'office'; }
function cardArc(ctx, t, t0, dur, a, b, lift = 18) { if (t < t0 || t > t0 + dur) return false; const k = E.inOutSine((t - t0) / dur); spr(ctx, 'card', lerp(a[0], b[0], k), lerp(a[1], b[1], k) - Math.sin(Math.PI * k) * lift); return true; }
function drawPixels(ctx, t) {
  ctx.clearRect(0, 0, G, G); HX.clearRect(0, 0, VW, VW);
  const sc = scene(t); ctx.drawImage(BG[sc], 0, 0); ambient(ctx, sc, t);
  if (sc === 'office') {
    // the six boxes of the profile: five fill green one by one, the sixth fills yellow and blinks; at the end it turns green
    for (let i = 0; i < 6; i++) {
      const t0 = i < 5 ? 1.25 + i * 0.11 : 2.5, k = P(t, t0, t0 + 0.28, E.outCubic);
      if (i < 5) fillBox(ctx, i, k, '#3FA55B', '#7FD08F');
      else { fillBox(ctx, i, k, t > 2.8 && t < 5.9 && Math.floor(t * 5) % 2 ? '#F7D870' : '#F2C14E', '#FFE9A6'); if (t > 15.95) fillBox(ctx, i, P(t, 15.95, 16.35, E.outCubic), '#3FA55B', '#7FD08F'); }
      const tf = i < 5 ? t0 + 0.28 : 16.35; if (t > tf && t < tf + 0.36) { const [cx, cy] = boxCenter(i); spr(ctx, 'sp' + Math.min(2, Math.floor((t - tf) / 0.12)), cx, cy + 4); }
    }
    if (t < T.off2 - 0.5) {
      const w = walker(t, [[0.8, 222, 196], [1.95, 95, 150], [7.4, 95, 150], [8.0, 98, 156], [10.2, 98, 156]]);
      const point = t > 3.2 && t < 5.9;
      cast(ctx, [{ w, who: 'friend1', arms: point ? 'point' : null, flip: point ? false : null }]);
      if (t > 8.35) { const k1 = clamp(spring(t - 8.35, { stiffness: 380, damping: 15 })); spr(ctx, 'card', w.x, w.y - 50 + (1 - k1) * 6, false, clamp(k1 * 2));
        for (let j = 0; j < 2; j++) { const tj = 8.75 + j * 0.3; if (t < tj) continue; const kk = P(t, tj, tj + 0.32, E.outBack); spr(ctx, 'card', w.x + lerp(0, j ? 19 : -19, kk), w.y - 50 + lerp(0, 10, kk), false, clamp(kk * 2)); if (t < tj + 0.36) spr(ctx, 'sp' + Math.min(2, Math.floor((t - tj) / 0.12)), w.x + (j ? 26 : -26), w.y - 44); } }
      banner(HX, 'MID-LOW 700S', 22, 2, t, 4.1, 5.9);
      banner(HX, 'AUTHORIZED USERS', 22, 2, t, 8.4, 9.95, '#F2C14E');
    } else {
      const w = walker(t, [[12.95, 222, 204], [13.9, 150, 186], [END + 1, 150, 186]]);
      const got = t > 15.45, cheer = t > 16.35;
      cast(ctx, [{ w, who: 'friend1', arms: cheer ? 'up' : got ? 'carry' : null, flip: cheer || got ? false : null }]);
      for (let j = 0; j < 3; j++) { const tj = 14.4 + j * 0.3; if (t > tj && t < tj + 0.5) { const k = clamp((t - tj) / 0.5), e = E.inOutSine(k); spr(ctx, 'card', lerp(MON[0], w.x + 10, e), lerp(MON[1], w.y - 26, e) - Math.sin(Math.PI * e) * 22); } }
      if (t > 14.3 && t < 15.6) { const g = (Math.floor(t * 8) % 2) ? '#7FE6FF' : '#BFF3FF'; ctx.fillStyle = g; ctx.fillRect(MON[0] - 6, MON[1] - 4, 2, 2); }
      if (cheer) confetti(ctx, t, 16.4, w.x, w.y - 30);
    }
  }
  if (sc === 'living') {
    const dad = { x: 40, y: 176, legs: 0, arms: 'down', flip: false }, mom = { x: 58, y: 190, legs: 0, arms: 'down', flip: false };
    const you = walker(t, [[10.0, 222, 196], [10.85, 150, 182], [END, 150, 182]]);
    const f2 = walker(t, [[12.05, 222, 216], [12.75, 178, 200], [END, 178, 200]]), bs = walker(t, [[12.45, 224, 184], [13.0, 194, 178], [END, 194, 178]]);
    const waveD = t > 10.85 && t < 11.3;
    cast(ctx, [{ w: dad, who: 'dad', arms: waveD ? (Math.floor(t * 7) % 2 ? 'wave0' : 'wave1') : t > 11.3 ? 'down' : 'down' }, { w: mom, who: 'mom', arms: t > 11.0 && t < 11.6 ? 'wave1' : 'down' },
      { w: you, who: 'friend1', arms: t > 11.6 ? 'carry' : null, flip: t > 10.85 ? true : null }, t > 12.05 ? { w: f2, who: 'friend2', flip: t > 12.75 ? true : null } : null, t > 12.45 ? { w: bs, who: 'av' } : null]);
    cardArc(ctx, t, 11.15, 0.45, [50, 150], [144, 156], 24); cardArc(ctx, t, 12.75, 0.3, [172, 172], [152, 156], 10);
    for (const tt of [11.6, 13.05]) if (t > tt && t < tt + 0.36) spr(ctx, 'sp' + Math.min(2, Math.floor((t - tt) / 0.12)), 150, 142);
  }
}
const CAMK = [
  [0.0, 150, 70, 5.2], [0.9, 150, 70, 5.2], [1.3, 152, 68, 5.4], [3.3, 158, 70, 5.5], [5.9, 150, 72, 5.3], [7.3, 118, 95, 5.6], [8.4, 105, 108, 6.2], [10.05, 105, 120, 7.4],
  [10.05, 140, 150, 7.4], [10.8, 108, 150, 5.6], [12.0, 112, 152, 6.0], [12.7, 128, 155, 5.4], [13.0, 150, 160, 7.0],
  [13.0, 160, 140, 7.0], [13.8, 150, 128, 5.8], [15.3, 150, 126, 6.0], [16.2, 160, 118, 5.8], [16.8, 160, 118, 6.0],
];
const END = 16.73; window.__END = END;
const FH_KEYS = [[0, 1920], [0.9, SEAM], [6.0, 1920], [7.3, SEAM], [END, 0]];
const FULL_WINDOWS = [[0, 0.9], [6.0, 7.3]];
function buildHits() {
  const h = [...cutHits(), ...steps(0.85, 1.95), ...steps(7.4, 8.0), ...steps(10.05, 10.85), ...steps(12.1, 13.0, 0.06), ...steps(13.0, 13.9)];
  for (let i = 0; i < 5; i++) h.push([1.25 + i * 0.11 + 0.28, 'box', 'tok', { pitch: ['C5', 'D5', 'E5', 'G5', 'A5'][i], gain: 0.24 }]);
  h.push([2.5, 'yellow', 'boing', { pitch: 'E4', to: 'C4', gain: 0.25 }], [3.3, 'over here', 'click', { gain: 0.3 }], [4.1, '700s', 'pop', { pitch: 'E5', gain: 0.25 }]);
  h.push([8.35, 'card', 'pop', { pitch: 'C6', gain: 0.3 }], [8.75, 'au', 'blip', { pitch: 'E6', gain: 0.22 }], [9.05, 'au', 'blip', { pitch: 'G6', gain: 0.22 }]);
  h.push([10.9, 'wave', 'blip', { pitch: 'E6', gain: 0.18 }], [11.15, 'card throw', 'whoosh', { len: 0.4, from: 900, to: 2400, gain: 0.18 }], [11.6, 'card got', 'click', { gain: 0.35 }]);
  h.push([12.75, 'card throw', 'whoosh', { len: 0.3, from: 900, to: 2400, gain: 0.16 }], [13.05, 'card got', 'click', { gain: 0.3 }]);
  for (let j = 0; j < 3; j++) h.push([14.4 + j * 0.3, 'out of screen', 'blip', { pitch: ['C6', 'E6', 'G6'][j], gain: 0.22 }]);
  h.push([15.45, 'got', 'click', { gain: 0.3 }], [16.35, 'green', 'bell', { pitch: 'E6', gain: 0.3 }]);
  return h.sort((a, b) => a[0] - b[0]);
}
function camAt(t) {
  let i = 0; while (i < CAMK.length - 1 && t >= CAMK[i + 1][0]) i++;
  const a = CAMK[i], b = CAMK[Math.min(i + 1, CAMK.length - 1)], k = b[0] > a[0] ? E.inOutSine(clamp((t - a[0]) / (b[0] - a[0]))) : 1;
  const z = Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), k));
  return { cx: lerp(a[1], b[1], k) + Math.sin(t * 0.7) * 1.5, cy: lerp(a[2], b[2], k) + Math.sin(t * 0.9 + 1) * 1, z };
}
const mosaicAt = (t) => { let m = 0; for (const c of CUTS) m = Math.max(m, 1 - Math.abs(t - c) / 0.16); return clamp(m); };
function footH(t) {
  let v = springKeys(t, FH_KEYS, { stiffness: 150, damping: 17 });
  for (let i = 1; i < FH_KEYS.length; i++) v -= Math.sign(FH_KEYS[i][1] - FH_KEYS[i - 1][1]) * 34 * antic(t, FH_KEYS[i][0], 0.22);
  return clamp(v, 0, DH);
}
const cutHits = () => CUTS.map((c) => [c - 0.12, 'cut', 'whoosh', { len: 0.35, from: 500, to: 2600, gain: 0.22 }]);
const steps = (a, b, g = 0.08) => { const h = []; for (let x = a; x < b; x += 0.125) h.push([x, 'step', 'tick', { gain: g }]); return h; };

// ================================================================== captions
let CAPS = [];
function buildCaptions(words) {
  const fix = [];
  for (let i = 0; i < words.length; i++) {
    let [a, b, w] = words[i]; if (!w || !w.trim()) continue; w = w.replace(/\$/g, '');
    if (w === '1200') w = '1,200';
    if (w === 'turn' && words[i + 1] && /^off/.test(words[i + 1][2])) { w = 'return'; }
    if (/^,\d/.test(w) && fix.length) { fix[fix.length - 1][2] += w; fix[fix.length - 1][1] = b; continue; } fix.push([a, b, w]);
  }
  const chunks = []; let cur = null;
  for (const [a, b, w] of fix) { if (!cur || cur.n >= 3 || /[.,?]$/.test(cur.text) || a - cur.end > 0.35) { cur = { start: a, end: b, text: w, n: 1 }; chunks.push(cur); } else { cur.text += ' ' + w; cur.end = b; cur.n++; } }
  chunks.forEach((c, i) => { c.until = Math.min(chunks[i + 1] ? chunks[i + 1].start : c.end + 0.5, c.end + 0.6); c.text = c.text.replace(/[,]$/, '').toUpperCase(); });
  return chunks;
}

// ================================================================== footage + film
let PXC, PXX, HUD, HX, MOS, MOSX, GRAIN = [];
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
let FOOT = null; const FCACHE = new Map();
async function loadFrame(t) {
  const idx = Math.min(SRC_FRAMES, Math.max(1, Math.floor(t * SRC_FPS) + 1));
  if (!FCACHE.has(idx)) { const im = new Image(); im.src = `assets/footage/f_${String(idx).padStart(5, '0')}.jpg`; try { await im.decode(); } catch { return; } FCACHE.set(idx, im); while (FCACHE.size > 8) FCACHE.delete(FCACHE.keys().next().value); }
  FOOT = FCACHE.get(idx);
}
function pushIn(t) { for (const [a, b] of FULL_WINDOWS) if (t >= a - 0.5 && t < b + 0.8) return Math.pow(1.1, P(t, a, b + 0.8, E.inOutSine)); return 1; }

M.film({
  fonts: [font(96, 400, 'Display'), font(46, 600, 'UI'), font(24, 500, 'UI'), font(40, 800, UI)],
  images: { badge: 'assets/badge.png', ...Object.fromEntries(ROOM_FILES.map((n) => [n, `assets/bg/${n}.png`])) },
  hits: buildHits(),
  samples: 1,   // pixel art: no motion blur, every frame on the grid
  async init(IMG) {
    PXC = makeCanvas(G, G); PXX = PXC.getContext('2d'); PXX.imageSmoothingEnabled = false; HUD = makeCanvas(VW, VW); HX = HUD.getContext('2d'); MOS = makeCanvas(1080, 1920); MOSX = MOS.getContext('2d');
    buildSprites();
    CAPS = buildCaptions(await fetch('assets/words.json').then((r) => r.json()));
    for (let v = 0; v < 4; v++) { const c = makeCanvas(W, H), x = c.getContext('2d'), rr = mulberry32(300 + v), img = x.createImageData(W, H); for (let i = 0; i < img.data.length; i += 4) { const n = rr() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = n; img.data[i + 3] = 255; } x.putImageData(img, 0, 0); GRAIN.push(c); }
  },
  prepare: (t) => loadFrame(t),
  draw(ctx, u, t, IMG) {
    for (const n of ROOM_FILES) if (!BG[n] && IMG[n]) BG[n] = IMG[n];
    if (!AMB.__done && ROOMS.every((n) => BG[n])) { buildAmbient(); if (BG.office) findBoxes(); AMB.__done = 1; }
    const fh = footH(t); FH = fh;
    ctx.fillStyle = '#0A1240'; ctx.fillRect(0, 0, W, H);
    drawPixels(PXX, t);
    ctx.save(); ctx.scale(S, S); ctx.imageSmoothingEnabled = false;
    // camera: a smooth, eased pan/zoom over the art grid (nearest-neighbour, so pixels stay hard-edged)
    const top = fh >= SEAM ? SEAM - fh : 0, ph = Math.max(10, DH - fh - top), cam = camAt(t), zz = Math.max(cam.z, ph / G, DW / G);
    const vw = DW / zz, vh = ph / zz;
    const sx = clamp(cam.cx - vw / 2, 0, G - vw), sy = clamp(cam.cy - vh / 2, -40, G - vh);   // may look above the room: headroom for banners
    const m = mosaicAt(t);
    if (m > 0.02) {   // retro mosaic at the cuts: the frame drops to big blocks and builds back up
      const blk = 1 + m * 26, mw = Math.max(2, Math.round(DW / blk)), mh = Math.max(2, Math.round(ph / blk));
      MOSX.clearRect(0, 0, MOS.width, MOS.height); MOSX.imageSmoothingEnabled = true; MOSX.drawImage(PXC, sx, sy, vw, vh, 0, 0, mw, mh);
      ctx.drawImage(MOS, 0, 0, mw, mh, 0, top, DW, ph);
    } else ctx.drawImage(PXC, sx, sy, vw, vh, 0, top, DW, ph);
    ctx.drawImage(HUD, 0, 0, VW, VW, 0, top, VW * PXS, VW * PXS);
    // compliance line during the claims, on a dark strip so it reads over the pixel room
    const dk = P(t, DISC[0], DISC[0] + 0.25) * (1 - P(t, END - 0.2, END)), dy = fh < SEAM ? 1560 : Y(858);
    if (dk > 0.01) { ctx.globalAlpha = 0.9 * dk; ctx.fillStyle = 'rgba(10,8,30,0.75)'; ctx.fillRect(300, dy - 22, 480, 34); ctx.globalAlpha = dk; ctx.font = font(22, 500, UI); ctx.textAlign = 'center'; ctx.fillStyle = '#FFFFFF'; ctx.fillText('Individual results vary. Education only.', 540, dy); ctx.globalAlpha = 1; }
    if (FOOT && fh > 1) {
      cover(ctx, FOOT, 0, DH - fh, DW, fh, { fx: 0.5, fy: lerp(0.25, 0.45, clamp((fh - SEAM) / (DH - SEAM))), zoom: pushIn(t) });
      if (fh < DH - 2) { ctx.fillStyle = '#F2C14E'; ctx.fillRect(0, DH - fh - 3, DW, 6); ctx.fillStyle = OUT; ctx.fillRect(0, DH - fh + 3, DW, 3); }
    }
    BR.captions(ctx, t, fh, CAPS);
    ctx.restore();
  },
  post(ctx, u, t) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.06; ctx.drawImage(GRAIN[Math.floor(t * 24) % 4], 0, 0); ctx.restore(); },
});
