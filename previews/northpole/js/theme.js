// Holiday theme layer (Christmas / North Pole): snow palette remap + decorated pines, snowmen, presents, Santa, elves' gear, reindeer. Real 3D geometry only.
import * as THREE from 'three';
export const TH = { id: 'christmas', chip: '❄️', snow: true };
const c = new THREE.Color(), h = {};
export function remap(hex, region) { c.set(hex); c.getHSL(h); const out = region === 'out' || region === 'shell';
  if (region && region.startsWith && region.startsWith('u_')) { c.setHSL((h.h * 0.3 + 0.55 * 0.7) % 1, Math.min(1, h.s * 0.7 + 0.15), Math.min(0.85, h.l * 0.9 + 0.08)); return c.getHex(); } // ice caves
  if (out) { if (h.h > 0.04 && h.h < 0.17 && h.l > 0.45 && h.s < 0.85) c.setHSL(0.58, 0.25, 0.86 + (h.l - 0.45) * 0.2); // sand -> snow
    else if (h.h > 0.2 && h.h < 0.45) c.setHSL(0.38, Math.min(1, h.s * 0.9), h.l * 0.6); // greens -> deep pine
    else if (h.h < 0.06 && h.s > 0.3 && h.l < 0.6) c.setHSL(0.99, h.s, h.l * 0.85); // red rock -> brick red
    else c.setHSL(h.h, h.s, h.l); }
  else { if (h.h > 0.04 && h.h < 0.17 && h.l > 0.55) c.setHSL(0.07, h.s * 0.7, h.l * 0.9); } // interiors: warm gingerbread
  return c.getHex(); }
export const ENV = { sunDir: [0.35, 0.6, 0.5], sunColor: 0xfff4e8, sunI: 2.2, hemiSky: 0xdfeeff, hemiGround: 0xbfd4ea, hemiI: 0.75, skyTop: 0x3c6fd8, skyMid: 0xbfdcff, skyBot: 0xf2f6ff, fog: 0xe6eef8, fogD: 0.0038, exposure: 0.95, envI: 0.85, bloomT: 0.95, bloomS: 0.45, sunDisc: 1, stars: 0 };
export const LIGHT = { sunA: 0xfff4e8, sunB: 0xffb6a0, hemiA: 0xdfeeff, hemiB: 0x9fb4ff, top: [0x3c6fd8, 0x0d1b4a], mid: [0xbfdcff, 0x5a62b8], bot: [0xf2f6ff, 0xffb6c8], fog: [0xe6eef8, 0x8f9ad0], dens: 0.0038, sunI: [2.2, 1.0] };
export function tree(w, K, x, z, s = 1) { const { cyl, cone, sph } = K, R = K.R; const H = 7 * s; w.add('m', cyl(10), 0x5a3a22, x, 0.6 * s, z, 0, 0, 0, 0.3 * s, 1.2 * s, 0.3 * s);
  for (let i = 0; i < 4; i++) { const y = 1.1 * s + i * 1.35 * s, r = (2.2 - i * 0.45) * s; w.add('m', cone(18), i % 2 ? 0x1f6b3a : 0x17592f, x, y + 1.0 * s, z, 0, i, 0, r, 2.2 * s, r); w.add('m', cone(18), 0xf4f8ff, x, y + 1.55 * s, z, 0, i, 0, r * 0.62, 1.1 * s, r * 0.62);
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + i; w.add('g', sph(8), [0xef4444, 0xffd23f, 0x38bdf8, 0xf472b6][(k + i) % 4], x + Math.cos(a) * r * 0.82, y + 0.25 * s, z + Math.sin(a) * r * 0.82, 0, 0, 0, 0.12 * s, 0.12 * s, 0.12 * s, 1.6); } }
  w.add('g', K.star ? K.star() : sph(8), 0xffd23f, x, H + 0.3 * s, z, 0, 0, 0, 0.5 * s, 0.5 * s, 0.5 * s, 2);
  w.solid(x - 0.5 * s, 0, z - 0.5 * s, x + 0.5 * s, H * 0.8, z + 0.5 * s, { cam: false }); }
