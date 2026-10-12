// Grok Pup Town townsfolk: one parametric cartoon-dog builder covering 18 breeds (real smooth geometry: spheres, capsules,
// cones, tori merged per material), plus accessories (hats, sashes, scarves, glasses), a kitten, birds and the Dog-Bus.
import * as THREE from 'three';
import { P } from './geo.js?v=np10';
import { MB, toGroup } from './models.js?v=np10';
import { makeDog } from './models2.js?v=np10';
import { rcyl, sph, cyl, cone, torus, capsule, star } from './shapes.js?v=np10';
const PI = Math.PI;
// breed table: fur/dark/light colours, leg height, body length, girth, head radius, snout, ears, tail, extras
export const BREEDS = {
  corgi: { fur: 0xe8924a, dark: 0xc96f2a, light: 0xfffaf2, legH: 0.24, len: 0.62, g: 1.0, hr: 0.24, snout: 'med', ears: 'pointy', tail: 'puff', belly: 1 },
  poodle: { fur: 0xffe4ef, dark: 0xf5c2d8, light: 0xfff5fa, legH: 0.5, len: 0.42, g: 0.85, hr: 0.22, snout: 'long', ears: 'fluffy', tail: 'pom', poms: 1 },
  dalmatian: { fur: 0xfbfbfb, dark: 0x1f1f24, light: 0xffffff, legH: 0.56, len: 0.58, g: 0.95, hr: 0.23, snout: 'long', ears: 'floppyDark', tail: 'long', spots: 0x1f1f24 },
  pug: { fur: 0xe9cf9e, dark: 0x3a3030, light: 0xf3dfb5, legH: 0.27, len: 0.4, g: 1.18, hr: 0.27, snout: 'flat', ears: 'fold', tail: 'curl', mask: 0x3a3030, bigEye: 1.25 },
  husky: { fur: 0x6b7380, dark: 0x464c57, light: 0xf5f7fa, legH: 0.5, len: 0.58, g: 1.05, hr: 0.25, snout: 'med', ears: 'pointy', tail: 'plume', face: 1, iris: 0x60a5fa },
  dachshund: { fur: 0x9a4f22, dark: 0x6b3415, light: 0xc9824a, legH: 0.17, len: 0.82, g: 0.85, hr: 0.22, snout: 'long', ears: 'long', tail: 'long' },
  golden: { fur: 0xe8b25a, dark: 0xc98e3a, light: 0xf6d38f, legH: 0.52, len: 0.62, g: 1.05, hr: 0.25, snout: 'med', ears: 'floppy', tail: 'feather', ruff: 0xf3c675 },
  beagle: { fur: 0xb8763a, dark: 0x2b2b30, light: 0xfffaf2, legH: 0.4, len: 0.52, g: 1.0, hr: 0.23, snout: 'med', ears: 'long', tail: 'tipped', saddle: 0x2b2b30, belly: 1 },
  pomeranian: { fur: 0xf59e42, dark: 0xd97f24, light: 0xffc982, legH: 0.18, len: 0.36, g: 1.1, hr: 0.22, snout: 'short', ears: 'tiny', tail: 'plume', ruff: 0xf8b55e, fluffy: 1 },
  bulldog: { fur: 0xf6ead6, dark: 0xb5733a, light: 0xffffff, legH: 0.28, len: 0.5, g: 1.32, hr: 0.29, snout: 'flat', ears: 'rose', tail: 'stub', patch: 0xb5733a, jowl: 1 },
  shiba: { fur: 0xe07b39, dark: 0xc0602a, light: 0xfff1dc, legH: 0.42, len: 0.52, g: 1.0, hr: 0.24, snout: 'med', ears: 'pointy', tail: 'curl', face: 1, belly: 1 },
  chihuahua: { fur: 0xf3d6a4, dark: 0xd9b67c, light: 0xfff3dd, legH: 0.24, len: 0.32, g: 0.85, hr: 0.25, snout: 'short', ears: 'huge', tail: 'thin', bigEye: 1.4 },
  sheepdog: { fur: 0xf3f4f6, dark: 0x9ca3af, light: 0xffffff, legH: 0.44, len: 0.58, g: 1.2, hr: 0.27, snout: 'short', ears: 'hidden', tail: 'stub', shaggy: 1, saddle: 0x9ca3af },
  greatdane: { fur: 0x7d8796, dark: 0x5b6472, light: 0xd8dde4, legH: 0.86, len: 0.72, g: 1.0, hr: 0.26, snout: 'long', ears: 'floppy', tail: 'long' },
  collie: { fur: 0x23232a, dark: 0x15151a, light: 0xffffff, legH: 0.46, len: 0.56, g: 1.0, hr: 0.23, snout: 'med', ears: 'tipped', tail: 'feather', face: 1, belly: 1, ruff: 0xffffff },
  basset: { fur: 0xc07a3a, dark: 0x2b2b30, light: 0xfffaf2, legH: 0.2, len: 0.72, g: 1.08, hr: 0.25, snout: 'long', ears: 'xlong', tail: 'tipped', saddle: 0x2b2b30, belly: 1, droop: 1 },
  lab: { fur: 0x6b4226, dark: 0x4f2f19, light: 0x8a5a36, legH: 0.5, len: 0.6, g: 1.08, hr: 0.25, snout: 'med', ears: 'floppy', tail: 'long' },
  pupcorgi: { fur: 0xf0a560, dark: 0xd2803c, light: 0xfffaf2, legH: 0.2, len: 0.42, g: 1.05, hr: 0.27, snout: 'short', ears: 'pointy', tail: 'puff', belly: 1, bigEye: 1.35 },
};
const shade = (c, k) => { const C = new THREE.Color(c); C.multiplyScalar(k); return C.getHex(); };
// deterministic pseudo random per dog so spots don't change between reloads
function rng(seed) { let s = seed * 9301 + 49297; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
export function makePup(breed = 'corgi', o = {}) {
  if (breed === 'schnauzer') { const r = makeDog('schnauzer'); accessorize(r, o, { hy: 0.98, hr: 0.2, by: 0.64, len: 0.5, legH: 0.42 }); return r; }
  const B = Object.assign({}, BREEDS[breed] || BREEDS.corgi, o.tint || {}); const { fur, dark, light, legH, len } = B; const g = B.g, by = legH + 0.22 * g;
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const rnd = rng(o.seed || breed.length * 7 + 3);
  const fx = B.shaggy || B.fluffy ? 'f' : 'f';
  // ---- torso
  const t = MB(); t.f.add(P.sphere, fur, 0, by, 0, 0, 0, 0, 0.3 * g, 0.27 * g, len); t.f.add(P.sphere, B.belly ? light : fur, 0, by - 0.05 * g, len * 0.55, 0, 0, 0, 0.25 * g, 0.25 * g, 0.24 * g);
  if (B.belly) t.f.add(P.sphere, light, 0, by - 0.09 * g, 0.04, 0, 0, 0, 0.24 * g, 0.18 * g, len * 0.8);
  if (B.saddle) t.f.add(P.sphere, B.saddle, 0, by + 0.07 * g, -0.06, 0, 0, 0, 0.27 * g, 0.2 * g, len * 0.78);
  if (B.patch) { t.f.add(P.sphere, B.patch, 0.12 * g, by + 0.08 * g, -len * 0.25, 0, 0, 0.3, 0.2 * g, 0.18 * g, 0.28 * g); }
  if (B.spots) for (let i = 0; i < 16; i++) { const a = rnd() * PI * 2, u = (rnd() - 0.5) * 1.6; const nx = Math.cos(a) * Math.sqrt(1 - Math.min(0.95, u * u * 0.25)), ny = Math.sin(a); if (ny < -0.45) continue;
    t.f.add(P.sphere, B.spots, nx * 0.29 * g, by + ny * 0.26 * g, u * len * 0.55, 0, 0, 0, 0.055 + rnd() * 0.035, 0.055 + rnd() * 0.03, 0.06 + rnd() * 0.04); }
  if (B.ruff) for (let i = 0; i < 7; i++) { const a = -PI * 0.15 + i / 6 * PI * 1.3; t.f.add(P.sphere, B.ruff, Math.cos(a) * 0.2 * g, by + 0.02 + Math.sin(a) * 0.12 * g, len * 0.7, 0, 0, 0, 0.14 * g, 0.13 * g, 0.12 * g); }
  if (B.shaggy) for (let i = 0; i < 18; i++) { const a = rnd() * PI * 2, u = (rnd() - 0.5) * 1.7; t.f.add(P.sphere, rnd() < 0.3 && u < 0 ? B.saddle : fur, Math.cos(a) * 0.28 * g, by + Math.sin(a) * 0.24 * g, u * len * 0.55, 0, 0, 0, 0.13, 0.12, 0.14); }
  if (B.poms) { t.f.add(P.sphere, light, 0, by + 0.02, len * 0.5, 0, 0, 0, 0.3 * g, 0.3 * g, 0.28 * g); }
  body.add(toGroup(t));
  // ---- legs (pivot at hip/shoulder)
  const lx = 0.15 * g, legs = [[-lx, len * 0.6], [lx, len * 0.6], [-lx, -len * 0.6], [lx, -len * 0.6]].map(([x, z]) => { const lg = new THREE.Group(); lg.position.set(x, legH + 0.06, z); const b = MB();
    const lc = B.belly || breed === 'dalmatian' || breed === 'collie' ? light : fur; b.f.add(P.capsule, lc, 0, -legH * 0.5, 0, 0, 0, 0, 0.12 * Math.max(0.9, g * 0.9), legH * 0.55 + 0.02, 0.12 * Math.max(0.9, g * 0.9)); b.f.add(P.sphere, light, 0, -legH - 0.02, 0.035, 0, 0, 0, 0.085, 0.055, 0.105);
    if (B.poms) b.f.add(P.sphere, light, 0, -legH * 0.75, 0, 0, 0, 0, 0.12, 0.1, 0.12); if (B.shaggy) b.f.add(P.sphere, fur, 0, -legH * 0.6, 0.01, 0, 0, 0, 0.12, 0.17, 0.12);
    lg.add(toGroup(b)); body.add(lg); return lg; });
  // ---- tail
  const tail = new THREE.Group(); tail.position.set(0, by + 0.12 * g, -len * 0.92); body.add(tail); { const b = MB(), T = B.tail;
    if (T === 'puff') b.f.add(P.sphere, fur, 0, 0.0, -0.04, 0, 0, 0, 0.11, 0.1, 0.11);
    else if (T === 'pom') { b.f.add(P.capsule, fur, 0, 0.1, -0.02, -0.4, 0, 0, 0.05, 0.14, 0.05); b.f.add(P.sphere, light, 0, 0.24, -0.08, 0, 0, 0, 0.12); }
    else if (T === 'long' || T === 'thin') { b.f.add(P.capsule, fur, 0, 0.1, -0.12, -0.9, 0, 0, T === 'thin' ? 0.04 : 0.06, 0.3, T === 'thin' ? 0.04 : 0.06); }
    else if (T === 'tipped') { b.f.add(P.capsule, B.saddle || dark, 0, 0.14, -0.04, -0.3, 0, 0, 0.065, 0.2, 0.065); b.f.add(P.sphere, light, 0, 0.3, -0.09, 0, 0, 0, 0.06); }
    else if (T === 'curl') { b.f.add(torus(0.42, 20), fur, 0, 0.13, -0.02, 0, PI / 2, 0, 0.1, 0.1, 0.12); }
    else if (T === 'plume') { for (let i = 0; i < 5; i++) b.f.add(P.sphere, i > 2 ? light : fur, 0, 0.08 + i * 0.07, -0.02 + i * 0.045 * (breed === 'pomeranian' ? 1.6 : 0.6), 0, 0, 0, 0.11 - i * 0.008, 0.1, 0.11); }
    else if (T === 'feather') { b.f.add(P.capsule, fur, 0, 0.06, -0.15, -1.0, 0, 0, 0.09, 0.32, 0.07); b.f.add(P.capsule, B.ruff || light, 0, 0.0, -0.18, -1.1, 0, 0, 0.06, 0.28, 0.1); }
    else b.f.add(P.sphere, fur, 0, 0.02, -0.02, 0, 0, 0, 0.07);
    tail.add(toGroup(b)); }
  // ---- head
  const hr = B.hr, hy = by + 0.3 * g + hr * 0.3, head = new THREE.Group(); head.position.set(0, hy, len * 0.9 + 0.02); body.add(head); const h = MB(); const E = B.bigEye || 1;
  h.f.add(P.sphere, fur, 0, 0.03, 0, 0, 0, 0, hr, hr * 0.95, hr * 0.98);
  if (B.face) { h.f.add(P.sphere, light, 0, -0.02, hr * 0.35, 0, 0, 0, hr * 0.78, hr * 0.7, hr * 0.7); [-1, 1].forEach((s) => h.f.add(P.sphere, light, s * hr * 0.42, hr * 0.42, hr * 0.62, 0, 0, 0, hr * 0.14, hr * 0.1, hr * 0.08)); }
  if (B.mask) h.f.add(P.sphere, B.mask, 0, -0.04, hr * 0.62, 0, 0, 0, hr * 0.58, hr * 0.5, hr * 0.45);
  const sn = B.snout; let nz;
  if (sn === 'long') { h.f.add(P.capsule, B.face || breed === 'dalmatian' ? light : fur, 0, -0.05, hr * 0.95, PI / 2 - 0.12, 0, 0, hr * 0.48, hr * 0.7, hr * 0.42); h.f.add(P.sphere, light, 0, -0.1, hr * 1.1, 0, 0, 0, hr * 0.36, hr * 0.26, hr * 0.42); nz = hr * 1.55; h.g.add(P.sphere, 0x111111, 0, -0.01, nz, 0, 0, 0, 0.055, 0.045, 0.04); }
  else if (sn === 'med') { h.f.add(P.sphere, light, 0, -0.06, hr * 0.72, 0, 0, 0, hr * 0.52, hr * 0.42, hr * 0.55); nz = hr * 1.22; h.g.add(P.sphere, 0x111111, 0, -0.02, nz, 0, 0, 0, 0.05, 0.04, 0.035); }
  else if (sn === 'short') { h.f.add(P.sphere, light, 0, -0.07, hr * 0.7, 0, 0, 0, hr * 0.4, hr * 0.32, hr * 0.38); nz = hr * 1.04; h.g.add(P.sphere, 0x111111, 0, -0.04, nz, 0, 0, 0, 0.04, 0.032, 0.03); }
  else { h.f.add(P.sphere, B.mask || light, 0, -0.08, hr * 0.8, 0, 0, 0, hr * 0.56, hr * 0.4, hr * 0.3); nz = hr * 1.07; h.g.add(P.sphere, 0x111111, 0, -0.02, nz, 0, 0, 0, 0.06, 0.04, 0.03);
    if (B.jowl) [-1, 1].forEach((s) => h.f.add(P.sphere, light, s * hr * 0.3, -0.15, hr * 0.8, 0, 0, 0, hr * 0.32, hr * 0.28, hr * 0.26)); }
  // mouth smile line + blush
  h.g.add(torus(0.25, 16, PI), 0x3a2020, 0, -0.07 - (sn === 'long' ? 0.04 : 0), (nz || hr) - 0.02, PI, 0, 0, 0.035, 0.03, 0.03);
  [-1, 1].forEach((s) => h.g.add(P.sphere, 0xff9fb8, s * hr * 0.62, -hr * 0.12, hr * 0.66, 0, 0, 0, hr * 0.15, hr * 0.09, hr * 0.06));
  // eyes: glossy dark with two catch-lights (hidden under the fringe for sheepdogs)
  const ex = hr * 0.38, ey = hr * 0.22, ez = hr * 0.82, er = 0.05 * E * (hr / 0.24);
  if (!B.shaggy) [-1, 1].forEach((s) => { h.g.add(P.sphere, B.iris || 0x15151b, s * ex, ey, ez, 0, 0, 0, er, er * 1.12, er * 0.75); if (B.iris) h.g.add(P.sphere, 0x111111, s * ex, ey, ez + er * 0.4, 0, 0, 0, er * 0.5, er * 0.55, er * 0.4);
    h.l.add(P.sphere, 0xffffff, s * ex + er * 0.3, ey + er * 0.4, ez + er * 0.6, 0, 0, 0, er * 0.3, er * 0.3, er * 0.2, 0.7); h.l.add(P.sphere, 0xffffff, s * ex - er * 0.25, ey - er * 0.35, ez + er * 0.62, 0, 0, 0, er * 0.14, er * 0.14, er * 0.1, 0.5);
    if (B.droop) h.f.add(P.sphere, fur, s * ex, ey + er * 0.75, ez - 0.005, 0.3, 0, 0, er * 1.25, er * 0.6, er * 0.9); });
  if (B.shaggy) { for (let i = 0; i < 9; i++) { const a = -0.3 + i / 8 * (PI + 0.6); h.f.add(P.sphere, fur, Math.cos(a) * hr * 0.75, hr * 0.25 + Math.sin(a) * hr * 0.35, hr * 0.62, 0, 0, 0, hr * 0.3, hr * 0.26, hr * 0.26); } }
  // ears
  const ER = B.ears, ec = ER === 'floppyDark' ? B.spots : ER === 'tipped' ? dark : (B.saddle && ER === 'long') ? shade(fur, 0.8) : ER === 'xlong' ? shade(fur, 0.85) : fur;
  [-1, 1].forEach((s) => {
    if (ER === 'pointy') { h.f.add(P.cone, fur, s * hr * 0.55, hr * 1.02, -0.01, 0, 0, -s * 0.28, hr * 0.42, hr * 0.95, hr * 0.2); h.g.add(P.cone, 0xffb3c8, s * hr * 0.55, hr * 0.98, 0.022, 0, 0, -s * 0.28, hr * 0.25, hr * 0.62, hr * 0.06); }
    else if (ER === 'huge') { h.f.add(P.cone, fur, s * hr * 0.8, hr * 0.95, -0.01, 0, 0, -s * 0.6, hr * 0.6, hr * 1.25, hr * 0.18); h.g.add(P.cone, 0xffb3c8, s * hr * 0.8, hr * 0.92, 0.02, 0, 0, -s * 0.6, hr * 0.4, hr * 0.9, hr * 0.06); }
    else if (ER === 'tiny') h.f.add(P.cone, fur, s * hr * 0.5, hr * 0.92, 0.02, 0, 0, -s * 0.3, hr * 0.25, hr * 0.45, hr * 0.15);
    else if (ER === 'fold' || ER === 'rose') { h.f.add(P.sphere, ER === 'fold' ? (B.mask || dark) : dark, s * hr * 0.72, hr * 0.62, 0.02, 0.4, 0, s * 0.9, hr * 0.32, hr * 0.12, hr * 0.3); }
    else if (ER === 'floppy' || ER === 'floppyDark') { h.f.add(P.capsule, ec, s * hr * 0.92, -hr * 0.1, -0.02, 0, 0, s * 0.18, hr * 0.38, hr * 0.62, hr * 0.22); }
    else if (ER === 'long' || ER === 'xlong') { const L = ER === 'xlong' ? 1.5 : 1; h.f.add(P.capsule, ec, s * hr * 0.92, -hr * 0.28 * L, 0.0, 0, 0, s * 0.1, hr * 0.38, hr * 0.85 * L, hr * 0.62); }
    else if (ER === 'fluffy') { for (let k = 0; k < 3; k++) h.f.add(P.sphere, B.light, s * hr * 0.98, hr * 0.05 - k * hr * 0.32, -0.01, 0, 0, 0, hr * 0.32, hr * 0.3, hr * 0.3); }
    else if (ER === 'tipped') { h.f.add(P.cone, dark, s * hr * 0.55, hr * 0.92, 0.0, 0.5, 0, -s * 0.25, hr * 0.36, hr * 0.7, hr * 0.18); }
  });
  if (B.poms) h.f.add(P.sphere, light, 0, hr * 0.92, -0.02, 0, 0, 0, hr * 0.62, hr * 0.5, hr * 0.6);
  head.add(toGroup(h));
  const tongue = (() => { const b = MB(); b.g.add(P.capsule, 0xff6f91, 0, -0.04, 0, 0.3, 0, 0, 0.065, 0.08, 0.03); return toGroup(b); })(); tongue.position.set(0.015, -0.12 - (sn === 'long' ? 0.04 : 0), (nz || hr) - 0.06); head.add(tongue);
  const r = { root, body, head, legs, tail, tongue, t: Math.random() * 5, breed, curl: B.tail === 'curl' || B.tail === 'plume' };
  accessorize(r, o, { hy, hr, by, len, legH, g }); return r;
}
// hats sit on the head group; neckwear sits on the torso just behind the head
export function accessorize(r, o, d) { const hr = d.hr || 0.24; if (o.collar !== false) { const b = MB(); b.g.add(P.torus, o.collar || 0xff4fa0, 0, d.by + 0.16 * (d.g || 1), d.len * 0.76, PI / 2 - 0.5, 0, 0, 0.17 * (d.g || 1), 0.17 * (d.g || 1), 0.22); b.x.add(rcyl(0.05, 0.02, 0.008, 18), 0xffd23f, 0, d.by + 0.02, d.len * 0.9 + 0.02, PI / 2 - 0.3, 0, 0); r.body.add(toGroup(b)); }
  const hat = o.hat, neck = o.neck; const b = MB(), n = MB(); const top = hr * 0.98;
  if (hat === 'fire') { b.g.add(P.sphere, 0xdc2626, 0, top, 0, 0, 0, 0, hr * 0.8, hr * 0.5, hr * 0.85); b.g.add(P.cyl, 0xdc2626, 0, top - 0.04, -0.02, 0, 0, 0, hr * 1.1, 0.02, hr * 1.2); b.x.add(star(), 0xffd23f, 0, top + 0.03, hr * 0.78, 0, 0, 0, 0.06, 0.06, 0.06); }
  else if (hat === 'chef') { b.f.add(P.cyl, 0xffffff, 0, top + 0.06, 0, 0, 0, 0, hr * 0.62, 0.16, hr * 0.62); for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; b.f.add(P.sphere, 0xffffff, Math.cos(a) * hr * 0.4, top + 0.2, Math.sin(a) * hr * 0.4, 0, 0, 0, hr * 0.38); } }
  else if (hat === 'top') { b.g.add(P.cyl, 0x1f2937, 0, top + 0.1, 0, 0, 0, 0, hr * 0.55, 0.26, hr * 0.55); b.g.add(P.cyl, 0x1f2937, 0, top - 0.02, 0, 0, 0, 0, hr * 0.95, 0.03, hr * 0.95); b.g.add(P.cyl, 0xdc2626, 0, top + 0.02, 0, 0, 0, 0, hr * 0.57, 0.06, hr * 0.57); }
  else if (hat === 'beret') b.f.add(P.sphere, o.hatC || 0x7c3aed, hr * 0.15, top - 0.02, 0, 0, 0, 0.2, hr * 0.85, hr * 0.28, hr * 0.85);
  else if (hat === 'cap') { b.g.add(P.sphere, o.hatC || 0x2563eb, 0, top - 0.04, 0, 0, 0, 0, hr * 0.8, hr * 0.45, hr * 0.85); b.g.add(P.cyl, o.hatC || 0x2563eb, 0, top - 0.06, hr * 0.7, 0, 0, 0, hr * 0.55, 0.02, hr * 0.5); }
  else if (hat === 'crown') { b.x.add(P.cyl, 0xffc83d, 0, top + 0.02, 0, 0, 0, 0, hr * 0.55, 0.1, hr * 0.55); for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; b.x.add(P.cone, 0xffc83d, Math.cos(a) * hr * 0.5, top + 0.12, Math.sin(a) * hr * 0.5, 0, 0, 0, 0.04, 0.09, 0.04); } }
  else if (hat === 'bow') { [-1, 1].forEach((s) => b.g.add(P.sphere, o.hatC || 0xff4fa0, s * 0.07 + hr * 0.4, top - 0.02, 0.02, 0, 0, s * 0.5, 0.08, 0.05, 0.04)); b.g.add(P.sphere, o.hatC || 0xff4fa0, hr * 0.4, top - 0.02, 0.03, 0, 0, 0, 0.035); }
  else if (hat === 'flower') { for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; b.g.add(P.sphere, 0xff6fcf, hr * 0.45 + Math.cos(a) * 0.05, top - 0.05 + Math.sin(a) * 0.05, 0.05, 0, 0, 0, 0.04, 0.04, 0.02); } b.g.add(P.sphere, 0xffd23f, hr * 0.45, top - 0.05, 0.06, 0, 0, 0, 0.03); }
  else if (hat === 'party') { b.g.addFn(P.cone, (c, x, y) => c.set(Math.sin(y * 60) > 0 ? 0xff4fa0 : 0x3ff0ff), 0, top + 0.12, 0, -0.15, 0, 0, hr * 0.42, 0.3, hr * 0.42); b.f.add(P.sphere, 0xffd23f, 0, top + 0.28, 0.03, 0, 0, 0, 0.045); }
  else if (hat === 'grad') { b.g.add(P.rbox, 0x111827, 0, top + 0.06, 0, 0, PI / 4, 0, hr * 1.2, 0.03, hr * 1.2); b.g.add(P.cyl, 0x111827, 0, top - 0.03, 0, 0, 0, 0, hr * 0.5, 0.09, hr * 0.5); b.g.add(P.capsule, 0xffd23f, hr * 0.5, top - 0.02, hr * 0.3, 0, 0, 0, 0.015, 0.14, 0.015); }
  else if (hat === 'straw') { b.m.add(P.cyl, 0xf2d27a, 0, top - 0.02, 0, 0, 0, 0, hr * 1.25, 0.025, hr * 1.25); b.m.add(P.sphere, 0xf2d27a, 0, top, 0, 0, 0, 0, hr * 0.6, hr * 0.38, hr * 0.6); b.g.add(P.cyl, 0x22c55e, 0, top + 0.01, 0, 0, 0, 0, hr * 0.62, 0.04, hr * 0.62); }
  else if (hat === 'helmet') { b.g.add(P.sphere, o.hatC || 0xfacc15, 0, top - 0.03, 0, 0, 0, 0, hr * 0.85, hr * 0.55, hr * 0.9); }
  else if (hat === 'beanie') { b.f.add(P.sphere, o.hatC || 0x22c1c3, 0, top - 0.03, 0, 0, 0, 0, hr * 0.85, hr * 0.55, hr * 0.88); b.f.add(P.sphere, 0xffffff, 0, top + hr * 0.5, 0, 0, 0, 0, 0.05); }
  if (o.glasses) [-1, 1].forEach((s) => { b.x.add(P.torus, o.glasses === true ? 0x1f2937 : o.glasses, s * hr * 0.38, hr * 0.22, hr * 0.92, 0, 0, 0, 0.055, 0.055, 0.06); b.e.add(P.sphere, 0xdff6ff, s * hr * 0.38, hr * 0.22, hr * 0.93, 0, 0, 0, 0.05, 0.05, 0.015); });
  if (b.g.parts.length || b.f.parts.length || b.x.parts.length || b.m.parts.length) r.head.add(toGroup(b));
  const ny = d.by + 0.12 * (d.g || 1), nz = d.len * 0.72;
  if (neck === 'sash') { n.f.add(P.torus, 0xdc2626, 0, ny - 0.03, nz - 0.08, 0.2, 0, 0.7, 0.24 * (d.g || 1), 0.26, 0.3); n.x.add(rcyl(0.06, 0.02, 0.01, 20), 0xffd23f, -0.06, ny - 0.1, nz + 0.13, PI / 2 - 0.3, 0, 0); }
  else if (neck === 'scarf') { n.f.add(P.torus, o.neckC || 0x22c55e, 0, ny, nz, PI / 2 - 0.4, 0, 0, 0.2 * (d.g || 1), 0.2 * (d.g || 1), 0.42); n.f.add(P.capsule, o.neckC || 0x22c55e, 0.1, ny - 0.15, nz + 0.12, 0.3, 0, 0.2, 0.06, 0.18, 0.03); }
  else if (neck === 'bandana') { n.f.add(P.cone, o.neckC || 0xdc2626, 0, ny - 0.12, nz + 0.12, PI + 0.3, 0, 0, 0.18 * (d.g || 1), 0.22, 0.06); n.f.add(P.torus, o.neckC || 0xdc2626, 0, ny, nz, PI / 2 - 0.4, 0, 0, 0.18 * (d.g || 1), 0.18 * (d.g || 1), 0.25); }
  else if (neck === 'bowtie') { [-1, 1].forEach((s) => n.g.add(P.cone, o.neckC || 0x2563eb, s * 0.06, ny - 0.04, nz + 0.17, 0, 0, s * PI / 2, 0.05, 0.08, 0.035)); n.g.add(P.sphere, o.neckC || 0x2563eb, 0, ny - 0.04, nz + 0.18, 0, 0, 0, 0.03); }
  else if (neck === 'apron') { n.f.add(P.sphere, o.neckC || 0xffffff, 0, d.by - 0.05, d.len * 0.62, 0, 0, 0, 0.24 * (d.g || 1), 0.24, 0.12); }
  else if (neck === 'vest') { n.f.add(P.sphere, o.neckC || 0xf97316, 0, d.by + 0.02, 0.05, 0, 0, 0, 0.31 * (d.g || 1), 0.26 * (d.g || 1), d.len * 0.6); n.l.add(P.torus, 0xfff36b, 0, d.by + 0.02, 0.05, PI / 2, 0, 0, 0.31 * (d.g || 1), d.len * 0.3, 0.12, 0.4); }
  if (n.f.parts.length || n.g.parts.length) r.body.add(toGroup(n)); }
