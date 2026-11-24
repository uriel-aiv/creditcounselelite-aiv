// CCE — "16 Board Game" founder split-screen (original style, no reference). Pure function of time.
// An original property-trading board game: a mint board ringed by spaces named for the ideas in the script, colour
// title bars, corner squares, a navy pawn that hops space to space on the spoken beats while the camera follows and the
// board turns at each corner; dice rolls, flip cards, green houses and a red hotel. No third-party names or tokens.
import * as M from './lib/motion.js';
import * as BR from './lib/brand.js';

const { W, H, E, prog, clamp, lerp, spring, springKeys, SPRING, wobble, font, mulberry32, cover, rrect } = M;
const DW = 1080, DH = 1920, S = W / DW, TAU = M.TAU;
const C = { felt: '#0A0A0A', board: '#E6EEF7', line: '#16201A', ink: '#121614', cream: '#FBF7EC', card: '#CB9938', gold: '#CB9938' };
const G = { brown: '#114BA7', lblue: '#ADC8E3', pink: '#008C96', orange: '#CB9938', red: '#6B0505', yellow: '#E2C887', green: '#266235', dblue: '#004AAD' };
const DISP = 'Display', UI = 'UI', CARD = 'Card';
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 1358;
const SEAM = 980;
{ const arc0 = CanvasRenderingContext2D.prototype.arc; CanvasRenderingContext2D.prototype.arc = function (x, y, r, a0, a1, ccw) { return arc0.call(this, x, y, Math.max(0, r), a0, a1, ccw); }; }

// ------------------------------------------------------------------ the board: 40 spaces, clockwise from START (bottom-right)
const SPACES = [
  ['START', 'corner'], ['CREDIT LIMIT', 'brown'], ['PLAYBOOK', 'card'], ['APPLY', 'brown'], ['FEE', 'tax'], ['TRANSFER', 'rail'], ['STATEMENT', 'lblue'], ['PLAYBOOK', 'card'], ['BALANCE', 'lblue'], ['LIMIT UP', 'lblue'],
  ['BANK', 'corner'], ['NEXT DAY', 'pink'], ['FLAT FEE', 'util'], ['0% INTRO', 'pink'], ['6 MO', 'orange'], ['9 MO', 'orange'], ['12 MO', 'orange'], ['PLAYBOOK', 'card'], ['18 MO', 'orange'], ['24 MO', 'orange'],
  ['REPEAT', 'corner'], ['ROUND 1', 'red'], ['PLAYBOOK', 'card'], ['ROUND 2', 'red'], ['ROUND 3', 'red'], ['PARTNER', 'rail'], ['YOU', 'yellow'], ['SPOUSE', 'yellow'], ['SCORE', 'util'], ['RESET', 'yellow'],
  ['VAULT', 'corner'], ['NO DOCS', 'green'], ['UP TO 150K', 'green'], ['PLAYBOOK', 'card'], ['13 CARDS', 'green'], ['BONUS', 'green'], ['PLAYBOOK', 'card'], ['TRAVEL', 'rail'], ['REWARDS', 'tax'], ['21X VALUE', 'dblue'],
];
const CW = 230, SW = 150, L = CW * 2 + SW * 9;             // corner, space width, board side (1810)
function spaceRect(i) {                                        // board-space rect + inward side
  const side = Math.floor(i / 10), k = i % 10;
  if (k === 0) { const pos = [[L - CW, L - CW], [0, L - CW], [0, 0], [L - CW, 0]][side]; return { x: pos[0], y: pos[1], w: CW, h: CW, side, corner: true }; }
  if (side === 0) return { x: L - CW - k * SW, y: L - CW, w: SW, h: CW, side };
  if (side === 1) return { x: 0, y: L - CW - k * SW, w: CW, h: SW, side };
  if (side === 2) return { x: CW + (k - 1) * SW, y: 0, w: SW, h: CW, side };
  return { x: L - CW, y: CW + (k - 1) * SW, w: CW, h: SW, side };
}
const centre = (i) => { const r = spaceRect(i); return [r.x + r.w / 2, r.y + r.h / 2]; };
const sideRot = (side) => side * Math.PI / 2;                  // text on side n is rotated n*90° (reads from outside)

// ------------------------------------------------------------------ token schedule: hops on the beats
const MOVES = [[1.95, 2.2, 0, 1], [2.45, 4.05, 1, 10], [5.95, 6.45, 10, 11], [8.0, 8.3, 11, 12], [10.7, 11.0, 12, 13], [13.3, 14.3, 13, 19], [16.85, 17.14, 19, 18],
  [18.6, 19.05, 18, 20], [20.1, 20.45, 20, 21], [22.0, 22.3, 21, 23], [22.8, 23.08, 23, 24], [26.0, 31.5, 24, 30], [32.6, 33.3, 30, 31], [35.8, 36.42, 31, 34], [43.3, 43.58, 34, 35], [51.3, 51.94, 35, 37], [53.4, 53.98, 37, 39]];
