// Remake building kit: every building gets its own architecture (log lodge, timber shop, brick bank, stone vault, A-frame,
// gambrel barn, chapel with steeple, glass greenhouse, domed workshop...), its own palette and its own props.
import * as THREE from 'three';
import { G } from './vworld.js';
const PI = Math.PI;
export let R = mulberry(7); export function seed(n) { R = mulberry(n); }
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const pick = (a) => a[Math.floor(R() * a.length)];
const _c = new THREE.Color();
// ------------------------------------------------------------------ canvas signs (texture size follows the sign's real aspect: never stretched)
export function signMesh(text, W, H, bg = '#7f1d1d', fg = '#fff7e0', o = {}) {
  const ph = o.px || 64, pw = Math.min(1024, Math.round(ph * W / H)); const cv = document.createElement('canvas'); cv.width = pw; cv.height = ph; const x = cv.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, pw, ph); if (o.border !== false) { x.strokeStyle = o.border || '#f5c542'; x.lineWidth = Math.max(3, ph * 0.07); x.strokeRect(x.lineWidth / 2, x.lineWidth / 2, pw - x.lineWidth, ph - x.lineWidth); }
  let fs = ph * (o.fs || 0.56); x.font = `900 ${fs}px "Trebuchet MS", system-ui, sans-serif`; while (x.measureText(text).width > pw * 0.9 && fs > 8) { fs -= 2; x.font = `900 ${fs}px "Trebuchet MS", system-ui, sans-serif`; }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, pw / 2, ph / 2 + fs * 0.04);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 2; tx.generateMipmaps = true;
  const m = new THREE.MeshBasicMaterial({ map: tx, toneMapped: false }); m.userData.own = true; const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H), m); return mesh; }
// place a sign in a local frame (faces local +z)
export function sign(w, T, text, lx, ly, lz, W, H, bg, fg, o) { const m = signMesh(text, W, H, bg, fg, o); const p = T.P(lx, ly, lz); m.position.set(p[0], p[1], p[2]); m.rotation.y = T.ry + (o && o.back ? PI : 0); w.addObj(m); T.box('m', o && o.frame || 0x3b2414, lx, ly - H / 2 - 0.04, lz - 0.06, W + 0.16, H + 0.08, 0.08); return m; }
// ------------------------------------------------------------------ small props
export function pine(w, x, z, s = 1, snow = true) { const y = 0; w.add('m', G.cyl(6), 0x5b3a21, x, y, z, 0, 0, 0, 0.18 * s, 1.0 * s, 0.18 * s);
  const greens = [0x1f5f3a, 0x23683f, 0x1b5232]; const gc = greens[(x * 7 + z * 3 & 0xff) % 3];
  for (let i = 0; i < 3; i++) { const r = (1.5 - i * 0.38) * s, yy = y + (0.8 + i * 1.05) * s, h = 1.7 * s; w.add('m', G.cone(8), gc, x, yy, z, 0, i * 0.5, 0, r, h, r); if (snow) w.add('m', G.cone(8), 0xf4f8ff, x, yy + h * 0.55, z, 0, i * 0.5 + 0.2, 0, r * 0.5, h * 0.45, r * 0.5); }
}
export function bigTree(w, x, z, s = 1) { w.add('m', G.cyl(8), 0x5b3a21, x, 0, z, 0, 0, 0, 0.5 * s, 2 * s, 0.5 * s);
  for (let i = 0; i < 6; i++) { const r = (4.2 - i * 0.65) * s, yy = (1.5 + i * 1.7) * s; w.add('m', G.cone(12), 0x1d6b3a, x, yy, z, 0, i * 0.4, 0, r, 2.6 * s, r);
    for (let k = 0; k < 9; k++) { const a = k / 9 * PI * 2 + i, rr = r * 0.82; w.add('g', G.sph(8), [0xdc2626, 0xf5c542, 0x2563eb, 0xf8f8f8, 0xdb2777][(k + i) % 5], x + Math.cos(a) * rr, yy + 0.5 * s, z + Math.sin(a) * rr, 0, 0, 0, 0.22 * s); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2 + i * 0.7, rr = r * 0.9; w.add('l', G.sph(6), [0xffd23f, 0xff4d6d, 0x60a5fa, 0x86efac][k % 4], x + Math.cos(a) * rr, yy + 0.25 * s, z + Math.sin(a) * rr, 0, 0, 0, 0.09 * s, 0.09 * s, 0.09 * s, 0.8); } }
  w.add('l', G.dodec(), 0xffd23f, x, (1.5 + 6 * 1.7 + 0.6) * s, z, 0, 0, 0, 0.6 * s, 0.6 * s, 0.2 * s, 1.2);
  for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; present(w, x + Math.cos(a) * 3.2 * s, z + Math.sin(a) * 3.2 * s, 0.7 + (i % 3) * 0.25, a); }
  w.solid(x - 1.2 * s, 0, z - 1.2 * s, x + 1.2 * s, 6, z + 1.2 * s); }
