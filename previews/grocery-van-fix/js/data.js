// Grok Grocery Tycoon - game data: departments, fixtures, stores, ranks, staff, suppliers, events.
import { OWN as OWN58 } from './holiday.js?v=ggt21mp';
export const DEPTS = {
  grocery: { n: 'Grocery', e: '🥫', val: 6, sup: 'ratita', col: 0xef4444 },
  produce: { n: 'Produce', e: '🥦', val: 5, sup: 'farm', col: 0x16a34a },
  bakery: { n: 'Bakery', e: '🥖', val: 7, sup: 'farm', col: 0xd97706 },
  deli: { n: 'Deli', e: '🥪', val: 9, sup: 'farm', col: 0xdb2777 },
  meat: { n: 'Meat & Seafood', e: '🥩', val: 12, sup: 'farm', col: 0xb91c1c },
  frozen: { n: 'Frozen', e: '🧊', val: 8, sup: 'tortuga', col: 0x0284c7 },
  dairy: { n: 'Dairy', e: '🥛', val: 5, sup: 'farm', col: 0x2563eb },
  brand: { n: 'Grok Goods', e: '⭐', val: 8, sup: 'brand', col: 0x7c3aed },
  snacks: { n: 'Snacks & Drinks', e: '🍿', val: 3, sup: 'ratita', col: 0xf97316 },
  health: { n: 'Pharmacy & Health', e: '💊', val: 9, sup: 'tortuga', col: 0x0d9488 },
  pets: { n: 'Pet Supplies', e: '🐾', val: 11, sup: 'ruff', col: 0xc8634a },
  toys: { n: 'Toys & Games', e: '🧸', val: 14, sup: 'ratita', col: 0xe11d48 },
  shoes: { n: 'Shoes', e: '👟', val: 30, sup: 'ruff', col: 0x7c3aed },
  tech: { n: 'Electronics', e: '📺', val: 65, sup: 'ratita', col: 0x0ea5e9 },
  apparel: { n: 'Clothing', e: '👕', val: 18, sup: 'ruff', col: 0xdb2777 },
  home: { n: 'Home Goods', e: '🛋️', val: 20, sup: 'tortuga', col: 0xa16207 },
};
// what shoppers ask about (help-a-shopper quiz: "where would I find ...?")
export const DEPT_ITEMS = {
  grocery: ['🥫 canned soup', '🍝 spaghetti', '🥣 cereal', '🍯 honey', '🧂 salt'], produce: ['🍎 apples', '🥑 avocados', '🥕 carrots', '🍌 bananas', '🥬 lettuce'], bakery: ['🥖 a baguette', '🎂 a birthday cake', '🥐 croissants', '🧁 cupcakes'],
  deli: ['🧀 sliced cheese', '🥪 a sub sandwich', '🍗 rotisserie chicken', '🥓 sliced ham'], meat: ['🥩 steak', '🐟 salmon', '🦐 shrimp', '🍔 burger patties'], frozen: ['🍦 ice cream', '🍕 frozen pizza', '🧇 frozen waffles', '🥟 dumplings'],
  dairy: ['🥛 milk', '🧈 butter', '🥚 eggs', '🍶 yogurt'], brand: ['⭐ Grok-O\'s cereal', '⭐ Luna\'s Cheesy Bites', '⭐ Snowball ice cream'], snacks: ['🍿 popcorn', '🥤 a soda', '🍫 a candy bar', '🥨 pretzels'],
  health: ['💊 vitamins', '🩹 bandages', '🧴 sunscreen', '🤧 tissues', '🪥 a toothbrush'], pets: ['🦴 dog treats', '🐟 fish food', '🐱 cat litter', '🎾 a squeaky ball'], toys: ['🧸 a teddy bear', '🧩 a puzzle', '🚂 a toy train', '🎲 board games', '🪀 a yo-yo'],
  shoes: ['👟 running shoes', '👢 boots', '🩴 flip-flops', '👠 dress shoes', '🥾 hiking boots'], tech: ['📺 a TV', '🎧 headphones', '📱 a phone case', '🎮 a game console', '💻 a laptop'],
  apparel: ['👕 a T-shirt', '👖 jeans', '🧥 a winter coat', '🧢 a cap', '🧦 socks'], home: ['🛋️ a sofa', '🛏️ pillows', '🕯️ candles', '🖼️ picture frames', '🍳 a frying pan'],
};
export const DEPT_IDS = Object.keys(DEPTS);
// fixtures you can place in a slot. kind: 'floor' (sales floor) or 'check' (checkout row)
export const FIX = {
  aisle: { n: 'Grocery Aisle', e: '🥫', dept: 'grocery', cap: 40, cost: 500, kind: 'floor' },
  produce: { n: 'Produce Stand', e: '🥦', dept: 'produce', cap: 30, cost: 700, kind: 'floor' },
  bakery: { n: 'Bakery Case', e: '🥖', dept: 'bakery', cap: 24, cost: 1100, kind: 'floor' },
  deli: { n: 'Deli Counter', e: '🥪', dept: 'deli', cap: 24, cost: 1300, kind: 'floor' },
  meat: { n: 'Meat Case', e: '🥩', dept: 'meat', cap: 24, cost: 1200, kind: 'floor' },
  frozen: { n: 'Freezer Doors', e: '🧊', dept: 'frozen', cap: 30, cost: 1400, kind: 'floor' },
  dairy: { n: 'Dairy Cooler', e: '🥛', dept: 'dairy', cap: 30, cost: 900, kind: 'floor' },
  brand: { n: 'Grok Goods Display', e: '⭐', dept: 'brand', cap: 24, cost: 800, kind: 'floor', need: 'brand' },
  snackrack: { n: 'Snack Rack', e: '🍿', dept: 'snacks', cap: 36, cost: 450, kind: 'floor' },
  rxshelf: { n: 'Health Aisle', e: '🧴', dept: 'health', cap: 30, cost: 700, kind: 'floor' },
  rxcounter: { n: 'Pharmacy Counter', e: '💊', dept: 'health', cap: 20, cost: 1500, kind: 'floor' },
  petfood: { n: 'Pet Food Aisle', e: '🦴', dept: 'pets', cap: 30, cost: 600, kind: 'floor' },
  aquarium: { n: 'Aquarium Wall', e: '🐠', dept: 'pets', cap: 16, cost: 1200, kind: 'floor' },
  toyshelf: { n: 'Toy Shelf', e: '🚂', dept: 'toys', cap: 30, cost: 650, kind: 'floor' },
  plushbin: { n: 'Plush + Ball Bins', e: '🧸', dept: 'toys', cap: 24, cost: 500, kind: 'floor' },
  shoewall: { n: 'Shoe Wall', e: '👟', dept: 'shoes', cap: 26, cost: 800, kind: 'floor' },
  shoetable: { n: 'Shoe Display + Bench', e: '🥾', dept: 'shoes', cap: 18, cost: 600, kind: 'floor' },
  tvwall: { n: 'TV Wall', e: '📺', dept: 'tech', cap: 12, cost: 2000, kind: 'floor' },
  techcase: { n: 'Gadget Table', e: '🎧', dept: 'tech', cap: 16, cost: 1500, kind: 'floor' },
  clothesrack: { n: 'Clothing Racks', e: '👕', dept: 'apparel', cap: 30, cost: 550, kind: 'floor' },
  foldtable: { n: 'Folding Tables + Mannequins', e: '👖', dept: 'apparel', cap: 26, cost: 500, kind: 'floor' },
  thanks: { n: 'Thanksgiving Aisle', e: '🦃', dept: 'grocery', cap: 36, cost: 600, kind: 'floor', need: 'dlc58' }, // DLC #58 Mini Pack
  homeshelf: { n: 'Home Decor Shelf', e: '🕯️', dept: 'home', cap: 24, cost: 650, kind: 'floor' },
  sofa: { n: 'Living Room Display', e: '🛋️', dept: 'home', cap: 8, cost: 1400, kind: 'floor' },
  register: { n: 'Checkout Lane', e: '🧾', cost: 900, kind: 'check' },
  selfck: { n: 'Ratita Self-Checkout', e: '🤖', cost: 1600, kind: 'check', need: 'selfck' },
};
export const SHELF_TYPES = Object.keys(FIX).filter((k) => FIX[k].kind === 'floor');
// every kind of store you can run (career: work at any type; empire: mix them on the town map)
// fix: fixtures allowed on the floor, mix: the default floor plan pattern, sp: fixture -> department special mini-game
export const TYPES = {
  grocery: { n: 'Supermarket', e: '🛒', brand: 'GROK GROCERY', tag: 'FRESH EVERY DAY', fix: ['produce', 'aisle', 'bakery', 'deli', 'meat', 'dairy', 'frozen', 'brand', 'snackrack'], mix: ['produce', 'produce', 'bakery', 'deli', 'meat', 'dairy', 'dairy', 'frozen', 'frozen', 'aisle', 'aisle', 'aisle', 'aisle', 'aisle', 'snackrack', 'aisle', 'aisle', 'aisle'], traffic: 1, sp: { produce: 'pyramid', deli: 'slice', bakery: 'frost' }, words: ['FRESH', 'LOCAL', 'FRIENDLY'], col: 0x16a34a, carts: true, blurb: 'Fresh produce, bakery, deli, meat, frozen and dairy.' },
  supercenter: { n: 'Supercenter', e: '🏬', brand: 'GROK SUPERCENTER', tag: 'EVERYTHING UNDER ONE ROOF', big: true, fix: ['produce', 'aisle', 'bakery', 'deli', 'meat', 'dairy', 'frozen', 'brand', 'snackrack', 'tvwall', 'techcase', 'toyshelf', 'clothesrack', 'shoewall', 'homeshelf', 'rxshelf', 'petfood'], mix: ['produce', 'bakery', 'deli', 'meat', 'dairy', 'frozen', 'aisle', 'aisle', 'snackrack', 'tvwall', 'techcase', 'toyshelf', 'clothesrack', 'shoewall', 'homeshelf', 'rxshelf', 'petfood', 'aisle', 'frozen', 'produce', 'aisle', 'dairy', 'toyshelf', 'clothesrack'], traffic: 1.3, sp: { produce: 'pyramid', deli: 'slice', bakery: 'frost', clothesrack: 'fold', tvwall: 'tech', toyshelf: 'wrap' }, words: ['GROCERIES', 'ELECTRONICS', 'HOME + STYLE'], col: 0x2563eb, carts: true, blurb: 'Huge: groceries PLUS electronics, toys, clothes, shoes, home and pharmacy. Needs a big lot.' },
  market: { n: 'Neighborhood Market', e: '🧺', brand: 'GROK MARKET', tag: 'YOUR CORNER GROCER', fix: ['produce', 'aisle', 'dairy', 'bakery', 'deli', 'frozen', 'snackrack', 'brand'], mix: ['produce', 'aisle', 'dairy', 'bakery', 'aisle', 'frozen', 'deli', 'snackrack', 'aisle', 'produce'], traffic: 0.85, sp: { produce: 'pyramid', deli: 'slice', bakery: 'frost' }, words: ['NEIGHBORS', 'FRESH', 'QUICK'], col: 0xea580c, carts: true, blurb: 'A small, friendly grocery: fewer aisles, loyal locals.' },
  convenience: { n: 'Convenience Store', e: '🏪', brand: 'GROK GO', tag: 'OPEN LATE · GRAB + GO', fix: ['snackrack', 'aisle', 'dairy', 'frozen', 'rxshelf'], mix: ['snackrack', 'snackrack', 'aisle', 'dairy', 'frozen', 'snackrack', 'rxshelf', 'aisle'], traffic: 1.1, sp: { snackrack: 'coffee' }, words: ['SNACKS', 'SLUSHIES', 'GRAB + GO'], col: 0xf97316, blurb: 'Snacks, drinks and essentials. Quick trips, lots of them.' },
  pharmacy: { n: 'Pharmacy', e: '💊', brand: 'GROK PHARMACY', tag: 'HEALTH + WELLNESS', fix: ['rxcounter', 'rxshelf', 'snackrack', 'homeshelf'], mix: ['rxcounter', 'rxshelf', 'rxshelf', 'snackrack', 'rxshelf', 'homeshelf', 'rxshelf', 'rxcounter'], traffic: 0.75, sp: { rxcounter: 'rx', rxshelf: 'rx' }, words: ['PHARMACY', 'WELLNESS', 'BEAUTY'], col: 0x0d9488, blurb: 'Prescriptions, vitamins, first aid and beauty.' },
  shoe: { n: 'Shoe Store', e: '👟', brand: 'GROK KICKS', tag: 'STEP UP YOUR GAME', fix: ['shoewall', 'shoetable'], mix: ['shoewall', 'shoetable', 'shoewall', 'shoetable', 'shoewall', 'shoewall', 'shoetable', 'shoewall'], traffic: 0.45, sp: { shoewall: 'fit', shoetable: 'fit' }, words: ['SNEAKERS', 'BOOTS', 'NEW KICKS'], col: 0x7c3aed, blurb: 'Sneakers, boots and dress shoes. Help shoppers find the right fit.' },
  toy: { n: 'Toy Store', e: '🧸', brand: 'GROK TOYS', tag: 'PLAY ALL DAY', fix: ['toyshelf', 'plushbin'], mix: ['toyshelf', 'plushbin', 'toyshelf', 'toyshelf', 'plushbin', 'toyshelf', 'plushbin', 'toyshelf'], traffic: 0.65, sp: { toyshelf: 'wrap', plushbin: 'wrap' }, words: ['PLAY', 'GAMES', 'PLUSH PALS'], col: 0xe11d48, blurb: 'Plushies, trains, puzzles and games. Gift-wrap season is wild.' },
  tech: { n: 'Electronics Store', e: '📺', brand: 'GROK TECH', tag: 'GADGETS GALORE', fix: ['tvwall', 'techcase'], mix: ['tvwall', 'techcase', 'tvwall', 'techcase', 'techcase', 'tvwall', 'techcase', 'tvwall'], traffic: 0.3, sp: { tvwall: 'tech', techcase: 'tech' }, words: ['4K TVs', 'GAMING', 'AUDIO'], col: 0x0ea5e9, blurb: 'TVs, consoles, headphones and laptops. Few shoppers, big tickets.' },
  pet: { n: 'Pet Store', e: '🐾', brand: 'GROK PETS', tag: 'FOR FURRY FRIENDS', fix: ['petfood', 'aquarium'], mix: ['petfood', 'aquarium', 'petfood', 'petfood', 'aquarium', 'petfood', 'petfood', 'aquarium'], traffic: 0.7, sp: { aquarium: 'feed', petfood: 'feed' }, words: ['PAWS', 'FISH', 'TREATS'], col: 0xc8634a, blurb: 'Kibble, fish tanks and squeaky toys. Candy approves.' },
  clothing: { n: 'Clothing Store', e: '👕', brand: 'GROK THREADS', tag: 'WEAR THE GROK LOOK', fix: ['clothesrack', 'foldtable', 'shoewall'], mix: ['clothesrack', 'foldtable', 'clothesrack', 'clothesrack', 'foldtable', 'shoewall', 'clothesrack', 'foldtable'], traffic: 0.55, sp: { clothesrack: 'fold', foldtable: 'fold' }, words: ['NEW STYLES', 'DENIM', 'SALE RACK'], col: 0xdb2777, blurb: 'Racks, mannequins and folding tables. Keep it tidy!' },
  home: { n: 'Home Goods Store', e: '🛋️', brand: 'GROK HOME', tag: 'MAKE IT COZY', fix: ['homeshelf', 'sofa'], mix: ['sofa', 'homeshelf', 'homeshelf', 'sofa', 'homeshelf', 'homeshelf', 'sofa', 'homeshelf'], traffic: 0.5, sp: { sofa: 'stage', homeshelf: 'stage' }, words: ['COZY', 'KITCHEN', 'DECOR'], col: 0xa16207, blurb: 'Sofas, lamps, pillows and kitchenware.' },
};
if (OWN58) for (const t of ['grocery', 'supercenter', 'market']) TYPES[t].fix.push('thanks'); // DLC #58: the Thanksgiving Aisle is buildable in food stores
export const TYPE_IDS = Object.keys(TYPES);
export const typeOf = (st) => TYPES[(st && st.type) || 'grocery'] || TYPES.grocery;
// default floor plan for a store type in a given footprint (fill = share of floor slots in use)
export function autoLayout(type, G, fill = 1, nReg = 99) { const T = TYPES[type]; const floor = G.slots.filter((s) => s.kind === 'floor'), nF = Math.round(floor.length * fill); let fi = 0, ci = 0;
  return G.slots.map((s) => { if (s.kind === 'floor') { const k = fi++; return k < nF ? T.mix[k % T.mix.length] : ''; } const k = ci++; return k < nReg ? 'register' : ''; }); }
