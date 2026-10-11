// Pup Town interiors: every building is a real place, packed with props and things to do.
import * as THREE from 'three';
import * as K from './kit.js';
const { sign3d, rbox, rcyl, lathe, sph, cyl, cone, torus, capsule, tube, star, heart, blobGeo, pick, PR } = K;
const R = K.R, PI = Math.PI, FL = 0.12;
const BR = [0xff5d73, 0x4f9dff, 0x3ddc84, 0xffc93c, 0xa66bff, 0x2dd4bf, 0xff8a3d, 0xff6fcf];
const art = (w, axis, at, c, y, W, H, side, k) => PR.frame(K.scaled(w, 0, FL, 0, 0.25), axis, (at + side * 0.25) / 0.25, c / 0.25, y / 0.25, W / 0.25, H / 0.25, side, k);
const clock = (w, axis, at, c, y, side) => PR.clock(K.scaled(w, 0, FL, 0, 0.25), axis, (at + side * 0.25) / 0.25, c / 0.25, y / 0.25, side);
const hh = (n, w, x, z, s, ...a) => { const H = K.scaled(w, x, FL, z, s); return PR[n](H, 0, 0, ...a); };
const lamp = (w, x, z, c) => hh('lamp', w, x, z, 0.14, 0, 16, c || 0xffe4b5);
const plant = (w, x, z, s = 1) => hh('bigPlant', w, x, z, 0.12 * s);
const chair = (w, x, z, ry, col) => K.chair(w, x, FL, z, ry, col || pick(BR));
const pendant = (w, x, y, z, c = 0xffd9a0) => { w.add('x', cyl(6), 0x334155, x, y - 0.9, z, 0, 0, 0, 0.015, 0.9, 0.015); w.add('g', cone(20), c === 0xffd9a0 ? 0x16a34a : c, x, y - 1.25, z, 0, 0, 0, 0.32, 0.38, 0.32); w.add('l', sph(10), 0xfff4d6, x, y - 1.25, z, 0, 0, 0, 0.13, 0.1, 0.13, 0.6); };
const bisc = (w, x, y, z) => w.gears.push([x, y + FL, z]);
// treats (used in the bakery + elsewhere)
function treat(w, x, y, z, k, c) { const C = c || pick([0xff8fc8, 0xfef3c7, 0x8b5a2b, 0x86efac, 0x93c5fd, 0xffd23f]);
  if (k === 0) { w.add('m', capsule(10), 0xe8b06a, x, y + 0.05, z, 0, 0, PI / 2, 0.07, 0.14, 0.07); [-1, 1].forEach((s) => [-1, 1].forEach((t) => w.add('m', sph(8), 0xe8b06a, x + s * 0.1, y + 0.05, z + t * 0.035, 0, 0, 0, 0.05))); w.add('g', capsule(8), C, x, y + 0.09, z, 0, 0, PI / 2, 0.04, 0.12, 0.02); }
  else if (k === 1) { w.add('m', rcyl(0.11, 0.1, 0.03, 16), 0xf3c58b, x, y, z); w.add('g', sph(12), C, x, y + 0.12, z, 0, 0, 0, 0.12, 0.08, 0.12); w.add('g', sph(8), 0xef4444, x, y + 0.21, z, 0, 0, 0, 0.03); }
  else if (k === 2) { w.add('g', torus(0.45, 20), 0xd9a066, x, y + 0.05, z, PI / 2, 0, 0, 0.11, 0.11, 0.12); w.add('g', torus(0.42, 20), C, x, y + 0.08, z, PI / 2, 0, 0, 0.11, 0.11, 0.07); }
  else { w.add('m', rcyl(0.12, 0.05, 0.02, 16), 0xe8b06a, x, y, z); [-1, 0, 1].forEach((s) => w.add('m', sph(8), 0xe8b06a, x + s * 0.08, y + 0.03, z + 0.12 - Math.abs(s) * 0.03, 0, 0, 0, 0.045, 0.03, 0.045)); w.add('g', rcyl(0.07, 0.02, 0.01, 12), C, x, y + 0.05, z); } }
