// Grok Pickleball Park - Super Smash Expansion (DLC #84, 75 tickets)
// Walk-in Super Smash Complex on West Avenue with:
//   1. Lava Island Smash Court (-72, 38) — volcano, lava moat, flaming tiki torches & giant tiki statues
//   2. Moon Base Smash Court   (-90, 38) — lunar craters, geodesic domes, Moon Rocket on launchpad & lunar rover
//   3. Candy Stadium Court     (-81, 64) — giant swirl lollipop trees, candy canes, frosted cupcakes, chocolate river & jumbotron
//   4. Super Smash Pavilion & Tortuga/Ratita MaxGrit Repair Forge (-62, 56) — Smash Check-In, Smasher Podiums, Power Paddle Rack & Repair Bench
import * as K from './kit.js?v=ppk2';
import { rbox } from './world.js?v=ppk2';
import { txt } from './art.js?v=ppk2';
import { court, PAL, paddleProp, ballBucket, bleachers, umpireChair, scoreFrame, fence } from './court.js?v=ppk2';
import { smashOwned } from './dlc.js?v=ppk2';

const { rcyl, sph, cyl, cone, torus, capsule } = K;
const PI = Math.PI;

export function buildSmashComplex(w, SPOTS, SEATS, SITS, STANDS) {
  const owned = smashOwned();

  // ---------------- West Avenue Connector Paths from West Courts & Clubhouse ----------------
  // North connector from West Courts Walk (z = 19) into Super Smash Complex (z = 26)
  w.slab('m', 0xd6d1c4, -76, 0, 22.8, 9.5, 0.055, 8.2, 0.03, { floor: true });
  w.slab('g', 0xfef08a, -76, 0.058, 22.8, 0.35, 0.012, 7.6, 0.005);
  // East connector from Clubhouse Plaza (x = -52) into Super Smash Pavilion (x = -58)
  w.slab('m', 0xd6d1c4, -55, 0, 56, 7.5, 0.055, 6.2, 0.03, { floor: true });
  w.slab('g', 0xf97316, -55, 0.058, 56, 6.8, 0.012, 0.35, 0.005);

  // ---------------- Grand "SUPER SMASH ARENA" Entrance Archway at (-76, 25) ----------------
  [-4.4, 4.4].forEach((s) => {
    w.add('x', rcyl(0.32, 4.9, 0.05, 16), 0x1e293b, -76 + s, 0, 25.0);
    w.add('g', rcyl(0.42, 0.36, 0.04, 16), 0xef4444, -76 + s, 0, 25.0);
    w.add('l', sph(12), 0xfacc15, -76 + s, 5.1, 25.0, 0, 0, 0, 0.28, 0.28, 0.28, 1.1);
    w.solid(-76 + s - 0.35, 0, 24.65, -76 + s + 0.35, 5.0, 25.35);
  });
  w.slab('g', 0x0f172a, -76, 4.35, 25.0, 9.8, 1.05, 0.45, 0.08);
  w.slab('g', 0xef4444, -76, 5.38, 25.0, 10.2, 0.18, 0.52, 0.04);
  txt(w, '💥 SUPER SMASH ARENA 💥', -76, 4.95, 24.74, PI, 0.42, 0xfacc15, 'l');
  txt(w, 'CHARGED SUPER SHOTS • 3 SMASH COURTS • MAXGRIT FORGE', -76, 4.55, 24.74, PI, 0.19, 0x38bdf8, 'l');
  txt(w, '💥 SUPER SMASH ARENA 💥', -76, 4.95, 25.26, 0, 0.42, 0xfacc15, 'l');

  if (!owned) {
    // Locked preview gate when DLC is not owned
    w.slab('g', 0x1e293b, -76, 0, 25.0, 8.2, 2.2, 0.24, 0.04, { wall: true });
    txt(w, '🔒 SUPER SMASH EXPANSION DLC (75 TICKETS)', -76, 1.35, 24.84, PI, 0.26, 0xfde047, 'l');
    SPOTS.smashGate = [-76, 23.0];
    return;
  }

  // ---------------- Complex Master Plaza Slab (x: -102..-56, z: 26..78) ----------------
  w.slab('m', 0x1e293b, -79, 0, 52, 46, 0.05, 52, 0.04, { floor: true });
  // Glowing walkway trim connecting the 3 Smash Courts and the Smash Pavilion
  w.slab('g', 0x334155, -81, 0.052, 50.5, 28, 0.015, 4.2, 0.01, { floor: true });
  w.slab('l', 0xf97316, -81, 0.062, 48.5, 26, 0.008, 0.14, 0.004);
  w.slab('l', 0x38bdf8, -81, 0.062, 52.5, 26, 0.008, 0.14, 0.004);

  // Perimeter low safety fencing around the Smash Complex (with open entrances North at x=-76 and East at z=56)
  fence(w, 'x', 26, -101.5, -80.8, 2.4, { col: 0x7f1d1d, words: 'SUPER SMASH' });
  fence(w, 'x', 26, -71.2, -56.5, 2.4, { col: 0x7f1d1d, words: 'SUPER SMASH' });
  fence(w, 'x', 77.5, -101.5, -56.5, 2.6, { col: 0x831843, words: 'SMASH CUP' });
  fence(w, 'z', -101.5, 26, 77.5, 2.6, { col: 0x0c4a6e, words: 'MOON BASE' });
  fence(w, 'z', -56.5, 26, 52.2, 2.4, { col: 0x1e293b });
  fence(w, 'z', -56.5, 59.8, 77.5, 2.4, { col: 0x1e293b });

  // ================================================================================================
  // 1. 🌋 LAVA ISLAND SMASH COURT (smash_lava at x = -72, z = 38)
  // ================================================================================================
  // Glowing lava moat surround beneath the basalt island deck
  w.slab('l', 0xff4500, -72, 0.03, 38, 13.8, 0.03, 21.4, 0.02);
  w.slab('l', 0xfacc15, -72, 0.045, 38, 13.2, 0.015, 20.8, 0.01);
  // Lava rock bridge on the south side so players walk onto the court cleanly
  w.slab('m', 0x44403c, -72, 0.055, 48.2, 4.2, 0.04, 2.2, 0.02, { floor: true });
  court(w, -72, 38, PAL.smashLava, { runX: 2.8, runZ: 3.1, y: 0.04, bench: 0xdc2626, netCol: 0x7f1d1d });

  // 6 Flaming Tiki Torches around Lava Island Court
  [[-78.2, 29.2], [-65.8, 29.2], [-78.2, 38.0], [-65.8, 38.0], [-78.2, 46.8], [-65.8, 46.8]].forEach(([tx, tz]) => {
    w.add('w', cyl(10), 0x78350f, tx, 0.05, tz, 0, 0, 0, 0.07, 2.3, 0.07);
    w.add('g', cyl(12), 0x451a03, tx, 2.2, tz, 0, 0, 0, 0.16, 0.35, 0.16);
    w.add('l', cone(10), 0xff5500, tx, 2.55, tz, 0, 0, 0, 0.22, 0.55, 0.22, 1.3);
    w.add('l', cone(8), 0xfde047, tx, 2.65, tz, 0, 0, 0, 0.13, 0.38, 0.13, 1.5);
  });
  w.lights.push({ x: -72, y: 4.2, z: 38, c: 0xff6b2b, i: 19, d: 18 });

  // Smoking Volcano & Giant Tiki Statues behind the north baseline of Lava Court
  w.add('m', cone(16), 0x292524, -72, 0.05, 27.3, 0, 0, 0, 2.6, 3.8, 2.2);
  w.add('l', cyl(14), 0xff3b00, -72, 3.55, 27.3, 0, 0, 0, 0.75, 0.22, 0.75, 1.4);
  w.add('e', sph(10), 0x57534e, -72, 4.35, 27.3, 0, 0, 0, 0.65, 0.42, 0.65);
  [-76.4, -67.6].forEach((tx) => {
    // Carved Tiki Statue with glowing eyes
    w.add('w', rcyl(0.48, 2.3, 0.06, 12), 0x5c3419, tx, 0.05, 27.5);
    w.add('l', sph(8), 0xfef08a, tx - 0.16, 1.65, 27.92, 0, 0, 0, 0.09, 0.07, 0.05, 1.4);
    w.add('l', sph(8), 0xfef08a, tx + 0.16, 1.65, 27.92, 0, 0, 0, 0.09, 0.07, 0.05, 1.4);
    w.add('l', rbox(0.42, 0.14, 0.06, 0.02, 1), 0xff4500, tx, 1.15, 27.94, 0, 0, 0, 1, 1, 1, 1.2);
    w.solid(tx - 0.5, 0, 27.0, tx + 0.5, 2.4, 28.0);
  });
  txt(w, '🌋 LAVA ISLAND SMASH COURT', -72, 1.9, 48.0, 0, 0.23, 0xfbbf24, 'l');

  // ================================================================================================
  // 2. 🚀 MOON BASE SMASH COURT (smash_moon at x = -90, z = 38)
  // ================================================================================================
  // Lunar regolith crater pad & glowing cyan energy barrier rails
  w.slab('m', 0x475569, -90, 0.03, 38, 13.6, 0.03, 21.2, 0.02, { floor: true });
  [-1, 1].forEach((s) => {
    w.slab('l', 0x38bdf8, -90 + s * 6.5, 0.45, 38, 0.08, 0.08, 19.6, 0.02);
  });
  court(w, -90, 38, PAL.smashMoon, { runX: 2.8, runZ: 3.1, y: 0.04, bench: 0x0284c7, netCol: 0x0ea5e9 });
  w.lights.push({ x: -90, y: 4.5, z: 38, c: 0x38bdf8, i: 19, d: 18 });

  // Tall Red-and-White Moon Rocket on Launchpad at (-98.5, 30.5)
  {
    const rx = -98.4, rz = 30.5;
    w.slab('x', 0x334155, rx, 0.05, rz, 3.2, 0.25, 3.2, 0.04);
    w.add('g', cyl(16), 0xf8fafc, rx, 0.3, rz, 0, 0, 0, 0.78, 4.2, 0.78);
    w.add('g', cone(16), 0xef4444, rx, 4.5, rz, 0, 0, 0, 0.78, 1.65, 0.78);
    w.add('g', cyl(16), 0xef4444, rx, 1.8, rz, 0, 0, 0, 0.80, 0.65, 0.80);
    w.add('l', sph(12), 0x38bdf8, rx + 0.68, 3.1, rz + 0.35, 0, 0, 0, 0.24, 0.24, 0.12, 1.2);
    // 4 Rocket fins + thruster glow
    for (let i = 0; i < 4; i++) {
      const a = i * PI / 2;
      w.add('g', rbox(0.14, 1.2, 0.65, 0.03, 1), 0xef4444, rx + Math.sin(a) * 0.85, 0.85, rz + Math.cos(a) * 0.85, 0, a, 0);
    }
    w.add('l', cone(12), 0xfacc15, rx, 0.22, rz, PI, 0, 0, 0.55, 0.45, 0.55, 1.4);
    w.solid(rx - 1.4, 0, rz - 1.4, rx + 1.4, 5.8, rz + 1.4);
  }
  // Lunar Habitat Geodesic Dome at (-90, 27.4) & Lunar Rover at (-98.2, 43.5)
  w.add('g', sph(16), 0xe2e8f0, -90, 0.05, 27.4, 0, 0, 0, 2.2, 1.65, 1.8);
  w.add('l', torus(0.08, 16), 0x38bdf8, -90, 0.55, 27.4, PI / 2, 0, 0, 2.15, 1.75, 1.0, 1.1);
  w.solid(-92.0, 0, 25.8, -88.0, 1.8, 29.0);
  // Lunar Rover with gold foil dish
  {
    const vx = -98.2, vz = 43.5;
    w.slab('x', 0xcbd5e1, vx, 0.38, vz, 1.4, 0.28, 2.0, 0.04);
    [-0.7, 0.7].forEach((sx) => [-0.7, 0.7].forEach((sz) => {
      w.add('f', cyl(12), 0x1e293b, vx + sx, 0.24, vz + sz, 0, 0, PI / 2, 0.26, 0.18, 0.26);
    }));
    w.add('g', cone(12), 0xfacc15, vx, 0.95, vz - 0.3, -0.5, 0, 0, 0.45, 0.25, 0.45);
    w.solid(vx - 0.9, 0, vz - 1.1, vx + 0.9, 1.2, vz + 1.1);
  }
  txt(w, '🚀 MOON BASE SMASH COURT', -90, 1.9, 48.0, 0, 0.23, 0x38bdf8, 'l');

  // ================================================================================================
  // 3. 🍭 CANDY STADIUM SMASH COURT (smash_candy at x = -81, z = 64)
  // ================================================================================================
  // Chocolate river moat border + golden wafer surround
  w.slab('g', 0x451a03, -81, 0.03, 64, 15.2, 0.03, 21.6, 0.02);
  w.slab('m', 0xfef08a, -81, 0.055, 53.5, 4.6, 0.04, 2.2, 0.02, { floor: true });
  court(w, -81, 64, PAL.smashCandy, { runX: 3.1, runZ: 3.3, y: 0.04, bench: 0xec4899, netCol: 0xdb2777 });
  w.lights.push({ x: -81, y: 4.8, z: 64, c: 0xf472b6, i: 20, d: 20 });

  // Candy Stadium Bleachers on West side + Umpire Pi-rat Throne on East side!
  SEATS.push(...bleachers(w, 'z', 56.5, 71.5, -88.5, -1, 3, { cols: [0xec4899, 0x38bdf8] }));
  umpireChair(w, -77.1, 64.0, -PI / 2);

  // Giant Swirl Lollipop Trees & Candy Cane Towers around Candy Stadium
  const lollyCols = [0xff4fd8, 0x38bdf8, 0xfacc15, 0x4ade80];
  [[-88.2, 54.5], [-73.8, 54.5], [-88.2, 73.5], [-73.8, 73.5]].forEach(([lx, lz], i) => {
    w.add('g', cyl(10), 0xffffff, lx, 0.05, lz, 0, 0, 0, 0.09, 2.6, 0.09);
    w.add('g', cyl(20), lollyCols[i % 4], lx, 3.1, lz, PI / 2, 0, 0, 0.72, 0.18, 0.72);
    w.add('l', torus(0.08, 18), 0xffffff, lx, 3.1, lz + 0.1, 0, 0, 0, 0.45, 0.45, 0.45, 0.9);
    w.solid(lx - 0.35, 0, lz - 0.35, lx + 0.35, 3.6, lz + 0.35);
  });
  // Frosted Giant Cupcakes flanking the south baseline
  [[-86.2, 74.6], [-75.8, 74.6]].forEach(([cx, cz], i) => {
    w.add('m', cyl(14, 0.8), 0xfbbf24, cx, 0.05, cz, 0, 0, 0, 0.62, 0.68, 0.62);
    w.add('g', sph(14), i === 0 ? 0xf472b6 : 0x38bdf8, cx, 0.82, cz, 0, 0, 0, 0.68, 0.48, 0.68);
    w.add('l', sph(10), 0xef4444, cx, 1.32, cz, 0, 0, 0, 0.14, 0.14, 0.14, 1.1);
    w.solid(cx - 0.65, 0, cz - 0.65, cx + 0.65, 1.4, cz + 0.65);
  });
  // Candy Stadium Jumbotron Scoreboard on South end (-81, 75.6)
  scoreFrame(w, -81, 2.3, 75.6, PI, 5.8, 2.4);
  w.slab('g', 0x500724, -81, 2.5, 75.42, 5.4, 2.1, 0.08, 0.02);
  txt(w, '🍭 CANDY STADIUM • SUPER SMASH CUP 🏆', -81, 3.95, 75.34, PI, 0.23, 0xfde047, 'l');
  txt(w, 'NORMAL = 1 PT  •  SMASH = 2 PTS  •  SUPER SMASH = 3 PTS!', -81, 3.25, 75.34, PI, 0.17, 0x38bdf8, 'l');

  // ================================================================================================
  // 4. 💥 SUPER SMASH PAVILION & TORTUGA/RATITA MAXGRIT REPAIR FORGE (x = -63.5, z = 59.5)
  // ================================================================================================
  // Open-air covered Smash Pavilion with glowing neon roof canopy
  w.slab('g', 0x0f172a, -63.5, 0.05, 59.5, 12.2, 0.08, 16.5, 0.03, { floor: true });
  [[-69.0, 52.0], [-58.0, 52.0], [-69.0, 67.0], [-58.0, 67.0]].forEach(([px, pz]) => {
    w.add('x', rcyl(0.22, 4.2, 0.03, 14), 0x334155, px, 0.05, pz);
    w.solid(px - 0.25, 0, pz - 0.25, px + 0.25, 4.2, pz + 0.25);
  });
  w.slab('g', 0x1e293b, -63.5, 4.2, 59.5, 13.0, 0.32, 17.2, 0.06);
  w.slab('l', 0xf97316, -63.5, 4.54, 59.5, 13.3, 0.12, 17.5, 0.04);
  txt(w, '💥 SUPER SMASH PAVILION & MAXGRIT FORGE 🛠️', -63.5, 4.78, 51.0, PI, 0.25, 0xfde047, 'l');
  w.lights.push({ x: -63.5, y: 3.9, z: 59.5, c: 0xfef08a, i: 20, d: 16 });

  // A. Smash Cup Check-In Desk & Bracket Board at (-63.5, 54.2) (Snowie & Luna's Command Desk)
  w.slab('g', 0x1e3a8a, -63.5, 0.08, 54.2, 4.2, 1.02, 1.1, 0.05, { solid: true });
  w.slab('g', 0xfacc15, -63.5, 1.10, 54.2, 4.35, 0.08, 1.22, 0.03);
  txt(w, '🏆 SUPER SMASH CUP CHECK-IN', -63.5, 0.65, 53.6, PI, 0.20, 0xfef08a, 'l');

  // Standing Smash Cup Bracket Board at (-67.4, 56.5)
  w.slab('x', 0x0f172a, -67.4, 0.08, 56.5, 0.25, 2.5, 3.2, 0.04, { solid: true });
  txt(w, '🏆 SMASH CUP BRACKET', -67.22, 2.15, 56.5, PI / 2, 0.19, 0xfacc15, 'l');
  txt(w, 'R1 LAVA • R2 MOON • FINAL CANDY', -67.22, 1.65, 56.5, PI / 2, 0.15, 0x38bdf8, 'l');

  // B. Torty & Luna's MaxGrit Re-Grit & Edge-Guard Repair Forge at (-63.5, 64.8)
  w.slab('w', 0x78350f, -63.5, 0.08, 64.8, 4.6, 1.0, 1.2, 0.05, { solid: true });
  w.slab('x', 0x475569, -63.5, 1.08, 64.8, 4.75, 0.08, 1.3, 0.03);
  // Mini anvil / grit buffer wheel / replacement MaxGrit paddles on the workbench
  w.add('x', cyl(14), 0x94a3b8, -64.8, 1.25, 64.8, 0, 0, PI / 2, 0.22, 0.18, 0.22);
  w.add('l', torus(0.04, 14), 0xf97316, -64.8, 1.25, 64.8, 0, PI / 2, 0, 0.24, 0.24, 0.24, 1.1);
  paddleProp(w, -63.5, 1.18, 64.75, 0.3, 0, 0x111827, 1.15, 0xf97316, true);
  paddleProp(w, -62.5, 1.18, 64.75, -0.3, 0, 0xef4444, 1.15, 0xffffff, false);
  paddleProp(w, -61.7, 1.18, 64.75, 0.1, 0, 0x38bdf8, 1.15, 0x0c4a6e, true);
  ballBucket(w, -66.4, 0.08, 64.8, 0xfbbf24, 12);
  txt(w, '🛠️ MAXGRIT FORGE & FREE EMERGENCY REPAIR', -63.5, 0.62, 64.15, PI, 0.17, 0x4ade80, 'l');

  // C. Specialty Power Paddle Rack at (-59.4, 59.5)
  w.slab('g', 0x1e293b, -59.4, 0.08, 59.5, 0.55, 2.2, 3.6, 0.04, { solid: true });
  [0xef4444, 0xfacc15, 0x38bdf8, 0x111827].forEach((c, i) => {
    paddleProp(w, -59.75, 1.35, 58.2 + i * 0.85, -PI / 2, 0.2, c, 1.2, 0xfde047, true);
  });
  txt(w, '⚡ POWER PADDLES', -59.72, 1.95, 59.5, -PI / 2, 0.18, 0xfacc15, 'l');

  // ---------------- Interaction & NPC Spots ----------------
  SPOTS.court_smash_lava = [-72, 48.2];
  SPOTS.court_smash_moon = [-90, 48.2];
  SPOTS.court_smash_candy = [-81, 53.2];

  SPOTS.smashDesk = [-63.5, 52.3];
  SPOTS.smashBracket = [-66.2, 56.5];
  SPOTS.smashForge = [-63.5, 63.0];
  SPOTS.smashPaddles = [-60.8, 59.5];

  // All 5 Family Pets inside the Super Smash Expansion!
  SPOTS.lunaSmash = [-64.6, 54.2];    // 🐭 Luna on the Smash Desk (Chief Smash Lab Engineer)
  SPOTS.snowieSmash = [-62.4, 54.2];  // 🐁 Snowie on the Smash Desk (Smash Cup Announcer)
  SPOTS.tortySmash = [-63.5, 64.8];   // 🐢 Torty at the MaxGrit Repair Forge (Master Paddle Smith)
  SPOTS.candySmash = [-65.5, 59.5];   // 🐶 Candy in the Smash Pavilion (Pop-Up & Lucky Ball Fetcher)
  SPOTS.piratSmash = [-77.1, 64.0];   // 🏴‍☠️ Pi-rat on the Candy Stadium Umpire Chair!

  // Spectators watching the Smash Courts
  STANDS.push(
    { x: -67.2, z: 48.5, ry: PI, name: 'Rocket Fan' },
    { x: -94.8, z: 48.5, ry: PI, name: 'Moon Fan' },
    { x: -75.0, z: 53.5, ry: 0, name: 'Candy Fan' }
  );
}
