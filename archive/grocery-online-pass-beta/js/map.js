// Grok Grocery Tycoon - the town of Shopsville: your supermarkets, Bargain Bonanza, the distribution center, the suppliers
// (Fernhill Farm Co-op, Ratita Industries, Tortuga Tech), Ruffsources Staffing, Town Hall + Health Dept, the Grok Goods Lab
// and Shopsville Park. Every building is walk-in.
import * as THREE from 'three';
import * as K from './kit.js?v=ggt17';
import { rbox } from './world.js?v=ggt17';
import { shell, part, onSide } from './bld.js?v=ggt17';
import { STORES } from './data.js?v=ggt17';
import { storeBuilding } from './stores.js?v=ggt17';
import { supplierDetail } from './supfill.js?v=ggt17';
import { buildOnline, treeOk } from './online.js?v=ggt17';
import { PI, R, pick, BRIGHT, rcyl, lathe, sph, cyl, cone, torus, capsule, tube, star, heart, blobGeo, wedge, txt, poster, wallWord, clockW, pendant, rack, pallet, cartStatic, planter, awning, trash, bags, produceCrate, grokLogo } from './art.js?v=ggt17';
export const SPOTS = {}; export const GEOM = {};
export const ENV = { sunDir: [0.5, 0.8, 0.32], sunColor: 0xfff3e0, sunI: 2.5, hemiSky: 0xdaf0ff, hemiGround: 0x7a9a5a, hemiI: 0.62, skyTop: 0x3b8beb, skyMid: 0xb3dcff, skyBot: 0xeef8ff, fog: 0xdcefff, fogD: 0.0036, exposure: 1.0, envI: 0.85, bloomT: 1.05, bloomS: 0.32, sunDisc: 1, stars: 0 };
export const ROADS = { ew: [-56, 14, 50, 110], ns: [-30, 30], x0: -104, x1: 104, z0: -61, z1: 115 };
function forklift(w, x, z, ry, col = 0xfacc15) { const T = w.tf(x, 0, z, ry); T.box('g', col, 0, 0.25, 0, 1.1, 0.8, 1.8, 0.12); T.box('g', 0x111827, 0, 1.05, 0.3, 1.0, 0.08, 1.0, 0.04); [-0.45, 0.45].forEach((a) => { T.add('x', cyl(8), 0x334155, a, 1.05, -0.2, 0, 0, 0, 0.04, 1.1, 0.04); T.add('x', cyl(8), 0x334155, a, 1.05, 0.75, 0, 0, 0, 0.04, 1.1, 0.04); });
  T.box('x', 0x334155, 0, 0, -1.05, 0.9, 2.6, 0.12, 0.03); [-0.3, 0.3].forEach((a) => T.box('x', 0x64748b, a, 0.08, -1.55, 0.12, 0.06, 1.0, 0.02)); T.add('f', capsule(8), 0x111827, 0, 0.95, 0.3, 0, 0, 0, 0.3, 0.3, 0.3); [-1, 1].forEach((s) => [-0.55, 0.6].forEach((b) => T.add('m', torus(0.45, 16), 0x111827, s * 0.58, 0.28, b, 0, PI / 2, 0, 0.26, 0.26, 0.3))); T.solid(-0.6, 0, -1.6, 0.6, 2.2, 0.95); }
function bigTruck(w, x, z, ry, col = 0x16a34a) { const T = w.tf(x, 0, z, ry); T.box('g', 0xffffff, 0, 0.6, -1.2, 2.5, 2.9, 6.5, 0.15); T.box('g', col, 0, 1.5, 2.9 - 0.8, 2.4, 1.9, 1.9, 0.3); T.box('e', 0xbfe9ff, 0, 2.3, 3.7, 2.2, 0.8, 0.1, 0.05); T.box('g', col, 1.27, 1.6, -1.2, 0.02, 1.2, 4.5, 0.01);
  [-1, 1].forEach((s) => [-3.5, -2.3, 2.6].forEach((b) => T.add('m', torus(0.45, 16), 0x111827, s * 1.1, 0.5, b, 0, PI / 2, 0, 0.45, 0.45, 0.4))); T.solid(-1.3, 0, -4.5, 1.3, 3.5, 3.8); }
