// Creatures (cartoony, never scary), Martina "Torty" the tortoise, Professor Vintage's machines, relics, pickups, trap parts.
import * as THREE from 'three';
import { Builder, P } from './geo.js';
import { MATS } from './mats.js';
import { rcyl, lathe, cyl, cone, torus, capsule, tube, leaf, star, heart, gear, blobGeo } from './shapes.js';
import { MB, toGroup, eyes, PI, vintageParts } from './models.js';
// ---------------------------------------------------------------- animals
export const ANIMAL = {
  monkey: { n: 'Cheeky Monkey', hp: 1, sp: 3.6, aggro: 9, r: 0.55, d: 'Throws bananas. Crack your whip and it runs off giggling.' },
  snake: { n: 'Sneaky Snake', hp: 1, sp: 2.2, aggro: 6, r: 0.6, d: 'Slithers in the grass. Whip it and it ties itself in a knot.' },
  bat: { n: 'Fluttery Bat', hp: 1, sp: 3.0, aggro: 8, r: 0.5, fly: true, torch: true, d: 'Hates bright light. Hold your torch up and it flaps away.' },
  scorpion: { n: 'Sandy Scorpion', hp: 1, sp: 2.6, aggro: 7, r: 0.6, d: 'Clicks its claws. Totally just wants a hug. Don\u2019t hug it.' },
  rat: { n: 'Subway Rat', hp: 1, sp: 3.8, aggro: 8, r: 0.45, d: 'Wants your sandwich. Whip makes it zoom away.' },
  spider: { n: 'Fuzzy Spider', hp: 1, sp: 2.4, aggro: 7, r: 0.65, torch: true, d: 'Eight legs, eight tiny boots. Scared of torches.' },
  croc: { n: 'River Croc', hp: 99, sp: 0, aggro: 0, r: 1.2, d: 'Lives in the river. Swing over it, don\u2019t swim with it!' },
};
export function makeAnimal(type) { const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const b = MB(); const parts = {};
  if (type === 'monkey') { const fur = 0x8b5a2b, face = 0xf2c9a0;
    b.f.add(P.sphere, fur, 0, 0.5, 0, 0, 0, 0, 0.32, 0.36, 0.28); b.f.add(P.sphere, face, 0, 0.48, 0.18, 0, 0, 0, 0.2, 0.24, 0.12);
    b.f.add(P.sphere, fur, 0, 0.98, 0, 0, 0, 0, 0.27, 0.25, 0.25); b.g.add(P.sphere, face, 0, 0.94, 0.15, 0, 0, 0, 0.2, 0.16, 0.13);
    [-1, 1].forEach((s) => { b.f.add(P.sphere, fur, s * 0.27, 1.0, 0, 0, 0, 0, 0.1, 0.11, 0.05); b.g.add(P.sphere, face, s * 0.28, 1.0, 0.02, 0, 0, 0, 0.065, 0.07, 0.03);
      b.f.add(P.capsule, fur, s * 0.12, 0.15, 0.02, 0, 0, 0, 0.13, 0.25, 0.13); b.g.add(P.sphere, face, s * 0.12, 0.03, 0.08, 0, 0, 0, 0.08, 0.04, 0.11); });
    eyes(b, 1.02, 0.2, 0.08, 0.06, { iris: 0x3b2314 }); b.g.add(torus(0.22, 16, PI), 0x6b2e1e, 0, 0.88, 0.27, PI, 0, 0, 0.06, 0.05, 0.05);
    b.f.add(tube([[0, 0.35, -0.25], [0, 0.4, -0.6], [0, 0.85, -0.7], [0, 1.0, -0.5]], 0.04, 24, 8), fur, 0, 0, 0);
    const arm = (s) => { const g = new THREE.Group(); g.position.set(s * 0.3, 0.7, 0); const m = MB(); m.f.add(P.capsule, fur, 0, -0.2, 0, 0, 0, 0, 0.11, 0.3, 0.11); m.g.add(P.sphere, face, 0, -0.42, 0, 0, 0, 0, 0.07); g.add(toGroup(m)); body.add(g); return g; };
    parts.aL = arm(-1); parts.aR = arm(1);
    const ban = (() => { const m = MB(); m.g.add(torus(0.35, 20, PI * 0.8), 0xfde047, 0, 0, 0, 0, 0, 0, 0.14, 0.14, 0.14); return toGroup(m); })(); ban.position.set(0, -0.45, 0.05); parts.aR.add(ban); parts.banana = ban; }
  else if (type === 'snake') { const g1 = 0x22c55e, g2 = 0xfde047; const segs = []; for (let i = 0; i < 9; i++) { const s = new THREE.Group(); const m = new Builder(); const r = 0.17 - i * 0.012; m.add(P.sphere, i % 2 ? g2 : g1, 0, 0, 0, 0, 0, 0, r * 1.15, r, r * 1.3); s.add(new THREE.Mesh(m.build(), MATS.g)); s.children[0].castShadow = true; body.add(s); segs.push(s); } parts.segs = segs;
    const hd = MB(); hd.g.add(P.sphere, g1, 0, 0.0, 0.08, 0, 0, 0, 0.22, 0.16, 0.26); eyes(hd, 0.12, 0.14, 0.09, 0.06, { iris: 0x14532d }); hd.g.add(P.cyl, 0xf43f5e, 0, -0.02, 0.3, PI / 2, 0, 0, 0.012, 0.16, 0.012); hd.g.add(P.sphere, 0xf43f5e, 0, -0.02, 0.47, 0, 0, 0, 0.025);
    const head = toGroup(hd); body.add(head); parts.head = head; }
  else if (type === 'bat') { b.f.add(P.sphere, 0x6d28d9, 0, 0, 0, 0, 0, 0, 0.25, 0.27, 0.22); b.f.add(P.sphere, 0x8b5cf6, 0, 0.0, 0.12, 0, 0, 0, 0.15, 0.17, 0.12); eyes(b, 0.06, 0.18, 0.08, 0.06, { iris: 0x111827 });
    [-1, 1].forEach((s) => { b.f.add(cone(12), 0x6d28d9, s * 0.13, 0.2, 0, 0, 0, -s * 0.3, 0.07, 0.18, 0.05); b.g.add(cone(8), 0xffffff, s * 0.04, -0.08, 0.2, PI, 0, 0, 0.018, 0.05, 0.018); });
    const wing = (s) => { const g = new THREE.Group(); const w = new Builder(); const sh = new THREE.Shape(); sh.moveTo(0, 0.1); sh.bezierCurveTo(0.3, 0.25, 0.6, 0.2, 0.75, 0.05); sh.quadraticCurveTo(0.6, -0.05, 0.5, -0.15); sh.quadraticCurveTo(0.38, -0.05, 0.25, -0.15); sh.quadraticCurveTo(0.15, -0.04, 0, -0.1);
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 1, curveSegments: 10 }); geo.rotateX(-PI / 2); if (s < 0) geo.scale(-1, 1, 1); w.add(geo, 0x7c3aed, 0, 0, 0); const m = new THREE.Mesh(w.build(), MATS.s); m.castShadow = true; g.add(m); g.position.set(s * 0.18, 0.05, 0); body.add(g); return g; };
    parts.wL = wing(-1); parts.wR = wing(1); }
  else if (type === 'scorpion') { const c = 0xf59e0b, d = 0xb45309; b.g.add(P.sphere, c, 0, 0.3, 0, 0, 0, 0, 0.32, 0.18, 0.42); b.g.add(P.sphere, c, 0, 0.32, 0.38, 0, 0, 0, 0.2, 0.14, 0.17); eyes(b, 0.44, 0.5, 0.07, 0.055, { iris: 0x3b0764 });
    for (let i = 0; i < 3; i++) [-1, 1].forEach((s) => b.g.add(P.capsule, d, s * 0.33, 0.18, 0.15 - i * 0.2, 0, 0, s * 1.0, 0.06, 0.24, 0.06));
    [-1, 1].forEach((s) => { b.g.add(P.capsule, d, s * 0.3, 0.3, 0.55, PI / 2, s * 0.5, 0, 0.07, 0.22, 0.07); b.g.add(P.sphere, c, s * 0.42, 0.32, 0.78, 0, 0, 0, 0.13, 0.08, 0.16); b.g.add(P.sphere, c, s * 0.36, 0.32, 0.9, 0, 0.4 * s, 0, 0.05, 0.06, 0.12); });
    const tail = new THREE.Group(); tail.position.set(0, 0.35, -0.38); const tb = MB(); for (let i = 0; i < 5; i++) { const a = i / 4 * PI * 0.9; tb.g.add(P.sphere, i % 2 ? c : d, 0, Math.sin(a) * 0.5, -Math.cos(a) * 0.3 + 0.0 - i * 0.02, 0, 0, 0, 0.11 - i * 0.01); }
    tb.g.add(cone(12), 0xfde68a, 0, 0.56, 0.18, 2.2, 0, 0, 0.06, 0.16, 0.06); tb.g.add(P.sphere, 0xfef3c7, 0, 0.5, 0.26, 0, 0, 0, 0.05); tail.add(toGroup(tb)); body.add(tail); parts.tail = tail; }
  else if (type === 'rat') { const f = 0xa1a1aa; b.f.add(P.sphere, f, 0, 0.3, 0, 0, 0, 0, 0.26, 0.24, 0.4); b.f.add(P.sphere, f, 0, 0.36, 0.38, 0, 0, 0, 0.2, 0.18, 0.22); b.g.add(P.sphere, 0xfda4af, 0, 0.36, 0.6, 0, 0, 0, 0.05); eyes(b, 0.44, 0.48, 0.08, 0.05, { iris: 0x111827 });
    [-1, 1].forEach((s) => { b.f.add(P.sphere, 0xd4d4d8, s * 0.15, 0.55, 0.3, 0, 0, 0, 0.11, 0.11, 0.03); b.g.add(P.sphere, 0xfda4af, s * 0.15, 0.55, 0.31, 0, 0, 0, 0.07, 0.07, 0.02); b.g.add(P.sphere, 0xfda4af, s * 0.16, 0.06, 0.2, 0, 0, 0, 0.06, 0.04, 0.08); b.g.add(P.sphere, 0xfda4af, s * 0.16, 0.06, -0.2, 0, 0, 0, 0.06, 0.04, 0.08); });
    b.g.add(tube([[0, 0.25, -0.38], [0, 0.18, -0.7], [0.15, 0.2, -0.95], [0.25, 0.32, -1.05]], 0.03, 20, 6), 0xfda4af, 0, 0, 0);
    b.g.add(P.rboxS, 0xfde68a, 0, 0.32, 0.72, 0, 0, 0, 0.18, 0.06, 0.12); b.g.add(P.rboxS, 0x86efac, 0, 0.36, 0.72, 0, 0, 0, 0.2, 0.025, 0.13); } // sandwich in its mouth
  else if (type === 'spider') { const f = 0x7c2d12; b.f.add(P.sphere, f, 0, 0.55, -0.15, 0, 0, 0, 0.36, 0.32, 0.4); b.f.add(P.sphere, 0x9a3412, 0, 0.5, 0.26, 0, 0, 0, 0.24, 0.22, 0.22);
    eyes(b, 0.6, 0.44, 0.09, 0.07, { iris: 0x111827 }); eyes(b, 0.76, 0.38, 0.06, 0.04, { iris: 0x111827 });
    for (let i = 0; i < 4; i++) [-1, 1].forEach((s) => { const z = 0.25 - i * 0.18; b.f.add(tube([[s * 0.15, 0.5, z], [s * 0.5, 0.7, z * 1.4], [s * 0.75, 0.05, z * 1.7]], 0.04, 12, 6), f, 0, 0, 0); b.g.add(P.sphere, 0xfacc15, s * 0.76, 0.05, z * 1.7, 0, 0, 0, 0.07, 0.05, 0.09); }); }
  else if (type === 'croc') { const g1 = 0x16a34a, g2 = 0x86efac; b.g.add(P.sphere, g1, 0, 0.2, 0, 0, 0, 0, 0.6, 0.28, 1.5); b.g.add(P.sphere, g1, 0, 0.25, 1.5, 0, 0, 0, 0.42, 0.2, 0.7); b.g.add(P.sphere, g2, 0, 0.12, 1.55, 0, 0, 0, 0.38, 0.1, 0.62);
    for (let i = 0; i < 8; i++) b.g.add(cone(6), 0xffffff, (i % 2 ? 1 : -1) * 0.34, 0.12, 1.1 + (i >> 1) * 0.22, 0, 0, PI, 0.035, 0.08, 0.035); [-1, 1].forEach((s) => b.g.add(P.sphere, g1, s * 0.25, 0.5, 1.05, 0, 0, 0, 0.14));
    eyes(b, 0.56, 1.12, 0.25, 0.09, { iris: 0x14532d }); for (let i = 0; i < 7; i++) b.g.add(cone(8), 0x15803d, 0, 0.42, -0.9 + i * 0.3, 0, 0, 0, 0.08, 0.14, 0.08); }
  body.add(toGroup(b)); return Object.assign({ root, body, type, t: Math.random() * 9 }, parts); }
