// Grok Grocery Tycoon - dialogue, shopper questions, daily tasks and the goal hint.
import { S } from './save.js?v=ggt18';
import { RANKS, GOALS } from './data.js?v=ggt18';
export const LINES = {
  gus0: [['Grandpa Gus', 'Welcome to our store on Main St! I opened it forty years ago with one shelf and a very patient tortoise.'], ['Grandpa Gus', 'You start as a courtesy clerk: bag groceries, round up carts in the lot, stock shelves, mop spills and help shoppers find things.'], ['Grandpa Gus', 'Work hard and Penny will promote you. Cashier, department lead, assistant manager, store manager... and one day? Maybe you\'ll buy this place from me.']],
  gus: [['Grandpa Gus', 'Carts in the lot? Spills in aisle five? Those are your treasure hunt, kiddo. Every job gets you closer to a promotion.']],
  gusSell: [['Grandpa Gus', 'Well look at you. Store manager! I think I\'m ready to retire to the beach with Torty... I mean, near Torty. She\'s very slow at beaches.'], ['Grandpa Gus', 'Buy the store from me for $1,500 and this store is YOURS. Then build an empire!']],
  penny: [['Penny Parsnip', 'I\'m Penny, store manager. Check the time clock in the break room for today\'s tasks. Do them all for a bonus!']],
  boss0: [['Penny Parsnip', 'Boss! Welcome to YOUR store. I\'m Penny, your right hand. The Manager\'s Desk in the back office runs everything.'], ['Penny Parsnip', 'Set prices, order stock, hire staff at Ruffsources, rebuild the sales floor... then open more stores, a distribution center and our own brand.'], ['Penny Parsnip', 'And watch out for Bargain Bonanza and QuickCart Express. Walk into their stores and spy on their deals any time!']],
  luna: [['Luna', 'Squeak! Welcome to Ratita Industries. We supply every snack, can and cereal in Shopsville.'], ['Luna', 'Want my Robo-Checkout 3000? Self-checkouts that never take a lunch break. Well, they jam sometimes. Unless I\'m around.']],
  torty: [['Torty', 'Hello... friend. I am Torty. Martina on my business cards, but everybody calls me Torty.'], ['Torty', 'Tortuga Tech keeps your frozen peas frozen. Slow and cold wins the race.']],
  candy: [['Candy', 'Arf! (Candy wags at the stack of resumes. She has stamped them all with paw prints.)'], ['Ruffsources Clerk', 'Candy runs Ruffsources. Need cashiers, stockers, baggers, janitors? We\'ve got the best paws in town.']],
  pirat: [['Pi-rat', 'Arr! Pi-rat, store security. One eye on the doors, one eye... also on the doors. I only have the one.'], ['Pi-rat', 'No shoplifter gets past me. Unless they bring cheese. Then we negotiate.']],
  snowie: [['Snowie', 'Hi hi! Snowie Sky Express, at your service! Drone deliveries, air-drops, and the fluffiest forklift driving in town.']],
  fern: [['Farmer Fern', 'Fresh from Fernhill! Produce, dairy, meat, and flour for your bakery. Order here and my truck rolls right out.']],
  prue: [['Inspector Prue', 'Inspector Prue Crisper, Shopsville Health Dept. I inspect every store. Spills, empty coolers, sticky floors... I see ALL.'], ['Inspector Prue', 'Grade A stores get happier shoppers. Grade C stores get a fine and a stern look.']],
  banker: [['Banker Bo', 'Shopsville Bank! Need money to grow? I can lend you $5,000 today. Pay it back whenever. Interest is 5% a day, so... soon.']],
  max: [['Max Markdown', 'Max Markdown, Bargain Bonanza. Lowest prices in town! Mostly. Sometimes. On Tuesdays.'], ['Max Markdown', 'Spying on my deals? Go ahead. You\'ll never beat Bonanza!']],
  quinn: [['Ms. Quinn', 'QuickCart Express: small store, fancy cheese, high prices, zero waiting. We have ELEVEN self-checkouts in my dreams.']],
  goldie: [['Shopper', 'This town has three grocery stores and I shop at all of them. I\'m very loyal. To snacks.']],
};
// shopper questions: where would I find...?
export const QUIZ = [
  ['Excuse me, where are the bagels?', 'bakery'], ['Do you have frozen pizza?', 'frozen'], ['I need eggs for a cake!', 'dairy'], ['Where can I get sliced turkey?', 'deli'], ['Bananas, please!', 'produce'],
  ['I\'m making burgers tonight. Ground beef?', 'meat'], ['Where are the cereal boxes?', 'grocery'], ['Ice cream emergency!', 'frozen'], ['Fresh salmon for dinner?', 'meat'], ['Where\'s the yogurt?', 'dairy'],
  ['I need a birthday cake!', 'bakery'], ['Canned soup for a cold day?', 'grocery'], ['Some crunchy carrots?', 'produce'], ['A cheese platter for a party?', 'deli'], ['Peanut butter, please!', 'grocery'],
];
export const TASKS = { bag: ['🛍️', 'Bag groceries', 3], carts: ['🛒', 'Return carts', 6], clean: ['🧽', 'Mop spills', 2], help: ['💬', 'Help shoppers', 2], stock: ['📦', 'Stock shelves', 2], scan: ['🧾', 'Scan orders', 3], special: ['🥦', 'Department special', 1] };
export function dailyFor(rank, day, noCarts) { let pool = rank >= 1 ? ['scan', 'bag', 'carts', 'clean', 'help', 'stock'] : ['bag', 'carts', 'clean', 'help', 'stock']; if (noCarts) pool = pool.filter((k) => k !== 'carts'); if (rank >= 2) pool.push('special'); const out = {}; let s = day * 7 + rank; while (Object.keys(out).length < 3) { s = (s * 9301 + 49297) % 233280; out[pool[s % pool.length]] = 0; } return out; }
export function goal() {
  if (!S.mode) return 'Pick Career or Boss mode';
  if (S.mode === 'career') { const r = S.rank, nx = RANKS[r + 1]; if (r >= 4 && S.xp >= RANKS[5].xp) return 'Talk to Grandpa Gus about buying the store!'; const t = S.daily.t || {}; const left = Object.keys(t).filter((k) => t[k] >= 0 && t[k] < 99); if (!S.talks.gus) return 'Say hi to Grandpa Gus by the front doors'; if (left.length) return 'Daily tasks at the time clock · next rank: ' + (nx ? nx.n + ' (' + S.xp + '/' + nx.xp + ' XP)' : '');
    return nx ? `Work toward ${nx.n}: ${S.xp}/${nx.xp} XP` : 'Run the store!'; }
  if (!S.talks.boss0) return 'Talk to Penny in your store\'s back office';
  const g = GOALS.find(([k]) => !S.goals[k]); return g ? 'Empire goal: ' + g[1] : 'GROCERY TYCOON! Keep growing your empire.';
}
