// Frostpaw Falls: Candy's snowy hometown + Sled Hill (Turbo engine). Batched props, AABB colliders, heightfield hill, race course.
import * as THREE from 'three';
import { Batch, G, solid, solidC, sign, PI } from './kit.js';
import { MATS } from './mats.js';
import { rng } from './util.js';
export const SP = { houses: [], doors: [], gates: [], rocks: [], ramps: [] };
// ---------- terrain ----------
export const HILL0 = -46, COURSE_Z0 = -244, COURSE_Z1 = -58;
export function H(x, z) { let h = 0; const s = HILL0 - z;
  if (s > 0) { h = 0.28 * (s - 9 * (1 - Math.exp(-s / 9))); h += 0.7 * Math.sin(x * 0.13 + 1) * Math.sin(z * 0.09) * Math.min(1, s / 25); const ax = Math.abs(x) - 44; if (ax > 0) h += 0.03 * ax * ax; }
  const e = Math.max(Math.abs(x) - 66, z - 60, 0); if (e > 0) h += Math.min(14, 0.08 * e * e); return h; }
export function cx(z) { const k = Math.min(1, Math.max(0, (-52 - z) / 22)); return 11 * Math.sin((z + 52) / 17) * k + 4 * Math.sin((z + 52) / 41) * k; }
export const onCourse = (x, z) => z < -50 && z > COURSE_Z0 - 8 && Math.abs(x - cx(z)) < 8.5;
const solidH = (x, z, w, d, hgt) => { const y = H(x, z); return solid(x - w / 2, z - d / 2, x + w / 2, z + d / 2, y - 0.5, y + hgt); };
// ---------- props ----------
function pine(b, x, z, s = 1, y = 0, snow = true) { b.cyl('m', 0x5b3a24, x, y, z, 0.22 * s, 1.3 * s, 0, 0, 0, true);
  const greens = [0x1f5a3a, 0x24653f, 0x1b4f34];
  for (let i = 0; i < 3; i++) { const yy = y + (1.0 + i * 1.05) * s, r = (1.75 - i * 0.45) * s; b.add('f', G.cone, greens[i], x, yy + 0.8 * s, z, 0, i, 0, r, 1.9 * s, r); if (snow) b.add('m', G.cone, 0xf5f9ff, x, yy + 1.25 * s, z, 0, i, 0, r * 0.62, 1.0 * s, r * 0.62); } }
function lamp(b, x, z) { b.cyl('x', 0x2b3340, x, 0, z, 0.09, 3.8, 0, 0, 0, true); b.box('x', 0x2b3340, x, 3.7, z, 0.5, 0.08, 0.5); b.sph('l', 0xffd59a, x, 4.0, z, 0.3, 0.32, 0.3, 1.3); b.add('m', G.cone, 0xf5f9ff, x, 4.45, z, 0, 0, 0, 0.36, 0.3, 0.36); solidC(x, z, 0.3, 0.3, 3.8); }
function bench(b, x, z, ry) { b.box('m', 0x7a4a2a, x, 0.42, z, 1.8, 0.08, 0.5, ry); b.box('x', 0x2b3340, x, 0, z, 1.6, 0.42, 0.4, ry); b.box('m', 0xf5f9ff, x, 0.5, z, 1.7, 0.06, 0.42, ry); }
function snowman(b, x, z, s = 1, ry = 0) { b.sph('m', 0xf8fbff, x, 0.55 * s, z, 0.62 * s); b.sph('m', 0xf8fbff, x, 1.35 * s, z, 0.45 * s); b.sph('m', 0xf8fbff, x, 1.95 * s, z, 0.32 * s);
  const fx = Math.sin(ry), fz = Math.cos(ry); b.add('g', G.cone, 0xf97316, x + fx * 0.36 * s, 1.95 * s, z + fz * 0.36 * s, PI / 2, ry, 0, 0.06 * s, 0.3 * s, 0.06 * s);
  for (const k of [-1, 1]) b.sph('g', 0x111827, x + fx * 0.28 * s + fz * k * 0.11 * s, 2.03 * s, z + fz * 0.28 * s - fx * k * 0.11 * s, 0.04 * s);
  b.cyl('f', 0xdc2626, x, 1.65 * s, z, 0.36 * s, 0.14 * s); b.cyl('m', 0x1f2937, x, 2.2 * s, z, 0.24 * s, 0.32 * s); b.cyl('m', 0x1f2937, x, 2.2 * s, z, 0.36 * s, 0.04 * s); solidC(x, z, 1.0 * s, 1.0 * s, 2.2 * s); }
