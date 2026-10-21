// Grok Snowie Sky Tours - Crash & Repairs patch world: the Repair Hangar (Tortuga Tech + Brie), Snowie Airfield with the Plane
// Lineup and control tower, runways at every town, a seaplane dock, Cheddar Farm, Rainbow Falls, the Whispering Woods camp,
// roads between the towns and purposeful groves/orchards (placed on flat ground and sunk into slopes, with far-only LOD).
import * as THREE from 'three';
import * as K from './kit.js?v=st8';
import { rbox } from './world.js?v=st8';
import { shell, onSide } from './bld.js?v=st8';
import { textGeo } from './text3d.js?v=st8';
import { Hf, TOWNS, LAKE, WATER_Y, PADS, TOURS, ZONES, SPOTS, pad, pine, roundTree, txt, sinkY, slopeAt } from './map.js?v=st8';
const { rcyl, lathe, sph, cyl, cone, torus, capsule, tube, blobGeo } = K;
const PI = Math.PI, R = K.R, pick = K.pick; const txtGeo = (str, size) => textGeo(str, size, size * 0.25);
// reserved footprints: nothing decorative may be planted here (buildings, pads, runways, roads)
const RES = [];
const reserve = (x0, z0, x1, z1) => RES.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)]);
export function freeAt(x, z, m = 0) { for (const r of RES) if (x > r[0] - m && x < r[2] + m && z > r[1] - m && z < r[3] + m) return false; for (const p of PADS) if (Math.hypot(p.x - x, p.z - z) < 7.5 + m) return false; return true; }
// register everything the patch builds BEFORE the old town dressing runs its free-space checks
reserve(32, -16, 62, 12); reserve(42, 16, 56, 32); reserve(-92, -84, 62, -40); reserve(-8, -64, 8, -34);
const ROADS = [
  [[-14, 31], [-16, 62], [-24, 120], [-30, 176]],
  [[-62, -6], [-130, -42], [-180, -150]],
  [[62, -22], [118, -40], [150, -110], [144, -180]],
  [[150, -110], [150, -80], [168, -20], [183, 30]],
];
const FARM_LANE = [[148, -112], [130, -118], [114, -126]];
for (const r of ROADS) roadRes(r, 6); roadRes(FARM_LANE, 3);
// runway approach corridors: no trees or tall props in line with a runway (planes come in low)
[[-210, -86, 170, -58], [-420, -76, -60, -44], [35, -111, 395, -79], [-280, 159, 70, 191]].forEach((r) => RES.push(r));
// ------------------------------------------------------------------------------------------------
export function buildPatch(w) { w.region = 'out';
  repairHangar(w); airfield(w); strips(w); seaDock(w); farm(w); falls(w); camp(w);
  for (const r of ROADS) road(w, r, 7, true); road(w, FARM_LANE, 3.4, false, true);
  groves(w); roadTrees(w);
}
function roadRes(pts, half) { const P = dense(pts, 6); for (const p of P) reserve(p[0] - half, p[1] - half, p[0] + half, p[1] + half); }
// smooth a polyline (Catmull-Rom) and resample every `step` metres
function dense(pts, step = 4) { const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal'); const L = c.getLength(), n = Math.max(2, Math.ceil(L / step)); const out = []; for (let i = 0; i <= n; i++) { const v = c.getPoint(i / n); out.push([v.x, v.z]); } return out; }
// terrain-hugging ribbon (asphalt + sandy shoulders + dashed centre line)
function ribbon(P, half, lift, dashed) { const pos = [], idx = []; let k = 0;
  for (let i = 0; i < P.length; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l; const nx = -tz, nz = tx;
    if (dashed && (i % 2)) continue; const [x, z] = P[i];
    if (dashed) { const x2 = P[Math.min(P.length - 1, i + 1)][0], z2 = P[Math.min(P.length - 1, i + 1)][1]; [[x, z], [x + (x2 - x) * 0.6, z + (z2 - z) * 0.6]].forEach(([px, pz]) => { const y = Math.max(Hf(px, pz), WATER_Y) + lift; pos.push(px + nx * half, y, pz + nz * half, px - nx * half, y, pz - nz * half); }); idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); k += 4; continue; }
    const yl = Math.max(Hf(x + nx * half, z + nz * half), Hf(x, z)) + lift, yr = Math.max(Hf(x - nx * half, z - nz * half), Hf(x, z)) + lift; pos.push(x + nx * half, yl, z + nz * half, x - nx * half, yr, z - nz * half);
    if (i > 0) idx.push(k - 2, k - 1, k, k - 1, k + 1, k); k += 2; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
function road(w, pts, width, lines, dirt) { const P = dense(pts, 3); w.add('m', ribbon(P, width / 2 + 0.9, 0.1, false), dirt ? 0xc9a66b : 0xd6c49a, 0, 0, 0); if (dirt) return; w.add('m', ribbon(P, width / 2, 0.16, false), 0x52525b, 0, 0, 0); if (lines) w.add('g', ribbon(P, 0.16, 0.2, true), 0xfacc15, 0, 0, 0); }
// ------------------------------------------------------------------------------------------------
// REPAIR HANGAR: arched roof, wide door, a lift for your plane, Brie's repair counter, Torty's Tortuga Tech armour rig
function repairHangar(w) { const x0 = 34, z0 = -14, x1 = 60, z1 = 10, cx = 47, cz = -2;
  const b = shell(w, { id: 'repair', name: 'Repair Hangar & Tortuga Tech', x0, z0, x1, z1, h: 7, wall: 0xf1f5f9, trim: 0xf97316, roof: 0x334155, floor: 'tile', fc1: 0x94a3b8, fc2: 0x8a96a8, doors: [{ side: 'w', at: cz, w: 9, top: 5.8 }], win: { s: 3, n: 3, e: 2, w: 0 }, flat: true });
  w.region = 'roof_repair'; w.add('g', new THREE.CylinderGeometry(1, 1, 1, 40, 1, false, 0, PI), 0x64748b, cx, 7.5, cz, 0, 0, PI / 2, 6.0, x1 - x0 + 1.0, (z1 - z0) / 2 + 0.6); for (let i = 0; i < 6; i++) w.add('x', new THREE.TorusGeometry(1, 0.03, 8, 40, PI), 0xf97316, x0 + 2 + i * 4.4, 7.5, cz, 0, PI / 2, 0, (z1 - z0) / 2 + 0.66, 6.05, 1);
  w.region = 'out'; onSide(w, b, 'w', () => { txt(w, 'REPAIR HANGAR', x0 - 0.3, 6.2, cz, -PI / 2, 0.62, 0xf97316); const T = w.tf(x0 - 0.35, 6.1, cz + 6.6, -PI / 2); T.add('g', torus(0.28, 24), 0x334155, 0, 0, 0, 0, 0, 0, 0.55, 0.55, 0.55); T.box('g', 0x334155, 0, -1.3, 0, 0.3, 1.3, 0.12, 0.05);
    for (let i = 0; i < 10; i++) w.add('g', rbox(0.06, 0.32, 0.9, 0.02), i % 2 ? 0x111827 : 0xfacc15, x0 - 0.32, 5.95, cz - 4.5 + i, 0.5, 0, 0); });
  w.region = 'in_repair';
  // the lift (your plane is parked on it by the game) + hazard ring
  w.slab('g', 0x475569, cx + 2, 0, cz, 12, 0.35, 12, 0.12, { floor: true }); for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2; w.add('g', rbox(1.4, 0.06, 0.5, 0.02), i % 2 ? 0x111827 : 0xfacc15, cx + 2 + Math.cos(a) * 6.3, 0.05, cz + Math.sin(a) * 6.3, 0, -a, 0); }
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, c]) => { w.add('x', cyl(14), 0xf97316, cx + 2 + a * 5.4, 0, cz + c * 5.4, 0, 0, 0, 0.25, 4.6, 0.25); w.solid(cx + 2 + a * 5.4 - 0.3, 0, cz + c * 5.4 - 0.3, cx + 2 + a * 5.4 + 0.3, 4.6, cz + c * 5.4 + 0.3); });
  SPOTS.lift = [cx + 2, 0.35, cz]; SPOTS.liftAct = [cx - 3.5, cz + 6.2];
  // Brie's repair counter (north wall) + tool wall + tyre stacks + toolbox carts
  { const T = w.tf(cx, 0, z0 + 1.6, 0); T.slab('g', 0xf97316, 0, 0, 0, 6, 1.05, 1.1, 0.1); T.box('g', 0x334155, 0, 1.05, 0, 6.2, 0.08, 1.2, 0.03); K.monitor(w, T, 1.8, 1.13, -0.1, 0, 0x3ff0ff); }
  txt(w, 'REPAIRS & UPGRADES', cx, 4.6, z0 + 0.32, 0, 0.42, 0xf97316); SPOTS.brie = [cx - 1.2, z0 + 2.9];
  { const T = w.tf(x1 - 0.3, 1.2, z1 - 2.4, -PI / 2); T.box('m', 0xd6d3d1, 0, 0, 0, 4.2, 2.6, 0.08, 0.03); for (let i = 0; i < 8; i++) { const lx = -1.85 + (i % 4) * 1.23, ly = 0.5 + (i / 4 | 0) * 1.1; T.add('x', torus(0.3, 16), 0x64748b, lx, ly + 0.3, 0.12, 0, 0, 0, 0.16, 0.16, 0.16); T.box('x', i % 3 ? 0x64748b : 0xef4444, lx, ly - 0.3, 0.12, 0.1, 0.55, 0.05, 0.02); } }
  for (let s = 0; s < 2; s++) for (let i = 0; i < 4; i++) w.add('x', torus(0.38, 20), 0x1f2937, x1 - 2 - s * 1.7, 0.3 + i * 0.5, z1 - 1.6, PI / 2, 0, 0, 0.6, 0.6, 1.0); w.solid(x1 - 4.4, 0, z1 - 2.4, x1 - 1.2, 2.2, z1 - 0.8);
  [[x1 - 2.2, cz + 3.5], [x0 + 3, z1 - 2]].forEach(([x, z], i) => { const T = w.tf(x, 0, z, i * 0.6); T.slab('g', 0xdc2626, 0, 0.2, 0, 1.2, 1.1, 0.7, 0.06); for (let d = 0; d < 4; d++) T.box('x', 0x94a3b8, 0, 0.4 + d * 0.24, 0.36, 0.7, 0.04, 0.02, 0.01); [-1, 1].forEach((a) => [-1, 1].forEach((c) => T.add('x', sph(8), 0x1f2937, a * 0.5, 0.1, c * 0.28, 0, 0, 0, 0.1))); });
  // engine on a stand + crates from Pi-rat's salvage (a cameo: his skull-and-cheese stencil)
  for (let i = 0; i < 4; i++) K.crate(w, x0 + 1.4 + (i % 2) * 1.1, (i / 2 | 0) * 1.0, z1 - 4.5 - (i % 2) * 0.1, 1.0, 0x8b5a2b); txt(w, 'PI-RAT SALVAGE', x0 + 2, 2.3, z1 - 3.9, 0, 0.18, 0xfef3c7);
  // TORTUGA TECH booth: drop-test rig (a weight hanging over a shell-plated panel) + upgrade board
  { const x = x1 - 4.5, z = z0 + 5; w.add('x', cyl(12), 0x14b8a6, x - 1.6, 0, z, 0, 0, 0, 0.12, 4.2, 0.12); w.add('x', cyl(12), 0x14b8a6, x + 1.6, 0, z, 0, 0, 0, 0.12, 4.2, 0.12); w.add('x', rbox(3.6, 0.25, 0.25, 0.06), 0x14b8a6, x, 4.2, z); w.add('x', cyl(6), 0x94a3b8, x, 2.6, z, 0, 0, 0, 0.03, 1.6, 0.03);
    w.add('x', rcyl(0.55, 0.9, 0.1, 20), 0x334155, x, 1.7, z); txt(w, '1 TON', x, 2.1, z + 0.56, 0, 0.14, 0xfacc15);
    w.addFn('g', sph(24), (c, px, py, pz) => { const u = Math.atan2(pz - z, px - x) * 3, v = (py) * 3; c.set(((Math.floor(u) + Math.floor(v)) & 1) ? 0x0f766e : 0x14b8a6); }, x, 0.2, z, 0, 0, 0, 1.2, 0.55, 1.0); w.solid(x - 1.8, 0, z - 0.6, x + 1.8, 4.3, z + 0.6);
    txt(w, 'TORTUGA TECH', x, 4.75, z + 0.1, 0, 0.36, 0x14b8a6); txt(w, 'TORTUGA TECH', x, 4.75, z - 0.1, PI, 0.36, 0x14b8a6); txt(w, 'SHELL-TOUGH: 1,000 BONKS PASSED', x, 0.15, z + 1.25, 0, 0.13, 0x0f766e, 'g');
    SPOTS.tortuga = [x - 2.6, z + 1.4]; }
  { const T = w.tf(x1 - 0.3, 2.2, -0.9, -PI / 2); T.box('m', 0x1f2937, 0, 0, 0, 5.4, 2.6, 0.1, 0.05); [0x14b8a6, 0xfacc15, 0x60a5fa, 0xa78bfa].forEach((c, i) => { T.box('g', c, -2 + i * 1.33, 0.25, 0.08, 1.1, 2.1, 0.05, 0.04); });
    T.add('g', sph(12), 0x0f766e, -2, 1.5, 0.2, 0, 0, 0, 0.4, 0.25, 0.4); T.add('g', torus(0.12, 16), 0x92400e, -0.67, 1.4, 0.2, 0, 0, 0, 0.18, 0.18, 0.5); T.add('g', sph(10), 0xfef08a, 0.67, 1.45, 0.2, 0, 0, 0, 0.3, 0.22, 0.25); T.add('g', cone(8), 0xfacc15, 2.0, 1.2, 0.2, 0, 0, 0.4, 0.2, 0.7, 0.1); txt(w, 'UPGRADES', 0 + x1 - 0.42, 3.6, -0.9, -PI / 2, 0.26, 0xffffff); }
  hangarDetail(w, x0, z0, x1, z1, cx, cz); [[cx - 4, cz], [cx + 6, cz]].forEach(([x, z]) => { w.add('x', cyl(6), 0x334155, x, 5.6, z, 0, 0, 0, 0.012, 1.4, 0.012); w.add('g', lathe([[0, 0], [0.5, 0], [0.4, 0.3], [0.06, 0.4], [0, 0.4]], 20, 'hshade'), 0xf97316, x, 5.2, z); w.add('l', sph(12), 0xfff3c4, x, 5.2, z, 0, 0, 0, 0.2, 0.2, 0.2, 0.7); });
  w.lights.push({ x: cx, y: 5, z: cz, c: 0xf8fbff, i: 16, d: 22 });
  w.region = 'out'; pad(w, 'repair', 49, 24, 0, 0xf97316, 'Repair Hangar Pad', 'hub'); txt(w, 'REPAIR', 49, 0.4, 30.6, 0, 0.6, 0xf97316, 'l', 0.2); }
