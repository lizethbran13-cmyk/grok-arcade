// Characters & creatures: smooth high-poly cartoon models built from merged primitives, with animation rigs.
import * as THREE from 'three';
import { Builder, P } from './geo.js?v=ph11';
import { MATS } from './mats.js?v=ph11';
import { compact } from './compact.js?v=ph11';
import { rcyl, lathe, sph, cyl, cone, torus, capsule, tube, leaf, wedge, gear, heart, star, blobGeo } from './shapes.js?v=ph11';
const PI = Math.PI;
// multi-material builder -> group of meshes
function MB() { return { f: new Builder(), g: new Builder(), m: new Builder(), x: new Builder(), l: new Builder(), e: new Builder() }; }
function toGroup(b, shadow = true) { const g = new THREE.Group(); for (const k of Object.keys(b)) { if (!b[k].parts.length) continue; const m = new THREE.Mesh(compact(b[k].build(), k), MATS[k]); m.castShadow = shadow && k !== 'l' && k !== 'e'; m.receiveShadow = k !== 'l'; g.add(m); } return g; }
function eyes(b, y, z, sep, r, opt = {}) {
  [-1, 1].forEach((sd) => { const x = sd * sep;
    if (opt.closed === sd) { b.g.add(torus(0.28, 16, PI), 0x2a1d1d, x, y - r * 0.2, z + r * 0.45, 0, 0, 0, r * 0.75, r * 0.6, r * 0.6); return; }
    b.g.add(P.sphere, 0xffffff, x, y, z, 0, 0, 0, r, r * 1.12, r * 0.7);
    b.g.add(P.sphere, opt.iris || 0x1b1b24, x, y - r * 0.05, z + r * 0.42, 0, 0, 0, r * 0.62, r * 0.7, r * 0.38);
    b.l.add(P.sphere, 0xffffff, x + r * 0.2, y + r * 0.3, z + r * 0.7, 0, 0, 0, r * 0.2, r * 0.2, r * 0.12, 0.3);
    if (opt.brow) b.g.add(P.capsule, opt.brow, x, y + r * 1.25, z + r * 0.2, 0, 0, sd * (opt.angry ? 0.5 : -0.15), r * 0.35, r * 1.3, r * 0.35);
  });
}
// ---------------------------------------------------------------- rats
export const RAT_COL = { luna: { fur: 0xa9afbd, dark: 0x7d8394, belly: 0xeceef3, eye: 0x1b1b24, name: 'Luna' }, pirat: { fur: 0xc99a6b, dark: 0x9c7148, belly: 0xf6e7d4, eye: 0x1b1b24, name: 'Pi-rat' }, snowie: { fur: 0xfbfbff, dark: 0xe3e1ee, belly: 0xffffff, eye: 0xd0315a, name: 'Snowie' },
  brownie: { fur: 0x9a6a45, dark: 0x6f4a2e, belly: 0xf1dcc4, eye: 0x1b1b24 }, ash: { fur: 0x5b5f6b, dark: 0x3f424c, belly: 0xd8dae0, eye: 0x1b1b24 }, ginger: { fur: 0xe08a3c, dark: 0xb0652a, belly: 0xffe7c8, eye: 0x1b1b24 },
  cocoa: { fur: 0x6b4a3a, dark: 0x4a3226, belly: 0xe9d3c0, eye: 0x1b1b24 }, cream: { fur: 0xf1ddb0, dark: 0xd4b985, belly: 0xfff6e2, eye: 0x1b1b24 }, black: { fur: 0x2e2f36, dark: 0x1e1f24, belly: 0x9ea2ad, eye: 0x101014 },
  blue: { fur: 0x8a9bb8, dark: 0x66779a, belly: 0xe8eef8, eye: 0x1b1b24 }, rose: { fur: 0xd9a0a8, dark: 0xb57d86, belly: 0xfbe9ec, eye: 0x1b1b24 }, gold: { fur: 0xffcf3a, dark: 0xd4a017, belly: 0xfff1a8, eye: 0x1b1b24 } };
