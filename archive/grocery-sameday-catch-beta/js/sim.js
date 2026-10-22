// Grok Grocery Tycoon - the live store simulation: shoppers walk the real aisles, buy from real shelves, queue at real
// checkout lanes; staff stock, scan and mop; trucks deliver; the clock runs the day. Pure data: game.js draws it.
import { S, persist, capOf, news } from './save.js?v=ggt20';
import { FIX, DEPTS, DEPT_IDS, STORE, ROLES, CAMEOS, typeOf } from './data.js?v=ggt20';
import { GEOM, ROADS } from './map.js?v=ggt20';
export const OPEN = 7 * 60, CLOSE = 22 * 60, MPS = 2; // game minutes per real second
export const EV = []; // UI events: {t:'toast'|'banner', m}
let NID = 1;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const fmtClock = (m) => { m = Math.floor(m); const h = Math.floor(m / 60) % 24, mm = m % 60; return ((h + 11) % 12 + 1) + ':' + (mm < 10 ? '0' : '') + mm + (h >= 12 ? ' PM' : ' AM'); };
export function storeIds() { return Object.keys(S.stores).filter((k) => S.stores[k] && (S.stores[k].owned || k === 's1' || STORE[k].rival)); }
export const mine = (sid) => { const st = S.stores[sid]; return !!st && (st.owned || (sid === 's1' && S.mode === 'career')); };
export function shelfFrac(st, dept) { const c = capOf(st, dept); return c ? st.shelf[dept] / c : 0; }
export function wholesale(dept) { return DEPTS[dept].val * 0.45 * (S.dc ? 0.82 : 1) * (S.cameos.torty ? 0.92 : 1); }
export function buyChance(p) { return clamp(1.3 - (p - 0.8) * 1.25, 0.25, 1); }
export class Sim {
  constructor() { this.ag = {}; this.spills = {}; this.carts = {}; this.trucks = []; this.reg = {}; this.playerReg = null; this.insp = null; this.t = 0; this.jam = {}; for (const k in STORE) { this.ag[k] = []; this.spills[k] = []; this.carts[k] = []; } this.seedCarts(); }
  seedCarts() { for (const k of ['s1', 's2', 's3']) { const d = STORE[k], c = this.carts[k]; c.length = 0; if (!mine(k) || !typeOf(S.stores[k]).carts) continue; for (let i = 0; i < 4; i++) this.looseCart(k); } }
  looseCart(sid) { const d = STORE[sid], c = this.carts[sid]; if (c.length >= 9) return; c.push({ id: NID++, x: d.x0 + 4 + Math.random() * (d.x1 - d.x0 - 8), z: d.z1 + 5 + Math.random() * 7, ry: Math.random() * 6, vis: true }); }
  // ---------- staffing ----------
  staffOf(sid) { return (S.stores[sid] && S.stores[sid].staff) || []; }
  has(sid, role) { return this.staffOf(sid).some((s) => s.role === role); }
  lanes(sid) { const st = S.stores[sid], G = GEOM[sid]; const out = []; st.layout.forEach((f, i) => { if (f === 'register' || f === 'selfck') out.push({ i, f, sl: G.slots[i] }); }); return out; }
  // which registers have a cashier: staff cashiers fill lanes in order; you can take any free one
  staffed(sid) { const L = this.lanes(sid).filter((l) => l.f === 'register'); let n = this.staffOf(sid).filter((s) => s.role === 'cashier').length; const out = {}; for (const l of L) { if (this.playerReg && this.playerReg.sid === sid && this.playerReg.i === l.i) { out[l.i] = 'you'; continue; } if (n > 0) { out[l.i] = 'staff'; n--; } } return out; }
  // ---------- clock ----------
  step(dt, game) { this.t += dt; const before = S.time; S.time += dt * MPS;
    if (before < CLOSE && S.time >= CLOSE) { game.dayEnd(); }
    for (const sid of storeIds()) this.stepStore(sid, dt);
    this.stepTrucks(dt); if (this.insp) this.stepInsp(dt, game);
    if (Math.floor(before / 30) !== Math.floor(S.time / 30)) this.halfHour(); }
  isOpen() { return S.time >= OPEN && S.time < CLOSE - 10; }
  rushK() { const t = S.time; return ((t > 690 && t < 810) || (t > 1020 && t < 1140) ? 1.35 : 1) * (S.event && S.event.k === 'rush' ? 1.8 : 1); }
  // ---------- one store ----------
  stepStore(sid, dt) { const st = S.stores[sid], G = GEOM[sid], A = this.ag[sid], rival = STORE[sid].rival; if (!st || !G) return;
    const shops = st.layout.map((f, i) => f && FIX[f].dept ? i : -1).filter((i) => i >= 0);
    const max = sid === 's1' || rival ? 18 : 13;
    st._spawn = (st._spawn ?? 2) - dt;
    if (this.isOpen() && st._spawn <= 0 && shops.length && this.lanes(sid).length) { st._spawn = this.interval(sid, st, shops); if (A.length < max) this.spawn(sid, st, G, shops); }
    for (const a of A) this.stepAgent(sid, st, G, a, dt);
    for (let i = A.length - 1; i >= 0; i--) if (A[i].gone) A.splice(i, 1);
    // staff work
    const staff = this.staffOf(sid);
    for (const s of staff) { s._t = (s._t || 0) - dt; if (s._t > 0) continue;
      if (s.role === 'stocker') { s._t = (s.cameo === 'snowie' ? 1.0 : 2.4) / (0.6 + (s.skill || 2) * 0.2); this.restock(st, rival ? 2 : 1); }
      else if (s.role === 'janitor') { s._t = 6 / (0.6 + (s.skill || 2) * 0.2); const sp = this.spills[sid]; if (sp.length) sp.shift(); st.clean = Math.min(100, st.clean + 4); }
      else if (s.role === 'manager') { s._t = 8; if (!rival && st.auto) this.autoOrder(sid, st); }
      else s._t = 5; }
    if (rival) { for (const k of DEPT_IDS) { const c = capOf(st, k); if (st.shelf[k] < c * 0.5) st.shelf[k] += 1; } }
    else if (mine(sid) && this.has(sid, 'greeter')) st.rep = Math.min(100, st.rep + dt * 0.002);
    st.clean = Math.max(0, st.clean - dt * 0.02 * (1 + this.spills[sid].length * 0.5)); }
  interval(sid, st, shops) { const depts = new Set(shops.map((i) => FIX[st.layout[i]].dept)).size; let k = (0.45 + st.rep / 90) * (0.55 + Math.min(depts, 7) * 0.11) * this.rushK() * Math.max(0.6, typeOf(st).traffic);
    const avgP = DEPT_IDS.reduce((a, d) => a + st.price[d], 0) / DEPT_IDS.length; k *= clamp(1.5 - avgP * 0.5, 0.6, 1.15);
    if (!STORE[sid].rival && S.war && S.war.day === S.day && avgP > 0.92 && !(st.ad > 0)) k *= 0.65; if (st.ad > 0) k *= 1.25; if (st.clean < 50) k *= 0.85;
    return clamp(7.5 / k, 1.6, 14) * (0.7 + Math.random() * 0.6); }
  spawn(sid, st, G, shops) { const n = 2 + ((Math.random() * 3) | 0), want = []; for (let i = 0; i < n; i++) want.push(shops[(Math.random() * shops.length) | 0]);
    const a = { id: NID++, sid, seed: (Math.random() * 1e6) | 0, x: G.doorX + (Math.random() - 0.5) * 2, z: G.front + 1.5, ry: Math.PI, sp: 0, st: 'walk', path: [[G.doorX + (Math.random() - 0.5) * 2.4, G.front - 2.5], [G.doorX + (Math.random() - 0.5) * 3, G.cross[G.cross.length - 1]]], want, basket: 0, items: 0, mood: 1, pat: 0, wait: 0, cart: !!typeOf(st).carts && Math.random() < 0.7, vis: true, help: mine(sid) && Math.random() < 0.18 };
    if (S.vip && S.vip.sid === sid && !S.vip.spawned && !S.cameos[S.vip.id] && Math.random() < 0.5) { a.pet = S.vip.id; S.vip.spawned = true; a.cart = false; }
    this.ag[sid].push(a); return a; }
  route(G, a, tx, tz) { const lanes = G.lanes, cr = G.cross; const nearest = (arr, v) => arr.reduce((b, x) => Math.abs(x - v) < Math.abs(b - v) ? x : b, arr[0]);
    const zc = nearest(cr, a.z), lx = nearest(lanes, tx); return [[a.x, zc], [lx, zc], [lx, tz], [tx, tz]]; }
  next(sid, st, G, a) { // pick the next thing to do
    while (a.want.length) { const i = a.want.shift(), f = st.layout[i]; if (!f || !FIX[f].dept) continue; const sl = G.slots[i]; const side = Math.random() < 0.5 ? -1 : 1, lx = G.lanes.reduce((b, x) => Math.abs(x - (sl.x + side * 2.3)) < Math.abs(b - (sl.x + side * 2.3)) ? x : b, G.lanes[0]);
      a.target = i; a.path = this.route(G, a, lx, sl.z + (Math.random() - 0.5) * 3.6); a.path.pop(); a.st = 'walk'; a.after = 'browse'; a.face = lx < sl.x ? Math.PI / 2 : -Math.PI / 2; return; }
    if (a.items <= 0) { this.leave(sid, st, G, a, a.oos ? 'oos' : null); return; }
    this.toQueue(sid, st, G, a); }
  toQueue(sid, st, G, a) { const L = this.lanes(sid).filter((l) => !(l.f === 'selfck' && this.jam[sid + l.i])); const staffed = this.staffed(sid); let best = null, bq = 1e9;
    for (const l of L) { if (l.f === 'register' && !staffed[l.i]) continue; const q = this.ag[sid].filter((o) => o.lane === l.i && (o.st === 'q' || o.st === 'toq')).length + (l.f === 'selfck' ? -0.5 : 0); if (q < bq) { bq = q; best = l; } }
    if (!best) { a.st = 'wait'; a.wait = 2; a.lane = null; return; }
    a.lane = best.i; a.laneF = best.f; const sl = best.sl; const qx = best.f === 'selfck' ? sl.x : sl.x + 0.75; const zc = G.cross[G.cross.length - 1];
    a.path = [[a.x, G.cross.reduce((b, x) => Math.abs(x - a.z) < Math.abs(b - a.z) ? x : b, G.cross[0])], [qx, zc]]; if (Math.abs(a.path[0][1] - zc) > 0.5) a.path.splice(1, 0, [G.lanes.reduce((b, x) => Math.abs(x - qx) < Math.abs(b - qx) ? x : b, G.lanes[0]), a.path[0][1]], [G.lanes.reduce((b, x) => Math.abs(x - qx) < Math.abs(b - qx) ? x : b, G.lanes[0]), zc]);
    a.st = 'toq'; }
  qPos(G, sl, f, k) { return f === 'selfck' ? [sl.x, G.zCheck - 1.4 - k * 0.85] : [sl.x + 0.75, G.zCheck - k * 0.85]; }
  leave(sid, st, G, a, why) { a.st = 'out'; a.lane = null; const sg = a.x < G.doorX ? -1 : 1, lc = G.cross[G.cross.length - 1];
    if (a.z < G.zCheck - 0.6) a.path = [[a.x, lc], [G.doorX + sg * 1.5, lc], [G.doorX + sg * 1.2, G.front - 2.2], [G.doorX + sg * 0.8, G.front + 2.5]];
    else a.path = [[a.x, G.front - 3.2], [G.doorX + sg * 1.0, G.front - 2.2], [G.doorX + sg * 0.8, G.front + 2.5]];
    if (why && mine(sid)) { st.rep = Math.max(0, st.rep - (why === 'angry' ? 1.0 : 0.5)); st.angry++; if (why === 'angry') EV.push({ t: 'toast', m: '😤 A shopper gave up waiting at ' + (STORE[sid].short), sid }); else if (why === 'oos') EV.push({ t: 'toast', m: '📭 A shopper left: ' + (typeof a.oos === 'string' && DEPTS[a.oos] ? DEPTS[a.oos].n + ' shelves' : 'shelves') + ' empty at ' + STORE[sid].short + ' · grab a case from the back!', sid }); } }
  move(a, dt, sp) { const p = a.path[0]; if (!p) return true; const dx = p[0] - a.x, dz = p[1] - a.z, d = Math.hypot(dx, dz); if (d < 0.1) { a.path.shift(); return !a.path.length; } const s = Math.min(d, sp * dt); a.x += dx / d * s; a.z += dz / d * s; let dy = Math.atan2(dx, dz) - a.ry; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); a.ry += dy * Math.min(1, dt * 10); a.sp = sp; a.wt = (a.wt || 0) + dt * sp * 4.2; return false; }
  stepAgent(sid, st, G, a, dt) { a.sp = 0; if (a.pick > 0) a.pick -= dt;
    if (a.st === 'walk') { if (this.move(a, dt, a.pet ? 1.3 : 1.5)) { if (a.after === 'browse') { a.st = 'browse'; a.wait = 1.6 + Math.random() * 1.4; a.ry = a.face; } else this.next(sid, st, G, a); } }
    else if (a.st === 'browse') { a.wait -= dt; if (a.wait <= 0) { const f = st.layout[a.target], dept = f && FIX[f].dept; if (dept && st.ss && !(st.ss[a.target] > 0) && st.shelf[dept] > 0 && (a.redir || 0) < 2) { const j = st.layout.findIndex((g, k) => g && FIX[g].dept === dept && st.ss[k] > 0); if (j >= 0) { a.redir = (a.redir || 0) + 1; a.want.unshift(j); this.next(sid, st, G, a); return; } } if (dept) { if (st.shelf[dept] > 0) { if (Math.random() < buyChance(st.price[dept])) { st.shelf[dept]--; if (st.ss && st.ss[a.target] > 0) st.ss[a.target]--; a.pick = 0.8; const v = DEPTS[dept].val * st.price[dept] * (dept === 'brand' ? 1.15 : 1); a.basket += v; a.items++; } else a.mood -= 0.15; } else { a.mood -= 0.3; a.oos = dept; } } if (!a.help) this.next(sid, st, G, a); else { a.wait = 0.5; } } }
    else if (a.st === 'wait') { a.wait -= dt; a.pat += dt; if (a.pat > 40) this.leave(sid, st, G, a, 'angry'); else if (a.wait <= 0) this.toQueue(sid, st, G, a); }
    else if (a.st === 'toq') { if (this.move(a, dt, 1.5)) { a.st = 'q'; } }
    else if (a.st === 'q') { const sl = G.slots[a.lane]; if (!sl || !st.layout[a.lane]) { this.toQueue(sid, st, G, a); return; } const Q = this.ag[sid].filter((o) => o.lane === a.lane && o.st === 'q').sort((p, q) => p.qid - q.qid); if (!a.qid) a.qid = NID++;
      const k = Q.indexOf(a), [tx, tz] = this.qPos(G, sl, a.laneF, k); const dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz); if (d > 0.08) { a.x += dx / d * Math.min(d, 1.4 * dt); a.z += dz / d * Math.min(d, 1.4 * dt); a.sp = 1.4; a.wt = (a.wt || 0) + dt * 6; a.ry = Math.atan2(dx, dz); } else a.ry = a.laneF === 'selfck' ? 0 : 0;
      a.pat += dt * (this.has(sid, 'greeter') ? 0.7 : 1); if (a.pat > 75 + a.items * 6) { this.leave(sid, st, G, a, 'angry'); return; }
      if (k === 0 && d < 0.3) { const staffed = this.staffed(sid)[a.lane]; if (a.laneF === 'register' && !staffed) { this.toQueue(sid, st, G, a); return; }
        if (staffed === 'you') { a.atYou = true; return; } a.atYou = false;
        a.serve = (a.serve || 0) + dt; const cs = this.staffOf(sid).find((s) => s.role === 'cashier') || { skill: 2 }; const need = (a.laneF === 'selfck' ? 4.2 : 2.2 + a.items * 0.7 / (0.6 + cs.skill * 0.2)) * (this.has(sid, 'bagger') ? 0.72 : 1) * (a.bagged ? 0.4 : 1);
        if (a.serve >= need) this.pay(sid, st, G, a, 0); } }
    else if (a.st === 'out') { if (this.move(a, dt, 1.6)) { a.gone = true; if (a.cart && mine(sid) && this.carts[sid] && STORE[sid].z1 > -60 && !STORE[sid].strip && ['s1', 's2', 's3'].includes(sid) && Math.random() < (this.has(sid, 'greeter') ? 0.15 : 0.4)) this.looseCart(sid); } } }
  pay(sid, st, G, a, tip) { const amt = Math.round(a.basket + tip); if (mine(sid)) { if (S.mode === 'boss' || st.owned) { S.money += amt; } st.rev += amt; st.cust++; S.stats.served++; S.stats.revenue += amt; st.rep = Math.min(100, st.rep + 0.12 + a.mood * 0.25); EV.push({ t: 'cash', sid, x: a.x, z: a.z, v: amt });
      if (Math.random() < 0.07) { const sp = this.spills[sid]; if (sp.length < 6) { const sl = G.slots[(Math.random() * G.slots.length) | 0]; const lx = G.lanes[(Math.random() * G.lanes.length) | 0]; sp.push({ id: NID++, x: lx + (Math.random() - 0.5), z: G.cross[(Math.random() * G.cross.length) | 0] + (Math.random() - 0.5), k: (Math.random() * 3) | 0 }); EV.push({ t: 'toast', m: '💦 Spill on the floor at ' + STORE[sid].short + '!', sid, quiet: true }); } } }
    else st.rev += amt;
    this.leave(sid, st, G, a, null); }
  restock(st, n) { let best = null, bf = 1; for (const k of DEPT_IDS) { const c = capOf(st, k); if (!c || st.back[k] <= 0 && !STORE[st.id].rival) continue; const f = st.shelf[k] / c; if (f < bf && f < 0.98) { bf = f; best = k; } } if (!best) return null; const c = capOf(st, best); const m = Math.min(n, c - st.shelf[best], STORE[st.id].rival ? n : st.back[best]); st.shelf[best] += m; if (!STORE[st.id].rival) st.back[best] -= m; return best; }
  autoOrder(sid, st) { for (const k of DEPT_IDS) { const c = capOf(st, k); if (!c) continue; const pend = this.trucks.filter((t) => t.sid === sid).reduce((a, t) => a + (t.items[k] || 0), 0); if (st.shelf[k] + st.back[k] + pend < c * 0.55) { this.order(sid, { [k]: Math.round(c * 0.8) }, true); } } }
  // ---------- deliveries ----------
  orderCost(items) { let c = 0; for (const k in items) c += items[k] * wholesale(k); return Math.round(c); }
  order(sid, items, auto) { const cost = this.orderCost(items); const st = S.stores[sid]; const pay = S.mode === 'boss' || st.owned; if (pay && S.money < cost) { if (!auto) EV.push({ t: 'toast', m: '💸 Not enough money for that order' }); return false; } if (pay) S.money -= cost; else st.costs = (st.costs || 0) + cost;
    const src = S.dc ? 'dc' : (() => { const k = Object.keys(items)[0]; return DEPTS[k].sup; })(); const t = { id: NID++, sid, items, src, path: this.truckPath(src, sid), x: 0, z: 0, ry: 0, wait: 0, vis: true }; t.x = t.path[0][0]; t.z = t.path[0][1];
    // with no free truck in the fleet the order still comes, a bit later
    const busy = this.trucks.length; if (busy >= Math.max(1, S.trucks) + 2) t.wait = 8; this.trucks.push(t); if (!auto) EV.push({ t: 'toast', m: '🚚 Truck on the way from ' + ({ dc: 'your DC', farm: 'Fernhill Farm', ratita: 'Ratita Industries', tortuga: 'Tortuga Tech', brand: 'Grok Goods Lab', ruff: 'Ruffsources Supply' }[src]) }); return true; }
  dockOf(id) { if (STORE[id]) return [STORE[id].x0 + 10, STORE[id].dockZ]; return { dc: [52, -53], farm: [50, 47], ratita: [-12, 47], tortuga: [14, 47], brand: [-14, 53], ruff: [-70, 19] }[id]; }
  truckPath(src, sid) { const a = this.dockOf(src), b = this.dockOf(sid); const ea = ROADS.ew.reduce((p, z) => Math.abs(z - a[1]) < Math.abs(p - a[1]) ? z : p), eb = ROADS.ew.reduce((p, z) => Math.abs(z - b[1]) < Math.abs(p - b[1]) ? z : p); const lane = (z) => z + 2.4;
    const P = [[a[0], a[1]], [a[0], lane(ea)]]; if (ea !== eb) { const nx = ROADS.ns.reduce((p, x) => Math.abs(x - (a[0] + b[0]) / 2) < Math.abs(p - (a[0] + b[0]) / 2) ? x : p); P.push([nx, lane(ea)], [nx, lane(eb)]); } P.push([b[0], lane(eb)], [b[0], b[1]]); return P; }
  stepTrucks(dt) { for (const t of this.trucks) { if (t.wait > 0) { t.wait -= dt; continue; } const p = t.path[0]; if (!p) { if (!t.done) { t.done = true; const st = S.stores[t.sid]; for (const k in t.items) st.back[k] = (st.back[k] || 0) + t.items[k]; t.unload = 3; if (t.sid === 's1' || mine(t.sid)) EV.push({ t: 'toast', m: '📦 Delivery unloaded at ' + STORE[t.sid].short, sid: t.sid, quiet: true }); }
        t.unload -= dt; if (t.unload <= 0) t.gone = true; t.sp = 0; continue; }
      const dx = p[0] - t.x, dz = p[1] - t.z, d = Math.hypot(dx, dz); if (d < 0.3) { t.path.shift(); continue; } const sp = 13; t.x += dx / d * Math.min(d, sp * dt); t.z += dz / d * Math.min(d, sp * dt); let dy = Math.atan2(dx, dz) - t.ry; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); t.ry += dy * Math.min(1, dt * 6); t.sp = sp; }
    this.trucks = this.trucks.filter((t) => !t.gone); }
  // ---------- health inspection ----------
  startInspection(sid) { const G = GEOM[sid]; this.insp = { sid, t: 0, x: G.doorX, z: G.front + 1.5, ry: Math.PI, path: [[G.doorX, G.cross[G.cross.length - 1]], [G.lanes[1], G.cross[G.cross.length - 1]], [G.lanes[1], G.cross[0]], [G.lanes[G.lanes.length - 2], G.cross[0]], [G.lanes[G.lanes.length - 2], G.cross[G.cross.length - 1]], [G.doorX, G.front - 2], [G.doorX, G.front + 2]], vis: true, cap: true, sp: 0 };
    EV.push({ t: 'banner', m: '📋 HEALTH INSPECTION! Inspector Prue Crisper just walked into ' + STORE[sid].short, s: 'Mop spills fast and keep shelves stocked!' }); }
  grade(sid) { const st = S.stores[sid]; let pts = 100 - this.spills[sid].length * 14 - (100 - st.clean) * 0.4; for (const k of ['frozen', 'dairy', 'meat']) if (capOf(st, k) && st.shelf[k] <= 0) pts -= 10; if (this.has(sid, 'janitor')) pts += 6; return pts >= 80 ? 'A' : pts >= 60 ? 'B' : 'C'; }
  stepInsp(dt, game) { const I = this.insp; if (I.path.length) { this.move(I, dt, 1.2); return; } const g = this.grade(I.sid), st = S.stores[I.sid]; st.grade = g; S.stats.inspections++; this.insp = null;
    if (g === 'A') { S.stats.aGrades++; st.rep = Math.min(100, st.rep + 8); S.goals.gradeA = 1; } else if (g === 'C') { st.rep = Math.max(0, st.rep - 8); if (S.mode === 'boss' || st.owned) S.money -= 250; }
    news(`Health inspection at ${STORE[I.sid].short}: grade ${g}!`); EV.push({ t: 'banner', m: `📋 Inspection result: GRADE ${g}`, s: g === 'A' ? 'Sparkling! +8 reputation' : g === 'B' ? 'Not bad. Mop more, stock more.' : 'Yikes! -8 reputation' + (S.mode === 'boss' ? ' and a $250 fine' : '') }); game.onInspected && game.onInspected(g); persist(); }
  halfHour() { // timed events through the day
    const t = Math.floor(S.time); if (S.insp.day === S.day && t >= 11 * 60 && t < 11 * 60 + 30 && !this.insp && !S.insp.done) { S.insp.done = 1; this.startInspection(S.insp.sid || 's1'); }
    for (const sid of storeIds()) { const st = S.stores[sid]; if (st.ad > 0) st.ad -= 0.5; }
    if (S.event && S.event.k === 'freeze' && !S.event.done && t >= 13 * 60) { S.event.done = 1; const st = S.stores.s1; if (!capOf(st, 'frozen')) { EV.push({ t: 'toast', m: '⚡ A power blip flickered the lights at Main St. No harm done!' }); } else if (!S.unlock.cold) { st.shelf.frozen = Math.floor(st.shelf.frozen * 0.6); EV.push({ t: 'banner', m: '❄️ Freezer power blip at Main St!', s: 'Some frozen stock melted. Torty sells a Cold Chain upgrade at Tortuga Tech.' }); } else EV.push({ t: 'toast', m: '❄️ Power blip! Your Tortuga Cold Chain kept the freezers frosty.' }); }
    if (S.event && S.event.k === 'jam' && !S.event.done && t >= 15 * 60) { S.event.done = 1; const L = this.lanes('s1').filter((l) => l.f === 'selfck'); if (L.length && !S.cameos.luna) { this.jam['s1' + L[0].i] = 1; EV.push({ t: 'banner', m: '🤖 A self-checkout jammed!', s: 'Walk up to it and tap UNJAM (Luna can make it jam-proof).' }); } } }
  clearDay() { for (const k in this.ag) this.ag[k].length = 0; this.playerReg = null; this.insp = null; }
}
