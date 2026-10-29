// Ratita HQ DLC #66: Tortuga Tech Inc. Expansion Wing
// Attached directly to the West Wing (x = -76..-46, z = -26..8, height = 9.2) with indoor merger archway,
// physical exterior coupling collar & overhead conduits, rooftop hex-shell dome, South Merger Courtyard,
// 3 interactive Shell-Tough Test Chambers, Crossover Gadget Assembly Lab, Plato's Repair Bench, and all 5 family pets.
import * as THREE from 'three';
import * as K from './kit.js';
import { P } from './geo.js';
import { MB, toGroup } from './models.js';

const { wall, D, G, floor, ceiling, sign3d, rbox, rcyl, lathe, sph, cyl, cone, torus, capsule, tube, gear, monitor, desk, chair, whiteboard, plant, sofa, rug, shelf, labBench, vat, pipes, serverRack, conveyor, hazard, lampPost, bench, rock, cactus } = K;
const PI = Math.PI;

export const DLC_KEY = 'grokDLC.ratitahq.tortuga_tech_expansion';
export const DLC_PRICE = 75;
export const HT = 9.2; // Tortuga Tech Wing ceiling height

export function tortugaOwned() {
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('locked') === '1') return false;
    if (q.get('dlc') === '1') return true;
    const p = location.pathname || '';
    if (p.includes('/previews/') || p.includes('/archive/') || location.hostname === 'localhost' || location.hostname === '127.0.0.1') return true;
    if (localStorage.getItem(DLC_KEY) === 'true' || localStorage.getItem('grokPreview.' + DLC_KEY) === 'true') return true;
    return true;
  } catch (e) {
    return true;
  }
}

export const CROSSOVER_GADGETS = [
  {
    id: 'shelljet',
    name: 'Shell-Shield Jetpack Mk.IV',
    icon: '🚀',
    maker: 'Pi-rat × Torty',
    rating: '50-Ton Crush-Proof',
    desc: 'Ratita twin-thruster pack clad in emerald hexagonal Tortuga scutes. Survives direct anvil drops & boosts air control.'
  },
  {
    id: 'grappleclaw',
    name: 'Carapace Grapple-Claw',
    icon: '🪝',
    maker: 'Bolt × Engineer Ironshell',
    rating: '900°C Plasma-Proof',
    desc: 'Titanium-shell winch hook with desert-sand seals and high-torque Tortuga reel.'
  },
  {
    id: 'shockblaster',
    name: 'Gouda-Core Shock Blaster',
    icon: '🧀',
    maker: 'Luna × Snowie × Torty',
    rating: '88 MPH Impact-Proof',
    desc: 'Fires super-heated cheddar-plasma bolts through a rifled tortoise-carapace barrel.'
  },
  {
    id: 'bumperrover',
    name: 'Turbo Bumper-Shell Pod',
    icon: '🐢',
    maker: 'Candy × Plato',
    rating: 'Schnauzer-Chew & Crash Certified',
    desc: 'Gyro-stabilized spherical shell bumper rig tested against Candy’s jaw and 88 MPH centrifuge impacts.'
  }
];

export const CHAMBER_INFO = {
  crush: {
    id: 'crush',
    num: 1,
    name: 'Chamber 1 · 50-Ton Hydraulic Crush Press',
    lead: 'Pi-rat & Engineer Ironshell',
    spec: '50,000 kg Anvil Drop · Hex-Scute Deflection',
    pos: [-70.5, 0, -20.5]
  },
  plasma: {
    id: 'plasma',
    num: 2,
    name: 'Chamber 2 · Desert Plasma & Sand-Blast Tunnel',
    lead: 'Snowie & Engineer Blaze',
    spec: '900°C Solar Plasma + Mojave Grit Cannon',
    pos: [-70.5, 0, -9.5]
  },
  crash: {
    id: 'crash',
    num: 3,
    name: 'Chamber 3 · Bumper-Shell Centrifuge & Chew Track',
    lead: 'Candy & Plato',
    spec: '88 MPH G-Force Spin + Schnauzer Bite Rig',
    pos: [-70.5, 0, 2.2]
  }
};

const TEAL = 0x0f9d8a, TEAL_L = 0x2dd4bf, TEAL_D = 0x0b5e54;
const SAND = 0xf5d6a7, SAND_D = 0xd9895a, GOLD = 0xfbbf24, AMBER = 0xd97706;
const PINK = 0xff4fa0, STEEL = 0x475569, SLATE = 0x1e293b;

