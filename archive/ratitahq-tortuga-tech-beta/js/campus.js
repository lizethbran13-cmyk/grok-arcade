// Ratita Industries HQ campus: the whole explorable hub. Regions (rooms) are batched separately so only the rooms you can
// actually see get drawn; walls/floors/ceilings ("shell") are shared. Everything is real 3D: rounded boxes, lathes, tubes, 3D text.
import * as THREE from 'three';
import * as K from './kit.js';
import { buildTortugaShell, buildTortugaOutdoors, buildTortugaInterior, tortugaOwned } from './tortuga-wing.js';
import { propSeed, PR } from './props.js';
const { wall, D, G, floor, ceiling, sign3d, hh, rbox, rcyl, lathe, sph, cyl, cone, torus, capsule, tube, leaf, wedge, gear, star, heart, blobGeo, pick, monitor, desk, chair, whiteboard, plant, sofa, rug, shelf, tableR, labBench, beaker, vat, pipes, serverRack, conveyor, cheeseRack, hazard, tree, bush, lampPost, bench, toyCar, flowerBed, fenceRun, rock, cactus } = K;
const R = K.R, PI = Math.PI, HR = 5, HA = 8;
export const REGIONS = [
  { id: 'pent', x0: -12, x1: 12, z0: -44, z1: -28, y0: 18, y1: 30, name: '👑 Executive Suite' },
  { id: 'dome', x0: -128, x1: -82, z0: -38, z1: 8, y0: -45, y1: -10, name: '🌵 ???' },
  { id: 'atrium', x0: -12, x1: 12, z0: -28, z1: 10, y0: -2, y1: 8.2, name: '🏢 Grand Atrium' },
  { id: 'obs', x0: -12, x1: 12, z0: -44, z1: -28, y0: -2, y1: 5.2, name: '🔭 Observation Deck' },
  { id: 'whall', x0: -46, x1: -12, z0: -12, z1: -7, y0: -2, y1: 5.2, name: '➡️ West Hall' },
  { id: 'gadget', x0: -46, x1: -29, z0: -28, z1: -12, y0: -2, y1: 5.2, name: '🔧 Gadget Lab' },
  { id: 'goo', x0: -29, x1: -12, z0: -28, z1: -12, y0: -2, y1: 5.2, name: '🧪 Goo Lab' },
  { id: 'cafe', x0: -46, x1: -25, z0: -7, z1: 10, y0: -2, y1: 5.2, name: '🍽️ Cheese Café' },
  { id: 'offices', x0: -25, x1: -12, z0: -7, z1: 10, y0: -2, y1: 5.2, name: '💼 Offices' },
  { id: 'ehall', x0: 12, x1: 46, z0: -12, z1: -7, y0: -2, y1: 5.2, name: '⬅️ East Hall' },
  { id: 'robo', x0: 12, x1: 29, z0: -28, z1: -12, y0: -2, y1: 5.2, name: '🤖 Robotics Lab' },
  { id: 'cheese', x0: 29, x1: 46, z0: -28, z1: -12, y0: -2, y1: 5.2, name: '🧀 Cheese R&D' },
  { id: 'security', x0: 12, x1: 26, z0: -7, z1: 10, y0: -2, y1: 5.2, name: '🛡️ Security & Mail' },
  { id: 'lounge', x0: 26, x1: 46, z0: -7, z1: 10, y0: -2, y1: 5.2, name: '🛋️ Break Lounge' },
  { id: 'dcr', x0: 46, x1: 74, z0: -24, z1: 6, y0: -2, y1: 10.2, name: '🐶 Dept. of Canine Ruffsources' },
  { id: 'tortuga', x0: -76, x1: -46, z0: -26, z1: 8, y0: -2, y1: 10.2, name: '🐢 Tortuga Tech Inc.' },
];
export const NEAR = { atrium: ['whall', 'ehall', 'obs', 'out'], obs: ['atrium', 'out'], whall: ['gadget', 'goo', 'cafe', 'offices', 'atrium', 'tortuga', 'out'], gadget: ['whall', 'goo', 'tortuga', 'out'], goo: ['whall', 'gadget'], cafe: ['whall', 'tortuga'], offices: ['whall'],
  ehall: ['robo', 'cheese', 'security', 'lounge', 'atrium', 'dcr'], robo: ['ehall'], cheese: ['ehall'], security: ['ehall'], lounge: ['ehall'], dcr: ['ehall', 'out'], tortuga: ['whall', 'gadget', 'cafe', 'out'], pent: ['out'], dome: [], out: ['atrium', 'obs', 'dcr', 'tortuga', 'pent'] };
export function regionAt(x, y, z) { for (const r of REGIONS) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1 && y >= r.y0 && y <= r.y1) return r.id; return 'out'; }
// ------------------------------------------------------------------------------------------------ the Grand Atrium glass dome
// a real 3D elliptical dome: glass shell (sunlight + shadows pass through), white meridian ribs and latitude rings, a pink
// crown cap, and a flat roof deck with an elliptical opening that fills the corners of the rectangular atrium.
function atriumDome(w) { const cx = 0, cz = -9, A = 12, B = 19, Hd = 7, Y = HA + 0.4;
  { const sh = new THREE.Shape(); sh.moveTo(-A - 0.3, -B - 0.3); sh.lineTo(A + 0.3, -B - 0.3); sh.lineTo(A + 0.3, B + 0.3); sh.lineTo(-A - 0.3, B + 0.3); sh.lineTo(-A - 0.3, -B - 0.3);
    const hole = new THREE.Path(); hole.absellipse(0, 0, A - 0.15, B - 0.15, 0, PI * 2, true); sh.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: false, curveSegments: 64 }); g.rotateX(PI / 2); w.add('w', g, 0xfffaf2, cx, Y, cz); }
  // corner fill lamps + soft daylight spots under the glass
  [[-10, -26], [10, -26], [-10, 8], [10, 8]].forEach(([x, z]) => { w.add('l', sph(12), 0xfff4dc, x, HA - 0.1, z, 0, 0, 0, 0.5, 0.12, 0.5, 0.6); });
  w.lights.push({ x: 0, y: 6.5, z: -9, c: 0xfff1d6, i: 26, d: 26 }, { x: 0, y: 6, z: 2, c: 0xffe4f0, i: 18, d: 20 }, { x: 0, y: 6, z: -20, c: 0xffe4f0, i: 18, d: 20 });
  const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14 * PI / 2; pts.push([Math.cos(t), Math.sin(t)]); }
  w.add('e', lathe(pts, 48, 'aDome'), 0xd8f1ff, cx, Y, cz, 0, 0, 0, A, Hd, B);
  const rib = (a) => { const q = []; for (let i = 0; i <= 12; i++) { const t = i / 12 * PI / 2 * 0.985; q.push([cx + Math.cos(a) * Math.cos(t) * A * 1.006, Y + Math.sin(t) * Hd * 1.006, cz + Math.sin(a) * Math.cos(t) * B * 1.006]); } return q; };
  for (let i = 0; i < 16; i++) w.add('x', tube(rib(i / 16 * PI * 2), 0.09, 20, 6), 0xffffff, 0, 0, 0);
  [0.22, 0.45, 0.68, 0.86].forEach((f) => { const t = f * PI / 2, c = Math.cos(t), y = Y + Math.sin(t) * Hd * 1.006, q = []; for (let k = 0; k <= 48; k++) { const a = k / 48 * PI * 2; q.push([cx + Math.cos(a) * c * A * 1.006, y, cz + Math.sin(a) * c * B * 1.006]); } w.add('x', tube(q, 0.07, 64, 6), 0xffffff, 0, 0, 0); });
  { const q = []; for (let k = 0; k <= 64; k++) { const a = k / 64 * PI * 2; q.push([cx + Math.cos(a) * A, Y + 0.08, cz + Math.sin(a) * B]); } w.add('x', tube(q, 0.16, 96, 8), 0xff4fa0, 0, 0, 0); } w.add('g', sph(24), 0xff4fa0, cx, Y + Hd - 0.05, cz, 0, 0, 0, 0.9, 0.35, 1.3); w.add('x', sph(16), 0xffd23f, cx, Y + Hd + 0.35, cz, 0, 0, 0, 0.35);
  w.solid(-12.3, HA, -28.3, 12.3, HA + 0.4, 10.3, { cam: true, nofloor: true, nocam: true });
}
// ------------------------------------------------------------------------------------------------ build
export function buildCampus(w) {
  propSeed(4242); w.inter = []; w.npcSpots = {}; w.gears = []; w.secrets = []; w.kdoors = []; w.leds = []; w.dyn = w.dyn || []; w.spots = {}; w.lightsAll = w.lights;
  w.env = { sunDir: [0.4, 0.85, 0.35], sunColor: 0xfff3dc, sunI: 2.5, hemiSky: 0xd6ecff, hemiGround: 0x7a6a50, hemiI: 0.62, skyTop: 0x4aa3ff, skyMid: 0xbfe3ff, skyBot: 0xe9f6ff, fog: 0xcfe8ff, fogD: 0.0035, exposure: 1.02, envI: 0.9, bloomT: 1.0, bloomS: 0.42, sunDisc: 1 };
  const I = (o) => { w.inter.push(o); return o; };
  w.I = I;
  shell(w); w.region = 'out'; outdoors(w); w.region = 'atrium'; atrium(w); w.region = 'obs'; obsDeck(w); w.region = 'whall'; hallW(w); w.region = 'gadget'; gadgetLab(w); w.region = 'goo'; gooLab(w);
  w.region = 'cafe'; cafe(w); w.region = 'offices'; offices(w); w.region = 'ehall'; hallE(w); w.region = 'robo'; robotics(w); w.region = 'cheese'; cheeseLab(w); w.region = 'security'; security(w); w.region = 'lounge'; lounge(w);
  w.region = 'dcr'; dcr(w); w.region = 'pent'; penthouse(w); w.region = 'dome'; dome(w); w.region = 'out'; testYard(w); w.region = 'shell';
  w.start = [0, 0.05, 6]; w.startYaw = PI; w.killY = -60; w.camDist = 5.6;
  return w;
}
// ------------------------------------------------------------------------------------------------ shell: floors, walls, ceilings
function shell(w) { w.region = 'shell';
  const WALL = 0xffe2b8, PINK = 0xffa8cf, BLUE = 0x9cc9ff, MINT = 0x8ff0b4, LAV = 0xc9b8ff, PEACH = 0xffc58f, EXT = 0xff74b4;
  // floors
  floor(w, -12, -28, 12, 10, 'marble', 0, 0xfff4ea, 0xffa9cc); floor(w, -12, -44, 12, -28, 'tile', 0, 0xbae6fd, 0x5fc2f5);
  floor(w, -46, -12, -12, -7, 'tile', 0, 0xfff1a8, 0xffc94a); floor(w, 12, -12, 46, -7, 'tile', 0, 0xfff1a8, 0xffc94a);
  floor(w, -46, -28, -29, -12, 'tile', 0, 0xe2e8f0, 0x8fa3bf); floor(w, -29, -28, -12, -12, 'tile', 0, 0xd9f99d, 0x9be15d);
  floor(w, -46, -7, -25, 10, 'tile', 0, 0xffffff, 0xff6b81); floor(w, -25, -7, -12, 10, 'carpet', 0, 0x4f6fd8, 0x5f80e8);
  floor(w, 12, -28, 29, -12, 'tile', 0, 0xcbd5e1, 0x5b6b84); floor(w, 29, -28, 46, -12, 'tile', 0, 0xfff3a0, 0xffc928);
  floor(w, 12, -7, 26, 10, 'tile', 0, 0xe5e7eb, 0x93a0b3); floor(w, 26, -7, 46, 10, 'wood');
  floor(w, 46, -24, 74, 6, 'wood', 0, 0xc98d55);
  // atrium
  wall(w, 'x', 10, -12, 12, HA, EXT, [D(-3, 3, 3.6), G(-10, -5, 6.5, 1.0), G(5, 10, 6.5, 1.0)], { frame: 0xffffff });
  wall(w, 'z', -12, -28, 10, HA, PINK, [D(-12, -7, 3.6)]); wall(w, 'z', 12, -28, 10, HA, PINK, [D(-12, -7, 3.6)]);
  wall(w, 'x', -28, -12, 12, HA, PINK, [D(-2.5, 2.5, 3.6)]);
  atriumDome(w);
  // observation deck (+ the tower above it, penthouse at y 20)
  wall(w, 'z', -12, -44, -28, HR, BLUE); wall(w, 'z', 12, -44, -28, HR, BLUE);
  wall(w, 'x', -44, -12, 12, HR, BLUE, [G(-11, -3, 4.3, 0.6), D(-2, 2, 3.4), G(3, 11, 4.3, 0.6)]);
  ceiling(w, -12, -44, 12, -28, HR, 0xf8fafc, { li: 18 });
  [['z', -12, -44, -28], ['z', 12, -44, -28], ['x', -44, -12, 12], ['x', -28, -12, 12]].forEach(([ax, at, a, b]) => wall(w, ax, at, a, b, 15, 0xffb6d9, [], { y: HR + 0.4, noBase: true, trim: 0xff4fa0 }));
  // tower window bands (closed blinds) on the way up, then the penthouse glass all round
  [-8, 0, 8].forEach((c) => [8, 12, 16].forEach((y) => { w.add('e', rbox(4, 1.6, 0.1, 0.05), 0x9ad8ff, c, y, -44.3); w.add('g', rbox(4.3, 1.9, 0.12, 0.08), 0xffffff, c, y, -44.2); w.add('e', rbox(4, 1.6, 0.1, 0.05), 0x9ad8ff, c, y, -27.7); w.add('g', rbox(4.3, 1.9, 0.12, 0.08), 0xffffff, c, y, -27.8); }));
  floor(w, -12, -44, 12, -28, 'wood', 20.4, 0xb98552);
  w.solid(-12, 5.4, -44, 12, 20.4, -28, { cam: true, nofloor: true });
  wall(w, 'x', -44, -12, 12, 6, 0xfff7ed, [G(-11.6, 11.6, 5.4, 0.5)], { y: 20.4 }); wall(w, 'x', -28, -12, 12, 6, 0xfff7ed, [G(-11.6, 3, 5.4, 0.5), G(6, 11.6, 5.4, 0.5)], { y: 20.4 });
  wall(w, 'z', -12, -44, -28, 6, 0xfff7ed, [G(-43.6, -28.4, 5.4, 0.5)], { y: 20.4 }); wall(w, 'z', 12, -44, -28, 6, 0xfff7ed, [G(-43.6, -28.4, 5.4, 0.5)], { y: 20.4 });
  ceiling(w, -12, -44, 12, -28, 26.4, 0xfff7ed, { li: 26 });
  // halls
  wall(w, 'x', -12, -46, -12, HR, LAV, [D(-39.5, -35.5), D(-22.5, -18.5)]); wall(w, 'x', -7, -46, -12, HR, LAV, [D(-37, -33), D(-20.5, -16.5)]);
  wall(w, 'x', -12, 12, 46, HR, LAV, [D(18.5, 22.5), D(35.5, 39.5)]); wall(w, 'x', -7, 12, 46, HR, LAV, [D(17, 21), D(34, 38)]);
  ceiling(w, -46, -12, -12, -7, HR); ceiling(w, 12, -12, 46, -7, HR);
  // west wing rooms
  wall(w, 'x', -28, -46, -12, HR, EXT, [G(-44, -40, 3.8, 1.2), G(-35, -31, 3.8, 1.2), G(-27, -23, 3.8, 1.2), G(-18, -14, 3.8, 1.2)], { blinds: 0xfff7ed, blindSide: 1 });
  buildTortugaShell(w, HR, EXT);
  wall(w, 'z', -29, -28, -12, HR, MINT, [[-21, -20, 0.75, 0, 0, 'noframe']]); ceiling(w, -46, -28, -29, -12, HR); ceiling(w, -29, -28, -12, -12, HR, 0xf7fee7);
  wall(w, 'x', 10, -46, -12, HR, EXT, [G(-44, -40, 3.8, 1.2), G(-34, -29, 3.8, 1.2), G(-22, -15, 3.8, 1.2)], { blinds: 0xfff7ed, blindSide: -1 });
  wall(w, 'z', -25, -7, 10, HR, PEACH); ceiling(w, -46, -7, -25, 10, HR); ceiling(w, -25, -7, -12, 10, HR, 0xf8fafc);
  // pantry (blue keycard) inside the café, disco closet inside the offices (secret gap)
  wall(w, 'z', -40, 2, 10, HR, 0xe0e7ff, [D(4.4, 6.8, 2.9)]); wall(w, 'x', 2, -46, -40, HR, 0xe0e7ff);
  wall(w, 'z', -21, 6, 10, HR, PEACH, [D(8.7, 9.7, 1.9)]); wall(w, 'x', 6, -25, -21, HR, PEACH);
  // east wing rooms
  wall(w, 'x', -28, 12, 46, HR, EXT, [G(14, 18, 3.8, 1.2), G(23, 27, 3.8, 1.2), G(31, 36, 3.8, 1.2), G(40, 44, 3.8, 1.2)], { blinds: 0xfff7ed, blindSide: 1 });
  wall(w, 'z', 29, -28, -12, HR, 0xfef3c7); ceiling(w, 12, -28, 29, -12, HR, 0xf1f5f9); ceiling(w, 29, -28, 46, -12, HR, 0xfffbeb);
  wall(w, 'x', 10, 12, 46, HR, EXT, [G(14, 18, 3.8, 1.2), G(20.5, 24.5, 3.8, 1.2), G(29, 34, 3.8, 1.2), G(39, 44, 3.8, 1.2)], { blinds: 0xfff7ed, blindSide: -1 });
  wall(w, 'z', 26, -7, 10, HR, 0xe0f2fe); ceiling(w, 12, -7, 26, 10, HR); ceiling(w, 26, -7, 46, 10, HR, 0xfff7ed);
  wall(w, 'x', -21, 12, 18, HR, 0x94a3b8); wall(w, 'z', 18, -28, -21, HR, 0x94a3b8, [D(-25.4, -22.8, 2.8)]);
  // east end: B1 east wall with the dog-sized doorway into Canine Ruffsources, then the DCR building (ceiling 10)
  wall(w, 'z', 46, -28, 10, HR, EXT, [D(-12, -7, 4.2)]);
  wall(w, 'z', 46, -24, 6, 10, 0xfde68a, [D(-12, -7, 4.2), [-28, -24, 5, 0, 0, 'noframe'], [6, 10, 5, 0, 0, 'noframe']], { y: 0, noTrim: true, noBase: true });
  wall(w, 'x', -24, 46, 74, 10, 0xfde68a, [G(50, 56, 7.5, 2.2), G(64, 70, 7.5, 2.2)]); wall(w, 'x', 6, 46, 74, 10, 0xfde68a, [D(57, 63, 7.2), G(48.5, 54.5, 7.5, 2.2), G(65.5, 71.5, 7.5, 2.2)]); wall(w, 'z', 74, -24, 6, 10, 0xfde68a, [G(-20, -12, 7.5, 2.2), G(-6, 2, 7.5, 2.2)]);
  ceiling(w, 46, -24, 74, 6, 10, 0xfffbeb, { li: 30 });
  // roof parapets + exterior cladding trims (visible from outside)
  w.region = 'out';
  [[-46, 46, -28.6, 10.6, HR]].forEach(([x0, x1, z0, z1, h]) => { w.add('g', rbox(x1 - x0 + 1.2, 0.5, 0.6, 0.1), 0xff4fa0, (x0 + x1) / 2, h + 0.65, z0); w.add('g', rbox(x1 - x0 + 1.2, 0.5, 0.6, 0.1), 0xff4fa0, (x0 + x1) / 2, h + 0.65, z1); w.add('g', rbox(0.6, 0.5, z1 - z0, 0.1), 0xff4fa0, x0 - 0.3, h + 0.65, (z0 + z1) / 2); });
  w.add('g', rbox(25, 0.6, 0.7, 0.12), 0xffd23f, 0, HA + 0.7, 10.3); w.add('g', rbox(0.7, 0.6, 38, 0.12), 0xffd23f, -12.3, HA + 0.7, -9); w.add('g', rbox(0.7, 0.6, 38, 0.12), 0xffd23f, 12.3, HA + 0.7, -9);
  w.add('g', rbox(25, 0.7, 17, 0.2), 0xff4fa0, 0, 26.9, -36); w.add('g', rcyl(2.2, 1.0, 0.3, 32), 0xffd23f, 0, 27.2, -36); w.add('x', cyl(10), 0xcbd5e1, 0, 28.2, -36, 0, 0, 0, 0.08, 3, 0.08); w.add('l', sph(14), 0xff4fa0, 0, 29.8, -36, 0, 0, 0, 0.3, 0.3, 0.3, 0.8);
  w.add('g', rbox(29, 0.5, 31, 0.15), 0xffc94a, 60, 10.65, -9);
  // roof clutter: AC units, solar panels, vents, satellite dish
  for (let i = 0; i < 4; i++) { const x = -40 + i * 7, z = -20; w.add('x', rbox(2.2, 1.2, 1.6, 0.15), 0xcbd5e1, x, HR + 1.0, z); w.add('m', rcyl(0.55, 0.05, 0.02, 20), 0x334155, x, HR + 1.62, z); w.solid(x - 1.1, HR + 0.4, z - 0.8, x + 1.1, HR + 1.6, z + 0.8); }
  for (let i = 0; i < 6; i++) { const x = 18 + i * 4.5; w.add('x', rbox(3.6, 0.1, 2.2, 0.04), 0x1e3a8a, x, HR + 1.0, -20, -0.35, 0, 0); w.add('x', cyl(8), 0x94a3b8, x, HR + 0.4, -20, 0, 0, 0, 0.06, 0.8, 0.06); }
  w.add('x', lathe([[0, 0], [1.2, 0.35], [1.25, 0.4], [0, 0.12]], 28, 'dish'), 0xe5e7eb, 34, HR + 2.2, 2, -0.6, 0.5, 0); w.add('x', cyl(10), 0x94a3b8, 34, HR + 0.4, 2, 0, 0, 0, 0.1, 1.8, 0.1);
  // the big rooftop RATITA INDUSTRIES letters over the entrance
  sign3d(w, 'RATITA INDUSTRIES', 0, HA + 1.2, 10.4, 0, 1.15, 0xff4fa0, 0xffffff);
  w.region = 'shell';
}
// ------------------------------------------------------------------------------------------------ helpers
const art = (w, axis, at, c, y, W, H, side, k) => PR.frame(K.scaled(w, 0, 0, 0, 0.25), axis, (at + side * 0.25) / 0.25, c / 0.25, y / 0.25, W / 0.25, H / 0.25, side, k);
const clock = (w, axis, at, c, y, side) => PR.clock(K.scaled(w, 0, 0, 0, 0.25), axis, (at + side * 0.25) / 0.25, c / 0.25, y / 0.25, side);
const gearC = (w, x, y, z) => w.gears.push([x, y, z]);
const BR = [0xff5d73, 0x4f9dff, 0x3ddc84, 0xffc93c, 0xa66bff, 0x2dd4bf, 0xff8a3d, 0xff6fcf];
function bigScreen(w, x, y, z, ry, W, H, col) { const T = w.tf(x, y, z, ry); T.box('g', 0x1f2937, 0, 0, 0, W + 0.2, H + 0.2, 0.12, 0.05); T.box('l', col, 0, 0.1, 0.07, W, H, 0.02, 0.01, 0.55); }
function poster(w, axis, at, c, y, side, kind, col = pick(BR)) { // raised 3D poster: rocket / cheese / gear / heart / star
  const T = axis === 'x' ? w.tf(c, y, at + side * 0.27, side > 0 ? 0 : PI) : w.tf(at + side * 0.27, y, c, side > 0 ? PI / 2 : -PI / 2);
  T.box('g', 0xffffff, 0, 0, 0, 1.5, 2.0, 0.05, 0.02); T.box('g', col, 0, 0.08, 0.03, 1.32, 1.84, 0.03, 0.02);
  if (kind === 0) { T.add('g', capsule(12), 0xffffff, 0, 1.0, 0.1, 0, 0, 0, 0.36, 0.5, 0.16); T.add('g', cone(14), 0xff4fa0, 0, 1.5, 0.1, 0, 0, 0, 0.18, 0.3, 0.1); T.add('l', cone(10), 0xffb020, 0, 0.55, 0.1, PI, 0, 0, 0.14, 0.3, 0.08, 0.5); }
  else if (kind === 1) T.add('g', wedge(), 0xffc93c, -0.5, 0.55, 0.06, 0, 0, 0, 1.0, 1.4, 0.2);
  else if (kind === 2) T.add('x', gear(10), 0xffd23f, 0, 1.0, 0.06, 0, 0, 0, 0.5, 0.5, 0.15);
  else if (kind === 3) T.add('g', heart(), 0xff4fa0, 0, 1.0, 0.06, 0, 0, 0, 0.45, 0.45, 0.15);
  else T.add('g', star(), 0xffd23f, 0, 1.0, 0.06, 0, 0, 0, 0.5, 0.5, 0.15); }
