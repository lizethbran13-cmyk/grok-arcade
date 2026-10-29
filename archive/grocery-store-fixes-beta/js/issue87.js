// Issue #87 (free): Grok Grocery Tycoon store & delivery fixes. Halloween $150,000 welcome bonus (debt paid off), Grok Van signs
// (Test Ride / Deliver / Status), the 5 family pets on the job, real consequences (van bumper + freezer damage, spoiled-order refunds,
// rating drops) with a paid repair OR Candy & Torty's 100% free emergency rebuild, a walk-in Player Home with cooking, and Customer Mode.
import { S, persist, fillStock } from './save.js?v=ggt21mp';
import { DEPTS, FIX, STORE } from './data.js?v=ggt21mp';
import { GEOM, SPOTS } from './map.js?v=ggt21mp';
import { panel, toast, talk, talking } from './uikit.js?v=ggt21mp';
import { sfx } from './audio.js?v=ggt21mp';
import { makePet, animPet } from './pets.js?v=ggt21mp';
import { VAN_SIGNS, HOME_GEOM, OWN } from './online.js?v=ggt21mp';
const $ = (id) => document.getElementById(id), $m = (n) => '$' + Math.round(n).toLocaleString('en-US'), PI = Math.PI;
const ROLES = [
  { id: 'luna', nm: 'Luna', job: 'Inventory & Barcode Scanner Manager', e: '🐭', line: 'Beep! Every shelf is scanned and full. Dense and tidy, just how I like it.' },
  { id: 'pirat', nm: 'Pi-rat', job: 'Express Delivery Van Captain', e: '🏴‍☠️', line: 'ARR! Tap the Grok Van sign to Test Ride or Deliver. Mind the bumper, matey!' },
  { id: 'snowie', nm: 'Snowie', job: 'Freezer & Cold-Chain Specialist', e: '🐁', line: 'Brrr! Crash the van and the freezer gets jolted. Spoiled food = refunds!' },
  { id: 'candy', nm: 'Candy', job: 'Curbside Pickup & Cart Retriever', e: '🐶', line: 'Woof! Curbside orders go out right here. I fetch the carts too!' },
  { id: 'torty', nm: 'Torty (Martina)', job: 'Heavy-Crate & Bumper Inspector', e: '🐢', line: 'Slow and steady. If anything breaks, my rebuild is 100% FREE. You are never stuck.' }];
function spots() { const G = GEOM.s1; let fz = null; S.stores.s1 && S.stores.s1.layout.forEach((f, i) => { if (!fz && f && FIX[f].dept === 'frozen') fz = G.slots[i]; });
  return { luna: [G.stock[0] + 1.6, G.stock[1] + 1.2, 'in_s1'], snowie: fz ? [fz.x + 1.4, fz.z + 2.8, 'in_s1'] : [G.cx, G.front - 4, 'in_s1'], candy: [G.corral[0] + 1.8, G.corral[1] - 1.2, 'out'],
    pirat: [VAN_SIGNS.main[0] + 5.1, VAN_SIGNS.main[1] + 1.2, 'out'], torty: [VAN_SIGNS.ship[0] + 2.0, VAN_SIGNS.ship[1] + 1.4, 'out'] }; }
