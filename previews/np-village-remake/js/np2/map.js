// The village laid out like santaupdate.com describes it (All About the North Pole page + its North Pole Village map):
// Main Street with the Kringle shops facing each other, Kringle Park and its skating pond, the Events Center, the Post Office
// as the hub, Santa's Workshop joined to the Wrapping Department by conveyors, Kringle Ranch (Reindeer Barn, Baby Barn,
// Sleigh Barn + grandstand) in the meadow north of the village, the Claus family home with its barn and greenhouse, the
// chapel on the hill, Elf Village, the North Pole River and the Polar Express station. Far away (Sleigh Bus / teleport):
// Polar Bear Mountain in the Frosty Range with the Hall of Records cave vault, the Sleigh Port with North Pole Flight Command,
// and (one at a time) the five Regional Tracking Centers from santaupdate.com.
import * as THREE from 'three';
import { G } from './vworld.js';
import * as K from './kit2.js';
import { building } from './buildings.js';
import * as OD from '../opsdata.js?v=np11';
import { RTC, RTC_AREA, CENTERS } from './cal.js';
import { dressRailway, PE_Z, PE_LOOP } from './express.js';
const PI = Math.PI, E = PI / 2, W_ = -PI / 2, N = PI, S = 0; // ry: front faces +x (E), -x (W_), -z (N), +z (S)
export const MTN = [3000, 0], PORT = [-3000, 0], INT = [6000, 6000];
const ROW = Object.fromEntries(OD.ROW.map((r) => [r[0], r]));
const P = (id, name, x, z, ry, W, D, H, style, o = {}) => Object.assign({ id, name, x, z, ry, W, D, H, style, sign: o.sign || name.replace(/^[^A-Za-z]+/, '').toUpperCase() }, o);
// every enterable place: interior type + (optional) the department activity + elf from the santaupdate.com department list
export const PLACES = [
  // ---- Main Street (west side faces east, east side faces west) ----
  P('inn', '🛏️ Candy Cane Inn', -8, 72, E, 14, 12, 6.5, 'log', { feat: ['dormers','chimneys2'], col: 0xa0522d, roof: 0x7f1d1d, shutter: 0xdc2626, int: 'inn', sign: 'CANDY CANE INN' }),
  P('bakery', '🍪 Gingerbread Bakery', 22, 56, E, 12, 11, 6, 'ginger', { feat: ['bigchimney'], col: 0xb5651d, roof: 0xfde68a, int: 'bakery', sign: 'GINGERBREAD BAKERY' }),
  P('candyco', '🍭 Kringle Candy Cane Company', 22, 35, E, 15, 12, 6, 'timber', { feat: ['candytower'], col: 0xfff1f2, trim: 0xb91c1c, roof: 0xb91c1c, awning: [0xdc2626, 0xffffff], int: 'candy', ops: 'candyco', sign: 'KRINGLE CANDY CANE CO.' }),
  P('stocking', '🧦 Kringle Stocking Shop', 22, 15, E, 13, 11, 5.5, 'timber', { feat: ['giantstocking','turret'], col: 0xecfccb, trim: 0x14532d, roof: 0x166534, awning: [0x16a34a, 0xfef3c7], int: 'stocking', ops: 'stocking' }),
  P('security', '🛡️ North Pole Security', 22, -5, E, 13, 11, 5.5, 'stone', { feat: ['beacon'], col: 0x6b7280, roof: 0x1f2937, tower: true, int: 'security', ops: 'security' }),
  P('repair', '🔧 Sleigh Repair Shop', 58, 76, W_, 15, 12, 5.5, 'barn', { feat: ['wrench','leanto'], col: 0x1e3a8a, col2: 0x172554, roof: 0x374151, int: 'repair', sign: 'SLEIGH REPAIR SHOP' }),
  P('market', '🧺 Kringle Market', 58, 56, W_, 16, 12, 5.5, 'timber', { feat: ['stalls'], col: 0xfef3c7, trim: 0x78350f, roof: 0x1e40af, awning: [0x2563eb, 0xffffff], int: 'market', sign: 'KRINGLE MARKET' }),
  P('emporium', '🌿 Kringle Mistletoe Emporium', 58, 35, W_, 15, 12, 6, 'ginger', { feat: ['onion','mistletoe'], col: 0x2f6b3a, roof: 0xf8fafc, int: 'emporium', ops: 'emporium', sign: 'KRINGLE MISTLETOE EMPORIUM' }),
  P('bank', '🏦 Kringle Bank', 58, 15, W_, 14, 12, 6.5, 'brick', { feat: ['minidome'], col: 0x8b6f47, trim: 0xf5efe0, pediment: true, int: 'bank', ops: 'bank', win: 3 }),
  P('radio', '📻 Kringle Radio · North Pole Radio News', 58, -5, W_, 13, 11, 6, 'office', { feat: ['antenna'], col: 0x6d28d9, trim: 0xede9fe, dish: true, int: 'radio', ops: 'radio', sign: 'KRINGLE RADIO' }),
  // ---- the hub at the top of Main Street ----
  P('post', '📮 North Pole Post Office', 40, -32, S, 22, 14, 7.5, 'brick', { feat: ['chute'], col: 0xb91c1c, trim: 0xfff7ed, clock: true, int: 'post', win: 5, sign: 'NORTH POLE POST OFFICE' }),
  // ---- Kringle Commons (department square north of the park) ----
  P('university', '🎓 Southern North Pole University', -22, -66, S, 22, 12, 7, 'brick', { feat: ['belltower'], col: 0x1e3a8a, trim: 0xf1f5f9, pediment: true, int: 'university', ops: 'university', sign: 'SOUTHERN NORTH POLE UNIVERSITY' }),
  P('statedept', '🌐 North Pole State Department', -48, -46, E, 14, 12, 6, 'stone', { feat: ['globe'], col: 0x94a3b8, roof: 0x0e7490, flags: [0x0e7490, 0xdc2626], int: 'statedept', ops: 'statedept' }),
  P('elfres', '🧑‍🔧 Department of Elf Resources', -48, -24, E, 14, 11, 5.5, 'office', { feat: ['wing'], col: 0xc2410c, trim: 0xffedd5, int: 'elfres', ops: 'elfres', sign: 'ELF RESOURCES' }),
  P('admin', '💻 Administrative Support', 12, -52, W_, 14, 12, 6, 'office', { feat: ['solar'], col: 0x334155, trim: 0xcbd5e1, int: 'admin', ops: 'admin', sign: 'ADMINISTRATIVE SUPPORT' }),
  P('listdept', '📜 List Department', 12, -32, W_, 14, 11, 6, 'timber', { feat: ['scroll'], col: 0xfffbeb, trim: 0x9f1239, roof: 0x9f1239, awning: [0x9f1239, 0xfffbeb], int: 'list', ops: 'listdept', sign: 'LIST DEPARTMENT' }),
  // ---- west: Events Center + Arctic Lodge ----
  P('events', '🎪 North Pole Events Center', -100, 2, E, 26, 18, 8, 'log', { feat: ['tentcone','marquee','bunting'], col: 0x7c4a1e, roof: 0x14532d, shutter: 0xb91c1c, win: 5, int: 'events', sign: 'NORTH POLE EVENTS CENTER' }),
  P('lodge', '🏔️ Arctic Lodge', -96, 64, E, 18, 13, 7, 'log', { feat: ['balcony','chimneys2'], col: 0x5b3a21, roof: 0x1e3a8a, shutter: 0x1e3a8a, int: 'lodge', sign: 'ARCTIC LODGE' }),
  // ---- south: station + logistics + snow removal ----
  P('station', '🚂 Polar Express Station', 18, 110, N, 42, 16, 11, 'station', { col: 0x14532d, roof: 0x7f1d1d, int: 'station', sign: 'POLAR EXPRESS STATION', signBg: '#7f1d1d', signFg: '#fff7e0' }),
  P('logistics', '📦 Operations & Logistics', -36, 112, N, 20, 14, 7, 'stone', { feat: ['gantry'], col: 0x78716c, roof: 0x854d0e, int: 'logistics', ops: 'logistics', sign: 'OPERATIONS & LOGISTICS' }),
  P('snowplow', '🚜 Snow Removal Department', 78, 110, N, 18, 13, 6, 'barn', { feat: ['plow'], col: 0xea580c, col2: 0x9a3412, roof: 0x1f2937, int: 'snowplow', ops: 'snowplow', sign: 'SNOW REMOVAL' }),
  // ---- north: Santa's Workshop + Wrapping Department (joined by conveyors) ----
  P('workshop', '🧸 Santa’s Workshop', -46, -116, S, 26, 20, 9, 'dome', { col: 0x9a3412, roof: 0x1e3a8a, int: 'workshop', sign: 'SANTA’S WORKSHOP' }),
  P('wrap', '🎁 Wrapping Department', 14, -116, S, 18, 16, 7, 'brick', { feat: ['bow'], col: 0xbe123c, trim: 0xfff1f2, int: 'wrap', ops: 'wrap', sign: 'WRAPPING DEPARTMENT' }),
  P('reindeerbarn', '🦌 Reindeer Barn · Flight Prep', 62, -120, S, 22, 16, 7, 'barn', { feat: ['weathervane','hayloft'], col: 0x7c2d12, roof: 0x3f3f46, cupola: true, int: 'barn', sign: 'REINDEER BARN' }),
  // ---- Kringle Ranch (meadow north of the village) ----
  P('babybarn', '🍼 Baby Reindeer Barn', 118, -170, W_, 14, 12, 5, 'barn', { feat: ['smallsilo','leanto'], col: 0xb45309, col2: 0x78350f, roof: 0x57534e, int: 'babybarn', ops: 'babybarn', sign: 'BABY BARN' }),
  P('sleighbarn', '🛷 Sleigh Barn', -10, -182, S, 28, 18, 9, 'barn', { feat: ['twincupola','runway'], col: 0x7f1d1d, col2: 0x450a0a, roof: 0x1f2937, int: 'sleighbarn', sign: 'SLEIGH BARN' }),
  P('dairy', '🥛 North Pole Dairy', -66, -176, S, 16, 12, 6, 'barn', { feat: ['silo','milkcan'], col: 0x0369a1, col2: 0x0c4a6e, roof: 0xe2e8f0, int: 'dairy', ops: 'dairy', sign: 'NORTH POLE DAIRY' }),
  P('reindeerops', '🦌 Reindeer Operations', 64, -168, S, 13, 10, 5.5, 'log', { feat: ['controltower'], col: 0x6b21a8, roof: 0x3b0764, shutter: 0xfacc15, porch: false, int: 'reindeerops', ops: 'reindeerops', sign: 'REINDEER OPERATIONS', win: 2 }),
  // ---- the Claus family home (just outside the village, in the pines) ----
  P('santahouse', '🏠 The Claus Family Home', -128, -88, E, 16, 16, 6, 'aframe', { col: 0x8b5a2b, roof: 0x6b3f1f, int: 'claus', ops: 'santahouse', sign: 'THE CLAUS HOME' }),
  P('greenhouse', '🪴 Mrs. Claus’s Greenhouse', -128, -64, E, 9, 12, 3.5, 'glass', { int: 'greenhouse', sign: 'MRS. CLAUS’S GREENHOUSE' }),
  P('clausbarn', '🎉 Claus Barn (Party Barn)', -150, -118, E, 18, 14, 6, 'barn', { feat: ['bunting','balloons'], col: 0xb91c1c, roof: 0x3f3f46, cupola: true, int: 'partybarn', sign: 'CLAUS BARN' }),
  // ---- east: chapel on the hill + Elf Village ----
  P('chapel', '⛪ North Pole Chapel', 152, -22, W_, 10, 16, 6, 'chapel', { int: 'chapel', sign: 'NORTH POLE CHAPEL', y: 4 }),
  P('community', '🎉 Elf Community Department', 96, -74, S, 14, 11, 5.5, 'log', { feat: ['clockspire','flagpole'], col: 0xdb2777, roof: 0x831843, shutter: 0xfbcfe8, int: 'community', ops: 'community', sign: 'ELF COMMUNITY DEPT.' }),
];
// far zones
export const MTN_PLACES = [P('records', '🗄️ North Pole Hall of Records', MTN[0], MTN[1] - 58, S, 12, 4, 8, 'cave', { int: 'records', ops: 'records', sign: 'NORTH POLE HALL OF RECORDS' })];
export const PORT_PLACES = [P('tracking', '📡 North Pole Flight Command', PORT[0], PORT[1] - 40, S, 22, 16, 8, 'office', { col: 0x0c4a6e, trim: 0xe0f2fe, dish: true, int: 'tracking', ops: 'tracking', sign: 'NORTH POLE FLIGHT COMMAND' })];
export function rowFor(p) { return p.ops ? ROW[p.ops] : null; }
// named areas for the HUD
export const AREAS = [
  { x0: 30, x1: 50, z0: -20, z1: 96, name: '🛍️ Main Street' }, { x0: 10, x1: 70, z0: -42, z1: 96, name: '🛍️ Main Street' },
  { x0: -62, x1: 6, z0: -2, z1: 62, name: '⛸️ Kringle Park' }, { x0: -60, x1: 12, z0: -76, z1: -14, name: '🏛️ Kringle Commons' },
  { x0: -125, x1: -62, z0: -20, z1: 90, name: '🎪 Events Center & Arctic Lodge' }, { x0: -60, x1: 100, z0: 98, z1: 140, name: '🚂 Polar Express Station' },
  { x0: -80, x1: 90, z0: -140, z1: -86, name: '🧸 Santa’s Workshop Yard' }, { x0: -100, x1: 160, z0: -240, z1: -140, name: '🦌 Kringle Ranch' },
  { x0: -175, x1: -105, z0: -140, z1: -50, name: '🏠 The Claus Family Home' }, { x0: 110, x1: 180, z0: -50, z1: 10, name: '⛪ Chapel Hill' },
  { x0: 70, x1: 150, z0: -110, z1: -55, name: '🍄 Elf Village' }, { x0: 140, x1: 240, z0: -200, z1: 220, name: '🏞️ North Pole River' },
  { x0: MTN[0] - 200, x1: MTN[0] + 200, z0: -300, z1: 300, name: '🐻‍❄️ Polar Bear Mountain · Frosty Range' }, { x0: PORT[0] - 200, x1: PORT[0] + 200, z0: -300, z1: 300, name: '🛷 North Pole Sleigh Port' },
  RTC_AREA,
];
export function areaName(x, z) { for (const a of AREAS) if (x >= a.x0 && x <= a.x1 && z >= a.z0 && z <= a.z1) return a.name; return '❄️ North Pole Village'; }
// Sleigh Bus stops [id, name, x, z, yaw]
export const STOPS = [['village', '🚌 Village Square (Main Street)', -22, 88, PI], ['workshop', '🧸 Workshop Yard', -16, -98, 0], ['ranch', '🦌 Kringle Ranch', 40, -150, PI],
  ['claus', '🏠 The Claus Home', -104, -74, -E], ['chapel', '⛪ Chapel Hill', 104, -12, -E], ['mountain', '🐻‍❄️ Polar Bear Mountain (Hall of Records)', MTN[0], MTN[1] + 60, PI], ['port', '🛷 Sleigh Port (Flight Command)', PORT[0], PORT[1] + 30, PI]];
