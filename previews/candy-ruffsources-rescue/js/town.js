// Pawsville: Canine RuffSources HQ & shelter (walk-in), houses, roads, Tortuga Park, Ratita Industries Gadget Works, forest edge.
import * as THREE from 'three';
import { Batch, G, PI, solid, solidC, sign, COL } from './kit.js';
import { rng } from './util.js';
export const ROADS = { xs: [-90, -30, 30, 90], zs: [-80, -22, 22, 80], w: 10 };
export const BLOCK_X = [-60, 0, 60], BLOCK_Z = [-51, 0, 51];
export const T = { mailboxes: [], interact: [], beds: [], lights: [], spots: {}, roofs: [], signs: [], decor: {}, houses: [] };
const HOUSE_COL = [0xf9d7a8, 0xbfe3f5, 0xf5c4d0, 0xd9f2c4, 0xfff1b8, 0xe2d4f7, 0xffd0b0, 0xcde8e1];
const ROOF_COL = [0xb4533c, 0x3f5b8c, 0x6b4f3a, 0x4b6b45, 0x8a3b5e, 0x5a5f6b];
const STREET_NAMES = { '-22': 'Biscuit Ave', '22': 'Wag Blvd', '-80': 'North Bark Rd', '80': 'South Bark Rd', '-90': 'West Fetch St', '-30': 'Puppy Lane', '30': 'Paw Lane', '90': 'East Fetch St' };
let R = rng(1234);
const pick = (a) => a[Math.floor(R() * a.length)];

function addSign(parent, text, w, h, x, y, z, ry, o) { const s = sign(text, w, h, o); s.position.set(x, y, z); s.rotation.y = ry || 0; parent.add(s); T.signs.push(s); return s; }

// ---------------- roads, sidewalks, lamps ----------------
function roads(B, scene) {
  const W = ROADS.w, ext = 100;
  B.box('w', 0x6fbf52, 0, -0.3, 0, 420, 0.3, 420); // grass everywhere
  for (const z of ROADS.zs) { B.box('w', 0x3b4048, 0, 0, z, 2 * ext - 10 + W, 0.04, W); for (let x = -ext + 6; x < ext - 4; x += 6) { if (ROADS.xs.some((rx) => Math.abs(x - rx) < W / 2 + 1)) continue; B.box('w', 0xf8fafc, x, 0.04, z, 2.6, 0.01, 0.22); } }
  for (const x of ROADS.xs) { B.box('w', 0x3b4048, x, 0.002, 0, W, 0.04, 2 * ext - 30 + W); for (let z = -ext + 18; z < ext - 18; z += 6) { if (ROADS.zs.some((rz) => Math.abs(z - rz) < W / 2 + 1)) continue; B.box('w', 0xf8fafc, x, 0.04, z, 0.22, 0.01, 2.6); } }
  // crosswalk stripes at every intersection
  for (const x of ROADS.xs) for (const z of ROADS.zs) { for (let i = -2; i <= 2; i++) { B.box('w', 0xf1f5f9, x + i * 1.6, 0.045, z + W / 2 + 1.2, 0.8, 0.01, 2); B.box('w', 0xf1f5f9, x + i * 1.6, 0.045, z - W / 2 - 1.2, 0.8, 0.01, 2); B.box('w', 0xf1f5f9, x + W / 2 + 1.2, 0.045, z + i * 1.6, 2, 0.01, 0.8); B.box('w', 0xf1f5f9, x - W / 2 - 1.2, 0.045, z + i * 1.6, 2, 0.01, 0.8); } }
  // blocks: sidewalk ring + lawn + lamps + street signs
  const bxs = [-60, 0, 60], bzs = [-51, 0, 51], bw = 50, bd = { '-51': 48, '0': 34, '51': 48 };
  const rings = []; for (const bx of bxs) for (const bz of bzs) rings.push([bx, bz, bw, bd[bz]]);
  // outer ring blocks (strip outside the inner grid, inside the outer road) are lawns with trees; beyond outer roads: forest
  for (const [bx, bz, w, d] of rings) {
    B.box('m', 0xc9c4b8, bx, 0, bz, w, 0.14, d); B.box('w', 0x76c65a, bx, 0.14, bz, w - 5, 0.02, d - 5);
    B.box('m', 0x9ca3af, bx, 0, bz - d / 2 + 0.1, w, 0.16, 0.2); B.box('m', 0x9ca3af, bx, 0, bz + d / 2 - 0.1, w, 0.16, 0.2); B.box('m', 0x9ca3af, bx - w / 2 + 0.1, 0, bz, 0.2, 0.16, d); B.box('m', 0x9ca3af, bx + w / 2 - 0.1, 0, bz, 0.2, 0.16, d);
    for (const [lx, lz] of [[-w / 2 + 1, -d / 2 + 1], [w / 2 - 1, -d / 2 + 1], [-w / 2 + 1, d / 2 - 1], [w / 2 - 1, d / 2 - 1], [0, -d / 2 + 1], [0, d / 2 - 1]]) lamp(B, bx + lx, bz + lz);
  }
  // outer lawns between grid and outer roads (x 85..85 already road) - strips
  for (const s of [-1, 1]) { B.box('m', 0xc9c4b8, s * 97.5, 0, 0, 5, 0.14, 170); B.box('m', 0xc9c4b8, 0, 0, s * 87.5, 200, 0.14, 5); }
  // street name signs at a few corners
  for (const z of [-22, 22]) for (const x of [-30, 30]) { const g = new THREE.Group(); B.cyl('x', 0x475569, x + 6.5, 0, z + 6.5, 0.07, 3.2); addSign(scene, STREET_NAMES[z], 2.4, 0.5, x + 6.5, 3.0, z + 6.5, 0, { bg: '#166534', border: '#ffffff' }); addSign(scene, STREET_NAMES[x], 2.4, 0.5, x + 6.5, 2.4, z + 6.5, PI / 2, { bg: '#166534', border: '#ffffff' }); }
  // forest + hills beyond the outer roads (tidy rows, no empty void)
  for (let i = 0; i < 4; i++) { const s = i < 2 ? (i ? 1 : -1) : 0; }
  for (const s of [-1, 1]) {
    for (let t = -118; t <= 118; t += 7) { tree(B, s * (106 + R() * 2), t + R() * 2, 1.2 + R() * 0.4); tree(B, t + R() * 2, s * (96 + R() * 2), 1.2 + R() * 0.4); tree(B, s * (115 + R() * 3), t + 3, 1.5); tree(B, t + 3, s * (106 + R() * 3), 1.5); }
    B.sph('m', 0x5aa845, s * 150, -8, 0, 30, 24, 160); B.sph('m', 0x5aa845, 0, -8, s * 140, 160, 24, 30);
    solid(s * 101, -120, s * 130, 120, 0, 6); solid(-120, s * 91, 120, s * 130, 0, 6);
  }
  // wooden fence on the outer lawn edge
  for (const s of [-1, 1]) { B.box('m', 0xd6b48a, s * 100, 0.5, 0, 0.12, 0.12, 180); B.box('m', 0xd6b48a, s * 100, 0.9, 0, 0.12, 0.12, 180); B.box('m', 0xd6b48a, 0, 0.5, s * 90, 200, 0.12, 0.12); B.box('m', 0xd6b48a, 0, 0.9, s * 90, 200, 0.12, 0.12);
    for (let t = -90; t <= 90; t += 3) { B.box('m', 0xc8a070, s * 100, 0, t, 0.16, 1.1, 0.16); if (Math.abs(t) <= 100) B.box('m', 0xc8a070, t, 0, s * 90, 0.16, 1.1, 0.16); } }
}
export function lamp(B, x, z) { B.cyl('x', 0x334155, x, 0, z, 0.09, 4.2); B.box('x', 0x334155, x, 4.1, z, 0.5, 0.12, 0.5); B.sph('l', 0xfff1c1, x, 4.0, z, 0.26, 0.2, 0.26, 0.6); solidC(x, z, 0.3, 0.3, 4); }
export function tree(B, x, z, s = 1) { const tc = pick([0x3f8f3a, 0x4fa045, 0x2f7d3b, 0x5bab4a]); B.cyl('m', 0x7a5332, x, 0, z, 0.22 * s, 2.2 * s, 0, 0, 0, true); B.add('m', G.ico, tc, x, 3 * s, z, 0, R() * 3, 0, 1.6 * s, 1.5 * s, 1.6 * s); B.add('m', G.ico, tc, x + 0.5 * s, 3.9 * s, z - 0.3 * s, 0, R() * 3, 0, 1.1 * s); solidC(x, z, 0.6 * s, 0.6 * s, 4); }
function bush(B, x, z, s = 1) { B.add('m', G.ico, pick([0x3f8f3a, 0x4fa045, 0x56a84a]), x, 0.4 * s, z, 0, R() * 3, 0, 0.8 * s, 0.6 * s, 0.8 * s); }
function flowers(B, x, z, w) { for (let i = 0; i < w * 3; i++) B.sph('m', pick([0xf472b6, 0xfacc15, 0xf87171, 0xa78bfa, 0xffffff]), x - w / 2 + i / 3 + R() * 0.2, 0.32, z + (R() - 0.5) * 0.5, 0.13); }

