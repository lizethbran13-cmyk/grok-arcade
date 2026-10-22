// Pirate Pack level kit: island terrain, beach & jungle props, docks, hazards, NPCs and the animated sea.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { rbox } from './world.js';
import { rcyl, lathe, sph, cyl, cone, torus, capsule, tube, leaf, wedge, star, gear, blobGeo } from './shapes.js';
import { makeSea, updateSea } from './sea.js';
import { makeCaptain, animCaptain, makeParrot, animParrot } from './pmodels.js';
import { E } from './engine.js';
import { inView } from './perf.js';
import { PR } from './props.js';
export const PI = Math.PI;
export const C = { sand: 0xf3d9a4, sandW: 0xd8b679, grass: 0x5cbf4a, grassD: 0x3f9e3a, rock: 0x8d8178, rockD: 0x5b524c, basalt: 0x3a3436, wood: 0x9a6a3e, woodD: 0x6b4423, woodL: 0xc08552, rope: 0xd6b98a, gold: 0xffc83d, red: 0xdc2626 };
let seed = 1; export const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; export const pseed = (s) => { seed = s | 0 || 1; };
const cache = {};
const leaf2 = () => cache.leaf2 || (cache.leaf2 = (() => { const a = leaf().clone(), b = leaf().clone().rotateY(PI); for (const g of [a, b]) { g.deleteAttribute('uv'); if (!g.attributes.normal) g.computeVertexNormals(); } const m = mergeGeometries([a.index ? a.toNonIndexed() : a, b.index ? b.toNonIndexed() : b]); return m; })());
// ------------------------------------------------------------------ environment + sea
export function outdoor(w, env, sea = {}) {
  w.env = Object.assign({ skyTop: 0x2f8fff, skyMid: 0x9fdcff, skyBot: 0xe9f8ff, fog: 0xbfe6ff, fogD: 0.0026, sunDir: [0.45, 0.8, 0.35], sunColor: 0xfff1d6, sunI: 3.0, hemiSky: 0xd6f0ff, hemiGround: 0xd8b679, hemiI: 0.85, exposure: 1.0, bloomT: 1.05, bloomS: 0.45, envI: 0.9, outdoor: true, sunDisc: 1 }, env || {});
  const m = makeSea(Object.assign({ y: 0, size: 2600, seg: 170 }, sea)); w.group.add(m); w.sea = m; w.killY = -8;
  w.water(-1500, -20, -1500, 1500, (sea.y || 0) - 0.1, 1500); w.anims.push((dt) => updateSea(m, dt, E.scene, E.sunDir)); return m;
}
// ------------------------------------------------------------------ terrain: flat-topped polygon island with smooth rounded shores
export function inPoly(pts, x, z) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; }
export function blobPoly(cx, cz, rx, rz, n = 28, wob = 0.12, s = 1) { pseed(s); const p = []; for (let i = 0; i < n; i++) { const a = i / n * PI * 2, k = 1 + (rnd() - 0.5) * wob * 2 + Math.sin(a * 3 + s) * wob * 0.5; p.push([cx + Math.cos(a) * rx * k, cz + Math.sin(a) * rz * k]); } return p; }
export function landPoly(w, pts, top, o = {}) {
  const H = o.h || 3.5, bt = o.bt != null ? o.bt : 0.7, bs = o.bs != null ? o.bs : 1.8; const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  if (o.holes) o.holes.forEach((hp) => shape.holes.push(new THREE.Path(hp.map(([x, z]) => new THREE.Vector2(x, -z)))));
  const g = new THREE.ExtrudeGeometry(shape, { depth: H, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelSegments: 3, curveSegments: 4, steps: 1 }); g.rotateX(-PI / 2);
  // split caps (flat) from sides (smoothed) so the big top stays perfectly flat-shaded
  const gp = g.attributes.position, caps = [], sides = []; for (const gr of g.groups) { const arr = gr.materialIndex === 0 ? caps : sides; for (let i = gr.start; i < gr.start + gr.count; i++) arr.push(i); }
  const mk = (idx, smooth) => { const ng = new THREE.BufferGeometry(), a = new Float32Array(idx.length * 3); idx.forEach((v, i) => { a[i * 3] = gp.getX(v); a[i * 3 + 1] = gp.getY(v); a[i * 3 + 2] = gp.getZ(v); }); ng.setAttribute('position', new THREE.BufferAttribute(a, 3)); let r = ng; if (smooth) { r = mergeVertices(ng, 0.01); } r.computeVertexNormals(); return r; };
  const topCol = o.top || C.sand, sideCol = o.side || C.sandW, y0 = top - H - bt;
  w.addFn('m', mk(caps, false), (c, x, y, z) => { if (y > top - 0.05) { const n = Math.sin(x * 0.21 + z * 0.13) * 0.5 + Math.sin(x * 0.07 - z * 0.19) * 0.5; c.set(topCol).offsetHSL(0, 0, n * 0.03); } else c.set(sideCol).multiplyScalar(0.6); }, 0, y0, 0);
  w.addFn('m', mk(sides, true), (c, x, y, z) => { const k = Math.max(0, Math.min(1, (y - (top - 1.4)) / 1.4)); c.set(sideCol).lerp(new THREE.Color(topCol), k * 0.7); if (y < 0.4) c.multiplyScalar(0.78); }, 0, y0, 0);
  // colliders: scanline strips (1 unit rows)
  let zmin = 1e9, zmax = -1e9; pts.forEach(([, z]) => { zmin = Math.min(zmin, z); zmax = Math.max(zmax, z); });
  const holeT = (x, z) => o.holes && o.holes.some((hp) => inPoly(hp, x, z));
  for (let z = Math.floor(zmin); z < zmax; z += 1) { const zc = z + 0.5, xs = []; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > zc) !== (zj > zc)) xs.push((xj - xi) * (zc - zi) / (zj - zi) + xi); } xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) { if (!o.holes) { w.solid(xs[k] - 0.4, y0, z, xs[k + 1] + 0.4, top, z + 1, { floor: true }); continue; }
      let a = xs[k]; for (let x = xs[k]; x <= xs[k + 1] + 0.5; x += 0.5) { const hole = x > xs[k + 1] || holeT(x, zc); if (hole) { if (x - a > 0.3) w.solid(a - 0.2, y0, z, Math.min(x, xs[k + 1]) + 0.2, top, z + 1, { floor: true }); a = x + 0.5; } } } }
  const L = { pts, top, inside: (x, z) => inPoly(pts, x, z) && !holeT(x, z) }; (w.lands = w.lands || []).push(L); return L;
}
export const groundAt = (w, x, z, y = 80) => { const g = w.ground(x, z, y, 0.1); return g.y > -1e8 ? g.y : 0; };
// rounded rock plateau with a coloured top
export function mesa(w, x, z, sx, sz, top, col = C.rock, topCol = C.grass, y0 = 0) { w.add('m', rbox(sx, top - y0, sz, Math.min(1.2, sx / 4, sz / 4), 3), col, x, (top + y0) / 2, z); w.add('m', rbox(sx - 0.3, 0.35, sz - 0.3, 0.15), topCol, x, top - 0.1, z); w.solid(x - sx / 2, y0, z - sz / 2, x + sx / 2, top + 0.05, z + sz / 2);
  pseed((x * 7 + z * 13) | 0); for (let i = 0; i < Math.ceil((sx + sz) / 3); i++) { const s = rnd() < 0.5, side = rnd() < 0.5 ? -1 : 1; const px = s ? x + side * (sx / 2) : x + (rnd() - 0.5) * sx, pz = s ? z + (rnd() - 0.5) * sz : z + side * (sz / 2); w.add('m', blobGeo(((px * 3 + pz) | 0) & 63, 0.25, 2), col, px, y0 + (top - y0) * (0.25 + rnd() * 0.4), pz, 0, rnd() * 6, 0, 1 + rnd() * 1.2, (top - y0) * 0.35, 1 + rnd()); } return top + 0.05; }
