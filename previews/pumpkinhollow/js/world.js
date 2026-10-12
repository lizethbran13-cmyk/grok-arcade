// World: batched static geometry (chunked per material), colliders, zones and queries.
import * as THREE from 'three';
import { compact, spillCompact } from './compact.js?v=ph3';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { MATS } from './mats.js?v=ph3';
import { remap as THR } from './theme.js?v=ph3';

const CH = 22, CELL = 8;
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _n = new THREE.Matrix3();
const prepCache = new Map();
function prep(geom) {
  let p = prepCache.get(geom); if (p) return p;
  let g = geom.clone();
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  if (!g.index) { const n = g.attributes.position.count; const a = new Uint32Array(n); for (let i = 0; i < n; i++) a[i] = i; g.setIndex(new THREE.BufferAttribute(a, 1)); }
  prepCache.set(geom, g); return g;
}
// size-aware tessellation at build time: a 3 cm bead doesn't need a 600-triangle sphere. Only ever lowers segments on SMALL parts (same look on screen).
const lodCache = new Map();
function lodGeo(geom, m) { const P0 = geom.parameters; if (!P0) return geom; const T = geom.type; if (!['SphereGeometry', 'CylinderGeometry', 'ConeGeometry', 'TorusGeometry', 'CapsuleGeometry', 'LatheGeometry'].includes(T)) return geom;
  const e = m.elements, sc = Math.max(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6]), Math.hypot(e[8], e[9], e[10])); if (!geom.boundingSphere) geom.computeBoundingSphere(); const R = sc * geom.boundingSphere.radius;
  const cap = R < 0.06 ? 8 : R < 0.15 ? 12 : R < 0.35 ? 16 : R < 0.7 ? 22 : 999; let key, mk;
  if (T === 'SphereGeometry') { if (P0.widthSegments <= cap) return geom; const ws = cap, hs = Math.max(6, Math.round(P0.heightSegments * cap / P0.widthSegments)); mk = () => new THREE.SphereGeometry(P0.radius, ws, hs, P0.phiStart, P0.phiLength, P0.thetaStart, P0.thetaLength); }
  else if (T === 'CylinderGeometry' || T === 'ConeGeometry') { if (P0.radialSegments <= cap) return geom; mk = () => { const g = T === 'ConeGeometry' ? new THREE.ConeGeometry(P0.radius, P0.height, cap, P0.heightSegments, P0.openEnded, P0.thetaStart, P0.thetaLength) : new THREE.CylinderGeometry(P0.radiusTop, P0.radiusBottom, P0.height, cap, P0.heightSegments, P0.openEnded, P0.thetaStart, P0.thetaLength); geom.boundingBox || geom.computeBoundingBox(); g.computeBoundingBox(); g.translate(0, geom.boundingBox.min.y - g.boundingBox.min.y, 0); return g; }; }
  else if (T === 'TorusGeometry') { if (P0.tubularSegments <= cap) return geom; mk = () => new THREE.TorusGeometry(P0.radius, P0.tube, Math.min(P0.radialSegments, Math.max(6, cap / 2 | 0)), cap, P0.arc); }
  else if (T === 'CapsuleGeometry') { const rs = P0.radialSegments; if (rs <= cap) return geom; mk = () => new THREE.CapsuleGeometry(P0.radius, P0.length ?? P0.height, Math.max(3, Math.min(P0.capSegments, cap / 3 | 0)), cap); }
  else if (T === 'LatheGeometry') { if (P0.segments <= cap) return geom; mk = () => new THREE.LatheGeometry(P0.points, cap, P0.phiStart, P0.phiLength); }
  key = geom.uuid + ':' + cap; let g = lodCache.get(key);
  if (g === undefined) { g = mk(); geom.boundingBox || geom.computeBoundingBox(); g.computeBoundingBox(); const a = geom.boundingBox, b = g.boundingBox, tol = 0.08 * geom.boundingSphere.radius + 1e-4;
    // any geometry that was rotated/translated after creation keeps its original mesh (we only swap pristine primitives)
    if (Math.abs(a.min.x - b.min.x) > tol || Math.abs(a.max.x - b.max.x) > tol || Math.abs(a.min.y - b.min.y) > tol || Math.abs(a.max.y - b.max.y) > tol || Math.abs(a.min.z - b.min.z) > tol || Math.abs(a.max.z - b.max.z) > tol) { g.dispose(); g = null; }
    lodCache.set(key, g); }
  return g || geom; }
