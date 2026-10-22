// Set dressing kit: everything repeated is batched into InstancedMeshes so sets can be dense and still fast.
import * as THREE from 'three';
import { G, mat, part } from './models.js';
import { logoTex, textTex, canvasTex } from './tex.js';
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
export class Batch {
  constructor() { this.map = new Map(); }
  add(g, m, x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0, color) {
    const k = g.uuid + m.uuid; let e = this.map.get(k); if (!e) { e = { g, m, list: [] }; this.map.set(k, e); }
    e.list.push([x, y, z, sx, sy ?? sx, sz ?? sx, rx, ry, rz, color]); return this;
  }
  build(parent, shadow = true) {
    for (const e of this.map.values()) {
      const n = e.list.length, im = new THREE.InstancedMesh(e.g, e.m, n); im.castShadow = shadow; im.receiveShadow = true;
      e.list.forEach((a, i) => { _p.set(a[0], a[1], a[2]); _q.setFromEuler(_e.set(a[6], a[7], a[8])); _s.set(a[3], a[4], a[5]); im.setMatrixAt(i, _m.compose(_p, _q, _s)); if (a[9]) im.setColorAt(i, _c.set(a[9])); });
      im.computeBoundingSphere(); parent.add(im);
    }
    this.map.clear();
  }
}
const CROWD = ['#ff7ab8', '#7ad7ff', '#ffd46b', '#9cf07a', '#c49bff', '#ff9a5c', '#f2f2f2', '#8d8f99', '#a8744f'];
export function sign(parent, tex, w, x, y, z, ry = 0, aspect = 3.6, frame = '#1a1430') {
  const h = w / aspect, g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  const p = new THREE.Mesh(G.plane(), new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.35, roughness: 0.6 }));
  p.scale.set(w, h, 1); p.position.z = 0.06; g.add(p);
  part(G.box(), mat(frame), 0, 0, 0, w + 0.16, h + 0.16, 0.1, g); return g;
}
export const sponsorTex = (i) => logoTex(i % 2 ? 'tortuga' : 'ratita');
// bleachers with a cheering pet crowd
export function bleachers(b, x, z, ry, len, rows = 4) {
  const c = Math.cos(ry), s = Math.sin(ry), P = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  for (let r = 0; r < rows; r++) {
    const [px, pz] = P(0, r * 0.9), hh = 0.5 + r * 0.9; b.add(G.box(), mat('#4b3f8f'), px, hh / 2, pz, len, hh, 0.9, ry);
    b.add(G.box(), mat('#ffd23f', { emissive: '#ffb000', emissiveIntensity: 0.5 }), px, 0.5 + r * 0.9 + 0.02, pz - 0.45, len, 0.05, 0.06, ry);
    for (let i = 0; i < len / 0.8 - 1; i++) {
      if (((i * 7 + r * 3) % 5) === 0) continue;
      const lx = -len / 2 + 0.6 + i * 0.8 + ((r % 2) * 0.3), [cx, cz] = P(lx, r * 0.9), col = CROWD[(i * 5 + r * 3) % CROWD.length], top = 0.5 + r * 0.9;
      b.add(G.sphLo(), mat('#ffffff'), cx, top + 0.3, cz, 0.24, 0.3, 0.22, ry, 0, 0, col);
      b.add(G.sphLo(), mat('#ffffff'), cx, top + 0.72, cz - 0.02 * c, 0.19, 0.18, 0.19, ry, 0, 0, col);
      if ((i + r) % 3 === 0) b.add(G.sphLo(), mat('#ffffff'), cx + 0.12 * c, top + 0.95, cz - 0.12 * s, 0.07, 0.07, 0.07, ry, 0, 0, '#ffe9c4');
      if ((i + r) % 4 === 1) b.add(G.box(), mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.25 }), cx, top + 1.1, cz, 0.36, 0.22, 0.03, ry, 0, 0, i % 2 ? '#ff3fb4' : '#16c79a');
    }
  }
}
export function lightTower(b, x, z, h = 6, col = '#ff4fd8') {
  b.add(G.cylLo(), mat('#2a2640', { metalness: 0.6, roughness: 0.35 }), x, h / 2, z, 0.12, h, 0.12);
  b.add(G.box(), mat('#2a2640', { metalness: 0.6, roughness: 0.35 }), x, h, z, 1.2, 0.12, 0.12);
  for (const dx of [-0.45, 0, 0.45]) { b.add(G.cyl(), mat('#1a1830', { metalness: 0.5 }), x + dx, h - 0.2, z, 0.16, 0.3, 0.16); b.add(G.sph(), mat(col, { emissive: col, emissiveIntensity: 2.4 }), x + dx, h - 0.36, z, 0.13, 0.05, 0.13, 0, 0, 0); }
  b.add(G.box(), mat('#1a1830'), x, 0.15, z, 0.7, 0.3, 0.7);
}
export function speaker(b, x, z, ry = 0, n = 2) {
  for (let i = 0; i < n; i++) { const y = 0.45 + i * 0.9; b.add(G.box(), mat('#18161f', { roughness: 0.8 }), x, y, z, 0.8, 0.88, 0.7, ry);
    const fx = x + Math.sin(ry) * 0.36, fz = z + Math.cos(ry) * 0.36; b.add(G.cyl(), mat('#3a3a46', { metalness: 0.4 }), fx, y + 0.12, fz, 0.24, 0.04, 0.24, ry, Math.PI / 2); b.add(G.cyl(), mat('#3a3a46', { metalness: 0.4 }), fx, y - 0.26, fz, 0.1, 0.04, 0.1, ry, Math.PI / 2); }
}
export function plant(b, x, z, s = 1) {
  b.add(G.cyl(), mat('#d96a3b'), x, 0.25 * s, z, 0.3 * s, 0.5 * s, 0.3 * s);
  b.add(G.sphLo(), mat('#3fae54'), x, 0.75 * s, z, 0.42 * s, 0.5 * s, 0.42 * s); b.add(G.sphLo(), mat('#58c96a'), x + 0.15 * s, 1.05 * s, z, 0.25 * s);
}
export function crate(b, x, y, z, s = 0.7, ry = 0) { // Tortuga Tech "shell-tough" tested
  b.add(G.box(), mat('#c79a5a', { roughness: 0.8 }), x, y + s / 2, z, s, s, s, ry);
  b.add(G.box(), mat('#16c79a', { emissive: '#0b6e5a', emissiveIntensity: 0.3 }), x, y + s / 2, z, s * 1.02, s * 0.22, s * 1.02, ry);
}
export function tvCamera(b, x, z, ry) { // Tortuga TV camera crew rig
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; b.add(G.cylLo(), mat('#2b2b33', { metalness: 0.5 }), x + Math.cos(a) * 0.28, 0.6, z + Math.sin(a) * 0.28, 0.03, 1.25, 0.03, 0, Math.sin(a) * 0.4, -Math.cos(a) * 0.4); }
  b.add(G.box(), mat('#2b2f3a', { metalness: 0.4, roughness: 0.4 }), x, 1.35, z, 0.42, 0.36, 0.7, ry);
  b.add(G.cyl(), mat('#111', { metalness: 0.6, roughness: 0.2 }), x + Math.sin(ry) * 0.45, 1.35, z + Math.cos(ry) * 0.45, 0.13, 0.3, 0.13, ry, Math.PI / 2);
  b.add(G.sph(), mat('#ff2a2a', { emissive: '#ff2a2a', emissiveIntensity: 3 }), x, 1.57, z, 0.04);
  b.add(G.box(), mat('#16c79a'), x, 1.35, z, 0.44, 0.08, 0.72, ry);
}
export function balloons(b, x, z, n = 5) { const cols = ['#ff3fb4', '#ffd23f', '#16c79a', '#3ff0ff', '#a78bfa'];
  for (let i = 0; i < n; i++) { const a = i * 2.4, r = 0.25; b.add(G.sphLo(), mat(cols[i % 5], { roughness: 0.25 }), x + Math.cos(a) * r, 1.9 + (i % 3) * 0.3, z + Math.sin(a) * r, 0.24, 0.3, 0.24); }
  b.add(G.cylLo(), mat('#eeeeee'), x, 0.9, z, 0.01, 1.8, 0.01); b.add(G.box(), mat('#ffd23f'), x, 0.08, z, 0.3, 0.16, 0.3); }