// ------------------------------------------------------------------------------------------------ outdoors: plaza, parking, campus edge
function outdoors(w) {
  w.add('m', rbox(260, 0.4, 230, 0.1, 1), 0x6fcf62, 0, -0.22, -45); w.solid(-130, -3, -160, 130, -0.02, 70, { floor: true });
  // entrance plaza (pink pavers) + walkway + road
  floor(w, -16, 10.5, 16, 26.5, 'tile', 0.02, 0xffd6e7, 0xfff1f6, 2);
  w.add('m', rbox(130, 0.06, 7, 0.02, 1), 0x4b5563, 0, 0.0, 33); for (let x = -62; x < 64; x += 6) w.add('g', rbox(3, 0.02, 0.3, 0.01), 0xffffff, x, 0.04, 33);
  w.add('m', rbox(28, 0.06, 12, 0.02, 1), 0x6b7280, 36, 0.0, 20); for (let i = 0; i < 6; i++) { w.add('g', rbox(0.15, 0.02, 4, 0.01), 0xffffff, 24 + i * 4.4, 0.04, 20); toyCar(w, 26.2 + i * 4.4, 18.5 + (i % 2) * 3, i % 2 ? PI : 0, BR[i]); }
  w.add('m', rbox(22, 0.06, 12, 0.02, 1), 0x6b7280, -32, 0.0, 20); for (let i = 0; i < 4; i++) toyCar(w, -40 + i * 5, 19.5, 0, BR[i + 3]);
  // plaza fountain with a giant golden cheese
  w.add('g', lathe([[0, 0], [4, 0], [4.2, 0.7], [3.8, 0.75], [3.7, 0.3], [0, 0.3]], 48, 'fountainB'), 0xf8fafc, 0, 0, 19); w.solid(-4, 0, 15, 4, 0.75, 23);
  w.add('e', rcyl(3.7, 0.12, 0.05, 48), 0x5ad1ff, 0, 0.45, 19); w.add('g', rcyl(0.8, 1.8, 0.2, 24), 0xf8fafc, 0, 0.3, 19); w.add('x', wedge(), 0xffc93c, -1.1, 2.1, 19 - 0.5, 0, 0.3, 0, 2.2, 2.2, 1.0);
  w.zone('water', -3.7, -1, 15.3, 3.7, 0.55, 22.7);
  // flower beds, trees, lamps, benches, flags
  flowerBed(w, -14, 11.5, -6, 14); flowerBed(w, 6, 11.5, 14, 14); flowerBed(w, -46, 11, -16, 13); flowerBed(w, 16, 11, 46, 13);
  [[-20, 24], [20, 24], [-56, 8], [56, 14], [-56, -16], [80, -10], [-70, 30], [70, 30], [-8, 28], [8, 28], [-62, -40], [52, 24], [-24, 28], [24, 28]].forEach(([x, z], i) => tree(w, x, z, 1 + (i % 3) * 0.2, i % 4 === 0 ? 1 : 0));
  [[-16, 16], [16, 16], [-16, 25], [16, 25], [-50, 30], [50, 30], [0, 30.5]].forEach(([x, z]) => lampPost(w, x, z));
  bench(w, -9, 22, PI / 2); bench(w, 9, 22, -PI / 2); bench(w, -24, 15, 0, 0x60a5fa); bench(w, 24, 15, 0, 0x60a5fa);
  [-6, 0, 6].forEach((x, i) => { w.add('x', cyl(10), 0xe5e7eb, x, 0, 26.5, 0, 0, 0, 0.08, 7, 0.08); w.add('x', sph(10), 0xffd23f, x, 7.05, 26.5, 0, 0, 0, 0.15); w.add('f', rbox(2.2, 1.3, 0.05, 0.02), [0xff4fa0, 0xffd23f, 0x4f9dff][i], x + 1.15, 6.1, 26.5); });
  // campus sign
  w.slab('g', 0xff4fa0, -24, 0, 26, 9, 1.1, 1.2, 0.3); sign3d(w, 'RATITA HQ', -24, 1.25, 26.3, 0, 0.75, 0xffffff, null); w.add('g', rbox(9.6, 0.25, 1.4, 0.1), 0xffd23f, -24, 1.1, 26);
  // bushes along building walls
  for (let x = -44; x < 46; x += 4) if (Math.abs(x) > 14) bush(w, x, 11.6, 0.8 + R() * 0.3);
  for (let z = -26; z < 10; z += 4) { bush(w, tortugaOwned() ? -77.6 : -47.6, z, 0.9); }
  // perimeter fence + hills
  fenceRun(w, 'x', 40, -100, 100, 1.6, 0xfff1f6); fenceRun(w, 'z', -100, -125, 40, 1.6, 0xfff1f6); fenceRun(w, 'z', 100, -125, 40, 1.6, 0xfff1f6); fenceRun(w, 'x', -125, -100, 100, 1.6, 0xfff1f6);
  for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2; w.add('g', blobGeo(i, 0.25, 2), i % 2 ? 0x55b24c : 0x4aa043, Math.cos(a) * 150, -4, -45 + Math.sin(a) * 125, 0, a, 0, 30, 14 + (i % 3) * 5, 22); }
  // roof access ladder (secret: rooftop gear stash)
  if (!tortugaOwned()) { for (let y = 0.4; y < HR + 0.5; y += 0.45) w.add('x', cyl(8), 0xfbbf24, -47.0, y, -2.5, 0, 0, PI / 2, 0.04, 0.8, 0.04); [-1, 1].forEach((s) => w.add('x', cyl(8), 0xfbbf24, -47.0, 0, -2.5 + s * 0.4, 0, 0, 0, 0.05, HR + 1.2, 0.05));
    for (let y = 0.45; y < HR + 0.5; y += 0.45) w.slab('x', 0xfbbf24, -46.9, y, -2.5, 0.3, 0.06, 0.8, 0.02); }
  buildTortugaOutdoors(w, HR);
  gearC(w, -40, HR + 0.9, -2); gearC(w, 0, 27.6, -30); gearC(w, 34, HR + 3.6, 2); w.secrets.push({ id: 'roof', x: -44, y: HR + 0.5, z: -2.5, r: 2.5, msg: '🪜 Secret: the roof! Great view of the yard.' });
  gearC(w, 0, 3.1, 19); gearC(w, 60, 0.6, 30); gearC(w, -90, 0.6, -110);
}
// ------------------------------------------------------------------------------------------------ atrium
function atrium(w) {
  // curved reception desk
  for (let i = 0; i < 9; i++) { const a = -1.1 + i * 0.275, x = Math.sin(a) * 3, z = -1 + Math.cos(a) * 1.6; const T = w.tf(x, 0, z, a); T.slab('g', 0xff4fa0, 0, 0, 0, 1.1, 1.05, 0.5, 0.08); T.box('g', 0xffffff, 0, 1.05, 0.05, 1.15, 0.08, 0.7, 0.03); T.box('l', 0xffd23f, 0, 0.5, 0.26, 1.1, 0.06, 0.02, 0.01, 0.6); }
  monitor(w, null, -0.8, 1.13, -1.4, PI); monitor(w, null, 1.0, 1.13, -1.3, PI + 0.2, 0xff8fd1); w.add('g', rcyl(0.15, 0.2, 0.03, 18), 0xffd23f, 1.8, 1.13, -0.3); w.add('x', sph(12), 0xd1d5db, 1.8, 1.4, -0.3, 0, 0, 0, 0.14, 0.08, 0.14);
  sign3d(w, 'WELCOME!', 0, 3.6, -5.6, 0, 0.55, 0xff4fa0); w.add('g', rbox(5.2, 0.3, 0.3, 0.1), 0xffd23f, 0, 3.4, -5.7);
  // fountain + statue pedestal (golden statues of Luna, Pi-rat and Snowie stand on top)
  w.add('g', lathe([[0, 0], [4.2, 0], [4.4, 0.6], [4.0, 0.65], [3.9, 0.25], [0, 0.25]], 56, 'atrF'), 0xffffff, 0, 0, -15); w.solid(-4.1, 0, -19.1, 4.1, 0.65, -10.9, { cam: false });
  w.add('e', rcyl(3.9, 0.1, 0.04, 56), 0x7dd3fc, 0, 0.4, -15); w.slab('g', 0xffd6ea, 0, 0.3, -15, 3.4, 1.0, 1.4, 0.2); w.add('g', rbox(3.8, 0.15, 1.8, 0.06), 0xffd23f, 0, 1.3, -15);
  sign3d(w, 'OUR FOUNDERS', 0, 0.62, -14.25, 0, 0.18, 0x7c2d12, null); w.spots.statues = [[-1.1, 1.38, -15], [0, 1.38, -15], [1.1, 1.38, -15]];
  w.zone('water', -3.9, -1, -18.9, 3.9, 0.5, -11.1);
  // lounge seating both sides, coffee tables, rugs
  [-1, 1].forEach((s) => { rug(w, s * 7.5, -6, 0, 6, 4, 0xa78bfa, 0xede9fe); sofa(w, s * 7.5, -8.2, 0, 0x8b5cf6, 0xc4b5fd, 20); sofa(w, s * 10.6, -6, -s * PI / 2, 0xff4fa0, 0xffb6d9, 16);
    tableR(w, s * 7.5, -5.6, 0.75, 0.45, 0xffffff); K.potPlant(w, s * 7.4, 0.45, -5.6, 0.6, 0x4f9dff); plant(w, s * 10.8, -13.4, 1.4); plant(w, s * 10.8, -5.6, 1.2); plant(w, s * 10.8, 8.6, 1.6); plant(w, s * 10.8, -26.6, 1.6); });
  // big lobby screens + art
  bigScreen(w, -11.7, 2.4, -2, PI / 2, 4.8, 2.7, 0x22d3ee); bigScreen(w, 11.7, 2.4, -2, -PI / 2, 4.8, 2.7, 0xff6fcf);
  art(w, 'z', -12, -18, 2.2, 2.6, 2.0, 1, 0); art(w, 'z', 12, -18, 2.2, 2.6, 2.0, -1, 1); art(w, 'z', -12, 4, 2.2, 2.2, 1.8, 1, 2); art(w, 'z', 12, 4, 2.2, 2.2, 1.8, -1, 0);
  clock(w, 'x', -28, -7, 5.2, 1);
  // hanging banners + gear mobile
  [-8, -3, 3, 8].forEach((x, i) => { w.add('x', cyl(8), 0xcbd5e1, x, 6.2, -10, 0, 0, 0, 0.02, 1.8, 0.02); w.add('f', rbox(1.4, 2.6, 0.05, 0.02), BR[i * 2], x, 4.9, -10); w.add('x', gear(8), 0xffffff, x, 5.2, -9.95, 0, 0, 0, 0.35, 0.35, 0.05); });
  for (let i = 0; i < 5; i++) { const a = i * 1.26; w.add('x', cyl(6), 0xcbd5e1, Math.cos(a) * 2, 6.5, -2 + Math.sin(a) * 2, 0, 0, 0, 0.015, 1.5, 0.015); w.add('l', gear(9), BR[i], Math.cos(a) * 2, 6.2, -2 + Math.sin(a) * 2, 0, a, 0, 0.45, 0.45, 0.12, 0.25); }
  // trophy case
  { const T = w.tf(-6, 0, -27.3, 0); T.slab('g', 0x9a6a3e, 0, 0, 0, 4, 0.8, 0.8, 0.05); T.box('e', 0xdff6ff, 0, 0.8, 0, 3.9, 1.8, 0.75, 0.03); T.box('g', 0x9a6a3e, 0, 2.6, 0, 4.1, 0.15, 0.85, 0.04);
    for (let i = 0; i < 5; i++) T.add('x', lathe([[0, 0], [0.18, 0], [0.06, 0.12], [0.05, 0.4], [0.22, 0.55], [0.25, 0.85], [0, 0.85]], 24, 'trophy'), i === 2 ? 0xffd23f : 0xd1d5db, -1.6 + i * 0.8, 0.85, 0); }
  sign3d(w, 'AWARDS', -6, 3.0, -27.2, 0, 0.25, 0x7c2d12, null);
  // glass elevator to the Executive Suite
  { const x = 7.5, z = -25.4; w.add('e', rcyl(1.5, HA - 0.2, 0.1, 40), 0xcfefff, x, 0.05, z); w.add('x', rcyl(1.62, 0.3, 0.06, 40), 0xff4fa0, x, 0, z); w.add('x', rcyl(1.62, 0.3, 0.06, 40), 0xff4fa0, x, HA - 0.3, z);
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; if (Math.abs(Math.sin(a) - 1) > 0.2) w.add('x', cyl(8), 0xe5e7eb, x + Math.cos(a) * 1.55, 0, z + Math.sin(a) * 1.55, 0, 0, 0, 0.05, HA, 0.05); }
    w.add('g', rcyl(1.35, 0.15, 0.05, 32), 0xffd23f, x, 0.02, z); w.slab('g', 0x1f2937, x + 1.9, 0, z + 0.6, 0.3, 1.2, 0.3, 0.05); w.add('l', sph(10), 0x4ade80, x + 1.9, 1.3, z + 0.75, 0, 0, 0, 0.09, 0.09, 0.05, 0.8);
    for (let a = 0; a < 18; a++) { const t = a / 18 * PI * 2; if (Math.sin(t) > 0.55) continue; w.solid(x + Math.cos(t) * 1.5 - 0.3, 0, z + Math.sin(t) * 1.5 - 0.3, x + Math.cos(t) * 1.5 + 0.3, HA, z + Math.sin(t) * 1.5 + 0.3, { cam: false }); }
    sign3d(w, 'EXEC SUITE', x, 3.4, z + 1.8, 0, 0.2, 0xff4fa0, 0xffffff); w.I({ id: 'elevUp', kind: 'elev', x, y: 0, z, r: 1.6, label: '🛗 Ride up to the Executive Suite', to: [0, 20.45, -31], yaw: PI }); }
  // map kiosk + directory
  { const x = -5, z = 5; w.slab('g', 0xffffff, x, 0, z, 0.7, 1.0, 0.5, 0.15); w.add('l', rbox(0.6, 0.45, 0.04, 0.02), 0x38bdf8, x, 1.2, z + 0.1, -0.5, 0, 0, 1, 1, 1, 0.55); w.I({ id: 'map', kind: 'map', x, y: 0, z, r: 1.3, label: '🗺️ Campus map' }); }
  { const T = w.tf(5, 0, 5, 0); T.slab('g', 0xff4fa0, 0, 0, 0, 0.3, 3.2, 0.3, 0.1); ['⬅ LABS & CAFE', 'TEST YARD ⬆', 'DOGS ➡'].forEach((t, i) => sign3d(w, t.replace(/[⬅⬆➡]/g, '').trim(), 5, 2.2 + i * 0.45, 5.17, 0, 0.13, 0xffffff, BR[i])); }
  K.cooler(w, -10.6, 3); K.vending(w, 10.6, 1.5, -PI / 2, 0xff4fa0); K.vending(w, 10.6, 3, -PI / 2, 0x4f9dff);
  gearC(w, 0, 6.65, -2); gearC(w, -10.6, 1.4, -8.2); gearC(w, -6, 2.9, -27.3);
}
// ------------------------------------------------------------------------------------------------ observation deck / test control
function obsDeck(w) {
  // bleachers rise towards the back (south) so everyone can see out the big north windows; centre aisle stays clear
  [-1, 1].forEach((s) => { for (let r = 0; r < 3; r++) w.slab('g', [0x4f9dff, 0xffd23f, 0xff4fa0][r], s * 7.2, 0, -36 + r * 1.3, 7.4, 0.45 + r * 0.45, 1.3, 0.1, { cam: false }); });
  { const T = w.tf(-7, 0, -41.5, 0); T.slab('g', 0x334155, 0, 0, 0, 4, 1.0, 1.2, 0.1); T.box('g', 0x1f2937, 0, 1.0, -0.2, 4, 0.12, 0.8, 0.05, 0);
    for (let i = 0; i < 10; i++) T.add('l', rcyl(0.07, 0.06, 0.02, 12), BR[i % 8], -1.6 + (i % 5) * 0.8, 1.06, 0.1 + ((i / 5) | 0) * 0.25, 0, 0, 0, 1, 1, 1, 0.8);
    T.add('l', rcyl(0.28, 0.12, 0.05, 24), 0xef4444, 1.5, 1.05, -0.3, 0, 0, 0, 1, 1, 1, 0.6); monitor(w, T, -1.2, 1.06, -0.4, 0, 0x22d3ee, 1.4); monitor(w, T, 0.2, 1.06, -0.4, 0, 0x4ade80, 1.4);
    w.I({ id: 'console', kind: 'console', x: -6, y: 0, z: -40.5, r: 1.6, label: '🚀 Test control: start the next test!' }); }
  sign3d(w, 'TEST CONTROL', -7, 3.4, -43.6, 0, 0.3, 0xffffff, 0xef4444);
  [3.5, 7, 10].forEach((x) => { w.slab('g', 0xfacc15, x, 0, -42.8, 0.5, 1.5, 0.3, 0.05); w.add('g', sph(14), 0xfacc15, x, 1.7, -42.8, 0, 0, 0, 0.22, 0.14, 0.22); });
  hazard(w, 0, -43.2, 4, 0.3); K.cooler(w, 10.8, -30); w.add('g', rbox(1.2, 0.8, 0.6, 0.1), 0xff8a3d, 10.6, 0.4, -36); w.solid(10, 0, -36.3, 11.2, 0.8, -35.7);
  for (let i = 0; i < 4; i++) w.add('g', sph(12), 0xfacc15, 10.4 + (i % 2) * 0.4, 0.95, -36.2 + (i >> 1) * 0.3, 0, 0, 0, 0.17, 0.11, 0.17);
  // periscope + safety posters
  w.add('x', cyl(12), 0x64748b, -10.5, 0, -30, 0, 0, 0, 0.12, 2.4, 0.12); w.add('x', rbox(0.5, 0.3, 0.3, 0.08), 0x64748b, -10.5, 2.4, -30);
  poster(w, 'z', -12, -34, 2.6, 1, 0); poster(w, 'z', 12, -34, 2.6, -1, 4); poster(w, 'z', 12, -38, 2.6, -1, 2);
  gearC(w, 9, 1.75, -33.4);
}
// ------------------------------------------------------------------------------------------------ halls

