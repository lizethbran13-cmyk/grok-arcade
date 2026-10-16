// Grok Grocery Tycoon - store fixtures you can build, swap and stock. Each fixture type is modelled once per stock level
// (full / half / empty) and drawn with InstancedMeshes per store, so a whole sales floor costs a handful of draw calls.
import * as THREE from 'three';
import { World, rbox } from './world.js?v=ggt12';
import { MATS } from './mats.js?v=ggt12';
import { textGeo } from './text3d.js?v=ggt12';
import { rcyl, lathe, sph, cyl, cone, torus, capsule, star, blobGeo } from './shapes.js?v=ggt12';
import { FIX, SHELF_TYPES, DEPTS } from './data.js?v=ggt12';
const PI = Math.PI;
let seed = 1; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647; const pick = (a) => a[(R() * a.length) | 0];
const BOX = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 10, 1), SPH = new THREE.SphereGeometry(1, 9, 6), CAP = new THREE.CapsuleGeometry(0.5, 1, 2, 6);
const JUG = lathe([[0, 0], [0.5, 0], [0.5, 0.62], [0.3, 0.86], [0.18, 0.92], [0.18, 1], [0, 1]], 10, 'gjug'), BOT = lathe([[0, 0], [0.5, 0], [0.5, 0.55], [0.2, 0.75], [0.18, 1], [0, 1]], 9, 'gbot');
const BRIGHT = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x3b82f6, 0xa855f7, 0xec4899, 0x14b8a6, 0xffffff, 0x0ea5e9];
function txt(w, s, x, y, z, ry, size, col, b = 'g', em = 0) { const g = textGeo(s, size, size * 0.25); if (!g) return; w.add(b, g, col, x, y, z, 0, ry, 0, 1, 1, 1, em); }
// two-sided department sign on top of a fixture
function topSign(w, word, col, y = 2.3, L = 2.6) { w.add('g', rbox(0.14, 0.62, L, 0.06), col, 0, y + 0.31, 0); w.add('x', cyl(8), 0x94a3b8, 0, y - 0.25, -L / 2 + 0.3, 0, 0, 0, 0.03, 0.3, 0.03); w.add('x', cyl(8), 0x94a3b8, 0, y - 0.25, L / 2 - 0.3, 0, 0, 0, 0.03, 0.3, 0.03);
  const s = Math.min(0.3, L / word.length * 0.95); txt(w, word, 0.08, y + 0.2, 0, PI / 2, s, 0xffffff); txt(w, word, -0.08, y + 0.2, 0, -PI / 2, s, 0xffffff); }
function product(w, x, y, z, side, H) { const k = R(); const c = pick(BRIGHT);
  if (k < 0.35) { const h = H * (0.7 + R() * 0.3); w.add('g', BOX, c, x, y + h / 2, z, 0, 0, 0, 0.3, h, 0.36); w.add('g', BOX, 0xffffff, x + side * 0.151, y + h * 0.6, z, 0, 0, 0, 0.005, h * 0.3, 0.22); }
  else if (k < 0.6) { for (let i = 0; i < 2; i++) w.add('g', CYL, c, x, y + 0.08 + i * 0.16, z - 0.09 + i * 0.0, 0, 0, 0, 0.08, 0.15, 0.08); w.add('g', CYL, c, x, y + 0.08, z + 0.1, 0, 0, 0, 0.08, 0.15, 0.08); w.add('x', CYL, 0xd1d5db, x, y + 0.17, z + 0.1, 0, 0, 0, 0.08, 0.02, 0.08); }
  else if (k < 0.8) { w.add('g', BOT, c, x, y, z - 0.08, 0, 0, 0, 0.13, H * 0.85, 0.13); w.add('g', BOT, c, x, y, z + 0.1, 0, 0, 0, 0.13, H * 0.85, 0.13); }
  else { w.add('g', CYL, c, x, y + 0.11, z, 0, 0, 0, 0.11, 0.22, 0.11); w.add('g', CYL, 0xfde68a, x, y + 0.24, z, 0, 0, 0, 0.115, 0.04, 0.115); } }
