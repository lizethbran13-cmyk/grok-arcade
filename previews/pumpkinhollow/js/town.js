// Grok Pumpkin Hollow: Martina "Torty"'s desert-oasis hometown. A palm-ringed Pumpkin Square, Spooky Street, the Burrows (homes),
// Haunted Hill, the Broomstick Racetrack, the Pumpkin Patch and the Bat Cliffs edge. 18 enterable buildings, each its own
// culled region; outdoors batch into big merged chunks, tiny decor goes into far-culled "detail" chunks. All real 3D geometry.
import { tortuga } from './tortuga.js?v=ph6';
import { districts } from './districts.js?v=ph6';
import * as THREE from 'three';
import * as LY from './layout.js?v=ph6';
import * as FA from './facades.js?v=ph6';
import * as TH from './theme.js?v=ph6';
import * as HOL from './holiday.js?v=ph6';
import * as K from './kit.js?v=ph6';
import { interiors } from './interiors.js?v=ph6';
import { underground } from './under.js?v=ph6';
const { wall, D, G, floor, ceiling, sign3d, rbox, rcyl, lathe, sph, cyl, cone, torus, capsule, tube, leaf, star, heart, blobGeo, pick } = K;
const R = K.R, PI = Math.PI; let I = null;
export const FL = 0.02;
export const REGIONS = [
  { id: 'hall', x0: -12, x1: 12, z0: -64, z1: -42, y0: -1, y1: 8, ceil: 6.4, name: '🏛️ Town Hall' },
  { id: 'library', x0: -46, x1: -28, z0: -58, z1: -42, y0: -1, y1: 7, ceil: 5.2, name: '📚 Creaky Library' },
  { id: 'cafe', x0: 28, x1: 46, z0: -58, z1: -42, y0: -1, y1: 7, ceil: 5.0, name: '🎃 Cauldron Café' },
  { id: 'post', x0: -46, x1: -30, z0: 40, z1: 54, y0: -1, y1: 7, ceil: 5.0, name: '📮 Ghost Runner Post Office' },
  { id: 'inn', x0: 28, x1: 46, z0: 40, z1: 56, y0: -1, y1: 7, ceil: 5.0, name: '🛏️ Haunted Inn' },
  { id: 'market', x0: 50, x1: 74, z0: -28, z1: -10, y0: -1, y1: 8, ceil: 6.2, name: '🕸️ Night Market' },
  { id: 'shellshop', x0: 80, x1: 94, z0: -24, z1: -10, y0: -1, y1: 7, ceil: 5.0, name: '🏮 The Lantern Shop' },
  { id: 'pottery', x0: 100, x1: 112, z0: -22, z1: -10, y0: -1, y1: 7, ceil: 4.8, name: '🏺 Clay & Lantern Pottery' },
  { id: 'sweets', x0: 50, x1: 64, z0: 10, z1: 24, y0: -1, y1: 7, ceil: 4.8, name: '🍬 Trick-or-Treat Sweets' },
  { id: 'fossil', x0: 72, x1: 92, z0: 10, z1: 28, y0: -1, y1: 8, ceil: 6.4, name: '🦴 Museum of Monsters' },
  { id: 'burrow', x0: -70, x1: -48, z0: -30, z1: -10, y0: -1, y1: 7, ceil: 4.8, name: "🏡 Creepy Cottage" },
  { id: 'shelby', x0: -94, x1: -78, z0: -26, z1: -10, y0: -1, y1: 7, ceil: 4.6, name: "🏠 Shroud's House" },
  { id: 'school', x0: -70, x1: -50, z0: 10, z1: 26, y0: -1, y1: 7, ceil: 4.8, name: '🏫 Ghoul School' },
  { id: 'spa', x0: -36, x1: -10, z0: -114, z1: -94, y0: -1, y1: 8, ceil: 5.6, name: '♨️ Witch’s Bubbling Spa' },
  { id: 'obs', x0: 14, x1: 30, z0: -114, z1: -98, y0: -1, y1: 10, ceil: 7.2, name: '🔭 Moon Observatory' },
  { id: 'club', x0: -30, x1: -12, z0: 74, z1: 90, y0: -1, y1: 7, ceil: 5.0, name: "🏁 Racers' Clubhouse" },
  { id: 'barn', x0: -104, x1: -86, z0: 44, z1: 60, y0: -1, y1: 9, ceil: 6.6, name: '🎃 Pumpkin Barn' },
  { id: 'green', x0: -80, x1: -66, z0: 70, z1: 82, y0: -1, y1: 8, ceil: 5.4, name: '🪴 Greenhouse' },
  { id: 'bakery', x0: -116, x1: -100, z0: -74, z1: -60, y0: -1, y1: 7, ceil: 4.8, name: '🥐 Spooky Bloom Bakery' },
  { id: 'music', x0: -92, x1: -72, z0: -74, z1: -58, y0: -1, y1: 9, ceil: 6.0, name: '🥁 Lantern & Drum Music Hall' },
  { id: 'toys', x0: -114, x1: -98, z0: -116, z1: -102, y0: -1, y1: 7, ceil: 4.8, name: "🧸 Shadow's Toy House" },
  { id: 'cinema', x0: 48, x1: 66, z0: 44, z1: 60, y0: -1, y1: 8, ceil: 5.6, name: '🎬 Scream-o-Vision Picture House' },
  { id: 'icecream', x0: 68, x1: 79, z0: 44, z1: 56, y0: -1, y1: 7, ceil: 4.6, name: '🍦 Pumpkin Cream' },
  { id: 'tortuga', x0: 60, x1: 96, z0: -68, z1: -42, y0: -1, y1: 8, ceil: 6.4, tone: 0.84, name: '🎃 Mad Science Lab' },
  // the hidden place (below the world, reached by a secret)
  { id: 'u_tunnel', x0: 150, x1: 176, z0: -6, z1: 6, y0: -34, y1: -24, ceil: -26.0, name: '🕳️ Bat Tunnels', under: true },
  { id: 'u_crystal', x0: 176, x1: 204, z0: -16, z1: 16, y0: -34, y1: -20, ceil: -22.5, name: '💎 Bat Cave', under: true },
  { id: 'u_grotto', x0: 178, x1: 206, z0: 16, z1: 42, y0: -34, y1: -20, ceil: -21.5, name: '🍄 Glowshroom Grotto', under: true },
  { id: 'u_hall', x0: 204, x1: 232, z0: -14, z1: 14, y0: -34, y1: -20, ceil: -23.0, name: '🎃 Hall of the Lantern Keepers', under: true },
];
export const NEAR = { u_tunnel: ['u_crystal'], u_crystal: ['u_tunnel', 'u_hall', 'u_grotto'], u_hall: ['u_crystal'], u_grotto: ['u_crystal'] };
export const AREAS = [
  { x0: -128, x1: -60, z0: -128, z1: -40, name: '🏺 Abandoned Village' }, { x0: 46, x1: 80, z0: 32, z1: 62, name: '🎉 Monster Mash Plaza' },
  { x0: -34, x1: 34, z0: -38, z1: 36, name: '🎃 Pumpkin Square' }, { x0: 30, x1: 120, z0: -32, z1: 32, name: '🛍️ Spooky Street' },
  { x0: -122, x1: -30, z0: -36, z1: 32, name: '🏡 Hollow Lane' }, { x0: -60, x1: 60, z0: -132, z1: -66, name: '♨️ Haunted Hill' },
  { x0: -36, x1: 80, z0: 62, z1: 130, name: '🏁 Broomstick Racetrack' }, { x0: -132, x1: -40, z0: 34, z1: 132, name: '🎃 Pumpkin Patch' },
  { x0: 80, x1: 132, z0: 32, z1: 132, name: '🦇 Bat Cliffs' }, { x0: 56, x1: 132, z0: -80, z1: -32, name: '🎃 Mad Science Yard' }, { x0: 60, x1: 132, z0: -132, z1: -32, name: '🦇 Foggy Moor' },
];
export function regionAt(x, y, z) { for (const r of REGIONS) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1 && y >= r.y0 && y <= r.y1) return r.id; return 'out'; }
export function areaName(x, z) { for (const a of AREAS) if (x >= a.x0 && x <= a.x1 && z >= a.z0 && z <= a.z1) return a.name; return '🎃 Pumpkin Hollow'; }
export const DOORS = { bakery: [-108, -74], music: [-82, -74], toys: [-106, -102], cinema: [57, 44], icecream: [73.5, 44], tortuga: [78, -42], hall: [0, -42], library: [-37, -42], cafe: [37, -42], post: [-38, 40], inn: [37, 40], market: [62, -10], shellshop: [87, -10], pottery: [106, -10], sweets: [57, 10], fossil: [82, 10],
  burrow: [-59, -10], shelby: [-86, -10], school: [-60, 10], spa: [-23, -94], obs: [22, -98], club: [-12, 82], barn: [-86, 52], green: [-73, 70] };
// Ghost Train stops (fast travel) [x, z, yaw, name]
export const STOPS = [[6, 30, PI, '🎃 Pumpkin Square'], [114, 8, -PI / 2, '🛍️ Spooky Street'], [-112, 8, PI / 2, '🏡 Hollow Lane'], [6, -84, PI, '♨️ Haunted Hill'], [6, 66, 0, '🏁 Racetrack'], [-78, 38, PI / 2, '🎃 Pumpkin Patch'], [100, 62, -PI / 2, '🦇 Bat Cliffs'], [84, -36, PI, '🎃 Mad Science Lab'], [-94, -72, PI, '🏺 Abandoned Village'], [68, 30.5, PI, '🎉 Monster Mash Plaza']];
// ------------------------------------------------------------------------------------------------ shared helpers
export const shade = (c, k) => { const C = new THREE.Color(c); C.multiplyScalar(k); return C.getHex(); };
const prismCache = new Map();
export function prism(W, H, L) { const k = [W, H, L].map((v) => v.toFixed(2)).join(','); let g = prismCache.get(k); if (g) return g; const s = new THREE.Shape(); s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(0, H); s.lineTo(-W / 2, 0);
  g = new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: false }); g.translate(0, 0, -L / 2); prismCache.set(k, g); return g; }
function winSlots(from, to, door, width = 2.0, step = 4) { const out = []; const n = Math.max(1, Math.floor((to - from - 2) / step)); for (let i = 0; i < n; i++) { const c = from + (to - from) * (i + 0.5) / n; if (door && c + width / 2 > door[0] - 0.9 && c - width / 2 < door[1] + 0.9) continue; out.push([c - width / 2, c + width / 2]); } return out; }
export const SUN = [0xff6b35, 0xffb020, 0xffd23f, 0x2dd4bf, 0x38bdf8, 0xff5d8f, 0xa66bff, 0x4ade80];
// ---- desert flora
export function palm(w, x, z, s = 1, lean = 0, ry = R() * 6.28) { if (w.region === 'out' || w.region === 'shell') return TH.tree(w, K, x, z, s); const H = 7.5 * s, pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([x + Math.sin(ry) * lean * t * t * H * 0.25, t * H, z + Math.cos(ry) * lean * t * t * H * 0.25]); }
  for (let i = 0; i < 14; i++) { const t = i / 14, p0 = pts[Math.floor(t * 8)], p1 = pts[Math.min(8, Math.floor(t * 8) + 1)], f = t * 8 % 1; const px = p0[0] + (p1[0] - p0[0]) * f, py = p0[1] + (p1[1] - p0[1]) * f, pz = p0[2] + (p1[2] - p0[2]) * f;
    w.add('m', rcyl(0.36 * s * (1 - t * 0.3), 0.6 * s, 0.12 * s, 14), i % 2 ? 0x9a6a3e : 0x8a5a32, px, py, pz, lean * 0.3 * t * Math.cos(ry), 0, -lean * 0.3 * t * Math.sin(ry)); }
  const top = pts[8]; w.add('m', sph(12), 0x7a4a26, top[0], top[1] + 0.1, top[2], 0, 0, 0, 0.45 * s);
  for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2 + R() * 0.3; const T = w.tf(top[0], top[1] + 0.2, top[2], a); for (let k = 0; k < 5; k++) T.add('g', leaf(), [0x2f9e4a, 0x3fae5a, 0x4cc36b][(i + k) % 3], 0, 0.1 - k * k * 0.12 * s, 0.4 * s + k * 0.75 * s, PI / 2 + 0.25 + k * 0.18, 0, 0, 1.1 * s, 1.0 * s, 1); }
  for (let i = 0; i < 6; i++) { const a = i * 1.05; w.add('g', sph(10), i % 2 ? 0xff8a3d : 0xe0662a, top[0] + Math.cos(a) * 0.35 * s, top[1] - 0.3 * s, top[2] + Math.sin(a) * 0.35 * s, 0, 0, 0, 0.2 * s); }
  w.solid(x - 0.4 * s, 0, z - 0.4 * s, x + 0.4 * s, H * 0.8, z + 0.4 * s, { cam: false }); }
export function barrel(w, x, z, s = 1, y = 0) { if (TH.pumpkin) return TH.pumpkin(w, K, x, y, z, s * 1.1, true); w.add('g', sph(18), 0x3aa655, x, y + 0.45 * s, z, 0, 0, 0, 0.55 * s, 0.55 * s, 0.55 * s); for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; w.add('g', capsule(8), 0x2f8f47, x + Math.cos(a) * 0.5 * s, y + 0.45 * s, z + Math.sin(a) * 0.5 * s, 0, -a, 0, 0.12 * s, 0.5 * s, 0.12 * s); }
  for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; w.add('g', sph(8), pick([0xff5d8f, 0xffd23f, 0xff8a3d]), x + Math.cos(a) * 0.12 * s, y + 1.0 * s, z + Math.sin(a) * 0.12 * s, 0, 0, 0, 0.1 * s, 0.06 * s, 0.1 * s); } w.solid(x - 0.5 * s, y, z - 0.5 * s, x + 0.5 * s, y + 0.9 * s, z + 0.5 * s, { cam: false }); }
export function prickly(w, x, z, s = 1, y = 0) { if (w.region === 'out') return TH.pumpkin(w, K, x, y, z, s * 0.8, false); const pad = (px, py, pz, rx, rz, sc) => { w.add('g', sph(14), 0x4caf50, px, py, pz, rx, R() * 3, rz, 0.42 * sc, 0.55 * sc, 0.12 * sc); if (R() < 0.6) w.add('g', sph(8), pick([0xff5d8f, 0xe11d48, 0xffd23f]), px, py + 0.55 * sc, pz, 0, 0, 0, 0.1 * sc, 0.13 * sc, 0.1 * sc); };
  pad(x, y + 0.55 * s, z, 0, 0, s); pad(x + 0.35 * s, y + 1.2 * s, z, 0, -0.5, s * 0.8); pad(x - 0.35 * s, y + 1.15 * s, z + 0.1, 0, 0.5, s * 0.8); pad(x, y + 1.7 * s, z - 0.1, 0.2, 0.1, s * 0.65); w.solid(x - 0.5 * s, y, z - 0.3 * s, x + 0.5 * s, y + 1.6 * s, z + 0.3 * s, { cam: false }); }
