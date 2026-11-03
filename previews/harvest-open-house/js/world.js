// Harvest Hollow: Torty's Thanksgiving farm town (Turbo engine). Dense batched props, colliders, live-event decor by phase.
import * as THREE from 'three';
import { Batch, G, solid, solidC, sign, PI } from './kit.js';
import { MATS } from './mats.js';
import { rng } from './util.js';
export const SP = {};
const AUT = [0xd9622b, 0xe8a33d, 0xb8432a, 0xf2c14e, 0x9c3d1f];
function tree(b, x, z, r, s = 1) { b.cyl('m', 0x5b3a24, x, 0, z, 0.28 * s, 2.6 * s); const c = AUT[Math.floor(r() * 5)];
  b.sph('f', c, x, 3.2 * s, z, 1.7 * s, 1.4 * s, 1.7 * s); b.sph('f', AUT[Math.floor(r() * 5)], x + 0.8 * s, 2.7 * s, z + 0.3, 1.1 * s); b.sph('f', c, x - 0.7 * s, 2.9 * s, z - 0.4, 1.1 * s); solidC(x, z, 0.7, 0.7, 3); }
function pumpkin(b, x, z, s = 0.45) { b.sph('g', 0xf07b1f, x, s * 0.8, z, s * 1.1, s * 0.8, s * 1.1); b.cyl('m', 0x4d7a2a, x, s * 1.5, z, s * 0.12, s * 0.35); }
function hay(b, x, z, ry = 0) { b.rbox('m', 0xe3c062, x, 0, z, 1.6, 0.85, 0.9, ry); b.box('m', 0xb98d3a, x, 0.2, z, 1.62, 0.06, 0.92, ry); b.box('m', 0xb98d3a, x, 0.6, z, 1.62, 0.06, 0.92, ry); }
function lamp(b, x, z) { b.cyl('x', 0x2f3437, x, 0, z, 0.08, 3.6); b.sph('l', 0xffd59a, x, 3.7, z, 0.28, 0.28, 0.28, 1.2); solidC(x, z, 0.3, 0.3, 3.6); }
function bench(b, x, z, ry) { b.box('m', 0x8a5a33, x, 0.42, z, 1.8, 0.08, 0.5, ry); b.box('x', 0x2f3437, x, 0, z, 1.6, 0.42, 0.4, ry); }
function crate(b, x, z, col = 0xa8743f) { b.rbox('m', col, x, 0, z, 0.8, 0.6, 0.6); }
function leafPile(b, x, z, s = 1) { b.sph('f', AUT[(x * 7 + z) & 3 ? 0 : 1], x, 0.05, z, 0.9 * s, 0.35 * s, 0.9 * s); b.sph('f', 0xe8a33d, x + 0.3, 0.15, z - 0.2, 0.5 * s, 0.25 * s, 0.5 * s); }
function house(b, scene, x, z, w, d, col, roof, ry, label) { // front faces +z when ry=0
  const R = (ry || 0); const cos = Math.cos(R), sin = Math.sin(R); const P = (lx, lz) => [x + lx * cos + lz * sin, z - lx * sin + lz * cos];
  b.add('m', G.box, col, x, 2.2, z, 0, R, 0, w, 4.4, d); b.add('m', G.prism, roof, x, 4.4, z, 0, R, 0, w + 0.6, 2.2, d + 0.6);
  let [dx, dz] = P(0, d / 2 + 0.02); b.add('m', G.box, 0x6b3f22, dx, 1.1, dz, 0, R, 0, 1.2, 2.2, 0.08);
  for (const lx of [-w / 3, w / 3]) { [dx, dz] = P(lx, d / 2 + 0.03); b.add('l', G.box, 0xffe2a8, dx, 2.4, dz, 0, R, 0, 0.9, 0.9, 0.05, 0.4); [dx, dz] = P(lx, d / 2 + 0.25); pumpkin(b, dx, dz, 0.3); }
  const hw = Math.abs(w / 2 * cos) + Math.abs(d / 2 * sin), hd = Math.abs(w / 2 * sin) + Math.abs(d / 2 * cos); solid(x - hw, z - hd, x + hw, z + hd, 0, 6);
  if (label) { const s = sign(label, 3.2, 0.7, { bg: '#7c2d12', border: '#fbbf24' }); [dx, dz] = P(0, d / 2 + 0.06); s.position.set(dx, 3.5, dz); s.rotation.y = R; scene.add(s); }
}
function corn(b, x, z, h = 2.4) { b.cyl('f', 0x9bb04a, x, 0, z, 0.05, h, 0, 0, 0, 1); b.add('f', G.cone, 0xb7c25a, x, h * 0.6, z, 0.4, x, 0.2, 0.35, 0.8, 0.12); b.add('g', G.sph, 0xf2c14e, x + 0.12, h * 0.55, z, 0, 0, 0.3, 0.07, 0.2, 0.07); }
export function makeTurkey(gold) { const b = new Batch(); const body = gold ? 0xffc83d : 0x6b4226;
  for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.3; b.add('g', G.sph, [0xb8432a, 0xe8a33d, 0x6b4226, 0xf2c14e][i % 4], Math.sin(a) * 0.45, 0.9 + Math.cos(a) * 0.45, -0.3, -0.3, 0, 0, 0.18, 0.5, 0.05); }
  b.sph('g', body, 0, 0.6, 0, 0.42, 0.38, 0.48); b.sph('g', 0xc9a27a, 0, 1.05, 0.3, 0.16, 0.18, 0.16); b.cyl('g', 0xc9a27a, 0, 0.75, 0.25, 0.08, 0.3);
  b.add('g', G.cone, 0xffb02e, 0, 1.05, 0.48, PI / 2, 0, 0, 0.05, 0.12, 0.05); b.sph('g', 0xdc2626, 0.03, 0.95, 0.44, 0.04, 0.09, 0.04);
  [-1, 1].forEach((s) => { b.sph('g', 0xffffff, s * 0.08, 1.1, 0.42, 0.045); b.sph('g', 0x111111, s * 0.08, 1.1, 0.46, 0.025); b.cyl('x', 0xffb02e, s * 0.15, 0, 0, 0.03, 0.3); });
  if (gold) { b.cyl('x', 0x2563eb, 0, 1.22, 0.3, 0.14, 0.12); b.sph('l', 0x5ef2ff, 0, 1.36, 0.3, 0.05, 0.05, 0.05, 1); }
  const g = new THREE.Group(); b.finish(g); return g; }
