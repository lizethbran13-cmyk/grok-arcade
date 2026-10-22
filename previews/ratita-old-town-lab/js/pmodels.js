// Pi-rat the Pirate Pack: characters, creatures, bosses and treasure (smooth merged primitives, cartoon PBR).
import * as THREE from 'three';
import { Builder, P } from './geo.js';
import { MB, toGroup, eyes, EXT } from './models.js';
import { rcyl, lathe, sph, cyl, cone, torus, capsule, tube, leaf, wedge, star, blobGeo } from './shapes.js';
import { ENEMY, BOSS } from './actors.js';
const PI = Math.PI;
const sub = (fn, shadow = true) => { const b = MB(); fn(b); return toGroup(b, shadow); };
// ---------------------------------------------------------------- Captain Eye Patch (a big pirate rat, standing tall)
export function makeCaptain() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const fur = 0x8a7f74, furD = 0x6b625a, belly = 0xe8dccb, coat = 0xb91c1c, gold = 0xffc83d;
  body.add(sub((b) => {
    b.f.add(P.capsule, fur, 0, 1.35, 0, 0, 0, 0, 0.95, 1.1, 0.8); b.f.add(P.sphere, belly, 0, 1.25, 0.28, 0, 0, 0, 0.5, 0.6, 0.3);
    b.f.add(P.sphere, coat, 0, 1.45, -0.05, 0, 0, 0, 0.56, 0.72, 0.46); b.f.add(P.cyl, coat, 0, 0.55, -0.05, 0, 0, 0, 0.58, 0.55, 0.48); // coat body + skirt
    b.f.add(P.sphere, belly, 0, 1.3, 0.33, 0, 0, 0, 0.3, 0.5, 0.18); b.x.add(torus(0.1, 32), gold, 0, 1.45, 0.05, PI / 2 - 0.2, 0, 0, 0.5, 0.42, 0.5);
    b.m.add(torus(0.18, 32), 0x3b2412, 0, 0.98, 0, PI / 2, 0, 0, 0.53, 0.47, 0.5); b.x.add(P.rboxS, gold, 0, 0.98, 0.47, 0, 0, 0, 0.22, 0.16, 0.06);
    for (let i = 0; i < 3; i++) b.x.add(P.sphere, gold, 0.18, 1.2 + i * 0.22, 0.43, 0, 0, 0, 0.05, 0.05, 0.03);
    b.f.add(P.capsule, fur, 0.22, 0.25, 0, 0, 0, 0, 0.2, 0.35, 0.2); b.m.add(P.cyl, 0x7c4a22, -0.22, 0.0, 0, 0, 0, 0, 0.08, 0.55, 0.08); b.m.add(P.sphere, 0x111111, 0.22, 0.04, 0.08, 0, 0, 0, 0.16, 0.08, 0.22); // boot + peg leg
    b.g.add(tube([[0, 0.6, -0.4], [0, 0.4, -1.0], [0.3, 0.2, -1.5], [0.6, 0.35, -1.8]], 0.06, 24, 8), 0xffb3c8, 0, 0, 0); // tail
    b.x.add(P.sphere, gold, 0.42, 1.95, 0.1, 0, 0, 0, 0.13, 0.08, 0.13); [-1, 1].forEach((s) => b.x.add(P.cyl, gold, s * 0.42, 1.9, 0.1, 0, 0, 0, 0.12, 0.04, 0.12)); // epaulettes
  }));
  const head = new THREE.Group(); head.position.set(0, 2.45, 0.05); body.add(head);
  head.add(sub((h) => { h.f.add(P.sphere, fur, 0, 0, 0, 0, 0, 0, 0.5, 0.46, 0.48); h.f.add(P.sphere, fur, 0, -0.08, 0.38, 0.2, 0, 0, 0.3, 0.26, 0.38); h.f.add(P.sphere, belly, 0, -0.17, 0.45, 0.2, 0, 0, 0.22, 0.14, 0.27);
    h.g.add(P.sphere, 0xff8fb0, 0, -0.04, 0.76, 0, 0, 0, 0.09, 0.075, 0.075); [-1, 1].forEach((s) => { h.f.add(P.sphere, furD, s * 0.38, 0.32, -0.08, 0, s * 0.3, s * -0.4, 0.26, 0.26, 0.07); h.g.add(P.sphere, 0xffb3c8, s * 0.37, 0.32, -0.04, 0, s * 0.3, s * -0.4, 0.17, 0.17, 0.03);
      for (let i = -1; i <= 1; i++) h.m.add(P.cyl, 0x3a3030, s * 0.36, -0.1 + i * 0.05, 0.56, 0, s * 0.25, PI / 2 + s * i * 0.2, 0.01, 0.55, 0.01); });
    eyes(h, 0.1, 0.36, 0.19, 0.11, { iris: 0x1b1b24, brow: 0x4a4038 }); h.g.add(P.sphere, 0x111111, 0.19, 0.1, 0.42, 0, 0, 0, 0.14, 0.13, 0.05); h.m.add(torus(0.05, 40), 0x111111, 0, 0.14, 0, PI / 2 + 0.05, 0, -0.3, 0.49, 0.49, 0.49);
    h.g.add(torus(0.2, 20, PI), 0x3a2a2a, 0, -0.27, 0.6, 0, 0, PI, 0.12, 0.07, 0.07); h.f.add(P.sphere, 0x6b5a4a, 0, -0.33, 0.48, 0, 0, 0, 0.18, 0.14, 0.12); // grin + stubble chin
    // big tricorn with the cheese-and-crossbones
    h.m.add(P.sphere, 0x1f1f2a, 0, 0.42, -0.02, 0, 0, 0, 0.42, 0.26, 0.42); for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + PI / 2; h.m.add(P.capsule, 0x1f1f2a, Math.cos(a) * 0.38, 0.34, Math.sin(a) * 0.38, 0, -a, PI / 2 - 0.4, 0.2, 0.7, 0.1); h.x.add(P.capsule, 0xffc83d, Math.cos(a) * 0.46, 0.42, Math.sin(a) * 0.46, 0, -a, PI / 2 - 0.4, 0.04, 0.72, 0.04); }
    h.g.add(wedge(), 0xffd23f, -0.12, 0.42, 0.45, 0, 0, 0, 0.26); [-1, 1].forEach((s) => h.g.add(P.capsule, 0xffffff, 0, 0.52, 0.44, 0, 0, s * 0.8, 0.04, 0.3, 0.03)); }));
  const armL = new THREE.Group(), armR = new THREE.Group(); armL.position.set(-0.65, 1.8, 0.05); armR.position.set(0.65, 1.8, 0.05); body.add(armL, armR);
  armL.add(sub((b) => { b.f.add(P.capsule, coat, 0, -0.4, 0, 0, 0, 0.1, 0.24, 0.7, 0.24); b.x.add(P.torus, 0xffc83d, -0.04, -0.82, 0, PI / 2, 0, 0, 0.13, 0.13, 0.2); b.f.add(P.sphere, fur, -0.05, -0.95, 0.02, 0, 0, 0, 0.14); }));
  armR.add(sub((b) => { b.f.add(P.capsule, coat, 0, -0.4, 0, 0, 0, -0.1, 0.24, 0.7, 0.24); b.x.add(P.torus, 0xffc83d, 0.04, -0.82, 0, PI / 2, 0, 0, 0.13, 0.13, 0.2); b.x.add(torus(0.18, 24, PI * 1.3), 0xd1d5db, 0.08, -1.12, 0.06, 0, PI / 2, PI * 0.2, 0.16); b.x.add(P.cyl, 0xd1d5db, 0.05, -0.95, 0, 0, 0, 0, 0.03, 0.15, 0.03); }));
  root.scale.setScalar(0.95);
  return { root, body, head, armL, armR, t: Math.random() * 5 };
}
export function animCaptain(r, dt, mode) { r.t += dt; const t = r.t; r.body.position.y = Math.sin(t * 2) * 0.03; r.head.rotation.y = Math.sin(t * 0.5) * 0.35; r.head.rotation.z = Math.sin(t * 0.8) * 0.05;
  r.armR.rotation.x = mode === 'wave' ? -2.4 + Math.sin(t * 8) * 0.3 : Math.sin(t * 1.3) * 0.1; r.armR.rotation.z = mode === 'wave' ? -0.3 : 0; r.armL.rotation.x = -Math.sin(t * 1.3) * 0.1; r.body.rotation.z = Math.sin(t * 1.1) * 0.04; }
