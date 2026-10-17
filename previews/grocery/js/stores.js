// Grok Grocery Tycoon - the walk-in supermarket buildings (your stores + Bargain Bonanza). The sales floor fixtures are
// instanced separately (fixtures.js); this builds the shell, back rooms, checkout front, walls, facade, parking and truck dock.
import * as K from './kit.js?v=ggt17';
import { rbox } from './world.js?v=ggt17';
import { shell, part, onSide } from './bld.js?v=ggt17';
import { storeGeom } from './data.js?v=ggt17';
import { PI, R, pick, BRIGHT, rcyl, lathe, sph, cyl, cone, torus, capsule, star, blobGeo, txt, poster, wallWord, clockW, pendant, rack, pallet, cartStatic, planter, awning, trash, bags, produceCrate, grokLogo } from './art.js?v=ggt17';
export const BOT = lathe([[0, 0], [0.5, 0], [0.5, 0.55], [0.2, 0.75], [0.18, 1], [0, 1]], 9, 'sbot');
export function wallShelf(w, axis, at, from, to, side, cols) { const L = to - from, c = (from + to) / 2; // shelving run against a wall (x-axis = along x at z=at)
  const T = axis === 'x' ? w.tf(c, 0, at, side > 0 ? 0 : PI) : w.tf(at, 0, c, side > 0 ? PI / 2 : -PI / 2);
  T.box('m', 0x475569, 0, 0, 0.35, L, 0.15, 0.7, 0.03); T.box('m', 0xe2e8f0, 0, 0, 0.04, L, 2.1, 0.08, 0.02);
  for (let i = 0; i < 4; i++) { const y = 0.2 + i * 0.48; T.box('x', 0xcbd5e1, 0, y, 0.38, L, 0.04, 0.62, 0.01); for (let k = 0; k < L / 0.42; k++) { if (R() < 0.12) continue; const lx = -L / 2 + 0.25 + k * 0.42, cc = pick(cols); if ((k + i) % 3) T.box('g', cc, lx, y + 0.02, 0.4, 0.3, 0.3 + R() * 0.08, 0.36, 0.02); else T.add('g', BOT, cc, lx, y + 0.02, 0.4, 0, 0, 0, 0.13, 0.34, 0.13); } }
  T.solid(-L / 2, 0, 0, L / 2, 2.2, 0.75); }
export function bevWall(w, x0, x1, z) { // glowing drink coolers on the back wall of the sales floor
  const n = Math.floor((x1 - x0) / 1.25); for (let i = 0; i < n; i++) { const x = x0 + (i + 0.5) * (x1 - x0) / n; w.add('m', rbox(1.22, 2.4, 0.85, 0.04, 1), 0x334155, x, 1.2, z + 0.42); w.add('l', rbox(1.05, 2.0, 0.05, 0.02, 1), 0xe0f2fe, x, 1.2, z + 0.12, 0, 0, 0, 1, 1, 1, 0.05);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) w.add('g', BOT, pick([0xef4444, 0x22c55e, 0xf97316, 0x3b82f6, 0xfacc15, 0xa855f7]), x - 0.36 + k * 0.24, 0.3 + r * 0.48, z + 0.45, 0, 0, 0, 0.09, 0.36, 0.09);
    w.add('e', rbox(1.1, 2.1, 0.04, 0.02, 1), 0xcfefff, x, 1.2, z + 0.84); w.add('x', rbox(0.04, 0.7, 0.05, 0.02, 1), 0xe5e7eb, x + 0.45, 1.2, z + 0.88); w.add('l', rbox(1.1, 0.12, 0.05, 0.02, 1), 0xbfe9ff, x, 2.3, z + 0.86, 0, 0, 0, 1, 1, 1, 0.3); }
  w.solid(x0, 0, z, x1, 2.4, z + 0.9); }
