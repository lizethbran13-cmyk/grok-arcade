// TORTUGA TECH INC.: Torty's own company. "We test it. We make it tougher. (We know durability: we have shells.)"
// A big walk-in HQ (lobby with the shell logo, CEO office, drop tower lab, crush press lab, heat + sand-blast chamber, shell-armor workshop)
// plus an outdoor Toughness Test Yard with live, cartoony tests and a Ratita Industries gadget corner. Real 3D geometry only.
import * as THREE from 'three';
import * as K from './kit.js';
import { building, tortStatue, claypot, tcrate, shade, SUN, sunShell } from './town.js';
const { wall, D, sign3d, rbox, rcyl, lathe, sph, cyl, cone, torus, capsule, tube, star, heart, blobGeo, pick } = K;
const R = K.R, PI = Math.PI, FL = 0.12, TEAL = 0x0f9d8a, SHELLC = [0x6e4524, 0xb98545, 0xd1a05e], HZ = 0xfacc15;
const art = (w, axis, at, c, y, W, H, side, k) => K.PR.frame(K.scaled(w, 0, FL, 0, 0.25), axis, (at + side * 0.25) / 0.25, c / 0.25, y / 0.25, W / 0.25, H / 0.25, side, k);
// the Tortuga Tech logo: a domed shell with hex scutes and a little bolt (3D, any size)
export function logo(w, x, y, z, s = 1, ry = 0, flat = false) { const T = w.tf(x, y, z, ry, s);
  T.add('g', lathe([[0, 0], [1.0, 0], [0.96, 0.28], [0.75, 0.6], [0.4, 0.8], [0, 0.86]], 40, 'ttDome'), SHELLC[0], 0, 0, 0, flat ? PI / 2 : 0, 0, 0, 1, 1, flat ? 0.5 : 1);
  const sc = (px, py, r, c) => flat ? T.add('g', new THREE.CylinderGeometry(r, r, 0.12, 6), c, px, py, 0.42, PI / 2, 0, 0) : T.add('g', new THREE.CylinderGeometry(r, r * 0.9, 0.12, 6), c, px, 0.62 + py, 0, 0, 0, 0);
  if (flat) { sc(0, 0.45, 0.24, SHELLC[2]); [[-0.42, 0.28], [0.42, 0.28], [-0.25, 0.68], [0.25, 0.68], [-0.62, 0.05], [0.62, 0.05]].forEach(([a, b], i) => sc(a, b, 0.17, i % 2 ? SHELLC[1] : SHELLC[2])); T.add('l', rbox(0.1, 0.36, 0.06, 0.02), 0xffd23f, 0.0, 0.45, 0.5, 0, 0, 0.4, 1, 1, 1, 0.5); }
  else { sc(0, 0.22, 0.26, SHELLC[2]); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; T.add('g', new THREE.CylinderGeometry(0.2, 0.2, 0.1, 6), i % 2 ? SHELLC[1] : SHELLC[2], Math.cos(a) * 0.5, 0.58, Math.sin(a) * 0.5, Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); } T.add('l', rbox(0.1, 0.4, 0.06, 0.02), 0xffd23f, 0, 1.0, 0, 0, 0, 0.4, 1, 1, 1, 0.6); }
  T.add('x', torus(0.04, 48), TEAL, 0, flat ? 0.0 : 0.02, flat ? 0.3 : 0, flat ? 0 : PI / 2, 0, 0, 1.02, 1.02, 1.6); return T; }