// ramp rising along +axis*dir from y0 to y1 (x,z = centre of the ramp footprint)
export function ramp(w, x, z, wid, len, y0, y1, axis, dir, col = C.sandW, bucket = 'm') { const ang = Math.atan2(y1 - y0, len), L = Math.hypot(len, y1 - y0);
  if (axis === 'z') { w.add(bucket, rbox(wid, 0.5, L, 0.2), col, x, (y0 + y1) / 2 - 0.22, z, dir > 0 ? -ang : ang, 0, 0); w.solid(x - wid / 2, y0, z - len / 2, x + wid / 2, y1, z + len / 2, { ramp: ['z', dir] }); }
  else { w.add(bucket, rbox(L, 0.5, wid, 0.2), col, x, (y0 + y1) / 2 - 0.22, z, 0, 0, dir > 0 ? ang : -ang); w.solid(x - len / 2, y0, z - wid / 2, x + len / 2, y1, z + wid / 2, { ramp: ['x', dir] }); } }
// steps (stairs) from (x,z) along axis, n steps of h each
export function steps(w, x, z, wid, n, h, d, axis, dir, col = C.woodL, y0 = 0) { for (let i = 0; i < n; i++) { const o = (i + 0.5) * d * dir; const px = axis === 'x' ? x + o : x, pz = axis === 'z' ? z + o : z; const sx = axis === 'x' ? d : wid, sz = axis === 'z' ? d : wid; w.slab('m', col, px, y0, pz, sx, h * (i + 1), sz, 0.08); } }
// ------------------------------------------------------------------ plants
export function palm(w, x, y, z, h = 10, lean = 0.25, ry = 0, o = {}) { const N = 10, dx = Math.sin(ry), dz = Math.cos(ry); let px = x, pz = z, py = y;
  for (let i = 0; i < N; i++) { const t = i / N, t2 = (i + 1) / N; const ox = dx * lean * h * t2 * t2, oz = dz * lean * h * t2 * t2; const nx = x + ox, nz = z + oz, ny = y + h * t2; const r = 0.72 - t * 0.3;
    w.add('m', rcyl(r, h / N * 1.08, 0.12, 14), i % 2 ? C.woodD : 0x8b5e34, px, py, pz, Math.atan2(nz - pz, h / N) * 1, 0, -Math.atan2(nx - px, h / N)); px = nx; pz = nz; py = ny; }
  const cx = px, cy = py, cz = pz; w.add('m', sph(14), 0x6b4423, cx, cy, cz, 0, 0, 0, 0.75, 0.5, 0.75);
  for (let i = 0; i < 3; i++) w.add('g', sph(14), 0x7c5a2e, cx + Math.cos(i * 2.1) * 0.55, cy - 0.45, cz + Math.sin(i * 2.1) * 0.55, 0, 0, 0, 0.42);
  const cols = o.cols || [0x2fa84f, 0x3fbf5a, 0x249a45]; const nF = o.fronds || 8;
  for (let i = 0; i < nF; i++) { const a = i / nF * PI * 2 + ry; const L1 = 2.6 * (h / 10) * 1.1, L2 = 2.9 * (h / 10) * 1.1; const col = cols[i % cols.length];
    w.add('g', leaf2(), col, cx, cy, cz, PI / 2 - 0.35, a, 0, 1.5 * (h / 10) + 0.4, L1 / 1.1, 1);
    const ex = cx + Math.sin(a) * Math.cos(0.35) * L1, ey = cy + Math.sin(0.35) * L1, ez = cz + Math.cos(a) * Math.cos(0.35) * L1; w.add('g', leaf2(), col, ex, ey, ez, PI / 2 + 0.75, a, 0, 1.3 * (h / 10) + 0.35, L2 / 1.1, 1); }
  w.solid(x - 0.6, y, z - 0.6, x + 0.6, y + h * 0.55, z + 0.6); if (o.top) w.solid(cx - 1.6, cy - 0.2, cz - 1.6, cx + 1.6, cy + 0.15, cz + 1.6, { cam: false }); return [cx, cy + 0.15, cz]; }