export { treat };
export function interiors(w) { hall(w); library(w); barkade(w); bakery(w); groomer(w); fire(w); garden(w); candyHouse(w); }
// ------------------------------------------------------------------------------------------------ TOWN HALL
function hall(w) { w.region = 'hall'; const I = w.I;
  K.rug(w, 0, -31.5, 0, 2.6, 10, 0xb91c1c, 0xdc2626); // red carpet
  // stage
  w.slab('m', 0x9a6a42, 0, FL, -40.1, 13, 0.6, 3.4, 0.08); for (let i = 0; i < 2; i++) w.slab('m', 0xb07a45, 0, FL, -38.1 + i * 0.4, 4, 0.2 + (1 - i) * 0.2, 0.4, 0.04); w.add('f', rbox(13, 0.04, 3.2, 0.02), 0x991b1b, 0, FL + 0.62, -40.1);
  { const T = w.tf(0, FL + 0.6, -40.2, 0); T.slab('m', 0x7c4a1e, 0, 0, 0, 2.6, 1.1, 1.0, 0.08); T.box('x', 0xd4a017, 0, 0.5, 0.51, 1.2, 0.35, 0.02, 0.05); T.add('g', heart(), 0xff4fa0, 0, 0.67, 0.53, 0, 0, 0, 0.12, 0.12, 0.04); T.box('m', 0xffffff, -0.6, 1.1, 0, 0.4, 0.02, 0.3, 0.01); T.add('x', rcyl(0.06, 0.16, 0.01, 12), 0xd4a017, 0.7, 1.1, -0.1); T.add('l', sph(10), 0xffd23f, 0.7, 1.4, -0.1, 0, 0, 0, 0.08, 0.08, 0.08, 0.3); }
  { const T = w.tf(-2.6, FL + 0.6, -41.1, 0); T.box('f', 0xdc2626, 0, 0, 0, 0.12, 0.01, 0.12, 0.02); } sign3d(w, 'PUP TOWN  EST. 1923', 0, 4.4, -41.6, 0, 0.32, 0xd4a017, 0x7f1d1d);
  [-4.8, 4.8].forEach((x, i) => { w.add('x', cyl(8), 0xd4a017, x, FL + 0.6, -41.2, 0, 0, 0, 0.05, 3.2, 0.05); w.add('f', rbox(0.04, 1.5, 1.0, 0.02), i ? 0x3b82f6 : 0xff4fa0, x, FL + 3.0, -40.7); w.add('x', sph(8), 0xd4a017, x, FL + 3.85, -41.2, 0, 0, 0, 0.1); });
  // the EMPTY Golden Bone display: pedestal + glass dome + velvet ropes
  { const x = 0, z = -34.2; w.add('m', lathe([[0, 0], [0.75, 0], [0.75, 0.15], [0.5, 0.3], [0.45, 1.05], [0.65, 1.15], [0.65, 1.3], [0, 1.3]], 28, 'ped'), 0xfff7ee, x, FL, z); w.add('f', rcyl(0.5, 0.05, 0.02, 24), 0x7f1d1d, x, FL + 1.3, z);
    w.add('e', lathe([[0.55, 0], [0.56, 0.4], [0.45, 0.75], [0.25, 0.92], [0, 0.97]], 28, 'dome'), 0xe0f7ff, x, FL + 1.32, z); w.solid(x - 0.7, FL, z - 0.7, x + 0.7, FL + 2.2, z + 0.7);
    const posts = [[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]]; posts.forEach(([a, b]) => { w.add('x', rcyl(0.18, 0.06, 0.02, 16), 0xd4a017, x + a, FL, z + b); w.add('x', cyl(10), 0xd4a017, x + a, FL, z + b, 0, 0, 0, 0.04, 0.95, 0.04); w.add('x', sph(10), 0xd4a017, x + a, FL + 0.98, z + b, 0, 0, 0, 0.07); });
    for (let i = 0; i < 4; i++) { const [a, b] = posts[i], [c, d] = posts[(i + 1) % 4]; if (i === 2) continue; w.add('f', tube([[x + a, FL + 0.9, z + b], [x + (a + c) / 2, FL + 0.62, z + (b + d) / 2], [x + c, FL + 0.9, z + d]], 0.04, 12, 6), 0xb91c1c, 0, 0, 0); }
    sign3d(w, 'THE GOLDEN BONE', x, FL + 0.55, z + 0.78, 0, 0.09, 0xd4a017, 0x7f1d1d); w.spots.bonePed = [x, FL + 1.45, z];
    // glittery tiny paw prints leading from the case towards the door
    for (let i = 0; i < 9; i++) { const pz = z + 1.4 + i * 0.85, px = x + 0.9 + Math.sin(i * 1.7) * 0.3 + (i % 2 ? 0.14 : -0.14); w.add('l', sph(8), 0xffd23f, px, FL + 0.035, pz, 0, 0, 0, 0.08, 0.012, 0.1, 0.4); [-1, 0, 1].forEach((k) => w.add('l', sph(6), 0xffd23f, px + k * 0.06, FL + 0.035, pz - 0.12 - Math.abs(k) * 0.0, 0, 0, 0, 0.03, 0.01, 0.03, 0.4)); }
    I({ kind: 'clue', id: 'clue_case', x, y: FL, z: z + 1.6, r: 2.0, label: '🔍 Inspect the empty display case' }); }
  // pews
  for (let r = 0; r < 4; r++) [-1, 1].forEach((s) => { const T = w.tf(s * 4.4, FL, -28.4 - r * 2.2, PI); T.slab('m', 0x9a6a42, 0, 0, 0, 4.4, 0.5, 0.7, 0.06); T.box('m', 0x7c4a1e, 0, 0.5, -0.32, 4.4, 0.6, 0.12, 0.05); T.box('f', 0xb91c1c, 0, 0.5, 0, 4.2, 0.06, 0.6, 0.03); });
  // portraits of past mayors (raised 3D dog faces in gold frames)
  const portrait = (axis, at, c, side, fur, ear) => { const T = axis === 'z' ? w.tf(at, FL + 2.4, c, side > 0 ? PI / 2 : -PI / 2) : w.tf(c, FL + 2.4, at, 0); T.box('x', 0xd4a017, 0, 0, 0.05, 1.3, 1.6, 0.12, 0.06); T.box('m', 0x1e3a8a, 0, 0.1, 0.12, 1.05, 1.35, 0.02, 0.01);
    T.add('f', sph(16), fur, 0, 0.82, 0.16, 0, 0, 0, 0.3, 0.28, 0.12); T.add('f', sph(12), 0xffffff, 0, 0.72, 0.24, 0, 0, 0, 0.15, 0.1, 0.08); T.add('g', sph(8), 0x111111, 0, 0.77, 0.32, 0, 0, 0, 0.04); [-1, 1].forEach((s) => { T.add('g', sph(8), 0x111111, s * 0.1, 0.88, 0.27, 0, 0, 0, 0.035); T.add('f', ear ? cone(10) : sph(10), fur, s * 0.24, ear ? 1.05 : 0.78, 0.14, 0, 0, -s * 0.3, ear ? 0.1 : 0.1, ear ? 0.22 : 0.2, 0.05); });
    T.add('g', sph(12), 0x1f2937, 0, 0.32, 0.16, 0, 0, 0, 0.42, 0.25, 0.06); T.add('x', sph(8), 0xd4a017, 0, 0.42, 0.2, 0, 0, 0, 0.05); };
  portrait('z', -8.68, -29, 1, 0xe8924a, 1); portrait('z', -8.68, -32.5, 1, 0x8a9099, 0); portrait('z', -8.68, -36, 1, 0xb8763a, 0); portrait('z', 8.68, -32.5, -1, 0xfbfbfb, 0); portrait('z', 8.68, -36, -1, 0xe9cf9e, 0);
  // clerk desk, filing cabinets, trophy case, plants, chandelier, clock, lost & found
  K.desk(w, 6.4, -29.4, -PI / 2, { top: 0x7c4a1e, leg: 0x7c4a1e, scr: 0x86efac, chair: false }); K.filing(w, 8.3, -27.2, -PI / 2, 0x94a3b8); K.filing(w, 8.3, -28.0, -PI / 2, 0x94a3b8);
  { const T = w.tf(-8.3, FL, -39.5, PI / 2); T.slab('m', 0x7c4a1e, 0, 0, 0, 2.6, 2.2, 0.6, 0.06); T.box('e', 0xdff6ff, 0, 0.1, 0.31, 2.4, 2.0, 0.02, 0.02); for (let k = 0; k < 3; k++) { T.box('m', 0x9a6a42, 0, 0.6 + k * 0.6, 0, 2.4, 0.04, 0.5, 0.01); for (let i = 0; i < 3; i++) { const p = T.P(-0.8 + i * 0.8, 0.64 + k * 0.6, 0); w.add('x', lathe([[0, 0], [0.1, 0], [0.04, 0.08], [0.04, 0.16], [0.14, 0.24], [0.15, 0.36], [0, 0.36]], 16, 'trophy'), [0xffc83d, 0xd1d5db, 0xd97706][(i + k) % 3], p[0], p[1], p[2]); } } }
  plant(w, -7.6, -27, 1.3); plant(w, 7.6, -40.6, 1.3); plant(w, -7.6, -40.6, 1.3); K.cooler(w, 8.2, -38.5);
  { const x = 0, y = 6.1, z = -32; w.add('x', cyl(8), 0xd4a017, x, y - 1.2, z, 0, 0, 0, 0.03, 1.2, 0.03); w.add('x', torus(0.08, 40), 0xd4a017, x, y - 1.6, z, PI / 2, 0, 0, 1.0, 1.0, 1.0); w.add('x', torus(0.08, 30), 0xd4a017, x, y - 1.3, z, PI / 2, 0, 0, 0.55, 0.55, 0.55);
    for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; w.add('l', sph(10), 0xfff1c1, x + Math.cos(a) * 1.0, y - 1.45, z + Math.sin(a) * 1.0, 0, 0, 0, 0.1, 0.13, 0.1, 0.6); w.add('e', sph(6), 0xffffff, x + Math.cos(a + 0.3) * 0.8, y - 1.8, z + Math.sin(a + 0.3) * 0.8, 0, 0, 0, 0.05, 0.08, 0.05); } }
  clock(w, 'x', -26, 5, 4.8, -1);
  { const T = w.tf(-7.4, FL, -27.4, 0.4); T.slab('m', 0xc9a06a, 0, 0, 0, 1.0, 0.7, 0.8, 0.06); for (let i = 0; i < 5; i++) T.add('g', [sph(10), capsule(8), torus(0.3, 16)][i % 3], pick(BR), -0.3 + (i % 3) * 0.3, 0.75, -0.15 + (i > 2 ? 0.3 : 0), 0, i, 0, 0.12, 0.12, 0.12); sign3d(w, 'LOST & FOUND', -7.25, FL + 0.3, -26.95, 0.4, 0.07, 0x7c2d12, null);
    I({ kind: 'fun', id: 'lost', x: -7.0, y: FL, z: -26.6, r: 1.6, label: '📦 Rummage in Lost & Found', msgs: ['📦 You found: one (1) squeaky pickle. Not yours.', '📦 A sock with a bite mark. Classic.', '📦 A note: "Dear Lost & Found, I lost my tail. Never mind, it was behind me. -Rascal"', '📦 A tiny party hat? Someone small is planning something…'] }); }
  bisc(w, 0, 0.8, -40.4); bisc(w, -8.3, 2.4, -39.5); }
