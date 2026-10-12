// Ratita Industries HQ prop kit: rat-scale offices, labs and yard gear. Real smooth geometry everywhere (rounded boxes,
// lathes, tubes); every prop batches into its room's merged meshes and registers simple colliders.
import * as THREE from 'three';
import { rbox } from './world.js?v=np9';
import { PR, propSeed, rnd, pick } from './props.js?v=np9';
import { rcyl, lathe, sph, cyl, cone, torus, capsule, tube, leaf, wedge, gear, star, heart, blobGeo } from './shapes.js?v=np9';
import { textGeo } from './text3d.js?v=np9';
const PI = Math.PI;
export const R = rnd;
// ---------- scaled proxy so the big household prop library can be reused at rat scale ----------
export function scaled(w, X, Y, Z, s) {
  const Pm = (x, y, z) => [X + x * s, Y + y * s, Z + z * s];
  return { s, add(b, g, c, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx, em = 0) { const p = Pm(x, y, z); return w.add(b, g, c, p[0], p[1], p[2], rx, ry, rz, sx * s, sy * s, sz * s, em); },
    addFn(b, g, fn, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) { const p = Pm(x, y, z); return w.addFn(b, g, fn, p[0], p[1], p[2], rx, ry, rz, sx * s, sy * s, sz * s); },
    tf(x, y, z, ry = 0, sc = 1) { const p = Pm(x, y, z); const T = w.tf(p[0], p[1], p[2], ry, sc * s); const P0 = T.P; T.P = (a, b, c) => { const q = P0(a, b, c); return [(q[0] - X) / s, (q[1] - Y) / s, (q[2] - Z) / s]; }; return T; },
    slab(b, c, x, y, z, ww, h, d, r = 0.1, o, em = 0, seg = 2) { if (r * s < 0.03) seg = 1; const p = Pm(x, y, z); w.add(b, rbox(ww * s, h * s, d * s, r * s, seg), c, p[0], p[1] + h * s / 2, p[2], 0, 0, 0, 1, 1, 1, em); return o === false ? null : w.solid(p[0] - ww * s / 2, p[1], p[2] - d * s / 2, p[0] + ww * s / 2, p[1] + h * s, p[2] + d * s / 2, o); },
    solid(x0, y0, z0, x1, y1, z1, o) { const a = Pm(x0, y0, z0), b = Pm(x1, y1, z1); return w.solid(a[0], a[1], a[2], b[0], b[1], b[2], o); },
    lights: { push(l) { const p = Pm(l.x, l.y, l.z); w.lights.push(Object.assign({}, l, { x: p[0], y: p[1], z: p[2], d: Math.max(8, (l.d || 30) * s), i: Math.max(6, (l.i || 30) * s * 0.6) })); } }, solids: w.solids, anims: w.anims };
}
// call a household prop (PR.*) at rat scale: K.hh('couch', w, x, z, s, ry, ...rest)
export function hh(name, w, x, z, s, ...rest) { const H = scaled(w, x, 0, z, s); return PR[name](H, 0, 0, ...rest); }
export function hhY(name, w, x, y, z, s, ...rest) { const H = scaled(w, x, y, z, s); return PR[name](H, 0, 0, 0, ...rest); }
// ---------- structure ----------
const TH = 0.5;
export function wall(w, axis, at, from, to, h, col, holes = [], o = {}) {
  const segs = []; let cur = from; const hs = holes.slice().sort((a, b) => a[0] - b[0]);
  for (const hl of hs) { if (hl[0] > cur) segs.push([cur, hl[0], 0, h]); if (hl[2] < h) segs.push([hl[0], hl[1], hl[2], h]); if (hl[3] > 0) segs.push([hl[0], hl[1], 0, hl[3]]); cur = hl[1]; } if (cur < to) segs.push([cur, to, 0, h]);
  const th = o.th || TH, b = o.bucket || 'w', Y = o.y || 0;
  for (const [a, c, y0, y1] of segs) { if (c - a < 0.01 || y1 - y0 < 0.01) continue; const m = (a + c) / 2, L = c - a;
    if (axis === 'x') w.slab(b, col, m, Y + y0, at, L, y1 - y0, th, 0.06, { wall: true }); else w.slab(b, col, at, Y + y0, m, th, y1 - y0, L, 0.06, { wall: true });
    if (y0 === 0 && !o.noBase) [-1, 1].forEach((sd) => { if (axis === 'x') w.add('g', rbox(L, 0.28, 0.08, 0.03, 1), o.base || 0xf8fafc, m, Y + 0.14, at + sd * (th / 2 + 0.03)); else w.add('g', rbox(0.08, 0.28, L, 0.03, 1), o.base || 0xf8fafc, at + sd * (th / 2 + 0.03), Y + 0.14, m); }); }
  if (!o.noTrim) [-1, 1].forEach((sd) => { const m = (from + to) / 2, L = to - from; if (axis === 'x') w.add('g', rbox(L, 0.18, 0.1, 0.04), o.trim || 0xffffff, m, Y + h - 0.09, at + sd * (th / 2 + 0.04)); else w.add('g', rbox(0.1, 0.18, L, 0.04), o.trim || 0xffffff, at + sd * (th / 2 + 0.04), Y + h - 0.09, m); });
  // door frames + glass panes in window holes
  for (const hl0 of hs) { const hl = [hl0[0], hl0[1], hl0[2] + Y, hl0[3] + (hl0[3] > 0 || Y ? Y : 0), hl0[4]]; const m = (hl[0] + hl[1]) / 2, L = hl[1] - hl[0], fc = o.frame || 0xffffff; if (hl0[5] === 'noframe') continue;
    if (hl[4] === 'glass') { const gy = (hl[2] + hl[3]) / 2, gh = hl[2] - hl[3];
      if (o.blinds) for (let yy = hl[3] + 0.15; yy < hl[2] - 0.05; yy += 0.22) { if (axis === 'x') w.add('g', rbox(L, 0.04, 0.16, 0.01), o.blinds, m, yy, at - o.blindSide * 0.3, 0.35, 0, 0); else w.add('g', rbox(0.16, 0.04, L, 0.01), o.blinds, at - o.blindSide * 0.3, yy, m, 0, 0, 0.35); } if (axis === 'x') { w.add('e', rbox(L, gh, 0.08, 0.02), 0xcfefff, m, gy, at); w.solid(hl[0], hl[3], at - 0.15, hl[1], hl[2], at + 0.15, { glass: true }); } else { w.add('e', rbox(0.08, gh, L, 0.02), 0xcfefff, at, gy, m); w.solid(at - 0.15, hl[3], hl[0], at + 0.15, hl[2], hl[1], { glass: true }); }
      for (let k = 1; k < Math.floor(L / 2.2); k++) { const q = hl[0] + k * L / Math.floor(L / 2.2); if (axis === 'x') w.add('g', rbox(0.12, gh, 0.2, 0.04), fc, q, gy, at); else w.add('g', rbox(0.2, gh, 0.12, 0.04), fc, at, gy, q); } }
    const jt = 0.18, dep = th + 0.16; const put = (cx, cy, cz, sx, sy, sz) => w.add('g', rbox(sx, sy, sz, 0.05), fc, cx, cy, cz);
    if (axis === 'x') { put(hl[0] + jt / 2, (hl[3] + hl[2]) / 2, at, jt, hl[2] - hl[3], dep); put(hl[1] - jt / 2, (hl[3] + hl[2]) / 2, at, jt, hl[2] - hl[3], dep); put(m, hl[2], at, L + 0.2, jt, dep); if (hl[3] > Y) put(m, hl[3], at, L + 0.2, jt, dep + 0.2); }
    else { put(at, (hl[3] + hl[2]) / 2, hl[0] + jt / 2, dep, hl[2] - hl[3], jt); put(at, (hl[3] + hl[2]) / 2, hl[1] - jt / 2, dep, hl[2] - hl[3], jt); put(at, hl[2], m, dep, jt, L + 0.2); if (hl[3] > Y) put(at, hl[3], m, dep + 0.2, jt, L + 0.2); } }
}
// holes helpers: door(a,b,top) / glass(a,b,top,bottom)
export const D = (a, b, top = 3.2) => [a, b, top, 0]; export const G = (a, b, top = 3.8, bot = 1.0) => [a, b, top, bot, 'glass'];
// flat tile/plank tops (2 triangles each) grouped by colour over a darker grout slab: crisp look, tiny triangle count
function quadGeo(list) { const P = new Float32Array(list.length * 18), N = new Float32Array(list.length * 18); let o = 0;
  for (const [x0, z0, x1, z1, y] of list) { const v = [x0, y, z0, x0, y, z1, x1, y, z1, x0, y, z0, x1, y, z1, x1, y, z0]; for (let i = 0; i < 18; i++) { P[o + i] = v[i]; N[o + i] = i % 3 === 1 ? 1 : 0; } o += 18; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); return g; }
