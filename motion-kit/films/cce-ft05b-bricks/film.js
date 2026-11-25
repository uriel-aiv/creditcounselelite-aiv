// CCE — "05B Toy Brick Multicolor" founder split-screen, in 3-D. Pure function of time: window.seek(t) paints frame t.
// Grid = seconds (u === t). Cut to the speaker's word timings. Motion on top (three.js bricks), founder below.
// Look: classic multicolour toy bricks seen isometrically, riso-printed on cream paper (grain, halftone, slight
// misregistration), yellow comet trails behind moving bricks, ink pop lines on landings, yellow starbursts, chunky black lettering, a yellow
// sticker pill with a red arrow box for captions. Bricks hop, stack, explode and re-snap; the camera keeps moving.
import * as M from './lib/motion.js';
import * as BR from './lib/brand.js';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const { W, H, E, prog, clamp, lerp, spring, springKeys, SPRING, wobble, font, mulberry32, cover, rrect } = M;
const DW = 1080, DH = 1920, S = W / DW, TAU = M.TAU;
const C = { maroon: '#6B0505', green: '#266235', teal: '#008C96', pbBlue: '#114BA7', gold: '#CB9938', light: '#ADC8E3',  paper: '#EFE6D3', ink: '#151515', red: '#004AAD', yellow: '#CB9938' };
const DISPLAY = 'Display', UI = 'UI';
const SRC_FPS = 24000 / 1001, SRC_FRAMES = 465;
const SEAM = 980, PANEL_H = 990;

const HITS = [
  [1.25, 'boxes', 'click', { gain: 0.45 }], [1.43, 'boxes', 'click', { gain: 0.45 }], [1.61, 'boxes', 'click', { gain: 0.45 }], [2.55, 'yellow', 'thud', { gain: 0.6 }],
  [4.15, '700s', 'pop', { pitch: 'C6', gain: 0.4 }], [5.0, 'wobble', 'tick', { gain: 0.3 }], [7.45, 'card', 'thud', { gain: 0.5 }],
  [8.75, 'user', 'click', { gain: 0.5 }], [8.9, 'user', 'click', { gain: 0.5 }], [9.35, 'yellow box', 'thud', { gain: 0.45 }], [10.0, 'turns green', 'bell', { pitch: 'E6', gain: 0.4 }], [10.9, 'parent', 'click', { gain: 0.45 }], [11.05, 'parent', 'click', { gain: 0.45 }],
  [11.05, 'trail', 'whoosh', { len: 0.6, from: 600, to: 2200, gain: 0.25 }], [12.2, 'friend', 'click', { gain: 0.45 }], [12.6, 'family', 'click', { gain: 0.45 }],
  [14.3, 'screen', 'thud', { gain: 0.55 }], [16.85, 'to end', 'whoosh', { len: 0.5, from: 500, to: 2400, gain: 0.4 }], [17.1, 'badge', 'thud', { gain: 0.7 }],
];

// ------------------------------------------------------------------ helpers
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);
const P = (t, a, b, ease = E.inOutCubic) => ease(prog(t, a, b));
const antic = (t, t0, dur = 0.2) => { const p = prog(t, t0 - dur, t0 + 0.02); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; };
const outK = (t, t0, d = 0.3) => 1 - E.inBack(prog(t, t0, t0 + d), 1.9);
let FH = DH;
const Y = (y) => (FH >= SEAM ? y - (FH - SEAM) : y + (SEAM - FH) * 0.48);
// a drop-in: height above the landing spot (with one bounce) and a squash factor
function drop(t, t0, h = 6) {
  if (t < t0 - 0.35) return { y: h + 20, sq: 0, vis: false };
  const k = prog(t, t0 - 0.35, t0); const y = h * (1 - k * k);
  const land = t > t0 ? wobble(t - t0, 3.2, 7) : 0;
  return { y: t < t0 ? y : Math.max(0, 0.3 * Math.sin(Math.PI * clamp((t - t0) / 0.22)) * Math.exp(-(t - t0) * 3)), sq: 0.12 * land, vis: true };
}