export function agave(w, x, z, s = 1, y = 0, col = 0x6fae8f) { if (w.region === 'out') return TH.pumpkin(w, K, x, y, z, s * 0.55, false); for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2 + (i % 2) * 0.2, up = i % 2 ? 0.9 : 0.55; w.add('g', cone(8), i % 3 ? col : shade(col, 0.85), x + Math.cos(a) * 0.2 * s, y + 0.1, z + Math.sin(a) * 0.2 * s, 0, -a, -up - PI / 2 + PI, 0.12 * s, 1.0 * s, 0.05 * s); } }
export function saguaro(w, x, z, s = 1) { return TH.tree(w, K, x, z, s * 0.9); K.cactus(w, x, z, s); }
export function claypot(w, x, z, s = 1, col = 0xc8693c, plant = 'none', y = 0) { w.add('g', lathe([[0, 0], [0.28, 0], [0.42, 0.25], [0.4, 0.55], [0.3, 0.72], [0.34, 0.8], [0.3, 0.82], [0, 0.6]], 24, 'clayPot'), col, x, y, z, 0, 0, 0, s, s, s);
  w.add('g', rcyl(0.415, 0.05, 0.02, 24), shade(col, 0.7), x, y + 0.36 * s, z, 0, 0, 0, s, 1, s); w.add('g', rcyl(0.412, 0.04, 0.02, 24), 0xfff1d6, x, y + 0.48 * s, z, 0, 0, 0, s, 1, s);
  if (plant === 'cactus') { w.add('g', capsule(12), 0x3aa655, x, y + 1.1 * s, z, 0, 0, 0, 0.3 * s, 0.5 * s, 0.3 * s); w.add('g', sph(8), 0xff5d8f, x, y + 1.55 * s, z, 0, 0, 0, 0.1 * s); }
  else if (plant === 'flower') for (let k = 0; k < 7; k++) { const a = k * 0.9; w.add('g', sph(8), pick([0xff5d8f, 0xffd23f, 0xff8a3d, 0xa66bff, 0xffffff]), x + Math.cos(a) * 0.18 * s, y + (0.95 + (k % 3) * 0.08) * s, z + Math.sin(a) * 0.18 * s, 0, 0, 0, 0.12 * s); w.add('g', sph(8), 0x3fae5a, x + Math.cos(a + 0.4) * 0.22 * s, y + 0.85 * s, z + Math.sin(a + 0.4) * 0.22 * s, 0, 0, 0, 0.14 * s, 0.08 * s, 0.14 * s); }
  else if (plant === 'agave') agave(w, x, z, 0.5 * s, y + 0.7 * s); else if (plant === 'lettuce') lettuce(w, x, y + 0.75 * s, z, 0.7 * s);
  w.solid(x - 0.38 * s, y, z - 0.38 * s, x + 0.38 * s, y + 0.8 * s, z + 0.38 * s, { cam: false }); }
export function lettuce(w, x, y, z, s = 1) { return TH.pumpkin(w, K, x, y, z, s * 0.42, false); for (let i = 0; i < 9; i++) { const a = i * 2.4, r = i < 3 ? 0.05 : 0.18; w.add('g', sph(10), i < 3 ? 0xb5e86a : i % 2 ? 0x4cbb3c : 0x6fd04f, x + Math.cos(a) * r * s, y + (0.22 - (i < 3 ? 0 : 0.06)) * s, z + Math.sin(a) * r * s, Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5, 0.26 * s, 0.2 * s, 0.26 * s); } }
export function bigRock(w, x, z, s = 1, col = 0xd08a52, y = 0, ry = R() * 6) { w.add('m', blobGeo(((x * 7 + z * 13) | 0) & 63, 0.22, 3), col, x, y + s * 0.55, z, 0, ry, 0, s * 1.2, s, s * 1.0); w.add('m', blobGeo(((x * 3 + z * 5) | 0) & 63, 0.2, 2), shade(col, 1.08), x + s * 0.3, y + s * 1.25, z - s * 0.2, 0, ry, 0, s * 0.8, s * 0.55, s * 0.7);
  w.solid(x - s * 1.0, y, z - s * 0.85, x + s * 1.0, y + s * 1.4, z + s * 0.85); }
export function mesa(w, x, z, W, H, Dp, col = 0xd9824a) { // layered sandstone butte/cliff with striped strata
  const n = Math.max(2, Math.round(H / 1.6)); for (let i = 0; i < n; i++) { const k = 1 - i * 0.04 + (i % 2) * 0.02; w.add('m', blobGeo(((x + i * 13 + z) | 0) & 63, 0.06, 2), [col, shade(col, 1.12), shade(col, 0.9), 0xe8a36b][i % 4], x, i * H / n + H / n / 2, z, 0, i * 0.3, 0, W / 2 * k, H / n * 0.62, Dp / 2 * k); }
  w.add('m', blobGeo(((x * 3) | 0) & 63, 0.1, 2), 0xc9b26a, x, H + 0.05, z, 0, 0, 0, W / 2 * 0.86, 0.25, Dp / 2 * 0.86); w.solid(x - W / 2 * 0.95, 0, z - Dp / 2 * 0.95, x + W / 2 * 0.95, H, z + Dp / 2 * 0.95, { wall: true }); }
export function lanternString(w, pts, cols = SUN, n = 14, droop = 0.5) { w.add('x', tube(pts, 0.018, 40, 4), 0x334155, 0, 0, 0); const cv = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  for (let i = 1; i < n; i++) { const p = cv.getPoint(i / n); const c = cols[i % cols.length]; w.add('g', sph(12), c, p.x, p.y - 0.28, p.z, 0, 0, 0, 0.16, 0.2, 0.16, 0.25); w.add('l', sph(8), 0xfff1c1, p.x, p.y - 0.28, p.z, 0, 0, 0, 0.08, 0.1, 0.08, 0.6); w.add('x', rcyl(0.07, 0.05, 0.01, 10), 0x334155, p.x, p.y - 0.1, p.z); } }
export function flagString(w, pts, n = 18) { w.add('x', tube(pts, 0.015, 40, 4), 0xffffff, 0, 0, 0); const cv = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  for (let i = 1; i < n; i++) { const p = cv.getPoint(i / n), q = cv.getPoint((i + 0.5) / n); const yaw = Math.atan2(q.x - p.x, q.z - p.z) + PI / 2; w.add('f', rbox(0.5, 0.6, 0.03, 0.02), SUN[i % SUN.length], p.x, p.y - 0.32, p.z, 0, yaw, 0); w.add('g', heart(), 0xffffff, p.x, p.y - 0.34, p.z, 0, yaw, 0, 0.09, 0.09, 0.05); } }
export function stall(w, x, z, ry, c1, c2, goods = 'fruit') { const T = w.tf(x, 0, z, ry); T.slab('m', 0x9a6a3e, 0, 0, 0, 3.0, 0.95, 1.2, 0.06); T.box('m', 0xc58b52, 0, 0.95, 0, 3.15, 0.08, 1.35, 0.03);
  [[-1.45, -0.6], [1.45, -0.6], [-1.45, 0.6], [1.45, 0.6]].forEach(([a, b]) => T.box('m', 0x7c4a1e, a, 0, b, 0.12, 2.9, 0.12, 0.04));
  for (let i = 0; i < 7; i++) T.add('f', rbox(0.46, 0.08, 1.9, 0.03), i % 2 ? c2 : c1, -1.38 + i * 0.46, 2.95, 0.15, -0.18, 0, 0); for (let i = 0; i < 7; i++) T.add('f', sph(10), i % 2 ? c2 : c1, -1.38 + i * 0.46, 2.72, 1.08, 0, 0, 0, 0.23, 0.12, 0.06);
  for (let i = 0; i < 10; i++) { const lx = -1.25 + (i % 5) * 0.62, lz = -0.3 + Math.floor(i / 5) * 0.55, p = T.P(lx, 1.03, lz);
    if (goods === 'fruit') { for (let k = 0; k < 4; k++) w.add('g', sph(10), pick([0xff5d8f, 0xe11d48, 0xffd23f, 0xff8a3d, 0x84cc16]), p[0] + (k % 2 - 0.5) * 0.18, p[1] + 0.1 + (k > 1 ? 0.12 : 0), p[2] + ((k >> 1) - 0.5) * 0.12, 0, 0, 0, 0.12); w.add('m', lathe([[0, 0], [0.26, 0], [0.3, 0.14], [0.28, 0.16], [0, 0.04]], 16, 'basket'), 0xc8925c, p[0], p[1], p[2]); }
    else if (goods === 'lettuce') lettuce(w, p[0], p[1], p[2], 0.8); else if (goods === 'flowers') { w.add('g', cyl(10), 0x9a6a3e, p[0], p[1], p[2], 0, 0, 0, 0.13, 0.22, 0.13); for (let k = 0; k < 5; k++) w.add('g', sph(8), pick([0xff5d8f, 0xffd23f, 0xa66bff, 0xffffff, 0xff8a3d]), p[0] + Math.cos(k * 1.3) * 0.1, p[1] + 0.35 + (k % 2) * 0.08, p[2] + Math.sin(k * 1.3) * 0.1, 0, 0, 0, 0.09); }
    else if (goods === 'pots') w.add('g', lathe([[0, 0], [0.12, 0], [0.18, 0.12], [0.12, 0.3], [0.14, 0.34], [0, 0.3]], 16, 'potMini'), pick([0xc8693c, 0x2dd4bf, 0xffd23f, 0x3b82f6, 0xff5d8f]), p[0], p[1], p[2]);
    else if (goods === 'shells') { w.add('g', sph(10), pick([0xffd6e8, 0xfef3c7, 0xbfe9ff, 0xffe4b5, 0xe9d5ff]), p[0], p[1] + 0.06, p[2], 0, R() * 3, 0, 0.18, 0.08, 0.14); w.add('g', torus(0.3, 12, PI), 0xffffff, p[0], p[1] + 0.08, p[2], PI / 2, 0, R() * 3, 0.12, 0.12, 0.05); } } }
export function tortStatue(w, x, z, ry, s = 1, col = 0xffc83d) { { const T = w.tf(x, 0, z, ry, s); T.slab('m', 0x57534e, 0, 0, 0, 2.6, 1.2, 2.6, 0.1); TH.pumpkin(w, K, x, 1.2 * s, z, 2.4 * s, true); return; } const T = w.tf(x, 0, z, ry, s); T.slab('m', 0xe8c9a0, 0, 0, 0, 2.6, 1.2, 2.6, 0.1); T.box('m', 0xd9b88a, 0, 1.2, 0, 2.9, 0.2, 2.9, 0.06);
  const A = 1.1, prof = []; for (let k = 0; k <= 12; k++) { const th = PI / 2 - k / 12 * PI / 2; prof.push([Math.max(0.0001, A * Math.sin(th)), 0.85 * Math.cos(th)]); } prof[prof.length - 1][0] = 0;
  T.add('x', lathe(prof, 36, 'statueShell'), col, 0, 1.6, 0, 0, 0, 0, 1, 1, 1.15); T.add('x', rcyl(1.15, 0.2, 0.08, 36), shade(col, 0.85), 0, 1.45, 0, 0, 0, 0, 1, 1, 1.15);
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; T.add('x', sph(10), shade(col, 1.1), Math.cos(a) * 0.62, 2.12, Math.sin(a) * 0.72, 0, 0, 0, 0.32, 0.08, 0.34); }
  T.add('x', sph(16), col, 0, 2.0, 1.4, 0, 0, 0, 0.36, 0.34, 0.42); T.add('x', capsule(12), col, 0, 1.75, 1.1, 0.8, 0, 0, 0.3, 0.4, 0.3); [[-0.75, 0.8], [0.75, 0.8], [-0.75, -0.8], [0.75, -0.8]].forEach(([a, b]) => T.add('x', capsule(10), col, a, 1.5, b, 0, 0, 0, 0.3, 0.3, 0.3));
  T.add('l', sph(10), 0xfff1a8, 0, 2.6, 0, 0, 0, 0, 0.12, 0.12, 0.12, 0.5); }
