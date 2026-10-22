// Rooms 2-7: Living Room, Vent Tunnels, Garden, Garage, Toy Room, Attic.
import { BUILD } from './levels.js';
import { PR } from './lvlkit.js';
import { rbox } from './world.js';
import { rcyl, lathe, sph, cyl, torus, capsule, cone, tube, leaf, wedge, star, heart, gear, blobGeo } from './shapes.js';
const PI = Math.PI;
// platform with its TOP at `top`
const P = (w, x, top, z, sx, sz, col, th = 0.8, b = 'g') => w.slab(b, col, x, top - th, z, sx, th, sz, Math.min(0.3, th / 2 - 0.02));
// wall shelf (top at y) with brackets, against a wall
const shelf = (w, x, y, z, sx, sz, col = 0xf5d0a9) => { P(w, x, y, z, sx, sz, col, 0.6); [-1, 1].forEach((s) => { w.add('x', rbox(0.3, 1.6, sz * 0.7, 0.1), 0x9ca3af, x + s * (sx / 2 - 0.8), y - 1.4, z); }); };
const lit = (w, x, y, z, c, i = 40, d = 40) => w.lights.push({ x, y, z, c, i, d });

// =====================================================================================  2. LIVING ROOM
BUILD.living = (w) => {
  w.room(64, 52, 24, { wall: 0xe9e4ff, wallN: 0xd6e4ff, ceil: 0xfbf7ff, floor: (a, b, c, d) => PR.floorPlanks(w, a, b, c, d, 0, [0xd9a066, 0xcf9257, 0xe0aa72, 0xc98a50]) });
  w.start = [-26, 0, 18]; w.startYaw = PI; w.cp(-29, 0, 18, PI);
  w.hint(-32, 10, -18, 26, '🛋️ Living Room! Hop up the coffee table and bounce on the couch cushions.');
  // coffee table + clutter
  PR.rug(w, -16, 8, 0, 22, 14, 0x6c7bd9, 0xe0e7ff);
  PR.coffeeTable(w, -18, 6, 0, 12, 6, 2.6); PR.magazine(w, -21, 2.6, 5, 0.4, 2); PR.remote(w, -16, 2.6, 7.5, 0.3); PR.mug(w, -14, 2.6, 4.5, 0, 0xff4fa0); PR.bowl(w, -19, 2.6, 7.4, 0xfde68a, 1);
  w.cheese(-15.5, 2.6, 6.8); w.crumbLine(-24, 0, 14, -21, 0, 10, 4); w.crumbLine(-22, 2.6, 6, -14, 2.6, 6, 5); w.crate(-23, 0, 3);
  PR.toyBlock(w, -24.5, 0, 7.5, 1.8, 0.3); // step up to the table
  w.enemy('dust', -20, 0, 13, { axis: 'x', range: 5 });
  // couch (cushions bounce!)
  PR.couch(w, -14, -14, 0, 22, 0x6c7bd9, 0x8b9bff); w.crumbArc(-20, 3.8, -11, -8, 3.8, -11, 3, 7); w.crumbLine(-22, 8.6, -17, -6, 8.6, -17, 7);
  w.part(-14, 8.6, -17); w.cheese(-4.1, 5.2, -12); w.enemy('bot', -14, 8.6, -17, { axis: 'x', range: 5 });
  w.hint(-26, -19, -2, -8, '🛋️ Bounce on a cushion, then double-jump onto the couch back!', -1, 30);
  w.cp(-14, 0, -7.5, PI);
  // wall shelves above the couch -> TV
  shelf(w, 3, 11, -22, 8, 6); shelf(w, 13, 13.5, -22, 7, 6, 0xc4b5fd); shelf(w, 23, 12, -22, 7, 6, 0xa5f3fc);
  PR.plant(w, 5.5, 11, -24, 0.8, 0x60a5fa); PR.mug(w, 0.8, 11, -24, 0.4, 0xffd23f); w.crumbLine(0, 11, -21, 6, 11, -21, 4); w.enemy('windup', 3, 11, -21, { axis: 'x', range: 2.4 });
  w.baby(13, 13.5, -22); PR.plant(w, 15.4, 13.5, -24, 0.6, 0xf472b6); w.crumbRing(13, 13.5, -22, 2.2, 5);
  w.part(25, 12, -23.5); w.lever('fort', 21, 12, -21.5, 0); w.cp(23, 12, -21, -PI / 2);
  w.hint(-3, -26, 28, -18, '🪁 Hold JUMP while falling to glide between the shelves. Pull the lever on the last one!', 9, 30);
  w.frameArt('x', -26, 3, 17, 6, 4, 1, 0); w.frameArt('x', -26, 18, 18, 4, 3, 1, 1); PR.clock(w, 'x', -26, -8, 19, 1);
  // TV corner
  PR.tvStand(w, 28.5, -9, -PI / 2); w.cheese(27.2, 3.4, -5); w.part(27.2, 3.4, -12.5); PR.toyBlock(w, 23.5, 0, -9, 2, 0.2); w.crumbLine(22, 0, -14, 22, 0, -4, 4);
  PR.lamp(w, 29, -21, 0, 18); PR.bigPlant(w, -28, -22, 1); w.part(-28, 4.2, -22); PR.toyBlock(w, -24.5, 0, -21.5, 2); PR.toyBlock(w, -25, 2, -21.5, 1.6, 0.4);
  // toy-block stair with a part on top
  PR.toyBlock(w, 10, 0, -6, 2.4); PR.toyBlock(w, 12.6, 0, -6, 2.4, 0.2); PR.toyBlock(w, 12.6, 2.4, -6, 2.2, 0.5); PR.toyBlock(w, 15.2, 0, -6, 2.4); PR.toyBlock(w, 15.2, 2.4, -6, 2.2); PR.toyBlock(w, 15.2, 4.6, -6, 2, 0.8); w.part(15.2, 6.6, -6);
  PR.ball(w, 6, 0, -12, 1.8, 0xff4fa0, 0xfff1f2); w.enemy('dust', 14, 0, -11, { axis: 'x', range: 5 });
  // Martina's puzzle: toy-box nook
  w.martinaSpec = { x: -28, z: -3, yaw: PI / 2, path: [[-24, -3], [-18, -3]] };
  w.plate('p1', -18, 0, -3, 1.5);
  const box = 0xd8a15a; w.slab('m', box, -6, 0, -7.4, 8.8, 5, 1, 0.15); w.slab('m', box, -6, 0, 1.4, 8.8, 5, 1, 0.15); w.slab('m', box, -1.9, 0, -3, 1, 5, 7.8, 0.15);
  w.slab('m', box, -10, 0, -6, 1, 5, 2, 0.15); w.slab('m', box, -10, 0, 0, 1, 5, 2, 0.15);
  w.door('nook', -10, 0, -3, 1, 5, 4, ['p1'], 0xff6fae, '🐢 Martina pressed the button! The toy box opened!');
  w.baby(-5, 0, -3); w.crumbLine(-8, 0, -3, -4, 0, -3, 3); PR.teddy(w, -4, 5, -5.5, 0.4, 0.6); PR.toyBlock(w, -7.5, 5, 0.5, 1.4, 0.3);
  w.hint(-31, -8, -14, 2, '🐢 That box is locked! Ask Martina to stand on the blue button.', -1, 6);
  // window + nightstand corner
  PR.window(w, 'x', 25.6, -12, 10, 6, 16, -1, 0x93c5fd); PR.nightstand(w, -28.5, 21, PI / 2, 0xfda4af); PR.toyBlock(w, -24.5, 0, 22, 2.2, 0.3); w.baby(-28.5, 5, 21); w.heartP(-22, 0, 22); PR.lamp(w, -29, 12, 0, 14, 0xfbcfe8);
  // the pillow fort (boss arena)
  const fc = 0xc9a06a; w.slab('m', fc, 3.6, 0, 7.5, 1.6, 6, 7, 0.2); w.slab('m', fc, 3.6, 0, 21.5, 1.6, 6, 9, 0.2); w.slab('m', fc, 18, 0, 3.4, 30, 6, 1.6, 0.2);
  for (let i = 0; i < 8; i++) PR.toyBlock(w, 5 + i * 3.8, 6, 3.4, 1.4, i * 0.4);
  w.door('gate', 3.6, 0, 13.5, 1.6, 6, 6, ['fort'], 0xff9fd0, '🏰 The pillow-fort gate is open! Sucky the Robo-Vac is inside...');
  w.hint(-4, 8, 3, 20, '🔒 The fort gate is shut. A lever up on the high shelves opens it!', -1, 6);
  PR.rug(w, 18, 15, 0, 24, 16, 0xff6fae, 0xffe4f1);
  w.cp(0, 0, 13.5, PI / 2);
  w.bossSpec = { type: 'vac', x: 20, y: 0, z: 15, yaw: -PI / 2, arena: [5, 5, 31.4, 25.4] }; w.goldPos = [18, 1.6, 15];
  [[8, 8], [28, 8], [8, 23], [28, 23]].forEach(([x, z]) => w.add('f', sph(18), [0xffd23f, 0x7dd3fc, 0xf9a8d4, 0xa7f3d0][(x + z) % 4], x, 1, z, 0, 0, 0, 2.2, 1.2, 1.6));
  livingExtras(w);
  w.env = { sunDir: [0.4, 0.8, 0.35] };
};