function stall(b, scene, x, z, ry, aw, goods, label) { // market stall, counter faces local +z
  const c = Math.cos(ry), sn = Math.sin(ry); const P = (lx, lz) => [x + lx * c + lz * sn, z - lx * sn + lz * c];
  b.add('m', G.box, 0x8a5a33, x, 0.45, z, 0, ry, 0, 3, 0.9, 1.1); b.add('m', G.box, 0xd9b38c, x, 0.92, z, 0, ry, 0, 3.1, 0.06, 1.2);
  for (const [lx, lz] of [[-1.45, -0.5], [1.45, -0.5], [-1.45, 0.5], [1.45, 0.5]]) { const [px, pz] = P(lx, lz); b.cyl('x', 0x5b3a24, px, 0, pz, 0.05, 2.5); }
  for (let i = 0; i < 6; i++) { const [px, pz] = P(-1.25 + i * 0.5, 0); b.add('f', G.box, i % 2 ? 0xfff7ed : aw, px, 2.55, pz, 0.25, ry, 0, 0.5, 0.06, 1.5); }
  goods.forEach((g, i) => { const [px, pz] = P(-1 + i, 0.15); b.rbox('m', 0xa8743f, px, 0.95, pz, 0.8, 0.22, 0.6, ry); for (let k = 0; k < 4; k++) { const [qx, qz] = P(-1.2 + i + (k % 2) * 0.35, 0.02 + (k >> 1) * 0.26); b.sph('g', g, qx, 1.22, qz, 0.13); } });
  { const [cx, cz] = P(1.9, 0.2); b.rbox('m', 0xa8743f, cx, 0, cz, 0.7, 0.55, 0.6, ry); b.sph('g', goods[0], cx, 0.66, cz, 0.16); b.sph('g', goods[0], cx + 0.2, 0.66, cz, 0.15); }
  if (label) { const sg = sign(label, 2.2, 0.45, { bg: '#7c2d12', border: '#fbbf24' }); const [lx2, lz2] = P(0, 0.78); sg.position.set(lx2, 2.2, lz2); sg.rotation.y = ry; scene.add(sg); }
  solidC(x, z, Math.abs(3.2 * c) + Math.abs(1.2 * sn), Math.abs(3.2 * sn) + Math.abs(1.2 * c), 2.6); }
function haystack(b, x, z, ry, n) { hay(b, x, z, ry); if (n > 1) hay(b, x + Math.cos(ry) * 1.7, z - Math.sin(ry) * 1.7, ry); if (n > 2) { const tx = x + Math.cos(ry) * 0.85, tz = z - Math.sin(ry) * 0.85; b.rbox('m', 0xe3c062, tx, 0.85, tz, 1.6, 0.85, 0.9, ry + 0.05); b.box('m', 0xb98d3a, tx, 1.05, tz, 1.62, 0.06, 0.92, ry + 0.05); b.box('m', 0xb98d3a, tx, 1.45, tz, 1.62, 0.06, 0.92, ry + 0.05); } solidC(x + Math.cos(ry) * 0.85, z - Math.sin(ry) * 0.85, n > 1 ? 3.4 : 1.7, 1, 0.9); }
function shock(b, x, z) { for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; b.add('f', G.cone, 0xc9b25a, x + Math.cos(a) * 0.15, 0, z + Math.sin(a) * 0.15, Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12, 0.22, 2.1, 0.22); } b.cyl('m', 0x8a5a33, x, 0.9, z, 0.33, 0.1); }
function fenceRun(b, x0, z0, x1, z1) { const L = Math.hypot(x1 - x0, z1 - z0), ry = -Math.atan2(z1 - z0, x1 - x0), n = Math.max(1, Math.round(L / 1.6));
  for (let i = 0; i <= n; i++) { const t = i / n; b.box('m', 0xf3ead8, x0 + (x1 - x0) * t, 0, z0 + (z1 - z0) * t, 0.12, 0.9, 0.12); }
  for (const y of [0.35, 0.7]) b.add('m', G.box, 0xf3ead8, (x0 + x1) / 2, y, (z0 + z1) / 2, 0, ry, 0, L, 0.08, 0.05); }
function cart(b, x, z, ry, load) { const c = Math.cos(ry), sn = Math.sin(ry); const P = (lx, lz) => [x + lx * c + lz * sn, z - lx * sn + lz * c];
  b.add('m', G.box, 0x9c5a2e, x, 0.75, z, 0, ry, 0, 2.2, 0.5, 1.2); for (const [lx, lz] of [[-0.7, 0.66], [0.7, 0.66], [-0.7, -0.66], [0.7, -0.66]]) { const [px, pz] = P(lx, lz); b.add('x', G.cyl, 0x3f2a1a, px, 0.42, pz, PI / 2, ry, 0, 0.4, 0.1, 0.4); }
  { const [hx, hz] = P(1.7, 0); b.add('m', G.box, 0x6b3f22, hx, 0.6, hz, 0, ry, 0, 1.4, 0.08, 0.08); }
  if (load === 'hay') { b.add('m', G.box, 0xe3c062, x, 1.25, z, 0, ry, 0, 2, 0.6, 1.0); } else for (let i = 0; i < 6; i++) { const [px, pz] = P(-0.7 + (i % 3) * 0.7, -0.3 + (i / 3 | 0) * 0.6); b.sph('g', load === 'apples' ? 0xc0262d : 0xf07b1f, px, 1.15, pz, load === 'apples' ? 0.18 : 0.3, load === 'apples' ? 0.18 : 0.24, load === 'apples' ? 0.18 : 0.3); }
  solidC(x, z, Math.abs(2.4 * c) + Math.abs(1.3 * sn), Math.abs(2.4 * sn) + Math.abs(1.3 * c), 1.4); }
