// Harvest Hollow Open House: enterable interiors. Each room is built only when you walk in and fully disposed when you leave (keeps phone memory low).
import * as THREE from 'three';
import { Batch, G, solid, COL, sign, PI } from './kit.js';
import { MATS } from './mats.js';

const W = 14, D = 10, H = 4.6;
const DDEF = [ // [id, name, house x, z, ry, depth]
  ['barn', "Torty's Barn", -60, -14, PI / 2, 7], ['bakery', 'Hollow Bakery', -12, -22, 0, 6], ['pumpkin', 'Pumpkin Patch Shop', -22, -14, 0, 6], ['cranberry', 'Cranberry Co.', 22, -14, 0, 6],
  ['cider', 'Apple Cider Barn', 42, -13, 0, 6], ['hall', 'Town Hall', 12, -22, 0, 6], ['diner', 'Hollow Diner', 56, -13, 0, 6], ['workshop', 'Float Workshop', 76, 26, -PI / 2, 8],
  ['luna', "Luna's Home", -22, 14, PI, 6], ['pirat', "Pi-rat's Home", 22, 14, PI, 6]];
export const DOORS = DDEF.map(([id, name, hx, hz, ry, d]) => { const fx = Math.sin(ry), fz = Math.cos(ry), at = (k) => [hx + fx * k, hz + fz * k];
  const [dx, dz] = at(d / 2), [x, z] = at(d / 2 + 1.2), [ox2, oz2] = at(d / 2 + 1.6); return { id, name, dx, dz, ry, x, z, out: [ox2, oz2, ry] }; });
