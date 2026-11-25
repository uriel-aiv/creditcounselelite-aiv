// CCE — "19 Pixel Wealth" founder split-screen. Pure function of time: window.seek(t) paints frame t.
// Style: Habbo-style isometric pixel art of an ultra-wealthy life. Rooms were generated (GPT Image 2.6) and retraced
// onto a true 216x216 pixel grid (tools: pxtools/retrace.py); every character, prop, headline and transition is
// drawn in code on that same grid, so it animates frame-exactly and stays crisp (5x5 screen pixels per art pixel).
// Clip: Video 3 "Sign-up bonuses" (1,200 / walked away with 15,600 free cash / statement credit / travel / 7 to 21x).
import * as M from './lib/motion.js';
import * as BR from './lib/brand.js';

const { W, H, E, prog, clamp, lerp, spring, springKeys, SPRING, font, mulberry32, cover, hash01 } = M;
const DW = 1080, DH = 1920, S = W / DW, TAU = M.TAU;
const DISPLAY = 'Display', UI = 'UI';
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 478;
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
  sc = 1; cy = Math.min(cy, 12);   // headlines always 1x, high in the frame
  while (sc > 1 && textW(s, sc) + 10 > VW - 8) sc--;
  const kin = clamp(spring(t - a, { stiffness: 380, damping: 18 })), kout = P(t, b, b + 0.2, E.inCubic);
  const w = textW(s, sc) + 8, h = 7 * sc + 6, x = r((VW - w) / 2), y = r(cy - h / 2 - (1 - kin) * 10 - kout * 8);
  ctx.save(); ctx.globalAlpha = clamp(kin * 3) * (1 - kout);
  ctx.fillStyle = OUT; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#0E1B5C'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#F2C14E'; ctx.fillRect(x, y, r(w * clamp((t - a) / 0.25)), 1); ctx.fillStyle = '#2B3E9E'; ctx.fillRect(x, y + h - 1, w, 1);
  const typed = clamp((t - a) / Math.max(0.12, s.length * 0.025));
  pixText(ctx, s, x + 5, y + 4, sc, OUT, typed); pixText(ctx, s, x + 4, y + 3, sc, col, typed);
  ctx.restore();
}

