// Live restaurant simulation (host-authoritative, pure data so it can be snapshotted to co-op clients).
import { DISH, STATIONS } from './food.js';
import { REST, seatsFor } from './interiors.js';
import { S, EV, isOpen, rush, avgPrice, ambience, applyGrade, persist, rankUp } from './empire.js';
import { CAREER } from './data.js';
const GAP_R = { x: 7.0, z: REST.counterZ }; // walk-around gap into the kitchen (right side)
const GAP_L = { x: -8.6, z: REST.counterZ };
const DOOR = { x: REST.doorX, z: 7.4 };
let NID = 1;
export class RestSim {
  constructor(bid, br, R, opts = {}) {
    this.bid = bid; this.br = br; this.R = R; this.rival = !!br.rival; this.career = opts.career; this.explore = S.mode === 'explore';
    this.seats = seatsFor(br.level || 0).map((s) => Object.assign({ cust: null }, s));
    this.st = {}; for (const s of R.stations) this.st[s.id] = { id: s.id, x: s.x, z: s.z, cook: null, ready: null, readyT: 0, broken: (br.broken || []).includes(s.id) ? 'old' : null, fixN: 0, gagT: 0 };
    this.cust = []; this.mess = []; this.staff = []; this.carry = {}; this.clean = {}; this.spawnT = 1.5; this.trash = 0; this.insp = null; this.snowie = null; this.t = 0; this.fx = [];
    this.shift = { served: 0, tips: 0, earned: 0 };
    (br.staff || []).forEach((s, i) => this.staff.push({ id: 's' + i, role: s.role, name: s.name, skill: s.skill, cameo: s.cameo, x: -3 + i * 1.5, z: s.role === 'cook' ? -5 : 2.5, task: null, carry: null, wait: 0, ry: 0 }));
  }
  menu() { return (this.br.menu || []).filter((d) => DISH[d] && this.st[DISH[d].st]); }
  // ---------------- main step ----------------
  step(dt) {
    this.t += dt; const open = this.explore ? true : isOpen();
    if (open && !this.br.vacant && this.menu().length) { this.spawnT -= dt; if (this.spawnT <= 0) { this.spawn(); const base = this.rival ? 8 : Math.max(5.5, 15 - this.br.rep * 0.08 - ambience(this.br) * 0.1); this.spawnT = base * (rush() ? 0.6 : 1) * ({ 0.8: 0.85, 1: 1, 1.3: 1.25 }[this.br.priceK] || 1) * (0.7 + Math.random() * 0.6); } }
    for (const c of this.cust) this.stepCust(c, dt);
    this.cust = this.cust.filter((c) => !c.gone);
    for (const s of Object.values(this.st)) this.stepStation(s, dt);
    for (const f of this.staff) this.stepStaff(f, dt);
    if (this.insp) this.stepInsp(dt);
    if (this.snowie) this.stepSnowie(dt);
    for (const k in this.clean) if (this.clean[k] > 0) this.clean[k] -= dt;
  }
  spawn() {
    const free = this.seats.filter((s) => !s.cust); if (!free.length) return; const seat = free[(Math.random() * free.length) | 0];
    const m = this.menu(); let dish = m[(Math.random() * m.length) | 0]; if (this.br.special && m.includes(this.br.special) && Math.random() < 0.35) dish = this.br.special;
    const c = { id: NID++, seed: (Math.random() * 1e6) | 0, x: DOOR.x, z: DOOR.z + 0.6, ry: Math.PI, st: 'walk', seat: this.seats.indexOf(seat), path: [{ x: seat.x, z: 2.5 }, { x: seat.x, z: seat.z }], dish, pat: 0, maxPat: this.patience(), eatT: 0, mood: 1, sp: 0 };
    seat.cust = c.id; this.cust.push(c); return c;
  }
  patience() { return (52 + ambience(this.br) * 1.2) * (this.staff.some((s) => s.role === 'manager') ? 1.2 : 1) * (this.explore ? 1.5 : 1); }
  spawnSpecial(kind) { // critic or inspector-as-npc
    if (kind === 'critic') { const c = this.spawn(); if (!c) { const s = this.seats.find((x) => x.cust); return null; } c.critic = true; c.left = 2; c.maxPat *= 0.9; EV.push({ t: 'banner', m: '🎩 A FOOD CRITIC just walked in!', s: 'Serve them fast + keep it clean for a top review' }); return c; }
  }
  moveTo(o, tx, tz, sp, dt) { const dx = tx - o.x, dz = tz - o.z, d = Math.hypot(dx, dz); if (d < 0.08) { o.sp = 0; return true; } const s = Math.min(d, sp * dt); o.x += dx / d * s; o.z += dz / d * s; o.ry = Math.atan2(dx, dz); o.sp = sp; return false; }
  stepCust(c, dt) {
    if (c.st === 'walk') { const p = c.path[0]; if (this.moveTo(c, p.x, p.z, 2.2, dt)) { c.path.shift(); if (!c.path.length) { c.st = 'wait'; const s = this.seats[c.seat]; c.ry = s.ry; c.x = s.x; c.z = s.z; } } }
    else if (c.st === 'wait') { c.pat += dt; c.mood = Math.max(0, 1 - c.pat / c.maxPat); if (c.pat > c.maxPat) { this.leave(c, true); } }
    else if (c.st === 'eat') { c.eatT -= dt; if (c.eatT <= 0) { if (c.critic && c.left > 1) { c.left--; const m = this.menu(); c.dish = m[(Math.random() * m.length) | 0]; c.st = 'wait'; c.pat = 0; return; } this.pay(c); this.leave(c, false); } }
    else if (c.st === 'leave') { const p = c.path[0]; if (!p) { c.gone = true; return; } if (this.moveTo(c, p.x, p.z, 2.4, dt)) c.path.shift(); }
  }
  leave(c, angry) { const s = this.seats[c.seat]; if (s && s.cust === c.id) s.cust = null; c.st = 'leave'; c.angry = angry; c.path = [{ x: c.x, z: 2.5 }, { x: DOOR.x, z: DOOR.z }, { x: DOOR.x, z: DOOR.z + 2 }];
    if (angry) { this.br.rep = Math.max(0, this.br.rep - 0.8); this.fx.push({ k: 'angry', x: c.x, z: c.z }); EV.push({ t: 'toast', m: '😤 A customer got tired of waiting', bad: true }); if (c.critic) this.criticDone(c, 1); } }
  pay(c) {
    const d = DISH[c.dish]; const special = this.br.special === c.dish ? 1.2 : 1; const price = Math.round(d.price * (this.br.priceK || 1) * special);
    const hap = c.mood; const tip = Math.round(price * (0.05 + hap * 0.35) * (this.anyClean() ? 1.15 : 1) * (this.staff.some((s) => s.cameo === 'torty') ? 1.3 : 1));
    this.shift.served++; this.shift.tips += tip; this.shift.earned += price;
    if (this.rival) { if (this.career) { S.career.tips += tip; S.career.served++; S.career.xp += 4 + Math.round(hap * 4); if (rankUp()) {} } }
    else { S.money += price + tip; this.br.revenueToday += price + tip; this.br.servedToday++; S.stats.served++; S.stats.earned += price + tip; this.br.rep = Math.min(100, this.br.rep + 0.15 + hap * 0.35); }
    this.fx.push({ k: 'cash', x: c.x, z: c.z, v: price + tip, tip });
    // leftovers: dirty plate on the table + the odd spill
    const s = this.seats[c.seat]; if (s && Math.random() < 0.7) this.addMess('plate', s.x + (s.side < 0 ? 0.55 : -0.55), s.z);
    if (Math.random() < 0.15) this.addMess(Math.random() < 0.5 ? 'spill' : 'trash', c.x + (Math.random() - 0.5) * 1.5, c.z + 0.8 + Math.random());
    if (c.critic) this.criticDone(c, 0);
  }
  criticDone(c, forced) { const cleanPts = Math.max(0, 1 - this.mess.length * 0.15); let stars = forced ? 1 : Math.max(1, Math.min(5, Math.round(1 + c.mood * 2.6 + cleanPts * 1.2 + ambience(this.br) * 0.04)));
    if (this.rival) return; this.br.rep = Math.max(0, Math.min(100, this.br.rep + (stars - 3) * 4));
    const lines = ['', 'I waited so long I grew a beard. ONE star.', 'Two stars. The fries were... present.', 'Three stars. Solid. Like a good sofa.', 'Four stars! I would come back. Maybe twice.', 'FIVE STARS! I wept into my napkin. Magnifique!'];
    S.reviews.unshift({ day: S.day, name: this.br.name, stars, text: lines[stars] }); EV.push({ t: 'review', stars, text: lines[stars], name: this.br.name }); if (stars === 5 && !S.seen.five) { S.seen.five = 1; S.trophies++; } persist(); }
  addMess(kind, x, z) { if (this.mess.length > 14) return; x = Math.max(-10.3, Math.min(10.3, x)); z = Math.max(-2.4, Math.min(7.2, z)); this.mess.push({ id: NID++, kind, x, z }); }
  anyClean() { for (const k in this.clean) if (this.clean[k] > 0) return true; return false; }
  stepStation(s, dt) {
    if (s.broken) { s.gagT += dt; if (s.id === 'fryer' && Math.random() < dt * 0.07 && this.mess.filter((m) => m.kind === 'spill').length < 4) this.addMess('spill', s.x + (Math.random() - 0.5) * 2, s.z + 0.8 + Math.random()); return; }
    if (s.cook) { s.cook.t += dt * (1 + (this.br.upg ? this.br.upg.speed : 0) * 0.25); if (s.cook.t >= s.cook.T) { s.ready = s.cook.dish; s.readyT = 0; s.cook = null; this.fx.push({ k: 'ding', x: s.x, z: s.z }); } }
    else if (s.ready && s.ready !== 'burnt') { s.readyT += dt; if (s.readyT > 40) { s.ready = 'burnt'; this.fx.push({ k: 'smoke', x: s.x, z: s.z }); EV.push({ t: 'toast', m: '🔥 Oops, something burnt on the ' + STATIONS[s.id].n, bad: true }); } }
    // Ratita tech malfunctions (fair: never more than one at a time, and not in the first 40s)
    const rel = this.br.upg ? this.br.upg.rel : 0; if (!this.anyBroken() && this.t > 40 && Math.random() < dt * 0.0045 * (1 - rel)) { s.broken = 'gag'; s.gagT = 0; s.fixN = 0; s.cook = null; if (!this.rival && this.br.broken && !this.br.broken.includes(s.id)) this.br.broken.push(s.id);
      EV.push({ t: 'banner', m: '⚠️ The ' + STATIONS[s.id].n + ' ' + STATIONS[s.id].gag, s: 'Ratita tech! Tap FIX fast, or call Snowie 📞', bad: true }); }
  }
  anyBroken() { return Object.values(this.st).some((s) => s.broken); }
  fix(s) { s.broken = null; s.fixN = 0; if (this.br.broken) this.br.broken = this.br.broken.filter((x) => x !== s.id); this.fx.push({ k: 'fixed', x: s.x, z: s.z }); EV.push({ t: 'toast', m: '🔧 Fixed the ' + STATIONS[s.id].n + '!' }); }
  callSnowie() { const b = Object.values(this.st).find((s) => s.broken); if (!b || this.snowie) return false; this.snowie = { x: DOOR.x, z: DOOR.z + 1, target: b.id, t: 0, phase: 'in', ry: Math.PI }; return true; }
  stepSnowie(dt) { const n = this.snowie, s = this.st[n.target];
    if (n.phase === 'in') { const p = this.route(n, { x: s.x, z: s.z + 0.2 }); if (this.moveTo(n, p.x, p.z, 4, dt) && p.final) { n.phase = 'fix'; n.t = 0; } }
    else if (n.phase === 'fix') { n.t += dt; n.ry = Math.PI; if (n.t > 2) { if (s.broken) this.fix(s); n.phase = 'out'; } }
    else { const p = this.route(n, { x: DOOR.x, z: DOOR.z + 1.5 }); if (this.moveTo(n, p.x, p.z, 4, dt) && p.final) this.snowie = null; } }
  // simple waypoint routing around the kitchen counter
  route(o, to) { const inK = (z) => z < REST.counterZ - 0.3; if (inK(o.z) !== inK(to.z)) { const g = Math.abs(o.x - GAP_R.x) < Math.abs(o.x - GAP_L.x) ? GAP_R : GAP_L; if (Math.abs(o.x - g.x) > 0.3 || Math.abs(o.z - g.z) > 1.2) return { x: g.x, z: inK(o.z) ? g.z - 0.9 : g.z + 0.9, final: false }; return { x: g.x, z: inK(o.z) ? g.z + 1.0 : g.z - 1.0, final: false }; } return { x: to.x, z: to.z, final: true }; }
  // ---------------- player actions ----------------
  // what the action button would do for this player at (x,z) room-local
  query(pid, x, z) {
    const carry = this.carry[pid] || null; const near = (o, r) => Math.hypot(o.x - x, o.z - z) < r;
    if (carry && carry !== 'burnt' && carry !== 'dirty' && carry !== 'bag' && DISH[carry]) { let c = null, cd = 2.4; for (const k of this.cust) { if (k.st !== 'wait' || k.dish !== carry) continue; const d = Math.hypot(k.x - x, k.z - z); if (d < cd) { cd = d; c = k; } } if (c) return { a: 'serve', c, label: 'Serve ' + DISH[carry].e }; }
    { let bs = null, bd = 1.45; for (const s of Object.values(this.st)) { const d = Math.hypot(s.x - x, s.z - z); if (d < bd) { bd = d; bs = s; } } for (const s of bs ? [bs] : []) {
      if (s.broken) return { a: 'fix', s, label: 'FIX! ' + s.fixN + '/5' };
      if (s.ready && !carry) return { a: 'take', s, label: 'Take ' + (s.ready === 'burnt' ? '🔥' : DISH[s.ready].e) };
      if (!s.cook && !s.ready && !carry) { const d = this.pickDish(s.id); if (d) return { a: 'cook', s, d, label: 'Cook ' + DISH[d].e }; return { a: 'none', label: 'Not on menu' }; }
      if (s.cook) return { a: 'none', label: 'Cooking… ' + Math.round(s.cook.t / s.cook.T * 100) + '%' }; } }
    if (carry === 'burnt' || carry === 'dirty' || (carry && carry !== 'bag')) { const tr = this.R.spots.find((p) => p.kind === 'trash'); if (tr && near(tr, 1.4)) return { a: 'toss', label: 'Toss 🗑️' }; }
    const sk = this.R.spots.find((p) => p.kind === 'sink'); if (sk && near(sk, 1.4)) { if (carry === 'dirty') return { a: 'wash', label: 'Wash plate 🫧' }; if (!carry) return { a: 'hands', label: 'Wash hands 🧼' }; }
    if (!carry) { let best = null, bd = 1.4; for (const m of this.mess) { const d = Math.hypot(m.x - x, m.z - z); if (d < bd) { bd = d; best = m; } } if (best) return { a: 'clean', m: best, label: best.kind === 'plate' ? 'Pick up plate' : 'Clean 🧽' }; }
    if (carry && carry !== 'burnt' && carry !== 'dirty' && carry !== 'bag') { const c = this.cust.find((c) => c.st === 'wait' && near(c, 2.4)); if (c) return { a: 'wrong', c, label: 'They want ' + DISH[c.dish].e }; }
    return null;
  }
  pickDish(stId) { const want = this.cust.filter((c) => c.st === 'wait' && DISH[c.dish].st === stId).sort((a, b) => b.pat - a.pat).map((c) => c.dish); const busy = this.inFlight();
    if (this.delivDish && DISH[this.delivDish] && DISH[this.delivDish].st === stId) want.push(this.delivDish); for (const d of want) { if ((busy[d] || 0) > 0) { busy[d]--; continue; } return d; } const m = this.menu().filter((d) => DISH[d].st === stId); return want[0] || m[0] || null; }
  inFlight() { const n = {}; for (const s of Object.values(this.st)) { const d = s.cook ? s.cook.dish : s.ready; if (d && d !== 'burnt') n[d] = (n[d] || 0) + 1; } for (const k in this.carry) { const d = this.carry[k]; if (DISH[d]) n[d] = (n[d] || 0) + 1; } for (const f of this.staff) if (DISH[f.carry]) n[f.carry] = (n[f.carry] || 0) + 1; return n; }
  act(pid, x, z) {
    const q = this.query(pid, x, z); if (!q) return null; const a = q.a;
    if (a === 'serve') { this.carry[pid] = null; this.serve(q.c); return 'serve'; }
    if (a === 'wrong') return 'deny';
    if (a === 'fix') { q.s.fixN++; if (q.s.fixN >= 5) this.fix(q.s); return 'fix'; }
    if (a === 'take') { this.carry[pid] = q.s.ready; q.s.ready = null; return 'take'; }
    if (a === 'cook') { if (!this.rival && this.br.stock <= 0) { if (this.br.autoStock && S.money >= 75) { S.money -= 75; this.br.stock += 30; EV.push({ t: 'toast', m: '📦 Auto-ordered 30 ingredients ($75)' }); } else { EV.push({ t: 'toast', m: '📦 Out of ingredients! Buy some at FreshMart', bad: true }); return 'deny'; } }
      if (!this.rival) this.br.stock--; q.s.cook = { dish: q.d, t: 0, T: DISH[q.d].t }; return 'cook'; }
    if (a === 'toss') { this.carry[pid] = null; this.trash++; return 'toss'; }
    if (a === 'wash') { this.carry[pid] = null; this.br.sanitation = Math.min(100, (this.br.sanitation || 0) + 1.5); return 'wash'; }
    if (a === 'hands') { this.clean[pid] = 120; EV.push({ t: 'toast', m: '✨ Squeaky clean hands! Tips +15% for a while' }); return 'hands'; }
    if (a === 'clean') { this.mess = this.mess.filter((m) => m !== q.m); if (q.m.kind === 'plate') this.carry[pid] = 'dirty'; else this.br.sanitation = Math.min(100, (this.br.sanitation || 0) + 2); return 'clean'; }
    return null;
  }
  serve(c) { c.st = 'eat'; c.eatT = 6 + Math.random() * 3; this.fx.push({ k: 'heart', x: c.x, z: c.z }); }
  // ---------------- staff AI ----------------
  stepStaff(f, dt) {
    const sp = 2.2 + f.skill * 0.35 * (f.cameo === 'torty' ? 0.4 : 1); if (f.wait > 0) { f.wait -= dt; f.sp = 0; return; }
    if (f.task) { const T = f.task; const p = this.route(f, T); if (!this.moveTo(f, p.x, p.z, sp, dt) || !p.final) return; f.task = null; T.done && T.done(); f.wait = 0.4; return; }
    if (f.role === 'cook') { // cook the oldest unmet order at a free station; carry it out if there's no waiter
      if (f.carry) { const c = this.cust.find((c) => c.st === 'wait' && c.dish === f.carry); if (c) { f.task = { x: c.x + (c.x > 0 ? -0.6 : 0.6), z: c.z + 0.6, done: () => { if (c.st === 'wait' && c.dish === f.carry) { this.serve(c); f.carry = null; } } }; } else { f.carry = null; } return; }
      const waiter = this.staff.some((s) => s.role === 'waiter');
      if (!waiter) { const s = Object.values(this.st).find((s) => s.ready && s.ready !== 'burnt' && this.cust.some((c) => c.st === 'wait' && c.dish === s.ready)); if (s) { f.task = { x: s.x, z: s.z, done: () => { if (s.ready) { f.carry = s.ready; s.ready = null; } } }; return; } }
      const burnt = Object.values(this.st).find((s) => s.ready === 'burnt'); if (burnt) { f.task = { x: burnt.x, z: burnt.z, done: () => { burnt.ready = null; this.trash++; } }; return; }
      const busy = this.inFlight(); for (const c of this.cust.filter((c) => c.st === 'wait').sort((a, b) => b.pat - a.pat)) { if ((busy[c.dish] || 0) > 0) { busy[c.dish]--; continue; } const s = this.st[DISH[c.dish].st]; if (!s || s.cook || s.ready || s.broken || s.claim) continue;
        s.claim = f.id; f.task = { x: s.x, z: s.z, done: () => { s.claim = null; if (!s.cook && !s.ready && !s.broken && (this.rival || this.br.stock > 0)) { if (!this.rival) this.br.stock--; s.cook = { dish: c.dish, t: 0, T: DISH[c.dish].t * (1.25 - f.skill * 0.08) }; f.work = 2; } } }; return; }
      if (Math.hypot(f.x + 2, f.z + 5.3) > 0.3) f.task = { x: -2 + (f.id.length % 3), z: -5.3 }; return; }
    if (f.role === 'waiter') {
      if (f.carry) { const c = this.cust.find((c) => c.st === 'wait' && c.dish === f.carry && !c.claimW); if (c) { c.claimW = f.id; f.task = { x: c.x + (c.side || (c.x > 0 ? -0.6 : 0.6)), z: c.z + 0.6, done: () => { c.claimW = null; if (c.st === 'wait' && c.dish === f.carry) { this.serve(c); f.carry = null; } } }; } else if (f.carry === 'dirty') { const sk = this.R.spots.find((p) => p.kind === 'sink'); f.task = { x: sk.x, z: sk.z, done: () => { f.carry = null; } }; } else f.carry = null; return; }
      const s = Object.values(this.st).find((s) => s.ready && s.ready !== 'burnt' && this.cust.some((c) => c.st === 'wait' && c.dish === s.ready)); if (s) { f.task = { x: s.x, z: s.z, done: () => { if (s.ready && s.ready !== 'burnt') { f.carry = s.ready; s.ready = null; } } }; return; }
      const pl = this.mess.find((m) => m.kind === 'plate' && !m.claim); if (pl) { pl.claim = 1; f.task = { x: pl.x, z: pl.z + 0.5, done: () => { this.mess = this.mess.filter((m) => m !== pl); f.carry = 'dirty'; } }; return; }
      if (Math.hypot(f.x - 3, f.z - 6) > 0.3) f.task = { x: 3, z: 6 }; return; }
    if (f.role === 'janitor') { const m = this.mess.find((m) => !m.claim); if (m) { m.claim = 1; f.task = { x: m.x, z: m.z + 0.4, done: () => { this.mess = this.mess.filter((x) => x !== m); this.br.sanitation = Math.min(100, (this.br.sanitation || 0) + 2); f.work = 1.5; } }; return; }
      if (this.trash > 3) { this.trash = 0; } if (Math.random() < dt * 0.2) f.task = { x: -8 + Math.random() * 16, z: 0 + Math.random() * 6 }; return; }
    if (f.role === 'manager') { const b = Object.values(this.st).find((s) => s.broken); if (b && !this.snowie && !this.rival) { this.callSnowie(); EV.push({ t: 'toast', m: '👔 Your manager called Snowie to fix it' }); } if (Math.hypot(f.x + 3, f.z - 6.6) > 0.3) f.task = { x: -3, z: 6.6 }; }
  }
  // ---------------- inspector ----------------
  startInspection() { if (this.insp) return; this.insp = { x: DOOR.x, z: DOOR.z + 1, ry: Math.PI, phase: 0, t: 0, pts: [{ x: -2, z: 2.5 }, { x: 7.0, z: -2.2 }, { x: 6.0, z: -5.6 }, { x: 0, z: -5.6 }, { x: -6, z: -5.6 }, { x: -8.6, z: -2.2 }, { x: -6, z: 2.5 }, { x: 4, z: 5.5 }, { x: DOOR.x, z: 6.5 }], i: 0, notes: [] };
    EV.push({ t: 'banner', m: '🕵️ SURPRISE INSPECTION!', s: 'Inspector Grumbleton is here. Clean up messes + fix machines before he finishes!', bad: true }); }
  stepInsp(dt) { const n = this.insp; if (n.wait > 0) { n.wait -= dt; n.sp = 0; return; } const p0 = n.pts[n.i]; if (!p0) { this.finishInsp(); return; } n.t += dt;
    const p = this.route(n, p0); if (this.moveTo(n, p.x, p.z, 1.1, dt) && p.final) { n.i++; n.wait = 1.6; const quips = ['Hmph.', 'Is that... a CRUMB?', '*scribbles angrily*', 'I can smell that grill from here.', 'Mmm-hmm. MMM-HMM.', 'Do you call that clean?', 'I\'m watching you.', 'Fascinating. Disturbing, but fascinating.'];
      EV.push({ t: 'quip', m: '🕵️ "' + quips[(Math.random() * quips.length) | 0] + '"' }); n.x = p0.x; n.z = p0.z; }
  }
  finishInsp() { let sc = 100; const notes = []; sc -= this.mess.length * 9; if (this.mess.length) notes.push(this.mess.length + ' mess' + (this.mess.length > 1 ? 'es' : ''));
    const br = Object.values(this.st).filter((s) => s.broken).length; sc -= br * 12; if (br) notes.push('broken machine');
    const burnt = Object.values(this.st).filter((s) => s.ready === 'burnt').length; sc -= burnt * 8; if (burnt) notes.push('burnt food'); if (this.trash > 6) { sc -= 6; notes.push('full trash'); }
    if (this.anyClean()) sc += 6; if (this.staff.some((s) => s.role === 'janitor')) sc += 6; if (S.cleanCert) sc += 10; sc = Math.round(sc); this.insp = null;
    if (this.rival) { EV.push({ t: 'toast', m: '🕵️ Inspector graded ' + this.br.name + ': ' + (sc >= 88 ? 'A' : sc >= 72 ? 'B' : 'C') }); return; }
    this.br.sanitation = Math.max(0, Math.min(100, sc)); applyGrade(this.br, sc, false); persist(); }
  // ---------------- snapshot for co-op ----------------
  snap() { return { c: this.cust.map((c) => [c.id, c.seed, +c.x.toFixed(2), +c.z.toFixed(2), +c.ry.toFixed(2), c.st, c.dish, +c.mood.toFixed(2), c.critic ? 1 : 0, +(c.sp || 0).toFixed(1)]),
    s: Object.values(this.st).map((s) => [s.id, s.cook ? s.cook.dish : 0, s.cook ? +(s.cook.t / s.cook.T).toFixed(2) : 0, s.ready || 0, s.broken ? 1 : 0, s.fixN]), m: this.mess.map((m) => [m.id, m.kind, +m.x.toFixed(2), +m.z.toFixed(2)]),
    f: this.staff.map((f) => [f.id, +f.x.toFixed(2), +f.z.toFixed(2), +(f.ry || 0).toFixed(2), f.carry || 0, +(f.sp || 0).toFixed(1)]), k: this.carry, i: this.insp ? [+this.insp.x.toFixed(2), +this.insp.z.toFixed(2), +this.insp.ry.toFixed(2)] : 0, n: this.snowie ? [+this.snowie.x.toFixed(2), +this.snowie.z.toFixed(2), this.snowie.ry] : 0 }; }
  applySnap(d) { // client: mirror host state
    const byId = new Map(this.cust.map((c) => [c.id, c])); this.cust = d.c.map((a) => { const c = byId.get(a[0]) || { id: a[0] }; Object.assign(c, { seed: a[1], tx: a[2], tz: a[3], ry: a[4], st: a[5], dish: a[6], mood: a[7], critic: !!a[8], sp: a[9] }); if (c.x === undefined) { c.x = a[2]; c.z = a[3]; } return c; });
    for (const a of d.s) { const s = this.st[a[0]]; if (!s) continue; s.cook = a[1] ? { dish: a[1], t: a[2], T: 1 } : null; s.ready = a[3] || null; s.broken = a[4] ? 'gag' : null; s.fixN = a[5]; }
    this.mess = d.m.map((a) => ({ id: a[0], kind: a[1], x: a[2], z: a[3] })); const fb = new Map(this.staff.map((f) => [f.id, f]));
    this.staff = d.f.map((a) => { const f = fb.get(a[0]) || { id: a[0], role: 'cook', skill: 2 }; Object.assign(f, { tx: a[1], tz: a[2], ry: a[3], carry: a[4] || null, sp: a[5] }); if (f.x === undefined) { f.x = a[1]; f.z = a[2]; } return f; });
    this.carry = d.k || {}; this.insp = d.i ? Object.assign(this.insp || {}, { tx: d.i[0], tz: d.i[1], ry: d.i[2], x: (this.insp && this.insp.x) ?? d.i[0], z: (this.insp && this.insp.z) ?? d.i[1] }) : null;
    this.snowie = d.n ? Object.assign(this.snowie || {}, { tx: d.n[0], tz: d.n[1], ry: d.n[2], x: (this.snowie && this.snowie.x) ?? d.n[0], z: (this.snowie && this.snowie.z) ?? d.n[1] }) : null; }
  smooth(dt) { const k = Math.min(1, dt * 10); const f = (o) => { if (o && o.tx !== undefined) { o.x += (o.tx - o.x) * k; o.z += (o.tz - o.z) * k; } }; this.cust.forEach(f); this.staff.forEach(f); f(this.insp); f(this.snowie); }
}