// ---------------------------------------------------------------- Grumbles the cranky parrot
export function makeParrot() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const g = 0x22c55e, gd = 0x15803d;
  body.add(sub((b) => { b.g.add(P.sphere, g, 0, 0.45, 0, 0.25, 0, 0, 0.3, 0.42, 0.3); b.g.add(P.sphere, 0x86efac, 0, 0.4, 0.17, 0.25, 0, 0, 0.18, 0.3, 0.14); b.g.addFn(P.capsule, (c, x, y) => c.set(y > 0.05 ? 0xef4444 : 0x3b82f6), 0, 0.05, -0.3, -0.9, 0, 0, 0.14, 0.55, 0.06);
    [-1, 1].forEach((s) => { b.g.add(P.cyl, 0x9ca3af, s * 0.1, 0.0, 0.02, 0, 0, 0, 0.025, 0.14, 0.025); b.g.add(P.sphere, 0x6b7280, s * 0.1, -0.06, 0.06, 0, 0, 0, 0.05, 0.025, 0.08); }); }));
  const head = new THREE.Group(); head.position.set(0, 0.92, 0.06); body.add(head);
  head.add(sub((h) => { h.g.add(P.sphere, g, 0, 0, 0, 0, 0, 0, 0.24, 0.24, 0.24); h.g.add(P.sphere, 0xfef9c3, 0, -0.02, 0.15, 0, 0, 0, 0.14, 0.12, 0.1);
    h.g.add(lathe([[0, 0], [0.09, 0.02], [0.08, 0.1], [0.03, 0.2], [0, 0.22]], 16), 0xffb020, 0, -0.03, 0.2, PI / 2 + 0.6, 0, 0, 1, 1, 1); h.g.add(P.sphere, 0x374151, 0, -0.08, 0.22, 0, 0, 0, 0.06, 0.04, 0.05);
    [-1, 1].forEach((s) => { h.g.add(P.sphere, 0xffffff, s * 0.11, 0.06, 0.16, 0, 0, 0, 0.07, 0.07, 0.04); h.g.add(P.sphere, 0x111111, s * 0.11, 0.05, 0.19, 0, 0, 0, 0.035, 0.035, 0.02); h.g.add(P.capsule, 0x14532d, s * 0.11, 0.14, 0.17, 0, 0, s * -0.55, 0.035, 0.14, 0.035); // grumpy brows
      h.g.add(P.sphere, 0x9ca3af, s * 0.11, 0.0, 0.17, 0, 0, 0, 0.065, 0.03, 0.03); }); // tired eye bags
    for (let i = 0; i < 3; i++) h.g.add(P.capsule, [0xef4444, 0xffd23f, 0x3b82f6][i], (i - 1) * 0.05, 0.27, -0.05, -0.4, 0, (i - 1) * 0.4, 0.04, 0.16, 0.03); }));
  const wl = new THREE.Group(), wr = new THREE.Group(); wl.position.set(-0.27, 0.6, 0); wr.position.set(0.27, 0.6, 0); body.add(wl, wr);
  const wing = (s) => sub((b) => { b.g.addFn(P.sphere, (c, x, y) => c.set(y < -0.3 ? 0x3b82f6 : y < -0.12 ? 0xffd23f : gd), 0, -0.25, 0, 0, 0, s * 0.15, 0.08, 0.38, 0.22); });
  wl.add(wing(-1)); wr.add(wing(1));
  return { root, body, head, wl, wr, t: Math.random() * 5 };
}
export function animParrot(r, dt, fly) { r.t += dt; const t = r.t; const f = fly ? Math.sin(t * 22) : Math.sin(t * 1.5) * 0.08; r.wl.rotation.z = fly ? -0.4 - f * 0.9 : 0.15 + f; r.wr.rotation.z = fly ? 0.4 + f * 0.9 : -0.15 - f;
  r.head.rotation.x = Math.sin(t * 3) * 0.1; r.head.rotation.y = Math.sin(t * 0.9) * 0.5; r.body.rotation.x = fly ? 0.5 : 0; }