// Extra teleport destinations (Sleigh Bus menu). Regional Tracking Centers use the streamed RTC far slot.
export const DESTINATIONS = STOPS.concat([
  ['events', '🎪 North Pole Events Center', -88, 6, E], ['post', '📮 North Pole Post Office', 40, -18, PI],
  ['station', '🚂 Polar Express Station', 18, 123.4, PI], ['park', '🌳 Kringle Park (big tree)', -2, 16, 0],
  ['lodge', '🏔️ Arctic Lodge', -84, 64, E], ['elfvil', '🍄 Elf Village', 96, -80, PI],
  ['university', '🎓 Southern North Pole University', -22, -54, PI], ['sleighbarn', '🛷 Sleigh Barn', -10, -170, PI],
  ['understation', '🚂 Workshop Underground Station', -88, -122, E],
  ...CENTERS.map((c) => [c.id, `📡 Sector ${c.sector} · ${c.place} (${c.country})`, RTC[0], RTC[1] + 22, PI, 'rtc']),
]);
export function destZone(d) { return d[5] || (d[0] === 'mountain' ? 'mtn' : d[0] === 'port' ? 'port' : 'out'); }
// Workshop underground station: enter through the yard portal (not a surface building).
export const UNDER = { id: 'understation', int: 'understation', name: '🚂 Workshop Underground Station' };
export const START = [40, 82, PI];
// ------------------------------------------------------------------ the village
export function buildVillage(w) { K.seed(11); w.region = 'out';
  // ground: one big snow sheet + darker blue-white variation discs; world edge walls (invisible) at the treeline
  w.addFn('m', G.plane(), (c, x, y, z) => { const n = Math.sin(x * 0.05) * Math.sin(z * 0.04) * 0.04; c.setRGB(0.93 + n, 0.955 + n, 1.0); }, 0, 0, 0, 0, 0, 0, 900, 1, 900);
  w.solid(-450, -2, -450, 450, 0, 450); const B = 245; w.solid(-B - 5, 0, -B - 5, B + 5, 30, -B, { nocam: true }); w.solid(-B - 5, 0, B, B + 5, 30, B + 5, { nocam: true }); w.solid(-B - 5, 0, -B, -B, 30, B, { nocam: true }); w.solid(B, 0, -B, B + 5, 30, B, { nocam: true });
  // paths (packed snow + cobbles on Main Street)
  const path = (x0, z0, x1, z1, col = 0xdfe6ef) => w.add('m', G.box(), col, (x0 + x1) / 2, 0, (z0 + z1) / 2, 0, 0, 0, Math.abs(x1 - x0), 0.03, Math.abs(z1 - z0));
  w.addFn('m', G.box(), (c, x, y, z) => { const k = (Math.floor(x * 1.4) + Math.floor(z * 1.4)) % 2 ? 0.93 : 0.86; c.setRGB(0.72 * k, 0.69 * k, 0.68 * k); }, 40, 0, 37, 0, 0, 0, 13, 0.04, 116); // Main Street cobbles
  path(29, -22, 33, 96, 0xe7ecf2); path(47, -22, 51, 96, 0xe7ecf2); // sidewalks
  path(-100, 0, 30, 8); path(-6, -100, 2, 0); path(-80, -100, 90, -94); path(2, -26, 33, -20); path(36, -150, 44, -96); path(-104, -76, -6, -70); path(60, -16, 112, -8); path(-30, 96, 100, 104); path(4, 100, 12, 112);
  path(-100, 8, -92, 64); path(90, -94, 98, -60); path(-70, -176, 120, -168); path(-14, -168, -6, -150); path(62, -96, 70, -150);
  // Station plaza: open paved square in front of the hall (Inn moved west so the square is clear)
  w.addFn('m', G.box(), (c, x, y, z) => { const k = (Math.floor(x * 0.7) + Math.floor(z * 0.7)) % 2 ? 0.94 : 0.88; c.setRGB(0.78 * k, 0.80 * k, 0.84 * k); }, 18, 0, 91, 0, 0, 0, 44, 0.04, 20);
  path(-2, 80, 48, 84, 0xe7ecf2); path(16, 84, 20, 102, 0xe7ecf2);
  { const T = w.tf(8, 0, 90, 0); T.add('m', G.cyl(12), 0x94a3b8, 0, 0, 0, 0, 0, 0, 1.5, 0.45, 1.5); T.add('m', G.cyl(12), 0x64748b, 0, 0.45, 0, 0, 0, 0, 1.15, 0.2, 1.15); K.wreath(w, T, 0, 1.15, 0, 0.85); T.box('m', 0xf8fafc, 0, 0.7, 0, 0.15, 0.7, 0.15); }
  K.bench(w, 0, 90, E); K.bench(w, 16, 90, -E); K.lamp(w, 0, 84); K.lamp(w, 36, 84); K.lamp(w, 0, 98); K.lamp(w, 36, 98);
  { const T = w.tf(32, 0, 90, -E); K.sign(w, T, 'POLAR EXPRESS PLAZA', 0, 2.2, 0.05, 4.8, 0.5, '#14532d', '#fef3c7'); T.box('m', 0x3b2414, 0, 0, 0, 0.14, 2.0, 0.14); }
  // Main Street decor: lamps both sides, bulbs strung across, candy canes, benches, presents
  for (const z of [-15, 5, 25, 45, 66, 86]) { K.lamp(w, 31, z); K.lamp(w, 49, z); K.lights(w, [31, 3.4, z], [49, 3.4, z], 16, 0.7); } // lamps sit between the shop doors, never in front of one
  for (const z of [0, 24, 46, 66]) { K.bench(w, 30.2, z + 4, E); K.bench(w, 49.8, z - 2, W_); }
  for (const z of [-18, 94]) { K.candyCane(w, 32.5, z, 3.2, 0); K.candyCane(w, 47.5, z, 3.2, PI); }
  // street sign at the south end
  { const T = w.tf(40, 0, 97, 0); T.box('m', 0x3b2414, -6.6, 0, 0, 0.25, 5.4, 0.25); T.box('m', 0x3b2414, 6.6, 0, 0, 0.25, 5.4, 0.25); K.sign(w, T, 'MAIN STREET', 0, 5.0, 0.14, 12, 1.3, '#14532d', '#fef3c7'); K.sign(w, T, 'MAIN STREET', 0, 5.0, -0.14, 12, 1.3, '#14532d', '#fef3c7', { back: true }); }
  // Kringle Park: skating pond (slippery), arch gate, the big tree, benches, snowmen, the news board
  w.add('g', G.disc(40), 0xbfe6ff, -30, 0.06, 30, 0, 0, 0, 24, 1, 15); w.add('m', G.ring(0.92, 40), 0xffffff, -30, 0.08, 30, 0, 0, 0, 25.5, 1, 16.5); w.zone('slip', -54, -1, 15, -6, 2, 45);
  for (let i = 0; i < 26; i++) { const a = i / 26 * PI * 2; K.rock(w, -30 + Math.cos(a) * 26.5, 30 + Math.sin(a) * 17.5, 0.5 + (i % 3) * 0.2); }
  { const T = w.tf(-2, 0, 30, E); for (const s of [-1, 1]) T.box('m', 0x7c4a1e, s * 3.2, 0, 0, 0.7, 4.6, 0.7); T.add('m', G.torus(0.12, 18, PI), 0x7c4a1e, 0, 4.4, 0, 0, 0, 0, 3.2, 1.6, 2.0); K.sign(w, T, 'KRINGLE PARK', 0, 4.25, 0.4, 5.2, 0.8, '#7f1d1d', '#fff7e0'); for (const s of [-1, 1]) K.wreath(w, T, s * 3.2, 3.6, 0.4, 0.9); }
  K.bigTree(w, -8, 4, 1.1); w.add('m', G.cyl(24), 0xd6d3d1, -8, 0, 4, 0, 0, 0, 6.5, 0.3, 6.5);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; K.bench(w, -30 + Math.cos(a) * 30, 30 + Math.sin(a) * 21, -a + E); }
  K.snowman(w, -60, 12, 1.1, 0.6); K.snowman(w, -4, 52, 0.9, -0.4); K.snowman(w, -56, 52, 1.0, 2.4);
  { const T = w.tf(-16, 0, 10, 0.5); T.box('m', 0x5b3a21, -1.6, 0, 0, 0.2, 2.6, 0.2); T.box('m', 0x5b3a21, 1.6, 0, 0, 0.2, 2.6, 0.2); T.box('m', 0x7c4a1e, 0, 1.0, 0, 3.6, 1.8, 0.16); T.add('m', G.prism(), 0x14532d, 0, 2.9, 0, 0, E, 0, 0.5, 0.5, 3.9); K.sign(w, T, 'NORTH POLE NEWS', 0, 2.55, 0.1, 3.3, 0.4, '#14532d', '#fef3c7', { border: false });
    for (let i = 0; i < 4; i++) T.box('m', [0xfffbeb, 0xfef9c3, 0xffffff, 0xfce7f3][i], -1.2 + i * 0.8, 1.2, 0.1, 0.65, 0.95 - (i % 2) * 0.15, 0.02); T.solid(0, 0, 0, 3.6, 2.8, 0.4); }
  // Kringle Commons plaza: fountain-statue of the first reindeer + flag poles
  w.add('m', G.box(), 0xd6dce4, -22, 0, -42, 0, 0, 0, 40, 0.04, 34); w.add('m', G.cyl(16), 0xcbd5e1, -22, 0, -42, 0, 0, 0, 4, 0.8, 4); w.add('e', G.disc(16), 0x7dd3fc, -22, 0.82, -42, 0, 0, 0, 3.6, 1, 3.6); w.solid(-26, 0, -46, -18, 0.8, -38);
  for (const [x, z, c] of [[-34, -32, 0xdc2626], [-10, -32, 0x16a34a], [-34, -54, 0x2563eb], [-10, -54, 0xf5c542]]) { w.add('x', G.cyl(6), 0xd1d5db, x, 0, z, 0, 0, 0, 0.07, 7, 0.07); w.add('f', G.box(), c, x + 0.7, 5.6, z, 0, 0, 0, 1.4, 0.9, 0.04); }
  // ---- buildings ----
  for (const p of PLACES) { if (p.y) continue; building(w, p); }
  // ---- chapel hill: raised plateau with a ramp road from the west ----
  { const x0 = 130, x1 = 176, z0 = -46, z1 = 2, h = 4; w.addFn('m', G.box(), (c, x, y, z) => { if (y > h - 0.4) c.set(0xf4f8ff); else c.set(0x8b8f96).multiplyScalar(0.85 + Math.sin(x * 2 + y * 3) * 0.08); }, (x0 + x1) / 2, 0, (z0 + z1) / 2, 0, 0, 0, x1 - x0, h, z1 - z0); w.solid(x0, 0, z0, x1, h, z1);
    const r0 = 108; w.add('m', G.box(), 0xe7ecf2, (r0 + x0) / 2, h / 2 - 0.1, -16, 0, 0, Math.atan2(h, x0 - r0), Math.hypot(x0 - r0, h), 0.25, 9); w.solid(r0, 0, -20.5, x0, h, -11.5, { ramp: ['x', 1] });
    for (let x = r0 + 2; x < x0; x += 5) { K.candyCane(w, x, -21.5, 2.0, 0); K.candyCane(w, x, -10.5, 2.0, PI); }
    const ch = PLACES.find((p) => p.id === 'chapel'); w.oy = 0; const T0 = { ...ch }; buildRaised(w, ch, h);
    for (let i = 0; i < 10; i++) K.pine(w, x0 + 3 + (i % 5) * 9, i < 5 ? z0 + 3 : z1 - 3, 1.0 + (i % 3) * 0.2); }
  // ---- Santa's Workshop <-> Wrapping Department conveyor bridge (presents ride across; animated in game) ----
  { const y = 5.2, xa = -26, xb = 5, z = -112; w.add('m', G.box(), 0x475569, (xa + xb) / 2, y - 0.5, z, 0, 0, 0, xb - xa, 0.5, 3.2); w.add('m', G.box(), 0x1f2937, (xa + xb) / 2, y, z, 0, 0, 0, xb - xa, 0.12, 2.2);
    w.add('e', G.box(), 0xd9f2ff, (xa + xb) / 2, y - 0.25, z, 0, 0, 0, xb - xa, 2.6, 3.2); w.add('m', G.prism(), 0x1e3a8a, (xa + xb) / 2, y + 2.35, z, 0, E, 0, 3.6, 1.0, xb - xa); w.add('m', G.prism(), 0xf4f8ff, (xa + xb) / 2, y + 2.8, z, 0, E, 0, 2.4, 0.6, xb - xa + 0.1);
    for (let x = xa + 3; x < xb; x += 6) { w.add('x', G.cyl(8), 0x334155, x, 0, z - 1.3, 0, 0, 0, 0.18, y - 0.5, 0.18); w.add('x', G.cyl(8), 0x334155, x, 0, z + 1.3, 0, 0, 0, 0.18, y - 0.5, 0.18); w.solid(x - 0.2, 0, z - 1.5, x + 0.2, y, z - 1.1); w.solid(x - 0.2, 0, z + 1.1, x + 0.2, y, z + 1.5); }
    { const T = w.tf((xa + xb) / 2, 0, z + 1.65, 0); K.sign(w, T, 'TOYS → WRAPPING', 0, y + 1.3, 0.05, 5, 0.6, '#1e3a8a', '#fef3c7'); } }
  // workshop yard: presents, crates, hard-hat sign, train portal to the underground station
  for (let i = 0; i < 14; i++) K.present(w, -70 + (i % 7) * 3.2, -97 - Math.floor(i / 7) * 2.6, 0.8 + (i % 3) * 0.3, i);
  { const T = w.tf(-80, 0, -102, E); K.sign(w, T, 'HARD HATS + BADGES PAST THIS POINT', 0, 2.4, 0.1, 5.5, 0.6, '#facc15', '#111827', { frame: 0x111827 }); T.box('m', 0x111827, -2.6, 0, 0, 0.15, 2.2, 0.15); T.box('m', 0x111827, 2.6, 0, 0, 0.15, 2.2, 0.15); }
  path(-100, -122, -70, -100); // packed-snow walk to the underground portal
  { const T = w.tf(-94, 0, -122, E);
    // side walls + lintel only — the middle is an open arch you can walk through
    T.box('m', 0x57534e, -2.6, 0, 0, 1.8, 4.6, 1.2); T.box('m', 0x57534e, 2.6, 0, 0, 1.8, 4.6, 1.2);
    T.box('m', 0x44403c, 0, 3.1, 0, 3.8, 1.5, 1.4);
    T.add('m', G.arch(10), 0x111827, 0, 0, 0.62, 0, 0, 0, 4.6, 3.8, 0.08);
    T.box('x', 0x94a3b8, -0.75, 0, 3, 0.12, 0.1, 6); T.box('x', 0x94a3b8, 0.75, 0, 3, 0.12, 0.1, 6);
    w.add('l', G.sph(8), 0xffe3a3, -93.15, 3.35, -119.7, 0, 0, 0, 0.16, 0.16, 0.16, 1.1);
    w.add('l', G.sph(8), 0xffe3a3, -93.15, 3.35, -124.3, 0, 0, 0, 0.16, 0.16, 0.16, 1.1);
    K.sign(w, T, 'WORKSHOP UNDERGROUND STATION', 0, 4.25, 0.72, 5.6, 0.55, '#1f2937', '#fef3c7');
    K.sign(w, T, 'TRAINS BELOW  ·  WALK IN', 0, 2.55, 0.62, 3.4, 0.4, '#14532d', '#fef3c7');
    T.solid(-2.6, 0, 0, 1.8, 4.6, 1.2); T.solid(2.6, 0, 0, 1.8, 4.6, 1.2); T.solid(0, 3.1, 0, 3.6, 1.5, 1.2);
    UNDER.door = { x: -94, z: -122, ex: -88, ez: -122, yaw: E, y: 0 }; w.zone('door', -96.2, -1, -124.2, -92.2, 3.1, -119.8, { place: UNDER }); }
  // ---- Kringle Ranch: paddock beside the Reindeer Barn (the team lives together), baby pens + flight field, Sleigh Barn grandstand + runway ----
  K.fence(w, 76, -134, 108, -134); K.fence(w, 108, -134, 108, -108); K.fence(w, 76, -108, 108, -108); K.fence(w, 76, -134, 76, -124);
  for (let i = 0; i < 6; i++) { w.add('m', G.cyl(10), 0xe2c275, 82 + (i % 3) * 8, 0, -128 + Math.floor(i / 3) * 12, E, 0, 0, 0.9, 1.4, 0.9); }
  w.add('x', G.box(), 0x94a3b8, 98, 0, -116, 0, 0, 0, 3, 0.8, 1.2); w.add('e', G.box(), 0x7dd3fc, 98, 0.6, -116, 0, 0, 0, 2.8, 0.1, 1.0);
  K.fence(w, 92, -192, 108, -192); K.fence(w, 92, -192, 92, -178); K.fence(w, 108, -192, 108, -178); // baby pens
  K.fence(w, 128, -230, 176, -230); K.fence(w, 176, -230, 176, -184); K.fence(w, 128, -184, 176, -184); K.fence(w, 128, -230, 128, -212);
  { const T = w.tf(152, 0, -183.6, 0); K.sign(w, T, 'FLIGHT FIELD (YOUNG FLYERS)', 0, 2.2, 0.05, 4.8, 0.55, '#78350f', '#fef3c7'); }
  for (let i = 0; i < 6; i++) w.add('f', G.cone(8), 0xffffff, 140 + i * 6, 0, -206 + (i % 2) * 6, 0, 0, 0, 0.6, 1.2, 0.6); // soft snow cushions for landings
  // runway north of the Sleigh Barn with lights and the grandstand on its west side
  w.add('m', G.box(), 0xcbd5e1, -10, 0, -232, 0, 0, 0, 12, 0.05, 80); for (let z = -196; z > -272; z -= 6) { w.add('l', G.sph(6), 0x60a5fa, -16.5, 0.2, z, 0, 0, 0, 0.18, 0.18, 0.18, 1); w.add('l', G.sph(6), 0x60a5fa, -3.5, 0.2, z, 0, 0, 0, 0.18, 0.18, 0.18, 1); }
  for (let i = 0; i < 5; i++) { w.add('m', G.box(), i % 2 ? 0x1e3a8a : 0xb91c1c, -32 + i * 0.0, i * 0.7, -228, 0, 0, 0, 10 - i * 1.6, 0.7, 40); w.solid(-37 + i * 0.8, i * 0.7, -248, -27 - i * 0.8, i * 0.7 + 0.7, -208); }
  { const T = w.tf(-32, 0, -206.5, 0); K.sign(w, T, 'GRANDSTAND · SANTA’S LAUNCH', 0, 4.6, 0.05, 6.5, 0.7, '#7f1d1d', '#fff7e0'); }
  // dairy silo
  w.add('m', G.cyl(14), 0xe2e8f0, -54, 0, -180, 0, 0, 0, 3, 11, 3); w.add('m', G.hemi(14), 0x0369a1, -54, 11, -180, 0, 0, 0, 3.1, 2, 3.1); w.solid(-57, 0, -183, -51, 12, -177);
  // ---- the Claus home yard: fence, Santa's personal sleigh by the barn, mailbox, snowman ----
  K.fence(w, -170, -140, -110, -140); K.fence(w, -170, -140, -170, -40); K.fence(w, -170, -40, -112, -40);
  K.sledge(w, -136, -128, 0, 0xc8102e, 1.4); K.snowman(w, -112, -100, 1.0, -1); { const T = w.tf(-110, 0, -80, E); T.box('m', 0x5b3a21, 0, 0, 0, 0.15, 1.2, 0.15); T.box('g', 0xc8102e, 0, 1.2, 0, 0.5, 0.45, 0.8); T.box('m', 0xf4f8ff, 0, 1.65, 0, 0.55, 0.08, 0.85); }
  for (let i = 0; i < 6; i++) K.present(w, -113, -94 + i * 1.0, 0.6, i);
  // ---- Elf Village: little round cottages around a lane ----
  [[84, -94], [100, -96], [116, -92], [130, -86], [124, -70], [112, -62], [138, -100], [80, -62], [144, -74]].forEach(([x, z], i) => building(w, { x, z, ry: Math.atan2(110 - x, -80 - z), W: 5 + (i % 3), D: 5, H: 2.6 + (i % 2) * 0.6, style: 'cottage', col: [0xfde68a, 0xfecaca, 0xbbf7d0, 0xbfdbfe, 0xe9d5ff][i % 5], roof: [0xb91c1c, 0x16a34a, 0x2563eb, 0xdb2777][i % 4], sign: '', noEnter: true }));
  w.zones = w.zones.filter((z) => !(z.place && z.place.noEnter));
  // ---- the North Pole River (frozen, slippery) with two wooden bridges ----
  const RIV = [[230, -230], [196, -120], [178, -40], [190, 40], [150, 110], [100, 170], [60, 240]];
  for (let i = 0; i < RIV.length - 1; i++) { const [ax, az] = RIV[i], [bx, bz] = RIV[i + 1], L = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az); w.add('g', G.box(), 0x9fd8f5, (ax + bx) / 2, 0, (az + bz) / 2, 0, ry, 0, 14, 0.07, L + 8); w.add('m', G.box(), 0xffffff, (ax + bx) / 2, 0, (az + bz) / 2, 0, ry, 0, 17, 0.05, L + 8);
    for (let k = 0; k < 6; k++) { const t = k / 6; K.rock(w, ax + (bx - ax) * t + Math.cos(ry) * 8, az + (bz - az) * t - Math.sin(ry) * 8, 0.6 + (k % 2) * 0.3); } w.zone('slip', Math.min(ax, bx) - 6, -1, Math.min(az, bz), Math.max(ax, bx) + 6, 2, Math.max(az, bz)); }
  for (const [x, z, ry] of [[160, 100, 0.85], [186, 20, -1.45]]) { const T = w.tf(x, 0, z, ry); T.box('m', 0x7c4a1e, 0, 0.4, 0, 4, 0.3, 20); for (const s of [-1, 1]) { T.box('m', 0x5b3a21, s * 2, 0.7, 0, 0.15, 0.9, 20); for (let k = -9; k <= 9; k += 3) T.box('m', 0x5b3a21, s * 2, 0, k, 0.25, 1.6, 0.25); } }
  { const T = w.tf(176, 0, -60, -E); K.sign(w, T, 'NORTH POLE RIVER', 0, 1.6, 0.05, 4, 0.5, '#0c4a6e', '#e0f2fe'); }
  // ---- railway along the south (Polar Express) ----
  w.add('m', G.box(), 0xb8a48a, 0, 0, 126, 0, 0, 0, 480, 0.12, 4); for (let x = -238; x <= 238; x += 1.6) w.add('m', G.box(), 0x5b3a21, x, 0.1, 126, 0, 0, 0, 0.35, 0.1, 3.2); w.add('x', G.box(), 0x64748b, 0, 0.2, 125.25, 0, 0, 0, 480, 0.14, 0.12); w.add('x', G.box(), 0x64748b, 0, 0.2, 126.75, 0, 0, 0, 480, 0.14, 0.12);
  dressRailway(w);
  // sleigh bus depot shelter at the village stop
  { const T = w.tf(-22, 0, 88, PI); T.box('m', 0x7f1d1d, 0, 0, -1.6, 6, 2.8, 0.2); for (const s of [-1, 1]) T.box('m', 0x7f1d1d, s * 3, 0, 0, 0.2, 2.8, 3.2); T.box('m', 0x7f1d1d, 0, 2.8, 0, 6.6, 0.25, 3.6); T.box('m', 0xf4f8ff, 0, 3.05, 0, 6.6, 0.12, 3.6); K.bench(w, ...[T.P(0, 0, -1)[0], T.P(0, 0, -1)[2]], PI);
    K.sign(w, T, 'SLEIGH BUS STOP', 0, 3.85, 0.0, 4.4, 0.6, '#c8102e', '#ffffff'); T.box('m', 0x3b2414, 0, 2.95, 0, 0.12, 0.6, 0.12); }
  // ---- trees: thick pine forest outside the village, small groves inside (never on a path or building) ----
  const blocked = (x, z) => PLACES.some((p) => Math.abs(x - p.x) < (Math.max(p.W, p.D) / 2 + 6) && Math.abs(z - p.z) < (Math.max(p.W, p.D) / 2 + 6)) || (x > 20 && x < 70 && z > -45 && z < 100) || (x > -60 && x < 5 && z > -5 && z < 64) || (x > -65 && x < 12 && z > -80 && z < -12) || (x > -20 && x < 130 && z > 96 && z < 132) || (x > 120 && x < 200 && z > -50 && z < 6) || (x > -45 && x < 10 && z < -185) || (x > 70 && x < 180 && z < -105 && z > -235) || (x > -112 && x < 12 && z > -80 && z < -60) || (x > -6 && x < 2) || (x > 30 && x < 50 && z < -96) || (x > -100 && x < 2 && z > -8 && z < 12) || Math.abs(z - 126) < 10 || Math.abs(z - 131) < 8 || (z > 96 && z < 140 && x > -100 && x < 145) || (Math.abs(x - PE_LOOP.xe) < 10 && z < PE_LOOP.zs + 8 && z > PE_LOOP.zn - 8) || (Math.abs(z - PE_LOOP.zn) < 10 && x < PE_LOOP.xe + 8 && x > PE_LOOP.xw - 8) || (Math.abs(x - PE_LOOP.xw) < 10 && z < PE_LOOP.zs + 8 && z > PE_LOOP.zn - 8) || (x > -4 && x < 42 && z > 80 && z < 104) || (x > 140 && x < 215 && z > -240 && z < 240 && distRiver(x, z, RIV) < 14) || (x > -40 && x < 30 && z > -110 && z < -94) || (x > -110 && x < -60 && z > -190 && z < -160);
  let n = 0; for (let i = 0; i < 2600 && n < 420; i++) { const x = (K.R() - 0.5) * 480, z = (K.R() - 0.5) * 480; const edge = Math.max(Math.abs(x), Math.abs(z)) > 175; if (!edge && K.R() < 0.75) continue; if (blocked(x, z)) continue; K.pine(w, x, z, 0.9 + K.R() * 0.8); if (!edge) w.solid(x - 0.4, 0, z - 0.4, x + 0.4, 4, z + 0.4); n++; }
  // ---- backdrop: the Frosty Range all around (big low-poly peaks with snow caps) + aurora ----
  for (let i = 0; i < 28; i++) { const a = i / 28 * PI * 2, r = 330 + (i % 3) * 60, x = Math.cos(a) * r, z = Math.sin(a) * r, h = 70 + (i * 37 % 60), rr = 60 + (i * 13 % 30); w.add('m', G.cone(7), 0x7d8da3, x, -2, z, 0, i, 0, rr, h, rr); w.add('m', G.cone(7), 0xf8fafc, x, h * 0.55 - 2, z, 0, i + 0.1, 0, rr * 0.47, h * 0.46, rr * 0.47); }
  aurora(w, 0, -300); }
