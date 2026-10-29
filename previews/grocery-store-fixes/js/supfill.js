// Grok Grocery Tycoon - detail pass for the supplier buildings (DC, Ratita, Tortuga, Ruffsources, Town Hall, Fernhill Farm, Grok Goods Lab)
import * as K from './kit.js?v=ggt21mp';
import { rbox } from './world.js?v=ggt21mp';
import { PI, R, pick, BRIGHT, rcyl, sph, cyl, txt, poster, pendant, rack, pallet, produceCrate } from './art.js?v=ggt21mp';
const bin = (w, x, z, col, ry = 0) => { const T = w.tf(x, 0, z, ry); T.slab('m', 0x8b5a2b, 0, 0, 0, 1.8, 0.75, 1.1, 0.05); T.box('m', 0x5b3a1e, 0, 0.62, 0, 1.6, 0.06, 0.9, 0.02); for (let i = 0; i < 18; i++) T.add('g', sph(8), col, -0.65 + (i % 6) * 0.26, 0.74 + (i % 3 === 1 ? 0.06 : 0) + Math.floor(i / 12) * 0.12, -0.28 + Math.floor((i % 12) / 6) * 0.42 + (Math.floor(i / 12) ? 0.2 : 0), 0, 0, 0, 0.13); T.box('g', 0xffffff, 0, 0.32, 0.56, 0.6, 0.3, 0.02, 0.01); };
const barrel = (w, x, z, col) => { w.add('m', rcyl(0.42, 0.9, 0.06, 16), 0x92400e, x, 0, z); w.add('x', rcyl(0.44, 0.06, 0.02, 16), 0x334155, x, 0.2, z); w.add('x', rcyl(0.44, 0.06, 0.02, 16), 0x334155, x, 0.7, z); for (let i = 0; i < 7; i++) w.add('g', sph(8), col, x + Math.cos(i) * 0.22 * (i % 2 ? 1 : 0.4), 0.95, z + Math.sin(i) * 0.22 * (i % 2 ? 1 : 0.4), 0, 0, 0, 0.12); w.solid(x - 0.42, 0, z - 0.42, x + 0.42, 1.0, z + 0.42, { cam: false }); };
const chest = (w, x, z, ry = 0) => { const T = w.tf(x, 0, z, ry); T.slab('m', 0x14b8a6, 0, 0, 0, 1.8, 0.85, 0.9, 0.06); T.box('e', 0xcfefff, 0, 0.85, 0, 1.7, 0.04, 0.8, 0.02); for (let i = 0; i < 8; i++) T.box('g', pick([0x60a5fa, 0x22d3ee, 0xa78bfa, 0xf472b6]), -0.65 + (i % 4) * 0.43, 0.6, -0.18 + Math.floor(i / 4) * 0.36, 0.36, 0.22, 0.3, 0.03); T.box('l', 0x22c55e, 0.7, 0.6, 0.46, 0.12, 0.06, 0.01, 0.01); };
const flag = (w, x, z, col) => { w.add('x', cyl(8), 0xd4af37, x, 0, z, 0, 0, 0, 0.04, 2.6, 0.04); w.add('x', sph(8), 0xd4af37, x, 2.62, z, 0, 0, 0, 0.07); w.add('f', rbox(0.9, 0.6, 0.02, 0.01), col, x + 0.47, 2.2, z); w.add('m', rcyl(0.22, 0.08, 0.02, 14), 0x334155, x, 0, z); w.solid(x - 0.2, 0, z - 0.2, x + 0.2, 2.6, z + 0.2, { cam: false }); };
const sack = (w, x, y, z, ry) => w.add('f', rbox(0.62, 0.26, 0.42, 0.1, 1), 0xf5e6c8, x, y + 0.13, z, 0, ry, 0);
function dc(w) { w.region = 'in_dc';
  // dock signs + lane markings + empty-for-now racks along both long walls
  [52, 66].forEach((x, i) => { txt(w, 'DOCK ' + (i + 1), x, 5.3, -47.5, 0, 0.42, 0x16a34a); w.add('l', sph(8), i ? 0xef4444 : 0x22c55e, x + 3.0, 4.9, -47.75, 0, 0, 0, 0.16, 0.16, 0.06, 0.6); K.hazard(w, x, -46.6, 4.6, 1.4); });
  [49, 75].forEach((x) => w.add('m', rbox(0.14, 0.012, 22, 0.005), 0xfacc15, x, 0.012, -35));
  for (let i = 0; i < 6; i++) w.add('m', rbox(1.6, 0.012, 0.14, 0.005), 0xffffff, 58 + (i % 3) * 4, 0.012, -46 + Math.floor(i / 3) * 0.01);
  rack(w, 78.6, -36, PI / 2, 12, 4.2); rack(w, 37.6, -36, PI / 2, 12, 4.2);
  pallet(w, 77.6, -27.4, 0, 6); pallet(w, 77.6, -25.6, 0.1, 4); pallet(w, 39, -26.5, -0.1, 6); K.cone3(w, 75.4, -44); K.cone3(w, 40.6, -44);
  poster(w, 'z', 79.75, -24.5, 2.6, 2.4, 1.2, 0x16a34a, -1, 'SAFETY FIRST', 0xffffff); poster(w, 'z', 36.25, -24.5, 2.6, 2.4, 1.2, 0xfacc15, 1, '0 DAYS LOST', 0x111827);
  w.lights.push({ x: 72, y: 6, z: -36, c: 0xfff7e6, i: 10, d: 18 }); }