// halls: runner rugs, framed photos between doors, display cases, ceiling banners (shared by both wings)
function hallDecor(w, x0, x1, east) { const m = (x0 + x1) / 2; rug(w, m, -9.5, PI / 2, 2.2, x1 - x0 - 4, east ? 0xff8a3d : 0x8b5cf6, 0xfff1a8);
  const north = east ? [14.5, 27, 30.5, 44] : [-44, -30.5, -27, -14.5], south = east ? [14, 24.5, 28, 42.5] : [-42.5, -28, -24.5, -14];
  north.forEach((x, i) => art(w, 'x', -12, x, 2.4, 1.5, 1.1, 1, (i + (east ? 2 : 0)) % 6)); south.forEach((x, i) => art(w, 'x', -7, x, 2.4, 1.5, 1.1, -1, (i + 3) % 6));
  [m - 3.5, m + 3.5].forEach((x, i) => { const z = -11.55; w.add('m', rbox(1.6, 0.9, 0.7, 0.04), 0x7c4a1e, x, 0.45, z); w.add('e', rbox(1.5, 0.9, 0.6, 0.03), 0xdff6ff, x, 1.35, z); w.solid(x - 0.8, 0, z - 0.4, x + 0.8, 1.8, z + 0.4);
    if (east ^ (i === 1)) { w.add('g', wedge(), 0xffc93c, x - 0.3, 1.0, z, 0, 0.4, 0, 0.35, 0.35, 0.25); w.add('g', rcyl(0.25, 0.2, 0.05, 20), 0xfde047, x + 0.35, 0.9, z); } else { w.add('x', gear(10), 0xffd23f, x - 0.3, 1.2, z, 0, 0, 0, 0.25, 0.25, 0.08); w.add('g', capsule(12), 0xffffff, x + 0.35, 1.2, z, 0, 0, 0, 0.12, 0.2, 0.12); w.add('g', cone(12), 0xff4fa0, x + 0.35, 1.45, z, 0, 0, 0, 0.1, 0.15, 0.1); }
    sign3d(w, i ? 'INVENTIONS' : 'HALL OF CHEESE', x, 0.45, z + 0.37, 0, 0.07, 0xffd23f, null); });
  for (let x = x0 + 3; x < x1 - 2; x += 5) { w.add('x', cyl(6), 0xffffff, x, 4.4, -9.5, 0, 0, 0, 0.01, 0.6, 0.01); w.add('g', rbox(1.0, 0.6, 0.03, 0.02), BR[Math.abs(Math.round(x)) % 8], x, 4.1, -9.5, 0, PI / 2, 0); w.add('l', sph(8), 0xfff4dc, x, 4.42, -9.5, 0, 0, 0, 0.1, 0.05, 0.1, 0.5); } }