// moods: idle, happy (wag hard), walk/run (from speed), sit (rear tucked), play (bouncy hops), sleep
export function animPup(r, dt, speed, mode) { r.t += dt; const t = r.t, run = Math.min(1, speed / 5), f = 9 + run * 7;
  const sit = mode === 'sit' || mode === 'sleep';
  r.legs.forEach((l, i) => { l.rotation.x = sit ? (i < 2 ? -0.1 : -1.3) : Math.sin(t * f + (i < 2 ? 0 : PI) + (i % 2) * 0.4) * 0.7 * run; });
  r.body.rotation.x = sit ? -0.42 : 0; r.body.position.y = sit ? -0.06 : mode === 'play' ? Math.abs(Math.sin(t * 6)) * 0.22 : Math.abs(Math.sin(t * f)) * 0.05 * run + Math.sin(t * 2.4) * 0.005;
  const wag = mode === 'happy' || mode === 'play' ? 26 : 10; if (r.curl) r.tail.rotation.y = Math.sin(t * wag) * 0.35; else r.tail.rotation.z = Math.sin(t * wag) * 0.6;
  r.head.rotation.x = mode === 'sleep' ? 0.5 : (sit ? 0.35 : 0) + Math.sin(t * 2.6) * 0.06; r.head.rotation.z = mode === 'happy' ? Math.sin(t * 4) * 0.18 : Math.sin(t * 0.9) * 0.05; r.tongue.visible = mode === 'happy' || mode === 'play' || run > 0.5; }
