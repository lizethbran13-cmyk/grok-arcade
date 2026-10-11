// Characters: smooth cartoon explorers, the Relic Patrol and Professor Vintage, built from merged high-poly primitives.
import * as THREE from 'three';
import { Builder, P } from './geo.js';
import { MATS } from './mats.js';
import { rcyl, lathe, cyl, cone, torus, capsule, tube, leaf, star, heart, blobGeo } from './shapes.js';
import { HEROES, OUTFITS } from './data.js';
export const PI = Math.PI;
export function MB() { return { f: new Builder(), g: new Builder(), m: new Builder(), x: new Builder(), l: new Builder(), e: new Builder() }; }
export function toGroup(b, shadow = true) { const g = new THREE.Group(); for (const k of Object.keys(b)) { if (!b[k].parts.length) continue; const m = new THREE.Mesh(b[k].build(), MATS[k]); m.castShadow = shadow && k !== 'l' && k !== 'e'; m.receiveShadow = k !== 'l'; g.add(m); } return g; }
const emptyMB = (b) => { for (const k in b) if (b[k].parts.length) return false; return true; };
export function eyes(b, y, z, sep, r, opt = {}) {
  [-1, 1].forEach((sd) => { const x = sd * sep;
    b.g.add(P.sphere, 0xffffff, x, y, z, 0, 0, 0, r, r * 1.15, r * 0.7);
    b.g.add(P.sphere, opt.iris || 0x2a1d14, x, y - r * 0.08, z + r * 0.42, 0, 0, 0, r * 0.6, r * 0.7, r * 0.38);
    b.g.add(P.sphere, 0x0b0b10, x, y - r * 0.1, z + r * 0.6, 0, 0, 0, r * 0.32, r * 0.38, r * 0.2);
    b.l.add(P.sphere, 0xffffff, x + r * 0.22, y + r * 0.28, z + r * 0.68, 0, 0, 0, r * 0.18, r * 0.18, r * 0.1, 0.3);
    if (opt.brow) b.m.add(P.capsule, opt.brow, x, y + r * 1.35, z + r * 0.3, 0, 0, PI / 2 + sd * (opt.angry ? -0.35 : 0.12), r * 0.35, r * 1.1, r * 0.35);
  });
}
function smile(b, y, z, w, col = 0x7a2e2e, open) { if (open) { b.g.add(P.sphere, 0x6b1f2a, 0, y, z, 0, 0, 0, w * 0.55, w * 0.42, w * 0.25); b.g.add(P.sphere, 0xffffff, 0, y + w * 0.2, z + w * 0.08, 0, 0, 0, w * 0.4, w * 0.12, w * 0.15); } else b.g.add(torus(0.22, 20, PI), col, 0, y + w * 0.3, z, PI, 0, 0, w * 0.55, w * 0.5, w * 0.5); }
// limb: a capsule hanging down from a pivot (y=0) of length len, radius r
function limb(bk, col, len, r, x = 0, z = 0, y0 = 0) { bk.add(P.capsule, col, x, y0 - len / 2, z, 0, 0, 0, r * 2, len / 2 - r * 0 + 0.0, r * 2); }
// ---------------------------------------------------------------- explorers
export function heroColors(heroId, outfitId) { const H = HEROES.find((h) => h.id === heroId) || HEROES[0]; const O = OUTFITS.find((o) => o.id === outfitId) || OUTFITS[0]; return { H, O }; }
export function makeHero(heroId, outfitId) {
  const { H, O } = heroColors(heroId, outfitId); const skin = H.skin, hair = H.hair; const shiny = !!O.shiny; const JK = shiny ? 'x' : 'f';
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  // torso + hips (pivot at hip height)
  const torso = new THREE.Group(); torso.position.y = 0.8; body.add(torso);
  const t = MB();
  t.f.add(P.sphere, O.pants, 0, 0.02, 0, 0, 0, 0, 0.23, 0.15, 0.18);                     // hips
  t.x.add(rcyl(0.235, 0.07, 0.03, 32), 0x3b2412, 0, 0.06, 0);                             // belt
  t.x.add(P.rboxS, 0xd4a017, 0, 0.1, 0.22, 0, 0, 0, 0.09, 0.07, 0.03);                    // buckle
  t.f.add(lathe([[0.001, 0.08], [0.2, 0.1], [0.24, 0.22], [0.25, 0.36], [0.23, 0.46], [0.15, 0.53], [0.001, 0.55]], 32, 'torsoL'), O.shirt, 0, 0, 0, 0, 0, 0, 1, 1, 0.82);
  // jacket: open front panels + collar (real geometry, not a texture)
  [-1, 1].forEach((s) => { t[JK].add(P.sphere, O.jacket, s * 0.14, 0.3, -0.01, 0, 0, 0, 0.14, 0.24, 0.19);
    t[JK].add(P.capsule, O.jacket, s * 0.1, 0.48, 0.11, 0.5, 0, s * 0.6, 0.09, 0.12, 0.06); });
  t[JK].add(P.sphere, O.jacket, 0, 0.32, -0.08, 0, 0, 0, 0.24, 0.25, 0.13);
  // satchel strap + bag
  t.m.add(torus(0.12, 40), 0x6b4423, 0, 0.3, 0, 0.25, 0, 0.75, 0.3, 0.3, 0.26);
  t.m.add(P.rbox, 0x8b5a2b, -0.24, 0.02, 0.05, 0, 0, 0.1, 0.12, 0.17, 0.2); t.x.add(P.sphere, 0xd4a017, -0.3, 0.06, 0.05, 0, 0, 0, 0.025);
  // backpack
  t.f.add(P.rbox, 0x7c5a32, 0, 0.3, -0.22, 0, 0, 0, 0.32, 0.36, 0.16); t.f.add(P.rbox, 0x9a7444, 0, 0.18, -0.31, 0, 0, 0, 0.24, 0.14, 0.07);
  t.m.add(rcyl(0.07, 0.36, 0.03, 20), 0x4b5563, 0, 0.5, -0.22, 0, 0, PI / 2, 1, 1, 1); // bedroll
  // coiled whip on the hip
  t.m.add(torus(0.18, 32), 0x5b3a1e, 0.25, 0.02, 0.02, 0, PI / 2, 0, 0.09, 0.09, 0.09); t.m.add(torus(0.18, 32), 0x6b4423, 0.26, 0.0, 0.02, 0, PI / 2, 0, 0.07, 0.07, 0.07);
  if (O.id === 'museum') { t.f.add(P.sphere, 0xdc2626, 0, 0.5, 0.17, 0, 0, 0, 0.06, 0.035, 0.03); }
  torso.add(toGroup(t));
  // head
  const head = new THREE.Group(); head.position.set(0, 0.62, 0.0); torso.add(head);
  const h = MB();
  h.g.add(P.cyl, skin, 0, -0.1, 0, 0, 0, 0, 0.08, 0.12, 0.08);
  h.g.add(P.sphere, skin, 0, 0.17, 0.0, 0, 0, 0, 0.26, 0.27, 0.25);
  h.g.add(P.sphere, skin, 0, 0.1, 0.17, 0, 0, 0, 0.17, 0.15, 0.12);                       // cheeks/jaw
  h.g.add(P.sphere, skin, 0, 0.15, 0.25, 0, 0, 0, 0.045, 0.05, 0.05);                     // nose
  [-1, 1].forEach((s) => { h.g.add(P.sphere, skin, s * 0.25, 0.15, 0, 0, 0, 0, 0.05, 0.07, 0.04); h.g.add(P.sphere, 0xff9a9a, s * 0.14, 0.09, 0.2, 0, 0, 0, 0.05, 0.03, 0.02); });
  eyes(h, 0.21, 0.19, 0.095, 0.06, { brow: hair, iris: heroId === 'zoe' ? 0x3b2314 : 0x3a2412 });
  smile(h, 0.04, 0.23, 0.11);
  // hair
  h.f.add(P.sphere, hair, 0, 0.28, -0.04, -0.2, 0, 0, 0.27, 0.2, 0.26);
  if (heroId === 'zoe') { h.f.add(P.sphere, hair, 0, 0.18, -0.22, 0, 0, 0, 0.2, 0.22, 0.12); h.f.add(P.capsule, hair, 0, 0.0, -0.32, 0.5, 0, 0, 0.12, 0.2, 0.12); h.g.add(P.torus, 0xf472b6, 0, 0.14, -0.27, 0.6, 0, 0, 0.06, 0.06, 0.06); }
  else if (heroId === 'kai') { for (let i = 0; i < 9; i++) h.f.add(P.sphere, hair, Math.cos(i * 0.8) * 0.18, 0.33 + Math.sin(i * 1.7) * 0.03, Math.sin(i * 0.8) * 0.16 - 0.04, 0, 0, 0, 0.1); }
  else { h.f.add(P.sphere, hair, 0.08, 0.32, 0.12, 0.4, 0, -0.3, 0.14, 0.07, 0.1); [-1, 1].forEach((s) => h.f.add(P.sphere, hair, s * 0.22, 0.2, -0.05, 0, 0, 0, 0.07, 0.12, 0.12)); }
  head.add(toGroup(h));
  const hat = new THREE.Group(); hat.position.set(0, 0.33, -0.01); head.add(hat); buildHat(hat, O);
  // arms (pivot at shoulder)
  const arm = (s) => { const g = new THREE.Group(); g.position.set(s * 0.29, 0.48, 0); torso.add(g); const a = MB();
    a[JK].add(P.sphere, O.jacket, 0, -0.02, 0, 0, 0, 0, 0.1, 0.1, 0.1); a[JK].add(P.capsule, O.jacket, 0, -0.17, 0, 0, 0, 0, 0.17, 0.22, 0.17);
    a.g.add(P.capsule, skin, 0, -0.38, 0, 0, 0, 0, 0.13, 0.16, 0.13); a.g.add(P.sphere, skin, 0, -0.51, 0.01, 0, 0, 0, 0.075, 0.08, 0.075);
    a[JK].add(rcyl(0.085, 0.05, 0.02, 20), O.jacket, 0, -0.3, 0); g.add(toGroup(a)); const hand = new THREE.Group(); hand.position.set(0, -0.52, 0.02); g.add(hand); return { g, hand }; };
  const aL = arm(-1), aR = arm(1);
  // legs (pivot at hip)
  const leg = (s) => { const g = new THREE.Group(); g.position.set(s * 0.12, 0.8, 0); body.add(g); const l = MB();
    l.f.add(P.capsule, O.pants, 0, -0.22, 0, 0, 0, 0, 0.19, 0.3, 0.19); l.f.add(P.capsule, O.pants, 0, -0.5, 0, 0, 0, 0, 0.16, 0.24, 0.16);
    l.m.add(rcyl(0.1, 0.14, 0.04, 20), 0x5b3a1e, 0, -0.74, 0); l.m.add(P.sphere, 0x4a2e16, 0, -0.75, 0.06, 0, 0, 0, 0.1, 0.07, 0.15); l.m.add(rcyl(0.11, 0.025, 0.01, 20), 0x2b1a0c, 0, -0.8, 0.03, 0, 0, 0, 1, 1, 1.3);
    g.add(toGroup(l)); return g; };
  const lL = leg(-1), lR = leg(1);
  // torch (left hand) + whip handle (right hand)
  const torch = new THREE.Group(); { const b = MB(); b.m.add(P.cyl, 0x6b4423, 0, 0, 0, 0, 0, 0, 0.035, 0.42, 0.035); b.m.add(rcyl(0.06, 0.08, 0.02, 16), 0x3b2412, 0, 0.18, 0); torch.add(toGroup(b));
    const fl = new Builder(); fl.add(P.sphere, 0xffb020, 0, 0.3, 0, 0, 0, 0, 0.08, 0.12, 0.08, 1.6); fl.add(cone(16), 0xffe066, 0, 0.3, 0, 0, 0, 0, 0.05, 0.2, 0.05, 2.2); const flame = new THREE.Mesh(fl.build(), MATS.l); torch.add(flame); torch.userData.flame = flame; }
  torch.position.set(0, -0.02, 0.08); torch.rotation.x = 0.5; aL.hand.add(torch); torch.visible = false;
  const whipH = (() => { const b = MB(); b.m.add(P.cyl, 0x3b2412, 0, 0, 0, 0, 0, 0, 0.03, 0.22, 0.03); b.x.add(P.sphere, 0xd4a017, 0, 0.22, 0, 0, 0, 0, 0.035); return toGroup(b); })(); whipH.position.set(0, -0.05, 0.06); whipH.rotation.x = 1.2; aR.hand.add(whipH); whipH.visible = false;
  return { root, body, torso, head, hat, armL: aL.g, armR: aR.g, handL: aL.hand, handR: aR.hand, legL: lL, legR: lR, torch, whipH, t: Math.random() * 10, hero: heroId, outfit: O.id };
}
export function buildHat(hat, O) { while (hat.children.length) hat.remove(hat.children[0]); const b = MB(); const c = O.hatCol, K = O.shiny ? 'x' : 'f';
  if (O.hat === 'fedora') { b[K].add(lathe([[0.001, 0.0], [0.38, 0.0], [0.4, 0.025], [0.3, 0.04], [0.24, 0.06], [0.23, 0.2], [0.18, 0.24], [0.06, 0.22], [0.001, 0.24]], 40, 'fedora'), c, 0, -0.02, 0, -0.08, 0, 0, 1, 1, 1.1); b.m.add(rcyl(0.235, 0.05, 0.015, 40), 0x2b1a0c, 0, 0.04, 0, -0.08, 0, 0, 1, 1, 1.1); }
  else if (O.hat === 'beanie') { b.f.add(P.sphere, c, 0, 0.0, 0, 0, 0, 0, 0.28, 0.22, 0.28); b.f.add(rcyl(0.285, 0.08, 0.03, 32), c, 0, -0.07, 0); b.f.add(P.sphere, 0xffffff, 0, 0.22, 0, 0, 0, 0, 0.07);
    b.x.add(rcyl(0.06, 0.05, 0.015, 20), 0x9ca3af, 0, -0.02, 0.27, PI / 2, 0, 0, 1, 1, 1); b.l.add(P.sphere, 0xfffbe0, 0, -0.02, 0.32, 0, 0, 0, 0.045, 0.045, 0.02, 1.2); }
  else if (O.hat === 'cap') { b.f.add(P.sphere, c, 0, 0.0, 0, 0, 0, 0, 0.27, 0.17, 0.27); b.f.add(P.sphere, c, 0, -0.03, 0.22, 0, 0, 0, 0.2, 0.03, 0.16); b.f.add(P.sphere, 0xfacc15, 0, 0.17, 0, 0, 0, 0, 0.03); }
  else if (O.hat === 'pith') { b.m.add(P.sphere, c, 0, 0.02, 0, 0, 0, 0, 0.29, 0.22, 0.3); b.m.add(rcyl(0.4, 0.03, 0.012, 40), c, 0, -0.04, 0); b.m.add(rcyl(0.3, 0.05, 0.02, 40), 0x8b5a2b, 0, -0.02, 0); }
  else if (O.hat === 'miner') { b.g.add(P.sphere, c, 0, 0.0, 0, 0, 0, 0, 0.29, 0.22, 0.3); b.g.add(rcyl(0.32, 0.03, 0.012, 40), c, 0, -0.04, 0); b.x.add(rcyl(0.07, 0.06, 0.02, 20), 0x6b7280, 0, 0.04, 0.27, PI / 2, 0, 0, 1, 1, 1); b.l.add(P.sphere, 0xfff6c0, 0, 0.04, 0.33, 0, 0, 0, 0.055, 0.055, 0.02, 1.5); }
  else if (O.hat === 'conductor') { b.f.add(rcyl(0.27, 0.16, 0.04, 32), c, 0, -0.06, 0); b.f.add(P.sphere, c, 0, -0.04, 0.24, 0, 0, 0, 0.2, 0.025, 0.12); b.x.add(P.rboxS, 0xfacc15, 0, 0.04, 0.27, 0, 0, 0, 0.1, 0.06, 0.02); }
  else if (O.hat === 'pharaoh') { b.x.add(P.sphere, c, 0, 0.0, -0.04, 0, 0, 0, 0.3, 0.2, 0.3); [-1, 1].forEach((s) => b.x.addFn(P.capsule, (col, x, y) => col.set(Math.sin(y * 50) > 0 ? 0xfacc15 : 0x1d4ed8), s * 0.26, -0.22, -0.02, 0, 0, s * 0.15, 0.14, 0.38, 0.2)); b.l.add(P.sphere, 0x22d3ee, 0, 0.08, 0.27, 0, 0, 0, 0.04, 0.04, 0.02, 0.6); }
  else if (O.hat === 'deerstalker') { b.f.add(P.sphere, c, 0, 0.0, 0, 0, 0, 0, 0.28, 0.2, 0.3); b.f.add(P.sphere, c, 0, -0.04, 0.24, 0, 0, 0, 0.16, 0.03, 0.12); b.f.add(P.sphere, c, 0, -0.04, -0.24, 0, 0, 0, 0.16, 0.03, 0.12); b.f.add(P.sphere, 0x78350f, 0, 0.19, 0, 0, 0, 0, 0.04); }
  else if (O.hat === 'tophat') { b.g.add(rcyl(0.2, 0.36, 0.03, 32), c, 0, -0.04, 0); b.g.add(rcyl(0.32, 0.03, 0.012, 40), c, 0, -0.05, 0); b.m.add(rcyl(0.205, 0.06, 0.01, 32), 0xdc2626, 0, 0.0, 0); }
  if (!emptyMB(b)) hat.add(toGroup(b)); }
