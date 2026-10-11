// Grok Pup Town: Candy's hometown. Town square + fountain, ring road for the Dog-Bus, nine enterable buildings (each its own
// region so only rooms you can see are drawn), Paw Park, Candy's house + backyard, Lookout Hill and a leafy outer ring.
// Everything is real 3D: rounded boxes, lathes, tubes, extruded 3D lettering. No billboards.
import * as THREE from 'three';
import * as K from './kit.js';
import { interiors } from './interiors.js';
import { park } from './park.js';
const { wall, D, G, floor, ceiling, sign3d, rbox, rcyl, lathe, sph, cyl, cone, torus, capsule, tube, star, heart, blobGeo, pick, tree, bush, lampPost, bench, flowerBed, fenceRun, rock } = K;
const R = K.R, PI = Math.PI; let I = null;
export const FL = 0.02; // building floor level
export const REGIONS = [
  { id: 'hall', x0: -9, x1: 9, z0: -42, z1: -26, y0: -1, y1: 7, ceil: 6.2, name: '🏛️ Town Hall' },
  { id: 'library', x0: -32, x1: -18, z0: -40, z1: -27, y0: -1, y1: 6, ceil: 4.8, name: '📚 Pawsome Library' },
  { id: 'barkade', x0: 18, x1: 32, z0: -40, z1: -27, y0: -1, y1: 6, ceil: 4.8, name: '🕹️ The Barkade' },
  { id: 'bakery', x0: -40, x1: -27, z0: -14, z1: 0, y0: -1, y1: 6, ceil: 4.6, name: '🥐 Bone Appétit Bakery' },
  { id: 'groomer', x0: -40, x1: -27, z0: 6, z1: 20, y0: -1, y1: 6, ceil: 4.6, name: '🛁 Fluff & Puff Groomers' },
  { id: 'fire', x0: 27, x1: 41, z0: -14, z1: 0, y0: -1, y1: 7, ceil: 5.6, name: '🚒 Pup Fire Station' },
  { id: 'garden', x0: 27, x1: 40, z0: 6, z1: 20, y0: -1, y1: 7, ceil: 5.2, name: "🌻 Martina's Garden Shop" },
  { id: 'candy', x0: -40, x1: -28, z0: 30, z1: 42, y0: -1, y1: 6, ceil: 4.4, name: "🏠 Candy's House" },
];
// which outdoor-ish areas get a name chip
export const AREAS = [
  { x0: -16, x1: 16, z0: -16, z1: 16, name: '⛲ Town Square' }, { x0: -24, x1: 24, z0: 26, z1: 68, name: '🌳 Paw Park' },
  { x0: -46, x1: -26, z0: 42, z1: 56, name: "🦴 Candy's Backyard" }, { x0: -14, x1: 14, z0: -66, z1: -44, name: '🔭 Lookout Hill' },
  { x0: 41, x1: 48, z0: -26, z1: -4, name: '🚒 Lookout Tower' },
];
export function regionAt(x, y, z) { for (const r of REGIONS) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1 && y >= r.y0 && y <= r.y1) return r.id; return 'out'; }
export function areaName(x, z) { for (const a of AREAS) if (x >= a.x0 && x <= a.x1 && z >= a.z0 && z <= a.z1) return a.name; return '🐾 Pup Town'; }
// doors: where each building opens (used for vis + the map)
export const DOORS = { hall: [0, -26], library: [-25, -27], barkade: [25, -27], bakery: [-27, -7], groomer: [-27, 13], fire: [27, -7], garden: [27, 13], candy: [-34, 30] };
// ------------------------------------------------------------------------------------------------ helpers
const shade = (c, k) => { const C = new THREE.Color(c); C.multiplyScalar(k); return C.getHex(); };
const prismCache = new Map();
function prism(W, H, L) { const k = [W, H, L].map((v) => v.toFixed(2)).join(','); let g = prismCache.get(k); if (g) return g; const s = new THREE.Shape(); s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(0, H); s.lineTo(-W / 2, 0);
  g = new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: false }); g.translate(0, 0, -L / 2); prismCache.set(k, g); return g; }
// gable roof over a footprint: wall-coloured gable prism + two thick rounded roof slabs + shingle ribs + ridge cap
export function gable(w, x0, z0, x1, z1, y, col, wallCol, o = {}) { const alongX = o.alongX != null ? o.alongX : (x1 - x0) >= (z1 - z0); const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const L = (alongX ? x1 - x0 : z1 - z0) + 0.5, W = (alongX ? z1 - z0 : x1 - x0) + 0.5, H = o.h || W * 0.38; const ry = alongX ? PI / 2 : 0;
  w.add('m', prism(W, H, L), wallCol, cx, y, cz, 0, ry, 0); const a = Math.atan2(H, W / 2), sl = Math.hypot(W / 2, H) + 0.8, ov = L + 1.2;
  [-1, 1].forEach((s) => { const T = w.tf(cx, y, cz, ry); const mx = s * (W / 4 + Math.cos(a) * 0.0), my = H / 2;
    T.add('g', rbox(sl, 0.28, ov, 0.1), col, s * (W / 4 + 0.12 * Math.sin(a)), my + 0.12 * Math.cos(a), 0, 0, 0, -s * a);
    for (let i = 1; i < 5; i++) { const f = i / 5, px = s * (W / 2 + 0.35) * (1 - f), py = H * f - 0.2; T.add('g', rbox(0.5, 0.1, ov + 0.02, 0.04), shade(col, i % 2 ? 0.86 : 1.08), px + s * 0.08, py + 0.36, 0, 0, 0, -s * a); } });
  { const T = w.tf(cx, y, cz, ry); T.add('g', cyl(16), shade(col, 0.8), 0, H + 0.22, 0, PI / 2, 0, 0, 0.22, ov + 0.1, 0.22); }
  if (o.chimney) { const [chx, chz] = o.chimney; w.add('m', rbox(1.0, 2.4, 1.0, 0.08), 0xb4533a, chx, y + H * 0.55 + 0.9, chz); w.add('m', rbox(1.25, 0.25, 1.25, 0.06), 0x8a3b28, chx, y + H * 0.55 + 2.15, chz); }
  w.solid(x0 - 0.3, y, z0 - 0.3, x1 + 0.3, y + H * 0.5, z1 + 0.3, { cam: true, nofloor: false, roof: true }); }