export function bush(w, x, y, z, s = 1.4, col = 0x2f9e4a, flowers) { pseed((x * 31 + z * 17) | 0); for (let i = 0; i < 5; i++) w.add('g', blobGeo((i * 7 + ((x + z) | 0)) & 31, 0.15, 2), [col, 0x3fae5a, 0x2b8f43][i % 3], x + (rnd() - 0.5) * s, y + s * 0.45 + rnd() * s * 0.2, z + (rnd() - 0.5) * s, 0, rnd() * 6, 0, s * 0.7, s * 0.55, s * 0.7);
  if (flowers) for (let i = 0; i < 6; i++) w.add('g', sph(8), flowers, x + (rnd() - 0.5) * s * 1.4, y + s * 0.8 + rnd() * s * 0.3, z + (rnd() - 0.5) * s * 1.4, 0, 0, 0, 0.18); }
export function fern(w, x, y, z, s = 1, col = 0x3fbf5a) { for (let i = 0; i < 6; i++) w.add('g', leaf2(), col, x, y, z, PI / 2 - 0.9, i * 1.05, 0, 0.6 * s, 1.6 * s, 1); }
export function jungleTree(w, x, y, z, h = 18, r = 1.6, col = 0x2f9e4a) { w.add('m', cyl(18, 0.8), 0x6b4423, x, y, z, 0, 0, 0, r, h, r); for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.4; w.add('m', capsule(10), 0x5b3a1f, x + Math.cos(a) * r * 0.9, y + 0.5, z + Math.sin(a) * r * 0.9, Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9, r * 0.6, 2.2, r * 0.6); }
  pseed((x * 13 + z) | 0); for (let i = 0; i < 6; i++) w.add('g', blobGeo((i + ((x * 3) | 0)) & 31, 0.2, 2), [col, 0x3fae5a, 0x237a3b][i % 3], x + (rnd() - 0.5) * 7, y + h + (rnd() - 0.3) * 3, z + (rnd() - 0.5) * 7, 0, rnd() * 6, 0, 4.2, 3, 4.2); w.solid(x - r, y, z - r, x + r, y + h, z + r); }