function bank(b, x, z, w, d) { b.sph('m', 0xeef4fb, x, 0.05, z, w / 2, 0.55, d / 2); }
function fenceRun(b, x0, z0, x1, z1) { const L = Math.hypot(x1 - x0, z1 - z0), ry = -Math.atan2(z1 - z0, x1 - x0), n = Math.max(1, Math.round(L / 1.6));
  for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; b.box('m', 0x7a4a2a, x, 0, z, 0.14, 1.1, 0.14); b.box('m', 0xf5f9ff, x, 1.1, z, 0.18, 0.08, 0.18); }
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2; b.box('m', 0x8a5a33, mx, 0.75, mz, L, 0.1, 0.06, ry); b.box('m', 0x8a5a33, mx, 0.4, mz, L, 0.1, 0.06, ry); b.box('m', 0xf5f9ff, mx, 0.8, mz, L, 0.05, 0.1, ry); }
function crate(b, x, z, col = 0x8a5a33) { b.rbox('m', col, x, 0, z, 0.8, 0.6, 0.6); b.box('m', 0xf5f9ff, x, 0.6, z, 0.78, 0.06, 0.58); }
const LIGHTS = [0xff4d4d, 0x4ade80, 0xfacc15, 0x60a5fa, 0xf472b6];
// winter house: front faces +z when ry=0. lit windows, snowy roof, chimney, wreath, string lights
function house(b, scene, x, z, w, d, col, roof, ry, label, o = {}) {
  const cos = Math.cos(ry), sin = Math.sin(ry); const P = (lx, lz) => [x + lx * cos + lz * sin, z - lx * sin + lz * cos]; const hh = o.h || 4.4;
  b.add('m', G.box, col, x, hh / 2, z, 0, ry, 0, w, hh, d); b.add('m', G.box, 0xe5e7eb, x, 0.2, z, 0, ry, 0, w + 0.12, 0.4, d + 0.12);
  b.add('m', G.prism, roof, x, hh, z, 0, ry, 0, w + 0.7, 2.3, d + 0.7); b.add('m', G.prism, 0xf6f9ff, x, hh + 0.22, z, 0, ry, 0, w + 0.78, 2.2, d + 0.5); // snow cap
  let [px, pz] = P(w / 3, -d / 5); b.add('m', G.box, 0x9a4a3a, px, hh + 1.6, pz, 0, ry, 0, 0.7, 1.8, 0.7); b.add('m', G.box, 0xf6f9ff, px, hh + 2.5, pz, 0, ry, 0, 0.8, 0.14, 0.8);
  [px, pz] = P(0, d / 2 + 0.03); b.add('m', G.box, o.door || 0x7f1d1d, px, 1.15, pz, 0, ry, 0, 1.3, 2.3, 0.1); b.add('l', G.box, 0xffd27a, px, 2.45, pz, 0, ry, 0, 1.0, 0.25, 0.06, 0.6);
  [px, pz] = P(0, d / 2 + 0.12); b.add('f', G.ico, 0x166534, px, 1.75, pz, 0, 0, 0, 0.32, 0.32, 0.1); b.add('g', G.ico, 0xdc2626, px, 1.5, pz, 0, 0, 0, 0.08, 0.08, 0.08);
  const wins = o.wins || [-w / 3, w / 3]; for (const lx of wins) { [px, pz] = P(lx, d / 2 + 0.04); b.add('l', G.box, 0xffc870, px, 2.3, pz, 0, ry, 0, 1.0, 1.0, 0.05, 0.55); [px, pz] = P(lx, d / 2 + 0.07); b.add('m', G.box, 0xf8fafc, px, 2.3, pz, 0, ry, 0, 0.08, 1.0, 0.04); b.add('m', G.box, 0xf8fafc, px, 2.3, pz, 0, ry, 0, 1.0, 0.08, 0.04); [px, pz] = P(lx, d / 2 + 0.2); b.add('m', G.box, 0x5b3a24, px, 1.7, pz, 0, ry, 0, 1.2, 0.12, 0.35); b.add('m', G.box, 0xf6f9ff, px, 1.78, pz, 0, ry, 0, 1.2, 0.1, 0.33); }
  if (o.up) for (const lx of wins) { [px, pz] = P(lx, d / 2 + 0.04); b.add('l', G.box, 0xffd9a0, px, 4.6, pz, 0, ry, 0, 0.9, 0.8, 0.05, 0.45); }
  const n = Math.round(w / 0.7); for (let i = 0; i <= n; i++) { const lx = -w / 2 - 0.2 + (w + 0.4) * i / n; [px, pz] = P(lx, d / 2 + 0.38); b.add('l', G.ico, LIGHTS[i % 5], px, hh - 0.05, pz, 0, 0, 0, 0.09, 0.11, 0.09, 1.2); }
  const hw = Math.abs(w / 2 * cos) + Math.abs(d / 2 * sin), hd = Math.abs(w / 2 * sin) + Math.abs(d / 2 * cos); solid(x - hw, z - hd, x + hw, z + hd, 0, hh + 2.5);
  [px, pz] = P(0, d / 2 + 1.6); const door = { x: px, z: pz, ry, name: label || o.name };
  if (label) { const s = sign(label, Math.min(w - 0.6, 4.4), 0.7, { bg: o.sbg || '#7f1d1d', border: o.sbd || '#fde68a' }); [px, pz] = P(0, d / 2 + 0.08); s.position.set(px, hh - 0.75, pz); s.rotation.y = ry; scene.add(s); }
  return door; }
