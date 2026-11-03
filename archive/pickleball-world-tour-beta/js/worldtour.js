// Grok Pickleball Park - DLC: WORLD TOUR EXPANSION (grokDLC.pickleballpark.world_tour_expansion)
// North Lawn "World Tour Boulevard": Tortuga Air Tour Gate + Tortuga TV Network (TTN) broadcast booth at (0, -66),
// and 4 city courts in a row at z = -86: Paris (-72), Tokyo (-24), New York (24), Rio (72).
import * as K from './kit.js?v=ppk2';
import { rbox } from './world.js?v=ppk2';
import { txt } from './art.js?v=ppk2';
import { court, paddleProp, ballBucket, bleachers, fence } from './court.js?v=ppk2';
import { vending } from './kit.js?v=ppk2';
import { tourOwned } from './dlc.js?v=ppk2';
const { rcyl, sph, cyl, cone, torus } = K;
const PI = Math.PI;
export const WT_PAL = {
  paris: { court: 0x1d4ed8, kit: 0xdc2626, out: 0xd6c7a1 },
  tokyo: { court: 0xbe185d, kit: 0xf9a8d4, out: 0x374151 },
  nyc: { court: 0x166534, kit: 0x15803d, out: 0x52525b },
  rio: { court: 0x0e7490, kit: 0xfacc15, out: 0xf5deb3 },
};
// TTN camera crane next to a court (the matches "air" on Tortuga TV Network)
function ttnCam(w, x, z, ry) {
  const T = w.tf(x, 0, z, ry);
  T.add('x', cyl(8), 0x334155, 0, 0, 0, 0, 0, 0, 0.08, 2.6, 0.08);
  T.box('x', 0x111827, 0, 2.7, 0.15, 0.45, 0.35, 0.7, 0.05);
  T.add('l', sph(8), 0xef4444, 0.18, 2.95, 0.4, 0, 0, 0, 0.05, 0.05, 0.05, 1.5);
  T.box('g', 0x0f766e, 0, 2.3, 0, 0.6, 0.18, 0.12, 0.03);
  w.solid(x - 0.3, 0, z - 0.3, x + 0.3, 2.9, z + 0.3);
}
function cityBanner(w, x, z, title, sub, col) {
  w.add('x', rcyl(0.16, 3.6, 0.03, 10), 0x1e293b, x - 3.2, 0, z); w.add('x', rcyl(0.16, 3.6, 0.03, 10), 0x1e293b, x + 3.2, 0, z);
  w.solid(x - 3.4, 0, z - 0.2, x - 3.0, 3.6, z + 0.2); w.solid(x + 3.0, 0, z - 0.2, x + 3.4, 3.6, z + 0.2);
  w.slab('g', col, x, 3.0, z, 6.8, 0.9, 0.2, 0.05);
  txt(w, title, x, 3.5, z + 0.12, 0, 0.3, 0xffffff, 'l', 0.4); txt(w, title, x, 3.5, z - 0.12, PI, 0.3, 0xffffff, 'l', 0.4);
  txt(w, sub, x, 3.12, z + 0.12, 0, 0.15, 0xfde047, 'l', 0.3);
}
function bench(w, x, z, ry, col) { const T = w.tf(x, 0, z, ry); T.box('w', col, 0, 0.45, 0, 1.6, 0.08, 0.45, 0.02); T.box('x', 0x374151, -0.65, 0.22, 0, 0.08, 0.44, 0.4, 0.01); T.box('x', 0x374151, 0.65, 0.22, 0, 0.08, 0.44, 0.4, 0.01); }
function tree(w, x, z, col, s = 1) { w.add('w', cyl(8), 0x6b4423, x, 0, z, 0, 0, 0, 0.12 * s, 1.8 * s, 0.12 * s); w.add('g', sph(10), col, x, 1.9 * s, z, 0, 0, 0, 0.95 * s, 0.75 * s, 0.95 * s); w.solid(x - 0.25, 0, z - 0.25, x + 0.25, 2.5 * s, z + 0.25); }
function palm(w, x, z) { for (let i = 0; i < 5; i++) w.add('w', cyl(7), 0x8b5a2b, x + i * 0.06, i * 0.75, z, 0, 0, -0.06, 0.13, 0.78, 0.13);
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; w.add('g', rbox(1.7, 0.05, 0.42, 0.02, 1), 0x15803d, x + 0.3 + Math.cos(a) * 0.8, 3.75, z + Math.sin(a) * 0.8, 0, -a, 0.35); }
  w.solid(x - 0.25, 0, z - 0.25, x + 0.25, 3.8, z + 0.25); }