function hay(w, x, z, ry = 0) { w.add('f', rcyl(0.6, 1.2, 0.15, 18), 0xe6c35c, x, 0.6, z, 0, ry, PI / 2); w.solid(x - 0.6, 0, z - 0.6, x + 0.6, 1.2, z + 0.6, { cam: false }); }
function chicken(w, x, z, ry) { const T = w.tf(x, 0, z, ry); T.add('g', sph(10), 0xffffff, 0, 0.3, 0, 0, 0, 0, 0.22, 0.2, 0.28); T.add('g', sph(10), 0xffffff, 0, 0.5, 0.18, 0, 0, 0, 0.12); T.add('g', sph(6), 0xef4444, 0, 0.64, 0.18, 0, 0, 0, 0.05, 0.06, 0.03); T.add('g', cone(6), 0xf59e0b, 0, 0.5, 0.31, PI / 2, 0, 0, 0.03, 0.08, 0.03); }
function counter(w, x0, x1, z, col = 0xffffff, top = 0x1f2937, h = 1.0) { w.slab('m', col, (x0 + x1) / 2, 0, z, x1 - x0, h, 0.8, 0.05); w.add('g', rbox(x1 - x0 + 0.1, 0.06, 0.9, 0.02), top, (x0 + x1) / 2, h + 0.03, z); }
function seats(w, x, z, n, col, ry = 0) { for (let i = 0; i < n; i++) { const T = w.tf(x + (ry ? 0 : i * 0.7), 0, z + (ry ? i * 0.7 : 0), ry); T.box('f', col, 0, 0.42, 0, 0.6, 0.12, 0.55, 0.05); T.box('f', col, 0, 0.5, -0.24, 0.6, 0.55, 0.08, 0.05); T.box('x', 0x94a3b8, 0, 0, 0, 0.5, 0.42, 0.04, 0.02); } w.solid(x - 0.35, 0, z - 0.35, x + (ry ? 0.35 : n * 0.7 - 0.35), 0.6, z + (ry ? n * 0.7 - 0.35 : 0.35), { cam: false }); }
export function buildMap(w) {
  K.propSeed && K.propSeed(777); const L = w.lights; w.region = 'out';
  // ground
  { const N = 90, S = 340; const g = new THREE.PlaneGeometry(S, S, N, N); g.rotateX(-PI / 2); g.translate(0, 0, 27); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.max(Math.abs(x) / 120, z < 27 ? (27 - z) / 130 : (z - 27) / 110); const hill = r > 1 ? Math.pow(r - 1, 1.4) * 70 * (0.7 + 0.3 * Math.sin(x * 0.05) * Math.cos(z * 0.04)) : 0; p.setY(i, hill - 0.02); } g.computeVertexNormals();
    w.addFn('m', g, (c, x, y, z) => { const n = Math.sin(x * 0.19) * Math.cos(z * 0.15) * 0.5 + Math.sin(x * 0.05 + z * 0.07) * 0.5; c.setHSL(0.27 + n * 0.025, 0.52, 0.42 + n * 0.05 + Math.min(0.08, y * 0.004)); }, 0, 0, 0); w.solid(-170, -3, -150, 170, 0, 200, { floor: true }); }
  // roads: asphalt, dashed centre lines, sidewalks, crosswalks
  { const RW = 10, { ew, ns, x0, x1, z0, z1 } = ROADS;
    ew.forEach((z) => { w.add('m', rbox(x1 - x0, 0.06, RW, 0.02, 1), 0x3f4652, 0, 0.03, z); for (let x = x0 + 2; x < x1; x += 5) if (!ns.some((n) => Math.abs(x - n) < 6)) w.add('l', rbox(2.4, 0.02, 0.16, 0.01, 1), 0xfacc15, x, 0.07, z, 0, 0, 0, 1, 1, 1, 0);
      [-1, 1].forEach((s) => w.add('g', rbox(x1 - x0, 0.14, 2.2, 0.04, 1), 0xd6d3d1, 0, 0.07, z + s * (RW / 2 + 1.1))); });
    ns.forEach((x) => { w.add('m', rbox(RW, 0.065, z1 - z0, 0.02, 1), 0x3f4652, x, 0.032, (z0 + z1) / 2); for (let z = z0 + 2; z < z1; z += 5) if (!ew.some((e) => Math.abs(z - e) < 6)) w.add('l', rbox(0.16, 0.02, 2.4, 0.01, 1), 0xfacc15, x, 0.075, z, 0, 0, 0, 1, 1, 1, 0);
      ew.forEach((z) => { for (let i = 0; i < 6; i++) [-1, 1].forEach((s) => { w.add('l', rbox(0.6, 0.02, 2.2, 0.01, 1), 0xffffff, x - 3.6 + i * 1.45, 0.08, z + s * 6.4, 0, 0, 0, 1, 1, 1, 0); }); }); });
    for (let x = -96; x <= 96; x += 16) [14 - 7, 14 + 7, 50 - 7, 50 + 7].forEach((z, i) => { if (ns.some((n) => Math.abs(x - n) < 6)) return; K.lampPost(w, x, z); }); }
  // town sign + Shopsville Park (pond, fountain, playground, food truck)
  { const X = 14, Z = 80; w.add('e', rcyl(9, 0.3, 0.2, 40), 0x7dd3fc, X - 4, 0.02, Z + 6); w.add('g', torus(0.12, 40), 0xd6d3d1, X - 4, 0.15, Z + 6, PI / 2, 0, 0, 9.1, 9.1, 3); w.solid(X - 12.5, 0, Z - 1.5, X + 4.5, 0.5, Z + 13.5, { nofloor: true });
    for (let i = 0; i < 4; i++) w.add('g', sph(12), 0xffffff, X - 6 + i * 2, 0.3, Z + 4 + (i % 2) * 3, 0, i, 0, 0.3, 0.25, 0.4); w.add('g', rcyl(2.2, 0.7, 0.15, 32), 0xe7e5e4, X + 8, 0, Z - 8); w.solid(X + 6, 0, Z - 10, X + 10, 0.7, Z - 6); w.add('e', rcyl(1.9, 0.5, 0.1, 32), 0x67e8f9, X + 8, 0.25, Z - 8); w.add('g', cyl(14), 0xd6d3d1, X + 8, 0.6, Z - 8, 0, 0, 0, 0.25, 1.2, 0.25); w.add('g', sph(14), 0xef4444, X + 8, 2.0, Z - 8, 0, 0, 0, 0.5); w.add('g', capsule(8), 0x7c4a1e, X + 8, 2.55, Z - 8, 0, 0, 0.2, 0.06, 0.3, 0.06); SPOTS.fountain = [X + 8, Z - 5.4];
    // playground
    { const px = X + 3, pz = Z + 20; w.add('x', cyl(10), 0xef4444, px - 1.5, 0, pz, 0, 0, 0, 0.08, 2.6, 0.08); w.add('x', cyl(10), 0xef4444, px + 1.5, 0, pz, 0, 0, 0, 0.08, 2.6, 0.08); w.add('x', cyl(10), 0xef4444, px, 2.6, pz, 0, 0, PI / 2, 0.08, 3.1, 0.08); [-0.7, 0.7].forEach((a) => { w.add('x', cyl(6), 0x94a3b8, px + a, 1.6, pz, 0, 0, 0, 0.015, 2.0, 0.015); w.add('g', rbox(0.6, 0.06, 0.3, 0.02), 0x3b82f6, px + a, 0.6, pz); });
      w.slab('g', 0xfacc15, px + 5, 0, pz, 1.6, 1.6, 1.6, 0.1); w.add('g', rbox(0.9, 0.08, 3, 0.04), 0x22c55e, px + 5, 0.85, pz + 2.1, -0.5, 0, 0); w.solid(px - 1.7, 0, pz - 0.2, px - 1.3, 2.6, pz + 0.2); w.solid(px + 1.3, 0, pz - 0.2, px + 1.7, 2.6, pz + 0.2); }
    // food truck
    { const T = w.tf(X + 12, 0, Z + 6, -PI / 2); T.box('g', 0xff4fa0, 0, 0.5, 0, 2.4, 2.6, 5, 0.3); T.box('g', 0xfef3c7, 1.21, 1.6, 0.3, 0.02, 1.0, 2.6, 0.02); T.box('g', 0xffffff, 1.5, 1.45, 0.3, 0.7, 0.06, 2.8, 0.02); [-1, 1].forEach((s) => [-1.6, 1.6].forEach((b) => T.add('m', torus(0.45, 16), 0x111827, s * 1.1, 0.45, b, 0, PI / 2, 0, 0.42, 0.42, 0.35))); T.add('l', star(), 0xfacc15, 1.25, 2.6, 0.3, 0, PI / 2, 0, 0.4, 0.4, 0.2, 0.3); T.solid(-1.25, 0, -2.5, 1.25, 3.2, 2.5); SPOTS.foodtruck = [X + 9.6, Z + 6.3]; txt(w, 'GROK TACOS', X + 10.7, 2.6, Z + 6.3, PI / 2, 0.22, 0xffffff); }
    [[X - 14, Z - 6], [X + 18, Z - 2], [X - 15, Z + 18], [X + 18, Z + 16], [X - 6, Z + 24], [X + 12, Z + 26]].forEach(([x, z], i) => K.tree(w, x, z, 1.1 + (i % 3) * 0.2, i % 3 === 0 ? 1 : 0));
    [[X - 2, Z - 6, 0], [X + 3, Z - 3, PI / 2], [X - 13, Z + 2, PI / 2]].forEach(([x, z, r]) => K.bench(w, x, z, r, 0x16a34a)); K.flowerBed(w, X - 18, Z - 12, X - 10, Z - 9);
    { const AX = 99, z0 = 7.2, z1 = 20.8, H = 6.4; [z0, z1].forEach((z) => { w.slab('g', 0xfef3c7, AX, 0, z, 1.3, H, 1.3, 0.12); w.add('g', rbox(1.6, 0.4, 1.6, 0.1), 0x16a34a, AX, H + 0.2, z); w.add('g', sph(14), 0xfacc15, AX, H + 0.75, z, 0, 0, 0, 0.42); w.add('g', rbox(1.6, 0.5, 1.6, 0.1), 0x16a34a, AX, 0.25, z); });
      w.add('g', rbox(1.0, 1.9, z1 - z0 + 1.2, 0.2), 0x16a34a, AX, H - 0.6, (z0 + z1) / 2); w.add('g', rbox(1.1, 0.18, z1 - z0 + 1.4, 0.06), 0xfacc15, AX, H + 0.38, (z0 + z1) / 2); w.add('g', rbox(1.1, 0.18, z1 - z0 + 1.4, 0.06), 0xfacc15, AX, H - 1.58, (z0 + z1) / 2);
      for (const sd of [1, -1]) { const ry = sd > 0 ? PI / 2 : -PI / 2, xx = AX + sd * 0.52; txt(w, 'WELCOME TO', xx, H - 0.05, (z0 + z1) / 2, ry, 0.34, 0xfef3c7); txt(w, 'SHOPSVILLE', xx, H - 0.95, (z0 + z1) / 2, ry, 0.72, 0xffffff, 'l', 0.25); [-4.6, 4.6].forEach((o) => w.add('l', star(), 0xfacc15, xx, H - 0.6, (z0 + z1) / 2 + o, 0, ry, 0, 0.35, 0.35, 0.1, 0.4)); }
      [z0 - 1.4, z1 + 1.4].forEach((z) => planter(w, AX, z, 2.2, PI / 2));
      w.add('g', rbox(0.3, 1.5, 3.6, 0.1), 0x16a34a, AX - 4, 1.4, 22.6); txt(w, 'SHOPSVILLE', AX - 4.17, 1.65, 22.6, -PI / 2, 0.36, 0xffffff); txt(w, 'POP. HUNGRY', AX - 4.17, 1.05, 22.6, -PI / 2, 0.2, 0xfef3c7); w.add('x', cyl(10), 0x334155, AX - 4, 0, 22.6, 0, 0, 0, 0.07, 0.7, 0.07); } }
  // trees / bushes around the edges and between lots
  { const spots = [[-90, -40], [-88, -10], [-92, 20], [-90, 40], [-92, 70], [-88, 100], [90, -36], [92, -4], [94, 24], [-40, 28], [-28, 4], [28, 4], [-84, 30], [84, 34], [-78, 104], [-30, 125], [30, 125], [0, 124], [-60, 124], [60, 124], [-98, 50], [-12, 96], [-26, 100]];
    spots.filter(([x, z]) => treeOk(x, z)).forEach(([x, z], i) => K.tree(w, x, z, 1.1 + (i % 4) * 0.2, i % 6 === 0 ? 1 : 0)); for (let i = 0; i < 40; i++) { const a = i / 40 * PI * 2, x = Math.cos(a) * 125, z = 27 + Math.sin(a) * (Math.sin(a) < 0 ? 134 : 112); if (z < -56 && z > -100 && Math.abs(x) < 106) continue; if (!treeOk(x, z)) continue; K.tree(w, x, z, 1.4 + (i % 3) * 0.3, 0); }
    [[-34, 22], [-26, 22], [26, 22], [34, 22], [-34, 46], [26, 46], [34, 46], [-34, -4], [34, -4], [-80, 46], [80, 46]].forEach(([x, z], i) => { K.bush(w, x, z, 1 + (i % 3) * 0.2); K.bush(w, x + 1.3, z + 0.4, 0.8); });
    for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2 + 0.3; w.add('m', blobGeo(i * 3, 0.15, 2), 0xffffff, Math.cos(a) * 220, 60 + (i % 3) * 12, 27 + Math.sin(a) * 220, 0, a, 0, 22, 6, 12); } }
  // ---------------- stores ----------------
  STORES.forEach((d) => { const r = storeBuilding(w, d, d.id === 's1'); GEOM[d.id] = r.G; });
  // Shopsville Shopping Row sidewalk lamps + a row sign
  w.region = 'out'; [-49, -24, 1, 26, 51, 76].forEach((x) => K.lampPost(w, x, -61.4)); { const X = 103.5, Z = -72; w.add('g', rbox(0.4, 2.4, 6, 0.15), 0x1d4ed8, X, 2.6, Z); txt(w, 'SHOPPING ROW', X - 0.22, 2.9, Z, -PI / 2, 0.4, 0xffffff); txt(w, 'SHOPS · SUPERCENTER', X - 0.22, 2.3, Z, -PI / 2, 0.22, 0xfde68a); w.add('x', cyl(10), 0x334155, X, 0, Z, 0, 0, 0, 0.1, 1.4, 0.1); w.solid(X - 0.3, 0, Z - 3, X + 0.3, 3.8, Z + 3); }
  buildDC(w); buildRatita(w); buildTortuga(w); buildRuff(w); buildHall(w); buildFarm(w); buildLab(w); supplierDetail(w); buildOnline(w, SPOTS);
  w.region = 'out';
}
// ---------------- distribution center ----------------
function buildDC(w) { const x0 = 36, z0 = -48, x1 = 80, z1 = -10, L = w.lights;
  const b = shell(w, { id: 'dc', name: 'Distribution Center', x0, z0, x1, z1, h: 8, wall: 0xe5e7eb, trim: 0x16a34a, roof: 0x475569, floor: 'tile', fc1: 0xd1d5db, fc2: 0xc4c9d0, doors: [{ side: 's', at: 46, w: 3.2 }, { side: 's', at: 66, w: 6, top: 5 }, { side: 'n', at: 52, w: 5, top: 4.6 }, { side: 'n', at: 66, w: 5, top: 4.6 }], win: { s: 3, n: 0, e: 3, w: 3 } });
  w.region = 'out'; onSide(w, b, 's', () => { txt(w, 'DISTRIBUTION CENTER', 58, 6.4, z1 + 0.32, 0, 0.6, 0x16a34a); for (let i = 0; i < 2; i++) w.add('g', rbox(6.6, 0.3, 0.3, 0.05), 0xfacc15, 66, 5.2 + i * 0.01, z1 + 0.2); });
  K.floor(w, x0, z1 + 0.5, x1, z1 + 16, 'tile', 0.015, 0x6b7280, 0x636a76, 4); for (let i = 0; i < 5; i++) w.add('l', rbox(0.16, 0.02, 6, 0.01), 0xffffff, 54 + i * 5, 0.04, z1 + 9, 0, 0, 0, 1, 1, 1, 0);
  w.region = 'own_dc'; grokLogo(w, 41, 6.4, z1 + 0.6, 0, 1.2); bigTruck(w, 70, z1 + 9, PI, 0x16a34a); txt(w, 'GROK', 71.28, 2.3, z1 + 9.8, PI / 2, 0.45, 0x16a34a);
  w.region = 'sale_dc'; w.add('g', rbox(9, 1.7, 0.2, 0.1), 0xffffff, 58, 6.6, z1 + 0.35); txt(w, 'WAREHOUSE FOR SALE', 58, 6.4, z1 + 0.5, 0, 0.45, 0xdc2626);
  w.region = 'in_dc'; part(w, b, 'x', -22, 36, 46, [41], 0xf1f5f9, 3.4); part(w, b, 'z', 46, -22, -10, [], 0xf1f5f9, 3.4);
  // dispatch office (always there)
  K.desk(w, 41, -15, PI, { top: 0xe5e7eb }); { const T = w.tf(41, 0.85, -15, PI); K.monitor(w, T, -0.5, 0, 0.2, 0, 0x22c55e); K.monitor(w, T, 0.5, 0, 0.2, 0, 0xfacc15); } K.chair(w, 41, 0, -16.1, 0, 0x16a34a); SPOTS.dcBoard = [41, -14];
  { w.add('g', rbox(4.5, 2.4, 0.1, 0.06), 0x1e293b, 41, 2.2, -21.7); for (let i = 0; i < 9; i++) w.add('l', sph(8), pick([0x22c55e, 0xfacc15, 0xef4444]), 39.2 + (i % 3) * 1.8, 1.6 + Math.floor(i / 3) * 0.6, -21.6, 0, 0, 0, 0.1, 0.1, 0.05, 0.5); txt(w, 'DISPATCH', 41, 3.15, -21.6, 0, 0.22, 0xffffff); }
  K.cooler(w, 44.8, -21); K.potPlant(w, 37, 0, -11, 0.9, 0x16a34a); pallet(w, 56, -14, 0, 2); pallet(w, 74, -40, 0.4, 3); K.cone3(w, 60, -16); K.cone3(w, 61, -15.4);
  forklift(w, 70, -20, 0.6, 0xf97316); K.hazard(w, 66, -13, 6, 4);
  // full warehouse (only once you own it)
  w.region = 'ownin_dc'; const dyn = { dyn: true, tag: 'dc' };
  for (let r = 0; r < 4; r++) { const z = -44 + r * 6.5; rack(w, 54, z, 0, 8, 5.2, 1, dyn); rack(w, 70, z, 0, 8, 5.2, 1, dyn); }
  K.conveyor(w, 62, -24, 0, 10); w.solid(57, 0, -24.6, 67, 0.78, -23.4, dyn); for (let i = 0; i < 6; i++) K.parcel(w, 58 + i * 1.6, 0.78, -24, 0.8);
  forklift(w, 62, -36, -0.4, 0xfacc15); pallet(w, 46, -30, 0, 6); pallet(w, 48, -32, 0.2, 6); pallet(w, 46, -40, 0.1, 4); pallet(w, 77, -14, 0, 5);
  bigTruck(w, 52, -44.5, 0, 0x16a34a); SPOTS.dcLoad = [52, -38.6];
  L.push({ x: 58, y: 6.5, z: -30, c: 0xfff7e6, i: 18, d: 26 }); L.push({ x: 42, y: 3, z: -16, c: 0xfff1d6, i: 10, d: 12 });
  SPOTS.dcDoor = [46, -8.4]; }