// ------------------------------------------------------------------------------------------------
// REPAIR HANGAR detail pass: paint booth, pegboard + workbench, radial engine on a stand, welding bay, overhead crane + chain hoist,
// parts shelving, drums, prop & rotor racks, skids, hose reel, cables, oil stains, safety lines, posters, banners, bunting,
// fluorescent fixtures and a fully dressed Tortuga Tech crash-test corner. All merged into the hangar's interior chunk buckets.
function hangarDetail(w, x0, z0, x1, z1, cx, cz) { x0 += 0.25; z0 += 0.25; x1 -= 0.25; z1 -= 0.25; // shell walls are 0.5 thick: work from the inner faces
  const MET = 0x94a3b8, DK = 0x334155, RED = 0xdc2626, YEL = 0xfacc15, WOOD = 0x9a6a3e, TEAL = 0x14b8a6;
  // --- PAINT BOOTH (north-west corner): frame, strip curtains, wing panel on an easel, cans, spray gun, extraction fan
  { const bx0 = x0 + 0.3, bx1 = x0 + 5.8, bz0 = z0 + 0.3, bz1 = z0 + 4.6, by = 3.3;
    w.add('m', rbox(bx1 - bx0, 0.03, bz1 - bz0, 0.01), 0x64748b, (bx0 + bx1) / 2, 0.015, (bz0 + bz1) / 2);
    [[bx1, bz0], [bx1, bz1], [bx0, bz1]].forEach(([x, z]) => { w.add('x', cyl(10), 0xe2e8f0, x, 0, z, 0, 0, 0, 0.07, by, 0.07); w.solid(x - 0.1, 0, z - 0.1, x + 0.1, by, z + 0.1); });
    w.add('x', rbox(0.12, 0.12, bz1 - bz0, 0.03), 0xe2e8f0, bx1, by, (bz0 + bz1) / 2); w.add('x', rbox(bx1 - bx0, 0.12, 0.12, 0.03), 0xe2e8f0, (bx0 + bx1) / 2, by, bz1);
    for (let z = bz0 + 0.2; z < bz1 - 1.6; z += 0.3) w.add('e', rbox(0.02, by - 0.25, 0.28, 0.01), 0xbfe9ff, bx1, (by - 0.2) / 2 + 0.05, z, 0, 0.15, 0);
    for (let x = bx0 + 0.2; x < bx1 - 2.2; x += 0.3) w.add('e', rbox(0.28, by - 0.25, 0.02, 0.01), 0xbfe9ff, x, (by - 0.2) / 2 + 0.05, bz1, 0, 0.15, 0);
    w.add('l', rbox(bx1 - bx0 - 0.6, 0.08, 0.25, 0.03), 0xf8fbff, (bx0 + bx1) / 2, by - 0.12, (bz0 + bz1) / 2, 0, 0, 0, 1, 1, 1, 0.8);
    txt(w, 'PAINT BOOTH', bx1 - 1.4, by + 0.15, bz1 + 0.08, 0, 0.2, 0xff4fa0);
    { const T = w.tf(bx0 + 2.4, 0, bz0 + 1.8, 0.3); [-0.7, 0.7].forEach((s) => T.add('x', cyl(8), DK, s, 0, 0.25, -0.25, 0, 0, 0.04, 1.5, 0.04)); T.add('x', cyl(8), DK, 0, 0, -0.35, 0.35, 0, 0, 0.04, 1.5, 0.04);
      T.add('g', rbox(2.6, 0.1, 0.9, 0.04), 0xff4fa0, -0.55, 1.45, 0.1, -1.1, 0, 0); T.add('g', rbox(1.5, 0.11, 0.92, 0.04), 0xffffff, 0.75, 1.45, 0.1, -1.1, 0, 0); T.solid(-1.3, 0, -0.5, 1.3, 1.9, 0.6); }
    [0xff4fa0, 0x3ff0ff, YEL, 0x4ade80, 0xa78bfa, 0xff7a3d, 0xffffff, 0x60a5fa].forEach((c, i) => { const x = bx0 + 0.5 + (i % 4) * 0.45, z = bz1 - 0.6, y = (i / 4 | 0) * 0.42; w.add('g', lathe([[0, 0], [0.18, 0], [0.18, 0.4], [0, 0.4]], 18, 'can18'), 0xcbd5e1, x, y, z); w.add('g', rcyl(0.181, 0.22, 0.01, 18), c, x, y + 0.1, z); });
    { const x = bx0 + 3.6, z = bz1 - 0.4; w.add('x', cyl(8), DK, x, 0, z, 0, 0, 0, 0.05, 1.2, 0.05); w.add('g', rbox(0.5, 0.18, 0.12, 0.04), 0xff4fa0, x, 1.25, z); w.add('x', cyl(8), MET, x + 0.25, 1.25, z, 0, 0, -PI / 2, 0.03, 0.3, 0.03); w.add('g', lathe([[0, 0], [0.12, 0], [0.1, 0.25], [0, 0.25]], 14, 'cup'), 0xe2e8f0, x, 1.34, z); }
    { const x = (bx0 + bx1) / 2, y = 2.3, z = z0 + 0.12; w.add('x', torus(0.12, 28), DK, x, y, z, 0, 0, 0, 0.6, 0.6, 0.6); for (let i = 0; i < 5; i++) w.add('x', rbox(0.18, 0.5, 0.03, 0.02), MET, x, y, z + 0.03, 0, 0, i * PI * 2 / 5, 1, 1, 1); w.add('x', sph(10), DK, x, y, z + 0.05, 0, 0, 0, 0.1); } }
  // --- PEGBOARD + WORKBENCH (north wall, x 40-44)
  { const T = w.tf(42.2, 0, z0 + 0.05, 0); T.box('m', 0xd6b98c, 0, 1.25, 0, 4.2, 2.0, 0.05, 0.02);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { const tx = -1.75 + i * 0.7, ty = 1.55 + j * 0.6, k = (i + j) % 4;
      if (k === 0) { T.add('x', rbox(0.06, 0.4, 0.03, 0.01), MET, tx, ty, 0.06); T.add('x', torus(0.4, 12), MET, tx, ty + 0.25, 0.06, 0, 0, 0, 0.08, 0.08, 0.08); }
      else if (k === 1) { T.add('g', rbox(0.07, 0.3, 0.05, 0.02), RED, tx, ty - 0.08, 0.06); T.add('x', rbox(0.28, 0.09, 0.07, 0.02), DK, tx, ty + 0.12, 0.06); }
      else if (k === 2) { T.add('g', rbox(0.08, 0.18, 0.06, 0.03), YEL, tx, ty - 0.1, 0.06); T.add('x', cyl(6), MET, tx, ty, 0.06, 0, 0, 0, 0.012, 0.22, 0.012); }
      else { T.add('g', rbox(0.05, 0.26, 0.04, 0.02), 0x2563eb, tx - 0.05, ty - 0.05, 0.06, 0, 0, 0.18); T.add('g', rbox(0.05, 0.26, 0.04, 0.02), 0x2563eb, tx + 0.05, ty - 0.05, 0.06, 0, 0, -0.18); } }
    T.box('m', WOOD, 0, 0.9, 0.55, 4.2, 0.1, 0.95, 0.03); [-1.95, 1.95].forEach((x) => [0.15, 0.95].forEach((z) => T.add('x', rbox(0.08, 0.9, 0.08, 0.02), DK, x, 0.45, z))); T.box('m', 0x7c5532, 0, 0.25, 0.55, 4.0, 0.05, 0.85, 0.02); T.solid(-2.1, 0, 0.05, 2.1, 1.0, 1.05);
    T.add('x', rbox(0.4, 0.22, 0.25, 0.03), 0x1e3a8a, -1.6, 1.07, 0.75); T.add('x', rbox(0.5, 0.06, 0.1, 0.02), MET, -1.6, 1.22, 0.75);
    [[-0.9, 0x94a3b8, 0.16], [-0.6, 0xfacc15, 0.12], [-0.35, 0x94a3b8, 0.2]].forEach(([x, c, r]) => T.add('x', torus(0.35, 16), c, x, 0.97, 0.7, PI / 2, 0, 0, r, r, r));
    for (let i = 0; i < 7; i++) T.add('x', cyl(6), MET, 0.1 + i * 0.09, 0.95, 0.9, PI / 2, 0, 0, 0.02, 0.12, 0.02);
    T.add('x', cyl(14), 0x64748b, 0.9, 0.95, 0.6, 0, 0, 0, 0.18, 0.35, 0.18); T.add('x', torus(0.25, 14), 0x475569, 0.9, 1.2, 0.6, PI / 2, 0, 0, 0.22); T.add('l', sph(8), 0xff7a1a, 0.9, 1.32, 0.6, 0, 0, 0, 0.05, 0.05, 0.05, 0.6);
    monitorAt(T, 1.6, 0.95, 0.5); T.add('x', cyl(8), DK, -1.0, 0.95, 0.35, 0, 0, 0, 0.03, 0.5, 0.03); T.add('x', cone(14), 0xf97316, -1.0, 1.35, 0.5, 0.9, 0, 0, 0.14, 0.18, 0.14); }
  // --- RADIAL ENGINE on a red stand (moved out of the booth)
  { const x = 41.4, z = -9.0, T = w.tf(x, 0, z, PI / 2); T.box('g', RED, 0, 0.0, 0, 1.6, 0.12, 1.1, 0.03); [-0.6, 0.6].forEach((s) => T.add('g', rbox(0.1, 1.0, 0.1, 0.03), RED, s, 0.55, 0)); T.add('g', rbox(1.3, 0.1, 0.1, 0.03), RED, 0, 1.05, 0);
    [[-0.7, -0.45], [0.7, -0.45], [-0.7, 0.45], [0.7, 0.45]].forEach(([a, b]) => T.add('x', sph(8), 0x111827, a, 0.07, b, 0, 0, 0, 0.08));
    T.add('x', cyl(20), 0x475569, 0, 1.4, -0.35, PI / 2, 0, 0, 0.32, 0.7, 0.32); for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; T.add('x', cyl(12), MET, Math.cos(a) * 0.3, 1.4 + Math.sin(a) * 0.3, 0, 0, 0, a - PI / 2, 0.12, 0.42, 0.12); for (let f = 0; f < 4; f++) T.add('x', torus(0.25, 12), 0x64748b, Math.cos(a) * (0.42 + f * 0.07), 1.4 + Math.sin(a) * (0.42 + f * 0.07), 0, 0, 0, 0, 0.13, 0.13, 0.13); }
    T.add('x', cone(16), 0x64748b, 0, 1.4, 0.35, PI / 2, 0, 0, 0.15, 0.25, 0.15); T.solid(-0.85, 0, -0.6, 0.85, 1.9, 0.6); txt(w, 'R-7 RADIAL', x, 0.25, z + 0.62, 0, 0.1, 0xffffff); }
  // --- ROLL CABS (tall rolling toolboxes)
  [[x0 + 0.6, -8.0, PI / 2, RED], [43.6, z0 + 3.0, 0, 0x2563eb], [55.8, 6.6, PI, RED]].forEach(([x, z, ry, c]) => { const T = w.tf(x, 0, z, ry); T.box('g', c, 0, 0.12, 0, 1.2, 1.1, 0.6, 0.04); for (let d = 0; d < 6; d++) T.box('x', MET, 0, 0.25 + d * 0.16, 0.31, 1.0, 0.03, 0.02, 0.01); T.box('g', c, 0, 1.25, -0.05, 1.2, 0.45, 0.45, 0.04); T.add('x', rbox(1.0, 0.02, 0.4, 0.01), DK, 0, 1.7, -0.05);
    [-0.5, 0.5].forEach((a) => [-0.22, 0.22].forEach((b) => T.add('x', sph(8), 0x111827, a, 0.06, b, 0, 0, 0, 0.06))); T.add('x', capsule(8), MET, 0, 1.0, 0.36, 0, 0, PI / 2, 0.03, 0.4, 0.03); T.add('x', rbox(0.26, 0.06, 0.08, 0.02), YEL, -0.3, 1.74, 0); T.solid(-0.65, 0, -0.35, 0.65, 1.75, 0.4); });
  // --- WELDING BAY (north wall between the counter and Tortuga Tech): table, red screen, gas bottles, mask, cable
  { const x = 52.0, z = z0 + 1.0; w.slab('x', 0x475569, x, 0, z, 1.8, 0.9, 0.9, 0.03); w.add('x', rbox(1.9, 0.05, 1.0, 0.02), 0x64748b, x, 0.92, z); w.add('x', rbox(0.9, 0.04, 0.5, 0.01), 0x9ca3af, x + 0.1, 0.96, z, 0, 0.3, 0);
    w.add('e', rbox(0.03, 1.9, 1.4, 0.01), 0xef4444, x - 1.15, 1.05, z + 0.2, 0, 0, 0); w.add('x', rbox(0.06, 2.0, 0.06, 0.02), DK, x - 1.15, 1.0, z - 0.5); w.add('x', rbox(0.06, 2.0, 0.06, 0.02), DK, x - 1.15, 1.0, z + 0.9);
    [[x + 1.25, z0 + 0.45, 0x16a34a], [x + 1.25, z0 + 1.0, 0x2563eb]].forEach(([gx, gz, c]) => { w.add('g', cyl(16), c, gx, 0, gz, 0, 0, 0, 0.2, 1.4, 0.2); w.add('g', sph(14), c, gx, 1.4, gz, 0, 0, 0, 0.2, 0.14, 0.2); w.add('x', cyl(8), MET, gx, 1.5, gz, 0, 0, 0, 0.05, 0.16, 0.05); w.solid(gx - 0.22, 0, gz - 0.22, gx + 0.22, 1.6, gz + 0.22); });
    w.add('x', tube([[x + 1.2, 1.55, z0 + 0.7], [x + 0.9, 1.3, z0 + 1.2], [x + 0.6, 0.98, z]], 0.025, 16, 6), 0x111827, 0, 0, 0);
    w.add('g', sph(14), 0x1f2937, x - 0.5, 1.1, z + 0.1, 0, 0, 0, 0.18, 0.2, 0.13); w.add('l', rbox(0.18, 0.07, 0.02, 0.01), 0x22d3ee, x - 0.5, 1.13, z + 0.23, 0, 0, 0, 1, 1, 1, 0.4);
    txt(w, 'HOT WORK', x, 2.4, z0 + 0.1, 0, 0.18, 0xf97316); w.add('g', rbox(1.4, 0.4, 0.04, 0.02), YEL, x, 2.48, z0 + 0.06);
    for (let i = 0; i < 8; i++) w.add('g', rbox(0.5, 0.012, 0.1, 0.005), i % 2 ? 0x111827 : YEL, x - 1.0 + (i % 4) * 0.66, 0.01, i < 4 ? z + 1.0 : z - 0.55 + 0, 0, 0, 0);
    SPOTS.weld = [x + 0.15, 1.0, z + 0.05]; }
  // --- OVERHEAD CRANE: two yellow I-beam rails, a bridge across the lift, trolley, chain hoist with a hook block
  { const y = 6.1, za = -9.6, zb = 5.6, bxx = cx + 2; [za, zb].forEach((z) => { w.add('x', rbox(x1 - x0 - 0.6, 0.35, 0.18, 0.03), YEL, (x0 + x1) / 2, y, z); w.add('x', rbox(x1 - x0 - 0.6, 0.06, 0.4, 0.02), YEL, (x0 + x1) / 2, y + 0.18, z); w.add('x', rbox(x1 - x0 - 0.6, 0.06, 0.4, 0.02), YEL, (x0 + x1) / 2, y - 0.18, z); });
    w.add('x', rbox(0.5, 0.45, zb - za + 0.4, 0.04), 0xf59e0b, bxx, y - 0.4, (za + zb) / 2); for (let i = 0; i < 9; i++) w.add('g', rbox(0.52, 0.2, 0.5, 0.02), i % 2 ? 0x111827 : YEL, bxx, y - 0.4, za + 1 + i * 1.6, 0, 0, 0, 1, 0.8, 0.2);
    w.add('x', rbox(0.9, 0.5, 0.8, 0.06), DK, bxx, y - 0.9, cz); for (let i = 0; i < 9; i++) w.add('x', torus(0.3, 10), MET, bxx, y - 1.3 - i * 0.16, cz, 0, (i % 2) * PI / 2, 0, 0.09, 0.12, 0.09);
    w.add('g', rbox(0.4, 0.35, 0.3, 0.06), YEL, bxx, y - 2.95, cz); w.add('x', torus(0.25, 16, PI * 1.3), DK, bxx, y - 3.35, cz, 0, 0, PI * 0.85, 0.22, 0.22, 0.22);
    txt(w, 'SWL 2 T', bxx + 0.27, y - 0.5, cz + 3, PI / 2, 0.16, 0x111827); }
  // --- PARTS SHELVING (south wall, west end): 3-tier rack with crates, boxes, jars and barrels
  { const sx = 42.65, sz = z1 - 0.45, W = 6.1, T = w.tf(sx, 0, sz, PI); [-W / 2, -W / 6, W / 6, W / 2].forEach((x) => [-0.3, 0.3].forEach((z) => T.add('x', rbox(0.06, 2.6, 0.06, 0.02), 0x1e40af, x, 1.3, z)));
    [0.1, 0.95, 1.8, 2.55].forEach((y) => T.add('x', rbox(W + 0.1, 0.05, 0.65, 0.02), 0xf97316, 0, y, 0)); T.solid(-W / 2 - 0.1, 0, -0.35, W / 2 + 0.1, 2.6, 0.35);
    const items = [[0.13, 'crate'], [0.98, 'box'], [1.83, 'jar'], [0.13, 'barrel'], [0.98, 'crate'], [1.83, 'box']];
    for (let s = 0; s < 3; s++) items.forEach(([y, k], i) => { const lx = -W / 2 + 0.55 + s * (W / 3) + (i % 3) * 0.62 - 0.15, ly = [0.13, 0.98, 1.83][(i + s) % 3];
      if (k === 'crate') T.box('m', 0xb07a3c, lx, ly, 0, 0.5, 0.45, 0.5, 0.03); else if (k === 'box') { T.box('m', pick([0xc9a06a, 0xd8b98b]), lx, ly, 0, 0.5, 0.36, 0.45, 0.02); T.box('g', YEL, lx, ly + 0.36, 0, 0.1, 0.01, 0.46, 0.005); }
      else if (k === 'jar') { T.add('e', cyl(14), 0xd8fbff, lx, ly, 0, 0, 0, 0, 0.14, 0.32, 0.14); T.add('x', sph(8), MET, lx, ly + 0.08, 0, 0, 0, 0, 0.09); }
      else { T.add('g', cyl(16), pick([0x2563eb, RED, 0x16a34a]), lx, ly, 0, 0, 0, 0, 0.2, 0.55, 0.2); T.add('x', torus(0.15, 16), DK, lx, ly + 0.2, 0, PI / 2, 0, 0, 0.2); } });
    txt(w, 'PARTS', sx, 2.9, sz - 0.36, PI, 0.24, 0x1e40af); }
  // --- OIL DRUMS + drum pump
  [[35.0, 9.1, 0x2563eb], [35.8, 8.4, RED], [34.8, 8.1, 0x16a34a]].forEach(([x, z, c], i) => { w.add('g', cyl(20), c, x, 0, z, 0, 0, 0, 0.3, 0.9, 0.3); [0.2, 0.6].forEach((y) => w.add('x', torus(0.06, 20), DK, x, y, z, PI / 2, 0, 0, 0.31, 0.31, 0.31)); w.add('x', rcyl(0.28, 0.02, 0.01, 20), DK, x, 0.9, z); if (!i) { w.add('x', cyl(8), MET, x + 0.1, 0.9, z, 0, 0, 0, 0.03, 0.55, 0.03); w.add('g', rbox(0.2, 0.08, 0.06, 0.02), RED, x + 0.1, 1.45, z); } w.solid(x - 0.3, 0, z - 0.3, x + 0.3, 0.92, z + 0.3); });
  // --- PROPS & ROTORS RACK (south wall middle): A-frame with three propellers + rotor blades on wall brackets
  { const rx = 51.35, rz = z1 - 0.7; [-2.8, 2.8].forEach((s) => { w.add('x', rbox(0.1, 2.6, 0.1, 0.02), DK, rx + s, 1.3, rz - 0.35, 0.18, 0, 0); w.add('x', rbox(0.1, 2.6, 0.1, 0.02), DK, rx + s, 1.3, rz + 0.35, -0.18, 0, 0); }); w.add('x', rbox(5.8, 0.1, 0.1, 0.02), DK, rx, 2.55, rz); w.solid(rx - 3, 0, rz - 0.6, rx + 3, 2.6, rz + 0.6);
    [[-1.7, 0x1f2937, 0xffd23f], [0, 0x92400e, 0xffffff], [1.7, 0x1f2937, 0xff4fa0]].forEach(([px, c, tip]) => { const T = w.tf(rx + px, 0, rz, 0); T.add('x', cyl(14), MET, 0, 1.55, -0.12, PI / 2, 0, 0, 0.12, 0.25, 0.12); T.add('x', cyl(6), MET, 0, 1.55, 0, 0, 0, 0, 0.012, 1.0, 0.012);
      [1, -1].forEach((s) => { T.add('g', rbox(0.24, 1.05, 0.06, 0.03), c, 0, 1.55 + s * 0.55, 0, s * 0.25, 0, 0); T.add('g', rbox(0.25, 0.14, 0.065, 0.03), tip, 0, 1.55 + s * 1.02, 0); }); });
    [0.9, 1.35, 1.8].forEach((y, i) => { w.add('g', rbox(5.6, 0.06, 0.3, 0.02), [0x334155, 0x475569, 0x1e293b][i], rx, 3.0 + y, z1 - 0.25); w.add('g', rbox(0.3, 0.065, 0.31, 0.02), YEL, rx + 2.65, 3.0 + y, z1 - 0.25); [-2.2, 0, 2.2].forEach((bx) => w.add('x', rbox(0.06, 0.06, 0.4, 0.01), DK, rx + bx, 2.95 + y, z1 - 0.25)); });
    txt(w, 'PROPS & ROTORS', rx, 5.4, z1 - 0.12, PI, 0.24, 0xf97316); }
  // --- SKID STACK by the tyres
  for (let i = 0; i < 3; i++) { const x = 51.0, z = 7.0, y = 0.08 + i * 0.14; [-0.45, 0.45].forEach((s) => w.add('x', tube([[x - 1.2, y + 0.12, z + s], [x - 1.05, y, z + s], [x + 1.05, y, z + s], [x + 1.2, y + 0.12, z + s]], 0.05, 16, 8), 0x475569, 0, 0, 0)); w.add('x', rbox(0.06, 0.06, 0.9, 0.02), DK, x - 0.6, y + 0.06, z); w.add('x', rbox(0.06, 0.06, 0.9, 0.02), DK, x + 0.6, y + 0.06, z); } w.solid(49.7, 0, 6.4, 52.3, 0.5, 7.6);
  // --- HOSE REEL on the east wall + hose snaking across the floor, and power cables
  { const x = x1 - 0.2, y = 1.6, z = -5.3; w.add('x', rcyl(0.5, 0.25, 0.04, 24), RED, x - 0.15, y, z, 0, 0, PI / 2); w.add('x', torus(0.3, 24), YEL, x - 0.15, y, z, 0, PI / 2, 0, 0.36, 0.36, 0.36);
    w.add('x', tube([[x - 0.3, y - 0.3, z], [x - 0.8, 0.05, z + 0.3], [x - 2.2, 0.04, z - 0.6], [x - 3.2, 0.04, z + 0.9], [x - 3.6, 0.04, z + 2.1]], 0.05, 40, 8), YEL, 0, 0, 0); w.add('x', cyl(8), MET, x - 3.6, 0.04, z + 2.1, PI / 2, 0, 0, 0.05, 0.3, 0.05); }
  w.add('x', tube([[x0 + 0.1, 0.3, -9.4], [x0 + 1.4, 0.03, -8.8], [39.6, 0.03, -8.9], [40.6, 0.03, -9.2]], 0.03, 24, 6), 0x111827, 0, 0, 0);
  // --- FLOOR: oil stains + safety walkway lines from the door + "keep clear" chevrons
  [[44.4, -9.2, 0.9], [46.2, 5.3, 0.6], [53.5, 4.6, 0.7], [41.8, -11.4, 0.5], [50.4, -9.9, 0.55], [39.5, 6.5, 0.7], [57.2, -2.5, 0.5], [38.6, -4.4, 0.45]].forEach(([x, z, s], i) => { w.add('m', sph(12), 0x1f2937, x, 0.005, z, 0, i, 0, s, 0.004, s * 0.7); w.add('m', sph(10), 0x334155, x + s * 0.5, 0.006, z + s * 0.3, 0, i, 0, s * 0.35, 0.004, s * 0.25); });
  [cz - 4.8, cz + 4.8].forEach((z) => w.add('g', rbox(9.2, 0.012, 0.12, 0.005), YEL, x0 + 4.6, 0.008, z)); for (let i = 0; i < 6; i++) w.add('g', rbox(0.6, 0.012, 0.12, 0.005), 0xffffff, x0 + 1.2 + i * 1.5, 0.008, cz, 0, 0.7, 0);
  // --- POSTERS (3D framed panels with 3D type, natural proportions) + hanging fabric banners + bunting
  const poster = (x, y, z, ry, W, H, bg, lines, fg, icon) => { const T = w.tf(x, y, z, ry); T.box('x', 0x1f2937, 0, 0, 0, W + 0.12, H + 0.12, 0.05, 0.02); T.box('g', bg, 0, 0.06, 0.03, W, H, 0.02, 0.01);
    lines.forEach((s, i) => { const g = txtGeo(s, 0.16); if (g) T.add('g', g, fg, 0, H - 0.3 - i * 0.26, 0.05); }); if (icon) icon(T, H); };
  poster(x0 + 0.06, 2.9, -7.9, PI / 2, 1.0, 1.3, 0xfacc15, ['SAFETY', 'FIRST!', 'GOGGLES ON'], 0x111827, (T) => { T.add('x', torus(0.25, 18), 0x111827, -0.22, 0.45, 0.06, 0, 0, 0, 0.22); T.add('x', torus(0.25, 18), 0x111827, 0.22, 0.45, 0.06, 0, 0, 0, 0.22); });
  poster(x0 + 0.06, 2.6, 5.6, PI / 2, 1.6, 1.2, 0x0ea5e9, ['SNOWIE SKY', 'TOURS', 'SINCE 2026'], 0xffffff, (T) => T.add('g', sph(12), 0xffffff, 0, 0.28, 0.07, 0, 0, 0, 0.18, 0.15, 0.06));
  poster(x0 + 0.06, 2.4, 8.4, PI / 2, 1.2, 1.6, 0xffffff, ['DAYS', 'WITHOUT', 'A BONK'], 0xdc2626, (T) => { const g = txtGeo('12', 0.42); if (g) T.add('g', g, 0x111827, 0, 0.25, 0.05); });
  poster(x0 + 0.06, 2.6, -11.6, PI / 2, 1.4, 1.0, 0xff4fa0, ['PAINT', 'OF THE', 'MONTH'], 0xffffff);
  [[41.5, 'BRIE\'S GARAGE', 0xf97316], [51.6, 'TORTUGA TECH', TEAL]].forEach(([x, s, c]) => { const z = -9.6 + 0.18; w.add('g', rbox(1.7, 2.6, 0.04, 0.02), c, x, 4.65, z); w.add('x', cyl(8), DK, x - 0.85, 5.95, z, 0, 0, PI / 2, 0.03, 1.7, 0.03); s.split(' ').forEach((wd, i) => { const g = txtGeo(wd, 0.2); if (g) { w.add('g', g, 0xffffff, x, 5.3 - i * 0.4, z + 0.04); w.add('g', g, 0xffffff, x, 5.3 - i * 0.4, z - 0.04, 0, PI, 0); } }); w.add('g', cone(3), c, x, 3.35, z, PI, 0, 0, 0.85, 0.3, 0.02); });
  [-6, 2].forEach((z) => { for (let i = 0; i < 24; i++) { const x = x0 + 0.8 + i * 1.03, sag = Math.sin(i / 23 * PI) * 0.7; w.add('g', cone(3), [0xff4fa0, YEL, 0x3ff0ff, 0x4ade80, 0xa78bfa][i % 5], x, 5.25 - sag, z, PI, 0, 0, 0.32, 0.5, 0.02); } w.add('x', tube([[x0, 5.45, z], [(x0 + x1) / 2, 4.75, z], [x1, 5.45, z]], 0.012, 24, 4), 0xffffff, 0, 0, 0); });
  // --- FLUORESCENT FIXTURES (lit) on the crane rails' level
  for (let i = 0; i < 4; i++) [-6.5, 2.5].forEach((z) => { const x = x0 + 4 + i * 6; w.add('x', rbox(2.4, 0.1, 0.4, 0.03), 0x64748b, x, 6.7, z); w.add('l', capsule(10), 0xf8fbff, x, 6.6, z, 0, 0, PI / 2, 0.06, 1.1, 0.06, 0.9); w.add('l', capsule(10), 0xf8fbff, x, 6.6, z + 0.15, 0, 0, PI / 2, 0.06, 1.1, 0.06, 0.9); });
  // --- TORTUGA TECH CRASH-TEST CORNER (north-east): mat, chain fence, shell-plate wall display, BONK-O-METER, crash dummy plane, data screen, clipboard
  { const tx0 = 53.6, tx1 = x1 - 0.2, tz0 = z0 + 0.2, tz1 = -6.4; w.add('g', rbox(tx1 - tx0, 0.025, tz1 - tz0, 0.01), 0x115e59, (tx0 + tx1) / 2, 0.013, (tz0 + tz1) / 2);
    for (let i = 0; i < 12; i++) w.add('g', rbox(0.5, 0.03, 0.14, 0.005), i % 2 ? 0x111827 : YEL, tx0 + 0.3 + i * 0.52, 0.02, tz1 - 0.1);
    [[tx0 + 0.2, tz1 - 0.2], [tx0 + 2.2, tz1 - 0.2], [tx1 - 0.3, tz1 - 0.2]].forEach(([x, z]) => { w.add('g', rcyl(0.18, 0.06, 0.02, 16), YEL, x, 0, z); w.add('g', cyl(10), YEL, x, 0, z, 0, 0, 0, 0.04, 0.9, 0.04); w.add('g', sph(10), YEL, x, 0.92, z, 0, 0, 0, 0.06); });
    for (let i = 0; i < 14; i++) w.add('x', torus(0.3, 8), 0xfacc15, tx0 + 2.4 + i * 0.25, 0.8 - Math.sin(i / 13 * PI) * 0.2, tz1 - 0.2, 0, (i % 2) * PI / 2, 0, 0.07, 0.1, 0.07);
    [[54.6, 'BEFORE'], [56.2, 'TEST'], [57.8, 'AFTER']].forEach(([x, s], i) => { const T = w.tf(x, 5.3, z0 + 0.08, 0); T.box('x', 0x1f2937, 0, -0.75, 0, 1.3, 1.5, 0.05, 0.02); T.add('g', sph(18), [0x14b8a6, 0x0f766e, 0x0d9488][i], 0, 0, 0.12, 0, 0, 0, 0.5, 0.42, 0.12); for (let k = 0; k < 6; k++) T.add('g', torus(0.08, 6), 0x0f766e, Math.cos(k * PI / 3) * 0.24, Math.sin(k * PI / 3) * 0.2, 0.2, 0, 0, PI / 6, 0.09, 0.09, 0.09);
      if (i === 2) { T.add('m', sph(10), 0x57534e, 0.15, 0.08, 0.22, 0, 0, 0, 0.12, 0.08, 0.03); } const g = txtGeo(s, 0.14); if (g) T.add('g', g, 0xffffff, 0, -0.66, 0.04); });
    { const x = x1 - 0.1, y = 2.4, z = -12.4; w.add('g', rcyl(0.55, 0.08, 0.03, 32), 0xffffff, x - 0.04, y, z, 0, 0, PI / 2); w.add('x', torus(0.08, 32, PI), DK, x - 0.1, y, z, 0, -PI / 2, 0, 0.5, 0.5, 0.5);
      [0x22c55e, YEL, RED].forEach((c, i) => w.add('g', torus(0.12, 16, PI / 3), c, x - 0.12, y, z, PI / 2 - (i * PI / 3), -PI / 2, 0, 0.42, 0.42, 0.42)); w.add('x', rbox(0.03, 0.45, 0.03, 0.01), 0x111827, x - 0.16, y + 0.18, z + 0.1, 0.5, 0, 0);
      txt(w, 'BONK-O-METER', x - 0.06, y - 0.8, z, -PI / 2, 0.11, TEAL); }
    { const T = w.tf(57.8, 0, -12.0, -0.5); T.box('x', DK, 0, 0, 0, 0.9, 0.5, 0.6, 0.04); T.add('g', capsule(16), 0xfef3c7, 0, 0.95, 0, PI / 2, 0, 0, 0.32, 0.9, 0.32); T.add('g', rbox(1.7, 0.06, 0.38, 0.03), 0xfef3c7, 0, 0.95, -0.1);
      [[0.2, 0.9, 0.33], [-0.35, 1.05, 0.3], [0.55, 1.2, 0]].forEach(([a, b, c2]) => { T.add('g', rcyl(0.11, 0.02, 0.005, 16), YEL, a, b, c2 || 0.31, PI / 2, 0, 0); T.add('g', rbox(0.11, 0.022, 0.012, 0.004), 0x111827, a, b, (c2 || 0.31) + 0.012, 0, 0, PI / 4); T.add('g', rbox(0.11, 0.022, 0.012, 0.004), 0x111827, a, b, (c2 || 0.31) + 0.012, 0, 0, -PI / 4); });
      T.solid(-0.9, 0, -0.4, 0.9, 1.3, 0.4); const g = txtGeo('DUMMY 07', 0.1); if (g) T.add('g', g, 0x111827, 0, 0.28, 0.31); }
    { const T = w.tf(54.4, 0, -12.3, 0.4); T.box('x', DK, 0, 0, 0, 0.8, 0.85, 0.5, 0.03); monitorAt(T, 0, 0.85, 0, 0x14b8a6); for (let i = 0; i < 5; i++) T.add('l', rbox(0.08, 0.06 + i * 0.05, 0.01, 0.005), 0x22c55e, -0.2 + i * 0.1, 1.06 + (0.06 + i * 0.05) / 2, 0.05, 0, 0, 0, 1, 1, 1, 0.5); T.solid(-0.4, 0, -0.25, 0.4, 0.9, 0.25); }
    { const x = 58.9, z = -7.0; w.add('x', cyl(8), DK, x, 0, z, 0, 0, 0, 0.03, 1.2, 0.03); w.add('x', rcyl(0.2, 0.03, 0.01, 12), DK, x, 0, z); w.add('g', rbox(0.35, 0.45, 0.03, 0.01), 0x92400e, x, 1.35, z, -0.4, -PI / 2, 0); w.add('g', rbox(0.3, 0.35, 0.01, 0.005), 0xffffff, x - 0.02, 1.33, z, -0.4, -PI / 2, 0); }
    txt(w, 'CRASH-TEST LAB', 56.2, 6.15, z0 + 0.1, 0, 0.22, TEAL); }
  // --- EAST BAY: second workbench under the upgrades board (gearbox, rotor hub, wrench roll, vise), rolling parts cart, barrels + crates
  { const T = w.tf(x1 - 0.75, 0, -0.9, -PI / 2); T.slab('m', WOOD, 0, 0.82, 0, 2.8, 0.1, 0.9, 0.03); [-1.25, 1.25].forEach((a) => [-0.35, 0.35].forEach((c) => T.box('x', DK, a, 0, c, 0.07, 0.82, 0.07, 0.02))); T.box('x', 0x475569, 0, 0.18, 0, 2.6, 0.05, 0.8, 0.01);
    T.add('x', rcyl(0.26, 0.3, 0.04, 20), 0x64748b, -0.85, 0.92, 0.05); T.add('x', cyl(14), 0x94a3b8, -0.85, 1.22, 0.05, 0, 0, 0, 0.07, 0.25, 0.07); for (let k = 0; k < 4; k++) T.add('g', rbox(0.5, 0.04, 0.09, 0.02), RED, -0.85 + Math.cos(k * PI / 2) * 0.28, 1.42, 0.05 + Math.sin(k * PI / 2) * 0.28, 0, -k * PI / 2, 0);
    T.box('g', 0x2563eb, 0.05, 0.92, -0.1, 0.55, 0.32, 0.4, 0.04); T.add('x', torus(0.3, 20), 0x94a3b8, 0.05, 1.3, -0.1, PI / 2, 0, 0, 0.12, 0.12, 0.12); T.add('m', rbox(0.7, 0.03, 0.3, 0.01), 0x7f1d1d, 0.75, 0.885, 0.15, 0, 0.2, 0);
    for (let k = 0; k < 6; k++) T.add('x', rbox(0.035, 0.012, 0.2 + k * 0.025, 0.006), MET, 0.55 + k * 0.08, 0.91, 0.15, 0, 0.2, 0); T.box('x', DK, 1.15, 0.92, -0.25, 0.25, 0.18, 0.2, 0.02); T.add('x', rbox(0.3, 0.07, 0.06, 0.02), 0x475569, 1.15, 1.15, -0.25);
    T.add('g', sph(12), YEL, -0.25, 0.97, 0.3, 0, 0, 0, 0.05); for (let k = 0; k < 5; k++) T.add('x', cyl(8), MET, -0.4 + k * 0.05, 0.89, 0.32, 0, 0, 0, 0.012, 0.06, 0.012); }
  { const T = w.tf(56.6, 0, -4.4, 0.35); T.box('x', DK, 0, 0.18, 0, 1.1, 0.05, 0.6, 0.02); T.box('x', DK, 0, 0.82, 0, 1.1, 0.05, 0.6, 0.02); [-0.5, 0.5].forEach((a) => [-0.25, 0.25].forEach((c) => { T.box('x', 0x64748b, a, 0.08, c, 0.04, 0.8, 0.04, 0.01); T.add('x', sph(8), 0x111827, a, 0.06, c, 0, 0, 0, 0.06); }));
    T.add('x', capsule(8), 0x64748b, -0.6, 0.95, 0, PI / 2, 0, 0, 0.03, 0.5, 0.03); T.box('m', 0xc9a06a, -0.22, 0.87, 0, 0.45, 0.3, 0.45, 0.02); T.add('x', rcyl(0.18, 0.12, 0.03, 16), MET, 0.28, 0.87, 0); T.add('g', torus(0.25, 16), 0x111827, 0.25, 0.3, 0, PI / 2, 0, 0, 0.18, 0.18, 0.18); T.add('x', cyl(10), 0xcbd5e1, 0.25, 0.23, 0, 0, 0, 0, 0.07, 0.14, 0.07); T.solid(-0.65, 0, -0.35, 0.65, 1.1, 0.35); }
  [[x1 - 0.55, 1.05, 0x16a34a], [x1 - 1.2, 1.25, 0x2563eb], [x1 - 0.6, 1.75, RED]].forEach(([x, z, c]) => { w.add('g', cyl(20), c, x, 0, z, 0, 0, 0, 0.3, 0.9, 0.3); [0.2, 0.6].forEach((y) => w.add('x', torus(0.06, 20), DK, x, y, z, PI / 2, 0, 0, 0.31, 0.31, 0.31)); w.add('x', rcyl(0.28, 0.02, 0.01, 20), DK, x, 0.9, z); w.solid(x - 0.3, 0, z - 0.3, x + 0.3, 0.92, z + 0.3); });
  K.crate(w, x1 - 0.7, 0.92, 1.4, 0.7, 0x8b5a2b);
  // --- WALL WAINSCOT + orange stripe (breaks up the big white walls; skips the door, stays under the window sills)
  { const WN = 0x64748b, ST = 0xf97316, hh = 0.95;
    const run = (ax, at, a, b, sg) => { const L = b - a, m = (a + b) / 2; if (L <= 0.05) return; if (ax === 'x') { w.add('m', rbox(L, hh, 0.04, 0.01), WN, m, hh / 2, at + sg * 0.02); w.add('g', rbox(L, 0.1, 0.06, 0.01), ST, m, hh + 0.05, at + sg * 0.03); }
      else { w.add('m', rbox(0.04, hh, L, 0.01), WN, at + sg * 0.02, hh / 2, m); w.add('g', rbox(0.06, 0.1, L, 0.01), ST, at + sg * 0.03, hh + 0.05, m); } };
    run('x', z0, x0, x1, 1); run('x', z1, x0, x1, -1); run('z', x1, z0, z1, -1); run('z', x0, z0, cz - 4.5, 1); run('z', x0, cz + 4.5, z1, 1); }
  // --- ON & AROUND THE LIFT: A-frame ladder, mechanic's creeper, work light, small tool cart, cones, rolling stair platform
  const LY = 0.35;
  { const T = w.tf(44.5, LY, -6.3, 0.5); [-1, 1].forEach((sd) => [-0.32, 0.32].forEach((a) => T.add('x', rbox(0.06, 2.3, 0.08, 0.02), YEL, a, 1.1, sd * 0.42, sd * -0.2, 0, 0))); for (let i = 0; i < 5; i++) { const y = 0.35 + i * 0.42, dz = 0.42 - y * 0.2; [-1, 1].forEach((sd) => T.add('x', rbox(0.62, 0.04, 0.12, 0.01), 0x94a3b8, 0, y, sd * dz)); } T.add('x', rbox(0.7, 0.08, 0.3, 0.02), RED, 0, 2.25, 0); }
  { const T = w.tf(45.2, LY, 1.9, -0.4); T.box('g', RED, 0, 0.1, 0, 0.55, 0.06, 1.15, 0.02); T.box('m', 0x111827, 0, 0.16, -0.4, 0.4, 0.06, 0.25, 0.03); [-0.22, 0.22].forEach((a) => [-0.45, 0.45].forEach((c) => T.add('x', sph(8), 0x111827, a, 0.05, c, 0, 0, 0, 0.05))); }
  { const T = w.tf(53.6, LY, -6.6, 2.4); for (let i = 0; i < 3; i++) { const a = i * PI * 2 / 3; T.add('x', rbox(0.04, 1.7, 0.04, 0.01), DK, Math.cos(a) * 0.32, 0.8, Math.sin(a) * 0.32, Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2); } T.add('x', cyl(8), DK, 0, 1.55, 0, 0, 0, 0, 0.025, 0.5, 0.025);
    T.add('x', rbox(0.5, 0.36, 0.14, 0.04), 0x1f2937, 0, 2.05, 0, -0.35, 0, 0); T.add('l', rbox(0.42, 0.28, 0.02, 0.02), 0xfff7d6, 0, 2.05, 0.08, -0.35, 0, 0, 1, 1, 1, 1.0); }
  { const T = w.tf(53.7, LY, 2.4, -0.7); T.box('g', RED, 0, 0.12, 0, 0.8, 0.06, 0.5, 0.02); T.box('g', RED, 0, 0.55, 0, 0.8, 0.06, 0.5, 0.02); T.box('g', RED, 0, 0.9, 0, 0.8, 0.06, 0.5, 0.02); [-0.37, 0.37].forEach((a) => [-0.22, 0.22].forEach((c) => { T.box('x', DK, a, 0.05, c, 0.04, 0.9, 0.04, 0.01); T.add('x', sph(8), 0x111827, a, 0.04, c, 0, 0, 0, 0.045); }));
    T.add('x', rbox(0.3, 0.05, 0.05, 0.02), MET, -0.15, 0.99, 0, 0, 0.4, 0); T.add('x', torus(0.3, 12), MET, 0.15, 0.99, 0.05, PI / 2, 0, 0, 0.07); T.box('m', 0xc9a06a, 0.1, 0.61, 0, 0.35, 0.22, 0.3, 0.02); T.add('g', cyl(12), 0x2563eb, -0.2, 0.61, 0, 0, 0, 0, 0.09, 0.25, 0.09); T.solid(-0.42, -LY, -0.27, 0.42, 1.0, 0.27); }
  [[42.2, -7.4], [42.3, 3.5], [55.9, 4.6]].forEach(([x, z]) => { w.add('g', rbox(0.42, 0.05, 0.42, 0.02), 0xf97316, x, 0.025, z); w.add('g', cone(16), 0xf97316, x, 0.05, z, 0, 0, 0, 0.17, 0.62, 0.17); w.add('g', cyl(16), 0xffffff, x, 0.3, z, 0, 0, 0, 0.115, 0.1, 0.115); });
  { const T = w.tf(56.7, 0, 1.3, 0); for (let i = 0; i < 5; i++) T.box('x', 0x94a3b8, 0, i * 0.38, -0.9 + i * 0.3, 0.9, 0.06, 0.3, 0.01); T.box('g', YEL, 0, 1.85, 0.85, 1.0, 0.08, 1.0, 0.02);
    [-0.47, 0.47].forEach((a) => { T.add('x', tube([[a, 0.1, -1.05], [a, 1.95, 0.35], [a, 1.95, 1.35]], 0.03, 12, 6), YEL, 0, 0, 0); T.add('x', tube([[a, 1.85, 0.35], [a, 2.85, 0.35], [a, 2.85, 1.35], [a, 1.85, 1.35]], 0.025, 12, 6), YEL, 0, 0, 0); [[a, 0.35], [a, 1.35]].forEach(([px, pz]) => T.add('x', cyl(8), DK, px, 0, pz, 0, 0, 0, 0.04, 1.85, 0.04)); T.add('x', sph(8), 0x111827, a, 0.05, -1.0, 0, 0, 0, 0.06); });
    T.add('x', rbox(1.0, 0.03, 0.03, 0.01), YEL, 0, 2.85, 1.35); T.solid(-0.5, 0, 0.3, 0.5, 1.9, 1.4); }
  // --- WINDOW LIGHT: warm daylight pools on the floor in front of every clear window + glowing sills
  [[38.3, z1, 0], [47.0, z1, 0], [x1, -8, 1], [x1, 4, 1]].forEach(([x, z, e]) => { const inw = e === 1 ? [x - 1.9, z] : e === 2 ? [x, z + 2.3] : [x, z - 1.9];
    w.add('l', rbox(e === 1 ? 1.7 : 2.3, 0.01, e === 1 ? 2.3 : 1.7, 0.3), 0xfff1c9, inw[0], 0.035, inw[1], 0, 0, 0, 1, 1, 1, 0.22);
    w.add('l', rbox(e === 1 ? 0.12 : 2.4, 0.03, e === 1 ? 2.4 : 0.12, 0.01), 0xfff7d6, e === 1 ? x - 0.06 : x, 1.12, e === 1 ? z : z - 0.06, 0, 0, 0, 1, 1, 1, 0.6); });
}
// small helpers for the detail pass
function monitorAt(T, x, y, z, scr = 0x38bdf8) { T.add('x', rcyl(0.12, 0.03, 0.01, 16), DKC, x, y, z); T.add('x', cyl(8), 0x475569, x, y, z, 0, 0, 0, 0.03, 0.22, 0.03); T.box('g', 0x1e293b, x, y + 0.18, z, 0.55, 0.36, 0.05, 0.02); T.box('l', scr, x, y + 0.2, z + 0.03, 0.5, 0.3, 0.01, 0.005, 0.35); }
const DKC = 0x334155;
// ------------------------------------------------------------------------------------------------
// SNOWIE AIRFIELD: runway, taxiway, apron with the Plane Lineup (7 parking bays) and the control tower
function airfield(w) { const X0 = -90, X1 = 50, Z0 = -80, Z1 = -64, zc = (Z0 + Z1) / 2;
  K.floor(w, -4, -64, 4, -36, 'tile', 0.03, 0x6b7280, 0x64748b, 2); K.floor(w, -78, -62, 62, -42, 'tile', 0.03, 0xd1d5db, 0xc7cdd5, 4);
  runway(w, X0, Z0, X1, Z1, 0, 'stripHub', 'Snowie Airfield Runway', 'hub', ['09', '27']);
  SPOTS.lineup = []; const xs = [-66, -50, -34, -18, 18, 34, 50];
  xs.forEach((x, i) => { const z = -52; SPOTS.lineup.push({ x, z, ry: 0 }); [-1, 1].forEach((s) => w.add('g', rbox(0.25, 0.04, 16, 0.02), 0xfacc15, x + s * 7.8, 0.06, z)); w.add('g', rbox(15.8, 0.04, 0.25, 0.02), 0xfacc15, x, 0.06, z - 8); w.add('l', rcyl(1.6, 0.03, 0.01, 24), 0xffffff, x, 0.06, z + 4, 0, 0, 0, 1, 1, 1, 0.1);
    // sign stand in front of each bay
    w.add('x', cyl(10), 0x334155, x - 4.5, 0, -42.6, 0, 0, 0, 0.07, 1.2, 0.07); w.add('x', cyl(10), 0x334155, x + 4.5, 0, -42.6, 0, 0, 0, 0.07, 1.2, 0.07); w.add('g', rbox(9.6, 0.9, 0.16, 0.06), 0x1e293b, x, 1.55, -42.6); w.solid(x - 4.8, 0, -42.8, x + 4.8, 2.0, -42.4); });
  txt(w, 'PLANE LINEUP', 0, 3.2, -41.5, 0, 0.8, 0xff4fa0); w.add('x', cyl(10), 0x334155, -6, 0, -41.6, 0, 0, 0, 0.1, 3, 0.1); w.add('x', cyl(10), 0x334155, 6, 0, -41.6, 0, 0, 0, 0.1, 3, 0.1); w.add('g', rbox(13, 1.4, 0.2, 0.08), 0xffffff, 0, 3.5, -41.7);
  // control tower (tour stop)
  { const x = -84, z = -50, T = w.tf(x, 0, z, 0); T.slab('g', 0xe5e7eb, 0, 0, 0, 6, 3.2, 6, 0.2); T.add('g', rcyl(1.9, 13, 0.2, 28), 0xf8fafc, 0, 3.2, 0); for (let i = 0; i < 5; i++) T.add('g', rcyl(1.95, 0.25, 0.05, 28), i % 2 ? 0xff4fa0 : 0x3ff0ff, 0, 4.5 + i * 2.4, 0);
    T.add('g', rcyl(3.6, 0.5, 0.15, 32), 0x334155, 0, 16.0, 0); T.add('e', rcyl(3.3, 2.6, 0.2, 32), 0x9fd8ff, 0, 16.5, 0); T.add('g', rcyl(3.9, 0.45, 0.15, 32), 0xff4fa0, 0, 19.1, 0); T.add('x', cyl(8), 0x94a3b8, 0, 19.5, 0, 0, 0, 0.08, 4.5, 0.08); T.add('l', sph(10), 0xff3b3b, 0, 24.1, 0, 0, 0, 0, 0.3, 0.3, 0.3, 1.4);
    T.add('x', rbox(2.6, 0.12, 0.12, 0.04), 0x94a3b8, 0, 21.5, 0); T.add('x', rbox(0.12, 0.12, 2.6, 0.04), 0x94a3b8, 0, 21.5, 0); w.solid(x - 3.9, 0, z - 3.9, x + 3.9, 19.6, z + 3.9); txt(w, 'SNOWIE AIRFIELD', x, 2.2, z + 3.15, 0, 0.36, 0xff4fa0);
    TOURS.push({ id: 'tower', name: 'Snowie Airfield Tower', x, z, y: 22, town: 'hub' }); w.lights.push({ x, y: 17, z, c: 0xbfe9ff, i: 10, d: 14 }); }
  // windsock + fuel truck + baggage carts on the apron edge
  { const x = 56, z = -60; w.add('x', cyl(10), 0xe5e7eb, x, 0, z, 0, 0, 0, 0.08, 6, 0.08); w.add('f', cone(16), 0xff7a1a, x - 1.2, 5.6, z, 0, 0, PI / 2, 0.4, 2.4, 0.4); }
  { const T = w.tf(-72, 0, -44.5, PI / 2); T.slab('g', 0xef4444, 0, 0.4, -1.4, 2.0, 1.4, 1.8, 0.2); T.add('g', capsule(16), 0xe5e7eb, 0, 1.25, 0.9, PI / 2, 0, 0, 1.6, 1.5, 1.4); T.box('e', 0xbfe9ff, 0, 1.15, -2.25, 1.7, 0.6, 0.06, 0.04); [-1, 1].forEach((s) => [-1.6, 1.2].forEach((zz) => T.add('x', rcyl(0.36, 0.25, 0.06, 16), 0x1f2937, s * 0.95, 0.36, zz, 0, 0, PI / 2))); txt(w, 'FUEL', -72 + 1.6 * 0 - 0.85, 1.5, -44.5 + 0.9, -PI / 2 * 0 + PI / 2, 0.25, 0xff4fa0); }
  reserve(-90, -84, 50, -60); }
