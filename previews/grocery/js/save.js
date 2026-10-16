// localStorage save for Grok Grocery Tycoon (its own key; never touches other games or the arcade)
import { STORES, LAYOUTS, storeGeom, FIX, DEPT_IDS, FIRST, LAST, TYPES, autoLayout } from './data.js?v=ggt12';
const KEY = 'grokGroceryTycoon.v1';
// layoutKey: a hand-made grocery layout (LAYOUTS) or a fill share for the type's auto layout
export function newStore(id, layoutKey, type, nReg = 2) { const d = STORES.find((s) => s.id === id), G = storeGeom(d); type = type || d.type || 'grocery'; let layout;
  const L = typeof layoutKey === 'string' && LAYOUTS[layoutKey]; if (L && (type === 'grocery' || type === d.type)) { let fi = 0, ci = 0; layout = G.slots.map((sl) => (sl.kind === 'floor' ? L.floor[fi++] : L.check[ci++]) || ''); }
  else layout = autoLayout(type, G, typeof layoutKey === 'number' ? layoutKey : 0.6, nReg);
  const st = { id, owned: false, type, name: d.name, layout, price: {}, shelf: {}, back: {}, staff: [], rep: 45, clean: 100, auto: true, rev: 0, cust: 0, angry: 0, grade: '', ad: 0, open: true };
  for (const k of DEPT_IDS) { st.price[k] = 1; st.shelf[k] = 0; st.back[k] = 0; }
  fillStock(st, 0.85, 0.6); return st; }
export function capOf(st, dept) { let c = 0; st.layout.forEach((f) => { if (f && FIX[f].dept === dept) c += FIX[f].cap; }); return c; }
export function fillStock(st, a, b) { for (const k of DEPT_IDS) { const c = capOf(st, k); st.shelf[k] = Math.round(c * a); st.back[k] = Math.round(c * b); } }
let SID = 1; export const staffName = (r) => FIRST[(r * 7 + SID) % FIRST.length] + ' ' + LAST[(r * 13 + SID++) % LAST.length];
const DEF = () => ({ v: 1, mode: '', name: '', look: { skin: 1, hair: 0, hairC: 1, shirt: 2, pants: 0 }, made: false, money: 0, day: 1, time: 7 * 60, xp: 0, rank: 0, dept: 'produce', worked: 0,
  stores: {}, dc: false, trucks: 1, brand: { on: false, lines: [] }, unlock: { selfck: false, cold: false }, goals: {}, daily: { day: 0, t: {} }, cameos: {}, insp: { next: 3 }, loan: 0,
  stats: { served: 0, revenue: 0, days: 0, inspections: 0, aGrades: 0, carts: 0, bags: 0, cleans: 0, helps: 0, stocks: 0 }, news: [], badges: {}, best: {}, played: {}, talks: {}, opts: { sound: true, music: true }, seenHow: false, plays: 0 });
export let S = load();
function load() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.v === 1) { const d = DEF(); const o = Object.assign(d, s); for (const k of ['look', 'brand', 'unlock', 'goals', 'daily', 'cameos', 'insp', 'stats', 'badges', 'best', 'played', 'talks', 'opts']) o[k] = Object.assign(DEF()[k], s[k] || {}); return o; } } catch (e) {} return DEF(); }
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
export function resetSave() { const d = DEF(); for (const k in S) delete S[k]; Object.assign(S, d); persist(); return S; }
// start a new game in career (A) or boss (B) mode, keeping your name + look
export function newGame(mode, type = 'grocery') { const keep = { name: S.name, look: S.look, made: S.made, opts: S.opts, seenHow: S.seenHow }; resetSave(); Object.assign(S, keep); S.mode = mode;
  S.stores.s1 = type === 'grocery' ? newStore('s1', mode === 'career' ? 'career' : 'boss') : newStore('s1', mode === 'career' ? 1 : 0.5, type, mode === 'career' ? 6 : 2); S.stores.s1.type = type;
  if (mode === 'career' && type !== 'grocery') { const L = S.stores.s1.layout, G = storeGeom(STORES[0]); let n = 0; G.slots.forEach((sl, i) => { if (sl.kind === 'check' && L[i] === 'register' && ++n > 4) L[i] = 'selfck'; }); fillStock(S.stores.s1, 0.85, 0.6); }
  S.stores.rival = newStore('rival', 'rival'); S.stores.rival.rep = 60; S.stores.rival2 = newStore('rival2', 'rival2'); S.stores.rival2.rep = 52; for (const k in S.stores.rival2.price) S.stores.rival2.price[k] = 1.2; for (const k in S.stores.rival.price) S.stores.rival.price[k] = 0.9;
  for (const d of STORES) if (d.strip) { const st = S.stores[d.id] = newStore(d.id, 1, d.type, d.id === 'mega' ? 6 : 2); st.rep = 45 + ((d.x0 * 7) & 15); const pr = d.id === 'mega' ? 0.92 : 1.05 + ((d.x0 & 3) * 0.05); for (const k in st.price) st.price[k] = pr;
    st.staff = [{ role: 'cashier', name: d.short + ' Cashier', skill: 2 }, { role: 'stocker', name: d.short + ' Stocker', skill: 2 }, { role: 'manager', name: d.boss, skill: 3 }]; if (d.id === 'mega') st.staff.push({ role: 'cashier', name: 'Mega Mo', skill: 3 }, { role: 'cashier', name: 'Mega Mia', skill: 3 }, { role: 'stocker', name: 'Mega Max', skill: 3 }, { role: 'greeter', name: 'Mega Greeter', skill: 2 }); }
  const s1 = S.stores.s1; s1.owned = mode === 'boss'; s1.rep = mode === 'career' ? 58 : 40;
  if (mode === 'career') { S.money = 40; s1.staff = [{ role: 'cashier', name: 'Rosa Radish', skill: 3 }, { role: 'cashier', name: 'Milo Mango', skill: 2 }, { role: 'stocker', name: 'Dev Dill', skill: 2 }, { role: 'janitor', name: 'Hana Honeydew', skill: 2 }, { role: 'manager', name: 'Penny Parsnip', skill: 4 }]; S.unlock.selfck = true; }
  else { S.money = 4000; s1.staff = [{ role: 'cashier', name: 'Rosa Radish', skill: 2 }, { role: 'stocker', name: 'Dev Dill', skill: 2 }]; }
  S.stores.rival2.staff = [{ role: 'cashier', name: 'Quick Quentin', skill: 3 }, { role: 'cashier', name: 'Quick Quinn', skill: 3 }, { role: 'stocker', name: 'Speedy Sue', skill: 3 }, { role: 'manager', name: 'Ms. Quinn', skill: 4 }];
  S.stores.rival.staff = [{ role: 'cashier', name: 'Bonanza Bob', skill: 2 }, { role: 'cashier', name: 'Bonanza Betty', skill: 2 }, { role: 'cashier', name: 'Bonanza Bill', skill: 2 }, { role: 'stocker', name: 'Bonanza Bea', skill: 3 }, { role: 'manager', name: 'Max Markdown', skill: 3 }];
  S.news = [{ day: 1, t: mode === 'career' ? 'New courtesy clerk starts at Grok Grocery Main St. Grandpa Gus: "Mind the cart corral."' : 'A brand-new boss takes over Grok Grocery Main St. Bargain Bonanza is nervous!' }];
  persist(); return S; }
export function news(t) { S.news.unshift({ day: S.day, t }); if (S.news.length > 30) S.news.length = 30; }
