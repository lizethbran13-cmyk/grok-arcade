// Grok Pickleball Park - the whole park: entrance gate + parking, the Grand Promenade, Pickle Fountain Plaza, the Clubhouse,
// the Pro Shop, the Dill-icious Snack Shack, the Training Center (with an indoor court), Stadium Court with full bleachers,
// 8 community courts, the Night Lights Court, the Quiet Practice Court, a playground, picnic lawn and Candy's Dog Run.
import * as THREE from 'three';
import * as K from './kit.js?v=ppk2';
import { rbox } from './world.js?v=ppk2';
import { shell, part, onSide } from './bld.js?v=ppk2';
import { txt, poster, frameArt, wallWord, clockW, pendant, planter, awning, trash } from './art.js?v=ppk2';
import { court, PAL, CW, fence, fencedBox, bleachers, lightTower, umpireChair, scoreFrame, paddleProp, hopper, ballBucket } from './court.js?v=ppk2';
import { COURTS } from './data.js?v=ppk2';
const { rcyl, lathe, sph, cyl, cone, torus, capsule, tube, star, heart, blobGeo, propSeed } = K;
const PI = Math.PI, R = K.R, pick = K.pick;
export const SPOTS = {}; export const SEATS = []; export const SITS = []; export const STANDS = [];
export const ENV = { sunDir: [0.5, 0.78, 0.38], sunColor: 0xfff1dc, sunI: 2.5, hemiSky: 0xd6ecff, hemiGround: 0x7a9a5a, hemiI: 0.62, skyTop: 0x2f7fe0, skyMid: 0xa8d8ff, skyBot: 0xeaf6ff, fog: 0xd8ecff, fogD: 0.0032, exposure: 1.0, envI: 0.85, bloomT: 1.05, bloomS: 0.35, sunDisc: 1, stars: 0 };
export const NIGHT = { sunDir: [-0.3, 0.7, -0.5], sunColor: 0x9db4ff, sunI: 0.55, hemiSky: 0x3a4a8a, hemiGround: 0x1a2030, hemiI: 0.45, skyTop: 0x050a24, skyMid: 0x1b2a5e, skyBot: 0x2a3570, fog: 0x141c3c, fogD: 0.006, exposure: 1.05, envI: 0.35, bloomT: 0.9, bloomS: 0.65, moon: 1, stars: 1, nebula: 0x30205a };
// reserved rectangles (no trees / clutter): [x0,z0,x1,z1]
const RES = [[-90, -14, 90, 26], [-94, -38, -84, 26], [84, -38, 94, 26], [-94, -34, 94, -26], [-20, -30, 20, 8], [-64, -64, -44, -36], [44, -64, 64, -36], [-56, 40, -14, 74], [14, 42, 48, 72], [-38, 76, -2, 98], [12, 74, 54, 114], [-6, 8, 6, 124], [-20, 42, 20, 78], [-74, 102, -8, 138], [-14, 112, 14, 126], [-16, -64, 16, -36]];
const free = (x, z, m = 2) => !RES.some(([a, b, c, d]) => x > a - m && x < c + m && z > b - m && z < d + m);
// ---------------- little helpers ----------------
function pball(w, bucket, x, y, z, r, col = 0xe6ff3b, holes = 0x9fb81a) { w.add(bucket, sph(28), col, x, y, z, 0, 0, 0, r, r, r); const n = 12; for (let i = 0; i < n; i++) { const t = Math.acos(1 - 2 * (i + 0.5) / n), p = i * 2.399; const nx = Math.sin(t) * Math.cos(p), ny = Math.cos(t), nz = Math.sin(t) * Math.sin(p); w.add(bucket, sph(12), holes, x + nx * r * 0.97, y + ny * r * 0.97, z + nz * r * 0.97, 0, 0, 0, r * 0.13, r * 0.13, r * 0.13); } }
// vertical paddle (on a wall / in a display)
function paddleV(w, x, y, z, ry, col, edge = 0x111827, grit = false, s = 1) { const T = w.tf(x, y, z, ry, s); T.add('g', rbox(0.2, 0.25, 0.014, 0.006, 1), col, 0, 0.1, 0); T.add('g', rcyl(0.1, 0.014, 0.005, 24), col, 0, 0.225, 0.007, PI / 2, 0, 0); T.add('g', rcyl(0.1, 0.014, 0.005, 24), col, 0, -0.025, 0.007, PI / 2, 0, 0);
  T.add('g', rbox(0.215, 0.04, 0.02, 0.008, 1), edge, 0, 0.31, 0); T.add('f', capsule(10), 0x1f2937, 0, -0.15, 0, 0, 0, 0, 0.055, 0.13, 0.045); T.add('g', rbox(0.12, 0.04, 0.016, 0.005, 1), edge, 0, 0.06, 0.009); if (grit) T.add('m', rbox(0.17, 0.2, 0.004, 0.002, 1), 0x4b5563, 0, 0.12, 0.009); }
function person(x, z, ry, o = {}) { STANDS.push(Object.assign({ x, z, ry }, o)); }
function seat(x, y, z, ry, o = {}) { SITS.push(Object.assign({ x, y, z, ry }, o)); }
function picnic(w, x, z, ry = 0, col = 0xb7773f) { const T = w.tf(x, 0, z, ry); T.box('m', col, 0, 0.72, 0, 1.8, 0.07, 0.8, 0.02); [-1, 1].forEach((s) => { T.box('m', col, 0, 0.42, s * 0.65, 1.8, 0.06, 0.3, 0.02); [-0.7, 0.7].forEach((a) => T.box('m', 0x8b5a2b, a, 0, s * 0.3, 0.07, 0.72, 0.07, 0.01)); }); T.solid(-0.9, 0, -0.8, 0.9, 0.78, 0.8); }
function canopyZ(w, x, z0, z1, y, cols, dir = 1) { const n = Math.round((z1 - z0) / 0.8); for (let i = 0; i < n; i++) { const z = z0 + (i + 0.5) * (z1 - z0) / n; w.add('f', rbox(1.6, 0.06, (z1 - z0) / n + 0.02, 0.03), cols[i % 2], x + dir * 0.75, y, z, 0, 0, dir * 0.35); w.add('f', sph(10), cols[i % 2], x + dir * 1.5, y - 0.36, z, 0, 0, 0, 0.1, 0.14, (z1 - z0) / n / 2); } }
function umbrella(w, x, z, col) { w.add('x', cyl(8), 0xe5e7eb, x, 0, z, 0, 0, 0, 0.04, 2.4, 0.04); w.add('f', cone(16), col, x, 2.0, z, 0, 0, 0, 1.4, 0.55, 1.4); w.add('f', sph(8), 0xffffff, x, 2.56, z, 0, 0, 0, 0.07); }
function hedge(w, axis, at, from, to, H = 1.6) { const n = Math.round((to - from) / 1.4); for (let i = 0; i <= n; i++) { const p = from + i * (to - from) / n, x = axis === 'x' ? p : at, z = axis === 'x' ? at : p; w.add('g', blobGeo(((x * 3 + z * 7) | 0) & 63, 0.12, 2), 0x2f8f46, x, H * 0.5, z, 0, R() * 6, 0, 0.95, H * 0.55, 0.95); }
  if (axis === 'x') w.solid(from, 0, at - 0.8, to, H, at + 0.8); else w.solid(at - 0.8, 0, from, at + 0.8, H, to); }
function sign(w, x, z, ry, word, col = 0x16a34a, sub) { const T = w.tf(x, 0, z, ry); [-0.9, 0.9].forEach((a) => T.add('x', cyl(10), 0x334155, a, 0, 0, 0, 0, 0, 0.05, 2.2, 0.05)); T.box('g', col, 0, 1.4, 0, 2.2, 0.9, 0.1, 0.05); txt(w, word, ...T.P(0, 1.88 - (sub ? 0 : 0.12), 0.06), ry, Math.min(0.24, 2.0 / word.length * 1.25), 0xffffff, 'g'); if (sub) txt(w, sub, ...T.P(0, 1.55, 0.06), ry, Math.min(0.14, 2.0 / sub.length * 1.3), 0xe6ff3b, 'g'); T.solid(-1.1, 0, -0.1, 1.1, 2.3, 0.1); }
function bikeRack(w, x, z, n = 5) { for (let i = 0; i < n; i++) w.add('x', torus(0.06, 20, PI), 0x94a3b8, x + i * 0.7, 0, z, 0, 0, 0, 0.35, 0.6, 0.35); w.solid(x - 0.4, 0, z - 0.1, x + n * 0.7, 0.6, z + 0.1, { cam: false }); }
function fountainDrink(w, x, z) { w.add('g', rcyl(0.25, 0.9, 0.06, 18), 0x64748b, x, 0, z); w.add('g', lathe([[0, 0], [0.28, 0], [0.32, 0.12], [0, 0.12]], 18, 'fb'), 0x94a3b8, x, 0.9, z); w.solid(x - 0.3, 0, z - 0.3, x + 0.3, 1, z + 0.3); }
function stringLights(w, a, b, n, cols, sag = 0.6) { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * PI) * sag, a[2] + (b[2] - a[2]) * t]); } w.add('m', tube(pts, 0.012, 24, 4), 0x1f2937, 0, 0, 0);
  for (let i = 1; i < n; i++) { const t = i / n, y = a[1] + (b[1] - a[1]) * t - Math.sin(t * PI) * sag; w.add('l', sph(8), cols[i % cols.length], a[0] + (b[0] - a[0]) * t, y - 0.08, a[2] + (b[2] - a[2]) * t, 0, 0, 0, 0.07, 0.09, 0.07, 0.9); } }
function trophy(w, x, y, z, s = 1, col = 0xfcd34d) { w.add('x', rcyl(0.12 * s, 0.06 * s, 0.02, 16), 0x7c4a1e, x, y, z); w.add('x', cyl(10), col, x, y + 0.06 * s, z, 0, 0, 0, 0.025 * s, 0.14 * s, 0.025 * s); w.add('x', lathe([[0, 0], [0.04, 0], [0.12, 0.08], [0.14, 0.22], [0.13, 0.24], [0, 0.12]], 20, 'cup'), col, x, y + 0.2 * s, z, 0, 0, 0, s, s, s); [-1, 1].forEach((sd) => w.add('x', torus(0.2, 12), col, x + sd * 0.14 * s, y + 0.34 * s, z, 0, 0, 0, 0.06 * s)); }
function lockers(w, x, z, ry, n, col) { const T = w.tf(x, 0, z, ry); for (let i = 0; i < n; i++) { const lx = -n * 0.25 + 0.25 + i * 0.5; T.box('x', i % 2 ? col : K.shadeC ? col : col, lx, 0.1, 0, 0.48, 1.9, 0.5, 0.02); for (let k = 0; k < 3; k++) T.box('m', 0x1f2937, lx, 1.6 + k * 0.06, 0.26, 0.3, 0.02, 0.01, 0.005); T.add('x', sph(8), 0xe5e7eb, lx + 0.16, 1.1, 0.26, 0, 0, 0, 0.025); } T.box('m', 0x475569, 0, 0, 0, n * 0.5, 0.1, 0.5, 0.01); T.solid(-n * 0.25, 0, -0.25, n * 0.25, 2.0, 0.25); }
function tv(w, x, y, z, ry, W = 2.4, scr = 0x2f9e57) { const T = w.tf(x, y, z, ry); T.box('x', 0x111827, 0, 0, 0, W, W * 0.58, 0.08, 0.03); T.box('l', scr, 0, 0.06, 0.045, W - 0.12, W * 0.58 - 0.12, 0.01, 0.01, 0.25);
  // tiny pickleball court on the screen (real raised strips)
  T.box('l', 0x2f7fd6, 0, W * 0.15, 0.052, W * 0.32, W * 0.26, 0.005, 0.002, 0.3); T.box('l', 0xffffff, 0, W * 0.275, 0.056, W * 0.32, 0.01, 0.004, 0.001, 0.6); }
function fireplace(w, x, z, ry) { const T = w.tf(x, 0, z, ry); T.slab('m', 0xa8a29e, 0, 0, 0, 2.4, 2.6, 0.7, 0.06); T.box('m', 0x292524, 0, 0.3, 0.2, 1.3, 1.0, 0.4, 0.04); T.add('l', blobGeo(7, 0.3, 1), 0xff8a1f, 0, 0.55, 0.3, 0, 0, 0, 0.35, 0.3, 0.12, 0.8); T.add('l', blobGeo(9, 0.3, 1), 0xffd23f, 0.1, 0.5, 0.32, 0, 0, 0, 0.2, 0.2, 0.08, 0.9); T.box('m', 0x78716c, 0, 2.6, 0, 2.7, 0.15, 0.85, 0.04); T.solid(-1.2, 0, -0.35, 1.2, 2.6, 0.35); }
function dumbbellRack(w, x, z, ry) { const T = w.tf(x, 0, z, ry); T.box('x', 0x334155, 0, 0, 0, 2.0, 0.7, 0.5, 0.03); for (let i = 0; i < 6; i++) { const lx = -0.8 + i * 0.32; [-0.1, 0.1].forEach((dz) => { T.add('x', cyl(8), 0x94a3b8, lx, 0.78, dz, 0, 0, PI / 2, 0.02, 0.2, 0.02); [-0.1, 0.1].forEach((e) => T.add('g', rcyl(0.05 + i * 0.006, 0.05, 0.01, 14), 0x111827, lx + e, 0.78, dz, 0, 0, PI / 2)); }); } T.solid(-1, 0, -0.25, 1, 0.9, 0.25); }
function ballMachine(w, x, z, ry, col = 0x2563eb) { const T = w.tf(x, 0, z, ry); T.box('g', col, 0, 0.18, 0, 0.6, 0.55, 0.7, 0.08); T.add('e', lathe([[0, 0], [0.18, 0], [0.32, 0.3], [0, 0.3]], 20, 'hop'), 0xbfe9ff, 0, 0.73, 0); for (let i = 0; i < 6; i++) T.add('g', sph(8), 0xe6ff3b, Math.cos(i) * 0.12, 0.88, Math.sin(i) * 0.12, 0, 0, 0, 0.037);
  T.add('x', cyl(12), 0x111827, 0, 0.5, 0.36, PI / 2, 0, 0, 0.08, 0.12, 0.08); [-0.25, 0.25].forEach((a) => T.add('g', sph(10), 0x111827, a, 0.12, -0.3, 0, 0, 0, 0.12)); T.add('l', sph(8), 0x4ade80, 0.2, 0.62, 0.36, 0, 0, 0, 0.03, 0.03, 0.02, 0.8); T.solid(-0.35, 0, -0.4, 0.35, 0.9, 0.4); }
function target(w, x, z, col = 0xff4fa0) { w.add('l', torus(0.06, 32), col, x, 0.1, z, PI / 2, 0, 0, 0.5, 0.5, 0.5, 0.5); w.add('m', rcyl(0.18, 0.01, 0.004, 20), col, x, 0.09, z); }
function cones(w, x, z, n, dx) { for (let i = 0; i < n; i++) K.cone3(w, x + i * dx, z); }
function gymMat(w, x, z, col) { w.add('f', rbox(1.0, 0.04, 2.0, 0.02, 1), col, x, 0.08, z); }
function menuBoard(w, x, y, z, ry, items) { const T = w.tf(x, y, z, ry); T.box('m', 0x1f2937, 0, 0, 0, 3.4, 1.7, 0.08, 0.04); items.forEach((it, i) => { txt(w, it, ...T.P(-0.15, 1.42 - i * 0.3, 0.05), ry, 0.15, i ? 0xfef3c7 : 0xe6ff3b, 'l', 0.3); }); }
function shirtRack(w, x, z, ry, cols) { const T = w.tf(x, 0, z, ry); [-0.9, 0.9].forEach((a) => T.add('x', cyl(8), 0x94a3b8, a, 0, 0, 0, 0, 0, 0.025, 1.55, 0.025)); T.add('x', cyl(8), 0x94a3b8, -0.95, 1.55, 0, 0, 0, -PI / 2, 0.02, 1.9, 0.02);
  cols.forEach((c, i) => { const lx = -0.8 + i * (1.6 / Math.max(1, cols.length - 1)); T.add('f', rbox(0.08, 0.7, 0.5, 0.04, 1), c, lx, 1.12, 0); T.add('f', rbox(0.08, 0.2, 0.75, 0.05, 1), c, lx, 1.36, 0); T.add('x', torus(0.15, 10, PI), 0xcbd5e1, lx, 1.5, 0, 0, PI / 2, 0, 0.05); }); T.solid(-1, 0, -0.4, 1, 1.6, 0.4); }
