// Holiday theme layer (Halloween): palette remap + spooky flora + abandoned-village/bat-cave props. Real 3D geometry only.
import * as THREE from 'three';
export const TH = { id: 'halloween', chip: '🍬', night: true };
const c = new THREE.Color(), h = {};
// outdoors: desert sand -> moonlit mossy dirt/slate; grass -> dead olive; keep warm accents (pumpkin orange stays bright)
export function remap(hex, region) { c.set(hex); c.getHSL(h); const out = region === 'out' || region === 'shell';
  if (region && region.startsWith && region.startsWith('u_')) { c.setHSL((h.h * 0.3 + 0.72 * 0.7) % 1, h.s * 0.5, h.l * 0.55); return c.getHex(); }
  if (out) { if (h.h > 0.04 && h.h < 0.17 && h.s < 0.85 && h.l > 0.45) c.setHSL(0.74, 0.12, 0.2 + (h.l - 0.45) * 0.35); // sand -> slate-purple dirt
    else if (h.h > 0.2 && h.h < 0.45) c.setHSL(0.17, h.s * 0.45, h.l * 0.55); // grass/leaves -> dead olive
    else if (h.h < 0.06 && h.s > 0.3) c.setHSL(0.06, h.s, h.l * 0.75); // red mesas -> rusty
    else c.setHSL(h.h, h.s * 0.8, h.l * 0.8); }
  else { if (h.h > 0.04 && h.h < 0.17 && h.l > 0.55) c.setHSL(0.08, h.s * 0.6, h.l * 0.72); else c.setHSL(h.h, h.s * 0.9, h.l * 0.88); } // interiors: dusty, candle-warm
  return c.getHex(); }
export const ENV = { sunDir: [-0.3, 0.7, 0.5], sunColor: 0xb8b0ff, sunI: 1.6, hemiSky: 0x6a5acd, hemiGround: 0x2a1f33, hemiI: 0.55, skyTop: 0x0b0620, skyMid: 0x3a1d5c, skyBot: 0xff7a2a, fog: 0x2b1d3f, fogD: 0.0042, exposure: 1.05, envI: 0.6, bloomT: 0.8, bloomS: 0.6, sunDisc: 0, stars: 1, moon: 1 };
export const LIGHT = { sunA: 0xb8b0ff, sunB: 0x9a7aff, hemiA: 0x6a5acd, hemiB: 0x8a4a9a, top: [0x0b0620, 0x05020f], mid: [0x3a1d5c, 0x2a0f40], bot: [0xff7a2a, 0xa83a5a], fog: [0x2b1d3f, 0x1a1028], dens: 0.0042, sunI: [1.6, 1.2] };
// palm -> twisted dead tree with hanging jack-o'-lanterns
export function tree(w, K, x, z, s = 1) { const { cyl, sph, cone } = K, R = K.R; const H = 6 * s;
  for (let i = 0; i < 8; i++) w.add('m', cyl(10), i % 2 ? 0x3b2a22 : 0x2f2019, x + Math.sin(i * 0.7) * 0.15 * s, i * H / 8 + 0.4, z, Math.sin(i) * 0.12, 0, Math.cos(i) * 0.12, 0.42 * s * (1 - i / 11), H / 8 + 0.1, 0.42 * s * (1 - i / 11));
  for (let b = 0; b < 6; b++) { const a = b * 1.1 + R(), y = H * (0.5 + b * 0.08), L = (1.8 + R()) * s; w.add('m', cyl(8), 0x2f2019, x + Math.cos(a) * L * 0.45, y + 0.4, z + Math.sin(a) * L * 0.45, Math.sin(a) * 1.0, 0, -Math.cos(a) * 1.0, 0.12 * s, L, 0.12 * s);
    for (let t = 0; t < 2; t++) w.add('m', cyl(6), 0x3b2a22, x + Math.cos(a) * L * 0.85, y + 0.9 + t * 0.3, z + Math.sin(a) * L * 0.85, Math.sin(a + t) * 0.6, 0, -Math.cos(a + t) * 0.6, 0.05 * s, L * 0.45, 0.05 * s);
    if (b % 2 === 0) { const px = x + Math.cos(a) * L * 0.9, pz = z + Math.sin(a) * L * 0.9; w.add('m', cyl(6), 0x111111, px, y - 0.1, pz, 0, 0, 0, 0.01, 0.8, 0.01); pumpkin(w, K, px, y - 0.9, pz, 0.45 * s, true); } }
  w.solid(x - 0.4 * s, 0, z - 0.4 * s, x + 0.4 * s, H * 0.8, z + 0.4 * s, { cam: false }); }