// full perimeter dressing around a rectangular play area: rail with LED strip, sponsor boards, bleachers with a crowd,
// light towers, speakers, Tortuga TV cameras, plants, crates. Leaves no empty floor in view.
export function arenaRing(grp, hw, hd, o = {}) {
  const b = new Batch(), rail = o.rail || '#ffffff', led = o.led || '#ff4fd8';
  const pad = o.pad ?? 0.6, W = hw + pad, D = hd + pad;
  // rail
  for (const [x, z, sx, sz] of [[0, -D, W * 2, 0.25], [0, D, W * 2, 0.25], [-W, 0, 0.25, D * 2], [W, 0, 0.25, D * 2]]) {
    b.add(G.box(), mat(rail), x, 0.3, z, sx, 0.6, sz); b.add(G.box(), mat(led, { emissive: led, emissiveIntensity: 1.6 }), x, 0.62, z, sx + 0.02, 0.06, sz + 0.02);
  }
  // sponsor boards on the far and side rails
  const boards = [];
  for (let x = -W + 1.9; x <= W - 1.9; x += 3.8) boards.push([x, -D - 0.2, 0]);
  for (let z = -D + 2.5; z <= D - 2.5; z += 4.2) { boards.push([-W - 0.2, z, Math.PI / 2]); boards.push([W + 0.2, z, -Math.PI / 2]); }
  boards.forEach(([x, z, ry], i) => sign(grp, sponsorTex(i), 3.4, x, 1.05, z, ry));
  // bleachers behind
  bleachers(b, 0, -D - 1.8, Math.PI, W * 2 + 2, 4);
  bleachers(b, -W - 1.8, 0, -Math.PI / 2, D * 2 - 1, 3); bleachers(b, W + 1.8, 0, Math.PI / 2, D * 2 - 1, 3);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { lightTower(b, sx * (W + 1.4), sz * (D + 1.4), 7, sz < 0 ? '#ff4fd8' : '#3ff0ff'); speaker(b, sx * (W + 0.7), sz * (D + 0.7), sx > 0 ? -Math.PI * 0.75 : Math.PI * 0.75, 2); plant(b, sx * (W + 0.5), sz * D * 0.5, 0.9); }
  for (const [sx] of [[-1], [1]]) { tvCamera(b, sx * (W - 0.4 + 1.0), D + 1.4, Math.PI + sx * 0.4); crate(b, sx * (W + 0.6), 0, D + 0.4, 0.6); crate(b, sx * (W + 0.6), 0.6, D + 0.4, 0.45, 0.4); balloons(b, sx * (W + 0.5), -D + 0.4); }
  // near-side low dressing (camera side): crates, plants and a front banner strip so the edge is never bare
  for (let x = -W + 0.9, k = 0; x < W - 0.6; x += 1.3, k++) { if (k % 3 === 0) plant(b, x, D + 0.75, 0.7); else if (k % 3 === 1) crate(b, x, 0, D + 0.75, 0.55, 0.3); else balloons(b, x, D + 0.75, 3); }
  for (let x = -W - 1, k = 0; x < W + 1; x += 1.0, k++) { b.add(G.box(), mat(k % 2 ? '#ff3fb4' : '#16c79a', { emissive: k % 2 ? '#ff3fb4' : '#16c79a', emissiveIntensity: 0.5 }), x, 0.02, D + 1.7, 0.9, 0.04, 0.6); b.add(G.sphLo(), mat(CROWD[k % CROWD.length]), x, 0.35, D + 2.6, 0.28, 0.35, 0.26); b.add(G.sphLo(), mat(CROWD[(k + 3) % CROWD.length]), x, 0.82, D + 2.6, 0.2); }
  // studio floor beyond the arena
  const fl = new THREE.Mesh(G.plane(), mat(o.floor || '#2a1f4f', { roughness: 0.4, metalness: 0.1 })); fl.rotation.x = -Math.PI / 2; fl.scale.set(120, 120, 1); fl.position.y = -0.02; fl.receiveShadow = true; grp.add(fl);
  // back wall with a giant screen + Tortuga TV branding
  const wallZ = -D - 6.5; b.add(G.box(), mat('#1d1640'), 0, 5, wallZ, W * 2 + 16, 10, 0.4);
  sign(grp, logoTex('tv'), 8, 0, 7.4, wallZ + 0.3, 0, 720 / 200, '#0b2a24');
  for (let i = 0; i < 9; i++) b.add(G.box(), mat(i % 2 ? '#ff3fb4' : '#3ff0ff', { emissive: i % 2 ? '#ff3fb4' : '#3ff0ff', emissiveIntensity: 1.2 }), -W - 6 + i * ((W * 2 + 12) / 8), 4.5, wallZ + 0.25, 0.15, 7, 0.05);
  b.build(grp);
  return b;
}
export function sky(scene, top = '#3a1c7a', bot = '#ff8fcf') {
  const t = canvasTex('sky' + top + bot, 4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  scene.background = t;
}