// ---------------------------------------------------------------- treasure + pickups
export function piratePickupGeos() {
  const crumb = new Builder(); crumb.add(rcyl(0.42, 0.12, 0.05, 24), 0xffc83d, 0, 0, 0, PI / 2, 0, 0, 1, 1, 1, 0.12); crumb.add(rcyl(0.3, 0.14, 0.03, 24), 0xffe08a, 0, 0, 0, PI / 2, 0, 0, 1, 1, 1, 0.15);
  const cheese = new Builder(); cheese.add(P.sphere, 0x9a6a3e, 0, 0, 0, 0, 0, 0, 0.55, 0.5, 0.55); cheese.add(P.cyl, 0x7c4a22, 0, 0.45, 0, 0, 0, 0, 0.2, 0.25, 0.2); cheese.add(torus(0.3, 24), 0xffc83d, 0, 0.5, 0, PI / 2, 0, 0, 0.25); for (let i = 0; i < 4; i++) cheese.add(rcyl(0.22, 0.07, 0.03, 18), 0xffc83d, Math.cos(i * 1.6) * 0.3, 0.42 + i * 0.03, 0.42, PI / 2 - 0.3, 0, i, 1, 1, 1, 0.15);
  const part = new Builder(); { const g = new THREE.OctahedronGeometry(0.5, 0); part.add(g, 0x3ff0ff, 0, 0, 0, 0, 0, 0, 0.8, 1.15, 0.8, 0.35); part.add(new THREE.OctahedronGeometry(0.5, 0), 0xff4fd8, 0, 0, 0, 0, PI / 4, 0, 0.55, 0.8, 0.55, 0.3); }
  const heart = new Builder(); heart.add(P.sphere, 0xff3b6b, 0, 0, 0, 0, 0, 0, 0.0001); // unused slot kept tiny (pirate hearts use the normal geo)
  return { crumb: crumb.build(), cheese: cheese.build(), part: part.build() };
}
export function makeChest(i, big) {
  const g = new THREE.Group(); const s = big ? 2.2 : 1; const wood = big ? 0xffc83d : 0x9a5b2b, band = big ? 0xfff1a8 : 0x4b3621, metal = big ? 'x' : 'm';
  const base = sub((b) => { b.m.add(P.rbox, wood, 0, 0.35, 0, 0, 0, 0, 1.1, 0.7, 0.75); b[metal].add(P.rboxS, band, -0.38, 0.36, 0, 0, 0, 0, 0.1, 0.74, 0.79); b[metal].add(P.rboxS, band, 0.38, 0.36, 0, 0, 0, 0, 0.1, 0.74, 0.79); b.x.add(P.rboxS, 0xffc83d, 0, 0.55, 0.39, 0, 0, 0, 0.18, 0.22, 0.06); b.m.add(P.sphere, 0x111111, 0, 0.53, 0.42, 0, 0, 0, 0.03, 0.05, 0.02);
    for (let k = 0; k < 6; k++) b.x.add(rcyl(0.14, 0.05, 0.02, 16), 0xffd23f, -0.3 + k * 0.12, 0.72, (k % 2) * 0.12 - 0.06, 0.3, 0, k, 1, 1, 1, 0.2); b.l.add(P.sphere, 0x3ff0ff, 0.15, 0.78, 0.0, 0, 0, 0, 0.07, 0.07, 0.07, 0.6); });
  const lid = sub((b) => { b.m.add(cyl(24), wood, 0, 0, 0, 0, 0, PI / 2, 0.38, 1.1, 0.38); b[metal].add(P.torus, band, -0.38, 0, 0, 0, PI / 2, 0, 0.38, 0.38, 0.2); b[metal].add(P.torus, band, 0.38, 0, 0, 0, PI / 2, 0, 0.38, 0.38, 0.2); });
  lid.children.forEach((m) => { m.geometry.translate(0.55, 0, 0.38); }); const lp = new THREE.Group(); lp.position.set(-0.55, 0.7, -0.38); lp.add(lid); lp.scale.y = 0.8;
  g.add(base, lp); g.scale.setScalar(s); g.userData.lid = lp; return { root: g, rat: null, lid: lp };
}
export function makeMapGoal() { // the island's map piece in a golden chest (the level goal)
  const c = makeChest(0, true); const g = c.root; const m = sub((b) => { b.m.add(P.rboxS, 0xf5deb3, 0, 0, 0, 0, 0, 0, 0.9, 0.03, 0.7); b.l.add(P.rboxS, 0xef4444, 0.15, 0.02, 0.1, 0, 0, 0.7, 0.2, 0.01, 0.04, 0.4); b.l.add(P.rboxS, 0xef4444, 0.15, 0.02, 0.1, 0, 0, -0.7, 0.2, 0.01, 0.04, 0.4);
    b.m.add(tube([[-0.35, 0.02, -0.2], [-0.1, 0.02, 0.1], [0.15, 0.02, 0.1]], 0.012, 12, 4), 0x92400e, 0, 0, 0); }, false); m.position.set(0, 1.2, 0); m.rotation.x = -0.6; g.add(m); c.lid.rotation.z = 1.4; g.position.y = 0; return g; }