function runway(w, X0, Z0, X1, Z1, y, id, name, town, nums, snow) { const xc = (X0 + X1) / 2, zc = (Z0 + Z1) / 2, L = X1 - X0, Wd = Z1 - Z0;
  w.add('m', rbox(L, 0.12, Wd, 0.05, 1), snow ? 0x64748b : 0x4b5563, xc, y + 0.0, zc); w.solid(X0, y - 3, Z0, X1, y + 0.06, Z1, { floor: true });
  for (let x = X0 + 14; x < X1 - 14; x += 9) w.add('g', rbox(4.5, 0.03, 0.4, 0.01), 0xffffff, x, y + 0.075, zc);
  [X0 + 3, X1 - 3].forEach((x, e) => { for (let i = 0; i < 6; i++) w.add('g', rbox(4, 0.03, 0.9, 0.01), 0xffffff, x, y + 0.075, Z0 + 2 + i * (Wd - 4) / 5); if (nums) txt(w, nums[e], x + (e ? -7 : 7), y + 0.07, zc, e ? -PI / 2 : PI / 2, 1.6, 0xffffff, 'g'); });
  [Z0 + 0.4, Z1 - 0.4].forEach((z) => w.add('g', rbox(L - 1, 0.03, 0.25, 0.01), 0xffffff, xc, y + 0.075, z));
  for (let x = X0; x <= X1; x += 10) [Z0 - 0.6, Z1 + 0.6].forEach((z, k) => w.add('l', sph(8), (x === X0 || x === X1) ? (k ? 0x22c55e : 0xef4444) : 0xffd23f, x, y + 0.18, z, 0, 0, 0, 0.16, 0.12, 0.16, 0.9));
  PADS.push({ id, x: xc, z: zc, y: y + 0.06, col: 0xffffff, name, town, walk: true, strip: [X0, Z0, X1, Z1] }); reserve(X0 - 4, Z0 - 4, X1 + 4, Z1 + 4); }