export function snowman(w, K, x, y, z, s = 1, ry = 0) { const T = w.tf(x, y, z, ry, s); T.add('m', K.sph(18), 0xfbfdff, 0, 0.5, 0, 0, 0, 0, 0.55); T.add('m', K.sph(16), 0xfbfdff, 0, 1.25, 0, 0, 0, 0, 0.4); T.add('m', K.sph(14), 0xfbfdff, 0, 1.85, 0, 0, 0, 0, 0.28);
  T.add('g', K.cone(8), 0xff8a1a, 0, 1.85, 0.3, Math.PI / 2, 0, 0, 0.05, 0.25, 0.05); [-0.1, 0.1].forEach((d) => T.add('g', K.sph(6), 0x111111, d, 1.95, 0.24, 0, 0, 0, 0.035)); T.add('m', K.cyl(12), 0x111111, 0, 2.18, 0, 0, 0, 0, 0.2, 0.3, 0.2); T.add('m', K.cyl(12), 0x111111, 0, 2.04, 0, 0, 0, 0, 0.32, 0.03, 0.32);
  T.add('m', K.torus(0.06, 16), 0xef4444, 0, 1.58, 0, Math.PI / 2, 0, 0, 0.3, 0.3, 1); [-1, 1].forEach((d) => T.add('m', K.cyl(5), 0x5a3a22, d * 0.55, 1.4, 0, 0, 0, d * 1.0, 0.03, 0.7, 0.03)); w.solid(x - 0.55 * s, y, z - 0.55 * s, x + 0.55 * s, y + 2 * s, z + 0.55 * s, { cam: false }); }
export function present(w, K, x, y, z, s = 1, col = 0xef4444) { const T = w.tf(x, y, z, K.R() * 3, s); T.add('m', K.rbox(0.7, 0.6, 0.7, 0.04), col, 0, 0.3, 0); T.add('g', K.rbox(0.72, 0.62, 0.12, 0.02), 0xffd23f, 0, 0.3, 0); T.add('g', K.rbox(0.12, 0.62, 0.72, 0.02), 0xffd23f, 0, 0.3, 0); T.add('g', K.torus(0.04, 12), 0xffd23f, -0.1, 0.68, 0, 0, 0.6, 0, 0.14, 0.14, 1); T.add('g', K.torus(0.04, 12), 0xffd23f, 0.1, 0.68, 0, 0, -0.6, 0, 0.14, 0.14, 1); }
export function reindeer(w, K, x, z, ry = 0, nose = 0x3a2416, s = 1) { const T = w.tf(x, 0, z, ry, s); const B = 0x8a5a32; T.add('m', K.capsule(12), B, 0, 1.15, 0, Math.PI / 2, 0, 0, 0.35, 0.8, 0.35); [[-0.25, 0.45], [0.25, 0.45], [-0.25, -0.45], [0.25, -0.45]].forEach(([a, b]) => T.add('m', K.cyl(8), 0x6b4226, a, 0.45, b, 0, 0, 0, 0.08, 0.9, 0.08));
  T.add('m', K.cyl(10), B, 0, 1.6, 0.6, -0.6, 0, 0, 0.14, 0.6, 0.14); T.add('m', K.sph(14), B, 0, 1.95, 0.85, 0, 0, 0, 0.22, 0.2, 0.32); T.add('g', K.sph(8), nose, 0, 1.9, 1.17, 0, 0, 0, 0.08, 0.08, 0.08, nose === 0xff2020 ? 2.5 : 0); T.add('g', K.sph(8), 0xfff3e0, 0, 1.15, 0.2, 0, 0, 0, 0.3, 0.25, 0.4);
  [-1, 1].forEach((d) => { T.add('g', K.sph(6), 0x111111, d * 0.12, 2.02, 1.05, 0, 0, 0, 0.04); T.add('m', K.cyl(5), 0x6b4a2a, d * 0.15, 2.35, 0.75, 0, 0, d * 0.4, 0.03, 0.5, 0.03); for (let k = 0; k < 3; k++) T.add('m', K.cyl(5), 0x6b4a2a, d * (0.22 + k * 0.06), 2.4 + k * 0.1, 0.75 + (k - 1) * 0.12, 0.5 * (k - 1), 0, d * 1.1, 0.025, 0.25, 0.025); });
  T.add('m', K.torus(0.05, 16), 0xb91c1c, 0, 1.45, 0.52, 1.0, 0, 0, 0.2, 0.2, 1); T.add('g', K.sph(8), 0xffd23f, 0, 1.3, 0.62, 0, 0, 0, 0.07, 0.07, 0.07, 1.2); w.solid(x - 0.5, 0, z - 0.6, x + 0.5, 2, z + 0.6, { cam: false }); }