// ---------------- shared tidy city kit ----------------
const wp = (x, z, ry, lx, lz) => [x + lx * Math.cos(ry) + lz * Math.sin(ry), z - lx * Math.sin(ry) + lz * Math.cos(ry)];
// storefront facing local +z (ry turns it): walls, roof, door, lit windows, awning and a name sign
function shop(w, x, z, ry, W, D, H, wall, roof, awn, label, lc = 0x1e293b) {
  const T = w.tf(x, 0, z, ry); T.box('m', wall, 0, 0, 0, W, H, D, 0.05); T.box('m', roof, 0, H, 0, W + 0.4, 0.45, D + 0.4, 0.05);
  T.box('w', 0x3f2a1e, 0, 0, D / 2 + 0.03, 1.1, 2.1, 0.08, 0.02);
  for (let k = -1; k <= 1; k += 2) T.box('l', 0xfde68a, k * W * 0.3, 0.8, D / 2 + 0.03, W * 0.22, 1.2, 0.06, 0.02, 0.35);
  for (let r = 3.2; r < H - 0.9; r += 1.9) for (let k = -2; k <= 2; k++) if (Math.abs(k * W * 0.19) < W / 2 - 0.5) T.box('l', 0xbfdbfe, k * W * 0.19, r, D / 2 + 0.03, 0.8, 1.0, 0.06, 0.02, 0.2);
  T.box('g', awn, 0, 2.35, D / 2 + 0.55, W * 0.92, 0.12, 1.1, 0.02); for (let k = 0; k < 6; k++) T.box('g', k % 2 ? 0xffffff : awn, -W * 0.46 + (k + 0.5) * W * 0.92 / 6, 2.2, D / 2 + 1.08, W * 0.92 / 6, 0.16, 0.04, 0.01);
  T.box('g', 0xffffff, 0, 2.62, D / 2 + 0.05, Math.min(W * 0.8, label.length * 0.26 + 0.4), 0.5, 0.06, 0.02);
  const [sx, sz] = wp(x, z, ry, 0, D / 2 + 0.12); txt(w, label, sx, 2.7, sz, ry, 0.24, lc, 'g');
  T.solid(-W / 2, 0, -D / 2, W / 2, H, D / 2);
}
function streetLamp(w, x, z, col = 0x1f2937) { w.add('x', rcyl(0.22, 0.2, 0.04, 12), col, x, 0, z); w.add('x', cyl(10), col, x, 0, z, 0, 0, 0, 0.09, 3.6, 0.09);
  w.slab('x', col, x, 3.55, z, 0.42, 0.12, 0.42, 0.02); w.slab('l', 0xfff3c4, x, 3.67, z, 0.32, 0.42, 0.32, 0.03, false, 1.2); w.add('x', cone(4), col, x, 4.09, z, 0, PI / 4, 0, 0.36, 0.25, 0.36); w.solid(x - 0.15, 0, z - 0.15, x + 0.15, 3.6, z + 0.15); }
function bin(w, x, z, col = 0x334155) { w.add('x', cyl(12), col, x, 0, z, 0, 0, 0, 0.26, 0.8, 0.26); w.add('x', cyl(12), 0x111827, x, 0.8, z, 0, 0, 0, 0.28, 0.06, 0.28); w.solid(x - 0.28, 0, z - 0.28, x + 0.28, 0.86, z + 0.28); }
function parkBench(w, x, z, ry, col) { const T = w.tf(x, 0, z, ry); T.box('w', col, 0, 0.42, 0, 1.8, 0.08, 0.5, 0.02); T.box('w', col, 0, 0.55, -0.24, 1.8, 0.4, 0.07, 0.02);
  [-0.75, 0.75].forEach((a) => T.box('x', 0x1f2937, a, 0, 0, 0.08, 0.44, 0.48, 0.01)); T.solid(-0.9, 0, -0.3, 0.9, 0.9, 0.3); }
