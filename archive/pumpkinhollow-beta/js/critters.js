// Grok Pumpkin Hollow critters: desert tortoises & turtles (Torty's family + townsfolk), roadrunners and lizards.
// Smooth merged primitives (lathes, spheres, capsules, tori), rigged for simple animation. No textures, no billboards.
import * as THREE from 'three';
import { P } from './geo.js?v=ph11';
import { lathe, torus, cone, cyl, rcyl, heart, star } from './shapes.js?v=ph11';
import { MB, toGroup } from './models.js?v=ph11';
const PI = Math.PI;
function eyes(b, y, z, sep, r, o = {}) { [-1, 1].forEach((sd) => { const x = sd * sep;
  if (o.sleepy) { b.g.add(torus(0.28, 16, PI), 0x2a1d1d, x, y - r * 0.1, z + r * 0.45, 0, 0, PI, r * 0.75, r * 0.5, r * 0.6); return; }
  b.g.add(P.sphere, 0xffffff, x, y, z, 0, 0, 0, r, r * 1.12, r * 0.7); b.g.add(P.sphere, o.iris || 0x3b2410, x, y - r * 0.05, z + r * 0.42, 0, 0, 0, r * 0.62, r * 0.7, r * 0.38);
  b.l.add(P.sphere, 0xffffff, x + r * 0.2, y + r * 0.3, z + r * 0.7, 0, 0, 0, r * 0.2, r * 0.2, r * 0.12, 0.3);
  if (o.brow) b.f.add(P.capsule, o.brow, x, y + r * 1.25, z + r * 0.15, 0, 0, sd * -0.25 + PI / 2, r * 0.45, r * 1.1, r * 0.45); }); }
export const SHELLS = { torty: [0x6e4524, 0xb98545, 0xd1a05e], sand: [0x7a5a30, 0xc9a25e, 0xe6c47e], olive: [0x3f4a24, 0x7c8a3e, 0xa3b25a], rose: [0x7a3f3a, 0xc97a6e, 0xe9a598], moss: [0x2f5a3a, 0x4f8f5a, 0x7cc48a],
  sky: [0x2c4a6e, 0x5b8fc4, 0x8fc2ea], plum: [0x4a2c5e, 0x8a5bb0, 0xb894d8], gold: [0x7a5a10, 0xd4a017, 0xffd23f], grey: [0x55534e, 0x8e8a80, 0xb9b4a8], coral: [0x7a3a20, 0xe2733f, 0xffa36a] };
