// Ratita Industries HQ: who works here, what they say, and the two mystery chains. Pure data + small helpers; the game
// calls talk(npcId) and gets back lines plus an optional effect to run when the chat ends.
import { S, persist, ensureTT } from './save.js';
import { tortugaOwned } from './tortuga-wing.js';
export const HATS = [
  { id: 'none', n: 'No Hat', how: 'Always yours' }, { id: 'hardhat', n: 'Hard Hat', how: 'Watch 3 live tests' }, { id: 'party', n: 'Party Hat', how: 'Find 12 golden gears' },
  { id: 'goggles', n: 'Inventor Goggles', how: 'Mix bouncy goo' }, { id: 'pirate', n: 'Pirate Bandana', how: "Ace Pi-rat's target test" }, { id: 'chef', n: 'Chef Hat', how: 'Solve the Great Gouda Heist' },
  { id: 'flower', n: 'Flower', how: 'Solve the Secret Gardener' }, { id: 'wizard', n: 'Wizard Hat', how: 'Find 5 secrets' }, { id: 'astro', n: 'Astro Helmet', how: 'Find every golden gear' }, { id: 'tortuga', n: 'Tortuga Shell Helmet', how: 'Certify all 3 Tortuga Tech chambers' }, { id: 'crown', n: 'Gold Crown', how: 'Both mysteries + all 3 calls + Candy\'s toys' },
];
export const BADGES = { gouda: '🧀 Gouda Detective', garden: '🌵 Secret Gardener', goo: '🧪 Goo Master', range: '🎯 Sharp Shooter', toys: '🐶 Good Rat (Candy approved)', mug: '☕ Intern Saver', taste: '👅 Brave Taster', tests: '🚀 Test Watcher', calls: '📞 Family Caller', gears: '⚙️ Gear Collector', secrets: '🗝️ Secret Finder', tortuga: '🐢 Shell-Tough Engineer' };
// ---------------------------------------------------------------- NPCs
// look: rat colour id (or 'candy', 'dog', 'sweepy', 'bitsy', 'martina'), hat, extras; at: [x, y, z, yaw]; walk: patrol points
export const NPCS = [
  { id: 'luna', n: 'Luna (CEO)', look: { rat: 'luna', hat: 'crown', extras: ['tie'], tie: 0x7c3aed }, at: [-7, 20.4, -39.6, 0], region: 'pent' },
  { id: 'pirat', n: 'Pi-rat (Chief Inventor)', look: { rat: 'pirat', hat: 'pirate', extras: ['patch'] }, at: [0, 20.4, -40.0, 0], region: 'pent' },
  { id: 'snowie', n: 'Snowie (Head of Fun)', look: { rat: 'snowie', hat: 'flower', extras: ['bow'], tie: 0xff4fa0 }, at: [7, 20.4, -39.6, 0], region: 'pent' },
  { id: 'penny', n: 'Penny (Reception)', look: { rat: 'rose', extras: ['headset'] }, at: [0, 0, -2.2, 0], region: 'atrium', riser: 0.5 },
  { id: 'brie', n: 'Dr. Brie (Cheese Science)', look: { rat: 'cream', extras: ['coat', 'glasses'] }, at: [39.5, 0, -18.5, -0.6], region: 'cheese' },
  { id: 'fizz', n: 'Prof. Fizzwick (Goo Lab)', look: { rat: 'ginger', hat: 'goggles', extras: ['coat'] }, at: [-19.5, 0, -18.6, -0.5], region: 'goo' },
  { id: 'bolt', n: 'Bolt (Gadget Tester)', look: { rat: 'ash', hat: 'hardhat', extras: ['vest'], vest: 0xf97316 }, at: [-38.5, 0, -18.2, -1.2], region: 'gadget' },
  { id: 'gizmo', n: 'Gizmo (Robotics)', look: { rat: 'blue', extras: ['coat', 'glasses'] }, at: [22.5, 0, -22.8, 0.3], region: 'robo' },
  { id: 'rocco', n: 'Rocco (Security)', look: { rat: 'black', extras: ['tie', 'glasses'], tie: 0x1e3a8a, glass: 0x111827 }, at: [21.6, 0, -1.4, -PI_2()], region: 'security' },
  { id: 'dusty', n: 'Dusty (Mailroom)', look: { rat: 'cocoa', extras: ['vest'], vest: 0x2563eb }, at: [14.8, 0, 5.5, 1.2], region: 'security' },
  { id: 'chef', n: 'Chef Camembert', look: { rat: 'brownie', hat: 'chef', extras: [] }, at: [-26.4, 0, -2.5, -PI_2()], region: 'cafe', riser: 0.5 },
  { id: 'gary', n: 'Gary (Intern)', look: { rat: 'gold', extras: ['tie'], tie: 0x16a34a }, at: [-17.6, 0, 0.6, 2.4], region: 'offices' },
  { id: 'marge', n: 'Marge (Accounting)', look: { rat: 'rose', extras: ['glasses', 'bow'], tie: 0x0ea5e9 }, at: [-14.9, 0, -2.3, 1.6], region: 'offices' },
  { id: 'tess', n: 'Tess (Test Director)', look: { rat: 'cocoa', hat: 'hardhat', extras: ['vest', 'headset'], vest: 0xfacc15 }, at: [-4.6, 0, -40.6, 3.0], region: 'obs' },
  { id: 'sparky', n: 'Sparky (Launch Crew)', look: { rat: 'black', hat: 'hardhat', extras: ['vest'], vest: 0xf97316 }, at: [-22, 0, -78, -1.2], region: 'out' },
  { id: 'nibbles', n: 'Nibbles (Break Time Champion)', look: { rat: 'blue', extras: ['headset'] }, at: [39.6, 0, -4.6, PI_()], region: 'lounge' },
  { id: 'pip', n: 'Pip (Napping Expert)', look: { rat: 'brownie', extras: ['tie'], tie: 0xf59e0b }, at: [31.5, 0, 4.3, PI_()], region: 'lounge', sit: true },
  { id: 'zippy', n: 'Zippy (Courier)', look: { rat: 'ginger', hat: 'party', extras: ['vest'], vest: 0x22c55e }, at: [-40, 0, -9.5, 0], region: 'whall', walk: [[-44, -9.5], [-14, -9.5], [-14, -8.5], [-44, -8.5]] },
  { id: 'gate', n: 'Fern (Gardener)', look: { rat: 'cream', hat: 'flower', extras: ['vest'], vest: 0x16a34a }, at: [9, 0, 13.5, 0.4], region: 'out' },
  { id: 'candy', n: 'Candy (Head of Ruffsources)', look: { rat: 'candy', breed: 'schnauzer', s: 1.05 }, at: [66.2, 0.9, -14, -PI_2()], region: 'dcr' },
  { id: 'biscuit', n: 'Biscuit (Ruffsources Clerk)', look: { rat: 'dog', breed: 'corgi', s: 1.1 }, at: [53.5, 0, -16.2, 0.3], region: 'dcr' },
  { id: 'pepper', n: 'Pepper (Treat Officer)', look: { rat: 'dog', breed: 'beagle', s: 1.0 }, at: [53.5, 0, -4.6, 2.8], region: 'dcr' },
  { id: 'sweepy', n: 'Sweepy (Robo-Vac)', look: { rat: 'sweepy' }, at: [-42.6, 0.2, 3.6, 0.5], region: 'cafe' },
  { id: 'bitsy', n: 'Bitsy (Tiny Bot)', look: { rat: 'bitsy' }, at: [20, 0, -20.5, 0], region: 'robo', walk: [[16, -20.5], [27, -20.5], [27, -24], [16, -24]] },
  { id: 'martina', n: 'Martina (Desert Tortoise)', look: { rat: 'martina' }, at: [-109, -30, -17, 0.8], region: 'dome' },
];