function hexShell(w, x, y, z, scale = 1, colShell = TEAL, colScute = AMBER) {
  w.add('g', sph(20), colShell, x, y, z, 0, 0, 0, 0.95 * scale, 0.52 * scale, 1.12 * scale);
  w.add('x', rcyl(1.02 * scale, 0.08 * scale, 0.03 * scale, 24), GOLD, x, y - 0.08 * scale, z);
  w.add('g', rcyl(0.34 * scale, 0.14 * scale, 0.04 * scale, 6), colScute, x, y + 0.4 * scale, z);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * PI * 2;
    w.add('g', rcyl(0.25 * scale, 0.12 * scale, 0.03 * scale, 6), i % 2 ? colScute : TEAL_L,
      x + Math.cos(a) * 0.52 * scale, y + 0.22 * scale, z + Math.sin(a) * 0.6 * scale, 0, a, 0);
  }
}

// 1. Called inside shell(w) in campus.js
export function buildTortugaShell(w, HR = 5, EXT = 0xff74b4) {
  if (!tortugaOwned()) {
    wall(w, 'z', -46, -28, 10, HR, EXT, [G(-25, -16, 3.8, 1.2), G(-5, 0, 3.8, 1.2)], { blinds: 0xfff7ed, blindSide: -1 });
    return;
  }

  // Floors of Tortuga Tech Wing (x: -76..-46, z: -26..8)
  // East Concourse & Terrarium (x: -61..-46, z: -13..8) -> Warm Desert Sandstone & Amber Tiles
  floor(w, -61, -13, -46, 8, 'tile', 0, 0xfef3c7, 0xf5d096, 2.5);
  // North Crossover Assembly Lab (x: -61..-46, z: -26..-13) -> Clean Teal & Slate Lab Tiles
  floor(w, -61, -26, -46, -13, 'tile', 0, 0xdbeafe, 0x99f6e4, 2.0);
  // West 3 Shell-Tough Test Chambers (x: -76..-61, z: -26..8) -> Heavy Industrial Steel-Slate Tiles
  floor(w, -76, -26, -61, 8, 'tile', 0, 0xe2e8f0, 0x94a3b8, 2.5);

  // West end of Ratita HQ (x = -46): open the wide Merger Doorway D(-12, -7, 4.2) from West Hall into Tortuga Tech!
  wall(w, 'z', -46, -28, 10, HR, EXT, [G(-25, -16, 3.8, 1.2), D(-12, -7, 4.2), G(-5, 0, 3.8, 1.2)]);
  // Upper adapter wall at x = -46 from y = HR (5) to HT (9.2)
  wall(w, 'z', -46, -26, 8, HT, SAND, [D(-12, -7, 4.2), [-28, -26, 5, 0, 0, 'noframe'], [8, 10, 5, 0, 0, 'noframe']], { y: 0, noTrim: true, noBase: true });

  // North wall of Tortuga Tech Wing (z = -26, x = -76..-46) overlooking Test Yard
  wall(w, 'x', -26, -76, -46, HT, SAND, [G(-73, -64, 6.8, 1.8), G(-58, -49, 6.8, 1.8)], { trim: TEAL, base: SAND_D, frame: TEAL });
  // South wall of Tortuga Tech Wing (z = 8, x = -76..-46) with wide outdoor Merger Plaza entrance D(-62, -56, 6.2)
  wall(w, 'x', 8, -76, -46, HT, SAND, [G(-73.5, -64.5, 6.8, 1.8), D(-62, -56, 6.2), G(-54, -48, 6.8, 1.8)], { trim: TEAL, base: SAND_D, frame: TEAL });
  // West wall of Tortuga Tech Wing (x = -76, z = -26..8)
  wall(w, 'z', -76, -26, 8, HT, SAND, [G(-23, -17, 6.8, 1.8), G(-12, -6, 6.8, 1.8), G(-1, 5, 6.8, 1.8)], { trim: TEAL, base: SAND_D, frame: TEAL });

  // Ceiling over Tortuga Tech Wing (height HT = 9.2) with warm bright lab lighting
  ceiling(w, -76, -26, -46, 8, HT, 0xfefce8, { li: 30, lampCol: 0xd9f99d });
}