export function present(w, x, z, s = 1, ry = 0, y = 0) { const cols = [[0xdc2626, 0xf5c542], [0x16a34a, 0xdc2626], [0x2563eb, 0xf8f8f8], [0xdb2777, 0xfde68a], [0x7c3aed, 0xf5c542]]; const [a, b] = cols[(Math.abs(x * 13 + z * 7) | 0) % cols.length];
  w.add('g', G.box(), a, x, y, z, 0, ry, 0, 0.7 * s, 0.6 * s, 0.7 * s); w.add('g', G.box(), b, x, y, z, 0, ry, 0, 0.72 * s, 0.61 * s, 0.14 * s); w.add('g', G.box(), b, x, y, z, 0, ry, 0, 0.14 * s, 0.61 * s, 0.72 * s); w.add('g', G.torus(0.3, 10), b, x, y + 0.66 * s, z, 0, ry, 0, 0.14 * s); }
export function lamp(w, x, z, col = 0x1f2937) { w.add('x', G.cyl(8), col, x, 0, z, 0, 0, 0, 0.09, 3.4, 0.09); w.add('x', G.cyl(8), col, x, 0, z, 0, 0, 0, 0.2, 0.3, 0.2); w.add('x', G.cone(8), col, x, 3.75, z, 0, 0, 0, 0.32, 0.3, 0.32); w.add('l', G.sph(8), 0xffe3a3, x, 3.6, z, 0, 0, 0, 0.22, 0.22, 0.22, 1.1);
  w.add('m', G.torus(0.3, 12), 0x166534, x, 2.7, z, PI / 2, 0, 0, 0.22); w.add('g', G.sph(6), 0xdc2626, x, 2.48, z + 0.05, 0, 0, 0, 0.06); w.solid(x - 0.15, 0, z - 0.15, x + 0.15, 3.6, z + 0.15); }
export function candyCane(w, x, z, h = 2.4, ry = 0) { w.addFn('g', G.cyl(10), (c, px, py) => c.set(Math.floor((py + px * 0.3) * 3.2) % 2 ? 0xdc2626 : 0xffffff), x, 0, z, 0, 0, 0, 0.12, h, 0.12);
  w.add('g', G.torus(0.25, 10, PI), 0xdc2626, x + Math.cos(ry) * 0.3, h, z - Math.sin(ry) * 0.3, 0, ry, 0, 0.32); w.solid(x - 0.14, 0, z - 0.14, x + 0.14, h, z + 0.14); }
export function bench(w, x, z, ry = 0, col = 0x7c4a1e) { const T = w.tf(x, 0, z, ry); T.box('m', col, 0, 0.45, 0, 1.8, 0.1, 0.5); T.box('m', col, 0, 0.6, -0.24, 1.8, 0.5, 0.08); [-0.8, 0.8].forEach((a) => T.box('x', 0x222222, a, 0, 0, 0.08, 0.45, 0.45)); T.box('m', 0xf4f8ff, 0, 0.55, 0, 1.7, 0.04, 0.4); T.solid(0, 0, 0, 1.8, 0.6, 0.55); }
export function snowman(w, x, z, s = 1, ry = 0) { const T = w.tf(x, 0, z, ry, s); T.add('m', G.sph(12), 0xffffff, 0, 0.6, 0, 0, 0, 0, 0.62); T.add('m', G.sph(12), 0xffffff, 0, 1.45, 0, 0, 0, 0, 0.45); T.add('m', G.sph(12), 0xffffff, 0, 2.1, 0, 0, 0, 0, 0.32);
  T.add('g', G.cone(8), 0xff7a1a, 0, 2.1, 0.3, PI / 2, 0, 0, 0.06, 0.3, 0.06); T.add('g', G.sph(6), 0x111111, -0.1, 2.2, 0.27, 0, 0, 0, 0.04); T.add('g', G.sph(6), 0x111111, 0.1, 2.2, 0.27, 0, 0, 0, 0.04);
  T.add('f', G.torus(0.35, 14), 0xdc2626, 0, 1.82, 0, PI / 2, 0, 0, 0.33); T.add('m', G.cyl(10), 0x111111, 0, 2.38, 0, 0, 0, 0, 0.26, 0.38, 0.26); T.add('m', G.cyl(10), 0x111111, 0, 2.36, 0, 0, 0, 0, 0.4, 0.04, 0.4);
  T.add('m', G.cyl(5), 0x5b3a21, -0.45, 1.5, 0, 0, 0, 1.1, 0.03, 0.6, 0.03); T.add('m', G.cyl(5), 0x5b3a21, 0.45, 1.5, 0, 0, 0, -1.1, 0.03, 0.6, 0.03); T.solid(0, 0, 0, 1.2, 2.4, 1.2); }
