// Great Rodentia 2: Escape from National Ratita Prison — Holiday Special
// Builds the walk-in prison compound: Cell Block A (+ Tortoise Wing), Cafeteria, Visitation & Front Gate,
// the snowy Yard with guard towers, Workshop, Laundry and the Warden's Office. Dense, tidy, festive.
import * as K from './kit.js?v=gr3';
import { shell, part, onSide, BUILDINGS } from './bld.js?v=gr3';
import { rbox } from './world.js?v=gr3';
import { txt, poster, wallWord, clockW, pendant, rack, pallet, cartStatic, trash } from './art.js?v=gr3';
import { sph, cyl, cone, torus, star } from './shapes.js?v=gr3';

const PI = Math.PI;
export const ENV = {
  skyTop: 0x050a1c, skyMid: 0x16284d, skyBot: 0x4b5f8c,
  sunDir: [-0.35, 0.55, -0.75], sunColor: 0xbcd4ff, sunI: 1.9, sunDisc: 0.9,
  hemiSky: 0xa9c4ff, hemiGround: 0x1a2236, hemiI: 0.72,
  envLight: 0x9fb8ff, envLightI: 1.9, envI: 0.92, exposure: 1.08,
  bloomT: 0.95, bloomS: 0.55, stars: 0.9, nebula: 0x14204a, fog: 0x0f1a33, fogD: 0.0042,
};
const HOLI = [0xef4444, 0x22c55e, 0xfacc15, 0x38bdf8, 0xf472b6];

// ---------- festive helpers ----------
export function xmasTree(w, x, z, s = 1, lights = true) {
  w.add('m', cyl(10), 0x7c4a1e, x, 0, z, 0, 0, 0, 0.14 * s, 0.6 * s, 0.14 * s);
  [[0.5, 1.25, 1.3], [1.25, 1.0, 1.15], [1.9, 0.75, 1.0], [2.45, 0.48, 0.85]].forEach(([y, r, h]) => w.add('g', cone(14), 0x166534, x, y * s, z, 0, 0, 0, r * s, h * s, r * s));
  if (lights) for (let i = 0; i < 18; i++) { const a = i * 2.4, y = 0.7 + (i / 18) * 2.1, r = (1.15 - (i / 18) * 0.85) * 1.02; w.add('l', sph(6), HOLI[i % 5], x + Math.cos(a) * r * s, y * s, z + Math.sin(a) * r * s, 0, 0, 0, 0.07 * s, 0.07 * s, 0.07 * s, 0.9); }
  w.add('l', star(), 0xfde047, x, 3.25 * s, z, 0, 0, 0, 0.32 * s, 0.32 * s, 0.12 * s, 1.2);
  w.solid(x - 0.9 * s, 0, z - 0.9 * s, x + 0.9 * s, 2.6 * s, z + 0.9 * s);
}
export function present(w, x, z, s = 0.5, col = 0xef4444, rib = 0xfde047) {
  w.slab('g', col, x, 0, z, s, s * 0.8, s, 0.04);
  w.add('g', rbox(s + 0.02, s * 0.8 + 0.02, s * 0.14, 0.01), rib, x, s * 0.4, z);
  w.add('g', rbox(s * 0.14, s * 0.8 + 0.02, s + 0.02, 0.01), rib, x, s * 0.4, z);
  w.add('g', torus(0.3, 12), rib, x, s * 0.86, z, 0, 0.6, 0, s * 0.18, s * 0.18, s * 0.18);
}
// a strand of glowing bulbs from (x0,z0) to (x1,z1) at height y, drooping a little
export function lightString(w, x0, z0, x1, z1, y, n) {
  n = n || Math.max(4, Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.7));
  for (let i = 0; i <= n; i++) { const t = i / n, sag = Math.sin(t * PI) * 0.25; w.add('l', sph(6), HOLI[i % 5], x0 + (x1 - x0) * t, y - sag, z0 + (z1 - z0) * t, 0, 0, 0, 0.065, 0.085, 0.065, 1.1); }
}
function garland(w, axis, at, from, to, y, side) {
  const L = Math.abs(to - from), n = Math.round(L / 0.45);
  for (let i = 0; i <= n; i++) { const p = from + (to - from) * i / n, sag = Math.abs(Math.sin(i / 6 * PI)) * 0.28; const x = axis === 'x' ? p : at + side * 0.32, z = axis === 'x' ? at + side * 0.32 : p;
    w.add('g', sph(6), 0x15803d, x, y - sag, z, 0, 0, 0, 0.16, 0.13, 0.16); if (i % 3 === 0) w.add('l', sph(6), HOLI[(i / 3) % 5 | 0], x, y - sag - 0.12, z, 0, 0, 0, 0.06, 0.06, 0.06, 1.0); }
}
function wreath(w, axis, at, c, y, side) { const x = axis === 'x' ? c : at + side * 0.3, z = axis === 'x' ? at + side * 0.3 : c, ry = axis === 'x' ? 0 : PI / 2;
  w.add('g', torus(0.32, 18), 0x15803d, x, y, z, 0, ry, 0, 0.45, 0.45, 0.45); w.add('l', sph(6), 0xef4444, x, y - 0.4, z, 0, 0, 0, 0.1, 0.1, 0.1, 0.8); }
function bunk(w, x, z, ry) { const T = w.tf(x, 0, z, ry);
  [[-0.95, -0.45], [0.95, -0.45], [-0.95, 0.45], [0.95, 0.45]].forEach(([a, b]) => T.box('x', 0x64748b, a, 0, b, 0.08, 2.0, 0.08, 0.02));
  T.box('m', 0x475569, 0, 0.42, 0, 2.0, 0.08, 1.0, 0.02); T.box('f', 0xe2e8f0, 0, 0.5, 0, 1.9, 0.16, 0.92, 0.06); T.box('f', 0xdc2626, 0.2, 0.62, 0, 1.3, 0.06, 0.94, 0.03);
  T.box('m', 0x475569, 0, 1.45, 0, 2.0, 0.08, 1.0, 0.02); T.box('f', 0xe2e8f0, 0, 1.53, 0, 1.9, 0.16, 0.92, 0.06); T.box('f', 0x16a34a, 0.2, 1.65, 0, 1.3, 0.06, 0.94, 0.03);
  T.box('f', 0xffffff, -0.7, 0.66, 0, 0.36, 0.12, 0.6, 0.06); T.box('f', 0xffffff, -0.7, 1.69, 0, 0.36, 0.12, 0.6, 0.06);
  T.solid(-1.0, 0, -0.5, 1.0, 1.7, 0.5); }