const lowDesk = (w, x, z, ry, L = 2.4, Dp = 1.1, H = 0.55, top = 0xc58b52) => { const T = w.tf(x, FL, z, ry); T.slab('m', top, 0, H - 0.08, 0, L, 0.08, Dp, 0.03); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => T.add('m', cyl(8), shade(top, 0.7), a * (L / 2 - 0.12), 0, b * (Dp / 2 - 0.12), 0, 0, 0, 0.05, H - 0.08, 0.05)); T.solid(-L / 2, 0, -Dp / 2, L / 2, H, Dp / 2); return T; };
const gauge = (w, x, y, z, ry, c = 0x22c55e) => { const T = w.tf(x, y, z, ry); T.add('x', rcyl(0.28, 0.08, 0.02, 24), 0x475569, 0, 0, 0, PI / 2, 0, 0); T.add('g', rcyl(0.24, 0.02, 0.01, 24), 0xffffff, 0, 0, 0.05, PI / 2, 0, 0); T.add('g', rbox(0.03, 0.2, 0.02, 0.01), c, 0.05, 0.05, 0.07, 0, 0, -0.7); for (let k = 0; k < 5; k++) { const a = -2.2 + k * 1.1; T.add('g', rbox(0.02, 0.05, 0.01, 0.005), k > 3 ? 0xef4444 : 0x334155, Math.sin(a) * 0.18, Math.cos(a) * 0.18, 0.07, 0, 0, -a); } };
const panel = (w, x, z, ry, cols = SUN) => { const T = w.tf(x, FL, z, ry); T.slab('x', 0x94a3b8, 0, 0, 0, 1.4, 1.0, 0.6, 0.06); T.add('x', rbox(1.4, 0.08, 0.7, 0.03), 0x475569, 0, 1.05, 0.05, -0.4, 0, 0); for (let k = 0; k < 6; k++) T.add('l', sph(10), cols[k % cols.length], -0.5 + k * 0.2, 1.1, 0.12, 0, 0, 0, 0.06, 0.04, 0.06, 0.6); T.add('g', rcyl(0.1, 0.1, 0.03, 16), 0xef4444, 0.45, 1.12, -0.08, -0.4, 0, 0); T.solid(-0.7, 0, -0.3, 0.7, 1.1, 0.3); return T; };
const armorPlate = (w, x, y, z, s, col, rx = 0, ry = 0) => { w.add('g', new THREE.CylinderGeometry(1, 0.92, 0.18, 6), col, x, y, z, rx, ry, 0, s, s, s); w.add('x', sph(8), 0xcbd5e1, x, y + 0.1 * s, z, rx, ry, 0, 0.08 * s * 2, 0.04 * s * 2, 0.08 * s * 2); };
const gadget = (w, kind, x, y, z, s = 1, ry = 0) => { const T = w.tf(x, y, z, ry, s);
  if (kind === 'goggles') { [-1, 1].forEach((k) => { T.add('x', torus(0.25, 24), 0x6b7280, k * 0.22, 0.2, 0, 0, 0, 0, 0.18, 0.18, 0.2); T.add('e', rcyl(0.16, 0.04, 0.01, 20), 0x3ff0ff, k * 0.22, 0.2, 0, PI / 2, 0, 0); }); T.add('f', torus(0.1, 24, PI), 0x7c3aed, 0, 0.2, -0.05, 0, 0, 0, 0.45, 0.3, 0.3); }
  if (kind === 'wheel') { T.add('m', torus(0.35, 28), 0x1f2937, 0, 0.35, 0, 0, 0, 0, 0.32, 0.32, 0.5); T.add('x', rcyl(0.16, 0.2, 0.04, 20), 0xffd23f, 0, 0.35, 0, PI / 2, 0, 0); for (let k = 0; k < 5; k++) T.add('x', rbox(0.04, 0.24, 0.04, 0.01), 0xcbd5e1, 0, 0.35, 0, k / 5 * PI * 2, 0, 0); T.add('l', cone(10), 0xff8a3d, 0, 0.35, -0.3, -PI / 2, 0, 0, 0.1, 0.2, 0.1, 0.6); }
  if (kind === 'popper') { T.add('g', cone(20), 0xff5d8f, 0, 0.0, 0, 0, 0, 0, 0.16, 0.5, 0.16); for (let k = 0; k < 8; k++) T.add('g', sph(6), SUN[k], Math.cos(k) * 0.12, 0.55 + (k % 3) * 0.06, Math.sin(k) * 0.12, 0, 0, 0, 0.04); T.add('g', torus(0.2, 16), 0xffffff, 0, 0.1, 0, PI / 2, 0, 0, 0.13, 0.13, 0.13); }
  return T; };