export function fence(w, x0, z0, x1, z1, col = 0x8b5a2b, h = 1.1) { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2.4)), ry = Math.atan2(x1 - x0, z1 - z0);
  for (let i = 0; i <= n; i++) { const t = i / n; w.add('m', G.box(), col, x0 + (x1 - x0) * t, 0, z0 + (z1 - z0) * t, 0, ry, 0, 0.16, h + 0.15, 0.16); w.add('m', G.box(), 0xffffff, x0 + (x1 - x0) * t, h + 0.15, z0 + (z1 - z0) * t, 0, ry, 0, 0.2, 0.08, 0.2); }
  for (const hh of [h * 0.45, h * 0.9]) w.add('m', G.box(), col, (x0 + x1) / 2, hh, (z0 + z1) / 2, 0, ry, 0, 0.08, 0.12, L);
  const c = Math.abs(Math.cos(ry)) > 0.7; w.solid(Math.min(x0, x1) - (c ? 0.15 : 0), 0, Math.min(z0, z1) - (c ? 0 : 0.15), Math.max(x0, x1) + (c ? 0.15 : 0), h, Math.max(z0, z1) + (c ? 0 : 0.15)); }
// catenary of coloured bulbs
export function lights(w, a, b, n = 14, sag = 0.8) { for (let i = 0; i <= n; i++) { const t = i / n; w.add('l', G.sph(6), [0xff4d6d, 0xffd23f, 0x60a5fa, 0x86efac, 0xffffff][i % 5], a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * PI) * sag, a[2] + (b[2] - a[2]) * t, 0, 0, 0, 0.1, 0.1, 0.1, 0.9); } }
export function wreath(w, T, lx, ly, lz, s = 1) { T.add('m', G.torus(0.35, 14), 0x166534, lx, ly, lz, 0, 0, 0, 0.42 * s); T.add('f', G.box(), 0xdc2626, lx, ly - 0.42 * s, lz + 0.05, 0, 0, 0, 0.22 * s, 0.16 * s, 0.05); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; T.add('g', G.sph(6), 0xdc2626, lx + Math.cos(a) * 0.42 * s, ly + Math.sin(a) * 0.42 * s, lz + 0.12, 0, 0, 0, 0.06 * s); } }
export function rock(w, x, z, s = 1, col = 0x9aa3ad) { w.add('m', G.dodec(), col, x, s * 0.4, z, R() * 3, R() * 3, 0, s, s * 0.7, s * 0.9); w.add('m', G.hemi(8), 0xf4f8ff, x, s * 0.75, z, 0, 0, 0, s * 0.7, s * 0.3, s * 0.6); }
export function crate(w, x, z, s = 1, ry = 0, y = 0) { w.add('m', G.box(), 0xa16207, x, y, z, 0, ry, 0, s, s, s); w.add('m', G.box(), 0x713f12, x, y + s * 0.45, z, 0, ry, 0, s * 1.02, s * 0.1, s * 1.02); }
export function sledge(w, x, z, ry = 0, col = 0xdc2626, s = 1) { const T = w.tf(x, 0, z, ry, s); T.box('g', col, 0, 0.3, 0, 1.4, 0.5, 2.3); T.box('g', col, 0, 0.6, -0.9, 1.4, 0.8, 0.5); T.box('g', 0xf5c542, 0, 0.78, 0.15, 1.46, 0.07, 1.9);
  [-0.6, 0.6].forEach((a) => { T.box('x', 0xf5c542, a, 0.05, 0, 0.08, 0.08, 2.8); T.add('x', G.torus(0.25, 10, PI), 0xf5c542, a, 0.32, 1.4, 0, PI / 2, PI / 2, 0.3); }); T.box('f', 0x7f1d1d, 0, 0.55, 0.1, 1.2, 0.12, 1.2); T.solid(0, 0, 0, 1.6, 1.0, 2.8); }
// ------------------------------------------------------------------ building pieces
// window in a local frame on the plane z=lz (facing +z): frame + warm glowing glass + optional shutters + snow sill
export function windowL(T, lx, ly, lz, W = 1.1, H = 1.3, o = {}) { const fr = o.frame || 0xfff7e6; T.box('m', fr, lx, ly - 0.08, lz, W + 0.22, H + 0.16, 0.12); T.box('l', o.glow || 0xffd08a, lx, ly, lz + 0.03, W, H, 0.08, 0, 0.25);
  T.box('m', fr, lx, ly, lz + 0.08, 0.08, H, 0.04); T.box('m', fr, lx, ly + H / 2 - 0.04, lz + 0.08, W, 0.08, 0.04); T.box('m', 0xf4f8ff, lx, ly - 0.14, lz + 0.12, W + 0.3, 0.1, 0.2);
  if (o.shutter) { T.box('m', o.shutter, lx - W / 2 - 0.28, ly - 0.06, lz + 0.02, 0.36, H + 0.12, 0.06); T.box('m', o.shutter, lx + W / 2 + 0.28, ly - 0.06, lz + 0.02, 0.36, H + 0.12, 0.06); }
  if (o.arch) T.add('m', G.arch(8), fr, lx, ly + H - 0.1, lz, 0, 0, 0, W + 0.2, (W + 0.2) * 0.5, 0.12); }