// ---------------------------------------------------------------- enemies
function crabRig(col = 0xef4444, s = 1) { const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  body.add(sub((b) => { b.g.add(P.sphere, col, 0, 0.42, 0, 0, 0, 0, 0.62, 0.32, 0.45); b.g.add(P.sphere, 0xfca5a5, 0, 0.34, 0.12, 0, 0, 0, 0.45, 0.18, 0.32);
    [-1, 1].forEach((sd) => { b.g.add(P.cyl, col, sd * 0.16, 0.65, 0.25, 0.2, 0, 0, 0.04, 0.3, 0.04); b.g.add(P.sphere, 0xffffff, sd * 0.16, 0.95, 0.3, 0, 0, 0, 0.1); b.g.add(P.sphere, 0x111111, sd * 0.16, 0.96, 0.38, 0, 0, 0, 0.05);
      for (let i = 0; i < 3; i++) b.g.add(P.capsule, col, sd * 0.6, 0.2, -0.2 + i * 0.2, 0, 0, sd * 0.9, 0.08, 0.4, 0.08); }); }));
  const claws = [-1, 1].map((sd) => { const c = new THREE.Group(); c.position.set(sd * 0.55, 0.5, 0.35); c.add(sub((b) => { b.g.add(P.capsule, col, 0, 0, 0.15, PI / 2, 0, 0, 0.12, 0.3, 0.12); b.g.add(P.sphere, col, 0, 0.05, 0.42, 0, 0, 0, 0.2, 0.16, 0.24); b.g.add(P.cone, col, sd * 0.06, 0.12, 0.62, PI / 2 - 0.3, 0, 0, 0.08, 0.25, 0.06); b.g.add(P.cone, col, sd * 0.06, -0.04, 0.6, PI / 2 + 0.3, 0, 0, 0.07, 0.22, 0.05); })); body.add(c); return c; });
  root.scale.setScalar(s); return { root, body, claws, t: Math.random() * 6 }; }
EXT.enemy.crab = () => { const r = crabRig(); r.type = 'crab'; r.anim = (e, dt, sp) => { const t = e.t; e.body.position.y = Math.abs(Math.sin(t * 10)) * 0.04; e.body.rotation.z = Math.sin(t * 10) * 0.06 * Math.min(1, sp); e.claws.forEach((c, i) => c.rotation.x = Math.sin(t * 6 + i) * 0.3); }; return r; };
EXT.enemy.gull = () => { const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  body.add(sub((b) => { b.g.add(P.sphere, 0xffffff, 0, 0, 0, 0, 0, 0, 0.32, 0.3, 0.55); b.g.add(P.sphere, 0xffffff, 0, 0.22, 0.42, 0, 0, 0, 0.22); b.g.add(P.cone, 0xffb020, 0, 0.18, 0.7, PI / 2, 0, 0, 0.07, 0.24, 0.06); b.g.add(P.sphere, 0xef4444, 0, 0.14, 0.72, 0, 0, 0, 0.03);
    [-1, 1].forEach((s) => { b.g.add(P.sphere, 0x111111, s * 0.12, 0.28, 0.58, 0, 0, 0, 0.04); b.g.add(P.capsule, 0x6b7280, s * 0.12, 0.36, 0.56, 0, 0, s * -0.6, 0.03, 0.12, 0.03); }); b.g.add(P.sphere, 0x9ca3af, 0, 0.05, -0.55, 0, 0, 0, 0.18, 0.06, 0.25); }));
  const wings = [-1, 1].map((s) => { const w = new THREE.Group(); w.position.set(s * 0.25, 0.1, 0); w.add(sub((b) => b.g.addFn(P.sphere, (c, x) => c.set(Math.abs(x) > 0.6 ? 0x374151 : 0xd1d5db), s * 0.55, 0, 0, 0, 0, 0, 0.6, 0.05, 0.3))); body.add(w); return w; });
  return { root, body, wings, type: 'gull', t: Math.random() * 6, anim: (e) => { const t = e.t; e.wings[0].rotation.z = Math.sin(t * 9) * 0.5; e.wings[1].rotation.z = -Math.sin(t * 9) * 0.5; e.body.position.y = Math.sin(t * 2) * 0.2 + 0.4; } }; };
