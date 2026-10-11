// Company state: save, clock, branches (live + autopilot), rivals, inspections, critics, news.
import { LOTS, RIVALS, CAREER, BLD, NAMES, STAFF_ROLES, DECOR, THEMES, CAMEOS } from './data.js';
import { DISH, DISHES, STATIONS } from './food.js';
const KEY = 'grokEatsville.v1';
export const DAY_START = 7 * 60, OPEN = 8 * 60, CLOSE = 22 * 60, BEDTIME = 23 * 60, MIN_PER_SEC = 2;
export function newBranch(lot, name) { return { key: lot, owned: true, lot, name: name || LOTS[lot].name, theme: ['teal', 'sunny', 'berry', 'forest'][('ABCD'.indexOf(lot) + 4) % 4], menu: ['burger', 'fries', 'soda'], priceK: 1, special: null,
  stations: { grill: 1, fryer: 1, drinks: 1 }, upg: { speed: 0, rel: 0 }, level: 0, decor: [], staff: [], stock: 40, autoStock: true, sanitation: 90, rep: 40, grade: null, gradeDay: 0, revenueToday: 0, servedToday: 0, broken: [], care: false, open: true }; }
function DEF(mode) {
  const s = { v: 1, mode, money: mode === 'explore' ? 99999 : mode === 'worker' ? 60 : 650, day: 1, time: DAY_START + 60, look: { outfit: 'chef', skin: 0xf2c29b, hair: 0x5a3820, hairStyle: 'short' }, outfits: ['chef'],
    cars: ['hatch'], car: 'hatch', homeLevel: 0, homeDecor: [], trophies: 0, career: { rank: 0, xp: 0, shift: false, tips: 0, served: 0, shiftStart: 0 },
    branches: {}, rivals: { mega: { rep: 62, promo: 0, owned: false }, pizza: { rep: 56, promo: 0, owned: false } }, fines: 0, cleanCert: false, news: [], reviews: [], ads: {}, deliveries: 0, stats: { served: 0, earned: 0, days: 0, inspections: 0, aGrades: 0 }, loan: 0,
    seen: {}, name: '' };
  if (mode !== 'worker') s.branches.A = newBranch('A', mode === 'explore' ? 'Explorer Eats' : 'Main St Diner');
  if (mode === 'explore') { s.outfits = ['chef', 'diner', 'lab', 'pirate', 'astro', 'dino', 'royal']; s.cars = ['hatch', 'truck', 'pickup', 'sport', 'hover']; }
  news(s, mode === 'worker' ? 'New trainee joins Mega Munch! Manager Mo: "Don\'t burn the buns."' : 'A brand-new diner opens on Main St. Rivals are nervous!');
  return s;
}
export let S = null;
export function hasSave() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }
export function loadSave() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.v === 1) { S = s; return true; } } catch (e) {} return false; }
export function newGame(mode) { S = DEF(mode); persist(); return S; }
export function setS(s) { S = s; }
export function persist() { if (!S || S.guest) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
export function news(s, text) { s.news.unshift({ day: s.day, text }); if (s.news.length > 30) s.news.length = 30; }
export const fmtTime = (m) => { m = Math.floor(m) % (24 * 60); const h = Math.floor(m / 60), mm = m % 60; const ap = h >= 12 ? 'PM' : 'AM'; return ((h + 11) % 12 + 1) + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap; };
export const isOpen = () => S.time >= OPEN && S.time < CLOSE;
export function rush() { const t = S.time; return (t > 690 && t < 810) || (t > 1050 && t < 1170); }
// the branch object for any restaurant building (yours, a rival's, or a vacant lot)
const RIVAL_THEME = { mega: { wall: 0xfff7d6, trim: 0xe11d48, seat: 0xffd23f, n: 'MEGA MUNCH', boss: 'mo', bossName: 'Manager Mo', menu: ['burger', 'fries', 'soda', 'hotdog', 'nuggets'] }, pizza: { wall: 0xf3e8ff, trim: 0x7c3aed, seat: 0x16a34a, n: 'PIZZA PALOOZA', boss: 'sal', bossName: 'Signora Sal', menu: ['pizza', 'salad', 'soda', 'cake', 'smoothie'] } };
const rivalBranch = {};
export function branchFor(bid) {
  const b = BLD[bid];
  for (const [k, br] of Object.entries(S.branches)) if (LOTS[k] ? LOTS[k].id === bid : k === bid) return br;
  if (b.owner && !(S.rivals[b.owner] && S.rivals[b.owner].owned)) { const R = RIVAL_THEME[b.owner];
    return rivalBranch[bid] || (rivalBranch[bid] = { owned: false, rival: b.owner, brand: R, name: R.n, menu: R.menu, priceK: 1, stations: { grill: 1, fryer: 1, drinks: 1, oven: 1, prep: 1, freezer: 1, stove: 1 }, upg: { speed: 1, rel: 0.3 }, level: 1, decor: ['plant', 'plant'], staff: [], stock: 999, sanitation: 80, rep: S.rivals[b.owner].rep, theme: 'teal' }); }
  return { vacant: true, lot: b.lot, name: b.name, stations: {}, menu: [] };
}
export function branchKey(bid) { for (const k of Object.keys(S.branches)) { if ((LOTS[k] && LOTS[k].id === bid) || k === bid) return k; } return null; }
export const ownedBids = () => Object.keys(S.branches).map((k) => (LOTS[k] ? LOTS[k].id : k));
export function lotPrice(lot) { if (lot === 'A' && S.mode === 'worker') return 800; return LOTS[lot].price; }
export function buyLot(lot) { const p = lotPrice(lot); if (S.money < p) return false; S.money -= p; S.branches[lot] = newBranch(lot); news(S, 'You opened ' + LOTS[lot].name + '! ' + (Object.keys(S.branches).length > 1 ? 'The empire grows.' : 'Your very own restaurant!')); checkEmperor(); persist(); return true; }
export function buyoutPrice(r) { return Math.round(5000 + S.rivals[r].rep * 40); }
export function canBuyout(r) { const best = Math.max(0, ...Object.values(S.branches).map((b) => b.rep)); return !S.rivals[r].owned && best > S.rivals[r].rep && Object.keys(S.branches).length >= 2; }
export function buyout(r) { const p = buyoutPrice(r); if (S.money < p || !canBuyout(r)) return false; S.money -= p; S.rivals[r].owned = true; const bid = r === 'mega' ? 'mega' : 'pizza';
  const br = newBranch('A', r === 'mega' ? 'Munch Reborn' : 'Palooza Reborn'); br.lot = null; br.key = bid; br.stations = { grill: 1, fryer: 1, drinks: 1, oven: 1, prep: 1, freezer: 1, stove: 1 }; br.level = 1; br.rep = 55; br.menu = RIVAL_THEME[r].menu.slice(0, 5); S.branches[bid] = br;
  news(S, 'SHOCK BUYOUT! ' + RIVALS[r].n + ' now belongs to you. ' + RIVALS[r].boss + ' is "taking a long vacation".'); checkEmperor(); persist(); return true; }
function checkEmperor() { const n = Object.keys(S.branches).length; if (n >= 6 && !S.seen.emperor) { S.seen.emperor = 1; S.trophies++; if (!S.outfits.includes('royal')) S.outfits.push('royal'); news(S, 'ALL HAIL THE FOOD EMPEROR OF EATSVILLE! Every restaurant in town is yours.'); EV.push({ t: 'emperor' }); } }
export const EV = []; // events for the UI (toasts, banners)
// staff candidates (refreshed daily)
export function candidates() { if (S.cand && S.cand.day === S.day) return S.cand.list; const list = []; const r = mulberry(S.day * 97 + 3);
  for (const role of ['cook', 'waiter', 'janitor', 'cook', 'waiter', 'manager']) { const skill = 1 + Math.floor(r() * 4); list.push({ id: 'c' + S.day + list.length, role, name: NAMES[(r() * NAMES.length) | 0], skill, wage: Math.round(STAFF_ROLES[role].wage * (0.7 + skill * 0.15)) }); }
  const cam = CAMEOS[S.day % CAMEOS.length]; list.push({ id: 'cam' + cam.id + S.day, role: cam.role, name: cam.n, skill: cam.skill, wage: cam.wage, cameo: cam.id, blurb: cam.blurb });
  S.cand = { day: S.day, list }; return list; }
export function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// average price of the branch menu
export const avgPrice = (br) => { const m = br.menu.length ? br.menu : ['burger']; return m.reduce((a, d) => a + (DISH[d] ? DISH[d].price : 5), 0) / m.length * (br.priceK || 1); };
export const ambience = (br) => (br.decor || []).reduce((a, d) => a + ((DECOR.find((x) => x.id === d) || {}).amb || 0), 0);
// ---------- autopilot: a game hour passes in a branch nobody is standing in ----------
export function autopilotHour(key, br) {
  if (!br.owned || !br.open) return; const cooks = br.staff.filter((s) => s.role === 'cook'), waiters = br.staff.filter((s) => s.role === 'waiter'), jan = br.staff.some((s) => s.role === 'janitor'), mgr = br.staff.some((s) => s.role === 'manager');
  br.sanitation = Math.max(0, br.sanitation - (jan ? 0.4 : 2.5)); if (jan) br.sanitation = Math.min(100, br.sanitation + 1.5);
  if (!cooks.length) return; // nobody cooking = closed while you're away
  if (Math.random() < 0.07 * (1 - br.upg.rel) && !br.broken.length) { const st = Object.keys(br.stations)[(Math.random() * Object.keys(br.stations).length) | 0]; if (br.care || mgr) { EV.push({ t: 'toast', m: '🐀 Snowie fixed the ' + STATIONS[st].n + ' at ' + br.name + ' (Ratita Care)' }); } else { br.broken.push(st); EV.push({ t: 'toast', m: '⚠️ ' + STATIONS[st].n + ' at ' + br.name + ' ' + STATIONS[st].gag, bad: true }); } }
  let cap = cooks.reduce((a, c) => a + 4 + c.skill * 1.5, 0) * (waiters.length ? 1 : 0.55) * (mgr ? 1.2 : 1) * (br.broken.length ? 0.6 : 1);
  const demand = demandPerHour(br); const served = Math.min(cap, demand) * (0.85 + Math.random() * 0.3) | 0; if (served <= 0) return;
  if (br.stock < served) { if (br.autoStock) { const need = 30; const cost = Math.round(need * 2.5 * 1.25); S.money -= cost; br.stock += need; } }
  const n = Math.min(served, br.stock); br.stock -= n; const rev = Math.round(n * avgPrice(br) * 1.1); S.money += rev; br.revenueToday += rev; br.servedToday += n; S.stats.served += n; S.stats.earned += rev;
  br.rep = Math.min(100, br.rep + (br.sanitation > 70 ? 0.15 : -0.3));
}
export function demandPerHour(br) { const t = S.time; let d = 6 + br.rep * 0.18 + ambience(br) * 0.15; if (rush()) d *= 1.7; if (t < 600 || t > 1260) d *= 0.6;
  d *= ({ 0.8: 1.25, 1: 1, 1.3: 0.75 })[br.priceK] || 1; if (br.grade === 'A') d *= 1.1; if (br.grade === 'F') d *= 0.5; if (S.ads[br.key] > 0) d *= 1.3;
  for (const r of Object.values(S.rivals)) if (r.promo > 0 && !r.owned) d *= 0.85; return d; }
// offsite inspection uses the branch's sanitation
export function offsiteInspection(key, br) { let sc = br.sanitation + (br.staff.some((s) => s.role === 'janitor') ? 8 : 0) - br.broken.length * 12 + (S.cleanCert ? 10 : 0); return applyGrade(br, sc, true); }
export function applyGrade(br, score, offsite) {
  const g = score >= 88 ? 'A' : score >= 72 ? 'B' : score >= 55 ? 'C' : 'F'; const fine = S.mode === 'explore' ? 0 : { A: 0, B: 0, C: 40, F: 120 }[g];
  br.grade = g; br.gradeDay = S.day; S.fines += fine; S.stats.inspections++; if (g === 'A') S.stats.aGrades++; S.cleanCert = false;
  br.rep = Math.max(0, Math.min(100, br.rep + { A: 4, B: 1, C: -3, F: -8 }[g]));
  const lines = { A: 'Hmph. ...Fine. It\'s clean. Don\'t let it go to your head.', B: 'Acceptable. Barely. I\'ll be back.', C: 'I saw things. Sticky things. $' + fine + ' fine.', F: 'DISGRACEFUL! Clean this place up! $' + fine + ' fine.' };
  news(S, 'Inspector Grumbleton gave ' + br.name + ' a grade ' + g + '. ' + (g === 'A' ? '"I suppose it was... adequate."' : '"' + lines[g] + '"'));
  EV.push({ t: 'grade', g, fine, line: lines[g], name: br.name, offsite }); return g;
}
// ---------- rivals + daily stuff ----------
const RIVAL_EVENTS = [
  (r) => [`${r.n} launched "2-for-1 Tuesday"! Some customers are tempted away today.`, 1],
  (r) => [`${r.n}'s mascot got stuck in a revolving door. Customers are giggling at them.`, 0, -2],
  (r) => [`${r.n} unveiled a "Mega Mystery Menu". Nobody knows what's in it.`, 1, 1],
  (r) => [`${r.n}'s ice machine broke. Warm sodas all day!`, 0, -3],
  (r) => [`${r.n} hired a marching band to play outside. Very loud. Very effective.`, 1, 2],
];
export function newDay() {
  S.day++; S.stats.days++; S.time = DAY_START; const report = { day: S.day - 1, branches: [], wages: 0, fines: S.fines, rivals: [] };
  for (const [k, br] of Object.entries(S.branches)) { const w = br.staff.reduce((a, s) => a + s.wage, 0); report.wages += w; report.branches.push({ name: br.name, rev: br.revenueToday, served: br.servedToday, grade: br.grade, rep: Math.round(br.rep), san: Math.round(br.sanitation) }); br.revenueToday = 0; br.servedToday = 0; }
  if (S.mode !== 'explore') S.money -= report.wages;
  if (S.loan > 0) { const pay = Math.min(S.loan, Math.round(S.loan * 0.1) + 10); S.money -= pay; S.loan -= pay; report.loan = pay; }
  for (const k of Object.keys(S.ads)) S.ads[k] = Math.max(0, S.ads[k] - 1);
  for (const [id, r] of Object.entries(S.rivals)) { if (r.owned) continue; r.promo = 0; r.rep = Math.max(30, Math.min(95, r.rep + (Math.random() - 0.45) * 3));
    if (S.mode !== 'explore' && Math.random() < 0.45) { const [txt, promo, rep] = RIVAL_EVENTS[(Math.random() * RIVAL_EVENTS.length) | 0](RIVALS[id]); r.promo = promo; r.rep += rep || 0; news(S, txt); report.rivals.push(txt); } }
  // schedule today's surprise inspection + critic visit
  const keys = Object.keys(S.branches); S.today = { insp: null, critic: null, deliv: 0 };
  if (keys.length && S.mode !== 'explore' && S.day >= 2 && Math.random() < 0.75) S.today.insp = { key: keys[(Math.random() * keys.length) | 0], at: 600 + Math.random() * 600 | 0, done: false };
  if (keys.length && S.day >= 3 && Math.random() < 0.4) S.today.critic = { key: keys[(Math.random() * keys.length) | 0], at: 660 + Math.random() * 480 | 0, done: false };
  candidates(); persist(); return report;
}
export function ensureToday() { if (!S.today) S.today = { insp: S.mode !== 'explore' && Object.keys(S.branches).length && S.day >= 2 ? { key: Object.keys(S.branches)[0], at: 720, done: false } : null, critic: null, deliv: 0 }; }
export function rankUp() { const c = S.career; const nx = CAREER[c.rank + 1]; if (nx && c.xp >= nx.xp) { c.rank++; news(S, 'PROMOTION! You are now ' + CAREER[c.rank].n + ' at Mega Munch.'); EV.push({ t: 'promo', rank: CAREER[c.rank].n }); return true; } return false; }