// ---------------- Ratita Industries (snacks + self-checkout robots) ----------------
function buildRatita(w) { const x0 = -24, z0 = 23, x1 = -2, z1 = 43, L = w.lights;
  const b = shell(w, { id: 'ratita', name: 'Ratita Industries', x0, z0, x1, z1, h: 6, wall: 0xfdf2f8, trim: 0xff4fa0, roof: 0x9d174d, floor: 'tile', fc1: 0xfce7f3, fc2: 0xfbcfe8, doors: [{ side: 'n', at: -13, w: 3.2 }], win: { s: 3, n: 3, e: 2, w: 2 } });
  w.region = 'out'; onSide(w, b, 'n', () => { txt(w, 'RATITA INDUSTRIES', -13, 4.6, z0 - 0.32, PI, 0.55, 0xff4fa0); txt(w, 'SNACKS + ROBO-CHECKOUTS', -13, 4.0, z0 - 0.32, PI, 0.22, 0x9d174d); awning(w, -17, -9, z0, 3.4, [0xff4fa0, 0xffffff], -1); });
  w.region = 'in_ratita'; part(w, b, 'z', -11, 23, 43, [27, 38], 0xfce7f3, 3.6);
  // showroom: robo-checkout prototype + Luna's desk
  { const X = -18, Z = 28; [-0.9, 0.9].forEach((o) => { w.slab('m', 0xff4fa0, X + o, 0, Z, 0.7, 0.85, 0.7, 0.08); w.add('g', rbox(0.55, 0.4, 0.06, 0.04), 0x1e293b, X + o, 1.55, Z - 0.25, -0.3, 0, 0); w.add('l', rbox(0.47, 0.32, 0.01, 0.01), 0xff8fcb, X + o, 1.55, Z - 0.22, -0.3, 0, 0, 1, 1, 1, 0.4); w.add('x', cyl(8), 0x475569, X + o, 0.85, Z - 0.25, 0, 0, 0, 0.04, 0.6, 0.04); }); txt(w, 'ROBO-CHECKOUT 3000', X, 2.5, Z - 0.3, PI, 0.18, 0xff4fa0); w.add('g', rcyl(1.8, 0.12, 0.05, 32), 0xffffff, X, 0, Z); SPOTS.ratKiosk = [X, Z - 1.6]; }
  K.desk(w, -16, 38.5, 0, { top: 0xfbcfe8 }); { const T = w.tf(-16, 0.85, 38.5, 0); K.monitor(w, T, -0.5, 0, -0.2, PI, 0xff4fa0); K.monitor(w, T, 0.5, 0, -0.2, PI, 0x38bdf8); } SPOTS.luna = [-16, 37.3]; SPOTS.ratDesk = [-16, 36.6];
  seats(w, -23, 32, 3, 0xff4fa0, PI / 2); K.potPlant(w, -23, 0, 41.5, 1.0, 0xff4fa0); poster(w, 'z', -23.75, 36, 2.0, 2.0, 1.2, 0xff4fa0, 1, 'SQUEAK SMARTER', 0xffffff); clockW(w, 'x', 42.75, -18, 3.4, -1);
  // factory floor: snack line + cheese vats + lab bench
  K.conveyor(w, -5, 33, PI / 2, 12); for (let i = 0; i < 7; i++) { w.add('g', rbox(0.5, 0.5, 0.4, 0.05), pick([0xff4fa0, 0xfacc15, 0x60a5fa]), -5, 1.03, 28 + i * 1.6); } SPOTS.ratLine = [-7, 33];
  K.vat(w, -8.5, 26, 0xfacc15, 0.8, 2.2); K.vat(w, -8.5, 40, 0xff8fcb, 0.8, 2.2); K.labBench(w, -9.4, 33, PI / 2, 3.4);
  for (let i = 0; i < 4; i++) K.parcel(w, -3, i * 0.5, 41.8, 0.8); L.push({ x: -13, y: 3.6, z: 33, c: 0xffd6ec, i: 14, d: 16 }); L.push({ x: -6, y: 3.6, z: 33, c: 0xfff1d6, i: 12, d: 14 }); }
