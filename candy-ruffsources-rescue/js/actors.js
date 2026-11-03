// Vehicles + Guinea Pig Gang + belt parcels
import * as THREE from 'three';
import { Batch, G, PI } from './kit.js';
import { MATS } from './mats.js';
export const TRUCKS = {
  van: { name: 'Ratita Mail Van', body: 0xf8fafc, stripe: 0x2563eb, len: 5.2, wid: 2.3, hgt: 2.5, speed: 17, cap: 4, armor: 1 },
  speedy: { name: 'Speedy Van', body: 0xef4444, stripe: 0xfacc15, len: 5.0, wid: 2.2, hgt: 2.3, speed: 24, cap: 5, armor: 1 },
  rescue: { name: 'RuffSources Rescue Van', body: 0xffffff, stripe: 0xec4899, len: 5.2, wid: 2.3, hgt: 2.5, speed: 17, cap: 1, armor: 1, logo: ['RUFFSOURCES', '🐾 Pup Rescue Team', '#be185d'] },
  turbo: { name: 'Turbo Rescue Van', body: 0xec4899, stripe: 0xfde047, len: 5.0, wid: 2.2, hgt: 2.3, speed: 25, cap: 1, armor: 1.4, logo: ['RUFFSOURCES', '⚡ Turbo Rescue', '#7c3aed'] },
  big: { name: 'Big Mail Truck', body: 0xfacc15, stripe: 0x1e3a8a, len: 7.2, wid: 2.6, hgt: 3.2, speed: 19, cap: 8, armor: 1.8 },
};
export function makeTruck(kind = 'van') {
  const T = TRUCKS[kind] || TRUCKS.van, L = T.len, W = T.wid, H = T.hgt; const root = new THREE.Group(), B = new Batch();
  const cabL = 1.7, boxL = L - cabL; // cab at +z (front)
  B.rbox('g', T.body, 0, 0.55, -L / 2 + boxL / 2, W, H - 0.4, boxL); // cargo box
  B.box('g', T.stripe, 0, 1.2, -L / 2 + boxL / 2, W + 0.04, 0.35, boxL - 0.3);
  B.rbox('g', T.body, 0, 0.55, L / 2 - cabL / 2, W - 0.1, 1.6, cabL); B.rbox('g', T.body, 0, 2.0, L / 2 - cabL / 2 - 0.15, W - 0.12, 0.7, cabL - 0.3);
  B.box('e', 0x9fd3f2, 0, 1.55, L / 2 - 0.02, W - 0.4, 0.9, 0.08); for (const s of [-1, 1]) B.box('e', 0x9fd3f2, s * (W / 2 - 0.02), 1.55, L / 2 - cabL / 2, 0.08, 0.8, cabL - 0.5);
  B.box('x', 0x334155, 0, 0.35, L / 2 + 0.05, W, 0.35, 0.2); B.box('x', 0x334155, 0, 0.35, -L / 2 - 0.05, W, 0.3, 0.2);
  for (const s of [-1, 1]) { B.box('l', 0xfffbe6, s * (W / 2 - 0.3), 0.85, L / 2 + 0.03, 0.36, 0.22, 0.06, 0, 0.8); B.box('l', 0xff2d2d, s * (W / 2 - 0.25), 0.8, -L / 2 - 0.03, 0.25, 0.3, 0.06, 0, 0.6); B.box('x', 0x111827, s * (W / 2 + 0.12), 1.7, L / 2 - 0.4, 0.06, 0.3, 0.22); }
  B.box('x', 0x94a3b8, 0, 0.6, -L / 2 - 0.02, W - 0.4, H - 0.6, 0.04);
  B.finish(root);
  // logo decals (canvas, matches aspect)
  const c = document.createElement('canvas'); c.width = 512; c.height = 192; const g = c.getContext('2d'); const LG = T.logo || ['RATITA POST', '🐀 Ratita Industries', '#1e3a8a']; g.fillStyle = LG[2]; g.beginPath(); g.roundRect(8, 8, 496, 176, 40); g.fill(); g.fillStyle = '#fde047'; g.font = '900 70px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(LG[0], 256, 70); g.font = '700 40px system-ui,sans-serif'; g.fillStyle = '#fff'; g.fillText(LG[1], 256, 138);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const dm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, transparent: true });
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), dm); p.position.set(s * (W / 2 + 0.025), 1.9, -L / 2 + boxL / 2); p.rotation.y = s * PI / 2; root.add(p); }
  const wheels = []; const wg = new THREE.CylinderGeometry(0.48, 0.48, 0.36, 20); wg.rotateZ(PI / 2); const hub = new THREE.CylinderGeometry(0.24, 0.24, 0.38, 12); hub.rotateZ(PI / 2);
  const wm = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 }), hm = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.8, roughness: 0.3 });
  for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const w = new THREE.Group(); const t = new THREE.Mesh(wg, wm); t.castShadow = true; w.add(t, new THREE.Mesh(hub, hm)); w.position.set(x * (W / 2 - 0.05), 0.48, z > 0 ? L / 2 - 0.95 : -L / 2 + 1.1); root.add(w); wheels.push(w); }
  // smoke puff group for damage
  return { root, wheels, spec: T, kind };
}
export function makeCar(col) {
  const root = new THREE.Group(), B = new Batch(); const L = 4, W = 1.9;
  B.rbox('g', col, 0, 0.35, 0, W, 0.8, L); B.rbox('g', col, 0, 1.05, -0.2, W - 0.2, 0.7, 2.2); B.box('e', 0x9fd3f2, 0, 1.1, -0.2, W - 0.16, 0.55, 2.0);
  for (const s of [-1, 1]) { B.box('l', 0xfffbe6, s * 0.6, 0.65, L / 2 + 0.01, 0.35, 0.18, 0.04, 0, 0.6); B.box('l', 0xff2d2d, s * 0.65, 0.65, -L / 2 - 0.01, 0.3, 0.16, 0.04, 0, 0.5); }
  for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) B.add('m', G.cyl, 0x111827, x * (W / 2 - 0.1), 0.38, z * 1.25, 0, 0, PI / 2, 0.38, 0.3, 0.38);
  B.finish(root); return { root };
}
// Guinea pig (gang member): round, no tail, little ears, red bandana mask
export function makeGuineaPig(col = 0xd97706, boss = false) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const B = new Batch();
  B.add('f', G.sph, col, 0, 0.42, 0, 0, 0, 0, 0.5, 0.4, 0.62); B.add('f', G.sph, 0xffffff, 0, 0.5, -0.25, 0, 0, 0, 0.42, 0.36, 0.35); B.add('f', G.sph, col, 0, 0.5, 0.5, 0, 0, 0, 0.36, 0.33, 0.33);
  B.add('f', G.sph, 0xfff7ed, 0, 0.42, 0.75, 0, 0, 0, 0.18, 0.15, 0.12); B.add('g', G.sph, 0xff8fb0, 0, 0.47, 0.86, 0, 0, 0, 0.05, 0.04, 0.03);
  for (const s of [-1, 1]) { B.add('g', G.sph, 0x111111, s * 0.16, 0.6, 0.74, 0, 0, 0, 0.06, 0.07, 0.05); B.add('l', G.sph, 0xffffff, s * 0.16 + 0.02, 0.63, 0.78, 0, 0, 0, 0.018, 0.018, 0.01, 0.3); B.add('f', G.sph, 0x9a3412, s * 0.26, 0.78, 0.48, 0, 0, 0, 0.12, 0.09, 0.05); }
  B.add('g', G.box, 0xdc2626, 0, 0.62, 0.66, 0, 0, 0, 0.62, 0.1, 0.3); // bandana mask
  for (const [x, z] of [[-0.25, 0.35], [0.25, 0.35], [-0.28, -0.3], [0.28, -0.3]]) B.add('g', G.sph, 0xffb3c8, x, 0.06, z, 0, 0, 0, 0.1, 0.06, 0.13);
  if (boss) { B.add('g', G.cyl, 0x111827, 0, 0.92, 0.45, 0, 0, 0, 0.3, 0.06, 0.3); B.add('g', G.cyl, 0x111827, 0, 1.08, 0.45, 0, 0, 0, 0.2, 0.3, 0.2); B.add('g', G.box, 0xdc2626, 0, 0.97, 0.45, 0, 0, 0, 0.42, 0.06, 0.42); }
  B.finish(body); root.scale.setScalar(boss ? 1.5 : 1.25); return { root, body, t: Math.random() * 9 };
}
export function animPig(p, dt, moving) { p.t += dt; p.body.position.y = Math.abs(Math.sin(p.t * (moving ? 12 : 3))) * (moving ? 0.1 : 0.02); p.body.rotation.z = Math.sin(p.t * 2) * 0.05; }
export function makeGangVan() {
  const root = new THREE.Group(), B = new Batch(); B.rbox('g', 0x4c1d95, 0, 0.5, 0, 2.2, 2.2, 5); B.box('e', 0x1f2937, 0, 1.5, 2.48, 1.8, 0.8, 0.06); B.box('g', 0xfacc15, 0, 1.4, 0, 2.24, 0.3, 4.6);
  for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) B.add('m', G.cyl, 0x111827, x * 1.05, 0.45, z * 1.6, 0, 0, PI / 2, 0.45, 0.3, 0.45);
  B.finish(root);
  const c = document.createElement('canvas'); c.width = 512; c.height = 160; const g = c.getContext('2d'); g.fillStyle = '#111827'; g.fillRect(0, 0, 512, 160); g.fillStyle = '#f87171'; g.font = '900 56px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('GUINEA PIG GANG', 256, 80);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const m = new THREE.MeshStandardMaterial({ map: tex });
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1), m); p.position.set(s * 1.13, 1.9, 0); p.rotation.y = s * PI / 2; root.add(p); }
  return root;
}
// parcels riding the belts (one instanced mesh)
export function makeBeltParcels(belts, scene) {
  const per = 7, n = belts.length * per; const g = new THREE.BoxGeometry(1, 1, 1); const m = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }), n);
  m.castShadow = true; m.receiveShadow = true; const items = []; const cols = [0xc4a484, 0xd6b48a, 0xf8fafc, 0xef4444, 0x3b82f6, 0xfacc15, 0x22c55e]; const c = new THREE.Color();
  belts.forEach((b, i) => { for (let k = 0; k < per; k++) { const it = { b, u: k / per, s: [0.5 + Math.random() * 0.3, 0.3 + Math.random() * 0.3, 0.45 + Math.random() * 0.3], idx: items.length }; items.push(it); m.setColorAt(it.idx, c.set(cols[(i * 3 + k) % cols.length])); } });
  scene.add(m); const d = new THREE.Object3D();
  return { mesh: m, update(dt, running) { for (const it of items) { if (running[it.b.i]) it.u = (it.u + dt * 0.06) % 1; const x = it.b.x0 + (it.b.x1 - it.b.x0) * it.u; d.position.set(x, it.b.y + it.s[1] / 2, it.b.z + Math.sin(it.idx * 1.7) * 0.25); d.scale.set(it.s[0], it.s[1], it.s[2]); d.rotation.y = it.idx * 0.4; d.updateMatrix(); m.setMatrixAt(it.idx, d.matrix); } m.instanceMatrix.needsUpdate = true; } };
}