function potPlantRow(w, list) { list.forEach(([x, z], i) => K.potPlant(w, x, 0, z, 1.7, BR[(i * 3) % 8])); }
function hallW(w) {
  hallDecor(w, -46, -12, false);
  [-44, -27, -14].forEach((x, i) => { plant(w, x, -11.2, 1.1); }); K.cooler(w, -30.5, -7.7); bench(w, -27, -7.75, PI, 0x60a5fa);
  poster(w, 'x', -12, -44, 2.6, 1, 1); poster(w, 'x', -12, -29.5, 2.6, 1, 0); poster(w, 'x', -7, -27, 2.6, -1, 3); poster(w, 'x', -7, -41.5, 2.6, -1, 2); poster(w, 'x', -12, -14.5, 2.6, 1, 4);
  // sandy footprints (mystery clue): big, round, slow - leading towards the Gadget Lab
  for (let i = 0; i < 9; i++) { const x = -15 - i * 2.1, z = -9.5 + (i % 2 ? 0.45 : -0.45); w.add('m', sph(12), 0xd9b77a, x, 0.01, z, 0, 0, 0, 0.32, 0.03, 0.28); for (let k = 0; k < 3; k++) w.add('m', sph(8), 0xd9b77a, x - 0.25, 0.01, z - 0.18 + k * 0.18, 0, 0, 0, 0.08, 0.02, 0.07); }
  w.I({ id: 'clue_prints', kind: 'clue', x: -24, y: 0, z: -9.5, r: 1.8, label: '🔍 Look at the sandy footprints' });
  sign3d(w, 'WEST WING', -13.6, 3.5, -9.5, PI / 2, 0.22, 0xffffff, 0xa66bff);
  gearC(w, -44, 0.5, -9.5);
}
function hallE(w) {
  hallDecor(w, 12, 46, true);
  [16, 30, 44].forEach((x) => plant(w, x, -11.2, 1.1)); K.vending(w, 27.5, -7.7, PI, 0x22c55e); bench(w, 42.5, -7.75, PI, 0xff8a3d);
  poster(w, 'x', -12, 14.5, 2.6, 1, 2); poster(w, 'x', -12, 28, 2.6, 1, 1); poster(w, 'x', -7, 30.5, 2.6, -1, 3); poster(w, 'x', -12, 44, 2.6, 1, 0);
  // paw prints leading to the dog department
  for (let i = 0; i < 6; i++) { const x = 33 + i * 2.2, z = -9.5 + (i % 2 ? 0.35 : -0.35); w.add('g', sph(10), 0xc4a484, x, 0.01, z, 0, 0, 0, 0.16, 0.02, 0.14); for (let k = 0; k < 4; k++) w.add('g', sph(8), 0xc4a484, x + 0.18, 0.01, z - 0.15 + k * 0.1, 0, 0, 0, 0.05, 0.02, 0.045); }
  sign3d(w, 'EAST WING', 13.6, 3.5, -9.5, -PI / 2, 0.22, 0xffffff, 0x2dd4bf);
  sign3d(w, 'RUFFSOURCES', 45.7, 4.4, -9.5, -PI / 2, 0.22, 0xffffff, 0xff8a3d);
  gearC(w, 27.5, 2.6, -7.9);
}
// ------------------------------------------------------------------------------------------------ gadget lab
function gadgetLab(w) {
  const H = K.scaled; PR.workbench(H(w, -41, 0, -26.8, 0.2), 0, 0, 0, 22, 4.8, 6); PR.workbench(H(w, -34, 0, -26.8, 0.2), 0, 0, 0, 18, 4.8, 6);
  PR.pegboard(H(w, 0, 0, 0, 0.2), 'x', -27.75 / 0.2, -41 / 0.2, 1.4 / 0.2, 20, 8, 1); PR.pegboard(H(w, 0, 0, 0, 0.2), 'x', -27.75 / 0.2, -34 / 0.2, 1.4 / 0.2, 16, 8, 1);
  PR.toolbox(H(w, -31, 0, -26.4, 0.2), 0, 0, 0, 0xdc2626); PR.paintCan(H(w, 0, 0, 0, 0.2), -36 / 0.2, 0.96 / 0.2, -26.6 / 0.2); PR.wrench(H(w, 0, 0, 0, 0.2), -42 / 0.2, 0.97 / 0.2, -26.6 / 0.2, 0.4);
  // Pi-rat's tinker corner: ship wheel, treasure chest, blueprint table (mystery clue)
  { const x = -44.3, z = -15.5; w.add('m', torus(0.08, 28), 0x8b5a2b, -45.6, 2.2, z, 0, PI / 2, 0, 0.8, 0.8, 0.8); for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; w.add('m', cyl(8), 0x8b5a2b, -45.6, 2.2, z, a, 0, 0, 0.04, 1.05, 0.04); }
    w.add('g', rcyl(0.14, 0.12, 0.03, 16), 0xffd23f, -45.55, 2.2, z, 0, 0, PI / 2);
    PR.trunk(H(w, x + 1.2, 0, -13.1, 0.12), 0, 0, 0, 0x7c2d12); w.add('x', sph(10), 0xffd23f, x + 1.2, 0.62, -13.1, 0, 0, 0, 0.25, 0.08, 0.15);
    const T = w.tf(-41.5, 0, -15.5, PI / 2); T.slab('m', 0x9a6a3e, 0, 0, 0, 2.4, 0.9, 1.4, 0.05); T.box('m', 0x3b82f6, 0, 0.9, 0, 2.0, 0.02, 1.2, 0.01); T.box('l', 0xffffff, -0.4, 0.92, 0, 0.8, 0.005, 0.02, 0.002, 0.3); T.box('l', 0xffffff, 0.3, 0.92, 0.2, 0.02, 0.005, 0.6, 0.002, 0.3);
    T.add('l', torus(0.06, 30), 0xffffff, 0.4, 0.925, -0.2, PI / 2, 0, 0, 0.25, 0.25, 0.05, 0.3);
    w.I({ id: 'clue_blueprint', kind: 'clue', x: -41.5, y: 0, z: -15.5, r: 1.8, label: '🔍 Read the rolled-up blueprint' }); }
  // gadget showcase pedestals: glider, jetpack, grapple, cheese blaster
  [['glider', -44, -21], ['jet', -44, -24], ['hook', -38, -21.5], ['blast', -38, -24]].forEach(([k, x, z]) => { w.add('g', rcyl(0.55, 0.9, 0.08, 28), 0xffffff, x, 0, z); w.add('l', rcyl(0.56, 0.06, 0.03, 28), 0x3ff0ff, x, 0.9, z, 0, 0, 0, 1, 1, 1, 0.5); w.solid(x - 0.55, 0, z - 0.55, x + 0.55, 0.96, z + 0.55);
    const y = 1.2; if (k === 'glider') { [-1, 1].forEach((s) => w.add('g', leaf(), 0xff4fa0, x + s * 0.1, y, z, 0, 0, -s * 1.3, 0.5, 0.6, 0.05)); }
    else if (k === 'jet') { [-1, 1].forEach((s) => { w.add('x', capsule(14), 0xcbd5e1, x + s * 0.18, y + 0.1, z, 0, 0, 0, 0.2, 0.42, 0.2); w.add('l', cone(10), 0xff8a3d, x + s * 0.18, y - 0.35, z, PI, 0, 0, 0.1, 0.25, 0.1, 0.6); }); }
    else if (k === 'hook') { w.add('x', capsule(12), 0x64748b, x, y, z, 0, 0, PI / 2, 0.14, 0.4, 0.14); w.add('l', torus(0.2, 20), 0x3ff0ff, x + 0.4, y, z, 0, PI / 2, 0, 0.2, 0.2, 0.2, 0.6); }
    else { w.add('g', capsule(12), 0xffd23f, x, y, z, 0, 0, PI / 2, 0.16, 0.45, 0.16); w.add('g', rcyl(0.12, 0.3, 0.04, 16), 0xff4fa0, x - 0.1, y - 0.3, z); } });
  sign3d(w, 'GADGET LAB', -37.5, 3.7, -27.7, 0, 0.32, 0xffffff, 0x4f9dff);
  // target range (hands-on): targets mount on the west wall, station on the floor
  for (let i = 0; i < 5; i++) { const z = -26 + i * 2.6; w.add('m', rbox(0.25, 1.6, 1.2, 0.06), 0x9a6a3e, -45.6, 0.8, z); } hazard(w, -40, -19, 0.1, 0.1);
  w.spots.targets = [0, 1, 2, 3, 4].map((i) => [-45.3, 1.3 + (i % 2) * 0.5, -26 + i * 2.6]);
  { const x = -40.5, z = -19.2; w.slab('g', 0x1f2937, x, 0, z, 0.8, 1.0, 0.5, 0.1); w.add('l', rcyl(0.18, 0.08, 0.03, 18), 0xef4444, x, 1.0, z, 0, 0, 0, 1, 1, 1, 0.7); w.add('g', rbox(3.5, 0.03, 0.12, 0.01), 0xfacc15, x - 0.5, 0.01, z - 0.3);
    w.I({ id: 'range', kind: 'station', x, y: 0, z, r: 1.5, label: '🎯 Gadget test: blast the targets!' }); }
  // spring pad up to the high storage shelf (gear on top)
  w.add('g', rcyl(0.7, 0.25, 0.08, 28), 0x22c55e, -31, 0, -14); w.add('l', rcyl(0.6, 0.06, 0.03, 28), 0xbef264, -31, 0.25, -14, 0, 0, 0, 1, 1, 1, 0.6); w.solid(-31.7, 0, -14.7, -30.3, 0.3, -13.3, { bounce: 16.5 });
  w.slab('m', 0x64748b, -30.2, 3.6, -17.5, 1.6, 0.15, 5.5, 0.04); [-1, 1].forEach((s) => w.add('x', cyl(8), 0x94a3b8, -30.2, 0, -17.5 + s * 2.6, 0, 0, 0, 0.05, 3.7, 0.05));
  for (let i = 0; i < 3; i++) K.crate(w, -30.2, 3.75, -19.3 + i * 1.2, 0.55); gearC(w, -30.2, 4.4, -15.5);
  K.stool(w, -40, -25.4); K.stool(w, -33, -25.4, 0x4f9dff); for (let i = 0; i < 4; i++) K.crate(w, -34.2 + (i % 2) * 1.05, (i >> 1) * 1.0, -13.3, 1, i % 2 ? 0xd8a15a : 0xc58b52);
  K.parcel(w, -36, 0, -15, 1); K.parcel(w, -35.4, 0, -14.4, 0.8); poster(w, 'z', -46, -18, 2.6, 1, 0);

  // ---- dense prototype clutter: robot assembly stand with a welding arm + sparks, wind-up test treadmill, rocket-boot rig,
  //      hanging drone prototype, blueprint wall, tool cart, gadget shelves, crates
  { const x = -34, z = -21.2; w.add('x', rcyl(1.1, 0.25, 0.06, 32), 0x475569, x, 0, z); w.add('l', torus(0.04, 40), 0xffd23f, x, 0.26, z, PI / 2, 0, 0, 1.08, 1.08, 1, 0.6); w.solid(x - 1.1, 0, z - 1.1, x + 1.1, 0.25, z + 1.1);
    w.add('g', capsule(18), 0xe2e8f0, x, 1.0, z, 0, 0, 0, 0.75, 0.5, 0.6); w.add('g', rbox(0.6, 0.45, 0.5, 0.12), 0xe2e8f0, x, 1.85, z); w.add('l', rbox(0.42, 0.18, 0.02, 0.05), 0x3ff0ff, x, 1.88, z + 0.26, 0, 0, 0, 1, 1, 1, 0.8);
    w.add('x', cyl(10), 0x94a3b8, x - 0.48, 1.1, z, 0, 0, 0.5, 0.08, 0.6, 0.08); w.add('x', sph(12), 0xff4fa0, x - 0.75, 0.85, z, 0, 0, 0, 0.12); w.add('x', cyl(8), 0x64748b, x, 0.35, z, 0, 0, 0, 0.12, 0.4, 0.12);
    w.add('x', cyl(8), 0x334155, x + 0.3, 2.2, z, 0, 0, 0, 0.012, 0.25, 0.012); w.add('l', sph(8), 0xff4fa0, x + 0.3, 2.35, z, 0, 0, 0, 0.05, 0.05, 0.05, 0.9);
    K.robotArm(w, x + 1.9, z - 0.4, 0xff8a3d); w.add('l', sph(10), 0xfff36b, x + 0.42, 1.25, z + 0.05, 0, 0, 0, 0.07, 0.07, 0.07, 1);
    for (let i = 0; i < 7; i++) { const a = i * 0.9; w.add('l', cyl(4), 0xffd23f, x + 0.42 + Math.cos(a) * 0.15, 1.25 + Math.sin(a * 1.3) * 0.12, z + 0.05 + Math.sin(a) * 0.15, a, 0, a * 0.7, 0.008, 0.2, 0.008, 1); }
    hazard(w, x, z + 1.5, 2.6, 0.1); sign3d(w, 'ROBO-HELPER v0.3', x, 0.06, z + 1.85, 0, 0.0001, 0xffffff, null); w.spots.sparks = [x + 0.42, 1.25, z + 0.05]; }
  { K.conveyor(w, -35, -16.4, 0, 4.2); for (let i = 0; i < 3; i++) { const x = -36.4 + i * 1.4, z = -16.4; w.add('g', rbox(0.4, 0.4, 0.35, 0.1), BR[i + 2], x, 1.0, z); w.add('l', sph(8), 0x3ff0ff, x, 1.12, z + 0.18, 0, 0, 0, 0.05, 0.05, 0.03, 0.8); w.add('x', torus(0.3, 12), 0x94a3b8, x, 1.3, z, 0, 0, 0, 0.12); }
    sign3d(w, 'WIND-UP TEST', -35, 1.85, -17.2, 0, 0.12, 0xffffff, 0x4f9dff); }
  { const x = -31, z = -24.6; w.add('x', rbox(1.4, 0.15, 1.4, 0.04), 0x334155, x, 0.08, z); [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => w.add('x', cyl(8), 0x94a3b8, x + sx * 0.6, 1.2, z + sz * 0.6, 0, 0, 0, 0.04, 2.3, 0.04))); w.add('x', rbox(1.4, 0.1, 1.4, 0.04), 0x334155, x, 2.35, z);
    [-1, 1].forEach((sd) => { w.add('g', capsule(12), 0xef4444, x + sd * 0.2, 0.9, z, 0, 0, 0, 0.26, 0.35, 0.36); w.add('g', rbox(0.3, 0.12, 0.5, 0.05), 0x1f2937, x + sd * 0.2, 0.5, z + 0.08); w.add('l', cone(10), 0xff8a3d, x + sd * 0.2, 0.32, z - 0.1, PI, 0, 0, 0.1, 0.25, 0.1, 0.8); });
    w.solid(x - 0.7, 0, z - 0.7, x + 0.7, 2.4, z + 0.7); sign3d(w, 'ROCKET BOOTS', x, 2.6, z, -PI / 2, 0.12, 0xffffff, 0xef4444); }
  { const x = -37.5, z = -20.5, y = 4.2; w.add('x', cyl(6), 0x334155, x, y + 0.4, z, 0, 0, 0, 0.012, 0.8, 0.012); w.add('g', rbox(0.7, 0.18, 0.7, 0.08), 0xff4fa0, x, y, z); w.add('l', sph(8), 0x4ade80, x, y - 0.1, z + 0.35, 0, 0, 0, 0.05, 0.05, 0.05, 0.9);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { w.add('x', cyl(8), 0x94a3b8, x + a * 0.45, y + 0.05, z + b * 0.45, 0, 0, 0, 0.03, 0.12, 0.03); w.add('e', rcyl(0.3, 0.015, 0.006, 20), 0xbae6fd, x + a * 0.45, y + 0.13, z + b * 0.45); }); }
  [['JETPACK MK II', -44, 0x2563eb], ['AUTO-CHEESE GRATER', -31.6, 0x1d4ed8]].forEach(([t, x, c], i) => { const T = w.tf(x, 2.7, -12.32, PI); T.box('m', c, 0, 0, 0, 2.6, 1.7, 0.05, 0.02);
    for (let k = 0; k < 5; k++) T.box('l', 0xffffff, -0.9 + k * 0.45, -0.3 + (k % 2) * 0.3, 0.03, 0.3, 0.02, 0.01, 0.004, 0.35); T.add('l', torus(0.05, 28), 0xffffff, 0.5, 0.1, 0.03, 0, 0, 0, 0.3, 0.3, 0.1, 0.35); T.box('l', 0xffffff, -0.4, 0.35, 0.03, 0.9, 0.02, 0.01, 0.004, 0.35);
    const p2 = T.P(0, 0.62, 0.05); sign3d(w, t, p2[0], p2[1], p2[2], PI, 0.08, 0xffffff, null); });
  { const T = w.tf(-41.8, 0, -13.4, 0); T.box('x', 0xef4444, 0, 0.75, 0, 1.2, 0.08, 0.6, 0.03); T.box('x', 0xef4444, 0, 0.3, 0, 1.2, 0.06, 0.6, 0.03); [-1, 1].forEach((a) => [-1, 1].forEach((b) => T.add('x', cyl(8), 0x94a3b8, a * 0.55, 0.4, b * 0.25, 0, 0, 0, 0.025, 0.75, 0.025)));
    for (let i = 0; i < 4; i++) { T.add('x', cyl(8), [0xfacc15, 0x22c55e, 0x3b82f6, 0xff4fa0][i], -0.4 + i * 0.25, 0.86, 0.1, PI / 2, 0, 0, 0.025, 0.28, 0.025); T.add('x', cyl(6), 0xcbd5e1, -0.4 + i * 0.25, 0.86, -0.12, PI / 2, 0, 0, 0.008, 0.15, 0.008); }
    T.add('x', rbox(0.3, 0.08, 0.1, 0.02), 0x64748b, 0.3, 0.84, -0.15); T.add('m', cyl(8), 0x8b5a2b, 0.35, 0.84, 0.1, 0, 0, PI / 2, 0.025, 0.3, 0.025); T.solid(-0.6, 0, -0.3, 0.6, 0.8, 0.3, { cam: false }); }
  shelf(w, -29.55, -26.2, -PI / 2, 2.6, 2.6, 0.6, 0x475569);
  for (let i = 0; i < 6; i++) { const z = -27.1 + (i % 3) * 0.85, y = 0.35 + ((i / 3) | 0) * 1.1; w.add('g', rbox(0.45, 0.4, 0.55, 0.06), BR[i], -29.75, y + 0.2, z); w.add('l', sph(6), 0x3ff0ff, -29.98, y + 0.25, z, 0, 0, 0, 0.03, 0.03, 0.03, 0.8); }
  for (let i = 0; i < 3; i++) K.crate(w, -45.2, i === 2 ? 1.0 : 0, -13.2 - (i % 2) * 1.05, 1, 0xd8a15a);
  sign3d(w, 'FRAGILE: GADGETS', -45.2, 0.5, -12.6, PI, 0.08, 0x7c2d12, null);
  // vent grille into the Goo Lab (secret crawl-through)
  [-28.7, -29.3].forEach((x) => { w.add('x', rbox(0.06, 0.8, 1.2, 0.02), 0x94a3b8, x, 0.4, -20.5, 0, 0, 0, 1, 1, 1); });
  w.secrets.push({ id: 'vent', x: -29, y: 0, z: -20.5, r: 0.9, msg: '🐀 Secret: the lab vent shortcut!' }); gearC(w, -29, 0.45, -20.5);
}
// ------------------------------------------------------------------------------------------------ goo lab
function gooLab(w) {
  [[-25.5, 0xff4fa0], [-21.5, 0x4f9dff], [-17.5, 0x4ade80]].forEach(([x, c]) => vat(w, x, -26.4, c, 0.85, 2.4)); w.spots.vats = [[-25.5, -26.4, 0xff4fa0], [-21.5, -26.4, 0x4f9dff], [-17.5, -26.4, 0x4ade80]];
  pipes(w, 'x', -27.6, -28.8, -12.3, 4.6, [0xff4fa0, 0x4f9dff, 0x4ade80]);
  labBench(w, -25, -19.5, 0, 4); labBench(w, -25, -15.5, 0, 4, { door: 0xf9a8d4 }); K.stool(w, -26, -18.4); K.stool(w, -24, -18.4, 0x4f9dff); K.stool(w, -25, -14.4, 0x4ade80);
  // the big mixing cauldron (hands-on station)
  { const x = -17, z = -21; w.add('x', lathe([[0, 0], [0.9, 0], [1.25, 0.5], [1.3, 1.0], [1.2, 1.15], [1.34, 1.2], [0, 1.2]], 40, 'cauldron'), 0x475569, x, 0, z); w.add('l', rcyl(1.15, 0.1, 0.05, 36), 0xc084fc, x, 1.05, z, 0, 0, 0, 1, 1, 1, 0.5);
    w.solid(x - 1.25, 0, z - 1.25, x + 1.25, 1.2, z + 1.25); [0xff4fa0, 0x4f9dff, 0x4ade80].forEach((c, i) => { const bx = x - 1.0 + i * 1.0; w.slab('g', 0xffffff, bx, 0, z + 2.0, 0.6, 0.9, 0.5, 0.08); beaker(w, bx, 0.9, z + 2.0, c, 1.4, 1); });
    w.spots.cauldron = [x, 1.1, z]; w.I({ id: 'goo', kind: 'station', x, y: 0, z: z + 1.6, r: 1.8, label: '🧪 Mix some goo!' }); }
  // recipe whiteboard (it is a clue for the cauldron)
  whiteboard(w, 'z', -12, -21, 1.2, 3.4, -1); { const T = w.tf(-12.33, 2.35, -21, -PI / 2); }
  sign3d(w, 'BOUNCY GOO', -12.36, 2.55, -21, -PI / 2, 0.16, 0xff4fa0, null); sign3d(w, 'PINK BLUE PINK', -12.36, 2.15, -21, -PI / 2, 0.13, 0x1f2937, null); sign3d(w, 'DO NOT DRINK', -12.36, 1.75, -21, -PI / 2, 0.11, 0xef4444, null);
  // bouncy goo blob trampoline + slippery puddles
  w.add('l', blobGeo(7, 0.12, 3), 0xbef264, -14.5, 0.2, -14.5, 0, 0, 0, 1.3, 0.4, 1.3, 0.3); w.solid(-15.6, 0, -15.6, -13.4, 0.45, -13.4, { bounce: 15 });
  [[-21, -14.5, 0x4f9dff], [-14.5, -25, 0xff4fa0]].forEach(([x, z, c]) => { w.add('l', blobGeo(((x * 3) | 0) & 63, 0.15, 2), c, x, 0.02, z, 0, 0, 0, 1.2, 0.03, 0.9, 0.25); w.zone('slip', x - 1.1, -0.5, z - 0.8, x + 1.1, 1, z + 0.8); });
  // safety shower + eyewash + hazard tape
  w.add('x', cyl(10), 0x22c55e, -28.3, 0, -13, 0, 0, 0, 0.06, 3.2, 0.06); w.add('x', lathe([[0, 0], [0.4, 0.15], [0.42, 0.2], [0, 0.1]], 20, 'shower'), 0x22c55e, -27.9, 3.0, -13, PI, 0, 0); w.add('x', cyl(8), 0x22c55e, -28.3, 3.15, -13, 0, 0, PI / 2, 0.05, 0.5, 0.05);
  hazard(w, -17, -21, 3.6, 3.6); sign3d(w, 'GOO LAB', -20.5, 3.8, -27.7, 0, 0.32, 0xffffff, 0x22c55e); poster(w, 'x', -12, -26, 2.6, -1, 3);
  gearC(w, -14.5, 3.2, -14.5); gearC(w, -21.5, 3.6, -26.4);
}
// ------------------------------------------------------------------------------------------------ cafeteria + pantry
function cafe(w) {
  // serving counter along the east wall, cook behind it
  { const T = w.tf(-27.3, 0, -1, PI / 2); T.slab('g', 0xff8a3d, 0, 0, 0, 9, 1.0, 0.8, 0.08); T.box('g', 0xfff7ed, 0, 1.0, 0, 9.1, 0.08, 0.95, 0.03); T.box('e', 0xdff6ff, 0, 1.08, 0.1, 8.6, 0.5, 0.04, 0.02);
    for (let i = 0; i < 6; i++) { const p = T.P(-3.6 + i * 1.45, 1.08, -0.1); w.add('x', rbox(1.1, 0.12, 0.6, 0.04), 0xcbd5e1, p[0], p[1] + 0.06, p[2], 0, PI / 2, 0); w.add('g', i % 2 ? wedge() : rcyl(0.25, 0.18, 0.05, 20), [0xffc93c, 0xf59e0b, 0xfde047][i % 3], p[0] - 0.1, p[1] + 0.13, p[2] - 0.2, 0, PI / 2, 0, i % 2 ? 0.45 : 1, i % 2 ? 0.45 : 1, i % 2 ? 0.25 : 1); } }
  PR.stove(K.scaled(w, -25.9, 0, 3.5, 0.2), 0, 0, -PI / 2, 4.6); PR.fridge(K.scaled(w, -25.9, 0, 6.5, 0.18), 0, 0, -PI / 2, 12, 0xfde68a);
  sign3d(w, 'CHEESE CAFE', -25.3, 3.6, -1, -PI / 2, 0.36, 0xffffff, 0xff8a3d); sign3d(w, 'TODAYS SPECIAL: CHEESE', -25.3, 2.9, -1, -PI / 2, 0.14, 0x7c2d12, 0xfff7ed);
  // fondue fountain
  { const x = -33, z = -1; for (let i = 0; i < 4; i++) w.add('g', rcyl(1.1 - i * 0.22, 0.25, 0.08, 32), i % 2 ? 0xffd23f : 0xf59e0b, x, 0.8 + i * 0.32, z); w.add('g', rcyl(1.4, 0.8, 0.1, 32), 0xffffff, x, 0, z); w.solid(x - 1.4, 0, z - 1.4, x + 1.4, 1.2, z + 1.4); w.spots.fondue = [x, 2.2, z]; }
  // tables + stools + trays
  [[-38, -4], [-30, 4.5], [-34.5, 7], [-29.5, -4.5], [-38.5, 0.5], [-34.5, 3.2]].forEach(([x, z], i) => { K.tableR(w, x, z, 0.85, 0.85, 0xffffff); for (let k = 0; k < 4; k++) { const a = k * PI / 2 + 0.4; K.stool(w, x + Math.cos(a) * 1.3, z + Math.sin(a) * 1.3, BR[(i + k) % 8]); } if (i % 2) K.tray(w, x, 0.86, z, i); });
  K.vending(w, -45.3, -5.5, PI / 2, 0xffd23f); K.vending(w, -45.3, -3.8, PI / 2, 0xff4fa0); plant(w, -45, 0.5, 1.2);
  art(w, 'x', -7, -42, 2.6, 2.2, 1.6, 1, 1); art(w, 'x', -7, -29, 2.6, 2.2, 1.6, 1, 0); clock(w, 'z', -46, -1.5, 3.6, 1);
  // pantry (blue keycard door at x=-40)
  w.kdoors.push({ id: 'pantry', key: 'blue', axis: 'z', at: -40, a: 4.4, b: 6.8, h: 2.9, col: 0x3b82f6 });
  for (let i = 0; i < 2; i++) { const T = w.tf(-45.4, 0, 4 + i * 3, PI / 2); T.slab('m', 0x9a6a3e, 0, 0, 0, 2.6, 0.1, 0.8, 0.02); for (let k = 1; k < 4; k++) { T.box('m', 0xb98a5a, 0, k * 0.85, 0, 2.6, 0.08, 0.8, 0.02); for (let j = 0; j < 3; j++) T.add('g', rcyl(0.3, 0.3, 0.08, 24), [0xffc93c, 0xfde047, 0xf59e0b][(j + k) % 3], -0.8 + j * 0.8, k * 0.85 + 0.08, 0); }
    [-1.25, 1.25].forEach((s) => T.box('m', 0x7c4a1e, s, 0, 0, 0.1, 3.4, 0.8, 0.02)); w.solid(-45.8, 0, 2.7 + i * 3, -45, 3.4, 5.3 + i * 3); }
  for (let i = 0; i < 3; i++) K.parcel(w, -43.5 + i * 0.4, i * 0.0, 9.2 - i * 0.6, 1.1);
  // Sweepy's secret nest: a crumb-pile pillow
  w.add('f', blobGeo(5, 0.15, 2), 0xfbcfe8, -42.6, 0.15, 3.6, 0, 0, 0, 1.0, 0.25, 0.8); for (let i = 0; i < 12; i++) w.add('g', sph(6), 0xf5c46b, -42.6 + (R() - 0.5) * 1.6, 0.05, 3.6 + (R() - 0.5) * 1.2, 0, 0, 0, 0.07, 0.05, 0.06);
  w.spots.nest = [-42.6, 0.3, 3.6]; gearC(w, -45.4, 2.75, 7);

  // ---- extra café clutter: salad bar island, cheese display fridge, dessert cart, counter stools, condiments, pendant lamps, bunting
  { const T = w.tf(-43, 0, -1, PI / 2); T.slab('g', 0x22c55e, 0, 0, 0, 3.6, 0.95, 1.1, 0.08); T.box('g', 0xfff7ed, 0, 0.95, 0, 3.7, 0.07, 1.2, 0.03); T.box('e', 0xdff6ff, 0, 1.45, 0, 3.4, 0.04, 1.0, 0.02);
    for (let i = 0; i < 4; i++) { const p = T.P(-1.3 + i * 0.86, 1.0, 0); w.add('x', rbox(0.7, 0.14, 0.8, 0.04), 0xe2e8f0, p[0], p[1] + 0.07, p[2]); for (let k = 0; k < 6; k++) w.add('g', sph(8), [0x4ade80, 0xef4444, 0xfacc15, 0xf97316][i], p[0] + (R() - 0.5) * 0.5, p[1] + 0.18, p[2] + (R() - 0.5) * 0.5, 0, 0, 0, 0.08, 0.06, 0.08); }
    [-1.75, 1.75].forEach((x) => T.box('x', 0x94a3b8, x, 0.95, 0, 0.05, 0.5, 0.05, 0.01)); sign3d(w, 'SALAD BAR', -43, 2.1, -1, PI / 2, 0.16, 0xffffff, 0x16a34a); }
  { const T = w.tf(-35.5, 0, 9.35, PI); T.slab('g', 0xf8fafc, 0, 0, 0, 3.2, 2.3, 0.8, 0.08); T.box('e', 0xcfefff, 0, 1.25, 0.41, 2.9, 1.8, 0.04, 0.02); for (let j = 0; j < 3; j++) { T.box('x', 0xcbd5e1, 0, 0.55 + j * 0.6, 0, 2.9, 0.04, 0.7, 0.01); for (let i = 0; i < 4; i++) T.add(i % 2 ? 'g' : 'g', i % 2 ? wedge() : rcyl(0.22, 0.2, 0.05, 18), [0xffc93c, 0xfde047, 0xf59e0b, 0xfff1a8][(i + j) % 4], -1.05 + i * 0.7, 0.6 + j * 0.6, 0, 0, 0, 0, i % 2 ? 0.3 : 1, i % 2 ? 0.3 : 1, i % 2 ? 0.2 : 1); }
    T.box('l', 0xbae6fd, 0, 2.2, 0.3, 2.6, 0.05, 0.1, 0.01, 0.7); sign3d(w, 'FRESH CHEESE', -35.5, 2.55, 9.0, PI, 0.13, 0x7c2d12, 0xfde047); }
  { const x = -31.3, z = 8.5; w.add('g', rbox(1.4, 0.08, 0.8, 0.03), 0xff6fcf, x, 0.9, z); w.add('g', rbox(1.4, 0.08, 0.8, 0.03), 0xff6fcf, x, 0.45, z); [-1, 1].forEach((a) => [-1, 1].forEach((b) => w.add('x', cyl(8), 0x94a3b8, x + a * 0.62, 0.05, z + b * 0.32, 0, 0, 0, 0.03, 0.9, 0.03))); [-1, 1].forEach((a) => w.add('x', torus(0.25, 16), 0x334155, x + a * 0.62, 0.12, z, 0, PI / 2, 0, 0.12)); w.solid(x - 0.75, 0, z - 0.45, x + 0.75, 1.0, z + 0.45);
    for (let i = 0; i < 3; i++) { w.add('g', rcyl(0.2, 0.18, 0.06, 18), [0xff4fa0, 0x8b5cf6, 0xfde047][i], x - 0.45 + i * 0.45, 0.95, z); w.add('g', sph(10), 0xffffff, x - 0.45 + i * 0.45, 1.17, z, 0, 0, 0, 0.12, 0.06, 0.12); w.add('g', sph(8), 0xef4444, x - 0.45 + i * 0.45, 1.24, z, 0, 0, 0, 0.04); } }
  [-2, -0.5, 1, 2.5].forEach((z) => K.stool(w, -28.45, z, [0xff4fa0, 0x4f9dff, 0x3ddc84, 0xffc93c][Math.round(z + 2) % 4]));
  [[-38, -4], [-30, 4.5], [-34.5, 7], [-29.5, -4.5], [-38.5, 0.5], [-34.5, 3.2]].forEach(([x, z], i) => { w.add('g', cyl(10), 0xef4444, x + 0.15, 0.82, z, 0, 0, 0, 0.05, 0.2, 0.05); w.add('g', cyl(10), 0xfacc15, x - 0.05, 0.82, z + 0.1, 0, 0, 0, 0.05, 0.2, 0.05); w.add('g', rbox(0.18, 0.14, 0.1, 0.02), 0xffffff, x - 0.2, 0.89, z - 0.1);
    w.add('x', cyl(6), 0x334155, x, 3.6, z, 0, 0, 0, 0.012, 1.4, 0.012); w.add('g', lathe([[0.04, 0], [0.36, -0.28], [0.38, -0.32], [0, -0.32]], 24, 'pendant'), BR[i], x, 3.6, z); w.add('l', sph(10), 0xfff4dc, x, 3.3, z, 0, 0, 0, 0.12, 0.08, 0.12, 0.8); });
  { const pts = [[-45.5, 4.6, -6.5], [-36, 4.1, -2], [-26, 4.6, 2]]; w.add('x', tube(pts, 0.015, 30, 4), 0xffffff, 0, 0, 0); const pts2 = [[-45.5, 4.6, 2], [-36, 4.1, 5], [-26, 4.6, 8.5]]; w.add('x', tube(pts2, 0.015, 30, 4), 0xffffff, 0, 0, 0);
    [pts, pts2].forEach((P3) => { for (let i = 0; i < 14; i++) { const t = i / 13, a = t < 0.5 ? t * 2 : (t - 0.5) * 2, A0 = t < 0.5 ? P3[0] : P3[1], B0 = t < 0.5 ? P3[1] : P3[2]; const x = A0[0] + (B0[0] - A0[0]) * a, z = A0[2] + (B0[2] - A0[2]) * a, y = A0[1] + (B0[1] - A0[1]) * a - Math.sin(a * PI) * 0.15; w.add('g', cone(3), BR[i % 8], x, y - 0.32, z, PI, Math.atan2(B0[0] - A0[0], B0[2] - A0[2]) + PI / 2, 0, 0.2, 0.32, 0.03); } }); }
  potPlantRow(w, [[-45.4, -6.4], [-26, 9.3], [-40.6, 9.3]]);
}
// ------------------------------------------------------------------------------------------------ offices + secret disco closet
function offices(w) {
  // ---- extra office clutter: aisle runner, bookshelf, printer, plants, posters, snack table, boxes, wall clocks, desk lamps
  rug(w, -18.5, -1, 0, 2.2, 9, 0x334155, 0xa5b4fc); shelf(w, -12.6, -4.5, -PI / 2, 2.6, 2.6); shelf(w, -24.6, -4.2, PI / 2, 2.0, 2.2, 0.5, 0x7c4a1e);
  { const T = w.tf(-13, 0, 1.0, -PI / 2); T.slab('g', 0xf1f5f9, 0, 0, 0, 1.4, 0.95, 0.8, 0.06); T.box('g', 0x64748b, 0, 0.95, 0, 1.3, 0.25, 0.7, 0.04); T.box('m', 0xffffff, 0, 1.24, 0.1, 0.6, 0.02, 0.4, 0.005); T.box('l', 0x4ade80, 0.5, 1.05, 0.36, 0.08, 0.04, 0.02, 0.01, 0.8); }
  { const x = -21.8, z = 8.4; K.tableR(w, x, z, 0.6, 0.9, 0xfff7ed); for (let i = 0; i < 5; i++) w.add('g', i % 2 ? sph(10) : rcyl(0.12, 0.1, 0.03, 14), BR[i], x - 0.3 + (i % 3) * 0.3, 0.98, z - 0.15 + (i > 2 ? 0.3 : 0), 0, 0, 0, i % 2 ? 0.1 : 1); w.add('g', cyl(12), 0x92400e, x + 0.35, 0.92, z + 0.25, 0, 0, 0, 0.12, 0.3, 0.12); }
  for (let i = 0; i < 4; i++) K.parcel(w, -24.2 + (i % 2) * 0.6, (i >> 1) * 0.55, 1.4 + (i % 2) * 0.1, 1.0);
  potPlantRow(w, [[-24.4, 9.3], [-12.7, 4.6], [-24.2, -6.3], [-12.8, -6.3]]); poster(w, 'x', -7, -23.4, 2.6, 1, 2); poster(w, 'x', -7, -13.4, 2.6, 1, 0);
  [[-22.6, -1.6], [-22.6, 2.8], [-14.4, -1.6], [-14.4, 2.8]].forEach(([x, z], i) => { const s2 = x < -18 ? 1 : -1; w.add('x', cyl(8), 0x334155, x + s2 * 0.2, 0.83, z + 0.75, 0, 0, 0, 0.02, 0.45, 0.02); w.add('g', cone(16), BR[i + 2], x + s2 * 0.2, 1.22, z + 0.75, 0, 0, 0, 0.14, 0.16, 0.14); w.add('g', rbox(0.25, 0.3, 0.02, 0.01), 0xffffff, x - s2 * 0.25, 0.98, z - 0.7, -0.2, 0, 0); });
  sign3d(w, 'OPEN PLAN OFFICE', -18.5, 4.2, -6.7, 0, 0.2, 0xffffff, 0x4f6fd8);

  K.cubicle(w, -22.6, -1.6, PI / 2, 0x93c5fd); K.cubicle(w, -22.6, 2.8, PI / 2, 0xfbcfe8); K.cubicle(w, -14.4, -1.6, -PI / 2, 0xbbf7d0); K.cubicle(w, -14.4, 2.8, -PI / 2, 0xfde68a);
  K.tableR(w, -17.2, 7.0, 1.3, 0.8, 0xf5d0a9, 0x9a6a3e); for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; K.chair(w, -17.2 + Math.cos(a) * 1.9, 7.0 + Math.sin(a) * 1.9, -a - PI / 2); }
  whiteboard(w, 'x', 10, -17.2, 1.2, 3.6, -1); sign3d(w, 'Q4 PLAN: MORE CHEESE', -17.2, 2.3, 9.68, PI, 0.13, 0x1f2937, null);
  K.filing(w, -12.8, 8.8, -PI / 2, 0x94a3b8, 3); K.filing(w, -12.8, 7.9, -PI / 2, 0xa5b4fc, 3); K.cooler(w, -24.4, -6.2); plant(w, -12.8, -6.2, 1.2);
  // copier (prints a funny page when you use it)
  { const T = w.tf(-24.3, 0, 5, PI / 2); T.slab('g', 0xe5e7eb, 0, 0, 0, 1.3, 1.0, 0.9, 0.08); T.box('g', 0x94a3b8, 0, 1.0, 0, 1.2, 0.12, 0.8, 0.03); T.box('l', 0x4ade80, 0.4, 1.12, 0.3, 0.2, 0.02, 0.12, 0.01, 0.6); T.box('m', 0xffffff, -0.8, 0.6, 0, 0.4, 0.04, 0.6, 0.01);
    w.I({ id: 'copier', kind: 'fun', x: -23.6, y: 0, z: 5, r: 1.3, label: '🖨️ Use the copier' }); }
  art(w, 'z', -12, 4.5, 2.6, 1.8, 1.4, -1, 2); poster(w, 'x', -7, -14, 2.6, 1, 4); clock(w, 'z', -12, -3.5, 3.6, -1);
  // disco closet behind a rat-size gap (secret)
  { const x = -23, z = 8; w.add('x', sph(20), 0xe5e7eb, x, 3.6, z, 0, 0, 0, 0.45); w.add('x', cyl(6), 0x94a3b8, x, 4.0, z, 0, 0, 0, 0.02, 1, 0.02); w.add('g', rbox(3.6, 0.04, 3.6, 0.01), 0x111827, x, 0.01, z);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) w.add('l', rbox(0.82, 0.03, 0.82, 0.01), BR[(i + j * 2) % 8], x - 1.35 + i * 0.9, 0.03, z - 1.35 + j * 0.9, 0, 0, 0, 1, 1, 1, 0.45);
    w.spots.disco = [x, 3.6, z]; w.secrets.push({ id: 'disco', x, y: 0, z, r: 1.6, msg: '🪩 Secret: the tiny disco closet! Spin to dance.' }); gearC(w, x, 0.6, z); }
}
// ------------------------------------------------------------------------------------------------ robotics (where the bot cousins were built) + boiler room
function robotics(w) {
  conveyor(w, 23.5, -17, 0, 9); w.spots.belt = [19.5, 0.8, -17, 27.5]; w.spots.arms = [[21, -15.6], [26, -18.4]]; K.robotArm(w, 21, -15.6); K.robotArm(w, 26, -18.4);
  // three charging pods: MIMI / LILY / LILI
  [['MIMI', 20.8, 0xff4fa0], ['LILY', 23.9, 0xa78bfa], ['LILI', 27, 0x2dd4bf]].forEach(([n, x, c]) => { const z = -26.6; w.add('x', rcyl(1.05, 0.25, 0.06, 32), 0x475569, x, 0, z); w.add('l', rcyl(0.95, 0.04, 0.02, 32), c, x, 0.26, z, 0, 0, 0, 1, 1, 1, 0.6);
    w.add('e', lathe([[0.95, 0], [0.98, 1.5], [0.85, 2.4], [0.5, 2.85], [0, 2.95]], 32, 'pod'), 0xd8f3ff, x, 0.25, z); w.add('x', rcyl(0.3, 0.3, 0.05, 20), 0x475569, x, 3.15, z); w.solid(x - 1.0, 0, z - 1.0, x + 1.0, 3.2, z + 1.0);
    sign3d(w, n, x, 3.55, z + 0.4, 0, 0.22, 0xffffff, c); w.add('m', rbox(1.0, 0.4, 0.05, 0.02), 0xffffff, x, 1.0, z + 1.05); });
  sign3d(w, 'ROBOTICS', 23.5, 4.3, -27.7, 0, 0.3, 0xffffff, 0x64748b);
  // server racks (blinking LEDs instanced at runtime)
  for (let i = 0; i < 4; i++) serverRack(w, 28.3, -21 + i * 1.0, -PI / 2, w.leds);
  // Clanky prototype on a stand + spare parts shelves
  w.slab('x', 0x475569, 14, 0, -14.6, 1.6, 0.4, 1.6, 0.1); w.spots.clanky = [14, 0.4, -14.6];
  PR.shelfUnit(K.scaled(w, 25.5, 0, -12.6, 0.2), 0, 0, PI, 14, 12, 3.6, 3, 0x64748b);
  for (let i = 0; i < 6; i++) w.add('x', gear(10), BR[i], 24 + i * 0.5, 0.97 + ((i % 3) * 0.8), -12.8, 0, 0, i, 0.18, 0.18, 0.06);
  PR.toolbox(K.scaled(w, 28, 0, -13, 0.18), 0, 0, -PI / 2, 0x2563eb);
  // video call terminal
  { const x = 13.2, z = -19.5; w.slab('g', 0x334155, x, 0, z, 0.7, 1.0, 0.9, 0.1); bigScreen(w, x - 0.2, 1.35, z, PI / 2, 1.3, 0.75, 0x7dd3fc); w.I({ id: 'call1', kind: 'call', x: x + 0.8, y: 0, z, r: 1.4, label: '📞 Video call the bot cousins' }); }
  // boiler room behind the RED keycard door
  w.kdoors.push({ id: 'boiler', key: 'red', axis: 'z', at: 18, a: -25.4, b: -22.8, h: 2.8, col: 0xef4444 });
  [[13.7, -26.2], [16.2, -26.6]].forEach(([x, z]) => { w.add('x', capsule(20), 0xb45309, x, 1.6, z, 0, 0, 0, 1.6, 2.2, 1.6); w.solid(x - 0.8, 0, z - 0.8, x + 0.8, 3, z + 0.8); w.add('x', torus(0.1, 24), 0x78350f, x, 1.6, z, PI / 2, 0, 0, 0.82); w.add('l', rcyl(0.18, 0.05, 0.02, 14), 0xf97316, x, 1.2, z + 0.8, PI / 2, 0, 0, 1, 1, 1, 0.8); });
  pipes(w, 'z', 12.6, -27.6, -21.3, 4.5, [0xb45309, 0x64748b]);
  { const x = 14.5, z = -22.8; w.add('x', rbox(2.6, 0.2, 2.0, 0.05), 0x64748b, x, 0.1, z); hazard(w, x, z, 2.6, 2.0); w.add('x', cyl(8), 0xfacc15, x - 1.4, 0, z, 0, 0, 0, 0.06, 1.2, 0.06); w.add('l', sph(10), 0xef4444, x - 1.4, 1.25, z, 0, 0, 0, 0.1, 0.1, 0.1, 0.8);
    sign3d(w, 'FREIGHT LIFT', 12.33, 2.6, z, PI / 2, 0.14, 0x1f2937, 0xfacc15); w.I({ id: 'elevDome', kind: 'elev', x, y: 0, z, r: 1.3, label: '⬇️ Take the old freight lift… down?', to: [-105, -29.95, 2.5], yaw: PI, need: 'red' }); }
  gearC(w, 28.3, 2.7, -19.5); gearC(w, 16.2, 3.2, -26.6);
}
// ------------------------------------------------------------------------------------------------ cheese R&D
function cheeseLab(w) {
  cheeseRack(w, 32, -27.1, 0, 4); cheeseRack(w, 36, -27.1, 0, 4); cheeseRack(w, 43.5, -27.1, 0, 4);
  // the Golden Gouda display case (empty - the mystery starts here)
  { const x = 37.5, z = -20.5; w.add('g', rcyl(0.9, 1.0, 0.1, 32), 0x7c3aed, x, 0, z); w.add('x', rcyl(0.95, 0.08, 0.04, 32), 0xffd23f, x, 1.0, z); w.add('e', lathe([[0.85, 0], [0.86, 1.0], [0.6, 1.5], [0, 1.65]], 32, 'case'), 0xe0f7ff, x, 1.08, z); w.solid(x - 0.9, 0, z - 0.9, x + 0.9, 2.7, z + 0.9);
    w.add('m', rcyl(0.5, 0.05, 0.02, 24), 0xffffff, x, 1.08, z); sign3d(w, 'GOLDEN GOUDA', x, 0.45, z + 0.92, 0, 0.11, 0xffd23f, null); w.spots.gouda = [x, 1.15, z];
    w.I({ id: 'clue_case', kind: 'clue', x, y: 0, z: z + 1.3, r: 1.6, label: '🔍 Inspect the empty display case' }); }
  // crumb trail + tiny wheel tracks heading for the door (clue)
  for (let i = 0; i < 14; i++) w.add('g', sph(6), 0xf5c46b, 37.5 + Math.sin(i * 0.7) * 0.3, 0.03, -19.2 + i * 0.5, 0, 0, 0, 0.06, 0.04, 0.05);
  [-0.18, 0.18].forEach((o) => w.add('m', rbox(0.06, 0.01, 6.5, 0.005), 0x6b7280, 37.5 + o, 0.006, -15.6));
  // tasting bar + cheese press (hands-on)
  { const T = w.tf(31, 0, -17, PI / 2); T.slab('g', 0xfbbf24, 0, 0, 0, 5, 1.0, 0.8, 0.08); T.box('m', 0x9a6a3e, 0, 1.0, 0, 5.1, 0.08, 0.95, 0.03); for (let i = 0; i < 3; i++) { const p = T.P(-1.6 + i * 1.6, 1.08, 0); w.add('m', rcyl(0.4, 0.06, 0.02, 24), 0x8b5a2b, p[0], p[1], p[2]); w.add('g', wedge(), [0xffc93c, 0xfde047, 0xf97316][i], p[0] - 0.15, p[1] + 0.06, p[2], 0, 0, 0, 0.35, 0.35, 0.2); } }
  for (let i = 0; i < 3; i++) K.stool(w, 32.3, -18.6 + i * 1.6, 0xffd23f);
  w.I({ id: 'taste', kind: 'station', x: 32.4, y: 0, z: -17, r: 1.6, label: '🧀 Taste-test the experimental cheeses' });
  { const x = 44, z = -17; w.slab('x', 0x64748b, x, 0, z, 1.8, 1.2, 1.6, 0.1); w.add('x', cyl(12), 0x94a3b8, x, 1.2, z, 0, 0, 0, 0.12, 1.4, 0.12); w.add('x', rcyl(0.7, 0.2, 0.05, 28), 0x475569, x, 2.6, z); w.add('g', rcyl(0.6, 0.4, 0.1, 28), 0xffc93c, x, 1.2, z); w.spots.press = [x, 2.6, z]; }
  // giant wheel stacks
  [[44.5, -13.5], [43, -13.3], [31, -13.5]].forEach(([x, z], i) => { for (let k = 0; k < 2 + (i % 2); k++) w.add('g', rcyl(0.65, 0.45, 0.12, 32), [0xffc93c, 0xfde047, 0xf59e0b][k % 3], x, k * 0.46, z); w.solid(x - 0.65, 0, z - 0.65, x + 0.65, (2 + (i % 2)) * 0.46, z + 0.65); });
  sign3d(w, 'CHEESE R&D', 39.5, 4.3, -27.7, 0, 0.3, 0x7c2d12, 0xffd23f); poster(w, 'z', 46, -21, 2.6, -1, 1);
  gearC(w, 43.5, 3.1, -27.1); gearC(w, 44.5, 1.5, -13.5);
}
// ------------------------------------------------------------------------------------------------ security & mailroom
function security(w) {
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) bigScreen(w, 25.65, 1.4 + j * 0.95, -4 + i * 1.45, -PI / 2, 1.25, 0.75, [0x22d3ee, 0x4ade80, 0x60a5fa, 0xa78bfa][(i + j) % 4]);
  { const T = w.tf(23.4, 0, -2.5, -PI / 2); T.slab('g', 0x334155, 0, 0, 0, 3.6, 0.95, 1.0, 0.08); T.box('g', 0x1f2937, 0, 0.95, 0, 3.7, 0.08, 1.1, 0.03); monitor(w, T, -0.8, 1.03, 0, 0, 0x22d3ee, 1.2); monitor(w, T, 0.5, 1.03, 0, 0, 0x4ade80, 1.2);
    T.add('l', rcyl(0.06, 0.05, 0.02, 12), 0xef4444, 1.3, 1.03, 0.3, 0, 0, 0, 1, 1, 1, 0.8); w.I({ id: 'clue_cam', kind: 'clue', x: 22.2, y: 0, z: -2.5, r: 1.5, label: '🔍 Check the security footage' }); }
  K.chair(w, 22.3, -2.5, PI / 2, 0x334155);
  // mail cubbies + parcels
  { const T = w.tf(12.4, 0, 2, PI / 2); T.slab('m', 0xb98a5a, 0, 0, 0, 5, 2.6, 0.6, 0.04); for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) T.box('m', 0x7c4a1e, -2.0 + i, 0.4 + j * 0.6, 0.31, 0.85, 0.45, 0.02, 0.02); }
  for (let i = 0; i < 7; i++) K.parcel(w, 14 + (i % 3) * 0.8, (i / 3 | 0) * 0.5, 7.5 + (i % 2) * 0.6, 1.0);
  { const x = 16.5, z = 8.8; w.slab('m', 0xc9a06a, x, 0, z, 1.4, 0.8, 1.0, 0.05); sign3d(w, 'LOST AND FOUND', x, 0.95, z + 0.52, 0, 0.09, 0x7c2d12, null); w.I({ id: 'clue_lost', kind: 'clue', x, y: 0, z: z - 0.8, r: 1.4, label: '🔍 Dig through Lost & Found' }); }
  for (let i = 0; i < 5; i++) { const T = w.tf(19 + i * 0.75, 0, 9.55, PI); T.slab('x', BR[i], 0, 0, 0, 0.7, 2.3, 0.6, 0.05); T.box('x', 0x111827, 0, 1.8, 0.31, 0.4, 0.06, 0.02, 0.01); }
  sign3d(w, 'SECURITY', 19, 3.6, -6.65, PI, 0.28, 0xffffff, 0x334155); plant(w, 13, -6.2, 1);
  gearC(w, 14.8, 1.2, 7.9);
}
// ------------------------------------------------------------------------------------------------ break lounge
function lounge(w) {
  rug(w, 31.5, 2, 0, 7, 5, 0xff8a3d, 0xffedd5); sofa(w, 31.5, 4.5, PI, 0xef4444, 0xfca5a5, 22); sofa(w, 28, 2, PI / 2, 0x2563eb, 0x93c5fd, 16); PR.coffeeTable(K.scaled(w, 31.5, 0, 2, 0.18), 0, 0, 0, 12, 6, 2.6);
  PR.tvStand(K.scaled(w, 31.5, 0, -1.4, 0.18), 0, 0, 0); bigScreen(w, 31.5, 1.3, -1.6, 0, 2.6, 1.46, 0x60a5fa);
  // arcade cabinets (real 3D)
  [38, 39.6, 41.2].forEach((x, i) => { const T = w.tf(x, 0, -6.2, 0); T.slab('g', BR[i * 2], 0, 0, 0, 1.3, 2.3, 1.0, 0.08); T.box('g', 0x1f2937, 0, 1.25, 0.35, 1.1, 0.8, 0.4, 0.04); T.box('l', [0x22d3ee, 0xff6fcf, 0x4ade80][i], 0, 1.35, 0.56, 0.9, 0.6, 0.02, 0.01, 0.55);
    T.box('g', 0x111827, 0, 0.95, 0.6, 1.1, 0.12, 0.4, 0.03); T.add('g', sph(10), 0xef4444, -0.2, 1.08, 0.65, 0, 0, 0, 0.07); T.add('g', sph(10), 0xffd23f, 0.15, 1.05, 0.65, 0, 0, 0, 0.06); T.add('l', rbox(1.2, 0.3, 0.1, 0.03), 0xffffff, 0, 2.15, 0.45, 0, 0, 0, 1, 1, 1, 0.3); });
  w.I({ id: 'arcade', kind: 'fun', x: 39.6, y: 0, z: -5.0, r: 1.5, label: '🕹️ Play "Cheese Invaders"' });
  // ping pong table + bean bags
  { const T = w.tf(39, 0, 1.5, 0); T.slab('g', 0x16a34a, 0, 0.75, 0, 2.8, 0.08, 1.5, 0.02); T.box('g', 0xffffff, 0, 0.83, 0, 0.03, 0.18, 1.5, 0.01); [-1, 1].forEach((a) => [-1, 1].forEach((b) => T.box('x', 0x334155, a * 1.2, 0, b * 0.6, 0.08, 0.75, 0.08, 0.02))); T.add('g', sph(10), 0xff8a3d, 0.6, 0.88, 0.2, 0, 0, 0, 0.05); }
  [[43.5, 7], [42, 8.5], [44.6, 4.8]].forEach(([x, z], i) => { w.add('f', blobGeo(i + 20, 0.12, 2), BR[i + 4], x, 0.35, z, 0, 0, 0, 0.75, 0.45, 0.75); w.solid(x - 0.6, 0, z - 0.6, x + 0.6, 0.6, z + 0.6, { cam: false }); });
  // kitchenette + coffee machine
  PR.cabinets(K.scaled(w, 0, 0, 0, 0.2), 27 / 0.2, 31 / 0.2, 9.4 / 0.2, PI, 4.6, 3.6); PR.microwave(K.scaled(w, 27.8, 0.93, 9.3, 0.2), 0, 0, 0, PI); PR.kettle(K.scaled(w, 29.6, 0.93, 9.3, 0.2), 0, 0, 0);
  { const x = 30.6, z = 9.35; w.slab('g', 0x111827, x, 0.93, z, 0.5, 0.65, 0.4, 0.06); w.add('l', rcyl(0.05, 0.03, 0.01, 10), 0x4ade80, x, 1.4, z - 0.21, PI / 2, 0, 0, 1, 1, 1, 0.8); PR.mug(K.scaled(w, x, 0.96, z - 0.08, 0.06), 0, 0, 0); }
  // phone booth (video call) + wardrobe locker
  { const x = 44.9, z = -1.5; const T = w.tf(x, 0, z, -PI / 2); T.slab('g', 0xff4fa0, 0, 0, -0.6, 1.4, 2.8, 0.12, 0.04); [-1, 1].forEach((s) => T.slab('g', 0xff4fa0, s * 0.7, 0, 0, 0.12, 2.8, 1.3, 0.04)); T.box('g', 0xff4fa0, 0, 2.8, 0, 1.6, 0.2, 1.4, 0.06);
    T.box('l', 0x7dd3fc, 0, 1.2, -0.52, 0.9, 0.55, 0.04, 0.02, 0.5); sign3d(w, 'CALL', x - 0.2, 2.95, z, -PI / 2, 0.14, 0xffffff, null); w.I({ id: 'call2', kind: 'call', x: x - 0.9, y: 0, z, r: 1.3, label: '📞 Video call the bot cousins' }); }
  { const x = 44.9, z = 4.5; w.slab('x', 0x7c3aed, x, 0, z, 0.7, 2.4, 1.4, 0.06); [-0.35, 0.35].forEach((o) => w.add('x', rbox(0.04, 2.2, 0.66, 0.02), 0x8b5cf6, x - 0.36, 1.2, z + o)); w.I({ id: 'wardrobe', kind: 'wardrobe', x: x - 1.0, y: 0, z, r: 1.3, label: '👕 Dress-up locker' }); sign3d(w, 'DRESS UP', x - 0.36, 2.6, z, -PI / 2, 0.13, 0xffffff, 0x7c3aed); }
  shelf(w, 27, -6.5, 0, 2.8, 2.4); plant(w, 45, -6.2, 1.2); plant(w, 26.9, 6.5, 1); art(w, 'x', 10, 37, 2.8, 2.6, 1.6, -1, 0); clock(w, 'x', -7, 31.5, 3.8, 1);
  gearC(w, 31.5, 2.6, -1.4); gearC(w, 44.9, 3.1, 4.5);
}
// ------------------------------------------------------------------------------------------------ Department of Canine Ruffsources (dog scale!)

