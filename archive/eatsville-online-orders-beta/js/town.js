// Eatsville exterior: roads, sidewalks, park, waterfront, detailed enterable buildings, instanced street decor.
import * as THREE from 'three';
import { P, blob, LOW } from './geo.js';
import { MATS } from './mats.js';
import { MB, toGroup, instanced, mat4, XB } from './kit.js';
import { rcyl, lathe, torus, cyl, cone, leaf, sph, blobGeo, star } from './shapes.js';
import { textGeo } from './text3d.js';
import { canvasTex, noiseFill, rng } from './util.js';
import { BUILDINGS, ROADS, RW, SIDEW } from './data.js';
import { carBody } from './cars.js';
import { dishModel } from './food.js';
const PI = Math.PI;
export const T = { grp: null, colliders: [], circles: [], doors: [], signs: {}, forSale: {}, grade: {}, water: null, lampLights: [] };
// prism roof (smooth bevelled extrusion of a triangle)
const roofCache = new Map();
function roofGeo(w, h, d) { const k = [w, h, d].join(); if (roofCache.has(k)) return roofCache.get(k); const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.lineTo(-w / 2, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: 0.18, bevelThickness: 0.18, bevelSegments: 3 }); g.translate(0, 0, -d / 2); roofCache.set(k, g); return g; }
function text(x, str, size, depth, col, px, py, pz, k = 'g', ry = 0, em = 0) { const g = textGeo(str, size, depth); if (!g) return 0; x.p(k, g, col, px, py, pz, 0, ry, 0, 1, 1, 1, em); return g.userData.w; }
function fitText(x, str, maxW, size, depth, col, px, py, pz, k, em) { const g = textGeo(str, size, depth); if (!g) return; const s = Math.min(1, maxW / g.userData.w); x.p(k || 'g', g, col, px, py, pz, 0, 0, 0, s, s, 1, em || 0); }
function windowAt(x, wx, wy, wz, ww, wh, trim, ry = 0, shutters) {
  const c = Math.cos(ry), s = Math.sin(ry); const ox = (dx, dz) => [wx + dx * c + dz * s, wz - dx * s + dz * c];
  let [a, b] = ox(0, 0.06); x.p('n', P.rboxS, 0x7fb6d6, a, wy, b, 0, ry, 0, ww, wh, 0.06);
  [a, b] = ox(0, 0.1); x.p('g', P.rboxS, trim, a, wy + wh / 2 + 0.06, b, 0, ry, 0, ww + 0.3, 0.14, 0.2); x.p('g', P.rboxS, trim, a, wy - wh / 2 - 0.06, b, 0, ry, 0, ww + 0.36, 0.14, 0.32);
  for (const sd of [-1, 1]) { [a, b] = ox(sd * (ww / 2 + 0.05), 0.1); x.p('g', P.rboxS, trim, a, wy, b, 0, ry, 0, 0.12, wh + 0.1, 0.16); }
  [a, b] = ox(0, 0.1); x.p('g', P.rboxS, trim, a, wy, b, 0, ry, 0, 0.06, wh, 0.08); x.p('g', P.rboxS, trim, a, wy, b, 0, ry, 0, ww, 0.06, 0.08);
  if (shutters) for (const sd of [-1, 1]) { [a, b] = ox(sd * (ww / 2 + 0.38), 0.08); x.p('g', P.rboxS, shutters, a, wy, b, 0, ry, 0, 0.5, wh + 0.1, 0.06); }
}
function awning(x, cx, y, z, w, col, depth = 1.6) { const n = Math.max(3, Math.round(w / 0.9)); const sw = w / n;
  for (let i = 0; i < n; i++) x.p('f', P.cyl, i % 2 ? 0xffffff : col, cx - w / 2 + sw * (i + 0.5), y, z + depth / 2, 0.55, 0, 0, sw / 2, depth * 1.08, 0.12);
  for (let i = 0; i < n; i++) x.p('f', P.sphere, i % 2 ? 0xffffff : col, cx - w / 2 + sw * (i + 0.5), y - depth * 0.42, z + depth * 0.95, 0, 0, 0, sw / 2, 0.16, 0.1); }