EXT.enemy.skel = () => { const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const bone = 0xf5f0e1;
  body.add(sub((b) => { for (let i = 0; i < 4; i++) b.g.add(torus(0.12, 24, PI), bone, 0, 0.45, -0.3 + i * 0.17, 0, 0, 0, 0.3, 0.3, 0.3); b.g.add(P.cyl, bone, 0, 0.6, -0.1, PI / 2, 0, 0, 0.05, 0.8, 0.05);
    b.g.add(P.sphere, bone, 0, 0.62, 0.48, 0, 0, 0, 0.3, 0.27, 0.3); b.g.add(P.sphere, bone, 0, 0.55, 0.72, 0.2, 0, 0, 0.16, 0.13, 0.2); [-1, 1].forEach((s) => { b.g.add(P.sphere, 0x1f1f2a, s * 0.11, 0.66, 0.73, 0, 0, 0, 0.07, 0.08, 0.04); b.l.add(P.sphere, 0x7dffb0, s * 0.11, 0.66, 0.765, 0, 0, 0, 0.025, 0.025, 0.01, 1); b.g.add(P.sphere, bone, s * 0.2, 0.85, 0.42, 0, 0, s * -0.4, 0.13, 0.13, 0.03);
      [-0.28, 0.25].forEach((z) => b.g.add(P.capsule, bone, s * 0.2, 0.18, z, 0, 0, 0, 0.07, 0.3, 0.07)); });
    b.f.add(P.sphere, 0xdc2626, 0, 0.8, 0.46, 0, 0, 0, 0.3, 0.12, 0.3); b.f.add(P.cone, 0xdc2626, 0.18, 0.75, 0.25, 1.2, 0, 0.6, 0.06, 0.2, 0.06); b.x.add(P.cyl, 0xd1d5db, 0.32, 0.5, 0.5, 0.6, 0, 0, 0.03, 0.6, 0.06);
    b.g.add(tube([[0, 0.45, -0.5], [0, 0.35, -0.9], [0.15, 0.4, -1.2]], 0.03, 12, 6), bone, 0, 0, 0); }));
  return { root, body, type: 'skel', t: Math.random() * 6, anim: (e, dt, sp) => { e.body.position.y = Math.abs(Math.sin(e.t * 9)) * 0.06 * Math.min(1, sp); e.body.rotation.z = Math.sin(e.t * 9) * 0.08; } }; };
EXT.enemy.jelly = () => { const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  body.add(sub((b) => { b.e.add(P.sphere, 0xf9a8d4, 0, 0.6, 0, 0, 0, 0, 0.55, 0.42, 0.55); b.l.add(P.sphere, 0xff7ad9, 0, 0.6, 0, 0, 0, 0, 0.3, 0.2, 0.3, 0.6); eyes(b, 0.65, 0.48, 0.15, 0.09);
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; b.g.add(tube([[Math.cos(a) * 0.3, 0.3, Math.sin(a) * 0.3], [Math.cos(a) * 0.35, -0.1, Math.sin(a) * 0.35], [Math.cos(a) * 0.25, -0.5, Math.sin(a) * 0.25]], 0.035, 10, 6), 0xffc2e6, 0, 0, 0); } }, false));
  return { root, body, type: 'jelly', t: Math.random() * 6, anim: (e) => { const t = e.t; e.body.position.y = Math.sin(t * 2.5) * 0.3; e.body.scale.set(1 + Math.sin(t * 5) * 0.08, 1 - Math.sin(t * 5) * 0.08, 1 + Math.sin(t * 5) * 0.08); } }; };
Object.assign(ENEMY, { crab: { hp: 2, sp: 2.4, aggro: 7, r: 0.7 }, gull: { hp: 1, sp: 2.6, aggro: 9, r: 0.6, fly: true }, skel: { hp: 2, sp: 2.8, aggro: 8, r: 0.6 }, jelly: { hp: 1, sp: 1.4, aggro: 6, r: 0.6, fly: true } });
// ---------------------------------------------------------------- bosses
Object.assign(BOSS, {
  pinchy: { n: 'Sir Pinchington', hp: 3, r: 3, h: 3.4, moves: ['charge', 'lob', 'hop', 'charge'], proj: 0xf5d08a, sp: 3.2 },
  coco: { n: 'Coco Loco', hp: 4, r: 2.6, h: 5.2, moves: ['lob', 'hop', 'lob', 'spawn'], proj: 0x8b5a2b, sp: 3, spawn: 'crab' },
  sizzle: { n: 'Sizzle the Salamander', hp: 4, r: 3, h: 3.2, moves: ['ring', 'lob', 'charge', 'ring'], proj: 0xff6a1a, sp: 3.4 },
  inky: { n: 'Inky the Octopus', hp: 5, r: 3.2, h: 5, moves: ['lob', 'ring', 'spawn', 'lob', 'hop'], proj: 0x4c1d95, sp: 2.6, spawn: 'jelly' },
  clawbeard: { n: 'Captain Clawbeard', hp: 6, r: 3, h: 7, moves: ['charge', 'lob', 'hop', 'ring', 'spawn', 'lob'], proj: 0x111827, sp: 3.6, spawn: 'skel' },
});
EXT.boss.pinchy = () => { const r = crabRig(0xf97316, 4.2); r.type = 'pinchy'; const b = r.body;
  b.add(sub((q) => { q.x.add(torus(0.12, 24), 0xffc83d, 0.16, 0.96, 0.4, 0, 0, 0, 0.12); q.e.add(P.sphere, 0xe0f2fe, 0.16, 0.96, 0.41, 0, 0, 0, 0.11, 0.11, 0.02); q.m.add(P.cyl, 0x111111, 0, 1.25, 0.05, 0, 0, 0, 0.16, 0.3, 0.16); q.m.add(P.cyl, 0x111111, 0, 1.25, 0.05, 0, 0, 0, 0.26, 0.02, 0.26); q.g.add(P.cyl, 0xef4444, 0, 1.3, 0.05, 0, 0, 0, 0.165, 0.05, 0.165);
    q.g.add(torus(0.2, 20, PI), 0x7c2d12, 0, 0.5, 0.47, 0, 0, PI, 0.15, 0.08, 0.05); }));
  r.anim = (B, dt, st, t) => { const at = st === 'attack'; B.claws.forEach((c, i) => { c.rotation.x = at ? Math.sin(t * 14 + i) * 0.5 - 0.3 : Math.sin(t * 2 + i) * 0.2; c.rotation.y = (i ? -1 : 1) * (at ? 0.4 : 0.1); }); B.body.position.y = st === 'tired' ? -0.4 : Math.abs(Math.sin(t * 8)) * 0.1; }; return r; };
