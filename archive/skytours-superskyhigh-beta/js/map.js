// Grok Snowie Sky Tours - the open world: rolling hills, a lake, snowy peaks and three towns (Pup Town, Torty Town,
// North Pole Village) around Snowie's heliport. Every town building is walk-in. Brand-new map, built on the Turbo kit.
import * as THREE from 'three';
import * as K from './kit.js?v=st10';
import { rbox } from './world.js?v=st10';
import { shell, part, onSide } from './bld.js?v=st10';
import { textGeo } from './text3d.js?v=st10';
import { dressRooms, cottageRoom } from './rooms.js?v=st10';
import { buildPatch, freeAt } from './mapx.js?v=st10';
const { rcyl, lathe, sph, cyl, cone, torus, capsule, tube, star, heart, blobGeo, wedge, propSeed } = K;
const PI = Math.PI, R = K.R, pick = K.pick;
export const ENV = { sunDir: [0.5, 0.8, 0.3], sunColor: 0xfff1dc, sunI: 2.6, hemiSky: 0xd6ecff, hemiGround: 0x7a9a5a, hemiI: 0.65, skyTop: 0x2a78e4, skyMid: 0x9fd3ff, skyBot: 0xe8f6ff, fog: 0xcfe6ff, fogD: 0.0016, exposure: 1.0, envI: 0.85, bloomT: 1.05, bloomS: 0.35, sunDisc: 1, stars: 0 };
export const TOWNS = {
  hub: { x: 0, z: 0, r: 62, name: '🚁 Snowie Sky Tours Heliport' },
  pup: { x: -240, z: -150, r: 78, name: '🐶 Pup Town' },
  tort: { x: 210, z: -180, r: 78, name: '🐢 Torty Town' },
  np: { x: -30, z: 250, r: 74, name: '🎄 North Pole Village', snow: true },
};
export const LAKE = { x: 270, z: 10, r: 72 };
export const WATER_Y = -1.2;
const PEAKS = [[-150, 370, 115, 70], [70, 390, 140, 75], [-20, 470, 175, 90], [220, 430, 105, 70], [-300, 390, 95, 80], [330, 300, 70, 60]];
const PLAT = [{ x: 40, z: 330, r: 9, y: 0 }, { x: 120, z: -330, r: 20, y: 36 }]; // mountain ledge (y filled in below) + the mesa
const ISLAND = { x: 296, z: 0, r: 9 }, POND = { x: 70, z: 190, r: 24 };
const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function rawH(x, z) {
  let h = 4 + 2.5 * Math.sin(x * 0.011 + 1.3) * Math.cos(z * 0.009) + 1.6 * Math.sin((x + z) * 0.021) + 0.8 * Math.sin(x * 0.05) * Math.sin(z * 0.043);
  for (const [px, pz, ph, s] of PEAKS) { const d2 = (x - px) ** 2 + (z - pz) ** 2; h += ph * Math.exp(-d2 / (2 * s * s)); }
  const r = Math.max(Math.abs(x), Math.abs(z)); if (r > 470) h += Math.pow((r - 470) / 80, 1.5) * 60;
  return h;
}
PLAT[0].y = Math.round(rawH(40, 330) * 0.85);
function Hf0(x, z) {
  let h = rawH(x, z);
  for (const k in TOWNS) { const t = TOWNS[k], d = Math.hypot(x - t.x, z - t.z); if (d < t.r + 45) h = h * ss(t.r, t.r + 45, d); }
  for (const p of PLAT) { const d = Math.hypot(x - p.x, z - p.z); if (d < p.r + 10) { const k = ss(p.r + 10, p.r, d); h = h + (p.y - h) * k; } }
  { const d = Math.hypot(x - 120, z - 330 * -1); if (d < 34) h = Math.max(h, 36 * ss(34, 22, d) + h * (1 - ss(34, 22, d))); }
  { const d = Math.hypot(x - LAKE.x, z - LAKE.z); if (d < LAKE.r + 28) h = h + (-7 - h) * ss(LAKE.r + 28, LAKE.r - 12, d); }
  { const d = Math.hypot(x - ISLAND.x, z - ISLAND.z); if (d < ISLAND.r + 10) h = h + (1.2 - h) * ss(ISLAND.r + 10, ISLAND.r, d); }
  { const d = Math.hypot(x - POND.x, z - POND.z); if (d < POND.r + 14) h = h + (-4 - h) * ss(POND.r + 14, POND.r - 6, d); }
  return h;
}
// flatten zones: runways, aprons, the farm, the corn maze, the woods camp... so nothing sits on a slope (y: null = keep the local height)
export const FLAT = [
  { rect: [-100, -84, 60, -40], m: 20, y: 0 }, { rect: [-300, -72, -180, -48], m: 18, y: 0 }, { rect: [155, -107, 275, -83], m: 18, y: 0 }, { rect: [-160, 163, -50, 187], m: 18 },
  { x: -110, z: 80, r: 26, m: 14 }, { x: 80, z: -82, r: 30, m: 16 }, { x: 98, z: -124, r: 22, m: 14 }, { x: 200, z: -24, r: 4, m: 6 }, { x: -360, z: 40, r: 13, m: 10 }, { x: 180, z: 30, r: 7, m: 10 },
];
for (const f of FLAT) if (f.y == null) f.y = f.rect ? Hf0((f.rect[0] + f.rect[2]) / 2, (f.rect[1] + f.rect[3]) / 2) : Hf0(f.x, f.z);
export function Hf(x, z) { let h = Hf0(x, z);
  for (const f of FLAT) { const d = f.rect ? Math.max(f.rect[0] - x, x - f.rect[2], f.rect[1] - z, z - f.rect[3], 0) : Math.max(0, Math.hypot(x - f.x, z - f.z) - f.r); if (d < f.m) h += (f.y - h) * ss(f.m, 0, d); }
  return h; }
// lowest ground under a footprint (props sink into slopes instead of floating on their downhill side)
export function sinkY(x, z, r = 0.8, d = 0.25) { let m = Hf(x, z); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; m = Math.min(m, Hf(x + Math.cos(a) * r, z + Math.sin(a) * r)); } return m - d; }
export function slopeAt(x, z, r = 3) { let lo = 1e9, hi = -1e9; for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2, h = Hf(x + Math.cos(a) * r, z + Math.sin(a) * r); lo = Math.min(lo, h); hi = Math.max(hi, h); } return hi - lo; }
export const SPOTS = {}; export const PADS = []; export const TOURS = []; export const RESCUES = []; export const ZONES = []; export const STAMPS = [];
// ---------- little art helpers ----------
export function txt(w, s, x, y, z, ry, size, col, b = 'g', em = 0) { const g = textGeo(s, size, size * 0.25); if (!g) return; w.add(b, g, col, x, y, z, 0, ry, 0, 1, 1, 1, em); }
export function bone(w, b, col, x, y, z, ry = 0, s = 1, rx = 0, em = 0) { const T = w.tf(x, y, z, ry, s); T.add(b, capsule(14), col, 0, 0, 0, rx, 0, PI / 2, 0.32, 1.1, 0.32, em); [-1, 1].forEach((a) => [-1, 1].forEach((c) => T.add(b, sph(14), col, a * 0.78, c * 0.2, 0, 0, 0, 0, 0.3, 0.3, 0.3, em))); }
export function frameArt(w, axis, at, c, y, W, H, col, side) { if (axis === 'x') { w.add('m', rbox(W + 0.14, H + 0.14, 0.06, 0.02), 0x7c4a1e, c, y, at + side * 0.03); w.add('m', rbox(W, H, 0.04, 0.01), col, c, y, at + side * 0.07); } else { w.add('m', rbox(0.06, H + 0.14, W + 0.14, 0.02), 0x7c4a1e, at + side * 0.03, y, c); w.add('m', rbox(0.04, H, W, 0.01), col, at + side * 0.07, y, c); } }
export function pendant(w, x, z, col, y = 3.1) { w.add('m', cyl(6), 0x334155, x, y, z, 0, 0, 0, 0.012, 1.2, 0.012); w.add('g', lathe([[0, 0], [0.3, 0], [0.22, 0.22], [0.04, 0.3], [0, 0.3]], 20, 'shade'), col, x, y - 0.3, z); w.add('l', sph(12), 0xfff3c4, x, y - 0.3, z, 0, 0, 0, 0.12, 0.12, 0.12, 0.6); }
export function bed(w, x, z, ry, col) { const T = w.tf(x, 0, z, ry); T.slab('m', 0x9a6a3e, 0, 0, 0, 1.6, 0.45, 2.2, 0.06); T.slab('f', 0xffffff, 0, 0.45, 0.1, 1.5, 0.18, 1.9, 0.08); T.slab('f', col, 0, 0.6, 0.35, 1.55, 0.08, 1.3, 0.04); T.slab('f', 0xfef3c7, 0, 0.62, -0.75, 1.0, 0.18, 0.4, 0.08); T.slab('m', 0x9a6a3e, 0, 0, -1.1, 1.7, 1.1, 0.1, 0.04); T.solid(-0.8, 0, -1.15, 0.8, 0.7, 1.1); }
export function table2(w, x, z, top = 0xfde68a, chair = 0xff8a3d) { K.tableR(w, x, z, 0.6, 0.78, top); K.stool(w, x - 0.95, z, chair); K.stool(w, x + 0.95, z, chair); w.add('g', lathe([[0, 0], [0.08, 0], [0.08, 0.16], [0, 0.16]], 14, 'cup'), pick([0xff4fa0, 0x60a5fa, 0xffd23f]), x + 0.2, 0.78, z); }
export function clockW(w, axis, at, c, y, side) { const ry = axis === 'x' ? (side > 0 ? 0 : PI) : (side > 0 ? PI / 2 : -PI / 2); const T = axis === 'x' ? w.tf(c, y, at, ry) : w.tf(at, y, c, ry); T.add('g', rcyl(0.36, 0.08, 0.03, 28), 0xef4444, 0, 0, 0.05, PI / 2, 0, 0); T.add('m', rcyl(0.3, 0.02, 0.01, 28), 0xffffff, 0, 0, 0.1, PI / 2, 0, 0); T.box('g', 0x111827, 0, 0.08, 0.12, 0.03, 0.2, 0.01, 0.005); T.box('g', 0x111827, 0.06, 0, 0.12, 0.14, 0.03, 0.01, 0.005); }
export function snowman(w, x, z, s = 1) { w.add('g', sph(18), 0xffffff, x, 0.7 * s, z, 0, 0, 0, 0.8 * s); w.add('g', sph(18), 0xffffff, x, 1.75 * s, z, 0, 0, 0, 0.55 * s); w.add('g', sph(16), 0xffffff, x, 2.55 * s, z, 0, 0, 0, 0.4 * s); w.add('g', cone(10), 0xff7a1a, x, 2.55 * s, z + 0.35 * s, PI / 2, 0, 0, 0.08 * s, 0.35 * s, 0.08 * s); [-1, 1].forEach((a) => w.add('g', sph(8), 0x111827, x + a * 0.14 * s, 2.68 * s, z + 0.34 * s, 0, 0, 0, 0.05 * s)); w.add('f', torus(0.3, 20), 0xef4444, x, 2.2 * s, z, PI / 2, 0, 0, 0.42 * s, 0.42 * s, 0.6 * s); w.add('g', cyl(16), 0x1f2937, x, 2.85 * s, z, 0, 0, 0, 0.28 * s, 0.4 * s, 0.28 * s); w.solid(x - 0.8 * s, 0, z - 0.8 * s, x + 0.8 * s, 3 * s, z + 0.8 * s); }
export function pine(w, x, z, s = 1, snow = false, y = 0) { const oy = w.oy; w.oy = y; w.add('m', cyl(8), 0x7c4a1e, x, 0, z, 0, 0, 0, 0.25 * s, 1.4 * s, 0.25 * s); for (let i = 0; i < 3; i++) { const r = (1.9 - i * 0.5) * s, hh = 1.9 * s, yy = (1.0 + i * 1.15) * s; w.add('m', cone(12), i % 2 ? 0x15803d : 0x166534, x, yy, z, 0, i, 0, r, hh, r); if (snow) w.add('m', cone(12), 0xffffff, x, yy + hh * 0.55, z, 0, i, 0, r * 0.5, hh * 0.45, r * 0.5); } w.solid(x - 0.4 * s, 0, z - 0.4 * s, x + 0.4 * s, 4.5 * s, z + 0.4 * s);
  if (w.detail) { w.detail = false; w.far = true; w.add('m', cone(8), 0x166534, x, 2.4 * s, z, 0, 0, 0, 1.6 * s, 4.2 * s, 1.6 * s); if (snow) w.add('m', cone(8), 0xffffff, x, 3.6 * s, z, 0, 0, 0, 0.8 * s, 1.6 * s, 0.8 * s); w.far = false; w.detail = true; } w.oy = oy; }