export function animAnimal(r, dt, speed, st) { r.t += dt; const t = r.t, run = Math.min(1, speed / 3);
  if (r.type === 'monkey') { r.body.position.y = Math.abs(Math.sin(t * 9)) * 0.18 * run + (st === 'scared' ? Math.abs(Math.sin(t * 14)) * 0.3 : 0); r.aL.rotation.x = -Math.sin(t * 9) * run - (st === 'throw' ? 2.5 : 0); r.aR.rotation.x = st === 'throw' ? -2.8 : Math.sin(t * 9) * run; r.banana.visible = st !== 'scared'; }
  else if (r.type === 'snake') { r.segs.forEach((s, i) => s.position.set(Math.sin(t * 5 - i * 0.8) * 0.18 * (0.4 + run), 0.13, -i * 0.24)); r.head.position.set(Math.sin(t * 5 + 0.8) * 0.1, 0.2 + (st === 'chase' ? 0.25 : 0), 0.22); r.head.rotation.x = st === 'chase' ? -0.3 : 0; }
  else if (r.type === 'bat') { const f = Math.sin(t * 22) * 0.8; r.wL.rotation.z = f; r.wR.rotation.z = -f; r.body.position.y = Math.sin(t * 3) * 0.15; }
  else if (r.type === 'scorpion') { r.tail.rotation.x = Math.sin(t * 3) * 0.15 + (st === 'chase' ? 0.2 : 0); r.body.position.y = Math.abs(Math.sin(t * 12)) * 0.03 * run; }
  else if (r.type === 'rat') { r.body.position.y = Math.abs(Math.sin(t * 16)) * 0.06 * run; r.body.rotation.z = Math.sin(t * 16) * 0.05 * run; }
  else if (r.type === 'spider') { r.body.position.y = Math.abs(Math.sin(t * 10)) * 0.05 * run; r.body.rotation.y = Math.sin(t * 10) * 0.05 * run; }
  else if (r.type === 'croc') { r.body.position.y = Math.sin(t * 1.3) * 0.06 - 0.15; r.body.rotation.y = Math.sin(t * 0.5) * 0.15; }
  r.root.scale.y = st === 'scared' ? 0.9 + Math.sin(t * 20) * 0.05 : 1; }
