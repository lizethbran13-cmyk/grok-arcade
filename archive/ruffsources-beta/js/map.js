// Grok Ruffsources HQ - the campus map. Brand-new layout: Ruffsources HQ (6 walk-in rooms), the Ratita Industries branch,
// the Tortuga Tech Inc. test lab and the Bark & Brew cafe around Bone Fountain Plaza. Real smooth geometry everywhere.
import * as THREE from 'three';
import * as K from './kit.js?v=rs6';
import { rbox } from './world.js?v=rs6';
import { shell, part, onSide } from './bld.js?v=rs6';
import { textGeo } from './text3d.js?v=rs6';
const { rcyl, lathe, sph, cyl, cone, torus, capsule, tube, star, heart, blobGeo, wedge, propSeed } = K;
const PI = Math.PI, R = K.R, pick = K.pick;
export const SPOTS = {}; // named interaction / NPC spots filled while building
export const ENV = { sunDir: [0.55, 0.75, 0.35], sunColor: 0xfff1dc, sunI: 2.5, hemiSky: 0xd6ecff, hemiGround: 0x7a9a5a, hemiI: 0.6, skyTop: 0x2f7fe0, skyMid: 0xa8d8ff, skyBot: 0xeaf6ff, fog: 0xd8ecff, fogD: 0.0042, exposure: 1.0, envI: 0.85, bloomT: 1.05, bloomS: 0.35, sunDisc: 1, stars: 0 };
// ---------- little art helpers ----------
export function bone(w, bucket, col, x, y, z, ry = 0, s = 1, rx = 0, em = 0) { const T = w.tf(x, y, z, ry, s); T.add(bucket, capsule(14), col, 0, 0, 0, rx, 0, PI / 2, 0.32, 1.1, 0.32, em); [-1, 1].forEach((a) => [-1, 1].forEach((b) => T.add(bucket, sph(16), col, a * 0.78, b * 0.2 * Math.cos(rx), b * 0.2 * Math.sin(rx), 0, 0, 0, 0.3, 0.3, 0.3, em))); }
function txt(w, str, x, y, z, ry, size, col, bucket = 'g', em = 0) { const g = textGeo(str, size, size * 0.3); if (!g) return 0; const wd = g.userData.w; w.add(bucket, g, col, x, y, z, 0, ry, 0, 1, 1, 1, em); return wd; }
function hydrant(w, x, z, col = 0xef4444) { w.add('g', rcyl(0.26, 0.75, 0.06, 20), col, x, 0, z); w.add('g', sph(16), col, x, 0.75, z, 0, 0, 0, 0.27, 0.22, 0.27); [-1, 1].forEach((s) => w.add('g', cyl(12), 0xfacc15, x + s * 0.26, 0.48, z, 0, 0, PI / 2, 0.09, 0.14, 0.09)); w.add('x', cyl(10), 0xfacc15, x, 0.92, z, 0, 0, 0, 0.06, 0.1, 0.06); w.solid(x - 0.3, 0, z - 0.3, x + 0.3, 0.95, z + 0.3); }
function mailbox(w, x, z, ry = 0) { const T = w.tf(x, 0, z, ry); T.add('x', cyl(10), 0x334155, 0, 0, 0, 0, 0, 0, 0.06, 1.0, 0.06); T.box('g', 0x2563eb, 0, 1.0, 0, 0.5, 0.45, 0.8, 0.2); T.add('g', cyl(20, 1), 0x2563eb, 0, 1.45, -0.4, PI / 2, 0, 0, 0.25, 0.8, 0.25); T.box('g', 0xef4444, 0.28, 1.25, 0.1, 0.04, 0.35, 0.08, 0.02); T.solid(-0.3, 0, -0.45, 0.3, 1.7, 0.45); }
function planter(w, x, z, L, ry = 0, flower = 0xff6fb5) { const T = w.tf(x, 0, z, ry); T.slab('g', 0xe7e5e4, 0, 0, 0, L, 0.6, 1.0, 0.1); T.box('m', 0x5b3a1e, 0, 0.55, 0, L - 0.2, 0.08, 0.8, 0.04); for (let i = 0; i < L * 2.2; i++) { const lx = -L / 2 + 0.3 + R() * (L - 0.6), lz = (R() - 0.5) * 0.6; T.add('g', blobGeo(i & 31, 0.25, 1), 0x3fae5a, lx, 0.75, lz, 0, R() * 6, 0, 0.26, 0.2, 0.26); if (R() < 0.6) T.add('g', sph(8), pick([flower, 0xffd23f, 0xffffff, 0xa78bfa]), lx, 0.95, lz, 0, 0, 0, 0.08); } }
function awning(w, x0, x1, z, y, cols, dir = 1) { const n = Math.round((x1 - x0) / 0.8); for (let i = 0; i < n; i++) { const x = x0 + (i + 0.5) * (x1 - x0) / n; w.add('f', rbox((x1 - x0) / n + 0.02, 0.06, 1.6, 0.03), cols[i % 2], x, y, z + dir * 0.75, -dir * 0.35, 0, 0); w.add('f', sph(10), cols[i % 2], x, y - 0.36, z + dir * 1.5, 0, 0, 0, (x1 - x0) / n / 2, 0.14, 0.1); } }
export function doormat(w, x, y, z, ry = 0, toy = true) { const T = w.tf(x, y, z, ry); T.box('f', 0xb45309, 0, 0, 0, 1.5, 0.05, 1.0, 0.03); T.box('f', 0xf59e0b, 0, 0.02, 0, 1.3, 0.04, 0.8, 0.02); for (let i = -1; i <= 1; i++) T.add('f', sph(10), 0x92400e, i * 0.35, 0.06, 0, 0, 0, 0, 0.12, 0.012, 0.1); T.add('m', rbox(0.55, 0.012, 0.18, 0.005), 0x92400e, 0, 0.06, 0.28); }
export function paperStack(w, x, y, z, n = 6, ry = 0) { for (let i = 0; i < n; i++) w.add('m', rbox(0.42, 0.03, 0.3, 0.008), i % 3 ? 0xffffff : 0xfef3c7, x + (R() - 0.5) * 0.04, y + 0.015 + i * 0.032, z + (R() - 0.5) * 0.04, 0, ry + (R() - 0.5) * 0.2, 0); }
function bin(w, x, z, col, icon) { w.slab('g', col, x, 0, z, 1.1, 1.0, 1.0, 0.12); w.add('g', rbox(1.2, 0.1, 1.1, 0.04), 0xffffff, x, 1.02, z); if (icon === 'bone') bone(w, 'l', 0xffffff, x, 0.6, z + 0.52, 0, 0.25, 0, 0.3); else if (icon === 'cheese') w.add('l', wedge(), 0xffffff, x, 0.5, z + 0.52, PI / 2, 0, 0, 0.35, 0.35, 0.35, 0.3); else if (icon === 'shell') w.add('l', sph(16), 0xffffff, x, 0.5, z + 0.5, 0, 0, 0, 0.25, 0.18, 0.06, 0.3); else w.add('l', star(), 0xffffff, x, 0.55, z + 0.52, 0, 0, 0, 0.2, 0.2, 0.2, 0.3); }
function pigeonholes(w, x, z, ry, cols = 6, rows = 4) { const T = w.tf(x, 0, z, ry); T.slab('m', 0xc08a52, 0, 0, 0, cols * 0.55 + 0.1, 0.9, 0.5, 0.04); for (let r = 0; r <= rows; r++) T.box('m', 0xa0703f, 0, 0.9 + r * 0.42, 0, cols * 0.55 + 0.1, 0.05, 0.5, 0.01); for (let c = 0; c <= cols; c++) T.box('m', 0xa0703f, -cols * 0.275 + c * 0.55, 0.9, 0, 0.05, rows * 0.42, 0.5, 0.01);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (R() < 0.7) T.box('m', pick([0xffffff, 0xfef3c7, 0xe0f2fe, 0xfce7f3]), -cols * 0.275 + 0.275 + c * 0.55, 0.96 + r * 0.42, 0.05, 0.38, 0.12 + R() * 0.15, 0.3, 0.01); T.solid(-cols * 0.3, 0, -0.25, cols * 0.3, 0.9 + rows * 0.42, 0.25); }
function coffeeMachine(w, x, y, z, ry = 0) { const T = w.tf(x, y, z, ry); T.box('x', 0x1f2937, 0, 0, 0, 0.7, 0.9, 0.55, 0.08); T.box('x', 0xd1d5db, 0, 0.9, 0, 0.72, 0.12, 0.57, 0.04); T.box('g', 0x111827, 0, 0.12, 0.25, 0.5, 0.06, 0.12, 0.02); T.add('g', lathe([[0, 0], [0.09, 0], [0.11, 0.16], [0, 0.16]], 18, 'cup'), 0xffffff, 0, 0.18, 0.22); T.add('l', sph(8), 0x22c55e, 0.22, 0.72, 0.28, 0, 0, 0, 0.035, 0.035, 0.02, 0.8); bone(w, 'g', 0xfbbf24, ...T.P(0, 0.62, 0.29), ry, 0.12); }
function fridge(w, x, z, ry) { const T = w.tf(x, 0, z, ry); T.slab('g', 0xf1f5f9, 0, 0, 0, 0.95, 2.1, 0.8, 0.1); T.box('g', 0xe2e8f0, 0, 1.3, 0.41, 0.9, 0.02, 0.02, 0.005); T.add('x', capsule(10), 0x94a3b8, 0.36, 1.6, 0.44, 0, 0, 0, 0.05, 0.4, 0.05); T.add('x', capsule(10), 0x94a3b8, 0.36, 0.9, 0.44, 0, 0, 0, 0.05, 0.3, 0.05); for (let i = 0; i < 4; i++) T.add('g', rbox(0.14, 0.14, 0.02, 0.03), pick([0xff6fb5, 0xffd23f, 0x60a5fa, 0x4ade80]), -0.25 + R() * 0.4, 1.4 + R() * 0.5, 0.42); }
function dogBed(w, x, z, col = 0x8b5cf6) { w.add('f', torus(0.45, 28), col, x, 0.22, z, PI / 2, 0, 0, 0.7, 0.7, 0.55); w.add('f', rcyl(0.62, 0.14, 0.06, 24), 0xede9fe, x, 0.04, z); }
function windowPlant(w, x, y, z) { w.add('g', lathe([[0, 0], [0.16, 0], [0.2, 0.26], [0, 0.26]], 18, 'wp'), 0xfb923c, x, y, z); w.add('g', blobGeo(5, 0.25, 1), 0x22c55e, x, y + 0.4, z, 0, 0, 0, 0.22, 0.2, 0.22); }
function frameArt(w, axis, at, c, y, W, H, col, side) { if (axis === 'x') { w.add('m', rbox(W + 0.14, H + 0.14, 0.06, 0.02), 0x7c4a1e, c, y, at + side * 0.03); w.add('m', rbox(W, H, 0.04, 0.01), col, c, y, at + side * 0.07); } else { w.add('m', rbox(0.06, H + 0.14, W + 0.14, 0.02), 0x7c4a1e, at + side * 0.03, y, c); w.add('m', rbox(0.04, H, W, 0.01), col, at + side * 0.07, y, c); } }
function pawPrint(w, x, z, s, col, ry = 0) { const T = w.tf(x, 0.075, z, ry, s); T.add('m', sph(12), col, 0, 0, 0, 0, 0, 0, 0.3, 0.02, 0.26); for (let i = 0; i < 4; i++) { const a = -0.9 + i * 0.6; T.add('m', sph(10), col, Math.sin(a) * 0.36, 0, -Math.cos(a) * 0.34, 0, 0, 0, 0.1, 0.02, 0.12); } }
// ---------- the campus ----------
export function buildMap(w) {
  propSeed(4242); const L = w.lights; w.region = 'out';
  // ground: rolling lawn with painted variation, a hill ring at the edge and the paved plaza
  { const N = 96, S = 260; const g = new THREE.PlaneGeometry(S, S, N, N); g.rotateX(-PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.max(Math.abs(x), Math.abs(z)); const hill = r > 78 ? Math.pow((r - 78) / 52, 1.6) * 16 * (0.7 + 0.3 * Math.sin(x * 0.07) * Math.cos(z * 0.06)) : 0; p.setY(i, hill - 0.02); } g.computeVertexNormals();
    w.addFn('m', g, (c, x, y, z) => { const n = Math.sin(x * 0.21) * Math.cos(z * 0.17) * 0.5 + Math.sin(x * 0.05 + z * 0.07) * 0.5; c.setHSL(0.27 + n * 0.025, 0.55, 0.43 + n * 0.05 + Math.min(0.08, y * 0.004)); }, 0, 0, 0); w.solid(-130, -3, -130, 130, 0, 130, { floor: true }); }
  // plaza + paths (tile)
  K.floor(w, -24, -7, 24, 18, 'tile', 0.02, 0xe8cfa6, 0xd9b98a, 2);
  K.floor(w, -2.2, 18, 2.2, 26, 'tile', 0.02, 0xf3e8d8, 0xe9d6bd, 1.1);
  K.floor(w, -29.5, 5, -24, 9.5, 'tile', 0.02, 0xf3e8d8, 0xe9d6bd, 1.1); K.floor(w, 24, 5, 29.5, 9.5, 'tile', 0.02, 0xf3e8d8, 0xe9d6bd, 1.1);
  K.floor(w, -60, 20, -14, 46, 'tile', 0.015, 0x64748b, 0x5b6474, 3); // parking
  for (let i = 0; i < 6; i++) w.add('l', rbox(0.15, 0.02, 4.5, 0.01), 0xffffff, -56 + i * 7, 0.05, 30, 0, 0, 0, 1, 1, 1, 0);
  [[-52, 30, 0.2, 0xff6fb5], [-38, 30, -0.1, 0x60a5fa], [-31, 30, 0.05, 0xffd23f], [-24, 36, PI + 0.1, 0x4ade80]].forEach(([x, z, r, c]) => K.toyCar(w, x, z, r, c));
  // Bone Fountain
  { const x = 0, z = 6; w.add('g', rcyl(5.2, 0.7, 0.2, 48), 0xe7e5e4, x, 0, z); w.solid(x - 4.4, 0, z - 4.4, x + 4.4, 0.7, z + 4.4); w.add('e', rcyl(4.7, 0.55, 0.1, 48), 0x67e8f9, x, 0.12, z); w.add('g', rcyl(1.2, 1.4, 0.2, 32), 0xd6d3d1, x, 0.6, z);
    bone(w, 'g', 0xfde68a, x, 3.0, z, 0, 1.6, 0); w.add('g', cyl(16), 0xd6d3d1, x, 1.9, z, 0, 0, 0, 0.25, 0.6, 0.25); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; w.add('l', tube([[x + Math.cos(a) * 0.4, 3.0, z + Math.sin(a) * 0.4], [x + Math.cos(a) * 1.6, 3.4, z + Math.sin(a) * 1.6], [x + Math.cos(a) * 2.9, 0.8, z + Math.sin(a) * 2.9]], 0.05, 16, 6), 0xbff6ff, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0.2); }
    SPOTS.fountain = [x, z]; }
  // plaza furniture
  [[-16, 3], [16, 3], [-16, 13], [16, 13]].forEach(([x, z]) => { K.bench(w, x, z, x < 0 ? PI / 2 : -PI / 2, 0xff8a3d); });
  [[-22, -5], [22, -5], [-22, 16], [22, 16], [-9, 17], [9, 17]].forEach(([x, z]) => K.lampPost(w, x, z));
  [[-11, -5.6], [11, -5.6]].forEach(([x, z]) => planter(w, x, z, 5, 0));
  hydrant(w, -6, 15.5); hydrant(w, 20, -2, 0xffd23f); mailbox(w, 6.5, 15.5, PI);
  for (let i = 0; i < 9; i++) pawPrint(w, -3 + Math.sin(i) * 0.5, 9.5 + i * 0.95, 0.5, 0xd6b892, (i % 2 ? 0.3 : -0.3));
  // trees, bushes, flower beds (dense, every direction)
  const trees = [[-30, -14], [-32, -24], [30, -14], [32, -24], [-26, 20], [26, 20], [-14, 44], [14, 44], [-30, 46], [36, 42], [-50, -10], [50, -10], [-55, 8], [55, 8], [-44, -30], [46, -32], [0, -44], [-20, -42], [22, -42], [-62, 50], [60, 50], [-66, -40], [66, -40], [40, -50], [-40, -52], [8, 56], [-8, 60], [28, 58], [-70, 10], [70, 22], [-58, -24], [58, -22]];
  const park = (x, z) => x > -63 && x < -11 && z > 17 && z < 49; trees.forEach(([x, z], i) => { if (!park(x, z)) K.tree(w, x, z, 1 + (i % 3) * 0.25, i % 5 === 0 ? 1 : 0); });
  for (let i = 0; i < 46; i++) { const a = i / 46 * PI * 2, r = 64 + (i % 4) * 4; if (park(Math.cos(a) * r, Math.sin(a) * r)) continue; K.tree(w, Math.cos(a) * r, Math.sin(a) * r, 1.2 + (i % 3) * 0.3, i % 7 === 0 ? 1 : 0); }
  [[-22, -8, -20, -7], [20, -8, 22, -7]].forEach(() => 0);
  [[-26, -3], [-26, 13], [26, -3], [26, 13], [-12, 24], [12, 24], [-11, 39], [11, 39], [-20, -36], [20, -36], [-48, 16], [-28, -4], [48, 16], [28, -4], [-62, 22], [-62, 40], [-14, 48], [14, 48]].forEach(([x, z], i) => { K.bush(w, x, z, 1 + (i % 3) * 0.2); K.bush(w, x + 1.4, z + 0.6, 0.8); });
  K.flowerBed(w, -24, -16, -20, -9); K.flowerBed(w, 20, -16, 24, -9); K.flowerBed(w, -12, 40, -9, 46); K.flowerBed(w, 9, 40, 12, 46);
  // dog park corner: agility gear + fire hydrant + a bone-shaped sandbox
  { const x = 46, z = -14; K.fenceRun(w, 'x', z - 8, x - 8, x + 8, 1.1, 0xffffff); K.fenceRun(w, 'z', x + 8, z - 8, z + 6, 1.1, 0xffffff); for (let i = 0; i < 5; i++) { w.add('g', cyl(12), i % 2 ? 0xff4fa0 : 0xffffff, x - 4 + i * 1.6, 0, z, 0, 0, 0, 0.05, 1.0, 0.05); } w.add('g', torus(0.12, 32), 0xffd23f, x + 4, 1.2, z + 3, 0, 0, 0, 0.7); w.add('x', cyl(10), 0x94a3b8, x + 3.3, 0, z + 3, 0, 0, 0, 0.05, 2, 0.05); w.add('x', cyl(10), 0x94a3b8, x + 4.7, 0, z + 3, 0, 0, 0, 0.05, 2, 0.05); w.add('g', rbox(3, 0.15, 1.2, 0.05), 0x60a5fa, x - 2, 0.5, z + 4, 0, 0, 0.3); hydrant(w, x + 5, z - 5); SPOTS.dogpark = [x, z]; }
  // distant hills / clouds for depth
  for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2 + 0.3; w.add('m', blobGeo(i * 3, 0.15, 2), 0xffffff, Math.cos(a) * 200, 60 + (i % 3) * 12, Math.sin(a) * 200, 0, a, 0, 22, 6, 12); }
  buildHQ(w); buildRatita(w); buildTortuga(w); buildCafe(w); dress(w);
  w.region = 'out';
}
// ---------------- Ruffsources HQ: Lobby, Mail Room, Break Room, Filing Archive, Interview Room, Candy's Office ----------------
function buildHQ(w) {
  const b = shell(w, { id: 'hq', name: 'Ruffsources HQ', x0: -18, z0: -34, x1: 18, z1: -8, h: 5.4, wall: 0xc8634a, trim: 0xfff7ed, roof: 0x7c3f2c, floor: 'wood', fc1: 0xd9a066, doors: [{ side: 's', at: 0, w: 3.2 }], win: { s: 4, n: 5, e: 3, w: 3 } });
  const L = w.lights; w.region = 'out';
  // facade: entrance canopy on pillars + 3D sign with the bone logo
  onSide(w, b, 's', () => {
  w.add('g', rbox(7, 0.35, 3, 0.12), 0xfff7ed, 0, 3.55, -6.4); [-3.2, 3.2].forEach((x) => { w.add('g', rcyl(0.22, 3.4, 0.06, 20), 0xfff7ed, x, 0, -5.2); w.solid(x - 0.25, 0, -5.45, x + 0.25, 3.4, -4.95); });
  txt(w, 'RUFFSOURCES', 0, 3.95, -7.62, 0, 0.62, 0xfff7ed, 'g'); bone(w, 'l', 0xffd23f, -6.2, 4.25, -7.55, 0, 0.55, 0, 0.6); bone(w, 'l', 0xffd23f, 6.2, 4.25, -7.55, 0, 0.55, 0, 0.6);
  txt(w, 'HEAD OFFICE  -  ALL PAWS WELCOME', 0, 3.6, -6.82, 0, 0.16, 0x7c3f2c, 'g');
  });
  // partitions (rooms 12 x 10 / 12 x 16)
  part(w, b, 'x', -18, -18, 18, [-12, 0, 12], 0xfff7ed); part(w, b, 'z', -6, -34, -18, [-26], 0xfef3c7); part(w, b, 'z', 6, -34, -18, [-26], 0xfef3c7);
  part(w, b, 'z', -6, -18, -8, [-13], 0xe0f2fe); part(w, b, 'z', 6, -18, -8, [-13], 0xfce7f3);
  w.region = 'in_hq';
  // LOBBY (x -6..6, z -18..-8): reception desk, Biscuit the corgi receptionist, waiting chairs, bone rug, Candy's lobby doormat
  { K.rug(w, 0, -12.5, 0, 6, 4, 0xff8a3d, 0xffd6a5); const T = w.tf(0, 0, -15.2, 0); T.slab('g', 0xffffff, 0, 0, 0, 4.6, 1.1, 1.0, 0.15); T.box('g', 0xc8634a, 0, 0, 0.52, 4.4, 0.9, 0.04, 0.03); T.box('g', 0xffd23f, 0, 1.1, 0, 4.8, 0.08, 1.2, 0.04); K.monitor(w, T, -1.2, 1.18, -0.2, 0, 0x60a5fa); bone(w, 'g', 0xffd23f, 0, 0.55, -15.2 + 0.56, 0, 0.35);
    paperStack(w, 1.3, 1.18, -15.2, 4); w.add('g', rcyl(0.12, 0.2, 0.02, 16), 0x60a5fa, 1.8, 1.18, -15.1); txt(w, 'RECEPTION', 0, 3.0, -17.7, 0, 0.32, 0xc8634a);
    [-4.5, -3.5].forEach((x) => K.chair(w, x, 0, -9.5, PI, 0xff8a3d)); [3.5, 4.5].forEach((x) => K.chair(w, x, 0, -9.5, PI, 0x60a5fa)); K.plant(w, -5.3, -17.2, 1); K.plant(w, 5.3, -17.2, 1); K.cooler(w, 5.2, -11);
    frameArt(w, 'x', -17.85, -3.5, 2.2, 1.6, 1.1, 0xfbcfe8, 1); frameArt(w, 'x', -17.85, 3.5, 2.2, 1.6, 1.1, 0xbae6fd, 1);
    SPOTS.reception = [0, -14.2]; SPOTS.nap_lobby = [-3.4, -12.2, 0.4]; L.push({ x: 0, y: 3.2, z: -13, c: 0xfff1dc, i: 13, d: 14 }); }
  // MAIL ROOM (x -18..-6, z -18..-8): conveyor, 4 sorting bins, pigeonholes, parcel piles
  { K.floor(w, -17.75, -17.85, -6.15, -8.25, 'tile', 0.08, 0x93c5fd, 0x7fb2ef, 1.2); K.conveyor(w, -12, -15.5, 0, 7); for (let i = 0; i < 6; i++) K.parcel(w, -15 + i * 1.1, 0.78, -15.5, 0.7);
    bin(w, -15.6, -11.5, 0xff4fa0, 'cheese'); bin(w, -13.6, -11.5, 0x14b8a6, 'shell'); bin(w, -11.6, -11.5, 0x2563eb, 'bone'); bin(w, -9.6, -11.5, 0x64748b, 'star');
    pigeonholes(w, -12, -17.4, 0, 7, 4); for (let i = 0; i < 7; i++) K.parcel(w, -17 + (i % 3) * 0.8, (i / 3 | 0) * 0.5, -9.2 - (i % 2) * 0.7, 0.8); K.crate(w, -7.2, 0, -9.3, 0.9);
    txt(w, 'MAIL ROOM', -12, 3.0, -17.1, 0, 0.3, 0x2563eb); SPOTS.mail = [-12, -13.4]; SPOTS.nap_mail = [-16.4, -12.8, 1.2]; L.push({ x: -12, y: 3.2, z: -13, c: 0xe0f2ff, i: 12, d: 14 }); }
  // BREAK ROOM (x 6..18, z -18..-8): coffee + kibble bar, fridge, vending, round tables, couch, snack board
  { K.floor(w, 6.15, -17.85, 17.75, -8.25, 'tile', 0.08, 0xf9a8d4, 0xf472b6, 1.0); const T = w.tf(12, 0, -17.0, 0); T.slab('g', 0xffffff, 0, 0, 0, 7, 0.95, 1.1, 0.06); T.box('g', 0xf472b6, 0, 0.95, 0, 7.1, 0.08, 1.2, 0.03); coffeeMachine(w, 10, 1.03, -17.1); coffeeMachine(w, 11.2, 1.03, -17.1);
    for (let i = 0; i < 5; i++) w.add('g', lathe([[0, 0], [0.13, 0], [0.16, 0.22], [0, 0.22]], 18, 'jar'), pick([0xfbbf24, 0xf472b6, 0x60a5fa]), 13 + i * 0.5, 1.03, -17.0); fridge(w, 17.1, -15.5, -PI / 2); K.vending(w, 17.0, -10.6, -PI / 2, 0xef4444);
    K.tableR(w, 9.5, -12, 0.9, 0.78, 0xffffff); K.tableR(w, 13.2, -12.5, 0.9, 0.78, 0xffffff); [[8.5, -12], [10.5, -12], [12.2, -12.5], [14.2, -12.5]].forEach(([x, z]) => K.stool(w, x, z, pick([0xf472b6, 0x60a5fa, 0xfbbf24])));
    K.sofa(w, 9.5, -9.0, PI, 0x8b5cf6, 0xa78bfa); w.add('g', heart(), 0xff4fa0, 16, 2.6, -17.75, 0, 0, 0, 0.35, 0.35, 0.35); txt(w, 'BREAK ROOM', 12, 3.0, -17.7, 0, 0.3, 0xdb2777);
    SPOTS.break = [12, -15.2]; SPOTS.nap_break = [9.5, -10.3, PI]; L.push({ x: 12, y: 3.2, z: -13, c: 0xffe4f1, i: 12, d: 14 }); }
  // FILING ARCHIVE (x -18..-6, z -34..-18): rows of cabinets, rolling ladder, the alphabet wall
  { K.floor(w, -17.75, -33.75, -6.15, -18.15, 'carpet', 0.08, 0x475569, 0x52607a, 1.5); for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) K.filing(w, -16.5 + i * 0.75, -32.6 + r * 3.6, 0, [0x94a3b8, 0x60a5fa, 0xf472b6][r], 4);
    for (let i = 0; i < 4; i++) { const x = -15.5 + i * 2.3; w.add('l', rbox(1.6, 0.6, 0.06, 0.06), [0xfda4af, 0xfde68a, 0xa7f3d0, 0xbfdbfe][i], x, 3.3, -33.7, 0, 0, 0, 1, 1, 1, 0.2); txt(w, ['A-F', 'G-L', 'M-R', 'S-Z'][i], x, 3.12, -33.62, 0, 0.26, 0x1f2937); }
    const T = w.tf(-8.3, 0, -26, PI / 2); [-0.4, 0.4].forEach((s) => T.add('x', cyl(10), 0xd97706, s, 0, 0, 0, 0, 0.08, 0.04, 2.8, 0.04)); for (let i = 0; i < 7; i++) T.add('x', cyl(8), 0xd97706, 0, 0.3 + i * 0.38, 0, 0, 0, PI / 2, 0.025, 0.8, 0.025);
    paperStack(w, -9, 0, -20, 9); paperStack(w, -9.6, 0, -20.4, 6); K.desk(w, -10, -21.3, 0, { pc: false, chairCol: 0x60a5fa }); txt(w, 'FILING ARCHIVE', -12, 3.9, -33.6, 0, 0.26, 0xfff7ed);
    SPOTS.filing = [-12, -24]; L.push({ x: -12, y: 3.2, z: -26, c: 0xdbeafe, i: 12, d: 16 }); }
  // INTERVIEW ROOM (x -6..6, z -34..-18): table, interviewer + candidate chairs, whiteboard, "YOU'RE HIRED" banner, bell
  { K.floor(w, -5.85, -33.75, 5.85, -18.15, 'carpet', 0.08, 0x7c3aed, 0x8b5cf6, 1.5); K.rug(w, 0, -26, 0, 6, 4, 0xfef3c7, 0xfde68a);
    const T = w.tf(0, 0, -26, 0); T.slab('g', 0xfde68a, 0, 0.72, 0, 3.6, 0.1, 1.6, 0.05); [-1.5, 1.5].forEach((x) => [-0.6, 0.6].forEach((z) => T.add('x', cyl(10), 0x94a3b8, x, 0, z, 0, 0, 0, 0.05, 0.72, 0.05)));
    K.chair(w, 0, 0, -27.6, 0, 0xc8634a); K.chair(w, 0, 0, -24.3, PI, 0x14b8a6); paperStack(w, -0.8, 0.82, -26.3, 3); w.add('x', lathe([[0, 0], [0.16, 0], [0.16, 0.03], [0.12, 0.08], [0.02, 0.18], [0, 0.2]], 20, 'bell'), 0xfbbf24, 0.9, 0.82, -26.4);
    K.whiteboard(w, 'x', -33.75, 0, 1.2, 4, 1); w.add('l', rbox(5.6, 0.7, 0.08, 0.1), 0xffd23f, 0, 3.9, -33.6, 0, 0, 0, 1, 1, 1, 0.15); txt(w, "NOW HIRING!", 0, 3.7, -33.52, 0, 0.36, 0xc8634a);
    K.plant(w, -5.2, -33.0, 1); K.plant(w, 5.2, -33.0, 1); SPOTS.interview = [0, -23.8]; SPOTS.candidate = [0, -27.6]; SPOTS.nap_interview = [4.2, -20.4, -0.6]; L.push({ x: 0, y: 3.2, z: -26, c: 0xf5e1ff, i: 12, d: 16 }); }
  // CANDY'S OFFICE (x 6..18, z -34..-18): big desk buried in paperwork, nameplate, dog bed, toy shelf, clue board, the official doormat
  { K.floor(w, 6.15, -33.75, 17.75, -18.15, 'wood', 0.08, 0xb7773f); K.rug(w, 12, -26, 0, 7, 5, 0xfbcfe8, 0xf9a8d4);
    const T = w.tf(12, 0, -30.5, 0); T.slab('g', 0x7c3f2c, 0, 0.8, 0, 4.2, 0.12, 1.8, 0.06); T.box('m', 0x6b3420, -1.6, 0, 0, 0.8, 0.8, 1.6, 0.05); T.box('m', 0x6b3420, 1.6, 0, 0, 0.8, 0.8, 1.6, 0.05); T.solid(-2.1, 0, -0.9, 2.1, 0.92, 0.9);
    for (let i = 0; i < 6; i++) paperStack(w, 10.6 + i * 0.55, 0.92, -30.5 + (i % 2) * 0.3, 4 + (i * 3) % 7); K.monitor(w, T, 1.3, 0.92, -0.5, 0, 0xf472b6); w.add('g', rbox(1.4, 0.3, 0.12, 0.04), 0xfbbf24, 12, 0.92, -29.7); txt(w, 'CANDY', 12, 0.98, -29.63, 0, 0.13, 0x7c3f2c);
    K.chair(w, 12, 0, -31.9, 0, 0xff4fa0); dogBed(w, 16.3, -32.2, 0xff4fa0); K.shelf(w, 7.0, -26, PI / 2, 3.2, 2.2, 0.6, 0xa0703f);
    for (let i = 0; i < 5; i++) { const y = 0.75 + (i % 2) * 0.75; w.add('g', sph(12), pick([0xff4fa0, 0xffd23f, 0x60a5fa, 0x4ade80]), 7.1, y, -27.3 + i * 0.6, 0, 0, 0, 0.16); }
    { const C = w.tf(17.75, 1.2, -24, -PI / 2); C.box('m', 0xa16207, 0, 0, 0, 3.2, 2.0, 0.08, 0.03); C.box('f', 0xfde68a, 0, 0.08, 0.05, 3.0, 1.84, 0.04, 0.02); for (let i = 0; i < 5; i++) C.box('m', 0xffffff, -1.1 + i * 0.55, 0.9 + (i % 2) * 0.5, 0.09, 0.4, 0.45, 0.01, 0.01); C.add('l', tube([[-1.1, 1.3, 0.11], [0, 1.6, 0.11], [1.1, 1.1, 0.11]], 0.012, 16, 4), 0xef4444, 0, 0, 0); }
    txt(w, 'HEAD OF RUFFSOURCES', 12, 3.9, -33.6, 0, 0.26, 0xfff7ed); frameArt(w, 'x', -33.75, 9, 2.3, 1.4, 1.0, 0xfde68a, 1); frameArt(w, 'x', -33.75, 15, 2.3, 1.4, 1.0, 0xc7d2fe, 1);
    SPOTS.office = [12, -27.6]; SPOTS.clueboard = [16.6, -24]; SPOTS.nap_office = [12, -21.2, 0.3]; L.push({ x: 12, y: 3.2, z: -26, c: 0xffe4e6, i: 13, d: 16 }); }
}
// ---------------- Ratita Industries branch office (Luna) ----------------
function buildRatita(w) {
  const b = shell(w, { id: 'rat', name: 'Ratita Industries Branch', x0: -46, z0: -2, x1: -30, z1: 14, h: 5, wall: 0xff8fcb, trim: 0xffd23f, roof: 0x9d174d, floor: 'tile', fc1: 0xf9a8d4, fc2: 0xfbcfe8, doors: [{ side: 'e', at: 7.2, w: 2.8 }], win: { s: 2, n: 2, w: 2, e: 1 } });
  w.region = 'out'; onSide(w, b, 'e', () => { w.add('l', wedge(), 0xffd23f, -29.6, 4.0, 2.2, 0, PI / 2, 0, 1.2, 1.2, 1.2, 0.3); txt(w, 'RATITA INDUSTRIES', -29.62, 3.4, 7.2, PI / 2, 0.36, 0xffffff); });
  w.region = 'in_rat'; K.labBench(w, -42, 2, 0, 5); K.labBench(w, -42, 8.5, 0, 5); for (let i = 0; i < 6; i++) K.beaker(w, -44 + i * 0.8, 0.95, 2 + (i % 2) * 0.3); K.cheeseRack(w, -45.2, 11.5, PI / 2, 3); K.serverRack(w, -34, 0, PI, []); K.robotArm(w, -38, 12);
  const T = w.tf(-34, 0, 7.2, PI / 2); T.slab('g', 0xffd23f, 0, 0, 0, 3.6, 1.05, 0.9, 0.12); T.box('g', 0xff4fa0, 0, 1.05, 0, 3.8, 0.08, 1.0, 0.04); txt(w, 'GADGET RETURNS', -34.6, 2.6, 7.2, PI / 2, 0.24, 0xff4fa0);
  for (let i = 0; i < 3; i++) w.add('l', rcyl(0.25, 0.08, 0.02, 20), [0x3ff0ff, 0xff4fa0, 0xffd23f][i], -34 + 0.1, 1.15, 6.2 + i * 1.0, 0, 0, 0, 1, 1, 1, 0.5);
  K.vat(w, -44.5, -0.2 + 1.2, 0x4ade80, 0.7, 2.2); K.whiteboard(w, 'x', -1.75, -38, 1.2, 4, 1);
  SPOTS.ratita = [-32.8, 7.2]; SPOTS.luna = [-34, 8.4]; w.lights.push({ x: -38, y: 3, z: 6, c: 0xffe1f2, i: 13, d: 16 });
}
// ---------------- Tortuga Tech Inc. test lab (Torty): drop tower, crash pad, shell-plate rack ----------------
function buildTortuga(w) {
  const b = shell(w, { id: 'tort', name: 'Tortuga Tech Inc.', x0: 30, z0: -2, x1: 46, z1: 14, h: 6.5, wall: 0x2dd4bf, trim: 0xfef3c7, roof: 0x0f766e, floor: 'tile', fc1: 0x99f6e4, fc2: 0x5eead4, doors: [{ side: 'w', at: 7.2, w: 2.8 }], win: { s: 2, n: 2, e: 2, w: 1 } });
  w.region = 'out'; onSide(w, b, 'w', () => { { const sx = 29.6, y = 4.6; w.add('g', sph(24), 0xb98545, sx, y, 2.4, 0, 0, 0, 0.9, 0.7, 0.25); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; w.add('g', sph(10), 0xd1a05e, sx - 0.15, y + Math.sin(a) * 0.4, 2.4 + Math.cos(a) * 0.55, 0, 0, 0, 0.06, 0.2, 0.25); } } txt(w, 'TORTUGA TECH INC.', 29.62, 3.6, 7.2, -PI / 2, 0.34, 0x0f766e); txt(w, 'DURABILITY TESTING', 29.62, 3.2, 7.2, -PI / 2, 0.16, 0x134e4a); });
  w.region = 'in_tort';
  // drop tower
  { const x = 40, z = 3; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, c]) => w.add('x', cyl(12), 0xfacc15, x + a, 0, z + c, 0, 0, 0, 0.1, 6.2, 0.1)); for (let k = 1; k < 6; k++) w.add('x', rbox(2.2, 0.08, 2.2, 0.03), 0xf59e0b, x, k * 1.15, z, 0, 0, 0); w.add('x', rbox(1.2, 0.3, 1.2, 0.06), 0x475569, x, 5.6, z); w.add('f', rcyl(1.4, 0.5, 0.2, 28), 0x60a5fa, x, 0.08, z); w.solid(x - 1.2, 0, z - 1.2, x + 1.2, 0.58, z + 1.2); K.hazard(w, x, z + 2.4, 3, 0.5); SPOTS.drop = [x, z + 3.4]; }
  // shell plate rack + crash dummy + test log
  for (let i = 0; i < 5; i++) { w.add('g', sph(20), [0xb98545, 0xd1a05e, 0x8b5e34, 0xc4b5fd, 0x5eead4][i], 34 + i * 1.1, 1.2, -1.2, 0.3, 0, 0, 0.5, 0.42, 0.14); } w.add('m', rbox(6, 0.12, 0.5, 0.03), 0x92400e, 36.2, 0.6, -1.2); w.solid(33, 0, -1.6, 39.5, 1.7, -0.8);
  { const x = 35, z = 10; w.add('g', capsule(14), 0xfacc15, x, 1.0, z, 0, 0, 0, 0.6, 0.9, 0.5); w.add('g', sph(16), 0xfacc15, x, 2.0, z, 0, 0, 0, 0.35); [-1, 1].forEach((s) => w.add('g', sph(10), 0x111827, x + s * 0.4, 1.5, z, 0, 0, 0, 0.2)); w.solid(x - 0.5, 0, z - 0.4, x + 0.5, 2.3, z + 0.4); }
  K.labBench(w, 42, 11.3, PI, 5, { top: 0x134e4a }); for (let i = 0; i < 4; i++) K.parcel(w, 40.5 + i * 0.9, 0.95, 11.3, 0.6); K.desk(w, 33.6, 3.5, PI / 2, { scr: 0x2dd4bf, chairCol: 0x14b8a6 });
  txt(w, 'SHELL-TOUGH OR BUST', 38, 4.6, -1.7, 0, 0.3, 0x0f766e);
  SPOTS.tort = [36.5, 6.2]; w.lights.push({ x: 38, y: 3.4, z: 6, c: 0xe0fff8, i: 13, d: 16 });
}
// ---------------- Bark & Brew cafe ----------------
function buildCafe(w) {
  const b = shell(w, { id: 'cafe', name: 'Bark & Brew', x0: -9, z0: 26, x1: 9, z1: 38, h: 4.6, wall: 0xfde68a, trim: 0x7c3f2c, roof: 0x7c3f2c, floor: 'wood', fc1: 0xc98d55, doors: [{ side: 'n', at: 0, w: 2.8 }], win: { n: 3, s: 3, e: 2, w: 2 } });
  w.region = 'out'; onSide(w, b, 'n', () => { awning(w, -8.6, 8.6, 25.7, 3.4, [0x7c3f2c, 0xfef3c7], -1); txt(w, 'BARK & BREW', 0, 3.9, 25.68, PI, 0.5, 0x7c3f2c); }); [-5.5, 5.5].forEach((x) => { K.tableR(w, x, 23, 0.7, 0.75, 0xffffff); w.add('f', cone(20), x < 0 ? 0xff4fa0 : 0x60a5fa, x, 2.2, 23, 0, 0, 0, 1.4, 0.6, 1.4); w.add('x', cyl(8), 0x94a3b8, x, 0.75, 23, 0, 0, 0, 0.03, 1.5, 0.03); });
  w.region = 'in_cafe'; const T = w.tf(0, 0, 36.2, 0); T.slab('g', 0x7c3f2c, 0, 0, 0, 8, 1.05, 1.0, 0.08); T.box('g', 0xfef3c7, 0, 1.05, 0, 8.2, 0.08, 1.1, 0.03); coffeeMachine(w, -2.5, 1.13, 36.4, PI); coffeeMachine(w, -1.3, 1.13, 36.4, PI);
  for (let i = 0; i < 4; i++) w.add('e', lathe([[0, 0], [0.22, 0], [0.24, 0.5], [0, 0.5]], 20, 'case'), 0xffffff, 1 + i * 0.7, 1.13, 36.2); for (let i = 0; i < 4; i++) w.add('g', sph(12), pick([0xd97706, 0xf472b6, 0xfde68a]), 1 + i * 0.7, 1.25, 36.2, 0, 0, 0, 0.13, 0.08, 0.13);
  [[-5, 30], [0, 30.5], [5, 30], [-5, 33.5], [5, 33.5]].forEach(([x, z]) => { K.tableR(w, x, z, 0.75, 0.75, 0xfef3c7, 0x7c3f2c); K.stool(w, x - 1.0, z, 0xff4fa0); K.stool(w, x + 1.0, z, 0x60a5fa); });
  w.add('l', rbox(3.4, 1.1, 0.06, 0.08), 0x1f2937, 0, 3.0, 37.7, 0, 0, 0, 1, 1, 1, 0); txt(w, 'PUPUCCINO', 0, 3.1, 37.62, PI, 0.24, 0xfef3c7, 'l', 0.4); txt(w, 'CHEESE LATTE', 0, 2.7, 37.62, PI, 0.18, 0xfde68a, 'l', 0.3);
  dogBed(w, 7.6, 27.4, 0x60a5fa); SPOTS.cafe = [0, 34.6]; SPOTS.nap_cafe = [7.4, 29.4, PI]; w.lights.push({ x: 0, y: 3, z: 32, c: 0xffe7c2, i: 12, d: 14 });
}
// ---------------- set dressing: makes every room feel lived-in ----------------
function clockW(w, axis, at, c, y, side) { const ry = axis === 'x' ? (side > 0 ? 0 : PI) : (side > 0 ? PI / 2 : -PI / 2); const T = axis === 'x' ? w.tf(c, y, at, ry) : w.tf(at, y, c, ry);
  T.add('g', rcyl(0.36, 0.08, 0.03, 28), 0xef4444, 0, 0, 0.05, PI / 2, 0, 0); T.add('m', rcyl(0.3, 0.02, 0.01, 28), 0xffffff, 0, 0, 0.1, PI / 2, 0, 0); T.box('g', 0x111827, 0, 0.08, 0.12, 0.03, 0.2, 0.01, 0.005); T.box('g', 0x111827, 0.06, 0, 0.12, 0.14, 0.03, 0.01, 0.005); }