// runways at the other towns (each with a little terminal shack, windsock and a walk zone)
function strips(w) {
  const S = [['stripPup', -295, -68, -185, -52, 'Pup Town Airstrip', 'pup', 0xffd23f, ['09', '27']], ['stripTort', 160, -103, 270, -87, 'Torty Town Airstrip', 'tort', 0x14b8a6, ['09', '27']], ['stripNP', -155, 167, -55, 183, 'North Pole Airstrip', 'np', 0xef4444, ['09', '27'], true]];
  for (const [id, x0, z0, x1, z1, name, town, col, nums, snow] of S) { const y = Hf((x0 + x1) / 2, (z0 + z1) / 2); runway(w, x0, z0, x1, z1, y, id, name, town, nums, snow); ZONES.push({ rect: [x0 - 6, z0 - 10, x1 + 6, z1 + 4], town, y });
    const sx = x0 + 12, sz = z0 - 6, T = w.tf(sx, y, sz, 0); T.slab('g', 0xffffff, 0, 0, 0, 7, 3.2, 4, 0.15); T.box('g', col, 0, 3.2, 0, 7.6, 0.4, 4.6, 0.15); T.box('e', 0xbfe9ff, 0, 1.4, 2.02, 5, 1.3, 0.06, 0.04); txt(w, name.toUpperCase(), sx, y + 3.9, sz + 2.35, 0, 0.3, col);
    if (snow) T.box('m', 0xffffff, 0, 3.6, 0, 7.4, 0.25, 4.4, 0.12); w.add('x', cyl(10), 0xe5e7eb, x1 - 6, y, z0 - 5, 0, 0, 0, 0.08, 6, 0.08); w.add('f', cone(16), 0xff7a1a, x1 - 4.8, y + 5.6, z0 - 5, 0, 0, -PI / 2, 0.4, 2.4, 0.4); reserve(sx - 5, sz - 4, sx + 5, sz + 4); } }