function tokenAt(t) {                                          // world position + lift (hop arc) + current index
  let idx = 0, lift = 0, pos = centre(0);
  for (const [t0, t1, a, b] of MOVES) {
    if (t >= t1) { idx = b; pos = centre(b); continue; }
    if (t < t0) break;
    const n = Math.abs(b - a), dir = Math.sign(b - a), f = prog(t, t0, t1) * n, step = Math.min(n - 1, Math.floor(f)), u = f - step;
    const from = centre(((a + dir * step) % 40 + 40) % 40), to = centre(((a + dir * (step + 1)) % 40 + 40) % 40), e = E.inOutSine(u);
    pos = [lerp(from[0], to[0], e), lerp(from[1], to[1], e)]; lift = Math.sin(Math.PI * u); idx = ((a + dir * Math.round(f)) % 40 + 40) % 40;
    return { pos, lift, idx, moving: true };
  }
  return { pos, lift, idx, moving: false };
}
const HITS = [
  [1.3, 'dice', 'type', { len: 0.5, gain: 0.3 }], [1.9, 'dice land', 'tick', { gain: 0.45 }], [2.2, 'land', 'click', { pitch: 'C5', gain: 0.4 }],
  ...Array.from({ length: 9 }, (_, i) => [2.45 + (i + 1) * (1.6 / 9), 'hop', 'tick', { gain: 0.25 }]), [4.1, 'bank', 'pop', { pitch: 'C5', gain: 0.45 }],
  [6.45, 'next day', 'click', { pitch: 'G5', gain: 0.4 }], [9.28, 'card flip', 'whoosh', { len: 0.3, gain: 0.25 }], [9.94, '5%', 'blip', { pitch: 'G6', gain: 0.3 }], [11.0, '0% stamp', 'thud', { gain: 0.45 }],
  ...Array.from({ length: 6 }, (_, i) => [13.3 + (i + 1) * (1.0 / 6), 'hop', 'tick', { gain: 0.25 }]), [17.14, 'house', 'pop', { pitch: 'E5', gain: 0.45 }],
  [19.05, 'corner', 'click', { pitch: 'C5', gain: 0.4 }], [20.72, 'partner', 'blip', { pitch: 'A6', gain: 0.3 }], [21.45, 'house', 'pop', { pitch: 'C5', gain: 0.4 }], [22.3, 'house', 'pop', { pitch: 'E5', gain: 0.4 }], [23.08, 'hotel', 'pop', { pitch: 'G5', gain: 0.5 }],
  [33.3, 'land', 'click', { pitch: 'C5', gain: 0.4 }], [34.8, 'papers off', 'whoosh', { len: 0.5, gain: 0.3 }], [36.42, 'deal', 'type', { len: 0.45, gain: 0.3 }], [38.5, '10 days', 'tick', { gain: 0.4 }],
  [43.58, 'bonus', 'coins', { gain: 0.35 }], [51.94, 'travel', 'whoosh', { len: 0.6, from: 600, to: 2200, gain: 0.3 }], [53.98, '21x', 'bell', { pitch: 'E6', gain: 0.3 }], [56.95, 'badge', 'bell', { pitch: 'C6', gain: 0.3 }],
];

// ------------------------------------------------------------------ helpers
const pop = (t, t0, cfg = { stiffness: 300, damping: 18 }) => (t < t0 ? 0 : Math.max(0, spring(t - t0, cfg)));
const P = (t, a, b, ease = E.inOutCubic) => ease(prog(t, a, b));
const antic = (t, t0, dur = 0.2) => { const p = prog(t, t0 - dur, t0 + 0.02); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; };
const outK = (t, t0, d = 0.35) => clamp(1 - E.inCubic(prog(t, t0, t0 + d)));
let FH = DH;
const Y = (y) => y - (FH - SEAM);
function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }
function txt(ctx, s, x, y, size, col, align = 'center', face = DISP, weight = 400, track = 0) { ctx.font = font(size, weight, face); ctx.letterSpacing = `${track * size}px`; ctx.fillStyle = col; ctx.textAlign = align; ctx.fillText(s, x, y); ctx.letterSpacing = '0px'; }