export function makeMartina() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const b = MB(); const groove = 0x6e4524, sc = 0xb98545, scL = 0xd1a05e, skin = 0xb8a27c, skinD = 0x9c8763, belly = 0xe2c992;
  // domed shell = half-ellipsoid (lathe profile ordered bottom->top so faces point outward), rim at y0, sits on the body
  const A = 2.3, B = 1.85, Cz = 2.65, Y0 = 0.55, prof = [[0, 0]]; for (let k = 0; k <= 16; k++) { const th = PI / 2 - k / 16 * PI / 2; prof.push([Math.max(0.0001, A * Math.sin(th)), B * Math.cos(th)]); }
  prof[prof.length - 1][0] = 0;
  b.g.add(lathe(prof, 48, 'martinaDome2'), groove, 0, Y0, 0, 0, 0, 0, 1, 1, Cz / A);
  // scutes: flattened smooth plates sitting ON the dome, aligned to the surface normal
  const _n = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), up = new THREE.Vector3(0, 1, 0);
  const scute = (th, ph, r, col) => { const sx = A * Math.sin(th) * Math.cos(ph), sy = B * Math.cos(th), sz = Cz * Math.sin(th) * Math.sin(ph);
    _n.set(sx / (A * A), sy / (B * B), sz / (Cz * Cz)).normalize(); _q.setFromUnitVectors(up, _n); _e.setFromQuaternion(_q, 'XYZ');
    b.g.add(P.sphere, col, sx + _n.x * 0.02, Y0 + sy + _n.y * 0.02, sz + _n.z * 0.02, _e.x, _e.y, _e.z, r, 0.13, r * 1.05); };
  scute(0, 0, 0.78, scL);
  for (let i = 0; i < 6; i++) scute(0.66, i / 6 * PI * 2 + PI / 6, 0.74, i % 2 ? sc : scL);
  for (let i = 0; i < 12; i++) scute(1.17, i / 12 * PI * 2, 0.58, i % 2 ? scL : sc);
  // rim band of marginal plates + flat belly plate underneath
  for (let i = 0; i < 18; i++) { const a = i / 18 * PI * 2; b.g.add(P.sphere, i % 2 ? sc : groove, Math.cos(a) * A * 0.99, Y0 + 0.08, Math.sin(a) * Cz * 0.99, 0, -a, 0, 0.42, 0.14, 0.3); }
  b.m.add(P.sphere, belly, 0, Y0 - 0.02, 0, 0, 0, 0, A * 0.97, 0.16, Cz * 0.97);
  // soft skin body tucked under the shell so there is no hollow gap
  b.f.add(P.sphere, skin, 0, Y0 - 0.12, 0, 0, 0, 0, A * 0.85, 0.42, Cz * 0.85);
  // little pointy tail
  b.f.add(P.capsule, skin, 0, 0.42, -Cz - 0.05, -PI / 2 - 0.5, 0, 0, 0.22, 0.45, 0.22);
  body.add(toGroup(b));
  // head on a neck that comes out of the front of the shell
  const head = new THREE.Group(); head.position.set(0, 0.62, 2.55); body.add(head);
  { const h = MB(); h.f.add(P.capsule, skin, 0, 0.05, 0.05, PI / 2 - 0.35, 0, 0, 0.55, 0.8, 0.55);
    h.f.add(P.sphere, skin, 0, 0.42, 0.72, 0, 0, 0, 0.62, 0.55, 0.7); h.f.add(P.sphere, skinD, 0, 0.3, 1.25, 0, 0, 0, 0.32, 0.22, 0.2);
    h.g.add(torus(0.18, 16, PI), 0x4a3a24, 0, 0.24, 1.3, 0, 0, PI, 0.18, 0.12, 0.1);
    eyes(h, 0.62, 1.1, 0.3, 0.16, { iris: 0x3b2410 });
    h.g.add(P.sphere, 0xff9fbf, 0.42, 0.38, 1.18, 0, 0, 0, 0.11, 0.07, 0.05); h.g.add(P.sphere, 0xff9fbf, -0.42, 0.38, 1.18, 0, 0, 0, 0.11, 0.07, 0.05);
    for (let i = 0; i < 5; i++) h.g.add(P.sphere, 0xff6fcf, 0.5 + Math.cos(i * 1.26) * 0.12, 0.92 + Math.sin(i * 1.26) * 0.12, 0.55, 0, 0, 0, 0.09, 0.09, 0.05); h.g.add(P.sphere, 0xffd23f, 0.5, 0.92, 0.6, 0, 0, 0, 0.06);
    head.add(toGroup(h)); }
  // four stubby elephant-style legs with toenails, peeking out from under the rim
  const legs = []; const lb = MB(); lb.f.add(P.capsule, skin, 0, -0.2, 0, 0, 0, 0, 0.62, 0.55, 0.62); lb.f.add(P.sphere, skinD, 0, -0.62, 0.05, 0, 0, 0, 0.42, 0.14, 0.46);
  for (let i = -1; i <= 1; i++) lb.g.add(P.sphere, 0xf5f0e0, i * 0.17, -0.6, 0.4, 0, 0, 0, 0.08, 0.06, 0.09); const lg = toGroup(lb);
  [[-1.55, 1.55], [1.55, 1.55], [-1.55, -1.55], [1.55, -1.55]].forEach(([x, z]) => { const p = new THREE.Group(); p.position.set(x, 0.68, z); p.add(lg.clone()); body.add(p); legs.push(p); });
  root.scale.setScalar(0.9);
  return { root, body, head, legs, t: 0 };
}
export function animMartina(r, dt, speed) { r.t += dt; const run = Math.min(1, speed / 2); r.legs.forEach((l, i) => { l.rotation.x = Math.sin(r.t * 4 + (i === 0 || i === 3 ? 0 : PI)) * 0.4 * run; }); r.body.position.y = Math.abs(Math.sin(r.t * 4)) * 0.04 * run; r.head.rotation.y = Math.sin(r.t * 0.6) * 0.25; r.head.position.z = 2.55 + Math.sin(r.t * 1.3) * 0.08; }
// ---------------------------------------------------------------- Professor Vintage's machines (boss)
export function makeMech(type) { const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const b = MB(); const parts = {};
  const pal = { chopper: [0x6d28d9, 0x84cc16], drill: [0x6d28d9, 0xa78bfa], express: [0x4c1d95, 0xf59e0b], mummy: [0xf5f0e1, 0xfacc15], zeppelin: [0x7e22ce, 0xf0abfc] }[type] || [0x6d28d9, 0xfacc15];
  const [A, Bc] = pal; const brass = 0xd4a017;
  if (type === 'express') { // steam locomotive on little wheels
    b.g.add(rcyl(1.2, 3.6, 0.3, 40), A, 0, 1.4, -1.6, PI / 2, 0, 0, 1, 1, 1); b.x.add(rcyl(1.25, 0.2, 0.06, 40), brass, 0, 1.4, 2.05, PI / 2, 0, 0); b.l.add(P.sphere, 0xfff4c0, 0, 1.6, 2.15, 0, 0, 0, 0.35, 0.35, 0.12, 1.2);
    b.x.add(rcyl(0.35, 1.2, 0.08, 24), 0x1f2937, 0, 2.4, 1.2); b.x.add(rcyl(0.5, 0.25, 0.08, 24), brass, 0, 3.5, 1.2); b.g.add(P.rbox, Bc, 0, 2.6, -1.6, 0, 0, 0, 2.4, 2.0, 1.8);
    for (let i = 0; i < 3; i++) [-1, 1].forEach((s) => b.x.add(rcyl(0.55, 0.2, 0.06, 28), 0xdc2626, s * 1.15, 0.55, -1.4 + i * 1.2, 0, 0, PI / 2)); b.x.add(cone(24), 0x9ca3af, 0, 0.45, 2.4, PI / 2 + 0.6, 0, 0, 1.1, 0.7, 0.5); }
  else if (type === 'zeppelin') { // hover-pod under a little purple balloon
    b.g.add(P.sphere, A, 0, 1.4, 0, 0, 0, 0, 1.3, 0.9, 1.3); b.x.add(P.torus, brass, 0, 1.3, 0, PI / 2, 0, 0, 1.3, 1.3, 0.8); b.g.add(P.sphere, Bc, 0, 5.2, 0, 0, 0, 0, 1.9, 1.3, 2.6);
    for (let i = 0; i < 4; i++) b.m.add(P.cyl, 0x6b4423, Math.cos(i * PI / 2 + 0.8) * 1.1, 2.2, Math.sin(i * PI / 2 + 0.8) * 1.1, 0, 0, 0, 0.03, 2.4, 0.03);
    [-1, 1].forEach((s) => { b.x.add(rcyl(0.3, 0.6, 0.05, 20), 0x9ca3af, s * 1.4, 1.2, -0.3, PI / 2, 0, 0); b.l.add(P.sphere, 0x67e8f9, s * 1.4, 1.2, -0.95, 0, 0, 0, 0.22, 0.22, 0.1, 1.2); }); }
  else { // walker pod on two legs
    b.g.add(P.sphere, A, 0, 2.0, 0, 0, 0, 0, 1.25, 1.0, 1.15); b.x.add(P.torus, brass, 0, 1.9, 0, PI / 2, 0, 0, 1.25, 1.2, 0.7); b.x.add(rcyl(0.25, 1.0, 0.06, 20), 0x374151, -0.7, 2.6, -0.6); b.x.add(rcyl(0.38, 0.2, 0.06, 20), brass, -0.7, 3.6, -0.6);
    for (let i = 0; i < 8; i++) b.x.add(P.sphere, brass, Math.cos(i / 8 * PI * 2) * 1.24, 1.9, Math.sin(i / 8 * PI * 2) * 1.14, 0, 0, 0, 0.07);
    if (type === 'mummy') { for (let i = 0; i < 9; i++) b.f.addFn(torus(0.12, 40), (c) => c.set(i % 2 ? 0xf5f0e1 : 0xe7dcc0), 0, 1.3 + i * 0.16, 0, PI / 2 + (i % 3 - 1) * 0.1, 0, 0, 1.18 - Math.abs(i - 4) * 0.06, 1.08 - Math.abs(i - 4) * 0.06, 1.0); b.x.add(lathe([[0.001, 0], [0.6, 0], [0.5, 0.5], [0.001, 0.9]], 32), brass, 0, 2.9, 0); }
    if (type === 'chopper') { b.x.add(rcyl(0.15, 0.4, 0.04, 16), 0x9ca3af, 0, 3.0, 0); parts.rotor = (() => { const m = MB(); for (let i = 0; i < 3; i++) m.g.add(P.rboxS, Bc, Math.cos(i * 2.094) * 1.1, 0, Math.sin(i * 2.094) * 1.1, 0, -i * 2.094, 0, 2.2, 0.08, 0.3); m.x.add(P.sphere, brass, 0, 0, 0, 0, 0, 0, 0.2); return toGroup(m); })(); parts.rotor.position.set(0, 3.45, 0); body.add(parts.rotor); }
    if (type === 'drill') { parts.drill = (() => { const m = MB(); m.x.addFn(cone(32), (c, x, y) => c.set(Math.sin(y * 18 + Math.atan2(x, 0.001) * 0) > 0 ? 0xa78bfa : 0xd1d5db), 0, 0, 0, PI / 2, 0, 0, 0.6, 1.6, 0.6); return toGroup(m); })(); parts.drill.position.set(0, 1.8, 1.1); body.add(parts.drill); }
    parts.legs = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.8, 1.2, 0); const m = MB(); m.x.add(P.capsule, 0x6b7280, 0, -0.55, 0, 0, 0, 0, 0.3, 0.8, 0.3); m.g.add(P.sphere, Bc, 0, -1.15, 0.2, 0, 0, 0, 0.42, 0.18, 0.6); m.x.add(P.sphere, brass, 0, 0, 0, 0, 0, 0, 0.26); g.add(toGroup(m)); body.add(g); return g; });
    parts.claws = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * 1.35, 2.0, 0.2); const m = MB(); m.x.add(P.capsule, 0x6b7280, 0, 0, 0.4, PI / 2, 0, 0, 0.2, 0.7, 0.2); m.g.add(P.sphere, Bc, 0, 0, 0.95, 0, 0, 0, 0.32, 0.3, 0.3); [-1, 1].forEach((q) => m.x.add(cone(12), 0xd1d5db, q * 0.15, 0, 1.25, PI / 2, 0, 0, 0.09, 0.25, 0.09)); g.add(toGroup(m)); body.add(g); return g; }); }
  // glass dome + Vintage inside, waving his fist
  const dy = type === 'express' ? 2.5 : type === 'zeppelin' ? 1.6 : 2.55, dz = type === 'express' ? -1.6 : 0.0;
  const v = MB(); vintageParts(v, 0, { noLegs: true }); const vin = toGroup(v); vin.scale.setScalar(0.62); vin.position.set(0, dy - 0.6, dz + 0.1); body.add(vin); parts.vintage = vin;
  b.e.add(P.sphere, 0xc7f0ff, 0, dy + 0.3, dz, 0, 0, 0, 0.95, 0.9, 0.95); b.x.add(P.torus, brass, 0, dy - 0.1, dz, PI / 2, 0, 0, 0.95, 0.95, 0.5);
  body.add(toGroup(b)); return Object.assign({ root, body, type, t: 0 }, parts); }
