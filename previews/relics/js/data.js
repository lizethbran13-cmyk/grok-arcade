// Grok Lost Relics - game data: explorers, expeditions, relics, upgrades, outfits, story.
export const HEROES = [
  { id: 'max', n: 'Max Marlowe', d: 'Fedora, leather jacket, never says "no" to a dusty map.', col: '#b8733a', skin: 0xf1c7a0, hair: 0x5a3a22 },
  { id: 'zoe', n: 'Zoe Vega', d: 'Urban explorer. Headlamp on, hoodie up, zero fear of tunnels.', col: '#14b8a6', skin: 0xc58c5c, hair: 0x1e1b2e },
  { id: 'kai', n: 'Kai Okoro', d: 'Jungle ranger who can talk to monkeys (they never listen).', col: '#65a30d', skin: 0x8a5a3c, hair: 0x221812 },
];
// expeditions, in story order. relic = the big prize at the end (guarded by Professor Vintage).
export const LEVELS = [
  { id: 'jungle', n: 'Temple of the Jade Monkey', place: 'Emerald Jungle', icon: '🌴', relic: 'jade', boss: 'chopper', col: '#22c55e', music: 'jungle',
    blurb: 'Swing over a croc river, cross the wobbly rope bridge and outrun the rolling boulder!' },
  { id: 'caves', n: 'Crystal Owl Caverns', place: 'Glimmer Caves', icon: '💎', relic: 'owl', boss: 'drill', col: '#8b5cf6', music: 'caves',
    blurb: 'Light the old braziers with your torch, dodge spike floors and shoo the bats.' },
  { id: 'tunnels', n: 'The Clockwork Subway', place: 'Old City Tunnels', icon: '🚇', relic: 'compass', boss: 'express', col: '#f59e0b', music: 'tunnels',
    blurb: 'Sneak through a forgotten subway. Switch the tracks, hide from the Relic Patrol!' },
  { id: 'pyramid', n: 'Pyramid of the Sun Scarab', place: 'Golden Dunes', icon: '🔺', relic: 'scarab', boss: 'mummy', col: '#eab308', music: 'pyramid',
    blurb: 'Aim the sun mirrors, survive the sand traps and dart walls deep inside the pyramid.' },
  { id: 'finale', n: 'Vintage\u2019s Sky Fortress', place: 'Above the clouds', icon: '🎈', relic: 'crown', boss: 'zeppelin', col: '#a855f7', music: 'finale',
    blurb: 'Professor Vintage stole them all. Board his blimp, grab the Star Crown, clear your name!' },
];
export const RELICS = {
  jade: { n: 'Jade Monkey Idol', icon: '🐒', d: 'A grinning jade monkey. Legend says it tells terrible jokes at midnight.', col: 0x34d399 },
  owl: { n: 'Crystal Owl', icon: '🦉', d: 'Glows brighter the closer you are to a secret.', col: 0xa78bfa },
  compass: { n: 'Clockwork Compass', icon: '🧭', d: 'Always points to the nearest snack. Very useful.', col: 0xfbbf24 },
  scarab: { n: 'Sun Scarab', icon: '🪲', d: 'A golden beetle that catches sunlight like a tiny mirror.', col: 0xfacc15 },
  crown: { n: 'Star Crown', icon: '👑', d: 'The crown of the ancient Star Kings. Vintage wanted it forever.', col: 0xf0abfc },
};
// small treasures: 5 per expedition, shown in the museum glass cases
export const TREASURES = {
  jungle: ['Parrot Feather Fan', 'Mossy Mask', 'Banana Bowl', 'Toucan Totem', 'Leafy Crown'],
  caves: ['Glow Mushroom Jar', 'Miner\u2019s Lucky Lamp', 'Geode Egg', 'Bat Bell', 'Echo Shell'],
  tunnels: ['Golden Token', 'Conductor\u2019s Whistle', 'Tiny Tram', 'Old Ticket Punch', 'Brass Pocket Watch'],
  pyramid: ['Cat Statue', 'Sun Disc', 'Sand Timer', 'Lotus Lamp', 'Pharaoh\u2019s Sandal'],
  finale: ['Cloud Jar', 'Propeller Hat', 'Vintage\u2019s Monocle', 'Sky Map', 'Golden Gear'],
};
// evidence: 3 per expedition. Collect them to prove Professor Vintage is the real thief.
export const EVIDENCE = {
  jungle: ['Muddy boot print (size: GIANT, with fancy buckles)', 'Torn purple tweed, smells like old perfume', 'Receipt: "1 Vine-Chopper, rented by Prof. V."'],
  caves: ['Monocle cleaning cloth with a "V" on it', 'Drill bit shopping list in curly handwriting', 'Photo: Vintage waving at a bat (the bat did not wave back)'],
  tunnels: ['Train ticket: "Vintage Express, one way, EVIL"', 'Map of the subway with "MY RELICS" circled', 'Diary page: "Dear diary, today I framed an explorer. Tee-hee."'],
  pyramid: ['Sand-covered blimp blueprint', 'Letter: "Dear Patrol, the explorer did it. Signed, NOT Vintage"', 'Mustache wax tin, engraved "Prof. V."'],
  finale: ['Vintage\u2019s master plan (with doodles)', 'Signed confession he forgot to hide', 'The real Relic Patrol arrest list'],
};
export const BOSSES = {
  chopper: { n: 'Vintage\u2019s Vine-Chopper', hp: 3, r: 2.6, h: 3.6, moves: ['lob', 'gust', 'charge', 'lob', 'gust'], proj: 0x84cc16, sig: 'gust', sp: 3.2, spawn: 'monkey' },
  drill: { n: 'The Drill-o-Matic 3000', hp: 4, r: 2.6, h: 3.8, moves: ['burrow', 'lob', 'ring', 'burrow', 'hop'], proj: 0xa78bfa, sig: 'burrow', sp: 3, spawn: 'bat' },
  express: { n: 'The Vintage Express', hp: 4, r: 2.8, h: 3.6, moves: ['rampage', 'ring', 'charge', 'lob'], proj: 0xf59e0b, sig: 'rampage', sp: 3.4, spawn: 'rat' },
  mummy: { n: 'Mecha-Mummy Vintage', hp: 5, r: 2.8, h: 4.6, moves: ['laser', 'hop', 'lob', 'laser', 'charge', 'spawn'], proj: 0xfde68a, sig: 'laser', sp: 3, spawn: 'scorpion' },
  zeppelin: { n: 'Professor Vintage (Sky Suit)', hp: 6, r: 2.6, h: 4.2, moves: ['rain', 'lob', 'hop', 'rain', 'ring', 'charge', 'spawn'], proj: 0xf0abfc, sig: 'rain', sp: 3.4, spawn: 'bat' },
};
// shop upgrades (paid in gold coins)
export const UPGRADES = [
  { id: 'hearts', n: 'Explorer Grit', icon: '❤️', max: 2, cost: [150, 320], d: '+1 max heart' },
  { id: 'whip', n: 'Long Whip', icon: '🪢', max: 2, cost: [120, 260], d: 'Whip reaches farther (swing + stun)' },
  { id: 'speed', n: 'Speedy Boots', icon: '👢', max: 2, cost: [120, 260], d: 'Run faster' },
  { id: 'jump', n: 'Spring Boots', icon: '🦘', max: 1, cost: [220], d: 'A second jump in mid-air' },
  { id: 'torch', n: 'Mega Torch', icon: '🔥', max: 2, cost: [100, 220], d: 'Torch lights up a bigger area' },
  { id: 'sneak', n: 'Sneaky Socks', icon: '🧦', max: 2, cost: [100, 220], d: 'The Relic Patrol spots you from less far away' },
];
// outfits: unlocked by relics / coins / treasures
export const OUTFITS = [
  { id: 'classic', n: 'Classic Explorer', need: 'start', hat: 'fedora', jacket: 0x8b5a2b, shirt: 0xe9d8b4, pants: 0x6b5a45, hatCol: 0x7a5230 },
  { id: 'urban', n: 'Urban Explorer', need: 'start', hat: 'beanie', jacket: 0x0f766e, shirt: 0x334155, pants: 0x1f2937, hatCol: 0xf97316 },
  { id: 'ranger', n: 'Jungle Ranger', need: 'start', hat: 'cap', jacket: 0x4d7c0f, shirt: 0xd9f99d, pants: 0x57534e, hatCol: 0x65a30d },
  { id: 'desert', n: 'Desert Scout', need: 'relic:jade', hat: 'pith', jacket: 0xe7d3a8, shirt: 0xffffff, pants: 0xb59b6a, hatCol: 0xf5e6c4 },
  { id: 'spelunker', n: 'Cave Spelunker', need: 'relic:owl', hat: 'miner', jacket: 0xf59e0b, shirt: 0x1e293b, pants: 0x374151, hatCol: 0xfacc15 },
  { id: 'conductor', n: 'Train Conductor', need: 'relic:compass', hat: 'conductor', jacket: 0x1e3a8a, shirt: 0xf8fafc, pants: 0x1e293b, hatCol: 0x1e3a8a },
  { id: 'pharaoh', n: 'Sun Pharaoh', need: 'relic:scarab', hat: 'pharaoh', jacket: 0xfafaf9, shirt: 0x0ea5e9, pants: 0xfafaf9, hatCol: 0xfacc15 },
  { id: 'detective', n: 'Detective', need: 'evidence:6', hat: 'deerstalker', jacket: 0xa16207, shirt: 0xfef3c7, pants: 0x78350f, hatCol: 0xa16207 },
  { id: 'museum', n: 'Museum Tux', need: 'coins:600', hat: 'tophat', jacket: 0x111827, shirt: 0xffffff, pants: 0x111827, hatCol: 0x111827 },
  { id: 'golden', n: 'Golden Legend', need: 'relic:crown', hat: 'fedora', jacket: 0xf5c542, shirt: 0xfff7d6, pants: 0xb8860b, hatCol: 0xf5c542, shiny: true },
];
// newspaper headlines between expeditions (the story)
export const HEADLINES = [
  { after: null, h: 'RELIC THIEF ON THE LOOSE!', s: 'Relic Patrol blames "that explorer with the whip". Prof. Vintage: "I am VERY innocent."' },
  { after: 'jungle', h: 'JADE MONKEY SAVED... BY THE SUSPECT?!', s: 'Inspector Pickles: "Suspicious! Why would a thief bring it to a museum?"' },
  { after: 'caves', h: 'CAVE CHAOS: GIANT DRILL SPOTTED', s: 'Witnesses (bats) say a man with a monocle was driving it. Patrol still chasing the explorer.' },
  { after: 'tunnels', h: 'SUBWAY SHOWDOWN! PATROL CONFUSED', s: 'Officer Waffles: "We chased the explorer AND a steam train. My legs are tired."' },
  { after: 'pyramid', h: 'EVIDENCE PILES UP AGAINST... VINTAGE?', s: 'Professor spotted loading relics into a big purple blimp. "It\u2019s a hat delivery," he claims.' },
  { after: 'finale', h: 'EXPLORER CLEARED! VINTAGE CAUGHT!', s: 'Inspector Pickles apologizes with a giant cake. Every relic is back in the museum, forever.' },
];
export function outfitUnlocked(o, S) { const [k, v] = o.need.split(':'); if (k === 'start') return true; if (k === 'relic') return !!S.relics[v]; if (k === 'evidence') return countEvidence(S) >= +v; if (k === 'coins') return (S.bestCoins || 0) >= +v || S.coinsEver >= +v; return false; }
export function countEvidence(S) { return Object.values(S.evidence).reduce((a, l) => a + (l ? l.length : 0), 0); }
export function countTreasures(S) { return Object.values(S.treasures).reduce((a, l) => a + (l ? l.length : 0), 0); }
export function levelUnlocked(i, S) { return i === 0 || !!S.done[LEVELS[i - 1].id] || S.cheat; }