// ------------------------------------------------------------------------------------------------ an enterable building
// style: flat (adobe, parapet + vigas), dome, mound (burrow), gable (barn), glass (greenhouse)
export function building(w, B) { B = FA.restyle(B); const { x0, z0, x1, z1 } = B, ceil = B.ceil, eh = (B.wallH || ceil + 0.4), reg = B.id; const winTop = B.winTop || 3.2, winBot = B.winBot || 1.1; const st = B.style || 'flat'; const glass = st === 'glass';
  w.region = 'shell';
  floor(w, x0 + 0.2, z0 + 0.2, x1 - 0.2, z1 - 0.2, B.floor[0], FL, B.floor[1], B.floor[2], B.floor[3]);
  if (!glass) { ceiling(w, x0, z0, x1, z1, ceil, B.ceilCol || 0xfff8ec, { lamps: false }); w.lights.push({ x: (x0 + x1) / 2, y: ceil - 1, z: (z0 + z1) / 2, c: B.lightCol || 0xfff1dc, i: B.li || 24, d: Math.max(x1 - x0, z1 - z0) * 1.1 });
    if (B.lamps !== false) { w.region = reg; const nx = Math.max(1, Math.round((x1 - x0) / 6.5)), nz = Math.max(1, Math.round((z1 - z0) / 6.5)); for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const x = x0 + (i + 0.5) * (x1 - x0) / nx, z = z0 + (j + 0.5) * (z1 - z0) / nz, c = SUN[(i + j * 3) % 8];
      w.add('x', cyl(6), 0x7c4a1e, x, ceil - 0.45, z, 0, 0, 0, 0.02, 0.45, 0.02); w.add('g', lathe([[0, 0], [0.3, 0.05], [0.42, 0.35], [0.3, 0.62], [0.06, 0.7], [0, 0.7]], 20, 'pend'), c, x, ceil - 1.12, z, 0, 0, 0, 0.8, 0.8, 0.8); w.add('l', sph(12), 0xfff1c1, x, ceil - 0.92, z, 0, 0, 0, 0.21, 0.19, 0.21, 0.7); w.add('x', rcyl(0.12, 0.06, 0.02, 12), 0x334155, x, ceil - 0.95, z); } w.region = 'shell'; } }
  else w.lights.push({ x: (x0 + x1) / 2, y: ceil - 1, z: (z0 + z1) / 2, c: 0xfff6dc, i: 18, d: 18 });
  const sides = { s: ['x', z1, x0, x1, 1], n: ['x', z0, x0, x1, -1], w: ['z', x0, z0, z1, -1], e: ['z', x1, z0, z1, 1] };
  for (const sd of ['s', 'n', 'e', 'w']) { const [ax, at, a, b, out] = sides[sd]; const door = B.door.side === sd ? [B.door.a, B.door.b] : null;
    const holes = []; if (door) holes.push(D(door[0], door[1], B.door.h || 3.4));
    const wins = (B.noWin || '').includes(sd) || glass ? [] : winSlots(a, b, door, B.winW || 1.8, B.winStep || 4); wins.forEach(([p, q]) => holes.push(G(p, q, winTop, winBot)));
    const ext = ax === 'x' ? [a - 0.25, b + 0.25] : [a, b];
    w.region = 'shell'; wall(w, ax, at, ext[0], ext[1], eh, glass ? 0xcfefff : B.ext, holes, { frame: B.frame || 0xffffff, trim: B.trim || 0xfff1d6, base: B.base || shade(B.ext, 0.78), bucket: glass ? 'e' : 'w', noBase: glass });
    if (glass) { for (let p = a; p <= b + 0.01; p += 2) { if (door && p > door[0] - 0.2 && p < door[1] + 0.2) continue; const x = ax === 'x' ? p : at, z = ax === 'x' ? at : p; w.add('g', rbox(0.16, eh, 0.16, 0.05), 0xffffff, x, eh / 2, z); } [0.9, eh - 0.1].forEach((y) => { if (ax === 'x') w.add('g', rbox(b - a, 0.12, 0.16, 0.04), 0xffffff, (a + b) / 2, y, at); else w.add('g', rbox(0.16, 0.12, b - a, 0.04), 0xffffff, at, y, (a + b) / 2); }); }
    else { w.region = reg; const li = holes.map((h) => [h[0], h[1], h[2], h[3], h[4], 'noframe']); wall(w, ax, at - out * 0.31, a + 0.25, b - 0.25, ceil, B.int, li, { th: 0.12, noTrim: true, base: B.intBase || 0xffffff }); }
    // painted tile band + turquoise shutters + clay pots under windows (outside), curtains inside
    w.region = 'shell'; if (B.band && !glass) { if (ax === 'x') w.add('g', rbox(b - a + 0.6, 0.22, 0.06, 0.02), B.band, (a + b) / 2, eh - 0.6, at + out * 0.29); else w.add('g', rbox(0.06, 0.22, b - a, 0.02), B.band, at + out * 0.29, eh - 0.6, (a + b) / 2); }
    wins.forEach(([p, q]) => { const c = (p + q) / 2, Wd = q - p; w.region = 'shell'; const T = ax === 'x' ? w.tf(c, 0, at + out * 0.3, out > 0 ? 0 : PI) : w.tf(at + out * 0.3, 0, c, out > 0 ? PI / 2 : -PI / 2);
      T.box('m', 0xf5e6cc, 0, winBot - 0.16, 0.14, Wd + 0.4, 0.16, 0.3, 0.05); [-1, 1].forEach((s2) => { T.box('m', B.shutters || 0x14b8a6, s2 * (Wd / 2 + 0.34), winBot, 0.06, 0.5, winTop - winBot, 0.08, 0.04); for (let k = 0; k < 4; k++) T.box('m', shade(B.shutters || 0x14b8a6, 0.8), s2 * (Wd / 2 + 0.34), winBot + 0.3 + k * (winTop - winBot - 0.4) / 3, 0.11, 0.42, 0.05, 0.02, 0.01); });
      if (st !== 'mound') T.add('g', torus(0.25, 24, PI), B.frame || 0xffffff, 0, winTop, 0.02, 0, 0, 0, Wd / 2 + 0.05, 0.4, 0.6);
      if (!B.noPots && R() < 0.7) { const pp = T.P(Wd / 2 + 0.9, 0, 0.7); claypot(w, pp[0], pp[2], 0.75, pick([0xc8693c, 0x2dd4bf, 0x3b82f6, 0xffb020]), pick(['flower', 'cactus', 'agave'])); }
      w.region = reg; const Ti = ax === 'x' ? w.tf(c, 0, at - out * 0.4, out > 0 ? PI : 0) : w.tf(at - out * 0.4, 0, c, out > 0 ? -PI / 2 : PI / 2);
      if (B.curtain) { [-1, 1].forEach((s2) => Ti.box('f', B.curtain, s2 * (Wd / 2 + 0.05), winBot - 0.2, 0.02, 0.45, winTop - winBot + 0.5, 0.08, 0.04)); Ti.box('x', 0xd4a017, 0, winTop + 0.3, 0.04, Wd + 1.2, 0.06, 0.06, 0.03); } }); }
  w.region = 'shell'; const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, W = x1 - x0, Dd = z1 - z0;
  // ---- roofs
  if (st === 'flat' || st === 'dome' || st === 'tower') { w.add('m', rbox(W + 0.7, 0.4, Dd + 0.7, 0.08), shade(B.ext, 0.94), cx, eh + 0.2, cz); w.solid(x0 - 0.35, eh, z0 - 0.35, x1 + 0.35, eh + 0.4, z1 + 0.35, { cam: true, roof: true });
    [[cx, z0 - 0.15, W + 0.7, 0.3], [cx, z1 + 0.15, W + 0.7, 0.3]].forEach(([x, z, l, t]) => w.add('m', rbox(l, 0.7, t, 0.12), B.ext, x, eh + 0.75, z)); [[x0 - 0.15, cz], [x1 + 0.15, cz]].forEach(([x, z]) => w.add('m', rbox(0.3, 0.7, Dd + 0.7, 0.12), B.ext, x, eh + 0.75, z));
    for (let p = x0 + 0.8; p < x1 - 0.4; p += 1.7) [z0, z1].forEach((z, i) => w.add('m', cyl(10), 0x7c4a1e, p, eh - 0.35, z + (i ? 0.25 : -0.25), PI / 2 * (i ? 1 : -1), 0, 0, 0.13, 0.75, 0.13));
    if (st === 'dome' || st === 'tower') { const r = B.domeR || Math.min(W, Dd) * 0.32, dc = B.domeCol || 0x2dd4bf, dx = B.domeAt ? B.domeAt[0] : cx, dz = B.domeAt ? B.domeAt[1] : cz;
      w.add('m', rcyl(r * 1.05, 0.9, 0.1, 40), B.ext, dx, eh + 0.4, dz); const pr = []; for (let k = 0; k <= 14; k++) { const t = k / 14 * PI / 2; pr.push([Math.max(0.0001, Math.cos(t) * r), Math.sin(t) * r * (st === 'tower' ? 1 : 1.1)]); } pr[pr.length - 1][0] = 0;
      w.add(st === 'tower' ? 'g' : 'g', lathe(pr, 40, 'dome' + r.toFixed(2) + st), dc, dx, eh + 1.3, dz); for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; const q = []; for (let k = 0; k <= 8; k++) { const t = k / 8 * PI / 2 * 0.96; q.push([dx + Math.cos(a) * Math.cos(t) * r * 1.01, eh + 1.3 + Math.sin(t) * r * (st === 'tower' ? 1 : 1.1) * 1.01, dz + Math.sin(a) * Math.cos(t) * r * 1.01]); } if (st !== 'tower') w.add('g', tube(q, 0.05, 12, 5), 0xffd23f, 0, 0, 0); }
      if (st === 'tower') { w.add('m', rbox(0.9, r * 0.9, r * 2.06, 0.1), 0x1f2937, dx, eh + 1.3 + r * 0.45, dz, 0, 0, -0.5); w.add('x', cyl(16), 0xcbd5e1, dx + r * 0.3, eh + 1.3 + r * 0.6, dz, 0, 0, -0.9, 0.3, r * 1.0, 0.3); }
      else { w.add('x', sph(12), 0xffd23f, dx, eh + 1.3 + r * 1.1 + 0.15, dz, 0, 0, 0, 0.25); w.add('x', cyl(8), 0xd4a017, dx, eh + 1.3 + r * 1.1, dz, 0, 0, 0, 0.04, 0.9, 0.04); w.add('x', star(), 0xffd23f, dx, eh + 2.5 + r * 1.1, dz, 0, 0, 0, 0.3, 0.3, 0.1); } } }
  else if (st === 'mound') { const pr = []; for (let k = 0; k <= 14; k++) { const t = k / 14 * PI / 2; pr.push([Math.max(0.0001, Math.cos(t)), Math.sin(t)]); } pr[pr.length - 1][0] = 0;
    w.add('m', lathe(pr, 48, 'mound'), B.roofCol || 0xd8b07a, cx, eh - 0.6, cz, 0, 0, 0, W * 0.62, B.moundH || 3.2, Dd * 0.62); w.add('m', lathe(pr, 40, 'moundG'), 0x6fbf55, cx, eh - 0.5 + (B.moundH || 3.2) * 0.72, cz, 0, 0, 0, W * 0.36, (B.moundH || 3.2) * 0.3, Dd * 0.36);
    w.solid(x0 - 0.35, eh - 0.6, z0 - 0.35, x1 + 0.35, eh + (B.moundH || 3.2) * 0.5, z1 + 0.35, { cam: true, roof: true });
    w.detail = true; for (let i = 0; i < 26; i++) { const a = R() * PI * 2, rr = 0.2 + R() * 0.25, h = eh - 0.5 + (B.moundH || 3.2) * Math.sqrt(1 - rr * rr * 2.2) * 0.98; if (!(h > eh)) continue; w.add('g', sph(8), pick([0xff5d8f, 0xffd23f, 0xffffff, 0xa66bff]), cx + Math.cos(a) * rr * W, h + 0.05, cz + Math.sin(a) * rr * Dd, 0, 0, 0, 0.14); } w.detail = false;
    if (B.chimney) { const [chx, chz] = B.chimney; w.add('m', rcyl(0.55, 2.6, 0.12, 20), 0xc2563c, chx, eh, chz); w.add('m', rcyl(0.7, 0.25, 0.08, 20), 0x9a3f2a, chx, eh + 2.55, chz); } }
  else if (st === 'gable' || st === 'glass') { const alongX = W >= Dd; const L = (alongX ? W : Dd) + 0.5, Wr = (alongX ? Dd : W) + 0.5, H = B.roofH || Wr * 0.4, ry = alongX ? PI / 2 : 0;
    w.add(glass ? 'e' : 'm', prism(Wr, H, L), glass ? 0xcfefff : B.ext, cx, eh, cz, 0, ry, 0); const a = Math.atan2(H, Wr / 2), sl = Math.hypot(Wr / 2, H) + 0.6;
    if (!glass) [-1, 1].forEach((s) => { const T = w.tf(cx, eh, cz, ry); T.add('g', rbox(sl, 0.26, L + 1.0, 0.1), B.roofCol || 0xb4533a, s * (Wr / 4 + 0.1), H / 2 + 0.12, 0, 0, 0, -s * a); for (let i = 1; i < 5; i++) { const f = i / 5; T.add('g', rbox(0.4, 0.08, L + 1.02, 0.03), shade(B.roofCol || 0xb4533a, i % 2 ? 0.86 : 1.1), s * (Wr / 2 + 0.3) * (1 - f) + s * 0.06, H * f + 0.12, 0, 0, 0, -s * a); } });
    else { const T = w.tf(cx, eh, cz, ry); for (let p = -L / 2; p <= L / 2 + 0.01; p += 2) [-1, 1].forEach((s) => T.add('g', rbox(sl - 0.5, 0.1, 0.12, 0.03), 0xffffff, s * Wr / 4, H / 2, p, 0, 0, -s * a)); T.add('g', cyl(10), 0xffffff, 0, H, 0, PI / 2, 0, 0, 0.1, L, 0.1); }
    w.solid(x0 - 0.3, eh, z0 - 0.3, x1 + 0.3, eh + H * 0.5, z1 + 0.3, { cam: true, roof: true }); }
  // ---- door: arch, step, mat, lanterns, awning, sign
  { const d = B.door, [ax, at, , , out] = sides[d.side], c = (d.a + d.b) / 2, Wd = d.b - d.a, dh = d.h || 3.4; w.region = 'shell';
    const T = ax === 'x' ? w.tf(c, 0, at, out > 0 ? 0 : PI) : w.tf(at, 0, c, out > 0 ? PI / 2 : -PI / 2);
    T.box('m', 0xe8d5b5, 0, 0, 0.6, Wd + 1.2, FL, 1.2, 0.04); T.box('f', B.mat || 0xe2733f, 0, FL, 1.0, Wd * 0.8, 0.03, 0.9, 0.03); for (let k = 0; k < 5; k++) T.box('f', SUN[k], -Wd * 0.32 + k * Wd * 0.16, FL + 0.03, 1.0, Wd * 0.06, 0.01, 0.8, 0.01);
    if (!glass) { T.add('g', torus(0.22, 28, PI), B.archCol || 0xffd23f, 0, dh, 0.28, 0, 0, 0, Wd / 2 + 0.25, 0.7, 1); for (let k = 0; k < 7; k++) { const a = k / 6 * PI; T.add('g', sph(8), SUN[k], Math.cos(a) * (Wd / 2 + 0.25), dh + Math.sin(a) * 0.7 * (Wd / 2 + 0.25), 0.42, 0, 0, 0, 0.1); } }
    if (B.awning) { const [a1, a2] = B.awning, aw = Wd + 2.6, ah = dh + 0.6; for (let i = 0; i < 8; i++) T.add('f', rbox(aw / 8, 0.1, 1.7, 0.03), i % 2 ? a2 : a1, -aw / 2 + aw / 16 + i * aw / 8, ah + 0.35, 1.0, -0.38, 0, 0); for (let i = 0; i < 8; i++) T.add('f', sph(10), i % 2 ? a2 : a1, -aw / 2 + aw / 16 + i * aw / 8, ah - 0.02, 1.78, 0, 0, 0, aw / 16, 0.16, 0.08); }
    [-1, 1].forEach((s2) => { T.add('x', rcyl(0.1, 0.06, 0.02, 12), 0x334155, s2 * (Wd / 2 + 0.6), 2.5, 0.32, PI / 2, 0, 0); T.add('m', lathe([[0, 0], [0.16, 0.02], [0.2, 0.25], [0.12, 0.4], [0, 0.42]], 16, 'lantern'), 0x334155, s2 * (Wd / 2 + 0.6), 2.3, 0.5); T.add('l', sph(10), 0xffd28a, s2 * (Wd / 2 + 0.6), 2.45, 0.5, 0, 0, 0, 0.13, 0.15, 0.13, 0.7); });
    if (B.sign) { const S = B.sign, p = T.P(0, 0, 0.32); sign3d(w, S[0], p[0], dh + (B.awning ? 1.6 : 1.2), p[2], T.ry, S[1] || 0.42, S[2] || 0xffffff, S[3] === undefined ? 0xe2733f : S[3]); }
    w.lights.push({ x: T.P(0, 0, 2)[0], y: 3, z: T.P(0, 0, 2)[2], c: 0xffc98a, i: 10, d: 10, out: true }); }
  FA.facade(w, B); w.region = reg; return B; }
// ------------------------------------------------------------------------------------------------ build
export function buildTown(w) {
  K.propSeed(1947); w.inter = []; w.gears = []; w.secrets = []; w.spots = {}; w.dyn = w.dyn || []; w.plots = []; w.toys = []; w.glyphs = [];
  w.env = Object.assign({}, TH.ENV);
  I = (o) => { w.inter.push(o); return o; }; w.I = I;
  w.region = 'shell'; ground(w); w.region = 'out'; square(w); market(w); burrows(w); hill(w); track(w); farm(w); dunes(w); LY.newLand(w, K, TH, floor, mesa);
  shells(w); interiors(w); tortuga(w); districts(w); underground(w); w.region = 'out'; expressStops(w); TH.dress(w, K); TH.dressInside(w, K, REGIONS); HOL.buildStations(w, K); w.region = 'shell';
  w.start = [0, 0.2, 21]; w.startYaw = PI; w.camDist = 9.5; LY.relayout(w, { REGIONS, AREAS, DOORS, STOPS, TRACK }); { const rg_ = w.region; w.region = 'out'; LY.doorPaths(w, floor, REGIONS, DOORS); w.region = rg_; }
  return w; }
export function tcrate(w, x, y, z, s = 1, col = 0xd8a15a, top = 'lettuce') { const T = w.tf(x, y, z, R() * 0.3, s); T.slab('m', col, 0, 0, 0, 1, 0.8, 1, 0.06); [-1, 1].forEach((sd) => { T.box('m', shade(col, 0.8), 0, 0.05, sd * 0.505, 0.9, 0.12, 0.03, 0.02); T.box('m', shade(col, 0.8), 0, 0.62, sd * 0.505, 0.9, 0.12, 0.03, 0.02); T.box('m', shade(col, 0.8), sd * 0.505, 0.05, 0, 0.03, 0.12, 0.9, 0.02); T.box('m', shade(col, 0.8), sd * 0.505, 0.62, 0, 0.03, 0.12, 0.9, 0.02); });
  if (top === 'lettuce') { for (let k = 0; k < 4; k++) { const p = T.P((k % 2 - 0.5) * 0.45, 0.8, ((k >> 1) - 0.5) * 0.45); lettuce(w, p[0], p[1] - 0.1, p[2], 0.75 * s); } } else if (top === 'fruit') for (let k = 0; k < 6; k++) { const p = T.P((k % 3 - 1) * 0.3, 0.88, ((k / 3 | 0) - 0.5) * 0.36); w.add('g', sph(10), pick([0xff5d8f, 0xe11d48, 0xffd23f, 0xff8a3d]), p[0], p[1], p[2], 0, 0, 0, 0.16 * s); } return y + 0.8 * s; }
