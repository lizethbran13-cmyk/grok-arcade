// Expedition 4: Pyramid of the Sun Scarab (Golden Dunes). Oasis camp + quicksand flats + patrolled entrance ->
// hieroglyph hall + dart corridor -> quicksand chamber (moving stones, whip ring) -> sun-mirror hall (3 mirrors bounce the
// sunbeam onto the sun door) -> burial chamber vs. Mecha-Mummy Vintage -> escape out the side tunnel to the jeep.
import { BUILD, PI, jeep } from './levels.js';
import { PR } from './lvlkit.js';
import { rbox } from './world.js';
import { sph, cyl, cone, tube } from './shapes.js';
import { textGeo } from './text3d.js';
import { rnd, rr, pick, shade, mix, fbm } from './props.js';
const SAND = 0xe9c98a, SST = 0xd6b370, SST2 = 0xe4c88e, GOLD = 0xfacc15;
const sandF = (x, z) => mix(mix(0xf2d49a, 0xe3bd78, fbm(x * 0.06, z * 0.06)), 0xf8e2b4, fbm(x * 0.5 + 2, z * 0.5) * 0.35);
const floorF = (x, z) => mix(0xcfae74, 0xbf9c62, fbm(x * 0.4, z * 0.4));
const room = (w, x0, z0, x1, z1, h, doors, o = {}) => PR.stoneRoom(w, x0, z0, x1, z1, h, o.col || SST, Object.assign({ doors, ceilCol: 0x7a5c38, beams: o.beams ?? 4, wall: { col2: SST2, bh: 0.8, bl: 1.8, skip: 0.05 } }, o));
const glyphs = (w, axis, at, from, to, y, side) => { for (let c = from; c < to; c += 2.2) w.add('x', rbox(axis === 'x' ? 0.5 : 0.05, 0.5, axis === 'x' ? 0.05 : 0.5, 0.02, 1), pick([0x1d4ed8, 0xdc2626, 0x15803d, 0xb45309, 0x0e7490]), axis === 'x' ? c : at, y + (rnd() - 0.5) * 0.4, axis === 'x' ? at : c, 0, 0, rnd() * 0.8); };
BUILD.pyramid = (w) => { w.music = 'pyramid'; w.killY = -12; w.camDist = 4.8; w.fillI = 3.2; w.lightN = 5;
  w.env = { sunDir: [0.35, 0.8, 0.5], sunColor: 0xfff0c8, sunI: 3.0, hemiSky: 0xd6ecff, hemiGround: 0xc9a46a, hemiI: 0.72, skyTop: 0x1d7cf2, skyMid: 0x8fd0ff, skyBot: 0xffeccc, fog: 0xf5e2b8, fogD: 0.0048, envI: 0.9, exposure: 1.0, bloomT: 1.0, bloomS: 0.42, envLight: 0xfff1d0 };
  w.start = [0, 0, 62]; w.startYaw = PI; w.grassKeep = () => true;
  // ---------------- A: oasis camp + quicksand flats (z 70..30) ----------------
  PR.ground(w, -36, 30, 36, 70, 0, sandF, { bump: 0.3 }); w.solid(-37, 0, 70, 37, 14, 71, { nocam: true }); w.solid(-37, 0, -150, -36, 14, 70, { nocam: true }); w.solid(36, 0, 30, 37, 14, 70, { nocam: true });
  for (let i = 0; i < 18; i++) PR.dune(w, pick([-1, 1]) * rr(22, 40), 0, rr(32, 70), rr(5, 10), rr(2, 4), rr(4, 8));
  { const x = -14, z = 58; w.add('e', sph(32), 0x22d3ee, x, -0.1, z, 0, 0, 0, 5, 0.15, 3.6); w.water(x - 4.5, -3, z - 3, x + 4.5, 0.05, z + 3); for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; PR.palm(w, x + Math.cos(a) * 6.4, 0, z + Math.sin(a) * 4.6, 6 + rnd() * 3, 0.25); } for (let i = 0; i < 8; i++) PR.bush(w, x + rr(-6, 6), 0, z + pick([-1, 1]) * rr(3.6, 5), 0.6 + rnd() * 0.4, 0x4d7c0f); }
  jeep(w, 10, 0, 62, -0.5, 0xd97706); PR.crate(w, 6, 0, 65); PR.crate(w, 7.2, 0, 65.4, 0.8, 0xa0703a); PR.barrel(w, 14, 0, 66, 0xdc2626);
  const tent = (x, z, ry, col) => { const T = w.tf(x, 0, z, ry); T.add('f', cone(4), col, 0, 0, 0, 0, PI / 4, 0, 2.4, 2.6, 2.4); T.add('m', cyl(8), 0x6b4423, 0, 0, 0, 0, 0, 0, 0.05, 2.9, 0.05); T.solid(-1.6, 0, -1.6, 1.6, 2.2, 1.6); };
  tent(18, 54, -0.5, 0xffffff); tent(22, 46, -1.0, 0x0ea5e9); w.treasure(25.5, 0, 50.5); w.coinRing(25.5, 0, 50.5, 1.3, 6);
  w.martinaSpec = { x: -5, y: 0, z: 56, yaw: 0.8, s: 0.42, label: '🐢 Talk to Torty' };
  w.martinaSay = () => { const L = ['"Torty here, sunburnt but happy! The Sun Scarab is in the burial chamber at the heart of the pyramid."', '"Careful of the soft golden sand: QUICKSAND! Hop across on the stones, don\u2019t stand still."', '"Inside there\u2019s a sunbeam puzzle. Turn the mirrors so the light hits the sun door!"', '"Professor Vintage built a robot MUMMY. With a monocle. I\u2019m not even kidding."']; w._mi = ((w._mi ?? -1) + 1) % L.length; return L[w._mi]; };
  w.talk(-8, 52, 4, 60, 'martina', '"Explorer! Over here! It\u2019s Torty. ACT for desert tips."');
  w.quicksand(-8, 40, 8, 48, 0.02); for (const [x, z] of [[-1.5, 46.6], [1.2, 44.4], [-1.0, 42.2], [1.6, 40.6]]) PR.mossyBlock(w, x, -0.4, z, 1.4, 0.75, 1.4, SST2);
  w.hint(-6, 49, 6, 53, '⏳ Quicksand! It slows you down and swallows you if you dawdle. Hop the stones!'); w.coinLine(-1.5, 0.35, 46.6, 1.6, 0.35, 40.6, 4);
  for (const [x, z] of [[-20, 44], [20, 36]]) PR.obelisk(w, x, 0, z, 9, SST);
  w.animal('scorpion', -10, 0, 40, { range: 3 }); w.animal('scorpion', 12, 0, 42, { range: 3 }); w.animal('snake', -24, 0, 36, { range: 3, axis: 'x' });
  w.treasure(-26, 0, 62); PR.rock(w, -24.5, 0, 63, 1.2, 0xc9a46a, true); w.cp(0, 0, 50, PI); w.cp(0, 0, 37, PI);
  // pyramid outside: stepped mass + entrance with a patrol
  pyramidMass(w); const ent = textGeo('PYRAMID OF THE SUN SCARAB', 0.5, 0.15); if (ent) w.add('m', ent, 0x1d4ed8, 0, 6.85, 31.32);
  w.add('m', rbox(9, 2.2, 1.6, 0.15, 1), SST2, 0, 7.1, 30.5); for (const x of [-3.8, 3.8]) w.add('m', rbox(1.4, 6, 1.6, 0.15, 1), SST2, x, 3, 30.5); w.add('x', rbox(9.2, 0.2, 1.7, 0.05, 1), GOLD, 0, 6.0, 30.5); PR.catStatue(w, -6, 0, 33.5, 0, 1.3); PR.catStatue(w, 6, 0, 33.5, 0, 1.3); w.solid(-32, 0, 29.6, -4, 14, 30.4, { nocam: true }); w.solid(4, 0, 29.6, 32, 14, 30.4, { nocam: true });
  w.officers([{ x: -5, z: 35, path: [[-5, 35], [5, 35], [5, 38.5], [-5, 38.5]] }], [-30, 31, 30, 52]); for (const [x, z] of [[-9, 37], [9, 34], [-3, 32]]) w.hideSpot(x, 0, z, 'urn');
  w.evidence(26, 0, 33);
  // ---------------- B: hieroglyph hall (z 28..-4) + dart corridor (z -4..-26) ----------------
  room(w, -12, -4, 12, 28, 8, { S: [[-3, 3, 6]], N: [[-2, 2, 4]] }, { th: 1.2 }); PR.tiles(w, -12, -4, 12, 28, 0, [0xd9b77c, 0xc9a66a, 0xe3c48a], 2, { wobble: true });
  for (const x of [-11.2, 11.2]) { glyphs(w, 'z', x * 1.0, -2, 26, 2.2, 1); glyphs(w, 'z', x, -2, 26, 3.4, 1); for (const z of [22, 10, 0]) PR.torchSconce(w, x * 0.98, 3, z, x < 0 ? PI / 2 : -PI / 2); }
  for (const z of [20, 8]) { PR.pillar(w, -6, 0, z, 8, SST2, { r: 0.6 }); PR.pillar(w, 6, 0, z, 8, SST2, { r: 0.6 }); }
  PR.sarcophagus(w, -9, 0, 14, 0); PR.sarcophagus(w, 9, 0, 14, 0); PR.catStatue(w, -9, 0, 1, 0); PR.catStatue(w, 9, 0, 1, 0);
  for (const [x, z] of [[-11, 26], [11, 26], [-11, -2.5], [11, -2.5]]) PR.urn(w, x, 0, z, 1.0 + rnd() * 0.3, pick([0x1d4ed8, 0xb45309, 0x0e7490]));
  w.hint(-4, 22, 4, 27, '🔦 Torches flicker in here. Your TORCH helps in the dark corners!'); w.coinRing(0, 0, 14, 2.6, 8); w.treasure(-9, 1.0, 14); w.cp(0, 0, 25, PI);
  PR.ground(w, -2.5, -26, 2.5, -4, 0, floorF); room(w, -2, -26, 2, -5, 4.4, { S: [[-2, 2, 4]], N: [[-2, 2, 4]] }, { th: 1, wall: { col2: SST2, bh: 0.8, bl: 1.8 } });
  for (const [z, ph] of [[-9, 0], [-14, 0.33], [-19, 0.66]]) w.dartWall(-1.8, 0, z, [1, 0], 3.8, 2.4, ph, 2, 1.2);
  w.hint(-2, -7, 2, -4.5, '🎯 Darts! Watch the red lights, then dash between volleys.'); w.coinLine(0, 0, -7, 0, 0, -24, 6); w.cp(0, 0, -5.5, PI, 1.4);
  // ---------------- C: quicksand chamber (z -28..-62) ----------------
  room(w, -18, -62, 18, -28, 10, { S: [[-2, 2, 4]], N: [[-2.5, 2.5, 5.2]] }); PR.tiles(w, -18, -36, 18, -28, 0, [0xd9b77c, 0xc9a66a], 2); PR.tiles(w, -18, -62, 18, -52, 0, [0xd9b77c, 0xc9a66a], 2);
  PR.ground(w, -18, -52, 18, -36, -0.6, sandF, { bump: 0 }); w.quicksand(-18, -52, 18, -36, -0.55);
  w.mover(-4, -0.6, -40, [2.4, 0.7, 2.4], [8, 0, 0], 4.5, 0, SST2); w.mover(4, -0.6, -44.5, [2.4, 0.7, 2.4], [-8, 0, 0], 4.5, 0.5, SST2); w.mover(-4, -0.6, -49, [2.4, 0.7, 2.4], [8, 0, 0], 4.5, 0.25, SST2);
  w.hook(12, 7, -44, false); w.add('m', cyl(8), 0xc2a26f, 12, 7.4, -44, 0, 0, 0, 0.04, 2.6, 0.04);
  PR.mossyBlock(w, 15.5, -0.6, -44, 3, 2.4, 3, SST2); w.treasure(15.5, 1.8, -44); w.coinLine(-4, 0.4, -40, 4, 0.4, -49, 5);
  w.hint(-6, -35, 6, -30, '🟨 Ride the sliding stones over the quicksand! (There\u2019s a treasure ledge by the golden ring.)');
  for (const x of [-17.2, 17.2]) for (const z of [-32, -58]) PR.torchSconce(w, x, 3.6, z, x < 0 ? PI / 2 : -PI / 2); glyphs(w, 'x', -61.4, -16, 16, 4, -1);
  w.animal('scorpion', -10, 0, -57, { range: 3 }); w.animal('bat', 8, 4, -58, { range: 3 }); w.heartP(-15, 0, -59); w.cp(0, 0, -30, PI); w.cp(0, 0, -54, PI);
  // ---------------- D: sun-mirror hall (z -64..-92) ----------------
  room(w, -16, -92, 16, -64, 10, { S: [[-2.5, 2.5, 5.2]], N: [[-2.5, 2.5, 5.2]] }); PR.tiles(w, -16, -92, 16, -64, 0, [0xd9b77c, 0xc9a66a, 0xe3c48a], 2, { wobble: true });
  w.add('l', cyl(20), 0xfff3a0, -11, 1.75, -68, 0, 0, 0, 0.5, 8.4, 0.5, 1.6); w.add('l', rbox(2, 0.05, 2, 0.02, 1), 0xfffbe0, -11, 9.95, -68, 0, 0, 0, 1, 1, 1, 2); w.lights.push({ x: -11, y: 6, z: -68, c: 0xfff3c0, i: 26, d: 18 });
  w.statue('mr1', 'mirrors', -11, 0, -68, 0, 2, 'mirror'); w.statue('mr2', 'mirrors', -11, 0, -80, 3, 1, 'mirror'); w.statue('mr3', 'mirrors', 0, 0, -80, 1, 2, 'mirror');
  w.beam('mirrors', [[-11, 1.75, -68], [-11, 1.75, -80], [0, 1.75, -80], [0, 3.0, -91.4]]);
  w.door('sunDoor', 0, 0, -92.5, 5, 5.2, 1.1, ['S:mirrors'], 0xc9a66a, '☀️ The sunbeam hits the sun door... it glows and swings open!');
  PR.relief(w, 'x', -91.9, 0, 5.4, 6, 2.6, 1, GOLD, 'sun');
  w.hint(-6, -70, 6, -65, '☀️ Turn the 3 mirrors (ACT) to bounce the sunbeam from the ceiling hole all the way to the SUN on the far door!');
  for (const [x, z] of [[-15, -90], [15, -90]]) PR.goldPile(w, x, 0, z, 1.1); for (const x of [-15.2, 15.2]) for (const z of [-70, -86]) PR.torchSconce(w, x, 3.4, z, x < 0 ? PI / 2 : -PI / 2);
  for (const [x, z, ph] of [[8, -72, 0], [8, -86, 0.5], [-6, -88, 0.25]]) w.jet(x, 0, z, 3, ph, 'fire');
  w.treasure(14, 0, -66); w.evidence(-14.5, 0, -90); w.animal('snake', 10, 0, -78, { range: 3, axis: 'z' }); w.coinLine(-6, 0, -74, 6, 0, -74, 5); w.cp(0, 0, -66, PI);
  // ---------------- E: burial chamber vs. Mecha-Mummy (z -94..-140) + side tunnel to the jeep ----------------
  room(w, -20, -140, 20, -94, 12, { S: [[-2.5, 2.5, 5.2]], E: [[-132, -126, 5]] }); PR.tiles(w, -20, -140, 20, -94, 0, [0xc9a66a, 0xb8955a, 0xd9b77c], 2.4, { wobble: true });
  for (const [x, z] of [[-16, -100], [16, -100], [-16, -116], [16, -116], [-16, -132], [16, -132]]) { PR.pillar(w, x, 0, z, 12, SST2, { r: 0.6 }); }
  for (const x of [-19.2, 19.2]) for (const z of [-104, -122]) PR.torchSconce(w, x, 4, z, x < 0 ? PI / 2 : -PI / 2);
  // burial chamber dressing: carved reliefs on every wall, glyph bands, gold piles, sand drifts, more sarcophagi, braziers of light
  for (const z of [-102, -112, -122, -132]) { PR.relief(w, 'z', -19.6, z, 3.4, 5, 3, 1, SST2, pick(['sun', 'mix'])); PR.relief(w, 'z', 19.6, z, 3.4, 5, 3, -1, SST2, pick(['sun', 'mix'])); }
  for (const x of [-12, 12]) PR.relief(w, 'x', -139.6, x, 4, 7, 3.2, 1, GOLD, 'sun');
  for (const x of [-19.4, 19.4]) { glyphs(w, 'z', x, -138, -96, 1.3, 1); glyphs(w, 'z', x, -138, -96, 7.4, 1); glyphs(w, 'z', x, -138, -96, 8.3, 1); }
  for (const [x, z, sc] of [[-17.5, -97, 1.2], [17.5, -97, 1.1], [-17.5, -139, 1.4], [17.5, -139, 1.3], [-6, -139, 0.9], [6, -139, 0.9]]) PR.goldPile(w, x, 0, z, sc);
  for (const [x, z] of [[-19, -110], [19, -126], [-19, -126], [19, -104], [-13, -139.3], [13, -139.3]]) PR.dune(w, x, 0, z, rr(2.5, 3.5), rr(0.6, 1), rr(2, 3), 0xe9c98a);
  PR.sarcophagus(w, -18.3, 0, -112, PI / 2); PR.sarcophagus(w, 18.3, 0, -120, -PI / 2);
  for (const [x, z] of [[-10, -96], [10, -96]]) { w.brazier('br' + x, x, 0, z); }
  for (let x = -18; x <= 18; x += 6) w.add('m', rbox(0.7, 0.7, 46, 0.08, 1), 0x6b4f2e, x, 11.65, -117);
  for (const [x, z] of [[-8, -100], [8, -100], [-8, -128], [8, -128]]) PR.urn(w, x, 0, z, 1.1, pick([0x1d4ed8, 0xb45309, 0x0e7490]));
  PR.sarcophagus(w, -9, 0, -136, 0); PR.sarcophagus(w, 9, 0, -136, 0); PR.catStatue(w, -15, 0, -137, 0, 1.4); PR.catStatue(w, 15, 0, -137, 0, 1.4);
  PR.stairs(w, 0, 0, -133, PI, 3, 0.4, 0.9, 6, SST2); w.slab('m', SST2, 0, 0, -137.2, 6, 1.2, 3, 0.1); w.add('x', sph(24), 0xd4a017, 0, 1.2, -137.2, 0, 0, 0, 0.8, 0.1, 0.8);
  w.relicPos = [0, 2.6, -137.2]; w.bossSpec = { type: 'mummy', x: 0, y: 0, z: -116, yaw: 0, arena: [-18, -131, 18, -97] };
  w.talk(-6, -99, 6, -94.5, 'vintage', '"Behold, MECHA-MUMMY VINTAGE! Wrapped in only the finest bandages. Mwahaha... *cough* ...sand."');
  w.coinRing(0, 0, -114, 7, 16); w.heartP(-18, 0, -106); w.heartP(18, 0, -124); w.evidence(-18.5, 0, -138); w.cp(0, 0, -96, PI);
  room(w, 22, -132, 46, -126, 5, { W: [[-132, -126, 5]], E: [[-132, -126, 5]] }); PR.ground(w, 20, -132, 46, -126, 0, floorF); for (const x of [26, 34, 42]) { PR.torchSconce(w, x, 2.8, -131.4, 0); PR.torchSconce(w, x + 4, 2.8, -126.6, PI); }
  PR.ground(w, 46, -150, 74, -108, 0, sandF, { bump: 0.2 }); w.solid(45, 0, -151, 75, 14, -150, { nocam: true }); w.solid(74, 0, -151, 75, 14, -107, { nocam: true }); w.solid(45, 0, -108, 75, 14, -107, { nocam: true });
  w.solid(45, 0, -150, 46, 14, -132, { nocam: true }); w.solid(45, 0, -126, 46, 14, -108, { nocam: true });
  jeep(w, 63, 0, -129, 1.2, 0xd97706); w.escape = [58, -134, 68, -124, 0];
  for (let i = 0; i < 10; i++) PR.dune(w, rr(52, 74), 0, pick([rr(-150, -138), rr(-120, -108)]), rr(4, 8), rr(1.5, 3), rr(3, 6)); for (const [x, z] of [[56, -114], [70, -144], [52, -146], [70, -112]]) PR.palm(w, x, 0, z, 7, 0.3);
  w.chaseSpec = { list: [{ x: 0, z: -95.5 }, { x: -2, z: -96.5 }, { chief: true, x: 2, z: -96.5 }], bounds: [-19, -139, 73, -95] };
  for (const [x, z] of [[-12, -126], [12, -106], [52, -127]]) w.hideSpot(x, 0, z, 'urn');
};