function shoeWall(w, x, z, ry, rows = 4, cols = 6) { const T = w.tf(x, 0, z, ry); T.box('m', 0xf5f5f4, 0, 0, 0, cols * 0.42 + 0.2, 2.6, 0.3, 0.03); for (let r = 0; r < rows; r++) { T.box('g', 0xffffff, 0, 0.4 + r * 0.55, 0.12, cols * 0.42, 0.03, 0.32, 0.01); for (let c = 0; c < cols; c++) { const col = pick([0xffffff, 0xef4444, 0x2563eb, 0x22c55e, 0x111827, 0xf472b6, 0xe6ff3b]); const lx = -cols * 0.21 + 0.21 + c * 0.42; T.add('g', sph(12), col, lx, 0.5 + r * 0.55, 0.16, 0, 0, 0, 0.16, 0.08, 0.07); T.add('g', sph(10), 0xffffff, lx - 0.02, 0.45 + r * 0.55, 0.16, 0, 0, 0, 0.17, 0.035, 0.075); } } T.solid(-cols * 0.21 - 0.1, 0, -0.2, cols * 0.21 + 0.1, 2.6, 0.25); }
function ballShelf(w, x, z, ry, L = 3) { const T = w.tf(x, 0, z, ry); T.box('m', 0xe2e8f0, 0, 0, 0, L, 2.2, 0.5, 0.03); for (let r = 0; r < 4; r++) { T.box('g', 0xffffff, 0, 0.35 + r * 0.48, 0.05, L, 0.03, 0.5, 0.01);
    for (let i = 0; i < L / 0.3 - 1; i++) { const lx = -L / 2 + 0.25 + i * 0.3, c = [0xe6ff3b, 0xff8a1f, 0xfde047, 0x7cff4f][r]; T.add('e', rcyl(0.06, 0.3, 0.02, 14), 0xcfefff, lx, 0.38 + r * 0.48, 0.1); for (let k = 0; k < 3; k++) T.add('g', sph(8), c, lx, 0.43 + r * 0.48 + k * 0.08, 0.1, 0, 0, 0, 0.037); } } T.solid(-L / 2, 0, -0.25, L / 2, 2.2, 0.3); }