// ---------------- Mittens the kitten (stuck up a tree)
export function makeKitten() { const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const b = MB(), o = 0xf59e42, w = 0xfff5e6;
  b.f.add(P.sphere, o, 0, 0.28, 0, 0, 0, 0, 0.18, 0.17, 0.26); b.f.add(P.sphere, w, 0, 0.24, 0.12, 0, 0, 0, 0.13, 0.13, 0.13); b.f.add(P.sphere, o, 0, 0.5, 0.2, 0, 0, 0, 0.17, 0.15, 0.15); b.f.add(P.sphere, w, 0, 0.46, 0.31, 0, 0, 0, 0.09, 0.07, 0.06);
  [-1, 1].forEach((s) => { b.f.add(P.cone, o, s * 0.1, 0.64, 0.18, 0, 0, -s * 0.3, 0.06, 0.12, 0.04); b.g.add(P.sphere, 0x2f855a, s * 0.06, 0.53, 0.33, 0, 0, 0, 0.032, 0.04, 0.02); b.l.add(P.sphere, 0xffffff, s * 0.06 + 0.01, 0.545, 0.345, 0, 0, 0, 0.01, 0.01, 0.006, 0.6);
    [-1, 1].forEach((t) => b.f.add(P.capsule, w, s * 0.09, 0.08, t * 0.15, 0, 0, 0, 0.07, 0.14, 0.07)); for (let k = -1; k <= 1; k += 2) b.m.add(P.cyl, 0xffffff, s * 0.12, 0.46 + k * 0.012, 0.3, 0, 0, s * PI / 2 + k * 0.1, 0.004, 0.12, 0.004); });
  b.g.add(P.sphere, 0xff8fab, 0, 0.475, 0.355, 0, 0, 0, 0.02, 0.015, 0.012); for (let i = 0; i < 3; i++) b.f.add(P.sphere, 0xd97f24, 0, 0.42, -0.08 + i * 0.09, 0, 0, 0, 0.12, 0.04, 0.03);
  body.add(toGroup(b)); const tail = new THREE.Group(); tail.position.set(0, 0.32, -0.24); const tb = MB(); tb.f.add(P.capsule, o, 0, 0.18, -0.04, -0.3, 0, 0, 0.05, 0.36, 0.05); tail.add(toGroup(tb)); body.add(tail); return { root, body, tail, t: 0 }; }