function hedge(w, x0, z0, x1, z1, col = 0x3f6212) { w.slab('m', 0x8b7355, (x0 + x1) / 2, 0, (z0 + z1) / 2, Math.abs(x1 - x0) + 0.9, 0.35, Math.abs(z1 - z0) + 0.9, 0.04); w.slab('g', col, (x0 + x1) / 2, 0.35, (z0 + z1) / 2, Math.abs(x1 - x0) + 0.7, 0.6, Math.abs(z1 - z0) + 0.7, 0.2); }
function flagPole(w, x, z, cols) { w.add('x', cyl(8), 0xe5e7eb, x, 0, z, 0, 0, 0, 0.06, 6, 0.06); cols.forEach((c, i) => w.slab('g', c, x + 0.75, 5.0 + (cols.length - 1 - i) * (1 / cols.length), z, 1.4, 1 / cols.length, 0.04, 0.005, false)); w.solid(x - 0.1, 0, z - 0.1, x + 0.1, 6, z + 0.1); }
// plaza frame: paving, curbs, crowd stands both sides, a tidy lamp grid, benches + bins along the boulevard, hedge borders
function cityFrame(w, c, cx, cz, pal, o = {}) {
  if (!o.noPave) { w.slab('m', pal.out, cx, 0.005, cz - 4, 46, 0.04, 28, 0.02, { floor: true });
    for (let k = -20; k <= 20; k += 4) w.slab('m', 0xffffff, cx + k, 0.03, cz - 4, 0.06, 0.02, 28, 0.005, false, 0); }
  [-1, 1].forEach((s) => SEATS_.push(...bleachers(w, 'z', cz - 6.5, cz + 6.5, cx + s * 7.4, s, 3, { cols: [c.col, 0xffffff] })));
  [-1, 1].forEach((s) => { [-13, -5, 3].forEach((dz) => streetLamp(w, cx + s * 11.2, cz + dz)); streetLamp(w, cx + s * 8.6, cz + 9.4); });
  [-1, 1].forEach((s) => { [13.5, 18].forEach((dx) => parkBench(w, cx + s * dx, cz + 9, PI, 0x92400e)); bin(w, cx + s * 15.75, cz + 9.2); });
  [-1, 1].forEach((s) => hedge(w, cx + s * 22.6, cz - 17, cx + s * 22.6, cz + 7));
  flagPole(w, cx - 4.6, cz - 12.2, o.flag); flagPole(w, cx + 4.6, cz - 12.2, o.flag);
}
let SEATS_ = [];
// ---------------- PARIS: big Eiffel Tower, café + boulangerie row with terrace, flower market, Morris column ----------------
function eiffel(w) { // unit model ~14 tall at origin, call via K.scaled
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => w.add('x', rbox(0.5, 5.2, 0.5, 0.05, 1), 0x7c6a55, a * 1.9, 2.4, b * 1.9, -b * 0.3, 0, a * 0.3));
  w.add('x', torus(0.08, 24), 0x7c6a55, 0, 2.2, 1.9, 0, 0, 0, 1.4, 1.1, 1); w.add('x', torus(0.08, 24), 0x7c6a55, 0, 2.2, -1.9, 0, 0, 0, 1.4, 1.1, 1);
  w.slab('x', 0x6b5b47, 0, 4.6, 0, 3.6, 0.35, 3.6, 0.05); w.add('x', rbox(1.6, 5.5, 1.6, 0.05, 1), 0x7c6a55, 0, 4.9, 0); w.slab('x', 0x6b5b47, 0, 7.6, 0, 2.0, 0.25, 2.0, 0.04);
  w.add('x', rbox(0.8, 4.2, 0.8, 0.04, 1), 0x7c6a55, 0, 7.8, 0); w.add('x', cone(8), 0x6b5b47, 0, 12.0, 0, 0, 0, 0, 0.35, 1.8, 0.35);
  w.add('l', sph(8), 0xfde047, 0, 13.9, 0, 0, 0, 0, 0.18, 0.18, 0.18, 1.6); w.solid(-2.4, 0, -2.4, 2.4, 14, 2.4); }
function bistro(w, x, z) { w.add('x', cyl(10), 0x111827, x, 0, z, 0, 0, 0, 0.05, 0.75, 0.05); w.add('g', cyl(14), 0xffffff, x, 0.75, z, 0, 0, 0, 0.42, 0.04, 0.42);
  [-0.6, 0.6].forEach((o) => { w.slab('x', 0x1f2937, x + o, 0.45, z, 0.38, 0.06, 0.38, 0.02, false); w.slab('x', 0x1f2937, x + o * 1.25, 0.45, z, 0.06, 0.5, 0.38, 0.01, false); }); w.solid(x - 0.9, 0, z - 0.45, x + 0.9, 0.8, z + 0.45); }
function stall(w, x, z, ry, awn, goods, label) { const T = w.tf(x, 0, z, ry); T.box('w', 0x92400e, 0, 0, 0, 2.6, 0.9, 1.2, 0.04); [-1.2, 1.2].forEach((a) => T.box('x', 0x1f2937, a, 0.9, -0.5, 0.08, 1.6, 0.08, 0.01));
  T.box('g', awn, 0, 2.5, 0, 2.9, 0.12, 1.7, 0.03); for (let k = 0; k < 5; k++) T.add('g', sph(8), goods[k % goods.length], -1 + k * 0.5, 1.05, 0.15, 0, 0, 0, 0.22, 0.2, 0.22);
  const [sx, sz] = wp(x, z, ry, 0, 0.64); txt(w, label, sx, 0.45, sz, ry, 0.17, 0xffffff, 'g'); T.solid(-1.3, 0, -0.6, 1.3, 2.6, 0.6); }
