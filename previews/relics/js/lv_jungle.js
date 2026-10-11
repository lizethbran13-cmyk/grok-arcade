// Expedition 1: Temple of the Jade Monkey (Emerald Jungle)
import { BUILD, PI, jeep } from './levels.js';
import { PR } from './lvlkit.js';
import { rbox } from './world.js';
import { rcyl, sph, cyl, torus, capsule, cone, tube, leaf, star, blobGeo, lathe } from './shapes.js';
import { textGeo } from './text3d.js';
import { rnd, rr, pick, shade, mix, fbm } from './props.js';
const grass = (x, z) => { const n = fbm(x * 0.07, z * 0.07), m = fbm(x * 0.6 + 9, z * 0.6); return mix(mix(0x4caf2f, 0x2f8f2a, n), 0x86c94f, m * 0.3); };
const pathX = (z) => Math.sin(z * 0.05) * 4;
const jg = (x, z) => { const p = Math.abs(x - pathX(z)); return p < 2.2 ? mix(0xc49a6c, 0xa77d50, fbm(x * 0.5, z * 0.5)) : p < 3 ? mix(0xa98a55, grass(x, z), (p - 2.2) / 0.8) : grass(x, z); };
const STONE = 0x9c9a82, STONE2 = 0xb3ad8e, MOSS = 0x5f8f2f;
function jungleFill(w, x0, z0, x1, z1, n, keep) { for (let i = 0; i < n; i++) { const x = rr(x0, x1), z = rr(z0, z1); if (keep && keep(x, z)) continue; const r = rnd();
    if (r < 0.35) PR.jungleTree(w, x, 0, z, 0.8 + rnd() * 0.5); else if (r < 0.5) PR.palm(w, x, 0, z, 6 + rnd() * 3, 0.2 + rnd() * 0.2); else if (r < 0.8) PR.fern(w, x, 0, z, 1 + rnd() * 0.8); else PR.bush(w, x, 0, z, 0.8 + rnd() * 0.6, 0x16a34a, { flowers: rnd() < 0.4 }); } }
