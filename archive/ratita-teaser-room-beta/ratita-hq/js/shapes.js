// Extra smooth primitives (cached): rounded cylinders, rings, leaves, petals.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
const cache = new Map();
const C = (k, f) => { let g = cache.get(k); if (!g) { g = f(); cache.set(k, g); } return g; };
// rounded cylinder, bottom at y=0, radius r, height h, edge bevel b
export function rcyl(r, h, b = 0.05, seg = 28) {
  return C('rc' + [r, h, b, seg].join(','), () => { b = Math.min(b, r * 0.5, h * 0.5); const pts = [new THREE.Vector2(0, 0)];
    for (let i = 0; i <= 4; i++) { const a = -Math.PI / 2 + i / 4 * Math.PI / 2; pts.push(new THREE.Vector2(r - b + Math.cos(a) * b, b + Math.sin(a) * b)); }
    for (let i = 0; i <= 4; i++) { const a = i / 4 * Math.PI / 2; pts.push(new THREE.Vector2(r - b + Math.cos(a) * b, h - b + Math.sin(a) * b)); }
    pts.push(new THREE.Vector2(0, h)); return new THREE.LatheGeometry(pts, seg); });
}
// open cup / bowl / pot by profile points [[r,y]...]
export function lathe(pts, seg = 32, key) { const k = key || 'la' + JSON.stringify(pts) + seg; return C(k, () => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg)); }
export function sph(seg = 20) { return C('s' + seg, () => new THREE.SphereGeometry(1, seg, Math.max(8, seg * 0.6 | 0))); }
export function cyl(seg = 24, rt = 1) { return C('c' + seg + ',' + rt, () => new THREE.CylinderGeometry(rt, 1, 1, seg, 1).translate(0, 0.5, 0)); }
export function cone(seg = 24) { return C('k' + seg, () => new THREE.ConeGeometry(1, 1, seg, 1).translate(0, 0.5, 0)); }
export function torus(t = 0.3, seg = 32, arc = Math.PI * 2) { return C('t' + t + ',' + seg + ',' + arc, () => new THREE.TorusGeometry(1, t, 12, seg, arc)); }
export function capsule(seg = 16) { return C('cp' + seg, () => new THREE.CapsuleGeometry(0.5, 1, 6, seg)); }
export function tube(pts, r, seg = 32, rs = 10) { return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), seg, r, rs, false); }
export function leaf() { return C('leaf', () => { const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(0.45, 0.25, 0.45, 0.75, 0, 1.1); s.bezierCurveTo(-0.45, 0.75, -0.45, 0.25, 0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 12 }); g.translate(0, 0, -0.01);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i); p.setZ(i, p.getZ(i) + y * y * 0.25 - Math.abs(x) * 0.25); } g.computeVertexNormals(); return g; }); }
export function blade() { return C('blade', () => { const g = new THREE.ConeGeometry(0.08, 1, 4, 3, true); g.translate(0, 0.5, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, p.getZ(i) + y * y * 0.35); p.setX(i, p.getX(i) * 1.6); } g.computeVertexNormals(); return g; }); }
export function star() { return C('star', () => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.45 : 1; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  return new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 3 }).translate(0, 0, -0.125); }); }
export function heart() { return C('heart', () => { const s = new THREE.Shape(); s.moveTo(0, -0.9); s.bezierCurveTo(-0.3, -0.55, -1, -0.2, -1, 0.3); s.bezierCurveTo(-1, 0.85, -0.3, 1, 0, 0.55); s.bezierCurveTo(0.3, 1, 1, 0.85, 1, 0.3); s.bezierCurveTo(1, -0.2, 0.3, -0.55, 0, -0.9);
  return new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.14, bevelThickness: 0.14, bevelSegments: 4, curveSegments: 16 }).translate(0, 0, -0.15); }); }
// cheese wedge with holes (real dents) 
export function wedge() { return C('wedge', () => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(1, 0); s.lineTo(0, 0.62); s.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.55, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 3 }); g.translate(-0.35, 0, -0.275); g.rotateX(-Math.PI / 2); g.rotateX(Math.PI / 2);
  const p = g.attributes.position, v = new THREE.Vector3(); const holes = [[0.05, 0.2, 0.33, 0.12], [-0.15, 0.08, -0.33, 0.1], [0.25, 0.08, 0.33, 0.08], [-0.2, 0.35, 0.1, 0.09]];
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); for (const h of holes) { const d = Math.hypot(v.x - h[0], v.y - h[1], v.z - h[2]); if (d < h[3]) { const k = (h[3] - d) / h[3]; v.z -= Math.sign(h[2]) * k * h[3] * 0.8; } } p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g; }); }
export function gear(teeth = 8) { return C('gear' + teeth, () => { const s = new THREE.Shape(); const n = teeth * 4; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, r = (i % 4 < 2) ? 1 : 0.78; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const h = new THREE.Path(); h.absarc(0, 0, 0.32, 0, Math.PI * 2, true); s.holes.push(h);
  return new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, curveSegments: 16 }).translate(0, 0, -0.11); }); }
export function blobGeo(seed, amp = 0.2, detail = 2) { return C('b' + seed + ',' + amp + ',' + detail, () => { let g = new THREE.IcosahedronGeometry(1, detail); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g);
  const p = g.attributes.position, v = new THREE.Vector3(); let s = seed * 9301 + 49297; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280; const k = [rnd() * 6, rnd() * 6, rnd() * 6, 1.5 + rnd() * 2];
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = Math.sin(v.x * k[3] + k[0]) * Math.sin(v.y * k[3] + k[1]) * Math.sin(v.z * k[3] + k[2]); v.normalize().multiplyScalar(1 + n * amp); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g; }); }