// ---------------------------------------------------------------- more employees & visitors (rats, mice, hamsters, bunnies)
// sp: species (rat | mouse | hamster | bunny); act: walk patrol, 'work' (busy at a bench), 'chat' (talking to a neighbour), 'sit'
const C = (id, n, sp, rat, x, y, z, yaw, region, lines, o = {}) => ({ id, n, look: Object.assign({ rat, sp, extras: o.extras || [], hat: o.hat }, o.look || {}), at: [x, y, z, yaw], region, lines, walk: o.walk, act: o.act, sit: o.act === 'sit' });
export const CROWD = [
  C('tilly', 'Tilly (Tour Guide)', 'bunny', 'rose', -6, 0, -3, 0, 'atrium', ['And on your left: the fountain! On your right: also the fountain. It\'s round.', 'Tour fact: this dome has 1,024 glass panels. I counted. Twice.', 'Please keep your paws inside the tour at all times!'], { extras: ['headset'], walk: [[-6.5, -3], [6.5, -3], [6.5, -15.5], [-6.5, -15.5]] }),
  C('max', 'Max (Visitor)', 'mouse', 'cream', -8.2, 0, -19.6, 0.5, 'atrium', ['Moxie and I won a tour! First prize: a tour. Second prize: TWO tours.', 'Is it true they have a cheese that\'s worth more than a car?'], { act: 'chat' }),
  C('moxie', 'Moxie (Visitor)', 'mouse', 'gray', -7.3, 0, -18.2, -2.6, 'atrium', ['I\'m here for the gift shop. There is no gift shop. I\'m devastated.', 'Did you see the robot? It waved at me! Or it was malfunctioning. Either way, cute.'], { act: 'chat', look: { rat: 'ash' } }),
  C('mop', 'Mop (Custodian)', 'hamster', 'gold', 8, 0, -5, 0, 'atrium', ['Sweepy does the floors. I do everything Sweepy misses. So… everything.', 'Somebody dripped fondue in the West Hall again. I have my suspicions. Chef.'], { extras: ['vest'], look: { vest: 0x22c55e }, walk: [[8.5, -4], [8.5, -8], [5, -8], [5, -4]] }),
  C('ledger', 'Ms. Ledger (CEO Assistant)', 'mouse', 'blue', -4.5, 20.4, -32.5, 0.6, 'pent', ['Luna\'s schedule today: meetings, more meetings, and a nap she calls a "strategy session".', 'If Pi-rat asks, no, we can\'t buy a submarine. Again.'], { extras: ['glasses'] }),
  C('squeaks', 'Prof. Squeaks (Observer)', 'mouse', 'cocoa', 5.5, 0, -40.6, 3.0, 'obs', ['I study tests. Mostly I study the snacks during tests.', 'The best seat is the top row. The second best is "anywhere not near the fizz bomb."'], { extras: ['coat', 'glasses'] }),
  C('pippip', 'Pip-Pip (Delivery Mouse)', 'mouse', 'ginger', -16, 0, -8.6, 0, 'whall', ['Package for… uh… someone! I\'ll figure it out!', 'Fastest delivery mouse in the West Hall! It\'s a small competition.'], { extras: ['vest'], look: { vest: 0x2563eb }, walk: [[-16, -8.6], [-44, -8.6], [-44, -10.4], [-16, -10.4]] }),
  C('rivet', 'Rivet (Gadget Builder)', 'hamster', 'brownie', -42.5, 0, -22.2, 3.14, 'gadget', ['Tighten, tighten, tighten… oops. Too tight.', 'I\'m building a toaster that launches toast to your plate. From across the room.'], { hat: 'hardhat', act: 'work' }),
  C('sprocket', 'Sprocket (Gadget Builder)', 'rat', 'ginger', -33.5, 0, -22.4, 3.14, 'gadget', ['These goggles are for safety. And for looking cool. 50/50.', 'The jetpack prototype only went sideways once today!'], { hat: 'goggles', act: 'work' }),
  C('ooze', 'Dr. Ooze (Goo Scientist)', 'mouse', 'black', -24.6, 0, -22.6, 3.14, 'goo', ['Goo fact: 4 out of 5 goos prefer to be called "slime". The 5th is just shy.', 'My goo learned to wave! …No wait, that\'s the air conditioning.'], { extras: ['coat', 'glasses'], act: 'work' }),
  C('bubbles', 'Bubbles (Lab Assistant)', 'bunny', 'snowie', -15.5, 0, -20.6, -1.5, 'goo', ['I hold the beakers. It\'s an important job. Very important. Please don\'t bump me.', 'Have you jumped on the goo blob? Prof. Fizzwick calls it "research".'], { extras: ['coat'] }),
  C('nacho', 'Nacho (Snack Analyst)', 'hamster', 'gold', -36.3, 0, -2.4, 2.2, 'cafe', ['I analyse snacks. Results so far: delicious.', 'My cheeks can hold eleven crackers. Science!'], {}),
  C('brunch1', 'Basil (Lunch Break)', 'rat', 'ash', -33.1, 0, 5.4, -1.0, 'cafe', ['So I said to the cheese, "you\'re grate". It didn\'t laugh.', 'Did you hear Dr. Brie lost the Golden Gouda? Big drama!'], { act: 'chat', extras: ['tie'], look: { tie: 0x2563eb } }),
  C('brunch2', 'Clover (Lunch Break)', 'bunny', 'cream', -34.6, 0, 6.2, 2.1, 'cafe', ['Basil tells the same cheese joke every day. Every. Day.', 'I only eat the carrot cake. They make it just for me. And Pepper.'], { act: 'chat' }),
  C('clicky', 'Clicky (Data Entry)', 'mouse', 'rose', -20.5, 0, -2.6, 1.57, 'offices', ['Typing, typing, typing… I\'ve typed the word "cheese" 4,000 times today.', 'My mouse is a mouse. I\'m also a mouse. It\'s confusing.'], { extras: ['glasses'], act: 'work' }),
  C('memo', 'Memo (Office Manager)', 'rat', 'cocoa', -18.5, 0, -4.5, 0, 'offices', ['Meeting at 3! Meeting about the meeting at 2! Snacks at all times!', 'Has anyone seen the stapler? Gary has the stapler. GARY.'], { extras: ['tie'], look: { tie: 0x9333ea }, walk: [[-18.5, -4.5], [-18.5, 4.8]] }),
  C('zoom', 'Zoom (Courier Bunny)', 'bunny', 'gray', 16, 0, -8.6, 0, 'ehall', ['Hop hop hop! Can\'t chat! Okay, one second. Hi! Bye!', 'I deliver to Ruffsources. Candy always tips in treats. Treats I can\'t eat.'], { look: { rat: 'ash' }, extras: ['vest'], walk: [[16, -8.6], [44, -8.6], [44, -10.4], [16, -10.4]] }),
  C('volt', 'Volt (Robot Mechanic)', 'hamster', 'cream', 26.5, 0, -15.2, 3.14, 'robo', ['I oil Clanky Jr. every morning. He says "thank you" in beeps.', 'The pods? Mimi, Lily and Lili were built right there. I was the one who installed Lili\'s glitch. Kidding! …Mostly.'], { hat: 'hardhat', act: 'work' }),
  C('gruyere', 'Gruyère (Cheese Taster)', 'mouse', 'cream', 34, 0, -15.6, 3.6, 'cheese', ['Taste notes: nutty, creamy, a little bit sneaky.', 'Don\'t try Mystery Cheese #7 on an empty stomach. Or a full one.'], { extras: ['coat'], act: 'work' }),
  C('feta', 'Feta (Cheese Aging Expert)', 'rat', 'brownie', 41.5, 0, -24.4, 0, 'cheese', ['This wheel is 12 years old. Older than some of our interns!', 'I talk to the cheese so it ages happily. It\'s a real technique. I made it up.'], { extras: ['coat', 'glasses'] }),
  C('whiskers', 'Officer Whiskers (Security)', 'hamster', 'ash', 14.4, 0, -4.4, 0.8, 'security', ['Rocco\'s the boss. I\'m the muscle. The cute muscle.', 'Security tip: never leave cheese unattended. That\'s how we got into this mess.'], { extras: ['tie'], look: { tie: 0x1e3a8a } }),
  C('chill', 'Chill (Break Expert)', 'mouse', 'blue', 42.2, 0.6, 8.3, -2.5, 'lounge', ['Beanbags are the best invention in this whole building. Don\'t tell Pi-rat.', 'Zzz… oh! I\'m awake. I was "thinking with my eyes closed".'], { act: 'sit' }),
  C('pong1', 'Ace (Ping-Pong Champ)', 'rat', 'black', 36.6, 0, 1.5, 1.57, 'lounge', ['Wanna play? I\'m undefeated! Mostly because nobody plays me.', 'The ball went in the coffee machine again.'], { act: 'chat' }),
  C('pong2', 'Paddle (Ping-Pong Rookie)', 'hamster', 'ginger', 41.4, 0, 1.5, -1.57, 'lounge', ['I\'ve lost 87 games in a row. Game 88 is MINE.', 'Ace says he\'s undefeated. That\'s because I keep losing to him!'], { act: 'chat' }),
  C('crew', 'Boom (Launch Crew)', 'hamster', 'brownie', -25.5, 0, -88, 0.3, 'out', ['I\'m in charge of confetti. The rocket is just how we deliver it.', 'Ear muffs ready! Well, my ears are tiny, so ear… mini-muffs.'], { hat: 'hardhat', extras: ['vest'], look: { vest: 0xf97316 } }),
  C('sam', 'Safety Sam', 'bunny', 'cream', 44, 0, -57, 2.6, 'out', ['Rule #1: stay behind the yellow line. Rule #2: there is no yellow line, it\'s the fence.', 'The bunker has snacks. For safety reasons.'], { hat: 'hardhat', extras: ['vest'], look: { vest: 0xfacc15 } }),
  C('kibble', 'Kibble (Ruffsources Rat)', 'rat', 'gold', 66.5, 0, -5.8, -2.4, 'dcr', ['I\'m the only rat in Ruffsources. They gave me a tiny desk. And a tinier hard hat.', 'Candy is the best boss. She just wants everyone to be happy. And fed.'], { extras: ['tie'], look: { tie: 0xff4fa0 } }),
];
NPCS.push(...CROWD);

