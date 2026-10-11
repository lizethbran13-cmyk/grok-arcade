// Particles (one instanced mesh, real 3D blobs) + floating HUD numbers.
import * as THREE from 'three';
import { P } from './geo.js';
const N = 400; const _o = new THREE.Object3D(), _c = new THREE.Color();
export const FX = { mesh: null, list: [], floats: [] };
export function initFx(scene) {
  const m = new THREE.InstancedMesh(P.sphereLo, new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0, emissive: 0x000000 }), N); m.count = 0; m.frustumCulled = false; m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3); scene.add(m); FX.mesh = m;
}
const K = {
  steam: { c: 0xffffff, n: 1, v: [0.3, 1.2, 0.3], g: -0.2, life: 1.4, s: 0.12, grow: 1.5 }, smoke: { c: 0x555555, n: 3, v: [0.4, 1.4, 0.4], g: -0.3, life: 1.8, s: 0.18, grow: 1.6 },
  cash: { c: 0xffd23f, n: 8, v: [1.6, 3.2, 1.6], g: 7, life: 1.0, s: 0.07 }, heart: { c: 0xff4f8b, n: 5, v: [0.6, 1.6, 0.6], g: -0.5, life: 1.2, s: 0.08 },
  snow: { c: 0xffffff, n: 2, v: [2.5, 0.2, 2.5], g: 1.2, life: 2.0, s: 0.06, up: 2.2 }, fries: { c: 0xffc94a, n: 2, v: [1.5, 5, 1.5], g: 9, life: 1.2, s: 0.06 },
  soda: { c: 0xff7ab8, n: 4, v: [0.4, 6, 0.4], g: 9, life: 1.1, s: 0.09 }, notes: { c: 0x1f1f2a, n: 1, v: [0.8, 1.2, 0.8], g: -0.3, life: 1.6, s: 0.08 },
  bubble: { c: 0xbfeaff, n: 1, v: [0.6, 1.2, 0.6], g: -0.4, life: 2.2, s: 0.15, grow: 1.8 }, chop: { c: 0x86efac, n: 2, v: [2, 2.5, 2], g: 8, life: 0.7, s: 0.05 },
  sparkle: { c: 0xfff3a0, n: 10, v: [2, 2.5, 2], g: 3, life: 0.8, s: 0.05 }, confetti: { c: 0xff4fa0, n: 30, v: [3, 5, 3], g: 6, life: 1.8, s: 0.07, rainbow: 1 },
  angry: { c: 0xef4444, n: 6, v: [1, 2, 1], g: 2, life: 0.8, s: 0.06 }, clean: { c: 0x93e3ff, n: 10, v: [1.5, 2.2, 1.5], g: 4, life: 0.7, s: 0.06 }, disco: { c: 0xa78bfa, n: 2, v: [2, 1.5, 2], g: 0, life: 0.8, s: 0.07, rainbow: 1 },
};
const RB = [0xff4fa0, 0xffd23f, 0x3ff0ff, 0x4ade80, 0xa78bfa, 0xff7a3d];
export function burst(kind, x, y, z, n) { const k = K[kind]; if (!k) return; const c = n || k.n;
  for (let i = 0; i < c; i++) { if (FX.list.length >= N) FX.list.shift(); FX.list.push({ x: x + (Math.random() - 0.5) * 0.3, y: y + (k.up ? k.up : 0), z: z + (Math.random() - 0.5) * 0.3, vx: (Math.random() - 0.5) * k.v[0], vy: k.v[1] * (0.5 + Math.random() * 0.5), vz: (Math.random() - 0.5) * k.v[2], g: k.g, life: k.life, t: 0, s: k.s * (0.7 + Math.random() * 0.6), grow: k.grow || 1, col: k.rainbow ? RB[(Math.random() * RB.length) | 0] : k.c }); } }
export function stepFx(dt) { const m = FX.mesh; if (!m) return; let j = 0;
  FX.list = FX.list.filter((p) => (p.t += dt) < p.life);
  for (const p of FX.list) { p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.y < 0.03) { p.y = 0.03; p.vy *= -0.3; p.vx *= 0.7; p.vz *= 0.7; }
    const k = 1 - p.t / p.life, s = p.s * (1 + (p.grow - 1) * (p.t / p.life)) * Math.min(1, k * 3); _o.position.set(p.x, p.y, p.z); _o.scale.setScalar(s); _o.updateMatrix(); m.setMatrixAt(j, _o.matrix); m.instanceColor.setXYZ(j, ...(_c.set(p.col).toArray())); j++; }
  m.count = j; m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; }
export function clearFx() { FX.list.length = 0; }
// floating "+$12" labels
const _v = new THREE.Vector3();
export function floatText(txt, x, y, z, cls) { const d = document.createElement('div'); d.className = 'float ' + (cls || ''); d.textContent = txt; document.getElementById('floats').appendChild(d); FX.floats.push({ d, x, y, z, t: 0 }); }
export function stepFloats(dt, cam, w, h) { FX.floats = FX.floats.filter((f) => { f.t += dt; if (f.t > 1.4) { f.d.remove(); return false; } _v.set(f.x, f.y + f.t * 1.2, f.z).project(cam); if (_v.z > 1) { f.d.style.opacity = 0; return true; }
  f.d.style.transform = `translate(${(_v.x * 0.5 + 0.5) * w}px,${(-_v.y * 0.5 + 0.5) * h}px) translate(-50%,-50%)`; f.d.style.opacity = Math.min(1, (1.4 - f.t) * 2); return true; }); }
export function clearFloats() { FX.floats.forEach((f) => f.d.remove()); FX.floats = []; }