function addQuads(w, bucket, groups) { for (const [col, list] of groups) if (list.length) w.add(bucket, quadGeo(list), col, 0, 0, 0); }
const shadeC = (c, k) => { const C = new THREE.Color(c); C.multiplyScalar(k); return C.getHex(); };
export function floor(w, x0, z0, x1, z1, kind, y = 0, c1, c2, tsO) {
  if (kind === 'wood') { const cols = c1 ? [c1, shadeC(c1, 0.93), shadeC(c1, 1.06), shadeC(c1, 0.88)] : [0xc98d55, 0xbd8048, 0xd39a62, 0xb7773f];
    w.add('m', rbox(x1 - x0, 0.3, z1 - z0, 0.04, 1), shadeC(cols[0], 0.62), (x0 + x1) / 2, y - 0.14, (z0 + z1) / 2); const Y0 = y; y += 0.025;
    const G = cols.map((c) => [c, []]), grain = cols.map((c) => [shadeC(c, 0.8), []]); const pw = 0.66; let i = 0;
    for (let x = x0; x < x1 - 0.01; x += pw, i++) { const ww = Math.min(pw, x1 - x); let z = z0 - ((i * 1.7) % 2.6);
      while (z < z1) { const len = 2.6 + ((((i * 13 + Math.round(z * 3)) % 5) + 5) % 5) * 0.3; const za = Math.max(z, z0), zb = Math.min(z + len, z1);
        if (zb - za > 0.1) { const k = (((i * 7 + Math.round(z * 5)) % 4) + 4) % 4; G[k][1].push([x + 0.02, za + 0.02, x + ww - 0.02, zb - 0.02, y]);
          if (zb - za > 1) { const gx = x + 0.12 + R() * (ww - 0.3); grain[k][1].push([gx, za + 0.2, gx + 0.03, zb - 0.3, y + 0.004]); } }
        z += len; } }
    addQuads(w, 'm', G); addQuads(w, 'm', grain); w.solid(x0, Y0 - 2, z0, x1, Y0, z1, { floor: true }); return; }
  const ca = c1 || (kind === 'marble' ? 0xfff1e6 : kind === 'carpet' ? 0x6d5bd0 : 0xf1f5f9); w.add('m', rbox(x1 - x0, 0.3, z1 - z0, 0.04, 1), shadeC(ca, kind === 'carpet' ? 0.85 : 0.8), (x0 + x1) / 2, y - 0.14, (z0 + z1) / 2);
  const ts = tsO || (kind === 'marble' ? 3 : kind === 'carpet' ? 2 : 1.5); const a = c1 || (kind === 'marble' ? 0xfff1e6 : kind === 'carpet' ? 0x6d5bd0 : 0xf1f5f9), b = c2 || (kind === 'marble' ? 0xffd0e0 : kind === 'carpet' ? 0x7c6ae0 : 0xdbe4ee);
  const gap = kind === 'carpet' ? 0.015 : 0.035, A = [], B = [];
  for (let x = x0, i = 0; x < x1 - 0.01; x += ts, i++) for (let z = z0, j = 0; z < z1 - 0.01; z += ts, j++) { const ww = Math.min(ts, x1 - x), dd = Math.min(ts, z1 - z); ((i + j) % 2 ? A : B).push([x + gap, z + gap, x + ww - gap, z + dd - gap, y + 0.025]); }
  addQuads(w, kind === 'carpet' ? 'f' : 'g', [[a, A], [b, B]]);
  w.solid(x0, y - 2, z0, x1, y, z1, { floor: true });
}
export function ceiling(w, x0, z0, x1, z1, h, col = 0xfffaf2, o = {}) {
  w.add('w', rbox(x1 - x0 + 0.6, 0.4, z1 - z0 + 0.6, 0.05, 1), col, (x0 + x1) / 2, h + 0.2, (z0 + z1) / 2); w.solid(x0 - 0.3, h, z0 - 0.3, x1 + 0.3, h + 0.4, z1 + 0.3, { cam: true, nofloor: true });
  if (o.lamps !== false) { const nx = Math.max(1, Math.round((x1 - x0) / 7)), nz = Math.max(1, Math.round((z1 - z0) / 7));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const x = x0 + (i + 0.5) * (x1 - x0) / nx, z = z0 + (j + 0.5) * (z1 - z0) / nz; w.add('g', rbox(2.0, 0.12, 1.0, 0.05), 0xe5e7eb, x, h - 0.04, z); w.add('l', rbox(1.8, 0.06, 0.8, 0.03), o.lampCol || 0xfff4dc, x, h - 0.1, z, 0, 0, 0, 1, 1, 1, 0.6); }
    w.lights.push({ x: (x0 + x1) / 2, y: h - 1, z: (z0 + z1) / 2, c: o.lightCol || 0xfff1dc, i: o.li || 22, d: Math.max(x1 - x0, z1 - z0) * 1.1 }); }
}
export function sign3d(w, str, x, y, z, ry, size = 0.6, col = 0xff4fa0, back = 0xffffff, o = {}) { const g = textGeo(str, size, size * 0.35); if (!g) return; const wd = g.userData.w;
  if (back !== null) w.add('g', rbox(wd + size * 1.2, size * 1.9, size * 0.3, size * 0.25), back, x - Math.sin(ry) * size * 0.2, y + size * 0.4, z - Math.cos(ry) * size * 0.2, 0, ry, 0);
  w.add(o.glow ? 'l' : 'g', g, col, x + Math.sin(ry) * size * 0.05, y, z + Math.cos(ry) * size * 0.05, 0, ry, 0, 1, 1, 1, o.glow || 0); }