function pendant(w, x, z, col, y = 3.1) { w.add('m', cyl(6), 0x334155, x, y, z, 0, 0, 0, 0.012, 1.2, 0.012); w.add('g', lathe([[0, 0], [0.3, 0], [0.22, 0.22], [0.04, 0.3], [0, 0.3]], 20, 'shade'), col, x, y - 0.3, z); w.add('l', sph(12), 0xfff3c4, x, y - 0.3, z, 0, 0, 0, 0.12, 0.12, 0.12, 0.6); }
function cart(w, x, z, ry) { const T = w.tf(x, 0, z, ry); T.slab('x', 0x94a3b8, 0, 0.18, 0, 1.2, 0.06, 0.7, 0.02); T.slab('m', 0xc9a06a, 0, 0.24, 0, 1.1, 0.5, 0.6, 0.05); [[-0.5, -0.28], [0.5, -0.28], [-0.5, 0.28], [0.5, 0.28]].forEach(([a, b]) => T.add('g', sph(8), 0x111827, a, 0.08, b, 0, 0, 0, 0.08)); T.add('x', cyl(8), 0x94a3b8, -0.6, 0.2, 0, 0, 0, 0, 0.02, 0.8, 0.02); for (let i = 0; i < 3; i++) K.parcel(w, x + (i - 1) * 0.3, 0.76, z, 0.45); T.solid(-0.65, 0, -0.38, 0.65, 0.9, 0.38); }
function trash(w, x, z, col = 0x64748b) { w.add('g', lathe([[0, 0], [0.18, 0], [0.22, 0.5], [0.2, 0.52], [0, 0.52]], 18, 'trash'), col, x, 0, z); paperStack(w, x, 0.45, z, 1); w.solid(x - 0.22, 0, z - 0.22, x + 0.22, 0.55, z + 0.22, { cam: false }); }
function poster(w, axis, at, c, y, W, H, col, side, word, wc = 0xffffff) { frameArt(w, axis, at, c, y, W, H, col, side); if (word) { if (axis === 'x') txt(w, word, c, y - 0.08, at + side * 0.1, side > 0 ? 0 : PI, Math.min(0.2, W / word.length * 0.9), wc); else txt(w, word, at + side * 0.1, y - 0.08, c, side > 0 ? PI / 2 : -PI / 2, Math.min(0.2, W / word.length * 0.9), wc); } }
function boxes(w, x, z, n) { for (let i = 0; i < n; i++) K.parcel(w, x + (i % 2) * 0.62, (i / 2 | 0) * 0.5, z + ((i * 7) % 3) * 0.05, 0.85); w.solid(x - 0.35, 0, z - 0.35, x + 0.95, (Math.ceil(n / 2)) * 0.5, z + 0.4, { cam: false }); }
function toyBasket(w, x, z) { w.add('f', lathe([[0, 0], [0.34, 0], [0.4, 0.34], [0.38, 0.36], [0, 0.36]], 20, 'bask'), 0xd6a35c, x, 0, z); [[0.1, 0.05, 0xff4fa0], [-0.12, 0.1, 0x60a5fa], [0.02, -0.12, 0xffd23f]].forEach(([a, b, c]) => w.add('g', sph(12), c, x + a, 0.38, z + b, 0, 0, 0, 0.12)); bone(w, 'g', 0xfef3c7, x, 0.45, z, 0.4, 0.2); w.solid(x - 0.4, 0, z - 0.4, x + 0.4, 0.45, z + 0.4, { cam: false }); }
export function dress(w) {
  w.region = 'in_hq';
  // lobby
  clockW(w, 'x', -17.8, -4.6, 2.7, 1); poster(w, 'z', -5.9, -11.5, 1.8, 2.0, 1.3, 0xffd23f, 1, 'EMPLOYEE OF THE MONTH: CANDY', 0x7c3f2c); poster(w, 'z', 5.9, -15.2, 1.8, 1.6, 1.1, 0x60a5fa, -1, 'WAG MORE');
  K.tableR(w, 4, -10.9, 0.45, 0.42, 0xfde68a); w.add('m', rbox(0.3, 0.03, 0.22, 0.01), 0xff4fa0, 4, 0.44, -10.9); w.add('m', rbox(0.3, 0.03, 0.22, 0.01), 0x60a5fa, 4.06, 0.47, -10.84, 0, 0.4, 0); K.potPlant(w, -2.0, 1.18, -15.2, 0.6, 0xff4fa0); pendant(w, -2, -12, 0xff8a3d); pendant(w, 2, -12, 0xff8a3d); trash(w, 2.6, -16.8);
  // mail room
  clockW(w, 'x', -17.8, -7.6, 2.7, 1); cart(w, -7.6, -16.3, PI / 2); boxes(w, -17.2, -16.6, 5); poster(w, 'z', -17.85, -12.6, 2.0, 2.2, 1.2, 0x2563eb, 1, 'SORT IT!'); K.potPlant(w, -6.7, 0, -8.8, 0.9, 0x2563eb); pendant(w, -14, -13, 0x60a5fa); pendant(w, -10, -13, 0x60a5fa);
  // break room
  K.potPlant(w, 6.8, 0, -17.2, 1.0, 0xf472b6); poster(w, 'z', 6.1, -14.2, 1.9, 2.0, 1.4, 0x1f2937, 1, "TODAY: KIBBLE CAKE", 0xfde68a); clockW(w, 'x', -17.8, 8.0, 2.7, 1);
  [[9.5, -12], [13.2, -12.5]].forEach(([x, z]) => { w.add('g', lathe([[0, 0], [0.3, 0], [0.34, 0.1], [0, 0.1]], 20, 'plate'), 0xffffff, x, 0.8, z); w.add('g', sph(10), 0xfbbf24, x, 0.9, z, 0, 0, 0, 0.12, 0.08, 0.12); w.add('g', lathe([[0, 0], [0.08, 0], [0.08, 0.16], [0, 0.16]], 14, 'cup'), 0xff4fa0, x + 0.4, 0.8, z + 0.2); pendant(w, x, z, 0xf472b6); });
  w.add('g', lathe([[0, 0], [0.3, 0], [0.38, 0.18], [0, 0.18]], 20, 'bowl'), 0x60a5fa, 15.0, 1.03, -17.0); [[-0.1, 0xef4444], [0.1, 0xfde047], [0, 0x22c55e]].forEach(([a, c], i) => w.add('g', sph(10), c, 15 + a, 1.2 + (i === 2 ? 0.08 : 0), -17.0 + (i - 1) * 0.06, 0, 0, 0, 0.11)); trash(w, 16.9, -8.9, 0x22c55e);
  // filing archive
  for (let i = 0; i < 4; i++) paperStack(w, -16.5 + i * 1.5, 1.32, -32.6, 3 + i); boxes(w, -17.2, -19.2, 6); w.add('l', sph(10), 0xfef08a, -9.3, 1.2, -21.3, 0, 0, 0, 0.1, 0.1, 0.1, 0.4); K.potPlant(w, -6.8, 0, -33.1, 1.1, 0x475569); clockW(w, 'z', -17.8, -25, 2.8, 1); pendant(w, -14, -22, 0xfde68a); pendant(w, -10, -30, 0xfde68a);
  // interview room
  poster(w, 'z', -5.9, -24.5, 1.9, 2.0, 1.3, 0x14b8a6, 1, 'GOOD BOY ENERGY'); poster(w, 'z', 5.9, -29.5, 1.9, 2.0, 1.3, 0xff8a3d, -1, 'TEAMWORK'); clockW(w, 'x', -33.75, 4.0, 2.7, 1);
  [-0.5, 0.5].forEach((x) => w.add('e', lathe([[0, 0], [0.07, 0], [0.08, 0.2], [0, 0.2]], 14, 'glass'), 0xbfe9ff, x, 0.82, -25.6)); { const T = w.tf(-4.8, 0, -20, 0); T.add('x', cyl(10), 0x7c4a1e, 0, 0, 0, 0, 0, 0, 0.04, 1.8, 0.04); [0, 2.1].forEach((a) => T.add('x', cyl(8), 0x7c4a1e, Math.cos(a) * 0.2, 1.6, Math.sin(a) * 0.2, 0, -a, 0.9, 0.025, 0.4, 0.025)); T.add('f', capsule(10), 0xc8634a, 0.15, 1.2, 0, 0, 0, 0.2, 0.18, 0.35, 0.12); T.solid(-0.2, 0, -0.2, 0.2, 1.8, 0.2); }
  pendant(w, 0, -26, 0xfde68a, 3.3);
  // Candy's office
  poster(w, 'z', 6.1, -21.5, 1.9, 2.0, 1.2, 0xffd23f, 1, 'BEST NAP 2026', 0x7c3f2c); toyBasket(w, 15.4, -21.2); clockW(w, 'x', -33.75, 12, 2.7, 1); K.potPlant(w, 17.2, 0, -19, 1.1, 0xff4fa0); K.potPlant(w, 7.2, 0, -33.1, 1.1, 0xff4fa0);
  [0, 1].forEach((i) => { const x = 7.1, z = -25.2 + i * 0.8, y = 2.27; w.add('x', lathe([[0, 0], [0.12, 0], [0.04, 0.08], [0.04, 0.2], [0.14, 0.3], [0.12, 0.42], [0, 0.42]], 18, 'cup2'), 0xfbbf24, x, y, z); }); pendant(w, 12, -26, 0xff4fa0, 3.3);
  // Ratita branch
  w.region = 'in_rat'; poster(w, 'x', 13.75, -38, 2.0, 2.4, 1.4, 0xff4fa0, -1, 'SAFETY GOGGLES ON!'); poster(w, 'z', -45.75, 5.2, 2.2, 1.8, 1.2, 0xffd23f, 1, 'CHEESE R&D', 0x9d174d); boxes(w, -45.2, 0.0, 4); clockW(w, 'x', -1.75, -42, 3.0, 1);
  for (let i = 0; i < 4; i++) K.beaker(w, -44 + i * 0.9, 0.95, 8.6 + (i % 2) * 0.3); K.potPlant(w, -31, 0, 13.0, 1.0, 0xff4fa0); K.potPlant(w, -31, 0, 1.0, 1.0, 0xffd23f); trash(w, -36, 13.2, 0xff4fa0); pendant(w, -42, 2, 0xff8fcb, 3.6); pendant(w, -42, 8.5, 0xff8fcb, 3.6);
  { const C = [[-38, 13.6], [-36.5, 13.6]]; C.forEach(([x, z], i) => { const T = w.tf(x, 0, z, 0); T.slab('m', 0xfbbf24, 0, 0, 0, 0.9, 0.6, 0.6, 0.06); w.add('l', wedge(), 0xffd23f, x, 0.75, z, 0, i, 0, 0.4, 0.4, 0.4, 0.2); }); w.solid(-38.5, 0, 13.3, -36, 0.7, 13.9); }
  // Tortuga Tech
  w.region = 'in_tort'; poster(w, 'x', 13.75, 34, 2.4, 2.2, 1.4, 0x0f766e, -1, 'DAYS WITHOUT A CRACK: 412', 0xfde68a); poster(w, 'z', 45.75, 5.0, 2.2, 1.8, 1.2, 0xfacc15, -1, 'TEST. DROP. REPEAT.', 0x134e4a); clockW(w, 'x', -1.75, 43, 3.2, 1);
  [[37.5, 7.5], [38.8, 8.6], [43.5, 7.4]].forEach(([x, z]) => K.cone3(w, x, z)); boxes(w, 44.4, -1.2, 6); K.potPlant(w, 31, 0, 13.0, 1.0, 0x2dd4bf); K.potPlant(w, 31, 0, 1.0, 1.0, 0x2dd4bf); trash(w, 33, 13.2, 0x14b8a6); pendant(w, 36, 6, 0x5eead4, 4.6); pendant(w, 42, 9, 0x5eead4, 4.6);
}