// window slots along a wall span, skipping the door and corners
function winSlots(from, to, door, width = 2.0, step = 4) { const out = []; const n = Math.max(1, Math.floor((to - from - 2) / step)); for (let i = 0; i < n; i++) { const c = from + (to - from) * (i + 0.5) / n; if (door && c + width / 2 > door[0] - 0.9 && c - width / 2 < door[1] + 0.9) continue; out.push([c - width / 2, c + width / 2]); } return out; }
// a building: exterior walls (shell), interior lining (its region), floor, ceiling + lamps, windows with flower boxes, door
// frame, awning, 3D sign, step and welcome mat. B.door = { side: 's'|'n'|'e'|'w', a, b, h }
export function building(w, B) { const { x0, z0, x1, z1 } = B, ceil = B.ceil, eh = ceil + 0.4, reg = B.id; const winTop = B.winTop || 3.2, winBot = B.winBot || 1.1;
  w.region = 'shell';
  floor(w, x0 + 0.2, z0 + 0.2, x1 - 0.2, z1 - 0.2, B.floor[0], FL, B.floor[1], B.floor[2], B.floor[3]);
  ceiling(w, x0, z0, x1, z1, ceil, B.ceilCol || 0xfffaf2, { li: B.li || 24, lightCol: B.lightCol || 0xfff1dc, lamps: B.lamps !== false });
  const sides = { s: ['x', z1, x0, x1, 1], n: ['x', z0, x0, x1, -1], w: ['z', x0, z0, z1, -1], e: ['z', x1, z0, z1, 1] };
  for (const sd of ['s', 'n', 'e', 'w']) { const [ax, at, a, b, out] = sides[sd]; const door = B.door.side === sd ? [B.door.a, B.door.b] : null; const extra = (B.doors2 || []).filter((d) => d.side === sd);
    const holes = []; if (door) holes.push(D(door[0], door[1], B.door.h || 3.2)); extra.forEach((d) => holes.push(D(d.a, d.b, d.h || 3.0)));
    const wins = (B.noWin || '').includes(sd) ? [] : winSlots(a, b, door || (extra[0] ? [extra[0].a, extra[0].b] : null), B.winW || 2.0, B.winStep || 4); wins.forEach(([p, q]) => holes.push(G(p, q, winTop, winBot)));
    const ext = ax === 'x' ? [a - 0.25, b + 0.25] : [a, b];
    w.region = 'shell'; wall(w, ax, at, ext[0], ext[1], eh, B.ext, holes, { frame: B.frame || 0xffffff, trim: B.trim || 0xffffff, base: B.base || shade(B.ext, 0.75) });
    w.region = reg; const li = holes.map((h) => [h[0], h[1], h[2], h[3], h[4], 'noframe']); wall(w, ax, at - out * 0.31, a + 0.25, b - 0.25, ceil, B.int, li, { th: 0.12, noTrim: true, base: B.intBase || 0xffffff });
    // flower boxes + shutters under each window (outside), curtains inside
    wins.forEach(([p, q]) => { const c = (p + q) / 2, Wd = q - p; w.region = 'shell'; const T = ax === 'x' ? w.tf(c, 0, at + out * 0.3, out > 0 ? 0 : PI) : w.tf(at + out * 0.3, 0, c, out > 0 ? PI / 2 : -PI / 2);
      if (!B.noBoxes) { T.box('m', B.boxCol || 0x9a6a3e, 0, winBot - 0.32, 0.22, Wd + 0.2, 0.32, 0.42, 0.06); for (let k = 0; k < 7; k++) T.add('g', sph(8), pick([0xff5d8f, 0xffd23f, 0xff8a3d, 0xa66bff, 0xffffff]), -Wd / 2 + 0.1 + k * (Wd - 0.2) / 6, winBot + 0.04, 0.22 + (R() - 0.5) * 0.15, 0, 0, 0, 0.13, 0.11, 0.13);
        for (let k = 0; k < 5; k++) T.add('g', sph(8), 0x3fae5a, -Wd / 2 + 0.25 + k * (Wd - 0.5) / 4, winBot - 0.04, 0.24, 0, 0, 0, 0.16, 0.1, 0.12); }
      if (B.shutters) [-1, 1].forEach((s2) => T.box('m', B.shutters, s2 * (Wd / 2 + 0.36), winBot, 0.06, 0.55, winTop - winBot, 0.08, 0.04));
      w.region = reg; const Ti = ax === 'x' ? w.tf(c, 0, at - out * 0.4, out > 0 ? PI : 0) : w.tf(at - out * 0.4, 0, c, out > 0 ? -PI / 2 : PI / 2);
      if (B.curtain) { [-1, 1].forEach((s2) => Ti.box('f', B.curtain, s2 * (Wd / 2 + 0.05), winBot - 0.2, 0.02, 0.45, winTop - winBot + 0.5, 0.08, 0.04)); Ti.box('x', 0xd4a017, 0, winTop + 0.3, 0.04, Wd + 1.2, 0.06, 0.06, 0.03); } }); }
  // door: frame already from wall(); add step, mat, awning, sign, wall lamps
  { const d = B.door, [ax, at, , , out] = sides[d.side], c = (d.a + d.b) / 2, Wd = d.b - d.a; w.region = 'shell';
    const T = ax === 'x' ? w.tf(c, 0, at, out > 0 ? 0 : PI) : w.tf(at, 0, c, out > 0 ? PI / 2 : -PI / 2);
    T.box('m', 0xd6d3d1, 0, 0, 0.55, Wd + 1.0, FL, 1.1, 0.04); T.box('f', B.mat || 0xc2410c, 0, FL, 0.95, Wd * 0.75, 0.03, 0.9, 0.03);
    if (B.awning) { const [a1, a2] = B.awning, aw = Wd + 2.4, ah = (d.h || 3.2) + 0.35; for (let i = 0; i < 8; i++) T.add('g', rbox(aw / 8, 0.1, 1.7, 0.03), i % 2 ? a2 : a1, -aw / 2 + aw / 16 + i * aw / 8, ah + 0.35, 1.0, -0.38, 0, 0);
      for (let i = 0; i < 8; i++) T.add('g', sph(10), i % 2 ? a2 : a1, -aw / 2 + aw / 16 + i * aw / 8, ah - 0.02, 1.78, 0, 0, 0, aw / 16, 0.16, 0.08); }
    [-1, 1].forEach((s2) => { T.add('x', rcyl(0.12, 0.08, 0.03, 12), 0x334155, s2 * (Wd / 2 + 0.55), 2.6, 0.32, PI / 2, 0, 0); T.add('l', sph(12), 0xfff1c1, s2 * (Wd / 2 + 0.55), 2.75, 0.5, 0, 0, 0, 0.16, 0.2, 0.16, 0.6); T.add('x', cone(12), 0x334155, s2 * (Wd / 2 + 0.55), 2.92, 0.5, 0, 0, 0, 0.2, 0.15, 0.2); });
    if (B.sign) { const S = B.sign, p = T.P(0, 0, 0.3); sign3d(w, S[0], p[0], (d.h || 3.2) + (B.awning ? 1.25 : 0.55), p[2] + (ax === 'x' ? out * 0.0 : 0), T.ry, S[1] || 0.42, S[2] || 0xffffff, S[3] === undefined ? 0xff4fa0 : S[3]); }
    w.lights.push({ x: T.P(0, 0, 2)[0], y: 3, z: T.P(0, 0, 2)[2], c: 0xffd9a0, i: 10, d: 10, out: true }); }
  w.region = reg; return B; }
// ------------------------------------------------------------------------------------------------ build
export function buildTown(w) {
  K.propSeed(2026); w.inter = []; w.gears = []; w.secrets = []; w.spots = {}; w.dyn = w.dyn || []; w.plants = []; w.toys = [];
  w.env = { sunDir: [0.45, 0.82, 0.38], sunColor: 0xfff1d6, sunI: 2.6, hemiSky: 0xd6ecff, hemiGround: 0x6f8a4a, hemiI: 0.6, skyTop: 0x3b9cff, skyMid: 0xa8dcff, skyBot: 0xe8f7ff, fog: 0xcfe9ff, fogD: 0.004, exposure: 1.0, envI: 0.85, bloomT: 1.0, bloomS: 0.38, sunDisc: 1 };
  I = (o) => { w.inter.push(o); return o; }; w.I = I;
  w.region = 'shell'; ground(w); w.region = 'out'; square(w); streets(w); outskirts(w);
  shells(w); interiors(w); w.region = 'out'; park(w); backyard(w); lookout(w); w.region = 'shell';
  w.start = [0, 0.2, 13]; w.startYaw = PI; w.camDist = 9.5;
  return w; }
