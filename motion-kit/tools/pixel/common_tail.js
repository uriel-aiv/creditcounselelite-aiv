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