// opts: { pack: colour or false, extras: ['coat','tie','glasses','headset','patch','bow','clip'] }
export function makeRat(id, outfit, opts = {}) {
  const C = RAT_COL[id] || RAT_COL.luna; const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const t = MB(); // torso
  t.f.add(P.sphere, C.fur, 0, 0.36, -0.08, 0, 0, 0, 0.36, 0.31, 0.5);
  t.f.add(P.sphere, C.fur, 0, 0.38, -0.36, 0, 0, 0, 0.33, 0.29, 0.32);
  t.f.add(P.sphere, C.belly, 0, 0.27, 0.06, 0, 0, 0, 0.27, 0.2, 0.38);
  if (id === 'luna') t.f.add(P.sphere, C.dark, 0, 0.55, -0.15, 0, 0, 0, 0.26, 0.12, 0.42); // darker saddle
  if (id === 'pirat') { t.f.add(P.sphere, 0xffffff, 0, 0.5, 0.18, 0, 0, 0, 0.24, 0.16, 0.2); }
  // Ratita Industries backpack
  const X = opts.extras || [];
  if (opts.pack !== false) { const pc = opts.pack || 0xff4fa0; t.g.add(P.rbox, pc, 0, 0.66, -0.2, 0, 0, 0, 0.36, 0.22, 0.34); t.g.add(P.rboxS, 0xffd23f, 0, 0.78, -0.2, 0, 0, 0, 0.3, 0.06, 0.28);
    t.l.add(P.sphere, 0x3ff0ff, 0, 0.7, -0.38, 0, 0, 0, 0.06, 0.06, 0.03, 0.8); [-1, 1].forEach((s) => t.g.add(P.torus, pc, s * 0.2, 0.52, -0.08, 0, PI / 2, 0, 0.14, 0.2, 0.2)); }
  if (X.includes('coat')) { t.f.add(P.sphere, 0xf8fafc, 0, 0.42, -0.16, 0, 0, 0, 0.39, 0.3, 0.56); t.f.add(P.sphere, 0xf8fafc, 0, 0.44, 0.2, 0, 0, 0, 0.3, 0.27, 0.16); [-1, 1].forEach((s) => t.f.add(P.capsule, 0xe2e8f0, s * 0.13, 0.5, 0.27, 0.9, 0, s * 0.5, 0.07, 0.16, 0.05)); t.g.add(P.sphere, 0x3b82f6, 0.2, 0.47, 0.18, 0, 0, 0, 0.03, 0.05, 0.02); t.g.add(P.sphere, 0xef4444, 0.22, 0.48, 0.15, 0, 0, 0, 0.025, 0.05, 0.02); }
  if (X.includes('tie')) { t.g.add(P.sphere, opts.tie || 0xdc2626, 0, 0.36, 0.32, 0, 0, 0, 0.05, 0.05, 0.04); t.g.add(P.cone, opts.tie || 0xdc2626, 0, 0.24, 0.3, PI, 0, 0, 0.06, 0.18, 0.03); }
  if (X.includes('bow')) [-1, 1].forEach((s) => t.g.add(P.cone, opts.tie || 0x7c3aed, s * 0.06, 0.36, 0.33, 0, 0, s * PI / 2, 0.05, 0.1, 0.04));
  if (X.includes('vest')) { t.f.add(P.sphere, opts.vest || 0xf97316, 0, 0.4, -0.06, 0, 0, 0, 0.375, 0.29, 0.42); t.l.add(P.torus, 0xfff36b, 0, 0.4, -0.05, PI / 2, 0, 0, 0.37, 0.42, 0.25, 0.3); }
  const torso = toGroup(t); body.add(torso);
  // head
  const head = new THREE.Group(); head.position.set(0, 0.48, 0.36); body.add(head);
  const h = MB();
  h.f.add(P.sphere, C.fur, 0, 0, 0, 0, 0, 0, 0.27, 0.25, 0.27);
  h.f.add(P.sphere, C.fur, 0, -0.05, 0.2, 0.25, 0, 0, 0.17, 0.15, 0.22);
  h.f.add(P.sphere, C.belly, 0, -0.1, 0.25, 0.25, 0, 0, 0.12, 0.08, 0.15);
  h.g.add(P.sphere, 0xff8fb0, 0, -0.03, 0.42, 0, 0, 0, 0.055, 0.045, 0.045);
  [-1, 1].forEach((sd) => { h.f.add(P.sphere, C.dark, sd * 0.2, 0.2, -0.04, 0, sd * 0.3, sd * -0.35, 0.15, 0.15, 0.04); h.g.add(P.sphere, 0xffb3c8, sd * 0.2, 0.2, -0.015, 0, sd * 0.3, sd * -0.35, 0.1, 0.1, 0.02);
    for (let i = -1; i <= 1; i++) h.m.add(P.cyl, 0x5a4a5a, sd * 0.2, -0.06 + i * 0.03, 0.32, 0, sd * 0.25, PI / 2 + sd * i * 0.2, 0.006, 0.3, 0.006);
    h.g.add(P.sphere, 0xff9fbf, sd * 0.16, -0.08, 0.2, 0, 0, 0, 0.05, 0.03, 0.03); });
  eyes(h, 0.05, 0.19, 0.11, 0.072, { iris: C.eye, closed: id === 'pirat' ? 1 : 0 });
  h.g.add(P.sphere, 0xffffff, -0.025, -0.13, 0.34, 0, 0, 0, 0.025, 0.035, 0.012); h.g.add(P.sphere, 0xffffff, 0.025, -0.13, 0.34, 0, 0, 0, 0.025, 0.035, 0.012); // teeth
  if (X.includes('glasses')) { [-1, 1].forEach((sd) => h.x.add(P.torus, opts.glass || 0x1f2937, sd * 0.11, 0.05, 0.255, 0, 0, 0, 0.085, 0.085, 0.12)); h.x.add(P.cyl, opts.glass || 0x1f2937, 0, 0.06, 0.265, 0, 0, PI / 2, 0.012, 0.06, 0.012); }
  if (X.includes('patch')) { h.g.add(P.sphere, 0x111111, 0.11, 0.05, 0.25, 0, 0, 0, 0.08, 0.075, 0.03); h.g.add(P.torus, 0x111111, 0, 0.09, 0.02, 0.35, 0, 0.35, 0.29, 0.27, 0.06); }
  if (X.includes('headset')) { h.g.add(P.torus, 0x334155, 0, 0.05, 0, 0, PI / 2, 0, 0.28, 0.27, 0.1); h.g.add(P.sphere, 0x334155, -0.27, 0.0, 0.02, 0, 0, 0, 0.06, 0.07, 0.07); h.g.add(P.cyl, 0x334155, -0.18, -0.08, 0.18, 0.2, 0.9, 0, 0.012, 0.25, 0.012); h.l.add(P.sphere, 0x3ff0ff, -0.08, -0.1, 0.3, 0, 0, 0, 0.025, 0.025, 0.025, 0.5); }
  head.add(toGroup(h));
  // feet
  const feet = []; const fb = new Builder(); fb.add(P.sphere, 0xffb3c8, 0, 0.05, 0.04, 0, 0, 0, 0.08, 0.05, 0.11); fb.add(P.sphere, C.fur, 0, 0.12, 0, 0, 0, 0, 0.09, 0.09, 0.09); const fg = fb.build();
  [[-0.2, 0.2], [0.2, 0.2], [-0.22, -0.32], [0.22, -0.32]].forEach(([x, z]) => { const m = new THREE.Mesh(fg, MATS.f); m.castShadow = true; m.position.set(x, 0, z); body.add(m); feet.push(m); });
  // tail (CPU-bent tube)
  const TL = 0.95, tg = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -TL)), 24, 0.045, 8, false);
  { const p = tg.attributes.position; for (let i = 0; i < p.count; i++) { const k = -p.getZ(i) / TL, s = 1 - k * 0.7; p.setX(i, p.getX(i) * s); p.setY(i, p.getY(i) * s); } }
  const tailBase = Float32Array.from(tg.attributes.position.array); tg.computeVertexNormals();
  const tail = new THREE.Mesh(tg, MATS.g); tail.castShadow = true; tail.position.set(0, 0.32, -0.62); body.add(tail); tg.attributes.position.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0, c = new Float32Array(tg.attributes.position.count * 3); i < 1; i++) { c.fill(1); tg.setAttribute('color', new THREE.BufferAttribute(c.map((v, j) => [1, 0.72, 0.8][j % 3]), 3)); }
  // gadgets
  const glider = (() => { const b = MB(); const s = new THREE.Shape(); s.moveTo(0, 0.25); s.bezierCurveTo(0.6, 0.3, 1.1, 0.1, 1.2, -0.2); s.lineTo(0, -0.1); s.lineTo(-1.2, -0.2); s.bezierCurveTo(-1.1, 0.1, -0.6, 0.3, 0, 0.25);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 16 }); g.rotateX(-PI / 2);
    b.g.addFn(g, (c, x) => c.set(Math.abs(x) > 0.8 ? 0xffd23f : 0xff4fa0), 0, 0, 0); b.l.add(P.sphere, 0x3ff0ff, 0, 0.03, 0.05, 0, 0, 0, 0.07, 0.03, 0.07, 1); b.x.add(P.cyl, 0x9ca3af, 0, -0.2, 0, 0, 0, 0, 0.02, 0.4, 0.02); return toGroup(b); })();
  glider.position.set(0, 1.0, -0.15); glider.visible = false; body.add(glider);
  const blaster = (() => { const b = MB(); b.g.add(P.capsule, 0xffd23f, 0, 0, 0, PI / 2, 0, 0, 0.12, 0.32, 0.12); b.g.add(P.cyl, 0xff4fa0, 0, 0, 0.22, PI / 2, 0, 0, 0.09, 0.12, 0.09); b.l.add(P.sphere, 0xfff07a, 0, 0, 0.3, 0, 0, 0, 0.06, 0.06, 0.03, 1); return toGroup(b); })();
  blaster.position.set(0.3, 0.42, 0.15); body.add(blaster);
  const hat = new THREE.Group(); hat.position.set(0, 0.24, 0); head.add(hat); setOutfit({ hat }, outfit);
  if (opts.noBlaster) blaster.visible = false;
  const rig = { root, body, head, feet, tail, tailBase, TL, glider, blaster, hat, t: Math.random() * 10, id };
  return rig;
}
export function setOutfit(rig, o) { const hat = rig.hat; while (hat.children.length) hat.remove(hat.children[0]); if (!o || o === 'none') return; const b = MB();
  if (o === 'hardhat') { b.g.add(P.sphere, 0xffd23f, 0, 0.02, 0, 0, 0, 0, 0.24, 0.17, 0.24); b.g.add(P.cyl, 0xffd23f, 0, -0.02, 0.05, 0, 0, 0, 0.3, 0.03, 0.3); b.l.add(P.sphere, 0xffffff, 0, 0.08, 0.22, 0, 0, 0, 0.05, 0.05, 0.03, 1); }
  else if (o === 'crown') { b.x.add(P.cyl, 0xffc83d, 0, 0.05, 0, 0, 0, 0, 0.16, 0.12, 0.16); for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; b.x.add(P.cone, 0xffc83d, Math.cos(a) * 0.14, 0.15, Math.sin(a) * 0.14, 0, 0, 0, 0.05, 0.1, 0.05); b.g.add(P.sphere, [0xff4fa0, 0x3ff0ff, 0x4ade80][i % 3], Math.cos(a) * 0.16, 0.06, Math.sin(a) * 0.16, 0, 0, 0, 0.03); } }
  else if (o === 'party') { b.g.addFn(P.cone, (c, x, y) => c.set(Math.sin(y * 60) > 0 ? 0xff4fa0 : 0x3ff0ff), 0, 0.15, 0, -0.2, 0, 0, 0.13, 0.32, 0.13); b.f.add(P.sphere, 0xffd23f, 0, 0.32, 0.05, 0, 0, 0, 0.05); }
  else if (o === 'goggles') { [-1, 1].forEach((s) => { b.x.add(P.torus, 0x6b7280, s * 0.1, -0.18, 0.2, 0, 0, 0, 0.07, 0.07, 0.1); b.e.add(P.sphere, 0x3ff0ff, s * 0.1, -0.18, 0.21, 0, 0, 0, 0.065, 0.065, 0.03); }); b.m.add(P.torus, 0x3b2a1a, 0, -0.18, 0, PI / 2, 0, 0, 0.27, 0.27, 0.12); }
  else if (o === 'pirate') { b.f.add(P.sphere, 0xdc2626, 0, 0.0, 0, 0, 0, 0, 0.26, 0.12, 0.26); for (let i = 0; i < 6; i++) b.g.add(P.sphere, 0xffffff, Math.cos(i) * 0.2, 0.02, Math.sin(i) * 0.2, 0, 0, 0, 0.025); b.f.add(P.cone, 0xdc2626, 0.15, -0.02, -0.2, 1.2, 0, 0.6, 0.06, 0.18, 0.06); }
  else if (o === 'cape') { b.f.add(P.sphere, 0x7c3aed, 0, -0.5, -0.45, 0.4, 0, 0, 0.3, 0.05, 0.3); }
  else if (o === 'chef') { b.f.add(P.cyl, 0xffffff, 0, 0.05, 0, 0, 0, 0, 0.17, 0.14, 0.17); b.f.add(P.sphere, 0xffffff, 0, 0.2, 0, 0, 0, 0, 0.22, 0.12, 0.22); }
  else if (o === 'flower') { for (let i = 0; i < 6; i++) b.g.add(P.sphere, 0xff6fcf, 0.12 + Math.cos(i) * 0.06, 0.02 + Math.sin(i) * 0.06, 0.05, 0, 0, 0, 0.045, 0.045, 0.02); b.g.add(P.sphere, 0xffd23f, 0.12, 0.02, 0.06, 0, 0, 0, 0.035); }
  else if (o === 'wizard') { b.f.add(P.cone, 0x4338ca, 0, 0.2, -0.03, -0.25, 0, 0, 0.2, 0.45, 0.2); b.f.add(P.cyl, 0x4338ca, 0, 0, 0, 0, 0, 0, 0.3, 0.03, 0.3); b.l.add(P.sphere, 0xffd23f, 0.05, 0.2, 0.12, 0, 0, 0, 0.04, 0.04, 0.02, 1); }
  else if (o === 'astro') { b.e.add(P.sphere, 0xcfefff, 0, -0.18, 0.05, 0, 0, 0, 0.42, 0.4, 0.45); b.x.add(P.torus, 0xe5e7eb, 0, -0.45, 0, PI / 2, 0, 0, 0.3, 0.3, 0.4); }
  else if (o === 'propeller') { b.g.add(P.sphere, 0xff4fa0, 0, -0.02, 0, 0, 0, 0, 0.23, 0.14, 0.23); for (let i = 0; i < 6; i++) b.g.add(P.sphere, [0xffc93c, 0x22d3ee][i % 2], Math.cos(i / 6 * PI * 2) * 0.12, 0.06, Math.sin(i / 6 * PI * 2) * 0.12, 0, 0, 0, 0.09, 0.07, 0.09); b.g.add(P.rbox, 0xff4fa0, 0, -0.08, 0.2, -0.2, 0, 0, 0.26, 0.03, 0.14); b.x.add(P.cyl, 0x94a3b8, 0, 0.16, 0, 0, 0, 0, 0.015, 0.1, 0.015);
    const pb = MB(); pb.g.add(P.rbox, 0xffc93c, 0, 0, 0, 0, 0, 0, 0.42, 0.02, 0.07); pb.g.add(P.rbox, 0x22d3ee, 0, 0.005, 0, 0, PI / 2, 0, 0.42, 0.02, 0.07); pb.x.add(P.sphere, 0xff4fa0, 0, 0.02, 0, 0, 0, 0, 0.035); const pr = toGroup(pb, false); pr.name = 'prop'; pr.position.y = 0.22; hat.add(pr); }
  else if (o === 'ratears') { b.x.add(P.torus, 0x334155, 0, -0.05, 0, 0, 0, 0, 0.22, 0.22, 0.12); [-1, 1].forEach((s) => { b.g.add(P.sphere, 0xa9afbd, s * 0.2, 0.12, 0, 0, 0, s * -0.3, 0.13, 0.13, 0.04); b.g.add(P.sphere, 0xffb3c8, s * 0.2, 0.12, 0.025, 0, 0, s * -0.3, 0.095, 0.095, 0.03); }); }
  else if (o === 'cheesecrown') { b.x.add(P.cyl, 0xffc83d, 0, 0.05, 0, 0, 0, 0, 0.17, 0.13, 0.17); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; b.x.add(P.cone, 0xffc83d, Math.cos(a) * 0.15, 0.17, Math.sin(a) * 0.15, 0, 0, 0, 0.05, 0.12, 0.05); b.g.add(P.sphere, 0xffe066, Math.cos(a) * 0.172, 0.06, Math.sin(a) * 0.172, 0, 0, 0, 0.035); }
    b.g.add(P.sphere, 0xffd23f, 0, 0.17, 0, 0, 0, 0, 0.09, 0.07, 0.09); [[0.07, 0.19, 0.06], [-0.05, 0.2, 0.04]].forEach(([x, y, z]) => b.m.add(P.sphere, 0xe0a800, x, y, z, 0, 0, 0, 0.02)); }
  if (o === 'pupears') { [-1, 1].forEach((sd) => { b.f.add(P.sphere, 0x8e8e93, sd * 0.2, 0.0, 0, 0, 0, sd * 0.5, 0.07, 0.15, 0.04); b.f.add(P.sphere, 0x5b5b60, sd * 0.2, -0.02, 0.01, 0, 0, sd * 0.5, 0.05, 0.11, 0.03); }); b.f.add(P.torus, 0xff5d8f, 0, -0.02, 0, PI / 2, 0, 0, 0.22, 0.22, 0.2); }
  if (o === 'racer') { b.g.add(P.sphere, 0xef4444, 0, -0.02, 0, 0, 0, 0, 0.27, 0.22, 0.28); b.g.add(P.rbox, 0xffffff, 0, 0.12, 0, 0, 0, 0, 0.05, 0.12, 0.5); b.e.add(P.rbox, 0x60a5fa, 0, -0.06, 0.24, 0.2, 0, 0, 0.36, 0.08, 0.06); }
  if (o === 'sunhat') { b.m.add(P.cyl, 0xf2cf7a, 0, -0.02, 0, 0, 0, 0, 0.46, 0.02, 0.46); b.m.add(P.sphere, 0xf2cf7a, 0, 0.04, 0, 0, 0, 0, 0.2, 0.13, 0.2); b.f.add(P.cyl, 0xff6b35, 0, 0.02, 0, 0, 0, 0, 0.205, 0.04, 0.205); for (let i = 0; i < 5; i++) b.g.add(P.sphere, 0xffd23f, 0.19 + Math.cos(i * 1.26) * 0.04, 0.05 + Math.sin(i * 1.26) * 0.04, 0.06, 0, 0, 0, 0.03); }
  if (o === 'detective') { b.f.add(P.sphere, 0x8b6b4a, 0, 0.03, 0, 0, 0, 0, 0.24, 0.14, 0.27); b.f.add(P.sphere, 0x8b6b4a, 0, 0.0, 0.2, 0, 0, 0, 0.12, 0.03, 0.1); b.f.add(P.sphere, 0x8b6b4a, 0, 0.0, -0.2, 0, 0, 0, 0.12, 0.03, 0.1); b.f.add(P.cyl, 0x4a3a24, 0, 0.0, 0, 0, 0, 0, 0.245, 0.04, 0.245); }
  if (o === 'shellcrown') { for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; b.l.add(P.cone, i % 2 ? 0xc4b5fd : 0x5eead4, Math.cos(a) * 0.18, 0.08, Math.sin(a) * 0.18, 0, 0, 0, 0.04, 0.12, 0.04, 0.4); } b.g.add(P.torus, 0xb98545, 0, 0.0, 0, PI / 2, 0, 0, 0.2, 0.2, 0.25); b.l.add(P.sphere, 0xc4b5fd, 0, 0.04, 0.2, 0, 0, 0, 0.04, 0.05, 0.03, 0.8); }
  hat.add(toGroup(b, false)); }