// ---------------- Tortuga Tech (cold chain) ----------------
function buildTortuga(w) { const x0 = 4, z0 = 23, x1 = 26, z1 = 43, L = w.lights;
  const b = shell(w, { id: 'tortuga', name: 'Tortuga Tech Cold Chain', x0, z0, x1, z1, h: 6, wall: 0xccfbf1, trim: 0x0f766e, roof: 0x134e4a, floor: 'tile', fc1: 0xf0fdfa, fc2: 0xccfbf1, doors: [{ side: 'n', at: 15, w: 3.2 }], win: { s: 3, n: 3, e: 2, w: 2 } });
  w.region = 'out'; onSide(w, b, 'n', () => { txt(w, 'TORTUGA TECH', 15, 4.6, z0 - 0.32, PI, 0.6, 0x0f766e); txt(w, 'COLD CHAIN DIVISION', 15, 4.0, z0 - 0.32, PI, 0.22, 0x134e4a); w.add('g', sph(16), 0x22c55e, 22.5, 4.4, z0 - 0.4, 0, 0, 0, 0.7, 0.45, 0.2); });
  w.region = 'in_tortuga';
  // glass walk-in freezer with ice blocks and frozen pallets
  { const fx0 = 16, fz0 = 33, fx1 = 25.5, fz1 = 42.5; w.add('e', rbox(0.1, 3, fz1 - fz0, 0.02), 0xcfefff, fx0, 1.5, (fz0 + fz1) / 2); w.add('e', rbox(fx1 - fx0, 3, 0.1, 0.02), 0xcfefff, (fx0 + fx1) / 2, 1.5, fz0); w.solid(fx0 - 0.1, 0, fz0 + 2.5, fx0 + 0.1, 3, fz1); w.solid(fx0, 0, fz0 - 0.1, fx1, 3, fz0 + 0.1);
    for (let i = 0; i < 8; i++) w.add('e', rbox(0.7, 0.7, 0.7, 0.08), 0xe0f7ff, fx0 + 1.5 + (i % 4) * 2, 0.35 + Math.floor(i / 4) * 0.7, fz1 - 1.2); pallet(w, 21, 37, 0, 4, 0x93c5fd); pallet(w, 23.5, 36, 0.3, 6, 0xbfdbfe); L.push({ x: 20, y: 2.5, z: 38, c: 0xbfe9ff, i: 12, d: 10 }); w.add('l', rbox(fx1 - fx0, 0.1, 0.1, 0.02), 0xbfe9ff, (fx0 + fx1) / 2, 3.0, fz0, 0, 0, 0, 1, 1, 1, 0.4); SPOTS.tortFreezer = [17.5, 31.5]; }
  // freezer prototypes + server racks + Torty's desk with shell trophies
  for (let i = 0; i < 3; i++) { const X = 6.5 + i * 2.6, Z = 41.5; w.slab('m', 0x334155, X, 0, Z, 2.2, 2.2, 1, 0.05); w.add('e', rbox(2, 1.9, 0.05, 0.02), 0xcfefff, X, 1.1, Z - 0.52); w.add('l', rbox(2, 0.08, 0.05, 0.02), 0xbfe9ff, X, 2.1, Z - 0.52, 0, 0, 0, 1, 1, 1, 0.4); for (let k = 0; k < 6; k++) w.add('g', rbox(0.4, 0.3, 0.3, 0.03), pick([0x60a5fa, 0x22d3ee, 0xa78bfa]), X - 0.7 + (k % 3) * 0.7, 0.4 + Math.floor(k / 3) * 0.6, Z - 0.2); }
  for (let i = 0; i < 3; i++) K.serverRack(w, 25.2, 25 + i * 1.3, -PI / 2); K.desk(w, 9, 28, 0, { top: 0x99f6e4 }); { const T = w.tf(9, 0.85, 28, 0); K.monitor(w, T, 0, 0, -0.2, PI, 0x2dd4bf); } SPOTS.torty = [9, 26.4]; SPOTS.tortDesk = [9, 26.0];
  for (let i = 0; i < 3; i++) { w.add('x', lathe([[0, 0], [0.12, 0], [0.04, 0.08], [0.04, 0.2], [0.14, 0.3], [0.12, 0.42], [0, 0.42]], 18, 'cup2'), 0xfbbf24, 4.6, 1.2 + i * 0.01, 26 + i * 0.6); } w.slab('m', 0x0f766e, 4.7, 0, 26.6, 0.6, 1.2, 2.2, 0.04);
  poster(w, 'z', 4.25, 33, 2.0, 2.2, 1.3, 0x0f766e, 1, 'KEEP IT COOL', 0xfde68a); K.potPlant(w, 13, 0, 24, 1.0, 0x2dd4bf); clockW(w, 'x', 42.75, 10, 3.4, -1); L.push({ x: 10, y: 3.6, z: 30, c: 0xe0fff8, i: 14, d: 16 }); }