const rbCache = new Map();
export function clearWorldCaches() { for (const g of prepCache.values()) g.dispose(); prepCache.clear(); for (const g of rbCache.values()) g.dispose(); rbCache.clear(); }
export function rbox(w, h, d, r, seg = 2) {
  r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001); if (r < 0.005) r = 0.005; if (seg > 1 && (r < 0.035 || Math.max(w, h, d) < 0.45)) seg = 1; // tiny bevels: one bevel step looks identical, ~2x fewer vertices
  const k = [w, h, d, r, seg].map((v) => +(+v).toFixed(3)).join(','); let g = rbCache.get(k);
  if (!g) { g = new RoundedBoxGeometry(w, h, d, seg, r); rbCache.set(k, g); } return g;
}
export function mtx(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) { _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e); return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.clone(), new THREE.Vector3(sx, sy, sz)); }

export class World {
  constructor(def) {
    this.def = def || {}; this.group = new THREE.Group(); this.chunks = new Map(); this.solids = []; this.dyn = []; this.zones = []; this.grid = new Map(); this.stamp = 0;
    this.ents = []; this.hooks = []; this.checkpoints = []; this.doors = []; this.plates = []; this.levers = []; this.movers = []; this.enemies = []; this.lights = []; this.anims = []; this.killY = -6; this.route = [];
    this.tris = 0; this.drawCalls = 0; this.fades = []; this._fg = null; this._region = 'shell'; this.detail = false; this.regionMeshes = {}; this.detailMeshes = [];
    this.oy = 0; // vertical build offset: upper storeys reuse every floor-level prop helper unchanged
  }
  // interiors are built in one go: when the builder leaves an interior region, its batches are final -> merge, upload, free right away
  get region() { return this._region; }
  set region(v) { const p = this._region; if (false) { for (const [k, ch] of this.chunks) if (ch.region === p && ch.fade < 0) { this._final(ch); this.chunks.delete(k); } } this._region = v; }
  // props built between fadeBegin/fadeEnd become their own small meshes that hide while they block the camera's view of your rat
  fadeBegin() { this._fg = { id: this.fades.length, box: new THREE.Box3(), meshes: [] }; this.fades.push(this._fg); }
  fadeEnd() { this._fg = null; }
  // ---- visuals ----
  _part(bucket, geom, color, m, em = 0) {
    if (this._pendingFlush) { const c0 = this._pendingFlush; this._pendingFlush = null; this._flush(c0); }
    const g0 = prep(lodGeo(geom, m)); const g = g0.clone(); g.applyMatrix4(m); if (this.oy) g.translate(0, this.oy, 0);
    const n = g.attributes.position.count, a = new Float32Array(n * 3); _c.set(THR(color, this.region)); const k = em ? 1 + em : 1;
    for (let i = 0; i < n; i++) { a[i * 3] = _c.r * k; a[i * 3 + 1] = _c.g * k; a[i * 3 + 2] = _c.b * k; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    const F = this._fg; if (F) { g.computeBoundingBox(); F.box.union(g.boundingBox); }
    const chs = this.detail ? 18 : (this.region === 'out' || this.region === 'shell') ? 36 : 400, cx = Math.floor(m.elements[12] / chs), cz = Math.floor(m.elements[14] / chs), key = F ? 'F' + F.id + ':' + bucket : this.region + (this.detail ? '~d' : '') + ':' + bucket + ':' + cx + ':' + cz;
    let ch = this.chunks.get(key); if (!ch) { ch = { bucket, parts: [], verts: 0, fade: F ? F.id : -1, region: this.region, detail: this.detail }; this.chunks.set(key, ch); } ch.parts.push(g); ch.verts += n; this._pv = (this._pv || 0) + n;
    if (!this._pendingFlush && this._pv > 600000) { let big = null; for (const c of this.chunks.values()) if (c !== ch && (!big || c.verts > big.verts)) big = c; if (big && big.verts > 8000) this._pendingFlush = big; } return g;
  }
  add(bucket, geom, color, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx, em = 0) { return this._part(bucket, geom, color, mtx(x, y, z, rx, ry, rz, sx, sy, sz), em); }
  // vertex colour by function (gradients, stripes) after placement
  addFn(bucket, geom, fn, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) { const g = this.add(bucket, geom, 0xffffff, x, y, z, rx, ry, rz, sx, sy, sz); const p = g.attributes.position, c = g.attributes.color; for (let i = 0; i < p.count; i++) { fn(_c, p.getX(i), p.getY(i), p.getZ(i)); _c.setHex(THR(_c.getHex(), this.region)); c.setXYZ(i, _c.r, _c.g, _c.b); } return g; }
  // local frame for a prop: position + yaw + uniform scale
  tf(x, y, z, ry = 0, s = 1) { const w = this, base = mtx(x, y, z, 0, ry, 0, s, s, s), c = Math.cos(ry), sn = Math.sin(ry);
    const P = (lx, ly, lz) => [x + (lx * c + lz * sn) * s, y + ly * s, z + (-lx * sn + lz * c) * s];
    return { s, ry, P,
      add(bucket, geom, col, lx = 0, ly = 0, lz = 0, rx = 0, rry = 0, rz = 0, sx = 1, sy = sx, sz = sx, em = 0) { _m2.multiplyMatrices(base, mtx(lx, ly, lz, rx, rry, rz, sx, sy, sz)); return w._part(bucket, geom, col, _m2.clone(), em); },
      box(bucket, col, lx, ly, lz, bw, bh, bd, r = 0.08, em = 0, seg = 2) { if (r * s < 0.03) seg = 1; return this.add(bucket, rbox(bw, bh, bd, r, seg), col, lx, ly + bh / 2, lz, 0, 0, 0, 1, 1, 1, em); },
      solid(lx0, ly0, lz0, lx1, ly1, lz1, o) { const a = P(lx0, ly0, lz0), b = P(lx1, ly1, lz1), d = P(lx0, ly0, lz1), e = P(lx1, ly0, lz0);
        return w.solid(Math.min(a[0], b[0], d[0], e[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2], d[2], e[2]), Math.max(a[0], b[0], d[0], e[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2], d[2], e[2]), o); },
      // solid box + matching rounded visual (local, bottom-centred)
      slab(bucket, col, lx, ly, lz, bw, bh, bd, r = 0.08, o, em) { this.box(bucket, col, lx, ly, lz, bw, bh, bd, r, em); return this.solid(lx - bw / 2, ly, lz - bd / 2, lx + bw / 2, ly + bh, lz + bd / 2, o); },
    };
  }
  // world-space rounded slab with collider; x,z centre, y bottom
  slab(bucket, col, x, y, z, w, h, d, r = 0.1, o, em = 0, seg = 2) { if (r < 0.03) seg = 1; this.add(bucket, rbox(w, h, d, r, seg), col, x, y + h / 2, z, 0, 0, 0, 1, 1, 1, em); return o === false ? null : this.solid(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, o); }
  // ---- colliders ----
  solid(x0, y0, z0, x1, y1, z1, o) { if (this.oy) { y0 += this.oy; y1 += this.oy; }
    const s = Object.assign({ min: [x0, y0, z0], max: [x1, y1, z1] }, o || {});
    if (s.dyn) { s.dx = s.dy = s.dz = 0; this.dyn.push(s); } else { this.solids.push(s); this.index(s); }
    return s;
  }
  index(s) { for (let gx = Math.floor(s.min[0] / CELL); gx <= Math.floor(s.max[0] / CELL); gx++) for (let gz = Math.floor(s.min[2] / CELL); gz <= Math.floor(s.max[2] / CELL); gz++) { const k = gx * 4096 + gz; let a = this.grid.get(k); if (!a) this.grid.set(k, a = []); a.push(s); } }
  // candidates overlapping an xz rect (statics via grid + all dynamics)
  near(x0, z0, x1, z1, out) {
    out.length = 0; const st = ++this.stamp;
    for (let gx = Math.floor(x0 / CELL); gx <= Math.floor(x1 / CELL); gx++) for (let gz = Math.floor(z0 / CELL); gz <= Math.floor(z1 / CELL); gz++) { const a = this.grid.get(gx * 4096 + gz); if (a) for (const s of a) if (s._st !== st) { s._st = st; out.push(s); } }
    for (const s of this.dyn) if (!s.off) out.push(s);
    return out;
  }
  zone(type, x0, y0, z0, x1, y1, z1, o) { const z = Object.assign({ type, min: [x0, y0, z0], max: [x1, y1, z1] }, o || {}); this.zones.push(z); return z; }
  zonesAt(x, y, z) { const r = []; for (const q of this.zones) if (!q.off && x >= q.min[0] && x <= q.max[0] && y >= q.min[1] && y <= q.max[1] && z >= q.min[2] && z <= q.max[2]) r.push(q); return r; }
  // highest walkable top under (x,z) at or below yMax
  ground(x, z, yMax, r = 0.2) {
    const c = this.near(x - r, z - r, x + r, z + r, this._tmp || (this._tmp = [])); let best = -1e9, bs = null;
    for (const s of c) { if (s.nofloor) continue; if (x < s.min[0] - r || x > s.max[0] + r || z < s.min[2] - r || z > s.max[2] + r) continue; const t = topOf(s, x, z); if (t <= yMax && t > best) { best = t; bs = s; } }
    return { y: best, s: bs };
  }
  // ray vs boxes (camera / aiming). returns distance or Infinity
  ray(o, d, maxD, filter) {
    const c = this.near(Math.min(o.x, o.x + d.x * maxD) - 0.5, Math.min(o.z, o.z + d.z * maxD) - 0.5, Math.max(o.x, o.x + d.x * maxD) + 0.5, Math.max(o.z, o.z + d.z * maxD) + 0.5, this._tmp2 || (this._tmp2 = []));
    let best = maxD; const od = [o.x, o.y, o.z], dd = [d.x, d.y, d.z];
    for (const s of c) { if (filter && !filter(s)) continue; let t0 = 0, t1 = best, okk = true;
      for (let i = 0; i < 3; i++) { if (Math.abs(dd[i]) < 1e-8) { if (od[i] < s.min[i] || od[i] > s.max[i]) { okk = false; break; } continue; }
        let a = (s.min[i] - od[i]) / dd[i], b = (s.max[i] - od[i]) / dd[i]; if (a > b) { const t = a; a = b; b = t; } if (a > t0) t0 = a; if (b < t1) t1 = b; if (t0 > t1) { okk = false; break; } }
      if (okk && t0 < best && t0 > 0) best = t0; }
    return best;
  }
  // ---- finalize: merge chunk parts into meshes ----
  // memory-light build: under pressure a chunk's raw parts are merged into a compact CPU 'spill' (half the bytes); at the end each chunk becomes
  // ONE mesh (no extra draw calls), goes to the GPU and its CPU copy is freed right away.
  _flush(ch) { if (!ch.parts.length) return; const g = spillCompact(mergeGeometries(ch.parts, false), ch.bucket); ch.parts.forEach((p) => p.dispose()); ch.parts = []; this._pv -= ch.verts; ch.verts = 0; (ch.spills || (ch.spills = [])).push(g);
    if (ch.spills.length > 1) { const m = mergeGeometries(ch.spills, false); ch.spills.forEach((q) => q.dispose()); m.userData.spill = true; ch.spills = [m]; } }
  _final(ch) { let g; if (ch.parts.length) { const raw = mergeGeometries(ch.parts, false); ch.parts.forEach((p) => p.dispose()); ch.parts = []; this._pv -= ch.verts; ch.verts = 0; g = raw; if (ch.spills && ch.spills.length) { const sp = spillCompact(raw, ch.bucket); g = mergeGeometries([...ch.spills, sp], false); ch.spills.forEach((q) => q.dispose()); sp.dispose(); } } else if (ch.spills && ch.spills.length) g = ch.spills[0]; else return; ch.spills = null;
    g.computeBoundingSphere(); g.computeBoundingBox(); compact(g, ch.bucket, !!this.uploader);
    const mesh = new THREE.Mesh(g, MATS[ch.bucket] || MATS.m); mesh.matrixAutoUpdate = false;
    mesh.castShadow = ch.bucket !== 'e' && ch.bucket !== 'l' && ch.bucket !== 'w'; mesh.receiveShadow = ch.bucket !== 'l';
    if (ch.bucket === 'e') mesh.renderOrder = 2; if (ch.fade >= 0) this.fades[ch.fade].meshes.push(mesh);
    mesh.userData.region = ch.region; (this.regionMeshes[ch.region] || (this.regionMeshes[ch.region] = [])).push(mesh); if (ch.detail) { mesh.userData.detail = true; this.detailMeshes.push(mesh); }
    this.group.add(mesh); this._tris = (this._tris || 0) + g.index.count / 3; this.drawCalls++;
    if (this.uploader) this.uploader(mesh); }
  finalize(scene) {
    if (this._pendingFlush) { this._flush(this._pendingFlush); this._pendingFlush = null; }
    for (const [, ch] of this.chunks) this._final(ch);
    this.chunks.clear(); this.tris = this._tris || 0; scene.add(this.group); for (const g of prepCache.values()) g.dispose(); prepCache.clear(); for (const g of lodCache.values()) if (g) g.dispose(); lodCache.clear(); return this;
  }
  dispose(scene) { scene.remove(this.group); this.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
}
export function topOf(s, x, z) {
  if (!s.ramp) return s.max[1];
  const [ax, dir] = s.ramp; // e.g. ['x', 1]: rises toward +x
  const i = ax === 'x' ? 0 : 2, p = ax === 'x' ? x : z;
  let t = (p - s.min[i]) / (s.max[i] - s.min[i]); t = Math.max(0, Math.min(1, t)); if (dir < 0) t = 1 - t;
  return s.min[1] + (s.max[1] - s.min[1]) * t;
}