// SEAPLANE DOCK on Lake Shimmer: pier + floating pad + boathouse + buoys
function seaDock(w) { const y = WATER_Y + 0.85, zc = 30; const T = w.tf(198, y, zc, 0);
  T.slab('m', 0xb07a3c, 0, 0, 0, 30, 0.25, 3.2, 0.06, { floor: true }); for (let i = 0; i < 11; i++) [-1, 1].forEach((s) => T.add('m', cyl(10), 0x7c4a1e, -14 + i * 2.8, -3.5, s * 1.5, 0, 0, 0, 0.16, 4.2, 0.16)); for (let i = 0; i < 30; i++) T.box('m', 0x9a6a3e, -14.75 + i, 0.25, 0, 0.9, 0.02, 3.1, 0.01);
  pad(w, 'lakeDock', 221, zc, WATER_Y, 0x0ea5e9, 'Lake Shimmer Seaplane Dock', 'tort'); PADS[PADS.length - 1].water = true; ZONES.push({ rect: [181, 24, 227, 36], town: 'dock', y: WATER_Y });
  { const x = 178, z = zc, yy = Hf(x, z), T2 = w.tf(x, sinkY(x, z, 2.5, 0.1), z, PI / 2); T2.slab('m', 0x0ea5e9, 0, 0, 0, 5, 3, 4, 0.12); T2.box('m', 0xffffff, 0, 3, 0, 5.6, 0.3, 4.6, 0.1); T2.add('m', K.wedge ? cone(4) : cone(4), 0x075985, 0, 3.3, 0, 0, PI / 4, 0, 3.9, 1.6, 3.4); txt(w, 'SEAPLANE DOCK', x + 2.05, yy + 2.3, z, PI / 2, 0.3, 0xffffff); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2, x = 221 + Math.cos(a) * 11, z = zc + Math.sin(a) * 11; w.add('g', sph(14), i % 2 ? 0xef4444 : 0xffffff, x, WATER_Y + 0.1, z, 0, 0, 0, 0.5, 0.55, 0.5); w.add('x', cyl(8), 0x334155, x, WATER_Y + 0.5, z, 0, 0, 0, 0.04, 0.6, 0.04); }
  { const T3 = w.tf(206, WATER_Y + 0.05, zc + 5, 0.3); T3.add('m', capsule(16), 0xb07a3c, 0, 0.2, 0, PI / 2, 0, 0, 1.3, 1.8, 0.7); T3.add('m', capsule(16), 0x7c4a1e, 0, 0.35, 0, PI / 2, 0, 0, 1.1, 1.6, 0.4); T3.box('m', 0x9a6a3e, 0, 0.3, 0.5, 1.1, 0.08, 0.3, 0.02); }
  reserve(176, 24, 230, 36); }
