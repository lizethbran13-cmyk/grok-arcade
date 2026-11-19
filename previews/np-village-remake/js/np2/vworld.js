// North Pole Village remake: lean static world. Parts are baked with vertex colours and merged per (region, material, chunk).
// Each region (the village, a far zone, one interior) builds, uploads and can be disposed on its own, so only what you can
// reach is ever in memory. Low-poly primitives on purpose (iPhone budget).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { compact } from '../compact.js?v=np11';
import { MATS } from '../mats.js?v=np11';

const CELL = 8, _e = new THREE.Euler(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
export function mtx(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) { _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e); return new THREE.Matrix4().compose(_v.set(x, y, z), _q, _s.set(sx, sy, sz)); }
// ---- shared low-poly primitives (unit sized, cached) ----
const GC = new Map(); const C = (k, f) => { let g = GC.get(k); if (!g) { g = f(); for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal') g.deleteAttribute(n); if (!g.index) { const n = g.attributes.position.count, a = new Uint32Array(n); for (let i = 0; i < n; i++) a[i] = i; g.setIndex(new THREE.BufferAttribute(a, 1)); } GC.set(k, g); } return g; };
export const G = {
  box: () => C('box', () => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)),            // bottom-centred
  boxc: () => C('boxc', () => new THREE.BoxGeometry(1, 1, 1)),                                 // centred
  cyl: (s = 10) => C('cyl' + s, () => new THREE.CylinderGeometry(1, 1, 1, s, 1).translate(0, 0.5, 0)),
  cone: (s = 10) => C('cone' + s, () => new THREE.ConeGeometry(1, 1, s, 1).translate(0, 0.5, 0)),
  sph: (s = 10) => C('sph' + s, () => new THREE.SphereGeometry(1, s, Math.max(5, s * 0.6 | 0))),
  hemi: (s = 12) => C('hemi' + s, () => new THREE.SphereGeometry(1, s, 6, 0, Math.PI * 2, 0, Math.PI / 2)),
  torus: (t = 0.2, s = 16, arc = Math.PI * 2) => C('tor' + t + s + arc, () => new THREE.TorusGeometry(1, t, 6, s, arc)),
  // gable roof prism: width W (x), height H, length 1 along z, base at y=0
  prism: () => C('prism', () => { const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0, 1); s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5); }),
  plane: () => C('plane', () => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)),
  disc: (s = 24) => C('disc' + s, () => new THREE.CircleGeometry(1, s).rotateX(-Math.PI / 2)),
  ring: (a = 0.8, s = 24) => C('ring' + a + s, () => new THREE.RingGeometry(a, 1, s).rotateX(-Math.PI / 2)),
  arch: (s = 10) => C('arch' + s, () => { const sh = new THREE.Shape(); sh.moveTo(-0.5, 0); sh.lineTo(-0.5, 0.5); sh.absarc(0, 0.5, 0.5, Math.PI, 0, true); sh.lineTo(0.5, 0); sh.closePath(); return new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false, curveSegments: s }).translate(0, 0, -0.5); }),
  ico: (d = 1) => C('ico' + d, () => new THREE.IcosahedronGeometry(1, d)),
  dodec: () => C('dodec', () => new THREE.DodecahedronGeometry(1, 0)),
};
export function clearGeoCache() { for (const g of GC.values()) g.dispose(); GC.clear(); }