// ---------------- the fixture models (local: centred, 2 m wide in x, 5 m long in z) ----------------
const MODELS = {
  aisle(w, f) { const L = 5; w.add('m', rbox(1.9, 0.16, L, 0.04, 1), 0x475569, 0, 0.08, 0); w.add('m', rbox(0.1, 2.0, L, 0.03, 1), 0xe2e8f0, 0, 1.1, 0);
    for (let i = 0; i < 4; i++) { const y = 0.22 + i * 0.47; [-1, 1].forEach((s) => { w.add('x', BOX, 0xcbd5e1, s * 0.45, y, 0, 0, 0, 0, 0.82, 0.04, L - 0.06); w.add('g', BOX, i % 2 ? 0xfef08a : 0xffffff, s * 0.87, y - 0.02, 0, 0, 0, 0, 0.02, 0.07, L - 0.1);
      for (let k = 0; k < 11; k++) if (R() < f * 1.1 - (f < 1 ? 0.1 : 0)) product(w, s * 0.5, y + 0.02, -L / 2 + 0.3 + k * 0.44, s, 0.36); }); }
    [-1, 1].forEach((e) => { w.add('m', rbox(1.6, 0.9, 0.6, 0.05, 1), 0xef4444, 0, 0.45, e * (L / 2 + 0.3)); for (let i = 0; i < (f > 0 ? 6 : 1); i++) w.add('g', BOX, pick(BRIGHT), -0.5 + (i % 3) * 0.5, 0.98 + Math.floor(i / 3) * 0.32, e * (L / 2 + 0.3), 0, 0.2, 0, 0.4, 0.3, 0.3); w.add('l', BOX, 0xfde047, 0, 1.6, e * (L / 2 + 0.32), 0, 0, 0, 0.7, 0.35, 0.03, 0.2); });
    topSign(w, 'GROCERY', 0xdc2626); },
  produce(w, f) { const L = 5; w.add('m', rbox(1.9, 0.6, L, 0.06, 1), 0x8b5a2b, 0, 0.3, 0); w.add('m', rbox(0.3, 1.4, L, 0.05, 1), 0x7c4a1e, 0, 0.7, 0);
    const kinds = [[0xdc2626, 'a'], [0xf97316, 'a'], [0xfacc15, 'b'], [0x84cc16, 'a'], [0x7c3aed, 'g'], [0x22c55e, 'l'], [0xea580c, 'c'], [0x15803d, 'w'], [0xfde047, 'a'], [0xef4444, 'a']];
    [-1, 1].forEach((s) => { for (let tier = 0; tier < 2; tier++) for (let bin = 0; bin < 5; bin++) { const x = s * (0.75 - tier * 0.38), y = 0.62 + tier * 0.35, z = -L / 2 + 0.5 + bin * 1.0, [c, t] = kinds[(bin * 2 + tier + (s > 0 ? 5 : 0)) % kinds.length];
      w.add('m', rbox(0.42, 0.14, 0.92, 0.03, 1), 0xa16207, x, y, z, 0, 0, s * 0.25); const n = Math.round(f * 7); for (let i = 0; i < n; i++) { const px = x + (R() - 0.5) * 0.25, pz = z + (R() - 0.5) * 0.7, py = y + 0.12 + (i > 3 ? 0.1 : 0);
        if (t === 'a') w.add('g', SPH, c, px, py, pz, 0, 0, 0, 0.09); else if (t === 'b') w.add('g', CAP, c, px, py, pz, 0.3, R() * 3, 1.3, 0.07, 0.22, 0.07); else if (t === 'g') { for (let q = 0; q < 3; q++) w.add('g', SPH, c, px + q * 0.03, py + q * 0.03, pz, 0, 0, 0, 0.05); }
        else if (t === 'l') w.add('g', blobGeo(i & 7, 0.25, 1), c, px, py, pz, 0, R() * 6, 0, 0.13, 0.1, 0.13); else if (t === 'c') w.add('g', cone(8), c, px, py, pz, 0, R() * 3, PI / 2, 0.035, 0.26, 0.035); else w.add('g', SPH, c, px, py + 0.02, pz, 0, R(), 0, 0.15, 0.12, 0.13); } } });
    w.add('m', rbox(0.12, 0.1, L + 0.3, 0.03, 1), 0x7c4a1e, 0, 2.15, 0); [-1, 1].forEach((e) => w.add('m', cyl(8), 0x7c4a1e, 0, 1.4, e * L / 2, 0, 0, 0, 0.05, 0.8, 0.05)); w.add('x', cyl(8), 0xcbd5e1, 0, 1.95, 0, PI / 2, 0, 0, 0.03, L, 0.03);
    for (let i = 0; i < 5; i++) w.add('l', sph(6), 0xbfe9ff, 0, 1.92, -2 + i, 0, 0, 0, 0.03, 0.03, 0.03, 0.3); topSign(w, 'PRODUCE', 0x16a34a, 2.25); },
  bakery(w, f) { const L = 5; w.add('m', rbox(1.9, 0.9, L, 0.06, 1), 0xfde68a, 0, 0.45, 0); w.add('m', rbox(1.95, 0.06, L + 0.05, 0.02, 1), 0x7c4a1e, 0, 0.92, 0);
    w.add('e', rbox(0.9, 0.7, L - 0.2, 0.15, 2), 0xe0f2fe, 0.45, 1.3, 0); w.add('x', BOX, 0xd1d5db, 0.45, 1.25, 0, 0, 0, 0, 0.8, 0.03, L - 0.3);
    const n = Math.round(f * 9); for (let i = 0; i < n; i++) { const z = -2.1 + i * 0.52; const k = i % 3; if (k === 0) { w.add('g', rcyl(0.17, 0.14, 0.04, 14), 0xfbcfe8, 0.45, 0.98, z); w.add('g', rcyl(0.15, 0.1, 0.04, 14), 0xffffff, 0.45, 1.12, z); w.add('g', SPH, 0xdc2626, 0.45, 1.25, z, 0, 0, 0, 0.03); }
      else if (k === 1) { for (let q = 0; q < 3; q++) w.add('g', cyl(8), pick([0xf9a8d4, 0x93c5fd, 0xfde68a]), 0.3 + q * 0.14, 1.0, z, 0, 0, 0, 0.05, 0.08, 0.05); } else { w.add('g', torus(0.4, 10), 0xd97706, 0.4, 1.0, z, PI / 2, 0, 0, 0.08); w.add('g', torus(0.4, 10), 0xec4899, 0.55, 1.0, z + 0.1, PI / 2, 0, 0, 0.08); }
      w.add('g', CAP, 0xd97706, 0.45, 1.3, z, 0, 0.3, PI / 2, 0.1, 0.18, 0.1); }
    // bread rack on the other side: baskets of baguettes and loaves
    w.add('m', rbox(0.8, 1.9, L, 0.05, 1), 0x92400e, -0.5, 0.95, 0); for (let r = 0; r < 3; r++) for (let b = 0; b < 4; b++) { const y = 0.5 + r * 0.55, z = -1.8 + b * 1.2; w.add('f', rbox(0.5, 0.2, 0.9, 0.06, 1), 0xd6a35c, -0.82, y, z); if (R() < f + 0.05) for (let q = 0; q < 4; q++) w.add('g', CAP, pick([0xd97706, 0xb45309, 0xf59e0b]), -0.85, y + 0.15, z - 0.3 + q * 0.2, r === 1 ? 0.6 : 0, 0, r === 1 ? 0 : PI / 2, 0.1, r === 1 ? 0.4 : 0.15, 0.1); }
    topSign(w, 'BAKERY', 0xd97706, 2.35); },
  deli(w, f) { const L = 5; w.add('m', rbox(1.0, 1.0, L, 0.06, 1), 0xffffff, 0.45, 0.5, 0); w.add('m', rbox(1.0, 0.06, L, 0.02, 1), 0x1f2937, 0.45, 1.02, 0); w.add('e', rbox(0.5, 0.55, L - 0.2, 0.12, 2), 0xe0f2fe, 0.7, 1.32, 0);
    const n = Math.round(f * 8); for (let i = 0; i < n; i++) { const z = -2.1 + i * 0.6; if (i % 2) w.add('g', CAP, pick([0xfda4af, 0xfb7185, 0xbe123c]), 0.45, 1.15, z, 0, 0, PI / 2, 0.16, 0.32, 0.16); else { w.add('g', rcyl(0.17, 0.12, 0.03, 14), 0xfcd34d, 0.45, 1.06, z); w.add('g', BOX, 0xfde68a, 0.45, 1.23, z + 0.05, 0, 0.4, 0, 0.18, 0.1, 0.12); } }
    { w.add('x', rcyl(0.18, 0.05, 0.02, 14), 0x94a3b8, 0.1, 1.06, -2.0); w.add('x', cyl(14), 0xd1d5db, 0.1, 1.26, -2.0, PI / 2, 0, 0.3, 0.17, 0.03, 0.17); w.add('x', BOX, 0x94a3b8, 0.1, 1.08, 1.9, 0, 0, 0, 0.3, 0.1, 0.3); w.add('l', BOX, 0x22c55e, 0.26, 1.12, 1.9, 0, 0, 0, 0.01, 0.06, 0.18, 0.4); }
    w.add('m', rbox(0.8, 1.7, L, 0.05, 1), 0xfce7f3, -0.5, 0.85, 0); for (let r = 0; r < 3; r++) { const y = 0.35 + r * 0.5; w.add('x', BOX, 0xcbd5e1, -0.85, y, 0, 0, 0, 0, 0.4, 0.03, L - 0.1); for (let k = 0; k < 10; k++) if (R() < f + 0.05) w.add('g', BOX, pick([0xfef3c7, 0xfde68a, 0xfbcfe8, 0xbbf7d0]), -0.85, y + 0.1, -2.2 + k * 0.48, 0, 0, 0.6, 0.18, 0.06, 0.3); }
    topSign(w, 'DELI', 0xdb2777, 2.2); },
  meat(w, f) { const L = 5; w.add('g', rbox(1.9, 0.85, L, 0.12, 2), 0xf8fafc, 0, 0.42, 0); w.add('l', rbox(1.6, 0.03, L - 0.3, 0.01, 1), 0xdbeafe, 0, 0.86, 0, 0, 0, 0, 1, 1, 1, 0.15); w.add('g', rbox(0.25, 0.45, L, 0.06, 1), 0xf1f5f9, 0, 1.05, 0);
    const n = Math.round(f * 9); [-1, 1].forEach((s) => { for (let i = 0; i < n; i++) { const z = -2.15 + i * 0.54; const fish = s > 0 && i % 3 === 0; w.add('g', BOX, 0xffffff, s * 0.5, 0.9, z, 0, 0, 0, 0.36, 0.04, 0.42);
      if (fish) w.add('g', SPH, 0x94a3b8, s * 0.5, 0.97, z, 0, 0.3, 0, 0.16, 0.05, 0.08); else w.add('g', rbox(0.28, 0.06, 0.32, 0.03, 1), pick([0xb91c1c, 0xdc2626, 0xf87171, 0xfb923c, 0xfde68a]), s * 0.5, 0.95, z); w.add('e', BOX, 0xffffff, s * 0.5, 0.99, z, 0, 0, 0, 0.36, 0.01, 0.42); } });
    w.add('l', BOX, 0xffffff, 0, 1.3, 0, 0, 0, 0, 0.1, 0.04, L - 0.2, 0.2); topSign(w, 'MEAT & FISH', 0xb91c1c, 2.0); },
  frozen(w, f) { const L = 5; w.add('m', rbox(1.95, 2.2, L, 0.06, 1), 0x334155, 0, 1.1, 0);
    [-1, 1].forEach((s) => { for (let d = 0; d < 4; d++) { const z = -L / 2 + 0.62 + d * 1.25; w.add('l', BOX, 0xe0f2fe, s * 0.9, 1.1, z, 0, 0, 0, 0.02, 1.9, 1.15, 0.05);
        for (let r = 0; r < 4; r++) { const y = 0.35 + r * 0.45; for (let k = 0; k < 3; k++) if (R() < f * 1.05 - (f < 1 ? 0.08 : 0)) w.add('g', BOX, pick([0x60a5fa, 0x22d3ee, 0xa78bfa, 0xf472b6, 0xffffff, 0xfacc15]), s * 0.75, y + 0.15, z - 0.35 + k * 0.35, 0, 0, 0, 0.22, 0.3, 0.3); }
        w.add('e', BOX, 0xcfefff, s * 0.99, 1.1, z, 0, 0, 0, 0.02, 1.95, 1.18); w.add('x', BOX, 0xe5e7eb, s * 1.0, 1.1, z + 0.45, 0, 0, 0, 0.04, 0.7, 0.05); }
      w.add('l', BOX, 0xbfe9ff, s * 0.98, 2.15, 0, 0, 0, 0, 0.04, 0.08, L - 0.1, 0.4); });
    w.add('g', star(), 0xffffff, 0, 2.95, 0, 0, PI / 2, 0, 0.3, 0.3, 0.3); topSign(w, 'FROZEN', 0x0284c7, 2.2); },
  dairy(w, f) { const L = 5; w.add('m', rbox(0.5, 2.2, L, 0.05, 1), 0xf1f5f9, 0, 1.1, 0);
    [-1, 1].forEach((s) => { for (let r = 0; r < 4; r++) { const y = 0.3 + r * 0.46; w.add('x', BOX, 0xe2e8f0, s * 0.6, y, 0, 0, 0, 0, 0.75, 0.04, L - 0.06); w.add('l', BOX, 0x93c5fd, s * 0.98, y - 0.02, 0, 0, 0, 0, 0.02, 0.05, L - 0.1, 0.25);
      for (let k = 0; k < 9; k++) { if (R() > f * 1.05 - (f < 1 ? 0.08 : 0)) continue; const z = -2.2 + k * 0.55, x = s * 0.62, t = (k + r) % 4;
        if (t === 0) { w.add('g', JUG, 0xffffff, x, y + 0.02, z, 0, 0, 0, 0.13, 0.36, 0.13); w.add('g', CYL, pick([0x2563eb, 0xdc2626, 0x16a34a]), x, y + 0.4, z, 0, 0, 0, 0.04, 0.04, 0.04); }
        else if (t === 1) w.add('g', BOX, 0xfef3c7, x, y + 0.07, z, 0, 0, 0, 0.26, 0.11, 0.42); else if (t === 2) { for (let q = 0; q < 3; q++) w.add('g', CYL, pick([0xfbcfe8, 0xbbf7d0, 0xfde68a, 0xe9d5ff]), x, y + 0.07, z - 0.15 + q * 0.15, 0, 0, 0, 0.06, 0.12, 0.06); }
        else w.add('g', BOX, 0xfacc15, x, y + 0.06, z, 0, 0.3, 0, 0.22, 0.1, 0.16); } } });
    topSign(w, 'DAIRY', 0x2563eb, 2.3); },
  brand(w, f) { w.add('m', rbox(1.9, 0.3, 4.6, 0.08, 1), 0x4c1d95, 0, 0.15, 0); const lv = f > 0.7 ? 4 : f > 0.2 ? 2 : 0;
    for (let l = 0; l < lv; l++) for (let i = 0; i < 4 - l; i++) for (let j = 0; j < 8 - l; j++) w.add('g', BOX, (i + j + l) % 3 ? 0x7c3aed : 0xfacc15, -0.6 + l * 0.2 + i * 0.4, 0.5 + l * 0.38, -1.75 + l * 0.25 + j * 0.5, 0, 0, 0, 0.36, 0.34, 0.44);
    w.add('x', cyl(8), 0x94a3b8, 0, 1.6, 0, 0, 0, 0, 0.04, 1.6, 0.04); w.add('l', star(), 0xfacc15, 0, 2.4, 0, 0, PI / 2, 0, 0.5, 0.5, 0.25, 0.35); topSign(w, 'GROK GOODS', 0x7c3aed, 2.9, 3.0); },
  register(w) { const T = w; T.add('m', rbox(0.9, 0.85, 2.6, 0.06, 1), 0x15803d, -0.55, 0.425, 0); T.add('m', rbox(0.95, 0.05, 2.65, 0.02, 1), 0xe5e7eb, -0.55, 0.87, 0); T.add('m', rbox(0.6, 0.03, 1.5, 0.02, 1), 0x111827, -0.55, 0.9, -0.45);
    [-1.2, 0.3].forEach((z) => T.add('x', cyl(10), 0x94a3b8, -0.55, 0.92, z, PI / 2, 0, PI / 2, 0.04, 0.6, 0.04)); T.add('e', BOX, 0xff4f4f, -0.55, 0.9, 0.55, 0, 0, 0, 0.4, 0.02, 0.3); T.add('l', BOX, 0xff2d2d, -0.55, 0.92, 0.55, 0, 0, 0, 0.3, 0.005, 0.02, 0.6);
    T.add('x', cyl(8), 0x475569, -0.85, 0.9, 0.2, 0, 0, 0, 0.03, 0.5, 0.03); T.add('g', rbox(0.06, 0.32, 0.42, 0.03, 1), 0x1e293b, -0.85, 1.45, 0.2, 0, 0, 0.2); T.add('l', BOX, 0x38bdf8, -0.82, 1.45, 0.2, 0, 0, 0.2, 0.01, 0.26, 0.36, 0.35);
    T.add('g', rbox(0.18, 0.1, 0.12, 0.02, 1), 0x111827, -0.2, 0.95, 0.5); T.add('l', BOX, 0x22c55e, -0.12, 0.97, 0.5, 0, 0, 0, 0.01, 0.03, 0.08, 0.5);
    T.add('x', cyl(10), 0xcbd5e1, -0.55, 0.9, 1.05, 0, 0, 0, 0.3, 0.4, 0.3); for (let i = 0; i < 3; i++) T.add('f', BOX, 0xffffff, -0.55 + Math.cos(i * 2.1) * 0.22, 1.32, 1.05 + Math.sin(i * 2.1) * 0.22, 0, i * 2.1, 0, 0.18, 0.3, 0.12);
    T.add('x', cyl(8), 0x64748b, -0.95, 0.9, -1.2, 0, 0, 0, 0.035, 1.3, 0.035); T.add('l', rbox(0.3, 0.3, 0.3, 0.06, 1), 0xfde047, -0.95, 2.3, -1.2, 0, 0, 0, 1, 1, 1, 0.4);
    // impulse rack (gum + magazines) at the head of the lane
    T.add('m', rbox(0.25, 1.2, 0.8, 0.04, 1), 0x15803d, 1.55, 0.6, -1.6); for (let i = 0; i < 8; i++) T.add('g', BOX, pick(BRIGHT), 1.42, 0.3 + (i % 4) * 0.25, -1.85 + Math.floor(i / 4) * 0.45, 0, 0, 0, 0.04, 0.18, 0.32);
    T.add('g', rbox(0.5, 0.5, 0.5, 0.05, 1), 0x15803d, -1.4, 0.25, 1.4); },
  selfck(w) { [-0.9, 0.9].forEach((x) => { w.add('m', rbox(0.7, 0.85, 0.7, 0.08, 1), 0xff4fa0, x, 0.425, 0.2); w.add('x', cyl(8), 0x475569, x, 0.85, -0.05, 0, 0, 0, 0.04, 0.6, 0.04); w.add('g', rbox(0.55, 0.4, 0.06, 0.04, 1), 0x1e293b, x, 1.55, -0.05, -0.3, 0, 0);
      w.add('l', BOX, 0xff8fcb, x, 1.55, -0.02, -0.3, 0, 0, 0.47, 0.32, 0.01, 0.4); w.add('e', BOX, 0xff4f4f, x, 0.87, 0.3, 0, 0, 0, 0.3, 0.01, 0.25); w.add('x', BOX, 0xcbd5e1, x, 0.9, 0.75, 0, 0, 0, 0.5, 0.04, 0.4); w.add('f', BOX, 0xffffff, x, 1.05, 0.75, 0, 0, 0, 0.25, 0.28, 0.15); });
    w.add('x', cyl(8), 0x64748b, 0, 0, -0.8, 0, 0, 0, 0.035, 2.3, 0.035); w.add('l', rbox(0.9, 0.3, 0.1, 0.04, 1), 0xff4fa0, 0, 2.4, -0.8, 0, 0, 0, 1, 1, 1, 0.4); },
};
// ---------------- general merchandise fixtures (same 2 x 5 m footprint) ----------------
const shelfRun = (w, f, tiers, H, col, put, back = 0xe2e8f0) => { const L = 5; w.add('m', rbox(1.9, 0.16, L, 0.04, 1), 0x475569, 0, 0.08, 0); w.add('m', rbox(0.1, H, L, 0.03, 1), back, 0, H / 2 + 0.1, 0);
  for (let i = 0; i < tiers; i++) { const y = 0.22 + i * (H - 0.2) / tiers; [-1, 1].forEach((s) => { w.add('x', BOX, col, s * 0.45, y, 0, 0, 0, 0, 0.82, 0.04, L - 0.06); w.add('g', BOX, 0xffffff, s * 0.87, y - 0.02, 0, 0, 0, 0, 0.02, 0.07, L - 0.1);
    for (let k = 0; k < 6; k++) w.add('g', BOX, 0xfef08a, s * 0.885, y - 0.02, -2.1 + k * 0.84, 0, 0, 0, 0.01, 0.06, 0.16); put(s, y, i); }); } };