// animate a rat rig. st: {speed, air, glide, spin, vy, t}
export function animRat(rig, dt, st) {
  rig.t += dt * (1 + st.speed * 1.4); const t = rig.t, run = Math.min(1, st.speed / 6), b = rig.body;
  const air = st.air && !st.glide; const gait = Math.sin(t * 9);
  b.position.y = st.air ? 0 : Math.abs(gait) * 0.06 * run + Math.sin(rig.t * 2) * 0.01;
  b.rotation.x = air ? -Math.max(-0.4, Math.min(0.4, st.vy * 0.05)) : -0.08 * run;
  b.rotation.y = st.spin ? (st.spin * 18) % (PI * 2) : 0;
  b.rotation.z = st.lean || 0; b.scale.set(1 + (st.squash || 0) * 0.3, 1 - (st.squash || 0) * 0.35, 1 + (st.squash || 0) * 0.2);
  rig.feet.forEach((f, i) => { const ph = (i === 0 || i === 3) ? 0 : PI; if (air) { f.position.y = 0.06; f.rotation.x = i < 2 ? -0.6 : 0.6; } else { f.position.y = Math.max(0, Math.sin(t * 9 + ph)) * 0.14 * run; f.rotation.x = Math.cos(t * 9 + ph) * 0.6 * run; } });
  rig.head.rotation.x = Math.sin(t * 2.3) * 0.05 + (air ? -0.15 : 0); rig.head.rotation.y = Math.sin(t * 0.7) * 0.15 * (1 - run);
  rig.glider.visible = !!st.glide; if (st.glide) rig.glider.rotation.z = Math.sin(t * 4) * 0.08;
  // bend tail
  const g = rig.tail.geometry, p = g.attributes.position, base = rig.tailBase, n = p.count;
  for (let i = 0; i < n; i++) { const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2], k = -z / rig.TL;
    const sw = Math.sin(t * (3 + run * 6) - k * 4) * 0.25 * k * (0.5 + run), up = (air ? 0.35 : 0.18) * k * k - 0.15 * k;
    p.setXYZ(i, x + sw, y + up, z * (1 - 0.1 * k)); }
  p.needsUpdate = true; if ((rig._nf = (rig._nf || 0) + 1) % 3 === 0) g.computeVertexNormals();
}
// ---------------------------------------------------------------- Candy the miniature schnauzer
export function makeCandy() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); root.scale.setScalar(1.25);
  const gray = 0x7b8088, light = 0xa3a8b0, dark = 0x5d6168, white = 0xeceef2;
  const t = MB(); t.f.add(P.sphere, gray, 0, 1.45, 0, 0, 0, 0, 0.8, 0.72, 1.35); t.f.add(P.sphere, light, 0, 1.15, 0.2, 0, 0, 0, 0.62, 0.45, 1.05); t.f.add(P.sphere, gray, 0, 1.55, 0.95, 0.3, 0, 0, 0.62, 0.66, 0.6);
  t.g.add(P.torus, 0xff6fb5, 0, 1.75, 1.15, PI / 2 + 0.6, 0, 0, 0.5, 0.5, 0.6); t.x.add(rcyl(0.14, 0.05, 0.02, 20), 0xffd23f, 0, 1.45, 1.55, PI / 2 - 0.4, 0, 0, 1, 1, 1); t.l.add(P.sphere, 0xffffff, 0.05, 1.5, 1.6, 0, 0, 0, 0.03, 0.03, 0.02, 0.5);
  body.add(toGroup(t));
  const legs = []; const lb = MB(); lb.f.add(P.capsule, dark, 0, -0.42, 0, 0, 0, 0, 0.32, 0.6, 0.32); lb.f.add(P.sphere, white, 0, -0.85, 0.08, 0, 0, 0, 0.22, 0.14, 0.28); lb.f.add(P.capsule, white, 0, -0.62, 0, 0, 0, 0, 0.3, 0.25, 0.3); const legG = toGroup(lb);
  [[-0.42, 0.85], [0.42, 0.85], [-0.42, -0.85], [0.42, -0.85]].forEach(([x, z]) => { const l = legG.clone(); const p = new THREE.Group(); p.position.set(x, 0.95, z); p.add(l); body.add(p); legs.push(p); });
  const tailP = new THREE.Group(); tailP.position.set(0, 1.85, -1.25); body.add(tailP); { const b = MB(); b.f.add(P.capsule, dark, 0, 0.25, 0, 0, 0, 0, 0.2, 0.45, 0.2); tailP.add(toGroup(b)); }
  const head = new THREE.Group(); head.position.set(0, 2.25, 1.35); body.add(head);
  const h = MB(); h.f.add(P.sphere, gray, 0, 0, 0, 0, 0, 0, 0.62, 0.6, 0.6); h.f.add(P.rbox, light, 0, -0.18, 0.55, 0, 0, 0, 0.62, 0.48, 0.75);
  h.f.add(P.sphere, white, 0, -0.5, 0.62, 0, 0, 0, 0.42, 0.42, 0.45); [-1, 1].forEach((s) => { h.f.add(P.sphere, white, s * 0.2, -0.62, 0.72, 0, 0, 0, 0.26, 0.4, 0.28); h.f.add(P.sphere, white, s * 0.22, -0.18, 0.9, 0, 0, s * 0.4, 0.26, 0.14, 0.18); // beard + moustache
    h.f.add(P.capsule, white, s * 0.24, 0.3, 0.52, 0.2, 0, s * -0.35, 0.18, 0.4, 0.16); // bushy brows
    h.f.add(P.sphere, dark, s * 0.5, 0.35, -0.05, 0.3, 0, s * 0.9, 0.36, 0.12, 0.28); });
  h.g.add(P.sphere, 0x111111, 0, -0.05, 0.96, 0, 0, 0, 0.16, 0.12, 0.12);
  eyes(h, 0.13, 0.48, 0.24, 0.13, { iris: 0x2b1d14 });
  head.add(toGroup(h));
  const tongue = (() => { const b = MB(); b.g.add(P.capsule, 0xff6f91, 0, -0.1, 0, 0.3, 0, 0, 0.2, 0.3, 0.08); return toGroup(b); })(); tongue.position.set(0.05, -0.7, 0.85); head.add(tongue);
  return { root, body, head, legs, tail: tailP, tongue, t: 0 };
}
export function animCandy(r, dt, speed, mode) {
  r.t += dt; const t = r.t, run = Math.min(1, speed / 6); const f = 7 + run * 6;
  r.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * f + (i < 2 ? 0 : PI) + (i % 2) * 0.4) * 0.7 * run; });
  r.body.position.y = Math.abs(Math.sin(t * f)) * 0.15 * run; r.body.rotation.x = Math.sin(t * f) * 0.05 * run;
  r.tail.rotation.z = Math.sin(t * (mode === 'happy' ? 25 : 12)) * 0.7; r.tail.rotation.x = -0.4;
  r.head.rotation.x = Math.sin(t * 3) * 0.08 + (mode === 'sniff' ? 0.35 + Math.sin(t * 15) * 0.05 : 0); r.head.rotation.z = mode === 'happy' ? Math.sin(t * 4) * 0.2 : 0;
  r.tongue.visible = mode === 'chase' || mode === 'happy'; r.tongue.rotation.z = Math.sin(t * 10) * 0.2;
  if (mode === 'sleep') { r.body.rotation.x = 0; r.body.position.y = -0.55; r.legs.forEach((l) => l.rotation.x = 1.3); r.head.rotation.x = 0.4 + Math.sin(t * 1.5) * 0.04; }
}
// ---------------------------------------------------------------- Martina the desert tortoise
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
// ---------------------------------------------------------------- baby ratitas in bubbles
export function makeBaby(i) { const ids = ['luna', 'pirat', 'snowie']; const r = makeRat(ids[i % 3]); r.root.scale.setScalar(0.5); r.blaster.visible = false; const g = new THREE.Group(); g.add(r.root); r.root.position.y = -0.3;
  const bub = new THREE.Mesh(new THREE.SphereGeometry(0.75, 32, 20), new THREE.MeshPhysicalMaterial({ color: 0xbff4ff, roughness: 0.02, transparent: true, opacity: 0.28, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.6, depthWrite: false })); bub.renderOrder = 3; g.add(bub);
  const bow = (() => { const b = MB(); b.l.add(P.sphere, 0xff4fd8, 0, 0, 0, 0, 0, 0, 0.12, 0.12, 0.12, 0.6); return toGroup(b); })(); bow.position.set(0, 0.85, 0); g.add(bow);
  return { root: g, rat: r, bub }; }
