// Cartoon townsfolk: smooth rounded people built from merged primitives with a tiny walk rig.
import * as THREE from 'three';
import { P } from './geo.js';
import { MB, toGroup } from './kit.js';
import { torus, cyl, capsule, rcyl, lathe, sph } from './shapes.js';
const PI = Math.PI;
export const SKINS = [0xffd9b8, 0xf2c29b, 0xd9a07a, 0xb57a52, 0x8d5a3b, 0x6b4128];
export const HAIRS = [0x2b1d14, 0x5a3820, 0x9a5b2a, 0xe0b25a, 0xc0392b, 0x1f1f2a, 0xd8d8e0, 0xff7ab8];
export const SHIRTS = [0xff5a5f, 0x3fa7ff, 0x4ade80, 0xffc93c, 0xa78bfa, 0xff8f3d, 0x22d3ee, 0xf472b6, 0x94a3b8, 0x10b981];
const rnd = (r, a) => a[(r() * a.length) | 0];
export function randomLook(r) {
  return { skin: rnd(r, SKINS), hair: rnd(r, HAIRS), hairStyle: rnd(r, ['short', 'bun', 'spiky', 'long', 'bald', 'curly', 'pony']), shirt: rnd(r, SHIRTS), pants: rnd(r, [0x334155, 0x1e3a8a, 0x6b4f2a, 0x3f3f46, 0x7c2d12]),
    shoes: rnd(r, [0x222222, 0xffffff, 0x7c2d12, 0xef4444]), hat: r() < 0.25 ? rnd(r, ['cap', 'beanie', 'sunhat']) : 'none', glasses: r() < 0.2, kid: r() < 0.18, w: 0.9 + r() * 0.3 };
}
// look: {skin,hair,hairStyle,shirt,pants,shoes,hat,apron,mustache,glasses,monocle,clipboard,bowtie,brows,kid,w}
export function makePerson(L) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const sc = L.kid ? 0.72 : 1, w = L.w || 1; body.scale.setScalar(sc);
  const t = MB();
  // torso: soft lathe shape (shirt), belt, apron
  t.f.add(lathe([[0, 0], [0.24, 0.02], [0.3 * w, 0.18], [0.3 * w, 0.42], [0.26 * w, 0.58], [0.16, 0.66], [0, 0.68]], 28), L.shirt, 0, 0.78, 0);
  t.f.add(rcyl(0.29 * w, 0.08, 0.03), L.pants, 0, 0.76, 0);
  if (L.apron) { t.f.add(P.rbox, L.apron, 0, 1.02, 0.2 * w + 0.07, 0.06, 0, 0, 0.42 * w, 0.5, 0.06); t.f.add(torus(0.12, 24), L.apron, 0, 1.25, 0, PI / 2, 0, 0, 0.28 * w, 0.28 * w, 0.18); }
  if (L.coat) { t.f.add(lathe([[0, 0], [0.27, 0.0], [0.33 * w, 0.18], [0.33 * w, 0.44], [0.28 * w, 0.6], [0.17, 0.68], [0, 0.69]], 28), L.coat, 0, 0.72, -0.01, 0, 0, 0, 1.02, 1, 1.02); }
  if (L.bowtie) { t.g.add(P.sphere, L.bowtie, -0.06, 1.38, 0.16, 0, 0, 0, 0.07, 0.05, 0.04); t.g.add(P.sphere, L.bowtie, 0.06, 1.38, 0.16, 0, 0, 0, 0.07, 0.05, 0.04); }
  if (L.tie) t.g.add(P.capsule, L.tie, 0, 1.22, 0.24 * w + 0.03, 0, 0, 0, 0.07, 0.25, 0.03);
  t.g.add(cyl(18), L.skin, 0, 1.4, 0, 0, 0, 0, 0.09, 0.08, 0.09); // neck
  const torso = toGroup(t); body.add(torso);
  // head
  const head = new THREE.Group(); head.position.set(0, 1.62, 0); body.add(head);
  const h = MB(); const hs = L.kid ? 0.36 : 0.31;
  h.g.add(P.sphere, L.skin, 0, 0, 0, 0, 0, 0, hs, hs * 1.04, hs * 0.98);
  h.g.add(P.sphere, L.skin, -hs * 0.98, 0, 0, 0, 0, 0, 0.06, 0.09, 0.05); h.g.add(P.sphere, L.skin, hs * 0.98, 0, 0, 0, 0, 0, 0.06, 0.09, 0.05); // ears
  h.g.add(P.sphere, Math.max(0, L.skin - 0x101010), 0, -0.03, hs * 0.97, 0, 0, 0, 0.06, 0.055, 0.05); // nose
  [-1, 1].forEach((sd) => { const x = sd * hs * 0.36;
    h.g.add(P.sphere, 0xffffff, x, 0.05, hs * 0.86, 0, 0, 0, 0.075, 0.09, 0.05); h.g.add(P.sphere, 0x1d1d2b, x, 0.04, hs * 0.9, 0, 0, 0, 0.048, 0.06, 0.04);
    h.l.add(P.sphere, 0xffffff, x + 0.015, 0.07, hs * 0.93, 0, 0, 0, 0.016, 0.016, 0.01, 0.2);
    const ang = L.brows === 'grumpy' ? sd * 0.45 : L.brows === 'happy' ? -sd * 0.2 : -sd * 0.08;
    h.f.add(P.capsule, L.hairStyle === 'bald' ? 0x6b5a50 : L.hair, x, 0.17 + (L.brows === 'grumpy' ? -0.02 : 0), hs * 0.88, 0, 0, PI / 2 + ang, 0.035, 0.11, 0.03);
    h.g.add(P.sphere, 0xff9a9a, sd * hs * 0.6, -0.08, hs * 0.75, 0, 0, 0, 0.05, 0.03, 0.02); // blush
  });
  // mouth
  if (L.brows === 'grumpy') h.g.add(torus(0.22, 16, PI), 0x7a2a2a, 0, -0.17, hs * 0.9, 0, 0, 0, 0.07, 0.05, 0.05);
  else h.g.add(torus(0.22, 16, PI), 0x7a2a2a, 0, -0.12, hs * 0.9, 0, 0, PI, 0.08, 0.06, 0.05);
  if (L.mustache) { [-1, 1].forEach((sd) => h.f.add(P.capsule, L.mustache, sd * 0.07, -0.08, hs * 0.95, 0, 0, sd * 1.2, 0.05, 0.12, 0.04)); }
  if (L.glasses || L.monocle) { const gc = 0x222222; [-1, 1].forEach((sd) => { if (L.monocle && sd < 0) return; h.x.add(torus(0.12, 20), L.monocle ? 0xd4af37 : gc, sd * hs * 0.36, 0.05, hs * 0.95, 0, 0, 0, 0.08, 0.08, 0.08); });
    if (!L.monocle) h.x.add(P.cyl, gc, 0, 0.06, hs * 0.97, 0, 0, PI / 2, 0.01, 0.07, 0.01); }
  // hair
  const hc = L.hair;
  switch (L.hairStyle) {
    case 'short': h.f.add(P.sphere, hc, 0, 0.07, -0.03, -0.25, 0, 0, hs * 1.06, hs * 0.9, hs * 1.04); break;
    case 'spiky': h.f.add(P.sphere, hc, 0, 0.08, -0.03, -0.2, 0, 0, hs * 1.05, hs * 0.85, hs * 1.03); for (let i = 0; i < 6; i++) h.f.add(P.cone, hc, Math.sin(i) * 0.14, hs * 0.85, -0.05 + Math.cos(i * 1.7) * 0.12, Math.cos(i) * 0.4, 0, Math.sin(i) * 0.4, 0.07, 0.18, 0.07); break;
    case 'bun': h.f.add(P.sphere, hc, 0, 0.07, -0.03, -0.25, 0, 0, hs * 1.06, hs * 0.92, hs * 1.04); h.f.add(P.sphere, hc, 0, hs * 0.9, -0.12, 0, 0, 0, 0.13); break;
    case 'long': h.f.add(P.sphere, hc, 0, 0.06, -0.04, -0.2, 0, 0, hs * 1.08, hs * 0.95, hs * 1.06); h.f.add(P.capsule, hc, 0, -0.22, -0.16, 0, 0, 0, hs * 1.6, 0.5, 0.35); break;
    case 'curly': for (let i = 0; i < 11; i++) { const a = i / 11 * PI * 2; h.f.add(P.sphere, hc, Math.cos(a) * hs * 0.75, 0.12 + Math.sin(i * 2.3) * 0.05, Math.sin(a) * hs * 0.7 - 0.05, 0, 0, 0, 0.13); } h.f.add(P.sphere, hc, 0, hs * 0.55, -0.03, 0, 0, 0, hs * 0.85, hs * 0.5, hs * 0.85); break;
    case 'pony': h.f.add(P.sphere, hc, 0, 0.07, -0.03, -0.25, 0, 0, hs * 1.06, hs * 0.92, hs * 1.04); h.f.add(P.capsule, hc, 0, -0.05, -hs * 1.1, 0.5, 0, 0, 0.16, 0.36, 0.16); break;
  }
  // hats
  switch (L.hat) {
    case 'chef': h.f.add(rcyl(hs * 0.82, 0.22, 0.04), 0xffffff, 0, hs * 0.62, 0); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; h.f.add(P.sphere, 0xffffff, Math.cos(a) * hs * 0.45, hs * 0.62 + 0.3, Math.sin(a) * hs * 0.45, 0, 0, 0, 0.17); } h.f.add(P.sphere, 0xffffff, 0, hs * 0.62 + 0.38, 0, 0, 0, 0, 0.2); break;
    case 'cap': h.f.add(P.sphere, L.hatCol || 0xef4444, 0, hs * 0.35, 0, 0, 0, 0, hs * 1.05, hs * 0.7, hs * 1.05); h.g.add(rcyl(hs * 0.7, 0.03, 0.01), L.hatCol || 0xef4444, 0, hs * 0.38, hs * 0.65, 0, 0, 0, 1, 1, 0.8); break;
    case 'beanie': h.f.add(P.sphere, L.hatCol || 0x3b82f6, 0, hs * 0.3, 0, 0, 0, 0, hs * 1.07, hs * 0.85, hs * 1.07); h.f.add(P.sphere, 0xffffff, 0, hs * 1.12, 0, 0, 0, 0, 0.08); break;
    case 'sunhat': h.f.add(rcyl(hs * 1.7, 0.04, 0.02), L.hatCol || 0xf5deb3, 0, hs * 0.5, 0); h.f.add(P.sphere, L.hatCol || 0xf5deb3, 0, hs * 0.55, 0, 0, 0, 0, hs * 0.9, hs * 0.6, hs * 0.9); h.f.add(torus(0.12, 24), 0xef4444, 0, hs * 0.62, 0, PI / 2, 0, 0, hs * 0.92, hs * 0.92, 0.4); break;
    case 'beret': h.f.add(P.sphere, L.hatCol || 0x7f1d1d, -0.04, hs * 0.75, -0.02, 0, 0, 0.25, hs * 1.15, hs * 0.32, hs * 1.15); h.f.add(P.cyl, 0x111111, -0.06, hs * 1.05, 0, 0, 0, 0, 0.02, 0.08, 0.02); break;
    case 'fedora': h.f.add(rcyl(hs * 1.45, 0.04, 0.02), L.hatCol || 0x4b5563, 0, hs * 0.62, 0); h.f.add(rcyl(hs * 0.82, 0.28, 0.06), L.hatCol || 0x4b5563, 0, hs * 0.62, 0); h.f.add(rcyl(hs * 0.84, 0.06, 0.02), 0x111111, 0, hs * 0.66, 0); break;
    case 'hard': h.g.add(P.sphere, 0xfacc15, 0, hs * 0.35, 0, 0, 0, 0, hs * 1.1, hs * 0.8, hs * 1.1); h.g.add(rcyl(hs * 1.25, 0.03, 0.01), 0xfacc15, 0, hs * 0.35, 0.03); break;
    case 'pirate': h.f.add(P.sphere, 0x1f1f1f, 0, hs * 0.55, 0, 0, 0, 0, hs * 1.4, hs * 0.45, hs * 0.9); h.g.add(P.sphere, 0xffffff, 0, hs * 0.65, hs * 0.75, 0, 0, 0, 0.06, 0.06, 0.02); break;
    case 'dino': for (let i = 0; i < 5; i++) h.g.add(P.cone, 0x16a34a, 0, hs * 0.95 - i * 0.06, -0.05 - i * 0.1, -0.5 - i * 0.2, 0, 0, 0.07, 0.15, 0.04); h.f.add(P.sphere, 0x4ade80, 0, 0.1, -0.06, 0, 0, 0, hs * 1.12, hs * 1.1, hs * 1.12); break;
    case 'helmet': h.e.add(P.sphere, 0xbfe9ff, 0, 0.02, 0, 0, 0, 0, hs * 1.35); h.g.add(torus(0.15, 28), 0xe5e7eb, 0, -hs * 0.6, 0, PI / 2, 0, 0, hs * 1.15, hs * 1.15, 0.6); break;
    case 'crown': for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; h.x.add(P.cone, 0xfacc15, Math.cos(a) * hs * 0.55, hs * 1.0, Math.sin(a) * hs * 0.55, 0, 0, 0, 0.06, 0.16, 0.06); } h.x.add(rcyl(hs * 0.62, 0.1, 0.02), 0xfacc15, 0, hs * 0.82, 0); break;
  }
  head.add(toGroup(h));
  // limbs (pivot at shoulder / hip)
  const limb = (col, end, len, r) => { const b = MB(); b.f.add(P.capsule, col, 0, -len / 2, 0, 0, 0, 0, r * 2, len / 1, r * 2); b.g.add(P.sphere, end, 0, -len - r * 0.4, 0, 0, 0, 0, r * 1.2, r * 1.1, r * 1.3); return toGroup(b); };
  const sleeve = L.coat || L.shirt;
  const armL = new THREE.Group(), armR = new THREE.Group(); armL.position.set(-0.33 * w, 1.34, 0); armR.position.set(0.33 * w, 1.34, 0);
  armL.add(limb(sleeve, L.skin, 0.42, 0.075)); armR.add(limb(sleeve, L.skin, 0.42, 0.075)); body.add(armL, armR);
  if (L.clipboard) { const b = MB(); b.g.add(P.rbox, 0x8b5a2b, 0, -0.5, 0.12, -0.3, 0, 0, 0.26, 0.34, 0.03); b.m.add(P.rbox, 0xffffff, 0, -0.49, 0.14, -0.3, 0, 0, 0.22, 0.28, 0.01); b.x.add(P.rbox, 0xc0c0c0, 0, -0.35, 0.16, -0.3, 0, 0, 0.1, 0.04, 0.03); armL.add(toGroup(b)); }
  const legL = new THREE.Group(), legR = new THREE.Group(); legL.position.set(-0.13, 0.78, 0); legR.position.set(0.13, 0.78, 0);
  const leg = () => { const b = MB(); b.f.add(P.capsule, L.pants, 0, -0.33, 0, 0, 0, 0, 0.19, 0.55, 0.19); b.g.add(P.sphere, L.shoes, 0, -0.72, 0.06, 0, 0, 0, 0.11, 0.08, 0.16); return toGroup(b); };
  legL.add(leg()); legR.add(leg()); body.add(legL, legR);
  const hold = new THREE.Group(); hold.position.set(0, 1.12, 0.48); body.add(hold);
  root.userData.rig = { body, head, armL, armR, legL, legR, hold, ph: Math.random() * 6, sc };
  return root;
}
// st: {speed (m/s), carry (bool), sit (bool), wave, eat}
export function animPerson(root, dt, st) {
  const R = root.userData.rig; if (!R) return; const sp = st.speed || 0;
  R.ph += dt * (sp > 0.1 ? 4 + sp * 2.2 : 2);
  const sw = sp > 0.1 ? Math.min(1, sp / 3) * 0.75 : 0, s = Math.sin(R.ph);
  if (st.sit) { R.legL.rotation.x = R.legR.rotation.x = -1.45; R.body.position.y = -0.36 * R.sc; }
  else { R.legL.rotation.x = s * sw; R.legR.rotation.x = -s * sw; R.body.position.y = sp > 0.1 ? Math.abs(Math.cos(R.ph)) * 0.06 : Math.sin(R.ph * 0.5) * 0.008; }
  if (st.carry) { R.armL.rotation.set(-1.3, 0, 0.15); R.armR.rotation.set(-1.3, 0, -0.15); }
  else if (st.eat) { const e = Math.max(0, Math.sin(R.ph * 1.6)); R.armR.rotation.set(-1.2 - e * 0.8, 0, -0.2); R.armL.rotation.set(-0.5, 0, 0.1); R.head.rotation.x = 0.1 + e * 0.1; }
  else if (st.wave) { R.armR.rotation.set(0, 0, 2.6 + Math.sin(R.ph * 3) * 0.4); R.armL.rotation.set(-s * sw, 0, 0.08); }
  else if (st.work) { const e = Math.sin(R.ph * 3); R.armL.rotation.set(-0.9 + e * 0.3, 0, 0.1); R.armR.rotation.set(-0.9 - e * 0.3, 0, -0.1); }
  else { R.armL.rotation.set(-s * sw, 0, 0.08); R.armR.rotation.set(s * sw, 0, -0.08); }
  if (!st.eat) R.head.rotation.x = st.angry ? Math.sin(R.ph * 4) * 0.08 : 0;
  R.head.rotation.z = st.angry ? 0 : Math.sin(R.ph * 0.3) * 0.04;
}