// ------------------------------------------------------------------------------------------------
// CHEDDAR FARM around the Ratita cheese windmill: red barn, silo, sheep pasture, tulip rows, hay bales, orchard
function farm(w) { const y0 = Hf(80, -82);
  { const x = 104, z = -126, T = w.tf(x, Hf(x, z), z, PI / 2); T.slab('g', 0xb91c1c, 0, 0, 0, 10, 5.2, 8, 0.15); [-1, 1].forEach((s) => T.add('g', rbox(10.8, 0.3, 5.0, 0.08), 0x7f1d1d, 0, 6.35, s * 2.05, s * 0.62, 0, 0)); [-1, 1].forEach((s) => { const tri = new THREE.Shape(); tri.moveTo(-4, 0); tri.lineTo(4, 0); tri.lineTo(0, 2.9); tri.lineTo(-4, 0); T.add('g', new THREE.ExtrudeGeometry(tri, { depth: 0.2, bevelEnabled: false }), 0xb91c1c, s * 4.95, 5.2, 0, 0, PI / 2, 0); });
    T.box('g', 0xffffff, 5.02, 0.0, 0, 0.1, 3.6, 3.6, 0.04); [-1, 1].forEach((s) => T.add('g', rbox(0.1, 0.25, 4.9, 0.03), 0xffffff, 5.08, 1.8, 0, s * 0.75, 0, 0)); T.box('g', 0xfef3c7, 5.02, 4.0, 0, 0.1, 1.0, 1.2, 0.04); }
  { const x = 114, z = -121; w.oy = Hf(x, z); w.add('g', rcyl(2.3, 11, 0.2, 28), 0xe5e7eb, x, 0, z); w.add('g', sph(24), 0x94a3b8, x, 11, z, 0, 0, 0, 2.35, 1.8, 2.35); for (let i = 0; i < 4; i++) w.add('x', rcyl(2.36, 0.15, 0.04, 28), 0x94a3b8, x, 2 + i * 2.6, z); w.solid(x - 2.3, 0, z - 2.3, x + 2.3, 12.5, z + 2.3); w.oy = 0; }
  // pasture + sheep
  K.fenceRun(w, 'x', -100, 60, 82, 1.1, 0xfef3c7); K.fenceRun(w, 'x', -84, 60, 82, 1.1, 0xfef3c7); K.fenceRun(w, 'z', 60, -100, -84, 1.1, 0xfef3c7); K.fenceRun(w, 'z', 82, -100, -84, 1.1, 0xfef3c7);
  w.oy = y0; w.detail = true; [[65, -95], [70, -88], [76, -96], [79, -89], [67, -90]].forEach(([x, z], i) => { const T = w.tf(x, 0, z, i * 1.3); T.add('g', blobGeo(5 + i, 0.18, 2), 0xffffff, 0, 0.75, 0, 0, 0, 0, 0.7, 0.55, 0.95); T.add('g', sph(14), 0x1f2937, 0, 0.95, 0.85, 0, 0, 0, 0.28, 0.3, 0.32); [-1, 1].forEach((s) => { T.add('g', sph(8), 0x1f2937, s * 0.22, 1.12, 0.78, 0, 0, s * 0.6, 0.14, 0.06, 0.08); [-1, 1].forEach((f) => T.add('g', cyl(8), 0x1f2937, s * 0.3, 0, f * 0.45, 0, 0, 0, 0.07, 0.4, 0.07)); }); });
  // tulip rows + hay bales
  for (let r = 0; r < 7; r++) { const c = [0xff4fa0, 0xffd23f, 0xef4444, 0xa78bfa, 0xffffff, 0xff7a3d, 0xf472b6][r]; w.add('m', rbox(0.9, 0.18, 18, 0.06), 0x6b4423, 87 + r * 2, 0.05, -69.5); for (let i = 0; i < 14; i++) { const x = 87 + r * 2, z = -78 + i * 1.3; w.add('m', cyl(6), 0x15803d, x, 0.1, z, 0, 0, 0, 0.04, 0.5, 0.04); w.add('g', sph(8), c, x, 0.65, z, 0, 0, 0, 0.2, 0.24, 0.2); } }
  [[80, -60], [83, -58], [78, -57.5], [84, -61.5]].forEach(([x, z], i) => { w.add('m', rcyl(0.9, 1.4, 0.25, 20), 0xeab308, x, 0.9, z, PI / 2, i * 0.8, 0); w.solid(x - 0.9, 0, z - 0.9, x + 0.9, 1.8, z + 0.9); });
  w.detail = false; w.oy = 0;
  // orchard rows (apples!) just south of the farm
  w.detail = true; for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) { const x = 62 + i * 6, z = -116 - r * 6; if (slopeAt(x, z) > 3 || Math.hypot(x - 80, z + 124) < 8) continue; const y = sinkY(x, z, 0.6); roundTree(w, x, z, 0.75, y, 0x16a34a); for (let k = 0; k < 6; k++) { const a = k * 1.05; w.add('g', sph(8), 0xdc2626, x + Math.cos(a) * 1.2, y + 2.4 + (k % 2) * 0.5, z + Math.sin(a) * 1.2, 0, 0, 0, 0.16); } } w.detail = false;
  pad(w, 'farm', 108, -82, y0, 0x84cc16, 'Cheddar Farm Pad', 'hub', false);
  TOURS.push({ id: 'farm', name: 'Cheddar Farm Windmill', x: 80, z: -124, y: Hf(80, -124) + 18, town: 'hub' }); reserve(58, -134, 120, -56); }