// =====================================================================================  3. VENT TUNNELS
BUILD.vents = (w) => {
  w.room(76, 44, 30, { wall: 0x6b7a90, wallN: 0x5d6b80, ceil: 0x4b5566, lamp: false, floor: (a, b, c, d) => { w.add('m', rbox(c - a, 0.4, d - b, 0.1), 0x3b4252, (a + c) / 2, -0.2, (b + d) / 2); for (let i = 0; i < 40; i++) w.add('f', blobGeo(i, 0.3, 1), 0x9aa0ab, a + ((i * 37) % 70) + 3, 0.3, b + ((i * 23) % 40) + 2, 0, i, 0, 1.4, 0.8, 1.4); } });
  w.killY = 4; w.camDist = 7;
  const M = 0x9fb0c4, R2 = 0xc7d2df;
  // open-top duct: floor + side rails (+gaps in rails)
  const duct = (x0, x1, z0, z1, y, rails = 'z', gaps = []) => { const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; P(w, cx, y, cz, x1 - x0, z1 - z0, M, 0.8, 'x');
    for (let i = 0; i < Math.floor((x1 - x0) / 3); i++) w.add('x', rbox(0.15, 0.06, z1 - z0 - 0.6, 0.03), 0x7b8aa0, x0 + 1.5 + i * 3, y + 0.02, cz);
    if (rails === 'z') [z0, z1].forEach((z, k) => { let s = x0; const gs = gaps.filter((g) => g[2] === k || g[2] === undefined); for (const g of gs.concat([[x1, x1]])) { if (g[0] > s) { w.slab('x', R2, (s + g[0]) / 2, y, z, g[0] - s, 1.2, 0.4, 0.15); } s = g[1]; } });
    if (rails === 'x') [x0, x1].forEach((x, k) => { let s = z0; const gs = gaps.filter((g) => g[2] === k || g[2] === undefined); for (const g of gs.concat([[z1, z1]])) { if (g[0] > s) { w.slab('x', R2, x, y, (s + g[0]) / 2, 0.4, 1.2, g[0] - s, 0.15); } s = g[1]; } });
    for (let x = x0 + 2; x < x1 - 1; x += 8) for (let z = z0 + 2; z < z1 - 1; z += 8) w.add('x', cyl(10), 0x4b5566, x, 0, z, 0, 0, 0, 0.35, y - 0.8, 0.35); };
  // D1 start
  duct(-37, -20, -14, -8, 8); w.start = [-32, 8, -11]; w.startYaw = PI / 2; w.cp(-29, 8, -13, PI / 2);
  w.crumbLine(-30, 8, -11, -22, 8, -11, 5); w.part(-21.5, 8, -13); w.crate(-26, 8, -9.2);
  w.hint(-38, -15, -20, -7, '🌀 Vent Tunnels! Jump into the fan wind to float UP.', 6, 20);
  w.fan(-16.5, 7.5, -11, 2, 11, 32);
  // D2
  duct(-13, 0, -14, -8, 14, 'z', [[-8, -1, 1]]); w.crumbLine(-11, 14, -11, -1, 14, -11, 5); w.enemy('dust', -6, 14, -11, { axis: 'x', range: 4 }); w.cp(-11, 14, -11, PI / 2);
  // lower secret ledge + fan back up
  P(w, -4.5, 9, -3.5, 7, 5, M, 0.8, 'x'); w.fan(-6.5, 9, -3.5, 1.4, 9, 30); w.baby(-2.2, 9, -3.5); w.crumb(-3.5, 9, -2);
  // hook gap + backup mover
  w.hook(5, 18, -11); w.mover(2.2, 13.2, -11, [3.6, 0.8, 4], [5.6, 0, 0], 4.5, 0, 0xffd23f);
  w.hint(-2, -15, 10, -7, '🪝 Tap HOOK near the glowing ring to zip across (or ride the lift)!', 12, 22);
  // D3 -> J1
  duct(10, 22, -14, -8, 14); w.crumbLine(11, 14, -11, 21, 14, -11, 5); w.part(20, 14, -13); w.enemy('bot', 16, 14, -11, { axis: 'x', range: 4 });
  P(w, 28, 14, -11, 12, 14, M, 0.8, 'x'); w.slab('x', R2, 28, 14, -18, 12, 1.2, 0.4); w.slab('x', R2, 34, 14, -14, 0.4, 1.2, 6); w.cheese(25, 14, -16); w.enemy('dust', 28, 14, -8, { axis: 'z', range: 3 }); w.cp(24, 14, -11, PI);
  // high ledge via fan
  w.fan(31.5, 14, -15.5, 1.6, 10, 32); P(w, 35.5, 22, -15, 4.6, 8, M, 0.8, 'x'); w.baby(36, 22, -17); w.part(36, 22, -13); w.crumbLine(31.5, 16, -15.5, 31.5, 21, -15.5, 3);
  // D4 south with a side gust
  duct(25, 31, -4, 12, 14, 'x', [[0, 7]]); w.sideWind(18, 14, 0, 34, 20, 7, [-16, 0, 0]); w.crumbLine(28, 14, -2, 28, 14, 10, 6);
  for (let i = 0; i < 6; i++) w.add('l', rbox(0.2, 0.2, 1.4, 0.05), 0xbff4ff, 31.2, 15 + i * 0.5, 1 + i, 0, 0, 0, 1, 1, 1, 0.5);
  w.add('x', rcyl(2.6, 0.6, 0.2, 32), 0x475569, 33.6, 16, 3.5, 0, 0, PI / 2); w.hint(24, -4, 32, 9, '💨 Strong gust! Stay close to the right side.', 12, 22);
  // J2 + crate stack
  P(w, 28, 14, 16, 12, 8, M, 0.8, 'x'); w.cp(28, 14, 15, -PI / 2); w.enemy('moth', 26, 16, 16, { range: 3 });
  w.slab('x', 0x8492a6, 32.5, 14, 18, 3, 2.5, 3, 0.2); w.slab('x', 0x8492a6, 35.5, 14, 17.5, 3, 5, 3, 0.2); w.part(32.5, 16.5, 18); w.baby(35.5, 19, 17.5);
  // D5 back west with a sliding platform
  duct(10, 22, 13, 19, 11); w.crumbLine(21, 11, 16, 11, 11, 16, 5); w.part(14, 11, 18);
  w.mover(6, 10.2, 16, [4, 0.8, 5], [-2, 0, 0], 3.5, 0, 0x3ff0ff); duct(-12, 4, 13, 19, 11); w.enemy('dust', -4, 11, 16, { axis: 'x', range: 5 }); w.cheese(0, 11, 14); w.crate(-8, 11, 17.8);
  // boss junction
  P(w, -24, 11, 12, 24, 16, 0x8090a6, 0.8, 'x'); w.slab('x', R2, -24, 11, 20, 24, 1.2, 0.4); w.slab('x', R2, -24, 11, 4, 24, 1.2, 0.4); w.slab('x', R2, -36, 11, 12, 0.4, 1.2, 16);
  w.cp(-11, 11, 16, -PI / 2); w.cheese(-34, 11, 18);
  w.bossSpec = { type: 'dustking', x: -26, y: 11, z: 12, yaw: PI / 2, arena: [-35.5, 4.5, -12.5, 19.5] }; w.goldPos = [-24, 12.6, 12];
  // glowing vent grilles + pipes for depth
  for (let i = 0; i < 6; i++) { w.add('l', rbox(4, 2.4, 0.2, 0.1), 0x7dd3fc, -30 + i * 12, 22, -21.4, 0, 0, 0, 1, 1, 1, 0.25); for (let k = 0; k < 5; k++) w.add('x', rbox(4.2, 0.18, 0.3, 0.05), 0x334155, -30 + i * 12, 21 + k * 0.5, -21.2); }
  for (let i = 0; i < 4; i++) w.add('x', cyl(16), [0xf59e0b, 0x22d3ee, 0xef4444, 0xa3e635][i], 0, 24 + i * 1.3, -19 + i * 2, 0, 0, PI / 2, 0.5, 74, 0.5);
  lit(w, -24, 18, 12, 0x9fe8ff, 70, 50); lit(w, 28, 20, -6, 0xbfe8ff, 60, 50); lit(w, -8, 20, -11, 0xffe2a8, 50, 40); lit(w, 14, 18, 16, 0xa5f3fc, 50, 40);
  w.env = { skyTop: 0x1f2a44, skyMid: 0x334766, skyBot: 0x4b6080, fog: 0x2b3a52, fogD: 0.006, hemiSky: 0xbcd7ff, hemiGround: 0x3b4252, hemiI: 0.9, sunI: 1.6, sunColor: 0xd6ecff, exposure: 1.05, bloomT: 0.85 };
};