export function roundTree(w, x, z, s = 1, y = 0, col) { const oy = w.oy; w.oy = y; w.add('m', capsule(8), 0x8b5a2b, x, 1.2 * s, z, 0, 0, 0, 0.4 * s, 1.4 * s, 0.4 * s); const c = col || pick([0x4ade80, 0x22c55e, 0x16a34a, 0x65a30d]); w.add('m', blobGeo(((x * 3 + z * 7) | 0) & 63, 0.22, 2), c, x, 3.4 * s, z, 0, R() * 6, 0, 1.9 * s, 1.6 * s, 1.9 * s); w.add('m', blobGeo(((x * 5 + z * 3) | 0) & 63, 0.22, 2), c, x + 0.9 * s, 2.8 * s, z + 0.4 * s, 0, R() * 6, 0, 1.2 * s, 1.0 * s, 1.2 * s); w.solid(x - 0.45 * s, 0, z - 0.45 * s, x + 0.45 * s, 4.6 * s, z + 0.45 * s);
  if (w.detail) { w.detail = false; w.far = true; w.add('m', sph(8), c, x + 0.3 * s, 3.2 * s, z + 0.1 * s, 0, 0, 0, 2.0 * s, 1.8 * s, 2.0 * s); w.far = false; w.detail = true; } w.oy = oy; }
export function cloud(w, x, y, z, s) { for (let i = 0; i < 5; i++) w.add('m', blobGeo((i * 11 + (x | 0)) & 63, 0.18, 2), 0xffffff, x + (i - 2) * 5 * s, y + Math.sin(i * 2.1) * 1.5 * s, z + Math.cos(i * 1.7) * 3 * s, 0, i, 0, (5 + (i % 3) * 1.6) * s, 3.2 * s, 4.5 * s, 0.25); }
function balloon(w, x, y, z, a, b) { w.addFn('g', sph(24), (c, px, py, pz) => c.set(Math.sin(Math.atan2(pz - z, px - x) * 4) > 0 ? a : b), x, y, z, 0, 0, 0, 4.2, 5, 4.2); w.add('g', lathe([[0, 0], [1.4, 0], [1.5, 0.4], [0, 0.4]], 16, 'bask'), 0xc08552, x, y - 7.5, z); w.add('g', rcyl(1.5, 1.0, 0.1, 16), 0xa16207, x, y - 7.5, z); for (let i = 0; i < 4; i++) { const q = i / 4 * PI * 2 + 0.4; w.add('x', tube([[x + Math.cos(q) * 1.3, y - 6.5, z + Math.sin(q) * 1.3], [x + Math.cos(q) * 2.6, y - 3.4, z + Math.sin(q) * 2.6]], 0.03, 2, 4), 0x334155, 0, 0, 0); } }
// landing pad (big H, glowing rim lights). solid floor top y = 0.3 + base
export function pad(w, id, x, z, y, col, name, town, walk = true) { const oy = w.oy; w.oy = y; w.add('g', rcyl(6, 0.3, 0.08, 40), 0x475569, x, 0, z); w.add('g', rcyl(5.2, 0.05, 0.02, 40), col, x, 0.3, z); w.add('g', rcyl(4.6, 0.06, 0.02, 40), 0x334155, x, 0.31, z);
  [-1, 1].forEach((s) => w.add('l', rbox(0.7, 0.04, 3.6, 0.02), 0xffffff, x + s * 1.2, 0.37, z, 0, 0, 0, 1, 1, 1, 0.2)); w.add('l', rbox(1.8, 0.04, 0.7, 0.02), 0xffffff, x, 0.37, z, 0, 0, 0, 1, 1, 1, 0.2);
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; w.add('l', sph(8), i % 2 ? 0xffd23f : col, x + Math.cos(a) * 5.6, 0.36, z + Math.sin(a) * 5.6, 0, 0, 0, 0.14, 0.1, 0.14, 0.8); }
  w.solid(x - 5.6, -2, z - 5.6, x + 5.6, 0.3, z + 5.6, { floor: true }); w.oy = oy; PADS.push({ id, x, z, y: y + 0.3, col, name, town, walk }); }
// ---------- walk-in buildings ----------
// pitched roof on the roof region (hidden while you're inside)
function gable(w, b, col, axis = 'x', snow = false) { const { x0, z0, x1, z1 } = b, h = b.h, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; w.region = 'roof_' + b.id;
  const span = axis === 'x' ? (z1 - z0) : (x1 - x0), len = (axis === 'x' ? (x1 - x0) : (z1 - z0)) + 1.4, rise = span * 0.36, ang = Math.atan2(rise, span / 2), sl = Math.hypot(rise, span / 2) + 0.6;
  [-1, 1].forEach((s) => { if (axis === 'x') { w.add('g', rbox(len, 0.25, sl, 0.08), col, cx, h + 0.75 + rise / 2, cz + s * span / 4, s * ang, 0, 0); if (snow) w.add('m', rbox(len + 0.1, 0.18, sl * 0.9, 0.08), 0xffffff, cx, h + 0.92 + rise / 2, cz + s * span / 4, s * ang, 0, 0); }
    else { w.add('g', rbox(sl, 0.25, len, 0.08), col, cx + s * span / 4, h + 0.75 + rise / 2, cz, 0, 0, -s * ang); if (snow) w.add('m', rbox(sl * 0.9, 0.18, len + 0.1, 0.08), 0xffffff, cx + s * span / 4, h + 0.92 + rise / 2, cz, 0, 0, -s * ang); } });
  // gable ends
  const tri = new THREE.Shape(); tri.moveTo(-span / 2, 0); tri.lineTo(span / 2, 0); tri.lineTo(0, rise); tri.lineTo(-span / 2, 0); const tg = new THREE.ExtrudeGeometry(tri, { depth: 0.3, bevelEnabled: false });
  if (axis === 'x') [x0, x1].forEach((x) => w.add('m', tg, b.wall, x - 0.15, h + 0.62, cz, 0, PI / 2, 0)); else [z0, z1].forEach((z) => w.add('m', tg, b.wall, cx, h + 0.62, z - 0.15, 0, 0, 0)); }
function shellDome(w, b, a, c) { const { x0, z0, x1, z1 } = b, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, rx = (x1 - x0) / 2 + 0.4, rz = (z1 - z0) / 2 + 0.4; w.region = 'roof_' + b.id;
  w.addFn('g', sph(28), (col, px, py, pz) => { const u = Math.atan2(pz - cz, px - cx) * 3, v = (py - b.h) * 1.4; col.set(((Math.floor(u) + Math.floor(v)) & 1) ? a : c); }, cx, b.h + 0.6, cz, 0, 0, 0, rx, Math.min(rx, rz) * 0.7, rz); }
function dress(w, b, theme, o = {}) { const { x0, z0, x1, z1 } = b, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; w.region = 'in_' + b.id;
  const ac = theme.ac;
  K.rug(w, cx, cz, 0, Math.min(4, x1 - x0 - 3), Math.min(3, z1 - z0 - 3), ac, theme.ac2 || 0xfef3c7);
  bed(w, x0 + 1.4, z0 + 1.8, 0, ac); w.add('m', rbox(0.6, 0.6, 0.5, 0.05), 0x9a6a3e, x0 + 2.7, 0.3, z0 + 0.9); K.potPlant(w, x0 + 2.7, 0.6, z0 + 0.9, 0.5, ac);
  table2(w, x1 - 2.2, z1 - 2.4, theme.top || 0xfde68a, ac); K.shelf(w, x1 - 0.7, z0 + 2.2, -PI / 2, 2.0, 1.8, 0.5, 0xa0703f);
  for (let i = 0; i < 4; i++) w.add('m', rbox(0.18, 0.3, 0.24, 0.02), pick([0xef4444, 0x60a5fa, 0xfbbf24, 0x22c55e]), x1 - 0.8, 0.95 + (i % 2) * 0.6, z0 + 1.5 + i * 0.35);
  K.potPlant(w, x0 + 0.8, 0, z1 - 0.8, 1.0, ac); frameArt(w, 'x', z0 + 0.25, cx, 2.0, 1.4, 1.0, theme.art || 0xbae6fd, 1); clockW(w, 'x', z0 + 0.25, cx + 2, 2.4, 1); pendant(w, cx, cz, ac, b.h - 0.6);
  if (theme.extra) theme.extra(w, b); }
