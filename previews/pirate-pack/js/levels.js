// The rooms. Each builds geometry + colliders + gameplay into a World. Units: 1 = ~13 cm.
import { kit, PR, propSeed } from './lvlkit.js';
import { rbox } from './world.js';
import { rcyl, lathe, sph, cyl, torus, capsule, cone, tube, leaf, wedge, star, heart, gear, blobGeo } from './shapes.js';
import { LEVELS } from './data.js';
import { S } from './save.js';
import { textGeo } from './text3d.js';
const PI = Math.PI;
const INDOOR = { sunDir: [0.35, 0.8, 0.45], sunColor: 0xfff1d6, sunI: 2.3, hemiSky: 0xfff4e6, hemiGround: 0xc9a27a, hemiI: 0.75, skyTop: 0x5fb4ff, skyMid: 0xbfe6ff, skyBot: 0xfff1d6, fog: 0xf6ead8, fogD: 0.0026, envI: 0.85, exposure: 0.94, bloomT: 1.02, bloomS: 0.42, envLight: 0xfff3e0 };
export function buildLevel(id, w, seed) { kit(w); propSeed(7 + id.length * 13); const f = BUILD[id] || BUILD.kitchen; f(w); w.env = Object.assign({}, INDOOR, w.env || {}); w.music = w.music || id; return w; }
const BUILD = {};
// =====================================================================================  RATITA HQ
BUILD.hq = (w) => {
  w.room(40, 30, 13, { wall: 0xffe2c2, wallN: 0xffd3a8, ceil: 0xf5e1c8, floor: (a, b, c, d) => PR.floorPlanks(w, a, b, c, d, 0, [0xb7773f, 0xa86a35, 0xc4834a, 0x9e6230]) });
  w.start = [0, 0, 8]; w.startYaw = PI; w.camDist = 6.2; w.music = 'hq';
  // big rug + logo
  PR.rug(w, 0, 2, 0, 18, 11, 0xd9468f, 0xffb3d6); w.add('g', wedge(), 0xffd23f, 0, 0.25, 2, -PI / 2, 0, 0, 2.2, 2.2, 0.6);
  // level doors along the back wall (mouse holes in a row) + the 7th on the left
  const doors = LEVELS.map((L, i) => ({ L, i, x: -15 + i * 5, z: -15 }));
  doors.forEach(({ L, i, x, z }) => { const unlocked = i === 0 || S.done[LEVELS[i - 1].id] || S.cheat; const col = parseInt(L.col.slice(1), 16);
    PR.mouseHole(w, 'x', z, x, 1, unlocked ? 1 : 0); w.add('g', rbox(3.6, 0.5, 0.6, 0.2), col, x, 3.4, z + 0.5); w.add('l', sph(14), unlocked ? col : 0x555555, x, 4.2, z + 0.6, 0, 0, 0, 0.5, 0.5, 0.2, unlocked ? 0.6 : 0);
    if (S.done[L.id]) w.add('x', wedge(), 0xffc400, x, 4.6, z + 0.9, 0, 0, 0, 0.55);
    if (!unlocked) { w.add('x', torus(0.25, 20, PI), 0x9ca3af, x, 1.6, z + 1.0, 0, 0, 0, 0.35); w.add('g', rbox(0.9, 0.8, 0.3, 0.12), 0xfacc15, x, 1.2, z + 1.0); }
    w.zone('door', x - 1.4, -1, z, x + 1.4, 3, z + 2.6, { level: L.id, label: unlocked ? `${L.icon} ${L.room}: ${L.n}` : `🔒 Beat ${LEVELS[i - 1].room} first`, locked: !unlocked });
    // little 3D "sign" props on top of each door hinting the room
    const T = w.tf(x, 5.0, z + 0.8, 0, 0.5); [() => PR.toaster(w, x, 5.0, z + 0.9, 0, col), () => { w.add('f', rbox(2.8, 1.0, 1.4, 0.45), col, x, 5.5, z + 0.9); w.add('f', rbox(2.8, 1.2, 0.5, 0.25), col, x, 6.2, z + 0.4); }, () => w.add('x', rbox(3, 1.4, 1, 0.3), 0xcbd5e1, x, 5.7, z + 0.8), () => PR.flower(w, x, 5.0, z + 0.9, 1.2, col, false), () => PR.wrench(w, x, 5.0, z + 0.9, PI / 2, 0.5), () => PR.toyBlock(w, x, 5.0, z + 0.9, 1.2, 0.3, col), () => PR.lantern(w, x, 5.0, z + 0.9)][i]();
  });
  w.solid(-20, 5, -15.3, 20, 9, -13.6); // shelf strip the signs sit on
  w.add('m', rbox(40, 0.4, 1.8, 0.1), 0x8b5a2b, 0, 4.8, -14.4);
  // kiosks: workbench (upgrades), wardrobe mirror (outfits), map table, nursery
  PR.workbench(w, -14, -3, PI / 2, 9, 4.2, 4); w.add('l', rbox(2.4, 1.6, 0.2, 0.1), 0x3ff0ff, -15.4, 6, -3, 0, PI / 2, 0, 1, 1, 1, 0.5); PR.wrench(w, -14, 4.2, -5, 0.4, 0.4); PR.hammer(w, -13.6, 4.2, -1.5, -0.3); w.add('g', gear(8), 0x3ff0ff, -14, 4.6, -3, PI / 2, 0, 0, 0.8, 0.8, 0.5, 0.3);
  (w.kiosks = w.kiosks || []).push({ id: 'upgrades', x: -11.5, y: 0, z: -3, r: 3, label: '🔧 Ratita Industries Upgrades' });
  // wardrobe
  w.slab('g', 0xf9a8d4, 15, 0, -3, 3.4, 8, 6, 0.4); w.add('e', rbox(0.2, 5.4, 4, 0.1), 0xdff6ff, 13.25, 1.2, -3); w.add('g', torus(0.12, 32), 0xffd23f, 13.25, 3.9, -3, 0, PI / 2, 0, 2.2, 2.9, 1); w.kiosks.push({ id: 'outfits', x: 11.5, y: 0, z: -3, r: 3, label: '🎩 Wardrobe (hats)' });
  // map table
  PR.coffeeTable(w, 0, -6, 0, 10, 6, 1.6); for (let i = 0; i < 7; i++) w.add('g', sph(12), parseInt(LEVELS[i].col.slice(1), 16), -4 + i * 1.33, 1.75, -6 + Math.sin(i) * 1.5, 0, 0, 0, 0.35, 0.2, 0.35); w.kiosks.push({ id: 'map', x: 0, y: 0, z: -6, r: 4, label: '🗺️ House Map' });
  // nursery: matchbox beds with rescued babies count shown as tiny rats
  const nb = Object.values(S.babies).reduce((a, l) => a + l.length, 0);
  w.slab('m', 0xef4444, -14, 0, 9, 7, 1, 4, 0.15); w.add('f', rbox(6.4, 0.5, 3.4, 0.2), 0xfef3c7, -14, 1.2, 9); w.kiosks.push({ id: 'nursery', x: -14, y: 0, z: 9, r: 3.5, label: `🐭 Nursery (${nb}/21 babies)` });
  w.nursery = { x: -14, y: 1.45, z: 9, n: nb };
  // cozy props
  PR.bookshelf(w, 17.5, 8, -PI / 2, 9, 9, 3, 0x9a6a3e, 3); PR.plant(w, 17, 0, -11, 1.4); PR.plant(w, -17, 0, -11, 1.3, 0x3b82f6); PR.lamp(w, -17, 13, 0, 8);
  for (let i = 0; i < 5; i++) PR.cardboard(w, 10 + (i % 3) * 2.2, (i > 2 ? 1.6 : 0), 13.6, 0.2 * i, 2, 1.6, 2, false);
  PR.ball(w, 4.5, 0, 12.5, 1.0, 0x3ff0ff, 0xffd23f); PR.toyBlock(w, 17, 0, 13.4, 1.4, 0.4); PR.toyBlock(w, 17.2, 1.4, 13.4, 1.2, 0.9); PR.mug(w, -12.5, 4.2, -1, 0, 0xff4fa0);
  w.frameArt('z', -20, 0, 6, 4, 3, 1, 0); w.frameArt('z', 20, -9, 6, 3, 3.6, -1, 1); PR.clock(w, 'x', 15, 0, 9, -1);
  // pipes + lights along ceiling for "secret base" feel
  for (let i = 0; i < 3; i++) w.add('x', cyl(14), [0x3ff0ff, 0xff4fa0, 0xffd23f][i], 0, 11.5 - i * 0.7, -14 + i * 0.7, 0, 0, PI / 2, 0.25, 38, 0.25, 0.15);
  [-12, 0, 12].forEach((x) => { w.add('l', sph(16), 0xffe6b0, x, 11.6, 4, 0, 0, 0, 0.7, 0.4, 0.7, 1); });
  hqExtras(w);
  w.martinaSpec = { x: 11.5, z: 3.5, yaw: -0.9, say: 'hi' };
  w.cp(3, 0, 10); w.hint(-20, 2, 20, 15, '🏠 Ratita HQ! Walk into a mouse-hole door to explore a room. Visit the workbench to buy upgrades.');
  w.env = { exposure: 1.0, fog: 0xf5dcc0, fogD: 0.004, hemiI: 0.9 };
};
// dense Ratita HQ dressing: 3D signage, gadget display cases, rat-sized lounge, assembly line, cheese vault
function hqExtras(w) {
  const sign = (str, x, y, z, ry, size, col, back) => { const g = textGeo(str, size, size * 0.3); if (!g) return; const W = g.userData.w; const c = Math.cos(ry), sn = Math.sin(ry);
    w.add('g', g, col, x, y, z, 0, ry, 0, 1, 1, 1, 0.15); if (back) { w.add('g', rbox(W + size * 1.2, size * 1.7, 0.3, 0.25), back, x - sn * size * 0.25, y + size * 0.45, z - c * size * 0.25, 0, ry, 0);
      for (let i = 0; i < 9; i++) w.add('l', sph(8), 0xfff3b0, x - sn * size * 0.2 + c * (-W / 2 - size * 0.4 + i * (W + size * 0.8) / 8), y - size * 0.35, z - c * size * 0.2 + sn * (-W / 2 - size * 0.4 + i * (W + size * 0.8) / 8), 0, 0, 0, 0.16, 0.16, 0.16, 1); } };
  sign('RATITA INDUSTRIES', 0, 9.3, -14.9, 0, 1.25, 0xff4fa0, 0xfff1c9); w.add('g', gear(10), 0x3ff0ff, -13.6, 10, -14.9, 0, 0, 0, 0.9, 0.9, 0.3); w.add('g', gear(10), 0xffd23f, 13.6, 10, -14.9, 0, 0, 0, 0.9, 0.9, 0.3);
  sign('UPGRADES', -19.5, 8, -3, PI / 2, 0.9, 0x3ff0ff, 0x3b2a5a); sign('NURSERY', -19.5, 5.5, 9, PI / 2, 0.7, 0xff8fd0, 0xfff1f8); sign('OUTFITS', 13.0, 8.4, -3, -PI / 2, 0.6, 0xffd23f, 0x7c2d6b);
  // floor logo: flat gear around the cheese wedge + a second lab rug + small mats
  w.add('g', gear(12), 0xffd23f, 0, 0.22, 2, -PI / 2, 0, 0, 3.6, 3.6, 0.25); w.add('g', rcyl(2.6, 0.12, 0.05, 40), 0xff4fa0, 0, 0.26, 2);
  PR.rug(w, -12, -3, 0, 7, 11, 0x3ff0ff, 0xe0fbff); PR.rug(w, 12, 8.5, 0, 8, 7, 0xffd23f, 0xfff7d1); PR.rug(w, -6, 11.5, 0, 9, 6, 0xa78bfa, 0xf3e8ff);
  // gadget display cases (pedestal + glass + real 3D gadget inside)
  const cases = [[-8, 0.5, 'glider'], [-8, 4.5, 'grapple'], [7.5, 0, 'blaster'], [7.5, -3.6, 'jet']];
  cases.forEach(([x, z, k]) => { w.slab('g', 0x3b2a5a, x, 0, z, 2, 1.6, 2, 0.2); w.add('l', rbox(1.7, 0.08, 1.7, 0.04), 0x3ff0ff, x, 1.62, z, 0, 0, 0, 1, 1, 1, 0.5); w.add('e', rbox(1.8, 2, 1.8, 0.15), 0xdff6ff, x, 2.65, z); w.add('g', rbox(1.9, 0.2, 1.9, 0.08), 0xffd23f, x, 3.7, z);
    const y = 2.5; if (k === 'glider') { [-1, 1].forEach((s) => w.add('g', wedge(), 0xff4fa0, x + s * 0.45, y, z, PI / 2, 0, s * 0.3, 0.6, 0.3, 0.12)); w.add('x', cyl(10), 0xd1d5db, x, y, z, 0, 0, PI / 2, 0.05, 1.2, 0.05); }
    else if (k === 'grapple') { w.add('x', torus(0.18, 24), 0x3ff0ff, x, y + 0.2, z, 0, 0, 0, 0.45); w.add('x', cyl(10), 0x9ca3af, x, y - 0.6, z, 0, 0, 0, 0.06, 0.9, 0.06); }
    else if (k === 'blaster') { w.add('g', rcyl(0.28, 1.1, 0.1, 18), 0xffd23f, x, y, z, 0, 0, PI / 2); w.add('g', sph(14), 0xff9f1c, x - 0.5, y, z, 0, 0, 0, 0.38); w.add('l', sph(10), 0xfff36b, x + 0.6, y, z, 0, 0, 0, 0.16, 0.16, 0.16, 0.8); }
    else { w.add('x', cone(16), 0xef4444, x, y + 0.4, z, 0, 0, 0, 0.3, 0.5, 0.3); w.add('x', cyl(16), 0xd1d5db, x, y - 0.3, z, 0, 0, 0, 0.3, 0.7, 0.3); w.add('l', cone(12), 0xff9f1c, x, y - 0.75, z, PI, 0, 0, 0.22, 0.4, 0.22, 0.9); }
  });
  // rat lounge: matchbox sofa, thread-spool table, bottle-cap stools, thimble lamp
  w.slab('f', 0xef4444, -8, 0, 12.6, 4.4, 1.1, 1.8, 0.3); w.slab('f', 0xef4444, -8, 1.1, 13.4, 4.4, 1.4, 0.5, 0.25); w.add('f', rbox(1.9, 0.4, 1.3, 0.2), 0xfde68a, -9, 1.25, 12.5); w.add('f', rbox(1.9, 0.4, 1.3, 0.2), 0xfde68a, -7, 1.25, 12.5);
  w.add('g', rbox(4.6, 0.12, 2, 0.05), 0x1d4ed8, -8, 0.6, 12.6);
  w.add('m', rcyl(0.9, 1.4, 0.15, 24), 0xc08552, -4.8, 0, 11); w.add('f', rcyl(0.75, 1.0, 0.1, 24), 0x22d3ee, -4.8, 0.2, 11); w.add('m', rcyl(1.1, 0.2, 0.08, 24), 0xc08552, -4.8, 1.3, 11); w.solid(-5.9, 0, 9.9, -3.7, 1.5, 12.1);
  PR.mug(w, -4.6, 1.5, 11, 0, 0xffffff); [[-2.6, 12], [-4.8, 13.2]].forEach(([x, z]) => { w.add('g', rcyl(0.7, 0.5, 0.08, 21), 0xef4444, x, 0, z); w.add('x', rcyl(0.55, 0.06, 0.03, 21), 0xf1f5f9, x, 0.5, z); w.solid(x - 0.7, 0, z - 0.7, x + 0.7, 0.55, z + 0.7); });
  w.add('x', lathe([[0, 0], [0.7, 0], [0.55, 1.6], [0.4, 1.8], [0, 1.8]], 20), 0xd1d5db, -11, 0, 12.8); w.add('l', sph(12), 0xfff1c1, -11, 2.2, 12.8, 0, 0, 0, 0.5, 0.5, 0.5, 1); w.solid(-11.7, 0, 12.1, -10.3, 1.8, 13.5);
  // teacup hot tub
  w.add('g', lathe([[0, 0], [1.2, 0], [1.9, 1.2], [2.1, 2.2], [2.0, 2.25], [1.8, 1.25], [0, 1.1]], 32), 0xf9fafb, 12, 0, 8.6); w.add('g', torus(0.12, 20), 0xff8fd0, 12, 2.2, 8.6, PI / 2, 0, 0, 2.05, 2.05, 2.05);
  w.add('e', rcyl(1.85, 0.2, 0.05, 32), 0x7dd3fc, 12, 1.75, 8.6); for (let i = 0; i < 6; i++) w.add('l', sph(8), 0xe0fbff, 12 + Math.cos(i) * 1.1, 2.0, 8.6 + Math.sin(i * 1.7) * 1.1, 0, 0, 0, 0.18, 0.18, 0.18, 0.4);
  w.add('g', torus(0.18, 16, PI), 0xf9fafb, 14.1, 1.3, 8.6, 0, PI / 2, PI / 2, 0.6, 0.6, 0.6); w.solid(10.1, 0, 6.7, 13.9, 2.2, 10.5);
  // assembly line (west) + cheese vault (east) under the door shelf
  w.slab('x', 0x334155, -12.5, 0, -10.6, 9, 1.5, 2, 0.15); w.add('m', rbox(9.2, 0.15, 1.7, 0.05), 0x111827, -12.5, 1.58, -10.6); for (let i = 0; i < 6; i++) w.add('g', gear(8), [0x3ff0ff, 0xffd23f, 0xff4fa0][i % 3], -16 + i * 1.4, 1.95, -10.6, 0, i, 0, 0.35, 0.35, 0.25);
  w.add('x', cyl(12), 0xf59e0b, -9, 1.5, -10.6, 0, 0, 0, 0.18, 2.2, 0.18); w.add('x', cyl(12), 0xf59e0b, -9.6, 3.7, -10.6, 0, 0, 1.0, 0.15, 1.3, 0.15); w.add('l', sph(10), 0xff4fa0, -10.4, 3.2, -10.6, 0, 0, 0, 0.25, 0.25, 0.25, 0.8);
  for (let i = 0; i < 5; i++) { const x = 9.5 + (i % 3) * 2.4, y = i > 2 ? 1.1 : 0; w.add('g', rcyl(1.1, 1.1, 0.2, 28), 0xffc93c, x + (i > 2 ? 1.2 : 0), y, -10.8); for (let k = 0; k < 3; k++) w.add('m', sph(8), 0xe8a317, x + (i > 2 ? 1.2 : 0) + Math.cos(k * 2) * 0.6, y + 0.6, -10.8 + 1.02, 0, 0, 0, 0.2, 0.2, 0.06); }
  w.solid(8.3, 0, -11.9, 15.9, 2.2, -9.7);
  // bunting along the walls + wall pipes with valves
  for (let i = 0; i < 22; i++) { const x = -19 + i * 1.8; w.add('f', wedge(), [0xff4fa0, 0xffd23f, 0x3ff0ff, 0xa78bfa][i % 4], x, 11.2 - Math.sin(i / 21 * PI) * 0.8, 14.6, PI, 0, 0, 0.35, 0.45, 0.06); }
  [[-19.6, 3, 1], [19.6, -8, -1]].forEach(([x, z, s]) => { w.add('x', cyl(14), 0x94a3b8, x - s * 0.1, 0, z, 0, 0, 0, 0.3, 11, 0.3); w.add('g', torus(0.2, 20), 0xef4444, x + s * 0.3, 4, z, 0, PI / 2, 0, 0.6); });
  // scattered crumbs-of-life: bottle caps, buttons, spools
  [[3, 11, 0xffd23f], [-1.5, 12.8, 0x22c55e], [15, 1.5, 0x3b82f6], [-17, -8, 0xef4444], [5.5, -10.5, 0xa78bfa]].forEach(([x, z, c]) => { w.add('g', rcyl(0.6, 0.25, 0.08, 21), c, x, 0, z); w.add('g', sph(8), 0xffffff, x, 0.25, z, 0, 0, 0, 0.12, 0.05, 0.12); });
  // blueprints on the floor, cable runs, parts crates, little toolkits and scattered gadget bits
  [[3.5, -7, 0.3], [-3, 7.5, -0.4], [15.5, -6, 0.15]].forEach(([x, z, a]) => { const T = w.tf(x, 0, z, a); T.box('m', 0x1d4ed8, 0, 0, 0, 3.4, 0.05, 2.4, 0.02); for (let k = 0; k < 4; k++) T.box('l', 0xdbeafe, -1.2 + k * 0.8, 0.05, 0, 0.05, 0.01, 1.8, 0.01, 0.2); T.box('l', 0xdbeafe, 0, 0.05, 0.4, 2.6, 0.01, 0.05, 0.01, 0.2); T.add('m', cyl(12), 0x93c5fd, 1.75, 0.2, -1.2, PI / 2, 0, 0, 0.2, 2.4, 0.2); });
  w.add('g', tube([[-19.5, 0.12, -12], [-14, 0.12, -13.5], [-6, 0.12, -12.8], [0, 0.12, -13.6], [8, 0.12, -13], [19.5, 0.12, -13.8]], 0.14, 60, 8), 0xff4fa0, 0, 0, 0);
  w.add('g', tube([[-19.5, 0.1, 6], [-16, 0.1, 5], [-14.5, 0.1, 1], [-14, 0.1, -3]], 0.12, 40, 8), 0x3ff0ff, 0, 0, 0);
  [[17, -13, 0.2], [-17.5, 2, -0.3]].forEach(([x, z, a]) => { PR.cardboard(w, x, 0, z, a, 2.4, 1.8, 2.2, true); for (let k = 0; k < 3; k++) w.add('g', gear(8), [0xffd23f, 0x3ff0ff, 0xc0c6cf][k], x + (k - 1) * 0.6, 2.1, z, 0.4, k, 0, 0.3, 0.3, 0.2); });
  PR.scatter(w, -19, -14, 19, 14, 46, 'lab');
  PR.plant(w, -2.5, 0, 13.6, 0.8, 0x8b5cf6); PR.plant(w, 17.2, 0, 1.5, 0.9, 0xf59e0b); PR.can(w, -18, 0, -6.5, 0x4f9dff); PR.jar(w, -18.2, 0, -9, 0xffd23f, 0xff4fa0, 2);
}
// =====================================================================================  1. KITCHEN
BUILD.kitchen = (w) => {
  const H = 6.8; // counter height
  w.room(60, 50, 22, { wall: 0xfff6e0, wallN: 0xd8f0ff, floor: (a, b, c, d) => PR.floorTiles(w, a, b, c, d, 0, 0xfff7ec, 0xf28c8c, 3), holesN: [[-1, 7, 17, 10]] });
  w.start = [-22, 0, 15]; w.startYaw = -PI + 0.22; PR.mouseHole(w, 'z', -30, 8, 1, 1);
  w.cp(-24.5, 0, 12.5, -PI + 0.22);
  w.hint(-30, 2, -20, 14, '🐀 Welcome to the giant kitchen! Climb the stool, the chair, then the table.');
  // ---- floor route: stool -> chair -> table
  PR.stool(w, -24, 6, 0, 2.2, 0x60a5fa); w.crumbLine(-22.3, 0, 13, -23.8, 0, 8.4, 4); w.crumbArc(-24, 2.2, 6, -19, 3.7, 6, 1.5, 4);
  PR.chair(w, -19, 6, PI, 3.4, 0xd99a5e, 0xff7a90); PR.chair(w, -26.5, -4, PI / 2, 3.4, 0xd99a5e, 0x7dd3fc); PR.chair(w, -1.5, -4, -PI / 2, 3.4, 0xd99a5e, 0xa7f3d0);
  PR.table(w, -14, -4, 0, 16, 10, 5.7, 0xc58b52, 0xa86f3c);
  // table top clutter
  const TY = 5.7; PR.plate(w, -18, TY, -2, 3); PR.plate(w, -10, TY, -6, 1, 0xfde68a); PR.bowl(w, -14, TY, -4, 0x60a5fa, 1); PR.mug(w, -20, TY, -6.5, 0.5, 0xff5d73); PR.mug(w, -8, TY, -1.5, 2.2, 0x4f9dff);
  PR.cereal(w, -7.5, TY, -7.5, -0.3, 0xffc93c); PR.fruit(w, -11, TY, -1, 'apple'); PR.fruit(w, -12, TY, -0.8, 'orange'); PR.fruit(w, -16.5, TY, -7.5, 'banana'); PR.magazine(w, -20, TY, -1.5, 0.3, 1);
  w.crumbLine(-19, TY, 0, -9, TY, 0, 7); w.cheese(-12, TY, -7.5); w.crate(-21, TY, -3.5); w.enemy('windup', -14, TY, -1, { axis: 'x', range: 4 });
  w.cp(-17, TY, -1.5, PI);
  // ---- spoon bridge from table to counter
  PR.spoonBridge(w, -20, TY, -8.8, -20, H, -17.6, 0xc8925c); w.crumbLine(-20, TY + 0.2, -9.5, -20, H, -16.5, 5);
  w.hint(-23, -12, -17, -8.5, '🥄 Walk across the wooden spoon to the counter!', 4);
  // ---- counters along the back wall
  const CZ = -21.5, CD = 7;
  PR.cabinets(w, -29.5, -17, CZ, 0, H, CD, 0xf7f2e8, 0x5b6b8c); PR.cabinets(w, -9.5, -3, CZ, 0, H, CD, 0xf7f2e8, 0x5b6b8c); PR.cabinets(w, 7, 13, CZ, 0, H, CD, 0xf7f2e8, 0x5b6b8c);
  // sink section (custom so the basin is a real hole)
  w.slab('m', 0xf7f2e8, 2, 0, CZ, 10, H - 2.2, CD, 0.12); w.add('g', rbox(9.6, 3.4, 0.2, 0.12), 0xeef3f8, 2, 1.9, CZ + 3.55);
  [[-2.1, CZ, 1.8, CD + 0.5], [6.1, CZ, 1.8, CD + 0.5], [2, -24.35, 6.4, 1.3], [2, -18.4, 6.4, 2.2]].forEach(([x, z, sx, sz]) => w.slab('g', 0x5b6b8c, x, H - 2.2, z, sx, 2.2, sz, 0.12));
  PR.sink(w, 2, CZ, 0, H); w.water(-1.1, H - 2.4, -23.6, 5.1, H - 0.9, -19.4);
  const sp = PR.sponge(w, 4.6, H, -18.4, 0.1); sp.bounce = 13;
  PR.soap(w, -0.4, H, -24.4, 0xc084fc); PR.towelRoll(w, -2.2, H, -23.5); w.part(-0.4, H + 2.2, -24.4);
  w.hint(-3, -20, 7, -17, '🧽 Bounce on the sponge up to the window sill!', 5);
  // window sill goodies
  PR.window(w, 'x', -25.6, 3, 8, 10, 17, 1, 0xff8fb1); PR.plant(w, 0.2, 10.2, -24.2, 0.8, 0xe76f51); PR.plant(w, 5.6, 10.2, -24.2, 0.7, 0x60a5fa); w.baby(3, 10.2, -24); w.crumbLine(0.8, 10.2, -24, 5.2, 10.2, -24, 3);
  // stove (2 hot burners)
  const burners = PR.stove(w, -13.25, CZ, 0, H, [0, 3]);
  burners.forEach((b) => { if (b.on) { w.hot(b.p[0] - 1.25, H, b.p[2] - 1.25, b.p[0] + 1.25, H + 0.14, b.p[2] + 1.25); w.anims.push(() => { if (Math.random() < 0.35 && w.game) w.game.fx.emit(b.p[0] + (Math.random() - 0.5) * 1.6, H + 0.3, b.p[2] + (Math.random() - 0.5) * 1.6, 0, 2.2, 0, 0.08, Math.random() < 0.5 ? 0xff7a3d : 0xffd23f, 0.6, -1, 0.5); }); } });
  PR.pot(w, -15.05, H, -20.1 + 0, 0xef4444);
  w.hint(-17, -25, -9.5, -17, '🔥 Hot burners! Hop across on the cool dark ones.', 5);
  // left counter clutter
  PR.breadLoaf(w, -25.5, H, -22.5, 0.1); PR.jar(w, -28, H, -24, 0xf59e0b, 0xef4444); PR.jar(w, -26.4, H, -24.2, 0x84cc16, 0x3b82f6, 1.3); PR.cuttingBoard(w, -22, H, -20.5, 0.2); PR.can(w, -18.2, H, -24, 0x4f9dff);
  w.cheese(-22, H + 0.3, -20.5); w.crumbLine(-20, H, -18.5, -17.6, H, -18.5, 3); w.part(-28.3, H, -19.2); w.enemy('bot', -24, H, -19.6, { axis: 'x', range: 3 }); w.cp(-20, H, -20, PI / 2);
  PR.spiceRack(w, -25, 9.4, -24.4, 0);
  // middle counter
  PR.kettle(w, -7.8, H, -23.4, 0x14b8a6); PR.mug(w, -5.2, H, -23.8, 0, 0xffc93c); PR.mug(w, -4.2, H, -22.3, 1.2, 0x3ddc84); PR.toaster(w, -6, H, -19.5, 0.2, 0xff8a3d);
  w.part(-7.8, H + 1.65, -23.4); w.crate(-4.2, H, -19); w.crumbLine(-9, H, -18.3, -3.5, H, -18.3, 5); w.enemy('windup', -6.5, H, -21.5, { axis: 'z', range: 2 });
  // right counter: microwave + cereal stairs up to the fridge
  PR.microwave(w, 10, H, -22.6, 0); PR.jar(w, 8, H, -19, 0xfde047, 0xff4fa0); PR.cereal(w, 10, H + 3, -23.4, 0, 0xff5d73, 3.2); PR.cereal(w, 12.2, H + 3, -21.8, 0.4, 0x3ddc84, 2.2);
  w.cheese(11.2, H + 3, -20.8); w.heartP(12, H, -18.5); w.crumbLine(7.5, H, -18.3, 12.5, H, -18.3, 4);
  PR.fridge(w, 16.5, -21.6, 0, 13, 0xe8f1ff); w.baby(16.5, 13, -21.5); w.part(18.5, 13, -23); w.crumbRing(16.5, 13, -21.5, 1.8, 6);
  w.hint(7, -25, 13, -17, '🧊 Climb the microwave and cereal boxes to reach the fridge top!', 5);
  // upper cabinets (decor) + shelves
  PR.upperCabinets(w, -29.5, -2, -23.4, 0, 12.5, 7, 3.6); PR.upperCabinets(w, 7.5, 13, -23.4, 0, 12.5, 7, 3.6); PR.upperCabinets(w, 13.5, 19.5, -22.6, 0, 16.6, 5, 5);
  // ---- trolley to the island (moving platform)
  w.mover(10, H - 0.5, -14.6, [5, 0.5, 5], [0, 0, 8.0], 7, 0, 0xffd23f, (T, sub, sz) => { T.box('g', 0xffd23f, 0, 0, 0, sz[0], sz[1], sz[2], 0.2); T.box('g', 0xffd23f, 0, -3.2, 0, sz[0], 0.35, sz[2], 0.15);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { T.add('x', cyl(12), 0xd1d5db, a * 2.2, -H + 0.9, b * 2.2, 0, 0, 0, 0.14, H - 0.9, 0.14); T.add('m', sph(12), 0x1f2937, a * 2.2, -H + 0.45, b * 2.2, 0, 0, 0, 0.45); }); T.add('g', rcyl(0.6, 0.9, 0.15, 16), 0x4f9dff, -1.4, 0.5, -1.2); });
  w.hint(7, -18.5, 13, -14, '🛒 Hop on the rolling trolley to reach the kitchen island!', 5);
  // ---- island (boss arena) + floor stairs
  PR.cabinets(w, 6, 26, 3, 0, H, 14, 0xa7d8f0, 0xf5f5f4, { door: 0xc6e7f7 });
  PR.cardboard(w, 28.4, 0, 14.5, 0, 3, 2.4, 3); PR.cardboard(w, 28.4, 0, 9.5, 0, 3, 4.6, 3.4, true); w.crumbLine(28.4, 2.4, 14.5, 28.4, 4.6, 9.8, 3); w.heartP(28.4, 4.6, 9);
  w.cp(10, H, -2, PI / 2);
  w.bossSpec = { type: 'toast', x: 18, y: H, z: 4, yaw: -PI / 2, arena: [6.5, -3.5, 25.5, 9.5] }; w.goldPos = [16, H + 1.6, 3];
  PR.bowl(w, 8, H, 8.5, 0xfde68a, 1); PR.plant(w, 24.5, H, -2.4, 0.8);
  // ---- floor: Candy's corner, bowls, rug, trash, baby #2
  PR.rug(w, 2, -13, 0, 14, 5, 0x60a5fa, 0xdbeafe);
  w.add('f', torus(0.45, 36), 0xff6fb5, 20, 1.2, 19, PI / 2, 0, 0, 3.6, 3.6, 3.6); w.add('f', rcyl(3.4, 0.8, 0.3, 32), 0xffd1e8, 20, 0, 19); w.solid(16, 0, 15, 24, 0.6, 23, { cam: false });
  PR.dogBowl(w, 10, 20, 0xef4444); PR.dogBowl(w, 13.6, 20, 0x3b82f6, 0x7dd3fc); w.baby(4, 0, 18); w.crumbLine(-4, 0, 14, 3, 0, 18, 5); w.part(-14, 0, -4);
  w.candySpec = { x: 20, z: 19, yaw: -PI / 2, sleep: true, path: [[10, 12], [-10, 12], [-18, 14], [0, 18], [22, 12]], bounds: [-28, -15.5, 28, 23] };
  w.hint(-6, 10, 10, 24, '🐶 Shh! Candy the schnauzer is napping. Grab the baby and get off the floor!', -2, 2);
  w.add('g', rcyl(2.2, 6, 0.3, 28), 0x94a3b8, -27, 0, 21); w.solid(-29.2, 0, 18.8, -24.8, 6, 23.2); w.add('g', rcyl(2.35, 0.6, 0.2, 28), 0x64748b, -27, 6, 21);
  PR.bigPlant(w, 26.5, 22, 1); PR.clock(w, 'z', -30, -6, 15, 1); w.frameArt('z', 30, 14, 12, 5, 4, -1, 0); w.frameArt('z', 30, 4, 13, 3.5, 4.5, -1, 1);
  w.env = { sunDir: [0.25, 0.75, -0.6] };
};
export { BUILD };
