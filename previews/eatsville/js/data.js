// Eatsville map + game data.
export const ROADS = [-90, -30, 30, 90]; export const RW = 12; // road centre lines (x and z) + asphalt width
export const SIDEW = 3.2;
// buildings: x,z centre, w (x) d (z), h, face 'n'|'s' (door side), kind -> interior + exterior style
export const BUILDINGS = [
  { id: 'home', name: 'MY HOUSE', kind: 'home', style: 'house', x: -70, z: -70, w: 16, d: 13, h: 7, face: 'n', col: 0xffd6a5, col2: 0x8b5cf6 },
  { id: 'h1', name: 'THE PATELS', kind: 'house', style: 'house', x: -48, z: -49, w: 13, d: 11, h: 6.5, face: 's', col: 0xbde0fe, col2: 0xef4444 },
  { id: 'hall', name: 'TOWN HALL', kind: 'hall', style: 'civic', x: 0, z: -70, w: 26, d: 15, h: 11, face: 'n', col: 0xf1ead8, col2: 0x2563eb },
  { id: 'gazette', name: 'GAZETTE', kind: 'gazette', style: 'shop', x: 4, z: -49, w: 16, d: 11, h: 8, face: 's', col: 0xe2e8f0, col2: 0x111827 },
  { id: 'h2', name: 'THE NGUYENS', kind: 'house', style: 'house', x: 52, z: -70, w: 13, d: 11, h: 6.5, face: 'n', col: 0xcaffbf, col2: 0x0ea5e9 },
  { id: 'h3', name: 'THE GARCIAS', kind: 'house', style: 'house', x: 70, z: -49, w: 14, d: 11, h: 7, face: 's', col: 0xffc8dd, col2: 0x16a34a },
  { id: 'mega', name: 'MEGA MUNCH', kind: 'rest', style: 'rival1', x: -60, z: -9, w: 22, d: 15, h: 8, face: 'n', col: 0xffd23f, col2: 0xe11d48, owner: 'mega' },
  { id: 'cars', name: 'WHEELIE DEALS', kind: 'cars', style: 'dealer', x: -60, z: 11, w: 22, d: 12, h: 7, face: 's', col: 0xdbeafe, col2: 0xf97316 },
  { id: 'lotA', name: 'MAIN ST DINER', kind: 'rest', style: 'diner', x: 60, z: -9, w: 22, d: 15, h: 7.5, face: 'n', col: 0xfff1f2, col2: 0x14b8a6, lot: 'A' },
  { id: 'market', name: 'FRESHMART', kind: 'market', style: 'shop', x: 60, z: 11, w: 22, d: 12, h: 7, face: 's', col: 0xdcfce7, col2: 0x16a34a },
  { id: 'health', name: 'HEALTH DEPT', kind: 'health', style: 'civic2', x: -60, z: 51, w: 20, d: 14, h: 9, face: 'n', col: 0xe5e7eb, col2: 0x0f766e },
  { id: 'style', name: 'STITCH & STYLE', kind: 'style', style: 'shop', x: -60, z: 71, w: 20, d: 12, h: 7, face: 's', col: 0xfce7f3, col2: 0xdb2777 },
  { id: 'ratita', name: 'RATITA INDUSTRIES', kind: 'ratita', style: 'ratita', x: 0, z: 51, w: 24, d: 15, h: 10, face: 'n', col: 0xf5f3ff, col2: 0xff4fa0 },
  { id: 'lotB', name: 'DOWNTOWN', kind: 'rest', style: 'bistro', x: 0, z: 71, w: 22, d: 12, h: 8, face: 's', col: 0xfef3c7, col2: 0x7c3aed, lot: 'B' },
  { id: 'pizza', name: 'PIZZA PALOOZA', kind: 'rest', style: 'rival2', x: 60, z: 51, w: 22, d: 15, h: 8, face: 'n', col: 0xe9d5ff, col2: 0x16a34a, owner: 'pizza' },
  { id: 'lotC', name: 'HARBOR VIEW', kind: 'rest', style: 'bistro', x: 60, z: 71, w: 22, d: 12, h: 8, face: 's', col: 0xe0f2fe, col2: 0x0369a1, lot: 'C' },
  { id: 'lotD', name: 'PIER SHACK', kind: 'rest', style: 'shack', x: -20, z: 112, w: 18, d: 13, h: 6.5, face: 'n', col: 0xfde68a, col2: 0x0891b2, lot: 'D' },
  { id: 'h4', name: 'BEACH HOUSE', kind: 'house', style: 'house', x: 24, z: 112, w: 14, d: 11, h: 7, face: 'n', col: 0xfef9c3, col2: 0x06b6d4 },
];
export const BLD = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));
export const LOTS = { A: { id: 'lotA', price: 0, name: 'Main St Diner' }, B: { id: 'lotB', price: 1500, name: 'Downtown Bistro' }, C: { id: 'lotC', price: 2600, name: 'Harbor View' }, D: { id: 'lotD', price: 4000, name: 'Pier Shack' } };
export const RIVALS = {
  mega: { n: 'Mega Munch', col: '#e11d48', dish: 'burger', boss: 'Manager Mo', blurb: 'Big burgers, bigger ego.' },
  pizza: { n: 'Pizza Palooza', col: '#7c3aed', dish: 'pizza', boss: 'Signora Sal', blurb: 'Cheesy slices and cheesier slogans.' },
};
export const CAREER = [
  { n: 'Trainee', wage: 30, xp: 0 }, { n: 'Line Cook', wage: 45, xp: 60 }, { n: 'Shift Lead', wage: 65, xp: 160 }, { n: 'Asst. Manager', wage: 90, xp: 320 }, { n: 'Manager', wage: 120, xp: 520 },
];
export const CARS = [
  { id: 'hatch', n: 'Bubble Hatch', price: 0, col: 0xff5a5f, spd: 20, kind: 'hatch' },
  { id: 'truck', n: 'Food Truck', price: 900, col: 0xffd23f, spd: 18, kind: 'van', deliv: 1.5 },
  { id: 'pickup', n: 'Pickup', price: 700, col: 0x3fa7ff, spd: 21, kind: 'pickup' },
  { id: 'sport', n: 'Zoom GT', price: 1800, col: 0xa855f7, spd: 28, kind: 'sport' },
  { id: 'hover', n: 'Ratita Hover-Car', price: 3200, col: 0xff4fa0, spd: 30, kind: 'hover' },
];
export const CAR = Object.fromEntries(CARS.map((c) => [c.id, c]));
export const OUTFITS = [
  { id: 'chef', n: 'Classic Chef', price: 0, shirt: 0xffffff, hat: 'chef', apron: 0xf1f5f9, pants: 0x334155 },
  { id: 'diner', n: 'Diner Teal', price: 60, shirt: 0x14b8a6, hat: 'cap', hatCol: 0xffffff, apron: 0xffffff, pants: 0x1e3a8a },
  { id: 'lab', n: 'Ratita Lab Coat', price: 120, shirt: 0xff4fa0, coat: 0xffffff, hat: 'none', pants: 0x334155, glasses: true },
  { id: 'pirate', n: 'Pirate Chef', price: 150, shirt: 0xb91c1c, hat: 'pirate', apron: 0x1f2937, pants: 0x1f2937 },
  { id: 'astro', n: 'Space Cook', price: 220, shirt: 0xe5e7eb, hat: 'helmet', pants: 0xe5e7eb, apron: 0x6366f1 },
  { id: 'dino', n: 'Dino Suit', price: 260, shirt: 0x4ade80, hat: 'dino', pants: 0x4ade80 },
  { id: 'royal', n: 'Food Emperor', price: 600, shirt: 0x7c3aed, coat: 0xfacc15, hat: 'crown', pants: 0x312e81 },
];
export const DECOR = [
  { id: 'plant', n: 'Potted Palm', price: 40, amb: 2 }, { id: 'aquarium', n: 'Fish Tank', price: 160, amb: 6 }, { id: 'jukebox', n: 'Jukebox', price: 140, amb: 5 },
  { id: 'arcade', n: 'Arcade Cabinet', price: 180, amb: 6 }, { id: 'statue', n: 'Golden Grok Statue', price: 300, amb: 9 }, { id: 'fountain', n: 'Chocolate Fountain', price: 240, amb: 8 },
  { id: 'neon', n: 'Neon Rat Sign', price: 120, amb: 4 }, { id: 'piano', n: 'Tiny Piano', price: 220, amb: 7 },
];
export const THEMES = [
  { id: 'teal', n: 'Retro Teal', wall: 0xccfbf1, trim: 0x14b8a6, floor: 'check', seat: 0xef4444 },
  { id: 'sunny', n: 'Sunny Yellow', wall: 0xfef3c7, trim: 0xf59e0b, floor: 'wood', seat: 0x3b82f6 },
  { id: 'berry', n: 'Berry Pink', wall: 0xfce7f3, trim: 0xdb2777, floor: 'tile', seat: 0x7c3aed },
  { id: 'forest', n: 'Forest Cafe', wall: 0xdcfce7, trim: 0x15803d, floor: 'wood', seat: 0xb45309 },
  { id: 'night', n: 'Midnight Neon', wall: 0x312e81, trim: 0x22d3ee, floor: 'tile', seat: 0xf472b6 },
];
export const STAFF_ROLES = { cook: { n: 'Cook', e: '👩‍🍳', wage: 40 }, waiter: { n: 'Waiter', e: '🧑‍🍽️', wage: 30 }, janitor: { n: 'Janitor', e: '🧹', wage: 25 }, manager: { n: 'Manager', e: '👔', wage: 60 } };
export const NAMES = ['Ava', 'Leo', 'Mia', 'Max', 'Zoe', 'Sam', 'Ivy', 'Kai', 'Lily', 'Omar', 'Rosa', 'Theo', 'Nia', 'Eli', 'Ruby', 'Finn', 'Luz', 'Ben', 'Aria', 'Jay'];
export const CAMEOS = [
  { id: 'torty', n: 'Torty (Martina)', role: 'waiter', skill: 2, wage: 20, blurb: 'Slow and steady... very steady. Customers adore her.', happy: 1.3 },
  { id: 'pirat', n: 'Pi-rat', role: 'cook', skill: 4, wage: 55, blurb: 'Cooks like a pirate: fast, loud, lots of "ARR".' },
  { id: 'candy', n: 'Candy', role: 'janitor', skill: 4, wage: 22, blurb: 'Schnauzer zoomies = squeaky clean floors.' },
];
