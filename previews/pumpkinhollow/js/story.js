// Pumpkin Hollow townsfolk, what they say, side tasks and the mystery "Who swiped the Moon Lantern?". Pure data + helpers.
import { S, persist } from './save.js?v=ph2';
const PI = Math.PI;
export const HATS = [
  { id: 'none', n: 'No Hat', how: 'Always yours' }, { id: 'pupears', n: 'Schnauzer Ears', how: "Find Candy's 3 squeaky cactus toys" }, { id: 'flower', n: 'Desert Marigold', how: "Plant Mama Rosa's 4 marigolds" },
  { id: 'racer', n: 'Turbo Shell Helmet', how: 'Win the Broomstick Derby' }, { id: 'chef', n: 'Lettuce Chef Hat', how: 'Harvest 8 lettuces in Pumpkin Rush' }, { id: 'propeller', n: "Snowie's Propeller Cap", how: 'Polish a shell for Snowie (70%+)' },
  { id: 'goggles', n: "Luna's Sun Goggles", how: 'Help Luna at the Observatory' }, { id: 'sunhat', n: 'Big Sun Hat', how: 'Catch 20+ in Prickly Pear Catch' }, { id: 'party', n: 'Fiesta Hat', how: 'Find 20 Candy Corns' },
  { id: 'detective', n: 'Detective Hat', how: 'Solve the Moon Lantern mystery' }, { id: 'wizard', n: 'Wizard Hat', how: 'Find 5 secrets' }, { id: 'shellcrown', n: 'Ancient Shell Crown', how: '???' }, { id: 'hardhat', n: 'Tortuga Tech Hard Hat', how: 'Become a Tortuga Tech intern' }, { id: 'crown', n: 'Gold Crown', how: 'Every Candy Corn + the mystery' },
];
export const BADGES = { sun: '☀️ Moon Lantern Detective', toys: "🧸 Candy's Best Friend", garden: '🌼 Green Thumb', race: '🏁 Derby Champ', farm: '🥬 Lettuce Legend', polish: '✨ Shell Shiner', catch: '🍐 Pear Catcher', bubbles: '🫧 Bubble Popper',
  express: '🐦 Express Rider', secrets: '🗝️ Secret Seeker', shells: '🐚 Candy Corn Collector', friends: '🐀 Visitor Welcome Crew', family: "🐢 Torty's Family Friend", ancient: '🌙 Keeper of the Moonstone', tough: '🛡️ Make-It-Tougher Pro', grotto: '🍄 Grotto Explorer', intern: '🏢 Tortuga Tech Intern' };