function register(w, x, z, ry) { const T = w.tf(x, 0, z, ry); T.box('g', 0x1f2937, 0, 1.05, 0, 0.42, 0.18, 0.36, 0.04); T.box('l', 0x38bdf8, 0, 1.25, -0.05, 0.36, 0.22, 0.03, 0.02, 0.4); T.box('x', 0x94a3b8, 0, 1.23, 0.02, 0.06, 0.12, 0.06, 0.01); }
// ================================================================
export function buildMap(w) {
  propSeed(4848); const L = w.lights; w.region = 'out';
  // ground: lawn with gentle colour variation, hills ringing the park
  { const N = 120, Sz = 420; const g = new THREE.PlaneGeometry(Sz, Sz, N, N); g.rotateX(-PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i) - 30, r = Math.max(Math.abs(x) * 0.95, Math.abs(z) * 0.9); const hill = r > 118 ? Math.pow((r - 118) / 70, 1.6) * 22 * (0.7 + 0.3 * Math.sin(x * 0.05) * Math.cos(z * 0.04)) : 0; p.setY(i, hill - 0.02); p.setZ(i, p.getZ(i) + 30); } g.computeVertexNormals();
    w.addFn('m', g, (c, x, y, z) => { const n = Math.sin(x * 0.19) * Math.cos(z * 0.15) * 0.5 + Math.sin(x * 0.04 + z * 0.06) * 0.5; c.setHSL(0.27 + n * 0.025, 0.52, 0.42 + n * 0.05 + Math.min(0.08, y * 0.004)); }, 0, 0, 0); w.solid(-210, -3, -180, 210, 0, 240, { floor: true }); }
  paths(w); plaza(w); entrance(w); stadium(w); complexes(w); nightCourt(w); quietCourt(w); northLawn(w);
  clubhouse(w); proShop(w); snackBar(w); training(w); shopFill(w); clubFill(w); snackFill(w); trainFill(w); nature(w);
  w.region = 'out';
}
function paths(w) { const T = (x0, z0, x1, z1, c1 = 0xe8dcc4, c2 = 0xdccfb4) => K.floor(w, x0, z0, x1, z1, 'tile', 0.02, c1, c2, 1.5);
  T(-3.5, 76, 3.5, 118); T(-3.5, 4.6, 3.5, 44); // Grand Promenade (south) + stadium approach (north)
  T(-84, 16, 84, 22, 0xd9cfbd, 0xcdc2ad); // Court Row walk
  T(-56, 52, -16, 58); T(16, 54, 56, 60); // to clubhouse / pro shop doors
  T(-14, 84, -3.5, 90); T(3.5, 89, 16, 95); // snack shack + training center
  T(-92, -36, -86, 22); T(86, -36, 92, 22); // to the north courts (around the fenced court rows, not through them)
  T(-3, -36, 3, -28); T(-92, -32, 92, -28, 0xd9cfbd, 0xcdc2ad); // north walk behind the stadium
  // edging stones along the promenade
  for (let z = 78; z < 118; z += 1.2) [-3.7, 3.7].forEach((x) => w.add('g', rbox(0.25, 0.12, 1.1, 0.04, 1), 0xbfb5a0, x, 0.06, z + 0.55));
}
function plaza(w) { K.floor(w, -16, 44, 16, 76, 'tile', 0.025, 0xf3e8d8, 0xe9d6bd, 2);
  // Pickle Fountain: a giant pickleball on a paddle-shaped pedestal, water ring + jets
  const x = 0, z = 60; w.add('g', rcyl(7.2, 0.7, 0.2, 56), 0xe7e5e4, x, 0, z); w.solid(x - 6.4, 0, z - 6.4, x + 6.4, 0.7, z + 6.4); w.add('e', rcyl(6.7, 0.55, 0.1, 56), 0x67e8f9, x, 0.12, z);
  w.add('g', rcyl(1.6, 1.6, 0.2, 32), 0xd6d3d1, x, 0.6, z); pball(w, 'g', x, 4.1, z, 2.3);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; w.add('l', tube([[x + Math.cos(a) * 1.6, 1.6, z + Math.sin(a) * 1.6], [x + Math.cos(a) * 3.6, 3.4, z + Math.sin(a) * 3.6], [x + Math.cos(a) * 5.4, 0.8, z + Math.sin(a) * 5.4]], 0.05, 16, 6), 0xbff6ff, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0.2); }
  // two crossed paddles statue on the plinth
  SPOTS.fountain = [x, z + 8];
  [[-11, 48], [11, 48], [-11, 72], [11, 72]].forEach(([bx, bz]) => { K.bench(w, bx, bz, bx < 0 ? PI / 2 : -PI / 2, 0x16a34a); seat(bx + (bx < 0 ? 0.3 : -0.3), 0.55, bz, bx < 0 ? PI / 2 : -PI / 2); });
  [[-15, 45], [15, 45], [-15, 75], [15, 75], [-7, 77], [7, 77]].forEach(([lx, lz]) => K.lampPost(w, lx, lz));
  planter(w, -8, 44.8, 6, 0, 0xe6ff3b); planter(w, 8, 44.8, 6, 0, 0xff6fb5); trash(w, 13.5, 50); trash(w, -13.5, 70, 0x16a34a); fountainDrink(w, 13.5, 70);
  // park map board
  { const T = w.tf(-6, 0, 74.6, PI); T.box('x', 0x334155, 0, 0, 0, 0.2, 1.0, 0.2, 0.03); T.box('g', 0x14532d, 0, 1.0, 0, 3.0, 1.8, 0.12, 0.05); T.box('m', 0x8bd17c, 0, 1.15, 0.07, 2.7, 1.45, 0.02, 0.01);
    [[0, 1.75, 0x2f7fd6, 0.5, 0.35], [-0.9, 1.35, 0x2f9e57, 0.7, 0.3], [0.9, 1.35, 0x2f9e57, 0.7, 0.3], [-0.6, 1.95, 0x6d4fd1, 0.3, 0.25], [0.6, 1.95, 0x14a3a8, 0.3, 0.25]].forEach(([a, b, c, ww, hh]) => T.box('g', c, a, b, 0.09, ww, hh, 0.02, 0.01)); txt(w, 'PARK MAP', ...T.P(0, 2.55, 0.08), PI, 0.2, 0xe6ff3b); T.solid(-1.5, 0, -0.15, 1.5, 2.9, 0.15); SPOTS.map = [-6, 73.2]; }
  // food cart (pickle pops) + balloons
  { const T = w.tf(9, 0, 68, -0.4); T.slab('g', 0xffffff, 0, 0.3, 0, 1.8, 0.9, 1.0, 0.1); T.box('g', 0x22c55e, 0, 0.3, 0.51, 1.7, 0.8, 0.02, 0.02); [-0.7, 0.7].forEach((a) => T.add('g', rcyl(0.3, 0.12, 0.04, 18), 0x111827, a, 0, 0.5, PI / 2, 0, 0)); T.add('f', cone(16), 0xe6ff3b, 0, 1.9, 0, 0, 0, 0, 1.3, 0.5, 1.3); T.add('x', cyl(8), 0xcbd5e1, 0, 1.2, 0, 0, 0, 0, 0.03, 0.8, 0.03); txt(w, 'PICKLE POPS', ...T.P(0, 0.78, 0.53), -0.4, 0.16, 0xffffff);
    for (let i = 0; i < 5; i++) { const a = -0.6 + i * 0.3; w.add('m', tube([[9.6, 1.2, 68], [9.6 + a * 0.4, 2.6, 68 + a * 0.3]], 0.006, 6, 3), 0xffffff, 0, 0, 0); w.add('g', sph(14), pick([0xff4fa0, 0xe6ff3b, 0x60a5fa, 0x4ade80]), 9.6 + a * 0.4, 2.85, 68 + a * 0.3, 0, 0, 0, 0.22, 0.27, 0.22); } SPOTS.pops = [8.4, 66.6]; person(9.6, 66.9, PI + 0.4, { staff: true }); }
}
function entrance(w) { // gate arch, ticket booth, parking lot with cars, bus stop, bike racks
  const z = 120; [-7, 7].forEach((x) => { w.add('g', rcyl(0.8, 6.2, 0.15, 24), 0x16a34a, x, 0, z); w.add('g', sph(20), 0xe6ff3b, x, 6.6, z, 0, 0, 0, 0.9); w.solid(x - 0.8, 0, z - 0.8, x + 0.8, 6.2, z + 0.8); });
  w.add('g', rbox(16, 1.4, 0.8, 0.3), 0x16a34a, 0, 6.6, z); txt(w, 'GROK PICKLEBALL PARK', 0, 6.35, z + 0.42, 0, 0.62, 0xffffff); txt(w, 'GROK PICKLEBALL PARK', 0, 6.35, z - 0.42, PI, 0.62, 0xffffff); pball(w, 'g', 0, 7.9, z, 0.7);
  stringLights(w, [-7, 5.6, z], [7, 5.6, z], 18, [0xffd23f, 0xff4fa0, 0x60a5fa, 0x4ade80], 0.7);
  K.floor(w, -12, 112, 12, 126, 'tile', 0.02, 0xe8dcc4, 0xdccfb4, 1.5);
  { const T = w.tf(10.5, 0, 116, -PI / 2); T.slab('g', 0xfef3c7, 0, 0, 0, 2.6, 2.4, 2.0, 0.1); T.box('e', 0xcfefff, 0, 1.1, 1.01, 1.8, 0.9, 0.04, 0.02); T.box('g', 0xef4444, 0, 2.4, 0, 3.0, 0.3, 2.4, 0.08); txt(w, 'TICKETS', ...T.P(0, 2.45, 1.21), -PI / 2, 0.22, 0xffffff); SPOTS.tickets = [8.4, 116]; person(10.5, 116, -PI / 2, { staff: true }); }
  sign(w, -9.5, 112.6, PI, 'WELCOME!', 0x16a34a, 'Courts · Pro Shop · Snacks');
  // parking lot
  K.floor(w, -72, 104, -10, 136, 'tile', 0.015, 0x64748b, 0x5b6474, 3);
  for (let i = 0; i < 9; i++) for (let r = 0; r < 2; r++) w.add('l', rbox(0.15, 0.02, 4.6, 0.01), 0xffffff, -68 + i * 6.5, 0.05, 110 + r * 18, 0, 0, 0, 1, 1, 1, 0);
  const carC = [0xff4fa0, 0x60a5fa, 0xffd23f, 0x4ade80, 0xf97316, 0xa78bfa, 0xffffff, 0xef4444, 0x14b8a6, 0x111827];
  for (let i = 0; i < 14; i++) { const r = i % 2, k = (i / 2) | 0; if (k > 7) continue; K.toyCar(w, -65 + k * 6.5 + (r ? 3.2 : 0), 110 + r * 18, r ? PI : 0, carC[i % carC.length]); }
  // pickleball-van with paddles on the roof rack
  { const T = w.tf(-30, 0, 129, PI); T.slab('g', 0xe6ff3b, 0, 0.3, 0, 2.2, 1.8, 5.0, 0.4); T.box('e', 0xbfe9ff, 0, 1.3, -1.6, 2.1, 0.7, 1.4, 0.2); [[-1, -1.6], [1, -1.6], [-1, 1.6], [1, 1.6]].forEach(([a, b]) => T.add('g', rcyl(0.42, 0.3, 0.08, 20), 0x111827, a * 1.05, 0.42, b, 0, 0, PI / 2)); T.box('x', 0x334155, 0, 2.1, 0.5, 1.8, 0.06, 3.0, 0.02); }
  paddleProp(w, -30.4, 2.25, 128.5, 0, 0, 0x2563eb, 1.6); paddleProp(w, -29.6, 2.25, 129.4, 0.3, 0, 0xef4444, 1.6);
  // bus stop + bike racks + flags
  { const T = w.tf(18, 0, 122, 0); [-1.6, 1.6].forEach((a) => T.add('x', cyl(10), 0x334155, a, 0, -0.6, 0, 0, 0, 0.06, 2.6, 0.06)); T.box('e', 0xcfefff, 0, 0.2, -0.65, 3.4, 2.2, 0.05, 0.02); T.box('g', 0x16a34a, 0, 2.6, 0, 3.6, 0.12, 1.6, 0.04); T.box('m', 0xb7773f, 0, 0.45, -0.3, 3, 0.08, 0.4, 0.02); txt(w, 'PARK BUS', ...T.P(0, 2.78, 0.82), 0, 0.2, 0xffffff); seat(18.6, 0.5, 121.9, 0); }
  bikeRack(w, 13, 108.5, 6); bikeRack(w, -16, 108.5, 5);
  [[-12, 112], [12, 112], [-12, 126], [12, 126]].forEach(([fx, fz], i) => { w.add('x', cyl(8), 0xe5e7eb, fx, 0, fz, 0, 0, 0, 0.05, 6, 0.05); w.add('f', rbox(1.6, 1.0, 0.03, 0.02, 1), [0xe6ff3b, 0x16a34a, 0x2563eb, 0xff4fa0][i], fx + 0.82, 5.4, fz); });
}
// ---------------- Stadium Court ----------------
function stadium(w) { const C = COURTS.center, cx = C.x, cz = C.z;
  K.floor(w, -14.5, -24, 14.5, 4.6, 'tile', 0.01, 0x334155, 0x3b4658, 3);
  court(w, cx, cz, PAL.blue, { bench: 0x1d4ed8, runX: 4.2, runZ: 4.6 });
  const seatsW = bleachers(w, 'z', cz - 10.5, cz + 10, cx - 8.4, -1, 8, { cols: [0x2563eb, 0x1d4ed8] }), seatsE = bleachers(w, 'z', cz - 10.5, cz + 10, cx + 8.4, 1, 8, { cols: [0x2563eb, 0x1d4ed8] });
  const seatsN = bleachers(w, 'x', cx - 8.2, cx + 8.2, cz - 11.0, -1, 8, { cols: [0xe6ff3b, 0xd9f02e] });
  const seatsS1 = bleachers(w, 'x', cx - 8.2, cx - 2.2, cz + 11.0, 1, 5, { cols: [0xe6ff3b, 0xd9f02e] }), seatsS2 = bleachers(w, 'x', cx + 2.2, cx + 8.2, cz + 11.0, 1, 5, { cols: [0xe6ff3b, 0xd9f02e] });
  [seatsW, seatsE, seatsN, seatsS1, seatsS2].forEach((s) => s.forEach((q) => SEATS.push(q)));
  // corner light towers + entrance arch + scoreboard frame (the live scoreboard screen is added by the game)
  [[-13.5, -22], [13.5, -22], [-13.5, 9.5], [13.5, 9.5]].forEach(([x, z]) => lightTower(w, x, z, Math.atan2(cx - x, cz - z), 13));
  scoreFrame(w, cx, 7.2, cz - 19.6, 0, 6.4, 3.4); SPOTS.score = [cx, 7.2 + 0.2, cz - 19.6 + 0.21, 6.4, 3.4];
  w.add('g', rbox(4.6, 0.6, 0.6, 0.2), 0x1d4ed8, cx, 3.6, cz + 11.2); [-2.1, 2.1].forEach((x) => { w.add('g', rcyl(0.25, 3.6, 0.06, 16), 0x1d4ed8, cx + x, 0, cz + 11.2); w.solid(cx + x - 0.3, 0, cz + 10.9, cx + x + 0.3, 3.6, cz + 11.5); }); txt(w, 'STADIUM COURT', cx, 3.42, cz + 11.52, 0, 0.32, 0xffffff);
  umpireChair(w, cx - 4.3, cz, PI / 2); SPOTS.ump = [cx - 4.3, 2.0, cz]; SPOTS.stadium = [cx, cz + 13];
  // sponsor boards along the court ends
  [-1, 1].forEach((s) => { for (let i = 0; i < 3; i++) { const x = cx - 5 + i * 5, z = cz + s * 10.3; w.add('g', rbox(4.4, 0.8, 0.12, 0.05), [0x16a34a, 0x2563eb, 0xef4444][i], x, 0.4, z); txt(w, ['GROK PICKLEBALL', 'MAXGRIT', 'TORTUGA TECH'][i], x, 0.32, z + s * 0.07, s > 0 ? 0 : PI, 0.22, 0xffffff); } });
  w.solid(cx - 7.6, 0, cz - 10.45, cx + 7.6, 0.8, cz - 10.2, { cam: false }); w.solid(cx - 7.6, 0, cz + 10.2, cx - 2.3, 0.8, cz + 10.45, { cam: false }); w.solid(cx + 2.3, 0, cz + 10.2, cx + 7.6, 0.8, cz + 10.45, { cam: false });
  sign(w, 5.2, 6.4, 0, 'STADIUM COURT', 0x1d4ed8, 'Tournaments · Exhibitions'); SPOTS.stadiumSign = [5.2, 7.8];
  w.lights.push({ x: cx, y: 9, z: cz, c: 0xfff6d8, i: 26, d: 40 });
}
function complexes(w) { const G = [['w1', 'blue'], ['w2', 'green'], ['w3', 'blue'], ['w4', 'green'], ['e1', 'teal'], ['e2', 'blue'], ['e3', 'teal'], ['e4', 'blue']];
  for (const [id, pal] of G) { const c = COURTS[id]; court(w, c.x, c.z, PAL[pal], { bench: id[0] === 'w' ? 0x16a34a : 0x0f766e }); SPOTS['court_' + id] = [c.x - 4.4, c.z + 9.2];
    // court number post
    w.add('x', cyl(8), 0x334155, c.x - 4.6, 0, c.z + 10.2, 0, 0, 0, 0.05, 1.6, 0.05); w.add('g', rcyl(0.38, 0.06, 0.02, 24), 0xe6ff3b, c.x - 4.6, 1.65, c.z + 10.2, PI / 2, 0, 0); txt(w, id.toUpperCase(), c.x - 4.6, 1.56, c.z + 10.27, 0, 0.2, 0x14532d); }
  fencedBox(w, -84.2, -8.6, -35.8, 12.6, [{ side: 's', at: -48, w: 2.4 }, { side: 's', at: -72, w: 2.4 }, { side: 'e', at: 2, w: 2.4 }], { H: 3, words: 'GROK PICKLEBALL PARK' });
  fencedBox(w, 35.8, -8.6, 84.2, 12.6, [{ side: 's', at: 48, w: 2.4 }, { side: 's', at: 72, w: 2.4 }, { side: 'w', at: 2, w: 2.4 }], { H: 3, words: 'GROK PICKLEBALL PARK' });
  // divider nets between courts (low curtains)
  for (const x of [-48, -60, -72, 48, 60, 72]) { w.add('f', rbox(0.04, 1.0, 18, 0.01, 1), 0x14532d, x, 0.55, 2); w.solid(x - 0.05, 0, -7, x + 0.05, 1.05, 11, { cam: false }); }
  // spectator benches + shade along the Court Row walk
  for (const x of [-78, -66, -54, -42, 42, 54, 66, 78]) { K.bench(w, x - 2.5, 14.2, PI, 0x16a34a); seat(x - 2.5, 0.55, 14.5, PI); if (R() < 0.6) seat(x - 1.8, 0.55, 14.5, PI); w.add('x', cyl(8), 0x334155, x + 2, 0, 14.2, 0, 0, 0, 0.05, 2.6, 0.05); w.add('f', rbox(2.6, 0.06, 1.6, 0.03), x > 0 ? 0x14b8a6 : 0x22c55e, x + 2, 2.6, 14.2, 0.12, 0, 0); }
  [-84, -36, 36, 84].forEach((x) => K.lampPost(w, x, 19)); [-20, 20].forEach((x) => K.lampPost(w, x, 23.5));
  sign(w, -30, 23.2, 0, 'WEST COURTS', 0x16a34a, 'Courts W1-W4 · Open play'); sign(w, 30, 23.2, 0, 'EAST COURTS', 0x0f766e, 'Courts E1-E4 · Open play');
  // court-side "next up" paddle rack (put your paddle in line = classic park tradition)
  [[-37, 15.2], [37, 15.2]].forEach(([x, z]) => { const T = w.tf(x, 0, z, 0); T.box('m', 0xb7773f, 0, 0.9, 0, 2.2, 0.1, 0.3, 0.02); [-1, 1].forEach((a) => T.box('m', 0x8b5a2b, a, 0, 0, 0.1, 0.9, 0.3, 0.02)); for (let i = 0; i < 5; i++) paddleV(w, x - 0.85 + i * 0.42, 1.12, z + 0.1, 0, pick([0xef4444, 0x2563eb, 0x22c55e, 0xf97316, 0xa855f7])); T.solid(-1.1, 0, -0.2, 1.1, 1.4, 0.2); txt(w, 'PADDLES UP: NEXT GAME', ...T.P(0, 1.55, 0), 0, 0.14, 0x14532d); });
}
function nightCourt(w) { const c = COURTS.night, cx = c.x, cz = c.z;
  K.floor(w, cx - 9, cz - 12, cx + 9, cz + 12, 'tile', 0.01, 0x1e293b, 0x243247, 3);
  court(w, cx, cz, PAL.purple, { bench: 0x7c3aed, netCol: 0x0b0f19 });
  fencedBox(w, cx - 8.4, cz - 11.2, cx + 8.4, cz + 11.2, [{ side: 's', at: cx, w: 2.6 }], { H: 3.4, col: 0x1e1b4b, words: 'NIGHT LIGHTS' });
  [[-7.4, -10.2], [7.4, -10.2], [-7.4, 10.2], [7.4, 10.2]].forEach(([dx, dz]) => lightTower(w, cx + dx, cz + dz, Math.atan2(-dx, -dz), 12, 0xeaf2ff));
  for (let i = 0; i < 5; i++) stringLights(w, [cx - 8.4, 3.4, cz - 9 + i * 4.5], [cx + 8.4, 3.4, cz - 9 + i * 4.5], 22, [0xffe08a, 0xff9ad5, 0x9be7ff], 0.5);
  { const T = w.tf(cx, 0, cz + 11.4, 0); [-1.6, 1.6].forEach((a) => T.add('x', cyl(10), 0x312e81, a, 0, 0, 0, 0, 0, 0.1, 4.2, 0.1)); T.box('g', 0x312e81, 0, 4.0, 0, 3.8, 0.8, 0.2, 0.08); txt(w, 'NIGHT LIGHTS COURT', ...T.P(0, 4.15, 0.12), 0, 0.24, 0xe9d5ff, 'l', 0.5); T.add('l', star(), 0xffe08a, -1.7, 4.4, 0.12, 0, 0, 0, 0.2, 0.2, 0.2, 0.8); T.add('l', star(), 0xffe08a, 1.7, 4.4, 0.12, 0, 0, 0, 0.2, 0.2, 0.2, 0.8); }
  const s = bleachers(w, 'z', cz - 6, cz + 6, cx + 8.9, 1, 3, { cols: [0x7c3aed, 0x6d28d9] }); s.forEach((q) => SEATS.push(q));
  SPOTS.court_night = [cx - 4.4, cz + 9.2]; w.lights.push({ x: cx, y: 7, z: cz, c: 0xeaf2ff, i: 22, d: 34 });
}
function quietCourt(w) { const c = COURTS.quiet, cx = c.x, cz = c.z;
  K.floor(w, cx - 9, cz - 12, cx + 9, cz + 12, 'tile', 0.01, 0x9ca3af, 0xa3aab5, 3);
  court(w, cx, cz, PAL.green, { bench: 0x16a34a });
  hedge(w, 'x', cz - 11.5, cx - 9.5, cx + 9.5); hedge(w, 'z', cx - 9.5, cz - 11.5, cz + 11.5); hedge(w, 'z', cx + 9.5, cz - 11.5, cz + 11.5); hedge(w, 'x', cz + 11.5, cx - 9.5, cx - 2); hedge(w, 'x', cz + 11.5, cx + 2, cx + 9.5);
  sign(w, cx - 3.4, cz + 12.9, 0, 'SHHH! QUIET ZONE', 0x0f766e, 'Silent Serve foam balls only'); SPOTS.quietSign = [cx - 3.4, cz + 14.2];
  ballMachine(w, cx + 1.5, cz - 8.6, 0, 0x0f766e); ballBucket(w, cx + 4.6, 0.06, cz + 9.4, 0xfde047, 12); ballBucket(w, cx + 5.2, 0.06, cz + 9.0, 0xfde047, 10);
  { const T = w.tf(cx - 6.2, 0, cz + 9.4, 0); T.box('g', 0xfde047, 0, 0, 0, 1.2, 0.8, 0.8, 0.08); txt(w, 'FOAM BALLS', ...T.P(0, 0.45, 0.41), 0, 0.13, 0x0f766e); for (let i = 0; i < 12; i++) T.add('g', sph(10), 0xfde047, -0.4 + (i % 4) * 0.27, 0.86, -0.2 + ((i / 4) | 0) * 0.2, 0, 0, 0, 0.037); T.solid(-0.6, 0, -0.4, 0.6, 0.9, 0.4); }
  for (let i = 0; i < 4; i++) w.add('g', sph(10), 0xfde047, cx - 3 + i * 1.8, 0.11, cz + 4 + (i % 2), 0, 0, 0, 0.037);
  [[-9, -9], [9, -9], [-9, 9]].forEach(([dx, dz]) => K.tree(w, cx + dx * 1.25, cz + dz * 1.3, 1.1, 1));
  SPOTS.court_quiet = [cx - 4.4, cz + 9.2]; SPOTS.candyPatrol = [cx + 3, cz + 6];
}
function northLawn(w) { // playground, picnic lawn, Candy's Dog Run, a pickleball sculpture garden
  // playground
  { const x = -6, z = -48; w.add('f', rbox(14, 0.08, 12, 0.04, 1), 0xf9a8d4, x, 0.04, z); w.solid(x - 7, -1, z - 6, x + 7, 0.08, z + 6, { floor: true });
    const T = w.tf(x - 3, 0, z, 0); [-1, 1].forEach((a) => [-1, 1].forEach((b) => T.add('x', cyl(10), 0xef4444, a * 1, 0, b * 1, 0, 0, 0, 0.08, 2.4, 0.08))); T.box('g', 0x2563eb, 0, 1.6, 0, 2.2, 0.15, 2.2, 0.05); T.add('f', cone(4), 0xffd23f, 0, 2.5, 0, 0, PI / 4, 0, 1.7, 1.2, 1.7); T.add('g', rbox(0.9, 0.08, 3.2, 0.04), 0x22c55e, 0, 0.85, 2.4, 0.55, 0, 0); T.solid(-1.1, 0, -1.1, 1.1, 1.7, 1.1);
    const S2 = w.tf(x + 3.5, 0, z, 0); [-1.6, 1.6].forEach((a) => { S2.add('x', cyl(10), 0x2563eb, a, 0, -0.6, 0.25, 0, 0, 0.07, 2.8, 0.07); S2.add('x', cyl(10), 0x2563eb, a, 0, 0.6, -0.25, 0, 0, 0.07, 2.8, 0.07); }); S2.add('x', cyl(10), 0x2563eb, -1.7, 2.65, 0, 0, 0, PI / 2, 0.06, 3.4, 0.06);
    [-0.7, 0.7].forEach((a) => { S2.add('x', cyl(6), 0x94a3b8, a, 1.0, 0, 0, 0, 0, 0.012, 1.65, 0.012); S2.box('g', 0xff4fa0, a, 0.92, 0, 0.5, 0.06, 0.25, 0.02); });
    SPOTS.playground = [x, z + 7]; }
  // picnic lawn
  [[16, -46], [21, -50], [17, -54], [24, -44]].forEach(([x, z], i) => { picnic(w, x, z, i * 0.5); seat(x, 0.45, z - 0.65, 0); if (i % 2) seat(x + 0.5, 0.45, z + 0.65, PI); umbrella(w, x, z, [0xff4fa0, 0x60a5fa, 0xffd23f, 0x4ade80][i]); });
  // Candy's Dog Run (by the quiet court)
  { const x = -26, z = -48; K.fenceRun(w, 'x', z - 6, x - 7, x + 7, 1.1, 0xffffff); K.fenceRun(w, 'x', z + 6, x - 7, x - 1.5, 1.1, 0xffffff); K.fenceRun(w, 'x', z + 6, x + 1.5, x + 7, 1.1, 0xffffff); K.fenceRun(w, 'z', x - 7, z - 6, z + 6, 1.1, 0xffffff); K.fenceRun(w, 'z', x + 7, z - 6, z + 6, 1.1, 0xffffff);
    for (let i = 0; i < 5; i++) w.add('g', cyl(12), i % 2 ? 0xff4fa0 : 0xffffff, x - 4 + i * 1.6, 0, z, 0, 0, 0, 0.05, 1.0, 0.05); w.add('g', torus(0.12, 32), 0xffd23f, x + 4, 1.2, z + 3, 0, 0, 0, 0.7); w.add('g', rbox(3, 0.15, 1.2, 0.05), 0x60a5fa, x - 2, 0.5, z + 3.6, 0, 0, 0.3);
    for (let i = 0; i < 6; i++) w.add('g', sph(10), 0xe6ff3b, x - 5 + R() * 10, 0.08, z - 4 + R() * 8, 0, 0, 0, 0.037); txt(w, "CANDY'S DOG RUN", x, 1.25, z + 6.1, 0, 0.22, 0xff4fa0); SPOTS.dogrun = [x, z + 2]; }
}
// ---------------- the Clubhouse: lobby + trophy hall + ladder board + tournament desk, lounge, locker rooms ----------------
function clubhouse(w) { const b = shell(w, { id: 'club', name: '🏛️ The Clubhouse', x0: -52, z0: 44, x1: -18, z1: 70, h: 5.6, wall: 0xf5efe0, trim: 0x16a34a, roof: 0x14532d, floor: 'wood', fc1: 0xc98d55, doors: [{ side: 'e', at: 57, w: 3.2 }], win: { n: 5, s: 5, e: 3, w: 4 } });
  const L = w.lights; w.region = 'out';
  onSide(w, b, 'e', () => { w.add('g', rbox(3, 0.35, 6, 0.12), 0x16a34a, -16.4, 3.6, 57); [54.6, 59.4].forEach((z) => { w.add('g', rcyl(0.22, 3.6, 0.06, 18), 0xffffff, -15.2, 0, z); w.solid(-15.45, 0, z - 0.25, -14.95, 3.6, z + 0.25); }); txt(w, 'THE CLUBHOUSE', -17.62, 4.4, 57, PI / 2, 0.5, 0x14532d); pball(w, 'g', -17.6, 4.55, 52.4, 0.35); pball(w, 'g', -17.6, 4.55, 61.6, 0.35); });
  [[-17, 50], [-17, 64]].forEach(([x, z]) => K.potPlant(w, x, 0, z, 1.3, 0x16a34a));
  part(w, b, 'z', -34, 44, 70, [50.5, 63.5], 0xfffaf0); part(w, b, 'x', 57, -52, -34, [-43], 0xfffaf0);
  w.region = 'in_club';
  // LOBBY & TROPHY HALL (x -34..-18): front desk, ladder board, tournament board, trophy cases, rug
  { K.rug(w, -26, 57, 0, 7, 5, 0x16a34a, 0xe6ff3b);
    const T = w.tf(-24.5, 0, 49.2, 0); T.slab('g', 0xffffff, 0, 0, 0, 5, 1.1, 1.0, 0.15); T.box('g', 0x16a34a, 0, 0, 0.52, 4.8, 0.9, 0.04, 0.03); T.box('m', 0xb7773f, 0, 1.1, 0, 5.2, 0.08, 1.2, 0.04); K.monitor(w, T, -1.5, 1.18, -0.2, 0, 0x22c55e); register(w, -23, 49.2, PI); txt(w, 'FRONT DESK', -24.5, 3.1, 44.4, 0, 0.32, 0x16a34a);
    w.add('x', lathe([[0, 0], [0.16, 0], [0.16, 0.03], [0.12, 0.08], [0.02, 0.18], [0, 0.2]], 20, 'bell'), 0xfbbf24, -24.5, 1.18, 49.4); person(-24.5, 48.0, 0, { staff: true, name: 'Marge' }); SPOTS.desk = [-24.5, 51];
    // the Park Ladder board (rungs 1..10 with name plates) on the west partition wall (joins the partition's fade group so it hides with it)
    const fgW = b.fades[b.fades.length - 2]; w._fg = fgW;
    { const B = w.tf(-33.8, 1.0, 54, PI / 2); B.box('m', 0x7c4a1e, 0, 0, 0, 3.2, 3.4, 0.1, 0.04); B.box('m', 0x14532d, 0, 0.1, 0.06, 3.0, 3.2, 0.03, 0.02); for (let i = 0; i < 10; i++) { B.box('g', i === 0 ? 0xfcd34d : 0xfef3c7, 0, 0.32 + i * 0.29, 0.09, 2.4, 0.22, 0.03, 0.02); txt(w, '#' + (10 - i), ...B.P(-1.05, 0.36 + i * 0.29, 0.11), PI / 2, 0.11, 0x14532d); } txt(w, 'PARK LADDER', ...B.P(0, 3.15, 0.1), PI / 2, 0.24, 0xe6ff3b); SPOTS.ladder = [-32.4, 54]; }
    { const B = w.tf(-33.8, 1.0, 61.2, PI / 2); B.box('m', 0x7c4a1e, 0, 0, 0, 3.0, 2.2, 0.1, 0.04); B.box('m', 0xfef3c7, 0, 0.1, 0.06, 2.8, 2.0, 0.03, 0.02); [[-0.9, 1.5], [-0.9, 0.7], [0.9, 1.1]].forEach(([a, c]) => B.box('g', 0xffffff, a, c, 0.09, 0.9, 0.35, 0.02, 0.01)); B.add('m', tube([[-0.45, 1.67, 0.1], [0, 1.67, 0.1], [0, 1.28, 0.1], [0.45, 1.28, 0.1]], 0.015, 8, 4), 0x16a34a, 0, 0, 0); B.add('m', tube([[-0.45, 0.87, 0.1], [0, 0.87, 0.1], [0, 1.28, 0.1]], 0.015, 8, 4), 0x16a34a, 0, 0, 0); txt(w, 'TOURNAMENTS', ...B.P(0, 2.35, 0.1), PI / 2, 0.22, 0x14532d); SPOTS.tourney = [-32.4, 61.2]; } w._fg = null;
    // trophy cases along the north wall
    for (let k = 0; k < 2; k++) { const x = -31 + k * 6, T2 = w.tf(x, 0, 44.6, 0); T2.slab('m', 0x7c4a1e, 0, 0, 0, 3.2, 0.9, 0.7, 0.04); T2.box('e', 0xcfefff, 0, 0.9, 0, 3.1, 1.6, 0.66, 0.02); T2.box('m', 0x7c4a1e, 0, 2.5, 0, 3.2, 0.1, 0.7, 0.02); for (let i = 0; i < 5; i++) trophy(w, x - 1.2 + i * 0.6, 0.92 + (i % 2) * 0.4, 44.6, 1 + (i === 2 ? 0.4 : 0), i === 2 ? 0xfcd34d : i % 2 ? 0xcbd5e1 : 0xd97706); T2.solid(-1.6, 0, -0.35, 1.6, 2.6, 0.35); }
    frameArt(w, 'x', 69.75, -30, 2.4, 2.2, 1.4, 0x60a5fa, -1); frameArt(w, 'x', 69.75, -22, 2.4, 2.2, 1.4, 0xfca5a5, -1); poster(w, 'x', 69.75, -26, 2.5, 1.6, 1.1, 0x16a34a, -1, 'MEMBERS ONLY*', 0xe6ff3b);
    K.plant(w, -19.2, 45.5, 1.1); K.plant(w, -19.2, 68.5, 1.1); [-21, -20].forEach((x) => K.chair(w, x, 0, 66.5, PI, 0x16a34a)); K.cooler(w, -19.3, 52); clockW(w, 'x', 44.25, -27, 3.4, 1); pend(w, -26, 54, 0xe6ff3b, 4.6); pend(w, -26, 62, 0xe6ff3b, 4.6);
    person(-27, 62.5, 2.4, { name: 'Member' }); person(-29.5, 47, 0.3, { name: 'Member' }); L.push({ x: -26, y: 4, z: 57, c: 0xfff1dc, i: 14, d: 18 }); }
  // LOUNGE (x -52..-34, z 44..57): sofas around a fireplace, TV wall showing a match, bookshelves, game table, coffee bar
  { K.floor(w, -51.75, 44.25, -34.15, 56.85, 'carpet', 0.08, 0x2f6f4e, 0x357a56, 1.6); fireplace(w, -51.3, 50.5, PI / 2); tv(w, -43, 3.0, 44.4, 0, 3.2);
    K.sofa(w, -46, 51.2, PI / 2, 0x14532d, 0x16a34a); K.sofa(w, -42.5, 48.0, 0, 0x7c4a1e, 0xb7773f); K.sofa(w, -42.5, 54.6, PI, 0x7c4a1e, 0xb7773f); K.rug(w, -44, 51.2, 0, 6, 5, 0xfef3c7, 0xe6ff3b); K.tableR(w, -43, 51.3, 0.9, 0.45, 0x7c4a1e);
    seat(-45.6, 0.5, 51.2, PI / 2, { name: 'Member' }); seat(-42.3, 0.5, 48.3, 0); seat(-43.4, 0.5, 54.3, PI);
    K.shelf(w, -36, 44.6, 0, 3.4, 2.6, 0.5, 0x7c4a1e); K.shelf(w, -39.8, 44.6, 0, 3.0, 2.6, 0.5, 0x7c4a1e);
    { const T = w.tf(-37, 0, 53.5, 0); T.slab('g', 0x14532d, 0, 0.72, 0, 1.8, 0.08, 1.0, 0.03); T.box('l', 0x2f9e57, 0, 0.8, 0, 1.6, 0.01, 0.8, 0.01, 0.1); [-0.7, 0.7].forEach((a) => [-0.4, 0.4].forEach((c) => T.add('x', cyl(8), 0x7c4a1e, a, 0, c, 0, 0, 0, 0.04, 0.72, 0.04))); T.box('m', 0xffffff, 0, 0.82, 0, 0.02, 0.06, 0.8, 0.005); T.solid(-0.9, 0, -0.5, 0.9, 0.85, 0.5); K.stool(w, -38.4, 53.5); K.stool(w, -35.6, 53.5, 0x60a5fa); seat(-35.6, 0.66, 53.5, -PI / 2); }
    { const T = w.tf(-48, 0, 55.9, PI); T.slab('g', 0x7c4a1e, 0, 0, 0, 3.4, 1.0, 0.7, 0.05); for (let i = 0; i < 4; i++) w.add('g', lathe([[0, 0], [0.08, 0], [0.09, 0.14], [0, 0.14]], 14, 'mug'), pick([0xffffff, 0x16a34a, 0xe6ff3b]), -49.2 + i * 0.6, 1.0, 55.9); txt(w, 'COFFEE & TEA', -48, 2.6, 56.62, PI, 0.22, 0x7c4a1e); }
    poster(w, 'z', -51.75, 46.2, 2.5, 1.6, 1.1, 0x2563eb, 1, '1965: PICKLEBALL', 0xffffff); clockW(w, 'x', 44.25, -47, 3.6, 1); pend(w, -44, 51, 0xfef3c7, 4.6); K.lamp(w, -50.5, 55.5);
    L.push({ x: -43, y: 4, z: 50.5, c: 0xffe4c4, i: 13, d: 16 }); }
  // LOCKER ROOM (x -52..-34, z 57..70): rows of lockers, benches, shower stalls, towel cart, scale, mirrors
  { K.floor(w, -51.75, 57.15, -34.15, 69.75, 'tile', 0.08, 0xdbeafe, 0xbfdbfe, 1.0);
    lockers(w, -43, 69.3, PI, 14, 0x16a34a); lockers(w, -51.3, 63.5, PI / 2, 10, 0x2563eb); lockers(w, -43, 63.8, 0, 10, 0x0f766e); lockers(w, -43, 62.8, PI, 10, 0x0f766e);
    [[-43, 66.6], [-43, 60.2]].forEach(([x, z]) => { const T = w.tf(x, 0, z, 0); T.box('m', 0xb7773f, 0, 0.45, 0, 4.2, 0.08, 0.5, 0.02); [-1.8, 0, 1.8].forEach((a) => T.box('x', 0x94a3b8, a, 0, 0, 0.08, 0.45, 0.4, 0.01)); T.solid(-2.1, 0, -0.25, 2.1, 0.5, 0.25); });
    w._fg = b.fades[b.fades.length - 2]; // shower stalls hug the partition: hide with it when they block the camera
    for (let i = 0; i < 3; i++) { const x = -37 + i * 0.0, z = 59 + i * 1.6; w.add('g', rbox(0.06, 2.2, 1.4, 0.02, 1), 0xe2e8f0, -36.2, 1.1, z); w.add('x', cyl(8), 0xcbd5e1, -34.6, 2.2, z + 0.7, 0, 0, PI / 2, 0.03, 0.4, 0.03); w.add('f', rbox(0.04, 1.8, 1.3, 0.02, 1), [0x60a5fa, 0xe6ff3b, 0xf472b6][i], -36.4, 1.2, z + 0.7); void x; } w._fg = null;
    { const T = w.tf(-48.5, 0, 59, 0); T.box('x', 0xcbd5e1, 0, 0.1, 0, 1.0, 0.9, 0.6, 0.04); for (let i = 0; i < 6; i++) T.add('f', rbox(0.8, 0.12, 0.5, 0.05, 1), pick([0xffffff, 0x16a34a, 0xe6ff3b]), 0, 1.04 + i * 0.12, 0); T.solid(-0.5, 0, -0.3, 0.5, 1.8, 0.3); }
    w.add('e', rbox(2.4, 1.4, 0.04, 0.02), 0xdff6ff, -42, 2.0, 57.4); paddleV(w, -45.2, 1.0, 66.6, 0.2, 0xef4444); paddleV(w, -41.1, 0.6, 60.4, -0.4, 0x22c55e); ballBucket(w, -38.5, 0.08, 66.4);
    txt(w, 'LOCKER ROOM', -43, 3.6, 57.35, PI, 0.28, 0x2563eb); pend(w, -43, 61.5, 0xdbeafe, 4.6); pend(w, -43, 67, 0xdbeafe, 4.6); person(-40.5, 65.2, 1.5, { name: 'Player' }); seat(-44.4, 0.5, 66.4, 0, { name: 'Player' });
    L.push({ x: -43, y: 4, z: 63.5, c: 0xe0f2ff, i: 12, d: 16 }); }
}
// ---------------- Torty's Pro Shop: paddle walls, the MaxGrit spotlight podium, ball shelves, shoe wall, apparel, demo cage, counter ----------------
function proShop(w) { const b = shell(w, { id: 'shop', name: '🏓 Torty\'s Pro Shop', x0: 18, z0: 46, x1: 44, z1: 68, h: 5.4, wall: 0x2dd4bf, trim: 0xffffff, roof: 0x0f766e, floor: 'tile', fc1: 0xf1f5f9, fc2: 0xe2e8f0, doors: [{ side: 'w', at: 57, w: 3.2 }], win: { n: 4, s: 4, w: 3, e: 0 } });
  const L = w.lights; w.region = 'out';
  onSide(w, b, 'w', () => { canopyZ(w, 17.6, 54, 60, 3.3, [0x0f766e, 0xffffff], -1); txt(w, "TORTY'S PRO SHOP", 17.62, 4.2, 57, -PI / 2, 0.46, 0x0f766e); txt(w, 'PADDLES · BALLS · GEAR', 17.62, 3.7, 57, -PI / 2, 0.2, 0x134e4a);
    { const sx = 17.55, y = 4.5; w.add('g', sph(24), 0xb98545, sx, y, 51.0, 0, 0, 0, 0.25, 0.6, 0.8); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; w.add('g', sph(10), 0xd1a05e, sx - 0.1, y + Math.sin(a) * 0.35, 51.0 + Math.cos(a) * 0.5, 0, 0, 0, 0.2, 0.18, 0.22); } }
    for (let z = 50; z <= 64; z += 3.5) if (Math.abs(z - 57) > 2) { w.add('e', rbox(0.06, 2.0, 2.4, 0.02, 1), 0xcfefff, 17.75, 1.6, z); } });
  [[17, 52.5], [17, 61.5]].forEach(([x, z]) => K.potPlant(w, x, 0, z, 1.2, 0x0f766e)); K.bench(w, 16.2, 64, -PI / 2, 0x0f766e);
  part(w, b, 'z', 39.5, 46, 68, [64.5], 0xecfeff, 3.6);
  w.region = 'in_shop';
  // paddle walls (north + south), pegboard with ~60 paddles
  const pcols = [0x22c55e, 0x38bdf8, 0x111827, 0xf97316, 0x2dd4bf, 0x374151, 0xfcd34d, 0xef4444, 0xa855f7, 0xff4fa0];
  for (const [zw, ry, sd] of [[46.35, 0, 1], [67.65, PI, -1]]) { w.add('m', rbox(18, 3.2, 0.06, 0.02, 1), 0xd6c3a5, 29, 2.2, zw + sd * 0.05); for (let r = 0; r < 3; r++) for (let i = 0; i < 16; i++) { const x = 21 + i * 1.07, y = 1.2 + r * 0.95, c = pcols[(i + r * 3) % pcols.length]; paddleV(w, x, y, zw + sd * 0.12, ry, c, (i + r) % 3 ? 0x111827 : 0xffffff, c === 0x111827); } txt(w, sd > 0 ? 'PADDLE WALL' : 'MORE PADDLES', 29, 4.25, zw + sd * 0.1, ry, 0.34, 0x0f766e); }
  // MaxGrit spotlight podium (like David's real paddles!)
  { const x = 28, z = 57; w.add('g', rcyl(1.1, 0.5, 0.08, 32), 0x111827, x, 0, z); w.add('g', rcyl(0.9, 0.12, 0.04, 32), 0xef4444, x, 0.5, z); w.add('e', rcyl(0.85, 1.4, 0.05, 32), 0xdff6ff, x, 0.62, z);
    paddleV(w, x - 0.25, 1.05, z, 0.3, 0x111827, 0xef4444, true, 2.0); paddleV(w, x + 0.3, 1.05, z + 0.1, -0.35, 0x111827, 0xef4444, true, 2.0); w.add('g', sph(14), 0xfde047, x, 0.72, z + 0.5, 0, 0, 0, 0.037 * 2); w.add('g', sph(14), 0xfde047, x + 0.12, 0.72, z + 0.48, 0, 0, 0, 0.037 * 2);
    w.add('l', torus(0.04, 40), 0xef4444, x, 0.63, z, PI / 2, 0, 0, 0.9, 0.9, 0.9, 0.6); txt(w, 'MAXGRIT', x, 2.4, z, -PI / 2, 0.3, 0xef4444, 'l', 0.5); txt(w, 'GRIT = SPIN', x, 2.05, z, -PI / 2, 0.16, 0x111827);
    { const r_ = w.region; w.region = 'roof_shop'; w.add('x', cone(16), 0x334155, x, 4.6, z, PI, 0, 0, 0.4, 0.5, 0.4); w.region = r_; } w.solid(x - 1.1, 0, z - 1.1, x + 1.1, 2.0, z + 1.1); SPOTS.maxgrit = [x - 1.9, z]; L.push({ x, y: 4, z, c: 0xfff1f1, i: 10, d: 8 }); }
  // display tables with paddles laid out + "try me" demo paddles
  [[23.5, 52], [23.5, 62], [33, 52], [33, 62]].forEach(([x, z], k) => { const T = w.tf(x, 0, z, 0); T.slab('m', 0xb7773f, 0, 0.0, 0, 2.6, 0.85, 1.2, 0.04); for (let i = 0; i < 4; i++) paddleProp(w, x - 0.9 + i * 0.6, 0.87, z - 0.1, 0.1 * (i - 1.5), 0, pcols[(i + k * 2) % pcols.length]); });
  // ball shelves + shoe wall + apparel racks (east half, before the stockroom partition)
  ballShelf(w, 36, 47, 0, 4); txt(w, 'BALLS', 36, 2.7, 46.7, 0, 0.26, 0x0f766e); shoeWall(w, 39.2, 59.5, -PI / 2, 4, 6); txt(w, 'SHOES', 39.0, 3.0, 59.5, -PI / 2, 0.26, 0x0f766e);
  shirtRack(w, 35.5, 55, PI / 2, [0x16a34a, 0xe6ff3b, 0x2563eb, 0xff4fa0, 0xffffff, 0x111827]); shirtRack(w, 35.5, 63, PI / 2, [0xef4444, 0x2dd4bf, 0xfcd34d, 0xa855f7, 0xf97316]);
  // hat stand + visors
  { const T = w.tf(37.6, 0, 66.2, 0); T.add('x', cyl(10), 0x94a3b8, 0, 0, 0, 0, 0, 0, 0.04, 1.8, 0.04); for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; T.add('g', torus(0.25, 20, PI * 1.3), pick([0xffffff, 0x16a34a, 0xe6ff3b, 0x111827]), Math.cos(a) * 0.25, 1.2 + (i % 2) * 0.3, Math.sin(a) * 0.25, PI / 2, 0, a, 0.16, 0.16, 0.16); } T.solid(-0.3, 0, -0.3, 0.3, 1.8, 0.3); }
  // checkout counter (Torty runs the shop from here)
  { const T = w.tf(24, 0, 48.8, 0); T.slab('g', 0x0f766e, 0, 0, 0, 4.2, 1.05, 1.0, 0.12); T.box('m', 0xfef3c7, 0, 1.05, 0, 4.4, 0.08, 1.15, 0.04); register(w, 25.2, 48.8, PI); for (let i = 0; i < 2; i++) ballBucket(w, 22.3 + i * 0.4, 1.13, 48.6, 0xe6ff3b, 3); txt(w, 'CHECKOUT', 24, 3.2, 46.45, 0, 0.3, 0x0f766e); SPOTS.counter = [24, 50.6]; SPOTS.torty = [24, 48.75]; }
  // demo cage: net + target where you "test swing"
  { const x = 22, z = 65.2; w.add('e', rbox(3.2, 2.6, 0.03, 0.01, 1), 0x0b0f19, x, 1.3, z + 1.6); w.add('l', torus(0.05, 32), 0xe6ff3b, x, 1.5, z + 1.55, 0, 0, 0, 0.5, 0.5, 0.5, 0.5); txt(w, 'TEST SWING', x, 2.9, z + 1.55, PI, 0.2, 0x0f766e); w.add('f', rbox(3.2, 0.04, 2.4, 0.02, 1), 0x16a34a, x, 0.09, z + 0.2); SPOTS.demo = [x, z - 0.4]; }
  // stockroom behind the partition: boxes, ball crates, restringing... er, re-gripping bench
  for (let i = 0; i < 6; i++) K.parcel(w, 41 + (i % 2) * 0.9, (i / 2 | 0) * 0.55, 48 + (i % 3) * 0.3, 0.9); for (let i = 0; i < 4; i++) K.crate(w, 42.8, 0, 52 + i * 1.2, 0.9, 0xfde047); K.desk(w, 41.8, 60, PI / 2, { pc: false, chairCol: 0x0f766e }); txt(w, 'STOCKROOM', 41.8, 3.2, 46.45, 0, 0.22, 0x0f766e);
  for (let i = 0; i < 4; i++) paddleProp(w, 41.4 + i * 0.3, 0.87, 59.4 + i * 0.25, 0.4, 0, pcols[i]);
  pend(w, 24, 54, 0xffffff, 4.4); pend(w, 24, 60, 0xffffff, 4.4); pend(w, 33, 54, 0xffffff, 4.4); pend(w, 33, 60, 0xffffff, 4.4); clockW(w, 'x', 67.75, 36, 3.4, -1);
  person(23.8, 55.4, -1.2, { name: 'Shopper' }); person(31.4, 47.8, 0, { name: 'Shopper' }); person(34.4, 60.6, PI / 2, { name: 'Shopper' }); person(36.2, 48.6, 0.2, { name: 'Shopper' });
  L.push({ x: 26, y: 4, z: 57, c: 0xf0fdfa, i: 14, d: 18 }); L.push({ x: 41, y: 3, z: 57, c: 0xfff1dc, i: 8, d: 10 });
}
// ---------------- Dill-icious Snack Shack (Snowie's kitchen) ----------------
function snackBar(w) { const b = shell(w, { id: 'snack', name: '🌭 Dill-icious Snack Shack', x0: -34, z0: 80, x1: -14, z1: 94, h: 4.6, wall: 0xfde68a, trim: 0x16a34a, roof: 0x166534, floor: 'tile', fc1: 0xfef3c7, fc2: 0xfde68a, doors: [{ side: 'e', at: 87, w: 2.8 }], win: { n: 3, s: 3, e: 2, w: 2 } });
  w.region = 'out';
  onSide(w, b, 'e', () => { canopyZ(w, -13.6, 84.6, 89.4, 3.2, [0x16a34a, 0xfef3c7], 1); txt(w, 'DILL-ICIOUS SNACK SHACK', -13.62, 3.9, 87, PI / 2, 0.34, 0x166534);
    { const x = -13.4, y = 4.35, z = 82.2; w.add('g', capsule(16), 0x65a30d, x, y, z, PI / 2, 0, 0, 0.36, 0.9, 0.36); for (let i = 0; i < 7; i++) w.add('g', sph(8), 0x84cc16, x + 0.05, y + (i % 2 ? 0.15 : -0.15), z - 0.6 + i * 0.2, 0, 0, 0, 0.06); } });
  // patio: umbrella tables between the shack and the promenade
  [[-10.5, 82.4], [-7, 85.2], [-10.5, 91.2], [-7, 92.6]].forEach(([x, z], i) => { K.tableR(w, x, z, 0.65, 0.75, 0xffffff); umbrella(w, x, z, [0x16a34a, 0xe6ff3b, 0xff4fa0, 0x60a5fa][i]); K.stool(w, x - 0.9, z, 0x16a34a); K.stool(w, x + 0.9, z, 0xe6ff3b); seat(x - 0.9, 0.66, z, PI / 2); if (i % 2) seat(x + 0.9, 0.66, z, -PI / 2); });
  w.region = 'in_snack';
  const T = w.tf(-31.8, 0, 87, PI / 2); T.slab('g', 0x16a34a, 0, 0, 0, 9, 1.05, 1.0, 0.08); T.box('m', 0xfef3c7, 0, 1.05, 0, 9.2, 0.08, 1.1, 0.03);
  for (let i = 0; i < 4; i++) w.add('e', lathe([[0, 0], [0.22, 0], [0.24, 0.5], [0, 0.5]], 20, 'case'), 0xffffff, -31.8, 1.13, 84 + i * 0.8);
  [[0xd97706, 84], [0xef4444, 84.8], [0x65a30d, 85.6], [0xfde68a, 86.4]].forEach(([c, z]) => w.add('g', sph(12), c, -31.8, 1.25, z, 0, 0, 0, 0.14, 0.09, 0.14));
  // grill + fryer + soda fountain + fridge behind the counter
  { const G = w.tf(-33.3, 0, 90.5, PI / 2); G.slab('x', 0x334155, 0, 0, 0, 2.0, 0.95, 0.8, 0.05); G.box('x', 0x111827, 0, 0.95, 0, 1.8, 0.04, 0.7, 0.01); for (let i = 0; i < 5; i++) G.add('g', capsule(10), 0xc2410c, -0.6 + i * 0.3, 1.0, 0, 0, 0, PI / 2, 0.06, 0.16, 0.06); txt(w, 'GRILL', -33.62, 2.4, 90.5, PI / 2, 0.2, 0x166534); }
  { const F = w.tf(-33.3, 0, 84.2, PI / 2); F.slab('x', 0xcbd5e1, 0, 0, 0, 1.4, 1.0, 0.7, 0.05); F.box('g', 0x111827, 0, 1.0, 0, 0.5, 0.25, 0.5, 0.03); for (let i = 0; i < 3; i++) F.add('x', cyl(8), 0x94a3b8, -0.4 + i * 0.4, 1.15, 0.2, 0, 0, 0, 0.02, 0.25, 0.02); F.add('l', rbox(1.2, 0.3, 0.02, 0.01), 0x38bdf8, 0, 1.5, 0.36, 0, 0, 0, 1, 1, 1, 0.3); }
  K.vending(w, -15.2, 81.6, -PI / 2, 0x16a34a); K.cooler(w, -15.0, 92.6);
  menuBoard(w, -33.7, 2.0, 87, PI / 2, ['DILL-ICIOUS MENU', 'Dill Dog ........ 5', 'Kitchen Nachos .. 6', 'Pickle Pops ..... 3', 'Spin Smoothie ... 4']);
  // booths + tables
  [[-23, 81.4], [-19.5, 81.4]].forEach(([x, z]) => { const B = w.tf(x, 0, z, 0); B.box('f', 0xef4444, 0, 0, -0.6, 1.8, 0.45, 0.5, 0.06); B.box('f', 0xef4444, 0, 0.45, -0.85, 1.8, 0.7, 0.12, 0.05); B.box('g', 0xffffff, 0, 0.72, 0.15, 1.6, 0.06, 0.8, 0.03); B.box('x', 0x94a3b8, 0, 0, 0.15, 0.1, 0.72, 0.1, 0.01); B.solid(-0.9, 0, -0.9, 0.9, 0.8, 0.6); seat(x, 0.45, z - 0.55, 0); });
  [[-24, 89], [-20, 89], [-24, 92.4]].forEach(([x, z]) => { K.tableR(w, x, z, 0.75, 0.75, 0xfef3c7, 0x166534); K.stool(w, x - 1.0, z, 0x16a34a); K.stool(w, x + 1.0, z, 0xe6ff3b); w.add('g', lathe([[0, 0], [0.3, 0], [0.34, 0.06], [0, 0.06]], 20, 'plate'), 0xffffff, x, 0.76, z); w.add('g', capsule(10), 0xc2410c, x, 0.84, z, 0, 0, PI / 2, 0.05, 0.18, 0.05); });
  seat(-25, 0.66, 89, PI / 2); seat(-19, 0.66, 89, -PI / 2);
  poster(w, 'x', 80.25, -28, 2.2, 2.2, 1.3, 0x16a34a, 1, 'BIG DILL ENERGY', 0xe6ff3b); poster(w, 'x', 93.75, -20, 2.2, 2.0, 1.2, 0xff4fa0, -1, 'TRY THE PICKLE POP'); clockW(w, 'x', 80.25, -16, 3.2, 1);
  pend(w, -22, 85, 0x16a34a, 3.9); pend(w, -22, 90.5, 0x16a34a, 3.9); trash(w, -15.4, 89.6, 0x16a34a);
  person(-29.2, 86.4, -PI / 2, { name: 'Hungry Player' }); person(-28.6, 88.6, -PI / 2 - 0.3, { name: 'Hungry Player' });
  SPOTS.snack = [-30.3, 87]; SPOTS.snowie = [-32.6, 87.8]; w.lights.push({ x: -24, y: 3.4, z: 87, c: 0xfff1c4, i: 13, d: 16 });
}
// ---------------- Training Center: indoor court, drill desk (Coach Luna), video room, fitness corner ----------------
function training(w) { const c = COURTS.train; const b = shell(w, { id: 'train', name: '🎯 Training Center', x0: 16, z0: 78, x1: 50, z1: 110, h: 7.4, wall: 0x93c5fd, trim: 0x1e3a8a, roof: 0x1e3a8a, floor: 'wood', fc1: 0xe2b77e, doors: [{ side: 'w', at: 92, w: 3.4 }], win: { n: 4, s: 4, w: 3, e: 4 } });
  w.region = 'out'; onSide(w, b, 'w', () => { w.add('g', rbox(1.2, 0.4, 6.4, 0.12), 0x1e3a8a, 15.4, 3.8, 92); txt(w, 'TRAINING CENTER', 15.62, 4.6, 92, -PI / 2, 0.5, 0x1e3a8a); target(w, 15.4, 92 - 4.4, 0xe6ff3b); });
  part(w, b, 'z', 27.2, 78, 110, [86, 101], 0xeff6ff, 3.6); part(w, b, 'x', 94, 16, 27.2, [21.6], 0xeff6ff, 3.6);
  w.region = 'in_train';
  // indoor court (orange) + run-off, ball machines, target rings for drills, stands on the east side
  court(w, c.x, c.z, PAL.orange, { bench: 0x1e3a8a, runX: 3.0, runZ: 3.2, logo: true, gear: false });
  ballMachine(w, c.x, c.z - 9.0, 0, 0x1e3a8a); ballMachine(w, c.x + 4, c.z - 8.2, -0.3, 0x2563eb); hopper(w, c.x - 4.4, 0.06, c.z + 8.8); hopper(w, c.x + 4.4, 0.06, c.z + 8.8);
  [[-1.5, -1.0], [1.5, -1.0], [0, -1.6], [-2, -4.8], [2, -4.8]].forEach(([dx, dz], i) => target(w, c.x + dx, c.z + dz, [0xff4fa0, 0xe6ff3b, 0x4ade80, 0x60a5fa, 0xf97316][i]));
  const s = bleachers(w, 'z', c.z - 7, c.z + 7, 44.8, 1, 4, { cols: [0x1e3a8a, 0x1d4ed8] }); s.forEach((q) => SEATS.push(q));
  for (let i = 0; i < 4; i++) { w.add('g', rbox(5, 0.3, 0.5, 0.1), 0xe5e7eb, c.x, 7.0, 81 + i * 8); w.add('l', rbox(4.6, 0.05, 0.36, 0.02), 0xfff6e0, c.x, 6.84, 81 + i * 8, 0, 0, 0, 1, 1, 1, 0.8); }
  for (let i = 0; i < 3; i++) { const z = 82 + i * 12; w.add('f', rbox(0.08, 2.6, 4, 0.02, 1), [0xe6ff3b, 0x1e3a8a, 0xff4fa0][i], 49.6, 4.2, z); }
  txt(w, 'TRAIN HARD · DINK SOFT', 49.6, 6.1, 94, -PI / 2, 0.42, 0x1e3a8a); SPOTS.court_train = [c.x - 4.4, c.z + 9.2];
  // DRILL DESK + COACH LUNA'S CORNER (x 16..27, z 78..94)
  { K.floor(w, 16.25, 78.25, 27.05, 93.85, 'carpet', 0.08, 0x1e40af, 0x1d4ed8, 1.4); const T = w.tf(22, 0, 80.2, 0); T.slab('g', 0xffffff, 0, 0, 0, 4, 1.05, 0.9, 0.12); T.box('g', 0x1e3a8a, 0, 1.05, 0, 4.2, 0.08, 1.0, 0.03); K.monitor(w, T, -1, 1.13, -0.15, 0, 0xe6ff3b); txt(w, 'DRILL DESK', 22, 3.0, 78.4, 0, 0.32, 0x1e3a8a);
    K.whiteboard(w, 'z', 16.25, 87, 1.2, 4, 1); w.add('m', tube([[16.36, 1.9, 85.6], [16.36, 2.3, 86.6], [16.36, 1.8, 87.6], [16.36, 2.2, 88.4]], 0.015, 16, 4), 0xef4444, 0, 0, 0);
    for (let i = 0; i < 3; i++) { K.chair(w, 20 + i * 1.6, 0, 86, PI, 0x1e3a8a); seat(20 + i * 1.6, 0.48, 86.1, -PI / 2 + PI / 2 * 0 - PI / 2 * 0 + PI); } cones(w, 18, 91.5, 6, 1.4); ballBucket(w, 25.8, 0.08, 91.8); ballBucket(w, 26.2, 0.08, 91.2, 0xff8a1f);
    poster(w, 'x', 78.25, 24.5, 2.2, 2.4, 1.3, 0xe6ff3b, 1, 'THIRD SHOT DROP!', 0x1e3a8a); clockW(w, 'z', 16.25, 82, 3, 1); pend(w, 22, 86, 0x93c5fd, 3.4);
    SPOTS.drills = [22, 82.2]; SPOTS.luna = [23.6, 81.0]; w.lights.push({ x: 22, y: 3.2, z: 86, c: 0xe0f0ff, i: 12, d: 14 }); }
  // VIDEO ROOM + FITNESS CORNER (x 16..27, z 94..110)
  { K.floor(w, 16.25, 94.15, 27.05, 109.75, 'tile', 0.08, 0x334155, 0x3b4658, 1.6); tv(w, 21.5, 2.2, 109.6, PI, 3.6, 0x0f172a); for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { K.chair(w, 19.5 + i * 1.3, 0, 105 - r * 1.6, 0, 0x1e3a8a); } seat(20.8, 0.48, 104.9, 0, { name: 'Student' }); seat(22.1, 0.48, 103.3, 0, { name: 'Student' });
    gymMat(w, 18, 98, 0x1e3a8a); gymMat(w, 19.4, 98, 0xe6ff3b); dumbbellRack(w, 24.5, 95.2, 0); { const T = w.tf(25.5, 0, 99.4, 0); T.box('x', 0x111827, 0, 0, 0, 0.8, 0.3, 1.8, 0.05); T.box('f', 0x1e3a8a, 0, 0.3, 0, 0.7, 0.12, 1.7, 0.05); T.add('x', cyl(10), 0x94a3b8, 0, 0.8, -0.8, 0, 0, 0, 0.03, 0.9, 0.03); T.solid(-0.4, 0, -0.9, 0.4, 0.5, 0.9); }
    for (let i = 0; i < 3; i++) w.add('g', sph(20), [0xef4444, 0x2563eb, 0x16a34a][i], 17 + i * 0.9, 0.35, 108.8, 0, 0, 0, 0.35); txt(w, 'VIDEO ROOM', 21.5, 3.2, 94.35, 0, 0.28, 0xe6ff3b); pend(w, 21.5, 102, 0x334155, 3.4); person(18.6, 98, 0, { name: 'Player' });
    w.lights.push({ x: 21.5, y: 3, z: 102, c: 0xdbeafe, i: 10, d: 14 }); }
  w.lights.push({ x: c.x, y: 6, z: c.z, c: 0xfff6e0, i: 20, d: 26 });
}
// ---------------- trees, bushes, flower beds, clouds ----------------
function nature(w) { w.region = 'out';
  const spots = []; for (let i = 0; i < 400 && spots.length < 120; i++) { const x = -112 + R() * 224, z = -86 + R() * 230; if (!free(x, z, 3)) continue; if (spots.some(([a, b]) => Math.hypot(a - x, b - z) < 7)) continue; spots.push([x, z]); }
  spots.forEach(([x, z], i) => { if (i % 3 === 2) { K.bush(w, x, z, 1 + (i % 3) * 0.2); K.bush(w, x + 1.4, z + 0.6, 0.8); } else K.tree(w, x, z, 1.1 + (i % 4) * 0.22, i % 6 === 0 ? 1 : 0); });
  for (let i = 0; i < 60; i++) { const a = i / 60 * PI * 2, r = 120 + (i % 4) * 6; const x = Math.cos(a) * r, z = 30 + Math.sin(a) * r * 1.02; K.tree(w, x, z, 1.4 + (i % 3) * 0.3, i % 7 === 0 ? 1 : 0); }
  [[-20, 40, -17, 43], [17, 40, 20, 43], [-20, 77, -17, 80], [17, 77, 20, 80], [-40, 96, -36, 100], [-14, 100, -9, 104], [9, 100, 14, 104]].forEach(([a, b, c, d]) => K.flowerBed(w, a, b, c, d));
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2 + 0.3; w.add('m', blobGeo(i * 3, 0.15, 2), 0xffffff, Math.cos(a) * 240, 70 + (i % 3) * 14, 30 + Math.sin(a) * 240, 0, a, 0, 26, 7, 14); }
}
// ---------------- interior density pass (smooth merged props + people) ----------------
// indoor ceiling lamps live in the roof region so they hide with the roof in third-person (no clipping in front of the camera)
function pend(w, ...a) { const r = w.region; if (r.startsWith('in_')) w.region = 'roof_' + r.slice(3); pendant(w, ...a); w.region = r; }
const TEES = [0x16a34a, 0xe6ff3b, 0x2563eb, 0xff4fa0, 0xffffff, 0x111827, 0xef4444, 0x2dd4bf, 0xf97316, 0xa855f7, 0xfcd34d];
function mannequin(w, x, z, ry, shirt, shorts, hat) { const T = w.tf(x, 0, z, ry);
  T.add('x', rcyl(0.28, 0.05, 0.02, 24), 0x334155, 0, 0, 0); T.add('x', cyl(8), 0x94a3b8, 0, 0.05, 0, 0, 0, 0, 0.025, 0.62, 0.025);
  [-1, 1].forEach((s) => T.add('g', capsule(12), shorts, s * 0.085, 0.8, 0, 0, 0, s * 0.06, 0.15, 0.14, 0.15)); T.add('g', sph(16), shorts, 0, 1.0, 0, 0, 0, 0, 0.2, 0.15, 0.14);
  T.add('g', capsule(16), shirt, 0, 1.36, 0, 0, 0, 0, 0.42, 0.27, 0.28); T.add('g', sph(16), shirt, 0, 1.6, 0, 0, 0, 0, 0.25, 0.08, 0.15);
  [-1, 1].forEach((s) => { T.add('g', capsule(10), shirt, s * 0.27, 1.5, 0, 0, 0, s * 0.25, 0.11, 0.12, 0.11); T.add('g', capsule(10), 0xf1f5f9, s * 0.33, 1.27, 0.02, 0, 0, s * 0.12, 0.08, 0.17, 0.08); });
  T.add('g', cyl(10), 0xf1f5f9, 0, 1.62, 0, 0, 0, 0, 0.05, 0.12, 0.05); T.add('g', sph(16), 0xf8fafc, 0, 1.86, 0, 0, 0, 0, 0.11, 0.13, 0.11);
  if (hat) { T.add('g', sph(14), hat, 0, 1.93, 0, 0, 0, 0, 0.12, 0.08, 0.12); T.add('g', sph(12), hat, 0, 1.92, 0.11, 0, 0, 0, 0.09, 0.012, 0.09); }
  T.add('g', rbox(0.18, 0.02, 0.06, 0.01, 1), 0xffffff, 0, 1.4, 0.15); T.solid(-0.3, 0, -0.3, 0.3, 2, 0.3); }