// ------------------------------------------------------------------ icons drawn on spaces
function iconOn(x, cx, cy, kind, s = 1) {
  x.save(); x.translate(cx, cy); x.scale(s, s); x.strokeStyle = C.line; x.fillStyle = C.line; x.lineWidth = 5; x.lineJoin = 'round'; x.lineCap = 'round';
  if (kind === 'card') { x.font = font(96, 400, DISP); x.textAlign = 'center'; x.fillStyle = G.orange; x.fillText('?', 0, 34); }
  if (kind === 'rail') { x.beginPath(); x.moveTo(-34, 20); x.lineTo(34, 20); x.moveTo(-30, -24); x.lineTo(30, -24); x.lineTo(30, 10); x.lineTo(-30, 10); x.closePath(); x.stroke(); x.beginPath(); x.arc(-18, 26, 7, 0, TAU); x.arc(18, 26, 7, 0, TAU); x.fill(); }
  if (kind === 'tax') { x.beginPath(); x.moveTo(0, -34); x.lineTo(30, 0); x.lineTo(0, 34); x.lineTo(-30, 0); x.closePath(); x.stroke(); x.font = font(34, 400, DISP); x.textAlign = 'center'; x.fillText('%', 0, 12); }
  if (kind === 'util') { x.beginPath(); x.arc(0, -6, 22, Math.PI * 0.9, Math.PI * 2.1); x.stroke(); x.fillRect(-12, 16, 24, 10); x.fillRect(-9, 28, 18, 6); }
  if (kind === 'plane') { x.beginPath(); x.moveTo(0, -40); x.lineTo(7, -10); x.lineTo(38, 6); x.lineTo(38, 14); x.lineTo(7, 6); x.lineTo(4, 28); x.lineTo(14, 36); x.lineTo(-14, 36); x.lineTo(-4, 28); x.lineTo(-7, 6); x.lineTo(-38, 14); x.lineTo(-38, 6); x.lineTo(-7, -10); x.closePath(); x.fill(); }
  if (kind === 'bank') { x.beginPath(); x.moveTo(-44, -14); x.lineTo(0, -44); x.lineTo(44, -14); x.closePath(); x.fill(); [-30, -10, 10, 30].forEach((c) => x.fillRect(c - 5, -8, 10, 40)); x.fillRect(-48, 34, 96, 9); }
  if (kind === 'arrow') { x.beginPath(); x.moveTo(50, 0); x.lineTo(-30, 0); x.stroke(); x.beginPath(); x.moveTo(-50, 0); x.lineTo(-22, -22); x.lineTo(-22, 22); x.closePath(); x.fillStyle = G.red; x.fill(); }
  if (kind === 'loop') { x.beginPath(); x.arc(0, 0, 34, -Math.PI * 0.2, Math.PI * 1.5); x.stroke(); x.beginPath(); x.moveTo(30, -34); x.lineTo(14, -14); x.lineTo(40, -6); x.closePath(); x.fill(); }
  if (kind === 'vault') { x.beginPath(); x.arc(0, 0, 38, 0, TAU); x.stroke(); x.beginPath(); x.arc(0, 0, 10, 0, TAU); x.fill(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; x.beginPath(); x.moveTo(Math.cos(a) * 14, Math.sin(a) * 14); x.lineTo(Math.cos(a) * 30, Math.sin(a) * 30); x.stroke(); } }
  x.restore();
}
// ------------------------------------------------------------------ bake the board once (2x for crisp zooms)
let BOARD = null; const BS = 2;
function bakeBoard(IMG) {
  BOARD = canvas(L * BS, L * BS); const x = BOARD.getContext('2d'); x.scale(BS, BS);
  x.fillStyle = C.board; x.fillRect(0, 0, L, L);
  const r = mulberry32(3); for (let i = 0; i < 26000; i++) { x.fillStyle = `rgba(40,70,40,${0.02 + r() * 0.04})`; x.fillRect(r() * L, r() * L, 1.5, 1.5); }
  x.strokeStyle = C.line; x.lineWidth = 4; x.strokeRect(2, 2, L - 4, L - 4); x.strokeRect(CW, CW, L - CW * 2, L - CW * 2);
  SPACES.forEach(([name, kind], i) => {
    const s = spaceRect(i);
    x.lineWidth = 2.5; x.strokeRect(s.x, s.y, s.w, s.h);
    x.save(); x.translate(s.x + s.w / 2, s.y + s.h / 2); x.rotate(sideRot(s.side));
    const w = s.side % 2 ? s.h : s.w, h = s.side % 2 ? s.w : s.h;   // local: width along the edge, height inward
    if (s.corner) {
      x.rotate(Math.PI / 4 * 0); const icon = { START: 'arrow', BANK: 'bank', REPEAT: 'loop', VAULT: 'vault' }[name];
      iconOn(x, 0, 18, icon, 1.2); txt(x, name, 0, -54, 44, C.ink, 'center', DISP, 400, 0.04);
    } else {
      if (G[kind]) { x.fillStyle = G[kind]; x.fillRect(-w / 2, -h / 2, w, 52); x.strokeStyle = C.line; x.lineWidth = 2.5; x.beginPath(); x.moveTo(-w / 2, -h / 2 + 52); x.lineTo(w / 2, -h / 2 + 52); x.stroke(); }
      const words = name.split(' '), top = G[kind] ? -h / 2 + 92 : -h / 2 + 40;
      (words.length > 1 && name.length > 9 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [name]).forEach((ln, j) => txt(x, ln, 0, top + j * 30, 27, C.ink, 'center', DISP, 400, 0.03));
      const icon = { card: 'card', rail: name === 'TRAVEL' ? 'plane' : 'rail', tax: 'tax', util: 'util' }[kind];
      if (icon) iconOn(x, 0, 42, icon, 0.9);
    }
    x.restore();
  });
  // centre: the CCE badge on a diagonal plate
  x.save(); x.translate(L / 2, L / 2); x.rotate(-Math.PI / 4);
  x.fillStyle = '#004AAD'; x.fillRect(-520, -120, 1040, 240); x.strokeStyle = C.line; x.lineWidth = 5; x.strokeRect(-520, -120, 1040, 240);
  txt(x, 'THE 0% CAPITAL GAME', 0, 34, 96, '#FFFFFF', 'center', DISP, 400, 0.04);
  x.restore();
  if (IMG.badge) { const bw = 300, bh = bw * IMG.badge.height / IMG.badge.width; x.save(); x.translate(L / 2 + 330, L / 2 + 330); x.rotate(-Math.PI / 4); x.drawImage(IMG.badge, -bw / 2, -bh / 2, bw, bh); x.restore(); }
  // deck spots
  [[L / 2 - 330, L / 2 - 330, C.card, 'PLAYBOOK'], [L / 2 + 330, L / 2 - 330, G.lblue, 'DEEDS']].forEach(([cx, cy, col, lab]) => { x.save(); x.translate(cx, cy); x.rotate(-Math.PI / 4); x.setLineDash([12, 10]); x.strokeStyle = C.line; x.lineWidth = 3; x.strokeRect(-130, -80, 260, 160); x.setLineDash([]); txt(x, lab, 0, 14, 40, 'rgba(18,22,20,0.55)', 'center', DISP, 400, 0.06); x.restore(); });
}