function toilet(w, x, z, ry) { const T = w.tf(x, 0, z, ry); T.box('x', 0xe5e7eb, 0, 0, 0, 0.42, 0.42, 0.5, 0.12); T.box('x', 0xcbd5e1, 0, 0.42, -0.2, 0.44, 0.4, 0.14, 0.05); T.solid(-0.22, 0, -0.27, 0.22, 0.45, 0.27); }
function washer(w, x, z, ry, col = 0xf8fafc) { const T = w.tf(x, 0, z, ry); T.box('x', col, 0, 0, 0, 0.9, 1.0, 0.85, 0.08); T.add('x', torus(0.25, 20), 0x94a3b8, 0, 0.55, 0.44, 0, 0, 0, 0.32, 0.32, 0.32); T.add('l', sph(12), 0x7dd3fc, 0, 0.55, 0.43, 0, 0, 0, 0.26, 0.26, 0.06, 0.25); T.box('l', 0x22c55e, 0.3, 0.88, 0.43, 0.08, 0.05, 0.02, 0.01, 0.9); T.solid(-0.45, 0, -0.43, 0.45, 1.0, 0.43); }

// vertical bars along an axis; returns solids flagged see-through (vision rays ignore them)
function bars(w, axis, at, from, to, H, col, gaps = []) {
  for (let p = from; p <= to + 0.001; p += 0.3) { if (gaps.some(([a, b]) => p > a - 0.05 && p < b + 0.05)) continue; const x = axis === 'x' ? p : at, z = axis === 'x' ? at : p; w.add('x', cyl(8), col, x, 0, z, 0, 0, 0, 0.035, H, 0.035); }
  if (axis === 'x') w.add('x', rbox(Math.abs(to - from) + 0.1, 0.12, 0.12, 0.03), col, (from + to) / 2, H, at); else w.add('x', rbox(0.12, 0.12, Math.abs(to - from) + 0.1, 0.03), col, at, H, (from + to) / 2);
  let cur = from; const segs = []; for (const [a, b] of gaps.slice().sort((p, q) => p[0] - q[0])) { if (a > cur) segs.push([cur, a]); cur = b; } if (cur < to) segs.push([cur, to]);
  for (const [a, b] of segs) { if (axis === 'x') w.solid(a, 0, at - 0.08, b, H, at + 0.08, { see: true }); else w.solid(at - 0.08, 0, a, at + 0.08, H, b, { see: true }); }
}

