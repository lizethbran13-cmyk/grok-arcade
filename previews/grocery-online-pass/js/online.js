// DLC #46 Super Shop Online Pass (Grok Grocery Tycoon): the Online Store desk in your Main St store, online orders three ways
// (in-store pickup, same-day delivery by a shopper/driver in the Grok van, shipping from the new Shopsville Ship Center),
// Maple Lane (the homes the orders go to), and your own phone (calls, meetings, the online shop, stock orders).
// Locked unless the arcade sold you grokDLC.grocery.super_shop_online_pass (Time Jumper builds are unlocked for testing).
import * as THREE from 'three';
import * as K from './kit.js?v=ggt17';
import { rbox } from './world.js?v=ggt17';
import { shell, part, onSide } from './bld.js?v=ggt17';
import { PI, pick, rcyl, sph, cyl, cone, torus, capsule, txt, poster, wallWord, clockW, pendant, rack, pallet, planter, trash, bags, produceCrate, grokLogo, cartStatic, star, heart } from './art.js?v=ggt17';
export const KEY = 'grokDLC.grocery.super_shop_online_pass';
const QS = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(''); } })();
export function owned() { try { if (QS.get('locked') === '1') return false; if (QS.get('dlc') === '1') return true; if (/\/(previews|archive)\//.test(location.pathname)) return true;
  if (localStorage.getItem(KEY)) return true; const l = JSON.parse(localStorage.getItem('grokDLC.owned') || '[]'); return Array.isArray(l) && l.indexOf(KEY) >= 0; } catch (e) { return false; } }
export const OWN = owned();
// ---------------------------------------------------------------- places
export const WH = { x0: 84, z0: -44, x1: 103, z1: -16, dockX: 90, doorX: 99.5 };      // Shopsville Ship Center (east of the distribution center)
export const DESK = { x: 21.9, z: -10.2, cx: 20.6 };                                       // Online Store desk, front-right corner of Main St (s1)
export const VAN_HOME = [[24.5, 3.2], [21.5, 3.2]];                                     // Grok van bays (van 1, van 2) in the Main St lot
export const HOUSES = [
  { x: -75, n: '1 Maple Ln', fam: 'The Parsnips', wall: 0xfde68a, roof: 0xb45309, door: 0x15803d },
  { x: -45, n: '2 Maple Ln', fam: 'Grandma Rosa', wall: 0xfbcfe8, roof: 0x9d174d, door: 0x1d4ed8 },
  { x: -15, n: '3 Maple Ln', fam: 'Candy\'s house', wall: 0xbfdbfe, roof: 0x1e3a8a, door: 0xdc2626, dog: 1 },
  { x: 15, n: '4 Maple Ln', fam: 'The Okafors', wall: 0xd9f99d, roof: 0x3f6212, door: 0x7c3aed },
  { x: 45, n: '5 Maple Ln', fam: 'Mr. Whiskers', wall: 0xfed7aa, roof: 0x7c2d12, door: 0x0e7490 },
  { x: 75, n: '6 Maple Ln', fam: 'The Lees', wall: 0xe9d5ff, roof: 0x4c1d95, door: 0xb91c1c },
];
const HZ = 119; // house fronts (road z=110, sidewalk to 117.2)
export function treeOk(x, z) { return !OWN || !(x > 81 && x < 106 && z > -48 && z < 8) && !(z > 112 && z < 132 && Math.abs(x) < 92 && HOUSES.some((h) => Math.abs(h.x - x) < 9.5)); }
// ---------------------------------------------------------------- world build (only when owned)
export function buildOnline(w, SPOTS) { if (!OWN) return; const L = w.lights;
  buildDesk(w, L); buildCurb(w); buildShipCenter(w, L); HOUSES.forEach((h) => house(w, h)); mapleLane(w); w.region = 'out'; }
function buildDesk(w, L) { const { x, z } = DESK; w.region = 'in_s1';
  // counter facing the shop floor (west), in the front-right corner (the Customer Service corner moves here)
  { const T = w.tf(x, 0, z, -PI / 2); T.slab('m', 0x0f766e, 0, 0, 0, 2.7, 1.0, 0.8, 0.06); T.box('g', 0xf8fafc, 0, 1.0, 0, 2.85, 0.07, 0.95, 0.03); T.box('g', 0x14b8a6, 0, 0.12, 0.41, 2.6, 0.7, 0.02, 0.01);
    T.box('l', 0x5eead4, 0, 0.88, 0.42, 2.6, 0.05, 0.02, 0.01, 0.5); txt(w, 'GROK ONLINE', x - 0.43, 0.5, z, -PI / 2, 0.14, 0xffffff);
    K.monitor(w, T, -0.75, 1.07, -0.15, 0, 0x22d3ee); K.monitor(w, T, 0.45, 1.07, -0.15, 0, 0xa3e635);
    T.box('x', 0x334155, 1.05, 1.07, 0.05, 0.36, 0.22, 0.3, 0.04); T.box('g', 0xffffff, 1.05, 1.29, 0.12, 0.26, 0.02, 0.14, 0.01); // label printer
    T.box('x', 0x94a3b8, -1.15, 1.07, 0.15, 0.36, 0.04, 0.36, 0.02); T.box('e', 0x93c5fd, -1.15, 1.11, 0.15, 0.3, 0.01, 0.3, 0.005); // scale
    T.box('x', 0x1f2937, -0.15, 1.07, 0.25, 0.32, 0.02, 0.22, 0.02); T.box('e', 0x38bdf8, -0.15, 1.09, 0.25, 0.28, 0.005, 0.18, 0.004, 0.4); // tablet
    for (let i = 0; i < 4; i++) T.box('m', 0xc9a06a, 0.45 + i * 0.03, 1.07 + i * 0.012, 0.3, 0.42, 0.012, 0.3, 0.004); // flat bags
    T.add('l', sph(10), 0xfacc15, 0.8, 1.12, 0.3, 0, 0, 0, 0.06, 0.06, 0.06, 0.6); T.add('x', cyl(8), 0x111827, -0.45, 1.07, 0.32, 0, 0, 0, 0.05, 0.12, 0.05); }
  K.stool(w, x + 0.95, z + 0.75, 0x0f766e);
  // pickup cubbies on the east wall (static bags; ready orders add coloured totes at runtime)
  { const cx = 23.35; for (let r = 0; r < 4; r++) w.add('m', rbox(0.6, 0.06, 4.0, 0.02), 0xe5e7eb, cx, 0.3 + r * 0.6, z); for (let c = 0; c < 5; c++) w.add('m', rbox(0.6, 1.86, 0.06, 0.02), 0xcbd5e1, cx, 1.23, z - 2 + c * 1.0);
    w.add('m', rbox(0.06, 1.9, 4.06, 0.02), 0x0f766e, cx + 0.3, 1.25, z); w.solid(cx - 0.32, 0, z - 2.05, cx + 0.34, 2.2, z + 2.05);
    for (let c = 0; c < 4; c++) txt(w, 'BAY ' + (c + 1), cx - 0.33, 0.12, z - 1.5 + c, -PI / 2, 0.1, 0x0f766e);
    [[0, 0], [2, 1], [3, 0], [1, 2], [2, 2]].forEach(([c, r]) => bags(w, cx - 0.05, 0.33 + r * 0.6, z - 1.5 + c, 2)); }
  // sign above the bays, PICKUP mat, waiting bench, plant, promo standee
  w.add('g', rbox(0.12, 0.9, 3.8, 0.06), 0x0f766e, 23.5, 3.25, z); txt(w, 'ONLINE ORDERS', 23.42, 3.4, z, -PI / 2, 0.3, 0xffffff); txt(w, 'PICKUP · DELIVERY · SHIPPING', 23.42, 2.98, z, -PI / 2, 0.13, 0x99f6e4);
  for (let i = 0; i < 2; i++) w.add('x', cyl(8), 0x111827, 23.5, 3.7, z - 1.5 + i * 3, 0, 0, 0, 0.015, 1.0, 0.015);
  w.add('l', rbox(1.0, 0.012, 2.4, 0.01), 0x2dd4bf, 20.75, 0.075, z, 0, 0, 0, 1, 1, 1, 0); w.add('l', rbox(0.7, 0.014, 2.1, 0.01), 0x0f766e, 20.75, 0.08, z, 0, 0, 0, 1, 1, 1, 0);
  K.bench(w, 23.15, -14.6, -PI / 2, 0x0f766e); K.potPlant(w, 23.2, 0, -12.75, 0.75, 0x0f766e); K.potPlant(w, 23.2, 0, -16.0, 0.75, 0x0f766e);
  { const T = w.tf(21.6, 0, -15.6, -PI / 2 + 0.4); T.box('x', 0x111827, 0, 0, 0, 0.9, 1.7, 0.08, 0.12); T.box('e', 0x5eead4, 0, 0.15, 0.045, 0.78, 1.4, 0.02, 0.08, 0.3); T.box('g', 0xffffff, 0, 1.05, 0.06, 0.6, 0.22, 0.02, 0.04); T.box('g', 0xfacc15, 0, 0.6, 0.06, 0.6, 0.18, 0.02, 0.04); T.box('g', 0xff4fa0, 0, 0.35, 0.06, 0.6, 0.12, 0.02, 0.04); T.box('x', 0x334155, 0, 0, -0.15, 0.5, 0.06, 0.4, 0.02); T.solid(-0.45, 0, -0.3, 0.45, 1.7, 0.1); txt(w, 'ORDER ON YOUR PHONE', 21.6 + Math.cos(0.4) * 0.07, 1.86, -15.6 - Math.sin(0.4) * 0.07, -PI / 2 + 0.4, 0.09, 0x0f766e); }
  // pickup lockers along the front wall (Pi-rat's upgrade) / stacked spare totes until then
  w.region = 'op_lock'; for (let i = 0; i < 3; i++) { const lx = 20.6 + i * 0.95; w.slab('g', 0x0f766e, lx, 0, -6.95, 0.9, 2.2, 0.55, 0.04); for (let r = 0; r < 4; r++) { w.add('g', rbox(0.38, 0.48, 0.03, 0.02), 0x14b8a6, lx - 0.21, 0.3 + r * 0.5, -7.23); w.add('g', rbox(0.38, 0.48, 0.03, 0.02), 0x14b8a6, lx + 0.21, 0.3 + r * 0.5, -7.23); w.add('l', sph(6), r % 2 ? 0x22c55e : 0xf87171, lx - 0.05, 0.42 + r * 0.5, -7.26, 0, 0, 0, 0.025, 0.025, 0.02, 0.6); } }
  w.add('x', rbox(0.5, 0.4, 0.04, 0.02), 0x111827, 22.55, 1.4, -7.24); w.add('e', rbox(0.42, 0.3, 0.01, 0.02), 0x5eead4, 22.55, 1.42, -7.27, 0, 0, 0, 1, 1, 1, 0.3); txt(w, 'PI-RAT SECURE LOCKERS', 21.55, 2.35, -7.24, PI, 0.11, 0x0f766e);
  w.region = 'op_nolock'; for (let i = 0; i < 6; i++) w.slab('g', [0x22c55e, 0x14b8a6, 0xf97316][i % 3], 20.5 + (i % 3) * 0.75, (i / 3 | 0) * 0.42, -7.0, 0.6, 0.4, 0.5, 0.05, { cam: false }); txt(w, 'GROK TOTES', 21.25, 1.05, -7.28, PI, 0.12, 0x0f766e);
  w.region = 'in_s1'; L.push({ x: 21.5, y: 3.4, z, c: 0xc6fff4, i: 6, d: 9 }); }
function buildCurb(w) { w.region = 'out';
  VAN_HOME.forEach(([x, z], i) => { for (const s of [-1, 1]) w.add('l', rbox(0.12, 0.02, 5.0, 0.01), 0x2dd4bf, x + s * 1.45, 0.06, z + 0.4, 0, 0, 0, 1, 1, 1, 0);
    w.add('x', cyl(10), 0x334155, x, 0, z - 2.5, 0, 0, 0, 0.05, 2.1, 0.05); w.add('g', rbox(1.1, 0.75, 0.08, 0.04), 0x0f766e, x, 2.1, z - 2.5); txt(w, i ? 'GROK VAN 2' : 'GROK VAN 1', x, 2.16, z - 2.45, 0, 0.15, 0xffffff); txt(w, 'DELIVERY BAY', x, 1.9, z - 2.45, 0, 0.09, 0x99f6e4); w.solid(x - 0.1, 0, z - 2.6, x + 0.1, 2.4, z - 2.4); });
  // ORDER ONLINE neon sign on the Main St facade (upgrade)
  w.region = 'op_sign'; { const X = 14.5, Y = 4.3, Z = -5.55; w.add('x', rbox(5.2, 1.3, 0.12, 0.08), 0x0f172a, X, Y, Z); txt(w, 'ORDER ONLINE', X, Y + 0.05, Z + 0.09, 0, 0.42, 0x5eead4, 'l', 0.9); txt(w, 'PICKUP · DELIVERY · SHIPPING', X, Y - 0.42, Z + 0.09, 0, 0.14, 0xfacc15, 'l', 0.7); w.add('l', rbox(5.3, 0.05, 0.05, 0.02), 0xff4fa0, X, Y + 0.68, Z + 0.06, 0, 0, 0, 1, 1, 1, 0.8); w.add('l', rbox(5.3, 0.05, 0.05, 0.02), 0xff4fa0, X, Y - 0.68, Z + 0.06, 0, 0, 0, 1, 1, 1, 0.8); }
  w.region = 'out'; }
function buildShipCenter(w, L) { const { x0, z0, x1, z1, dockX, doorX } = WH;
  const b = shell(w, { id: 'wh', name: '📦 Shopsville Ship Center', x0, z0, x1, z1, h: 7.5, wall: 0xf1f5f9, trim: 0x0f766e, roof: 0x334155, floor: 'tile', fc1: 0xd6dbe1, fc2: 0xcbd2da, doors: [{ side: 's', at: dockX, w: 5.4, top: 4.8 }, { side: 's', at: doorX, w: 2.4 }], win: { s: 0, n: 0, e: 4, w: 4 } });
  w.region = 'out'; onSide(w, b, 's', () => { txt(w, 'SHOPSVILLE SHIP CENTER', (x0 + x1) / 2, 6.2, z1 + 0.32, 0, 0.55, 0x0f766e); txt(w, 'GROK ONLINE · SHIPS IN 2 DAYS', (x0 + x1) / 2 + 2, 5.45, z1 + 0.32, 0, 0.24, 0x334155);
    w.add('g', rbox(6.2, 0.35, 0.3, 0.05), 0xfacc15, dockX, 5.0, z1 + 0.2); [-1, 1].forEach((s) => w.add('x', rbox(0.3, 1.1, 0.3, 0.06), 0x111827, dockX + s * 3.0, 0.9, z1 + 0.25)); w.add('g', rbox(1.4, 0.5, 0.06, 0.05), 0x0f766e, doorX, 3.6, z1 + 0.3); txt(w, 'STAFF', doorX, 3.53, z1 + 0.34, 0, 0.18, 0xffffff); });
  grokLogo(w, 86.4, 6.0, z1 + 0.6, 0, 1.1);
  // apron, truck lane markings, bollards, lamps, planters, parked van, trash, bike rack
  K.floor(w, x0, z1 + 0.5, x1, 6.6, 'tile', 0.015, 0x6b7280, 0x636a76, 4); for (let z = z1 + 3; z < 6; z += 3) w.add('l', rbox(0.18, 0.02, 1.6, 0.01), 0xffffff, dockX, 0.04, z, 0, 0, 0, 1, 1, 1, 0);
  K.hazard(w, dockX, z1 + 2.2, 5.2, 2.6);
  for (const x of [dockX - 3.4, dockX + 3.4, doorX - 1.8, doorX + 1.8]) { w.add('g', cyl(12), 0xfacc15, x, 0, z1 + 1.4, 0, 0, 0, 0.14, 1.1, 0.14); w.solid(x - 0.15, 0, z1 + 1.25, x + 0.15, 1.1, z1 + 1.55); }
  K.lampPost(w, x0 + 1.2, 2); K.lampPost(w, x1 - 1.2, 2); K.bench(w, 101.6, z1 + 3.2, -PI / 2, 0x0f766e); K.bush(w, x0 + 0.8, z1 + 6.5, 0.8); K.bush(w, x1 - 0.8, z1 + 6.5, 0.8);
  { const X = 85.2, Z = 4.6; w.slab('g', 0x0f766e, X, 0, Z, 0.5, 3.2, 1.8, 0.08); w.add('g', rbox(0.56, 0.5, 1.9, 0.06), 0xfacc15, X, 3.0, Z); txt(w, 'SHIP', X + 0.3, 2.2, Z, PI / 2, 0.3, 0xffffff); txt(w, 'CENTER', X + 0.3, 1.75, Z, PI / 2, 0.22, 0xffffff); txt(w, 'SHIP', X - 0.3, 2.2, Z, -PI / 2, 0.3, 0xffffff); txt(w, 'CENTER', X - 0.3, 1.75, Z, -PI / 2, 0.22, 0xffffff); } planter(w, doorX + 2.6, z1 + 1.4, 2.0, 0, 0xfacc15); trash(w, doorX - 3.1, z1 + 1.2, 0x0f766e); pallet(w, x0 + 1.6, z1 + 2.2, 0.1, 3); pallet(w, x0 + 1.6, z1 + 4.0, -0.1, 2);
  { const T = w.tf(101, 0, -9, 0); for (let i = 0; i < 4; i++) T.add('x', torus(0.08, 16, PI), 0x94a3b8, -0.9 + i * 0.6, 0, 0, 0, PI / 2, 0, 0.35, 0.5, 0.35); T.solid(-1.2, 0, -0.1, 1.0, 0.5, 0.1); }
  w.region = 'in_wh'; const R = (x, z, ry, n) => rack(w, x, z, ry, n, 5.0, 1), PX = [89.5, 93, 96.5];
  // storage racks (3 double rows) + floor lanes
  for (let r = 0; r < 3; r++) { const z = -41.4 + r * 4.6; R(89.5, z, 0, 8); }
  for (let r = 0; r < 4; r++) w.add('l', rbox(10, 0.02, 0.12, 0.01), 0xfacc15, 89.5, 0.075, -39.1 + r * 4.6 - 2.3, 0, 0, 0, 1, 1, 1, 0);
  rack(w, 102.3, -32.5, PI / 2, 5, 3.6, 1); // supply rack on the east wall (boxes, tape, labels)
  // packing stations (3) facing the conveyor
  for (let i = 0; i < 3; i++) { const px = PX[i], pz = -25.6; const T = w.tf(px, 0, pz, 0); T.slab('g', 0xe2e8f0, 0, 0, 0, 2.4, 0.9, 1.1, 0.05); T.box('m', 0xd6a970, 0, 0.9, 0, 2.5, 0.05, 1.15, 0.02);
    K.monitor(w, T, -0.8, 0.95, -0.35, 0, 0x22d3ee); T.box('x', 0x334155, 0.75, 0.95, -0.3, 0.34, 0.2, 0.3, 0.04); T.box('g', 0xffffff, 0.75, 1.15, -0.22, 0.26, 0.02, 0.14, 0.01);
    T.box('m', 0xc9a06a, 0.1, 0.95, 0.05, 0.7, 0.45, 0.5, 0.03); T.add('x', torus(0.35, 14), 0x8b5a2b, -0.2, 1.0, 0.35, PI / 2, 0, 0, 0.09, 0.09, 0.09); T.box('x', 0x94a3b8, 0.85, 0.95, 0.3, 0.3, 0.04, 0.3, 0.02);
    for (let k = 0; k < 3; k++) T.box('m', 0xd8b98b, -1.45, 0.9 + k * 0.05, 0.25, 0.5, 0.04, 0.45, 0.01); T.add('x', cyl(8), 0x334155, -1.1, 0.9, -0.5, 0, 0, 0, 0.03, 0.9, 0.03); T.add('x', cyl(8), 0x334155, 1.1, 0.9, -0.5, 0, 0, 0, 0.03, 0.9, 0.03);
    T.box('g', 0x0f766e, 0, 1.6, -0.52, 2.4, 0.5, 0.04, 0.02); txt(w, 'PACK ' + (i + 1), px, 1.73, pz - 0.5, 0, 0.16, 0xffffff); w.add('m', rbox(1.4, 0.02, 0.9, 0.01), 0x334155, px, 0.07, -24.4); }
  K.conveyor(w, 93, -22.6, 0, 10); w.solid(88, 0, -23.2, 98, 0.78, -22.0); w.add('g', rbox(0.5, 1.4, 1.4, 0.06), 0x0f766e, 98.4, 0.7, -22.6); w.add('l', sph(8), 0x22c55e, 98.4, 1.5, -22.6, 0, 0, 0, 0.12, 0.12, 0.12, 0.6); w.solid(98.1, 0, -23.3, 98.7, 1.4, -21.9);
  // bulk zone: wrapped pallets stacked 2 high + tote shelving
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const bx = 96.4 + i * 2.0, bz = -33.4 + j * 2.4; pallet(w, bx, bz, 0, 4); w.add('e', rbox(1.25, 1.1, 1.05, 0.08), 0xe0f2fe, bx, 0.75, bz, 0, 0, 0, 1, 1, 1, 0.1); w.solid(bx - 0.65, 0, bz - 0.55, bx + 0.65, 1.3, bz + 0.55); }
  txt(w, 'BULK', 98.4, 0.08, -29.4, 0, 0.3, 0x0f766e); K.hazard(w, 98.4, -32.2, 6.4, 5.6);
  // staging: parcel cages + outbound pallets near the dock door
  const cage = (cx, cz, n) => { for (const [dx, dz] of [[-0.62, -0.47], [0.62, -0.47], [-0.62, 0.47], [0.62, 0.47]]) w.add('x', cyl(8), 0x94a3b8, cx + dx, 0.08, cz + dz, 0, 0, 0, 0.025, 1.75, 0.025); for (const y of [0.1, 1.82]) { w.add('x', rbox(1.28, 0.04, 0.04, 0.01), 0x94a3b8, cx, y, cz - 0.47); w.add('x', rbox(1.28, 0.04, 0.04, 0.01), 0x94a3b8, cx, y, cz + 0.47); w.add('x', rbox(0.04, 0.04, 0.98, 0.01), 0x94a3b8, cx - 0.62, y, cz); w.add('x', rbox(0.04, 0.04, 0.98, 0.01), 0x94a3b8, cx + 0.62, y, cz); }
    for (let k = 0; k < n; k++) K.parcel(w, cx - 0.3 + (k % 2) * 0.6, 0.12 + Math.floor(k / 2) * 0.52, cz + (k % 3 - 1) * 0.12, 0.8); [-0.4, 0.4].forEach((dx) => w.add('m', torus(0.4, 10), 0x111827, cx + dx, 0.06, cz + 0.4, 0, PI / 2, 0, 0.07, 0.07, 0.08)); w.solid(cx - 0.65, 0, cz - 0.5, cx + 0.65, 1.85, cz + 0.5); };
  for (let i = 0; i < 3; i++) cage(85.4 + i * 1.5, -18.0, 4 + (i % 2) * 2); cage(94.2, -18.3, 5); cage(95.7, -18.3, 3);
  for (let k = 0; k < 5; k++) K.parcel(w, 97.4 + (k % 2) * 0.55, Math.floor(k / 2) * 0.5, -19.4 + (k % 3) * 0.2, 0.85); w.solid(97.0, 0, -19.8, 98.1, 1.4, -18.9);
  { const T = w.tf(87.2, 0, -20.6, 0.2); T.slab('x', 0x475569, 0, 0, 0, 1.2, 0.12, 1.2, 0.03); T.box('l', 0x22c55e, 0.55, 0.12, 0.55, 0.12, 0.02, 0.12, 0.01, 0.6); T.add('x', cyl(8), 0x334155, 0.6, 0.12, 0.6, 0, 0, 0, 0.03, 1.0, 0.03); T.box('x', 0x111827, 0.6, 1.1, 0.6, 0.3, 0.2, 0.06, 0.03); txt(w, 'SCALE', 87.4, 0.25, -21.25, PI, 0.09, 0xffffff); }
  pallet(w, 94.5, -19.0, 0, 5); K.hazard(w, dockX, -17.4, 5.0, 1.6);
  w.add('g', rbox(4.6, 0.6, 0.1, 0.05), 0x0f766e, dockX, 5.4, -16.45); txt(w, 'DOCK 1 · OUTBOUND', dockX, 5.32, -16.55, PI, 0.22, 0xffffff);
  // office (NE corner): desk, screens, filing, whiteboard, plant, team photos, employee of the month
  part(w, b, 'x', -35.5, 95.5, 103, [100.5], 0xe0f2f1, 3.2); part(w, b, 'z', 95.5, -44, -35.5, [], 0xe0f2f1, 3.2);
  K.desk(w, 99, -40.5, 0, { top: 0xe5e7eb }); { const T = w.tf(99, 0.85, -40.5, 0); K.monitor(w, T, -0.5, 0, -0.2, 0, 0x22c55e); K.monitor(w, T, 0.5, 0, -0.2, 0, 0xfacc15); } K.chair(w, 99, 0, -41.6, 0, 0x0f766e);
  K.filing(w, 102.4, -42.8, -PI / 2); K.filing(w, 102.4, -41.9, -PI / 2, 0x0f766e); K.potPlant(w, 96.3, 0, -43.2, 0.9, 0x0f766e); K.whiteboard(w, 'x', -43.75, 99, 1.7, 3.2, 1);
  poster(w, 'x', -35.5, 98, 2.0, 1.0, 1.2, 0xbfdbfe, 1, 'SNOWIE'); txt(w, 'EMPLOYEE OF THE MONTH', 98, 2.75, -35.38, 0, 0.09, 0x0f766e); poster(w, 'x', -35.5, 101.6, 2.0, 1.0, 1.2, 0xfde68a, 1, 'TORTY');
  K.sofa(w, 97.2, -37.3, PI / 2, 0x0f766e, 0x5eead4, 14);
  // break nook by the staff door: vending, cooler, table, chairs, pet bowls for visiting pets
  K.vending(w, 102.3, -18.6, -PI / 2, 0xef4444); K.vending(w, 102.3, -20.2, -PI / 2, 0x2563eb); K.cooler(w, 102.4, -21.7); K.tableR(w, 100.4, -26.4, 0.7, 0.75); K.chair(w, 99.5, 0, -26.4, PI / 2, 0xf59e0b); K.chair(w, 101.3, 0, -26.4, -PI / 2, 0x22c55e);
  { const T = w.tf(100.4, 0.76, -26.4, 0.3); T.box('g', 0xffffff, -0.2, 0, 0.1, 0.18, 0.12, 0.18, 0.03); T.box('m', 0xfacc15, 0.2, 0, -0.15, 0.3, 0.03, 0.2, 0.01); T.add('g', rcyl(0.09, 0.14, 0.02, 12), 0xef4444, 0.25, 0, 0.2); }
  w.add('g', rcyl(0.18, 0.08, 0.03, 16), 0xff4fa0, 101.6, 0.06, -23.6); w.add('g', rcyl(0.18, 0.08, 0.03, 16), 0x60a5fa, 102.1, 0.06, -23.6); w.add('m', rbox(1.0, 0.02, 0.6, 0.01), 0xfde68a, 101.85, 0.07, -23.6); txt(w, 'PET BOWLS', 101.85, 0.5, -23.25, PI, 0.08, 0x334155);
  K.whiteboard(w, 'z', 103, -26.4, 1.7, 2.4, -1);
  // wall dressing: big sign, safety posters, clock, extinguishers, pipes, pendants
  wallWord(w, 'z', x0, -30, 5.6, 'PICK · PACK · SHIP', 0.5, 0x0f766e, 1); poster(w, 'z', x0, -36.5, 2.2, 1.0, 1.4, 0xfacc15, 1, 'SAFETY'); poster(w, 'z', x0, -24, 2.2, 1.0, 1.4, 0x86efac, 1, 'LIFT!');
  clockW(w, 'x', z1, 95, 4.4, -1); for (const [ex, ez] of [[84.4, -20.5], [95.2, -36.0], [102.6, -26.5]]) { w.add('g', capsule(10), 0xdc2626, ex, 1.0, ez, 0, 0, 0, 0.16, 0.42, 0.16); }
  K.pipes(w, 'x', z0 + 0.4, x0 + 1, x1 - 1, 6.6); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) pendant(w, 87 + i * 4.6, -40 + j * 12, 0xf8fafc, 6.4);
  // forklift parking + spare pallets + cones + hand trucks
  pallet(w, 85.4, -29.6, 0.1, 4); K.cone3(w, 94.6, -36.0); K.cone3(w, 94.9, -35.4);
  for (let i = 0; i < 2; i++) { const T = w.tf(84.8, 0, -33 + i * 0.9, 0); T.box('x', 0xef4444, 0, 0, 0, 0.5, 0.06, 0.4, 0.02); T.add('x', cyl(8), 0xef4444, -0.2, 0, -0.2, 0, 0, 0, 0.025, 1.3, 0.025); T.add('x', cyl(8), 0xef4444, 0.2, 0, -0.2, 0, 0, 0, 0.025, 1.3, 0.025); T.add('m', torus(0.4, 12), 0x111827, 0, 0.12, -0.25, 0, PI / 2, 0, 0.12, 0.12, 0.2); }
  L.push({ x: 90, y: 6, z: -36, c: 0xf8fafc, i: 18, d: 22 }); L.push({ x: 92, y: 5, z: -22, c: 0xfff3d6, i: 14, d: 18 }); L.push({ x: 99, y: 3, z: -40, c: 0xfff3d6, i: 6, d: 9 }); }