function bagStand(w, x, z, ry) { const T = w.tf(x, 0, z, ry); T.slab('m', 0xe5e7eb, 0, 0, 0, 2.2, 0.4, 0.7, 0.05); T.box('x', 0x0f766e, 0, 0.4, -0.3, 2.2, 1.9, 0.06, 0.02);
  [[0x111827, 0xef4444], [0x0f766e, 0xe6ff3b], [0xff4fa0, 0xffffff], [0x2563eb, 0xfcd34d]].forEach(([a, b], i) => { const bx = -0.78 + i * 0.52; T.add('g', rbox(0.38, 0.78, 0.2, 0.08, 2), a, bx, 0.8, 0.02); T.add('g', rbox(0.39, 0.06, 0.21, 0.02, 1), b, bx, 0.98, 0.02); T.add('g', rbox(0.03, 0.62, 0.02, 0.01, 1), b, bx + 0.1, 0.82, 0.13); T.add('x', torus(0.12, 16, PI), 0x111827, bx, 1.19, 0.02, 0, 0, 0, 0.11, 0.11, 0.11); });
  [0xa855f7, 0xf97316, 0x16a34a].forEach((c, i) => { T.add('g', rbox(0.5, 0.36, 0.22, 0.1, 2), c, -0.6 + i * 0.6, 1.9, -0.18); T.add('x', torus(0.1, 14, PI), 0x334155, -0.6 + i * 0.6, 2.08, -0.18, 0, 0, 0, 0.12, 0.12, 0.12); });
  txt(w, 'BAGS', ...T.P(0, 2.55, -0.25), ry, 0.22, 0xffffff); }