function paris(w, cx, cz) {
  eiffel(K.scaled(w, cx, 0, cz - 20, 2.3));
  // west: café + boulangerie facing the court, terrace in a neat 2x3 grid
  shop(w, cx - 19.5, cz - 10.5, PI / 2, 7, 4, 7.4, 0xf5ebd7, 0x475569, 0xdc2626, 'CAFÉ DU DINK');
  shop(w, cx - 19.5, cz - 2.5, PI / 2, 7, 4, 7.4, 0xede0c8, 0x475569, 0x1e3a8a, 'BOULANGERIE');
  for (const dz of [-12.5, -9, -5.5, -2]) for (const dx of [-15.4]) bistro(w, cx + dx, cz + dz);
  [-14.5, -6.5, 1.5].forEach((dz) => w.add('g', sph(10), 0x15803d, cx - 13.2, 0.6, cz + dz, 0, 0, 0, 0.5, 0.45, 0.5));
  // east: flower market + baguette cart + Morris column
  [-12, -8, -4].forEach((dz, i) => stall(w, cx + 17.5, cz + dz, -PI / 2, [0x15803d, 0xdc2626, 0x1e3a8a][i], [[0xf472b6, 0xef4444, 0xfde047], [0xfef3c7, 0xd97706], [0xa78bfa, 0xffffff, 0xf472b6]][i], ['FLEURS', 'FROMAGE', 'CRÊPES'][i]));
  w.slab('w', 0x92400e, cx + 17.5, 0.2, cz + 1.5, 1.2, 0.8, 2.2, 0.05); for (let i = 0; i < 5; i++) w.add('w', rbox(0.12, 0.12, 0.9, 0.05, 1), 0xd97706, cx + 17.3 + (i % 2) * 0.25, 1.1, cz + 0.7 + i * 0.4, 0.4, 0, 0);
  [-0.8, 0.8].forEach((o) => w.add('f', cyl(12), 0x111827, cx + 17.5 + o * 0.75, 0.25, cz + 1.5 + o, 0, 0, PI / 2, 0.25, 0.1, 0.25)); txt(w, '🥖 BAGUETTES', cx + 16.88, 0.6, cz + 1.5, -PI / 2, 0.15, 0xfde68a, 'g');
  w.add('g', cyl(16), 0x166534, cx + 14, 0, cz + 4.5, 0, 0, 0, 0.6, 2.8, 0.6); w.add('g', sph(14), 0x14532d, cx + 14, 2.8, cz + 4.5, 0, 0, 0, 0.65, 0.5, 0.65); w.solid(cx + 13.4, 0, cz + 3.9, cx + 14.6, 3.2, cz + 5.1);
  [[-17, -17], [17, -17], [-11.2, -17], [11.2, -17]].forEach(([a, b]) => tree(w, cx + a, cz + b, 0x4d7c0f, 1.4));
}
// ---------------- TOKYO: big pagoda, torii gate, noren shop row, vending machines, cherry tree row, lantern strings ----------------
function pagoda(w) { for (let i = 0; i < 5; i++) { const s = 4.2 - i * 0.6; w.slab('g', 0x7f1d1d, 0, i * 1.5, 0, s * 0.7, 1.2, s * 0.7, 0.04); w.add('m', cone(4), 0x1f2937, 0, i * 1.5 + 1.2, 0, 0, PI / 4, 0, s * 0.85, 0.5, s * 0.85); }
  w.add('x', cyl(8), 0xfacc15, 0, 7.5, 0, 0, 0, 0, 0.06, 1.4, 0.06); w.solid(-1.6, 0, -1.6, 1.6, 8, 1.6); }
function torii(w, x, z, ry) { const T = w.tf(x, 0, z, ry); [-2.2, 2.2].forEach((o) => T.add('g', cyl(12), 0xdc2626, o, 0, 0, 0, 0, 0, 0.22, 4.4, 0.22)); T.box('g', 0x111827, 0, 4.4, 0, 6.2, 0.35, 0.6, 0.06); T.box('g', 0xdc2626, 0, 3.5, 0, 5.2, 0.25, 0.4, 0.04);
  [-2.2, 2.2].forEach((o) => T.solid(o - 0.3, 0, -0.3, o + 0.3, 4.4, 0.3)); }