// ------------------------------------------------------------------ beach & pirate props
export function shellPad(w, x, y, z, s = 1.6, bounce = 17, col = 0xffb3c8) { for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.3; w.add('g', capsule(12), i % 2 ? col : 0xffd6e6, x + Math.sin(a) * s * 0.45, y + 0.12, z - Math.cos(a) * s * 0.45 + s * 0.3, PI / 2 - 0.08, a, 0, s * 0.32, s * 0.9, s * 0.16); }
  w.add('g', sph(12), 0xffe4ee, x, y + 0.1, z + s * 0.55, 0, 0, 0, s * 0.3, 0.15, 0.2); const sd = w.solid(x - s * 0.7, y, z - s * 0.5, x + s * 0.7, y + 0.35, z + s * 0.7); sd.bounce = bounce; return sd; }
export function barrel(w, x, y, z, s = 1, ry = 0, col = 0x9a6a3e) { w.add('m', lathe([[0, 0], [0.62, 0], [0.75, 0.4], [0.8, 0.8], [0.75, 1.2], [0.62, 1.6], [0, 1.6]], 22, 'barrel'), col, x, y, z, 0, ry, 0, s, s, s); [0.15, 0.8, 1.45].forEach((h) => w.add('x', torus(0.05, 28), 0x4b4b52, x, y + h * s, z, PI / 2, 0, 0, (h === 0.8 ? 0.81 : 0.7) * s, (h === 0.8 ? 0.81 : 0.7) * s, 1.2 * s)); w.solid(x - 0.75 * s, y, z - 0.75 * s, x + 0.75 * s, y + 1.6 * s, z + 0.75 * s); return y + 1.6 * s; }
export function torch(w, x, y, z, h = 3.2, col = 0xffa53d) { w.add('m', cyl(10, 0.8), 0x7c4a22, x, y, z, 0, 0, 0, 0.14, h, 0.14); w.add('m', lathe([[0, 0], [0.3, 0.05], [0.42, 0.5], [0, 0.5]], 14), 0x9a6a3e, x, y + h - 0.2, z); w.add('l', cone(12), col, x, y + h + 0.3, z, 0, 0, 0, 0.3, 0.8, 0.3, 1.6); w.add('l', cone(10), 0xfff07a, x, y + h + 0.3, z, 0, 0, 0, 0.16, 0.5, 0.16, 2);
  w.lights.push({ x, y: y + h + 1, z, c: col, i: 22, d: 18 }); w.solid(x - 0.2, y, z - 0.2, x + 0.2, y + h, z + 0.2, { cam: false }); }
export function pier(w, x0, z0, x1, z1, y, o = {}) { const ax = Math.abs(x1 - x0) > Math.abs(z1 - z0) ? 'x' : 'z'; const L = ax === 'x' ? Math.abs(x1 - x0) : Math.abs(z1 - z0), wid = o.w || 4; const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const n = Math.round(L / 0.9); for (let i = 0; i < n; i++) { const t = -L / 2 + (i + 0.5) * L / n; const col = [0xb07a45, 0xa36d3c, 0xbd8650][i % 3]; if (ax === 'x') w.add('m', rbox(L / n - 0.08, 0.3, wid, 0.06), col, cx + t, y - 0.15, cz); else w.add('m', rbox(wid, 0.3, L / n - 0.08, 0.06), col, cx, y - 0.15, cz + t); }
  for (let t = -L / 2; t <= L / 2 + 0.1; t += 4) [-1, 1].forEach((s) => { const px = ax === 'x' ? cx + t : cx + s * (wid / 2 - 0.2), pz = ax === 'x' ? cz + s * (wid / 2 - 0.2) : cz + t; w.add('m', rcyl(0.3, y + 4.5, 0.08, 12), 0x7c4a22, px, -4, pz); w.add('m', rcyl(0.34, 0.15, 0.05, 12), 0x5b3a1f, px, y + 0.4, pz); });
  if (ax === 'x') w.solid(Math.min(x0, x1), y - 0.3, cz - wid / 2, Math.max(x0, x1), y, cz + wid / 2, { floor: true }); else w.solid(cx - wid / 2, y - 0.3, Math.min(z0, z1), cx + wid / 2, y, Math.max(z0, z1), { floor: true });
  if (o.rope !== false) [-1, 1].forEach((s) => { const pts = []; for (let t = -L / 2; t <= L / 2 + 0.01; t += L / 8) pts.push(ax === 'x' ? [cx + t, y + 0.5 + Math.cos(t) * 0.05, cz + s * (wid / 2 - 0.2)] : [cx + s * (wid / 2 - 0.2), y + 0.5, cz + t]); w.add('m', tube(pts, 0.06, 40, 6), C.rope, 0, 0, 0); }); }