// look: { t: tortoise opts + s: scale } | { bird } | { liz } | { rat } | { dog }
const N = (id, n, look, at, region, o = {}) => Object.assign({ id, n, look, at, region }, o);
const ring = (cx, cz, r, n = 10, rz = r, a0 = 0) => Array.from({ length: n }, (_, i) => { const a = a0 + i / n * PI * 2; return [cx + Math.cos(a) * r, cz + Math.sin(a) * rz]; });
export const NPCS = [
  // ---- Torty's family (the Burrow)
  N('torty', 'Torty (Martina) · CEO', { t: { shell: 'torty', flower: true }, s: 0.27 }, [88.0, -61.9, 0.25], 'tortuga'),
  N('mama', 'Mama Rosa', { t: { shell: 'rose', flower: 0xffd23f, neck: 'apron', neckC: 0xff9fd0 }, s: 0.3 }, [-50.6, -18.5, -PI / 2], 'burrow', { mode: 'work' }),
  N('papa', 'Papa Basil', { t: { shell: 'olive', glasses: true, neck: 'bowtie', neckC: 0x16a34a, hat: 'cap', hatC: 0x16a34a }, s: 0.31 }, [-53.5, -12.8, PI], 'burrow'),
  N('gramps', 'Gramps Thaddeus', { t: { shell: 'grey', glasses: 0xd4a017, brow: 0xffffff, cane: true, hat: 'straw', skin: 0xb3a48a }, s: 0.29 }, [-52.2, -24.9, PI * 0.8], 'burrow', { mode: 'sleep' }),
  N('pebble', 'Pebble (Torty\'s little brother)', { t: { shell: 'moss', hat: 'night', hatC: 0x60a5fa }, s: 0.14 }, [-1.6, -118.6, 0.4], 'out', { y: 2.4 }),
  // ---- visiting friends
  N('candy', 'Candy (Mini Schnauzer)', { dog: 'schnauzer', s: 1.05 }, [7.2, 11.2, PI * 0.85], 'out'),
  N('luna', 'Luna (Ratita Industries CEO)', { rat: 'luna', hat: 'crown' }, [24.6, -104.2, -0.5], 'obs'),
  N('pirat', 'Pi-rat (Chief Inventor)', { rat: 'pirat', hat: 'pirate', extras: ['patch'] }, [49, 112.2, PI], 'out'),
  N('snowie', 'Snowie (Head of Fun)', { rat: 'snowie', hat: 'flower', extras: ['bow'] }, [64.4, -14.6, -0.4], 'market'),
  // ---- Town Hall, Square & Market
  N('mayor', 'Mayor Shelldon', { t: { shell: 'gold', hat: 'top', neck: 'sash', neckC: 0x0f766e, glasses: true }, s: 0.33 }, [-2.6, -56.6, 0.3], 'hall'),
  N('rocky', 'Rocky the Roadrunner', { bird: { bag: true, cap: true }, s: 0.6 }, [0, 34.9, 0], 'out', { walk: ring(0, 0, 34.9, 24), v: 5.5 }),
  N('sam', 'Shuttle Sam', { t: { shell: 'sand', hat: 'cap', hatC: 0xffb020, neck: 'scarf', neckC: 0xffb020 }, s: 0.3 }, [34.9, 0, 0], 'out', { walk: ring(0, 0, 34.9, 32, 34.9, 0).reverse(), v: 1.1, cart: true }),
  N('tilly', 'Granny Tilly', { t: { shell: 'plum', hat: 'straw', bandC: 0xa66bff, glasses: true, flower: 0xffffff }, s: 0.27 }, [-16, 14, 0], 'out', { walk: [[-16, 14], [-8, 18], [8, 17], [15, 9], [15, -8], [-14, -12]], v: 0.55 }),
  N('bert', 'Bert the Box Turtle', { t: { shell: 'coral', flat: 0.6, hat: 'beret', hatC: 0x2563eb }, s: 0.26 }, [-19.5, -2, PI / 2], 'out'),
  N('lizzy', 'Lizzy the Lizard', { liz: { col: 0x22c55e, spots: 0xfacc15, glasses: true }, s: 1.0 }, [-6.8, -6.4, 0.6], 'out', { y: 2.05 }),
  N('pip', 'Pip', { t: { shell: 'sky', hat: 'cap', hatC: 0xef4444 }, s: 0.16 }, [22, 13], 'out', { run: [22, 13.2, 3.2], phase: 0 }),
  N('squeak', 'Squeak', { t: { shell: 'rose', bow: 0xff5d8f }, s: 0.15 }, [22, 13], 'out', { run: [22, 13.2, 3.2], phase: PI }),
  N('zip', 'Zip (Ghost Train)', { bird: { cap: true }, s: 0.6 }, [8.8, 29.2, -PI * 0.75], 'out'),
  N('picA', 'Daisy (picnicking)', { t: { shell: 'rose', hat: 'straw', bandC: 0xff5d8f, flower: 0xffffff }, s: 0.27 }, [-8.9, 14.6, 2.4], 'out', { mode: 'chat' }),
  N('picB', 'Doug (picnicking)', { t: { shell: 'olive', hat: 'cap', hatC: 0xffb020 }, s: 0.28 }, [-6.4, 12.4, -0.9], 'out', { mode: 'chat' }),
  N('picC', 'Tamsin (sipping lemonade)', { t: { shell: 'sky', glasses: 0xff5d8f, flower: 0xffd23f }, s: 0.27 }, [6.4, -14.6, -0.6], 'out', { mode: 'chat' }),
  N('picD', 'Rocco the Gecko', { liz: { col: 0xa66bff, spots: 0xffd23f, glasses: true }, s: 1.0 }, [9.0, -12.3, 2.6], 'out', { y: 0.5 }),
  N('fisher', 'Old Murphy (fishing)', { t: { shell: 'grey', hat: 'straw', bandC: 0x2563eb, beard: true }, s: 0.28 }, [-1.0, 5.2, PI], 'out', { y: 0.16 }),
  N('lemon', 'Lulu (Cactus Lemonade)', { t: { shell: 'gold', hat: 'visor', hatC: 0xff5d8f, neck: 'apron', neckC: 0xffd23f }, s: 0.28 }, [11.0, -14.3, 0.9], 'out'),
  N('painter', 'Picasso the Chuckwalla', { liz: { col: 0xd97706, spots: 0x7c2d12, hat: 'beret' }, s: 1.1 }, [-12.6, -10.4, PI], 'out'),
  N('stroll1', 'Mo & Flo (strolling)', { t: { shell: 'plum', bow: 0xffd23f }, s: 0.27 }, [11, 0], 'out', { walk: [[11.5, 0], [8, 9], [0, 11.3], [-8, 9], [-11.5, 0], [-8, -9], [0, -11.3], [8, -9]], v: 0.5 }),
  N('stroll2', 'Flo (strolling)', { t: { shell: 'coral', hat: 'straw', bandC: 0xa66bff }, s: 0.26 }, [0, -11.3], 'out', { walk: [[0, -11.3], [8, -9], [11.5, 0], [8, 9], [0, 11.3], [-8, 9], [-11.5, 0], [-8, -9]], v: 0.5 }),
  N('pablo', 'Pablo (Fruit Stall)', { t: { shell: 'sand', hat: 'sombrero', hatC: 0xf2cf7a, bandC: 0xff5d8f }, s: 0.3 }, [46, -6.2, 0], 'out'),
  N('nana', 'Nana Petunia (Flowers)', { t: { shell: 'rose', hat: 'flowercrown' }, s: 0.27 }, [68, 6.2, PI], 'out'),
  N('marge', 'Marge (out shopping)', { t: { shell: 'olive', hat: 'straw', bandC: 0x14b8a6, pack: 0x14b8a6 }, s: 0.28 }, [40, 3, PI / 2], 'out', { walk: [[40, 3], [110, 3], [110, -3], [40, -3]], v: 0.7 }),
  N('gus', 'Gus the Gila', { liz: { col: 0xf97316, spots: 0x1f2937, hat: 'cowboy' }, s: 1.1 }, [86, 32, -0.5], 'out'),
  N('petra', 'Petra (Market Keeper)', { t: { shell: 'coral', neck: 'apron', neckC: 0xe11d48, hat: 'bandana', hatC: 0xe11d48 }, s: 0.3 }, [51.6, -13.6, PI / 2], 'market'),
  N('shopper', 'Ollie (shopping)', { t: { shell: 'sky', pack: 0xffd23f }, s: 0.27 }, [57, -16], 'market', { walk: [[56, -16.5], [68, -16.5], [68, -20.6], [56, -20.6]], v: 0.5 }),
  N('coral', 'Coral (Shell Shop)', { t: { shell: 'sky', flat: 0.65, glasses: 0x0ea5e9, neck: 'apron', neckC: 0x38bdf8 }, s: 0.28 }, [86.2, -18.2, 0.4], 'shellshop'),
  N('glimmer', 'Glimmer the Gecko', { liz: { col: 0x38bdf8, spots: 0xffffff, frill: 0xff5d8f, hat: 'beret' }, s: 1.0 }, [90.6, -19, -PI / 2], 'shellshop'),
  N('clay', 'Clay (Potter)', { t: { shell: 'coral', neck: 'apron', neckC: 0x7c2d12, hat: 'bandana', hatC: 0xc8693c }, s: 0.29 }, [102.5, -13.1, PI], 'pottery', { mode: 'work' }),
  N('taffy', 'Mrs. Taffy (Sweets)', { t: { shell: 'rose', hat: 'chef', neck: 'apron', neckC: 0xdb2777 }, s: 0.29 }, [57, 21, PI], 'sweets'),
  N('drdune', 'Dr. Dune (Curator)', { t: { shell: 'sand', glasses: true, hat: 'straw', bandC: 0x7c2d12, beard: true }, s: 0.3 }, [86.5, 16, -PI / 2], 'fossil'),
  N('kid1', 'Tiny Tess', { t: { shell: 'gold', bow: 0xa66bff }, s: 0.15 }, [77.5, 23.8, 0.4], 'fossil'),
  N('penny', 'Postmaster Penny', { t: { shell: 'sky', hat: 'cap', hatC: 0x2563eb, glasses: true, neck: 'bowtie', neckC: 0x2563eb }, s: 0.29 }, [-38, 47, PI], 'post'),
  N('nap', 'Mr. Napsworth (Innkeeper)', { t: { shell: 'plum', hat: 'night', hatC: 0xa66bff, sleepy: true }, s: 0.3 }, [33, 45.4, PI], 'inn'),
  N('leafy', 'Chef Leafy', { t: { shell: 'moss', hat: 'chef', neck: 'apron', neckC: 0x16a34a }, s: 0.3 }, [36.4, -55.2, 0], 'cafe', { mode: 'work' }),
  N('diner1', 'Mabel (having lunch)', { t: { shell: 'rose', hat: 'straw', bandC: 0xff5d8f }, s: 0.27 }, [31, -45.6, PI], 'cafe', { mode: 'chat' }),
  N('diner2', 'Hector (having lunch)', { t: { shell: 'olive', glasses: true }, s: 0.28 }, [39, -45.6, PI], 'cafe', { mode: 'chat' }),
  N('paige', 'Paige (Librarian)', { t: { shell: 'plum', glasses: 0xa66bff, neck: 'scarf', neckC: 0x3b82f6 }, s: 0.28 }, [-31.4, -53.4, -PI / 2], 'library'),
  N('reader', 'Rupert (reading)', { t: { shell: 'grey', glasses: true, hat: 'beret', hatC: 0x1e3a8a }, s: 0.28 }, [-42, -43.6, PI], 'library', { mode: 'work' }),
  N('clerk', 'Clerk Clementine', { t: { shell: 'sand', glasses: true, neck: 'bowtie', neckC: 0x0f766e }, s: 0.27 }, [5.6, -47, -0.6], 'hall'),
  // ---- Abandoned Village + Monster Mash Plaza
  N('baker', 'Baker Biscotti', { t: { shell: 'gold', hat: 'chef', neck: 'apron', neckC: 0xe2733f }, s: 0.3 }, [-109.5, -70.2, 0], 'bakery', { mode: 'work' }),
  N('bakfan', 'Crumbs (eating a concha)', { t: { shell: 'rose', bow: 0xffd23f }, s: 0.27 }, [-106.8, -64.2, -PI / 2], 'bakery', { mode: 'chat' }),
  N('drummer', 'Rhythm Ray (drummer)', { t: { shell: 'plum', glasses: 0x111827, hat: 'bandana', hatC: 0x7c3aed }, s: 0.3 }, [-84.4, -61.6, 0], 'music', { y: 0.72, mode: 'cheer' }),
  N('singer', 'Melody (singer)', { t: { shell: 'sky', flower: 0xff5d8f, neck: 'scarf', neckC: 0xffd23f }, s: 0.28 }, [-81.6, -61.2, 0], 'music', { y: 0.72 }),
  N('mfan', 'Concert Fan', { t: { shell: 'olive', hat: 'cap', hatC: 0xff5d8f }, s: 0.27 }, [-82.6, -67.4, PI], 'music', { mode: 'cheer' }),
  N('toymaker', 'Grandma Shelly (toymaker)', { t: { shell: 'grey', glasses: 0xd4a017, neck: 'apron', neckC: 0x2563eb, flower: 0xffd23f }, s: 0.29 }, [-100, -104.2, PI], 'toys'),
  N('toykid', 'Little Tumble', { t: { shell: 'moss', hat: 'cap', hatC: 0xef4444 }, s: 0.14 }, [-104.6, -109.4, 0.6], 'toys', { mode: 'cheer' }),
  N('usher', 'Usher Reel', { t: { shell: 'coral', hat: 'cap', hatC: 0xb91c1c, neck: 'bowtie', neckC: 0xffd23f }, s: 0.29 }, [54.4, 46.6, PI], 'cinema'),
  N('moviefan', 'Popcorn Pete (watching)', { t: { shell: 'olive', glasses: true }, s: 0.27 }, [53.6, 53.3, 0], 'cinema', { y: 0.44 }),
  N('scoop', 'Scoop (ice cream)', { t: { shell: 'rose', hat: 'visor', hatC: 0x2dd4bf, neck: 'apron', neckC: 0xff5d8f }, s: 0.29 }, [73.5, 54.8, PI], 'icecream', { mode: 'work' }),
  N('icekid', 'Sprinkles', { t: { shell: 'sky', bow: 0xff5d8f }, s: 0.15 }, [71.1, 48.4, 0], 'icecream'),
  N('taco', 'Taco Tina (food truck)', { t: { shell: 'gold', hat: 'straw', bandC: 0xff5d8f, neck: 'apron', neckC: 0x2dd4bf }, s: 0.29 }, [51.4, 37.8, PI / 2], 'out'),
  N('fiestafan', 'Lola (fiesta-goer)', { t: { shell: 'coral', flower: 0xffd23f }, s: 0.27 }, [70, 37.6, 0], 'out', { mode: 'chat' }),
  N('quarterfan', 'Old Adobe Al', { t: { shell: 'grey', hat: 'straw', beard: true }, s: 0.28 }, [-88.6, -82, -PI / 2], 'out'),
  // ---- Tortuga Tech Spooky Lab (Torty's company)
  N('shelly', 'Shelly (Tortuga Tech Reception)', { t: { shell: 'sky', glasses: 0x0f9d8a, neck: 'scarf', neckC: 0x0f9d8a, flower: 0xffd23f }, s: 0.28 }, [85.7, -46.2, -PI / 2], 'tortuga'),
  N('bolt', 'Engineer Bolt (Drop Tower)', { t: { shell: 'olive', hat: 'helmet', hatC: 0xfacc15, glasses: true, neck: 'bowtie', neckC: 0xef4444 }, s: 0.3 }, [62.6, -51.2, PI / 2], 'tortuga', { mode: 'work' }),
  N('blaze', 'Engineer Blaze (Heat + Sand)', { t: { shell: 'coral', hat: 'visor', hatC: 0xff8a3d, glasses: 0xff8a3d }, s: 0.29 }, [89.4, -47.2, -PI / 2], 'tortuga'),
  N('ironshell', 'Engineer Ironshell (Crush Press)', { t: { shell: 'grey', hat: 'helmet', hatC: 0x7c3aed, brow: 0xffffff }, s: 0.31 }, [69.4, -63.6, -PI / 2], 'tortuga', { mode: 'work' }),
  N('plato', 'Plato (Shell-Armor Smith)', { t: { shell: 'gold', hat: 'bandana', hatC: 0x0f9d8a, neck: 'apron', neckC: 0x0f9d8a, glasses: true }, s: 0.3 }, [76.8, -62.4, PI], 'tortuga', { mode: 'work' }),
  N('gauge', 'Gauge (Test Yard Boss)', { t: { shell: 'sand', hat: 'helmet', hatC: 0x0f9d8a, neck: 'medal', neckC: 0x0f9d8a }, s: 0.3 }, [112, -56, -PI / 2], 'out'),
  N('intern', 'Nibbles (Junior Intern)', { t: { shell: 'moss', hat: 'helmet', hatC: 0xffd23f }, s: 0.15 }, [75.8, -47.6, PI / 2], 'tortuga'),
  N('ttfan1', 'Test Fan', { t: { shell: 'rose', hat: 'cap', hatC: 0x0f9d8a }, s: 0.27 }, [114.4, -41.2, PI], 'out', { y: 0.47, mode: 'cheer' }),
  N('ttfan2', 'Test Fan', { t: { shell: 'plum', bow: 0x5eead4 }, s: 0.26 }, [117.6, -42.1, PI], 'out', { y: 0.89, mode: 'cheer' }),
  N('ttfan3', 'Test Fan', { t: { shell: 'sky', hat: 'straw', bandC: 0xff5d8f }, s: 0.27 }, [113.2, -43.0, PI], 'out', { y: 1.31, mode: 'cheer' }),
  N('ttfan4', 'Rocky the Lizard (test fan)', { liz: { col: 0x22c55e, spots: 0xffd23f }, s: 1.0 }, [116.6, -41.2, PI], 'out', { y: 0.47 }),
  N('tester1', 'Engineer Dot (Big Drop)', { t: { shell: 'coral', hat: 'helmet', hatC: 0xef4444, glasses: true }, s: 0.29 }, [111.4, -61.2, -PI * 0.75], 'out', { mode: 'work' }),
  N('tester2', 'Engineer Pip (Squish Test)', { t: { shell: 'plum', hat: 'helmet', hatC: 0x7c3aed, neck: 'bowtie', neckC: 0xffd23f }, s: 0.29 }, [110.9, -49.2, -PI * 0.7], 'out', { mode: 'work' }),
  // ---- the Burrows, school, farm, hill, racetrack, dunes
  N('shelby', 'Shelby (Turtle Artist)', { t: { shell: 'moss', flat: 0.62, hat: 'beret', hatC: 0x22c55e }, s: 0.27 }, [-86, -21.4, PI], 'shelby'),
  N('slate', 'Ms. Slate (Teacher)', { t: { shell: 'olive', glasses: true, flower: 0xffd23f }, s: 0.3 }, [-56.2, 23.6, PI], 'school'),
  N('stu1', 'Sunny (student)', { t: { shell: 'gold', hat: 'cap', hatC: 0x22c55e }, s: 0.15 }, [-62, 17.3, PI], 'school'),
  N('stu2', 'Dot (student)', { t: { shell: 'rose', bow: 0x38bdf8 }, s: 0.15 }, [-58, 20.5, PI], 'school'),
  N('neighbor', 'Mr. Pokey (neighbor)', { t: { shell: 'sand', hat: 'straw', cane: true }, s: 0.29 }, [-80, -4], 'out', { walk: [[-80, -4], [-104, -4], [-104, 4], [-80, 4]], v: 0.45 }),
  N('fern', 'Farmer Fern', { t: { shell: 'olive', hat: 'straw', bandC: 0x16a34a, neck: 'scarf', neckC: 0xef4444 }, s: 0.3 }, [-77, 42.2, PI], 'out'),
  N('hank', 'Hank (Barn)', { t: { shell: 'coral', hat: 'cap', hatC: 0x7f1d1d }, s: 0.3 }, [-92.6, 49.5, PI / 2], 'barn', { mode: 'work' }),
  N('dozy', 'Dozy the Lizard', { liz: { col: 0xa3e635, spots: 0x65a30d }, s: 0.9 }, [-101.6, 56.9, 0.3], 'barn', { y: 1.2, mode: 'sleep' }),
  N('sprout', 'Sprout (Greenhouse)', { t: { shell: 'moss', hat: 'flowercrown' }, s: 0.27 }, [-70.6, 74, PI / 2], 'green'),
  N('mira', 'Mira (Spa)', { t: { shell: 'sky', neck: 'scarf', neckC: 0x14b8a6, flower: 0xffffff }, s: 0.29 }, [-18.4, -99.6, -0.5], 'spa'),
  N('soaker', 'Grandpa Gil (soaking)', { t: { shell: 'grey', brow: 0xffffff, sleepy: true }, s: 0.29 }, [-23.6, -104.2, 0.3], 'spa', { mode: 'soak', y: 0.5 }),
  N('ollie', 'Ollie Sr. (soaking)', { t: { shell: 'olive', hat: 'bandana', hatC: 0xffffff }, s: 0.28 }, [5, -108.4, -0.4], 'out', { mode: 'soak', y: 1.6 }),
  N('zoom', 'Zoom (Derby Champion)', { t: { shell: 'coral', hat: 'helmet', hatC: 0xef4444, neck: 'medal', neckC: 0x2563eb }, s: 0.29 }, [-20, 85.8, PI / 2], 'club'),
  N('coach', 'Coach Tortuga', { t: { shell: 'olive', hat: 'visor', hatC: 0xe2733f, neck: 'bell', neckC: 0xe2733f }, s: 0.31 }, [-17, 79.6, -PI / 2], 'club'),
  N('fan1', 'Derby Fan', { t: { shell: 'gold', hat: 'cap', hatC: 0xef4444 }, s: 0.27 }, [32, 70.6, 0], 'out', { y: 0.84, mode: 'cheer' }),
  N('fan2', 'Derby Fan', { t: { shell: 'sky', bow: 0xffd23f }, s: 0.26 }, [40, 69.3, 0], 'out', { y: 1.26, mode: 'cheer' }),
  N('dusty', 'Dusty the Explorer', { liz: { col: 0xd97706, spots: 0x7c2d12, hat: 'cowboy' }, s: 1.0 }, [100, 96, PI / 2], 'out'),
];
export const SUN_CLUES = ['pedestal', 'sniff', 'card', 'order', 'chart'];
export const SUSPECTS = [{ id: 'rocky', n: 'Rocky the Roadrunner', why: 'the fastest critter in town, always zooming around' }, { id: 'glimmer', n: 'Glimmer the Gecko', why: 'LOVES shiny things' }, { id: 'snowie', n: 'Snowie', why: 'was seen holding something small, golden and glowy' }];
export const GLYPH = { syms: ['🎃', '🦇', '👻', '🐢'], answer: [3, 0, 1] };
export function clueText(id) { return { pedestal: 'The Moon Lantern\'s pedestal is empty, but its Tortuga Tech case isn\'t broken: it was gently UNLATCHED. Tiny sandy footprints lead to the door, VERY small ones. Whoever took it is little!', sniff: 'Candy sniffed the pedestal: "Lettuce… and warm, fizzy hot-spring water!"',
  card: 'The library card catalog: someone checked out "Warm Rocks for Chilly Shells" this morning, signed with a wobbly little "P".', order: 'An order slip at the café: "Lettuce picnic for ONE (tiny portion). To go. Deliver to: up the hill." Paid in shiny pebbles.',
  chart: 'The telescope log, 6:12 am: "A small golden glow moving very, VERY slowly up Haunted Hill."' }[id] || ''; }