// golden biscuit collectible
export function bisc(w, x, y, z) { w.gears.push([x, y, z]); }
// ------------------------------------------------------------------------------------------------ ground: grass, roads, sidewalks
function ground(w) {
  // big grass field (soft colour variation baked into the vertices; top at y = -0.05)
  const gg = new THREE.PlaneGeometry(150, 150, 60, 60).rotateX(-PI / 2); w.addFn('m', gg, (c, x, y, z) => { const n = Math.sin(x * 0.21) * Math.cos(z * 0.17) + Math.sin(x * 0.07 + z * 0.11) * 0.8; c.setHex(0x5cbf4a).lerp(new THREE.Color(n > 0.4 ? 0x7dd35a : n < -0.6 ? 0x49a83e : 0x63c44e), 0.7); }, 0, -0.05, 6);
  w.solid(-75, -3, -69, 75, -0.05, 81, { floor: true });
  // asphalt ring road (top y = 0) around the square, with soft kerbs
  const asph = 0x4b5563; [[-23, -23, 23, -16], [-23, 16, 23, 23], [-23, -16, -16, 16], [16, -16, 23, 16]].forEach(([a, b, c, d]) => { w.add('m', rbox(c - a, 0.1, d - b, 0.03, 1), asph, (a + c) / 2, -0.05, (b + d) / 2); w.solid(a, -1, b, c, 0, d, { floor: true }); });
  // dashed centre line + crosswalks
  for (let s = -19; s <= 19; s += 2.4) { w.add('l', rbox(1.1, 0.02, 0.16, 0.01), 0xffd23f, s, 0.01, -19.5, 0, 0, 0, 1, 1, 1, 0.05); w.add('l', rbox(1.1, 0.02, 0.16, 0.01), 0xffd23f, s, 0.01, 19.5); w.add('l', rbox(0.16, 0.02, 1.1, 0.01), 0xffd23f, -19.5, 0.01, s); w.add('l', rbox(0.16, 0.02, 1.1, 0.01), 0xffd23f, 19.5, 0.01, s); }
  [[0, -19.5, 0], [0, 19.5, 0], [-19.5, 0, 1], [19.5, 0, 1]].forEach(([x, z, rot]) => { for (let i = -3; i <= 3; i++) w.add('m', rbox(rot ? 6.6 : 0.55, 0.03, rot ? 0.55 : 6.6, 0.02), 0xf8fafc, x + (rot ? 0 : i * 0.95), 0.015, z + (rot ? i * 0.95 : 0)); });
  // sidewalk ring (pavers) + kerbs
  const sw = (a, b, c, d) => floor(w, a, b, c, d, 'tile', 0.0, 0xe7e1d6, 0xd6cfc2, 1.2);
  sw(-27, -27, 27, -23); sw(-27, 23, 27, 27); sw(-27, -23, -23, 23); sw(23, -23, 27, 23);
  sw(-44, 23, -27, 27); sw(-38, 27, -30, 30); sw(27, 20, 41, 23); sw(-3, 27, 3, 31); sw(-3, -44, 3, -42); sw(41, -9, 44, -5);
  [[-23, -23, 23, -23, 'x'], [-23, 23, 23, 23, 'x'], [-23, -23, -23, 23, 'z'], [23, -23, 23, 23, 'z'], [-16, -16, 16, -16, 'x'], [-16, 16, 16, 16, 'x'], [-16, -16, -16, 16, 'z'], [16, -16, 16, 16, 'z']].forEach(([a, b, c, d, ax]) => {
    if (ax === 'x') w.add('g', rbox(c - a, 0.14, 0.22, 0.05), 0xf1ede6, (a + c) / 2, 0.02, b); else w.add('g', rbox(0.22, 0.14, d - b, 0.05), 0xf1ede6, a, 0.02, (b + d) / 2); });
}
// ------------------------------------------------------------------------------------------------ the town square
function square(w) {
  floor(w, -16, -16, 16, 16, 'tile', 0.0, 0xfde7c8, 0xf7cfa0, 2);
  // radial paving ring around the fountain
  for (let i = 0; i < 40; i++) { const a = i / 40 * PI * 2; w.add('m', rbox(1.3, 0.03, 0.9, 0.04), i % 2 ? 0xf9a8d4 : 0xfbcfe8, Math.cos(a) * 7.6, 0.035, Math.sin(a) * 7.6, 0, -a, 0); }
  w.add('m', rcyl(7.0, 0.04, 0.02, 64), 0xfff1e0, 0, 0.02, 0);
  // fountain: three tiers of basins (lathes), water pools, bone-shaped rim, golden founder statue added by the game
  w.add('g', lathe([[0, 0], [5.0, 0], [5.2, 0.15], [5.2, 0.85], [4.8, 0.95], [4.6, 0.3], [0, 0.3]], 64, 'fb1'), 0xf5f0ea, 0, 0, 0);
  w.add('e', rcyl(4.65, 0.7, 0.05, 64), 0x7dd3fc, 0, 0.1, 0); w.add('g', rcyl(4.62, 0.08, 0.02, 64), 0x38bdf8, 0, 0.62, 0);
  w.add('g', rcyl(1.1, 2.2, 0.2, 32), 0xf5f0ea, 0, 0.3, 0); w.add('g', lathe([[0, 0], [2.4, 0.05], [2.6, 0.45], [2.3, 0.55], [0.6, 0.25], [0, 0.25]], 48, 'fb2'), 0xf5f0ea, 0, 2.3, 0); w.add('e', rcyl(2.25, 0.3, 0.05, 48), 0x7dd3fc, 0, 2.5, 0);
  w.add('g', rcyl(0.55, 1.4, 0.12, 24), 0xf5f0ea, 0, 2.6, 0); w.add('x', rcyl(0.9, 0.3, 0.1, 32), 0xd4a017, 0, 3.9, 0);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; w.add('g', sph(12), 0xf9a8d4, Math.cos(a) * 5.0, 0.98, Math.sin(a) * 5.0, 0, 0, 0, 0.3, 0.22, 0.3); }
  w.solid(-4.4, 0, -4.4, 4.4, 0.95, 4.4); w.solid(-1.1, 0, -1.1, 1.1, 4.3, 1.1); w.solid(-2.6, 2.3, -2.6, 2.6, 2.85, 2.6, { cam: false });
  w.spots.fountain = [0, 4.2, 0]; w.spots.statue = [0, 4.2, 0];
  // benches facing the fountain, lamp posts, planters with trees, flower beds
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + PI / 8; bench(w, Math.cos(a) * 9.6, Math.sin(a) * 9.6, -a - PI / 2, [0xff8a3d, 0x4f9dff, 0xff5d8f, 0x3ddc84][i % 4]); }
  [[-12.5, -12.5], [12.5, -12.5], [-12.5, 12.5], [12.5, 12.5]].forEach(([x, z]) => { w.add('g', rcyl(2.0, 0.6, 0.12, 32), 0xe0c9a6, x, 0, z); w.add('m', rcyl(1.8, 0.05, 0.02, 32), 0x5a3b1e, x, 0.58, z); tree(w, x, z, 1.15, x * z > 0 ? 1 : 0); w.solid(x - 1.9, 0, z - 1.9, x + 1.9, 0.6, z + 1.9, { cam: false }); });
  [[-6, -13.5], [6, -13.5], [-6, 13.5], [6, 13.5], [-13.5, -5], [-13.5, 5], [13.5, -5], [13.5, 5]].forEach(([x, z]) => lampPost(w, x, z));
  [[-14.6, -1.6, -12.2, 1.6], [12.2, -1.6, 14.6, 1.6]].forEach(([a, b, c, d]) => flowerBed(w, a, b, c, d));
  // bunting between lamp posts (sagging tube + triangle flags)
  const bunt = (ax, az, bx, bz) => { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([ax + (bx - ax) * t, 3.9 - Math.sin(t * PI) * 0.7, az + (bz - az) * t]); } w.add('m', tube(pts, 0.025, 20, 5), 0xffffff, 0, 0, 0);
    for (let i = 1; i < 14; i++) { const t = i / 14, x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = 3.9 - Math.sin(t * PI) * 0.7; w.add('g', cone(3), [0xff4fa0, 0xffd23f, 0x4f9dff, 0x3ddc84, 0xa66bff][i % 5], x, y - 0.32, z, PI, Math.atan2(bx - ax, bz - az) + PI / 2, 0, 0.22, 0.32, 0.03); } };
  bunt(-6, -13.5, 6, -13.5); bunt(-6, 13.5, 6, 13.5); bunt(-13.5, -5, -13.5, 5); bunt(13.5, -5, 13.5, 5); bunt(-6, -13.5, -13.5, -5); bunt(6, -13.5, 13.5, -5); bunt(-6, 13.5, -13.5, 5); bunt(6, 13.5, 13.5, 5);
  // Pupsicles ice-cream cart
  { const T = w.tf(-9.5, 0, 4.2, PI / 2 + 0.4); T.slab('g', 0xffffff, 0, 0.45, 0, 2.4, 1.0, 1.2, 0.15); T.box('g', 0xff8fc8, 0, 0.45, 0.61, 2.3, 0.35, 0.03, 0.02); T.box('g', 0x7dd3fc, 0, 0.85, 0.61, 2.3, 0.2, 0.03, 0.02);
    [-1, 1].forEach((s) => { T.add('m', torus(0.3, 20), 0x334155, s * 0.8, 0.38, 0.63, 0, 0, 0, 0.36, 0.36, 0.5); T.add('x', sph(10), 0xd1d5db, s * 0.8, 0.38, 0.65, 0, 0, 0, 0.12); });
    for (let i = 0; i < 5; i++) { T.add('m', cone(14), 0xe8a95c, -0.8 + i * 0.4, 1.5, 0, PI, 0, 0, 0.11, 0.3, 0.11); T.add('g', sph(12), [0xff8fc8, 0xfef3c7, 0x8b5a2b, 0x86efac, 0xfda4af][i], -0.8 + i * 0.4, 1.62, 0, 0, 0, 0, 0.15); }
    T.add('x', cyl(10), 0xcbd5e1, 0, 1.45, 0, 0, 0, 0, 0.04, 1.6, 0.04); for (let i = 0; i < 8; i++) T.add('g', cone(3, ), i % 2 ? 0xff8fc8 : 0xffffff, 0, 3.05, 0, 0, i * PI / 4, 0, 1.4, 0.5, 0.55); sign3d(w, 'PUPSICLES', ...T.P(0, 0, 0.66).slice(0, 1), 1.0, T.P(0, 0, 0.7)[2], T.ry, 0.16, 0xff4fa0, null); }
  // balloon cart
  { const x = 9.6, z = -4.8; w.add('g', rbox(1.4, 0.9, 0.9, 0.12), 0xffd23f, x, 0.45, z); w.add('m', torus(0.3, 20), 0x334155, x - 0.5, 0.3, z + 0.48, 0, 0, 0, 0.3, 0.3, 0.5); w.add('m', torus(0.3, 20), 0x334155, x + 0.5, 0.3, z + 0.48, 0, 0, 0, 0.3, 0.3, 0.5);
    for (let i = 0; i < 9; i++) { const bx = x + (R() - 0.5) * 1.6, bz = z + (R() - 0.5) * 1.2, by = 2.6 + R() * 1.1; w.add('m', cyl(4), 0xffffff, x, 0.9, z, Math.atan2(bz - z, by - 0.9) * 0.9, 0, -Math.atan2(bx - x, by - 0.9), 0.008, by - 0.9, 0.008); w.add('g', sph(14), pick([0xff4fa0, 0x4f9dff, 0xffd23f, 0x3ddc84, 0xa66bff, 0xff8a3d]), bx, by, bz, 0, 0, 0, 0.3, 0.36, 0.3); }
    w.solid(x - 0.7, 0, z - 0.5, x + 0.7, 0.9, z + 0.5); }
  // notice board (town map), newspaper stand, water bowls, hydrants, mailbox, picnic tables
  { const T = w.tf(-3.6, 0, 14.6, 0); T.box('m', 0x8b5a2b, -1.3, 0, 0, 0.16, 2.6, 0.16, 0.04); T.box('m', 0x8b5a2b, 1.3, 0, 0, 0.16, 2.6, 0.16, 0.04); T.box('m', 0xb07a45, 0, 1.0, 0, 2.6, 1.5, 0.12, 0.04); T.box('f', 0xd7b98e, 0, 1.1, 0.06, 2.4, 1.3, 0.02, 0.02);
    for (let i = 0; i < 6; i++) T.box('m', pick([0xfef08a, 0xfda4af, 0xa7f3d0, 0xbfdbfe, 0xffffff]), -0.9 + (i % 3) * 0.9, 1.25 + (i < 3 ? 0.55 : 0), 0.09, 0.6, 0.45, 0.01, 0.01); T.add('g', cone(4), 0x8b5a2b, 0, 2.6, 0, 0, PI / 4, 0, 1.9, 0.5, 0.4); T.solid(-1.4, 0, -0.15, 1.4, 2.6, 0.15);
    I({ kind: 'map', x: -3.6, y: 0, z: 15.4, r: 2.0, label: '🗺️ Town map' }); }
  const hyd = (x, z) => { w.add('g', rcyl(0.22, 0.75, 0.06, 18), 0xef4444, x, 0, z); w.add('g', sph(14), 0xef4444, x, 0.75, z, 0, 0, 0, 0.24, 0.2, 0.24); w.add('x', rcyl(0.27, 0.08, 0.02, 18), 0xfacc15, x, 0.55, z); [-1, 1].forEach((s) => w.add('g', cyl(10), 0xef4444, x + s * 0.24, 0.45, z, 0, 0, PI / 2, 0.09, 0.14, 0.09)); w.solid(x - 0.25, 0, z - 0.25, x + 0.25, 0.9, z + 0.25, { cam: false }); };
  hyd(-15, -8); hyd(15, 8); hyd(-25, 21); hyd(25, -21); hyd(-8, 24.6); hyd(24.6, 6);
  const bowlS = (x, z) => { K.hh('dogBowl', w, x, z, 0.18, 0x60a5fa, 0x7dd3fc); };
  bowlS(5.3, 1.3); bowlS(-5.3, -1.3); bowlS(1.3, -5.3);
  { const T = w.tf(14.2, 0, 13.8, -PI / 4); T.box('x', 0x334155, 0, 0, 0, 0.12, 1.0, 0.12, 0.03); T.box('g', 0x2563eb, 0, 1.0, 0, 0.6, 0.55, 0.45, 0.2); T.add('g', cyl(16), 0x2563eb, 0, 1.55, 0, PI / 2, 0, 0, 0.3, 0.45, 0.3); T.box('g', 0xef4444, 0.33, 1.3, 0, 0.04, 0.35, 0.1, 0.02); T.solid(-0.35, 0, -0.3, 0.35, 1.8, 0.3); }
  [[11.5, 9.2], [-11.5, -9.2]].forEach(([x, z], i) => { const T = w.tf(x, 0, z, i ? 0.6 : -0.6); T.slab('m', 0xc58b52, 0, 0.75, 0, 2.2, 0.1, 1.1, 0.04); [-1, 1].forEach((s) => { T.box('m', 0xa86f3c, 0, 0.42, s * 0.85, 2.2, 0.08, 0.4, 0.03); T.box('m', 0x8b5a2b, s * 0.9, 0, 0, 0.12, 0.75, 1.9, 0.03); }); T.add('g', rcyl(0.1, 0.2, 0.02, 12), 0xff4fa0, 0.3, 0.85, 0); T.add('g', sph(10), 0xef4444, -0.4, 0.92, 0.1, 0, 0, 0, 0.08); });
  // Coco's easel (painting the fountain)
  { const T = w.tf(-5.6, 0, -10.6, PI + 0.5); [-1, 1].forEach((s) => T.add('m', cyl(8), 0x8b5a2b, s * 0.35, 0, 0, 0.1, 0, -s * 0.12, 0.04, 1.8, 0.04)); T.add('m', cyl(8), 0x8b5a2b, 0, 0, -0.35, -0.3, 0, 0, 0.04, 1.8, 0.04); T.box('m', 0xffffff, 0, 0.9, 0.05, 1.0, 0.8, 0.05, 0.02);
    [[0x7dd3fc, 0, 1.15, 0.6, 0.35], [0x86efac, 0, 0.98, 0.9, 0.2], [0xf5f0ea, 0, 1.15, 0.25, 0.3], [0xffd23f, 0.3, 1.45, 0.15, 0.15]].forEach(([c, x, y, sw2, sh]) => T.box('g', c, x, y - sh / 2, 0.085, sw2, sh, 0.01, 0.01)); T.box('m', 0xb07a45, 0, 0.88, 0.12, 1.0, 0.04, 0.12, 0.01); }
  // welcome arch at the south road
  { const z = 24.8; [-4.2, 4.2].forEach((x) => { w.add('g', rcyl(0.38, 4.6, 0.1, 20), 0xffffff, x, 0, z); w.add('g', sph(14), 0xff4fa0, x, 4.75, z, 0, 0, 0, 0.42); w.solid(x - 0.4, 0, z - 0.4, x + 0.4, 4.6, z + 0.4); });
    const pts = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * PI; pts.push([-4.2 * Math.cos(a), 4.6 + Math.sin(a) * 1.3, z]); } w.add('g', tube(pts, 0.18, 32, 10), 0xff4fa0, 0, 0, 0);
    sign3d(w, 'WELCOME TO PUP TOWN', 0, 4.5, z + 0.05, PI, 0.36, 0xffffff, 0x3b82f6); sign3d(w, 'WELCOME TO PUP TOWN', 0, 4.5, z - 0.05, 0, 0.36, 0xffffff, 0x3b82f6);
    for (let i = 0; i < 9; i++) { const a = i / 8 * PI; w.add('g', heart(), [0xff4fa0, 0xffd23f, 0xff8a3d][i % 3], -4.2 * Math.cos(a), 4.6 + Math.sin(a) * 1.3 + 0.32, z, 0, 0, 0, 0.16, 0.16, 0.16); } }
  // bus stops (south + north) with shelters
  const stop = (x, z, ry, name) => { const T = w.tf(x, 0, z, ry); T.slab('g', 0x22c1c3, 0, 0, -0.9, 3.6, 2.7, 0.12, 0.04); [-1, 1].forEach((s) => T.box('x', 0x94a3b8, s * 1.7, 0, 0.5, 0.12, 2.8, 0.12, 0.04)); T.box('g', 0xffd23f, 0, 2.75, -0.1, 4.0, 0.2, 2.0, 0.08);
    T.box('m', 0xc58b52, 0, 0.5, -0.55, 3.0, 0.1, 0.5, 0.03); T.box('x', 0x64748b, 0, 0, -0.55, 0.1, 0.5, 0.1, 0.02); T.box('l', 0xfff6c8, 0, 1.6, -0.82, 1.6, 0.9, 0.03, 0.02, 0.15);
    T.add('x', cyl(10), 0x334155, 2.3, 0, 0.6, 0, 0, 0, 0.06, 3.0, 0.06); T.add('g', rcyl(0.38, 0.08, 0.03, 24), 0x22c1c3, 2.3, 2.8, 0.6, PI / 2, 0, 0); sign3d(w, 'BUS', ...[T.P(2.3, 0, 0.66)[0]], 2.88, T.P(2.3, 0, 0.66)[2], ry, 0.12, 0xffffff, null); sign3d(w, name, ...[T.P(0, 0, -0.82)[0]], 2.25, T.P(0, 0, -0.8)[2], ry, 0.17, 0x0f172a, null); };
  stop(8, 25.2, 0, 'PAW PARK STOP'); stop(-12, -25.2, PI, 'TOWN HALL STOP'); w.spots.stops = [[8, 22, 25.2, PI], [-12, -22, -25.2, 0]];
  I({ kind: 'bus', stop: 0, x: 8, y: 0, z: 25.0, r: 2.6, label: '🚌 Wait for the Dog-Bus' }); I({ kind: 'bus', stop: 1, x: -12, y: 0, z: -25.0, r: 2.6, label: '🚌 Wait for the Dog-Bus' });
  // golden biscuits around the square
  bisc(w, 0, 4.7, 0); bisc(w, -12.5, 1.4, 12.5); bisc(w, 9.6, 1.4, -4.8); bisc(w, 14.2, 2.4, 13.8);
}
// ------------------------------------------------------------------------------------------------ streets: lamps, trees, little extras between the buildings
function streets(w) {
  for (let s = -21; s <= 21; s += 10.5) { if (s !== 0) { lampPost(w, s, -25.2); lampPost(w, s, 25.6); } lampPost(w, -25.4, s); lampPost(w, 25.4, s); }
  [[-25, -24.8], [25, -24.8]].forEach(([x, z]) => { w.lights.push({ x, y: 3.6, z, c: 0xffd9a0, i: 8, d: 12, out: true }); });
  // alleys + yards between buildings: crates, bins, bikes, benches, a mural, trees
  const crate = (x, y, z, s, c) => K.crate(w, x, y, z, s, c);
  crate(-30.5, 0, 2.2, 0.9); crate(-29.6, 0, 3.4, 0.8, 0xc58b52); crate(-30.2, 0.9, 2.6, 0.7); // west alley (bakery/groomer)
  { const T = w.tf(-38, 0, 3, PI / 2); T.slab('g', 0x16a34a, 0, 0, 0, 1.2, 1.3, 0.8, 0.12); T.box('g', 0x15803d, 0, 1.3, 0, 1.25, 0.12, 0.85, 0.05); T.slab('g', 0x2563eb, 1.5, 0, 0, 1.2, 1.3, 0.8, 0.12); T.box('g', 0x1d4ed8, 1.5, 1.3, 0, 1.25, 0.12, 0.85, 0.05); }
  K.hh('bike', w, -34, 4.5, 0.16, 0.3); bench(w, -33, 1.2, PI, 0xff5d8f);
  // mural on the groomer's north wall (paw prints + hearts, real raised shapes)
  for (let i = 0; i < 10; i++) { const x = -39 + i * 1.2, y = 1.2 + Math.sin(i * 1.3) * 0.6 + 1; w.add('g', heart(), [0xff4fa0, 0x4f9dff, 0xffd23f, 0x3ddc84][i % 4], x, y, 5.72, 0, PI, 0, 0.32, 0.32, 0.12); }
  // east alley (fire/garden): hose reel, sandbags, a dalmatian-spotted bench
  crate(30, 0, 2.5, 0.9, 0xef4444); K.hh('tire', w, 33, 3.5, 0.2, true); bench(w, 36, 2.8, PI, 0xffffff);
  // north side gaps: newspaper kiosk + topiary garden (between library/hall/barkade)
  { const T = w.tf(-13.5, 0, -31, 0); T.slab('g', 0x16a34a, 0, 0, 0, 2.6, 2.4, 2.0, 0.12); T.box('g', 0xfef3c7, 0, 1.1, 1.01, 2.2, 0.9, 0.02, 0.02); T.box('g', 0xef4444, 0, 2.4, 0, 3.0, 0.3, 2.4, 0.1); for (let i = 0; i < 6; i++) T.box('m', pick([0xffffff, 0xfef08a, 0xdbeafe]), -0.8 + i * 0.32, 1.2, 1.05, 0.26, 0.4, 0.03, 0.01); sign3d(w, 'DAILY BARK', -13.5, 2.62, -29.7, 0, 0.18, 0xffffff, null); }
  const topiary = (x, z, k) => { w.add('m', rcyl(0.5, 0.6, 0.08, 20), 0xc2410c, x, 0, z); if (k === 0) { w.add('g', sph(16), 0x2f9e4a, x, 1.3, z, 0, 0, 0, 0.7, 0.7, 0.7); w.add('g', sph(16), 0x2f9e4a, x, 2.3, z, 0, 0, 0, 0.45); } else { // dog-shaped topiary
      w.add('g', sph(16), 0x2f9e4a, x, 1.2, z, 0, 0, 0, 0.5, 0.45, 0.8); w.add('g', sph(16), 0x2f9e4a, x, 1.75, z + 0.65, 0, 0, 0, 0.42); [-1, 1].forEach((s) => w.add('g', sph(12), 0x2f9e4a, x + s * 0.32, 2.1, z + 0.55, 0, 0, 0, 0.16, 0.26, 0.12)); w.add('g', sph(12), 0x2f9e4a, x, 1.6, z - 0.85, 0, 0, 0, 0.14, 0.3, 0.14); [-1, 1].forEach((s) => [-1, 1].forEach((t) => w.add('g', capsule(10), 0x2f9e4a, x + s * 0.25, 0.75, z + t * 0.45, 0, 0, 0, 0.18, 0.5, 0.18))); }
    w.solid(x - 0.5, 0, z - 0.5, x + 0.5, 1.8, z + 0.5, { cam: false }); };
  topiary(11, -30, 1); topiary(15.5, -30, 0); topiary(11, -36, 0); topiary(15.5, -36, 1); bench(w, 13.3, -33, PI / 2, 0x4f9dff); topiary(-11, -36, 1); topiary(-16, -36, 0);
  // community garden beds for Martina's sunflowers (SE corner)
  for (let i = 0; i < 4; i++) { const x = 29 + i * 3.1, z = 22.4; w.slab('m', 0x8b5a2b, x, 0, z, 2.4, 0.4, 1.4, 0.08, { cam: false }); w.add('m', rbox(2.2, 0.06, 1.2, 0.03), 0x4a2f1b, x, 0.4, z); w.plants.push([x, 0.45, z]);
    I({ kind: 'plant', i, x, y: 0, z: z - 1.0, r: 1.8, label: '🌻 Plant a sunflower' }); }
  sign3d(w, 'COMMUNITY GARDEN', 33.6, 1.6, 21.2, PI, 0.2, 0xffffff, 0x16a34a); w.add('m', cyl(8), 0x8b5a2b, 33.6, 0, 21.25, 0, 0, 0, 0.06, 1.6, 0.06);
  // corner trees + hedges round the edges of the streets
  [[-44, -44], [-44, -20], [-44, 0], [44, -44], [44, -30], [44, 4], [44, 20], [-20, -46], [20, -46], [-46, 22], [46, 26]].forEach(([x, z], i) => tree(w, x, z, 1.2 + (i % 3) * 0.15, i % 4 === 0 ? 1 : 0));
  [[-34, -24], [-30, -24], [34, -24], [30, -24], [-42, -18], [-42, 24], [42, -18]].forEach(([x, z]) => bush(w, x, z, 1.1));
  bisc(w, -30.2, 2.4, 2.6); bisc(w, 13.3, 1.2, -33); bisc(w, 36, 1.2, 2.8);
}
// ------------------------------------------------------------------------------------------------ outskirts: hills, cottages and a hedge so the world never feels empty
function outskirts(w) {
  // perimeter hedge (boundary)
  const hedge = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / 1.6); for (let i = 0; i <= n; i++) { const t = i / n; w.add('g', blobGeo(i & 31, 0.18, 2), i % 5 ? 0x2f9e4a : 0x3fae5a, x0 + (x1 - x0) * t, 1.0, z0 + (z1 - z0) * t, 0, i, 0, 1.1, 1.2, 1.1); }
    w.solid(Math.min(x0, x1) - 0.9, 0, Math.min(z0, z1) - 0.9, Math.max(x0, x1) + 0.9, 8, Math.max(z0, z1) + 0.9, { wall: true, cam: false }); };
  hedge(-49, -68, 49, -68); hedge(-49, 72, 49, 72); hedge(-49, -68, -49, 72); hedge(49, -68, 49, 72);
  // rolling hills + cottages beyond (decor only)
  for (let i = 0; i < 22; i++) { const a = i / 22 * PI * 2, rx = 92 + (i % 3) * 8, rz = 98 + (i % 4) * 6; const x = Math.cos(a) * rx, z = 6 + Math.sin(a) * rz; w.add('m', blobGeo(i, 0.12, 2), [0x6cc24a, 0x5cb83e, 0x7fcf55][i % 3], x, -2, z, 0, a, 0, 22 + (i % 4) * 5, 7 + (i % 3) * 3, 18); }
  const cottage = (x, z, ry, c, rf) => { const T = w.tf(x, 0, z, ry); T.box('m', c, 0, 0, 0, 5, 3.4, 4.4, 0.1); T.box('m', 0xffffff, 0, 0, 2.21, 1.2, 2.2, 0.06, 0.05); T.box('e', 0xbfe9ff, -1.6, 1.4, 2.22, 1.0, 0.9, 0.04, 0.03); T.box('e', 0xbfe9ff, 1.6, 1.4, 2.22, 1.0, 0.9, 0.04, 0.03);
    T.add('g', prism(5.6, 2.2, 5.0), rf, 0, 3.4, 0, 0, PI / 2, 0); T.add('m', prism(5.0, 2.0, 4.42), c, 0, 3.4, 0, 0, PI / 2, 0); T.box('m', 0xb4533a, 1.4, 4.0, -0.8, 0.6, 1.6, 0.6, 0.05); };
  [[-60, -40, 0.3], [-62, -10, 1.6], [-60, 30, 1.4], [-58, 58, 2.2], [60, -40, -0.3], [62, -5, -1.6], [60, 32, -1.5], [56, 62, -2.4], [-30, -78, 0], [0, -82, 0.1], [30, -78, -0.2], [-20, 84, PI], [24, 84, PI]].forEach(([x, z, ry], i) => cottage(x, z, ry, [0xffd6a5, 0xcaffbf, 0xbde0fe, 0xffc6ff, 0xfdffb6][i % 5], [0xe76f51, 0x2a9d8f, 0x6d597a, 0xb5179e][i % 4]));
  for (let i = 0; i < 40; i++) { const a = i / 40 * PI * 2, r = 64 + (i % 5) * 4; tree(w, Math.cos(a) * r, 4 + Math.sin(a) * (r + 6), 1.4 + (i % 3) * 0.3, i % 6 === 0 ? 1 : 0); }
  for (let i = 0; i < 26; i++) { const t = i / 26; tree(w, -47 + t * 94, -64 + (i % 2) * 2, 1.2 + (i % 3) * 0.2, i % 7 === 0 ? 1 : 0); tree(w, -46 + t * 92, 69 - (i % 2) * 1.5, 1.2 + (i % 3) * 0.2, i % 5 === 0 ? 1 : 0); }
  for (let i = 0; i < 18; i++) { const t = i / 18; tree(w, -46 + (i % 2) * 1.5, -60 + t * 126, 1.25, i % 6 === 0 ? 1 : 0); tree(w, 46 - (i % 2) * 1.5, -60 + t * 126, 1.25, i % 5 === 0 ? 1 : 0); }
}
// ------------------------------------------------------------------------------------------------ building shells (exteriors + floors/ceilings/linings)
function shells(w) {
  // TOWN HALL: classical cream hall, columns, steps, flat roof with balustrade, clock tower + gold dome
  building(w, { id: 'hall', x0: -9, z0: -42, x1: 9, z1: -26, ceil: 6.2, ext: 0xfff4e0, int: 0xfde7c8, trim: 0xffffff, floor: ['marble', 0xfff7ee, 0xf3d9c4, 2.5], door: { side: 's', a: -2, b: 2, h: 4.2 }, winTop: 4.6, winBot: 1.4, winW: 1.8, curtain: 0xdc2626, li: 30, noBoxes: true, mat: 0xb91c1c });
  w.region = 'shell'; { const y = 6.6; w.add('m', rbox(19.4, 0.5, 17.4, 0.1), 0xf5e6cc, 0, y + 0.25, -34); for (let x = -9; x <= 9.01; x += 0.9) { w.add('g', cyl(10), 0xffffff, x, y + 0.5, -25.6, 0, 0, 0, 0.12, 0.8, 0.12); w.add('g', cyl(10), 0xffffff, x, y + 0.5, -42.4, 0, 0, 0, 0.12, 0.8, 0.12); }
    [-25.6, -42.4].forEach((z) => w.add('g', rbox(19.2, 0.18, 0.4, 0.06), 0xffffff, 0, y + 1.35, z)); for (let z = -42; z <= -26; z += 0.9) [-9.4, 9.4].forEach((x) => w.add('g', cyl(10), 0xffffff, x, y + 0.5, z, 0, 0, 0, 0.12, 0.8, 0.12)); [-9.4, 9.4].forEach((x) => w.add('g', rbox(0.4, 0.18, 17, 0.06), 0xffffff, x, y + 1.35, -34));
    // tower
    w.add('m', rbox(5, 5.4, 5, 0.12), 0xfff4e0, 0, y + 0.5 + 2.7, -36); w.add('g', rbox(5.5, 0.4, 5.5, 0.1), 0xffffff, 0, y + 5.9 + 0.2, -36); w.add('x', lathe([[0, 0], [2.3, 0], [2.2, 0.8], [1.6, 2.0], [0.8, 2.7], [0, 2.9]], 32, 'thDome'), 0xffc83d, 0, y + 6.3, -36);
    w.add('x', cyl(10), 0xd4a017, 0, y + 9.2, -36, 0, 0, 0, 0.06, 1.8, 0.06);
    [[0, -33.45, 0], [0, -38.55, PI], [2.55, -36, PI / 2], [-2.55, -36, -PI / 2]].forEach(([x, z, ry]) => { const T = w.tf(x, y + 3.6, z, ry); T.add('g', rcyl(1.5, 0.2, 0.06, 40), 0xffd23f, 0, 0, 0, PI / 2, 0, 0); T.add('g', rcyl(1.3, 0.22, 0.05, 40), 0xfffbea, 0, 0, 0.02, PI / 2, 0, 0);
      for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; T.add('g', rbox(0.08, k % 3 ? 0.14 : 0.28, 0.05, 0.02), 0x1f2937, Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0.25, 0, 0, a + PI / 2); }
      T.add('l', sph(10), 0xffd23f, 0, 0, 0.27, 0, 0, 0, 0.1, 0.1, 0.05, 0.3); w.spots.clocks = (w.spots.clocks || []); w.spots.clocks.push([...T.P(0, 0, 0.3), ry]); });
    // portico: 6 columns + pediment + steps
    for (let i = 0; i < 6; i++) { const x = -6.25 + i * 2.5; w.add('g', lathe([[0, 0], [0.55, 0], [0.55, 0.3], [0.42, 0.45], [0.38, 5.4], [0.5, 5.6], [0.58, 6.0], [0, 6.0]], 24, 'col'), 0xffffff, x, 0, -24.2); w.solid(x - 0.45, 0, -24.65, x + 0.45, 6, -23.75); }
    w.add('g', rbox(16.4, 0.5, 3.6, 0.1), 0xffffff, 0, 6.0, -24.6); w.add('m', prism(16.4, 2.0, 3.4), 0xfff4e0, 0, 6.5, -24.6); w.add('g', prism(17.2, 2.4, 3.8).clone().scale(1, 1, 1), 0xd4a017, 0, 6.42, -24.62, 0, 0, 0, 1, 1, 0.98);
    sign3d(w, 'TOWN HALL', 0, 6.95, -22.75, 0, 0.42, 0x1f2937, null);
    for (let i = 0; i < 3; i++) w.slab('m', 0xf5f0ea, 0, 0, -23.2 + i * 0.5 - 0.2, 16 - i * 0.6, 0.12 - 0 + i * 0, 0.6, 0.04, { cam: false });
    w.add('g', rbox(16.6, 0.12, 4.0, 0.04), 0xf5f0ea, 0, 0.06, -24.4); w.solid(-8.3, 0, -26.4, 8.3, 0.12, -22.4, {});
    // flags
    [-7.2, 7.2].forEach((x, i) => { w.add('x', cyl(10), 0xd1d5db, x, 0, -22.4, 0, 0, 0, 0.06, 7.5, 0.06); w.add('x', sph(10), 0xffd23f, x, 7.55, -22.4, 0, 0, 0, 0.12); w.add('f', rbox(1.6, 1.0, 0.04, 0.02), i ? 0x3b82f6 : 0xff4fa0, x + 0.82, 6.8, -22.4); w.add('g', heart(), 0xffffff, x + 0.82, 6.8, -22.36, 0, 0, 0, 0.22, 0.22, 0.06); w.solid(x - 0.1, 0, -22.5, x + 0.1, 7.5, -22.3, { cam: false }); }); }
  // LIBRARY: brick red with white columns, gable roof
  building(w, { id: 'library', x0: -32, z0: -40, x1: -18, z1: -27, ceil: 4.8, ext: 0xc2563c, int: 0xf3e6d0, trim: 0xffffff, frame: 0xffffff, floor: ['wood', 0x9b6a42], door: { side: 's', a: -27, b: -23 }, sign: ['LIBRARY', 0.42, 0xffffff, 0x1e3a8a], curtain: 0x1e3a8a, shutters: 0x1e3a8a, boxCol: 0x7c2d12, li: 22 });
  w.region = 'shell'; gable(w, -32, -40, -18, -27, 5.2, 0x1e3a8a, 0xc2563c, { alongX: true, chimney: [-21, -37] }); [-27.6, -22.4].forEach((x) => { w.add('g', lathe([[0, 0], [0.38, 0], [0.32, 0.3], [0.28, 3.9], [0.4, 4.1], [0, 4.1]], 20, 'col2'), 0xffffff, x, 0, -26.2); w.solid(x - 0.35, 0, -26.55, x + 0.35, 4.1, -25.85); });
  w.add('g', rbox(6.4, 0.4, 1.8, 0.1), 0xffffff, -25, 4.1, -26.4);
  // BARKADE: purple with neon, flat roof + giant 3D sign + paw
  building(w, { id: 'barkade', x0: 18, z0: -40, x1: 32, z1: -27, ceil: 4.8, ext: 0x7c3aed, int: 0x312e81, trim: 0xff4fa0, frame: 0x22d3ee, base: 0x4c1d95, floor: ['carpet', 0x1e1b4b, 0x312e81, 1.0], door: { side: 's', a: 23, b: 27 }, awning: [0xff4fa0, 0x22d3ee], curtain: null, noBoxes: true, li: 16, lightCol: 0xd8b4fe, lampCol: 0xf0abfc });
  w.region = 'shell'; { w.add('m', rbox(14.6, 0.5, 13.6, 0.1), 0x5b21b6, 25, 5.45, -33.5); const g = K.sign3d; g(w, 'BARKADE', 25, 6.5, -26.9, 0, 0.9, 0xff4fa0, 0x1e1b4b, { glow: 0.9 }); [21, 29].forEach((x) => w.add('x', cyl(8), 0x334155, x, 5.7, -27.3, 0, 0, 0, 0.06, 1.0, 0.06));
    for (let i = 0; i < 14; i++) w.add('l', sph(8), [0xff4fa0, 0x22d3ee, 0xffd23f][i % 3], 18.2 + i, 4.95, -26.7, 0, 0, 0, 0.1, 0.1, 0.1, 0.6); for (let i = 0; i < 13; i++) [17.75, 32.25].forEach((x) => w.add('l', sph(8), [0xff4fa0, 0x22d3ee, 0xffd23f][i % 3], x, 4.95, -27.2 - i, 0, 0, 0, 0.1, 0.1, 0.1, 0.6)); }
  // BAKERY: warm pink with striped awning, gable roof, chimney
  building(w, { id: 'bakery', x0: -40, z0: -14, x1: -27, z1: 0, ceil: 4.6, ext: 0xffb3c8, int: 0xfff1e6, trim: 0xffffff, floor: ['tile', 0xfff7ed, 0xfda4af, 1.2], door: { side: 'e', a: -9, b: -5 }, sign: ['BONE APPETIT', 0.34, 0xffffff, 0xd9467a], awning: [0xff4fa0, 0xffffff], curtain: 0xff8fb1, shutters: 0xffffff, li: 24 });
  w.region = 'shell'; gable(w, -40, -14, -27, 0, 5.0, 0x9f1239, 0xffb3c8, { alongX: false, chimney: [-37, -10] });
  // GROOMER: aqua with bubbles
  building(w, { id: 'groomer', x0: -40, z0: 6, x1: -27, z1: 20, ceil: 4.6, ext: 0x7dd3fc, int: 0xecfeff, trim: 0xffffff, floor: ['tile', 0xffffff, 0xa5f3fc, 1.0], door: { side: 'e', a: 11, b: 15 }, sign: ['FLUFF & PUFF', 0.34, 0xffffff, 0x0891b2], awning: [0x22d3ee, 0xffffff], curtain: 0x67e8f9, shutters: 0xffffff, li: 24 });
  w.region = 'shell'; gable(w, -40, 6, -27, 20, 5.0, 0x0e7490, 0x7dd3fc, { alongX: false }); for (let i = 0; i < 9; i++) w.add('e', sph(14), 0xe0f7ff, -40.4 + (i % 3) * 0.2, 5.2 + i * 0.35, 9 + i * 1.1, 0, 0, 0, 0.3 + (i % 3) * 0.12);
  // FIRE STATION: red brick, wide garage door, flat roof, bell tower
  building(w, { id: 'fire', x0: 27, z0: -14, x1: 41, z1: 0, ceil: 5.6, ext: 0xdc2626, int: 0xfef2f2, trim: 0xffffff, frame: 0xffffff, base: 0x7f1d1d, floor: ['tile', 0xe5e7eb, 0xcbd5e1, 2.0], door: { side: 'w', a: -10.5, b: -3.5, h: 4.4 }, noBoxes: true, noWin: 'e', li: 26 });
  w.region = 'shell'; { w.add('m', rbox(14.6, 0.5, 14.6, 0.1), 0x991b1b, 34, 6.25, -7); sign3d(w, 'PUP FIRE STATION', 26.7, 4.95, -7, -PI / 2, 0.4, 0xffffff, 0x7f1d1d); sign3d(w, '1', 26.7, 5.9, -12.2, -PI / 2, 0.5, 0xffd23f, 0x7f1d1d);
    w.add('m', rbox(3, 2.4, 3, 0.1), 0xdc2626, 37, 6.5 + 1.2, -10); w.add('g', prism(3.6, 1.4, 3.6), 0x7f1d1d, 37, 8.9, -10); for (let k = 0; k < 4; k++) w.add('x', cyl(8), 0xffffff, 37 + (k % 2 ? 1.3 : -1.3), 6.5, -10 + (k < 2 ? 1.3 : -1.3), 0, 0, 0, 0.08, 2.4, 0.08); w.spots.bell = [37, 7.6, -10]; }
  // GARDEN SHOP: greenhouse (glass walls high up + glass gable roof with white ribs)
  building(w, { id: 'garden', x0: 27, z0: 6, x1: 40, z1: 20, ceil: 5.2, ext: 0xf0fdf4, int: 0xf0fdf4, trim: 0x16a34a, frame: 0xffffff, base: 0x16a34a, floor: ['tile', 0xd6c4a8, 0xc4ae8c, 1.4], door: { side: 'w', a: 11, b: 15 }, winTop: 4.8, winBot: 0.9, winW: 3.0, winStep: 3.6, sign: ["MARTINA'S GARDEN SHOP", 0.3, 0xffffff, 0x16a34a], awning: [0x16a34a, 0xfef9c3], noBoxes: true, li: 28, lamps: false, ceilCol: 0xf0fdf4 });
  w.region = 'shell'; { const y = 5.6, H = 3.2, cx = 33.5, cz = 13; w.add('e', prism(13.6, H, 14.6), 0xd8fbe8, cx, y, cz, 0, 0, 0); for (let i = 0; i <= 7; i++) { const z = 6 + i * 2; [-1, 1].forEach((s) => w.add('g', rbox(0.12, Math.hypot(6.8, H) + 0.1, 0.12, 0.04), 0xffffff, cx + s * 3.4, y + H / 2, z, 0, 0, s * (PI / 2 - Math.atan2(H, 6.8)))); }
    w.add('g', cyl(12), 0xffffff, cx, y + H, cz, PI / 2, 0, 0, 0.14, 14.6, 0.14); }
  // CANDY'S HOUSE: pink cottage with porch + white picket fence
  building(w, { id: 'candy', x0: -40, z0: 30, x1: -28, z1: 42, ceil: 4.4, ext: 0xfbcfe8, int: 0xfff7ed, trim: 0xffffff, floor: ['wood', 0xd8a26a], door: { side: 'n', a: -36, b: -32 }, doors2: [{ side: 's', a: -35, b: -32.5, h: 2.8 }], curtain: 0xff8fb1, shutters: 0xff4fa0, li: 20 });
  w.region = 'shell'; gable(w, -40, 30, -28, 42, 4.8, 0xff4fa0, 0xfbcfe8, { alongX: true, chimney: [-30.5, 38] });
  { const T = w.tf(-34, 0, 30, PI); T.slab('m', 0xffffff, 0, 0, 1.5, 8, 0.25, 3.0, 0.06, { cam: false }); [-3.6, 3.6].forEach((x) => T.add('g', cyl(12), 0xffffff, x, 0.25, 2.8, 0, 0, 0, 0.14, 3.0, 0.14)); T.add('g', rbox(8.4, 0.25, 3.3, 0.06), 0xff8fc8, 0, 3.25, 1.5, 0.12, 0, 0);
    sign3d(w, "CANDY'S HOUSE", -34, 3.65, 28.5, PI, 0.26, 0xffffff, 0xff4fa0); }
  // the mailbox
  { const T = w.tf(-30, 0, 28.6, PI); T.box('m', 0xffffff, 0, 0, 0, 0.12, 1.1, 0.12, 0.03); T.box('g', 0xff4fa0, 0, 1.1, 0, 0.45, 0.4, 0.7, 0.18); T.add('g', cyl(14), 0xff4fa0, 0, 1.5, 0, PI / 2, 0, 0, 0.225, 0.7, 0.225); sign3d(w, 'CANDY', -30.24, 1.2, 28.6, PI / 2, 0.08, 0xffffff, null); }
}
// ------------------------------------------------------------------------------------------------ Candy's backyard (fenced, doghouse, kiddie pool, dig spot for the finale)
function backyard(w) { const x0 = -44, x1 = -26, z0 = 42, z1 = 55;
  fenceRun(w, 'x', z1, x0, x1, 1.3, 0xffffff); fenceRun(w, 'z', x0, z0, z1, 1.3, 0xffffff); fenceRun(w, 'z', x1, z0, z1 - 4, 1.3, 0xffffff);
  // doghouse
  { const T = w.tf(-41, 0, 50, PI / 2); T.slab('m', 0xff8fc8, 0, 0, 0, 2.4, 1.6, 2.2, 0.08); T.box('m', 0x3a1f2b, 0, 0.0, 1.11, 0.9, 1.1, 0.04, 0.3); T.add('g', prism(2.8, 1.1, 2.6), 0xff4fa0, 0, 1.6, 0, 0, 0, 0);
    sign3d(w, 'CANDY', ...[T.P(0, 0, 1.15)[0]], 1.9, T.P(0, 0, 1.15)[2], T.ry, 0.13, 0xffffff, 0xff4fa0); }
  // kiddie pool + toys
  w.add('g', torus(0.35, 40), 0x38bdf8, -32, 0.3, 49, PI / 2, 0, 0, 1.4, 1.4, 1.2); w.add('e', rcyl(1.35, 0.3, 0.05, 40), 0x7dd3fc, -32, 0.02, 49); w.solid(-33.6, 0, 47.4, -30.4, 0.55, 50.6, { cam: false });
  K.hhY('ball', w, -36, 0, 46.5, 0.12, 1.5, 0xc6f432, 0xffffff); K.hhY('ball', w, -30, 0, 52.5, 0.12, 1.5, 0xff4fa0, 0xffffff); K.hh('dogBowl', w, -39, 47, 0.18, 0xff4fa0, 0x9a5b2d);
  [[-28.5, 44], [-43, 44]].forEach(([x, z]) => tree(w, x, z, 0.9, 1)); flowerBed(w, -43.5, 52.5, -40, 54.5); bush(w, -27.5, 53.5, 1.0);
  w.spots.dig = [-36, 0, 52]; w.add('m', blobGeo(7, 0.2, 2), 0x7a4a24, -36, 0.0, 52, 0, 0, 0, 0.9, 0.18, 0.9);
  bisc(w, -41, 2.9, 50); }