// st: { speed, air, vy, whip (0..1 progress or 0), roll, hide, swing, caught, torch, push, wave }
export function animHero(r, dt, st) { r.t += dt; const run = Math.min(1, st.speed / 6.5), T = r.t * (6 + run * 6);
  const sw = Math.sin(T) * 0.9 * run; let lL = sw, lR = -sw, aL = -sw * 0.8, aR = sw * 0.8, bob = Math.abs(Math.sin(T)) * 0.06 * run, lean = run * 0.12, aLz = -0.08, aRz = 0.08;
  r.body.rotation.set(0, 0, 0); r.body.position.set(0, 0, 0);
  if (!st.air && run < 0.05) { const b = Math.sin(r.t * 2.2) * 0.012; bob = b; aL = Math.sin(r.t * 1.6) * 0.04; aR = -aL; lean = 0; }
  if (st.air) { lL = 0.5; lR = -0.3; aL = -2.4; aR = -2.2; aLz = -0.4; aRz = 0.4; if (st.vy < 0) { aL = -1.0; aR = -1.1; aLz = -0.9; aRz = 0.9; lL = 0.2; lR = -0.1; } bob = 0; }
  if (st.swing) { aR = -3.0; aRz = 0.1; aL = -0.6; lL = 0.6; lR = 0.3; lean = 0; }
  if (st.push) { aL = aR = -1.4; aLz = 0.1; aRz = -0.1; lean = 0.35; }
  if (st.torch) { aL = Math.min(aL, -0.9); aLz = -0.2; }
  if (st.whip > 0) { const k = st.whip; aR = k > 0.5 ? -2.8 + (1 - k) * 4 : -2.8; aRz = 0.2; }
  if (st.wave) { aR = -2.7; aRz = 0.3 + Math.sin(r.t * 10) * 0.35; }
  if (st.hide) { lL = lR = -1.3; bob = -0.35; lean = 0.5; aL = aR = -0.8; }
  if (st.caught) { aL = aR = -2.9; aLz = -0.3; aRz = 0.3; r.body.position.y = Math.abs(Math.sin(r.t * 8)) * 0.08; }
  if (st.roll > 0) { r.body.rotation.x = (1 - st.roll) * PI * 2; r.body.position.y = 0.45 - Math.cos((1 - st.roll) * PI * 2) * 0.45 * 0; lL = lR = -1.6; aL = aR = -1.6; bob = -0.25; }
  const k = Math.min(1, dt * 18), L = (o, rx, rz = 0) => { o.rotation.x += (rx - o.rotation.x) * k; o.rotation.z += (rz - o.rotation.z) * k; };
  L(r.legL, lL); L(r.legR, lR); L(r.armL, aL, aLz); L(r.armR, aR, aRz);
  r.torso.rotation.x += (lean - r.torso.rotation.x) * k; r.body.position.y += bob; if (st.hide) r.torso.position.y = 0.8 - 0.35; else r.torso.position.y += (0.8 - r.torso.position.y) * k;
  if (st.hide) { r.legL.position.y = r.legR.position.y = 0.45; } else { r.legL.position.y = r.legR.position.y = 0.8; }
  r.head.rotation.y = Math.sin(r.t * 0.7) * 0.12 * (1 - run); r.torch.visible = !!st.torch; r.whipH.visible = st.whip > 0 || !!st.swing;
  if (st.torch) { const f = r.torch.userData.flame; const s = 1 + Math.sin(r.t * 23) * 0.08 + Math.sin(r.t * 31) * 0.06; f.scale.set(s, 1 + Math.sin(r.t * 17) * 0.12, s); } }
