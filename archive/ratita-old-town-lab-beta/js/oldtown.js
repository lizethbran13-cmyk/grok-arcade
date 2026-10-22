// Ratita Rescue MEGA DLC "Old Town Lab" (#59): the abandoned lab on Old Town Street, built long ago by the villainous
// great-great-great-grandparents of Luna, Pi-rat and Snowie. Three dusty levels + a door in Ratita HQ.
// Unlocked by the Grok Arcade DLC Shop: localStorage 'grokDLC.ratita.you_choose' (same origin as the arcade).
import { BUILD } from './levels.js';
import { PR } from './lvlkit.js';
import { rbox } from './world.js';
import { rcyl, lathe, sph, cyl, torus, cone, capsule, gear, blobGeo } from './shapes.js';
import { S, persist } from './save.js';
import { sfx } from './audio.js';
import { panel, closePanel } from './ui.js';
import { esc } from './util.js';
const PI = Math.PI;
export const OT_KEY = 'grokDLC.ratita.you_choose';
export function ownsOldTown() {
  try { if (/\/(previews|archive)\//.test(location.pathname)) return true; if (localStorage.getItem(OT_KEY)) return true; const l = JSON.parse(localStorage.getItem('grokDLC.owned') || '[]'); return Array.isArray(l) && l.indexOf(OT_KEY) >= 0; } catch (e) { return false; }
}
export const OT_LEVELS = [
  { id: 'ot_hall', n: "Founders' Hall", icon: '🖼️', col: '#a78bfa', blurb: 'Dusty portraits, a creaky reception desk and a very old Sweep-o-Matic.' },
  { id: 'ot_goo', n: 'The Goo Works', icon: '🧪', col: '#84cc16', blurb: 'Bubbling vats, conveyor belts and floors you really should not touch.' },
  { id: 'ot_vault', n: "The Founders' Vault", icon: '🔐', col: '#f59e0b', blurb: 'Lasers, tesla coils and the ancestors\u2019 last machine. The final secret.' },
];
export const otOf = (id) => OT_LEVELS.find((l) => l.id === id);
export const isOTLevel = (id) => !!otOf(id);
const OP = () => (S.ot = S.ot || { done: {}, parts: {}, babies: {}, best: {}, intro: 0 });
const otOpen = (i) => i === 0 || !!OP().done[OT_LEVELS[i - 1].id];
// ---------------------------------------------------------------- props
const DUST = 0x8b8178, OLDWOOD = 0x6b4a2f, BRASS = 0xc9a24a, IRON = 0x4b5563, GOO = 0x84cc16, GOO2 = 0xa855f7;
function beaker(w, x, y, z, s = 1, liq = GOO) { w.add('e', lathe([[0, 0], [0.55, 0], [0.6, 0.1], [0.6, 1.4], [0.7, 1.55]], 18), 0xdff6ff, x, y, z, 0, 0, 0, s, s, s); w.add('l', rcyl(0.5, 0.8, 0.05, 16), liq, x, y + 0.05 * s, z, 0, 0, 0, s, s, s, 0.35); }
function flask(w, x, y, z, s = 1, liq = GOO2) { w.add('e', lathe([[0, 0], [0.75, 0.05], [0.8, 0.5], [0.25, 1.3], [0.22, 2], [0.3, 2.1]], 18), 0xdff6ff, x, y, z, 0, 0, 0, s, s, s); w.add('l', sph(14), liq, x, y + 0.42 * s, z, 0, 0, 0, 0.66 * s, 0.4 * s, 0.66 * s, 0.4); }
function tubeRack(w, x, y, z, ry = 0) { const T = w.tf(x, y, z, ry); T.box('m', OLDWOOD, 0, 0, 0, 3.2, 0.35, 1.0, 0.05); T.box('m', OLDWOOD, 0, 0.9, 0, 3.2, 0.2, 1.0, 0.05); [GOO, GOO2, 0xf43f5e, 0x38bdf8, 0xfacc15].forEach((c, i) => { T.add('e', capsule(10), 0xe0f2fe, -1.2 + i * 0.6, 0.85, 0, 0, 0, 0, 0.17, 0.75, 0.17); T.add('l', capsule(10), c, -1.2 + i * 0.6, 0.55, 0, 0, 0, 0, 0.13, 0.4, 0.13, 0.35); }); }
// lab bench (top at H): dark top, cupboard doors, glassware
function bench(w, x, z, ry, L, D, H, glass = true) { const T = w.tf(x, 0, z, ry); T.slab('m', 0x5b4636, 0, 0, 0, L, H - 0.4, D, 0.15); T.slab('m', 0x1f2937, 0, H - 0.4, 0, L + 0.4, 0.4, D + 0.4, 0.08);
  for (let i = 0; i < Math.floor(L / 3); i++) { const a = -L / 2 + 1.5 + i * 3; T.box('m', 0x6b5443, a, 0.5, D / 2 + 0.03, 2.6, H - 1.6, 0.08, 0.04); T.box('x', BRASS, a + 0.9, H * 0.5, D / 2 + 0.12, 0.15, 0.6, 0.12, 0.04); }
  if (glass) { const Wd = (u, v) => T.P(u, H, v); for (let i = 0; i < Math.floor(L / 4); i++) { const u = -L / 2 + 2 + i * 4, v = (i % 2 ? 0.25 : -0.25) * D; const [px, py, pz] = Wd(u, v); if (i % 3 === 0) beaker(w, px, py, pz, 1.1, [GOO, GOO2, 0x38bdf8][i % 3]); else if (i % 3 === 1) flask(w, px, py, pz, 1, [GOO2, 0xf43f5e, GOO][i % 3]); else { const [qx, , qz] = Wd(u, 0); tubeRack(w, qx, py, qz, ry); } } } }
// glass vat with glowing goo; top rim is a platform, goo surface hurts
function vat(w, x, z, r, h, liq = GOO, rim = true) { w.add('x', rcyl(r + 0.4, 1.2, 0.2, 32), IRON, x, 0, z); w.add('e', rcyl(r, h - 1.6, 0.1, 32), 0xcffafe, x, 1.2, z); w.add('l', rcyl(r - 0.25, (h - 1.6) * 0.72, 0.1, 28), liq, x, 1.25, z, 0, 0, 0, 1, 1, 1, 0.4);
  w.add('x', torus(0.25, 40), BRASS, x, h - 0.4, z, PI / 2, 0, 0, r + 0.15, r + 0.15, 1.6); w.add('x', torus(0.25, 40), BRASS, x, 1.3, z, PI / 2, 0, 0, r + 0.2, r + 0.2, 1.6);
  for (let i = 0; i < 4; i++) { const a = i * PI / 2 + 0.4; w.add('x', cyl(8), IRON, x + Math.cos(a) * (r + 0.1), 1.2, z + Math.sin(a) * (r + 0.1), 0, 0, 0, 0.12, h - 1.6, 0.12); }
  w.solid(x - r * 0.75, 0, z - r * 0.75, x + r * 0.75, h - 0.4, z + r * 0.75, rim ? undefined : { hot: true });
  for (let i = 0; i < 3; i++) w.add('l', sph(10), 0xffffff, x + (i - 1) * r * 0.35, 1.8 + i * (h - 3) * 0.3, z + r * 0.4, 0, 0, 0, 0.18, 0.18, 0.18, 0.5); }
function pipeRun(w, x0, y, z0, x1, z1, r = 0.45, col = 0x8b9198) { const L = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(z1 - z0, x1 - x0); w.add('x', cyl(12), col, (x0 + x1) / 2, y, (z0 + z1) / 2, 0, -a, PI / 2, r, L, r);
  for (let t = 0.1; t < 1; t += 0.2) w.add('x', torus(0.3, 20), BRASS, x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t, 0, -a + PI / 2, 0, r + 0.08, r + 0.08, 0.6); }
function vertPipe(w, x, z, y0, y1, r = 0.45, col = 0x8b9198) { w.add('x', cyl(12), col, x, y0, z, 0, 0, 0, r, y1 - y0, r); w.add('x', rcyl(r * 1.8, 0.8, 0.1, 16), IRON, x, y1 - 0.4, z); w.add('l', rcyl(r * 1.1, 0.5, 0.05, 14), 0xef4444, x + r + 0.4, (y0 + y1) / 2, z, 0, 0, PI / 2, 1, 1, 1, 0.3); }
function cabinet(w, x, z, ry, H = 9) { const T = w.tf(x, 0, z, ry); T.slab('m', 0x64748b, 0, 0, 0, 3.6, H, 3, 0.15); for (let i = 0; i < 3; i++) { T.box('m', 0x7c8796, 0, 0.6 + i * (H - 1) / 3, 1.53, 3.2, (H - 1) / 3 - 0.4, 0.08, 0.05); T.box('x', BRASS, 0, 0.6 + i * (H - 1) / 3 + (H - 1) / 6 - 0.4, 1.62, 1.1, 0.18, 0.15, 0.06); T.box('g', 0xfef9c3, 0, 0.6 + i * (H - 1) / 3 + (H - 1) / 6, 1.6, 0.9, 0.4, 0.04, 0.02); }
  T.box('g', 0xf5f0dc, 0.3, H + 0.15, 0.2, 2, 0.3, 1.5, 0.05); T.box('g', 0xe7dfc6, 0.1, H + 0.45, 0.1, 1.8, 0.3, 1.3, 0.05); }
function chalkboard(w, axis, at, c, y, W, H, side, lines) { const T = axis === 'x' ? w.tf(c, y, at, side > 0 ? 0 : PI) : w.tf(at, y, c, side > 0 ? PI / 2 : -PI / 2);
  T.box('m', OLDWOOD, 0, 0, 0.2, W + 0.6, H + 0.6, 0.3, 0.08); T.box('m', 0x22392f, 0, 0.3, 0.38, W, H, 0.06, 0.02); T.box('m', OLDWOOD, 0, -0.1, 0.7, W, 0.25, 0.7, 0.05);
  for (let i = 0; i < lines; i++) { const ww = W * (0.35 + ((i * 37) % 50) / 100); T.box('g', 0xe5e7eb, -W / 2 + 0.6 + ww / 2, H - 0.6 - i * (H - 1) / lines, 0.43, ww, 0.12, 0.02, 0.02); }
  T.add('g', torus(0.1, 28), 0xe5e7eb, W * 0.32, H * 0.45, 0.43, 0, 0, 0, H * 0.18, H * 0.18, 1); T.add('g', sph(10), 0xe5e7eb, W * 0.32, H * 0.45, 0.43, 0, 0, 0, 0.25, 0.25, 0.05); }
// ancestor portrait: gilded frame + a villainous rat in a top hat / bicorne / monocle
const ANC = { luna: { fur: 0xb8a48a, belly: 0xefe2cc, hat: 'top', name: 'Countess Lunaria', bg: 0x4c1d95 }, pirat: { fur: 0x6b5b4d, belly: 0xd6c3a5, hat: 'bicorne', name: 'Admiral Pirattus', bg: 0x7f1d1d }, snow: { fur: 0xf3f4f6, belly: 0xffffff, hat: 'monocle', name: 'Baron Snowbert', bg: 0x0f3a5f } };
function portrait(w, axis, at, c, y, W, H, side, who) { const A = ANC[who]; const T = axis === 'x' ? w.tf(c, y, at, side > 0 ? 0 : PI) : w.tf(at, y, c, side > 0 ? PI / 2 : -PI / 2);
  T.box('x', BRASS, 0, 0, 0.25, W, H, 0.4, 0.12); T.box('m', A.bg, 0, 0.45, 0.47, W - 0.9, H - 0.9, 0.05, 0.02); const hy = H * 0.45, s = W * 0.17;
  T.add('g', sph(16), 0x111827, 0, 0.45, 0.5, 0, 0, 0, s * 1.9, H * 0.28, 0.2); // coat
  T.add('g', sph(16), A.fur, 0, hy, 0.6, 0, 0, 0, s, s * 0.95, 0.35); T.add('g', sph(14), A.belly, 0, hy - s * 0.35, 0.82, 0, 0, 0, s * 0.55, s * 0.45, 0.2);
  [-1, 1].forEach((k) => { T.add('g', sph(14), A.fur, k * s * 0.85, hy + s * 0.85, 0.55, 0, 0, 0, s * 0.5, s * 0.5, 0.15); T.add('g', sph(12), 0xf9a8d4, k * s * 0.85, hy + s * 0.85, 0.65, 0, 0, 0, s * 0.3, s * 0.3, 0.1); T.add('g', sph(10), 0x111827, k * s * 0.38, hy + s * 0.15, 0.92, 0, 0, 0, s * 0.13, s * 0.16, 0.08);
    T.box('g', 0xdc2626, k * s * 0.38, hy + s * 0.42, 0.95, s * 0.35, 0.08, 0.04, 0.02, 0, 0, k * 0.5); });
  T.add('g', sph(10), 0xf472b6, 0, hy - s * 0.15, 1.0, 0, 0, 0, s * 0.14, s * 0.12, 0.1); T.box('g', 0x1f2937, 0, hy - s * 0.42, 0.96, s * 0.6, 0.06, 0.04, 0.02); // sneer
  if (A.hat === 'top') { T.box('g', 0x111827, 0, hy + s * 1.0, 0.6, s * 1.6, 0.15, 0.3, 0.05); T.box('g', 0x111827, 0, hy + s * 1.5, 0.6, s * 1.0, s * 1.0, 0.3, 0.06); T.box('g', 0x7c3aed, 0, hy + s * 1.1, 0.78, s * 1.02, 0.2, 0.05, 0.02); }
  else if (A.hat === 'bicorne') { T.add('g', sph(16), 0x111827, 0, hy + s * 1.05, 0.6, 0, 0, 0, s * 1.3, s * 0.45, 0.25); T.add('g', sph(10), 0xffffff, 0, hy + s * 1.15, 0.82, 0, 0, 0, s * 0.2, s * 0.2, 0.05); }
  else { T.add('x', torus(0.06, 24), BRASS, s * 0.38, hy + s * 0.15, 0.98, 0, 0, 0, s * 0.25, s * 0.25, 1); T.add('x', cyl(6), BRASS, s * 0.55, hy - s * 0.4, 0.97, 0, 0, 0.3, 0.03, s * 0.6, 0.03); T.box('g', 0x111827, 0, hy - s * 1.0, 0.75, s * 0.6, s * 0.25, 0.1, 0.04); }
  T.box('x', BRASS, 0, -H / 2 - 0.5 + 0.45, 0.5, W * 0.6, 0.55, 0.1, 0.05); }
function teslaCoil(w, x, z, h = 7) { w.slab('x', IRON, x, 0, z, 2.4, 0.8, 2.4, 0.2); w.add('m', cyl(14), 0xb45309, x, 0.8, z, 0, 0, 0, 0.55, h - 1.6, 0.55); for (let i = 0; i < 8; i++) w.add('x', torus(0.08, 18), 0xd97706, x, 1.2 + i * (h - 2.4) / 8, z, PI / 2, 0, 0, 0.62, 0.62, 1);
  w.add('x', torus(0.3, 32), 0xd1d5db, x, h, z, PI / 2, 0, 0, 1.2, 1.2, 1.4); w.add('l', sph(14), 0xa5f3fc, x, h + 0.2, z, 0, 0, 0, 0.5, 0.5, 0.5, 0.9); w.solid(x - 0.6, 0, z - 0.6, x + 0.6, h, z + 0.6); w.lights.push({ x, y: h + 1, z, c: 0x67e8f9, i: 10, d: 12 });
  w.anims.push(() => { if (Math.random() < 0.06 && w.game) for (let k = 0; k < 6; k++) w.game.fx.emit(x, h + 0.3, z, (Math.random() - 0.5) * 8, Math.random() * 4, (Math.random() - 0.5) * 8, 0.04, 0x67e8f9, 0.35, 0, 0); }); }
function cobweb(w, x, y, z, ry, s = 2) { const T = w.tf(x, y, z, ry); for (let i = 0; i < 5; i++) T.add('e', cyl(4), 0xf1f5f9, 0, 0, 0, 0, 0, PI / 2 + (i - 2) * 0.32, 0.02, s * 1.6, 0.02); for (let r = 1; r <= 3; r++) T.add('e', torus(0.04, 20), 0xf1f5f9, 0, 0, 0, 0, 0, 0, s * r * 0.17, s * r * 0.17, 0.15); }
function dustPile(w, x, z, s = 1) { w.add('m', blobGeo(((x * 7 + z * 3) | 0) & 7, 0.3, 1), DUST, x, 0.02, z, 0, x, 0, 1.4 * s, 0.25 * s, 1.1 * s); }
function gooPuddle(w, x, z, rx, rz, col = GOO) { w.add('l', rcyl(1, 0.12, 0.05, 28), col, x, 0.01, z, 0, 0, 0, rx, 1, rz, 0.3); w.hot(x - rx * 0.7, -0.5, z - rz * 0.7, x + rx * 0.7, 0.13, z + rz * 0.7); }
function papers(w, cx, cz, W, D, n, seed) { for (let i = 0; i < n; i++) { const a = (i * 97 + seed * 13) % 100 / 100, b = (i * 61 + seed * 29) % 100 / 100; w.add('g', rbox(1.3, 0.04, 1.7, 0.01), [0xf5f0dc, 0xe7dfc6, 0xfef9c3][i % 3], cx + (a - 0.5) * W, 0.03, cz + (b - 0.5) * D, 0, a * 6, 0); } }
function grandClock(w, x, z) { w.slab('m', 0x4a2e1a, x, 0, z, 2.6, 13, 1.8, 0.2); w.add('x', rcyl(1.0, 0.2, 0.05, 28), 0xf5f0dc, x, 10.5, z + 0.9, PI / 2, 0, 0); w.add('x', torus(0.1, 28), BRASS, x, 10.5, z + 1.0, 0, 0, 0, 1.05, 1.05, 1); w.add('g', rbox(0.1, 0.8, 0.05, 0.02), 0x111827, x, 10.7, z + 1.05, 0, 0, 0.6); w.add('e', rbox(1.6, 5, 0.1, 0.05), 0xdff6ff, x, 5, z + 0.92); w.add('x', cyl(8), BRASS, x, 3.5, z + 0.6, 0, 0, 0, 0.06, 4, 0.06); w.add('x', rcyl(0.6, 0.15, 0.05, 20), BRASS, x, 3.6, z + 0.6, PI / 2, 0, 0); w.add('m', cone(4), 0x4a2e1a, x, 13, z, 0, PI / 4, 0, 1.6, 1.2, 1.2); }
function sign(w, x, y, z, ry, W, col = 0x7c2d12) { const T = w.tf(x, y, z, ry); T.box('m', col, 0, 0, 0, W, 1.4, 0.2, 0.08); for (let i = 0; i < Math.floor(W / 0.9); i++) T.box('x', BRASS, -W / 2 + 0.6 + i * 0.85, 0.45, 0.12, 0.5, 0.5, 0.05, 0.1); }
function crateStack(w, x, z, n = 2, ry = 0) { for (let i = 0; i < n; i++) PR.cardboard(w, x + (i % 2) * 0.4, i * 3, z, ry + i * 0.2, 3.4, 3, 3.4); }
function stoolRow(w, x0, z, n, dx = 3.5) { for (let i = 0; i < n; i++) PR.stool(w, x0 + i * dx, z, i, 4, 0x57534e); }
const P = (w, x, top, z, sx, sz, col, th = 0.8, b = 'm') => w.slab(b, col, x, top - th, z, sx, th, sz, Math.min(0.3, th / 2 - 0.02));
const DIM = { sunColor: 0xe9e1ff, sunI: 1.6, hemiSky: 0xd8cff0, hemiGround: 0x5b4b3a, hemiI: 0.7, fog: 0x4a4458, fogD: 0.006, exposure: 0.92, bloomT: 0.95, bloomS: 0.5 };
function lab(w, W, D, H, wall, wallN) { w.room(W, D, H, { wall, wallN: wallN || wall, ceil: 0x57534e, floor: (a, b, c, d) => PR.floorTiles(w, a, b, c, d, 0, 0x9ca3a0, 0x6b7270) }); w.env = DIM; w.camDist = 6.6; w.music = 'attic'; w.gadgets = ['blaster', 'glider', 'grapple', 'magnet', 'jet'];
  // wainscot + flickering lamps
  w.add('m', rbox(W, 2.4, 0.3, 0.05), 0x3f2d20, 0, 1.2, -D / 2 + 0.05); w.add('m', rbox(W, 2.4, 0.3, 0.05), 0x3f2d20, 0, 1.2, D / 2 - 0.05); w.add('m', rbox(0.3, 2.4, D, 0.05), 0x3f2d20, -W / 2 + 0.05, 1.2, 0); w.add('m', rbox(0.3, 2.4, D, 0.05), 0x3f2d20, W / 2 - 0.05, 1.2, 0);
  [-W / 3, W / 3].forEach((x) => { w.add('x', cyl(6), IRON, x, H - 3, -D / 4, 0, 0, 0, 0.05, 3, 0.05); w.add('g', cone(16), 0x166534, x, H - 3.4, -D / 4, 0, 0, 0, 1.4, 0.8, 1.4); w.add('l', sph(12), 0xfff3c4, x, H - 3.6, -D / 4, 0, 0, 0, 0.5, 0.4, 0.5, 1); w.lights.push({ x, y: H - 4.5, z: -D / 4, c: 0xffe7a8, i: 34, d: 40 }); }); }
// pet cameos: Candy (dog guard, wakes up if you're loud) and Torty (Martina, the plate helper)
// ---------------------------------------------------------------- 1. FOUNDERS' HALL
BUILD.ot_hall = (w) => { lab(w, 64, 48, 24, 0x8a7a8f, 0x6d5f7a); const ok = w;
  w.start = [2, 0, 21]; w.startYaw = PI; w.cp(2, 0, 20, PI);
  w.hint(-8, 12, 8, 24, '🏚️ The old lab on Old Town Street! Someone\u2019s family portraits are on the wall...');
  // north wall portrait gallery of the three villainous ancestors
  portrait(w, 'x', -23.4, -14, 16, 8, 10, 1, 'luna'); portrait(w, 'x', -23.4, 0, 17, 9, 11, 1, 'pirat'); portrait(w, 'x', -23.4, 14, 16, 8, 10, 1, 'snow');
  sign(w, 0, 22.6, -23.3, 0, 18); papers(w, 0, 0, 30, 20, 26, 3);
  bench(w, -18, -1, 0, 10, 4, 6); bench(w, 22, 8, PI / 2, 10, 4, 6); w.crumbLine(-22, 6, -1, -14, 6, -1, 4); w.heartP(22, 6, 6); grandClock(w, -6, -21.5); grandClock(w, 26, -21.5); w.hint(-20, -22, 20, -12, '🖼️ "The Founders: Countess Lunaria, Admiral Pirattus, Baron Snowbert." Great-great-great-grandma looks... grumpy.');
  // reception desk (climb start) with bell, ledger, typewriter
  { const T = w.tf(0, 0, 4); T.slab('m', 0x5b3a24, 0, 0, 0, 16, 4.5, 4, 0.2); T.slab('m', 0x3f2716, 0, 4.5, 0, 16.6, 0.4, 4.6, 0.08); T.box('x', BRASS, -5, 5.2, 0.5, 1.2, 0.7, 1.2, 0.3); T.box('g', 0xf5f0dc, 2, 5.05, -0.4, 3, 0.2, 2.2, 0.05); T.box('g', 0x7f1d1d, 2, 5.15, -0.4, 1.4, 0.14, 2.2, 0.04); T.box('m', 0x1f2937, 5.6, 5.3, 0, 2.6, 1.2, 2, 0.2); }
  PR.stool(w, -3, 7.5, 0, 3, 0x57534e); w.crumbLine(-3, 3, 7.5, -3, 4.9, 4, 3); w.crumbLine(-7, 4.9, 4, 7, 4.9, 4, 7); w.cheese(-6.5, 4.9, 4.5); w.enemy('nut', 3, 4.9, 4, { axis: 'x', range: 3 });
  // trophy cases (east) and dusty bookshelves (west)
  PR.bookshelf(w, 29, -10, -PI / 2, 12, 14, 3.4, OLDWOOD); PR.bookshelf(w, 29, 6, -PI / 2, 12, 14, 3.4, OLDWOOD);
  for (let i = 0; i < 4; i++) { w.add('x', gear(14), BRASS, 28.6, 9.2 + (i % 2) * 4.6, -14 + i * 2.4, 0, PI / 2, 0, 0.9, 0.9, 0.5); flask(w, 28.4, 4.8 + (i % 2) * 4.6, 3 + i * 2, 0.9); }
  w.part(28, 14, -10); w.crumbLine(28.6, 14, -14, 28.6, 14, -6, 4); w.hook(25, 17, -2);
  cabinet(w, -29.5, -16, PI / 2, 10); cabinet(w, -29.5, -12, PI / 2, 10); cabinet(w, -29.5, -8, PI / 2, 8); P(w, -27.5, 6, 0, 3, 10, OLDWOOD); P(w, -27.5, 13, 8, 3, 8, OLDWOOD);
  w.crumbArc(-27.5, 6, 2, -27.5, 8, -8, 3, 4); w.crumbLine(-29.5, 10.3, -16, -29.5, 10.3, -12, 3); w.baby(-29.5, 10.3, -16); w.part(-27.5, 13, 9); w.cheese(-29.5, 8.3, -8);
  w.enemy('dust', -24, 0, -4, { axis: 'z', range: 6 }); w.cp(-27.5, 6, 2, 0);
  // central exhibition: a glass dome with a mysterious machine on a plinth
  { const x = -8, z = -10; w.slab('x', 0x44403c, x, 0, z, 7, 2.4, 7, 0.3); w.add('e', sph(28), 0xe0f2fe, x, 2.4, z, 0, 0, 0, 3, 3.6, 3); w.add('x', gear(16), BRASS, x, 4.4, z, 0, 0, 0, 1.4, 1.4, 0.4); w.add('l', sph(14), GOO2, x, 4.4, z + 0.3, 0, 0, 0, 0.5, 0.5, 0.5, 0.8); w.solid(x - 2.6, 2.4, z - 2.6, x + 2.6, 6, z + 2.6);
    w.crumbRing(x, 6, z, 1.5, 5); w.part(x, 6, z); sign(w, x, 0.9, z + 3.6, 0, 5); }
  // stairway of crates + bench to the mezzanine
  bench(w, 12, -6, 0, 12, 4, 6); crateStack(w, 18.5, -1, 2); P(w, 12, 11, -18, 22, 6, 0x4b3a2f); w.solid(1, 0, -21, 23, 11, -15, { cam: false });
  for (let i = 0; i < 5; i++) w.add('x', cyl(8), IRON, 2 + i * 5, 0, -15.3, 0, 0, 0, 0.18, 10.2, 0.18);
  w.hook(16, 14.5, -12); w.crumbLine(12, 6, -6, 16, 6, -6, 3); w.cheese(8, 6, -6.5); w.cp(12, 6, -6, PI);
  w.hint(6, -10, 22, 0, '🪝 Hook up to the mezzanine! The lever for the old storeroom is up there.', 4, 30);
  // mezzanine: lever, baby, tube racks
  w.lever('hall', 4, 11, -18, 0); w.baby(20, 11, -19); tubeRack(w, 9, 11, -20.2); tubeRack(w, 14, 11, -20.2); flask(w, 17, 11, -20, 1.2); w.crumbLine(19, 11, -18, 6, 11, -18, 6); w.enemy('nut', 12, 11, -17, { axis: 'x', range: 5 });
  // Candy cameo: asleep on a dusty rug; wake her and she chases you out
  PR.rug(w, 21, 18, 0, 10, 6, 0x7f1d1d, 0xb45309); w.candySpec = { x: 21, z: 18, yaw: -PI / 2, sleep: true, path: [[14, 20], [28, 20], [28, 14], [14, 14]], bounds: [12, 12, 31, 23], maxY: 1.6 };
  w.hint(14, 12, 30, 23, '🐶 Shh, Candy is napping here. If she wakes up she\u2019ll chase you around!', -1, 4); PR.dogBowl(w, 27, 21);
  // dusty clutter + webs
  [[-18, 14], [-14, 18], [22, 18], [26, -20], [-24, 18], [-10, 16], [8, -12]].forEach(([x, z], i) => dustPile(w, x, z, 0.8 + (i % 3) * 0.3)); cobweb(w, -31, 22, -23, PI / 4, 3); cobweb(w, 31, 22, -23, -PI / 4, 3); cobweb(w, -31, 22, 23, 3 * PI / 4, 2.5);
  stoolRow(w, -20, 18, 3); crateStack(w, 24, 18, 3, 0.3); PR.plant(w, -30, 0, 21, 1.4, 0x78716c, 0x4d7c0f); PR.clock(w, 'z', 31.4, 12, 15, -1);
  // boss pen (west-south), gated
  const bc = 0x57534e; w.slab('m', bc, -16, 0, 6, 30, 4, 1.2, 0.2); w.slab('m', bc, -1.4, 0, 14.8, 1.2, 4, 3.4, 0.2); w.slab('m', bc, -1.4, 0, 22.3, 1.2, 4, 3.4, 0.2);
  w.door('hall', -1.4, 0, 18.6, 1.2, 4, 4.2, ['hall'], 0x7c3aed, '🧹 The storeroom creaks open... something old is still switched on!');
  w.hint(-4, 8, 0, 24, '🔒 Storeroom locked. Pull the lever up on the mezzanine!', -1, 6); w.cheese(-26, 0, 20); w.heartP(-6, 0, 16);
  w.bossSpec = { type: 'vac', x: -16, y: 0, z: 15, yaw: PI / 2, arena: [-30, 7.5, -3, 23], D: { n: 'Sweep-o-Matic 1899' } }; w.goldPos = [-16, 1.6, 15];
};
// ---------------------------------------------------------------- 2. THE GOO WORKS
BUILD.ot_goo = (w) => { lab(w, 72, 54, 28, 0x5f6f5a, 0x4d5a49);
  w.start = [-30, 0, 22]; w.startYaw = PI * 0.85; w.cp(-30, 0, 21, PI);
  w.hint(-36, 14, -22, 27, '🧪 The Goo Works! Don\u2019t touch the green goo. It stings and sends you back!');
  // goo channel across the room (hot floor) with a conveyor belt crossing it
  w.add('m', rbox(64, 0.4, 7, 0.1), 0x1f2937, 0, -0.18, 6); w.add('l', rbox(62, 0.1, 6, 0.05), GOO, 0, 0.06, 6, 0, 0, 0, 1, 1, 1, 0.35); w.hot(-31, -0.5, 3, 31, 0.15, 9);
  for (let i = 0; i < 8; i++) w.add('l', sph(10), 0xd9f99d, -28 + i * 8, 0.18, 5 + (i % 3), 0, 0, 0, 0.5, 0.2, 0.5, 0.5);
  w.mover(-18, 0.6, 6, [4, 0.6, 3.4], [0, 0, 5], 4, 0, 0x374151, (T, sub, sz) => { T.box('m', 0x374151, 0, 0, 0, sz[0], sz[1], sz[2], 0.15); for (let i = 0; i < 4; i++) T.box('x', 0x6b7280, -1.5 + i, sz[1], 0, 0.15, 0.05, sz[2], 0.02); });
  w.slab('m', 0x374151, 10, 0, 6, 3, 1.4, 1.6, 0.2); w.slab('m', 0x374151, 14, 0, 6, 3, 1.4, 1.6, 0.2); w.crumbArc(-24, 0, 14, -18, 1.2, 6, 2, 4); w.cp(-20, 0, -1, PI);
  w.hint(-30, 0, 0, 12, '🛤️ Ride the old cart across the goo! Mind the drop.', -1, 8);
  // big vats in a row (climb the rims)
  vat(w, -22, -12, 3.2, 8, GOO); vat(w, -12, -14, 3.6, 11, GOO2); vat(w, 0, -16, 3.2, 14, GOO); vat(w, 12, -16, 4, 17, 0xf97316);
  P(w, -17, 8, -12, 4, 2.4, IRON); P(w, -6, 11, -15, 5, 2.4, IRON); P(w, 6, 14, -16, 5, 2.4, IRON);
  w.crumbLine(-22, 7.6, -12, -12, 10.6, -14, 4); w.part(-12, 10.6, -14); w.baby(0, 13.6, -16); w.cheese(12, 16.6, -16); w.cp(-22, 7.6, -12, 0);
  w.fan(-27, 0, -6, 1.6, 9, 30); w.hint(-31, -10, -22, -2, '💨 A steam vent! Stand on it to float up to the first vat.', -1, 12);
  w.hook(18, 21, -16); vertPipe(w, -30, -24, 0, 27); vertPipe(w, 30, -24, 0, 27); pipeRun(w, -30, 24, -24, 30, -24); pipeRun(w, -30, 20, -22, -30, 26, 0.35, 0x7c8796);
  // Torty (Martina) cameo: she holds the pressure plate that drains the overflow
  w.martinaSpec = { x: 26, z: -8, yaw: -PI / 2, path: [[24, -2], [22, 2]], plate: 'drain', say: 'Hi! I\u2019m Torty. I\u2019ll sit on the drain plate for you!', name: 'Torty', name2: 'Torty' }; w.plate('drain', 22, 0, 2, 1.6, GOO);
  w.door('drain', 24, 0, 14, 12, 3, 1.4, ['drain'], 0x65a30d, '🐢 Torty drained the overflow! The control room is open.');
  w.hint(16, -12, 31, 4, '🐢 Ask Torty to sit on the plate! (walk up to her)', -1, 10);
  // control room (south-east): consoles, chalkboard plans, lever
  bench(w, 24, 22, PI, 12, 3.4, 5, false); for (let i = 0; i < 6; i++) { w.add('l', rcyl(0.3, 0.2, 0.05, 12), [0xef4444, GOO, 0xfacc15][i % 3], 19.5 + i * 1.8, 5.05, 22.5, PI / 2, 0, 0, 1, 1, 1, 0.8); w.add('x', cyl(6), IRON, 19.5 + i * 1.8, 5, 21.8, 0.5, 0, 0, 0.06, 1.2, 0.06); }
  chalkboard(w, 'x', 26.4, 24, 9, 12, 6, -1, 5); w.lever('goo', 31, 0, 18, -PI / 2); w.part(17, 5, 22); w.cp(24, 0, 16, PI);
  w.hint(16, 15, 32, 27, '📜 The chalkboard says: "PLAN: TURN ALL OLD TOWN CHEESE INTO GOO." Yikes, great-great-great-grandpa!', -1, 10);
  // west: storage + mezzanine
  cabinet(w, -33.5, -18, PI / 2, 11); cabinet(w, -33.5, -14, PI / 2, 9); crateStack(w, -32, 12, 2); crateStack(w, -26, 13, 1); bench(w, -10, 20, PI, 14, 4, 6); stoolRow(w, -15, 16.5, 4);
  P(w, -10, 6, 20, 1, 1, 0x1f2937, 0.1); w.crumbLine(-16, 6, 20, -4, 6, 20, 5); w.baby(-4, 6, 20.5); w.part(-32, 9, -14); w.enemy('dust', -6, 0, 13, { axis: 'x', range: 7 }); w.enemy('nut', -10, 6, 20, { axis: 'x', range: 5 });
  // goo puddles + barrels
  [[-4, 0], [6, -4], [-24, 0], [20, -6]].forEach(([x, z], i) => gooPuddle(w, x, z, 2 + (i % 2), 1.6, i % 2 ? GOO2 : GOO)); for (let i = 0; i < 4; i++) PR.can(w, 28 + (i % 2) * 2.4, 0, -20 + i * 1.6, [0x166534, 0x4d7c0f][i % 2], 3, 1.1);
  cobweb(w, -35, 26, -26, PI / 4, 3); cobweb(w, 35, 26, 26, -3 * PI / 4, 3); [[-20, 24], [6, 24], [30, 10]].forEach(([x, z]) => dustPile(w, x, z, 1)); w.heartP(4, 0, 14); w.cheese(-33, 0, 0);
  // boss arena south-centre, gated by the lever + plate
  w.door('goo', 4, 0, 18, 1.2, 4, 8, ['goo'], 0xa855f7, '🧪 The sprayer room hisses open...'); w.slab('m', IRON, 4, 0, 24.5, 1.2, 4, 5, 0.2);
  w.bossSpec = { type: 'sprinkler', x: -8, y: 0, z: 18, yaw: 0, arena: [-24, 10, 3, 27], D: { n: 'Gloop the Goo-Sprayer', proj: GOO } }; w.goldPos = [-8, 1.6, 18];
};
// ---------------------------------------------------------------- 3. THE FOUNDERS' VAULT
BUILD.ot_vault = (w) => { lab(w, 66, 56, 30, 0x4a4560, 0x3b3550); w.music = 'toys';
  w.start = [0, 0, 24]; w.startYaw = PI; w.cp(0, 0, 23, PI);
  w.hint(-8, 18, 8, 28, '🔐 The Founders\u2019 Vault. Their biggest secret is behind the round door.');
  // giant round vault door on the north wall
  { const z = -27.2; w.add('x', rcyl(9, 1.4, 0.3, 48), 0x9ca3af, 0, 10, z, PI / 2, 0, 0); w.add('x', rcyl(7, 1.8, 0.3, 48), 0xd1d5db, 0, 10, z + 0.3, PI / 2, 0, 0); w.add('x', gear(20), BRASS, 0, 10, z + 1.3, PI / 2, 0, 0, 3.4, 3.4, 0.5);
    for (let i = 0; i < 6; i++) { const a = i * PI / 3; w.add('x', cyl(10), IRON, Math.cos(a) * 2.8, 10 + Math.sin(a) * 2.8, z + 1.6, 0, 0, a + PI / 2, 0.22, 3.2, 0.22); } w.add('l', sph(16), 0xfacc15, 0, 10, z + 1.9, 0, 0, 0, 0.8, 0.8, 0.4, 0.8); }
  portrait(w, 'x', -27.6, -22, 12, 8, 10, 1, 'snow'); portrait(w, 'x', -27.6, 22, 12, 8, 10, 1, 'luna'); portrait(w, 'z', -32.4, -8, 13, 9, 11, 1, 'pirat');
  // tesla coils + laser fence (hot thin beams) protecting the vault apron
  teslaCoil(w, -12, -18, 8); teslaCoil(w, 12, -18, 8);
  for (let i = 0; i < 3; i++) { const y = 0.5 + i * 1.4; const s = w.door('lz' + i, 0, y, -12, 19.2, 0.22, 0.22, ['v1', 'v2', 'v3'], 0xff2d55, i ? null : '🔕 Lasers OFF! The vault apron is open... and something is waking up.'); s.hot = true; w.doors[w.doors.length - 1].h = y + 1; }
  [-10, 10].forEach((x) => { w.slab('x', IRON, x, 0, -12, 0.8, 5, 0.8, 0.2); w.add('l', sph(10), 0xff2d55, x, 5.2, -12, 0, 0, 0, 0.3, 0.3, 0.3, 1); });
  w.hint(-12, -14, 12, -8, '🔴 Lasers! Touch one and you\u2019ll get zapped back. Turn them off with the three switches.', -1, 8);
  // laser control: three levers (west tower, east shelves, centre blueprint table)
  // west: filing tower climb
  cabinet(w, -30, 8, PI / 2, 8); cabinet(w, -30, 4, PI / 2, 12); cabinet(w, -30, 0, PI / 2, 16); P(w, -26, 16, -6, 6, 6, OLDWOOD); w.lever('v1', -26, 16, -7, 0);
  w.crumbLine(-30, 8.3, 8, -30, 16.3, 0, 5); w.baby(-25, 16, -4.5); w.cp(-30, 8.3, 8, 0); w.enemy('nut', -26, 16, -6, { axis: 'x', range: 2 });
  // east: shelves of jars & a hanging-hook route
  PR.bookshelf(w, 31, 4, -PI / 2, 16, 18, 3.4, OLDWOOD); for (let i = 0; i < 5; i++) { beaker(w, 30.6, 5 + (i % 3) * 4.4, -2 + i * 3, 1, [GOO, GOO2, 0x38bdf8][i % 3]); }
  w.hook(26, 20, 4); w.hook(26, 22, -6); P(w, 28, 18, -10, 6, 5, OLDWOOD); w.lever('v2', 29, 18, -11, -PI / 2); w.part(28, 18, -8.5); w.part(30.6, 18.5, 4);
  w.hint(20, -12, 33, 12, '🪝 Hook your way up the shelves to the second switch.', 4, 30);
  // centre: blueprint table + mover over a goo pit
  { const T = w.tf(0, 0, 8); T.slab('m', OLDWOOD, 0, 0, 0, 14, 5, 7, 0.2); T.box('g', 0x1e3a8a, 0, 5.05, 0, 12.5, 0.08, 6, 0.02); for (let i = 0; i < 6; i++) T.box('g', 0x93c5fd, -4 + (i % 3) * 4, 5.1, -1.5 + (i >> 1 & 1) * 3, 3, 0.04, 0.12, 0.01); T.add('g', torus(0.08, 24), 0x93c5fd, 4, 5.1, 1.5, PI / 2, 0, 0, 1.2, 1.2, 1); }
  w.lever('v3', 5, 5, 8, PI); w.cheese(-5, 5, 8); w.crumbLine(-6, 5, 10, 6, 5, 10, 6); w.cp(0, 5, 8, PI); w.hint(-8, 3, 8, 13, '📐 Blueprints: "GREAT CHEESE VAULT MACHINE". Signed: the Founders.', 4, 14);
  w.add('m', rbox(10, 0.4, 6, 0.1), 0x1f2937, -16, -0.18, 16); w.add('l', rbox(9.5, 0.1, 5.5, 0.05), GOO2, -16, 0.06, 16, 0, 0, 0, 1, 1, 1, 0.35); w.hot(-21, -0.5, 13, -11, 0.15, 19);
  w.mover(-16, 0.4, 16, [3, 0.5, 3], [7, 0, 0], 5, 0, IRON); w.part(-16, 4, 16); P(w, -16, 4, 16, 2, 2, IRON, 0.4); w.slab('x', IRON, -16, 0, 16, 0.6, 3.6, 0.6, 0.1);
  w.enemy('dust', 14, 0, 14, { axis: 'z', range: 6 }); w.enemy('windup', -6, 0, -2, { axis: 'x', range: 8 });
  // Candy and Torty both turn up to cheer (Torty by the door, Candy patrols the hall)
  w.martinaSpec = { x: 8, z: 22, yaw: PI, say: 'Your ancestors were a bit naughty... but YOU are the good ones!', name: 'Torty', name2: 'Torty' };
  w.candySpec = { x: 22, z: 20, yaw: PI, sleep: false, path: [[22, 20], [14, 22], [22, 24]], bounds: [10, 16, 32, 27], maxY: 1.6 };
  // clutter
  [[-24, 22], [24, 26], [-14, -2], [16, -4], [-28, -20]].forEach(([x, z], i) => dustPile(w, x, z, 0.9 + (i % 2) * 0.4)); cobweb(w, -32, 28, -27, PI / 4, 3.5); cobweb(w, 32, 28, -27, -PI / 4, 3.5); crateStack(w, -24, 24, 3); crateStack(w, 26, -22, 2); stoolRow(w, -8, 2, 3, 4);
  chalkboard(w, 'z', 32.4, 18, 9, 10, 6, -1, 4); sign(w, 0, 21.5, -27, 0, 14, 0x78350f); w.heartP(20, 0, 12); w.cheese(28, 0, 24); w.baby(0, 0, -22);
  // vault apron = boss arena (behind the lasers)
  w.bossSpec = { type: 'clanky', x: 0, y: 0, z: -20, yaw: 0, arena: [-24, -27, 24, -12.5], D: { n: 'The Founders\u2019 Grand-Bot', hp: 6 } }; w.goldPos = [0, 1.6, -20]; w.finalGold = true;
};
// ---------------------------------------------------------------- HQ door + menus
const _hq = BUILD.hq;
BUILD.hq = (w) => { _hq(w); const own = ownsOldTown(); const x = 7, z = 14.3;
  const T = w.tf(x, 0, z, PI); T.slab('m', 0x8a6a8f, 0, 0, 0, 3.6, 5.2, 0.6, 0.15); T.box('m', 0xa0703f, 0, 0.1, -0.32, 2.6, 4.4, 0.08, 0.1); for (let i = 0; i < 3; i++) T.box('m', 0x7a522b, 0, 0.8 + i * 1.3, -0.38, 2.2, 0.12, 0.04, 0.03); T.box('x', BRASS, 0.9, 2.2, -0.42, 0.25, 0.25, 0.15, 0.1);
  T.box('l', 0xa3e635, 0, 4.6, -0.36, 2.8, 0.6, 0.06, 0.05, 0.5); T.box('m', 0x14532d, 0, 4.6, -0.4, 2.6, 0.45, 0.04, 0.03); T.add('e', sph(12), 0xdff6ff, -0.6, 3.2, -0.4, 0, 0, 0, 0.5, 0.7, 0.1); T.add('l', sph(10), GOO, -0.6, 3.0, -0.42, 0, 0, 0, 0.3, 0.35, 0.05, 0.6);
  T.add('g', rbox(1.6, 0.06, 1.2, 0.03), 0x7f1d1d, 0, 0.03, -1.1); w.lights.push({ x, y: 4.6, z: z - 1.4, c: 0xa3e635, i: 8, d: 7 });
  w.kiosks.push({ id: 'oldTown', x, y: 0, z: z - 1.4, r: 2.4, label: own ? '🧪 Old Town Lab: explore the founders\u2019 lab' : '🧪 Old Town Lab (DLC)', fn: (app) => otPortal(app) }); };
export function otPortal(app) {
  if (!ownsOldTown()) { app.paused = true; panel(`<h2>🔒 OLD TOWN LAB</h2><div class="pBottle">🧪</div><p class="sub">An abandoned lab on Old Town Street, built by the villainous great-great-great-grandparents of <b>Luna, Pi-rat and Snowie</b>. 3 dusty levels, 3 bosses, Candy and Torty cameos.</p><p class="sub">Unlock it in the <b>Grok Arcade DLC Shop</b> (DLC Machine 3000 in the Hall of Game Records) for <b>175 🎟️</b>.</p><button class="go" id="lkOk">OKAY</button>`, (c) => { c.querySelector('#lkOk').onclick = () => app.resume(); }, 'pirPanel'); return; }
  if (app.net && app.net.online) { app.hud.toast('🧪 Old Town Lab is a solo adventure. Leave the online game first!'); return; }
  app.paused = true; const p = OP();
  const rows = OT_LEVELS.map((L, i) => { const open = otOpen(i), d = p.done[L.id]; return `<button class="mbtn2 otL" data-i="${i}" ${open ? '' : 'disabled'} style="display:block;width:100%;margin:6px 0;text-align:left;border-left:6px solid ${L.col}">${L.icon} <b>${esc(L.n)}</b> ${d ? '✅' : open ? '' : '🔒'}<br><small>${esc(L.blurb)} · ⚙️ ${(p.parts[L.id] || []).length}/5 · 🐭 ${(p.babies[L.id] || []).length}/3</small></button>`; }).join('');
  panel(`<h2>🧪 OLD TOWN LAB</h2><p class="sub">${p.intro ? 'Pick a wing of the old lab.' : 'A dusty lab on Old Town Street. The portraits inside look a LOT like Luna, Pi-rat and Snowie... it was their great-great-great-grandparents\u2019 secret villain lab! Time to find out what they were up to.'}</p>${rows}<div class="btnRow"><button class="mbtn2" id="otNo">NOT NOW</button></div>`, (c) => {
    p.intro = 1; persist(); c.querySelector('#otNo').onclick = () => app.resume(); c.querySelectorAll('.otL').forEach((b) => { b.onclick = () => { if (b.disabled) return; sfx('buy'); app.resume(); app.loadLevel(OT_LEVELS[+b.dataset.i].id, true); }; }); }, 'pirPanel');
}
const fmt = (t) => { const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + (s < 10 ? '0' : '') + s; };
export function otLevelDone(app, res) { const L = otOf(res.level), p = OP(), i = OT_LEVELS.indexOf(L); const earned = res.crumbs + res.cheese * 10; S.cheese += earned; const first = !p.done[L.id]; p.done[L.id] = true;
  const u = (a, b) => [...new Set([...(a || []), ...b])]; p.parts[L.id] = u(p.parts[L.id], res.parts); p.babies[L.id] = u(p.babies[L.id], res.babies); if (!p.best[L.id] || res.time < p.best[L.id]) p.best[L.id] = res.time; persist(); app.paused = true;
  const last = i === OT_LEVELS.length - 1, next = OT_LEVELS[i + 1];
  panel(`<h2>${L.icon} ${esc(L.n)} CLEARED!</h2><div class="gold">🧀✨</div><div class="resRow"><b>🧀 ${earned}</b><small>cheese</small></div><div class="resRow"><b>🐭 ${res.babies.length}/3</b><small>babies</small></div><div class="resRow"><b>⚙️ ${res.parts.length}/5</b><small>parts</small></div><div class="resRow"><b>⏱ ${fmt(res.time)}</b><small>time</small></div>
    ${last ? '<div class="newG">THE FOUNDERS\u2019 SECRET!<br><span>📜 Their plan to steal every cheese in Old Town never worked.</span><small>Luna, Pi-rat and Snowie decide the lab will be a cheese-sharing club instead.</small></div>' : first ? `<div class="newG">NEW WING OPEN!<br><span>${next.icon} ${esc(next.n)}</span></div>` : ''}
    <div class="btnRow"><button class="mbtn2" id="rAgain">↺ AGAIN</button>${next ? '<button class="mbtn2" id="rNext">▶ NEXT WING</button>' : ''}<button class="go" id="rHq">🏠 BACK TO HQ</button></div>`, (c) => {
    c.querySelector('#rHq').onclick = () => { closePanel(); app.loadLevel('hq', true); }; c.querySelector('#rAgain').onclick = () => { closePanel(); app.loadLevel(L.id, true); }; const n = c.querySelector('#rNext'); if (n) n.onclick = () => { closePanel(); app.loadLevel(next.id, true); }; }, 'pirPanel'); }