EXT.boss.coco = () => { const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const fur = 0x8b5a2b, face = 0xf5c99b;
  body.add(sub((b) => { b.f.add(P.sphere, fur, 0, 2.2, 0, 0, 0, 0, 1.6, 1.8, 1.4); b.f.add(P.sphere, face, 0, 2.0, 0.8, 0, 0, 0, 1.1, 1.3, 0.7); [-1, 1].forEach((s) => b.f.add(P.capsule, fur, s * 0.8, 0.5, 0.1, 0, 0, 0, 0.7, 1.0, 0.7));
    b.g.add(tube([[0, 1.5, -1.2], [0, 2.5, -2.4], [0.6, 3.6, -2.2], [0.3, 4.0, -1.6]], 0.2, 24, 8), fur, 0, 0, 0); }));
  const head = new THREE.Group(); head.position.set(0, 4.3, 0.3); body.add(head);
  head.add(sub((h) => { h.f.add(P.sphere, fur, 0, 0, 0, 0, 0, 0, 1.1, 1.0, 1.0); h.f.add(P.sphere, face, 0, -0.15, 0.6, 0, 0, 0, 0.8, 0.65, 0.55); [-1, 1].forEach((s) => { h.f.add(P.sphere, fur, s * 1.05, 0.1, 0, 0, 0, 0, 0.38, 0.38, 0.15); h.g.add(P.sphere, face, s * 1.08, 0.1, 0.05, 0, 0, 0, 0.24, 0.24, 0.1); });
    eyes(h, 0.2, 0.92, 0.3, 0.2, { brow: 0x3b2412, angry: true }); h.g.add(torus(0.25, 20, PI), 0x3b2412, 0, -0.4, 1.05, 0, 0, PI, 0.35, 0.2, 0.15); h.g.add(P.sphere, 0x3b2412, -0.1, -0.05, 1.12, 0, 0, 0, 0.06); h.g.add(P.sphere, 0x3b2412, 0.1, -0.05, 1.12, 0, 0, 0, 0.06);
    h.f.add(P.sphere, 0xdc2626, 0, 0.55, 0, 0, 0, 0, 1.05, 0.4, 1.0); for (let i = 0; i < 8; i++) h.g.add(P.sphere, 0xffffff, Math.cos(i) * 0.95, 0.6, Math.sin(i) * 0.9, 0, 0, 0, 0.07); h.f.add(P.cone, 0xdc2626, 0.7, 0.4, -0.7, 1.2, 0, 0.6, 0.2, 0.6, 0.2); }));
  const arms = [-1, 1].map((s) => { const a = new THREE.Group(); a.position.set(s * 1.5, 3.2, 0.2); a.add(sub((b) => { b.f.add(P.capsule, fur, 0, -0.9, 0, 0, 0, s * 0.2, 0.5, 1.6, 0.5); b.f.add(P.sphere, face, s * 0.2, -1.9, 0.1, 0, 0, 0, 0.4); if (s > 0) { b.m.add(blobGeo(4, 0.1, 2), 0x6b4423, 0.25, -2.2, 0.4, 0, 0, 0, 0.55); } })); body.add(a); return a; });
  return { root, body, head, arms, type: 'coco', t: 0, anim: (B, dt, st, t) => { const at = st === 'attack'; B.arms[0].rotation.x = at ? -2.2 + Math.sin(t * 10) * 0.6 : Math.sin(t * 2) * 0.3; B.arms[1].rotation.x = at ? -2.2 - Math.sin(t * 10) * 0.6 : -Math.sin(t * 2) * 0.3;
    B.head.rotation.z = Math.sin(t * 3) * 0.12; B.body.position.y = st === 'tired' ? -0.5 : Math.abs(Math.sin(t * 4)) * 0.2; } }; };
EXT.boss.sizzle = () => { const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const sk = 0xff6a1a, bel = 0xffd23f;
  body.add(sub((b) => { b.g.add(P.sphere, sk, 0, 1.5, 0, 0, 0, 0, 1.6, 1.2, 2.6); b.g.add(P.sphere, bel, 0, 1.1, 0.2, 0, 0, 0, 1.3, 0.8, 2.2); for (let i = 0; i < 9; i++) b.l.add(P.sphere, 0xfff07a, Math.cos(i * 2.3) * 0.9, 2.3 + Math.sin(i) * 0.2, -1.6 + i * 0.4, 0, 0, 0, 0.22, 0.12, 0.22, 1.2);
    b.g.add(tube([[0, 1.4, -2.3], [0.6, 1.0, -4.0], [1.6, 0.7, -5.2], [2.6, 0.9, -5.6]], 0.45, 30, 12), sk, 0, 0, 0); [-1, 1].forEach((s) => [-1.3, 1.3].forEach((z) => { b.g.add(P.capsule, sk, s * 1.4, 0.55, z, 0, 0, s * 0.8, 0.45, 1.0, 0.45); b.g.add(P.sphere, sk, s * 2.0, 0.15, z + 0.2, 0, 0, 0, 0.45, 0.15, 0.55); }));
    b.g.add(P.sphere, sk, 0, 2.0, 2.6, 0, 0, 0, 1.2, 1.0, 1.2); b.g.add(P.sphere, bel, 0, 1.7, 3.3, 0, 0, 0, 0.8, 0.5, 0.6); eyes(b, 2.55, 3.4, 0.55, 0.38, { iris: 0x7c2d12, brow: 0x7c2d12, angry: true }); b.g.add(torus(0.2, 20, PI), 0x7c2d12, 0, 1.6, 3.75, 0, 0, PI, 0.5, 0.25, 0.2);
    for (let i = 0; i < 5; i++) b.g.add(P.cone, 0xb91c1c, 0, 2.6 + Math.sin(i / 4 * PI) * 0.4, 1.6 - i * 0.9, 0, 0, 0, 0.25, 0.6, 0.25); }));
  const fl = new THREE.Group(); fl.position.set(0, 1.8, 4.2); fl.add(sub((b) => { b.l.add(P.cone, 0xffa31a, 0, 0, 0.6, PI / 2, 0, 0, 0.5, 1.4, 0.5, 1.4); b.l.add(P.cone, 0xfff07a, 0, 0, 0.4, PI / 2, 0, 0, 0.25, 0.9, 0.25, 1.6); }, false)); body.add(fl);
  return { root, body, fl, type: 'sizzle', t: 0, anim: (B, dt, st, t) => { B.fl.visible = st === 'attack'; B.fl.scale.setScalar(0.8 + Math.sin(t * 30) * 0.2); B.body.rotation.y = Math.sin(t * 2) * 0.08; B.body.position.y = st === 'tired' ? -0.3 : 0; } }; };
