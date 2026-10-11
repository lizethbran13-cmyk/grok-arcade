// Pi-rat the Pirate Pack: the five islands of the Squeaky Sea (each: explore, puzzle, hazards, mini-boss, map piece).
// Pickups: crumbs = doubloons, cheese = treasure bags (x10), parts = gems (5 per isle), babies = treasure chests (3 per isle).
import * as THREE from 'three';
import { BUILD } from './levels.js';
import { rbox } from './world.js';
import { rcyl, lathe, sph, cyl, cone, torus, capsule, tube, wedge, blobGeo } from './shapes.js';
import { PI, C, rnd, pseed, outdoor, landPoly, blobPoly, mesa, ramp, steps, palm, bush, fern, jungleTree, shellPad, barrel, torch, pier, rowboat, crates, treasurePile, crystal, coral, starfish, shell, flag, rockWall, camZone, ceiling, ropeBridge, lava, geyser, dropZone, autoCannon, captainNPC, parrotNPC, talk, latchPlate, cannonModel } from './pkit.js';
import { ISLES } from './pirate.js';
import { inView } from './perf.js';
const inV = (x, y, z) => inView(x, y, z, 8);
import { sfx } from './audio.js';
const G = (id) => ISLES.find((i) => i.id === id);
const L = 1; // beach height
function base(w, id, env) { const I = G(id); w.pirate = true; w.forceRat = 'pirat'; w.gadgets = ['blaster', 'glider', 'grapple']; w.music = I.music; w.camDist = 7; w.isle = id; outdoor(w, env, { y: 0 }); parrotNPC(w); return I; }
const clipZ = (pts, cut, keepAbove) => pts.map(([x, z]) => [x, keepAbove ? Math.max(z, cut) : Math.min(z, cut)]);
function ell(cx, cz, rx, rz, n = 36, s = 1, wob = 0.06) { return blobPoly(cx, cz, rx, rz, n, wob, s); }
function arrival(w, z, msg) { w.start = [0, L + 0.2, z]; w.startYaw = PI; w.cp(-1.6, L + 0.2, z - 9, PI); pier(w, 0, z + 8, 0, z - 12, L + 0.2, { w: 6 });
  w.start = [0, L + 0.3, z]; captainNPC(w, 2.2, L + 0.2, z - 3, PI, { label: '🏴‍☠️ Captain Eye Patch', fn: (app, g) => { sfx('squeak'); g.toastMsg('🏴‍☠️ Captain: "' + msg + '"'); } }); rowboat(w, 5.6, 0.25, z + 2, 0.15, 0xef4444); }