function ratita(w) { w.region = 'in_ratita';
  { const T = w.tf(-13.5, 0, 42.3, PI); T.slab('m', 0xff4fa0, 0, 0, 0, 4, 2.0, 0.6, 0.04); for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++) T.box('g', pick([0xfacc15, 0xff8fcb, 0x60a5fa, 0xffffff]), -1.75 + k * 0.44, 0.25 + r * 0.6, 0.12, 0.34, 0.42, 0.24, 0.03); txt(w, 'SQUEAKY SNACKS', -13.5, 2.3, 41.95, PI, 0.2, 0xff4fa0); }
  { const T = w.tf(-11.6, 0, 33, -PI / 2); T.slab('m', 0xfbcfe8, 0, 0, 0, 3.6, 1.1, 0.5, 0.04); for (let k = 0; k < 8; k++) T.add('g', sph(10), pick([0xfacc15, 0xfde047]), -1.5 + k * 0.42, 1.25, 0, 0, k, 0, 0.18, 0.13, 0.18); txt(w, 'CHEESE OF THE WEEK', -11.85, 1.75, 33, -PI / 2, 0.14, 0x9d174d); }
  K.robotArm(w, -3.3, 30, 0xff4fa0); K.robotArm(w, -3.3, 36, 0xff8fcb); K.hazard(w, -5, 33, 2.4, 12.6);
  pallet(w, -4.2, 24.4, 0, 6, 0xfbcfe8); pallet(w, -6.4, 24.4, 0.1, 4, 0xfacc15); K.pipes(w, 'z', -2.2, 25, 42, 4.2);
  w.lights.push({ x: -17, y: 3.4, z: 40, c: 0xffd6ec, i: 8, d: 10 }); }
