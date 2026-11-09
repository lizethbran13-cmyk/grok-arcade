// Candy's Snow Day interiors: Cocoa Co., Snowpine Lodge, Hill Shack, Tree Lot hut. Each room is a closed box far east of town (x > 300),
// batched into a few draw calls; walls/ceiling use the no-shadow 'w' bucket so the sun never darkens them.
import * as THREE from 'three';
import { Batch, G, solid, sign, PI } from './kit.js';
export const ROOMS = {};
const LIGHTS = [0xff4d4d, 0x4ade80, 0xfacc15, 0x60a5fa, 0xf472b6];
function shell(b, scene, r) { const { ox, oz, w, d, h } = r, x0 = ox - w / 2, x1 = ox + w / 2, z0 = oz - d / 2, z1 = oz + d / 2, dw = 2.2;
  b.box('m', r.floor || 0x8a5a33, ox, -0.1, oz, w, 0.1, d); for (let i = 0; i < Math.floor(w / 0.6); i++) b.box('m', i % 2 ? 0x7a4c2b : 0x956238, x0 + 0.3 + i * 0.6, -0.01, oz, 0.04, 0.012, d - 0.1);
  const wc = r.wall || 0xe9d8bf; b.box('w', wc, ox, 0, z0, w, h, 0.2); b.box('w', wc, x0, 0, oz, 0.2, h, d); b.box('w', wc, x1, 0, oz, 0.2, h, d);
  b.box('w', wc, (x0 + ox - dw / 2) / 2, 0, z1, ox - dw / 2 - x0, h, 0.2); b.box('w', wc, (x1 + ox + dw / 2) / 2, 0, z1, x1 - ox - dw / 2, h, 0.2); b.box('w', wc, ox, 2.6, z1, dw, h - 2.6, 0.2);
  b.box('w', r.ceil || 0xd9c4a5, ox, h, oz, w, 0.2, d); for (let x = x0 + 1.5; x < x1; x += 2.5) b.box('m', 0x6b3f22, x, h - 0.3, oz, 0.25, 0.3, d);
  const wa = r.wain || 0x7a4a2a; b.box('m', wa, ox, 0, z0 + 0.12, w - 0.1, 1.0, 0.06); b.box('m', wa, x0 + 0.12, 0, oz, 0.06, 1.0, d - 0.1); b.box('m', wa, x1 - 0.12, 0, oz, 0.06, 1.0, d - 0.1);
  b.box('m', 0x5b3a24, ox, 0, z1 - 0.13, dw + 0.4, 2.7, 0.08); b.box('l', 0x9fd3ff, ox, 0.2, z1 - 0.16, dw - 0.2, 2.3, 0.02, 0, 0.15); // door with frosty glass
  for (let i = 0; i < Math.floor(w / 0.6); i++) b.add('l', G.ico, LIGHTS[i % 5], x0 + 0.3 + i * 0.6, h - 0.15, z0 + 0.2, 0, 0, 0, 0.07, 0.08, 0.07, 1.2);
  solid(x0 - 0.3, z0 - 0.3, x1 + 0.3, z0 + 0.1, 0, h); solid(x0 - 0.3, z0, x0 + 0.1, z1, 0, h); solid(x1 - 0.1, z0, x1 + 0.3, z1, 0, h);
  solid(x0, z1 - 0.1, ox - dw / 2, z1 + 0.3, 0, h); solid(ox + dw / 2, z1 - 0.1, x1, z1 + 0.3, 0, h); solid(ox - dw / 2, z1 + 0.05, ox + dw / 2, z1 + 0.4, 0, h); solid(x0, z0, x1, z1, h, h + 0.4);
  r.exit = { x: ox, z: z1 - 1.2 }; r.x0 = x0; r.x1 = x1; r.z0 = z0; r.z1 = z1; }
function win(b, x, y, z, ry, w = 1.4, h = 1.2, col = 0xcfe6ff) { const c = Math.cos(ry), s = Math.sin(ry); b.add('l', G.box, col, x, y, z, 0, ry, 0, w, h, 0.03, 0.15);
  b.add('m', G.box, 0xf8fafc, x, y, z, 0, ry, 0, 0.07, h, 0.06); b.add('m', G.box, 0xf8fafc, x, y, z, 0, ry, 0, w, 0.07, 0.06); b.add('m', G.box, 0x6b3f22, x + s * 0.12, y - h / 2 - 0.05, z + c * 0.12, 0, ry, 0, w + 0.2, 0.1, 0.25);
  b.add('m', G.box, 0xf6f9ff, x + s * 0.02, y - h / 2 + 0.08, z + c * 0.02, 0, ry, 0, w - 0.1, 0.1, 0.04); }