export function animMech(r, dt, st) { r.t += dt; const t = r.t; const walk = st === 'move' || st === 'attack' ? 1 : 0.2;
  if (r.legs) r.legs.forEach((g, i) => { g.rotation.x = Math.sin(t * 6 + i * PI) * 0.5 * walk; }); if (r.claws) r.claws.forEach((g, i) => { g.rotation.x = st === 'attack' ? -0.6 + Math.sin(t * 10 + i) * 0.4 : Math.sin(t * 2 + i) * 0.15; });
  if (r.rotor) r.rotor.rotation.y += dt * (st === 'tired' ? 2 : 18); if (r.drill) r.drill.rotation.z += dt * (st === 'tired' ? 1 : 16);
  r.body.position.y = r.type === 'zeppelin' ? Math.sin(t * 2) * 0.3 + 0.6 : Math.abs(Math.sin(t * 6)) * 0.08 * walk;
  r.body.rotation.z = st === 'tired' ? Math.sin(t * 5) * 0.12 : 0; r.vintage.rotation.y = Math.sin(t * 2) * 0.4; r.vintage.position.y += ((st === 'tired' ? -0.25 : 0) + (r.vintage.userData.y0 ??= r.vintage.position.y) - r.vintage.position.y) * Math.min(1, dt * 5); }