function scatter(w, land, n, fn, s, avoid) { pseed(s); let k = 0; for (let i = 0; i < n * 6 && k < n; i++) { const x = land.cx + (rnd() - 0.5) * land.w, z = land.cz + (rnd() - 0.5) * land.d; if (!land.L.inside(x, z) || (avoid && avoid(x, z))) continue; fn(x, z, k++); } }
const bossEnd = (w, type, x, z, arena, y = L) => { w.bossSpec = { type, x, y, z, yaw: 0, arena }; w.goldPos = [x, y + 1.6, z + 1]; };
// ======================================================================= 1. CHEDDAR COVE
BUILD.p_cove = (w) => { base(w, 'p_cove', {});
  const pts = ell(0, -6, 54, 54, 40, 3); const land = landPoly(w, pts, L, { top: C.sand, side: C.sandW });
  arrival(w, 56, 'Welcome to Cheddar Cove! Three old levers open the treasure cave in the cliff. Find them, matey!');
  talk(w, -8, 40, 8, 52, 'par', 'Ugh. SAND. It gets in my feathers. The levers are on the rocks, the tall pillar and that little islet. Hurry up.');
  w.crumbLine(0, L, 42, 0, L, 24, 7); w.cheese(-6, L, 44); w.cheese(8, L, 10);
  // beach dressing
  [[-14, 38, 9, 0.3, 1.2], [-30, 26, 11, 0.25, 2.3], [28, 26, 10, 0.3, -1], [34, 6, 12, 0.2, -1.4], [-40, 2, 10, 0.25, 1.8], [-20, 46, 8, 0.3, 0.4], [20, 44, 9, 0.3, -0.5]].forEach(([x, z, h, l, r]) => palm(w, x, L, z, h, l, r));
  const crown = palm(w, 12, L, 32, 7, 0.22, 0.8, { top: true }); w.part(crown[0], crown[1], crown[2]); shellPad(w, 9, L, 29, 1.6, 18);
  talk(w, 5, 25, 15, 34, 'par', 'A bouncy shell. Boing to the top of that palm. I am NOT carrying you.');
  scatter(w, { cx: 0, cz: 10, w: 100, d: 70, L: land }, 26, (x, z, k) => { if (k % 3 === 0) starfish(w, x, L, z, [0xff8a3d, 0xff5e8a, 0xffd23f][k % 3]); else if (k % 3 === 1) shell(w, x, L, z, 0.45, [0xffd6e6, 0xfff7ed, 0xffc2a8][k % 3]); else bush(w, x, L, z, 1.2, 0x2f9e4a, k % 2 ? 0xff4fa0 : 0xffd23f); }, 11, (x, z) => Math.abs(x) < 7 || (z < -16 && z > -36) || Math.hypot(x + 18, z - 30) < 7 || (x > 12 && x < 36 && z < 6 && z > -14) || (x < -12 && x > -36 && z < 10 && z > -12));
  // sandcastle (climbable, chest on the keep)
  { const x = -18, z = 30; w.slab('f', 0xf1cf8f, x, L, z, 7, 2.6, 7, 0.4); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { w.add('f', rcyl(1.1, 4.6, 0.3, 18), 0xf3d9a4, x + a * 3.3, L, z + b * 3.3); w.solid(x + a * 3.3 - 1.1, L, z + b * 3.3 - 1.1, x + a * 3.3 + 1.1, L + 4.6, z + b * 3.3 + 1.1); for (let q = 0; q < 4; q++) w.add('f', rbox(0.5, 0.5, 0.5, 0.12), 0xe9c27c, x + a * 3.3 + Math.cos(q * 1.57) * 0.8, L + 4.85, z + b * 3.3 + Math.sin(q * 1.57) * 0.8); });
    w.slab('f', 0xf6deac, x, L + 2.6, z, 3.4, 3.2, 3.4, 0.3); for (let i = 0; i < 4; i++) w.add('f', rbox(0.7, 0.6, 0.7, 0.15), 0xf1cf8f, x - 1.2 + (i % 2) * 2.4, L + 6.1, z - 1.2 + (i >> 1) * 2.4); flag(w, x, L + 5.8, z, 2.4, 0xdc2626);
    w.baby(x, L + 5.8, z + 0.9); w.slab('f', 0xf1cf8f, x + 4.6, L, z + 1, 2, 1.3, 2, 0.3); w.crumbRing(x, L + 2.7, z, 2.6, 6); }
  // crabs
  w.enemy('crab', -6, L, 30, { axis: 'x', range: 4 }); w.enemy('crab', 16, L, 18, { axis: 'z', range: 4 }); w.enemy('crab', 0, L, 6, { axis: 'x', range: 6 });
  // west rocks: ramp up, lever 1, gem + chest behind rocks
  mesa(w, -25, -1, 20, 18, 5.5, C.rock, C.grass, L); ramp(w, -24, 12, 4, 8, L, 5.5, 'z', -1, C.sandW); w.lever('l1', -30, 5.5, -5, 0.3);
  w.part(-17, 5.5, -7); w.baby(-33, 5.5, 5); bush(w, -31, 5.5, 2, 1.2, 0x2f9e4a, 0xffd23f); palm(w, -20, 5.5, 4, 8, 0.2, 2); w.enemy('crab', -25, 5.5, -3, { axis: 'x', range: 4 }); w.crumbLine(-24, 5.5, 6, -24, 5.5, -6, 5);
  talk(w, -30, -10, -20, 0, 'par', 'Pull the lever. Yes, THAT one. Do I have to do everything?');
  // east: low rocks then a tall pillar (grapple hooks)
  mesa(w, 24, -4, 18, 14, 3.5, C.rock, C.grass, L); steps(w, 24, 6, 4, 2, 1.2, 1.2, 'z', -1, C.rock, L); mesa(w, 24, -6, 6, 6, 11, 0x9a8f86, C.grass, 3.5);
  w.hook(19.5, 9.5, -2); w.hook(28.8, 13, -7.5); w.lever('l2', 24, 11, -6, 0); w.part(25.8, 11, -7.8); w.cheese(30, 3.5, 0);
  talk(w, 15, -11, 33, 3, 'par', 'Grapple the hooks to climb the pillar. Try not to fall. Or do. I\u2019d laugh.');
  // south-east islet across stepping stones: lever 3 + gem
  const isl = landPoly(w, ell(60, 37, 8, 7.5, 20, 7), L, { top: C.sand, side: C.sandW }); for (let i = 0; i < 4; i++) { const x = 37.5 + i * 3.6, z = 36 + Math.sin(i) * 1.2; w.add('m', blobGeo(i + 3, 0.2, 2), C.rock, x, 0.4, z, 0, i, 0, 1.6, 1.1, 1.5); w.solid(x - 1.3, -1, z - 1.3, x + 1.3, L + 0.25, z + 1.3, { floor: true }); }
  w.lever('l3', 61, L, 37, -0.5); w.part(63, L, 33.5); rowboat(w, 57, 0.2, 43.5, 1.2); palm(w, 59, L, 40, 9, 0.3, 2.2); treasurePile(w, 64, L, 38, 0.5);
  talk(w, 32, 28, 70, 46, 'par', 'Hop the rocks. The sea is wet. Very wet. Don\u2019t.');
  // north cliff with the treasure cave
  const CL = L + 11; rockWall(w, -58, -36, -4, -20, L, 11, 0x9a8f86); rockWall(w, 4, -36, 58, -29, L, 11, 0x9a8f86); rockWall(w, 9, -29, 58, -24, L, 11, 0x9a8f86); rockWall(w, 4, -24, 58, -20, L, 11, 0x9a8f86);
  w.add('m', rbox(18, 5, 16, 1.2), 0x8d8178, 0, L + 8.5, -27.5); w.solid(-4, L + 6, -36, 9, CL, -20, { camBlock: true });
  ceiling(w, -4, -36, 9, -20, L + 6, 0.4, 0x6b5f57); camZone(w, -4, -36, 9, -20, L - 1, L + 6, 4.6, 0.45);
  w.door('cave', 0, L, -20.6, 8, 6, 1, ['l1', 'l2', 'l3'], 0x7c4a22, '🗝️ Clunk-clunk-CLUNK! The treasure cave is open!'); w.cp(0, L, -14, PI); w.crumbLine(0, L, -16, 0, L, -33, 6);
  talk(w, -6, -19, 6, -10, 'par', 'A gate with three locks. Pull all THREE levers. That\u2019s one, two, three. Squawk.');
  for (let i = 0; i < 5; i++) { crystal(w, -3.2, L, -22 - i * 3, 0.6, [0x3ff0ff, 0xff4fd8, 0xffd23f][i % 3], i % 2 === 0); crystal(w, 3.4, L, -21.5 - i * 3, 0.5, [0xa78bfa, 0x3ff0ff, 0x4ade80][i % 3], false); }
  w.baby(6.8, L, -26.5); treasurePile(w, 7, L, -28, 0.6); w.part(6.6, L + 3, -25); crates(w, 2.2, L, -32, 0.4, 2); w.add('g', sph(14), 0xfff7ed, 6.5, L + 0.2, -24.6, 0, 0, 0, 0.3, 0.25, 0.3);
  // arena on the north beach
  rockWall(w, -26, -66, -22, -36, L, 9, 0x9a8f86); rockWall(w, 22, -66, 26, -36, L, 9, 0x9a8f86); rockWall(w, -26, -70, 26, -66, L, 9, 0x9a8f86);
  w.slab('m', C.sand, 0, L - 2, -54, 44, 2, 28, 0.2); w.solid(-22, L - 2, -66, 22, L, -36, { floor: true });
  for (let i = 0; i < 4; i++) torch(w, -18 + i * 12, L, -63); [[-16, -40], [16, -40]].forEach(([x, z]) => palm(w, x, L, z, 9, 0.2, x > 0 ? -1 : 1)); w.cp(0, L, -38, PI); w.heartP(-12, L, -46); w.heartP(12, L, -46);
  talk(w, -20, -40, 20, -36, 'par', 'That\u2019s Sir Pinchington. Big crab. Big claws. Big ego. Jump on his shell when he gets dizzy!');
  bossEnd(w, 'pinchy', 0, -54, [-20, -64, 20, -38]);
  w.heartP(0, L, 20); w.crate(-4, L, 18); w.crate(5, L, 16); w.crate(-10, L, -10); barrel(w, -6, L, 50, 0.9); barrel(w, 6.5, L, 47, 0.8, 0.4, 0x8b5a2b);
  w.title = '🏖️ Cheddar Cove';
};
// ======================================================================= 2. COCONUT JUNGLE
BUILD.p_jungle = (w) => { base(w, 'p_jungle', { fog: 0xcdeccf, fogD: 0.0032, hemiGround: 0x3f9e3a, sunI: 2.6 });
  const all = ell(0, -8, 62, 72, 44, 5); const S = landPoly(w, clipZ(all, 4, true), L, { top: C.grass, side: C.sandW }); const N = landPoly(w, clipZ(all, -6, false), L, { top: C.grass, side: 0x8d7a5e });
  // the land top is jungle green; a sandy path runs north
  w.add('m', rbox(6, 0.1, 50, 0.05), 0xd8b679, 0, L + 0.03, 34); w.add('m', rbox(6, 0.1, 40, 0.05), 0xd8b679, 6, L + 0.03, -26);
  arrival(w, 64, 'Coconut Jungle! The drum temple is past the river. Watch out for falling coconuts!');
  talk(w, -8, 50, 8, 60, 'par', 'Jungle. Bugs. Humidity. My beak is FRIZZY. The temple is north, over the river.');
  const avoid = (x, z) => Math.abs(x - 2) < 6 || (z > -12 && z < 8) || (z < -24 && Math.abs(x) < 20);
  scatter(w, { cx: 0, cz: 30, w: 120, d: 56, L: S }, 16, (x, z, k) => jungleTree(w, x, L, z, 15 + (k % 4) * 3, 1.3 + (k % 3) * 0.3), 21, avoid);
  scatter(w, { cx: 0, cz: 30, w: 120, d: 56, L: S }, 30, (x, z, k) => (k % 2 ? fern(w, x, L, z, 1.1 + (k % 3) * 0.3) : bush(w, x, L, z, 1.4, 0x2f9e4a, [0xff4fa0, 0xffd23f, 0xa78bfa][k % 3])), 22, (x, z) => Math.abs(x) < 5);
  scatter(w, { cx: 0, cz: -40, w: 120, d: 60, L: N }, 14, (x, z, k) => jungleTree(w, x, L, z, 16 + (k % 4) * 3, 1.4), 23, avoid);
  scatter(w, { cx: 0, cz: -40, w: 120, d: 60, L: N }, 24, (x, z, k) => (k % 2 ? fern(w, x, L, z, 1.2) : bush(w, x, L, z, 1.3, 0x237a3b, 0xff6f91)), 24, (x, z) => Math.abs(x - 6) < 5 || (z < -24 && Math.abs(x) < 20));
  // coconut grove: palms + falling coconuts
  [[-8, 30], [9, 28], [-10, 18], [10, 16], [-6, 40], [8, 40]].forEach(([x, z], i) => palm(w, x, L, z, 11 + i % 3, 0.15, i));
  dropZone(w, -10, 12, 12, 34, 1.3, 0x8b5a2b, 14); talk(w, -10, 30, 12, 36, 'par', 'COCONUTS! Duck! Well, rats can\u2019t duck. Run!');
  w.crumbLine(2, L, 48, 2, L, 10, 9); w.enemy('gull', -4, L + 3, 24, { range: 6 }); w.enemy('crab', 4, L, 44, { axis: 'x', range: 4 }); w.cheese(-16, L, 46); w.heartP(14, L, 40);
  // treetop route (west): hooks + platforms in the canopy, gem + chest
  [[-28, 6, 34], [-34, 10, 24], [-28, 14, 14]].forEach(([x, y, z], i) => { w.add('m', rcyl(2.2, 0.5, 0.15, 20), C.woodL, x, L + y, z); w.solid(x - 2.1, L + y, z - 2.1, x + 2.1, L + y + 0.5, z + 2.1); w.add('m', cyl(12), 0x6b4423, x, L, z, 0, 0, 0, 0.7, y, 0.7); w.solid(x - 0.7, L, z - 0.7, x + 0.7, L + y, z + 0.7); w.add('g', blobGeo(i + 4, 0.2, 2), 0x2f9e4a, x, L + y + 6, z, 0, i, 0, 4.5, 3, 4.5); w.hook(x + 1.6, L + y + 3.2, z + 1.6); });
  w.part(-28, L + 14.5, 14); w.baby(-34, L + 10.5, 24); w.part(-28, L + 6.5, 34); w.crumbArc(-28, L + 7, 34, -34, L + 11, 24, 2, 5); talk(w, -36, 30, -22, 42, 'par', 'Treetop huts. Grapple up. I\u2019ll just... fly. Like a normal bird.');
  // the river gorge + rope bridge, and a broken bridge to the east (glide it)
  w.add('m', rbox(130, 0.6, 10, 0.2), 0x2b7a8c, 0, -0.9, -1); ropeBridge(w, -18, 4.4, -18, -6.4, L + 0.15, 2.6, 0.6); w.cp(-18, L, 7, PI);
  rockWall(w, 24, 2, 30, 6, L, 3, C.rock, { lumps: false }); rockWall(w, 24, -10, 30, -6, L, 3, C.rock, { lumps: false }); w.part(27, L + 3, -8); w.cheese(27, L + 3, 4); barrel(w, 27, L, 8, 1);
  talk(w, 18, 4, 34, 12, 'par', 'Broken bridge. Jump off the rock and GLIDE. Hold jump in the air. Flap flap.');
  for (let i = 0; i < 8; i++) w.add('m', blobGeo(i + 7, 0.25, 2), 0x6f7d6a, -60 + i * 16, 0.2, -1 + (i % 2 ? 4 : -4), 0, i, 0, 2.2, 1.6, 2); talk(w, -30, -6, 30, 4, 'par', 'Don\u2019t fall in the river. Piranhas. Probably.', -4, 3);
  // north: waterfall cave (west), temple (centre), boss courtyard behind the temple
  { const cc = 0x7d7a68; const blk = (x0, z0, x1, z1, y0, y1, o) => { w.add('m', rbox(x1 - x0, y1 - y0, z1 - z0, 0.8, 2), cc, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); w.solid(x0, y0, z0, x1, y1, z1, o); };
    blk(-50, -40, -36, -31, L, L + 14); blk(-50, -23, -36, -14, L, L + 14); blk(-50, -31, -48, -23, L, L + 14); blk(-48, -31, -36, -23, L + 5.5, L + 14, { camBlock: true });
    pseed(5); for (let i = 0; i < 8; i++) w.add('m', blobGeo(i + 60, 0.28, 2), i % 2 ? cc : 0x6b6a5a, -36 + (rnd() - 0.2) * 2, L + 2 + rnd() * 11, -40 + (i < 4 ? i * 2.2 : 17 + (i - 4) * 2.2), 0, i, 0, 1.6, 2.2, 1.6);
    w.add('e', rbox(0.4, 13, 7, 0.2), 0xbff4ff, -35.6, L + 6.5, -27); w.add('l', rbox(2, 0.4, 9, 0.2), 0xe0f7ff, -34.5, L + 0.1, -27, 0, 0, 0, 1, 1, 1, 0.3);
    w.zone('hint', -35, L, -32, -30, L + 6, -22, { msg: '🦜 Grumbles: Something sparkles BEHIND the waterfall. Walk right through it!' });
    camZone(w, -48, -31, -36, -23, L - 1, L + 5.5, 4, 0.4); crystal(w, -46, L, -29, 0.7, 0xa78bfa); crystal(w, -46.5, L, -24.5, 0.5, 0x3ff0ff, false); w.baby(-44.5, L, -26); w.part(-43, L, -29.5); treasurePile(w, -46, L, -27, 0.5);
    w.anims.push(() => { if (w.game && Math.random() < 0.5 && inV(-35.6, L + 6, -27)) w.game.fx.emit(-35.4, L + 12, -30 + Math.random() * 6, 0.4, -3, 0, 0.3, 0xe0f7ff, 1.2, 1, 0); }); }
  // drum temple (hollow, enter from the south)
  const TZ = -42, TY = L; const tw = 0x9ca39a, td = 0x7d857c;
  w.slab('m', tw, -9, TY, TZ, 4, 8, 22, 0.3); w.slab('m', tw, 9, TY, TZ, 4, 8, 22, 0.3); w.slab('m', tw, -6.5, TY, TZ + 10, 5, 8, 2, 0.3); w.slab('m', tw, 6.5, TY, TZ + 10, 5, 8, 2, 0.3); w.slab('m', tw, 0, TY + 5, TZ + 10, 8, 3, 2, 0.3);
  w.slab('m', tw, -6.5, TY, TZ - 10, 5, 8, 2, 0.3); w.slab('m', tw, 6.5, TY, TZ - 10, 5, 8, 2, 0.3); w.slab('m', tw, 0, TY + 5, TZ - 10, 8, 3, 2, 0.3);
  ceiling(w, -11, TZ - 11, 11, TZ + 11, TY + 8, 1, td); w.slab('m', td, 0, TY + 9, TZ, 16, 2, 16, 0.4); w.slab('m', tw, 0, TY + 11, TZ, 9, 2.5, 9, 0.4); w.add('g', sph(20), 0xffd23f, 0, TY + 14.5, TZ, 0, 0, 0, 1.5, 1.2, 1.5);
  steps(w, -14, TZ + 16, 6, 6, 1.5, 1.6, 'z', -1, td, TY); // stairs up the west side to the roof
  w.slab('m', tw, 0, TY + 9, TZ - 10.6, 22, 4, 0.8, 0.2); w.slab('m', tw, 10.6, TY + 9, TZ, 0.8, 4, 22, 0.2); w.slab('m', tw, -10.6, TY + 9, TZ - 3, 0.8, 4, 16, 0.2); w.slab('m', tw, 0, TY + 9, TZ + 10.6, 22, 0.8, 0.8, 0.2);
  camZone(w, -7, TZ - 9, 7, TZ + 9, TY - 1, TY + 8, 4.8, 0.45);
  for (let i = 0; i < 4; i++) { torch(w, -6 + (i % 2) * 12, TY, TZ - 6 + (i >> 1) * 12, 2.6); }
  w.part(0, TY + 13.5, TZ + 3); talk(w, -8, TZ + 12, 8, TZ + 24, 'par', 'The temple roof (stairs on the left side) has a gem. The drums are inside. Bang them in the order on the wall!');
  // the wall glyphs show the order: red, blue, yellow
  const drumC = [0xef4444, 0x3b82f6, 0xffd23f], order = [0, 1, 2], seq = []; [0, 1, 2].forEach((k) => { w.add('l', rbox(1.4, 1.4, 0.2, 0.2), drumC[order[k]], -2.5 + k * 2.5, TY + 4.6, TZ - 8.9, 0, 0, 0, 1, 1, 1, 0.8); });
  [[-4.5, TZ - 2], [0, TZ - 5], [4.5, TZ - 2]].forEach(([x, z], k) => { const T = w.tf(x, TY, z, 0); T.add('m', lathe([[0, 0], [0.9, 0], [1.0, 0.6], [0.9, 1.3], [0, 1.3]], 22), 0x8b5a2b, 0, 0, 0); T.add('f', rcyl(0.95, 0.1, 0.04, 22), 0xfff3d6, 0, 1.3, 0); T.add('x', torus(0.08, 24), drumC[k], 0, 1.0, 0, PI / 2, 0, 0, 0.98, 0.98, 1); T.solid(-0.9, 0, -0.9, 0.9, 1.3, 0.9);
    w.kiosks.push({ id: 'drum' + k, x, y: TY, z, r: 2.2, label: '🥁 Bang the drum', fn: (app, g) => { if (w._drumsDone) return; sfx('squeak'); g.fx.burst(x, TY + 1.6, z, drumC[k], 10); seq.push(k); const i = seq.length - 1;
      if (seq[i] !== order[i]) { seq.length = 0; sfx('deny'); g.toastMsg('🥁 BONG... wrong drum! Look at the wall: red, blue, yellow'); return; }
      if (seq.length === 3) { w._drumsDone = true; g.setDoor('tdoor', true); sfx('check'); g.toastMsg('🥁 BOOM BOOM BOOM! The back door rumbles open!'); } else g.toastMsg('🥁 BOOM! (' + seq.length + '/3)'); } }); });
  (w.kiosks = w.kiosks || []);
  w.door('tdoor', 0, TY, TZ - 10, 3.2, 5, 1.6, ['never'], 0xb45309, '🥁 The temple\u2019s back door grinds open!');
  w.baby(-6.5, TY, TZ + 6); w.cheese(6.5, TY, TZ + 6); w.cp(0, TY, TZ + 14, PI); w.enemy('crab', 6, L, -18, { axis: 'x', range: 5 }); w.enemy('gull', -6, L + 3, -16, { range: 6 });
  // courtyard arena behind the temple
  const AZ = TZ - 22; rockWall(w, -24, AZ - 12, -20, TZ - 11, L, 10, 0x7d857c); rockWall(w, 20, AZ - 12, 24, TZ - 11, L, 10, 0x7d857c); rockWall(w, -24, AZ - 16, 24, AZ - 12, L, 10, 0x7d857c);
  rockWall(w, -20, TZ - 13, -11, TZ - 11, L, 14, 0x7d857c, { lumps: false }); rockWall(w, 11, TZ - 13, 20, TZ - 11, L, 14, 0x7d857c, { lumps: false });
  w.slab('m', 0x5cbf4a, 0, L - 2, AZ, 40, 2, 26, 0.2); w.solid(-20, L - 2, AZ - 12, 20, L, TZ - 11, { floor: true }); w.cp(0, L, TZ - 13, PI); w.heartP(-14, L, AZ + 4); w.heartP(14, L, AZ + 4);
  [[-16, AZ - 8], [16, AZ - 8], [-16, AZ + 6], [16, AZ + 6]].forEach(([x, z], i) => palm(w, x, L, z, 10, 0.12, i));
  talk(w, -10, TZ - 16, 10, TZ - 12, 'par', 'COCO LOCO! A giant coconut with an attitude. Bop him when he lands!');
  bossEnd(w, 'coco', 0, AZ - 2, [-18, AZ - 11, 18, TZ - 13]);
  w.title = '🌴 Coconut Jungle';
};
// ======================================================================= 3. MOUNT MAGMA
BUILD.p_volcano = (w) => { base(w, 'p_volcano', { skyTop: 0x5a3a6a, skyMid: 0xf59e6b, skyBot: 0xffd2a8, fog: 0xe8b08a, fogD: 0.0035, sunColor: 0xffc49a, sunI: 2.6, hemiSky: 0xffc9a8, hemiGround: 0x5a3a3a, bloomT: 0.95, bloomS: 0.6 });
  const pts = ell(0, -10, 58, 70, 40, 9); const land = landPoly(w, pts, L, { top: 0x4a4040, side: 0x3a3436 });
  arrival(w, 62, 'Mount Magma! Hot hot HOT. Press the three cooling valves to open the crater gate!');
  talk(w, -8, 50, 8, 60, 'par', 'Lava. Of course there\u2019s lava. My tail feathers are already toasty.');
  scatter(w, { cx: 0, cz: 0, w: 110, d: 120, L: land }, 24, (x, z, k) => { w.add('m', blobGeo(k & 31, 0.3, 2), k % 2 ? C.basalt : 0x5b4f4f, x, L, z, 0, k, 0, 1.4 + (k % 3), 1 + (k % 4) * 0.6, 1.3 + (k % 2)); w.solid(x - 1.2, L, z - 1.2, x + 1.2, L + 1, z + 1.2); if (k % 4 === 0) crystal(w, x + 1.5, L, z, 0.5, 0xff7a1a, false); }, 31, (x, z) => Math.abs(x) < 9 || (z < 30 && z > 14) || (z < -6 && z > -16) || z < -40 || Math.hypot(x + 28, z - 2) < 14 || Math.hypot(x - 28, z - 2) < 14);
  w.crumbLine(0, L, 48, 0, L, 34, 5); w.cheese(10, L, 40); w.heartP(-8, L, 36);
  // basalt spires, glowing cracks, charred trees and steam vents for a dense volcanic look
  scatter(w, { cx: 0, cz: 0, w: 110, d: 120, L: land }, 36, (x, z, k) => { const h = 3 + (k % 5) * 1.6; w.add('m', cone(7), k % 2 ? 0x3a3436 : 0x524646, x, L, z, 0, k, 0, 1.1 + (k % 3) * 0.4, h, 1.1 + (k % 2) * 0.4); w.solid(x - 0.8, L, z - 0.8, x + 0.8, L + h * 0.8, z + 0.8);
    if (k % 3 === 0) { w.add('l', tube([[x - 1.5, L + 0.03, z], [x, L + 0.03, z + 0.8], [x + 1.6, L + 0.03, z - 0.4]], 0.12, 10, 4), 0xff7a1a, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1); }
    if (k % 4 === 1) { w.add('m', cyl(8), 0x2b2222, x + 1.6, L, z + 1, 0.15, 0, 0.1, 0.25, 5, 0.25); w.add('m', cyl(6), 0x2b2222, x + 1.6, L + 3.4, z + 1, 0, 0, 0.9, 0.12, 1.8, 0.12); } }, 33, (x, z) => Math.abs(x) < 10 || (z < 30 && z > 13) || (z < -4 && z > -18) || z < -40 || Math.hypot(x + 28, z - 2) < 15 || Math.hypot(x - 28, z - 2) < 15 || Math.hypot(x - 30, z + 30) < 12 || Math.hypot(x + 30, z + 30) < 12 || (x > 12 && z < 14 && z > -6));
  [[-40, 38], [38, 34], [-44, -26], [42, -30]].forEach(([x, z]) => { w.add('m', torus(0.4, 20), C.basalt, x, L + 0.2, z, PI / 2, 0, 0, 1.4, 1.4, 1.2); w.anims.push(() => { if (w.game && Math.random() < 0.35 && inV(x, L + 2, z)) w.game.fx.emit(x + (Math.random() - 0.5), L + 0.5, z + (Math.random() - 0.5), (Math.random() - 0.5), 4 + Math.random() * 3, (Math.random() - 0.5), 0.5, 0xe5e7eb, 1.6, -0.6, 0.1); }); });
  // lava river 1: stepping stones
  lava(w, -47, 16, 47, 28, L); for (let i = 0; i < 4; i++) { const x = -2 + (i % 2) * 4, z = 26 - i * 3.2; w.add('m', blobGeo(i + 11, 0.2, 2), C.basalt, x, L, z, 0, i, 0, 1.6, 1, 1.5); w.solid(x - 1.2, L - 1, z - 1.2, x + 1.2, L + 0.6, z + 1.2, { floor: true }); }
  w.crumbArc(-2, L + 1, 26, 2, L + 1, 16, 2, 4); w.cp(0, L, 31, PI); talk(w, -10, 28, 10, 34, 'par', 'Hop the stones. Floor is lava. Literally. This isn\u2019t a game. Well, it IS a game.');
  // valve 1 (west), on a geyser-lifted ledge
  mesa(w, -28, 2, 14, 12, 9, C.basalt, 0x6b4f4f, L); geyser(w, -18, L, 10, 1.4, 12, 36); w.part(-18, L + 9, 10); latchPlate(w, 'v1', -28, 9, 2, 1.4, 0x3ff0ff); w.part(-32, 9, -2); talk(w, -24, 6, -12, 14, 'par', 'Stand on the steam geyser and up you go. Wheee. I mean... boring.');
  // valve 2 (east), across moving platforms over a lava pool
  lava(w, 14, -4, 40, 12, L); w.mover(16.5, L - 0.2, 4, [3, 0.6, 3], [20, 0, 0], 6, 0, 0x5b4f4f); w.mover(22, L - 0.2, -1, [3, 0.6, 3], [0, 0, 9], 4.5, 0.5, 0x5b4f4f);
  mesa(w, 44, 2, 8, 10, 3, C.basalt, 0x6b4f4f, L); latchPlate(w, 'v2', 44, 3, 2, 1.4, 0x3ff0ff); w.part(44, 3, 6); w.baby(46, 3, -1.5); w.cheese(42, 3, 5); talk(w, 8, 0, 16, 10, 'par', 'Ride the rocks. Don\u2019t touch the orange stuff. Orange is BAD.');
  // lava river 2 with a forge on the far side (enterable), valve 3 inside
  lava(w, -52, -16, 52, -6, L); ropeBridge(w, 0, -5.6, 0, -16.4, L + 0.6, 2.6, 0.3); w.cp(0, L, -2, PI);
  const FZ = -28; w.slab('m', 0x5b4f4f, -8, L, FZ, 2, 7, 16, 0.2); w.slab('m', 0x5b4f4f, 8, L, FZ, 2, 7, 16, 0.2); w.slab('m', 0x5b4f4f, 0, L, FZ - 8, 18, 7, 2, 0.2); w.slab('m', 0x5b4f4f, -5, L, FZ + 8, 4, 7, 2, 0.2); w.slab('m', 0x5b4f4f, 5, L, FZ + 8, 4, 7, 2, 0.2); w.slab('m', 0x5b4f4f, 0, L + 4.5, FZ + 8, 6, 2.5, 2, 0.2);
  ceiling(w, -9, FZ - 9, 9, FZ + 9, L + 7, 0.8, 0x3a3436); w.add('m', lathe([[0, 0], [1.6, 0], [1.2, 6], [0, 6]], 16), 0x3a3436, 5, L + 7.8, FZ - 4); camZone(w, -7, FZ - 7, 7, FZ + 7, L - 1, L + 7, 4.4, 0.45);
  w.add('x', rbox(2.4, 1.0, 1.0, 0.2), 0x4b4b52, -3, L + 1.4, FZ - 2); w.add('x', rbox(1.0, 1.0, 0.8, 0.1), 0x4b4b52, -3, L + 0.5, FZ - 2); w.solid(-4.2, L, FZ - 2.5, -1.8, L + 1.9, FZ - 1.5);
  lava(w, 2, FZ - 7, 7, FZ - 4, L + 0.6); w.slab('m', C.basalt, 4.5, L, FZ - 5.5, 6, 0.6, 4, 0.1, { cam: false });
  latchPlate(w, 'v3', -3, L, FZ + 3, 1.3, 0x3ff0ff); w.baby(-5.5, L, FZ - 5.5); w.part(5, L + 0.1, FZ + 4); for (let i = 0; i < 3; i++) torch(w, -6.5, L, FZ - 6 + i * 6, 2.4); w.lights.push({ x: 4.5, y: L + 3, z: FZ - 5.5, c: 0xff6a1a, i: 40, d: 16 });
  talk(w, -6, FZ + 9, 6, FZ + 14, 'par', 'The old forge. The last valve is inside. It\u2019s hot in there. Like, REALLY hot.');
  w.enemy('crab', -16, L, -24, { axis: 'z', range: 5 }); w.enemy('gull', 14, L + 3, -26, { range: 6 }); w.enemy('crab', 16, L, 40, { axis: 'x', range: 4 });
  dropZone(w, -40, -46, 40, -18, 2.2, 0xff6a1a, 15);
  // the west lava tube (gem + chest), reached by a geyser
  mesa(w, -30, -30, 10, 12, 7, C.basalt, 0x6b4f4f, L); geyser(w, -22, L, -22, 1.3, 10, 34); w.baby(-32, 7, -33); w.part(-27, 7, -34);
  // crater gate + arena
  rockWall(w, -52, -46, -6, -42, L, 12, C.basalt); rockWall(w, 6, -46, 52, -42, L, 12, C.basalt); w.door('gate', 0, L, -44, 12, 8, 4, ['v1', 'v2', 'v3'], 0x4b4b52, '❄️ Pssshhh! The valves cooled the crater gate. It\u2019s open!'); w.cp(0, L, -38, PI);
  talk(w, -8, -40, 8, -34, 'par', 'Three valves pressed? Then the gate opens. If not, go press them. I\u2019ll wait. Grumpily.');
  rockWall(w, -26, -78, -22, -46, L, 12, C.basalt); rockWall(w, 22, -78, 26, -46, L, 12, C.basalt); rockWall(w, -26, -82, 26, -78, L, 12, C.basalt);
  w.slab('m', 0x4a4040, 0, L - 2, -62, 44, 2, 32, 0.2); w.solid(-22, L - 2, -78, 22, L, -46, { floor: true }); lava(w, -21, -77, 21, -74, L + 0.1);
  for (let i = 0; i < 4; i++) torch(w, -18 + i * 12, L, -72, 3, 0xff7a1a); w.heartP(-14, L, -52); w.heartP(14, L, -52); w.cp(0, L, -48, PI);
  talk(w, -18, -52, 18, -47, 'par', 'Sizzle the Salamander! He shoots fire rings. JUMP over them. I\u2019ll be over here. Far away.');
  bossEnd(w, 'sizzle', 0, -62, [-20, -72, 20, -48]);
  // the volcano itself, smoking behind the crater
  w.add('m', lathe([[0, 0], [62, 0], [44, 18], [26, 44], [16, 58], [12, 56], [0, 56]], 48, 'mmagma'), 0x4a3f3f, 0, -2, -150); w.add('l', rcyl(12.5, 1.2, 0.3, 32), 0xff6a1a, 0, 53.5, -150, 0, 0, 0, 1, 1, 1, 1.3);
  for (let i = 0; i < 5; i++) { const a = i * 1.26 + 0.3; w.add('l', tube([[Math.cos(a) * 13, 54, -150 + Math.sin(a) * 13], [Math.cos(a) * 28, 38, -150 + Math.sin(a) * 28], [Math.cos(a) * 48, 10, -150 + Math.sin(a) * 48]], 1.6, 24, 6), 0xff5a1a, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0.9); }
  w.lights.push({ x: 0, y: 62, z: -150, c: 0xff6a1a, i: 80, d: 140 });
  w.anims.push(() => { if (w.game && Math.random() < 0.6 && inView(0, 60, -150, 30)) w.game.fx.emit((Math.random() - 0.5) * 16, 56, -150 + (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 2, 6 + Math.random() * 4, (Math.random() - 0.5) * 2, 2.6, Math.random() < 0.3 ? 0xff9a4a : 0x6b6070, 4, -0.3, 0.2); });
  w.title = '🌋 Mount Magma';
};
// ======================================================================= 4. TORTUGA LAGOON
BUILD.p_lagoon = (w) => { base(w, 'p_lagoon', { skyTop: 0x1d8fe8, fog: 0xc8f1f7, fogD: 0.0024 }, {});
  const outer = ell(0, -6, 62, 64, 44, 13), hole = ell(0, -12, 30, 28, 30, 14, 0.04); const ring = landPoly(w, outer, L, { top: 0xf6e0b0, side: C.sandW, holes: [hole] });
  w.add('e', rcyl(31, 0.2, 0.1, 40), 0x5eead4, 0, -0.15, -12, 0, 0, 0, 1, 1, 0.94);
  arrival(w, 64, 'Tortuga Lagoon! Torty lives here. She knows the reef. Ask her for help, matey!');
  talk(w, -8, 50, 8, 60, 'par', 'A lagoon. Turtles. Sunburn. Torty is up the beach. She\u2019s slow. Very slow.');
  scatter(w, { cx: 0, cz: -6, w: 124, d: 128, L: ring }, 40, (x, z, k) => { if (k % 4 === 0) palm(w, x, L, z, 9 + (k % 3) * 2, 0.3, k); else if (k % 4 === 1) starfish(w, x, L, z, [0xff8a3d, 0xff5e8a, 0xa78bfa][k % 3]); else if (k % 4 === 2) shell(w, x, L, z, 0.5); else bush(w, x, L, z, 1.2, 0x2f9e4a, 0xff4fa0); }, 41, (x, z) => (Math.abs(x) < 6 && z > 30) || Math.hypot(x - 22, z - 30) < 10 || Math.hypot(x + 44, z + 10) < 14 || Math.hypot(x - 30, z + 34) < 12);
  w.crumbLine(0, L, 46, 0, L, 34, 5); w.cheese(-20, L, 34);
  // Torty walks to the heavy shell plate that opens the shipwreck hatch
  w.martinaSpec = { x: 16, y: L, z: 34, yaw: -0.8, path: [[20, 32], [24, 30]], name: 'Torty', name2: 'Martina', label: '🐢 Ask Torty for help', say: 'Hi Pi-rat!' };
  w.plate('tplate', 24, L, 30, 1.6, 0x4ade80); talk(w, 10, 28, 30, 40, 'tor', '"The wreck hatch needs something HEAVY on the shell plate. Like me! Ask Martina... I mean me, Torty!"');
  // shipwreck (enterable) on the west beach: tilted hull, hatch door, chest + gem inside
  { const x = -44, z = -10; const T = w.tf(x, L, z, 0.5); T.add('m', cone(18), 0x6b4423, 0, 2, -9.3, -PI / 2, 0, 0, 3.9, 4, 2.2); T.add('x', rbox(7.9, 0.3, 0.3, 0.1), 0xffc83d, 0, 3.3, -9.35); T.add('x', rbox(0.3, 0.3, 18.4, 0.1), 0xffc83d, 3.95, 3.3, 0); T.add('x', rbox(0.3, 0.3, 18.4, 0.1), 0xffc83d, -3.95, 3.3, 0); T.slab('m', 0x6b4423, -3.6, 0, 0, 0.6, 4, 18, 0.1); T.slab('m', 0x6b4423, 3.6, 0, 0, 0.6, 4, 18, 0.1);
    T.slab('m', 0x5b3a1f, 0, 0, -9, 7.6, 4, 0.6, 0.1); T.slab('m', 0x5b3a1f, -2.6, 0, 9, 2.4, 4, 0.6, 0.1); T.slab('m', 0x5b3a1f, 2.6, 0, 9, 2.4, 4, 0.6, 0.1); T.box('m', 0x7c4a22, 0, 4, 0, 7.8, 0.4, 18.6, 0.1); T.solid(-3.9, 4, -9.3, 3.9, 4.4, 9.3, { camBlock: true });
    T.add('m', cyl(12), 0x5b3a1f, 0, 4.4, 2, 0.5, 0, 0.3, 0.45, 9, 0.45); T.add('s', rbox(5, 4, 0.1, 0.05), 0xd6c7a8, 0.6, 9, 3.6, 0.5, 0, 0.3); for (let i = 0; i < 4; i++) T.add('l', sph(10), 0x22d3ee, -3.3, 2.2, -6 + i * 4, 0, 0, 0, 0.3, 0.3, 0.1, 0.6);
    T.add('g', sph(14), 0xfff7ed, 0, 0.3, -7, 0, 0, 0, 0.5, 0.4, 0.5); T.add('m', rbox(1.4, 1.0, 1.0, 0.1), 0x8b5a2b, 2, 0, -4); }
  { const c = Math.cos(0.5), s = Math.sin(0.5); const P_ = (lx, lz) => [-44 + lx * c + lz * s, -10 - lx * s + lz * c]; const d = P_(0, 9.3); w.door('hatch', d[0], L, d[1], 2.8, 3.6, 0.8, ['tplate'], 0x7c4a22, '🐢 Torty sat on the plate. The shipwreck hatch pops open!');
    const ch = P_(0, -5); w.baby(ch[0], L, ch[1]); const gm = P_(2, 2); w.part(gm[0], L, gm[1]); const tr = P_(-1.5, -7); treasurePile(w, tr[0], L, tr[1], 0.5); const cz = P_(0, 0); camZone(w, cz[0] - 7, cz[1] - 7, cz[0] + 7, cz[1] + 7, L - 1, L + 4, 4.0, 0.4); }
  talk(w, -38, 0, -26, 10, 'par', 'A shipwreck! Probably haunted. You go first.');
  // reef plates in the shallows (latch) + coral + jellies
  [[-22, 18], [22, -36], [-10, -42]].forEach(([x, z], i) => { w.add('m', blobGeo(i + 30, 0.2, 2), 0xcfb98a, x, 0.3, z, 0, 0, 0, 3.2, 1.0, 3.0); w.solid(x - 2.6, -1, z - 2.6, x + 2.6, L, z + 2.6, { floor: true }); latchPlate(w, 'r' + i, x, L, z, 1.3, 0xff6f91); coral(w, x + 2.6, 0, z + 1.5, 1.4, [0xff6f91, 0xffd23f, 0xa78bfa][i]); });
  w.enemy('jelly', 20, L + 2, -26, { range: 5 }); w.enemy('jelly', -14, L + 2, -34, { range: 5 }); w.enemy('crab', 30, L, 10, { axis: 'z', range: 5 }); w.enemy('crab', -40, L, 14, { axis: 'x', range: 4 });
  talk(w, -30, 12, -16, 24, 'par', 'Pink coral plates. Press all three and the turtle bridge wakes up. Don\u2019t ask me how. Magic. Ugh.');
  for (let i = 0; i < 10; i++) coral(w, Math.cos(i * 0.63) * 34, -0.4, -12 + Math.sin(i * 0.63) * 32, 1.3, [0xff6f91, 0xffd23f, 0xa78bfa, 0x22d3ee][i % 4]);
  w.part(30, L, -34); w.cheese(-10, L, -44); w.part(-26, L, 30); w.part(-22, L, 20.6); w.part(-8, L, -30); w.baby(40, L, -20); w.baby(-40, L, 24); w.heartP(30, L, 20);
  // turtle-shell bridge across the lagoon to the octopus rock (rises once the three reef plates are pressed)
  const turtle = (T, sub, sz) => { T.add('g', sph(20), 0x4d7c0f, 0, 0.3, 0, 0, 0, 0, sz[0] / 2, 0.55, sz[2] / 2); for (let i = 0; i < 6; i++) T.add('g', sph(10), 0x65a30d, Math.cos(i) * sz[0] * 0.3, 0.75, Math.sin(i) * sz[2] * 0.3, 0, 0, 0, 0.5, 0.15, 0.5); T.add('g', sph(14), 0x84cc16, 0, 0.2, sz[2] / 2 + 0.4, 0, 0, 0, 0.5, 0.4, 0.6); T.add('g', sph(8), 0x111111, 0.2, 0.4, sz[2] / 2 + 0.85, 0, 0, 0, 0.08); T.add('g', sph(8), 0x111111, -0.2, 0.4, sz[2] / 2 + 0.85, 0, 0, 0, 0.08); };
  const tm = []; [[0, 12, [0, 0, 0]], [-4, 6, [8, 0, 0]], [0, 0, [0, 0, 0]], [4, -6, [-8, 0, 0]]].forEach(([x, z, off], i) => { const s = w.mover(x, -3.5, z, [3.4, 0.6, 3.4], off, 6, i * 0.2, 0, turtle); tm.push(w.movers[w.movers.length - 1]); });
  let up = 0; w.anims.push((dt) => { const on = w.plates.filter((p) => /^r\d$/.test(p.id) && p.on).length === 3; const ty = on ? L - 0.2 : -3.5; if (on && !up && w.game && w.game.T > 0.5) { w.game.toastMsg('🐢 The turtles rise! Hop across the lagoon!'); sfx('check'); } up = on ? 1 : 0; for (const m of tm) m.base[1] += (ty - m.base[1]) * Math.min(1, dt * 1.5); });
  w.cp(0, L, 27, PI);
  // octopus rock in the middle of the lagoon
  const rock = landPoly(w, ell(0, -24, 16, 13, 28, 15), L, { top: 0xcfb98a, side: 0x8d7a5e }); w.cp(0, L, -14, PI); w.heartP(-10, L, -20); w.heartP(10, L, -20);
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; w.add('m', blobGeo(i + 50, 0.25, 2), 0x8d8178, Math.cos(a) * 16, L, -24 + Math.sin(a) * 13, 0, i, 0, 2.4, 3 + (i % 2) * 2, 2.2); }
  talk(w, -12, -16, 12, -10, 'par', 'INKY. Eight arms, zero manners. Bop his head when he sneezes out of the water!');
  bossEnd(w, 'inky', 0, -27, [-12, -34, 12, -15]);
  w.title = '🐢 Tortuga Lagoon';
};
// ======================================================================= 5. SKULL ROCK (final)
BUILD.p_skull = (w) => { base(w, 'p_skull', { skyTop: 0x1e1b4b, skyMid: 0x6d5a9e, skyBot: 0xc4b5fd, fog: 0x8f86b0, fogD: 0.0042, sunDir: [0.3, 0.6, 0.5], sunColor: 0xd9d1ff, sunI: 2.2, hemiSky: 0xb6a8ff, hemiGround: 0x3b3550, hemiI: 0.9, exposure: 0.95, bloomT: 0.9, bloomS: 0.6 });
  w.sea.userData.U.uDeep.value.set(0x1e2b5c); w.sea.userData.U.uShal.value.set(0x3b5e8c); w.sea.userData.U.uAmp.value = 1.4;
  const pts = ell(0, -16, 50, 74, 40, 17); const land = landPoly(w, pts, L, { top: 0x6b6470, side: 0x4a4553 });
  arrival(w, 56, 'Skull Rock! Clawbeard\u2019s fortress. Through the skull\u2019s mouth, up to his deck. For the Golden Cheese!');
  talk(w, -8, 44, 8, 54, 'par', 'I don\u2019t like this place. Not scared. Just... cautious. SQUAWK. Stay close.');
  w.crumbLine(0, L, 40, 0, L, 26, 5); scatter(w, { cx: 0, cz: 20, w: 90, d: 50, L: land }, 18, (x, z, k) => { w.add('m', blobGeo(k & 31, 0.3, 2), 0x5b5466, x, L, z, 0, k, 0, 1.6, 1.2 + (k % 3), 1.4); w.solid(x - 1.3, L, z - 1.3, x + 1.3, L + 1.2, z + 1.3); if (k % 3 === 0) torch(w, x + 2, L, z, 2.6, 0x7dffb0); }, 51, (x, z) => Math.abs(x) < 10);
  // outer wall with cannons
  const WZ = 18; rockWall(w, -50, WZ - 2, -5, WZ + 2, L, 9, 0x5b5466); rockWall(w, 5, WZ - 2, 50, WZ + 2, L, 9, 0x5b5466); w.slab('m', 0x4a4553, 0, L + 6, WZ, 10, 3, 4, 0.2);
  for (let i = -2; i <= 2; i++) if (i) w.add('m', rbox(2, 2, 4.4, 0.2), 0x6b6470, i * 9, L + 9.8, WZ); flag(w, -8, L + 9, WZ, 6, 0x111827); flag(w, 8, L + 9, WZ, 6, 0x111827);
  autoCannon(w, -16, L, WZ - 6, PI, 30, 3.0); autoCannon(w, 16, L, WZ - 6, PI, 30, 3.4); w.cp(0, L, WZ + 6, PI); talk(w, -10, WZ + 2, 10, WZ + 12, 'par', 'CANNONS! Zig-zag! Zig! Zag! Blast them with your cheese blaster if you\u2019re brave.');
  // courtyard: two levers on towers (hooks), skeleton crew
  w.enemy('skel', -10, L, 4, { axis: 'x', range: 6 }); w.enemy('skel', 10, L, -2, { axis: 'x', range: 6 }); w.enemy('skel', 0, L, -10, { axis: 'z', range: 4 }); w.enemy('gull', 14, L + 3, 8, { range: 6 });
  mesa(w, -22, -4, 8, 8, 10, 0x5b5466, 0x6b6470, L); w.hook(-17, 7, 1); w.hook(-18, 12.5, -4.5); w.lever('k1', -23, 10, -5, 0.5); w.part(-24, 10, -2);
  mesa(w, 22, -4, 8, 8, 10, 0x5b5466, 0x6b6470, L); w.mover(14, L, 4, [3, 0.6, 3], [0, 8.6, 0], 5, 0, 0x7dffb0); w.lever('k2', 23, 10, -5, -0.5); w.baby(24, 10, -1.5); w.part(14, L + 10, 4); w.part(-16, L, WZ - 9.5); w.baby(-30, L, -8);
  talk(w, -28, -10, -14, 4, 'par', 'Two levers, two towers. Grapple left, ride the lift right. Then the skull opens its mouth. Gross.');
  w.cheese(0, L, 6); w.heartP(-6, L, 10); w.crate(6, L, 8); w.crate(-12, L, -12); w.crumbRing(0, L, -2, 5, 8);
  // the skull: hollow head with a jaw door, a stair hall inside, and the captain's deck on top
  const SZ = -32, SY = L; const bone = 0xd6d3c8;
  w.add('g', sph(40), bone, 0, SY + 6, SZ - 8, 0, 0, 0, 20, 9.6, 15); [-1, 1].forEach((s) => { w.add('m', sph(24), 0x1f1b2a, s * 6.5, SY + 10, SZ + 4.6, 0, 0, 0, 3.6, 3.2, 2.4); w.add('l', sph(14), 0x7dffb0, s * 6.5, SY + 10, SZ + 5.6, 0, 0, 0, 1.2, 1.3, 0.8, 1.5); });
  w.add('m', sph(16), 0x1f1b2a, 0, SY + 7.8, SZ + 6.8, 0, 0, 0, 1.4, 1.6, 0.8); for (let i = -3; i <= 3; i++) if (Math.abs(i) > 1) w.add('g', rbox(1.6, 1.8, 1, 0.4), 0xf5f0e1, i * 2.1, SY + 6.2, SZ + 8.4);
  const TOP = SY + 15; w.solid(-21, SY, SZ - 26, -6.3, TOP, SZ + 10); w.solid(6.3, SY, SZ - 26, 21, TOP, SZ + 10); w.solid(-6.3, SY + 6.4, SZ + 6, 6.3, TOP, SZ + 10, { camBlock: true }); w.solid(-6.3, SY, SZ - 26, 6.3, TOP, SZ - 20.3);
  [-1, 1].forEach((s) => w.add('m', rbox(0.5, 14, 26.6, 0.1), 0x3b3550, s * 6.1, SY + 7, SZ - 7)); w.add('m', rbox(12, 14, 0.5, 0.1), 0x3b3550, 0, SY + 7, SZ - 20.1); [-1, 1].forEach((s) => w.add('m', rbox(3.5, 14, 0.5, 0.1), 0x3b3550, s * 4.4, SY + 7, SZ + 6.1)); w.add('m', rbox(5.4, 7.6, 0.5, 0.1), 0x3b3550, 0, SY + 10.2, SZ + 6.1);
  [-1, 1].forEach((s) => w.solid(s > 0 ? 2.65 : -6.3, SY, SZ + 5.85, s > 0 ? 6.3 : -2.65, TOP, SZ + 6.35)); w.door('jaw', 0, SY, SZ + 8.6, 5.6, 6.4, 1.6, ['k1', 'k2'], 0xf5f0e1, '💀 The skull opens its jaw... CREEEAK!');
  // inside: dark hall, zig-zag stairs up to the top deck (y = SY + 14)
  w.slab('m', 0x2b2638, 0, SY, SZ - 7, 12, 0.2, 26, 0.1, false);  camZone(w, -6, SZ - 20, 6, SZ + 8, SY - 1, SY + 14, 4.4, 0.5);
  for (let i = 0; i < 7; i++) w.slab('m', i % 2 ? 0x4a4553 : 0x5b5466, -3.4, SY, SZ + 2 - i * 2, 4.4, (i + 1) * 1.0, 2, 0.08);
  w.slab('m', 0x5b5466, 0, SY + 7, SZ - 12.5, 11.6, 0.6, 3, 0.1); for (let i = 0; i < 6; i++) w.slab('m', i % 2 ? 0x4a4553 : 0x5b5466, 3.4, SY + 7.6, SZ - 12 + i * 2, 4.4, (i + 1) * 1.0, 2, 0.08);
  w.slab('m', 0x5b5466, 3.4, SY + 13, SZ + 0.5, 4.4, 0.6, 4, 0.1); for (let i = 0; i < 4; i++) { torch(w, -5.4, SY, SZ - 2 - i * 5, 2.4, 0x7dffb0); } w.cp(0, SY, SZ + 4, PI); w.enemy('skel', 0, SY, SZ - 4, { axis: 'z', range: 3 });
  w.part(-3.4, SY + 7, SZ - 13); w.baby(3.4, SY + 7.6, SZ - 15); talk(w, -6, SZ - 20, 6, SZ + 6, 'par', 'Up the stairs. Clawbeard\u2019s deck is on top of the skull. My knees are shaking. Birds have knees. Shut up.');
  // the top deck = hall ceiling, with a hatch hole above the last landing (x 1.1..6, z SZ-3.2..SZ+3.2)
  const TY = TOP + 0.8; const deck = (x0, z0, x1, z1) => { w.add('m', rbox(x1 - x0, 0.8, z1 - z0, 0.06), 0x2b2638, (x0 + x1) / 2, TOP + 0.4, (z0 + z1) / 2); w.solid(x0, TOP, z0, x1, TY, z1, { floor: true, camBlock: true }); PR_planks(w, x0 + 0.05, z0 + 0.05, x1 - 0.05, z1 - 0.05, TY); };
  deck(-17, SZ - 24, 17, SZ - 3.2); deck(-17, SZ + 3.2, 17, SZ + 8); deck(-17, SZ - 3.2, 1.1, SZ + 3.2); deck(6, SZ - 3.2, 17, SZ + 3.2); w.hook(3.6, TY + 2.4, SZ - 0.5);
  w.add('x', torus(0.12, 24), 0xffc83d, 3.55, TY + 0.05, SZ, PI / 2, 0, 0, 2.6, 3.3, 1);
  [[-17, SZ - 24, -16, SZ + 8], [16, SZ - 24, 17, SZ + 8], [-17, SZ - 25, 17, SZ - 24], [-17, SZ + 8, 17, SZ + 9]].forEach(([a, b, c, d]) => { w.add('m', rbox(c - a, 1.3, d - b, 0.1), 0x5b3a1f, (a + c) / 2, TY + 0.65, (b + d) / 2); w.solid(a, TY, b, c, TY + 1.4, d, { cam: false }); });
  w.add('m', cyl(14), 0x5b3a1f, 0, TY, SZ - 20, 0, 0, 0, 0.6, 16, 0.6); w.solid(-0.6, TY, SZ - 20.6, 0.6, TY + 16, SZ - 19.4); w.add('s', rbox(10, 7, 0.1, 0.05), 0x111827, 0, TY + 10, SZ - 20.2); w.add('g', sph(14), 0xffffff, 0, TY + 10.5, SZ - 20.4, 0, 0, 0, 1.4, 1.4, 0.1);
  [[-12, SZ - 20], [12, SZ - 20], [-12, SZ + 4], [12, SZ + 4]].forEach(([x, z]) => torch(w, x, TY, z, 2.6, 0x7dffb0)); w.heartP(-10, TY, SZ - 2); w.heartP(10, TY, SZ - 2); w.part(12, TY, SZ - 17); w.cp(3.4, TY, SZ + 1.5, PI);
  talk(w, -16, SZ - 4, 16, SZ + 8, 'par', 'CAPTAIN CLAWBEARD! The meanest cat on the seven seas. You got this, Pi-rat. ...I believe in you. Don\u2019t tell anyone I said that.', TY - 1, TY + 6);
  w.bossSpec = { type: 'clawbeard', x: 0, y: TY, z: SZ - 12, yaw: 0, arena: [-15, SZ - 22, 15, SZ + 6] }; w.goldPos = [0, TY + 1.6, SZ - 12]; w.finalGold = true;
  // lightning storm
  let lt = 3; w.anims.push((dt) => { lt -= dt; if (lt < 0 && w.game) { lt = 4 + Math.random() * 5; w.game.cam.flash = 0.25; if (w.game.fx && w.game.fx.flash) w.game.fx.flash(0xffffff, 0.15); } });
  w.title = '💀 Skull Rock';
};
function PR_planks(w, x0, z0, x1, z1, y) { const n = Math.round((x1 - x0) / 1.1); for (let i = 0; i < n; i++) w.add('m', rbox((x1 - x0) / n - 0.06, 0.12, z1 - z0, 0.03), [0x8b5a2b, 0x7c4a22, 0x9a6a3e][i % 3], x0 + (i + 0.5) * (x1 - x0) / n, y - 0.06, (z0 + z1) / 2); }