export function sunShell(w, x, y, z) { w.gears.push([x, y, z]); }
// ------------------------------------------------------------------------------------------------ ground: warm sand, oasis grass, farm soil, sandstone paths
function ground(w) {
  const gg = new THREE.PlaneGeometry(LY.MAPR * 2, LY.MAPR * 2, 150, 150).rotateX(-PI / 2); { const P2 = gg.attributes.position; for (let i = 0; i < P2.count; i++) { const q_ = LY.DB(P2.getX(i), P2.getZ(i)) || [999, 999]; const ex = q_[0] / 11.2, ez = q_[1] / 8.4; if (ex * ex + ez * ez < 1) P2.setY(i, -0.8); } gg.computeVertexNormals(); } const cA = new THREE.Color(), cB = new THREE.Color();
  w._gnd = 1; w.addFn('m', gg, (c, x, y, z) => { const n = Math.sin(x * 0.19) * Math.cos(z * 0.15) + Math.sin(x * 0.06 + z * 0.09) * 0.8; c.setHex(0xf0cf98).lerp(cA.set(n > 0.4 ? 0xf6dcae : n < -0.6 ? 0xe2b57c : 0xecc48c), 0.7);
    const ro = Math.hypot(x, z); if (ro < 33.5) c.setHex(0x9a5a34); else if (ro < 42) c.lerp(cB.set(0x8fd27a), Math.max(0, Math.min(1, (42 - ro) / 6)) * 0.8);
    if (x < -42 && z > 36) c.lerp(cB.set(0xa8784c), 0.55); if (z < -70) c.lerp(cB.set(0xe9a982), 0.4); if (x > 80 && z > 30) c.lerp(cB.set(0xf7d9a2), 0.5); }, 0, -0.02, 0); w._gnd = 0;
  w.solid(-LY.MAPR, -3, -LY.MAPR, LY.MAPR, 0, LY.MAPR, { floor: true });
  const pave = (a, b, c, d) => { if (Math.abs(a + c) < 1 && Math.abs(b + d) < 1) floor(w, a, b, c, d, 'tile', 0.0, 0xe8cfa6, 0xd9b98a, 1.4); };
  pave(30, -6, 122, 6); pave(-122, -6, -30, 6); pave(-4, -42, 4, -30); pave(12, -94, 18, -34); pave(-30, -94, 30, -88); pave(-4, 30, 4, 74); pave(-82, 6, -76, 40); pave(98, 6, 104, 62);
  pave(-40, -42, -34, -30); pave(34, -42, 40, -30); pave(-41, 30, -35, 40); pave(34, 30, 40, 40); pave(-12, 80, -4, 84);
  // plaza mosaic disc (radial sun tiles)
  { const pos = [], H = 0.07; // sun-ray mosaic: real raised 3D tiles (top + bevelled sides) with warm grout between, a hole for the pond
    for (let ring = 0; ring < 15; ring++) { const r0 = ring * 2.2, r1 = Math.min(33, r0 + 2.2), n = 16 + ring * 4; for (let k = 0; k < n; k++) { const a0 = k / n * PI * 2, a1 = (k + 1) / n * PI * 2, am = (a0 + a1) / 2, rm = (r0 + r1) / 2; const cx = Math.cos(am) * rm, cz = Math.sin(am) * rm; if ((cx / 10.6) ** 2 + (cz / 8.1) ** 2 < 1) continue;
      const g = 0.09, ri = r0 + g, ro = r1 - g, b0 = a0 + g / Math.max(1, rm), b1 = a1 - g / Math.max(1, rm); const segs = Math.max(1, Math.ceil((b1 - b0) * ro / 1.2));
      const P2 = (a, r, y) => [Math.cos(a) * r, y, Math.sin(a) * r], quad = (A, B, C, D) => pos.push(...A, ...C, ...B, ...A, ...D, ...C), bv = 0.05;
      for (let s2 = 0; s2 < segs; s2++) { const c0 = b0 + (b1 - b0) * s2 / segs, c1 = b0 + (b1 - b0) * (s2 + 1) / segs, e0 = s2 === 0 ? bv / rm : 0, e1 = s2 === segs - 1 ? bv / rm : 0;
        quad(P2(c0 + e0, ri + bv, H), P2(c0 + e0, ro - bv, H), P2(c1 - e1, ro - bv, H), P2(c1 - e1, ri + bv, H));
        quad(P2(c0, ro, 0), P2(c1, ro, 0), P2(c1 - e1, ro - bv, H), P2(c0 + e0, ro - bv, H)); quad(P2(c1, ri, 0), P2(c0, ri, 0), P2(c0 + e0, ri + bv, H), P2(c1 - e1, ri + bv, H));
        if (s2 === 0) quad(P2(c0, ri, 0), P2(c0, ro, 0), P2(c0 + e0, ro - bv, H), P2(c0 + e0, ri + bv, H)); if (s2 === segs - 1) quad(P2(c1, ro, 0), P2(c1, ri, 0), P2(c1 - e1, ri + bv, H), P2(c1 - e1, ro - bv, H)); } } }
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); dg.computeVertexNormals();
    const tc = (ring, k) => { if (ring >= 14) return k % 2 ? 0xb8612f : 0xc97a3e; const m = ring % 4; if (m === 0) return k % 2 ? 0xd9773f : 0xe9a04f; if (m === 1) return (k % 5 === 0) ? 0x16a69a : 0xf0c27a; if (m === 2) return k % 3 === 0 ? 0xff7a50 : k % 3 === 1 ? 0xf6d08a : 0xe8a85a; return k % 4 === 0 ? 0x1fb5a8 : k % 4 === 2 ? 0xffb020 : 0xf3d6a0; };
    w.addFn('g', dg, (c, x, y, z) => { const r = Math.hypot(x, z), ring = Math.min(14, Math.floor(r / 2.2)), n = 16 + ring * 4, k = Math.floor(((Math.atan2(z, x) + PI * 2) % (PI * 2)) / (PI * 2 / n)); c.setHex(tc(ring, k)); if (y < 0.03) c.multiplyScalar(0.82); }, 0, 0.0, 0); }
  w.add('m', torus(0.012, 96), 0xc98a4a, 0, 0.02, 0, PI / 2, 0, 0, 33, 33, 12);
}
// ------------------------------------------------------------------------------------------------ PUMPKIN SQUARE
function square(w) { const S = w.spots;
  // pond: sandy bowl, water, stone rim, lily pads, a little rock waterfall
  S.pond = [0, 0, 9.5, 7]; w.add('m', lathe([[0, 0], [1, 0.02], [1.02, 0.42]], 64, 'pondBowl'), 0xd9b27a, 0, -0.6, 0, 0, 0, 0, 9.6, 1, 7.1);
  w.add('e', new THREE.CircleGeometry(1, 64).rotateX(-PI / 2), 0x38bdf8, 0, -0.22, 0, 0, 0, 0, 9.4, 1, 6.9); w.add('m', new THREE.CircleGeometry(1, 48).rotateX(-PI / 2), 0x0e7490, 0, -0.5, 0, 0, 0, 0, 9.2, 1, 6.7);
  for (let i = 0; i < 44; i++) { const a = i / 44 * PI * 2; w.add('m', blobGeo(i & 31, 0.18, 1), pick([0xd6c2a0, 0xc9b08a, 0xe2d2b4]), Math.cos(a) * 9.9, 0.08, Math.sin(a) * 7.4, 0, a, 0, 0.75, 0.3, 0.55); }
  for (let i = 0; i < 9; i++) { const a = i * 0.7 + 0.3, r = 3 + (i % 3) * 2; w.add('g', rcyl(0.55, 0.04, 0.02, 20), 0x3fae5a, Math.cos(a) * r, -0.2, Math.sin(a) * r * 0.7); if (i % 3 === 0) { w.add('g', sph(8), 0xff9fd0, Math.cos(a) * r, -0.08, Math.sin(a) * r * 0.7, 0, 0, 0, 0.16, 0.1, 0.16); } }
  { const x = -6.8, z = -4.2; for (let i = 0; i < 4; i++) w.add('m', blobGeo(i + 3, 0.2, 2), [0xc98a4a, 0xd9a066, 0xb87a3e][i % 3], x + (i % 2) * 0.8, 0.3 + i * 0.45, z - i * 0.25, 0, i, 0, 1.3 - i * 0.2, 0.6, 1.0 - i * 0.12); w.add('e', rbox(0.6, 1.8, 0.2, 0.08), 0x7dd3fc, x + 0.6, 1.1, z + 0.9); S.fall = [x + 0.6, 2.0, z + 0.9]; w.solid(x - 1.2, 0, z - 1.4, x + 1.6, 2.2, z + 1.0); }
  // palms ring + benches + flower beds
  for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2 + 0.2; palm(w, Math.cos(a) * 13, Math.sin(a) * 10.5, 0.95 + (i % 3) * 0.1, 0.3 + (i % 2) * 0.4, a + PI); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + PI / 8; K.bench(w, Math.cos(a) * 19, Math.sin(a) * 19, -a - PI / 2 + PI, pick([0x14b8a6, 0xe2733f, 0xffb020])); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; const x = Math.cos(a) * 24, z = Math.sin(a) * 24; if (Math.abs(x) < 6 && z < 0) continue; if (Math.abs(x) < 6 && z > 0) continue;
    w.add('m', rcyl(2.0, 0.5, 0.15, 32), 0xd9a066, x, 0, z); w.add('m', rcyl(1.85, 0.06, 0.03, 32), 0x7a4a26, x, 0.48, z); w.solid(x - 1.6, 0, z - 1.6, x + 1.6, 0.5, z + 1.6, { cam: false });
    w.detail = true; for (let k = 0; k < 16; k++) { const b = R() * PI * 2, rr = R() * 1.6; w.add('g', sph(8), pick([0xff5d8f, 0xffd23f, 0xff8a3d, 0xa66bff, 0xffffff]), x + Math.cos(b) * rr, 0.75 + R() * 0.2, z + Math.sin(b) * rr, 0, 0, 0, 0.13); w.add('g', sph(6), 0x3fae5a, x + Math.cos(b + 0.3) * rr, 0.6, z + Math.sin(b + 0.3) * rr, 0, 0, 0, 0.15, 0.08, 0.15); } w.detail = false;
    if (i % 2) barrel(w, x, z, 0.8, 0.5); else agave(w, x, z, 1.1, 0.5); }
  // founder statue + Sun Gate arch toward Town Hall
  tortStatue(w, 0, -16, 0, 1.0); sign3d(w, 'OLD SHIVERTON', 0, 0.7, -14.6, 0, 0.14, 0x7c2d12, 0xfff1d6);
  { const z = -30; [-5.5, 5.5].forEach((x) => { w.add('m', rbox(2.0, 6.5, 2.0, 0.3), 0xe0a86a, x, 3.25, z); w.add('m', rbox(2.4, 0.5, 2.4, 0.15), 0xc98a4a, x, 6.6, z); w.solid(x - 1, 0, z - 1, x + 1, 6.8, z + 1); for (let k = 0; k < 6; k++) w.add('g', rbox(2.04, 0.18, 2.04, 0.05), SUN[k], x, 0.6 + k * 1.0, z); });
    w.add('m', torus(0.4, 40, PI), 0xe0a86a, 0, 6.5, z, 0, 0, 0, 5.5, 2.4, 1.6); w.add('l', rcyl(1.4, 0.3, 0.1, 36), 0xffb020, 0, 8.9, z, PI / 2, 0, 0, 1, 1, 1, 0.5); for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; w.add('g', cone(8), 0xffd23f, Math.cos(a) * 1.8, 8.9 + Math.sin(a) * 1.8, z, 0, 0, a - PI / 2, 0.22, 0.7, 0.1); }
    sign3d(w, 'PUMPKIN HOLLOW', 0, 6.6, z + 0.9, 0, 0.5, 0xffffff, 0xe2733f); }
  // festival strings between palms and buildings
  for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2 + 0.2, b = a + PI / 5; lanternString(w, [[Math.cos(a) * 13, 6.6, Math.sin(a) * 10.5], [Math.cos((a + b) / 2) * 15.5, 5.6, Math.sin((a + b) / 2) * 12.5], [Math.cos(b) * 13, 6.6, Math.sin(b) * 10.5]], SUN, 8); }
  flagString(w, [[-30, 5, -36], [-15, 4.2, -33], [0, 5, -31]]); flagString(w, [[0, 5, -31], [15, 4.2, -33], [30, 5, -36]]); flagString(w, [[-30, 5, 36], [0, 4.2, 32], [30, 5, 36]]);
  // carts, well, notice board, sandbox, outdoor café tables, express stop decor
  stall(w, -26, 6, PI / 2, 0xff5d8f, 0xffffff, 'fruit'); stall(w, 26, -6, -PI / 2, 0x2dd4bf, 0xffffff, 'flowers'); stall(w, -22, -22, PI / 4, 0xffb020, 0xffffff, 'lettuce'); stall(w, 22, 22, -3 * PI / 4, 0xa66bff, 0xffffff, 'shells');
  { const x = -26, z = -12; w.add('m', rcyl(1.3, 1.0, 0.15, 28), 0xc9b08a, x, 0, z); w.add('m', torus(0.25, 28), 0xb39770, x, 1.0, z, PI / 2, 0, 0, 1.2, 1.2, 0.8); w.add('e', new THREE.CircleGeometry(1.05, 28).rotateX(-PI / 2), 0x38bdf8, x, 0.8, z); [-1, 1].forEach((s) => w.add('m', rbox(0.18, 2.2, 0.18, 0.05), 0x7c4a1e, x + s * 1.2, 1.1, z)); w.add('m', prism(2.9, 0.9, 1.4), 0xb4533a, x, 2.2, z, 0, PI / 2, 0); w.add('m', lathe([[0, 0], [0.22, 0], [0.26, 0.4], [0, 0.4]], 16, 'bucket'), 0x8a5a32, x, 1.4, z); w.solid(x - 1.3, 0, z - 1.3, x + 1.3, 1.1, z + 1.3); S.well = [x, z]; }
  { const T = w.tf(-10, 0, 25, PI); T.slab('m', 0x9a6a3e, 0, 0, 0, 3.4, 2.6, 0.25, 0.05); T.box('m', 0xf5deb3, 0, 1.0, 0.14, 3.0, 1.4, 0.04, 0.02); for (let i = 0; i < 6; i++) T.box('m', pick([0xfef3c7, 0xbfe9ff, 0xffd6e8, 0xd9f99d]), -1.1 + (i % 3) * 1.1, 1.15 + Math.floor(i / 3) * 0.65, 0.17, 0.8, 0.5, 0.01, 0.01); T.add('m', prism(3.8, 0.6, 0.6), 0xb4533a, 0, 2.6, 0); sign3d(w, 'HAUNTED HEADLINES', -10, 2.95, 24.6, PI, 0.14, 0xffffff, 0x7c2d12); }
  I({ kind: 'fun', x: -10, y: 0, z: 24, r: 2.4, label: '📰 Read the town news', msgs: ['📰 "MIDNIGHT FESTIVAL TONIGHT! Bring a cushion. Bring patience."', '📰 "Broomstick Derby record: 4 minutes. Crowd: thrilled."', '📰 "Lost: one witch hat. Last seen blowing toward the Bat Cliffs."', '📰 "Library reminder: books are due back eventually. No rush."'] });
  { const x = 22, z = 10; w.add('m', rbox(4.2, 0.4, 3.2, 0.15), 0xc58b52, x, 0.2, z); w.add('m', rbox(3.8, 0.1, 2.8, 0.05), 0xf6dcae, x, 0.4, z); w.solid(x - 2.1, 0, z - 1.6, x + 2.1, 0.4, z + 1.6, { cam: false }); [[0xef4444, -1], [0x3b82f6, 0.6]].forEach(([c, o]) => { w.add('g', lathe([[0, 0], [0.24, 0], [0.32, 0.28], [0, 0.28]], 16, 'pail'), c, x + o, 0.45, z - 0.5); w.add('g', rbox(0.1, 0.5, 0.06, 0.02), c, x + o + 0.4, 0.55, z + 0.3, 0.5, 0, 0); }); for (let i = 0; i < 4; i++) w.add('m', lathe([[0, 0], [0.35, 0], [0.3, 0.3], [0.12, 0.45], [0, 0.45]], 14, 'castle'), 0xe8c48e, x - 1.2 + i * 0.7, 0.42, z + 0.6, 0, 0, 0, 0.6, 0.8, 0.6); }
  [[-8, 30], [8, 30]].forEach(([x, z]) => K.lampPost(w, x, z)); for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; K.lampPost(w, Math.cos(a) * 31, Math.sin(a) * 31); }
  // shuttle-cart track around the plaza (sand ring) + its little stop
  w.add('m', new THREE.RingGeometry(33.4, 36.4, 128).rotateX(-PI / 2), 0xd9b27a, 0, 0.008, 0); S.cart = { r: 34.9 };
  // café terrace (outside the Cauldron Café)
  [[31, -38], [36, -36], [42, -38]].forEach(([x, z], i) => { K.tableR(w, x, z, 0.7, 0.8, 0xffffff); for (let k = 0; k < 3; k++) { const a = k * 2.1; K.stool(w, x + Math.cos(a) * 1.1, z + Math.sin(a) * 1.1, SUN[(i + k) % 8]); } w.add('x', cyl(8), 0xd1d5db, x, 0.8, z, 0, 0, 0, 0.04, 2.0, 0.04); for (let k = 0; k < 8; k++) w.add('f', cone(3), k % 2 ? 0x4ade80 : 0xffffff, x, 2.55, z, 0, k / 8 * PI * 2, 0, 1.6, 0.6, 0.6); });
  // pond-side life: picnic umbrellas, a little fishing pier, lemonade cart, painter's easel, pots of blooms
  [[-7.75, 13.4, 0xff5d8f], [7.75, -13.4, 0x2dd4bf], [-14.6, -5.6, 0xffb020]].forEach(([x, z, c], i) => { w.add('x', cyl(8), 0xf5f5f0, x, 0, z, 0, 0, 0, 0.05, 2.9, 0.05);
    w.addFn('f', lathe([[1.75, 0], [1.7, 0.02], [0.9, 0.35], [0, 0.55]], 32, 'umb2'), (cc, px, py, pz) => cc.setHex(Math.floor((Math.atan2(pz, px) + PI) / (PI / 4)) % 2 ? c : 0xffffff), x, 2.4, z, 0, 0, 0, 1.15, 1, 1.15); w.add('g', sph(10), c, x, 3.05, z, 0, 0, 0, 0.1);
    w.add('m', rcyl(0.8, 0.08, 0.03, 28), 0xc58b52, x, 0.42, z); w.add('m', cyl(8), 0x9a6a3e, x, 0, z, 0, 0, 0, 0.08, 0.42, 0.08); w.solid(x - 0.8, 0, z - 0.8, x + 0.8, 0.5, z + 0.8, { cam: false });
    w.add('g', rcyl(0.3, 0.06, 0.02, 20), 0xffffff, x - 0.3, 0.5, z + 0.2); w.add('g', sph(12), 0x4cbb3c, x - 0.3, 0.6, z + 0.2, 0, 0, 0, 0.2, 0.12, 0.2); w.add('g', lathe([[0, 0], [0.08, 0], [0.09, 0.2], [0, 0.2]], 14, 'cup'), SUN[i + 2], x + 0.35, 0.5, z - 0.1);
    [0, 2.1, 4.2].forEach((a) => w.add('f', sph(14), SUN[(i * 3 + a * 2) % 8 | 0], x + Math.cos(a + i) * 1.3, 0.18, z + Math.sin(a + i) * 1.3, 0, 0, 0, 0.45, 0.18, 0.45)); w.add('m', new THREE.CircleGeometry(1.9, 40).rotateX(-PI / 2), i % 2 ? 0xfde68a : 0xfbcfe8, x, 0.085, z); });
  { const x = -1, z0 = 4.6, z1 = 9.4; w.add('m', rbox(1.8, 0.14, z1 - z0, 0.04), 0xb7773f, x, 0.08, (z0 + z1) / 2); for (let k = 0; k < 8; k++) w.add('m', rbox(1.84, 0.03, 0.06, 0.01), 0x8a5a32, x, 0.16, z0 + 0.3 + k * 0.6);
    [-0.85, 0.85].forEach((o) => { for (let k = 0; k < 4; k++) w.add('m', cyl(8), 0x7c4a1e, x + o, -0.6, z0 + 0.2 + k * 1.4, 0, 0, 0, 0.08, 1.4, 0.08); w.add('m', rbox(0.08, 0.08, z1 - z0 - 0.4, 0.03), 0x9a6a3e, x + o, 0.75, (z0 + z1) / 2 - 0.2); for (let k = 0; k < 4; k++) w.add('m', cyl(8), 0x9a6a3e, x + o, 0.15, z0 + 0.2 + k * 1.4, 0, 0, 0, 0.05, 0.6, 0.05); });
    w.solid(x - 0.9, 0, z0, x + 0.9, 0.16, z1, { floor: true }); w.add('x', cyl(6), 0x7c4a1e, x + 0.5, 0.5, z0 + 0.4, 0.6, 0, 0.3, 0.02, 1.6, 0.02); S.fishLine = [x + 0.9, -0.2, z0 - 0.6]; tcrate(w, x - 0.4, 0.16, z0 + 1.2, 0.5, 0x9a6a3e, 'none'); }
  { const T = w.tf(12, 0, -13, -0.7); T.slab('m', 0xfef3c7, 0, 0.5, 0, 1.8, 0.9, 1.0, 0.12); T.slab('g', 0xffd23f, 0, 1.38, 0, 1.9, 0.08, 1.1, 0.04); [-1, 1].forEach((s2) => { T.add('m', torus(0.3, 20), 0xef4444, s2 * 0.7, 0.32, 0.52, 0, 0, 0, 0.3, 0.3, 0.3); T.add('x', cyl(6), 0xffffff, s2 * 0.85, 1.4, -0.45, 0, 0, 0, 0.03, 1.2, 0.03); });
    T.add('f', rbox(2.1, 0.08, 1.4, 0.03), 0xffd23f, 0, 2.6, 0, 0.12, 0, 0); for (let k = 0; k < 3; k++) T.add('e', lathe([[0, 0], [0.16, 0], [0.18, 0.5], [0, 0.5]], 16, 'jug'), [0xfff27a, 0xff9fd0, 0x9cf27a][k], -0.55 + k * 0.55, 1.42, 0.1); T.solid(-0.95, 0, -0.55, 0.95, 1.4, 0.55); sign3d(w, 'WITCH BREW LEMONADE', 12.4, 2.3, -12.4, -0.7, 0.12, 0xdb2777, 0xfff7ed); }
  { const x = -12.5, z = -11.5; [-0.4, 0.4].forEach((o) => w.add('m', cyl(6), 0x9a6a3e, x + o, 0, z, -0.15, 0, o * 0.3, 0.04, 1.7, 0.04)); w.add('m', cyl(6), 0x9a6a3e, x, 0, z - 0.4, 0.35, 0, 0, 0.04, 1.6, 0.04); w.add('m', rbox(1.0, 0.75, 0.05, 0.02), 0xffffff, x, 1.35, z + 0.05, -0.15, 0, 0);
    for (let k = 0; k < 6; k++) w.add('e', sph(8), SUN[k], x - 0.3 + (k % 3) * 0.3, 1.2 + Math.floor(k / 3) * 0.3, z + 0.1, 0, 0, 0, 0.1, 0.07, 0.02); w.add('l', sph(10), 0x38bdf8, x + 0.2, 1.55, z + 0.1, 0, 0, 0, 0.18, 0.08, 0.02, 0.2); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; claypot(w, Math.cos(a) * 16.6, Math.sin(a) * 15.2, 0.9 + (i % 3) * 0.15, SUN[i] === 0xffd23f ? 0xc8693c : [0xc8693c, 0x2dd4bf, 0xe2733f, 0x3b82f6][i % 4], ['flower', 'cactus', 'flower', 'agave'][i % 4]); }
  // sun shells around the square
  [[0, 0.9, -10.5], [-14, 1.2, 0], [14, 1.2, 0], [0, 7.6, -30], [-26, 1.6, -12], [22, 0.9, 10], [-19, 1.4, 19], [26, 1.2, -6]].forEach((p) => sunShell(w, ...p));
}
// ------------------------------------------------------------------------------------------------ SPOOKY STREET
function market(w) { const S = w.spots;
  { const x = 31; [-6.5, 6.5].forEach((z) => { saguaro(w, x, z, 1.5); }); w.add('m', torus(0.35, 40, PI), 0x3aa655, x, 4.6, 0, 0, PI / 2, 0, 6.2, 2.4, 1.4); for (let i = 0; i < 18; i++) { const a = i / 17 * PI; w.add('g', sph(10), SUN[i % 8], x, 4.6 + Math.sin(a) * 2.4 * 6.2 / 6.2 * 1.0, Math.cos(a) * 6.2, 0, 0, 0, 0.32); } sign3d(w, 'SPOOKY STREET', x + 0.2, 5.6, 0, PI / 2, 0.5, 0xffffff, 0x16a34a); }
  for (let x = 40; x <= 118; x += 13) { lanternString(w, [[x, 6, -8.5], [x + 3, 5, 0], [x, 6, 8.5]], SUN, 9); w.add('x', cyl(10), 0x7c4a1e, x, 0, -8.5, 0, 0, 0, 0.12, 6.2, 0.12); w.add('x', cyl(10), 0x7c4a1e, x, 0, 8.5, 0, 0, 0, 0.12, 6.2, 0.12); w.solid(x - 0.15, 0, -8.65, x + 0.15, 6, -8.35, { cam: false }); w.solid(x - 0.15, 0, 8.35, x + 0.15, 6, 8.65, { cam: false }); }
  stall(w, 46, -8, 0, 0xff5d8f, 0xffffff, 'fruit'); stall(w, 77, -8, 0, 0x2dd4bf, 0xfff1d6, 'shells'); stall(w, 97, -8, 0, 0xffb020, 0xffffff, 'pots'); stall(w, 68, 8, PI, 0xa66bff, 0xffffff, 'flowers'); stall(w, 46, 8, PI, 0x4ade80, 0xffffff, 'lettuce'); stall(w, 96, 8, PI, 0xff8a3d, 0xffffff, 'fruit'); stall(w, 112, 8, PI, 0x38bdf8, 0xffffff, 'shells');
  for (let i = 0; i < 16; i++) { const x = 36 + i * 5.4, z = i % 2 ? -7.6 : 7.6; if ([46, 77, 97, 68, 96, 112].some((q) => Math.abs(q - x) < 2.6)) continue; claypot(w, x, z, 0.9, pick([0xc8693c, 0x2dd4bf, 0x3b82f6, 0xffb020]), pick(['flower', 'cactus', 'agave'])); }
  for (let i = 0; i < 6; i++) tcrate(w, 99.5 + (i % 3) * 0.95, 0, 25 + Math.floor(i / 3) * 0.9, 0.9, pick([0xd8a15a, 0xc58b52]));
  // fruit wagon with big wheels
  { const T = w.tf(85, 0, 30, 0.3); T.slab('m', 0x9a6a3e, 0, 0.7, 0, 2.2, 0.9, 3.4, 0.08); for (let k = 0; k < 18; k++) { const p = T.P(-0.8 + (k % 4) * 0.55, 1.65, -1.3 + Math.floor(k / 4) * 0.6); w.add('g', sph(10), pick([0xff5d8f, 0xe11d48, 0xffd23f, 0xff8a3d]), p[0], p[1], p[2], 0, 0, 0, 0.24); } [-1.2, 1.2].forEach((s) => [-1, 1].forEach((t) => T.add('m', torus(0.18, 24), 0x7c4a1e, s, 0.7, t * 1.1, 0, PI / 2, 0, 0.62, 0.62, 0.5))); }
  // fossil dig site (outside the museum): roped pit, big friendly bones, brushes
  { const x = 84, z = 40; w.add('m', rcyl(5, 0.1, 0.05, 40), 0xc9965e, x, -0.08, z); for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; w.add('m', cyl(8), 0x7c4a1e, x + Math.cos(a) * 5.4, 0, z + Math.sin(a) * 5.4, 0, 0, 0, 0.08, 1.1, 0.08); } { const pts = []; for (let i = 0; i <= 32; i++) { const a = i / 32 * PI * 2; pts.push([x + Math.cos(a) * 5.4, 0.95, z + Math.sin(a) * 5.4]); } w.add('f', tube(pts, 0.04, 64, 5), 0xef4444, 0, 0, 0); }
    for (let i = 0; i < 7; i++) w.add('g', capsule(10), 0xfff4dc, x - 2 + i * 0.65, 0.12, z + Math.sin(i) * 0.4, PI / 2, 0, 0.3 * i, 0.2, 1.2 - Math.abs(i - 3) * 0.12, 0.2); w.add('g', sph(14), 0xfff4dc, x + 2.6, 0.3, z, 0, 0, 0, 0.75, 0.45, 0.6); w.add('g', blobGeo(4, 0.2, 2), 0xfff4dc, x - 2.6, 0.3, z - 0.3, 0, 0, 0, 1.0, 0.5, 0.9);
    PR_tools(w, x + 3, z + 2.6); w.solid(x - 5.6, 0, z - 5.6, x + 5.6, 1.0, z - 5.2, { cam: false }); w.solid(x - 5.6, 0, z + 5.2, x + 5.6, 1.0, z + 5.6, { cam: false }); w.solid(x - 5.6, 0, z - 5.6, x - 5.2, 1.0, z + 5.6, { cam: false }); }
  [[60, 1.2, -8.4], [90, 1.3, 8.3], [118, 1.2, 0], [84, 0.8, 40], [104, 1.2, 25]].forEach((p) => sunShell(w, ...p));
}
function PR_tools(w, x, z) { w.add('m', rbox(1.4, 0.12, 0.6, 0.03), 0x9a6a3e, x, 0.06, z); [0, 0.4, 0.8].forEach((o, i) => { w.add('m', cyl(8), 0x7c4a1e, x - 0.5 + o, 0.15, z, 0, 0, PI / 2, 0.03, 0.6, 0.03); w.add('f', rbox(0.15, 0.12, 0.1, 0.03), [0xef4444, 0xffd23f, 0x3b82f6][i], x - 0.2 + o, 0.15, z); }); }
// ------------------------------------------------------------------------------------------------ HOLLOW LANE (homes)
function burrows(w) { const S = w.spots;
  sign3d(w, 'HOLLOW LANE', -32, 3.0, 0, -PI / 2, 0.42, 0xffffff, 0xb45309); w.add('m', cyl(10), 0x7c4a1e, -32.1, 0, -1.6, 0, 0, 0, 0.12, 3.4, 0.12); w.add('m', cyl(10), 0x7c4a1e, -32.1, 0, 1.6, 0, 0, 0, 0.12, 3.4, 0.12);
  // Torty's family front garden: low old stone wall, mailbox, Mama's 4 flower beds (plant marigolds), swing bench, veggie patch
  const aw = (axis, at, a, b, h = 0.9, c = 0xe8b07a) => { if (axis === 'x') w.slab('m', c, (a + b) / 2, 0, at, b - a, h, 0.45, 0.16, { cam: false }); else w.slab('m', c, at, 0, (a + b) / 2, 0.45, h, b - a, 0.16, { cam: false }); };
  aw('x', -7.6, -72, -62); aw('x', -7.6, -56, -46); aw('z', -72, -9.8, -7.6); aw('z', -46, -9.8, -7.6);
  { const x = -63.3, z = -7.4; w.add('m', cyl(8), 0x7c4a1e, x, 0, z, 0, 0, 0, 0.08, 1.2, 0.08); w.add('g', rbox(0.5, 0.45, 0.8, 0.2), 0x2dd4bf, x, 1.35, z); w.add('g', rbox(0.04, 0.3, 0.12, 0.01), 0xef4444, x + 0.28, 1.5, z + 0.2); sign3d(w, 'THE LANTERNS', x, 1.75, z + 0.42, 0, 0.09, 0x7c2d12, 0xfff1d6); }
  [[-68.5, -8.7], [-65.5, -8.7], [-53.5, -8.7], [-50.5, -8.7]].forEach(([x, z], i) => { w.add('m', rbox(2.2, 0.32, 1.0, 0.12), 0x7a4a26, x, 0.16, z); w.plants = w.plants || []; w.plants.push([x, 0.32, z]); I({ kind: 'plant', i, x, y: 0, z: z + 1.2, r: 1.6, label: '🌼 Plant a spooky moonflower' }); });
  { const T = w.tf(-52, 0, -4.8, PI); [-1, 1].forEach((s) => { T.box('m', 0x7c4a1e, s * 1.4, 0, 0, 0.14, 2.6, 0.14, 0.04); }); T.box('m', 0x7c4a1e, 0, 2.5, 0, 3.0, 0.14, 0.18, 0.05); T.add('x', cyl(6), 0x94a3b8, -0.9, 1.4, 0, 0, 0, 0, 0.015, 1.1, 0.015); T.add('x', cyl(6), 0x94a3b8, 0.9, 1.4, 0, 0, 0, 0, 0.015, 1.1, 0.015); T.box('m', 0xffb020, 0, 0.75, 0, 2.0, 0.12, 0.6, 0.04); T.box('f', 0xff5d8f, 0, 0.87, 0, 1.8, 0.1, 0.5, 0.04); }
  // clotheslines, rocks, cacti and gardens along the lane
  for (const [x, z] of [[-76, -30], [-98, -28], [-44, 30], [-74, 30], [-96, 30]]) { lettucePatch(w, x, z, 4, 3); }
  { const pts = [[-96, 2.4, -30], [-90, 2.0, -30], [-84, 2.4, -30]]; w.add('x', tube(pts, 0.015, 20, 4), 0xffffff, 0, 0, 0); [[-96, -30], [-84, -30]].forEach(([x, z]) => w.add('m', cyl(8), 0x7c4a1e, x, 0, z, 0, 0, 0, 0.07, 2.5, 0.07)); for (let i = 0; i < 6; i++) w.add('f', rbox(0.7, 0.8, 0.03, 0.03), SUN[i], -95 + i * 1.8, 1.75, -30, 0, 0, (i % 2 - 0.5) * 0.08); }
  for (let i = 0; i < 18; i++) { const x = -40 - i * 4.6, z = i % 2 ? -34 - R() * 6 : 32 + R() * 6; if (i % 3 === 0) saguaro(w, x, z, 1.1 + R() * 0.5); else if (i % 3 === 1) prickly(w, x, z, 1.2); else barrel(w, x, z, 1.0); }
  for (let i = 0; i < 10; i++) bigRock(w, -40 - i * 8.3, i % 2 ? -40 : 36, 0.8 + R() * 0.5, pick([0xd08a52, 0xc97a44, 0xe0a070]));
  // Shelby's yard: trampoline-style sand pit, toys, school playground
  { const x = -60, z = 32; w.add('m', rcyl(4.2, 0.35, 0.12, 40), 0xc58b52, x, 0, z); w.add('m', rcyl(3.9, 0.05, 0.02, 40), 0xf6dcae, x, 0.33, z); w.solid(x - 4, 0, z - 4, x + 4, 0.35, z + 4, { cam: false });
    // slide + seesaw + tortoise-shell climbing dome
    { const T = w.tf(x - 2, 0.35, z - 1.5, 0.6); T.box('g', 0xffb020, 0, 0, 0, 1.2, 1.8, 1.2, 0.1); T.add('g', rbox(0.9, 0.08, 3.0, 0.04), 0x38bdf8, 0, 1.0, 1.6, -0.6, 0, 0); T.solid(-0.6, 0, -0.6, 0.6, 1.8, 0.6); }
    { const T = w.tf(x + 2, 0.35, z + 1.2, -0.4); T.add('m', rbox(3.6, 0.12, 0.4, 0.05), 0xef4444, 0, 0.55, 0, 0, 0, 0.15); T.add('m', prism(0.7, 0.5, 0.5), 0x7c4a1e, 0, 0, 0); [-1.6, 1.6].forEach((s) => T.add('m', rbox(0.1, 0.4, 0.5, 0.04), 0x334155, s, 0.75 + s * 0.08, 0)); }
    { const pr = []; for (let k = 0; k <= 10; k++) { const t = k / 10 * PI / 2; pr.push([Math.max(0.0001, Math.cos(t) * 1.6), Math.sin(t) * 1.3]); } pr[pr.length - 1][0] = 0; for (let i = 0; i < 10; i++) { const a = i / 10 * PI; const q = []; for (let k = 0; k <= 8; k++) { const t = k / 8 * PI; q.push([x + 1.4 + Math.cos(a) * Math.cos(t) * 1.6, 0.35 + Math.sin(t) * 1.3, z - 2.0 + Math.sin(a) * Math.cos(t) * 1.6]); } w.add('g', tube(q, 0.05, 12, 5), SUN[i % 8], 0, 0, 0); } } }
  [[-59, 3.6, -16], [-86, 1.2, -6.8], [-72, 1.2, 33], [-110, 1.3, 0], [-52, 2.7, -4.8], [-96, 2.3, -30]].forEach((p) => sunShell(w, ...p));
}
function lettucePatch(w, x, z, nx, nz) { w.add('m', rbox(nx * 1.1 + 0.4, 0.22, nz * 1.1 + 0.4, 0.08), 0x7a4a26, x, 0.11, z); w.solid(x - nx * 0.55 - 0.2, 0, z - nz * 0.55 - 0.2, x + nx * 0.55 + 0.2, 0.22, z + nz * 0.55 + 0.2, { cam: false });
  w.detail = true; for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) lettuce(w, x - (nx - 1) * 0.55 + i * 1.1, 0.22, z - (nz - 1) * 0.55 + j * 1.1, 0.9); w.detail = false; }