// ---------------------------------------------------------------- relics, pickups, trap parts
export function makeRelic(id) { const b = MB(); const gold = 0xffc83d;
  b.x.add(rcyl(0.55, 0.18, 0.06, 32), gold, 0, -0.6, 0); b.x.add(rcyl(0.42, 0.1, 0.04, 32), 0xb45309, 0, -0.42, 0);
  if (id === 'jade') { const j = 0x34d399; b.g.add(P.sphere, j, 0, 0.0, 0, 0, 0, 0, 0.35, 0.4, 0.3); b.g.add(P.sphere, j, 0, 0.52, 0, 0, 0, 0, 0.3); b.g.add(P.sphere, 0xa7f3d0, 0, 0.47, 0.2, 0, 0, 0, 0.2, 0.16, 0.12); [-1, 1].forEach((s) => { b.g.add(P.sphere, j, s * 0.3, 0.55, 0, 0, 0, 0, 0.12, 0.13, 0.05); b.g.add(P.capsule, j, s * 0.3, 0.05, 0.1, -0.5, 0, s * 0.4, 0.12, 0.3, 0.12); }); eyes(b, 0.58, 0.24, 0.09, 0.06, { iris: 0x065f46 }); b.x.add(P.torus, gold, 0, -0.25, 0, PI / 2, 0, 0, 0.34, 0.34, 0.2); }
  else if (id === 'owl') { const c = 0xc4b5fd; b.e.add(P.sphere, c, 0, 0.05, 0, 0, 0, 0, 0.38, 0.48, 0.34); b.e.add(P.sphere, c, 0, 0.58, 0, 0, 0, 0, 0.3, 0.27, 0.28); [-1, 1].forEach((s) => { b.l.add(P.sphere, 0xfef08a, s * 0.12, 0.62, 0.22, 0, 0, 0, 0.09, 0.09, 0.05, 1.2); b.e.add(cone(10), c, s * 0.18, 0.85, 0, 0, 0, -s * 0.3, 0.07, 0.18, 0.07); }); b.l.add(P.sphere, 0xa78bfa, 0, 0.1, 0, 0, 0, 0, 0.2, 0.28, 0.18, 1.0); }
  else if (id === 'compass') { b.x.add(rcyl(0.5, 0.18, 0.07, 40), gold, 0, 0.1, 0, PI / 2, 0, 0); b.e.add(P.sphere, 0xe0f2fe, 0, 0.1, 0.1, 0, 0, 0, 0.42, 0.42, 0.06); b.g.add(cone(4), 0xdc2626, 0, 0.25, 0.14, 0, 0, 0, 0.07, 0.3, 0.02); b.g.add(cone(4), 0xf8fafc, 0, -0.05, 0.14, 0, 0, PI, 0.07, 0.3, 0.02); b.x.add(P.torus, gold, 0, 0.66, 0, 0, 0, 0, 0.12, 0.12, 0.12); for (let i = 0; i < 8; i++) b.x.add(gear(8), 0xb45309, Math.cos(i / 8 * PI * 2) * 0.54, 0.1 + Math.sin(i / 8 * PI * 2) * 0.54, -0.05, 0, 0, i, 0.09, 0.09, 0.09); }
  else if (id === 'scarab') { b.x.add(P.sphere, 0xfacc15, 0, 0.05, 0, 0, 0, 0, 0.36, 0.22, 0.48); b.x.add(P.sphere, 0xeab308, 0, 0.1, 0.42, 0, 0, 0, 0.2, 0.15, 0.15); b.l.add(P.sphere, 0x22d3ee, 0, 0.26, 0, 0, 0, 0, 0.12, 0.05, 0.3, 0.8); [-1, 1].forEach((s) => { for (let i = 0; i < 3; i++) b.x.add(P.capsule, 0xca8a04, s * 0.38, -0.05, 0.25 - i * 0.25, 0, 0, s * 1.1, 0.05, 0.22, 0.05); b.x.add(P.sphere, 0xfde047, s * 0.26, 0.2, -0.1, 0, 0, 0, 0.12, 0.05, 0.3); }); }
  else if (id === 'crown') { b.x.add(lathe([[0.36, 0], [0.38, 0.05], [0.38, 0.25], [0.36, 0.3]], 40, 'crownband'), gold, 0, -0.1, 0); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; b.x.add(star(), gold, Math.cos(a) * 0.36, 0.42, Math.sin(a) * 0.36, 0, -a + PI / 2, 0, 0.13, 0.13, 0.13); b.g.add(P.sphere, [0xf0abfc, 0x22d3ee, 0x4ade80][i % 3], Math.cos(a) * 0.38, 0.05, Math.sin(a) * 0.38, 0, 0, 0, 0.06); } b.l.add(star(), 0xfff3a0, 0, 0.6, 0, 0, 0, 0, 0.2, 0.2, 0.2, 1.4); }
  const g = toGroup(b); const halo = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0.12, depthWrite: false, toneMapped: false })); g.add(halo); return g; }