export class VWorld {
  constructor() { this.group = new THREE.Group(); this.chunks = new Map(); this.solids = []; this.dyn = []; this.zones = []; this.grid = new Map(); this.stamp = 0;
    this.region = 'out'; this.regionMeshes = {}; this.regionSolids = {}; this.regionZones = {}; this.verts = 0; this.killY = -30; this.chs = 40; this.uploader = null; }
  // ---- visuals ----
  add(bucket, geom, color, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx, em = 0) { return this.addM(bucket, geom, color, mtx(x, y, z, rx, ry, rz, sx, sy, sz), em); }
  addM(bucket, geom, color, m, em = 0) {
    const g = geom.clone(); g.applyMatrix4(m); const n = g.attributes.position.count, a = new Float32Array(n * 3); _c.set(color); const k = em ? 1 + em : 1;
    for (let i = 0; i < n; i++) { a[i * 3] = _c.r * k; a[i * 3 + 1] = _c.g * k; a[i * 3 + 2] = _c.b * k; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    const cs = this.region === 'out' ? this.chs : 1e6, cx = Math.floor(m.elements[12] / cs), cz = Math.floor(m.elements[14] / cs), key = this.region + ':' + bucket + ':' + cx + ':' + cz;
    let ch = this.chunks.get(key); if (!ch) { ch = { bucket, region: this.region, parts: [], verts: 0 }; this.chunks.set(key, ch); }
    ch.parts.push(g); ch.verts += n; if (ch.verts > 60000) this._final(ch, key); return g; }
  // vertex colour by function of world position
  addFn(bucket, geom, fn, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) { const g = this.add(bucket, geom, 0xffffff, x, y, z, rx, ry, rz, sx, sy, sz); const p = g.attributes.position, c = g.attributes.color; for (let i = 0; i < p.count; i++) { fn(_c, p.getX(i), p.getY(i), p.getZ(i)); c.setXYZ(i, _c.r, _c.g, _c.b); } return g; }
  // bottom-centred box (+ optional collider)
  box(bucket, col, x, y, z, w, h, d, ry = 0, solid = false, em = 0) { this.add(bucket, G.box(), col, x, y, z, 0, ry, 0, w, h, d, em); if (solid) this.solidR(x, y, z, w, h, d, ry); }
  // local frame: position + yaw + scale; helpers take local coords
  tf(x, y, z, ry = 0, s = 1) { const w = this, base = mtx(x, y, z, 0, ry, 0, s, s, s), c = Math.cos(ry), sn = Math.sin(ry), m2 = new THREE.Matrix4();
    const P = (lx, ly, lz) => [x + (lx * c + lz * sn) * s, y + ly * s, z + (-lx * sn + lz * c) * s];
    return { P, ry, s,
      add(bucket, geom, col, lx = 0, ly = 0, lz = 0, rx = 0, rry = 0, rz = 0, sx = 1, sy = sx, sz = sx, em = 0) { m2.multiplyMatrices(base, mtx(lx, ly, lz, rx, rry, rz, sx, sy, sz)); return w.addM(bucket, geom, col, m2, em); },
      box(bucket, col, lx, ly, lz, bw, bh, bd, rry = 0, em = 0) { return this.add(bucket, G.box(), col, lx, ly, lz, 0, rry, 0, bw, bh, bd, em); },
      solid(lx, ly, lz, bw, bh, bd) { const p = P(lx, ly, lz); w.solidR(p[0], p[1], p[2], bw * s, bh * s, bd * s, ry); },
      slab(bucket, col, lx, ly, lz, bw, bh, bd, em = 0) { this.box(bucket, col, lx, ly, lz, bw, bh, bd, 0, em); this.solid(lx, ly, lz, bw, bh, bd); },
    };
  }
  // ---- colliders ----
  solid(x0, y0, z0, x1, y1, z1, o) { const s = Object.assign({ min: [x0, y0, z0], max: [x1, y1, z1], region: this.region }, o || {}); (this.regionSolids[this.region] || (this.regionSolids[this.region] = [])).push(s); this.solids.push(s); this.index(s); return s; }
  // rotated box -> axis aligned collider (yaw snapped to 90deg steps keeps it tight; other angles use the bounding box)
  solidR(x, y, z, w, h, d, ry = 0, o) { const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry)); const hw = (w * c + d * s) / 2, hd = (w * s + d * c) / 2; return this.solid(x - hw, y, z - hd, x + hw, y + h, z + hd, o); }
  index(s) { for (let gx = Math.floor(s.min[0] / CELL); gx <= Math.floor(s.max[0] / CELL); gx++) for (let gz = Math.floor(s.min[2] / CELL); gz <= Math.floor(s.max[2] / CELL); gz++) { const k = gx * 65536 + gz; let a = this.grid.get(k); if (!a) this.grid.set(k, a = []); a.push(s); } }
  unindex(s) { for (let gx = Math.floor(s.min[0] / CELL); gx <= Math.floor(s.max[0] / CELL); gx++) for (let gz = Math.floor(s.min[2] / CELL); gz <= Math.floor(s.max[2] / CELL); gz++) { const a = this.grid.get(gx * 65536 + gz); if (a) { const i = a.indexOf(s); if (i >= 0) a.splice(i, 1); } } }
  near(x0, z0, x1, z1, out) { out.length = 0; const st = ++this.stamp;
    for (let gx = Math.floor(x0 / CELL); gx <= Math.floor(x1 / CELL); gx++) for (let gz = Math.floor(z0 / CELL); gz <= Math.floor(z1 / CELL); gz++) { const a = this.grid.get(gx * 65536 + gz); if (a) for (const s of a) if (s._st !== st) { s._st = st; out.push(s); } }
    for (const s of this.dyn) if (!s.off) out.push(s); return out; }
  zone(type, x0, y0, z0, x1, y1, z1, o) { const z = Object.assign({ type, min: [x0, y0, z0], max: [x1, y1, z1], region: this.region }, o || {}); this.zones.push(z); return z; }
  zonesAt(x, y, z) { const r = []; for (const q of this.zones) if (!q.off && x >= q.min[0] && x <= q.max[0] && y >= q.min[1] && y <= q.max[1] && z >= q.min[2] && z <= q.max[2]) r.push(q); return r; }
  ground(x, z, yMax, r = 0.2) { const c = this.near(x - r, z - r, x + r, z + r, this._tmp || (this._tmp = [])); let best = -1e9, bs = null;
    for (const s of c) { if (s.nofloor) continue; if (x < s.min[0] - r || x > s.max[0] + r || z < s.min[2] - r || z > s.max[2] + r) continue; const t = topOf(s, x, z); if (t <= yMax && t > best) { best = t; bs = s; } } return { y: best, s: bs }; }
  ray(o, d, maxD, filter) { const c = this.near(Math.min(o.x, o.x + d.x * maxD) - 0.5, Math.min(o.z, o.z + d.z * maxD) - 0.5, Math.max(o.x, o.x + d.x * maxD) + 0.5, Math.max(o.z, o.z + d.z * maxD) + 0.5, this._tmp2 || (this._tmp2 = []));
    let best = maxD; const od = [o.x, o.y, o.z], dd = [d.x, d.y, d.z];
    for (const s of c) { if (s.nocam || (filter && !filter(s))) continue; let t0 = 0, t1 = best, ok = true;
      for (let i = 0; i < 3; i++) { if (Math.abs(dd[i]) < 1e-8) { if (od[i] < s.min[i] || od[i] > s.max[i]) { ok = false; break; } continue; } let a = (s.min[i] - od[i]) / dd[i], b = (s.max[i] - od[i]) / dd[i]; if (a > b) { const t = a; a = b; b = t; } if (a > t0) t0 = a; if (b < t1) t1 = b; if (t0 > t1) { ok = false; break; } }
      if (ok && t0 < best && t0 > 0) best = t0; } return best; }
  // ---- merge -> GPU ----
  _final(ch, key) { if (!ch.parts.length) return; const g = mergeGeometries(ch.parts, false); ch.parts.forEach((p) => p.dispose()); ch.parts = []; this.verts += ch.verts; ch.verts = 0;
    compact(g, ch.bucket, true); const mesh = new THREE.Mesh(g, MATS[ch.bucket] || MATS.m);
    if (g.userData.q) { const q = g.userData.q; mesh.position.set(q[0], q[1], q[2]); mesh.scale.setScalar(q[3]); g.computeBoundingSphere(); g.computeBoundingBox(); }
    mesh.matrixAutoUpdate = false; mesh.updateMatrix();
    mesh.castShadow = this.shadows !== false && ch.bucket !== 'e' && ch.bucket !== 'l' && ch.bucket !== 'w' && ch.bucket !== 'n'; mesh.receiveShadow = ch.bucket !== 'l';
    if (ch.bucket === 'e') mesh.renderOrder = 2; mesh.userData.region = ch.region; (this.regionMeshes[ch.region] || (this.regionMeshes[ch.region] = [])).push(mesh); this.group.add(mesh);
    if (this.uploader) this.uploader(mesh); }
  finalize(region) { for (const [k, ch] of this.chunks) if (!region || ch.region === region) { this._final(ch, k); this.chunks.delete(k); } if (!this.group.parent && this.scene) this.scene.add(this.group); }
  // one-off objects (signs with canvas textures, animated props) that belong to a region
  addObj(o) { (this.regionObjs || (this.regionObjs = {}))[this.region] = (this.regionObjs[this.region] || []); this.regionObjs[this.region].push(o); this.group.add(o); return o; }
  setRegionVisible(region, on) { for (const m of this.regionMeshes[region] || []) m.visible = on; for (const o of (this.regionObjs || {})[region] || []) o.visible = on; }
  disposeRegion(region) { for (const m of this.regionMeshes[region] || []) { this.group.remove(m); m.geometry.dispose(); } delete this.regionMeshes[region];
    for (const o of (this.regionObjs || {})[region] || []) { this.group.remove(o); o.traverse((q) => { if (q.geometry && !q.geometry.userData.shared) q.geometry.dispose(); if (q.material && q.material.userData.own) { if (q.material.map) q.material.map.dispose(); q.material.dispose(); } }); } if (this.regionObjs) delete this.regionObjs[region];
    for (const s of this.regionSolids[region] || []) { this.unindex(s); const i = this.solids.indexOf(s); if (i >= 0) this.solids.splice(i, 1); } delete this.regionSolids[region];
    this.zones = this.zones.filter((z) => z.region !== region); for (const [k, ch] of this.chunks) if (ch.region === region) { ch.parts.forEach((p) => p.dispose()); this.chunks.delete(k); } }
}
export function topOf(s, x, z) { if (!s.ramp) return s.max[1]; const [ax, dir] = s.ramp; const i = ax === 'x' ? 0 : 2, p = ax === 'x' ? x : z; let t = (p - s.min[i]) / (s.max[i] - s.min[i]); t = Math.max(0, Math.min(1, t)); if (dir < 0) t = 1 - t; return s.min[1] + (s.max[1] - s.min[1]) * t; }
