// Remake characters: a real full-size Santa Claus and Mrs. Claus (not elf bodies), reindeer, and small helpers.
// Articulated groups; each limb is ONE merged, vertex-coloured mesh (a handful of draw calls per character).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mtx } from './vworld.js';
const MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 });
const FUR = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
const _c = new THREE.Color();
const S = (s = 14) => new THREE.SphereGeometry(1, s, Math.max(6, s * 0.6 | 0));
const CY = (s = 12, rt = 1) => new THREE.CylinderGeometry(rt, 1, 1, s, 1).translate(0, 0.5, 0);
const CO = (s = 12) => new THREE.ConeGeometry(1, 1, s, 1).translate(0, 0.5, 0);
const TO = (t = 0.3, s = 18) => new THREE.TorusGeometry(1, t, 6, s);
const BX = () => new THREE.BoxGeometry(1, 1, 1);
// build one mesh from [geom, colour, x,y,z, rx,ry,rz, sx,sy,sz]
function part(list, mat = MAT) { const gs = list.map(([g, col, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx]) => { g = g.index ? g.toNonIndexed() : g.clone(); g.applyMatrix4(mtx(x, y, z, rx, ry, rz, sx, sy, sz)); for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal') g.deleteAttribute(n);
    const n = g.attributes.position.count, a = new Float32Array(n * 3); _c.set(col); for (let i = 0; i < n; i++) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; });
  const g = mergeGeometries(gs, false); gs.forEach((q) => q.dispose()); const m = new THREE.Mesh(g, mat); m.castShadow = true; return m; }