function spinner(w, x, z, word = 'GRIPS') { const T = w.tf(x, 0, z, 0); T.add('x', rcyl(0.32, 0.06, 0.02, 24), 0x334155, 0, 0, 0); T.add('x', cyl(10), 0x94a3b8, 0, 0.06, 0, 0, 0, 0, 0.03, 1.9, 0.03);
  for (let t = 0; t < 3; t++) { const y = 0.75 + t * 0.45; for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + t * 0.5; T.add('x', cyl(6), 0x94a3b8, 0, y, 0, 0, a, -PI / 2, 0.008, 0.34, 0.008); const px = Math.cos(a) * 0.3, pz = -Math.sin(a) * 0.3; T.add('g', rbox(0.13, 0.22, 0.025, 0.01, 1), TEES[(i * 3 + t * 5) % TEES.length], px, y - 0.13, pz, 0, a + PI / 2, 0); T.add('g', rbox(0.09, 0.1, 0.03, 0.01, 1), 0xffffff, px * 1.02, y - 0.17, pz * 1.02, 0, a + PI / 2, 0); } }
  T.add('g', rcyl(0.3, 0.03, 0.01, 24), 0x0f766e, 0, 1.98, 0); T.box('g', 0x0f766e, 0, 2.0, 0, 0.62, 0.28, 0.03, 0.01); txt(w, word, ...T.P(0, 2.14, 0.02), 0, 0.12, 0xe6ff3b); txt(w, word, ...T.P(0, 2.14, -0.02), PI, 0.12, 0xe6ff3b); T.solid(-0.35, 0, -0.35, 0.35, 2.1, 0.35); }
