// Expedition 2: Crystal Owl Caverns (Glimmer Caves). Canyon camp -> mine tunnel (runaway cart) -> crystal grotto (river, patrol)
// -> brazier hall (light 3 braziers, spike strips, steam vents) -> owl statue chamber -> Drill-o-Matic arena -> escape to the mine lift.
import { BUILD, PI, jeep } from './levels.js';
import { PR } from './lvlkit.js';
import { rbox } from './world.js';
import { sph, cyl, cone, blobGeo } from './shapes.js';
import { textGeo } from './text3d.js';
import { rnd, rr, pick, shade, mix, fbm } from './props.js';
const ROCK = 0x6b5b7b, ROCK2 = 0x7d6d90, CR = [0xa78bfa, 0x67e8f9, 0xf0abfc, 0x93c5fd];
const dirt = (x, z) => mix(mix(0xb08968, 0x8d6e53, fbm(x * 0.2, z * 0.2)), 0xc9a27a, fbm(x * 0.9 + 3, z * 0.9) * 0.3);
const caveF = (x, z) => mix(mix(0x5b4d6b, 0x463a56, fbm(x * 0.25, z * 0.25)), 0x7c6a94, fbm(x * 1.1, z * 1.1 + 5) * 0.35);
const room = (w, x0, z0, x1, z1, h, doors, o = {}) => PR.stoneRoom(w, x0, z0, x1, z1, h, o.col || ROCK, Object.assign({ doors, ceilCol: 0x3f3550, wall: { col2: ROCK2, bh: 0.9, bl: 1.6, skip: 0.25 } }, o));
const rockWall = (w, x0, z0, x1, z1, y0, y1, n) => { for (let i = 0; i < n; i++) PR.caveRock(w, rr(x0, x1), rr(y0, y1), rr(z0, z1), rr(1.2, 2.2), ROCK); };
const crystals = (w, x0, z0, x1, z1, n, keep) => { for (let i = 0; i < n; i++) { const x = rr(x0, x1), z = rr(z0, z1); if (keep && keep(x, z)) continue; PR.crystal(w, x, 0, z, 0.7 + rnd() * 0.8, pick(CR), rnd() < 0.3); } };
BUILD.caves = (w) => { w.music = 'caves'; w.killY = -12; w.camDist = 4.6; w.dark = true; w.fillI = 3.2; w.lightN = 6;
  w.env = { sunDir: [-0.5, 0.45, 0.6], sunColor: 0xffc08a, sunI: 1.7, hemiSky: 0xb7a6e6, hemiGround: 0x3b2f4a, hemiI: 0.6, skyTop: 0x312e81, skyMid: 0xc084fc, skyBot: 0xffc49a, fog: 0x2b2342, fogD: 0.011, envI: 0.6, exposure: 1.06, bloomT: 0.95, bloomS: 0.62, envLight: 0xe9d5ff };
  w.start = [0, 0, 58]; w.startYaw = PI; w.grassKeep = (x, z) => Math.abs(x) < 3.5;
  // ---------------- A: canyon camp at dusk (z 66..33) ----------------
  PR.ground(w, -30, 33, 30, 66, 0, dirt, { bump: 0.2 }); w.solid(-31, 0, 66, 31, 14, 67, { nocam: true }); w.solid(-31, 0, 33, -30, 14, 66, { nocam: true }); w.solid(30, 0, 33, 31, 14, 66, { nocam: true });
  for (const [x0, x1] of [[-30, -5], [5, 30]]) PR.stoneWall(w, 'x', 32.5, x0, x1, 16, ROCK, { col2: ROCK2, bh: 1.2, bl: 2.2 });
  rockWall(w, -30, 31, -5, 34, 0, 15, 26); rockWall(w, 5, 31, 30, 34, 0, 15, 26); rockWall(w, -31, 34, -28, 66, 0, 9, 20); rockWall(w, 28, 34, 31, 66, 0, 9, 20); rockWall(w, -6, 31.5, 6, 32.6, 8.2, 15, 8);
  PR.mineSupport(w, 0, 0, 33.2, 0, 6.6, 5.2); const sg = textGeo('GLIMMER MINE', 0.55, 0.15); if (sg) { w.add('m', rbox(6.4, 1.1, 0.25, 0.08, 1), 0x6b4423, 0, 6.35, 33.5); w.add('m', sg, 0xfacc15, 0, 6.1, 33.7); }
  PR.lantern(w, -3.4, 4.4, 34, 0xffd27a); PR.lantern(w, 3.4, 4.4, 34, 0xffd27a);
  jeep(w, 9, 0, 58, -0.5); PR.crate(w, 5, 0, 61); PR.crate(w, 6.3, 0, 61.4, 0.8, 0xa0703a); PR.barrel(w, 13, 0, 62, 0x7c3aed);
  const tent = (x, z, ry, col) => { const T = w.tf(x, 0, z, ry); T.add('f', cone(4), col, 0, 0, 0, 0, PI / 4, 0, 2.4, 2.6, 2.4); T.add('m', cyl(8), 0x6b4423, 0, 0, 0, 0, 0, 0, 0.05, 2.9, 0.05); T.solid(-1.6, 0, -1.6, 1.6, 2.2, 1.6); };
  tent(-12, 54, 0.5, 0x8b5cf6); tent(-17, 46, 1.0, 0x0ea5e9); tent(15, 46, -0.6, 0xf59e0b);
  { const x = -3, z = 48; w.add('m', sph(16), 0x57534e, x, 0, z, 0, 0, 0, 1.0, 0.25, 1.0); w.add('l', cone(14), 0xffa53d, x, 0.3, z, 0, 0, 0, 0.5, 1.1, 0.5, 1.6); w.lights.push({ x, y: 1.5, z, c: 0xff9a3c, i: 18, d: 16 }); w.solid(x - 0.8, 0, z - 0.8, x + 0.8, 0.5, z + 0.8); }
  for (const [x, z] of [[-22, 60], [22, 58], [-24, 40], [24, 38], [18, 52], [-8, 38]]) PR.rock(w, x, 0, z, 0.8 + rnd() * 0.8, 0x8d7a66, true);
  for (let i = 0; i < 14; i++) { const x = pick([-1, 1]) * rr(6, 27), z = rr(36, 64); PR.mushroom(w, x, 0, z, 0.8 + rnd() * 0.6, pick([0x22d3ee, 0xf0abfc])); }
  PR.grassTufts(w, -28, 35, 28, 65, 0.02, 300, 0x84cc16);
  w.martinaSpec = { x: -6, y: 0, z: 51, yaw: 0.8, s: 0.42, label: '🐢 Talk to Torty' };
  w.martinaSay = () => { const L = ['"Torty here! The Crystal Owl is hidden at the bottom of Glimmer Mine. It\u2019s DARK in there: keep your TORCH lit!"', '"Bats hate torchlight. Hold it up and they flap away."', '"The old miners lit three braziers to open the deep doors. Find them!"', '"I heard a big DRILLING noise down there. Professor Vintage again, I bet."']; w._mi = ((w._mi ?? -1) + 1) % L.length; return L[w._mi]; };
  w.talk(-9, 45, 6, 54, 'martina', '"Explorer! Torty again! Press ACT next to me for cave tips."');
  for (let z = 54; z > 36; z -= 3) w.coin(0, 0, z); PR.rock(w, 17, 0, 40, 1.6, 0x8d7a66, true); w.treasure(19.5, 0, 38); w.animal('snake', 17, 0, 36, { range: 3, axis: 'x' });
  w.hint(-5, 36, 5, 42, '🔥 Caves ahead! Tap TORCH to light it. It also scares bats and lights braziers.');
  w.cp(0, 0, 36, PI);
  // ---------------- B: mine tunnel with a runaway cart (z 32..-8) ----------------
  PR.ground(w, -3, -8, 3, 32, 0, caveF, { bump: 0.05 }); room(w, -3, -8, 3, 32, 5, { S: [[-3, 3, 5]], N: [[-3, 3, 5]] }, { th: 1 });
  PR.rails(w, 0, 31.5, 0, -7.5, 0);
  for (let z = 28; z > -6; z -= 6) { PR.mineSupport(w, 0, 0, z, 0, 5.4, 4.6); PR.lantern(w, 0, 4.2, z - 3, 0xffd27a); }
  w.boulder([-3, 15, 3, 19], [[0, 0, -7.6], [0, 0, 31.6]], 1.4, { look: 'cart', sp: 9.5, delay: 1.1 });
  w.hint(-3, 19, 3, 23, '🛒 Rails = runaway carts! If you hear a rumble, step to the side of the tracks.');
  for (let z = 26; z > -6; z -= 4) w.coin(-2.2, 0, z); w.evidence(2.3, 0, 2); w.animal('bat', 0, 2.6, 10, { range: 3 }); w.animal('bat', 0, 2.6, -2, { range: 3 });
  w.cp(0, 0, 28, PI, 1.8); w.cp(0, 0, 6, PI, 1.8);
  // ---------------- C: crystal grotto + underground river (z -10..-62) ----------------
  room(w, -22, -62, 22, -10, 12, { S: [[-3, 3, 5]], N: [[-3, 3, 5]] });
  PR.ground(w, -22, -34, 22, -10, 0, caveF, { bump: 0.12 }); PR.ground(w, -22, -62, 22, -42, 0, caveF, { bump: 0.12 });
  PR.river(w, -22, -42, 22, -34, -0.4, { col: 0x38bdf8, bed: 0x1e3a8a });
  for (const [x, z] of [[9, -35.6], [11.5, -38], [9, -40.4]]) PR.mossyBlock(w, x, -1.2, z, 1.6, 1.3, 1.6, ROCK2);
  PR.mossyBlock(w, 16, -1.2, -38, 3, 1.5, 3, ROCK2); w.treasure(16, 0.3, -38); w.coinLine(9, 0.2, -35.6, 9, 0.2, -40.4, 3);
  w.hook(0, 7.2, -38, false); w.add('m', cyl(8), 0xc2a26f, 0, 9.6, -38, 0, 0, 0, 0.04, 2.4, 0.04); PR.stalactite(w, 0, 12, -38, 2);
  w.hint(-4, -33, 4, -28, '🪢 A golden ring over the water: run and tap WHIP to swing. Or hop the stones on the right!'); w.coinLine(0, 1.4, -35, 0, 1.4, -41, 4);
  for (let i = 0; i < 26; i++) PR.stalactite(w, rr(-21, 21), 12, rr(-61, -11), rr(1.2, 3.2), 0x8b7aa0);
  for (const [x, z, h] of [[-16, -14, 2.6], [15, -16, 3.2], [-19, -30, 2.2], [19, -28, 2.8], [-15, -50, 3], [14, -55, 2.4], [-6, -58, 1.8], [6, -46, 1.6]]) PR.stalagmite(w, x, 0, z, h);
  crystals(w, -21, -61, 21, -11, 46, (x, z) => Math.abs(x) < 5 || (z < -33 && z > -43) || (x < -12 && x > -20 && z < -16 && z > -26));
  rockWall(w, -22.5, -61, -20.5, -11, 0, 11, 16); rockWall(w, 20.5, -61, 22.5, -11, 0, 11, 16);
  for (let i = 0; i < 16; i++) PR.mushroom(w, pick([-1, 1]) * rr(6, 20), 0, pick([rr(-32, -12), rr(-60, -44)]), 0.7 + rnd() * 0.7, pick([0x22d3ee, 0xf0abfc, 0xa3e635]));
  // crystal ledge treasure: two hops up
  PR.mossyBlock(w, -15.5, 0, -18.5, 2.2, 1.2, 2.2, ROCK2); PR.mossyBlock(w, -18, 0, -21.5, 2.4, 2.4, 2.4, ROCK2); w.treasure(-18, 2.4, -21.5); PR.crystal(w, -19, 2.4, -22.4, 1, 0xf0abfc, true);
  // a Relic Patrol officer lost in the grotto with his flashlight
  w.officers([{ x: -8, z: -18, path: [[-8, -18], [8, -18], [8, -27], [-8, -27]] }], [-21, -33, 21, -11]);
  for (const [x, z] of [[-5, -14], [5, -23], [-11, -30], [12, -13]]) w.hideSpot(x, 0, z, 'crate');
  w.talk(-5, -15, 5, -11, 'patrol', '"Officer Noodle here. Is that... a TORCH? Only a thief would explore a dark cave! (Please don\u2019t tell anyone I\u2019m scared of bats.)"');
  w.animal('spider', -12, 0, -50, { range: 3 }); w.animal('spider', 12, 0, -48, { range: 3 }); w.animal('bat', -6, 3, -52, { range: 4 }); w.animal('bat', 8, 3, -20, { range: 4 });
  w.evidence(18, 0, -59); w.heartP(-18, 0, -58); for (let z = -44; z > -60; z -= 3) w.coin(0, 0, z);
  w.cp(0, 0, -12.5, PI); w.cp(0, 0, -44, PI);
  // ---------------- D: brazier hall (z -64..-96) ----------------
  room(w, -16, -96, 16, -64, 8, { S: [[-3, 3, 5]], N: [[-2.5, 2.5, 5.2]] }, { col: ROCK2, beams: 6 });
  PR.tiles(w, -16, -96, 16, -64, 0, [0x6b6178, 0x5d546a, 0x776c86], 2, { wobble: true });
  w.brazier('b1', -12, 0, -69); w.brazier('b2', 12, 0, -69); w.brazier('b3', 0, 0, -91);
  for (let i = 0; i < 4; i++) w.spikes(-16 + i * 8, -81, -8 + i * 8, -77, 0, 3.0, (i % 2) * 0.5, 0.42);
  w.jet(-4, 0, -86, 2.6, 0, 'steam'); w.jet(4, 0, -86, 2.6, 0.5, 'steam'); w.jet(-10, 0, -88, 3, 0.25, 'steam'); w.jet(10, 0, -88, 3, 0.75, 'steam');
  w.door('bDoor', 0, 0, -96.5, 5, 5.2, 1.1, ['b1', 'b2', 'b3'], 0x5d546a, '🔥 All three braziers burn... the deep door opens!');
  PR.relief(w, 'x', -95.9, -9, 2.2, 6, 2.6, 1, 0xa78bfa, 'sun'); PR.relief(w, 'x', -95.9, 9, 2.2, 6, 2.6, 1, 0xa78bfa, 'sun');
  w.hint(-6, -70, 6, -65, '🔥 Light all THREE braziers with your torch (stand next to one, press ACT) to open the far door!');
  for (const [x, z] of [[-15, -66], [15, -66], [-15, -94], [15, -94]]) PR.crystal(w, x, 0, z, 1.1, pick(CR), true);
  for (let i = 0; i < 10; i++) PR.stalactite(w, rr(-15, 15), 8, rr(-95, -65), rr(0.8, 1.8), 0x8b7aa0); for (const [x, z] of [[-15, -80], [15, -76], [-15, -86]]) PR.urn(w, x, 0, z, 1, 0x7c3aed);
  w.treasure(-14, 0, -92); w.animal('bat', -12, 3, -90, { range: 2 }); w.coinRing(0, 0, -72, 2.4, 8); w.coinLine(-12, 0, -84, 12, 0, -84, 7);
  w.cp(0, 0, -66.5, PI); w.cp(0, 0, -83, PI);
  // ---------------- E: owl statue chamber (z -98..-118) ----------------
  room(w, -14, -118, 14, -98, 8, { S: [[-2.5, 2.5, 5.2]], N: [[-2, 2, 4]] });
  PR.tiles(w, -14, -118, 14, -98, 0, [0x6b6178, 0x5d546a, 0x776c86], 2, { wobble: true });
  PR.relief(w, 'x', -118, 0, 4.3, 8, 2.4, 1, 0xa78bfa, 'mix'); const og = textGeo('THE OWLS SEE THE STARS', 0.32, 0.08); if (og) w.add('m', og, 0xc4b5fd, 0, 7.0, -117.9);
  w.statue('o1', 'owls', -8, 0, -110, 1, 2, 'owl'); w.statue('o2', 'owls', 0, 0, -106, 3, 2, 'owl'); w.statue('o3', 'owls', 8, 0, -110, 0, 2, 'owl');
  w.door('oDoor', 0, 0, -118.5, 4, 4, 1.05, ['S:owls'], 0x5d546a, '🦉 Hoo-hoo! The owl door slides open!');
  w.hint(-14, -104, 14, -99, '🦉 Turn the three owl statues (ACT) so they all look at the starry mural on the far wall!');
  for (const x of [-13.4, 13.4]) for (const z of [-102, -114]) PR.torchSconce(w, x, 3, z, x < 0 ? PI / 2 : -PI / 2, 0xc084fc);
  for (const [x, z] of [[-13, -116.5], [13, -116.5], [-13, -99], [13, -99]]) PR.crystal(w, x, 0, z, 1.1, pick(CR), false); for (let i = 0; i < 8; i++) PR.mushroom(w, pick([-1, 1]) * rr(10, 13), 0, rr(-116, -100), 0.6, pick([0x22d3ee, 0xf0abfc])); for (let i = 0; i < 8; i++) PR.stalactite(w, rr(-13, 13), 8, rr(-117, -99), rr(0.8, 1.6), 0x8b7aa0);
  w.evidence(12, 0, -100.5); w.treasure(-12, 0, -100.5); w.animal('spider', -11, 0, -103, { range: 2 }); w.cp(0, 0, -100, PI);
  // ---------------- F: Drill-o-Matic arena (z -120..-160) + escape to the mine lift ----------------
  room(w, -20, -160, 20, -120, 12, { S: [[-2, 2, 4]], E: [[-150, -144, 5]] });
  PR.tiles(w, -20, -160, 20, -120, 0, [0x5d546a, 0x4f475c, 0x6b6178], 2.4, { wobble: true });
  for (const [x, z] of [[-16, -126], [16, -126], [-16, -140], [16, -140], [-16, -154], [16, -154]]) PR.crystal(w, x, 0, z, 1.6, pick(CR), true);
  for (let i = 0; i < 14; i++) PR.stalactite(w, rr(-19, 19), 12, rr(-159, -121), rr(1.5, 3), 0x8b7aa0);
  PR.stairs(w, 0, 0, -153, PI, 3, 0.4, 0.9, 6, ROCK2); w.slab('m', ROCK2, 0, 0, -157.2, 6, 1.2, 3, 0.1); w.add('x', sph(24), 0xd4a017, 0, 1.2, -157.2, 0, 0, 0, 0.8, 0.1, 0.8);
  w.relicPos = [0, 2.6, -157.2]; w.bossSpec = { type: 'drill', x: 0, y: 0, z: -140, yaw: 0, arena: [-18, -151, 18, -123] };
  w.talk(-6, -125, 6, -120.5, 'vintage', '"Ah, you again! Say hello to my Drill-o-Matic 3000! It drills, it hops, it makes excellent coffee!"');
  for (const [x, z, h] of [[-12, -128, 2.4], [12, -152, 2.8], [-8, -156, 1.8], [10, -124, 1.6]]) PR.stalagmite(w, x, 0, z, h);
  for (const [x, z] of [[-18, -146], [18, -132]]) { PR.rails(w, x, z + 3, x, z - 3, 0); PR.minecart(w, x, 0, z, 0, true); }
  for (let i = 0; i < 12; i++) PR.mushroom(w, pick([-1, 1]) * rr(10, 19), 0, rr(-158, -122), 0.7 + rnd() * 0.6, pick([0x22d3ee, 0xf0abfc, 0xa3e635]));
  for (const [x, z] of [[-19, -122], [19, -158]]) { PR.crate(w, x, 0, z); PR.lantern(w, x, 1.2, z, 0xfde047, false); }
  w.coinRing(0, 0, -140, 6, 16); w.heartP(-17, 0, -130); w.heartP(17, 0, -150); w.cp(0, 0, -122, PI);
  room(w, 22, -152, 46, -142, 6, { W: [[-150, -144, 5]] }, { col: ROCK2 }); PR.ground(w, 20, -152, 46, -142, 0, caveF, { bump: 0.04 }); PR.rails(w, 23, -147, 45, -147, 0);
  for (let x = 26; x < 44; x += 6) { PR.mineSupport(w, x, 0, -147, PI / 2, 9, 5.2); PR.lantern(w, x + 3, 5, -147, 0xfde047); }
  { const x = 42.5, z = -147; w.add('x', rbox(4, 0.3, 5, 0.05, 1), 0x9ca3af, x, 0.15, z); for (const [a, b] of [[-1.9, -2.4], [1.9, -2.4], [-1.9, 2.4], [1.9, 2.4]]) w.add('x', cyl(8), 0x6b7280, x + a, 0, z + b, 0, 0, 0, 0.08, 5.6, 0.08); const lg = textGeo('LIFT ⬆ OUT', 0.42, 0.1); if (lg) w.add('m', lg, 0x86efac, x - 1.6, 4.6, z, 0, -PI / 2, 0); }
  w.escape = [40.5, -150, 45.5, -144, 0];
  w.chaseSpec = { list: [{ x: 0, z: -121.5 }, { x: -2, z: -122.5 }, { chief: true, x: 2, z: -122.5 }], bounds: [-19, -159, 45, -121] };
  for (const [x, z] of [[-12, -146], [12, -132], [30, -150.5]]) w.hideSpot(x, 0, z, 'crate');
};