// ---------- office ----------
const BRIGHT = [0xff5d73, 0x4f9dff, 0x3ddc84, 0xffc93c, 0xa66bff, 0x2dd4bf, 0xff8a3d, 0xff6fcf];
export function monitor(w, T, x, y, z, ry = 0, scr = 0x38bdf8, big = 1) { const t = T || w.tf(0, 0, 0); t.add('x', rcyl(0.14 * big, 0.04, 0.02, 20), 0x334155, x, y, z); t.add('x', cyl(10), 0x475569, x, y, z, 0, 0, 0, 0.04, 0.3 * big, 0.04);
  t.box('g', 0x1e293b, x, y + 0.25 * big, z, 0.75 * big, 0.48 * big, 0.06, 0.03); t.box('l', scr, x, y + 0.28 * big, z + 0.032, 0.68 * big, 0.4 * big, 0.01, 0.01, 0.35);
  for (let i = 0; i < 3; i++) t.box('l', 0xffffff, x - 0.18 * big + i * 0.05 * big, y + 0.4 * big - i * 0.07 * big, z + 0.04, 0.22 * big, 0.03 * big, 0.005, 0.005, 0.5); }
export function desk(w, x, z, ry = 0, o = {}) { const T = w.tf(x, 0, z, ry); const top = o.top || 0xf5d0a9, L = o.L || 2.4, Dp = o.D || 1.2, H = 0.85;
  T.slab('g', top, 0, H - 0.1, 0, L, 0.1, Dp, 0.05); T.box('m', o.leg || 0xffffff, -L / 2 + 0.4, 0, 0, 0.7, H - 0.1, Dp - 0.15, 0.06); T.solid(-L / 2 + 0.05, 0, -Dp / 2 + 0.07, -L / 2 + 0.75, H - 0.1, Dp / 2 - 0.07, { cam: false });
  for (let i = 0; i < 3; i++) { T.box('g', BRIGHT[(i + (x | 0)) & 7], -L / 2 + 0.4, 0.08 + i * 0.24, Dp / 2 - 0.05, 0.6, 0.2, 0.04, 0.03); T.add('x', sph(8), 0xd1d5db, -L / 2 + 0.4, 0.18 + i * 0.24, Dp / 2 - 0.01, 0, 0, 0, 0.03); }
  T.add('x', cyl(10), 0xcbd5e1, L / 2 - 0.12, (H - 0.1) / 2, -Dp / 2 + 0.12, 0, 0, 0, 0.05, H - 0.1, 0.05); T.add('x', cyl(10), 0xcbd5e1, L / 2 - 0.12, (H - 0.1) / 2, Dp / 2 - 0.12, 0, 0, 0, 0.05, H - 0.1, 0.05);
  if (o.pc !== false) { monitor(w, T, 0.2, H, -Dp / 2 + 0.3, 0, o.scr || pick([0x38bdf8, 0x4ade80, 0xf472b6, 0xfbbf24])); T.box('g', 0xe2e8f0, 0.2, H, 0.05, 0.7, 0.03, 0.22, 0.02); T.box('g', 0x94a3b8, 0.7, H, 0.1, 0.12, 0.04, 0.18, 0.04); }
  T.add('g', rcyl(0.07, 0.14, 0.02, 14), pick(BRIGHT), -0.7, H, 0.1); T.add('m', rbox(0.4, 0.03, 0.3, 0.01), 0xffffff, -0.4, H + 0.01, 0.15, 0, 0.3, 0); T.add('m', rbox(0.4, 0.03, 0.3, 0.01), 0xfef9c3, -0.42, H + 0.04, 0.12, 0, 0.1, 0);
  if (o.plant) T.add('g', rcyl(0.09, 0.14, 0.02, 14), 0xfb923c, L / 2 - 0.25, H, -0.3), T.add('g', sph(10), 0x22c55e, L / 2 - 0.25, H + 0.24, -0.3, 0, 0, 0, 0.13, 0.16, 0.13);
  if (o.chair !== false) chair(w, ...T.P(0.2, 0, Dp / 2 + 0.55), ry + PI, o.chairCol);
  return H; }
