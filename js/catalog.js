/* Grok Arcade - game catalog */
window.GA = window.GA || {};
GA.MAIN_GAMES = [
  { id: 'sky', name: 'Grok Sky', desc: 'Fly a voxel airliner over cities and famous places.',
    url: 'https://lizethbran13-cmyk.github.io/grok-sky/', color: '#38bdf8', color2: '#fde047' },
  { id: 'land', name: 'Grok Land', desc: 'A 3D platformer adventure across 6 worlds.',
    url: 'https://lizethbran13-cmyk.github.io/grok-land/', color: '#4ade80', color2: '#f97316' },
  { id: 'grid', name: 'Grok Grid', desc: 'F1-style racing on 6 tracks. Go for pole!',
    url: 'https://lizethbran13-cmyk.github.io/grok-grid/', color: '#f43f5e', color2: '#ffffff' },
  { id: 'voxels', name: 'Grok Voxels', desc: 'A blocky voxel shooter. Aim, blast, survive.',
    url: 'https://lizethbran13-cmyk.github.io/grok-voxels/', color: '#a855f7', color2: '#22d3ee' },
  { id: 'surfers', name: 'Grok Surfers', desc: 'An endless runner. Dodge, jump and grab coins.',
    url: 'https://lizethbran13-cmyk.github.io/grok-surfers/', color: '#fb923c', color2: '#facc15' },
  { id: 'fc', name: 'Grok FC', desc: 'Fast arcade soccer. Pass, shoot, score!',
    url: 'https://lizethbran13-cmyk.github.io/grok-fc/', color: '#22c55e', color2: '#ffffff' }
];
GA.BONUS_GAMES = [
  { id: 'snake', name: 'Grok Snake', desc: 'Swipe to steer, eat glowing fruit, grow long.', color: '#4ade80', color2: '#ff4fd8' },
  { id: 'bricks', name: 'Brick Breaker', desc: 'Drag the paddle and smash every neon brick.', color: '#3ff0ff', color2: '#ffe14d' },
  { id: 'jet', name: 'Grok Jet', desc: 'Tap to flap your jet through the neon gaps.', color: '#ffe14d', color2: '#ff4fd8' },
  { id: 'rats', name: 'Whack-a-Rat', desc: 'Boop Luna, Pi-rat & Snowie before they hide!', color: '#ff8fd0', color2: '#ffffff' },
  { id: 'stack', name: 'Stack Tower', desc: 'Tap to drop blocks and build the tallest tower.', color: '#ff7a3d', color2: '#3ff0ff' }
];
GA.allGames = function () { return GA.MAIN_GAMES.concat(GA.BONUS_GAMES); };
GA.findGame = function (id) { return GA.allGames().find(function (g) { return g.id === id; }); };
GA.isBonus = function (id) { return GA.BONUS_GAMES.some(function (g) { return g.id === id; }); };

/* persistent storage helpers (safe if storage is blocked) */
GA.store = {
  get: function (k, d) { try { var v = localStorage.getItem('grokArcade.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem('grokArcade.' + k, JSON.stringify(v)); } catch (e) {} }
};
GA.getBest = function (id) { return +GA.store.get('best.' + id, 0) || 0; };
GA.setBest = function (id, v) { GA.store.set('best.' + id, v); };
GA.getTickets = function () { return +GA.store.get('tickets', 0) || 0; };
GA.addTickets = function (n) { var t = GA.getTickets() + n; GA.store.set('tickets', t); return t; };
