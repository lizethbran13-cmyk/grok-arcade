// Grok Great Rodentia (Year 000 1 — 301 Post-Departure USM)
// Builds the 4 Districts of Great Rodentia, reddish-dusk skyline, avenues, checkpoints, and 8 walk-in interiors.
import * as K from './kit.js?v=gr2';
import { shell, part, onSide, BUILDINGS } from './bld.js?v=gr2';
import { rbox } from './world.js?v=gr2';
import { txt, poster, wallWord, clockW, pendant, rack, pallet, planter, awning, trash, produceCrate } from './art.js?v=gr2';

const PI = Math.PI;

export const ENV = {
  skyTop: 0x160612,
  skyMid: 0x6b1829,
  skyBot: 0xd9483b,
  sunDir: [0.42, 0.32, -0.85],
  sunColor: 0xff8552,
  sunI: 2.35,
  sunDisc: 1.35,
  hemiSky: 0xff9e7a,
  hemiGround: 0x2a121c,
  hemiI: 0.58,
  envLight: 0xff7b54,
  envLightI: 2.2,
  envI: 0.88,
  exposure: 1.04,
  bloomT: 1.05,
  bloomS: 0.48,
  stars: 0.55,
  nebula: 0x3d0c20,
  fog: 0x260c17,
  fogD: 0.0038,
};

// Helper: build the iconic Rat Conspiracy Board with red yarn strings & pinned photos
function buildConspiracyBoard(w, x, y, z) {
  // Corkboard backing
  w.add('m', rbox(5.6, 2.5, 0.14, 0.04), 0x7c4a1e, x, y, z);
  w.add('m', rbox(5.3, 2.24, 0.08, 0.02), 0xc8965a, x, y, z + 0.05);
  wallWord(w, 'x', z + 0.06, x, y + 0.88, 'USM YEAR 000 1 CONSPIRACY MAP', 0.19, 0xfef08a, 1, 0.4);

  const pins = [
    [-2.0, 0.35, 0xfef3c7, '000 1'],
    [-0.9, 0.45, 0xfee2e2, 'CLONES'],
    [0.2, 0.40, 0xdbeafe, 'TORTY'],
    [1.3, 0.42, 0xfce7f3, 'CLAUDIA'],
    [2.1, 0.32, 0xfef08a, 'GOUDA'],
    [-1.5, -0.45, 0xd1fae5, 'PARENTS'],
    [-0.2, -0.42, 0xfde68a, 'VAULTS'],
    [1.2, -0.45, 0xe0e7ff, 'PRISON'],
  ];
  for (const [px, py, col, lbl] of pins) {
    w.add('m', rbox(0.86, 0.62, 0.04, 0.01), col, x + px, y + py, z + 0.1);
    w.add('l', K.sph(10), 0xef4444, x + px, y + py + 0.24, z + 0.14, 0, 0, 0, 0.06, 0.06, 0.06, 0.8);
    txt(w, lbl, x + px, y + py - 0.08, z + 0.13, 0, 0.12, 0x1e293b);
  }
  // Red yarn lines connecting pins
  const links = [
    [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 4], [1, 6], [2, 7]
  ];
  for (const [a, b] of links) {
    const p0 = [x + pins[a][0], y + pins[a][1] + 0.22, z + 0.13];
    const p1 = [x + pins[b][0], y + pins[b][1] + 0.22, z + 0.13];
    const mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 - 0.06, z + 0.14];
    w.add('l', K.tube([p0, mid, p1], 0.018, 8, 6), 0xff1e42, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0.5);
  }
}

// Helper: Laser security prison / holding cage
function buildLaserCage(w, x, z, W, D, H = 3.1, barCol = 0xff1e42) {
  // Corner posts
  [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]].forEach(([dx, dz]) => {
    w.slab('x', 0x334155, x + dx, 0, z + dz, 0.26, H, 0.26, 0.04);
  });
  // Top frame
  w.add('x', rbox(W + 0.3, 0.22, D + 0.3, 0.05), 0x1e293b, x, H + 0.1, z);
  // Front laser bars
  for (let bx = -W / 2 + 0.45; bx <= W / 2 - 0.45; bx += 0.55) {
    w.add('l', K.cyl(10), barCol, x + bx, 0.1, z + D / 2, 0, 0, 0, 0.035, H - 0.15, 0.035, 0.9);
    w.add('l', K.cyl(10), barCol, x + bx, 0.1, z - D / 2, 0, 0, 0, 0.035, H - 0.15, 0.035, 0.9);
  }
  for (let bz = -D / 2 + 0.5; bz <= D / 2 - 0.5; bz += 0.6) {
    w.add('l', K.cyl(10), barCol, x - W / 2, 0.1, z + bz, 0, 0, 0, 0.035, H - 0.15, 0.035, 0.9);
    w.add('l', K.cyl(10), barCol, x + W / 2, 0.1, z + bz, 0, 0, 0, 0.035, H - 0.15, 0.035, 0.9);
  }
}

// Helper: Giant Golden Gouda Wheel on Capitol Pedestal
function buildGoldenGoudaRelic(w, x, z) {
  // Stepped marble + gold pedestal
  w.slab('g', 0xf8fafc, x, 0, z, 3.6, 0.35, 3.6, 0.08);
  w.slab('x', 0xd97706, x, 0.35, z, 2.8, 0.35, 2.8, 0.08);
  w.slab('g', 0x1e293b, x, 0.7, z, 2.1, 0.65, 2.1, 0.08);
  // Glowing laser containment rings
  w.add('l', K.torus(0.06, 28), 0xfacc15, x, 1.45, z, PI / 2, 0, 0, 1.35, 1.35, 1.35, 0.85);
  w.add('l', K.torus(0.05, 28), 0xff1e42, x, 2.35, z, PI / 2, 0, 0, 1.45, 1.45, 1.45, 0.75);
  // Giant Golden Gouda Wheel + Wedge Crest
  w.add('x', K.rcyl(0.95, 0.65, 0.14, 32), 0xffc400, x, 1.45, z);
  w.add('l', K.wedge(), 0xffe14d, x, 2.28, z, 0, 0.5, 0, 0.85, 0.85, 0.85, 0.75);
  w.add('l', K.star(), 0xffffff, x, 2.95, z, 0, 0, 0, 0.38, 0.38, 0.18, 0.95);
}