// 2. Called inside outdoors(w) in campus.js
export function buildTortugaOutdoors(w, HR = 5) {
  if (!tortugaOwned()) return;

  // Rooftop parapet trim around Tortuga Tech Wing (x: -76..-46, z: -26..8, y: HT)
  w.add('g', rbox(31, 0.55, 35, 0.15), TEAL, -61, HT + 0.65, -9);

  // Giant Rooftop Hexagonal Tortoise-Shell Dome & Solar Scutes on top of Tortuga Tech Wing
  hexShell(w, -61, HT + 1.1, -9, 4.6, TEAL_D, AMBER);
  w.solid(-65.5, HT + 0.4, -14, -56.5, HT + 3.4, -4);
  for (let i = 0; i < 4; i++) {
    const sx = -72 + i * 5.2, sz = -21;
    w.add('x', rbox(3.4, 0.12, 2.2, 0.04), 0x0f766e, sx, HT + 1.05, sz, -0.32, 0, 0);
    w.add('x', cyl(8), 0x94a3b8, sx, HT + 0.4, sz, 0, 0, 0, 0.07, 0.85, 0.07);
  }

  // PHYSICAL BUILDING ATTACHMENT COLLAR & CROSSOVER CONDUITS AT x = -46
  // Visibly bolts & fuses the Tortuga Tech Wing (x=-76..-46) to Ratita Industries HQ (x=-46..46)!
  for (const cz of [-25.8, -13.2, -5.8, 7.8]) {
    w.slab('x', STEEL, -46, 0, cz, 1.5, HT + 0.5, 1.3, 0.1);
    w.add('g', rbox(0.5, HT + 0.3, 1.45, 0.06), TEAL, -46.45, (HT + 0.3) / 2, cz);
    w.add('g', rbox(0.5, HR + 0.3, 1.45, 0.06), PINK, -45.55, (HR + 0.3) / 2, cz);
    for (let y = 1.4; y <= 4.8; y += 1.6) {
      w.add('x', cyl(12), GOLD, -46, y, cz + (cz > 0 ? 0.72 : -0.72), PI / 2, 0, 0, 0.2, 0.18, 0.2);
    }
  }
  // Overhead Twin Energy & Cheese-Goo Crossover Pipes bridging from Tortuga Tech Roof (HT=9.2) onto Ratita HQ West Wing Roof (HR=5.0)
  w.add('x', tube([[-48, HT + 0.6, -11], [-45, HT + 0.6, -11], [-42, HR + 0.6, -11], [-36, HR + 0.6, -11]], 0.24, 20, 10), TEAL_L, 0, 0, 0);
  w.add('x', tube([[-48, HT + 0.6, -8], [-45, HT + 0.6, -8], [-42, HR + 0.6, -8], [-36, HR + 0.6, -8]], 0.24, 20, 10), PINK, 0, 0, 0);
  // Stepped Rooftop Merger Bridge from Ratita West Roof (y=5.4) up to Tortuga Tech Roof (y=9.6)
  for (let i = 0; i < 7; i++) {
    w.slab('g', i % 2 ? TEAL : GOLD, -42.5 - i * 0.65, HR + 0.35 + i * 0.6, -9.5, 0.8, 0.35, 2.6, 0.05);
  }

  // Big Rooftop & Facade 3D Signs
  sign3d(w, 'TORTUGA TECH INC', -61, HT + 1.15, 8.35, 0, 0.72, GOLD, TEAL_D);
  sign3d(w, 'RATITA X TORTUGA', -46, HT + 1.1, 8.35, 0, 0.45, 0xffffff, PINK);
  sign3d(w, 'SHELL TOUGH LABS', -61, HT + 1.15, -26.35, PI, 0.68, GOLD, TEAL_D);

  // South Merger Courtyard & Desert Walkway (x: -74..-44, z: 8..24)
  floor(w, -66, 8.2, -52, 22, 'tile', 0.02, 0xfde68a, 0xf5d096, 2);
  floor(w, -52, 12, -16, 17, 'tile', 0.02, 0xffd6e7, 0xfef3c7, 2);
  // Entrance Canopy over South Doorway (x = -59, z = 8..11)
  w.slab('g', TEAL, -59, 6.3, 9.6, 8.4, 0.35, 3.0, 0.1);
  hexShell(w, -59, 6.9, 9.8, 1.35, TEAL_D, GOLD);
  sign3d(w, 'TORTUGA TECH', -59, 5.75, 11.15, 0, 0.36, GOLD, TEAL_D);

  // Courtyard Cacti, Desert Boulders, Benches & Lamp Posts
  [[-71, 12, 1.25], [-74, 19, 1.4], [-67, 20, 1.1], [-50, 10.5, 1.15], [-79, 2, 1.3], [-79, -11, 1.2], [-79, -22, 1.35]].forEach(([cx, cz, sc]) => {
    cactus(w, cx, cz, sc);
    rock(w, cx + 1.3, cz + 0.7, 0.65);
  });
  bench(w, -64.5, 15, PI / 2, TEAL);
  bench(w, -53.5, 15, -PI / 2, TEAL);
  lampPost(w, -65, 19);
  lampPost(w, -53, 19);

  // Exterior Roof Access Ladder on the South-West Seam (x = -45.2, z = 10.35) + West Wall Ladder (x = -76.5, z = -2.5)
  for (let y = 0.4; y < HR + 0.5; y += 0.45) {
    w.add('x', cyl(8), GOLD, -45.2, y, 10.45, 0, 0, PI / 2, 0.04, 0.8, 0.04);
    w.slab('x', GOLD, -45.2, y, 10.45, 0.8, 0.06, 0.3, 0.02);
  }
  [-1, 1].forEach((s) => w.add('x', cyl(8), GOLD, -45.2 + s * 0.4, 0, 10.45, 0, 0, 0, 0.05, HR + 1.2, 0.05));

  // Golden Gear on top of Tortuga Tech's Rooftop Shell Dome!
  w.gears.push([-61, HT + 3.8, -9]);
}