// o: { shell, skin, belly, flat, hat, hatC, glasses, neck, neckC, flower, cane, brow, iris, num, numC, bow, sleepy, apron, blush, pack }
export function makeTortoise(o = {}) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const b = MB(); const [groove, sc, scL] = o.shell ? (typeof o.shell === 'string' ? SHELLS[o.shell] : o.shell) : SHELLS.torty; const skin = o.skin || 0xb8a27c, skinD = new THREE.Color(skin).multiplyScalar(0.84).getHex(), belly = o.belly || 0xe2c992;
  const A = 2.3, B = 1.85 * (o.flat || 1), Cz = 2.65, Y0 = 0.55, prof = [[0, 0]]; for (let k = 0; k <= 16; k++) { const th = PI / 2 - k / 16 * PI / 2; prof.push([Math.max(0.0001, A * Math.sin(th)), B * Math.cos(th)]); } prof[prof.length - 1][0] = 0;
  b.g.add(lathe(prof, 48, 'tortDome' + (o.flat || 1)), groove, 0, Y0, 0, 0, 0, 0, 1, 1, Cz / A);
  const _n = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), up = new THREE.Vector3(0, 1, 0);
  const scute = (th, ph, r, col) => { const sx = A * Math.sin(th) * Math.cos(ph), sy = B * Math.cos(th), sz = Cz * Math.sin(th) * Math.sin(ph);
    _n.set(sx / (A * A), sy / (B * B), sz / (Cz * Cz)).normalize(); _q.setFromUnitVectors(up, _n); _e.setFromQuaternion(_q, 'XYZ');
    b.g.add(P.sphereLo, col, sx + _n.x * 0.02, Y0 + sy + _n.y * 0.02, sz + _n.z * 0.02, _e.x, _e.y, _e.z, r, 0.13, r * 1.05); return [sx + _n.x * 0.16, Y0 + sy + _n.y * 0.16, sz + _n.z * 0.16, _e]; };
  const top = scute(0, 0, 0.78, scL); for (let i = 0; i < 6; i++) scute(0.66, i / 6 * PI * 2 + PI / 6, 0.74, i % 2 ? sc : scL); for (let i = 0; i < 12; i++) scute(1.17, i / 12 * PI * 2, 0.58, i % 2 ? scL : sc);
  for (let i = 0; i < 18; i++) { const a = i / 18 * PI * 2; b.g.add(P.sphereLo, i % 2 ? sc : groove, Math.cos(a) * A * 0.99, Y0 + 0.08, Math.sin(a) * Cz * 0.99, 0, -a, 0, 0.42, 0.14, 0.3); }
  b.m.add(P.sphere, belly, 0, Y0 - 0.02, 0, 0, 0, 0, A * 0.97, 0.16, Cz * 0.97); b.f.add(P.sphere, skin, 0, Y0 - 0.12, 0, 0, 0, 0, A * 0.85, 0.42, Cz * 0.85);
  b.f.add(P.capsule, skin, 0, 0.42, -Cz - 0.05, -PI / 2 - 0.5, 0, 0, 0.22, 0.45, 0.22);
  // racing number disc on the shell top / backpack / mail satchel
  if (o.num != null) { b.g.add(rcyl(0.62, 0.08, 0.03, 32), 0xffffff, top[0], top[1] - 0.02, top[2]); b.g.add(torus(0.12, 32), o.numC || 0xef4444, top[0], top[1] + 0.06, top[2], PI / 2, 0, 0, 0.56, 0.56, 0.4); for (let k = 0; k < (o.num | 0); k++) b.g.add(P.sphere, o.numC || 0xef4444, top[0] + (k - (o.num - 1) / 2) * 0.28, top[1] + 0.1, top[2], 0, 0, 0, 0.11, 0.05, 0.11); }
  if (o.pack) { b.f.add(P.rbox, o.pack, 0, Y0 + B * 0.95, -0.5, 0.25, 0, 0, 1.3, 0.6, 1.0); b.x.add(P.torus, 0xd4a017, 0, Y0 + B * 1.05, 0.0, 0.3, 0, 0, 0.18, 0.18, 0.18); }
  if (o.saddleFlowers) for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; b.g.add(P.sphere, [0xff6fcf, 0xffd23f, 0xffffff][i % 3], Math.cos(a) * 0.5, Y0 + B + 0.1, Math.sin(a) * 0.5, 0, 0, 0, 0.18, 0.1, 0.18); }
  body.add(toGroup(b));
  const head = new THREE.Group(); head.position.set(0, 0.62, 2.55); body.add(head);
  { const h = MB(); h.f.add(P.capsule, skin, 0, 0.05, 0.05, PI / 2 - 0.35, 0, 0, 0.55, 0.8, 0.55); h.f.add(P.sphere, skin, 0, 0.42, 0.72, 0, 0, 0, 0.62, 0.55, 0.7); h.f.add(P.sphere, skinD, 0, 0.3, 1.25, 0, 0, 0, 0.32, 0.22, 0.2);
    h.g.add(torus(0.18, 16, PI), 0x4a3a24, 0, 0.24, 1.3, 0, 0, PI, 0.18, 0.12, 0.1);
    eyes(h, 0.62, 1.1, 0.3, 0.16, { iris: o.iris, brow: o.brow, sleepy: o.sleepy });
    if (o.blush !== false) [-1, 1].forEach((s) => h.g.add(P.sphere, 0xff9fbf, s * 0.42, 0.38, 1.18, 0, 0, 0, 0.11, 0.07, 0.05));
    if (o.flower) { const fc = o.flower === true ? 0xff6fcf : o.flower; for (let i = 0; i < 5; i++) h.g.add(P.sphere, fc, 0.5 + Math.cos(i * 1.26) * 0.12, 0.92 + Math.sin(i * 1.26) * 0.12, 0.55, 0, 0, 0, 0.09, 0.09, 0.05); h.g.add(P.sphere, 0xffd23f, 0.5, 0.92, 0.6, 0, 0, 0, 0.06); }
    if (o.glasses) { const gc = o.glasses === true ? 0x2b2b30 : o.glasses; [-1, 1].forEach((s) => { h.x.add(P.torus, gc, s * 0.3, 0.62, 1.27, 0, 0, 0, 0.19, 0.19, 0.16); h.e.add(P.cyl, 0xdff6ff, s * 0.3, 0.62, 1.26, PI / 2, 0, 0, 0.17, 0.02, 0.17); }); h.x.add(P.cyl, gc, 0, 0.64, 1.3, 0, 0, PI / 2, 0.025, 0.2, 0.025); }
    if (o.brow === 0xffffff || o.beard) h.f.add(P.sphere, 0xf5f5f0, 0, 0.12, 1.2, 0.3, 0, 0, 0.3, 0.22, 0.2);
    const hc = o.hatC; const HY = 0.94, HZ = 0.66;
    if (o.hat === 'straw' || o.hat === 'sombrero') { const big = o.hat === 'sombrero' ? 1.35 : 1; h.m.add(rcyl(0.95 * big, 0.06, 0.03, 32), hc || 0xf2cf7a, 0, HY - 0.05, HZ); h.m.add(lathe([[0.42, 0], [0.4, 0.22], [0.3, 0.4], [0, 0.44]], 24, 'strawCrown'), hc || 0xf2cf7a, 0, HY, HZ); h.f.add(rcyl(0.43, 0.09, 0.03, 24), o.bandC || 0xef4444, 0, HY + 0.02, HZ); }
    else if (o.hat === 'top') { h.f.add(rcyl(0.7, 0.05, 0.02, 32), hc || 0x1f2937, 0, HY - 0.04, HZ); h.f.add(rcyl(0.4, 0.75, 0.04, 28), hc || 0x1f2937, 0, HY, HZ); h.g.add(rcyl(0.41, 0.12, 0.02, 28), 0xdc2626, 0, HY + 0.08, HZ); }
    else if (o.hat === 'chef') { h.f.add(rcyl(0.36, 0.3, 0.05, 24), 0xffffff, 0, HY - 0.05, HZ); h.f.add(P.sphere, 0xffffff, 0, HY + 0.4, HZ, 0, 0, 0, 0.48, 0.28, 0.48); }
    else if (o.hat === 'cap') { h.f.add(P.sphere, hc || 0x2563eb, 0, HY, HZ, 0, 0, 0, 0.45, 0.28, 0.45); h.f.add(P.rbox, hc || 0x2563eb, 0, HY, HZ + 0.45, 0.1, 0, 0, 0.6, 0.06, 0.4); h.g.add(P.sphere, 0xffffff, 0, HY + 0.27, HZ, 0, 0, 0, 0.07); }
    else if (o.hat === 'beret') h.f.add(P.sphere, hc || 0xdc2626, 0.08, HY + 0.02, HZ, 0, 0, 0.2, 0.5, 0.14, 0.5);
    else if (o.hat === 'crown') { h.x.add(rcyl(0.32, 0.2, 0.02, 24), 0xffc83d, 0, HY - 0.02, HZ); for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; h.x.add(P.cone, 0xffc83d, Math.cos(a) * 0.28, HY + 0.27, HZ + Math.sin(a) * 0.28, 0, 0, 0, 0.08, 0.16, 0.08); } }
    else if (o.hat === 'visor') { h.f.add(P.torus, hc || 0x22d3ee, 0, HY - 0.08, HZ, PI / 2, 0, 0, 0.42, 0.42, 0.3); h.g.add(P.rbox, hc || 0x22d3ee, 0, HY - 0.06, HZ + 0.5, 0.25, 0, 0, 0.6, 0.05, 0.4); }
    else if (o.hat === 'helmet') { h.g.add(P.sphere, hc || 0xef4444, 0, HY - 0.05, HZ, 0, 0, 0, 0.55, 0.4, 0.6); h.g.add(P.rbox, 0xffffff, 0, HY + 0.2, HZ, 0, 0, 0, 0.12, 0.2, 1.1); }
    else if (o.hat === 'bandana') h.f.add(P.sphere, hc || 0xef4444, 0, HY - 0.08, HZ, 0, 0, 0, 0.5, 0.22, 0.55);
    else if (o.hat === 'flowercrown') for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2; h.g.add(P.sphere, [0xff6fcf, 0xffd23f, 0xffffff, 0xa78bfa][i % 4], Math.cos(a) * 0.38, HY - 0.06, HZ + Math.sin(a) * 0.38, 0, 0, 0, 0.11); }
    else if (o.hat === 'night') { h.f.add(P.cone, hc || 0x60a5fa, 0, HY + 0.32, HZ - 0.1, -0.5, 0, 0, 0.36, 0.7, 0.36); h.f.add(P.sphere, 0xffffff, 0, HY + 0.62, HZ - 0.45, 0, 0, 0, 0.12); }
    else if (o.hat === 'grad') { h.f.add(P.rbox, 0x1f2937, 0, HY + 0.12, HZ, 0, 0.3, 0, 0.85, 0.06, 0.85); h.f.add(rcyl(0.34, 0.14, 0.02, 20), 0x1f2937, 0, HY - 0.02, HZ); h.g.add(P.sphere, 0xffd23f, 0.35, HY + 0.02, HZ + 0.3, 0, 0, 0, 0.06); }
    if (o.bow) { h.f.add(P.sphere, o.bow, -0.22, HY - 0.02, HZ - 0.05, 0, 0, 0.6, 0.2, 0.12, 0.08); h.f.add(P.sphere, o.bow, -0.48, HY + 0.06, HZ - 0.05, 0, 0, -0.6, 0.2, 0.12, 0.08); h.g.add(P.sphere, o.bow, -0.35, HY + 0.02, HZ - 0.03, 0, 0, 0, 0.08); }
    head.add(toGroup(h)); }
  // neckwear rides on the body just in front of the shell
  { const n = MB(); const nc = o.neckC || 0xef4444;
    if (o.neck === 'scarf') { n.f.add(P.torus, nc, 0, 0.7, 2.35, 0.25, 0, 0, 0.5, 0.5, 0.75); n.f.add(P.capsule, nc, 0.35, 0.35, 2.55, 0.3, 0, 0.3, 0.2, 0.45, 0.1); }
    else if (o.neck === 'bowtie') { n.g.add(P.sphere, nc, -0.2, 0.55, 2.65, 0, 0, PI / 2, 0.14, 0.2, 0.08); n.g.add(P.sphere, nc, 0.2, 0.55, 2.65, 0, 0, PI / 2, 0.14, 0.2, 0.08); n.g.add(P.sphere, nc, 0, 0.55, 2.68, 0, 0, 0, 0.08); }
    else if (o.neck === 'sash') { n.f.add(P.torus, nc, 0, 1.2, 0.4, 0.2, 0, 0.9, 2.4, 2.4, 1.0); n.x.add(star(), 0xffd23f, 1.0, 1.9, 1.95, -0.6, 0.4, 0, 0.18, 0.18, 0.08); }
    else if (o.neck === 'apron') { n.f.add(P.sphere, nc, 0, 0.45, 2.45, -0.15, 0, 0, 0.75, 0.42, 0.12); n.f.add(P.torus, nc, 0, 0.72, 2.3, 0.25, 0, 0, 0.45, 0.45, 0.4); }
    else if (o.neck === 'bell') { n.f.add(P.torus, nc, 0, 0.7, 2.35, 0.25, 0, 0, 0.5, 0.5, 0.4); n.x.add(P.sphere, 0xffd23f, 0, 0.32, 2.75, 0, 0, 0, 0.14); }
    else if (o.neck === 'medal') { n.f.add(P.torus, nc, 0, 0.7, 2.35, 0.25, 0, 0, 0.5, 0.5, 0.4); n.x.add(rcyl(0.18, 0.05, 0.02, 20), 0xffd23f, 0, 0.3, 2.75, PI / 2 - 0.2, 0, 0); }
    if (o.cane) { n.m.add(P.cyl, 0x7c4a1e, 1.75, 1.0, 2.0, 0.12, 0, -0.12, 0.07, 1.9, 0.07); n.m.add(torus(0.3, 16, PI), 0x7c4a1e, 1.95, 1.98, 2.06, 0, PI / 2, 0, 0.22, 0.22, 0.22); }
    if (o.mailbag) { n.f.add(P.rbox, 0x2563eb, 2.1, 1.0, 0.2, 0, 0, 0.1, 0.4, 0.9, 1.2); n.f.add(P.torus, 0x2563eb, 0, 1.6, 0.2, 0, 0, 0.6, 2.3, 2.3, 0.7); }
    if (n.f.parts.length || n.g.parts.length || n.m.parts.length || n.x.parts.length) body.add(toGroup(n)); }
  const legs = []; const lb = MB(); lb.f.add(P.capsule, skin, 0, -0.2, 0, 0, 0, 0, 0.62, 0.55, 0.62); lb.f.add(P.sphere, skinD, 0, -0.62, 0.05, 0, 0, 0, 0.42, 0.14, 0.46);
  for (let i = -1; i <= 1; i++) lb.g.add(P.sphere, 0xf5f0e0, i * 0.17, -0.6, 0.4, 0, 0, 0, 0.08, 0.06, 0.09); const lg = toGroup(lb);
  [[-1.55, 1.55], [1.55, 1.55], [-1.55, -1.55], [1.55, -1.55]].forEach(([x, z]) => { const p = new THREE.Group(); p.position.set(x, 0.68, z); p.add(lg.clone()); body.add(p); legs.push(p); });
  root.scale.setScalar(0.9); return { root, body, head, legs, t: Math.random() * 10, kind: 'tort' };
}
// mode: idle | chat | work | sleep | cheer | soak
export function animTortoise(r, dt, speed, mode) { r.t += dt; const t = r.t, run = Math.min(1, speed / 1.2);
  r.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 4 + (i === 0 || i === 3 ? 0 : PI)) * 0.4 * run; });
  r.body.position.y = Math.abs(Math.sin(t * 4)) * 0.04 * run + (mode === 'cheer' ? Math.abs(Math.sin(t * 6)) * 0.25 : 0) - (mode === 'soak' ? 0.5 : 0);
  if (mode === 'sleep') { r.head.position.z = 2.2; r.head.rotation.x = 0.35; r.head.rotation.y = 0; return; }
  r.head.rotation.x = mode === 'work' ? 0.3 + Math.sin(t * 5) * 0.08 : mode === 'chat' ? Math.sin(t * 6) * 0.06 : 0;
  r.head.rotation.y = Math.sin(t * 0.6) * 0.25; r.head.position.z = 2.55 + Math.sin(t * 1.3) * 0.08; }
