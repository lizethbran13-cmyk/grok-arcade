// Grok Ruffsources HQ - story, dialogue, clues and new-hire candidates.
import { S } from './save.js?v=rs5';
export const CLUES = [
  { id: 'mail', room: 'Mail Room', at: [-14.4, -9.4], title: 'A smudged parcel slip', text: '"To: Tortuga Tech Inc. Contents: 1 squeaky toy (pink). Handle with paws." The sender\'s name is smudged... but it starts with a P.' },
  { id: 'break', room: 'Break Room', at: [16.4, -14.3], title: 'Cheese crumbs + a black string', text: 'A trail of cheese crumbs leads away from the fridge, and a little black eyepatch string is snagged on the handle.' },
  { id: 'file', room: 'Filing Archive', at: [-8.0, -19.4], title: 'Form R-27', text: '"Request to Borrow Office Equipment: 1 squeaky toy. Reason: SCIENCE." It isn\'t signed with a name. Just a big X, like on a treasure map.' },
  { id: 'cushion', room: 'Interview Room', at: [0, -27.0], title: 'SQUEAK! ...oh.', text: 'Just a whoopee cushion under the candidate chair. Snowie\'s favorite prank. Not the toy, but now you know where all the squeaks were coming from.' },
  { id: 'log', room: 'Ratita Industries', at: [-37.5, 4.4], title: 'Luna\'s visitor log', text: '"Snowie: 1 cheese latte to go. Torty: picked up 3 gadgets to drop-test. Pi-rat: borrowed bubble wrap \'to ship something squeaky, arr\'."' },
];
export const SUSPECTS = [
  { id: 'luna', name: 'Luna', why: 'Runs Ratita Industries next door. Was busy all morning.' },
  { id: 'pirat', name: 'Pi-rat', why: 'Keeps one eye on everything. Loves "borrowing" treasure.' },
  { id: 'snowie', name: 'Snowie', why: 'Snowie loves a good prank. Very squeaky laugh.' },
  { id: 'torty', name: 'Torty', why: 'Tortuga Tech tests how tough gadgets are. Very curious.' },
];
export const RIGHT = 'pirat';
export const CANDIDATES = [
  { id: 'pepper', name: 'Pepper the Pug', model: { breed: 'pug' }, job: 'Mail Room Runner', fit: false, lines: ['Hi! I\'m Pepper. I LOVE mail.', 'Q: How fast can you deliver a letter? A: Very fast! Right after my nap. And my snack. And my second nap.'] },
  { id: 'ziggy', name: 'Ziggy the Ginger Rat', model: { rat: 'ginger' }, job: 'Break Room Barista', fit: true, lines: ['Ziggy here! I worked 3 years at the Cheese Latte Bar.', 'Q: What do you do when the coffee machine breaks? A: I fix it with a paperclip and a cheese rind. It works every time.'] },
  { id: 'duchess', name: 'Duchess the Poodle', model: { breed: 'poodle' }, job: 'Nap Supervisor', fit: true, lines: ['Darling, I have supervised the finest naps in Pup Town.', 'Q: Candy fell asleep on the paperwork again. What do you do? A: Tuck her in, fluff her doormat and file the papers myself.'] },
  { id: 'hank', name: 'Hank the Basset Hound', model: { breed: 'basset' }, job: 'Squeak Tester', fit: true, lines: ['Hank. I test squeaks. I\'m good at it.', 'Q: How do you test a squeaky toy? A: One gentle squeak, an ear-check, then a report in triplicate. No chewing.'] },
  { id: 'bolt', name: 'Bolt the Dalmatian', model: { breed: 'dalmatian' }, job: 'Mail Room Runner', fit: true, lines: ['Bolt! Fastest paws on the block!', 'Q: A parcel says Tortuga Tech. Where does it go? A: The teal bin with the shell on it. Then I come back for the next one. Zoom!'] },
  { id: 'nibbles', name: 'Nibbles the Cream Rat', model: { rat: 'cream' }, job: 'Filing Clerk', fit: false, lines: ['Hello! I\'m Nibbles. I ADORE paper.', 'Q: What do you do with an old file? A: Nibble it. Wait, is that not the right answer? It\'s crunchy.'] },
];
export const LINES = {
  biscuit0: [['Biscuit', 'Welcome to Ruffsources HQ! I\'m Biscuit, assistant to the Head of Ruffsources.'], ['Biscuit', 'Ruffsources is the HR department for BOTH Ratita Industries and Tortuga Tech Inc. Everybody needs us!'], ['Biscuit', 'Your hire form just needs Candy\'s paw stamp. She\'s right over there... in a meeting. (She\'s napping on the paperwork again.)']],
  biscuit: [['Biscuit', 'Jobs today: sort the Mail Room, run Break Room orders, file the Archive, interview new hires, and help Luna and Torty next door!']],
  candy0: [['Candy', 'Zzz... *snrrk* ...wha? A new hire?'], ['Candy', '*stamps your form with a paw* APPROVED. Welcome to Ruffsources. Wake me if the building is on fire. Zzz...']],
  missing: [['Biscuit', 'Uh oh! CANDY\'S SQUEAKY TOY IS GONE!'], ['Biscuit', 'She can\'t approve anything without it. She just naps, sad, wherever she lands.'], ['Biscuit', 'Look for clues around the building (and next door). Then pin the culprit on the clue board in Candy\'s office!']],
  candySad: [['Candy', '*sad snore* ...no squeak... no approve... Zzz...']],
  candyNap: [['Candy', 'Zzz... *paw stamp* ...APPROVED... Zzz...']],
  candyHappy: [['Candy', '*squeak squeak* Zzz... best... employee... ever...']],
  luna: [['Luna', 'Hey new hire! Luna, boss of Ratita Industries. Ruffsources handles all our paperwork, thank cheese.'], ['Luna', 'Got a minute? Some returned gadgets need calibrating at the Gadget Returns desk.']],
  torty: [['Torty', 'Welcome to Tortuga Tech Inc.! We drop-test gadgets. If it survives Torty, it survives anything.'], ['Torty', 'Want to run the drop tower? Slow and steady wins the test.']],
  pirat: [['Pi-rat', 'Arr! Pi-rat here. I keep one eye on everything. The other one\'s on vacation.'], ['Pi-rat', 'Candy runs a tight ship. A sleepy ship, but a tight one.']],
  snowie: [['Snowie', 'Hi hi! Snowie! I fly tours on weekends, but today I\'m slinging lattes at Bark & Brew.'], ['Snowie', 'Want to try the Pupuccino pour? Fill it right to the line!']],
  piratConfess: [['Pi-rat', 'Arr, ye caught me! I borrowed the squeaky toy.'], ['Pi-rat', 'Torty said Candy\'s toy is the toughest squeaker in the land, and Tortuga Tech had to PROVE it. I shipped it over for a durability test!'], ['Pi-rat', 'Go see Torty at Tortuga Tech. And tell Candy I\'m sorry. I\'ll file Form R-28: Apology.']],
  tortyToy: [['Torty', 'Oh! The squeaky toy! It survived 1,000 drops and still goes SQUEAK.'], ['Torty', 'Shell-Tough certified! Here, take it back to Candy. Slow and steady!']],
  returned: [['Candy', '*SQUEAK* !!! My toy!!!'], ['Candy', 'You found it! You\'re promoted to Senior Squeak Detective. *paw stamp* APPROVED APPROVED APPROVED.'], ['Candy', '...Zzz...']],
};
export function goal() {
  if (!S.talks.candy) return 'Get your hire form stamped by Candy (she\'s napping in the Lobby)';
  if (S.mys === 1) { const n = Object.keys(S.clues).length; return n < 5 ? `Find clues about the missing squeaky toy (${n}/5)` : 'Pin the culprit on the clue board in Candy\'s office'; }
  if (S.mys === 2) return 'Get the squeaky toy back from Torty at Tortuga Tech';
  if (S.mys === 3) return 'Bring the squeaky toy back to Candy (wherever she\'s napping)';
  return 'Explore! Golden Bones, Candy\'s naps, jobs and new hires.';
}
