// World: batched static geometry (chunked per material), colliders, zones and queries.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { MATS } from './mats.js';

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
const rbCache = new Map();
export function clearWorldCaches() { for (const g of prepCache.values()) g.dispose(); prepCache.clear(); for (const g of rbCache.values()) g.dispose(); rbCache.clear(); }
export function rbox(w, h, d, r, seg = 2) {
  r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001); if (r < 0.005) r = 0.005;
  const k = [w, h, d, r, seg].map((v) => +(+v).toFixed(3)).join(','); let g = rbCache.get(k);
  if (!g) { g = new RoundedBoxGeometry(w, h, d, seg, r); rbCache.set(k, g); } return g;
}
export function mtx(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) { _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e); return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.clone(), new THREE.Vector3(sx, sy, sz)); }

export class World {
  constructor(def) {
    this.def = def || {}; this.group = new THREE.Group(); this.chunks = new Map(); this.solids = []; this.dyn = []; this.zones = []; this.grid = new Map(); this.stamp = 0;
    this.ents = []; this.hooks = []; this.checkpoints = []; this.doors = []; this.plates = []; this.levers = []; this.movers = []; this.enemies = []; this.lights = []; this.anims = []; this.killY = -6; this.route = [];
    this.tris = 0; this.drawCalls = 0; this.fades = []; this._fg = null; this.region = 'shell'; this.detail = false; this.regionMeshes = {}; this.detailMeshes = [];
  }
  // props built between fadeBegin/fadeEnd become their own small meshes that hide while they block the camera's view of your rat
  fadeBegin() { this._fg = { id: this.fades.length, box: new THREE.Box3(), meshes: [] }; this.fades.push(this._fg); }
  fadeEnd() { this._fg = null; }
  // ---- visuals ----
  _part(bucket, geom, color, m, em = 0) {
    const g0 = prep(geom); const g = g0.clone(); g.applyMatrix4(m);
    const n = g.attributes.position.count, a = new Float32Array(n * 3); _c.set(color); const k = em ? 1 + em : 1;
    for (let i = 0; i < n; i++) { a[i * 3] = _c.r * k; a[i * 3 + 1] = _c.g * k; a[i * 3 + 2] = _c.b * k; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    const F = this._fg; if (F) { g.computeBoundingBox(); F.box.union(g.boundingBox); }
    const cx = Math.floor(m.elements[12] / CH), cz = Math.floor(m.elements[14] / CH), key = F ? 'F' + F.id + ':' + bucket : this.region + (this.detail ? '~d' : '') + ':' + bucket + ':' + cx + ':' + cz;
    let ch = this.chunks.get(key); if (!ch) { ch = { bucket, parts: [], fade: F ? F.id : -1, region: this.region, detail: this.detail }; this.chunks.set(key, ch); } ch.parts.push(g); return g;
  }
  add(bucket, geom, color, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx, em = 0) { return this._part(bucket, geom, color, mtx(x, y, z, rx, ry, rz, sx, sy, sz), em); }
  // vertex colour by function (gradients, stripes) after placement
  addFn(bucket, geom, fn, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) { const g = this.add(bucket, geom, 0xffffff, x, y, z, rx, ry, rz, sx, sy, sz); const p = g.attributes.position, c = g.attributes.color; for (let i = 0; i < p.count; i++) { fn(_c, p.getX(i), p.getY(i), p.getZ(i)); c.setXYZ(i, _c.r, _c.g, _c.b); } return g; }
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
  solid(x0, y0, z0, x1, y1, z1, o) {
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
  finalize(scene) {
    let tris = 0;
    for (const [k, ch] of this.chunks) {
      if (!ch.parts.length) continue; const g = mergeGeometries(ch.parts, false); ch.parts.forEach((p) => p.dispose()); ch.parts = null;
      g.computeBoundingSphere(); g.computeBoundingBox();
      const mesh = new THREE.Mesh(g, MATS[ch.bucket] || MATS.m); mesh.matrixAutoUpdate = false;
      mesh.castShadow = ch.bucket !== 'e' && ch.bucket !== 'l' && ch.bucket !== 'w'; mesh.receiveShadow = ch.bucket !== 'l';
      if (ch.bucket === 'e') mesh.renderOrder = 2; if (ch.fade >= 0) this.fades[ch.fade].meshes.push(mesh);
      mesh.userData.region = ch.region; (this.regionMeshes[ch.region] || (this.regionMeshes[ch.region] = [])).push(mesh); if (ch.detail) { mesh.userData.detail = true; this.detailMeshes.push(mesh); }
      this.group.add(mesh); tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3; this.drawCalls++;
    }
    this.chunks.clear(); this.tris = tris; scene.add(this.group); return this;
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
