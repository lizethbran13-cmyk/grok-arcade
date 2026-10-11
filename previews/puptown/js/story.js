// Pup Town townsfolk, what they say, side tasks and the mystery "Who stole the Golden Bone?". Pure data + helpers.
import { S, persist } from './save.js';
const PI = Math.PI;
export const HATS = [
  { id: 'none', n: 'No Hat', how: 'Always yours' }, { id: 'ears', n: 'Puppy Ears Headband', how: "Find Candy's 3 squeaky toys" }, { id: 'fire', n: 'Fire Helmet', how: 'Rescue Mittens the kitten' },
  { id: 'flower', n: 'Sunflower', how: "Plant Martina's 4 sunflowers" }, { id: 'visor', n: 'Fetch Visor', how: 'Score 60+ at fetch' }, { id: 'chef', n: 'Baker Hat', how: 'Bake 3 perfect treats' },
  { id: 'party', n: 'Party Hat', how: 'Find 12 golden biscuits' }, { id: 'detective', n: 'Detective Hat', how: 'Solve the Golden Bone mystery' }, { id: 'wizard', n: 'Wizard Hat', how: 'Find 5 secrets' },
  { id: 'crown', n: 'Gold Crown', how: 'Every biscuit + the mystery' },
];
export const BADGES = { bone: '🦴 Golden Bone Detective', toys: '🧸 Candy\'s Best Friend', kitten: '🐱 Kitten Rescuer', garden: '🌻 Green Paws', fetch: '🎾 Fetch Champ', agility: '🏁 Agility Ace', groom: '🛁 Fluff Master', bake: '🧁 Star Baker', barkade: '🕹️ Barkade Legend', rats: '🐀 Ratita Welcome Crew', bus: '🚌 Dog-Bus Rider', secrets: '🗝️ Secret Sniffer', bisc: '🍪 Biscuit Collector' };
// look: { b: breed, hat, neck, neckC, hatC, glasses, s: scale, tint } | { rat } | { martina } | { kitten }
// at: [x, z, yaw] (y comes from the ground) ; mode: idle | sit | play | sleep ; walk: patrol points
const N = (id, n, look, at, region, o = {}) => Object.assign({ id, n, look, at, region }, o);
export const NPCS = [
  N('mayor', 'Mayor Biscuit (Corgi)', { b: 'corgi', hat: 'top', neck: 'sash', s: 1.15 }, [0, -39.6, 0], 'hall', { y: 0.72 }),
  N('penny', 'Penny (Town Clerk)', { b: 'dachshund', glasses: true, neck: 'bowtie', neckC: 0x7c3aed }, [6.4, -30.6, -PI / 2], 'hall'),
  N('croissant', 'Chef Croissant (Poodle)', { b: 'poodle', hat: 'chef', neck: 'apron', s: 1.1 }, [-35.2, -8.2, PI / 2], 'bakery'),
  N('muffin', 'Muffin (Baker\'s Helper)', { b: 'pug', hat: 'chef', neck: 'apron', neckC: 0xff8fb1 }, [-38, -6.2, PI / 2], 'bakery'),
  N('pepper', 'Pepper (Beagle)', { b: 'beagle', neck: 'bandana', neckC: 0xdc2626 }, [-29.4, -3.6, PI], 'bakery', { mode: 'sit' }),
  N('daisy', 'Daisy (Customer)', { b: 'golden', hat: 'flower', tint: { fur: 0xf6dfa9, light: 0xfff4d6 } }, [-29.5, -10.8, PI], 'bakery', { mode: 'sit' }),
  N('suds', 'Suds (Groomer)', { b: 'sheepdog', neck: 'apron', neckC: 0x22d3ee }, [-34.6, 11.8, PI / 2], 'groomer'),
  N('rascal', 'Rascal (Chihuahua)', { b: 'chihuahua', neck: 'bandana', neckC: 0x3b82f6 }, [-38.4, 8.4, PI / 2], 'groomer', { mode: 'sit', y: 0.45 }),
  N('duchess', 'Duchess (Poodle)', { b: 'poodle', hat: 'crown', tint: { fur: 0xe9d5ff, light: 0xf5edff, dark: 0xd8b4fe } }, [-35.4, 18.6, PI], 'groomer', { mode: 'sit', y: 0.45 }),
  N('fifi', 'Princess Fifi (Pomeranian)', { b: 'pomeranian', hat: 'bow', s: 1.1 }, [20.4, -31.0, -PI / 2], 'barkade'),
  N('ace', 'Ace (Husky)', { b: 'husky', hat: 'cap', hatC: 0xff4fa0 }, [29.4, -31.0, PI / 2], 'barkade'),
  N('pixel', 'Pixel (Pup)', { b: 'pupcorgi', hat: 'beanie', hatC: 0x22d3ee, tint: { fur: 0x8a9099, dark: 0x4b5058 } }, [25, -36.6, PI], 'barkade', { mode: 'play' }),
  N('sparky', 'Chief Sparky (Dalmatian)', { b: 'dalmatian', hat: 'fire', s: 1.08 }, [30.4, -12.2, -PI / 2 + 0.5], 'fire'),
  N('blaze', 'Rookie Blaze (Lab)', { b: 'lab', hat: 'fire', tint: { fur: 0xe8c27a, dark: 0xc9a05a, light: 0xf3d9a4 } }, [36.6, -3.9, PI], 'fire'),
  N('smokey', 'Smokey (Dachshund)', { b: 'dachshund', hat: 'helmet', hatC: 0xdc2626, tint: { fur: 0x2b2b30, dark: 0x1f1f24, light: 0xb5733a } }, [37.8, -12.2, 0], 'fire'),
  N('hush', 'Professor Hush (Librarian)', { b: 'basset', glasses: true, neck: 'bowtie', neckC: 0x16a34a }, [-30.6, -29.2, PI / 2], 'library'),
  N('page', 'Page (Bookworm)', { b: 'collie', glasses: 0xff4fa0, neck: 'scarf', neckC: 0xff8a3d }, [-24.4, -29.8, PI], 'library', { mode: 'sit' }),
  N('scout', 'Scout (Beagle)', { b: 'beagle', hat: 'grad', tint: { fur: 0xc98a4a } }, [-21.5, -35.4, PI], 'library', { mode: 'sit' }),
  N('martina', 'Martina (Desert Tortoise)', { martina: 1 }, [36.6, 17.2, PI + 0.6], 'garden'),
  N('sunny', 'Sunny (Shop Helper)', { b: 'golden', hat: 'straw' }, [30.6, 7.6, PI / 2], 'garden'),
  N('clover', 'Clover (Shiba)', { b: 'shiba', neck: 'scarf', neckC: 0x16a34a }, [33, 11.4, 0], 'garden', { walk: [[29.5, 11.2], [36.5, 11.2], [36.5, 14.6], [29.5, 14.6]] }),
  N('candy', 'Candy (Mini Schnauzer)', { b: 'schnauzer', s: 1.05 }, [-37.8, 34, PI / 2], 'candy', { y: 0.2 }),
  N('nugget', 'Nugget (Puppy)', { b: 'pupcorgi', hat: 'party', s: 0.9 }, [-36.6, 51.2, 0.5], 'out', { hidden: true }),
  N('rex', 'Rex (Golden Retriever)', { b: 'golden', neck: 'bandana', neckC: 0x2563eb }, [13.4, 50.6, PI], 'out'),
  N('dash', 'Coach Dash (Border Collie)', { b: 'collie', hat: 'cap', hatC: 0xf97316, neck: 'bandana', neckC: 0xf97316 }, [-16.8, 29.6, 0.4], 'out'),
  N('duke', 'Duke (Great Dane)', { b: 'greatdane', neck: 'bowtie', neckC: 0xdc2626, s: 1.15 }, [4.0, 41.5, -1.2], 'out'),
  N('biscotti', 'Biscotti (Pup)', { b: 'pupcorgi', tint: { fur: 0xf6d38f } }, [12, 36, 0], 'out', { mode: 'play', run: [12, 36.5, 4.2] }),
  N('bean', 'Bean (Pug Pup)', { b: 'pug', s: 0.8 }, [14, 36, 0], 'out', { mode: 'play', run: [12, 36.5, 4.2], phase: PI }),
  N('rover', 'Rover (Lab)', { b: 'lab' }, [16.8, 32.8, -0.7], 'out', { mode: 'play' }),
  N('coco', 'Coco (Artist)', { b: 'poodle', hat: 'beret', hatC: 0xdc2626, tint: { fur: 0x2b2b30, light: 0x4b4b52, dark: 0x1f1f24 } }, [-5.0, -11.6, PI + 0.5], 'out'),
  N('ziggy', 'Ziggy (Shiba)', { b: 'shiba', hat: 'beanie', hatC: 0x7c3aed }, [11, 11, 0], 'out', { walk: [[11.5, 11.5], [-11.5, 11.5], [-11.5, -11.5], [11.5, -11.5]] }),
  N('gus', 'Old Gus (Basset)', { b: 'basset', hat: 'straw', tint: { fur: 0x9ca3af, light: 0xf3f4f6 } }, [-6.8, 6.9, -2.3], 'out', { mode: 'sit' }),
  N('peanut', 'Peanut (Pupsicle Seller)', { b: 'chihuahua', hat: 'cap', hatC: 0xff8fc8, tint: { fur: 0x9a6a42, light: 0xd8b48a } }, [-8.3, 5.2, PI / 2 + 0.4], 'out'),
  N('waffles', 'Waffles (Mail Carrier)', { b: 'corgi', hat: 'cap', hatC: 0x1e3a8a, neck: 'vest', neckC: 0x1e3a8a, tint: { fur: 0xc98a4a } }, [-25, 0, 0], 'out', { walk: [[-25, 22], [-25, -25], [25, -25], [25, 22]] }),
  N('lola', 'Lola (Jogger)', { b: 'dalmatian', neck: 'scarf', neckC: 0xff4fa0, tint: { spots: 0x8b4513 } }, [0, 23.5, PI / 2], 'out', { walk: [[-22, 24.5], [22, 24.5], [22, 26], [-22, 26]] }),
  N('pancake', 'Pancake (Tourist)', { b: 'pug', hat: 'straw', neck: 'scarf', neckC: 0x22c1c3 }, [3.4, 7.2, PI + 0.5], 'out'),
  N('bruno', 'Bruno (Bulldog)', { b: 'bulldog', hat: 'cap', hatC: 0x16a34a }, [6.5, 25.6, PI], 'out', { mode: 'sit' }),
  N('luna', 'Luna (Ratita Industries CEO)', { rat: 'luna', hat: 'crown' }, [-2.2, 8.2, PI + 0.3], 'out'),
  N('pirat', 'Pi-rat (Chief Inventor)', { rat: 'pirat', hat: 'pirate', extras: ['patch'] }, [-0.4, 8.6, PI], 'out'),
  N('snowie', 'Snowie (Head of Fun)', { rat: 'snowie', hat: 'flower', extras: ['bow'] }, [1.4, 8.3, PI - 0.3], 'out'),
  N('mittens', 'Mittens (Kitten)', { kitten: 1 }, [18.76, 62.84, PI], 'out', { y: 7.8 }),
];
export const BONE_CLUES = ['case', 'flour', 'card', 'hole', 'log'];
const CLUE_TEXT = {
  case: 'The Golden Bone\'s case was opened from BELOW, by someone tiny enough to squeeze under the velvet rope. Tiny paw prints covered in gold glitter lead out the door.',
  flour: 'Floury puppy-sized paw prints by the bakery window, and Chef Croissant\'s order book says: "1 birthday pupcake. Pick-up: SECRET. Signed: a tiny paw print and the letter N."',
  card: 'Library checkout cards: "How to Wrap a Present (for Dogs)" and "Digging for Beginners". Both stamped with a tiny paw print and a wobbly letter N.',
  hole: 'A fresh hole under the big oak with the Golden Bone\'s pink ribbon in it! Something was buried here… and dug up again. Little paw prints head toward the houses.',
  log: 'Chief Sparky\'s lookout log, 6:02 am: "Small orange fluffball wearing a PARTY HAT carrying something shiny down Maple Lane, toward Candy\'s house. Suspiciously happy."',
};
export function clueText(id) { return CLUE_TEXT[id] || id; }
export const SUSPECTS = [{ id: 'pepper', n: 'Pepper the beagle', why: 'Loves treats, loves digging', by: 'croissant' }, { id: 'rascal', n: 'Rascal the chihuahua', why: 'Famous prankster', by: 'suds' }, { id: 'fifi', n: 'Princess Fifi', why: 'Loves anything shiny', by: 'ace' }];
export function boneStep() { const q = S.q.bone | 0, n = BONE_CLUES.filter((c) => S.clues[c]).length;
  if (q === 0) return 'Mayor Biscuit needs help! Visit Town Hall.'; if (q === 1) return `Find clues about the Golden Bone (${n}/5). Ask the townsfolk!`;
  if (q === 2) return 'Tiny paws, the letter N, a party hat… head to Candy\'s backyard on Maple Lane!'; if (q === 3) return 'Bring the Golden Bone back to Mayor Biscuit at Town Hall!'; return 'Case closed! Party in the square!'; }