// ------------------------------------------------------------------ bricks
const COL = { red: 0x8A0A0A, teal: 0x00A3AE, blue: 0x0052C2, yellow: 0xE0A93A, white: 0xE6E2D8, green: 0x266235, black: 0x23292E, brown: 0x7C4A26, tan: 0xE6CF98, gold: 0xCB9938, sky: 0xADC8E3, navy: 0x114BA7, line: 0x8E959C, silver: 0xC9CDD2, pale: 0xB9D3EC };
const MAT = {}, GEO = {};
function mat(c) { return MAT[c] || (MAT[c] = new THREE.MeshStandardMaterial({ color: COL[c] ?? c, roughness: 0.42, metalness: 0, envMapIntensity: 0.18 })); }
// w x d studs, h (1.2 brick, 0.4 plate); origin at bottom centre
function geo(w, d, h = 1.2, studs = true) {
  const key = `${w}x${d}x${h}${studs}`; if (GEO[key]) return GEO[key];
  const g = [new THREE.BoxGeometry(w - 0.04, h, d - 0.04).translate(0, h / 2, 0)];
  if (studs) for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) g.push(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 16).translate(i + 0.5 - w / 2, h + 0.11, j + 0.5 - d / 2));
  return (GEO[key] = mergeGeometries(g));
}
function roundGeo(r, h = 1.2) {
  const key = `r${r}x${h}`; if (GEO[key]) return GEO[key];
  return (GEO[key] = mergeGeometries([new THREE.CylinderGeometry(r - 0.02, r - 0.02, h, 28).translate(0, h / 2, 0), new THREE.CylinderGeometry(0.3, 0.3, 0.22, 16).translate(0, h + 0.11, 0)]));
}
const B = (w, d, c, h = 1.2, studs = true) => new THREE.Mesh(geo(w, d, h, studs), mat(c));
const R = (r, c, h = 1.2) => new THREE.Mesh(roundGeo(r, h), mat(c));
// a tile on a plate, by stud cell: (x0, z0) top-left cell, w x d cells, on a plate of size W x D
function tileOn(g, W, D, x0, z0, w, d, c) { const m = B(w, d, c, 0.4, false); m.position.set(x0 + w / 2 - W / 2, 0.4, z0 + d / 2 - D / 2); g.add(m); return m; }
// a credit card built like real bricks: a 6x4 plate covered in tiles (chip, stripe); `open` leaves studs exposed
function cardModel(c, open = 'coin') {
  const g = new THREE.Group(); g.add(B(6, 4, c, 0.4, true));
  const stripe = c === 'white' || c === 'yellow' ? 'silver' : 'white';
  tileOn(g, 6, 4, 0, 1, 2, 2, 'yellow');            // chip
  tileOn(g, 6, 4, 0, 0, 2, 1, c); tileOn(g, 6, 4, 0, 3, 2, 1, c);
  if (open === 'stack') {                             // 2x2 studs open at cells x3-4, z1-2 for the credit stack
    tileOn(g, 6, 4, 2, 0, 1, 4, c); tileOn(g, 6, 4, 5, 0, 1, 4, c);
    tileOn(g, 6, 4, 3, 0, 2, 1, c); tileOn(g, 6, 4, 3, 3, 2, 1, stripe);
  } else {                                            // one stud open at cell (5,0) for a coin
    tileOn(g, 6, 4, 2, 0, 3, 1, c); tileOn(g, 6, 4, 2, 1, 4, 1, c); tileOn(g, 6, 4, 2, 2, 4, 1, c); tileOn(g, 6, 4, 2, 3, 4, 1, stripe);
  }
  return g;
}
// a paper form built from a 4x6 plate and tiles: blue header, grey text lines
function docModel(i) {
  const g = new THREE.Group(); const paper = ['white', 'tan', 'white', 'pale'][i % 4];
  g.add(B(4, 6, paper, 0.4, true));
  tileOn(g, 4, 6, 0, 0, 2, 2, i % 2 ? 'blue' : 'red'); tileOn(g, 4, 6, 2, 0, 2, 1, paper); tileOn(g, 4, 6, 2, 1, 2, 1, 'line');
  tileOn(g, 4, 6, 0, 2, 4, 1, paper); tileOn(g, 4, 6, 0, 3, 4, 1, 'line'); tileOn(g, 4, 6, 0, 4, 3, 1, 'line'); tileOn(g, 4, 6, 3, 4, 1, 1, paper); tileOn(g, 4, 6, 0, 5, 4, 1, paper);
  return g;
}
// a brick sun: a round studded disc facing the camera, with 12 plate rays (long yellow / short gold)
function sunModel() {
  const g = new THREE.Group();
  const disc = [new THREE.CylinderGeometry(1.6, 1.6, 0.6, 40).rotateX(Math.PI / 2)];
  [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([x, y]) => disc.push(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 16).rotateX(Math.PI / 2).translate(x, y, 0.41)));
  g.add(new THREE.Mesh(mergeGeometries(disc), mat('yellow')));
  g.userData.rays = Array.from({ length: 12 }, (_, i) => {
    const piv = new THREE.Group(); piv.rotation.z = (i / 12) * TAU;
    const long = i % 2 === 0, m = B(1, long ? 2 : 1, long ? 'yellow' : 'gold', 0.4, true);
    m.rotation.x = Math.PI / 2; m.position.set(0, 2.0 + (long ? 1 : 0.5), -0.2);
    piv.add(m); g.add(piv); return m;
  });
  return g;
}
// set a mesh/group from scalar params (pure)
function put(o, x, y, z, s = 1, ry = 0, sq = 0, rx = 0, rz = 0) {
  o.visible = s > 0.002; o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(s * (1 + sq), s * (1 - sq), s * (1 + sq));
}

// ------------------------------------------------------------------ the 3-D world (built once)
let RD, SCN, CAM, GLC, G = {};
function buildWorld() {
  GLC = document.createElement('canvas'); GLC.width = W; GLC.height = Math.round(PANEL_H * S);
  RD = new THREE.WebGLRenderer({ canvas: GLC, antialias: true, alpha: true, preserveDrawingBuffer: true });
  RD.setPixelRatio(1); RD.setSize(GLC.width, GLC.height, false); RD.outputColorSpace = THREE.SRGBColorSpace;
  SCN = new THREE.Scene(); SCN.environment = new THREE.PMREMGenerator(RD).fromScene(new RoomEnvironment(), 0.04).texture;
  SCN.add(new THREE.HemisphereLight(0xffffff, 0x9a8c74, 0.7));
  const key = new THREE.DirectionalLight(0xfff3e6, 2.8); key.position.set(-6, 12, 8); SCN.add(key);
  const rim = new THREE.DirectionalLight(0xdfe8ff, 0.7); rim.position.set(8, 5, -6); SCN.add(rim);
  CAM = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 400);
  const add = (name, o) => { SCN.add(o); return o; };
  // B1: card + credit stack -> bank baseplate; sun
  G.card = add('card', cardModel('blue', 'stack'));
  G.credit = [0, 1, 2, 3, 4].map(() => add('c', B(2, 2, 'red')));
  G.base = add('base', B(6, 6, 'green', 0.4));
  // bank: front step, 4 round columns, entablature, stepped roof, gold coin sign
  G.bank = {
    step: add('bs', B(6, 2, 'white', 0.4)),
    cols: [2.5, 4.5, 5.5, 7.5].map(() => add('bc', R(0.48, 'white', 2.4))),
    top: add('bt', B(6, 6, 'white', 0.4)),
    roof: [6, 4, 2].map((w) => add('br', B(w, 6, 'navy', 0.4))),
    sign: add('bg', R(0.6, 'gold', 0.4)),
  };
  G.sun = add('sun', sunModel());
  // B2: 10x10 plate + red 1x1s
  G.plate = add('plate', B(10, 10, 'white', 0.4)); G.fee = [0, 1, 2, 3, 4].map(() => add('f', B(1, 1, 'red')));
  // B3: a row of 24 bricks, extra blocks on 18
  G.row = Array.from({ length: 24 }, () => add('r', B(1, 2, 'white')));
  G.rowLit = Array.from({ length: 24 }, () => add('rl', B(1, 2, 'blue')));
  G.tower = [0, 1, 2].map(() => add('t', B(1, 2, 'yellow')));
  // B4: assembly stack + two brick people
  G.stack = [[8, 'blue'], [6, 'red'], [4, 'yellow'], [2, 'white']].map(([w, c]) => add('s', B(w, 2, c)));
  G.people = [['teal', 'blue'], ['green', 'navy']].map(([torso, legs]) => { const g = new THREE.Group(); const l = B(2, 1, legs); const tb = B(2, 1, torso); tb.position.y = 1.2; const hd = R(0.62, 'yellow'); hd.position.y = 2.4; g.add(l, tb, hd); return add('p', g); });
  // B5: a stack of white plates (paperwork)
  G.papers = Array.from({ length: 8 }, (_, i) => add('pp', docModel(i)));
  // B6: 13 card tiles with chips, 10 day markers, 13 coins
  const cc = ['blue', 'red', 'teal', 'green', 'white', 'yellow', 'navy'];
  G.cards = Array.from({ length: 13 }, (_, i) => add('cd', cardModel(cc[i % cc.length])));
  G.days = Array.from({ length: 10 }, () => add('d', R(0.48, 'white', 0.8)));
  G.coins = Array.from({ length: 13 }, () => add('co', R(0.48, 'gold', 0.4)));
  // B7: island + palm + coin columns
  G.water = add('w', B(12, 12, 'sky', 0.4)); G.sand = add('sa', B(6, 6, 'tan', 0.4));
  G.trunk = Array.from({ length: 5 }, () => add('tr', R(0.48, 'brown')));
  G.leaves = Array.from({ length: 4 }, () => add('lv', B(1, 4, 'green', 0.4)));
  G.coins21 = Array.from({ length: 21 }, () => add('c21', R(0.6, 'gold', 0.4)));
  // footage test (Video 24): six profile boxes, a card, brick people, an online-store screen
  G.boxes = Array.from({ length: 6 }, (_, i) => add('bx', B(2, 2, i === 5 ? 'yellow' : 'green')));
  G.auCard = add('auc', cardModel('blue'));
  G.folk = [['red', 'navy'], ['teal', 'blue'], ['yellow', 'navy'], ['green', 'blue'], ['white', 'navy']].map(([torso, legs]) => { const g = new THREE.Group(); const l = B(2, 1, legs); const tb = B(2, 1, torso); tb.position.y = 1.2; const hd = R(0.62, 'yellow'); hd.position.y = 2.4; g.add(l, tb, hd); return add('fk', g); });
  G.fixY = add('fy', B(2, 2, 'yellow')); G.fixG = add('fg', B(2, 2, 'green'));
  G.screen = add('scr', (() => { const g = new THREE.Group(); g.add(B(6, 1, 'black', 1.2)); const sc = B(6, 1, 'black', 3.6, false); sc.position.set(0, 1.2, -0.0); g.add(sc); const fc = B(5, 0.2, 'blue', 2.8, false); fc.position.set(0, 1.6, 0.5); g.add(fc); return g; })());
  hideAll();
}
const hideAll = () => SCN.children.forEach((o) => { if (!o.isLight) o.visible = false; });