// =====================================================================================  4. GARDEN
BUILD.garden = (w) => {
  const X = 42, Z = 34;
  w.add('m', rbox(X * 2 + 4, 1, Z * 2 + 4, 0.2), 0x6b4f2a, 0, -0.5, 0); w.solid(-X - 2, -1, -Z - 2, X + 2, 0, Z + 2);
  w.add('g', rbox(X * 2, 0.2, Z * 2, 0.1), 0x4caf50, 0, 0, 0); PR.grassField(w, -X, -Z + 6, X, Z, 0, 0.32);
  PR.wall(w, 'x', -Z - 0.6, -X - 1.2, X + 1.2, 40, 0xf2d7b6, { side: 1 }); PR.window(w, 'x', -Z, -10, 12, 10, 22, 1, 0x7dd3fc); PR.window(w, 'x', -Z, 20, 10, 10, 22, 1, 0xfda4af);
  PR.fence(w, 'x', Z + 0.6, -X, X, 18); PR.fence(w, 'z', -X - 0.6, -Z, Z, 18); PR.fence(w, 'z', X + 0.6, -Z, Z, 18); w.bounds = [-X, -Z, X, Z];
  w.start = [-36, 0, 28]; w.startYaw = PI * 0.8; w.cp(-38, 0, 24, PI * 0.8); PR.mouseHole(w, 'x', -Z, -30, 1, 1);
  w.hint(-X, 18, -24, Z, '🌻 The Garden! Candy is awake out here. Stay UP on things and away from her nose!');
  // stone path
  for (let i = 0; i < 9; i++) PR.stone(w, -32 + i * 4.6, 24 - i * 2.2, 1.8);
  // raised veggie beds
  const bed = (x, z, sx, sz) => { w.slab('m', 0x9a6a3e, x, 0, z, sx, 2.5, sz, 0.15); w.add('m', rbox(sx - 0.8, 0.2, sz - 0.8, 0.08), 0x5b3a1f, x, 2.45, z);
    for (let i = 0; i < Math.floor(sx / 2.2); i++) { const cx = x - sx / 2 + 1.4 + i * 2.2; w.add('g', cone(12), 0xff8a3d, cx, 2.1, z - sz / 4, PI, 0, 0, 0.35, 0.9, 0.35); for (let k = 0; k < 3; k++) w.add('g', leaf(), 0x3fae5a, cx, 2.55, z - sz / 4, -0.3, k * 2.1, 0, 0.5, 1.1, 0.5); w.add('g', sph(12), 0x65a30d, cx, 2.75, z + sz / 4, 0, 0, 0, 0.55, 0.45, 0.55); } };
  bed(-26, 17, 12, 6); w.crumbLine(-31, 2.5, 17, -21, 2.5, 17, 5); w.enemy('snail', -26, 2.5, 17, { axis: 'x', range: 4 }); w.part(-20.8, 2.5, 19);
  PR.mushroom(w, -17, 0, 13, 1.4, 0xef4444); PR.mushroom(w, -13, 0, 9, 1.6, 0xa855f7);
  // flower stepping heads
  PR.flower(w, -9, 0, 5, 6.5, 0xffd23f); PR.flower(w, -5.5, 0, 2, 8.5, 0xff5d8f); PR.flower(w, -2, 0, -1.5, 10.5, 0xa66bff); PR.flower(w, 1.5, 0, -5, 12.5, 0xff8a3d);
  w.crumb(-9, 6.8, 5); w.crumb(-5.5, 8.8, 2); w.crumb(-2, 10.8, -1.5); w.baby(1.5, 12.8, -5);
  w.hint(-20, 0, -6, 16, '🍄 Bounce on the mushrooms, then hop across the flower tops!', -1, 30); w.enemy('bee', -6, 9, 6, { range: 3 }); w.cp(-16, 0, 6, PI * 0.75);
  // pond
  w.add('e', rbox(20, 0.5, 13, 0.25), 0x38bdf8, 14, 0.15, 14); w.add('m', rbox(21, 0.25, 14, 0.3), 0x0e7490, 14, 0.02, 14); w.water(4.2, -1, 7.7, 23.8, 0.6, 20.3);
  [[6.5, 16], [10, 12], [14, 16.5], [18, 12], [21.5, 15.5]].forEach(([x, z], i) => { P(w, x, 0.7, z, 2.8, 2.8, 0x22c55e, 0.4); w.add('g', sph(10), 0xf472b6, x + 0.6, 0.85, z + 0.4, 0, 0, 0, 0.3, 0.2, 0.3); w.crumb(x, 0.7, z); });
  for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2; PR.rock(w, 14 + Math.cos(a) * 11, 0, 14 + Math.sin(a) * 7.6, 1.6 + (i % 3) * 0.5); }
  PR.rock(w, 14, 0, 14, 3.4, 0xa8a29e); w.cheese(14, 3.7, 14);
  // tree with branch platforms + hooks
  w.add('m', cyl(24), 0x8b5a2b, -32, 0, -22, 0, 0, 0, 3.4, 26, 3.4); w.solid(-35, 0, -25, -29, 26, -19);
  [[-32, 9, -15.5, 0], [-25.5, 15, -22, PI / 2], [-32, 21, -28.5, 0]].forEach(([x, y, z, r]) => { w.add('m', rbox(6, 1.2, 6, 0.5), 0x7c4a22, x, y - 0.6, z); w.solid(x - 3, y - 1.2, z - 3, x + 3, y, z + 3); w.add('g', blobGeo(((x + y) | 0) + 40, 0.15, 2), 0x3fae5a, x + (r ? 2 : 0), y + 3.5, z + (r ? 0 : 2), 0, r, 0, 3, 2, 3); });
  for (let i = 0; i < 6; i++) w.add('g', blobGeo(i + 70, 0.2, 2), [0x3fae5a, 0x2f9e4a, 0x5cc35f][i % 3], -32 + Math.cos(i) * 6, 28 + Math.sin(i * 2) * 2, -22 + Math.sin(i) * 6, 0, i, 0, 6, 4.5, 6);
  PR.wateringCan(w, -24, -10, 0.5); w.cheese(-23, 4.5, -9.5); w.cheese(8, 0, 31); w.crumbLine(-34, 0, 24, -20, 0, 26, 6); w.crumbLine(4, 0, 4, 4, 0, 18, 5); PR.flowerPot(w, -28.5, -12, 1, 0xd2691e, true); w.hook(-27, 13, -15); w.hook(-27, 19, -26);
  w.crumbLine(-24, 4.5, -10, -28.5, 5, -12, 3); w.part(-32, 9, -15.5); w.part(-32, 21, -28.5); w.baby(-25.5, 15, -22);
  w.hint(-36, -20, -18, -6, '🪝 Watering can → flower pot → tree branch. Use HOOK to zip up the tree!', -1, 30); w.cp(-24, 4.5, -10, PI);
  // shed + Martina
  w.slab('m', 0x8b5a2b, 28, 0, -32, 14, 12, 1, 0.1); w.slab('m', 0x9a6a3e, 21.5, 0, -27, 1, 12, 9, 0.1); w.slab('m', 0x9a6a3e, 34.5, 0, -27, 1, 12, 9, 0.1);
  w.slab('m', 0x9a6a3e, 24, 0, -22.5, 4, 12, 1, 0.1); w.slab('m', 0x9a6a3e, 32, 0, -22.5, 4, 12, 1, 0.1); w.slab('m', 0x9a6a3e, 28, 7, -22.5, 4, 5, 1, 0.1);
  w.add('m', rbox(16, 0.8, 12, 0.2), 0xb91c1c, 28, 12.4, -27, 0, 0, 0.0); w.solid(20, 12, -33, 36, 12.8, -21);
  w.door('shed', 28, 0, -22.5, 4, 7, 1, ['p1'], 0x22c55e, '🐢 Martina opened the shed!'); P(w, 28, 3, -30.6, 10, 1.6, 0xd4a373, 0.4); w.baby(28, 3, -30.5); PR.paintCan(w, 24, 0, -29, 0x22c55e); PR.paintCan(w, 32, 0, -29, 0xffd23f); w.part(32, 2.25, -29);
  w.martinaSpec = { x: 14, z: -10, yaw: 0, path: [[16, -14], [22, -16]] }; w.plate('p1', 22, 0, -16, 1.5);
  w.hint(8, -22, 36, -8, '🐢 Martina can hold down the green button to open the shed!', -1, 8);
  PR.gnome(w, 10, -20, 0.6, 1.4); PR.gnome(w, 37, -14, -0.8, 1.2); PR.flowerPot(w, 38, -4, 1.2, 0x3b82f6, true); w.part(38, 6, -4);
  // flower borders + bee
  for (let i = 0; i < 16; i++) PR.flower(w, -38 + i * 5, 0, -31.5 + (i % 2) * 1.5, 4 + (i % 3) * 1.4);
  w.enemy('bee', 20, 6, -6, { range: 4 }); w.enemy('snail', 30, 0, -12, { axis: 'x', range: 4 });
  // patio arena
  PR.floorTiles(w, 10, 22, 40, 34, 0.12, 0xe7e5e4, 0xd6d3d1, 4); w.cp(6, 0, 28, PI / 2);
  w.bossSpec = { type: 'sprinkler', x: 26, y: 0.12, z: 28, yaw: -PI / 2, arena: [10, 22, 41, 33.5] }; w.goldPos = [25, 1.8, 28]; w.heartP(8, 0, 24);
  w.candySpec = { x: -10, z: 22, yaw: 0, sleep: false, path: [[-20, 26], [0, 26], [-4, 18], [-24, 22]], bounds: [-40, 10, 4, 33] };
  w.env = { skyTop: 0x3d9bff, skyMid: 0x9fd7ff, skyBot: 0xeaf7ff, fog: 0xcfe9ff, fogD: 0.0022, sunDir: [0.45, 0.85, 0.35], sunColor: 0xfff3d6, sunI: 3.0, hemiSky: 0xcfeaff, hemiGround: 0x5d8a3a, hemiI: 0.8, exposure: 1.0, bloomT: 1.05, outdoor: true };
};