export function chair(w, x, y, z, ry = 0, col) { if (z === undefined) { z = y; y = 0; } const T = w.tf(x, y, z, ry); const c = col || pick([0x6366f1, 0xef4444, 0x10b981, 0xf59e0b, 0xec4899]);
  for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; T.add('x', capsule(8), 0x64748b, Math.cos(a) * 0.17, 0.13, Math.sin(a) * 0.17, 0, -a, PI / 2, 0.05, 0.34, 0.05); T.add('x', sph(10), 0x475569, Math.cos(a) * 0.32, 0.085, Math.sin(a) * 0.32, 0, 0, 0, 0.055); } T.add('x', sph(10), 0x64748b, 0, 0.13, 0, 0, 0, 0, 0.07, 0.05, 0.07);
  T.add('x', cyl(10), 0x94a3b8, 0, 0.27, 0, 0, 0, 0, 0.04, 0.4, 0.04); T.box('f', c, 0, 0.45, 0, 0.55, 0.1, 0.5, 0.05); T.box('f', c, 0, 0.55, -0.24, 0.5, 0.5, 0.08, 0.05); T.solid(-0.28, 0, -0.28, 0.28, 0.55, 0.28, { cam: false }); }
export function cubicle(w, x, z, ry = 0, col = 0x93c5fd) { const T = w.tf(x, 0, z, ry); T.slab('f', col, 0, 0, -1.4, 3.2, 1.5, 0.12, 0.05); T.slab('f', col, -1.6, 0, -0.4, 0.12, 1.5, 2.1, 0.05); T.box('g', 0xffffff, 0, 1.5, -1.4, 3.24, 0.06, 0.16, 0.03); T.box('g', 0xffffff, -1.6, 1.5, -0.4, 0.16, 0.06, 2.14, 0.03);
  for (let i = 0; i < 3; i++) T.box('m', pick([0xfef08a, 0xfda4af, 0xa7f3d0, 0xbfdbfe]), -0.9 + i * 0.5 + R() * 0.2, 1.0 + R() * 0.3, -1.33, 0.22, 0.22, 0.01, 0.01);
  { const p = T.P(0, 0, -0.7); desk(w, p[0], p[2], ry, { L: 2.6, D: 1.1, plant: R() < 0.5 }); } }
export function whiteboard(w, axis, at, c, y, W = 3, side = 1) { const T = axis === 'x' ? w.tf(c, y, at, side > 0 ? 0 : PI) : w.tf(at, y, c, side > 0 ? PI / 2 : -PI / 2); T.box('x', 0xcbd5e1, 0, 0, 0.3, W + 0.16, 1.6, 0.06, 0.03); T.box('g', 0xffffff, 0, 0.06, 0.34, W, 1.48, 0.04, 0.02);
  for (let i = 0; i < 6; i++) T.box('g', pick([0x2563eb, 0xdc2626, 0x16a34a, 0x111827]), -W / 2 + 0.4 + R() * (W - 1.2), 0.3 + R() * 1.0, 0.37, 0.3 + R() * 0.8, 0.04, 0.01, 0.01);
  T.add('g', torus(0.18, 20), 0xdc2626, W / 4, 0.85, 0.37, 0, 0, 0, 0.2); T.box('x', 0x94a3b8, 0, -0.05, 0.45, W * 0.6, 0.05, 0.14, 0.02); for (let i = 0; i < 3; i++) T.add('g', capsule(8), [0x2563eb, 0xdc2626, 0x16a34a][i], -0.3 + i * 0.25, -0.0, 0.46, 0, 0, PI / 2, 0.035, 0.07, 0.035); }
export function filing(w, x, z, ry = 0, col = 0x94a3b8, n = 3) { const T = w.tf(x, 0, z, ry); T.slab('x', col, 0, 0, 0, 0.7, n * 0.45, 0.8, 0.05); for (let i = 0; i < n; i++) { T.box('x', 0xb6bec9, 0, 0.06 + i * 0.45, 0.4, 0.62, 0.36, 0.02, 0.02); T.add('x', capsule(8), 0x64748b, 0, 0.27 + i * 0.45, 0.43, 0, 0, PI / 2, 0.035, 0.14, 0.035); } return n * 0.45; }
export function cooler(w, x, z) { w.slab('g', 0xf1f5f9, x, 0, z, 0.55, 0.9, 0.55, 0.08); w.add('e', lathe([[0, 0], [0.24, 0.02], [0.26, 0.6], [0.12, 0.7], [0, 0.7]], 24, 'jug'), 0x7dd3fc, x, 0.9, z); w.add('g', sph(10), 0x60a5fa, x + 0.12, 0.65, z + 0.28, 0, 0, 0, 0.04); w.add('g', sph(10), 0xf87171, x - 0.12, 0.65, z + 0.28, 0, 0, 0, 0.04); }
export function plant(w, x, z, s = 1, pot) { hh('bigPlant', w, x, z, 0.12 * s); }
export function potPlant(w, x, y, z, s = 1, pot = 0xff8a3d) { w.add('g', lathe([[0, 0], [0.22, 0], [0.28, 0.36], [0.3, 0.4], [0, 0.4]], 24, 'pp'), pot, x, y, z, 0, 0, 0, s, s, s); w.add('m', cyl(16), 0x5b3a1e, x, y + 0.36 * s, z, 0, 0, 0, 0.27 * s, 0.03 * s, 0.27 * s);
  for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2 + R(); w.add('g', leaf(), pick([0x22c55e, 0x16a34a, 0x4ade80]), x + Math.cos(a) * 0.05 * s, y + 0.38 * s, z + Math.sin(a) * 0.05 * s, -0.5 - R() * 0.4, -a + PI / 2, 0, 0.35 * s, 0.6 * s, 0.35 * s); } w.solid(x - 0.25 * s, y, z - 0.25 * s, x + 0.25 * s, y + 0.5 * s, z + 0.25 * s, { cam: false }); }