// ------------------------------------------------------------------ camera: keyed target/zoom with a spring, extra yaw for orbits
const rowX = (m) => -18 + (m - 1) * 1.56;
const CAMK = [[0, [0, 0.6, 0], 1.3], [4.2, [0.6, 0.6, 0], 1.45], [7.2, [0, 1.6, 0], 1.6], [10.6, [0, 1.6, 0.8], 1.3], [14.1, [0, 2.0, -1.2], 1.25]];
function setCamera(t) {
  const v = springKeys(t, CAMK.map(([a, tg, z]) => [a, [...tg, z]]), { stiffness: 55, damping: 13 });
  const yaw = 0.785 + 0.06 * Math.sin(t * 0.35) + 0.5 * P(t, 10.6, 14.0, E.inOutSine);
  const pitch = 0.58 + 0.03 * Math.sin(t * 0.27);
  const hh = 12 / v[3], hw = hh * (GLC.width / GLC.height);
  CAM.left = -hw; CAM.right = hw; CAM.top = hh; CAM.bottom = -hh; CAM.updateProjectionMatrix();
  const r = 60;
  CAM.position.set(v[0] + r * Math.cos(pitch) * Math.sin(yaw), v[1] + r * Math.sin(pitch), v[2] + r * Math.cos(pitch) * Math.cos(yaw));
  CAM.lookAt(v[0], v[1], v[2]);
  CAM.updateMatrixWorld();
}
const V = new THREE.Vector3();
function proj(x, y, z) { V.set(x, y, z).project(CAM); return [(V.x + 1) / 2 * DW, Y((1 - V.y) / 2 * PANEL_H)]; }