function santa(w, K, x, z, ry = 0) { const T = w.tf(x, 0, z, ry, 1.1); T.add('m', K.sph(18), 0xc81e1e, 0, 1.0, 0, 0, 0, 0, 0.55, 0.65, 0.5); T.add('m', K.rbox(1.12, 0.12, 1.02, 0.05), 0x111111, 0, 0.95, 0); T.add('g', K.rbox(0.2, 0.15, 0.06, 0.02), 0xffd23f, 0, 0.95, 0.52);
  T.add('m', K.sph(16), 0xffd8b8, 0, 1.8, 0, 0, 0, 0, 0.3); T.add('m', K.sph(14), 0xffffff, 0, 1.62, 0.15, 0, 0, 0, 0.3, 0.32, 0.22); T.add('g', K.sph(8), 0xff9a8a, 0, 1.82, 0.29, 0, 0, 0, 0.06); [-0.1, 0.1].forEach((d) => T.add('g', K.sph(6), 0x111111, d, 1.9, 0.27, 0, 0, 0, 0.03));
  T.add('m', K.cone(16), 0xc81e1e, 0, 2.28, -0.05, -0.3, 0, 0, 0.3, 0.6, 0.3); T.add('m', K.torus(0.07, 16), 0xffffff, 0, 2.0, 0, Math.PI / 2, 0, 0, 0.3, 0.3, 1); T.add('m', K.sph(10), 0xffffff, 0, 2.5, -0.25, 0, 0, 0, 0.1);
  [-1, 1].forEach((d) => { T.add('m', K.capsule(8), 0xc81e1e, d * 0.6, 1.15, 0.05, 0, 0, d * 0.5, 0.13, 0.45, 0.13); T.add('m', K.cyl(8), 0x111111, d * 0.2, 0.25, 0.05, 0, 0, 0, 0.13, 0.5, 0.13); }); w.solid(x - 0.6, 0, z - 0.6, x + 0.6, 2.4, z + 0.6, {}); }
function sleigh(w, K, x, z, ry) { const T = w.tf(x, 0, z, ry); T.add('m', K.rbox(1.8, 0.9, 3.0, 0.25), 0xb91c1c, 0, 0.9, 0); T.add('m', K.rbox(1.82, 0.12, 3.02, 0.05), 0xffd23f, 0, 1.35, 0); T.add('m', K.rbox(1.6, 1.0, 0.5, 0.2), 0xb91c1c, 0, 1.4, -1.2); [-0.8, 0.8].forEach((d) => { T.add('m', K.torus(0.06, 20), 0xffd23f, d, 0.4, 1.4, 0, Math.PI / 2, 0, 0.35, 0.35, 1); T.add('m', K.cyl(6), 0xffd23f, d, 0.08, 0, Math.PI / 2, 0, 0, 0.05, 3.2, 0.05); });
  for (let i = 0; i < 6; i++) present(w, K, ...T.P(-0.5 + (i % 3) * 0.5, 1.35, -0.4 + (i / 3 | 0) * 0.6), 0.55, [0xef4444, 0x22c55e, 0x3b82f6, 0xa855f7][i % 4]); w.solid(...[x - 1.6, 0, z - 1.6, x + 1.6, 1.6, z + 1.6], {}); }