export function pickupGeos() {
  const coin = new Builder(); coin.add(rcyl(0.26, 0.06, 0.03, 32), 0xffc83d, 0, -0.03, 0, PI / 2, 0, 0); coin.add(star(), 0xffe27a, 0, 0, 0.035, 0, 0, 0, 0.12, 0.12, 0.06); coin.add(star(), 0xffe27a, 0, 0, -0.035, 0, 0, 0, 0.12, 0.12, 0.06);
  const tre = new Builder(); tre.add(P.torus, 0xffc83d, 0, 0.18, 0, 0, 0, 0, 0.12, 0.12, 0.12); tre.add(lathe([[0.001, -0.3], [0.2, -0.22], [0.28, 0.02], [0.18, 0.18], [0.001, 0.2]], 24, 'amulet'), 0xffc83d, 0, -0.08, 0, PI / 2, 0, 0); tre.add(P.sphere, 0x22d3ee, 0, -0.12, 0.12, 0, 0, 0, 0.12, 0.12, 0.08, 0.3);
  const ev = new Builder(); ev.add(P.rboxS, 0xfdf6e3, 0, 0, 0, 0.1, 0, 0.05, 0.55, 0.7, 0.04); ev.add(P.rboxS, 0x334155, 0, 0.1, 0.025, 0.1, 0, 0.05, 0.38, 0.28, 0.01); ev.add(P.sphere, 0xdc2626, 0.18, -0.24, 0.03, 0, 0, 0, 0.07, 0.07, 0.02); ev.add(rcyl(0.05, 0.62, 0.02, 12), 0xc2a26f, -0.29, -0.31, 0, 0, 0, 0.05);
  const hrt = new Builder(); hrt.add(heart(), 0xff3b6b, 0, 0, 0, 0, 0, 0, 0.32, 0.32, 0.32, 0.25);
  return { coin: coin.build(), treasure: tre.build(), evidence: ev.build(), heart: hrt.build() }; }