export const TORTUGA_NPCS = [
  { id: 'torty_ceo', n: 'Martina "Torty" (CEO, Tortuga Tech)', look: { rat: 'martina' }, at: [-54.2, 0, 1.3, 3.14], region: 'tortuga' },
  { id: 'luna_tt', n: 'Luna (CEO · Merger Tour)', look: { rat: 'luna', hat: 'crown', extras: ['tie'], tie: 0x7c3aed }, at: [-52.5, 0, -21.0, 0.2], region: 'tortuga' },
  { id: 'pirat_tt', n: 'Pi-rat (Chief Inventor)', look: { rat: 'pirat', hat: 'pirate', extras: ['patch'] }, at: [-66.2, 0, -18.5, -1.1], region: 'tortuga' },
  { id: 'snowie_tt', n: 'Snowie (Head of Fun)', look: { rat: 'snowie', hat: 'flower', extras: ['bow'], tie: 0xff4fa0 }, at: [-66.2, 0, -7.8, -1.1], region: 'tortuga' },
  { id: 'candy_tt', n: 'Candy (Head of Ruffsources)', look: { rat: 'candy', breed: 'schnauzer', s: 1.05 }, at: [-64.8, 0, -0.3, 0.2], region: 'tortuga' },
  { id: 'plato_tt', n: 'Plato (Chief Shell-Smith)', look: { rat: 'cocoa', hat: 'tortuga', extras: ['vest'], vest: 0x0f9d8a }, at: [-60.0, 0, -15.4, 0.5], region: 'tortuga' },
  { id: 'shelly_tt', n: 'Shelly (Tortuga Reception)', look: { rat: 'cream', sp: 'mouse', extras: ['headset', 'glasses'] }, at: [-47.3, 0, 0.5, -1.57], region: 'tortuga' },
  { id: 'ironshell_tt', n: 'Ironshell (Crush Engineer)', look: { rat: 'ash', sp: 'hamster', hat: 'hardhat', extras: ['vest'], vest: 0xf59e0b }, at: [-73.5, 0, -17.6, 0.7], region: 'tortuga' },
  { id: 'blaze_tt', n: 'Blaze (Plasma Tech)', look: { rat: 'ginger', hat: 'goggles', extras: ['coat'] }, at: [-73.5, 0, -6.8, 0.7], region: 'tortuga' },
];
if (tortugaOwned()) NPCS.push(...TORTUGA_NPCS);