export function sofa(w, x, z, ry = 0, col = 0x8b5cf6, cush = 0xa78bfa, L = 22) { return hh('couch', w, x, z, 0.16, ry, L, col, cush); }
export function rug(w, x, z, ry, L, Dp, a, b) { hh('rug', w, x, z, 0.25, ry, L / 0.25, Dp / 0.25, a, b); }
export function shelf(w, x, z, ry, W, H, Dp = 0.6, col = 0x9a6a3e) { return hh('bookshelf', w, x, z, 0.25, ry, W / 0.25, H / 0.25, Dp / 0.25, col); }
export function lamp(w, x, z, shade = 0xffe4b5) { hh('lamp', w, x, z, 0.14, 0, 16, shade); }
export function vending(w, x, z, ry = 0, col = 0xef4444) { const T = w.tf(x, 0, z, ry); T.slab('g', col, 0, 0, 0, 1.3, 2.3, 0.8, 0.1); T.box('e', 0xcfefff, -0.12, 0.6, 0.41, 0.85, 1.5, 0.04, 0.03); T.box('g', 0x1f2937, 0.45, 0.9, 0.41, 0.25, 0.9, 0.04, 0.03);
  for (let r = 0; r < 4; r++) { T.box('x', 0xd1d5db, -0.12, 0.62 + r * 0.38, 0.25, 0.8, 0.03, 0.3, 0.01); for (let c = 0; c < 4; c++) T.box('g', pick(BRIGHT), -0.42 + c * 0.2, 0.66 + r * 0.38, 0.27, 0.14, 0.24, 0.12, 0.03); }
  T.box('l', 0xfff36b, 0, 2.05, 0.41, 1.1, 0.18, 0.03, 0.03, 0.4); T.box('g', 0x111827, -0.12, 0.2, 0.41, 0.8, 0.25, 0.04, 0.03); for (let i = 0; i < 4; i++) T.add('l', sph(8), [0x22c55e, 0xef4444, 0xfbbf24, 0x3b82f6][i], 0.45, 1.2 + i * 0.12, 0.44, 0, 0, 0, 0.03, 0.03, 0.015, 0.5); }
export function tableR(w, x, z, r = 1.0, H = 0.8, top = 0xffffff, leg = 0x94a3b8) { w.add('g', rcyl(r, 0.1, 0.04, 32), top, x, H - 0.1, z); w.add('x', cyl(14), leg, x, 0, z, 0, 0, 0, 0.07, H - 0.1, 0.07); w.add('x', rcyl(0.4, 0.06, 0.02, 20), leg, x, 0, z); w.solid(x - r * 0.75, 0, z - r * 0.75, x + r * 0.75, H, z + r * 0.75); }
export function tray(w, x, y, z, ry = 0) { const T = w.tf(x, y, z, ry); T.box('g', pick([0xfb7185, 0x60a5fa, 0x34d399, 0xfbbf24]), 0, 0, 0, 0.7, 0.04, 0.5, 0.02); T.add('g', rcyl(0.13, 0.03, 0.01, 18), 0xffffff, -0.15, 0.04, 0); T.add('g', wedge(), 0xffd23f, -0.15, 0.13, 0, 0, R() * 3, 0, 0.18); T.add('g', rcyl(0.06, 0.16, 0.02, 14), pick(BRIGHT), 0.2, 0.04, -0.1); T.add('g', sph(10), 0xef4444, 0.18, 0.1, 0.13, 0, 0, 0, 0.07); }
export function crate(w, x, y, z, s = 1, col = 0xd8a15a) { const T = w.tf(x, y, z, R() * 0.3, s); T.slab('m', col, 0, 0, 0, 1, 1, 1, 0.08); [-1, 1].forEach((sd) => { T.box('m', 0xb07a3c, 0, 0.05, sd * 0.505, 0.9, 0.15, 0.03, 0.02); T.box('m', 0xb07a3c, 0, 0.8, sd * 0.505, 0.9, 0.15, 0.03, 0.02); T.box('m', 0xb07a3c, sd * 0.505, 0.05, 0, 0.03, 0.15, 0.9, 0.02); T.box('m', 0xb07a3c, sd * 0.505, 0.8, 0, 0.03, 0.15, 0.9, 0.02); }); T.add('g', wedge(), 0xffd23f, 0, 0.5, 0.52, PI / 2, 0, 0, 0.3); return y + s; }
export function parcel(w, x, y, z, s = 1) { const c = pick([0xc9a06a, 0xd8b98b, 0xb88c55]); const T = w.tf(x, y, z, R() * 1.5, s); T.slab('m', c, 0, 0, 0, 0.7, 0.5, 0.55, 0.04); T.box('m', 0xa47b4a, 0, 0.5, 0, 0.12, 0.01, 0.56, 0.005); T.box('g', pick([0xef4444, 0x3b82f6]), 0.1, 0.2, 0.28, 0.25, 0.15, 0.01, 0.01); return y + 0.5 * s; }
// ---------- labs ----------
export function beaker(w, x, y, z, col = pick([0x4ade80, 0xf472b6, 0x60a5fa, 0xfbbf24, 0xa78bfa]), s = 1, kind = 0) {
  const prof = kind === 1 ? [[0, 0], [0.16, 0.01], [0.17, 0.05], [0.06, 0.3], [0.05, 0.42], [0.06, 0.44], [0, 0.44]] : kind === 2 ? [[0, 0], [0.05, 0], [0.05, 0.5], [0.06, 0.52], [0, 0.52]] : [[0, 0], [0.12, 0], [0.13, 0.32], [0.15, 0.34], [0, 0.34]];
  w.add('e', lathe(prof, 20, 'bk' + kind), 0xe0f7ff, x, y, z, 0, 0, 0, s, s, s); const lp = kind === 1 ? [[0, 0.01], [0.15, 0.02], [0.1, 0.16], [0, 0.16]] : kind === 2 ? [[0, 0.01], [0.04, 0.01], [0.04, 0.3], [0, 0.3]] : [[0, 0.01], [0.11, 0.01], [0.115, 0.2], [0, 0.2]];
  w.add('l', lathe(lp, 20, 'bl' + kind), col, x, y, z, 0, 0, 0, s * 0.97, s, s * 0.97, 0.25); }
