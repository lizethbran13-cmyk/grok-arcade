// The player: a human visitor / new intern at Ratita Industries. Smooth cartoon parts (spheres, capsules, lathes),
// vertex-coloured and batched like every other model, with a few customisation options.
import * as THREE from 'three';
import { P } from './geo.js?v=np8';
import { MB, toGroup } from './models.js?v=np8';
import { torus } from './shapes.js?v=np8';
const PI = Math.PI;
export const SKINS = [0xffe0c7, 0xf5c9a4, 0xe0a87c, 0xc68658, 0x9a6440, 0x6b4128];
export const HAIRS = ['short', 'pony', 'curly', 'bun', 'spiky', 'long'];
export const HAIR_COLS = [0x2b1d14, 0x6b4226, 0xc98b4b, 0xf2d27a, 0xe0603a, 0x8b5cf6];
export const SHIRTS = [0xff4fa0, 0x4f9dff, 0x3ddc84, 0xffc93c, 0xa66bff, 0xff8a3d, 0x2dd4bf, 0xf8fafc];
export const PANTS = [0x334155, 0x1e3a8a, 0x7c4a1e, 0x111827, 0x9ca3af, 0xbe185d];
export const DEF_LOOK = { skin: 1, hair: 0, hairC: 1, shirt: 0, pants: 0 };
export function cleanLook(L) { const o = Object.assign({}, DEF_LOOK, L || {}); const cl = (v, n) => Math.max(0, Math.min(n - 1, v | 0)); return { skin: cl(o.skin, SKINS.length), hair: cl(o.hair, HAIRS.length), hairC: cl(o.hairC, HAIR_COLS.length), shirt: cl(o.shirt, SHIRTS.length), pants: cl(o.pants, PANTS.length) }; }
const shade = (c, k) => new THREE.Color(c).multiplyScalar(k).getHex();
export function makeHuman(look) { const L = cleanLook(look); const skin = SKINS[L.skin], hc = HAIR_COLS[L.hairC], sh = SHIRTS[L.shirt], pa = PANTS[L.pants];
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  // torso, hips, lanyard + intern badge
  const t = MB(); t.f.add(P.capsule, sh, 0, 1.1, 0, 0, 0, 0, 0.5, 0.3, 0.34); t.f.add(P.sphere, pa, 0, 0.86, 0, 0, 0, 0, 0.255, 0.15, 0.18);
  t.f.add(P.sphere, shade(sh, 0.88), 0, 1.36, 0, 0, 0, 0, 0.27, 0.07, 0.19); t.g.add(P.cyl, skin, 0, 1.42, 0, 0, 0, 0, 0.085, 0.12, 0.085);
  t.g.add(P.torus, 0xff4fa0, 0, 1.3, 0.05, PI / 2 - 0.5, 0, 0, 0.14, 0.17, 0.1); t.g.add(P.rbox, 0xffffff, 0, 1.12, 0.185, -0.08, 0, 0, 0.13, 0.17, 0.02); t.g.add(P.rbox, 0xff4fa0, 0, 1.17, 0.196, -0.08, 0, 0, 0.13, 0.04, 0.012);
  t.g.add(P.sphere, 0x60a5fa, 0, 1.1, 0.198, 0, 0, 0, 0.03, 0.03, 0.008);
  body.add(toGroup(t));
  // legs (pivot at hip) with rounded sneakers
  const legs = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.12, 0.84, 0); const b = MB(); b.f.add(P.capsule, pa, 0, -0.36, 0, 0, 0, 0, 0.2, 0.34, 0.2);
    b.g.add(P.sphere, 0xffffff, 0, -0.77, 0.06, 0, 0, 0, 0.12, 0.08, 0.19); b.g.add(P.sphere, shade(sh, 0.9), 0, -0.735, 0.03, 0, 0, 0, 0.115, 0.06, 0.15); g.add(toGroup(b)); body.add(g); return g; });
  // arms (pivot at shoulder) with sleeves + hands
  const arms = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.27, 1.32, 0); g.rotation.z = s * 0.12; const b = MB(); b.f.add(P.capsule, sh, 0, -0.12, 0, 0, 0, 0, 0.15, 0.13, 0.15);
    b.g.add(P.capsule, skin, 0, -0.33, 0, 0, 0, 0, 0.115, 0.16, 0.115); b.g.add(P.sphere, skin, 0, -0.5, 0.01, 0, 0, 0, 0.075, 0.08, 0.07); g.add(toGroup(b)); body.add(g); return g; });
  // head
  const head = new THREE.Group(); head.position.set(0, 1.46, 0); body.add(head); const h = MB();
  h.g.add(P.sphere, skin, 0, 0.27, 0, 0, 0, 0, 0.27, 0.285, 0.26); [-1, 1].forEach((s) => { h.g.add(P.sphere, skin, s * 0.265, 0.26, -0.01, 0, 0, 0, 0.05, 0.075, 0.04);
    h.g.add(P.sphere, 0xffffff, s * 0.095, 0.3, 0.215, 0, 0, 0, 0.06, 0.075, 0.04); h.g.add(P.sphere, 0x1b1b24, s * 0.095, 0.295, 0.25, 0, 0, 0, 0.037, 0.045, 0.02); h.l.add(P.sphere, 0xffffff, s * 0.095 + 0.012, 0.31, 0.265, 0, 0, 0, 0.012, 0.012, 0.006, 0.6);
    h.g.add(P.sphere, 0xff9fb0, s * 0.16, 0.2, 0.2, 0, 0, 0, 0.05, 0.03, 0.02); h.g.add(P.capsule, hc, s * 0.095, 0.4, 0.23, 0, 0, s * 0.15 + PI / 2, 0.025, 0.05, 0.02); });
  h.g.add(P.sphere, shade(skin, 0.92), 0, 0.24, 0.26, 0, 0, 0, 0.035, 0.03, 0.03); h.g.add(torus(0.3, 16, PI), 0x7a2e2e, 0, 0.2, 0.245, 0.25, 0, PI, 0.065, 0.055, 0.05);
  // hair
  const hr = L.hair; const H = (geo, x, y, z, rx, ry, rz, a, b2, c) => h.f.add(geo, hc, x, y, z, rx, ry, rz, a, b2, c);
  if (hr !== 2 && hr !== 4) { H(P.sphere, 0, 0.36, -0.03, -0.25, 0, 0, 0.29, 0.25, 0.28); H(P.sphere, -0.08, 0.47, 0.15, 0.5, 0, 0.3, 0.16, 0.08, 0.12); H(P.sphere, 0.1, 0.46, 0.16, 0.5, 0, -0.4, 0.14, 0.07, 0.11); }
  if (hr === 1) { H(P.sphere, 0, 0.42, -0.25, 0, 0, 0, 0.08, 0.08, 0.08); H(P.capsule, 0, 0.22, -0.33, 0.4, 0, 0, 0.13, 0.17, 0.13); h.g.add(P.torus, 0xff4fa0, 0, 0.38, -0.28, 0.4, 0, 0, 0.07, 0.07, 0.08); }
  if (hr === 2) for (let i = 0; i < 11; i++) { const a = i / 11 * PI * 2, r = 0.22; H(P.sphere, Math.cos(a) * r, 0.42 + Math.sin(i * 1.7) * 0.05, Math.sin(a) * r * 0.9 - 0.03, 0, 0, 0, 0.11, 0.11, 0.11); }
  if (hr === 2) H(P.sphere, 0, 0.5, -0.02, 0, 0, 0, 0.2, 0.12, 0.2);
  if (hr === 3) H(P.sphere, 0, 0.6, -0.08, 0, 0, 0, 0.13, 0.12, 0.13);
  if (hr === 4) { H(P.sphere, 0, 0.37, -0.03, -0.2, 0, 0, 0.28, 0.22, 0.27); for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2.2; H(P.cone, Math.sin(a) * 0.17, 0.52, Math.cos(a) * 0.1 - 0.02, -0.3 + Math.cos(a) * 0.3, 0, -a * 0.5, 0.07, 0.17, 0.07); } }
  if (hr === 5) { H(P.capsule, 0, 0.16, -0.12, 0.08, 0, 0, 0.5, 0.26, 0.24); [-1, 1].forEach((s) => H(P.capsule, s * 0.24, 0.17, 0.02, 0, 0, s * 0.1, 0.1, 0.2, 0.12)); }
  head.add(toGroup(h));
  const hat = new THREE.Group(); hat.position.set(0, 0.5, 0); hat.scale.setScalar(1.12); head.add(hat);
  return { root, body, head, legs, arms, hat, t: 0, human: true }; }