function ballBin(w, x, z, col = 0xe6ff3b, tag = '$3') { w.add('x', lathe([[0, 0], [0.36, 0], [0.42, 0.7], [0.44, 0.72], [0.4, 0.72], [0, 0.05]], 28, 'bin'), 0x0f766e, x, 0, z); w.add('x', torus(0.05, 28), 0xffffff, x, 0.71, z, PI / 2, 0, 0, 0.43, 0.43, 0.43);
  [[0, 1], [0.13, 6], [0.25, 11], [0.35, 15]].forEach(([r, n], k) => { for (let i = 0; i < n; i++) { const a = i / n * PI * 2 + k; w.add('g', sph(10), col, x + Math.cos(a) * r, 0.74 + (3 - k) * 0.035, z + Math.sin(a) * r, 0, 0, 0, 0.045, 0.045, 0.045); } });
  w.add('x', cyl(6), 0x94a3b8, x + 0.3, 0.7, z, 0, 0, 0, 0.01, 0.45, 0.01); w.add('g', rbox(0.24, 0.16, 0.02, 0.01, 1), 0xffffff, x + 0.3, 1.2, z); txt(w, tag, x + 0.3, 1.17, z + 0.015, 0, 0.09, 0xef4444); w.solid(x - 0.42, 0, z - 0.42, x + 0.42, 0.8, z + 0.42); }