function door(x, dx, w, col, trim, glassTop = true) {
  x.p('g', P.rboxS, trim, dx, 1.4, 0.06, 0, 0, 0, w + 0.5, 2.9, 0.22); x.p('g', P.rboxS, col, dx, 1.25, 0.14, 0, 0, 0, w, 2.5, 0.1);
  if (glassTop) x.p('n', P.rboxS, 0x9fd8ff, dx, 1.65, 0.2, 0, 0, 0, w * 0.75, 1.2, 0.04);
  x.p('x', P.sphere, 0xfacc15, dx + w * 0.35, 1.15, 0.24, 0, 0, 0, 0.07); x.p('m', P.rbox, 0x9ca3af, dx, 0.06, 0.8, 0, 0, 0, w + 0.8, 0.12, 1.2); // step/mat
  x.p('f', P.rboxS, 0xb91c1c, dx, 0.13, 1.0, 0, 0, 0, w * 0.8, 0.02, 0.8);
}
// ---------- building facades ----------
function building(b) {
  const B = MB(); const ry = b.face === 'n' ? PI : 0; const x = new XB(B, b.x, 0, b.z, ry); const { w, d, h, col, col2 } = b; const r = rng(b.x * 13 + b.z * 7 + 99);
  const st = b.style, trim = 0xffffff, fz = d / 2;
  if (st === 'house') {
    x.p('m', P.rbox, 0xd6d3d1, 0, 0.25, 0, 0, 0, 0, w + 0.6, 0.5, d + 0.6);
    x.p('m', P.rboxS, col, 0, h * 0.5, 0, 0, 0, 0, w, h - 0.2, d);
    for (let i = 0; i < Math.floor(h / 0.5); i++) x.p('m', P.rboxS, col, 0, 0.6 + i * 0.5, 0, 0, 0, 0, w + 0.08, 0.06, d + 0.08); // siding lines
    x.p('g', roofGeo(w + 1.4, h * 0.55, d + 1.4), col2, 0, h - 0.15, 0); // roof ridge along z
    x.p('m', P.rbox, 0xa8a29e, w * 0.25, h + h * 0.35, -d * 0.15, 0, 0, 0, 0.9, h * 0.6, 0.9); x.p('m', P.rbox, 0x78716c, w * 0.25, h + h * 0.66, -d * 0.15, 0, 0, 0, 1.1, 0.2, 1.1);
    door(new XB(B).set(...xyz(b, 0, 0, fz), ry), 0, 1.3, col2, trim);
    // porch with posts + roof
    x.p('m', P.rbox, 0xe7e5e4, 0, 0.35, fz + 1.4, 0, 0, 0, 5, 0.3, 2.8); for (const sx of [-2.2, 2.2]) x.p('g', P.cyl, trim, sx, 1.7, fz + 2.5, 0, 0, 0, 0.12, 2.8, 0.12);
    x.p('g', P.rbox, col2, 0, 3.25, fz + 1.4, -0.15, 0, 0, 5.4, 0.25, 3.2);
    for (const sx of [-w * 0.32, w * 0.32]) windowAt(new XB(B).set(...xyz(b, 0, 0, 0), ry), sx, 1.8, fz, 1.6, 1.5, trim, 0, col2);
    windowAt(new XB(B).set(...xyz(b, 0, 0, 0), ry), 0, h - 1.4, fz, 1.4, 1.2, trim, 0, col2);
    for (const sd of [-1, 1]) for (const zz of [-d * 0.25, d * 0.25]) windowAt(new XB(B).set(...xyz(b, 0, 0, 0), ry), sd * w / 2, 1.8, zz, 1.4, 1.4, trim, sd * PI / 2);
    // fence, hedges, flowers, mailbox
    for (let i = -6; i <= 6; i++) { if (Math.abs(i) < 2) continue; x.p('g', P.rboxS, trim, i * 0.9, 0.55, fz + 4.3, 0, 0, 0, 0.14, 1.1, 0.1); x.p('g', P.cone, trim, i * 0.9, 1.15, fz + 4.3, 0, 0, 0, 0.1, 0.15, 0.08); }
    for (const sd of [-1, 1]) x.p('g', P.rboxS, trim, sd * 3.6, 0.75, fz + 4.3, 0, 0, 0, 4.5, 0.08, 0.06), x.p('g', P.rboxS, trim, sd * 3.6, 0.35, fz + 4.3, 0, 0, 0, 4.5, 0.08, 0.06);
    for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { x.p('f', blobGeo(i + sd * 3, 0.2, 2), 0x2f9e44, sd * (3.2 + i * 0.85), 0.55, fz + 0.9, 0, i, 0, 0.6, 0.55, 0.55); x.p('g', P.sphere, [0xff6b9a, 0xffd23f, 0xffffff, 0xa78bfa][i], sd * (3.2 + i * 0.85), 1.0, fz + 1.25, 0, 0, 0, 0.12); }
    x.p('x', P.cyl, 0x6b7280, 3.2, 0.6, fz + 4.7, 0, 0, 0, 0.05, 1.2, 0.05); x.p('g', P.capsule, col2, 3.2, 1.25, fz + 4.7, PI / 2, 0, 0, 0.3, 0.3, 0.3);
    text(x, b.name, 0.32, 0.08, 0x1f2937, 0, 3.55, fz + 2.85);
  } else {
    // commercial / civic body
    x.p('m', P.rbox, 0xcbd5e1, 0, 0.2, 0, 0, 0, 0, w + 0.8, 0.4, d + 0.8);
    x.p('m', P.rboxS, col, 0, h / 2, 0, 0, 0, 0, w, h, d);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) x.p('g', P.rboxS, st === 'civic' ? 0xf8fafc : col2, sx * w / 2, h / 2, sz * d / 2, 0, 0, 0, 0.7, h + 0.1, 0.7);
    x.p('g', P.rboxS, st === 'diner' ? 0xd8dee9 : col2, 0, h + 0.25, 0, 0, 0, 0, w + 0.8, 0.5, d + 0.8); // cornice
    x.p('m', P.rboxS, 0xe2e8f0, 0, h + 0.55, 0, 0, 0, 0, w - 0.4, 0.15, d - 0.4); // roof deck
    // upper windows on all sides
    const floors = Math.max(1, Math.floor((h - 3.6) / 2.6));
    for (let f = 0; f < floors; f++) { const wy = 4.6 + f * 2.6; const n = Math.max(2, Math.floor(w / 3.2));
      for (let i = 0; i < n; i++) { const wx = -w / 2 + (i + 0.5) * w / n; windowAt(new XB(B).set(...xyz(b, 0, 0, 0), ry), wx, wy, fz, 1.5, 1.4, trim); windowAt(new XB(B).set(...xyz(b, 0, 0, 0), ry), wx, wy, -fz, 1.5, 1.4, trim, PI); }
      const m = Math.max(2, Math.floor(d / 3.4)); for (let i = 0; i < m; i++) { const wz = -d / 2 + (i + 0.5) * d / m; for (const sd of [-1, 1]) windowAt(new XB(B).set(...xyz(b, 0, 0, 0), ry), sd * w / 2, wy, wz, 1.4, 1.4, trim, sd * PI / 2); } }
    // ground floor: display windows + door
    const gx = new XB(B).set(...xyz(b, 0, 0, fz), ry);
    door(gx, 0, 1.8, st === 'civic' ? 0x7c4a2d : col2, trim);
    for (const sd of [-1, 1]) { const ww = w / 2 - 2.6; if (ww > 1.5) { gx.p('n', P.rboxS, 0x8fc7e8, sd * (1.7 + ww / 2), 1.7, 0.06, 0, 0, 0, ww, 2.2, 0.06); gx.p('g', P.rboxS, trim, sd * (1.7 + ww / 2), 0.55, 0.15, 0, 0, 0, ww + 0.3, 0.2, 0.4); gx.p('g', P.rboxS, trim, sd * (1.7 + ww / 2), 2.85, 0.12, 0, 0, 0, ww + 0.3, 0.16, 0.25);
      for (let k = 1; k < Math.floor(ww / 1.6) + 1; k++) gx.p('g', P.rboxS, trim, sd * (1.7 + k * ww / (Math.floor(ww / 1.6) + 1)), 1.7, 0.12, 0, 0, 0, 0.1, 2.2, 0.1); } }
    for (let i = 0; i < 3; i++) { gx.p('x', P.rbox, 0x9ca3af, -w / 2 + 2 + i * 2.2, h + 0.95, -d * 0.6, 0, 0, 0, 1.4, 0.8, 1.2); gx.p('x', torus(0.15, 20), 0x4b5563, -w / 2 + 2 + i * 2.2, h + 1.36, -d * 0.6, PI / 2, 0, 0, 0.4, 0.4, 0.5); } // AC units
    const signY = Math.min(h - 0.5, 3.9);
    if (st === 'civic' || st === 'civic2') {
      for (let i = -2; i <= 2; i++) { if (!i) continue; gx.p('g', P.cyl, 0xf8fafc, i * 2.2, 2.3, 1.7, 0, 0, 0, 0.36, 4.6, 0.36); gx.p('g', rcyl(0.5, 0.3, 0.08), 0xf8fafc, i * 2.2, 0, 1.7); gx.p('g', rcyl(0.5, 0.3, 0.08), 0xf8fafc, i * 2.2, 4.45, 1.7); }
      gx.p('g', P.rbox, 0xf8fafc, 0, 4.95, 1.5, 0, 0, 0, 10, 0.5, 3.2); gx.p('g', roofGeo(10.4, 1.4, 3.2), st === 'civic' ? 0xf8fafc : col2, 0, 5.2, 1.5);
      for (let i = 0; i < 3; i++) gx.p('m', P.rbox, 0xd1d5db, 0, 0.12 + i * 0.12, 3.6 - i * 0.35, 0, 0, 0, 10 - i * 0.6, 0.12, 1.2);
      if (st === 'civic') { // clock tower + flag
        gx.p('m', P.rboxS, col, 0, h + 2.4, -d / 2, 0, 0, 0, 3.4, 4, 3.4); gx.p('g', P.cone, col2, 0, h + 4.4, -d / 2, 0, PI / 4, 0, 2.7, 2.6, 2.7);
        gx.p('g', rcyl(1.1, 0.15, 0.06), 0xffffff, 0, h + 2.8, -d / 2 + 1.72, PI / 2, 0, 0); gx.p('g', P.rboxS, 0x111827, 0, h + 3.1, -d / 2 + 1.9, 0, 0, 0, 0.08, 0.7, 0.05); gx.p('g', P.rboxS, 0x111827, 0.2, h + 2.8, -d / 2 + 1.9, 0, 0, 0, 0.5, 0.08, 0.05);
        gx.p('x', P.cyl, 0xd1d5db, 6, 4, 6, 0, 0, 0, 0.08, 8, 0.08); gx.p('s', P.rboxS, 0x2563eb, 6.8, 7.4, 6, 0, 0, 0.05, 1.5, 0.9, 0.03);
      }
      fitText(gx, b.name, 9, 0.62, 0.18, st === 'civic' ? 0x1e3a8a : col2, 0, 5.32, 3.05);
      if (st === 'civic2') { gx.p('l', P.rboxS, 0xffffff, 0, h + 1.4, -1, 0, 0, 0, 0.6, 1.8, 0.3, 0.3); gx.p('l', P.rboxS, 0xffffff, 0, h + 1.4, -1, 0, 0, 0, 1.8, 0.6, 0.3, 0.3); gx.p('g', rcyl(1.3, 0.25, 0.1), col2, 0, h + 0.4, -1, PI / 2, 0, 0); }
    } else {
      // awning + sign board
      if (st !== 'dealer' && st !== 'ratita') { awning(gx, -w / 4 - 0.6, 3.25, 0.1, w / 2 - 2.4, col2); awning(gx, w / 4 + 0.6, 3.25, 0.1, w / 2 - 2.4, col2); }
      const bw = Math.min(w - 2, 13); gx.p('g', P.rbox, st === 'diner' ? 0x111827 : 0xffffff, 0, signY + 0.6, 0.3, 0, 0, 0, bw, 1.3, 0.3);
      gx.p('g', P.rboxS, col2, 0, signY + 0.6, 0.25, 0, 0, 0, bw + 0.3, 1.5, 0.22);
      T.signs[b.id] = { x: b.x, z: b.z, ry, y: signY + 0.6, fz, bw };
      if (!b.lot) fitText(gx, b.name, bw - 0.8, 0.8, 0.22, st === 'diner' ? 0xff4fa0 : col2, 0, signY + 0.24, 0.5, st === 'diner' ? 'l' : 'g', st === 'diner' ? 0.6 : 0);
      if (st === 'diner') { gx.p('x', P.rboxS, 0xd8dee9, 0, 1.1, 0.12, 0, 0, 0, w, 0.25, 0.12); gx.p('x', P.rboxS, 0xd8dee9, 0, 3.0, 0.12, 0, 0, 0, w, 0.18, 0.12); }
      if (st === 'rival1') { const bg = dishModel('burger'); bg.scale.setScalar(16); bg.position.set(b.x, h + 0.4, b.z - 1); T.extra.push(bg); }
      if (st === 'rival2') { const pz = dishModel('pizza'); pz.scale.setScalar(13); pz.rotation.x = -1.1; pz.position.set(b.x, h + 2.4, b.z + (ry ? -1 : 1) * 0.5); pz.rotation.order = 'YXZ'; pz.rotation.y = ry; T.extra.push(pz); }
      if (st === 'ratita') { gx.p('e', P.sphere, 0xc4b5fd, 0, h + 0.5, -d / 2, 0, 0, 0, 5.5, 4.2, 5.5); gx.p('g', torus(0.08, 40), 0xff4fa0, 0, h + 0.6, -d / 2, PI / 2, 0, 0, 5.6, 5.6, 4);
        for (const sd of [-1, 1]) { gx.p('g', P.sphere, 0xa9afbd, sd * 4.2, h + 4.2, -d / 2 + 0.4, 0, 0, 0, 1.9, 1.9, 0.5); gx.p('g', P.sphere, 0xffb3c7, sd * 4.2, h + 4.2, -d / 2 + 0.62, 0, 0, 0, 1.3, 1.3, 0.35); }
        gx.p('x', P.cyl, 0xd1d5db, 3, h + 6, -d / 2, 0, 0, 0, 0.08, 4, 0.08); gx.p('l', P.sphere, 0xff4fa0, 3, h + 8, -d / 2, 0, 0, 0, 0.3, 0.3, 0.3, 1);
        gx.p('l', P.rboxS, 0x3ff0ff, 0, 0.3, 0.2, 0, 0, 0, w - 1, 0.1, 0.1, 0.5); gx.p('n', P.rboxS, 0xb9a8ff, 0, 1.8, 0.08, 0, 0, 0, w - 4, 2.6, 0.05); }
      if (st === 'dealer') { gx.p('e', P.rboxS, 0xdbeafe, 0, 1.9, 0.2, 0, 0, 0, w - 1, 3.4, 0.1); for (let i = 0; i < 10; i++) gx.p('f', P.cone, [0xef4444, 0xfacc15, 0x3b82f6][i % 3], -w / 2 + 1 + i * (w - 2) / 9, h + 0.3, 0.5, PI, 0, 0, 0.3, 0.6, 0.05); }
      if (st === 'shack') { for (let i = 0; i < 6; i++) gx.p('m', P.cyl, 0x8b5a2b, -w / 2 + 1 + i * (w - 2) / 5, 0.3, 0.6, 0, 0, 0, 0.18, 1.6, 0.18); gx.p('g', P.capsule, 0xff6b9a, w / 2 + 0.6, 1.4, 0.4, 0, 0, 0.15, 0.6, 2.4, 0.15); gx.p('g', P.capsule, 0x22d3ee, w / 2 + 1.3, 1.4, 0.3, 0, 0, -0.1, 0.6, 2.4, 0.15); }
      if (st === 'bistro' || st === 'diner') for (const sd of [-1, 1]) { const tx = sd * (w / 2 - 2.4); gx.p('g', rcyl(0.55, 0.06, 0.02), 0xffffff, tx, 0.95, 2.2); gx.p('x', P.cyl, 0x374151, tx, 0.5, 2.2, 0, 0, 0, 0.05, 0.95, 0.05);
        gx.p('f', P.cone, col2, tx, 2.6, 2.2, 0, 0, 0, 1.5, 0.6, 1.5); gx.p('x', P.cyl, 0xd1d5db, tx, 1.8, 2.2, 0, 0, 0, 0.04, 1.8, 0.04); for (const cz of [-0.85, 0.85]) { gx.p('g', rcyl(0.25, 0.06, 0.02), col2, tx + cz, 0.5, 2.2); gx.p('x', P.cyl, 0x374151, tx + cz, 0.25, 2.2, 0, 0, 0, 0.03, 0.5, 0.03); } }
    }
    // planters + bins either side of the door
    for (const sd of [-1, 1]) { gx.p('g', rcyl(0.45, 0.6, 0.08), 0x9a3412, sd * 1.9, 0, 0.9); gx.p('f', blobGeo(5 + sd, 0.2, 2), 0x2f9e44, sd * 1.9, 0.95, 0.9, 0, 0, 0, 0.55, 0.5, 0.55); }
  }
  // for-sale lots
  if (b.lot) { const sx = new XB(B).set(...xyz(b, w / 2 - 1.5, 0, fz + 3), ry); T.forSale[b.id] = { pos: xyz(b, w / 2 - 1.5, 0, fz + 3) }; }
  // collider + door
  const hw = (ry ? w : w) / 2 + 0.4, hd = d / 2 + 0.4; T.colliders.push({ x0: b.x - hw, x1: b.x + hw, z0: b.z - hd, z1: b.z + hd, bid: b.id });
  const dz = b.face === 'n' ? -1 : 1; T.doors.push({ bid: b.id, x: b.x, z: b.z + dz * (d / 2 + 1.3), ry: b.face === 'n' ? PI : 0, name: b.name });
  return toGroup(B);
}
function xyz(b, lx, ly, lz) { const ry = b.face === 'n' ? PI : 0; const c = Math.cos(ry), s = Math.sin(ry); return [b.x + lx * c + lz * s, ly, b.z - lx * s + lz * c]; }
// ---------- signs that change at runtime (owned lots, for sale) ----------
export function makeLotSign(b, label, col, sale) {
  const S = T.signs[b.id]; const B = MB(); const x = new XB(B, b.x, 0, b.z, S.ry);
  if (label) fitText(x, label, S.bw - 0.8, 0.8, 0.22, col, 0, S.y - 0.36, S.fz + 0.5, 'g');
  if (sale) { const fx = b.w / 2 - 1.2, fz = S.fz + 3.2; x.p('m', P.cyl, 0x8b5a2b, fx - 0.7, 1, fz, 0, 0, 0, 0.07, 2, 0.07); x.p('m', P.cyl, 0x8b5a2b, fx + 0.7, 1, fz, 0, 0, 0, 0.07, 2, 0.07);
    x.p('g', P.rbox, 0xffffff, fx, 1.8, fz, 0, 0, 0, 1.9, 0.9, 0.1); x.p('g', P.rboxS, 0xdc2626, fx, 1.8, fz + 0.01, 0, 0, 0, 2.0, 1.0, 0.06);
    fitText(x, 'FOR SALE', 1.6, 0.28, 0.06, 0xdc2626, fx, 1.82, fz + 0.08); fitText(x, '$' + sale, 1.4, 0.22, 0.05, 0x111827, fx, 1.45, fz + 0.08); }
  return toGroup(B);
}
// inspection grade letter in the front window
export function makeGrade(b, g) {
  const S = T.signs[b.id]; if (!S) return null; const B = MB(); const x = new XB(B, b.x, 0, b.z, S.ry);
  const col = { A: 0x16a34a, B: 0x2563eb, C: 0xf59e0b, F: 0xdc2626 }[g] || 0x16a34a;
  x.p('g', P.rbox, 0xffffff, -2.6, 2.0, S.fz + 0.16, 0, 0, 0, 0.9, 1.0, 0.06); x.p('g', P.rboxS, col, -2.6, 2.0, S.fz + 0.14, 0, 0, 0, 1.0, 1.1, 0.04);
  const tg = textGeo(g, 0.55, 0.08); if (tg) x.p('g', tg, col, -2.6, 1.75, S.fz + 0.2);
  return toGroup(B, false);
}
// ---------- ground ----------
function groundMats() {
  const grass = canvasTex('grass', 512, (g, s) => { const r = rng(5); noiseFill(g, s, '#5cbf4a', 0.25, 9000, 5, r); for (let i = 0; i < 1600; i++) { g.fillStyle = r() < 0.5 ? 'rgba(30,110,30,.25)' : 'rgba(170,230,110,.2)'; g.fillRect(r() * s, r() * s, 1.5, 5); } });
  grass.repeat.set(70, 70);
  const asph = canvasTex('asph', 512, (g, s) => { const r = rng(9); noiseFill(g, s, '#4a4f5a', 0.3, 14000, 3, r); for (let i = 0; i < 60; i++) { g.strokeStyle = 'rgba(30,30,35,.25)'; g.lineWidth = 1 + r() * 2; g.beginPath(); let x = r() * s, y = r() * s; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); } });
  asph.repeat.set(2, 30);
  const pave = canvasTex('pave', 256, (g, s) => { g.fillStyle = '#d9d4cc'; g.fillRect(0, 0, s, s); g.strokeStyle = '#b9b3aa'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * s / 4, 0); g.lineTo(i * s / 4, s); g.stroke(); g.beginPath(); g.moveTo(0, i * s / 4); g.lineTo(s, i * s / 4); g.stroke(); } const r = rng(3); for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.06})`; g.fillRect(r() * s, r() * s, 2, 2); } });
  const sand = canvasTex('sand', 256, (g, s) => noiseFill(g, s, '#f3dfa6', 0.25, 5000, 2, rng(4))); sand.repeat.set(30, 6);
  return { grass: new THREE.MeshStandardMaterial({ map: grass, roughness: 0.95 }), asph: new THREE.MeshStandardMaterial({ map: asph, roughness: 0.85 }), pave: new THREE.MeshStandardMaterial({ map: pave, roughness: 0.9 }), sand: new THREE.MeshStandardMaterial({ map: sand, roughness: 1 }) };
}
function ground(G) {
  const M = groundMats();
  const g = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), M.grass); g.rotation.x = -PI / 2; g.position.set(0, 0, -40); g.receiveShadow = true; G.add(g);
  // roads (x-running and z-running strips)
  const span = 2 * 96;
  for (const c of ROADS) {
    const a = new THREE.Mesh(new THREE.PlaneGeometry(RW, span), M.asph); a.rotation.x = -PI / 2; a.position.set(c, 0.03, 0); a.receiveShadow = true; G.add(a);
    const m2 = M.asph.clone(); m2.map = M.asph.map.clone(); m2.map.repeat.set(30, 2); m2.map.needsUpdate = true;
    const b = new THREE.Mesh(new THREE.PlaneGeometry(span, RW), m2); b.rotation.x = -PI / 2; b.position.set(0, 0.035, c); b.receiveShadow = true; G.add(b);
  }
  // sidewalks: raised ring per block + plaza
  const pm = M.pave; pm.map.repeat.set(1, 1);
  const B = MB();
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const cx = -60 + i * 60, cz = -60 + j * 60, half = 30 - RW / 2;
    if (i === 1 && j === 1) continue;
    B.m.add(P.rboxS, 0xa3a3a3, cx, 0.09, cz, 0, 0, 0, half * 2, 0.18, half * 2); // curb
  }
  B.m.add(P.rboxS, 0xa3a3a3, 0, 0.09, 99 + 1.6, 0, 0, 0, 192, 0.18, 3.2); // waterfront curb
  const curb = toGroup(B, false); G.add(curb);
  // paving surfaces (textured)
  const pv = new THREE.Group();
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const cx = -60 + i * 60, cz = -60 + j * 60, half = 30 - RW / 2;
    if (i === 1 && j === 1) { const pg = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, half * 2), pm.clone()); pg.material.map = pm.map.clone(); pg.material.map.repeat.set(12, 12); pg.material.map.needsUpdate = true; pg.rotation.x = -PI / 2; pg.position.set(cx, 0.05, cz); pg.receiveShadow = true; pv.add(pg); continue; }
    for (const [ox, oz, w, d] of [[0, -half + SIDEW / 2, half * 2, SIDEW], [0, half - SIDEW / 2, half * 2, SIDEW], [-half + SIDEW / 2, 0, SIDEW, half * 2 - SIDEW * 2], [half - SIDEW / 2, 0, SIDEW, half * 2 - SIDEW * 2]]) {
      const mm = pm.clone(); mm.map = pm.map.clone(); mm.map.repeat.set(w / 1.6, d / 1.6); mm.map.needsUpdate = true; const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mm); p.rotation.x = -PI / 2; p.position.set(cx + ox, 0.185, cz + oz); p.receiveShadow = true; pv.add(p); }
  }
  G.add(pv);
  // beach + water
  const sd = new THREE.Mesh(new THREE.PlaneGeometry(260, 30), M.sand); sd.rotation.x = -PI / 2; sd.position.set(0, 0.04, 116); sd.receiveShadow = true; G.add(sd);
  const wm = new THREE.MeshPhysicalMaterial({ color: 0x1aa8d6, roughness: 0.08, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.92 });
  const wg = new THREE.PlaneGeometry(420, 140, 60, 20); const water = new THREE.Mesh(wg, wm); water.rotation.x = -PI / 2; water.position.set(0, -0.15, 195); water.receiveShadow = true; G.add(water); T.water = water;
  T.waterBase = wg.attributes.position.array.slice();
}
function roadMarks(G) {
  const dash = [], cross = [];
  for (const c of ROADS) for (let t = -93; t <= 93; t += 4) { if (ROADS.some((r) => Math.abs(t - r) < 8)) continue; dash.push(mat4(c, 0.05, t, 0, 1), mat4(t, 0.055, c, PI / 2, 1)); }
  for (const cx of ROADS) for (const cz of ROADS) for (let k = -4; k <= 4; k++) { cross.push(mat4(cx + k * 1.2, 0.06, cz - 8.2, 0, 1), mat4(cx + k * 1.2, 0.06, cz + 8.2, 0, 1), mat4(cx - 8.2, 0.06, cz + k * 1.2, PI / 2, 1), mat4(cx + 8.2, 0.06, cz + k * 1.2, PI / 2, 1)); }
  const a = MB(); a.g.add(P.rboxS, 0xfde047, 0, 0, 0, 0, 0, 0, 0.22, 0.02, 2); G.add(instanced(a, dash, false));
  const b = MB(); b.g.add(P.rboxS, 0xf8fafc, 0, 0, 0, 0, 0, 0, 0.6, 0.02, 3); G.add(instanced(b, cross, false));
}
// ---------- decor (instanced, culled, far LOD) ----------
function treeB(kind, col) { const b = MB(); const x = new XB(b);
  if (kind === 'palm') { for (let i = 0; i < 6; i++) x.p('m', P.sphere, 0x9a6b3c, Math.sin(i * 0.3) * 0.25, 0.5 + i * 0.95, 0, 0, 0, 0.05 * i, 0.32 - i * 0.02, 0.6, 0.32 - i * 0.02);
    for (let i = 0; i < 7; i++) x.p('s', leaf(), 0x22a34a, 0.5, 5.8, 0, -1.2, i / 7 * PI * 2, 0, 1.4, 2.6, 1.4); return b; }
  x.p('m', P.cyl, 0x8b5a2b, 0, 1.2, 0, 0, 0, 0, 0.26, 2.4, 0.26);
  if (kind === 'pine') { for (let i = 0; i < 3; i++) x.p('f', P.cone, col, 0, 2.4 + i * 1.3, 0, 0, 0, 0, 2.0 - i * 0.5, 2.2, 2.0 - i * 0.5); return b; }
  x.p('f', P.ico, col, 0, 3.6, 0, 0, 0, 0, 1.9, 1.7, 1.9); x.p('f', P.ico, col, 0.9, 3.0, 0.4, 0, 0, 0, 1.2); x.p('f', P.ico, col, -0.8, 3.2, -0.5, 0, 0, 0, 1.3); x.p('f', P.ico, col, 0.1, 4.6, -0.2, 0, 0, 0, 1.1);
  if (kind === 'bloom') for (let i = 0; i < 9; i++) x.p('g', P.sphere, 0xffb3d1, Math.cos(i * 2.3) * 1.6, 3.4 + Math.sin(i) * 0.9, Math.sin(i * 2.3) * 1.6, 0, 0, 0, 0.2);
  return b; }
function decorSet(G, b, mats, lod) { if (!mats.length) return; const g = instanced(b, mats, true); g.children.forEach((m) => { m.userData.decor = 1; }); G.add(g);
  if (lod) { LOW.on = true; const lb = lod(); LOW.on = false; const lg = instanced(lb, mats, true); const ch = g.children, lc = lg.children; for (let i = 0; i < ch.length; i++) if (lc[i]) { ch[i].userData.lod = lc[i]; lc[i].count = 0; } G.add(lg); } }
function decor(G) {
  const r = rng(77); const trees = { round: [], pine: [], bloom: [], palm: [] }, lamps = [], benches = [], bins = [], hyd = [], bush = [];
  const blocked = (x, z, rad) => T.colliders.some((c) => x > c.x0 - rad - 2 && x < c.x1 + rad + 2 && z > c.z0 - rad - 6 && z < c.z1 + rad + 6) || ROADS.some((c) => Math.abs(x - c) < RW / 2 + 1.5 || Math.abs(z - c) < RW / 2 + 1.5);
  // street trees + lamps along sidewalks
  for (const c of ROADS) for (let t = -84; t <= 84; t += 12) { if (ROADS.some((r2) => Math.abs(t - r2) < 10)) continue;
    for (const sd of [-1, 1]) { const off = c + sd * (RW / 2 + SIDEW - 0.9); const isLamp = ((t / 12) | 0) % 2 === 0;
      if (Math.abs(off) > 97) continue;
      const add = (x, z) => { if (isLamp) { lamps.push(mat4(x, 0, z, sd > 0 ? 0 : PI)); T.circles.push({ x, z, r: 0.35 }); T.lampLights.push([x, z]); } else { const k = r() < 0.2 ? 'bloom' : 'round'; trees[k].push(mat4(x, 0, z, r() * 6, 0.8 + r() * 0.3)); T.circles.push({ x, z, r: 0.5 }); } };
      add(off, t); if (Math.abs(c) < 97) add(t, off); }
  }
  // park (centre block)
  for (let i = 0; i < 26; i++) { const a = i / 26 * PI * 2, rr = 16 + r() * 5; const x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (Math.abs(x) < 3 || Math.abs(z) < 3) continue; trees[r() < 0.4 ? 'bloom' : 'round'].push(mat4(x, 0, z, r() * 6, 0.8 + r() * 0.4)); T.circles.push({ x, z, r: 0.6 }); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + 0.4; benches.push(mat4(Math.cos(a) * 10, 0.05, Math.sin(a) * 10, -a - PI / 2)); }
  // outskirts: forest ring + hills
  for (let i = 0; i < 220; i++) { const a = r() * PI * 2, rr = 108 + r() * 60; const x = Math.cos(a) * rr, z = Math.sin(a) * rr * 0.9 - 10; if (z > 98) continue; trees[r() < 0.5 ? 'pine' : 'round'].push(mat4(x, 0, z, r() * 6, 0.9 + r() * 0.6)); if (Math.abs(x) < 136 && z > -146) T.circles.push({ x, z, r: 0.7 }); }
  for (let i = -10; i <= 10; i++) { const x = i * 12 + (r() - 0.5) * 4; if (Math.abs(x + 20) < 12 || Math.abs(x - 24) < 10) continue; trees.palm.push(mat4(x, 0, 103 + r() * 2, r() * 6, 0.8 + r() * 0.3)); T.circles.push({ x, z: 104, r: 0.5 }); }
  // per-building bins / hydrants
  for (const d of T.doors) { const sx = d.x + 4.2, sz = d.z + (d.ry ? -1.5 : 1.5); bins.push(mat4(sx, 0.18, sz, 0)); T.circles.push({ x: sx, z: sz, r: 0.4 }); hyd.push(mat4(d.x - 5, 0.18, d.z + (d.ry ? -2.6 : 2.6), 0)); }
  for (let i = 0; i < 60; i++) { const x = (r() - 0.5) * 190, z = (r() - 0.5) * 190; if (blocked(x, z, 1)) continue; bush.push(mat4(x, 0.1, z, r() * 6, 0.6 + r() * 0.5)); }
  const tcol = { round: 0x3fae4a, pine: 0x1f7a3d, bloom: 0x58b947 };
  for (const k of ['round', 'pine', 'bloom', 'palm']) decorSet(G, treeB(k, tcol[k]), trees[k], () => treeB(k, tcol[k]));
  const lb = () => { const b = MB(); const x = new XB(b); x.p('x', P.cyl, 0x334155, 0, 2.3, 0, 0, 0, 0, 0.09, 4.6, 0.09); x.p('x', rcyl(0.25, 0.3, 0.1), 0x334155, 0, 0, 0); x.p('x', torus(0.1, 20, PI / 2), 0x334155, 0, 4.6, 0.5, 0, PI / 2, 0, 0.5, 0.5, 0.5);
    x.p('n', P.sphere, 0xfff4cc, 0, 4.85, 1.0, 0, 0, 0, 0.32, 0.22, 0.32); x.p('x', P.sphere, 0x334155, 0, 5.0, 1.0, 0, 0, 0, 0.36, 0.14, 0.36); x.p('f', P.rboxS, 0xff4fa0, 0.2, 3.4, 0, 0, 0, 0, 0.04, 1.0, 0.6); return b; };
  decorSet(G, lb(), lamps, lb);
  const bb = MB(); { const x = new XB(bb); for (let i = 0; i < 3; i++) x.p('m', P.rboxS, 0xb45309, 0, 0.5, -0.2 + i * 0.22, 0, 0, 0, 1.8, 0.07, 0.18); for (let i = 0; i < 2; i++) x.p('m', P.rboxS, 0xb45309, 0, 0.8 + i * 0.2, -0.38, 0.2, 0, 0, 1.8, 0.12, 0.05); for (const s of [-0.75, 0.75]) x.p('x', P.rboxS, 0x1f2937, s, 0.3, 0, 0, 0, 0, 0.08, 0.6, 0.7); }
  decorSet(G, bb, benches);
  const bn = MB(); { const x = new XB(bn); x.p('g', rcyl(0.32, 0.9, 0.06), 0x15803d, 0, 0, 0); x.p('g', P.sphere, 0x166534, 0, 0.9, 0, 0, 0, 0, 0.34, 0.12, 0.34); } decorSet(G, bn, bins);
  const hy = MB(); { const x = new XB(hy); x.p('g', rcyl(0.18, 0.6, 0.05), 0xdc2626, 0, 0, 0); x.p('g', P.sphere, 0xdc2626, 0, 0.62, 0, 0, 0, 0, 0.2); x.p('g', P.cyl, 0xfacc15, 0, 0.4, 0, 0, 0, PI / 2, 0.08, 0.5, 0.08); } decorSet(G, hy, hyd);
  const bu = MB(); { const x = new XB(bu); x.p('f', blobGeo(11, 0.25, 2), 0x2f9e44, 0, 0.4, 0, 0, 0, 0, 0.9, 0.7, 0.9); x.p('g', P.sphere, 0xff6b9a, 0.4, 0.8, 0.3, 0, 0, 0, 0.12); x.p('g', P.sphere, 0xffd23f, -0.3, 0.85, -0.2, 0, 0, 0, 0.11); } decorSet(G, bu, bush);
}
function park(G) {
  const B = MB(); const x = new XB(B);
  // fountain
  x.p('m', lathe([[0, 0], [4.2, 0], [4.4, 0.2], [4.4, 0.7], [4.0, 0.75], [3.9, 0.3], [0, 0.3]], 48), 0xe7e5e4, 0, 0.05, 0); x.p('e', rcyl(3.9, 0.55, 0.05), 0x60c8f0, 0, 0.1, 0);
  x.p('m', P.cyl, 0xe7e5e4, 0, 1.4, 0, 0, 0, 0, 0.5, 2.4, 0.5); x.p('m', lathe([[0, 0], [1.6, 0.0], [1.7, 0.25], [0.3, 0.4], [0, 0.4]], 40), 0xe7e5e4, 0, 2.4, 0); x.p('e', P.sphere, 0x9be3ff, 0, 3.1, 0, 0, 0, 0, 0.5, 0.8, 0.5);
  T.circles.push({ x: 0, z: 0, r: 4.6 });
  // paths
  for (let i = 0; i < 4; i++) x.p('m', P.rboxS, 0xe8dcc4, 0, 0.08, 0, 0, i * PI / 2, 0, 3, 0.06, 48);
  x.p('m', torus(0.06, 64), 0xe8dcc4, 0, 0.08, 0, PI / 2, 0, 0, 10, 10, 1.5);
  // gazebo
  const gz = new XB(B, 15, 0, 15, 0);
  gz.p('m', rcyl(4, 0.4, 0.1), 0xffffff, 0, 0, 0); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; gz.p('g', P.cyl, 0xffffff, Math.cos(a) * 3.5, 1.9, Math.sin(a) * 3.5, 0, 0, 0, 0.12, 3, 0.12); }
  gz.p('g', P.cone, 0xff6b9a, 0, 4.2, 0, 0, 0, 0, 4.3, 1.8, 4.3); gz.p('g', P.sphere, 0xffd23f, 0, 5.2, 0, 0, 0, 0, 0.3);
  T.circles.push({ x: 15, z: 15, r: 0.6 });
  // flower beds
  for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4; const cx = Math.cos(a) * 6.5, cz = Math.sin(a) * 6.5; x.p('m', rcyl(1.6, 0.3, 0.08), 0x8b5a2b, cx, 0.05, cz); for (let i = 0; i < 12; i++) { const b2 = i / 12 * PI * 2; x.p('g', P.sphere, [0xff6b9a, 0xffd23f, 0xa78bfa, 0xffffff][i % 4], cx + Math.cos(b2) * 1.1, 0.5, cz + Math.sin(b2) * 1.1, 0, 0, 0, 0.16); x.p('s', P.sphere, 0x22a34a, cx + Math.cos(b2) * 1.1, 0.38, cz + Math.sin(b2) * 1.1, 0, 0, 0, 0.18, 0.12, 0.18); } }
  // Torty's lemonade cart
  const lc = new XB(B, -12, 0, 12, 0.6);
  lc.p('m', P.rbox, 0xfef08a, 0, 0.9, 0, 0, 0, 0, 2.2, 1.2, 1.1); lc.p('g', P.rboxS, 0x4ade80, 0, 1.55, 0, 0, 0, 0, 2.4, 0.1, 1.3); for (const s of [-1, 1]) lc.p('g', torus(0.35, 20), 0x374151, s * 0.9, 0.35, 0.58, 0, 0, 0, 0.3, 0.3, 0.5);
  for (const s of [-1, 1]) lc.p('x', P.cyl, 0xd1d5db, s * 1.05, 2.3, 0, 0, 0, 0, 0.04, 1.5, 0.04); awning(lc, 0, 3.05, -0.75, 2.4, 0x4ade80, 1.4);
  lc.p('e', lathe([[0, 0], [0.25, 0], [0.25, 0.6], [0, 0.6]], 20), 0xfff59d, 0.4, 1.6, 0); lc.p('g', lathe([[0, 0], [0.24, 0], [0.24, 0.45], [0, 0.45]], 20), 0xfde047, 0.4, 1.61, 0);
  T.circles.push({ x: -12, z: 12, r: 1.4 });
  // pier + boats
  const pr = new XB(B, -20, 0, 128, 0); for (let i = 0; i < 10; i++) pr.p('m', P.rboxS, 0xa16207, 0, 0.35, -6 + i * 1.6, 0, 0, 0, 4, 0.14, 1.5); for (let i = 0; i < 6; i++) for (const s of [-1, 1]) pr.p('m', P.cyl, 0x78350f, s * 1.9, -0.2, -6 + i * 3, 0, 0, 0, 0.16, 1.4, 0.16);
  G.add(toGroup(B));
}
export function buildTown(scene) {
  const G = new THREE.Group(); T.grp = G; T.extra = []; T.colliders.length = 0; T.circles.length = 0; T.doors.length = 0;
  ground(G); roadMarks(G);
  T.bgroups = {};
  for (const b of BUILDINGS) { const g = building(b); g.userData.bid = b.id; T.bgroups[b.id] = g; G.add(g); }
  for (const e of T.extra) G.add(e);
  park(G); decor(G);
  // hills on the horizon
  const H = MB(); const r = rng(31); for (let i = 0; i < 26; i++) { const a = i / 26 * PI * 2; if (Math.sin(a) > 0.55) continue; const rr = 200 + r() * 40; H.f.add(blobGeo(i, 0.15, 3), [0x6cc35a, 0x5bb04d, 0x7bcf63][i % 3], Math.cos(a) * rr, -6, Math.sin(a) * rr - 30, 0, r() * 6, 0, 30 + r() * 20, 16 + r() * 18, 30 + r() * 20); }
  const hills = toGroup(H, false); G.add(hills);
  scene.add(G); return T;
}
export function animTown(t) { // gentle waves (only the vertices, cheap: 1.2k verts)
  if (!T.water) return; const p = T.water.geometry.attributes.position, a = p.array, b = T.waterBase;
  for (let i = 0; i < a.length; i += 3) a[i + 2] = b[i + 2] + Math.sin(b[i] * 0.12 + t * 1.3) * 0.12 + Math.cos(b[i + 1] * 0.15 + t) * 0.1;
  p.needsUpdate = true;
}
// collision vs buildings + circles (+ world edge + water)
export function collideTown(x, z, rad) {
  let hit = false;
  for (const c of T.colliders) { if (x > c.x0 - rad && x < c.x1 + rad && z > c.z0 - rad && z < c.z1 + rad) { hit = true;
      const dl = x - (c.x0 - rad), dr = c.x1 + rad - x, dt = z - (c.z0 - rad), db = c.z1 + rad - z, m = Math.min(dl, dr, dt, db);
      if (m === dl) x = c.x0 - rad; else if (m === dr) x = c.x1 + rad; else if (m === dt) z = c.z0 - rad; else z = c.z1 + rad; } }
  for (const c of T.circles) { const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz), m = c.r + rad; if (d < m && d > 1e-4) { hit = true; x = c.x + dx / d * m; z = c.z + dz / d * m; } }
  if (x < -130) { x = -130; hit = true; } if (x > 130) { x = 130; hit = true; } if (z < -140) { z = -140; hit = true; }
  const zmax = Math.abs(x + 20) < 2.2 ? 134 : 124; if (z > zmax) { z = zmax; hit = true; }
  return { x, z, hit };
}