export function tortuga(w) { const I = w.I, S = w.spots; S.tt = {};
  const x0 = 60, x1 = 96, z0 = -68, z1 = -42, H = 6.4;
  building(w, { id: 'tortuga', x0, z0, x1, z1, ceil: H, ext: 0xf3d9b0, int: 0xf8f4ec, band: TEAL, floor: ['tile', 0xf1f5f9, 0xccfbf1, 1.6], door: { side: 's', a: 76, b: 80, h: 4.4 }, winTop: 4.8, winBot: 1.3, curtain: TEAL, li: 34, lightCol: 0xf2fbff, style: 'flat', noPots: true, sign: ['TORTUGA TECH INC.', 0.5, 0xffffff, TEAL] });
  w.region = 'shell'; logo(w, 70.5, 6.0, z1 + 0.35, 1.6, 0, true); logo(w, 85.5, 6.0, z1 + 0.35, 1.6, 0, true); // big shell logos on the facade
  for (let i = 0; i < 5; i++) w.add('g', new THREE.CylinderGeometry(0.9, 0.9, 0.12, 6), [SHELLC[1], TEAL, SHELLC[2], 0xffb020, SHELLC[1]][i], x0 + 4 + i * 7, H + 0.55, z1 - 2, 0, 0, 0); // roof solar "scutes"
  w.region = 'tortuga'; const wc = 0xf8f4ec, opt = { th: 0.2, frame: TEAL };
  // partitions: Drop Lab | Lobby | Heat Chamber (front), Crush Lab | Armor Workshop | CEO office (back)
  wall(w, 'z', 70, -56, -42.2, H - 0.1, wc, [D(-50.2, -47.8, 3.4)], opt); wall(w, 'z', 87, -56, -42.2, H - 0.1, wc, [D(-50.2, -47.8, 3.4)], opt);
  wall(w, 'x', -56, x0 + 0.2, x1 - 0.2, H - 0.1, wc, [D(63.6, 66.4, 3.4), D(76.6, 79.4, 3.4), D(84.4, 86.6, 3.4)], opt);
  wall(w, 'z', 72, -67.8, -56, H - 0.1, wc, [], opt); wall(w, 'z', 84, -67.8, -56, H - 0.1, wc, [], opt);
  [['DROP TOWER LAB', 65, 0xef4444], ['SHELL-ARMOR WORKSHOP', 78, TEAL], ['CEO', 85.5, 0xffb020]].forEach(([t, x, c]) => sign3d(w, t, x, 3.9, -55.8, 0, 0.17, 0xffffff, c));
  sign3d(w, 'TEST LABS', 70.15, 3.9, -49, PI / 2, 0.16, 0xffffff, 0xef4444); sign3d(w, 'HEAT + SAND LAB', 86.85, 3.9, -49, -PI / 2, 0.15, 0xffffff, 0xff8a3d); sign3d(w, 'CRUSH PRESS', 65, 3.9, -56.2, PI, 0.16, 0xffffff, 0x7c3aed);
  // ================= LOBBY (70..87, -56..-42)
  { const cx = 78.5; // giant 3D shell logo on a turning plinth + "TORTUGA TECH INC." + motto
    w.add('m', rcyl(2.0, 0.5, 0.15, 40), 0xe2e8f0, cx, FL, -50.5); w.add('x', torus(0.03, 48), TEAL, cx, FL + 0.5, -50.5, PI / 2, 0, 0, 2.0, 2.0, 2); logo(w, cx, FL + 0.5, -50.5, 1.6, 0.3); w.solid(cx - 2, 0, -52.5, cx + 2, 1.9, -48.5);
    sign3d(w, 'TORTUGA TECH INC.', cx, 4.6, -55.75, 0, 0.36, 0xffffff, TEAL); sign3d(w, 'WE MAKE IT TOUGHER', cx, 4.05, -55.75, 0, 0.18, 0x7c2d12, 0xfef3c7);
    // reception desk (low, curved front, for a tortoise receptionist) + bell, monitor, mini cactus
    const T = w.tf(cx, FL, -44.6, 0); for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.225; T.add('g', rbox(0.62, 0.75, 0.25, 0.06), i % 2 ? TEAL : 0x14b8a6, Math.sin(a) * 2.6, 0, Math.cos(a) * -1.2 + 1.2, 0, a, 0); } T.add('g', rbox(4.8, 0.08, 0.7, 0.03), 0xfef3c7, 0, 0.8, 0.0); T.solid(-2.5, 0, -0.5, 2.5, 0.85, 0.6);
    K.monitor(w, null, cx - 1.2, FL + 0.84, -44.6, 0.3); w.add('x', lathe([[0, 0], [0.12, 0], [0.1, 0.06], [0.02, 0.12], [0, 0.13]], 16, 'bell'), 0xffd23f, cx + 1.1, FL + 0.84, -44.4); claypot(w, cx + 1.8, -44.4, 0.35, TEAL, 'cactus', FL + 0.84);
    // waiting area: sofas, coffee table with "TOUGH TIMES" magazines, plants, water cooler, vending
    K.sofa(w, 72.6, -47.5, PI / 2, 0xffb020, 0xffd23f); K.sofa(w, 72.6, -52.5, PI / 2, TEAL, 0x5eead4); { const T2 = w.tf(74.3, FL, -50, 0); T2.slab('m', 0xc58b52, 0, 0.36, 0, 1.0, 0.08, 2.4, 0.03); T2.solid(-0.5, 0, -1.2, 0.5, 0.44, 1.2); for (let k = 0; k < 3; k++) T2.add('g', rbox(0.34, 0.03, 0.46, 0.01), SUN[k + 3], 0, 0.45 + k * 0.03, -0.6 + k * 0.5, 0, k * 0.3, 0); }
    K.plant(w, 71, -43, 1.2); K.plant(w, 86, -43, 1.2); K.plant(w, 71, -55, 1.0); K.cooler(w, 86.2, -54.8); K.vending(w, 86.2, -52.6, -PI / 2, TEAL);
    // trophy wall: durability awards + "tested & tough" product pedestals (dented vs. armored)
    for (let i = 0; i < 4; i++) { const px = 82 + (i % 2) * 2.2, pz = -46.5 - Math.floor(i / 2) * 2.4; w.add('m', rbox(0.9, 1.0, 0.9, 0.08), 0xffffff, px, FL + 0.5, pz); w.add('e', rbox(0.84, 0.8, 0.84, 0.04), 0xe0f7ff, px, FL + 1.4, pz); w.solid(px - 0.45, 0, pz - 0.45, px + 0.45, 1.8, pz + 0.45);
      if (i === 0) { w.add('x', lathe([[0, 0], [0.2, 0], [0.08, 0.1], [0.08, 0.3], [0.25, 0.5], [0, 0.55]], 20, 'cup2'), 0xffd23f, px, FL + 1.0, pz); } else if (i === 1) gadget(w, 'wheel', px, FL + 1.02, pz, 0.9); else if (i === 2) { armorPlate(w, px, FL + 1.25, pz, 0.28, SHELLC[1], PI / 2); } else { w.add('x', blobGeo(5, 0.35, 1), 0x94a3b8, px, FL + 1.2, pz, 0, 0, 0, 0.25, 0.14, 0.25); } }
    sign3d(w, 'TESTED & TOUGH', 83.1, 2.6, -44.1, 0, 0.13, 0xffffff, 0x0f766e);
    art(w, 'x', -42, 73.2, 3.6, 1.6, 1.1, -1, 3); art(w, 'x', -42, 83.8, 3.6, 1.6, 1.1, -1, 5);
    K.rug(w, cx, -48.2, 0, 7.2, 3.0, TEAL, 0xfef3c7); }
  // ================= DROP TOWER LAB (60..70, -56..-42)
  { const cx = 65, cz = -49; S.tt.drop = [cx, FL, cz]; K.hazard(w, cx, cz, 4.2, 4.2);
    [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]].forEach(([a, b]) => { w.add('x', rbox(0.22, H - 0.3, 0.22, 0.04), 0xef4444, cx + a, FL + (H - 0.3) / 2, cz + b); w.solid(cx + a - 0.15, 0, cz + b - 0.15, cx + a + 0.15, H, cz + b + 0.15); });
    for (let k = 0; k < 3; k++) w.add('x', rbox(3.04, 0.14, 0.14, 0.03), 0xfacc15, cx, FL + 1.8 + k * 1.6, cz - 1.4), w.add('x', rbox(3.04, 0.14, 0.14, 0.03), 0xfacc15, cx, FL + 1.8 + k * 1.6, cz + 1.4);
    w.add('m', rbox(2.4, 0.3, 2.4, 0.12), 0x3b82f6, cx, FL + 0.15, cz); w.add('f', rbox(2.2, 0.15, 2.2, 0.08), 0x60a5fa, cx, FL + 0.37, cz); w.solid(cx - 1.2, 0, cz - 1.2, cx + 1.2, 0.45, cz + 1.2);
    for (let k = 0; k < 7; k++) w.add('g', rbox(0.08, 0.02, 0.04, 0.01), 0x111827, cx + 1.52, FL + 0.6 + k * 0.8, cz - 1.4); sign3d(w, 'DROP HEIGHT', cx + 1.55, 3.4, cz - 1.0, PI / 2, 0.1, 0xffffff, 0x111827);
    panel(w, 61.4, -44.2, PI * 0.75); K.monitor(w, null, 61.6, FL + 1.1, -44.6, 0.8, 0x4ade80); gauge(w, 60.25, 2.6, -47, PI / 2, 0x22c55e); gauge(w, 60.25, 2.6, -48.2, PI / 2, 0xef4444);
    K.shelf(w, 60.6, -53.5, PI / 2, 3.0, 2.4); for (let k = 0; k < 6; k++) tcrate(w, 60.8, FL + 0.1 + Math.floor(k / 3) * 1.1, -54.6 + (k % 3) * 1.0, 0.45, pick([0xd8a15a, 0xc58b52]), 'none');
    [[68.6, -54.6, 0xef4444], [67.6, -55, 0x3b82f6], [68.8, -43.4, 0xffd23f]].forEach(([x, z, c]) => K.PR.ball(K.scaled(w, x, FL, z, 0.12), 0, 2.2, 0, 2.2, c, 0xffffff));
    K.cone3(w, 62.4, -51.8); K.cone3(w, 67.6, -51.9); I({ kind: 'fun', x: cx, y: 0, z: cz + 2.6, r: 2.2, label: '⬇️ Watch the drop test', sfx: 'splat', msgs: ['⬇️ CLONK! The armored shell box: not a scratch. ✅', '⬇️ BOING! The rubber lettuce bounced 3 times. ✅', '⬇️ THUNK! A pillow fell. Engineers clap politely.', '⬇️ Drop #4,082: still tough. 🐢'] }); sunShell(w, 69.2, FL + 2.4, -55.2); }
  // ================= HEAT + SAND-BLAST CHAMBER (87..96, -56..-42)
  { const cx = 92.2, cz = -50; S.tt.blast = [cx, FL + 1.6, cz];
    // glass chamber with glowing heater coils, a sand-blast nozzle, a test shell on a turntable
    w.add('x', rbox(4.6, 0.2, 4.0, 0.06), 0x475569, cx, FL + 0.1, cz); w.add('x', rbox(4.6, 0.2, 4.0, 0.06), 0x475569, cx, FL + 3.4, cz); [[-2.2, -1.9], [2.2, -1.9], [-2.2, 1.9], [2.2, 1.9]].forEach(([a, b]) => w.add('x', rbox(0.18, 3.3, 0.18, 0.04), 0x64748b, cx + a, FL + 1.75, cz + b));
    w.add('e', rbox(4.4, 3.1, 0.06, 0.02), 0xd8f3ff, cx, FL + 1.75, cz - 1.9); w.add('e', rbox(4.4, 3.1, 0.06, 0.02), 0xd8f3ff, cx, FL + 1.75, cz + 1.9); w.add('e', rbox(0.06, 3.1, 3.7, 0.02), 0xd8f3ff, cx - 2.2, FL + 1.75, cz); w.solid(cx - 2.3, 0, cz - 2.0, cx + 2.3, 3.6, cz + 2.0, { glass: true });
    for (let k = 0; k < 5; k++) w.add('l', torus(0.18, 24), k % 2 ? 0xff6b35 : 0xffb020, cx + 1.9, FL + 0.8 + k * 0.5, cz, 0, PI / 2, 0, 0.35, 0.35, 0.35, 0.9);
    w.add('x', rcyl(0.8, 0.2, 0.05, 28), 0x94a3b8, cx, FL + 0.3, cz); w.add('g', lathe([[0, 0], [0.7, 0], [0.65, 0.25], [0.45, 0.5], [0, 0.58]], 28, 'tshell'), SHELLC[1], cx, FL + 0.5, cz); w.add('x', cyl(12), 0x334155, cx - 1.4, FL + 2.6, cz, 0, 0, -0.9, 0.12, 1.0, 0.12); w.add('x', cone(12), 0x111827, cx - 0.75, FL + 2.15, cz, 0, 0, -0.9 + PI, 0.16, 0.3, 0.16);
    sign3d(w, 'HOT! (BUT FRIENDLY)', cx, 3.9, cz - 1.95, 0, 0.12, 0xffffff, 0xef4444); panel(w, 88.6, -45, -PI / 2, [0xef4444, 0xff8a3d, 0xffd23f]); gauge(w, 95.75, 2.4, -44.2, -PI / 2, 0xef4444); K.PR.towelRoll && 0;
    for (let k = 0; k < 4; k++) w.add('m', lathe([[0, 0], [0.32, 0], [0.34, 0.6], [0.3, 0.7], [0, 0.7]], 18, 'sandbag'), 0xe9c48f, 88.4 + k * 0.75, FL, -55.2); w.add('m', blobGeo(4, 0.25, 1), 0xf0cf98, 90, FL, -54.4, 0, 0, 0, 1.0, 0.3, 0.6);
    K.shelf(w, 95.4, -44.8, -PI / 2, 2.4, 2.2, 0.6, 0x64748b); for (let k = 0; k < 6; k++) K.beaker(w, 95.3, FL + 0.95 + Math.floor(k / 3) * 0.7, -45.6 + (k % 3) * 0.7, [0xff6b35, 0xffd23f, 0xef4444][k % 3]);
    I({ kind: 'fun', x: cx - 2.8, y: 0, z: cz, r: 2.2, label: '🔥 Peek into the heat chamber', sfx: 'click', msgs: ['🔥 120° and the shell is just… relaxing. Like a spa day.', '🌪️ Sand-blast test: 3 hours of desert wind. Shell rating: shiny!', '🔥 The marshmallow control sample did NOT pass.'] }); }
  // ================= CRUSH PRESS LAB (60..72, -68..-56)
  { const cx = 66, cz = -62.5; S.tt.press = [cx, FL, cz]; K.hazard(w, cx, cz, 4.6, 4.0);
    [-1.9, 1.9].forEach((a) => { w.add('x', rbox(0.5, H - 0.4, 0.8, 0.08), 0x7c3aed, cx + a, FL + (H - 0.4) / 2, cz); w.solid(cx + a - 0.25, 0, cz - 0.4, cx + a + 0.25, H, cz + 0.4); });
    w.add('x', rbox(4.4, 0.6, 1.2, 0.12), 0x6d28d9, cx, H - 0.6, cz); w.add('x', cyl(20), 0xcbd5e1, cx, H - 2.0, cz, 0, 0, 0, 0.32, 1.4, 0.32); w.add('x', rbox(3.2, 0.5, 2.6, 0.1), 0x475569, cx, FL + 0.25, cz); w.solid(cx - 1.6, 0, cz - 1.3, cx + 1.6, 0.5, cz + 1.3);
    K.pipes(w, 'z', 60.3, -67.6, -56.4, 5.6, [0xef4444, 0x3b82f6, 0xfacc15]); panel(w, 70.6, -59, -PI / 2, [0xa855f7, 0x22c55e, 0xffd23f]); gauge(w, 61.6, 3.0, -67.75, 0, 0xa855f7); sign3d(w, 'SQUISH-O-METER', 61.6, 3.6, -67.75, 0, 0.1, 0xffffff, 0x7c3aed);
    // squished vs survived: flattened cans, a pancaked cardboard box, a perfectly fine shell-armored box
    for (let k = 0; k < 4; k++) w.add('x', rcyl(0.18, 0.05, 0.02, 16), pick([0xef4444, 0x22c55e, 0x3b82f6]), 69.6 + (k % 2) * 0.5, FL + 0.03, -66.8 + Math.floor(k / 2) * 0.5, 0, 0, 0); w.add('m', rbox(1.2, 0.12, 1.2, 0.02), 0xc9a06a, 61.6, FL + 0.06, -66.4, 0, 0.3, 0);
    { const T = w.tf(62.2, FL, -58.4, 0); T.slab('m', 0xb98545, 0, 0, 0, 1.0, 0.9, 1.0, 0.1); for (let k = 0; k < 4; k++) T.add('g', new THREE.CylinderGeometry(0.22, 0.2, 0.06, 6), SHELLC[k % 3], -0.25 + (k % 2) * 0.5, 0.5 + Math.floor(k / 2) * 0.3, 0.52, PI / 2, 0, 0); T.solid(-0.5, 0, -0.5, 0.5, 0.9, 0.5); }
    sign3d(w, 'SURVIVED 9000 SQUISHES', 62.2, 1.4, -57.85, 0, 0.07, 0x111827, 0xfef3c7); I({ kind: 'fun', x: cx, y: 0, z: cz + 2.4, r: 2.2, label: '🗜️ Watch the crush press', sfx: 'door', msgs: ['🗜️ SQUISH… nope! The shell-armored gadget pushes back. ✅', '🗜️ The grape did not make it. RIP grape. 🍇', '🗜️ 9,001 squishes. Still tough!'] }); sunShell(w, 71.2, FL + 0.6, -67.2); }
  // ================= SHELL-ARMOR WORKSHOP (72..84, -68..-56): the "Make It Tougher" station
  { K.labBench(w, 75.5, -64.5, 0, 3.6); K.labBench(w, 80.5, -64.5, 0, 3.6); K.PR.pegboard(K.scaled(w, 0, FL, 0, 0.25), 'x', -67.8 / 0.25, 78 / 0.25, 1.2 / 0.25, 10 / 0.25, 2.2 / 0.25, 1);
    // rack of colourful shell-armor plates (hex scutes in every colour)
    for (let k = 0; k < 15; k++) armorPlate(w, 72.7, FL + 0.8 + Math.floor(k / 5) * 0.8, -66.6 + (k % 5) * 0.75, 0.3, [SHELLC[1], TEAL, 0xffb020, 0xff5d8f, 0xa66bff][k % 5], 0, 0); w.add('x', rbox(0.3, 2.6, 4.0, 0.04), 0x64748b, 72.45, FL + 1.3, -65); w.solid(72.2, 0, -67.2, 73.2, 2.6, -62.8);
    gadget(w, 'goggles', 74.6, FL + 0.97, -64.4, 1.1, 0.3); gadget(w, 'wheel', 76.6, FL + 0.97, -64.6, 1.0, 0.2); gadget(w, 'popper', 79.6, FL + 0.97, -64.4, 1.0); armorPlate(w, 81.2, FL + 1.0, -64.5, 0.22, TEAL); armorPlate(w, 81.8, FL + 1.0, -64.3, 0.2, 0xff5d8f);
    K.PR.toolbox(K.scaled(w, 82.6, FL + 0.95, -64.6, 0.12), 0, 0, 0.4); K.robotArm(w, 82.8, -60.2, TEAL); { const T = w.tf(82.8, FL + 0.3, -60.2, 0.6); T.add('x', capsule(10), TEAL, 0, 0.6, 0, 0, 0, 0.4, 0.22, 1.0, 0.22); T.add('x', capsule(10), 0x0f766e, 0.4, 1.3, 0, 0, 0, -0.9, 0.18, 0.8, 0.18); T.add('x', sph(12), 0xffd23f, 0.85, 1.55, 0, 0, 0, 0, 0.16); }
    K.whiteboard(w, 'z', 83.8, -60.5, 1.6, 2.8, -1); sign3d(w, 'MAKE IT TOUGHER!', 83.75, 3.25, -60.5, -PI / 2, 0.14, 0xffffff, TEAL);
    w.add('m', rbox(1.6, 0.9, 1.0, 0.1), 0xffb020, 78, FL + 0.45, -58.2); w.add('l', rbox(1.2, 0.5, 0.06, 0.04), 0x5eead4, 78, FL + 1.2, -58.6, -0.25, 0, 0, 1, 1, 1, 0.5); w.solid(77.2, 0, -58.7, 78.8, 1.0, -57.7);
    I({ kind: 'mg', game: 'tougher', x: 78, y: 0, z: -57.0, r: 2.0, label: '🛡️ Play MAKE IT TOUGHER' }); sunShell(w, 73.4, FL + 3.4, -63); }
  // ================= CEO OFFICE (84..96, -68..-56): Torty's office
  { lowDesk(w, 90, -64.2, 0, 3.0, 1.2, 0.6, 0x9a6a3e); K.monitor(w, null, 89.4, FL + 0.6, -64.5, 0.2, 0x5eead4); K.monitor(w, null, 90.6, FL + 0.6, -64.5, -0.2, 0x4ade80);
    w.add('g', rbox(0.6, 0.05, 0.25, 0.02), TEAL, 90, FL + 0.63, -63.8); sign3d(w, 'TORTY · CEO', 90, FL + 0.82, -63.62, 0, 0.07, 0xffffff, TEAL); logo(w, 91.3, FL + 0.6, -64.3, 0.16);
    w.add('f', sph(20), 0xff6fcf, 90, FL + 0.18, -65.5, 0, 0, 0, 0.8, 0.22, 0.6); // Torty's big cushion "chair"
    K.shelf(w, 95.4, -62, -PI / 2, 3.6, 2.6); for (let k = 0; k < 4; k++) w.add('x', lathe([[0, 0], [0.12, 0], [0.05, 0.08], [0.05, 0.2], [0.15, 0.32], [0, 0.35]], 16, 'cup3'), [0xffd23f, 0xcbd5e1, 0xd97706, 0xffd23f][k], 95.3, FL + 1.35 + Math.floor(k / 2) * 0.6, -63 + (k % 2) * 1.6);
    gadget(w, 'goggles', 95.3, FL + 0.75, -61.6, 0.7, -PI / 2); armorPlate(w, 95.3, FL + 0.85, -60.6, 0.18, TEAL, PI / 2, PI / 2);
    // photo wall: Torty with the Ratita Industries crew + her family (framed 3D art)
    art(w, 'x', -67.8, 87.2, 3.0, 1.2, 0.9, 1, 1); art(w, 'x', -67.8, 89.2, 3.2, 1.2, 0.9, 1, 4); art(w, 'x', -67.8, 92.8, 3.0, 1.2, 0.9, 1, 6); K.whiteboard(w, 'z', 84.2, -62, 1.7, 2.6, 1); sign3d(w, 'Q4 GOAL: TOUGHER!', 84.25, 3.3, -62, PI / 2, 0.11, 0x0f766e, 0xffffff);
    K.rug(w, 90, -62.4, 0, 6, 3.8, 0xffb020, 0xfef3c7); K.sofa(w, 87, -58.4, 0, TEAL, 0x5eead4); K.plant(w, 95, -57, 1.2); K.plant(w, 85, -67, 1.0); claypot(w, 94.6, -67.2, 0.8, TEAL, 'agave');
    { const T = w.tf(93, FL, -58.6, 0); T.slab('m', 0xc58b52, 0, 0.36, 0, 1.4, 0.08, 1.0, 0.03); T.solid(-0.7, 0, -0.5, 0.7, 0.44, 0.5); T.add('g', rcyl(0.3, 0.06, 0.02, 20), 0xffffff, 0, 0.46, 0); T.add('g', sph(12), 0x4cbb3c, 0, 0.55, 0, 0, 0, 0, 0.22, 0.14, 0.22); } sunShell(w, 95.3, FL + 2.75, -63.8); }
  // ================= OUTDOOR TOUGHNESS TEST YARD (100..126, -72..-40) + path from Market Street
  w.region = 'out'; K.floor(w, 75.5, -42, 80.5, -32, 'tile', 0.0, 0xe8cfa6, 0xd9b98a, 1.4); K.floor(w, 96, -58, 101, -54, 'tile', 0.0, 0xe8cfa6, 0xd9b98a, 1.4);
  K.floor(w, 101, -72, 126, -40, 'tile', 0.0, 0xd6d3cd, 0xc9c4ba, 2.0); K.fenceRun(w, 'x', -72, 101, 126, 1.4, TEAL); K.fenceRun(w, 'x', -40, 101, 126, 1.4, TEAL); K.fenceRun(w, 'z', 126, -72, -40, 1.4, TEAL); K.fenceRun(w, 'z', 101, -72, -59, 1.4, TEAL); K.fenceRun(w, 'z', 101, -53, -40, 1.4, TEAL);
  sign3d(w, 'TOUGHNESS TEST YARD', 101, 2.3, -56, PI / 2, 0.24, 0xffffff, TEAL);
  { const cx = 108, cz = -64; S.tt.yardDrop = [cx, 0, cz]; [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].forEach(([a, b]) => { w.add('x', rbox(0.3, 9, 0.3, 0.05), 0xef4444, cx + a, 4.5, cz + b); w.solid(cx + a - 0.2, 0, cz + b - 0.2, cx + a + 0.2, 9, cz + b + 0.2); }); w.add('x', rbox(3.6, 0.4, 3.6, 0.1), 0xfacc15, cx, 9.1, cz); K.hazard(w, cx, cz, 5, 5);
    w.add('m', rbox(2.6, 0.3, 2.6, 0.1), 0x3b82f6, cx, 0.15, cz); w.solid(cx - 1.3, 0, cz - 1.3, cx + 1.3, 0.3, cz + 1.3); sign3d(w, 'BIG DROP', cx, 9.6, cz + 1.85, 0, 0.3, 0xffffff, 0xef4444); }
  { const x = 118, z = -64; S.tt.ramp = [x, z]; const g = new THREE.BufferGeometry(); // a gentle sandstone test ramp; a giant cartoon boulder rolls down onto an armored test dummy
    w.add('m', new THREE.BoxGeometry(1, 1, 1), 0xd9a066, x, 1.1, z + 3.5, -0.3, 0, 0, 3.2, 0.3, 7.4); w.add('m', rbox(3.4, 2.4, 1.2, 0.1), 0xc98a4a, x, 1.2, z + 7.4); w.solid(x - 1.7, 0, z + 6.8, x + 1.7, 2.4, z + 8.0);
    w.add('f', capsule(12), 0xf3d6a0, x, 0.9, z - 1.4, 0, 0, 0, 0.6, 1.0, 0.6); w.add('f', sph(14), 0xf3d6a0, x, 1.85, z - 1.4, 0, 0, 0, 0.36); armorPlate(w, x, 1.2, z - 0.95, 0.42, TEAL, PI / 2); armorPlate(w, x, 2.2, z - 1.2, 0.3, SHELLC[1], 0.3); w.solid(x - 0.6, 0, z - 2.0, x + 0.6, 2.2, z - 0.8);
    sign3d(w, 'ROLL TEST', x + 1.9, 2.0, z + 2.0, -PI / 2, 0.18, 0xffffff, 0x7c3aed); }
  { const x = 108, z = -47; S.tt.yardPress = [x, z]; [-1.4, 1.4].forEach((a) => { w.add('x', rbox(0.4, 5.6, 0.6, 0.06), 0x7c3aed, x + a, 2.8, z); w.solid(x + a - 0.2, 0, z - 0.3, x + a + 0.2, 5.6, z + 0.3); }); w.add('x', rbox(3.4, 0.5, 1.0, 0.1), 0x6d28d9, x, 5.6, z); w.add('x', rbox(2.6, 0.4, 2.0, 0.08), 0x475569, x, 0.2, z); w.solid(x - 1.3, 0, z - 1.0, x + 1.3, 0.4, z + 1.0); }
  // bleachers for watching live tests + Ratita Industries x Tortuga Tech gadget corner
  for (let r = 0; r < 3; r++) { w.add('m', rbox(7, 0.3, 0.9, 0.06), [TEAL, 0xffb020, 0xff5d8f][r], 116, 0.3 + r * 0.42, -43 - r * 0.9 + 1.8); w.add('m', rbox(7, 0.3 + r * 0.42, 0.9, 0.04), 0x94a3b8, 116, (0.3 + r * 0.42) / 2, -43 - r * 0.9 + 1.8); w.solid(112.5, 0, -43 - r * 0.9 + 1.35, 119.5, 0.45 + r * 0.42, -43 - r * 0.9 + 2.25, { floor: true }); }
  { const x = 121.5, z = -52; S.tt.ratita = [x, z]; K.labBench(w, x, z, PI / 2, 3.6, { body: 0xfdf2f8, top: 0xff4fa0 }); gadget(w, 'goggles', x, 0.97, z - 1.1, 1.1, -PI / 2); gadget(w, 'wheel', x, 0.97, z, 1.1, -PI / 2); gadget(w, 'popper', x, 0.97, z + 1.1, 1.1);
    w.add('x', cyl(8), 0x94a3b8, x - 0.4, 0, z - 2.2, 0, 0, 0, 0.05, 3.2, 0.05); w.add('x', cyl(8), 0x94a3b8, x - 0.4, 0, z + 2.2, 0, 0, 0, 0.05, 3.2, 0.05); w.add('f', rbox(0.05, 0.8, 4.4, 0.02), 0xff4fa0, x - 0.4, 2.8, z); sign3d(w, 'RATITA INDUSTRIES × TORTUGA TECH', x - 0.45, 2.8, z, -PI / 2, 0.11, 0xffffff, 0xff4fa0);
    I({ kind: 'fun', x: x - 1.6, y: 0, z, r: 2.2, label: '🐀 Ratita gadgets: getting shell-tested', sfx: 'squeak', msgs: ["🔭 Luna's Star Goggles: passed the drop test! ✅", "🛞 Pi-rat's Turbo Wheel: survived 50 rolls down the ramp! ✅", "🎉 Snowie's Party Popper: heat test… it POPPED. Confetti everywhere. Still counts! ✅"] }); }
  for (let i = 0; i < 6; i++) K.cone3(w, 103 + i * 1.2, -70.6); tcrate(w, 124.4, 0, -70.4, 0.8, 0xd8a15a, 'none'); tcrate(w, 124.4, 0.82, -70.4, 0.6, 0xc58b52, 'none'); claypot(w, 98.4, -53.2, 1.0, TEAL, 'cactus'); claypot(w, 98.4, -59, 1.0, 0xffb020, 'flower');
  sunShell(w, 108, 9.9, -64); sunShell(w, 116, 1.9, -45.6); sunShell(w, 124.6, 1.8, -70.4);
  w.region = 'shell'; }