function lanternLine(w, x0, x1, z, y) { w.add('x', rbox(x1 - x0, 0.02, 0.02, 0.005, 1), 0x111827, (x0 + x1) / 2, y + 0.3, z); for (let x = x0 + 0.8; x < x1 - 0.4; x += 1.6) { w.add('x', cyl(4), 0x111827, x, y + 0.1, z, 0, 0, 0, 0.01, 0.2, 0.01); w.add('l', sph(8), (Math.round(x) & 1) ? 0xef4444 : 0xfde68a, x, y, z, 0, 0, 0, 0.26, 0.34, 0.26, 1.1); } }
function tokyo(w, cx, cz) {
  pagoda(K.scaled(w, cx, 0, cz - 20, 1.9));
  [-1, 1].forEach((s) => { for (let k = 0; k < 4; k++) tree(w, cx + s * (7 + k * 2.2) + s * 1.2, cz - 17.5, 0xf9a8d4, 1.2); });
  torii(w, cx - 16.5, cz + 6, 0);
  shop(w, cx - 19.5, cz - 11, PI / 2, 6.5, 4, 6, 0x7c2d12, 0x1f2937, 0x1e3a8a, '🍜 RAMEN', 0x7f1d1d);
  shop(w, cx - 19.5, cz - 3.5, PI / 2, 6.5, 4, 6, 0x92400e, 0x1f2937, 0x7f1d1d, '🍡 MOCHI', 0x7f1d1d);
  lanternLine(w, cx - 16.5, cx - 13, cz - 7.2, 3.1); lanternLine(w, cx + 13, cx + 21, cz + 3, 3.1);
  [-13, -11.4, -9.8].forEach((dz, i) => vending(w, cx + 21.6, cz + dz, -PI / 2, [0xef4444, 0x2563eb, 0xf8fafc][i]));
  shop(w, cx + 19.5, cz - 3, -PI / 2, 6, 4, 9, 0x334155, 0x111827, 0xec4899, 'GAME CENTER', 0xbe185d);
  [-14, -6.5].forEach((dz) => tree(w, cx + 14.5, cz + dz, 0xf9a8d4, 1.3)); tree(w, cx - 14.5, cz - 15, 0xf9a8d4, 1.3);
}
// ---------------- NEW YORK: skyline wall, big Statue of Liberty, deli + subway, taxi, hot dog cart, newsstand ----------------
function liberty(w) { w.slab('x', 0x78716c, 0, 0, 0, 2.2, 1.8, 2.2, 0.05); w.slab('x', 0xa8a29e, 0, 1.8, 0, 1.6, 0.4, 1.6, 0.05);
  w.add('g', cone(10), 0x5eead4, 0, 1.8, 0, 0, 0, 0, 0.6, 3.2, 0.6); w.add('g', sph(10), 0x5eead4, 0, 5.5, 0, 0, 0, 0, 0.32, 0.36, 0.32);
  for (let k = 0; k < 5; k++) w.add('g', cone(4), 0x5eead4, Math.cos(k * 0.7 - 1.4) * 0.3, 5.85, Math.sin(k * 0.7 - 1.4) * 0.3, 0, 0, 0, 0.06, 0.25, 0.06);
  w.add('g', cyl(6), 0x5eead4, 0.38, 5.0, 0, 0, 0, 0, 0.08, 1.2, 0.08); w.add('l', cone(8), 0xfacc15, 0.38, 6.4, 0, 0, 0, 0, 0.16, 0.35, 0.16, 1.4); w.solid(-1.1, 0, -1.1, 1.1, 6.5, 1.1); }