// =====================================================================================  5. GARAGE
BUILD.garage = (w) => {
  w.room(72, 52, 26, { wall: 0xd1d5db, wallN: 0xcbd5e1, ceil: 0xe5e7eb, floor: (a, b, c, d) => PR.floorConcrete(w, a, b, c, d) });
  w.start = [30, 0, 20]; w.startYaw = PI * 1.15; w.cp(33, 0, 22, PI * 1.15);
  w.hint(20, 12, 36, 26, '🔧 Grease Garage! Climb the tires and boxes up to the workbench.');
  // tire stack + boxes
  w.fadeBegin(); PR.tire(w, 20, 0, 4, true, 1); PR.tire(w, 20, 1.9, 4, true, 1); w.fadeEnd(); w.crumbLine(27, 0, 15, 22.5, 0, 7.5, 3); w.crumbRing(20, 3.8, 4, 1.8, 5);
  PR.cardboard(w, 31, 0, 9, 0.1, 5, 5.5, 5); w.cheese(31, 5.5, 9); w.enemy('toycar', 22, 0, 18, { axis: 'x', range: 6 });
  // workbench along the east wall
  PR.workbench(w, 32, -6, PI / 2, 20, 7, 6); PR.toolbox(w, 33, 4.5, PI / 2); PR.hammer(w, 32, 7, -2, 0.4); PR.wrench(w, 31.5, 7, -10, -0.3, 1.2); PR.paintCan(w, 33.5, 7, -13, 0x3b82f6); PR.paintCan(w, 31, 7, -13.5, 0xef4444);
  w.crumbLine(32, 7, 1, 32, 7, -11, 6); w.part(33.5, 9.25, -13); w.enemy('nut', 32, 7, -6, { axis: 'z', range: 4 }); w.cp(32, 7, 0, PI);
  PR.pegboard(w, 'z', 35.4, -6, 9, 18, 9, -1); w.hook(31, 15, -16);
  w.hint(28, -16, 36, 6, '🚀 Triple-jump with the Jet Tail, or HOOK up to the high shelf!', 6, 30);
  // high shelf along the north wall
  shelf(w, 22, 15, -23, 22, 5, 0x94a3b8); PR.paintCan(w, 14, 15, -24, 0xa855f7); PR.cardboard(w, 26, 15, -24, 0, 3, 2.5, 3); w.part(26, 17.5, -24); w.crumbLine(30, 15, -22, 13, 15, -22, 7);
  w.baby(12.5, 15, -22.5); w.lever('gate', 18, 15, -22, 0); w.cp(28, 15, -22, -PI / 2); w.enemy('nut', 20, 15, -22, { axis: 'x', range: 5 });
  // shelf units (decor + walkable tops)
  PR.shelfUnit(w, 2, -22.5, 0, 10, 16, 4, 4); PR.paintCan(w, 0, 4, -22.5, 0x22c55e); PR.paintCan(w, 4, 8, -22.5, 0xffd23f); PR.cardboard(w, 2, 12, -22.5, 0, 4, 2, 3);
  w.solid(-3, 0, -24.5, 7, 16, -20.5, { cam: false }); w.part(2, 16, -22.5);
  // the car
  const car = 0xef4444, cx = -2, cz = -6; w.add('g', rbox(20, 4.2, 10, 1.6), car, cx, 3.3, cz); w.add('g', rbox(11, 4, 9, 2), car, cx + 1, 6.8, cz);
  w.add('e', rbox(11.2, 2.6, 9.2, 1.2), 0xbfe8ff, cx + 1, 7.2, cz); w.add('g', rbox(9.5, 0.5, 8.6, 0.25), 0xfef2f2, cx + 1, 8.9, cz);
  [[-6.5, -5], [6, -5], [-6.5, 5], [6, 5]].forEach(([a, b]) => { w.add('m', torus(0.42, 36), 0x1f2937, cx + a, 2.2, cz + b * 0.98, 0, 0, 0, 2.6, 2.6, 2.6); w.add('x', rcyl(1.4, 0.8, 0.1, 24), 0xd1d5db, cx + a, 2.2, cz + b * 1.02, PI / 2, 0, 0); });
  [-1, 1].forEach((s) => { w.add('l', sph(14), 0xfff7c2, cx + 9.8, 3.8, cz + s * 3.2, 0, 0, 0, 0.3, 0.8, 0.9, 0.8); w.add('l', sph(12), 0xff3b3b, cx - 9.9, 3.8, cz + s * 3.6, 0, 0, 0, 0.25, 0.6, 0.8, 0.6); });
  w.add('x', rbox(1, 0.8, 10.4, 0.3), 0xd1d5db, cx + 10, 1.6, cz); w.add('x', rbox(1, 0.8, 10.4, 0.3), 0xd1d5db, cx - 10, 1.6, cz);
  w.solid(cx - 10, 1.2, cz - 5, cx + 10, 5.4, cz + 5); w.solid(cx - 4.5, 5.4, cz - 4.5, cx + 6.5, 9.2, cz + 4.5);
  PR.cardboard(w, cx + 12.5, 0, cz + 1, 0, 3.4, 3, 3.4); w.crumbLine(cx + 9, 5.4, cz, cx - 8, 5.4, cz, 6); w.cheese(cx + 1, 9.2, cz); w.baby(cx + 3, 9.2, cz + 2.5); w.cheese(33, 8.8, 4.5); w.part(cx - 8, 5.4, cz - 3);
  w.hint(cx - 12, cz - 6, cx + 16, cz + 6, '🚗 Climb the car! Stand on the roof for a great view.', -1, 30);
  // floor clutter
  PR.bike(w, -26, -18, 0.3); w.fadeBegin(); PR.tire(w, -32, 0, -6, true, 1.2); PR.tire(w, -32, 2.3, -6, true, 1.2); w.fadeEnd(); PR.toolbox(w, -30, 0, PI / 2, 0x2563eb); w.baby(-32, 4.6, -6); w.heartP(-26, 0, -12);
  for (let i = 0; i < 5; i++) PR.paintCan(w, 10 + i * 2.7, 0, 18 + (i % 2), [0xef4444, 0x3b82f6, 0x22c55e, 0xffd23f, 0xa855f7][i]); w.crumbLine(10, 2.25, 18, 21, 2.25, 18.5, 5); w.part(21, 2.25, 19);
  w.add('m', rcyl(3, 0.06, 0.03, 24), 0x111827, 14, 0.02, 4); w.add('m', rcyl(2, 0.06, 0.03, 20), 0x1f2937, 17, 0.03, 6); // oil puddles (decor)
  w.add('l', rbox(0.3, 0.3, 30, 0.1), 0xffffff, -10, 25, 0, 0, 0, 0, 1, 1, 1, 0.6); w.add('l', rbox(0.3, 0.3, 30, 0.1), 0xffffff, 14, 25, 0, 0, 0, 0, 1, 1, 1, 0.6);
  // gated boss pen (painted floor)
  const bc = 0xd8a15a; w.slab('m', bc, -21, 0, 4.4, 30, 5.5, 1.6, 0.2); w.slab('m', bc, -5.4, 0, 8.5, 1.6, 5.5, 7, 0.2); w.slab('m', bc, -5.4, 0, 22, 1.6, 5.5, 6, 0.2);
  w.door('gate', -5.4, 0, 15.5, 1.6, 5.5, 7, ['gate'], 0xfacc15, '🏁 The race track is open! Here comes the RC Rumbler!');
  w.hint(-6, 6, 8, 26, '🔒 Track closed. Find the lever on the high shelf!', -1, 6);
  PR.floorTiles(w, -36, 5.2, -6.2, 26, 0.05, 0x374151, 0x1f2937, 3); for (let i = 0; i < 6; i++) w.add('l', rbox(2.2, 0.06, 0.5, 0.05), 0xfff7c2, -32 + i * 5, 0.1, 15.5, 0, 0, 0, 1, 1, 1, 0.3);
  w.cp(-1, 0, 15.5, -PI / 2);
  w.bossSpec = { type: 'rc', x: -22, y: 0.05, z: 16, yaw: PI / 2, arena: [-35.5, 6, -6.4, 25.5] }; w.goldPos = [-20, 1.7, 15.5];
  garageExtras(w);
  lit(w, -20, 20, 15, 0xffffff, 60, 50); lit(w, 20, 20, -6, 0xfff1dc, 60, 50); lit(w, 2, 20, -18, 0xfff7e6, 50, 45); lit(w, 24, 18, 18, 0xffe9c7, 50, 45);
  w.env = { exposure: 1.0, fog: 0xe5e7eb, fogD: 0.003, hemiSky: 0xf1f5f9, hemiGround: 0x9ca3af, sunDir: [-0.3, 0.8, 0.5] };
};