// ------------------------------------------------------------------ beats (each sets its meshes from t)
const OV = { under: [], over: [] };     // 2-D underlay/overlay jobs computed per frame
function b1(t) {
  if (t < 1.1 || t > 7.0) return;
  const k = outK(t, 6.6);
  const dc = drop(t, 1.3), db = drop(t, 1.42);
  put(G.card, -5, dc.y, 1, k, 0, dc.sq);
  put(G.base, 5, db.y, 0, k, 0, db.sq);
  // credit stack: drops in, then each brick hops (top first) onto the baseplate
  for (let i = 0; i < 5; i++) {
    const di = drop(t, 1.55 + i * 0.07, 7);
    const j = 4 - i, th = 2.2 + j * 0.35, k2 = P(t, th, th + 0.5, E.inOutSine);
    const from = [-4, 0.4 + i * 1.2, 1], to = j < 3 ? [3 + j * 2, 0.4, -1] : [4 + (j - 3) * 2, 1.6, -1];
    const a = antic(t, th, 0.15);
    let x = lerp(from[0], to[0], k2), y = lerp(from[1], to[1], k2) + Math.sin(Math.PI * k2) * 5 + di.y, z = lerp(from[2], to[2], k2);
    const land = t > th + 0.5 ? 0.12 * wobble(t - th - 0.5, 3, 7) : 0;
    put(G.credit[i], x, y, z, k * (di.vis ? 1 : 0), Math.PI * k2, a * 0.15 + land + di.sq);
    if (t > th && t < th + 0.85) OV.over.push({ type: 'trail', fn: (u) => [lerp(from[0], to[0], u), lerp(from[1], to[1], u) + Math.sin(Math.PI * u) * 5 + 0.6, lerp(from[2], to[2], u)], p: k2, q: P(t, th + 0.1, th + 0.62, E.inOutSine), w: 34 });
    if (t > th + 0.5 && t < th + 0.9) OV.over.push({ type: 'pop', p: [to[0], to[1] + 1.2, to[2]], k: prog(t, th + 0.5, th + 0.9) });
  }
  // the bank builds round the vault on "bank": step, columns, entablature, roof, coin sign
  const bk = G.bank;
  const dsx = drop(t, 3.95, 4); put(bk.step, 5, 0.4 + dsx.y, 2, k * (dsx.vis ? 1 : 0), 0, dsx.sq);
  [2.5, 4.5, 5.5, 7.5].forEach((x, i) => { const d = drop(t, 4.1 + [0, 0.06, 0.06, 0][i] + (i % 3 ? 0 : 0.03), 6); put(bk.cols[i], x, 0.8 + d.y, 2.5, k * (d.vis ? 1 : 0), 0, d.sq); });
  const dt = drop(t, 4.42, 6); put(bk.top, 5, 3.2 + dt.y, 0, k * (dt.vis ? 1 : 0), 0, dt.sq);
  [4.56, 4.68, 4.8].forEach((tl, i) => { const d = drop(t, tl, 5); put(bk.roof[i], 5, 3.6 + i * 0.4 + d.y, 0, k * (d.vis ? 1 : 0), 0, d.sq); });
  const dg = drop(t, 4.98, 4); put(bk.sign, 5, 4.8 + dg.y, 0, k * (dg.vis ? 1 : 0), 0, dg.sq);
  if (t > 4.98 && t < 5.4) OV.over.push({ type: 'pop', p: [5, 5.4, 0], k: prog(t, 4.98, 5.4) });
  // the brick sun rises behind the bank on "day": disc climbs with a little overshoot, rays snap out one by one
  const s = P(t, 5.3, 6.1, E.outBack);
  if (t > 5.3) {
    G.sun.visible = true; G.sun.userData.on = true;
    G.sun.position.set(-0.5, lerp(-4, 6.2, s), -5.5); G.sun.userData.k = k * 0.8; G.sun.userData.spin = -0.6 * (1 - s) + (t - 6.1) * 0.35;
    G.sun.userData.rays.forEach((m, i) => { const r = clamp(sp(t, 5.9 + i * 0.035, SPRING.bouncy)); m.visible = r > 0.01; m.scale.setScalar(Math.max(0.001, r)); });
  }
}
function b2(t) {
  if (t < 6.95 || t > 10.95) return;
  const k = outK(t, 10.55);
  const d = drop(t, 7.2, 8);
  const flat = 0.18 * wobble(t - 8.38, 3, 6) * (t > 8.38 ? 1 : 0);
  put(G.plate, 0, d.y, 0, k, 0, d.sq + flat);
  const spots = [[4.5, 4.5], [3.5, 4.5], [4.5, 3.5], [3.5, 3.5], [2.5, 4.5]];
  spots.forEach(([x, z], i) => {
    const tl = i === 0 ? 9.28 : 9.6 + (i - 1) * 0.11;
    const di = drop(t, tl, 5);
    put(G.fee[i], x, 0.4 + di.y, z, k * (di.vis ? 1 : 0), 0, di.sq);
  });
  spots.forEach(([x, z], i) => { const tl = i === 0 ? 9.28 : 9.6 + (i - 1) * 0.11; if (t > tl && t < tl + 0.4) OV.over.push({ type: 'pop', p: [x, 1.8, z], k: prog(t, tl, tl + 0.4), r: i ? 0.7 : 1 }); });
  if (t > 9.15) OV.over.push({ type: 'big', s: t < 9.6 ? '1%' : `1–${Math.min(5, 2 + Math.floor(prog(t, 9.6, 9.94) * 3.999))}%`, x: 540, y: Y(260), size: 210, align: 'center', k: clamp(sp(t, 9.15, SPRING.bouncy)) * k, hit: t > 9.94 ? t - 9.94 : -1 });
}
function b3(t) {
  if (t < 10.85 || t > 18.6) return;
  const k = outK(t, 18.25);
  const lit = t < 13.5 ? 0 : Math.round(lerp(5, 24, P(t, 13.5, 14.3, E.inOutSine)));
  for (let m = 1; m <= 24; m++) {
    const d = drop(t, 11.0 + m * 0.03, 5);
    const on = t > 13.5 && m >= 6 && m <= lit;
    const ton = 13.5 + (m - 6) / 18 * 0.8;
    const rise = on ? clamp(sp(t, ton, SPRING.bouncy)) : 0;
    put(G.row[m - 1], rowX(m), d.y, 0, k * (d.vis ? 1 : 0), 0, d.sq);
    put(G.rowLit[m - 1], rowX(m), 1.2 + (1 - rise) * 2, 0, k * rise, 0, 0);
  }
  for (let i = 0; i < 3; i++) { const d = drop(t, 16.95 + i * 0.07, 4); put(G.tower[i], rowX(18), 2.4 + i * 1.2 + d.y, 0, k * (d.vis ? 1 : 0), 0, d.sq); }
  if (t > 16.8 && t < 18.2) { if (t > 17.14 && t < 17.6) OV.over.push({ type: 'pop', p: [rowX(18), 6.3, 0], k: prog(t, 17.14, 17.6), r: 1.3 }); OV.under.push({ type: 'burst', p: [rowX(18), 4.5, -1], r: 170 * clamp(sp(t, 17.14, SPRING.bouncy)) * k, rot: t * 0.3 }); }
  if (t > 13.45) OV.over.push({ type: 'big', s: String(Math.max(6, lit)), x: 540, y: Y(260), size: 210, align: 'center', k: clamp(sp(t, 13.45, SPRING.bouncy)) * outK(t, 16.6), hit: lit === 24 ? t - 14.3 : -1 });
}
function b4(t) {
  if (t < 18.45 || t > 24.3) return;
  const k = outK(t, 23.9);
  const exp = Math.max(Math.sin(Math.PI * prog(t, 21.45, 22.3)), Math.sin(Math.PI * prog(t, 22.3, 23.08)));
  [19.3, 19.5, 19.7, 19.9].forEach((tl, i) => {
    const d = drop(t, tl, 7);
    put(G.stack[i], 0, i * 1.2 + d.y + exp * i * 1.6, 0, k * (d.vis ? 1 : 0), 0, d.sq);
  });
  [[-5.5, 20.55], [5.0, 20.72]].forEach(([x, tl], i) => { const d = drop(t, tl, 6); const hop = t > 21.2 && t < 23.2 ? Math.abs(Math.sin((t - 21.2) * 6 + i)) * 0.8 : 0; put(G.people[i], x, d.y + hop, -2.5, k * (d.vis ? 1 : 0), i ? -0.5 : 0.5, d.sq); });
  [22.3, 23.08].forEach((ts) => { if (t > ts && t < ts + 0.42) OV.over.push({ type: 'pop', p: [0, 5.2, 0], k: prog(t, ts, ts + 0.42), r: 1.4 }); });
  if (t > 23.08 && t < 23.9) OV.under.push({ type: 'burst', p: [0, 3, -1], r: 200 * clamp(sp(t, 23.08, SPRING.bouncy)) * k, rot: t * 0.3 });
}
function b5(t) {
  if (t < 32.3 || t > 36.0) return;
  for (let i = 0; i < 8; i++) {
    const d = drop(t, 32.5 + i * 0.05, 5);
    const tf = 34.48 + (7 - i) * 0.12, f = P(t, tf, tf + 0.5, E.inCubic);
    const r = mulberry32(70 + i), ox = (i % 2 ? 1 : -1) * (0.5 + r() * 0.9), oz = (r() - 0.5) * 1.6, oy = (i % 2 ? 1 : -1) * (0.22 + r() * 0.3);
    const x = ox + f * (9 + i), y = 0.82 * i + d.y + f * (8 + i * 0.6), z = oz - f * 4;
    put(G.papers[i], x, y, z, (d.vis ? 1 : 0) * (1 - 0.6 * f), oy + f * 3 * (i % 2 ? 1 : -1), d.sq, f * 1.5, f * 0.8);
  }
  for (const i of [7, 5, 3]) {
    const tf = 34.48 + (7 - i) * 0.12, r = mulberry32(70 + i), ox = (i % 2 ? 1 : -1) * (0.5 + r() * 0.9), oz = (r() - 0.5) * 1.6;
    const fu = (u) => { const f = E.inCubic(u); return [ox + f * (9 + i), 0.82 * i + 0.4 + f * (8 + i * 0.6), oz - f * 4]; };
    if (t > tf && t < tf + 0.8) OV.over.push({ type: 'trail', fn: fu, p: prog(t, tf, tf + 0.5), q: prog(t, tf + 0.12, tf + 0.8), w: 30 });
  }
}
function b6(t) {
  if (t < 35.85 || t > 44.7) return;
  const k = outK(t, 44.35);
  G.cards.forEach((g, i) => {
    const a = -0.9 + i * 0.15, x = 3 + Math.cos(a) * 9 - 6, z = Math.sin(a) * 6;
    const d = drop(t, 36.0 + i * 0.033, 6);
    const wave = Math.max(0, Math.sin(Math.PI * prog(t, 40.5 + i * 0.04, 41.0 + i * 0.04))) * 1.2;
    const ry = -a - 0.4, sc = 0.72, yy = i * 0.6 + d.y + wave;
    put(g, x, yy, z, sc * k * (d.vis ? 1 : 0), ry, d.sq);
    const dc = drop(t, 43.58 + i * 0.056, 4);
    const lx = 2.5 * sc, lz = -1.5 * sc, cx = x + lx * Math.cos(ry) + lz * Math.sin(ry), cz = z - lx * Math.sin(ry) + lz * Math.cos(ry);
    put(G.coins[i], cx, yy + 0.4 * sc + dc.y, cz, sc * k * (dc.vis ? 1 : 0), ry, dc.sq);
  });
  G.days.forEach((m, i) => { const d = drop(t, 37.95 + i * 0.059, 3); put(m, -8 + i * 1.3, d.y, 7, k * (d.vis ? 1 : 0), 0, d.sq); });
  if (t > 35.95) OV.over.push({ type: 'big', s: String(Math.min(13, Math.max(1, Math.floor(prog(t, 36.0, 36.42) * 13) + 1))), x: 540, y: Y(260), size: 210, align: 'center', k: clamp(sp(t, 35.95, SPRING.bouncy)) * k, hit: t > 36.42 ? t - 36.42 : -1 });
}
function b7(t) {
  if (t < 49.6 || t > 55.6) return;
  const k = outK(t, 55.2);
  const dw = drop(t, 49.9, 5), ds = drop(t, 50.1, 5);
  put(G.water, -2, dw.y, 0, k, 0, dw.sq); put(G.sand, -2, 0.4 + ds.y, 0, k, 0, ds.sq);
  const back = antic(t, 51.0, 0.3) * 0.1;
  G.trunk.forEach((m, i) => { const d = drop(t, 51.0 + i * 0.16, 3); put(m, -2.6 + i * 0.25, 0.8 + i * 1.2 + d.y, -0.5, k * (d.vis ? 1 : 0), 0, d.sq + back); });
  G.leaves.forEach((m, i) => { const d = drop(t, 51.94, 3); const a = i * Math.PI / 2 + 0.4; const sway = 0.08 * Math.sin(t * 2.2 + i); put(m, -1.6 + Math.cos(a) * 1.6, 6.9 + d.y, -0.5 + Math.sin(a) * 1.6, k * (d.vis ? 1 : 0) * clamp(sp(t, 51.94, SPRING.bouncy)), -a + Math.PI / 2, 0, 0.35 + sway, 0); });
  G.coins21.forEach((m, i) => {
    const col = Math.floor(i / 7), lvl = i % 7, tl = i < 7 ? 53.3 + i * 0.03 : 53.55 + (i - 7) * 0.031;
    const d = drop(t, tl, 4);
    put(m, 6 + col * 1.6, lvl * 0.42 + d.y, 3 - col * 1.2, k * (d.vis ? 1 : 0), 0, d.sq);
  });
  if (t > 53.2) OV.over.push({ type: 'big', s: `${Math.round(lerp(7, 21, P(t, 53.45, 53.98, E.inOutSine)))}x`, x: 540, y: Y(260), size: 210, align: 'center', k: clamp(sp(t, 53.2, SPRING.bouncy)) * k, hit: t > 53.98 ? t - 53.98 : -1 });
}