// ---------------- Ruffsources Staffing (hire your crew) ----------------
function buildRuff(w) { const x0 = -80, z0 = 23, x1 = -60, z1 = 43, L = w.lights;
  const b = shell(w, { id: 'ruff', name: 'Ruffsources Staffing', x0, z0, x1, z1, h: 5.6, wall: 0xc8634a, trim: 0xfff7ed, roof: 0x7c3f2c, floor: 'wood', fc1: 0xd9a066, doors: [{ side: 'n', at: -70, w: 3.2 }], win: { s: 3, n: 3, e: 2, w: 2 } });
  w.region = 'out'; onSide(w, b, 'n', () => { txt(w, 'RUFFSOURCES', -70, 4.3, z0 - 0.32, PI, 0.6, 0xfff7ed); txt(w, 'STAFFING  -  ALL PAWS WELCOME', -70, 3.75, z0 - 0.32, PI, 0.2, 0xfde68a); });
  w.region = 'in_ruff'; part(w, b, 'x', 34, -80, -60, [-66], 0xfff7ed, 3.4);
  seats(w, -79, 26, 4, 0xff8a3d, PI / 2); K.rug(w, -70, 29, 0, 6, 3.4, 0xff8a3d, 0xfef3c7); K.potPlant(w, -61, 0, 24, 1.0, 0xff4fa0); K.cooler(w, -61, 32.5);
  { const X = -70, Z = 31.2; K.desk(w, X, Z, PI, { top: 0xfde68a, L: 3 }); { const T = w.tf(X, 0.85, Z, PI); K.monitor(w, T, 0.5, 0, 0.25, 0, 0xffd23f); } SPOTS.ruffDesk = [X, Z + 1.5]; SPOTS.candy = [X - 2.6, Z - 0.6]; w.add('f', torus(0.45, 28), 0x8b5cf6, X - 2.6, 0.22, Z - 0.6, PI / 2, 0, 0, 0.7, 0.7, 0.55); w.add('f', rcyl(0.62, 0.14, 0.06, 24), 0xede9fe, X - 2.6, 0.04, Z - 0.6); }
  // candidate board + interview room
  { w.add('m', rbox(4.4, 2.2, 0.1, 0.05), 0xc08a52, -70, 2.1, 33.8); for (let i = 0; i < 8; i++) { const x = -71.6 + (i % 4) * 1.1, y = 2.6 - Math.floor(i / 4) * 0.95; w.add('m', rbox(0.8, 0.8, 0.02, 0.01), 0xffffff, x, y, 33.72); w.add('g', sph(10), pick([0xf5c9a4, 0xc68658, 0xffe0c7, 0x9a6440]), x, y + 0.1, 33.7, 0, 0, 0, 0.18, 0.2, 0.03); } txt(w, 'NOW HIRING', -70, 3.35, 33.72, PI, 0.24, 0xc8634a); }
  K.tableR(w, -70, 38.5, 1.0, 0.78, 0xffffff); [-1, 1].forEach((s) => K.chair(w, -70 + s * 1.4, 0, 38.5, s > 0 ? -PI / 2 : PI / 2, 0xc8634a)); K.filing(w, -79.2, 41.8, PI / 2, 0x94a3b8, 4); K.filing(w, -79.2, 40.9, PI / 2, 0x94a3b8, 4); poster(w, 'z', -60.25, 38.5, 2.0, 2.0, 1.2, 0xff8a3d, -1, 'GOOD BOY ENERGY');
  pendant(w, -70, 29, 0xff8a3d, 3.9); pendant(w, -70, 38.5, 0xfde68a, 3.4); L.push({ x: -70, y: 3.4, z: 30, c: 0xffe4c4, i: 14, d: 14 }); }