export function rowboat(w, x, y, z, ry = 0, col = 0x3b82f6) { const T = w.tf(x, y, z, ry); T.add('g', lathe([[0, -0.5], [1.0, -0.4], [1.35, 0.2], [1.4, 0.45], [0, 0.45]], 24, 'rowb'), col, 0, 0, 0, 0, 0, 0, 1, 1, 2.4); T.add('m', rbox(2.4, 0.15, 0.6, 0.05), C.woodL, 0, 0.3, 0.6); T.add('m', rbox(2.4, 0.15, 0.6, 0.05), C.woodL, 0, 0.3, -1.2);
  T.add('m', capsule(10), C.woodL, 1.4, 0.4, 0, 0, 0.3, 1.3, 0.12, 3, 0.12); T.add('g', torus(0.1, 24), 0xffffff, 0, 0.45, 0, PI / 2, 0, 0, 1.36, 3.3, 1); }
export function crates(w, x, y, z, ry = 0, n = 3) { const T = w.tf(x, y, z, ry); const P_ = [[0, 0, 0, 1.6], [1.7, 0, 0.2, 1.4], [0.8, 1.6, 0.1, 1.3], [-1.4, 0, -0.4, 1.2]].slice(0, n);
  P_.forEach(([lx, ly, lz, s]) => { T.box('m', 0xc08552, lx, ly, lz, s, s, s, 0.08); T.box('m', 0x8b5a2b, lx, ly + s * 0.45, lz, s + 0.04, 0.16, s + 0.04, 0.04); T.add('m', rbox(0.12, s * 1.3, 0.04, 0.02), 0x8b5a2b, lx, ly + s / 2, lz + s / 2 + 0.01, 0, 0, 0.78); T.solid(lx - s / 2, ly, lz - s / 2, lx + s / 2, ly + s, lz + s / 2); }); }
export function treasurePile(w, x, y, z, s = 1) { pseed((x * 5 + z * 3) | 0); w.add('x', sph(20), C.gold, x, y, z, 0, 0, 0, 1.6 * s, 0.7 * s, 1.4 * s); for (let i = 0; i < 22; i++) { const a = rnd() * 6.28, r = rnd() * 1.6 * s; w.add('x', rcyl(0.3 * s, 0.08, 0.03, 16), [C.gold, 0xffe08a, 0xf59e0b][i % 3], x + Math.cos(a) * r, y + 0.1 + rnd() * 0.6 * s, z + Math.sin(a) * r, rnd() * 1.5, rnd() * 6, 0); }
  for (let i = 0; i < 5; i++) w.add('g', new THREE.OctahedronGeometry(0.3 * s, 0), [0xff4fd8, 0x3ff0ff, 0x4ade80, 0xef4444, 0xa78bfa][i], x + Math.cos(i * 1.3) * s, y + 0.6 * s, z + Math.sin(i * 1.3) * s, 0, i, 0.3, 1, 1.4, 1, 0.4); }
export function crystal(w, x, y, z, s = 1, col = 0x3ff0ff, light = true) { for (let i = 0; i < 5; i++) { const a = i * 1.26; w.add('l', cone(6), col, x + Math.cos(a) * 0.4 * s, y, z + Math.sin(a) * 0.4 * s, Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35, 0.35 * s, (1.6 + (i % 3) * 0.6) * s, 0.35 * s, 0.7); } if (light) w.lights.push({ x, y: y + 1.5, z, c: col, i: 18, d: 14 }); }
export function coral(w, x, y, z, s = 1, col = 0xff6f91) { for (let i = 0; i < 5; i++) { const a = i * 1.26; w.add('g', tube([[x, y, z], [x + Math.cos(a) * 0.5 * s, y + 1.0 * s, z + Math.sin(a) * 0.5 * s], [x + Math.cos(a) * 0.9 * s, y + (1.6 + (i % 2) * 0.6) * s, z + Math.sin(a) * 0.9 * s]], 0.18 * s, 10, 8), col, 0, 0, 0); w.add('g', sph(10), col, x + Math.cos(a) * 0.9 * s, y + (1.6 + (i % 2) * 0.6) * s, z + Math.sin(a) * 0.9 * s, 0, 0, 0, 0.22 * s); } }
export function starfish(w, x, y, z, col = 0xff8a3d, s = 0.6) { w.add('g', star(), col, x, y + 0.05, z, -PI / 2, rnd() * 6, 0, s, s, 0.4); }
export function shell(w, x, y, z, s = 0.5, col = 0xffd6e6) { w.add('g', lathe([[0, 0], [0.6, 0.05], [0.9, 0.3], [0.5, 0.7], [0.15, 1.1], [0, 1.2]], 14), col, x, y, z, PI / 2 - 0.2, rnd() * 6, 0, s, s, s); }
export function flag(w, x, y, z, h = 9, col = 0x111827, ry = 0) { w.add('m', cyl(10), C.woodD, x, y, z, 0, 0, 0, 0.12, h, 0.12); const g = w.dynObj((T) => { T.add('f', rbox(2.6, 1.6, 0.06, 0.03), col, 1.35, -0.8, 0); T.add('g', sph(10), 0xffffff, 1.3, -0.75, 0.04, 0, 0, 0, 0.32, 0.32, 0.05); T.add('g', wedge(), 0xffd23f, 1.05, -0.95, 0.06, 0, 0, 0, 0.35); }); g.position.set(x, y + h, z); g.rotation.y = ry; w.anims.push((dt, t) => { g.rotation.y = ry + Math.sin(t * 2 + x) * 0.15; }); }
export function cannonModel(T, lx = 0, ly = 0, lz = 0) { T.add('m', rbox(1.6, 0.6, 2.0, 0.1), 0x6b4423, lx, ly + 0.5, lz); [-1, 1].forEach((s) => [-0.6, 0.6].forEach((z) => T.add('m', rcyl(0.38, 0.2, 0.05, 16), 0x4b3621, lx + s * 0.85, ly + 0.38, lz + z, 0, 0, PI / 2)));
  T.add('x', lathe([[0, -1.4], [0.42, -1.4], [0.5, -0.4], [0.42, 1.2], [0.48, 1.35], [0.3, 1.35], [0.3, 1.3], [0, 1.3]], 22, 'cannonB'), 0x2d2d33, lx, ly + 1.15, lz, PI / 2 - 0.15, 0, 0); T.add('x', sph(12), 0x2d2d33, lx, ly + 1.15, lz - 1.45, 0, 0, 0, 0.3); }
