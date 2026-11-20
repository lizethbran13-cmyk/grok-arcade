// Particles: one instanced mesh of soft little 3D blobs + pooled shock rings.
import * as THREE from 'three';
const N = 600;
export class FX {
  constructor(scene) {
    this.scene = scene; const g = new THREE.IcosahedronGeometry(1, 2);
    this.mesh = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ roughness: 0.5, emissive: 0xffffff, emissiveIntensity: 0.25 }), N); this.mesh.frustumCulled = false; this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.setColorAt(0, new THREE.Color()); scene.add(this.mesh);
    this.p = []; for (let i = 0; i < N; i++) this.p.push({ life: 0 }); this.i = 0; this._m = new THREE.Matrix4(); this._c = new THREE.Color(); this.dummy = new THREE.Object3D();
    for (let i = 0; i < N; i++) { this._m.makeScale(0, 0, 0); this.mesh.setMatrixAt(i, this._m); }
    this.rings = []; const rg = new THREE.TorusGeometry(1, 0.06, 8, 40); rg.rotateX(Math.PI / 2);
    for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false, toneMapped: false })); m.visible = false; scene.add(m); this.rings.push({ m, t: 0, d: 0 }); }
  }
  emit(x, y, z, vx, vy, vz, size, col, life, grav = 9, drag = 1.5) { const idx = this.i, p = this.p[idx]; this.i = (idx + 1) % N; Object.assign(p, { x, y, z, vx, vy, vz, s: size, life, max: life, grav, drag }); this._c.set(col); this.mesh.setColorAt(idx, this._c); if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true; }
  puff(x, y, z, n = 6, col = 0xf5f0e6) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28; this.emit(x, y + 0.1, z, Math.cos(a) * 2, 0.6 + Math.random(), Math.sin(a) * 2, 0.12 + Math.random() * 0.08, col, 0.45, -1, 4); } }
  burst(x, y, z, col = 0xffd23f, n = 14, sp = 5) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, b = Math.random() * 2 - 0.3; this.emit(x, y, z, Math.cos(a) * sp * Math.random(), sp * 0.6 + b * 2, Math.sin(a) * sp * Math.random(), 0.08 + Math.random() * 0.1, col, 0.7 + Math.random() * 0.4); } }
  confetti(x, y, z, n = 60) { const C = [0xff4fd8, 0x3ff0ff, 0xffe14d, 0x4ade80, 0xff7a3d, 0xa78bfa]; for (let i = 0; i < n; i++) { const a = Math.random() * 6.28; this.emit(x, y, z, Math.cos(a) * 6 * Math.random(), 6 + Math.random() * 8, Math.sin(a) * 6 * Math.random(), 0.12 + Math.random() * 0.1, C[i % C.length], 2 + Math.random(), 6, 1); } }
  sparkle(x, y, z, col = 0xfff3a0) { this.emit(x + (Math.random() - 0.5) * 0.8, y + Math.random() * 0.6, z + (Math.random() - 0.5) * 0.8, 0, 1.2, 0, 0.06, col, 0.6, 0, 0); }
  splash(x, y, z) { for (let i = 0; i < 20; i++) { const a = Math.random() * 6.28; this.emit(x, y, z, Math.cos(a) * 3, 5 + Math.random() * 4, Math.sin(a) * 3, 0.1 + Math.random() * 0.1, 0x8fd8ff, 0.9); } this.ring(x, y + 0.1, z, 0x8fd8ff, 3); }
  jet(x, y, z) { for (let i = 0; i < 12; i++) this.emit(x, y + 0.2, z, (Math.random() - 0.5) * 2, -5 - Math.random() * 3, (Math.random() - 0.5) * 2, 0.1, i % 2 ? 0xffa53d : 0xffe14d, 0.4, 0); }
  ring(x, y, z, col = 0xffffff, size = 1.2, dur = 0.35) { const r = this.rings.find((q) => !q.m.visible) || this.rings[0]; r.m.visible = true; r.m.position.set(x, y + 0.05, z); r.m.material.color.set(col); r.t = 0; r.d = dur; r.size = size; }
  update(dt) {
    const m = this.mesh, d = this.dummy; let any = false;
    for (let i = 0; i < N; i++) { const p = this.p[i]; if (p.life <= 0) { if (p.was) { p.was = false; this._m.makeScale(0, 0, 0); m.setMatrixAt(i, this._m); any = true; } continue; }
      p.was = true; p.life -= dt; p.vy -= p.grav * dt; const k = Math.exp(-p.drag * dt); p.vx *= k; p.vz *= k; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      const s = p.s * Math.min(1, p.life / p.max * 2.5); d.position.set(p.x, p.y, p.z); d.scale.setScalar(Math.max(0.0001, s)); d.updateMatrix(); m.setMatrixAt(i, d.matrix); any = true; }
    if (any) m.instanceMatrix.needsUpdate = true;
    for (const r of this.rings) if (r.m.visible) { r.t += dt; const k = r.t / r.d; if (k >= 1) { r.m.visible = false; continue; } r.m.scale.setScalar(0.3 + k * r.size); r.m.material.opacity = 0.75 * (1 - k); }
  }
}