// ------------------------------------------------------------------------------------------------ LIBRARY (+ secret nook behind a bookcase)
function library(w) { w.region = 'library'; const I = w.I;
  K.shelf(w, -24, -39.45, 0, 6, 4.2, 0.6, 0x7c4a1e); K.shelf(w, -19.6, -39.45, 0, 2.6, 4.2, 0.6, 0x7c4a1e); K.shelf(w, -31.45, -32.5, PI / 2, 6, 4.2, 0.6, 0x7c4a1e);
  K.shelf(w, -26.5, -33.5, 0, 4.4, 2.6, 0.7, 0x9a6a42); K.shelf(w, -26.5, -34.2, PI, 4.4, 2.6, 0.7, 0x9a6a42);
  // secret nook (NW corner): partitions + the sliding bookcase door (handled by the game)
  K.wall(w, 'x', -36, -32, -27.4, 4.8, 0xf3e6d0, [K.D(-31.2, -29.4, 2.8)], { th: 0.3, y: FL - 0.12, noTrim: true }); K.wall(w, 'z', -27.4, -40, -36, 4.8, 0xf3e6d0, [], { th: 0.3, noTrim: true });
  w.spots.bookcase = [-30.3, FL, -35.75]; I({ kind: 'book', x: -30.3, y: FL, z: -34.9, r: 1.8, label: '📕 Pull the odd red book' });
  { // inside the nook: treasure map table, candle, chest, armchair
    const T = w.tf(-29.6, FL, -38.6, 0); T.slab('m', 0x7c4a1e, 0, 0.7, 0, 1.4, 0.08, 0.9, 0.03); T.box('m', 0x5b3a1e, 0, 0, 0, 0.12, 0.7, 0.12, 0.03); T.box('m', 0xf5deb3, 0, 0.78, 0, 1.1, 0.01, 0.7, 0.005); T.add('g', star(), 0xef4444, 0.25, 0.8, -0.1, -PI / 2, 0, 0, 0.06, 0.06, 0.02);
    T.add('g', rcyl(0.05, 0.18, 0.01, 12), 0xffffff, -0.4, 0.78, 0.2); T.add('l', sph(8), 0xffb020, -0.4, 1.0, 0.2, 0, 0, 0, 0.03, 0.06, 0.03, 0.8);
    K.hh('trunk', w, -31.2, -37.6, 0.14, PI / 2, 0xb45309); w.lights.push({ x: -29.6, y: 2, z: -38.4, c: 0xffb020, i: 10, d: 7 }); }
  w.secrets.push({ id: 'nook', x: -29.7, y: FL, z: -38, r: 1.6, msg: '📕 Secret: the hidden reading nook! There\'s a treasure map of Paw Park' });
  // reading tables with green lamps
  [[-21.5, -36.5], [-21.5, -32.6]].forEach(([x, z]) => { K.desk(w, x, z, 0, { top: 0x9a6a42, leg: 0x7c4a1e, pc: false, chair: false, L: 2.6 }); chair(w, x - 0.6, z + 0.9, PI); chair(w, x + 0.6, z + 0.9, PI); chair(w, x, z - 0.9, 0);
    w.add('x', cyl(8), 0xd4a017, x + 0.8, FL + 0.85, z, 0, 0, 0, 0.03, 0.4, 0.03); w.add('g', sph(14), 0x16a34a, x + 0.8, FL + 1.25, z, 0, 0, 0, 0.25, 0.12, 0.14); w.add('l', sph(8), 0xfff1c1, x + 0.8, FL + 1.16, z, 0, 0, 0, 0.2, 0.04, 0.1, 0.5);
    for (let i = 0; i < 3; i++) w.add('m', rbox(0.35, 0.08, 0.5, 0.02), pick(BR), x - 0.5 + i * 0.12, FL + 0.9 + i * 0.08, z + 0.1, 0, i * 0.4, 0); });
  // fireplace + armchairs (east wall)
  { const T = w.tf(-18.5, FL, -29.8, -PI / 2); T.slab('m', 0xb4533a, 0, 0, 0, 2.6, 2.4, 0.6, 0.06); T.box('m', 0x1f1f24, 0, 0.1, 0.31, 1.5, 1.2, 0.02, 0.08); T.box('m', 0xf5f0ea, 0, 2.4, 0.05, 3.0, 0.15, 0.8, 0.04);
    for (let i = 0; i < 3; i++) T.add('m', capsule(8), 0x7c4a1e, -0.3 + i * 0.3, 0.25, 0.32, 0, i - 1, PI / 2, 0.08, 0.6, 0.08); T.add('l', cone(10), 0xff8a3d, 0, 0.35, 0.35, 0, 0, 0, 0.35, 0.6, 0.15, 0.9); T.add('l', cone(10), 0xffd23f, 0.1, 0.35, 0.4, 0, 0, 0, 0.18, 0.4, 0.1, 1.0);
    w.lights.push({ x: -19.4, y: 1, z: -29.8, c: 0xff8a3d, i: 12, d: 8 }); for (let i = 0; i < 4; i++) T.add('m', rbox(0.18, 0.28, 0.2, 0.02), pick(BR), -1.0 + i * 0.25, 2.55, 0.05); }
  K.sofa(w, -20.6, -28.4, PI, 0x7c3aed, 0x8b5cf6, 9); K.sofa(w, -20.6, -31.4, 0, 0x16a34a, 0x22c55e, 9); K.rug(w, -21, -29.9, 0, 2.6, 2.2, 0x1e3a8a, 0xfef3c7);
  // librarian desk + card catalogue + stamp (clue: checkout card)
  { const T = w.tf(-29.5, FL, -29.2, PI / 2); T.slab('m', 0x7c4a1e, 0, 0, 0, 2.8, 1.0, 0.9, 0.06); T.box('m', 0x9a6a42, 0, 1.0, 0, 2.9, 0.06, 1.0, 0.03); for (let i = 0; i < 4; i++) T.add('m', rbox(0.4, 0.1, 0.55, 0.02), pick(BR), -1.0, 1.06 + i * 0.1, 0, 0, i * 0.3, 0);
    T.add('g', rcyl(0.06, 0.12, 0.02, 12), 0xef4444, 0.4, 1.06, 0.1); T.add('m', rbox(0.25, 0.01, 0.35, 0.005), 0xfef9c3, 0.8, 1.07, 0.15); T.add('x', rcyl(0.1, 0.04, 0.01, 16), 0xd4a017, 0.1, 1.06, -0.2); }
  I({ kind: 'clue', id: 'clue_card', x: -28.6, y: FL, z: -29.2, r: 1.8, label: '🔍 Look at the checkout cards' });
  { const T = w.tf(-31.3, FL, -28.4, PI / 2); T.slab('m', 0x9a6a42, 0, 0, 0, 1.6, 1.2, 0.6, 0.05); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { T.box('m', 0xb07a45, -0.6 + c * 0.4, 0.06 + r * 0.28, 0.31, 0.34, 0.24, 0.02, 0.02); T.add('x', sph(6), 0xd4a017, -0.6 + c * 0.4, 0.2 + r * 0.28, 0.33, 0, 0, 0, 0.03); } }
  // kids corner: rug + beanbags + giant picture books
  K.rug(w, -24.5, -29.5, 0, 3.2, 2.2, 0xffd23f, 0x86efac); [[-25.6, -28.8, 0xff4fa0], [-23.4, -28.9, 0x4f9dff], [-24.5, -30.4, 0x3ddc84]].forEach(([x, z, c]) => { w.add('f', blobGeo(((x * 3) | 0) & 15, 0.12, 2), c, x, FL + 0.3, z, 0, 0, 0, 0.55, 0.32, 0.55); w.solid(x - 0.5, FL, z - 0.5, x + 0.5, FL + 0.45, z + 0.5, { cam: false }); });
  for (let i = 0; i < 3; i++) w.add('m', rbox(0.6, 0.06, 0.45, 0.02), pick(BR), -24.6 + i * 0.4, FL + 0.03, -29.4 + (i % 2) * 0.3, 0, i, 0);
  // rolling ladder + globe + plants + clock
  w.add('m', rbox(0.08, 3.6, 0.08, 0.02), 0x5b3a1e, -25.6, FL + 1.8, -38.8, 0.25, 0, 0); w.add('m', rbox(0.08, 3.6, 0.08, 0.02), 0x5b3a1e, -24.8, FL + 1.8, -38.8, 0.25, 0, 0); for (let i = 0; i < 8; i++) w.add('m', rbox(0.8, 0.05, 0.06, 0.01), 0x7c4a1e, -25.2, FL + 0.3 + i * 0.42, -38.4 + i * 0.1 - 0.45, 0.25, 0, 0);
  K.hhY('globe', w, -19.2, FL, -37.6, 0.25); plant(w, -18.8, -39, 1); plant(w, -31.2, -27.8, 1); clock(w, 'x', -40, -24, 3.6, 1);
  bisc(w, -31.45, 4.6, -32.5); bisc(w, -30.6, 1.2, -38.6); }
// ------------------------------------------------------------------------------------------------ BARKADE
function cabinet(w, x, z, ry, col, scr) { const T = w.tf(x, FL, z, ry); T.slab('g', col, 0, 0, 0, 0.95, 1.9, 0.8, 0.08); T.box('g', 0x111827, 0, 1.1, 0.36, 0.8, 0.62, 0.12, 0.04); T.box('l', scr, 0, 1.15, 0.43, 0.68, 0.5, 0.01, 0.01, 0.5);
  T.box('g', 0x1f2937, 0, 0.85, 0.48, 0.9, 0.12, 0.35, 0.04); T.add('g', sph(10), 0xef4444, -0.2, 0.98, 0.55, 0, 0, 0, 0.06); T.add('x', cyl(8), 0x111827, -0.2, 0.92, 0.55, 0, 0, 0, 0.015, 0.06, 0.015); [0xffd23f, 0x22d3ee, 0x3ddc84].forEach((c, i) => T.add('g', rcyl(0.04, 0.03, 0.01, 12), c, 0.05 + i * 0.12, 0.97, 0.52));
  T.box('l', scr, 0, 1.75, 0.38, 0.85, 0.2, 0.06, 0.03, 0.8); T.add('l', heart(), 0xffffff, 0, 1.85, 0.42, 0, 0, 0, 0.06, 0.06, 0.02, 0.5); }