// ------------------------------------------------------------------------------------------------ Lookout Hill (north, behind Town Hall): ramps up to a telescope + bench; fire lookout tower stairs
function lookout(w) {
  // gentle stepped terraces (walkable) rising north
  const steps = 6; for (let i = 0; i < steps; i++) { const y = (i + 1) * 0.55, z0 = -46 - i * 2.6; w.add('m', rbox(18 - i * 1.4, y + 0.1, 2.8, 0.25, 2), i % 2 ? 0x5cbf4a : 0x63c44e, 0, y / 2 - 0.05, z0 - 1.3); w.solid(-(9 - i * 0.7), -1, z0 - 2.6, 9 - i * 0.7, y, z0); }
  const top = steps * 0.55, zt = -46 - steps * 2.6; w.add('m', blobGeo(3, 0.1, 2), 0x63c44e, 0, top - 1.2, zt - 3, 0, 0, 0, 9, 1.4, 5); w.solid(-6, -1, zt - 7, 6, top, zt);
  for (let i = 0; i < 3; i++) w.add('m', rbox(3, 0.12, 1.2, 0.04), 0xd6d3d1, 0, (i + 1) * 0.55 + 0.01, -46.6 - i * 2.6);
  bench(w, -2, zt - 3.2, 0, 0xff8a3d); { const x = 2.4, z = zt - 3.0; [-1, 0, 1].forEach((k) => w.add('x', cyl(8), 0x334155, x + Math.sin(k * 2.1) * 0.4, top, z + Math.cos(k * 2.1) * 0.4, -Math.cos(k * 2.1) * 0.25, 0, Math.sin(k * 2.1) * 0.25, 0.04, 1.3, 0.04));
    w.add('x', cyl(16), 0xd4a017, x, top + 1.35, z + 0.2, -1.2, 0, 0, 0.12, 1.2, 0.12); w.solid(x - 0.4, top, z - 0.4, x + 0.4, top + 1.3, z + 0.4);
    w.I({ kind: 'fun', id: 'scope', x, y: top, z: z + 0.9, r: 1.8, label: '🔭 Look through the telescope', msgs: ['🔭 You can see the whole town! Is that… a puppy in a party hat near Maple Lane?', '🔭 Paw Park looks like a giant paw print from up here!', '🔭 The Dog-Bus is doing its happy wiggle around the square.'] }); }
  tree(w, -6, zt - 4, 1.3, 1); tree(w, 6, zt - 5, 1.4, 0); flowerBed(w, -4, zt - 6.5, 4, zt - 5.5);
  w.secrets.push({ id: 'hill', x: 0, y: top, z: zt - 3, r: 2.5, msg: '🔭 Secret: Lookout Hill! The best view in Pup Town' }); bisc(w, 0, top + 0.6, zt - 5);
  // Fire lookout tower (outside the fire station, east side): stairs spiral up to a platform at y ~ 8
  { const cx = 44.5, cz = -17; const n = 18; for (let i = 0; i < n; i++) { const a = i / n * PI * 2 * 1.25 - PI / 2, y = 0.42 * (i + 1); const x = cx + Math.cos(a) * 1.8, z = cz + Math.sin(a) * 1.8;
      w.add('m', rbox(1.5, 0.14, 0.9, 0.04), 0xb45309, x, y - 0.07, z, 0, -a, 0); w.solid(x - 0.6, y - 0.14, z - 0.6, x + 0.6, y, z + 0.6, { cam: false }); }
    w.add('x', cyl(14), 0x7f1d1d, cx, 0, cz, 0, 0, 0, 0.4, 9.6, 0.4); w.solid(cx - 0.45, 0, cz - 0.45, cx + 0.45, 9.6, cz + 0.45, { cam: false });
    const py = 0.42 * n; w.add('m', rcyl(3.0, 0.25, 0.08, 32), 0xb45309, cx, py - 0.25, cz); w.solid(cx - 2.6, py - 0.25, cz - 2.6, cx + 2.6, py, cz + 2.6, { cam: false });
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; if (a > PI * 1.05 && a < PI * 1.45) continue; w.add('x', cyl(6), 0xdc2626, cx + Math.cos(a) * 2.9, py, cz + Math.sin(a) * 2.9, 0, 0, 0, 0.05, 1.0, 0.05); } w.add('x', torus(0.03, 48), 0xdc2626, cx, py + 1.0, cz, PI / 2, 0, 0, 2.9, 2.9, 2.9);
    w.add('g', cone(24), 0xdc2626, cx, py + 2.4, cz, 0, 0, 0, 3.2, 1.4, 3.2); [0, 1, 2, 3].forEach((k) => { const a = k * PI / 2 + PI / 4; w.add('x', cyl(6), 0x7f1d1d, cx + Math.cos(a) * 2.7, py, cz + Math.sin(a) * 2.7, 0, 0, 0, 0.06, 2.4, 0.06); });
    w.I({ kind: 'clue', id: 'clue_log', x: cx + 1.2, y: py, z: cz + 1.2, r: 2.2, label: "📓 Read Chief Sparky's lookout log" }); w.add('m', rbox(0.6, 0.08, 0.45, 0.02), 0x1e3a8a, cx + 1.2, py + 0.9, cz + 1.2); w.add('m', rbox(0.7, 0.85, 0.5, 0.05), 0x8b5a2b, cx + 1.2, py + 0.42, cz + 1.2); w.solid(cx + 0.85, py, cz + 0.95, cx + 1.55, py + 0.85, cz + 1.45, { cam: false });
    w.secrets.push({ id: 'tower', x: cx, y: py, z: cz, r: 2.6, msg: '🚒 Secret: the Fire Lookout! You can see Maple Lane from here' }); bisc(w, cx - 1.2, py + 0.6, cz - 1.2); bisc(w, cx + 1.8, 3.4, cz); }
}