function table(b, x, z, col = 0x8a5a33) { b.cyl('m', col, x, 0.72, z, 0.55, 0.06); b.cyl('x', 0x2b3340, x, 0, z, 0.06, 0.72); b.cyl('x', 0x2b3340, x, 0, z, 0.3, 0.04); solid(x - 0.5, z - 0.5, x + 0.5, z + 0.5, 0, 0.8); }
function chair(b, x, z, ry, col = 0xb91c1c) { const c = Math.cos(ry), s = Math.sin(ry); b.add('m', G.box, 0x6b3f22, x, 0.24, z, 0, ry, 0, 0.45, 0.48, 0.45); b.add('f', G.box, col, x, 0.5, z, 0, ry, 0, 0.47, 0.06, 0.47); b.add('m', G.box, 0x6b3f22, x - s * 0.21, 0.8, z - c * 0.21, 0, ry, 0, 0.45, 0.6, 0.06); }
function mug(b, x, y, z, col = 0xdc2626) { b.cyl('g', col, x, y, z, 0.08, 0.15); b.cyl('m', 0x5b3014, x, y + 0.14, z, 0.065, 0.015); b.sph('m', 0xffffff, x + 0.02, y + 0.17, z, 0.03); }
function shelf(b, x, z, ry, w, rows = 3, goods = [0xdc2626, 0x2563eb, 0xfacc15, 0x16a34a]) { const c = Math.cos(ry), s = Math.sin(ry);
  for (let i = 0; i <= rows; i++) b.add('m', G.box, 0x7a4a2a, x, 0.3 + i * 0.6, z, 0, ry, 0, w, 0.05, 0.4); b.add('m', G.box, 0x6b3f22, x - c * w / 2, 1.2, z + s * w / 2, 0, ry, 0, 0.06, 2.4, 0.4); b.add('m', G.box, 0x6b3f22, x + c * w / 2, 1.2, z - s * w / 2, 0, ry, 0, 0.06, 2.4, 0.4);
  for (let i = 0; i < rows; i++) for (let k = 0; k < Math.floor(w / 0.32); k++) { const lx = -w / 2 + 0.2 + k * 0.32; b.add('g', G.cyl, goods[(i + k) % goods.length], x + c * lx, 0.33 + i * 0.6 + 0.13, z - s * lx, 0, 0, 0, 0.11, 0.26, 0.11); } }
function rug(b, x, z, w, d, col, col2) { b.box('f', col, x, 0.005, z, w, 0.02, d); b.box('f', col2, x, 0.02, z, w - 0.4, 0.01, d - 0.4); b.box('f', col, x, 0.03, z, w - 0.9, 0.01, d - 0.9); }
function fire(b, x, z, ry, s = 1) { const c = Math.cos(ry), sn = Math.sin(ry); const P = (lx, lz) => [x + lx * c + lz * sn, z - lx * sn + lz * c];
  b.add('m', G.box, 0x8b8f99, x, 1.4 * s, z, 0, ry, 0, 2.8 * s, 2.8 * s, 0.9); let [px, pz] = P(0, 0.46); b.add('m', G.box, 0x2a2a2e, px, 0.75 * s, pz, 0, ry, 0, 1.6 * s, 1.3 * s, 0.05); b.add('m', G.box, 0x6b3f22, px, 2.0 * s, pz, 0, ry, 0, 3.1 * s, 0.14, 0.4);
  [px, pz] = P(0, 0.5); b.add('l', G.cone, 0xff8a2a, px, 0.55 * s, pz, 0, 0, 0, 0.45 * s, 0.8 * s, 0.2, 1.4); b.add('l', G.cone, 0xffd36b, px, 0.45 * s, pz, 0, 0, 0, 0.25 * s, 0.5 * s, 0.15, 1.6);
  for (let i = 0; i < 6; i++) { const st = (i - 2.5) * 0.4 * s; [px, pz] = P(st, 0.65); b.add('f', G.box, LIGHTS[i % 5], px, 1.65 * s, pz, 0, ry, 0, 0.18, 0.32, 0.06); b.add('f', G.box, 0xffffff, px, 1.85 * s, pz, 0, ry, 0, 0.2, 0.08, 0.07); }
  for (let i = 0; i < 9; i++) { const st = -1.3 * s + i * 0.33 * s; [px, pz] = P(st, 0.48); b.add('l', G.ico, 0x9ca3af, px, 1.35 * s + (i % 3) * 0.6 * s, pz, 0, 0, 0, 0.12, 0.12, 0.04, 0); } }