// 3. Called inside buildCampus(w) with w.region = 'tortuga'
export function buildTortugaInterior(w) {
  w.region = 'tortuga';
  if (!tortugaOwned()) {
    w.region = 'whall';
    w.slab('g', TEAL_D, -45.7, 0, -9.5, 0.3, 3.8, 3.6, 0.06);
    sign3d(w, 'TORTUGA TECH DLC', -45.4, 2.5, -9.5, PI / 2, 0.22, GOLD, TEAL_D);
    w.I({ id: 'tt_dlc_gate', kind: 'tt_dlc', x: -44.6, y: 0, z: -9.5, r: 2.2, label: `🔒 Unlock Tortuga Tech Expansion (${DLC_PRICE} 🎟)` });
    return;
  }

  // Also add a sign on the West Hall side of the Merger Doorway (x = -45.6, z = -9.5) so players in West Hall see it clearly!
  w.region = 'whall';
  sign3d(w, 'TORTUGA TECH', -45.65, 4.35, -9.5, PI / 2, 0.22, GOLD, TEAL_D);
  w.region = 'tortuga';

  // Interior Partition Wall at x = -61 separating the 3 West Test Chambers (x: -76..-61) from the East Concourse & Crossover Lab (x: -61..-46)
  const HP = 4.8;
  wall(w, 'z', -61, -26, 8, HP, 0xe2e8f0, [
    G(-25.2, -22.2, 3.8, 1.0),
    D(-21.6, -17.6, 3.8),
    G(-17.0, -15.4, 3.8, 1.0),
    G(-14.2, -11.8, 3.8, 1.0),
    D(-11.2, -7.2, 3.8),
    G(-6.6, -4.4, 3.8, 1.0),
    D(-1.2, 3.2, 3.8),
    G(3.8, 7.2, 3.8, 1.0)
  ], { th: 0.28, trim: TEAL, base: STEEL, frame: TEAL });

  // Chamber Dividers on the West Side (x: -76..-61) at z = -15 and z = -4
  wall(w, 'x', -15, -76, -61, HP, 0xcbd5e1, [D(-70.5, -66.5, 3.6)], { th: 0.26, trim: GOLD, base: STEEL, frame: TEAL });
  wall(w, 'x', -4, -76, -61, HP, 0xcbd5e1, [D(-70.5, -66.5, 3.6)], { th: 0.26, trim: GOLD, base: STEEL, frame: TEAL });

  // Partial Lab Arch Divider at z = -13 (x: -61..-46) between North Crossover Assembly Lab and South Concourse
  wall(w, 'x', -13, -61, -46, HP, 0xf1f5f9, [G(-60.2, -56.8, 3.8, 1.0), D(-56.2, -50.2, 4.0), G(-49.6, -46.6, 3.8, 1.0)], { th: 0.26, trim: TEAL, base: SAND_D, frame: TEAL });

  //Overhead Color-Coded Crossover Pipes along the Tortuga Tech ceiling
  pipes(w, 'z', -60.5, -25, 7, 8.2, [TEAL_L, PINK, GOLD]);
  pipes(w, 'x', -13.0, -75, -47, 8.2, [TEAL, GOLD]);

  // =========================================================================
  // ZONE 1: MERGER CONCOURSE, TORTY'S CEO DESK & RECEPTION (x: -61..-46, z: -13..8)
  // =========================================================================
  // Merger Runner Rug from West Hall Doorway (x = -46, z = -9.5) to Central Monument
  rug(w, -51.5, -9.5, PI / 2, 2.4, 9.5, TEAL, GOLD);
  sign3d(w, 'TORTUGA TECH WING', -46.4, 4.35, -9.5, -PI / 2, 0.22, GOLD, TEAL_D);

  // Central Ratita × Tortuga Merger Monument (x = -54.2, z = -5.2)
  w.slab('g', TEAL_D, -54.2, 0, -5.2, 3.2, 0.45, 3.2, 0.12);
  w.slab('g', SAND_D, -54.2, 0.45, -5.2, 2.4, 0.5, 2.4, 0.1);
  hexShell(w, -54.2, 1.25, -5.2, 1.15, TEAL, GOLD);
  sign3d(w, 'MERGER MONUMENT', -54.2, 0.55, -3.52, 0, 0.14, GOLD, TEAL_D);
  w.spots.tortugaMonument = [-54.2, 2.25, -5.2];
  // Golden Gear floating above the Merger Monument!
  w.gears.push([-54.2, 2.8, -5.2]);

  // Torty's Executive Terrarium Platform & CEO Desk (x = -54.2, z = 2.6)
  w.add('g', rcyl(3.4, 0.12, 0.04, 36), 0xfde68a, -54.2, 0, 2.6);
  w.add('g', torus(0.08, 40), TEAL, -54.2, 0.12, 2.6, PI / 2, 0, 0, 3.35, 3.35, 1);
  // Low tortoise-height Mahogany CEO Desk
  {
    const T = w.tf(-54.2, 0, 4.2, PI);
    T.slab('m', 0x7c2d12, 0, 0, 0, 2.8, 0.72, 1.2, 0.08);
    T.box('g', TEAL_L, 0, 0.72, 0, 2.9, 0.06, 1.3, 0.03);
    monitor(w, T, -0.65, 0.78, 0, 0, 0x2dd4bf, 1.15);
    // Mini shell trophy & lettuce bowl on Torty's desk
    T.add('g', rcyl(0.24, 0.08, 0.02, 18), 0xffffff, 0.65, 0.78, 0.1);
    T.add('g', sph(12), 0x22c55e, 0.65, 0.88, 0.1, 0, 0, 0, 0.2, 0.12, 0.2);
  }
  sign3d(w, 'TORTY · CEO', -54.2, 0.45, 3.52, 0, 0.16, GOLD, TEAL_D);
  // Warm Basking Cushion & Solar Heat Lamp next to Torty's Desk
  w.add('f', rcyl(0.95, 0.2, 0.08, 28), 0xf43f5e, -51.6, 0, 2.6);
  w.add('f', torus(0.12, 28), GOLD, -51.6, 0.18, 2.6, PI / 2, 0, 0, 0.92, 0.92, 1);
  w.add('x', cyl(10), STEEL, -51.6, 0, 3.7, 0, 0, 0, 0.06, 2.9, 0.06);
  w.add('x', tube([[-51.6, 2.8, 3.7], [-51.6, 3.1, 3.1], [-51.6, 2.7, 2.6]], 0.05, 12, 8), STEEL, 0, 0, 0);
  w.add('x', cone(16), GOLD, -51.6, 2.65, 2.6, 0, 0, 0, 0.38, 0.28, 0.38);
  w.add('l', sph(12), 0xffedd5, -51.6, 2.5, 2.6, 0, 0, 0, 0.2, 0.12, 0.2, 0.9);
  cactus(w, -57.2, 4.8, 0.75);
  cactus(w, -50.8, 5.2, 0.7);

  // Shelly's Reception Desk & Visitor Lounge (x = -48.5, z = 0.5)
  desk(w, -48.5, 0.5, -PI / 2, { L: 2.4, D: 1.1, top: 0xfef3c7, plant: true });
  sofa(w, -48.2, -3.5, -PI / 2, TEAL, 0x99f6e4, 18);
  K.cooler(w, -47.2, 5.8);
  K.filing(w, -47.2, 4.2, -PI / 2, TEAL, 4);
  plant(w, -47.2, 6.8, 1.3);
  plant(w, -60.0, 6.8, 1.3);

  // Crispy Lettuce & Gouda Merger Snack Bar (x = -49.2, z = -12.1)
  {
    const T = w.tf(-49.2, 0, -12.1, 0);
    T.slab('g', TEAL_D, 0, 0, 0, 3.4, 0.95, 0.9, 0.08);
    T.box('g', SAND, 0, 0.95, 0, 3.55, 0.08, 1.0, 0.03);
    for (let i = -1; i <= 1; i++) {
      const p = T.P(i * 1.0, 1.03, 0);
      w.add('g', rcyl(0.28, 0.05, 0.02, 20), 0xffffff, p[0], p[1], p[2]);
      w.add('g', sph(12), i === 0 ? 0xfacc15 : 0x22c55e, p[0], p[1] + 0.12, p[2], 0, 0, 0, 0.22, 0.14, 0.22);
    }
  }
  sign3d(w, 'LETTUCE & GOUDA BAR', -49.2, 2.35, -12.65, 0, 0.14, GOLD, TEAL_D);

  // =========================================================================
  // ZONE 2: CROSSOVER GADGET ASSEMBLY LAB, LOADOUT RACK & PLATO'S REPAIR BENCH (x: -61..-46, z: -26..-13)
  // =========================================================================
  sign3d(w, 'CROSSOVER GADGET LAB', -53.5, 3.8, -25.6, 0, 0.26, 0xffffff, TEAL_D);

  // 4 Crossover Gadget Display Pedestals along x = -59.2, z = -23.5..-16.0
  const gadCols = [TEAL_L, GOLD, PINK, 0x38bdf8];
  CROSSOVER_GADGETS.forEach((g, idx) => {
    const gz = -23.5 + idx * 2.4;
    w.add('g', rcyl(0.58, 0.95, 0.08, 28), SLATE, -59.2, 0, gz);
    w.add('l', rcyl(0.6, 0.06, 0.03, 28), gadCols[idx], -59.2, 0.95, gz, 0, 0, 0, 1, 1, 1, 0.6);
    w.solid(-59.8, 0, gz - 0.6, -58.6, 1.1, gz + 0.6);
    hexShell(w, -59.2, 1.28, gz, 0.42, gadCols[idx], GOLD);
  });
  sign3d(w, 'CROSSOVER GADGETS', -60.6, 3.1, -19.8, PI / 2, 0.16, GOLD, SLATE);
  w.I({ id: 'tt_console', kind: 'tt_console', x: -57.8, y: 0, z: -19.8, r: 2.6, label: '🐢 Open Tortuga Crossover Gadget & Test Console' });

  // Automated Shell-Plating Conveyor & Stamping Line (x = -52.5, z = -23.5)
  conveyor(w, -52.5, -23.5, 0, 6.0);
  w.slab('g', TEAL_D, -52.5, 0.75, -23.5, 1.6, 1.85, 1.5, 0.08);
  w.add('l', sph(12), 0x4ade80, -52.5, 2.45, -22.7, 0, 0, 0, 0.14, 0.14, 0.08, 0.9);
  for (let i = -1; i <= 1; i++) {
    hexShell(w, -52.5 + i * 1.8, 0.95, -23.5, 0.35, i < 0 ? PINK : TEAL, GOLD);
  }
  serverRack(w, -47.2, -24.5, -PI / 2, w.leds);
  serverRack(w, -47.2, -23.2, -PI / 2, w.leds);

  // Merger Blueprint Table & Clue Pickup (x = -48.8, z = -19.2)
  {
    const T = w.tf(-48.8, 0, -19.2, -PI / 2);
    T.slab('m', 0x9a6a3e, 0, 0, 0, 2.4, 0.9, 1.3, 0.05);
    T.box('m', TEAL_D, 0, 0.9, 0, 2.0, 0.03, 1.1, 0.01);
    T.add('l', torus(0.06, 24), GOLD, 0, 0.93, 0, PI / 2, 0, 0, 0.35, 0.35, 0.05, 0.5);
  }
  whiteboard(w, 'z', -46.3, -16.0, 1.4, 2.6, -1);
  w.I({ id: 'clue_tortuga', kind: 'clue', x: -49.8, y: 0, z: -19.2, r: 2.0, label: '📐 Inspect the Ratita × Tortuga Merger Blueprint' });

  // PLATO'S SHELL-ARMOR REPAIR & WELD BENCH + FREE SCRAP BIN (x = -57.5, z = -14.2)
  {
    const T = w.tf(-58.0, 0, -14.2, 0);
    T.slab('x', STEEL, 0, 0, 0, 3.4, 0.95, 1.2, 0.08);
    T.box('g', AMBER, 0, 0.95, 0, 3.5, 0.08, 1.28, 0.03);
    // Robotic welding arm & glowing blue arc-torch + anvil
    T.add('x', cyl(12), SLATE, -1.1, 1.0, -0.25, 0, 0, 0, 0.12, 0.75, 0.12);
    T.box('g', GOLD, -0.75, 1.65, -0.1, 0.75, 0.12, 0.12, 0.03);
    T.add('l', sph(12), 0x38bdf8, -0.38, 1.5, -0.1, 0, 0, 0, 0.12, 0.12, 0.12, 1.0);
    T.box('x', SLATE, 0.95, 1.03, 0, 0.55, 0.28, 0.34, 0.04); // anvil
  }
  for (let i = 0; i < 3; i++) hexShell(w, -58.0, 1.1 + i * 0.12, -14.2, 0.28, TEAL, GOLD);
  sign3d(w, 'SHELL REPAIR BENCH', -58.0, 2.75, -13.35, PI, 0.15, GOLD, 0x7c2d12);
  w.spots.tortugaRepair = [-58.0, 1.35, -14.2];
  w.I({ id: 'tt_repair', kind: 'tt_repair', x: -58.0, y: 0, z: -15.4, r: 2.4, label: '🔧 Repair Cracked Shell / Gadgets (Plato’s Weld Bench)' });

  // Free Scrap Bolt Recycling Bin right beside Repair Bench (Guarantees player is NEVER stuck!)
  w.slab('g', TEAL_D, -55.2, 0, -14.2, 1.2, 0.82, 1.0, 0.08);
  for (let i = 0; i < 6; i++) {
    w.add('x', gear(8), GOLD, -55.2 + (i % 3 - 1) * 0.26, 0.88, -14.2 + (i > 2 ? 0.18 : -0.18), PI / 2, i, 0, 0.14, 0.14, 0.06);
  }
  sign3d(w, 'FREE SCRAP', -55.2, 1.85, -13.35, PI, 0.12, 0xffffff, TEAL);
  w.I({ id: 'tt_scrap_bin', kind: 'tt_scrap', x: -55.2, y: 0, z: -15.3, r: 2.1, label: '♻️ Collect Free Spare Scrap Bolts (+25 ⚙️)' });

  // =========================================================================
  // ZONE 3: THE 3 INTERACTIVE SHELL-TOUGH TEST CHAMBERS (x: -76..-61, z: -26..8)
  // =========================================================================

  // --- CHAMBER 1 (NW, x: -76..-61, z: -26..-15): 50-TON HYDRAULIC CRUSH PRESS ---
  hazard(w, -70.5, -20.5, 5.2, 4.6);
  // Twin hydraulic gantry columns & upper crossbeam
  w.slab('x', STEEL, -72.8, 0, -20.5, 0.85, 6.2, 1.2, 0.08);
  w.slab('x', STEEL, -68.2, 0, -20.5, 0.85, 6.2, 1.2, 0.08);
  w.slab('g', TEAL_D, -70.5, 5.8, -20.5, 6.0, 0.9, 1.5, 0.1);
  // Anvil pedestal & Tortuga Shell-Gadget under test
  w.slab('x', 0x334155, -70.5, 0, -20.5, 2.2, 0.85, 2.2, 0.08);
  hexShell(w, -70.5, 1.05, -20.5, 0.65, TEAL, GOLD);
  w.spots.ttCrush = [-70.5, 0.85, -20.5];
  // Live hazard collider if player steps right onto the anvil block!
  {
    const hz = w.solid(-71.5, 0.85, -21.5, -69.5, 2.5, -19.5, { hot: true });
    hz.ttChamber = 'crush';
  }
  desk(w, -64.5, -23.2, -PI / 2, { L: 2.2, D: 1.1, top: 0xcbd5e1, chair: false });
  K.crate(w, -74.5, 0, -24.5, 0.9, AMBER);
  sign3d(w, 'CHAMBER 1 · 50T CRUSH PRESS', -70.5, 4.4, -25.55, 0, 0.22, GOLD, SLATE);
  w.I({ id: 'tt_crush', kind: 'tt_chamber', chamber: 'crush', x: -65.2, y: 0, z: -21.8, r: 2.5, label: '🔨 Chamber 1 Console: Run 50-Ton Crush Test' });
  // Golden Gear in Chamber 1!
  w.gears.push([-74.5, 1.5, -24.5]);

  // --- CHAMBER 2 (MID-WEST, x: -76..-61, z: -15..-4): 900°C PLASMA & SAND-BLAST TUNNEL ---
  hazard(w, -70.5, -9.5, 5.2, 4.4);
  w.slab('x', STEEL, -70.5, 0, -9.5, 4.8, 0.32, 4.0, 0.08);
  // 6 Glowing Solar-Plasma Heating Towers around the test pad
  for (const sx of [-72.4, -70.5, -68.6]) {
    for (const sz of [-11.1, -7.9]) {
      w.add('x', cyl(12), STEEL, sx, 0.32, sz, 0, 0, 0, 0.18, 2.3, 0.18);
      w.add('l', cyl(14), 0xf97316, sx, 0.65, sz, 0, 0, 0, 0.25, 1.5, 0.25, 0.85);
      w.add('l', torus(0.08, 20), 0xfef08a, sx, 1.4, sz, PI / 2, 0, 0, 0.32, 0.32, 1, 0.9);
    }
  }
  // Mojave Sand-Blast Jet Cannon on West Wall
  w.add('g', cyl(16), AMBER, -74.8, 1.35, -9.5, 0, 0, PI / 2, 0.38, 1.6, 0.38);
  w.add('l', sph(14), GOLD, -73.9, 1.35, -9.5, 0, 0, 0, 0.28, 0.28, 0.28, 0.9);
  vat(w, -74.2, -13.4, 0xf97316, 0.7, 2.1);
  w.spots.ttPlasma = [-70.5, 0.5, -9.5];
  {
    const hz = w.solid(-71.6, 0.32, -10.6, -69.4, 2.2, -8.4, { hot: true });
    hz.ttChamber = 'plasma';
  }
  desk(w, -64.5, -12.2, -PI / 2, { L: 2.2, D: 1.1, top: 0xcbd5e1, chair: false });
  sign3d(w, 'CHAMBER 2 · PLASMA & SAND', -70.5, 4.3, -14.65, 0, 0.22, 0xfed7aa, 0x7c2d12);
  w.I({ id: 'tt_plasma', kind: 'tt_chamber', chamber: 'plasma', x: -65.2, y: 0, z: -10.5, r: 2.5, label: '🔥 Chamber 2 Console: Run Plasma & Sand-Blast Test' });

  // --- CHAMBER 3 (SW, x: -76..-61, z: -4..8): 88 MPH BUMPER-SHELL CENTRIFUGE & CHEW RIG ---
  w.add('g', rcyl(3.2, 0.1, 0.04, 36), TEAL_D, -70.5, 0, 2.2);
  w.add('g', torus(0.18, 40), GOLD, -70.5, 0.32, 2.2, PI / 2, 0, 0, 3.1, 3.1, 1);
  w.slab('x', STEEL, -70.5, 0, 2.2, 1.1, 1.1, 1.1, 0.08);
  w.spots.ttCrash = [-70.5, 0.95, 2.2];
  {
    const hz = w.solid(-72.2, 0.2, 0.5, -68.8, 1.8, 3.9, { hot: true });
    hz.ttChamber = 'crash';
  }
  // Candy's Schnauzer Chew & Bite Rig (x = -64.8, z = -2.2)
  w.slab('g', SAND_D, -64.8, 0, -2.2, 1.6, 0.85, 1.0, 0.08);
  w.add('g', capsule(10), 0xfff7ed, -64.8, 0.98, -2.2, 0, 0, PI / 2, 0.14, 0.45, 0.14);
  hexShell(w, -64.8, 1.02, -2.2, 0.3, TEAL, GOLD);
  desk(w, -64.5, 5.2, -PI / 2, { L: 2.2, D: 1.1, top: 0xcbd5e1, chair: false });
  sign3d(w, 'CHAMBER 3 · CENTRIFUGE & CHEW', -70.5, 4.3, -3.65, 0, 0.2, GOLD, TEAL_D);
  w.I({ id: 'tt_crash', kind: 'tt_chamber', chamber: 'crash', x: -65.2, y: 0, z: 3.6, r: 2.5, label: '💥 Chamber 3 Console: Run Centrifuge & Chew Test' });

  // Secret discovery in Tortuga Tech Wing!
  w.secrets.push({ id: 'tortuga_wing', x: -54.2, y: 0, z: 2.6, r: 3.5, msg: '🐢 Secret: Torty’s Executive Terrarium Desk in Tortuga Tech!' });
}