export class Issue87 {
  constructor(g) { this.g = g; this.pets = []; this.lastDmg = 0; this.lastCr = 0; this.T = 0; this.pill(); }
  spawn() { if (this.pets.length || !GEOM.s1) return; const sp = spots(); for (const r of ROLES) { const [x, z, reg] = sp[r.id]; const p = makePet(r.id, { s: r.id === 'torty' ? 0.9 : 1.2 }); p.x = x; p.z = z; p.y = 0.06; p.yaw = PI; p.reg = reg; p.r = r; p.root.position.set(x, 0.06, z); p.root.rotation.y = PI; this.g.add(p.root); this.pets.push(p); } }
  vis(reg) { if (reg === 'out') return true; const m = this.g.world.regionMeshes[reg]; return !!(m && m[0] && m[0].visible); }
  // ---------------------------------------------------------------- on-foot actions
  gather(push) { const g = this.g, me = g.me; this.spawn();
    for (const p of this.pets) if (p.root.visible) push(p.x, p.z, 2.2, `${p.r.e} ${p.r.nm} · ${p.r.job}`, () => talk([[`${p.r.e} ${p.r.nm} (${p.r.job})`, p.r.line]], null, [{ t: '🚐 Van & store status', f: () => this.status() }, { t: '👋 Bye!', f: () => {} }]));
    if (OWN) { const [sx, sz] = VAN_SIGNS.ship, [mx, mz] = VAN_SIGNS.main; push(sx, sz + 0.9, 2.6, '🚐 Grok Van sign: Test Ride / Deliver', () => this.vanMenu()); push(mx + 3.4, mz + 0.9, 2.6, '🚐 Grok Van sign: Test Ride / Deliver', () => this.vanMenu());
      if (SPOTS.homeStove) { push(SPOTS.homeStove[0], SPOTS.homeStove[1], 1.9, '🍳 Cook at the stove', () => this.cook()); push(SPOTS.homeFridge[0], SPOTS.homeFridge[1], 1.8, '🧊 Open the fridge & pantry', () => this.fridge()); push(SPOTS.homeDoor[0], SPOTS.homeDoor[1], 2.2, S.custMode ? '🛒 Customer Mode: ON (tap to go back to work)' : '🛒 Go shopping (Customer Mode)', () => this.toggleCust()); } }
    const sid = g.curStore(), st = sid && S.stores[sid], G = sid && GEOM[sid]; if (!st || !G || !(S.custMode || !g.canWork(sid))) return;
    st.layout.forEach((f, i) => { if (!f) return; const fx = FIX[f], sl = G.slots[i]; if (fx.dept) { const dz = Math.max(0, Math.abs(me.z - sl.z) - 2.6), dx = Math.max(0, Math.abs(me.x - sl.x) - 1.0), d = Math.hypot(dx, dz); if (d < 1.3) { const D = DEPTS[fx.dept], pr = D.val * (st.price[fx.dept] || 1); push(me.x, me.z, d + 0.1, `🧺 Add ${D.e} ${D.n} to basket (${'$' + pr.toFixed(2)})`, () => this.grab(sid, fx.dept, pr)); } }
      else if ((f === 'register' || f === 'selfck') && S.basket.length) push(sl.x - 1.3, sl.z, 2.4, `💳 Pay for ${S.basket.length} item${S.basket.length > 1 ? 's' : ''} (${$m(S.basket.reduce((a, b) => a + b.p, 0))})`, () => this.pay(sid)); }); }
  grab(sid, dept, pr) { const st = S.stores[sid]; if ((st.shelf[dept] || 0) <= 0) { toast(`😕 ${DEPTS[dept].n} is sold out here!`); return; } st.shelf[dept]--; S.basket.push({ d: dept, p: pr, sid }); sfx('pop'); toast(`🧺 ${DEPTS[dept].e} ${DEPTS[dept].n} in your basket (${S.basket.length})`); persist(); this.pill(); }
  pay(sid) { const tot = S.basket.reduce((a, b) => a + b.p, 0); if (S.money < tot) { toast('💸 Not enough cash for this basket'); return; } S.money -= tot; const st = S.stores[sid]; st.rev = (st.rev || 0) + tot; for (const b of S.basket) S.pantry[b.d] = (S.pantry[b.d] || 0) + 1; const n = S.basket.length; S.basket = []; sfx('ding'); persist(); this.pill();
    toast(`🧾 Paid ${$m(tot)} for ${n} item${n > 1 ? 's' : ''} at ${STORE[sid].short || STORE[sid].name}. Take them home and cook!`); }
  toggleCust() { S.custMode = !S.custMode; persist(); this.pill(); toast(S.custMode ? '🛒 Customer Mode ON: walk into ANY store, add items to your basket, pay at a register, then cook at home!' : '💼 Back to work mode'); }
  // ---------------------------------------------------------------- home
  fridge() { const rows = Object.keys(S.pantry).filter((k) => S.pantry[k] > 0 && DEPTS[k]).map((k) => `${DEPTS[k].e} ${DEPTS[k].n} ×${S.pantry[k]}`).join(' · ') || 'Empty! Go shopping in Customer Mode.'; talk([['🧊 Home Fridge & Pantry', rows]]); }
  cook() { const R = [['🍝 Pasta Night', { grocery: 1, dairy: 1 }], ['🥗 Garden Salad', { produce: 2 }], ['🍔 Burger Plate', { meat: 1, bakery: 1 }], ['🍦 Frozen Treat', { frozen: 1 }], ['🥪 Deli Sandwich', { deli: 1, bakery: 1 }]];
    const ok = (need) => Object.keys(need).every((k) => (S.pantry[k] || 0) >= need[k]);
    talk([['🍳 Kitchen Stove', 'What should we cook? (Ingredients come from your pantry.)']], null, R.map(([n, need]) => ({ t: `${n} ${ok(need) ? '✅' : '(need ' + Object.keys(need).map((k) => DEPTS[k].e + '×' + need[k]).join(' ') + ')'}`, f: () => { if (!ok(need)) { toast('🛒 Missing ingredients. Shop for them in Customer Mode!'); return; } for (const k in need) S.pantry[k] -= need[k]; S.meals = (S.meals || 0) + 1; sfx('win'); persist(); toast(`${n} is ready! Luna, Pi-rat, Snowie, Candy & Torty want a bite. (Meals cooked: ${S.meals})`); } }))); }
  // ---------------------------------------------------------------- van sign menu + consequences
  open(html, mount) { const app = this.g.app; app.paused = true; app.busy = true; panel(html, (c) => { c.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => { sfx('click'); const a = b.dataset.a; app.ui.done(); app.resume(); this.act(a); }); if (mount) mount(c); }, 'opP'); }
  repairCost() { return Math.round((100 - S.vanHp) * 18 + (100 - S.coldHp) * 12); }
  rows() { const s1 = S.stores.s1; return `<div class="opRow"><span class="ic">🚐</span><div class="rn"><b>Van bumper ${Math.round(S.vanHp)}%</b><small>${S.vanHp < 35 ? 'Too damaged to deliver!' : 'Crashes dent it'}</small></div></div><div class="opRow"><span class="ic">❄️</span><div class="rn"><b>Freezer / cold chain ${Math.round(S.coldHp)}%</b><small>Low = spoiled food + refunds</small></div></div><div class="opRow"><span class="ic">⭐</span><div class="rn"><b>Store rating ${Math.round(s1 ? s1.rep : 0)}</b><small>Late or spoiled orders drop it</small></div></div>`; }
  vanMenu() { const hurt = S.vanHp < 100 || S.coldHp < 100; this.open(`<h2>🚐 Grok Van</h2><p class="sub">🏴‍☠️ Pi-rat: "Where to, Captain?"</p>${this.rows()}<button class="go" data-a="test">🚐 Test Ride (free roam)</button><button class="go" data-a="deliver">📦 Deliver orders (same-day)</button>${hurt ? `<button class="go" style="background:#e2e8f0;color:#0f172a" data-a="repair">🔧 Repair (${$m(this.repairCost())})</button><button class="go" data-a="free">🐶🐢 Candy &amp; Torty's 100% Free Emergency Store &amp; Van Rebuild ($0 / Free — Never Stuck!)</button>` : ''}<button class="go" style="background:#475569;color:#fff" data-a="x">✖ Close</button>`); }
  status() { this.open(`<h2>📋 Van &amp; Store Status</h2>${this.rows()}<button class="go" style="background:#e2e8f0;color:#0f172a" data-a="repair">🔧 Repair (${$m(this.repairCost())})</button><button class="go" data-a="free">🐶🐢 Candy &amp; Torty's 100% Free Emergency Store &amp; Van Rebuild ($0 / Free — Never Stuck!)</button><button class="go" style="background:#475569;color:#fff" data-a="x">✖ Close</button>`); }
  act(a) { const P = this.g.online && this.g.online.p52;
    if (a === 'test' || a === 'deliver') { if (!P) { toast('🚐 The Grok Van is parked at Main St'); return; } if (S.vanHp < 35) { toast('🔧 The van is too damaged! Repair it or take the FREE rebuild.'); setTimeout(() => this.status(), 50); return; } const v = this.g.online.vans[0]; if (v.st !== 'home') { toast('🚐 The van is out on a run. Try again soon!'); return; } this.lastDmg = 0; this.lastCr = 0; P.startDrive('van', a === 'test'); }
    else if (a === 'repair') { const c = this.repairCost(); if (!c) { toast('✨ Nothing to fix!'); return; } if (S.money < c) { toast('💸 Not enough cash. Take the FREE rebuild instead!'); return; } S.money -= c; this.fix(); toast(`🔧 Repaired for ${$m(c)}. Good as new!`); }
    else if (a === 'free') { S.rebuilds87 = (S.rebuilds87 || 0) + 1; this.fix(true); toast('🐶🐢 Candy & Torty rebuilt the van, freezers and store for $0. Never stuck!'); } }
  fix(full) { S.vanHp = 100; S.coldHp = 100; const s1 = S.stores.s1; if (s1) { s1.clean = 100; if (full) { s1.rep = Math.max(s1.rep, 50); fillStock(s1, 1, 1); } } sfx('tune'); persist(); this.pill(); }
  tick(dt) { this.T += dt; const g = this.g, P = g.online && g.online.p52, d = P && P.d; this.spawn();
    for (const p of this.pets) { p.root.visible = this.vis(p.reg); if (p.root.visible && animPet) try { animPet(p, dt, this.g.me); } catch (e) {} }
    if (d) { if (d.dmg > this.lastDmg) { S.vanHp = Math.max(0, S.vanHp - (d.dmg - this.lastDmg) * 0.6); this.lastDmg = d.dmg; }
      if (d.crashes > this.lastCr) { const n = d.crashes - this.lastCr; this.lastCr = d.crashes; S.coldHp = Math.max(0, S.coldHp - 14 * n); const s1 = S.stores.s1;
        if (!d.test && d.load.length) { const ref = 25 * n; S.money -= ref; if (s1) s1.rep = Math.max(0, s1.rep - 2 * n); toast(`❄️ Snowie: "The freezer got jolted! Spoiled order: -${$m(ref)} refund, ⭐ rating drop."`); }
        else toast(`💥 Bumper dented! Van ${Math.round(S.vanHp)}% · Freezer ${Math.round(S.coldHp)}%`); persist(); } }
    else { this.lastDmg = 0; this.lastCr = 0; }
    if (S.coldHp < 40 && (this._sp = (this._sp || 0) + dt) > 30) { this._sp = 0; const s1 = S.stores.s1; if (s1 && s1.shelf.frozen > 0) { s1.shelf.frozen = Math.max(0, s1.shelf.frozen - 3); s1.rep = Math.max(0, s1.rep - 1); toast('🧊 Freezer is failing: frozen food spoiled! Repair or take the FREE rebuild.'); } }
    if ((this._pt = (this._pt || 0) + dt) > 0.5) { this._pt = 0; this.pill(); } }
  pill() { const hud = $('hud'); if (!hud) return; let el = $('p87'); if (!el) { el = document.createElement('div'); el.id = 'p87'; el.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 54px);transform:translateX(-50%);background:rgba(15,23,42,.82);color:#fff;font:600 12px system-ui;padding:5px 11px;border-radius:999px;z-index:30;pointer-events:auto;cursor:pointer;white-space:nowrap;border:1px solid #5eead4'; el.onclick = () => { if (this.g.app.state === 'play' && !this.g.app.busy) this.status(); }; hud.appendChild(el); }
    const t = `🚐 ${Math.round(S.vanHp ?? 100)}% · ❄️ ${Math.round(S.coldHp ?? 100)}%${S.custMode ? ' · 🛒 Customer' : ''}${S.basket && S.basket.length ? ' · 🧺 ' + S.basket.length : ''}`; if (el.textContent !== t) el.textContent = t; el.style.borderColor = S.vanHp < 35 || S.coldHp < 40 ? '#f87171' : '#5eead4'; }
}
// one-time Halloween popup: +$150,000 and your loan is paid off
export function bonus87(app) { if (!S.bonus87 || S.bonus52) return; if (app.state !== 'play' || app.busy || app.paused || talking()) return; S.bonus87 = 0; persist(); app.paused = true; app.busy = true; sfx('win');
  panel(`<div id="bn52"><div class="cf">🎃💵👻</div><h2>HALLOWEEN WELCOME BONUS</h2><div class="big">+$150,000</div><p class="sub">Your debt is paid off: loan $0 ✅</p><p class="sub">🐭 Luna, 🏴‍☠️ Pi-rat, 🐁 Snowie, 🐶 Candy and 🐢 Torty say: Happy Halloween! Stock up, fix up and go shopping.</p><button class="go" id="bn87">Spooky! Let's go</button></div>`, (c) => { c.querySelector('#bn87').onclick = () => { sfx('click'); app.ui.done(); app.resume(); }; }, 'opP'); }