// ------------------------------------------------------------------------------------------------ HAUNTED HILL
function hill(w) { const S = w.spots;
  // terraces climbing north between the spa and the observatory
  const terr = [[0, -100, 0], [1.2, -109, 0.5], [2.4, -120, 1]]; const X0 = -8, X1 = 12;
  w.slab('m', 0xd9a37a, (X0 + X1) / 2, 0, -110.5, X1 - X0, 1.2, 7, 0.2, {}); w.slab('m', 0xcf9670, (X0 + X1) / 2, 1.2, -120, X1 - X0, 1.2, 12, 0.2, {});
  for (let i = 0; i < 4; i++) { w.slab('m', 0xe8c9a0, 2, 0, -105.5 - i * 0.5, 3.0, (i + 1) * 0.3, 0.62, 0.06, {}); w.slab('m', 0xe8c9a0, 6, 1.2, -112.5 - i * 0.5, 3.0, (i + 1) * 0.3, 0.62, 0.06, {}); }
  const pool = (x, y, z, rx, rz, col = 0x5eead4) => { for (let i = 0; i < 26; i++) { const a = i / 26 * PI * 2; w.add('m', blobGeo(i & 31, 0.15, 1), pick([0xd6c2a0, 0xbfa682, 0xe2d2b4]), x + Math.cos(a) * rx, y + 0.18, z + Math.sin(a) * rz, 0, a, 0, 0.55, 0.32, 0.4); }
    w.add('e', new THREE.CircleGeometry(1, 48).rotateX(-PI / 2), col, x, y + 0.22, z, 0, 0, 0, rx - 0.2, 1, rz - 0.2); w.add('m', new THREE.CircleGeometry(1, 40).rotateX(-PI / 2), 0x0f766e, x, y + 0.03, z, 0, 0, 0, rx - 0.3, 1, rz - 0.3); (S.pools = S.pools || []).push([x, y, z, rx, rz]); };
  pool(-2, 0, -99.2, 4, 2.6); pool(5, 1.2, -108.4, 3.4, 2.2, 0x67e8f9); pool(2, 2.4, -122, 5, 3.2, 0x99f6e4); pool(9, 2.4, -125, 2, 1.6, 0xa5f3fc);
  S.pebbleSpot = [-1.6, 2.4, -118.6]; S.sunHill = [2, 2.4 + 1.2, -122];
  // deck chairs, umbrellas, towel racks, bamboo-free palms, steam vents are fx
  for (let i = 0; i < 3; i++) { const T = w.tf(-6 + i * 2.4, 0, -104.5, 0.2); T.slab('m', 0xc58b52, 0, 0, 0, 0.9, 0.3, 2.0, 0.05, { cam: false }); T.box('f', SUN[i * 2], 0, 0.3, 0.2, 0.8, 0.08, 1.4, 0.04); T.add('f', rbox(0.8, 0.08, 0.8, 0.04), SUN[i * 2], 0, 0.62, -0.75, 0.9, 0, 0); }
  [[-6, -106], [10, -102]].forEach(([x, z], i) => { w.add('x', cyl(8), 0xd1d5db, x, 0, z, 0, 0, 0, 0.05, 2.6, 0.05); for (let k = 0; k < 8; k++) w.add('f', cone(3), k % 2 ? 0xff5d8f : 0xffffff, x, 3.0, z, 0, k / 8 * PI * 2, 0, 1.8, 0.7, 0.7); });
  for (let i = 0; i < 4; i++) palm(w, X0 - 2 + (i % 2) * (X1 - X0 + 4), -102 - Math.floor(i / 2) * 16, 0.95, 0.4);
  sign3d(w, 'WITCH’S CAULDRON SPAS', 2, 2.0, -96.5, 0, 0.3, 0xffffff, 0x0f766e); w.add('m', cyl(10), 0x7c4a1e, 0.2, 0, -96.6, 0, 0, 0, 0.1, 2.0, 0.1); w.add('m', cyl(10), 0x7c4a1e, 3.8, 0, -96.6, 0, 0, 0, 0.1, 2.0, 0.1);
  // backdrop mesas
  for (let i = 0; i < 9; i++) { const x = -60 + i * 15; if (x < 30) mesa(w, x, -127, 14, 10 + (i % 3) * 3, 8, pick([0xd9824a, 0xc96f3a, 0xe08f55])); }
  for (let i = 0; i < 8; i++) w.add('m', sph(24), pick([0xe8c48c, 0xdfb57c, 0xeccd98]), 34 + i * 13, -2, -131, 0, 0, 0, 9.5, 8 + (i % 3) * 2, 8);
  [[2, 3.6, -126.5], [-5, 1.0, -104.5], [18, 1.0, -92], [-30, 1.2, -90], [9, 2.0, -110]].forEach((p) => sunShell(w, ...p));
  w.secrets.push({ id: 'peak', x: 9, y: 2.4, z: -125, r: 2.0, msg: '♨️ Secret: the tiny top-top spring! Perfect for one very small ghost' });
}
// ------------------------------------------------------------------------------------------------ BROOMSTICK RACETRACK
export const TRACK = { cx: 36, cz: 94, rx: 30, rz: 18 };
function track(w) { const { cx, cz, rx, rz } = TRACK; const S = w.spots;
  const ring = (r0, r1, col, y, seg = 160) => { const g = new THREE.RingGeometry(r0, r1, seg, 1).rotateX(-PI / 2); w.add('m', g, col, cx, y, cz, 0, 0, 0, rx / 18, 1, rz / 18); };
  ring(15.6, 20.6, 0xd2693c, 0.02); [15.6, 17.3, 18.95, 20.6].forEach((r) => { const pts = []; for (let i = 0; i <= 96; i++) { const a = i / 96 * PI * 2; pts.push([cx + Math.cos(a) * r * rx / 18, 0.05, cz + Math.sin(a) * r * rz / 18]); } w.add('l', tube(pts, 0.05, 192, 4), 0xffffff, 0, 0, 0); });
  w.add('m', new THREE.CircleGeometry(15.5, 96).rotateX(-PI / 2), 0x7cc96a, cx, 0.015, cz, 0, 0, 0, rx / 18, 1, rz / 18);
  // start/finish line (south side) + checkered gate + scoreboard in the infield
  { const z = cz + rz * 1.0; for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) w.add('m', rbox(0.9, 0.02, 0.45, 0.01), (i + j) % 2 ? 0x111827 : 0xffffff, cx - 4.5 + i * 1.0 + 0.5, 0.06, z - 1.6 + j * 0.45 + 2.0, 0, 0, 0, 1, 1, 1);
    [-5.6, 5.6].forEach((o) => { w.add('m', rbox(0.5, 5.2, 0.5, 0.1), 0xffffff, cx + o, 2.6, z + 0.6); w.solid(cx + o - 0.25, 0, z + 0.35, cx + o + 0.25, 5.2, z + 0.85); }); for (let i = 0; i < 12; i++) w.add('g', rbox(0.95, 0.95, 0.3, 0.05), i % 2 ? 0x111827 : 0xffffff, cx - 5.2 + i * 0.95, 5.0, z + 0.6); sign3d(w, 'BROOMSTICK DERBY', cx, 5.8, z + 0.6, PI, 0.42, 0xffffff, 0xe2733f); S.finish = [cx, z]; }
  { const T = w.tf(cx, 0, cz - 4, PI); T.slab('m', 0x1f2937, 0, 0, 0, 7, 4.2, 0.6, 0.1); T.box('l', 0x111827, 0, 1.6, 0.32, 6.2, 2.2, 0.02, 0.05); for (let i = 0; i < 4; i++) T.box('l', [0xef4444, 0x3b82f6, 0xffd23f, 0x4ade80][i], -2.2 + i * 1.45, 2.2, 0.35, 1.0, 1.0, 0.02, 0.1, 0.4); T.box('m', 0x7c4a1e, -3, 0, 0, 0.3, 1.6, 0.3, 0.05); T.box('m', 0x7c4a1e, 3, 0, 0, 0.3, 1.6, 0.3, 0.05); }
  w.detail = true; for (let i = 0; i < 70; i++) { const a = R() * PI * 2, r = R() * 0.8; const x = cx + Math.cos(a) * r * 14 * rx / 18, z = cz + Math.sin(a) * r * 14 * rz / 18; if (Math.abs(z - (cz - 4)) < 1.5 && Math.abs(x - cx) < 4.5) continue; w.add('g', sph(8), pick([0xff5d8f, 0xffd23f, 0xffffff, 0xa66bff, 0xff8a3d]), x, 0.25, z, 0, 0, 0, 0.16); w.add('g', sph(6), 0x3fae5a, x, 0.12, z, 0, 0, 0, 0.2, 0.1, 0.2); } w.detail = false;
  // low rail with gaps (outer edge)
  for (let i = 0; i < 64; i++) { if (i % 16 === 3 || i % 16 === 4) continue; const a = i / 64 * PI * 2, b = (i + 1) / 64 * PI * 2; const r = 21.1 / 18; const ax = cx + Math.cos(a) * rx * r, az = cz + Math.sin(a) * rz * r, bx = cx + Math.cos(b) * rx * r, bz = cz + Math.sin(b) * rz * r;
    w.add('m', cyl(8), 0xffffff, ax, 0, az, 0, 0, 0, 0.07, 1.0, 0.07); const L = Math.hypot(bx - ax, bz - az); w.add('g', rbox(L, 0.12, 0.1, 0.04), i % 2 ? 0xef4444 : 0xffffff, (ax + bx) / 2, 0.85, (az + bz) / 2, 0, -Math.atan2(bz - az, bx - ax), 0); w.solid(Math.min(ax, bx) - 0.08, 0, Math.min(az, bz) - 0.08, Math.max(ax, bx) + 0.08, 0.95, Math.max(az, bz) + 0.08, { cam: false }); }
  // grandstand (north of the track): three walkable tiers + striped canopy
  { const x = cx, z = cz - rz * 1.17 - 5; for (let t = 0; t < 4; t++) { w.slab('m', [0xe2733f, 0xffb020, 0x2dd4bf, 0xff5d8f][t], x, 0, z - t * 1.3, 20, 0.42 + t * 0.42, 1.3, 0.08, {}); }
    for (let i = 0; i < 9; i++) w.add('f', rbox(2.3, 0.12, 6.5, 0.05), i % 2 ? 0xffffff : 0xe2733f, x - 9.2 + i * 2.3, 4.6, z - 2, -0.12, 0, 0); [-10, 10].forEach((o) => [0, -4].forEach((q) => { w.add('m', cyl(8), 0x7c4a1e, x + o, 0, z + q, 0, 0, 0, 0.12, 4.6, 0.12); w.solid(x + o - 0.12, 0, z + q - 0.12, x + o + 0.12, 4.6, z + q + 0.12, { cam: false }); }));
    w.secrets.push({ id: 'stand', x: x + 9, y: 1.7, z: z - 3.9, r: 1.5, msg: '🏁 Secret: the best seat in the house (top corner of the grandstand)!' }); S.stand = [x, z]; }
  // Pi-rat's pit tent + tire stack + tool cart (east of the finish)
  { const x = cx + 16, z = cz + rz + 5; for (let i = 0; i < 6; i++) w.add('f', rbox(1.0, 0.1, 4.2, 0.04), i % 2 ? 0xffd23f : 0x3b82f6, x - 2.5 + i * 1.0, 2.9, z, -0.15, 0, 0); [[-3, -2], [3, -2], [-3, 2], [3, 2]].forEach(([a, b]) => w.add('x', cyl(8), 0xcbd5e1, x + a, 0, z + b, 0, 0, 0, 0.06, 2.9, 0.06)); for (let i = 0; i < 4; i++) w.add('m', torus(0.42, 24), 0x1f2937, x - 2, 0.15 + i * 0.3, z - 1, PI / 2, 0, 0, 0.5, 0.5, 0.6); tcrate(w, x + 1.6, 0, z + 1.0, 1, 0x3b82f6); sign3d(w, 'PI-RAT PIT CREW', x, 3.3, z + 2.1, 0, 0.2, 0xffffff, 0x1e3a8a); S.pit = [x, z]; }
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + 0.4; palm(w, cx + Math.cos(a) * rx * 1.45, cz + Math.sin(a) * rz * 1.5, 0.9, 0.3); }
  [[cx, 0.8, cz - 8], [cx + rx, 0.8, cz], [cx - rx, 0.8, cz], [cx + 9, 2.0, cz - rz * 1.17 - 8.9], [-20, 1.0, 96], [cx, 0.8, cz + 10]].forEach((p) => sunShell(w, ...p));
}
// ------------------------------------------------------------------------------------------------ PUMPKIN PATCH
function farm(w) { const S = w.spots; S.field = [];
  for (let r = 0; r < 9; r++) { const z = 70 + r * 6; w.add('m', rbox(44, 0.25, 2.2, 0.1), 0x7a4a26, -100, 0.06, z); for (let i = 0; i < 30; i++) S.field.push([-121 + i * 1.45, 0.2, z + (i % 2 - 0.5) * 0.4, (i * 7 + r) % 3]); }
  // farm mini-game plots (6) beside the barn
  for (let i = 0; i < 6; i++) { const x = -80 + (i % 3) * 3.0, z = 46 + Math.floor(i / 3) * 3.4; w.add('m', rbox(2.4, 0.28, 2.4, 0.12), 0xb98545, x, 0.14, z); w.add('m', rbox(2.1, 0.08, 2.1, 0.05), 0x5b3a1e, x, 0.29, z); w.solid(x - 1.2, 0, z - 1.2, x + 1.2, 0.28, z + 1.2, { cam: false }); w.plots.push([x, 0.33, z]); }
  sign3d(w, 'PUMPKIN PATCH', -77, 1.9, 43.2, PI, 0.2, 0xffffff, 0x16a34a); w.add('m', cyl(8), 0x7c4a1e, -78.6, 0, 43.3, 0, 0, 0, 0.08, 1.9, 0.08); w.add('m', cyl(8), 0x7c4a1e, -75.4, 0, 43.3, 0, 0, 0, 0.08, 1.9, 0.08);
  // silo, windmill tower (blades animate), water trough, hay bales, friendly scarecrow, wagon, fences
  { const x = -110, z = 48; w.add('m', rcyl(2.6, 9, 0.2, 32), 0xe5e7eb, x, 0, z); for (let k = 0; k < 6; k++) w.add('x', torus(0.05, 40), 0x94a3b8, x, 1.2 + k * 1.4, z, PI / 2, 0, 0, 2.62, 2.62, 1); const pr = []; for (let k = 0; k <= 10; k++) { const t = k / 10 * PI / 2; pr.push([Math.max(0.0001, Math.cos(t) * 2.7), Math.sin(t) * 1.8]); } pr[pr.length - 1][0] = 0; w.add('g', lathe(pr, 32, 'siloTop'), 0xb4533a, x, 9, z); w.solid(x - 2.6, 0, z - 2.6, x + 2.6, 11, z + 2.6); }
  { const x = -64, z = 56; for (let k = 0; k < 4; k++) { const a = k / 4 * PI * 2 + PI / 4; w.add('m', cyl(8), 0x7c4a1e, x + Math.cos(a) * 1.4, 0, z + Math.sin(a) * 1.4, Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12, 0.1, 9, 0.1); } w.add('m', rbox(1.4, 0.8, 1.4, 0.1), 0xb4533a, x, 9.2, z); S.mill = [x, 9.4, z + 0.9]; w.solid(x - 1.5, 0, z - 1.5, x + 1.5, 9.6, z + 1.5); }
  { const x = -84, z = 64; w.add('m', rbox(3.2, 0.7, 1.1, 0.12), 0x8a5a32, x, 0.35, z); w.add('e', rbox(2.9, 0.05, 0.85, 0.02), 0x38bdf8, x, 0.65, z); w.solid(x - 1.6, 0, z - 0.55, x + 1.6, 0.7, z + 0.55, { cam: false }); }
  for (let i = 0; i < 7; i++) { const x = -96 + (i % 4) * 1.8, z = 64 + Math.floor(i / 4) * 1.4, y = i > 3 ? 1.1 : 0; w.add('m', rbox(1.6, 1.1, 1.2, 0.2), 0xe9c46a, x, y + 0.55, z); for (let k = 0; k < 2; k++) w.add('m', rbox(1.62, 0.06, 1.22, 0.02), 0xc9a24a, x, y + 0.3 + k * 0.5, z); w.solid(x - 0.8, y, z - 0.6, x + 0.8, y + 1.1, z + 0.6, { cam: false }); }
  { const x = -60, z = 90; w.add('m', cyl(8), 0x7c4a1e, x, 0, z, 0, 0, 0, 0.09, 2.6, 0.09); w.add('m', rbox(2.2, 0.12, 0.12, 0.04), 0x7c4a1e, x, 1.9, z); w.add('f', rbox(1.0, 1.0, 0.5, 0.2), 0x3b82f6, x, 1.6, z); w.add('m', sph(14), 0xf2cf7a, x, 2.5, z, 0, 0, 0, 0.42); w.add('m', rcyl(0.8, 0.06, 0.02, 20), 0xf2cf7a, x, 2.8, z); w.add('m', lathe([[0.35, 0], [0.3, 0.3], [0, 0.35]], 16, 'scHat'), 0xf2cf7a, x, 2.8, z); [-1, 1].forEach((s) => w.add('g', sph(8), 0x111111, x + s * 0.15, 2.58, z + 0.38, 0, 0, 0, 0.05)); w.add('g', torus(0.2, 12, PI), 0x7c2d12, x, 2.45, z + 0.4, 0, 0, PI, 0.12, 0.08, 0.05); w.solid(x - 0.2, 0, z - 0.2, x + 0.2, 2.6, z + 0.2, { cam: false }); }
  K.fenceRun(w, 'x', 66.4, -124, -76, 1.3, 0xfff1d6); K.fenceRun(w, 'z', -76, 68, 124, 1.3, 0xfff1d6);
  // hollow log (a secret hides inside)
  { const x = -66, z = 112; w.add('m', cyl(20), 0x8a5a32, x, 0.9, z, 0, 0, PI / 2, 0.9, 4.4, 0.9); w.add('m', cyl(20), 0x3b2a1a, x + 2.21, 0.9, z, 0, 0, PI / 2, 0.72, 0.02, 0.72); w.add('m', cyl(20), 0x3b2a1a, x - 2.21, 0.9, z, 0, 0, PI / 2, 0.72, 0.02, 0.72); for (let k = 0; k < 5; k++) w.add('g', sph(8), 0x3fae5a, x - 1.5 + k * 0.7, 1.75, z, 0, 0, 0, 0.3, 0.12, 0.3); w.solid(x - 2.2, 1.7, z - 0.9, x + 2.2, 1.8, z + 0.9); w.solid(x - 2.2, 0, z - 0.95, x + 2.2, 1.8, z - 0.7); w.solid(x - 2.2, 0, z + 0.7, x + 2.2, 1.8, z + 0.95);
    w.secrets.push({ id: 'log', x, y: 0, z, r: 1.3, msg: '🪵 Secret: a cozy napping log. Someone left a tiny pillow!' }); w.add('f', rbox(0.6, 0.15, 0.4, 0.07), 0xff9fd0, x + 0.5, 0.1, z); }
  [[-80, 1.0, 49.7], [-110, 11.6, 48], [-64, 1.0, 112], [-100, 1.6, 66], [-120, 1.0, 120], [-90, 1.0, 100]].forEach((p) => sunShell(w, ...p));
}
// ------------------------------------------------------------------------------------------------ BAT CLIFFS
function dunes(w) { const S = w.spots;
  const dune = (x, z, rx, rz, h) => { const pr = []; for (let k = 0; k <= 14; k++) { const t = k / 14 * PI / 2; pr.push([Math.max(0.0001, Math.cos(t)), Math.sin(t) ** 1.4]); } pr[pr.length - 1][0] = 0; w.add('m', lathe(pr, 40, 'dune'), 0xf3cf94, x, -0.02, z, 0, 0, 0, rx, h, rz);
    for (let i = 0; i < 4; i++) w.add('m', torus(0.06, 40, PI * 0.9), 0xe6b97a, x, h * (0.2 + i * 0.18), z, PI / 2, 0, 0.3 * i, rx * (0.96 - i * 0.18), rz * (0.96 - i * 0.18), 0.2); w.solid(x - rx * 0.7, 0, z - rz * 0.7, x + rx * 0.7, h * 0.8, z + rz * 0.7, { cam: false }); };
  secretDoor(w); dune(110, 50, 7, 5, 3.2); dune(94, 74, 9, 6, 4.2); dune(114, 82, 6, 8, 3.6); dune(92, 110, 8, 6, 3.8); dune(116, 118, 7, 5, 3.0); dune(76, 124, 6, 5, 2.6);
  // canyon wall (east) with the rock arch + rim mesas (north-east)
  for (let i = 0; i < 18; i++) { const z = -124 + i * 14.5; if (z > -20) mesa(w, 128, z, 8, 11 + (i % 3) * 3, 15, pick([0xd9824a, 0xc96f3a, 0xe08f55])); else w.add('m', sph(24), pick([0xe8c48c, 0xdfb57c, 0xeccd98]), 131, -2, z, 0, 0, 0, 9, 9 + (i % 3) * 2.5, 9.5); } // calm rolling dunes behind Mad Science Lab instead of stacked cliffs
  { const x = 108, z = 100; [-3.4, 3.4].forEach((o) => { w.add('m', blobGeo(7, 0.12, 2), 0xd9824a, x, 3, z + o, 0, 0, 0, 1.4, 3.2, 1.3); w.solid(x - 1.2, 0, z + o - 1.1, x + 1.2, 6, z + o + 1.1); }); w.add('m', torus(0.32, 32, PI), 0xd9824a, x, 5.2, z, 0, PI / 2, 0, 3.6, 2.2, 2.8);
    w.secrets.push({ id: 'arch', x, y: 0, z, r: 1.8, msg: '🌄 Secret: the Whispering Arch! Say "spooky and steady" and it echoes back' }); }
  for (let i = 0; i < 9; i++) w.add('m', sph(24), pick([0xe8c48c, 0xdfb57c, 0xeccd98]), 64 + i * 8, -1.4, -100 - (i % 2) * 6, 0, 0, 0, 6.5, 3.6 + (i % 3) * 1.1, 5.5); // soft dunes (calm backdrop behind the Test Yard)
  for (let i = 0; i < 16; i++) { const x = 64 + R() * 60, z = -86 - R() * 36; if (i % 3 === 0) saguaro(w, x, z, 1.2 + R() * 0.6); else if (i % 3 === 1) bigRock(w, x, z, 1 + R()); else prickly(w, x, z, 1.3); }
  for (let i = 0; i < 14; i++) { const x = 84 + R() * 36, z = 36 + R() * 90; if (Math.hypot(x - 108, z - 100) < 6) continue; if (i % 2) saguaro(w, x, z, 1.1 + R() * 0.7); else barrel(w, x, z, 1.1); }
  // sand-sled hill (a gentle ramp you can slide down)
  { const x = 90, z = 124; w.solid(x - 3, 0, z - 10, x + 3, 3.0, z, { ramp: ['z', -1], cam: false }); w.slab('m', 0xf3cf94, x, 0, z - 13, 6, 3.0, 6, 0.3, {}); w.add('m', wedge3(6, 3, 10), 0xf3cf94, x, 0, z - 5); sign3d(w, 'FOG SLIDE', x, 3.9, z - 9.8, 0, 0.2, 0xffffff, 0xe2733f); }
  [[110, 4.1, 50], [94, 5.0, 74], [108, 6.8, 100], [90, 4.2, 111], [116, 1.0, -100], [86, 1.0, -90], [120, 1.0, 66]].forEach((p) => sunShell(w, ...p));
}
function secretDoor(w) { const S = w.spots, x = 123.9, z = 86.5; S.sdoor = [x, z]; S.dials = [];
  // carved frame in the cliff face, hidden behind a ring of 'sleeping' boulders
  w.add('m', rbox(0.6, 4.6, 4.4, 0.2), 0xb86a3a, x + 0.2, 2.3, z); w.add('m', torus(0.3, 28, PI), 0xc97a44, x - 0.1, 3.4, z, 0, PI / 2, 0, 1.7, 1.3, 1.0);
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; w.add('m', sph(10), 0xd9925a, x - 0.12, 4.3 + Math.sin(a) * 0.35, z + Math.cos(a) * 0.4, 0, 0, 0, 0.05, 0.18, 0.2); } w.add('m', sph(12), 0xd9925a, x - 0.12, 4.3, z, 0, 0, 0, 0.06, 0.3, 0.34);
  [[120.6, 81.0, 1.4], [117.4, 79.6, 1.6], [120.4, 92.2, 1.4], [117.2, 93.6, 1.2]].forEach(([bx, bz, bs]) => bigRock(w, bx, bz, bs, 0xc97a44));
  for (let i = 0; i < 3; i++) { const dz = z - 2.6 + i * 2.6, dx = 119.4; /* spaced out with walk-through gaps, so the opened doorway is never walled off */ w.add('m', rbox(0.9, 0.7, 0.9, 0.1), 0xb86a3a, dx, 0.35, dz); w.solid(dx - 0.45, 0, dz - 0.45, dx + 0.45, 0.7, dz + 0.45, { cam: false }); S.dials.push([dx, 1.3, dz]); sign3d(w, String(i + 1), dx - 0.2, 2.35, dz, -PI / 2, 0.42, 0xffffff, 0x7c2d12); w.I({ kind: 'dial', i, x: dx - 1.1, y: 0, z: dz, r: 0.95, label: '🪨 Turn the stone dial' }); }
  w.solid(x - 0.3, 0, z - 2.2, x + 0.6, 4.6, z + 2.2, { wall: true }); w.solid(x - 0.3, 0, z - 9, x + 8, 9, z - 2.2, { wall: true, cam: false }); w.solid(x - 0.3, 0, z + 2.2, x + 8, 9, z + 9, { wall: true, cam: false }); w.solid(x + 0.6, 0, z - 2.2, x + 8, 9, z + 2.2, { wall: true, cam: false }); w.solid(x - 8, -3, z - 9, x + 8, 0, z + 9, { floor: true }); }