export function pumpkin(w, K, x, y, z, s = 1, lit = true) { const { sph, cyl, cone } = K;
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; w.add('g', sph(14), i % 2 ? 0xff7a1a : 0xf06a10, x + Math.cos(a) * 0.22 * s, y + 0.38 * s, z + Math.sin(a) * 0.22 * s, 0, -a, 0, 0.3 * s, 0.38 * s, 0.22 * s); }
  w.add('m', cyl(8), 0x4a6a22, x, y + 0.78 * s, z, 0.2, 0, 0.1, 0.06 * s, 0.22 * s, 0.06 * s);
  if (lit) { const em = 2.2; [[-0.13, 0.48], [0.13, 0.48]].forEach(([dx, dy]) => w.add('g', cone(3), 0xffd23f, x + dx * s, y + dy * s, z + 0.47 * s, Math.PI / 2, 0, 0, 0.07 * s, 0.03 * s, 0.07 * s, em)); w.add('g', K.rbox(0.3, 0.07, 0.03, 0.01), 0xffd23f, x, y + 0.3 * s, z + 0.47 * s, 0, 0, 0, s, s, s, em); } }
function grave(w, K, x, z, ry) { const T = w.tf(x, 0, z, ry); T.add('m', K.rbox(0.8, 1.1, 0.22, 0.12), 0x6b6878, 0, 0.55, 0); T.add('m', K.rbox(0.9, 0.08, 0.5, 0.03), 0x3a2e2a, 0, 0.04, 0.45); w.solid(x - 0.45, 0, z - 0.2, x + 0.45, 1.1, z + 0.2, { cam: false }); }
function bat(w, K, x, y, z, s = 1, ry = 0) { const T = w.tf(x, y, z, ry, s); T.add('g', K.sph(10), 0x1b1424, 0, 0, 0, 0, 0, 0, 0.16, 0.2, 0.15); [-1, 1].forEach((d) => { T.add('g', K.cone(3), 0x1b1424, d * 0.32, 0.02, 0, 0, 0, d * 1.4, 0.18, 0.5, 0.03); T.add('g', K.cone(4), 0x1b1424, d * 0.07, 0.22, 0, 0, 0, 0, 0.04, 0.1, 0.04); T.add('g', K.sph(6), 0xff3b3b, d * 0.06, 0.06, 0.13, 0, 0, 0, 0.025, 0.025, 0.025, 2); }); }
function web(w, K, x, y, z, ry, s = 1) { const T = w.tf(x, y, z, ry, s); for (let i = 0; i < 6; i++) T.add('l', K.cyl(4), 0xdedcf0, 0, 0, 0, 0, 0, i * Math.PI / 6, 0.008, 1.6, 0.008); for (let r = 1; r < 4; r++) T.add('l', K.torus(0.004, 16), 0xdedcf0, 0, 0, 0, 0, 0, 0, r * 0.22, r * 0.22, 1); }
function fence(w, K, x0, z0, x1, z1) { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.9); for (let i = 0; i <= n; i++) { const t = i / n; const x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; w.add('m', K.cyl(6), 0x1a1a1a, x, 0.7, z, 0, 0, i % 3 === 1 ? 0.15 : 0, 0.04, 1.4, 0.04); w.add('m', K.cone(4), 0x1a1a1a, x, 1.45, z, 0, 0, 0, 0.06, 0.15, 0.06); } }
// spooky dressing laid over the whole town after it is built: graveyard, abandoned village ruins, lanterns, cobwebs, bat roosts in the caves
export function dress(w, K) { const R = K.R, P = Math.PI; w.region = 'out';
  // Abandoned Village (old west quarter): broken carts, boarded crates, cobwebs, graves
  for (let i = 0; i < 26; i++) { const x = -124 + R() * 60, z = -126 + R() * 82; if (Math.abs(x + 100) < 18 && Math.abs(z + 70) < 12) continue; if (R() < 0.5) grave(w, K, x, z, R() * 0.5 - 0.25); else pumpkin(w, K, x, 0, z, 0.6 + R() * 0.5); }
  fence(w, K, -126, -40, -62, -40); fence(w, K, -62, -40, -62, -128);
  // graveyard on the farm fields' edge
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) grave(w, K, -126 + i * 3.2, 100 + j * 4, (i + j) % 2 ? 0.1 : -0.1);
  fence(w, K, -128, 96, -106, 96);
  // jack-o'-lantern rows along the main paths
  for (let x = 32; x < 120; x += 7) { pumpkin(w, K, x, 0, 7.4, 0.55); pumpkin(w, K, x + 3.5, 0, -7.4, 0.55); }
  for (let x = -120; x < -32; x += 7) { pumpkin(w, K, x, 0, 7.4, 0.55); pumpkin(w, K, x + 3.5, 0, -7.4, 0.55); }
  for (let z = 32; z < 72; z += 6) { pumpkin(w, K, -5.2, 0, z, 0.5); pumpkin(w, K, 5.2, 0, z, 0.5); }
  // giant carved pumpkin on the square
  pumpkin(w, K, 24, 0, -24, 3.2); pumpkin(w, K, -24, 0, -24, 2.6); pumpkin(w, K, -24, 0, 24, 2.2);
  w.solid(21, 0, -27, 27, 3, -21, {}); w.solid(-27, 0, -27, -21, 2.6, -21, {}); w.solid(-27, 0, 21, -21, 2.2, 27, {});
  // bats roosting under eaves outdoors
  for (let i = 0; i < 30; i++) bat(w, K, -120 + R() * 240, 7 + R() * 5, -120 + R() * 240, 1.2, R() * 6);
  // Bat Caves (the secret underground): roosting colonies + cobwebs in every cavern
  const caves = [[150, 176, -6, 6, -27], [176, 204, -16, 16, -23.5], [178, 206, 16, 42, -22.5], [204, 232, -14, 14, -24]];
  caves.forEach(([x0, x1, z0, z1, cy], k) => { w.region = ['u_tunnel', 'u_crystal', 'u_grotto', 'u_hall'][k]; for (let i = 0; i < 22; i++) bat(w, K, x0 + 1 + R() * (x1 - x0 - 2), cy - 0.4, z0 + 1 + R() * (z1 - z0 - 2), 1.3, R() * 6);
    for (let i = 0; i < 5; i++) web(w, K, x0 + 1.5 + R() * (x1 - x0 - 3), cy - 2, z0 + 0.3, 0, 1.4); });
  w.region = 'out'; }
