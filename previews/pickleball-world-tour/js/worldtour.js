// Grok Pickleball Park - DLC: WORLD TOUR EXPANSION (grokDLC.pickleballpark.world_tour_expansion)
// North Lawn "World Tour Boulevard": Tortuga Air Tour Gate + Tortuga TV Network (TTN) broadcast booth at (0, -66),
// and 4 city courts in a row at z = -86: Paris (-72), Tokyo (-24), New York (24), Rio (72).
import * as K from './kit.js?v=ppk2';
import { rbox } from './world.js?v=ppk2';
import { txt } from './art.js?v=ppk2';
import { court, paddleProp, ballBucket, bleachers, fence } from './court.js?v=ppk2';
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

// ---------------- PARIS: Eiffel Tower, cafe terrace, baguette cart, lamp posts ----------------
function paris(w, cx, cz) {
  // Eiffel Tower behind the north baseline (4 legs + 3 tapering stages + spire)
  const tx = cx, tz = cz - 15.5;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => w.add('x', rbox(0.5, 5.2, 0.5, 0.05, 1), 0x7c6a55, tx + a * 1.9, 2.4, tz + b * 1.9, b * 0.35, 0, -a * 0.35));
  w.slab('x', 0x6b5b47, tx, 4.6, tz, 3.6, 0.35, 3.6, 0.05);
  w.add('x', rbox(1.6, 5.5, 1.6, 0.05, 1), 0x7c6a55, tx, 4.9, tz); w.slab('x', 0x6b5b47, tx, 7.6, tz, 2.0, 0.25, 2.0, 0.04);
  w.add('x', rbox(0.8, 4.2, 0.8, 0.04, 1), 0x7c6a55, tx, 7.8, tz); w.add('x', cone(8), 0x6b5b47, tx, 12.0, tz, 0, 0, 0, 0.35, 1.8, 0.35);
  w.add('l', sph(8), 0xfde047, tx, 13.9, tz, 0, 0, 0, 0.18, 0.18, 0.18, 1.6);
  w.solid(tx - 2.4, 0, tz - 2.4, tx + 2.4, 14, tz + 2.4);
  // Cafe terrace on the west side: red awning, 3 bistro tables with chairs
  w.slab('g', 0xf8fafc, cx - 13, 0, cz - 2, 3.2, 3.0, 6.5, 0.05, { solid: true });
  for (let i = 0; i < 6; i++) w.slab('g', i % 2 ? 0xffffff : 0xdc2626, cx - 11.1, 2.85, cz - 4.7 + i * 1.08, 0.9, 0.08, 1.08, 0.01);
  txt(w, 'CAFÉ DU DINK', cx - 11.38, 2.3, cz - 2, PI / 2, 0.24, 0x1e3a8a, 'l');
  [-4, -1.5, 1].forEach((dz) => { w.add('x', cyl(10), 0x111827, cx - 9.6, 0, cz + dz, 0, 0, 0, 0.05, 0.75, 0.05); w.add('g', cyl(14), 0xffffff, cx - 9.6, 0.75, cz + dz, 0, 0, 0, 0.42, 0.04, 0.42);
    w.add('l', sph(6), 0xfacc15, cx - 9.6, 0.86, cz + dz, 0, 0, 0, 0.06, 0.08, 0.06, 0.6);
    [-0.6, 0.6].forEach((o) => w.slab('x', 0x1f2937, cx - 9.6, 0.45, cz + dz + o, 0.38, 0.06, 0.38, 0.02)); w.solid(cx - 10.1, 0, cz + dz - 0.5, cx - 9.1, 0.8, cz + dz + 0.5); });
  // Baguette cart east side
  w.slab('w', 0x92400e, cx + 10.2, 0.45, cz + 3, 1.2, 0.8, 2.2, 0.05, { solid: true });
  for (let i = 0; i < 5; i++) w.add('w', rbox(0.12, 0.12, 0.9, 0.05, 1), 0xd97706, cx + 10.0 + (i % 2) * 0.25, 0.95, cz + 2.2 + i * 0.4, 0.4, 0, 0);
  txt(w, '🥖 BAGUETTES', cx + 9.58, 1.1, cz + 3, -PI / 2, 0.16, 0xfde68a, 'l');
  // Paris lamp posts
  [[-8.5, -9], [8.5, -9], [-8.5, 9], [8.5, 9]].forEach(([a, b]) => { w.add('x', cyl(8), 0x1f2937, cx + a, 0, cz + b, 0, 0, 0, 0.07, 3.2, 0.07); w.add('l', sph(8), 0xfff7cc, cx + a, 3.3, cz + b, 0, 0, 0, 0.22, 0.28, 0.22, 1.2); });
  [[-12, -9], [-12, 6], [12, -9], [12, -3]].forEach(([a, b]) => tree(w, cx + a, cz + b, 0x4d7c0f, 1.1));
}
// ---------------- TOKYO: torii gate, 5-tier pagoda, cherry trees, paper lanterns, ramen stand ----------------
function tokyo(w, cx, cz) {
  const tz = cz - 15;
  [-2.6, 2.6].forEach((o) => { w.add('g', cyl(12), 0xdc2626, cx - 11 + o, 0, tz + 3, 0, 0, 0, 0.22, 4.4, 0.22); w.solid(cx - 11 + o - 0.3, 0, tz + 2.7, cx - 11 + o + 0.3, 4.4, tz + 3.3); });
  w.slab('g', 0x111827, cx - 11, 4.4, tz + 3, 7.2, 0.35, 0.6, 0.06); w.slab('g', 0xdc2626, cx - 11, 3.6, tz + 3, 6.0, 0.25, 0.4, 0.04);
  // Pagoda
  for (let i = 0; i < 5; i++) { const s = 4.2 - i * 0.6; w.slab('g', 0x7f1d1d, cx + 6, i * 1.5, tz, s * 0.7, 1.2, s * 0.7, 0.04); w.add('m', cone(4), 0x1f2937, cx + 6, i * 1.5 + 1.2, tz, 0, PI / 4, 0, s * 0.75, 0.5, s * 0.75); }
  w.add('x', cyl(8), 0xfacc15, cx + 6, 7.7, tz, 0, 0, 0, 0.06, 1.4, 0.06); w.solid(cx + 4.4, 0, tz - 1.6, cx + 7.6, 8, tz + 1.6);
  // Cherry blossom trees
  [[-12, -6], [-12, 3], [12, -7], [12, 2], [-3, -14], [12, 9]].forEach(([a, b]) => tree(w, cx + a, cz + b, 0xf9a8d4, 1.15));
  // Paper lantern string over the south walk
  for (let i = 0; i < 9; i++) { w.add('l', sph(8), i % 2 ? 0xef4444 : 0xfde68a, cx - 8 + i * 2, 3.3, cz - 9.4, 0, 0, 0, 0.26, 0.34, 0.26, 1.1); }
  w.add('x', cyl(6), 0x1f2937, cx - 8.6, 0, cz - 9.4, 0, 0, 0, 0.05, 3.5, 0.05); w.add('x', cyl(6), 0x1f2937, cx + 8.6, 0, cz - 9.4, 0, 0, 0, 0.05, 3.5, 0.05);
  // Ramen stand (west)
  w.slab('w', 0x78350f, cx - 10.4, 0.5, cz + 4, 1.4, 1.0, 3.0, 0.05, { solid: true }); w.slab('g', 0x1e3a8a, cx - 10.4, 2.6, cz + 4, 1.8, 0.12, 3.4, 0.03);
  [0, 1, 2].forEach((i) => w.add('g', cyl(10), 0xffffff, cx - 10.2, 1.05, cz + 3 + i, 0, 0, 0, 0.18, 0.14, 0.18));
  txt(w, '🍜 RAMEN', cx - 9.68, 1.3, cz + 4, -PI / 2, 0.18, 0xfde047, 'l');
}
// ---------------- NEW YORK: skyline, Statue of Liberty, yellow taxi, hot dog cart ----------------
function nyc(w, cx, cz) {
  const H = [9, 14, 7, 18, 11, 8, 13]; H.forEach((h, i) => { const x = cx - 12 + i * 4, z = cz - 17 - (i % 2) * 1.5;
    w.slab('x', [0x64748b, 0x475569, 0x94a3b8][i % 3], x, 0, z, 3.4, h, 3.0, 0.05, { solid: true });
    for (let r = 1; r < h - 1; r += 1.6) w.slab('l', 0xfde68a, x, r, z + 1.52, 2.6, 0.5, 0.02, 0.01, null, 0.5); });
  w.add('x', cone(6), 0xcbd5e1, cx, 18, cz - 17, 0, 0, 0, 0.5, 3, 0.5);
  // Statue of Liberty (east)
  { const x = cx + 11.5, z = cz - 9; w.slab('x', 0x78716c, x, 0, z, 2, 1.6, 2, 0.05, { solid: true }); w.add('g', cone(10), 0x5eead4, x, 1.6, z, 0, 0, 0, 0.6, 3.2, 0.6);
    w.add('g', sph(10), 0x5eead4, x, 4.9, z, 0, 0, 0, 0.32, 0.36, 0.32); w.add('g', cyl(6), 0x5eead4, x + 0.35, 5.0, z, 0, 0, 0, 0.08, 1.2, 0.08); w.add('l', cone(8), 0xfacc15, x + 0.35, 6.2, z, 0, 0, 0, 0.16, 0.35, 0.16, 1.4); }
  // Yellow taxi (west)
  { const x = cx - 11, z = cz + 4; w.slab('g', 0xfacc15, x, 0.35, z, 1.7, 0.6, 3.6, 0.15, { solid: true }); w.slab('g', 0xfde047, x, 0.95, z, 1.5, 0.5, 1.9, 0.12);
    w.slab('l', 0x93c5fd, x, 1.0, z, 1.55, 0.36, 1.6, 0.05); txt(w, 'TAXI', x, 1.3, z, PI / 2, 0.14, 0x111827, 'g');
    [[-0.85, -1.2], [0.85, -1.2], [-0.85, 1.2], [0.85, 1.2]].forEach(([a, b]) => w.add('f', cyl(10), 0x111827, x + a, 0.3, z + b, 0, 0, PI / 2, 0.3, 0.2, 0.3)); }
  // Hot dog cart (east)
  { const x = cx + 10.5, z = cz + 4; w.slab('x', 0xd1d5db, x, 0.5, z, 1.2, 0.9, 2.0, 0.05, { solid: true }); w.add('g', cyl(10), 0xef4444, x, 2.2, z, 0, 0, 0, 1.1, 0.06, 1.1); w.add('x', cyl(6), 0x6b7280, x, 1.4, z, 0, 0, 0, 0.04, 0.8, 0.04);
    txt(w, '🌭 HOT DOGS', x - 0.62, 0.8, z, -PI / 2, 0.16, 0x1e3a8a, 'l'); }
  [[-12, -4], [12, -1]].forEach(([a, b]) => tree(w, cx + a, cz + b, 0x166534, 1));
  // Fire hydrants
  [[-8.5, 9.5], [8.5, 9.5]].forEach(([a, b]) => { w.add('g', cyl(8), 0xdc2626, cx + a, 0, cz + b, 0, 0, 0, 0.18, 0.7, 0.18); w.add('g', sph(8), 0xdc2626, cx + a, 0.7, cz + b, 0, 0, 0, 0.2, 0.16, 0.2); });
}
// ---------------- RIO: beach sand, Sugarloaf mountains, palms, Christ-style hilltop statue, juice kiosk ----------------
function rio(w, cx, cz) {
  w.slab('m', 0xf5deb3, cx, 0.01, cz, 26, 0.03, 24, 0.02, { floor: true });
  w.slab('l', 0x38bdf8, cx, 0.02, cz - 13.5, 26, 0.02, 4, 0.01, null, 0.2);
  w.add('m', sph(12), 0x4d7c0f, cx - 7, -1, cz - 18, 0, 0, 0, 4, 7, 3.5); w.add('m', sph(12), 0x3f6212, cx + 2, -1, cz - 19, 0, 0, 0, 3, 5, 3);
  w.add('m', sph(12), 0x4d7c0f, cx + 9, -1, cz - 17.5, 0, 0, 0, 4.5, 9, 4); // Corcovado hill
  w.add('g', rbox(0.5, 1.8, 0.4, 0.05, 1), 0xe5e7eb, cx + 9, 8, cz - 17.5); w.add('g', rbox(2.4, 0.35, 0.35, 0.05, 1), 0xe5e7eb, cx + 9, 8.9, cz - 17.5); w.add('g', sph(8), 0xe5e7eb, cx + 9, 9.25, cz - 17.5, 0, 0, 0, 0.28, 0.3, 0.28);
  // cable car line to Sugarloaf
  w.add('x', rbox(10, 0.03, 0.03, 0.01, 1), 0x111827, cx - 2.5, 5, cz - 18.5, 0, 0, -0.18); w.slab('g', 0xef4444, cx - 3, 5.3, cz - 18.5, 0.6, 0.5, 0.5, 0.05);
  [[-12, -8], [-12, 0], [-12, 8], [12, -8], [12, 6]].forEach(([a, b]) => palm(w, cx + a, cz + b));
  // Beach umbrellas + towels
  [[-9.4, -3, 0xf97316], [9.4, -3, 0x22c55e], [9.4, 1.5, 0xfacc15]].forEach(([a, b, c]) => { w.add('x', cyl(6), 0xf8fafc, cx + a, 0, cz + b, 0, 0, 0, 0.04, 2.0, 0.04); w.add('g', cone(10), c, cx + a, 2.0, cz + b, 0, 0, 0, 1.1, 0.5, 1.1); w.slab('g', c, cx + a, 0.04, cz + b + 1, 0.8, 0.02, 1.6, 0.01); });
  // Coconut juice kiosk
  { const x = cx - 9.5, z = cz + 5; w.slab('w', 0xa16207, x, 0.5, z, 1.3, 1.0, 2.4, 0.05, { solid: true }); w.add('m', cone(8), 0xd6b370, x, 2.4, z, 0, 0, 0, 1.6, 0.9, 1.9);
    [0, 1, 2].forEach((i) => w.add('w', sph(8), 0x5c3d1e, x + 0.1, 1.15, z - 0.7 + i * 0.7, 0, 0, 0, 0.2, 0.2, 0.2)); txt(w, '🥥 ÁGUA DE COCO', x + 0.67, 1.3, z, PI / 2, 0.13, 0xfde047, 'l'); }
}
export const WT_CITIES = [
  { id: 'wt_paris', key: 'paris', x: -72, n: 'Paris Roland Court', city: 'Paris', flag: '🇫🇷', build: paris, col: 0x1d4ed8 },
  { id: 'wt_tokyo', key: 'tokyo', x: -24, n: 'Tokyo Sakura Court', city: 'Tokyo', flag: '🇯🇵', build: tokyo, col: 0xbe185d },
  { id: 'wt_nyc', key: 'nyc', x: 24, n: 'New York Skyline Court', city: 'New York', flag: '🇺🇸', build: nyc, col: 0x166534 },
  { id: 'wt_rio', key: 'rio', x: 72, n: 'Rio Copacabana Court', city: 'Rio', flag: '🇧🇷', build: rio, col: 0x0e7490 },
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
    const cx = c.x, cz = WT_Z;
    c.build(w, cx, cz);
    court(w, cx, cz, WT_PAL[c.key], { runX: 2.8, runZ: 3.1, bench: c.col });
    cityBanner(w, cx, cz - 11.6, c.flag + ' ' + c.n.toUpperCase(), 'WORLD TOUR LEG • LIVE ON TTN', c.col);
    ttnCam(w, cx + 6.6, cz + 9.8, PI + 0.5); ttnCam(w, cx - 6.6, cz - 9.8, 0.5);
    SEATS.push(...bleachers(w, 'z', cz - 6, cz + 6, cx + 7.6, 1, 2, { cols: [c.col, 0xffffff] }));
    SPOTS['court_' + c.id] = [cx, cz + 13.2];
    w.lights.push({ x: cx, y: 5, z: cz, c: 0xfff7ed, i: 16, d: 20 });
  });
}