const pivot = (x, y, z, mesh) => { const p = new THREE.Group(); p.position.set(x, y, z); if (mesh) p.add(mesh); return p; };
const SKIN = 0xf6c9a8, RED = 0xc8102e, WHITE = 0xf8f8f8, BLACK = 0x1c1c1c, GOLD = 0xf5c542;
// ---------------------------------------------------------------- Santa (about 2 m tall: taller and much rounder than an elf)
export function makeSanta() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const torso = part([[S(18), RED, 0, 1.22, 0, 0, 0, 0, 0.62, 0.62, 0.56], [CY(18), RED, 0, 0.78, 0, 0, 0, 0, 0.6, 0.3, 0.54], [TO(0.35, 22), WHITE, 0, 0.8, 0, PI2, 0, 0, 0.6, 0.6, 0.62],
    [CY(18), BLACK, 0, 1.06, 0, 0, 0, 0, 0.64, 0.14, 0.58], [BX(), GOLD, 0, 1.13, 0.57, 0, 0, 0, 0.22, 0.18, 0.06], [BX(), BLACK, 0, 1.13, 0.6, 0, 0, 0, 0.12, 0.08, 0.02],
    [BX(), WHITE, 0, 1.3, 0.5, -0.25, 0, 0, 0.14, 0.62, 0.08], [S(10), WHITE, 0, 1.68, 0, 0, 0, 0, 0.42, 0.14, 0.4], // collar fur
    [S(8), BLACK, 0, 1.45, 0.58, 0, 0, 0, 0.04], [S(8), BLACK, 0, 1.3, 0.6, 0, 0, 0, 0.04]], FUR);
  body.add(torso);
  const head = pivot(0, 1.86, 0.02, part([[S(18), SKIN, 0, 0, 0, 0, 0, 0, 0.27, 0.29, 0.27], [S(14), WHITE, 0, -0.17, 0.08, 0, 0, 0, 0.3, 0.32, 0.24], [S(10), WHITE, 0, -0.38, 0.14, 0, 0, 0, 0.18, 0.18, 0.13], // beard
    [S(10), WHITE, -0.09, -0.06, 0.24, 0, 0, 0.5, 0.12, 0.05, 0.06], [S(10), WHITE, 0.09, -0.06, 0.24, 0, 0, -0.5, 0.12, 0.05, 0.06], // moustache
    [S(10), 0xe88a8a, 0, 0.0, 0.27, 0, 0, 0, 0.06], [S(8), 0x222222, -0.09, 0.08, 0.235, 0, 0, 0, 0.03], [S(8), 0x222222, 0.09, 0.08, 0.235, 0, 0, 0, 0.03],
    [BX(), WHITE, -0.09, 0.14, 0.235, 0, 0, 0.15, 0.09, 0.025, 0.03], [BX(), WHITE, 0.09, 0.14, 0.235, 0, 0, -0.15, 0.09, 0.025, 0.03], [S(8), 0xf0b0a0, -0.15, 0.0, 0.2, 0, 0, 0, 0.05], [S(8), 0xf0b0a0, 0.15, 0.0, 0.2, 0, 0, 0, 0.05],
    [TO(0.28, 22), 0xd4d4d4, -0.09, 0.08, 0.25, 0, 0, 0, 0.055], [TO(0.28, 22), 0xd4d4d4, 0.09, 0.08, 0.25, 0, 0, 0, 0.055], // little glasses
    [TO(0.45, 22), WHITE, 0, 0.17, 0, PI2, 0, 0, 0.27, 0.27, 0.3], [CO(16), RED, 0, 0.2, -0.02, -0.35, 0, 0, 0.25, 0.42, 0.25], [S(10), WHITE, 0, 0.5, -0.2, 0, 0, 0, 0.08]], FUR));
  body.add(head);
  const arm = (s) => { const p = pivot(s * 0.6, 1.5, 0, part([[CY(10, 0.85), RED, 0, -0.62, 0, 0, 0, 0, 0.13, 0.62, 0.13], [CY(10), WHITE, 0, -0.7, 0, 0, 0, 0, 0.14, 0.1, 0.14], [S(10), WHITE, 0, -0.76, 0, 0, 0, 0, 0.12]], FUR)); p.rotation.z = s * 0.18; body.add(p); return p; };
  const leg = (s) => { const p = pivot(s * 0.22, 0.75, 0, part([[CY(10), RED, 0, -0.55, 0, 0, 0, 0, 0.16, 0.55, 0.16], [CY(10), BLACK, 0, -0.75, 0, 0, 0, 0, 0.17, 0.3, 0.17], [S(10), BLACK, 0, -0.72, 0.08, 0, 0, 0, 0.17, 0.1, 0.25]])); root.add(p); return p; };
  const r = { root, body, head, aL: arm(-1), aR: arm(1), lL: leg(-1), lR: leg(1), t: Math.random() * 5, h: 2.1 }; return r;
}
const PI2 = Math.PI / 2;
// ---------------------------------------------------------------- Mrs. Claus
export function makeMrsClaus() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  body.add(part([[CO(18), RED, 0, 0.05, 0, 0, 0, 0, 0.5, 1.15, 0.5], [CY(18), WHITE, 0, 0.05, 0, 0, 0, 0, 0.5, 0.12, 0.5], [S(14), RED, 0, 1.18, 0, 0, 0, 0, 0.36, 0.34, 0.3],
    [BX(), WHITE, 0, 0.35, 0.22, -0.18, 0, 0, 0.42, 0.75, 0.04], [BX(), 0xfca5a5, 0, 0.62, 0.27, -0.18, 0, 0, 0.18, 0.12, 0.02], // apron + pocket
    [TO(0.4, 20), 0x166534, 0, 1.38, 0, PI2, 0, 0, 0.3, 0.3, 0.4], [S(10), WHITE, 0, 1.43, 0.1, 0, 0, 0, 0.1, 0.06, 0.06]], FUR));
  const head = pivot(0, 1.66, 0, part([[S(16), SKIN, 0, 0, 0, 0, 0, 0, 0.23, 0.25, 0.23], [S(14), 0xe5e5e5, 0, 0.08, -0.03, 0, 0, 0, 0.25, 0.22, 0.25], [S(12), 0xe5e5e5, 0, 0.27, -0.12, 0, 0, 0, 0.13], // grey hair + bun
    [S(8), 0x222222, -0.08, 0.02, 0.205, 0, 0, 0, 0.026], [S(8), 0x222222, 0.08, 0.02, 0.205, 0, 0, 0, 0.026], [TO(0.25, 20), GOLD, -0.08, 0.02, 0.215, 0, 0, 0, 0.055], [TO(0.25, 20), GOLD, 0.08, 0.02, 0.215, 0, 0, 0, 0.055],
    [S(8), 0xef9a9a, -0.13, -0.06, 0.17, 0, 0, 0, 0.045], [S(8), 0xef9a9a, 0.13, -0.06, 0.17, 0, 0, 0, 0.045], [BX(), 0xb4534b, 0, -0.1, 0.215, 0, 0, 0, 0.08, 0.02, 0.02], [S(8), 0xf2b8a0, 0, -0.03, 0.235, 0, 0, 0, 0.035]]));
  body.add(head);
  const arm = (s) => { const p = pivot(s * 0.36, 1.32, 0, part([[CY(10, 0.8), RED, 0, -0.5, 0, 0, 0, 0, 0.09, 0.5, 0.09], [CY(10), WHITE, 0, -0.56, 0, 0, 0, 0, 0.1, 0.07, 0.1], [S(8), SKIN, 0, -0.6, 0, 0, 0, 0, 0.07]], FUR)); p.rotation.z = s * 0.12; body.add(p); return p; };
  return { root, body, head, aL: arm(-1), aR: arm(1), t: Math.random() * 5, h: 1.8, skirt: true };
}
export function animClaus(r, dt, sp, mode) { r.t += dt; const t = r.t, walk = sp > 0.15;
  const sw = walk ? Math.sin(t * 7) * 0.5 : 0; if (r.lL) { r.lL.rotation.x = sw; r.lR.rotation.x = -sw; }
  r.body.position.y = walk ? Math.abs(Math.sin(t * 7)) * 0.04 : Math.sin(t * 1.6) * 0.012; r.body.rotation.z = walk ? Math.sin(t * 7) * 0.03 : 0;
  if (mode === 'wave') { r.aR.rotation.z = 2.5 + Math.sin(t * 8) * 0.3; r.aR.rotation.x = 0; r.aL.rotation.x = 0; }
  else if (mode === 'laugh') { r.aR.rotation.z = 0.5; r.aL.rotation.z = -0.5; r.aR.rotation.x = r.aL.rotation.x = -0.6; r.body.position.y = Math.abs(Math.sin(t * 12)) * 0.05; }
  else { r.aR.rotation.z = (r.skirt ? 0.12 : 0.18); r.aL.rotation.z = -(r.skirt ? 0.12 : 0.18); r.aR.rotation.x = walk ? sw * 0.8 : 0; r.aL.rotation.x = walk ? -sw * 0.8 : 0; }
  r.head.rotation.y = Math.sin(t * 0.7) * 0.25; }
