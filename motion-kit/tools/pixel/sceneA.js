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
      const w = walker(t, [[0.8, 214, 190], [1.95, 104, 142], [7.4, 104, 142], [8.0, 118, 156], [10.2, 118, 156]]);
      const point = t > 3.2 && t < 5.9;
      cast(ctx, [{ w, who: 'friend1', arms: point ? 'point' : null, flip: point ? false : null }]);
      if (t > 8.35) { const k1 = clamp(spring(t - 8.35, { stiffness: 380, damping: 15 })); spr(ctx, 'card', w.x, w.y - 50 + (1 - k1) * 6, false, clamp(k1 * 2));
        for (let j = 0; j < 2; j++) { const tj = 8.75 + j * 0.3; if (t < tj) continue; const kk = P(t, tj, tj + 0.32, E.outBack); spr(ctx, 'card', w.x + lerp(0, j ? 19 : -19, kk), w.y - 50 + lerp(0, 10, kk), false, clamp(kk * 2)); if (t < tj + 0.36) spr(ctx, 'sp' + Math.min(2, Math.floor((t - tj) / 0.12)), w.x + (j ? 26 : -26), w.y - 44); } }
      banner(HX, 'ALL GOOD', 22, 2, t, 1.3, 2.4);
      banner(HX, 'BUT YELLOW', 22, 2, t, 2.5, 4.0, '#F2C14E');
      banner(HX, 'MID-LOW 700S', 22, 2, t, 4.1, 5.9);
      banner(HX, 'AUTHORIZED', 26, 3, t, 8.4, 9.95); banner(HX, 'USERS', 52, 3, t, 8.55, 9.95, '#F2C14E');
    } else {
      const w = walker(t, [[12.95, 214, 200], [13.9, 132, 168], [END + 1, 132, 168]]);
      const got = t > 15.45, cheer = t > 16.35;
      cast(ctx, [{ w, who: 'friend1', arms: cheer ? 'up' : got ? 'carry' : null, flip: cheer || got ? false : null }]);
      for (let j = 0; j < 3; j++) { const tj = 14.4 + j * 0.3; if (t > tj && t < tj + 0.5) { const k = clamp((t - tj) / 0.5), e = E.inOutSine(k); spr(ctx, 'card', lerp(MON[0], w.x + 10, e), lerp(MON[1], w.y - 26, e) - Math.sin(Math.PI * e) * 22); } }
      if (t > 14.3 && t < 15.6) { const g = (Math.floor(t * 8) % 2) ? '#7FE6FF' : '#BFF3FF'; ctx.fillStyle = g; ctx.fillRect(MON[0] - 6, MON[1] - 4, 2, 2); }
      if (cheer) confetti(ctx, t, 16.4, w.x, w.y - 30);
      banner(HX, 'INDUSTRY ONLINE', 30, 2, t, 13.95, 15.3);
      banner(HX, 'SOLD ONLINE', 30, 3, t, 15.4, END - 0.15);
    }
  }
  if (sc === 'living') {
    const dad = { x: 60, y: 168, legs: 0, arms: 'down', flip: false }, mom = { x: 80, y: 178, legs: 0, arms: 'down', flip: false };
    const you = walker(t, [[10.0, 210, 190], [10.85, 120, 176], [END, 120, 176]]);
    const f2 = walker(t, [[12.05, 216, 210], [12.75, 152, 194], [END, 152, 194]]), bs = walker(t, [[12.45, 216, 182], [13.0, 168, 178], [END, 168, 178]]);
    const waveD = t > 10.85 && t < 11.3;
    cast(ctx, [{ w: dad, who: 'dad', arms: waveD ? (Math.floor(t * 7) % 2 ? 'wave0' : 'wave1') : t > 11.3 ? 'down' : 'down' }, { w: mom, who: 'mom', arms: t > 11.0 && t < 11.6 ? 'wave1' : 'down' },
      { w: you, who: 'friend1', arms: t > 11.6 ? 'carry' : null, flip: t > 10.85 ? true : null }, t > 12.05 ? { w: f2, who: 'friend2', flip: t > 12.75 ? true : null } : null, t > 12.45 ? { w: bs, who: 'av' } : null]);
    cardArc(ctx, t, 11.15, 0.45, [68, 146], [112, 150]); cardArc(ctx, t, 12.75, 0.3, [146, 168], [118, 150], 10);
    for (const tt of [11.6, 13.05]) if (t > tt && t < tt + 0.36) spr(ctx, 'sp' + Math.min(2, Math.floor((t - tt) / 0.12)), 118, 140);
    banner(HX, 'PARENTS', 30, 3, t, 10.9, 12.1);
    banner(HX, 'FRIENDS', 26, 3, t, 12.2, 12.95); banner(HX, 'FAMILY', 52, 3, t, 12.6, 12.95, '#F2C14E');
  }
}
const CAMK = [
  [0.0, 150, 70, 5.2], [0.9, 150, 70, 5.2], [1.3, 152, 68, 5.4], [3.3, 158, 70, 5.5], [5.9, 150, 72, 5.3], [7.3, 128, 95, 5.6], [8.4, 118, 108, 6.2], [10.05, 118, 120, 7.4],
  [10.05, 120, 150, 7.4], [10.8, 104, 145, 5.6], [12.0, 112, 150, 6.0], [12.7, 130, 150, 5.4], [13.0, 140, 160, 7.0],
  [13.0, 150, 135, 7.0], [13.8, 145, 120, 5.8], [15.3, 145, 118, 6.2], [16.2, 160, 110, 5.8], [16.8, 160, 110, 6.0],
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