// ------------------------------------------------------------------------------------------------
// RAINBOW FALLS: a rocky cliff on Frost Pond's north shore, a glassy waterfall, foam and a 3D rainbow
function falls(w) { const cx = 70, cz = 219, top = Math.max(Hf(cx, cz + 10), 12) + 2, base = WATER_Y - 1;
  for (let i = 0; i < 26; i++) { const a = -PI * 0.95 + (i % 13) / 12 * PI * 0.9, row = i / 13 | 0, r = 14 + row * 3; const x = cx + Math.cos(a) * r, z = cz - 4 + Math.sin(a) * -r * 0.35 + row * 3; const s = 3 + (i % 4) * 0.8; const y = base + s * 0.6 + row * (top - base) * 0.45;
    if (Math.abs(x - cx) < 4 && row === 0) continue; w.add('g', blobGeo(i * 7 + 3, 0.28, 2), i % 3 ? 0xb0a99f : 0xc2b8ab, x, y, z, 0, i, 0, s, s * 1.2, s); w.solid(x - s * 0.7, base, z - s * 0.7, x + s * 0.7, y + s * 0.9, z + s * 0.7); }
  for (let k = 0; k < 4; k++) { const y = base + 3 + k * (top - base - 3) / 3; [-1, 1].forEach((s) => w.add('g', blobGeo(40 + k * 2 + (s > 0 ? 1 : 0), 0.3, 2), 0xa39a8f, cx + s * 4.6, y, cz + 1, 0, k, 0, 3.2, 3.4, 3)); w.solid(cx - 7.6, base, cz - 1, cx - 1.8, y + 3, cz + 3.5); w.solid(cx + 1.8, base, cz - 1, cx + 7.6, y + 3, cz + 3.5); }
  w.add('g', blobGeo(77, 0.25, 2), 0xa39a8f, cx, top - 1.5, cz + 4, 0, 0, 0, 6, 2.5, 4);
  // the water: a glassy curtain + a ribbon of white water + foam + mist; then the stream on top
  w.add('e', rbox(4.2, top - WATER_Y, 0.5, 0.2), 0x7dd3fc, cx, (top + WATER_Y) / 2, cz - 1.2, 0.04, 0, 0); w.add('l', rbox(2.2, top - WATER_Y - 0.5, 0.2, 0.1), 0xe0f7ff, cx, (top + WATER_Y) / 2, cz - 1.55, 0.04, 0, 0, 1, 1, 1, 0.15);
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; w.add('g', sph(12), 0xffffff, cx + Math.cos(a) * 2.6, WATER_Y + 0.15, cz - 2.5 + Math.sin(a) * 1.3, 0, 0, 0, 0.9, 0.45, 0.9); }
  { const P = dense([[cx, cz + 1], [cx + 2, cz + 14], [cx - 3, cz + 30], [cx + 4, cz + 48]], 3); const pos = [], idx = []; let k = 0; P.forEach(([x, z], i) => { const y = i === 0 ? top - 0.4 : Math.max(top - 0.4, Hf(x, z) + 0.15); pos.push(x - 2, y, z, x + 2, y, z); if (i) idx.push(k - 2, k - 1, k, k - 1, k + 1, k); k += 2; }); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); w.add('e', g, 0x7dd3fc, 0, 0, 0); }
  // rainbow arch over the plunge pool
  [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x3b82f6, 0x8b5cf6].forEach((c, i) => w.add('l', torus(0.06, 48, PI), c, cx, WATER_Y + 1, cz - 9, 0, 0, 0, 13 - i * 0.55, 13 - i * 0.55, 13 - i * 0.55, 0.25));
  TOURS.push({ id: 'falls', name: 'Rainbow Falls', x: cx, z: cz - 4, y: top + 4, town: 'np' }); reserve(cx - 20, cz - 10, cx + 20, cz + 50); }