// ================================================================== sprites (built once)
const SPR = {};
function buildSprites() {
  for (const [ln, lk] of Object.entries(LOOKS)) for (let l = 0; l < 4; l++) for (const a of ['down', 'swing0', 'swing1', 'wave0', 'wave1', 'up', 'carry', 'scrub0', 'scrub1', 'point']) SPR[`${ln === 'boss' ? 'av' : ln}_${l}_${a}`] = toCanvas(avatar(l, a, l === 1 || l === 3 ? -1 : 0, lk));
  SPR.case = toCanvas(briefcase()); SPR.cash = toCanvas(cashBrick()); SPR.bar = toCanvas(goldBar()); SPR.card = toCanvas(blackCard()); SPR.plane = toCanvas(plane());
  SPR.bubble = toCanvas(bubble(26, 16)); SPR.g0 = toCanvas(gull(0), false); SPR.g1 = toCanvas(gull(1), false); SPR.n0 = toCanvas(note(0)); SPR.n1 = toCanvas(note(1)); for (let i = 0; i < 3; i++) SPR['sp' + i] = toCanvas(sparkle(i / 3 + 0.1), false);
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
  for (const n of ['penthouse', 'vault', 'airfield', 'villa']) {
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

// ================================================================== timeline (seconds; Video 3 word timings)
const T = { pent: 0.8, vault: 2.5, air: 11.35, villa: 14.35 };
function scene(t) { return t < T.vault ? 'penthouse' : t < T.air ? 'vault' : t < T.villa ? 'airfield' : 'villa'; }

function drawPixels(ctx, t) {
  ctx.clearRect(0, 0, G, G); HX.clearRect(0, 0, VW, VW);
  const sc = scene(t);
  ctx.drawImage(BG[sc], 0, 0);
  ambient(ctx, sc, t);
  // ---------------------------------------------------------------- penthouse: he strolls in, waves; "1,200"; picks up the case and heads out
  if (sc === 'penthouse') {
    const w = walker(t, [[0.6, 232, 176], [1.75, 154, 174], [2.15, 154, 174], [2.7, 96, 200]]);
    const waving = t > 1.78 && t < 2.15;
    if (t < 2.05) { const bob = t > 1.5 ? Math.max(0, Math.sin((t - 1.5) * 14)) * 2 * (1 - P(t, 1.5, 2.0)) : 0; spr(ctx, 'case', 124, 136 - bob); }
    drawAvatar(ctx, w, waving ? (Math.floor(t * 7) % 2 ? 'wave0' : 'wave1') : t > 2.05 ? 'carry' : null, waving ? false : null);
    if (t > 2.05) spr(ctx, 'case', w.x + (w.flip ? -8 : 8), w.y - 3 - (Math.floor(t * 8) % 2), w.flip);
    if (t > 1.0 && t < 2.0) for (let k = 0; k < 3; k++) { const ph = (t * 1.8 + k / 3) % 1; spr(ctx, 'sp' + Math.floor(ph * 3), 124 + [-6, 6, 0][k], 124 - ph * 14); }   // the case glitters
    banner(HX, '1,200', 30, 3, t, 0.95, 2.3);
  }
  // ---------------------------------------------------------------- vault
  if (sc === 'vault') {
    const n = 15, built = (i) => 2.75 + i * 0.085;
    const pos = (i) => { const row = i < 5 ? 0 : i < 9 ? 1 : i < 12 ? 2 : i < 14 ? 3 : 4, col = i < 5 ? i : i < 9 ? i - 5 : i < 12 ? i - 9 : i < 14 ? i - 12 : 0; return [118 + col * 8 + row * 4, 178 - row * 4]; };
    const intoCase = (i) => 9.75 + i * 0.03;
    for (let i = 0; i < n; i++) {
      const tl = built(i); if (t < tl - 0.2) continue;
      let [x, y] = pos(i); const fallk = clamp((tl - t) / 0.2); y -= fallk * fallk * 60;   // gravity drop
      if (t > tl) y -= Math.max(0, Math.sin((t - tl) * 26) * 2 * Math.exp(-(t - tl) * 10));   // bounce
      const tc = intoCase(i); if (t > tc) { const k = clamp((t - tc) / 0.22); if (k >= 1) continue; x = lerp(x, 88, k); y = lerp(y, 178, k) - Math.sin(Math.PI * k) * 18; }
      spr(ctx, 'cash', x, y + 4);
    }
    const cnt = Math.min(15600, Math.round(15600 * P(t, 2.75, 4.0, (x) => x) / 100) * 100);
    if (t > 2.7) banner(HX, cnt.toLocaleString('en-US'), 26, 3, t, 2.7, 5.0, cnt >= 15600 ? '#F2C14E' : '#FFFFFF');
    noteRain(ctx, t, 4.3, 5.9, 130);
    const w = walker(t, [[3.6, 124, 110], [4.55, 104, 163], [5.35, 104, 163], [6.0, 92, 176], [9.6, 92, 176]]);
    const cheer = t > 4.55 && t < 5.35;
    drawAvatar(ctx, { ...w, y: w.y - (cheer ? Math.max(0, Math.sin((t - 4.55) * 12)) * 3 : 0) }, cheer ? 'up' : t > 9.6 ? 'carry' : null, cheer ? false : null);
    if (cheer) confetti(ctx, t, 4.55, w.x, w.y - 30);
    if (t > 6.6 && t < 9.7) {
      const lines = Math.max(1, Math.min(9, Math.ceil((t - 6.6) / 0.14))), wob = t < 7.9 ? (Math.floor(t * 14) % 2) : 0;
      spr(ctx, 'st' + lines, 66 + wob, 114, false, 1 - P(t, 9.5, 9.7));
      if (t > 8.6) { const k = P(t, 8.6, 8.95, E.outBack); spr(ctx, 'card', lerp(100, 70, k), lerp(98, 100, k) - Math.sin(Math.PI * clamp((t - 8.6) / 0.35)) * 12); if (t > 8.95 && t < 9.35) spr(ctx, 'sp' + Math.floor((t * 9) % 3), 76, 88); }
    }
    if (t > 9.6) spr(ctx, 'case', w.x + 8, w.y - 3 - (t > 9.75 && t < 10.3 ? Math.floor(t * 12) % 2 : 0));
    if (t > 10.3 && t < 11.45) {
      const k = clamp(spring(t - 10.3, { stiffness: 400, damping: 16 })), bx = w.x + 22, by = w.y - 40 + (1 - k) * 6;
      spr(ctx, 'bubble', bx, by, false, clamp(k)); spr(ctx, 'plane', bx + Math.sin(t * 6) * 2, by - 9, false, clamp(k));
      if (t > 10.7) { const xk = clamp((t - 10.7) / 0.15); ctx.fillStyle = '#D6342B'; for (let i = -6; i <= 6; i++) { if ((i + 6) / 12 > xk) break; ctx.fillRect(bx + i - 1, by - 13 + i, 2, 2); ctx.fillRect(bx - i - 1, by - 13 + i, 2, 2); } }
    }
  }
  // ---------------------------------------------------------------- airfield
  if (sc === 'airfield') {
    flock(ctx, t, 18, 1, 3);
    const w = walker(t, [[11.3, 150, 202], [12.9, 92, 173], [13.5, 78, 166], [14.0, 78, 166]]);
    const wave = t > 13.5;
    drawAvatar(ctx, w, wave ? (Math.floor(t * 7) % 2 ? 'wave0' : 'wave1') : 'carry', wave ? false : null);
    spr(ctx, 'case', w.x + (w.flip ? -8 : 8), w.y - 3 - (wave ? 0 : Math.floor(t * 8) % 2), w.flip);
  }
  // ---------------------------------------------------------------- villa
  if (sc === 'villa') {
    flock(ctx, t, 10, -1, 4);
    const w = walker(t, [[14.3, 44, 152], [15.2, 106, 146], [END + 1, 106, 146]]);
    const cheer = t > 15.3;
    drawAvatar(ctx, { ...w, y: w.y - (cheer ? Math.max(0, Math.sin((t - 15.3) * 9)) * 3 : 0) }, cheer ? 'up' : null, cheer ? false : null);
    if (cheer) confetti(ctx, t, 15.8, w.x, w.y - 32);
    const mult = t < 15.15 ? 7 : Math.min(21, 7 + Math.floor((t - 15.15) / 0.045));
    banner(HX, `${mult}X`, 26, 4, t, 14.55, END - 0.15, mult >= 21 ? '#F2C14E' : '#FFFFFF');
  }
}

// camera: eased keys per scene [t, cx, cy, zoom] (art px; zoom = screen px per art px); push-in before each cut,
// pull-out after it, and a slow drift so the frame is never still
const CAMK = [
  [0.0, 150, 120, 5.0], [0.8, 150, 120, 5.0], [1.8, 140, 140, 6.0], [2.5, 112, 165, 7.4],
  [2.5, 140, 150, 7.6], [3.3, 138, 135, 5.6], [4.6, 118, 122, 6.0], [5.6, 108, 128, 5.2], [6.7, 74, 130, 7.4], [8.7, 72, 122, 8.2], [9.7, 86, 150, 6.6], [10.4, 96, 140, 7.4], [11.35, 96, 140, 8.4],
  [11.35, 112, 140, 6.2], [12.3, 110, 140, 5.2], [13.6, 88, 150, 7.0], [14.35, 84, 150, 8.0],
  [14.35, 100, 130, 6.0], [15.2, 108, 118, 5.2], [16.4, 108, 112, 5.8], [17.3, 108, 112, 6.0],
];
function camAt(t) {
  let i = 0; while (i < CAMK.length - 1 && t >= CAMK[i + 1][0]) i++;
  const a = CAMK[i], b = CAMK[Math.min(i + 1, CAMK.length - 1)], k = b[0] > a[0] ? E.inOutSine(clamp((t - a[0]) / (b[0] - a[0]))) : 1;
  const z = Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), k));
  return { cx: lerp(a[1], b[1], k) + Math.sin(t * 0.7) * 1.5, cy: lerp(a[2], b[2], k) + Math.sin(t * 0.9 + 1) * 1, z };
}
const CUTS = [T.vault, T.air, T.villa];
const mosaicAt = (t) => { let m = 0; for (const c of CUTS) m = Math.max(m, 1 - Math.abs(t - c) / 0.16); return clamp(m); };