// themed interiors: cobwebs in the corners, candle clusters, a pumpkin, bats hanging from the ceiling, in every walk-in building
export function dressInside(w, K, REGIONS) { for (const r of REGIONS) { if (r.under) continue; w.region = r.id; const c = [[r.x0 + 0.9, r.z0 + 0.9, 0], [r.x1 - 0.9, r.z0 + 0.9, Math.PI / 2], [r.x1 - 0.9, r.z1 - 0.9, Math.PI], [r.x0 + 0.9, r.z1 - 0.9, -Math.PI / 2]];
  c.forEach(([x, z, a], i) => { web(w, K, x, r.ceil - 0.7, z, a + Math.PI / 4, 0.8); if (i % 2 === 0) { for (let k = 0; k < 3; k++) { const h = 0.25 + k * 0.12; w.add('g', K.cyl(10), 0xf3ead2, x + (k - 1) * 0.16, 0.02, z + (k % 2) * 0.12, 0, 0, 0, 0.05, h, 0.05); w.add('g', K.sph(8), 0xffb347, x + (k - 1) * 0.16, h + 0.07, z + (k % 2) * 0.12, 0, 0, 0, 0.035, 0.06, 0.035, 2.6); } } else pumpkin(w, K, x, 0, z, 0.55); });
  for (let k = 0; k < 3; k++) bat(w, K, r.x0 + (r.x1 - r.x0) * (k + 1) / 4, r.ceil - 0.35, (r.z0 + r.z1) / 2 + (k - 1) * 1.5, 0.9, k); } w.region = 'out'; }