// ---------------------------------------------------------------- pickups (geometries for instancing)
export function pickupGeos() {
  const crumb = new Builder(); crumb.add(wedge(), 0xffc93c, 0, 0, 0, 0, 0, 0, 0.42); 
  const cheese = new Builder(); cheese.add(wedge(), 0xffd23f, 0, 0, 0, 0, 0, 0, 1.0); 
  const part = new Builder(); part.add(gear(8), 0x3ff0ff, 0, 0, 0, 0, 0, 0, 0.45, 0.45, 0.9, 0.35); part.add(P.cyl, 0xff4fa0, 0, 0, 0, PI / 2, 0, 0, 0.2, 0.32, 0.2, 0.3);
  const hrt = new Builder(); hrt.add(heart(), 0xff3b6b, 0, 0, 0, 0, 0, 0, 0.45, 0.45, 0.45, 0.25);
  const gold = new Builder(); gold.add(wedge(), 0xffc400, 0, 0, 0, 0, 0, 0, 2.0);
  return { crumb: crumb.build(), cheese: cheese.build(), part: part.build(), heart: hrt.build(), gold: gold.build() };
}
export function makeCheckpoint() { const b = MB(); b.x.add(rcyl(0.6, 0.9, 0.2, 24), 0xd1d5db, 0, 0, 0); for (let i = 0; i < 16; i++) b.x.add(P.sphere, 0xb8bec8, Math.cos(i / 16 * PI * 2) * 0.6, 0.45, Math.sin(i / 16 * PI * 2) * 0.6, 0, 0, 0, 0.06); // thimble
  b.x.add(P.cyl, 0x9ca3af, 0, 0.9, 0, 0, 0, 0, 0.05, 1.8, 0.05); const g = toGroup(b);
  const flag = (() => { const f = MB(); f.f.add(P.rboxS, 0xffffff, 0.45, 0, 0, 0, 0, 0, 0.9, 0.6, 0.04); f.g.add(wedge(), 0xffd23f, 0.45, -0.15, 0.03, PI / 2, 0, 0, 0.35); return toGroup(f); })(); flag.position.set(0, 2.3, 0); g.add(flag);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 10), new THREE.MeshBasicMaterial({ color: 0x777777, toneMapped: false })); lamp.position.set(0, 2.75, 0); g.add(lamp);
  return { root: g, flag, lamp }; }