function xtree(b, x, z, s = 1) { b.cyl('m', 0x5b3a24, x, 0, z, 0.12 * s, 0.4 * s); for (let i = 0; i < 3; i++) { const y = (0.4 + i * 0.55) * s, r = (0.85 - i * 0.22) * s; b.add('f', G.cone, 0x1f5a3a, x, y + 0.45 * s, z, 0, i, 0, r, 0.9 * s, r); for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2 + i; b.add('l', G.ico, LIGHTS[(k + i) % 5], x + Math.cos(a) * r * 0.8, y + 0.2 * s, z + Math.sin(a) * r * 0.8, 0, 0, 0, 0.06, 0.06, 0.06, 1.3); } }
  b.add('l', G.ico, 0xffe066, x, 2.2 * s, z, 0, 0, 0, 0.14 * s, 0.14 * s, 0.06, 1.5); for (const [dx, dz, c] of [[0.5, 0.3, 0xdc2626], [-0.4, 0.4, 0x2563eb], [0.1, -0.5, 0xa855f7]]) b.rbox('g', c, x + dx * s, 0, z + dz * s, 0.35, 0.3, 0.35); }
function wreath(b, x, y, z, ry) { b.add('f', new THREE.TorusGeometry(0.3, 0.1, 6, 14), 0x166534, x, y, z, 0, ry, 0, 1, 1, 1); b.add('g', G.ico, 0xdc2626, x + Math.sin(ry) * 0.05, y - 0.28, z + Math.cos(ry) * 0.05, 0, 0, 0, 0.09, 0.07, 0.05); }
export function buildRooms(scene) { const b = new Batch();
  // ---------- Candy's Cocoa Co. ----------
  { const r = ROOMS.cocoa = { id: 'cocoa', name: "Candy's Cocoa Co.", ox: 400, oz: 0, w: 14, d: 10, h: 4.4, wall: 0xf3dfc1, floor: 0x8a5a33 }; shell(b, scene, r); const { ox, oz } = r;
    b.box('m', 0x5b3014, ox, 0, oz - 2.6, 9, 1.1, 0.9); b.box('g', 0xfef3c7, ox, 1.1, oz - 2.6, 9.1, 0.08, 1.0); b.box('m', 0x7c4a32, ox, 0.1, oz - 2.12, 9, 0.9, 0.04); solid(ox - 4.5, oz - 3.05, ox + 4.5, oz - 2.15, 0, 1.2);
    b.box('e', 0xdbeafe, ox + 2.6, 1.18, oz - 2.6, 2.2, 0.55, 0.8); for (let i = 0; i < 8; i++) b.sph('g', [0xf472b6, 0xfacc15, 0x92400e, 0xffffff][i % 4], ox + 1.7 + (i % 4) * 0.55, 1.3, oz - 2.8 + (i >> 2) * 0.35, 0.12, 0.08, 0.12); // pastry case
    for (const k of [-1, 1]) { const mx = ox - 2 + k * 1.1; b.rbox('x', 0xc0c6cf, mx, 1.18, oz - 2.8, 0.8, 0.9, 0.55); b.cyl('x', 0xb87333, mx, 2.08, oz - 2.8, 0.12, 0.35); b.box('l', 0x4ade80, mx, 1.75, oz - 2.52, 0.3, 0.12, 0.02, 0, 0.6); } // cocoa machines
    b.cyl('x', 0xb87333, ox - 3.8, 0, oz - 4.2, 0.7, 1.9); b.cyl('m', 0x5b3014, ox - 3.8, 1.9, oz - 4.2, 0.66, 0.05); b.cyl('x', 0x9ca3af, ox - 3.8, 1.95, oz - 4.2, 0.1, 0.6); solid(ox - 4.5, oz - 4.9, ox - 3.1, oz - 3.5, 0, 2); // big cocoa vat
    for (let i = 0; i < 10; i++) mug(b, ox - 0.4 + i * 0.22, 1.15, oz - 2.35, [0xdc2626, 0xffffff, 0x16a34a][i % 3]);
    { const s = sign('COCOA MENU\nClassic 3 · Marshmallow 4 · Peppermint 4', 4.2, 1.2, { bg: '#3f2a1d', border: '#fde68a' }); s.position.set(ox + 0.6, 2.9, oz - 4.88); scene.add(s); }
    shelf(b, ox - 6.75, oz - 1.5, PI / 2, 2.6, 3, [0xdc2626, 0xfacc15, 0x92400e, 0xffffff]); solid(ox - 7, oz - 2.9, ox - 6.5, oz - 0.1, 0, 2.4); fire(b, ox + 6.6, oz + 0.8, -PI / 2, 0.85); solid(ox + 6.1, oz - 0.5, ox + 7, oz + 2.1, 0, 2.4);
    for (const [tx, tz] of [[-3.6, 1.4], [0, 2.2], [3.4, 2.6]]) { table(b, ox + tx, oz + tz); chair(b, ox + tx - 0.85, oz + tz, PI / 2); chair(b, ox + tx + 0.85, oz + tz, -PI / 2, 0x2563eb); mug(b, ox + tx + 0.15, 0.76, oz + tz, 0xdc2626); mug(b, ox + tx - 0.2, 0.76, oz + tz + 0.15, 0xffffff); }
    rug(b, ox, oz + 1.6, 7, 3.4, 0x7f1d1d, 0xfde68a); win(b, ox - 4.2, 1.9, oz + 4.88, PI); win(b, ox + 4.2, 1.9, oz + 4.88, PI); xtree(b, ox - 6.2, oz + 3.8, 1.2); solid(ox - 6.9, oz + 3.1, ox - 5.5, oz + 4.6, 0, 2);
    for (let i = 0; i < 4; i++) b.cyl('g', 0x16a34a, ox + 5.6 - i * 0.01, 0, oz - 4.3 + i * 0.01, 0.3, 0.5 - i * 0.1); b.sph('f', 0x166534, ox + 5.6, 0.9, oz - 4.3, 0.45);
    r.counter = { x: ox, z: oz - 1.4 }; r.npc = { x: ox - 0.4, z: oz - 3.4 }; r.bone = { x: ox + 3.4, z: oz + 3.6 }; r.seats = [[ox - 4.45, oz + 1.4, PI / 2], [ox + 4.25, oz + 2.6, -PI / 2]]; }
  // ---------- Snowpine Lodge ----------
  { const r = ROOMS.lodge = { id: 'lodge', name: 'Snowpine Lodge', ox: 440, oz: 0, w: 16, d: 12, h: 5.2, wall: 0x9a6b3f, ceil: 0x7a4c2b, wain: 0x5b3a24, floor: 0x6b4a2e }; shell(b, scene, r); const { ox, oz } = r;
    for (let y = 0.6; y < 5; y += 0.7) { b.box('m', 0x8a5a33, ox, y, oz - 5.86, 16, 0.08, 0.04); b.box('m', 0x8a5a33, ox - 7.86, y, oz, 0.04, 0.08, 12); b.box('m', 0x8a5a33, ox + 7.86, y, oz, 0.04, 0.08, 12); } // log lines
    fire(b, ox, oz - 5.3, 0, 1.15); solid(ox - 1.7, oz - 5.9, ox + 1.7, oz - 4.7, 0, 3.4); { const s = sign('SNOWPINE LODGE', 3, 0.5, { bg: '#1e3a5f' }); s.position.set(ox, 3.9, oz - 4.83); scene.add(s); }
    rug(b, ox, oz - 2.3, 6, 3.6, 0x1e3a5f, 0xdc2626); for (const k of [-1, 1]) { b.rbox('f', 0x7f1d1d, ox + k * 2.8, 0, oz - 2.2, 1.0, 0.5, 2.8); b.rbox('f', 0x7f1d1d, ox + k * 3.2, 0.4, oz - 2.2, 0.3, 0.7, 2.8); b.box('f', 0xfde68a, ox + k * 2.75, 0.5, oz - 1.6, 0.5, 0.35, 0.15); solid(ox + k * 2.8 - 0.6, oz - 3.6, ox + k * 2.8 + 0.6, oz - 0.8, 0, 0.9); }
    b.rbox('m', 0x6b3f22, ox, 0, oz - 2.2, 1.6, 0.45, 1.0); mug(b, ox - 0.3, 0.45, oz - 2.2); mug(b, ox + 0.3, 0.45, oz - 2.0, 0x16a34a); b.box('m', 0x1e3a5f, ox + 0.1, 0.45, oz - 2.5, 0.5, 0.06, 0.35); solid(ox - 0.8, oz - 2.7, ox + 0.8, oz - 1.7, 0, 0.5);
    shelf(b, ox - 7.55, oz - 2.5, PI / 2, 3.6, 3, [0x7f1d1d, 0x1e3a5f, 0x166534, 0xb45309]); solid(ox - 7.8, oz - 4.4, ox - 7.3, oz - 0.6, 0, 2.4);
    // Torty's warm window seat (east wall): golden window, cushions, candle, little side table with cocoa
    win(b, ox + 7.88, 2.2, oz - 1.2, -PI / 2, 2.4, 1.7, 0xffc870); b.box('m', 0x6b3f22, ox + 7.1, 0, oz - 1.2, 1.4, 0.55, 3.0); b.rbox('f', 0xb91c1c, ox + 7.1, 0.55, oz - 1.2, 1.3, 0.2, 2.9); b.rbox('f', 0xfde68a, ox + 7.55, 0.75, oz - 2.3, 0.3, 0.5, 0.6); solid(ox + 6.4, oz - 2.7, ox + 7.9, oz + 0.3, 0, 0.8);
    b.cyl('m', 0x6b3f22, ox + 5.9, 0, oz + 0.9, 0.35, 0.6); mug(b, ox + 5.9, 0.6, oz + 0.9, 0xdc2626); b.cyl('g', 0xfff7ed, ox + 7.3, 0.75, oz + 0.05, 0.06, 0.25); b.add('l', G.cone, 0xffc870, ox + 7.3, 1.08, oz + 0.05, 0, 0, 0, 0.04, 0.12, 0.04, 1.6);
    // cider bar (SW) + game corner with cabinet #52 (SE)
    b.box('m', 0x5b3a24, ox - 5.6, 0, oz + 3.6, 3.4, 1.1, 0.8); b.box('g', 0xb45309, ox - 5.6, 1.1, oz + 3.6, 3.5, 0.07, 0.9); b.cyl('x', 0xb87333, ox - 6.6, 1.17, oz + 3.6, 0.3, 0.6); for (let i = 0; i < 5; i++) mug(b, ox - 5.8 + i * 0.3, 1.17, oz + 3.6, 0xb45309); solid(ox - 7.3, oz + 3.2, ox - 3.9, oz + 4.0, 0, 1.2);
    { const s = sign('HOT CIDER', 1.6, 0.4, { bg: '#7c2d12' }); s.position.set(ox - 5.6, 1.6, oz + 4.02); scene.add(s); }
    const cx = ox + 6.2, cz = oz + 4.6; b.rbox('g', 0x1e3a8a, cx, 0, cz, 1.3, 2.2, 0.9); b.box('l', 0x7dd3fc, cx, 1.25, cz - 0.46, 1.0, 0.75, 0.02, 0, 0.9); b.box('g', 0x111827, cx, 0.85, cz - 0.55, 1.1, 0.12, 0.3); b.sph('g', 0xdc2626, cx - 0.25, 0.97, cz - 0.6, 0.06); b.sph('g', 0xfacc15, cx + 0.2, 0.95, cz - 0.6, 0.05);
    { const s = sign('#52 SLED DASH', 1.25, 0.32, { bg: '#1e3a8a', border: '#7dd3fc' }); s.position.set(cx, 2.0, cz - 0.47); s.rotation.y = PI; scene.add(s); } solid(cx - 0.65, cz - 0.45, cx + 0.65, cz + 0.45, 0, 2.2);
    xtree(b, ox - 6.4, oz - 4.6, 1.5); solid(ox - 7.4, oz - 5.6, ox - 5.4, oz - 3.6, 0, 3);
    for (const k of [-1, 1]) { b.box('m', 0x2563eb, ox + 7.8, 2.6, oz + 2.6 + k * 0.3, 0.06, 1.8, 0.14, 0, 0); b.box('m', 0xdc2626, ox + 7.8, 2.6 + 0.4, oz + 3.6 + k * 0.25, 0.06, 0.8, 0.5); } // skis + snowshoes
    for (const [tx, tz] of [[-2.4, 2.8], [1.8, 3.4]]) { table(b, ox + tx, oz + tz, 0x6b3f22); chair(b, ox + tx - 0.85, oz + tz, PI / 2, 0x166534); chair(b, ox + tx + 0.85, oz + tz, -PI / 2, 0x166534); mug(b, ox + tx, 0.76, oz + tz); }
    r.cab = { x: cx, z: cz - 1.4 }; r.torty = { x: ox + 7.0, z: oz - 1.2 }; r.fire = { x: ox, z: oz - 3.8 }; r.cider = { x: ox - 5.6, z: oz + 2.6 }; r.bone = { x: ox - 7, z: oz + 1.2 }; r.seats = [[ox - 3.25, oz + 2.8, PI / 2], [ox + 2.65, oz + 3.4, -PI / 2]]; }
  // ---------- Hill Shack (Snowie's sled workshop) ----------
  { const r = ROOMS.shack = { id: 'shack', name: 'Hill Shack', ox: 480, oz: 0, w: 11, d: 8, h: 3.8, wall: 0xd7c3a0, floor: 0x7a5a3a }; shell(b, scene, r); const { ox, oz } = r;
    b.box('m', 0x6b3f22, ox, 0, oz - 3.3, 5, 1.0, 1.0); b.box('m', 0x8a5a33, ox, 1.0, oz - 3.3, 5.1, 0.08, 1.05); b.box('m', 0xc8a97a, ox, 1.3, oz - 3.88, 5, 1.6, 0.05); solid(ox - 2.5, oz - 3.9, ox + 2.5, oz - 2.75, 0, 1.1); // workbench + pegboard
    for (let i = 0; i < 8; i++) b.box('x', [0xdc2626, 0x9ca3af, 0x2563eb, 0xfacc15][i % 4], ox - 2.1 + i * 0.6, 1.6 + (i % 2) * 0.4, oz - 3.84, 0.08, 0.55, 0.05); b.rbox('x', 0xdc2626, ox + 1.6, 1.08, oz - 3.3, 0.8, 0.35, 0.4); b.box('m', 0xfef3c7, ox - 1.2, 1.08, oz - 3.2, 0.4, 0.15, 0.25);
    for (let i = 0; i < 3; i++) { const z = oz - 2.4 + i * 1.6, c = [0xdc2626, 0x2563eb, 0x16a34a][i]; b.box('x', 0x6b7280, ox - 5.2, 0.6 + i * 0.05, z, 0.1, 0.06, 1.4); b.box('m', 0x9a6b3f, ox - 5.0, 0.2, z, 0.25, 1.6, 1.2); b.box('g', c, ox - 4.88, 0.25, z, 0.05, 1.5, 1.25); } solid(ox - 5.5, oz - 3.2, ox - 4.7, oz + 1.6, 0, 1.8); // sled rack
    b.box('m', 0x6b3f22, ox + 4.6, 0, oz - 1.5, 1.0, 0.9, 2.2); for (let i = 0; i < 4; i++) b.rbox('g', [0x60a5fa, 0xf472b6, 0xfacc15, 0x4ade80][i], ox + 4.6, 0.9, oz - 2.3 + i * 0.5, 0.35, 0.18, 0.3); solid(ox + 4.1, oz - 2.6, ox + 5.1, oz - 0.4, 0, 1); // wax station
    { const s = sign('SLED WAX', 1.0, 0.3, { bg: '#0e7490' }); s.position.set(ox + 5.33, 1.6, oz - 1.5); s.rotation.y = -PI / 2; scene.add(s); }
    b.cyl('x', 0x1f2937, ox + 4.4, 0, oz + 2.4, 0.5, 1.1); b.add('l', G.box, 0xff8a2a, ox + 4.4, 0.5, oz + 1.9, 0, 0, 0, 0.4, 0.25, 0.03, 1.2); b.cyl('x', 0x374151, ox + 4.4, 1.1, oz + 2.4, 0.14, 2.7); solid(ox + 3.9, oz + 1.9, ox + 4.9, oz + 2.9, 0, 3);
    b.box('m', 0x6b3f22, ox, 2.1, oz - 3.88, 0.1, 0.1, 0.1); b.box('m', 0x7a4a2a, ox + 5.2, 1.4, oz + 0.8, 0.5, 0.06, 2.0); b.box('m', 0x7a4a2a, ox + 5.2, 2.1, oz + 0.8, 0.5, 0.06, 2.0); // trophy shelves (cups appear as you win)
    { const s = sign('SLED HILL RACES', 2.2, 0.5, { bg: '#b91c1c' }); s.position.set(ox - 2.2, 2.6, oz + 3.88); s.rotation.y = PI; scene.add(s); } win(b, ox + 2.6, 1.9, oz + 3.88, PI, 1.3, 1.0); win(b, ox - 5.38, 2.4, oz + 2.8, PI / 2, 1.0, 0.8);
    for (let i = 0; i < 3; i++) b.box('g', [0x111827, 0x7c3aed, 0x0ea5e9][i], ox - 3.6 + i * 0.5, 0, oz + 3.6, 0.3, 1.5, 0.06, 0.15); rug(b, ox, oz + 0.5, 4, 2.4, 0x334155, 0x0ea5e9);
    r.bench = { x: ox, z: oz - 2.0 }; r.npc = { x: ox - 0.6, z: oz - 3.9 + 0.2 }; r.wax = { x: ox + 3.6, z: oz - 1.5 }; r.board = { x: ox - 2.2, z: oz + 2.7 }; r.trophy = { x: ox + 5.2, z: oz + 0.8 }; r.bone = { x: ox + 4.6, z: oz + 0.2 }; }
  // ---------- Tree Lot hut ----------
  { const r = ROOMS.lot = { id: 'lot', name: 'Tree Lot hut', ox: 520, oz: 0, w: 7, d: 6, h: 3.2, wall: 0xe5d3b3, floor: 0x7a5a3a }; shell(b, scene, r); const { ox, oz } = r;
    b.box('m', 0x14532d, ox, 0, oz - 1.8, 4, 1.0, 0.8); b.box('m', 0xb45309, ox, 1.0, oz - 1.8, 4.1, 0.07, 0.85); b.rbox('x', 0x9ca3af, ox + 1.2, 1.07, oz - 1.9, 0.6, 0.35, 0.4); solid(ox - 2, oz - 2.2, ox + 2, oz - 1.4, 0, 1.1);
    for (let k = 0; k < 3; k++) { const bx = ox - 2.6 + k * 0.9; b.box('m', 0x8a5a33, bx, 0, oz + 1.8, 0.8, 0.5, 0.6); for (let i = 0; i < 6; i++) b.sph('g', LIGHTS[(i + k) % 5], bx - 0.25 + (i % 3) * 0.25, 0.55, oz + 1.65 + (i >> 1 & 1) * 0.25, 0.1); } solid(ox - 3.1, oz + 1.5, ox - 0.4, oz + 2.1, 0, 0.6);
    for (const x of [-2.4, -1.2, 0, 1.2, 2.4]) wreath(b, ox + x, 2.3, oz - 2.86, 0); xtree(b, ox + 2.6, oz + 1.6, 1.0); solid(ox + 2.0, oz + 1.0, ox + 3.3, oz + 2.4, 0, 2);
    b.cyl('x', 0x1f2937, ox - 3.0, 0, oz - 2.2, 0.35, 0.8); b.add('l', G.box, 0xff8a2a, ox - 3.0, 0.35, oz - 1.84, 0, 0, 0, 0.3, 0.2, 0.03, 1.2); solid(ox - 3.4, oz - 2.6, ox - 2.6, oz - 1.8, 0, 1);
    win(b, ox + 1.8, 1.6, oz + 2.88, PI, 1.1, 0.9); { const s = sign('WREATHS · ORNAMENTS', 2.6, 0.4, { bg: '#14532d' }); s.position.set(ox, 2.75, oz - 2.87); scene.add(s); }
    r.counter = { x: ox, z: oz - 0.6 }; r.npc = { x: ox - 0.5, z: oz - 2.6 }; r.bone = { x: ox - 1.8, z: oz + 0.9 }; }
  b.finish(scene, true);
  return ROOMS; }