function garageExtras(w) {
  // roller garage door on the south wall (ribbed panels + handle + window strip)
  for (let i = 0; i < 9; i++) w.add('g', rbox(30, 2.1, 0.5, 0.2), i % 2 ? 0xe5e7eb : 0xd8dde4, 10, 1.2 + i * 2.2, 25.6); for (let k = 0; k < 6; k++) w.add('e', rbox(3.6, 1.2, 0.2, 0.1), 0xbfe8ff, -1.5 + k * 4.6, 16.6, 25.3);
  w.add('x', rbox(4, 0.5, 0.6, 0.2), 0x6b7280, 10, 3.4, 25.2); w.add('x', rbox(0.8, 22, 0.8, 0.2), 0x9ca3af, -5.4, 0, 25.5); w.add('x', rbox(0.8, 22, 0.8, 0.2), 0x9ca3af, 25.4, 0, 25.5);
  w.add('m', rbox(30, 0.3, 1.2, 0.1), 0xfacc15, 10, 0.02, 24.6); for (let k = 0; k < 10; k++) w.add('m', rbox(1.4, 0.32, 1.2, 0.05), 0x111827, -3 + k * 3, 0.03, 24.6, 0, 0.6, 0);
  // tall metal shelving on the east wall near the start: jars, boxes, coiled hose, spray cans
  PR.shelfUnit(w, 33.6, 15.6, PI / 2, 8, 12, 3.6, 3, 0x475569); w.solid(31.8, 0, 11.6, 35.4, 12, 19.6, { cam: false });
  [[0, 0x22c55e], [4, 0xef4444], [8, 0x3b82f6]].forEach(([y, c], i) => { PR.jar(w, 33.6, y + 0.3, 13.1, c, 0xffd23f, 1.6); PR.can(w, 33.6, y + 0.3, 15.6, pick2(i), 1.6, 0.6); PR.can(w, 33.2, y + 0.3, 17.9, 0xf97316, 2.0, 0.45); });
  w.add('g', torus(0.25, 28), 0x16a34a, 33.4, 9.6, 15.6, 0, PI / 2, 0, 1.3); w.add('g', torus(0.25, 28), 0x16a34a, 33.4, 9.6, 15.6, 0.3, PI / 2, 0, 1.15);
  // stacked storage bins + boxes along the north wall under the high shelf
  [[-14, 0x3b82f6], [-9, 0xef4444], [-14, 0x22c55e, 3.2]].forEach(([x, c, y = 0]) => { w.slab('g', c, x, y, -23, 4.6, 3.2, 3.4, 0.25); w.add('g', rbox(4.8, 0.4, 3.6, 0.15), shadeC(c), x, y + 3.2, -23); });
  PR.cardboard(w, -4, 0, -23, 0.05, 4, 3, 3.4); PR.cardboard(w, -4.2, 3, -23.2, -0.1, 3, 2.4, 2.8, true); PR.cardboard(w, 8, 0, -23, 0.1, 3.6, 4.4, 3, true);
  // second bike, a scooter and a skateboard
  PR.bike(w, 14, -15, 0.1); w.solid(8.5, 0, -16, 19.5, 6, -14, { cam: false });
  { const T = w.tf(-20, 0, -14, 0.5); T.box('g', 0x111827, 0, 0.6, 0, 1.6, 0.2, 6, 0.1); [-2.3, 2.3].forEach((z) => [-0.6, 0.6].forEach((x) => T.add('g', rcyl(0.45, 0.4, 0.1, 18), 0xffd23f, x, 0.45, z, 0, 0, PI / 2))); T.add('g', rbox(1.3, 0.05, 5.6, 0.04), 0xff4fa0, 0, 0.82, 0); }
  { const T = w.tf(16.5, 0, -5, -0.3); T.box('g', 0x3ff0ff, 0, 0.7, 0, 1.4, 0.3, 6.4, 0.12); T.add('x', cyl(10), 0x9ca3af, 0, 1, 2.8, 0.15, 0, 0, 0.12, 7, 0.12); T.add('g', capsule(12), 0x111827, 0, 8, 3.8, 0, 0, PI / 2, 0.25, 3, 0.25); [-2.8, 2.8].forEach((z) => T.add('g', rcyl(0.7, 0.4, 0.1, 18), 0x111827, 0, 0.7, z, 0, 0, PI / 2)); }
  // ladder leaning on the west end of the north wall + broom + rake + hanging hose reel
  { const T = w.tf(-26, 0, -24.4, 0); [-1.5, 1.5].forEach((x) => T.add('x', rbox(0.4, 18, 0.5, 0.12), 0xd1d5db, x, 9, 0, -0.12, 0, 0)); for (let k = 0; k < 7; k++) T.add('x', rbox(3, 0.3, 0.4, 0.1), 0x9ca3af, 0, 1.5 + k * 2.4, 0.3 - k * 0.29, -0.12, 0, 0); }
  { const T = w.tf(-30.5, 0, -24.6, 0); T.add('m', cyl(10), 0xc08552, 0, 2.5, 0, -0.12, 0, 0, 0.18, 14, 0.18); T.box('f', 0xef4444, 0, 0, 0.3, 3, 2.8, 0.6, 0.2); T.add('m', rbox(3.2, 0.5, 0.8, 0.2), 0x7c2d12, 0, 2.8, 0.3); }
  { const T = w.tf(-33, 0, -24.6, 0); T.add('m', cyl(10), 0xc08552, 0, 0, 0, 0, 0, 0, 0.18, 16, 0.18); for (let k = 0; k < 9; k++) T.add('x', rbox(0.1, 1.2, 0.1, 0.04), 0x6b7280, -1.6 + k * 0.4, 15.8, 0.2); T.add('x', rbox(3.6, 0.3, 0.3, 0.1), 0x6b7280, 0, 16.4, 0.2); }
  // big wall tools on the west part of the north wall: saw, shovel, coiled rope, pegboard
  PR.pegboard(w, 'x', -25.4, -19, 6, 10, 7, 1); PR.wrench(w, -22, 9, -25, 0.4, 1.6); PR.hammer(w, -17, 9, -25, 0.3);
  w.add('m', torus(0.2, 28), 0xd6b88a, -14, 12, -25.2, 0, 0, 0, 1.6); w.add('m', torus(0.2, 28), 0xd6b88a, -14, 11.8, -25.1, 0, 0, 0, 1.3);
  // jerry can, bucket, watering can, sandbags near the car
  { const T = w.tf(10.2, 0, -9.2, 0.2); T.box('g', 0xdc2626, 0, 0, 0, 2.4, 3.2, 1.4, 0.3); T.add('x', torus(0.15, 16, PI), 0x9ca3af, 0, 3.4, 0, 0, 0, 0, 0.6); T.add('g', cyl(12), 0xfacc15, 0.8, 3.2, 0, 0, 0, -0.5, 0.25, 0.8, 0.25); T.solid(-1.2, 0, -0.7, 1.2, 3.2, 0.7); }
  w.add('g', lathe([[0, 0], [1.2, 0], [1.5, 2.4], [1.4, 2.5], [0, 2.4]], 28), 0x60a5fa, 14.5, 0, -9); w.add('x', torus(0.04, 20, PI), 0x9ca3af, 14.5, 2.5, -9, 0, 0, 0, 1.45); w.solid(13.1, 0, -10.5, 15.9, 2.5, -7.5);
  // oil stains + scattered garage bits
  [[6, 10, 2.2], [-12, 2, 1.6], [20, 6, 1.4], [-2, 2, 2.6], [16, -18, 1.2]].forEach(([x, z, r]) => PR.oilStain(w, x, z, r));
  PR.scatter(w, -4, -22, 34, 24, 48, 'garage'); PR.scatter(w, -35, -24, -6, 4, 14, 'garage');
  // wall stuff: posters, fuse box, clock, extension cord
  PR.frame(w, 'z', 35.6, -18, 12, 5, 7, -1, 2); PR.frame(w, 'x', -25.6, 6, 14, 6, 4, 1, 1); w.add('g', rbox(3, 4, 0.8, 0.2), 0x9ca3af, 20, 14, -25.4); w.add('l', sph(8), 0x22c55e, 20.8, 15, -24.9, 0, 0, 0, 0.18, 0.18, 0.05, 0.8); w.add('l', sph(8), 0xef4444, 19.2, 15, -24.9, 0, 0, 0, 0.18, 0.18, 0.05, 0.8);
  w.add('g', tube([[20, 12, -25], [21, 6, -24.9], [24, 0.3, -24], [30, 0.25, -20], [33, 0.3, -18]], 0.15, 40, 8), 0xf97316, 0, 0, 0);
}
const pick2 = (i) => [0x3b82f6, 0xa855f7, 0x14b8a6][i % 3];
const shadeC = (c) => { const r = ((c >> 16) & 255) * 0.75 | 0, g = ((c >> 8) & 255) * 0.75 | 0, b = (c & 255) * 0.75 | 0; return (r << 16) | (g << 8) | b; };