export function storeBuilding(w, d, own) {
  const G = storeGeom(d), { x0, z0, x1, z1 } = d, W = x1 - x0, cx = G.cx, rv = !!d.rival, L = w.lights, accent = d.trim, q2 = d.id === 'rival2';
  const b = shell(w, { id: d.id, name: d.name, x0, z0, x1, z1, h: 6.2, wall: d.wall, trim: d.trim, roof: d.roof, floor: 'tile', fc1: d.floorC[0], fc2: d.floorC[1], doors: [{ side: 's', at: cx, w: 4.6, top: 3.6 }, { side: 'n', at: x0 + 10, w: 4, top: 3.8 }], win: { s: 4, n: 0, e: 2, w: 2 } });
  { const R0 = w.region; w.region = 'roof_' + d.id; const h = 6.2, cx0 = (x0 + x1) / 2, cz0 = (z0 + z1) / 2; w.add('m', rbox(x1 - x0 - 0.3, 0.1, z1 - z0 - 0.3, 0.02), 0xf1f5f9, cx0, h - 0.02, cz0); const nx = Math.max(2, Math.round((x1 - x0) / 5)), nz = Math.max(2, Math.round((z1 - z0) / 5)); for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) w.add('l', rbox(1.6, 0.05, 0.5, 0.02), 0xfffbeb, x0 + (i + 0.5) * (x1 - x0) / nx, h - 0.09, z0 + (j + 0.5) * (z1 - z0) / nz, 0, 0, 0, 1, 1, 1, 0.9); w.region = R0; }
  b.itrim = accent; b.store = d.id; const sx1 = G.sx1, sx2 = G.sx2, dStock = x0 + (sx1 - x0) * 0.6, dBreak = (sx1 + sx2) / 2, dOff = (sx2 + x1) / 2, big = W >= 34, strip = !!d.strip; Object.assign(G, { dStock, dBreak, dOff });
  part(w, b, 'x', G.back, x0, x1, [dStock, dBreak, dOff], 0xf8fafc, 4.4); part(w, b, 'z', sx1, z0, G.back, [], 0xf1f5f9, 4.4); part(w, b, 'z', sx2, z0, G.back, [], 0xf1f5f9, 4.4);
  // ---------- facade ----------
  w.region = 'out';
  onSide(w, b, 's', () => {
    if (!strip) { w.add('g', rbox(9, 0.35, 3.2, 0.12), accent, cx, 3.85, z1 + 1.5); [-4.2, 4.2].forEach((o) => { w.add('x', cyl(14), 0xe5e7eb, cx + o, 0, z1 + 2.9, 0, 0, 0, 0.12, 3.85, 0.12); w.solid(cx + o - 0.15, 0, z1 + 2.75, cx + o + 0.15, 3.8, z1 + 3.05); }); txt(w, 'OPEN 7AM - 10PM', cx, 3.6, z1 + 3.15, 0, 0.18, 0xffffff); }
    else { w.add('g', rbox(6.4, 0.25, 1.4, 0.1), accent, cx, 3.9, z1 + 0.7); txt(w, 'OPEN 9AM - 9PM', cx, 3.66, z1 + 1.42, 0, 0.15, 0xffffff); }
    const aw = d.id === 'rival' ? [0xdc2626, 0xfde047] : [accent, rv ? d.wall : 0xffffff]; awning(w, x0 + 1, cx - (strip ? 3.4 : 5), z1, strip ? 1.8 : 3.2, aw); awning(w, cx + (strip ? 3.4 : 5), x1 - 1, z1, strip ? 1.8 : 3.2, aw);
    for (let i = 0; i < 4; i++) { const x = x0 + (i + 0.5) * W / 4; if (Math.abs(x - cx) < (strip ? 3.2 : 4)) continue; poster(w, 'x', z1, x, 1.5, strip ? 1.2 : 1.6, 0.9, rv ? 0xfde047 : 0xffffff, 1, rv ? 'SALE!' : ['OPEN', 'WELCOME', 'NEW!', 'DEALS'][i], rv ? 0xdc2626 : accent); } });
  // the store-brand sign (conditional for lots you can buy)
  if (!rv) { if (!own) { w.region = 'sale_' + d.id; w.add('g', rbox(7.5, 1.6, 0.2, 0.1), 0xffffff, cx, 5.0, z1 + 0.3); txt(w, 'FOR SALE', cx, 4.75, z1 + 0.45, 0, 0.6, 0xdc2626); w.add('x', cyl(10), 0x64748b, cx + 7, 0, z1 + 9, 0, 0, 0, 0.06, 2.2, 0.06); w.add('g', rbox(1.8, 1.1, 0.1, 0.06), 0xffffff, cx + 7, 2.4, z1 + 9); txt(w, '$' + d.price.toLocaleString('en-US'), cx + 7, 2.25, z1 + 9.08, 0, 0.26, 0x16a34a); } }
  w.region = 'out';
  if (!strip) {
  // parking lot + outdoor cart corral + loading dock
  K.floor(w, x0 - 2, z1 + 3.4, x1 + 2, z1 + 14, 'tile', 0.015, 0x5b6474, 0x525a68, 3);
  for (let x = x0 + 1; x < x1 - 1; x += 3) { if (Math.abs(x - cx) < 4) continue; w.add('l', rbox(0.12, 0.02, 4.2, 0.01), 0xffffff, x, 0.04, z1 + 8.5, 0, 0, 0, 1, 1, 1, 0); }
  { const X = x0 + 7, Z = z1 + 7.5; G.corral = [X, Z]; [-1, 1].forEach((s) => w.add('x', cyl(10), 0xdc2626, X + s * 0.8, 0.5, Z, PI / 2, 0, 0, 0.05, 4.2, 0.05)); w.add('x', cyl(10), 0xdc2626, X, 0.5, Z - 2.1, 0, 0, PI / 2, 0.05, 1.6, 0.05); w.add('g', rbox(1.8, 0.7, 0.1, 0.05), accent, X, 1.4, Z - 2.2); txt(w, 'CARTS', X, 1.32, Z - 2.12, 0, 0.2, 0xffffff); for (let i = 0; i < 3; i++) cartStatic(w, X, Z - 1.2 + i * 0.5, PI); }
  [[x0 + 2, z1 + 13.6], [x1 - 2, z1 + 13.6], [cx - 12, z1 + 13.6], [cx + 12, z1 + 13.6]].forEach(([x, z]) => K.lampPost(w, x, z));
  [[x0 + 14, z1 + 10.5, 0, 0xef4444], [x1 - 6, z1 + 10.5, PI, 0x3b82f6], [cx + 9, z1 + 7, 0.02, 0xfacc15], [x1 - 12, z1 + 7, PI, 0x22c55e]].forEach(([x, z, r, c], i) => { if (i < 2 || W > 38) K.toyCar(w, x, z, r, c); });
  planter(w, cx - 7.5, z1 + 3.9, 3.5, 0, rv ? 0xfde047 : 0xff6fb5); planter(w, cx + 7.5, z1 + 3.9, 3.5, 0, rv ? 0xfde047 : 0xff6fb5);
  { const X = x0 + 10, Z = z0; w.slab('g', 0xa8a29e, X, 0, Z - 3, 7, 0.12, 5.6, 0.04, { floor: true }); K.hazard(w, X, Z - 3, 4.4, 5.0);
    [-1, 1].forEach((s) => { w.add('m', rbox(0.3, 0.6, 0.3, 0.05), 0x111827, X + s * 2.4, 1.0, Z - 0.45); w.slab('g', 0xfacc15, X + s * 3.0, 0, Z - 5.5, 0.24, 1.0, 0.24, 0.1); });
    w.slab('g', 0x15803d, X - 7, 0, Z - 2.5, 3.2, 1.6, 1.8, 0.08); w.add('g', rbox(3.3, 0.1, 1.9, 0.04), 0x166534, X - 7, 1.62, Z - 2.5); pallet(w, X + 7.5, Z - 2, 0.2, 6); pallet(w, X + 9, Z - 3.8, -0.1, 4);
    txt(w, 'DOCK', X, 4.3, Z - 0.3, PI, 0.4, 0xffffff); w.add('x', rbox(4.2, 0.25, 0.3, 0.05), 0x64748b, X, 3.95, Z - 0.3); } }
  else { // shopping-row frontage: bike rack, bench, trash can, sidewalk planters
    K.bench(w, x0 + 3.2, z1 + 1.6, PI, accent); trash(w, x1 - 2.2, z1 + 1.5); for (let i = 0; i < 3; i++) w.add('x', torus(0.06, 16, PI), 0x94a3b8, x1 - 5 + i * 0.7, 0, z1 + 1.6, 0, 0, 0, 0.35, 0.5, 0.35); }
  // ---------- interior ----------
  w.region = 'in_' + d.id;
  // sales floor walls, signage and the front display depend on the store TYPE: see decor.js (rebuilt when you remodel)
  // front of store: community board, welcome sign, entry mat
  { const F = z1 - 0.9;
    if (big) poster(w, 'x', z1, cx + 11.5, 1.8, 2.2, 1.3, 0xfef3c7, -1, rv ? 'BONANZA DEALS' : 'COMMUNITY BOARD', 0x7c4a1e); if (big) for (let i = 0; i < 6; i++) w.add('m', rbox(0.35, 0.3, 0.02, 0.01), pick([0xffffff, 0xfde68a, 0xbfdbfe, 0xfbcfe8]), cx + 10.8 + (i % 3) * 0.6, 1.95 - Math.floor(i / 3) * 0.45, z1 - 0.38);
    w.add('g', rbox(strip ? 4.4 : 6, 0.8, 0.12, 0.08), accent, cx, 3.6, z1 - 0.7); txt(w, d.id === 'rival' ? 'WELCOME BARGAIN HUNTERS' : rv ? 'WELCOME IN!' : 'WELCOME, NEIGHBOR!', cx, 3.45, z1 - 0.78, PI, strip ? 0.2 : 0.24, 0xffffff);
    K.rug(w, cx, z1 - 1.6, 0, strip ? 3.4 : 4.4, 2.2, d.id === 'rival' ? 0xdc2626 : accent, 0xffffff); }
  // ---------- back rooms ----------
  const B = G.back, mz = (z0 + B) / 2;
  // stockroom: racks, pallets, case cart, baler, pallet jack
  { rack(w, x0 + 4.5, z0 + 1.3, 0, 5); if (big) rack(w, sx1 - 5, z0 + 1.3, 0, 5); rack(w, x0 + 1.3, mz + (big ? 1.2 : 1.4), PI / 2, big ? 4 : 3);
    if (big) { pallet(w, x0 + 10, mz + 1.5, 0.1, 6); pallet(w, x0 + 12.4, mz + 2.2, -0.2, 4); } if (W > 40) pallet(w, sx1 - 4, mz + 2, 0.3, 5); pallet(w, sx1 - 1.4, z0 + 3.4, 0, 6); for (let i = 0; i < 3; i++) K.parcel(w, x0 + 1.1, i * 0.5, B - 1.0, 0.8); txt(w, 'RECEIVING', x0 + W * 0.18, 3.2, z0 + 0.32, 0, 0.26, 0x111827);
    { const X = G.stock[0], Z = G.stock[1]; const T = w.tf(X, 0, Z, 0); T.box('x', 0x94a3b8, 0, 0, 0, 1.6, 0.12, 1.0, 0.02); [-0.75, 0.75].forEach((a) => T.box('x', 0x94a3b8, a, 0, 0, 0.05, 1.6, 0.95, 0.01)); for (let i = 0; i < 6; i++) T.box('m', pick([0xc9a06a, 0xd8b98b]), -0.4 + (i % 2) * 0.8, 0.14 + Math.floor(i / 2) * 0.45, 0, 0.7, 0.42, 0.8, 0.03); T.solid(-0.8, 0, -0.5, 0.8, 1.6, 0.5, { cam: false });
      txt(w, 'GRAB A CASE', X, 1.95, Z + 0.4, 0, 0.16, 0x16a34a); }
    { const X = sx1 - 2.2, Z = B - 2; w.slab('x', 0x64748b, X, 0, Z, 1.4, 2.2, 1.2, 0.08); w.add('g', rbox(1.2, 0.5, 0.05, 0.03), 0xfacc15, X, 1.6, Z + 0.62); txt(w, 'BALER', X, 1.55, Z + 0.66, 0, 0.14, 0x111827); }
    if (big) { const T = w.tf(x0 + 7, 0, B - 1.6, 0.4); T.box('x', 0xdc2626, 0, 0.1, 0, 0.6, 0.1, 1.4, 0.03); T.add('x', cyl(8), 0x111827, 0, 0.6, -0.8, 0.4, 0, 0, 0.03, 1.0, 0.03); T.add('x', torus(0.2, 12), 0x111827, 0, 1.08, -1.0, 0, 0, 0, 0.12); }
    poster(w, 'x', B, dStock + 2.2, 2.0, 1.8, 1.1, 0xfacc15, -1, 'EMPLOYEES ONLY', 0x111827); if (big) K.hazard(w, x0 + 10, z0 + 3.2, 4.2, 1.6); L.push({ x: x0 + W * 0.25, y: 3.6, z: mz, c: 0xfff1d6, i: 6, d: 12 }); }
  // break room: table, chairs, vending, lockers, microwave, time clock
  { const bx = (sx1 + sx2) / 2; K.tableR(w, bx, mz + 0.5, 0.9, 0.78, 0xffffff); [0, 1, 2, 3].forEach((i) => { const a = i * PI / 2 + 0.4; K.chair(w, bx + Math.cos(a) * 1.3, 0, mz + 0.5 + Math.sin(a) * 1.3, -a - PI / 2, accent); });
    K.vending(w, sx1 + 1.0, z0 + 1.0, 0, 0xef4444); if (sx2 - sx1 > 9) K.vending(w, sx1 + 2.5, z0 + 1.0, 0, 0x2563eb);
    for (let i = 0; i < 4; i++) { const x = sx2 - 0.6 - i * 0.62; if (x < sx1 + 3.5) break; if (Math.abs(x - G.clock[0]) < 0.6) continue; w.slab('x', [0x60a5fa, 0x34d399, 0xfbbf24, 0xf472b6][i], x, 0, z0 + 0.6, 0.58, 2.0, 0.6, 0.04); w.add('x', rbox(0.04, 0.2, 0.02, 0.01), 0x111827, x + 0.18, 1.2, z0 + 0.92); }
    w.add('g', rbox(0.6, 0.38, 0.4, 0.05), 0xe5e7eb, sx1 + 0.6, 1.12, B - 1.2); w.slab('m', 0xd6d3d1, sx1 + 0.6, 0, B - 1.2, 0.9, 0.92, 1.6, 0.04);
    { const [cx2, cz] = G.clock; w.add('g', rbox(0.5, 0.7, 0.2, 0.06), 0x334155, cx2, 1.5, z0 + 0.35); w.add('l', rbox(0.36, 0.14, 0.02, 0.01), 0x22c55e, cx2, 1.65, z0 + 0.46, 0, 0, 0, 1, 1, 1, 0.5); txt(w, 'TIME CLOCK', cx2, 2.0, z0 + 0.4, 0, 0.12, 0x334155); }
    poster(w, 'x', z0, bx, 2.6, 1.6, 1.0, 0xfde68a, 1, 'STAFF OF THE MONTH', 0x7c4a1e); K.potPlant(w, sx2 - 0.8, 0, B - 0.9, 0.9, accent); pendant(w, bx, mz + 0.5, accent, 4.2); L.push({ x: bx, y: 3.4, z: mz, c: 0xffe4c4, i: 6, d: 10 }); }
  // office: desk, monitors, safe, filing, whiteboard, plant
  { const [ox, oz] = G.office; K.desk(w, ox, oz, PI, { top: 0x7c4a1e, L: 2.6 }); { const T = w.tf(ox, 0.85, oz, PI); K.monitor(w, T, -0.5, 0, 0.2, 0, 0x22c55e); K.monitor(w, T, 0.5, 0, 0.2, 0, 0x38bdf8); } K.chair(w, ox, 0, oz - 1.1, 0, 0x111827);
    w.slab('x', 0x334155, x1 - 1.0, 0, z0 + 1.0, 1.0, 1.1, 0.9, 0.06); w.add('x', torus(0.25, 16), 0xfacc15, x1 - 1.0, 0.6, z0 + 1.47, 0, 0, 0, 0.18); K.filing(w, sx2 + 1.0, z0 + 0.8, 0, 0x94a3b8, 3);
    K.whiteboard(w, 'x', z0, (sx2 + x1) / 2 - 1, 2.0, 2.6, 1); for (let i = 0; i < 5; i++) w.add('l', rbox(0.25, 0.2 + i * 0.18, 0.02, 0.01), 0x22c55e, (sx2 + x1) / 2 - 2 + i * 0.4, 1.6 + i * 0.09, z0 + 0.66, 0, 0, 0, 1, 1, 1, 0.2);
    K.potPlant(w, x1 - 0.9, 0, B - 0.9, 1.0, accent); poster(w, 'z', x1, mz, 2.2, 1.6, 1.0, rv ? accent : 0x166534, -1, rv ? (q2 ? 'MS. QUINN' : d.boss ? d.boss.toUpperCase() : 'MAX MARKDOWN') : 'MANAGER', 0xffffff); pendant(w, ox, oz, 0xfde68a, 4.2); L.push({ x: ox, y: 3.4, z: oz, c: 0xfff1d6, i: 12, d: 12 }); }
  clockW(w, 'x', B, cx, 3.9, 1);
  // sales-floor lights (pooled)
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) L.push({ x: x0 + W * (0.2 + i * 0.3), y: 4.6, z: B + (z1 - B) * (0.3 + j * 0.4), c: 0xfff7e6, i: 5, d: 15 });
  return { b, G };
}
