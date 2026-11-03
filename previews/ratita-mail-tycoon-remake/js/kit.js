// Ratita Mail Tycoon Remake - static world kit: batched vertex-coloured geometry (few draw calls), AABB colliders, camera ray, signs.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { P } from './geo.js';
import { MATS } from './mats.js';
import { compact } from './compact.js';
export const PI = Math.PI;
export const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  prism: (() => { const g = new THREE.CylinderGeometry(0.5774, 0.5774, 1, 3, 1); g.rotateZ(PI / 2); g.rotateX(PI / 2); g.rotateZ(PI / 2); return g; })(),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 18, 1), cyl8: new THREE.CylinderGeometry(1, 1, 1, 8, 1),
  cone: new THREE.ConeGeometry(1, 1, 12, 1), sph: new THREE.SphereGeometry(1, 14, 10), ico: new THREE.IcosahedronGeometry(1, 1),
};
// prism: triangle cross-section in the X/Y plane (roof ridge along Z), base width 1, height 0.866
{ const g = new THREE.BufferGeometry(); const v = [-0.5, 0, -0.5, 0.5, 0, -0.5, 0, 1, -0.5, -0.5, 0, 0.5, 0.5, 0, 0.5, 0, 1, 0.5];
  const idx = [0, 2, 1, 3, 4, 5, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 4, 0, 1, 4, 0, 4, 3];
  const pos = []; for (const i of idx) pos.push(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); G.prism = g; }
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
export class Batch {
  constructor(chunk = 0) { this.chunk = chunk; this.parts = new Map(); this.verts = 0; }
  add(bucket, geom, color, x, y, z, rx, ry, rz, sx, sy, sz, em = 0) {
    let g = geom.index ? geom.toNonIndexed() : geom.clone(); for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    _e.set(rx || 0, ry || 0, rz || 0, 'YXZ'); _q.setFromEuler(_e); _m.compose(_v.set(x, y, z), _q, _s.set(sx, sy == null ? sx : sy, sz == null ? sx : sz)); g.applyMatrix4(_m);
    _c.set(color); const k = 1 + em, n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = _c.r * k; a[i * 3 + 1] = _c.g * k; a[i * 3 + 2] = _c.b * k; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    const key = (this.chunk ? Math.floor(x / this.chunk) + ',' + Math.floor(z / this.chunk) : '0') + '|' + bucket;
    let L = this.parts.get(key); if (!L) this.parts.set(key, L = []); L.push(g); this.verts += n; return this;
  }
  // y = bottom of the box
  box(b, col, x, y, z, w, h, d, ry = 0, em = 0) { return this.add(b, G.box, col, x, y + h / 2, z, 0, ry, 0, w, h, d, em); }
  rbox(b, col, x, y, z, w, h, d, ry = 0, em = 0) { return this.add(b, P.rboxS, col, x, y + h / 2, z, 0, ry, 0, w, h, d, em); }
  cyl(b, col, x, y, z, r, h, rx = 0, rz = 0, em = 0, lo) { return this.add(b, lo ? G.cyl8 : G.cyl, col, x, y + (rx || rz ? 0 : h / 2), z, rx, 0, rz, r, h, r, em); }
  sph(b, col, x, y, z, sx, sy, sz, em = 0) { return this.add(b, G.sph, col, x, y, z, 0, 0, 0, sx, sy == null ? sx : sy, sz == null ? sx : sz, em); }
  finish(parent, shadow = true) {
    const out = [];
    for (const [key, L] of this.parts) { const bucket = key.split('|')[1]; const g = mergeGeometries(L, false); L.forEach((p) => p.dispose());
      g.computeBoundingSphere(); compact(g, bucket); const m = new THREE.Mesh(g, MATS[bucket] || MATS.m);
      m.castShadow = shadow && bucket !== 'l' && bucket !== 'e' && bucket !== 'w'; m.receiveShadow = bucket !== 'l'; if (bucket === 'e') m.renderOrder = 2; m.matrixAutoUpdate = false; m.updateMatrix(); parent.add(m); out.push(m); }
    this.parts.clear(); return out;
  }
}
// ---------- colliders ----------
export const COL = { boxes: [] };
// axis-aligned solid; y0..y1 used for the camera ray. g: optional group whose visibility toggles the collider
export function solid(x0, z0, x1, z1, y0 = 0, y1 = 3, g = null, tag = null) { const b = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), y0, y1, g, tag }; COL.boxes.push(b); return b; }
export function solidC(x, z, w, d, y1 = 3, g = null, tag = null) { return solid(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 0, y1, g, tag); }
const on = (b) => !b.off && (!b.g || b.g.visible);
// push a circle out of all boxes; returns the hardest hit (penetration) and its box
export function collide(p, r, y = 0.5) { let hit = null, hd = 0;
  for (let k = 0; k < 2; k++) for (const b of COL.boxes) { if (!on(b) || y > b.y1 || y + 1 < b.y0) continue; if (p.x < b.x0 - r || p.x > b.x1 + r || p.z < b.z0 - r || p.z > b.z1 + r) continue;
    const cx = Math.max(b.x0, Math.min(p.x, b.x1)), cz = Math.max(b.z0, Math.min(p.z, b.z1)); let dx = p.x - cx, dz = p.z - cz; let d = Math.hypot(dx, dz);
    if (d >= r) continue; let pen;
    if (d < 1e-5) { const l = p.x - b.x0, rr = b.x1 - p.x, t = p.z - b.z0, bb = b.z1 - p.z, m = Math.min(l, rr, t, bb);
      if (m === l) { p.x = b.x0 - r; } else if (m === rr) { p.x = b.x1 + r; } else if (m === t) { p.z = b.z0 - r; } else { p.z = b.z1 + r; } pen = m + r; }
    else { pen = r - d; p.x += dx / d * pen; p.z += dz / d * pen; }
    if (pen > hd) { hd = pen; hit = b; } }
  return hit ? { b: hit, pen: hd } : null; }