// ---------------------------------------------------------------- roadrunner (the town's speedy mail carrier)
export function makeRoadrunner(o = {}) { const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const b = MB();
  const br = 0x8b5e3c, lt = 0xe9d5b5, dk = 0x4a3020;
  b.f.add(P.sphere, br, 0, 1.0, 0, -0.35, 0, 0, 0.32, 0.3, 0.5); b.f.add(P.sphere, lt, 0, 0.94, 0.12, -0.35, 0, 0, 0.26, 0.24, 0.36);
  for (let i = 0; i < 10; i++) b.f.add(P.sphere, i % 2 ? dk : lt, Math.sin(i * 2.3) * 0.22, 1.05 + Math.cos(i * 1.7) * 0.12, -0.05 + Math.sin(i) * 0.25, 0, 0, 0, 0.06, 0.04, 0.09);
  for (let i = 0; i < 3; i++) b.f.add(P.capsule, i === 1 ? dk : br, (i - 1) * 0.08, 1.2, -0.75, 1.0, (i - 1) * 0.15, 0, 0.12, 0.65, 0.05);
  [-1, 1].forEach((s) => b.f.add(P.capsule, dk, s * 0.28, 1.05, -0.08, 0.2, 0, s * 0.15, 0.08, 0.5, 0.25));
  if (o.bag) { b.f.add(P.rbox, 0x2563eb, 0.32, 0.9, 0.05, 0, 0, 0.05, 0.12, 0.3, 0.36); b.f.add(P.torus, 0x2563eb, 0.05, 1.12, 0.05, 0, 0, 0.7, 0.32, 0.32, 0.12); b.g.add(P.rbox, 0xffffff, 0.39, 0.95, 0.05, 0, 0, 0.05, 0.02, 0.12, 0.2); }
  body.add(toGroup(b));
  const head = new THREE.Group(); head.position.set(0, 1.32, 0.35); body.add(head);
  { const h = MB(); h.f.add(P.capsule, br, 0, -0.08, -0.05, -0.4, 0, 0, 0.16, 0.3, 0.16); h.f.add(P.sphere, br, 0, 0.12, 0.05, 0, 0, 0, 0.17, 0.16, 0.2);
    for (let i = 0; i < 4; i++) h.f.add(P.cone, i % 2 ? 0x2a4a7a : dk, 0, 0.3 + i * 0.03, -0.08 - i * 0.07, -0.9 - i * 0.12, 0, 0, 0.05, 0.28, 0.05);
    h.g.add(P.cone, 0x3a3a3a, 0, 0.1, 0.38, PI / 2, 0, 0, 0.06, 0.42, 0.05);
    [-1, 1].forEach((s) => { h.g.add(P.sphere, 0x60a5fa, s * 0.13, 0.15, 0.1, 0, 0, 0, 0.05, 0.05, 0.06); h.g.add(P.sphere, 0xffffff, s * 0.12, 0.17, 0.14, 0, 0, 0, 0.055); h.g.add(P.sphere, 0x111111, s * 0.13, 0.17, 0.18, 0, 0, 0, 0.03); h.g.add(P.sphere, 0xff8a3d, s * 0.14, 0.12, 0.06, 0, 0, 0, 0.04, 0.03, 0.06); });
    if (o.cap) { h.f.add(P.sphere, 0x2563eb, 0, 0.27, 0.04, 0, 0, 0, 0.16, 0.08, 0.17); h.f.add(P.rbox, 0x2563eb, 0, 0.25, 0.2, 0.15, 0, 0, 0.2, 0.02, 0.14); }
    head.add(toGroup(h)); }
  const legs = []; [-1, 1].forEach((s) => { const g = new THREE.Group(); g.position.set(s * 0.12, 0.78, 0); const l = MB(); l.g.add(P.cyl, 0x6b8fb3, 0, -0.38, 0, 0, 0, 0, 0.03, 0.76, 0.03); [-0.4, 0, 0.4].forEach((a) => l.g.add(P.capsule, 0x6b8fb3, Math.sin(a) * 0.08, -0.76, Math.cos(a) * 0.08, PI / 2, a, 0, 0.03, 0.12, 0.03)); g.add(toGroup(l)); body.add(g); legs.push(g); });
  return { root, body, head, legs, t: Math.random() * 10, kind: 'bird' }; }