export function labBench(w, x, z, ry = 0, L = 4, o = {}) { const T = w.tf(x, 0, z, ry), Dp = 1.3, H = 0.95; T.slab('g', o.body || 0xf8fafc, 0, 0, 0, L, H - 0.08, Dp, 0.06); T.slab('g', o.top || 0x1f2937, 0, H - 0.08, 0, L + 0.1, 0.08, Dp + 0.06, 0.03);
  for (let i = 0; i < Math.floor(L / 0.9); i++) { T.box('g', o.door || 0x93c5fd, -L / 2 + 0.45 + i * 0.9, 0.08, Dp / 2 + 0.01, 0.8, 0.7, 0.02, 0.03); T.add('x', capsule(8), 0x94a3b8, -L / 2 + 0.45 + i * 0.9, 0.62, Dp / 2 + 0.05, 0, 0, PI / 2, 0.025, 0.1, 0.025); }
  const P0 = T.P; for (let i = 0; i < (o.n || 7); i++) { const p = P0(-L / 2 + 0.4 + R() * (L - 0.8), H, -0.3 + R() * 0.6); beaker(w, p[0], p[1], p[2], undefined, 0.8 + R() * 0.6, (R() * 3) | 0); }
  if (o.burner !== false) { const p = P0(L / 2 - 0.5, H, 0.25); w.add('x', rcyl(0.1, 0.05, 0.02, 14), 0x64748b, p[0], p[1], p[2]); w.add('x', cyl(10), 0x94a3b8, p[0], p[1], p[2], 0, 0, 0, 0.03, 0.25, 0.03); w.add('l', cone(12), 0x60a5fa, p[0], p[1] + 0.25, p[2], 0, 0, 0, 0.04, 0.12, 0.04, 0.6); }
  if (o.rack !== false) { const p = P0(-L / 2 + 0.6, H, -0.35); w.add('m', rbox(0.6, 0.12, 0.2, 0.02), 0xd4a373, p[0], p[1] + 0.15, p[2], 0, ry, 0); for (let k = 0; k < 4; k++) { const q = T.P(-L / 2 + 0.38 + k * 0.15, H, -0.35); w.add('e', capsule(8), 0xe0f7ff, q[0], q[1] + 0.25, q[2], 0, 0, 0, 0.06, 0.18, 0.06); w.add('l', capsule(8), pick(BRIGHT), q[0], q[1] + 0.18, q[2], 0, 0, 0, 0.05, 0.1, 0.05, 0.3); } }
  return H; }
export function stool(w, x, z, col = 0xff4fa0) { w.add('g', rcyl(0.26, 0.08, 0.03, 20), col, x, 0.62, z); w.add('x', cyl(10), 0x94a3b8, x, 0, z, 0, 0, 0, 0.04, 0.62, 0.04); w.add('x', torus(0.08, 20), 0x94a3b8, x, 0.25, z, PI / 2, 0, 0, 0.2); w.add('x', rcyl(0.22, 0.04, 0.01, 18), 0x64748b, x, 0, z); w.solid(x - 0.26, 0, z - 0.26, x + 0.26, 0.7, z + 0.26, { cam: false }); }
export function vat(w, x, z, col = 0x4ade80, r = 0.9, H = 2.4) { w.add('x', rcyl(r + 0.15, 0.3, 0.06, 32), 0x64748b, x, 0, z); w.add('e', rcyl(r, H, 0.1, 32), 0xd8fbff, x, 0.3, z); w.add('l', rcyl(r * 0.92, H * 0.62, 0.1, 32), col, x, 0.32, z, 0, 0, 0, 1, 1, 1, 0.35);
  w.add('x', rcyl(r + 0.12, 0.25, 0.06, 32), 0x64748b, x, H + 0.3, z); w.add('x', tube([[x, H + 0.55, z], [x, H + 1.2, z], [x + r + 0.4, H + 1.4, z]], 0.08, 12, 8), 0x94a3b8, 0, 0, 0);
  for (let i = 0; i < 3; i++) w.add('x', torus(0.1, 32), 0x94a3b8, x, 0.8 + i * 0.7, z, PI / 2, 0, 0, r + 0.02, r + 0.02, 0.3); w.solid(x - r, 0, z - r, x + r, H + 0.55, z + r); w.lights.push({ x, y: 1.5, z, c: col, i: 8, d: 9 }); }
export function pipes(w, axis, at, from, to, y, cols = [0xef4444, 0x3b82f6, 0xfbbf24]) { cols.forEach((c, i) => { const o = i * 0.22; if (axis === 'x') w.add('x', cyl(14), c, (from + to) / 2, y - o, at, 0, 0, PI / 2, 0.08, to - from, 0.08); else w.add('x', cyl(14), c, at, y - o, (from + to) / 2, PI / 2, 0, 0, 0.08, to - from, 0.08);
  for (let p = from + 1; p < to; p += 2.5) { if (axis === 'x') w.add('x', torus(0.3, 16), 0x6b7280, p, y - o, at, 0, PI / 2, 0, 0.1); else w.add('x', torus(0.3, 16), 0x6b7280, at, y - o, p, 0, 0, 0, 0.1); } }); }