function livingExtras(w) {
  // slippers + shoes by the start, dog-chew bone, stacked books, laundry basket, floor cushion, toy car, phone with cable
  [[-21, 21.5, 0.3, 0xf9a8d4], [-19.4, 21.2, 0.1, 0xf9a8d4]].forEach(([x, z, a, c]) => { const T = w.tf(x, 0, z, a); T.add('f', capsule(16), c, 0, 0.35, 0, PI / 2, 0, 0, 1.2, 2.6, 0.6); T.add('f', sph(14), 0xffffff, 0, 0.75, 1.2, 0, 0, 0, 0.7, 0.35, 0.6); });
  { const T = w.tf(-12, 0, 22.5, -0.2); [-1.6, 1.6].forEach((x) => { T.box('g', 0x1e3a8a, x, 0, 0, 1.4, 1.1, 3.6, 0.5); T.box('m', 0xffffff, x, 0, 0, 1.5, 0.3, 3.7, 0.12); T.box('f', 0xffffff, x, 1.0, -0.6, 0.9, 0.12, 1.4, 0.05); }); T.solid(-2.4, 0, -1.9, 2.4, 1.2, 1.9); }
  { const T = w.tf(-7.5, 0, 19, 0.6); T.add('g', capsule(14), 0xfef3c7, 0, 0.45, 0, PI / 2, 0, PI / 2, 0.6, 2.2, 0.6); [-1, 1].forEach((s) => [-0.4, 0.4].forEach((z) => T.add('g', sph(14), 0xfef3c7, s * 1.5, 0.45, z, 0, 0, 0, 0.5))); }
  { const T = w.tf(-4, 0, 14.5, 0.25); const cs = [0xef4444, 0x3b82f6, 0x22c55e, 0xf59e0b, 0x8b5cf6]; for (let i = 0; i < 5; i++) { T.box('m', cs[i], (i % 2) * 0.3, i * 0.75, 0, 4.2 - i * 0.2, 0.7, 3, 0.08); T.box('m', 0xfffbeb, (i % 2) * 0.3 + 0.1, i * 0.75 + 0.08, 0, 4 - i * 0.2, 0.54, 2.8, 0.04); } T.solid(-2.1, 0, -1.6, 2.4, 3.75, 1.6); }
  { const x = -29.5, z = -13; w.add('g', lathe([[0, 0], [2.6, 0], [3.0, 4.2], [3.15, 4.4], [0, 4.4]], 28), 0x93c5fd, x, 0, z); for (let k = 0; k < 4; k++) w.add('f', blobGeo(k + 31, 0.3, 2), [0xf472b6, 0xfbbf24, 0xffffff, 0x34d399][k], x + Math.cos(k * 1.7) * 1.2, 4.3, z + Math.sin(k * 1.7) * 1.2, 0, k, 0, 1.5, 0.7, 1.3);
    w.add('f', capsule(12), 0xa78bfa, x + 3.2, 2, z + 1, 0, 0, 0.4, 0.5, 3.2, 0.3); w.solid(x - 3, 0, z - 3, x + 3, 4.4, z + 3); }
  { const T = w.tf(16, 0, -1.5, 0.3); T.add('f', rbox(6, 1.4, 6, 0.6, 3), 0xfbbf24, 0, 0.7, 0); T.add('f', sph(12), 0xf59e0b, 0, 1.42, 0, 0, 0, 0, 0.4, 0.15, 0.4); T.solid(-3, 0, -3, 3, 1.4, 3); }
  { const T = w.tf(8, 0, -17, -0.5); T.box('g', 0x22c55e, 0, 0.5, 0, 2.2, 0.9, 4, 0.35); T.box('e', 0xbfe8ff, 0, 1.4, -0.2, 1.8, 0.7, 2, 0.3); [[-1.1, -1.3], [1.1, -1.3], [-1.1, 1.3], [1.1, 1.3]].forEach(([x, z]) => T.add('g', rcyl(0.55, 0.4, 0.1, 18), 0x111827, x, 0.55, z, 0, 0, PI / 2)); T.solid(-1.2, 0, -2, 1.2, 2.1, 2); }
  { const T = w.tf(-25.5, 0, 9.5, 0.4); T.box('g', 0x111827, 0, 0, 0, 1.7, 0.18, 3.4, 0.2); T.box('l', 0x7dd3fc, 0, 0.18, 0, 1.4, 0.02, 2.9, 0.1, 0.3); }
  w.add('g', tube([[-25.5, 0.12, 11.2], [-25, 0.12, 13.5], [-28, 0.12, 15], [-31, 0.12, 14.5], [-31.6, 0.6, 12]], 0.1, 40, 8), 0xffffff, 0, 0, 0);
  // little side table with a lamp + plant between the windows
  { const T = w.tf(-30, 0, 8, 0); T.add('m', rcyl(1.8, 0.3, 0.1, 28), 0xa16207, 0, 4.6, 0); T.add('m', cyl(12), 0x92400e, 0, 0, 0, 0, 0, 0, 0.25, 4.6, 0.25); T.add('m', rcyl(1.1, 0.2, 0.08, 24), 0x92400e, 0, 0, 0); T.solid(-1.8, 4.3, -1.8, 1.8, 4.9, 1.8); T.solid(-0.4, 0, -0.4, 0.4, 4.6, 0.4); PR.plant(w, -30, 4.9, 8, 0.6, 0x8b5cf6); }
  PR.scatter(w, -31, -24, 30, 24, 60, 'home');
}