// ---------------------------------------------------------------- Relic Patrol (they think YOU did it)
export function makeOfficer(kind = 'officer') { const chief = kind === 'chief'; const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const b = MB(); const blue = chief ? 0x1e3a8a : 0x2563eb, skin = chief ? 0xf3c9a6 : 0xe0ac84;
  b.f.add(P.sphere, blue, 0, 0.95, 0, 0, 0, 0, 0.42, 0.48, 0.38);                                   // round tummy
  b.f.add(P.sphere, 0x111827, 0, 0.62, 0, 0, 0, 0, 0.36, 0.14, 0.32);
  for (let i = 0; i < 3; i++) b.x.add(P.sphere, 0xfacc15, 0, 1.2 - i * 0.17, 0.37 - i * 0.012, 0, 0, 0, 0.03);
  b.x.add(star(), 0xfacc15, -0.2, 1.18, 0.33, 0, -0.4, 0, 0.07, 0.07, 0.07);
  b.g.add(P.sphere, skin, 0, 1.55, 0.02, 0, 0, 0, 0.3, 0.29, 0.28); b.g.add(P.sphere, skin, 0, 1.5, 0.27, 0, 0, 0, 0.07, 0.06, 0.06);
  eyes(b, 1.6, 0.22, 0.1, 0.06, { brow: 0x3f2a1a, angry: true });
  b.m.add(P.capsule, chief ? 0xd1d5db : 0x3f2a1a, -0.09, 1.44, 0.27, 0, 0, PI / 2 + 0.25, 0.08, 0.16, 0.06); b.m.add(P.capsule, chief ? 0xd1d5db : 0x3f2a1a, 0.09, 1.44, 0.27, 0, 0, PI / 2 - 0.25, 0.08, 0.16, 0.06); // mustache
  b.f.add(rcyl(0.31, 0.15, 0.05, 32), blue, 0, 1.72, 0); b.f.add(P.sphere, 0x111827, 0, 1.73, 0.2, 0, 0, 0, 0.27, 0.03, 0.16); b.x.add(P.rboxS, 0xfacc15, 0, 1.8, 0.3, 0, 0, 0, 0.1, 0.09, 0.02);
  if (chief) { b.f.add(rcyl(0.33, 0.06, 0.02, 32), 0xfacc15, 0, 1.72, 0); b.m.add(P.cyl, 0x6b4423, 0.2, 1.42, 0.33, PI / 2, 0, 0, 0.03, 0.18, 0.03); b.m.add(P.sphere, 0x3b2412, 0.2, 1.42, 0.43, 0, 0, 0, 0.05); } // pipe
  const torso = toGroup(b); body.add(torso);
  const mk = (s, isLeg) => { const g = new THREE.Group(); const m = MB(); if (isLeg) { g.position.set(s * 0.17, 0.62, 0); m.f.add(P.capsule, 0x111827, 0, -0.25, 0, 0, 0, 0, 0.2, 0.3, 0.2); m.g.add(P.sphere, 0x111827, 0, -0.56, 0.06, 0, 0, 0, 0.13, 0.08, 0.18); }
    else { g.position.set(s * 0.43, 1.2, 0); m.f.add(P.capsule, blue, 0, -0.22, 0, 0, 0, 0, 0.18, 0.3, 0.18); m.g.add(P.sphere, 0xffffff, 0, -0.45, 0, 0, 0, 0, 0.09); } g.add(toGroup(m)); body.add(g); return g; };
  const lL = mk(-1, true), lR = mk(1, true), aL = mk(-1, false), aR = mk(1, false);
  // butterfly net (for catching "the thief")
  const net = (() => { const m = MB(); m.m.add(P.cyl, 0xa16207, 0, 0, 0, 0, 0, 0, 0.025, 1.2, 0.025); m.x.add(P.torus, 0xd1d5db, 0, 1.38, 0, PI / 2, 0, 0, 0.22, 0.22, 0.22); m.e.add(lathe([[0.22, 0], [0.18, -0.2], [0.08, -0.34], [0.001, -0.37]], 20, 'netbag'), 0xffffff, 0, 1.38, 0); return toGroup(m); })();
  net.position.set(0, -0.45, 0.05); net.rotation.x = 0.6; aR.add(net);
  const mark = (() => { const m = MB(); m.l.add(P.capsule, 0xff3b3b, 0, 0.18, 0, 0, 0, 0, 0.12, 0.28, 0.12, 0.8); m.l.add(P.sphere, 0xff3b3b, 0, -0.16, 0, 0, 0, 0, 0.08, 0.08, 0.08, 0.8); return toGroup(m, false); })(); mark.position.set(0, 2.35, 0); mark.visible = false; root.add(mark);
  const q = (() => { const m = MB(); m.l.add(torus(0.3, 20, PI * 1.3), 0xfde047, 0, 0.2, 0, 0, 0, -0.6, 0.14, 0.14, 0.14, 0.7); m.l.add(P.sphere, 0xfde047, 0, -0.12, 0, 0, 0, 0, 0.06, 0.06, 0.06, 0.7); return toGroup(m, false); })(); q.position.set(0, 2.35, 0); q.visible = false; root.add(q);
  const stars = (() => { const m = MB(); for (let i = 0; i < 4; i++) m.l.add(star(), 0xffe14d, Math.cos(i * PI / 2) * 0.5, 0, Math.sin(i * PI / 2) * 0.5, 0, 0, 0, 0.12, 0.12, 0.12, 0.8); return toGroup(m, false); })(); stars.position.set(0, 2.1, 0); stars.visible = false; root.add(stars);
  return { root, body, torso, legL: lL, legR: lR, armL: aL, armR: aR, net, mark, q, stars, t: Math.random() * 9 }; }
