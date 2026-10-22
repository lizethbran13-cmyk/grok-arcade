// Snowie's tour commentary, the cameo chats, rescue lines and ring courses.
import { S } from './save.js?v=st11mp';
import { TOURS, RESCUES, TOWNS } from './map.js?v=st11mp';
export const FACTS = {
  arch: ['Snowie', 'Welcome to Pup Town! That arch is a REAL bone... okay, it\'s concrete. But every dog in town has licked it at least once.'],
  hydrant: ['Snowie', 'The Giant Hydrant holds all of Pup Town\'s water. On hot days they turn on the side nozzles and the whole town has a splash party!'],
  hall: ['Snowie', 'Doghouse Town Hall! The mayor works here... and so does Candy. Mostly she naps on the doormat. Land and say hi!'],
  statue: ['Snowie', 'The Great Torty Statue! Torty founded this town AND Tortuga Tech. The statue was drop-tested from 30 metres. Not a scratch.'],
  dome: ['Snowie', 'The Shell Dome Museum doubles as an observatory. At night the telescope pokes out like a little turtle head!'],
  lighthouse: ['Snowie', 'The Lakeside Lighthouse keeps boats safe. Mostly Pi-rat\'s boat. Pi-rat steers with one eye, so... it\'s VERY important.'],
  pole: ['Snowie', 'North Pole Village\'s Candy Cane Pole! It\'s peppermint all the way down. Please do not lick. Pup Town visitors keep trying.'],
  workshop: ['Snowie', 'The Toy Workshop makes toys for every pet in the valley. Candy\'s squeaky bones? Made right here!'],
  peak: ['Snowie', 'Snowcap Peak, the tallest point in the valley! I can see my office from up here. Hi office!'],
  tower: ['Snowie', 'Snowie Airfield Tower! The controllers up there spot every plane in the valley. They also spot every pigeon. They wave at both.'],
  farm: ['Snowie', 'Cheddar Farm! The windmill grinds cheese crumbs for Luna\'s Ratita snacks. The sheep think it\'s a giant spinning flower.'],
  falls: ['Snowie', 'Rainbow Falls! The water tumbles off Snowcap\'s foothills into Frost Pond. Fly by in the afternoon and the rainbow is extra bright!'],
  ship: ['Snowie', 'Ahoy! That\'s the Squeaky Skull, Pi-rat\'s ship. There\'s a pad on the deck. Pi-rat says landing there is "almost always fine".'],
};
export const LINES = {
  snowie0: [['Snowie', 'Hi hi hi! I\'m Snowie, and this is Snowie Sky Tours, the fluffiest helicopter tours in the valley!'], ['Snowie', 'You\'re my new pilot! I\'ll sit up front and do the talking. You do the flying. Deal?'], ['Snowie', 'Visit every tour stops, rescue stranded pets, and race the ring courses. And if you crash... don\'t worry, my tow-drone has never lost a copter!']],
  snowie: [['Snowie', 'Need tips? Hold ▲ to climb, ▼ to come down, and push the stick where you want to fly. Land on a pad to hop out and explore!']],
  candy: [['Candy', '...zzz... (Candy is napping on the Town Hall doormat, on top of a pile of very important forms.)'], ['Mayor Goldie', 'Candy runs Ruffsources over in the city. She visits to "approve" our paperwork. Mostly by sleeping on it.']],
  candyAwake: [['Candy', 'Arf! (Candy opens one eye, sees the copter keys, and wags.) Arf arf!'], ['Mayor Goldie', 'She wants a ride! Maybe next time, Candy. Somebody has to keep the forms warm.']],
  torty: [['Torty', 'Welcome to the Shell Museum! Every shell here was tested by Tortuga Tech. Torty tested the best ones personally.'], ['Torty', 'Torty heard you crash-land copters. Torty respects that. Durability is a lifestyle.']],
  luna: [['Luna', 'Hey pilot! Ratita Industries built the rotor on Snowie\'s copter. And the tow-drone. And the cup holders.'], ['Luna', 'If anything breaks, bring it back. I\'ll make it better. Or at least more sparkly.']],
  pirat: [['Pi-rat', 'Arrr! A sky-sailor! Welcome aboard the Squeaky Skull!'], ['Pi-rat', 'I keep one eye on the lake and one eye on... well, the patch. Watch out for that lighthouse, it moves when I\'m not looking. I think.']],
  mayor: [['Mayor Goldie', 'Welcome to Pup Town! Stamp your Sky Passport at the desk, and try the Barkery\'s Pup-Tarts!']],
  baker: [['Baker Dot', 'Fresh Pup-Tarts! Bone-shaped, peanut-butter filled, and 100% dog approved. Humans like them too. Mostly.']],
  elf: [['Toymaker Tinsel', 'Every toy gets wrapped, bowed and drop-tested by Torty. Want to help wrap one?']],
  marsh: [['Marsh', 'Hot cocoa! With marshmallows shaped like little rats. Snowie designed them. Very fluffy.']],
};
export const PET_NAMES = { hub: 'the Heliport', pup: 'Pup Town', tort: 'Torty Town', np: 'North Pole Village' };
export const RESCUE_LINES = {
  pebble: ['Pebble', 'Peep! I swam out to the island and forgot how to swim back. Torty Town, please!'],
  mittens: ['Mittens', 'Mew! I climbed up, and then the mesa got TALL. Can we go to the Heliport?'],
  frosty: ['Frosty', 'Awoo! I was chasing a snowflake and now I\'m on a ledge. Home to North Pole Village?'],
  nibbles: ['Nibbles', 'I was ice skating and the ice... left. Take me home to the Village, please!'],
  waffles: ['Waffles', 'Bark! These woods all look the same! Pup Town is my home!'],
  gouda: ['Gouda', 'Squeak! This corn maze has no cheese and no exit! Heliport, please!'],
};
// ring courses: points [x, y, z]; par time (gold) in seconds
export const COURSES = [
  { id: 'pup', name: 'Pup Town Loop', par: 42, pts: [[-190, 26, -95], [-205, 32, -60], [-245, 30, -52], [-290, 26, -75], [-318, 20, -120], [-318, 26, -175], [-290, 36, -215], [-240, 42, -228], [-190, 34, -210], [-172, 26, -160]] },
  { id: 'lake', name: 'Lake Slalom', par: 36, pts: [[200, 12, 10], [222, 8, -20], [250, 7, 10], [280, 7, -20], [312, 9, 10], [330, 12, 40], [300, 9, 62], [270, 7, 40], [240, 8, 66], [210, 12, 48]] },
  { id: 'peak', name: 'Snowcap Peak Run', par: 55, pts: [[30, 40, 300], [60, 58, 340], [30, 80, 380], [-30, 98, 400], [-90, 110, 420], [-90, 120, 470], [-30, 150, 500], [40, 130, 470], [90, 110, 440], [120, 85, 380]] },
];
export function goal(g) {
  if (S.carry) { const r = RESCUES.find((q) => q.id === S.carry); return r ? `Fly ${r.name} home to ${PET_NAMES[r.home]}` : 'Fly home'; }
  if (g && g.race) return `${g.race.c.name}: ring ${g.race.i + 1}/${g.race.c.pts.length}`;
  if (!S.talks.snowie) return 'Take off! Hold ▲ to climb';
  if (S.tours.length < TOURS.length) return `Tour stops: ${S.tours.length}/${TOURS.length}. Follow the pink arrow!`;
  if (S.rescues.length < RESCUES.length) return `Rescue stranded pets: ${S.rescues.length}/${RESCUES.length}`;
  const left = COURSES.filter((c) => !S.rings[c.id]); if (left.length) return `Fly the ${left[0].name} ring course`;
  return 'Top pilot! Collect every passport stamp and gold medal';
}
// letters to Santa in the Toy Workshop mail sacks
export const LETTERS = [
  ['A letter to Santa', '"Dear Santa, I would like one (1) squeaky bone, and for the mail carrier to stop being so suspicious. Love, Rusty (Pup Town)."'],
  ['A letter to Santa', '"Dear Santa, Please bring a faster shell. Not for me. For a friend. The friend is me. — Slowpoke."'],
  ['A letter to Santa', '"Santa! A new eyepatch, the shiny kind. Also a parrot. Also a parrot-shaped eyepatch. Arr. — Pi-rat."'],
  ['A letter to Santa', '"Dear Santa, I have been very good. I only napped on 400 forms this year. — Candy (dictated to Mayor Goldie)."'],
  ['A letter to Santa', '"Dear Santa, could you please fly with Snowie one day? She says the copter has a reindeer mode. — Mittens."'],
  ['A letter to Santa', '"To Santa: one (1) tow-drone of my own, so I can tow my brother home from the park. — Bean."'],
];
