// Grok Pickleball Park - game data: paddles, balls, gear, career ranks, ladder rivals, tournaments, drills, courts.
export const PADDLES = [
  { id: 'starter', n: 'Park Starter', by: 'Grok Rec', pow: 0.45, ctl: 0.5, spin: 0.25, price: 0, a: 0x22c55e, b: 0x14532d, face: 'smooth', d: 'A trusty wooden-core rec paddle. Everyone starts somewhere!' },
  { id: 'softtouch', n: 'Soft Touch Dinker', by: 'Kitchen Co.', pow: 0.35, ctl: 0.88, spin: 0.45, price: 150, a: 0x38bdf8, b: 0x0c4a6e, face: 'smooth', d: 'Thick honeycomb core that soaks up pace. Dinks land like feathers.' },
  { id: 'diller', n: 'Drive Diller Pro', by: 'Drive Dillers Indoor', pow: 0.78, ctl: 0.88, spin: 0.92, price: 240, a: 0x10b981, b: 0x064e3b, face: 'grit', star: true, d: 'Official Drive Dillers indoor paddle! Extra-gritty emerald face tuned for 26-hole indoor and Silent Serve foam balls.' },
  { id: 'maxgrit', n: 'MaxGrit Signature', by: 'Franklin-style', pow: 0.62, ctl: 0.78, spin: 0.96, price: 320, a: 0x111827, b: 0xef4444, face: 'grit', star: true, d: 'Like your real paddles! Gritty fiberglass MaxGrit face grabs the ball for big topspin and slicey dinks, and a polypropylene honeycomb core keeps it soft. USA Pickleball approved.' },
  { id: 'thunder', n: 'Thunder Drive', by: 'Bam Sports', pow: 0.92, ctl: 0.4, spin: 0.45, price: 260, a: 0xf97316, b: 0x7c2d12, face: 'smooth', d: 'Elongated power paddle. Drives fly... and so do mistakes.' },
  { id: 'shell', n: 'Shell Shield', by: 'Tortuga Tech', pow: 0.5, ctl: 0.95, spin: 0.55, price: 300, a: 0x2dd4bf, b: 0x0f766e, face: 'smooth', d: 'Drop-tested by Torty herself. Rock-solid control, tortoise-tough.' },
  { id: 'carbon', n: 'Carbon Raw Pro', by: 'Grok Pro', pow: 0.8, ctl: 0.82, spin: 0.82, price: 600, a: 0x374151, b: 0x9ca3af, face: 'carbon', d: 'Raw carbon fiber face. The all-rounder the pros at the stadium use.' },
  { id: 'golden', n: 'Golden Pickle', by: 'Legend Series', pow: 0.9, ctl: 0.9, spin: 0.9, price: 950, a: 0xfcd34d, b: 0xb45309, face: 'carbon', d: 'Only for champions. Shiny, perfectly balanced, ridiculously cool.' },
];
export const BALLS = [
  { id: 'outdoor', n: 'Outdoor 40-Hole', price: 0, col: 0xe6ff3b, drag: 0.042, bounce: 0.66, legal: true, d: 'Hard plastic, 40 holes, official size. Fast and true outside.' },
  { id: 'indoor', n: 'Indoor 26-Hole', price: 80, col: 0xff8a1f, drag: 0.05, bounce: 0.62, legal: true, indoor: true, d: 'Softer, bigger holes. A little slower: great for long dink rallies inside Drive Dillers!' },
  { id: 'silent', n: 'Silent Serve Foam', price: 60, col: 0xfde047, drag: 0.07, bounce: 0.74, legal: false, quiet: true, indoor: true, d: 'Like your real Silent Serve balls! Quiet high-density foam, official 74 mm size, bounces higher and hurts way less. Legal on all Drive Dillers indoor courts!' },
  { id: 'dillball', n: 'Drive Dillers 26-Hole Pro', price: 75, col: 0x34d399, drag: 0.048, bounce: 0.65, legal: true, indoor: true, d: 'Official mint-emerald 26-hole indoor tournament ball of Drive Dillers! Crisp bounce on hardwood and sport-court surfaces.' },
  { id: 'glow', n: 'Night Glow Ball', price: 140, col: 0x7cff4f, drag: 0.042, bounce: 0.66, legal: true, glow: true, d: 'Glows under the Night Lights Court towers. Same feel as outdoor.' },
];
export const HATS = [{ id: 'none', n: 'No Hat', price: 0 }, { id: 'visor', n: 'Pro Visor', price: 40 }, { id: 'cap', n: 'Park Cap', price: 40 }, { id: 'headband', n: 'Sweatband', price: 30 }, { id: 'pickle', n: 'Pickle Hat', price: 120 }];
export const SHOES = [{ id: 'court', n: 'Court Shoes', price: 0, spd: 0 }, { id: 'swift', n: 'Swift Court Pro', price: 180, spd: 0.06, d: 'Lighter shoes: reach a few more balls.' }];
// career: rating tiers (like real player ratings)
export const RANKS = [
  { r: 2.0, n: 'Beginner' }, { r: 2.5, n: 'Rec Player' }, { r: 3.0, n: 'Club Player' }, { r: 3.5, n: 'Kitchen Regular' },
  { r: 4.0, n: 'Advanced' }, { r: 4.5, n: 'Tournament Player' }, { r: 5.0, n: 'Park Pro' }, { r: 5.5, n: 'Pickle Legend' },
];
export const rankOf = (r) => { let k = RANKS[0]; for (const q of RANKS) if (r >= q.r - 1e-6) k = q; return k; };
// the Park Ladder (climb from #10 to #1). look: shirt/skin/hair/pants indexes into humans.js palettes, hat id.
export const LADDER = [
  { id: 'dana', n: 'Dinkin\' Dana', diff: 'easy', look: { skin: 0, hair: 1, hairC: 3, shirt: 0, pants: 4 }, hat: 'visor', style: { dink: 1.6, drive: 0.6, lob: 0.6 }, hi: 'Soft and steady wins the race! Let\'s dink!', win: 'Dink-tastic!', lose: 'Aww, nice hands!', pay: 60 },
  { id: 'larry', n: 'Lobster Larry', diff: 'easy', look: { skin: 1, hair: 4, hairC: 4, shirt: 5, pants: 1 }, hat: 'cap', style: { dink: 0.6, drive: 0.8, lob: 2.2 }, hi: 'Look up! Everything I hit goes to the moon!', win: 'Lobbed ya!', lose: 'Pinched again...', pay: 70 },
  { id: 'gert', n: 'Granny Gert', diff: 'medium', look: { skin: 0, hair: 3, hairC: 5, shirt: 4, pants: 4 }, hat: 'none', style: { dink: 1.8, drive: 0.7, lob: 1.2 }, hi: 'I\'ve been playing since before you were born, sweetie.', win: 'Respect your elders!', lose: 'Well played, young one.', pay: 90 },
  { id: 'bruno', n: 'Bam-Bam Bruno', diff: 'medium', look: { skin: 3, hair: 4, hairC: 0, shirt: 5, pants: 3 }, hat: 'headband', style: { dink: 0.4, drive: 2.2, lob: 0.4, smash: 1.6 }, hi: 'I only have one speed: FAST!', win: 'BAM!', lose: 'Too much power... not enough control.', pay: 110 },
  { id: 'pirat', n: 'Captain Pi-rat', diff: 'medium', pet: 'pirat', style: { dink: 1.2, drive: 1.1, lob: 1.3 }, hi: 'Arr! One eye on the ball is all I need, matey!', win: 'Yo ho, the kitchen be mine!', lose: 'Shiver me whiskers... ye got me.', pay: 130 },
  { id: 'nico', n: 'Neon Nico', diff: 'hard', look: { skin: 2, hair: 2, hairC: 5, shirt: 6, pants: 3 }, hat: 'none', style: { dink: 1.0, drive: 1.4, lob: 0.7, smash: 1.3 }, hi: 'The night never sleeps, and neither does my backhand.', win: 'Lights out!', lose: 'You glow, friend.', pay: 150 },
  { id: 'sasha', n: 'Smash Sasha', diff: 'hard', look: { skin: 4, hair: 1, hairC: 0, shirt: 3, pants: 0 }, hat: 'cap', style: { dink: 0.8, drive: 1.3, lob: 0.5, smash: 2.4 }, hi: 'Pop it up and it\'s GONE.', win: 'Smashed it!', lose: 'You kept it low. Smart.', pay: 180 },
  { id: 'kai', n: 'Coach Kai', diff: 'pro', look: { skin: 2, hair: 0, hairC: 1, shirt: 2, pants: 1 }, hat: 'visor', style: { dink: 1.3, drive: 1.1, lob: 0.8, smash: 1.2 }, hi: 'Patience. Third shot drop. Win the kitchen.', win: 'Good lesson today!', lose: 'The student beats the teacher!', pay: 220 },
  { id: 'vera', n: 'Volley Vera', diff: 'pro', look: { skin: 1, hair: 5, hairC: 2, shirt: 7, pants: 5 }, hat: 'visor', style: { dink: 1.2, drive: 1.3, lob: 0.6, smash: 1.5 }, hi: 'Nothing gets past me at the kitchen line.', win: 'Hands like lightning!', lose: 'Okay... that was impressive.', pay: 260 },
  { id: 'king', n: 'The Pickle King', diff: 'pro', look: { skin: 1, hair: 0, hairC: 3, shirt: 2, pants: 3 }, hat: 'pickle', boss: true, style: { dink: 1.2, drive: 1.3, lob: 0.9, smash: 1.6 }, hi: 'Kneel before the King of the Kitchen!', win: 'Long live the King!', lose: 'A new champion of the park is crowned!', pay: 400 },
];
export const NAMES = ['Pickle Pete', 'Rally Rita', 'Dinky Dee', 'Spin Sam', 'Lob Lou', 'Ace Ava', 'Net Ned', 'Paddle Pam', 'Kitchen Kev', 'Drop Shot Dot', 'Erne Ernie', 'Bounce Bea'];
// tournaments: bracket of 4 (semifinal + final) or 8 (quarters too). Early rounds to 7, final to 11 (win by 2, side-out scoring).
export const TOURNEYS = [
  { id: 'open', n: 'Park Open', icon: '🥉', need: 0, size: 4, diffs: ['easy', 'medium'], fmt: 'singles', court: 'w2', prize: 150, d: 'The friendly weekend open. Perfect first tournament.' },
  { id: 'dill', n: 'Dill Doubles Classic', icon: '🥈', need: 2.5, size: 4, diffs: ['medium', 'medium'], fmt: 'doubles', court: 'e2', prize: 260, d: 'Doubles with your partner. Communication wins!' },
  { id: 'night', n: 'Night Lights Invitational', icon: '🌙', need: 3.0, size: 8, diffs: ['medium', 'hard', 'hard'], fmt: 'singles', court: 'night', night: true, prize: 400, d: 'Under the big light towers. The glow ball comes out.' },
  { id: 'grand', n: 'Grok Pickle Championship', icon: '🏆', need: 3.5, size: 8, diffs: ['hard', 'hard', 'pro'], fmt: 'doubles', court: 'center', prize: 800, d: 'Stadium Court, a packed crowd and Pi-rat in the umpire chair.' },
];
// Drive Dillers Indoor Tournament (DLC #65): travel across all 3 indoor courts inside Drive Dillers; each game gets harder!
export const DILLERS_ROUNDS = [
  {
    round: 0,
    stage: 'Round 1 · Court 1 Opener',
    court: 'dill1',
    courtName: 'Dill Court 1 (Emerald Rec Hall)',
    diff: 'easy',
    diffK: 0,
    to: 7,
    ball: 'indoor',
    pay: 50,
    opp: { id: 'dill_dan', n: 'Dill-Drive Danny', diff: 'easy', look: { skin: 1, hair: 2, hairC: 1, shirt: 2, pants: 0 }, hat: 'visor', style: { dink: 1.3, drive: 1.1, lob: 0.7 } },
    opp2: { id: 'dill_mia', n: 'Minty Mia', diff: 'easy', look: { skin: 2, hair: 1, hairC: 0, shirt: 7, pants: 1 }, hat: 'headband', style: { dink: 1.4, drive: 0.9, lob: 0.8 } },
    blurb: 'Start on Dill Court 1 with 26-hole indoor balls! Warm up your drives and kitchen dinks.'
  },
  {
    round: 1,
    stage: 'Round 2 · Court 2 Semifinal',
    court: 'dill2',
    courtName: 'Dill Court 2 (Silent Serve Foam Court)',
    diff: 'hard',
    diffK: 2,
    to: 7,
    ball: 'silent',
    pay: 85,
    opp: { id: 'dill_sammy', n: 'Silent-Serve Sammy', diff: 'hard', look: { skin: 3, hair: 4, hairC: 2, shirt: 3, pants: 3 }, hat: 'cap', style: { dink: 1.2, drive: 1.5, lob: 0.8, smash: 1.3 } },
    opp2: { id: 'dill_fiona', n: 'Foam-Bounce Fiona', diff: 'medium', look: { skin: 0, hair: 5, hairC: 3, shirt: 1, pants: 4 }, hat: 'visor', style: { dink: 1.5, drive: 1.2, lob: 1.0 } },
    blurb: 'Travel across the arena to Dill Court 2! Silent Serve foam bounce, faster drives, and sharper volleys.'
  },
  {
    round: 2,
    stage: 'Final · Center Stage Championship',
    court: 'dill3',
    courtName: 'Drive Dillers Center Stage',
    diff: 'pro',
    diffK: 3,
    to: 11,
    ball: 'dillball',
    pay: 240,
    ump: true,
    opp: { id: 'dill_drago', n: 'Dill Boss Drago', diff: 'pro', look: { skin: 2, hair: 0, hairC: 0, shirt: 2, pants: 3 }, hat: 'pickle', boss: true, style: { dink: 1.3, drive: 1.6, lob: 0.9, smash: 1.7 } },
    opp2: { id: 'dill_snowie', n: 'Director Snowie', diff: 'pro', pet: 'snowie', style: { dink: 1.5, drive: 1.3, lob: 1.1, smash: 1.4 } },
    blurb: 'Travel to Drive Dillers Center Stage under the arena spotlights! Win to 11 for the Golden Dill Cup!'
  },
];
export const DRILLS = [
  { id: 'dink', n: 'Dink Drill', icon: '🪶', d: 'Let it bounce, then dink it back into the kitchen. Count clean dinks in 60 s.', best: 'dinks' },
  { id: 'drop', n: 'Third-Shot Drop', icon: '🎯', d: 'From the baseline, drop the ball softly into the kitchen.', best: 'drops' },
  { id: 'serve', n: 'Serve Targets', icon: '🎳', d: 'Underhand serve, diagonal, into the glowing target rings.', best: 'points' },
  { id: 'volley', n: 'Kitchen-Line Volleys', icon: '⚡', d: 'Volley everything at the line, but don\'t step in the kitchen!', best: 'volleys' },
  { id: 'smash', n: 'Lob & Smash', icon: '💥', d: 'The machine lobs, you SMASH it down.', best: 'smashes' },
];
// every playable court in the park (court-local frame: net along x, team 0 on the +z side)
export const COURTS = {
  center: { n: 'Stadium Court', x: 0, z: -6, kind: 'stadium' },
  w1: { n: 'West Court 1', x: -42, z: 2 }, w2: { n: 'West Court 2', x: -54, z: 2 }, w3: { n: 'West Court 3', x: -66, z: 2 }, w4: { n: 'West Court 4', x: -78, z: 2 },
  e1: { n: 'East Court 1', x: 42, z: 2 }, e2: { n: 'East Court 2', x: 54, z: 2 }, e3: { n: 'East Court 3', x: 66, z: 2 }, e4: { n: 'East Court 4', x: 78, z: 2 },
  night: { n: 'Night Lights Court', x: 54, z: -50, kind: 'night' },
  quiet: { n: 'Quiet Practice Court', x: -54, z: -50, kind: 'quiet' },
  train: { n: 'Training Center Court', x: 35, z: 94, kind: 'indoor', bld: 'train' },
  dill1: { n: 'Dill Court 1 (Indoor Rec)', x: 72, z: 38, kind: 'indoor', bld: 'dillers', dlc: true },
  dill2: { n: 'Dill Court 2 (Silent Serve Foam)', x: 86.8, z: 38, kind: 'indoor', bld: 'dillers', dlc: true },
  dill3: { n: 'Drive Dillers Center Stage', x: 78.5, z: 60.5, kind: 'indoor', bld: 'dillers', dlc: true },
};
export const PARTNERS = [
  { id: 'kai', n: 'Coach Kai', diff: 'hard', look: { skin: 2, hair: 0, hairC: 1, shirt: 2, pants: 1 }, hat: 'visor' },
  { id: 'luna', n: 'Luna', diff: 'hard', pet: 'luna' },
  { id: 'snowie', n: 'Snowie', diff: 'medium', pet: 'snowie' },
  { id: 'rita', n: 'Rally Rita', diff: 'medium', look: { skin: 3, hair: 1, hairC: 0, shirt: 1, pants: 0 }, hat: 'cap' },
];