export function animRoadrunner(r, dt, speed) { r.t += dt; const t = r.t, k = Math.min(1, speed / 3), f = 8 + k * 14; r.legs.forEach((l, i) => l.rotation.x = Math.sin(t * f + i * PI) * 0.9 * k);
  r.body.position.y = Math.abs(Math.sin(t * f)) * 0.06 * k; r.body.rotation.x = k * 0.35; r.head.rotation.x = Math.sin(t * (k ? f : 2.5)) * (k ? 0.1 : 0.15); r.head.rotation.y = k ? 0 : Math.sin(t * 0.8) * 0.5; }
// ---------------------------------------------------------------- lizards / geckos
export function makeLizard(o = {}) { const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const b = MB(); const c = o.col || 0x4ade80, sp = o.spots || 0xfacc15, bel = o.belly || 0xfef3c7;
  b.f.add(P.capsule, c, 0, 0.18, 0, PI / 2, 0, 0, 0.32, 0.6, 0.26); b.f.add(P.sphere, bel, 0, 0.12, 0, 0, 0, 0, 0.15, 0.08, 0.38);
  for (let i = 0; i < 7; i++) b.g.add(P.sphere, sp, Math.sin(i * 2.1) * 0.08, 0.3, -0.3 + i * 0.1, 0, 0, 0, 0.045, 0.02, 0.05);
  const tp = []; for (let i = 0; i <= 8; i++) tp.push(new THREE.Vector3(Math.sin(i * 0.6) * 0.08 * i / 8, 0.16 - i * 0.012, -0.42 - i * 0.1)); const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tp), 20, 0.07, 10, false);
  { const p = tg.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i), k = 1 - Math.min(1, (-0.42 - z) / 0.85) * 0.85; const cx = Math.sin(((-0.42 - z) / 0.1) * 0.6) * 0.08 * ((-0.42 - z) / 0.8); p.setX(i, cx + (p.getX(i) - cx) * k); p.setY(i, 0.16 + (p.getY(i) - 0.16) * k); } tg.computeVertexNormals(); }
  b.f.add(tg, c, 0, 0, 0);
  if (o.frill) for (let i = 0; i < 5; i++) b.g.add(P.cone, o.frill, 0, 0.32, -0.2 + i * 0.1, 0, 0, 0, 0.03, 0.1, 0.03);
  body.add(toGroup(b));
  const head = new THREE.Group(); head.position.set(0, 0.22, 0.38); body.add(head);
  { const h = MB(); h.f.add(P.sphere, c, 0, 0.02, 0.08, 0, 0, 0, 0.17, 0.12, 0.2); h.f.add(P.sphere, c, 0, -0.01, 0.2, 0, 0, 0, 0.12, 0.08, 0.1);
    [-1, 1].forEach((s) => { h.g.add(P.sphere, 0xffffff, s * 0.11, 0.1, 0.1, 0, 0, 0, 0.07); h.g.add(P.sphere, 0x111111, s * 0.13, 0.11, 0.14, 0, 0, 0, 0.04); h.l.add(P.sphere, 0xffffff, s * 0.13, 0.13, 0.17, 0, 0, 0, 0.012, 0.012, 0.01, 0.3); });
    h.g.add(torus(0.2, 12, PI), 0x14532d, 0, -0.01, 0.27, 0.3, 0, PI, 0.06, 0.03, 0.03);
    if (o.hat === 'cowboy') { h.m.add(rcyl(0.24, 0.02, 0.01, 24), 0xa0522d, 0, 0.15, 0.08); h.m.add(lathe([[0.11, 0], [0.11, 0.1], [0, 0.12]], 20, 'lzHat'), 0xa0522d, 0, 0.15, 0.08); }
    if (o.hat === 'beret') h.f.add(P.sphere, 0x7c3aed, 0.02, 0.13, 0.06, 0, 0, 0.2, 0.15, 0.04, 0.15);
    if (o.glasses) [-1, 1].forEach((s) => h.x.add(P.torus, 0xffd23f, s * 0.11, 0.1, 0.16, 0, 0, 0, 0.065, 0.065, 0.05));
    head.add(toGroup(h)); }
  const legs = []; [[-1, 0.25], [1, 0.25], [-1, -0.25], [1, -0.25]].forEach(([s, z]) => { const g = new THREE.Group(); g.position.set(s * 0.18, 0.15, z); const l = MB(); l.f.add(P.capsule, c, s * 0.08, -0.04, 0, 0, 0, s * 1.1, 0.07, 0.2, 0.07); [-0.5, 0, 0.5].forEach((a) => l.f.add(P.sphere, c, s * 0.18 + Math.sin(a) * 0.04, -0.12, Math.cos(a) * 0.05, 0, 0, 0, 0.03)); g.add(toGroup(l)); body.add(g); legs.push(g); });
  return { root, body, head, legs, t: Math.random() * 10, kind: 'lizard' }; }
export function animLizard(r, dt, speed) { r.t += dt; const t = r.t, k = Math.min(1, speed / 2); r.legs.forEach((l, i) => l.rotation.y = Math.sin(t * 14 + (i === 0 || i === 3 ? 0 : PI)) * 0.5 * k);
  r.body.rotation.y = Math.sin(t * 14) * 0.08 * k; r.body.position.y = k ? 0 : Math.max(0, Math.sin(t * 2.2)) ** 6 * 0.08; r.head.rotation.y = Math.sin(t * 0.7) * 0.3; }
// ---------------------------------------------------------------- the Moon Lantern (glowing, faceted, warm)
export function makeSunstone() { const g = new THREE.Group(); const b = MB();
  b.l.add(new THREE.OctahedronGeometry(1, 1), 0xffb020, 0, 0, 0, 0, 0, 0, 0.32, 0.46, 0.32, 0.9); b.e.add(P.sphere, 0xffe9a0, 0, 0, 0, 0, 0, 0, 0.42, 0.55, 0.42);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; b.l.add(P.cone, 0xffd23f, Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5, 0, -a, -PI / 2, 0.06, 0.22, 0.06, 0.6); }
  g.add(toGroup(b, false)); return g; }