function cottage(w, id, name, x, z, W, D, door, theme) { const b = shell(w, { id, name, x0: x - W / 2, z0: z - D / 2, x1: x + W / 2, z1: z + D / 2, h: 3.6, wall: theme.wall, trim: theme.trim, roof: theme.roof, floor: theme.floor || 'wood', fc1: theme.fc1, fc2: theme.fc2, doors: [{ side: door, at: door === 's' || door === 'n' ? x : z, w: 1.8, top: 2.6 }], win: { s: 1, n: 1, e: 1, w: 1 }, flat: true });
  if (theme.dome) shellDome(w, b, theme.roof, theme.roof2); else gable(w, b, theme.roof, W >= D ? 'x' : 'z', !!theme.snow);
  if (theme.chim) { w.region = 'roof_' + id; w.add('m', rbox(0.7, 1.6, 0.7, 0.06), 0xb45309, x + W / 4, 4.8, z); }
  cottageRoom(w, b, theme, door); w.region = 'out'; return b; }
// ================= the world =================
export function buildMap(w) {
  propSeed(777); w.region = 'out'; const L = w.lights;
  // terrain: one big quantized mesh, painted by height/slope (grass, sand by the water, rock, snow)
  { const N = 200, S = 1100; const g = new THREE.PlaneGeometry(S, S, N, N); g.rotateX(-PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, Hf(p.getX(i), p.getZ(i))); g.computeVertexNormals(); const nr = g.attributes.normal;
    w.addFn('m', g, (c, x, y, z) => { const n = Math.sin(x * 0.07) * Math.cos(z * 0.06) * 0.5 + Math.sin(x * 0.019 + z * 0.023) * 0.5; const dNP = Math.hypot(x - TOWNS.np.x, z - TOWNS.np.z);
      const snow = y > 48 + n * 6 || dNP < TOWNS.np.r + 40 || (z > 200 && y > 18);
      if (y < WATER_Y + 1.2) c.setHSL(0.11, 0.45, 0.68 + n * 0.04); else if (snow) c.setHSL(0.58, 0.32, 0.86 + n * 0.05); else if (y > 30) c.setHSL(0.08, 0.12, 0.5 + n * 0.06); else c.setHSL(0.27 + n * 0.03, 0.55, 0.42 + n * 0.05 + Math.min(0.06, y * 0.002)); }, 0, 0, 0); }
  // towns are flat at y=0: one walkable floor each
  for (const k in TOWNS) { const t = TOWNS[k]; w.solid(t.x - t.r - 20, -3, t.z - t.r - 20, t.x + t.r + 20, 0, t.z + t.r + 20, { floor: true }); ZONES.push({ x: t.x, z: t.z, r: t.r - 2, town: k }); }
  buildHub(w); buildPup(w); buildTort(w); buildNP(w); buildCountry(w); buildPatch(w); dressRooms(w); w.region = 'out';
  { const hz = ZONES.find((q) => q.town === 'hub'); hz.parts = [{ x: 0, z: 0, r: 62 }, { rect: [-78, -62, 62, -36] }, { rect: [-92, -82, 52, -62] }]; }
}
// ---------------- Heliport hub ----------------
function buildHub(w) { const T0 = TOWNS.hub; w.region = 'out';
  K.floor(w, -40, -36, 40, 30, 'tile', 0.02, 0xd6d3d1, 0xc4bfb9, 4);
  pad(w, 'hubA', 0, 0, 0, 0xff4fa0, 'Heliport Pad A', 'hub'); pad(w, 'hubB', 22, 8, 0, 0x3ff0ff, 'Heliport Pad B', 'hub');
  SPOTS.start = [0, 0];
  // windsock + control tower (decor) + runway lights
  { const x = -34, z = 6; w.add('x', cyl(10), 0xe5e7eb, x, 0, z, 0, 0, 0, 0.08, 6, 0.08); w.add('f', cone(16), 0xff7a1a, x + 1.2, 5.6, z, 0, 0, -PI / 2, 0.4, 2.4, 0.4); }
  for (let i = 0; i < 10; i++) w.add('l', sph(8), i % 2 ? 0x3ff0ff : 0xffd23f, -30 + i * 6.6, 0.15, 24, 0, 0, 0, 0.18, 0.12, 0.18, 0.7);
  // TOUR OFFICE
  { const b = shell(w, { id: 'office', name: 'Snowie Sky Tours Office', x0: -30, z0: -32, x1: -8, z1: -16, h: 4.6, wall: 0xffffff, trim: 0xff4fa0, roof: 0xbe185d, floor: 'wood', fc1: 0xd9a066, doors: [{ side: 's', at: -19, w: 2.6 }], win: { s: 3, n: 2, e: 2, w: 2 } });
    w.region = 'out'; onSide(w, b, 's', () => { w.add('g', rbox(9, 0.2, 2.2, 0.08), 0xff4fa0, -19, 3.5, -14.9); txt(w, 'SNOWIE SKY TOURS', -19, 3.9, -15.7, 0, 0.42, 0xff4fa0); });
    w.region = 'roof_office'; [[-26, -28], [-12, -20]].forEach(([x, z]) => w.add('x', rcyl(0.6, 0.3, 0.05, 16), 0xe5e7eb, x, 5.4, z)); { const x = -19, z = -24; w.add('x', cyl(8), 0x94a3b8, x, 5.2, z, 0, 0, 0, 0.05, 2.5, 0.05); w.add('g', sph(10), 0xff4fa0, x, 7.8, z, 0, 0, 0, 0.18); }
    w.region = 'in_office';
    { const T = w.tf(-19, 0, -27.6, 0); T.slab('g', 0xffffff, 0, 0, 0, 5.2, 1.1, 1.1, 0.12); T.box('g', 0xff4fa0, 0, 0.2, 0.56, 5.0, 0.5, 0.04, 0.03); T.box('g', 0x3ff0ff, 0, 1.1, 0, 5.4, 0.08, 1.3, 0.04); K.monitor(w, T, 1.6, 1.18, -0.2, 0, 0x3ff0ff); }
    txt(w, 'TOUR DESK', -19, 3.2, -31.6, 0, 0.32, 0xff4fa0);
    // postcard wall: one frame per tour stop (lit up by the game when collected)
    for (let i = 0; i < 15; i++) { const x = -28.5 + (i % 5) * 1.5, y = 1.6 + (i / 5 | 0) * 1.3; w.add('m', rbox(1.2, 0.9, 0.06, 0.02), 0x7c4a1e, x, y, -31.7); } SPOTS.postcards = [-25.5, -30.4];
    // 3D map table: a little model of the whole valley
    { const x = -13, z = -24; w.add('m', rbox(3.4, 0.9, 2.4, 0.08), 0x8b5a2b, x, 0.45, z); const N = 24; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const wx = (i / (N - 1) - 0.5) * 1000, wz = (j / (N - 1) - 0.5) * 1000, h = Hf(wx, wz); const col = h < WATER_Y ? 0x38bdf8 : h > 45 ? 0xffffff : h > 25 ? 0x9ca3af : 0x4ade80; w.add('m', rbox(0.13, 0.04 + Math.max(0, h) * 0.006, 0.09, 0.01), col, x - 1.55 + i * 0.135, 0.92, z - 1.05 + j * 0.09); }
      [['hub', 0xff4fa0], ['pup', 0xffd23f], ['tort', 0x14b8a6], ['np', 0xef4444]].forEach(([k, c]) => { const t = TOWNS[k]; w.add('l', sph(10), c, x + t.x / 1000 * 3.1, 1.1, z + t.z / 1000 * 2.1, 0, 0, 0, 0.07, 0.07, 0.07, 0.6); }); w.solid(x - 1.7, 0, z - 1.2, x + 1.7, 1.0, z + 1.2); SPOTS.maptable = [x - 2.2, z]; }
    [-28.5, -26.8].forEach((x) => K.chair(w, x, 0, -18.2, PI, 0xff4fa0)); [-11.5, -9.8].forEach((x) => K.chair(w, x, 0, -18.2, PI, 0x3ff0ff)); K.potPlant(w, -29, 0, -24, 1.2, 0xff4fa0); K.potPlant(w, -9, 0, -31, 1.2, 0x3ff0ff);
    { const T = w.tf(-23.5, 0, -18.8, 0); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) T.box('m', pick([0xff4fa0, 0x3ff0ff, 0xffd23f, 0x4ade80]), -0.5 + j * 0.5, 0.5 + i * 0.5, 0, 0.4, 0.42, 0.04, 0.01); T.slab('m', 0xe5e7eb, 0, 0, -0.1, 1.6, 1.9, 0.2, 0.04); }
    clockW(w, 'z', -29.75, -20, 2.8, 1); pendant(w, -19, -24, 0xff4fa0, 4.1); pendant(w, -13, -24, 0xff4fa0, 4.1); pendant(w, -25, -24, 0xff4fa0, 4.1);
    SPOTS.snowie = [-19, -28.0]; SPOTS.stamp_hub = [-10.6, -29.6]; STAMPS.push({ id: 'hub', name: 'Heliport', at: SPOTS.stamp_hub }); w.lights.push({ x: -19, y: 3.6, z: -24, c: 0xfff1f8, i: 13, d: 16 }); }
  // HANGAR (paint shop + the tow-drone's dock)
  { const b = shell(w, { id: 'hangar', name: 'Copter Hangar & Paint Shop', x0: 8, z0: -36, x1: 32, z1: -16, h: 7.5, wall: 0x94a3b8, trim: 0xffd23f, roof: 0x475569, floor: 'tile', fc1: 0x64748b, fc2: 0x5b6474, doors: [{ side: 's', at: 20, w: 8, top: 5.5 }], win: { s: 0, n: 3, e: 2, w: 2 } });
    w.region = 'out'; onSide(w, b, 's', () => { txt(w, 'HANGAR 1', 20, 6.1, -15.7, 0, 0.6, 0x1f2937); for (let i = 0; i < 8; i++) w.add('g', rbox(0.9, 0.3, 0.06, 0.02), i % 2 ? 0x111827 : 0xffd23f, 16.4 + i, 5.75, -15.72, 0, 0, 0.5); });
    w.region = 'in_hangar';
    for (let i = 0; i < 3; i++) K.labBench(w, 30.5, -32 + i * 4, -PI / 2, 3, { top: 0x475569 }); K.robotArm(w, 11, -33); for (let i = 0; i < 4; i++) w.add('g', torus(0.38, 20), 0x1f2937, 10, 0.5 + i * 0.75, -20, PI / 2, 0, 0, 0.6, 0.6, 0.9);
    // paint booth
    { const x = 14, z = -27; w.add('e', rbox(5, 3.6, 0.1, 0.03), 0xbfe9ff, x, 1.8, z - 3); w.add('e', rbox(0.1, 3.6, 5, 0.03), 0xbfe9ff, x - 2.5, 1.8, z - 0.5); for (let i = 0; i < 6; i++) w.add('g', lathe([[0, 0], [0.22, 0], [0.22, 0.4], [0, 0.4]], 16, 'can'), [0xff4fa0, 0x3ff0ff, 0xffd23f, 0x4ade80, 0xa78bfa, 0xff7a3d][i], x - 2 + i * 0.6, 0, z - 2.5); w.solid(x - 2.6, 0, z - 3.1, x + 2.5, 3.6, z - 2.9); w.solid(x - 2.6, 0, z - 3, x - 2.4, 3.6, z + 2); txt(w, 'PAINT SHOP', x, 4.2, z - 3, 0, 0.32, 0xff4fa0); SPOTS.paint = [x, z]; }
    // tow-drone dock pad
    { const x = 26, z = -24; w.add('g', rcyl(2.2, 0.15, 0.05, 28), 0xffd23f, x, 0, z); txt(w, 'TOW', x, 0.17, z + 0.4, 0, 0.5, 0x111827); SPOTS.dock = [x, z]; }
    for (let i = 0; i < 5; i++) K.crate(w, 30.6, 0, -19 - (i % 3) * 1.1, 1.0, 0xd8a15a); K.cone3(w, 16, -18); K.cone3(w, 24, -18); clockW(w, 'x', -35.75, 20, 5.5, 1);
    [[14, -26], [26, -26]].forEach(([x, z]) => pendant(w, x, z, 0xffd23f, 6.6)); w.lights.push({ x: 20, y: 5.5, z: -26, c: 0xf1f5ff, i: 14, d: 18 }); }
  // PILOT LOUNGE
  { const b = shell(w, { id: 'lounge', name: 'Pilot Lounge', x0: -32, z0: 12, x1: -16, z1: 26, h: 4, wall: 0x3ff0ff, trim: 0xffffff, roof: 0x0e7490, floor: 'carpet', fc1: 0x6366f1, fc2: 0x818cf8, doors: [{ side: 'e', at: 19, w: 2.2 }], win: { s: 2, n: 2, e: 1, w: 2 } });
    gable(w, b, 0x0e7490, 'x'); w.region = 'in_lounge'; K.sofa(w, -27, 23.8, PI, 0xff4fa0, 0xf9a8d4); K.sofa(w, -30.4, 19, PI / 2, 0xff4fa0, 0xf9a8d4); K.tableR(w, -27, 20.5, 0.8, 0.45, 0xfde68a);
    K.vending(w, -17, 14, -PI / 2, 0x3ff0ff); { const x = -22, z = 13; const T = w.tf(x, 0, z, 0); T.slab('g', 0x7c3aed, 0, 0, 0, 1.2, 2.0, 0.9, 0.08); T.box('l', 0x3ff0ff, 0, 1.25, 0.46, 0.9, 0.6, 0.02, 0.02); T.box('g', 0xffd23f, 0, 0.95, 0.4, 1.0, 0.1, 0.4, 0.03); txt(w, 'SKY ACE', x, 1.75, z + 0.48, 0, 0.13, 0xffffff); T.solid(-0.6, 0, -0.45, 0.6, 2, 0.45); }
    K.shelf(w, -31.4, 15, PI / 2, 2.4, 2.0, 0.5, 0xa0703f); K.potPlant(w, -17, 0, 25, 1.1, 0x3ff0ff); frameArt(w, 'x', 12.25, -24, 2.0, 1.6, 1.1, 0xfbcfe8, 1); frameArt(w, 'x', 12.25, -28, 2.0, 1.6, 1.1, 0xbae6fd, 1); pendant(w, -24, 19, 0x3ff0ff, 3.6);
    SPOTS.log = [-27, 21.6]; w.lights.push({ x: -24, y: 3, z: 19, c: 0xe0f7ff, i: 12, d: 14 }); }
  // plaza dressing
  [[-38, -10], [31, -13], [-38, 26], [38, 26], [0, 28]].forEach(([x, z]) => K.lampPost(w, x, z)); [[-10, 26], [10, 26]].forEach(([x, z]) => K.bench(w, x, z, PI, 0xff4fa0));
  w.detail = true; [[-44, -20], [44, -30], [-46, 30], [-8, 42], [12, 44], [30, 40], [-30, 40]].forEach(([x, z]) => roundTree(w, x, z, 1)); for (let i = 0; i < 28; i++) { const a = i / 28 * PI * 2, x = Math.cos(a) * 54, z = Math.sin(a) * 54; if (freeAt(x, z, 2)) K.bush(w, x, z, 1.2); } w.detail = false;
  // sign
  { w.add('g', rbox(10, 2.4, 0.4, 0.1), 0xff4fa0, 0, 2.6, 34); txt(w, 'SKY TOURS', 0, 2.2, 34.22, 0, 0.7, 0xffffff); [-4.4, 4.4].forEach((x) => w.add('x', cyl(10), 0xe5e7eb, x, 0, 34, 0, 0, 0, 0.12, 1.5, 0.12)); w.solid(-5, 0, 33.7, 5, 3.8, 34.3); }
}
// ---------------- Pup Town ----------------
const PUP = { wall: 0xfde68a, trim: 0xffffff, roof: 0xdc2626, ac: 0xef4444, ac2: 0xfde68a, fc1: 0xc8874a, art: 0xfbcfe8, chim: true, extra: (w, b) => { const cx = (b.x0 + b.x1) / 2; w.add('f', torus(0.45, 24), 0x8b5cf6, cx - 1, 0.22, b.z1 - 1.3, PI / 2, 0, 0, 0.7, 0.7, 0.5); bone(w, 'g', 0xfef3c7, cx - 1, 0.2, b.z1 - 1.3, 0.4, 0.25); w.add('g', lathe([[0, 0], [0.3, 0], [0.34, 0.14], [0, 0.14]], 20, 'dbowl'), 0x60a5fa, cx + 0.3, 0, b.z1 - 0.8); } };
function buildPup(w) { const t = TOWNS.pup, X = t.x, Z = t.z; w.region = 'out';
  K.floor(w, X - 22, Z - 18, X + 22, Z + 18, 'tile', 0.02, 0xfcd9a8, 0xf2c48d, 3);
  K.floor(w, X - 3, Z + 18, X + 3, Z + 70, 'tile', 0.02, 0xe7d3b3, 0xdcc49e, 2); K.floor(w, X - 70, Z - 3, X - 22, Z + 3, 'tile', 0.02, 0xe7d3b3, 0xdcc49e, 2); K.floor(w, X + 22, Z - 3, X + 60, Z + 3, 'tile', 0.02, 0xe7d3b3, 0xdcc49e, 2);
  pad(w, 'pup', X + 30, Z + 22, 0, 0xffd23f, 'Pup Town Pad', 'pup');
  // landmark: Big Bone Arch over the south road
  { const x = X, z = Z + 56; [-1, 1].forEach((s) => { w.add('g', rcyl(1.2, 9, 0.2, 24), 0xfef3c7, x + s * 7, 0, z); w.add('g', sph(20), 0xfef3c7, x + s * 7, 9.4, z, 0, 0, 0, 1.6); w.solid(x + s * 7 - 1.2, 0, z - 1.2, x + s * 7 + 1.2, 10.5, z + 1.2); }); bone(w, 'g', 0xfef3c7, x, 11.2, z, 0, 5.2); txt(w, 'PUP TOWN', x, 10.2, z + 1.9, 0, 0.9, 0xdc2626); TOURS.push({ id: 'arch', name: 'Big Bone Arch', x, z, y: 11, town: 'pup' }); }
  // landmark: Giant Fire Hydrant water tower
  { const x = X + 46, z = Z - 40; w.add('x', cyl(12), 0x94a3b8, x, 0, z, 0, 0, 0, 0.7, 14, 0.7); [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([a, c]) => w.add('x', tube([[x + a, 0, z + c], [x + a * 0.4, 14, z + c * 0.4]], 0.18, 2, 6), 0x94a3b8, 0, 0, 0)); const T = w.tf(x, 14, z, 0);
    T.add('g', rcyl(4.2, 9, 0.6, 32), 0xef4444, 0, 0, 0); T.add('g', sph(28), 0xef4444, 0, 9, 0, 0, 0, 0, 4.2, 3, 4.2); T.add('g', rcyl(1.2, 1.6, 0.3, 20), 0xfacc15, 0, 11.6, 0); [-1, 1].forEach((s) => T.add('g', rcyl(1.4, 1.8, 0.3, 20), 0xfacc15, s * 4.6, 4.5, 0, 0, 0, PI / 2)); T.add('g', rcyl(4.6, 0.6, 0.2, 32), 0xfacc15, 0, 0.2, 0);
    w.solid(x - 4.2, 14, z - 4.2, x + 4.2, 26, z + 4.2); w.solid(x - 0.8, 0, z - 0.8, x + 0.8, 14, z + 0.8); TOURS.push({ id: 'hydrant', name: 'Giant Hydrant Water Tower', x, z, y: 28, town: 'pup' }); }
  // TOWN HALL (doghouse-shaped, with a clock tower) - Candy naps here
  { const b = shell(w, { id: 'hall', name: 'Pup Town Hall', x0: X - 12, z0: Z - 40, x1: X + 12, z1: Z - 22, h: 5.2, wall: 0xdc2626, trim: 0xffffff, roof: 0x7f1d1d, floor: 'marble', fc1: 0xe7d3b3, fc2: 0xd4b88f, doors: [{ side: 's', at: X, w: 3 }], win: { s: 2, n: 3, e: 2, w: 2 }, flat: true });
    gable(w, b, 0x7f1d1d, 'x'); w.region = 'roof_hall'; { const x = X, z = Z - 31; w.add('g', rbox(4, 6, 4, 0.2), 0xffffff, x, 12, z); w.add('g', rcyl(1.4, 0.2, 0.06, 28), 0xfef3c7, x, 12.5, z + 2.05, PI / 2, 0, 0); w.add('g', cone(4), 0x7f1d1d, x, 15, z, 0, PI / 4, 0, 3.4, 3.4, 3.4); bone(w, 'g', 0xfacc15, x, 19, z, 0, 0.8); }
    TOURS.push({ id: 'hall', name: 'Doghouse Town Hall', x: X, z: Z - 31, y: 18, town: 'pup' });
    w.region = 'out'; onSide(w, b, 's', () => { txt(w, 'TOWN HALL', X, 4.2, Z - 21.7, 0, 0.5, 0xffffff); w.add('g', rbox(1.2, 1.2, 0.2, 0.1), 0xfacc15, X, 3.6, Z - 21.65, 0, 0, PI / 4); });
    w.region = 'in_hall'; K.rug(w, X, Z - 30, 0, 8, 4, 0xdc2626, 0xfacc15);
    { const T = w.tf(X, 0, Z - 36.5, 0); T.slab('g', 0x7c3f2c, 0, 0, 0, 5, 1.0, 1.4, 0.1); T.box('g', 0xfacc15, 0, 0.5, 0.71, 4.8, 0.2, 0.04, 0.03); paperStackA(w, X - 1.5, 1.0, Z - 36.6); w.add('g', rbox(1.4, 0.3, 0.12, 0.04), 0xfacc15, X, 1.0, Z - 35.9); txt(w, 'MAYOR', X, 1.06, Z - 35.83, 0, 0.13, 0x7c3f2c); }
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) K.chair(w, X - 4.5 + i * 3, 0, Z - 27 + r * 2, PI, 0xdc2626);
    [-1, 1].forEach((s) => { K.potPlant(w, X + s * 11, 0, Z - 38.8, 1.3, 0xdc2626); w.add('m', cyl(10), 0xa16207, X + s * 9, 0, Z - 39, 0, 0, 0, 0.04, 3.2, 0.04); w.add('f', rbox(1.2, 0.8, 0.02, 0.01), s > 0 ? 0xdc2626 : 0xfacc15, X + s * 9 + 0.62, 2.7, Z - 39); });
    frameArt(w, 'x', Z - 39.75, X - 5, 2.8, 2.4, 1.6, 0xfde68a, 1); frameArt(w, 'x', Z - 39.75, X + 5, 2.8, 2.4, 1.6, 0xbae6fd, 1); txt(w, 'GOOD DOGS ONLY', X, 4.3, Z - 39.6, 0, 0.3, 0xfacc15); clockW(w, 'z', X - 11.75, Z - 30, 3, 1);
    pendant(w, X - 5, Z - 30, 0xfacc15, 4.5); pendant(w, X + 5, Z - 30, 0xfacc15, 4.5);
    SPOTS.candy = [X + 3.4, Z - 34.8]; SPOTS.mayor = [X - 1, Z - 37.6]; SPOTS.stamp_pup = [X + 6.5, Z - 37]; STAMPS.push({ id: 'pup', name: 'Pup Town Hall', at: SPOTS.stamp_pup }); w.lights.push({ x: X, y: 4, z: Z - 31, c: 0xfff1dc, i: 13, d: 18 }); }
  // BARKERY bakery
  { const b = shell(w, { id: 'barkery', name: 'The Barkery', x0: X + 14, z0: Z - 16, x1: X + 28, z1: Z - 4, h: 4, wall: 0xf9a8d4, trim: 0xffffff, roof: 0xbe185d, floor: 'tile', fc1: 0xfcd34d, fc2: 0xf9a8d4, doors: [{ side: 'w', at: Z - 10, w: 2.2 }], win: { s: 2, n: 2, e: 1, w: 1 }, flat: true });
    gable(w, b, 0xbe185d, 'x'); w.region = 'out'; onSide(w, b, 'w', () => { txt(w, 'BARKERY', X + 13.65, 3.1, Z - 10, -PI / 2, 0.34, 0xbe185d); for (let i = 0; i < 6; i++) w.add('f', rbox(0.06, 0.6, 1.0, 0.02), i % 2 ? 0xffffff : 0xf472b6, X + 13.4, 2.7, Z - 12.5 + i, 0, 0, 0.3); });
    w.region = 'in_barkery'; { const T = w.tf(X + 23, 0, Z - 10, PI / 2); T.slab('g', 0xffffff, 0, 0, 0, 6, 1.0, 1.1, 0.1); T.box('e', 0xcfefff, 0, 1.0, 0, 5.8, 0.6, 1.0, 0.04); for (let i = 0; i < 8; i++) bone(w, 'g', pick([0xfde68a, 0xf9a8d4, 0xc08552]), X + 23, 1.1, Z - 12.6 + i * 0.7, PI / 2, 0.18); }
    { const x = X + 27, z = Z - 14; w.add('x', rbox(1.6, 2.2, 1.0, 0.1), 0x94a3b8, x - 0.1, 1.1, z); w.add('l', rbox(1.0, 0.6, 0.04, 0.02), 0xff7a1a, x - 0.62, 1.0, z, 0, PI / 2, 0, 1, 1, 1, 0.5); w.solid(x - 0.9, 0, z - 0.5, x + 0.7, 2.2, z + 0.5); }
    table2(w, X + 17, Z - 13, 0xfde68a, 0xf472b6); table2(w, X + 17, Z - 7, 0xfde68a, 0xf472b6); K.potPlant(w, X + 15, 0, Z - 15, 0.9, 0xf472b6); txt(w, 'FRESH PUP-TARTS', X + 21, 3.0, Z - 15.6, 0, 0.22, 0xbe185d); pendant(w, X + 21, Z - 10, 0xf472b6, 3.5);
    SPOTS.baker = [X + 24.6, Z - 10]; SPOTS.treat = [X + 21.6, Z - 10]; w.lights.push({ x: X + 21, y: 3, z: Z - 10, c: 0xfff1f8, i: 12, d: 14 }); }
  // cottages
  [[X - 30, Z - 10, 's'], [X - 30, Z + 12, 'n'], [X - 12, Z + 30, 'e'], [X + 18, Z + 30, 'w'], [X - 46, Z - 32, 'e']].forEach(([x, z, d], i) => cottage(w, 'pupH' + i, ['Biscuit\'s House', 'Fetch Cottage', 'The Kennel Inn', 'Wagstaff Home', 'Barkley Cabin'][i], x, z, 9, 7, d, Object.assign({}, PUP, { wall: [0xfde68a, 0xbfdbfe, 0xbbf7d0, 0xfecaca, 0xe9d5ff][i], roof: [0xdc2626, 0x2563eb, 0x16a34a, 0xea580c, 0x7c3aed][i] })));
  // dog park with agility gear
  { const x = X - 40, z = Z + 40; K.fenceRun(w, 'x', z - 12, x - 14, x + 14, 1.2, 0xffffff); K.fenceRun(w, 'z', x - 14, z - 12, z + 12, 1.2, 0xffffff); K.fenceRun(w, 'z', x + 14, z - 12, z + 12, 1.2, 0xffffff);
    for (let i = 0; i < 6; i++) w.add('g', rcyl(0.06, 1.0, 0.02, 8), i % 2 ? 0xef4444 : 0xffffff, x - 6 + i * 1.6, 0, z - 4); w.add('g', torus(0.12, 24), 0xfacc15, x + 5, 1.4, z, 0, PI / 2, 0, 1.0, 1.0, 1.0); w.add('x', cyl(8), 0x94a3b8, x + 5, 0, z, 0, 0, 0, 0.06, 0.5, 0.06);
    w.add('g', tube([[x - 4, 0.6, z + 5], [x, 1.1, z + 5.4], [x + 4, 0.6, z + 5]], 0.7, 16, 12), 0x3ff0ff, 0, 0, 0); w.add('g', rbox(4, 0.15, 1.2, 0.05), 0xfacc15, x + 2, 0.7, z - 8, 0, 0, 0.25); SPOTS.dogpark = [x, z]; }
  // hydrants, benches, flowers, lamps, trees
  w.detail = true; [[X - 20, Z + 20], [X + 20, Z + 20], [X - 20, Z - 20], [X + 34, Z - 4]].forEach(([x, z]) => { w.add('g', rcyl(0.3, 0.8, 0.08, 16), 0xef4444, x, 0, z); w.add('g', sph(12), 0xef4444, x, 0.85, z, 0, 0, 0, 0.3); w.add('g', cyl(8), 0xfacc15, x, 0.5, z, 0, 0, PI / 2, 0.12, 0.8, 0.12); w.solid(x - 0.3, 0, z - 0.3, x + 0.3, 1.1, z + 0.3); });
  [[X - 10, Z + 14], [X + 10, Z + 14], [X - 10, Z - 14], [X + 10, Z - 14]].forEach(([x, z]) => K.bench(w, x, z, z > Z ? PI : 0, 0xdc2626)); [[X - 18, Z - 8], [X + 8, Z + 18]].forEach(([x, z]) => K.flowerBed(w, x, z, x + 6, z + 2));
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + 0.2; K.lampPost(w, X + Math.cos(a) * 24, Z + Math.sin(a) * 24); }
  for (let i = 0; i < 22; i++) { const a = i / 22 * PI * 2, r = 64 + (i % 3) * 5; roundTree(w, X + Math.cos(a) * r, Z + Math.sin(a) * r, 1 + (i % 3) * 0.2); } w.detail = false;
  // plaza: bone fountain
  { const x = X, z = Z; w.add('g', rcyl(5, 0.7, 0.2, 40), 0xe7e5e4, x, 0, z); w.add('e', rcyl(4.5, 0.55, 0.1, 40), 0x67e8f9, x, 0.12, z); bone(w, 'g', 0xfde68a, x, 2.4, z, 0.6, 1.3); w.add('g', cyl(16), 0xd6d3d1, x, 0.6, z, 0, 0, 0, 0.3, 1.4, 0.3); w.solid(x - 4.4, 0, z - 4.4, x + 4.4, 0.7, z + 4.4); }
}
export function paperStackA(w, x, y, z) { for (let i = 0; i < 6; i++) w.add('m', rbox(0.42, 0.03, 0.3, 0.008), i % 3 ? 0xffffff : 0xfef3c7, x, y + 0.015 + i * 0.032, z, 0, i * 0.15, 0); }
// ---------------- Torty Town ----------------
const TORT = { wall: 0xccfbf1, trim: 0xfef3c7, roof: 0x8b5e34, roof2: 0xd1a05e, ac: 0x14b8a6, ac2: 0xccfbf1, fc1: 0xb7773f, art: 0xa7f3d0, dome: true, extra: (w, b) => { const cx = (b.x0 + b.x1) / 2; for (let i = 0; i < 3; i++) w.add('m', sph(10), 0x4ade80, cx - 0.8 + i * 0.5, 0.15, b.z1 - 0.9, 0, 0, 0, 0.25, 0.15, 0.22); w.add('g', rcyl(0.5, 0.1, 0.03, 20), 0x14b8a6, cx - 0.3, 0, b.z1 - 0.9); } };
function buildTort(w) { const t = TOWNS.tort, X = t.x, Z = t.z; w.region = 'out';
  K.floor(w, X - 20, Z - 20, X + 20, Z + 20, 'tile', 0.02, 0xd1fae5, 0xbbf0d8, 3); K.floor(w, X - 3, Z + 20, X + 3, Z + 70, 'tile', 0.02, 0xe7d3b3, 0xdcc49e, 2); K.floor(w, X - 66, Z - 3, X - 20, Z + 3, 'tile', 0.02, 0xe7d3b3, 0xdcc49e, 2);
  pad(w, 'tort', X - 30, Z + 26, 0, 0x14b8a6, 'Torty Town Pad', 'tort');
  // landmark: the giant Torty statue in the plaza
  { const x = X, z = Z; w.add('g', rcyl(5.5, 1.4, 0.2, 40), 0xe7e5e4, x, 0, z); w.solid(x - 5, 0, z - 5, x + 5, 1.4, z + 5); const T = w.tf(x, 1.4, z, 0.6);
    w.addFn('g', sph(32), (c, px, py, pz) => { const u = Math.atan2(pz - z, px - x) * 3, v = py * 1.2; c.set(((Math.floor(u) + Math.floor(v)) & 1) ? 0xb98545 : 0xd1a05e); }, x, 3.0, z, 0, 0.6, 0, 3.6, 2.6, 4.2); T.add('g', sph(24), 0x9ca86b, 0, 1.8, 4.4, 0, 0, 0, 1.1, 1.0, 1.3); [-1, 1].forEach((s) => { T.add('g', sph(10), 0x111827, s * 0.5, 2.3, 5.4, 0, 0, 0, 0.18); [-1, 1].forEach((f) => T.add('g', capsule(10), 0x9ca86b, s * 2.8, 0.4, f * 2.6, 0, 0, 0, 0.9, 1.0, 0.9)); });
    w.solid(x - 3.6, 1.4, z - 4.4, x + 3.6, 5.5, z + 4.4); txt(w, 'OUR FOUNDER: TORTY', x, 0.5, z + 5.55, 0, 0.32, 0x0f766e); TOURS.push({ id: 'statue', name: 'The Great Torty Statue', x, z, y: 8, town: 'tort' }); }
  // SHELL MUSEUM (observatory dome) - Torty is the curator
  { const b = shell(w, { id: 'museum', name: 'Shell Dome Museum', x0: X + 18, z0: Z - 44, x1: X + 42, z1: Z - 24, h: 5.5, wall: 0xfef3c7, trim: 0x0f766e, roof: 0x8b5e34, floor: 'marble', fc1: 0xd6c7ae, fc2: 0xc2b08f, doors: [{ side: 's', at: X + 30, w: 3 }], win: { s: 2, n: 2, e: 2, w: 2 }, flat: true });
    shellDome(w, b, 0x8b5e34, 0xd1a05e); w.region = 'roof_museum'; w.add('x', cyl(16), 0x94a3b8, X + 34, 11, Z - 34, 0, 0, -0.6, 0.7, 5, 0.7); TOURS.push({ id: 'dome', name: 'Shell Dome Observatory', x: X + 30, z: Z - 34, y: 16, town: 'tort' });
    w.region = 'out'; onSide(w, b, 's', () => txt(w, 'SHELL MUSEUM', X + 30, 4.4, Z - 23.7, 0, 0.5, 0x0f766e));
    w.region = 'in_museum';
    for (let i = 0; i < 5; i++) { const x = X + 21 + i * 4.5, z = Z - 41; w.add('g', rcyl(0.8, 1.0, 0.1, 24), 0xffffff, x, 0, z); w.addFn('g', sph(20), (c, px, py, pz) => c.set(Math.floor((px - x) * 4 + (pz - z) * 3) & 1 ? [0xb98545, 0xc4b5fd, 0x5eead4, 0xf472b6, 0xfacc15][i] : 0xfef3c7), x, 1.4, z, 0, 0, 0, 0.7, 0.45, 0.8); w.add('e', rbox(1.4, 1.2, 1.4, 0.05), 0xdff6ff, x, 1.6, z); w.solid(x - 0.8, 0, z - 0.8, x + 0.8, 2.2, z + 0.8); }
    { const x = X + 22, z = Z - 30; w.add('x', rbox(0.3, 4.5, 0.3, 0.05), 0xfacc15, x, 2.25, z); w.add('g', rbox(1.2, 0.3, 1.2, 0.05), 0x475569, x, 4.4, z + 0.7); w.add('f', rcyl(1.2, 0.4, 0.15, 24), 0x60a5fa, x, 0, z + 0.7); txt(w, 'DROP TEST: PASSED', x, 4.9, z + 0.7, 0, 0.18, 0x0f766e); w.solid(x - 1.2, 0, z - 0.3, x + 1.2, 4.6, z + 1.9); }
    K.whiteboard(w, 'z', X + 41.75, Z - 34, 1.2, 4, -1); K.potPlant(w, X + 19, 0, Z - 25, 1.2, 0x14b8a6); K.potPlant(w, X + 41, 0, Z - 25, 1.2, 0x14b8a6); K.rug(w, X + 30, Z - 30, 0, 8, 4, 0x14b8a6, 0xfef3c7);
    pendant(w, X + 25, Z - 34, 0x5eead4, 4.8); pendant(w, X + 35, Z - 34, 0x5eead4, 4.8); SPOTS.torty = [X + 30, Z - 33]; SPOTS.stamp_tort = [X + 36, Z - 27]; STAMPS.push({ id: 'tort', name: 'Shell Museum', at: SPOTS.stamp_tort }); w.lights.push({ x: X + 30, y: 4, z: Z - 34, c: 0xf0fff8, i: 13, d: 18 }); }
  // GADGET SHOP (Luna, visiting from Ratita Industries)
  { const b = shell(w, { id: 'gadget', name: 'Ratita Gadget Shop', x0: X - 40, z0: Z - 36, x1: X - 24, z1: Z - 22, h: 4.4, wall: 0xff8fcb, trim: 0xffd23f, roof: 0x9d174d, floor: 'tile', fc1: 0xfbcfe8, fc2: 0xf9a8d4, doors: [{ side: 's', at: X - 32, w: 2.4 }], win: { s: 2, n: 2, e: 2, w: 2 }, flat: true });
    gable(w, b, 0x9d174d, 'x'); w.region = 'out'; onSide(w, b, 's', () => txt(w, 'RATITA GADGETS', X - 32, 3.5, Z - 21.7, 0, 0.36, 0xffffff));
    w.region = 'in_gadget'; { const T = w.tf(X - 32, 0, Z - 33.5, 0); T.slab('g', 0xffd23f, 0, 0, 0, 5, 1.05, 1.0, 0.12); T.box('g', 0xff4fa0, 0, 1.05, 0, 5.2, 0.08, 1.1, 0.04); } for (let i = 0; i < 4; i++) w.add('l', rcyl(0.22, 0.08, 0.02, 20), [0x3ff0ff, 0xff4fa0, 0xffd23f, 0x4ade80][i], X - 33.5 + i, 1.15, Z - 33.5, 0, 0, 0, 1, 1, 1, 0.5);
    K.shelf(w, X - 39.4, Z - 29, PI / 2, 4, 2.2, 0.6, 0xa0703f); for (let i = 0; i < 6; i++) K.beaker(w, X - 39.3, 1.0 + (i % 2) * 0.75, Z - 30.6 + i * 0.6); K.serverRack(w, X - 25, Z - 34.5, -PI / 2, []); K.robotArm(w, X - 26, Z - 25); K.cheeseRack(w, X - 38.5, Z - 23.5, 0, 2);
    pendant(w, X - 32, Z - 29, 0xff8fcb, 3.9); SPOTS.luna = [X - 32, Z - 34.2]; w.lights.push({ x: X - 32, y: 3, z: Z - 29, c: 0xffe1f2, i: 12, d: 14 }); }
  [[X - 34, Z - 6, 'e'], [X - 34, Z + 12, 'e'], [X + 32, Z - 4, 'w'], [X + 32, Z + 14, 'w'], [X - 14, Z + 34, 'e']].forEach(([x, z, d], i) => cottage(w, 'tortH' + i, ['Shellby Home', 'Slowpoke Cottage', 'The Lettuce Patch', 'Pebble Place', 'Hatchling House'][i], x, z, 9, 8, d, Object.assign({}, TORT, { roof: [0x8b5e34, 0x65a30d, 0xb45309, 0x7c2d12, 0x15803d][i], roof2: [0xd1a05e, 0xa3e635, 0xfbbf24, 0xc2410c, 0x86efac][i] })));
  w.detail = true; for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; K.lampPost(w, X + Math.cos(a) * 22, Z + Math.sin(a) * 22); }
  for (let gx = 0; gx < 3; gx++) for (let r = 0; r < 4; r++) w.add('m', sph(10), 0x4ade80, X + 40 + gx * 2, 0.3, Z + 30 + r * 1.6, 0, 0, 0, 0.6, 0.4, 0.55); K.fenceRun(w, 'x', Z + 28, X + 38, X + 46, 0.8, 0xfef3c7);
  for (let i = 0; i < 20; i++) { const a = i / 20 * PI * 2 + 0.1, r = 62 + (i % 3) * 6; roundTree(w, X + Math.cos(a) * r, Z + Math.sin(a) * r, 1 + (i % 2) * 0.3, 0, i % 4 ? null : 0xf9a8d4); }
  [[X - 12, Z + 15], [X + 12, Z + 15]].forEach(([x, z]) => K.bench(w, x, z, PI, 0x14b8a6)); for (let i = 0; i < 6; i++) K.rock(w, X - 52 + i * 3, Z + 44 + (i % 2) * 2, 0.8 + (i % 3) * 0.3); w.detail = false;
}
// ---------------- North Pole Village ----------------
const NPH = { wall: 0xfef2f2, trim: 0xdc2626, roof: 0x166534, ac: 0xdc2626, ac2: 0xbbf7d0, fc1: 0xa0703f, art: 0xfecaca, snow: true, chim: true, extra: (w, b) => { const cx = (b.x0 + b.x1) / 2; w.add('m', rbox(1.6, 1.2, 0.6, 0.05), 0x78716c, cx + 1.5, 0.6, b.z0 + 0.5); w.add('l', rbox(0.9, 0.5, 0.05, 0.02), 0xff7a1a, cx + 1.5, 0.5, b.z0 + 0.82, 0, 0, 0, 1, 1, 1, 0.6); for (let i = 0; i < 3; i++) w.add('g', rbox(0.4, 0.4, 0.4, 0.04), pick([0xef4444, 0x22c55e, 0x60a5fa]), cx - 1.6 + i * 0.5, 0.2, b.z0 + 1.0); } };
function buildNP(w) { const t = TOWNS.np, X = t.x, Z = t.z; w.region = 'out';
  K.floor(w, X - 18, Z - 18, X + 18, Z + 18, 'tile', 0.02, 0xf1f5f9, 0xe2e8f0, 3);
  pad(w, 'np', X + 30, Z - 30, 0, 0xef4444, 'North Pole Pad', 'np');
  // landmark: giant candy cane pole
  { const x = X, z = Z; w.addFn('g', cyl(24), (c, px, py, pz) => c.set(Math.floor(py * 0.9 + Math.atan2(pz - z, px - x) * 0.6) & 1 ? 0xef4444 : 0xffffff), x, 0, z, 0, 0, 0, 0.9, 16, 0.9); w.add('l', sph(24), 0xffd23f, x, 17, z, 0, 0, 0, 1.6, 1.6, 1.6, 0.6); w.add('g', rcyl(3, 0.6, 0.2, 32), 0xffffff, x, 0, z); w.solid(x - 1, 0, z - 1, x + 1, 18, z + 1); w.solid(x - 3, 0, z - 3, x + 3, 0.6, z + 3);
    TOURS.push({ id: 'pole', name: 'The Candy Cane Pole', x, z, y: 18, town: 'np' }); }
  // TOY WORKSHOP
  { const b = shell(w, { id: 'workshop', name: 'Toy Workshop', x0: X - 44, z0: Z + 10, x1: X - 20, z1: Z + 32, h: 5.5, wall: 0xdc2626, trim: 0xffffff, roof: 0x166534, floor: 'wood', fc1: 0xb7773f, doors: [{ side: 'e', at: Z + 21, w: 3 }], win: { s: 2, n: 2, e: 2, w: 2 }, flat: true });
    gable(w, b, 0x166534, 'z', true); TOURS.push({ id: 'workshop', name: 'The Toy Workshop', x: X - 32, z: Z + 21, y: 12, town: 'np' });
    w.region = 'out'; onSide(w, b, 'e', () => { txt(w, 'TOY WORKSHOP', X - 19.65, 4.5, Z + 21, PI / 2, 0.42, 0xffffff); w.add('f', torus(0.3, 24), 0x16a34a, X - 19.6, 3.4, Z + 17, 0, PI / 2, 0, 0.8, 0.8, 0.8); });
    w.region = 'in_workshop'; K.conveyor(w, X - 32, Z + 13, 0, 9); for (let i = 0; i < 8; i++) w.add('g', rbox(0.6, 0.5, 0.6, 0.06), pick([0xef4444, 0x22c55e, 0x60a5fa, 0xfacc15, 0xa78bfa]), X - 35.5 + i * 1.0, 0.98, Z + 13);
    for (let i = 0; i < 3; i++) K.labBench(w, X - 40 + i * 5, Z + 26, 0, 3, { top: 0xa0703f }); for (let i = 0; i < 9; i++) w.add('g', sph(12), pick([0xef4444, 0x22c55e, 0x60a5fa, 0xfacc15]), X - 41 + i * 1.6, 1.15, Z + 26.2, 0, 0, 0, 0.18);
    // toy piles: teddies, blocks, a rocking horse
    for (let i = 0; i < 6; i++) { const x = X - 42.5 + (i % 3) * 0.9, z = Z + 18 + (i / 3 | 0) * 0.9; w.add('g', rbox(0.7, 0.7, 0.7, 0.08), pick([0xef4444, 0x22c55e, 0x60a5fa, 0xfacc15]), x, 0.35 + (i / 3 | 0) * 0, z); } w.solid(X - 43, 0, Z + 17.5, X - 40.4, 0.8, Z + 19.4);
    { const x = X - 25, z = Z + 28; w.add('f', sph(16), 0xc08552, x, 0.7, z, 0, 0, 0, 0.55, 0.65, 0.5); w.add('f', sph(16), 0xc08552, x, 1.5, z, 0, 0, 0, 0.4); [-1, 1].forEach((s) => w.add('f', sph(10), 0xc08552, x + s * 0.3, 1.85, z, 0, 0, 0, 0.14)); w.solid(x - 0.6, 0, z - 0.6, x + 0.6, 1.9, z + 0.6); }
    w.add('m', rbox(3, 0.9, 1.2, 0.08), 0xfef3c7, X - 26, 0.45, Z + 14.5); for (let i = 0; i < 4; i++) w.add('g', rbox(0.5, 0.4, 0.5, 0.04), [0xef4444, 0x22c55e, 0xfacc15, 0x60a5fa][i], X - 27 + i * 0.6, 1.1, Z + 14.5); w.solid(X - 27.5, 0, Z + 13.9, X - 24.5, 0.9, Z + 15.1);
    txt(w, 'MADE WITH LOVE', X - 32, 4.6, Z + 31.6, PI, 0.32, 0xffd23f); pendant(w, X - 36, Z + 21, 0xef4444, 4.8); pendant(w, X - 28, Z + 21, 0x22c55e, 4.8);
    SPOTS.wrap = [X - 26, Z + 16.2]; SPOTS.elf = [X - 30, Z + 24.4]; SPOTS.stamp_np = [X - 22, Z + 26]; STAMPS.push({ id: 'np', name: 'Toy Workshop', at: SPOTS.stamp_np }); w.lights.push({ x: X - 32, y: 4, z: Z + 21, c: 0xfff1dc, i: 13, d: 18 }); }
  // COCOA CABIN
  { const b = shell(w, { id: 'cocoa', name: 'Cocoa Cabin', x0: X + 20, z0: Z + 8, x1: X + 34, z1: Z + 20, h: 4, wall: 0x92400e, trim: 0xfef3c7, roof: 0x7f1d1d, floor: 'wood', fc1: 0xc8874a, doors: [{ side: 'w', at: Z + 14, w: 2.2 }], win: { s: 2, n: 2, e: 1, w: 1 }, flat: true });
    gable(w, b, 0x7f1d1d, 'x', true); w.region = 'roof_cocoa'; w.add('m', rbox(0.8, 1.8, 0.8, 0.06), 0x78716c, X + 30, 6, Z + 12); w.region = 'out'; onSide(w, b, 'w', () => txt(w, 'COCOA', X + 19.65, 3.2, Z + 14, -PI / 2, 0.4, 0xfef3c7));
    w.region = 'in_cocoa'; { const T = w.tf(X + 31.5, 0, Z + 14, PI / 2); T.slab('g', 0x7c3f2c, 0, 0, 0, 5, 1.0, 1.0, 0.1); T.box('g', 0xfef3c7, 0, 1.0, 0, 5.2, 0.08, 1.1, 0.04); } for (let i = 0; i < 5; i++) { w.add('g', lathe([[0, 0], [0.1, 0], [0.11, 0.2], [0, 0.2]], 14, 'mug'), pick([0xef4444, 0xffffff, 0x22c55e]), X + 31.5, 1.08, Z + 12 + i * 0.8); w.add('g', sph(8), 0xffffff, X + 31.5, 1.3, Z + 12 + i * 0.8, 0, 0, 0, 0.06); }
    { const x = X + 33.2, z = Z + 9.2; w.add('m', rbox(1.8, 1.6, 0.8, 0.06), 0x78716c, x - 0.6, 0.8, z); w.add('l', rbox(1.0, 0.6, 0.05, 0.02), 0xff7a1a, x - 0.6, 0.55, z + 0.42, 0, 0, 0, 1, 1, 1, 0.7); w.solid(x - 1.5, 0, z - 0.4, x + 0.3, 1.6, z + 0.4); }
    table2(w, X + 23.5, Z + 11.5, 0xfef3c7, 0xdc2626); table2(w, X + 23.5, Z + 17, 0xfef3c7, 0x22c55e); pendant(w, X + 27, Z + 14, 0xef4444, 3.5); SPOTS.cocoa = [X + 29.8, Z + 14]; SPOTS.marsh = [X + 31.6, Z + 15]; w.lights.push({ x: X + 27, y: 3, z: Z + 14, c: 0xffe4c4, i: 12, d: 14 }); }
  [[X + 26, Z - 4, 'w'], [X - 32, Z - 6, 'e'], [X - 12, Z - 34, 'n'], [X + 8, Z + 36, 's']].forEach(([x, z, d], i) => cottage(w, 'npH' + i, ['Jingle Cottage', 'Frosty Lodge', 'Peppermint House', 'Snowdrop Cabin'][i], x, z, 9, 7, d, Object.assign({}, NPH, { wall: [0xfef2f2, 0xdbeafe, 0xfee2e2, 0xecfccb][i], roof: [0x166534, 0xdc2626, 0x1d4ed8, 0x7c3aed][i] })));
  w.detail = true; [[X - 12, Z - 12], [X + 12, Z + 12], [X - 12, Z + 12]].forEach(([x, z], i) => snowman(w, x, z, 0.9 + i * 0.1));
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + 0.3, x = X + Math.cos(a) * 20, z = Z + Math.sin(a) * 20; K.lampPost(w, x, z); w.add('f', torus(0.3, 20), 0x16a34a, x, 2.8, z, PI / 2, 0, 0, 0.4, 0.4, 0.4); }
  for (let i = 0; i < 30; i++) { const a = i / 30 * PI * 2, r = 56 + (i % 4) * 6; pine(w, X + Math.cos(a) * r, Z + Math.sin(a) * r, 1.1 + (i % 3) * 0.25, true); }
  // sleigh
  { const x = X + 10, z = Z - 16; w.add('g', rbox(3.2, 1.2, 1.6, 0.3), 0xdc2626, x, 0.9, z); w.add('x', tube([[x - 2, 0.1, z - 0.7], [x + 1.6, 0.1, z - 0.7], [x + 2.2, 0.8, z - 0.7]], 0.08, 8, 6), 0xfacc15, 0, 0, 0); w.add('x', tube([[x - 2, 0.1, z + 0.7], [x + 1.6, 0.1, z + 0.7], [x + 2.2, 0.8, z + 0.7]], 0.08, 8, 6), 0xfacc15, 0, 0, 0); for (let i = 0; i < 3; i++) w.add('g', rbox(0.6, 0.6, 0.6, 0.05), pick([0x22c55e, 0x60a5fa, 0xfacc15]), x - 0.8 + i * 0.6, 1.8, z); w.solid(x - 1.8, 0, z - 0.9, x + 2, 1.6, z + 0.9); } w.detail = false;
}
// ---------------- countryside: lake, lighthouse, Pi-rat's ship, mesa, peaks, clouds, balloons ----------------
function buildCountry(w) { w.region = 'out';
  // water: one big flat sheet (the terrain dips under it for the lake and the pond)
  // island + rescue
  { const x = ISLAND.x, z = ISLAND.z; w.oy = Hf(x, z); roundTree(w, x - 4, z - 3, 0.9, Hf(x - 4, z - 3)); w.oy = 0; RESCUES.push({ id: 'pebble', name: 'Pebble', kind: 'hatch', x: x + 2, z: z + 2, y: Hf(x + 2, z + 2), home: 'tort', where: 'stuck on Turtle Island' }); }
  // lighthouse on the west shore
  { const x = LAKE.x - 70, z = LAKE.z - 34, y = Hf(x, z); w.oy = y; w.addFn('g', cyl(24, 0.7), (c, px, py) => c.set(Math.floor((py - y) / 2.4) & 1 ? 0xef4444 : 0xffffff), x, 0, z, 0, 0, 0, 2.4, 16, 2.4); w.add('e', cyl(16), 0xfff3c4, x, 16, z, 0, 0, 0, 1.4, 2, 1.4); w.add('l', sph(14), 0xffe14d, x, 17, z, 0, 0, 0, 0.8, 0.8, 0.8, 1.2); w.add('g', cone(16), 0x1f2937, x, 18, z, 0, 0, 0, 1.8, 2, 1.8); w.add('g', rcyl(2.2, 0.2, 0.05, 20), 0x1f2937, x, 15.9, z); w.solid(x - 2.4, 0, z - 2.4, x + 2.4, 20, z + 2.4); w.oy = 0; TOURS.push({ id: 'lighthouse', name: 'Lakeside Lighthouse', x, z, y: y + 20, town: 'tort' }); }
  // Pi-rat's pirate ship (land on the deck pad; walk the deck)
  { const x = LAKE.x + 10, z = LAKE.z + 30, y = WATER_Y; w.oy = y; const T = w.tf(x, 0, z, 0);
    w.addFn('g', capsule(24), (c, px, py) => c.set(py - y > 2.2 ? 0x7c2d12 : 0x92400e), x, 1.6, z, PI / 2, 0, 0, 7, 16, 4.2); T.slab('m', 0xb45309, 0, 2.8, 0, 6.4, 0.2, 17, 0.1); T.slab('m', 0x7c2d12, 0, 3.0, -8.2, 6.0, 0.9, 0.3, 0.05); T.slab('m', 0x7c2d12, 0, 3.0, 8.2, 6.0, 0.9, 0.3, 0.05); [-1, 1].forEach((s) => T.slab('m', 0x7c2d12, s * 3.2, 3.0, 0, 0.3, 0.9, 16.4, 0.05));
    T.add('m', cyl(12), 0x7c4a1e, 0, 3, -4, 0, 0, 0, 0.3, 12, 0.3); T.add('f', rbox(7, 5, 0.12, 0.05), 0xf5f5f4, 0, 9, -4, 0, 0, 0); T.add('g', sph(14), 0x111827, 0, 9.4, -3.9, 0, 0, 0, 0.9, 0.9, 0.2); [-1, 1].forEach((s) => T.add('g', rbox(0.25, 0.8, 0.1, 0.03), 0xffffff, s * 0.5, 8.2, -3.88, 0, 0, s * 0.6)); T.add('f', rbox(1.6, 1.0, 0.04, 0.02), 0x111827, 0.8, 15.3, -4);
    for (let i = 0; i < 3; i++) [-1, 1].forEach((s) => T.add('x', cyl(10), 0x1f2937, s * 3.3, 3.6, -4 + i * 3, 0, 0, s * PI / 2, 0.25, 0.8, 0.25)); w.add('g', rcyl(2.4, 0.08, 0.03, 28), 0xffd23f, x, y + 2.95, z + 4.4); txt(w, 'X', x, y + 3.05, z + 4.8, 0, 0.9, 0xdc2626, 'l', 0.2);
    w.solid(x - 3.2, y - 2, z - 8.4, x + 3.2, y + 2.9, z + 8.4, { floor: true }); w.solid(x - 0.4, y + 3, z - 4.4, x + 0.4, y + 15, z - 3.6); w.oy = 0;
    PADS.push({ id: 'ship', x, z: z + 4.4, y: y + 2.9, col: 0xffd23f, name: "Pi-rat's Ship Deck", town: 'ship', walk: true, small: true }); ZONES.push({ rect: [x - 2.9, z - 7.9, x + 2.9, z + 7.9], town: 'ship', y: y + 2.9 });
    SPOTS.pirat = [x, z - 1.5, y + 2.9]; SPOTS.stamp_ship = [x - 1.8, z + 7, y + 2.9]; STAMPS.push({ id: 'ship', name: "Pi-rat's Ship", at: SPOTS.stamp_ship }); TOURS.push({ id: 'ship', name: "Pi-rat's Pirate Ship", x, z, y: y + 16, town: 'lake' }); }
  // the mesa + Mittens
  { const x = 120, z = -330, y = 36; w.oy = y; w.add('g', rcyl(2.2, 0.2, 0.05, 20), 0xfacc15, x + 6, 0, z); w.oy = 0; RESCUES.push({ id: 'mittens', name: 'Mittens', kind: 'kitten', x: x - 3, z: z + 2, y, home: 'hub', where: 'up on Red Rock Mesa' }); }
  // mountain ledge + Frosty
  { const p = PLAT[0]; w.oy = p.y; pine(w, p.x - 6, p.z - 4, 0.9, true, p.y); w.oy = 0; RESCUES.push({ id: 'frosty', name: 'Frosty', kind: 'husky', x: p.x + 3, z: p.z, y: p.y, home: 'np', where: 'on a ledge on Snowcap Mountain' }); }
  // Snowcap summit flag (tour stop)
  { const x = -20, z = 470, y = Hf(x, z); w.oy = y - 1; w.add('x', cyl(8), 0x94a3b8, x, 0, z, 0, 0, 0, 0.12, 6, 0.12); w.add('f', rbox(2.6, 1.6, 0.06, 0.02), 0xff4fa0, x + 1.3, 5, z); w.add('l', sph(10), 0xffd23f, x, 6.1, z, 0, 0, 0, 0.25, 0.25, 0.25, 0.6); w.oy = 0; TOURS.push({ id: 'peak', name: 'Snowcap Peak', x, z, y: y + 6, town: 'np' }); }
  // pond + ice floe + Nibbles
  { const x = POND.x + 4, z = POND.z; w.add('g', rcyl(4, 0.5, 0.15, 24), 0xe0f2fe, x, WATER_Y - 0.3, z); w.solid(x - 3.6, -3, z - 3.6, x + 3.6, WATER_Y + 0.2, z + 3.6, { floor: true }); RESCUES.push({ id: 'nibbles', name: 'Nibbles', kind: 'cream', x, z, y: WATER_Y + 0.2, home: 'np', where: 'adrift on an ice floe in Frost Pond' }); }
  // forest clearing + Waffles
  { const cx = -360, cz = 40; w.detail = true; for (let i = 0; i < 40; i++) { const a = i * 2.39996, r = 16 + (i % 7) * 5; const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; pine(w, x, z, 1.2 + (i % 3) * 0.3, false, sinkY(x, z, 0.6)); } w.detail = false; RESCUES.push({ id: 'waffles', name: 'Waffles', kind: 'beagle', x: cx, z: cz, y: Hf(cx, cz), home: 'pup', where: 'lost in Whispering Woods' }); }
  // corn maze + Gouda
  { const cx = -110, cz = 80; for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) { if ((i === 4 && j > 2) || (j === 4 && i < 6) || (i > 3 && i < 6 && j > 3 && j < 6)) continue; const x = cx - 20 + i * 5, z = cz - 20 + j * 5, y = Hf(x, z); w.add('m', rbox(4.4, 2.6, 4.4, 0.4), 0xa3b84a, x, y + 1.2, z); w.add('m', rbox(4.6, 0.5, 4.6, 0.2), 0xfacc15, x, y + 2.6, z); w.solid(x - 2.2, y - 1, z - 2.2, x + 2.2, y + 2.8, z + 2.2); }
    RESCUES.push({ id: 'gouda', name: 'Gouda', kind: 'ginger', x: cx + 1, z: cz + 1, y: Hf(cx, cz), home: 'hub', where: 'lost in the Corn Maze' }); }
  // cheese windmill (Ratita farm)
  { const x = 80, z = -124, y = Hf(x, z); w.oy = y; /* moved off the runway approaches */ w.add('g', cyl(20, 0.6), 0xfde68a, x, 0, z, 0, 0, 0, 4, 14, 4); w.add('g', cone(20), 0xff8fcb, x, 14, z, 0, 0, 0, 3.4, 4, 3.4); for (let i = 0; i < 4; i++) w.add('m', rbox(1.6, 10, 0.2, 0.05), 0xffffff, x + Math.cos(i * PI / 2) * 5, 12 + Math.sin(i * PI / 2) * 5, z + 3, 0, 0, i * PI / 2 + PI / 2); w.add('g', sph(12), 0xff4fa0, x, 12, z + 3, 0, 0, 0, 0.8); for (let i = 0; i < 5; i++) w.add('g', sph(10), 0xfacc15, x + Math.cos(i * 1.3) * 2.9, 3 + i * 2, z + Math.sin(i * 1.3) * 2.9, 0, 0, 0, 0.45, 0.45, 0.2); w.solid(x - 3.4, 0, z - 3.4, x + 3.4, 17, z + 3.4); w.oy = 0; }
  // clouds you can fly through + hot air balloons
  for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 120 + (i * 37) % 360; cloud(w, Math.cos(a) * r, 110 + (i % 5) * 14, Math.sin(a) * r, 1 + (i % 3) * 0.4); }
  [[-150, 60, 30, 0xff4fa0, 0xffd23f], [140, 75, 120, 0x3ff0ff, 0xffffff], [-180, 85, 120, 0xa78bfa, 0x4ade80], [60, 70, -200, 0xff7a3d, 0xfef3c7]].forEach(([x, y, z, a, b]) => { balloon(w, x, y, z, a, b); w.solid(x - 4.2, y - 8, z - 4.2, x + 4.2, y + 5, z + 4.2); });
}