function tortuga(w) { w.region = 'in_tortuga';
  K.labBench(w, 10, 35, 0, 4);
  chest(w, 19.6, 26.4); chest(w, 22.2, 26.4); txt(w, 'FREEZER TEST LAB', 20.9, 1.35, 26.88, 0, 0.14, 0x0f766e);
  pallet(w, 6.2, 37.6, 0, 6, 0x5eead4); pallet(w, 18.2, 36.6, 0, 6, 0x0ea5e9); pallet(w, 18.2, 39, 0.1, 4, 0xf97316);
  for (let i = 0; i < 12; i++) w.add('g', rbox(0.6, 0.38, 0.42, 0.05), [0xf97316, 0x0f766e, 0x2dd4bf][(i + Math.floor(i / 3)) % 3], 13.6 + (i % 3) * 0.64, 0.19 + Math.floor(i / 3) * 0.4, 30); w.solid(13.25, 0, 29.75, 15.25, 1.6, 30.25, { cam: false }); txt(w, 'COLD TOTES', 14.25, 1.85, 30.25, 0, 0.13, 0x0f766e);
  w.add('m', rcyl(1.5, 0.02, 0.01, 32), 0x0f766e, 10, 0.012, 31.6); w.add('m', rcyl(1.1, 0.02, 0.01, 32), 0x22c55e, 10, 0.018, 31.6); for (let i = 0; i < 6; i++) w.add('m', rcyl(0.28, 0.02, 0.01, 6), 0x14532d, 10 + Math.cos(i * PI / 3) * 0.62, 0.024, 31.6 + Math.sin(i * PI / 3) * 0.62); K.whiteboard(w, 'z', 25.9, 30.2, 2.0, 2.8, -1); K.hazard(w, 20.75, 32.2, 9.5, 1.0);
  pendant(w, 10, 35, 0x0f766e, 4.4); w.lights.push({ x: 20, y: 3.4, z: 27, c: 0xe0fff8, i: 8, d: 10 }); }
function ruff(w) { w.region = 'in_ruff';
  K.sofa(w, -62, 28, -PI / 2, 0xff8a3d, 0xfdba74); K.tableR(w, -76, 31, 0.6, 0.5, 0xfde68a); for (let i = 0; i < 3; i++) w.add('m', rbox(0.3, 0.02, 0.4, 0.01), pick([0xffffff, 0xfef3c7, 0xe0f2fe]), -76.2 + i * 0.2, 0.52, 31, 0, i * 0.4, 0);
  K.plant(w, -78.8, 31.5, 1.0); K.cubicle(w, -76, 38, 0, 0xfdba74); K.vending(w, -61.2, 41.6, -PI / 2, 0xff8a3d); K.whiteboard(w, 'x', 42.8, -66, 2.0, 3, -1);
  w.add('f', rbox(0.6, 0.08, 0.6, 0.05), 0x8b5cf6, -63, 0.04, 36.5); w.add('m', rcyl(0.2, 0.08, 0.02, 14), 0x94a3b8, -63, 0, 35.5); }
function hall(w) { w.region = 'in_hall';
  flag(w, -50.5, 30.4, 0x16a34a); flag(w, -42.4, 30.4, 0x2563eb); K.rug(w, -46, 25.8, 0, 2.4, 4.2, 0x1e3a8a, 0xfacc15);
  { const T = w.tf(-40.2, 0, 27.6, 0); T.slab('m', 0x7c4a1e, 0, 0, 0, 2.2, 0.85, 1.4, 0.05); T.box('g', 0x86efac, 0, 0.85, 0, 2.0, 0.04, 1.2, 0.02); for (let i = 0; i < 10; i++) T.box('g', pick(BRIGHT), -0.8 + (i % 5) * 0.4, 0.89, -0.35 + Math.floor(i / 5) * 0.7, 0.24, 0.1 + R() * 0.3, 0.24, 0.02); txt(w, 'SHOPSVILLE', -40.2, 1.25, 28.32, 0, 0.13, 0x1e3a8a); }
  poster(w, 'z', -55.75, 29.5, 2.2, 2.0, 1.3, 0x2563eb, 1, 'TOWN NEWS', 0xffffff); poster(w, 'z', -36.25, 29.5, 2.2, 2.0, 1.3, 0x16a34a, -1, 'SHOP LOCAL', 0xffffff);
  K.desk(w, -53.6, 41.6, PI, { top: 0xccfbf1 }); { const T = w.tf(-53.6, 0.85, 41.6, PI); K.monitor(w, T, 0, 0, 0.2, 0, 0x16a34a); } K.potPlant(w, -55.3, 0, 34, 0.8, 0x0f766e);
  K.desk(w, -42.6, 41.6, PI, { top: 0xfde68a }); { const T = w.tf(-42.6, 0.85, 41.6, PI); K.monitor(w, T, 0, 0, 0.2, 0, 0xfacc15); } K.potPlant(w, -45.3, 0, 34, 0.8, 0x7c4a1e);
  }