function barkade(w) { w.region = 'barkade'; const I = w.I;
  // cabinets: west + east rows (two are playable)
  for (let i = 0; i < 5; i++) { cabinet(w, 18.8, -29.4 - i * 1.3, PI / 2, BR[i], [0x22d3ee, 0xff4fa0, 0xffd23f, 0x86efac, 0xa78bfa][i]); cabinet(w, 31.2, -29.4 - i * 1.3, -PI / 2, BR[i + 3], [0xffd23f, 0x86efac, 0xff4fa0, 0x22d3ee, 0xfb923c][i]); }
  w.spots.cab1 = [18.8, -32.0]; w.spots.cab2 = [31.2, -32.0];
  I({ kind: 'mg', id: 'squirrel', x: 19.9, y: FL, z: -32.0, r: 1.3, label: '🕹️ Play SQUIRREL DASH' }); I({ kind: 'mg', id: 'stack', x: 30.1, y: FL, z: -32.0, r: 1.3, label: '🕹️ Play BONE STACKER' });
  // claw machine full of plushies
  { const x = 25, z = -38.6; w.slab('g', 0xff4fa0, x, FL, z, 1.6, 1.0, 1.4, 0.1); w.add('e', rbox(1.5, 1.4, 1.3, 0.05), 0xdff6ff, x, FL + 1.7, z); w.add('g', rbox(1.6, 0.35, 1.4, 0.1), 0xff4fa0, x, FL + 2.55, z); w.add('l', rbox(1.2, 0.18, 0.05, 0.03), 0xffd23f, x, FL + 2.55, z + 0.72, 0, 0, 0, 1, 1, 1, 0.6);
    for (let i = 0; i < 14; i++) { const px = x + (R() - 0.5) * 1.2, pz = z + (R() - 0.5) * 1.0; w.add('f', sph(10), pick([0xff8fc8, 0x93c5fd, 0xfde68a, 0x86efac, 0xe8924a, 0x8a9099]), px, FL + 1.1 + R() * 0.25, pz, 0, 0, 0, 0.16, 0.14, 0.16); }
    w.add('x', cyl(6), 0xd1d5db, x, FL + 2.0, z, 0, 0, 0, 0.015, 0.36, 0.015); [0, 1, 2].forEach((k) => w.add('x', capsule(6), 0xd1d5db, x + Math.cos(k * 2.1) * 0.08, FL + 1.9, z + Math.sin(k * 2.1) * 0.08, Math.sin(k * 2.1) * 0.4, 0, -Math.cos(k * 2.1) * 0.4, 0.02, 0.14, 0.02));
    w.solid(x - 0.8, FL, z - 0.7, x + 0.8, FL + 2.7, z + 0.7); sign3d(w, 'CLAW', x, FL + 2.48, z + 0.75, 0, 0.12, 0xffffff, null);
    I({ kind: 'fun', id: 'claw', x, y: FL, z: z + 1.3, r: 1.4, label: '🧸 Try the claw machine', sfx: 'pop', msgs: ['🧸 The claw grabbed… air. Classic claw.', '🧸 You won a Candy plush! (It\'s for display. It lives here now.)', '🧸 So close! The bunny plush did a backflip out of the claw.', '🧸 You won a tiny squeaky bone! *squeak*'] }); }
  // skee-ball lanes
  for (let i = 0; i < 2; i++) { const x = 28.6 + i * 1.6, z = -37.4; const T = w.tf(x, FL, z, PI); T.add('g', rbox(1.2, 0.5, 3.4, 0.08), 0x7c3aed, 0, 0.25, 0, -0.08, 0, 0); T.box('m', 0xd4a373, 0, 0.5, 0, 0.9, 0.04, 3.0, 0.02);
    T.box('g', 0x1e1b4b, 0, 0, -1.8, 1.2, 1.8, 0.4, 0.06); for (let k = 0; k < 3; k++) T.add('g', torus(0.25, 24), [0xffd23f, 0xff4fa0, 0x22d3ee][k], 0, 0.9 + k * 0.25, -1.55, 0.3, 0, 0, 0.3 - k * 0.08, 0.3 - k * 0.08, 0.3);
    T.box('l', 0xff4fa0, 0, 1.85, -1.85, 1.0, 0.25, 0.05, 0.03, 0.6); w.solid(x - 0.6, FL, z - 2.0, x + 0.6, FL + 1.2, z + 1.7); }
  // prize counter + prize wall (NW) and the secret storeroom behind it
  { const T = w.tf(21.5, FL, -36.2, 0); T.slab('g', 0xffd23f, 0, 0, 0, 4.2, 1.05, 0.8, 0.08); T.box('e', 0xdff6ff, 0, 1.05, 0, 4.0, 0.4, 0.6, 0.03); for (let i = 0; i < 8; i++) T.add('g', [sph(8), star(), heart()][i % 3], pick(BR), -1.7 + i * 0.48, 1.25, 0, 0, i, 0, 0.1, 0.1, 0.1); sign3d(w, 'PRIZES', 21.5, FL + 1.25, -35.75, 0, 0.16, 0xff4fa0, 0xffffff); }
  { const T = w.tf(21.2, FL, -38.6, 0); T.slab('m', 0x9a6a42, 0, 0, 0, 3.6, 2.6, 0.4, 0.05); for (let k = 0; k < 3; k++) { T.box('m', 0xb07a45, 0, 0.7 + k * 0.65, 0.05, 3.6, 0.05, 0.5, 0.01); for (let i = 0; i < 6; i++) T.add('f', sph(10), pick([0xff8fc8, 0x93c5fd, 0xfde68a, 0x86efac, 0xe8924a]), -1.5 + i * 0.6, 0.9 + k * 0.65, 0.18, 0, 0, 0, 0.18, 0.18, 0.15); } }
  K.wall(w, 'z', 19.4, -40, -38.4, 4.8, 0x312e81, [], { th: 0.2, noTrim: true }); // storeroom side wall; door gap behind the counter's west end
  for (let i = 0; i < 26; i++) w.add('f', sph(10), pick([0xff8fc8, 0x93c5fd, 0xfde68a, 0x86efac, 0xe8924a, 0xfbfbfb]), 18.7 + R() * 0.5, FL + 0.2 + R() * 1.4, -39.6 + R() * 1.0, 0, 0, 0, 0.2, 0.18, 0.2);
  w.secrets.push({ id: 'plush', x: 18.9, y: FL, z: -39.2, r: 0.9, msg: '🧸 Secret: the Barkade\'s plushie mountain!' });
  // air hockey table + snack bar with popcorn machine + beanbags + neon
  { const T = w.tf(25, FL, -32.6, 0); T.slab('g', 0x1e1b4b, 0, 0, 0, 1.6, 0.85, 2.8, 0.08); T.box('g', 0xffffff, 0, 0.85, 0, 1.5, 0.04, 2.7, 0.02); T.box('l', 0x22d3ee, 0, 0.9, 0, 1.4, 0.01, 0.04, 0.005, 0.5);
    [-1, 1].forEach((s) => { T.add('g', rcyl(0.12, 0.08, 0.02, 16), s > 0 ? 0xff4fa0 : 0x22d3ee, 0, 0.9, s * 1.0); }); T.add('g', rcyl(0.07, 0.02, 0.005, 16), 0xef4444, 0.2, 0.9, 0.3);
    I({ kind: 'fun', id: 'hockey', x: 25, y: FL, z: -30.6, r: 1.4, label: '🏒 Air hockey', sfx: 'pop', msgs: ['🏒 *clack clack* GOAL! You beat… nobody. Still counts!', '🏒 The puck flew into the claw machine. It lives there now.', '🏒 Ace says rematch. Ace always says rematch.'] }); }
  { const T = w.tf(29.2, FL, -27.9, PI); T.slab('g', 0xef4444, 0, 0, 0, 2.6, 1.0, 0.7, 0.08); T.box('g', 0xffffff, 0, 1.0, 0, 2.7, 0.06, 0.8, 0.02); T.box('e', 0xfff7d6, -0.6, 1.06, 0, 0.7, 0.9, 0.6, 0.06); for (let i = 0; i < 12; i++) T.add('g', sph(6), 0xfffbe6, -0.6 + (R() - 0.5) * 0.5, 1.2 + R() * 0.5, (R() - 0.5) * 0.4, 0, 0, 0, 0.06); for (let i = 0; i < 3; i++) T.add('g', rcyl(0.07, 0.22, 0.02, 12), pick(BR), 0.4 + i * 0.25, 1.06, 0); }
  [[22, -28.4, 0xff4fa0], [23.4, -28.2, 0x22d3ee]].forEach(([x, z, c]) => { w.add('f', blobGeo(((x * 7) | 0) & 15, 0.12, 2), c, x, FL + 0.3, z, 0, 0, 0, 0.55, 0.32, 0.55); w.solid(x - 0.5, FL, z - 0.5, x + 0.5, FL + 0.45, z + 0.5, { cam: false }); });
  sign3d(w, 'HIGH SCORES', 25, 3.4, -39.7, 0, 0.22, 0x22d3ee, 0x1e1b4b, { glow: 0.6 }); for (let i = 0; i < 5; i++) w.add('l', rbox(2.4, 0.08, 0.04, 0.02), [0xffd23f, 0xd1d5db, 0xd97706, 0xffffff, 0xffffff][i], 25, 3.1 - i * 0.22, -39.7, 0, 0, 0, 1, 1, 1, 0.4);
  [[19, -27.6, 0xff4fa0], [31, -27.6, 0x22d3ee]].forEach(([x, z, c]) => w.lights.push({ x, y: 3, z: z - 1, c, i: 10, d: 9 }));
  bisc(w, 25, 2.9, -38.6); bisc(w, 31.2, 2.4, -34.6); }