function pumpkinStand(b, x, z, ry) { const c = Math.cos(ry), sn = Math.sin(ry); const P = (lx, lz) => [x + lx * c + lz * sn, z - lx * sn + lz * c];
  for (let t = 0; t < 3; t++) { const [px, pz] = P(0, -0.5 + t * 0.5); b.add('m', G.box, 0x8a5a33, px, 0.25 + (2 - t) * 0.3, pz, 0, ry, 0, 2.6, 0.08, 0.45); for (let k = 0; k < 4; k++) { const [qx, qz] = P(-0.95 + k * 0.63, -0.5 + t * 0.5); b.sph('g', [0xf07b1f, 0xe8a33d, 0xf4f4f5, 0xd9622b][(k + t) % 4], qx, 0.48 + (2 - t) * 0.3, qz, 0.2, 0.16, 0.2); } }
  solidC(x, z, Math.abs(2.8 * c) + Math.abs(1.6 * sn), Math.abs(2.8 * sn) + Math.abs(1.6 * c), 1.2); }
// fill every empty lot between the attractions so the town reads dense; keep roads, chase route and zone entrances clear
function fillTown(b, scene, r, phase) {
  const zones = [[-18, -18, 18, 18], [-12, -51, 12, -31], [-73, -23, -33, 9], [35, -13, 59, 5], [-65, 15, -29, 51], [-82, 25, 82, 47], [63, 17, 86, 37], [18, 19, 30, 29], [-3.5, -34, 3.5, -17], [-3.5, 17, 3.5, 30]];
  const roads = [[0, -17, 0, -36], [17, 0, 47, 0], [-17, 0, -48, 0], [0, 17, 0, 29], [-17, 12, -58, 14], [30, 18, 66, 30]];
  const cp = SP.chasePath; for (let i = 0; i + 1 < cp.length; i++) roads.push([cp[i][0], cp[i][1], cp[i + 1][0], cp[i + 1][1]]);
  const segD = (x, z, [ax, az, bx2, bz]) => { const vx = bx2 - ax, vz = bz - az, L = vx * vx + vz * vz || 1, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / L)); return Math.hypot(x - ax - vx * t, z - az - vz * t); };
  let mg = 3.2; const free = (x, z, rad) => !zones.some(([a, c, d, e]) => x > a - rad && x < d + rad && z > c - rad && z < e + rad) && !roads.some((s) => segD(x, z, s) < rad + mg);
  const hc = [0xe9d3b0, 0xc2703d, 0xf1e4c8, 0x9c6b45, 0xd9b38c, 0xb45309, 0xfde68a], rc = [0x7c2d12, 0x3f2a1a, 0x14532d, 0x7f1d1d];
  let n = 0; const face = (x, z) => { let best = 0, bd = 1e9; for (const s of roads) { const d = segD(x, z, s); if (d < bd) { bd = d; best = s; } } const [ax, az, bx2, bz] = best, vx = bx2 - ax, vz = bz - az, L = vx * vx + vz * vz || 1, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / L)); return Math.atan2(ax + vx * t - x, az + vz * t - z); };
  for (let z = -58; z <= 22; z += 9) for (let x = -78; x <= 78; x += 9) { const jx = x + (r() - 0.5) * 1.5, jz = z + (r() - 0.5) * 1.5; const k = r();
    if (k < 0.55 && free(jx, jz, 4)) { const ry = Math.round(face(jx, jz) / (PI / 2)) * (PI / 2); house(b, scene, jx, jz, 6.5, 5.5, hc[n % 7], rc[n % 4], ry); const fr = ry; const P = (lx, lz) => [jx + lx * Math.cos(fr) + lz * Math.sin(fr), jz - lx * Math.sin(fr) + lz * Math.cos(fr)];
      const [ax, az] = P(-3.2, 3.9), [bx2, bz] = P(-0.9, 3.9), [cx, cz] = P(0.9, 3.9), [dx, dz] = P(3.2, 3.9); fenceRun(b, ax, az, bx2, bz); fenceRun(b, cx, cz, dx, dz);
      if (n % 3 === 0) { const [hx, hz] = P(2.6, 3.0); hay(b, hx, hz, fr); } if (n % 4 === 1) { const [tx, tz] = P(-4.2, -1); tree(b, tx, tz, r, 0.8); } n++; }
    else if (k < 0.7 && free(jx, jz, 2.5)) { const [ax, az] = [jx - 3, jz - 2.5]; fenceRun(b, ax, az, ax + 6, az); fenceRun(b, ax, az + 5, ax + 6, az + 5); fenceRun(b, ax, az, ax, az + 5); fenceRun(b, ax + 6, az, ax + 6, az + 5); b.box('m', 0x6b4a2e, jx, 0.01, jz, 5.6, 0.06, 4.6); for (let i = 0; i < 9; i++) pumpkin(b, ax + 1 + (i % 3) * 2, az + 1 + (i / 3 | 0) * 1.5, 0.28 + r() * 0.15); solidC(jx, jz, 6.2, 5.2, 1); }
    else if (k < 0.82 && free(jx, jz, 2)) { cart(b, jx, jz, face(jx, jz) + PI / 2, ['hay', 'pumpkins', 'apples'][n++ % 3]); pumpkin(b, jx + 1.8, jz + 1.2, 0.3); }
    else if (k < 0.92 && free(jx, jz, 2)) { pumpkinStand(b, jx, jz, face(jx, jz)); shock(b, jx + 2, jz - 1); }
    else if (free(jx, jz, 1.5)) { haystack(b, jx, jz, r() * 0.4, 2); shock(b, jx - 1.6, jz + 1.4); } }
  // second, finer pass close to the square: small market props on the lawns
  mg = 1.8; for (let z = -40; z <= 26; z += 5) for (let x = -42; x <= 42; x += 5) { const jx = x + (r() - 0.5), jz = z + (r() - 0.5), k = r(); if (!free(jx, jz, 1.6)) continue;
    if (k < 0.3) pumpkinStand(b, jx, jz, face(jx, jz)); else if (k < 0.55) { haystack(b, jx, jz, r() * 0.3, 2); pumpkin(b, jx + 0.4, jz + 0.9, 0.32); } else if (k < 0.75) cart(b, jx, jz, face(jx, jz) + PI / 2, ['hay', 'pumpkins', 'apples'][(k * 30 | 0) % 3]); else if (k < 0.9) { shock(b, jx, jz); shock(b, jx + 1.2, jz + 0.3); pumpkin(b, jx + 0.6, jz + 0.9, 0.3); } else tree(b, jx, jz, r, 0.85); }
}
export function buildWorld(scene, phase) {
  const r = rng(1126); const b = new Batch(24);
  // ground + roads
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), MATS.g); gnd.rotation.x = -PI / 2; gnd.receiveShadow = true; scene.add(gnd);
  { const gb = new Batch(); gb.box('g', 0x7f9a45, 0, -0.05, 0, 240, 0.05, 240); gb.finish(scene); }
  b.box('m', 0x8c7a66, 0, 0, 0, 30, 0.04, 30); // square paving
  b.box('m', 0x4b4b52, 0, 0.0, 34, 150, 0.05, 9); // parade avenue
  b.box('m', 0x9c8a73, 0, 0.01, -26, 8, 0.04, 24); b.box('m', 0x9c8a73, -30, 0.01, 0, 32, 0.04, 6); b.box('m', 0x9c8a73, 30, 0.01, 0, 32, 0.04, 6); b.box('m', 0x9c8a73, 0, 0.01, 22, 6, 0.04, 16);
  for (let x = -72; x <= 72; x += 6) b.box('l', 0xfff5c0, x, 0.06, 34, 2.4, 0.01, 0.18, 0, 0.2);
  // ---- town square: cornucopia statue, feast table, benches, lamps
  b.cyl('m', 0x8a8a8a, 0, 0, 0, 3, 0.6); b.add('g', G.cone, 0xb98d3a, 0, 2.2, 0, 0, 0, PI / 2.4, 1.2, 3.4, 1.2);
  [[0xf07b1f, 1.4, 1.2], [0xb8432a, 1.9, 0.6], [0xf2c14e, 1.2, -0.4], [0x7c3aed, 2.1, 0.1], [0x4d7a2a, 1.6, -1]].forEach(([c, x, z]) => b.sph('g', c, x, 1.0, z, 0.45));
  solidC(0, 0, 6, 6, 3);
  for (const [x, z] of [[-13, -13], [13, -13], [-13, 13], [13, 13], [-13, 0], [13, 0]]) lamp(b, x, z);
  bench(b, -6, -10, 0); bench(b, 6, -10, 0); bench(b, -10, 6, PI / 2); bench(b, 10, -6, PI / 2);
  // feast table (size by phase)
  const fl = phase === 'day' ? 16 : phase === 'post' ? 10 : phase === 'off' ? 4 : 6; SP.feast = { x: 0, z: 9.5, name: 'Feast Table' };
  b.box('m', 0x8a5a33, 0, 0.8, 9.5, fl, 0.12, 1.8); b.box('f', 0xb8432a, 0, 0.9, 9.5, fl + 0.2, 0.02, 1.9); for (let i = 0; i < fl / 2; i++) b.box('m', 0x5b3a24, -fl / 2 + 1 + i * 2, 0, 9.5, 0.12, 0.8, 1.6);
  solidC(0, 9.5, fl, 1.8, 1);
  for (let i = 0; i < fl; i += 1.6) { const x = -fl / 2 + 0.8 + i; if (phase === 'post') { b.cyl('x', 0xf4f4f5, x, 0.92, 9.5, 0.28, 0.04); b.sph('g', 0xb8432a, x, 0.98, 9.5, 0.08); } else { b.cyl('x', 0xf4f4f5, x, 0.92, 9.5, 0.3, 0.04); b.sph('g', [0xf07b1f, 0xe8a33d, 0xb8432a, 0xf2c14e][Math.floor(i) % 4], x, 1.05, 9.5, 0.22, 0.14, 0.22); } }
  // arcade kiosk with cabinet #51
  b.rbox('m', 0x312e81, 10, 0, 6, 1.2, 2.1, 0.9); b.box('l', 0x5ef2ff, 10, 1.1, 6.46, 0.9, 0.7, 0.02, 0, 0.8); SP.cab = { x: 10, z: 7.2, name: 'Cabinet #51' }; solidC(10, 6, 1.2, 0.9, 2);
  { const s = sign('#51 PIE PLATE CATCH', 1.6, 0.4, { bg: '#312e81', border: '#5ef2ff' }); s.position.set(10, 2.35, 6.47); scene.add(s); }
  { const s = sign('HARVEST HOLLOW', 6, 1.2, { bg: '#7c2d12', border: '#fbbf24' }); s.position.set(0, 4.8, -0.2); s.rotation.y = 0; scene.add(s); const s2 = s.clone(); s2.rotation.y = PI; s2.position.z = 0.2 - 0.4; scene.add(s2); b.box('x', 0x2f3437, -3.2, 0, -0.3, 0.2, 5.4, 0.2); b.box('x', 0x2f3437, 3.2, 0, -0.3, 0.2, 5.4, 0.2); }
  // ---- harvest market + tidy hub dressing (every phase)
  stall(b, scene, -8, -13.6, 0, 0xb8432a, [0xf07b1f, 0xe8a33d, 0x4d7a2a], 'PUMPKIN PATCH');
  stall(b, scene, 8, -13.6, 0, 0x7c3aed, [0xb8432a, 0xdc2626, 0x9c3d1f], 'CRANBERRY CO.');
  stall(b, scene, -13.4, -4.5, PI / 2, 0xd9622b, [0xf2c14e, 0xf2c14e, 0xc9a27a], 'CORN & BREAD');
  stall(b, scene, 13.4, -2.5, -PI / 2, 0x15803d, [0xc9a27a, 0x9c6b45, 0xf4f4f5], 'APPLE CIDER');
  haystack(b, -12.2, 10.8, 0, 3); haystack(b, 10.6, 10.8, 0, 2); haystack(b, -4.6, -12.2, 0, 1); haystack(b, 3.2, -12.2, 0, 1);
  for (const [x, z] of [[-12.2, -12.2], [12.2, -12.2], [-12.6, 13.4], [12.6, 13.4], [-3.4, 3.6], [3.4, 3.6]]) shock(b, x, z);
  for (const [x, z, s] of [[-11.2, 9.6, 0.45], [-10.6, 10.1, 0.32], [11.8, 9.8, 0.4], [-3.8, -12.2, 0.35], [4.2, -12.3, 0.3], [-14.2, -7, 0.35], [14.2, 0.2, 0.38], [-4.2, 3.9, 0.3], [4.1, 3.9, 0.32]]) pumpkin(b, x, z, s);
  for (let z = 17; z <= 29; z += 2.4) { pumpkin(b, -3.6, z, 0.3 + ((z * 7) % 3) * 0.04); pumpkin(b, 3.6, z + 1.2, 0.3 + ((z * 5) % 3) * 0.04); }
  for (const x of [-9, 9]) { b.cyl('x', 0x3f3f46, x, 0, -10.6, 0.3, 0.9); b.cyl('x', 0x15803d, x, 0.9, -10.6, 0.32, 0.05); solidC(x, -10.6, 0.6, 0.6, 1); } // bins by the benches
  // ---- Main Street market lining the road to the kitchen, pumpkin stands on the south lane
  SP.stalls = [[-8, -13.6, 0], [8, -13.6, 0], [-13.4, -4.5, PI / 2], [13.4, -2.5, -PI / 2]];
  { const G2 = [[0xf07b1f, 0xe8a33d, 0x4d7a2a], [0xc0262d, 0xdc2626, 0x9c3d1f], [0xf2c14e, 0xc9a27a, 0xf2c14e], [0x9c6b45, 0xc9a27a, 0xf4f4f5], [0x7c3aed, 0x4d7a2a, 0xb8432a]], AW = [0xb8432a, 0x0f766e, 0xd9622b, 0x7c3aed, 0x15803d];
    const lbl = ['PIES & TARTS', null, 'HONEY', null, 'GOURDS', null]; let i = 0;
    for (let z = -20; z >= -30; z -= 4.5) { for (const sd of [-1, 1]) { stall(b, scene, sd * 5.2, z, sd < 0 ? PI / 2 : -PI / 2, AW[i % 5], G2[i % 5], lbl[i] || null); SP.stalls.push([sd * 5.2, z, sd < 0 ? PI / 2 : -PI / 2]); i++; } }
    for (const z of [-22.2, -26.7]) for (const sd of [-1, 1]) lamp(b, sd * 3.6, z);
    for (const z of [19, 25]) { pumpkinStand(b, -6.4, z, PI / 2); pumpkinStand(b, 6.4, z, -PI / 2); }
    cart(b, -6.5, 22, 0, 'apples'); cart(b, 6.5, 22, PI, 'hay'); }
  // ---- street of houses around square
  const hc = [0xe9d3b0, 0xc2703d, 0xf1e4c8, 0x9c6b45, 0xd9b38c];
  [[-22, -14, 0], [-22, 14, PI], [22, -14, 0], [22, 14, PI], [-12, -22, 0], [12, -22, 0]].forEach(([x, z, ry], i) => house(b, scene, x, z, 7, 6, [0xf4a25a, 0xc7d2fe, 0xfbe4e4, 0xfce7f3, 0xf5d0a9, 0xe7e5e4][i], 0x7c2d12, ry, ['PUMPKIN SHOP', "LUNA'S HOME", 'CRANBERRY CO.', "PI-RAT'S HOME", 'HOLLOW BAKERY', 'TOWN HALL'][i]));
  house(b, scene, 40, -9, 8, 6, 0x9a3412, 0x3f1d0b, 0, 'CIDER BARN'); house(b, scene, 54, -9, 8, 6, 0xfef3c7, 0xdc2626, 0, 'HOLLOW DINER');
  // ---- Chef Mimo's Ratita Kitchen (north)
  { const kx = 0, kz = -42, w = 16, d = 12; b.box('m', 0xf1e4c8, kx, 0, kz - d / 2, w, 5, 0.4); b.box('m', 0xf1e4c8, kx - w / 2, 0, kz, 0.4, 5, d); b.box('m', 0xf1e4c8, kx + w / 2, 0, kz, 0.4, 5, d);
    b.box('m', 0xf1e4c8, kx - 5, 0, kz + d / 2, 6, 5, 0.4); b.box('m', 0xf1e4c8, kx + 5, 0, kz + d / 2, 6, 5, 0.4); b.box('m', 0xf1e4c8, kx, 3.2, kz + d / 2, 4, 1.8, 0.4);
    b.box('m', 0xd7c4a3, kx, 0.01, kz, w, 0.03, d); for (let i = -7; i < 8; i += 2) for (let j = -5; j < 6; j += 2) b.box('m', 0xb8432a, kx + i + 0.5, 0.045, kz + j + 0.5, 1, 0.012, 1);
    b.box('m', 0x7c2d12, kx, 5, kz, w + 0.6, 0.3, d + 0.6);
    solid(kx - w / 2 - 0.2, kz - d / 2 - 0.2, kx + w / 2 + 0.2, kz - d / 2 + 0.2); solid(kx - w / 2 - 0.2, kz - d / 2, kx - w / 2 + 0.2, kz + d / 2); solid(kx + w / 2 - 0.2, kz - d / 2, kx + w / 2 + 0.2, kz + d / 2);
    solid(kx - 8, kz + d / 2 - 0.2, kx - 2, kz + d / 2 + 0.2); solid(kx + 2, kz + d / 2 - 0.2, kx + 8, kz + d / 2 + 0.2);
    // appliances on back wall: oven, blender, toaster, stove
    b.box('m', 0x9ca3af, kx - 4.5, 0, kz - 4.6, 2, 1.6, 1.2); b.box('e', 0xff9a3c, kx - 4.5, 0.4, kz - 3.99, 1.4, 0.8, 0.02, 0, 0.3); b.sph('l', 0xff4fa0, kx - 3.8, 1.4, kz - 3.95, 0.07, 0.07, 0.07, 1);
    b.box('m', 0xe5e7eb, kx - 1.5, 0, kz - 4.8, 3, 0.95, 1); b.cyl('x', 0x6b7280, kx - 1.5, 0.95, kz - 4.8, 0.3, 0.3); b.cyl('e', 0x93c5fd, kx - 1.5, 1.25, kz - 4.8, 0.25, 0.7);
    b.box('m', 0xe5e7eb, kx + 1.5, 0, kz - 4.8, 3, 0.95, 1); b.rbox('x', 0xdc2626, kx + 1.5, 0.95, kz - 4.8, 0.8, 0.5, 0.5); b.box('l', 0x111111, kx + 1.35, 1.45, kz - 4.8, 0.1, 0.02, 0.35); b.box('l', 0x111111, kx + 1.65, 1.45, kz - 4.8, 0.1, 0.02, 0.35);
    b.box('m', 0x374151, kx + 4.5, 0, kz - 4.6, 2, 0.95, 1.2); for (const o of [-0.45, 0.45]) b.cyl('x', 0x111827, kx + 4.5 + o, 0.95, kz - 4.6, 0.3, 0.04); b.cyl('x', 0x9ca3af, kx + 4.05, 1.0, kz - 4.6, 0.3, 0.35);
    b.box('m', 0xf8fafc, kx + 7, 0, kz - 4.5, 1.2, 2.6, 1.1); // fridge
    b.box('m', 0x8a5a33, kx, 0, kz - 0.5, 6, 0.95, 1.6); b.box('m', 0xe7e5e4, kx, 0.95, kz - 0.5, 6.2, 0.06, 1.7); solidC(kx, kz - 0.5, 6, 1.6, 1); // island
    for (let i = 0; i < 3; i++) { b.cyl('x', 0x6b7280, kx - 2 + i * 2, 1.0, kz - 0.5, 0.3, 0.12); }
    pumpkin(b, kx - 6.5, kz + 4, 0.4); crate(b, kx + 6.6, kz + 4.2, 0xa8743f); crate(b, kx + 6.6, kz + 3.3, 0x8a5a33); b.box('m', 0x6b3f22, kx - 7.5, 0, kz, 0.4, 2.2, 3); // shelf
    for (let i = 0; i < 4; i++) b.sph('g', AUT[i], kx - 7.4, 1.6, kz - 1 + i * 0.6, 0.16);
    solidC(kx - 4.5, kz - 4.6, 2, 1.2, 1.6); solidC(kx, kz - 4.8, 6, 1, 1); solidC(kx + 4.5, kz - 4.6, 2, 1.2, 1); solidC(kx + 7, kz - 4.5, 1.2, 1.1, 2.6);
    const s = sign("CHEF MIMO'S RATITA KITCHEN", 6, 0.9, { bg: '#be185d', border: '#fde047' }); s.position.set(kx, 4.4, kz + d / 2 + 0.25); scene.add(s);
    SP.kitchen = { x: kx, z: kz + 1.4, name: 'Ratita Kitchen' }; SP.kitchenDoor = { x: 0, z: kz + d / 2 + 2 }; SP.kitchenCam = { x: kx, y: 3.4, z: kz + 4.5, tx: kx, ty: 0.9, tz: kz - 4 }; SP.kcenter = { x: kx, z: kz };
    SP.app = { oven: [kx - 4.5, 1.7, kz - 4], blender: [kx - 1.5, 2.0, kz - 4.8], toaster: [kx + 1.5, 1.5, kz - 4.8], stove: [kx + 4.5, 1.2, kz - 4.6] };
    for (const [x, zz] of [[-10, -36], [10, -36], [-10, -48], [10, -48]]) tree(b, x, zz, r, 0.9); }
  // ---- Torty's Farm (west)
  { const fx = -48, fz = -6; house(b, scene, fx - 12, fz - 8, 9, 7, 0xb91c1c, 0x7f1d1d, PI / 2, "TORTY'S FARM");
    for (let x = fx - 4; x <= fx + 8; x += 3) { b.box('m', 0x6b4a2e, x, 0.01, fz, 1.6, 0.12, 18); }
    SP.crops = []; const kinds = ['pumpkin', 'corn', 'potato', 'cranberry']; let k = 0;
    for (let x = fx - 4; x <= fx + 8; x += 3) { const kind = kinds[k++ % 4]; for (let z = fz - 8; z <= fz + 8; z += 2) SP.crops.push({ x, z, kind }); }
    for (let z = -18; z <= 6; z += 2.4) { b.box('m', 0x8a5a33, fx - 7, 0, z, 0.15, 1.1, 0.15); b.box('m', 0x8a5a33, fx + 11, 0, z, 0.15, 1.1, 0.15); }
    b.box('m', 0x8a5a33, fx - 7, 0.8, -6, 0.06, 0.1, 24); b.box('m', 0x8a5a33, fx + 11, 0.8, -6, 0.06, 0.1, 24);
    hay(b, fx + 12.5, fz + 9); hay(b, fx + 12.5, fz + 10.2, 0.1); hay(b, fx - 8.5, fz - 10);
    // scarecrow
    b.cyl('m', 0x6b3f22, fx + 2, 0, fz + 10.5, 0.07, 2.3); b.box('m', 0x6b3f22, fx + 2, 1.7, fz + 10.5, 1.6, 0.08, 0.08); b.rbox('f', 0x2563eb, fx + 2, 1.2, fz + 10.5, 0.6, 0.7, 0.3); b.sph('g', 0xe3c062, fx + 2, 2.3, fz + 10.5, 0.25); b.add('m', G.cone, 0x8a5a33, fx + 2, 2.55, fz + 10.5, 0, 0, 0, 0.35, 0.3, 0.35);
    b.cyl('x', 0x6b7280, fx - 10, 0, fz + 6, 0.8, 1.0); b.cyl('w', 0x60a5fa, fx - 10, 0.85, fz + 6, 0.72, 0.1); solidC(fx - 10, fz + 6, 1.6, 1.6, 1); // trough
    SP.torty = { x: fx - 6, z: fz + 9, name: 'Torty' };
    for (let i = 0; i < 8; i++) tree(b, -70 + r() * 6, -26 + i * 6, r, 1 + r() * 0.3); }
  // ---- Pie Contest tent (east)
  { const px = 46, pz = -4; b.cyl('x', 0xf8fafc, px - 7, 0, pz - 4, 0.1, 4); b.cyl('x', 0xf8fafc, px + 7, 0, pz - 4, 0.1, 4); b.cyl('x', 0xf8fafc, px - 7, 0, pz + 4, 0.1, 4); b.cyl('x', 0xf8fafc, px + 7, 0, pz + 4, 0.1, 4);
    for (let i = 0; i < 7; i++) b.add('f', G.prism, i % 2 ? 0xffffff : 0xdc2626, px - 6 + i * 2, 4, pz, 0, 0, 0, 2, 1.6, 8.6);
    b.box('m', 0xffffff, px, 0.85, pz - 1.5, 9, 0.1, 1.4); b.box('f', 0xfde68a, px, 0.95, pz - 1.5, 9.2, 0.02, 1.5); solidC(px, pz - 1.5, 9, 1.4, 1);
    for (let i = 0; i < 6; i++) { const x = px - 3.75 + i * 1.5; b.cyl('g', 0xc58a3e, x, 0.97, pz - 1.5, 0.45, 0.12); b.cyl('g', [0xf07b1f, 0x7c2d12, 0xb8432a][i % 3], x, 1.09, pz - 1.5, 0.38, 0.02); }
    b.box('m', 0x6b3f22, px, 0, pz - 3.6, 5, 0.9, 0.8); for (const o of [-1.5, 0, 1.5]) b.cyl('x', 0xfbbf24, px + o, 0.9, pz - 3.6, 0.12, 0.3);
    const s = sign('GRAND PIE CONTEST', 5, 0.9, { bg: '#b91c1c', border: '#fde047' }); s.position.set(px, 3.4, pz + 4.1); scene.add(s);
    SP.pie = { x: px, z: pz + 1, name: 'Pie Contest' }; SP.pieTable = { x: px, z: pz - 0.4 };
    for (let i = 0; i < 6; i++) tree(b, 62 + r() * 5, -24 + i * 7, r, 1.1); hay(b, px - 8, pz + 5, 0.3); hay(b, px + 8, pz + 5, -0.3); }
  // ---- Corn maze (south-west)
  { const ox = -60, oz = 46, N = 7, C = 4; SP.maze = { x: ox + C * N / 2, z: oz - C * N / 2 - 3, name: 'Corn Maze' }; SP.mazeIn = { x: ox + C / 2, z: oz - C * N / 2 + 0.5 };
    const cells = []; for (let i = 0; i < N * N; i++) cells.push({ v: false, e: true, s: true });
    const st = [0]; cells[0].v = true; const mr = rng(77); while (st.length) { const c = st[st.length - 1], cx = c % N, cy = (c / N) | 0; const nb = [];
      if (cx > 0 && !cells[c - 1].v) nb.push([c - 1, 'w']); if (cx < N - 1 && !cells[c + 1].v) nb.push([c + 1, 'e']); if (cy > 0 && !cells[c - N].v) nb.push([c - N, 'n']); if (cy < N - 1 && !cells[c + N].v) nb.push([c + N, 's']);
      if (!nb.length) { st.pop(); continue; } const [n, d] = nb[Math.floor(mr() * nb.length)]; cells[n].v = true;
      if (d === 'e') cells[c].e = false; else if (d === 'w') cells[n].e = false; else if (d === 's') cells[c].s = false; else cells[n].s = false; st.push(n); }
    const x0 = ox, z0 = oz - C * N; // top-left; maze spans z0..oz
    const wall = (ax, az, bx, bz) => { const w = Math.abs(bx - ax) + 0.8, d = Math.abs(bz - az) + 0.8, cx = (ax + bx) / 2, cz = (az + bz) / 2; b.box('f', 0x8fa040, cx, 0, cz, w, 2.6, d); b.box('f', 0xc9c26a, cx, 2.6, cz, w * 0.9, 0.25, d * 0.9);
      const L = Math.max(w, d); for (let t = 0; t < L; t += 0.9) { const xx = w > d ? ax + t : cx + 0.42 * (t % 1.8 > 0.9 ? 1 : -1), zz = w > d ? cz + 0.42 * (t % 1.8 > 0.9 ? 1 : -1) : az + t; b.add('g', G.sph, 0xf2c14e, xx, 1.3 + (t % 0.7), zz, 0, 0, 0, 0.07, 0.2, 0.07); }
      solid(cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, 0, 2.6, null, 'corn'); };
    // outer: gap at entrance (cell 0 north) and exit (last cell south)
    wall(x0 + C, z0, x0 + C * N, z0); wall(x0, z0 + C * N, x0 + C * (N - 1), z0 + C * N); wall(x0, z0, x0, z0 + C * N); wall(x0 + C * N, z0, x0 + C * N, z0 + C * N);
    for (let i = 0; i < N * N; i++) { const cx = i % N, cy = (i / N) | 0; const X = x0 + cx * C, Z = z0 + cy * C;
      if (cells[i].e && cx < N - 1) wall(X + C, Z, X + C, Z + C); if (cells[i].s && cy < N - 1) wall(X, Z + C, X + C, Z + C); }
    SP.mazeCorn = [[2, 4], [5, 1], [4, 5]].map(([cx, cy]) => ({ x: x0 + cx * C + C / 2, z: z0 + cy * C + C / 2 }));
    SP.mazeExit = { x: x0 + C * (N - 0.5), z: oz + 1.5 }; SP.mazeBox = [x0, z0, x0 + C * N, oz];
    const s = sign('A-MAIZE-ING CORN MAZE', 4.4, 0.8, { bg: '#4d7a2a', border: '#fde047' }); s.position.set(x0 + C / 2, 3.2, z0 - 0.6); scene.add(s); b.box('m', 0x6b3f22, x0 + 0.3, 0, z0 - 0.6, 0.2, 3, 0.2); b.box('m', 0x6b3f22, x0 + C - 0.3, 0, z0 - 0.6, 0.2, 3, 0.2);
    hay(b, x0 - 2, z0 - 2); hay(b, x0 + C + 2, z0 - 2, 0.2); pumpkin(b, x0 - 1, z0 - 3.5); pumpkin(b, x0 + C + 1.2, z0 - 3.4, 0.35); }
  // ---- Parade avenue (south): bleachers, TV stage, arches, workshop
  SP.arches = []; { const az = 34;
    for (let x = -66; x <= 66; x += 22) { const gap = (Math.floor(Math.abs(x) / 11) % 3) - 1; SP.arches.push({ x, gap: gap * 2.4 });
      b.box('x', 0x2f3437, x, 0, az - 4.6, 0.3, 7.5, 0.3); b.box('x', 0x2f3437, x, 0, az + 4.6, 0.3, 7.5, 0.3); b.box('x', 0x2f3437, x, 7.5, az, 0.3, 0.3, 9.5);
      // hanging banner leaves a gap where the balloon must pass
      for (const zz of [-3.4, -1.0, 1.4, 3.8]) if (Math.abs(zz - 0.2 - gap * 2.4) > 1.6) b.box('f', AUT[(x + 66) / 22 % 5 | 0], x, 5.6, az + zz - 0.2, 0.08, 1.9, 2.2);
      solidC(x, az - 4.6, 0.4, 0.4, 7); solidC(x, az + 4.6, 0.4, 0.4, 7); }
    for (let x = -60; x <= 60; x += 11) { if (Math.abs(x) < 4) continue; for (let k = 0; k < 3; k++) b.box('m', 0x8a5a33, x, k * 0.45, az + 7 + k * 0.8, 8, 0.45, 0.8); solidC(x, az + 7.8, 8, 2.4, 1.4); lamp(b, x + 5.5, az - 5.6); }
    // TV stage
    b.box('m', 0x1e293b, 0, 0, az - 9, 10, 0.8, 4); b.box('x', 0x334155, -3, 0.8, az - 10, 0.3, 3, 0.3); b.box('x', 0x334155, 3, 0.8, az - 10, 0.3, 3, 0.3); solidC(0, az - 9, 10, 4, 0.8);
    b.box('x', 0x111827, 4, 0.8, az - 8, 0.6, 0.6, 0.9); b.cyl('x', 0x6b7280, 4, 0.8, az - 8, 0.06, 0.5); b.sph('l', 0xef4444, 4.2, 1.5, az - 7.6, 0.05, 0.05, 0.05, 2);
    { const s = sign('TORTUGA TV NETWORK · LIVE', 6, 1, { bg: '#0f766e', border: '#5ef2ff' }); s.position.set(0, 4.4, az - 10.1); s.rotation.y = 0; scene.add(s); }
    // float workshop garage (east end)
    house(b, scene, 76, 26, 10, 8, 0xe5e7eb, 0x0f766e, -PI / 2, 'FLOAT WORKSHOP'); SP.workshop = { x: 70, z: 31, name: 'Float Workshop' }; SP.parade0 = { x: 64, z: 34 }; SP.paradeEnd = -68;
    // Tortuga Tech broken float near square (turkey chase start)
    b.rbox('m', 0x0f766e, 24, 0, 24, 5, 1.2, 2.6); b.box('l', 0x5ef2ff, 24, 1.2, 24, 4.6, 0.08, 2.2, 0, 0.6); b.cyl('x', 0x111827, 22.2, 0.35, 25.4, 0.4, 0.3, PI / 2); b.cyl('x', 0x111827, 25.8, 0.35, 25.4, 0.4, 0.3, PI / 2);
    b.rbox('m', 0xfbbf24, 24, 1.3, 24, 1.6, 1.6, 1.4); b.box('x', 0x111827, 23.3, 2.9, 24, 0.1, 0.8, 0.1); solidC(24, 24, 5, 2.6, 2);
    { const s = sign('TORTUGA TECH', 3, 0.6, { bg: '#0f766e', border: '#5ef2ff' }); s.position.set(24, 1.0, 25.32); scene.add(s); } SP.chase = { x: 24, z: 21, name: 'Tortuga Tech Float' }; }
  // chase course waypoints across town with hay hurdles + pumpkin lanes
  SP.chasePath = [[24, 18], [16, 14], [16, -16], [30, -18], [40, -10], [40, 10], [30, 18], [-8, 18], [-18, 24], [-36, 18], [-38, -2], [-30, -18], [-6, -18], [6, -16], [16, 14], [24, 18]];
  SP.hurdles = [[16, 0], [35, -14], [40, 0], [10, 18], [-28, 21], [-38, 8], [-18, -18]];
  for (const [x, z] of SP.hurdles) { b.rbox('m', 0xe3c062, x, 0, z, 2.4, 0.55, 0.7, Math.abs(x) === 40 || x === 16 || x === -38 ? PI / 2 : 0); }
  // ring of autumn trees around the town edge, tidy rows
  for (let a = 0; a < 56; a++) { const t = a / 56 * PI * 2, R = 88 + r() * 4; tree(b, Math.cos(t) * R, Math.sin(t) * R, r, 1.2 + r() * 0.4); }
  for (const [x, z] of [[-18, -6], [18, 6], [-17, 26], [17, -28], [-30, -26], [32, 20], [-6, 26], [40, 22]]) tree(b, x, z, r);
  // ---- live-event decor
  SP.leaves = [];
  if (phase === 'pre') { for (let i = 0; i < 40; i++) { const x = (r() - 0.5) * 80, z = (r() - 0.5) * 60; if (Math.abs(x) < 4 && Math.abs(z) < 4) continue; if (Math.abs(z - 34) < 6 || (Math.abs(x) < 16 && Math.abs(z) < 16)) continue; SP.leaves.push({ x, z }); } for (const [x, z] of [[-16, 9], [17, 8], [-17, -9], [17, -10], [-8, 17], [8, 21], [-16, 24]]) SP.leaves.push({ x, z }); }
  if (phase === 'post') { for (let i = 0; i < 18; i++) { const x = (r() - 0.5) * 40, z = 30 + (r() - 0.5) * 6; b.box('f', AUT[i % 5], x, 0.02, z, 0.3, 0.02, 0.2, r() * 3); } for (const x of [-30, -8, 14, 36]) { b.cyl('x', 0x15803d, x, 0, 29.4, 0.4, 1.1); } }
  if (phase === 'day' || phase === 'post') { // bunting across the square + avenue
    for (let i = -14; i <= 14; i += 1.4) { b.add('f', G.cone, AUT[(i * 5 | 0) & 3], i, 4.2 - Math.cos(i / 14 * PI / 2) * 0.6, -13, PI, 0, 0, 0.3, 0.5, 0.05); b.add('f', G.cone, AUT[(i * 3 | 0) & 3], i, 4.2 - Math.cos(i / 14 * PI / 2) * 0.6, 13, PI, 0, 0, 0.3, 0.5, 0.05); }
    for (const [x, z] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) { pumpkin(b, x + 1, z, 0.5); hay(b, x + 1.2, z + (z > 0 ? -1.4 : 1.4)); }
  }
  if (phase === 'day') { for (let x = -60; x <= 60; x += 5) b.add('g', G.sph, AUT[(x / 5 + 20) % 5 | 0], x, 8.2, 34 + ((x / 5) % 2 ? 4.4 : -4.4), 0, 0, 0, 0.5, 0.6, 0.5); }
  for (const [x, z, ry] of [[-8, -4, PI / 2], [8, 3, -PI / 2]]) pumpkinStand(b, x, z, ry);
  cart(b, -7, 3.5, 0, 'pumpkins'); cart(b, 7, -5, PI, 'apples'); haystack(b, -9.5, -9, 0, 3);
  fillTown(b, scene, r, phase);
  b.finish(scene);
  return SP;
}