export function animHuman(r, dt, st) { r.t += dt; const t = r.t, run = Math.min(1, (st.speed || 0) / 6), f = 9 + run * 2, s = Math.sin(t * f);
  const air = st.air; r.body.position.y = air ? 0 : Math.abs(Math.cos(t * f)) * 0.05 * run + Math.sin(t * 2) * 0.006; r.body.rotation.x = air ? 0 : 0.07 * run;
  r.legs[0].rotation.x = air ? -0.5 : s * 0.75 * run; r.legs[1].rotation.x = air ? 0.25 : -s * 0.75 * run;
  r.arms[0].rotation.x = air ? -2.4 : -s * 0.7 * run + Math.sin(t * 2) * 0.03; r.arms[1].rotation.x = air ? -2.4 : s * 0.7 * run + Math.sin(t * 2 + 1) * 0.03;
  r.arms[0].rotation.z = air ? -0.5 : -0.12; r.arms[1].rotation.z = air ? 0.5 : 0.12;
  r.head.rotation.y = Math.sin(t * 0.7) * 0.08 * (1 - run); r.body.rotation.y = st.spin ? st.spin * 22 : 0;
  const sq = st.squash || 0; r.body.scale.set(1 + sq * 0.12, 1 - sq * 0.15, 1 + sq * 0.12); }
