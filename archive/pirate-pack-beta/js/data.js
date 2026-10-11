// Game data: rats, levels, gadgets, upgrades, outfits.
export const RATS = [
  { id: 'luna', n: 'Luna', d: 'Silver speedster. Quick on her paws.', col: '#a9afbd' },
  { id: 'pirat', n: 'Pi-rat', d: 'One-eyed explorer. Never gives up!', col: '#c99a6b' },
  { id: 'snowie', n: 'Snowie', d: 'Snowy white with ruby eyes. Super bouncy.', col: '#fbfbff' },
];
export const LEVELS = [
  { id: 'kitchen', n: 'Countertop Caper', room: 'Kitchen', icon: '🍳', boss: 'Toastzilla', gadget: 'glider', col: '#ff8a3d' },
  { id: 'living', n: 'Couch Canyon', room: 'Living Room', icon: '🛋️', boss: 'Sucky the Robo-Vac', gadget: 'grapple', col: '#6c7bd9' },
  { id: 'vents', n: 'Air Duct Dash', room: 'Vent Tunnels', icon: '🌀', boss: 'Dust Bunny King', gadget: 'magnet', col: '#22d3ee' },
  { id: 'garden', n: 'Backyard Jungle', room: 'Garden', icon: '🌻', boss: 'Sprinkles the Sprinkler-Bot', gadget: 'jet', col: '#4caf50' },
  { id: 'garage', n: 'Grease Garage', room: 'Garage', icon: '🔧', boss: 'RC Rumbler', gadget: 'shield', col: '#94a3b8' },
  { id: 'toyroom', n: 'Blocktopia', room: 'Toy Room', icon: '🧸', boss: 'Clanky the Wind-Up Bot', gadget: 'mega', col: '#ff6fcf' },
  { id: 'attic', n: 'Attic Attack', room: 'Attic', icon: '🌙', boss: 'Clockwork Kitty', gadget: 'crown', col: '#a78bfa' },
];
export const GADGETS = {
  blaster: { n: 'Cheese Blaster', icon: '🧀', d: 'Fires gooey cheese blobs. Tap BLAST.' },
  glider: { n: 'Swoop Glider', icon: '🪁', d: 'Hold JUMP while falling to glide.' },
  grapple: { n: 'Grapple Tail', icon: '🪝', d: 'Tap HOOK near a glowing ring to zip to it.' },
  magnet: { n: 'Magnet Whiskers', icon: '🧲', d: 'Crumbs fly to you from farther away.' },
  jet: { n: 'Jet Tail', icon: '🚀', d: 'A third mid-air boost jump.' },
  shield: { n: 'Bubble Shield', icon: '🫧', d: 'Blocks one hit, then recharges.' },
  mega: { n: 'Mega Blaster', icon: '💥', d: 'Blaster shots split into three.' },
  crown: { n: 'Ratita Crown', icon: '👑', d: 'You saved the whole house!' },
};
// gadgets you have when entering level i (everything earned before it)
export function gadgetsFor(levelIdx, save) { const g = new Set(['blaster']); for (let i = 0; i < LEVELS.length; i++) if (i < levelIdx || (save && save.done[LEVELS[i].id])) g.add(LEVELS[i].gadget); return g; }
export const UPGRADES = [
  { id: 'hearts', n: 'Extra Heart', icon: '❤️', max: 2, cost: [120, 260], d: '+1 max heart' },
  { id: 'blast', n: 'Blaster Power', icon: '🧀', max: 3, cost: [80, 180, 320], d: 'Bigger, faster cheese blobs' },
  { id: 'speed', n: 'Turbo Paws', icon: '👟', max: 2, cost: [100, 220], d: 'Run faster' },
  { id: 'glide', n: 'Glider Wings+', icon: '🪁', max: 2, cost: [90, 200], d: 'Glide longer and farther' },
  { id: 'hook', n: 'Long Tail', icon: '🪝', max: 2, cost: [90, 200], d: 'Grapple from farther away' },
  { id: 'spin', n: 'Tail Twister', icon: '🌪️', max: 2, cost: [80, 180], d: 'Bigger spin attack' },
];
export const OUTFITS = [
  { id: 'none', n: 'No Hat', parts: 0 }, { id: 'hardhat', n: 'Hard Hat', parts: 3 }, { id: 'party', n: 'Party Hat', parts: 6 }, { id: 'goggles', n: 'Inventor Goggles', parts: 10 },
  { id: 'chef', n: 'Chef Hat', parts: 14 }, { id: 'flower', n: 'Flower', parts: 18 }, { id: 'pirate', n: 'Pirate Bandana', parts: 22 }, { id: 'wizard', n: 'Wizard Hat', parts: 26 }, { id: 'astro', n: 'Astro Helmet', parts: 30 }, { id: 'crown', n: 'Gold Crown', parts: 35 },
];