function candyCane(w, K, x, z, s = 1) { for (let i = 0; i < 10; i++) w.add('m', K.cyl(10), i % 2 ? 0xffffff : 0xe11d48, x, i * 0.3 * s + 0.15 * s, z, 0, 0, 0, 0.12 * s, 0.3 * s, 0.12 * s); w.add('m', K.torus(0.12, 24, ), 0xe11d48, x + 0.35 * s, 3.0 * s, z, 0, 0, 0, 0.35 * s, 0.35 * s, s / 1); w.solid(x - 0.15, 0, z - 0.15, x + 0.15, 3 * s, z + 0.15, { cam: false }); }
export function dress(w, K) { const R = K.R; w.region = 'out';
  // the NORTH POLE (northern hill): striped pole, Santa, his sleigh and 9 reindeer, elves' present piles
  { const x = 0, z = -78; for (let i = 0; i < 16; i++) w.add('m', K.cyl(16), i % 2 ? 0xffffff : 0xe11d48, x, i * 0.4 + 0.2, z, 0, 0, 0, 0.32, 0.4, 0.32); w.add('g', K.sph(18), 0xffd23f, x, 6.8, z, 0, 0, 0, 0.6, 0.6, 0.6, 1.4); w.solid(x - 0.4, 0, z - 0.4, x + 0.4, 6.6, z + 0.4, {}); }
  santa(w, K, 4.5, -76, -0.6); sleigh(w, K, 22, -80, Math.PI / 2);
  const names = 9; for (let i = 0; i < names; i++) { const row = i >> 1, side = i % 2 ? 1 : -1; if (i === 8) reindeer(w, K, 22 - 5 - 4 * 2.2 - 2.2, -80, Math.PI / 2, 0xff2020); else reindeer(w, K, 22 - 5 - row * 2.2, -80 + side * 0.9, Math.PI / 2 + Math.PI, 0x3a2416); }
  for (let i = 0; i < 14; i++) present(w, K, -8 + R() * 6, 0, -82 + R() * 6, 0.8 + R() * 0.5, [0xef4444, 0x22c55e, 0x3b82f6, 0xa855f7, 0xffd23f][i % 5]);
  // snowmen, candy canes and presents along every main street
  for (let x = 32; x < 120; x += 9) { candyCane(w, K, x, 7.4, 0.8); candyCane(w, K, x + 4.5, -7.4, 0.8); }
  for (let x = -120; x < -32; x += 9) { candyCane(w, K, x, 7.4, 0.8); candyCane(w, K, x + 4.5, -7.4, 0.8); }
  for (let z = 32; z < 72; z += 8) { candyCane(w, K, -5.2, z, 0.7); candyCane(w, K, 5.2, z, 0.7); }
  [[24, -24], [-24, -24], [-24, 24], [108, 46], [-60, 40], [40, 70], [-100, -50], [90, -84]].forEach(([x, z], i) => snowman(w, K, x, 0, z, 1.3 + (i % 2) * 0.4, R() * 6));
  // reindeer paddock by the racetrack
  for (let i = 0; i < 6; i++) reindeer(w, K, 50 + i * 3.2, 100 + (i % 2) * 2, R() * 6);
  // ice cave dressing (secret below): icicles + frozen presents
  [[150, 176, -6, 6, -27], [176, 204, -16, 16, -23.5], [178, 206, 16, 42, -22.5], [204, 232, -14, 14, -24]].forEach(([x0, x1, z0, z1, cy], k) => { w.region = ['u_tunnel', 'u_crystal', 'u_grotto', 'u_hall'][k];
    for (let i = 0; i < 26; i++) w.add('l', K.cone(6), 0xbfe9ff, x0 + 1 + R() * (x1 - x0 - 2), cy - 0.5, z0 + 1 + R() * (z1 - z0 - 2), Math.PI, 0, 0, 0.12, 0.9 + R(), 0.12, 0.6); });
  w.region = 'out'; }
// themed interiors: a little decorated tree, presents, a wreath and a string of warm bulbs under the ceiling, in every walk-in building
export function dressInside(w, K, REGIONS) { for (const r of REGIONS) { if (r.under) continue; w.region = r.id; const s = Math.min(0.42, (r.ceil - 0.6) / 7.5);
  tree(w, K, r.x0 + 1.4, r.z0 + 1.4, s); for (let k = 0; k < 3; k++) present(w, K, r.x0 + 0.9 + k * 0.7, 0, r.z0 + 2.6 + (k % 2) * 0.4, 0.5 + k * 0.1, [0xef4444, 0x22c55e, 0x3b82f6][k]);
  for (let x = r.x0 + 1; x < r.x1 - 0.5; x += 0.9) { w.add('g', K.sph(8), [0xef4444, 0xffd23f, 0x22c55e, 0x38bdf8][Math.round(x) & 3], x, r.ceil - 0.45 - Math.sin((x - r.x0) * 1.3) * 0.08, r.z1 - 0.35, 0, 0, 0, 0.07, 0.09, 0.07, 2.2); }
  w.add('m', K.torus(0.25, 24), 0x166534, r.x1 - 0.3, r.ceil - 1.6, (r.z0 + r.z1) / 2, 0, Math.PI / 2, 0, 0.45, 0.45, 0.6); w.add('g', K.sph(8), 0xdc2626, r.x1 - 0.26, r.ceil - 2.05, (r.z0 + r.z1) / 2, 0, 0, 0, 0.12, 0.09, 0.06); } w.region = 'out'; }