// ------------------------------------------------------------------ footage test: Video 24 "The authorized-user strategy" (16.6 s)
// k1 0.9-5.9: all the other boxes are good, but you're in the yellow (mid to lower 700s)
function k1(t) {
  if (t < 0.85 || t > 6.3) return;
  const k = outK(t, 5.85);
  G.boxes.forEach((m, i) => {
    const tl = i < 5 ? 1.25 + i * 0.09 : 2.55, d = drop(t, tl, 7);
    const shake = i === 5 && t > 4.5 ? 0.12 * Math.sin((t - 4.5) * 30) * Math.exp(-(t - 4.5) * 3) : 0;
    put(m, -6.25 + i * 2.5, d.y, 0, k * (d.vis ? 1 : 0), shake, d.sq);
    if (t > tl && t < tl + 0.4) OV.over.push({ type: 'pop', p: [-6.25 + i * 2.5, 1.6, 0], k: prog(t, tl, tl + 0.4), r: i === 5 ? 1.1 : 0.7 });
  });
  if (t > 2.55) OV.under.push({ type: 'burst', p: [6.25, 0.8, 0], r: 150 * clamp(sp(t, 2.55, SPRING.bouncy)) * k, rot: t * 0.3 });
  if (t > 4.15) OV.over.push({ type: 'big', s: 'MID–LOW 700s', x: 540, y: Y(230), size: 130, align: 'center', k: clamp(sp(t, 4.15, SPRING.bouncy)) * k, hit: t > 5.0 ? t - 5.0 : -1 });
  else if (t > 1.2) OV.over.push({ type: 'big', s: 'YOUR PROFILE', x: 540, y: Y(230), size: 120, align: 'center', k: clamp(sp(t, 1.2, SPRING.bouncy)) * outK(t, 3.95, 0.2), hit: -1 });
}
// k3 7.3-16.7: adding authorized users: parents, friends, family; an industry online
const FOLK = [[-6.5, 3.0, 10.9], [-4.4, 4.6, 11.05], [6.0, 3.6, 12.2], [6.6, 0.2, 12.6]];
function k3(t) {
  if (t < 7.2) return;
  const dc = drop(t, 7.45, 7); put(G.auCard, 0, dc.y, 0, dc.vis ? 1.15 : 0, 0.1 * Math.sin(t * 0.6), dc.sq);
  // two users snap onto the card on "authorized users"
  [[-1.4, 8.75], [1.4, 8.9]].forEach(([x, tl], i) => { const d = drop(t, tl, 6); put(G.folk[4 - i], x, 0.4 + d.y, -0.6, d.vis ? 0.62 : 0, 0.3 * (i ? -1 : 1), d.sq); if (t > tl && t < tl + 0.4) OV.over.push({ type: 'pop', p: [x, 2.4, -0.6], k: prog(t, tl, tl + 0.4), r: 0.6 }); });
  // the payoff: the yellow box from the profile drops in beside the card and turns green
  const dy = drop(t, 9.35, 7), turn = t > 10.0;
  if (t < 12.4) {
    put(G.fixY, 4.6, dy.y, 1.2, dy.vis && !turn ? 1 : 0, 0, dy.sq);
    const kg = turn ? clamp(sp(t, 10.0, SPRING.bouncy)) : 0; put(G.fixG, 4.6, 0, 1.2, kg * outK(t, 12.0, 0.3), 0, turn ? 0.15 * wobble(t - 10.0, 3, 6) : 0);
    if (t > 10.0 && t < 10.45) OV.over.push({ type: 'pop', p: [4.6, 1.8, 1.2], k: prog(t, 10.0, 10.45), r: 1.1 });
    if (t > 10.0) OV.under.push({ type: 'burst', p: [4.6, 0.6, 1.2], r: 120 * clamp(sp(t, 10.0, SPRING.bouncy)) * outK(t, 12.0, 0.3), rot: t * 0.4 });
    if (t > 8.85 && t < 10.0) OV.over.push({ type: 'trail', fn: (u) => [lerp(0, 4.6, u), 1.4 + Math.sin(Math.PI * u) * 2.5, lerp(0, 1.2, u)], p: P(t, 9.4, 9.9, E.inOutSine), q: P(t, 9.6, 10.0, E.inOutSine), w: 24 });
  }
  if (t > 8.7) OV.over.push({ type: 'big', s: '+ AUTHORIZED USERS', x: 540, y: Y(200), size: 104, align: 'center', k: clamp(sp(t, 8.7, SPRING.bouncy)) * outK(t, 10.55, 0.25), hit: -1 });
  // parents, friends, family drop in around it; a comet trail runs from each to the card
  FOLK.forEach(([x, z, tl], i) => {
    const d = drop(t, tl, 7); put(G.folk[i], x, d.y, z, d.vis ? 1 : 0, Math.atan2(-x, -z) * 0.6, d.sq);
    const tr = P(t, tl + 0.15, tl + 0.75, E.inOutSine);
    if (t > tl + 0.1 && t < tl + 1.1) OV.over.push({ type: 'trail', fn: (u) => [lerp(x, 0, u), 1.5 + Math.sin(Math.PI * u) * 3, lerp(z, 0, u)], p: tr, q: P(t, tl + 0.3, tl + 0.95, E.inOutSine), w: 26 });
  });
  const labels = [['PARENTS', 10.85, 12.1], ['FRIENDS', 12.15, 12.55], ['FAMILY', 12.55, 13.8]];
  for (const [w, a, b] of labels) if (t > a && t < b + 0.3) OV.over.push({ type: 'big', s: w, x: 540, y: Y(200), size: 130, align: 'center', k: clamp(sp(t, a, SPRING.bouncy)) * outK(t, b, 0.25), hit: -1 });
  // an online store screen drops behind the card
  const ds = drop(t, 14.3, 8); put(G.screen, 0, ds.y, -5.5, ds.vis ? 1 : 0, 0, ds.sq);
  if (t > 14.3) OV.over.push({ type: 'big', s: 'SOLD ONLINE', x: 540, y: Y(200), size: 120, align: 'center', k: clamp(sp(t, 14.3, SPRING.bouncy)), hit: -1 });
}