// ---------------- houses ----------------
function house(B, cx, cz, fz, label) {
  const wc = pick(HOUSE_COL), rc = pick(ROOF_COL), w = 9, d = 7, h = 3.4, X = (l) => cx + l, Z = (l) => cz + fz * l, fr = fz > 0 ? 0 : PI;
  B.box('m', 0x8b8f99, cx, 0, cz, w + 0.4, 0.35, d + 0.4); B.box('m', wc, cx, 0.35, cz, w, h, d);
  B.add('m', G.prism, rc, cx, h + 0.35, cz, 0, PI / 2, 0, d + 1.2, 2.6, w + 1); // gable roof
  B.box('m', 0xf8fafc, cx, h + 0.25, cz, w + 0.5, 0.18, d + 0.5);
  B.box('m', 0x9a3412, X(2.6), h + 1.2, Z(-1), 0.7, 1.6, 0.7); // chimney
  B.box('g', pick([0x7c2d12, 0x1e3a8a, 0x166534, 0x9d174d]), X(-1.6), 0.35, Z(d / 2 + 0.02), 1.2, 2.2, 0.12); B.sph('x', 0xfacc15, X(-1.15), 1.4, Z(d / 2 + 0.1), 0.06);
  B.box('m', 0xffffff, X(-1.6), 2.55, Z(d / 2 + 0.2), 1.8, 0.12, 0.6); // little porch roof
  for (const lx of [1.4, 3.2]) { B.box('m', 0xffffff, X(lx), 1.2, Z(d / 2 + 0.03), 1.3, 1.3, 0.1); B.box('g', 0x9fd3f2, X(lx), 1.3, Z(d / 2 + 0.07), 1.05, 1.1, 0.06); B.box('m', 0xffffff, X(lx), 1.82, Z(d / 2 + 0.1), 0.08, 1.1, 0.04); }
  for (const lz of [-1.5, 1.5]) for (const s of [-1, 1]) { B.box('m', 0xffffff, X(s * (w / 2 + 0.03)), 1.3, Z(lz), 0.1, 1.2, 1.2); B.box('g', 0x9fd3f2, X(s * (w / 2 + 0.07)), 1.4, Z(lz), 0.06, 1.0, 0.95); }
  B.box('m', 0xd6d3d1, X(-1.6), 0.14, Z(d / 2 + 2.2), 1.3, 0.05, 4.2); // path
  bush(B, X(-3.6), Z(d / 2 + 0.8)); bush(B, X(0.2), Z(d / 2 + 0.8), 0.8); flowers(B, X(2.6), Z(d / 2 + 0.9), 2.6);
  // mailbox at the sidewalk edge
  const mx = X(2.8), mz = Z(d / 2 + 4.2); B.cyl('m', 0x6b4f3a, mx, 0, mz, 0.07, 1.0); B.rbox('g', pick([0x2563eb, 0xdc2626, 0x111827, 0x0f766e]), mx, 1.0, mz, 0.5, 0.45, 0.75); B.box('g', 0xef4444, mx + 0.28, 1.15, mz, 0.04, 0.4, 0.08);
  solidC(cx, cz, w + 0.4, d + 0.4, 6); solidC(mx, mz, 0.4, 0.6, 1.4);
  T.mailboxes.push({ x: mx, z: mz, name: label || 'House', fz }); T.houses.push({ x: X(-1.6), z: Z(d / 2 + 4.6), name: label || 'House' });
}
function yard(B, cx, cz, w, d) { // backyard filler between rows: fences, trees, sheds, gardens
  B.box('m', 0xe7d3b1, cx, 0.5, cz, w, 0.1, 0.1); B.box('m', 0xe7d3b1, cx, 0.9, cz, w, 0.1, 0.1); for (let x = -w / 2; x <= w / 2; x += 2) B.box('m', 0xd9c09a, cx + x, 0, cz, 0.14, 1.1, 0.14);
  for (let x = -w / 2 + 5; x < w / 2 - 2; x += 8.5) { const k = Math.floor(R() * 3); if (k === 0) tree(B, cx + x, cz - d / 4 + R(), 1 + R() * 0.3); else if (k === 1) { B.box('m', 0xb45309, cx + x, 0.1, cz + d / 4, 2.4, 2, 2); B.add('m', G.prism, 0x7c2d12, cx + x, 2.1, cz + d / 4, 0, 0, 0, 2.8, 0.9, 2.4); solidC(cx + x, cz + d / 4, 2.4, 2, 3); } else { B.box('m', 0x7c4a2a, cx + x, 0.1, cz - d / 4, 3, 0.3, 1.6); for (let i = 0; i < 6; i++) B.sph('m', pick([0x16a34a, 0xef4444, 0xf97316]), cx + x - 1.2 + i * 0.5, 0.55, cz - d / 4 + (i % 2 ? 0.3 : -0.3), 0.22); }
    tree(B, cx + x + 4, cz + (R() > 0.5 ? 1 : -1) * d / 4, 0.9 + R() * 0.3); }
  solid(cx - w / 2, cz - 0.1, cx + w / 2, cz + 0.1, 0, 1.2);
}
function houseRow(B, bx, z0, fz, xs, label) { for (const lx of xs) house(B, bx + lx, z0, fz, label); }

