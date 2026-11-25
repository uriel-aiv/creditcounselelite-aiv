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
