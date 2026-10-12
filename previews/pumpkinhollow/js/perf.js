// "Smart" rendering helpers: frustum tests for skipping offscreen animation, deep disposal, light pool.
// Nothing here lowers visual quality; it only skips work you can't see and frees memory you no longer use.
import * as THREE from 'three';
import { MATS } from './mats.js?v=ph6';
const fr = new THREE.Frustum(), pm = new THREE.Matrix4(), sp = new THREE.Sphere();
export function updateFrustum(cam) { cam.updateMatrixWorld(); pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); fr.setFromProjectionMatrix(pm); }
export function inView(x, y, z, r = 2) { sp.center.set(x, y, z); sp.radius = r; return fr.intersectsSphere(sp); }
// free GPU memory for a subtree (shared palette materials are kept)
export function disposeDeep(obj) { const shared = new Set(Object.values(MATS)); obj.traverse((o) => { if (o.geometry) o.geometry.dispose(); const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
  for (const m of ms) if (!shared.has(m)) { for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); } m.dispose(); } }); }
// fixed-size pool of point lights (constant count = no shader recompiles) that follows the nearest light spots
export class LightPool {
  constructor(scene, spots, n = 4) { this.spots = spots; this.t = 0; this.L = []; for (let i = 0; i < n; i++) { const p = new THREE.PointLight(0xffffff, 0, 30, 1.6); p.userData = { spot: null, want: null }; scene.add(p); this.L.push(p); } }
  update(dt, x, y, z) { const S = this.spots; if (!S.length) return; this.t -= dt;
    if (this.t <= 0) { this.t = 0.35; const near = S.map((s) => [s, (s.x - x) ** 2 + (s.y - y) ** 2 + (s.z - z) ** 2]).sort((a, b) => a[1] - b[1]).slice(0, this.L.length).map((a) => a[0]);
      const free = this.L.filter((p) => !near.includes(p.userData.spot)); const todo = near.filter((s) => !this.L.some((p) => p.userData.spot === s));
      todo.forEach((s, i) => { if (free[i]) free[i].userData.want = s; }); }
    for (const p of this.L) { const u = p.userData; const full = u.spot ? (u.spot.i || 30) : 0;
      if (u.want && u.want !== u.spot) { p.intensity = Math.max(0, p.intensity - dt * full * 4); if (p.intensity <= 0.01) { u.spot = u.want; u.want = null; p.position.set(u.spot.x, u.spot.y, u.spot.z); p.color.set(u.spot.c); p.distance = u.spot.d || 30; } }
      else if (u.spot) p.intensity = Math.min(full, p.intensity + dt * full * 3); } }
  dispose(scene) { this.L.forEach((p) => { scene.remove(p); p.dispose(); }); }
}