// ---------------- post office building (HQ + branches) ----------------
export function postOffice(B, scene, o) {
  const { cx, cz, w, d, fz, hq } = o; const h = hq ? 5 : 4.2, X = (l) => cx + l, Z = (l) => cz + fz * l, fr = fz > 0 ? 0 : PI, grp = o.group || null;
  const S = (x0, z0, x1, z1, y0, y1) => solid(X(x0), Z(z0), X(x1), Z(z1), y0, y1, grp);
  const cream = 0xfdf2f8, brick = 0x9d5c3a, trim = 0xbe185d, door = hq ? 4 : 3;
  // floor
  B.box('m', 0x9ca3af, cx, 0, cz, w + 1, 0.16, d + 1);
  B.box('m', 0xe9dcc4, cx, 0.16, cz, w - 0.4, 0.02, d - 0.4);
  // walls (x-runs along local x at fixed lz; z-runs along local z)
  const wallX = (lz, a, b) => { const m = (a + b) / 2, L = b - a; B.box('m', cream, X(m), 0, Z(lz), L, h, 0.4); B.box('m', brick, X(m), 0, Z(lz), L + 0.02, 1.1, 0.44); B.box('m', trim, X(m), h - 0.4, Z(lz), L + 0.02, 0.4, 0.46); S(a, lz - 0.2, b, lz + 0.2, 0, h + 0.5); };
  const wallZ = (lx, a, b) => { const m = (a + b) / 2, L = b - a; B.box('m', cream, X(lx), 0, Z(m), 0.4, h, L); B.box('m', brick, X(lx), 0, Z(m), 0.44, 1.1, L + 0.02); B.box('m', trim, X(lx), h - 0.4, Z(m), 0.46, 0.4, L + 0.02); S(lx - 0.2, a, lx + 0.2, b, 0, h + 0.5); };
  wallX(d / 2, -w / 2, -door / 2); wallX(d / 2, door / 2, w / 2);
  if (hq) { wallX(-d / 2, -w / 2, 8); wallX(-d / 2, 14, w / 2); } else wallX(-d / 2, -w / 2, w / 2);
  wallZ(-w / 2, -d / 2, d / 2); wallZ(w / 2, -d / 2, d / 2);
  // lintel over doors
  B.box('m', cream, X(0), 3.2, Z(d / 2), door + 0.1, h - 3.2, 0.4); if (hq) { B.box('m', cream, X(11), 3.8, Z(-d / 2), 6.1, h - 3.8, 0.4); B.box('x', 0x94a3b8, X(11), 3.0, Z(-d / 2), 6, 0.8, 0.5); for (let i = 0; i < 5; i++) B.box('x', 0x64748b, X(11), 3.05 + i * 0.15, Z(-d / 2 - 0.28), 6, 0.04, 0.04); }
  // glass door frames
  for (const s of [-1, 1]) { B.box('x', 0x334155, X(s * door / 2), 0.16, Z(d / 2), 0.16, 3.04, 0.5); B.box('e', 0xbfe9ff, X(s * (door / 2 + 0.55)), 0.16, Z(d / 2 + 0.3), 1.0, 2.9, 0.06); }
  // fake windows (both faces)
  const winXs = []; for (let x = -w / 2 + 2.5; x < w / 2 - 1.5; x += 3.2) if (Math.abs(x) > door / 2 + 1.6) winXs.push(x);
  for (const lx of winXs) for (const side of [1, -1]) { const lz = d / 2 + side * 0.22; B.box('m', 0xffffff, X(lx), 1.35, Z(lz), 2.1, 1.9, 0.06); B.box('g', side > 0 ? 0x7fb8d8 : 0xbfe3f5, X(lx), 1.45, Z(lz + side * 0.03), 1.8, 1.6, 0.04); B.box('m', 0xffffff, X(lx), 2.2, Z(lz + side * 0.05), 0.08, 1.6, 0.03); }
  // roof
  const roof = new THREE.Group(); scene.add(roof); if (grp) grp.add(roof);
  const RB = new Batch(); RB.box('m', 0x64748b, cx, h, cz, w + 0.6, 0.35, d + 0.6); RB.box('m', trim, cx, h + 0.35, Z(d / 2 + 0.1), w + 0.6, 0.6, 0.3); RB.box('m', trim, cx, h + 0.35, Z(-d / 2 - 0.1), w + 0.6, 0.6, 0.3); RB.box('m', trim, X(-w / 2 - 0.15), h + 0.35, cz, 0.3, 0.6, d + 0.6); RB.box('m', trim, X(w / 2 + 0.15), h + 0.35, cz, 0.3, 0.6, d + 0.6);
  for (let i = 0; i < (hq ? 3 : 1); i++) { RB.rbox('x', 0xcbd5e1, X(-w / 4 + i * 5), h + 0.35, Z(-d / 4), 2.4, 1.3, 1.8); RB.cyl('x', 0x64748b, X(-w / 4 + i * 5), h + 1.65, Z(-d / 4), 0.6, 0.12); }
  // ceiling light panels (glow, seen from inside)
  for (let lx = -w / 2 + 3; lx < w / 2 - 1; lx += 5) for (let lz = -d / 2 + 3; lz < d / 2 - 1; lz += 5) RB.box('l', 0xfff7e0, X(lx), h - 0.06, Z(lz), 2.2, 0.05, 0.6, 0, 0.4);
  RB.finish(roof); solid(X(-w / 2 - 0.3), Z(-d / 2 - 0.3), X(w / 2 + 0.3), Z(d / 2 + 0.3), h - 0.05, h + 1, grp);
  // awning + sign
  for (let i = 0; i < 8; i++) B.box('g', i % 2 ? 0xffffff : 0xec4899, X(-door / 2 - 0.5 + i * (door + 1) / 8 + (door + 1) / 16), 3.05, Z(d / 2 + 0.9), (door + 1) / 8, 0.12, 1.6);
  const sg = addSign(grp || scene, '🐾 CANINE RUFFSOURCES · HQ & SHELTER', 11, 1.1, X(0), h - 0.9 + (hq ? 0 : 0.05), Z(d / 2 + 0.25), fr, { bg: '#9d174d', border: '#fde047', glow: 0.5 });
  // flower planters by the door
  for (const s of [-1, 1]) { B.rbox('m', 0x78716c, X(s * (door / 2 + 1.6)), 0.16, Z(d / 2 + 0.9), 1.2, 0.6, 0.8); bush(B, X(s * (door / 2 + 1.6)), Z(d / 2 + 0.9), 0.7); S(s * (door / 2 + 1.6) - 0.6, d / 2 + 0.5, s * (door / 2 + 1.6) + 0.6, d / 2 + 1.3, 0, 1); }
  // interior lights (no shadows: cheap)
  const pl = new THREE.PointLight(0xfff1d6, hq ? 42 : 26, hq ? 30 : 18, 1.8); pl.position.set(cx, h - 1, cz); (grp || scene).add(pl); T.lights.push(pl);
  if (hq) { const p2 = new THREE.PointLight(0xfff1d6, 32, 26, 1.8); p2.position.set(X(-8), h - 1, Z(-5)); scene.add(p2); T.lights.push(p2); }
  return { X, Z, S, h, fr, roof };
}
// RuffSources HQ & Shelter interior (lobby + HR office + kennels + gear shop + van bay)
function decor(scene, id) { const g = new THREE.Group(); scene.add(g); T.decor[id] = g; return g; }
function bed(B, x, z, col) { B.cyl('m', 0x8b5e34, x, 0.17, z, 0.95, 0.3); B.cyl('f', col, x, 0.32, z, 0.78, 0.16); B.add('f', G.sph, 0xfff7ed, x - 0.35, 0.5, z - 0.35, 0, 0, 0, 0.3, 0.12, 0.2); }
function bone(B, x, y, z, s, ry) { const c = Math.cos(ry), sn = Math.sin(ry); B.cyl('g', 0xfef3c7, x, y, z, 0.07 * s, 0.6 * s, 0, ry, PI / 2, false); for (const e of [-1, 1]) for (const k of [-1, 1]) B.sph('g', 0xfef3c7, x + c * e * 0.3 * s - sn * k * 0.07 * s, y, z - sn * e * 0.3 * s - c * k * 0.07 * s, 0.1 * s); }
function shelterInterior(B, scene, H) {
  const { X, Z, S, fr } = H; const I = T.interact;
  // floors: checker lobby, soft rubber kennel floor, astro-turf play patch
  for (let lx = -16; lx < 16.5; lx += 2) for (let lz = 4; lz < 12.6; lz += 2) if (((lx + lz) / 2) % 2 === 0) B.box('w', 0xfbcfe8, X(lx + 1), 0.18, Z(lz + 1), 1.98, 0.01, 1.98);
  B.box('w', 0xd6c7b0, X(0), 0.18, Z(-4.6), 33, 0.012, 16.4);
  B.box('w', 0x4ade80, X(4.5), 0.19, Z(-7.6), 8, 0.01, 7.6);
  B.box('w', 0xbe185d, X(0), 0.19, Z(11), 4, 0.01, 3.2);
  for (const lx of [-1.5, 1.5]) for (const lz of [10.2, 11.8]) B.box('w', 0xfdf2f8, X(lx) - 0.2, 0.2, Z(lz), 0.22, 0.01, 0.22); // paw rug spots
  // --- reception desk (Snowie: guest bookings for Grok Pet Party) ---
  B.rbox('g', 0xbe185d, X(-6), 0.16, Z(5.5), 9, 1.0, 1.2); B.rbox('m', 0xf5e6d3, X(-6), 1.12, Z(5.5), 9.3, 0.14, 1.4); S(-10.7, 4.8, -1.3, 6.2, 0, 1.3);
  B.rbox('x', 0x334155, X(-7.5), 1.26, Z(5.3), 0.7, 0.3, 0.5); B.box('l', 0xf472b6, X(-7.5), 1.6, Z(5.2), 0.5, 0.32, 0.03, 0, 0.4); B.box('x', 0x1f2937, X(-7.5), 1.26, Z(5.3), 0.05, 0.36, 0.05);
  B.cyl('x', 0x111827, X(-4), 1.26, Z(5.4), 0.05, 0.5); B.sph('x', 0x6b7280, X(-4), 1.8, Z(5.4), 0.12); // Pet Party mic
  bone(B, X(-9.6), 1.32, Z(5.7), 0.8, 0.4); B.cyl('g', 0x60a5fa, X(-2.4), 1.26, Z(5.6), 0.22, 0.25);
  addSign(scene, 'RECEPTION · 📺 GROK PET PARTY GUEST BOOKINGS', 6.4, 0.6, X(-6), 3.3, Z(5.5), fr, { bg: '#9d174d' });
  I.push({ x: X(-6), z: Z(7.2), r: 1.9, label: '📺 Book a Grok Pet Party guest', kind: 'party' });
  T.spots.snowie = { x: X(-6), z: Z(4.1), yaw: fr };
  // waiting benches, plants, leash hooks
  for (const lx of [-12, -8]) { B.rbox('m', 0xb07a45, X(lx), 0.55, Z(12.2), 2.6, 0.14, 0.7); for (const s of [-1, 1]) B.box('x', 0x334155, X(lx + s * 1.1), 0.16, Z(12.2), 0.1, 0.4, 0.6); B.rbox('m', 0xb07a45, X(lx), 0.7, Z(12.6), 2.6, 0.6, 0.12); S(lx - 1.3, 11.8, lx + 1.3, 12.8, 0, 1); }
  for (const [lx, lz] of [[-15.8, 12.2], [15.8, 12.2], [7.6, 12.3], [2.8, 12.3], [-15.8, -12.2], [-2.5, 3.6]]) { B.cyl('g', 0xf8fafc, X(lx), 0.16, Z(lz), 0.38, 0.7); B.add('m', G.ico, 0x3f8f3a, X(lx), 1.25, Z(lz), 0, 0, 0, 0.6, 0.75, 0.6); S(lx - 0.4, lz - 0.4, lx + 0.4, lz + 0.4, 0, 1.6); }
  B.rbox('m', 0xf1f5f9, X(5.2), 0.16, Z(12.3), 2.6, 2.2, 0.5); for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) B.cyl('g', [0xef4444, 0x3b82f6, 0x22c55e, 0xfacc15, 0xa855f7][(r + c) % 5], X(4.3 + c * 0.45), 0.55 + r * 0.45, Z(12.05), 0.05, 0.3); S(3.9, 12, 6.5, 12.6, 0, 2.4);
  addSign(scene, 'LEASHES', 2.2, 0.5, X(5.2), 2.7, Z(12.0), fr + PI, { bg: '#be185d' });
  // --- Torty's adoption desk (left lobby) ---
  B.rbox('g', 0x65a30d, X(-14.4), 0.16, Z(8.6), 1.2, 1.0, 4.2); B.rbox('m', 0xf5e6d3, X(-14.4), 1.12, Z(8.6), 1.4, 0.12, 4.4); S(-15.1, 6.4, -13.7, 10.8, 0, 1.3);
  for (let i = 0; i < 3; i++) B.box('x', [0xfde68a, 0xbfdbfe, 0xfbcfe8][i], X(-14.4), 1.26, Z(7.4 + i * 1.1), 0.7, 0.03, 0.5);
  B.box('m', 0x7c5a3a, X(-16.6), 0.16, Z(8.6), 0.3, 3.0, 5); addSign(scene, '🏡 ADOPTIONS\nTorty · slow & steady forever homes', 3.6, 1.2, X(-16.4), 2.2, Z(8.6), PI / 2, { bg: '#3f6212' });
  I.push({ x: X(-12.4), z: Z(8.6), r: 1.9, label: '🏡 Adopt a pup out (Torty)', kind: 'adopt' });
  T.spots.torty = { x: X(-15.6), z: Z(8.6), yaw: PI / 2 };
  // --- mission board ---
  B.box('m', 0x7c5a3a, X(3.6), 0.16, Z(4.0), 0.14, 2.2, 0.14); B.box('m', 0x7c5a3a, X(5.6), 0.16, Z(4.0), 0.14, 2.2, 0.14); B.box('m', 0xd6a46c, X(4.6), 1.0, Z(4.05), 2.4, 1.5, 0.1);
  for (let i = 0; i < 4; i++) B.box('x', [0xfef08a, 0xfecaca, 0xbfdbfe, 0xbbf7d0][i], X(3.8 + (i % 2) * 1.1), 1.25 + Math.floor(i / 2) * 0.6, Z(4.12), 0.8, 0.45, 0.02);
  S(3.4, 3.8, 5.8, 4.3, 0, 2.4); addSign(scene, '🚨 RESCUE MISSIONS', 2.6, 0.5, X(4.6), 2.75, Z(4.12), fr, { bg: '#dc2626' });
  I.push({ x: X(4.6), z: Z(5.3), r: 1.8, label: '🚨 Rescue Mission Board', kind: 'board' });
  // --- Candy's HR office (glass, right lobby) ---
  const ox0 = 9.2, oz0 = 4.8; B.box('x', 0x334155, X(ox0), 0.16, Z(oz0), 0.14, 3.2, 0.14); B.box('x', 0x334155, X(16.8), 3.2, Z(oz0), 15.2, 0.14, 0.14);
  B.box('e', 0xc7ecff, X(13), 0.16, Z(oz0), 7.6, 3.1, 0.06); S(9.2, oz0 - 0.1, 16.8, oz0 + 0.1, 0, 3.3); B.box('x', 0x334155, X(13), 3.26, Z(oz0), 7.8, 0.12, 0.12);
  B.box('e', 0xc7ecff, X(ox0), 0.16, Z(oz0 + 1.5), 0.06, 3.1, 3); S(ox0 - 0.1, oz0, ox0 + 0.1, oz0 + 3, 0, 3.3); B.box('x', 0x334155, X(ox0), 0.16, Z(oz0 + 3), 0.14, 3.2, 0.14);
  B.box('e', 0xc7ecff, X(ox0), 0.16, Z(11.6), 0.06, 3.1, 2.2); S(ox0 - 0.1, 10.5, ox0 + 0.1, 12.8, 0, 3.3); B.box('x', 0x334155, X(ox0), 0.16, Z(10.5), 0.14, 3.2, 0.14); B.box('x', 0x334155, X(ox0), 3.2, Z(8.8), 0.14, 0.14, 8);
  B.box('w', 0xf9a8d4, X(13), 0.19, Z(8.8), 6, 0.01, 6);
  B.rbox('m', 0x5b3a1e, X(13.5), 0.16, Z(9.2), 3.2, 1.0, 1.4); B.box('x', 0x111827, X(13.5), 1.16, Z(9.0), 1.2, 0.8, 0.08); B.box('l', 0x60a5fa, X(13.5), 1.24, Z(9.05), 1.05, 0.62, 0.02, 0, 0.3); S(11.9, 8.5, 15.1, 9.9, 0, 1.3);
  for (let i = 0; i < 3; i++) B.box('x', 0xf8fafc, X(12.4 + i * 0.25), 1.16, Z(9.4), 0.5, 0.04 + i * 0.03, 0.4); // HR paperwork stack
  B.rbox('f', 0xbe185d, X(13.5), 0.16, Z(7.2), 1.0, 0.9, 1.0); B.rbox('f', 0xbe185d, X(13.5), 0.9, Z(6.75), 1.0, 1.0, 0.2);
  B.rbox('m', 0x5b3a1e, X(16.2), 0.16, Z(9), 0.8, 2.6, 4); for (let i = 0; i < 3; i++) { B.box('x', [0xef4444, 0x3b82f6, 0x22c55e][i], X(16.1), 0.9 + i * 0.75, Z(7.8 + i * 1.2), 0.3, 0.5, 0.9); } S(15.8, 7, 16.8, 11, 0, 2.8);
  addSign(scene, 'CANINE RUFFSOURCES · HR DEPT', 6.2, 0.6, X(13), 2.75, Z(oz0 - 0.05), fr + PI, { bg: '#9d174d' });
  addSign(scene, 'PUPS FIRST.\nPAPERWORK SECOND.', 2.6, 1.0, X(16.55), 2.2, Z(11.6), -PI / 2, { bg: '#fdf2f8', fg: '#9d174d', border: '#be185d', glow: 0.25 });
  T.spots.luna = { x: X(11.2), z: Z(10.9), yaw: PI / 2 }; T.spots.candyDesk = { x: X(13.5), z: Z(10.6) };
  I.push({ x: X(12.4), z: Z(11.2), r: 1.6, label: '🐀 Chat with Luna', kind: 'luna' });
  // --- low kennel divider (lobby | shelter) with an open gate ---
  for (const [a, b] of [[-16.8, -2.2], [2.2, 3.2]]) { const m = (a + b) / 2; B.box('m', 0xf5e6d3, X(m), 0.16, Z(3.2), b - a, 0.9, 0.16); B.box('g', 0xec4899, X(m), 1.06, Z(3.2), b - a, 0.08, 0.22); S(a, 3.1, b, 3.3, 0, 1.1); }
  for (const lx of [-2.2, 2.2]) { B.cyl('g', 0xec4899, X(lx), 0.16, Z(3.2), 0.12, 1.4); B.sph('g', 0xfde047, X(lx), 1.6, Z(3.2), 0.16); }
  addSign(scene, '🐾 SHELTER · NAP ZONE', 3.2, 0.5, X(0), 2.4, Z(3.2), fr, { bg: '#be185d' });
  // --- dog beds: 12 slots (4 base + 2 upgrades of 4) ---
  const BED_COL = [0x60a5fa, 0xf472b6, 0xfacc15, 0x34d399];
  const slots = []; for (const lz of [0.6, -3.4, -7.4]) for (const lx of [-14.5, -11, -7.5, -4]) slots.push([lx, lz]);
  const gB2 = decor(scene, 'beds2'), gB3 = decor(scene, 'beds3'); const B2 = new Batch(), B3 = new Batch();
  slots.forEach(([lx, lz], i) => { const bb = i < 4 ? B : i < 8 ? B2 : B3; bed(bb, X(lx), Z(lz), BED_COL[i % 4]); bb.cyl('x', 0x94a3b8, X(lx + 1.05), 0.17, Z(lz + 0.7), 0.24, 0.12); bb.cyl('e', 0x7dd3fc, X(lx + 1.05), 0.26, Z(lz + 0.7), 0.19, 0.03);
    T.beds.push({ x: X(lx), z: Z(lz), i }); });
  // empty spots for future beds: tidy floor mats
  slots.slice(4).forEach(([lx, lz]) => B.box('w', 0xe7dccb, X(lx), 0.185, Z(lz), 2.0, 0.01, 2.0));
  B2.finish(gB2); B3.finish(gB3);
  // name plaques row on the left wall
  addSign(scene, '🛏️ NAP ROW · shh, pups resting', 4, 0.6, X(-16.75), 2.6, Z(-3.4), PI / 2, { bg: '#1e3a8a' });
  // --- bone table (upgrade) ---
  { const g = decor(scene, 'bonetable'), BT = new Batch(); BT.rbox('m', 0xb07a45, X(1.2), 0.75, Z(-1.5), 2.4, 0.14, 1.3); for (const sx of [-1, 1]) for (const sz of [-1, 1]) BT.box('m', 0x7c5a3a, X(1.2 + sx), 0.16, Z(-1.5 + sz * 0.5), 0.12, 0.6, 0.12);
    for (let i = 0; i < 5; i++) bone(BT, X(0.4 + i * 0.4), 0.98, Z(-1.5 + (i % 2) * 0.3 - 0.15), 0.9, i * 0.7); BT.finish(g); solid(X(0), Z(-2.2), X(2.4), Z(-0.8), 0, 1.1, g);
    addSign(g, '🦴 BONE TABLE', 1.8, 0.4, X(1.2), 1.6, Z(-0.82), fr, { bg: '#b45309' }); }
  // --- treat machine (upgrade) ---
  { const g = decor(scene, 'treat'), TM = new Batch(); TM.rbox('g', 0xdc2626, X(15.6), 0.16, Z(-1.2), 1.3, 1.0, 1.1); TM.sph('e', 0xe0f2fe, X(15.6), 1.75, Z(-1.2), 0.62); TM.cyl('g', 0xdc2626, X(15.6), 2.3, Z(-1.2), 0.3, 0.2);
    for (let i = 0; i < 9; i++) TM.sph('g', [0xf59e0b, 0xb45309, 0xfde68a][i % 3], X(15.4 + (i % 3) * 0.2), 1.5 + Math.floor(i / 3) * 0.16, Z(-1.2 + ((i * 7) % 3 - 1) * 0.15), 0.1); TM.box('x', 0x111827, X(15.6 - 0.66), 0.6, Z(-1.2), 0.04, 0.3, 0.4);
    TM.finish(g); solidC(X(15.6), Z(-1.2), 1.3, 1.1, 2.4, g); addSign(g, 'TREAT-O-MATIC', 1.8, 0.4, X(14.9), 2.9, Z(-1.2), -PI / 2, { bg: '#dc2626' }); }
  I.push({ x: X(14.2), z: Z(-1.2), r: 1.4, label: '🍪 Collect treats', kind: 'treat', need: 'treat' });
  // --- toy pile / ball pit on the turf (upgrade) ---
  { const g = decor(scene, 'toys'), TY = new Batch(); TY.cyl('g', 0x38bdf8, X(4.5), 0.16, Z(-8.2), 1.6, 0.5, 0, 0, 0, false); for (let i = 0; i < 26; i++) { const a = i * 2.4, r = (i % 5) * 0.3; TY.sph('g', [0xef4444, 0xfacc15, 0x22c55e, 0xa855f7, 0xf97316][i % 5], X(4.5 + Math.cos(a) * r), 0.6 + (i % 3) * 0.08, Z(-8.2 + Math.sin(a) * r), 0.2); }
    TY.cyl('f', 0xf43f5e, X(7.4), 0.2, Z(-5.2), 0.35, 0.1, PI / 2, 0, 0); TY.sph('f', 0xfde047, X(1.8), 0.32, Z(-5.6), 0.16); TY.finish(g); solidC(X(4.5), Z(-8.2), 3.2, 3.2, 0.7, g);
    addSign(g, '🎾 TOY PIT', 1.6, 0.4, X(4.5), 1.4, Z(-6.5), fr, { bg: '#0369a1' }); }
  // agility hurdles (always) on the turf
  for (const lz of [-4.6, -10.6]) { for (const s of [-1, 1]) B.box('x', 0xffffff, X(4.5 + s * 1.2), 0.16, Z(lz), 0.1, 0.8, 0.1); B.box('g', 0xf97316, X(4.5), 0.7, Z(lz), 2.4, 0.08, 0.08); }
  // --- Pi-rat's Rescue Gear Shop (right back) ---
  B.rbox('g', 0x7c3aed, X(12.8), 0.16, Z(-6.8), 4.6, 1.0, 1.1); B.rbox('m', 0xf5e6d3, X(12.8), 1.12, Z(-6.8), 4.8, 0.12, 1.3); S(10.4, -7.4, 15.2, -6.2, 0, 1.3);
  B.box('m', 0x5b3a1e, X(16.5), 0.16, Z(-8.8), 0.5, 3, 6.4); for (let i = 0; i < 4; i++) { B.box('x', 0xcbd5e1, X(16.2), 0.5 + i * 0.7, Z(-8.8), 0.1, 0.06, 5.8); }
  for (let i = 0; i < 5; i++) { B.box('x', 0x9ca3af, X(16.15), 0.6, Z(-11 + i * 1.1), 0.06, 2.2, 0.06); B.box('x', 0x9ca3af, X(16.15), 0.6, Z(-10.7 + i * 1.1), 0.06, 2.2, 0.06); } // ladders
  for (let i = 0; i < 6; i++) B.cyl('g', [0xef4444, 0x22c55e, 0x3b82f6][i % 3], X(16.1), 1.9, Z(-11.2 + i * 0.9), 0.18, 0.06, 0, 0, PI / 2); // leash coils
  B.rbox('x', 0x334155, X(11.4), 1.26, Z(-6.9), 0.6, 0.3, 0.45); B.box('l', 0x22d3ee, X(11.4), 1.58, Z(-6.95), 0.45, 0.3, 0.03, 0, 0.5);
  S(16.2, -12, 16.8, -5.6, 0, 3.2);
  addSign(scene, "🏴‍☠️ PI-RAT'S RESCUE GEAR", 4.2, 0.6, X(12.8), 3.0, Z(-6.8), fr, { bg: '#5b21b6' });
  I.push({ x: X(12.8), z: Z(-5.2), r: 1.9, label: '🛒 Rescue Gear Shop (Pi-rat)', kind: 'shop' });
  T.spots.pirat = { x: X(13.6), z: Z(-8.0), yaw: fr };
  // --- Employee of the Month (upgrade swaps the empty frame for Candy's gold one) ---
  { const g0 = decor(scene, 'eotm0'); addSign(g0, 'EMPLOYEE OF THE MONTH\n( frame for sale )', 3.4, 1.6, X(-16.75), 2.2, Z(0.6) , PI / 2, { bg: '#e7e5e4', fg: '#78716c', border: '#a8a29e', glow: 0.2 });
    const g1 = decor(scene, 'eotm'); g1.visible = false; addSign(g1, '⭐ EMPLOYEE OF THE MONTH ⭐\n🐾 CANDY 🐾', 3.6, 1.7, X(-16.72), 2.25, Z(0.6), PI / 2, { bg: '#9d174d', fg: '#fde047', border: '#facc15', glow: 0.6 });
    const GB = new Batch(); GB.box('g', 0xfacc15, X(-16.78), 1.25, Z(0.6), 0.06, 0.12, 3.9); GB.box('g', 0xfacc15, X(-16.78), 3.15, Z(0.6), 0.06, 0.12, 3.9); GB.finish(g1); }
  // posters + clock
  addSign(scene, 'RESCUE RULES\n1 · stay calm  2 · treats first\n3 · leash on  4 · straight home', 3.6, 1.6, X(-6), 2.8, Z(-12.75), fr, { bg: '#fdf2f8', fg: '#831843', border: '#be185d', glow: 0.25 });
  addSign(scene, 'VAN BAY →', 2.4, 0.55, X(11), 4.0, Z(-12.75), fr, { bg: '#b45309' });
  B.box('m', 0x7c5a3a, X(16.6), 0.9, Z(1.8), 0.2, 2.0, 3.4); addSign(scene, '🗺️ PAWSVILLE MAP', 3.0, 1.6, X(16.45), 1.9, Z(1.8), -PI / 2, { bg: '#14532d', border: '#fde047', glow: 0.4 });
  I.push({ x: X(15.3), z: Z(1.8), r: 1.6, label: '🗺️ Pawsville Map', kind: 'map' });
  // --- van bay outside (back) ---
  B.box('m', 0xb8b3a7, X(11), 0, Z(-15), 9, 0.16, 4); for (const s of [-1, 1]) B.box('g', 0x111827, X(11 + s * 3.2), 0.16, Z(-13.35), 0.5, 1.0, 0.3);
  for (let i = 0; i < 4; i++) B.box('w', 0xec4899, X(7.2 + i * 2.6), 0.17, Z(-15), 0.14, 0.01, 3.6);
  for (const s of [-1, 1]) { B.cyl('g', 0xfacc15, X(11 + s * 4.8), 0.16, Z(-16.4), 0.14, 0.9); solidC(X(11 + s * 4.8), Z(-16.4), 0.3, 0.3, 1); }
  T.spots.truck = { x: X(11), z: Z(-20), yaw: PI / 2 }; T.spots.dockIn = { x: X(11), z: Z(-11.2) };
  // side lots: parking (west) + plaza with flagpole, fountain and a doghouse (east)
  for (let i = 0; i < 4; i++) B.box('w', 0xf8fafc, X(-19.4), 0.16, Z(-9 + i * 4.5), 3.6, 0.01, 0.14);
  B.box('w', 0x52565e, X(-21), 0.14, Z(-2), 7.5, 0.02, 20);
  B.cyl('x', 0xe5e7eb, X(20.5), 0.14, Z(6), 0.08, 7.5); const fl = addSign(scene, '🐾 RUFFSOURCES', 1.9, 1.0, X(21.45), 6.6, Z(6), 0, { bg: '#be185d', glow: 0.2 }); fl.material.side = THREE.DoubleSide; solidC(X(20.5), Z(6), 0.3, 0.3, 7);
  B.cyl('m', 0xcbd5e1, X(21), 0.14, Z(-4), 2.2, 0.6); B.cyl('e', 0x7dd3fc, X(21), 0.6, Z(-4), 1.9, 0.08); B.cyl('m', 0xcbd5e1, X(21), 0.6, Z(-4), 0.35, 1.4); B.sph('e', 0xbae6fd, X(21), 2.1, Z(-4), 0.5); solidC(X(21), Z(-4), 4.4, 4.4, 1.2);
  B.rbox('m', 0xdc2626, X(21), 0.14, Z(1.5), 1.8, 1.2, 1.6); B.add('m', G.prism || G.box, 0x7f1d1d, X(21), 1.34, Z(1.5), 0, PI / 2, 0, 1.9, 0.8, 2.0); B.box('x', 0x111827, X(21), 0.14, Z(2.31), 0.7, 0.8, 0.02); solidC(X(21), Z(1.5), 1.9, 1.7, 1.8);
  for (const lz of [-12, 11]) { tree(B, X(-21), Z(lz), 1); tree(B, X(21.5), Z(lz), 1); }
  T.spots.hqDoorOut = { x: X(0), z: Z(15) }; T.spots.hqIn = { x: X(0), z: Z(10.5) }; T.spots.intake = { x: X(0), z: Z(1.5) };
}
// Ratita Industries factory (west edge block) and Tortuga Park (east edge block)
function factory(B, scene) {
  const cx = -60, cz = 0; B.box('m', 0x9ca3af, cx, 0, cz, 44, 0.16, 28);
  B.box('m', 0xd1d5db, cx - 4, 0.16, cz, 30, 9, 20); B.box('m', 0x7c3aed, cx - 4, 9.16, cz, 30.4, 0.6, 20.4); for (let i = 0; i < 5; i++) B.add('m', G.prism, 0x94a3b8, cx - 16 + i * 6, 9.7, cz, 0, PI / 2, 0, 20, 2, 6);
  for (const s of [-1, 1]) { B.cyl('m', 0xb45309, cx + 6 + s * 2.5, 9, cz - 6, 1, 7); B.cyl('m', 0xf8fafc, cx + 6 + s * 2.5, 15.2, cz - 6, 1.05, 0.6); }
  for (let i = 0; i < 6; i++) { B.box('g', 0x7fb8d8, cx - 16 + i * 5, 4, cz + 10.02, 3, 2.4, 0.1); B.box('m', 0xffffff, cx - 16 + i * 5, 3.9, cz + 10.04, 3.2, 0.12, 0.1); }
  B.box('x', 0x64748b, cx - 4, 0.16, cz + 10.05, 6, 4.5, 0.2);
  addSign(scene, 'RATITA INDUSTRIES · GADGET WORKS', 16, 1.6, cx - 4, 7.3, cz + 10.15, 0, { bg: '#5b21b6', glow: 0.45 });
  solidC(cx - 4, cz, 30.4, 20.4, 16);
  for (let i = 0; i < 5; i++) { const x = cx + 14, z = cz - 9 + i * 4.2; B.box('m', 0xa16207, x, 0.16, z, 2.4, 0.2, 2.4); B.rbox('m', [0xc4a484, 0xd6b48a][i % 2], x, 0.36, z, 2, 1.6, 2); solidC(x, z, 2.4, 2.4, 2.2); }
  for (let z = -12; z <= 12; z += 3) { B.box('x', 0x64748b, cx + 18, 0.16, z, 0.08, 1.8, 3); B.box('x', 0x475569, cx + 18, 0.16, z - 1.5, 0.12, 1.9, 0.12); } solid(cx + 17.9, -13.5, cx + 18.1, 13.5, 0, 2);
  tree(B, cx - 20, cz + 12); tree(B, cx + 12, cz + 12); tree(B, cx - 20, cz - 12);
  T.spots.factory = { x: cx + 10, z: cz + 16 };
  B.cyl('m', 0x6b4f3a, cx + 16, 0, cz + 15.2, 0.08, 1.0); B.rbox('g', 0x7c3aed, cx + 16, 1.0, cz + 15.2, 0.6, 0.5, 0.8); solidC(cx + 16, cz + 15.2, 0.5, 0.6, 1.4);
}
function park(B, scene) {
  const cx = 60, cz = 0;
  B.box('w', 0x67b84c, cx, 0.16, cz, 45, 0.02, 29); B.cyl('m', 0xa8a29e, cx, 0.12, cz, 7.6, 0.12); B.cyl('e', 0x38bdf8, cx, 0.2, cz, 7, 0.08);
  for (let a = 0; a < 6.28; a += 0.25) B.sph('m', 0x9ca3af, cx + Math.cos(a) * 7.4, 0.25, cz + Math.sin(a) * 7.4, 0.45, 0.3, 0.45); solidC(cx, cz, 13, 13, 0.6);
  for (let i = 0; i < 5; i++) B.add('m', G.cyl, 0x22c55e, cx - 3 + i * 1.5, 0.22, cz - 2 + (i % 2) * 2.5, 0, 0, 0, 0.5, 0.03, 0.5);
  B.box('m', 0xe7d8bc, cx, 0.17, cz + 10, 44, 0.02, 2.4); B.box('m', 0xe7d8bc, cx - 15, 0.17, cz, 2.4, 0.02, 28);
  for (const x of [-10, 10]) { B.rbox('m', 0xb07a45, cx + x, 0.55, cz + 12, 2.6, 0.14, 0.7); B.rbox('m', 0xb07a45, cx + x, 0.7, cz + 12.4, 2.6, 0.5, 0.1); solidC(cx + x, cz + 12.1, 2.6, 0.9, 1); }
  for (const [x, z] of [[-19, -11], [-19, 11], [19, -11], [19, 11], [-10, -11], [10, -11], [0, -12], [-19, 0], [19, 0]]) tree(B, cx + x, cz + z, 1.1);
  // playground
  B.box('g', 0xef4444, cx + 15, 0.16, cz - 3, 0.2, 3, 0.2); B.box('g', 0xef4444, cx + 15, 0.16, cz + 1, 0.2, 3, 0.2); B.box('g', 0x2563eb, cx + 15, 3, cz - 1, 0.25, 0.25, 4.4); for (const z of [-2, 0]) B.box('g', 0xfacc15, cx + 15, 0.8, cz + z, 0.6, 0.08, 0.4); solid(cx + 14.8, cz - 3.2, cx + 15.2, cz + 1.2, 0, 3);
  // Torty's shell cottage
  const tx = cx - 8, tz = cz - 14 + 4; B.add('m', G.sph, 0x92673a, tx - 8, 0.1, tz + 1, 0, 0, 0, 3.4, 2.6, 3); for (let i = 0; i < 6; i++) B.add('m', G.sph, 0xb98545, tx - 8 + Math.cos(i) * 2, 1.6 + (i % 2) * 0.6, tz + 1 + Math.sin(i) * 1.6, 0, 0, 0, 0.9, 0.6, 0.9); B.box('g', 0x14532d, tx - 8, 0.1, tz + 4, 1.2, 1.8, 0.2); solidC(tx - 8, tz + 1, 6, 5.6, 3);
  addSign(scene, "TORTY'S SHELL COTTAGE", 3.6, 0.6, tx - 8, 3.6, tz + 4.3, 0, { bg: '#14532d' });
  T.spots.park = { x: cx, z: cz + 9 }; B.cyl('m', 0x6b4f3a, tx - 5.5, 0, cz + 13.8, 0.08, 1.0); B.rbox('g', 0x16a34a, tx - 5.5, 1.0, cz + 13.8, 0.6, 0.5, 0.8); solidC(tx - 5.5, cz + 13.8, 0.5, 0.6, 1.4);
  addSign(scene, 'TORTUGA PARK', 3.6, 0.8, cx, 2.0, cz + 15.6, 0, { bg: '#166534' }); B.box('m', 0x6b4f3a, cx - 1.7, 0, cz + 15.6, 0.14, 1.7, 0.14); B.box('m', 0x6b4f3a, cx + 1.7, 0, cz + 15.6, 0.14, 1.7, 0.14);
}
export function buildTown(scene) {
  R = rng(1234);
  const B = new Batch(48);
  roads(B, scene);
  const H = postOffice(B, scene, { cx: 0, cz: 0, w: 34, d: 26, fz: 1, hq: true }); shelterInterior(B, scene, H); T.hqRoof = H.roof;
  factory(B, scene); park(B, scene);
  const S3 = [-16.5, 0, 16.5];
  for (const bx of [-60, 0, 60]) for (const bz of [-51, 51]) { const zf = bz - 24 + 2.5 + 7.5, zb = bz + 24 - 2.5 - 7.5; houseRow(B, bx, zf, -1, S3); houseRow(B, bx, zb, 1, S3); yard(B, bx, bz, 46, 12); }
  for (const bx of [-60, 0, 60]) for (const bz of [-51, 51]) for (const s of [-1, 1]) for (const z of [-14, 0, 14]) tree(B, bx + s * 22.5, bz + z, 0.9);
  const g = new THREE.Group(); scene.add(g); B.finish(g);
  return T;
}