// ---------------------------------------------------------------- reindeer (static-ish; idle head bob)
const RCACHE = {};
export function makeReindeer(o = {}) { const k = (o.rudolph ? 'r' : 'n') + (o.baby ? 'b' : ''); const s = o.baby ? 0.55 : 1, fur = o.fur || 0x8b5a2b;
  const root = new THREE.Group();
  const bodyM = RCACHE[k] || (RCACHE[k] = part([[S(14), fur, 0, 1.15, 0, 0, 0, 0, 0.42, 0.42, 0.8], [S(10), 0xf3e7d3, 0, 1.0, 0.05, 0, 0, 0, 0.3, 0.25, 0.6], [S(8), 0xf3e7d3, 0, 1.3, -0.78, 0, 0, 0, 0.12],
    ...[[-0.22, 0.45], [0.22, 0.45], [-0.22, -0.45], [0.22, -0.45]].flatMap(([x, z]) => [[CY(8), fur, x, 0, z, 0, 0, 0, 0.07, 0.95, 0.07], [CY(8), 0x3b2a1a, x, 0, z, 0, 0, 0, 0.08, 0.12, 0.08]]),
    [CY(10, 0.7), fur, 0, 1.25, 0.62, 0.7, 0, 0, 0.17, 0.6, 0.17]]));
  const head = part([[S(12), fur, 0, 0, 0, 0, 0, 0, 0.2, 0.2, 0.26], [S(10), fur, 0, -0.06, 0.24, 0, 0, 0, 0.13, 0.12, 0.16], [S(10), o.rudolph ? 0xff2020 : 0x2b1a12, 0, -0.04, 0.4, 0, 0, 0, 0.065], [S(8), 0x111111, -0.12, 0.07, 0.12, 0, 0, 0, 0.035], [S(8), 0x111111, 0.12, 0.07, 0.12, 0, 0, 0, 0.035],
    [S(8), fur, -0.2, 0.14, -0.05, 0, 0, 0.7, 0.1, 0.04, 0.05], [S(8), fur, 0.2, 0.14, -0.05, 0, 0, -0.7, 0.1, 0.04, 0.05],
    ...(o.baby ? [] : [-1, 1].flatMap((sd) => [[CY(6), 0xd9c3a0, sd * 0.1, 0.15, -0.05, 0, 0, -sd * 0.5, 0.025, 0.45, 0.025], [CY(6), 0xd9c3a0, sd * 0.28, 0.48, -0.05, 0, 0, -sd * 1.1, 0.02, 0.22, 0.02], [CY(6), 0xd9c3a0, sd * 0.2, 0.42, 0.06, 0.6, 0, -sd * 0.2, 0.02, 0.2, 0.02], [CY(6), 0xd9c3a0, sd * 0.13, 0.33, -0.12, -0.7, 0, -sd * 0.2, 0.02, 0.18, 0.02]]))]);
  const b = bodyM.clone(); root.add(b); const hp = pivot(0, 1.72, 0.95, head); root.add(hp); root.scale.setScalar(s);
  if (o.rudolph) { /* glow */ }
  return { root, head: hp, t: Math.random() * 6 }; }