function PI_2() { return Math.PI / 2; } function PI_() { return Math.PI; }
// ---------------------------------------------------------------- helpers
export const has = (k) => !!S.flags[k]; export const flag = (k) => { S.flags[k] = 1; persist(); };
const clues = (list) => list.filter((c) => S.clues[c]).length;
export const GOUDA_CLUES = ['case', 'cam', 'lost'], GARDEN_CLUES = ['flower', 'prints', 'blueprint'];
export function goudaStep() { const q = S.q.gouda | 0; if (q === 0) return 'Talk to Dr. Brie in Cheese R&D (east wing).';
  if (q === 1) return `Find clues: the empty display case, the security footage, Lost & Found (${clues(GOUDA_CLUES)}/3).`;
  if (q === 2) return S.keys.blue ? 'Open the pantry in the Cheese Café with your BLUE keycard.' : 'The trail leads to the café pantry. Get a BLUE keycard (Prof. Fizzwick, Goo Lab).';
  if (q === 3) return 'Bring the Golden Gouda back to Dr. Brie!'; return 'Solved! 🧀'; }

export function tortugaStep() {
  const tt = ensureTT();
  const done = (tt.tests.crush ? 1 : 0) + (tt.tests.plasma ? 1 : 0) + (tt.tests.crash ? 1 : 0);
  if (tt.damaged) return `⚠️ Shell Integrity cracked (${tt.integrity}%)! Repair at Plato's Shell-Armor Weld Bench in Tortuga Tech.`;
  if ((S.q.tortuga | 0) === 0 && done === 0) return 'Walk west through West Hall into Tortuga Tech Inc. and talk to Martina "Torty"!';
  if (done < 3) return `Certify all 3 Shell-Tough Test Chambers (Crush Press, Plasma Tunnel, Centrifuge: ${done}/3). Watch out for Over-Charge crashes!`;
  if ((S.q.tortuga | 0) < 4) return 'All 3 chambers certified! Talk to Martina "Torty" at her CEO Desk for your Tortuga Shell Helmet!';
  return `Certified Shell-Tough! 🐢 (Integrity ${tt.integrity}% · Repairs ${tt.repairs} · Bolts ${tt.scrap} ⚙️)`;
}

export function gardenStep() { const q = S.q.garden | 0; if (q === 0) return 'Visit Snowie in the Executive Suite (glass elevator in the lobby).';
  if (q === 1) return `Find clues: the mystery flower, sandy footprints, a blueprint (${clues(GARDEN_CLUES)}/3).`;
  if (q === 2) return S.keys.red ? 'Use the RED keycard on the boiler room in Robotics, then the freight lift.' : 'Ask Rocco in Security for the RED keycard.';
  if (q === 3) return 'Find whoever lives at the bottom of the freight lift…'; return 'Solved! 🌵'; }