// ------------------------------------------------------------------------------------------------ BONE APPETIT BAKERY
function bakery(w) { w.region = 'bakery'; const I = w.I;
  // display counter (glass case full of treats), north-south at x = -33
  { const T = w.tf(-33, FL, -8, PI / 2); T.slab('g', 0xff8fb1, 0, 0, 0, 6.6, 1.0, 1.0, 0.08); T.box('g', 0xfff7ed, 0, 1.0, 0, 6.7, 0.06, 1.1, 0.03); T.box('e', 0xdff6ff, 0, 1.06, -0.05, 6.4, 0.7, 0.9, 0.04);
    for (let r = 0; r < 2; r++) { T.box('x', 0xe5e7eb, 0, 1.08 + r * 0.32, -0.05, 6.3, 0.02, 0.8, 0.01); for (let i = 0; i < 12; i++) { const p = T.P(-2.9 + i * 0.52, 1.1 + r * 0.32, -0.15 + (i % 2) * 0.2); treat(w, p[0], p[1], p[2], (i + r) % 4); } }
    for (let i = 0; i < 6; i++) T.box('g', 0xffffff, -2.75 + i * 1.1, 0.15, 0.51, 0.9, 0.7, 0.02, 0.04); const rp = T.P(2.6, 1.06, 0.1); w.add('g', rbox(0.5, 0.35, 0.4, 0.06), 0x334155, rp[0], rp[1] + 0.18, rp[2], 0, PI / 2, 0); }
  // brick ovens + shelves along the west wall
  for (let i = 0; i < 2; i++) { const T = w.tf(-39.3, FL, -11.4 + i * 3.6, PI / 2); T.slab('m', 0xb4533a, 0, 0, 0, 2.6, 2.6, 1.2, 0.1); T.add('m', lathe([[0, 0], [1.3, 0], [1.1, 0.8], [0.6, 1.4], [0, 1.5]], 24, 'ovenTop'), 0xb4533a, 0, 2.6, 0, 0, 0, 0, 1, 0.5, 0.8);
    T.box('m', 0x1f1f24, 0, 0.7, 0.61, 1.3, 0.9, 0.02, 0.4); T.add('l', sph(12), 0xff8a3d, 0, 0.95, 0.5, 0, 0, 0, 0.5, 0.25, 0.1, 0.9); T.box('x', 0x94a3b8, 0, 0.55, 0.65, 1.5, 0.06, 0.1, 0.02); w.lights.push({ x: -38.4, y: 1, z: -11.4 + i * 3.6, c: 0xff8a3d, i: 10, d: 6 }); }
  K.shelf(w, -36.4, -13.5, 0, 3.2, 2.6, 0.6, 0xb07a45); for (let k = 1; k < 4; k++) for (let i = 0; i < 4; i++) K.hhY('breadLoaf', w, -37.6 + i * 0.75, FL + k * 0.5 + 0.06, -13.4, 0.11, 0.2 * i);
  // flour sacks, mixing bowls, rolling pins, back table
  [[-39.2, -1.2], [-38.5, -0.9], [-39.0, -2.0]].forEach(([x, z], i) => { w.add('f', blobGeo(i + 3, 0.08, 2), 0xfaf5e8, x, FL + 0.38, z, 0, i, 0, 0.36, 0.42, 0.3); w.solid(x - 0.3, FL, z - 0.3, x + 0.3, FL + 0.7, z + 0.3, { cam: false }); });
  sign3d(w, 'FLOUR', -39.05, FL + 0.45, -0.62, 0, 0.06, 0x9a6a42, null);
  for (let i = 0; i < 8; i++) { const px = -38.2 + i * 0.5 + Math.sin(i) * 0.2, pz = -1.6 + Math.cos(i * 2) * 0.2 - i * 0.05; w.add('m', sph(8), 0xffffff, px, FL + 0.02, pz, 0, 0, 0, 0.07, 0.01, 0.09); [-1, 0, 1].forEach((k) => w.add('m', sph(6), 0xffffff, px + k * 0.05, FL + 0.02, pz - 0.11, 0, 0, 0, 0.025, 0.008, 0.025)); }
  I({ kind: 'clue', id: 'clue_flour', x: -37.4, y: FL, z: -1.6, r: 1.8, label: '🔍 Look at the flour paw prints' });
  { const T = w.tf(-36.4, FL, -4.4, PI / 2); T.slab('m', 0xd4a373, 0, 0, 0, 3.0, 0.9, 1.2, 0.06); T.box('m', 0xb07a45, 0, 0, 0, 2.8, 0.1, 1.0, 0.02);
    K.hhY('bowl', w, T.P(-0.8, 0, 0)[0], FL + 0.9, T.P(-0.8, 0, 0)[2], 0.14); const p = T.P(0.4, 0.9, 0); w.add('m', capsule(10), 0xd4a373, p[0], p[1] + 0.06, p[2], 0, 0, PI / 2, 0.06, 0.5, 0.06); [-1, 1].forEach((s) => w.add('m', cyl(8), 0x9a6a42, p[0], p[1] + 0.06, p[2] + s * 0.32, PI / 2, 0, 0, 0.025, 0.12, 0.025));
    w.add('m', rcyl(0.35, 0.03, 0.01, 24), 0xfaf5e8, p[0], p[1] + 0.01, p[2] - 0.3); for (let i = 0; i < 6; i++) treat(w, p[0] + (i % 3) * 0.18 - 0.18, p[1], p[2] + 0.35 + (i > 2 ? 0.18 : 0), i % 4); }
  I({ kind: 'mg', id: 'bake', x: -35.1, y: FL, z: -4.4, r: 1.6, label: '🧁 Make treats!' });
  // customer area: tables + chairs, cake stand, cupcake tower, chalkboard menu, pendants
  [[-29.5, -12], [-29.4, -2.4], [-30.4, -7]].forEach(([x, z], i) => { K.tableR(w, x, z, 0.65, 0.8, 0xffffff, 0xd4a373); w.add('g', rcyl(0.08, 0.16, 0.02, 12), BR[i], x, FL + 0.8, z); for (let k = 0; k < 2; k++) chair(w, x + (k ? 0.95 : -0.95), z, k ? -PI / 2 : PI / 2, 0xff8fb1); treat(w, x + 0.2, FL + 0.8, z + 0.15, i % 4); });
  { const x = -31.4, z = -12.8; K.tableR(w, x, z, 0.55, 0.9, 0xfff7ed); for (let i = 0; i < 3; i++) w.add('g', rcyl(0.5 - i * 0.13, 0.32, 0.06, 32), [0xffffff, 0xff8fc8, 0xfef3c7][i], x, FL + 0.9 + i * 0.32, z); w.add('g', heart(), 0xff4fa0, x, FL + 2.05, z, 0, 0, 0, 0.12, 0.12, 0.06); w.add('l', rcyl(0.015, 0.12, 0.005, 8), 0xffffff, x + 0.1, FL + 1.86, z); w.add('l', sph(6), 0xffb020, x + 0.1, FL + 2.0, z, 0, 0, 0, 0.025, 0.04, 0.025, 1); }
  { const T = w.tf(-30.5, FL + 1.4, -0.3, PI); T.box('m', 0x7c4a1e, 0, 0, 0, 2.6, 1.6, 0.08, 0.04); T.box('m', 0x1f2937, 0, 0.08, 0.05, 2.4, 1.4, 0.02, 0.01); for (let i = 0; i < 5; i++) T.box('l', [0xffffff, 0xfda4af, 0xfde68a, 0x86efac, 0x93c5fd][i], -0.4, 1.25 - i * 0.24, 0.07, 1.2 - (i % 2) * 0.3, 0.06, 0.005, 0.01, 0.1); for (let i = 0; i < 5; i++) T.box('l', 0xffd23f, 0.85, 1.25 - i * 0.24, 0.07, 0.3, 0.06, 0.005, 0.01, 0.1); }
  sign3d(w, 'TODAY: PUPCAKES', -30.5, 3.25, -0.4, PI, 0.13, 0xff4fa0, 0xffffff);
  [[-30, -10], [-30, -4.5], [-35, -8]].forEach(([x, z]) => pendant(w, x, 4.6, z, 0xff8fb1)); plant(w, -27.8, -13.3, 1); plant(w, -27.8, -0.7, 1);
  art(w, 'x', -14, -36.5, 2.4, 1.6, 1.2, 1, 1); clock(w, 'z', -27, -11, 3.2, -1);
  bisc(w, -31.4, 2.3, -12.8); bisc(w, -39.3, 3.4, -11.4); }