// =====================================================================================  6. TOY ROOM
BUILD.toyroom = (w) => {
  w.room(64, 56, 26, { wall: 0xfde2f3, wallN: 0xdbeafe, wallE: 0xe9d5ff, ceil: 0xfff7fb, floor: (a, b, c, d) => PR.floorPlanks(w, a, b, c, d, 0, [0xf2c48d, 0xe9b67a, 0xf7d19e, 0xe2ad70]) });
  w.start = [-26, 0, 22]; w.startYaw = PI * 0.85; w.cp(-29, 0, 24, PI * 0.85);
  w.hint(-32, 14, -16, 28, '🧸 Blocktopia! Climb the block stairs to the bed. The mattress is SUPER bouncy!');
  PR.rug(w, -16, 12, 0, 20, 14, 0xa855f7, 0xf3e8ff);
  // block staircase
  [[-22, 0, 14, 2.2], [-19.6, 0, 12, 2.2], [-19.6, 2.2, 12, 2.2], [-17.2, 0, 9.6, 2.2], [-17.2, 2.2, 9.6, 2.2], [-17.2, 4.4, 9.6, 2]].forEach(([x, y, z, s], i) => PR.toyBlock(w, x, y, z, s, i * 0.3));
  w.crumbLine(-24, 0, 18, -22, 2.2, 14, 3); w.crumbLine(-19.6, 4.4, 12, -17.2, 6.4, 9.6, 3); w.enemy('windup', -14, 0, 16, { axis: 'x', range: 4 });
  // bed (bounce) + headboard shelf
  PR.bed(w, -18, -8, 0, 0x60a5fa, 0xfef3c7); w.crumbArc(-20, 5, -2, -16, 5, -14, 4, 6); w.cheese(-12, 5.4, -4); w.part(-23, 5, -16);
  PR.teddy(w, -14, 4.4, -16, 0.3, 1.2); w.cp(-24, 0, 4, PI);
  shelf(w, -8, 14, -25, 12, 4, 0xf9a8d4); w.crumbLine(-13, 14, -24, -3, 14, -24, 5); w.baby(-4, 14, -24.5); PR.toyBlock(w, -12, 14, -25, 1.2); PR.toyBlock(w, -10.6, 14, -25, 1.2, 0.4);
  w.hint(-28, -21, -8, 4, '🛏️ Bounce high on the bed to reach the pink shelf!', -1, 30);
  PR.nightstand(w, -28.5, -16, PI / 2); w.baby(-28.5, 5, -16); w.part(-14, 8.1, -16); w.part(-12, 15.2, -25); w.cheese(23, 4.4, 10.2); PR.lamp(w, -28.5, 4, 0, 10, 0xf0abfc);
  // block castle
  const cast = (x, z, H, s = 2.4) => { for (let y = 0; y < H; y += s) PR.toyBlock(w, x, y, z, s, (x + y) * 0.2); return H; };
  cast(6, -12, 4.8); cast(10, -12, 7.2); cast(14, -12, 9.6); cast(18, -14, 12); cast(14, -18, 12); w.slab('g', 0xfacc15, 16, 12, -16, 7, 0.6, 7, 0.2);
  w.add('g', cone(20), 0xff4fa0, 18, 12.6, -14, 0, 0, 0, 1.5, 3, 1.5); w.add('g', cone(20), 0x3b82f6, 14, 12.6, -18, 0, 0, 0, 1.5, 3, 1.5); w.add('x', star(), 0xffd23f, 18, 16.6, -14, 0, 0, 0, 0.6);
  w.lever('gate', 15.5, 12.6, -15, 0); w.part(13.5, 12.6, -14.5); w.crumb(6, 4.8, -12); w.crumb(10, 7.2, -12); w.crumb(14, 9.6, -12); w.cp(6, 4.8, -12, PI / 2);
  w.hook(2, 10, -16); w.hint(-4, -24, 22, -6, '🏰 Climb the block castle and pull the lever on top!', -1, 30); w.enemy('bot', 10, 0, -6, { axis: 'x', range: 6 });
  // shelf to castle connection from the pink shelf
  P(w, 0, 12, -22, 3, 3, 0x7dd3fc, 0.6); w.crumb(0, 12, -22);
  // rocking horse, ball, crayons
  PR.rockingHorse(w, 26, -18, -0.6); w.part(26, 5.2, -18); PR.ball(w, 24, 0, -4, 2.2, 0x22c55e, 0xfef08a); w.enemy('toycar', 20, 0, -2, { axis: 'z', range: 5 });
  for (let i = 0; i < 6; i++) { const c = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x3b82f6, 0xa855f7][i]; w.add('g', cyl(16), c, -6 + i * 1.3, 0.6, 4, PI / 2, 0, 0, 0.6, 7, 0.6); w.add('g', cone(16), c, -6 + i * 1.3, 0.6, 0.5, -PI / 2, 0, 0, 0.6, 1.2, 0.6); }
  w.solid(-6.8, 0, 0.5, 0.8, 1.2, 7.5); w.crumbLine(-6, 1.2, 6, 0.4, 1.2, 1.4, 4);
  // toy train on a loop of track (moving platform)
  w.add('x', rbox(46, 0.12, 0.3, 0.05), 0x9ca3af, -4, 0.06, 7.2); w.add('x', rbox(46, 0.12, 0.3, 0.05), 0x9ca3af, -4, 0.06, 9.4);
  w.mover(-24, 0, 8.3, [6, 2, 3.2], [36, 0, 0], 12, 0, 0x3b82f6, (T, sub, sz) => { T.box('g', 0x3b82f6, 0, 0, 0, sz[0], sz[1], sz[2], 0.4); T.add('g', cyl(20), 0xef4444, 1.5, 2, 0, 0, 0, 0, 0.6, 1.4, 0.6); T.box('g', 0xfacc15, -1.5, 2, 0, 2.4, 1.6, 2.6, 0.3); [-2, 0, 2].forEach((a) => [-1, 1].forEach((b) => T.add('m', rcyl(0.6, 0.3, 0.1, 16), 0x111827, a, 0.6, b * 1.65, PI / 2, 0, 0))); });
  w.cheese(8, 0, 12.5); w.heartP(-2, 0, 14);
  // toy chest + window
  PR.trunk(w, 27, 8, -PI / 2, 0xec4899); w.baby(27, 5.3, 8); PR.toyBlock(w, 23, 0, 8, 2.2); PR.toyBlock(w, 23, 2.2, 10.2, 2.2, 0.5); w.crumbLine(21, 0, 6, 23, 4.4, 10.2, 3);
  PR.window(w, 'z', 31.4, -6, 10, 7, 17, -1, 0xc4b5fd); PR.bookshelf(w, 30, -24, -PI / 2, 8, 12, 3); w.solid(28.4, 0, -28, 31.6, 12, -20);
  w.frameArt('z', -32, -4, 12, 5, 4, 1, 1); w.frameArt('z', -32, 8, 13, 4, 3.4, 1, 0);
  // block-wall boss arena (play mat)
  const bc = 0x60a5fa; w.slab('g', bc, 15, 0, 14.4, 2, 5, 9, 0.3); w.slab('g', bc, 15, 0, 26, 2, 5, 3.5, 0.3); w.slab('g', 0xf472b6, 23.5, 0, 9.6, 17, 5, 2, 0.3);
  w.door('gate', 15, 0, 21, 2, 5, 6.5, ['gate'], 0xfacc15, '🤖 The play mat is open! Clanky the Wind-Up Bot wakes up...');
  w.hint(4, 14, 14, 27.5, '🔒 Closed! The lever is on top of the block castle.', -1, 6);
  PR.rug(w, 24, 19, 0, 14, 14, 0x22c55e, 0xdcfce7); w.cp(12, 0, 21, PI / 2);
  w.bossSpec = { type: 'clanky', x: 25, y: 0, z: 19, yaw: -PI / 2, arena: [16.2, 10.8, 31.4, 27.4] }; w.goldPos = [23, 1.6, 19];
  w.env = { sunDir: [0.3, 0.8, 0.5], exposure: 0.95 };
};