// ---------------- Town Hall + Health Dept + bank ----------------
function buildHall(w) { const x0 = -56, z0 = 23, x1 = -36, z1 = 43, L = w.lights;
  const b = shell(w, { id: 'hall', name: 'Town Hall & Health Dept', x0, z0, x1, z1, h: 6.5, wall: 0xf1ead8, trim: 0x2563eb, roof: 0x1e3a8a, floor: 'marble', fc1: 0xf8fafc, fc2: 0xe2e8f0, doors: [{ side: 'n', at: -46, w: 3.4 }], win: { s: 3, n: 4, e: 2, w: 2 } });
  w.region = 'out'; onSide(w, b, 'n', () => { for (let i = 0; i < 4; i++) { const x = -51.5 + i * 3.66; if (Math.abs(x - -46) < 2) continue; w.add('g', rcyl(0.35, 5, 0.06, 18), 0xffffff, x, 0, z0 - 1.6); w.solid(x - 0.35, 0, z0 - 1.95, x + 0.35, 5, z0 - 1.25); } w.add('g', rbox(13, 0.5, 2.6, 0.1), 0xffffff, -46, 5.2, z0 - 1.2); txt(w, 'TOWN HALL', -46, 5.9, z0 - 0.35, PI, 0.55, 0x1e3a8a); });
  w.add('x', cyl(10), 0x94a3b8, -40, 0, 19.8, 0, 0, 0, 0.06, 6, 0.06); w.add('f', rbox(1.6, 1.0, 0.04, 0.02), 0x16a34a, -39.2, 5.4, 19.8); w.add('l', star(), 0xfacc15, -39.2, 5.4, 19.76, 0, 0, 0, 0.3, 0.3, 0.1, 0.3);
  w.region = 'in_hall'; part(w, b, 'z', -46, 33, 43, [], 0xf8fafc, 3.4); part(w, b, 'x', 33, -56, -36, [-51, -41], 0xf8fafc, 3.4);
  // lobby: info desk, flags, benches, the town model
  counter(w, -49, -43, 29.5, 0xdbeafe, 0x1e3a8a); txt(w, 'INFO + PERMITS', -46, 1.6, 29.06, PI, 0.18, 0x1e3a8a); SPOTS.hallPermit = [-46, 27.8];
  seats(w, -55.4, 25, 4, 0x2563eb, PI / 2); seats(w, -36.6, 25, 4, 0x2563eb, PI / 2); K.potPlant(w, -55, 0, 31.5, 1.1, 0x2563eb); K.potPlant(w, -37, 0, 31.5, 1.1, 0x2563eb);
  // health dept office
  { counter(w, -55, -48, 37.5, 0xffffff, 0x0f766e); txt(w, 'HEALTH DEPT', -51.5, 1.5, 37.06, PI, 0.2, 0x0f766e); for (let i = 0; i < 6; i++) { w.add('m', rbox(0.7, 0.9, 0.04, 0.02), 0xffffff, -55 + i * 1.2, 2.4, 42.7); txt(w, 'ABCABC'[i], -55 + i * 1.2, 2.25, 42.66, PI, 0.4, [0x16a34a, 0xf59e0b, 0xdc2626][i % 3]); } K.filing(w, -49, 42.3, PI, 0x94a3b8, 4); SPOTS.inspector = [-51.5, 39.5]; SPOTS.hallHealth = [-51.5, 36.2]; }
  // bank
  { counter(w, -44, -37, 37.5, 0xfef3c7, 0x7c4a1e); for (let i = 0; i < 3; i++) w.add('e', rbox(1.6, 1.1, 0.04, 0.02), 0xcfefff, -43 + i * 2.2, 1.65, 37.5); txt(w, 'SHOPSVILLE BANK', -40.5, 2.6, 37.06, PI, 0.24, 0x7c4a1e); w.slab('x', 0x475569, -37.5, 0, 42, 1.4, 2.2, 1.2, 0.08); w.add('x', torus(0.2, 20), 0xfacc15, -37.5, 1.1, 41.38, 0, 0, 0, 0.35); SPOTS.banker = [-40.5, 39.5]; SPOTS.hallBank = [-40.5, 36.2]; }
  pendant(w, -46, 28, 0xfde68a, 4.8); L.push({ x: -46, y: 4, z: 30, c: 0xfff7e6, i: 14, d: 16 }); L.push({ x: -46, y: 3, z: 39, c: 0xfff7e6, i: 12, d: 14 }); }