// paw print: a big pad + 4 toes. flat on the floor (vertical=false) or on a wall plane (vertical=true, facing ry)
function pawPrint(w, x, y, z, s, col, ry = 0, vertical = false) { const pts = [[0, 0, 1.0, 0.85], [-0.95, 0.95, 0.42, 0.5], [-0.35, 1.35, 0.42, 0.5], [0.35, 1.35, 0.42, 0.5], [0.95, 0.95, 0.42, 0.5]];
  const c = Math.cos(ry), sn = Math.sin(ry); pts.forEach(([a, b, rx, rz]) => { if (vertical) w.add('g', sph(12), col, x + a * s * c, y + b * s, z - a * s * sn, 0, ry, 0, rx * s, rz * s, 0.01);
    else w.add('g', rcyl(1, 0.012, 0.004, 18), col, x + (a * c + b * sn) * s, y, z + (-a * sn + b * c) * s, 0, 0, 0, rx * s, 1, rz * s); }); }
// round rug covered in paw prints
function pawRug(w, x, z, r, base, paw, y = 0.02) { w.add('f', rcyl(r, 0.03, 0.015, 40), base, x, y, z); w.add('f', torus(0.06, 64), paw, x, y + 0.025, z, PI / 2, 0, 0, r * 0.94, r * 0.94, 1);
  const n = Math.max(4, Math.round(r * 2.4)); for (let i = 0; i < n; i++) { const a = i / n * PI * 2, d = r * (i % 2 ? 0.62 : 0.4); pawPrint(w, x + Math.cos(a) * d, y + 0.035, z + Math.sin(a) * d, r * 0.07, paw, a + PI / 2); } pawPrint(w, x, y + 0.035, z, r * 0.11, paw, 0); }