// ------------------------------------------------------------------------------------------------ FLUFF & PUFF GROOMERS
function groomer(w) { w.region = 'groomer'; const I = w.I;
  // clawfoot tubs with foam
  [[-38.4, 8.4], [-38.4, 12.6]].forEach(([x, z], i) => { const T = w.tf(x, FL, z, PI / 2); T.add('g', capsule(20), 0xffffff, 0, 0.62, 0, PI / 2, 0, PI / 2, 0.9, 1.0, 0.9); T.add('g', rbox(1.7, 0.4, 0.9, 0.2), 0xffffff, 0, 0.5, 0); [-1, 1].forEach((s) => [-1, 1].forEach((t) => T.add('x', sph(8), 0xd4a017, s * 0.6, 0.12, t * 0.3, 0, 0, 0, 0.1, 0.14, 0.1)));
    for (let k = 0; k < 9; k++) T.add('e', sph(12), 0xf0f9ff, -0.6 + (k % 5) * 0.3, 1.02 + (k % 2) * 0.12, -0.2 + (k > 4 ? 0.3 : 0), 0, 0, 0, 0.22 + (k % 3) * 0.05); T.add('x', tube([[0.85, 0.8, 0], [0.95, 1.6, 0], [0.7, 1.75, 0]], 0.04, 12, 6), 0xd1d5db, 0, 0, 0); w.solid(x - 0.5, FL, z - 0.95, x + 0.5, FL + 1.1, z + 0.95);
    T.add('g', sph(10), 0xffd23f, 0.2, 1.3, 0.25, 0, 0, 0, 0.1, 0.09, 0.12); T.add('g', cone(8), 0xff8a3d, 0.2, 1.31, 0.37, PI / 2, 0, 0, 0.03, 0.06, 0.02); });
  w.spots.tub = [-38.4, FL + 0.45, 8.4];
  // grooming tables with arms + hand dryers
  [[-33.5, 9.2], [-33.5, 14.8]].forEach(([x, z], i) => { const T = w.tf(x, FL, z, PI / 2); T.slab('x', 0x94a3b8, 0, 0, 0, 0.3, 0.7, 0.3, 0.05); T.slab('g', 0x0891b2, 0, 0.7, 0, 1.6, 0.12, 0.9, 0.05); T.add('x', tube([[-0.7, 0.82, -0.35], [-0.7, 2.1, -0.35], [0, 2.3, -0.35]], 0.035, 12, 6), 0xd1d5db, 0, 0, 0);
    T.add('g', capsule(10), 0xff4fa0, 0.9, 1.0, 0.4, 0, 0, 0.6, 0.12, 0.25, 0.12); T.box('f', 0xffffff, 0.6, 0.82, -0.2, 0.4, 0.1, 0.3, 0.04); w.solid(x - 0.5, FL, z - 0.85, x + 0.5, FL + 0.82, z + 0.85); });
  I({ kind: 'mg', id: 'groom', x: -32.4, y: FL, z: 9.2, r: 1.6, label: '🛁 Groom a pup!' });
  // hood dryers (north wall) with seats
  for (let i = 0; i < 3; i++) { const x = -37.6 + i * 2.2, z = 19.0; const T = w.tf(x, FL, z, PI); T.slab('f', 0xff8fc8, 0, 0.45, 0, 0.9, 0.12, 0.8, 0.06); T.box('f', 0xff8fc8, 0, 0.55, -0.35, 0.9, 0.7, 0.12, 0.06); T.box('x', 0xd1d5db, 0, 0, 0, 0.12, 0.45, 0.12, 0.03);
    T.add('x', cyl(10), 0xd1d5db, 0, 0.6, -0.5, 0, 0, 0, 0.04, 1.0, 0.04); T.add('g', sph(16), 0xa5f3fc, 0, 1.6, -0.18, 0.5, 0, 0, 0.45, 0.4, 0.45); T.add('l', sph(8), 0x22d3ee, 0, 1.52, 0.18, 0, 0, 0, 0.05, 0.05, 0.02, 0.6); w.solid(x - 0.45, FL, z - 0.5, x + 0.45, FL + 0.6, z + 0.4, { cam: false }); }
  // shampoo shelves + mirrors with bulbs (south wall), towels, bows display
  { const T = w.tf(-35.4, FL, 6.5, 0); T.slab('m', 0xffffff, 0, 0, 0, 4.0, 2.4, 0.5, 0.05); for (let k = 0; k < 3; k++) { T.box('m', 0xe0f2fe, 0, 0.7 + k * 0.6, 0.05, 4.0, 0.04, 0.45, 0.01); for (let i = 0; i < 9; i++) { const p = T.P(-1.8 + i * 0.45, 0.74 + k * 0.6, 0.05); w.add('g', lathe([[0, 0], [0.08, 0], [0.09, 0.18], [0.04, 0.26], [0.03, 0.32], [0, 0.32]], 14, 'shampoo'), BR[(i + k) % 8], p[0], p[1], p[2]); } } }
  [[-30.2, 6.4]].forEach(([x, z]) => { const T = w.tf(x, FL, z, 0); T.box('x', 0xd4a017, 0, 1.0, 0, 1.6, 1.6, 0.06, 0.06); T.box('e', 0xe0f7ff, 0, 1.08, 0.04, 1.4, 1.44, 0.02, 0.02); for (let i = 0; i < 6; i++) T.add('l', sph(8), 0xfff6c8, -0.75 + (i % 2) * 1.5, 1.2 + ((i / 2) | 0) * 0.55, 0.06, 0, 0, 0, 0.06, 0.06, 0.04, 0.6); });
  for (let i = 0; i < 4; i++) w.add('f', rcyl(0.3, 0.12, 0.05, 20), [0xff8fc8, 0xa5f3fc, 0xffffff, 0xfde68a][i], -31.5, FL + 0.9 + i * 0.13, 6.6); w.slab('m', 0x9a6a42, -31.5, FL, 6.6, 0.9, 0.9, 0.5, 0.04);
  { const T = w.tf(-27.6, FL, 8.6, -PI / 2); T.box('m', 0xffffff, 0, 0, 0, 0.1, 2.2, 0.1, 0.02); T.box('m', 0xffffff, 0, 2.2, 0, 1.4, 0.06, 0.1, 0.02); for (let i = 0; i < 5; i++) { const x = -0.55 + i * 0.27; T.add('x', cyl(6), 0xd1d5db, x, 1.8, 0, 0, 0, 0, 0.01, 0.4, 0.01); [-1, 1].forEach((s) => T.add('g', sph(8), BR[i], x + s * 0.06, 1.75, 0.03, 0, 0, s * 0.5, 0.07, 0.045, 0.03)); } }
  // waiting area: couch, magazines, plant, rubber duck pyramid
  K.sofa(w, -28.4, 17.4, -PI / 2, 0x22d3ee, 0x67e8f9, 9); K.rug(w, -29.8, 17.2, 0, 2.2, 2.6, 0xa5f3fc, 0xffffff); plant(w, -27.9, 19.3, 1);
  for (let i = 0; i < 6; i++) { const r = i < 3 ? 0 : i < 5 ? 1 : 2, c = i < 3 ? i : i < 5 ? i - 3 : 0; w.add('g', sph(10), 0xffd23f, -30.6 + c * 0.32 + r * 0.16, FL + 0.95 + r * 0.24, 6.7, 0, 0, 0, 0.13, 0.12, 0.13); }
  // Style Station wardrobe (dress-up)
  { const T = w.tf(-39.4, FL, 17, PI / 2); T.slab('m', 0xff4fa0, 0, 0, 0, 2.2, 2.6, 0.7, 0.08); T.box('m', 0xffffff, -0.53, 0.15, 0.36, 1.0, 2.3, 0.03, 0.04); T.box('m', 0xffffff, 0.53, 0.15, 0.36, 1.0, 2.3, 0.03, 0.04); T.add('x', sph(8), 0xd4a017, -0.08, 1.3, 0.4, 0, 0, 0, 0.05); T.add('x', sph(8), 0xd4a017, 0.08, 1.3, 0.4, 0, 0, 0, 0.05);
    sign3d(w, 'STYLE STATION', ...[T.P(0, 0, 0.4)[0]], FL + 2.75, T.P(0, 0, 0.4)[2], T.ry, 0.13, 0xffffff, 0xff4fa0); }
  I({ kind: 'wardrobe', x: -38.4, y: FL, z: 17, r: 1.7, label: '👕 Style Station (outfits & hats)' });
  pendant(w, -33.5, 4.6, 12, 0x22d3ee); pendant(w, -30, 4.6, 12, 0x22d3ee); clock(w, 'z', -27, 9.5, 3.2, -1);
  bisc(w, -38.4, 1.7, 12.6); bisc(w, -35.4, 2.6, 6.5); }