// ---------------- Fernhill Farm Co-op (produce, dairy, meat, bakery flour) ----------------
function buildFarm(w) { const x0 = 38, z0 = 23, x1 = 64, z1 = 43, L = w.lights;
  const b = shell(w, { id: 'farm', name: 'Fernhill Farm Co-op', x0, z0, x1, z1, h: 6.5, wall: 0xb91c1c, trim: 0xffffff, roof: 0x7f1d1d, floor: 'wood', fc1: 0xc8a165, doors: [{ side: 'n', at: 51, w: 5, top: 4 }], win: { s: 3, n: 3, e: 2, w: 2 } });
  w.region = 'out'; onSide(w, b, 'n', () => { txt(w, 'FERNHILL FARM CO-OP', 51, 5.0, z0 - 0.32, PI, 0.55, 0xffffff); [-1, 1].forEach((s) => w.add('g', rbox(0.2, 3.6, 0.2, 0.04), 0xffffff, 51 + s * 2.7, 1.8, z0 - 0.3)); w.add('g', rbox(5.6, 0.2, 0.2, 0.04), 0xffffff, 51, 4.1, z0 - 0.3); });
  // fields + tractor + coop outside (east side)
  for (let r = 0; r < 7; r++) { w.add('m', rbox(24, 0.3, 1.0, 0.1, 1), 0x6b4423, 80, 0.12, 25 + r * 2.6); for (let i = 0; i < 18; i++) w.add('g', blobGeo((r * 18 + i) & 31, 0.25, 1), r % 2 ? 0x16a34a : 0x65a30d, 69 + i * 1.3, 0.45, 25 + r * 2.6, 0, i, 0, 0.32, 0.28, 0.32); }
  K.fenceRun(w, 'x', 22.5, 67, 93, 1.1, 0xffffff); K.fenceRun(w, 'x', 43.5, 67, 93, 1.1, 0xffffff); K.fenceRun(w, 'z', 93, 22.5, 43.5, 1.1, 0xffffff);
  { const T = w.tf(66, 0, 17.5, 0.3); T.box('g', 0x16a34a, 0, 0.6, 0, 1.4, 1.0, 2.4, 0.15); T.box('g', 0x16a34a, 0, 1.6, -0.5, 1.2, 1.0, 1.0, 0.12); T.add('m', torus(0.4, 16), 0x111827, 0.8, 0.9, -0.6, 0, PI / 2, 0, 0.9, 0.9, 0.5); T.add('m', torus(0.4, 16), 0x111827, -0.8, 0.9, -0.6, 0, PI / 2, 0, 0.9, 0.9, 0.5); T.add('m', torus(0.4, 16), 0x111827, 0.75, 0.5, 0.9, 0, PI / 2, 0, 0.5, 0.5, 0.4); T.add('m', torus(0.4, 16), 0x111827, -0.75, 0.5, 0.9, 0, PI / 2, 0, 0.5, 0.5, 0.4); T.add('x', cyl(8), 0x334155, 0.4, 1.8, 0.7, 0, 0, 0, 0.06, 0.8, 0.06); T.solid(-1, 0, -1.4, 1, 2, 1.4); }
  for (let i = 0; i < 4; i++) chicken(w, 34 + (i % 2) * 1.2, 46.5 + (i * 0.7), i);
  w.region = 'in_farm';
  for (let i = 0; i < 6; i++) hay(w, 39.5, 25 + i * 1.3, 0); hay(w, 39.5, 25.6, 0); for (let i = 0; i < 3; i++) hay(w, 40.8, 26 + i * 1.3, 0);
  { const cols = [0xdc2626, 0xf97316, 0xfacc15, 0x16a34a, 0x7c3aed, 0x84cc16]; for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) produceCrate(w, 46 + i * 1.0, 0.8 * r, 41.8 - r * 0, cols[(i + r) % 6]); w.solid(45.5, 0, 41.4, 51.6, 1.6, 42.2); }
  counter(w, 48, 56, 31.5, 0xfef3c7, 0x7c4a1e); for (let i = 0; i < 8; i++) produceCrate(w, 48.6 + i * 0.95, 1.06, 31.5, pick([0xdc2626, 0xf97316, 0xfacc15, 0x16a34a]), 0.1); txt(w, 'ORDER FRESH STOCK', 52, 2.1, 31.06, PI, 0.18, 0x7c4a1e); SPOTS.farmStand = [52, 29.8]; SPOTS.fern = [52, 33];
  for (let i = 0; i < 5; i++) { w.add('x', lathe([[0, 0], [0.22, 0], [0.24, 0.5], [0.12, 0.65], [0.12, 0.8], [0, 0.8]], 18, 'milk'), 0xd1d5db, 60 + (i % 3) * 0.6, 0, 40.5 + Math.floor(i / 3) * 0.7); } w.solid(59.6, 0, 40.1, 61.6, 0.8, 41.8);
  { const T = w.tf(60, 0, 27, 0); T.slab('m', 0x7c4a1e, 0, 0, 0, 3, 0.9, 1.2, 0.05); for (let i = 0; i < 12; i++) T.add('g', sph(8), 0xfef3c7, -1.2 + (i % 6) * 0.45, 0.98, -0.2 + Math.floor(i / 6) * 0.4, 0, 0, 0, 0.09, 0.11, 0.09); txt(w, 'EGGS', 60, 1.5, 26.35, PI, 0.18, 0x7c4a1e); }
  for (let i = 0; i < 4; i++) K.parcel(w, 63, i * 0.5, 24, 0.85); w.add('m', rbox(0.1, 3, 1.6, 0.02), 0xa16207, 63.6, 1.5, 34); for (let i = 0; i < 5; i++) w.add('x', cyl(8), 0x94a3b8, 63.5, 0.4 + i * 0.55, 34, 0, 0, PI / 2, 0.02, 0.4, 0.02);
  L.push({ x: 51, y: 4, z: 33, c: 0xffe8c2, i: 16, d: 18 }); }
