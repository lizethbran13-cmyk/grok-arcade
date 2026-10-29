/* Grok Land Party - SUPER FIESTA EXPANSION (MEGA DLC from the Grok Arcade DLC Machine 3000, idea #15)
   Unlocked by localStorage 'grokDLC.party.s_per_fiesta_expansion' (set by the arcade's DLC Shop, same origin).
   FIESTA MODE: roam the Fiesta Isles and three towns (Pinata Plaza, Taco Pueblo, Maraca Bay) with friends + CPU pals,
   chat with townsfolk, collect coins, eat street food, dance, smash pinatas, nap, build sandcastles, fool around and
   challenge anyone to a mini game. Plus the Fiesta Isles party board. Guests in a room can play if the host owns it. */
(function () {
'use strict';
const GP = window.GP, THREE = window.THREE, TAU = Math.PI * 2, W = GP.FZW;
const $ = (id) => document.getElementById(id), esc = GP.esc, clamp = GP.clamp;
const FZ = GP.FZ = { KEY: 'grokDLC.party.s_per_fiesta_expansion', ARCADE: 'https://lizethbran13-cmyk.github.io/grok-arcade/', PRICE: 200 };
let C = null;
FZ.bind = (c) => { C = c; };
FZ.owned = () => {
  try {
    if (!localStorage.getItem(FZ.KEY)) localStorage.setItem(FZ.KEY, '1');
    return true;
  } catch (e) { return true; }
};
FZ.can = () => FZ.owned() || !!(C && C.isClient() && C.S_() && C.S_().fzOwn);

/* ======================================================================
   DATA
   ====================================================================== */
const FOODS = [
  { n: 'Taco al Pastor', e: '\uD83C\uDF2E', p: 3, bf: 'speed', d: 'Spicy! Run 40% faster for 20s' },
  { n: 'Elote', e: '\uD83C\uDF3D', p: 2, bf: 'lucky', d: 'Lucky corn: coins you grab count double for 20s' },
  { n: 'Churro', e: '\uD83E\uDD68', p: 2, bf: 'magnet', d: 'Sugar magnet: grab coins from further away for 20s' },
  { n: 'Paleta', e: '\uD83C\uDF6D', p: 1, bf: 'freeze', d: 'BRAIN FREEZE! Brrrr... a silly shiver' },
  { n: 'Agua Fresca', e: '\uD83E\uDD64', p: 1, bf: 'fresh', d: 'So fresh! +10% on your next dance score' },
];
FZ.FOODS = FOODS;

const SHOPS = [
  { id: 'bazaar', a: 0, name: 'Ratita Stone Bazaar', icon: '🏺', keeper: 'Doña Carmen', desc: 'Hand-carved stone pottery & lucky Ratita fiesta charms!', items: [
    { id: 'idol', n: 'Stone Fiesta Idol', e: '🗿', p: 4, bf: 'lucky', d: 'Doubles every coin you pick up for 30s!' },
    { id: 'lantern', n: 'Ratita Paper Lantern', e: '🏮', p: 3, bf: 'magnet', d: 'Draws nearby coins right into your pocket for 25s!' }
  ]},
  { id: 'tortuga_hub', a: 0, name: 'Tortuga Tech Gear Outpost', icon: '🐢', keeper: 'Ingeniero Mateo', desc: 'Shell-tough Tortuga Tech shields & turbo boots!', items: [
    { id: 'shell_shield', n: 'Tortuga Shell Shield', e: '🛡️', p: 4, bf: 'shield', d: 'Blocks all Spicy Chili Carts & Pinching Crabs + restores 100% Stamina!' },
    { id: 'jet_sandals', n: 'Turbo Fiesta Huaraches', e: '👟', p: 3, bf: 'speed', d: 'Sprint 40% faster across cobblestone streets for 25s!' }
  ]},
  { id: 'pinata_shop', a: 1, name: 'Taller de Piñatas', icon: '🪅', keeper: 'Maestro Bruno', desc: 'Custom party piñatas, confetti sticks & fiesta horns!', items: [
    { id: 'golden_bat', n: 'Golden Piñata Bat', e: '🏏', p: 4, bf: 'lucky', d: '2x coin drops & bonus fiesta luck for 25s!' },
    { id: 'confetti_pack', n: 'Mega Confetti Bomb', e: '🎊', p: 2, bf: 'fresh', d: '+10% Dance Floor score & instant confetti burst!' }
  ]},
  { id: 'candy_shop', a: 1, name: 'Dulcería Mega Candy', icon: '🍬', keeper: 'Dulce Sofia', desc: 'Artisanal Mexican sweets, tamarindos & sugar rushes!', items: [
    { id: 'marzipan', n: 'Mazapán Real', e: '🍬', p: 2, bf: 'magnet', d: 'Sweet coin magnet for 25s + +35% Stamina!' },
    { id: 'chamoy', n: 'Chamoy Rocket Pop', e: '🍭', p: 3, bf: 'speed', d: 'Spicy-sweet speed boost for 25s!' }
  ]},
  { id: 'salsa_shop', a: 2, name: 'Mercado de Salsas', icon: '🌶️', keeper: 'Don Habanero', desc: 'Stone-ground molcajete salsas & fireproof spice tonics!', items: [
    { id: 'molcajete', n: 'Molcajete Guacamole', e: '🥑', p: 3, bf: 'shield', d: 'Full Stamina restore + hazard immunity for 25s!' },
    { id: 'habanero', n: 'Salsa Habanero', e: '🌶️', p: 2, bf: 'speed', d: 'Blazing 40% speed boost for 25s!' }
  ]},
  { id: 'sombrero_shop', a: 2, name: 'Sombrero Sastre', icon: '👒', keeper: 'Sastre Diego', desc: 'Velvet charro sombreros, ponchos & embroidered sashes!', items: [
    { id: 'charro_hat', n: 'Sombrero de Gala', e: '🤠', p: 4, bf: 'lucky', d: '2x coin multiplier & VIP fiesta style for 25s!' },
    { id: 'serape', n: 'Rainbow Serape Cape', e: '🧣', p: 3, bf: 'fresh', d: '+10% Dance score & +50% Stamina!' }
  ]},
  { id: 'surf_shop', a: 3, name: 'Maraca Surf & Board Shop', icon: '🏄', keeper: 'Kai del Mar', desc: 'Carved wooden surfboards, crab-proof flip-flops & beach gear!', items: [
    { id: 'crab_boots', n: 'Crab-Proof Reef Boots', e: '🥾', p: 3, bf: 'shield', d: 'Protects from Pinching Beach Crabs + restores 100% Stamina!' },
    { id: 'wave_wax', n: 'Turbo Surf Wax', e: '🏄', p: 2, bf: 'speed', d: 'Glide 40% faster across the sand for 25s!' }
  ]},
  { id: 'pearl_shop', a: 3, name: 'Perla Shell Boutique', icon: '🐚', keeper: 'Sirena Valeria', desc: 'Ocean pearls, sea-glass jewelry & conch horns!', items: [
    { id: 'sea_pearl', n: 'Luminous Bay Pearl', e: '🦪', p: 4, bf: 'lucky', d: 'Doubles every coin you collect for 25s!' },
    { id: 'conch_charm', n: 'Tidal Magnet Shell', e: '🐚', p: 3, bf: 'magnet', d: 'Pulls beach coins from far away for 25s!' }
  ]},
  { id: 'joyeria', a: 4, name: 'La Joyería Crown & Gems', icon: '👑', keeper: 'Joyero Lorenzo', desc: 'Gran Pueblo Viejo’s premier stone vault of crowns, rubies & fiesta gold!', items: [
    { id: 'emerald_crown', n: 'Corona de Esmeralda', e: '👑', p: 5, bf: 'lucky', d: 'Royal 2x coin multiplier + +100% Stamina!' },
    { id: 'sun_brooch', n: 'Sol de Oro Amulet', e: '☀️', p: 4, bf: 'magnet', d: 'Wide-range golden coin magnet for 30s!' }
  ]},
  { id: 'artesanias', a: 4, name: 'Artesanías de Piedra', icon: '🏺', keeper: 'Maestra Elena', desc: 'Cobblestone sculptures, painted talavera tiles & fiesta masks!', items: [
    { id: 'jaguar_mask', n: 'Máscara de Jaguar', e: '🎭', p: 3, bf: 'speed', d: 'Sprint 40% faster through Gran Pueblo Viejo!' },
    { id: 'talavera_vase', n: 'Jarrón de Talavera', e: '🏺', p: 3, bf: 'lucky', d: 'Lucky 2x coin blessing for 25s!' }
  ]},
  { id: 'botica', a: 4, name: 'Botica Ratita Elixir Shop', icon: '🧪', keeper: 'Doctora Clara', desc: 'Ratita Industries herbal tonics, stamina brews & fiesta elixirs!', items: [
    { id: 'vital_brew', n: 'Tónico de Fiesta 100%', e: '🧪', p: 2, bf: 'shield', d: 'Restores 100% Stamina & grants a 25s Hazard Shield!' },
    { id: 'spark_tea', n: 'Elixir Relámpago', e: '⚡', p: 3, bf: 'speed', d: 'Supercharged fiesta speed for 25s!' }
  ]},
  { id: 'armory', a: 4, name: 'Tortuga Tech Stone Forge', icon: '🛡️', keeper: 'Herrero Héctor', desc: 'Heavy-duty Tortuga Tech cobblestone armor & hazard deflectors!', items: [
    { id: 'carapace', n: 'Tortuga Carapace Armor', e: '🛡️', p: 4, bf: 'shield', d: 'Unbreakable 30s Hazard Shield + full 100% Stamina!' },
    { id: 'mag_glove', n: 'Guante Magnético', e: '🧤', p: 3, bf: 'magnet', d: 'Industrial Tortuga coin magnet for 25s!' }
  ]},
  { id: 'panaderia', a: 4, name: 'Panadería Dulce Viejo', icon: '🥐', keeper: 'Panadero Tomás', desc: 'Warm conchas, tres leches cake & cinnamon hot chocolate!', items: [
    { id: 'concha', n: 'Concha de Vainilla', e: '🥯', p: 2, bf: 'shield', d: 'Warm bakery heal: +100% Stamina & cozy shield!' },
    { id: 'choco', n: 'Chocolate Abuelita', e: '☕', p: 2, bf: 'speed', d: 'Rich cocoa energy boost (+40% speed)!' }
  ]},
  { id: 'musica', a: 4, name: 'Casa de la Música', icon: '🎺', keeper: 'Maestro Rodrigo', desc: 'Handcrafted guitars, silver trumpets & golden maracas!', items: [
    { id: 'gold_maracas', n: 'Maracas de Oro', e: '🪇', p: 3, bf: 'fresh', d: '+10% Dance Floor bonus + fiesta sparkle!' },
    { id: 'silver_horn', n: 'Trompeta Real', e: '🎺', p: 4, bf: 'lucky', d: '2x coin fanfare for 25s!' }
  ]}
];
FZ.SHOPS = SHOPS;

const PETS_DATA = [
  { id: 'luna', name: 'Luna', icon: '🐈‍⬛', title: 'Ratita Night Cat', area: 0, areaName: 'Fiesta Isles & Gran Pueblo Viejo', buff: 'speed', gift: 4, desc: 'Purrs a cosmic melody! Grants +4 coins, restores Stamina & boosts run speed!' },
  { id: 'pirat', name: 'Pi-rat', icon: '🏴‍☠️', title: 'Swashbuckling Fiesta Rat', area: 2, areaName: 'Taco Pueblo & Gran Pueblo Viejo', buff: 'lucky', gift: 5, desc: 'Shares pirate doubloons! Grants +5 coins & 2x Lucky Coins buff!' },
  { id: 'snowie', name: 'Snowie', icon: '🐻‍❄️', title: 'Frosty Shield Pup', area: 3, areaName: 'Maraca Bay & Gran Pueblo Viejo', buff: 'shield', gift: 4, desc: 'Wraps you in a cool breeze! Restores 100% Stamina & blocks Chili Cart / Crab hazards!' },
  { id: 'candy', name: 'Candy', icon: '🐰', title: 'Cotton-Candy Rescue Bunny', area: 1, areaName: 'Piñata Plaza & Gran Pueblo Viejo', buff: 'magnet', gift: 4, desc: 'Sweet fiesta magic! Grants +4 coins, Sugar Magnet & co-runs Emergency Bailout!' },
  { id: 'torty', name: 'Torty', icon: '🐢', title: 'Tortuga Tech Guardian Turtle', area: 0, areaName: 'Fiesta Isles & Gran Pueblo Viejo', buff: 'shield', gift: 5, desc: 'Shell-tough protector! Restores 100% Stamina, grants Tortuga Shield & free 0-coin Bailout!' }
];
FZ.PETS = PETS_DATA;
const EMOTES = { wave: ['\uD83D\uDC4B', 2], dance: ['\uD83D\uDC83', 99], flip: ['\uD83E\uDD38', 1], laugh: ['\uD83D\uDE02', 2] };
const MGN = (id) => { const d = GP.MG && GP.MG[id]; return d ? d.name : id; };
const SK = [0xf2c49a, 0xd8a070, 0xb07a4a, 0x8a5a3a, 0xe8b88a];
const NPCS = [
  // Fiesta Isles (hub)
  { id: 'pepe', a: 0, name: 'Pepe', role: 'bus', at: [6.4, 1.4], face: -0.6, look: { shirt: 0x2a6ae8, pants: 0x1b1440, hat: 'cap', hatCol: 0xffd23f, stache: true, skin: SK[2] },
    lines: ['\u00a1Hola! I drive the Fiesta Bus. Where to, amigo?', 'Beep beep! Every town is just one ride away.', 'The bus is free. Fiestas should be free!'] },
  { id: 'rosa', a: 0, name: 'Rosa', role: 'chat', route: [[-6, 9], [-11, 1], [-7, -9], [6, -9], [11, 1], [6, 10]], look: { dress: 0xff4fd8, shirt: 0xffffff, long: true, flower: 0xff4d4d, skin: SK[1] },
    lines: ['Flowers for the fiesta! Smell that? Pure happiness.', 'Have you tried the churros in Taco Pueblo? \u00a1Deliciosos!', 'The pi\u00f1ata in the plaza is SO full of coins.'] },
  { id: 'beto', a: 0, name: 'T\u00edo Beto', role: 'chal', chal: 'coins', at: [-5.5, -3.5], face: 0.8, look: { poncho: 0x3ff0ff, shirt: 0xffffff, hat: 'sombrero', hatCol: 0xe8c070, stache: true, hair: 0x9a9a9a, skin: SK[1] },
    lines: ['Ay, I was the Coin Dash champion back in my day!', 'Think you are fast? Prove it, kiddo!', 'Win my challenge and I will pay you 8 shiny coins.'] },
  { id: 'lupe', a: 0, name: 'Lupe', role: 'chat', speed: 3.4, route: [[-15, -6], [0, -15], [15, -6], [16, 8], [0, 16], [-16, 8]], look: { shirt: 0x4ade80, pants: 0x2a2a4a, hat: 'cap', hatCol: 0xff4fd8, bun: true, skin: SK[3] },
    lines: ['*puff puff* Morning jog around the whole island!', 'Did you know there are THREE towns here?', 'Fiesta tip: tacos make you run super fast!'] },
  // Pinata Plaza
  { id: 'dj', a: 1, name: 'DJ Maracas', role: 'dj', at: [5.2, 3.4], face: -0.5, look: { shirt: 0x1b1440, pants: 0x1b1440, hat: 'shades', prop: 'maracas', skin: SK[3] },
    lines: ['Step on the glowing floor and show me your moves!', 'Hit the arrows on the beat. Rank S gets the most coins!', 'This floor has seen 1000 fiestas. Make it 1001!'] },
  { id: 'juan', a: 1, name: 'Juan', role: 'band', at: [-2.6, -10.3], y: 0.8, face: 0, look: { shirt: 0x1b1440, pants: 0x1b1440, sleeve: 0x1b1440, hat: 'sombrero', hatCol: 0x1b1440, stache: true, prop: 'guitar', skin: SK[1] },
    lines: ['We are Mariachi Grok! Want a song? Just ask!', '\u266A Ay ay ay ay... \u266A'] },
  { id: 'carlos', a: 1, name: 'Carlos', role: 'band', at: [0, -10.6], y: 0.8, face: 0, look: { shirt: 0xffffff, pants: 0x1b1440, hat: 'sombrero', hatCol: 0xffffff, prop: 'trumpet', skin: SK[2] },
    lines: ['My trumpet is louder than a volcano!', 'Toot toot! Ask us for a song!'] },
  { id: 'ana', a: 1, name: 'Ana', role: 'band', at: [2.6, -10.3], y: 0.8, face: 0, look: { dress: 0xff4d4d, shirt: 0x1b1440, long: true, flower: 0xffd23f, prop: 'violin', skin: SK[0] },
    lines: ['The violin is the heart of the mariachi!', 'La la la! Request a song and we will play!'] },
  { id: 'dona', a: 1, name: 'Do\u00f1a Pi\u00f1ata', role: 'pin', at: [8.2, 6], face: -0.9, look: { dress: 0xa78bfa, shirt: 0xffd23f, long: true, bun: true, hair: 0xbbbbbb, skin: SK[1] },
    lines: ['I made that pi\u00f1ata myself! Whack it with A!', 'Eight good hits and it bursts into coins!', 'A new pi\u00f1ata appears after a little while.'] },
  { id: 'chispa', a: 1, name: 'Chispa', role: 'chal', chal: 'balloon', kid: true, route: [[-8, 8], [-11, -4], [-6, -7], [6, -7], [11, -4], [8, 8]], speed: 2.6, look: { shirt: 0xffd23f, pants: 0x3f9a4a, hat: 'cap', hatCol: 0xff4d4d, skin: SK[2] },
    lines: ['I can pop balloons faster than ANYONE!', 'Balloon Pop! You and me! Right now!', 'Hee hee! Beat me and win 8 coins!'] },
  { id: 'paco', a: 1, name: 'Paco', role: 'chal', chal: 'potato', at: [-6, 6.4], face: 0.4, look: { poncho: 0xff7a3d, shirt: 0xffffff, hat: 'sombrero', hatCol: 0xd8a868, stache: true, skin: SK[3] },
    lines: ['Hot potato! HOT POTATO! Don\'t get caught holding it!', 'Wanna play Hot Potato? It is very... hot.'] },
  { id: 'mimi', a: 1, name: 'Mimi', role: 'dancer', at: [-1.6, -2.2], look: { dress: 0x3ff0ff, shirt: 0xff4fd8, long: true, flower: 0xffffff, skin: SK[4] }, lines: ['Dance with us!', 'Wooo! Fiesta!'] },
  { id: 'tono', a: 1, name: 'To\u00f1o', role: 'dancer', at: [1.8, 0.4], look: { shirt: 0xff4d4d, pants: 0x1b1440, hat: 'sombrero', hatCol: 0xff4fd8, skin: SK[1] }, lines: ['These moves? Pure fiesta.', 'Left, right, spin!'] },
  // Taco Pueblo
  { id: 'tita', a: 2, name: 'Abuela Tita', role: 'food', food: 0, at: [-12, -8.1], face: 0, look: { dress: 0xff4d4d, shirt: 0xffffff, apron: true, bun: true, hair: 0xcccccc, skin: SK[1] }, lines: ['Tacos al pastor, made with love!', 'Eat, eat! You look hungry, mijo!'] },
  { id: 'elote', a: 2, name: 'Don Elote', role: 'food', food: 1, at: [-6, -8.1], face: 0, look: { shirt: 0xffd23f, pants: 0x3a3a7a, hat: 'sombrero', stache: true, apron: true, skin: SK[2] }, lines: ['Elotes! Corn with lime and a little chili!', 'Lucky corn! Grab coins twice as fast!'] },
  { id: 'chuy', a: 2, name: 'Churro Chuy', role: 'food', food: 2, at: [0, -8.1], face: 0, look: { shirt: 0xc0782a, pants: 0x3a2a1a, hat: 'chef', apron: true, skin: SK[3] }, lines: ['Hot churros! Crunchy, sugary, magnetic!', 'Sugar magnet! Coins come running to you!'] },
  { id: 'paz', a: 2, name: 'Paleta Paz', role: 'food', food: 3, at: [6, -8.1], face: 0, look: { shirt: 0xff6ad5, pants: 0x3ff0ff, long: true, flower: 0x3ff0ff, apron: true, skin: SK[0] }, lines: ['Paletas! Mango, strawberry, lime!', 'Careful... brain freeze!'] },
  { id: 'fer', a: 2, name: 'Fresca Fer', role: 'food', food: 4, at: [12, -8.1], face: 0, look: { shirt: 0x3ff0ff, pants: 0x1b1440, hat: 'cap', hatCol: 0x4ade80, apron: true, skin: SK[2] }, lines: ['Agua fresca! Horchata! Jamaica!', 'So refreshing your dance moves get better!'] },
  { id: 'nacho', a: 2, name: 'Chef Nacho', role: 'chal', chal: 'mash', route: [[-12, 1], [12, 1], [12, -3], [-12, -3]], speed: 2, look: { shirt: 0xffffff, pants: 0x1b1440, hat: 'chef', stache: true, skin: SK[1] },
    lines: ['I chop 1000 onions a minute! Bet you can\'t mash that fast!', 'Mash Race! Loser washes the dishes! (Just kidding.)'] },
  { id: 'chema', a: 2, name: 'Abuelo Chema', role: 'sit', at: [0, 2.85], face: 0, look: { shirt: 0xa8e0ff, pants: 0x5a4a3a, hat: 'sombrero', hatCol: 0xe8c070, stache: true, hair: 0xdddddd, skin: SK[2] },
    lines: ['In my day, tacos cost one coin. ONE!', 'Sit, sit. The fiesta goes all night.', 'Have you visited Maraca Bay? The sunsets...'] },
  // Maraca Bay
  { id: 'coco', a: 3, name: 'Capit\u00e1n Coco', role: 'chal', chal: 'ice', at: [-10.6, -7.2], face: 0.6, look: { shirt: 0xffffff, pants: 0x1b1440, hat: 'captain', stache: true, hair: 0xffffff, skin: SK[1] },
    lines: ['Ahoy! The sea is slippery, and so is Ice Sumo!', 'I have never fallen off a boat. Or an ice rink!', 'Beat me at Ice Sumo for 8 doubloons... I mean coins!'] },
  { id: 'marina', a: 3, name: 'Marina', role: 'chat', at: [13.6, -2.9], face: -0.8, look: { shirt: 0xff4d4d, pants: 0xff4d4d, hat: 'shades', long: true, skin: SK[3] },
    lines: ['Lifeguard on duty! Stay safe and have fun!', 'The hammocks are perfect for a fiesta nap.'] },
  { id: 'sol', a: 3, name: 'Surfer Sol', role: 'chal', chal: 'hill', route: [[-9, 6], [9, 6], [9, 2], [-9, 2]], speed: 2.2, look: { shirt: 0xffd23f, pants: 0x3ff0ff, hat: 'shades', long: true, hair: 0xffe080, skin: SK[2] },
    lines: ['Duuude, the waves are gnarly today!', 'King of the Hill, bro? Winner rules the beach!'] },
  { id: 'arenita', a: 3, name: 'Arenita', role: 'castle', kid: true, at: [-0.4, -1.4], face: Math.PI, look: { dress: 0xffd23f, shirt: 0xff6ad5, bun: true, skin: SK[0] },
    lines: ['Help me build the BIGGEST sandcastle! Press A!', 'More sand! More towers!'] },
  // New Shopkeepers & Villagers on Fiesta Isles & Towns
  { id: 'carmen', a: 0, name: 'Doña Carmen', role: 'shop', shop: 'bazaar', at: [-9.2, -2.5], face: 0.3, look: { dress: 0xff4fd8, shirt: 0xffe08a, bun: true, flower: 0xffd23f, skin: SK[1] },
    lines: ['Welcome to the Ratita Stone Bazaar! Carved stone idols & lanterns inside!', 'Our stone shops were built to make Fiesta Isles grand and vibrant!'] },
  { id: 'mateo', a: 0, name: 'Ing. Mateo', role: 'shop', shop: 'tortuga_hub', at: [9.2, -2.5], face: -0.3, look: { shirt: 0x3ad88a, pants: 0x1b1440, hat: 'cap', hatCol: 0x3ad88a, skin: SK[2] },
    lines: ['Tortuga Tech Gear Outpost! Grab a Shell Shield before a runaway Chili Cart bumps you!', 'Remember: if you ever hit 0 coins or 0% Stamina, Torty & Candy give a FREE Emergency Bailout!'] },
  // Gran Pueblo Viejo (Area 4 - Grand Cobblestone Town & Stone Shop District)
  { id: 'alcalde', a: 4, name: 'Alcalde Don Aurelio', role: 'chat', at: [0, 3.6], face: 0, look: { poncho: 0xffbe0b, shirt: 0xffffff, pants: 0x1b1440, hat: 'sombrero', hatCol: 0x1b1440, stache: true, hair: 0xdddddd, skin: SK[1] },
    lines: ['¡Bienvenidos a Gran Pueblo Viejo! Our grand cobblestone town has 6 carved-stone shops and the Clocktower Cathedral!', 'Visit La Joyería, Artesanías de Piedra, Botica Ratita, Tortuga Tech Forge, Panadería Dulce, and Casa de la Música!', 'All 5 pets — Luna, Pi-rat, Snowie, Candy, and Torty — hang out right here in the cobblestone square!'] },
  { id: 'lorenzo', a: 4, name: 'Joyero Lorenzo', role: 'shop', shop: 'joyeria', at: [-10.2, -6.5], face: Math.PI / 2, look: { shirt: 0xffbe0b, pants: 0x1b1440, hat: 'tophat', stache: true, skin: SK[0] },
    lines: ['La Joyería Crown & Gems! Finest emeralds and golden sun amulets in Gran Pueblo Viejo!'] },
  { id: 'elena', a: 4, name: 'Maestra Elena', role: 'shop', shop: 'artesanias', at: [-10.2, 2.5], face: Math.PI / 2, look: { dress: 0xff4fd8, shirt: 0xffffff, long: true, flower: 0x3ff0ff, skin: SK[2] },
    lines: ['Artesanías de Piedra! Hand-carved jaguar masks and painted talavera pottery!'] },
  { id: 'clara', a: 4, name: 'Doctora Clara', role: 'shop', shop: 'botica', at: [10.2, -6.5], face: -Math.PI / 2, look: { dress: 0x3ff0ff, shirt: 0xffffff, bun: true, skin: SK[4] },
    lines: ['Botica Ratita! Drink a Tónico de Fiesta to restore 100% Stamina and block runaway Chili Carts!'] },
  { id: 'hector', a: 4, name: 'Herrero Héctor', role: 'shop', shop: 'armory', at: [10.2, 2.5], face: -Math.PI / 2, look: { shirt: 0x3ad88a, pants: 0x22223b, apron: true, stache: true, skin: SK[3] },
    lines: ['Tortuga Tech Stone Forge! Our carapace armor shrugs off any fiesta hazard!'] },
  { id: 'tomas', a: 4, name: 'Panadero Tomás', role: 'shop', shop: 'panaderia', at: [-7.5, -8.2], face: 0, look: { shirt: 0xffffff, pants: 0x4a3a2a, hat: 'chef', apron: true, skin: SK[1] },
    lines: ['Fresh warm conchas and hot chocolate straight from our stone ovens!'] },
  { id: 'rodrigo', a: 4, name: 'Maestro Rodrigo', role: 'shop', shop: 'musica', at: [7.5, -8.2], face: 0, look: { shirt: 0x9b5de5, pants: 0x1b1440, hat: 'sombrero', hatCol: 0x9b5de5, prop: 'guitar', skin: SK[2] },
    lines: ['Casa de la Música! Golden maracas and silver trumpets for true fiesta legends!'] },
  { id: 'valiente', a: 4, name: 'Capitán Valiente', role: 'chal', chal: 'bomb', route: [[-7, 6], [7, 6], [7, -2], [-7, -2]], speed: 2.3, look: { poncho: 0xff4d4d, shirt: 0x1b1440, hat: 'sombrero', hatCol: 0xffd23f, stache: true, skin: SK[1] },
    lines: ['In Gran Pueblo Viejo we play Bomb Tag on the cobblestones! Dare to challenge me for 8 coins?', 'Watch out for the Cobblestone Pepper Cart while you run!'] },
  { id: 'isabela', a: 4, name: 'Isabela', role: 'chat', route: [[-10, 0], [0, 7], [10, 0], [0, -5]], speed: 1.9, look: { dress: 0xff9ad5, shirt: 0xffffff, long: true, flower: 0xffbe0b, skin: SK[0] },
    lines: ['Gran Pueblo Viejo is so lively! Look at the Clocktower and all the carved stone shops!', 'Have you petted Luna, Pi-rat, Snowie, Candy, and Torty yet?'] },
];
FZ.NPCS = NPCS;
const STAMPS = [
  ['towns', '\uD83D\uDDFA\uFE0F', 'Explorer', 'Visit all 3 towns'],
  ['talk', '\uD83D\uDCAC', 'Social Butterfly', 'Chat with 6 townsfolk'],
  ['coins', '\uD83E\uDE99', 'Coin Collector', 'Collect 40 coins in Fiesta Mode'],
  ['eat', '\uD83C\uDF2E', 'Foodie', 'Taste 3 different street foods'],
  ['dance', '\uD83D\uDC83', 'Dance Star', 'Get rank A or S on the dance floor'],
  ['pinata', '\uD83E\uDE85', 'Pi\u00f1ata Smasher', 'Land the final hit on a pi\u00f1ata'],
  ['win', '\uD83C\uDFC6', 'Challenger', 'Win a mini game challenge'],
  ['nap', '\uD83D\uDE34', 'Siesta Pro', 'Nap in a hammock at Maraca Bay'],
  ['castle', '\uD83C\uDFF0', 'Sand Architect', 'Help finish a sandcastle'],
  ['fool', '\uD83E\uDD2A', 'Goofball', 'Do all 4 silly emotes'],
];
FZ.STAMPS = STAMPS;
const save = () => {
  GP.save.fz = GP.save.fz || { st: {}, talk: [], foods: [], towns: [], coins: 0, em: [], champ: false, shops: [], pets: [], hp: 100, bailouts: 0 };
  if (typeof GP.save.fz.hp !== 'number') GP.save.fz.hp = 100;
  if (!Array.isArray(GP.save.fz.shops)) GP.save.fz.shops = [];
  if (!Array.isArray(GP.save.fz.pets)) GP.save.fz.pets = [];
  return GP.save.fz;
};

/* ======================================================================
   WORLD (built lazily, one area visible at a time)
   ====================================================================== */
let root = null, areas = [], sky = null, npcM = {}, avs = [], avSig = '', coinM = new Map(), conf = [], drew = false;
function area(a) {
  if (!areas[a]) { areas[a] = W.build(a); areas[a].grp.visible = false; areas[a].spots = spots(a, areas[a]); }
  if (root && areas[a].grp.parent !== root) root.add(areas[a].grp);
  return areas[a];
}
function spots(a, A) {
  const L = [];
  L.push(a === 0 ? { k: 'bus', x: 5.5, z: 3, r: 2.4 } : { k: 'bus', x: 8.5, z: 10.6, r: 2.2 });
  if (a === 0 && A.hubShops) A.hubShops.forEach((s) => L.push({ k: 'shop', x: s.x, z: s.z, r: 2.5, shop: s.id }));
  if (a === 1) {
    L.push({ k: 'dance', x: 0, z: -1, r: 3.9 }, { k: 'pin', x: A.pinSpot.x, z: A.pinSpot.z, r: 2.3 }, { k: 'wish', x: A.fount.x, z: A.fount.z, r: 3.4 }, { k: 'band', x: 0, z: -8, r: 2.4 });
    if (A.plazaShops) A.plazaShops.forEach((s) => L.push({ k: 'shop', x: s.x, z: s.z, r: 2.5, shop: s.id }));
  }
  if (a === 2) {
    A.stalls.forEach((s) => L.push({ k: 'eat', x: s.x, z: s.z, r: 1.9, food: s.k }));
    A.tables.forEach((t) => L.push({ k: 'sit', x: t.x, z: t.z, r: 1.5 }));
    if (A.tacoShops) A.tacoShops.forEach((s) => L.push({ k: 'shop', x: s.x, z: s.z, r: 2.5, shop: s.id }));
  }
  if (a === 3) {
    A.hammocks.forEach((h) => L.push({ k: 'nap', x: h.x, z: h.z, r: 1.8, h }));
    L.push({ k: 'build', x: A.castle.x, z: A.castle.z, r: 2.2 });
    if (A.bayShops) A.bayShops.forEach((s) => L.push({ k: 'shop', x: s.x, z: s.z, r: 2.5, shop: s.id }));
  }
  if (a === 4) {
    if (A.viejoFount) L.push({ k: 'wish', x: A.viejoFount.x, z: A.viejoFount.z, r: 3.2 });
    if (A.bellTower) L.push({ k: 'bell', x: A.bellTower.x, z: A.bellTower.z, r: 2.8 });
    if (A.viejoShops) A.viejoShops.forEach((s) => L.push({ k: 'shop', x: s.x, z: s.z, r: 2.6, shop: s.id }));
  }
  if (A.pets) A.pets.forEach((p) => L.push({ k: 'pet', x: p.x, z: p.z, r: 2.1, pet: p.id }));
  return L;
}
function bounds(a, p) {
  if (a === 0) { const e = Math.hypot(p.x / 28.5, p.z / 23.5); if (e > 1) { p.x /= e; p.z /= e; } }
  else { p.x = clamp(p.x, -16.2, 16.2); p.z = clamp(p.z, a === 3 ? -7.6 : -13.2, 14.2); }
  const A = area(a);
  for (const c of A.col) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + 0.35; if (d < m && d > 1e-4) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; } }
}
function npcPos(n, t) {
  if (!n.route) return { x: n.at[0], z: n.at[1], r: n.face || 0, mv: false };
  const R = n.route, sp = n.speed || 1.6; let tot = 0; const seg = [];
  for (let k = 0; k < R.length; k++) { const a = R[k], b = R[(k + 1) % R.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push(l); tot += l; }
  let d = ((t * sp + n.id.length * 7) % tot + tot) % tot;
  for (let k = 0; k < R.length; k++) { if (d <= seg[k]) { const a = R[k], b = R[(k + 1) % R.length], f = d / seg[k]; return { x: a[0] + (b[0] - a[0]) * f, z: a[1] + (b[1] - a[1]) * f, r: Math.atan2(b[0] - a[0], b[1] - a[1]), mv: true }; } d -= seg[k]; }
  return { x: R[0][0], z: R[0][1], r: 0, mv: true };
}
FZ.npcPos = npcPos;
function ensureRoot() {
  if (root) { if (!root.parent) C.scene.add(root); return; }
  root = new THREE.Group(); C.scene.add(root); sky = W.sky(); root.add(sky);
  for (let a = 0; a < W.AREAS.length; a++) area(a);
  NPCS.forEach((n) => {
    const h = W.folk(n.look); if (n.kid) h.root.scale.setScalar(0.72);
    const tag = GP.nameTag(n.name, n.role === 'chal' ? '#ff4fd8' : n.role === 'food' ? '#ffd23f' : '#3ff0ff'); tag.position.y = n.kid ? 2.6 : 2.3; tag.scale.multiplyScalar(n.kid ? 1.25 : 0.9); h.root.add(tag); h.tag = tag;
    if (n.role === 'chal') { const mk = new THREE.Mesh(GP.G.octa, GP.basic(0xff4fd8)); mk.scale.set(0.16, 0.26, 0.16); mk.position.y = n.kid ? 3.3 : 2.85; h.root.add(mk); h.mark = mk; }
    if (n.role === 'food') { const f = W.food(n.food); f.position.set(0, -0.48, 0.12); h.armR.add(f); }
    areas[n.a].grp.add(h.root); npcM[n.id] = h;
  });
}
function detach() { if (root && root.parent) { root.parent.remove(root); if (GP.sun) { GP.sun.position.set(20, 40, 15); GP.sun.target.position.set(0, 0, 0); } lastArea = -1; } }

/* ======================================================================
   HOST SIMULATION
   ====================================================================== */
const bot = [];
FZ.start = function () {
  const S = C.S_();
  S.pl.forEach((p) => { p.coins = 10; p.mx = 10; });
  S.fz = { t: 0, p: S.pl.map((_, i) => ({ a: 0, x: -2 + i * 2, z: 12.5, r: Math.PI, em: '', mv: 0, h: -1, ht: 0, bf: null, gs: 0 })), coins: [], cid: 1, pin: { hp: 8, re: 0, sw: -9 }, castle: 0, castleRe: 0, band: 0, pend: 0, chal: null, cd: 0, uid: 1, pinBy: null, castleBy: null, lastWin: null, spawnT: 0 };
  S.fzOwn = FZ.owned();
  bot.length = 0; met.clear();
  for (let a = 0; a < W.AREAS.length; a++) for (let k = 0; k < (a === 0 ? 14 : 10); k++) spawnCoin(S.fz, a);
  C.msg('\u00a1Bienvenidos a la Fiesta!', 'Explore the Fiesta Isles: chat, eat, dance, smash pi\u00f1atas and challenge friends!', '#ff4fd8');
  C.setPhase('roam', 0);
};
const met = new Map();
function spawnCoin(F, a) {
  const A = area(a);
  for (let tries = 0; tries < 12; tries++) {
    let x, z; if (a === 0) { const ang = Math.random() * TAU, rr = Math.sqrt(Math.random()) * 0.92; x = Math.cos(ang) * rr * 26; z = Math.sin(ang) * rr * 21; } else { x = GP.rand(-14.5, 14.5); z = GP.rand(a === 3 ? -6.5 : -12, 12.5); }
    if (A.col.some((c) => Math.hypot(c.x - x, c.z - z) < c.r + 0.8)) continue;
    F.coins.push([F.cid++, a, +x.toFixed(2), +z.toFixed(2), Math.random() < 0.1 ? 5 : 1]); return;
  }
}
function npcById(id) { return NPCS.find((n) => n.id === id); }
FZ.hostStep = function (dt) {
  const S = C.S_(), F = S.fz; if (!F) return;
  F.t += dt;
  const me = C.GS.me;
  if (me >= 0 && FZ.me && !C.isBot(me)) { const p = F.p[me]; p.a = FZ.me.a; p.x = +FZ.me.x.toFixed(2); p.z = +FZ.me.z.toFixed(2); p.r = +FZ.me.r.toFixed(2); p.em = FZ.me.em; p.mv = FZ.me.mv ? 1 : 0; p.gs = save().champ ? 1 : 0; }
  S.pl.forEach((_, i) => { if (C.isBot(i)) botStep(S, F, i, dt); });
  // coins: keep every area stocked
  F.spawnT -= dt;
  if (F.spawnT <= 0) { F.spawnT = 0.5; for (let a = 0; a < W.AREAS.length; a++) if (F.coins.filter((c) => c[1] === a).length < (a === 0 ? 14 : 10)) spawnCoin(F, a); }
  for (let k = F.coins.length - 1; k >= 0; k--) {
    const c = F.coins[k];
    for (let i = 0; i < F.p.length; i++) {
      const p = F.p[i]; if (p.a !== c[1]) continue; const bf = p.bf && p.bf.u > F.t ? p.bf.k : '';
      if (Math.hypot(p.x - c[2], p.z - c[3]) < (bf === 'magnet' ? 2.8 : 0.95)) { C.addCoins(i, c[4] * (bf === 'lucky' ? 2 : 1)); F.coins.splice(k, 1); break; }
    }
  }
  if (F.pin.re > 0) { F.pin.re -= dt; if (F.pin.re <= 0) { F.pin.re = 0; F.pin.hp = 8; } }
  if (F.castleRe > 0) { F.castleRe -= dt; if (F.castleRe <= 0) { F.castleRe = 0; F.castle = 0; } }
  if (F.cd > 0) F.cd -= dt;
  F.p.forEach((p) => { if (p.h >= 0 && p.ht < F.t) p.h = -1; if (p.bf && p.bf.u < F.t) p.bf = null; });
  if (F.pend > 0) { F.pend -= dt; if (F.pend <= 0) { F.pend = 0; C.toIntro(); } }
  C.touch();
};
function challenge(S, F, i, to) {
  if (S.phase !== 'roam' || F.pend > 0 || F.cd > 0) return false;
  let id, txt; const by = C.nm(i);
  if (typeof to === 'string') { const n = npcById(to); if (!n || n.role !== 'chal') return false; const np = npcPos(n, F.t); if (F.p[i].a !== n.a || Math.hypot(F.p[i].x - np.x, F.p[i].z - np.z) > 4) return false; id = n.chal; F.chal = { by: i, npc: n.id, vs: -1 }; txt = by + ' takes on ' + n.name + ' at ' + MGN(id) + '! Winner gets 8 coins!'; }
  else { const j = to | 0; if (j === i || !F.p[j] || F.p[j].a !== F.p[i].a || Math.hypot(F.p[i].x - F.p[j].x, F.p[i].z - F.p[j].z) > 4) return false; const el = C.eligible().filter((q) => GP.MG[q].type === 'ffa' || S.pl.length >= 3); id = GP.pick(el); F.chal = { by: i, npc: null, vs: j }; txt = by + ' challenges ' + C.nm(j) + ' to ' + MGN(id) + '!'; }
  if (!GP.MG[id]) return false;
  S.mgq = { id, solo: C.chooseSolo(id) }; F.pend = GP.FAST ? 0.8 : 2.4; C.msg('\u2694\uFE0F CHALLENGE!', txt, '#ff4fd8'); C.fx('event');
  return true;
}
FZ.afterMg = function (mgr) {
  const S = C.S_(), F = S.fz; if (!F) { C.setPhase('roam', 0); return; }
  const winners = mgr && mgr.rows ? mgr.rows.filter((r) => r.win).map((r) => r.i) : [];
  if (F.chal && F.chal.npc && winners.length) { const n = npcById(F.chal.npc); winners.forEach((w) => C.addCoins(w, 8)); C.msg(n.name + ' pays up!', winners.map(C.nm).join(' & ') + ' won ' + MGN(S.mgq ? S.mgq.id : '') + ': +8 bonus coins!', '#ffd23f'); }
  else if (winners.length) C.msg('Challenge over!', winners.map(C.nm).join(' & ') + ' won! Back to the fiesta!', '#ffd23f');
  F.lastWin = { id: ++F.uid, who: winners }; F.chal = null; F.cd = GP.FAST ? 1 : 8; S.mg = null;
  C.setPhase('roam', 0);
};
FZ.hostAct = function (i, m, pid) {
  const S = C.S_(), F = S && S.fz; if (!F || i < 0 || S.phase !== 'roam') return;
  const p = F.p[i], v = m.v || {}, A = area(p.a), near = (x, z, r) => Math.hypot(p.x - x, p.z - z) <= r;
  switch (m.k) {
    case 'fzchal': challenge(S, F, i, v.to); break;
    case 'fztalk': { const n = npcById(v.npc); if (!n || n.a !== p.a) break; const key = i + ':' + n.id; if (!met.has(key)) { met.set(key, 1); C.addCoins(i, 1); } break; }
    case 'fzeat': { const f = FOODS[v.food | 0]; if (!f || p.a !== 2 || !A.stalls.some((s) => s.k === (v.food | 0) && near(s.x, s.z, 3))) break; if (S.pl[i].coins < f.p) { C.fx('wrong', i); break; } C.addCoins(i, -f.p); p.h = v.food | 0; p.ht = F.t + 3.5; p.bf = { k: f.bf, u: F.t + 20 }; C.fx('fzeat', i); break; }
    case 'fzhit': { if (p.a !== 1 || F.pin.re > 0 || !near(A.pinSpot.x, A.pinSpot.z, 3)) break; const k = 'h' + i; if ((F[k] || -9) > F.t - 0.2) break; F[k] = F.t; F.pin.hp--; F.pin.sw = +F.t.toFixed(2); C.fx('fzhit', i);
      if (F.pin.hp <= 0) { F.pin.re = GP.FAST ? 4 : 20; for (let q = 0; q < 14; q++) { const a = q / 14 * TAU, rr = 1.4 + Math.random() * 2.2; F.coins.push([F.cid++, 1, +(10.5 + Math.cos(a) * rr).toFixed(2), +(4 + Math.sin(a) * rr).toFixed(2), q < 2 ? 5 : 1]); } C.addCoins(i, 3); F.pinBy = { id: ++F.uid, i }; C.fx('fzboom', i); C.msg('\u00a1PI\u00d1ATA!', C.nm(i) + ' smashed the pi\u00f1ata! Coins everywhere!', '#ff4fd8'); }
      break; }
    case 'fzdance': { const sc = clamp(+v.score || 0, 0, 100), n = Math.min(11, Math.round(sc / 9)); if (n) C.addCoins(i, n); C.msg('\uD83D\uDC83 ' + C.nm(i) + ' danced!', 'Rank ' + rank(sc) + ' \u00b7 +' + n + ' coins', '#3ff0ff'); break; }
    case 'fzwish': { const fpt = A.fount || A.viejoFount; if (!fpt || !near(fpt.x, fpt.z, 4.2) || S.pl[i].coins < 1) break; C.addCoins(i, -1); if (Math.random() < 0.35) { C.addCoins(i, 6); C.fx('coins', i); C.msg('Wish granted!', 'The fountain blesses ' + C.nm(i) + ' with +6 coins!', '#3ff0ff'); } else C.fx('splash', i); break; }
    case 'fzbell': { if (p.a !== 4) break; C.addCoins(i, 2); C.fx('star', i); C.msg('🔔 Gran Pueblo Viejo Bell!', C.nm(i) + ' rang the Cathedral Clocktower Bell! +2 fiesta coins!', '#ffd23f'); break; }
    case 'fzshop': {
      const sh = SHOPS.find((s) => s.id === v.shop);
      const it = sh && sh.items[v.item | 0];
      if (!sh || !it || S.pl[i].coins < it.p) { C.fx('wrong', i); break; }
      C.addCoins(i, -it.p);
      p.bf = { k: it.bf, u: F.t + 25 };
      C.fx('fzeat', i);
      C.msg(sh.icon + ' ' + sh.name, C.nm(i) + ' bought ' + it.e + ' ' + it.n + '!', '#ffd23f');
      break;
    }
    case 'fzpet': {
      const pd = PETS_DATA.find((q) => q.id === v.pet);
      if (!pd) break;
      const pkey = 'pet:' + i + ':' + pd.id;
      const bonus = !met.has(pkey) ? pd.gift : 2;
      met.set(pkey, 1);
      C.addCoins(i, bonus);
      p.bf = { k: pd.buff, u: F.t + 25 };
      C.fx('star', i);
      C.msg(pd.icon + ' ' + pd.name + ' (' + pd.title + ')', C.nm(i) + ' petted ' + pd.name + '! +' + bonus + ' coins & ' + pd.buff.toUpperCase() + ' buff!', '#4ade80');
      break;
    }
    case 'fzhazard': {
      if (p.bf && p.bf.k === 'shield' && p.bf.u > F.t) break;
      const loss = Math.min(S.pl[i].coins, 3);
      if (loss > 0) C.addCoins(i, -loss);
      C.fx('wrong', i);
      break;
    }
    case 'fzbailout': {
      const grant = S.pl[i].coins < 12 ? (12 - S.pl[i].coins) : 5;
      C.addCoins(i, grant);
      p.bf = { k: 'shield', u: F.t + 30 };
      C.fx('star', i);
      C.msg('🛟 Ratita × Tortuga Emergency Bailout!', 'Candy & Torty restored ' + C.nm(i) + ' to 100% Stamina, Shield & +' + grant + ' coins for FREE (0 coins)!', '#4ade80');
      break;
    }
    case 'fzband': { if (p.a !== 1 || F.band > F.t) break; F.band = F.t + 24; C.msg('\uD83C\uDFBA Mariachi time!', C.nm(i) + ' requested a song from Mariachi Grok!', '#ffd23f'); break; }
    case 'fzbuild': { if (p.a !== 3 || F.castleRe > 0 || !near(A.castle.x, A.castle.z, 3)) break; const k = 'b' + i; if ((F[k] || -9) > F.t - 0.2) break; F[k] = F.t; F.castle++; C.fx('pop', i);
      if (F.castle >= 6) { F.castleRe = GP.FAST ? 4 : 25; C.addCoins(i, 4); F.castleBy = { id: ++F.uid, i }; C.fx('star', -1); C.msg('\uD83C\uDFF0 Sandcastle complete!', C.nm(i) + ' put the flag on top! +4 coins', '#ffd23f'); }
      break; }
  }
};
function rank(sc) { return sc >= 90 ? 'S' : sc >= 75 ? 'A' : sc >= 55 ? 'B' : 'C'; }
FZ.rank = rank;
FZ.onPos = function (from, d) {
  const S = C.S_(), F = S && S.fz; if (!F) return; const i = C.seatOf(from); if (i < 0 || C.isBot(i)) return;
  const p = F.p[i], a = clamp(d.a | 0, 0, W.AREAS.length - 1), q = { x: +d.x || 0, z: +d.z || 0 }; bounds(a, q);
  p.a = a; p.x = +q.x.toFixed(2); p.z = +q.z.toFixed(2); p.r = +(+d.r || 0).toFixed(2); p.em = EMOTES[d.em] || ['sit', 'nap', 'hit', 'build', 'eat'].includes(d.em) ? d.em : ''; p.mv = d.mv ? 1 : 0; p.bz = d.bz ? 1 : 0; p.gs = d.gs ? 1 : 0;
};
// --- CPU pals: wander, chase coins, eat, dance, whack pinatas, travel between towns, sometimes challenge you
function botStep(S, F, i, dt) {
  const p = F.p[i], m = bot[i] || (bot[i] = { goal: null, wait: GP.rand(0.5, 2), act: '', chalT: GP.rand(60, 120) }), A = area(p.a);
  m.chalT -= dt;
  if (m.wait > 0) {
    m.wait -= dt; p.mv = 0;
    if (m.act === 'pin' && F.pin.re <= 0 && Math.random() < dt * 2.2) FZ.hostAct(i, { k: 'fzhit' });
    if (m.act === 'build' && Math.random() < dt * 1.6) FZ.hostAct(i, { k: 'fzbuild' });
    if (m.wait <= 0) { p.em = ''; m.act = ''; }
    return;
  }
  if (!m.goal) {
    // nearby coin?
    const cs = F.coins.filter((c) => c[1] === p.a && Math.hypot(c[2] - p.x, c[3] - p.z) < 7);
    const humans = S.pl.map((_, j) => j).filter((j) => !C.isBot(j) && F.p[j].a === p.a && !F.p[j].bz);
    const r = Math.random();
    if (m.chalT <= 0 && humans.length && F.cd <= 0) { const j = humans[0]; m.goal = { x: F.p[j].x, z: F.p[j].z, act: 'chal', to: j }; m.chalT = GP.rand(110, 170); }
    else if (cs.length && r < 0.55) { const c = cs[0]; m.goal = { x: c[2], z: c[3], act: '' }; }
    else if (r < 0.75 && A.spots.length) { const s = GP.pick(A.spots.filter((q) => q.k !== 'bus')) || A.spots[0]; m.goal = { x: s.x + GP.rand(-0.6, 0.6), z: s.z + GP.rand(-0.6, 0.6), act: s.k, spot: s }; }
    else if (r < 0.88) { const to = p.a === 0 ? GP.randi(1, W.AREAS.length - 1) : 0; const g = p.a === 0 ? W.GATES[to] : W.EXIT; m.goal = { x: g[0], z: g[1] + (p.a === 0 ? 0 : 0.5), act: 'gate', to }; }
    else { const q = { x: p.x + GP.rand(-8, 8), z: p.z + GP.rand(-8, 8) }; bounds(p.a, q); m.goal = { x: q.x, z: q.z, act: '' }; }
    m.giveUp = 9;
  }
  const g = m.goal; if (g.act === 'chal' && F.p[g.to]) { g.x = F.p[g.to].x; g.z = F.p[g.to].z; }
  const dx = g.x - p.x, dz = g.z - p.z, d = Math.hypot(dx, dz); m.giveUp -= dt;
  const reach = g.act === 'chal' ? 2.2 : g.act === 'gate' ? 1.2 : 0.5;
  if (d < reach || m.giveUp <= 0) {
    m.goal = null; p.mv = 0;
    if (m.giveUp <= 0) return;
    const act = g.act;
    if (act === 'gate') { if (p.a === 0) { p.a = g.to; p.x = 0; p.z = 11; } else { const gp = W.GATES[p.a]; p.a = 0; p.x = gp[0] * 0.82; p.z = gp[1] * 0.82 + (gp[1] < 0 ? 0 : 1.5); } m.wait = 0.4; return; }
    if (act === 'chal') { if (!F.p[g.to].bz) challenge(S, F, i, g.to); m.wait = 1; return; }
    if (act === 'dance') { p.em = 'dance'; m.wait = GP.rand(5, 9); return; }
    if (act === 'eat') { FZ.hostAct(i, { k: 'fzeat', v: { food: g.spot.food } }); p.em = 'eat'; m.wait = 3; return; }
    if (act === 'pin') { p.em = 'hit'; m.act = 'pin'; m.wait = GP.rand(3, 5); return; }
    if (act === 'nap') { p.x = g.spot.h.hx; p.z = g.spot.h.hz; p.em = 'nap'; m.wait = GP.rand(5, 8); return; }
    if (act === 'sit') { p.z = g.spot.z - 0.55; p.em = 'sit'; p.r = Math.PI; m.wait = GP.rand(4, 7); return; }
    if (act === 'build') { p.em = 'build'; m.act = 'build'; m.wait = GP.rand(3, 5); return; }
    if (act === 'wish') { FZ.hostAct(i, { k: 'fzwish' }); p.em = 'wave'; m.wait = 1.5; return; }
    if (act === 'band') { FZ.hostAct(i, { k: 'fzband' }); p.em = 'dance'; m.wait = 4; return; }
    p.em = Math.random() < 0.25 ? GP.pick(['wave', 'laugh', 'flip']) : ''; m.wait = GP.rand(0.6, 2.5); return;
  }
  const sp = 4.6 * (p.bf && p.bf.k === 'speed' && p.bf.u > F.t ? 1.4 : 1);
  const q = { x: p.x + dx / d * sp * dt, z: p.z + dz / d * sp * dt }; bounds(p.a, q);
  if (g.act === 'gate') { q.x = p.x + dx / d * sp * dt; q.z = p.z + dz / d * sp * dt; }
  p.x = +q.x.toFixed(2); p.z = +q.z.toFixed(2); p.r = +Math.atan2(dx, dz).toFixed(2); p.mv = 1; p.em = '';
}

/* ======================================================================
   LOCAL PLAYER (movement, interactions, stamps)
   ====================================================================== */
FZ.me = null; let meGid = -1, ctx = null, sendT = 0, bub = null, panel = '', fade = 0, fadeTo = null, fxSeen = 0, seen = { pin: 0, castle: 0, win: 0, msg: 0 }, bannerT = 0, emSeen = new Set();
function myP(S) { return S && S.fz && C.GS.me >= 0 ? S.fz.p[C.GS.me] : null; }
function syncMe(S) {
  const p = myP(S); if (!p) { FZ.me = null; return; }
  if (!FZ.me || meGid !== S.gid) { FZ.me = { a: p.a, x: p.x, z: p.z, r: p.r, em: '', emT: 0, mv: false }; meGid = S.gid; fxSeen = S.fxId; seen = { pin: S.fz.pinBy ? S.fz.pinBy.id : 0, castle: S.fz.castleBy ? S.fz.castleBy.id : 0, win: S.fz.lastWin ? S.fz.lastWin.id : 0, msg: S.msg ? S.msg.id : 0 }; visit(p.a); }
  if (C.isBot(C.GS.me)) { const m = FZ.me; if (m.a !== p.a) visit(p.a); m.a = p.a; m.x = p.x; m.z = p.z; m.r = p.r; m.em = p.em; m.mv = !!p.mv; }
}
function busy() { return !!panel || !!dance || fade > 0; }
function myBuff(S) { const p = myP(S); return p && p.bf && p.bf.u > S.fz.t ? p.bf.k : ''; }
function moveMe(S, dt) {
  const m = FZ.me; if (!m || C.isBot(C.GS.me)) return;
  m.emT += dt;
  if (m.em && m.emT > emHold) m.em = '';
  if (busy() || S.fz.pend > 0) { m.mv = false; return; }
  const inp = C.localInput(); const len = Math.hypot(inp.jx, inp.jz);
  if (len > 0.15) {
    const sp = 6 * (myBuff(S) === 'speed' ? 1.4 : 1) * Math.min(1, len);
    const q = { x: m.x + inp.jx / Math.max(1, len) * sp * dt, z: m.z + inp.jz / Math.max(1, len) * sp * dt };
    bounds(m.a, q); m.x = q.x; m.z = q.z; m.r = GP.angLerp(m.r, Math.atan2(inp.jx, inp.jz), GP.damp(14, dt)); m.mv = true;
    if (m.em) m.em = '';
  } else m.mv = false;
  // Check patrolling Fiesta Hazards (Runaway Spicy Chili Carts & Pinching Crabs)
  const A = area(m.a);
  if (A.hazards && (!m.hazCd || m.hazCd < S.fz.t)) {
    for (const h of A.hazards) {
      if (Math.hypot(m.x - h.x, m.z - h.z) < 1.15) {
        m.hazCd = S.fz.t + 2.6;
        if (myBuff(S) === 'shield') {
          floatMe('🛡️ TORTUGA SHIELD BLOCKED!', '#4ade80');
          GP.Snd.fx('right');
        } else {
          const s = save();
          s.hp = Math.max(0, (s.hp || 100) - 25);
          GP.persist();
          act('fzhazard', { name: h.name });
          floatMe('🌶️ OUCH! -25% Stamina · -3 🪙', '#ff4d6d');
          say('me', 'Ouch! Hit by ' + h.name + '! (-25% Stamina, -3 coins). Use Torty & Candy Bailout if low!', 3600);
          if (s.hp <= 0) {
            setTimeout(() => { if (!panel) openPanel('pets'); }, 400);
          }
        }
        break;
      }
    }
  }
  // walk through a gate -> travel
  if (m.a === 0) { for (const k in W.GATES) { const g = W.GATES[k]; if (Math.hypot(m.x - g[0], m.z - g[1]) < 1.6) { travel(+k, 0, 11); break; } } }
  else if (m.z > 13.4 && Math.abs(m.x) < 2.6) { const g = W.GATES[m.a]; travel(0, g[0] * 0.82, g[1] * 0.82 + (g[1] < 0 ? 0 : -1.5)); }
}
function travel(a, x, z, bus) {
  if (fade > 0) return; fade = 1; fadeTo = { a, x, z }; GP.Snd.fx(bus ? 'fzbus' : 'whoosh');
  const f = $('fzFade'); f.querySelector('b').textContent = (bus ? '\uD83D\uDE8C ' : '') + W.AREAS[a].name; f.classList.add('on');
}
function visit(a) { const s = save(); if (a > 0 && !s.towns.includes(a)) { s.towns.push(a); GP.persist(); if (s.towns.length >= 3) stamp('towns'); } }
function stamp(id) {
  const s = save(); if (s.st[id]) return; s.st[id] = Date.now(); GP.persist();
  const d = STAMPS.find((q) => q[0] === id); GP.Snd.fx('fzstamp'); C.toast('\uD83D\uDCD2 Passport stamp: ' + d[1] + ' ' + d[2] + '! (' + Object.keys(s.st).length + '/10)');
  if (Object.keys(s.st).length >= STAMPS.length && !s.champ) { s.champ = true; GP.persist(); setTimeout(() => C.toast('\uD83C\uDF1F ALL 10 STAMPS! You earned the GOLDEN SOMBRERO!'), 900); }
}
FZ.stamp = stamp;
function nearest(S) {
  const m = FZ.me; if (!m) return null; let best = null, bd = 1e9;
  const consider = (o, d) => { if (d < bd) { bd = d; best = o; } };
  NPCS.forEach((n) => { if (n.a !== m.a) return; const p = npcPos(n, ft); const d = Math.hypot(p.x - m.x, p.z - m.z); if (d < 2.3) consider({ k: 'talk', npc: n }, d - 0.3); });
  area(m.a).spots.forEach((s) => { const d = Math.hypot(s.x - m.x, s.z - m.z); if (d < s.r) consider(Object.assign({}, s), d); });
  S.fz.p.forEach((p, j) => { if (j === C.GS.me || p.a !== m.a) return; const d = Math.hypot(p.x - m.x, p.z - m.z); if (d < 2.2) consider({ k: 'chal', seat: j }, d + 2.6); });
  return best;
}
const LABEL = { talk: 'TALK', bus: 'BUS', dance: 'DANCE!', pin: 'WHACK!', wish: 'WISH', band: 'SONG!', eat: 'EAT', sit: 'SIT', nap: 'NAP', build: 'BUILD', chal: 'CHALLENGE', shop: 'SHOP 🏪', pet: 'PET 🐾', bell: 'RING 🔔' };
function act(k, v) { C.doAct({ k, v }); }
function say(who, text, t) { bub = { who, text, until: performance.now() + (t || 3800) }; }
const FORTUNES = ['You will find a big coin very soon!', 'A pi\u00f1ata is in your future...', 'Your dance moves will amaze everyone!', 'Tacos bring good luck. Eat more tacos.', 'A friend will challenge you. You will WIN!', 'The stars say: FIESTA!'];
function pressA() {
  const S = C.S_(); if (!S || S.phase !== 'roam' || !FZ.me || busy()) return; const m = FZ.me;
  const c = ctx; if (!c) { setEm('wave'); return; }
  if (c.k === 'talk') {
    const n = c.npc, s = save(); n._l = ((n._l === undefined ? -1 : n._l) + 1) % n.lines.length; say(n.id, n.lines[n._l]); GP.Snd.fx('fztalk'); act('fztalk', { npc: n.id });
    if (!s.talk.includes(n.id)) { s.talk.push(n.id); GP.persist(); if (s.talk.length >= 6) stamp('talk'); }
    if (n.role === 'bus') openPanel('bus'); else if (n.role === 'food') openPanel('food', n.food); else if (n.role === 'shop') openPanel('shop', n.shop); else if (n.role === 'dj') openPanel('dance'); else if (n.role === 'band') act('fzband'); else if (n.role === 'chal') openPanel('chal', n.id); else if (n.role === 'castle') act('fzbuild');
    return;
  }
  if (c.k === 'bus') openPanel('bus');
  else if (c.k === 'dance') openPanel('dance');
  else if (c.k === 'pin') { act('fzhit'); setEm('hit', 0.45); }
  else if (c.k === 'wish') { act('fzwish'); say('me', '\u2728 ' + GP.pick(FORTUNES)); }
  else if (c.k === 'band') act('fzband');
  else if (c.k === 'eat') openPanel('food', c.food);
  else if (c.k === 'sit') { m.x = c.x; m.z = c.z - 0.55; m.r = Math.PI; setEm('sit', 99); }
  else if (c.k === 'nap') { m.x = c.h.hx; m.z = c.h.hz; m.r = 0; setEm('nap', 99); napT = 0; }
  else if (c.k === 'build') { act('fzbuild'); setEm('build', 0.5); }
  else if (c.k === 'chal') openPanel('pchal', c.seat);
  else if (c.k === 'shop') openPanel('shop', c.shop);
  else if (c.k === 'pet') openPanel('pets', c.pet);
  else if (c.k === 'bell') { act('fzbell'); setEm('wave', 1.2); }
}
FZ.pressA = pressA;
let napT = 0, emHold = 0;
function setEm(k, dur) {
  const m = FZ.me; if (!m) return; m.em = k; m.emT = 0; emHold = dur || (EMOTES[k] ? EMOTES[k][1] : 1);
  if (EMOTES[k]) { const s = save(); if (!s.em.includes(k)) { s.em.push(k); GP.persist(); if (s.em.length >= 4) stamp('fool'); } }
}
FZ.emote = setEm;

/* ---------- panels (bus, food, dance, challenge) ---------- */
function openPanel(k, v) {
  const S = C.S_(); panel = k; let h = '';
  if (k === 'bus') { h = '<h2>\uD83D\uDE8C Fiesta Bus</h2><p>Free rides to every town!</p><div class="fzGrid">' + W.AREAS.map((A, a) => '<button class="btn' + (FZ.me.a === a ? ' alt' : ' blue') + '" data-fz="go" data-v="' + a + '"' + (FZ.me.a === a ? ' disabled' : '') + '>' + A.icon + ' ' + esc(A.name) + '</button>').join('') + '</div>'; }
  else if (k === 'food') { const f = FOODS[v], coins = S.pl[C.GS.me].coins; h = '<h2>' + f.e + ' ' + esc(f.n) + '</h2><div class="fzFood">' + f.e + '</div><p>' + esc(f.d) + '</p><p><b>' + f.p + ' coins</b> \u00b7 you have ' + coins + '</p><button class="btn primary" data-fz="eat" data-v="' + v + '"' + (coins < f.p ? ' disabled' : '') + '>' + (coins < f.p ? 'Not enough coins' : '\u00a1BUY & EAT!') + '</button>'; }
  else if (k === 'dance') { h = '<h2>\uD83D\uDC83 Dance Floor</h2><p>Arrows fall from the top. Tap the matching pad (or press \u2190 \u2191 \u2193 \u2192 / D F J K) right when they hit the line!</p><p>Rank S = 11 coins!</p><button class="btn primary" data-fz="dance">LET\'S DANCE!</button>'; }
  else if (k === 'chal') { const n = npcById(v), cd = S.fz.cd > 0; h = '<h2>\u2694\uFE0F ' + esc(n.name) + '</h2><p>"' + esc(n.lines[0]) + '"</p><p>Mini game: <b>' + esc(MGN(n.chal)) + '</b> \u00b7 everyone at the fiesta plays \u00b7 winner gets +8 coins</p><button class="btn primary" data-fz="chal" data-v="' + n.id + '"' + (cd ? ' disabled' : '') + '>' + (cd ? 'Catch your breath\u2026' : 'CHALLENGE!') + '</button>'; }
  else if (k === 'pchal') { const p = S.pl[v]; h = '<h2>\u2694\uFE0F Challenge ' + esc(p.name) + '?</h2><p>A random mini game for everyone at the fiesta. Winner gets 10 coins!</p><button class="btn primary" data-fz="pchal" data-v="' + v + '"' + (S.fz.cd > 0 ? ' disabled' : '') + '>CHALLENGE!</button>'; }
  else if (k === 'shop') {
    const sh = SHOPS.find((s) => s.id === v) || SHOPS[0], coins = S.pl[C.GS.me].coins, s = save();
    h = '<h2>' + sh.icon + ' ' + esc(sh.name) + '</h2><p><b>' + esc(sh.keeper) + ':</b> "' + esc(sh.desc) + '"</p><p>You have <b>🪙 ' + coins + ' coins</b> · Stamina <b>❤️ ' + (s.hp || 100) + '%</b></p><div class="fzShopItems">' +
      sh.items.map((it, idx) => '<div class="fzShopItem"><div><b>' + it.e + ' ' + esc(it.n) + '</b> <span class="fzPrice">🪙 ' + it.p + '</span><br><small>' + esc(it.d) + '</small></div>' +
      '<button class="btn primary small" data-fz="buyitem" data-shop="' + sh.id + '" data-item="' + idx + '"' + (coins < it.p ? ' disabled' : '') + '>' + (coins < it.p ? 'Need ' + it.p + ' 🪙' : 'BUY (' + it.p + ' 🪙)') + '</button></div>').join('') +
      '</div><div class="row" style="margin-top:8px"><button class="btn blue small" data-fz="shops">🏪 All 14 Stone Shops</button>' +
      (coins < 4 || (s.hp || 100) < 100 ? '<button class="btn primary small" data-fz="bailout">🛟 Free Bailout (0 🪙)</button>' : '') + '</div>';
  }
  else if (k === 'shops') {
    const coins = S.pl[C.GS.me].coins;
    h = '<h2>🏪 Grand Cobblestone Shops (' + SHOPS.length + ' Shops)</h2><p>Explore stone shops across <b>Gran Pueblo Viejo</b> & the Fiesta Isles, or teleport straight to any shop door! (🪙 ' + coins + ' coins)</p><div class="fzShopDir">' +
      SHOPS.map((sh) => '<div class="fzShopCard"><div><b>' + sh.icon + ' ' + esc(sh.name) + '</b> <small>(' + esc(W.AREAS[sh.a].name) + ')</small><br><small>' + esc(sh.desc) + '</small></div>' +
      '<div class="fzShopBtns"><button class="btn primary small" data-fz="openshop" data-v="' + sh.id + '">Shop</button><button class="btn blue small" data-fz="tpshop" data-v="' + sh.id + '">Visit</button></div></div>').join('') + '</div>';
  }
  else if (k === 'pets') {
    const s = save(), coins = S.pl[C.GS.me].coins;
    h = '<h2>🐾 All 5 Fiesta Pets & Emergency Bailout</h2><p>Pet <b>Luna</b>, <b>Pi-rat</b>, <b>Snowie</b>, <b>Candy</b> & <b>Torty</b> for free coins, Stamina & shields! Hit by a Spicy Chili Cart or Crab? Claim Candy & Torty’s <b>Free Emergency Bailout (0 🪙)</b> so you’re never stuck!</p>' +
      '<div class="fzBailBanner"><div><b>❤️ Stamina: ' + (s.hp || 100) + '%</b> · <b>🪙 Coins: ' + coins + '</b><br><small>Ratita Industries × Tortuga Tech Safety Guarantee: Never stuck at 0 coins or 0% Stamina!</small></div>' +
      '<button class="btn primary small" data-fz="bailout">🛟 FREE BAILOUT (0 🪙)</button></div>' +
      '<div class="fzShopDir">' + PETS_DATA.map((pd) => '<div class="fzShopCard' + (v === pd.id ? ' hi' : '') + '"><div><b>' + pd.icon + ' ' + esc(pd.name) + '</b> <small>· ' + esc(pd.title) + '</small><br><small>' + esc(pd.desc) + '</small></div>' +
      '<button class="btn blue small" data-fz="petact" data-v="' + pd.id + '">🐾 Pet (+' + pd.gift + ' 🪙)</button></div>').join('') + '</div>';
  }
  else if (k === 'pass') { const s = save(); h = '<h2>\uD83D\uDCD2 Fiesta Passport</h2><p>' + Object.keys(s.st).length + '/10 stamps' + (s.champ ? ' \u00b7 \uD83C\uDF1F GOLDEN SOMBRERO unlocked!' : ' \u00b7 collect all 10 for the Golden Sombrero') + '</p><div class="fzStamps">' + STAMPS.map((q) => '<div class="fzSt' + (s.st[q[0]] ? ' got' : '') + '"><i>' + q[1] + '</i><b>' + esc(q[2]) + '</b><small>' + esc(q[3]) + '</small></div>').join('') + '</div>'; }
  $('fzCard').innerHTML = h + '<button class="btn alt small" data-fz="close">' + (k === 'pass' || k === 'shops' || k === 'pets' ? 'CLOSE' : 'MAYBE LATER') + '</button>'; $('fzPanel').classList.remove('hidden');
}
function closePanel() { panel = ''; $('fzPanel').classList.add('hidden'); }
FZ.openPanel = openPanel; FZ.closePanel = closePanel;
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-fz]'); if (!b || b.disabled) return; GP.Snd.init(); GP.Snd.fx('click');
  const k = b.dataset.fz, v = b.dataset.v;
  if (k === 'close') closePanel();
  else if (k === 'go') { closePanel(); const a = +v, sp = W.AREAS[a].spawn; travel(a, a === 0 ? 4 : 7, a === 0 ? 6.5 : 9.5, true); void sp; }
  else if (k === 'eat') { closePanel(); act('fzeat', { food: +v }); setEm('eat', 3); const s = save(); if (!s.foods.includes(+v)) { s.foods.push(+v); GP.persist(); if (s.foods.length >= 3) stamp('eat'); } }
  else if (k === 'dance') { closePanel(); startDance(); }
  else if (k === 'chal') { closePanel(); act('fzchal', { to: v }); }
  else if (k === 'pchal') { closePanel(); act('fzchal', { to: +v }); }
  else if (k === 'pass') { if (panel === 'pass') closePanel(); else openPanel('pass'); }
  else if (k === 'busbtn') { if (panel === 'bus') closePanel(); else openPanel('bus'); }
  else if (k === 'shops') { if (panel === 'shops') closePanel(); else openPanel('shops'); }
  else if (k === 'pets') { if (panel === 'pets') closePanel(); else openPanel('pets'); }
  else if (k === 'openshop') { openPanel('shop', v); }
  else if (k === 'tpshop') {
    const sh = SHOPS.find((s) => s.id === v);
    if (sh) {
      closePanel();
      const A = area(sh.a), sp = (A.spots || []).find((q) => q.k === 'shop' && q.shop === sh.id);
      travel(sh.a, sp ? sp.x : 0, sp ? sp.z + 1.2 : 8, true);
    }
  }
  else if (k === 'buyitem') {
    const shId = b.dataset.shop, idx = +b.dataset.item, sh = SHOPS.find((s) => s.id === shId), it = sh && sh.items[idx];
    if (sh && it) {
      closePanel();
      act('fzshop', { shop: shId, item: idx });
      const s = save();
      if (it.bf === 'shield') s.hp = 100; else s.hp = Math.min(100, (s.hp || 100) + 35);
      if (!s.shops.includes(shId)) s.shops.push(shId);
      if (!s.foods.includes(shId)) { s.foods.push(shId); if (s.foods.length >= 3) stamp('eat'); }
      GP.persist();
      floatMe(it.e + ' ' + it.n + '!', '#ffe14d');
    }
  }
  else if (k === 'petact') {
    const pd = PETS_DATA.find((q) => q.id === v);
    if (pd) {
      closePanel();
      act('fzpet', { pet: pd.id });
      const s = save();
      s.hp = 100;
      if (!s.pets.includes(pd.id)) s.pets.push(pd.id);
      if (!s.talk.includes('pet_' + pd.id)) { s.talk.push('pet_' + pd.id); if (s.talk.length >= 6) stamp('talk'); }
      GP.persist();
      say('me', pd.icon + ' Petted ' + pd.name + '! Stamina 100% & +' + pd.gift + ' coins!', 3600);
    }
  }
  else if (k === 'bailout') {
    closePanel();
    const s = save(); s.hp = 100; s.bailouts = (s.bailouts || 0) + 1; GP.persist();
    act('fzbailout', {});
    floatMe('🛟 FREE BAILOUT! ❤️ 100%', '#4ade80');
    say('me', '🛟 Candy & Torty Emergency Bailout! Restored 100% Stamina, Tortuga Shield & free Fiesta Coins!', 4200);
  }
  else if (k === 'em') { if (!busy()) setEm(v); }
  else if (k === 'A') pressA();
  else if (k === 'buy') window.open(FZ.ARCADE, '_blank', 'noopener');
  else if (k === 'tclose') $('fzTeaser').classList.add('hidden');
  else if (k === 'title') { if (!FZ.owned()) { FZ.teaser(); return; } C.startSolo('fiesta'); }
});
addEventListener('keydown', (e) => {
  if (e.target && e.target.tagName === 'INPUT') return;
  const S = C && C.S_(); if (!S || S.phase !== 'roam' || S.mode !== 'fiesta') return;
  if (dance) { const L = { ArrowLeft: 0, KeyD: 0, ArrowDown: 1, KeyF: 1, ArrowUp: 2, KeyJ: 2, ArrowRight: 3, KeyK: 3 }[e.code]; if (L !== undefined && !e.repeat) { e.preventDefault(); danceHit(L); } return; }
  if ((e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') && !e.repeat) { e.preventDefault(); if (panel) return; pressA(); }
  else if (/^Digit[1-4]$/.test(e.code) && !busy()) setEm(['wave', 'dance', 'flip', 'laugh'][+e.code.slice(5) - 1]);
  else if (e.code === 'Tab' || e.code === 'KeyQ') { e.preventDefault(); if (panel === 'pass') closePanel(); else if (!busy()) openPanel('pass'); }
});

/* ---------- dance floor rhythm game (local, result sent to the host) ---------- */
let dance = null;
function startDance() {
  const r = GP.rng(Math.floor(Math.random() * 1e6)), notes = []; let beat = 4;
  while (beat < 36) { notes.push({ t: beat * 0.5, l: Math.floor(r() * 4), st: 0 }); if (r() < 0.25 && beat < 35) { notes.push({ t: (beat + 0.5) * 0.5, l: Math.floor(r() * 4), st: 0 }); } beat += r() < 0.7 ? 1 : 2; }
  GP.Snd.stop(); GP.Snd.play('dance');
  dance = { t: -0.1, notes, pts: 0, max: notes.length * 3, combo: 0, best: 0, judge: '', jT: 0, done: false };
  setEm('dance', 99);
  const d = $('fzDance'); d.classList.remove('hidden');
  d.querySelector('.dlanes').innerHTML = [0, 1, 2, 3].map((l) => '<div class="dlane" data-l="' + l + '"></div>').join('');
  d.querySelector('.dpads').innerHTML = ['\u25C0', '\u25BC', '\u25B2', '\u25B6'].map((s, l) => '<button type="button" class="dpad l' + l + '" data-l="' + l + '">' + s + '</button>').join('');
}
FZ.startDance = startDance;
function danceHit(l) {
  if (!dance || dance.done) return;
  const pad = document.querySelector('#fzDance .dpad.l' + l); if (pad) { pad.classList.add('down'); setTimeout(() => pad.classList.remove('down'), 90); }
  let best = null; for (const n of dance.notes) { if (n.st || n.l !== l) continue; const d = Math.abs(n.t - dance.t); if (d < 0.22 && (!best || d < Math.abs(best.t - dance.t))) best = n; }
  if (!best) { dance.combo = 0; return; }
  const d = Math.abs(best.t - dance.t), pts = d < 0.08 ? 3 : d < 0.15 ? 2 : 1; best.st = 1; dance.pts += pts; dance.combo++; dance.best = Math.max(dance.best, dance.combo);
  dance.judge = pts === 3 ? 'PERFECT!' : pts === 2 ? 'GREAT!' : 'OK'; dance.jT = 0.6; GP.Snd.fx('pad', l);
}
FZ.danceHit = danceHit;
FZ.danceState = () => dance;
document.addEventListener('pointerdown', (e) => { const b = e.target.closest('#fzDance .dpad'); if (b) { e.preventDefault(); danceHit(+b.dataset.l); } });
function tickDance(dt, S) {
  if (!dance) return;
  if (S.phase !== 'roam') { endDance(true); return; }
  dance.t += dt; dance.jT -= dt;
  for (const n of dance.notes) if (!n.st && dance.t - n.t > 0.22) { n.st = 2; dance.combo = 0; dance.judge = 'MISS'; dance.jT = 0.5; }
  const box = document.querySelector('#fzDance .dlanes'), H = box.clientHeight || 300, TRAVEL = 1.5;
  let h = '';
  [0, 1, 2, 3].forEach((l) => {
    let s = '<div class="dline"></div>';
    dance.notes.forEach((n, k) => { if (n.l !== l || n.st === 1) return; const dtn = n.t - dance.t; if (dtn > TRAVEL || dtn < -0.3) return; const y = (1 - dtn / TRAVEL) * (H - 60); s += '<i class="dn l' + l + (n.st === 2 ? ' miss' : '') + '" style="transform:translateY(' + y.toFixed(0) + 'px)">' + ['\u25C0', '\u25BC', '\u25B2', '\u25B6'][l] + '</i>'; });
    h += '<div class="dlane">' + s + '</div>';
  });
  box.innerHTML = h;
  const pct = Math.round(dance.pts / dance.max * 100);
  $('fzDance').querySelector('.dhud').innerHTML = '<b>' + pct + '%</b> \u00b7 combo ' + dance.combo + (dance.jT > 0 ? '<em class="' + (dance.judge === 'MISS' ? 'miss' : '') + '">' + dance.judge + '</em>' : '');
  if (dance.t > dance.notes[dance.notes.length - 1].t + 1.2 && !dance.done) endDance(false);
}
function endDance(abort) {
  const d = dance; dance = null; $('fzDance').classList.add('hidden'); if (FZ.me) FZ.me.em = '';
  if (abort || !d) return;
  const S = C.S_(); let sc = Math.round(d.pts / d.max * 100); if (myBuff(S) === 'fresh') sc = Math.min(100, sc + 10);
  act('fzdance', { score: sc }); if (sc >= 75) stamp('dance');
  say('me', 'Rank ' + rank(sc) + '! ' + sc + '% \u00b7 best combo ' + d.best, 4200); GP.Snd.fx(sc >= 75 ? 'star' : 'right');
}

/* ======================================================================
   RENDER
   ====================================================================== */
let ft = 0, camP = new THREE.Vector3(), camL = new THREE.Vector3(), camInit = false, lastArea = -1;
const v3 = new THREE.Vector3();
FZ.song = () => { if (dance) return 'dance'; const S = C.S_(); return FZ.me && FZ.me.a === 1 && S && S.fz && S.fz.band > S.fz.t ? 'mariachi' : 'fiesta'; };
function buildAvatars(S) {
  const sig = S.gid + '|' + S.pl.map((p) => p.color + (GP.FF ? GP.FF.sig(GP.FF.fitOf(p)) : '')).join(',');
  if (sig === avSig) return; avSig = sig;
  avs.forEach((a) => a.h.root.parent && a.h.root.parent.remove(a.h.root)); avs = [];
  S.pl.forEach((p, i) => {
    const h = GP.buildHero(GP.colorNum(p.color), GP.FF && GP.FF.fitOf(p)); if (GP.FF) GP.FF.tag(h, i, GP.colorNum(p.color)); const tag = GP.nameTag(p.name + (p.bot ? ' (CPU)' : ''), p.color); tag.position.y = 2.35; h.root.add(tag);
    const gs = W.sombrero(0, true); gs.position.y = 0.3; gs.scale.setScalar(0.8); gs.visible = false; h.headG.add(gs);
    const food = new THREE.Group(); food.position.set(0, -0.48, 0.12); h.armR.add(food);
    const ring = new THREE.Mesh(GP.G.ring, GP.basic(GP.colorNum(p.color), { transparent: true, opacity: 0.8 })); ring.scale.setScalar(0.62); ring.position.y = 0.03; h.root.add(ring);
    avs.push({ h, tag, gs, food, foodK: -1, x: 0, z: 0, r: 0, init: false });
  });
}
FZ.render = function (S, dt, clock) {
  ensureRoot(); drew = true;
  const F = S.fz; if (Math.abs(ft - F.t) > 1) ft = F.t; else ft += dt; if (C.isClient()) ft += (F.t - ft) * GP.damp(2, dt);
  syncMe(S); if (C.MV) C.MV.yaw = 0;
  if (S.phase === 'roam') { moveMe(S, dt); tickDance(dt, S); }
  // fade travel
  if (fade > 0) { const before = fade; fade -= dt * 2.2; if (before > 0.5 && fade <= 0.5 && fadeTo && FZ.me) { Object.assign(FZ.me, fadeTo); FZ.me.em = ''; visit(fadeTo.a); camInit = false; } if (fade <= 0) { fade = 0; $('fzFade').classList.remove('on'); } }
  const me = FZ.me, myA = me ? me.a : (F.p[0] ? F.p[0].a : 0);
  if (myA !== lastArea) { lastArea = myA; areas.forEach((A, a) => { A.grp.visible = a === myA; }); const th = Object.assign({ sky: 0xffb890 }, W.AREAS[myA].theme); GP.setTheme(th); C.scene.background = null; }
  areas.forEach((A) => { A.grp.visible = A === areas[myA]; });
  if (sky) sky.position.copy(C.camera.position);
  const A = areas[myA]; A.anims.forEach((f) => f(clock));
  // pinata / castle / band state
  if (A.pin) { const ok = F.pin.re <= 0; A.pin.visible = ok; const sw = ft - F.pin.sw; A.pin.rotation.z = sw < 2 ? Math.sin(sw * 14) * 0.5 * (1 - sw / 2) : Math.sin(clock * 1.3) * 0.05; A.pin.userData.body.rotation.y = clock * 0.5; const k = 1 - F.pin.hp / 8; A.pin.userData.body.scale.setScalar(1 + k * 0.15); }
  if (A.castle) { const n = F.castleRe > 0 ? A.castle.parts.length : Math.min(A.castle.parts.length, F.castle * 2); A.castle.parts.forEach((p, k) => { p.visible = k < n; }); }
  // NPCs
  const bandOn = F.band > F.t;
  NPCS.forEach((n) => {
    const h = npcM[n.id]; if (!h || n.a !== myA) return;
    const p = npcPos(n, ft); h.root.position.set(p.x, n.y || 0, p.z);
    let face = p.r, d = me ? Math.hypot(me.x - p.x, me.z - p.z) : 99;
    if (!p.mv && d < 3.2 && n.role !== 'band' && n.role !== 'food' && n.role !== 'sit') face = Math.atan2(me.x - p.x, me.z - p.z);
    h.root.rotation.y = GP.angLerp(h.root.rotation.y, face, GP.damp(6, dt));
    const pose = p.mv ? 'run' : n.role === 'band' ? 'play' : n.role === 'dancer' ? 'dance' : n.role === 'sit' ? 'sit' : n.role === 'castle' ? 'build' : n.role === 'dj' ? 'dance' : (bub && bub.who === n.id ? 'wave' : 'idle');
    if (p.mv) { h.t += dt * (n.speed || 1.6) * 0.8; GP.poseHero(h, 'run', dt * 0.45, 2); } else W.pose(h, pose, dt * (pose === 'play' && bandOn ? 1.8 : 1));
    h.tag.visible = d < 6; if (h.mark) { h.mark.rotation.y = clock * 2; h.mark.position.y = (n.kid ? 3.3 : 2.85) + Math.sin(clock * 3) * 0.1; }
  });
  // players
  buildAvatars(S);
  F.p.forEach((p, i) => {
    const av = avs[i]; if (!av) return; const local = i === C.GS.me && me;
    const tx = local ? me.x : p.x, tz = local ? me.z : p.z, tr = local ? me.r : p.r, ta = local ? me.a : p.a, em = local ? me.em : p.em, mv = local ? me.mv : !!p.mv;
    if (!av.init || local || av.a !== ta) { av.x = tx; av.z = tz; av.r = tr; av.init = true; av.a = ta; } else { const k = GP.damp(12, dt); av.x += (tx - av.x) * k; av.z += (tz - av.z) * k; av.r = GP.angLerp(av.r, tr, k); }
    const vis = ta === myA; if (vis && av.h.root.parent !== A.grp) A.grp.add(av.h.root); if (!vis && av.h.root.parent) av.h.root.parent.remove(av.h.root);
    if (!vis) return;
    const hammock = em === 'nap' && A.hammocks ? A.hammocks.find((q) => Math.hypot(q.hx - av.x, q.hz - av.z) < 0.6) : null;
    av.h.root.position.set(av.x, hammock ? hammock.hy : 0, av.z); av.h.root.rotation.y = av.r;
    if (mv) GP.poseHero(av.h, 'run', dt, 6); else if (em) W.pose(av.h, em, dt, local ? me.emT : ft * 0.9 + i); else GP.poseHero(av.h, 'idle', dt);
    const fk = p.h >= 0 ? p.h : -1; if (fk !== av.foodK) { av.foodK = fk; av.food.clear(); if (fk >= 0) av.food.add(W.food(fk)); }
    av.gs.visible = local ? !!save().champ : !!p.gs;
    if (p.bf && p.bf.k === 'freeze' && p.bf.u > F.t) av.h.body.position.x = Math.sin(clock * 60) * 0.03;
  });
  // coins
  const live = new Set();
  F.coins.forEach((c) => { if (c[1] !== myA) return; live.add(c[0]); let m = coinM.get(c[0]); if (!m) { m = GP.buildCoin(); if (c[4] > 1) m.scale.setScalar(1.6); A.grp.add(m); coinM.set(c[0], m); } m.position.set(c[2], 0.7 + Math.sin(clock * 3 + c[0]) * 0.12, c[3]); m.rotation.y = clock * 3 + c[0]; });
  coinM.forEach((m, id) => { if (!live.has(id) || m.parent !== A.grp) { if (m.parent) m.parent.remove(m); coinM.delete(id); } });
  // fx events for me: coin gains, pinata/castle/win stamps
  S.fx.forEach((e) => {
    if (e.id <= fxSeen) return; fxSeen = e.id;
    if (e.k === 'coin' && e.i === C.GS.me && e.n > 0 && S.phase === 'roam') { const s = save(); s.coins += e.n; if (s.coins >= 40) stamp('coins'); floatMe('+' + e.n, '#ffe14d'); if (e.n === 1 || e.n === 2 || e.n === 5 || e.n === 10) GP.Snd.fx('coin'); }
    if (e.k === 'coin' && e.i === C.GS.me && e.n < 0 && S.phase === 'roam') floatMe(String(e.n), '#ff6b86');
    if (e.k === 'fzboom' && A.pin) burst(A.pin.position.x, A.pin.position.y, A.pin.position.z, 40);
    if (e.k === 'fzeat' && e.i === C.GS.me) floatMe('\uD83D\uDE0B ' + FOODS[p0(S).h >= 0 ? p0(S).h : 0].e, '#fff');
  });
  if (F.pinBy && F.pinBy.id > seen.pin) { seen.pin = F.pinBy.id; if (F.pinBy.i === C.GS.me) stamp('pinata'); }
  if (F.castleBy && F.castleBy.id > seen.castle) { seen.castle = F.castleBy.id; if (me && me.a === 3 && Math.hypot(me.x - A.castle.x, me.z - A.castle.z) < 5) stamp('castle'); burst(-2, 3, -4, 24); }
  if (F.lastWin && F.lastWin.id > seen.win) { seen.win = F.lastWin.id; if (F.lastWin.who.includes(C.GS.me)) stamp('win'); }
  if (me && me.em === 'nap') { napT += dt; if (napT > 3) stamp('nap'); }
  tickConf(dt);
  // camera
  const asp = innerWidth / innerHeight, port = asp < 1, fx0 = me ? me.x : (avs[0] ? avs[0].x : 0), fz0 = me ? me.z : (avs[0] ? avs[0].z : 0);
  camL.set(fx0, 1.1, fz0 - (port ? 1 : 0.5)); const want = v3.set(fx0, port ? 13 : 8.5, fz0 + (port ? 15 : 11));
  if (!camInit) { camP.copy(want); camInit = true; } else camP.lerp(want, GP.damp(6, dt));
  C.camera.position.copy(camP); C.camera.lookAt(camL);
  if (GP.sun) { GP.sun.position.set(fx0 + 20, 40, fz0 + 15); GP.sun.target.position.set(fx0, 0, fz0); }
  // send my position (guests)
  if (C.isClient() && me && C.GS.room) { sendT -= dt; if (sendT <= 0) { sendT = 0.08; C.GS.room.send({ t: 'fz', a: me.a, x: +me.x.toFixed(2), z: +me.z.toFixed(2), r: +me.r.toFixed(2), em: me.em, mv: me.mv ? 1 : 0, bz: busy() ? 1 : 0, gs: save().champ ? 1 : 0 }); } }
  else if (me && C.GS.me >= 0 && S.fz.p[C.GS.me]) S.fz.p[C.GS.me].bz = busy() ? 1 : 0;
  ctx = S.phase === 'roam' ? nearest(S) : null;
  drawBubble();
};
function p0(S) { return S.fz.p[C.GS.me] || {}; }
function burst(x, y, z, n) { const A = areas[lastArea]; if (!A) return; for (let k = 0; k < n; k++) { const m = new THREE.Mesh(GP.G.box, GP.basic(W.COLORS[k % 7])); m.scale.set(0.16, 0.16, 0.04); m.position.set(x, y, z); A.grp.add(m); conf.push({ m, vx: GP.rand(-4, 4), vy: GP.rand(3, 8), vz: GP.rand(-4, 4), life: 2.2 }); } }
function tickConf(dt) { for (let k = conf.length - 1; k >= 0; k--) { const c = conf[k]; c.life -= dt; c.vy -= 12 * dt; c.m.position.x += c.vx * dt; c.m.position.y = Math.max(0.05, c.m.position.y + c.vy * dt); c.m.position.z += c.vz * dt; c.m.rotation.x += dt * 8; c.m.rotation.y += dt * 6; if (c.life <= 0) { if (c.m.parent) c.m.parent.remove(c.m); conf.splice(k, 1); } } }
function screenOf(x, y, z) { v3.set(x, y, z).project(C.camera); return { x: (v3.x * 0.5 + 0.5) * innerWidth, y: (-v3.y * 0.5 + 0.5) * innerHeight, ok: v3.z < 1 }; }
function floatMe(text, color) { const m = FZ.me; if (!m) return; const s = screenOf(m.x, 2.6, m.z); const d = document.createElement('div'); d.className = 'fl'; d.textContent = text; d.style.color = color; d.style.left = clamp(s.x, 30, innerWidth - 30) + 'px'; d.style.top = clamp(s.y, 60, innerHeight - 60) + 'px'; $('floaters').appendChild(d); setTimeout(() => d.remove(), 1400); }
function drawBubble() {
  const el = $('fzBubble');
  if (!bub || performance.now() > bub.until) { el.classList.add('hidden'); bub = bub && performance.now() > bub.until ? null : bub; return; }
  let x, y, z; if (bub.who === 'me') { if (!FZ.me) return; x = FZ.me.x; z = FZ.me.z; y = 2.9; } else { const n = npcById(bub.who); if (!n || !FZ.me || n.a !== FZ.me.a) { el.classList.add('hidden'); return; } const p = npcPos(n, ft); x = p.x; z = p.z; y = (n.y || 0) + (n.kid ? 2.4 : 2.9); }
  const s = screenOf(x, y, z); el.classList.remove('hidden');
  const name = bub.who === 'me' ? '' : '<b>' + esc(npcById(bub.who).name) + '</b>'; const html = name + esc(bub.text); if (el._h !== html) { el._h = html; el.innerHTML = html; }
  el.style.left = clamp(s.x, 120, innerWidth - 120) + 'px'; el.style.top = clamp(s.y, 80, innerHeight - 40) + 'px';
}

/* ======================================================================
   UI (hud, lobby, title, teaser, live unlock)
   ====================================================================== */
FZ.modeLabel = () => FZ.can() ? '\uD83C\uDF89 Fiesta Mode <em class="dlcTag">DLC</em>' : '\uD83C\uDF89 Fiesta Mode \uD83D\uDD12';
FZ.lobbyInfo = () => '<div class="fzLobby">' + (FZ.can() ? '<b>\uD83C\uDF89 FIESTA MODE</b> Roam the Fiesta Isles with friends + CPU pals: 3 towns, 20+ townsfolk, street food, a dance floor, pi\u00f1atas, sandcastles and mini game challenges. No turns, no rush \u2014 just party!' + (C.isClient() ? ' <i>(the host owns the Super Fiesta Expansion)</i>' : '') : '\uD83D\uDD12 Fiesta Mode is part of the <b>Super Fiesta Expansion</b>.') + '</div>';
FZ.blockSet = (m) => { if ((m.key === 'mode' || m.key === 'board') && m.val === 'fiesta' && !FZ.can()) { if (!C.isClient()) FZ.teaser(); return true; } return false; };
FZ.hostGone = (S) => { if (!S || FZ.owned()) return false; if (S.mode === 'fiesta' && S.phase !== 'lobby' || S.set && S.set.mode === 'fiesta' && S.phase === 'lobby') { setTimeout(() => C.toast('The host left. Fiesta Mode needs the Super Fiesta Expansion (Grok Arcade DLC Machine).', true), 50); return true; } return false; };
FZ.teaser = function () {
  $('fzTeaserCard').innerHTML = '<div class="fzBadge">MEGA DLC \u00b7 ' + FZ.PRICE + ' TICKETS</div><h2>\uD83C\uDF89 SUPER FIESTA EXPANSION</h2>' +
    '<p class="fzSub">A whole new world for Grok Land Party!</p><ul class="fzList">' +
    '<li>\uD83C\uDFDD\uFE0F <b>Fiesta Isles</b> \u2014 a new island world with 3 towns you can walk into: <b>Pi\u00f1ata Plaza</b>, <b>Taco Pueblo</b> and <b>Maraca Bay</b></li>' +
    '<li>\uD83C\uDF8A <b>FIESTA MODE</b> \u2014 roam freely with friends or CPU pals, ride the Fiesta Bus, collect coins</li>' +
    '<li>\uD83D\uDCAC 20+ townsfolk to hang out with (and challenge to mini games!)</li>' +
    '<li>\uD83C\uDF2E Street food with silly power-ups \u00b7 \uD83D\uDC83 a rhythm dance floor \u00b7 \uD83E\uDE85 pi\u00f1atas \u00b7 \uD83C\uDFBA a mariachi band \u00b7 \uD83D\uDE34 hammocks \u00b7 \uD83C\uDFF0 sandcastles</li>' +
    '<li>\uD83E\uDD38 Fool around: wave, dance, backflip, laugh \u00b7 \uD83D\uDCD2 a 10-stamp Fiesta Passport \u2192 Golden Sombrero</li>' +
    '<li>\uD83C\uDFB2 Bonus: the <b>Fiesta Isles</b> party board with Pi\u00f1ata Party events</li></ul>' +
    '<p class="fzHow">Get it at the <b>DLC Machine 3000</b> in the Grok Arcade. It unlocks here instantly!</p>' +
    '<div class="row"><button class="btn primary" data-fz="buy">OPEN GROK ARCADE</button><button class="btn alt" data-fz="tclose">CLOSE</button></div>';
  $('fzTeaser').classList.remove('hidden');
};
function injectDom() {
  const add = (html) => { const d = document.createElement('div'); d.innerHTML = html; while (d.firstChild) document.body.appendChild(d.firstChild); };
  add('<div id="fzHud" class="hidden"><div id="fzTop"><div id="fzArea"></div><div id="fzCoins"></div><div id="fzHp" data-fz="pets" title="Fiesta Stamina & Free Bailout">❤️ 100%</div><button type="button" id="fzTownsB" class="fzHudBtn" data-fz="busbtn">🗺️ 5 Towns</button><button type="button" id="fzShopsB" class="fzHudBtn" data-fz="shops">🏪 14 Shops</button><button type="button" id="fzPetsB" class="fzHudBtn" data-fz="pets">🐾 5 Pets</button><button type="button" id="fzPassB" data-fz="pass">\uD83D\uDCD2 0/10</button></div><div id="fzChips"></div><div id="fzBanner"><b></b><span></span></div>' +
    '<div id="fzEmotes">' + Object.keys(EMOTES).map((k) => '<button type="button" data-fz="em" data-v="' + k + '" title="' + k + '">' + EMOTES[k][0] + '</button>').join('') + '</div><button type="button" id="fzA" data-fz="A">WAVE</button><div id="fzHint"></div></div>' +
    '<div id="fzBubble" class="hidden"></div><div id="fzPanel" class="hidden"><div class="card fzCard" id="fzCard"></div></div>' +
    '<div id="fzDance" class="hidden"><div class="dhud"></div><div class="dlanes"></div><div class="dpads"></div></div><div id="fzFade"><b></b></div>' +
    '<div id="fzTeaser" class="screen top hidden"><div class="card fzTeaser" id="fzTeaserCard"></div></div>');
  const col = document.querySelector('#scrTitle .btncol');
  if (col) { const b = document.createElement('button'); b.id = 'bFiesta'; b.type = 'button'; b.className = 'btn fiesta'; b.dataset.fz = 'title'; col.insertBefore(b, $('bOnline')); }
  refreshTitle();
}
function refreshTitle() { const b = $('bFiesta'); if (!b) return; const o = FZ.owned(); b.innerHTML = '\uD83C\uDF89 FIESTA MODE ' + (o ? '<em class="dlcTag">DLC</em>' : '\uD83D\uDD12'); b.classList.toggle('locked', !o); }
FZ.refreshTitle = refreshTitle;
let lastSig = '';
FZ.ui = function (S, ph, inMg) {
  if (!C || !$('fzHud')) return;
  if (!drew) detach(); drew = false;
  if (S && !C.isClient() && !!S.fzOwn !== FZ.owned()) { S.fzOwn = FZ.owned(); C.touch(); }
  const roam = !!S && S.mode === 'fiesta' && ph === 'roam' && !!S.fz;
  document.body.classList.toggle('fzroam', roam);
  $('fzHud').classList.toggle('hidden', !roam);
  if (!roam) { if (panel) closePanel(); if (dance && (!S || ph !== 'roam')) endDance(true); if (!S) { FZ.me = null; avSig = ''; } $('fzBubble').classList.add('hidden'); if (!S || S.mode !== 'fiesta') { lastArea = -1; } return; }
  C.show('mghud', true); C.show('joyzone', !busy());
  const me = C.GS.me, F = S.fz, A = FZ.me ? FZ.me.a : 0, coins = me >= 0 ? S.pl[me].coins : 0, bf = myBuff(S), s = save();
  const hp = s.hp !== undefined ? s.hp : 100;
  const bfIcon = bf === 'shield' ? '🛡️' : bf ? ((FOODS.find((f) => f.bf === bf) || { e: '✨' }).e) : '';
  const sig = A + '|' + coins + '|' + hp + '|' + bf + '|' + Object.keys(s.st).length + '|' + S.pl.map((p) => p.coins).join(',') + '|' + (ctx ? ctx.k + (ctx.npc ? ctx.npc.id : '') + (ctx.shop || '') + (ctx.pet || '') : '');
  if (sig !== lastSig) {
    lastSig = sig;
    $('fzArea').innerHTML = W.AREAS[A].icon + ' ' + esc(W.AREAS[A].name);
    $('fzCoins').innerHTML = '\uD83E\uDE99 <b>' + coins + '</b>' + (bfIcon ? ' <em>' + bfIcon + '</em>' : '');
    if ($('fzHp')) { $('fzHp').innerHTML = (bf === 'shield' ? '🛡️ ' : '❤️ ') + '<b>' + hp + '%</b>'; $('fzHp').classList.toggle('low', hp <= 50); }
    $('fzPassB').textContent = '\uD83D\uDCD2 ' + Object.keys(s.st).length + '/10';
    $('fzChips').innerHTML = S.pl.map((p, i) => '<div class="fzChip" style="--c:' + p.color + '">' + esc(p.name) + (p.bot ? ' <small>CPU</small>' : '') + (i === me ? ' <small>YOU</small>' : '') + ' <b>' + p.coins + '</b> <span>' + W.AREAS[F.p[i] ? F.p[i].a : 0].icon + '</span></div>').join('');
    const lab = ctx ? (ctx.k === 'talk' ? (ctx.npc.role === 'chal' ? 'TALK \u2694\uFE0F' : ctx.npc.role === 'food' ? 'ORDER' : ctx.npc.role === 'shop' ? 'SHOP 🏪' : ctx.npc.role === 'bus' ? 'RIDE' : 'TALK') : LABEL[ctx.k]) : 'WAVE';
    $('fzA').textContent = lab; $('fzA').classList.toggle('ctx', !!ctx);
    const shopObj = ctx && ctx.shop ? SHOPS.find((s) => s.id === ctx.shop) : null;
    const petObj = ctx && ctx.pet ? PETS_DATA.find((p) => p.id === ctx.pet) : null;
    $('fzHint').textContent = ctx ? (ctx.k === 'talk' ? ctx.npc.name : ctx.k === 'chal' ? S.pl[ctx.seat].name : ctx.k === 'eat' ? FOODS[ctx.food].n + ' \u00b7 ' + FOODS[ctx.food].p + ' coins' : ctx.k === 'shop' && shopObj ? shopObj.icon + ' ' + shopObj.name : ctx.k === 'pet' && petObj ? petObj.icon + ' ' + petObj.name + ' (' + petObj.title + ')' : ctx.k === 'bell' ? '🔔 Ring Gran Pueblo Viejo Clocktower Bell' : '') : (GP.IS_TOUCH ? '' : 'SPACE: action · 1-4: emotes · 🏪 14 Stone Shops · 🐾 5 Pets');
  }
  // banner for new host messages
  if (S.msg && S.msg.id !== seen.msg) { seen.msg = S.msg.id; bannerT = 3.2; const b = $('fzBanner'); b.querySelector('b').textContent = S.msg.t; b.querySelector('span').textContent = S.msg.s; b.style.setProperty('--bc', S.msg.c); }
  bannerT -= 1 / 60; $('fzBanner').classList.toggle('show', bannerT > 0 || F.pend > 0);
};
function check() {
  const o = FZ.owned();
  if (o !== FZ._was) { const first = FZ._was === undefined; FZ._was = o; refreshTitle(); if (!first && o) { C && C.toast('\uD83C\uDF89 SUPER FIESTA EXPANSION unlocked! Fiesta Mode + the Fiesta Isles board are ready!'); $('fzTeaser').classList.add('hidden'); } }
}
setInterval(check, 1200); addEventListener('storage', (e) => { if (e.key === FZ.KEY) check(); });
if (document.body && $('scrTitle')) { injectDom(); check(); } else document.addEventListener('DOMContentLoaded', () => { injectDom(); check(); });
window.__fz = FZ;
FZ.debug = { tp: (a, x, z) => { if (FZ.me) Object.assign(FZ.me, { a, x, z }); visit(a); }, ctx: () => ctx && Object.assign({}, ctx, { npc: ctx.npc && ctx.npc.id }), busy, area: (a) => area(a), panel: () => panel };
})();