function distRiver(x, z, R) { let best = 1e9; for (let i = 0; i < R.length - 1; i++) { const [ax, az] = R[i], [bx, bz] = R[i + 1]; const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))); best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return best; }
function buildRaised(w, p, h) { w.oy = 0; // build at ground then lift: simplest is a translated frame
  const save = w.addM.bind(w); const lift = new THREE.Matrix4().makeTranslation(0, h, 0); w.addM = (b, g, c, m, em) => save(b, g, c, lift.clone().multiply(m), em);
  const sv = w.solid.bind(w); w.solid = (x0, y0, z0, x1, y1, z1, o) => sv(x0, y0 + h, z0, x1, y1 + h, z1, o); const zn = w.zone.bind(w); w.zone = (t, x0, y0, z0, x1, y1, z1, o) => zn(t, x0, y0 + h, z0, x1, y1 + h, z1, o);
  const ao = w.addObj.bind(w); w.addObj = (o) => { o.position.y += h; return ao(o); };
  building(w, p); w.addM = save; w.solid = sv; w.zone = zn; w.addObj = ao; p.door.y = h; }
// aurora: a few soft glowing ribbons high in the northern sky (cheap: thin emissive planes)
function aurora(w, x, z) { return; for (let i = 0; i < 5; i++) w.add('l', G.box(), [0x34d399, 0x22d3ee, 0xa78bfa, 0x4ade80, 0x2dd4bf][i], x - 160 + i * 80, 120 + (i % 2) * 18, z - i * 12, 0.15, 0.3 * (i - 2), 0.12, 120, 14, 0.5, 0.45); }
// ------------------------------------------------------------------ Polar Bear Mountain (Frosty Range): sleigh bus pad, switchback road, the cave vault
export function buildMountain(w) { K.seed(23); w.region = 'mtn'; const [cx, cz] = MTN;
  w.addFn('m', G.plane(), (c, x, y, z) => { const n = Math.sin(x * 0.07) * Math.sin(z * 0.05) * 0.04; c.setRGB(0.92 + n, 0.95 + n, 1); }, cx, 0, cz, 0, 0, 0, 500, 1, 500); w.solid(cx - 250, -2, cz - 250, cx + 250, 0, cz + 250);
  const B = 95; w.solid(cx - B - 5, 0, cz - B - 5, cx + B + 5, 40, cz - B, { nocam: true }); w.solid(cx - B - 5, 0, cz + B, cx + B + 5, 40, cz + B + 5, { nocam: true }); w.solid(cx - B - 5, 0, cz - B, cx - B, 40, cz + B, { nocam: true }); w.solid(cx + B, 0, cz - B, cx + B + 5, 40, cz + B, { nocam: true });
  // landing pad
  w.add('m', G.cyl(24), 0xcbd5e1, cx, 0, cz + 60, 0, 0, 0, 9, 0.12, 9); w.add('l', G.ring(0.9, 24), 0xfacc15, cx, 0.14, cz + 60, 0, 0, 0, 8.5, 1, 8.5, 0.6); { const T = w.tf(cx - 9, 0, cz + 52, 0.4); K.sign(w, T, 'POLAR BEAR MOUNTAIN · SLEIGH BUS', 0, 2.3, 0.05, 5.4, 0.6, '#0c4a6e', '#e0f2fe'); T.box('m', 0x3b2414, -2.5, 0, 0, 0.15, 2.0, 0.15); T.box('m', 0x3b2414, 2.5, 0, 0, 0.15, 2.0, 0.15); }
  // the mountain massif: a cliff wall with the cave mouth, peaks behind
  const cliffZ = cz - 62; w.addFn('m', G.box(), (c, x, y, z) => { const n = Math.sin(x * 0.9 + y * 1.3) * Math.sin(y * 0.7 - x * 0.4); c.set(y > 26 ? 0xf8fafc : 0x6b7280).multiplyScalar(0.85 + n * 0.12); }, cx, 0, cliffZ - 12, 0, 0, 0, 120, 30, 24); w.solid(cx - 60, 0, cliffZ - 24, cx + 60, 30, cliffZ);
  for (let i = 0; i < 9; i++) { const x = cx - 80 + i * 20, h = 60 + (i % 3) * 25; w.add('m', G.cone(7), 0x6b7280, x, 10, cliffZ - 40 - (i % 2) * 20, 0, i, 0, 26, h, 26); w.add('m', G.cone(7), 0xf8fafc, x, 10 + h * 0.5, cliffZ - 40 - (i % 2) * 20, 0, i + 0.1, 0, 13, h * 0.5, 13); }
  // raised ledge in front of the cave (y=6) reached by a switchback road (two ramps)
  const ly = 6; w.addFn('m', G.box(), (c, x, y, z) => c.set(y > ly - 0.3 ? 0xf4f8ff : 0x7c838e), cx, 0, cliffZ + 7, 0, 0, 0, 34, ly, 14); w.solid(cx - 17, 0, cliffZ, cx + 17, ly, cliffZ + 14);
  w.add('m', G.box(), 0xe7ecf2, cx + 26, ly / 4 - 0.1, cliffZ + 30, Math.atan2(ly / 2, 24), 0, 0, 7, 0.25, Math.hypot(24, ly / 2)); w.solid(cx + 22.5, 0, cliffZ + 18, cx + 29.5, ly / 2, cliffZ + 42, { ramp: ['z', -1] });
  w.add('m', G.box(), 0xe7ecf2, cx + 26, ly / 2 - 0.1, cliffZ + 15, 0, 0, 0, 7, 0.1, 6); w.addFn('m', G.box(), (c, x, y) => c.set(y > ly / 2 - 0.3 ? 0xf4f8ff : 0x7c838e), cx + 26, 0, cliffZ + 15, 0, 0, 0, 7, ly / 2, 6); w.solid(cx + 22.5, 0, cliffZ + 12, cx + 29.5, ly / 2, cliffZ + 18);
  w.add('m', G.box(), 0xe7ecf2, cx + 20.5, ly * 0.75 - 0.1, cliffZ + 15, 0, 0, -Math.atan2(ly / 2, 6), Math.hypot(6, ly / 2), 0.25, 6); w.solid(cx + 17, ly / 2, cliffZ + 12, cx + 23, ly, cliffZ + 18, { ramp: ['x', -1] });
  for (let i = 0; i < 8; i++) { K.candyCane(w, cx + 22, cliffZ + 20 + i * 3, 1.6, 0); }
  // cave mouth: dark arch in the cliff, timber frame, round brass vault door ajar, lanterns, carved sign
  const mz = cliffZ + 0.05; w.add('m', G.arch(12), 0x111318, cx, ly, mz, 0, 0, 0, 9, 9, 0.4); w.add('m', G.torus(0.12, 20, PI), 0x57534e, cx, ly + 4.5, mz + 0.3, 0, 0, 0, 4.7, 4.7, 4);
  w.add('x', G.cyl(28), 0xb08d57, cx - 3.6, ly + 0.0, mz + 1.6, E, 0, 0.6, 3.0, 0.5, 3.0); w.add('x', G.cyl(28), 0x8a6a3a, cx - 3.6, ly, mz + 1.62, E, 0, 0.6, 2.4, 0.52, 2.4); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; w.add('x', G.cyl(8), 0xd4b483, cx - 3.6 + Math.cos(a) * 0.9 * 0.8, ly + 3 + Math.sin(a) * 0.9, mz + 1.9 + Math.cos(a) * 0.5, E, 0, 0.6, 0.18, 0.4, 0.18); }
  for (const s of [-1, 1]) { w.add('m', G.cyl(6), 0x3b2414, cx + s * 5.5, ly, mz + 0.8, 0, 0, 0, 0.12, 2.8, 0.12); w.add('l', G.box(), 0xffb347, cx + s * 5.5, ly + 2.6, mz + 1.0, 0, 0, 0, 0.35, 0.5, 0.35, 0.9); }
  { const T = w.tf(cx, ly, mz + 0.4, 0); K.sign(w, T, 'NORTH POLE HALL OF RECORDS', 0, 10.4, 0.05, 9, 1.0, '#292524', '#f5c542', { frame: 0x57534e }); K.sign(w, T, 'Est. by Santa in the vault French trappers found · Curators only', 0, 9.0, 0.05, 7.5, 0.45, '#292524', '#e7e5e4', { border: false, fs: 0.5 }); }
  const rec = MTN_PLACES[0]; rec.door = { x: cx, z: mz + 1.6, ex: cx + 1.2, ez: mz + 4.5, yaw: 0, y: ly }; w.zone('door', cx - 2, ly - 1, mz - 0.5, cx + 2, ly + 3, mz + 2.4, { place: rec });
  // polar bears lounging (statue-like friendly bears) + pines + rocks
  for (const [x, z, ry] of [[cx - 22, cz + 20, 0.6], [cx + 40, cz + 34, -2.3]]) polarBear(w, x, z, ry, 1);
  for (let i = 0; i < 70; i++) { const x = cx + (K.R() - 0.5) * 180, z = cz + (K.R() - 0.5) * 180; if (z < cliffZ + 18 && Math.abs(x - cx) < 40) continue; if (Math.hypot(x - cx, z - cz - 60) < 16 || (Math.abs(x - cx - 26) < 8 && z < cliffZ + 45)) continue; if (K.R() < 0.7) K.pine(w, x, z, 0.8 + K.R() * 0.9); else K.rock(w, x, z, 1 + K.R() * 2); }
  { const T = w.tf(cx + 14, 0, cz + 40, -0.3); K.sign(w, T, '↑ HALL OF RECORDS (follow the road up)', 0, 2.3, 0.05, 5.6, 0.55, '#3b2414', '#fef3c7'); T.box('m', 0x3b2414, 0, 0, 0, 0.15, 2.0, 0.15); }
  aurora(w, cx, cz - 220); }
