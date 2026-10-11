// Expedition 3: The Clockwork Subway (Old City Tunnels). Night street -> abandoned station (Relic Patrol sneaking) ->
// track-switch hall (2 levers, runaway handcar, steam pipes) -> flooded tunnel (falling walkway, whip swing) ->
// clockwork room (dart walls, spikes, clock-hand statues) -> depot arena vs. the Vintage Express -> escape up the service ladder.
import { BUILD, PI, jeep } from './levels.js';
import { PR } from './lvlkit.js';
import { rbox } from './world.js';
import { sph, cyl, cone, torus, gear } from './shapes.js';
import { textGeo } from './text3d.js';
import { rnd, rr, pick, shade, mix, fbm } from './props.js';
const BRICK = 0x9a4a2e, BRICK2 = 0xb45f3c, TILEW = [0xe7e5e4, 0xd6d3d1, 0xf5f5f4], TILEG = [0x4d7c6f, 0x3f6b5f, 0x5a8a7c];
const asphalt = (x, z) => Math.abs(x) < 7 ? mix(0x3f3f46, 0x52525b, fbm(x * 0.4, z * 0.4)) : mix(0x9ca3af, 0x8b929c, fbm(x * 0.6, z * 0.6));
const grime = (x, z) => mix(mix(0x57534e, 0x44403c, fbm(x * 0.3, z * 0.3)), 0x6b6560, fbm(x, z + 7) * 0.3);
const room = (w, x0, z0, x1, z1, h, doors, o = {}) => PR.stoneRoom(w, x0, z0, x1, z1, h, o.col || BRICK, Object.assign({ doors, ceilCol: 0x3f3a36, beams: o.beams, wall: { col2: BRICK2, bh: 0.6, bl: 1.3, skip: 0.08 } }, o));
const lamps = (w, x, z0, z1, step, y = 5.2, col = 0xfde68a) => { for (let z = z0; z > z1; z -= step) PR.lantern(w, x, y, z, col); };
BUILD.tunnels = (w) => { w.music = 'tunnels'; w.killY = -12; w.camDist = 4.6; w.dark = true; w.fillI = 3; w.lightN = 6;
  w.env = { sunDir: [0.3, 0.6, 0.5], sunColor: 0xbcd0ff, sunI: 1.3, hemiSky: 0x9fb4e6, hemiGround: 0x3a3430, hemiI: 0.62, skyTop: 0x0b1240, skyMid: 0x3b3f8f, skyBot: 0xf59e8b, stars: 1, fog: 0x1f2233, fogD: 0.010, envI: 0.6, exposure: 1.08, bloomT: 0.92, bloomS: 0.65, envLight: 0xdbeafe };
  w.start = [0, 0, 58]; w.startYaw = PI;
  // ---------------- A: Grokville old town street at night (z 66..34) ----------------
  PR.ground(w, -24, 34, 24, 66, 0, asphalt, { bump: 0 }); w.solid(-25, 0, 66, 25, 14, 67, { nocam: true });
  for (let z = 64; z > 36; z -= 4) w.add('m', rbox(0.25, 0.02, 1.8, 0.01, 1), 0xfde047, 0, 0.02, z);
  for (const s of [-1, 1]) { w.slab('m', 0xa8a29e, s * 9.5, 0, 50, 5, 0.18, 32, 0.04);
    for (let i = 0; i < 4; i++) { const z = 62 - i * 8, h = 9 + (i * 3 % 5), col = pick([0xc2703d, 0x9a4a2e, 0x7c6f64, 0xb45f3c, 0x64748b]), x = s * 16.5;
      w.slab('m', col, x, 0, z, 9, h, 7.6, 0.15); for (let fy = 1.6; fy < h - 1; fy += 2.4) for (const dz of [-2.2, 0, 2.2]) w.add(rnd() < 0.55 ? 'l' : 'm', rbox(0.1, 1.2, 1.1, 0.03, 1), rnd() < 0.55 ? 0xfde68a : 0x1e293b, x - s * 4.52, fy, z + dz, 0, 0, 0, 1, 1, 1, 0.9);
      w.add('f', rbox(0.9, 0.12, 6.6, 0.04, 1), pick([0xdc2626, 0x16a34a, 0x2563eb]), x - s * 4.9, 3.2, z, 0, 0, s * 0.35); }
    for (let z = 60; z > 36; z -= 10) { w.add('x', cyl(10), 0x374151, s * 7.6, 0, z, 0, 0, 0, 0.09, 4.6, 0.09); PR.lantern(w, s * 7.6, 4.8, z, 0xfde68a); } }
  w.solid(-25, 0, 34, -20.9, 14, 66, { nocam: true }); w.solid(20.9, 0, 34, 25, 14, 66, { nocam: true });
  jeep(w, 4, 0, 60, -0.3); PR.bench(w, -9.5, 0.18, 46, PI / 2); PR.barrel(w, 9.6, 0.18, 40, 0x16a34a); PR.crate(w, -9.4, 0.18, 38);
  // the sealed station entrance: a brick wall with an arched portal
  PR.stoneWall(w, 'x', 33.5, -21, 21, 12, BRICK, { holes: [[-3, 3, 5]], col2: BRICK2, bh: 0.6, bl: 1.3 }); { const sg = textGeo('OLD LINE 7 - CLOSED 1923', 0.42, 0.12); w.add('m', rbox(9, 1.0, 0.2, 0.06, 1), 0x1e3a8a, 0, 6.55, 34.0); if (sg) w.add('m', sg, 0xfef3c7, 0, 6.35, 34.12); }
  w.add('m', rbox(7.6, 0.7, 0.5, 0.1, 2), 0x57534e, 0, 5.35, 34.1); for (const x of [-3.4, 3.4]) w.add('m', rbox(0.7, 5, 0.5, 0.1, 2), 0x57534e, x, 2.5, 34.1); { const sg = 0; void sg; } for (const x of [-2.6, 0, 2.6]) w.add('f', rbox(2.6, 0.18, 0.04, 0.02, 1), 0xfacc15, x, 1.1 + (x === 0 ? 0.4 : 0), 34.2, 0, 0, x * 0.1);
  w.martinaSpec = { x: -5, y: 0, z: 50, yaw: 0.8, s: 0.42, label: '🐢 Talk to Torty' };
  w.martinaSay = () => { const L = ['"Torty reporting! The Clockwork Compass is hidden in the old Line 7 depot, deep under Grokville."', '"The Relic Patrol has officers in the station. Hide behind crates and barrels (ACT)!"', '"The track switches need BOTH levers pulled before the gate opens."', '"I heard a train whistle down there... but Line 7 closed a hundred years ago! Vintage?"']; w._mi = ((w._mi ?? -1) + 1) % L.length; return L[w._mi]; };
  w.talk(-9, 45, 3, 54, 'martina', '"Psst! Explorer! Torty here. Press ACT next to me for subway tips."');
  w.officers([{ x: -4, z: 44, path: [[-4, 44], [4, 44], [4, 40], [-4, 40]] }], [-20, 34, 20, 56]); w.hideSpot(-5.5, 0, 38, 'barrel'); w.hideSpot(5.5, 0, 47, 'crate');
  w.hint(-6, 52, 6, 56, '🚨 A Relic Patrol officer guards the old station. Sneak around the flashlight or hide (ACT).');
  for (let z = 54; z > 36; z -= 3) w.coin(2.5, 0, z); w.treasure(-9.5, 0.18, 62); w.animal('rat', 8, 0.18, 52, { range: 3 }); w.cp(0, 0, 36, PI);
  // ---------------- B: abandoned station platform (z 32..-14) ----------------
  room(w, -14, -14, 14, 32, 7, { S: [[-3, 3, 5]], N: [[-3, 3, 5]] }, { beams: 5 });
  PR.tiles(w, -4, -14, 14, 32, 0, TILEW, 1.0, { check: true }); PR.ground(w, -14, -14, -4, 32, 0, grime, { bump: 0 });
  w.add('m', rbox(0.4, 0.3, 46, 0.05, 1), 0xfacc15, -3.8, 0.02, 9); PR.rails(w, -9, 31, -9, -13, 0); PR.trainCar(w, -9, 0, 18, 0, 0x0f766e);
  for (const z of [26, 14, 2, -8]) { PR.pillar(w, -2, 0, z, 7, 0x4d7c6f, { r: 0.45, flutes: 0 }); PR.bench(w, 6, 0, z + 3, 0); }
  for (const z of [24, 8, -6]) { w.add('f', rbox(0.06, 2, 3, 0.02, 1), pick([0xfef3c7, 0xfde68a, 0xfecaca]), 13.45, 2.2, z); w.add('x', rbox(0.04, 1.6, 2.6, 0.01, 1), pick([0x1d4ed8, 0xdc2626, 0x7c3aed]), 13.42, 2.2, z); }
  { const T = w.tf(13.4, 4.4, 14, -PI / 2); T.add('m', torus(0.12, 40), 0xd4a017, 0, 0, 0, 0, 0, 0, 1.1, 1.1, 1); T.add('m', rcylX(), 0xfef3c7, 0, 0, 0.02, PI / 2, 0, 0, 1.0, 0.06, 1.0); }
  lamps(w, 5, 30, -14, 8, 6.2); lamps(w, -9, 26, -14, 10, 6.2, 0xbfdbfe);
  w.officers([{ x: 4, z: 20, path: [[4, 20], [10, 20], [10, 4], [4, 4]] }, { x: 8, z: -2, path: [[8, -2], [0, -2], [0, -10], [8, -10]] }], [-3.5, -13, 13, 31]);
  for (const [x, z] of [[1, 28], [12, 12], [2, 8], [12, -6], [-0.5, -12]]) w.hideSpot(x, 0, z, pick(['crate', 'barrel']));
  w.hint(-3, 27, 3, 31, '🫥 Two officers patrol the platform. Duck behind the crates and barrels between their flashlights!');
  w.evidence(11.8, 0, 28.5); for (let z = 28; z > -12; z -= 4) w.coin(0.2, 0, z); w.coinLine(-9, 0.7, 23, -9, 0.7, 13, 4); w.treasure(-9, 0.7, 16);
  w.animal('rat', -9, 0, 4, { range: 4, axis: 'z' }); w.animal('rat', 10, 0, 0, { range: 3 }); w.cp(1, 0, 30, PI, 1.8); w.cp(2, 0, 2, PI);
  // ---------------- C: track-switch hall (z -16..-52) ----------------
  room(w, -16, -52, 16, -16, 7, { S: [[-3, 3, 5]], N: [[-2.5, 2.5, 5.2]] }, { beams: 6 });
  PR.ground(w, -16, -52, 16, -16, 0, grime, { bump: 0 }); PR.rails(w, 0, -17, 0, -51, 0); PR.rails(w, -8, -17, -12, -51, 0); PR.rails(w, 8, -17, 12, -51, 0);
  w.lever('l1', -13, 0, -34, PI / 2); w.lever('l2', 13, 0, -46, -PI / 2);
  w.door('sDoor', 0, 0, -52.5, 5, 5.2, 1.1, ['l1', 'l2'], 0x57534e, '🔧 Clunk-clunk! Both switches thrown... the gate grinds open!');
  w.boulder([-4, -25, 4, -21], [[0, 0, -51], [0, 0, -16.6]], 1.4, { look: 'cart', sp: 9, delay: 1.0 });
  w.hint(-4, -20, 4, -16.5, '🔧 Pull BOTH track levers (ACT) to open the gate. And watch the middle rails for runaway handcars!');
  for (const s of [-1, 1]) { PR.pipe(w, s * 15.3, 5.5, -17, s * 15.3, 5.5, -51, 0.3, 0x78716c); PR.pipe(w, s * 15.4, 1.2, -17, s * 15.4, 1.2, -51, 0.2, 0x92400e); }
  for (const [x, z, ph] of [[-6, -30, 0], [6, -30, 0.5], [-6, -42, 0.25], [6, -42, 0.75]]) w.jet(x, 0, z, 2.8, ph, 'steam');
  for (const [x, z] of [[-14.5, -18], [-13.5, -18.6], [14.5, -50.5], [-14.5, -50.5]]) PR.crate(w, x, 0, z, 1, pick([0xc08a4f, 0xa0703a])); for (const [x, z] of [[14.6, -32], [-14.6, -44]]) PR.barrel(w, x, 0, z, 0x92400e);
  for (const [x, z] of [[-4, -50], [4, -18], [-10, -50]]) { w.add('x', cyl(10), 0x374151, x, 0, z, 0, 0, 0, 0.07, 3, 0.07); w.add('l', sph(10), pick([0xef4444, 0x22c55e, 0xfacc15]), x, 3.1, z, 0, 0, 0, 0.16); }
  { const sg = textGeo('SWITCH YARD', 0.45, 0.1); if (sg) w.add('m', sg, 0xfef3c7, 0, 6.0, -51.4); }
  lamps(w, 0, -20, -52, 8, 6.2); w.treasure(14, 0, -19); w.coinLine(-12, 0, -22, -12, 0, -48, 6); w.coinLine(12, 0, -24, 12, 0, -40, 4);
  w.animal('rat', -8, 0, -40, { range: 3 }); w.animal('rat', 8, 0, -26, { range: 3 }); w.animal('bat', 0, 4, -46, { range: 3 }); w.cp(0, 0, -18, PI, 2.4);
  // ---------------- D: flooded tunnel with a falling walkway (z -54..-82) ----------------
  room(w, -6, -82, 6, -54, 7, { S: [[-2.5, 2.5, 5.2]], N: [[-2.5, 2.5, 5]] });
  PR.ground(w, -6, -58, 6, -54, 0, grime); PR.ground(w, -6, -82, 6, -74, 0, grime);
  w.add('m', rbox(12, 0.1, 16, 0.05, 1), 0x155e75, 0, -6, -66); w.add('l', rbox(11, 0.02, 15, 0.02, 1), 0x0891b2, 0, -5.93, -66, 0, 0, 0, 1, 1, 1, 0.25); w.water(-6, -12, -74, 6, -5.6, -58);
  w.bridge(0, -58, 0, -74, 0, 2.4, true); w.sideWall(-1.4, -6, -74, -1.25, 3, -58); w.sideWall(1.25, -6, -74, 1.4, 3, -58);
  w.hook(4, 5.6, -66, false); w.add('m', cyl(8), 0x9ca3af, 4, 6.3, -66, 0, 0, 0, 0.04, 0.7, 0.04); PR.mossyBlock(w, 4.4, -6, -66, 1.8, 5.6, 1.8, 0x6b6560); w.treasure(4.4, -0.4, -66);
  w.hint(-3, -57, 3, -54.5, '🌊 The old walkway crumbles once you step on it. Keep running! (A treasure waits on the side pillar: use the ring.)');
  w.coinLine(0, 0.3, -59, 0, 0.3, -73, 6); lamps(w, -4.8, -56, -82, 6, 5.4, 0xbfdbfe); w.cp(0, 0, -55.5, PI, 1.5); w.cp(0, 0, -76, PI, 1.5);
  // ---------------- E: clockwork room (z -84..-112) ----------------
  room(w, -16, -112, 16, -84, 8, { S: [[-2.5, 2.5, 5]], N: [[-2, 2, 4]] }, { col: 0x6b4f3a });
  PR.tiles(w, -16, -112, 16, -84, 0, [0x8b6f47, 0x7a6040, 0x9a7b50], 2, { wobble: true });
  for (let i = 0; i < 4; i++) w.spikes(-16 + i * 8, -96, -8 + i * 8, -92, 0, 3, (i % 2) * 0.5, 0.42);
  for (const [z, ph] of [[-88, 0], [-100, 0.5]]) w.dartWall(-15.5, 0, z, [1, 0], 31, 2.4, ph, 3, 2.2);
  w.statue('k1', 'clocks', -9, 0, -106, 0, 2, 'clock'); w.statue('k2', 'clocks', 0, 0, -104, 1, 2, 'clock'); w.statue('k3', 'clocks', 9, 0, -106, 3, 2, 'clock');
  { const T = w.tf(0, 4.6, -111.5, 0); T.add('m', torus(0.18, 48), 0xd4a017, 0, 0, 0, 0, 0, 0, 2.4, 2.4, 1); T.add('m', rcylX(), 0xfef3c7, 0, 0, 0.02, PI / 2, 0, 0, 2.3, 0.06, 2.3); T.add('x', rbox(0.18, 1.8, 0.08, 0.03, 1), 0x1f2937, 0, 0.8, 0.1); T.add('x', rbox(0.14, 0.08, 1.3, 0.03, 1), 0x1f2937, 0.0, 0, 0.12, 0, PI / 2, 0); for (let i = 0; i < 12; i++) T.add('x', sph(8), 0x1f2937, Math.sin(i / 12 * PI * 2) * 1.95, Math.cos(i / 12 * PI * 2) * 1.95, 0.1, 0, 0, 0, 0.1); }
  { const gg = gear ? gear(10, 0.6, 0.18) : null; if (gg) for (const [x, y, s] of [[-12, 5.6, 2], [-9.2, 6.8, 1.3], [12, 5.4, 2.2], [9, 6.6, 1.1]]) w.add('x', gg, 0xb45309, x, y, -111.6, 0, 0, 0, s, s, 0.3); }
  w.door('kDoor', 0, 0, -112.5, 4, 4, 1.05, ['S:clocks'], 0x6b4f3a, '🕰️ DING DONG! Midnight! The clock door opens!');
  w.hint(-16, -90, 16, -84, '🎯 Dart walls and spike strips! Time your run, then turn the 3 clock hands (ACT) to point at the big clock.');
  for (const x of [-15.4, 15.4]) for (const z of [-88, -106]) PR.torchSconce(w, x, 3, z, x < 0 ? PI / 2 : -PI / 2, 0xfde68a);
  w.treasure(-14, 0, -109); w.evidence(14, 0, -109); w.heartP(14, 0, -86); w.coinLine(-6, 0, -98, 6, 0, -98, 5); w.cp(0, 0, -86, PI); w.cp(0, 0, -99, PI);
  // ---------------- F: Line 7 depot vs. the Vintage Express (z -114..-160) + escape ladder ----------------
  room(w, -22, -160, 22, -114, 12, { S: [[-2, 2, 4]], E: [[-152, -146, 5]] }, { beams: 7 });
  PR.ground(w, -22, -160, 22, -114, 0, grime, { bump: 0 }); for (const x of [-14, 0, 14]) PR.rails(w, x, -115, x, -159, 0);
  for (const [x, z] of [[-18, -120], [18, -120], [-18, -136], [18, -136], [-18, -152], [18, -152]]) PR.pillar(w, x, 0, z, 12, 0x6b6560, { r: 0.6, flutes: 0 });
  lamps(w, -10, -118, -160, 10, 9, 0xfde68a); lamps(w, 10, -122, -160, 10, 9, 0xfde68a);
  PR.stairs(w, 0, 0, -153, PI, 3, 0.4, 0.9, 6, 0x78716c); w.slab('m', 0x78716c, 0, 0, -157.2, 6, 1.2, 3, 0.1); w.add('x', sph(24), 0xd4a017, 0, 1.2, -157.2, 0, 0, 0, 0.8, 0.1, 0.8);
  w.relicPos = [0, 2.6, -157.2]; w.bossSpec = { type: 'express', x: 0, y: 0, z: -138, yaw: 0, arena: [-20, -151, 20, -117] };
  w.talk(-6, -119, 6, -114.5, 'vintage', '"All aboard the Vintage Express! Next stop: YOU getting arrested! Choo choo, mwahaha!"');
  // depot dressing: parked old carriages along the walls, signal posts, crates, barrels, posters, a ticket booth
  PR.trainCar(w, -20.3, 0, -138, 0, 0x7c2d12); PR.trainCar(w, 20.3, 0, -128, 0, 0x1e3a8a);
  for (const [x, z] of [[-14, -118], [14, -158], [-14, -158]]) { w.add('x', cyl(10), 0x374151, x + 1.6, 0, z, 0, 0, 0, 0.08, 4, 0.08); w.add('x', rbox(0.5, 1.2, 0.4, 0.08, 1), 0x111827, x + 1.6, 4.4, z); w.add('l', sph(10), 0xef4444, x + 1.6, 4.75, z + 0.2, 0, 0, 0, 0.13); w.add('l', sph(10), 0x22c55e, x + 1.6, 4.25, z + 0.2, 0, 0, 0, 0.13); }
  for (const [x, z] of [[-8, -158], [-6.8, -158.4], [8, -158], [-21, -118], [21, -150], [-21, -150]]) PR.crate(w, x, 0, z, 1, pick([0xc08a4f, 0xa0703a]));
  for (const [x, z] of [[9.4, -158.6], [-21, -121], [21, -147]]) PR.barrel(w, x, 0, z, pick([0x16a34a, 0xdc2626, 0x2563eb]));
  for (const z of [-124, -144]) for (const sd of [-1, 1]) { w.add('f', rbox(0.06, 2, 3, 0.02, 1), pick([0xfef3c7, 0xfde68a, 0xfecaca]), sd * 21.45, 3.2, z); w.add('x', rbox(0.04, 1.6, 2.6, 0.01, 1), pick([0x1d4ed8, 0xdc2626, 0x7c3aed]), sd * 21.42, 3.2, z); }
  for (let i = 0; i < 10; i++) PR.rock(w, rr(-19, 19), 0, rr(-158, -116), 0.25 + rnd() * 0.25, 0x78716c, false);
  w.coinRing(0, 0, -134, 7, 16); w.heartP(-20, 0, -128); w.heartP(20, 0, -142); w.evidence(-20, 0, -158); w.cp(0, 0, -116, PI);
  room(w, 24, -154, 40, -144, 14, { W: [[-152, -146, 5]] }); PR.ground(w, 22, -154, 40, -144, 0, grime);
  { const x = 37.5, z = -149; for (let y = 0.4; y < 13; y += 0.55) w.add('x', rbox(0.08, 0.08, 1.6, 0.02, 1), 0x9ca3af, x + 1.8, y, z); for (const dz of [-0.8, 0.8]) w.add('x', cyl(8), 0x9ca3af, x + 1.8, 0, z + dz, 0, 0, 0, 0.05, 13, 0.05); w.add('l', rbox(4, 0.1, 4, 0.05, 1), 0xfef9c3, x, 13.9, z, 0, 0, 0, 1, 1, 1, 1.4); w.lights.push({ x, y: 10, z, c: 0xfff7d6, i: 30, d: 20 }); const lg = textGeo('LADDER ⬆ STREET', 0.4, 0.1); if (lg) w.add('m', lg, 0x86efac, x - 2, 4.4, z, 0, -PI / 2, 0); }
  w.escape = [35, -153, 39.5, -145, 0];
  w.chaseSpec = { list: [{ x: 0, z: -115.5 }, { x: -2, z: -116.5 }, { chief: true, x: 2, z: -116.5 }], bounds: [-21, -159, 39, -115] };
  for (const [x, z] of [[-12, -146], [12, -126], [28, -151]]) w.hideSpot(x, 0, z, 'crate');
};
// a flat disc (clock faces)
function rcylX() { return cyl(40); }