// ------------------------------------------------------------------ live pieces: pawn, houses, dice, cards
function pawn(ctx, x, y, lift, col, s = 1) {
  const up = lift * 70;
  ctx.save(); ctx.globalAlpha = 0.35 * (1 - lift * 0.5); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x + 8 + up * 0.25, y + 26, 34 * s * (1 - lift * 0.25), 16 * s, 0, 0, TAU); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(x, y - up); ctx.scale(s, s);
  const g = ctx.createLinearGradient(-30, -80, 30, 20); g.addColorStop(0, '#6F8FE0'); g.addColorStop(0.5, col); g.addColorStop(1, '#0B1838');
  ctx.fillStyle = g; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 18, 34, 14, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-24, 16); ctx.quadraticCurveTo(-10, -20, -12, -36); ctx.lineTo(12, -36); ctx.quadraticCurveTo(10, -20, 24, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -52, 22, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-7, -60, 7, 10, -0.5, 0, TAU); ctx.fill();
  ctx.restore();
}
function house(ctx, x, y, k, col = '#2FA34F', hotel = false) {
  if (k <= 0.01) return; const s = Math.max(0, k), w = hotel ? 64 : 34, h = hotel ? 34 : 30;
  ctx.save(); ctx.translate(x, y - (1 - Math.min(1, s)) * 60); ctx.scale(Math.min(1.2, s), Math.min(1.2, s));
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-w / 2 + 5, 6, w, 12);
  ctx.fillStyle = col; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-w / 2, 10); ctx.lineTo(-w / 2, -h / 2); ctx.lineTo(0, -h / 2 - 18); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(0, -h / 2 - 18); ctx.lineTo(0, 10); ctx.lineTo(-w / 2, 10); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function die(ctx, x, y, s, rot, v) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, -40 + 8, -40 + 10, 80, 80, 16); ctx.fill();
  ctx.fillStyle = '#FFFDF6'; ctx.strokeStyle = '#2A2A2A'; ctx.lineWidth = 3; rrect(ctx, -40, -40, 80, 80, 16); ctx.fill(); ctx.stroke();
  const P6 = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  ctx.fillStyle = v === 1 ? G.red : '#1A1A1A'; (P6[v] || []).forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a * 20, b * 20, 7.5, 0, TAU); ctx.fill(); });
  ctx.restore();
}
function rollDice(ctx, t, t0, t1, va, vb, cx, cy) {         // two dice tumble in from the side, settle on va, vb
  if (t < t0 || t > t1 + 1.4) return;
  const k = P(t, t0, t1, E.outCubic), out = P(t, t1 + 1.0, t1 + 1.4), spin = (1 - k) * 9, r = mulberry32(Math.floor(t * 14));
  const face = (v) => (k < 0.97 ? 1 + Math.floor(r() * 6) : v);
  die(ctx, lerp(cx - 520, cx - 70, k), cy - 40 + Math.sin(k * Math.PI * 3) * 40 * (1 - k) - out * 400, 0.9 * (1 - out), spin + 0.2, face(va));
  die(ctx, lerp(cx - 600, cx + 60, k), cy + 30 + Math.cos(k * Math.PI * 3) * 40 * (1 - k) - out * 400, 0.9 * (1 - out), -spin - 0.3, face(vb));
}
// ------------------------------------------------------------------ illustrated game cards + play money
let IL = {}, BILLS = [];
function illus(ctx, key, cx, cy, bw, bh, t, k = 1) {      // contain the illustration in a box, tiny idle bob
  const im = IL[key]; if (!im || k <= 0.01) return;
  const s = Math.min(bw / im.width, bh / im.height) * k * (1 + 0.015 * Math.sin(t * 2.2 + cx)), w = im.width * s, h = im.height * s;
  ctx.drawImage(im, cx - w / 2, cy - h / 2, w, h);
}
// landscape game card: pale yellow / orange stock, "PLAYBOOK" header, bold title and a footer line on the left,
// a plain black pen drawing on the right (no fills); flips in, ages at the edges
function wrap(ctx, s, maxW) { const out = []; let line = ''; for (const w of s.split(' ')) { const tst = line ? line + ' ' + w : w; if (ctx.measureText(tst).width > maxW && line) { out.push(line); line = w; } else line = tst; } if (line) out.push(line); return out; }
const STOCK = { yellow: '#E2C887', orange: '#ADC8E3' };
function gameCard(ctx, t, t0, t1, x, y, w, h, o) {
  if (t < t0 || t > t1 + 0.35) return;
  const fin = P(t, t0, t0 + 0.34, E.outBack), fout = P(t, t1, t1 + 0.3, E.inBack), sx = Math.max(0.001, Math.abs(Math.cos((1 - fin) * Math.PI / 2))) * (1 - fout);
  if (sx <= 0.01) return;
  const col = STOCK[o.stock || 'yellow'];
  ctx.save(); ctx.translate(x, y + (1 - fin) * 70); ctx.rotate(o.rot ?? -0.02); ctx.scale(sx, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, -w / 2 + 9, -h / 2 + 11, w, h, 10); ctx.fill();
  ctx.fillStyle = col; rrect(ctx, -w / 2, -h / 2, w, h, 10); ctx.fill();
  ctx.save(); rrect(ctx, -w / 2, -h / 2, w, h, 10); ctx.clip();
  const g = ctx.createRadialGradient(0, 0, Math.min(w, h) * 0.3, 0, 0, Math.max(w, h) * 0.7); g.addColorStop(0, 'rgba(120,80,0,0)'); g.addColorStop(1, 'rgba(120,80,0,0.22)'); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  const r = mulberry32(Math.round(w + t0 * 100)); for (let i = 0; i < 260; i++) { ctx.fillStyle = `rgba(90,60,10,${0.04 + r() * 0.06})`; ctx.fillRect(-w / 2 + r() * w, -h / 2 + r() * h, 1 + r() * 2, 1); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(60,40,10,0.35)'; ctx.lineWidth = 1.5; rrect(ctx, -w / 2, -h / 2, w, h, 10); ctx.stroke();
  const hasIl = !!(o.il && IL[o.il]), lw = hasIl ? w * 0.54 : w, lx = -w / 2 + lw / 2 + (hasIl ? 10 : 0);
  ctx.fillStyle = C.ink; ctx.textAlign = 'center';
  ctx.font = font(30, 500, CARD); ctx.letterSpacing = '1px'; ctx.fillText(o.head || 'PLAYBOOK', lx, -h / 2 + 52);
  ctx.font = font(o.titleSize || 44, 700, CARD); ctx.letterSpacing = '0.5px';
  const lines = wrap(ctx, o.title, lw - 50), lh = (o.titleSize || 44) * 1.12, ty = -((lines.length - 1) * lh) / 2 + (o.titleSize || 44) * 0.35 - 6;
  lines.forEach((ln, i) => ctx.fillText(ln, lx, ty + i * lh));
  if (o.foot) { ctx.font = font(o.footSize || 32, 500, CARD); ctx.fillText(o.foot, lx, h / 2 - 34); }
  if (hasIl) { const k = clamp(P(t, t0 + 0.12, t0 + 0.4, E.outBack)); ctx.globalCompositeOperation = 'multiply'; illus(ctx, o.il, w / 2 - (w - lw) / 2 - 14, 8, w - lw - 20, h - 50, t, k); ctx.globalCompositeOperation = 'source-over'; }
  if (o.after) o.after(ctx, w, h);
  ctx.restore();
}
// a credit card in the board's colours: rounded body, diagonal shine, gold chip, contactless mark, embossed dots, brand line
function creditCard(ctx, w, h, col, i) {
  const r = h * 0.1;
  ctx.fillStyle = 'rgba(0,0,0,0.32)'; rrect(ctx, -w / 2 + 4, -h / 2 + 6, w, h, r); ctx.fill();
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, col); g.addColorStop(1, shade(col, -0.32));
  ctx.fillStyle = g; rrect(ctx, -w / 2, -h / 2, w, h, r); ctx.fill();
  ctx.save(); rrect(ctx, -w / 2, -h / 2, w, h, r); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.moveTo(-w * 0.1, -h / 2); ctx.lineTo(w * 0.25, -h / 2); ctx.lineTo(-w * 0.05, h / 2); ctx.lineTo(-w * 0.4, h / 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(w * 0.42, -h * 0.55, h * (0.5 + k * 0.16), 0, TAU); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 2; rrect(ctx, -w / 2, -h / 2, w, h, r); ctx.stroke();
  // chip
  const cx = -w * 0.3, cy = -h * 0.04, cw = w * 0.17, ch = h * 0.24, cg = ctx.createLinearGradient(cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2);
  cg.addColorStop(0, '#F7DE8A'); cg.addColorStop(0.5, '#D4A63A'); cg.addColorStop(1, '#F2D27A'); ctx.fillStyle = cg; rrect(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 3); ctx.fill();
  ctx.strokeStyle = 'rgba(90,60,0,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - cw / 2, cy); ctx.lineTo(cx + cw / 2, cy); ctx.moveTo(cx - cw / 6, cy - ch / 2); ctx.lineTo(cx - cw / 6, cy + ch / 2); ctx.moveTo(cx + cw / 6, cy - ch / 2); ctx.lineTo(cx + cw / 6, cy + ch / 2); ctx.stroke(); ctx.strokeRect(cx - cw / 2, cy - ch / 2, cw, ch);
  // contactless waves
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.6; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(-w * 0.12, cy, 5 + k * 4.5, -0.75, 0.75); ctx.stroke(); }
  // embossed dot groups (no numbers) + brand line
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let gI = 0; gI < 4; gI++) for (let d = 0; d < 4; d++) { ctx.beginPath(); ctx.arc(-w * 0.38 + gI * w * 0.2 + d * 5.5, h * 0.24, 1.7, 0, TAU); ctx.fill(); }
  ctx.font = font(h * 0.13, 700, CARD); ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.letterSpacing = '1px'; ctx.fillText('PLAYBOOK', w / 2 - 10, -h / 2 + h * 0.2); ctx.letterSpacing = '0px';
  ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.arc(w / 2 - 24, h / 2 - 18, 9, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(w / 2 - 12, h / 2 - 18, 9, 0, TAU); ctx.fill();
}
function shade(hex, f) { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)); return `rgb(${c.join(',')})`; }
function bill(ctx, x, y, w, rot, ci = 0, a = 1) {
  const im = BILLS[ci % BILLS.length]; if (!im || a <= 0.01) return; const h = w * im.height / im.width;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 4; ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
}

