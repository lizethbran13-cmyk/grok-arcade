// Online Order Mode DLC (Issue #85): Tortuga Eats / Ratita Rush app orders, curbside pickup + same-day delivery, 5 pet crew, real consequences + never-stuck reboot.
import { DLC_ONLINE_KEY, ONLINE_PETS } from './data.js';
import { DISH } from './food.js';
export function hasOnlineDLC() { try { return localStorage.getItem(DLC_ONLINE_KEY) === '1' || localStorage.getItem(DLC_ONLINE_KEY) === 'true'; } catch (e) { return false; } }
const NAMES = ['Ava', 'Mateo', 'Priya', 'Leo', 'Zoe', 'Omar', 'Mia', 'Kai', 'Lucia', 'Ben', 'Nora', 'Theo'];
const HOUSES = ['THE PATELS', 'THE NGUYENS', 'THE GARCIAS', 'BEACH HOUSE', 'TOWN HALL', 'GAZETTE'];
const VEH = { scooter: { n: '🛵 Ratita Rush Scooter', spd: 1.25, keep: 0.82 }, delivcar: { n: '🚗 Tortuga Thermal Cruiser', spd: 1.0, keep: 0.62 } };
export function vehFor(br) { const s = (br && br.style) || ''; return /bistro|grand/.test(s) ? 'delivcar' : 'scooter'; }
export function ensure(S) {
  if (!S.online) S.online = { rating: 4.8, bag: 100, tablet: 100, orders: [], nextId: 1, done: 0, tips: 0, refunds: 0, spawnT: 0, log: [] };
  const o = S.online; o.orders = o.orders || []; o.log = o.log || []; return o;
}
export function critical(o) { return o.rating < 3.2 || o.bag < 25 || o.tablet < 25; }
export function spawn(S, menu) {
  const o = ensure(S); const maxQ = o.tablet < 25 ? 2 : 4; if (o.orders.length >= maxQ) return null;
  const pool = (menu && menu.length ? menu : Object.keys(DISH)).filter((d) => DISH[d]); const dish = pool[(Math.random() * pool.length) | 0];
  const pickup = Math.random() < 0.4; const vip = !critical(o) && Math.random() < 0.25;
  const ord = { id: o.nextId++, app: Math.random() < 0.5 ? 'Tortuga Eats' : 'Ratita Rush', who: NAMES[(Math.random() * NAMES.length) | 0], to: HOUSES[(Math.random() * HOUSES.length) | 0], dish, pickup, vip, stage: 'new', prep: 0, temp: 100, eta: pickup ? 0 : 0, route: 0 };
  o.orders.push(ord); return ord;
}
// called each frame with game-minute delta
export function step(S, dMin, menu, vehKey) {
  const o = ensure(S); o.spawnT -= dMin; if (o.spawnT <= 0) { o.spawnT = (o.tablet < 25 ? 40 : 18) + Math.random() * 14; spawn(S, menu); }
  const v = VEH[vehKey] || VEH.scooter; const bagK = 0.6 + 0.4 * (o.bag / 100); const ev = [];
  for (const ord of o.orders) {
    if (ord.stage === 'prep') { ord.prep = Math.min(100, ord.prep + dMin * 6); if (ord.prep >= 100) ord.stage = 'ready'; }
    else if (ord.stage === 'ready') ord.temp = Math.max(0, ord.temp - dMin * 1.6);
    else if (ord.stage === 'sealed') ord.temp = Math.max(0, ord.temp - dMin * 0.5 / bagK);
    else if (ord.stage === 'route') { ord.route = Math.min(100, ord.route + dMin * 4 * v.spd); ord.temp = Math.max(0, ord.temp - dMin * (1 - v.keep * bagK) * 2.2); if (ord.route >= 100) ev.push(finish(S, ord)); }
  }
  o.orders = o.orders.filter((x) => x.stage !== 'done'); return ev;
}
export function finish(S, ord) {
  const o = ensure(S); ord.stage = 'done'; const base = DISH[ord.dish] ? DISH[ord.dish].price : 12; let r;
  if (ord.temp >= 70) { const tip = Math.round(base * (ord.vip ? 0.9 : 0.5) + 4); S.money += base + tip; o.tips += tip; o.rating = Math.min(5, o.rating + 0.1); o.done++; r = { good: true, msg: '🤑 HOT DROP! ' + ord.who + ' tipped $' + tip, cash: base + tip }; }
  else if (ord.temp >= 40) { const tip = 2; S.money += base + tip; o.done++; r = { good: true, msg: '🙂 Warm-ish. ' + ord.who + ' tipped $2', cash: base + tip }; }
  else r = consequence(S, ord, 'cold');
  o.log.unshift(r.msg); o.log = o.log.slice(0, 6); return r;
}
export function consequence(S, ord, why) {
  const o = ensure(S); const fee = 12 + (ord && ord.vip ? 8 : 0);
  S.money = Math.max(0, S.money - fee); o.refunds += fee; o.rating = Math.max(1, +(o.rating - 0.5).toFixed(1)); o.bag = Math.max(0, o.bag - 20); o.tablet = Math.max(0, o.tablet - 12);
  const msg = '🥶 ' + (why === 'cold' ? 'COLD' : why.toUpperCase()) + ' ORDER! −0.5⭐ rating · −$' + fee + ' refund/chargeback · Thermal Bag −20% · Tablet −12%';
  if (ord) ord.stage = 'done'; o.log.unshift(msg); o.log = o.log.slice(0, 6); return { good: false, msg, cash: -fee };
}
export function tuneUp(S) { const o = ensure(S); if (S.money < 40) return false; S.money -= 40; o.bag = 100; o.tablet = 100; o.rating = Math.max(o.rating, 4.0); return true; }
export function freeReboot(S) { const o = ensure(S); o.bag = 100; o.tablet = 100; o.rating = Math.max(o.rating, 4.2); if (S.money < 30) S.money = 30; o.log.unshift('🐶🐢 Candy & Torty FREE Emergency Reboot — back to 100%!'); return true; }
export function canFree(S) { const o = ensure(S); return critical(o) || o.rating < 4 || o.bag < 60 || o.tablet < 60 || S.money < 40; }
const bar = (v, c) => `<div class="tempBar"><i style="width:${Math.max(0, Math.min(100, v))}%;background:${c}"></i></div>`;
const tcol = (t) => (t >= 70 ? '#ef4444' : t >= 40 ? '#f59e0b' : '#38bdf8');
export function hubHTML(S, tab, vehKey) {
  const o = ensure(S); const v = VEH[vehKey] || VEH.scooter;
  const tabs = [['queue', '📲 Live Queue'], ['pets', '🐾 5 Pet Crew'], ['fleet', '🛵 Fleet & Gear'], ['safety', '🛠️ Repair & Reboot']].map(([k, l]) => `<button class="mbtn2${tab === k ? ' on' : ''}" data-a="tab" data-v="${k}" style="flex:1;${tab === k ? 'background:#fde68a' : ''}">${l}</button>`).join('');
  const stat = `<div style="display:flex;gap:6px;flex-wrap:wrap;font-weight:800;margin:6px 0"><span>⭐ ${o.rating.toFixed(1)}</span><span>🔥 Bag ${Math.round(o.bag)}%</span><span>📱 Tablet ${Math.round(o.tablet)}%</span><span>✅ ${o.done} done</span><span>🤑 $${o.tips} tips</span></div>`;
  let body = '';
  if (tab === 'queue') {
    if (!o.orders.length) body = '<p class="sub">📭 Waiting for app orders… new ones ping in every few minutes!</p>';
    const rank = { route: 0, sealed: 1, ready: 2, prep: 3, new: 4 };
    for (const d of o.orders.slice().sort((a, b) => rank[a.stage] - rank[b.stage])) { const dish = DISH[d.dish] || { e: '🍔', n: d.dish };
      const act = { new: ['prep', '👩‍🍳 Start prep'], prep: [null, '⏳ Cooking ' + Math.round(d.prep) + '%'], ready: ['seal', '🔥 Seal in Hot Bag'], sealed: [d.pickup ? 'pickup' : 'go', d.pickup ? '🐶 Candy hands to customer' : '🏴‍☠️ Dispatch ' + v.n], route: [null, '🗺️ En route ' + Math.round(d.route) + '%'] }[d.stage] || [null, ''];
      body += `<div class="onCard ${d.pickup ? 'pickup' : ''} ${d.temp < 40 ? 'cold' : ''}"><div class="onTop"><span class="appTag ${d.app === 'Ratita Rush' ? 'rush' : ''}">${d.app}</span>${d.pickup ? '<span class="appTag pick">🛍️ CURBSIDE PICKUP</span>' : '<span class="appTag">🚚 SAME-DAY DELIVERY</span>'}${d.vip ? '<span class="appTag rush">⭐ VIP</span>' : ''}</div>
      <b>#${d.id} ${dish.e} ${dish.n}</b> for ${d.who}${d.pickup ? '' : ' → ' + d.to}<div style="font-size:12px">🌡️ Food temp ${Math.round(d.temp)}%</div>${bar(d.temp, tcol(d.temp))}${d.stage === 'route' ? '<div style="font-size:12px">🗺️ Route</div>' + bar(d.route, '#22c55e') : ''}
      ${act[0] ? `<button class="go" data-a="${act[0]}" data-v="${d.id}">${act[1]}</button>` : `<div class="sub">${act[1]}</div>`}</div>`; }
    if (o.log.length) body += '<h3>Recent</h3>' + o.log.slice(0, 3).map((l) => `<div class="sub">${l}</div>`).join('');
  } else if (tab === 'pets') {
    body = '<div class="petGrid">' + ONLINE_PETS.map((p) => `<div class="petCard"><b>${p.icon} ${p.name}</b><i>${p.species}</i><div>🎖️ ${p.role}</div><div class="sub">${p.perk}</div></div>`).join('') + '</div>';
  } else if (tab === 'fleet') {
    body = `<div class="onCard"><b>Your restaurant's ride: ${v.n}</b><div class="sub">Diners & shacks get the zippy scooter, bistros get the thermal cruiser. You can deliver it yourself!</div><div>Speed ×${v.spd} · Heat keep ${Math.round(v.keep * 100)}%</div></div>
    <div class="onCard"><b>🔥 Thermal Hot Bag ${Math.round(o.bag)}%</b>${bar(o.bag, '#f97316')}<div class="sub">Worn bags let food go cold faster.</div></div>
    <div class="onCard"><b>📱 Dispatch Tablet ${Math.round(o.tablet)}%</b>${bar(o.tablet, '#3b82f6')}<div class="sub">Below 25%: order intake slows & VIP rush orders are disabled.</div></div>`;
  } else {
    const crit = critical(o);
    body = `<div class="conseqBox"><b>⚠️ Real consequences</b><div class="sub">Late / cold / spilled / wrong orders: −0.5⭐ App Rating, −$12 refund/chargeback (+$8 VIP), Thermal Bag −20%, Tablet −12%.</div>${crit ? '<div><b style="color:#b91c1c">🚨 CRITICAL: intake slowed, VIP rush disabled!</b></div>' : ''}${o.log.slice(0, 2).map((l) => `<div class="sub">${l}</div>`).join('')}</div>
    <button class="go" data-a="tune" ${S.money < 40 ? 'disabled' : ''}>🔧 Pro Tune-Up ($40) — Bag & Tablet 100%</button>
    <button class="freeRebootBtn" data-a="free" ${canFree(S) ? '' : 'disabled style="opacity:.5"'}>🐶🐢 Candy & Torty's FREE Emergency Kitchen & Rating Reboot<br><small>$0 / Free — Never Stuck!</small></button>
    <button class="mbtn2" data-a="test">🧪 Practice: simulate a cold order</button>`;
  }
  return `<div style="display:flex;gap:4px;margin-bottom:6px">${tabs}</div>${stat}${body}`;
}