export function makeCheckpoint() { const b = MB(); b.m.add(rcyl(0.5, 0.22, 0.08, 24), 0x78716c, 0, 0, 0); b.m.add(P.cyl, 0x6b4423, 0, 0.2, 0, 0, 0, 0, 0.05, 1.9, 0.05); b.x.add(P.sphere, 0xd4a017, 0, 2.12, 0, 0, 0, 0, 0.07);
  for (let i = 0; i < 6; i++) b.m.add(blobGeo(i + 3, 0.25, 1), 0x8a8079, Math.cos(i) * 0.5, 0.08, Math.sin(i) * 0.5, 0, 0, 0, 0.18, 0.12, 0.18);
  const g = toGroup(b); const flag = (() => { const f = MB(); f.f.addFn(P.rboxS, (c, x) => c.set(x > 0.15 ? 0xf59e0b : 0xdc2626), 0.38, 0, 0, 0, 0, 0, 0.75, 0.48, 0.04); return toGroup(f); })(); flag.position.set(0, 1.8, 0); g.add(flag);
  const lampB = new Builder(); lampB.add(P.sphere, 0xffffff, 0, 0, 0, 0, 0, 0, 0.13, 0.17, 0.13); const lamp = new THREE.Mesh(lampB.build(), new THREE.MeshBasicMaterial({ color: 0x777777, toneMapped: false })); lamp.position.set(0.0, 1.2, 0.2); g.add(lamp);
  const cage = MB(); cage.x.add(P.torus, 0x374151, 0, 1.2, 0.2, 0, 0, 0, 0.14, 0.18, 0.14); cage.x.add(rcyl(0.1, 0.05, 0.02, 12), 0x374151, 0, 1.38, 0.2); g.add(toGroup(cage));
  return { root: g, flag, lamp }; }
