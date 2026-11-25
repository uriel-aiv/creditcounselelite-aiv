// ================================================================== VSL #2 "Bus boy" (31.4 s) //SRC_FRAMES=816
const ROOMS = ['diner', 'city', 'vault', 'penthouse', 'office', 'airfield'];
const T = { city: 9.45, vault: 14.9, pent: 17.45, office: 20.6, air: 26.95 };
const CUTS = [T.city, T.vault, T.pent, T.office, T.air];
const DISC = [9.6];
const MON = [151, 100];
function scene(t) { return t < T.city ? 'diner' : t < T.vault ? 'city' : t < T.pent ? 'vault' : t < T.office ? 'penthouse' : t < T.air ? 'office' : 'airfield'; }
const LOOKN = ['friend1', 'friend2', 'dad', 'mom', 'busboy', 'av'];
// members stand on the open marble floor only (rows in front of the sofa, table and bar), never on furniture
const CROWD = []; [[160, [38, 58, 78, 98, 122, 142, 162, 182]], [174, [56, 76, 96, 126, 146, 166]], [188, [72, 92, 128, 148]], [202, [94, 116, 136]]].forEach(([y, xs], ri) => xs.forEach((x, k) => CROWD.push([x + (ri % 2) * 3, y, LOOKN[(ri * 3 + k) % 6], 18.55 + hash01(ri * 9 + k, 21) * 1.6])));
const PINS = [[48, 76], [104, 52], [160, 84], [188, 118], [24, 120]];
function drawPixels(ctx, t) {
  ctx.clearRect(0, 0, G, G); HX.clearRect(0, 0, VW, VW);
  const sc = scene(t); ctx.drawImage(BG[sc], 0, 0); ambient(ctx, sc, t);
  if (sc === 'diner') {
    // the busboy scrubs a table; two diners walk past without a look; he thinks of the playbook he never got
    const w = walker(t, [[0, 98, 150], [8.75, 98, 150], [9.5, 120, 196]]);
    const scrub = (t > 0.3 && t < 2.6) || (t > 4.8 && t < 6.3);
    cast(ctx, [{ w: { x: 119, y: 146 }, draw: () => spr(ctx, 'ctable', 119, 152) }, { w, who: 'busboy', arms: scrub ? (Math.floor(t * 6) % 2 ? 'scrub0' : 'scrub1') : null, flip: scrub ? false : null },
      t < 6.4 ? popIn(ctx, t, 4.85, 126, 116, 'av', t > 5.6) : null, t < 6.5 ? popIn(ctx, t, 5.05, 146, 124, 'friend2', t > 5.7) : null]);
    for (const [tx, x, y] of [[6.4, 126, 116], [6.5, 146, 124]]) if (t > tx && t < tx + 0.3) spr(ctx, 'sp' + Math.min(2, Math.floor((t - tx) / 0.1)), x, y - 18);
    if (scrub) for (let k = 0; k < 3; k++) { const ph = (t * 2.4 + k / 3) % 1; ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = 1 - ph; ctx.fillRect(r(w.x + 15 + k * 3), r(w.y - 22 - ph * 10), 1, 1); ctx.globalAlpha = 1; }   // soap bubbles
    iconBubble(ctx, w.x - 18, w.y - 44, clamp(spring(t - 2.7, { stiffness: 400, damping: 16 })) * (t < 4.5 ? 1 : 0), (x, y) => spr(ctx, 'wallet', x, y + 5));
    if (t > 3.2 && t < 4.5) { pixText(ctx, '0', w.x - 12, w.y - 63, 1, '#D6342B'); }
    iconBubble(ctx, w.x - 18, w.y - 44, clamp(spring(t - 6.55, { stiffness: 400, damping: 16 })) * (t > 6.55 && t < 8.8 ? 1 : 0), (x, y) => spr(ctx, 'book', x, y + 5), P(t, 7.4, 7.6));
  }
  if (sc === 'city') {
    // "today": the same man, now in the suit, in the plaza of a block of buildings; gold pins drop on the roofs
    const w = walker(t, [[9.4, 150, 210], [10.4, 104, 182], [END, 104, 182]]);
    const cheer = t > 10.45 && t < 11.3;
    cast(ctx, [{ w, who: 'av', arms: cheer ? 'up' : t > 12.7 && t < 14.6 ? (Math.floor(t * 7) % 2 ? 'wave0' : 'wave1') : null, flip: cheer || t > 12.7 ? false : null }]);
    PINS.forEach(([x, y], i) => { const t0 = 10.55 + i * 0.16; if (t < t0) return; const k = clamp((t - t0) / 0.22), b = t > t0 + 0.22 ? Math.max(0, Math.sin((t - t0 - 0.22) * 20)) * 3 * Math.exp(-(t - t0 - 0.22) * 6) : 0; spr(ctx, 'pin', x, y - (1 - k) * (1 - k) * 40 - b - Math.sin(t * 3 + i) * 1); if (t > t0 + 0.22 && t < t0 + 0.58) spr(ctx, 'sp' + Math.min(2, Math.floor((t - t0 - 0.22) / 0.12)), x, y - 12); });
    banner(HX, '14 MILLION', 26, 3, t, 10.4, 12.6, '#F2C14E');
  }
  if (sc === 'vault') {
    // "cash flow 50,000 a month": a brick drops for each month tick of the clock
    const w = walker(t, [[14.9, 96, 178], [END, 96, 178]]);
    for (let i = 0; i < 12; i++) { const tl = 15.45 + i * 0.13; if (t < tl - 0.2) continue; const row = i < 5 ? 0 : i < 9 ? 1 : i < 11 ? 2 : 3, col = i < 5 ? i : i < 9 ? i - 5 : i < 11 ? i - 9 : 0; let x = 118 + col * 8 + row * 4, y = 178 - row * 4; const fk = clamp((tl - t) / 0.2); y -= fk * fk * 60; spr(ctx, 'cash', x, y + 4); }
    cast(ctx, [{ w, who: 'av', arms: t > 16.0 ? 'up' : null, flip: false }]);
    if (t > 16.05) confetti(ctx, t, 16.1, w.x, w.y - 30);
    banner(HX, '50,000 A MONTH', 26, 2, t, 16.0, 17.3, '#9BD38A');
  }
  if (sc === 'penthouse') {
    // "since 2017, over 4,000 members": the room fills up, member by member
    const list = [{ w: { x: 111, y: 186, legs: 0, arms: 'down', flip: false }, who: 'av', arms: t > 19.3 ? (Math.floor(t * 7) % 2 ? 'wave0' : 'wave1') : null }];
    for (const [x, y, who, t0] of CROWD) { const c = popIn(ctx, t, t0, x, y, who, x > 110); if (c) list.push(c); }
    cast(ctx, list);
    const n = Math.round(4000 * P(t, 19.2, 20.35, (x) => x) / 50) * 50;
    if (t > 19.2) banner(HX, `${n.toLocaleString('en-US')}+ MEMBERS`, 30, 2, t, 19.2, 20.5, n >= 4000 ? '#F2C14E' : '#FFFFFF');
  }
  if (sc === 'office') {
    // "up to 500,000 … as low as 0% … without documentation": cards fan out of the screen; the paperwork blows away
    const w = walker(t, [[20.6, 222, 204], [21.6, 150, 186], [END, 150, 186]]);
    cast(ctx, [{ w, who: 'av', arms: t > 23.5 && t < 25.2 ? 'up' : t > 21.8 ? 'carry' : null, flip: t > 21.6 ? false : null }]);
    for (let j = 0; j < 5; j++) { const tj = 21.85 + j * 0.2; if (t < tj) continue; const e = E.outBack(clamp((t - tj) / 0.35)), tx = 70 + j * 18, ty = 118 - Math.abs(j - 2) * 4; spr(ctx, 'card', lerp(MON[0], tx, e), lerp(MON[1], ty, e) - Math.sin(Math.PI * clamp((t - tj) / 0.35)) * 10, false, 1 - P(t, 26.6, 26.9)); }
    for (let d = 0; d < 6; d++) { const tb = 25.4 + d * 0.06; let x = 168 + (d % 2) * 3, y = 126 - d * 3; if (t > tb) { const k = t - tb; x += k * 140; y -= k * 60 - k * k * 40; } if (x < G + 20) spr(ctx, 'st3', x, y, false, t > tb ? clamp(1 - (t - tb) * 1.2) : 1); }
    banner(HX, 'UP TO 500,000', 26, 2, t, 21.8, 23.35, '#F2C14E');
    banner(HX, 'AS LOW AS 0%', 26, 2, t, 23.5, 25.2);
  }
  if (sc === 'airfield') {
    flock(ctx, t, 18, 1, 3);
    const w = walker(t, [[26.9, 150, 202], [28.6, 92, 173], [29.5, 78, 166], [END, 78, 166]]);
    const wave = t > 29.5;
    cast(ctx, [{ w, who: 'av', arms: wave ? (Math.floor(t * 7) % 2 ? 'wave0' : 'wave1') : 'carry', flip: wave ? false : null }]);
    if (!wave) spr(ctx, 'case', w.x + (w.flip ? -8 : 8), w.y - 3 - Math.floor(t * 8) % 2, w.flip);
    if (t > 27.5 && t < 29.3) { const b = Math.abs(Math.sin((t - 27.5) * 6)) * 6; HX.drawImage(SPR.arrow, r(VW / 2 - 6), r(150 + b)); }
  }
}
const CAMK = [
  [0.0, 112, 135, 9], [4.8, 116, 125, 6.2], [6.3, 120, 120, 5.4], [8.8, 112, 125, 6.0], [9.45, 118, 150, 8],
  [9.45, 110, 150, 9], [10.3, 104, 130, 5.4], [12.6, 104, 140, 6.0], [14.9, 104, 160, 7.4],
  [14.9, 120, 140, 7.0], [15.8, 122, 135, 5.6], [17.45, 110, 150, 7.4],
  [17.45, 110, 150, 7.0], [18.45, 110, 160, 6.0], [20.6, 110, 160, 7.5],
  [20.6, 150, 130, 9], [22.5, 130, 125, 9], [24.45, 128, 115, 5.4], [26.95, 128, 120, 7],
  [26.95, 110, 150, 7], [27.3, 100, 160, 9], [31.4, 86, 160, 9],
];
const END = 31.39; window.__END = END;
const FH_KEYS = [[0, 0], [4.8, SEAM], [9.4, 0], [10.3, SEAM], [18.45, 0], [24.45, SEAM], [27.3, 0], [END, 0]];
const FULL_WINDOWS = [];
function buildHits() {
  const h = [...cutHits(), ...steps(4.7, 7.4, 0.06), ...steps(8.75, 9.45), ...steps(9.45, 10.4), ...steps(20.6, 21.6), ...steps(27.0, 29.5)];
  for (let x = 0.3; x < 2.6; x += 0.33) h.push([x, 'scrub', 'tick', { gain: 0.12 }]);
  h.push([2.7, 'bubble', 'pop', { pitch: 'E5', gain: 0.2 }], [3.2, 'zero', 'boing', { pitch: 'E4', to: 'C4', gain: 0.22 }], [6.55, 'bubble', 'pop', { pitch: 'E5', gain: 0.2 }], [7.45, 'no', 'boing', { pitch: 'E4', to: 'C4', gain: 0.22 }]);
  h.push([9.6, 'today', 'bell', { pitch: 'C6', gain: 0.3 }]); PINS.forEach((_, i) => h.push([10.77 + i * 0.16, 'pin', 'tok', { pitch: ['C5', 'E5', 'G5', 'C6', 'E6'][i], gain: 0.22 }]));
  for (let i = 0; i < 12; i++) h.push([15.45 + i * 0.13, 'brick', 'tok', { pitch: ['C5', 'D5', 'E5', 'G5'][i % 4], gain: 0.18 }]);
  h.push([16.0, '50,000', 'bell', { pitch: 'G5', gain: 0.28 }]);
  CROWD.forEach(([, , , t0], i) => { if (i % 2 === 0) h.push([t0, 'member', 'blip', { pitch: ['C6', 'E6', 'G6'][i % 3], gain: 0.1 }]); });
  h.push([20.35, '4,000', 'bell', { pitch: 'C6', gain: 0.3 }]);
  for (let j = 0; j < 5; j++) h.push([21.85 + j * 0.2, 'card', 'click', { gain: 0.25 }]);
  h.push([23.5, '0%', 'pop', { pitch: 'C6', gain: 0.3 }], [25.4, 'papers', 'whoosh', { len: 0.5, from: 600, to: 2600, gain: 0.22 }], [27.5, 'arrow', 'blip', { pitch: 'E6', gain: 0.22 }], [29.5, 'wave', 'blip', { pitch: 'G6', gain: 0.2 }]);
  return h.sort((a, b) => a[0] - b[0]);
}