EXT.boss.inky = () => { const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const pu = 0x8b5cf6, pl = 0xc4b5fd;
  body.add(sub((b) => { b.g.add(P.sphere, pu, 0, 3.4, -0.3, -0.2, 0, 0, 2.0, 2.2, 2.0); b.g.add(P.sphere, pl, 0, 2.6, 1.0, 0, 0, 0, 1.4, 1.2, 0.9); for (let i = 0; i < 10; i++) b.g.add(P.sphere, pl, Math.cos(i * 2.1) * 1.5, 4.0 + Math.sin(i * 1.3) * 0.8, -0.3 + Math.sin(i * 2.1) * 1.4, 0, 0, 0, 0.18, 0.18, 0.08);
    eyes(b, 3.0, 1.75, 0.65, 0.48, { iris: 0x1e1b4b, brow: 0x4c1d95, angry: true }); b.g.add(torus(0.2, 20, PI), 0x4c1d95, 0, 2.2, 1.85, 0, 0, PI, 0.4, 0.2, 0.2);
    b.m.add(P.sphere, 0x1f1f2a, 0, 5.4, -0.2, 0, 0, 0, 1.2, 0.5, 1.2); for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + PI / 2; b.m.add(P.capsule, 0x1f1f2a, Math.cos(a) * 1.0, 5.2, -0.2 + Math.sin(a) * 1.0, 0, -a, PI / 2 - 0.4, 0.5, 1.8, 0.25); } b.g.add(wedge(), 0xffd23f, -0.3, 5.3, 1.05, 0, 0, 0, 0.6); }));
  const tents = []; for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; const tg = new THREE.Group(); tg.position.set(Math.cos(a) * 1.3, 1.3, Math.sin(a) * 1.3); tg.rotation.y = -a + PI / 2;
    tg.add(sub((b) => b.g.addFn(tube([[0, 0, 0], [0, -0.6, 1.0], [0, -1.0, 2.2], [0, -0.6, 3.2], [0, 0.2, 3.6]], 0.42, 30, 12), (c, x, y, z) => c.set(Math.sin(z * 5 + x * 3) > 0.7 ? pl : pu), 0, 0, 0))); tg.children[0].children.forEach((m) => { const p = m.geometry.attributes.position; for (let k = 0; k < p.count; k++) { const z = p.getZ(k), s = Math.max(0.25, 1 - z / 4.2); p.setX(k, p.getX(k) * s); p.setY(k, (p.getY(k) + (1 - s) * 0.2) * (0.6 + 0.4 * s)); } m.geometry.computeVertexNormals(); });
    body.add(tg); tents.push(tg); }
  return { root, body, tents, type: 'inky', t: 0, anim: (B, dt, st, t) => { B.tents.forEach((g, i) => { g.rotation.x = Math.sin(t * 3 + i * 0.8) * 0.25 - 0.1; g.rotation.z = Math.sin(t * 2 + i) * 0.1; }); B.body.position.y = st === 'tired' ? -0.6 : Math.sin(t * 2) * 0.25; } }; };