// The pyramid's outside: a vertical stone facade at the front, then stepped tiers. The tiers that overlap the rooms inside are hollow
// rings (so you never see a tier's underside from inside a room); higher tiers above every ceiling are solid blocks.
function pyramidMass(w) { const X = 44, Z0 = 31, Z1 = -162, H = 3.2, top = 12.8;
  const box = (x0, y0, z0, x1, y1, z1, c) => { if (x1 - x0 < 0.05 || z1 - z0 < 0.05) return; w.add('m', rbox(x1 - x0, y1 - y0, z1 - z0, 0.1, 1), c, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); };
  for (let i = 0; i < 12; i++) { const y0 = i * H, y1 = y0 + H, c = shade(SST, 0.9 + (i % 2) * 0.07), ix = i * 2.6, x = X - ix, zb = Z1 + ix; const zf = y1 <= top + 0.01 ? Z0 : Z0 - (i - 3) * 2.6;
    if (y1 <= top + 0.01) { const t = 4, inner = x - t;
      // front facade (z 29.3..31) with the doorway, back wall, and the two side walls (east one with the escape tunnel gap)
      if (y0 < 6.4) { box(-x, y0, 29.3, -3, y1, Z0, c); box(3, y0, 29.3, x, y1, Z0, c); } else box(-x, y0, 29.3, x, y1, Z0, c);
      box(-x, y0, zb, x, y1, zb + t, c); box(-x, y0, zb + t, -inner, y1, 29.3, c);
      if (y0 < 6.4) { box(inner, y0, zb + t, x, y1, -134, c); box(inner, y0, -124, x, y1, 29.3, c); } else box(inner, y0, zb + t, x, y1, 29.3, c);
    } else box(-x, y0, zb, x, y1, zf, c);
    w.add('x', rbox(2 * x + 0.1, 0.16, 0.1, 0.03, 1), 0xd4a017, 0, y1 - 0.1, (y1 <= top + 0.01 ? Z0 : zf) + 0.05); }
  w.add('x', cone(4), GOLD, 0, 12 * H, -60, 0, PI / 4, 0, 6, 6, 6);
  for (const x of [-30, -18, 18, 30]) { w.add('m', rbox(3.2, 9, 0.6, 0.1, 1), shade(SST2, 0.95), x, 4.5 + 3.2, Z0 + 0.3); w.add('x', rbox(2.4, 0.4, 0.2, 0.05, 1), 0x1d4ed8, x, 10, Z0 + 0.65); w.add('x', sph(16), GOLD, x, 6.6, Z0 + 0.65, 0, 0, 0, 0.7, 0.7, 0.2); }
}