// ------------------------------------------------------------------------------------------------ PUP FIRE STATION
function fire(w) { w.region = 'fire'; const I = w.I;
  // the fire truck (facing the garage door, west)
  { const T = w.tf(34.2, FL, -7, -PI / 2); T.slab('g', 0xdc2626, 0, 0.5, 0.6, 2.4, 1.7, 6.0, 0.25); T.box('g', 0xdc2626, 0, 0.5, 3.8, 2.4, 2.4, 1.8, 0.35); T.box('e', 0xbfe9ff, 0, 1.75, 4.7, 2.2, 0.9, 0.05, 0.12); [-1, 1].forEach((s) => T.box('e', 0xbfe9ff, s * 1.21, 1.75, 3.9, 0.04, 0.8, 1.2, 0.1));
    T.box('x', 0xe5e7eb, 0, 0.3, 4.75, 2.5, 0.35, 0.15, 0.08); [-1, 1].forEach((s) => { T.add('l', sph(10), 0xfff4b0, s * 0.85, 1.0, 4.72, 0, 0, 0, 0.18, 0.18, 0.06, 0.7); T.add('l', sph(10), s > 0 ? 0xff3b3b : 0x3b82f6, s * 0.6, 2.98, 3.8, 0, 0, 0, 0.16, 0.12, 0.16, 0.9); });
    for (let i = 0; i < 3; i++) [-1, 1].forEach((s) => { T.add('m', torus(0.4, 24), 0x111827, s * 1.15, 0.5, -1.8 + i * 2.0 + (i === 2 ? 0.9 : 0), 0, PI / 2, 0, 0.42, 0.42, 0.6); T.add('x', cyl(12), 0xe5e7eb, s * 1.2, 0.5, -1.8 + i * 2.0 + (i === 2 ? 0.9 : 0), 0, 0, PI / 2, 0.22, 0.12, 0.22); });
    T.box('x', 0xd1d5db, 0, 2.2, -0.2, 0.9, 0.2, 5.4, 0.05); for (let i = 0; i < 12; i++) T.box('x', 0xe5e7eb, 0, 2.38, -2.7 + i * 0.45, 0.9, 0.06, 0.08, 0.02); [-0.45, 0.45].forEach((x) => T.box('x', 0xe5e7eb, x, 2.32, -0.2, 0.08, 0.12, 5.4, 0.03));
    [-1, 1].forEach((s) => { T.box('l', 0xffd23f, s * 1.21, 0.9, 0.6, 0.02, 0.15, 5.6, 0.01, 0.4); T.add('m', rcyl(0.5, 0.5, 0.06, 24), 0xfacc15, s * 1.0, 1.3, -1.0, 0, 0, PI / 2); });
    sign3d(w, 'PUP 1', ...[T.P(1.22, 0, 0.8)[0]], FL + 1.35, T.P(1.22, 0, 0.8)[2], T.ry + PI / 2, 0.22, 0xffffff, null); T.add('x', star(), 0xffd23f, 0, 1.3, 4.78, 0, 0, 0, 0.2, 0.2, 0.08);
    I({ kind: 'fun', id: 'truck', x: 30.4, y: FL, z: -7, r: 2.2, label: '🚒 Honk the fire truck', sfx: 'honk', msgs: ['🚒 HONK HONK! Every dog in town just howled along.', '🚒 WEE-OOO! The sirens flash! (Chief says no actual fire, just vibes.)', '🚒 HONK! A squirrel outside fell off a branch. It\'s fine.'] }); }
  // fire pole + hole, lockers with helmets, boots, hose reel, extinguishers, bell, break corner
  w.add('x', cyl(14), 0xe5e7eb, 39.6, FL, -1.4, 0, 0, 0, 0.07, 5.5, 0.07); w.add('m', torus(0.2, 32), 0x7c2d12, 39.6, 5.55, -1.4, PI / 2, 0, 0, 0.7, 0.7, 0.7); w.add('m', rcyl(0.7, 0.08, 0.02, 24), 0x1f2937, 39.6, FL, -1.4); w.solid(39.5, FL, -1.5, 39.7, 5.6, -1.3, { cam: false });
  for (let i = 0; i < 6; i++) { const T = w.tf(40.4, FL, -12.8 + i * 0.9, -PI / 2); T.slab('g', 0xfacc15, 0, 0, 0, 0.82, 2.2, 0.5, 0.04); T.box('x', 0x1f2937, 0, 1.3, 0.26, 0.4, 0.04, 0.01, 0.01); T.add('g', sph(12), 0xdc2626, 0, 2.38, 0.05, 0, 0, 0, 0.26, 0.16, 0.28); T.add('g', cyl(16), 0xdc2626, 0, 2.3, 0.05, 0, 0, 0, 0.36, 0.02, 0.4);
    T.add('f', capsule(10), 0x92400e, -0.18, 0.15, 0.4, 0, 0, 0, 0.12, 0.25, 0.16); T.add('f', capsule(10), 0x92400e, 0.18, 0.15, 0.4, 0, 0, 0, 0.12, 0.25, 0.16); }
  { const x = 30, z = -1.1; w.add('x', rcyl(0.7, 0.12, 0.03, 24), 0xdc2626, x, FL + 1.0, z, PI / 2, 0, 0); w.add('m', torus(0.3, 32), 0xfacc15, x, FL + 1.0, z, 0, 0, 0, 0.55, 0.55, 0.9); w.add('x', rbox(0.2, 1.0, 0.2, 0.04), 0x64748b, x, FL + 0.5, z - 0.1); w.solid(x - 0.7, FL, z - 0.35, x + 0.7, FL + 1.7, z + 0.35); }
  [[28.2, -13.4], [28.2, -0.6]].forEach(([x, z]) => { w.add('g', rcyl(0.14, 0.55, 0.06, 16), 0xdc2626, x, FL, z); w.add('x', capsule(8), 0x111827, x + 0.1, FL + 0.6, z, 0, 0, 0.6, 0.04, 0.12, 0.04); });
  { const x = 31.5, z = -0.9; const T = w.tf(x, FL, z, PI); T.add('x', cyl(10), 0xd4a017, 0, 0, 0, 0, 0, 0, 0.06, 1.6, 0.06); T.add('x', lathe([[0, 0], [0.32, 0], [0.28, 0.12], [0.2, 0.42], [0.08, 0.52], [0, 0.54]], 24, 'bell'), 0xffc83d, 0, 1.15, 0.0, PI, 0, 0); T.add('x', sph(8), 0xd4a017, 0, 1.6, 0, 0, 0, 0, 0.06);
    w.solid(x - 0.1, FL, z - 0.1, x + 0.1, FL + 1.6, z + 0.1, { cam: false }); I({ kind: 'fun', id: 'bell', x, y: FL, z: z - 0.9, r: 1.4, label: '🔔 Ring the bell', sfx: 'bell', msgs: ['🔔 DING DING DING! Chief Sparky salutes.', '🔔 DING! Rookie Blaze slid down the pole out of habit.', '🔔 DONG? It\'s a very serious bell.'] }); }
  { K.tableR(w, 37.4, -2.2, 0.75, 0.8, 0xffffff, 0xdc2626); for (let k = 0; k < 3; k++) chair(w, 37.4 + Math.cos(k * 2.1) * 1.1, -2.2 + Math.sin(k * 2.1) * 1.1, -k * 2.1 - PI / 2, 0xdc2626); for (let i = 0; i < 3; i++) { w.add('g', rcyl(0.07, 0.14, 0.02, 12), 0xffffff, 37.2 + i * 0.2, FL + 0.8, -2.3); w.add('g', sph(6), 0x111111, 37.2 + i * 0.2, FL + 0.88, -2.23, 0, 0, 0, 0.025, 0.02, 0.01); }
    w.add('f', rcyl(0.8, 0.22, 0.12, 24), 0xdc2626, 34.6, FL, -1.2); w.add('f', rcyl(0.62, 0.16, 0.1, 24), 0xfef2f2, 34.6, FL + 0.08, -1.2); K.hh('dogBowl', w, 33.4, -0.9, 0.18, 0xdc2626, 0x9a5b2d); }
  { const T = w.tf(29.6, FL, -13.4, 0); T.slab('m', 0x7c4a1e, 0, 0, 0, 2.0, 0.8, 0.8, 0.05); T.box('m', 0x1e3a8a, -0.4, 0.8, 0, 0.5, 0.08, 0.4, 0.02); T.add('x', rcyl(0.08, 0.08, 0.02, 12), 0xd4a017, 0.4, 0.8, 0); }
  w.add('m', torus(0.22, 32), 0xfacc15, 40.4, FL + 2.8, -1.6, 0, PI / 2, 0, 0.5, 0.5, 0.6); w.add('m', torus(0.22, 32), 0xfacc15, 40.4, FL + 2.8, -1.6, 0, PI / 2, 0, 0.36, 0.36, 0.6);
  sign3d(w, 'SAFETY FIRST, SNACKS SECOND', 34, 4.4, -13.6, 0, 0.18, 0xffffff, 0xdc2626);
  bisc(w, 34.2, 3.4, -9); bisc(w, 40.4, 3.0, -8.3); }
