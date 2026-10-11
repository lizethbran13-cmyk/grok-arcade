// Expedition 5 (finale): Vintage's Sky Fortress (above the clouds). Torty's balloon deck -> cloud hop (moving clouds, whip buoy)
// -> rope bridge -> fortress outer deck (2 levers, Relic Patrol) -> hangar (sandbag swings, spike strips, plate + block puzzle)
// -> top deck vs. Professor Vintage's Sky Suit -> escape across the gangplank to Torty's balloon.
import { BUILD, PI } from './levels.js';
import { PR } from './lvlkit.js';
import { rbox } from './world.js';
import { sph, cyl, cone, torus, gear, blobGeo } from './shapes.js';
import { textGeo } from './text3d.js';
import { rnd, rr, pick, shade, mix } from './props.js';
const WOOD = 0xb07a45, WOOD2 = 0x9a6a3a, PURP = 0x7e22ce, PURP2 = 0x9333ea, GOLD = 0xfacc15, METAL = 0x8b8fa3;
BUILD.finale = (w) => { w.music = 'finale'; w.killY = -14; w.camDist = 5.0; w.fillI = 3; w.lightN = 5;
  w.env = { sunDir: [0.55, 0.75, 0.25], sunColor: 0xfff4e0, sunI: 3.0, hemiSky: 0xdbeafe, hemiGround: 0xffffff, hemiI: 0.75, skyTop: 0x2563eb, skyMid: 0x93c5fd, skyBot: 0xfdf2f8, fog: 0xe0ecff, fogD: 0.0045, envI: 0.95, exposure: 1.0, bloomT: 1.0, bloomS: 0.42, envLight: 0xffffff };
  w.start = [0, 0, 58]; w.startYaw = PI;
  const plankLines = (x0, z0, x1, z1, y, alongZ = true) => w.lodNear(() => { if (alongZ) for (let x = x0 + 0.9; x < x1 - 0.2; x += 0.9) w.add('m', rbox(0.05, 0.03, z1 - z0 - 0.1, 0.01, 1), shade(WOOD, 0.7), x, y + 0.01, (z0 + z1) / 2); else for (let z = z0 + 0.9; z < z1 - 0.2; z += 0.9) w.add('m', rbox(x1 - x0 - 0.1, 0.03, 0.05, 0.01, 1), shade(METAL, 0.75), (x0 + x1) / 2, y + 0.01, z); });
  const deck = (x0, z0, x1, z1, col, o = {}) => { w.slab(o.b || 'm', col, (x0 + x1) / 2, -0.7, (z0 + z1) / 2, x1 - x0, 0.7, z1 - z0, 0.12); w.add('x', rbox(x1 - x0 + 0.2, 0.18, z1 - z0 + 0.2, 0.06, 1), o.trim || GOLD, (x0 + x1) / 2, -0.62, (z0 + z1) / 2);
    w.add('m', rbox(x1 - x0 - 1.2, 1.6, z1 - z0 - 1.2, 0.5, 2), shade(col, 0.7), (x0 + x1) / 2, -1.5, (z0 + z1) / 2); plankLines(x0, z0, x1, z1, 0, !o.metal); };
  const rail = (x0, z0, x1, z1, gaps = []) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.round(L / 2.2); for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; if (gaps.some(([a, b]) => (x0 === x1 ? z : x) > a && (x0 === x1 ? z : x) < b)) continue; w.add('x', cyl(10), GOLD, x, 0, z, 0, 0, 0, 0.06, 1.1, 0.06); w.add('x', sph(10), GOLD, x, 1.12, z, 0, 0, 0, 0.1); }
    const segs = []; let cur = x0 === x1 ? z0 : x0; const end = x0 === x1 ? z1 : x1; const lo = Math.min(cur, end), hi = Math.max(cur, end); let s = lo; for (const [a, b] of gaps.slice().sort((p, q) => p[0] - q[0])) { if (a > s) segs.push([s, a]); s = b; } if (s < hi) segs.push([s, hi]);
    for (const [a, b] of segs) { if (x0 === x1) { PR.rope(w, x0, 1.05, a, x0, 1.05, b, 0xc2a26f, 0.04, 0.12); w.sideWall(x0 - 0.1, -1, a, x0 + 0.1, 3, b); } else { PR.rope(w, a, 1.05, z0, b, 1.05, z0, 0xc2a26f, 0.04, 0.12); w.sideWall(a, -1, z0 - 0.1, b, 3, z0 + 0.1); } } };
  const cloudPuff = (x, y, z, s) => { for (let i = 0; i < 5; i++) w.add('w', blobGeo((i * 13 + (x | 0)) & 63, 0.18, 2), mix(0xffffff, 0xe0e7ff, rnd() * 0.5), x + rr(-1, 1) * s, y + rr(-0.3, 0.3) * s, z + rr(-1, 1) * s, 0, rnd() * 6, 0, s * rr(1.2, 1.8), s * rr(0.6, 0.9), s * rr(1.2, 1.8)); };
  const cloud = (x, y, z, r = 1.8) => { w.solid(x - r, y - 0.6, z - r, x + r, y, z + r); w.add('m', blobGeo((x * 7 + z | 0) & 63, 0.12, 2), 0xffffff, x, y - 0.35, z, 0, rnd() * 6, 0, r * 1.15, 0.55, r * 1.15); for (let i = 0; i < 3; i++) w.add('m', sph(16), 0xf8fafc, x + rr(-r, r) * 0.7, y - 0.5, z + rr(-r, r) * 0.7, 0, 0, 0, r * 0.6, 0.5, r * 0.6); };
  // the sea of clouds below everything
  for (let i = 0; i < 70; i++) cloudPuff(rr(-90, 90), rr(-22, -12), rr(-180, 100), rr(5, 11));
  for (let i = 0; i < 14; i++) cloudPuff(pick([-1, 1]) * rr(40, 90), rr(4, 24), rr(-160, 80), rr(3, 6));
  // ---------------- A: Torty's balloon deck (z 64..40) ----------------
  deck(-10, 40, 10, 64, WOOD); rail(-10, 40, -10, 64); rail(10, 40, 10, 64); rail(-10, 64, 10, 64); rail(-10, 40, 10, 40, [[-2.5, 2.5]]);
  { const x = -5, z = 57; w.slab('m', 0x92400e, x, 0, z, 2.6, 1.2, 2.6, 0.2); for (const [a, b] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) PR.rope(w, x + a, 1.2, z + b, x + a * 2.6, 7.2, z + b * 2.6, 0xc2a26f, 0.03, 0.02);
    balloon(w, x, z); w.add('l', sph(10), 0xffa53d, x, 6.6, z, 0, 0, 0, 0.5, 0.4, 0.5, 2); }
  PR.crate(w, 6, 0, 60); PR.crate(w, 6, 1.2, 60, 0.9, 0xa0703a); PR.crate(w, 7.4, 0, 61, 1, 0xa0703a); PR.barrel(w, -8, 0, 44, 0x7c3aed); PR.barrel(w, 8, 0, 44, 0x0ea5e9);
  w.treasure(6, 2.3, 60); w.martinaSpec = { x: -2, y: 0, z: 54, yaw: 0.6, s: 0.42, label: '🐢 Talk to Torty' };
  w.martinaSay = () => { const L = ['"Torty at your service, Captain! That\u2019s Vintage\u2019s Sky Fortress dead ahead. All the stolen relics are up there."', '"Hop the clouds. Some of them drift! Fall through and you\u2019ll bounce back up here (cartoon physics)."', '"The hangar door needs TWO levers pulled, one on each side of the outer deck."', '"Grab the Star Crown and that evidence, and the Relic Patrol will finally believe us!"']; w._mi = ((w._mi ?? -1) + 1) % L.length; return L[w._mi]; };
  w.talk(-8, 48, 6, 58, 'martina', '"We made it above the clouds, explorer! Press ACT next to me for the plan."');
  for (let z = 56; z > 41; z -= 3) w.coin(0, 0, z); w.hint(-4, 40, 4, 44, '☁️ Hop across the clouds! Some drift side to side: time your jumps.'); w.cp(0, 0, 42.5, PI);
  // ---------------- B: cloud hop (z 38..14) + whip buoy ----------------
  cloud(0, 0, 36); cloud(3.4, 0.4, 31.6); w.mover(-1, 0.1, 27, [3.2, 0.6, 3.2], [5, 0, 0], 4, 0, 0xf1f5f9); cloud(-1.5, 0.6, 22.4); cloud(2, 0.6, 18);
  for (const [x, y, z] of [[0, 0.7, 36], [3.4, 1.1, 31.6], [-1.5, 1.3, 22.4], [2, 1.3, 18]]) w.coin(x, y - 0.7, z);
  w.add('g', sph(20), 0xef4444, 10, 7.8, 27, 0, 0, 0, 1.2, 1.4, 1.2); PR.rope(w, 10, 6.4, 27, 10, 5.4, 27, 0xc2a26f, 0.03, 0.01); w.hook(10, 5.2, 27, false); cloud(15, 0.4, 27, 2.2); w.treasure(15, 0.4, 27);
  w.hint(-3, 33, 5, 38, '🎈 See the red buoy balloon? Whip its golden ring to swing to the treasure cloud!');
  deck(-4, 10, 4, 15.5, WOOD2); w.cp(0, 0, 13, PI, 1.8);
  // rope bridge to the fortress
  w.bridge(0, 10, 0, -4, 0, 2.6, true); w.sideWall(-1.5, -6, -4, -1.35, 3, 10); w.sideWall(1.35, -6, -4, 1.5, 3, 10); w.coinLine(0, 0.3, 9, 0, 0.3, -3, 5);
  // ---------------- C: fortress outer deck (z -4..-41) ----------------
  deck(-18, -41, 18, -4, 0xa8744a, { trim: PURP }); rivetBand(w, -18, -41, 18, -4); rail(-18, -4, -2, -4); rail(2, -4, 18, -4); rail(-18, -41, -18, -4); rail(18, -41, 18, -4);
  for (const [x, z] of [[-17, -5], [17, -5]]) { w.add('g', cyl(24), PURP, x, 0, z, 0, 0, 0, 1.4, 9, 1.4); w.add('x', cone(24), GOLD, x, 9, z, 0, 0, 0, 1.7, 3, 1.7); w.solid(x - 1.4, 0, z - 1.4, x + 1.4, 9, z + 1.4); PR.banner(w, x + (x < 0 ? 1.45 : -1.45), 7.5, z, x < 0 ? PI / 2 : -PI / 2, PURP2, 4); }
  for (const s of [-1, 1]) { const T = w.tf(s * 19.5, 2.5, -22, s * PI / 2); T.add('x', sph(16), METAL, 0, 0, 0, 0, 0, 0, 1, 1, 1.6); const gg = gear(10); T.add('x', gg, GOLD, 0, 0, 1.7, 0, 0, 0, 0.7, 0.7, 0.2); for (let i = 0; i < 3; i++) T.add('g', rbox(0.5, 3.6, 0.1, 0.1, 2), PURP2, Math.sin(i * 2.1) * 1.6, Math.cos(i * 2.1) * 1.6, 1.85, 0, 0, -i * 2.1); }
  { const sg = textGeo("VINTAGE'S SKY FORTRESS", 0.6, 0.15); w.add('m', rbox(11, 1.2, 0.3, 0.1, 1), 0x4c1d95, 0, 9.0, -40.6); if (sg) w.add('m', sg, GOLD, 0, 8.75, -40.4); }
  fortress(w);
  w.lever('h1', -15.5, 0, -28, PI / 2); w.lever('h2', 15.5, 0, -16, -PI / 2);
  w.officers([{ x: -8, z: -12, path: [[-8, -12], [8, -12], [8, -24], [-8, -24]] }, { x: 6, z: -34, path: [[6, -34], [-6, -34], [-6, -29], [6, -29]] }], [-17.5, -40, 17.5, -4.5]);
  for (const [x, z] of [[-12, -8], [12, -10], [-3, -18], [12, -30], [-12, -36]]) w.hideSpot(x, 0, z, pick(['crate', 'barrel']));
  w.talk(-6, -8, 6, -4.5, 'patrol', '"Inspector Pickles told us to guard Vintage\u2019s blimp. He says YOU\u2019RE the thief. ...Are you, though?"');
  w.hint(-5, -12, 5, -6, '🔧 Pull BOTH hangar levers (left and right side) without getting spotted by the patrol!');
  w.evidence(-16, 0, -39); w.treasure(12.5, 0, -38.5); w.coinRing(12.5, 0, -38.5, 1.2, 5); w.coinLine(-14, 0, -8, -14, 0, -32, 6); w.coinLine(14, 0, -20, 14, 0, -36, 4); w.cp(0, 0, -5.5, PI);
  // ---------------- D: hangar (z -42..-76) ----------------
  PR.stoneRoom(w, -14, -76, 14, -42, 9, PURP, { doors: { S: [[-2.5, 2.5, 5.2]], N: [[-2.5, 2.5, 5.2]] }, ceilCol: 0x4c1d95, beams: 5, wall: { col2: PURP2, bh: 1.2, bl: 2.4, skip: 0.02 } });
  w.door('hDoor', 0, 0, -41.5, 5, 5.2, 1.1, ['h1', 'h2'], 0x6b21a8, '🔧 Both levers down! The hangar door clanks open.');
  w.slab('x', METAL, 0, -0.7, -59, 28, 0.7, 34, 0.08); plankLines(-14, -76, 14, -42, 0, false);
  for (let i = 0; i < 4; i++) w.spikes(-14 + i * 7, -50, -7 + i * 7, -47, 0, 3, (i % 2) * 0.5, 0.42);
  for (const [z, ph] of [[-55, 0]]) { w.swingLog(0, 8.6, z, 'x', 5.4, 2.8, ph); }
  w.plate('pA', -8, 0.0, -68, 1.0); w.plate('pB', 8, 0.0, -68, 1.0); w.pushBlock('blk', 8, 0.0, -61.5, 1.8, 0xc4b5fd);
  w.door('gDoor', 0, 0, -76.5, 5, 5.2, 1.1, ['pA', 'pB'], 0x6b21a8, '⭐ Clunk! The top-deck hatch opens!');
  w.hint(-14, -66, 14, -58, '⭐ Two star plates again: push the purple crate onto one and stand on the other!');
  for (const x of [-13.4, 13.4]) for (const z of [-46, -60, -72]) PR.lantern(w, x * 0.95, 6, z, 0xf0abfc);
  PR.crate(w, -12, 0, -44); PR.crate(w, -12, 1.2, -44, 0.9); w.treasure(-12, 2.3, -44); w.evidence(12.5, 0, -70); PR.barrel(w, 12.5, 0, -73, 0x7c3aed); PR.barrel(w, 11.5, 0, -74.5, 0x7c3aed);
  w.treasure(-12, 0, -73.5); w.heartP(12, 0, -44); w.animal('bat', -6, 4, -64, { range: 3 }); w.animal('bat', 6, 4, -46, { range: 3 }); w.coinRing(-8, 0, -68, 1.8, 6);
  w.cp(0, 0, -43.5, PI); w.cp(0, 0, -57.5, PI);
  // ---------------- E: top deck arena (z -77..-120) + gangplank to Torty's balloon ----------------
  deck(-20, -120, 20, -77, 0xb07a45, { trim: PURP }); rivetBand(w, -20, -120, 20, -77); w.add('x', torus(0.12, 64), GOLD, 0, 0.03, -98, PI / 2, 0, 0, 8, 8, 0.4); w.add('m', rcylF(), 0x9a6a3a, 0, 0.0, -98, 0, 0, 0, 7.8, 0.03, 7.8); rail(-20, -120, 20, -120); rail(-20, -120, -20, -77, [[-100, -94]]); rail(20, -120, 20, -77); rail(-20, -77, -15, -77); rail(15, -77, 20, -77);
  for (const [x, z] of [[-18, -79], [18, -79], [-18, -118], [18, -118]]) { w.add('g', cyl(20), PURP, x, 0, z, 0, 0, 0, 1, 6, 1); w.add('x', cone(20), GOLD, x, 6, z, 0, 0, 0, 1.2, 2, 1.2); w.solid(x - 1, 0, z - 1, x + 1, 6, z + 1); }
  PR.stairs(w, 0, 0, -113, PI, 3, 0.4, 0.9, 6, PURP2); w.slab('x', PURP2, 0, 0, -117.2, 6, 1.2, 3, 0.1); w.add('x', sph(24), 0xd4a017, 0, 1.2, -117.2, 0, 0, 0, 0.8, 0.1, 0.8);
  w.relicPos = [0, 2.6, -117.2]; w.bossSpec = { type: 'zeppelin', x: 0, y: 0, z: -98, yaw: 0, arena: [-18, -111, 18, -79] };
  w.talk(-6, -82, 6, -77.5, 'vintage', '"You! AGAIN! Fine. FINE! Behold my Sky Suit! Nobody takes the Star Crown from Professor Vintage!"');
  // Vintage's own blimp docked alongside (no shadow casting: 'w')
  { const x = 46, y = 18, z = -98; w.add('w', sph(40), PURP, x, y, z, 0, 0, 0, 9, 9, 26); for (let i = 0; i < 4; i++) w.add('w', sph(40), PURP2, x, y, z, 0, 0, i * PI / 4, 9.06, 0.9, 26.1); w.add('w', torus(0.3, 48), GOLD, x, y, z, PI / 2, 0, 0, 9.1, 9.1, 1); w.add('w', torus(0.3, 48), GOLD, x, y, z - 10, PI / 2, 0, 0, 8.4, 8.4, 1); w.add('w', torus(0.3, 48), GOLD, x, y, z + 10, PI / 2, 0, 0, 8.4, 8.4, 1);
    for (const r of [0, PI / 2, PI, -PI / 2]) w.add('w', cone(4), PURP2, x + Math.sin(r) * 2.6, y + Math.cos(r) * 2.6, z + 25, PI / 2, 0, r, 0.4, 5, 3.4); const vg = textGeo('VINTAGE', 1.6, 0.3); if (vg) w.add('w', vg, GOLD, x - 9.15, y, z, 0, -PI / 2, 0); }
  // top-deck machinery: boilers, smokestacks, gear trains, pipes, banners on poles, side propeller pylons, searchlights
  for (const [x, z] of [[-16, -86], [16, -112]]) { w.add('x', cyl(28), 0x9ca3af, x, 0, z, 0, 0, 0, 1.6, 3.4, 1.6); w.add('x', sph(28), 0x9ca3af, x, 3.4, z, 0, 0, 0, 1.6, 0.9, 1.6); for (const y of [0.6, 1.8, 3.0]) w.add('x', torus(0.08, 40), 0xb45309, x, y, z, PI / 2, 0, 0, 1.64, 1.64, 1); w.add('x', cyl(16), 0x374151, x + 0.6, 3.6, z, 0, 0, 0, 0.35, 4, 0.35); w.add('l', sph(12), 0xff7a1f, x, 1.2, z + 1.58, 0, 0, 0, 0.35, 0.35, 0.1, 1.4); w.solid(x - 1.6, 0, z - 1.6, x + 1.6, 4.3, z + 1.6); }
  PR.pipe(w, -16, 2.4, -86, -16, 2.4, -112, 0.25, 0xb45309); PR.pipe(w, 16, 2.4, -86, 16, 2.4, -112, 0.25, 0xb45309);
  for (const [x, z, sc, ry] of [[-19, -100, 1.6, 0], [-19, -104, 1.0, 0.5], [19, -92, 1.5, 0.2], [19, -96, 1.0, 0.7]]) w.add('x', gear(12), GOLD, x, 1.8 + sc, z, 0, PI / 2, ry, sc, sc, 0.25);
  for (const [x, z] of [[-10, -78], [10, -78], [-10, -119], [10, -119]]) { w.add('x', cyl(10), GOLD, x, 0, z, 0, 0, 0, 0.08, 6, 0.08); PR.banner(w, x + 0.8, 5.8, z, 0, pick([PURP2, 0xdb2777]), 3); }
  for (const s of [-1, 1]) for (const z of [-88, -108]) { const T = w.tf(s * 23, 1.2, z, s * PI / 2); T.add('x', rbox(3.2, 0.5, 0.5, 0.1, 1), METAL, s * 0, 0, 0, 0, PI / 2, 0); T.add('x', sph(16), METAL, 0, 0, 0, 0, 0, 0, 0.9, 0.9, 1.5); T.add('x', gear(10), GOLD, 0, 0, 1.5, 0, 0, 0, 0.5, 0.5, 0.2); for (let i = 0; i < 3; i++) T.add('g', rbox(0.5, 3.4, 0.1, 0.1, 2), PURP2, Math.sin(i * 2.1) * 1.5, Math.cos(i * 2.1) * 1.5, 1.7, 0, 0, -i * 2.1); w.add('x', rbox(3, 0.4, 0.4, 0.05, 1), METAL, s * 21.5, 1.2, z); }
  for (const [x, z] of [[-14, -119], [14, -78]]) { w.add('x', cyl(12), 0x374151, x, 0, z, 0, 0, 0, 0.12, 2.6, 0.12); w.add('x', cone(20), 0x374151, x, 2.6, z, -0.7, x < 0 ? 0.6 : -2.5, 0, 0.6, 0.9, 0.6); w.add('l', sph(16), 0xfffbe0, x, 2.9, z, 0, 0, 0, 0.35, 0.35, 0.35, 2); }
  PR.crate(w, 14, 0, -116); PR.crate(w, 15.3, 0, -116.4, 0.8, 0xa0703a); PR.barrel(w, -14.5, 0, -82, 0x7c3aed); PR.barrel(w, -13.4, 0, -81.2, 0xdb2777);
  for (let i = 0; i < 16; i++) cloudPuff(rr(-34, 34), rr(-9, -5), rr(-126, -72), rr(3, 6));
  for (const [x, z, c] of [[-21, -80, 0xef4444], [21, -118, 0x22c55e], [21, -80, 0x3b82f6], [-21, -118, 0xf59e0b]]) { w.add('g', sph(20), c, x, 7.5, z, 0, 0, 0, 0.9, 1.1, 0.9); PR.rope(w, x, 0.9, z, x, 6.4, z, 0xe5e7eb, 0.02, 0.02); }
  w.coinRing(0, 0, -98, 7, 16); w.heartP(-17, 0, -88); w.heartP(17, 0, -108); w.evidence(17.5, 0, -82); w.cp(0, 0, -79, PI);
  w.bridge(-20, -97, -28, -97, 0, 2.6, false); w.sideWall(-28, -6, -98.35, -20, 3, -98.2); w.sideWall(-28, -6, -95.8, -20, 3, -95.65);
  deck(-36, -103, -28, -91, WOOD); rail(-36, -103, -36, -91); rail(-36, -103, -28, -103); rail(-36, -91, -28, -91);
  { const x = -32.5, z = -97; w.slab('m', 0x92400e, x, 0, z + 3.6, 2.6, 1.2, 2.6, 0.2); balloon(w, x, z + 3.6); const lg = textGeo("TORTY'S BALLOON", 0.36, 0.1); if (lg) w.add('m', lg, 0x86efac, x, 2.2, z + 2.2, 0, 0, 0); }
  w.escape = [-35.5, -101, -29, -93, 0];
  w.chaseSpec = { list: [{ x: 0, z: -78.5 }, { x: -2, z: -79.5 }, { chief: true, x: 2, z: -79.5 }], bounds: [-35, -119, 19, -78] };
  for (const [x, z] of [[-12, -112], [12, -90], [-14, -84]]) w.hideSpot(x, 0, z, 'crate');
};
// Torty's striped hot-air balloon (envelope + basket ropes drawn by the caller)
function balloon(w, x, z) { w.add('g', sph(40), 0xf97316, x, 8.4, z, 0, 0, 0, 4.4, 5.2, 4.4); for (let i = 0; i < 4; i++) w.add('g', sph(40), 0xfacc15, x, 8.4, z, 0, i * PI / 4, 0, 4.46, 5.26, 0.7); w.add('g', cone(24), 0xf97316, x, 3.6, z, PI, 0, 0, 2.4, 1.8, 2.4); w.add('l', sph(10), 0xffa53d, x, 5.0, z, 0, 0, 0, 0.5, 0.4, 0.5, 2); }

