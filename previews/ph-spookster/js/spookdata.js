// DLC #45 Spookster Mega Pack (Grok Pumpkin Hollow): THE GLOOMWORKS, a hidden underground facility beneath a fenced-off sludge site.
// Pure data + unlock + save logic + dialogue. Everything here is original game writing.
import { S, persist } from './save.js?v=ph12';
const PI = Math.PI;
export const KEY = 'grokDLC.pumpkinhollow.spookster_mega_pack';
const QS = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(''); } })();
export function owned() { try { if (QS.get('locked') === '1') return false; if (/\/previews\//.test(location.pathname)) return true; // Time Jumper test build: unlocked for testing
    if (localStorage.getItem(KEY)) return true; const l = JSON.parse(localStorage.getItem('grokDLC.owned') || '[]'); return Array.isArray(l) && l.indexOf(KEY) >= 0; } catch (e) { return false; } }
export const OWN = owned();
export const UY = -30; // same depth as the old bat tunnels (lighting + culling treat every 'u_' region as underground)
// ------------------------------------------------------------------ save (inside the normal Pumpkin Hollow save)
S.sx = Object.assign({ clues: {}, done: {}, skins: { none: 1 }, skin: 'none', vials: [], spooks: 0, best: 0 }, S.sx || {});
['clues', 'done', 'skins'].forEach((k) => { if (!S.sx[k] || typeof S.sx[k] !== 'object') S.sx[k] = {}; }); if (!Array.isArray(S.sx.vials)) S.sx.vials = []; S.sx.skins.none = 1;
export const X = () => S.sx;
// ------------------------------------------------------------------ the surface: Sludge Site (fresh land in the far north-west corner, outside every district)
export const SITE = { x0: -190, z0: -188, x1: -135, z1: -134, gate: [-135, -152, -146] }; // fence box; gate on the east fence (z -152..-146)
export const SHACK = { id: 'sx_shack', x0: -180, x1: -160, z0: -186, z1: -170, ceil: 5.2, name: '🚰 Hollow Hills Water Works' };
export const POOLS = [[-150, -156, 3.0, 2.2], [-178, -150, 2.6, 2.0], [-162, -142, 2.2, 1.6], [-144, -140, 1.6, 1.3], [-185, -162, 1.5, 1.2]]; // x, z, rx, rz
export const AREA = { x0: -192, x1: -133, z0: -190, z1: -132, name: '🧪 Sludge Site' };
export const EXTRA = [[-194, -194, -132, -130], [-136, -153, -112, -145]]; // no scattered trees on the site or its path
export const STOP = [-124, -141, PI, '🧪 Sludge Site'];
// ------------------------------------------------------------------ underground: THE GLOOMWORKS (Sub-Level 13), far west under the hills
const Y0 = UY - 4, Y1 = UY + 10;
export const ROOMS = [
  { id: 'u_gw_lift', x0: -232, x1: -212, z0: -10, z1: 10, h: 5.2, name: '🛗 Gloomworks Lobby' },
  { id: 'u_gw_hall', x0: -292, x1: -232, z0: -4, z1: 4, h: 4.6, name: '🟢 The Glow Corridor' },
  { id: 'u_gw_tests', x0: -292, x1: -264, z0: -32, z1: -4, h: 5.6, name: '🧪 Spooky Test Chambers' },
  { id: 'u_gw_sludge', x0: -262, x1: -234, z0: -32, z1: -4, h: 6.0, name: '🛢️ Sludge Works' },
  { id: 'u_gw_archive', x0: -292, x1: -264, z0: 4, z1: 32, h: 5.0, name: '🗄️ Records Archive' },
  { id: 'u_gw_lab', x0: -262, x1: -234, z0: 4, z1: 32, h: 5.6, name: '⚡ Mad Science Lab B13' },
  { id: 'u_gw_core', x0: -324, x1: -292, z0: -16, z1: 16, h: 7.0, name: '🔆 The Glow Core' },
];
export const RM = Object.fromEntries(ROOMS.map((r) => [r.id, r]));
export const REG = [{ id: SHACK.id, x0: SHACK.x0, x1: SHACK.x1, z0: SHACK.z0, z1: SHACK.z1, y0: -1, y1: 7, ceil: SHACK.ceil, name: SHACK.name },
  ...ROOMS.map((r) => ({ id: r.id, x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y0: Y0, y1: Y1, ceil: UY + r.h, name: r.name, under: true }))];
// openings [axis, at, from, to]: 'x' = wall running along x at z=at; 'z' = wall running along z at x=at
export const OPEN = { u_gw_lift: [['z', -232, -3, 3]], u_gw_hall: [['z', -232, -3, 3], ['z', -292, -3, 3], ['x', -4, -282, -274], ['x', -4, -252, -244], ['x', 4, -282, -274], ['x', 4, -252, -244]],
  u_gw_tests: [['x', -4, -282, -274]], u_gw_sludge: [['x', -4, -252, -244]], u_gw_archive: [['x', 4, -282, -274]], u_gw_lab: [['x', 4, -252, -244]], u_gw_core: [['z', -292, -3, 3]] };
// doors face each other across the hall, so a room also draws the room straight across (no see-through to the sky)
export const NEAR = { u_gw_lift: ['u_gw_hall', 'u_gw_core'], u_gw_hall: ['u_gw_lift', 'u_gw_tests', 'u_gw_sludge', 'u_gw_archive', 'u_gw_lab', 'u_gw_core'], u_gw_tests: ['u_gw_hall', 'u_gw_archive'], u_gw_sludge: ['u_gw_hall', 'u_gw_lab'], u_gw_archive: ['u_gw_hall', 'u_gw_tests'], u_gw_lab: ['u_gw_hall', 'u_gw_sludge'], u_gw_core: ['u_gw_hall', 'u_gw_lift'] };
export const DOORS = OWN ? { [SHACK.id]: [-170, SHACK.z1] } : {};
export const ARRIVE = [-215.5, UY + 0.1, 0, -PI / 2]; export const SURFACE = [-170, 0.2, -177.5, 0];
// Glow Vials (collect all 8): on floors / benches only
export const VIALS = [[-226, UY, -7.5], [-262, UY, 2.6], [-289.5, UY, -29], [-237, UY, -29.5], [-289.5, UY, 29], [-237.5, UY, 29.4], [-321, UY, 13], [-300, UY, -2.6]];
// ------------------------------------------------------------------ mystery: "Who built the Gloomworks, and why?"
export const CLUES = {
  sniff: ['👃 Candy\'s nose', 'Candy sniffs the goo: "Glow sticks… and gummy worms! And it\'s bubbling up from UNDER the ground, right below that old water shack!"'],
  portrait: ['🖼️ The founder\'s portrait', 'A dusty portrait in the Archive: "PROF. CORNELIUS GOURDWICK · FOUNDER · 1926". The little brass plate says: "So no child in Pumpkin Hollow is ever afraid of the dark."'],
  blueprint: ['📐 Project Forever Glow', 'An old blueprint: PROJECT FOREVER GLOW. A light that never goes out, built in secret under the hills "because the whole town would want to help, and it might go BOOM a little."'],
  log: ['📋 Test log #412', 'Test log #412: "Does the glow scare ghosts? NO. The ghosts LOVE it and asked for night-lights." Every test is about making the glow brighter, safer and longer. Signed: Dr. I. G.'],
  pipe: ['🔧 The cracked pipe', 'An overflow pipe runs UP toward the surface and it\'s cracked. Tiny round gooey footprints go in and out of the valve room. Somebody very small keeps opening the valves!'],
  diary: ['📓 Dr. Ivy\'s notebook', 'Dr. Ivy Gourdwick\'s notebook: "Great-Grandpa Cornelius never finished the Forever Glow. I reopened his lab to finish it in time for Halloween, as a surprise for the whole town! P.S. WHO keeps leaving the valves open??"'],
};
export const CLUE_IDS = Object.keys(CLUES);
export const CASE = [
  ['Who built the Gloomworks?', ['Prof. Cornelius Gourdwick, Pumpkin Hollow\'s founder, in 1926', 'Mayor Shiverton, last Tuesday', 'Madame Mystic, with her crystal ball'], 0],
  ['Why are there so many spooky tests?', ['To build a ghost army', 'To finish the Forever Glow, so no kid is ever afraid of the dark', 'To grow the biggest pumpkin in the world'], 1],
  ['Why is green sludge coming out of the ground?', ['A goo volcano woke up', 'Pi-rat spilled his juice', 'Someone small keeps opening the valves, and the extra glow-goo leaks up a cracked pipe'], 2],
];
export const SKINS = [
  { id: 'none', n: 'Your Own Look', how: 'Always yours' },
  { id: 'labcoat', n: 'Mad Scientist', how: 'Ride the elevator down to the Gloomworks' },
  { id: 'tester', n: 'Test Dummy', how: 'Pass Tester Fizz\'s spooky tests' },
  { id: 'hazmat', n: 'Hazmat Suit', how: 'Fix the sludge valves (Sludge Works)' },
  { id: 'guard', n: 'Night Guard', how: 'Find all 8 Glow Vials' },
  { id: 'sludge', n: 'Sludge Monster', how: 'Solve the Gloomworks mystery and befriend Gloopy' },
  { id: 'phantom', n: 'Phantom Scientist', how: 'Win the Night Shift in Spooky Mode 2.0' },
];
export const BADGES = OWN ? { gloomworks: '🔆 Gloomworks Detective', gloopy: '🟢 Gloopy\'s Best Friend', nightshift: '👻 Night Shift Spooker', spooker: '😱 Town Spooker', vials: '🧪 Glow Vial Collector', forever: '✨ Forever Glow Helper' } : {};
export const TASKS = (S) => { if (!OWN) return []; const x = S.sx; const nc = CLUE_IDS.filter((k) => x.clues[k]).length;
  return [[!!x.done.solved, `Solve the Gloomworks mystery (${nc}/${CLUE_IDS.length} clues)`], [!!x.done.gloopy, 'Befriend whoever keeps opening the valves'], [!!x.done.valves, 'Fix the sludge valves (Sludge Works)'], [!!x.done.tests, 'Pass the spooky tests (Test Chambers)'],
    [!!x.done.forever, 'Mix the Forever Glow with Dr. Ivy'], [x.vials.length >= VIALS.length, `Find all 8 Glow Vials (${x.vials.length}/8)`], [!!x.done.night, 'Win the Night Shift in Spooky Mode 2.0'], [(x.spooks | 0) >= 25, `Spook 25 townsfolk as a ghost (${Math.min(25, x.spooks | 0)}/25)`]]; };
export function step() { const x = S.sx, nc = CLUE_IDS.filter((k) => x.clues[k]).length; if (!x.done.down) return 'Find out where the green sludge comes from (Sludge Site)'; if (!x.done.solved) return nc >= 4 ? 'You have enough clues! Use the Case Board in the Glow Core' : `Look for clues in the Gloomworks (${nc}/6)`; if (!x.done.gloopy) return 'Meet the valve-opener in the Glow Core'; if (!x.done.forever) return 'Help Dr. Ivy mix the Forever Glow (Lab B13)'; return 'Mystery solved! Try Spooky Mode 2.0 at a Ghostifier'; }
// ------------------------------------------------------------------ characters (new + the five pets visiting)
const A = (id, n, look, at, region, o = {}) => Object.assign({ id, n, look, at, region }, o);
export const NPCS = OWN ? [
  A('sx_mabel', 'Inspector Mabel Muckworth (Goo Inspector)', { sci: 4 }, [-148, -150.5, -PI / 2], 'out'),
  A('m_candy2', 'Candy (Mini Schnauzer) · sniffing the goo', { dog: 'schnauzer', s: 1.05 }, [-174.5, -146.6, PI * 0.8], 'out'),
  A('sx_bones', 'Guard Bones (Night Security)', { sci: 6 }, [-222, 5.6, PI], 'u_gw_lift'),
  A('m_torty2', 'Torty (Martina) · visiting the lab', { t: { shell: 'torty', flower: true }, s: 0.27 }, [-219.5, -5.6, -PI * 0.75], 'u_gw_lift'),
  A('sx_fizz', 'Tester Fizz (Spooky Tests)', { sci: 1 }, [-270.5, -8.5, PI], 'u_gw_tests'),
  A('m_snowie2', 'Snowie (Head of Fun) · test volunteer', { rat: 'snowie', hat: 'goggles', extras: ['bow'] }, [-283, -9.2, PI * 0.9], 'u_gw_tests'),
  A('sx_gus', 'Pipe Chief Gus Gasket (Sludge Works)', { sci: 2 }, [-238, -9, -PI * 0.75], 'u_gw_sludge'),
  A('m_pirat2', 'Pi-rat (Chief Inventor) · checking the pipes', { rat: 'pirat', hat: 'pirate', extras: ['patch'] }, [-258, -22.5, PI / 2], 'u_gw_sludge'),
  A('sx_dusty', 'Archivist Dusty Pages (Records)', { sci: 3 }, [-270, 9, PI], 'u_gw_archive'),
  A('m_luna2', 'Luna (Ratita Industries CEO) · reading old files', { rat: 'luna', hat: 'goggles' }, [-285, 21, PI / 2], 'u_gw_archive'),
  A('sx_ivy', 'Dr. Ivy Gourdwick (Mad Scientist)', { sci: 0 }, [-248, 19, 0], 'u_gw_lab'),
  A('sx_volt', 'Professor Volt (Lab Assistant)', { sci: 5 }, [-240, 9.5, -PI / 2], 'u_gw_lab'),
] : [];
const T = (hi, more) => ({ hi, more });
export const TALK = {
  sx_mabel: T(['Stand back! Goo Inspector Mabel Muckworth, on the case.', 'Green sludge keeps bubbling up out of the ground all over this lot. It glows. It hums. It smells like gummy worms.', 'The old Water Works shack has been locked for a hundred years… but someone oiled the hinges. Have a look inside, if you\'re brave.'],
    ['Don\'t touch the goo. Well, it\'s harmless, but it\'s VERY sticky.', 'Candy has the best nose in town. Ask her what she smells.', 'If you find where it comes from, I\'ll finally get to write "CASE CLOSED" in my notebook. In green ink.']),
  sx_bones: T(['Halt! Who goes th… oh, a visitor! Guard Bones, night security. Welcome to the Gloomworks, Sub-Level 13.', 'Lockers are by the wall if you want a lab coat. Labs left and right, the Glow Core at the far end. Mind the goo.'],
    ['I\'ve worked the night shift for 60 years. I\'m mostly bones now. Ha! Bone joke.', 'Ever tried the Ghostifier in Lab B13? Step in, turn into a ghost, spook the night shift. Best fun down here.', 'Sometimes I hear tiny squishy footsteps at night. Squish, squish. Then a valve squeaks open.']),
  sx_fizz: T(['Tester Fizz! I run the spooky tests: the Fog Fright Test, the Pumpkin Growth Ray, the Shadow Box and the Glow Test.', 'Test #413 needs a steady hand. Calibrate the glow meter at the console and I\'ll put your name in the log!'],
    ['Every test makes the glow a little brighter and a little safer. Dr. Ivy says it has to be PERFECT for Halloween.', 'Snowie volunteered for the Glow Test. She says it tickles.', 'Test log #412 is my favourite. Read it on the console screen.']),
  sx_gus: T(['Gus Gasket, Pipe Chief. Every pipe down here goes into those big glow-goo tanks.', 'Except someone keeps turning the valves the wrong way, and the extra goo squirts up the old overflow pipe… straight out of the ground up top.'],
    ['Fix the valve panel and the goo goes back where it belongs. Pi-rat wrote the right settings on the chalkboard.', 'Look at the cracked pipe. See those tiny round footprints? Not mine. My boots are size 14.', 'Glow-goo is harmless. It just makes your socks glow for a week.']),
  sx_dusty: T(['Shhh! Archivist Dusty Pages. Every file since 1926 is in here.', 'If you want to know who built this place, the old portrait at the back wall is a good start. Or the blueprints, if you can find the right drawer.'],
    ['I alphabetise the ghosts\' paperwork too. They never fill in the forms.', 'The drawers are a bit of a puzzle. Match the labels and they open.', 'Luna has been reading the old test reports all night. She reads faster than I do.']),
  sx_volt: T(['Professor Volt, lab assistant! Don\'t touch the coils. Well, you CAN touch the coils. Your hair just won\'t lie flat until Thursday.', 'Dr. Ivy is a genius. A secretive genius. She hasn\'t told anybody upstairs about the lab.'],
    ['The Ghostifier turns you into a ghost for a bit. Totally safe! Mostly see-through.', 'Our night shift is VERY jumpy. Spook them right and they run straight to the elevator.', 'BZZZT! Sorry. That was me, not the coil.']),
  m_torty2: T([['Torty', 'Hi! My Mad Science Lab tests gadgets to make them tougher. These scientists test SPOOKS! I\'m taking notes.'], ['Torty', 'A secret lab under the hills, all this time. Martina the detective is on the case. That\'s me!']],
    [['Torty', 'Grab a lab coat from the lockers. We match!'], ['Torty', 'Guard Bones says the night shift is scared of everything. Even me. I\'m a tortoise!']]),
  m_snowie2: T([['Snowie', 'I\'m a TEST VOLUNTEER! I sit in the glow and Fizz writes down how happy I look. Very happy.'], ['Snowie', 'The fog test is my favourite. Whoosh!']], [['Snowie', 'Do my goggles make me look like a scientist? They do, right?'], ['Snowie', 'The giant test pumpkin is bigger than a car. I asked to keep it. Fizz said no.']]),
  m_pirat2: T([['Pi-rat', 'Arr! These pipes be leaky. Look there: tiny gooey footprints going in and out of the valve room!'], ['Pi-rat', 'I wrote the right valve settings on the chalkboard. Arrow down, arrow left, arrow up.']], [['Pi-rat', 'Whoever opens these valves be very small, very round, and very sticky.'], ['Pi-rat', 'I could build a turbo valve that locks. But maybe the valve-opener just wants a friend?']]),
  m_luna2: T([['Luna', 'These files go back to 1926! Have you seen the portrait at the back? Someone built this place for a reason.'], ['Luna', 'Every test report says the same thing: brighter, safer, longer. They\'re building a LIGHT.']], [['Luna', 'Ratita Industries could use a forever light. For late-night inventing.'], ['Luna', 'Find the blueprint drawer. The labels are tricky.']]),
};
export function talk(id, n, G, h) { if (!OWN) return null; const { L, cyc } = h; const x = S.sx, c = (k) => G.spookClue && G.spookClue(k);
  if (id === 'm_candy2') { if (!x.clues.sniff) return { lines: L(['Candy', 'Sniff sniff… SNIFF! This goo smells like glow sticks and gummy worms!'], ['Candy', 'And it\'s bubbling up from UNDER the ground. Right under that old water shack!']), fx: () => c('sniff') };
    return { lines: L(['Candy', cyc(['I\'m guarding the goo. Nobody touches the goo. Except me. A little.', 'My paws are glowing! Is that normal? It\'s AWESOME.', x.done.gloopy ? 'Gloopy came up to say hi! He\'s squishy. I like him.' : 'Something small and squishy squeaked at me from the pipe. Squeak!'])]) }; }
  if (id === 'sx_ivy') { if (!x.clues.diary) return { lines: L('Oh! A visitor! Nothing to see here! Just a… perfectly normal… water department.', cyc(['Please don\'t read my notebook. It\'s on the desk. Don\'t read it.', 'Shoo! I mean, welcome! I mean, shoo!'])) };
    if (!x.done.solved) return { lines: L('You read my notebook, didn\'t you. Fine! I\'m Dr. Ivy Gourdwick. My great-grandpa built this lab.', 'It was supposed to be a surprise for Halloween. Put the clues together on the Case Board in the Glow Core and you\'ll see.') };
    if (!x.done.gloopy) return { lines: L('Gloopy?! He was born in Test Chamber 7 from a drop of glow-goo and I never knew! He must be so lonely.', 'Go and say hello. He loves gummy worms. Everybody loves gummy worms.') };
    if (!x.done.forever) return { lines: L('Now the leak is fixed, we can finish what Great-Grandpa started: the Forever Glow!', 'Use the mixing station. Watch the recipe and repeat it exactly.') };
    return { lines: L(cyc(['The Forever Glow works! This Halloween, every street in Pumpkin Hollow gets a light that never goes out.', 'Great-Grandpa Cornelius would be so proud. So would Gloopy\'s great-grandpa. If goo has those.', 'Come back any time. Bring snacks. Gloopy eats the wrappers.'])) }; }
  const t = TALK[id]; if (!t) return null; return { lines: n === 1 ? L(...t.hi) : L(cyc(t.more)) }; }