export function polarBear(w, x, z, ry, s = 1) { const T = w.tf(x, 0, z, ry, s); T.add('f', G.sph(12), 0xf5f5f0, 0, 1.0, 0, 0, 0, 0, 1.0, 0.85, 1.6); T.add('f', G.sph(10), 0xf5f5f0, 0, 1.3, 1.5, 0, 0, 0, 0.6, 0.55, 0.65); T.add('f', G.sph(8), 0xf5f5f0, 0, 1.15, 2.05, 0, 0, 0, 0.3, 0.25, 0.3); T.add('g', G.sph(6), 0x111111, 0, 1.18, 2.35, 0, 0, 0, 0.09);
  T.add('g', G.sph(6), 0x111111, -0.2, 1.48, 1.95, 0, 0, 0, 0.06); T.add('g', G.sph(6), 0x111111, 0.2, 1.48, 1.95, 0, 0, 0, 0.06); T.add('f', G.sph(6), 0xf5f5f0, -0.38, 1.8, 1.4, 0, 0, 0, 0.16); T.add('f', G.sph(6), 0xf5f5f0, 0.38, 1.8, 1.4, 0, 0, 0, 0.16);
  for (const [a, b] of [[-0.6, 1.0], [0.6, 1.0], [-0.6, -1.0], [0.6, -1.0]]) T.add('f', G.cyl(8), 0xf5f5f0, a, 0, b, 0, 0, 0, 0.32, 0.7, 0.32); T.add('f', G.torus(0.35, 12), 0xdc2626, 0, 1.55, 1.1, E, 0, 0, 0.45); T.solid(0, 0, 0, 2.2, 2, 3.6); }