EXT.boss.clawbeard = () => { const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const fur = 0xf59e0b, furL = 0xfde7c2, coat = 0x111827, gold = 0xffc83d;
  body.add(sub((b) => { b.f.add(P.capsule, fur, 0, 3.0, 0, 0, 0, 0, 2.2, 2.8, 1.9); b.f.add(P.sphere, furL, 0, 3.0, 0.75, 0, 0, 0, 1.1, 1.5, 0.5); b.f.add(P.sphere, coat, 0, 3.2, -0.1, 0, 0, 0, 1.25, 1.7, 1.05); b.f.add(P.cyl, coat, 0, 1.0, -0.1, 0, 0, 0, 1.3, 1.6, 1.1);
    b.f.add(P.sphere, furL, 0, 3.0, 0.82, 0, 0, 0, 0.6, 1.2, 0.35); b.x.add(torus(0.1, 32), gold, 0, 3.4, 0.0, PI / 2 - 0.2, 0, 0, 1.15, 1.0, 1.15); b.m.add(torus(0.18, 32), 0x7c2d12, 0, 2.1, 0, PI / 2, 0, 0, 1.25, 1.1, 1.2); b.x.add(P.rboxS, gold, 0, 2.1, 1.12, 0, 0, 0, 0.5, 0.4, 0.1);
    [-1, 1].forEach((s) => { b.f.add(P.capsule, fur, s * 0.6, 0.6, 0.2, 0, 0, 0, 0.6, 1.0, 0.6); b.m.add(P.sphere, 0x111111, s * 0.6, 0.15, 0.4, 0, 0, 0, 0.45, 0.25, 0.6); b.x.add(P.sphere, gold, s * 1.05, 4.5, 0.1, 0, 0, 0, 0.35, 0.18, 0.35); });
    b.f.addFn(tube([[0, 1.2, -1.0], [0, 1.0, -2.4], [0.8, 2.2, -3.4], [0.6, 3.6, -3.2]], 0.32, 30, 10), (c, x, y) => c.set(Math.sin(y * 5) > 0.3 ? 0xb45309 : fur), 0, 0, 0); }));
  const head = new THREE.Group(); head.position.set(0, 5.9, 0.2); body.add(head);
  head.add(sub((h) => { h.f.add(P.sphere, fur, 0, 0, 0, 0, 0, 0, 1.3, 1.15, 1.15); h.f.add(P.sphere, furL, 0, -0.35, 0.75, 0, 0, 0, 0.75, 0.55, 0.5); [-1, 1].forEach((s) => { h.f.add(P.cone, fur, s * 0.8, 1.0, 0, 0, 0, s * -0.35, 0.45, 0.85, 0.3); h.g.add(P.cone, 0xff8fb0, s * 0.78, 0.95, 0.12, 0, 0, s * -0.35, 0.25, 0.55, 0.15);
      for (let i = -1; i <= 1; i++) h.m.add(P.cyl, 0x334155, s * 0.9, -0.35 + i * 0.12, 1.0, 0, s * 0.2, PI / 2 + s * i * 0.15, 0.02, 1.3, 0.02); h.f.add(P.sphere, 0xb45309, s * 0.5, 0.5, 0.9, 0, 0, s * 0.3, 0.3, 0.08, 0.1); });
    eyes(h, 0.15, 0.95, 0.42, 0.3, { iris: 0x16a34a, brow: 0x7c2d12, angry: true, closed: 1 }); h.g.add(P.sphere, 0x111111, 0.42, 0.15, 1.05, 0, 0, 0, 0.36, 0.34, 0.12); h.m.add(torus(0.05, 40), 0x111111, 0, 0.25, 0, PI / 2 + 0.05, 0, -0.3, 1.25, 1.25, 1.25);
    h.g.add(P.sphere, 0xff6fb5, 0, -0.25, 1.22, 0, 0, 0, 0.16, 0.12, 0.1); [-1, 1].forEach((s) => h.g.add(P.cone, 0xffffff, s * 0.15, -0.65, 1.05, PI, 0, 0, 0.07, 0.2, 0.07));
    h.m.add(P.sphere, 0x111827, 0, 1.0, -0.05, 0, 0, 0, 1.15, 0.6, 1.15); for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + PI / 2; h.m.add(P.capsule, 0x111827, Math.cos(a) * 1.05, 0.85, Math.sin(a) * 1.05, 0, -a, PI / 2 - 0.4, 0.5, 2.0, 0.26); h.x.add(P.capsule, gold, Math.cos(a) * 1.3, 1.05, Math.sin(a) * 1.3, 0, -a, PI / 2 - 0.4, 0.1, 2.05, 0.1); }
    h.g.add(P.sphere, 0xffffff, 0, 1.15, 1.15, 0, 0, 0, 0.32, 0.3, 0.1); [-1, 1].forEach((s) => { h.g.add(P.sphere, 0x111111, s * 0.1, 1.18, 1.25, 0, 0, 0, 0.07); h.g.add(P.capsule, 0xffffff, 0, 0.9, 1.2, 0, 0, s * 0.9, 0.06, 0.55, 0.05); }); h.g.add(leaf(), 0xef4444, -0.6, 1.4, -0.3, -0.5, 0, 0.6, 0.5, 1.2, 0.5); }));
  const armR = new THREE.Group(); armR.position.set(1.6, 4.4, 0.2); body.add(armR); armR.add(sub((b) => { b.f.add(P.capsule, coat, 0, -0.9, 0, 0, 0, -0.1, 0.55, 1.6, 0.55); b.f.add(P.sphere, fur, 0.1, -1.9, 0.1, 0, 0, 0, 0.42); b.x.add(P.rboxS, gold, 0.1, -2.0, 0.5, 0, 0, 0, 0.6, 0.12, 0.25); b.x.add(P.rbox, 0xe5e7eb, 0.1, -2.0, 1.9, 0, 0, 0, 0.12, 0.3, 2.6); b.l.add(P.rboxS, 0xffffff, 0.1, -1.9, 2.0, 0, 0, 0, 0.04, 0.06, 2.4, 0.3); }));
  const armL = new THREE.Group(); armL.position.set(-1.6, 4.4, 0.2); body.add(armL); armL.add(sub((b) => { b.f.add(P.capsule, coat, 0, -0.9, 0, 0, 0, 0.1, 0.55, 1.6, 0.55); b.x.add(torus(0.2, 24, PI * 1.3), 0xd1d5db, -0.1, -2.4, 0.2, 0, PI / 2, PI * 0.2, 0.4); b.x.add(P.cyl, 0xd1d5db, -0.05, -2.0, 0, 0, 0, 0, 0.08, 0.4, 0.08); }));
  return { root, body, head, armR, armL, type: 'clawbeard', t: 0, anim: (B, dt, st, t) => { const at = st === 'attack'; B.armR.rotation.x = at ? -1.4 + Math.sin(t * 12) * 0.8 : -0.3 + Math.sin(t * 2) * 0.15; B.armL.rotation.x = at ? -0.8 : Math.sin(t * 2) * 0.15;
    B.head.rotation.y = Math.sin(t * 1.2) * 0.3; B.body.position.y = st === 'tired' ? -0.5 : Math.abs(Math.sin(t * 5)) * 0.15; } }; };