// ------------------------------------------------------------------ camera: follow the pawn, turn the board at corners
const ROT_KEYS = [[0, 0], [4.25, 1], [19.2, 2], [31.7, 3]];   // board side the pawn is on
function camera(t) {
  const tk = tokenAt(t), v = springKeys(t, [[0, [...centre(0), 1.15]], ...MOVES.map(([t0, t1, a, b]) => [t1 - 0.1, [...centre(b), 1.15]])], { stiffness: 60, damping: 14 });
  const rot = springKeys(t, ROT_KEYS.map(([k, s]) => [k, s]), { stiffness: 55, damping: 13 });
  // during the long lap hidden by full-screen we jump straight to the vault
  return { x: lerp(v[0], tk.pos[0], 0.35), y: lerp(v[1], tk.pos[1], 0.35), z: v[2], r: -rot * Math.PI / 2 };
}
function world(ctx, t) {
  const cam = camera(t), tk = tokenAt(t);
  ctx.save(); ctx.translate(540, Y(640)); ctx.rotate(cam.r); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  // felt table
  ctx.fillStyle = C.felt; ctx.fillRect(-2000, -2000, L + 4000, L + 4000);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18; ctx.fillStyle = C.board; ctx.fillRect(0, 0, L, L); ctx.restore();
  ctx.drawImage(BOARD, 0, 0, L, L);
  // landing highlight on the current space
  const hl = MOVES.find(([t0, t1]) => t > t1 && t < t1 + 1.2);
  if (hl) { const s = spaceRect(hl[3]), a = 1 - prog(t, hl[1], hl[1] + 1.2); ctx.save(); ctx.strokeStyle = `rgba(255,214,0,${a})`; ctx.lineWidth = 12; ctx.strokeRect(s.x + 6, s.y + 6, s.w - 12, s.h - 12); ctx.restore(); }
  // months 6..24 light up as the pawn runs them
  // houses: 18 MO, then ROUND 1-3 (3 houses -> hotel)
  const hs = (i, t0, n = 1, hotel = false) => { const s = spaceRect(i), [cx, cy] = centre(i); const ang = sideRot(s.side); for (let j = 0; j < n; j++) { const off = (j - (n - 1) / 2) * 40; ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang); house(ctx, off, -s.h / 2 * (s.side % 2 ? s.w / s.h : 1) + 26, pop(t, t0 + j * 0.05, { stiffness: 380, damping: 16 }), hotel ? G.red : '#266235', hotel); ctx.restore(); } };
  hs(18, 17.14); hs(21, 21.45); hs(23, 22.3); hs(24, 23.08, 1, true);
  // partner pawn trails one step behind from 20.72
  if (t > 20.72) { const tb = tokenAt(Math.max(20.72, t - 0.9)); const [px, py] = t < 21 ? centre(20) : tb.pos; pawn(ctx, px + 46, py + 30, tb.moving ? tb.lift : 0, '#008C96', 0.85 * clamp(pop(t, 20.72))); }
  pawn(ctx, tk.pos[0], tk.pos[1], tk.lift, '#004AAD', 1 + 0.08 * (tk.moving ? 0 : wobble(Math.max(0, t - (MOVES.find(([, t1]) => t1 <= t && t1 > t - 0.6) || [0, -9])[1]), 3, 6)));
  ctx.restore();
}
// overlays in panel space (above the pawn, which sits low in the panel)
function overlays(ctx, t) {
  rollDice(ctx, t, 1.3, 1.9, 1, 0, 540, Y(380));
  rollDice(ctx, t, 2.3, 2.75, 4, 5, 540, Y(300));
  const CY = Y(265), CWD = 640, CHT = 400;
  gameCard(ctx, t, 2.2, 3.95, 540, CY, CWD, CHT, { stock: 'yellow', title: 'Credit Limit Transferred', foot: 'To Your Bank', il: 'teller' });
  for (let i = 0; i < 7; i++) { const k = prog(t, 3.25 + i * 0.09, 3.85 + i * 0.09); if (k > 0 && k < 1) { const e = E.inOutSine(k); bill(ctx, lerp(720, 600, e), lerp(Y(470), Y(640), e) - Math.sin(Math.PI * k) * 90, 170 * (1 - 0.4 * k), -0.4 + k * 1.2 + i * 0.1, i, 1 - P(t, 3.8 + i * 0.09, 3.9 + i * 0.09)); } }
  gameCard(ctx, t, 4.1, 6.25, 540, CY, CWD, CHT, { stock: 'orange', title: 'Funds Deposited in Your Bank Account', titleSize: 40, foot: 'Bank Corner', il: 'bankman' });
  gameCard(ctx, t, 6.45, 7.75, 540, CY, CWD, CHT, { stock: 'yellow', title: 'The Very Next Day', foot: 'In Your Account', il: 'calendar2' });
  gameCard(ctx, t, 8.3, 10.75, 540, CY, CWD, CHT, { stock: 'orange', title: 'Pay a One-Time Flat Fee', foot: t < 9.28 ? ' ' : t < 9.6 ? 'Usually 1%' : 'Usually 1–5%', footSize: t < 9.28 ? 32 : 40, il: 'tag2' });
  gameCard(ctx, t, 11.0, 12.6, 540, CY, CWD, CHT, { stock: 'yellow', title: '0% Intro', titleSize: 120, foot: 'Especially Zero Percent' });
  gameCard(ctx, t, 13.4, 16.85, 540, CY, CWD, CHT, { stock: 'orange', title: 'Zero Interest for 6 to 24 Months', titleSize: 40, foot: '6–24 Months', il: 'hourglass2' });
  gameCard(ctx, t, 17.14, 18.45, 540, CY, CWD, CHT, { stock: 'yellow', title: 'Most Common Term', foot: '18 Months', footSize: 40, il: 'ribbon2' });
  gameCard(ctx, t, 19.05, 20.6, 540, CY, CWD, CHT, { stock: 'orange', title: 'Repeat the Process', foot: 'Every 6 Months', il: 'bike' });
  gameCard(ctx, t, 20.72, 23.95, 540, CY, CWD, CHT, { stock: 'yellow', title: 'Per Person', titleSize: 52, foot: 'You and Your Spouse', il: 'couple2' });
  gameCard(ctx, t, 33.3, 36.0, 600, CY, 600, CHT, { stock: 'orange', title: 'Up to 150,000 Without Documentation', titleSize: 38, foot: 'No Paperwork', il: 'clerk' });
  for (let i = 0; i < 9; i++) { const k = pop(t, 33.6 + i * 0.09, { stiffness: 360, damping: 18 }) * outK(t, 35.95); if (k > 0.01) bill(ctx, 150 + (i % 2 ? 6 : -6), Y(440) - i * 24 - (1 - Math.min(1, k)) * 80, 230, -0.06 + (i % 3) * 0.04, i, Math.min(1, k)); }
  // 13 property cards dealt in a fan, ten dice for ten days, a bill tucked under each for the bonus
  if (t > 36.2 && t < 44.9) {
    const ex = outK(t, 44.35), n = 13, cols = ['#1C2B4A', '#C9A13B', '#1F7A4A', '#B8222B', '#2E5FAF', '#2B2B2B', '#7A3E8E', '#D96A2B', '#1C2B4A', '#C9A13B', '#1F7A4A', '#B8222B', '#2E5FAF'];
    for (let i = 0; i < n; i++) {
      const k = P(t, 36.2 + i * 0.022, 36.5 + i * 0.022, E.outBack), a = (i - (n - 1) / 2) * 0.15, x = 540 + Math.sin(a) * 400, y = Y(515) - Math.cos(a) * 400;
      if (k <= 0.01) continue; const wave = Math.max(0, Math.sin(Math.PI * prog(t, 40.5 + i * 0.03, 41.0 + i * 0.03))), bx = pop(t, 43.58 + i * 0.05, { stiffness: 340, damping: 16 });
      ctx.save(); ctx.translate(lerp(540, x, k), lerp(Y(700), y, k) - wave * 20); ctx.rotate(a * k); ctx.scale(ex, ex);
      if (bx > 0.01) bill(ctx, 0, -80 - 40 * Math.min(1, bx), 130, Math.PI / 2 + 0.05, i);
      ctx.rotate(Math.PI / 2); creditCard(ctx, 176, 112, cols[i], i); ctx.rotate(-Math.PI / 2);
      ctx.restore();
    }
    const tag = (y, w, a, hh = 104) => { if (a <= 0.01) return; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, 540 - w / 2 + 5, y - hh / 2 + 6, w, hh, 12); ctx.fill(); ctx.fillStyle = C.cream; ctx.strokeStyle = C.line; ctx.lineWidth = 4; rrect(ctx, 540 - w / 2, y - hh / 2, w, hh, 12); ctx.fill(); ctx.stroke(); ctx.restore(); };
    const la = P(t, 36.42, 36.7) * ex; if (la > 0.01) { ctx.save(); ctx.globalAlpha = la; ctx.fillStyle = C.cream; ctx.strokeStyle = C.line; ctx.lineWidth = 4; rrect(ctx, 40, Y(20), 280, 84, 14); ctx.fill(); ctx.stroke(); txt(ctx, '13 CARDS', 180, Y(80), 52, C.ink, 'center', DISP, 400, 0.05); ctx.restore(); }
    const dOut = ex * (1 - P(t, 42.8, 43.1));
    tag(Y(446), 470, P(t, 37.8, 38.0) * dOut, 124);
    for (let d = 0; d < 10; d++) { const k = pop(t, 37.95 + d * 0.059) * dOut; if (k > 0.01) die(ctx, 340 + d * 44.5, Y(421), 0.4 * k, 0, 1 + (d % 6)); }
    const da = P(t, 38.5, 38.8) * dOut; if (da > 0.01) { ctx.save(); ctx.globalAlpha = da; txt(ctx, '10 DAYS', 540, Y(491), 42, C.ink, 'center', DISP, 400, 0.08); ctx.restore(); }
    const ba = P(t, 43.8, 44.1) * ex; tag(Y(450), 470, ba, 96); if (ba > 0.01) { ctx.save(); ctx.globalAlpha = ba; txt(ctx, 'BONUS ON EACH', 540, Y(466), 46, C.ink, 'center', DISP, 400, 0.06); ctx.restore(); }
  }
  gameCard(ctx, t, 51.94, 53.3, 540, CY, CWD, CHT, { stock: 'orange', title: 'Use It for Travel', foot: 'Advance to Any Trip', il: 'traveler' });
  gameCard(ctx, t, 53.45, 55.2, 540, CY, CWD, CHT, { stock: 'yellow', title: `Up to ${Math.round(lerp(7, 21, P(t, 53.45, 53.98, E.inOutSine)))}x Value`, titleSize: 54, foot: 'From the Same Points', il: 'moneyman' });
}
function endCard(ctx, t, IMG) {
  if (t < 56.6) return;
  ctx.fillStyle = C.felt; ctx.fillRect(0, 0, DW, DH);
  const k = clamp(pop(t, 56.95, { stiffness: 200, damping: 16 }));
  gameCard(ctx, t, 56.8, 70, 540, 900, 920, 580, { stock: 'yellow', title: 'Learn the Playbook', titleSize: 64, foot: 'creditcounselelite.com', footSize: 34, rot: -0.02, il: 'badge' });
  ctx.save(); ctx.globalAlpha = P(t, 58.0, 58.4) * 0.8; txt(ctx, 'Education and coaching. Not a lender. Individual results vary.', 540, 1680, 22, '#FFFFFF', 'center', UI, 500); ctx.restore();
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

// ------------------------------------------------------------------ captions: a small game-card tag
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
  chunks.forEach((c, i) => { c.until = Math.min(chunks[i + 1] ? chunks[i + 1].start : c.end + 0.5, c.end + 0.6); c.text = c.text.replace(/[,]$/, '').toUpperCase(); });
  return chunks;
}
function captionsOld(ctx, t, fh) {
  if (t > 56.6) return;
  const c = CAPS.find((c) => t >= c.start - 0.04 && t < c.until);
  if (!c) return;
  const f = clamp((fh - SEAM) / (DH - SEAM)), y = lerp(DH - fh, 1600, f), k = clamp(pop(t, c.start - 0.04, { stiffness: 420, damping: 26 }));
  ctx.save(); ctx.font = font(50, 400, DISP); ctx.letterSpacing = '2px'; const w = ctx.measureText(c.text).width + 60;
  ctx.translate(540, y); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -w / 2 + 5, -40 + 6, w, 80, 10); ctx.fill();
  ctx.fillStyle = C.cream; ctx.strokeStyle = C.line; ctx.lineWidth = 3.5; rrect(ctx, -w / 2, -40, w, 80, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText(c.text, 0, 18); ctx.restore();
}