// ------------------------------------------------------------------------------------------------ MARTINA'S GARDEN SHOP (greenhouse)
function garden(w) { w.region = 'garden'; const I = w.I;
  for (let r = 0; r < 3; r++) { const z = 8.5 + r * 3.2, x = 33; const T = w.tf(x, FL, z, 0); T.slab('m', 0x9a6a42, 0, 0.75, 0, 5.2, 0.1, 1.1, 0.03); [-2.4, 2.4].forEach((s) => [-0.45, 0.45].forEach((t) => T.box('m', 0x7c4a1e, s, 0, t, 0.1, 0.75, 0.1, 0.02)));
    for (let i = 0; i < 8; i++) { const p = T.P(-2.2 + i * 0.63, 0.85, (i % 2 ? 0.25 : -0.25)); w.add('g', lathe([[0, 0], [0.11, 0], [0.15, 0.22], [0.16, 0.24], [0, 0.24]], 16, 'gpot'), pick([0xc2410c, 0xff8fc8, 0x60a5fa, 0xfde68a]), p[0], p[1], p[2]);
      if ((i + r) % 3 === 0) { w.add('g', capsule(10), 0x3aa655, p[0], p[1] + 0.4, p[2], 0, 0, 0, 0.11, 0.3, 0.11); w.add('g', sph(8), 0xff6fcf, p[0], p[1] + 0.65, p[2], 0, 0, 0, 0.05); } else for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; w.add('g', sph(8), (i + r) % 3 === 1 ? pick([0xff5d8f, 0xffd23f, 0xa66bff, 0xffffff]) : 0x3fae5a, p[0] + Math.cos(a) * 0.07, p[1] + 0.3, p[2] + Math.sin(a) * 0.07, 0, 0, 0, 0.08); } } }
  // hanging baskets
  for (let i = 0; i < 6; i++) { const x = 29.5 + (i % 3) * 3.5, z = 9.6 + ((i / 3) | 0) * 6.4, y = 4.9; w.add('m', cyl(4), 0x9a6a42, x, y - 1.2, z, 0, 0, 0, 0.01, 1.2, 0.01); w.add('g', lathe([[0, 0], [0.2, 0.02], [0.32, 0.25], [0, 0.25]], 16, 'hb'), 0xb45309, x, y - 1.45, z);
    for (let k = 0; k < 7; k++) { const a = k / 7 * PI * 2; w.add('g', capsule(6), 0x3fae5a, x + Math.cos(a) * 0.28, y - 1.6, z + Math.sin(a) * 0.28, Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4, 0.05, 0.4, 0.05); w.add('g', sph(6), pick([0xff5d8f, 0xffffff, 0xa66bff]), x + Math.cos(a) * 0.3, y - 1.85, z + Math.sin(a) * 0.3, 0, 0, 0, 0.05); } }
  // Martina's desert corner (sand, cacti, heat lamp, rock, tortoise bed)
  { const x0 = 35, x1 = 39.6, z0 = 15, z1 = 19.6; w.add('m', rbox(x1 - x0, 0.12, z1 - z0, 0.05), 0xf3d39a, (x0 + x1) / 2, FL + 0.05, (z0 + z1) / 2); w.solid(x0, FL, z0, x1, FL + 0.11, z1, { cam: false });
    K.cactus(w, 38.8, 18.8, 0.7, FL + 0.1); K.cactus(w, 35.8, 19.0, 0.55, FL + 0.1); K.rock(w, 38.9, 16.0, 0.6, 0xd6b98b); w.add('f', rcyl(0.8, 0.18, 0.08, 24), 0x86efac, 36.4, FL + 0.11, 16.2);
    w.add('x', cyl(8), 0x334155, 39.2, FL, 15.4, 0, 0, 0, 0.04, 2.6, 0.04); w.add('x', tube([[39.2, FL + 2.6, 15.4], [38.6, FL + 2.8, 16.2]], 0.04, 6, 6), 0x334155, 0, 0, 0); w.add('x', cone(14), 0x334155, 38.6, FL + 2.5, 16.4, PI, 0, 0, 0.3, 0.3, 0.3); w.add('l', sph(10), 0xff8a3d, 38.6, FL + 2.3, 16.4, 0, 0, 0, 0.14, 0.1, 0.14, 0.9);
    w.lights.push({ x: 38, y: 2, z: 17, c: 0xffa94d, i: 12, d: 7 }); sign3d(w, "MARTINA'S CORNER", 37.3, FL + 2.7, 19.65, PI, 0.13, 0xffffff, 0xd97706); }
  // counter, register, seed racks, soil bags, wheelbarrow, sunflower barrels, watering cans
  { const T = w.tf(29.4, FL, 7.5, PI / 2); T.slab('m', 0x16a34a, 0, 0, 0, 2.6, 1.0, 0.9, 0.06); T.box('m', 0xfef9c3, 0, 1.0, 0, 2.7, 0.06, 1.0, 0.03); T.box('g', 0x334155, 0.6, 1.06, 0, 0.5, 0.3, 0.4, 0.05); T.add('g', rcyl(0.15, 0.12, 0.02, 12), 0xff8fc8, -0.5, 1.06, 0); T.add('g', sph(10), 0xffd23f, -0.5, 1.3, 0, 0, 0, 0, 0.1); }
  for (let i = 0; i < 2; i++) { const T = w.tf(27.7, FL, 17.5 - i * 1.4, -PI / 2); T.slab('m', 0xffffff, 0, 0, 0, 1.2, 1.9, 0.3, 0.04); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) T.box('m', BR[(r + c + i) % 8], -0.42 + c * 0.28, 0.25 + r * 0.42, 0.16, 0.2, 0.3, 0.02, 0.02); }
  for (let i = 0; i < 4; i++) w.add('f', rbox(0.9, 0.3, 0.55, 0.12), 0x7c4a1e, 39.2, FL + 0.15 + i * 0.3, 8.0 + (i % 2) * 0.1); w.solid(38.7, FL, 7.6, 39.7, FL + 1.2, 8.5, { cam: false });
  { const T = w.tf(37.2, FL, 7.4, 0.6); T.add('x', lathe([[0, 0], [0.6, 0.0], [0.7, 0.4], [0, 0.4]], 20, 'wb'), 0x16a34a, 0, 0.35, 0, 0, 0, 0, 1, 1, 1.4); T.add('m', sph(12), 0x4a2f1b, 0, 0.7, 0, 0, 0, 0, 0.55, 0.12, 0.75); T.add('m', torus(0.3, 16), 0x111827, 0, 0.25, 0.9, 0, PI / 2, 0, 0.25, 0.25, 0.4); [-1, 1].forEach((s) => T.add('m', cyl(6), 0x9a6a42, s * 0.35, 0.5, -0.9, -1.3, 0, 0, 0.03, 1.0, 0.03)); w.solid(36.6, FL, 6.8, 37.8, FL + 0.8, 8.0, { cam: false }); }
  [[28.2, 9.8], [28.2, 16]].forEach(([x, z]) => { w.add('m', rcyl(0.4, 0.6, 0.06, 20), 0x9a6a42, x, FL, z); for (let k = 0; k < 3; k++) { const px = x + (k - 1) * 0.2, h = 1.8 + k * 0.3; w.add('g', cyl(6), 0x2e9e45, px, FL + 0.6, z, 0, 0, 0, 0.03, h, 0.03); w.add('g', rcyl(0.22, 0.06, 0.02, 20), 0xffc928, px, FL + 0.6 + h, z + 0.05, PI / 2 - 0.3, 0, 0); w.add('m', rcyl(0.11, 0.07, 0.02, 16), 0x7c4a1e, px, FL + 0.6 + h, z + 0.09, PI / 2 - 0.3, 0, 0); } w.solid(x - 0.4, FL, z - 0.4, x + 0.4, FL + 0.6, z + 0.4, { cam: false }); });
  hh('wateringCan', w, 31.2, 18.6, 0.13, 0.4); hh('wateringCan', w, 32.2, 18.8, 0.13, -0.3); hh('gnome', w, 34.3, 19.2, 0.13, PI); hh('gnome', w, 28.4, 19.3, 0.12, PI + 0.5);
  w.lights.push({ x: 33.5, y: 4.5, z: 13, c: 0xfff4dc, i: 22, d: 16 });
  bisc(w, 33, 1.4, 14.9); bisc(w, 38.8, 2.4, 18.8); }
// ------------------------------------------------------------------------------------------------ CANDY'S HOUSE
function candyHouse(w) { w.region = 'candy'; const I = w.I;
  K.rug(w, -34, 36, 0, 5, 3.6, 0xff8fc8, 0xfff1f2);
  K.sofa(w, -34, 39.6, PI, 0xff4fa0, 0xff8fc8, 14); hh('coffeeTable', w, -34, 36.6, 0.14, 0); w.add('g', rcyl(0.08, 0.15, 0.02, 12), 0x60a5fa, -34.3, FL + 0.38, 36.6);
  { const T = w.tf(-34, FL, 32.0, 0); T.slab('m', 0xffffff, 0, 0, 0, 2.6, 0.6, 0.6, 0.05); T.box('g', 0x111827, 0, 0.6, 0, 2.2, 1.3, 0.1, 0.05); T.box('l', 0x7dd3fc, 0, 0.66, 0.06, 2.0, 1.15, 0.01, 0.02, 0.25); T.add('l', heart(), 0xff4fa0, 0, 1.25, 0.08, 0, 0, 0, 0.2, 0.2, 0.02, 0.4); T.add('l', sph(10), 0xffd23f, 0.5, 1.0, 0.08, 0, 0, 0, 0.12, 0.12, 0.02, 0.5); }
  // fireplace with stockings + photos on the mantel (east wall)
  { const T = w.tf(-28.5, FL, 36, -PI / 2); T.slab('m', 0xd6d3d1, 0, 0, 0, 2.4, 1.9, 0.5, 0.06); T.box('m', 0x1f1f24, 0, 0.1, 0.26, 1.2, 1.0, 0.02, 0.06); T.box('m', 0xffffff, 0, 1.9, 0.05, 2.7, 0.14, 0.7, 0.04); T.add('l', cone(10), 0xff8a3d, 0, 0.25, 0.28, 0, 0, 0, 0.3, 0.5, 0.12, 0.9); w.lights.push({ x: -29.2, y: 1, z: 36, c: 0xff8a3d, i: 10, d: 7 });
    for (let i = 0; i < 3; i++) { T.box('x', 0xd4a017, -0.8 + i * 0.8, 2.04, 0.0, 0.42, 0.5, 0.05, 0.03); T.box('m', [0x93c5fd, 0xfda4af, 0xfde68a][i], -0.8 + i * 0.8, 2.08, 0.03, 0.34, 0.42, 0.01, 0.01); T.add('f', sph(10), 0x8a9099, -0.8 + i * 0.8, 2.3, 0.05, 0, 0, 0, 0.09, 0.08, 0.03); T.add('f', sph(8), 0xe8eaee, -0.8 + i * 0.8, 2.22, 0.07, 0, 0, 0, 0.06, 0.05, 0.02); }
    for (let i = 0; i < 3; i++) { T.add('f', capsule(10), [0xdc2626, 0x16a34a, 0xff4fa0][i], -0.8 + i * 0.8, 1.55, 0.42, 0, 0, 0, 0.14, 0.3, 0.08); T.add('f', sph(8), 0xffffff, -0.8 + i * 0.8, 1.82, 0.42, 0, 0, 0, 0.16, 0.08, 0.1); } }
  // Candy's big pink bed + toy box + food station
  { const x = -37.8, z = 34; w.add('f', torus(0.4, 32), 0xff4fa0, x, FL + 0.25, z, PI / 2, 0, 0, 0.9, 0.9, 0.8); w.add('f', rcyl(0.85, 0.18, 0.1, 32), 0xffd1e3, x, FL, z); sign3d(w, 'CANDY', x + 0.72, FL + 0.32, z, PI / 2, 0.09, 0xffffff, null); w.spots.candyBed = [x, FL + 0.2, z]; }
  { const T = w.tf(-39.3, FL, 38.4, PI / 2); T.slab('m', 0x60a5fa, 0, 0, 0, 1.4, 0.7, 0.9, 0.08); T.box('m', 0x3b82f6, 0, 0.7, -0.35, 1.45, 0.08, 0.3, 0.03); for (let i = 0; i < 8; i++) T.add('g', [sph(8), capsule(8), torus(0.3, 16), star()][i % 4], pick(BR), -0.5 + (i % 4) * 0.33, 0.78 + (i > 3 ? 0.12 : 0), -0.05 + (i % 2) * 0.12, i, i, 0, 0.12, 0.12, 0.12); }
  K.hh('dogBowl', w, -29.2, 40.9, 0.2, 0xff4fa0, 0x9a5b2d); K.hh('dogBowl', w, -30.0, 40.9, 0.2, 0x60a5fa, 0x7dd3fc); w.add('m', rbox(1.6, 0.02, 0.6, 0.02), 0xff8fc8, -29.6, FL + 0.01, 40.9);
  K.cubicle && null; K.shelf(w, -39.4, 31.3, PI / 2, 1.6, 2.2, 0.5, 0xffffff); lamp(w, -38.8, 40.6, 0xffd1e3); hh('bigPlant', w, -28.8, 31, 0.12); art(w, 'x', 42, -36.5, 2.5, 1.4, 1.0, -1, 0); art(w, 'x', 42, -31.5, 2.5, 1.0, 1.0, -1, 2);
  bisc(w, -34, 1.8, 39.6); }