// ---------------------------------------------------------------- talk
// returns { lines: [[speaker, text, mood?]], fx?: () => void }
export function talk(id, G) {
  const L = (...a) => a.map((x) => (Array.isArray(x) ? x : [null, x])); const n = (S.talks[id] = (S.talks[id] | 0) + 1); persist(); const cyc = (arr) => arr[(n - 1) % arr.length];
  switch (id) {
    case 'penny': return { lines: L(cyc(['Welcome to Ratita Industries! Where science meets cheese. Mostly cheese.', 'The glass elevator goes to the Executive Suite. Luna, Pi-rat and Snowie are up there!', 'Tests run in the yard all day. Tess in the Observation Deck can start one early!', 'Lost? The map kiosk is right there. Or just follow the smell of cheese.']), cyc(['Oh, and please don\'t lick the fountain.', 'Also, there are golden gears hidden EVERYWHERE. Collect them all!', 'Fun fact: our dog department is called Canine Ruffsources. Candy picked the name.', 'If you see a robo-vac acting guilty… that\'s normal. Probably.'])) };
    case 'luna': {
      const w = S.watched | 0; const lines = L(cyc(['Hey! Welcome to HQ! I built this company from one cheese crumb and a dream.', 'Being CEO is easy. I just say "make it shinier" and everyone does.', 'Did you see the rocket test? I pressed the button. Twice. They said once.']));
      if (w < 3) lines.push([null, `CEO challenge: watch 3 live tests in the yard (${w}/3). The Observation Deck has the best seats!`]);
      else if (!S.hats.hardhat) { lines.push([null, 'You watched 3 tests! You\'re practically on the safety team. Here, take this Hard Hat!']); return { lines, fx: () => G.giveHat('hardhat') }; }
      return { lines }; }
    case 'pirat': {
      const lines = L(cyc(['Arr! Welcome aboard the good ship Ratita Industries!', 'I invented the glider, the grapple, and the jetpack. The self-buttering toast… less good.', 'This eye patch? Lab accident. Kidding! I just think it looks cool.']));
      if (!S.flags.range) lines.push([null, 'Try my target test in the Gadget Lab! Blast 5 targets before time runs out and the Pirate Bandana be yours!']);
      else if (!S.hats.pirate) { lines.push([null, 'Ye aced the target test! Here be yer Pirate Bandana, matey!']); return { lines, fx: () => G.giveHat('pirate') }; }
      if ((S.q.garden | 0) >= 1 && !S.clues.blueprint) lines.push([null, 'A desert flower? Hmm… check my blueprint table in the Gadget Lab. I forget what I built down there.']);
      return { lines }; }
    case 'snowie': {
      const q = S.q.garden | 0;
      if (q === 0) return { lines: L('Hi hi hi! I\'m Snowie! I\'m in charge of fun!', 'But I have a MYSTERY. Every morning a desert flower appears on my desk. Who\'s leaving them?!', 'Will you find out? Look for clues! Start with the flower by my desk.'), fx: () => { S.q.garden = 1; persist(); G.toastMsg('🔎 New mystery: The Secret Gardener'); G.sfx('check'); } };
      if (q < 4) return { lines: L(cyc(['Any news about the flowers? ' + gardenStep(), 'The flowers smell like sunshine and sand. Weird, right?', 'Maybe it\'s a flower fairy. Or a VERY polite burglar.'])) };
      return { lines: L(cyc(['MARTINA?! She\'s been living under the building this whole time?! That\'s the best thing ever!', 'I\'m going to visit her every day. With lettuce. So much lettuce.'])) }; }
    case 'brie': {
      const q = S.q.gouda | 0;
      if (q === 0) return { lines: L(['Dr. Brie', 'Oh thank goodness, a detective! The GOLDEN GOUDA is gone! Our most precious cheese!', 'sad'], 'It was in the display case last night. This morning… just crumbs.', 'Please find it! Look at the case, ask Security about the cameras, and check Lost & Found.'), fx: () => { S.q.gouda = 1; persist(); G.toastMsg('🔎 New mystery: The Great Gouda Heist'); G.sfx('check'); } };
      if (q === 3) return { lines: L('Is that… THE GOLDEN GOUDA?! You found it!', 'Sweepy vacuumed it? Because it looked like a giant crumb? Oh, Sweepy.', 'You\'re a true cheese detective. Take this Chef Hat. You\'ve earned it!'), fx: () => { S.q.gouda = 4; persist(); G.solveGouda(); } };
      if (q === 4) return { lines: L(cyc(['The Golden Gouda is safe! I put a "NOT A CRUMB" sign on it for Sweepy.', 'Try the tasting bar! Today: Cheddar-Mint, Blue Banana, and Mystery Cheese #7.'])) };
      return { lines: L(cyc(['Any leads? ' + goudaStep(), 'I just know someone took it. Cheese doesn\'t just roll away. Well, wheels do. But not GOUDA.'])) }; }
    case 'fizz': {
      if (!S.flags.goo) return { lines: L('Greetings! Prof. Fizzwick, goo scientist. Today\'s goal: BOUNCY GOO!', 'Use the cauldron. The recipe is on my whiteboard. Mix it right and I\'ll give you a blue keycard!', 'Mix it wrong and… well, we have a mop.') };
      return { lines: L(cyc(['Your bouncy goo is still bouncing. Literally. It got out.', 'Next experiment: goo that tells jokes. Early results: the jokes are bad.', 'Try the goo blob in the corner! Jump on it! Science!'])) }; }
    case 'bolt': return { lines: L(cyc(['I test gadgets! Mostly by falling off things.', 'Use the green spring pad! It goes up to the high shelf. Something shiny is up there.', 'The target test station is right here. Press it, then BLAST! Five targets, twenty seconds!', 'Psst. There\'s a vent at the back that leads into the Goo Lab. Rat-sized!'])) };
    case 'gizmo': return { lines: L(cyc(['Welcome to Robotics! Mimi, Lily and Lili were all built in these pods!', 'Mimi was first. Lily was second. Lili was… a surprise. We ran out of blue paint.', 'Want to talk to them? The video call terminal is right by the door!', 'Bitsy, stop rolling in circles. Bitsy. BITSY.'])) };
    case 'rocco': {
      const q = S.q.garden | 0, g = S.q.gouda | 0;
      if (q >= 2 && !S.keys.red) { if (g < 4) return { lines: L('A RED keycard? That opens the old boiler room. Off limits!', 'Prove you\'re a real detective. Solve the Golden Gouda case first. Then we\'ll talk.') };
        return { lines: L('You solved the Gouda case. Fine. You\'re trustworthy.', 'Here\'s the RED keycard. The boiler room\'s in Robotics. Don\'t tell anyone I gave it to you.'), fx: () => G.giveKey('red') }; }
      return { lines: L(cyc(['Rocco. Security. I see everything. Except the Golden Gouda thief, apparently.', 'The cameras are on my desk. Help yourself. Don\'t touch the red button. It plays elevator music.', 'Nobody goes in the old boiler room. Nobody.'])) }; }
    case 'dusty': return { lines: L(cyc(['Mailroom! I sort 400 packages a day. 399 of them are cheese.', 'Lost & Found is over there. Last week someone lost a whole sandwich. Still there.', 'Zippy keeps running laps in the West Hall. He says it\'s "delivering". I say it\'s exercise.'])) };
    case 'chef': return { lines: L(cyc(['Bonjour! Today\'s menu: cheese, cheese soup, and cheese surprise. The surprise is cheese.', 'Help yourself to the fondue fountain! But don\'t jump in. Again.', 'Someone keeps stealing crumbs from my pantry… and I hear a little vroom-vroom at night.'])) };
    case 'gary': {
      if (!S.flags.mug && !S.flags.mugGot) return { lines: L('Hi! I\'m Gary, the intern! First week! Going great!', 'Except… I lost my lucky coffee mug. It\'s yellow. I think I left it somewhere I watched a test…', 'If you find it, I\'ll owe you forever!') };
      if (S.flags.mugGot && !S.flags.mug) return { lines: L('MY MUG! You found it! You\'re the best!', 'Here, have my secret stash of golden gear stickers. Er… I mean, my thanks!'), fx: () => { S.flags.mug = 1; persist(); G.badge('mug'); G.sfx('win'); } };
      return { lines: L(cyc(['My mug and I are never parting again.', 'Marge says I\'m doing great. Marge also says that to the printer.'])) }; }
    case 'marge': return { lines: L(cyc(['Accounting. This quarter we spent 92% of the budget on cheese. The other 8% was more cheese.', 'Did you hear music coming from the corner? I don\'t go near there. Too much dancing.', 'The copier makes copies. Mostly of Pi-rat\'s face.'])) };
    case 'tess': return { lines: L(cyc(['Tess, Test Director! The best seats for live tests are right here.', 'Want to start a test now? Use the test control console. Big red button!', 'Today\'s schedule: rocket launch, robot trials, cheese catapult, goo cannon, and the FIZZ BOMB. Totally safe. Mostly confetti.'])) };
    case 'sparky': return { lines: L(cyc(['Launch crew! I count down from ten. I usually get to seven before I get excited.', 'The rocket always comes back down on its parachute. Usually on the pad. Usually.', 'Climb the gantry if you\'re brave. Someone left something shiny at the top.'])) };
    case 'nibbles': return { lines: L(cyc(['I\'m on my break. I\'ve been on my break since Tuesday.', 'High score on Cheese Invaders: me. Second place: also me.', 'The dress-up locker has hats you unlock. I\'m saving up for the crown.'])) };
    case 'pip': return { lines: L(cyc(['Zzz… five more minutes… zzz.', 'Zzz… no Sweepy, that\'s not a crumb… zzz…', 'Zzz… the… flowers… downstairs… zzz.'])) };
    case 'zippy': return { lines: L(cyc(['Can\'t stop! Delivering! Delivering what? DOESN\'T MATTER!', 'Have you seen sandy footprints? Big ones. Slow ones. I almost tripped!', 'Fastest rat in the building! Well, after Luna.'])) };
    case 'gate': return { lines: L(cyc(['I water the flower beds. Somebody else waters desert flowers though… I never see who.', 'There\'s a ladder on the west wall up to the roof. Lovely view. Don\'t tell Rocco.', 'Beautiful day! It\'s always a beautiful day at HQ. We installed it.'])) };
    case 'candy': {
      const t = S.toys ? S.toys.length : 0;
      if (t >= 3 && !S.flags.toys) return { lines: L('WOOF! You found all 3 of my squeaky toys!', 'By order of Canine Ruffsources, you are now an Official Good Rat. Here\'s your badge!'), fx: () => { S.flags.toys = 1; persist(); G.badge('toys'); G.sfx('win'); } };
      if (!S.flags.toys) return { lines: L(cyc(['Woof! Welcome to the Department of Canine Ruffsources! I\'m Candy, head of Ruffsources.', 'Our policy: belly rubs are mandatory. Treats are a basic right.']), `I lost my 3 squeaky toys somewhere on campus! (${t}/3 found) Bring them back and I\'ll make you an Official Good Rat!`) };
      return { lines: L(cyc(['Woof! You\'re a Good Rat! It says so on your badge.', 'Today\'s meeting agenda: 1. Treats. 2. More treats. 3. Nap.', 'Biscuit handles paperwork. Pepper handles treats. I handle… everything else. Woof.'])) }; }
    case 'biscuit': return { lines: L(cyc(['Woof. I\'m filling out Form 27B: "Request for an Extra Walk."', 'Forms are fun! Especially when you chew them.', 'Ruffsources rule #1: Everyone is a good boy. Even the rats.'])) };
    case 'pepper': return { lines: L(cyc(['I\'m the Treat Officer. Treats are given out for being good. Everyone is good. I am out of treats.', 'Have you tried the ball pit? It\'s for meetings. Very serious meetings.'])) };
    case 'sweepy': {
      const q = S.q.gouda | 0;
      if (q === 2) return { lines: L(['Sweepy', '*beep boop* …*nervous beeping*', 'sad'], 'You open Sweepy\'s dust bin. Inside: the GOLDEN GOUDA, plus three buttons and a sock.', 'Sweepy thought it was a really big crumb. *sad beep*'), fx: () => { S.q.gouda = 3; persist(); G.gotGouda(); } };
      return { lines: L(cyc(['*beep* *whirr* (Sweepy is very busy cleaning.)', '*happy beep* (Sweepy found a crumb!)', '*boop?* (Sweepy bumps into your foot. Twice.)'])) }; }
    case 'bitsy': return { lines: L(cyc(['*bleep!* (Bitsy spins in a happy circle.)', '*blip blip* (Bitsy shows you a tiny thumbs up.)', '*bweee* (Bitsy is trying to say "hello" in binary.)'])) };

    case 'torty_ceo': {
      const tt = ensureTT();
      const done = (tt.tests.crush ? 1 : 0) + (tt.tests.plasma ? 1 : 0) + (tt.tests.crash ? 1 : 0);
      if (tt.damaged) {
        return { lines: L(
          ['Martina "Torty"', `Oh dear! Your ${tt.brokenGadget || 'Shell Rig'} has a cracked carapace (${tt.integrity}% integrity)!`, 'sad'],
          'In Tortuga Tech, test crashes and Over-Charges cause real shell damage and slow you down.',
          'Head over to Plato\'s Shell-Armor Repair Bench in the north lab! And if you ever run out of Scrap Bolts, the Free Scrap Bin right next to him always has spares!'
        ) };
      }
      if ((S.q.tortuga | 0) === 0 && done < 3) {
        return {
          lines: L(
            ['Martina "Torty"', 'Welcome to Tortuga Tech Inc.! We attached our building right onto Ratita HQ\'s West Wing!', 'happy'],
            'Luna, Pi-rat, Snowie, Candy and I combined Ratita inventions with desert-tortoise carapace armor.',
            `Certify all 3 of our Shell-Tough Test Chambers (${done}/3 so far): the 50-Ton Crush Press, the Plasma Tunnel, and the Bumper-Shell Centrifuge!`,
            'Be careful: if a chamber Over-Charges or you step onto an active hazard pad, your Shell Rig will crack and need welding at Plato\'s Repair Bench!'
          ),
          fx: () => { S.q.tortuga = 1; persist(); G.toastMsg('🐢 New DLC Mission: Tortuga Tech Certification!'); G.sfx('check'); }
        };
      }
      if (done >= 3 && (S.q.tortuga | 0) < 4) {
        return {
          lines: L(
            ['Martina "Torty"', 'Incredible! You certified all 3 Shell-Tough Test Chambers!', 'happy'],
            'Our Ratita × Tortuga crossover gadgets are officially 100% shell-tough—even against Candy\'s jaws and Pi-rat\'s 50-ton press!',
            'As CEO of Tortuga Tech Inc., I hereby award you the Tortuga Shell Helmet and the Shell-Tough Engineer Badge!'
          ),
          fx: () => { S.q.tortuga = 4; persist(); G.solveTortuga(); }
        };
      }
      return { lines: L(cyc([
        `Tortuga Tech status: ${done}/3 chambers certified, Shell Integrity ${tt.integrity}%, and ${tt.scrap} Scrap Bolts in your pouch!`,
        'Slow and steady wins the race—unless you strap Pi-rat\'s jetpack onto a tortoise shell. Then fast and steady wins!',
        'Use the Crossover Gadget Console anytime to switch your active Tortuga gadget or run Over-Charge stress tests!'
      ])) };
    }
    case 'luna_tt': {
      const tt = ensureTT();
      return { lines: L(
        ['Luna (CEO)', cyc([
          'Look at this merger! We bolted Tortuga Tech right onto our West Wing and ran twin crossover conduits across the roof!',
          'This automated conveyor stamps hexagonal Tortuga scutes onto Ratita gadgets. Shiny AND indestructible!',
          `Your Shell Integrity is at ${tt.integrity}%. If Pi-rat\'s crush press cracks your gear, Plato\'s weld bench will fix it right up!`
        ])],
        'Between Ratita cheese tech and Torty\'s carapace engineering, nothing can stop us now!'
      ) };
    }
    case 'pirat_tt': {
      return { lines: L(
        ['Pi-rat (Chief Inventor)', cyc([
          'Arr! Feast yer eye on Chamber 1: me 50-Ton Hydraulic Crush Press!',
          'Before Torty moved in, me jetpacks crumpled whenever I crash-landed. Now with hex-scute plating, they bounce right back!',
          'Dare to run an OVER-CHARGE test at the console? Higher scrap reward, matey, but if the pressure spikes, yer shell rig will crack and spark until Plato welds it!'
        ])]
      ) };
    }
    case 'snowie_tt': {
      return { lines: L(
        ['Snowie (Head of Fun)', cyc([
          'Hi hi! Martina isn\'t hiding underground anymore—she has her own whole wing AND a sunny basking desk!',
          'Chamber 2 blasts gadgets with 900°C solar plasma AND Mojave desert sand! It\'s like a beach day, but spicier!',
          'Don\'t stand inside the plasma coils when they fire unless you want a cracked shell and a trip to Plato\'s repair bench!'
        ])]
      ) };
    }
    case 'candy_tt': {
      return { lines: L(
        ['Candy (Head of Ruffsources)', cyc([
          'WOOF! Canine Ruffsources is on the East Wing, and now Tortuga Tech is on the West Wing! Best neighbors ever!',
          'I\'m in charge of Chamber 3\'s Ultimate Durability Test: the 88 MPH Bumper-Shell Centrifuge AND my Schnauzer Bite Rig!',
          'I chewed on the Bumper-Shell Pod for twenty minutes. Not a single dent! 10/10, very crunchy, approved by Candy!'
        ])]
      ) };
    }
    case 'plato_tt': {
      const tt = ensureTT();
      if (tt.damaged || tt.integrity < 100) {
        return {
          lines: L(
            ['Plato (Chief Shell-Smith)', `Whoa there, intern! Your ${tt.brokenGadget || 'Shell Rig'} is cracked (${tt.integrity}% integrity)!`],
            'Let me fire up the plasma welder and patch those hexagonal scutes for you right now!'
          ),
          fx: () => G.app.ui.tortugaLab(G, 'repair')
        };
      }
      return { lines: L(
        ['Plato (Chief Shell-Smith)', cyc([
          'I\'m Plato, Chief Shell-Smith! If a test chamber Over-Charges or you get clipped by the 50-ton press, bring your cracked gear to my weld bench.',
          'Short on Scrap Bolts? Never worry—the Free Scrap Recycling Bin right beside my bench always has spare bolts so you\'re never stuck!',
          'A well-oiled carapace is a happy carapace!'
        ])]
      ) };
    }
    case 'shelly_tt': return { lines: L(['Shelly (Tortuga Reception)', cyc([
      'Welcome to Tortuga Tech Inc., proudly attached to Ratita Industries HQ!',
      'Martina "Torty" is right over at her Terrarium CEO Desk, and all 3 Shell-Tough Test Chambers are open to the west!',
      'Help yourself to the Crispy Lettuce & Gouda Snack Bar!'
    ])]) };
    case 'ironshell_tt': return { lines: L(['Ironshell (Crush Engineer)', cyc([
      'Chamber 1 drops a 50-ton steel anvil straight onto the test pedestal. Standard mode is 85% safe; Over-Charge mode is… exciting!',
      'Keep your paws off the yellow hazard pad while the ram is dropping!'
    ])]) };
    case 'blaze_tt': return { lines: L(['Blaze (Plasma Tech)', cyc([
      'Chamber 2 simulates atmospheric re-entry plus a Mojave sandstorm at the same time!',
      'If the thermal coils overload, your gadget casing will crack—head to Plato\'s bench for a quick weld!'
    ])]) };

    case 'martina': {
      const q = S.q.garden | 0;
      if (q < 4) return { lines: L(['Martina', 'Oh! A visitor! Nobody ever comes down here!', 'happy'], 'I\'m Martina. Pi-rat built me this desert dome ages ago, and then I guess everyone forgot.', 'I grow desert flowers. Every morning I ride the freight lift up and leave one for Snowie. She always looks so happy!', 'You found my secret! Here, take a flower. And please tell Snowie she can visit anytime!'), fx: () => { S.q.garden = 4; persist(); G.solveGarden(); } };
      return { lines: L(cyc(['Take your time. Tortoises always do.', 'My cactus friend is named Kevin. Say hi to Kevin.', 'Snowie brought me lettuce! The best day of my life. Well, top 10. I\'m 80.'])) }; }
  }
  const d = NPCS.find((q) => q.id === id); if (d && d.lines) return { lines: L(cyc(d.lines), cyc(d.lines.slice().reverse())).filter((x, i, a) => i === 0 || x[1] !== a[0][1]) };
  return { lines: L('…') };
}
// ---------------------------------------------------------------- clues
export function clueText(id) { return {
  case: 'The glass case is EMPTY. A trail of crumbs and two thin wheel tracks lead out the door. Tiny wheels…',
  cam: 'Security footage, 3:00 AM: something small, round and beeping zooms past, carrying a gold blob. It heads into the café!',
  lost: 'Lost & Found: three buttons, a sock, and a note: "Sweepy\'s nest is in the café PANTRY. Please stop sending him here." Hmm!',
  flower: 'An orange desert flower. Still has warm sand on its stem. There is no desert anywhere near here…',
  prints: 'Big, round, slow footprints in the sand. Four toes. Definitely NOT a rat. They go toward the labs…',
  blueprint: 'Pi-rat\'s blueprint: "PROJECT DOME: underground desert garden for a special friend. Access: boiler room freight lift (RED keycard)."',
  tortuga: 'Ratita × Tortuga Merger Blueprint: "West Wing wall opened at x = -46. All 3 Shell-Tough Chambers online. Warning: Chamber Over-Charges crack Shell Integrity—repair at Plato’s Weld Bench (free spare bolts in the bin beside it)!"',
}[id]; }
export function clueQuest(id) { return GOUDA_CLUES.includes(id) ? 'gouda' : 'garden'; }
// ---------------------------------------------------------------- video calls
export const CALLERS = {
  mimi: { n: 'Mimi', home: 'Grok Arcade', col: '#5ef2ff', hi: ['Hi hi! Mimi here, live from the Grok Arcade! 💖', 'Oh! A call from HQ! Is that where I was BUILT? Say hi to my old pod!'],
    jokes: ['Why did the robot go on vacation? It needed to recharge! Hehe!', 'I tried to eat cheese once. It got stuck in my speaker. Don\'t tell Gus.', 'What\'s a robot\'s favorite snack? Micro-chips!'] },
  lily: { n: 'Lily', home: 'Retro Arcade', col: '#c4b5fd', hi: ['Lily here, from the Retro Arcade. Back in MY day, calls were in 8-bit.', 'Oh, hello! Is Gizmo still rolling Bitsy around? Tell him I said hi.'],
    jokes: ['Why do retro games never get lost? They always have a map in the manual.', 'I\'m not old, I\'m VINTAGE. There\'s a difference.', 'What did the old joystick say? "I\'m feeling a little left out." Ha!'] },
  lili: { n: 'Lili', home: 'Ratita Preview Center', col: '#5eead4', hi: ['Lili here! Calling from the Preview Center. The Time Jumper is only smoking a LITTLE.', 'Hey cousin! Er, cousin\'s friend! Want to hear what\'s coming soon?'],
    jokes: ['The Time Jumper sent me to yesterday. I already knew this joke.', 'My cousins say I\'m a glitch. I say I\'m a FEATURE.', 'I tried to preview tomorrow\'s lunch. It was cheese. It\'s always cheese.'] },
};
export function callHint() { const g = S.q.gouda | 0, q = S.q.garden | 0;
  if (g < 4) return 'Hint: ' + goudaStep(); if (q < 4) return 'Hint: ' + gardenStep();
  if ((S.toys || []).length < 3) return 'Hint: Candy lost 3 squeaky toys: one in the Break Lounge, one in the test yard, one by the café fondue.';
  return 'Hint: there are golden gears on the roof, up the rocket gantry, and in Pi-rat\'s treasure corner. Go get them all!'; }