function wallsOfRoom(w, x0, z0, x1, z1, h, d = {}, o = {}) { PR.stoneRoom(w, x0, z0, x1, z1, h, o.col || STONE, Object.assign({ doors: d, ceilCol: 0x6f6a58, wall: { col2: STONE2, bh: 0.7, bl: 1.4, skip: 0.1 } }, o)); }
BUILD.jungle = (w) => { w.music = 'jungle'; w.killY = -12; w.camDist = 4.8;
  w.env = { fog: 0xb6e2c4, fogD: 0.0058, skyMid: 0xa8e0c0, hemiGround: 0x4f7a32 };
  w.start = [0, 0, 56]; w.startYaw = PI; w.grassKeep = (x, z) => Math.abs(x - pathX(z)) < 3.4 || (z < -36 && z > -76 && Math.abs(x) < 9) || (Math.abs(x) < 14.5 && z < -19.5 && z > -36);
  // ---------------- A: base camp (z 62..20) ----------------
  PR.ground(w, -42, 20, 42, 64, 0, jg, { bump: 0.25 }); w.solid(-43, 0, 64, 43, 14, 65, { nocam: true });
  [-1, 1].forEach((s) => w.solid(s > 0 ? 42 : -43, 0, -210, s > 0 ? 43 : -42, 14, 65, { nocam: true }));
  jeep(w, 9, 0, 58, -0.5); PR.crate(w, 5, 0, 60); PR.crate(w, 6.3, 0, 60.4, 0.8, 0xa0703a); PR.crate(w, 5.5, 1.2, 60.2, 0.7);
  const tent = (x, z, ry, col) => { const T = w.tf(x, 0, z, ry); T.add('f', cone(4), col, 0, 0, 0, 0, PI / 4, 0, 2.4, 2.6, 2.4); T.add('f', cone(4), shade(col, 0.6), 0, 0, 1.69, 0, PI / 4, 0, 0.7, 1.4, 0.05); T.add('m', cyl(8), 0x6b4423, 0, 0, 0, 0, 0, 0, 0.05, 2.9, 0.05); T.solid(-1.6, 0, -1.6, 1.6, 2.2, 1.6); };
  tent(-9, 52, 0.4, 0xf59e0b); tent(-14, 45, 0.9, 0x0ea5e9); tent(13, 47, -0.6, 0xdc2626);
  { const x = -2, z = 47; w.add('m', rcyl(1.0, 0.25, 0.1, 20), 0x57534e, x, 0, z); for (let i = 0; i < 6; i++) w.add('m', capsule(10), 0x6b4423, x + Math.cos(i) * 0.4, 0.35, z + Math.sin(i) * 0.4, 0.9, i, 0, 0.16, 0.8, 0.16); w.add('l', cone(14), 0xffa53d, x, 0.35, z, 0, 0, 0, 0.5, 1.1, 0.5, 1.6); w.add('l', cone(10), 0xffe066, x, 0.4, z, 0, 0, 0, 0.3, 0.8, 0.3, 2); w.lights.push({ x, y: 1.5, z, c: 0xff9a3c, i: 18, d: 16 }); w.solid(x - 0.8, 0, z - 0.8, x + 0.8, 0.5, z + 0.8);
    for (const [lx, lz, ry] of [[x + 2.4, z, 0], [x - 2.4, z, 0], [x, z + 2.4, PI / 2]]) { w.add('m', rcyl(0.3, 2.2, 0.1, 14), 0x7a5230, lx, 0.3, lz, 0, ry, PI / 2); w.solid(lx - (ry ? 1.1 : 0.3), 0, lz - (ry ? 0.3 : 1.1), lx + (ry ? 1.1 : 0.3), 0.6, lz + (ry ? 0.3 : 1.1)); } }
  w.martinaSpec = { x: -5, y: 0, z: 50, yaw: 0.8, s: 0.42, label: '🐢 Talk to Torty' };
  w.martinaSay = (g) => { const L = ['"Hi! It\u2019s me, Torty! (Martina, but explorers call me Torty.) The Jade Monkey temple is down the path."', '"The Relic Patrol is searching the ruins past the river. Duck into bushes and press ACT to hide!"', '"Crack your WHIP near the golden ring over the river to swing across. The crocs are friendly but VERY bitey."', '"Professor Vintage rented a big purple chopper. Very suspicious. Find evidence!"']; g._mi = ((g._mi ?? -1) + 1) % L.length; return L[g._mi]; };
  w.talk(-8, 44, 8, 52, 'martina', '"Explorer! Over here, it\u2019s Torty! Press ACT next to me for tips."');
  PR.hut(w, 18, 0, 34, -PI / 2 - 0.2); w.treasure(18, 0.4, 34); w.coinRing(18, 0.4, 34, 1.2, 6);
  PR.hut(w, -17, 0, 30, PI / 2 + 0.3, 0xb8905a); w.heartP(-17, 0.4, 30);
  PR.totem(w, -6, 0, 36, 0.5); PR.totem(w, 6, 0, 26, -0.5);
  for (let z = 52; z > 22; z -= 3) w.coin(pathX(z), 0, z);
  w.animal('monkey', 10, 0, 32, { range: 3 }); w.animal('monkey', -11, 0, 25, { range: 3 }); w.animal('snake', 3, 0, 38, { range: 3, axis: 'x' });
  w.hint(-6, 40, 6, 46, '🪢 Tap WHIP to crack it at baddies. Monkeys run away giggling!');
  jungleFill(w, -40, 22, 40, 62, 90, (x, z) => Math.abs(x - pathX(z)) < 5 || (x > 2 && x < 16 && z > 54) || (x < -5 && x > -19 && z > 40 && z < 56) || (Math.hypot(x - 18, z - 34) < 4) || (Math.hypot(x + 17, z - 30) < 4) || (Math.hypot(x + 2, z - 47) < 5));
  PR.grassTufts(w, -40, 22, 40, 62, 0.02, 900);
  w.cp(pathX(23), 0, 23, PI);
  // ---------------- B: croc river (z 20..8) ----------------
  PR.river(w, -42, 8, 42, 20, -0.4); w.killY = -12;
  [[-6, 17.5], [-4, 15], [-6.5, 12.6], [-4.5, 10.2]].forEach(([x, z], i) => PR.mossyBlock(w, x, -1.2, z, 1.6, 1.3 + (i % 2) * 0.1, 1.6, STONE));
  [[-9.5, 16.6], [-13, 15.8], [-16.5, 15], [-20, 14.5]].forEach(([x, z]) => PR.mossyBlock(w, x, -1.2, z, 1.5, 1.3, 1.5, STONE));
  PR.mossyBlock(w, -24, -1.2, 14.3, 3.2, 1.4, 3.2, STONE); w.treasure(-24, 0.2, 14.3); w.coinLine(-9.5, 0.2, 16.6, -20, 0.2, 14.5, 4);
  // a big tree on the bank with a golden whip ring on its branch
  PR.jungleTree(w, 14, 0, 22.5, 1.1, { vines: false }); w.add('m', tube([[14, 6.5, 22.5], [11, 7.2, 18], [9, 7.1, 14]], 0.3, 12, 10), 0x7a5230, 0, 0, 0); w.hook(9, 6.3, 14, false); w.add('m', cyl(8), 0xc2a26f, 9, 6.7, 14, 0, 0, 0, 0.04, 0.5, 0.04);
  w.hint(4, 20, 16, 26, '🪢 See the golden ring? Run at the river and tap WHIP to swing over it!');
  w.coinLine(9, -0.4, 19, 9, -0.4, 9, 5);
  w.animal('croc', 0, -0.6, 14, { path: [[-30, 14], [30, 14]] }); w.animal('croc', 20, -0.6, 11, { path: [[30, 11], [-30, 11]] });
  for (let x = -40; x < 42; x += 3.5) { if (Math.abs(x + 5) < 3) continue; PR.rock(w, x + rr(-1, 1), -0.6, 20.4 + rr(-0.3, 0.3), 0.6 + rnd() * 0.5, 0x8a8a7a, false); PR.rock(w, x + rr(-1, 1), -0.6, 7.7 + rr(-0.3, 0.3), 0.6 + rnd() * 0.5, 0x8a8a7a, false); }
  for (let i = 0; i < 14; i++) w.add('s', leaf(), 0x22c55e, rr(-38, 38), -0.33, rr(9, 19), -PI / 2, rnd() * 6, 0, 0.7, 0.7, 0.7); // lily pads
  // ---------------- C: ruins plaza + gate (z 8..-38) ----------------
  PR.ground(w, -42, -42.2, 42, 8, 0, jg, { bump: 0.08 }); PR.tiles(w, -14, -35.5, 14, -20, 0.06, [0xa8a184, 0x98927a, 0xb0a98c], 2, { wobble: true }); w.cp(pathX(5), 0, 5, PI);
  for (const [x, z, h, br] of [[-12, -2, 5, 1], [-14, -12, 3.2, 1], [14, -4, 4.5, 0], [12, -16, 2.6, 1], [-6, -20, 1.8, 1], [20, -26, 5, 0]]) PR.pillar(w, x, 0, z, h, STONE2, { r: 0.5, broken: br });
  PR.mossyBlock(w, -18, 0, -6, 3, 2.2, 2.4, STONE); PR.mossyBlock(w, -18, 2.2, -6, 1.6, 1.4, 1.6, STONE2); w.evidence(-18, 3.6, -6); w.coin(-16, 2.2, -6);
  PR.mossyBlock(w, 18, 0, -10, 2.4, 1.4, 4, STONE); PR.mossyBlock(w, 4, 0, -8, 2.8, 0.9, 1.6, STONE2);
  PR.monkeyStatue(w, -26, 0, -20, PI / 2, STONE2); PR.monkeyStatue(w, 26, 0, -20, -PI / 2, STONE2);
  for (const [x, z] of [[-8, -6], [8, -12], [-3, -16], [15, -22], [-14, -24], [2, 0]]) w.hideSpot(x, 0, z, 'bush');
  w.officers([{ x: -9, z: -9, path: [[-9, -9], [9, -9], [9, -17], [-9, -17]] }, { x: 9, z: -2, path: [[9, -2], [-9, -2], [-9, 2], [9, 2]] }], [-40, -36, 40, 7]);
  w.talk(-14, 3, 14, 7, 'patrol', '"Officer Waffles here! We\u2019re looking for a sneaky relic thief in a hat. Seen one? No? Carry on!"');
  w.hint(-14, 0, 14, 3, '🚨 The Relic Patrol thinks YOU are the thief! Stay out of sight. Stand in a bush and press ACT to hide.');
  // the gate: needs both star plates pressed at the same time (push the stone block onto one)
  PR.stoneWall(w, 'x', -36, -42, 42, 7, STONE, { holes: [[-2.5, 2.5, 5.2]], col2: STONE2 }); w.add('m', rbox(7.4, 1.4, 1.4, 0.1, 1), STONE2, 0, 5.2, -36); w.add('m', rbox(5, 0.12, 0.2, 0.04, 1), 0x34d399, 0, 6.0, -35.25);
  PR.monkeyStatue(w, -5, 0, -34.3, PI, STONE2, 0.7); PR.monkeyStatue(w, 5, 0, -34.3, PI, STONE2, 0.7);
  w.door('gate', 0, 0, -36, 5, 5.2, 1.1, ['pA', 'pB'], 0x8a7a5a, '🗿 The gate rumbles open!');
  w.plate('pA', -9, 0.06, -28, 1.0); w.plate('pB', 9, 0.06, -28, 1.0); w.pushBlock('blk', 9, 0.06, -24.4, 1.8);
  PR.relief(w, 'x', -35.5, -16, 1.5, 6, 2.2, 1, STONE2, 'monkey'); PR.relief(w, 'x', -35.5, 16, 1.5, 6, 2.2, 1, STONE2, 'mix');
  w.hint(-14, -30, 14, -22, '⭐ Both star plates must be pressed at once! Push the stone block (walk into it) onto one and stand on the other.');
  for (let x = -6; x <= 6; x += 2) w.coin(x, 0, -20); w.coinRing(-9, 0.06, -28, 1.8, 6);
  // denser ruins: crumbling wall stubs, fallen column drums, broken stairs, root-wrapped blocks, moss and flowers around the plaza edges
  for (const [x, z, len, h, ax] of [[-24, 2, 7, 2.2, 'z'], [24, 0, 6, 1.6, 'z'], [-28, -12, 8, 3, 'z'], [28, -14, 7, 2.4, 'z'], [-20, -31, 6, 2, 'x'], [21, -31, 6, 2.6, 'x'], [-33, -4, 5, 1.4, 'x'], [33, -24, 5, 1.8, 'x']]) {
    const T = ax === 'x' ? [x - len / 2, x + len / 2] : [z - len / 2, z + len / 2]; PR.stoneWall(w, ax, ax === 'x' ? z : x, T[0], T[1], h, STONE, { col2: STONE2, th: 0.8 });
    for (let i = 0; i < 3; i++) w.add('f', blobGeo(i + (x | 0) & 63, 0.3, 1), MOSS, (ax === 'x' ? x + rr(-len / 2, len / 2) : x), h + 0.05, (ax === 'z' ? z + rr(-len / 2, len / 2) : z), 0, 0, 0, rr(0.5, 0.9), 0.25, rr(0.5, 0.9)); }
  for (const [x, z, ry] of [[-21, -16, 0.4], [22, -4, 1.2], [-11, -32, 1.9], [16, 4, 2.6], [-26, -26, 0.9], [27, -30, 2.2]]) { for (let i = 0; i < 3; i++) { w.add('m', rcyl(0.55, 0.9, 0.08, 20), shade(STONE2, 0.92 + i * 0.05), x + Math.sin(ry) * i * 1.0, 0.55, z + Math.cos(ry) * i * 1.0, PI / 2, ry, 0); } w.solid(x - 1.2, 0, z - 1.2, x + 1.2, 1.1, z + 1.2); }
  // the middle of the plaza: a broken jade altar the patrols walk around, low wall stubs and vines between the bushes
  PR.mossyBlock(w, 0, 0, -13, 4, 0.8, 3, STONE); PR.mossyBlock(w, 0, 0.8, -13, 2.4, 0.7, 1.8, STONE2); PR.monkeyStatue(w, 0, 1.5, -13, PI, 0x34d399, 0.55); PR.flowers(w, 2.6, 0, -11, 5, 1); PR.fern(w, -2.4, 0, -14.5, 1);
  for (const [x, z, len, h] of [[-15, -6, 4, 1.2], [15, -9, 4, 1.4], [-15, -18, 3, 0.9], [16, -15, 3, 1.1]]) { PR.stoneWall(w, 'z', x, z - len / 2, z + len / 2, h, STONE2, { col2: STONE, th: 0.7 }); w.add('f', blobGeo((x * 3 | 0) & 63, 0.3, 1), MOSS, x, h, z, 0, 0, 0, 0.5, 0.2, len * 0.35); }
  for (const [x, z] of [[-11, -0.5], [11, -6], [-5, -22], [6, -22]]) { PR.rock(w, x, 0, z, 0.5 + rnd() * 0.3, 0x8a8a7a, false); PR.fern(w, x + 0.8, 0, z + 0.6, 0.8); }
  for (const x of [-34, -26, -16, 16, 26, 34]) PR.jungleTree(w, x + rr(-2, 2), 0, -39 - rr(0, 2), 1.1 + rnd() * 0.3);
  PR.stairs(w, -24, 0, -22, PI / 2, 3, 0.35, 0.8, 4, STONE2); PR.stairs(w, 24, 0, -2, -PI / 2, 3, 0.35, 0.8, 4, STONE2);
  for (const [x, z] of [[-30, -6], [30, -8], [-25, -34], [26, -36], [-32, 4], [32, 4], [-36, -20], [36, -16]]) { PR.mossyBlock(w, x, 0, z, rr(1.8, 2.6), rr(1.2, 2.4), rr(1.8, 2.6), pick([STONE, STONE2])); PR.fern(w, x + 1.4, 0, z + 1.2, 1.1); }
  for (const [x, z] of [[-22, 6], [22, 6], [-16, -36], [16, -36], [-30, -28], [30, -2], [-12, 4], [12, -34]]) PR.urn(w, x, 0, z, 0.8 + rnd() * 0.4, pick([0xc2703d, 0xb45309, 0x9a3412]));
  for (let i = 0; i < 18; i++) { const x = pick([-1, 1]) * rr(16, 38), z = rr(-34, 6); PR.flowers(w, x, 0, z, 6, 1.4); }
  for (const [x, z] of [[-25, -6], [25, -20], [-30, -18], [31, -28]]) PR.jungleTree(w, x, 0, z, 1.0 + rnd() * 0.3);
  jungleFill(w, -40, -34, 40, 6, 85, (x, z) => (Math.abs(x) < 22 && z > -30) || Math.abs(x - pathX(z)) < 5);
  PR.grassTufts(w, -40, -36, 40, 6, 0.02, 1100);
  w.animal('snake', -22, 0, 0, { range: 4, axis: 'z' }); w.animal('monkey', 24, 0, -8, { range: 3 });
  // ---------------- D: the gorge + rope bridge (z -38..-76) ----------------
  w.cp(0, 0, -39.5, PI);
  PR.ground(w, -42, -76, 42, -54, 0, jg, { bump: 0.2 });
  for (const zz of [-42.2, -53.8]) { for (let x = -40; x < 42; x += 2.2) w.add('m', blobGeo((x * 7 | 0) & 63, 0.25, 1), mix(0x8b7355, 0x6b5a45, rnd()), x, -2, zz, 0, rnd() * 6, 0, 1.4, 2.4, 1.2); }
  for (let i = 0; i < 26; i++) PR.caveRock(w, rr(-40, 40), rr(-30, -14), rr(-52, -44), rr(2, 4), 0x6b5a45);
  w.add('e', rbox(84, 0.1, 11, 0.05, 1), 0x7dd3fc, 0, -20, -48);
  w.bridge(0, -42, 0, -54, 0, 2.6, true); w.sideWall(-1.5, -6, -54, -1.35, 3, -42); w.sideWall(1.35, -6, -54, 1.5, 3, -42);
  w.hint(-6, -41, 6, -37, '🌉 The planks fall after you step on them. DON\u2019T STOP!');
  w.coinLine(0, 0.3, -43, 0, 0.3, -53, 6);
  w.hook(12, 6.5, -48); PR.mossyBlock(w, 12, -8, -48, 2, 6, 2, STONE); w.treasure(12, -0.6, -48);
  w.hint(8, -41, 16, -37, '💎 A treasure on a pillar! Whip the golden ring and swing right through it!');
  w.cp(0, 0, -56.5, PI);
  // swinging logs under stone arches
  for (const [z, ph] of [[-60, 0], [-66, 0.5]]) { PR.pillar(w, -3.6, 0, z, 6.2, STONE2, { r: 0.45, flutes: 0 }); PR.pillar(w, 3.6, 0, z, 6.2, STONE2, { r: 0.45, flutes: 0 }); w.add('m', rbox(8.4, 0.8, 1.2, 0.1, 1), STONE, 0, 6.2, z); w.solid(-4.2, 6.2, z - 0.6, 4.2, 7, z + 0.6); w.swingLog(0, 6.0, z, 'x', 4.4, 2.8, ph); }
  w.coinLine(0, 0, -58, 0, 0, -70, 6);
  jungleFill(w, -40, -74, 40, -55, 40, (x, z) => Math.abs(x) < 8);
  PR.grassTufts(w, -40, -75, 40, -55, 0.02, 500);
  w.animal('monkey', -12, 0, -64, { range: 3 }); w.animal('monkey', 14, 0, -70, { range: 2 });
  // ---------------- E: the temple ----------------
  const H = 7; w.cp(0, 0, -73, PI);
  // stepped temple mass (outside) + entrance stairs
  for (let i = 0; i < 4; i++) { const inset = i * 3; w.add('m', rbox(46 - inset * 2, 2.6, 76 - inset * 2, 0.12, 1), shade(STONE, 0.92 + i * 0.04), 0, H + 1.1 + i * 2.4, -114 - 0); }
  w.add('m', rbox(10, 3, 10, 0.2, 1), STONE2, 0, H + 11.5, -114); PR.monkeyStatue(w, 0, H + 13, -114, PI, 0x34d399, 1.2);
  const ent = textGeo('TEMPLE OF THE JADE MONKEY', 0.5, 0.15); if (ent) w.add('m', ent, 0x34d399, 0, 5.4, -74.9);
  for (const x of [-6, 6]) { PR.torchSconce(w, x, 3, -74.9, 0); }
  for (let i = 0; i < 6; i++) w.add('f', blobGeo(i + 7, 0.3, 1), MOSS, rr(-20, 20), rr(4.6, 6.8), -74.85, 0, 0, 0, rr(0.6, 1.4), rr(0.4, 1), 0.3);
  PR.vineCurtain(w, -14, H, -74.7, 8, 5); PR.vineCurtain(w, 14, H, -74.7, 8, 5);
  // E1 entrance hall (z -76..-92)
  PR.tiles(w, -21, -150, 21, -76, 0, [0xa8a184, 0x98927a, 0xb0a98c], 1.8, { wobble: true });
  wallsOfRoom(w, -21, -150, 21, -76, H, { S: [[-2.5, 2.5, 4.5]], N: [[-2, 2, 4]] }, { ceil: true });
  // inner walls
  const wallX = (z, x0, x1, holes) => PR.stoneWall(w, 'x', z, x0, x1, H, STONE, { holes, col2: STONE2 }); const wallZ = (x, z0, z1, holes) => PR.stoneWall(w, 'z', x, z0, z1, H, STONE, { holes, col2: STONE2 });
  wallX(-92, -21, 21, [[-2, 2, 4]]);
  for (const [x, z] of [[-14, -80], [14, -80], [-14, -88], [14, -88]]) PR.pillar(w, x, 0, z, H, STONE2, { r: 0.5 });
  PR.monkeyStatue(w, -18, 0, -84, PI / 2, STONE2); PR.monkeyStatue(w, 18, 0, -84, -PI / 2, STONE2);
  for (const [x, z] of [[-19.5, -79], [19.5, -79], [-19.5, -90], [19.5, -90], [-8, -91], [8, -91]]) PR.urn(w, x, 0, z, 1.0 + rnd() * 0.4, pick([0xc2703d, 0xb45309, 0x9a3412]));
  for (const x of [-20.4, 20.4]) for (const z of [-80, -88]) PR.torchSconce(w, x, 3, z, x < 0 ? PI / 2 : -PI / 2);
  PR.relief(w, 'x', -91.5, -12, 1.4, 7, 2.4, 1, STONE2, 'mix'); PR.relief(w, 'x', -91.5, 12, 1.4, 7, 2.4, 1, STONE2, 'monkey');
  w.coinRing(0, 0, -84, 3, 10); w.evidence(-18, 0, -90.5); w.hint(-4, -80, 4, -76, '🔦 It\u2019s dim in here. Tap TORCH to light your way!');
  // E2 dart corridor (x -2..2, z -92..-108)
  wallZ(-2.5, -108, -92); wallZ(2.5, -108, -92, [[-104.5, -102.5, 3.2], [-98.5, -96.5, 3.2]]);
  w.add('w', rbox(42, 0.5, 16, 0.05, 1), 0x6f6a58, 0, 4.0 + 0.25, -100); w.solid(-21, 4, -108, 21, 4.5, -92, { ceil: true, nofloor: true });
  for (const [z, ph] of [[-95, 0], [-99.5, 0.33], [-104, 0.66]]) w.dartWall(-2.1, 0, z, [1, 0], 4.6, 2.4, ph, 2, 1.4);
  // safe niches on the east side
  for (const zc of [-97.5, -103.5]) { w.slab('w', STONE, 5, 0, zc, 1, 4, 3.2, 0.05); w.slab('w', STONE, 3.75, 0, zc - 1.3, 2.5, 4, 0.6, 0.05); w.slab('w', STONE, 3.75, 0, zc + 1.3, 2.5, 4, 0.6, 0.05); w.coin(3.6, 0, zc); PR.torchSconce(w, 4.45, 2.4, zc, -PI / 2); }
  w.hint(-2, -94, 2, -92, '🎯 Dart wall! Watch the timing and duck into the side niches.'); w.cp(0, 0, -93, PI, 1.7);
  wallX(-108, -21, 21, [[-2, 2, 4]]);
  // side rooms off the entrance hall (solid fill so the dart corridor is a corridor)
  w.solid(-21, 0, -108, -2.5, H, -92, { nocam: false }); w.solid(5.5, 0, -108, 21, H, -92);
  // E3 spike room (z -108..-122)
  w.cp(0, 0, -109.6, PI);
  for (let i = 0; i < 7; i++) for (let j = 0; j < 2; j++) { const x0 = -21 + i * 6, z0 = -116 + j * 3.2; w.spikes(x0, z0, x0 + 6, z0 + 3.2, 0, 3.2, ((i + j) % 2) * 0.5, 0.42); }
  w.hint(-6, -112, 6, -109, '⚠️ Spike floor! The tiles shake before the spikes pop. Hop across the calm ones.');
  PR.mossyBlock(w, -15.5, 0, -114.4, 2.4, 1.4, 2.4, STONE); w.treasure(-15.5, 1.4, -114.4); PR.goldPile(w, 16, 0, -120, 1.4); w.heartP(-17, 0, -120);
  for (const x of [-20.4, 20.4]) for (const z of [-111, -119]) PR.torchSconce(w, x, 3, z, x < 0 ? PI / 2 : -PI / 2);
  // statue puzzle: turn all three monkeys to face the jade mural (north wall)
  PR.relief(w, 'x', -121.5, 0, 4.3, 8, 2.4, 1, 0x34d399, 'monkey');
  w.statue('m1', 'monkeys', -9, 0, -119.2, 1, 2); w.statue('m2', 'monkeys', 6, 0, -119.2, 3, 2); w.statue('m3', 'monkeys', 11, 0, -119.2, 0, 2);
  w.hint(-21, -122, 21, -117, '🗿 Turn the three monkey statues (ACT) so they all face the jade mural on the far wall!');
  wallX(-122, -21, 21, [[-2, 2, 4]]); w.door('mDoor', 0, 0, -122, 4, 4, 1.05, ['S:monkeys'], 0x6f8f5a, '🐒 The monkey door slides open!');
  // E4 boulder corridor (x -2.5..2.5, z -122..-148), niche halfway
  w.cp(0, 0, -124, PI, 1.7);
  wallZ(-2.5, -148, -122); wallZ(2.5, -148, -122, [[-136, -132, 4]]);
  w.solid(-21, 0, -148, -2.5, H, -122); w.solid(2.5, 0, -148, 21, H, -136); w.solid(2.5, 0, -132, 21, H, -122);
  w.slab('w', STONE, 7.5, 0, -134, 1, H, 4.2, 0.05); w.slab('w', STONE, 5, 0, -136.5, 4.4, H, 1, 0.05); w.slab('w', STONE, 5, 0, -131.5, 4.4, H, 1, 0.05); PR.torchSconce(w, 6.9, 2.6, -134, -PI / 2);
  w.boulder([-2.5, -129, 2.5, -126], [[0, 0, -123], [0, 0, -147]], 1.85, { sp: 8.2, delay: 0.7 });
  w.hint(-2, -128, 2, -124, '🪨 Uh oh... that ceiling looks loose. Be ready to RUN (or dive into the side niche)!'); w.coinLine(0, 0, -128, 0, 0, -146, 8); w.coin(5, 0, -134); w.coin(6, 0, -134);
  // exit from corridor into the courtyard: hole in the south outer wall at x -2.5..2.5
  w.solid(-21, 0, -150, -2.5, H, -148); w.solid(2.5, 0, -150, 21, H, -148);
  // replace south outer wall with an opening (outer wall already has none on N side; add the hole by an extra door-free gap)
  // ---------------- F: courtyard boss arena (z -150..-188) + escape path ----------------
  PR.tiles(w, -20, -190, 20, -150.5, 0, [0xa8a184, 0x8f8a70, 0xb6ae90], 2, { wobble: true });
  PR.stoneWall(w, 'z', -20.5, -190, -150, 5, STONE, { col2: STONE2, holes: [[-174, -168, 4]] }); PR.stoneWall(w, 'z', 20.5, -190, -150, 5, STONE, { col2: STONE2, holes: [[-186, -180, 4]] }); PR.stoneWall(w, 'x', -190.5, -21, 21, 5, STONE, { col2: STONE2 });
  for (const [x, z] of [[-16, -156], [16, -156], [-16, -170], [16, -170]]) PR.pillar(w, x, 0, z, 6, STONE2, { r: 0.55, broken: rnd() < 0.5 });
  PR.stairs(w, 0, 0, -183, PI, 3, 0.4, 0.9, 6, STONE2); w.slab('m', STONE2, 0, 0, -187.2, 6, 1.2, 3, 0.1); w.add('x', rcyl(0.8, 0.2, 0.05, 24), 0xd4a017, 0, 1.2, -187.2);
  w.relicPos = [0, 2.6, -187.2]; w.bossSpec = { type: 'chopper', x: 0, y: 0, z: -170, yaw: 0, arena: [-19, -186, 19, -152] };
  w.cp(0, 0, -152.5, PI); w.talk(-6, -156, 6, -151, 'vintage', '"Well, well! The famous explorer. Too bad the Patrol thinks YOU stole everything. Mwahahaha!"');
  for (const x of [-18, -11, 11, 18]) { PR.urn(w, x, 0, -189.2, 1.0, 0xb45309); PR.urn(w, x, 0, -151.8, 0.9, 0xc2703d); }
  w.coinRing(0, 0, -170, 6, 16); w.heartP(-18, 0, -160); w.heartP(18, 0, -180); w.evidence(18.5, 0, -152);
  // escape: through the east gap to the jungle and Torty's jeep
  PR.ground(w, 20, -210, 42, -150, 0, jg, { bump: 0.2 }); PR.ground(w, -42, -210, 20, -190.6, 0, jg, { bump: 0.2 }); PR.ground(w, -42, -150, -21, -76, 0, jg); PR.ground(w, -42, -190.6, -21, -150, 0, jg); PR.ground(w, 21, -150, 42, -76, 0, jg);
  w.solid(-43, 0, -211, 43, 14, -210, { nocam: true });
  jeep(w, 32, 0, -200, 0.4); w.escape = [27, -205, 37, -195, 0];
  w.chaseSpec = { list: [{ x: 0, z: -151 }, { x: -2, z: -152 }, { chief: true, x: -24, z: -171 }], bounds: [-41, -209, 41, -150] };
  for (const [x, z] of [[24, -176], [30, -186], [26, -164]]) w.hideSpot(x, 0, z, 'bush');
  jungleFill(w, 22, -209, 41, -151, 26, (x, z) => (x > 26 && x < 38 && z < -192) || Math.abs(x - 28) < 3);
  jungleFill(w, -41, -209, 19, -192, 22); jungleFill(w, -41, -149, -22, -77, 20); jungleFill(w, 22, -149, 41, -77, 20);
};