// 3D relief bust of Candy the miniature schnauzer for picture frames (boxy salt-and-pepper head, silver beard, bushy brows, folded ears)
function schnauzerBust(w, x, y, z, s) { const G = 0x8a9099, Dk = 0x4b5058, Lt = 0xe8eaee;
  w.add('f', sph(16), G, x, y - 0.45 * s, z, 0, 0, 0, 0.42 * s, 0.25 * s, 0.1 * s); w.add('g', torus(0.3, 20), 0xff4fa0, x, y - 0.3 * s, z + 0.04 * s, 0, 0, 0, 0.22 * s, 0.1 * s, 0.1 * s);
  w.add('f', rbox(0.5, 0.42, 0.2, 0.08), G, x, y, z + 0.06 * s, 0, 0, 0, s, s, s); w.add('f', rbox(0.48, 0.1, 0.2, 0.04), Dk, x, y + 0.2 * s, z + 0.05 * s, 0, 0, 0, s, s, s);
  w.add('f', rbox(0.3, 0.22, 0.14, 0.06), G, x, y - 0.1 * s, z + 0.18 * s, 0, 0, 0, s, s, s); w.add('f', sph(14), Lt, x, y - 0.27 * s, z + 0.2 * s, 0, 0, 0, 0.17 * s, 0.14 * s, 0.07 * s);
  [-1, 1].forEach((k) => { w.add('f', sph(12), Lt, x + k * 0.08 * s, y - 0.1 * s, z + 0.27 * s, 0, 0, k * 0.4, 0.1 * s, 0.05 * s, 0.04 * s); w.add('f', sph(12), Lt, x + k * 0.11 * s, y + 0.1 * s, z + 0.19 * s, 0, 0, -k * 0.3, 0.1 * s, 0.05 * s, 0.05 * s);
    w.add('g', sph(10), 0x15151b, x + k * 0.1 * s, y + 0.04 * s, z + 0.17 * s, 0, 0, 0, 0.04 * s, 0.045 * s, 0.02 * s); w.add('f', sph(12), Dk, x + k * 0.27 * s, y + 0.12 * s, z + 0.08 * s, 0, 0, k * 0.9, 0.13 * s, 0.05 * s, 0.06 * s); });
  w.add('g', rbox(0.11, 0.07, 0.05, 0.02), 0x111111, x, y - 0.04 * s, z + 0.26 * s, 0, 0, 0, s, s, s); }