function foldTable(w, x, z, ry, n = 4) { const T = w.tf(x, 0, z, ry); T.slab('m', 0xb7773f, 0, 0, 0, 2.2, 0.85, 1.0, 0.04); T.box('m', 0x8b5a2b, 0, 0.1, 0, 1.9, 0.06, 0.8, 0.02);
  for (let s = 0; s < n; s++) for (let k = 0; k < 2; k++) { const h = 3 + ((s + k) % 3); for (let i = 0; i < h; i++) T.add('f', rbox(0.38, 0.06, 0.3, 0.025, 1), TEES[(s * 2 + k * 5 + (i > h - 2 ? 1 : 0)) % TEES.length], -0.78 + s * 0.52, 0.89 + i * 0.065, -0.2 + k * 0.4, 0, (i % 2) * 0.05, 0); } }
function hatShelf(w, x, z, ry, W = 2.4) { const T = w.tf(x, 0, z, ry); T.box('m', 0xf5f5f4, 0, 0, 0, W, 2.3, 0.12, 0.03); const n = Math.floor(W / 0.36);
  for (let r = 0; r < 4; r++) { const y = 0.45 + r * 0.5; T.box('m', 0xb7773f, 0, y, 0.18, W, 0.04, 0.34, 0.01); for (let i = 0; i < n; i++) { const c = TEES[(i * 7 + r * 3) % TEES.length], hx = -W / 2 + 0.2 + i * (W - 0.4) / (n - 1); T.add('g', sph(14), c, hx, y + 0.04, 0.17, 0, 0, 0, 0.12, 0.085, 0.12); T.add('g', sph(12), r % 2 ? c : 0xffffff, hx, y + 0.05, 0.3, 0, 0, 0, 0.09, 0.012, 0.08); } }
  T.solid(-W / 2, 0, 0, W / 2, 2.3, 0.4); }
function ottoman(w, x, z, ry, L = 2.2, col = 0x0f766e) { const T = w.tf(x, 0, z, ry); T.slab('f', col, 0, 0.08, 0, L, 0.38, 0.55, 0.12); [-1, 1].forEach((a) => [-1, 1].forEach((b) => T.add('x', cyl(8), 0x94a3b8, a * (L / 2 - 0.12), 0, b * 0.2, 0, 0, 0, 0.03, 0.1, 0.03)));
  T.add('g', rbox(0.36, 0.14, 0.22, 0.02, 1), 0xf97316, L / 2 - 0.35, 0.46, 0); T.add('g', rbox(0.37, 0.03, 0.23, 0.01, 1), 0xffffff, L / 2 - 0.35, 0.55, 0); }
function shoePair(w, x, z, ry, col) { const T = w.tf(x, 0, z, ry); [-0.08, 0.08].forEach((s) => { T.add('g', sph(12), col, s, 0.05, 0, 0, 0, 0, 0.06, 0.05, 0.14); T.add('g', rbox(0.12, 0.03, 0.29, 0.01, 1), 0xffffff, s, 0.015, 0); }); }
function roundRack(w, x, z, cols, shorts) { w.add('x', rcyl(0.3, 0.05, 0.02, 24), 0x334155, x, 0, z); w.add('x', cyl(8), 0x94a3b8, x, 0.05, z, 0, 0, 0, 0.03, 1.4, 0.03); w.add('x', torus(0.03, 36), 0x94a3b8, x, 1.45, z, PI / 2, 0, 0, 0.62, 0.62, 0.62);
  const n = 14, H = shorts ? 0.42 : 0.62; for (let i = 0; i < n; i++) { const a = i / n * PI * 2, gx = x + Math.cos(a) * 0.62, gz = z - Math.sin(a) * 0.62; w.add('f', rbox(0.44, H, 0.05, 0.03, 1), cols[i % cols.length], gx, 1.42 - H / 2, gz, 0, a + PI / 2, 0); w.add('x', cyl(6), 0x94a3b8, gx, 1.42, gz, 0, 0, 0, 0.008, 0.06, 0.008); }
  w.solid(x - 0.75, 0, z - 0.75, x + 0.75, 1.5, z + 0.75); }
function bottle(w, x, y, z, col = 0x38bdf8) { w.add('g', rcyl(0.04, 0.2, 0.015, 12), col, x, y, z); w.add('g', rcyl(0.025, 0.04, 0.01, 10), 0xffffff, x, y + 0.2, z); }
function cupSet(w, x, y, z, col) { w.add('g', lathe([[0, 0], [0.04, 0], [0.05, 0.14], [0, 0.14]], 14, 'cup'), col, x, y, z); w.add('x', cyl(6), 0xffffff, x + 0.01, y + 0.1, z, 0, 0, 0.15, 0.006, 0.12, 0.006); }
function stanchions(w, axis, at, from, to, y0 = 0) { const n = Math.max(2, Math.round(Math.abs(to - from) / 1.1) + 1); for (let i = 0; i < n; i++) { const p = from + (to - from) * i / (n - 1), x = axis === 'x' ? p : at, z = axis === 'x' ? at : p; w.add('x', rcyl(0.16, 0.04, 0.01, 18), 0xcca43b, x, y0, z); w.add('x', cyl(10), 0xcca43b, x, y0, z, 0, 0, 0, 0.025, 0.95, 0.025); w.add('x', sph(10), 0xfcd34d, x, y0 + 0.97, z, 0, 0, 0, 0.045, 0.045, 0.045); }
  const L = Math.abs(to - from), m = (from + to) / 2; for (let i = 0; i < 5; i++) { const t = (i + 0.5) / 5 - 0.5, sag = 0.12 * (1 - 4 * t * t); const p = m + t * L * 0.98; w.add('f', capsule(8), 0xb91c1c, axis === 'x' ? p : at, y0 + 0.85 - sag, axis === 'x' ? at : p, axis === 'x' ? 0 : PI / 2, 0, axis === 'x' ? PI / 2 : 0, 0.035, L / 10, 0.035); } }
function towel(w, x, y, z, ry, col) { const T = w.tf(x, y, z, ry); T.add('f', rbox(0.5, 0.7, 0.04, 0.02, 1), col, 0, -0.35, 0); T.add('f', rbox(0.52, 0.06, 0.06, 0.02, 1), shadeC(col), 0, -0.6, 0); }
function shadeC(c) { const o = new THREE.Color(c); o.multiplyScalar(0.8); return o.getHex(); }
function gymBag(w, x, y, z, ry, col) { const T = w.tf(x, y, z, ry); T.add('g', capsule(14), col, 0, 0.16, 0, 0, 0, PI / 2, 0.32, 0.36, 0.3); T.add('x', torus(0.12, 14, PI), 0x111827, 0, 0.3, 0, 0, 0, 0, 0.13, 0.13, 0.13); }
function fan(w, x, z, y) { const r = w.region; if (r.startsWith('in_')) w.region = 'roof_' + r.slice(3); w.add('x', cyl(6), 0x334155, x, y, z, 0, 0, 0, 0.02, 0.6, 0.02); w.add('x', rcyl(0.18, 0.14, 0.05, 18), 0xffffff, x, y - 0.12, z); for (let i = 0; i < 4; i++) { const a = i * PI / 2 + 0.3; w.add('m', rbox(0.9, 0.02, 0.2, 0.01, 1), 0xb7773f, x + Math.cos(a) * 0.55, y - 0.06, z - Math.sin(a) * 0.55, 0, a, 0); } w.region = r; }
function ballsOn(w, x, z, n, r) { for (let i = 0; i < n; i++) { const a = R() * PI * 2, d = Math.sqrt(R()) * r; w.add('g', sph(10), 0xe6ff3b, x + Math.cos(a) * d, 0.045, z + Math.sin(a) * d, 0, 0, 0, 0.045, 0.045, 0.045); } }
function paddleBoard(w, x, z, ry, n = 8) { const T = w.tf(x, 0, z, ry); T.box('m', 0xd6c3a5, 0, 0.8, 0, n * 0.42 + 0.3, 1.5, 0.06, 0.02); for (let i = 0; i < n; i++) { const P = T.P(-(n - 1) * 0.21 + i * 0.42, 1.2, 0.08); paddleV(w, P[0], P[1], P[2], ry, TEES[(i * 3) % TEES.length], 0x111827, false, 1.4); } }