export function buildPrison(w) {
  BUILDINGS.length = 0; K.propSeed(1115);
  const spots = [], marks = {};
  const L = (x, y, z, c = 0xffd9a0, i = 22, d = 16, flick = false, shaft = false) => { spots.push({ x, y, z, c, i, d, flick, shaft }); w.lights.push({ x, y, z, c, i, d }); };

  // ================= GROUNDS =================
  w.region = 'out';
  w.slab('m', 0x2b3446, 0, -0.4, 14, 74, 0.4, 118, 0.05, { floor: true });
  // snowy yard + lawns
  w.slab('g', 0xe8f0fb, 0, -0.02, 10, 47, 0.05, 49, 0.02, { floor: true });
  w.slab('g', 0xdbe6f5, 29.6, -0.02, 10, 10.8, 0.05, 52, 0.02, { floor: true });
  w.slab('g', 0xdbe6f5, -29.6, -0.02, 10, 10.8, 0.05, 52, 0.02, { floor: true });
  // shovelled concrete paths
  w.slab('g', 0x6b7280, 0, 0.0, 10, 3.2, 0.05, 50, 0.02, { floor: true });
  w.slab('g', 0x6b7280, -5, 0.0, -16, 38, 0.05, 2.6, 0.02, { floor: true });
  w.slab('g', 0x6b7280, 0, 0.0, 36, 46, 0.05, 2.6, 0.02, { floor: true });
  // perimeter wall (front gate gap in the south wall at x -3..3)
  const PW = 0x475569, PH = 5.2;
  w.slab('m', PW, -36, 0, 14, 1.0, PH, 117, 0.08); w.slab('m', PW, 36, 0, 14, 1.0, PH, 117, 0.08);
  w.slab('m', PW, 0, 0, 72, 73, PH, 1.0, 0.08);
  w.slab('m', PW, -19.75, 0, -44, 33.5, PH, 1.0, 0.08); w.slab('m', PW, 19.75, 0, -44, 33.5, PH, 1.0, 0.08);
  // razor wire coils on top
  for (let z = -43; z <= 71; z += 1.2) { w.add('x', torus(0.08, 10), 0x94a3b8, -36, PH + 0.3, z, 0, PI / 2, 0, 0.35, 0.35, 0.35); w.add('x', torus(0.08, 10), 0x94a3b8, 36, PH + 0.3, z, 0, PI / 2, 0, 0.35, 0.35, 0.35); }
  for (let x = -35; x <= 35; x += 1.2) { if (Math.abs(x) > 3) w.add('x', torus(0.08, 10), 0x94a3b8, x, PH + 0.3, -44, 0, 0, 0, 0.35, 0.35, 0.35); w.add('x', torus(0.08, 10), 0x94a3b8, x, PH + 0.3, 72, 0, 0, 0, 0.35, 0.35, 0.35); }
  // the front gate (closed until the disguise ending)
  w.slab('x', 0x1e293b, -3.3, 0, -44, 0.6, 6.0, 1.3, 0.05); w.slab('x', 0x1e293b, 3.3, 0, -44, 0.6, 6.0, 1.3, 0.05);
  w.add('m', rbox(7.2, 0.8, 1.4, 0.08), 0x7f1d1d, 0, 6.2, -44); txt(w, 'NATIONAL RATITA PRISON', 0, 6.2, -43.25, 0, 0.32, 0xfde68a, 'l', 0.5);
  bars(w, 'x', -44, -3.0, 3.0, 4.6, 0x334155);
  w.add('l', torus(0.25, 20), 0x15803d, 0, 4.9, -43.4, 0, 0, 0, 0.6, 0.6, 0.6, 0.2); // gate wreath
  // the weak, rusty wall section on the east side (Over-the-Wall route)
  w.add('m', rbox(0.2, 3.6, 3.0, 0.05), 0x92400e, 35.4, 1.8, 10); txt(w, 'UNDER REPAIR', 35.38, 3.9, 10, -PI / 2, 0.22, 0xfde047);
  for (let k = 0; k < 4; k++) w.add('x', rbox(0.12, 0.08, 2.6, 0.02), 0xb45309, 35.25, 0.8 + k * 0.85, 10);
  marks.weakWall = { x: 34.4, z: 10 };

  // inner chain-link fences fencing off the east & west lawns (dead zones)
  const fence = (x) => { for (let z = -17; z <= 37; z += 1.5) w.add('x', cyl(6), 0x9ca3af, x, 0, z, 0, 0, 0, 0.06, 2.6, 0.06);
    for (const y of [0.15, 1.3, 2.5]) w.add('x', rbox(0.06, 0.06, 54, 0.02), 0x9ca3af, x, y, 10); };
  fence(24); fence(-24);
  for (let z = -16.6; z <= 36.6; z += 0.5) { if (z > 8.6 && z < 11.4) continue; w.add('w', rbox(0.02, 2.3, 0.5, 0.0), 0xb6bec9, 24, 1.3, z); w.add('w', rbox(0.02, 2.3, 0.5, 0.0), 0xb6bec9, -24, 1.3, z); }
  w.solid(23.9, 0, -17, 24.1, 2.6, 8.6, { see: true }); w.solid(23.9, 0, 11.4, 24.1, 2.6, 37, { see: true }); w.solid(-24.1, 0, -17, -23.9, 2.6, 37, { see: true });
  w.slab('m', PW, 34.5, 0, -17, 3, 3.0, 0.6, 0.05); w.slab('m', PW, 34.5, 0, 37, 3, 3.0, 0.6, 0.05);
  w.slab('m', PW, -34.5, 0, -17, 3, 3.0, 0.6, 0.05); w.slab('m', PW, -34.5, 0, 37, 3, 3.0, 0.6, 0.05);
  marks.fenceCut = { x: 23.3, z: 10 };
  // red "NO INMATES BEYOND" paint lines
  w.add('l', rbox(0.16, 0.02, 54, 0.0), 0xef4444, 23.4, 0.04, 10, 0, 0, 0, 1, 1, 1, 0.3);
  w.add('l', rbox(0.16, 0.02, 54, 0.0), 0xef4444, -23.4, 0.04, 10, 0, 0, 0, 1, 1, 1, 0.3);
  K.sign3d(w, 'DEAD ZONE · NO INMATES', 23.7, 2.95, 1, -PI / 2, 0.22, 0xffffff, 0x991b1b);
  K.sign3d(w, 'DEAD ZONE · NO INMATES', -23.7, 2.95, 1, PI / 2, 0.22, 0xffffff, 0x991b1b);

  // guard towers: one on each lawn corner, searchlights sweep the dead zones
  const tower = (x, z) => { [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => w.add('x', cyl(8), 0x334155, x + a * 1.1, 0, z + b * 1.1, 0, 0, 0, 0.12, 6.0, 0.12));
    w.solid(x - 1.3, 0, z - 1.3, x + 1.3, 6, z + 1.3); w.slab('m', 0x1e293b, x, 6.0, z, 3.2, 0.3, 3.2, 0.05, { nofloor: true });
    w.add('m', rbox(3.0, 1.0, 3.0, 0.06), 0x64748b, x, 6.8, z); w.add('l', rbox(2.9, 0.6, 2.9, 0.04), 0xfde68a, x, 7.55, z, 0, 0, 0, 1, 1, 1, 0.3); w.add('m', cone(4), 0x7f1d1d, x, 7.9, z, 0, PI / 4, 0, 2.5, 1.2, 2.5);
    w.add('l', star(), 0xfde047, x, 9.3, z, 0, 0, 0, 0.3, 0.3, 0.1, 1); lightString(w, x - 1.6, z - 1.6, x + 1.6, z - 1.6, 7.3, 6); L(x, 7, z, 0xfff2c4, 18, 14); };
  tower(30, -12); tower(30, 33); tower(-30, -12); tower(-30, 33);
  marks.towers = [[30, -12], [30, 33], [-30, -12], [-30, 33]];

  // ---- the yard: tree, rink, hoop, weights, picnic tables, snowrats ----
  xmasTree(w, 0, 10, 1.9); for (let k = 0; k < 7; k++) present(w, Math.cos(k * 0.9) * 2.4, 10 + Math.sin(k * 0.9) * 2.4, 0.42 + (k % 3) * 0.12, HOLI[k % 5], k % 2 ? 0xffffff : 0xfde047);
  L(0, 5.5, 10, 0xffe7a8, 26, 20, false, true);
  K.sign3d(w, "HAPPY HOLLY-DAYS, INMATES!", 0, 3.6, -12.6, 0, 0.34, 0xfde047, 0x14532d);
  w.add('x', cyl(8), 0x334155, -9, 0, -12.8, 0, 0, 0, 0.1, 3.8, 0.1); w.add('x', cyl(8), 0x334155, 9, 0, -12.8, 0, 0, 0, 0.1, 3.8, 0.1);
  // ice rink (west)
  w.slab('g', 0xbfe3ff, -14, 0.0, 22, 12, 0.06, 9, 0.2, { floor: true }); K.fenceRun(w, 'x', 17.4, -19.8, -8.2, 0.6, 0xffffff); K.fenceRun(w, 'x', 26.6, -19.8, -8.2, 0.6, 0xffffff);
  txt(w, 'SKATE RINK', -14, 1.1, 17.3, PI, 0.28, 0xffffff, 'l', 0.3);
  // basketball (east)
  w.slab('g', 0x334155, 14, 0.0, 22, 11, 0.06, 9, 0.05, { floor: true }); w.add('x', cyl(8), 0x1f2937, 14, 0, 26.4, 0, 0, 0, 0.1, 3.0, 0.1); w.add('m', rbox(1.6, 1.0, 0.1, 0.03), 0xffffff, 14, 3.3, 26.3); w.add('x', torus(0.05, 16), 0xf97316, 14, 2.95, 25.9, PI / 2, 0, 0, 0.3, 0.3, 0.3);
  w.add('m', sph(12), 0xf97316, 13, 0.25, 21, 0, 0, 0, 0.25); w.solid(13.8, 0, 26.2, 14.2, 3.4, 26.6);
  // weights corner
  for (const [x, z] of [[-14, 2], [-16, 4]]) { w.slab('m', 0x111827, x, 0, z, 1.8, 0.5, 0.7, 0.05); w.add('x', cyl(10), 0x9ca3af, x, 1.0, z, 0, 0, PI / 2, 0.04, 2.0, 0.04); w.add('m', cyl(16), 0x1f2937, x - 0.85, 1.0, z, 0, 0, PI / 2, 0.3, 0.12, 0.3); w.add('m', cyl(16), 0x1f2937, x + 0.85, 1.0, z, 0, 0, PI / 2, 0.3, 0.12, 0.3); }
  // picnic tables
  for (const [x, z] of [[12, 1], [16, 6], [12, 11]]) { const T = w.tf(x, 0, z, 0.2); T.slab('m', 0x8b5a2b, 0, 0.75, 0, 2.2, 0.1, 0.9, 0.03); T.box('m', 0x8b5a2b, 0, 0.42, -0.75, 2.2, 0.08, 0.32, 0.03); T.box('m', 0x8b5a2b, 0, 0.42, 0.75, 2.2, 0.08, 0.32, 0.03); [-0.9, 0.9].forEach((a) => T.box('x', 0x4b5563, a, 0, 0, 0.1, 0.75, 1.6, 0.03)); T.solid(-1.1, 0, -0.95, 1.1, 0.85, 0.95); T.box('f', 0xffffff, 0.4, 0.85, 0, 0.5, 0.06, 0.5, 0.02); }
  // snowrats
  for (const [x, z] of [[-6, -6], [6, 28], [-18, 10]]) { w.add('f', sph(14), 0xffffff, x, 0.45, z, 0, 0, 0, 0.55); w.add('f', sph(14), 0xffffff, x, 1.15, z, 0, 0, 0, 0.38); w.add('f', sph(10), 0xffffff, x - 0.2, 1.55, z, 0, 0, 0, 0.16); w.add('f', sph(10), 0xffffff, x + 0.2, 1.55, z, 0, 0, 0, 0.16); w.add('g', cone(8), 0xf97316, x, 1.2, z + 0.35, PI / 2, 0, 0, 0.07, 0.3, 0.07); w.add('g', torus(0.3, 12), 0xef4444, x, 0.88, z, PI / 2, 0, 0, 0.36, 0.36, 0.36); w.solid(x - 0.5, 0, z - 0.5, x + 0.5, 1.5, z + 0.5); }
  // lamp posts with string lights between
  for (const [x, z] of [[-8, -10], [8, -10], [-8, 30], [8, 30], [-20, 10], [20, 10]]) { K.lampPost(w, x, z); L(x, 4.0, z, 0xffe4b5, 16, 12); }
  lightString(w, -8, -10, 8, -10, 3.9); lightString(w, -8, 30, 8, 30, 3.9); lightString(w, -8, -10, -8, 30, 3.9); lightString(w, 8, -10, 8, 30, 3.9);
  // west lawn garden & east lawn junk pile (cover from searchlights)
  for (const [x, z] of [[-29, 0], [-28, 18], [-31, 26]]) K.tree(w, x, z, 0.9, 1);
  for (const [x, z, s] of [[28.5, 4, 1.0], [31, 17, 1.2], [27, 25, 0.9]]) { K.crate(w, x, 0, z, s, 0x78716c); K.crate(w, x + 0.9, 0, z + 0.4, s * 0.8, 0x57534e); }

  // ================= CELL BLOCK A (+ Tortoise Wing) =================
  const bCB = shell(w, { id: 'cells', name: '🔒 Cell Block A', x0: -33, z0: -41, x1: -11, z1: -17, h: 5.0, wall: 0x64748b, trim: 0xb91c1c, roof: 0x1e293b, floor: 'tile', fc1: 0x94a3b8, fc2: 0x7c8798, doors: [{ side: 'e', at: -29, w: 3.0 }], win: { n: 0, s: 2, e: 1, w: 0 } });
  onSide(w, bCB, 'e', () => { K.sign3d(w, 'CELL BLOCK A', -10.7, 4.0, -29, PI / 2, 0.34, 0xfde68a, 0x1e293b); wreath(w, 'z', -10.75, -29, 3.55, 1); });
  w.region = 'in_cells';
  const cellZ = [-40.75, -36.05, -31.35, -26.65, -21.95, -17.25], cellC = [-38.4, -33.7, -29.0, -24.3, -19.6];
  for (let i = 1; i < 5; i++) part(w, bCB, 'x', cellZ[i], -32.75, -27.1, [], 0xcbd5e1, 3.2);
  w.region = 'in_cells';
  const cellDoors = [];
  bars(w, 'z', -27, -40.6, -17.4, 3.2, 0x475569, cellC.map((c) => [c - 0.9, c + 0.9]));
  const inmates = ['brownie', 'ginger', null, 'cocoa', 'cream'];
  cellC.forEach((c, i) => { bunk(w, -31.6, c - 1.2, 0); toilet(w, -32.4, c + 1.6, PI / 2);
    w.add('f', rbox(1.0, 0.04, 0.7, 0.02), 0x1d4ed8, -29.5, 0.08, c + 0.6);
    txt(w, 'A-' + (i + 1), -26.85, 3.45, c, PI / 2, 0.22, 0xfde68a, 'l', 0.4);
    cellDoors.push({ i, x: -27, z: c, me: i === 2 }); });
  // the trio's cell (A-3): festive poster hiding the tunnel, pin-up of the Golden Gouda, paper snowflakes
  poster(w, 'z', -32.75, -29.4, 1.5, 1.3, 1.5, 0x166534, 1, 'WINTER GOUDA FEST', 0xfde047);
  for (let k = 0; k < 5; k++) w.add('l', star(), 0xffffff, -32.7, 2.6 + (k % 2) * 0.3, -30.8 + k * 0.7, 0, PI / 2, 0, 0.12, 0.12, 0.02, 0.4);
  marks.dig = { x: -31.9, z: -29.3 }; marks.myCell = { x: -29.2, z: -29.0 }; marks.cellDoors = cellDoors; marks.inmates = inmates.map((id, i) => id && { id, x: -29.6, z: cellC[i] - 0.4 }).filter(Boolean);
  // corridor: guard desk, lockers, holiday tree, garlands
  K.desk(w, -19, -21.2, PI, { L: 2.4, D: 1.1, top: 0x334155 }); K.chair(w, -19, -20.2, PI, 0x1e293b); K.monitor(w, null, -19, 0.86, -21.2, PI, 0x38bdf8, 1);
  for (let k = 0; k < 4; k++) w.slab('x', 0x3f4d63, -11.6, 0, -24.5 + k * 0.9, 0.6, 2.1, 0.85, 0.04);
  xmasTree(w, -13, -19.2, 0.75); present(w, -14.2, -18.4, 0.4, 0xef4444); present(w, -12.1, -18.2, 0.35, 0x22c55e);
  garland(w, 'x', -40.75, -26, -11.5, 4.2, 1); garland(w, 'x', -17.25, -26, -11.5, 4.2, -1);
  clockW(w, 'x', -40.75, -19, 3.6, 1);
  for (const z of [-37, -29, -21]) { pendant(w, -21, z, 0xfde68a, 4.6); L(-21, 4.2, z, 0xffe0b0, 18, 13); }
  K.rug(w, -21, -29, PI / 2, 9, 2.0, 0x7f1d1d, 0x14532d);
  // Tortoise Wing (max shell-curity)
  bars(w, 'x', -34.6, -16.4, -11.3, 3.2, 0x0284c7, [[-14.4, -12.6]]); bars(w, 'z', -16.4, -40.6, -34.6, 3.2, 0x0284c7);
  w.region = 'in_cells';
  txt(w, 'TORTOISE WING · MAX SHELL-CURITY', -13.9, 3.55, -34.45, 0, 0.17, 0x7dd3fc, 'l', 0.5);
  w.slab('g', 0xd6b98a, -13.8, 0.0, -38, 4.6, 0.12, 5.6, 0.04, { floor: true }); // sand bed
  K.rock(w, -12.2, -40, 0.7, 0xb08a5a); K.cactus(w, -15.5, -40.2, 0.45);
  w.add('l', sph(10), 0xfde68a, -13.5, 3.0, -38, 0, 0, 0, 0.35, 0.18, 0.35, 0.7); L(-13.5, 2.8, -38, 0xffd07a, 16, 8);
  marks.tortyDoor = { x: -13.5, z: -34.6 }; marks.torty = { x: -13.5, z: -38.2 };

  // ================= CAFETERIA =================
  const bCaf = shell(w, { id: 'caf', name: '🍲 Cafeteria & Talent-Show Stage', x0: 11, z0: -41, x1: 33, z1: -17, h: 5.0, wall: 0xa8a29e, trim: 0x15803d, roof: 0x292524, floor: 'tile', fc1: 0xf5f5f4, fc2: 0xb91c1c, doors: [{ side: 'w', at: -29, w: 3.0 }], win: { n: 0, s: 2, e: 2, w: 1 } });
  onSide(w, bCaf, 'w', () => { K.sign3d(w, 'CAFETERIA', 10.7, 4.0, -29, -PI / 2, 0.34, 0xfde68a, 0x14532d); wreath(w, 'z', 10.75, -29, 3.55, -1); });
  w.region = 'in_caf';
  // serving counter with sneeze guard; kitchen behind (restricted), gap on the east end
  w.slab('x', 0x94a3b8, 21.5, 0, -36.4, 19, 1.0, 0.9, 0.05); w.add('e', rbox(19, 0.6, 0.04, 0.0), 0xc7e7ff, 21.5, 1.45, -36.0);
  for (let x = 13.5; x < 30; x += 2.2) { w.add('x', rbox(1.6, 0.12, 0.6, 0.03), 0x64748b, x, 1.02, -36.4); w.add('f', rbox(1.4, 0.06, 0.45, 0.02), [0xfbbf24, 0x84cc16, 0xf97316, 0xfef3c7][((x * 3) | 0) % 4], x, 1.1, -36.4); }
  K.sign3d(w, 'TODAY: CHEESE-LESS GRUEL (SHORTAGE!)', 21.5, 3.6, -40.6, 0, 0.24, 0xfde047, 0x7f1d1d);
  // kitchen
  w.slab('x', 0xcbd5e1, 20, 0, -39.8, 10, 0.95, 1.0, 0.04); for (let x = 16; x <= 24; x += 2.6) w.add('x', cyl(16), 0x9ca3af, x, 0.95, -39.8, 0, 0, 0, 0.4, 0.5, 0.4);
  w.slab('x', 0x334155, 28, 0, -40.2, 3.6, 1.8, 0.8, 0.04); w.add('l', rbox(3.0, 0.6, 0.04, 0.02), 0xf97316, 28, 1.1, -39.78, 0, 0, 0, 1, 1, 1, 0.5);
  marks.spoon = { x: 20.6, y: 1.05, z: -39.4 }; marks.kitchen = [12, -41, 33, -37.0];
  pendant(w, 20, -39, 0xfde68a, 4.6); L(20, 4.2, -39, 0xffe7c2, 16, 10);
  // long tables & benches
  for (const tz of [-32.5, -27.0]) for (const tx of [16.0, 25.0]) { const T = w.tf(tx, 0, tz, 0); T.slab('m', 0xd6d3d1, 0, 0.72, 0, 5.4, 0.08, 1.2, 0.03); [-2.4, 2.4].forEach((a) => T.box('x', 0x57534e, a, 0, 0, 0.12, 0.72, 0.9, 0.02)); T.solid(-2.7, 0, -0.6, 2.7, 0.8, 0.6);
    K.bench(w, tx - 1.3, tz - 1.0, 0, 0x166534); K.bench(w, tx + 1.3, tz - 1.0, 0, 0x166534); K.bench(w, tx - 1.3, tz + 1.0, PI, 0xb91c1c); K.bench(w, tx + 1.3, tz + 1.0, PI, 0xb91c1c);
    for (let k = -2; k <= 2; k += 2) K.tray(w, tx + k, 0.8, tz, 0); w.add('l', cyl(8), 0xfde68a, tx, 0.8, tz, 0, 0, 0, 0.05, 0.25, 0.05, 1.0); }
  // big tree (light strand) + presents
  xmasTree(w, 30.4, -20.4, 1.25); for (let k = 0; k < 4; k++) present(w, 28.8 + k * 0.5, -18.4 + (k % 2) * 0.3, 0.4, HOLI[(k + 2) % 5]);
  marks.lights = { x: 29.0, z: -21.4 }; L(30.4, 4.3, -20.4, 0xffe6a0, 20, 12);
  // talent-show stage
  w.slab('m', 0x7f1d1d, 17, 0, -18.6, 8, 0.6, 2.6, 0.05); w.add('m', rbox(8.4, 3.2, 0.12, 0.04), 0x991b1b, 17, 2.2, -17.5);
  K.sign3d(w, '★ WINTER GOUDA TALENT SHOW ★', 17, 4.1, -17.6, PI, 0.26, 0xfde047, 0x14532d);
  for (let k = 0; k < 7; k++) w.add('l', sph(8), HOLI[k % 5], 13.6 + k * 1.15, 0.7, -17.35, 0, 0, 0, 0.08, 0.08, 0.08, 1);
  w.add('x', cyl(8), 0x111827, 17, 0.6, -18.8, 0, 0, 0, 0.03, 1.1, 0.03); w.add('x', sph(8), 0x374151, 17, 1.75, -18.8, 0, 0, 0, 0.07);
  L(17, 4.0, -19.5, 0xff9ec5, 18, 10, true);
  // bulletin board with the Warden's holiday card (safe code clue)
  w.add('m', rbox(0.1, 1.6, 2.6, 0.03), 0x92400e, 11.3, 2.0, -22.5); w.add('f', rbox(0.06, 0.6, 0.45, 0.01), 0xdc2626, 11.38, 2.1, -22.0); w.add('f', rbox(0.06, 0.5, 0.6, 0.01), 0xfef3c7, 11.38, 2.2, -23.2); w.add('f', rbox(0.06, 0.4, 0.5, 0.01), 0x86efac, 11.38, 1.6, -22.7);
  marks.card = { x: 12.1, z: -22.3 };
  // arcade cabinet in the rec corner (bonus game)
  { const T = w.tf(31.8, 0, -31.5, -PI / 2); T.slab('m', 0x1e1b4b, 0, 0, 0, 1.0, 1.9, 0.8, 0.06); T.box('l', 0x22d3ee, 0, 1.15, 0.41, 0.8, 0.55, 0.02, 0.02, 0.6); T.box('m', 0x312e81, 0, 0.95, 0.35, 0.95, 0.12, 0.35, 0.03); T.box('l', 0xfde047, 0, 1.8, 0.38, 0.9, 0.18, 0.04, 0.02, 0.8); }
  txt(w, 'SEARCHLIGHT SNEAK', 31.35, 2.1, -31.5, -PI / 2, 0.14, 0xfde047, 'l', 0.5); marks.cabinet = { x: 30.6, z: -31.5 };
  K.vending(w, 32.3, -26.5, -PI / 2, 0x15803d); K.vending(w, 32.3, -35, -PI / 2, 0xb91c1c);
  garland(w, 'x', -17.25, 11.5, 32.5, 4.3, -1); garland(w, 'z', 32.75, -40.5, -17.5, 4.3, -1);
  for (const [x, z] of [[16, -30], [25, -30], [20.5, -24]]) { pendant(w, x, z, 0xfde68a, 4.6); L(x, 4.2, z, 0xffe7c2, 18, 13); }

  // ================= VISITATION & FRONT GATE =================
  const bVis = shell(w, { id: 'vis', name: '📞 Visitation Hall', x0: -9, z0: -41, x1: 9, z1: -27, h: 4.6, wall: 0x94a3b8, trim: 0x1d4ed8, roof: 0x1e293b, floor: 'tile', fc1: 0xe2e8f0, fc2: 0x93c5fd, doors: [{ side: 'n', at: 0, w: 2.4 }, { side: 's', at: 0, w: 3.0 }], win: { n: 0, s: 2, e: 0, w: 0 } });
  onSide(w, bVis, 's', () => { K.sign3d(w, 'VISITATION', 0, 3.7, -26.7, PI, 0.32, 0xffffff, 0x1d4ed8); });
  w.region = 'in_vis';
  // glass partition at z -34 with booths; staff door on the east end
  w.slab('m', 0x64748b, -1, 0, -34, 16, 1.0, 0.3, 0.04, { see: true });
  w.add('e', rbox(16, 2.4, 0.06, 0.0), 0xc7e7ff, -1, 2.2, -34); w.solid(-9, 1.0, -34.1, 7, 3.4, -33.9, { see: true });
  for (let x = -6; x <= 4; x += 3.3) { w.add('m', rbox(0.1, 2.4, 0.9, 0.02), 0x475569, x + 1.6, 2.2, -34); w.add('x', rbox(0.15, 0.4, 0.1, 0.03), 0x111827, x - 0.6, 1.6, -33.8); K.stool(w, x, -32.8, 0xf97316); K.stool(w, x, -35.3, 0x60a5fa); }
  marks.staffDoor = { x: 8.0, z: -34 };
  K.sign3d(w, 'STAFF ONLY', 8.0, 3.7, -33.8, PI, 0.18, 0xffffff, 0x991b1b);
  marks.visitor = [-9, -41, 9, -34.1];
  marks.candy = { x: -6.0, z: -35.6 }; marks.brie = { x: -2.7, z: -35.6 };
  marks.candyTalk = { x: -6.0, z: -32.8 }; marks.brieTalk = { x: -2.7, z: -32.8 };
  K.potPlant(w, -8.2, 0, -28, 1.0); K.potPlant(w, 8.2, 0, -28, 1.0); xmasTree(w, -7.8, -39.8, 0.6);
  garland(w, 'x', -40.6, -8.6, 8.6, 3.9, 1);
  pendant(w, -2, -36.5, 0xfde68a, 4.2); pendant(w, -2, -31, 0xfde68a, 4.2); L(-2, 3.9, -31, 0xffe7c2, 16, 10); L(-2, 3.9, -37, 0xffe7c2, 16, 10);
  w.region = 'out';
  marks.gate = { x: 3.4, z: -42.6 };
  w.slab('x', 0x1f2937, 4.6, 0, -42.7, 0.6, 1.3, 0.5, 0.04); w.add('l', rbox(0.4, 0.3, 0.02, 0.01), 0x22c55e, 4.6, 1.15, -42.44, 0, 0, 0, 1, 1, 1, 0.8);
  L(0, 4.4, -42.4, 0xffd9a0, 18, 10);

  // ================= WORKSHOP =================
  const bWk = shell(w, { id: 'work', name: '🔧 Workshop (License-Plate Press)', x0: -33, z0: 37, x1: -13, z1: 57, h: 5.0, wall: 0x78716c, trim: 0xf59e0b, roof: 0x292524, floor: 'tile', fc1: 0xa8a29e, fc2: 0x78716c, doors: [{ side: 'e', at: 47, w: 3.0 }], win: { n: 2, s: 0, e: 1, w: 0 } });
  onSide(w, bWk, 'e', () => { K.sign3d(w, 'WORKSHOP', -12.7, 4.0, 47, PI / 2, 0.34, 0x111827, 0xf59e0b); wreath(w, 'z', -12.75, 47, 3.55, 1); });
  w.region = 'in_work';
  K.labBench(w, -24, 42, 0, 5, { top: 0x92400e }); K.labBench(w, -24, 47.5, 0, 5, { top: 0x92400e }); K.labBench(w, -24, 53, PI, 5, { top: 0x92400e });
  for (const z of [42, 47.5]) for (let x = -26; x <= -22; x += 2) { w.add('m', rbox(0.6, 0.04, 0.3, 0.01), 0xfde047, x, 1.0, z); txt(w, 'RAT-' + ((x * 7 + z) & 255), x, 1.03, z, 0, 0.07, 0x111827); }
  { const T = w.tf(-17, 0, 41, 0); T.slab('x', 0x475569, 0, 0, 0, 1.8, 1.8, 1.4, 0.06); T.box('x', 0x1f2937, 0, 1.8, 0, 1.2, 0.8, 1.0, 0.05); T.box('l', 0xef4444, 0.6, 1.4, 0.71, 0.12, 0.12, 0.02, 0.02, 0.9); }
  K.conveyor(w, -17, 47, PI / 2, 5); for (let k = -1; k <= 1; k++) w.add('m', rbox(0.6, 0.04, 0.3, 0.01), 0xfde047, -17 + k * 1.3, 0.78, 47);
  K.pipes(w, 'z', -32.6, 38, 56, 4.0); for (let k = 0; k < 3; k++) K.crate(w, -31.5 + k * 1.1, 0, 38.6, 0.8, 0xb45309);
  // locked tool cabinet (wire cutters)
  { const T = w.tf(-32.2, 0, 53.5, PI / 2); T.slab('x', 0xb91c1c, 0, 0, 0, 2.0, 2.2, 0.6, 0.05); T.box('x', 0x7f1d1d, 0, 0.1, 0.31, 0.04, 2.0, 0.02, 0.01); T.box('l', 0xfde047, 0.15, 1.15, 0.32, 0.12, 0.18, 0.03, 0.02, 0.7); }
  txt(w, 'TOOLS · GUARDS ONLY', -32.5, 2.55, 53.5, PI / 2, 0.16, 0xffffff, 'l', 0.3);
  marks.cabinet3d = { x: -31.2, z: 53.5 }; marks.toolZone = [-33, 50.5, -27.5, 57];
  // sewer map on the north wall
  poster(w, 'x', 56.75, -22, 2.6, 2.4, 1.6, 0x1e3a8a, -1, 'MUNICIPAL SEWER MAP', 0x93c5fd); marks.map = { x: -22, z: 55.8 };
  // vent (Snowie's crawl to the cell-block side)
  w.add('x', rbox(0.9, 0.06, 0.9, 0.02), 0x9ca3af, -31.6, 0.09, 40.5); for (let k = -3; k <= 3; k++) w.add('m', rbox(0.8, 0.07, 0.04, 0.01), 0x374151, -31.6, 0.1, 40.5 + k * 0.11);
  xmasTree(w, -14.6, 55.3, 0.7); garland(w, 'z', -32.75, 38, 56, 4.2, 1);
  for (const [x, z] of [[-24, 44.5], [-24, 50.5], [-17, 44]]) { pendant(w, x, z, 0xfef3c7, 4.6); L(x, 4.2, z, 0xfff1d6, 18, 13); }

  // ================= LAUNDRY =================
  const bLa = shell(w, { id: 'laundry', name: '🧺 Laundry', x0: 13, z0: 37, x1: 33, z1: 57, h: 5.0, wall: 0xbae6fd, trim: 0x0369a1, roof: 0x1e293b, floor: 'tile', fc1: 0xf1f5f9, fc2: 0xbfdbfe, doors: [{ side: 'w', at: 47, w: 3.0 }], win: { n: 2, s: 0, e: 0, w: 1 } });
  onSide(w, bLa, 'w', () => { K.sign3d(w, 'LAUNDRY', 12.7, 4.0, 47, -PI / 2, 0.34, 0x0c4a6e, 0xe0f2fe); wreath(w, 'z', 12.75, 47, 3.55, -1); });
  w.region = 'in_laundry';
  for (let x = 14.5; x <= 24; x += 1.1) washer(w, x, 37.9, 0); for (let x = 14.5; x <= 24; x += 1.1) washer(w, x, 56.1, PI, 0xe2e8f0);
  { const T = w.tf(19, 0, 47, 0); T.slab('m', 0xe5e7eb, 0, 0.85, 0, 6, 0.08, 1.4, 0.03); [-2.8, 2.8].forEach((a) => T.box('x', 0x64748b, a, 0, 0, 0.12, 0.85, 1.2, 0.02)); T.solid(-3, 0, -0.7, 3, 0.95, 0.7);
    for (let k = -2; k <= 2; k++) T.box('f', [0xf97316, 0xffffff, 0xf97316, 0x60a5fa, 0xf97316][k + 2], k * 1.1, 0.93, 0, 0.8, 0.12 + (k & 1) * 0.08, 0.6, 0.05); }
  cartStatic(w, 16, 51, 0.3); cartStatic(w, 22, 43, -0.4);
  part(w, bLa, 'z', 27, 37.2, 56.8, [52.0], 0x7dd3fc, 3.4); w.region = 'in_laundry';
  K.sign3d(w, 'GUARD UNIFORMS · STAFF', 26.8, 3.0, 47, -PI / 2, 0.18, 0xffffff, 0x0369a1);
  // uniform rack (back room)
  { const T = w.tf(31.8, 0, 44, PI / 2); T.box('x', 0x94a3b8, 0, 1.9, 0, 3.0, 0.06, 0.06, 0.02); [-1.5, 1.5].forEach((a) => T.box('x', 0x94a3b8, a, 0, 0, 0.06, 1.95, 0.06, 0.02));
    for (let k = -1.2; k <= 1.2; k += 0.4) { T.box('f', 0x1e3a8a, k, 0.9, 0, 0.34, 0.95, 0.22, 0.06); T.box('l', 0xfacc15, k, 1.55, 0.12, 0.08, 0.08, 0.02, 0.01, 0.8); } T.solid(-1.6, 0, -0.3, 1.6, 2, 0.3); }
  marks.uniform = { x: 30.9, z: 44 }; marks.backRoom = [27.1, 37, 33, 57];
  // vent to the warden's office (Snowie only)
  w.add('x', rbox(0.06, 0.9, 0.9, 0.02), 0x9ca3af, 32.7, 0.6, 54.5); for (let k = -3; k <= 3; k++) w.add('m', rbox(0.07, 0.8, 0.04, 0.01), 0x374151, 32.66, 0.6, 54.5 + k * 0.11);
  marks.ventLaundry = { x: 31.9, z: 54.5 };
  lightString(w, 13.5, 40, 26.5, 40, 4.2); lightString(w, 13.5, 54, 26.5, 54, 4.2);
  for (const [x, z] of [[19, 42], [19, 52], [30, 47]]) { pendant(w, x, z, 0xe0f2fe, 4.6); L(x, 4.2, z, 0xe6f4ff, 18, 13); }

  // ================= WARDEN'S OFFICE =================
  const bWa = shell(w, { id: 'warden', name: "🎩 Warden Gorgonzola's Office", x0: -9, z0: 45, x1: 9, z1: 63, h: 5.2, wall: 0x7f1d1d, trim: 0xd4a017, roof: 0x3f0d0d, floor: 'carpet', fc1: 0x7f1d1d, fc2: 0x991b1b, doors: [{ side: 'n', at: 0, w: 2.4 }], win: { n: 2, s: 2, e: 2, w: 2 } });
  onSide(w, bWa, 'n', () => { K.sign3d(w, "WARDEN'S OFFICE", 0, 3.95, 44.7, 0, 0.3, 0xfde047, 0x3f0d0d); wreath(w, 'x', 44.75, 0, 3.4, -1); });
  w.region = 'in_warden';
  K.rug(w, 0, 55, 0, 10, 6, 0x14532d, 0xd4a017);
  K.desk(w, 0, 58.5, PI, { L: 3.6, D: 1.5, top: 0x451a03 }); K.chair(w, 0, 59.9, PI, 0x7f1d1d); K.monitor(w, null, -1.0, 0.86, 58.6, PI, 0x4ade80, 1);
  w.add('f', rbox(0.5, 0.08, 0.36, 0.02), 0xfde047, 0.8, 0.9, 58.4); marks.ledger = { x: 0.8, z: 57.3 };
  // the safe (keypad)
  { const T = w.tf(-8.1, 0, 60.5, PI / 2); T.slab('x', 0x334155, 0, 0, 0, 1.2, 1.3, 0.9, 0.06); T.add('x', cyl(16), 0xd4a017, 0, 0.75, 0.46, PI / 2, 0, 0, 0.2, 0.06, 0.2); T.box('l', 0x22c55e, 0.38, 1.0, 0.46, 0.2, 0.22, 0.02, 0.02, 0.8); }
  marks.safe = { x: -7.1, z: 60.5 };
  // fireplace with stockings
  { w.slab('m', 0x78350f, 8.3, 0, 54, 1.0, 2.4, 3.2, 0.05); w.add('m', rbox(0.5, 1.2, 1.8, 0.03), 0x111827, 7.85, 0.6, 54); w.add('l', sph(10), 0xf97316, 7.9, 0.4, 54, 0, 0, 0, 0.35, 0.3, 0.6, 1.2); L(7.4, 1.0, 54, 0xff8a3d, 18, 7, true);
    for (let k = -1; k <= 1; k++) { w.add('f', rbox(0.1, 0.5, 0.25, 0.04), [0xef4444, 0x22c55e, 0xffffff][k + 1], 7.75, 1.95, 54 + k * 0.8); } }
  xmasTree(w, 7.0, 46.8, 0.85); for (let k = 0; k < 3; k++) present(w, 5.6 + k * 0.5, 46.3, 0.38, HOLI[k]);
  poster(w, 'x', 62.75, 0, 2.7, 2.2, 1.6, 0x451a03, -1, 'WARDEN GORGONZOLA', 0xfde047);
  poster(w, 'x', 62.75, -5, 2.7, 1.8, 1.2, 0x7f1d1d, -1, 'RATITA NOW ➡', 0xffffff);
  K.filing(w, -8.3, 50, PI / 2, 0x451a03, 4); K.shelf(w, -8.4, 55, PI / 2, 2.6, 2.6, 0.5, 0x451a03);
  w.add('x', rbox(0.9, 0.06, 0.06, 0.02), 0x9ca3af, 7.5, 0.1, 61.6); marks.ventWarden = { x: 7.2, z: 61.0 };
  garland(w, 'x', 62.75, -8.5, 8.5, 4.4, -1);
  pendant(w, 0, 53, 0xfde047, 4.8); pendant(w, 0, 59, 0xfde047, 4.8); L(0, 4.4, 53, 0xffd38a, 20, 13); L(0, 4.4, 59, 0xffd38a, 18, 10);
  marks.wardenDoor = { x: 0, z: 45 };

  w.region = 'out';
  marks.zones = {
    kitchen: marks.kitchen, visitor: marks.visitor, tools: marks.toolZone, backRoom: marks.backRoom,
    warden: [-9, 45, 9, 63], gateStrip: [-36, -44, 36, -41.2], eastLawn: [24, -17, 36, 37], westLawn: [-36, -17, -24, 37],
  };
  return { spots, marks, buildings: BUILDINGS };
}
