// Grok Pickleball Park - DLC #65: DRIVE DILLERS EXPANSION (75 tickets, grokDLC.pickleballpark.drive_dillers_expansion)
// Walk-in indoor pickleball center ("Drive Dillers") featuring:
//  - 3 regulation indoor courts: Dill Court 1 (Emerald Rec), Dill Court 2 (Silent Serve Foam), Drive Dillers Center Stage (Championship)
//  - Cute Snowie cameo as Drive Dillers Tournament Director + cameos of Luna, Pi-rat, Candy & Torty inside the center!
//  - Indoor Ball Bar & Silent Serve Foam Testing Station (26-hole indoor balls + Silent Serve yellow foam balls + Drive Dillers Pro 26)
//  - Multi-court Drive Dillers Indoor Tournament where you travel court-to-court and each round gets harder!
//  - Densely stocked lobby, Trophy Hall, Dill-ight Smoothie Bar, Candy's Quiet Foam Lounge, Pro Lockers & cheering bleachers.
import * as K from './kit.js?v=ppk2';
import { rbox } from './world.js?v=ppk2';
import { txt, poster, clockW, pendant, planter, trash } from './art.js?v=ppk2';
import { PAL, court, paddleProp, hopper, ballBucket, fence, bleachers, umpireChair, scoreFrame } from './court.js?v=ppk2';
import { shell, part, onSide } from './bld.js?v=ppk2';
import { dillersOwned } from './dlc.js?v=ppk2';

const { rcyl, lathe, sph, cyl, torus, capsule } = K;
const PI = Math.PI;

function signPost(w, x, z, ry, word, col = 0x0f766e, sub) {
  const T = w.tf(x, 0, z, ry);
  [-0.9, 0.9].forEach((a) => T.add('x', cyl(10), 0x334155, a, 0, 0, 0, 0, 0, 0.05, 2.2, 0.05));
  T.box('g', col, 0, 1.4, 0, 2.3, 0.9, 0.1, 0.05);
  txt(w, word, ...T.P(0, 1.88 - (sub ? 0 : 0.12), 0.06), ry, Math.min(0.22, 2.1 / word.length * 1.25), 0xffffff, 'g');
  if (sub) txt(w, sub, ...T.P(0, 1.55, 0.06), ry, Math.min(0.14, 2.1 / sub.length * 1.3), 0xe6ff3b, 'g');
  T.solid(-1.1, 0, -0.1, 1.1, 2.3, 0.1);
}

function pend(w, x, z, col = 0x0d9488, y = 4.6) {
  const r = w.region;
  if (r.startsWith('in_')) w.region = 'roof_' + r.slice(3);
  pendant(w, x, z, col, y);
  w.region = r;
}