export function wedge3(W, H, L) { const s = new THREE.Shape(); s.moveTo(-L / 2, 0); s.lineTo(L / 2, 0); s.lineTo(-L / 2, H); s.lineTo(-L / 2, 0); const g = new THREE.ExtrudeGeometry(s, { depth: W, bevelEnabled: false }); g.translate(0, 0, -W / 2); g.rotateY(-PI / 2); return g; }
// ------------------------------------------------------------------------------------------------ the valley rim (keeps everyone inside, looks like a canyon)
function border(w) { for (let i = 0; i < 18; i++) { mesa(w, -126 + i * 14.6, 128, 15, 9 + (i % 4) * 2.5, 8, pick([0xd9824a, 0xc96f3a, 0xe08f55])); mesa(w, -128, -116 + i * 13.5, 8, 9 + (i % 3) * 3, 14, pick([0xd9824a, 0xc96f3a, 0xe08f55])); }
  w.solid(-134, 0, -134, 134, 30, -129, { wall: true }); w.solid(-134, 0, 129, 134, 30, 134, { wall: true }); w.solid(-134, 0, -134, -129, 30, 134, { wall: true }); w.solid(129, 0, -134, 134, 30, 134, { wall: true });
  for (let i = 0; i < 40; i++) { const x = -120 + R() * 240, z = -120 + R() * 240; if (Math.hypot(x, z) < 40 || (Math.abs(z) < 34 && Math.abs(x) < 122) || (x > -40 && x < 80 && z > 62) || (x < -40 && z > 34) || (Math.abs(x) < 40 && z < -66) || Math.hypot(x - 108, z - 100) < 8 || (x > 54 && z > -84 && z < -30) || (x < -58 && z < -40) || (x > 44 && x < 82 && z > 30 && z < 64)) continue; w.detail = true; K.rock(w, x, z, 0.5 + R() * 0.5, pick([0xc9a27a, 0xd8b48a])); w.detail = false; }
}
// ------------------------------------------------------------------------------------------------ Ghost Train stops
function expressStops(w) { w.region = 'out'; STOPS.forEach(([x, z, yaw, nm], i) => { const T = w.tf(x, 0, z, yaw); T.slab('m', 0xe8b07a, 0, 0, -1.2, 3.4, 0.25, 1.4, 0.08, { cam: false }); [-1.5, 1.5].forEach((s) => T.box('m', 0x7c4a1e, s, 0.25, -1.6, 0.15, 2.6, 0.15, 0.04)); T.add('m', prism(3.8, 0.7, 1.4), 0x2563eb, 0, 2.85, -1.4);
    T.box('m', 0xffb020, 0, 0.25, -1.0, 2.6, 0.45, 0.6, 0.06); T.add('m', cyl(10), 0x334155, 2.2, 0, 0.2, 0, 0, 0, 0.07, 2.8, 0.07); T.add('g', rcyl(0.55, 0.1, 0.03, 24), 0x2563eb, 2.2, 2.9, 0.2, PI / 2, 0, 0); T.add('g', rcyl(0.45, 0.11, 0.03, 24), 0xffffff, 2.2, 2.9, 0.22, PI / 2, 0, 0);
    T.add('g', sph(10), 0x8b5e3c, 2.2, 2.92, 0.36, 0, 0, 0, 0.18, 0.12, 0.05); T.add('g', cone(8), 0xffd23f, 2.42, 2.95, 0.36, 0, 0, -PI / 2, 0.06, 0.18, 0.04);
    const p = T.P(0, 0, 0.4); sign3d(w, 'GHOST TRAIN', T.P(0, 0, -1.4)[0], 3.75, T.P(0, 0, -1.4)[2], yaw, 0.16, 0xffffff, 0x2563eb);
    I({ kind: 'express', i, x: p[0], y: 0, z: p[2], r: 2.6, label: '🐦 Ghost Train (fast travel)' }); w.spots.stops = STOPS; }); }