export function makeHook() { const b = MB(); b.x.add(P.torus, 0xffc83d, 0, 0, 0, 0, 0, 0, 0.42, 0.42, 0.42); b.l.add(P.torus, 0xfff1a8, 0, 0, 0, 0, 0, 0, 0.34, 0.34, 0.1, 0.6); b.x.add(P.sphere, 0x9ca3af, 0, 0.45, 0, 0, 0, 0, 0.12); b.m.add(P.cyl, 0x6b4423, 0, 0.5, 0, 0, 0, 0, 0.06, 0.9, 0.06); return toGroup(b, false); }
export function boulderGeo() { const b = MB(); b.m.add(blobGeo(11, 0.07, 4), 0xa8a29e, 0, 0, 0); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; b.m.add(P.torus, 0x78716c, 0, 0, 0, a, PI / 2, 0, 1.01, 1.01, 0.08); } b.g.add(P.sphere, 0x34d399, 0, 0, 1.0, 0, 0, 0, 0.18, 0.18, 0.06); b.g.add(P.sphere, 0x34d399, 0, 0, -1.0, 0, 0, 0, 0.18, 0.18, 0.06); return b; }
export function makeDart() { const b = MB(); b.g.add(P.cyl, 0xfde047, 0, 0, 0, PI / 2, 0, 0, 0.04, 0.6, 0.04); b.g.add(lathe([[0.001, 0], [0.11, 0.0], [0.11, 0.02], [0.03, 0.08]], 16, 'suction'), 0xef4444, 0, 0, 0.62, -PI / 2, 0, 0); for (let i = 0; i < 3; i++) b.f.add(cone(3), 0xf472b6, 0, 0, 0.05, -PI / 2, i * 2.09, 0, 0.12, 0.2, 0.02); return toGroup(b); }