function farm(w) { w.region = 'in_farm';
  [[43, 37, 0xdc2626], [45.4, 37, 0x16a34a], [56.6, 37, 0xf97316], [59, 37, 0xfacc15]].forEach(([x, z, c]) => bin(w, x, z, c)); w.solid(42.1, 0, 36.45, 46.3, 0.8, 37.55); w.solid(55.7, 0, 36.45, 59.9, 0.8, 37.55);
  barrel(w, 49.5, 38.6, 0xdc2626); barrel(w, 54.5, 38.6, 0x84cc16); { const T = w.tf(52, 0, 39.4, 0); T.box('m', 0xb45309, 0, 0, 0, 1.2, 0.14, 1.0, 0.02); for (let i = 0; i < 6; i++) sack(w, 51.7 + (i % 2) * 0.62, 0.14 + Math.floor(i / 2) * 0.26, 39.4, (i % 3) * 0.1); txt(w, 'FLOUR', 52, 1.15, 39.95, 0, 0.12, 0x7c4a1e); w.solid(51.4, 0, 38.9, 52.6, 0.95, 39.9, { cam: false }); }
  for (let i = 0; i < 9; i++) { const r = 0.2 + R() * 0.1; w.add('g', sph(10), pick([0xf97316, 0xea580c]), 44 + (i % 3) * 0.5 + (i > 5 ? 0.25 : 0), r * 0.8 + Math.floor(i / 6) * 0.3, 26 + Math.floor((i % 6) / 3) * 0.5, 0, i, 0, r, r * 0.8, r); } w.solid(43.7, 0, 25.7, 45.6, 0.8, 27.1, { cam: false });
  for (let i = 0; i < 3; i++) produceCrate(w, 56 + i * 0.95, 0, 25, pick([0xdc2626, 0x7c3aed, 0x16a34a])); w.solid(55.5, 0, 24.7, 58.4, 0.5, 25.3, { cam: false });
  poster(w, 'z', 38.25, 37, 2.2, 2.4, 1.3, 0x14532d, 1, "TODAY'S HARVEST", 0xfef3c7); pendant(w, 44.2, 37, 0xfde68a, 4.8); pendant(w, 57.8, 37, 0xfde68a, 4.8);
  w.lights.push({ x: 51, y: 4, z: 39, c: 0xffe8c2, i: 8, d: 12 }); }
function lab(w) { w.region = 'in_lab';
  K.labBench(w, -11, 75.6, 0, 4);
  { const T = w.tf(-6.4, 0, 77.2, PI); T.slab('x', 0xe5e7eb, 0, 0, 0, 1.0, 2.0, 0.8, 0.05); T.box('x', 0x94a3b8, 0.4, 0.9, 0.41, 0.04, 0.6, 0.03, 0.01); txt(w, 'TEST FRIDGE', -6.4, 2.15, 76.78, PI, 0.11, 0x7c3aed); }
  for (let i = 0; i < 3; i++) K.stool(w, -18.2 + i * 1.2, 73.6, 0x7c3aed); { w.slab('m', 0xffffff, -17, 0, 74.6, 4.2, 1.0, 0.6, 0.04); for (let i = 0; i < 6; i++) w.add('g', rbox(0.24, 0.3, 0.16, 0.03), i % 2 ? 0x7c3aed : 0xfacc15, -18.6 + i * 0.62, 1.15, 74.6); txt(w, 'TASTE TEST', -17, 1.55, 74.28, PI, 0.13, 0x7c3aed); }
  K.potPlant(w, -23, 0, 61, 0.9, 0x7c3aed); pallet(w, -21.6, 62.6, 0, 4, 0x7c3aed); 
  w.lights.push({ x: -12, y: 3.4, z: 75, c: 0xf3e8ff, i: 8, d: 10 }); }
export function supplierDetail(w) { dc(w); ratita(w); tortuga(w); ruff(w); hall(w); farm(w); lab(w); }