// ------------------------------------------------------------------------------------------------ building exteriors
function shells(w) { const B = (o) => building(w, o);
  B({ id: 'hall', x0: -12, z0: -64, x1: 12, z1: -42, ceil: 6.4, ext: 0xf2c28a, int: 0xfbe3c2, band: 0x2dd4bf, floor: ['marble', 0xfff4e6, 0xf2d3b0, 2.5], door: { side: 's', a: -2.2, b: 2.2, h: 4.4 }, winTop: 4.8, winBot: 1.4, curtain: 0xe2733f, li: 32, style: 'dome', domeR: 4.2, domeCol: 0x14b8a6, domeAt: [0, -55], noPots: true, sign: ['TOWN HALL', 0.46, 0xffffff, 0xb45309] });
  w.region = 'shell'; for (let i = 0; i < 6; i++) { const x = -6.25 + i * 2.5; w.add('g', lathe([[0, 0], [0.55, 0], [0.55, 0.3], [0.42, 0.45], [0.38, 5.4], [0.5, 5.6], [0.58, 6.0], [0, 6.0]], 24, 'col'), 0xfff1d6, x, 0, -40.3); w.solid(x - 0.45, 0, -40.75, x + 0.45, 6, -39.85); }
  w.add('m', rbox(16.6, 0.6, 3.4, 0.12), 0xf2c28a, 0, 6.3, -40.8); w.add('g', rbox(16.8, 0.2, 3.6, 0.06), 0x2dd4bf, 0, 6.0, -40.8); w.solid(-8.3, 6.0, -42.5, 8.3, 6.6, -39.1, { cam: true });
  for (let i = 0; i < 3; i++) w.slab('m', 0xead2ae, 0, 0, -39.3 + i * 0.5, 15.5 - i * 0.6, 0.12, 0.6, 0.04, { cam: false });
  [-7.4, 7.4].forEach((x, i) => { w.add('x', cyl(10), 0xd1d5db, x, 0, -38.6, 0, 0, 0, 0.06, 7.5, 0.06); w.add('x', star(), 0xffd23f, x, 7.7, -38.6, 0, 0, 0, 0.2, 0.2, 0.08); w.add('f', rbox(1.6, 1.0, 0.04, 0.02), i ? 0x2dd4bf : 0xffb020, x + 0.82, 6.8, -38.6); w.add('l', sph(10), 0xffd23f, x + 0.82, 6.8, -38.56, 0, 0, 0, 0.25, 0.25, 0.04, 0.4); w.solid(x - 0.1, 0, -38.7, x + 0.1, 7.5, -38.5, { cam: false }); });
  B({ id: 'library', x0: -46, z0: -58, x1: -28, z1: -42, ceil: 5.2, ext: 0xe0a86a, int: 0xf6e3c6, band: 0x3b82f6, floor: ['wood', 0x9b6a42], door: { side: 's', a: -39, b: -35 }, curtain: 0x1e3a8a, shutters: 0x1e3a8a, li: 22, sign: ['LIBRARY', 0.42, 0xffffff, 0x1e3a8a], style: 'dome', domeR: 3.0, domeCol: 0x3b82f6 });
  B({ id: 'cafe', x0: 28, z0: -58, x1: 46, z1: -42, ceil: 5.0, ext: 0xf6d38f, int: 0xfff4dc, band: 0x4ade80, floor: ['tile', 0xffffff, 0x86efac, 1.2], door: { side: 's', a: 35, b: 39 }, curtain: 0x16a34a, shutters: 0x16a34a, li: 22, awning: [0x4ade80, 0xffffff], sign: ['PUMPKIN LEAF CAFE', 0.34, 0xffffff, 0x16a34a] });
  B({ id: 'post', x0: -46, z0: 40, x1: -30, z1: 54, ceil: 5.0, ext: 0xe8b07a, int: 0xfdf0dc, band: 0x2563eb, floor: ['tile', 0xfef3c7, 0xbfdbfe, 1.4], door: { side: 'n', a: -40, b: -36 }, shutters: 0x2563eb, li: 22, awning: [0x2563eb, 0xffffff], sign: ['POST OFFICE', 0.4, 0xffffff, 0x2563eb] });
  B({ id: 'inn', x0: 28, z0: 40, x1: 46, z1: 56, ceil: 5.0, ext: 0xf2b8a0, int: 0xfff1e6, band: 0xa66bff, floor: ['wood', 0xb07a4a], door: { side: 'n', a: 35, b: 39 }, curtain: 0x7c3aed, shutters: 0x7c3aed, li: 22, sign: ['HAUNTED INN', 0.36, 0xffffff, 0x7c3aed], style: 'dome', domeR: 2.6, domeCol: 0xa66bff, domeAt: [42, 51] });
  B({ id: 'market', x0: 50, z0: -28, x1: 74, z1: -10, ceil: 6.2, ext: 0xf6c27a, int: 0xfff1d6, band: 0xff5d8f, floor: ['tile', 0xf5e1bd, 0xe9c48e, 1.6], door: { side: 's', a: 59, b: 65, h: 4.2 }, winTop: 4.6, winBot: 1.3, shutters: 0xe11d48, li: 34, awning: [0xff5d8f, 0xffffff], sign: ['NIGHT MARKET', 0.4, 0xffffff, 0x16a34a] });
  B({ id: 'shellshop', x0: 80, z0: -24, x1: 94, z1: -10, ceil: 5.0, ext: 0xf9c9d6, int: 0xfff1f6, band: 0x38bdf8, floor: ['tile', 0xffffff, 0xbae6fd, 1.2], door: { side: 's', a: 85, b: 89 }, curtain: 0x0ea5e9, shutters: 0x0ea5e9, li: 22, awning: [0x38bdf8, 0xffffff], sign: ['THE LANTERN SHOP', 0.36, 0xffffff, 0x0ea5e9] });
  B({ id: 'pottery', x0: 100, z0: -22, x1: 112, z1: -10, ceil: 4.8, ext: 0xd9824a, int: 0xf6e0c6, band: 0xffd23f, floor: ['wood', 0xa0703e], door: { side: 's', a: 104, b: 108 }, shutters: 0x0d9488, li: 20, sign: ['POTTERY', 0.38, 0xffffff, 0x7c2d12], style: 'dome', domeR: 2.0, domeCol: 0xc8693c });
  B({ id: 'sweets', x0: 50, z0: 10, x1: 64, z1: 24, ceil: 4.8, ext: 0xffb3cf, int: 0xfff0f6, band: 0xffd23f, floor: ['tile', 0xffffff, 0xfbcfe8, 1.0], door: { side: 'n', a: 55, b: 59 }, curtain: 0xdb2777, shutters: 0xdb2777, li: 22, awning: [0xff5d8f, 0xffffff], sign: ['TRICK-OR-TREAT SWEETS', 0.32, 0xffffff, 0xdb2777] });
  B({ id: 'fossil', x0: 72, z0: 10, x1: 92, z1: 28, ceil: 6.4, ext: 0xe8c9a0, int: 0xf8ecd8, band: 0x7c2d12, floor: ['marble', 0xf5ead8, 0xe3cfae, 2.4], door: { side: 'n', a: 79, b: 85, h: 4.2 }, winTop: 4.6, winBot: 1.5, li: 30, sign: ['MUSEUM OF MONSTERS', 0.36, 0xffffff, 0x7c2d12], noPots: true });
  B({ id: 'burrow', x0: -70, z0: -30, x1: -48, z1: -10, ceil: 4.8, wallH: 4.6, ext: 0xe8b07a, int: 0xfbe6c8, floor: ['wood', 0xb07a4a], door: { side: 's', a: -61, b: -57, h: 3.2 }, curtain: 0xff6fcf, shutters: 0xff6fcf, li: 20, lightCol: 0xffe2b8, style: 'mound', moundH: 4.0, chimney: [-53, -24], sign: ["TORTY'S FAMILY", 0.3, 0xffffff, 0xdb2777] });
  B({ id: 'shelby', x0: -94, z0: -26, x1: -78, z1: -10, ceil: 4.6, wallH: 4.4, ext: 0xe0a070, int: 0xfdecd2, floor: ['wood', 0xa0703e], door: { side: 's', a: -88, b: -84, h: 3.2 }, curtain: 0x22c55e, shutters: 0x22c55e, li: 20, style: 'mound', moundH: 3.4, chimney: [-81, -22], sign: ["SHELBY'S", 0.3, 0xffffff, 0x15803d] });
  B({ id: 'school', x0: -70, z0: 10, x1: -50, z1: 26, ceil: 4.8, ext: 0xffd166, int: 0xfffbea, band: 0xef4444, floor: ['wood', 0xc58b52], door: { side: 'n', a: -62, b: -58 }, curtain: 0xef4444, shutters: 0xef4444, li: 24, sign: ['SLOWPOKE SCHOOL', 0.36, 0xffffff, 0xef4444] });
  w.region = 'shell'; { const x = -68, z = 9; w.add('m', rbox(1.4, 1.4, 1.4, 0.2), 0xef4444, -52, 5.6, 18); w.add('x', lathe([[0, 0], [0.4, 0], [0.45, 0.5], [0, 0.6]], 16, 'bell'), 0xffd23f, -52, 5.0, 18); w.add('m', prism(1.8, 0.9, 1.8), 0xb4533a, -52, 6.3, 18); }
  B({ id: 'spa', x0: -36, z0: -114, x1: -10, z1: -94, ceil: 5.6, ext: 0xf6e3c6, int: 0xeafcf8, band: 0x14b8a6, floor: ['tile', 0xe0f7f4, 0x99f6e4, 1.2], door: { side: 's', a: -25, b: -21, h: 3.8 }, curtain: 0x0f766e, shutters: 0x0f766e, li: 28, lightCol: 0xe8fffb, sign: ['WITCH’S BUBBLING SPA', 0.42, 0xffffff, 0x0f766e], style: 'dome', domeR: 4.0, domeCol: 0x5eead4, domeAt: [-23, -104] });
  B({ id: 'obs', x0: 14, z0: -114, x1: 30, z1: -98, ceil: 7.2, ext: 0xe9d5c0, int: 0xeef2ff, band: 0x6366f1, floor: ['tile', 0x1e1b4b, 0x312e81, 2.0], door: { side: 's', a: 20, b: 24, h: 3.6 }, winTop: 5.5, winBot: 1.6, li: 18, lightCol: 0xdde4ff, ceilCol: 0x1e1b4b, sign: ['MOON OBSERVATORY', 0.36, 0xffffff, 0x4338ca], style: 'tower', domeR: 5.2, domeCol: 0xf8fafc, noPots: true });
  B({ id: 'club', x0: -30, z0: 74, x1: -12, z1: 90, ceil: 5.0, ext: 0xffffff, int: 0xfff7ed, band: 0xe2733f, floor: ['wood', 0xb07a4a], door: { side: 'e', a: 80, b: 84 }, shutters: 0xe2733f, li: 22, awning: [0x111827, 0xffffff], sign: ["RACERS' CLUBHOUSE", 0.32, 0xffffff, 0xe2733f] });
  B({ id: 'barn', x0: -104, z0: 44, x1: -86, z1: 60, ceil: 6.6, wallH: 6.2, ext: 0xc2412d, int: 0xf3dcc0, trim: 0xffffff, frame: 0xffffff, floor: ['wood', 0x9a6a3e], door: { side: 'e', a: 49.5, b: 54.5, h: 4.6 }, winTop: 4.6, winBot: 2.2, li: 26, sign: ['PUMPKIN BARN', 0.42, 0xffffff, 0x7f1d1d], style: 'gable', roofCol: 0x7f1d1d, roofH: 4.5, noPots: true });
  B({ id: 'green', x0: -80, z0: 70, x1: -66, z1: 82, ceil: 5.4, wallH: 4.2, ext: 0xffffff, int: 0xffffff, floor: ['tile', 0xc9a27a, 0xb98545, 1.0], door: { side: 'n', a: -75, b: -71, h: 3.0 }, li: 20, style: 'glass', roofH: 2.6 });
}