export function makeHook() { const b = MB(); b.l.add(P.torus, 0x3ff0ff, 0, 0, 0, 0, 0, 0, 0.45, 0.45, 0.45, 0.8); b.x.add(P.sphere, 0x9ca3af, 0, -0.45, 0, 0, 0, 0, 0.12); b.x.add(P.cyl, 0x6b7280, 0, 0.45, 0, 0, 0, 0, 0.06, 0.6, 0.06); return toGroup(b, false); }
export function makeShot() { const b = new Builder(); b.add(P.sphere, 0xffd23f, 0, 0, 0, 0, 0, 0, 0.22, 0.22, 0.22, 0.6); return new THREE.Mesh(b.build(), MATS.l); }
// ---------------------------------------------------------------- enemies (cute!)
export function makeEnemy(type) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const b = MB(); let parts = {};
  if (type === 'dust') { b.f.add(blobGeo(5, 0.25, 3), 0x9aa0ab, 0, 0.55, 0, 0, 0, 0, 0.6); for (let i = 0; i < 10; i++) b.f.add(P.sphere, 0xb6bcc6, Math.cos(i) * 0.5, 0.55 + Math.sin(i * 1.7) * 0.4, Math.sin(i) * 0.45, 0, 0, 0, 0.2); eyes(b, 0.7, 0.45, 0.18, 0.13, { brow: 0x4b5563, angry: true }); }
  else if (type === 'windup') { b.g.add(P.sphere, 0x60a5fa, 0, 0.5, 0, 0, 0, 0, 0.45, 0.4, 0.55); b.g.add(P.sphere, 0x93c5fd, 0, 0.6, 0.45, 0, 0, 0, 0.3); [-1, 1].forEach((s) => b.g.add(P.sphere, 0x3b82f6, s * 0.28, 0.9, 0.35, 0, 0, 0, 0.18, 0.18, 0.05)); eyes(b, 0.68, 0.68, 0.12, 0.09, { brow: 0x1e3a8a, angry: true }); b.x.add(P.cyl, 0x9ca3af, 0, 0.1, 0, 0, 0, 0, 0.35, 0.1, 0.35);
    const key = (() => { const k = MB(); k.x.add(P.cyl, 0xd4a017, 0, 0, 0, PI / 2, 0, 0, 0.05, 0.3, 0.05); [-1, 1].forEach((s) => k.x.add(P.torus, 0xd4a017, s * 0.18, 0, -0.18, 0, PI / 2, 0, 0.14, 0.14, 0.14)); return toGroup(k); })(); key.position.set(0, 0.7, -0.6); body.add(key); parts.key = key; }
  else if (type === 'bot') { b.g.add(rcyl(0.6, 0.35, 0.15, 28), 0xf1f5f9, 0, 0.05, 0); b.l.add(P.torus, 0x22d3ee, 0, 0.3, 0, PI / 2, 0, 0, 0.45, 0.45, 0.3, 0.6); b.g.add(P.sphere, 0x0f172a, 0, 0.4, 0.2, 0, 0, 0, 0.32, 0.12, 0.25); [-1, 1].forEach((s) => b.l.add(P.sphere, 0x22d3ee, s * 0.12, 0.47, 0.38, 0, 0, 0, 0.06, 0.07, 0.03, 1)); }
  else if (type === 'snail') { b.g.add(P.capsule, 0xa3e635, 0, 0.25, 0.1, PI / 2, 0, 0, 0.45, 0.9, 0.45); b.g.add(P.sphere, 0xf59e0b, 0, 0.75, -0.15, 0, 0, 0, 0.55, 0.55, 0.45); b.g.add(P.torus, 0xd97706, 0, 0.75, -0.15, 0, PI / 2, 0, 0.35, 0.35, 0.5); [-1, 1].forEach((s) => { b.g.add(P.cyl, 0xa3e635, s * 0.12, 0.55, 0.65, -0.3, 0, s * 0.3, 0.04, 0.35, 0.04); b.g.add(P.sphere, 0xffffff, s * 0.18, 0.88, 0.75, 0, 0, 0, 0.09); b.g.add(P.sphere, 0x111827, s * 0.18, 0.88, 0.82, 0, 0, 0, 0.05); }); }
  else if (type === 'bee') { b.f.add(P.sphere, 0xfacc15, 0, 0.0, 0, 0, 0, 0, 0.45, 0.4, 0.55); for (let i = 0; i < 2; i++) b.f.add(P.torus, 0x1f2937, 0, 0, -0.1 + i * 0.25, 0, 0, 0, 0.4, 0.37, 0.25); eyes(b, 0.12, 0.45, 0.15, 0.11); b.e.add(P.sphere, 0xe0f2fe, 0.35, 0.35, -0.1, 0, 0, 0.6, 0.35, 0.08, 0.2); b.e.add(P.sphere, 0xe0f2fe, -0.35, 0.35, -0.1, 0, 0, -0.6, 0.35, 0.08, 0.2); b.g.add(P.cone, 0x1f2937, 0, 0, -0.6, -PI / 2, 0, 0, 0.1, 0.25, 0.1); }
  else if (type === 'nut') { b.x.add(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 6), 0x94a3b8, 0, 0.55, 0, PI / 2, 0, 0); b.x.add(P.cyl, 0x475569, 0, 0.55, 0, PI / 2, 0, 0, 0.22, 0.55, 0.22); eyes(b, 0.75, 0.25, 0.17, 0.11, { brow: 0x334155, angry: true }); }
  else if (type === 'moth') { b.f.add(P.capsule, 0xd6c6a8, 0, 0, 0, PI / 2, 0, 0, 0.3, 0.6, 0.3); eyes(b, 0.08, 0.3, 0.12, 0.1); const wl = MB(); wl.f.add(P.sphere, 0xe9dcc0, 0.55, 0, 0, 0, 0, 0, 0.55, 0.05, 0.4); wl.g.add(P.sphere, 0xa78bfa, 0.6, 0.04, 0, 0, 0, 0, 0.18, 0.03, 0.15); const w1 = toGroup(wl), w2 = w1.clone(); w2.scale.x = -1; body.add(w1, w2); parts.wings = [w1, w2]; }
  else if (type === 'toycar') { b.g.add(P.rbox, 0xef4444, 0, 0.45, 0, 0, 0, 0, 0.9, 0.45, 1.4); b.g.add(P.rbox, 0xfca5a5, 0, 0.8, -0.1, 0, 0, 0, 0.7, 0.35, 0.7); [-1, 1].forEach((s) => [-1, 1].forEach((t) => b.m.add(P.cyl, 0x111827, s * 0.48, 0.22, t * 0.45, 0, 0, PI / 2, 0.22, 0.15, 0.22))); eyes(b, 0.55, 0.7, 0.2, 0.12, { brow: 0x7f1d1d, angry: true }); }
  body.add(toGroup(b)); return Object.assign({ root, body, type, t: Math.random() * 6 }, parts);
}
export function animEnemy(e, dt, speed) { e.t += dt; const t = e.t, b = e.body;
  if (e.type === 'dust') { const h = Math.abs(Math.sin(t * 5)); b.position.y = h * 0.4; b.scale.set(1 + (1 - h) * 0.15, 1 - (1 - h) * 0.15, 1); }
  else if (e.type === 'windup') { if (e.key) e.key.rotation.z = t * 3; b.rotation.z = Math.sin(t * 10) * 0.08; }
  else if (e.type === 'bee' || e.type === 'moth') { b.position.y = Math.sin(t * 3) * 0.2; if (e.wings) { e.wings[0].rotation.z = Math.sin(t * 25) * 0.6; e.wings[1].rotation.z = -Math.sin(t * 25) * 0.6; } }
  else if (e.type === 'nut') { b.rotation.x = t * speed * 1.5; }
  else if (e.type === 'snail') { b.scale.z = 1 + Math.sin(t * 2) * 0.06; }
  else if (e.type === 'bot' || e.type === 'toycar') { b.position.y = Math.abs(Math.sin(t * 12)) * 0.03; }
}
// ---------------------------------------------------------------- bosses
export function makeBoss(type) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const b = MB(); const parts = {};
  if (type === 'toast') { b.g.add(P.rbox, 0xf43f5e, 0, 2.2, 0, 0, 0, 0, 5.2, 3.6, 3.2); b.x.add(P.rbox, 0xe5e7eb, 0, 0.3, 0, 0, 0, 0, 5.4, 0.6, 3.4); [-0.9, 0.9].forEach((s) => b.m.add(P.rboxS, 0x1f2937, s, 4.05, 0, 0, 0, 0, 0.6, 0.15, 2.2)); eyes(b, 2.6, 1.62, 0.9, 0.5, { brow: 0x7f1d1d, angry: true }); b.g.add(P.torus, 0x1f2937, 0, 1.4, 1.62, 0, 0, PI, 0.6, 0.35, 0.3); b.x.add(P.capsule, 0xcbd5e1, 2.8, 2.2, 0, 0, 0, PI / 2, 0.3, 0.8, 0.3);
    const toast = (() => { const t = MB(); [-0.9, 0.9].forEach((s) => { t.m.add(P.rbox, 0xd4a373, s, 0, 0, 0, 0, 0, 0.35, 1.8, 1.9); t.m.add(P.rbox, 0xf7d9a8, s, 0.05, 0, 0, 0, 0, 0.4, 1.6, 1.7); }); return toGroup(t); })(); toast.position.y = 3.6; body.add(toast); parts.toast = toast; }
  else if (type === 'vac') { b.g.add(rcyl(3.2, 1.2, 0.4, 40), 0x3f3f46, 0, 0.2, 0); b.g.add(rcyl(2.9, 0.3, 0.1, 40), 0x71717a, 0, 1.35, 0); b.l.add(P.torus, 0x22d3ee, 0, 0.9, 0, PI / 2, 0, 0, 3.15, 3.15, 0.4, 0.5); b.g.add(P.rbox, 0x0f172a, 0, 1.6, 1.2, 0, 0, 0, 2.6, 0.4, 1.2); b.x.add(P.cyl, 0x9ca3af, 0, 0.1, 3.0, 0, 0, PI / 2, 0.3, 4, 0.3);
    const brushes = []; [-1, 1].forEach((s) => { const br = (() => { const t = MB(); for (let i = 0; i < 3; i++) t.m.add(P.cyl, 0xfbbf24, Math.cos(i * 2.1) * 0.5, 0, Math.sin(i * 2.1) * 0.5, PI / 2, -i * 2.1, 0, 0.06, 1.0, 0.06); return toGroup(t); })(); br.position.set(s * 2.4, 0.15, 2.0); body.add(br); brushes.push(br); }); parts.brushes = brushes;
    const face = (() => { const f = MB(); [-1, 1].forEach((s) => f.l.add(P.sphere, 0x22d3ee, s * 0.6, 0, 0, 0, 0, 0, 0.28, 0.32, 0.1, 1)); return toGroup(f, false); })(); face.position.set(0, 1.85, 1.82); body.add(face); parts.face = face; }
  else if (type === 'dustking') { b.f.add(blobGeo(9, 0.25, 3), 0x8e95a1, 0, 2.6, 0, 0, 0, 0, 2.6); for (let i = 0; i < 18; i++) b.f.add(P.sphere, 0xaab0bb, Math.cos(i) * 2.2, 2.6 + Math.sin(i * 1.7) * 1.8, Math.sin(i) * 2.2, 0, 0, 0, 0.7); eyes(b, 3.2, 2.2, 0.75, 0.55, { brow: 0x374151, angry: true });
    b.x.add(P.cyl, 0xffc83d, 0, 5.0, 0, 0, 0, 0, 1.0, 0.7, 1.0); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; b.x.add(P.cone, 0xffc83d, Math.cos(a) * 0.9, 5.9, Math.sin(a) * 0.9, 0, 0, 0, 0.25, 0.6, 0.25); b.g.add(P.sphere, [0xff4fa0, 0x3ff0ff][i % 2], Math.cos(a) * 1.02, 5.35, Math.sin(a) * 1.02, 0, 0, 0, 0.15); } }
  else if (type === 'sprinkler') { b.g.add(rcyl(2.4, 2.4, 0.5, 32), 0x16a34a, 0, 0, 0); b.g.add(P.sphere, 0x22c55e, 0, 2.6, 0, 0, 0, 0, 2.0, 1.4, 2.0); eyes(b, 3.0, 1.75, 0.65, 0.42, { brow: 0x14532d, angry: true }); b.g.add(P.torus, 0x14532d, 0, 2.1, 1.8, 0, 0, PI, 0.45, 0.25, 0.25);
    const head = (() => { const t = MB(); t.x.add(P.cyl, 0xfbbf24, 0, 0, 0, 0, 0, 0, 0.3, 1.0, 0.3); [-1, 1].forEach((s) => { t.x.add(P.cyl, 0xfbbf24, s * 0.9, 0.9, 0, 0, 0, PI / 2, 0.15, 1.8, 0.15); t.l.add(P.sphere, 0x7dd3fc, s * 1.8, 0.9, 0, 0, 0, 0, 0.25, 0.25, 0.25, 0.5); }); return toGroup(t); })(); head.position.y = 3.8; body.add(head); parts.spin = head; }
  else if (type === 'rc') { b.g.add(P.rbox, 0x8b5cf6, 0, 2.4, 0, 0, 0, 0, 4.2, 1.6, 6.4); b.g.add(P.rbox, 0xc4b5fd, 0, 3.5, -0.6, 0, 0, 0, 3.4, 1.2, 3); b.e.add(P.rbox, 0x0f172a, 0, 3.6, 0.9, 0, 0, 0, 3.0, 0.9, 0.2); eyes(b, 3.6, 1.0, 0.8, 0.38, { brow: 0x3b0764, angry: true }); b.l.add(P.sphere, 0xfff07a, 1.4, 2.4, 3.2, 0, 0, 0, 0.35, 0.35, 0.1, 1); b.l.add(P.sphere, 0xfff07a, -1.4, 2.4, 3.2, 0, 0, 0, 0.35, 0.35, 0.1, 1); b.x.add(P.cyl, 0x9ca3af, 1.6, 4.2, -2.6, 0, 0, 0, 0.05, 2, 0.05);
    const wheels = []; [-1, 1].forEach((s) => [-1, 1].forEach((t) => { const w = (() => { const k = MB(); k.m.add(P.torus, 0x111827, 0, 0, 0, 0, PI / 2, 0, 1.2, 1.2, 1.6); k.x.add(P.cyl, 0xd1d5db, 0, 0, 0, 0, 0, PI / 2, 0.8, 0.6, 0.8); return toGroup(k); })(); w.position.set(s * 2.4, 1.3, t * 2.3); body.add(w); wheels.push(w); })); parts.wheels = wheels; }
  else if (type === 'clanky') { b.x.add(P.rbox, 0xcbd5e1, 0, 3.6, 0, 0, 0, 0, 3.6, 3.4, 2.6); b.x.add(P.rbox, 0x94a3b8, 0, 6.3, 0, 0, 0, 0, 2.6, 2.0, 2.2); [-1, 1].forEach((s) => { b.l.add(P.sphere, 0xff4d4d, s * 0.6, 6.5, 1.12, 0, 0, 0, 0.32, 0.32, 0.1, 1); b.x.add(P.capsule, 0x94a3b8, s * 1.0, 1.0, 0, 0, 0, 0, 0.9, 1.4, 1.0); b.x.add(P.capsule, 0x94a3b8, s * 2.3, 3.8, 0, 0, 0, s * 0.3, 0.7, 2.2, 0.7); b.g.add(P.sphere, 0xef4444, s * 2.6, 2.4, 0, 0, 0, 0, 0.6); });
    b.x.add(P.cyl, 0x64748b, 0, 7.3, 0, 0, 0, 0, 0.06, 1.2, 0.06); b.l.add(P.sphere, 0xffd23f, 0, 8.5, 0, 0, 0, 0, 0.25, 0.25, 0.25, 1); for (let i = 0; i < 3; i++) b.g.add(P.rboxS, [0xef4444, 0xffd23f, 0x3b82f6][i], -0.8 + i * 0.8, 4.2, 1.32, 0, 0, 0, 0.5, 0.5, 0.1); b.m.add(P.rbox, 0x1f2937, 0, 5.6, 1.12, 0, 0, 0, 1.4, 0.25, 0.05);
    const key = (() => { const k = MB(); k.x.add(P.cyl, 0xd4a017, 0, 0, 0, PI / 2, 0, 0, 0.18, 1.2, 0.18); [-1, 1].forEach((s) => k.x.add(P.torus, 0xd4a017, s * 0.6, 0, -0.6, 0, PI / 2, 0, 0.5, 0.5, 0.5)); return toGroup(k); })(); key.position.set(0, 4, -1.9); body.add(key); parts.key = key; }
  else if (type === 'kitty') { const fur = 0xf9a8d4; b.g.add(P.sphere, fur, 0, 3.0, 0, 0, 0, 0, 2.4, 2.0, 3.2); b.g.add(P.sphere, 0xfdf2f8, 0, 2.6, 0.8, 0, 0, 0, 1.8, 1.4, 2.4); b.g.add(P.sphere, fur, 0, 5.3, 2.6, 0, 0, 0, 2.0, 1.8, 1.8);
    [-1, 1].forEach((s) => { b.g.add(P.cone, fur, s * 1.2, 6.8, 2.4, 0, 0, s * -0.35, 0.7, 1.4, 0.5); b.g.add(P.cone, 0xff6fb5, s * 1.18, 6.75, 2.6, 0, 0, s * -0.35, 0.4, 0.9, 0.3); for (let i = -1; i <= 1; i++) b.m.add(P.cyl, 0x334155, s * 1.6, 4.9 + i * 0.25, 4.1, 0, 0, PI / 2 + s * i * 0.15, 0.03, 1.6, 0.03); [-1, 1].forEach((t) => b.g.add(P.capsule, fur, s * 1.4, 1.0, t * 1.8, 0, 0, 0, 0.9, 1.4, 0.9)); });
    eyes(b, 5.6, 4.15, 0.75, 0.5, { iris: 0x16a34a }); b.g.add(P.sphere, 0xff6fb5, 0, 5.0, 4.35, 0, 0, 0, 0.25, 0.2, 0.15); b.x.add(P.torus, 0xffd23f, 0, 4.0, 2.4, PI / 2 + 0.3, 0, 0, 1.5, 1.5, 0.8); b.x.add(P.sphere, 0xffd23f, 0, 3.4, 3.7, 0, 0, 0, 0.45);
    const key = (() => { const k = MB(); k.x.add(P.cyl, 0xd4a017, 0, 0, 0, 0, 0, 0, 0.2, 1.4, 0.2); [-1, 1].forEach((s) => k.x.add(P.torus, 0xd4a017, s * 0.6, 1.5, 0, 0, 0, 0, 0.5, 0.5, 0.5)); return toGroup(k); })(); key.position.set(0, 5, -1); body.add(key); parts.key = key;
    const tail = (() => { const k = MB(); k.g.add(tube([[0, 0, 0], [0, 1.5, -1.5], [0, 3.5, -1.8], [0.6, 4.6, -1.2]], 0.45, 24, 10), fur, 0, 0, 0); return toGroup(k); })(); tail.position.set(0, 3, -3); body.add(tail); parts.tail = tail; }
  body.add(toGroup(b)); return Object.assign({ root, body, type, t: 0 }, parts);
}
export function animBoss(B, dt, st) { B.t += dt; const t = B.t, b = B.body; const tired = st === 'tired';
  b.rotation.z = tired ? Math.sin(t * 3) * 0.08 : 0; b.position.y = 0;
  if (B.toast) B.toast.position.y = 3.6 + (st === 'attack' ? Math.abs(Math.sin(t * 6)) * 1.4 : 0);
  if (B.brushes) B.brushes.forEach((br, i) => br.rotation.y = t * (tired ? 2 : 14) * (i ? 1 : -1));
  if (B.face) B.face.scale.y = tired ? 0.25 : 1;
  if (B.spin) B.spin.rotation.y = t * (tired ? 0.5 : 6);
  if (B.wheels) B.wheels.forEach((w) => w.rotation.x = t * (tired ? 0 : 10));
  if (B.key) B.key.rotation.z = t * (tired ? 0.3 : 4);
  if (B.tail) B.tail.rotation.z = Math.sin(t * 2) * 0.3;
  if (B.type === 'dustking' || B.type === 'kitty') { const h = st === 'hop' ? Math.abs(Math.sin(t * 4)) : 0; b.scale.set(1 + (tired ? 0.05 : 0), 1 - (tired ? 0.1 : 0) + h * 0.05, 1); }
  if (B.type === 'clanky') b.rotation.z = Math.sin(t * 6) * (tired ? 0.15 : 0.05);
}
export { toGroup, MB };