// ------------------------------------------------------------------ 2-D: riso marks
function starburst(ctx, x, y, r, rot, color = C.yellow) {
  if (r <= 1) return; const rng = mulberry32(5);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU, rr = i % 2 ? r * 0.55 : r * (0.85 + rng() * 0.25); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function redArrow(ctx, pts, p, q, w = 5) {
  // pts: screen polyline; draw from q..p of its length, triangle head at the tip
  const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  const a = tot * q, b = tot * p; if (b - a < 2) return;
  const out = []; let acc = 0;
  for (let i = 1; i < pts.length; i++) { const s0 = acc, s1 = acc + L[i - 1]; acc = s1; if (s1 < a) continue; if (s0 > b) break; const k0 = clamp((a - s0) / L[i - 1]), k1 = clamp((b - s0) / L[i - 1]); if (!out.length) out.push([lerp(pts[i - 1][0], pts[i][0], k0), lerp(pts[i - 1][1], pts[i][1], k0)]); out.push([lerp(pts[i - 1][0], pts[i][0], k1), lerp(pts[i - 1][1], pts[i][1], k1)]); }
  if (out.length < 2) return;
  ctx.save(); ctx.strokeStyle = C.red; ctx.fillStyle = C.red; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(...out[0]); out.slice(1).forEach((pt) => ctx.lineTo(...pt)); ctx.stroke();
  const [x1, y1] = out[out.length - 1], [x0, y0] = out[out.length - 2], dir = Math.atan2(y1 - y0, x1 - x0), s = w * 4;
  if (p > 0.85) { ctx.translate(x1, y1); ctx.rotate(dir); ctx.beginPath(); ctx.moveTo(s * 0.6, 0); ctx.lineTo(-s * 0.6, -s * 0.55); ctx.lineTo(-s * 0.6, s * 0.55); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
// a comet trail: tapered ribbon following a 3-D path fn(u), from tail u=q to head u=p (thin tail, fat head)
function trail(ctx, fn, p, q, w) {
  if (p - q < 0.01) return; const n = 22, L = [], R2 = [];
  const pts = Array.from({ length: n + 1 }, (_, i) => proj(...fn(lerp(q, p, i / n))));
  for (let i = 0; i <= n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const hw = (w / 2) * E.outCubic(i / n);
    L.push([pts[i][0] - dy / d * hw, pts[i][1] + dx / d * hw]); R2.push([pts[i][0] + dy / d * hw, pts[i][1] - dx / d * hw]);
  }
  ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.moveTo(...L[0]); L.forEach((v) => ctx.lineTo(...v)); R2.reverse().forEach((v) => ctx.lineTo(...v)); ctx.closePath(); ctx.fill();
  // two speed lines riding inside the ribbon
  ctx.globalAlpha = 1; ctx.strokeStyle = C.ink; ctx.lineCap = 'round'; ctx.lineWidth = 3.5;
  for (const [a0, a1] of [[0.35, 0.8], [0.15, 0.5]]) { ctx.beginPath(); const s = Math.round(n * a0), e = Math.round(n * a1); for (let i = s; i <= e; i++) ctx.lineTo(...pts[i]); ctx.stroke(); }
  ctx.restore();
}
// impact pop: short ink strokes shooting out from a landing point, then retracting
function pop(ctx, x, y, k, r = 1) {
  if (k <= 0 || k >= 1) return; const a = E.outCubic(k), b = E.inCubic(k);
  ctx.save(); ctx.strokeStyle = C.ink; ctx.lineCap = 'round'; ctx.lineWidth = 6 * (1 - k * 0.5);
  for (let i = 0; i < 6; i++) { const ang = -Math.PI / 2 + (i - 2.5) * 0.5, r0 = (34 + 46 * b) * r, r1 = (40 + 70 * a) * r; if (r1 - r0 < 2) continue;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * r0, y + Math.sin(ang) * r0); ctx.lineTo(x + Math.cos(ang) * r1, y + Math.sin(ang) * r1); ctx.stroke(); }
  ctx.restore();
}
function curvePts(a, b, lift = 2.5, n = 24) {
  return Array.from({ length: n + 1 }, (_, i) => { const k = i / n; return proj(lerp(a[0], b[0], k), lerp(a[1], b[1], k) + Math.sin(Math.PI * k) * lift, lerp(a[2], b[2], k)); });
}
function overlays(ctx, list) {
  for (const o of list) {
    if (o.type === 'burst') { const [x, y] = proj(...o.p); starburst(ctx, x, y, o.r, o.rot); }
    if (o.type === 'trail') trail(ctx, o.fn, o.p, o.q, o.w);
    if (o.type === 'pop') { const [x, y] = proj(...o.p); pop(ctx, x, y, o.k, o.r || 1); }
    if (o.type === 'big' && o.k > 0.01) {
      const bump = o.hit >= 0 ? 1 + 0.08 * wobble(o.hit, 3, 6) : 1;
      ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.k * bump, o.k * bump); ctx.font = font(o.size, 400, DISPLAY); ctx.textAlign = o.align;
      ctx.fillStyle = C.ink; ctx.fillText(o.s, 0, 0); ctx.restore();
    }
  }
}

// ------------------------------------------------------------------ captions: yellow sticker pill with the red arrow box
let CAPS = [];
function buildCaptions(words) {
  const fix = [];
  for (let i = 0; i < words.length; i++) {
    let [a, b, w] = words[i]; if (!w || !w.trim()) continue;
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
  ctx.save(); ctx.font = font(48, 700, UI);
  const w = ctx.measureText(c.text).width + 64;
  ctx.fillStyle = C.yellow; rrect(ctx, 540 - w / 2, y - 44, w, 88, 26); ctx.fill();
  ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText(c.text, 540, y + 17); ctx.restore();
}

// ------------------------------------------------------------------ textures: paper, grain, halftone
let PAPER, GRAIN = [], DOTS;
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function buildTextures() {
  PAPER = canvas(W, H); const p = PAPER.getContext('2d'), r = mulberry32(3);
  p.fillStyle = C.paper; p.fillRect(0, 0, W, H);
  for (let i = 0; i < 30; i++) { const x = r() * W, y = r() * H, rad = 80 + r() * 260; const g = p.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, 'rgba(150,120,80,0.06)'); g.addColorStop(1, 'rgba(150,120,80,0)'); p.fillStyle = g; p.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  for (let i = 0; i < W * H / 40; i++) { p.fillStyle = `rgba(60,40,20,${0.04 + r() * 0.1})`; p.fillRect(r() * W, r() * H, 1, 1); }
  for (let v = 0; v < 3; v++) { const c = canvas(W, H), x = c.getContext('2d'), rr = mulberry32(50 + v), img = x.createImageData(W, H); for (let i = 0; i < img.data.length; i += 4) { const n = 230 + rr() * 25; img.data[i] = n; img.data[i + 1] = n * 0.97; img.data[i + 2] = n * 0.92; img.data[i + 3] = 255; } x.putImageData(img, 0, 0); GRAIN.push(c); }
  DOTS = canvas(W, H); const d = DOTS.getContext('2d'); d.fillStyle = 'rgba(0,0,0,0.5)';
  for (let y = 0; y < H; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < W; x += 4) { d.beginPath(); d.arc(x, y, 0.75, 0, TAU); d.fill(); }
}

// ------------------------------------------------------------------ layout over time
const END = 16.73; window.__END = END;
const FH_KEYS = [[0, 1920], [0.9, SEAM], [6.0, 1920], [7.3, SEAM], [END, 0]];
function footH(t) {
  let v = springKeys(t, FH_KEYS, { stiffness: 150, damping: 17 });
  for (let i = 1; i < FH_KEYS.length; i++) v -= Math.sign(FH_KEYS[i][1] - FH_KEYS[i - 1][1]) * 34 * antic(t, FH_KEYS[i][0], 0.22);
  return clamp(v, 0, DH);
}
const FULL_WINDOWS = [[0, 0.9], [6.0, 7.3]];
const CLAIM_FULL = [];

let FOOT = null; const FCACHE = new Map();
async function loadFrame(t) {
  const idx = Math.min(SRC_FRAMES, Math.max(1, Math.floor(t * SRC_FPS) + 1));
  if (!FCACHE.has(idx)) { const im = new Image(); im.src = `assets/footage/f_${String(idx).padStart(5, '0')}.jpg`; try { await im.decode(); } catch { return; } FCACHE.set(idx, im); while (FCACHE.size > 8) FCACHE.delete(FCACHE.keys().next().value); }
  FOOT = FCACHE.get(idx);
}
function pushIn(t) { for (const [a, b] of FULL_WINDOWS) if (t >= a - 0.5 && t < b + 0.8) return Math.pow(1.1, P(t, a, b + 0.8, E.inOutSine)); return 1; }
const BUSY = [[1.2, 2.0], [2.5, 3.0], [4.1, 5.3], [7.4, 7.9], [8.7, 9.3], [10.8, 13.8], [14.2, 14.8]];
const near = (t) => FH_KEYS.some(([k]) => t > k - 0.25 && t < k + 0.8) || BUSY.some(([a, b]) => t > a && t < b);

M.film({
  fonts: [font(96, 400, 'Display'), font(46, 600, 'UI'), font(34, 500, 'UI'), font(100, 400, DISPLAY), font(40, 700, UI)],
  images: { badge: 'assets/badge.png' },
  hits: HITS,
  samples: (t) => (near(t) ? 6 : 2),
  async init() { buildTextures(); buildWorld(); CAPS = buildCaptions(await fetch('assets/words.json').then((r) => r.json())); },
  prepare: (t) => loadFrame(t),
  draw(ctx, u, t, IMG) {
    const fh = footH(t); FH = fh;
    ctx.drawImage(PAPER, 0, 0);
    ctx.save(); ctx.scale(S, S);
    // 3-D: set every mesh for t, then the camera; 2-D underlay (starbursts) goes beneath the bricks
    const panelVisible = fh < DH - 4;
    OV.under = []; OV.over = [];
    if (panelVisible) {
      hideAll(); setCamera(t);
      G.sun.userData.on = false;
      k1(t); k3(t);
      if (G.sun.userData.on) { const u = G.sun.userData; G.sun.quaternion.copy(CAM.quaternion); G.sun.rotateZ(u.spin); G.sun.scale.setScalar(Math.max(0.001, u.k)); G.sun.visible = u.k > 0.002; }
      overlays(ctx, OV.under);
      RD.setClearColor(0x000000, 0); RD.render(SCN, CAM);
      const py = Y(0);
      ctx.save(); ctx.globalAlpha = 0.16; ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(GLC, 5, py - 3, DW, PANEL_H); ctx.restore();   // misregistration ghost
      ctx.save(); ctx.filter = 'saturate(1.45) contrast(1.06)'; ctx.drawImage(GLC, 0, py, DW, PANEL_H); ctx.restore();
      overlays(ctx, OV.over);
    }
    // end card on the paper
    if (t > 56.6) {
      const k = sp(t, 56.95, { stiffness: 260, damping: 15 });
      starburst(ctx, 540, 760, 360 * clamp(sp(t, 56.8, SPRING.bouncy)), t * 0.2);
      if (IMG.badge && t > 56.93) { const s = 560 * (1.3 - 0.3 * k), ar = IMG.badge.height / IMG.badge.width; ctx.save(); ctx.globalAlpha = clamp(k * 3); ctx.translate(540, 760); ctx.rotate(-0.06 * (1 - k)); ctx.drawImage(IMG.badge, -s / 2, -s * ar / 2, s, s * ar); ctx.restore(); }
      const kt = clamp(sp(t, 57.3, SPRING.bouncy));
      if (kt > 0) { ctx.save(); ctx.translate(540, 1250); ctx.scale(kt, kt); ctx.font = font(96, 400, DISPLAY); ctx.textAlign = 'center'; ctx.fillStyle = C.ink; ctx.fillText('learn the playbook', 0, 0); ctx.restore(); }
      if (t > 57.7) { ctx.save(); ctx.globalAlpha = P(t, 57.7, 58.0); ctx.font = font(40, 700, UI); const w = ctx.measureText('creditcounselelite.com').width + 140; const x0 = 540 - w / 2, y = 1360; ctx.fillStyle = C.yellow; rrect(ctx, x0 + 38, y - 44, w - 76, 88, 26); ctx.fill(); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText('creditcounselelite.com', 540, y + 14); ctx.restore(); }
      ctx.save(); ctx.globalAlpha = P(t, 58.0, 58.4) * 0.7; ctx.font = font(22, 700, UI); ctx.textAlign = 'center'; ctx.fillStyle = C.ink; ctx.fillText('Education and coaching. Not a lender. Individual results vary.', 540, 1680); ctx.restore();
    }
    if (false) { ctx.save(); ctx.font = font(22, 700, UI); ctx.fillStyle = 'rgba(21,21,21,0.6)'; ctx.fillText('individual results vary. education only.', 40, Y(50)); ctx.restore(); }
    // footage below
    if (FOOT && fh > 1) {
      cover(ctx, FOOT, 0, DH - fh, DW, fh, { fx: 0.5, fy: lerp(0.25, 0.45, clamp((fh - SEAM) / (DH - SEAM))), zoom: pushIn(t) });
      if (fh < DH - 2) { ctx.fillStyle = C.ink; ctx.fillRect(0, DH - fh - 4, DW, 8); }
    }
    captions(ctx, t, fh);
    if (CLAIM_FULL.some(([a, b]) => t > a + 0.3 && t < b) && fh > 1700) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 6; ctx.font = font(22, 700, UI); ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('Individual results vary. Education only.', 540, 1860); ctx.restore(); }
    ctx.restore();
  },
  post(ctx, u, t) {
    // riso finish over everything above the footage seam: paper grain + halftone screen
    const top = Math.max(0, (DH - FH) * S);
    if (top <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, top); ctx.clip();
    ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(GRAIN[Math.floor(t * 12) % 3], 0, 0);
    ctx.globalAlpha = 0.12; ctx.drawImage(DOTS, 0, 0);
    ctx.restore();
  },
});

// brand captions (black overlay, Poppins) — CCE Brand Style Guidelines 2025
function captions(ctx, t, fh) { BR.captions(ctx, t, fh, CAPS); }