function stall(b, scene, x, z, ry, aw, label) { const cos = Math.cos(ry), sin = Math.sin(ry); const P = (lx, lz) => [x + lx * cos + lz * sin, z - lx * sin + lz * cos];
  b.add('m', G.box, 0x8a5a33, x, 0.55, z, 0, ry, 0, 3, 1.1, 1.1); b.add('m', G.box, 0xf6f9ff, x, 1.12, z, 0, ry, 0, 3.05, 0.06, 1.15);
  for (const lx of [-1.4, 1.4]) { const [px, pz] = P(lx, -0.4); b.add('m', G.box, 0x6b3f22, px, 1.4, pz, 0, ry, 0, 0.12, 2.8, 0.12); }
  for (let i = 0; i < 6; i++) { const [px, pz] = P(-1.25 + i * 0.5, 0); b.add('f', G.box, i % 2 ? 0xffffff : aw, px, 2.85, pz, 0.35, ry, 0, 0.5, 0.06, 1.7); }
  let [px, pz] = P(0, -0.35); b.add('f', G.box, 0xf6f9ff, px, 3.05, pz, 0.35, ry, 0, 3.1, 0.08, 1.2);
  const s = sign(label, 2.6, 0.45, { bg: '#0c4a6e', border: '#e0f2fe' }); [px, pz] = P(0, 0.6); s.position.set(px, 2.2, pz); s.rotation.y = ry; scene.add(s); solidC(x, z, Math.abs(3 * cos) + Math.abs(1.1 * sin), Math.abs(3 * sin) + Math.abs(1.1 * cos), 2); }