function dcr(w) {
  const S = (x, z, s) => K.scaled(w, x, 0, z, s);
  // Candy's raised podium desk: she stands up on a 0.9 m stage behind a curved counter, so visitors never block her
  { const x0 = 64.6, x1 = 68.8, z0 = -17, z1 = -11; w.add('g', rbox(x1 - x0, 0.9, z1 - z0, 0.12, 2), 0xff8a3d, (x0 + x1) / 2, 0.45, (z0 + z1) / 2); w.add('x', rbox(x1 - x0 + 0.1, 0.08, z1 - z0 + 0.1, 0.04, 1), 0xffd23f, (x0 + x1) / 2, 0.9, (z0 + z1) / 2);
    w.solid(x0, 0, z0, x1, 0.9, z1); pawRug(w, 66.9, -14, 1.7, 0xfff1d6, 0xff8a3d, 0.92);
    for (let i = 0; i < 3; i++) w.slab('g', 0xfdba74, 69.3 + i * 0.5, 0, -16.6, 0.5, 0.3 * (3 - i), 1.4, 0.05); // back steps
    const T = w.tf(64.15, 0, -14, 0); T.slab('m', 0x9a6a3e, 0, 0, 0, 0.7, 1.12, 5.4, 0.12); T.box('g', 0xfff7ed, 0, 1.12, 0, 0.9, 0.08, 5.6, 0.04); T.box('x', 0xffd23f, -0.36, 0.55, 0, 0.04, 0.7, 4.8, 0.02);
    sign3d(w, 'CANDY', 63.78, 0.8, -14, -PI / 2, 0.28, 0x7c2d12, null); sign3d(w, 'HEAD OF RUFFSOURCES', 63.78, 0.42, -14, -PI / 2, 0.11, 0xffffff, null);
    // desk-top: tiny monitor, bone pen holder, "World's Best Boss" mug, in/out trays of treats
    K.monitor(w, null, 64.6, 1.16, -12.4, -PI / 2 + 0.3, 0xff8ad8); w.add('g', capsule(10), 0xfff7ed, 64.15, 1.2, -16, 0, 0, PI / 2, 0.07, 0.18, 0.07); [-1, 1].forEach((k) => w.add('g', sph(8), 0xfff7ed, 64.15, 1.2, -16 + k * 0.17, 0, 0, 0, 0.07));
    w.add('g', cyl(12), 0xff4fa0, 64.15, 1.24, -15.2, 0, 0, 0, 0.09, 0.2, 0.09); w.add('m', cyl(12), 0x3b1f0f, 64.15, 1.335, -15.2, 0, 0, 0, 0.075, 0.01, 0.075);
    [-12.8, -13.4].forEach((z, i) => { w.add('x', rbox(0.5, 0.1, 0.45, 0.02), 0xcbd5e1, 64.15, 1.2, z); for (let k = 0; k < 4; k++) w.add('g', capsule(8), 0xc2783a, 64.05 + (k % 2) * 0.2, 1.27, z - 0.1 + (k >> 1) * 0.2, 0, k, PI / 2, 0.04, 0.07, 0.04); });
    w.spots.candy = [62.6, 0, -14]; }
  // staff desks (human-height) with plump dog cushions instead of chairs
  [[51, -19, 0], [56, -19, 0], [51, -1.8, PI], [55.2, -1.8, PI]].forEach(([x, z, ry], i) => { K.desk(S(x, z, 1.0), 0, 0, ry, { L: 2.4, D: 1.2, plant: i % 2 === 0 }); const cz = z + (ry ? -1.2 : 1.2);
    w.add('f', rcyl(0.5, 0.22, 0.1, 24), BR[i + 1], x + 0.5, 0, cz); w.add('f', torus(0.4, 20), BR[(i + 4) % 8], x + 0.5, 0.2, cz, PI / 2, 0, 0, 0.42, 0.42, 0.42); K.monitor(w, null, x + 0.4, 0.85, z, ry + PI, 0x38bdf8); });
  // bone-shaped conference table on a paw-print rug, with cushions all round
  { const x = 57.6, z = -13.6, L = 4.6; pawRug(w, x, z, 3.6, 0x93c5fd, 0x1e3a8a, 0.02);
    w.add('g', capsule(20), 0xfff7ed, x, 0.8, z, 0, 0, PI / 2, 0.12, L * 0.45, 1.0); [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => w.add('g', rcyl(0.62, 0.12, 0.05, 28), 0xfff7ed, x + sx * L * 0.5, 0.74, z + sz * 0.5)));
    [-1.4, 0, 1.4].forEach((k) => w.add('x', cyl(12), 0xd6b38a, x + k, 0, z, 0, 0, 0, 0.12, 0.74, 0.12)); w.solid(x - L / 2 - 0.6, 0, z - 1.1, x + L / 2 + 0.6, 0.86, z + 1.1, { cam: false });
    for (let i = 0; i < 4; i++) [-1, 1].forEach((sd) => { const cx = x - 1.8 + i * 1.2; w.add('f', rcyl(0.38, 0.2, 0.08, 20), BR[(i * 2 + (sd > 0 ? 1 : 0)) % 8], cx, 0, z + sd * 1.75); });
    for (let i = 0; i < 4; i++) { w.add('g', rbox(0.3, 0.02, 0.4, 0.01), 0xffffff, x - 1.6 + i * 1.1, 0.88, z + (i % 2 ? 0.35 : -0.35)); w.add('g', capsule(8), 0xc2783a, x - 1.3 + i * 1.1, 0.9, z + (i % 2 ? -0.3 : 0.3), 0, i, PI / 2, 0.05, 0.08, 0.05); }
    sign3d(w, 'MEETING ROOM: THE BONE ZONE', x, 0.06, z + 2.6, 0, 0.0001, 0xffffff, null); }
  // Employee of the Month wall: three 4:5 portrait frames with a 3D Candy bust in each (Jan, Feb, Mar... always Candy)
  [['JAN', 57.6], ['FEB', 60], ['MAR', 62.4]].forEach(([m, x], i) => { const y = 3.4, Z = -23.72; w.add('x', rbox(1.5, 1.875, 0.14, 0.04), 0xffd23f, x, y, Z); w.add('m', rbox(1.3, 1.625, 0.04, 0.01), [0xbfe3ff, 0xffd6e8, 0xd9f99d][i], x, y, Z + 0.07);
    schnauzerBust(w, x, y - 0.12, Z + 0.1, 0.9); w.add('g', rbox(1.1, 0.28, 0.04, 0.02), 0x7c2d12, x, y - 0.6, Z + 0.12); sign3d(w, 'CANDY · ' + m, x, y - 0.6, Z + 0.15, 0, 0.09, 0xffd23f, null); });
  sign3d(w, 'EMPLOYEE OF THE MONTH', 60, 4.75, -23.6, 0, 0.17, 0x7c2d12, 0xffd23f);
  // water-bowl water cooler (a giant red dog bowl under the jug), plus floor bowls
  { const x = 47.6, z = -4.5; w.add('g', lathe([[0, 0], [0.75, 0], [0.9, 0.35], [0.8, 0.4], [0.55, 0.12], [0, 0.12]], 32, 'bowl'), 0xef4444, x, 0, z); w.add('e', rcyl(0.56, 0.05, 0.02, 24), 0x7dd3fc, x, 0.18, z);
    w.slab('g', 0xf8fafc, x, 0, z - 1.0, 0.6, 1.0, 0.6, 0.08); w.add('e', lathe([[0, 0], [0.26, 0.02], [0.28, 0.65], [0.13, 0.76], [0, 0.76]], 24, 'jug'), 0x7dd3fc, x, 1.0, z - 1.0); w.add('x', cyl(8), 0x94a3b8, x, 0.6, z - 0.6, PI / 2, 0, 0, 0.03, 0.5, 0.03); w.add('e', sph(8), 0x7dd3fc, x, 0.4, z - 0.25, 0, 0, 0, 0.03, 0.08, 0.03);
    w.solid(x - 0.9, 0, z - 1.35, x + 0.9, 0.4, z + 0.9); sign3d(w, 'WATER BOWL', x + 0.2, 1.6, z - 1.33, PI / 2, 0.12, 0x1d4ed8, 0xffffff);
    [[49.5, -0.6], [50.4, -0.6]].forEach(([bx, bz], k) => w.add('g', lathe([[0, 0], [0.3, 0], [0.36, 0.14], [0.3, 0.16], [0.2, 0.05], [0, 0.05]], 24, 'bowl2'), k ? 0x3b82f6 : 0xf59e0b, bx, 0, bz)); }
  // chew-toy bin
  { const x = 72.3, z = -7.4; w.slab('f', 0x3b82f6, x, 0, z, 1.5, 0.75, 1.1, 0.08); w.add('m', rbox(1.3, 0.04, 0.9, 0.02), 0x1e3a8a, x, 0.72, z); sign3d(w, 'CHEW TOYS', x - 0.77, 0.45, z, -PI / 2, 0.1, 0xffffff, null);
    for (let i = 0; i < 9; i++) { const px = x - 0.5 + (i % 3) * 0.5, pz = z - 0.3 + ((i / 3) | 0) * 0.3; if (i % 3 === 0) { w.add('g', capsule(8), 0xfff7ed, px, 0.85, pz, 0.3, i, PI / 2 - 0.4, 0.07, 0.18, 0.07); w.add('g', sph(8), 0xfff7ed, px + 0.15, 0.95, pz, 0, 0, 0, 0.07); }
      else if (i % 3 === 1) w.add('g', sph(12), BR[i % 8], px, 0.88, pz, 0, 0, 0, 0.16); else w.add('g', torus(0.35, 16), BR[(i + 3) % 8], px, 0.9, pz, 1.2, i, 0, 0.16); } }
  // squeaky-toy test station: a press that squishes a rubber duck, with a squeak-o-meter dial
  { const x = 72.6, z = -11.2, T = w.tf(x, 0, z, -PI / 2); T.slab('g', 0xe5e7eb, 0, 0, 0, 2.0, 0.95, 0.9, 0.06); T.box('x', 0x64748b, -0.7, 0.95, 0, 0.12, 1.3, 0.12, 0.03); T.box('x', 0x64748b, 0.1, 2.2, 0, 1.7, 0.14, 0.2, 0.04);
    T.add('x', cyl(14), 0x94a3b8, 0, 1.75, 0, 0, 0, 0, 0.06, 0.8, 0.06); T.add('g', cyl(16), 0xef4444, 0, 1.38, 0, 0, 0, 0, 0.26, 0.08, 0.26);
    T.add('g', sph(16), 0xffd23f, 0, 1.12, 0, 0, 0, 0, 0.2, 0.17, 0.22); T.add('g', sph(14), 0xffd23f, 0, 1.3, 0.12, 0, 0, 0, 0.12); T.add('g', cone(10), 0xf97316, 0, 1.28, 0.27, PI / 2, 0, 0, 0.05, 0.1, 0.03);
    T.add('g', rcyl(0.3, 0.06, 0.02, 24), 0xffffff, 0.68, 1.55, 0.05, PI / 2, 0, 0, 1, 1, 1); T.add('g', cyl(6), 0xef4444, 0.68, 1.6, 0.1, 0, 0, -0.6, 0.015, 0.22, 0.015); T.add('l', sph(8), 0x4ade80, 0.68, 1.95, 0.05, 0, 0, 0, 0.05, 0.05, 0.05, 0.9);
    sign3d(w, 'SQUEAK LAB', x - 0.5, 2.6, z, -PI / 2, 0.14, 0xffffff, 0xff4fa0);
    w.I({ id: 'squeak', kind: 'fun', x: x - 1.1, y: 0, z, r: 1.5, label: '🦆 Test a squeaky toy', msgs: ['SQUEEEAK! Squeak-o-meter: 94. Approved by Candy! 🐶', 'squeak… squeak… Too quiet. REJECTED. 😤', 'SQUEAK SQUEAK SQUEAK! Pepper ran in from the hallway. Very effective!', 'HONK?! That one\'s a goose toy. Filed under "mysteries".'] }); }
  // treat vending machine
  K.vending(w, 67.6, 5.2, PI, 0xf97316); sign3d(w, 'TREATS', 67.6, 2.6, 4.75, PI, 0.18, 0xffffff, 0x7c2d12);
  // paw-print rug by the dog beds + HR pun posters
  pawRug(w, 70.4, 1.6, 2.4, 0xfde68a, 0xb45309, 0.02);
  [['PAWSITIVE', 'VIBES ONLY', 46.25, -19, PI / 2, 0xff4fa0], ['NO BONES ABOUT IT:', 'FREE TREATS!', 46.25, -3, PI / 2, 0x16a34a], ['WE\'RE HOWLING', 'FOR TALENT', 46.25, 1.6, PI / 2, 0x7c3aed], ['FUR-LOUGH FORMS:', 'ASK PEPPER', 64.3, 5.75, PI, 0x0ea5e9]].forEach(([a, b, x, z, ry, c]) => {
    const T = w.tf(x, 2.9, z, ry); T.box('x', 0xffffff, 0, 0, 0, 2.0, 1.4, 0.08, 0.04); T.box('m', c, 0, 0, 0.05, 1.84, 1.24, 0.03, 0.02); const p = T.P(0, 0.22, 0.08), q = T.P(0, -0.25, 0.08); sign3d(w, a, p[0], p[1], p[2], ry, 0.13, 0xffffff, null); sign3d(w, b, q[0], q[1], q[2], ry, 0.17, 0xffd23f, null);
    for (let k = 0; k < 2; k++) { const r = T.P(-0.7 + k * 1.4, -0.5, 0.08); pawPrint(w, r[0], r[1], r[2], 0.08, 0xffffff, ry, true); } });
  // TREAT POLICY board
  { const T = w.tf(73.65, 2.6, -2, -PI / 2); T.box('g', 0x9a6a3e, 0, 0, 0, 5, 3, 0.15, 0.05); T.box('m', 0xfef3c7, 0, 0.1, 0.06, 4.6, 2.6, 0.05, 0.02); }
  sign3d(w, 'TREAT POLICY', 73.55, 4.3, -2, -PI / 2, 0.3, 0x7c2d12, null); sign3d(w, 'YES', 73.55, 3.4, -2, -PI / 2, 0.55, 0x16a34a, null); sign3d(w, 'MORE TREATS', 73.55, 2.9, -2, -PI / 2, 0.22, 0xef4444, null);
  // ball pit
  { const x = 60, z = -2.5, r = 3.2; w.add('g', lathe([[r, 0], [r + 0.3, 0], [r + 0.3, 0.9], [r, 0.9], [r, 0.1], [0, 0.1]], 48, 'pit'), 0x60a5fa, x, 0, z);
    for (let i = 0; i < 140; i++) { const a = R() * PI * 2, d = Math.sqrt(R()) * (r - 0.3); w.add('g', sph(10), BR[i % 8], x + Math.cos(a) * d, 0.3 + R() * 0.45, z + Math.sin(a) * d, 0, 0, 0, 0.25); }
    for (let a = 0; a < 24; a++) { const t = a / 24 * PI * 2; w.solid(x + Math.cos(t) * (r + 0.15) - 0.35, 0, z + Math.sin(t) * (r + 0.15) - 0.35, x + Math.cos(t) * (r + 0.15) + 0.35, 0.9, z + Math.sin(t) * (r + 0.15) + 0.35, { cam: false }); }
    w.zone('slip', x - r, -0.5, z - r, x + r, 1.2, z + r); w.secrets.push({ id: 'pit', x, y: 0, z, r: 2.4, msg: '🎈 Secret: the Ruffsources ball pit! Wheee!' }); gearC(w, x, 0.6, z); }
  // dog beds, giant bone, hydrant water cooler, filing cabinets
  [[70, 3.3], [72, 0.3], [49, -22]].forEach(([x, z], i) => { w.add('f', torus(0.5, 28), BR[i + 2], x, 0.3, z, PI / 2, 0, 0, 1.1, 1.1, 1.1); w.add('f', rcyl(1.0, 0.25, 0.1, 28), 0xfff7ed, x, 0, z); w.solid(x - 1.5, 0, z - 1.5, x + 1.5, 0.5, z + 1.5, { cam: false }); });
  { const x = 70, z = -21; w.add('x', capsule(14), 0xef4444, x, 1.0, z, 0, 0, 0, 0.9, 1.4, 0.9); w.add('x', sph(14), 0xef4444, x, 1.95, z, 0, 0, 0, 0.55); [-1, 1].forEach((s) => w.add('x', cyl(12), 0xfacc15, x + s * 0.55, 1.2, z, 0, 0, PI / 2, 0.2, 0.4, 0.2)); w.solid(x - 0.55, 0, z - 0.55, x + 0.55, 2.4, z + 0.55); }
  for (let i = 0; i < 3; i++) K.potPlant(w, 47, 0, -14 - i * 2.4, 1.7, BR[i + 2]);
  for (let i = 0; i < 4; i++) K.filing(w, 73.2, -22.5 + i * 1.3, -PI / 2, 0xfdba74, 5);
  // dog door out to the yard + welcome mat
  w.add('f', rbox(5.6, 0.04, 2.2, 0.02), 0xf97316, 60, 0.02, 4.4); sign3d(w, 'WOOF', 60, 0.06, 4.4, 0, 0.0001, 0xffffff, null);
  for (let i = 0; i < 6; i++) PR.ball(K.scaled(w, 0, 0, 0, 0.12), (48 + i * 0.7) / 0.12, 0, (4.8) / 0.12, 2.3, BR[i], 0xffffff);
  plant(w, 47, 5, 2); plant(w, 73, 5, 2); plant(w, 47, -23, 2);
  gearC(w, 70, 2.8, -21); gearC(w, 73.2, 6.8, -18.6);
}
// ------------------------------------------------------------------------------------------------ executive suite (penthouse, y = 20.4)
function penthouse(w) {
  const Y = 20.4, up = (x, z, s) => K.scaled(w, x, Y, z, s);
  PR.rug(K.scaled(w, 0, Y, -35.5, 0.25), 0, 0, 0, 48, 32, 0xff4fa0, 0xffe4ef);
  [['LUNA', -7, -41, 0x94a3b8], ['PI-RAT', 0, -41.5, 0xc99a6b], ['SNOWIE', 7, -41, 0xf8fafc]].forEach(([n, x, z, c]) => { K.desk(up(x, z, 1), 0, 0, 0, { L: 3, D: 1.3, top: 0x7c4a1e, plant: true }); sign3d(w, n, x, Y + 0.38, z + 0.7, 0, 0.17, 0xffd23f, 0x1f2937); });
  // conference table + chairs
  { const T = w.tf(0, Y, -34.8, 0); T.slab('g', 0xffffff, 0, 0.75, 0, 6, 0.1, 2.2, 0.08); [-2.4, 0, 2.4].forEach((x) => T.box('x', 0x94a3b8, x, 0, 0, 0.2, 0.75, 0.2, 0.05)); }
  for (let i = 0; i < 6; i++) [-1, 1].forEach((s) => K.chair(w, -2.5 + i, Y, -34.8 + s * 1.5, s > 0 ? PI : 0, 0xff4fa0));
  // Pi-rat: treasure chest + globe; Luna: telescope; Snowie: vase with a desert flower (clue)
  PR.trunk(up(-3.5, -43, 0.14), 0, 0, 0, 0x7c2d12); PR.globe(up(2.6, -42.4, 0.18), 0, 0, 0);
  { const x = -10.5, z = -42.5; [-1, 0, 1].forEach((k) => w.add('x', cyl(8), 0x8b5a2b, x + k * 0.35, Y, z + (k === 0 ? -0.35 : 0.2), k * 0.3, 0, -k * 0.3, 0.04, 1.3, 0.04)); w.add('x', capsule(16), 0x1f2937, x, Y + 1.5, z, -0.6, 0, 0, 0.22, 0.9, 0.22); w.add('x', torus(0.2, 20), 0xffd23f, x, Y + 1.73, z - 0.38, 0.95, 0, 0, 0.22); }
  { const x = 9.6, z = -40.6; w.add('e', lathe([[0, 0], [0.18, 0], [0.24, 0.25], [0.1, 0.5], [0.13, 0.6], [0, 0.6]], 24, 'vase'), 0xa5f3fc, x, Y + 0.9, z); w.add('g', cyl(6), 0x16a34a, x, Y + 1.3, z, 0, 0, 0, 0.015, 0.5, 0.015);
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; w.add('g', sph(8), 0xfb923c, x + Math.cos(a) * 0.1, Y + 1.8, z + Math.sin(a) * 0.1, 0, 0, 0, 0.09, 0.04, 0.09); } w.add('g', sph(8), 0xfde047, x, Y + 1.82, z, 0, 0, 0, 0.05);
    w.I({ id: 'clue_flower', kind: 'clue', x: 8.5, y: Y, z: -40, r: 1.6, label: '🔍 Look at the mystery flower' }); }
  // cheese bar + sofas + plants + trophy shelf
  { const T = w.tf(-10.6, Y, -32, PI / 2); T.slab('g', 0xffd23f, 0, 0, 0, 3.4, 1.0, 0.8, 0.08); T.box('m', 0x7c4a1e, 0, 1.0, 0, 3.5, 0.08, 0.9, 0.03); for (let i = 0; i < 3; i++) { const p = T.P(-1 + i, 1.08, 0); w.add('g', wedge(), BR[i + 3] === 0 ? 0xffc93c : 0xffc93c, p[0], p[1], p[2], 0, i, 0, 0.35, 0.35, 0.2); } }
  sofa(K.scaled(w, 0, Y, 0, 1), 8.8, -32, -PI / 2, 0x1f2937, 0x475569, 18); plant(up(0, 0, 1), -11, -29, 1.4); plant(up(0, 0, 1), 11, -29, 1.4); plant(up(0, 0, 1), 11, -43, 1.4);
  for (let i = 0; i < 5; i++) w.add('x', lathe([[0, 0], [0.18, 0], [0.06, 0.12], [0.05, 0.4], [0.22, 0.55], [0.25, 0.85], [0, 0.85]], 24, 'trophy'), i % 2 ? 0xffd23f : 0xe5e7eb, -9 + i * 0.7, Y + 2.0, -28.45);
  w.slab('m', 0x7c4a1e, -7.6, Y + 1.9, -28.5, 4.4, 0.1, 0.5, 0.03);
  // video wall to call the cousins
  bigScreen(w, 4.5, Y + 2.6, -28.4, PI, 3.6, 2.02, 0x7dd3fc); w.I({ id: 'call3', kind: 'call', x: 4.5, y: Y, z: -29.5, r: 1.6, label: '📞 Video call the bot cousins' });
  // elevator back down
  { const x = 0, z = -29.4; w.add('g', rcyl(1.2, 0.12, 0.04, 32), 0xffd23f, x, Y + 0.01, z); w.add('l', torus(0.06, 32), 0xff4fa0, x, Y + 0.14, z, PI / 2, 0, 0, 1.2, 1.2, 1.2, 0.5); w.I({ id: 'elevDown', kind: 'elev', x, y: Y, z, r: 1.4, label: '🛗 Ride down to the lobby', to: [7.5, 0.05, -23.2], yaw: 0 }); }
  gearC(w, -10.6, Y + 1.6, -32); gearC(w, -3.5, Y + 1.0, -43);
}
// ------------------------------------------------------------------------------------------------ the hidden desert dome (Martina)
function dome(w) {
  const Y = -30, cx = -105, cz = -15, R0 = 19;
  w.add('m', rcyl(R0 + 1, 1.2, 0.2, 64), 0xf3d29b, cx, Y - 1.2, cz); w.solid(cx - R0 - 1, Y - 3, cz - R0 - 1, cx + R0 + 1, Y, cz + R0 + 1, { floor: true });
  for (let i = 0; i < 30; i++) { const a = R() * PI * 2, d = 3 + R() * (R0 - 5); w.add('m', blobGeo(i, 0.25, 2), i % 2 ? 0xeec88a : 0xe8bf7a, cx + Math.cos(a) * d, Y - 0.35, cz + Math.sin(a) * d, 0, a, 0, 2.2, 0.5, 1.8); }
  w.add('e', lathe(Array.from({ length: 13 }, (_, i) => { const t = i / 12 * PI / 2; return [Math.cos(t) * R0, Math.sin(t) * 12]; }), 64, 'dome'), 0xd7f5ff, cx, Y, cz);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; w.add('x', tube(Array.from({ length: 9 }, (_, k) => { const t = k / 8 * PI / 2; return [cx + Math.cos(a) * Math.cos(t) * R0, Y + Math.sin(t) * 12, cz + Math.sin(a) * Math.cos(t) * R0]; }), 0.12, 24, 8), 0xffffff, 0, 0, 0); }
  for (let a = 0; a < 40; a++) { const t = a / 40 * PI * 2; w.solid(cx + Math.cos(t) * R0 - 1.2, Y, cz + Math.sin(t) * R0 - 1.2, cx + Math.cos(t) * R0 + 1.2, Y + 8, cz + Math.sin(t) * R0 + 1.2, { cam: false }); }
  w.add('l', sph(24), 0xfff1a8, cx, Y + 11, cz, 0, 0, 0, 1.5, 0.6, 1.5, 1.0); w.lights.push({ x: cx, y: Y + 8, z: cz, c: 0xffe2a8, i: 40, d: 40 });
  // cacti, rocks, flowers (the same desert flowers that keep appearing upstairs!)
  const sp = [[-6, -8], [7, -9], [-11, 4], [10, 6], [-3, 11], [13, -3], [-14, -5], [4, -14]]; sp.forEach(([dx, dz], i) => cactus(w, cx + dx, cz + dz, 0.8 + (i % 3) * 0.3, Y));
  [[-9, -12], [12, 10], [-15, 8], [15, -9]].forEach(([dx, dz], i) => { const x = cx + dx, z = cz + dz; w.add('g', blobGeo(i + 40, 0.22, 2), 0xc9a77c, x, Y + 0.6, z, 0, i, 0, 1.6, 1.1, 1.4); w.solid(x - 1.3, Y, z - 1.1, x + 1.3, Y + 1.4, z + 1.1); });
  for (let i = 0; i < 4; i++) for (let k = 0; k < 7; k++) { const x = cx - 7 + k * 1.1, z = cz + 6 + i * 1.1; w.add('g', cyl(6), 0x2e9e45, x, Y, z, 0, 0, 0, 0.03, 0.5, 0.03); for (let p = 0; p < 6; p++) { const a = p / 6 * PI * 2; w.add('g', sph(8), [0xfb923c, 0xf472b6, 0xfde047, 0xa78bfa][(i + k) % 4], x + Math.cos(a) * 0.1, Y + 0.55, z + Math.sin(a) * 0.1, 0, 0, 0, 0.09, 0.04, 0.09); } }
  w.add('m', rbox(8.4, 0.25, 5, 0.1), 0x8b5a2b, cx - 3.7, Y + 0.0, cz + 7.65); sign3d(w, 'MARTINAS GARDEN', cx - 3.7, Y + 0.5, cz + 4.9, PI, 0.22, 0xffffff, 0x16a34a);
  // oasis pond + palm
  w.add('e', rcyl(3.4, 0.12, 0.05, 40), 0x38bdf8, cx + 8, Y - 0.08, cz - 7); w.add('m', torus(0.25, 40), 0xc9a77c, cx + 8, Y, cz - 7, PI / 2, 0, 0, 3.5, 3.5, 3.5);
  { const x = cx + 11, z = cz - 9; w.add('m', tube([[x, Y, z], [x + 0.6, Y + 3, z], [x + 1.6, Y + 5.5, z + 0.3]], 0.25, 20, 10), 0x8b5a2b, 0, 0, 0); for (let i = 0; i < 7; i++) w.add('g', leaf(), 0x22c55e, x + 1.6, Y + 5.5, z + 0.3, 0.9, i * 0.9, 0, 0.9, 2.2, 0.3); }
  // Martina's adobe hut with a round door + a tiny lettuce snack bar
  { const x = cx - 10, z = cz - 6; w.add('m', lathe([[0, 0], [3, 0], [3, 2.4], [2.6, 3.2], [1.4, 3.8], [0, 4]], 40, 'hut'), 0xe9b97a, x, Y, z); w.solid(x - 2.6, Y, z - 2.6, x + 2.6, Y + 3.6, z + 2.6);
    w.add('m', rcyl(0.9, 0.2, 0.05, 28), 0x7c4a1e, x + 2.95, Y + 1.0, z, 0, 0, PI / 2); w.add('g', rcyl(0.5, 0.08, 0.03, 18), 0x16a34a, x + 3.1, Y + 2.6, z - 1.0, 0, 0, PI / 2);
    for (let i = 0; i < 4; i++) w.add('g', blobGeo(i + 50, 0.2, 2), 0x84cc16, cx + 2 + i * 0.8, Y + 0.25, cz + 1, 0, 0, 0, 0.35, 0.25, 0.35); }
  w.spots.martina = [cx - 4, Y, cz - 2];
  // freight lift back up
  { const x = cx, z = cz + 17.5; w.add('x', rbox(2.6, 0.2, 2.0, 0.05), 0x64748b, x, Y + 0.1, z); hazard(K.scaled(w, 0, Y, 0, 1), x, z, 2.6, 2.0); w.add('x', cyl(8), 0xfacc15, x + 1.5, Y, z, 0, 0, 0, 0.06, 1.2, 0.06); w.add('l', sph(10), 0x4ade80, x + 1.5, Y + 1.25, z, 0, 0, 0, 0.1, 0.1, 0.1, 0.8);
    w.I({ id: 'elevDomeUp', kind: 'elev', x, y: Y, z, r: 1.3, label: '⬆️ Freight lift back up to Robotics', to: [14.5, 0.05, -21.8], yaw: 0 }); }
  w.secrets.push({ id: 'dome', x: cx, y: Y, z: cz, r: 6, msg: '🌵 You found the hidden Desert Dome!' });
  gearC(w, cx + 8, Y + 0.6, cz - 7); gearC(w, cx - 10, Y + 4.5, cz - 6); gearC(w, cx + 11 + 1.6, Y + 4.8, cz - 9 + 0.3);
}
// ------------------------------------------------------------------------------------------------ outdoor test yard (live tests)
function testYard(w) {
  // concrete apron + test pads
  floor(w, -60, -116, 60, -46, 'tile', 0.02, 0xcfa774, 0xc49a66, 6);
  sign3d(w, 'TEST YARD', 0, HR + 0.7, -44.6, PI, 0.6, 0xffffff, 0xef4444);
  // outdoor bleachers facing north
  // grandstands: 4 stepped rows with seat backs, railings, a striped canopy and flags on top
  [-1, 1].forEach((sd) => { const cx = sd * 16;
    for (let r = 0; r < 4; r++) { const z = -51.6 + r * 1.3, h = 0.45 + r * 0.5; w.slab('g', [0x4f9dff, 0xffd23f, 0xff4fa0, 0x3ddc84][r], cx, 0, z, 10, h, 1.3, 0.1, { cam: false });
      for (let k = 0; k < 8; k++) w.add('g', rbox(0.9, 0.42, 0.1, 0.05), [0xffffff, 0xff8ad8][(k + r) % 2], cx - 4.4 + k * 1.25, h + 0.21, z + 0.55); }
    [-5, 5].forEach((dx) => { w.add('x', cyl(10), 0xe5e7eb, cx + dx, 0, -47.4, 0, 0, 0, 0.1, 5.4, 0.1); w.add('x', cyl(10), 0xe5e7eb, cx + dx, 0, -52.6, 0, 0, 0, 0.1, 4.4, 0.1); });
    for (let k = 0; k < 6; k++) w.add('f', rbox(1.7, 0.1, 5.8, 0.04), k % 2 ? 0xffffff : 0xff4fa0, cx - 4.2 + k * 1.68, 4.7, -50, 0.18, 0, 0);
    w.add('x', tube([[cx - 5, 1.0, -52.2], [cx + 5, 1.0, -52.2]], 0.05, 4, 6), 0xffffff, 0, 0, 0); for (let k = 0; k <= 8; k++) w.add('x', cyl(6), 0xffffff, cx - 5 + k * 1.25, 0.45, -52.2, 0, 0, 0, 0.03, 0.55, 0.03);
    [-5, 0, 5].forEach((dx, i) => { w.add('x', cyl(6), 0xffffff, cx + dx, 5.1, -47.4, 0, 0, 0, 0.03, 1.6, 0.03); w.add('g', cone(3), BR[(i + (sd > 0 ? 3 : 0)) % 8], cx + dx + 0.35, 5.6, -47.4, 0, 0, -PI / 2, 0.25, 0.7, 0.04); }); });
  // ROBOT TRIALS start arch (big and high so it reads over the player's head)
  { const z = -61; [-3, 3].forEach((x) => { w.add('x', rbox(0.5, 4.6, 0.5, 0.1), 0x64748b, x, 2.3, z); w.solid(x - 0.25, 0, z - 0.25, x + 0.25, 4.6, z + 0.25); }); w.add('x', rbox(6.8, 0.9, 0.5, 0.15), 0x334155, 0, 4.6, z);
    sign3d(w, 'ROBOT TRIALS', 0, 4.6, z + 0.28, 0, 0.42, 0xffd23f, null); for (let k = 0; k < 7; k++) w.add('l', sph(8), [0xff4fa0, 0x3ff0ff, 0xffd23f][k % 3], -2.7 + k * 0.9, 5.12, z + 0.2, 0, 0, 0, 0.09, 0.09, 0.09, 0.8);
    [[-3, 1], [3, -1]].forEach(([x, s2]) => w.add('g', rbox(0.4, 0.4, 0.06, 0.04), 0xffffff, x, 3.6, z + 0.28)); }
  // outdoor VIEWING PAVILION: a glass-fronted booth with a bench, so you can watch the rocket pad up close
  { const x = -42, z = -55, Wd = 7, Dp = 4; w.slab('m', 0xf8fafc, x, 0, z, Wd, 0.08, Dp, 0.03); [-1, 1].forEach((s2) => w.slab('g', 0xff8ad8, x + s2 * (Wd / 2 - 0.15), 0, z, 0.3, 3, Dp, 0.06));
    w.add('e', rbox(Wd - 0.6, 2.2, 0.08, 0.02), 0xcfefff, x, 1.55, z - Dp / 2 + 0.1); w.solid(x - Wd / 2, 0.25, z - Dp / 2, x + Wd / 2, 2.7, z - Dp / 2 + 0.2, { glass: true });
    w.add('x', rbox(Wd - 0.5, 0.12, 0.14, 0.03), 0xffffff, x, 0.4, z - Dp / 2 + 0.1); w.add('x', rbox(Wd - 0.5, 0.12, 0.14, 0.03), 0xffffff, x, 2.68, z - Dp / 2 + 0.1);
    w.add('f', rbox(Wd + 0.6, 0.25, Dp + 0.6, 0.08), 0xff4fa0, x, 3.1, z); w.solid(x - Wd / 2 - 0.3, 2.98, z - Dp / 2 - 0.3, x + Wd / 2 + 0.3, 3.23, z + Dp / 2 + 0.3);
    bench(w, x, z + 0.6, PI); bench(w, x - 2, z + 0.6, PI); w.add('l', rbox(2.5, 0.05, 0.4, 0.02), 0xfff4dc, x, 2.95, z, 0, 0, 0, 1, 1, 1, 0.8);
    sign3d(w, 'VIEWING PAVILION', x, 3.45, z - Dp / 2 - 0.25, 0, 0.22, 0xffffff, 0xff4fa0); w.add('x', cyl(10), 0x334155, x + 2.4, 1.0, z - 1.4, PI / 2.4, 0, 0, 0.12, 0.6, 0.12); w.add('x', cyl(8), 0x64748b, x + 2.4, 0.5, z - 1.2, 0, 0, 0, 0.04, 0.6, 0.04); }
  // grass borders + bushes + flower beds inside the fence so the yard isn't all concrete
  [[-60, -116, -55, -46], [55, -116, 60, -46], [-55, -116, 55, -112]].forEach(([x0, z0, x1, z1]) => { w.add('f', rbox(x1 - x0, 0.06, z1 - z0, 0.02), 0x5fcf55, (x0 + x1) / 2, 0.05, (z0 + z1) / 2); w.add('x', rbox(x1 - x0, 0.12, 0.12, 0.03), 0xffffff, (x0 + x1) / 2, 0.08, z1 > -50 ? z0 : z1); });
  for (let i = 0; i < 9; i++) { bush(w, -57.5, -110 + i * 7, 1.1); bush(w, 57.5, -107 + i * 7, 1.0); } for (let i = 0; i < 7; i++) flowerBed(w, -48 + i * 15, -115.4, -42 + i * 15, -113.2);
  // flag poles around the yard
  for (let i = 0; i < 6; i++) [-58.6, 58.6].forEach((x, j) => { const z = -108 + i * 11; w.add('x', cyl(8), 0xe5e7eb, x, 0, z, 0, 0, 0, 0.07, 6, 0.07); w.add('g', rbox(1.6, 1.0, 0.04, 0.02), BR[(i + j * 3) % 8], x + (j ? -0.85 : 0.85), 5.4, z); w.add('x', sph(8), 0xffd23f, x, 6.05, z, 0, 0, 0, 0.12); });
  // more test props: crash-test cheese dummies, tyre stacks, a jump ramp, barrels and painted target circles
  [[8, -66], [-8, -70], [14, -86]].forEach(([x, z], i) => { w.add('x', cyl(8), 0x64748b, x, 0, z, 0, 0, 0, 0.06, 1.1, 0.06); w.add('g', wedge(), 0xffc93c, x, 1.1, z, 0, i, 0, 0.6, 0.6, 0.45); w.add('g', sph(10), 0x111827, x + 0.1, 1.5, z + 0.25, 0, 0, 0, 0.06); w.add('g', rcyl(0.5, 0.08, 0.03, 20), 0x334155, x, 0, z); });
  [[-20, -62], [-18.6, -62.4], [-19.3, -61.2], [30, -76], [31.3, -76.2]].forEach(([x, z], i) => { for (let k = 0; k < (i % 2 ? 2 : 3); k++) w.add('m', torus(0.42, 20), 0x1f2937, x, 0.2 + k * 0.32, z, PI / 2, 0, 0, 0.6, 0.6, 0.6); w.solid(x - 0.6, 0, z - 0.6, x + 0.6, 0.3 + (i % 2 ? 2 : 3) * 0.32, z + 0.6); });
  { const T = w.tf(10, 0, -100, 0); T.add('g', wedge(), 0xff8a3d, 0, 0, 0, 0, PI / 2, 0, 2.4, 1.2, 3.0); T.box('x', 0xffffff, 0, 0.62, 0, 0.1, 0.02, 2.8, 0.01); }
  [[-36, -66], [-35, -66.6], [50, -80], [50.9, -80.6], [-50, -100]].forEach(([x, z], i) => { w.add('g', rcyl(0.45, 1.2, 0.08, 20), [0xef4444, 0x3b82f6, 0xfacc15][i % 3], x, 0, z); w.add('x', torus(0.08, 20), 0xffffff, x, 0.6, z, PI / 2, 0, 0, 0.47, 0.47, 0.47); w.solid(x - 0.45, 0, z - 0.45, x + 0.45, 1.2, z + 0.45); });
  [[-12, -88, 0xff4fa0], [-45, -90, 0x3b82f6], [10, -54.5, 0xfacc15]].forEach(([x, z, c]) => { w.add('f', torus(0.08, 48), c, x, 0.06, z, PI / 2, 0, 0, 3, 3, 1); w.add('f', torus(0.08, 40), 0xffffff, x, 0.06, z, PI / 2, 0, 0, 1.8, 1.8, 1); });
  // rocket gantry
  { const x = -30, z = -82; w.add('x', rcyl(4, 0.5, 0.1, 40), 0x475569, x, 0, z); w.solid(x - 4, 0, z - 4, x + 4, 0.5, z + 4); hazard(w, x, z + 5, 8, 0.5);
    for (let i = 0; i < 4; i++) w.add('x', cyl(8), 0xef4444, x + 3.2 + (i % 2) * 1.2, 0.5, z - 0.6 + (i >> 1) * 1.2, 0, 0, 0, 0.12, 12, 0.12); for (let y = 2; y < 12; y += 2) w.add('x', rbox(1.4, 0.15, 1.4, 0.04), 0xef4444, x + 3.8, y, z); w.solid(x + 3, 0, z - 0.8, x + 4.6, 12, z + 0.8);
    w.spots.rocket = [x, 0.5, z]; sign3d(w, 'ROCKET PAD', x, 0.6, z + 4.6, 0, 0.35, 0xffffff, 0xef4444); }
  // robot obstacle course for Clanky Jr.
  { w.add('m', rbox(4, 0.06, 34, 0.02), 0x334155, 0, 0.04, -78); for (let z = -94; z < -62; z += 2) w.add('g', rbox(0.15, 0.02, 1, 0.01), 0xffffff, 0, 0.08, z);
    [-88, -80, -72].forEach((z, i) => { w.add('g', rbox(4, 0.5, 1.2, 0.2), BR[i], 0, 0.25, z); }); for (let z = -93; z < -62; z += 3) { K.cone3(w, -2.4, z); K.cone3(w, 2.4, z); }
    w.spots.course = [0, 0.05, -62, -95]; }
  // catapult + target
  { w.spots.catapult = [24, 0, -66]; w.spots.target = [24, 0, -104]; const x = 24, z = -104; for (let i = 0; i < 4; i++) w.add('g', rcyl(3.2 - i * 0.75, 0.12, 0.04, 40), i % 2 ? 0xffffff : 0xef4444, x, 0.04 + i * 0.03, z); sign3d(w, 'CHEESE CATAPULT', x, 0.6, -62.4, 0, 0.3, 0x7c2d12, 0xffd23f); }
  // goo cannon range + splat wall
  { w.spots.cannon = [-12, 0, -96]; const x = -12, z = -112; w.slab('g', 0xffffff, x, 0, z, 10, 4, 0.8, 0.1); w.spots.splatWall = [x, 2, z + 0.45]; sign3d(w, 'GOO CANNON', x, 4.2, z + 0.42, 0, 0.35, 0x16a34a, null); }
  // fizz bomb crater
  { const x = 40, z = -92; w.add('m', lathe([[0, -0.3], [3, -0.1], [4.4, 0.35], [5.0, 0.2], [5.2, 0]], 40, 'crater'), 0xa8a29e, x, 0, z); w.spots.fizz = [x, 0, z]; for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; K.cone3(w, x + Math.cos(a) * 6.5, z + Math.sin(a) * 6.5); } sign3d(w, 'FIZZ BOMB ZONE', x, 0.6, z + 7.4, 0, 0.3, 0xffffff, 0xa855f7); }
  // safety bunker with a viewing slit
  { const x = 45, z = -62; w.slab('m', 0x9ca3af, x, 0, z, 6, 2.6, 4, 0.4); w.add('g', rbox(6.2, 0.2, 4.2, 0.08), 0xfacc15, x, 2.6, z); w.add('x', rbox(4, 0.3, 0.1, 0.03), 0x111827, x, 1.9, z - 2.0); sign3d(w, 'BUNKER', x, 2.9, z + 2.05, 0, 0.3, 0x111827, null); }
  // test-yard outdoor fence + lamp towers + cheese-wheel scatter
  fenceRun(w, 'z', -60, -116, -47, 1.4, 0xfacc15); fenceRun(w, 'z', 60, -116, -47, 1.4, 0xfacc15); fenceRun(w, 'x', -116, -60, 60, 1.4, 0xfacc15);
  [[-55, -55], [55, -55], [-55, -110], [55, -110]].forEach(([x, z]) => { w.add('x', cyl(10), 0x64748b, x, 0, z, 0, 0, 0, 0.18, 9, 0.18); w.add('l', rbox(1.8, 0.8, 0.4, 0.1), 0xfff7c2, x, 9.2, z, 0, 0, 0, 1, 1, 1, 0.5); });
  for (let i = 0; i < 6; i++) rock(w, -50 + i * 18, -114 + (i % 2) * 2, 0.9);
  gearC(w, -30 + 3.8, 12.5, -82); gearC(w, 0, 0.9, -80); gearC(w, 45, 3.2, -62); gearC(w, 40, 0.6, -92);
}
