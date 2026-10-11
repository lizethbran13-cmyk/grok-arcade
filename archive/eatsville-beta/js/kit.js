// Shared building kit: multi-material merged builders (one draw call per material per object).
import * as THREE from 'three';
import { Builder } from './geo.js';
import { MATS } from './mats.js';
export function MB() { return { f: new Builder(), g: new Builder(), m: new Builder(), x: new Builder(), l: new Builder(), e: new Builder(), w: new Builder(), s: new Builder(), n: new Builder() }; }
export function toGroup(b, shadow = true, recv = true) {
  const g = new THREE.Group();
  for (const k of Object.keys(b)) { if (!b[k].parts.length) continue; const m = new THREE.Mesh(b[k].build(), MATS[k]);
    m.castShadow = shadow && k !== 'l' && k !== 'e' && k !== 'w' && k !== 'n'; m.receiveShadow = recv && k !== 'l'; m.userData.mk = k; g.add(m); }
  return g;
}
// instanced copies of a merged multi-material model (decor: trees, lamps, benches...)
export function instanced(b, mats, shadow = true) {
  const g = new THREE.Group(); const n = mats.length; if (!n) return g;
  for (const k of Object.keys(b)) { if (!b[k].parts.length) continue; const geo = b[k].build(); const im = new THREE.InstancedMesh(geo, MATS[k], n);
    for (let i = 0; i < n; i++) im.setMatrixAt(i, mats[i]); im.castShadow = shadow && k !== 'l' && k !== 'e'; im.receiveShadow = k !== 'l'; im.userData.mk = k; g.add(im); }
  return g;
}
const _o = new THREE.Object3D(), _e = new THREE.Euler(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0);
export function mat4(x, y, z, ry = 0, s = 1, sy = s) { _o.position.set(x, y, z); _o.rotation.set(0, ry, 0); _o.scale.set(s, sy, s); _o.updateMatrix(); return _o.matrix.clone(); }
// add builder parts with an offset/rotation (y-axis) applied: lets prop functions draw in local space
export class XB {
  constructor(b, x = 0, y = 0, z = 0, ry = 0) { this.b = b; this.set(x, y, z, ry); }
  set(x, y, z, ry) { this.x = x; this.y = y; this.z = z; this.ry = ry; this.c = Math.cos(ry); this.s = Math.sin(ry); return this; }
  p(k, geom, col, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx, em = 0) {
    const wx = this.x + x * this.c + z * this.s, wz = this.z - x * this.s + z * this.c;
    if (!rx && !rz) { this.b[k].add(geom, col, wx, this.y + y, wz, 0, ry + this.ry, 0, sx, sy, sz, em); return this; }
    _e.set(rx, ry, rz); _q.setFromEuler(_e); _q2.setFromAxisAngle(_up, this.ry).multiply(_q); _e.setFromQuaternion(_q2);
    this.b[k].add(geom, col, wx, this.y + y, wz, _e.x, _e.y, _e.z, sx, sy, sz, em); return this;
  }
}
