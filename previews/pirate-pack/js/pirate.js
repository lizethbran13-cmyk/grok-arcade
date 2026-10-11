// Pi-rat the Pirate Pack (MEGA DLC): ownership check, campaign data, pirate save and the Dresser Shop catalog.
// Unlocked by the Grok Arcade DLC Shop: localStorage 'grokDLC.ratita.pi_rat_the_pirate_pack' (same origin as the arcade).
import { S, persist } from './save.js';
export const DLC_KEY = 'grokDLC.ratita.pi_rat_the_pirate_pack';
export function ownsPirate() {
  try { if (localStorage.getItem(DLC_KEY)) return true; const l = JSON.parse(localStorage.getItem('grokDLC.owned') || '[]'); if (Array.isArray(l) && l.indexOf(DLC_KEY) >= 0) return true; } catch (e) {}
  // Time Jumper preview / Save Vault beta builds play with the pack switched on (their saves are sandboxed by the preview shim)
  try { if (/\/(previews|archive)\//.test(location.pathname)) return true; } catch (e) {}
  return false;
}
export const CAPTAIN = 'Captain Eye Patch', PARROT = 'Grumbles';
// the islands of the Squeaky Sea. sea = position on the hub sea chart (ship units)
export const ISLES = [
  { id: 'p_cove', n: 'Cheddar Cove', icon: '🏖️', boss: 'Sir Pinchington', col: '#ffd23f', sea: [0, -300], r: 70, music: 'isle', blurb: 'A sunny beach with a sneaky treasure cave.' },
  { id: 'p_jungle', n: 'Coconut Jungle', icon: '🌴', boss: 'Coco Loco', col: '#22c55e', sea: [380, -560], r: 80, music: 'jungle', blurb: 'Vines, rope bridges and a drum temple.' },
  { id: 'p_volcano', n: 'Mount Magma', icon: '🌋', boss: 'Sizzle the Salamander', col: '#ff6a1a', sea: [-400, -720], r: 85, music: 'volcano', blurb: 'Lava rivers, steam geysers and a fiery forge.' },
  { id: 'p_lagoon', n: 'Tortuga Lagoon', icon: '🐢', boss: 'Inky the Octopus', col: '#22d3ee', sea: [300, -1000], r: 80, music: 'lagoon', blurb: 'A reef lagoon, a sunken shipwreck, and Torty!' },
  { id: 'p_skull', n: 'Skull Rock', icon: '💀', boss: 'Captain Clawbeard', col: '#a78bfa', sea: [-60, -1300], r: 90, music: 'skull', blurb: 'The fortress of the pirate cat. The Legendary Golden Cheese waits inside.', final: true },
];
export const isPirateLevel = (id) => id === 'pship' || ISLES.some((i) => i.id === id);
export const isleOf = (id) => ISLES.find((i) => i.id === id);
// pirate save lives inside the main save (S.pirate) so the arcade's cloud of keys stays tidy
export function P() { if (!S.pirate || typeof S.pirate !== 'object') S.pirate = {}; const p = S.pirate;
  p.done = p.done || {}; p.gems = p.gems || {}; p.chests = p.chests || {}; p.best = p.best || {}; p.sea = p.sea || { x: 0, z: 0, h: 0 }; p.talk = p.talk || 0; return p; }
export const mapPieces = () => ISLES.filter((i) => !i.final && P().done[i.id]).length;
export const isleOpen = (i) => { const k = ISLES.indexOf(i); return k === 0 || !!P().done[ISLES[k - 1].id] || !!S.cheat; };
export const countGems = () => Object.values(P().gems).reduce((a, l) => a + (l ? l.length : 0), 0);
export const countChests = () => Object.values(P().chests).reduce((a, l) => a + (l ? l.length : 0), 0);
// ------------------------------------------------------------------ Dresser Shop catalog (prices in cheese)
export const DRESS = {
  hat: [
    { id: 'tricorn', n: 'Pirate Tricorn', c: 0, d: 'Free with the pack. Arr!' },
    { id: 'bicorne', n: "Captain's Bicorne", c: 90, d: 'With a fancy feather' },
    { id: 'parrot', n: 'Mini Grumbles', c: 70, d: 'A tiny grumpy parrot. On your head.' },
    { id: 'beanie', n: 'Sailor Beanie', c: 30, d: 'Warm ears at sea' },
    { id: 'tophat', n: 'Top Hat', c: 60, d: 'Very proper' },
    { id: 'viking', n: 'Viking Helmet', c: 80, d: 'Horns included' },
    { id: 'sombrero', n: 'Sombrero', c: 60, d: '¡Olé!' },
    { id: 'shellcrown', n: 'Seashell Crown', c: 140, d: 'Royalty of the reef' },
  ],
  top: [
    { id: 'sash', n: 'Red Pirate Sash', c: 0, d: 'Free with the pack' },
    { id: 'stripes', n: 'Sailor Stripes', c: 40, d: 'Blue and white, classic' },
    { id: 'vest', n: 'Buccaneer Vest', c: 60, d: 'Brown leather, gold buttons' },
    { id: 'pcoat', n: 'Pirate Coat', c: 110, d: 'Long red coat with gold trim' },
    { id: 'captcoat', n: "Captain's Coat", c: 180, d: 'Navy blue, epaulettes and all' },
    { id: 'lifevest', n: 'Life Vest', c: 35, d: 'Safety first!' },
    { id: 'hoodie', n: 'Ratita Hoodie', c: 50, d: 'Pink and comfy' },
    { id: 'cape', n: 'Hero Cape', c: 70, d: 'Flaps when you run' },
    { id: 'scarf', n: 'Cozy Scarf', c: 25, d: 'Striped and snug' },
    { id: 'tutu', n: 'Sparkle Tutu', c: 55, d: 'Twirl power' },
  ],
  skin: [
    { id: 'ocean', n: 'Ocean Blue', c: 70, d: 'Fur like the deep sea' },
    { id: 'mint', n: 'Mint Chip', c: 60, d: 'Cool and fresh' },
    { id: 'bubblegum', n: 'Bubblegum', c: 60, d: 'Pink, pink, pink' },
    { id: 'midnight', n: 'Midnight', c: 100, d: 'Dark fur, starry belly' },
    { id: 'calico', n: 'Calico Patches', c: 90, d: 'Patchy like a cat (shh)' },
    { id: 'zebra', n: 'Zebra Stripes', c: 110, d: 'Stripy!' },
    { id: 'lava', n: 'Lava Rat', c: 140, d: 'Glowing magma belly' },
    { id: 'ghost', n: 'Ghost Rat', c: 140, d: 'Spooky glowing eyes' },
    { id: 'gold', n: 'Solid Gold', c: 250, d: 'Shiny treasure rat' },
    { id: 'rainbow', n: 'Rainbow', c: 300, d: 'Every colour at once' },
  ],
  acc: [
    { id: 'patch', n: 'Eye Patch', c: 0, d: 'Free. Very piratey.' },
    { id: 'hoop', n: 'Gold Earring', c: 30, d: 'Bling' },
    { id: 'shades', n: 'Cool Shades', c: 50, d: 'Too cool for school' },
    { id: 'monocle', n: 'Monocle', c: 40, d: 'Indubitably' },
    { id: 'bowtie', n: 'Bow Tie', c: 30, d: 'Dapper' },
    { id: 'lei', n: 'Flower Lei', c: 40, d: 'Aloha!' },
    { id: 'spyglass', n: 'Spyglass Strap', c: 60, d: 'Land ho!' },
  ],
};
export const DRESS_TABS = [['hat', '🎩 Hats'], ['top', '👕 Clothes'], ['skin', '🎨 Skins'], ['acc', '✨ Extras']];
export function dressSave() { if (!S.dress || typeof S.dress !== 'object') S.dress = {}; const d = S.dress; d.own = d.own || {}; d.top = d.top || 'none'; d.skin = d.skin || 'none'; d.acc = d.acc || 'none'; return d; }
export const isDressHat = (id) => DRESS.hat.some((h) => h.id === id);
export function ownsItem(slot, id) { const d = dressSave(); const it = DRESS[slot].find((q) => q.id === id); return !!it && (it.c === 0 || !!d.own[slot + '.' + id]); }
// what the local rat is wearing (only while the pack is owned)
export function myDress() { if (!ownsPirate()) return null; const d = dressSave(); return { top: d.top, skin: d.skin, acc: d.acc }; }
export function buyItem(slot, id) { const it = DRESS[slot].find((q) => q.id === id); if (!it) return 'nope'; if (ownsItem(slot, id)) return 'owned'; if (S.cheese < it.c) return 'poor'; S.cheese -= it.c; dressSave().own[slot + '.' + id] = Date.now(); persist(); return 'ok'; }