export function sunStep() { const q = S.q.sun | 0; if (q === 0) return 'Talk to Mayor Shelldon at Town Hall'; if (q === 1) { const n = SUN_CLUES.filter((c) => S.clues[c]).length; return `Who swiped the Moon Lantern? Clues ${n}/5`; } if (q === 2) return 'Clues point up Haunted Hill! Climb to the top spring'; if (q === 3) return 'Bring the Moon Lantern back to Mayor Shelldon'; return 'Mystery solved! Enjoy the Sunset Festival'; }
export function hint() { const miss = SUN_CLUES.filter((c) => !S.clues[c]); const h = { pedestal: 'Inspect the empty pedestal in Town Hall.', sniff: 'Candy has a great nose. Ask her to sniff (she\'s by the pond).', card: 'Librarians keep track of everything. Try the card catalog.', order: 'Somebody must have packed a snack. The café?', chart: 'Luna is at the Moon Observatory, looking at everything.' }; return miss.length ? h[miss[0]] : 'Head up Haunted Hill!'; }
export function sideTasks() { return [[!!S.flags.toys, "Find Candy's 3 squeaky cactus toys"], [!!S.flags.garden, "Plant Mama Rosa's 4 marigolds"], [!!S.flags.race, 'Win the Broomstick Derby (Pi-rat)'], [!!S.flags.farm, 'Harvest 8 lettuces in Pumpkin Rush'], [!!S.flags.snowie, 'Polish a shell for Snowie'], [!!S.flags.luna, 'Help Luna at the Observatory'], [!!S.flags.express, 'Ride the Ghost Train'], [Object.keys(S.rats).length >= 4, 'Say hi to all 4 visiting friends'], [!!S.flags.tough, 'Shell-test all 3 Ratita gadgets (Make It Tougher)'], [!!S.badges.intern, 'Become a Tortuga Tech intern']]; }
const L = (...a) => a.map((x) => (Array.isArray(x) ? x : [null, x]));
export function talk(id, G) { const n = (S.talks[id] = (S.talks[id] | 0) + 1); persist(); const cyc = (arr) => arr[(n - 1) % arr.length]; const q = S.q.sun | 0;
  const suspect = (sid, lines) => { S.sus[sid] = Math.max(S.sus[sid] | 0, 1); persist(); return { lines: L(...lines), fx: () => G.toastMsg(S.sus[sid] >= 2 ? '✅ Alibi confirmed!' : '📝 Alibi noted in your journal') }; };
  const confirm = (sid) => { if ((S.sus[sid] | 0) === 1) { S.sus[sid] = 2; persist(); return true; } return false; };
  const friend = (fid) => { if (!S.rats[fid]) { S.rats[fid] = 1; persist(); if (Object.keys(S.rats).length >= 4) setTimeout(() => G.badge('friends'), 900); } };
  const fam = (fid) => { S.flags['f_' + fid] = 1; persist(); if (['torty', 'mama', 'papa', 'gramps'].every((k) => S.flags['f_' + k])) setTimeout(() => G.badge('family'), 900); };
  switch (id) {
    case 'mayor': {
      if (q === 0) return { lines: L('Oh! A visitor! Welcome to Pumpkin Hollow, where we take life… slooowly. I\'m Mayor Shelldon.', 'But today we have a CRISIS. The MOON LANTERN is gone! It makes our sunsets golden, and tonight is the Sunset Festival!', 'Will you be our detective? Look for clues all over town and talk to everyone. Start with the empty pedestal right here.', 'And please hurry. Well… hurry for a tortoise.'), fx: () => { S.q.sun = 1; persist(); G.toastMsg('🔎 New mystery: Who swiped the Moon Lantern?'); G.sfx('check'); G.hud.dirty = true; } };
      if (q === 3) return { lines: L('Is that… THE MOON LANTERN! And little Pebble brought it back himself?', 'He only borrowed it to warm the witch’s cauldron spa for Gramps\' chilly old shell? Oh, that\'s the sweetest thing I ever heard.', 'Let the Sunset Festival BEGIN! Everyone to the square!'), fx: () => G.solveSun() };
      if (q >= 4) return { lines: L(cyc(['Best festival ever. And the sunset has never been so golden!', 'Pebble is our new Junior Moon Lantern Keeper. With a tiny badge!', 'You\'re welcome back in Pumpkin Hollow any time. Slowly.'])) };
      return { lines: L(cyc(['Any clues yet? Check the journal in the pause menu.', 'Tiny footprints… who in town is that tiny?', 'Talk to everyone! Tortoises love to chat. It takes a while.'])) }; }
    case 'torty': fam('torty');
      if (n === 1) return { lines: L('YOU CAME! Welcome to my hometown! Everybody here calls me Torty.', 'And this is MY company: TORTUGA TECH SPOOKY LAB! We test things and make them tougher. We know durability. We have shells! 🐚', 'Drop tower, crush press, heat and sand-blast chamber, shell-armor workshop, and the Test Yard out back. Luna, Pi-rat and Snowie even brought their gadgets to get shell-tested!', 'My family lives in the Burrows: Mama, Papa and Gramps. My little brother Pebble is… hmm, where IS Pebble?') };
      if (S.flags.tough && !S.badges.intern) return { lines: L('You shell-tested ALL THREE Ratita gadgets? Plato told me. That\'s Tortuga-level work!', 'Here: your official Tortuga Tech hard hat. Welcome to the team, intern!'), fx: () => { G.giveHat('hardhat'); G.badge('intern'); } };
      if (q === 1) return { lines: L(cyc(['Our lab built the Moon Lantern\'s case. Drop-proof, crush-proof, heat-proof. Nobody could BREAK it…', '…but it has a tiny latch. Only a few of us know the trick. I showed it to Pebble once. Hmm!'])) };
      if (q >= 4) return { lines: L(cyc(['Pebble borrowed the Moon Lantern to warm Gramps\' bath. That\'s SO him.', 'Next product: a Pebble-proof latch. Kidding! Mostly.', 'Thanks for helping my town. You\'re officially an honorary tortoise!'])) };
      return { lines: L(cyc(['Try MAKE IT TOUGHER in the Shell-Armor Workshop! Bolt shell plates onto the weak spots before the test.', 'Gramps tells the best old legends. Ask him (if he\'s awake).', 'I learned to race on that track out south. I lost every race. Slowly. Happily.', 'Ghost Train stops are all over town, there\'s one right outside Tortuga Tech.'])) };
    case 'mama': fam('mama');
      if (!S.flags.garden && S.plants.length >= 4) return { lines: L('My marigolds! All four! Oh, they look like little suns.', 'Here, a marigold for your hair. Every visitor should wear one.'), fx: () => { S.flags.garden = 1; persist(); G.giveHat('flower'); G.badge('garden'); } };
      if (!S.flags.garden) return { lines: L('Hello dear! Any friend of Torty\'s is family. Want some lettuce? Of course you do.', 'Could you help me? There are 4 flower beds by our front wall. Plant a desert marigold in each one!') };
      return { lines: L(cyc(['Torty was SO small when she hatched. Now look at her: the CEO of her OWN company, Tortuga Tech!', 'Dinner is lettuce. Lunch was lettuce. Tomorrow? Surprise lettuce.'])) };
    case 'papa': fam('papa'); return { lines: L(cyc(['Welcome! I\'m Papa Basil. I grow the crunchiest lettuce on the street.', 'Have you tried the Broomstick Derby? I came in last in 1987. Proudest day of my life.', q === 1 ? 'The Moon Lantern? Pebble was asking about warm rocks yesterday… hmm.' : 'My daughter runs Tortuga Tech! They tested my lettuce basket. It\'s now drop-proof.'])) };
    case 'gramps': fam('gramps'); if (!S.flags.legend) S.flags.legend = 1, persist();
      return { lines: L(cyc([['Gramps Thaddeus', 'Zzz… eh? Oh, a visitor! Pull up a cushion.'], ['Gramps Thaddeus', 'My old shell gets chilly at night. Nothing a warm spring can\'t fix.'], ['Gramps Thaddeus', 'Want a legend? Long ago our ancestors carved a door in the eastern cliffs, behind the sleeping boulders.']]), ['Gramps Thaddeus', 'Three stone dials guard it. My grandpa said the middle one shows the PUMPKIN.'], ['Gramps Thaddeus', 'The other two? Look for old writing. Libraries… stars… slow and steady.']) };
    case 'pebble':
      if (q === 2) return { lines: L(['Pebble', 'Oh! Hi! Um… I didn\'t STEAL it. I borrowed it. Gramps says his shell gets chilly, so I brought the Moon Lantern up here to make the spring EXTRA warm for him.'], ['Pebble', 'I packed a lettuce picnic and everything. But then I heard everyone was worried and I felt bad…'], ['Pebble', 'Can you help me carry it back? It\'s heavy. And I\'m… small.']), fx: () => G.gotSun() };
      return { lines: L(cyc([['Pebble', 'I\'m Junior Moon Lantern Keeper now! I keep it VERY safe.'], ['Pebble', 'When I grow up I want to be fast like Rocky. Or slow like Gramps. Both!']])) };
    case 'candy': { friend('candy');
      if (q === 1 && !S.clues.sniff) return { lines: L(['Candy', 'Woof! I\'m the official festival sniffer! Want me to sniff the case? *sniff sniff*'], ['Candy', 'I smelled the pedestal already! It smells like LETTUCE and warm fizzy water. Like a witch’s cauldron spa!']), fx: () => G.addClue('sniff') };
      if (!S.flags.toys && S.toys.length >= 3) return { lines: L(['Candy', 'MY SQUEAKY CACTUS TOYS! All three! *SQUEAK SQUEAK SQUEAK*'], ['Candy', 'You get the honorary schnauzer ears. You\'re basically a schnauzer now.']), fx: () => { S.flags.toys = 1; persist(); G.giveHat('pupears'); G.badge('toys'); } };
      if (!S.flags.toys) return { lines: L(['Candy', n === 1 ? 'You\'re here too!! Torty invited me! This town is SO slow, I love it, I can sniff everything twice!' : 'Still looking for my toys?'], ['Candy', 'I lost my 3 squeaky cactus toys. One by the racetrack, one near the farm, one on Spooky Street, I think!']) };
      return { lines: L(['Candy', cyc(['The tortoises here are so nice. They pet me for a LONG time.', 'Pup Town is way faster. But Pumpkin Hollow has lettuce. Lettuce is ok I guess.'])]) }; }
    case 'luna': { friend('luna');
      if (q >= 1 && !S.flags.luna && S.clues.chart) return { lines: L(['Luna', 'You read the telescope log! See? A golden glow, up the hill, at 6:12 am. Moving at… 0.3 kilometers per hour.'], ['Luna', 'Snowie? No, she was with me all morning eating lemon drops. Those are what\'s golden and glowy.'], ['Luna', 'Take my sun goggles. Never look at the sun without them!']), fx: () => { S.flags.luna = 1; persist(); confirm('snowie'); G.giveHat('goggles'); } };
      return { lines: L(['Luna', cyc(['Torty invited us for the festival! I\'m helping calibrate the Moon Observatory.', 'I brought my Star Goggles to Tortuga Tech for a drop test. Torty\'s company is VERY impressive.', 'Check the telescope log. It records everything that glows in this valley.', 'Ratita Industries Pumpkin Hollow branch? We\'d have to move… slowly.'])]) }; }
    case 'pirat': { friend('pirat');
      if (!S.flags.race) return { lines: L(['Pi-rat', 'Ahoy! I built the racers a TURBO SHELL. Top speed: still very slow. But faster!'], ['Pi-rat', 'Race Speedy #3 in the Broomstick Derby! Tap CHEER right when the ring flashes green and Speedy speeds up.']), fx: () => G.offerRace() };
      return { lines: L(['Pi-rat', cyc(['Race again? Speedy loves the crowd!', 'Next upgrade: a lettuce-powered engine.', 'My Turbo Wheel is at Tortuga Tech getting shell-armor. Torty says it\'ll survive anything!'])]), fx: () => G.offerRace() }; }
    case 'snowie': { friend('snowie'); const s0 = S.sus.snowie | 0;
      if (q >= 1 && s0 === 0) return suspect('snowie', [['Snowie', 'Me? Golden and glowy? Oh! These are LEMON DROPS from Trick-or-Treat Sweets! Want one?'], ['Snowie', 'Ask Mrs. Taffy, she sold me a whole bag this morning.']]);
      if (!S.flags.snowie) return { lines: L(['Snowie', 'Hiii! I want to give Torty a sparkly polished shell cozy as a present. Can you polish one at the Shell Shop? Make it SHINY (70% or more)!']) };
      return { lines: L(['Snowie', cyc(['Torty LOVED the shell. She\'s wearing it on her shell. Shell-ception!', 'The market has a cactus that looks just like Pi-rat.', 'My Party Popper is at Tortuga Tech for the heat test. I hope it pops!'])]) }; }
    case 'rocky': { const s0 = S.sus.rocky | 0; if (q >= 1 && s0 === 0) return suspect('rocky', [['Rocky', 'Meep meep! Steal the Moon Lantern? I was delivering 400 letters at dawn! Ask Postmaster Penny!']]);
      return { lines: L(['Rocky', cyc(['Meep meep! Mail\'s here! (I\'m only stopping for a second.)', 'Fastest critter in Pumpkin Hollow! Not hard, honestly.'])]) }; }
    case 'glimmer': { const s0 = S.sus.glimmer | 0; if (q >= 1 && s0 === 0) return suspect('glimmer', [['Glimmer', 'I DO love shiny things… but I\'ve been here polishing shells since sunrise! Ask Coral!']]);
      return { lines: L(['Glimmer', cyc(['Shiny, shinier, SHINIEST. That\'s my motto.', 'Try polishing a shell! The swirly motion is the trick.'])]) }; }
    case 'penny': return confirm('rocky') ? { lines: L('Rocky? He was here at dawn sorting mail with me, then zoomed off on his route. Couldn\'t have done it!'), fx: () => G.toastMsg('✅ Rocky\'s alibi checks out!') } : { lines: L(cyc(['Welcome to the Roadrunner Post Office. Mail arrives fast, by tortoise standards.', 'Rocky delivers. We sort. Slowly.'])) };
    case 'coral': return confirm('glimmer') ? { lines: L('Glimmer? Polishing shells with me since sunrise. My best helper!'), fx: () => G.toastMsg('✅ Glimmer\'s alibi checks out!') } : { lines: L(cyc(['Welcome to the Shell Shop! Polishes, cozies, stickers. Try the polishing station!', 'A shiny shell is a happy shell.'])) };
    case 'taffy': return confirm('snowie') ? { lines: L('The little white rat? She bought a whole bag of lemon drops this morning. Golden, glowy and sour!'), fx: () => G.toastMsg('✅ Snowie\'s alibi checks out!') } : { lines: L(cyc(['Prickly pear lollipops! Cactus candy! Lemon drops!', 'Everything here is handmade. It took years.'])) };
    case 'shelly': return { lines: L(cyc(['Welcome to Tortuga Tech Spooky Lab! "We make it tougher." Torty\'s office is in the back, past the Shell-Armor Workshop.', 'Please sign in. Slowly. Thank you.', 'Fun fact: the lobby shell logo survived 400 drop tests. It\'s just showing off now.'])) };
    case 'bolt': return { lines: L(cyc(['Drop tower! We drop things from up high, then check for dents. Usually: no dents. 🐢', 'Rule #1 of drop testing: never stand under the drop. Rule #2: snacks.'])) };
    case 'blaze': return { lines: L(cyc(['Heat chamber and sand-blaster! Desert sun, desert wind, desert-tough.', 'The marshmallow control sample failed. Again. Delicious though.'])) };
    case 'ironshell': return { lines: L(cyc(['The crush press goes squish. The shell-armored stuff does not.', 'That box over there survived 9,000 squishes. I\'m very proud of it.'])) };
    case 'plato': return { lines: L(cyc(['I bolt shell-armor plates onto gadgets. Hex plates: nature\'s best design!', 'Luna, Pi-rat and Snowie left their gadgets here. Play MAKE IT TOUGHER at the station and armor them up!'])) };
    case 'gauge': return { lines: L(cyc(['Welcome to the Toughness Test Yard! Big drop, roll test, outdoor press. All live!', 'The boulder is foam inside. Don\'t tell anyone. Safety first!'])) };
    case 'tester1': return { lines: L(cyc(['Big Drop in 3… 2… 1… CLONK! Not a scratch. Next!', 'The foam pad is my favourite co-worker.'])) };
    case 'tester2': return { lines: L(cyc(['The Squish Test! The armored melon wins every time.', 'Squish, unsquish, write it down. Squish, unsquish…'])) };
    case 'ttfan1': case 'ttfan2': case 'ttfan3': return { lines: L(cyc(['GO SHELL GO! 🐢', 'I come every Saturday to watch the Big Drop!', 'That boulder is foam. I checked. Still exciting!'])) };
    case 'ttfan4': return { lines: L(cyc(['Best seats in town. The squish is SO satisfying.', 'Tortuga Tech tested my tail. It\'s fine. It was always fine.'])) };
    case 'baker': return { lines: L(cyc(['Fresh cactus conchas! Slow-baked for six hours. Worth it.', 'Torty orders a dozen every visit. She says they\'re "drop-tested". They\'re just delicious.'])) };
    case 'bakfan': return { lines: L(cyc(['Mmmf. Best concha in the desert. Mmmf.', 'The ovens keep the whole Quarter toasty at night.'])) };
    case 'drummer': return { lines: L(cyc(['ONE… two… three… four. (We play at turtle tempo.)', 'Tonight: "Slow Rock Sunset". Bring a cushion!'])) };
    case 'singer': return { lines: L(cyc(['♪ Shell-ebrate good times, come on! ♪', 'Torty used to sing here before she started Tortuga Tech. Very… durable vocals.'])) };
    case 'mfan': return { lines: L(cyc(['ENCORE! Eventually!', 'Front row cushions are the comfiest.'])) };
    case 'toymaker': return { lines: L(cyc(['Every toy here is hand-carved. And Tortuga-Tech-tested for toddler toughness!', 'Pebble saves his allowance for my wind-up racers.'])) };
    case 'toykid': return { lines: L(cyc(['CHOO CHOO! The train goes round and round and round…', 'I want the rocking tortoise. It\'s SO fast. (It isn\'t.)'])) };
    case 'usher': return { lines: L(cyc(['Now showing: "The Slowest Sunset". Runtime: 4 hours. Popcorn: free refills.', 'Please turn off your shells. I mean your phones.'])) };
    case 'moviefan': return { lines: L(cyc(['Shh! The sun is about to set. Any minute now.', 'This is my 9th time seeing it. It gets me every time.'])) };
    case 'scoop': return { lines: L(cyc(['Twelve flavours, all slow-churned. Prickly pear is the bestseller!', 'Try lettuce-lime. Trust me.'])) };
    case 'icekid': return { lines: L(cyc(['Brain freeze! …Slowly.', 'I got THREE scoops. Mama said one. Shh.'])) };
    case 'taco': return { lines: L(cyc(['Taco Tortuga! Lettuce tacos, cactus tacos, more lettuce tacos.', 'The truck was shell-tested at Tortuga Tech. It survived a stampede of hungry racers.'])) };
    case 'fiestafan': return { lines: L(cyc(['Fiesta every night! Well, every slow night.', 'Catch a movie, grab an ice cream, then dance by the fountain.'])) };
    case 'quarterfan': return { lines: L(cyc(['The Abandoned Village is the oldest part of town. Even older than Gramps!', 'Bakery, music hall, toy shop… everything a slow afternoon needs.'])) };
    case 'intern': return { lines: L(cyc(['I\'m the junior intern! My job is testing if the sofas are comfy. They are.', 'When I grow up I want to be as tough as Torty.'])) };
    case 'fisher': return { lines: L(cyc(['Shhh. The fish in this pond are very relaxed. So am I.', 'Caught nothing in 40 years. Best hobby ever.'])) };
    case 'lemon': return { lines: L(cyc(['Cactus lemonade! Sweet, sour and only a LITTLE prickly.', 'Snowie bought three cups. And a bag of lemon drops. That rat loves lemon.'])) };
    case 'painter': return { lines: L(cyc(['I\'m painting the pond. It\'s my 200th pond painting. It never moves, that\'s why I like it.', 'Have you seen the Moon Lantern at sunset? THAT\'s a colour.'])) };
    case 'zip': return { lines: L(['Zip', 'Meep! Ghost Train! Step up to any stop sign and pick where you want to go. Fastest ride in town!']) };
    case 'sam': return { lines: L(cyc(['Hop on the shuttle? I\'m already on my way… I\'ll be back around in about an hour.', 'Shuttle Sam, at your service. Next stop: also this stop, eventually.'])) };
    case 'fern': return { lines: L(cyc(['Howdy! Want to try Pumpkin Rush? Plant, water and pick as many lettuces as you can in 60 seconds!', 'Harvest 8 and I\'ll give you my spare chef hat.']), ), fx: () => G.offerFarm() };
    case 'coach': return { lines: L(cyc(['Slow and steady wins the race. Well, sometimes. Usually Zoom wins.', 'The secret to the Derby: cheer on the beat!'])) };
    case 'zoom': return { lines: L(cyc(['I\'m Zoom, 12-time Broomstick Derby champ. My record: 4 minutes for one lap.', 'Speedy #3 has real heart. Pi-rat\'s turbo shell doesn\'t hurt either.'])) };
    case 'paige': return { lines: L(cyc(['Shhh… welcome to the library. Whisper slowly.', 'The ancient book by the window is older than Gramps. Much older.', q === 1 ? 'Someone checked out a book this morning. Check the card catalog!' : 'Every book here is overdue. Nobody minds.'])) };
    case 'leafy': return { lines: L(cyc(['Welcome to the Cauldron Café! Today\'s special: lettuce.', q === 1 ? 'Funny thing, a tiny picnic order came in at dawn. The slip\'s on the counter.' : 'Our dessert menu? Lettuce, but colder.'])) };
    case 'drdune': return { lines: L(cyc(['Welcome to the museum! That fossil is Grand-Grand-Grandma Archie. She was a sea turtle, 5 meters long!', 'Some say our ancestors left tunnels under this valley. Nobody has ever found them.'])) };
    default: { const d = NPCS.find((x) => x.id === id); const gen = ['Hello there! Lovely day for a slow stroll.', 'Have you seen the Sunset Festival decorations? Took us 3 weeks!', 'Lettuce? Lettuce.', 'Welcome to Pumpkin Hollow! Take your time. We do.', 'The witch’s cauldron spas on the hill are SO relaxing.', 'Did you hear? The Moon Lantern is missing!', 'Ride the Ghost Train if you\'re in a hurry. We never are.', 'Tortuga Tech tested my reading glasses. Unbreakable! Now I just need to stop losing them.', 'Did you see the Big Drop at the Tortuga Tech yard? CLONK!'];
      return { lines: L(gen[(id.length * 3 + n) % gen.length]) }; }
  } }