const fill = (f) => R() < f * 1.08 - (f < 1 ? 0.08 : 0);
Object.assign(MODELS, {
  snackrack(w, f) { shelfRun(w, f, 3, 1.5, 0xcbd5e1, (s, y) => { for (let k = 0; k < 10; k++) { if (!fill(f)) continue; const z = -2.25 + k * 0.5, c = pick(BRIGHT); if (k % 3 === 2) { for (let q = 0; q < 3; q++) w.add('g', BOX, pick(BRIGHT), s * (0.3 + q * 0.18), y + 0.08, z, 0, 0, 0, 0.14, 0.14, 0.36); }
      else { w.add('g', rbox(0.1, 0.36, 0.3, 0.04, 1), c, s * 0.62, y + 0.2, z, s * -0.2, 0, 0); w.add('g', BOX, 0xffffff, s * 0.68, y + 0.24, z, s * -0.2, 0, 0, 0.005, 0.1, 0.2); w.add('g', rbox(0.1, 0.36, 0.3, 0.04, 1), c, s * 0.4, y + 0.2, z, s * -0.2, 0, 0); } } });
    [-1, 1].forEach((e) => { const z = e * 2.85; w.add('m', rbox(0.8, 1.1, 0.55, 0.06, 1), 0x1f2937, 0, 0.55, z); [-0.2, 0.2].forEach((x, i) => { w.add('e', cyl(12), 0xffffff, x, 1.35, z, 0, 0, 0, 0.16, 0.5, 0.16); w.add('l', cyl(12), i ? 0x38bdf8 : 0xef4444, x, 1.3, z, 0, 0, 0, 0.14, 0.4, 0.14, 0.3); }); w.add('l', BOX, 0x22d3ee, 0, 1.75, z, 0, 0, 0, 0.7, 0.18, 0.05, 0.4); });
    topSign(w, 'SNACKS', 0xf97316, 1.9); },
  rxshelf(w, f) { shelfRun(w, f, 4, 1.9, 0xf1f5f9, (s, y, i) => { for (let k = 0; k < 11; k++) { if (!fill(f)) continue; const z = -2.3 + k * 0.44, t = (k + i) % 3, c = pick([0x0d9488, 0x2563eb, 0xec4899, 0xf97316, 0x7c3aed]);
      if (t === 0) { w.add('g', BOX, 0xffffff, s * 0.6, y + 0.15, z, 0, 0, 0, 0.22, 0.28, 0.3); w.add('g', BOX, c, s * 0.715, y + 0.18, z, 0, 0, 0, 0.005, 0.08, 0.3); } else if (t === 1) { w.add('g', BOT, c, s * 0.6, y, z - 0.08, 0, 0, 0, 0.09, 0.3, 0.09); w.add('g', BOT, 0xffffff, s * 0.6, y, z + 0.1, 0, 0, 0, 0.09, 0.26, 0.09); }
      else { w.add('g', CYL, 0xf59e0b, s * 0.6, y + 0.1, z, 0, 0, 0, 0.07, 0.2, 0.07); w.add('g', CYL, 0xffffff, s * 0.6, y + 0.22, z, 0, 0, 0, 0.075, 0.04, 0.075); } } });
    topSign(w, 'HEALTH', 0x0d9488, 2.3); },
  rxcounter(w, f) { const L = 5; w.add('m', rbox(0.9, 1.05, L, 0.06, 1), 0xffffff, 0.55, 0.52, 0); w.add('m', rbox(0.95, 0.06, L, 0.02, 1), 0x0f766e, 0.55, 1.07, 0); w.add('e', rbox(0.04, 0.9, L - 0.4, 0.02, 1), 0xd1fae5, 0.85, 1.6, 0);
    w.add('m', rbox(0.1, 2.4, L, 0.03, 1), 0xf0fdfa, -0.05, 1.2, 0); for (let r = 0; r < 5; r++) { const y = 0.3 + r * 0.42; w.add('x', BOX, 0xe2e8f0, -0.45, y, 0, 0, 0, 0, 0.7, 0.03, L - 0.1); for (let k = 0; k < 14; k++) if (fill(f)) { w.add('g', CYL, pick([0xf59e0b, 0xea580c, 0xfbbf24]), -0.5 + (k % 2) * 0.2, y + 0.1, -2.3 + k * 0.34, 0, 0, 0, 0.06, 0.17, 0.06); w.add('g', CYL, 0xffffff, -0.5 + (k % 2) * 0.2, y + 0.2, -2.3 + k * 0.34, 0, 0, 0, 0.065, 0.03, 0.065); } }
    { w.add('x', BOX, 0x111827, 0.55, 1.2, -1.4, 0, -0.4, 0, 0.3, 0.2, 0.36); w.add('l', BOX, 0x22c55e, 0.66, 1.25, -1.4, 0, -0.4, 0, 0.01, 0.12, 0.26, 0.4); for (let i = 0; i < Math.round(f * 6); i++) w.add('g', BOX, 0xffffff, 0.5, 1.12 + i * 0.05, 0.6 + (i % 2) * 0.3, 0, 0, 0, 0.25, 0.04, 0.2); w.add('g', BOX, 0xfacc15, 0.95, 0.75, 1.4, 0, 0, 0, 0.02, 0.3, 0.6); }
    [-1, 1].forEach((e) => { w.add('l', BOX, 0x22c55e, 0.85, 2.55, e * 1.8, 0, 0, 0, 0.06, 0.5, 0.16, 0.6); w.add('l', BOX, 0x22c55e, 0.85, 2.55, e * 1.8, 0, 0, 0, 0.06, 0.16, 0.5, 0.6); }); topSign(w, 'PHARMACY', 0x0f766e, 2.55); },
  petfood(w, f) { shelfRun(w, f, 3, 1.9, 0xfed7aa, (s, y, i) => { for (let k = 0; k < 8; k++) { if (!fill(f)) continue; const z = -2.2 + k * 0.62;
      if (i === 0) { const c = pick([0x92400e, 0x16a34a, 0xdc2626, 0x2563eb]); w.add('g', rbox(0.34, 0.55, 0.42, 0.06, 1), c, s * 0.55, y + 0.3, z); w.add('g', SPH, 0xffffff, s * 0.725, y + 0.36, z, 0, 0, 0, 0.01, 0.09, 0.09); }
      else if (i === 1) { for (let q = 0; q < 3; q++) w.add('g', CYL, pick([0xfde68a, 0xfca5a5, 0xbfdbfe]), s * 0.55, y + 0.05 + q * 0.09, z, 0, 0, 0, 0.09, 0.08, 0.09); w.add('g', CYL, 0xd1d5db, s * 0.55, y + 0.31, z, 0, 0, 0, 0.09, 0.01, 0.09); }
      else { if (k % 2) w.add('g', torus(0.35, 10), pick(BRIGHT), s * 0.55, y + 0.15, z, 0, PI / 2, 0, 0.12); else { w.add('g', SPH, 0xa3e635, s * 0.55, y + 0.1, z - 0.1, 0, 0, 0, 0.08); w.add('g', CAP, 0xfef3c7, s * 0.55, y + 0.08, z + 0.12, 0, 0, PI / 2, 0.07, 0.2, 0.07); } } } });
    [-1, 1].forEach((e) => { w.add('g', rcyl(0.45, 0.22, 0.1, 18), 0xc2410c, 0, 0, e * 2.85); w.add('g', rcyl(0.34, 0.12, 0.08, 16), 0xfef3c7, 0, 0.14, e * 2.85); }); topSign(w, 'PET FOOD', 0xc2410c, 2.3); },
  aquarium(w, f) { const L = 5; w.add('m', rbox(1.9, 0.8, L, 0.05, 1), 0x1f2937, 0, 0.4, 0); w.add('m', rbox(1.9, 0.08, L, 0.02, 1), 0x111827, 0, 2.05, 0);
    for (let t = 0; t < 2; t++) for (let b = 0; b < 3; b++) { const y = 0.8 + t * 0.62 + 0.28, z = -1.65 + b * 1.65; w.add('l', BOX, 0x0ea5e9, 0, y, z, 0, 0, 0, 1.75, 0.5, 1.5, 0.05); w.add('e', BOX, 0xe0f2fe, 0, y, z, 0, 0, 0, 1.82, 0.56, 1.56); w.add('g', BOX, pick([0xfde68a, 0xd6d3d1]), 0, y - 0.24, z, 0, 0, 0, 1.7, 0.06, 1.45);
      for (let q = 0; q < 3; q++) w.add('g', cone(6), 0x16a34a, (q - 1) * 0.5, y - 0.1, z + (q % 2 ? 0.4 : -0.4), 0, 0, 0, 0.06, 0.32, 0.06); w.add('x', BOX, 0x334155, 0, y + 0.3, z, 0, 0, 0, 1.8, 0.04, 1.5);
      const n = Math.round(f * 7); for (let i = 0; i < n; i++) { const c = pick([0xf97316, 0xfacc15, 0xef4444, 0x22d3ee, 0xa855f7, 0xffffff]), fx = (R() - 0.5) * 1.4, fz = z + (R() - 0.5) * 1.1, fy = y - 0.1 + R() * 0.25; w.add('g', SPH, c, fx, fy, fz, 0, R() * 6, 0, 0.06, 0.045, 0.03); w.add('g', cone(4), c, fx + 0.07, fy, fz, 0, 0, PI / 2, 0.03, 0.06, 0.03); } }
    topSign(w, 'FISH', 0x0284c7, 2.3); },
  toyshelf(w, f) { shelfRun(w, f, 4, 2.0, 0xfde68a, (s, y, i) => { for (let k = 0; k < 9; k++) { if (!fill(f)) continue; const z = -2.25 + k * 0.56, t = (k + i * 2) % 5, c = pick(BRIGHT);
      if (t === 0) { w.add('g', BOX, c, s * 0.58, y + 0.18, z, 0, 0, 0, 0.3, 0.34, 0.42); w.add('e', BOX, 0xe0f2fe, s * 0.735, y + 0.2, z, 0, 0, 0, 0.01, 0.2, 0.26); w.add('g', SPH, pick(BRIGHT), s * 0.62, y + 0.2, z, 0, 0, 0, 0.08); }
      else if (t === 1) w.add('g', SPH, c, s * 0.58, y + 0.15, z, 0, 0, 0, 0.15);
      else if (t === 2) { w.add('g', BOX, 0x94a3b8, s * 0.58, y + 0.12, z, 0, 0, 0, 0.18, 0.2, 0.16); w.add('g', BOX, 0xcbd5e1, s * 0.58, y + 0.3, z, 0, 0, 0, 0.14, 0.13, 0.13); w.add('l', BOX, 0x22d3ee, s * 0.655, y + 0.31, z, 0, 0, 0, 0.01, 0.03, 0.09, 0.5); }
      else if (t === 3) { w.add('g', SPH, 0xb45309, s * 0.58, y + 0.13, z, 0, 0, 0, 0.13); w.add('g', SPH, 0xb45309, s * 0.58, y + 0.31, z, 0, 0, 0, 0.09); [-1, 1].forEach((q) => w.add('g', SPH, 0x92400e, s * 0.58, y + 0.39, z + q * 0.07, 0, 0, 0, 0.035)); }
      else { w.add('g', BOX, c, s * 0.58, y + 0.04, z, 0, 0, 0, 0.36, 0.08, 0.44); w.add('g', BOX, pick(BRIGHT), s * 0.58, y + 0.12, z, 0, 0.2, 0, 0.32, 0.08, 0.4); } } });
    [-1, 1].forEach((e) => { const z = e * 2.85; w.add('g', BOX, 0xdc2626, 0, 0.35, z, 0, 0, 0, 0.9, 0.2, 0.4); for (let q = 0; q < 3; q++) w.add('g', torus(0.3, 12), 0x111827, -0.3 + q * 0.3, 0.22, z, 0, PI / 2, 0, 0.08); w.add('g', BOX, 0x2563eb, 0, 0.55, z, 0, 0, 0, 0.35, 0.25, 0.35); w.add('g', cyl(10), 0x111827, 0.25, 0.75, z, 0, 0, 0, 0.06, 0.3, 0.06); });
    topSign(w, 'TOYS', 0xe11d48, 2.4); },
  plushbin(w, f) { [-1.25, 1.25].forEach((z, b) => { w.add('g', rcyl(0.9, 0.85, 0.1, 22), b ? 0x22c55e : 0xec4899, 0, 0, z); w.add('m', torus(0.08, 26), 0xffffff, 0, 0.86, z, PI / 2, 0, 0, 0.9, 0.9, 0.9);
      const n = Math.round(f * 16); for (let i = 0; i < n; i++) { const a = i * 2.4, r = 0.25 + (i % 3) * 0.2, x = Math.cos(a) * r, zz = z + Math.sin(a) * r, y = 0.95 + (i % 4) * 0.08;
        if (b === 0) { const c = pick([0xf9a8d4, 0xfde68a, 0xc4b5fd, 0xa5f3fc, 0xffffff, 0xb45309]); w.add('g', SPH, c, x, y, zz, 0, 0, 0, 0.15); w.add('g', SPH, c, x - 0.1, y + 0.13, zz, 0, 0, 0, 0.05); w.add('g', SPH, c, x + 0.1, y + 0.13, zz, 0, 0, 0, 0.05); w.add('g', SPH, 0x111827, x, y + 0.03, zz + 0.14, 0, 0, 0, 0.02); }
        else w.add('g', SPH, pick(BRIGHT), x, y - 0.05, zz, 0, 0, 0, 0.13); } });
    w.add('x', cyl(8), 0x94a3b8, 0, 1.4, 0, 0, 0, 0, 0.04, 2.8, 0.04); w.add('g', rbox(1.4, 0.5, 0.1, 0.05, 1), 0xfacc15, 0, 2.4, 0, 0, PI / 2, 0); txt(w, 'HUG ME!', 0.07, 2.32, 0, PI / 2, 0.2, 0xdc2626); txt(w, 'BOUNCE!', -0.07, 2.32, 0, -PI / 2, 0.2, 0xdc2626);
    topSign(w, 'PLUSH PALS', 0xec4899, 2.9, 1.8); },
  shoewall(w, f) { const L = 5; w.add('m', rbox(1.9, 0.5, L, 0.04, 1), 0xffffff, 0, 0.25, 0); w.add('m', rbox(0.12, 2.3, L, 0.03, 1), 0xf5f3ff, 0, 1.2, 0);
    [-1, 1].forEach((s) => { for (let r = 0; r < 4; r++) { const y = 0.75 + r * 0.42; w.add('x', BOX, 0xe5e7eb, s * 0.3, y, 0, 0, 0, s * 0.18, 0.46, 0.03, L - 0.1); w.add('l', BOX, 0xffffff, s * 0.53, y - 0.03, 0, 0, 0, 0, 0.01, 0.02, L - 0.2, 0.2);
        for (let k = 0; k < 7; k++) { if (!fill(f)) continue; const z = -2.15 + k * 0.72, c = pick([0xef4444, 0x111827, 0xffffff, 0x2563eb, 0x7c3aed, 0x92400e, 0xfacc15, 0x22c55e]); [-0.09, 0.09].forEach((o) => { w.add('g', rbox(0.3, 0.1, 0.12, 0.04, 1), c, s * 0.32, y + 0.08, z + o, 0, 0, s * 0.18); w.add('g', SPH, c, s * 0.38, y + 0.12, z + o, 0, 0, 0, 0.07, 0.05, 0.055); w.add('g', BOX, 0xffffff, s * 0.32, y + 0.025, z + o, 0, 0, s * 0.18, 0.31, 0.025, 0.125); }); } }
      for (let k = 0; k < 6; k++) if (fill(f)) for (let q = 0; q < 2; q++) w.add('g', BOX, pick([0xf97316, 0x111827, 0xe5e7eb, 0x2563eb]), s * 0.6, 0.6 + q * 0.18, -2.1 + k * 0.84, 0, 0, 0, 0.5, 0.17, 0.32); });
    topSign(w, 'SNEAKERS', 0x7c3aed, 2.5); },
  shoetable(w, f) { [-1.3, 1.3].forEach((z, t) => { w.add('m', rbox(1.5, 0.75, 1.9, 0.05, 1), t ? 0xddd6fe : 0xfef3c7, 0, 0.375, z); w.add('g', rbox(0.7, 0.25, 0.7, 0.04, 1), 0xffffff, 0, 0.88, z);
      for (let i = 0; i < Math.round(f * 5); i++) { const x = (i % 2 ? 0.45 : -0.45), zz = z - 0.6 + i * 0.3, c = pick([0xef4444, 0x111827, 0xffffff, 0x2563eb, 0x92400e]); w.add('g', rbox(0.3, 0.11, 0.12, 0.04, 1), c, x, 0.82, zz, 0, 0.5, 0); w.add('g', BOX, 0xffffff, x, 0.77, zz, 0, 0.5, 0, 0.31, 0.03, 0.13); }
      if (f > 0) { w.add('g', rbox(0.3, 0.14, 0.12, 0.05, 1), t ? 0x111827 : 0xdc2626, 0, 1.08, z, 0, 0.3, 0); w.add('g', BOX, 0xffffff, 0, 1.01, z, 0, 0.3, 0, 0.32, 0.03, 0.13); } });
    w.add('f', rbox(0.5, 0.42, 4.6, 0.12, 2), 0x7c3aed, -0.75, 0.21, 0); w.add('f', rbox(0.5, 0.42, 4.6, 0.12, 2), 0x7c3aed, 0.75, 0.21, 0);
    w.add('x', BOX, 0x94a3b8, 0, 0.02, 2.4, 0, 0, 0, 0.3, 0.03, 0.12); w.add('e', rbox(0.6, 1.5, 0.04, 0.02, 1), 0xe0f2fe, 0, 1.2, -2.45); w.add('m', rbox(0.66, 1.56, 0.03, 0.02, 1), 0x6d28d9, 0, 1.2, -2.48);
    topSign(w, 'TRY ON', 0x6d28d9, 2.0, 1.8); },
  tvwall(w, f) { const L = 5; w.add('m', rbox(1.9, 0.7, L, 0.05, 1), 0x1f2937, 0, 0.35, 0); w.add('m', rbox(0.2, 2.6, L, 0.03, 1), 0x0f172a, 0, 1.3, 0);
    const scr = [0x38bdf8, 0x22c55e, 0xf97316, 0xa855f7, 0xec4899, 0xfacc15]; let n = 0;
    [-1, 1].forEach((s) => { for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) { if (!fill(f)) continue; const y = 1.25 + r * 0.82, z = -1.2 + k * 2.4; w.add('x', rbox(0.06, 0.72, 2.0, 0.02, 1), 0x111827, s * 0.14, y, z); w.add('l', BOX, scr[n++ % 6], s * 0.175, y, z, 0, 0, 0, 0.01, 0.62, 1.88, 0.55); w.add('l', BOX, 0xffffff, s * 0.178, y + 0.12, z - 0.4, 0, 0, 0, 0.01, 0.12, 0.5, 0.6); }
      for (let k = 0; k < 4; k++) if (fill(f)) { const z = -1.9 + k * 1.25; w.add('x', BOX, 0x111827, s * 0.6, 0.76, z, 0, 0, 0, 0.18, 0.1, 0.9); if (k % 2) { w.add('g', BOX, 0xffffff, s * 0.6, 0.86, z + 0.1, 0, 0, 0, 0.3, 0.08, 0.36); w.add('l', BOX, 0x22d3ee, s * 0.6, 0.91, z + 0.1, 0, 0, 0, 0.2, 0.01, 0.02, 0.6); } } });
    topSign(w, '4K TVs', 0x0ea5e9, 2.75); },
  techcase(w, f) { const L = 5; w.add('m', rbox(1.6, 0.85, L - 0.4, 0.05, 1), 0xffffff, 0, 0.425, 0); w.add('m', rbox(1.65, 0.05, L - 0.35, 0.02, 1), 0xe2e8f0, 0, 0.87, 0);
    for (let i = 0; i < 8; i++) { if (!fill(f)) continue; const z = -2.0 + i * 0.58, x = i % 2 ? 0.4 : -0.4, t = i % 4;
      if (t === 0) { w.add('x', BOX, 0x111827, x, 0.91, z, 0, 0.2, 0, 0.42, 0.03, 0.3); w.add('x', BOX, 0x111827, x, 1.06, z - 0.13, -0.4, 0.2, 0, 0.42, 0.28, 0.02); w.add('l', BOX, 0x60a5fa, x, 1.06, z - 0.115, -0.4, 0.2, 0, 0.38, 0.24, 0.005, 0.5); }
      else if (t === 1) { for (let q = 0; q < 3; q++) { w.add('x', BOX, 0x111827, x - 0.2 + q * 0.2, 0.95, z, -0.5, 0, 0, 0.09, 0.17, 0.02); w.add('l', BOX, pick([0x22c55e, 0xf472b6, 0x38bdf8]), x - 0.2 + q * 0.2, 0.95, z + 0.012, -0.5, 0, 0, 0.08, 0.15, 0.005, 0.5); } }
      else if (t === 2) { w.add('g', torus(0.12, 12), pick([0x111827, 0xffffff, 0xef4444]), x, 1.05, z, 0, PI / 2, 0, 0.13); [-1, 1].forEach((q) => w.add('g', SPH, 0x334155, x, 0.94, z + q * 0.13, 0, 0, 0, 0.06, 0.07, 0.04)); }
      else { w.add('g', BOX, 0x111827, x, 0.94, z, 0, 0, 0, 0.36, 0.07, 0.24); w.add('g', BOX, pick([0x2563eb, 0xef4444]), x + 0.25, 0.92, z, 0, 0.4, 0, 0.12, 0.05, 0.08); } }
    [-1, 1].forEach((e) => { w.add('e', rbox(1.0, 0.5, 0.5, 0.04, 1), 0xe0f2fe, 0, 1.15, e * 2.55); w.add('m', rbox(1.05, 0.9, 0.55, 0.04, 1), 0x0f172a, 0, 0.45, e * 2.55); if (f > 0) for (let q = 0; q < 3; q++) w.add('l', BOX, pick([0x38bdf8, 0xa855f7]), -0.3 + q * 0.3, 1.05, e * 2.55, 0, 0, 0, 0.12, 0.2, 0.01, 0.5); });
    topSign(w, 'GADGETS', 0x0ea5e9, 2.2); },
  clothesrack(w, f) { [-1.4, 1.4].forEach((z, k) => { w.add('x', cyl(10), 0xd1d5db, 0, 0.7, z, 0, 0, 0, 0.04, 1.4, 0.04); w.add('x', rcyl(0.35, 0.05, 0.02, 14), 0x94a3b8, 0, 0.03, z); w.add('x', torus(0.03, 28), 0xd1d5db, 0, 1.4, z, PI / 2, 0, 0, 0.75, 0.75, 0.75);
      const n = Math.round(f * 14), c0 = pick([0xef4444, 0x2563eb, 0xfacc15, 0x16a34a, 0xec4899]); for (let i = 0; i < n; i++) { const a = i / 14 * PI * 2, x = Math.cos(a) * 0.75, zz = z + Math.sin(a) * 0.75, c = i % 3 ? c0 : pick(BRIGHT); w.add('g', rbox(0.06, 0.62, 0.42, 0.03, 1), c, x, 1.07, zz, 0, -a, 0); w.add('x', torus(0.1, 8), 0x64748b, x, 1.43, zz, 0, -a + PI / 2, 0, 0.05); } });
    w.add('m', rbox(0.5, 0.12, 0.5, 0.04, 1), 0x111827, 0, 0.06, 0); w.add('g', BOX, 0xfacc15, 0, 1.75, 0, 0, 0, 0, 0.04, 0.4, 0.7); txt(w, '30% OFF', 0.03, 1.7, 0, PI / 2, 0.14, 0xdc2626); txt(w, '30% OFF', -0.03, 1.7, 0, -PI / 2, 0.14, 0xdc2626);
    topSign(w, 'NEW ARRIVALS', 0xdb2777, 2.2, 2.4); },
  foldtable(w, f) { w.add('m', rbox(1.6, 0.8, 2.6, 0.06, 1), 0xfef3c7, 0, 0.4, -0.9); w.add('m', rbox(1.65, 0.05, 2.65, 0.02, 1), 0xa16207, 0, 0.82, -0.9);
    for (let i = 0; i < 6; i++) { const x = (i % 2 ? 0.4 : -0.4), z = -1.8 + Math.floor(i / 2) * 0.9, c = pick([0x1e3a8a, 0x2563eb, 0x60a5fa, 0xef4444, 0xffffff, 0x16a34a]), h = Math.round(f * 6); for (let q = 0; q < h; q++) w.add('g', rbox(0.6, 0.06, 0.55, 0.02, 1), q % 2 ? c : 0x1e3a8a, x, 0.87 + q * 0.065, z, 0, (R() - 0.5) * 0.1, 0); }
    [[-0.45, 1.3, 0xdb2777], [0.45, 1.6, 0x0ea5e9]].forEach(([x, z, c]) => { w.add('x', rcyl(0.25, 0.04, 0.02, 14), 0x94a3b8, x, 0.02, z); w.add('x', cyl(8), 0x94a3b8, x, 0.5, z, 0, 0, 0, 0.025, 1.0, 0.025); w.add('g', CAP, f > 0 ? c : 0xe5e7eb, x, 1.3, z, 0, 0, 0, 0.36, 0.42, 0.24); w.add('g', SPH, 0xe5e7eb, x, 1.82, z, 0, 0, 0, 0.12, 0.15, 0.12); if (f > 0) { w.add('g', CAP, 0x1e3a8a, x - 0.08, 0.8, z, 0, 0, 0, 0.12, 0.55, 0.12); w.add('g', CAP, 0x1e3a8a, x + 0.08, 0.8, z, 0, 0, 0, 0.12, 0.55, 0.12); } });
    topSign(w, 'DENIM + TEES', 0x1e3a8a, 2.2, 2.4); },
  homeshelf(w, f) { const L = 5; [-1, 1].forEach((s) => w.add('m', rbox(0.9, 0.06, L, 0.02, 1), 0x92400e, s * 0.45, 0.03, 0)); w.add('m', rbox(0.08, 2.1, L, 0.02, 1), 0xa16207, 0, 1.05, 0);
    for (let r = 0; r < 3; r++) { const y = 0.5 + r * 0.6; w.add('m', rbox(1.9, 0.05, L, 0.02, 1), 0xb45309, 0, y, 0); [-1, 1].forEach((s) => { for (let k = 0; k < 6; k++) { if (!fill(f)) continue; const z = -2.1 + k * 0.84, x = s * 0.55, t = (k + r + (s > 0 ? 1 : 0)) % 5;
        if (t === 0) { w.add('g', cyl(10), 0xd6d3d1, x, y + 0.15, z, 0, 0, 0, 0.06, 0.3, 0.06); w.add('l', cone(14), 0xfef3c7, x, y + 0.36, z, 0, 0, 0, 0.18, 0.2, 0.18, 0.15); }
        else if (t === 1) w.add('g', lathe([[0, 0], [0.12, 0], [0.18, 0.15], [0.08, 0.35], [0.1, 0.4], [0, 0.4]], 12, 'hvase'), pick([0x0ea5e9, 0xf97316, 0x16a34a, 0xffffff]), x, y + 0.03, z);
        else if (t === 2) { w.add('f', rbox(0.38, 0.32, 0.12, 0.08, 2), pick([0xfde68a, 0xfbcfe8, 0x93c5fd, 0xa7f3d0]), x, y + 0.2, z - 0.1, -0.2, 0, 0); w.add('f', rbox(0.38, 0.32, 0.12, 0.08, 2), pick([0xfde68a, 0xfbcfe8, 0x93c5fd]), x, y + 0.2, z + 0.12, -0.2, 0.3, 0); }
        else if (t === 3) { for (let q = 0; q < 3; q++) { w.add('g', CYL, 0xfef9c3, x, y + 0.08 + q * 0.0, z - 0.15 + q * 0.15, 0, 0, 0, 0.05, 0.12 + q * 0.04, 0.05); w.add('l', SPH, 0xfbbf24, x, y + 0.2 + q * 0.02, z - 0.15 + q * 0.15, 0, 0, 0, 0.015, 0.03, 0.015, 0.8); } }
        else { w.add('g', BOX, 0x111827, x, y + 0.2, z, 0, 0, 0.1, 0.03, 0.34, 0.28); w.add('g', BOX, pick([0x38bdf8, 0xfacc15, 0xf472b6]), x + s * 0.016, y + 0.2, z, 0, 0, 0.1, 0.005, 0.26, 0.2); } } }); }
    topSign(w, 'HOME DECOR', 0xa16207, 2.3); },
  sofa(w, f) { w.add('f', rbox(1.95, 0.02, 4.9, 0.01, 1), 0xd6d3d1, 0, 0.012, 0); const c = 0x0f766e;
    w.add('f', rbox(0.95, 0.42, 2.6, 0.12, 2), c, -0.42, 0.25, -0.9); w.add('f', rbox(0.3, 0.7, 2.6, 0.12, 2), c, -0.82, 0.55, -0.9); [-2.1, 0.3].forEach((z) => w.add('f', rbox(0.95, 0.55, 0.22, 0.1, 2), c, -0.42, 0.33, z));
    for (let i = 0; i < Math.round(f * 3); i++) w.add('f', rbox(0.14, 0.38, 0.38, 0.1, 2), pick([0xfde68a, 0xfbcfe8, 0xffffff]), -0.6, 0.62, -1.7 + i * 0.75, 0, 0, -0.25);
    w.add('m', rbox(0.6, 0.06, 1.0, 0.03, 1), 0x7c4a1e, 0.45, 0.42, -0.9); [-1, 1].forEach((a) => [-1, 1].forEach((b) => w.add('m', cyl(6), 0x7c4a1e, 0.45 + a * 0.24, 0.2, -0.9 + b * 0.42, 0, 0, 0, 0.025, 0.4, 0.025)));
    if (f > 0) { w.add('g', lathe([[0, 0], [0.08, 0], [0.12, 0.1], [0.05, 0.25], [0, 0.25]], 10, 'hv2'), 0x0ea5e9, 0.45, 0.45, -1.1); w.add('g', BOX, 0xfacc15, 0.45, 0.47, -0.7, 0, 0.3, 0, 0.2, 0.04, 0.28); }
    w.add('x', rcyl(0.2, 0.03, 0.01, 12), 0x334155, -0.7, 0.02, 1.0); w.add('x', cyl(8), 0x334155, -0.7, 0.8, 1.0, 0, 0, 0, 0.02, 1.6, 0.02); w.add('l', cone(14), 0xfef3c7, -0.7, 1.7, 1.0, 0, 0, 0, 0.26, 0.3, 0.26, 0.2);
    w.add('f', rbox(0.7, 0.45, 0.7, 0.15, 2), 0xf97316, 0.3, 0.3, 1.2); w.add('m', lathe([[0, 0], [0.2, 0], [0.24, 0.35], [0, 0.35]], 12, 'hpot'), 0xe7e5e4, 0.5, 0, 2.1); w.add('g', blobGeo(4, 0.3, 1), 0x16a34a, 0.5, 0.75, 2.1, 0, 0, 0, 0.35, 0.45, 0.35);
    w.add('g', BOX, 0xffffff, 0.1, 0.9, -2.35, 0, 0, 0, 0.5, 0.35, 0.02); txt(w, f > 0 ? '$899' : 'SOLD!', 0.1, 0.85, -2.33, 0, 0.12, f > 0 ? 0x16a34a : 0xdc2626);
    topSign(w, 'LIVING ROOM', 0xa16207, 2.3, 2.2); },
});
export const FIXSOLID = { floor: [[-1.0, -2.55, 1.0, 2.55, 2.2]], register: [[-1.02, -1.32, -0.08, 1.32, 1.0]], selfck: [[-1.27, -0.15, -0.53, 0.58, 1.0], [0.53, -0.15, 1.27, 0.58, 1.0]] };
// build every prototype once
export class Fixtures {
  constructor() { this.protos = {}; const sc = new THREE.Scene();
    const mk = (key, fn) => { seed = 7 + key.length * 13; const w = new World(); w.region = 'fx'; fn(w); w.finalize(sc); const parts = []; for (const m of w.group.children) { m.geometry.computeBoundingSphere(); parts.push({ g: m.geometry, mat: m.material, sh: m.castShadow }); } this.protos[key] = parts; };
    this.mk = mk; this.stores = {}; }
  // prototypes are modelled on first use, so a town full of shoe shops never pays for unused freezer models
  proto(key) { if (!this.protos[key]) { const t = key.slice(0, -1), v = +key.slice(-1); this.mk(key, (w) => t === 'register' || t === 'selfck' ? MODELS[t](w) : MODELS[t](w, [1, 0.45, 0][v])); } return this.protos[key]; }
  // one group per store with lazily created InstancedMeshes
  attach(scene, sid, slots) { const g = new THREE.Group(); g.name = 'fx_' + sid; scene.add(g); this.stores[sid] = { g, slots, im: {} }; return g; }
  sync(sid, layout, variantOf) { const S = this.stores[sid]; if (!S) return; const want = {};
    layout.forEach((f, i) => { if (!f) return; const v = (f === 'register' || f === 'selfck') ? 0 : variantOf(f); const key = f + v; (want[key] || (want[key] = [])).push(S.slots[i]); });
    for (const key in S.im) S.im[key].forEach((m) => { m.count = 0; m.visible = false; });
    const _m = new THREE.Matrix4();
    for (const key in want) { let arr = S.im[key]; if (!arr) { arr = S.im[key] = this.proto(key).map((p) => { const m = new THREE.InstancedMesh(p.g, p.mat, S.slots.length); m.castShadow = p.sh; m.receiveShadow = true; m.frustumCulled = false; S.g.add(m); return m; }); }
      arr.forEach((m) => { want[key].forEach((sl, i) => { _m.makeTranslation(sl.x, 0, sl.z); m.setMatrixAt(i, _m); }); m.count = want[key].length; m.visible = true; m.instanceMatrix.needsUpdate = true; }); } }
  show(sid, v) { const S = this.stores[sid]; if (S) S.g.visible = v; }
}
export { MODELS };