export function serverRack(w, x, z, ry = 0, leds) { const T = w.tf(x, 0, z, ry); T.slab('g', 0x1f2937, 0, 0, 0, 0.9, 2.4, 0.9, 0.06); for (let i = 0; i < 8; i++) { T.box('g', 0x334155, 0, 0.15 + i * 0.27, 0.46, 0.8, 0.22, 0.02, 0.02); if (leds) for (let k = 0; k < 4; k++) leds.push(T.P(-0.3 + k * 0.08, 0.26 + i * 0.27, 0.48)); } }
export function conveyor(w, x, z, ry, L = 6) { const T = w.tf(x, 0, z, ry); [-1, 1].forEach((s) => T.slab('x', 0x64748b, 0, 0, s * 0.55, L, 0.75, 0.1, 0.04)); for (let i = 0; i < L / 0.35; i++) T.add('x', cyl(12), 0xcbd5e1, -L / 2 + 0.2 + i * 0.35, 0.68, 0, PI / 2, 0, 0, 0.08, 1.0, 0.08); T.box('m', 0x1f2937, 0, 0.74, 0, L, 0.04, 1.0, 0.02); T.solid(-L / 2, 0, -0.6, L / 2, 0.78, 0.6);
  for (let i = 0; i < Math.floor(L / 1.5); i++) T.box('g', 0xffd23f, -L / 2 + 0.75 + i * 1.5, 0, 0.62, 0.5, 0.3, 0.02, 0.02); }
export function cheeseRack(w, x, z, ry = 0, n = 4) { const T = w.tf(x, 0, z, ry); [-1, 1].forEach((s) => T.slab('m', 0x9a6a3e, s * 1.4, 0, 0, 0.12, n * 0.7 + 0.2, 0.9, 0.03)); for (let i = 0; i < n; i++) { T.slab('m', 0xb98a5a, 0, 0.1 + i * 0.7, 0, 2.9, 0.08, 0.9, 0.02); for (let k = 0; k < 3; k++) { const p = T.P(-0.9 + k * 0.9, 0.18 + i * 0.7, 0); w.add('g', rcyl(0.32, 0.28, 0.08, 28), pick([0xffc93c, 0xffb020, 0xfde68a, 0xf59e0b]), p[0], p[1], p[2]); w.add('m', cyl(20), 0xe9a92a, p[0], p[1] + 0.14, p[2], 0, 0, 0, 0.325, 0.06, 0.325); } } }
export function robotArm(w, x, z, col = 0xff8a3d) { w.add('x', rcyl(0.5, 0.3, 0.06, 24), 0x475569, x, 0, z); w.solid(x - 0.5, 0, z - 0.5, x + 0.5, 0.3, z + 0.5); }
export function hazard(w, x, z, L, Dp, ry = 0) { const T = w.tf(x, 0, z, ry); const n = Math.floor(L / 0.5); for (let i = 0; i < n; i++) [-1, 1].forEach((s) => T.add('g', rbox(0.45, 0.03, 0.25, 0.01), i % 2 ? 0x111827 : 0xfacc15, -L / 2 + 0.25 + i * 0.5, 0.01, s * Dp / 2, 0, 0, 0)); }
export function cone3(w, x, z) { w.add('g', cone(16), 0xff7a1a, x, 0, z, 0, 0, 0, 0.18, 0.55, 0.18); w.add('g', torus(0.25, 16), 0xffffff, x, 0.25, z, PI / 2, 0, 0, 0.12, 0.12, 0.12); w.add('g', rbox(0.45, 0.05, 0.45, 0.02), 0xff7a1a, x, 0.025, z); }
// ---------- outdoors ----------
export function tree(w, x, z, s = 1, kind = 0) { w.add('m', capsule(10), 0x8b5a2b, x, 1.2 * s, z, 0, 0, (R() - 0.5) * 0.1, 0.45 * s, 1.3 * s, 0.45 * s); const cols = kind ? [0xff9ecf, 0xffb7dc, 0xff7ab8] : [0x3fae5a, 0x4cc36b, 0x2f9e4a];
  for (let i = 0; i < 5; i++) { const a = i * 1.3; w.add('g', blobGeo(((x * 7 + z * 3 + i) | 0) & 63, 0.2, 2), cols[i % 3], x + Math.cos(a) * 0.8 * s * (i ? 1 : 0), (3.0 + (i ? 0 : 0.7) + R() * 0.5) * s, z + Math.sin(a) * 0.8 * s * (i ? 1 : 0), 0, R() * 6, 0, 1.3 * s, 1.1 * s, 1.3 * s); }
  w.solid(x - 0.3 * s, 0, z - 0.3 * s, x + 0.3 * s, 2.6 * s, z + 0.3 * s); }
export function bush(w, x, z, s = 1, col = 0x3fae5a) { w.add('g', blobGeo(((x * 5 + z * 9) | 0) & 63, 0.22, 2), col, x, 0.45 * s, z, 0, R() * 6, 0, 0.9 * s, 0.6 * s, 0.8 * s); if (R() < 0.5) for (let i = 0; i < 4; i++) w.add('g', sph(8), pick([0xff6fcf, 0xffd23f, 0xffffff]), x + (R() - 0.5) * 1.2 * s, 0.75 * s + R() * 0.2, z + (R() - 0.5) * 1.0 * s, 0, 0, 0, 0.08 * s); w.solid(x - 0.7 * s, 0, z - 0.6 * s, x + 0.7 * s, 0.9 * s, z + 0.6 * s, { cam: false }); }
export function lampPost(w, x, z) { w.add('x', rcyl(0.25, 0.2, 0.05, 16), 0x334155, x, 0, z); w.add('x', cyl(12), 0x334155, x, 0, z, 0, 0, 0, 0.08, 3.6, 0.08); w.add('x', tube([[x, 3.5, z], [x, 3.9, z], [x + 0.5, 4.0, z]], 0.07, 10, 8), 0x334155, 0, 0, 0); w.add('l', sph(14), 0xfff1c1, x + 0.55, 3.8, z, 0, 0, 0, 0.22, 0.2, 0.22, 0.6); w.add('x', cone(14), 0x334155, x + 0.55, 3.9, z, 0, 0, 0, 0.3, 0.2, 0.3); w.solid(x - 0.12, 0, z - 0.12, x + 0.12, 3.6, z + 0.12); }
export function bench(w, x, z, ry = 0, col = 0xff8a3d) { const T = w.tf(x, 0, z, ry); for (let i = 0; i < 3; i++) T.box('m', col, 0, 0.55, -0.2 + i * 0.2, 2.2, 0.08, 0.16, 0.03); for (let i = 0; i < 2; i++) T.box('m', col, 0, 0.8 + i * 0.22, -0.38, 2.2, 0.14, 0.06, 0.03); [-1, 1].forEach((s) => T.box('x', 0x334155, s * 0.95, 0, 0, 0.1, 0.55, 0.6, 0.03)); T.solid(-1.1, 0, -0.35, 1.1, 0.62, 0.35, { cam: false }); }
export function toyCar(w, x, z, ry, col) { const T = w.tf(x, 0, z, ry); T.slab('g', col, 0, 0.25, 0, 1.6, 0.55, 3.0, 0.25); T.box('g', col, 0, 0.8, -0.2, 1.4, 0.55, 1.6, 0.25); T.box('e', 0xbfe9ff, 0, 0.85, -0.2, 1.42, 0.42, 1.3, 0.2);
  [-1, 1].forEach((s) => [-1, 1].forEach((t) => { T.add('m', torus(0.45, 20), 0x111827, s * 0.78, 0.32, t * 0.95, 0, PI / 2, 0, 0.26, 0.26, 0.3); T.add('x', cyl(14), 0xd1d5db, s * 0.8, 0.32, t * 0.95, 0, 0, PI / 2, 0.14, 0.1, 0.14); })); T.add('l', sph(10), 0xfff7c2, 0.5, 0.55, 1.5, 0, 0, 0, 0.14, 0.1, 0.05, 0.5); T.add('l', sph(10), 0xfff7c2, -0.5, 0.55, 1.5, 0, 0, 0, 0.14, 0.1, 0.05, 0.5); T.solid(-0.8, 0, -1.5, 0.8, 1.1, 1.5); }