export function animDeer(r, dt) { r.t += dt; r.head.rotation.x = 0.25 + Math.max(0, Math.sin(r.t * 0.5)) * 0.6; r.head.rotation.y = Math.sin(r.t * 0.3) * 0.3; }
// ---------------------------------------------------------------- a sleigh bus (Sid's bright red bus-sleigh) for the fast-travel stops
export function makeSleighBus() { const g = new THREE.Group();
  g.add(part([[BX(), 0xc8102e, 0, 1.1, 0, 0, 0, 0, 2.2, 1.4, 4.2], [BX(), 0x7f1d1d, 0, 1.85, 0, 0, 0, 0, 2.3, 0.2, 4.3], [BX(), 0xbfe3ff, -1.12, 1.25, 0, 0, 0, 0, 0.04, 0.6, 3.4], [BX(), 0xbfe3ff, 1.12, 1.25, 0, 0, 0, 0, 0.04, 0.6, 3.4],
    [BX(), GOLD, 0, 0.42, 0, 0, 0, 0, 2.3, 0.12, 4.3], [BX(), WHITE, 0, 2.0, 0, 0, 0, 0, 2.0, 0.15, 3.9], ...[-1, 1].flatMap((s) => [[BX(), GOLD, s * 0.9, 0.12, 0, 0, 0, 0, 0.12, 0.12, 4.6], [TO(0.25, 14), GOLD, s * 0.9, 0.4, 2.3, 0, PI2, 0, 0.3, 0.3, 0.6]]),
    [BX(), 0xffe08a, 0, 1.3, 2.11, 0, 0, 0, 1.6, 0.5, 0.04]]));
  return g; }