// ---------------- songbirds (one instanced flock per colour handled by the game)
export function birdGeo() { const b = MB(); b.g.add(P.sphere, 0xffffff, 0, 0, 0, 0, 0, 0, 0.12, 0.11, 0.18); b.g.add(P.sphere, 0xffffff, 0, 0.06, 0.13, 0, 0, 0, 0.08); b.g.add(P.cone, 0xffb020, 0, 0.05, 0.24, PI / 2, 0, 0, 0.025, 0.07, 0.025);
  [-1, 1].forEach((s) => b.g.add(P.sphere, 0xffffff, s * 0.14, 0.02, 0, 0, 0, s * 0.3, 0.16, 0.025, 0.09)); b.g.add(P.sphere, 0xffffff, 0, 0.02, -0.18, 0, 0, 0, 0.06, 0.02, 0.1); const g = toGroup(b); return g.children[0].geometry; }
// ---------------- the Dog-Bus: a long happy sausage-dog bus with floppy ears, wagging tail and round windows
export function makeDogBus() { const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const b = MB(), Y = 0xffc93c, Br = 0x9a4f22;
  b.g.add(P.capsule, Y, 0, 1.55, 0, PI / 2, 0, 0, 2.2, 6.2, 2.0); b.g.add(P.capsule, 0xffa928, 0, 0.95, 0, PI / 2, 0, 0, 2.25, 6.25, 0.5);
  for (let i = 0; i < 5; i++) [-1, 1].forEach((s) => { b.e.add(P.sphere, 0xbfe9ff, s * 1.08, 1.85, -2.6 + i * 1.3, 0, 0, 0, 0.08, 0.42, 0.42); b.g.add(P.torus, 0xffffff, s * 1.08, 1.85, -2.6 + i * 1.3, 0, PI / 2, 0, 0.44, 0.44, 0.5); });
  // head at the front (+z) with snout, nose, eyes, ears
  b.g.add(P.sphere, Y, 0, 2.15, 4.1, 0, 0, 0, 1.0, 0.95, 0.9); b.g.add(P.sphere, 0xfff1c9, 0, 1.75, 4.85, 0, 0, 0, 0.6, 0.45, 0.5); b.g.add(P.sphere, 0x111111, 0, 1.95, 5.3, 0, 0, 0, 0.18, 0.14, 0.12);
  b.g.add(torus(0.25, 16, PI), 0x3a2020, 0, 1.62, 5.22, PI, 0, 0, 0.18, 0.15, 0.15); [-1, 1].forEach((s) => { b.g.add(P.sphere, 0x15151b, s * 0.38, 2.45, 4.82, 0, 0, 0, 0.14, 0.17, 0.1); b.l.add(P.sphere, 0xffffff, s * 0.38 + 0.05, 2.52, 4.9, 0, 0, 0, 0.05, 0.05, 0.03, 0.7);
    b.g.add(P.sphere, 0xff9fb8, s * 0.6, 2.0, 4.75, 0, 0, 0, 0.15, 0.08, 0.05); b.l.add(P.sphere, 0xfff4b0, s * 0.85, 1.05, 4.2, 0, 0, 0, 0.22, 0.18, 0.1, 0.8); b.g.add(P.sphere, 0xff4040, s * 0.85, 1.05, -4.25, 0, 0, 0, 0.18, 0.14, 0.1); });
  b.g.add(P.rbox, 0xff4fa0, 0, 3.75, 0.3, 0, 0, 0, 2.2, 0.55, 0.12); b.x.add(P.rbox, 0x64748b, 0, 3.45, 0.3, 0, 0, 0, 0.1, 0.4, 0.1);
  for (let i = 0; i < 3; i++) [-1, 1].forEach((s) => { b.m.add(P.torus, 0x1f2937, s * 1.0, 0.55, -2.8 + i * 2.8, 0, PI / 2, 0, 0.42, 0.42, 0.9); b.x.add(P.cyl, 0xe5e7eb, s * 1.05, 0.55, -2.8 + i * 2.8, 0, 0, PI / 2, 0.22, 0.1, 0.22); });
  b.e.add(P.sphere, 0xbfe9ff, 0, 2.3, 3.2, 0, 0, 0, 0.9, 0.45, 0.25); body.add(toGroup(b));
  const ears = [-1, 1].map((s) => { const e = new THREE.Group(); e.position.set(s * 0.82, 2.75, 4.0); const eb = MB(); eb.g.add(P.capsule, Br, 0, -0.45, 0, 0, 0, s * 0.15, 0.42, 0.9, 0.18); e.add(toGroup(eb)); body.add(e); return e; });
  const tail = new THREE.Group(); tail.position.set(0, 2.4, -4.2); const tb = MB(); tb.g.add(P.capsule, Y, 0, 0.5, -0.2, -0.5, 0, 0, 0.2, 0.9, 0.2); tail.add(toGroup(tb)); body.add(tail);
  return { root, body, ears, tail, t: 0 }; }