export function buildWorld(scene) {
  const r = rng(1209); const b = new Batch(24);
  // ---- snowy heightfield ground (vertex-coloured, one mesh)
  { const W = 150, L = 340, g = new THREE.PlaneGeometry(W, L, 75, 170); g.rotateX(-PI / 2); g.translate(0, 0, -105); const p = g.attributes.position, c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, H(x, z) - 0.02); const n = 0.94 + 0.05 * Math.sin(x * 1.7 + z * 0.9) * Math.sin(z * 1.3 - x * 0.4); const blu = onCourse(x, z) ? 0.97 : 1; c[i * 3] = 0.9 * n * blu; c[i * 3 + 1] = 0.94 * n; c[i * 3 + 2] = 1.0 * n; }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals(); const m = new THREE.Mesh(g, MATS.m); m.receiveShadow = true; scene.add(m); SP.ground = m; }
  // ---- roads (packed snow + cobbles), plaza
  b.box('m', 0xaeb7c7, 0, 0, 0, 30, 0.04, 30);
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) if ((i + j) & 1) b.box('m', 0xbcc5d3, i * 4, 0.01, j * 4, 3.9, 0.03, 3.9);
  b.box('m', 0xc9d1de, 0, 0.005, -30, 8, 0.03, 32); b.box('m', 0xc9d1de, 0, 0.005, 36, 8, 0.03, 44); b.box('m', 0xc9d1de, 39, 0.005, 0, 48, 0.03, 7); b.box('m', 0xc9d1de, -39, 0.005, 0, 48, 0.03, 7);
  for (let z = -44; z <= 56; z += 4) if (Math.abs(z) > 16) { b.box('m', 0xb3bccb, -2.6, 0.02, z, 0.5, 0.02, 1.8); b.box('m', 0xb3bccb, 2.6, 0.02, z + 2, 0.5, 0.02, 1.8); }
  // ---- the town tree on the plaza
  { b.cyl('m', 0x9ca3af, 0, 0, 0, 3.2, 0.6); b.cyl('m', 0xf6f9ff, 0, 0.6, 0, 3.1, 0.08); b.cyl('m', 0x5b3a24, 0, 0.6, 0, 0.5, 2);
    for (let i = 0; i < 5; i++) { const y = 2 + i * 2, rr = 3.4 - i * 0.62; b.add('f', G.cone, i % 2 ? 0x1f5a3a : 0x24653f, 0, y + 1.6, 0, 0, i, 0, rr, 3.4, rr); b.add('m', G.cone, 0xf6f9ff, 0, y + 2.6, 0, 0, i, 0, rr * 0.45, 1.3, rr * 0.45);
      const nn = 10 - i * 1.5; for (let k = 0; k < nn; k++) { const a = k / nn * PI * 2 + i, rad = rr * 0.86; b.add('l', G.ico, LIGHTS[(k + i) % 5], Math.cos(a) * rad, y + 0.6, Math.sin(a) * rad, 0, 0, 0, 0.16, 0.16, 0.16, 1.4); } }
    b.add('l', G.ico, 0xffe066, 0, 13.6, 0, 0, 0, 0, 0.7, 0.7, 0.25, 1.6); solidC(0, 0, 6.4, 6.4, 13);
    for (const [x, z, c] of [[2.4, 2.2, 0xdc2626], [-2.6, 1.8, 0x2563eb], [1.6, -2.6, 0x16a34a], [-2.2, -2.4, 0xa855f7], [3.0, -0.6, 0xf59e0b]]) { b.rbox('g', c, x, 0.6, z, 0.8, 0.6, 0.8); b.box('g', 0xfde047, x, 0.6, z, 0.84, 0.62, 0.16); } }
  { const s = sign('FROSTPAW FALLS', 6, 1.1, { bg: '#0c4a6e', border: '#e0f2fe' }); s.position.set(0, 5.6, 15.2); scene.add(s); const s2 = s.clone(); s2.rotation.y = PI; s2.position.z = 14.8; scene.add(s2);
    b.box('m', 0x7a4a2a, -3.3, 0, 15, 0.3, 6.4, 0.3); b.box('m', 0x7a4a2a, 3.3, 0, 15, 0.3, 6.4, 0.3); b.box('m', 0xf6f9ff, 0, 6.35, 15, 7, 0.2, 0.4); solidC(-3.3, 15, 0.3, 0.3, 6); solidC(3.3, 15, 0.3, 0.3, 6); }
  for (const [x, z] of [[-14, -14], [14, -14], [-14, 14], [14, 14], [-14, -5], [14, 5]]) lamp(b, x, z);
  for (let z = -42; z <= 54; z += 12) if (Math.abs(z) > 18) { lamp(b, -5, z); lamp(b, 5, z + 6); }
  for (let x = 22; x <= 62; x += 12) { lamp(b, x, -4.4); lamp(b, -x, 4.4); }
  bench(b, -7, -11, 0); bench(b, 7, -11, 0); bench(b, -11, 7, PI / 2); bench(b, 11, 7, PI / 2); bench(b, -7, 11, 0); bench(b, 7, 11, 0);
  stall(b, scene, -10, 10.5, PI, 0xdc2626, 'HOT CHESTNUTS'); stall(b, scene, 10, -10.5, 0, 0x2563eb, 'MITTENS & SCARVES');
  // ---- buildings (doors open in a later update; door spots are kept)
  const D = (k, d) => { d.id = k; SP.doors.push(d); return d; };
  SP.cocoa = D('cocoa', house(b, scene, -13.5, -25, 10, 7.5, 0x7c4a32, 0x3f2a1d, PI / 2, "CANDY'S COCOA CO.", { sbg: '#78350f', wins: [-3.3, 0, 3.3], up: false, door: 0xfbbf24 }));
  // cocoa serving hatch + awning + mugs
  { const hx = -9.6, hz = -21.5; b.box('m', 0x5b3a24, hx, 0, hz, 0.9, 1.15, 2.4); b.box('m', 0xf6f9ff, hx, 1.15, hz, 0.95, 0.06, 2.45); b.box('l', 0xffc870, -9.72, 1.3, hz, 0.06, 1.2, 2.2, 0, 0.5);
    for (let i = 0; i < 4; i++) { b.cyl('g', [0xdc2626, 0xffffff, 0x16a34a, 0xffffff][i], hx, 1.2, hz - 0.9 + i * 0.6, 0.12, 0.22); b.cyl('m', 0x6b3a1f, hx, 1.41, hz - 0.9 + i * 0.6, 0.1, 0.02); }
    for (let i = 0; i < 6; i++) b.add('f', G.box, i % 2 ? 0xffffff : 0x92400e, -9.1, 2.6, hz - 1.25 + i * 0.5, 0, 0, -0.4, 1.4, 0.06, 0.5); SP.hatch = { x: -8.2, z: hz, name: 'Cocoa hatch' }; solidC(hx, hz, 0.9, 2.4, 1.2); }
  SP.lodge = D('lodge', house(b, scene, 14.5, -27, 13, 9, 0x8b5a2b, 0x2f3b4c, -PI / 2, 'SNOWPINE LODGE', { h: 6.2, up: true, wins: [-4.2, 0, 4.2], sbg: '#1e3a5f' }));
  SP.shack = D('shack', house(b, scene, -14, -48, 7, 6, 0xb91c1c, 0x1f2937, PI / 2, 'HILL SHACK', { sbg: '#1f2937', h: 3.6, wins: [-2] }));
  SP.raceSpot = { x: -8.6, z: -47.2, name: 'Hill Shack (races)' };
  b.box('m', 0x8a5a33, -9.2, 0, -50.5, 0.12, 2.4, 0.12); { const s = sign('🛷 RACES →', 1.6, 0.5, { bg: '#b91c1c' }); s.position.set(-9.2, 2.1, -50.4); scene.add(s); }
  SP.lot = { x: -31, z: -14, name: 'Tree Lot' };
  // tree lot: fenced, rows of cut pines in stands, little hut with lights
  fenceRun(b, -40, -9, -22, -9); fenceRun(b, -40, -22, -22, -22); fenceRun(b, -40, -22, -40, -9); solid(-40.2, -9.2, -24, -8.8, 0, 1.2); solid(-40.2, -22.2, -22, -21.8, 0, 1.2); solid(-40.2, -22, -39.8, -9, 0, 1.2);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const x = -37 + i * 3.2, z = -19.5 + j * 3.4; pine(b, x, z, 0.55, 0.2, j !== 1); b.box('m', 0x7a4a2a, x - 0.4, 0, z - 0.1, 0.8, 0.25, 0.25); solidC(x, z, 0.8, 0.8, 2); }
  house(b, scene, -26, -18, 4, 3.4, 0x166534, 0x7f1d1d, -PI / 2, 'TREE LOT', { h: 2.8, wins: [0.9], sbg: '#14532d' });
  // rink: ice oval, boards, lights
  SP.rink = { x: 32, z: 20, name: 'Skating Rink' };
  { const ice = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshPhysicalMaterial({ color: 0xbfe3ff, roughness: 0.06, metalness: 0, clearcoat: 1 })); ice.scale.set(10, 6, 1); ice.rotation.x = -PI / 2; ice.position.set(32, 0.05, 20); ice.receiveShadow = true; scene.add(ice);
    for (let i = 0; i < 40; i++) { const a = i / 40 * PI * 2, x = 32 + Math.cos(a) * 10.4, z = 20 + Math.sin(a) * 6.4; if (Math.abs(a - PI * 1.5) < 0.18) continue; b.box('g', i % 2 ? 0xdc2626 : 0xffffff, x, 0, z, 1.7, 0.75, 0.18, -a + PI / 2); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + 0.2; lamp(b, 32 + Math.cos(a) * 11.6, 20 + Math.sin(a) * 7.6); }
    const sg = sign('FROSTPAW RINK', 3.2, 0.6, { bg: '#1e3a8a', border: '#bfdbfe' }); sg.position.set(32, 2.2, 13.2); scene.add(sg); b.box('m', 0x2b3340, 30.4, 0, 13.25, 0.12, 2, 0.12); b.box('m', 0x2b3340, 33.6, 0, 13.25, 0.12, 2, 0.12); }
  // ---- homes (delivery addresses)
  const COLS = [0x2563eb, 0x0f766e, 0xb45309, 0x7c3aed, 0xbe123c, 0x15803d, 0x0e7490, 0xa16207, 0x9333ea, 0x1d4ed8, 0xc2410c, 0x047857, 0x6d28d9, 0x9f1239];
  const ROOFS = [0x1f2937, 0x7f1d1d, 0x334155, 0x3f2a1d];
  const HN = [['Gouda Cottage', 'Grandma Gouda'], ['Cheddar House', 'Grandpa Cheddar'], ['Brie Bungalow', 'Brie'], ['Blue Door', 'Mr. Blue'], ['Rose Cottage', 'Mrs. Rose'], ['Ash Cabin', 'Old Ash'], ['Ginger Place', 'Ginger'], ['Cocoa Corner', 'Little Cocoa'], ['Cream Cottage', 'Baker Cream'], ['Gold Gables', 'Goldie'], ['Brownie Barn', 'Farmer Brownie'], ['Pepper House', 'Pepper'], ['Midnight Manor', 'Black'], ['Snowdrop Hut', 'Dot']];
  const homes = [[-12, 22, PI / 2], [12, 24, -PI / 2], [-12, 34, PI / 2], [12, 36, -PI / 2], [-12, 46, PI / 2], [12, 48, -PI / 2], [26, -12, 0], [40, -12, 0], [54, -12, 0], [52, 12, PI], [-26, 12, PI], [-40, 12, PI], [-54, 12, PI], [-52, -13, 0]];
  homes.forEach(([x, z, ry], i) => { const w = 7 + (i % 3) * 0.6, d = 6 + (i % 2) * 0.6; const dd = house(b, scene, x, z, w, d, COLS[i % COLS.length], ROOFS[i % 4], ry, null, { up: i % 3 === 0, h: 4.2 + (i % 3 === 0 ? 1.4 : 0) });
    dd.name = HN[i][0]; dd.who = HN[i][1]; dd.no = i + 1; SP.houses.push(dd);
    const s = sign(String(i + 1), 0.6, 0.45, { bg: '#f8fafc', fg: '#0f172a', border: '#0f172a', glow: 0.2 }); const c = Math.cos(ry), sn = Math.sin(ry); s.position.set(x + (w / 2 - 0.8) * c + (d / 2 + 0.07) * sn, 2.9, z - (w / 2 - 0.8) * sn + (d / 2 + 0.07) * c); s.rotation.y = ry; scene.add(s);
    // yard: mailbox, snowman or sled, bushes with snow
    const yx = x + (d / 2 + 2.6) * sn + 2.6 * c, yz = z + (d / 2 + 2.6) * c - 2.6 * sn; b.cyl('m', 0x7a4a2a, yx, 0, yz, 0.06, 1.0, 0, 0, 0, true); b.rbox('g', 0x1d4ed8, yx, 1.0, yz, 0.5, 0.35, 0.3); b.box('m', 0xf6f9ff, yx, 1.35, yz, 0.52, 0.06, 0.32);
    const sx = x + (d / 2 + 3.2) * sn - 2.8 * c, sz = z + (d / 2 + 3.2) * c + 2.8 * sn; if (i % 3 === 0) snowman(b, sx, sz, 0.75, ry); else if (i % 3 === 1) { b.box('m', 0xb91c1c, sx, 0.08, sz, 0.6, 0.08, 1.4, ry); b.box('m', 0x8a5a33, sx, 0.2, sz, 0.55, 0.06, 1.2, ry); } else { b.sph('f', 0x1f5a3a, sx, 0.4, sz, 0.6, 0.5, 0.6); b.sph('m', 0xf6f9ff, sx, 0.75, sz, 0.5, 0.2, 0.5); solidC(sx, sz, 1, 1, 1); } });
  // ---- dressing: snowbanks along roads, pines around town, snowmen, crates, sleds
  for (let z = -40; z <= 56; z += 5.5) if (Math.abs(z) > 17) { bank(b, -4.9, z + r() * 2, 1.4, 3.4); bank(b, 4.9, z + r() * 2, 1.4, 3.4); }
  for (let x = 20; x <= 62; x += 6) { bank(b, x + r() * 2, -3.9, 3.2, 1.2); bank(b, -x - r() * 2, 3.9, 3.2, 1.2); }
  const townPines = []; for (let i = 0; i < 70; i++) { const a = r() * PI * 2, d = 62 + r() * 6; townPines.push([Math.cos(a) * d * 1.0, Math.sin(a) * d * 0.9 + 6]); }
  for (let x = -60; x <= 60; x += 7) townPines.push([x + r() * 3, 57 + r() * 3]);
  for (const [x, z] of [[-22, 28], [-24, 40], [22, 30], [24, 44], [-30, 26], [30, 32], [-62, -2], [62, 2], [44, 30], [56, 26], [-46, 30], [-58, 26], [46, -26], [60, -24], [-48, -28], [-60, -26], [30, -28], [-22, -36], [24, -40], [36, -36], [-36, -38], [50, -38], [-52, -40]]) townPines.push([x, z]);
  for (const [x, z] of townPines) { if (z < HILL0 + 2 || Math.abs(x) > 70 || z > 62) continue; const s = 0.8 + r() * 0.6; pine(b, x, z, s, 0); solidC(x, z, 0.9, 0.9, 4); }
  for (const [x, z, s, ry] of [[-18, 6, 1, 0.3], [20, -6, 0.9, -0.4], [-8, -40, 0.8, 0.6], [18, 42, 0.9, -1.2], [44, 6, 0.8, 2.5], [-48, -6, 1, 0.4]]) snowman(b, x, z, s, ry);
  for (const [x, z] of [[-9, -17], [-9.2, -18.2], [-8.4, -17.6], [9.4, -34], [9.8, -35], [-9, -42]]) crate(b, x, z);
  // ---- Sled Hill: race course, gates, ramps, rocks, pine forest, chairlift
  for (let z = -58, i = 0; z > COURSE_Z0; z -= 15, i++) { const c = cx(z); if (z > -66 || z < COURSE_Z0 + 14) continue; const col = i % 2 ? 0x2563eb : 0xdc2626;
    for (const k of [-1, 1]) { const x = c + k * 4.2, y = H(x, z); b.cyl('x', 0x111827, x, y, z, 0.07, 2.2, 0, 0, 0, true); b.box('f', col, x - k * 0.45, y + 1.5, z, 0.9, 0.6, 0.04); }
    SP.gates.push({ z, x: c, col }); }
  SP.gates.sort((a, b) => a.z - b.z);
  const st = COURSE_Z0, cst = cx(st), yst = H(cst, st);
  { for (const k of [-1, 1]) b.box('m', 0x7a4a2a, cst + k * 6, yst - 0.5, st, 0.4, 4.4, 0.4); b.box('m', 0xb91c1c, cst, yst + 3.6, st, 12.4, 0.5, 0.3); const sg = sign('START', 3, 0.8, { bg: '#b91c1c' }); sg.position.set(cst, yst + 3.3, st + 0.3); scene.add(sg);
    house(b, scene, cst + 12, st - 2, 5, 4, 0xb91c1c, 0x1f2937, -PI / 2, 'TOP HUT', { h: 3, wins: [0], sbg: '#1f2937', door: 0x7a4a2a }); }
  { const fz = COURSE_Z1 + 2, fc = cx(fz), fy = H(fc, fz); for (const k of [-1, 1]) { b.box('m', 0x111827, fc + k * 7, fy - 0.4, fz, 0.35, 5, 0.35); solidH(fc + k * 7, fz, 0.4, 0.4, 5); }
    for (let i = 0; i < 14; i++) b.box('g', i % 2 ? 0x111827 : 0xffffff, fc - 6.5 + i, fy + 4.2, fz, 1, 0.7, 0.2); SP.finish = { z: fz, x: fc }; }
  for (const [zz, off] of [[-118, 0.5], [-178, -1], [-215, 1.2]]) { const z = zz, x = cx(z) + off, y = H(x, z); b.add('m', G.prism, 0xf2f7ff, x, y - 0.1, z, 0, 0, 0, 3.4, 0.9, 2.6); SP.ramps.push({ x, z }); }
  for (const [zz, off] of [[-88, -3.2], [-104, 3.4], [-139, -3], [-160, 2.8], [-192, -3.4], [-212, 3]]) { const z = zz, x = cx(z) + off, y = H(x, z); b.add('m', G.ico, 0x8b93a1, x, y + 0.25, z, 0.3, zz, 0, 0.9, 0.7, 0.8); b.add('m', G.ico, 0xf6f9ff, x, y + 0.75, z, 0, 0, 0, 0.7, 0.25, 0.6); solidH(x, z, 1.4, 1.2, 1.2).rock = true; SP.rocks.push({ x, z }); }
  for (let z = -54; z > COURSE_Z0 - 18; z -= 4.6) { const c = cx(z); for (let k = -1; k <= 1; k += 2) for (let j = 0; j < 7; j++) { const off = 9.5 + j * 4.3 + r() * 2.4, x = c + k * off; if (Math.abs(x) > 60) continue; if (k < 0 && Math.abs(x + 30) < 2.8) continue; const zz = z + (r() - 0.5) * 2.4, y = H(x, zz), s = 0.9 + r() * 0.6; pine(b, x, zz, s, y - 0.2); solidH(x, zz, 0.9, 0.9, 4).tree = true; } }
  // chairlift along x = -30 (decor + the free ride up)
  for (let z = -52; z > COURSE_Z0; z -= 22) { const y = H(-30, z); b.cyl('x', 0x6b7280, -30, y, z, 0.18, 7.5, 0, 0, 0, true); b.box('x', 0x6b7280, -30, y + 7.4, z, 3.4, 0.25, 0.3); }
  { const cab = new THREE.Group(); SP.liftChairs = []; for (let i = 0; i < 9; i++) { const g = new THREE.Group(), cb = new Batch(); cb.box('x', 0x374151, 0, -1.6, 0, 0.06, 1.6, 0.06); cb.box('g', 0x2563eb, 0, -1.9, 0, 1.6, 0.12, 0.7); cb.box('g', 0x2563eb, 0, -1.9, -0.33, 1.6, 0.7, 0.08); cb.finish(g, false); cab.add(g); SP.liftChairs.push(g); } scene.add(cab); }
  // invisible bounds
  solid(-72, -300, -66, 70, -5, 90); solid(66, -300, 72, 70, -5, 90); solid(-72, 62, 72, 68, -5, 90); solid(-72, COURSE_Z0 - 26, 72, COURSE_Z0 - 20, -5, 120);
  for (const bb of [solid(-66, -300, -48, HILL0 - 4, -5, 120), solid(48, -300, 66, HILL0 - 4, -5, 120)]) bb.nocam = true;
  b.finish(scene, true);
  // cozy point lights at the cocoa shop + lodge porch
  for (const [x, z] of [[-8.4, -25], [10, -27]]) { const L = new THREE.PointLight(0xffb86b, 10, 10, 1.4); L.position.set(x, 2.6, z); scene.add(L); }
}
export function liftTick(t) { if (!SP.liftChairs) return; const L = 186, n = SP.liftChairs.length; SP.liftChairs.forEach((g, i) => { const s = ((t * 2.4 + i * L / n) % L), up = true; const z = -52 - s; g.position.set(-30.4, H(-30, z) + 7.3, z); g.rotation.y = PI; }); }