export function doorL(w, T, lx, lz, W = 1.6, H = 2.5, col = 0x7c2d12, o = {}) { T.box('m', o.frame || 0xfff7e6, lx, 0, lz, W + 0.4, H + 0.25, 0.16); T.box('g', col, lx, 0.02, lz + 0.05, W, H, 0.12);
  T.box('m', 0x000000, lx, 0.02, lz + 0.115, 0.04, H - 0.05, 0.02); T.add('x', G.sph(6), 0xf5c542, lx + 0.25, 1.15, lz + 0.16, 0, 0, 0, 0.06); T.add('x', G.sph(6), 0xf5c542, lx - 0.25, 1.15, lz + 0.16, 0, 0, 0, 0.06);
  wreath(w, T, lx, H - 0.45, lz + 0.18, 0.8); T.box('m', 0xb91c1c, lx, 0, lz + 0.75, W + 0.6, 0.04, 1.0); T.box('m', o.step || 0xb8c2cc, lx, 0, lz + 0.3, W + 0.8, 0.12, 0.7); }
// gable roof along local z (ridge along z). W across x, H rise, L length, at height y0
export function gable(T, col, y0, W, H, L, snow = true, ov = 0.5) { T.add('m', G.prism(), col, 0, y0, 0, 0, 0, 0, W + ov * 2, H, L + ov * 2); if (snow) T.add('m', G.prism(), 0xf4f8ff, 0, y0 + H * 0.4, 0, 0, 0, 0, (W + ov * 2) * 0.62, H * 0.62, L + ov * 2 + 0.06);
  T.box('m', 0xf4f8ff, 0, y0 - 0.05, (L / 2 + ov), W + ov * 2 + 0.05, 0.1, 0.12); for (let i = 0; i < 9; i++) T.add('e', G.cone(5), 0xe0f2fe, -W / 2 - ov + 0.3 + i * (W + ov * 2 - 0.6) / 8, y0 - 0.32, L / 2 + ov, PI, 0, 0, 0.05, 0.3, 0.05); }
// gable with ridge across x (front-facing triangle on +z face)
export function gableX(T, col, y0, W, H, L, snow = true, ov = 0.5) { T.add('m', G.prism(), col, 0, y0, 0, 0, PI / 2, 0, L + ov * 2, H, W + ov * 2); if (snow) T.add('m', G.prism(), 0xf4f8ff, 0, y0 + H * 0.4, 0, 0, PI / 2, 0, (L + ov * 2) * 0.62, H * 0.62, W + ov * 2 + 0.06); }
export function chimney(T, lx, lz, y0, h, col = 0x9a3412) { T.box('m', col, lx, y0, lz, 0.9, h, 0.9); T.box('m', 0x57534e, lx, y0 + h, lz, 1.05, 0.2, 1.05); T.box('m', 0xf4f8ff, lx, y0 + h + 0.2, lz, 0.95, 0.08, 0.95); }
// walls box with colour function (log bands / brick / stone / plaster)
export const WALL = {
  log: (base) => (c, x, y, z) => { const k = Math.floor(y * 3.1) % 2 ? 1 : 0.82; c.set(base).multiplyScalar(k); },
  brick: (base) => (c, x, y, z) => { const row = Math.floor(y * 4), off = row % 2 ? 0.5 : 0; const k = ((Math.floor((x + z) * 2 + off) * 7 + row * 3) % 5) * 0.04 + 0.86; c.set(base).multiplyScalar(k); if ((y * 4) % 1 < 0.08) c.set(0xd6d3d1); },
  stone: (base) => (c, x, y, z) => { const n = Math.sin(x * 3.1 + y * 5.7) * Math.sin(z * 2.3 - y * 4.1); c.set(base).multiplyScalar(0.86 + n * 0.12); },
  plain: (base) => (c) => c.set(base),
  board: (base) => (c, x, y, z) => { const k = Math.floor((x + z) * 2.2) % 2 ? 1 : 0.9; c.set(base).multiplyScalar(k); },
};
export function walls(w, T, W, H, D, base, kind = 'plain', y0 = 0) { const fn = WALL[kind](base); const p = T.P(0, y0, 0); w.addFn('m', G.box(), fn, p[0], p[1], p[2], 0, T.ry, 0, W * T.s, H * T.s, D * T.s); }