// ------------------------------------------------------------------ walls, caves, bridges
export function rockWall(w, x0, z0, x1, z1, y0, h, col = C.rock, o = {}) { const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, sx = Math.abs(x1 - x0), sz = Math.abs(z1 - z0); w.add('m', rbox(sx, h, sz, Math.min(0.8, sx / 3, sz / 3), 2), col, cx, y0 + h / 2, cz); w.solid(Math.min(x0, x1), y0, Math.min(z0, z1), Math.max(x0, x1), y0 + h, Math.max(z0, z1), o.solid);
  if (o.lumps !== false) { pseed((cx * 11 + cz * 7) | 0); const n = Math.ceil(Math.max(sx, sz) / 2.6); for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; const px = sx > sz ? Math.min(x0, x1) + t * sx : cx + (rnd() - 0.5) * sx * 0.6, pz = sx > sz ? cz + (rnd() - 0.5) * sz * 0.6 : Math.min(z0, z1) + t * sz;
    w.add('m', blobGeo(((i * 13) + ((cx + cz) | 0)) & 63, 0.28, 2), i % 3 ? col : o.col2 || C.rockD, px, y0 + h * (0.3 + rnd() * 0.55), pz, 0, rnd() * 6, 0, (sx > sz ? 2 : sx * 0.62) + rnd(), h * (0.25 + rnd() * 0.25), (sx > sz ? sz * 0.62 : 2) + rnd()); } } }
export function camZone(w, x0, z0, x1, z1, y0, y1, dist = 4.6, pmax = 0.55) { w.zone('camz', x0, y0, z0, x1, y1, z1, { dist, pmax }); }
export function ceiling(w, x0, z0, x1, z1, y, th = 1.2, col = C.rockD) { w.add('m', rbox(Math.abs(x1 - x0) + 0.4, th, Math.abs(z1 - z0) + 0.4, 0.3), col, (x0 + x1) / 2, y + th / 2, (z0 + z1) / 2); w.solid(Math.min(x0, x1), y, Math.min(z0, z1), Math.max(x0, x1), y + th, Math.max(z0, z1), { nofloor: true, camBlock: true }); }
export function ropeBridge(w, x0, z0, x1, z1, y, wid = 2.6, sag = 0.5) { const ax = Math.abs(x1 - x0) > Math.abs(z1 - z0) ? 'x' : 'z', L = ax === 'x' ? Math.abs(x1 - x0) : Math.abs(z1 - z0); const n = Math.round(L / 0.8); const s0 = ax === 'x' ? Math.min(x0, x1) : Math.min(z0, z1), cc = ax === 'x' ? z0 : x0;
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, p = s0 + t * L, yy = y - Math.sin(t * PI) * sag; const col = [0xb07a45, 0xa36d3c, 0xc08552][i % 3]; if (ax === 'x') { w.add('m', rbox(0.62, 0.18, wid, 0.05), col, p, yy - 0.09, cc); w.solid(p - 0.42, yy - 0.2, cc - wid / 2, p + 0.42, yy, cc + wid / 2, { floor: true }); } else { w.add('m', rbox(wid, 0.18, 0.62, 0.05), col, cc, yy - 0.09, p); w.solid(cc - wid / 2, yy - 0.2, p - 0.42, cc + wid / 2, yy, p + 0.42, { floor: true }); } }
  [-1, 1].forEach((s) => { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10, p = s0 + t * L, yy = y - Math.sin(t * PI) * sag + 1.0; pts.push(ax === 'x' ? [p, yy, cc + s * wid / 2] : [cc + s * wid / 2, yy, p]); } w.add('m', tube(pts, 0.07, 40, 6), C.rope, 0, 0, 0);
    [0, 1].forEach((e) => { const p = s0 + e * L; w.add('m', rcyl(0.22, 2.0, 0.06, 10), C.woodD, ax === 'x' ? p : cc + s * wid / 2, y - 0.6, ax === 'x' ? cc + s * wid / 2 : p); }); }); }