export function buildRodentiaWorld(w) {
  BUILDINGS.length = 0;
  K.propSeed(301); // Year 000 1 = 301 Post-Departure

  const spots = [];
  const addLight = (x, y, z, c = 0xffb36b, i = 22, d = 18, flick = false, shaft = false) => {
    spots.push({ x, y, z, c, i, d, flick, shaft });
    w.lights.push({ x, y, z, c, i, d });
  };

  // =========================================================================
  // 1. STREETS, AVENUES & PLAZAS OF GREAT RODENTIA (z = -46 .. +74)
  // =========================================================================
  w.region = 'out';
  // Main ground slab (dark cobblestone & asphalt under crimson dusk)
  w.slab('m', 0x241a24, 0, -0.4, 14, 82, 0.4, 126, 0.05, { floor: true });
  // Central Grand Mammalia Avenue (north-south z = -44 .. +70)
  w.slab('g', 0x33293a, 0, -0.02, 14, 13.5, 0.06, 118, 0.02, { floor: true });
  // Golden lane dashes down the avenue
  for (let z = -42; z <= 68; z += 4.5) {
    w.add('l', rbox(0.28, 0.03, 1.8, 0.01), 0xf59e0b, 0, 0.04, z, 0, 0, 0, 1, 1, 1, 0.25);
  }
  // Sidewalks flanking the avenue
  [-7.6, 7.6].forEach((sx) => {
    w.slab('g', 0x4b3f52, sx, 0, 14, 2.2, 0.1, 118, 0.04, { floor: true });
  });

  // Perimeter city walls & distant reddish-dusk skyscrapers of Great Rodentia
  // South Harbor Dockhouse & North Supreme Capitol Rotunda (brightly lit, never a flat black wall!)
  w.slab('m', 0x7c2d12, 0, 0, -46.8, 22, 9.5, 4.5, 0.2);
  w.add('m', rbox(22.6, 0.8, 5.0, 0.1), 0xfde047, 0, 9.6, -46.8);
  for (let wx = -8; wx <= 8; wx += 2.6) { w.add('l', rbox(1.5, 2.2, 0.12, 0.04), 0xffd27a, wx, 2.5, -44.5); w.add('l', rbox(1.5, 2.0, 0.12, 0.04), 0xffe49e, wx, 6.2, -44.5); }
  K.sign3d(w, 'RATS ISLE HARBOR FERRY', 0, 8.2, -44.4, 0, 0.42, 0xfde047, 0x7c2d12);
  awning(w, -9.5, 9.5, -44.1, 4.0, [0xdc2626, 0xfef3c7], 1);
  addLight(0, 5.0, -43.0, 0xffc87a, 28, 18, false, false);
  // North end: Grand Golden Capitol Façade closing the avenue
  w.slab('m', 0x991b1b, 0, 0, 74.5, 24, 12.0, 5.0, 0.2);
  w.add('m', rbox(24.8, 0.9, 5.4, 0.1), 0xfacc15, 0, 12.1, 74.5);
  w.add('l', K.sph(20), 0xfacc15, 0, 14.5, 74.5, 0, 0, 0, 4.5, 3.2, 4.5, 0.6);
  for (const cx of [-8, -4.8, -1.6, 1.6, 4.8, 8]) w.add('m', K.cyl(16), 0xfef3c7, cx, 0, 71.8, 0, 0, 0, 0.45, 9.5, 0.45);
  for (let wx = -9; wx <= 9; wx += 3) { w.add('l', rbox(1.6, 2.6, 0.12, 0.04), 0xffe49e, wx, 3.2, 71.9); w.add('l', rbox(1.6, 2.4, 0.12, 0.04), 0xfde047, wx, 7.4, 71.9); }
  K.sign3d(w, 'SUPREME CAPITOL OF RODENTIA', 0, 10.6, 71.8, PI, 0.42, 0xfde047, 0x7f1d1d);
  addLight(0, 6.0, 69.5, 0xffe14d, 32, 22, false, false);
  w.slab('m', 0x1e1320, -38.5, 0, 14, 1.2, 4.5, 120, 0.1);
  w.slab('m', 0x1e1320, 38.5, 0, 14, 1.2, 4.5, 120, 0.1);

  // Skyline backdrop towers around the perimeter (no-cam decorative silhouettes with glowing windows)
  const towers = [
    [-34, -40, 8, 18, 8, 0x2b1728], [34, -40, 8, 20, 8, 0x26152b],
    [-35, -18, 7, 22, 9, 0x2d192b], [35, -18, 7, 24, 9, 0x231429],
    [-35, 10, 7, 25, 9, 0x291628],  [35, 10, 7, 21, 9, 0x2e1726],
    [-35, 38, 7, 26, 9, 0x241326],  [35, 38, 7, 28, 9, 0x2b1524],
    [-22, 71, 12, 24, 6, 0x261224], [0, 72, 16, 32, 6, 0x311428], [22, 71, 12, 24, 6, 0x261224],
  ];
  for (const [tx, tz, tw, th, td, tcol] of towers) {
    w.add('m', rbox(tw, th, td, 0.2), tcol, tx, th / 2, tz);
    for (let wy = 3; wy < th - 2; wy += 3.2) {
      for (let wx = -tw / 2 + 1.5; wx <= tw / 2 - 1.5; wx += 2.2) {
        const lit = ((wx * 7 + wy * 13 + tz) & 3) !== 0;
        if (lit) {
          w.add('l', rbox(0.8, 1.2, 0.1, 0.02), (wy + tz) % 2 ? 0xffb36b : 0xff4d6d, tx + wx, wy, tz + (tz > 60 ? -td / 2 - 0.05 : (tx < 0 ? tw / 2 + 0.05 : -tw / 2 - 0.05)), 0, tx < 0 && tz <= 60 ? PI / 2 : (tz > 60 ? 0 : -PI / 2), 0, 1, 1, 1, 0.55);
        }
      }
    }
  }

  // Streetlamps & trees along the Grand Mammalia Avenue
  for (let z = -38; z <= 64; z += 12) {
    K.lampPost(w, -6.8, z);
    K.lampPost(w, 6.8, z);
    addLight(-6.2, 3.8, z, 0xffa96b, 20, 15, false, z % 24 === 0);
    addLight(6.2, 3.8, z, 0xffa96b, 20, 15, false, false);
  }

  // USM Year 000 1 Welcome Arch in District 1 Plaza (z = -38)
  w.slab('x', 0x475569, -5.8, 0, -39, 0.7, 5.2, 0.7, 0.08);
  w.slab('x', 0x475569, 5.8, 0, -39, 0.7, 5.2, 0.7, 0.08);
  w.add('m', rbox(12.8, 1.1, 0.8, 0.12), 0x7f1d1d, 0, 5.4, -39);
  K.sign3d(w, 'GREAT RODENTIA - YEAR 000 1', 0, 5.45, -38.5, 0, 0.42, 0xfef08a, 0x450a0a);

  // District Checkpoint Gates at z = -15 (D2), z = 13 (D3), z = 41 (D4)
  const gateDefs = [
    { d: 2, z: -15, title: 'DISTRICT 2: DOG SUB-CITY & RUFFSOURCES', col: 0xf59e0b },
    { d: 3, z: 13,  title: 'DISTRICT 3: GOV VAULTS & RATITA NOW HQ', col: 0x10b981 },
    { d: 4, z: 41,  title: 'DISTRICT 4: RATITA PRISON & CAPITOL',    col: 0xef4444 },
  ];
  for (const gd of gateDefs) {
    w.slab('x', 0x334155, -6.2, 0, gd.z, 0.9, 4.8, 0.9, 0.08);
    w.slab('x', 0x334155, 6.2, 0, gd.z, 0.9, 4.8, 0.9, 0.08);
    w.add('m', rbox(13.6, 0.95, 0.9, 0.1), 0x1e293b, 0, 4.9, gd.z);
    txt(w, gd.title, 0, 4.75, gd.z - 0.48, PI, 0.28, gd.col, 'l', 0.6);
    txt(w, gd.title, 0, 4.75, gd.z + 0.48, 0, 0.28, gd.col, 'l', 0.6);
  }

  // =========================================================================
  // 2. DISTRICT 1 (z = -46 .. -15): RATS ISLE & TORTY'S SEIZED CHEESE BANK
  // =========================================================================
  // --- Building 1: Grandma Nana Gouda's Conspiracy House (West: x -28..-8, z -42..-26) ---
  const bGrandma = shell(w, {
    id: 'grandma',
    name: "🧶 Grandma Nana Gouda's House (Rats Isle)",
    x0: -28, z0: -42, x1: -8, z1: -26, h: 4.8,
    wall: 0xb45309, trim: 0xfef3c7, roof: 0x7c2d12,
    floor: 'wood', fc1: 0xc98d55, fc2: 0xb7773f,
    doors: [{ side: 'e', at: -34, w: 3.0 }],
    win: { n: 2, s: 2, e: 1, w: 2 },
  });
  onSide(w, bGrandma, 'e', () => {
    K.sign3d(w, "GRANDMA'S HOUSE - RATS ISLE", -7.7, 3.9, -34, PI / 2, 0.36, 0xfef3c7, 0x7c2d12);
    awning(w, -36.5, -31.5, -8, 3.3, [0xd97706, 0xfef3c7], 1);
  });

  w.region = 'in_grandma';
  // Cozy rug in center
  K.rug(w, -18, -34, 0, 10, 7, 0x991b1b, 0xfde68a);
  // Giant Conspiracy Board on north wall (x = -18, z = -41.3)
  buildConspiracyBoard(w, -18, 2.3, -41.35);
  // Grandma's Conspiracy Desk right below the board (Clue c01_calendar)
  K.desk(w, -18, -39.2, 0, { L: 3.4, D: 1.3, top: 0x92400e });
  K.chair(w, -18, 0, -37.8, PI, 0xd97706);
  // Family dining table with 4 chairs (Mom, Dad, Brother Bram, Brie) — Clue c02_parents_badge
  K.tableR(w, -13.5, -31.0, 1.45, 0.85, 0xd97706, 0x78350f);
  K.chair(w, -13.5, 0, -29.1, PI, 0xef4444);
  K.chair(w, -13.5, 0, -32.9, 0, 0x3b82f6);
  K.chair(w, -11.6, 0, -31.0, -PI / 2, 0x10b981);
  K.chair(w, -15.4, 0, -31.0, PI / 2, 0xf59e0b);
  K.tray(w, -13.5, 0.86, -31.0, 0.3);
  // Living room couch, bookshelves, beds & lamps
  K.sofa(w, -23.5, -34.0, PI / 2, 0x7c2d12, 0xfde68a, 20);
  K.shelf(w, -26.8, -39.5, PI / 2, 3.2, 2.8, 0.7, 0x78350f);
  K.shelf(w, -11.5, -40.8, 0, 3.2, 2.8, 0.7, 0x78350f);
  K.lamp(w, -25.8, -28.0, 0xfde68a);
  K.plant(w, -9.8, -27.8, 1.0);
  clockW(w, 'z', -27.4, -34, 3.2, 1);
  poster(w, 'x', -26.6, -21, 2.4, 2.6, 1.3, 0x1e3a8a, -1, 'USM TASK FORCE', 0xfef08a);
  pendant(w, -18, -34, 0xf59e0b, 4.4);
  addLight(-18, 4.0, -34, 0xffd28a, 24, 16, false, true);

  // --- Building 2: Torty's Seized Cheese Bank & Gov Task Force Outpost (East: x 8..28, z -42..-26) ---
  const bBank = shell(w, {
    id: 'bank',
    name: "🧀 Torty's Seized Cheese Bank & Task Force Outpost",
    x0: 8, z0: -42, x1: 28, z1: -26, h: 5.0,
    wall: 0x0f766e, trim: 0xfacc15, roof: 0x115e59,
    floor: 'tile', fc1: 0xf1f5f9, fc2: 0xcbd5e1,
    doors: [{ side: 'w', at: -34, w: 3.2 }],
    win: { n: 2, s: 2, e: 2, w: 1 },
  });
  part(w, bBank, 'z', 18, -41.5, -26.5, [-34], 0xe2e8f0, 3.5);
  onSide(w, bBank, 'w', () => {
    K.sign3d(w, 'TORTY CHEESE BANK (SEIZED)', 7.7, 4.0, -34, -PI / 2, 0.35, 0xfef08a, 0x0f766e);
  });

  w.region = 'in_bank';
  // West room (x: 8..18): Torty's Seized Emergency Cheese Bank & Spectral Lab (Clue c03_torty_toxin)
  K.labBench(w, 13.0, -39.5, 0, 4.2, { body: 0xe2e8f0, top: 0x0f172a });
  K.beaker(w, 11.8, 0.96, -39.5, 0x4ade80, 1.1, 0);
  K.beaker(w, 12.6, 0.96, -39.4, 0xa855f7, 1.1, 1);
  K.monitor(w, null, 14.0, 0.96, -39.5, 0, 0xef4444, 1.2);
  K.cheeseRack(w, 12.5, -28.2, 0, 4);
  K.crate(w, 10.2, 0, -29.0, 0.95, 0xd97706);
  K.crate(w, 15.8, 0, -29.0, 0.95, 0xd97706);
  K.hazard(w, 13.0, -34.0, 4.5, 2.2, 0);
  poster(w, 'x', -41.4, 13.0, 2.6, 3.6, 1.2, 0x991b1b, 1, 'TORTUGA TECH PAUSED', 0xfef08a);
  poster(w, 'x', -26.6, 13.0, 2.6, 3.4, 1.2, 0x1e293b, -1, 'RATITA NOW SEIZED', 0xff4d6d);
  pendant(w, 13.0, -34.0, 0x14b8a6, 4.5);
  addLight(13.0, 4.1, -34.0, 0x5eead4, 22, 15, true, true);

  // East room (x: 18..28): USM Gov Task Force Outpost — Grandpa Cheddar & Brother Bram (Clue c04_house_raid)
  K.desk(w, 23.0, -38.8, 0, { L: 3.6, D: 1.4, top: 0x1e3a8a });
  K.monitor(w, null, 22.2, 0.86, -38.8, 0, 0x38bdf8, 1.15);
  K.monitor(w, null, 23.8, 0.86, -38.8, 0, 0xfacc15, 1.15);
  K.chair(w, 23.0, 0, -37.2, PI, 0x2563eb);
  K.serverRack(w, 26.2, -40.2, -PI / 2);
  K.serverRack(w, 26.2, -38.8, -PI / 2);
  K.filing(w, 26.2, -28.5, -PI / 2, 0x475569, 4);
  K.filing(w, 26.2, -30.0, -PI / 2, 0x475569, 4);
  K.whiteboard(w, 'x', -26.6, 23.0, 2.2, 3.4, -1);
  poster(w, 'z', 27.4, -34.0, 2.6, 3.2, 1.3, 0x1e3a8a, -1, 'GOV TASK FORCE', 0xffffff);
  pendant(w, 23.0, -34.0, 0x3b82f6, 4.5);
  addLight(23.0, 4.1, -34.0, 0x93c5fd, 22, 15, false, false);

  // District 1 street props
  w.region = 'out';
  K.bench(w, -4.8, -30, PI / 2, 0xb45309);
  K.bench(w, 4.8, -30, -PI / 2, 0x0f766e);
  planter(w, -4.8, -22, 3.2, PI / 2, 0xf59e0b);
  planter(w, 4.8, -22, 3.2, -PI / 2, 0xf59e0b);

  // =========================================================================
  // 3. DISTRICT 2 (z = -15 .. +13): DOG SUB-CITY & SEIZED RUFFSOURCES
  // =========================================================================
  // --- Building 3: The Golden Bone Dinner Hall (West: x -28..-8, z -12..6) ---
  const bDinner = shell(w, {
    id: 'dinner',
    name: '🍽️ Golden Bone Dinner Hall ("Claudia Marry Weather" Ambush)',
    x0: -28, z0: -12, x1: -8, z1: 6, h: 5.0,
    wall: 0x7f1d1d, trim: 0xfbbf24, roof: 0x450a0a,
    floor: 'carpet', fc1: 0x881337, fc2: 0x9f1239,
    doors: [{ side: 'e', at: -3, w: 3.2 }],
    win: { n: 2, s: 2, e: 1, w: 2 },
  });
  onSide(w, bDinner, 'e', () => {
    K.sign3d(w, 'GOLDEN BONE DINNER HALL', -7.7, 4.0, -3, PI / 2, 0.36, 0xfef08a, 0x7f1d1d);
    awning(w, -5.8, -0.2, -8, 3.3, [0x991b1b, 0xfde68a], 1);
  });

  w.region = 'in_dinner';
  // Reservation Clerk Podium & Rejected "Claudia Marry Weather" Alias Ledger (Clue c05_marryweather)
  K.desk(w, -13.0, -9.2, 0, { L: 2.8, D: 1.2, top: 0x78350f });
  K.monitor(w, null, -13.0, 0.86, -9.2, 0, 0xf43f5e, 1.1);
  poster(w, 'x', -11.4, -13.0, 2.5, 3.8, 1.2, 0x991b1b, 1, 'ALIAS: CLAUDIA MARRY WEATHER', 0xfef08a);
  // Ambush Banquet Tables where Candy was captured
  [-22.0, -16.0].forEach((tx, idx) => {
    K.tableR(w, tx, -2.5, 1.5, 0.85, 0xfef3c7, 0xb45309);
    K.chair(w, tx, 0, -0.6, PI, 0xd97706);
    K.chair(w, tx, 0, -4.4, 0, 0xd97706);
    K.tray(w, tx, 0.86, -2.5, idx * 0.8);
  });
  // Candy's Civil Task Force of Dogs Charter Table (Clue c06_civil_dogs)
  K.desk(w, -23.0, 3.2, PI, { L: 3.4, D: 1.3, top: 0x1e3a8a });
  poster(w, 'x', 5.4, -22.5, 2.5, 3.8, 1.2, 0x1d4ed8, -1, 'DOG CIVIL TASK FORCE', 0xfef08a);
  K.PR.dogBowl(w, -25.8, -9.5, 0xef4444, 0x9a5b2d);
  K.PR.dogBowl(w, -10.5, 3.8, 0x3b82f6, 0x9a5b2d);
  K.plant(w, -26.2, 4.2, 1.0);
  pendant(w, -18.0, -3.0, 0xfbbf24, 4.5);
  addLight(-18.0, 4.1, -3.0, 0xffc86b, 25, 16, false, true);

  // --- Building 4: Seized RuffSources HQ & Candy's Holding Cage (East: x 8..28, z -12..6) ---
  const bRuff = shell(w, {
    id: 'ruff',
    name: '🐾 Seized RuffSources HQ (Candy Held Captive)',
    x0: 8, z0: -12, x1: 28, z1: 6, h: 5.0,
    wall: 0x1e3a8a, trim: 0xf472b6, roof: 0x172554,
    floor: 'wood', fc1: 0xd39a62, fc2: 0xc98d55,
    doors: [{ side: 'w', at: -3, w: 3.2 }],
    win: { n: 2, s: 2, e: 2, w: 1 },
  });
  onSide(w, bRuff, 'w', () => {
    K.sign3d(w, 'RUFFSOURCES HQ - SEIZED', 7.7, 4.0, -3, -PI / 2, 0.36, 0xf472b6, 0x1e293b);
  });

  w.region = 'in_ruff';
  // HR Cubicles & Reception
  K.cubicle(w, 13.0, -8.5, 0, 0x93c5fd);
  K.cubicle(w, 13.0, 2.5, PI, 0xf9a8d4);
  K.filing(w, 10.0, 4.2, 0, 0x64748b, 4);
  K.cooler(w, 10.2, -10.2);
  // Ratita Now➡️ Underground Conduit Blueprint Desk (Clue c07_ruffsources_tunnel)
  K.desk(w, 18.0, -8.8, 0, { L: 3.0, D: 1.2, top: 0x334155 });
  K.monitor(w, null, 18.0, 0.86, -8.8, 0, 0x22d3ee, 1.2);
  poster(w, 'x', -11.4, 18.0, 2.5, 3.6, 1.2, 0x991b1b, 1, 'RATITA NOW TAKEOVER', 0xfef08a);
  // Candy's Laser Holding Cell in East Wing (x = 23.5, z = -2.5)
  buildLaserCage(w, 23.5, -2.5, 4.6, 4.6, 3.2, 0xff1e42);
  K.PR.dogBowl(w, 24.6, -3.5, 0xff6fb5, 0x9a5b2d);
  poster(w, 'z', 27.4, -2.5, 2.6, 3.4, 1.2, 0xbe185d, -1, 'PRISONER: CANDY (CEO)', 0xffffff);
  pendant(w, 18.0, -3.0, 0xf472b6, 4.5);
  addLight(18.0, 4.1, -3.0, 0xf9a8d4, 24, 16, true, true);

  // District 2 Dog Sub-City street props
  w.region = 'out';
  K.PR.dogBowl(w, -5.2, -7.0, 0xef4444, 0x9a5b2d);
  K.PR.dogBowl(w, 5.2, 1.0, 0x3b82f6, 0x9a5b2d);
  K.bench(w, -4.8, 3.0, PI / 2, 0x7f1d1d);
  K.bench(w, 4.8, -8.0, -PI / 2, 0x1e3a8a);

  // =========================================================================
  // 4. DISTRICT 3 (z = +13 .. +41): UNSECURE GOV VAULTS & RATITA NOW➡️ LAB
  // =========================================================================
  // --- Building 5: Unsecure Government Cheese Vaults (West: x -28..-8, z 16..36) ---
  const bVault = shell(w, {
    id: 'vault',
    name: "🔒 Unsecure Gov Cheese Vaults (Brie's Parents Held)",
    x0: -28, z0: 16, x1: -8, z1: 36, h: 5.2,
    wall: 0x475569, trim: 0xfacc15, roof: 0x1e293b,
    floor: 'tile', fc1: 0xcbd5e1, fc2: 0x94a3b8,
    doors: [{ side: 'e', at: 26, w: 3.2 }],
    win: { n: 1, s: 1, e: 1, w: 1 },
  });
  onSide(w, bVault, 'e', () => {
    K.sign3d(w, 'USM GOV CHEESE VAULTS', -7.7, 4.1, 26, PI / 2, 0.36, 0xfacc15, 0x1e293b);
  });

  w.region = 'in_vault';
  // Rows of Tortuga Tech / USM emergency cheese racks & drained siphon pipes
  K.cheeseRack(w, -13.5, 19.5, 0, 4);
  K.cheeseRack(w, -19.5, 19.5, 0, 4);
  K.pipes(w, 'x', 16.6, -26, -10, 3.6, [0xfacc15, 0xef4444, 0x38bdf8]);
  pallet(w, -12.5, 32.5, 0, 4, 0xd97706);
  K.crate(w, -15.5, 0, 33.0, 1.0, 0xb45309);
  // Gov Vault Transfer Terminal (Clue c08_unsecure_vault)
  K.desk(w, -13.5, 29.5, PI, { L: 2.8, D: 1.2, top: 0x334155 });
  K.monitor(w, null, -13.5, 0.86, 29.5, PI, 0xfacc15, 1.15);
  poster(w, 'x', 16.6, -16.0, 2.6, 3.8, 1.2, 0xb45309, 1, 'TORTUGA CHEESE -> GOV VAULT', 0xfef08a);
  // Security Detention Cell holding Brie's Mom (Camembert) & Dad (Roquefort) (Clue c09_parents_log)
  buildLaserCage(w, -23.5, 29.5, 4.8, 5.2, 3.2, 0xf59e0b);
  poster(w, 'z', -27.4, 29.5, 2.6, 3.4, 1.2, 0x1e3a8a, 1, 'CAPTURED VAULT GUARDS', 0xfef08a);
  pendant(w, -18.0, 26.0, 0xfacc15, 4.6);
  addLight(-18.0, 4.2, 26.0, 0xfde047, 23, 16, true, true);

  // --- Building 6: Ratita Now➡️ Underground & Dr. Evilest Clone Lab (East: x 8..28, z 16..36) ---
  const bClone = shell(w, {
    id: 'clone',
    name: '🧪 Ratita Now➡️ Underground & Dr. Evilest Clone Lab',
    x0: 8, z0: 16, x1: 28, z1: 36, h: 5.2,
    wall: 0x18181b, trim: 0xff1e42, roof: 0x09090b,
    floor: 'tile', fc1: 0x27272a, fc2: 0x18181b,
    doors: [{ side: 'w', at: 26, w: 3.2 }],
    win: { n: 1, s: 1, e: 1, w: 1 },
  });
  onSide(w, bClone, 'w', () => {
    K.sign3d(w, 'RATITA NOW -> CLONE LAB', 7.7, 4.1, 26, -PI / 2, 0.36, 0xff1e42, 0x09090b);
  });

  w.region = 'in_clone';
  // 3 Glowing Cloning Vats for Evil Luna, Evil Pi-rat, and Evil Snowie!
  K.vat(w, 14.0, 19.5, 0xa855f7, 0.95, 2.6);
  K.vat(w, 18.5, 19.5, 0xef4444, 0.95, 2.6);
  K.vat(w, 23.0, 19.5, 0x38bdf8, 0.95, 2.6);
  // Dr. Evilest's Cloning Blueprint Terminal (Clue c10_evilest_clones)
  K.labBench(w, 18.5, 32.5, PI, 4.6, { body: 0x27272a, top: 0x7f1d1d });
  K.monitor(w, null, 17.5, 0.96, 32.5, PI, 0xff1e42, 1.25);
  K.monitor(w, null, 19.5, 0.96, 32.5, PI, 0x4ade80, 1.25);
  K.robotArm(w, 24.5, 26.0, 0xff1e42);
  K.serverRack(w, 26.2, 22.0, -PI / 2);
  K.serverRack(w, 26.2, 30.0, -PI / 2);
  poster(w, 'x', 16.6, 18.5, 2.8, 4.2, 1.2, 0x991b1b, 1, 'DR. EVILEST CLONE MATRIX', 0xfef08a);
  poster(w, 'z', 27.4, 26.0, 2.8, 3.8, 1.2, 0x7f1d1d, -1, 'RATITA NOW -> SUPREME', 0xffffff);
  pendant(w, 18.5, 26.0, 0xff1e42, 4.6);
  addLight(18.5, 4.2, 26.0, 0xff4d6d, 26, 17, true, true);

  // District 3 street props
  w.region = 'out';
  K.cone3(w, -4.5, 20.0);
  K.cone3(w, 4.5, 20.0);
  K.hazard(w, 0, 26.0, 6.0, 2.4, 0);

  // =========================================================================
  // 5. DISTRICT 4 (z = +41 .. +74): NATIONAL RATITA PRISON & USM CAPITOL
  // =========================================================================
  // --- Building 7: National Ratita Prison (West: x -28..-8, z 45..68) ---
  const bPrison = shell(w, {
    id: 'prison',
    name: '⛓️ National Ratita Prison (Luna, Pi-rat, Snowie & Torty Held)',
    x0: -28, z0: 45, x1: -8, z1: 68, h: 5.4,
    wall: 0x334155, trim: 0xef4444, roof: 0x0f172a,
    floor: 'tile', fc1: 0x64748b, fc2: 0x475569,
    doors: [{ side: 'e', at: 56, w: 3.4 }],
    win: { n: 1, s: 1, e: 1, w: 1 },
  });
  onSide(w, bPrison, 'e', () => {
    K.sign3d(w, 'NATIONAL RATITA PRISON', -7.7, 4.2, 56, PI / 2, 0.36, 0xfef08a, 0x0f172a);
  });

  w.region = 'in_prison';
  // High-Security Cell Block A (North-West: Real Luna, Pi-rat & Snowie)
  buildLaserCage(w, -22.5, 50.5, 6.2, 5.2, 3.4, 0xff1e42);
  // High-Security Cell Block B (South-West: Torty / Martina)
  buildLaserCage(w, -22.5, 62.0, 6.2, 5.2, 3.4, 0x38bdf8);
  // Warden's Classified Warrant Desk & Master Cell Override Console (Clue c11_secret_charge)
  K.desk(w, -13.0, 50.5, 0, { L: 3.2, D: 1.3, top: 0x1e293b });
  K.monitor(w, null, -13.0, 0.86, 50.5, 0, 0x38bdf8, 1.2);
  K.desk(w, -13.0, 62.0, PI, { L: 3.2, D: 1.3, top: 0x7f1d1d });
  K.monitor(w, null, -13.0, 0.86, 62.0, PI, 0x4ade80, 1.2);
  K.serverRack(w, -10.0, 47.5, -PI / 2);
  K.filing(w, -10.0, 65.0, -PI / 2, 0x334155, 4);
  poster(w, 'x', 45.6, -15.0, 2.8, 4.0, 1.2, 0x991b1b, 1, 'WARRANT #0001-GG: CLASSIFIED', 0xfef08a);
  poster(w, 'x', 67.4, -15.0, 2.8, 4.0, 1.2, 0x0f766e, -1, 'CELL OVERRIDE TERMINAL', 0xffffff);
  pendant(w, -17.5, 56.0, 0xef4444, 4.8);
  addLight(-17.5, 4.4, 56.0, 0xff6b6b, 25, 18, true, true);

  // --- Building 8: USM Capitol Rotunda & Golden Gouda Relic Vault (East: x 8..28, z 45..68) ---
  const bCapitol = shell(w, {
    id: 'capitol',
    name: '🏛️ USM Capitol & Golden Gouda Vault (Evil Twins Showdown)',
    x0: 8, z0: 45, x1: 28, z1: 68, h: 5.8,
    wall: 0xfef3c7, trim: 0xd97706, roof: 0x92400e,
    floor: 'marble', fc1: 0xf8fafc, fc2: 0xfde68a,
    doors: [{ side: 'w', at: 56, w: 3.6 }],
    win: { n: 2, s: 2, e: 2, w: 1 },
  });
  onSide(w, bCapitol, 'w', () => {
    K.sign3d(w, 'USM CAPITOL - GOLDEN GOUDA VAULT', 7.7, 4.4, 56, -PI / 2, 0.34, 0xfef08a, 0x78350f);
  });

  w.region = 'in_capitol';
  // Royal crimson carpet leading to the Golden Gouda Pedestal
  K.rug(w, 18.0, 56.0, 0, 14.0, 5.5, 0x991b1b, 0xfacc15);
  // 4 Grand Golden Rotunda Columns
  [[13.0, 50.5], [23.0, 50.5], [13.0, 61.5], [23.0, 61.5]].forEach(([cx, cz]) => {
    w.slab('x', 0xd97706, cx, 0, cz, 0.9, 5.2, 0.9, 0.1);
  });
  // Priceless Golden Gouda Relic in the center of the Rotunda (Clue c12_golden_gouda_truth)
  buildGoldenGoudaRelic(w, 21.5, 56.0);
  // USM Supreme Authority Command Desk
  K.desk(w, 18.0, 65.0, PI, { L: 3.8, D: 1.4, top: 0x78350f });
  K.monitor(w, null, 18.0, 0.86, 65.0, PI, 0xfacc15, 1.25);
  poster(w, 'x', 45.6, 18.0, 3.0, 4.4, 1.3, 0x78350f, 1, 'UNITED STATES OF MAMMALIA', 0xfef08a);
  poster(w, 'z', 27.4, 56.0, 3.0, 4.4, 1.3, 0x991b1b, -1, 'GOLDEN GOUDA SUPREME RELIC', 0xfef08a);
  pendant(w, 18.0, 56.0, 0xfacc15, 5.2);
  addLight(21.5, 4.8, 56.0, 0xffe14d, 30, 20, false, true);


  // ===== CITY DRESSING: shopfront blocks fill every gap so no street end is empty =====
  w.region = 'out';
  const shops = [
    [-26, -12, 'GOUDA & SONS DELI', 0x9a3412], [6, 16, 'BONE APPETIT CAFE', 0x854d0e], [36, 45, 'SQUEAK STREET MARKET', 0x7c2d12],
  ];
  for (const [za, zb, name, col] of shops) {
    for (const sd of [-1, 1]) {
      const cx = sd * 18.5, cz = (za + zb) / 2, L = zb - za - 1.2;
      w.slab('m', sd < 0 ? col : 0x334155, cx, 0, cz, 18, 6.5 + (za & 3), L, 0.15);
      w.add('m', rbox(18.4, 0.5, L + 0.4, 0.1), 0x1c1917, cx, 6.6 + (za & 3), cz);
      const fx = cx - sd * 9.05;
      for (let wz = za + 1.8; wz < zb - 1.2; wz += 2.2) {
        w.add('l', rbox(0.08, 1.4, 1.3, 0.04), (wz | 0) % 2 ? 0xffd27a : 0xff9f6b, fx, 1.6, wz);
        w.add('l', rbox(0.08, 1.1, 1.1, 0.04), 0xffb36b, fx, 4.4, wz);
      }
      awning(w, cz - L / 2 + 0.5, cz + L / 2 - 0.5, fx - sd * 0.6, 3.0, sd < 0 ? [0xdc2626, 0xfef3c7] : [0x0f766e, 0xfef3c7], -sd);
      txt(w, sd < 0 ? name : 'RODENTIA FLATS', fx - sd * 0.12, 3.75, cz, sd < 0 ? PI / 2 : -PI / 2, 0.36, 0xfde047, 'l', 0.7);
      K.bench(w, fx - sd * 1.6, cz + 2.2, sd < 0 ? PI / 2 : -PI / 2, 0x7c2d12);
      K.potPlant(w, fx - sd * 1.2, 0, cz - 2.6, 1.1);
      trash(w, fx - sd * 1.3, cz - 3.6);
      K.crate(w, fx - sd * 1.4, 0, cz + 4.0, 0.7, 0xd97706);
      produceCrate(w, fx - sd * 2.0, 0, cz - 1.0, 0xfacc15);
    }
  }
  // Avenue life: parked cars, cones, flower beds and market stalls in every district
  const carCols = [0xef4444, 0x0ea5e9, 0xfacc15, 0x22c55e, 0xa855f7, 0xf97316];
  [-36, -22, -8, 4, 20, 32, 48, 62].forEach((z, i) => { K.toyCar(w, (i % 2 ? 1 : -1) * 4.6, z + 2, 0, carCols[i % 6]); });
  [-20, 9, 38].forEach((z) => { K.cone3(w, -2.2, z); K.cone3(w, 2.2, z); });
  K.flowerBed(w, -3.2, -44, 3.2, -42.4);
  K.flowerBed(w, -3.2, 70, 3.2, 72);
  for (const [z, c] of [[-28, 0xdc2626], [-6, 0xf59e0b], [22, 0x10b981], [50, 0x7c3aed]]) {
    w.add('x', K.cyl(8), 0x475569, -6.9, 0, z + 4, 0, 0, 0, 0.05, 2.6, 0.05);
    w.add('x', K.cyl(8), 0x475569, -5.1, 0, z + 4, 0, 0, 0, 0.05, 2.6, 0.05);
    awning(w, -7.2, -4.8, z + 4.0, 2.6, [c, 0xfef3c7], 1);
    w.slab('m', 0x92400e, -6, 0, z + 4, 2.2, 0.9, 1.0, 0.06);
    for (let k = 0; k < 4; k++) w.add('g', K.wedge ? K.wedge() : rbox(0.3, 0.2, 0.3, 0.05), 0xfacc15, -6.8 + k * 0.5, 0.98, z + 4);
  }
  // Distant hill skyline beyond the far walls (reads as a full city, not a black void)
  for (let i = 0; i < 14; i++) {
    const x = -39 + i * 6, h = 14 + ((i * 37) % 17);
    w.add('m', rbox(5.2, h, 5, 0.2), i % 2 ? 0x3b1630 : 0x2c1226, x, h / 2, -52);
    w.add('m', rbox(5.2, h + 4, 5, 0.2), i % 2 ? 0x2c1226 : 0x3b1630, x, (h + 4) / 2, 80);
    for (let wy = 3; wy < h - 1; wy += 3) { w.add('l', rbox(3.2, 0.5, 0.1, 0.02), (i + wy) % 3 ? 0xffb36b : 0xff4d6d, x, wy, -49.4); w.add('l', rbox(3.2, 0.5, 0.1, 0.02), (i + wy) % 3 ? 0xffb36b : 0xfde047, x, wy, 77.4); }
  }
  // Plaza signage at each district centre
  K.sign3d(w, 'CAPITOL PLAZA', 0, 3.2, 47.5, 0, 0.42, 0xfde047, 0x7f1d1d);
  K.sign3d(w, 'OLD TOWN - RATITA HQ', 0, 3.2, 1.5, 0, 0.38, 0xfde047, 0x7c2d12);

  // ===== EXTRA BANK STOCK: vault door, teller counters, cheese displays =====
  w.region = 'in_bank';
  // Giant round vault door on the north wall
  w.add('x', K.torus(1.6, 40), 0xb8860b, 13.0, 2.3, -41.35, 0, 0, 0, 1, 1, 0.35);
  w.add('x', K.rcyl(1.5, 0.3, 0.05, 40), 0x94a3b8, 13.0, 2.3, -41.3, PI / 2, 0, 0);
  for (let k = 0; k < 6; k++) { const a = k * PI / 3; w.add('x', rbox(0.12, 1.1, 0.12, 0.03), 0xfacc15, 13.0 + Math.cos(a) * 0.5, 2.3 + Math.sin(a) * 0.5, -40.95, 0, 0, a); }
  // Teller counter with glass partitions
  w.slab('m', 0x7c2d12, 13.0, 0, -36.6, 7.6, 1.05, 0.8, 0.06);
  w.add('m', rbox(7.8, 0.08, 1.0, 0.03), 0xfacc15, 13.0, 1.08, -36.6);
  for (let k = -3; k <= 3; k += 2) { w.add('e', rbox(0.06, 1.1, 0.7, 0.02), 0xcfefff, 13.0 + k * 1.2, 1.65, -36.6); K.monitor(w, null, 13.0 + k * 1.2 + 0.6, 1.08, -36.9, 0, 0x22c55e, 0.8); }
  // Cheese display pedestals with golden wedges under glass
  for (const [dx, dz] of [[9.6, -32], [16.4, -32], [9.6, -30.4], [16.4, -30.4]]) {
    w.slab('m', 0xf1f5f9, dx, 0, dz, 0.9, 1.0, 0.9, 0.05);
    w.add('l', rbox(0.5, 0.35, 0.4, 0.08), 0xfacc15, dx, 1.2, dz);
    w.add('e', rbox(0.8, 0.8, 0.8, 0.04), 0xcfefff, dx, 1.4, dz);
  }
  K.cheeseRack(w, 9.4, -27.6, 0, 3);
  K.cheeseRack(w, 16.6, -27.6, 0, 3);
  pallet(w, 10.0, -38.5, 0, 4, 0xfacc15);
  pallet(w, 16.2, -38.5, 0, 4, 0xfbbf24);
  K.rug(w, 13.0, -33.0, 0, 4.0, 2.6, 0x7f1d1d, 0xfef3c7);
  K.potPlant(w, 8.8, 0, -40.6, 1.1); K.potPlant(w, 17.2, 0, -40.6, 1.1);
  K.sofa(w, 22.0, -28.2, 0, 0x0f766e, 0x14b8a6);
  K.cooler(w, 19.2, -40.6); K.vending(w, 20.4, -27.4, PI, 0xfacc15);
  K.parcel(w, 25.6, 0, -33.0); K.parcel(w, 25.4, 0.5, -33.2); K.parcel(w, 25.8, 0, -34.0);
  wallWord(w, 'x', -41.4, 13.0, 4.25, 'EMERGENCY CHEESE RESERVE', 0.26, 0xfacc15, 1, 0.6);
  w.region = 'out';
  w.region = 'in_clone';
  K.conveyor(w, 13.0, 26.0, 0, 6);
  for (let k = -2; k <= 2; k++) K.crate(w, 13.0, 0.65, 26.0 + k * 1.1, 0.55, 0xef4444);
  K.desk(w, 13.5, 32.5, PI, { L: 2.8, D: 1.2, top: 0x3f3f46 });
  K.beaker(w, 13.0, 0.86, 32.5, 0x22c55e, 1.2, 0); K.beaker(w, 14.0, 0.86, 32.5, 0xa855f7, 1.2, 1);
  K.cheeseRack(w, 10.2, 21.0, PI / 2, 4); K.cheeseRack(w, 10.2, 31.0, PI / 2, 4);
  K.pipes(w, 'x', 16.5, 11, 26, 3.8);
  K.hazard(w, 18.5, 23.0, 8.0, 2.0, 0);
  K.potPlant(w, 9.2, 0, 17.5, 1.1); K.potPlant(w, 26.8, 0, 17.5, 1.1);
  w.region = 'in_prison';
  K.tableR(w, -15.5, 56.0, 1.1, 0.8, 0x475569);
  K.chair(w, -15.5, 0, 54.4, 0, 0xdc2626); K.chair(w, -15.5, 0, 57.6, PI, 0xdc2626);
  K.shelf(w, -9.2, 52.0, -PI / 2, 3.0, 2.5, 0.6, 0x334155);
  K.shelf(w, -9.2, 60.0, -PI / 2, 3.0, 2.5, 0.6, 0x334155);
  K.cooler(w, -9.4, 56.0); K.vending(w, -13.0, 66.6, PI, 0xef4444);
  K.crate(w, -18.0, 0, 47.0, 0.9, 0x475569); K.crate(w, -19.2, 0, 47.2, 0.75, 0xb45309);
  K.rug(w, -15.5, 56.0, 0, 4.2, 3.2, 0x1e293b, 0xef4444);
  w.region = 'out';
  return { spots, buildings: BUILDINGS };
}