export const ACORNS = { barn: [[-5.6, -3.6], [5.4, 2.4]], bakery: [[5.8, -3.6]], pumpkin: [[-6.2, 3.8]], cranberry: [[-3.6, 3.8]], cider: [[5.6, 3.8]], hall: [[-6.0, -4.2]], diner: [[6.2, 3.9]], workshop: [[-6.2, 3.8]], luna: [[5.8, -4.2]], pirat: [[-6.2, 4.0]] }; // 11 inside, 9 outdoors (step 4)
const AUT = [0xf97316, 0xb91c1c, 0xfacc15, 0x92400e, 0x16a34a];
function DRESS_FN() { const R = (n) => [n, 0]; return {
  barn: (k, b, ox, oz, add, info) => { k.frame('L', 0.4, 2.4, 1.4, 1.0, 0xfde68a, 0xdc2626); k.frame('R', 0.2, 2.4, 1.2, 0.9, 0xbfe3ff, 0x16a34a); k.hay(-6.1, 0.3, 0xf97316); k.hay(-6.1, -0.6); k.crate2(6.2, -2.0, 0xdc2626); k.shock(6.2, 4.2); k.rug(0, -1.2, 3, 2, 0x92400e, 0x5b2a1a); k.bunting('B', 3.9, AUT); info.npcs.push(['grandpa', -3.6, -1.6, PI * 0.75, 'Grandpa Cheddar']); },
  bakery: (k, b, ox, oz, add, info) => { k.frame('L', 3.2, 2.2, 1.2, 0.9, 0xfef3c7, 0xd97706); k.frame('B', 5.6, 3.0, 1.2, 0.8, 0x111827, 0xfacc15); k.plant(-6.2, 4.3); k.plant(6.2, 4.3); k.rug(0, 3.4, 2.4, 1.4, 0xf97316, 0x7c2d12); k.bunting('B', 4.1, AUT); k.clock('R', 3.6, 2.6); info.npcs.push(['grandma', 2.5, 2.0, -PI / 2, 'Grandma Gouda']); },
  pumpkin: (k, b, ox, oz, add, info) => { k.shock(6.3, -4.3); k.shock(-4.9, 4.3); k.hay(6.1, 4.2, 0xf97316); k.hay(-6.2, 1.6, 0xfacc15); k.crate2(-6.2, 0.4, 0x16a34a); k.plant(-1.9, -4.3, 0.9); k.frame('L', -3.2, 2.4, 1.4, 0.9, 0xfef3c7, 0xf97316); k.frame('R', 2.6, 2.4, 1.4, 0.9, 0xfde68a, 0x16a34a); k.rug(0, 3.0, 2.6, 1.6, 0x92400e, 0xf97316); k.bunting('B', 4.0, AUT); k.bunting('L', 4.0, AUT); k.bunting('R', 4.0, AUT);
    for (let i = 0; i < 5; i++) b.sph('g', [0xf97316, 0xfacc15, 0xfef3c7][i % 3], ox - 6.3 + (i % 2) * 0.1, 0.22, oz - 2.4 - i * 0.45 + 0.0, 0.22, 0.18, 0.22); info.npcs.push(['mom', -3.4, 1.2, PI * 0.6, 'Mom Camembert']); },
  cranberry: (k, b, ox, oz, add, info) => { k.frame('R', -3.8, 2.4, 1.4, 0.9, 0xfacc15, 0x111827); k.frame('B', 4.6, 2.9, 1.4, 0.9, 0xfecaca, 0xb91c1c); k.plant(-6.2, 4.3); k.plant(6.2, 4.3); k.shelf('L', 2.6, 1.8, 2.0, [0xfacc15, 0xf97316, 0xfacc15]); k.rug(0, 3.2, 2.4, 1.4, 0xb91c1c, 0x7f1d1d); k.clock('B', 2.8, 3.0); info.npcs.push(['brother', 3.4, -2.2, -PI / 2, 'Bram the Inspector']); },
  cider: (k, b, ox, oz, add, info) => { k.frame('L', -3.4, 2.4, 1.3, 0.9, 0xfef3c7, 0xdc2626); k.frame('R', -2.8, 2.4, 1.3, 0.9, 0xbbf7d0, 0x16a34a); k.plant(-6.2, 4.3); k.crate2(-1.6, 4.2, 0xdc2626); k.rug(0, 0.2, 2.4, 1.6, 0x9a3412, 0x5b2a1a); k.bunting('B', 4.1, [0xdc2626, 0x16a34a, 0xfacc15]); for (let i = 0; i < 9; i++) b.sph('g', i % 2 ? 0xdc2626 : 0x65a30d, ox - 4 + i, 3.55 - Math.sin(i / 8 * PI) * 0.3, oz + 1.5, 0.12, 0.12, 0.12); info.npcs.push(['dad', 3.3, 3.6, PI, 'Dad Roquefort']); },
  hall: (k, b, ox, oz, add, info) => { k.frame('B', -5.3, 2.6, 1.0, 1.3, 0xbfdbfe, 0x8a7868); k.frame('B', 5.3, 2.6, 1.0, 1.3, 0xfde68a, 0x6b7280); k.frame('L', 3.4, 2.4, 1.4, 1.0, 0xfef3c7, 0x16a34a); k.frame('R', -3.6, 2.5, 1.2, 0.9, 0xfecaca, 0x1e3a8a);
    k.plant(-6.2, 4.3); k.plant(6.2, 4.3); k.plant(6.2, -4.2); k.shock(-4.6, -4.3); k.shock(4.6, -4.3); k.clock('B', -5.3, 3.75); k.bunting('L', 4.05, AUT); k.bunting('R', 4.05, AUT); k.rug(-3.8, 3.6, 2.0, 1.2, 0x1e3a8a, 0xfacc15); k.rug(3.8, 3.6, 2.0, 1.2, 0x1e3a8a, 0xfacc15);
    for (const sx of [-1, 1]) b.sph('g', 0xf97316, ox + sx * 3.1, 0.62, oz - 3.2, 0.28, 0.22, 0.28); k.hay(-6.2, 2.5, 0xfacc15); k.shelf('R', 3.6, 1.6, 1.6, [0xfacc15, 0xd1d5db, 0xb45309]);
    info.npcs.push(['mom', -2.1, -2.0, PI * 0.9, 'Mom Camembert'], ['dad', 2.1, -2.1, -PI * 0.9, 'Dad Roquefort'], ['grandma', -5.9, 1.3, PI * 0.7, 'Grandma Gouda']); },
  diner: (k, b, ox, oz, add, info) => { k.frame('B', 5.0, 2.6, 1.4, 1.0, 0x111827, 0xfacc15); k.frame('L', 3.0, 2.4, 1.2, 0.9, 0xfef3c7, 0xdc2626); k.clock('R', 2.2, 2.9); k.plant(6.2, -4.3); k.rug(0, 3.6, 2.4, 1.2, 0xdc2626, 0x111827); b.box('e', 0xff3b6b, ox + 5.0, 3.5, oz - 4.78, 1.0, 0.3, 0.03, 0, 1.2);
    for (const sx of [-1, 1]) { b.box('x', 0xd1d5db, ox + sx * 4.9 + 0.5, 0.82, oz + 2.3, 0.14, 0.18, 0.1); b.cyl('m', 0xdc2626, ox + sx * 4.9 + 0.7, 0.82, oz + 2.3, 0.05, 0.16); } info.npcs.push(['grandpa', -3.1, -1.3, PI, 'Grandpa Cheddar']); },
  workshop: (k, b, ox, oz, add, info) => { b.box('m', 0xd6b88a, ox - 6.82, 1.2, oz + 1.2, 0.05, 1.4, 2.4); for (let i = 0; i < 6; i++) b.box('x', [0x6b7280, 0xdc2626, 0x2563eb][i % 3], ox - 6.76, 1.5 + (i % 2) * 0.55, oz + 0.4 + (i >> 1) * 0.75, 0.05, 0.45, 0.1);
    k.frame('B', -4.4, 2.8, 1.4, 1.0, 0xfef3c7, 0xf97316); k.frame('R', 3.6, 2.6, 1.0, 1.2, 0xbfdbfe, 0x8a7868); k.crate2(6.2, 4.2, 0xfacc15); k.crate2(-1.6, 4.2); for (let i = 0; i < 3; i++) b.cyl('m', 0x111827, ox + 6.1, i * 0.25, oz - 1.6, 0.4, 0.22); k.blk(6.1, -1.6, 0.85, 0.85, 0.8);
    k.plant(6.2, 0.4, 0.9); k.bunting('B', 4.1, [0xf97316, 0x2563eb, 0xfacc15]); info.npcs.push(['brother', -3.8, 0.4, PI * 0.8, 'Bram the Painter']); },
  luna: (k, b, ox, oz, add, info) => { k.frame('B', -2.2, 3.3, 0.9, 0.7, 0xa9afbd, 0x6d28d9); k.frame('B', 2.2, 3.3, 0.9, 0.7, 0xe0e7ff, 0x8a7868); k.frame('L', 3.2, 2.4, 1.2, 0.9, 0xbbf7d0, 0x3730a3); k.plant(-6.2, -0.4); k.plant(6.2, 4.3); k.plant(-3.2, 4.3, 0.9); k.clock('R', -0.6, 2.8); k.shelf('R', 3.4, 2.4, 1.6, [0xfacc15, 0xdc2626, 0x2563eb]);
    for (let i = 0; i < 5; i++) b.sph('g', AUT[i], ox - 1.2 + i * 0.6, 2.62, oz - 4.3, 0.14, 0.12, 0.14); info.npcs.push(['grandma', 1.9, -1.8, -PI * 0.7, 'Grandma Gouda']); },
  pirat: (k, b, ox, oz, add, info) => { k.frame('B', 4.6, 2.6, 1.4, 1.0, 0x111827, 0xffffff); k.frame('L', 3.0, 2.4, 1.2, 0.9, 0xbfe3ff, 0xc08552); k.frame('R', 2.6, 2.6, 1.0, 0.8, 0xfce7f3, 0x8a7868); k.plant(6.2, 4.3); k.plant(-3.6, -4.3, 0.85); k.shelf('L', -0.6, 2.1, 1.6, [0x5ef2ff, 0xfacc15, 0xf472b6]);
    k.rug(-2.4, 2.8, 2.0, 1.4, 0xdb2777, 0xfde68a); k.clock('B', -0.2, 3.2); }
}; }
export function initRooms(ctx) {
  const { scene, P, cam, S, sfx, toast, talk, msg, makePet, animPet } = ctx;
  let cur = null; // { id, ox, oz, grp, boxes, lights, npcs, acorns, door }
  // glowing door frames outside
  for (const d of DOORS) { const b = new Batch(); b.box('l', 0xffd27a, 0, 2.2, 0.1, 1.6, 0.12, 0.12, 0, 0.6); for (const sx of [-0.8, 0.8]) b.box('l', 0xffd27a, sx, 0, 0.1, 0.12, 2.2, 0.12, 0, 0.6);
    const g = new THREE.Group(); b.finish(g, false); g.position.set(d.dx, 0, d.dz); g.rotation.y = d.ry; scene.add(g); }
  function shell(b, ox, oz, wall, floor, trim) {
    b.box('m', floor, ox, 0.0, oz, W, 0.04, D); b.box('m', wall, ox, 0, oz - D / 2, W, H, 0.3); b.box('m', wall, ox - W / 2, 0, oz, 0.3, H, D); b.box('m', wall, ox + W / 2, 0, oz, 0.3, H, D);
    b.box('m', wall, ox - 4.3, 0, oz + D / 2, W / 2 - 1.3, H, 0.3); b.box('m', wall, ox + 4.3, 0, oz + D / 2, W / 2 - 1.3, H, 0.3); b.box('m', wall, ox, 2.6, oz + D / 2, 2.6, H - 2.6, 0.3);
    b.box('m', trim, ox, 0.04, oz - D / 2 + 0.2, W, 0.25, 0.1); b.box('l', 0xffd27a, ox, 2.5, oz + D / 2 - 0.2, 2.6, 0.12, 0.1, 0, 0.6);
    b.box('m', 0x6b3f22, ox, 0, oz + D / 2, 2.6, 2.6, 0.2); b.box('m', 0x8a5a33, ox - 0.62, 0.2, oz + D / 2 - 0.12, 1.1, 2.2, 0.04); b.box('m', 0x8a5a33, ox + 0.62, 0.2, oz + D / 2 - 0.12, 1.1, 2.2, 0.04); b.sph('l', 0xfacc15, ox + 0.2, 1.1, oz + D / 2 - 0.16, 0.07, 0.07, 0.07, 0.8); }
  function walls(ox, oz) { const bx = [];
    bx.push(solid(ox - W / 2 - 0.3, oz - D / 2 - 0.3, ox + W / 2 + 0.3, oz - D / 2 + 0.15, 0, 6)); bx.push(solid(ox - W / 2 - 0.3, oz - D / 2, ox - W / 2 + 0.15, oz + D / 2 + 0.3, 0, 6));
    bx.push(solid(ox + W / 2 - 0.15, oz - D / 2, ox + W / 2 + 0.3, oz + D / 2 + 0.3, 0, 6)); bx.push(solid(ox - W / 2, oz + D / 2 - 0.15, ox - 1.3, oz + D / 2 + 0.3, 0, 6));
    bx.push(solid(ox + 1.3, oz + D / 2 - 0.15, ox + W / 2, oz + D / 2 + 0.3, 0, 6)); bx.push(solid(ox - 1.3, oz + D / 2 - 0.15, ox + 1.3, oz + D / 2 + 0.3, 0, 6)); bx.push(solid(ox - W / 2, oz - D / 2, ox + W / 2, oz + D / 2, H - 0.05, H + 0.4)); return bx; }
  const BUILD = {
    barn(b, ox, oz, bx, add, k) { shell(b, ox, oz, 0x9b2c2c, 0x8a6a45, 0x5b2a1a);
      for (let i = -6; i <= 6; i += 1.2) b.box('m', 0x7c5a3a, ox + i, 0.045, oz, 0.06, 0.01, D); // floor boards
      for (const sx of [-1, 1]) { const x = ox + sx * 4.8; b.box('m', 0x5b3a24, x, 0, oz - 2.5, 0.25, H, 0.25); b.box('m', 0x5b3a24, x, 0, oz + 1.5, 0.25, H, 0.25); }
      b.box('m', 0x5b3a24, ox, H - 0.4, oz - 2.5, W, 0.25, 0.25); b.box('m', 0x5b3a24, ox, H - 0.4, oz + 1.5, W, 0.25, 0.25);
      // hay bale wall (left back) + loft
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4 - r; c++) { b.rbox('m', 0xe3c062, ox - 6.1 + c * 1.6 + r * 0.8, r * 0.85, oz - 4.3, 1.55, 0.85, 0.9); }
      bx.push(solid(ox - 7, oz - 5, ox - 0.4, oz - 3.7, 0, 3));
      b.box('m', 0x7c5a3a, ox - 4.5, 2.6, oz - 3.5, 5, 0.15, 3); // hayloft
      // tool wall (right back) = shop counter
      b.box('m', 0x8a5a33, ox + 4, 0, oz - 4.2, 4, 1.0, 1.0); b.box('m', 0xd9b38c, ox + 4, 1.0, oz - 4.2, 4.1, 0.06, 1.1); bx.push(solid(ox + 1.9, oz - 5, ox + 6.1, oz - 3.6, 0, 2));
      for (let i = 0; i < 5; i++) { b.cyl('m', 0x6b4a2e, ox + 2.4 + i * 0.8, 1.4, oz - 4.85, 0.04, 1.8); b.box('x', i === 2 ? 0xfacc15 : 0x9ca3af, ox + 2.4 + i * 0.8, 3.1, oz - 4.85, 0.5, 0.12, 0.08); }
      // stalls with feed troughs (left/right front)
      for (const sx of [-1, 1]) { b.box('m', 0x6b4a2e, ox + sx * 5.6, 0, oz + 2.8, 2.4, 1.1, 0.15); b.box('m', 0x6b4a2e, ox + sx * 4.4, 0, oz + 3.6, 0.15, 1.1, 1.8); b.box('m', 0x5b3a24, ox + sx * 5.8, 0, oz + 4.2, 1.6, 0.4, 0.6);
        bx.push(solid(ox + sx * 5.6 - 1.25, oz + 2.7, ox + sx * 5.6 + 1.25, oz + 2.95, 0, 1.2)); }
      // lanterns, barrels, sacks, pumpkins
      for (const [x, z] of [[-1.6, -4.4], [1.2, 3.8], [-2.8, 3.9]]) { b.cyl('m', 0x7c4a1e, ox + x, 0, oz + z, 0.42, 1.0); bx.push(solid(ox + x - 0.45, oz + z - 0.45, ox + x + 0.45, oz + z + 0.45, 0, 1)); }
      for (const [x, z] of [[0.2, -4.3], [0.9, -4.4]]) b.sph('m', 0xd6c7a1, ox + x, 0.35, oz + z, 0.35, 0.4, 0.3);
      for (const [x, z, s] of [[-0.8, 3.6, 0.4], [2.6, 3.3, 0.3], [6.2, -1.6, 0.45], [-6.3, 0.4, 0.35]]) { b.sph('g', 0xf07b1f, ox + x, s * 0.8, oz + z, s * 1.1, s * 0.8, s * 1.1); }
      for (const x of [-3, 0, 3]) b.sph('l', 0xffd59a, ox + x, H - 0.9, oz - 0.5, 0.18, 0.22, 0.18, 1);
      add(sign("TORTY'S TOOLS", 2.6, 0.5, { bg: '#7c2d12', border: '#fbbf24' }), ox + 4, 2.3, oz - 4.75);
      add(sign('FEED BIN', 1.6, 0.4, { bg: '#14532d', border: '#fbbf24' }), ox - 5.8, 1.5, oz + 4.6, PI);
      return { npcs: [['brownie', 3.8, -3.1, 0, 'Farmhand Brownie'], ['luna', -3.2, 1.2, PI / 4, 'Luna']], light: 0xffd59a };
    },
    bakery(b, ox, oz, bx, add, k) { shell(b, ox, oz, 0xf5e1c4, 0xc08552, 0xb45309);
      for (let i = -6.5; i <= 6.5; i += 1) for (let j = -4.5; j <= 4.5; j += 1) if (((i + j + 11) | 0) % 2) b.box('m', 0xf1e4c8, ox + i, 0.045, oz + j, 1, 0.012, 1); // checker floor
      // brick oven (back center) + bake station
      b.box('m', 0xa1462a, ox, 0, oz - 4.3, 3.2, 2.6, 1.2); b.sph('m', 0xa1462a, ox, 2.6, oz - 4.3, 1.6, 0.8, 0.6); b.box('e', 0xff7a1a, ox, 0.6, oz - 3.68, 1.4, 0.9, 0.02, 0, 0.6);
      b.cyl('m', 0x5b3a24, ox + 0.9, 3.0, oz - 4.6, 0.2, 0.6); bx.push(solid(ox - 1.7, oz - 5, ox + 1.7, oz - 3.6, 0, 3));
      b.box('m', 0xe5e7eb, ox, 0, oz - 2.2, 3.4, 0.95, 1.0); b.box('m', 0xd6d3d1, ox, 0.95, oz - 2.2, 3.5, 0.06, 1.1); bx.push(solid(ox - 1.75, oz - 2.75, ox + 1.75, oz - 1.65, 0, 1.2));
      b.cyl('m', 0xc08552, ox - 0.9, 1.0, oz - 2.2, 0.35, 0.08); b.cyl('m', 0x9ca3af, ox + 0.9, 1.0, oz - 2.2, 0.3, 0.25); b.cyl('m', 0xd6c7a1, ox, 1.0, oz - 2.1, 0.06, 0.6, PI / 2);
      // display counter (right) with pies + glass
      b.box('m', 0x8a5a33, ox + 4.4, 0, oz - 0.5, 1.2, 1.0, 5); b.box('w', 0xbfe6ff, ox + 4.4, 1.0, oz - 0.5, 1.2, 0.6, 5); bx.push(solid(ox + 3.7, oz - 3.1, ox + 5.1, oz + 2.1, 0, 2));
      for (let k = 0; k < 5; k++) { const col = [0xe8a33d, 0xb8432a, 0x9c6b45, 0xe8a33d, 0x7c2d12][k]; b.cyl('m', 0xd9b38c, ox + 4.4, 1.05, oz - 2.6 + k * 1.05, 0.38, 0.12); b.cyl('g', col, ox + 4.4, 1.13, oz - 2.6 + k * 1.05, 0.32, 0.06); }
      // shelves (left wall) with bread + flour sacks
      for (let r = 0; r < 3; r++) { b.box('m', 0x7c4a1e, ox - 6.5, 0.6 + r * 0.9, oz - 1.2, 0.7, 0.06, 4.5); for (let k = 0; k < 5; k++) b.sph('g', [0xd4a04f, 0xc08552, 0xe3c062][(k + r) % 3], ox - 6.5, 0.8 + r * 0.9, oz - 3 + k * 0.9, 0.28, 0.16, 0.2); }
      bx.push(solid(ox - 7, oz - 3.6, ox - 6.1, oz + 1.2, 0, 3));
      for (const [x, z] of [[-5.9, 2.8], [-5.2, 3.6]]) { b.sph('m', 0xf4f4f5, ox + x, 0.4, oz + z, 0.4, 0.45, 0.35); }
      // cafe tables
      for (const [x, z] of [[-2.6, 2.2], [1.2, 2.6]]) { b.cyl('x', 0x2f3437, ox + x, 0, oz + z, 0.06, 0.75); b.cyl('m', 0xfff7ed, ox + x, 0.75, oz + z, 0.6, 0.05); b.cyl('g', 0xe8a33d, ox + x, 0.8, oz + z, 0.2, 0.05);
        for (const s of [-1, 1]) b.cyl('m', 0xb45309, ox + x + s * 0.85, 0, oz + z, 0.25, 0.45); bx.push(solid(ox + x - 0.6, oz + z - 0.6, ox + x + 0.6, oz + z + 0.6, 0, 1)); }
      // bunting + ribbon board
      for (let i = 0; i < 12; i++) b.box('f', [0xf97316, 0xfacc15, 0xb91c1c][i % 3], ox - 5.5 + i, H - 0.7, oz - 4.8, 0.4, 0.35, 0.03);
      b.box('m', 0x7c2d12, ox - 3.6, 1.4, oz - 4.82, 2.2, 1.4, 0.05);
      for (let i = 0; i < 6; i++) { b.cyl('m', 0x3f1d0b, ox - 4.4 + (i % 3) * 0.8, 2.4 - Math.floor(i / 3) * 0.6, oz - 4.78, 0.2, 0.03, PI / 2); b.cyl('m', 0xd6c7a1, ox - 4.4 + (i % 3) * 0.8, 2.4 - Math.floor(i / 3) * 0.6, oz - 4.77, 0.15, 0.03, PI / 2); }
      for (let i = 0; i < Math.min(6, S.ribbons || 0); i++) b.sph('l', [0x2563eb, 0xfacc15, 0xdc2626][i % 3], ox - 4.4 + (i % 3) * 0.8, 2.4 - Math.floor(i / 3) * 0.6, oz - 4.75, 0.17, 0.17, 0.05, 0.4);
      for (const x of [-3, 0, 3]) b.sph('l', 0xfff1d6, ox + x, H - 0.9, oz, 0.2, 0.2, 0.2, 1);
      add(sign('HOLLOW BAKERY', 3, 0.6, { bg: '#b45309', border: '#fde68a' }), ox, 4.0, oz - 4.6);
      add(sign('RIBBONS', 1.6, 0.35, { bg: '#7c2d12', border: '#fbbf24' }), ox - 3.6, 3.0, oz - 4.78);
      add(sign('PIE SHOP', 1.6, 0.4, { bg: '#b45309', border: '#fde68a' }), ox + 3.75, 1.9, oz - 0.5, -PI / 2);
      return { npcs: [['cream', 0.2, -3.0, 0, 'Baker Cream'], ['snowie', -2.6, 3.2, PI, 'Snowie']], light: 0xfff1d6 };
    },
    pumpkin(b, ox, oz, bx, add, k) { shell(b, ox, oz, 0xf4c27a, 0x8a6a45, 0x9a3412);
      for (let i = -6; i <= 6; i += 1.2) b.box('m', 0x7c5a3a, ox + i, 0.045, oz, 0.06, 0.01, D);
      // pumpkin pyramids + crates
      for (const [x, z] of [[-5.2, -3.6], [-5.6, 1.6], [5.4, 2.6]]) { for (let r = 0; r < 3; r++) for (let c = 0; c < 3 - r; c++) b.sph('g', [0xf07b1f, 0xe8a33d, 0xd9480f][(r + c) % 3], ox + x - 0.55 * (2 - r) / 2 + c * 0.55, 0.3 + r * 0.45, oz + z, 0.3, 0.26, 0.3); bx.push(k.blk(x, z, 1.8, 0.9, 1.4)); }
      for (const [x, z] of [[-6.2, -1.2], [6.1, -1.0], [6.1, 0.2]]) { k.crate(b, ox + x, oz + z); bx.push(k.blk(x, z, 0.9, 0.9, 0.8)); b.sph('g', 0xf07b1f, ox + x, 1.0, oz + z, 0.3, 0.25, 0.3); }
      // carving table (center back) + counter (right back)
      k.table(b, ox - 1.2, oz - 3.4, 2.6, 1.2, 0x6b4a2e); b.sph('g', 0xf07b1f, ox - 1.2, 1.25, oz - 3.4, 0.45, 0.38, 0.45); b.box('x', 0xd1d5db, ox - 0.3, 0.92, oz - 3.2, 0.5, 0.02, 0.08); bx.push(k.blk(-1.2, -3.4, 2.7, 1.3, 1.2));
      b.box('m', 0x8a5a33, ox + 3.6, 0, oz - 4.1, 3.6, 1.0, 1.0); b.box('m', 0xd9b38c, ox + 3.6, 1.0, oz - 4.1, 3.7, 0.06, 1.1); bx.push(k.blk(3.6, -4.1, 3.7, 1.2, 1.2));
      for (let i = 0; i < 4; i++) { b.box('m', 0xd6c7a1, ox + 2.2 + i * 0.9, 1.06, oz - 4.1, 0.5, 0.25, 0.4); }
      // jack-o-lantern shelf
      b.box('m', 0x7c4a1e, ox - 1.2, 2.2, oz - 4.75, 4.4, 0.08, 0.5); for (let i = 0; i < 5; i++) { b.sph('g', 0xf07b1f, ox - 3 + i * 0.9, 2.5, oz - 4.7, 0.28, 0.24, 0.26); b.box('e', 0xffd166, ox - 3 + i * 0.9, 2.45, oz - 4.44, 0.24, 0.1, 0.02, 0, 1.2); }
      k.lamps(b, ox, oz, 0xffc078); k.window(b, ox - 6.85, oz + 2.6, 'L');
      add(sign('PUMPKIN PATCH SHOP', 3.4, 0.6, { bg: '#9a3412', border: '#fde68a' }), ox, 3.7, oz - 4.8);
      add(sign('SELL CROPS', 1.8, 0.4, { bg: '#14532d', border: '#fbbf24' }), ox + 3.6, 1.7, oz - 4.75);
      add(sign('CARVING', 1.6, 0.4, { bg: '#7c2d12', border: '#fbbf24' }), ox - 1.2, 1.7, oz - 4.75);
      return { npcs: [['rose', 3.6, -3.2, 0, 'Shopkeeper Rose']], light: 0xffc078 };
    },
    cranberry(b, ox, oz, bx, add, k) { shell(b, ox, oz, 0xfbe4e4, 0x9ca3af, 0x7f1d1d);
      // sorting belt across the back
      b.box('x', 0x374151, ox - 1, 0, oz - 3.3, 9, 0.9, 1.1); b.box('m', 0x1f2937, ox - 1, 0.9, oz - 3.3, 9, 0.06, 0.9); for (let i = 0; i < 18; i++) b.sph('g', i % 5 === 2 ? 0x6b4a2e : 0xb91c1c, ox - 5.2 + i * 0.48, 1.02, oz - 3.3 + ((i * 7) % 3 - 1) * 0.2, 0.1, 0.1, 0.1);
      for (let i = 0; i < 6; i++) b.cyl('x', 0x9ca3af, ox - 5 + i * 1.6, 0.9, oz - 3.3, 0.08, 1.0, PI / 2);
      bx.push(k.blk(-1, -3.3, 9.2, 1.3, 1.2));
      // vats + crates
      for (const [x, z] of [[-5.6, 0.4], [-5.6, 2.6]]) { b.cyl('x', 0x9ca3af, ox + x, 0, oz + z, 0.8, 1.4); b.cyl('g', 0xb91c1c, ox + x, 1.38, oz + z, 0.72, 0.05); bx.push(k.blk(x, z, 1.7, 1.7, 1.5)); }
      for (const [x, z] of [[5.8, -4.0], [5.8, -2.9], [5.8, 2.8], [4.8, 2.8], [5.3, 2.8]]) { k.crate(b, ox + x, oz + z); b.sph('g', 0xb91c1c, ox + x, 0.85, oz + z, 0.3, 0.12, 0.3); }
      bx.push(k.blk(5.8, -3.45, 0.9, 2, 0.9)); bx.push(k.blk(5.3, 2.8, 2, 0.9, 0.9));
      // bog pool (decor floor)
      b.box('w', 0x7dd3fc, ox + 2.6, 0.05, oz + 1.2, 3, 0.02, 2.2); for (let i = 0; i < 20; i++) b.sph('g', 0xdc2626, ox + 1.3 + (i * 37 % 26) / 10, 0.09, oz + 0.3 + (i * 53 % 18) / 10, 0.09, 0.06, 0.09);
      b.box('m', 0x6b4a2e, ox + 2.6, 0, oz + 1.2, 3.2, 0.12, 2.4); bx.push(k.blk(2.6, 1.2, 3.2, 2.4, 0.3));
      k.lamps(b, ox, oz, 0xffe4e6); k.window(b, ox + 6.85, oz + 0.6, 'R');
      add(sign('CRANBERRY CO.', 2.8, 0.6, { bg: '#7f1d1d', border: '#fde68a' }), ox, 3.7, oz - 4.8);
      add(sign('SORTING BELT', 2, 0.4, { bg: '#1f2937', border: '#fca5a5' }), ox - 1, 2.0, oz - 4.75);
      return { npcs: [['blue', 4.2, -2.0, -PI / 2, 'Foreman Blue']], light: 0xffe4e6 };
    },
    cider(b, ox, oz, bx, add, k) { shell(b, ox, oz, 0x9a3412, 0x8a6a45, 0x3f1d0b);
      for (let i = -6; i <= 6; i += 1.2) b.box('m', 0x7c5a3a, ox + i, 0.045, oz, 0.06, 0.01, D);
      // cider press (left back) + barrels on racks (right)
      b.box('m', 0x6b4a2e, ox - 4.5, 0, oz - 3.8, 2.4, 1.0, 1.6); b.cyl('m', 0x8a5a33, ox - 4.5, 1.0, oz - 3.8, 0.7, 1.0); b.cyl('x', 0x6b7280, ox - 4.5, 2.0, oz - 3.8, 0.08, 1.2); b.box('x', 0x6b7280, ox - 4.5, 3.1, oz - 3.8, 1.6, 0.12, 0.12);
      bx.push(k.blk(-4.5, -3.8, 2.5, 1.7, 2));
      for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { b.cyl('m', 0x7c4a1e, ox + 6.1, 0.5 + r * 1.0, oz - 3.6 + i * 1.05, 0.45, 0.9, 0, PI / 2); b.cyl('x', 0x374151, ox + 5.6, 0.5 + r * 1.0, oz - 3.6 + i * 1.05, 0.12, 0.08, 0, PI / 2); }
      bx.push(k.blk(6.1, -2.0, 1.0, 4.2, 2));
      // bobbing tub (center) with apples
      b.cyl('m', 0x7c4a1e, ox - 0.4, 0, oz - 1.2, 1.0, 0.8); b.cyl('w', 0x60a5fa, ox - 0.4, 0.75, oz - 1.2, 0.9, 0.04); for (let i = 0; i < 6; i++) b.sph('g', i % 2 ? 0xdc2626 : 0x84cc16, ox - 0.4 + Math.cos(i) * 0.55, 0.82, oz - 1.2 + Math.sin(i) * 0.55, 0.15, 0.15, 0.15);
      bx.push(k.blk(-0.4, -1.2, 2.1, 2.1, 0.8));
      // apple bins + bar counter
      for (const [x, z] of [[-6.0, 0.8], [-6.0, 2.2], [-6.0, 3.6]]) { k.crate(b, ox + x, oz + z); for (let i = 0; i < 4; i++) b.sph('g', [0xdc2626, 0x84cc16, 0xb91c1c][i % 3], ox + x - 0.2 + (i % 2) * 0.4, 0.85, oz + z - 0.2 + (i >> 1) * 0.4, 0.17, 0.17, 0.17); }
      bx.push(k.blk(-6, 2.2, 1, 3.8, 0.9));
      b.box('m', 0x5b3a24, ox + 2.6, 0, oz + 2.4, 3.4, 1.0, 0.8); b.box('m', 0xd9b38c, ox + 2.6, 1.0, oz + 2.4, 3.5, 0.06, 0.9); for (let i = 0; i < 4; i++) b.cyl('w', 0xf59e0b, ox + 1.4 + i * 0.8, 1.06, oz + 2.4, 0.12, 0.3); bx.push(k.blk(2.6, 2.4, 3.5, 0.9, 1.2));
      k.lamps(b, ox, oz, 0xffd59a);
      add(sign('APPLE CIDER BARN', 3.2, 0.6, { bg: '#3f1d0b', border: '#fbbf24' }), ox, 3.7, oz - 4.8);
      add(sign('APPLE BOBBING', 2.2, 0.4, { bg: '#1e3a8a', border: '#fde68a' }), ox - 0.4, 2.3, oz - 4.75);
      const pg = k.page('cider', -3.2, -3.9); if (pg) add(pg, ox - 3.2, 0, oz - 3.0);
      return { npcs: [['brie', 2.6, 1.5, PI, 'Cider Brie']], light: 0xffd59a };
    },
    hall(b, ox, oz, bx, add, k) { shell(b, ox, oz, 0xe7e5e4, 0x7c2d12, 0x1e3a8a);
      b.box('m', 0x991b1b, ox, 0.05, oz + 0.5, 2, 0.02, 8); // red carpet
      // stage + podium + flags
      b.box('m', 0x6b4a2e, ox, 0, oz - 3.9, 7, 0.4, 2); bx.push(k.blk(0, -3.9, 7, 2, 0.45)); b.box('m', 0x8a5a33, ox, 0.4, oz - 3.4, 1.0, 1.1, 0.6); bx.push(k.blk(0, -3.4, 1.1, 0.7, 1.6));
      for (const sx of [-1, 1]) { b.cyl('x', 0xd4d4d8, ox + sx * 3, 0.4, oz - 4.5, 0.04, 2.6); b.box('f', sx < 0 ? 0xf97316 : 0x1e3a8a, ox + sx * 3 + 0.4, 2.2, oz - 4.5, 0.8, 0.6, 0.02); }
      // quest board (left wall) + medal case (right wall)
      b.box('m', 0x7c4a1e, ox - 6.75, 0.8, oz - 0.5, 0.15, 1.8, 3.2); for (let i = 0; i < 6; i++) b.box('m', [0xfef3c7, 0xfde68a, 0xffffff][i % 3], ox - 6.66, 1.0 + (i >> 1) * 0.55, oz - 1.6 + (i % 2) * 1.6 + 0.3, 0.02, 0.4, 0.55);
      b.box('m', 0x5b3a24, ox + 6.4, 0, oz - 0.5, 0.8, 1.0, 3); b.box('w', 0xbfe6ff, ox + 6.4, 1.0, oz - 0.5, 0.8, 0.7, 3); bx.push(k.blk(6.4, -0.5, 0.9, 3.1, 1.8));
      const md = S.medals || []; for (let i = 0; i < 6; i++) b.sph(i < md.length ? 'l' : 'm', i < md.length ? 0xfacc15 : 0x6b7280, ox + 6.4, 1.2, oz - 1.6 + i * 0.45, 0.14, 0.14, 0.05, i < md.length ? 0.6 : 0);
      // benches
      for (const z of [0.4, 2.2]) for (const sx of [-1, 1]) { b.box('m', 0x8a5a33, ox + sx * 3.2, 0.4, oz + z, 3.4, 0.12, 0.7); b.box('m', 0x6b4a2e, ox + sx * 3.2, 0.5, oz + z + 0.35, 3.4, 0.6, 0.1); bx.push(k.blk(sx * 3.2, z, 3.4, 0.8, 1)); }
      // passport stamp wall above board
      for (let i = 0; i < 10; i++) b.cyl(i < (S.stamps || []).length ? 'l' : 'm', i < (S.stamps || []).length ? 0xf97316 : 0xd6d3d1, ox - 6.7, 3.1 + (i >= 5 ? -0.45 : 0), oz - 2.2 + (i % 5) * 0.8, 0.17, 0.04, 0, PI / 2, i < (S.stamps || []).length ? 0.4 : 0);
      k.lamps(b, ox, oz, 0xfff7e0); k.window(b, ox + 6.85, oz + 3, 'R');
      add(sign('TOWN HALL', 2.4, 0.6, { bg: '#1e3a8a', border: '#fde68a' }), ox, 3.7, oz - 4.8);
      add(sign('QUEST BOARD', 1.8, 0.4, { bg: '#7c2d12', border: '#fbbf24' }), ox - 6.65, 2.1, oz - 0.5, PI / 2);
      add(sign('MEDALS', 1.3, 0.35, { bg: '#1e3a8a', border: '#fbbf24' }), ox + 6.7, 2.3, oz - 0.5, -PI / 2);
      const pg = k.page('hall'); if (pg) add(pg, ox + 4.6, 0, oz + 3.6);
      return { npcs: [['gold', 0, -3.0, 0, 'Mayor Gold'], ['candy', -4.2, 3.4, PI * 0.8, 'Candy']], light: 0xfff7e0 };
    },
    diner(b, ox, oz, bx, add, k) { shell(b, ox, oz, 0xfef3c7, 0xf8fafc, 0xdc2626);
      for (let i = -6.5; i <= 6.5; i += 1) for (let j = -4.5; j <= 4.5; j += 1) if (((i + j + 11) | 0) % 2) b.box('m', 0x111827, ox + i, 0.045, oz + j, 1, 0.012, 1);
      // counter + stools (back), kitchen pass with order bell
      b.box('m', 0xdc2626, ox - 1, 0, oz - 2.8, 8, 1.0, 0.8); b.box('m', 0xe5e7eb, ox - 1, 1.0, oz - 2.8, 8.1, 0.07, 0.9); bx.push(k.blk(-1, -2.8, 8.1, 0.9, 1.2));
      for (let i = 0; i < 6; i++) { b.cyl('x', 0x9ca3af, ox - 4.4 + i * 1.3, 0, oz - 1.9, 0.05, 0.6); b.cyl('m', 0xdc2626, ox - 4.4 + i * 1.3, 0.6, oz - 1.9, 0.28, 0.12); }
      b.box('x', 0x9ca3af, ox - 1, 0, oz - 4.6, 8, 1.6, 0.6); b.box('e', 0xff7a1a, ox - 3, 0.3, oz - 4.29, 1.2, 0.6, 0.02, 0, 0.5); b.sph('l', 0xfacc15, ox + 0.5, 1.1, oz - 2.8, 0.12, 0.08, 0.12, 0.6); bx.push(k.blk(-1, -4.6, 8, 0.7, 1.7));
      for (let i = 0; i < 4; i++) b.sph('g', [0xe8a33d, 0xf1e4c8, 0xd4a04f, 0xb91c1c][i], ox - 3.5 + i * 1.6, 1.12, oz - 2.8, 0.24, 0.1, 0.24);
      // booths (front corners)
      for (const sx of [-1, 1]) { const x = sx * 4.9; b.box('m', 0xb91c1c, ox + x, 0, oz + 1.0, 2.6, 1.1, 0.5); b.box('m', 0xb91c1c, ox + x, 0, oz + 3.6, 2.6, 1.1, 0.5); b.box('m', 0xfff7ed, ox + x, 0.75, oz + 2.3, 2.0, 0.07, 1.2); b.cyl('x', 0x6b7280, ox + x, 0, oz + 2.3, 0.07, 0.75);
        b.cyl('g', 0xe8a33d, ox + x - 0.4, 0.82, oz + 2.3, 0.2, 0.04); bx.push(k.blk(x, 2.3, 2.6, 3.2, 1.2)); }
      // jukebox
      b.rbox('m', 0x7c3aed, ox + 6.2, 0, oz - 1.0, 0.9, 1.8, 0.7); b.box('e', 0x5ef2ff, ox + 5.74, 0.9, oz - 1.0, 0.02, 0.6, 0.5, 0, 0.8); bx.push(k.blk(6.2, -1, 1, 0.8, 1.9));
      k.lamps(b, ox, oz, 0xfff1d6); k.window(b, ox - 6.85, oz - 0.5, 'L');
      add(sign('HOLLOW DINER', 2.8, 0.6, { bg: '#dc2626', border: '#fde68a' }), ox - 1, 3.6, oz - 4.8);
      add(sign('ORDERS UP!', 1.6, 0.4, { bg: '#111827', border: '#facc15' }), ox - 1, 2.0, oz - 4.25);
      const pg = k.page('diner'); if (pg) add(pg, ox + 4.9, 0.8, oz + 2.3);
      return { npcs: [['ash', -5.9, -2.2, PI / 4, 'Cook Ash'], ['snowie', 4.4, 2.3, -PI / 2, 'Snowie']], light: 0xfff1d6 };
    },
    workshop(b, ox, oz, bx, add, k) { shell(b, ox, oz, 0xe5e7eb, 0x6b7280, 0x0f766e);
      // float on stand (center), paint cans, balloon pump, workbench
      b.box('m', 0x374151, ox - 0.5, 0, oz - 1.6, 5, 0.5, 2.6); b.box('m', 0xf97316, ox - 0.5, 0.5, oz - 1.6, 4.6, 0.6, 2.2); for (const sx of [-2, 2]) b.cyl('x', 0x111827, ox - 0.5 + sx * 0.95, 0.35, oz - 0.3, 0.35, 0.2, PI / 2);
      b.sph('m', 0xf8fafc, ox - 0.5, 2.0, oz - 1.6, 0.9, 0.8, 0.8); b.sph('m', 0x8a7868, ox - 0.5, 2.55, oz - 1.6, 0.55, 0.3, 0.5); b.sph('m', 0xf9a8d4, ox - 1.1, 2.6, oz - 1.6, 0.25, 0.3, 0.08); b.sph('m', 0xf9a8d4, ox + 0.1, 2.6, oz - 1.6, 0.25, 0.3, 0.08);
      bx.push(k.blk(-0.5, -1.6, 5, 2.7, 3));
      b.box('m', 0x8a5a33, ox + 4.6, 0, oz - 4.1, 3.6, 1.0, 1.0); b.box('m', 0xd9b38c, ox + 4.6, 1.0, oz - 4.1, 3.7, 0.06, 1.1); bx.push(k.blk(4.6, -4.1, 3.7, 1.2, 1.2));
      for (let i = 0; i < 6; i++) b.box('x', 0x6b7280, ox + 3.1 + i * 0.6, 1.8, oz - 4.85, 0.12, 0.6, 0.05);
      for (let i = 0; i < 5; i++) { b.cyl('m', [0xf97316, 0x2563eb, 0xfacc15, 0x16a34a, 0xdb2777][i], ox - 6.1, 0, oz - 3.8 + i * 0.6, 0.22, 0.45); } bx.push(k.blk(-6.1, -2.6, 0.6, 3.2, 0.5));
      b.cyl('x', 0x2563eb, ox + 4.0, 0, oz + 2.4, 0.35, 1.0); b.cyl('x', 0x111827, ox + 4.0, 1.0, oz + 2.4, 0.05, 0.6); b.box('x', 0x111827, ox + 4.0, 1.6, oz + 2.4, 0.6, 0.06, 0.06); bx.push(k.blk(4, 2.4, 0.8, 0.8, 1.6));
      for (let i = 0; i < 5; i++) b.sph('m', [0xf97316, 0x2563eb, 0xfacc15, 0x16a34a, 0xdb2777][i], ox - 4 + i * 1.6, 3.6, oz + 3.4, 0.35, 0.42, 0.35);
      k.lamps(b, ox, oz, 0xffffff); k.window(b, ox + 6.85, oz + 0.5, 'R');
      add(sign('FLOAT WORKSHOP', 3, 0.6, { bg: '#0f766e', border: '#fde68a' }), ox, 3.7, oz - 4.8);
      add(sign('BALLOON PUMP', 1.8, 0.4, { bg: '#1e3a8a', border: '#fde68a' }), ox + 4.0, 2.2, oz + 2.4, PI);
      return { npcs: [['black', 4.6, -3.2, 0, 'Mechanic Black']], light: 0xffffff };
    },
    luna(b, ox, oz, bx, add, k) { shell(b, ox, oz, 0xc7d2fe, 0x8a6a45, 0x3730a3);
      for (let i = -6; i <= 6; i += 1.2) b.box('m', 0x7c5a3a, ox + i, 0.045, oz, 0.06, 0.01, D);
      b.cyl('m', 0x6d28d9, ox, 0.05, oz + 0.8, 2.6, 0.03); // round rug
      // fireplace (back center) + bookshelves
      b.box('m', 0x9ca3af, ox, 0, oz - 4.4, 3, 2.4, 0.9); b.box('e', 0xff7a1a, ox, 0.2, oz - 3.94, 1.4, 0.9, 0.02, 0, 0.8); b.box('m', 0x6b4a2e, ox, 2.4, oz - 4.3, 3.4, 0.15, 1.1); bx.push(k.blk(0, -4.4, 3.2, 1, 2.6));
      for (const sx of [-1, 1]) { const x = sx * 3.8; b.box('m', 0x5b3a24, ox + x, 0, oz - 4.6, 2.4, 3.4, 0.6); for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) b.box('m', [0xdc2626, 0x2563eb, 0x16a34a, 0xfacc15, 0x7c3aed][(i + r + sx + 2) % 5], ox + x - 1 + i * 0.38, 0.25 + r * 0.8, oz - 4.3, 0.28, 0.55, 0.05);
        bx.push(k.blk(x, -4.6, 2.5, 0.7, 3.5)); }
      // armchair, side table w/ glasses + tea, bed (left), desk (right)
      b.rbox('m', 0x7c3aed, ox - 1.8, 0, oz - 1.4, 1.2, 0.5, 1.1); b.rbox('m', 0x7c3aed, ox - 1.8, 0.5, oz - 1.9, 1.2, 0.9, 0.25); bx.push(k.blk(-1.8, -1.5, 1.3, 1.2, 1.2));
      k.table(b, ox - 0.6, oz - 1.2, 0.7, 0.7, 0x8a5a33); b.cyl('m', 0xf8fafc, ox - 0.6, 0.9, oz - 1.2, 0.1, 0.15); bx.push(k.blk(-0.6, -1.2, 0.7, 0.7, 1));
      b.box('m', 0x6b4a2e, ox - 5.6, 0, oz + 2.2, 2, 0.6, 3); b.box('m', 0xe0e7ff, ox - 5.6, 0.6, oz + 2.2, 1.9, 0.2, 2.9); b.box('m', 0x6366f1, ox - 5.6, 0.8, oz + 2.7, 1.9, 0.06, 1.9); b.rbox('m', 0xffffff, ox - 5.6, 0.8, oz + 1.1, 1.2, 0.3, 0.5); bx.push(k.blk(-5.6, 2.2, 2.1, 3.1, 1));
      k.table(b, ox + 5.6, oz + 1.0, 1.4, 2.4, 0x8a5a33); for (let i = 0; i < 3; i++) b.box('m', 0xfef3c7, ox + 5.5, 0.92, oz + 0.3 + i * 0.6, 0.6, 0.02, 0.45, 0.2 * i); bx.push(k.blk(5.6, 1, 1.5, 2.5, 1));
      k.lamps(b, ox, oz, 0xffd8a8); k.window(b, ox + 6.85, oz - 2.2, 'R'); k.window(b, ox - 6.85, oz - 1.2, 'L');
      add(sign("LUNA'S HOME", 2.4, 0.55, { bg: '#3730a3', border: '#fde68a' }), ox, 3.6, oz - 4.75);
      add(sign('RECIPE DESK', 1.6, 0.35, { bg: '#7c2d12', border: '#fbbf24' }), ox + 6.6, 1.8, oz + 1.0, -PI / 2);
      return { npcs: [['luna', -0.2, 0.4, PI, 'Luna']], light: 0xffd8a8 };
    },
    pirat(b, ox, oz, bx, add, k) { shell(b, ox, oz, 0xfce7f3, 0xc08552, 0xdb2777); const dc = S.decor || {};
      for (let i = -6; i <= 6; i += 1.2) b.box('m', 0xa06a40, ox + i, 0.045, oz, 0.06, 0.01, D);
      // bed (left back), wardrobe, toy chest, desk with Ratita phone, cheese cabinet
      b.box('m', 0xf9a8d4, ox - 5.4, 0, oz - 3.2, 2.2, 0.6, 3); b.box('m', dc.quilt ? 0xf97316 : 0xffffff, ox - 5.4, 0.6, oz - 2.8, 2.1, 0.22, 2.2); if (dc.quilt) for (let i = 0; i < 6; i++) b.box('m', [0xfacc15, 0xb91c1c, 0x16a34a][i % 3], ox - 6 + (i % 3) * 0.6, 0.83, oz - 3.4 + (i >> 1) * 0.5, 0.45, 0.02, 0.4);
      b.rbox('m', 0xffffff, ox - 5.4, 0.7, oz - 4.3, 1.4, 0.35, 0.5); bx.push(k.blk(-5.4, -3.2, 2.3, 3.1, 1));
      b.box('m', 0xbe185d, ox - 2.2, 0, oz - 4.6, 1.8, 3, 0.7); bx.push(k.blk(-2.2, -4.6, 1.9, 0.8, 3));
      b.box('m', 0xfde68a, ox + 2.0, 0, oz - 4.4, 2, 0.8, 0.8); bx.push(k.blk(2, -4.4, 2.1, 0.9, 0.9)); for (let i = 0; i < 3; i++) b.sph('m', 0xfacc15, ox + 1.5 + i * 0.5, 0.95, oz - 4.4, 0.18, 0.15, 0.18);
      k.table(b, ox + 5.4, oz - 3.4, 2, 1.2, 0xfbcfe8); b.box('l', 0x5ef2ff, ox + 5.4, 0.9, oz - 3.6, 0.35, 0.02, 0.6, 0, 0.6); bx.push(k.blk(5.4, -3.4, 2.1, 1.3, 1));
      b.cyl('m', 0xf472b6, ox + 1, 0.05, oz + 0.5, 2.2, 0.03);
      b.rbox('m', 0xf472b6, ox + 4.8, 0, oz + 2.2, 2.4, 0.5, 1.0); b.rbox('m', 0xf472b6, ox + 4.8, 0.5, oz + 2.6, 2.4, 0.7, 0.25); bx.push(k.blk(4.8, 2.3, 2.5, 1.1, 1));
      if (dc.garland) for (let i = 0; i < 14; i++) b.sph('g', [0xf97316, 0xb91c1c, 0xfacc15][i % 3], ox - 6.5 + i, H - 0.6 - Math.sin(i / 13 * PI) * 0.4, oz - 4.75, 0.2, 0.12, 0.05);
      if (dc.lights) for (let i = 0; i < 20; i++) b.sph('l', [0xffd166, 0xff7ab6, 0x7dd3fc][i % 3], ox - 6.8, H - 0.4 - Math.sin(i / 19 * PI) * 0.3, oz - 4.6 + i * 0.47, 0.06, 0.06, 0.06, 1);
      if (S.lantern) { b.sph('g', 0xf07b1f, ox + 2.0, 1.15, oz - 4.4, 0.34, 0.3, 0.32); b.box('e', 0xffd166, ox + 2.0, 1.12, oz - 4.08, 0.3, 0.14, 0.02, 0, 1.4); }
      if (dc.wreath) { b.cyl('g', 0xc2410c, ox, 2.9, oz + D / 2 - 0.2, 0.45, 0.08, PI / 2); b.cyl('m', 0xfce7f3, ox, 2.9, oz + D / 2 - 0.25, 0.28, 0.09, PI / 2); }
      k.lamps(b, ox, oz, 0xffe4f1); k.window(b, ox - 6.85, oz + 1.0, 'L'); k.window(b, ox + 6.85, oz - 0.5, 'R');
      add(sign("PI-RAT'S HOME", 2.6, 0.55, { bg: '#db2777', border: '#fde68a' }), ox + 1, 3.6, oz - 4.75);
      add(sign('DECOR', 1.2, 0.35, { bg: '#7c2d12', border: '#fbbf24' }), ox + 2.0, 1.7, oz - 4.7);
      return { npcs: [], light: 0xffe4f1 };
    }
  };
  const ROOMI = Object.fromEntries(DOORS.map((d, i) => [d.id, i]));
  // ---- density pass: tidy themed props for every room (room-local coords, all batched into the same few meshes) ----
  const DRESS = DRESS_FN();
  function acornMesh() { const g = new THREE.Group(); const b = new Batch(); b.sph('l', 0xfacc15, 0, 0.45, 0, 0.22, 0.28, 0.22, 0.9); b.sph('m', 0x7c4a1e, 0, 0.66, 0, 0.24, 0.1, 0.24); b.cyl('m', 0x5b3a24, 0, 0.72, 0, 0.03, 0.12); b.finish(g, false); return g; }
  function enter(id, keep) { const d = DOORS.find((q) => q.id === id), ox = 300 + ROOMI[id] * 60, oz = 0; const grp = new THREE.Group(), b = new Batch(), bx = [];
    const add = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; grp.add(o); };
    const pages = [];
    const k = { blk: (x, z, w, dd, h) => solid(ox + x - w / 2, oz + z - dd / 2, ox + x + w / 2, oz + z + dd / 2, 0, h),
      crate: (b, x, z) => { b.box('m', 0xa0703f, x, 0, z, 0.8, 0.7, 0.8); b.box('m', 0x7c4a1e, x, 0.3, z, 0.82, 0.08, 0.82); },
      table: (b, x, z, w, dd, col) => { b.box('m', col, x, 0.78, z, w, 0.08, dd); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box('m', 0x5b3a24, x + sx * (w / 2 - 0.1), 0, z + sz * (dd / 2 - 0.1), 0.1, 0.78, 0.1); },
      lamps: (b, x0, z0, col) => { for (const x of [-3, 0, 3]) { b.cyl('x', 0x2f3437, x0 + x, H - 0.6, z0, 0.02, 0.6); b.sph('l', col, x0 + x, H - 0.75, z0, 0.2, 0.18, 0.2, 1); } },
      window: (b, x, z, side) => { const sx = side === 'L' ? 1 : -1; b.box('m', 0xffffff, x + sx * 0.02, 1.0, z, 0.06, 1.5, 1.4); b.box('l', 0xbfe3ff, x + sx * 0.05, 1.08, z, 0.02, 1.34, 1.24, 0, 0.3); b.box('m', 0xffffff, x + sx * 0.06, 1.72, z, 0.02, 0.06, 1.24); },
      page: (pid) => { if (S.quests && S.quests.recipe === 1 && !(S.pages || []).includes(pid)) { const g = new THREE.Group(), pb = new Batch(); pb.box('l', 0xfff7d6, 0, 0.5, 0, 0.45, 0.02, 0.6, 0.3, 0.5); pb.box('m', 0x7c2d12, 0, 0.52, 0, 0.3, 0.005, 0.04, 0.3); pb.finish(g, false); pages.push({ pid, m: g }); return g; } return null; } };
    Object.assign(k, {
      plant: (x, z, s = 1) => { b.cyl('m', 0xb45309, ox + x, 0, oz + z, 0.28 * s, 0.5 * s); b.sph('g', 0x15803d, ox + x, 0.75 * s, oz + z, 0.42 * s, 0.5 * s, 0.42 * s); b.sph('g', 0x22c55e, ox + x + 0.15, 1.05 * s, oz + z - 0.1, 0.25 * s, 0.3 * s, 0.25 * s); bx.push(k.blk(x, z, 0.7 * s, 0.7 * s, 1.2 * s)); },
      frame: (face, a, y, w, h, c1, c2) => { const [x, z, ry] = face === 'B' ? [a, -4.82, 0] : face === 'L' ? [-6.82, a, 1] : [6.82, a, 1]; const fw = ry ? 0.05 : w, fd = ry ? w : 0.05;
        b.box('m', 0x5b3a24, ox + x, y - h / 2, oz + z, fw + (ry ? 0 : 0.12), h + 0.12, fd + (ry ? 0.12 : 0)); const ix = face === 'L' ? 0.03 : face === 'R' ? -0.03 : 0, iz = face === 'B' ? 0.03 : 0;
        b.box('m', c1, ox + x + ix, y - h / 2 + 0.06, oz + z + iz, ry ? 0.02 : w - 0.05, h - 0.05, ry ? w - 0.05 : 0.02); b.sph('m', c2, ox + x + ix * 1.5, y, oz + z + iz * 1.5, ry ? 0.02 : w * 0.25, h * 0.25, ry ? w * 0.25 : 0.02); },
      rug: (x, z, w, d, c1, c2) => { b.box('m', c2, ox + x, 0.045, oz + z, w, 0.012, d); b.box('m', c1, ox + x, 0.05, oz + z, w - 0.3, 0.012, d - 0.3); },
      shelf: (face, a, y, len, cols) => { const [x, z, ry] = face === 'B' ? [a, -4.7, 0] : face === 'L' ? [-6.68, a, 1] : [6.68, a, 1]; b.box('m', 0x7c4a1e, ox + x, y, oz + z, ry ? 0.3 : len, 0.06, ry ? len : 0.3);
        const n = Math.round(len / 0.4); for (let i = 0; i < n; i++) { const o = -len / 2 + 0.2 + i * 0.4; b.cyl('m', cols[i % cols.length], ox + x + (ry ? 0 : o), y + 0.06, oz + z + (ry ? o : 0), 0.12, 0.28); } },
      bunting: (face, y, c) => { for (let i = 0; i < 12; i++) { const o = -5.5 + i, sag = Math.sin(i / 11 * PI) * 0.25; if (face === 'B') b.box('m', c[i % c.length], ox + o, y - sag, oz - 4.8, 0.42, 0.32, 0.03); else b.box('m', c[i % c.length], ox + (face === 'L' ? -6.8 : 6.8), y - sag, oz + o * 0.75, 0.03, 0.32, 0.42); } },
      shock: (x, z) => { for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; b.cyl('m', i % 2 ? 0xd4b26a : 0xc49a4a, ox + x + Math.cos(a) * 0.12, 0, oz + z + Math.sin(a) * 0.12, 0.07, 1.7); } b.cyl('m', 0x9a3412, ox + x, 0.7, oz + z, 0.24, 0.08); b.sph('g', 0xf97316, ox + x + 0.35, 0.2, oz + z + 0.25, 0.25, 0.2, 0.25); bx.push(k.blk(x, z, 0.8, 0.8, 1.7)); },
      hay: (x, z, top) => { b.rbox('m', 0xe3c062, ox + x, 0, oz + z, 1.1, 0.6, 0.7); if (top) b.sph('g', top, ox + x, 0.78, oz + z, 0.26, 0.2, 0.26); bx.push(k.blk(x, z, 1.15, 0.75, 0.9)); },
      crate2: (x, z, fill) => { k.crate(b, ox + x, oz + z); if (fill) for (let i = 0; i < 4; i++) b.sph('g', fill, ox + x - 0.18 + (i % 2) * 0.36, 0.72, oz + z - 0.18 + (i >> 1) * 0.36, 0.16, 0.14, 0.16); bx.push(k.blk(x, z, 0.85, 0.85, 0.9)); },
      clock: (face, a, y) => { const [x, z] = face === 'B' ? [a, -4.8] : [face === 'L' ? -6.8 : 6.8, a]; b.cyl('m', 0x5b3a24, ox + x, y, oz + z, 0.32, 0.05, face === 'B' ? PI / 2 : 0, face === 'B' ? 0 : PI / 2); b.cyl('m', 0xfffbeb, ox + x + (face === 'L' ? 0.03 : face === 'R' ? -0.03 : 0), y, oz + z + (face === 'B' ? 0.03 : 0), 0.26, 0.04, face === 'B' ? PI / 2 : 0, face === 'B' ? 0 : PI / 2); } });
    const info = BUILD[id](b, ox, oz, bx, add, k); if (DRESS[id]) DRESS[id](k, b, ox, oz, add, info); bx.push(...walls(ox, oz)); b.finish(grp);
    const cb = new Batch(); cb.box('m', 0x5b3a24, ox, H, oz, W + 0.6, 0.25, D + 0.6); cb.finish(grp, false);
    const lights = [-3.5, 3.5].map((dx) => { const L = new THREE.PointLight(info.light, 16, 14, 1); L.position.set(ox + dx, H - 0.6, oz); grp.add(L); return L; });
    const npcs = info.npcs.map(([pid, x, z, yaw, who]) => { const p = makePet(pid, { s: pid === 'candy' ? 2.1 : pid === 'luna' || pid === 'snowie' ? 1.3 : 1.25, outfit: pid === 'ash' ? 'chef' : undefined, extras: pid === 'luna' ? ['glasses'] : undefined }); p.x = ox + x; p.z = oz + z; p.yaw = yaw; p.who = who; p.pid = pid; grp.add(p.root); return p; });
    S.acorns = S.acorns || []; const acorns = (ACORNS[id] || []).map(([x, z], i) => { const key = id + i; if (S.acorns.includes(key)) return null; const m = acornMesh(); m.position.set(ox + x, 0, oz + z); grp.add(m); return { key, m, x: ox + x, z: oz + z }; }).filter(Boolean);
    scene.add(grp); cur = { id, d, ox, oz, grp, boxes: bx, npcs, acorns, pages };
    if (keep) return; P.x = ox; P.z = oz + D / 2 - 3.2; P.yaw = PI; cam.yaw = 0; cam.snap = true; sfx('door'); toast('🚪 ' + d.name);
    if (ctx.onEnter) ctx.onEnter(id, cur); }
  function teardown() { if (!cur) return; for (const bb of cur.boxes) { const i = COL.boxes.indexOf(bb); if (i >= 0) COL.boxes.splice(i, 1); }
    scene.remove(cur.grp); cur.grp.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map) { o.material.map.dispose(); } if (o.material && !Object.values(MATS).includes(o.material)) o.material.dispose && o.material.dispose(); });
    cur = null; }
  function refresh() { if (!cur) return; const id = cur.id; teardown(); enter(id, true); }
  function leave() { if (!cur) return; const d = cur.d; teardown(); P.x = d.out[0]; P.z = d.out[1]; P.yaw = d.out[2]; cam.yaw = d.out[2] + PI; cam.snap = true; sfx('door'); }
  function spots() { if (!cur) return DOORS.map((d) => ({ x: d.x, z: d.z, r: 1.8, label: '🚪 Enter ' + d.name, f: () => enter(d.id) }));
    const o = [{ x: cur.ox, z: cur.oz + D / 2 - 0.6, r: 1.4, label: '🚪 Go outside', f: leave }];
    for (const a of cur.acorns) if (!a.got) o.push({ x: a.x, z: a.z, r: 1.3, label: '🌰 Grab the golden acorn!', f: () => { a.got = true; a.m.visible = false; S.acorns.push(a.key); S.coins += 5; sfx('cheer'); toast(`🌰 Golden acorn ${S.acorns.length}/20! +5 🪙`); if (ctx.onAcorn) ctx.onAcorn(S.acorns.length); } });
    for (const pg of cur.pages) if (!pg.got) { const wp = pg.m.position; o.push({ x: wp.x, z: wp.z, r: 1.5, label: '📜 Pick up the lost recipe page', f: () => { pg.got = true; pg.m.visible = false; S.pages = (S.pages || []).concat(pg.pid); sfx('pop'); toast(`📜 Recipe page ${S.pages.length}/3! Bring them to Luna.`); } }); }
    if (ctx.roomSpots) o.push(...ctx.roomSpots(cur)); return o; }
  function step(dt) { if (!cur) return; const t = performance.now() / 1000; for (const p of cur.npcs) { p.speed = 0; p.noTurn = true; animPet(p, dt, P); }
    for (const pg of cur.pages) if (!pg.got) pg.m.position.y = (pg.y0 ??= pg.m.position.y) + Math.sin(t * 2.5) * 0.06;
    for (const a of cur.acorns) if (!a.got) { a.m.rotation.y = t * 2; a.m.position.y = Math.sin(t * 3) * 0.08; } }
  return { enter, leave, refresh, spots, step, inside: () => cur, DOORS, acornMesh };
}