// ------------------------------------------------------------------ Sleigh Port: runway lights, hangars, Flight Command
export function buildPort(w) { K.seed(31); w.region = 'port'; const [cx, cz] = PORT;
  w.addFn('m', G.plane(), (c) => c.setRGB(0.93, 0.955, 1), cx, 0, cz, 0, 0, 0, 500, 1, 500); w.solid(cx - 250, -2, cz - 250, cx + 250, 0, cz + 250);
  const B = 95; w.solid(cx - B - 5, 0, cz - B - 5, cx + B + 5, 40, cz - B, { nocam: true }); w.solid(cx - B - 5, 0, cz + B, cx + B + 5, 40, cz + B + 5, { nocam: true }); w.solid(cx - B - 5, 0, cz - B, cx - B, 40, cz + B, { nocam: true }); w.solid(cx + B, 0, cz - B, cx + B + 5, 40, cz + B, { nocam: true });
  for (const rx of [-40, 40]) { w.add('m', G.box(), 0x475569, cx + rx, 0, cz, 0, 0, 0, 14, 0.05, 180); w.add('m', G.box(), 0xffffff, cx + rx, 0.02, cz, 0, 0, 0, 0.5, 0.05, 170); for (let z = -88; z <= 88; z += 6) { w.add('l', G.sph(6), z % 12 ? 0xfacc15 : 0x60a5fa, cx + rx - 7.5, 0.2, cz + z, 0, 0, 0, 0.2, 0.2, 0.2, 1.2); w.add('l', G.sph(6), z % 12 ? 0xfacc15 : 0x60a5fa, cx + rx + 7.5, 0.2, cz + z, 0, 0, 0, 0.2, 0.2, 0.2, 1.2); } }
  for (const p of PORT_PLACES) building(w, p);
  { const T = w.tf(cx + 12, 0, cz - 40, 0); T.add('m', G.cyl(12), 0xe0f2fe, 0, 0, 0, 0, 0, 0, 2.2, 16, 2.2); T.add('e', G.cyl(12), 0x7dd3fc, 0, 16, 0, 0, 0, 0, 3.4, 3, 3.4); T.add('m', G.cyl(12), 0x0c4a6e, 0, 19, 0, 0, 0, 0, 3.8, 0.6, 3.8); T.add('l', G.sph(8), 0xef4444, 0, 20.4, 0, 0, 0, 0, 0.5, 0.5, 0.5, 1.4); T.solid(0, 0, 0, 4.4, 20, 4.4); }
  for (let i = 0; i < 3; i++) { building(w, { x: cx - 70, z: cz - 50 + i * 40, ry: E, W: 24, D: 16, H: 8, style: 'barn', col: 0x64748b, col2: 0x334155, roof: 0x1e293b, sign: 'HANGAR ' + (i + 1), noEnter: true }); K.sledge(w, cx - 52, cz - 50 + i * 40, E, [0xdc2626, 0x16a34a, 0x2563eb][i], 1.6); }
  // arrivals side of the port: charter terminal, mail + air cargo, a welcome arch, lamps, benches, luggage, parked charter sleighs, windsock
  building(w, { x: cx + 27, z: cz + 28, ry: W_, W: 16, D: 10, H: 5.5, style: 'timber', col: 0xe0f2fe, trim: 0x0c4a6e, roof: 0x0c4a6e, awning: [0x0ea5e9, 0xffffff], sign: 'CHARTER SLEIGH TERMINAL', feat: ['clockspire'], noEnter: true });
  building(w, { x: cx - 27, z: cz + 28, ry: E, W: 16, D: 11, H: 6, style: 'brick', col: 0x991b1b, trim: 0xfff7ed, sign: 'NORTH POLE MAIL · AIR CARGO', feat: ['chute'], noEnter: true });
  { const T = w.tf(cx, 0, cz + 15, 0); for (const sd of [-1, 1]) T.box('m', 0x0c4a6e, sd * 5, 0, 0, 0.6, 4.6, 0.6); T.box('m', 0x0c4a6e, 0, 4.4, 0, 10.6, 0.5, 0.6); K.sign(w, T, 'WELCOME TO THE NORTH POLE SLEIGH PORT', 0, 3.4, 0.32, 9.2, 0.8, '#0c4a6e', '#e0f2fe'); for (const sd of [-1, 1]) { const p = T.P(sd * 5, 0, 0); w.solid(p[0] - 0.3, 0, p[2] - 0.3, p[0] + 0.3, 4.6, p[2] + 0.3); } }
  for (let z = cz + 8; z >= cz - 28; z -= 9) for (const sd of [-1, 1]) K.lamp(w, cx + sd * 5.5, z);
  for (const sd of [-1, 1]) { K.bench(w, cx + sd * 11, cz + 37, PI); K.bench(w, cx + sd * 11, cz + 23, 0); }
  for (let i = 0; i < 7; i++) K.crate(w, cx - 18 + (i % 4) * 1.3, cz + 20 + Math.floor(i / 4) * 1.3, 1, i * 0.3, 0); for (let i = 0; i < 6; i++) K.present(w, cx + 17 + (i % 3) * 0.9, cz + 21 + Math.floor(i / 3) * 0.9, 0.8, i);
  for (let i = 0; i < 4; i++) K.sledge(w, cx + 24 + (i % 2) * 7, cz - 8 - Math.floor(i / 2) * 12, PI, [0x0ea5e9, 0xdc2626, 0x16a34a, 0x7c3aed][i], 1.3); K.sledge(w, cx + 40, cz - 64, PI, 0xdc2626, 2.2); K.sledge(w, cx - 40, cz + 52, 0, 0xf5c542, 2.0);
  { const x = cx + 54, z = cz + 6; w.add('x', G.cyl(6), 0xd1d5db, x, 0, z, 0, 0, 0, 0.1, 6, 0.1); w.add('f', G.cone(10), 0xf97316, x + 1.2, 5.5, z, 0, 0, -PI / 2, 0.45, 2.2, 0.45); w.solid(x - 0.2, 0, z - 0.2, x + 0.2, 6, z + 0.2); }
  K.bigTree(w, cx - 13, cz + 45, 0.55); K.snowman(w, cx + 14, cz + 45, 1, PI); K.snowman(w, cx - 30, cz - 8, 0.9, 0.6); for (let i = 0; i < 5; i++) K.candyCane(w, cx - 8 + i * 4, cz + 52, 2.2, 0);
  w.zones = w.zones.filter((z) => !(z.place && z.place.noEnter));
  w.add('m', G.cyl(24), 0xcbd5e1, cx, 0, cz + 30, 0, 0, 0, 9, 0.12, 9); w.add('l', G.ring(0.9, 24), 0xfacc15, cx, 0.14, cz + 30, 0, 0, 0, 8.5, 1, 8.5, 0.6);
  for (let i = 0; i < 60; i++) { const x = cx + (K.R() - 0.5) * 190, z = cz + (K.R() - 0.5) * 190; if (Math.abs(x - cx) < 85 && Math.abs(z - cz) < 92) continue; K.pine(w, x, z, 0.8 + K.R() * 0.8); }
  for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2, r = 260; w.add('m', G.cone(7), 0x7d8da3, cx + Math.cos(a) * r, -2, cz + Math.sin(a) * r, 0, i, 0, 60, 80, 60); w.add('m', G.cone(7), 0xf8fafc, cx + Math.cos(a) * r, 42, cz + Math.sin(a) * r, 0, i, 0, 28, 37, 28); }
  aurora(w, cx, cz - 220); }