function shopFill(w) { w.region = 'in_shop';
  // entrance rug + welcome mat, plants in the corners
  K.rug(w, 21.2, 57, PI / 2, 3.0, 2.2, 0x0f766e, 0xe6ff3b); [[18.9, 66.9], [38.9, 47.7], [18.9, 51.4], [38.9, 67.0]].forEach(([x, z]) => K.plant(w, x, z, 0.9));
  // ball bins in a row facing the door, grip/overgrip spinners by the podium
  [[29.4, 0xe6ff3b, '$3'], [30.5, 0xff8a3d, '$3'], [31.6, 0xe6ff3b, 'FOAM'], [32.7, 0x38bdf8, '$4']].forEach(([x, c, t]) => ballBin(w, x, 49.9, c, t));
  spinner(w, 26.6, 54.3, 'GRIPS'); spinner(w, 26.6, 59.7, 'GEAR'); spinner(w, 30.2, 54.5, 'WRISTBANDS'.slice(0, 5));
  // mannequins on a little platform along the south aisle
  { const T = w.tf(31.5, 0, 65.3, 0); T.slab('m', 0xffffff, 0, 0, 0, 4.4, 0.12, 1.3, 0.04); T.box('l', 0x2dd4bf, 0, 0.12, 0.66, 4.4, 0.02, 0.02, 0.01, 0.6); }
  mannequin(w, 30.0, 65.3, PI, 0x16a34a, 0x111827, 0xffffff); mannequin(w, 31.5, 65.3, PI, 0xe6ff3b, 0x2563eb, 0); mannequin(w, 33.0, 65.3, PI, 0xff4fa0, 0xffffff, 0x0f766e);
  // bag display wall + folded tees + hat shelf + try-on benches by the shoe wall
  roundRack(w, 27.2, 63.4, [0x111827, 0x2563eb, 0xffffff, 0x16a34a], true); roundRack(w, 32.8, 54.7, TEES); roundRack(w, 20.6, 53.2, [0xff4fa0, 0xa855f7, 0xffffff, 0x2dd4bf]);
  K.rug(w, 28, 57, 0, 5.2, 4.4, 0x111827, 0xef4444); K.rug(w, 36.7, 59.5, PI / 2, 3.4, 2.4, 0x0f766e, 0xf1f5f9);
  person(27.2, 62.2, PI, { name: 'Shopper' }); person(20.2, 54.6, PI * 0.8, { name: 'Shopper' }); person(29.8, 58.5, -PI / 2, { name: 'Shopper' }); person(33.6, 55.8, PI * 0.9, { name: 'Shopper' });
  bagStand(w, 38.5, 52.0, -PI / 2); foldTable(w, 31.5, 57.0, 0); hatShelf(w, 26.6, 67.3, PI, 2.6); hatShelf(w, 18.25 + 0.2, 62.5, PI / 2, 2.2);
  ottoman(w, 37.3, 59.5, PI / 2, 2.6); ottoman(w, 35.6, 59.5, PI / 2, 1.4, 0xe6ff3b); shoePair(w, 36.6, 58.3, 0.4, 0xff4fa0); shoePair(w, 36.5, 60.9, -0.2, 0x2563eb); shoePair(w, 38.6, 61.7, PI / 2, 0xffffff);
  // posters + sale banner
  poster(w, 'z', 39.45, 49.6, 2.7, 1.3, 1.0, 0xef4444, -1, 'MAXGRIT', 0xffffff); poster(w, 'z', 39.45, 66.3, 2.7, 1.3, 1.0, 0x2563eb, -1, 'SILENT SERVE', 0xffffff); poster(w, 'z', 39.45, 54.6, 3.7, 1.6, 0.5, 0xe6ff3b, -1, 'SALE 20%', 0x0f766e);
  { const r = w.region; w.region = 'roof_shop'; w.add('f', rbox(5, 0.7, 0.03, 0.02, 1), 0xef4444, 28.5, 4.35, 57); txt(w, 'GEAR UP · PLAY BETTER', 28.5, 4.3, 57.02, 0, 0.26, 0xffffff); txt(w, 'GEAR UP · PLAY BETTER', 28.5, 4.3, 56.98, PI, 0.26, 0xffffff); w.region = r; }
  // people: staff + shoppers (counter queue, shoe try-on, bins, mannequins, bags)
  person(26.3, 50.2, -2.4, { name: 'Shopper' }); person(21.4, 50.4, 2.5, { name: 'Shopper' }); person(31.0, 51.0, PI, { name: 'Shopper' }); person(33.2, 63.6, PI, { name: 'Shopper' });
  person(37.8, 53.2, -PI / 2 + 0.3, { name: 'Shopper' }); person(26.4, 56.9, PI / 2, { name: 'Shopper' }); person(29.0, 60.2, 0.4, { name: 'Shopper' }); person(21.2, 58.6, PI / 2, { name: 'Shopper' });
  person(34.4, 57.6, -PI / 2, { staff: true, name: 'Staff' }); person(29.6, 47.4, PI, { staff: true, name: 'Staff' }); seat(37.3, 0.46, 60.3, PI / 2, { name: 'Shopper' });
}
function clubFill(w) { w.region = 'in_club';
  // lobby: sofa nook, Grok Cup trophy on a roped pedestal, frames, plants
  K.sofa(w, -29.5, 68.9, PI, 0x166534, 0x22c55e); K.tableR(w, -29.5, 66.9, 0.5, 0.45, 0xb7773f); bottle(w, -29.3, 0.45, 66.8); cupSet(w, -29.7, 0.45, 67.0, 0xef4444);
  { const x = -27.5, z = 57; w.add('m', rbox(0.9, 1.0, 0.9, 0.06, 2), 0x1f2937, x, 0.5, z); w.add('g', rbox(0.95, 0.06, 0.95, 0.03, 1), 0xcca43b, x, 1.03, z); trophy(w, x, 1.06, z, 4.2, 0xfcd34d); txt(w, 'GROK CUP', x, 0.55, z + 0.46, 0, 0.14, 0xfcd34d); w.solid(x - 0.5, 0, z - 0.5, x + 0.5, 2.2, z + 0.5); }
  stanchions(w, 'x', 55.6, -29.0, -26.0); stanchions(w, 'x', 58.4, -29.0, -26.0);
  [[-33.2, 46.0], [-33.2, 68.6], [-21.0, 68.9]].forEach(([x, z]) => K.plant(w, x, z, 0.9)); for (let i = 0; i < 3; i++) frameArt(w, 'x', 44.25, -31 + i * 3, 3.6, 0.9, 0.7, TEES[i * 3], 1);
  pend(w, -29.5, 67.2, 0xfef3c7, 4.6);
  K.sofa(w, -18.9, 64.0, -PI / 2, 0x7c4a1e, 0xb7773f); K.tableR(w, -20.7, 64.0, 0.45, 0.45, 0xffffff); cupSet(w, -20.6, 0.45, 63.9, 0x16a34a); seat(-19.3, 0.45, 63.4, -PI / 2, { name: 'Member' }); [[-18.9, 55.0], [-18.9, 59.0]].forEach(([x, z]) => K.potPlant(w, x, 0.06, z, 1.4, 0x16a34a));
  { const T = w.tf(-31.0, 0, 50.0, PI / 2); T.slab('m', 0x7c4a1e, 0, 0, 0, 2.4, 0.9, 0.9, 0.04); T.add('e', rbox(2.3, 0.5, 0.8, 0.03, 1), 0xdff6ff, 0, 1.15, 0); for (let i = 0; i < 4; i++) paddleV(w, ...T.P(-0.8 + i * 0.55, 0.92, 0), PI / 2, TEES[i * 2], 0x111827, false, 1.5); txt(w, 'HALL OF FAME PADDLES', ...T.P(0, 1.55, 0.46), PI / 2, 0.12, 0x7c4a1e); }
  K.tableR(w, -22.0, 52.4, 0.6, 0.78, 0xffffff); K.chair(w, -22.0, 0, 51.4, 0, 0x16a34a); K.chair(w, -22.0, 0, 53.4, PI, 0x16a34a); seat(-22.0, 0.5, 51.5, 0, { name: 'Member' }); cupSet(w, -21.8, 0.78, 52.3, 0xffffff);
  person(-29.6, 60.4, 0.4, { name: 'Member' }); person(-20.2, 61.6, -PI / 2, { name: 'Member' });
  person(-32.8, 54.6, -PI / 2, { name: 'Member' }); person(-32.6, 61.0, -PI / 2, { name: 'Member' }); person(-27.4, 54.9, 0, { name: 'Member' }); person(-24.5, 50.4, PI, { name: 'Member' }); person(-22.8, 58.4, 1.8, { name: 'Member' });
  seat(-30.1, 0.45, 68.5, PI, { name: 'Member' }); seat(-28.9, 0.45, 68.5, PI, { name: 'Member' });
  // lounge: coffee-bar regular, game players, TV watcher
  person(-48.0, 55.0, 0, { name: 'Member' }); seat(-38.4, 0.62, 53.5, PI / 2, { name: 'Member' }); person(-40.6, 47.4, PI, { name: 'Member' }); person(-45.6, 54.6, 0.6, { name: 'Member' });
  K.plant(w, -51.2, 45.2, 0.9); fan(w, -44, 48.5, 5.5);
  // locker room: vanity + sinks, towels, gym bags, bottles, laundry, scale, plants, people
  { const T = w.tf(-47.5, 0, 57.45, 0); T.slab('g', 0x334155, 0, 0, 0, 3.0, 0.88, 0.6, 0.04); T.box('m', 0xf1f5f9, 0, 0.88, 0, 3.1, 0.06, 0.66, 0.02); [-0.8, 0.8].forEach((a) => { T.add('g', lathe([[0, 0], [0.2, 0.02], [0.22, 0.12], [0, 0.12]], 20, 'sink'), 0xffffff, a, 0.86, 0.02); T.add('x', cyl(8), 0xcbd5e1, a, 0.94, -0.22, 0, 0, 0, 0.015, 0.2, 0.015); T.add('x', cyl(8), 0xcbd5e1, a, 1.13, -0.22, PI / 2, 0, 0, 0.012, 0.14, 0.012); }); T.add('e', rbox(2.8, 1.1, 0.03, 0.01, 1), 0xdff6ff, 0, 1.8, -0.28); bottle(w, -48.5, 0.94, 57.6, 0xa855f7); bottle(w, -46.6, 0.94, 57.6, 0x22c55e); }
  [[-50.6, 0xffffff], [-50.0, 0x38bdf8], [-49.4, 0x16a34a]].forEach(([x, c]) => towel(w, x, 1.9, 69.6, PI, c)); for (let i = 0; i < 4; i++) w.add('x', cyl(6), 0xcbd5e1, -50.6 + i * 0.6, 1.88, 69.75, PI / 2, 0, 0, 0.015, 0.12, 0.015);
  gymBag(w, -44.6, 0.56, 66.6, 0.1, 0xef4444); gymBag(w, -41.6, 0.56, 60.2, -0.2, 0x2563eb); gymBag(w, -42.2, 0, 61.2, 0.6, 0x111827); bottle(w, -43.4, 0.56, 66.7, 0x38bdf8); bottle(w, -43.0, 0.56, 60.3, 0xe6ff3b); shoePair(w, -44.0, 65.8, 0.3, 0xffffff); shoePair(w, -41.0, 61.1, -0.4, 0x16a34a);
  { const x = -38.8, z = 68.8; w.add('f', lathe([[0, 0], [0.32, 0], [0.36, 0.8], [0, 0.8]], 22, 'hamper'), 0x93c5fd, x, 0, z); for (let i = 0; i < 4; i++) w.add('f', sph(10), TEES[i * 2], x - 0.15 + (i % 2) * 0.3, 0.82, z - 0.1 + (i >> 1) * 0.2, 0, 0, 0, 0.18, 0.08, 0.16); w.solid(x - 0.36, 0, z - 0.36, x + 0.36, 0.9, z + 0.36); }
  { const x = -46.2, z = 60.2; w.add('g', rbox(0.4, 0.06, 0.4, 0.03, 1), 0xf1f5f9, x, 0.03, z); w.add('l', rbox(0.12, 0.01, 0.06, 0.005, 1), 0x22c55e, x, 0.065, z + 0.1, 0, 0, 0, 1, 1, 1, 0.5); }
  K.plant(w, -51.0, 58.2, 0.8); fan(w, -43, 64, 5.5); K.rug(w, -43, 63.4, 0, 6.0, 1.6, 0x1e3a8a, 0x93c5fd); person(-39.5, 62.4, -PI / 2, { name: 'Member' });
  person(-46.0, 68.3, 0, { name: 'Member' }); person(-45.0, 64.7, PI, { name: 'Member' }); seat(-41.6, 0.5, 60.0, PI, { name: 'Member' }); person(-47.8, 58.3, PI, { name: 'Member' }); person(-36.9, 66.8, -PI / 2, { name: 'Member' });
}
function snackFill(w) { w.region = 'in_snack';
  // condiment station by the door, queue ropes at the counter, window bar with stools along the south wall
  { const T = w.tf(-16.2, 0, 84.0, -PI / 2); T.slab('g', 0x16a34a, 0, 0, 0, 1.6, 0.95, 0.6, 0.05); T.box('m', 0xfef3c7, 0, 0.95, 0, 1.7, 0.05, 0.66, 0.02); [[0xef4444, -0.55], [0xfcd34d, -0.35], [0x22c55e, -0.15]].forEach(([c, a]) => { T.add('g', rcyl(0.06, 0.22, 0.03, 14), c, a, 1.0, 0); T.add('g', cone(10), c, a, 1.22, 0, 0, 0, 0, 0.025, 0.06, 0.025); });
    T.box('x', 0xcbd5e1, 0.25, 1.0, 0, 0.2, 0.24, 0.16, 0.02); T.add('g', rbox(0.16, 0.12, 0.12, 0.01, 1), 0xffffff, 0.25, 1.3, 0); for (let i = 0; i < 5; i++) T.add('x', cyl(6), TEES[i], 0.6 + (i % 3) * 0.02, 1.0, (i - 2) * 0.02, (i - 2) * 0.08, 0, 0.05 * (i - 2), 0.006, 0.26, 0.006); T.add('g', lathe([[0, 0], [0.08, 0], [0.09, 0.2], [0, 0.2]], 16, 'strawcup'), 0xffffff, 0.6, 1.0, 0); txt(w, 'SAUCES', ...T.P(0, 1.65, -0.28), -PI / 2, 0.16, 0x166534); T.box('m', 0xfef3c7, 0, 1.5, -0.3, 1.0, 0.3, 0.04, 0.02); }
  stanchions(w, 'z', -28.4, 82.6, 86.4); stanchions(w, 'z', -27.2, 82.6, 86.4);
  { const T = w.tf(-27.0, 0, 93.6, PI); T.box('m', 0xb7773f, 0, 1.0, 0, 5.0, 0.06, 0.45, 0.02); [-2.3, 2.3].forEach((a) => T.box('x', 0x94a3b8, a, 0, 0.1, 0.06, 1.0, 0.06, 0.01)); for (let i = 0; i < 4; i++) { const sx = -1.8 + i * 1.2; const P = T.P(sx, 0, -0.55); K.stool(w, P[0], P[2], [0xef4444, 0x16a34a, 0xfcd34d, 0x16a34a][i]); } }
  // pickle barrel, plants, ceiling fan, table settings
  { const x = -17.2, z = 93.0; w.add('m', lathe([[0, 0], [0.42, 0], [0.5, 0.5], [0.42, 1.0], [0, 1.0]], 24, 'barrel'), 0x8b5a2b, x, 0, z); [0.15, 0.85].forEach((y) => w.add('x', torus(0.03, 24), 0x334155, x, y, z, PI / 2, 0, 0, 0.47, 0.47, 0.47)); for (let i = 0; i < 5; i++) w.add('g', capsule(10), 0x4d7c0f, x - 0.2 + (i % 3) * 0.2, 1.02, z - 0.1 + (i >> 1) * 0.12, PI / 2, 0, 0.3 * i, 0.07, 0.12, 0.07); txt(w, 'PICKLES 50¢', x, 1.25, z - 0.52, PI, 0.13, 0x166534); w.solid(x - 0.5, 0, z - 0.5, x + 0.5, 1.0, z + 0.5); }
  K.tableR(w, -18.6, 91.8, 0.55, 0.78, 0xffffff); K.stool(w, -17.7, 92.6, 0xef4444); K.stool(w, -19.5, 92.6, 0x16a34a); seat(-17.7, 0.66, 92.6, PI * 0.8, { name: 'Snacker' }); seat(-19.5, 0.66, 92.6, -PI * 0.8, { name: 'Snacker' }); cupSet(w, -18.5, 0.78, 91.7, 0xfcd34d); K.tray(w, -18.8, 0.78, 91.5, 0.4);
  [[-33.2, 93.3], [-33.2, 80.7], [-14.8, 90.9]].forEach(([x, z]) => K.plant(w, x, z, 0.8)); fan(w, -22, 87.8, 4.4);
  [[-24, 89], [-20, 89], [-24, 92.4]].forEach(([x, z], i) => { cupSet(w, x + 0.25, 0.8, z + 0.1, TEES[i + 1]); cupSet(w, x - 0.3, 0.8, z - 0.15, TEES[i + 4]); K.tray(w, x, 0.8, z, i); });
  // people: queue, window bar, booth partners, cook
  person(-27.8, 83.4, -PI / 2, { name: 'Snacker' }); person(-27.8, 84.6, -PI / 2, { name: 'Snacker' }); person(-27.8, 85.8, -PI / 2, { name: 'Snacker' }); person(-16.8, 85.2, -PI / 2, { name: 'Snacker' });
  seat(-28.8, 0.66, 93.05, PI, { name: 'Snacker' }); seat(-26.4, 0.66, 93.05, PI, { name: 'Snacker' }); seat(-22.5, 0.45, 82.0, 0, { name: 'Snacker' }); seat(-19.0, 0.45, 82.0, 0, { name: 'Snacker' });
  person(-32.7, 90.0, -PI / 2, { staff: true, name: 'Cook' }); person(-32.7, 84.6, -PI / 2, { staff: true, name: 'Cook' });
}
function trainFill(w) { const c = COURTS.train; w.region = 'in_train';
  // north strip: water station, paddle rack, benches, stretching mats, ball carts
  K.cooler(w, 29.2, 78.8); K.cooler(w, 30.0, 78.8); for (let i = 0; i < 6; i++) cupSet(w, 30.8 + (i % 3) * 0.12, 0.88, 78.6 + (i >> 1 & 1) * 0.12, 0xffffff); w.slab('m', 0xb7773f, 31.0, 0, 78.7, 0.8, 0.86, 0.5, 0.03);
  paddleBoard(w, 35.5, 78.15, 0, 8); K.bench(w, 35.5, 79.6, PI, 0x1e3a8a); K.bench(w, 40.5, 79.6, PI, 0x1e3a8a);
  [44.2, 45.4, 46.6].forEach((x, i) => gymMat(w, x, 80.8, [0x2563eb, 0x16a34a, 0xff4fa0][i]));
  { const x = 48.2, z = 79.4; w.add('x', rbox(0.9, 0.06, 0.6, 0.02, 1), 0x334155, x, 0.25, z); [-0.4, 0.4].forEach((a) => [-0.25, 0.25].forEach((b) => w.add('x', cyl(6), 0x94a3b8, x + a, 0, z + b, 0, 0, 0, 0.015, 0.95, 0.015))); w.add('x', cyl(6), 0x94a3b8, x - 0.45, 0.95, z, PI / 2, 0, 0, 0.015, 0.6, 0.015); ballsOn(w, x, z, 0, 0); for (let i = 0; i < 40; i++) w.add('g', sph(8), 0xe6ff3b, x - 0.38 + (i % 8) * 0.11, 0.33 + (i / 32 | 0) * 0.09, z - 0.22 + ((i >> 3) % 4) * 0.13, 0, 0, 0, 0.045, 0.045, 0.045); w.solid(x - 0.45, 0, z - 0.3, x + 0.45, 1.0, z + 0.3); }
  { const T = w.tf(31.5, 0, 81.3, 0); for (let i = 0; i < 9; i++) T.add('f', rbox(0.06, 0.02, 0.8, 0.01, 1), 0xfcd34d, -2 + i * 0.5, 0.1, 0); [-0.4, 0.4].forEach((b) => T.add('f', rbox(4.1, 0.015, 0.05, 0.01, 1), 0xfcd34d, 0, 0.1, b)); cones(w, 28.8, 82.6, 3, 0.7); }
  person(30.3, 81.3, PI / 2, { name: 'Player' }); person(32.4, 81.3, PI / 2, { name: 'Player' }); person(34.4, 82.5, -PI / 2, { staff: true, name: 'Coach' }); K.crate(w, 47.0, 0, 82.4, 0.7, 0x1e3a8a); K.crate(w, 47.0, 0.7, 82.4, 0.6, 0xfde047);
  person(44.2, 81.2, PI, { name: 'Player' }); person(45.4, 80.5, PI / 2, { name: 'Player' }); seat(40.0, 0.55, 79.7, 0, { name: 'Player' }); person(29.8, 79.9, 0.4, { name: 'Player' });
  // south strip: rebound wall with two players, ball baskets
  { const T = w.tf(35, 0, 109.5, PI); T.slab('g', 0xf8fafc, 0, 0, 0, 11, 2.6, 0.2, 0.04); T.box('l', 0x22c55e, 0, 0.86, 0.11, 11, 0.06, 0.02, 0.01, 0.4); [-3, 0, 3].forEach((a) => { T.box('g', 0xef4444, a, 1.4, 0.11, 0.7, 0.7, 0.02, 0.01); T.box('g', 0xffffff, a, 1.6, 0.12, 0.3, 0.3, 0.02, 0.01); }); txt(w, 'REBOUND WALL', ...T.P(0, 2.25, 0.13), PI, 0.24, 0x1e3a8a); }
  person(32.0, 106.8, 0, { name: 'Player' }); person(38.0, 106.6, 0.2, { name: 'Player' }); person(45.0, 107.6, -0.6, { name: 'Player' }); ballsOn(w, 35, 107.5, 14, 2.5); hopper(w, 29.4, 0, 107.6); cones(w, 41, 106, 4, 0.9);
  // coaches by the court + scattered balls in the run-off
  person(c.x - 5.4, c.z - 7.0, PI / 2, { staff: true, name: 'Coach' }); person(c.x + 5.4, c.z + 7.0, -PI / 2, { staff: true, name: 'Coach' }); ballsOn(w, c.x + 5.0, c.z - 9.0, 10, 1.2); ballsOn(w, c.x - 5.0, c.z + 9.0, 8, 1.2);
  // drill desk queue + video room viewers
  person(21.0, 83.2, PI, { name: 'Player' }); person(21.6, 84.4, PI, { name: 'Player' }); person(18.2, 90.6, PI / 2, { name: 'Player' }); K.plant(w, 16.9, 93.0, 0.8); K.plant(w, 26.3, 78.9, 0.8);
  person(24.6, 104.6, 0.3, { name: 'Player' }); person(19.0, 108.6, PI, { name: 'Player' });
}
