// Dishes: data + smooth 3D models (plates, burgers, pizza...). Models are cached merged groups.
import * as THREE from 'three';
import { P } from './geo.js';
import { MB, toGroup, XB } from './kit.js';
import { rcyl, lathe, torus, cyl, cone, sph, blobGeo, star } from './shapes.js';
const PI = Math.PI;
// station ids: grill, fryer, oven, prep, drinks, freezer, stove
export const DISHES = [
  { id: 'burger', n: 'Cheeseburger', e: '🍔', st: 'grill', t: 6, price: 9 },
  { id: 'fries', n: 'Curly Fries', e: '🍟', st: 'fryer', t: 4.5, price: 4 },
  { id: 'soda', n: 'Fizzy Soda', e: '🥤', st: 'drinks', t: 2.5, price: 3 },
  { id: 'pizza', n: 'Pepperoni Pizza', e: '🍕', st: 'oven', t: 8, price: 12 },
  { id: 'salad', n: 'Rainbow Salad', e: '🥗', st: 'prep', t: 4, price: 7 },
  { id: 'icecream', n: 'Sundae', e: '🍨', st: 'freezer', t: 3, price: 5 },
  { id: 'hotdog', n: 'Hot Dog', e: '🌭', st: 'grill', t: 5, price: 6 },
  { id: 'nuggets', n: 'Nuggets', e: '🍗', st: 'fryer', t: 5, price: 6 },
  { id: 'taco', n: 'Taco Trio', e: '🌮', st: 'prep', t: 5, price: 8 },
  { id: 'ramen', n: 'Ramen Bowl', e: '🍜', st: 'stove', t: 7, price: 11 },
  { id: 'pancakes', n: 'Pancake Stack', e: '🥞', st: 'stove', t: 6, price: 8 },
  { id: 'cake', n: 'Cheese Cake', e: '🍰', st: 'oven', t: 7, price: 7 },
  { id: 'smoothie', n: 'Berry Smoothie', e: '🍓', st: 'drinks', t: 3.5, price: 5 },
  { id: 'sushi', n: 'Sushi Roll', e: '🍣', st: 'prep', t: 6, price: 13 },
];
export const DISH = Object.fromEntries(DISHES.map((d) => [d.id, d]));
export const STATIONS = {
  grill: { n: 'Grill-o-Matic', col: 0xef4444, price: 0, gag: 'is doing the cha-cha!' },
  fryer: { n: 'Fry-Tron 3000', col: 0xf59e0b, price: 0, gag: 'is launching fries at the ceiling!' },
  drinks: { n: 'Soda Fountain', col: 0x38bdf8, price: 0, gag: 'turned into a pink soda geyser!' },
  oven: { n: 'Pizza Oven Deluxe', col: 0xb45309, price: 220, gag: 'is singing opera instead of baking!' },
  prep: { n: 'Chop-Bot Prep Table', col: 0x22c55e, price: 160, gag: 'is chopping the air like a ninja!' },
  freezer: { n: 'Frosty Freezer', col: 0xa5f3fc, price: 180, gag: 'is making it SNOW indoors!' },
  stove: { n: 'Turbo Stove', col: 0x6366f1, price: 260, gag: 'is blowing giant bubbles!' },
};
const cache = new Map();
function plate(x, k = 1) { x.p('g', rcyl(0.2 * k, 0.03, 0.012), 0xffffff, 0, 0, 0); x.p('g', torus(0.18, 28), 0xe0f2fe, 0, 0.03, 0, PI / 2, 0, 0, 0.19 * k, 0.19 * k, 0.1); }
const MODELS = {
  burger(x) { plate(x); x.p('g', P.sphere, 0xd98a3a, 0, 0.07, 0, 0, 0, 0, 0.14, 0.05, 0.14); x.p('g', rcyl(0.15, 0.035, 0.015), 0x6b3a1e, 0, 0.1, 0); x.p('g', P.rbox, 0xffd23f, 0, 0.145, 0, 0, 0.6, 0, 0.27, 0.012, 0.27);
    x.p('s', rcyl(0.16, 0.012, 0.005), 0x5bd65b, 0, 0.152, 0); x.p('g', rcyl(0.11, 0.015, 0.006), 0xef4444, 0, 0.165, 0); x.p('g', P.sphere, 0xe39a48, 0, 0.19, 0, 0, 0, 0, 0.15, 0.08, 0.15);
    for (let i = 0; i < 6; i++) x.p('g', P.sphere, 0xfff3d1, Math.cos(i) * 0.07, 0.25, Math.sin(i * 2) * 0.07, 0, i, 0, 0.012, 0.006, 0.02); },
  hotdog(x) { plate(x); x.p('g', P.capsule, 0xe8a45a, 0, 0.07, 0, 0, 0, PI / 2, 0.11, 0.26, 0.08); x.p('g', P.capsule, 0xc2412d, 0, 0.1, 0, 0, 0, PI / 2, 0.065, 0.34, 0.065);
    x.p('g', P.capsule, 0xffd23f, 0, 0.13, 0, 0, 0, PI / 2, 0.018, 0.26, 0.018); },
  fries(x) { x.p('g', lathe([[0, 0], [0.09, 0], [0.12, 0.16], [0.115, 0.16], [0, 0.01]], 24), 0xef4444, 0, 0, 0, 0, 0, 0, 1, 1, 0.7);
    for (let i = 0; i < 12; i++) x.p('g', P.rboxS, 0xffc94a, Math.cos(i * 2.4) * 0.06, 0.18, Math.sin(i * 2.4) * 0.035, Math.sin(i) * 0.2, i, Math.cos(i) * 0.25, 0.025, 0.14 + (i % 3) * 0.03, 0.025); },
  nuggets(x) { plate(x); for (let i = 0; i < 5; i++) x.p('g', blobGeo(i + 3, 0.15, 1), 0xd4892f, Math.cos(i * 1.3) * 0.09, 0.06, Math.sin(i * 1.3) * 0.08, 0, 0, 0, 0.055, 0.04, 0.05); x.p('g', rcyl(0.04, 0.03, 0.01), 0xb91c1c, 0, 0.03, 0); },
  soda(x) { x.p('g', lathe([[0, 0], [0.065, 0], [0.085, 0.26], [0, 0.26]], 24), 0x38bdf8, 0, 0, 0); x.p('g', rcyl(0.088, 0.025, 0.01), 0xffffff, 0, 0.26, 0); x.p('g', P.cyl, 0xff4fa0, 0.02, 0.36, 0, 0, 0, 0.15, 0.01, 0.16, 0.01);
    x.p('g', P.rbox, 0xffffff, 0, 0.13, 0.075, 0, 0, 0, 0.06, 0.06, 0.01); },
  smoothie(x) { x.p('e', lathe([[0, 0], [0.06, 0], [0.08, 0.22], [0, 0.22]], 24), 0xffffff, 0, 0, 0); x.p('g', lathe([[0, 0.005], [0.058, 0.005], [0.075, 0.2], [0, 0.2]], 24), 0xd9467a, 0, 0, 0); x.p('g', P.sphere, 0xfffbeb, 0, 0.22, 0, 0, 0, 0, 0.07, 0.03, 0.07);
    x.p('g', P.sphere, 0xef4444, 0.03, 0.26, 0, 0, 0, 0, 0.025); x.p('g', P.cyl, 0x22c55e, -0.02, 0.3, 0, 0, 0, 0.2, 0.01, 0.16, 0.01); },
  pizza(x) { x.p('x', rcyl(0.26, 0.012, 0.005), 0xc0c0c0, 0, 0, 0); x.p('g', rcyl(0.24, 0.04, 0.02), 0xe0a050, 0, 0.012, 0); x.p('g', rcyl(0.21, 0.012, 0.006), 0xd23b2a, 0, 0.045, 0); x.p('g', rcyl(0.2, 0.012, 0.006), 0xffd86b, 0, 0.05, 0);
    for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2, r = i ? 0.12 : 0; x.p('g', rcyl(0.035, 0.012, 0.005), 0xb91c1c, Math.cos(a) * r, 0.06, Math.sin(a) * r); }
    for (let i = 0; i < 5; i++) x.p('s', P.sphere, 0x16a34a, Math.cos(i * 2.1) * 0.08, 0.065, Math.sin(i * 2.1) * 0.08, 0, i, 0, 0.02, 0.006, 0.012); },
  salad(x) { x.p('g', lathe([[0, 0], [0.08, 0], [0.16, 0.06], [0.17, 0.08], [0.0, 0.03]], 28), 0xffffff, 0, 0, 0);
    for (let i = 0; i < 9; i++) x.p('s', P.sphere, i % 2 ? 0x22c55e : 0x86efac, Math.cos(i * 2.3) * 0.08, 0.08, Math.sin(i * 2.3) * 0.08, i, i, 0, 0.06, 0.025, 0.045);
    x.p('g', P.sphere, 0xef4444, 0.04, 0.11, 0.02, 0, 0, 0, 0.025); x.p('g', P.sphere, 0xef4444, -0.05, 0.1, -0.03, 0, 0, 0, 0.022); x.p('g', P.rboxS, 0xfb923c, 0, 0.11, -0.06, 0, 0.4, 0, 0.06, 0.012, 0.015); x.p('g', P.sphere, 0xfacc15, -0.02, 0.1, 0.06, 0, 0, 0, 0.02); },
  icecream(x) { x.p('e', lathe([[0, 0], [0.04, 0], [0.025, 0.08], [0.11, 0.16], [0, 0.12]], 24), 0xffffff, 0, 0, 0); x.p('g', P.sphere, 0xfde2e4, 0, 0.17, 0, 0, 0, 0, 0.08, 0.06, 0.08); x.p('g', P.sphere, 0x7c4a2d, 0.03, 0.22, 0, 0, 0, 0, 0.065, 0.05, 0.065);
    x.p('g', P.sphere, 0xfffbeb, -0.03, 0.25, 0.01, 0, 0, 0, 0.06, 0.045, 0.06); x.p('g', P.sphere, 0xdc2626, 0, 0.31, 0, 0, 0, 0, 0.025); for (let i = 0; i < 6; i++) x.p('g', P.capsule, [0xf472b6, 0x60a5fa, 0xfacc15][i % 3], Math.cos(i) * 0.05, 0.27, Math.sin(i * 1.7) * 0.05, i, i, 0, 0.01, 0.02, 0.01); },
  taco(x) { plate(x); for (let i = -1; i <= 1; i++) { x.p('g', torus(0.35, 20, PI), 0xf2b84b, i * 0.1, 0.08, 0, 0, PI / 2, 0, 0.06, 0.06, 0.12); x.p('s', P.sphere, 0x4ade80, i * 0.1, 0.1, 0, 0, 0, 0, 0.035, 0.03, 0.09); x.p('g', P.sphere, 0x8b4513, i * 0.1, 0.09, 0, 0, 0, 0, 0.03, 0.02, 0.08); x.p('g', P.sphere, 0xfacc15, i * 0.1, 0.12, 0.02, 0, 0, 0, 0.02, 0.012, 0.05); } },
  ramen(x) { x.p('g', lathe([[0, 0], [0.07, 0], [0.16, 0.08], [0.17, 0.12], [0.16, 0.12], [0.0, 0.03]], 28), 0xf8fafc, 0, 0, 0); x.p('g', torus(0.1, 28), 0xdc2626, 0, 0.08, 0, PI / 2, 0, 0, 0.16, 0.16, 0.3);
    x.p('g', rcyl(0.15, 0.01, 0.004), 0xe9b36b, 0, 0.1, 0); x.p('g', P.sphere, 0xffffff, 0.06, 0.11, 0, 0, 0, 0, 0.04, 0.02, 0.035); x.p('g', P.sphere, 0xfbbf24, 0.06, 0.12, 0, 0, 0, 0, 0.02, 0.012, 0.02);
    x.p('g', P.rbox, 0x1f2937, -0.05, 0.12, -0.04, 0.2, 0, 0, 0.06, 0.08, 0.008); x.p('g', rcyl(0.025, 0.012, 0.004), 0xfda4af, -0.03, 0.11, 0.06); for (let i = 0; i < 2; i++) x.p('m', P.cyl, 0xd4a373, 0.1 + i * 0.03, 0.16, -0.06, 0.6, 0, 0.3, 0.008, 0.3, 0.008); },
  pancakes(x) { plate(x); for (let i = 0; i < 4; i++) x.p('g', rcyl(0.12, 0.035, 0.016), 0xd99a4a, 0, 0.03 + i * 0.035, 0); x.p('g', rcyl(0.1, 0.02, 0.01), 0x9a4a1a, 0, 0.17, 0); x.p('g', P.rbox, 0xfff3b0, 0, 0.2, 0, 0, 0.3, 0, 0.05, 0.025, 0.05); },
  cake(x) { plate(x); x.p('g', P.rbox, 0xfff1c9, 0, 0.08, 0, 0, 0.5, 0, 0.18, 0.11, 0.14); x.p('g', P.rbox, 0xb45309, 0, 0.03, 0, 0, 0.5, 0, 0.185, 0.03, 0.145); x.p('g', P.rbox, 0xdc2626, 0, 0.14, 0, 0, 0.5, 0, 0.17, 0.025, 0.13); x.p('g', P.sphere, 0xe11d48, 0, 0.17, 0, 0, 0, 0, 0.03); },
  sushi(x) { x.p('m', P.rbox, 0x8b5a2b, 0, 0.02, 0, 0, 0, 0, 0.36, 0.035, 0.16); for (let i = -1; i <= 1; i++) { x.p('g', rcyl(0.045, 0.05, 0.01), 0x111827, i * 0.1, 0.04, 0); x.p('g', rcyl(0.038, 0.052, 0.01), 0xffffff, i * 0.1, 0.04, 0); x.p('g', rcyl(0.018, 0.054, 0.006), 0xfb7185, i * 0.1, 0.04, 0); } x.p('s', P.sphere, 0x86efac, 0.15, 0.05, 0.04, 0, 0, 0, 0.025, 0.02, 0.025); },
  burnt(x) { plate(x); x.p('g', blobGeo(7, 0.25, 1), 0x1c1917, 0, 0.07, 0, 0, 0, 0, 0.12, 0.06, 0.11); },
  hotbag(x) { x.p('g', P.rbox, 0xea580c, 0, 0.22, 0, 0, 0, 0, 0.42, 0.38, 0.34); x.p('l', P.rboxS, 0xfef08a, 0, 0.24, 0.18, 0, 0, 0, 0.32, 0.12, 0.03, 0.6); x.p('x', P.rboxS, 0x111827, 0, 0.43, 0, 0, 0, 0, 0.24, 0.05, 0.08); },
  bag(x) { x.p('m', P.rbox, 0xc8a26b, 0, 0.16, 0, 0, 0, 0, 0.26, 0.32, 0.16); x.p('m', torus(0.12, 16, PI), 0xb8925b, 0, 0.32, 0, 0, 0, 0, 0.06, 0.08, 0.06); x.p('g', P.rbox, 0xff4fa0, 0, 0.18, 0.082, 0, 0, 0, 0.12, 0.12, 0.005); },
  dirty(x) { plate(x); x.p('g', blobGeo(3, 0.3, 1), 0x9a6a3a, 0.05, 0.035, 0.02, 0, 0, 0, 0.06, 0.015, 0.05); x.p('x', P.cyl, 0xc0c0c0, -0.06, 0.04, 0, 0, 0.4, PI / 2, 0.01, 0.2, 0.01); },
  mop(x) { x.p('m', P.cyl, 0xa16207, 0, 0.3, 0, 0, 0, 0, 0.02, 1.0, 0.02); x.p('f', P.sphere, 0x93c5fd, 0, -0.2, 0, 0, 0, 0, 0.12, 0.08, 0.12); },
};
export function dishModel(id, scale = 1) {
  let g = cache.get(id);
  if (!g) { const b = MB(); const x = new XB(b); (MODELS[id] || MODELS.burger)(x); g = toGroup(b, true); g.traverse((o) => { o.userData.shared = 1; }); cache.set(id, g); }
  const c = g.clone(); c.scale.setScalar(scale); return c;
}