function rcylF() { return cyl(48); }
// riveted metal border around a wooden deck
function rivetBand(w, x0, z0, x1, z1) { const c = 0x9ca3af; w.add('x', rbox(x1 - x0, 0.06, 0.9, 0.02, 1), c, (x0 + x1) / 2, 0.02, z0 + 0.45); w.add('x', rbox(x1 - x0, 0.06, 0.9, 0.02, 1), c, (x0 + x1) / 2, 0.02, z1 - 0.45); w.add('x', rbox(0.9, 0.06, z1 - z0, 0.02, 1), c, x0 + 0.45, 0.02, (z0 + z1) / 2); w.add('x', rbox(0.9, 0.06, z1 - z0, 0.02, 1), c, x1 - 0.45, 0.02, (z0 + z1) / 2);
  w.lodNear(() => { for (let x = x0 + 1; x < x1; x += 1.5) for (const z of [z0 + 0.45, z1 - 0.45]) w.add('x', sph(8), 0xd1d5db, x, 0.06, z, 0, 0, 0, 0.08, 0.05, 0.08); }); }
// the fortress architecture around the hangar box: corner towers with domes, a big gold-ribbed dome on the roof, round windows,
// a giant gear over the door, pipes up the walls, and little tethered balloons
function fortress(w) { const zS = -40.9, zT = -41.5, zN = -76.5;
  for (const [x, z] of [[-15.5, zT], [15.5, zT], [-15.5, zN], [15.5, zN]]) { w.add('g', cyl(32), PURP2, x, 0, z, 0, 0, 0, 2.2, 13, 2.2); for (const y of [3, 6.5, 10]) { w.add('x', torus(0.15, 48), GOLD, x, y, z, PI / 2, 0, 0, 2.25, 2.25, 1); }
    for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4, wx = x + Math.sin(a) * 2.18, wz = z + Math.cos(a) * 2.18; w.add('l', sph(14), 0xfde68a, wx, 8.2, wz, 0, 0, 0, 0.35, 0.5, 0.35, 1.2); w.add('x', torus(0.06, 24), GOLD, wx, 8.2, wz, 0, a, 0, 0.4, 0.55, 1); }
    w.add('g', sph(32), PURP, x, 13, z, 0, 0, 0, 2.4, 2.2, 2.4); w.add('x', cone(16), GOLD, x, 14.8, z, 0, 0, 0, 0.35, 2.2, 0.35); w.add('x', sph(12), GOLD, x, 17.1, z, 0, 0, 0, 0.3); w.solid(x - 2.2, 0, z - 2.2, x + 2.2, 13, z + 2.2); }
  // roof: drum + ribbed dome + lantern + flag
  w.add('g', cyl(48), PURP2, 0, 9.8, -59, 0, 0, 0, 8, 1.6, 8); w.add('x', torus(0.2, 64), GOLD, 0, 11.4, -59, PI / 2, 0, 0, 8.05, 8.05, 1);
  w.add('g', sph(48), PURP, 0, 11.4, -59, 0, 0, 0, 7.8, 6.5, 7.8); for (let k = 0; k < 8; k++) w.add('x', sph(40), GOLD, 0, 11.4, -59, 0, k * PI / 8, 0, 7.86, 6.56, 0.25);
  w.add('g', cyl(20), 0xfef3c7, 0, 17.6, -59, 0, 0, 0, 1, 1.6, 1); w.add('x', cone(20), GOLD, 0, 19.2, -59, 0, 0, 0, 1.2, 2.2, 1.2); w.add('x', cyl(8), GOLD, 0, 21.4, -59, 0, 0, 0, 0.05, 3, 0.05); w.add('f', rbox(2.2, 1.3, 0.05, 0.02, 1), 0xdb2777, 1.15, 23.6, -59);
  // facade: round windows, gear over the door, pipes, buttresses
  for (const x of [-10.5, -6, 6, 10.5]) { w.add('x', torus(0.16, 40), GOLD, x, 6.2, zS - 0.05, 0, 0, 0, 1.15, 1.15, 1); w.add('l', rcylW(), 0xfde68a, x, 6.2, zS + 0.0, PI / 2, 0, 0, 1.05, 0.05, 1.05, 1.1); w.add('x', rbox(0.1, 2.2, 0.08, 0.02, 1), GOLD, x, 6.2, zS + 0.06); w.add('x', rbox(2.2, 0.1, 0.08, 0.02, 1), GOLD, x, 6.2, zS + 0.06); }
  w.add('x', gear(14), GOLD, -2.6, 7.3, zS + 0.2, 0, 0, 0.2, 1.3, 1.3, 0.3); w.add('x', gear(10), 0xb45309, 2.4, 7.0, zS + 0.2, 0, 0, 0, 0.9, 0.9, 0.3);
  for (const x of [-12.8, 12.8]) { PR.pipe(w, x, 0.3, zS + 0.35, x, 9, zS + 0.35, 0.28, 0xb45309); w.add('x', cyl(16), 0x374151, x, 9, zS + 0.35, 0, 0, 0, 0.4, 2.4, 0.4); }
  for (const x of [-8.2, 8.2]) w.add('g', rbox(1.2, 8.8, 1.2, 0.2, 2), PURP, x, 4.4, zS + 0.4);
  // side walls get windows too
  for (const sd of [-1, 1]) for (const z of [-50, -59, -68]) { w.add('x', torus(0.14, 40), GOLD, sd * 14.55, 6, z, 0, PI / 2, 0, 1, 1, 1); w.add('l', rcylW(), 0xfde68a, sd * 14.5, 6, z, 0, 0, PI / 2, 0.9, 0.05, 0.9, 1.1); }
  for (const [x, z, c] of [[-17, -8, 0xef4444], [17, -8, 0x22c55e], [-17, -38, 0x3b82f6], [17, -38, 0xf59e0b]]) { w.add('g', sph(20), c, x, 8, z, 0, 0, 0, 0.9, 1.1, 0.9); w.add('g', cone(10), c, x, 6.8, z, PI, 0, 0, 0.18, 0.3, 0.18); PR.rope(w, x, 1.0, z, x, 6.8, z, 0xe5e7eb, 0.02, 0.02); } }
function rcylW() { return cyl(32); }