// ------------------------------------------------------------------ hazards
export function lava(w, x0, z0, x1, z1, y) { const sx = Math.abs(x1 - x0), sz = Math.abs(z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  w.addFn('l', rbox(sx, 0.3, sz, 0.12, 1), (c, x, yy, z) => c.set(Math.sin(x * 0.9 + z * 0.6) + Math.sin(z * 1.3 - x * 0.4) > 0.6 ? 0xffd23f : 0xff5a1a).multiplyScalar(1.15), cx, y - 0.1, cz); w.hot(Math.min(x0, x1), y - 1, Math.min(z0, z1), Math.max(x0, x1), y + 0.1, Math.max(z0, z1));
  w.lights.push({ x: cx, y: y + 2.5, z: cz, c: 0xff6a1a, i: 26, d: Math.max(sx, sz) + 8 }); w.anims.push(() => { if (Math.random() < 0.18 && w.game && inView(cx, y, cz, Math.max(sx, sz))) w.game.fx.emit(cx + (Math.random() - 0.5) * sx, y + 0.3, cz + (Math.random() - 0.5) * sz, 0, 2.5, 0, 0.1, Math.random() < 0.5 ? 0xff7a3d : 0xffd23f, 0.9, -1, 0.5); }); }
export function geyser(w, x, y, z, r = 1.4, h = 14, force = 34) { w.zone('wind', x - r, y, z - r, x + r, y + h, z + r, { f: [0, force, 0] }); w.add('m', torus(0.4, 24), C.basalt, x, y + 0.2, z, PI / 2, 0, 0, r + 0.3, r + 0.3, 1.2); w.add('l', rcyl(r, 0.1, 0.05, 20), 0xbff4ff, x, y + 0.05, z, 0, 0, 0, 1, 1, 1, 0.4);
  w.anims.push(() => { if (w.game && inView(x, y + 3, z, 4)) for (let i = 0; i < 2; i++) w.game.fx.emit(x + (Math.random() - 0.5) * r, y + 0.5, z + (Math.random() - 0.5) * r, (Math.random() - 0.5) * 1.5, 9 + Math.random() * 6, (Math.random() - 0.5) * 1.5, 0.35, 0xf1f5f9, 1.4, -0.5, 0); }); }
// coconuts / rocks that drop near the player while they're inside a zone
export function dropZone(w, x0, z0, x1, z1, every, col, high = 13) { let t = 1; w.anims.push((dt) => { const g = w.game; if (!g || !g.me) return; const me = g.me; if (me.x < x0 || me.x > x1 || me.z < z0 || me.z > z1 || me.respawnT > 0) return; t -= dt; if (t > 0) return; t = every * (0.7 + Math.random() * 0.6);
  const tx = me.x + me.vx * 0.9 + (Math.random() - 0.5) * 2, tz = me.z + me.vz * 0.9 + (Math.random() - 0.5) * 2; g.actors.lob(tx + (Math.random() - 0.5) * 3, me.y + high, tz + (Math.random() - 0.5) * 3, tx, me.y, tz, col); }); }
// fixed cannon that lobs cannonballs at the player when they're in range
export function autoCannon(w, x, y, z, ry, range = 26, every = 2.6, off) { const T = w.tf(x, y, z, ry); cannonModel(T); T.solid(-0.8, 0, -1, 0.8, 1.4, 1); let t = Math.random() * every;
  w.anims.push((dt) => { const g = w.game; if (!g || !g.me || (off && off())) return; const me = g.me, d = Math.hypot(me.x - x, me.z - z); if (d > range || d < 3 || me.respawnT > 0) return; t -= dt; if (t > 0) return; t = every;
    const P_ = T.P(0, 1.2, -1.6); g.actors.lob(P_[0], P_[1], P_[2], me.x + me.vx * 1.1, me.y, me.z + me.vz * 1.1, 0x1f2937); g.fx.burst(P_[0], P_[1], P_[2], 0xfff1c1, 8, 3); g.fx.puff && g.fx.puff(P_[0], P_[1], P_[2], 4); }); }
// ------------------------------------------------------------------ NPCs
export function captainNPC(w, x, y, z, yaw, o = {}) { const r = makeCaptain(); r.root.position.set(x, y, z); r.root.rotation.y = yaw; w.group.add(r.root); w.solid(x - 0.7, y, z - 0.7, x + 0.7, y + 2.8, z + 0.7, { cam: false });
  let wave = 0; w.anims.push((dt) => { if (!inView(x, y + 1.5, z, 3)) return; const g = w.game; let mode = ''; if (g && g.me && Math.hypot(g.me.x - x, g.me.z - z) < 5) { mode = 'wave'; const ty = Math.atan2(g.me.x - x, g.me.z - z); let d = ty - r.root.rotation.y; while (d > PI) d -= PI * 2; while (d < -PI) d += PI * 2; r.root.rotation.y += d * Math.min(1, dt * 3); } animCaptain(r, dt, mode); });
  (w.kiosks = w.kiosks || []).push({ id: 'captain', x, y, z, r: 3.4, label: o.label || '🏴‍☠️ Talk to Captain Eye Patch', fn: o.fn }); w.captainRig = r; return r; }
// Grumbles: perched (x,y,z) or following Pi-rat around the island
export function parrotNPC(w, o = {}) { const r = makeParrot(); w.group.add(r.root); const p = r.root.position; const perch = o.perch; if (perch) { p.set(perch[0], perch[1], perch[2]); r.root.rotation.y = perch[3] || 0; } else p.set(0, 5, 0);
  let fly = !perch, bump = 0; w.anims.push((dt, T) => { const g = w.game; if (!g || !g.me) return; const me = g.me;
    if (perch) { animParrot(r, dt, false); return; }
    const a = me.yaw + 2.3, tx = me.x + Math.sin(a) * 1.6, tz = me.z + Math.cos(a) * 1.6, ty = me.y + 2.3 + Math.sin(T * 2) * 0.25; const dx = tx - p.x, dy = ty - p.y, dz = tz - p.z, d = Math.hypot(dx, dy, dz);
    if (d > 40 || me.respawnT > 0.5) { p.set(tx, ty, tz); } else { const k = Math.min(1, dt * (d > 6 ? 4 : 2.2)); p.x += dx * k; p.y += dy * k; p.z += dz * k; }
    fly = d > 0.35 || !me.onGround; const fy = Math.atan2(dx, dz); if (d > 0.4) { let dd = fy - r.root.rotation.y; while (dd > PI) dd -= PI * 2; while (dd < -PI) dd += PI * 2; r.root.rotation.y += dd * Math.min(1, dt * 5); } else { let dd = me.yaw - r.root.rotation.y; while (dd > PI) dd -= PI * 2; while (dd < -PI) dd += PI * 2; r.root.rotation.y += dd * Math.min(1, dt * 3); }
    animParrot(r, dt, true); }); w.parrotRig = r; return r; }
// cranky commentary: a hint zone that speaks as Grumbles (or the Captain)
export function talk(w, x0, z0, x1, z1, who, msg, y0 = -5, y1 = 80) { w.hint(x0, z0, x1, z1, (who === 'cap' ? '🏴‍☠️ Captain: ' : who === 'tor' ? '🐢 Torty: ' : '🦜 Grumbles: ') + msg, y0, y1); }
// latching pressure plate with its own glow lamp (stays down once pressed)
export function latchPlate(w, id, x, y, z, r = 1.4, col = 0x3ff0ff) { w.plate(id, x, y, z, r, col); const pl = w.plates[w.plates.length - 1]; pl.latch = true;
  const lamp = w.dynObj((T) => { T.add('l', sph(14), 0xffffff, 0, 0, 0, 0, 0, 0, 0.35, 0.35, 0.35, 1); }); lamp.position.set(x, y + 2.2, z); const pole = w.add('x', cyl(10), 0x6b7280, x, y, z - r - 0.3, 0, 0, 0, 0.08, 2.2, 0.08); lamp.position.z = z - r - 0.3; lamp.position.y = y + 2.4;
  const m = lamp.children[0]; let was = null; w.anims.push(() => { if (pl.on === was) return; was = pl.on; lamp.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.color.set(pl.on ? 0x7dffb0 : 0x555555); } }); if (pl.on && w.game && w.game.T > 0.5) { w.game.toastMsg('✅ Click! A pressure plate locks down'); w.game.fx.burst(x, y + 1, z, 0x7dffb0, 14); } }); return pl; }
export { PR };
