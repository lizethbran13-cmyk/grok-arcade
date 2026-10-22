// Characters + shared geometry/material caches (kept between sets so nothing re-uploads).
import * as THREE from 'three';
const GC = new Map(), MC = new Map();
export function geo(key, make) { let g = GC.get(key); if (!g) { g = make(); g.userData.keep = true; GC.set(key, g); } return g; }
export function mat(color, o = {}) {
  const key = color + JSON.stringify(o); let m = MC.get(key);
  if (!m) { m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.55, metalness: 0.0 }, o)); m.userData.keep = true; MC.set(key, m); }
  return m;
}
export const G = {
  sph: () => geo('sph', () => new THREE.SphereGeometry(1, 20, 14)),
  sphLo: () => geo('sphLo', () => new THREE.SphereGeometry(1, 10, 8)),
  box: () => geo('box', () => new THREE.BoxGeometry(1, 1, 1)),
  rbox: () => geo('rbox', () => { const g = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2); return g; }),
  cyl: () => geo('cyl', () => new THREE.CylinderGeometry(1, 1, 1, 20)),
  cylLo: () => geo('cylLo', () => new THREE.CylinderGeometry(1, 1, 1, 8)),
  cone: () => geo('cone', () => new THREE.ConeGeometry(1, 1, 16)),
  tor: () => geo('tor', () => new THREE.TorusGeometry(1, 0.12, 8, 28)),
  dome: () => geo('dome', () => new THREE.SphereGeometry(1, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2)),
  cap: () => geo('cap', () => new THREE.CapsuleGeometry(0.5, 1, 6, 12)),
  plane: () => geo('plane', () => new THREE.PlaneGeometry(1, 1)),
};
export function part(g, m, x, y, z, sx, sy, sz, parent, shadow = true) {
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.scale.set(sx, sy ?? sx, sz ?? sx); o.castShadow = shadow; o.receiveShadow = true; if (parent) parent.add(o); return o;
}
export const CHARS = [
  { id: 'luna', n: 'Luna', kind: 'rat', fur: '#cfc8d8', belly: '#f4eef8', acc: '#8b6cff', blurb: 'Clever grey rat. Fast thinker!' },
  { id: 'pirat', n: 'Pi-rat', kind: 'rat', fur: '#8a5a3c', belly: '#d8b08c', acc: '#1f1f1f', oneEye: true, blurb: 'One-eyed pirate rat. Arr!' },
  { id: 'snowie', n: 'Snowie', kind: 'rat', fur: '#fbfbff', belly: '#ffffff', acc: '#4fc3ff', blurb: 'Snow-white rat. Loves to fly.' },
  { id: 'candy', n: 'Candy', kind: 'dog', fur: '#8e9099', belly: '#d9dadf', acc: '#ff4f8b', blurb: 'Mini schnauzer, Ruffsources boss. Best catcher!' },
  { id: 'torty', n: 'Torty', kind: 'turtle', fur: '#7dc75a', belly: '#e7d58c', acc: '#2f8f4a', blurb: 'Slow? Not on the ice!' },
  { id: 'grok', n: 'Grok', kind: 'bot', fur: '#3a3f55', belly: '#c9d2ff', acc: '#3ff0ff', blurb: 'Party robot. Beep boop!' },
];
export const charById = (id) => CHARS.find((c) => c.id === id) || CHARS[0];
const eyeM = () => mat('#14101c', { roughness: 0.2 }), whiteM = () => mat('#ffffff', { roughness: 0.3 }), pinkM = () => mat('#ff9fb8');
function eyes(h, y, z, sep, r, one) {
  part(G.sph(), whiteM(), -sep, y, z, r * 1.3, r * 1.3, r * 0.8, h, false); part(G.sph(), eyeM(), -sep, y, z + r * 0.6, r * 0.75, r * 0.75, r * 0.5, h, false);
  if (one) { part(G.cyl(), eyeM(), sep, y, z + 0.02, r * 1.4, r * 0.25, r * 1.4, h, false).rotation.x = Math.PI / 2; part(G.box(), eyeM(), 0, y + r * 0.2, z - 0.02, sep * 3.2, r * 0.3, r * 0.3, h, false).rotation.z = 0.35; }
  else { part(G.sph(), whiteM(), sep, y, z, r * 1.3, r * 1.3, r * 0.8, h, false); part(G.sph(), eyeM(), sep, y, z + r * 0.6, r * 0.75, r * 0.75, r * 0.5, h, false); }
}
// player colour ring (collar) so 4 Candys can still be told apart
export function makeChar(id, color, opt = {}) {
  const c = charById(id), root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const fur = mat(c.fur), bel = mat(c.belly), acc = mat(c.acc), col = mat(color || '#ffffff', { emissive: color || '#000', emissiveIntensity: 0.25 });
  const legs = [];
  if (c.kind === 'rat') {
    part(G.sph(), fur, 0, 0.42, 0, 0.36, 0.34, 0.46, body); part(G.sph(), bel, 0, 0.36, 0.14, 0.27, 0.25, 0.3, body);
    const h = new THREE.Group(); h.position.set(0, 0.62, 0.36); body.add(h);
    part(G.sph(), fur, 0, 0, 0, 0.25, 0.23, 0.27, h); part(G.cone(), fur, 0, -0.04, 0.27, 0.14, 0.24, 0.14, h).rotation.x = Math.PI / 2; part(G.sph(), pinkM(), 0, -0.04, 0.4, 0.045, 0.045, 0.045, h);
    for (const s of [-1, 1]) { part(G.cyl(), fur, s * 0.17, 0.2, -0.02, 0.13, 0.03, 0.13, h).rotation.x = Math.PI / 2; part(G.cyl(), pinkM(), s * 0.17, 0.2, 0.0, 0.09, 0.02, 0.09, h).rotation.x = Math.PI / 2; }
    eyes(h, 0.05, 0.2, 0.1, 0.05, c.oneEye);
    for (const s of [-1, 1]) for (const r of [-0.15, 0.15]) { const w = part(G.cylLo(), mat('#ffffff', { roughness: 0.5 }), s * 0.16, -0.05, 0.3, 0.008, 0.2, 0.008, h, false); w.rotation.z = Math.PI / 2 + r; }
    const tail = new THREE.Group(); tail.position.set(0, 0.36, -0.42); body.add(tail);
    for (let i = 0; i < 5; i++) { const t = part(G.cylLo(), pinkM(), 0, 0.02 + i * 0.03, -0.1 - i * 0.12, 0.035 - i * 0.005, 0.14, 0.035 - i * 0.005, tail); t.rotation.x = Math.PI / 2 - 0.25; }
    root.userData.tail = tail;
    if (id === 'pirat') { const hat = new THREE.Group(); hat.position.set(0, 0.22, -0.02); h.add(hat); part(G.cyl(), mat('#1d1d26'), 0, 0, 0, 0.3, 0.05, 0.22, hat); part(G.sph(), mat('#1d1d26'), 0, 0.07, 0, 0.2, 0.14, 0.16, hat); part(G.sph(), whiteM(), 0, 0.1, 0.15, 0.04, 0.04, 0.02, hat, false); }
    if (id === 'luna') { part(G.tor(), acc, 0, 0.17, 0, 0.13, 0.13, 0.13, h).rotation.x = Math.PI / 2; part(G.sph(), mat('#ffe58a', { emissive: '#ffcc33', emissiveIntensity: 0.6 }), 0, 0.2, 0.09, 0.05, 0.05, 0.05, h); }
    if (id === 'snowie') { part(G.box(), acc, 0, 0.18, 0.05, 0.3, 0.06, 0.1, h); part(G.sph(), mat('#bfefff', { metalness: 0.3, roughness: 0.1 }), -0.08, 0.2, 0.11, 0.06, 0.05, 0.03, h); part(G.sph(), mat('#bfefff', { metalness: 0.3, roughness: 0.1 }), 0.08, 0.2, 0.11, 0.06, 0.05, 0.03, h); }
    for (const [x, z] of [[-0.2, 0.22], [0.2, 0.22], [-0.2, -0.22], [0.2, -0.22]]) legs.push(part(G.sph(), fur, x, 0.1, z, 0.09, 0.12, 0.11, body));
  } else if (c.kind === 'dog') {
    part(G.cap(), fur, 0, 0.5, 0, 0.62, 0.55, 0.62, body).rotation.x = Math.PI / 2; part(G.sph(), bel, 0, 0.44, 0.1, 0.26, 0.24, 0.32, body);
    const h = new THREE.Group(); h.position.set(0, 0.82, 0.42); body.add(h);
    part(G.sph(), fur, 0, 0, 0, 0.28, 0.27, 0.28, h); part(G.sph(), bel, 0, -0.07, 0.22, 0.15, 0.12, 0.16, h); part(G.sph(), eyeM(), 0, -0.02, 0.37, 0.06, 0.05, 0.05, h);
    for (const s of [-1, 1]) { const e = part(G.sph(), mat('#5f616a'), s * 0.2, 0.2, 0.0, 0.08, 0.13, 0.05, h); e.rotation.z = -s * 0.4; }
    part(G.sph(), mat('#e6e7ec', { roughness: 0.9 }), 0, -0.2, 0.24, 0.16, 0.16, 0.12, h); for (const s of [-1, 1]) part(G.box(), mat('#e6e7ec', { roughness: 0.9 }), s * 0.1, 0.14, 0.24, 0.12, 0.04, 0.05, h, false);
    eyes(h, 0.07, 0.22, 0.11, 0.05, false); part(G.sph(), pinkM(), 0, -0.16, 0.28, 0.06, 0.03, 0.05, h, false);
    const tail = new THREE.Group(); tail.position.set(0, 0.62, -0.42); body.add(tail); part(G.cap(), fur, 0, 0.12, -0.05, 0.12, 0.25, 0.12, tail).rotation.x = -0.6; root.userData.tail = tail;
    for (const [x, z] of [[-0.18, 0.28], [0.18, 0.28], [-0.18, -0.28], [0.18, -0.28]]) legs.push(part(G.cap(), fur, x, 0.17, z, 0.16, 0.28, 0.16, body));
    part(G.tor(), col, 0, 0.68, 0.33, 0.21, 0.21, 0.4, body).rotation.x = Math.PI / 2 - 0.5;
  } else if (c.kind === 'turtle') {
    part(G.dome(), mat('#3f8f3a', { roughness: 0.4 }), 0, 0.22, 0, 0.5, 0.42, 0.56, body); part(G.cyl(), mat('#c9a35a'), 0, 0.22, 0, 0.52, 0.06, 0.58, body);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; part(G.sph(), mat('#2f6e2b'), Math.cos(a) * 0.3, 0.48, Math.sin(a) * 0.33, 0.13, 0.06, 0.13, body, false); }
    part(G.sph(), mat('#2f6e2b'), 0, 0.62, 0, 0.16, 0.05, 0.16, body, false);
    const h = new THREE.Group(); h.position.set(0, 0.34, 0.58); body.add(h); part(G.sph(), fur, 0, 0, 0, 0.2, 0.18, 0.22, h); eyes(h, 0.05, 0.14, 0.09, 0.045, false);
    part(G.box(), mat('#ffffff'), 0, -0.07, 0.19, 0.12, 0.015, 0.02, h, false);
    for (const [x, z] of [[-0.38, 0.32], [0.38, 0.32], [-0.38, -0.32], [0.38, -0.32]]) legs.push(part(G.sph(), fur, x, 0.12, z, 0.13, 0.11, 0.16, body));
    part(G.tor(), col, 0, 0.27, 0, 0.53, 0.53, 0.53, body).rotation.x = Math.PI / 2;
  } else { // Grok bot
    part(G.rbox(), fur, 0, 0.55, 0, 0.6, 0.55, 0.5, body); part(G.box(), mat('#10131f', { roughness: 0.2 }), 0, 0.58, 0.26, 0.46, 0.36, 0.02, body);
    part(G.sph(), mat(c.acc, { emissive: c.acc, emissiveIntensity: 1.6 }), -0.11, 0.62, 0.275, 0.06, 0.06, 0.02, body, false); part(G.sph(), mat(c.acc, { emissive: c.acc, emissiveIntensity: 1.6 }), 0.11, 0.62, 0.275, 0.06, 0.06, 0.02, body, false);
    part(G.box(), mat(c.acc, { emissive: c.acc, emissiveIntensity: 1.2 }), 0, 0.5, 0.275, 0.16, 0.03, 0.02, body, false);
    part(G.cylLo(), mat('#9aa3c7', { metalness: 0.6, roughness: 0.3 }), 0, 0.92, 0, 0.02, 0.2, 0.02, body); part(G.sph(), mat('#ff4fd8', { emissive: '#ff4fd8', emissiveIntensity: 1.4 }), 0, 1.04, 0, 0.05, 0.05, 0.05, body, false);
    for (const s of [-1, 1]) legs.push(part(G.cyl(), mat('#22263a'), s * 0.18, 0.13, 0, 0.12, 0.26, 0.12, body));
    for (const s of [-1, 1]) part(G.sph(), fur, s * 0.36, 0.55, 0.05, 0.09, 0.16, 0.09, body);
    part(G.tor(), col, 0, 0.3, 0, 0.32, 0.32, 0.32, body).rotation.x = Math.PI / 2;
  }
  if (c.kind === 'rat') part(G.tor(), col, 0, 0.53, 0.28, 0.2, 0.2, 0.3, body).rotation.x = Math.PI / 2 - 0.3;
  root.userData = Object.assign(root.userData, { body, legs, kind: c.kind, id, ph: Math.random() * 6 });
  if (opt.scale) root.scale.setScalar(opt.scale);
  return root;
}
export function animChar(o, t, speed, air) {
  const u = o.userData, ph = t * 12 + u.ph, b = u.body;
  const run = Math.min(1, speed / 3);
  b.position.y = air ? 0 : Math.abs(Math.sin(ph)) * 0.08 * run + Math.sin(t * 2 + u.ph) * 0.01;
  b.rotation.x = run * 0.12;
  u.legs.forEach((l, i) => { l.position.y = (u.kind === 'dog' ? 0.17 : u.kind === 'bot' ? 0.13 : 0.1) + Math.max(0, Math.sin(ph + i * Math.PI * 0.5 + (i % 2) * Math.PI)) * 0.08 * run; });
  if (u.tail) u.tail.rotation.y = Math.sin(t * (u.kind === 'dog' ? 14 : 4) + u.ph) * 0.4;
}
// humans: the hosts (Rico of Ratita Industries, Martina "Torty" of Tortuga Tech)
export function makeHuman(o) {
  const g = new THREE.Group(), skin = mat(o.skin || '#e0b08a'), suit = mat(o.suit), b = new THREE.Group(); g.add(b);
  part(G.cap(), suit, 0, 1.0, 0, 0.62, 0.7, 0.48, b); part(G.cyl(), mat(o.pants || '#2a2340'), -0.13, 0.35, 0, 0.11, 0.7, 0.11, b); part(G.cyl(), mat(o.pants || '#2a2340'), 0.13, 0.35, 0, 0.11, 0.7, 0.11, b);
  part(G.box(), mat('#1b1b22'), -0.13, 0.03, 0.05, 0.16, 0.08, 0.28, b); part(G.box(), mat('#1b1b22'), 0.13, 0.03, 0.05, 0.16, 0.08, 0.28, b);
  part(G.sph(), skin, 0, 1.78, 0, 0.27, 0.3, 0.27, b); eyes(b, 1.82, 0.22, 0.09, 0.04, false); part(G.box(), mat('#a33a4a'), 0, 1.68, 0.25, 0.1, 0.025, 0.02, b, false);
  part(G.sph(), mat(o.hair), 0, 1.92, -0.04, 0.29, 0.2, 0.29, b); if (o.long) part(G.cap(), mat(o.hair), 0, 1.6, -0.15, 0.5, 0.5, 0.2, b);
  const arms = []; for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(s * 0.34, 1.3, 0); b.add(a); part(G.cap(), suit, 0, -0.3, 0, 0.18, 0.5, 0.18, a); part(G.sph(), skin, 0, -0.62, 0, 0.08, 0.08, 0.08, a); arms.push(a); }
  part(G.box(), mat(o.tie || '#ffd23f'), 0, 1.2, 0.24, 0.1, 0.36, 0.02, b, false);
  if (o.mic) { const m = new THREE.Group(); arms[1].add(m); m.position.set(0, -0.62, 0.08); part(G.cylLo(), mat('#22222a', { metalness: 0.5 }), 0, 0.08, 0, 0.025, 0.22, 0.025, m); part(G.sph(), mat('#999aa6', { metalness: 0.7, roughness: 0.3 }), 0, 0.22, 0, 0.055, 0.055, 0.055, m); arms[1].rotation.x = -1.1; }
  g.userData = { b, arms };
  return g;
}
export function animHuman(h, t, talk) { const u = h.userData; u.b.position.y = Math.sin(t * 3) * 0.015; u.arms[0].rotation.z = 0.15 + Math.sin(t * 2.2) * (talk ? 0.35 : 0.05); u.arms[0].rotation.x = talk ? Math.sin(t * 3.1) * 0.4 - 0.3 : 0; }