// 4. Dynamic animated 3D rigs inside Tortuga Tech Wing (called from Game.buildRigs / Game.anim)
export function buildTortugaDyn(game) {
  const s = game.world.spots;
  if (!s.ttCrush) return null;
  const grp = new THREE.Group();
  game.add(grp);

  // (a) Rotating Golden Shell-Gear Emblem on the Merger Monument
  const mon = new THREE.Group();
  mon.position.set(...s.tortugaMonument);
  {
    const b = MB();
    b.x.add(gear(12), GOLD, 0, 0, 0, 0, 0, 0, 0.55, 0.55, 0.14);
    b.l.add(P.oct, TEAL_L, 0, 0, 0, 0, 0, 0, 0.28, 0.28, 0.28, 0.8);
    mon.add(toGroup(b));
  }
  grp.add(mon);

  // (b) Chamber 1: Animated 50-Ton Hydraulic Crush Ram & Anvil
  const ram = new THREE.Group();
  ram.position.set(s.ttCrush[0], 3.4, s.ttCrush[2]);
  {
    const b = MB();
    b.x.add(P.rbox, SLATE, 0, 0, 0, 0, 0, 0, 2.4, 0.95, 1.9);
    b.g.add(P.rbox, GOLD, 0, -0.35, 0, 0, 0, 0, 2.46, 0.22, 1.96);
    b.x.add(P.cyl, 0x94a3b8, 0, 1.6, 0, 0, 0, 0, 0.38, 2.4, 0.38);
    ram.add(toGroup(b));
  }
  grp.add(ram);

  // (c) Chamber 2: Rotating Plasma Test Turntable
  const plasma = new THREE.Group();
  plasma.position.set(s.ttPlasma[0], 0.55, s.ttPlasma[2]);
  {
    const b = MB();
    b.x.add(rcyl(0.95, 0.16, 0.04, 24), STEEL, 0, 0, 0);
    b.g.add(P.sphere, TEAL, 0, 0.32, 0, 0, 0, 0, 0.65, 0.4, 0.8);
    b.l.add(P.torus, 0xf97316, 0, 0.25, 0, PI / 2, 0, 0, 0.82, 0.82, 0.18, 0.8);
    plasma.add(toGroup(b));
  }
  grp.add(plasma);

  // (d) Chamber 3: Spinning 88 MPH Bumper-Shell Centrifuge Arm & Pods
  const crash = new THREE.Group();
  crash.position.set(s.ttCrash[0], 1.05, s.ttCrash[2]);
  {
    const b = MB();
    b.x.add(P.rbox, STEEL, 0, 0, 0, 0, 0, 0, 4.4, 0.16, 0.28);
    b.g.add(P.sphere, TEAL, 2.0, 0.12, 0, 0, 0, 0, 0.62, 0.42, 0.72);
    b.x.add(P.cyl, GOLD, 2.0, 0.38, 0, 0, 0, 0, 0.25, 0.12, 0.25);
    b.g.add(P.sphere, PINK, -2.0, 0.12, 0, 0, 0, 0, 0.62, 0.42, 0.72);
    b.x.add(P.cyl, GOLD, -2.0, 0.38, 0, 0, 0, 0, 0.25, 0.12, 0.25);
    crash.add(toGroup(b));
  }
  grp.add(crash);

  return { grp, mon, ram, plasma, crash };
}