// ================================================================== layout over time
const END = 17.29; window.__END = END;
const FH_KEYS = [[0, 1920], [0.8, SEAM], [END, 0]];
function footH(t) {
  let v = springKeys(t, FH_KEYS, { stiffness: 150, damping: 17 });
  for (let i = 1; i < FH_KEYS.length; i++) v -= Math.sign(FH_KEYS[i][1] - FH_KEYS[i - 1][1]) * 34 * antic(t, FH_KEYS[i][0], 0.22);
  return clamp(v, 0, DH);
}
const FULL_WINDOWS = [[0, 0.8]];

// ================================================================== sound
function buildHits() {
  const h = [];
  for (let i = 0; i < 8; i++) h.push([0.85 + i * 0.125, 'step', 'tick', { gain: 0.09 }]);
  h.push([0.95, '1,200', 'blip', { pitch: 'E6', gain: 0.25 }], [1.8, 'wave', 'blip', { pitch: 'G6', gain: 0.18 }], [2.05, 'grab case', 'click', { gain: 0.3 }]);
  h.push([T.vault, 'dissolve', 'whoosh', { len: 0.4, from: 600, to: 2400, gain: 0.2 }]);
  for (let i = 0; i < 15; i++) h.push([2.75 + i * 0.085, 'brick', 'tok', { pitch: ['C5', 'D5', 'E5', 'G5', 'A5'][i % 5], gain: 0.2 }]);
  h.push([4.0, '15,600', 'bell', { pitch: 'G5', gain: 0.3 }], [4.3, 'free cash', 'pop', { pitch: 'C6', gain: 0.3 }]);
  for (let i = 0; i < 9; i++) h.push([6.6 + i * 0.14, 'print', 'tick', { gain: 0.1 }]);
  h.push([8.95, 'card tap', 'click', { gain: 0.35 }], [9.75, 'cash to case', 'whoosh', { len: 0.45, from: 900, to: 2600, gain: 0.2 }], [10.25, 'case shut', 'thud', { gain: 0.35 }]);
  h.push([10.3, 'bubble', 'pop', { pitch: 'E5', gain: 0.22 }], [10.75, 'nope', 'boing', { pitch: 'E4', to: 'C4', gain: 0.22 }]);
  h.push([T.air, 'dissolve', 'whoosh', { len: 0.4, from: 600, to: 2400, gain: 0.2 }]);
  for (let i = 0; i < 10; i++) h.push([11.55 + i * 0.125, 'step', 'tick', { gain: 0.08 }]);
  h.push([12.0, 'travel', 'blip', { pitch: 'E6', gain: 0.22 }], [T.villa, 'dissolve', 'whoosh', { len: 0.4, from: 600, to: 2400, gain: 0.2 }]);
  h.push([14.6, '7x', 'pop', { pitch: 'C6', gain: 0.3 }]);
  for (let i = 0; i < 14; i++) h.push([15.15 + i * 0.045, 'count', 'tick', { gain: 0.08 + i * 0.006 }]);
  h.push([15.8, '21x', 'bell', { pitch: 'C6', gain: 0.35 }]);
  return h.sort((a, b) => a[0] - b[0]);
}

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
  images: { badge: 'assets/badge.png', penthouse: 'assets/bg/penthouse.png', vault: 'assets/bg/vault.png', airfield: 'assets/bg/airfield.png', villa: 'assets/bg/villa.png' },
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
    for (const n of ['penthouse', 'vault', 'airfield', 'villa']) if (!BG[n] && IMG[n]) BG[n] = IMG[n];
    if (!AMB.villa && BG.villa) buildAmbient();
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
    const dk = P(t, 2.75, 3.0) * (1 - P(t, END - 0.2, END));
    if (dk > 0.01) { ctx.globalAlpha = 0.9 * dk; ctx.fillStyle = 'rgba(10,8,30,0.75)'; ctx.fillRect(300, Y(858) - 22, 480, 34); ctx.globalAlpha = dk; ctx.font = font(22, 500, UI); ctx.textAlign = 'center'; ctx.fillStyle = '#FFFFFF'; ctx.fillText('Individual results vary. Education only.', 540, Y(858)); ctx.globalAlpha = 1; }
    if (FOOT && fh > 1) {
      cover(ctx, FOOT, 0, DH - fh, DW, fh, { fx: 0.5, fy: lerp(0.25, 0.45, clamp((fh - SEAM) / (DH - SEAM))), zoom: pushIn(t) });
      if (fh < DH - 2) { ctx.fillStyle = '#F2C14E'; ctx.fillRect(0, DH - fh - 3, DW, 6); ctx.fillStyle = OUT; ctx.fillRect(0, DH - fh + 3, DW, 3); }
    }
    BR.captions(ctx, t, fh, CAPS);
    ctx.restore();
  },
  post(ctx, u, t) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.06; ctx.drawImage(GRAIN[Math.floor(t * 24) % 4], 0, 0); ctx.restore(); },
});