// camera ray vs boxes (slab test)
export function ray(o, d, max) { let best = max;
  for (const b of COL.boxes) { if (!on(b) || b.nocam) continue; let t0 = 0, t1 = best; const mn = [b.x0, b.y0, b.z0], mx = [b.x1, b.y1, b.z1], oo = [o.x, o.y, o.z], dd = [d.x, d.y, d.z]; let ok = true;
    for (let i = 0; i < 3; i++) { if (Math.abs(dd[i]) < 1e-8) { if (oo[i] < mn[i] || oo[i] > mx[i]) { ok = false; break; } continue; } let a = (mn[i] - oo[i]) / dd[i], c = (mx[i] - oo[i]) / dd[i]; if (a > c) [a, c] = [c, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, c); if (t0 > t1) { ok = false; break; } }
    if (ok && t0 > 0.05 && t0 < best) best = t0; }
  return best; }
// ---------- signs (canvas text; plane always matches the canvas aspect, never stretched) ----------
const signCache = [];
export function sign(text, w, h, o = {}) {
  const px = Math.min(1024, Math.round(w * 96)), ph = Math.max(16, Math.round(px * h / w)); const c = document.createElement('canvas'); c.width = px; c.height = ph; const g = c.getContext('2d');
  const r = Math.min(ph * 0.22, 40); g.fillStyle = o.bg || '#1e3a8a'; g.beginPath(); g.roundRect ? g.roundRect(0, 0, px, ph, r) : g.rect(0, 0, px, ph); g.fill();
  if (o.border !== false) { g.strokeStyle = o.border || '#fde047'; g.lineWidth = Math.max(4, ph * 0.06); g.beginPath(); g.roundRect ? g.roundRect(g.lineWidth / 2, g.lineWidth / 2, px - g.lineWidth, ph - g.lineWidth, r) : g.rect(0, 0, px, ph); g.stroke(); }
  const lines = String(text).split('\n'); let fs = ph * (lines.length > 1 ? 0.36 : 0.56); g.font = `900 ${fs}px system-ui, -apple-system, Segoe UI, sans-serif`;
  const maxW = Math.max(...lines.map((l) => g.measureText(l).width)); if (maxW > px * 0.9) { fs *= px * 0.9 / maxW; g.font = `900 ${fs}px system-ui, -apple-system, Segoe UI, sans-serif`; }
  g.fillStyle = o.fg || '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; lines.forEach((l, i) => g.fillText(l, px / 2, ph / 2 + (i - (lines.length - 1) / 2) * fs * 1.12));
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: o.glow != null ? o.glow : 0.35 }));
  signCache.push(m); return m;
}
