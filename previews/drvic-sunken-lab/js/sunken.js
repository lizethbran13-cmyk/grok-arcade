// Grok Dr. Vic MEGA DLC #57: THE SUNKEN LAB. Ownership check + the three sunken levels (story data).
// Unlocked by the Grok Arcade DLC Shop: localStorage 'grokDLC.drvic.you_choose' (same origin as the arcade), 175 tickets.
export const DLC_KEY = 'grokDLC.drvic.you_choose';
export function ownsSunken() {
  try { if (localStorage.getItem(DLC_KEY)) return true; const l = JSON.parse(localStorage.getItem('grokDLC.owned') || '[]'); if (Array.isArray(l) && l.indexOf(DLC_KEY) >= 0) return true; } catch (e) {}
  // Time Jumper preview / Save Vault beta builds play with the pack switched on (their saves are sandboxed by the preview shim)
  try { if (/\/(previews|archive)\//.test(location.pathname)) return true; } catch (e) {}
  return false;
}
const sea = { skyTop: 0x020814, skyMid: 0x04142a, skyBot: 0x020610, sunDir: [0.1, 1, 0.2], sunColor: 0x7fc8ff, sunI: 0.3, hemiSky: 0x3a7ab0, hemiGround: 0x0a1a20, hemiI: 0.75, exposure: 1.12, fog: 0x06182a, fogD: 0.024, envI: 0.4, envLight: 0x7fc8ff, envLightI: 1.2, bloomT: 0.78, bloomS: 0.8 };
export const SUNK_ORDER = ['sk1', 'sk2', 'sk3'];
export const SUNK = {
  sk1: { name: 'Sunken Lab · Dive Dock', kind: 'lab', sunk: true, env: sea, music: 'vents', floor: 'tile', wall: 0x4f6f7a, fc1: 0x6f8a90, fc2: 0x4e6870, corr: 0x3f5a66, h: 4.4, tag: 'DOCK',
    rooms: ['dock', 'locker', 'sonar', 'pump', 'dock', 'storage'],
    west: { to: 'street', label: 'Ladder up → Old Town drain', up: true }, east: { to: 'sk2', label: 'Pressure hatch → Aquarium Wing' },
    clues: [
      { id: 'sk1_charter', room: 4, dx: 0, dz: 0, kind: 'log', title: 'Charter, 1911: "Project DEEP CHEDDAR"', text: 'Signed by Baron Bartholomew & Baroness Rosalind Ratita: "Build a second lab UNDER Old Town Lake. Nobody looks under a lake. The cheese boats sail right over us."' },
      { id: 'sk1_log', room: 2, dx: 0, dz: 0, kind: 'tape', title: 'Sonar operator tape', text: '*ping* "...ping... Boss, the big thing in the Deep Core is following the cheese boats again. It grabbed one with a TENTACLE. Do I write that down?" "NO." *ping*' },
      { id: 'sk1_suits', room: 1, dx: 0, dz: 0, kind: 'photo', title: 'Photo: the dive team', text: 'Six rats in brass diving helmets, 1912. One helmet is labelled "GRIMSBY (trainee)". Even back then he looks nervous.' },
    ],
    anoms: [{ id: 'sk1_bubble', room: 0, dx: 1, dz: 0, type: 'orb', fol: 20000 }, { id: 'sk1_helmet', room: 1, dx: -2, dz: 1, type: 'float', fol: 24000 }, { id: 'sk1_eyes', room: 3, dx: 0, dz: 0, type: 'eyes', fol: 30000, pop: true }],
    pets: [{ id: 'pirat', room: 0, dx: -2, dz: 1, lines: [['Pi-rat', 'Ahoy, Doctor! Captain Pi-rat here. My great-great-great-grandparents built a lab UNDER A LAKE. Unbelievable. Even for a pirate.'], ['Pi-rat', 'That mini-sub is theirs. The hatch east leads down. Watch the leaks: slip on seawater and you slide right back to the ladder.'], ['Dr. Vic', 'A secret underwater lab! The followers are going to EXPLODE.']] },
      { id: 'candy', room: 5, dx: 1, dz: -1, lines: [['Candy', 'Woof! *Candy followed you down the drain ladder. Her paws are soaking wet.*'], ['Candy', '*She sniffs a crate marked FISH CHEESE and sneezes.*']] }] },
  sk2: { name: 'Sunken Lab · Aquarium Wing', kind: 'lab', sunk: true, env: sea, music: 'attic', floor: 'tile', wall: 0x3f6a78, fc1: 0x5d8a94, fc2: 0x3f6a74, corr: 0x355866, h: 4.6, tag: 'AQUA',
    rooms: ['aquarium', 'kelp', 'lounge', 'specimen', 'aquarium', 'medical'],
    west: { to: 'sk1', label: 'Hatch up → Dive Dock', up: true }, east: { to: 'sk3', label: 'Deep lift → The Deep Core', need: 'sk_valve', needTxt: 'The deep lift is flooded. A sign says: OPEN THE BIG BRASS VALVE TO DRAIN IT. Snowie might know where the valve wheel went.' },
    clues: [
      { id: 'sk2_feed', room: 0, dx: 0, dz: 0, kind: 'log', title: 'Feeding chart', text: 'GOOCTOPUS (Gooliath\'s sea cousin): 9 wheels of cheddar at breakfast. 12 at lunch. "Do NOT feed after midnight. Do NOT tap the glass. Do NOT let it see a cheese boat."' },
      { id: 'sk2_kelp', room: 1, dx: 0, dz: 0, kind: 'blueprint', title: 'Blueprint: kelp-goo farm', text: 'Kelp + Ratita Goo = Glow Kelp. Glow Kelp makes cheese go missing from 3 miles away. Notes in the margin: "the fish are starting to glow too. Fine."' },
      { id: 'sk2_post', room: 2, dx: 0, dz: 0, kind: 'photo', title: 'Postcard never sent', text: 'A postcard of the observation lounge: "Dear Mom, the view is lovely, the lab is evil, the fish keep staring. Please send socks. - Worker rat #31"' },
    ],
    anoms: [{ id: 'sk2_jelly', room: 4, dx: 0, dz: 1, type: 'orb', fol: 36000 }, { id: 'sk2_chair', room: 2, dx: 2, dz: -1, type: 'float', fol: 40000 }, { id: 'sk2_shadow', room: 3, dx: 0, dz: 0, type: 'shadow', fol: 52000, pop: true }],
    pets: [{ id: 'snowie', room: 5, dx: -2, dz: 1, lines: [['Snowie', 'Dr. Vic! It\'s Snowie, from Snowie Sky Tours. I flew over the lake and saw bubbles. Of COURSE it was our family again.'], ['Snowie', 'I found this brass valve wheel in the medical bay. It drains the deep lift. Be careful down there, something big is breathing.']], gift: 'sk_valve' },
      { id: 'luna', at: 'corr', x: 10, z: 1.2, lines: [['Luna', 'Squeak! I came down the drain too. Pi-rat says this place is a whole second lab.'], ['Luna', 'If my great-great-great-grandparents hid something under the lake, I want the world to see it. Keep filming!']] }] },
  sk3: { name: 'Sunken Lab · The Deep Core', kind: 'lab', sunk: true, env: sea, music: 'garage', floor: 'tile', wall: 0x34525e, fc1: 0x44626a, fc2: 0x2f4a52, corr: 0x2c4652, h: 5.0, tag: 'CORE',
    rooms: ['sonar', 'kraken', 'pump', 'servers', 'kraken', 'lounge'],
    west: { to: 'sk2', label: 'Deep lift up → Aquarium Wing', up: true },
    clues: [
      { id: 'sk3_plan', room: 0, dx: 0, dz: 0, kind: 'log', title: 'Grimsby\'s last order', text: '"When the humans leave Old Town, release the GOOCTOPUS into the lake. It will bring us every cheese boat on the river." Signed: Director Grimsby. (It never happened: the Gooctopus fell asleep after a huge lunch.)' },
      { id: 'sk3_shut', room: 2, dx: 0, dz: 0, kind: 'item', title: 'Sea-door shut-off key', text: 'A big brass key: "SEA DOORS: LOCK FOREVER". Turn it and the Gooctopus can never reach the lake.' },
      { id: 'sk3_kids', room: 5, dx: 0, dz: 0, kind: 'photo', title: 'Photo: Baroness at the window', text: 'The Baroness at the big window, holding a baby rat photo: "For the grandkids\' grandkids\' grandkids. I hope they let the fish go." Someone has drawn a tiny heart on it.' },
    ],
    anoms: [{ id: 'sk3_tent', room: 1, dx: 0, dz: 0, type: 'blob', fol: 60000 }, { id: 'sk3_tent2', room: 4, dx: 0, dz: 0, type: 'blob', fol: 70000, pop: true }, { id: 'sk3_drip', room: 3, dx: 0, dz: 1, type: 'drip', fol: 45000 }],
    pets: [{ id: 'torty', room: 5, dx: -2, dz: 1, lines: [['Torty', 'Shell-o, Doctor! Torty, Tortuga Tech. I\'m a turtle. Water is my office.'], ['Torty', 'My Tortuga sensors say the Gooctopus is asleep. Lock the sea doors with the brass key, then GO LIVE from the corridor. The whole world should know.']] }] },
};
