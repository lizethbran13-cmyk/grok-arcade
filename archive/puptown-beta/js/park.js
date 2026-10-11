// Paw Park: entrance arch, dog run, agility course, fetch field, duck pond with stepping stones, the big oak (clue),
// Mittens' climbing tree, gazebo bandstand, picnic spots, flowers everywhere.
import * as THREE from 'three';
import * as K from './kit.js';
const { sign3d, rbox, rcyl, lathe, sph, cyl, cone, torus, capsule, tube, star, heart, blobGeo, pick, tree, bush, lampPost, bench, flowerBed, fenceRun } = K;
const R = K.R, PI = Math.PI;
const bisc = (w, x, y, z) => w.gears.push([x, y, z]);
export function park(w) { const I = w.I;
  // paths (pavers) + low hedge border with gaps
  K.floor(w, -2, 27, 2, 66, 'tile', 0.0, 0xe7d8bf, 0xd8c6a6, 1.3); K.floor(w, -20, 45, 20, 48, 'tile', 0.0, 0xe7d8bf, 0xd8c6a6, 1.3);
  const hedgeRow = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 1.2)); for (let i = 0; i <= n; i++) { const t = i / n; w.add('g', blobGeo(i & 15, 0.15, 2), 0x34a853, x0 + (x1 - x0) * t, 0.55, z0 + (z1 - z0) * t, 0, i, 0, 0.75, 0.6, 0.75); }
    w.solid(Math.min(x0, x1) - 0.6, 0, Math.min(z0, z1) - 0.6, Math.max(x0, x1) + 0.6, 1.1, Math.max(z0, z1) + 0.6, { cam: false }); };
  hedgeRow(-22, 27, -4, 27); hedgeRow(4, 27, 22, 27); hedgeRow(-23, 28, -23, 44); hedgeRow(-23, 49, -23, 66); hedgeRow(23, 28, 23, 44); hedgeRow(23, 49, 23, 66);
  // entrance arch
  { const z = 27; [-3.2, 3.2].forEach((x) => { w.add('m', rbox(0.6, 3.8, 0.6, 0.1), 0x8b5a2b, x, 1.9, z); w.solid(x - 0.3, 0, z - 0.3, x + 0.3, 3.8, z + 0.3); }); w.add('m', rbox(7.4, 0.6, 0.8, 0.12), 0x8b5a2b, 0, 4.0, z); sign3d(w, 'PAW PARK', 0, 4.4, z + 0.42, PI, 0.42, 0xffffff, 0x16a34a); sign3d(w, 'PAW PARK', 0, 4.4, z - 0.42, 0, 0.42, 0xffffff, 0x16a34a);
    // big paw on top
    w.add('g', sph(16), 0xff4fa0, 0, 5.5, z, 0, 0, 0, 0.55, 0.45, 0.2); [-1, -0.35, 0.35, 1].forEach((k) => w.add('g', sph(12), 0xff4fa0, k * 0.45, 6.15 - Math.abs(k) * 0.12, z, 0, 0, 0, 0.2, 0.24, 0.16)); }
  // ---- dog run (fenced, east) with toys
  { const x0 = 6, x1 = 20, z0 = 29.5, z1 = 43; fenceRun(w, 'x', z0, x0, x1, 1.0, 0x22c1c3); fenceRun(w, 'z', x1, z0, z1, 1.0, 0x22c1c3); fenceRun(w, 'x', z1, x0, x1, 1.0, 0x22c1c3); fenceRun(w, 'z', x0, z0, z0 + 5, 1.0, 0x22c1c3); fenceRun(w, 'z', x0, z0 + 8, z1, 1.0, 0x22c1c3);
    sign3d(w, 'DOG RUN', x0 - 0.1, 1.5, z0 + 6.5, -PI / 2, 0.22, 0xffffff, 0x0891b2); w.add('m', rbox(x1 - x0 - 0.3, 0.04, z1 - z0 - 0.3, 0.02), 0x7ccf5a, (x0 + x1) / 2, -0.03, (z0 + z1) / 2);
    for (let i = 0; i < 6; i++) K.hhY('ball', w, x0 + 1.5 + R() * (x1 - x0 - 3), 0, z0 + 1.5 + R() * (z1 - z0 - 3), 0.1, 1.5, pick([0xc6f432, 0xff4fa0, 0x4f9dff]), 0xffffff);
    // tire swing frame + little ramp + water station
    { const x = 16.5, z = 39.5; [-1, 1].forEach((s) => { w.add('m', cyl(8), 0x8b5a2b, x + s * 1.2, 0, z, 0, 0, s * 0.15, 0.1, 3.0, 0.1); }); w.add('m', cyl(8), 0x8b5a2b, x, 2.95, z, 0, 0, PI / 2, 0.1, 2.6, 0.1); w.add('m', cyl(4), 0x6b7280, x, 1.4, z, 0, 0, 0, 0.02, 1.55, 0.02); w.add('m', torus(0.4, 24), 0x111827, x, 1.2, z, 0, 0, 0, 0.42, 0.42, 0.5); w.solid(x - 1.4, 0, z - 0.15, x - 1.0, 3, z + 0.15, { cam: false }); w.solid(x + 1.0, 0, z - 0.15, x + 1.4, 3, z + 0.15, { cam: false }); }
    w.add('g', rbox(2.2, 0.5, 1.2, 0.2), 0xffd23f, 10, 0.2, 40, 0, 0, 0.2); w.solid(9, 0, 39.4, 11, 0.45, 40.6, { cam: false, ramp: ['x', 1] });
    { const x = 18.6, z = 31; w.add('x', rcyl(0.25, 1.0, 0.05, 16), 0x60a5fa, x, 0, z); w.add('g', rcyl(0.5, 0.2, 0.05, 24), 0x93c5fd, x, 0, z + 0.7); w.add('e', rcyl(0.42, 0.12, 0.03, 24), 0x7dd3fc, x, 0.08, z + 0.7); } }
  // ---- agility course (west): start/finish arch, hurdles, weave poles, giant tunnel, A-frame, tire jump
  { sign3d(w, 'AGILITY COURSE', -12, 2.9, 28.6, PI, 0.24, 0xffffff, 0xf97316); w.add('m', cyl(8), 0x8b5a2b, -14.2, 0, 28.6, 0, 0, 0, 0.06, 2.8, 0.06); w.add('m', cyl(8), 0x8b5a2b, -9.8, 0, 28.6, 0, 0, 0, 0.06, 2.8, 0.06);
    w.add('m', rbox(18, 0.04, 15.5, 0.02), 0x8bd96a, -12.5, -0.03, 36.8);
    const AG = w.spots.agility = { start: [-19, 0, 31], gates: [] }; const gate = (x, y, z, ry, kind) => AG.gates.push([x, y, z, ry, kind]);
    // start/finish arch
    { const x = -19, z = 30.5; [-1.6, 1.6].forEach((dx) => w.add('g', rcyl(0.15, 2.8, 0.05, 12), 0xf97316, x + dx, 0, z)); w.add('g', rbox(3.6, 0.4, 0.3, 0.1), 0xf97316, x, 2.9, z); sign3d(w, 'START', x, 2.84, z + 0.16, 0, 0.18, 0xffffff, null); sign3d(w, 'FINISH', x, 2.84, z - 0.16, PI, 0.18, 0xffffff, null); }
    // hurdles (jump them!)
    [33.5, 36.5, 39.5].forEach((z, i) => { const x = -19; [-1.3, 1.3].forEach((dx) => { w.add('g', rcyl(0.07, 1.1, 0.02, 10), 0xffffff, x + dx, 0, z); w.add('g', rcyl(0.18, 0.06, 0.02, 14), 0xffffff, x + dx, 0, z); });
      w.addFn('g', cyl(12), (c, px) => c.setHex(Math.sin(px * 9) > 0 ? 0xef4444 : 0xffffff), x, 0.55, z, 0, 0, PI / 2, 0.05, 2.6, 0.05); w.solid(x - 1.3, 0, z - 0.06, x + 1.3, 0.6, z + 0.06, { cam: false }); gate(x, 0.6, z, 0, 'hurdle'); });
    // weave poles (go round the corner then weave east)
    for (let i = 0; i < 6; i++) { const x = -16.5 + i * 1.3, z = 43; w.add('g', cyl(10), i % 2 ? 0xffd23f : 0x3b82f6, x, 0, z, 0, 0, 0, 0.05, 1.2, 0.05); w.add('g', sph(8), 0xffffff, x, 1.22, z, 0, 0, 0, 0.07); w.solid(x - 0.06, 0, z - 0.06, x + 0.06, 1.2, z + 0.06, { cam: false }); }
    gate(-16.5 - 0.65, 0.2, 43, PI / 2, 'weave'); gate(-16.5 + 2.6 - 0.65 + 1.3, 0.2, 43, PI / 2, 'weave'); gate(-16.5 + 5 * 1.3 + 0.8, 0.2, 43, PI / 2, 'weave');
    // giant tunnel (rainbow segments, walk through) heading south
    { const x = -6.5, z0 = 41.5, z1 = 34; const n = 8; for (let i = 0; i < n; i++) { const z = z0 + (z1 - z0) * (i + 0.5) / n; w.add('g', torus(0.12, 36, PI), [0xef4444, 0xf97316, 0xffd23f, 0x22c55e, 0x3b82f6, 0xa855f7][i % 6], x, 0, z, 0, 0, 0, 1.45, 1.45, 3.6); }
      [-1, 1].forEach((s) => w.solid(x + s * 1.55 - 0.15, 0, z1, x + s * 1.55 + 0.15, 1.6, z0, { cam: false, nocam: true })); w.solid(x - 1.6, 1.45, z1, x + 1.6, 1.75, z0, { cam: false, nocam: true }); gate(x, 0.2, (z0 + z1) / 2, 0, 'tunnel');
      w.secrets.push({ id: 'tunnel', x, y: 0, z: (z0 + z1) / 2, r: 1.0, msg: '🌈 Secret: inside the rainbow tunnel! Wheee!' }); }
    // A-frame ramp (walk up + over)
    { const x = -11, zc = 32.5, H = 1.6, L = 2.4; w.add('g', rbox(2.2, 0.15, Math.hypot(L, H) + 0.1, 0.05), 0xf97316, x, H / 2, zc + L / 2, Math.atan2(H, L), 0, 0); w.add('g', rbox(2.2, 0.15, Math.hypot(L, H) + 0.1, 0.05), 0x3b82f6, x, H / 2, zc - L / 2, -Math.atan2(H, L), 0, 0);
      w.solid(x - 1.1, 0, zc, x + 1.1, H, zc + L, { ramp: ['z', -1], cam: false }); w.solid(x - 1.1, 0, zc - L, x + 1.1, H, zc, { ramp: ['z', 1], cam: false }); gate(x, H + 0.2, zc, PI / 2, 'aframe'); }
    // tire jump (ring: jump through)
    { const x = -15.5, z = 34; [-1.2, 1.2].forEach((dx) => w.add('g', rcyl(0.08, 2.4, 0.02, 10), 0xffffff, x + dx, 0, z)); w.add('g', cyl(10), 0xffffff, x, 2.35, z, 0, 0, PI / 2, 0.06, 2.4, 0.06); w.add('m', torus(0.22, 32), 0x111827, x, 1.25, z, 0, 0, 0, 0.62, 0.62, 0.5);
      [-1, 1].forEach((s) => w.add('m', cyl(4), 0x6b7280, x + s * 0.4, 1.95, z, 0, 0, s * 0.5, 0.015, 0.45, 0.015)); w.solid(x - 1.25, 0, z - 0.1, x - 0.95, 2.4, z + 0.1, { cam: false }); w.solid(x + 0.95, 0, z - 0.1, x + 1.25, 2.4, z + 0.1, { cam: false }); gate(x, 1.25, z, PI / 2, 'tire'); }
    // the course order: start -> hurdles (south) -> weave (east) -> tunnel (north->south... ) -> A-frame -> tire -> finish
    AG.order = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; I({ kind: 'mg', id: 'agility', x: -17.3, y: 0, z: 30.0, r: 1.8, label: '🏁 Run the agility course' }); }
  // ---- fetch field (south-east) with distance rings
  { const cx = 12, z0 = 50; w.spots.fetch = { tee: [12, 0, 50.2], dir: 0 }; w.add('m', rbox(17, 0.04, 15, 0.02), 0x8bd96a, cx, -0.03, 57.5);
    w.add('g', rcyl(1.0, 0.1, 0.03, 32), 0xffffff, cx, 0, z0); sign3d(w, 'FETCH FIELD', cx, 2.3, 49, PI, 0.22, 0xffffff, 0x2563eb); w.add('m', cyl(8), 0x8b5a2b, cx - 1.6, 0, 49, 0, 0, 0, 0.06, 2.2, 0.06); w.add('m', cyl(8), 0x8b5a2b, cx + 1.6, 0, 49, 0, 0, 0, 0.06, 2.2, 0.06);
    [[5, 0xffd23f], [9, 0xff8a3d], [13, 0xff4fa0]].forEach(([d, c]) => { const pts = []; for (let i = 0; i <= 24; i++) { const a = -0.75 + i / 24 * 1.5; pts.push([cx + Math.sin(a) * d, 0.04, z0 + Math.cos(a) * d]); } w.add('g', tube(pts, 0.08, 40, 6), c, 0, 0, 0); });
    for (let i = 0; i < 5; i++) K.hhY('ball', w, cx - 2 + i * 0.3, 0.5, 49.6, 0.08, 1.5, 0xc6f432, 0xffffff); w.add('m', rbox(1.0, 0.5, 0.6, 0.1), 0x2563eb, cx - 2.6, 0.25, 49.6);
    I({ kind: 'mg', id: 'fetch', x: cx, y: 0, z: 50.6, r: 1.6, label: '🎾 Play fetch with Rex' }); }
  // ---- duck pond (south-west) with lily pads, stepping stones, a little island
  { const cx = -13, cz = 58; w.add('m', blobGeo(11, 0.08, 2), 0x8b6b4a, cx, -0.55, cz, 0, 0, 0, 7.2, 0.6, 5.0); w.add('e', rcyl(1, 0.05, 0.01, 48), 0x38bdf8, cx, -0.06, cz, 0, 0, 0, 6.6, 1, 4.4); w.add('g', rcyl(1, 0.02, 0.005, 48), 0x1e88c8, cx, -0.3, cz, 0, 0, 0, 6.6, 1, 4.4);
    w.zone('water', cx - 6.4, -2, cz - 4.2, cx + 6.4, 0.2, cz + 4.2); w.spots.pond = [cx, cz];
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; w.add("g", blobGeo(i, 0.2, 1), 0xb8b2a6, cx + Math.cos(a) * 6.8, 0.0, cz + Math.sin(a) * 4.6, 0, i, 0, 0.6, 0.35, 0.5); }
    for (let i = 0; i < 9; i++) { const x = cx + (R() - 0.5) * 9, z = cz + (R() - 0.5) * 6; w.add('g', rcyl(0.5, 0.03, 0.01, 20), 0x22c55e, x, -0.02, z); if (i % 3 === 0) w.add('g', sph(8), 0xff8fc8, x + 0.15, 0.08, z, 0, 0, 0, 0.12, 0.1, 0.12); }
    const stones = [[cx + 6.8, cz - 1], [cx + 5.4, cz - 0.4], [cx + 4.0, cz + 0.2], [cx + 2.7, cz + 0.4]]; stones.forEach(([x, z]) => { w.add('g', rcyl(0.55, 0.3, 0.1, 20), 0xd6d3d1, x, -0.15, z); w.solid(x - 0.5, -1, z - 0.5, x + 0.5, 0.15, z + 0.5); });
    { const x = cx + 0.4, z = cz + 0.6; w.add('m', blobGeo(4, 0.1, 2), 0x63c44e, x, -0.3, z, 0, 0, 0, 2.0, 0.6, 1.6); w.solid(x - 1.6, -1, z - 1.2, x + 1.6, 0.25, z + 1.2); K.tree(w, x - 0.4, z + 0.2, 0.7, 1); w.add('g', star(), 0xffd23f, x + 0.8, 0.6, z - 0.3, 0, 0, 0, 0.18, 0.18, 0.18);
      w.secrets.push({ id: 'island', x, y: 0.25, z, r: 1.6, msg: '🦆 Secret: Duck Island! The ducks salute you.' }); bisc(w, x + 0.8, 1.2, z - 0.3); }
    w.add('m', rbox(3.0, 0.15, 1.6, 0.05), 0x9a6a42, cx + 6.2, 0.1, cz + 4.6); sign3d(w, 'DUCK POND', cx + 6.2, 1.2, cz + 4.0, PI, 0.18, 0xffffff, 0x0891b2); w.add('m', cyl(8), 0x8b5a2b, cx + 6.2, 0, cz + 4.05, 0, 0, 0, 0.05, 1.2, 0.05); }
  // ---- the big oak (clue: the dug-up hole with a ribbon)
  { const x = -6, z = 50.5; w.add('m', capsule(14), 0x7c4a1e, x, 2.2, z, 0, 0, 0, 1.1, 2.6, 1.1); for (let i = 0; i < 4; i++) { const a = i * PI / 2 + 0.4; w.add('m', capsule(10), 0x7c4a1e, x + Math.cos(a) * 0.9, 0.3, z + Math.sin(a) * 0.9, Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8, 0.35, 0.8, 0.35); }
    for (let i = 0; i < 8; i++) { const a = i * 0.8; w.add('g', blobGeo(i + 20, 0.2, 2), [0x2f9e4a, 0x3fae5a, 0x4cc36b][i % 3], x + Math.cos(a) * 2.4 * (i ? 1 : 0), 5.4 + (i % 3) * 0.6, z + Math.sin(a) * 2.4 * (i ? 1 : 0), 0, a, 0, 2.4, 1.8, 2.4); }
    w.solid(x - 0.6, 0, z - 0.6, x + 0.6, 5, z + 0.6); const hx = x + 1.6, hz = z + 1.4; w.add('m', torus(0.5, 24), 0x7a4a24, hx, 0.02, hz, PI / 2, 0, 0, 0.45, 0.45, 0.3); w.add('m', rcyl(0.4, 0.04, 0.02, 20), 0x3b2412, hx, -0.02, hz);
    w.add('m', blobGeo(9, 0.2, 1), 0x7a4a24, hx + 0.7, 0.05, hz + 0.2, 0, 0, 0, 0.4, 0.15, 0.35); w.add('g', tube([[hx - 0.2, 0.06, hz], [hx + 0.1, 0.12, hz + 0.2], [hx + 0.4, 0.06, hz - 0.1]], 0.03, 10, 6), 0xff4fa0, 0, 0, 0);
    I({ kind: 'clue', id: 'clue_hole', x: hx, y: 0, z: hz, r: 1.8, label: '🔍 Look at the dug-up hole' }); }
  // ---- Mittens' climbing tree (north-east of the fetch field): branch platforms spiral up
  { const x = 19, z = 62; w.add('m', capsule(14), 0x8b5a2b, x, 3.4, z, 0, 0, 0, 0.9, 4.0, 0.9); w.solid(x - 0.5, 0, z - 0.5, x + 0.5, 7.5, z + 0.5);
    const br = [[1.5, 1.0, 0], [2.6, 0.0, 1.2], [4.0, -1.2, 0.2], [5.3, 0.2, -1.1], [6.6, 1.2, 0.0], [7.8, -0.2, 0.6]]; br.forEach(([y, dx, dz], i) => { const bx = x + dx * 1.2, bz = z + dz * 1.4 - (i === 0 ? 1.4 : 0); w.add('m', capsule(10), 0x8b5a2b, (x + bx) / 2, y - 0.15, (z + bz) / 2, 0, Math.atan2(bx - x, bz - z), PI / 2, 0.22, Math.hypot(bx - x, bz - z) + 0.2, 0.22);
      w.add('m', rcyl(0.75, 0.22, 0.08, 20), 0x9a6a42, bx, y - 0.22, bz); w.add('g', blobGeo(i + 40, 0.2, 1), 0x3fae5a, bx, y + 0.9, bz, 0, i, 0, 0.9, 0.5, 0.9); w.solid(bx - 0.7, y - 0.22, bz - 0.7, bx + 0.7, y, bz + 0.7, { cam: false }); });
    for (let i = 0; i < 6; i++) w.add('g', blobGeo(i + 60, 0.2, 2), [0x2f9e4a, 0x3fae5a][i % 2], x + Math.cos(i) * 1.8, 9.6 + (i % 2) * 0.8, z + Math.sin(i) * 1.8, 0, i, 0, 2.0, 1.4, 2.0);
    w.spots.kitten = [x - 0.24, 7.8, z + 0.84]; w.spots.kittenDown = [x - 1.5, 0, z - 2.4]; w.add('g', rbox(0.9, 0.6, 0.1, 0.05), 0xffffff, x, 1.2, z - 0.9); sign3d(w, 'NO CLIMBING?', x, 1.3, z - 0.97, PI, 0.08, 0xdc2626, null); bisc(w, x + 4.0 * 1.2 - 4.8, 4.6, z + 0.2 * 1.4 + 0.0); }
  // ---- gazebo bandstand (centre)
  { const x = 0, z = 56; w.add('m', rcyl(3.4, 0.4, 0.08, 8), 0xffffff, x, 0, z, 0, PI / 8, 0); w.solid(x - 3, 0, z - 3, x + 3, 0.4, z + 3); for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + PI / 8; if (i === 6) continue; w.add('g', cyl(10), 0xffffff, x + Math.cos(a) * 3.0, 0.4, z + Math.sin(a) * 3.0, 0, 0, 0, 0.12, 2.8, 0.12); w.solid(x + Math.cos(a) * 3 - 0.15, 0.4, z + Math.sin(a) * 3 - 0.15, x + Math.cos(a) * 3 + 0.15, 3.2, z + Math.sin(a) * 3 + 0.15); }
    w.add('g', cone(8), 0xff4fa0, x, 3.2, z, 0, PI / 8, 0, 3.9, 1.8, 3.9); w.add('x', sph(10), 0xffd23f, x, 5.1, z, 0, 0, 0, 0.25); for (let i = 0; i < 3; i++) w.add('m', rbox(0.6, 0.6, 0.05, 0.02), 0x111827, x - 1 + i, 1.0, z + 1.2 - i * 0.1, -0.2, 0, 0);
    [-1, 1].forEach((s) => { w.add('x', cyl(8), 0x111827, x + s * 1.4, 0.4, z - 1, 0, 0, 0, 0.02, 1.1, 0.02); w.add('x', rbox(0.5, 0.35, 0.02, 0.01), 0x111827, x + s * 1.4, 1.55, z - 1, -0.5, 0, 0); });
    I({ kind: 'fun', id: 'band', x, y: 0.4, z, r: 2.2, label: '🎺 Play a tune', sfx: 'tune', msgs: ['🎺 *toot toot* Every dog nearby starts howling along!', '🎺 You played "Who Let The Dogs Out". Obviously.', '🎺 A duck applauded. With its wings. Very professional.'] }); }
  // ---- picnic spots, benches, lamps, flowers, trees
  [[-18, 63], [7, 64.5], [-3.5, 61]].forEach(([x, z], i) => { K.rug(w, x, z, i * 0.5, 2.2, 1.8, 0xef4444, 0xffffff); w.add('m', rbox(0.7, 0.4, 0.45, 0.08), 0xb45309, x + 0.5, 0.2, z - 0.2); for (let k = 0; k < 3; k++) w.add('g', [sph(8), capsule(8)][k % 2], pick([0xef4444, 0xffd23f, 0x22c55e]), x - 0.3 + k * 0.25, 0.08, z + 0.3, 0, k, PI / 2, 0.08, 0.1, 0.08); });
  [[-2.8, 34], [2.8, 38], [-2.8, 52], [2.8, 44], [14, 47.5], [-10, 47.5]].forEach(([x, z], i) => bench(w, x, z, x < 0 ? PI / 2 : -PI / 2, [0xff8a3d, 0x4f9dff, 0xff5d8f][i % 3]));
  [[-2.6, 30], [2.6, 30], [-2.6, 40], [2.6, 50], [-2.6, 62], [8, 46], [-16, 46]].forEach(([x, z]) => { lampPost(w, x, z); w.lights.push({ x: x + 0.5, y: 3.6, z, c: 0xffd9a0, i: 8, d: 12, out: true }); });
  flowerBed(w, -21.5, 44.5, -18, 48.5); flowerBed(w, 18, 44.5, 21.5, 48.5); flowerBed(w, 3, 28, 5.5, 31); flowerBed(w, -5.5, 28, -3, 31);
  [[-21, 64], [21, 52], [21, 66], [8, 66.5], [-8, 66.5], [-21, 52], [5, 52]].forEach(([x, z], i) => tree(w, x, z, 1.1 + (i % 3) * 0.15, i % 3 === 0 ? 1 : 0)); [[-22, 36], [22, 33], [-4, 36], [4, 33]].forEach(([x, z]) => bush(w, x, z, 0.9));
  bisc(w, -11, 2.4, 32.5); bisc(w, -6.5, 0.8, 37.75); bisc(w, 16.5, 1.6, 39.5); bisc(w, 0, 3.0, 56); bisc(w, -19, 0.9, 36.5);
}