function nyc(w, cx, cz) {
  const H = [12, 18, 10, 24, 15, 30, 14, 20, 11, 16, 13]; H.forEach((h, i) => { const x = cx - 20 + i * 4, z = cz - 20 - (i % 2) * 1.2;
    w.slab('x', [0x64748b, 0x475569, 0x94a3b8, 0x9a3412][i % 4], x, 0, z, 3.7, h, 3.4, 0.05);
    for (let r = 1.2; r < h - 1; r += 1.6) w.slab('l', 0xfde68a, x, r, z + 1.72, 2.8, 0.55, 0.02, 0.01, false, 0.45); });
  w.add('x', cone(6), 0xcbd5e1, cx, 30, cz - 20, 0, 0, 0, 0.5, 4, 0.5);
  liberty(K.scaled(w, cx + 17, 0, cz - 14, 1.8));
  shop(w, cx - 19.5, cz - 11, PI / 2, 6.5, 4, 8, 0x9a3412, 0x1f2937, 0x166534, 'NY DELI');
  shop(w, cx - 19.5, cz - 3.5, PI / 2, 6.5, 4, 10, 0x78350f, 0x1f2937, 0xdc2626, 'PIZZA SLICE');
  // subway entrance (railings + globe lamps)
  { const x = cx - 15, z = cz + 3.5; w.slab('m', 0x1f2937, x, 0.01, z, 2.4, 0.03, 3.2, 0.02, false); [-1.2, 1.2].forEach((o) => { w.slab('g', 0x166534, x + o, 0, z, 0.08, 1.0, 3.2, 0.02); w.add('l', sph(10), 0x86efac, x + o, 1.7, z + 1.5, 0, 0, 0, 0.22, 0.22, 0.22, 1); w.add('x', cyl(6), 0x166534, x + o, 0, z + 1.5, 0, 0, 0, 0.05, 1.55, 0.05); });
    w.slab('g', 0x166534, x, 0, z - 1.6, 2.4, 1.0, 0.08, 0.02); txt(w, '🚇 SUBWAY', x, 2.0, z + 1.55, 0, 0.2, 0xffffff, 'g'); }
  { const x = cx - 13.3, z = cz - 7; w.slab('g', 0xfacc15, x, 0.25, z, 1.7, 0.6, 3.6, 0.15); w.slab('g', 0xfde047, x, 0.85, z, 1.5, 0.5, 1.9, 0.12, false);
    w.slab('l', 0x93c5fd, x, 0.9, z, 1.55, 0.36, 1.6, 0.05, false, 0.3); txt(w, 'TAXI', x, 1.4, z, PI / 2, 0.14, 0x111827, 'g');
    [[-0.85, -1.2], [0.85, -1.2], [-0.85, 1.2], [0.85, 1.2]].forEach(([a, b]) => w.add('f', cyl(10), 0x111827, x + a, 0.3, z + b, 0, 0, PI / 2, 0.3, 0.2, 0.3)); }
  { const x = cx + 15, z = cz - 3; w.slab('x', 0xd1d5db, x, 0.3, z, 1.2, 0.9, 2.0, 0.05); w.add('g', cyl(10), 0xef4444, x, 2.4, z, 0, 0, 0, 1.1, 0.06, 1.1); w.add('x', cyl(6), 0x6b7280, x, 1.2, z, 0, 0, 0, 0.04, 1.2, 0.04);
    [-0.6, 0.6].forEach((o) => w.add('f', cyl(12), 0x111827, x, 0.3, z + o * 1.2, 0, 0, PI / 2, 0.3, 0.1, 0.3)); txt(w, '🌭 HOT DOGS', x - 0.62, 0.8, z, -PI / 2, 0.16, 0x1e3a8a, 'g'); }
  shop(w, cx + 19.8, cz - 3, -PI / 2, 5, 3, 3.2, 0x166534, 0x14532d, 0xfacc15, 'NEWS', 0x14532d);
  [[-8.5, 9.6], [8.5, 8.6]].forEach(([a, b]) => { w.add('g', cyl(8), 0xdc2626, cx + a + 1.2, 0, cz + b, 0, 0, 0, 0.18, 0.7, 0.18); w.add('g', sph(8), 0xdc2626, cx + a + 1.2, 0.7, cz + b, 0, 0, 0, 0.2, 0.16, 0.2); });
  [-14.5, -6.5, 1].forEach((dz) => tree(w, cx + 21, cz + dz - 6 + 6, 0x166534, 1.1));
}
// ---------------- RIO: sand + sea, Sugarloaf + big Christ statue, Copacabana wave promenade, kiosks, umbrella grid, palm rows ----------------
function rio(w, cx, cz) {
  w.slab('m', 0xf5deb3, cx, 0.005, cz - 4, 46, 0.04, 28, 0.02, { floor: true });
  w.slab('l', 0x38bdf8, cx, 0.03, cz - 17, 46, 0.02, 4, 0.01, false, 0.2);
  for (let k = -22; k < 22; k += 1) w.slab('m', k & 1 ? 0x111827 : 0xffffff, cx + k + 0.5, 0.045, cz + 8 + Math.sin(k * 1.2) * 0.4, 1, 0.02, 2.2, 0.005, false);
  w.add('m', sph(12), 0x4d7c0f, cx - 10, -1, cz - 24, 0, 0, 0, 5, 10, 4.5); w.add('m', sph(12), 0x3f6212, cx - 1, -1, cz - 25, 0, 0, 0, 4, 7, 3.5);
  w.add('m', sph(12), 0x4d7c0f, cx + 12, -1, cz - 24, 0, 0, 0, 6, 13, 5);
  const CX = cx + 12, CZ = cz - 22, Y = 11.5; w.add('g', rbox(0.9, 3.2, 0.7, 0.08, 1), 0xe5e7eb, CX, Y + 1.6, CZ); w.add('g', rbox(4.2, 0.6, 0.6, 0.08, 1), 0xe5e7eb, CX, Y + 2.8, CZ); w.add('g', sph(8), 0xe5e7eb, CX, Y + 3.5, CZ, 0, 0, 0, 0.45, 0.5, 0.45);
  w.add('x', rbox(12, 0.03, 0.03, 0.01, 1), 0x111827, cx - 5.5, 6.5, cz - 24.5, 0, 0, -0.35); w.slab('g', 0xef4444, cx - 6, 6.3, cz - 24.5, 0.7, 0.6, 0.6, 0.05, false);
  [-1, 1].forEach((s) => [-15, -8, -1, 6].forEach((dz) => palm(w, cx + s * 21, cz + dz)));
  [-13.5, -7, -0.5].forEach((dz, i) => { const x = cx - 17.5, z = cz + dz; w.slab('w', 0xa16207, x, 0, z, 2.2, 1.1, 2.6, 0.05); w.add('m', cone(8), 0xd6b370, x, 2.6, z, 0, 0, 0, 2.2, 1.0, 2.4);
    w.add('x', cyl(6), 0x78350f, x, 1.1, z, 0, 0, 0, 0.08, 1.5, 0.08); [0, 1, 2].forEach((k) => w.add('w', sph(8), [0x5c3d1e, 0x7e22ce, 0xf97316][i], x + 1.15, 1.2, z - 0.7 + k * 0.7, 0, 0, 0, 0.2, 0.2, 0.2));
    txt(w, ['🥥 ÁGUA DE COCO', '🍇 AÇAÍ', '🍊 SUCOS'][i], x + 1.13, 0.55, z, PI / 2, 0.15, 0xfde047, 'g'); });
  [13.5, 17.5].forEach((dx, j) => [-13, -8, -3].forEach((dz, k) => { const c = [0xf97316, 0x22c55e, 0xfacc15, 0xef4444, 0x0ea5e9, 0xec4899][j * 3 + k], x = cx + dx, z = cz + dz;
    w.add('x', cyl(6), 0xf8fafc, x, 0, z, 0, 0, 0, 0.04, 2.1, 0.04); w.add('g', cone(10), c, x, 2.1, z, 0, 0, 0, 1.3, 0.5, 1.3); w.slab('g', c, x + 0.9, 0.05, z, 0.8, 0.02, 1.7, 0.01, false); w.solid(x - 0.1, 0, z - 0.1, x + 0.1, 2.1, z + 0.1); }));
  { const x = cx + 15.5, z = cz + 3; [-2.2, 2.2].forEach((o) => w.add('x', cyl(6), 0xf8fafc, x + o, 0, z, 0, 0, 0, 0.05, 2.3, 0.05)); w.slab('x', 0xf8fafc, x, 1.6, z, 4.4, 0.7, 0.03, 0.005, false); txt(w, 'FUTEVÔLEI', x, 2.45, z, 0, 0.16, 0x0e7490, 'g'); }
}
export const WT_CITIES = [
  { id: 'wt_paris', key: 'paris', x: -72, n: 'Paris Roland Court', city: 'Paris', flag: '🇫🇷', build: paris, col: 0x1d4ed8, flagC: [0x1d4ed8, 0xffffff, 0xdc2626] },
  { id: 'wt_tokyo', key: 'tokyo', x: -24, n: 'Tokyo Sakura Court', city: 'Tokyo', flag: '🇯🇵', build: tokyo, col: 0xbe185d, flagC: [0xffffff, 0xdc2626, 0xffffff] },
  { id: 'wt_nyc', key: 'nyc', x: 24, n: 'New York Skyline Court', city: 'New York', flag: '🇺🇸', build: nyc, col: 0x166534, flagC: [0xdc2626, 0xffffff, 0x1e3a8a] },
  { id: 'wt_rio', key: 'rio', x: 72, n: 'Rio Copacabana Court', city: 'Rio', flag: '🇧🇷', build: rio, col: 0x0e7490, flagC: [0x16a34a, 0xfacc15, 0x16a34a] },
];
export const WT_Z = -86;
export function buildWorldTour(w, SPOTS, SEATS, RES) {
  const fg0 = w._fg, det0 = w.detail, oy0 = w.oy; w._fg = null; w.detail = false; w.oy = 0; w.region = 'out'; try { buildWT(w, SPOTS, SEATS, RES); } finally { w._fg = fg0; w.detail = det0; w.oy = oy0; }
}
function buildWT(w, SPOTS, SEATS, RES) {
  RES.push([-100, -104, 100, -60]);
  const owned = tourOwned();
  // Tortuga Air Tour Gate archway at (0, -64) facing the park (south)
  w.slab('m', 0xd6d1c4, 0, 0, -61, 6, 0.05, 6, 0.03, { floor: true });
  [-3.4, 3.4].forEach((s) => { w.add('x', rcyl(0.3, 4.6, 0.05, 14), 0x0f766e, s, 0, -64); w.solid(s - 0.35, 0, -64.35, s + 0.35, 4.6, -63.65); });
  w.slab('g', 0x0f766e, 0, 4.2, -64, 7.6, 1.0, 0.45, 0.08);
  txt(w, '🌍 WORLD TOUR · TORTUGA AIR GATE', 0, 4.7, -63.74, 0, 0.3, 0xfde047, 'l', 0.4);
  txt(w, 'PARIS • TOKYO • NEW YORK • RIO  — LIVE ON TTN', 0, 4.35, -63.74, 0, 0.16, 0xffffff, 'l', 0.3);
  if (!owned) { w.slab('g', 0x1e293b, 0, 0, -64, 6.2, 2.2, 0.24, 0.04, { wall: true }); txt(w, '🔒 WORLD TOUR DLC (ARCADE DLC SHOP)', 0, 1.35, -63.86, 0, 0.22, 0xfde047, 'l'); SPOTS.tourGate = [0, -61.5]; return; }
  // Boulevard: main walk z -66..-74, plus ramps to each court
  w.slab('m', 0xe8dcc4, 0, 0.01, -70, 196, 0.05, 8, 0.03, { floor: true });
  w.slab('l', 0x14b8a6, 0, 0.04, -66.2, 194, 0.01, 0.2, 0.005, null, 0.3); w.slab('l', 0x14b8a6, 0, 0.04, -73.8, 194, 0.01, 0.2, 0.005, null, 0.3);
  // TTN Broadcast Booth + Departures board inside the gate plaza (0, -69)
  w.slab('g', 0x111827, -5.5, 0.05, -69, 3.6, 1.0, 1.2, 0.05, { solid: true }); w.slab('l', 0x0ea5e9, -5.5, 1.06, -69, 3.7, 0.06, 1.3, 0.02, null, 0.6);
  w.slab('x', 0x111827, -5.5, 1.1, -69.9, 3.4, 2.0, 0.12, 0.03); w.slab('l', 0x0f766e, -5.5, 1.3, -69.82, 3.1, 1.6, 0.02, 0.01, null, 0.5);
  txt(w, '📺 TTN · TORTUGA TV NETWORK', -5.5, 2.75, -69.8, 0, 0.18, 0xfde047, 'l', 0.4);
  txt(w, 'LIVE • WORLD TOUR', -5.5, 2.0, -69.78, 0, 0.2, 0xffffff, 'l', 0.6);
  ttnCam(w, -3.0, -67.8, -0.6);
  w.slab('x', 0x0f172a, 5.5, 0.05, -69.6, 4.2, 3.0, 0.3, 0.04, { solid: true });
  txt(w, '✈️ DEPARTURES', 5.5, 2.7, -69.42, 0, 0.22, 0xfde047, 'l', 0.4);
  WT_CITIES.forEach((c, i) => txt(w, c.flag + ' ' + c.city.toUpperCase() + '  LEG ' + (i + 1) + '  ON TIME', 5.5, 2.2 - i * 0.42, -69.42, 0, 0.15, 0x86efac, 'l', 0.4));
  // Franklin gear kiosk (MaxGrit + Silent Serve) east of the board
  w.slab('g', 0xf97316, 9.6, 0.05, -69.2, 2.4, 1.0, 1.0, 0.05, { solid: true }); w.slab('g', 0x111827, 9.6, 2.4, -69.2, 2.8, 0.15, 1.4, 0.03);
  paddleProp(w, 9.0, 1.15, -69.2, 0.3, 0, 0x111827, 1.1, 0xf97316, true); paddleProp(w, 9.9, 1.15, -69.2, -0.3, 0, 0x2563eb, 1.1, 0xffffff, true); ballBucket(w, 10.6, 1.05, -69.2, 0xfde047, 8);
  txt(w, 'FRANKLIN TOUR GEAR', 9.6, 2.6, -68.48, 0, 0.16, 0xffffff, 'l', 0.4);
  SPOTS.tourDesk = [-5.5, -67.6]; SPOTS.tourGear = [9.6, -67.6]; SPOTS.tourBoard = [5.5, -68.0];
  SPOTS.tortyTour = [-6.6, -69.0]; SPOTS.candyTour = [1.8, -66.6];
  // Cities
  WT_CITIES.forEach((c) => {
    const cx = c.x, cz = WT_Z; SEATS_ = SEATS;
    cityFrame(w, c, cx, cz, WT_PAL[c.key], { noPave: c.key === 'rio', flag: c.flagC });
    c.build(w, cx, cz);
    court(w, cx, cz, WT_PAL[c.key], { runX: 2.8, runZ: 3.1, bench: c.col });
    cityBanner(w, cx, cz - 12.6, c.flag + ' ' + c.n.toUpperCase(), 'WORLD TOUR LEG • LIVE ON TTN', c.col);
    ttnCam(w, cx + 6.2, cz + 9.4, PI + 0.5); ttnCam(w, cx - 6.2, cz - 10.4, 0.5);
    SPOTS['court_' + c.id] = [cx, cz + 13.2];
    w.lights.push({ x: cx, y: 5, z: cz, c: 0xfff7ed, i: 16, d: 20 });
  });
}