// ------------------------------------------------------------------ footage
let FOOT = null; const FCACHE = new Map();
async function loadFrame(t) {
  const idx = Math.min(SRC_FRAMES, Math.max(1, Math.floor(t * SRC_FPS) + 1));
  if (!FCACHE.has(idx)) { const im = new Image(); im.src = `assets/footage/f_${String(idx).padStart(5, '0')}.jpg`; try { await im.decode(); } catch { return; } FCACHE.set(idx, im); while (FCACHE.size > 8) FCACHE.delete(FCACHE.keys().next().value); }
  FOOT = FCACHE.get(idx);
}
function pushIn(t) { for (const [a, b] of FULL_WINDOWS) if (t >= a - 0.5 && t < b + 0.8) return Math.pow(1.1, P(t, a, b + 0.8, E.inOutSine)); return 1; }
const near = (t) => FH_KEYS.some(([k]) => t > k - 0.25 && t < k + 0.8) || MOVES.some(([t0, t1]) => t > t0 && t < t1 + 0.3);

M.film({
  fonts: [font(96, 400, 'Display'), font(46, 600, 'UI'), font(34, 500, 'UI'), font(100, 400, DISP), font(40, 500, UI), font(44, 700, CARD), font(30, 500, CARD)],
  images: Object.fromEntries([['badge', 'assets/badge.png'], ...['bill', 'teller', 'bankman', 'calendar2', 'tag2', 'hourglass2', 'ribbon2', 'couple2', 'bike', 'clerk', 'fan2', 'gift2', 'traveler', 'moneyman'].map((k) => ['il_' + k, `assets/il/${k}.png`])]),
  hits: HITS,
  samples: (t) => (near(t) ? 5 : 2),
  async init(ctx, IMG) { bakeBoard(IMG);
    Object.keys(IMG).forEach((k) => { if (k.startsWith('il_')) IL[k.slice(3)] = IMG[k]; }); IL.badge = IMG.badge;
    BILLS = [0, 300, 200, 40, 150].map((h) => { const im = IL.bill, c = canvas(im.width, im.height), x = c.getContext('2d'); x.filter = `hue-rotate(${h}deg) saturate(1.2)`; x.drawImage(im, 0, 0); return c; }); CAPS = buildCaptions(await fetch('assets/words.json').then((r) => r.json())); },
  prepare: (t) => loadFrame(t),
  draw(ctx, u, t, IMG) {
    const fh = footH(t); FH = fh;
    ctx.save(); ctx.scale(S, S);
    ctx.fillStyle = C.felt; ctx.fillRect(0, 0, DW, DH);
    if (fh < DH - 4 && t < 56.8) { world(ctx, t); overlays(ctx, t); }
    if (FOOT && fh > 1) {
      cover(ctx, FOOT, 0, DH - fh, DW, fh, { fx: 0.5, fy: lerp(0.25, 0.45, clamp((fh - SEAM) / (DH - SEAM))), zoom: pushIn(t) });
      if (fh < DH - 2) { ctx.fillStyle = C.line; ctx.fillRect(0, DH - fh - 3, DW, 6); }
    }
    endCard(ctx, t, IMG);
    captions(ctx, t, fh);
    const disc = (x, y, a, c) => { ctx.save(); ctx.font = font(20, 500, UI); ctx.fillStyle = c; ctx.textAlign = a; ctx.fillText('Individual results vary. Education only.', x, y); ctx.restore(); };
    if (CLAIM_FULL.some(([a, b]) => t > a + 0.3 && t < b) && fh > 1700) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 6; disc(540, 1860, 'center', '#fff'); ctx.restore(); }
    if ((t > 32.7 && t < 44.4) || (t > 49.9 && t < 55.3)) disc(1050, Y(40), 'right', 'rgba(255,255,255,0.75)');
    ctx.restore();
  },
});

// brand captions (black overlay, Poppins) — CCE Brand Style Guidelines 2025
function captions(ctx, t, fh) { BR.captions(ctx, t, fh, CAPS); }