// ---------------------------------------------------------------- Maple Lane
function house(w, h) { w.region = 'out'; const x = h.x, zf = HZ, D = 7, zc = zf + D / 2, W = 9;
  w.slab('g', 0xd6d3d1, x, 0, zc, W + 0.6, 0.3, D + 0.6, 0.06); w.slab('m', h.wall, x, 0.3, zc, W, 3.1, D, 0.08);
  w.add('m', rbox(W + 0.25, 0.22, D + 0.25, 0.04), 0xffffff, x, 3.45, zc); w.add('m', cone(4), h.roof, x, 3.5, zc, 0, PI / 4, 0, (W + 1.2) / 1.414, 2.3, (D + 1.2) / 1.414);
  w.add('m', rbox(0.7, 1.6, 0.7, 0.05), 0x9a3412, x + 2.6, 4.6, zc + 1.2);
  // door + porch + steps + porch light + mat
  w.add('g', rbox(1.1, 2.1, 0.08, 0.03), h.door, x, 1.4, zf - 0.03); w.add('g', sph(8), 0xfacc15, x + 0.38, 1.4, zf - 0.1, 0, 0, 0, 0.05); w.add('l', sph(10), 0xfff1b8, x + 0.9, 2.3, zf - 0.12, 0, 0, 0, 0.12, 0.12, 0.12, 0.6);
  w.slab('g', 0xe7e5e4, x, 0, zf - 0.9, 3.2, 0.3, 1.8, 0.04); w.slab('g', 0xd6d3d1, x, 0, zf - 2.05, 1.6, 0.15, 0.5, 0.03); w.add('m', rbox(3.6, 0.15, 2.1, 0.04), 0xffffff, x, 2.85, zf - 0.95);
  [-1.5, 1.5].forEach((s) => { w.add('m', cyl(10), 0xffffff, x + s, 0.3, zf - 1.75, 0, 0, 0, 0.07, 2.5, 0.07); w.solid(x + s - 0.08, 0, zf - 1.83, x + s + 0.08, 2.8, zf - 1.67); });
  w.add('m', rbox(0.9, 0.02, 0.55, 0.01), 0x8b5a2b, x, 0.31, zf - 0.5);
  // windows with shutters + flower boxes, side windows
  [-2.9, 2.9].forEach((o) => { w.add('m', rbox(1.5, 1.3, 0.06, 0.02), 0xffffff, x + o, 1.9, zf - 0.02); w.add('e', rbox(1.3, 1.1, 0.06, 0.02), 0xbfe9ff, x + o, 1.9, zf - 0.05); w.add('m', rbox(0.04, 1.1, 0.03, 0.01), 0xffffff, x + o, 1.9, zf - 0.09);
    [-1, 1].forEach((s) => w.add('g', rbox(0.35, 1.3, 0.05, 0.02), h.door, x + o + s * 0.95, 1.9, zf - 0.04)); w.add('m', rbox(1.4, 0.25, 0.3, 0.03), 0x9a6a3e, x + o, 1.15, zf - 0.15);
    for (let i = 0; i < 5; i++) w.add('g', sph(8), pick([0xff6fb5, 0xfacc15, 0xf97316, 0xffffff]), x + o - 0.55 + i * 0.27, 1.34, zf - 0.17, 0, 0, 0, 0.1); });
  [-1, 1].forEach((s) => [1.8, 5.2].forEach((dz) => { w.add('e', rbox(0.06, 1.1, 1.2, 0.02), 0xbfe9ff, x + s * (W / 2 + 0.01), 1.9, zf + dz); w.add('m', rbox(0.04, 1.3, 1.4, 0.02), 0xffffff, x + s * (W / 2 - 0.005), 1.9, zf + dz); }));
  // walk, mailbox with number, picket fence (gap at the walk), bushes, flower bed, tree out back
  w.slab('g', 0xd6d3d1, x, 0, zf - 3.3, 1.3, 0.06, 2.2, 0.02, { floor: true });
  { const mx = x + 1.6, mz = 117.6; w.add('x', cyl(8), 0x6b4423, mx, 0, mz, 0, 0, 0, 0.05, 1.05, 0.05); w.add('g', rbox(0.34, 0.32, 0.55, 0.12), 0x1d4ed8, mx, 1.15, mz); w.add('g', rbox(0.03, 0.18, 0.1, 0.01), 0xef4444, mx + 0.19, 1.3, mz + 0.1); txt(w, h.n.split(' ')[0], mx - 0.18, 1.15, mz, -PI / 2, 0.12, 0xffffff); w.solid(mx - 0.2, 0, mz - 0.3, mx + 0.2, 1.3, mz + 0.3); }
  K.fenceRun(w, 'x', 117.8, x - 4.8, x - 0.9, 0.9, 0xffffff); K.fenceRun(w, 'x', 117.8, x + 0.9, x + 4.8, 0.9, 0xffffff);
  K.bush(w, x - 3.3, zf - 0.8, 0.8); K.bush(w, x + 3.3, zf - 0.8, 0.8); K.flowerBed(w, x - 4.3, 118.4, x - 1.4, 119 - 0.25); K.tree(w, x + 3, zf + D + 3, 1.0, h.x % 2 ? 1 : 0);
  txt(w, h.fam.toUpperCase(), x, 3.0, zf - 2.04, PI, 0.14, 0x334155);
  // little yard props per family
  if (h.dog) { const T = w.tf(x - 3.4, 0, zf + D + 1.8, 0.4); T.slab('m', 0xb45309, 0, 0, 0, 1.1, 0.8, 1.2, 0.05); T.add('m', cone(4), 0x7c2d12, 0, 0.8, 0, 0, PI / 4, 0, 0.9, 0.5, 0.95); T.box('x', 0x1f2937, 0, 0.1, 0.61, 0.5, 0.5, 0.02, 0.04); txt(w, 'CANDY', x - 3.4, 0.95, zf + D + 1.1, PI, 0.1, 0xffffff); w.add('g', rcyl(0.18, 0.08, 0.03, 16), 0xff4fa0, x - 2.2, 0.02, zf - 2.6); }
  else if (h.x === -45 || h.x === 45) K.bench(w, x - 3.2, zf - 2.6, 0, 0x9a3412); else { w.add('x', torus(0.12, 18), 0x111827, x - 3.3, 0.35, zf - 2.5, 0, PI / 2, 0, 0.32, 0.32, 0.4); w.add('x', torus(0.12, 18), 0x111827, x - 2.5, 0.35, zf - 2.5, 0, PI / 2, 0, 0.32, 0.32, 0.4); w.add('g', cyl(6), pick([0xef4444, 0x22c55e, 0x3b82f6]), x - 2.9, 0.5, zf - 2.5, 0, 0, PI / 2, 0.04, 0.8, 0.04); }
  h.porch = [x, zf - 1.2]; h.curb = [x + 0.6, 114.0]; }