// store buildings (all face south: front doors + parking on the south side, stockroom + truck dock on the north side)
export const STORES = [
  { id: 's1', name: 'Your Store · Main St', short: 'Main St', type: 'grocery', x0: -24, z0: -46, x1: 24, z1: -6, price: 0, dockZ: -53, wall: 0xfff7ed, trim: 0x16a34a, roof: 0x166534, floorC: [0xf8fafc, 0xe2e8f0] },
  { id: 's2', name: 'Maple Ave Lot', short: 'Maple Ave', type: 'grocery', x0: -72, z0: 56, x1: -36, z1: 94, price: 9000, dockZ: 53, wall: 0xfef3c7, trim: 0xea580c, roof: 0x9a3412, floorC: [0xfffbeb, 0xfde68a] },
  { id: 's3', name: 'Harbor Lot', short: 'Harbor', type: 'grocery', x0: 36, z0: 56, x1: 72, z1: 94, price: 16000, dockZ: 53, wall: 0xe0f2fe, trim: 0x0369a1, roof: 0x075985, floorC: [0xf0f9ff, 0xbae6fd] },
  { id: 'rival', name: 'Bargain Bonanza', short: 'Bonanza', x0: -76, z0: -48, x1: -36, z1: -8, price: 30000, dockZ: -53, wall: 0xfde047, trim: 0xdc2626, roof: 0x991b1b, floorC: [0xfefce8, 0xfef08a], rival: true, type: 'grocery', brandName: 'BARGAIN BONANZA', tag: 'LOW LOW PRICES!' },
  { id: 'rival2', name: 'QuickCart Express', short: 'QuickCart', x0: 76, z0: 56, x1: 106, z1: 92, price: 22000, dockZ: 53, wall: 0xe0e7ff, trim: 0x4f46e5, roof: 0x312e81, floorC: [0xeef2ff, 0xc7d2fe], rival: true, type: 'market', brandName: 'QUICKCART EXPRESS', tag: 'FAST + FANCY' },
  // Shopsville Shopping Row (south of the dock road): a rival supercenter and six specialty shops. Every one is walk-in and for sale.
  { id: 'mega', name: 'MegaMart Supercenter', short: 'MegaMart', x0: -100, z0: -97.5, x1: -50, z1: -63.5, price: 26000, dockZ: -59, wall: 0xdbeafe, trim: 0x1d4ed8, roof: 0x1e3a8a, floorC: [0xf8fafc, 0xdbeafe], rival: true, strip: true, type: 'supercenter', brandName: 'MEGAMART', tag: 'SUPER SIZE EVERYTHING', boss: 'Mr. Mega' },
  { id: 'r_toy', name: 'ToyTopia', short: 'ToyTopia', x0: -48, z0: -97.5, x1: -25, z1: -63.5, price: 7000, dockZ: -59, wall: 0xfce7f3, trim: 0xe11d48, roof: 0x9f1239, floorC: [0xfff1f2, 0xfecdd3], rival: true, strip: true, easy: true, type: 'toy', brandName: 'TOYTOPIA', tag: 'WHERE FUN LIVES', boss: 'Tilly Topper' },
  { id: 'r_shoe', name: 'Sole Patrol', short: 'Sole Patrol', x0: -23, z0: -97.5, x1: 0, z1: -63.5, price: 7500, dockZ: -59, wall: 0xede9fe, trim: 0x6d28d9, roof: 0x4c1d95, floorC: [0xf5f3ff, 0xddd6fe], rival: true, strip: true, easy: true, type: 'shoe', brandName: 'SOLE PATROL', tag: 'SHOES FOR EVERY FOOT', boss: 'Sully Sole' },
  { id: 'r_tech', name: 'ZapZone Electronics', short: 'ZapZone', x0: 2, z0: -97.5, x1: 25, z1: -63.5, price: 11000, dockZ: -59, wall: 0x1e293b, trim: 0x0ea5e9, roof: 0x0f172a, floorC: [0x334155, 0x1e293b], rival: true, strip: true, easy: true, type: 'tech', brandName: 'ZAPZONE', tag: 'ELECTRONICS', boss: 'Zed Zapper' },
  { id: 'r_pet', name: 'PawPals Pet Shop', short: 'PawPals', x0: 27, z0: -97.5, x1: 50, z1: -63.5, price: 6500, dockZ: -59, wall: 0xffedd5, trim: 0xc2410c, roof: 0x7c2d12, floorC: [0xfff7ed, 0xfed7aa], rival: true, strip: true, easy: true, type: 'pet', brandName: 'PAWPALS', tag: 'PET SHOP', boss: 'Polly Paws' },
  { id: 'r_cloth', name: 'Fit & Fab Clothing', short: 'Fit & Fab', x0: 52, z0: -97.5, x1: 75, z1: -63.5, price: 7000, dockZ: -59, wall: 0xfdf2f8, trim: 0xbe185d, roof: 0x831843, floorC: [0xfdf2f8, 0xfbcfe8], rival: true, strip: true, easy: true, type: 'clothing', brandName: 'FIT & FAB', tag: 'FASHION', boss: 'Fiona Fab' },
  { id: 'r_rx', name: 'PillBox Pharmacy', short: 'PillBox', x0: 77, z0: -97.5, x1: 100, z1: -63.5, price: 8000, dockZ: -59, wall: 0xf0fdfa, trim: 0x0f766e, roof: 0x134e4a, floorC: [0xf0fdfa, 0xccfbf1], rival: true, strip: true, easy: true, type: 'pharmacy', brandName: 'PILLBOX', tag: 'PHARMACY', boss: 'Dr. Pill' },
];
export const STORE = Object.fromEntries(STORES.map((s) => [s.id, s]));
// slot grid for a store footprint (local layout used by the map, the fixtures and the shopper sim)
export function storeGeom(d) {
  const W = d.x1 - d.x0, cx = (d.x0 + d.x1) / 2, sm = !!d.strip, back = d.z0 + (sm ? 7.5 : 9), front = d.z1;
  const G = { cx, back, front, doorX: cx, zCheck: front - (sm ? 5 : 6.5), zFloorF: front - (sm ? 8.5 : 10.5), slots: [], W };
  const cols = Math.floor((W - 5) / 4.6), sx = (W - 4.6 * (cols - 1)) / 2; G.lanes = [];
  const zTop = back + 2.6, zBot = G.zFloorF; const rows = Math.max(1, Math.floor((zBot - zTop + 2.8) / 7.8)); const rowStep = (zBot - zTop) / rows;
  G.cross = [zTop - 1.3]; for (let r = 0; r < rows; r++) { const zc = zTop + rowStep * (r + 0.5); for (let c = 0; c < cols; c++) G.slots.push({ kind: 'floor', x: d.x0 + sx + c * 4.6, z: zc, row: r, col: c }); G.cross.push(zTop + rowStep * (r + 1) + 0.0); }
  G.cross[G.cross.length - 1] = zBot + 1.2;
  for (let c = 0; c <= cols; c++) G.lanes.push(d.x0 + sx + (c - 0.5) * 4.6);
  // checkout row: lanes either side of the entrance walkway
  const n = Math.floor((W / 2 - 6) / 4.3); for (let i = 0; i < n; i++) { G.slots.push({ kind: 'check', x: cx - 5.6 - i * 4.3, z: G.zCheck }); G.slots.push({ kind: 'check', x: cx + 5.6 + i * 4.3, z: G.zCheck }); }
  G.sx1 = W >= 34 ? d.x0 + W * 0.5 : d.x0 + W * 0.4; G.sx2 = W >= 34 ? d.x1 - 11 : d.x1 - W * 0.3;
  G.stock = [d.x0 + Math.min(6, (G.sx1 - d.x0) * 0.45), back - 4.5]; G.office = [(G.sx2 + d.x1) / 2 + 0.4, back - 4.5]; G.clock = [Math.min(G.sx2 - 1.5, (G.sx1 + G.sx2) / 2 + 2), back - 6.5]; G.dock = [d.x0 + 10, d.z0];
  return G;
}
export const LAYOUTS = {
  career: { floor: ['produce', 'produce', 'bakery', 'deli', 'meat', 'dairy', 'dairy', 'frozen', 'frozen', 'aisle', 'aisle', 'aisle', 'aisle', 'aisle', 'aisle', 'aisle', 'aisle', 'aisle'], check: ['register', 'register', 'register', 'register', 'selfck', 'selfck'] },
  boss: { floor: ['produce', 'bakery', 'deli', 'dairy', 'frozen', 'aisle', 'aisle', 'aisle', '', 'produce', 'aisle', 'aisle', 'aisle', '', 'dairy', 'aisle', '', 'aisle'], check: ['register', 'register', 'register', 'register'] },
  starter: { floor: ['produce', 'dairy', 'frozen', 'aisle', 'bakery', 'aisle', 'aisle', '', 'aisle', 'produce', '', 'aisle', 'aisle', ''], check: ['register', 'register', 'register'] },
  rival2: { floor: ['produce', 'aisle', 'deli', 'aisle', 'frozen', 'dairy', 'aisle', 'bakery', 'aisle', 'aisle'], check: ['selfck', 'register', 'selfck', 'register'] },
  rival: { floor: ['aisle', 'aisle', 'produce', 'frozen', 'aisle', 'dairy', 'aisle', 'aisle', 'aisle', 'meat', 'aisle', 'aisle', 'frozen', 'aisle', 'aisle', 'bakery'], check: ['register', 'register', 'register', 'selfck', 'register', 'register'] },
};
export const RANKS = [
  { n: 'Courtesy Clerk', e: '🛒', xp: 0, wage: 60, can: 'Bag groceries, round up carts, stock shelves, clean up and help shoppers.' },
  { n: 'Cashier', e: '🧾', xp: 70, wage: 90, can: 'Run a checkout lane: scan, bag and smile.' },
  { n: 'Department Lead', e: '🥦', xp: 180, wage: 130, can: 'Own a department: pyramids, deli slicing, cupcakes and stock orders.' },
  { n: 'Assistant Manager', e: '📋', xp: 340, wage: 180, can: 'Order stock for the whole store and hire staff at Ruffsources.' },
  { n: 'Store Manager', e: '🏪', xp: 560, wage: 260, can: 'Set prices, rebuild the floor plan and run promotions.' },
  { n: 'Owner', e: '👑', xp: 900, wage: 0, can: 'Buy the store from Grandpa Gus, then build a grocery empire!' },
];
export const ROLES = {
  cashier: { n: 'Cashier', e: '🧾', wage: 70, blurb: 'Runs a checkout lane' },
  stocker: { n: 'Stocker', e: '📦', wage: 60, blurb: 'Moves backstock to the shelves' },
  bagger: { n: 'Bagger', e: '🛍️', wage: 45, blurb: 'Checkout goes 30% faster' },
  janitor: { n: 'Janitor', e: '🧽', wage: 55, blurb: 'Mops spills, keeps it sparkling' },
  greeter: { n: 'Greeter', e: '👋', wage: 50, blurb: 'Happier shoppers, +reputation' },
  manager: { n: 'Asst. Manager', e: '📋', wage: 120, blurb: 'Auto-orders stock for this store' },
};
export const FIRST = ['Ava', 'Ben', 'Cleo', 'Dev', 'Eli', 'Fern', 'Gus', 'Hana', 'Ivy', 'Jay', 'Kai', 'Lola', 'Milo', 'Nia', 'Omar', 'Pip', 'Quinn', 'Rosa', 'Sam', 'Tess', 'Uma', 'Vic', 'Wren', 'Yuki', 'Zed'];
export const LAST = ['Apple', 'Basil', 'Crumb', 'Dill', 'Endive', 'Fig', 'Gouda', 'Honeydew', 'Kale', 'Lime', 'Mango', 'Nutmeg', 'Oat', 'Pickle', 'Radish', 'Sprout', 'Turnip', 'Waffle'];
// pet cameo hires (unlock through events / suppliers)
export const CAMEOS = {
  luna: { n: 'Luna', role: 'cashier', e: '🐭', perk: 'Ratita tech whiz: her lane and every self-checkout never jam' },
  pirat: { n: 'Pi-rat', role: 'greeter', e: '🏴‍☠️', perk: 'Security captain: no shoplifters, +reputation' },
  snowie: { n: 'Snowie', role: 'stocker', e: '🐁', perk: 'Speed stocker who air-drops cases: 2x stocking' },
  candy: { n: 'Candy', role: 'greeter', e: '🐶', perk: 'Greets every shopper: +patience, +reputation' },
  torty: { n: 'Torty', role: 'manager', e: '🐢', perk: 'Slow, steady, never wrong: auto-orders cheaper' },
};
export const SUPPLIERS = {
  farm: { n: 'Fernhill Farm Co-op', e: '🧺', who: 'Farmer Fern', depts: ['produce', 'dairy', 'meat', 'bakery', 'deli'] },
  ratita: { n: 'Ratita Industries', e: '🐭', who: 'Luna', depts: ['grocery'] },
  tortuga: { n: 'Tortuga Tech Cold Chain', e: '🐢', who: 'Torty', depts: ['frozen'] },
  brand: { n: 'Grok Goods Lab', e: '⭐', who: 'you', depts: ['brand'] },
  dc: { n: 'Your Distribution Center', e: '🏭', who: 'your team', depts: ['grocery', 'produce', 'bakery', 'deli', 'meat', 'frozen', 'dairy', 'brand'] },
};
export const BRAND_LINES = [
  { id: 'oats', n: "Grok-O's Cereal", e: '🥣', cost: 600 }, { id: 'cheese', n: 'Luna\'s Cheesy Bites', e: '🧀', cost: 900, who: 'Ratita Industries' },
  { id: 'greens', n: 'Torty\'s Turtle Greens', e: '🥬', cost: 900, who: 'Tortuga Tech' }, { id: 'pop', n: 'Pi-rat Pirate Popcorn', e: '🍿', cost: 1100 },
  { id: 'ice', n: 'Snowie Snowball Ice Cream', e: '🍦', cost: 1300 }, { id: 'cookie', n: 'Candy\'s Kibble Cookies', e: '🍪', cost: 1500, who: 'Ruffsources' },
];
export const EMPIRE = { dc: 12000, truck: 2500, brand: 5000, selfck: 2500, cold: 3000, ad: 400 };
export const GOALS = [
  ['dept6', 'Open 6 different departments'], ['staff4', 'Hire 4 staff'], ['gradeA', 'Ace a health inspection (grade A)'], ['store2', 'Open a second store'],
  ['dc', 'Build the distribution center'], ['brand', 'Launch Grok Goods, your store brand'], ['fleet', 'Run 3 delivery trucks'], ['store3', 'Open a third store'], ['mix3', 'Run 3 different store types'], ['buyout', 'Buy out Bargain Bonanza'], ['tycoon', 'Retail Tycoon: 5 stores + DC + brand']
];