// WHISPERING WOODS CAMP: tents, a campfire ring with log seats, the ranger cabin and a sign (around Waffles' clearing)
function camp(w) { const cx = -360, cz = 40, y = Hf(cx, cz);
  const tent = (x, z, ry, col) => { const T = w.tf(x, sinkY(x, z, 1.4, 0.05), z, ry); const tri = new THREE.Shape(); tri.moveTo(-1.4, 0); tri.lineTo(1.4, 0); tri.lineTo(0, 1.9); tri.lineTo(-1.4, 0); T.add('g', new THREE.ExtrudeGeometry(tri, { depth: 3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 }), col, 0, 0, -1.5); T.box('g', 0x1f2937, 0, 0, 1.56, 0.8, 1.1, 0.04, 0.02); T.solid(-1.4, 0, -1.5, 1.4, 1.9, 1.5); };
  tent(cx - 8, cz + 5, 0.4, 0xf97316); tent(cx + 7, cz + 6, -0.5, 0x22c55e); tent(cx + 6, cz - 7, PI + 0.3, 0x3b82f6);
  { const x = cx - 4, z = cz - 4, T = w.tf(x, y, z, 0); for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; T.add('g', sph(10), 0x78716c, Math.cos(a) * 0.9, 0.12, Math.sin(a) * 0.9, 0, 0, 0, 0.25, 0.18, 0.22); } for (let i = 0; i < 3; i++) T.add('m', cyl(10), 0x7c4a1e, 0, 0.18, 0, PI / 2, i * PI / 3, 0, 0.1, 1.2, 0.1);
    T.add('l', cone(10), 0xff7a1a, 0, 0.2, 0, 0, 0, 0, 0.4, 0.9, 0.4, 0.8); T.add('l', cone(10), 0xffd23f, 0.1, 0.2, 0.05, 0, 0, 0, 0.22, 0.6, 0.22, 1.0); [0, 2.1, 4.2].forEach((a) => T.add('m', capsule(12), 0x8b5a2b, Math.cos(a) * 2.4, 0.3, Math.sin(a) * 2.4, 0, -a, PI / 2, 0.45, 1.2, 0.45)); w.lights.push({ x, y: y + 1.2, z, c: 0xffa53d, i: 8, d: 10 }); }
  { const x = cx - 2, z = cz + 13, T = w.tf(x, sinkY(x, z, 3, 0.05), z, PI); for (let i = 0; i < 7; i++) { T.add('m', capsule(14), i % 2 ? 0x8b5a2b : 0x7c4a1e, 0, 0.3 + i * 0.42, -1.8, 0, 0, PI / 2, 0.42, 2.6, 0.42); T.add('m', capsule(14), i % 2 ? 0x7c4a1e : 0x8b5a2b, 0, 0.3 + i * 0.42, 1.8, 0, 0, PI / 2, 0.42, 2.6, 0.42); T.add('m', capsule(14), 0x7c4a1e, -2.6, 0.3 + i * 0.42, 0, PI / 2, 0, 0, 0.42, 1.9, 0.42); T.add('m', capsule(14), 0x7c4a1e, 2.6, 0.3 + i * 0.42, 0, PI / 2, 0, 0, 0.42, 1.9, 0.42); }
    [-1, 1].forEach((s) => T.add('g', rbox(6.2, 0.25, 2.7, 0.08), 0x166534, 0, 3.75, s * 1.15, s * 0.62, 0, 0)); T.box('g', 0x1f2937, 2.62, 0, 0, 0.08, 2.0, 1.0, 0.03); T.solid(-2.8, 0, -2.0, 2.8, 4.2, 2.0); }
  { const x = cx + 13, z = cz + 2, yy = sinkY(x, z, 0.5, 0.1); w.add('m', cyl(8), 0x7c4a1e, x - 1.4, yy, z, 0, 0, 0, 0.12, 2.2, 0.12); w.add('m', cyl(8), 0x7c4a1e, x + 1.4, yy, z, 0, 0, 0, 0.12, 2.2, 0.12); w.add('m', rbox(3.4, 1.0, 0.16, 0.06), 0x8b5a2b, x, yy + 1.9, z, 0, -PI / 2, 0); txt(w, 'WHISPERING WOODS CAMP', x + 0.1, yy + 1.75, z, PI / 2, 0.2, 0xfef3c7); } }
// ------------------------------------------------------------------------------------------------
// purposeful groves (no more random dots all over the map): each placed on gentle ground and sunk into it
function grove(w, cx, cz, R0, n, kind, s0 = 1, opts = {}) { let placed = 0; for (let i = 0; i < n * 3 && placed < n; i++) { const a = i * 2.39996, r = R0 * Math.sqrt((i + 0.5) / (n * 3)) * 1.6, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    if (r > R0) continue; const h = Hf(x, z); if (h < WATER_Y + 1.5 || slopeAt(x, z) > (kind === 'pine' ? 4.5 : 3.2) || !freeAt(x, z, 3)) continue; let bad = false; for (const k in TOWNS) { const t = TOWNS[k]; if (Math.hypot(x - t.x, z - t.z) < t.r + 4) bad = true; } if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 10) bad = true; if (bad) continue;
    const s = s0 * (0.85 + ((i * 37) % 10) / 22), y = sinkY(x, z, 0.7); if (kind === 'pine') pine(w, x, z, s, opts.snow || h > 26, y); else roundTree(w, x, z, s, y, opts.col ? opts.col[i % opts.col.length] : null); placed++; } return placed; }
function groves(w) { w.detail = true;
  grove(w, 125, 45, 34, 34, 'round', 1.1);                                                  // Maple Hollow, east of the Heliport
  grove(w, 140, -250, 30, 26, 'round', 1.0, { col: [0xf9a8d4, 0xf472b6, 0xfbcfe8] });       // Torty Town cherry blossoms
  grove(w, -330, -175, 32, 28, 'round', 1.15);                                                // Pup Town woods
  grove(w, -250, -275, 26, 18, 'round', 1.0, { col: [0x65a30d, 0x84cc16, 0x4d7c0f] });
  grove(w, 50, 290, 40, 30, 'pine', 1.3); grove(w, -170, 270, 40, 30, 'pine', 1.3); grove(w, 180, 300, 36, 26, 'pine', 1.25); grove(w, -300, 320, 34, 22, 'pine', 1.3); // snowy foothills
  grove(w, -200, 150, 30, 22, 'pine', 1.15); grove(w, 320, -160, 34, 26, 'round', 1.1); grove(w, -40, -180, 30, 22, 'round', 1.05); grove(w, -170, -330, 30, 20, 'pine', 1.2); grove(w, 330, -330, 30, 18, 'pine', 1.2);
  grove(w, 400, 90, 30, 20, 'round', 1.1); grove(w, -420, -60, 30, 18, 'pine', 1.2);
  // rocky outcrops where rocks belong: lakeshore boulders + mountain screes (sunk so they never float)
  [[340, 40, 6], [345, 0, 5], [205, 60, 4], [-300, 330, 7], [250, 380, 6], [120, -300, 6], [-60, 400, 5]].forEach(([cx, cz, n], j) => { for (let i = 0; i < n; i++) { const a = i * 2.4 + j, x = cx + Math.cos(a) * (4 + i * 2), z = cz + Math.sin(a) * (4 + i * 2); if (Hf(x, z) < WATER_Y + 0.3 || !freeAt(x, z, 2)) continue; const s = 1.4 + (i % 3) * 0.7; w.oy = sinkY(x, z, s * 0.7, s * 0.25); K.rock(w, x, z, s, Hf(x, z) > 30 ? 0x9ca3af : 0xb8a589); w.oy = 0; } });
  w.detail = false; }
function roadTrees(w) { w.detail = true; for (const r of ROADS) { const P = dense(r, 18); P.forEach(([x, z], i) => { if (i === 0 || i === P.length - 1) return; const a = P[i - 1], b = P[i + 1]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; const s = i % 2 ? 1 : -1, px = x - tz / l * 8.5 * s, pz = z + tx / l * 8.5 * s;
    let bad = false; for (const k in TOWNS) { const t = TOWNS[k]; if (Math.hypot(px - t.x, pz - t.z) < t.r + 6) bad = true; } if (bad || Hf(px, pz) < WATER_Y + 1 || slopeAt(px, pz) > 3 || !freeAtRoadside(px, pz)) return; roundTree(w, px, pz, 0.95, sinkY(px, pz, 0.6), i % 3 ? null : 0xfbbf24); }); } w.detail = false; }
function freeAtRoadside(x, z) { for (const r of RES) { if (x > r[0] - 1 && x < r[2] + 1 && z > r[1] - 1 && z < r[3] + 1 && (r[2] - r[0] > 14 || r[3] - r[1] > 14)) return false; } for (const p of PADS) if (Math.hypot(p.x - x, p.z - z) < 9) return false; return true; }