function mapleLane(w) { w.region = 'out'; { const X = -98, Z = 118; w.add('x', cyl(10), 0x334155, X, 0, Z, 0, 0, 0, 0.07, 2.4, 0.07); w.add('g', rbox(2.6, 0.5, 0.08, 0.04), 0x15803d, X, 2.5, Z); txt(w, 'MAPLE LANE', X, 2.44, Z - 0.05, PI, 0.24, 0xffffff); }
  for (const x of [-60, -30, 0, 30, 60]) K.lampPost(w, x, 117.6); }
// ---------------------------------------------------------------- runtime meshes
function meshFrom(Builder, compact, MATS, parts) { const g = new THREE.Group(); for (const k in parts) { const b = parts[k]; if (!b.parts.length) continue; const m = new THREE.Mesh(compact(b.build(), k), MATS[k]); m.castShadow = k !== 'l' && k !== 'e'; m.receiveShadow = true; g.add(m); } return g; }
export function vanProto(Builder, P, compact, MATS, col = 0x0f766e, word) { const b = { f: new Builder(), g: new Builder(), m: new Builder(), l: new Builder(), x: new Builder(), e: new Builder() };
  b.g.add(P.rbox, 0xffffff, 0, 1.35, -0.5, 0, 0, 0, 2.1, 2.1, 3.8); b.g.add(P.rbox, col, 0, 1.0, 1.75, 0, 0, 0, 2.05, 1.4, 1.2); b.e.add(P.rboxS, 0xbfe9ff, 0, 1.55, 2.2, 0.35, 0, 0, 1.85, 0.7, 0.1);
  [-1, 1].forEach((s) => { b.g.add(P.rboxS, col, s * 1.06, 1.4, -0.6, 0, 0, 0, 0.02, 0.7, 3.2); b.e.add(P.rboxS, 0xbfe9ff, s * 1.04, 1.6, 1.55, 0, 0, 0, 0.04, 0.5, 0.8); });
  [-1, 1].forEach((s) => [-1.6, 1.5].forEach((z) => b.m.add(P.torus, 0x111827, s * 0.95, 0.38, z, 0, PI / 2, 0, 0.3, 0.3, 0.42))); b.l.add(P.sphereLo, 0xfff7c2, 0.7, 0.85, 2.36, 0, 0, 0, 0.13, 0.1, 0.04, 0.5); b.l.add(P.sphereLo, 0xfff7c2, -0.7, 0.85, 2.36, 0, 0, 0, 0.13, 0.1, 0.04, 0.5);
  b.l.add(P.sphereLo, 0xfacc15, 1.08, 2.0, -0.6, 0, 0, 0, 0.02, 0.32, 0.32, 0.4); b.l.add(P.sphereLo, 0xfacc15, -1.08, 2.0, -0.6, 0, 0, 0, 0.02, 0.32, 0.32, 0.4); b.g.add(P.rboxS, 0x334155, 0, 0.45, -2.45, 0, 0, 0, 2.0, 0.25, 0.12);
  return meshFrom(Builder, compact, MATS, b); }