export function flowerBed(w, x0, z0, x1, z1) { w.slab('m', 0x8b5a2b, (x0 + x1) / 2, 0, (z0 + z1) / 2, x1 - x0, 0.25, z1 - z0, 0.08, { cam: false }); w.add('m', rbox(x1 - x0 - 0.3, 0.06, z1 - z0 - 0.3, 0.03), 0x4a2f1b, (x0 + x1) / 2, 0.25, (z0 + z1) / 2);
  const n = Math.floor((x1 - x0) * (z1 - z0) * 0.8); for (let i = 0; i < n; i++) { const x = x0 + 0.3 + R() * (x1 - x0 - 0.6), z = z0 + 0.3 + R() * (z1 - z0 - 0.6), h = 0.3 + R() * 0.35, c = pick([0xff5d8f, 0xffd23f, 0xa66bff, 0xff8a3d, 0xffffff, 0x60a5fa]);
    w.add('g', cyl(6), 0x2e9e45, x, 0.25, z, 0, 0, 0, 0.02, h, 0.02); for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; w.add('g', sph(6), c, x + Math.cos(a) * 0.07, 0.25 + h, z + Math.sin(a) * 0.07, 0, 0, 0, 0.06, 0.03, 0.06); } w.add('g', sph(8), 0xffb020, x, 0.27 + h, z, 0, 0, 0, 0.04); } }
export function fenceRun(w, axis, at, from, to, H = 1.6, col = 0xffffff) { const st = Math.abs(to - from) > 60 ? 2.6 : 1.6; for (let p = from; p <= to + 0.01; p += st) { const x = axis === 'x' ? p : at, z = axis === 'x' ? at : p; w.add('m', rbox(0.18, H, 0.18, 0.05, 1), col, x, H / 2, z); w.add('m', sph(6), col, x, H + 0.05, z, 0, 0, 0, 0.13); }
  [0.45, H - 0.3].forEach((y) => { if (axis === 'x') w.add('m', rbox(to - from, 0.12, 0.08, 0.03), col, (from + to) / 2, y, at); else w.add('m', rbox(0.08, 0.12, to - from, 0.03), col, at, y, (from + to) / 2); });
  if (axis === 'x') w.solid(from, 0, at - 0.2, to, 6, at + 0.2, { wall: true, cam: false }); else w.solid(at - 0.2, 0, from, at + 0.2, 6, to, { wall: true, cam: false }); }
export function rock(w, x, z, s = 1, col = 0xb8a589) { w.add('g', blobGeo(((x * 7 + z * 13) | 0) & 63, 0.22, 2), col, x, s * 0.35, z, 0, R() * 6, 0, s, s * 0.7, s * 0.9); w.solid(x - s * 0.75, 0, z - s * 0.65, x + s * 0.75, s * 0.75, z + s * 0.65); return s * 0.75; }
export function cactus(w, x, z, s = 1, y = 0) { w.add('g', capsule(14), 0x3aa655, x, y + 1.0 * s, z, 0, 0, 0, 0.55 * s, 1.0 * s, 0.55 * s); [-1, 1].forEach((sd) => { if (R() < 0.75) { const hy = y + (0.8 + R() * 0.6) * s; w.add('g', capsule(12), 0x3aa655, x + sd * 0.42 * s, hy, z, 0, 0, sd * PI / 2, 0.3 * s, 0.35 * s, 0.3 * s); w.add('g', capsule(12), 0x3aa655, x + sd * 0.62 * s, hy + 0.32 * s, z, 0, 0, 0, 0.3 * s, 0.35 * s, 0.3 * s); } });
  for (let i = 0; i < 12; i++) { const a = R() * PI * 2, hy = R() * 1.8; w.add('m', cone(4), 0xfff7d6, x + Math.cos(a) * 0.28 * s, y + (0.3 + hy) * s, z + Math.sin(a) * 0.28 * s, 0, -a, PI / 2, 0.015 * s, 0.1 * s, 0.015 * s); }
  if (R() < 0.6) for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; w.add('g', sph(8), 0xff6fcf, x + Math.cos(a) * 0.09 * s, y + 2.05 * s, z + Math.sin(a) * 0.09 * s, 0, 0, 0, 0.09 * s, 0.05 * s, 0.09 * s); }
  w.solid(x - 0.3 * s, y, z - 0.3 * s, x + 0.3 * s, y + 2.0 * s, z + 0.3 * s); }
export { PR, propSeed, pick, rbox, rcyl, lathe, sph, cyl, cone, torus, capsule, tube, leaf, wedge, gear, star, heart, blobGeo };