export function buildDillers(w, { SPOTS, SEATS, SITS, STANDS, RES }) {
  // Reserve Drive Dillers footprint & avenue so random park trees never spawn inside or across the entrance path
  RES.push([4, 33, 53, 43], [50, 24, 98, 76], [69, 21, 79, 27], [43, 53, 53, 61]);

  w.region = 'out';
  // Tiled Avenue from Grand Promenade (x=3.5, z=38) to Drive Dillers West Main Entrance (x=52, z=38)
  K.floor(w, 3.5, 35.5, 52.5, 40.5, 'tile', 0.022, 0xd1fae5, 0xa7f3d0, 1.5);
  w.slab('r', 0x0d9488, 28, 0.01, 35.3, 48, 0.04, 0.35, 0.01);
  w.slab('r', 0x0d9488, 28, 0.01, 40.7, 48, 0.04, 0.35, 0.01);
  // Avenue lamp posts, benches & flower planters
  for (const x of [14, 28, 42]) {
    K.lampPost(w, x, 34.3);
    K.lampPost(w, x, 41.7);
    planter(w, x + 5, 34.2, 2.2, 0, 0x34d399);
    planter(w, x + 5, 41.8, 2.2, PI, 0xfde047);
  }
  K.bench(w, 21, 34.2, 0, 0x0d9488);
  K.bench(w, 35, 41.8, PI, 0x0d9488);
  signPost(w, 6.5, 34.0, -0.25, 'DRIVE DILLERS ->', 0x065f46, 'INDOOR CENTER & TOURNEY');

  if (!dillersOwned()) {
    // Locked teaser gate at the end of Drive Dillers Avenue when DLC #65 is not owned yet
    w.slab('r', 0x115e59, 50.5, 0, 38, 3.2, 0.12, 6.2, 0.04, { floor: true });
    signPost(w, 50.5, 38, -PI / 2, 'DRIVE DILLERS DLC', 0x0f766e, '75 TICKETS IN ARCADE');
    SPOTS.dillersGate = [48.8, 38];
    return;
  }

  // North walkway connecting Court Row (z=22) to Drive Dillers North Entrance (x=74, z=26)
  K.floor(w, 71, 22, 77, 26.5, 'tile', 0.022, 0xd1fae5, 0xa7f3d0, 1.5);
  signPost(w, 69.2, 23.2, 0, 'DRIVE DILLERS', 0x065f46, 'INDOOR COURTS 1-3');
  // West-South walkway connecting Pro Shop promenade (x=44, z=57) to Drive Dillers Lounge Door (x=52, z=57)
  K.floor(w, 44, 54.5, 52.5, 59.5, 'tile', 0.022, 0xd1fae5, 0xa7f3d0, 1.5);

  // ---------------- BUILDING SHELL ----------------
  // 44m wide (x: 52..96) x 48m deep (z: 26..74) x 7.6m tall indoor pickleball center
  const b = shell(w, {
    id: 'dillers',
    name: '🏟️ Drive Dillers Indoor Center',
    x0: 52, z0: 26, x1: 96, z1: 74, h: 7.6,
    wall: 0xd1fae5, trim: 0x0f766e, roof: 0x115e59,
    floor: 'wood', fc1: 0xd9a066,
    doors: [
      { side: 'w', at: 38, w: 3.6 },
      { side: 'w', at: 57, w: 3.0 },
      { side: 'n', at: 74, w: 3.4 },
    ],
    win: { n: 4, s: 4, w: 4, e: 3 },
  });

  // ---------------- EXTERIOR FACADE & ROOF MONUMENT ----------------
  w.region = 'out';
  onSide(w, b, 'w', () => {
    // West Grand Canopy over main entrance (x=52, z=38)
    w.add('g', rbox(2.2, 0.34, 10.2, 0.08, 2), 0x0f766e, 50.8, 3.9, 38);
    w.add('l', rbox(2.26, 0.1, 10.26, 0.03, 1), 0x34d399, 50.8, 4.1, 38, 0, 0, 0, 1, 1, 1, 0.55);
    // Exterior neon sign on West facade facing the Promenade
    w.add('g', rbox(0.22, 1.55, 14.2, 0.06, 2), 0x064e3b, 51.68, 5.5, 38);
    w.add('l', rbox(0.24, 1.62, 14.3, 0.04, 1), 0x10b981, 51.7, 5.5, 38, 0, 0, 0, 1, 1, 1, 0.35);
    txt(w, 'DRIVE DILLERS', 51.52, 5.65, 38, -PI / 2, 0.54, 0xe6ff3b, 'l', 0.4);
    txt(w, 'INDOOR PICKLEBALL & TOURNAMENT ARENA', 51.52, 4.98, 38, -PI / 2, 0.2, 0xffffff, 'g');
    // Giant 26-Hole Orange Indoor Ball & Silent Serve Yellow Foam Ball on the West Canopy!
    w.add('g', sph(20), 0xff8a1f, 50.8, 4.85, 34.2, 0, 0, 0, 0.68);
    w.add('g', sph(20), 0xfde047, 50.8, 4.85, 41.8, 0, 0, 0, 0.68);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * PI * 2;
      w.add('m', sph(8), 0x7c2d12, 50.8 + Math.cos(a) * 0.58, 4.85 + Math.sin(a) * 0.25, 34.2 + Math.sin(a) * 0.52, 0, 0, 0, 0.09);
    }
    paddleProp(w, 50.75, 4.75, 38, 0, 0.35, 0x10b981, 2.4, 0xe6ff3b, true);
    // Lounge Entrance sign at z=57
    w.add('g', rbox(1.5, 0.3, 5.2, 0.06, 2), 0x0f766e, 51.1, 3.7, 57);
    txt(w, 'SMOOTHIE LOUNGE & LOCKERS', 51.55, 4.3, 57, -PI / 2, 0.22, 0xe6ff3b, 'l', 0.3);
  });
  onSide(w, b, 'n', () => {
    w.add('g', rbox(7.6, 0.3, 1.8, 0.06, 2), 0x0f766e, 74, 3.8, 25.0);
    txt(w, 'DRIVE DILLERS NORTH GATE', 74, 4.45, 25.68, PI, 0.28, 0xe6ff3b, 'l', 0.3);
  });
  // Exterior welcome planters & trash can
  K.potPlant(w, 50.4, 0, 32.5, 1.3, 0x0f766e);
  K.potPlant(w, 50.4, 0, 43.5, 1.3, 0x0f766e);
  trash(w, 50.5, 35.2, 0x0f766e);

  // ---------------- INTERIOR PARTITIONS ----------------
  // Partition wall separating West Lobby/Lounge (x: 52..64.2) from the 3-Court Arena Hall (x: 64.2..96)
  // Three wide doorways at z=33.5, z=43.5, and z=59.5
  part(w, b, 'z', 64.2, 26, 74, [33.5, 43.5, 59.5], 0xecfdf5, 3.8);
  // Partition wall between North Lobby (z: 26..50) and South Smoothie Lounge & Lockers (z: 50..74)
  part(w, b, 'x', 50.0, 52, 64.2, [58.2], 0xecfdf5, 3.8);

  w.region = 'in_dillers';
  // Distinct flooring for Lobby (emerald carpet) & Smoothie Lounge (warm checker tile) while Arena Hall stays maple wood!
  K.floor(w, 52.3, 26.3, 64.0, 49.8, 'carpet', 0.08, 0x065f46, 0x047857, 1.6);
  K.floor(w, 52.3, 50.2, 64.0, 73.7, 'tile', 0.08, 0xfef3c7, 0xd1fae5, 1.6);

  // ================ ZONE 1: LOBBY, SNOWIE'S TOURNAMENT DESK, INDOOR BALL BAR & TROPHY HALL ================
  // 1A. Snowie's Drive Dillers Check-In & Tournament Desk (x=58.5, z=38.0)
  {
    const cx = 58.5, cz = 38.0;
    // Emerald & maple tournament counter facing the West Main Doors
    w.slab('g', 0x0f766e, cx, 0.08, cz, 1.4, 1.05, 5.4, 0.08);
    w.slab('g', 0xfef3c7, cx, 1.13, cz, 1.58, 0.09, 5.6, 0.03, false);
    w.add('l', rbox(0.06, 0.14, 5.2, 0.02, 1), 0x34d399, cx - 0.72, 0.94, cz, 0, 0, 0, 1, 1, 1, 0.6);
    txt(w, 'TOURNAMENT CHECK-IN', cx - 0.74, 0.58, cz, -PI / 2, 0.2, 0xe6ff3b, 'g');
    // Check-in monitors, golden bell, mini indoor ball pyramid on desk
    const Td = w.tf(cx, 0, cz, -PI / 2);
    K.monitor(w, Td, -1.5, 1.22, -0.1, 0, 0x38bdf8);
    K.monitor(w, Td, 1.5, 1.22, -0.1, 0, 0x34d399);
    w.add('x', sph(12), 0xfacc15, cx - 0.25, 1.26, cz - 0.55, 0, 0, 0, 0.09, 0.07, 0.09);
    for (let i = 0; i < 4; i++) {
      w.add('g', sph(12), 0xff8a1f, cx - 0.25, 1.25 + (i === 3 ? 0.09 : 0), cz + 0.55 + (i % 3 - 1) * 0.1, 0, 0, 0, 0.055);
      w.add('g', sph(12), 0xfde047, cx - 0.25, 1.25 + (i === 3 ? 0.09 : 0), cz + 0.95 + (i % 3 - 1) * 0.1, 0, 0, 0, 0.055);
    }
    // Cute Snowie's Elevated Director Podium right beside/in front of the desk so she's front-and-center!
    const sx = 57.2, sz = 41.3;
    w.slab('g', 0xf472b6, sx, 0.08, sz, 1.35, 0.42, 1.35, 0.06);
    w.slab('f', 0xfdf2f8, sx, 0.5, sz, 1.15, 0.06, 1.15, 0.03, false);
    w.add('x', torus(0.52, 20), 0xfacc15, sx, 0.54, sz, PI / 2, 0, 0, 0.05);
    txt(w, 'DIRECTOR SNOWIE', sx - 0.7, 0.28, sz, -PI / 2, 0.12, 0xffffff, 'g');
    paddleProp(w, cx, 1.25, cz, -PI / 2, 0.25, 0x10b981, 1.2, 0xfacc15, true);
    // Wall backdrop behind Snowie's desk (on partition wall x=64.2, z=38.0)
    w.add('g', rbox(0.14, 2.3, 4.8, 0.04, 1), 0x064e3b, 63.95, 2.35, cz);
    w.add('l', rbox(0.16, 2.38, 4.88, 0.03, 1), 0x34d399, 63.97, 2.35, cz, 0, 0, 0, 1, 1, 1, 0.4);
    txt(w, 'WELCOME TO DRIVE DILLERS!', 63.84, 3.1, cz, -PI / 2, 0.2, 0xe6ff3b, 'l', 0.3);
    txt(w, 'DIRECTOR SNOWIE', 63.84, 2.6, cz, -PI / 2, 0.24, 0xf9a8d4, 'l', 0.3);
    txt(w, '3 INDOOR COURTS · TOURNAMENT', 63.84, 2.1, cz, -PI / 2, 0.16, 0xffffff, 'g');
    txt(w, '26-HOLE & SILENT SERVE FOAM', 63.84, 1.7, cz, -PI / 2, 0.15, 0xfde047, 'g');
    SPOTS.dillersDesk = [56.8, 38.0];
    SPOTS.snowieDillers = [sx, sz];
  }

  // 1B. Indoor Ball Bar, Silent Serve Foam Testing Lab & Luna + Torty Cameos (x: 52.8..63.2, z: 26.6..32.5)
  {
    const bx = 56.2, bz = 26.85;
    w.slab('m', 0x1e293b, bx, 0.08, bz, 5.2, 2.3, 0.65, 0.04);
    w.add('l', rbox(5.0, 0.12, 0.68, 0.02, 1), 0x38bdf8, bx, 2.34, bz, 0, 0, 0, 1, 1, 1, 0.6);
    txt(w, 'INDOOR BALL BAR · FREE TEST SAMPLES', bx, 2.65, bz + 0.18, 0, 0.16, 0xe6ff3b, 'l', 0.3);
    for (let s = 0; s < 3; s++) {
      const sy = 0.56 + s * 0.56;
      w.slab('m', 0x475569, bx, sy, bz + 0.05, 4.9, 0.06, 0.55, 0.02, false);
      const col = s === 0 ? 0xff8a1f : s === 1 ? 0xfde047 : 0x34d399;
      for (let i = 0; i < 12; i++) {
        w.add('g', sph(12), col, bx - 2.1 + i * 0.38, sy + 0.12, bz + 0.12, 0, 0, 0, 0.075);
      }
    }
    // Interactive Free Sample Buckets of 26-Hole Indoor, Silent Serve Foam & Drive Dillers Pro 26 Balls!
    ballBucket(w, 55.2, 0.08, 28.1, 0xff8a1f, 14);
    ballBucket(w, 56.2, 0.08, 28.1, 0xfde047, 14);
    ballBucket(w, 57.2, 0.08, 28.1, 0x34d399, 14);
    SPOTS.dillersBalls = [56.2, 29.2];

    // Luna's Spin & Quiet-Foam Decibel Testing Table (x=61.0, z=27.6)
    const lx = 61.0, lz = 27.6;
    w.slab('m', 0x0f766e, lx, 0.08, lz, 2.8, 0.88, 1.1, 0.05);
    w.slab('g', 0xe2e8f0, lx, 0.96, lz, 2.9, 0.06, 1.2, 0.02, false);
    w.add('e', rcyl(0.22, 1.1, 0.02, 18), 0xbae6fd, lx - 0.65, 1.0, lz);
    w.add('g', sph(12), 0xfde047, lx - 0.65, 1.48, lz, 0, 0, 0, 0.08);
    w.add('g', sph(12), 0xff8a1f, lx - 0.65, 1.2, lz, 0, 0, 0, 0.08);
    const Tl = w.tf(lx, 0, lz, 0);
    K.monitor(w, Tl, 0.45, 1.02, 0, 0, 0x22c55e);
    w.add('g', rbox(2.6, 0.85, 0.1, 0.03, 1), 0x0f172a, lx, 2.05, 26.45);
    txt(w, 'SILENT SERVE FOAM: 42 dB', lx, 2.2, 26.52, 0, 0.14, 0xfde047, 'l', 0.3);
    txt(w, 'ZERO CLACK · REAL BOUNCE!', lx, 1.9, 26.52, 0, 0.12, 0x34d399, 'g');
    SPOTS.lunaDillers = [61.0, 29.0];

    // Torty's Drive Diller Pro Paddle Wall on West Lobby Wall (x=52.4, z=31.2)
    w.add('m', rbox(0.12, 2.2, 3.6, 0.03, 1), 0x1e293b, 52.38, 2.1, 31.2);
    txt(w, 'DRIVE DILLER PRO RACK', 52.48, 2.95, 31.2, PI / 2, 0.16, 0xe6ff3b, 'l', 0.3);
    [0x10b981, 0xef4444, 0x2dd4bf, 0xfcd34d, 0x38bdf8].forEach((c, i) => {
      paddleProp(w, 52.5, 1.85, 29.8 + i * 0.7, PI / 2, 0, c, 1.25, 0x111827, true);
    });
    SPOTS.tortyDillers = [53.6, 31.2];
  }

  // 1C. Drive Dillers Hall of Champions, Trophy Case & Live Tournament Bracket Board (x: 53.0..63.5, z: 43.5..49.5)
  {
    const tx = 56.8, tz = 48.4;
    w.slab('m', 0x5c3a1e, tx, 0.08, tz, 4.2, 0.9, 1.1, 0.05);
    w.add('e', rbox(4.0, 1.4, 0.95, 0.03, 1), 0xdbeafe, tx, 1.68, tz);
    w.slab('m', 0x5c3a1e, tx, 2.38, tz, 4.25, 0.14, 1.15, 0.03, false);
    // Golden Dill Pickle Cup + flanking trophies
    [-1.2, 0, 1.2].forEach((dx, i) => {
      const s = i === 1 ? 1.55 : 1.05, col = i === 1 ? 0xfacc15 : i === 0 ? 0x38bdf8 : 0xf472b6;
      w.add('x', rcyl(0.12 * s, 0.06 * s, 0.02, 16), 0x7c4a1e, tx + dx, 0.98, tz);
      w.add('x', cyl(10), col, tx + dx, 0.98 + 0.06 * s, tz, 0, 0, 0, 0.025 * s, 0.14 * s, 0.025 * s);
      w.add('x', lathe([[0, 0], [0.04, 0], [0.12, 0.08], [0.14, 0.22], [0.13, 0.24], [0, 0.12]], 20, 'cup'), col, tx + dx, 0.98 + 0.2 * s, tz, 0, 0, 0, s, s, s);
    });
    w.add('g', capsule(12), 0x10b981, tx, 1.9, tz, 0, 0, 0, 0.11, 0.24, 0.11);
    txt(w, 'GOLDEN DILL CUP · HALL OF CHAMPIONS', tx, 2.7, tz, PI, 0.15, 0xe6ff3b, 'l', 0.3);

    // Interactive Indoor Tournament Bracket Board on the South-Lobby Wall (x=61.6, z=49.7)
    w.add('g', rbox(3.4, 2.1, 0.14, 0.04, 1), 0x0f172a, 61.6, 2.15, 49.75);
    w.add('l', rbox(3.48, 2.18, 0.1, 0.03, 1), 0xfacc15, 61.6, 2.15, 49.77, 0, 0, 0, 1, 1, 1, 0.45);
    txt(w, 'DRIVE DILLERS TOURNAMENT', 61.6, 2.9, 49.64, PI, 0.17, 0xe6ff3b, 'l', 0.3);
    txt(w, 'R1: DILL COURT 1 (EASY)', 61.6, 2.45, 49.64, PI, 0.14, 0x34d399, 'g');
    txt(w, 'R2: DILL COURT 2 (HARD)', 61.6, 2.05, 49.64, PI, 0.14, 0x38bdf8, 'g');
    txt(w, 'FINAL: CENTER STAGE (PRO)', 61.6, 1.65, 49.64, PI, 0.14, 0xf472b6, 'g');
    SPOTS.dillersBracket = [61.6, 48.2];
  }

  // ================ ZONE 2: DILL-IGHT SMOOTHIE BAR, CANDY'S FOAM LOUNGE & PRO LOCKERS (z: 50.2..73.5) ================
  {
    // 2A. Candy's Quiet Foam Lounge (x: 53.5..59.0, z: 53.0..63.5)
    K.rug(w, 56.2, 60.0, 0, 4.4, 5.2, 0x065f46, 0x34d399);
    K.sofa(w, 56.2, 62.4, PI, 0x0d9488, 0x5eead4, 20);
    K.sofa(w, 53.8, 60.0, PI / 2, 0x0d9488, 0x5eead4, 18);
    K.tableR(w, 56.4, 60.0, 0.75, 0.55, 0xfef3c7);
    SITS.push({ x: 56.2, y: 0.45, z: 62.2, ry: PI, name: 'Player' }, { x: 53.9, y: 0.45, z: 60.0, ry: PI / 2, name: 'Player' });
    // Candy's Plush Silent Serve Foam Ball Basket + Candy Cameo Spot!
    w.slab('f', 0xf472b6, 58.0, 0.08, 53.8, 1.3, 0.16, 1.3, 0.05, false);
    ballBucket(w, 56.8, 0.08, 53.5, 0xfde047, 16);
    poster(w, 'x', 50.25, 55.8, 2.2, 2.6, 1.2, 0x065f46, 1, 'CANDY FOAM LOUNGE', 0xfde047);
    // Lola (Courts Manager) & Candy (Ball Guard Dog) desk & guard station at the Arena Hall entrance (x=66.0, z=44.5)!
    w.slab("g", 0x065f46, 65.8, 0.06, 46.8, 1.5, 0.98, 2.2, 0.06);
    w.slab("m", 0xfef3c7, 65.8, 1.04, 46.8, 1.62, 0.08, 2.35, 0.03, false);
    ballBucket(w, 65.8, 0.06, 48.3, 0xfde047, 14);
    w.add("g", rbox(0.14, 1.85, 4.6, 0.04, 1), 0x7f1d1d, 64.42, 2.55, 47.2);
    w.add("l", rbox(0.16, 1.92, 4.68, 0.03, 1), 0xfacc15, 64.4, 2.55, 47.2, 0, 0, 0, 1, 1, 1, 0.45);
    txt(w, "COURTS MANAGER LOLA & CANDY", 64.54, 3.15, 47.2, PI / 2, 0.17, 0xfde047, "l", 0.35);
    txt(w, "INDOOR & SILENT SERVE FOAM ONLY!", 64.54, 2.68, 47.2, PI / 2, 0.16, 0xffffff, "g");
    txt(w, "NO 40-HOLE OUTDOOR BALLS ALLOWED!", 64.54, 2.25, 47.2, PI / 2, 0.14, 0xfca5a5, "g");
    txt(w, "CANDY WILL STEAL IT & LOLA KICKS YOU OUT!", 64.54, 1.88, 47.2, PI / 2, 0.12, 0xe6ff3b, "g");
    SPOTS.lolaDillers = [65.8, 45.2];
    SPOTS.candyDillers = [66.2, 43.4];

    // 2B. Pro Athlete Locker Row along x=63.5 (z: 52.0..58.0)
    for (let i = 0; i < 8; i++) {
      const lz = 52.0 + i * 0.72;
      w.slab('m', i % 2 ? 0x0f766e : 0x115e59, 63.6, 0.08, lz, 0.65, 2.05, 0.68, 0.02);
      w.add('x', rbox(0.03, 0.18, 0.04, 0.01, 1), 0xfacc15, 63.24, 1.15, lz + 0.18);
    }
    K.bench(w, 61.2, 55.0, -PI / 2, 0x92400e);
    K.cooler(w, 63.4, 63.5);
    K.vending(w, 63.4, 66.2, -PI / 2, 0x10b981);

    // 2C. Dill-ight Indoor Smoothie & Juice Bar (x: 54.0..61.5, z: 69.0..73.4)
    const sx = 57.6, sz = 71.0;
    w.slab('g', 0x065f46, sx, 0.08, sz, 5.4, 1.05, 1.1, 0.06);
    w.slab('m', 0xfef3c7, sx, 1.13, sz, 5.6, 0.08, 1.25, 0.03, false);
    // Glowing smoothie blenders (Green Dill Blast, Lemon Foam, Berry Smash, Electro-Lime)
    [0x22c55e, 0xfde047, 0xf43f5e, 0x38bdf8].forEach((c, i) => {
      const bx = sx - 1.8 + i * 0.95;
      w.add('x', rcyl(0.12, 0.18, 0.02, 14), 0x334155, bx, 1.21, sz);
      w.add('l', rcyl(0.11, 0.34, 0.02, 14), c, bx, 1.39, sz, 0, 0, 0, 1, 1, 1, 0.45);
      w.add('m', rcyl(0.12, 0.05, 0.01, 14), 0x111827, bx, 1.73, sz);
    });
    w.add('g', rbox(5.2, 1.5, 0.12, 0.03, 1), 0x0f172a, sx, 2.45, 73.65);
    txt(w, 'DILL-IGHT SMOOTHIE & PICKLE BAR', sx, 2.85, 73.54, PI, 0.16, 0xe6ff3b, 'l', 0.3);
    txt(w, 'DILL BLAST · FOAM FIZZ · ELECTRO-LIME', sx, 2.42, 73.54, PI, 0.13, 0x34d399, 'g');
    txt(w, 'FREE BOOST FOR TOURNAMENT PLAYERS!', sx, 2.02, 73.54, PI, 0.12, 0xfde047, 'g');
    for (let i = 0; i < 4; i++) {
      K.stool(w, sx - 1.8 + i * 1.2, sz - 1.05, i % 2 ? 0x10b981 : 0xfacc15);
    }
    SPOTS.dillersJuice = [sx, sz - 1.7];
  }

  // ================ ZONE 3: THE 3-COURT INDOOR TOURNAMENT ARENA (x: 64.5..95.5, z: 26.5..73.5) ================
  // 3A. Court 1: Dill Court 1 (Emerald Rec Hall) at (x=72.0, z=38.0) - Tournament Round 1
  court(w, 72.0, 38.0, PAL.dillGreen, { y: 0.06, runX: 2.3, runZ: 2.6, bench: 0x059669 });
  ballBucket(w, 67.2, 0.12, 38.0, 0xff8a1f, 14);
  SPOTS.court_dill1 = [68.2, 46.8];
  w.add('g', rbox(6.2, 1.35, 0.12, 0.03, 1), 0x064e3b, 72.0, 3.2, 26.35);
  txt(w, 'DILL COURT 1 · EMERALD REC', 72.0, 3.45, 26.46, 0, 0.22, 0xe6ff3b, 'l', 0.3);
  txt(w, 'TOURNAMENT ROUND 1 · 26-HOLE INDOOR', 72.0, 2.95, 26.46, 0, 0.14, 0x34d399, 'g');

  // 3B. Court 2: Dill Court 2 (Silent Serve Foam Court) at (x=86.8, z=38.0) - Tournament Round 2
  court(w, 86.8, 38.0, PAL.dillTeal, { y: 0.06, runX: 2.3, runZ: 2.6, bench: 0x0891b2 });
  ballBucket(w, 91.6, 0.12, 38.0, 0xfde047, 14);
  SPOTS.court_dill2 = [83.0, 46.8];
  w.add('g', rbox(6.6, 1.35, 0.12, 0.03, 1), 0x1e3a5f, 86.8, 3.2, 26.35);
  txt(w, 'DILL COURT 2 · SILENT SERVE', 86.8, 3.45, 26.46, 0, 0.22, 0xfde047, 'l', 0.3);
  txt(w, 'TOURNAMENT ROUND 2 · FOAM BALL ARENA', 86.8, 2.95, 26.46, 0, 0.14, 0x38bdf8, 'g');

  // Acoustic Foam Panels along East Wall beside Dill Court 2 (x=95.65, z: 30..46)
  for (let i = 0; i < 6; i++) {
    const pz = 30.5 + i * 2.8;
    w.add('f', rbox(0.14, 2.2, 2.1, 0.04, 1), i % 2 ? 0x0891b2 : 0xfde047, 95.65, 2.3, pz);
  }
  txt(w, 'SILENT SERVE ACOUSTIC WALL', 95.5, 3.8, 38.0, -PI / 2, 0.2, 0xfde047, 'l', 0.3);

  // Low indoor divider barrier between Dill Court 1 and Dill Court 2 (x=79.4, z: 30..46)
  fence(w, 'z', 79.4, 30.5, 45.5, 1.05, { wh: 0.75, col: 0x0f766e, words: 'DRIVE DILLERS', side: 1 });

  // 3C. Court 3: Drive Dillers Center Stage (Championship Court) at (x=78.5, z=60.5) - Tournament Final!
  court(w, 78.5, 60.5, PAL.dillChamp, { y: 0.06, runX: 2.5, runZ: 2.7, bench: 0x4f46e5 });
  ballBucket(w, 73.5, 0.12, 56.5, 0x34d399, 14);
  ballBucket(w, 83.5, 0.12, 64.5, 0xfde047, 14);
  SPOTS.court_dill3 = [74.5, 69.5];

  // Pi-rat's Umpire Chair & Cameo at Center Stage (x=72.4, z=60.5)
  umpireChair(w, 72.4, 60.5, PI / 2);
  SPOTS.piratDillers = [72.4, 60.5];

  // Stepped Spectator Bleachers flanking Drive Dillers Center Stage!
  SEATS.push(...bleachers(w, 'z', 53.0, 68.0, 85.4, 1, 5, { cols: [0x0d9488, 0x4f46e5] }));
  SEATS.push(...bleachers(w, 'z', 54.0, 67.0, 69.2, -1, 3, { cols: [0x10b981, 0x0f766e] }));

  // Championship Sponsor Boards & Jumbotron on South Arena Wall (z=73.65, x=78.5)
  w.add('g', rbox(10.5, 2.2, 0.16, 0.04, 1), 0x0f172a, 78.5, 3.5, 73.65);
  w.add('l', rbox(10.6, 2.28, 0.12, 0.03, 1), 0x10b981, 78.5, 3.5, 73.68, 0, 0, 0, 1, 1, 1, 0.45);
  txt(w, 'DRIVE DILLERS CENTER STAGE', 78.5, 4.15, 73.52, PI, 0.28, 0xe6ff3b, 'l', 0.35);
  txt(w, 'INDOOR CHAMPIONSHIP FINAL · SNOWIE CUP', 78.5, 3.55, 73.52, PI, 0.18, 0xf9a8d4, 'l', 0.3);
  txt(w, '26-HOLE PRO & SILENT SERVE FOAM ARENA', 78.5, 3.0, 73.52, PI, 0.16, 0x34d399, 'g');
  scoreFrame(w, 70.5, 2.6, 73.2, PI, 4.0, 2.0);
  scoreFrame(w, 86.5, 2.6, 73.2, PI, 4.0, 2.0);

  // Warm-up & Trophy Corner along East Wall behind bleachers (x=92.5..95.4, z=53..72)
  hopper(w, 93.6, 0.06, 51.5);
  hopper(w, 66.2, 0.06, 51.5);
  K.cooler(w, 66.2, 69.5);
  K.potPlant(w, 65.5, 0.06, 27.2, 1.2, 0x0f766e);
  K.potPlant(w, 94.5, 0.06, 27.2, 1.2, 0x0f766e);
  K.potPlant(w, 65.5, 0.06, 72.8, 1.2, 0x0f766e);
  K.potPlant(w, 94.5, 0.06, 72.8, 1.2, 0x0f766e);
  clockW(w, 'z', 95.65, 60.5, 3.8, -1);

  // Standing NPCs inside Drive Dillers
  STANDS.push(
    { x: 55.8, z: 34.5, ry: 0.4, name: 'Indoor Player' },
    { x: 60.5, z: 42.5, ry: -0.8, name: 'Tourney Fan' },
    { x: 57.5, z: 66.5, ry: 0, name: 'Smoothie Fan' },
    { x: 79.4, z: 49.2, ry: PI, name: 'Dill Coach' },
    { x: 66.5, z: 49.2, ry: 0.5, name: 'Player' },
    { x: 92.5, z: 49.2, ry: -0.5, name: 'Player' },
  );

  // Ceiling pendants (automatically placed in roof_dillers so they never block overhead camera)
  pend(w, 58, 34, 0x0d9488, 4.6);
  pend(w, 58, 44, 0x0d9488, 4.6);
  pend(w, 58, 56, 0x10b981, 4.6);
  pend(w, 58, 66, 0x10b981, 4.6);

  // Interior warm point lights
  w.lights.push(
    { x: 58, y: 4.5, z: 38, c: 0xf0fdf4, i: 16, d: 22 },
    { x: 58, y: 4.5, z: 62, c: 0xfffbeb, i: 14, d: 20 },
    { x: 72, y: 6.2, z: 38, c: 0xf0fdf4, i: 20, d: 28 },
    { x: 87, y: 6.2, z: 38, c: 0xe0f2fe, i: 20, d: 28 },
    { x: 78.5, y: 6.4, z: 60.5, c: 0xfef9c3, i: 24, d: 32 },
  );
  w.region = 'out';
}