// ---------------- Grok Goods Lab (your store brand) ----------------
function buildLab(w) { const x0 = -24, z0 = 60, x1 = -4, z1 = 78, L = w.lights;
  const b = shell(w, { id: 'lab', name: 'Grok Goods Lab', x0, z0, x1, z1, h: 5.6, wall: 0xede9fe, trim: 0x7c3aed, roof: 0x4c1d95, floor: 'tile', fc1: 0xf5f3ff, fc2: 0xddd6fe, doors: [{ side: 'n', at: -14, w: 3.2 }], win: { s: 3, n: 3, e: 2, w: 2 } });
  w.region = 'out'; onSide(w, b, 'n', () => { txt(w, 'GROK GOODS LAB', -14, 4.2, z0 - 0.32, PI, 0.55, 0x7c3aed); w.add('l', star(), 0xfacc15, -21.5, 4.4, z0 - 0.4, 0, 0, 0, 0.6, 0.6, 0.25, 0.3); w.add('l', star(), 0xfacc15, -6.5, 4.4, z0 - 0.4, 0, 0, 0, 0.6, 0.6, 0.25, 0.3); });
  w.region = 'in_lab';
  // test kitchen
  w.slab('m', 0xffffff, -21, 0, 76.6, 5.6, 0.92, 0.8, 0.05); w.add('g', rbox(5.7, 0.06, 0.9, 0.02), 0x1f2937, -21, 0.95, 76.6); for (let i = 0; i < 4; i++) w.add('x', torus(0.15, 16), 0x111827, -22.6 + (i % 2) * 0.6, 0.99, 76.4 + Math.floor(i / 2) * 0.4, PI / 2, 0, 0, 0.18); w.add('x', lathe([[0, 0], [0.25, 0], [0.25, 0.3], [0, 0.3]], 18, 'lpot'), 0xdc2626, -22.3, 0.99, 76.6);
  for (let i = 0; i < 3; i++) w.add('g', lathe([[0, 0], [0.3, 0], [0.38, 0.18], [0, 0.18]], 20, 'bowl'), pick([0x60a5fa, 0xfacc15, 0xf472b6]), -19.8 + i * 0.6, 0.98, 76.6);
  // packaging machine + brand shelf + tasting table
  K.conveyor(w, -10, 70, 0, 8); for (let i = 0; i < 5; i++) w.add('g', rbox(0.45, 0.5, 0.35, 0.05), i % 2 ? 0x7c3aed : 0xfacc15, -13 + i * 1.5, 1.03, 70); w.slab('x', 0x94a3b8, -6, 0, 70, 1.4, 2.2, 1.6, 0.08); w.add('l', rbox(0.6, 0.3, 0.02, 0.02), 0x22c55e, -6, 1.6, 70.82, 0, 0, 0, 1, 1, 1, 0.4); SPOTS.labMachine = [-10, 72];
  { w.slab('m', 0x4c1d95, -4.6, 0, 66, 0.7, 2.2, 5, 0.04); for (let r = 0; r < 4; r++) for (let k = 0; k < 8; k++) w.add('g', rbox(0.3, 0.36, 0.25, 0.03), (k + r) % 2 ? 0x7c3aed : 0xfacc15, -4.9, 0.25 + r * 0.5, 63.9 + k * 0.6); }
  K.tableR(w, -17, 67, 1.1, 0.78, 0xffffff); for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; w.add('g', lathe([[0, 0], [0.12, 0], [0.13, 0.03], [0, 0.03]], 12, 'plt'), 0xffffff, -17 + Math.cos(a) * 0.6, 0.79, 67 + Math.sin(a) * 0.6); w.add('g', sph(8), pick([0xd97706, 0xfacc15, 0x7c3aed]), -17 + Math.cos(a) * 0.6, 0.86, 67 + Math.sin(a) * 0.6, 0, 0, 0, 0.06); } SPOTS.labKitchen = [-17, 69];
  [[-23.75, 66, 0xfacc15, 'GROK-OS'], [-23.75, 71, 0xff4fa0, 'CHEESY BITES']].forEach(([x, z, c, word]) => poster(w, 'z', x, z, 2.0, 2.0, 1.4, c, 1, word, 0x4c1d95)); K.potPlant(w, -5, 0, 61, 1.0, 0x7c3aed);
  L.push({ x: -14, y: 3.4, z: 69, c: 0xf3e8ff, i: 14, d: 16 }); }