// =====================================================================================  7. ATTIC
BUILD.attic = (w) => {
  w.room(76, 44, 22, { wall: 0x8b6b4a, wallN: 0x7a5c3e, ceil: 0x6b4f35, lamp: false, floor: (a, b, c, d) => { w.add('f', rbox(c - a, 0.6, d - b, 0.2), 0xf9a8d4, (a + c) / 2, -0.3, (b + d) / 2); for (let i = 0; i < 70; i++) w.add('f', blobGeo(i + 7, 0.25, 1), [0xf9a8d4, 0xfbcfe8, 0xf472b6][i % 3], a + ((i * 41) % 72) + 2, 0.2, b + ((i * 29) % 40) + 2, 0, i, 0, 2.2, 0.9, 2.2); } });
  w.killY = 1.2; w.camDist = 7;
  const plank = (x, z, sx, sz, y = 2.5) => { P(w, x, y, z, sx, sz, 0xb7854f, 0.6, 'm'); for (let i = 0; i < Math.floor(sx / 2); i++) w.add('m', rbox(0.08, 0.04, sz - 0.2, 0.02), 0x8b5a2b, x - sx / 2 + 1 + i * 2, y + 0.01, z); for (let x2 = x - sx / 2 + 1; x2 < x + sx / 2; x2 += 6) for (let z2 = z - sz / 2 + 1; z2 < z + sz / 2; z2 += 6) w.add('m', rbox(0.8, y - 0.6, 0.8, 0.1), 0x6b4f35, x2, (y - 0.6) / 2, z2); };
  // joists across the pink fluff (rafters below)
  for (let i = 0; i < 10; i++) w.add('m', rbox(0.9, 0.9, 42, 0.1), 0x9a6a3e, -34 + i * 7.6, 0.45, 0);
  plank(-31, 0, 12, 18); w.start = [-33, 2.5, 4]; w.startYaw = PI / 2; w.cp(-36, 2.5, 1, PI / 2);
  w.hint(-38, -10, -25, 10, '🌙 The Attic! Walk the wooden beams. Don\u2019t fall in the fluffy pink insulation!', -1, 30);
  PR.trunk(w, -33, -6, 0, 0x7c3aed); PR.suitcase(w, -33, 5.3, -6, 0.2, 0x0ea5e9); w.part(-33, 7.1, -6); PR.toyBlock(w, -28.5, 2.5, -6.5, 2, 0.4);
  PR.lantern(w, -27, 2.5, 7); w.crumbLine(-30, 2.5, 4, -26, 2.5, 0, 3); w.crate(-35, 2.5, 7.5);
  // beams to island 2 / 3
  PR.beam(w, -25, 1, -2, -16, -2, 1.5, 0x8b5a2b); w.crumbLine(-24, 2.5, -2, -17, 2.5, -2, 4); plank(-10, -10, 12, 14);
  PR.beam(w, -25, 1, 6, -16, 6, 1.5, 0x8b5a2b); plank(-10, 10, 12, 12);
  w.enemy('moth', -10, 5, -10, { range: 3 }); PR.globe(w, -12, 2.5, -14); PR.suitcase(w, -6, 2.5, -14, 0.3, 0xf59e0b); PR.suitcase(w, -6.4, 4.3, -13.6, -0.2, 0x10b981); w.baby(-6.4, 6.1, -13.6); PR.toyBlock(w, -8.6, 2.5, -10.8, 1.8, 0.2);
  PR.rockingHorse(w, -12, 12, 0.8); w.part(-12, 5.2, 12); w.part(-12, 6.5, -14); w.cheese(34, 2.5, -10); w.cheese(-27, 2.5, 3); PR.cardboard(w, -6, 2.5, 12, 0.2, 4, 3.5, 4, true); w.cheese(-6, 6, 12); w.enemy('moth', -10, 5, 10, { range: 3 }); w.cp(-14, 2.5, -6, PI / 2);
  for (let i = 0; i < 4; i++) PR.web(w, -37.5, 18 - i * 2, -21.5 + i * 12, 0, 3 + i);
  // rafters with hooks (high route)
  [-20, -10, 0, 10, 20].forEach((x, i) => { w.add('m', rbox(1.2, 1.2, 44, 0.1), 0x7a5c3e, x, 16, 0); }); P(w, 0, 13, -16, 6, 4, 0xb7854f, 0.6, 'm'); w.hook(-4, 15, -14); w.hook(6, 15, -12);
  w.part(0, 13, -16); w.crumbLine(-2, 13, -16, 2, 13, -16, 3); P(w, 10, 11, -12, 4, 4, 0xb7854f, 0.6, 'm'); PR.lantern(w, 10, 11, -12); w.baby(11.2, 11, -10.6);
  w.hint(-4, -16, 4, -4, '🪝 Zip up to the rafters with the HOOK for a secret!', -1, 30);
  // beam over the gap to the big island
  PR.beam(w, -4, 1, 0, 6, 0, 1.4, 0x8b5a2b); PR.beam(w, -4, 1, -10, 6, -10, 1.4, 0x8b5a2b); w.crumbLine(-3, 2.4, 0, 5, 2.4, 0, 4);
  w.enemy('moth', 2, 4, -4, { range: 3 });
  // mid island with Christmas boxes
  plank(12, -4, 10, 22); PR.cardboard(w, 12, 2.5, -12, 0.3, 4, 3, 4); PR.cardboard(w, 12.5, 5.5, -12, -0.2, 3, 2.6, 3); w.baby(12.5, 8.1, -12); w.cp(10, 2.5, 0, PI / 2);
  for (let i = 0; i < 6; i++) w.add('l', sph(10), [0xef4444, 0x22c55e, 0xffd23f, 0x3b82f6][i % 4], 8 + i * 1.6, 6 + Math.sin(i) * 0.4, 6.6, 0, 0, 0, 0.3, 0.4, 0.3, 0.9);
  w.add('x', cyl(6), 0x14532d, 12, 6.2, 6.6, 0, 0, PI / 2, 0.04, 10, 0.04); PR.suitcase(w, 13.5, 2.5, 4, 0.4, 0xef4444); w.part(13.5, 4.3, 4); w.crumbLine(12, 2.5, -1, 12, 2.5, -8, 4);
  // arena island
  PR.beam(w, 17, 1, 2, 22, 2, 1.4, 0x8b5a2b); plank(29.5, 2, 15, 30); w.cp(19.5, 2.4, 2, PI / 2);
  PR.lantern(w, 23, 2.5, -12); PR.lantern(w, 36, 2.5, 16); PR.lantern(w, 36, 2.5, -12);
  w.add('e', torus(0.12, 40), 0xfef3c7, 37.6, 13, 2, 0, PI / 2, 0, 5, 5, 5); w.add('l', rcyl(4.8, 0.2, 0.05, 40), 0xc7d2fe, 37.8, 13, 2, 0, 0, PI / 2, 1, 1, 1, 0.5);
  w.bossSpec = { type: 'kitty', x: 31, y: 2.5, z: 2, yaw: -PI / 2, arena: [22.5, -12.5, 36.8, 16.5] }; w.goldPos = [29, 4.1, 2];
  lit(w, -31, 8, 0, 0xffc46b, 50, 35); lit(w, -10, 10, 0, 0xffb86b, 50, 40); lit(w, 12, 10, -4, 0xffc46b, 50, 35); lit(w, 30, 12, 2, 0xc7d2fe, 70, 45);
  w.env = { skyTop: 0x1e1b4b, skyMid: 0x312e81, skyBot: 0x4c1d95, fog: 0x3b2a4a, fogD: 0.006, sunDir: [-0.6, 0.6, 0.2], sunColor: 0xc7d2fe, sunI: 1.5, hemiSky: 0xffd9a8, hemiGround: 0x5b3a2a, hemiI: 0.95, exposure: 1.1, bloomT: 0.8 };
};