export function animOfficer(r, dt, speed, st) { r.t += dt; const run = Math.min(1, speed / 5), T = r.t * (5 + run * 7); const sw = Math.sin(T) * 0.8 * run;
  r.legL.rotation.x = sw; r.legR.rotation.x = -sw; r.armL.rotation.x = -sw; r.armR.rotation.x = st === 'chase' ? -1.6 + Math.sin(T) * 0.4 : sw * 0.6;
  r.body.position.y = Math.abs(Math.sin(T)) * 0.07 * run; r.body.rotation.z = st === 'dizzy' ? Math.sin(r.t * 6) * 0.2 : 0;
  r.mark.visible = st === 'chase'; r.q.visible = st === 'search'; r.stars.visible = st === 'dizzy'; if (r.stars.visible) r.stars.rotation.y += dt * 4;
  if (r.mark.visible) r.mark.position.y = 2.35 + Math.abs(Math.sin(r.t * 6)) * 0.1; }
// ---------------------------------------------------------------- Professor Vintage
export function vintageParts(b, y0 = 0, o = {}) { const coat = 0x6d28d9, coatD = 0x4c1d95, skin = 0xf0c8a8;
  if (!o.noLegs) { [-1, 1].forEach((s) => { b.f.add(P.capsule, 0x312e81, s * 0.12, y0 + 0.45, 0, 0, 0, 0, 0.14, 0.6, 0.14); b.g.add(P.sphere, 0x1f1235, s * 0.12, y0 + 0.06, 0.08, 0, 0, 0, 0.1, 0.07, 0.17); }); }
  b.f.add(lathe([[0.001, 0], [0.32, 0.02], [0.3, 0.3], [0.24, 0.62], [0.2, 0.8], [0.001, 0.85]], 32, 'vcoat'), coat, 0, y0 + 0.75, 0, 0, 0, 0, 1, 1, 0.8);
  b.f.add(P.sphere, coatD, 0, y0 + 1.1, 0.12, 0, 0, 0, 0.12, 0.3, 0.1); b.f.add(P.sphere, 0xffffff, 0, y0 + 1.4, 0.17, 0, 0, 0, 0.09, 0.08, 0.05);
  b.g.add(P.sphere, 0x22c55e, 0, y0 + 1.47, 0.22, 0, 0, 0, 0.07, 0.04, 0.03); [-1, 1].forEach((s) => b.g.add(P.sphere, 0x16a34a, s * 0.07, y0 + 1.47, 0.21, 0, 0, s * 0.4, 0.07, 0.045, 0.03)); // bow tie
  const hy = y0 + 1.82;
  b.g.add(P.sphere, skin, 0, hy, 0, 0, 0, 0, 0.24, 0.28, 0.23); b.g.add(P.sphere, skin, 0, hy - 0.04, 0.24, 0, 0, 0, 0.06, 0.1, 0.07); // long nose
  eyes(b, hy + 0.06, 0.18, 0.09, 0.055, { brow: 0xf8fafc, angry: true, iris: 0x4c1d95 });
  b.x.add(P.torus, 0xd4a017, 0.09, hy + 0.05, 0.23, 0, 0, 0, 0.07, 0.07, 0.07); b.e.add(P.sphere, 0xbfdbfe, 0.09, hy + 0.05, 0.23, 0, 0, 0, 0.065, 0.065, 0.015); // monocle
  b.m.add(P.cyl, 0xd4a017, 0.15, hy - 0.1, 0.18, 0.3, 0, 0.2, 0.004, 0.25, 0.004);
  [-1, 1].forEach((s) => { b.m.add(P.capsule, 0xf8fafc, s * 0.12, hy - 0.12, 0.22, 0, 0, PI / 2 + s * 0.3, 0.07, 0.2, 0.06); b.m.add(torus(0.3, 16, PI * 1.2), 0xf8fafc, s * 0.26, hy - 0.06, 0.2, 0, 0, s > 0 ? 0 : PI, 0.05, 0.05, 0.05); }); // curly mustache
  for (let i = 0; i < 8; i++) b.f.add(P.sphere, 0xf8fafc, Math.cos(i / 8 * PI * 2) * 0.24, hy + 0.12 + Math.sin(i * 1.3) * 0.05, Math.sin(i / 8 * PI * 2) * 0.2 - 0.04, 0, 0, 0, 0.11); // wild hair
  if (!o.noHat) { b.g.add(rcyl(0.15, 0.32, 0.03, 32), 0x1f1235, 0, hy + 0.2, -0.02, -0.15, 0, 0.1); b.g.add(rcyl(0.26, 0.03, 0.01, 32), 0x1f1235, 0, hy + 0.2, -0.02, -0.15, 0, 0.1); b.m.add(rcyl(0.155, 0.06, 0.01, 32), 0xa855f7, 0, hy + 0.23, -0.02, -0.15, 0, 0.1); }
  return hy; }
export function makeVintage() { const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const b = MB(); vintageParts(b, 0);
  [-1, 1].forEach((s) => b.f.add(P.capsule, 0x6d28d9, s * 0.33, 1.3, 0, 0, 0, s * 0.3, 0.14, 0.5, 0.14));
  b.m.add(P.cyl, 0x1f1235, 0.45, 0, 0.1, 0, 0, 0, 0.03, 1.1, 0.03); b.x.add(P.sphere, 0xd4a017, 0.45, 1.1, 0.1, 0, 0, 0, 0.06); body.add(toGroup(b)); return { root, body, t: 0 }; }
export function animVintage(r, dt, mood) { r.t += dt; r.body.position.y = Math.abs(Math.sin(r.t * 3)) * 0.05; r.body.rotation.y = Math.sin(r.t * 1.4) * 0.25; r.body.rotation.z = mood === 'laugh' ? Math.sin(r.t * 14) * 0.06 : 0; }