export function sideTasks() { return [[S.flags.toys, `Find Candy's 3 squeaky toys (${S.toys.length}/3)`], [S.flags.kitten, 'Rescue Mittens from the tall tree in Paw Park'], [S.flags.garden, `Plant Martina's sunflowers (${S.plants.length}/4)`],
  [S.flags.fetch, `Score 60+ at fetch with Rex (best ${S.best.fetch | 0})`], [S.flags.agility, `Finish the agility course in under 40 s (best ${S.best.agility ? S.best.agility.toFixed(1) + ' s' : '--'})`], [S.flags.groom, 'Groom a pup at Fluff & Puff'],
  [(S.best.bake | 0) >= 3, `Bake 3 perfect treats (best ${S.best.bake | 0}/3)`], [S.flags.barkade, 'Beat a high score at the Barkade'], [Object.keys(S.rats).length >= 3, `Say hi to the Ratita founders (${Object.keys(S.rats).length}/3)`], [S.flags.bus, 'Ride the Dog-Bus']]; }
export function talk(id, G) {
  const L = (...a) => a.map((x) => (Array.isArray(x) ? x : [null, x])); const n = (S.talks[id] = (S.talks[id] | 0) + 1); persist(); const cyc = (arr) => arr[(n - 1) % arr.length]; const q = S.q.bone | 0;
  const suspect = (sid, lines) => { S.sus[sid] = Math.max(S.sus[sid] | 0, 1); persist(); return { lines: L(...lines), fx: () => G.toastMsg(S.sus[sid] >= 2 ? '✅ Alibi confirmed!' : '📝 Alibi noted in your journal') }; };
  const confirm = (sid) => { if ((S.sus[sid] | 0) === 1) { S.sus[sid] = 2; persist(); return true; } return false; };
  switch (id) {
    case 'mayor': {
      if (q === 0) return { lines: L('Oh! A visitor! Welcome to Pup Town! I\'m Mayor Biscuit. I\'d give you a tour but… we have a CRISIS.', 'The GOLDEN BONE is missing! The symbol of our town! It was right there in its case this morning!', 'The whole town is in a tizzy. Will you be our detective? Look for clues all over town and talk to everyone!', 'Start with the empty display case. And watch out for suspicious characters!'), fx: () => { S.q.bone = 1; persist(); G.toastMsg('🔎 New mystery: Who stole the Golden Bone?'); G.sfx('check'); G.hud.dirty = true; } };
      if (q === 1 || q === 2) return { lines: L(cyc(['Any luck, detective? ' + boneStep(), 'I haven\'t slept a wink. Well, I napped. Corgis nap. But it was a WORRIED nap.', 'Without the Golden Bone, who will we polish on Tuesdays?!'])) };
      if (q === 3) return { lines: L('Is that… THE GOLDEN BONE?! You found it!', 'Nugget took it? For CANDY\'S BIRTHDAY? Oh, that silly sweet pup. How can I be mad at that?', 'Detective, you\'ve saved the day. I hereby declare… A BIRTHDAY PARTY IN THE TOWN SQUARE! For Candy!'), fx: () => G.solveBone() };
      return { lines: L(cyc(['Our town hero! The party is still going in the square. Have you tried the cake?', 'The Golden Bone is back where it belongs. With a new sign: "PLEASE ASK BEFORE BORROWING".', 'Candy says it\'s her best birthday ever. Nugget says it was HIS idea. Both are correct.'])) }; }
    case 'penny': return { lines: L(cyc(['Town Hall, Penny speaking! Oh, you\'re not a phone. Hello!', 'I keep the town records. Did you know Pup Town has 47 fire hydrants? I named them all.', 'The Dog-Bus runs round the square all day. Hop on at a bus stop!']), q >= 1 && q < 3 ? 'The mayor\'s been pacing so much he wore a groove in the carpet. Please find that bone!' : cyc(['Don\'t forget to collect golden biscuits! They\'re hidden all over town.', 'Have you been to the Barkade? I hold the record on Bone Stacker. Don\'t tell Ace.'])) };
    case 'croissant': { const lines = L(cyc(['Bonjour! Welcome to Bone Appétit, the finest bakery in Pup Town! Also the only one.', 'Today\'s special: pupcakes with peanut butter frosting. Magnifique!', 'A good treat needs three things: love, butter, and more butter.']));
      if (confirm('pepper')) lines.push([null, 'Pepper? She\'s been here since I opened at dawn! Ate eleven cookies. She could not have left. She could barely MOVE.']);
      if (q >= 1 && !S.clues.flour) lines.push([null, 'Strange thing this morning: floury paw prints by my back window, and a very odd order in my book. Take a look!']);
      if ((S.best.bake | 0) < 3) lines.push([null, 'Want to help? Use my decorating table in the back to make treats for the customers!']); else if (!S.hats.chef) { lines.push([null, 'Three perfect treats! You are a true artiste. Wear this with pride!']); return { lines, fx: () => G.giveHat('chef') }; }
      return { lines }; }
    case 'muffin': return { lines: L(cyc(['I\'m Muffin! I lick the spoons. It\'s an important job.', 'Chef says I\'m not allowed to taste-test the whole tray. Again.', 'Psst… the secret ingredient is sprinkles. Always sprinkles.'])) };
    case 'pepper': return suspect('pepper', ['Me? Steal the Golden Bone? I\'ve been right here eating cookies since sunrise!', 'Ask Chef Croissant. I\'ve been at this table SO long I\'m basically furniture.', cyc(['*crunch* Want a cookie? No? More for me.', 'I do love digging though. But only for cookies.'])]);
    case 'daisy': return { lines: L(cyc(['These pupcakes are the best in the whole world. I\'ve had four.', 'I heard someone tiny ordered a SECRET birthday cake. Whose birthday is it?', 'Have you met Candy? She\'s the sweetest schnauzer in town. Her house is on Maple Lane.'])) };
    case 'suds': { const lines = L(cyc(['Welcome to Fluff & Puff! I\'m Suds. I can\'t see a thing through this fringe but my grooming is PERFECT.', 'Every pup leaves here fluffier than they came in. It\'s the law.', 'Bath time is the best time. Tell that to Rascal.']));
      if (confirm('rascal')) lines.push([null, 'Rascal? He\'s been in that tub since 6am! Shampoo emergency. Don\'t ask. He hasn\'t left. He CAN\'T leave until he\'s rinsed.']);
      if (!S.flags.groom) lines.push([null, 'Want to try grooming? Use the table right here. Scrub, rinse, dry, and add a bow!']);
      lines.push([null, 'Oh, and the Style Station in the corner has outfits and hats. Look your best!']); return { lines }; }
    case 'rascal': return suspect('rascal', ['Hey! Can\'t a chihuahua take a bath in peace?!', 'I didn\'t take any bone! I\'ve been stuck in this tub ALL morning. Ask Suds!', cyc(['Okay I DID put bubbles in the fountain last week. But that\'s different.', 'This is the longest bath of my life. Send help. Or more bubbles.'])]);
    case 'duchess': return { lines: L(cyc(['Darling, I come here every day. Perfection takes effort.', 'One simply MUST look one\'s best for a party. I hear there may be one soon…', 'Do you like my crown? It\'s plastic. Don\'t tell anyone.'])) };
    case 'fifi': return suspect('fifi', ['Excuse me? I am PRINCESS Fifi and I do NOT steal. I acquire. Legally.', 'Besides, I\'ve been at this cabinet all morning beating my high score. Ask Ace, he\'s been watching me win.', cyc(['Okay yes, I adore shiny things. The Golden Bone is very shiny. But I didn\'t TAKE it!', 'Bow down to my high score. Or just look at it. Either is fine.'])]);
    case 'ace': { const lines = L(cyc(['Yo! Welcome to the Barkade. I\'m Ace. I\'ve beaten every game here. Twice.', 'Squirrel Dash is all about timing. Bone Stacker is all about nerves of steel.', 'Fun fact: the claw machine has never been beaten. It\'s cursed. Or just a claw machine.']));
      if (confirm('fifi')) lines.push([null, 'Fifi? She\'s been at Squirrel Dash since we opened. Bragging. Loudly. She never left.']);
      if (!S.flags.barkade) lines.push([null, 'Beat a high score on either cabinet and you\'re a Barkade Legend!']); return { lines }; }
    case 'pixel': return { lines: L(cyc(['The claw machine is SO close to giving me the Candy plush. I can feel it.', 'When I grow up I want to be a professional gamer. Or a fire dog. Or both!', 'Have you tried the air hockey? I\'m too short to reach.'])) };
    case 'sparky': { const lines = L(cyc(['Chief Sparky, Pup Fire Station! Spots on, ready for action!', 'We keep Pup Town safe. Mostly from squirrels.', 'I climb the lookout tower every morning and write down everything I see.']));
      if (q >= 1 && !S.clues.log) lines.push([null, 'Investigating the Golden Bone? Check my lookout log at the top of the tower outside. I saw something funny at dawn!']);
      if (!S.flags.kittenDown && !S.flags.kitten) lines.push([null, 'And we have a CALL: Mittens the kitten is stuck up the tall tree in Paw Park! Can you climb up and bring her down? The branches make steps!']);
      else if (S.flags.kittenDown && !S.flags.kitten) { lines.push([null, 'You rescued Mittens! You\'re an honorary firefighter. Here\'s your very own Fire Helmet!']); return { lines, fx: () => { S.flags.kitten = 1; persist(); G.giveHat('fire'); G.badge('kitten'); } }; }
      return { lines }; }
    case 'blaze': return { lines: L(cyc(['I\'m Rookie Blaze! I just learned to slide down the pole! Mostly on purpose!', 'I polish the fire truck every day. You can see your face in it. I see MY face. It\'s great.', 'Ring the bell! It makes everyone jump. Literally.'])) };
    case 'smokey': return { lines: L(cyc(['They call me Smokey. I\'m the hose dog. Long hose, long dog. It works.', 'Our truck is called Pup 1. It goes WEE-OOO. Try honking it!', 'Safety first, snacks second. That\'s the station motto.'])) };
    case 'hush': { const lines = L(cyc(['Shhh… welcome to the Pawsome Library. Please whisper. Or think quietly.', 'We have every book. "Good Dog", "Very Good Dog", and the sequel "Best Dog".', 'Some say this library has a secret room. I say… shhh.']));
      if (q >= 1 && !S.clues.card) lines.push([null, 'A tiny someone borrowed two very interesting books yesterday. The checkout cards are on my desk.']); return { lines }; }
    case 'page': return { lines: L(cyc(['I\'m reading "The Mystery of the Missing Squeak". I bet the cat did it.', 'Books are like walks for your brain!', 'Did you know there\'s a book on the shelf that\'s not really a book? Look for the odd red one.'])) };
    case 'scout': return { lines: L(cyc(['Studying for my Good Boy exam. Sit, stay, roll over, file taxes.', 'Shhh, Professor Hush is watching. He\'s always watching. With his ears.'])) };
    case 'martina': { const p = S.plants.length; const lines = L(cyc(['Oh, hello there. I\'m Martina. I moved here from Ratita Industries\' desert dome. Pup Town has much better weather.', 'Slow and steady grows the garden, dear.', 'I\'ve been gardening for 47 years. Tortoises are patient.']));
      if (!S.flags.garden && p < 4) lines.push([null, `Would you help me? Plant 4 sunflowers in the community garden beds outside the shop, on the corner. (${p}/4 planted)`]);
      else if (!S.flags.garden) { lines.push([null, 'All four sunflowers! They\'re beautiful. Here, a sunflower for your hat, dear.']); return { lines, fx: () => { S.flags.garden = 1; persist(); G.giveHat('flower'); G.badge('garden'); } }; }
      return { lines }; }
    case 'sunny': return { lines: L(cyc(['Welcome to Martina\'s Garden Shop! Every plant is happy here. We talk to them.', 'Martina\'s corner is nice and toasty. Tortoises love warm sand.', 'The sunflower seeds are free for the community garden!'])) };
    case 'clover': return { lines: L(cyc(['Watering, watering, watering… I love this job.', 'Fun fact: shibas and plants both enjoy sunshine and being left alone. Kidding! Hi!'])) };
    case 'candy': {
      const t = S.toys.length; const lines = L(cyc(['*happy wiggle* Hi hi hi! I\'m Candy! Welcome to my house! This is my bed. That\'s also my bed. The couch? Also mine.', 'I visit Ratita Industries a lot. I\'m Head of Ruffsources there! But this is my home.', 'Is it someone\'s birthday soon? Everyone keeps whispering and stopping when I walk in…']));
      if (!S.flags.toys) { if (t >= 3) { lines.push([null, 'MY SQUEAKY TOYS! All three! *SQUEAK SQUEAK SQUEAK* You\'re my best friend! Here, wear these!']); return { lines, fx: () => { S.flags.toys = 1; persist(); G.giveHat('ears'); G.badge('toys'); } }; } lines.push([null, `I lost my 3 squeaky toys somewhere in town. Pink bones! Can you find them? (${t}/3)`]); }
      if (q >= 4) lines.push([null, 'A BIRTHDAY PARTY for ME?! And Nugget did all this?! Best. Day. EVER!']); return { lines }; }
    case 'nugget': if (q === 2) return { lines: L('Eep! You found me! I\'m Nugget. I\'m… um… digging. For no reason.', 'Okay okay. I took the Golden Bone. But only to BORROW it! It\'s Candy\'s birthday and it\'s the shiniest thing in town!', 'I ordered a pupcake, borrowed books on presents and digging, and hid it in the park… then here. I just wanted Candy to be happy!', 'Will you take it back to the Mayor? And… maybe tell him why? I\'m sorry!'), fx: () => G.gotBone() };
      return { lines: L(cyc(['Thank you for helping me tell the Mayor! Now we get a REAL party for Candy!', 'I\'m gonna be a detective too when I grow up. Or a baker. Or a bone.'])) };
    case 'rex': { const lines = L(cyc(['Ball? BALL?! Did someone say ball? Hi! I\'m Rex! Let\'s play fetch!', 'I can fetch anything. Balls, sticks, frisbees, one time a whole picnic basket.', 'Throw it far! I\'ll bring it right back. Probably.']));
      if (!S.flags.fetch) lines.push([null, 'Score 60 or more points and I\'ll give you my lucky Fetch Visor! Start from the white circle.']); return { lines }; }
    case 'dash': { const lines = L(cyc(['Coach Dash here! Speed, focus, zoomies!', 'Hurdles, weave poles, tunnel, A-frame, tire jump, then back to the finish. Follow the glowing markers!', 'Jump the hurdles and leap through the tire. No shortcuts, I\'m watching!']));
      if (!S.flags.agility) lines.push([null, 'Finish in under 40 seconds to earn your Agility Ace badge. Under 28 is GOLD!']); return { lines }; }
    case 'duke': return { lines: L(cyc(['Hello, small friend. I am Duke. I am a gentle giant. Mostly giant.', 'I would play in the dog run but I would accidentally sit on someone.', 'The Golden Bone? I saw a very small puppy running VERY fast this morning. Too fast to see who.'])) };
    case 'biscotti': case 'bean': return { lines: L(cyc(['ZOOMIES! ZOOMIES! Can\'t stop! Won\'t stop!', 'Tag! You\'re it! Wait, you\'re too big to be it!', 'We\'re best friends! We do everything together! Mostly run!'])) };
    case 'rover': return { lines: L(cyc(['I\'m just happy. That\'s my whole thing. Hi!', 'Have you been on the tire swing? I haven\'t. I can\'t reach. I love it anyway.'])) };
    case 'coco': return { lines: L(cyc(['Ah, the fountain. My muse. I\'ve painted it 300 times.', 'Art is about seeing. I see… a fountain. Again. Magnifique.', 'Painting tip: always add a dog. Every painting is better with a dog.'])) };
    case 'ziggy': return { lines: L(cyc(['Yo, can\'t stop, gotta skate! (I don\'t have a skateboard. I just walk fast.)', 'Pup Town is the coolest town. Fact.'])) };
    case 'gus': return { lines: L(cyc(['Back in my day, the Golden Bone was just a regular bone. We painted it gold for the parade in \'89.', 'I feed the birds every morning. They don\'t say thank you. Birds are rude.', 'The young ones are always zooming about. Me, I prefer a good bench.'])) };
    case 'peanut': return { lines: L(cyc(['Pupsicles! Get your pupsicles! Bacon-berry, peanut butter swirl, and Mystery Flavor!', 'Mystery Flavor is just peanut butter. Don\'t tell anyone.', 'A tiny pup bought a pupsicle at dawn and paid with a button. Cute! Tiny party hat too.'])) };
    case 'waffles': return { lines: L(cyc(['Mail\'s here! Mail\'s here! Oh, it\'s just me. Hi!', 'I deliver to every house in Pup Town. Candy gets the most fan mail.', 'Somebody mailed a birthday card with a tiny paw print on it. To Candy. Hmm!'])) };
    case 'lola': return { lines: L(cyc(['*pant pant* Can\'t chat… doing laps… 47 down!', 'Running keeps me spotty! I mean sporty!'])) };
    case 'pancake': return { lines: L(cyc(['I\'m on vacation! I came all the way from Barkington to see the Golden Bone. And it\'s gone. Typical!', 'Say cheese! *click* Oops, that was my thumb.', 'Your town is lovely. Do you live here? Oh, you\'re visiting too!'])) };
    case 'bruno': return { lines: L(cyc(['Waitin\' for the Dog-Bus. It comes round every couple minutes. Hop on at the stop!', 'The Dog-Bus wags its tail when it\'s happy. Which is always.'])) };
    case 'luna': case 'pirat': case 'snowie': { S.rats[id] = 1; persist(); const nr = Object.keys(S.rats).length; const t = { luna: ['Hey, it\'s you! Visiting Pup Town too? Candy invited us for the weekend!', 'I\'m thinking of opening a Ratita Industries branch here. Pup Town Labs. Pawsome Labs?', 'The Golden Bone? Hmm, Candy wouldn\'t take it. She\'d just lick it.'],
        pirat: ['Arr! Pup Town be a fine port! The dogs here be very friendly. Too friendly. I\'ve been licked six times.', 'I could build them a robot bone polisher! Or a robot bone. Hmm.', 'That Dog-Bus is excellent engineering. Wiggly, but excellent.'],
        snowie: ['HI HI HI! I love it here! Everyone is so FLUFFY!', 'Candy showed me her bed! She has seven beds!', 'I heard there might be a party! I LOVE parties!'] }[id];
      const lines = L(cyc(t)); if (nr >= 3 && !S.badges.rats) return { lines, fx: () => G.badge('rats') }; return { lines }; }
    case 'mittens': if (!S.flags.kittenDown) return { lines: L('Mew! Mew mew! (Translation: I came up for a bird and now the ground is VERY far away.)', '*Mittens hops into your arms* Purrrrr…'), fx: () => G.rescueKitten() };
      return { lines: L(cyc(['Mew! (Thank you!)', 'Purrrr…', 'Mew? (Is that a bird? No. I\'ve learned my lesson.)'])) };
  }
  return { lines: L('Woof!') }; }
// golden biscuits / map hint used by the journal
export function hint() { const q = S.q.bone | 0; if (q === 1) { for (const c of BONE_CLUES) if (!S.clues[c]) return { case: 'Check the empty display case in Town Hall.', flour: 'Something odd at the bakery… ask Chef Croissant.', card: 'The librarian has checkout cards on the desk.', hole: 'Look around the big oak in Paw Park.', log: 'Chief Sparky writes everything in his lookout log (top of the tower by the fire station).' }[c]; } return boneStep(); }
