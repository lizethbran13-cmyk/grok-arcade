// Menus + shop panels (phone-first: big buttons, short text).
import { $, esc } from './util.js';
import { S, persist, newGame, hasSave, loadSave, candidates, lotPrice, buyLot, buyoutPrice, canBuyout, buyout, avgPrice, ambience, fmtTime, news, branchFor, branchKey } from './empire.js';
import { DISHES, DISH, STATIONS } from './food.js';
import { LOTS, RIVALS, CAREER, CARS, CAR, OUTFITS, DECOR, THEMES, STAFF_ROLES, BLD } from './data.js';
export const UI = { open: false, C: null };
const money = (n) => '$' + Math.round(n).toLocaleString();
export function close() { const u = $('ui'); u.innerHTML = ''; u.classList.remove('open'); UI.open = false; if (UI.C && UI.C.onClose) UI.C.onClose(); }
export function panel(title, body, bind, opts = {}) {
  const u = $('ui'); UI.open = true; u.classList.add('open');
  u.innerHTML = `<div class="panel ${opts.cls || ''}"><div class="topBar">${opts.noBack ? '' : '<button class="back" id="pBack">✕</button>'}<h2>${title}</h2>${opts.noMoney ? '' : `<span class="coinsBadge">💰 ${money(S ? S.money : 0)}</span>`}</div>${body}</div>`;
  const p = u.firstChild; const b = p.querySelector('#pBack'); if (b) b.addEventListener('click', () => { UI.C.sfx('click'); (opts.onBack || close)(); });
  p.querySelectorAll('[data-a]').forEach((el) => el.addEventListener('click', (e) => { e.stopPropagation(); if (el.disabled) return; UI.C.sfx('click'); bind && bind(el.dataset.a, el.dataset.v, el); }));
  return p;
}
const btn = (a, v, label, cls = 'mbtn2', dis) => `<button class="${cls}" data-a="${a}" data-v="${esc(v)}" ${dis ? 'disabled' : ''}>${label}</button>`;
const row = (left, right) => `<div class="row"><div class="rl">${left}</div><div class="rr">${right}</div></div>`;
function myBranches() { return Object.entries(S.branches); }
function branchPicker(sel) { const b = myBranches(); if (b.length < 2) return ''; return `<div class="seg wrap">${b.map(([k, br]) => `<button data-a="pick" data-v="${k}" class="${k === sel ? 'on' : ''}">${esc(br.name)}</button>`).join('')}</div>`; }
// ---------------- title + new game ----------------
export function title(C) {
  const cont = hasSave();
  panel('<span class="logo">GROK EATSVILLE<br><small>TYCOON</small></span>', `<p class="sub">Cook, serve, keep it sparkly clean, outsmart the rival chains and build a food empire!</p>
    ${cont ? btn('cont', '', '▶ CONTINUE', 'go') : ''}${btn('new', '', cont ? '🆕 NEW GAME' : '▶ NEW GAME', cont ? 'mbtn2' : 'go')}${btn('explore', '', '🗺️ EXPLORE MODE (free roam)')}${btn('coop', '', '🌐 CO-OP (up to 3)')}${btn('how', '', '❓ HOW TO PLAY')}`,
  (a) => { if (a === 'cont') { loadSave(); close(); C.start(); } if (a === 'new') pickStart(C); if (a === 'explore') { newGame('explore'); close(); C.start(); } if (a === 'coop') C.coop(); if (a === 'how') how(C, () => title(C)); }, { noBack: true, noMoney: true, cls: 'titleP' });
}
function pickStart(C) {
  panel('HOW DO YOU START?', `<div class="card">${'🧑‍🍳'} <b>Start as a worker</b><p>Get a job at Mega Munch, flip burgers, earn wages + tips and get promoted from Trainee to Manager. Save up and open your own place!</p>${btn('worker', '', 'START AS A WORKER', 'go')}</div>
    <div class="card">🏪 <b>Start your own company</b><p>Open the little Main St Diner right away with $650. Your money, your menu, your rules. Riskier!</p>${btn('own', '', 'START MY OWN COMPANY', 'go')}</div>`,
  (a) => { if (a === 'worker' || a === 'own') { newGame(a); close(); C.start(true); } }, { onBack: () => title(C), noMoney: true });
}
export function how(C, back) {
  panel('HOW TO PLAY', `<div class="howL">
    <p>🕹️ <b>Left thumb</b> moves. <b>Drag right side</b> turns the camera. The big <b>action button</b> does whatever is near you.</p>
    <p>🍔 Customers sit and show what they want above their head. Tap a <b>machine</b> to cook it, <b>take</b> it when it dings, and <b>serve</b> it before their ring turns red.</p>
    <p>🧽 Clean spills and plates (plates go in the sink). Wash your hands for bigger tips.</p>
    <p>🕵️ <b>Inspector Grumbleton</b> pops in by surprise. Messes and broken machines lower your grade.</p>
    <p>🐀 Ratita Industries machines sometimes go silly. Tap <b>FIX</b> fast or call Snowie 📞.</p>
    <p>🚗 Outside, walk to your car and tap <b>🚗</b> to drive. Every building has a door: go in and explore!</p>
    <p>🏆 Hire staff, buy more restaurants, beat Mega Munch + Pizza Palooza and become the <b>Food Emperor</b>.</p></div>`, null, { onBack: back || close, noMoney: true });
}
// ---------------- restaurant office ----------------
export function office(C, key, tab = 'menu') {
  const br = S.branches[key]; if (!br) return; const tabs = [['menu', '🍔 Menu'], ['price', '💲 Prices'], ['staff', '👥 Staff'], ['decor', '🎨 Decor'], ['upg', '⬆️ Upgrades'], ['deliv', '🛵 Delivery'], ['stats', '📊 Stats']];
  let body = `<div class="seg wrap tabs">${tabs.map(([t, l]) => `<button data-a="tab" data-v="${t}" class="${t === tab ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  if (tab === 'menu') { body += `<p class="sub">Pick up to 6 dishes. Each needs its machine (buy machines at Ratita Industries).</p><div class="grid3">` + DISHES.map((d) => { const has = !!br.stations[d.st], on = br.menu.includes(d.id);
      return `<button class="dish ${on ? 'on' : ''}" data-a="dish" data-v="${d.id}" ${has ? '' : 'disabled'}><span class="de">${d.e}</span><b>${d.n}</b><small>${has ? '$' + d.price : '🔒 ' + STATIONS[d.st].n}</small></button>`; }).join('') + '</div>';
    body += `<h3>RESTAURANT NAME</h3><div class="joinRow"><input id="rName" maxlength="16" value="${esc(br.name)}"><button class="mbtn2" data-a="rename">SAVE</button></div>`; }
  if (tab === 'price') { body += `<h3>PRICE LEVEL</h3><div class="seg">${[[0.8, '😊 Cheap'], [1, '👍 Fair'], [1.3, '💎 Fancy']].map(([v, l]) => `<button data-a="price" data-v="${v}" class="${br.priceK == v ? 'on' : ''}">${l}</button>`).join('')}</div>
      <p class="sub">Cheap = more customers. Fancy = more money per plate but fewer guests.</p><h3>DAILY SPECIAL (+20% price, popular)</h3><div class="grid3">${br.menu.map((d) => `<button class="dish ${br.special === d ? 'on' : ''}" data-a="special" data-v="${d}"><span class="de">${DISH[d].e}</span><b>${DISH[d].n}</b></button>`).join('')}</div>`; }
  if (tab === 'staff') { body += br.staff.length ? br.staff.map((s, i) => row(`${STAFF_ROLES[s.role].e} <b>${esc(s.name)}</b> <small>${STAFF_ROLES[s.role].n} · skill ${'⭐'.repeat(s.skill)}</small>`, btn('fire', i, 'Let go', 'mbtn2 sm danger'))).join('') : '<p class="sub">No staff yet. You do everything! Hire people at the Town Hall job board.</p>';
    body += `<p class="sub">Cooks cook orders · Waiters carry food + bus plates · Janitors clean · Managers call repairs + calm guests. Staff also keep the place open while you're away.</p>`; }
  if (tab === 'decor') { body += `<h3>THEME</h3><div class="seg wrap">${THEMES.map((t) => `<button data-a="theme" data-v="${t.id}" class="${br.theme === t.id ? 'on' : ''}">${t.n}</button>`).join('')}</div><h3>DECOR (${br.decor.length}/6 spots) · happier guests</h3><div class="grid3">` +
      DECOR.map((d) => `<button class="dish" data-a="decor" data-v="${d.id}" ${S.money < d.price || br.decor.length >= 6 ? 'disabled' : ''}><b>${d.n}</b><small>${money(d.price)} · +${d.amb} vibe</small></button>`).join('') + '</div>' + (br.decor.length ? btn('undecor', '', '↩ Remove last decor (no refund)', 'mbtn2 sm') : ''); }
  if (tab === 'upg') { const lv = br.level || 0; const cost = [900, 2000][lv];
    body += row(`🪑 <b>Expand dining room</b><small>${[4, 6, 8][lv]} tables now</small>`, lv < 2 ? btn('expand', '', money(cost), 'mbtn2 sm', S.money < cost) : '<b>MAX</b>');
    body += row(`📦 <b>Ingredients</b><small>${br.stock} left · auto-order ${br.autoStock ? 'ON' : 'OFF'} (+25%)</small>`, btn('auto', '', br.autoStock ? 'Turn off' : 'Turn on', 'mbtn2 sm'));
    body += row(`🚪 <b>Open while away</b><small>${br.open ? 'Open' : 'Closed'} (needs a cook)</small>`, btn('openT', '', br.open ? 'Close' : 'Open', 'mbtn2 sm'));
    body += `<p class="sub">Faster + sturdier machines are sold at Ratita Industries.</p>`; }
  if (tab === 'deliv') { const d = C.delivery(); body += d ? `<p class="sub">Active delivery: <b>${DISH[d.dish].e} ${DISH[d.dish].n}</b> for <b>${esc(BLD[d.house].name)}</b>. ${d.bag ? 'Bag is ready: drive there and walk inside!' : 'Cook it, then bring it to the register to bag it.'}</p>` : `<p class="sub">Take a delivery order: cook it, bag it at the register, then drive it to the house. Fast = big tips!</p>${btn('deliv', '', '📱 TAKE A DELIVERY ORDER', 'go')}`; }
  if (tab === 'stats') { body += row('⭐ Reputation', '<b>' + Math.round(br.rep) + '/100</b>') + row('🧼 Cleanliness', '<b>' + Math.round(br.sanitation) + '%</b>') + row('🕵️ Last grade', '<b>' + (br.grade || '–') + '</b>') + row('🍽️ Served today', '<b>' + br.servedToday + '</b>') + row('💵 Earned today', '<b>' + money(br.revenueToday) + '</b>') + row('🎵 Vibe', '<b>+' + ambience(br) + '</b>'); }
  panel('🏪 ' + esc(br.name), body, (a, v) => {
    if (a === 'tab') return office(C, key, v);
    if (a === 'dish') { const i = br.menu.indexOf(v); if (i >= 0) { if (br.menu.length > 1) br.menu.splice(i, 1); else C.toast('Keep at least 1 dish!', true); } else if (br.menu.length < 6) br.menu.push(v); else C.toast('Menu is full (6)', true); if (!br.menu.includes(br.special)) br.special = null; C.changed(key); return office(C, key, 'menu'); }
    if (a === 'rename') { const n = ($('rName').value || '').replace(/[<>&"]/g, '').trim().slice(0, 16); if (n) { br.name = n; C.changed(key, true); C.toast('Renamed to ' + n); } return office(C, key, 'menu'); }
    if (a === 'price') { br.priceK = +v; C.changed(key); return office(C, key, 'price'); }
    if (a === 'special') { br.special = br.special === v ? null : v; C.changed(key); return office(C, key, 'price'); }
    if (a === 'fire') { br.staff.splice(+v, 1); C.changed(key, true); return office(C, key, 'staff'); }
    if (a === 'theme') { br.theme = v; C.changed(key, true); return office(C, key, 'decor'); }
    if (a === 'decor') { const d = DECOR.find((x) => x.id === v); if (S.money >= d.price && br.decor.length < 6) { S.money -= d.price; br.decor.push(v); C.sfx('buy'); C.changed(key, true); } return office(C, key, 'decor'); }
    if (a === 'undecor') { br.decor.pop(); C.changed(key, true); return office(C, key, 'decor'); }
    if (a === 'expand') { const cost = [900, 2000][br.level || 0]; if (S.money >= cost) { S.money -= cost; br.level = (br.level || 0) + 1; C.sfx('buy'); C.changed(key, true); C.toast('🪑 More tables! More customers!'); } return office(C, key, 'upg'); }
    if (a === 'auto') { br.autoStock = !br.autoStock; C.changed(key); return office(C, key, 'upg'); }
    if (a === 'openT') { br.open = !br.open; C.changed(key); return office(C, key, 'upg'); }
    if (a === 'deliv') { C.newDelivery(key); return office(C, key, 'deliv'); }
  });
}
// ---------------- shops ----------------
export function ratitaShop(C, sel) {
  const bs = myBranches(); if (!bs.length) return panel('🐀 RATITA INDUSTRIES', '<p class="sub">Luna: "Come back when you own a restaurant! Our kitchen tech is 99% oops-proof*."</p><p class="sub">*mostly</p>');
  sel = sel && S.branches[sel] ? sel : bs[0][0]; const br = S.branches[sel];
  let body = branchPicker(sel) + `<p class="sub">Luna, Pi-rat + Snowie's kitchen tech. Every machine adds new dishes!</p>`;
  for (const [id, st] of Object.entries(STATIONS)) { const dishes = DISHES.filter((d) => d.st === id).map((d) => d.e).join(' ');
    body += row(`<b>${st.n}</b><small>${dishes}</small>`, br.stations[id] ? '✅' : btn('buy', id, money(st.price), 'mbtn2 sm', S.money < st.price)); }
  const sp = br.upg.speed, rl = br.upg.rel; const spC = [300, 700, 1400][sp], rlC = [250, 600, 1200][Math.round(rl / 0.25)];
  body += `<h3>CHIPS</h3>` + row(`⚡ <b>Turbo Chip</b><small>cooks faster (lv ${sp}/3)</small>`, sp < 3 ? btn('speed', '', money(spC), 'mbtn2 sm', S.money < spC) : 'MAX') + row(`🛡️ <b>Anti-Oops Chip</b><small>fewer silly breakdowns (lv ${Math.round(rl / 0.25)}/3)</small>`, rl < 0.75 ? btn('rel', '', money(rlC), 'mbtn2 sm', S.money < rlC) : 'MAX');
  body += row(`📞 <b>Ratita Care plan</b><small>Snowie fixes this branch for free while you're away</small>`, br.care ? '✅' : btn('care', '', money(400), 'mbtn2 sm', S.money < 400));
  panel('🐀 RATITA INDUSTRIES', body, (a, v) => {
    if (a === 'pick') return ratitaShop(C, v);
    if (a === 'buy') { const p = STATIONS[v].price; if (S.money >= p) { S.money -= p; br.stations[v] = 1; C.sfx('buy'); C.toast('🐀 Pi-rat: "ARR, she\'s a beauty! Try not to break her."'); C.changed(sel, true); } }
    if (a === 'speed' && S.money >= spC) { S.money -= spC; br.upg.speed++; C.sfx('buy'); C.changed(sel); }
    if (a === 'rel' && S.money >= rlC) { S.money -= rlC; br.upg.rel = Math.min(0.75, br.upg.rel + 0.25); C.sfx('buy'); C.toast('🐀 Snowie: "Now it only explodes a LITTLE."'); C.changed(sel); }
    if (a === 'care' && S.money >= 400) { S.money -= 400; br.care = true; C.sfx('buy'); C.changed(sel); }
    ratitaShop(C, sel);
  });
}
export function market(C, sel) {
  const bs = myBranches(); if (!bs.length) return panel('🥕 FRESHMART', '<p class="sub">Grocer Gus: "Ingredients are for restaurant owners, kiddo. Got a restaurant yet?"</p>');
  sel = sel && S.branches[sel] ? sel : bs[0][0]; const br = S.branches[sel];
  const packs = [[20, 50], [50, 115], [120, 260]];
  panel('🥕 FRESHMART', branchPicker(sel) + `<p class="sub"><b>${esc(br.name)}</b> has <b>${br.stock}</b> ingredients. 1 dish = 1 ingredient. Cheaper than auto-ordering!</p>` + packs.map(([n, p]) => row(`📦 <b>${n} ingredients</b>`, btn('buy', n + ':' + p, money(p), 'mbtn2 sm', S.money < p))).join(''),
    (a, v) => { if (a === 'pick') return market(C, v); if (a === 'buy') { const [n, p] = v.split(':').map(Number); if (S.money >= p) { S.money -= p; br.stock += n; C.sfx('buy'); C.changed(sel); } } market(C, sel); });
}
export function hire(C, sel) {
  const bs = myBranches(); if (!bs.length) return panel('📋 JOB BOARD', '<p class="sub">You need a restaurant before you can hire staff.</p>');
  sel = sel && S.branches[sel] ? sel : bs[0][0]; const br = S.branches[sel]; const list = candidates();
  panel('📋 JOB BOARD', branchPicker(sel) + `<p class="sub">Hiring for <b>${esc(br.name)}</b> (${br.staff.length}/5 staff). Wages are paid each night. New faces every day!</p>` +
    list.map((c, i) => row(`${STAFF_ROLES[c.role].e} <b>${esc(c.name)}</b><small>${STAFF_ROLES[c.role].n} · ${'⭐'.repeat(c.skill)} · ${money(c.wage)}/day${c.blurb ? '<br>' + esc(c.blurb) : ''}</small>`, c.hired ? '✅' : btn('hire', i, 'Hire', 'mbtn2 sm', br.staff.length >= 5))).join(''),
    (a, v) => { if (a === 'pick') return hire(C, v); if (a === 'hire') { const c = list[+v]; if (c && !c.hired && br.staff.length < 5) { c.hired = true; br.staff.push({ role: c.role, name: c.name, skill: c.skill, wage: c.wage, cameo: c.cameo }); C.sfx('buy'); C.toast('🎉 ' + c.name + ' joined ' + br.name + '!'); C.changed(sel, true); } } hire(C, sel); });
}
export function bank(C) {
  panel('🏦 EATSVILLE BANK', `<p class="sub">Loans are paid back a little each night (10% + $10).</p>` + row('Current loan', '<b>' + money(S.loan) + '</b>') + btn('l', 500, 'Borrow $500') + btn('l', 1500, 'Borrow $1,500') + (S.loan > 0 ? btn('pay', '', 'Pay back ' + money(Math.min(S.loan, S.money)), 'mbtn2', S.money <= 0) : ''),
    (a, v) => { if (a === 'l') { if (S.loan + +v > 3000) C.toast('The bank says that\'s enough loans for now', true); else { S.loan += Math.round(+v * 1.1); S.money += +v; C.sfx('buy'); } } if (a === 'pay') { const p = Math.min(S.loan, S.money); S.loan -= p; S.money -= p; } persist(); bank(C); });
}
export function mayor(C) {
  let body = `<p class="sub">Mayor Bloom: "Eatsville loves good food! Own every restaurant in town and I'll crown you <b>Food Emperor</b>."</p><h3>RESTAURANT LOTS</h3>`;
  for (const [l, info] of Object.entries(LOTS)) body += row(`<b>${info.name}</b>`, S.branches[l] ? '✅ yours' : '<small>' + money(lotPrice(l)) + ' · go inside to buy</small>');
  body += '<h3>RIVAL BUYOUTS</h3>';
  for (const [r, info] of Object.entries(RIVALS)) { const rv = S.rivals[r]; body += row(`<b style="color:${info.col}">${info.n}</b><small>rep ${Math.round(rv.rep)} · ${info.blurb}</small>`, rv.owned ? '✅ yours' : canBuyout(r) ? btn('buyout', r, money(buyoutPrice(r)), 'mbtn2 sm', S.money < buyoutPrice(r)) : '<small>Own 2+ places with better rep</small>'); }
  panel('🏛️ MAYOR BLOOM', body, (a, v) => { if (a === 'buyout') { if (buyout(v)) { C.sfx('win'); C.rebuildTownSigns(); C.toast('🏆 You bought ' + RIVALS[v].n + '!'); } } mayor(C); });
}
export function gazette(C, tab = 'news') {
  let body = `<div class="seg"><button data-a="tab" data-v="news" class="${tab === 'news' ? 'on' : ''}">📰 News</button><button data-a="tab" data-v="rev" class="${tab === 'rev' ? 'on' : ''}">⭐ Reviews</button><button data-a="tab" data-v="ads" class="${tab === 'ads' ? 'on' : ''}">📣 Ads</button></div>`;
  if (tab === 'news') body += '<div class="feed">' + (S.news.map((n) => `<p><small>Day ${n.day}</small> ${esc(n.text)}</p>`).join('') || '<p>No news yet.</p>') + '</div>';
  if (tab === 'rev') body += '<div class="feed">' + (S.reviews.map((r) => `<p><b>${esc(r.name)}</b> ${'⭐'.repeat(r.stars)}<br>"${esc(r.text)}" <small>– Gourmet Gustavo, day ${r.day}</small></p>`).join('') || '<p>The critic hasn\'t visited you yet. Keep it clean and fast!</p>') + '</div>';
  if (tab === 'ads') body += `<p class="sub">An ad brings 30% more customers for 3 days.</p>` + myBranches().map(([k, br]) => row(`<b>${esc(br.name)}</b><small>${S.ads[k] ? S.ads[k] + ' days left' : 'no ad'}</small>`, btn('ad', k, '$120', 'mbtn2 sm', S.money < 120))).join('');
  panel('📰 EATSVILLE GAZETTE', body, (a, v) => { if (a === 'tab') return gazette(C, v); if (a === 'ad' && S.money >= 120) { S.money -= 120; S.ads[v] = (S.ads[v] || 0) + 3; C.sfx('buy'); news(S, S.branches[v].name + ' is all over the Gazette this week!'); persist(); } gazette(C, 'ads'); });
}
const QUIZ = [['When should you wash your hands?', ['Before cooking', 'Only on Tuesdays', 'Never, germs are friends'], 0], ['A spill on the floor. What now?', ['Wipe it up right away', 'Put a plant on it', 'Tell customers to jump'], 0],
  ['Where do dirty plates go?', ['The sink', 'Back to the customer', 'Under the rug'], 0], ['The fryer is launching fries. You…', ['Fix it or call a repair', 'Eat them mid-air', 'Charge extra for the show'], 0],
  ['Food got burnt. You should…', ['Throw it away', 'Call it "extra crispy"', 'Serve it to the inspector'], 0], ['Where does trash go?', ['In the bin', 'In the soup', 'In your pocket'], 0]];
export function health(C) {
  const grades = myBranches().map(([k, br]) => row(`<b>${esc(br.name)}</b>`, '<b class="grade g' + (br.grade || 'n') + '">' + (br.grade || '–') + '</b>')).join('');
  panel('🕵️ HEALTH DEPARTMENT', `<p class="sub">Inspector Grumbleton: "Hmph. What do YOU want?"</p>${grades}${row('Unpaid fines', '<b>' + money(S.fines) + '</b>')}${S.fines > 0 ? btn('pay', '', 'Pay fines', 'mbtn2', S.money < S.fines) : ''}
    ${btn('quiz', '', S.cleanCert ? '✅ Clean Certificate earned (+10 next inspection)' : '📝 Take the Hygiene Quiz (earn a Clean Certificate)', 'mbtn2', S.cleanCert)}<p class="sub">Unpaid fines over $300 scare customers away!</p>`,
  (a) => { if (a === 'pay' && S.money >= S.fines) { S.money -= S.fines; S.fines = 0; persist(); C.toast('🕵️ "Paid in full. ...I\'m still watching you."'); health(C); } if (a === 'quiz') quiz(C, 0, 0); });
}
function quiz(C, i, ok) {
  if (i >= 3) { const pass = ok >= 3; if (pass) { S.cleanCert = true; persist(); C.sfx('win'); } panel('📝 RESULT', `<p class="sub">${ok}/3 correct. ${pass ? 'Grumbleton grumbles: "...Fine. Here is your certificate. Don\'t frame it."' : '"Study harder! Try again."'}</p>${btn('back', '', 'OK', 'go')}`, () => health(C)); return; }
  const qs = QUIZ.slice().sort((a, b) => ((a[0].length * 7 + S.day) % 5) - ((b[0].length * 7 + S.day) % 5)); const q = qs[i % qs.length]; const order = [0, 1, 2].sort(() => Math.random() - 0.5);
  panel('📝 QUESTION ' + (i + 1) + '/3', `<p class="sub"><b>${q[0]}</b></p>` + order.map((k) => btn('ans', k, q[1][k])).join(''), (a, v) => quiz(C, i + 1, ok + (+v === q[2] ? 1 : 0)), { onBack: () => health(C) });
}
export function carShop(C) {
  panel('🚗 WHEELIE DEALS', `<p class="sub">Wheelie Walt: "Every car comes with a free cup holder!"</p>` + CARS.map((c) => row(`<b>${c.n}</b><small>top speed ${c.spd}${c.deliv ? ' · delivery tips ×1.5' : ''}${c.kind === 'hover' ? ' · it HOVERS' : ''}</small>`, S.cars.includes(c.id) ? (S.car === c.id ? '🔑 driving' : btn('use', c.id, 'Use', 'mbtn2 sm')) : btn('buy', c.id, money(c.price), 'mbtn2 sm', S.money < c.price))).join(''),
    (a, v) => { if (a === 'buy') { const c = CAR[v]; if (S.money >= c.price) { S.money -= c.price; S.cars.push(v); S.car = v; C.sfx('buy'); C.toast('🔑 Your ' + c.n + ' is parked outside!'); C.respawnCar(true); } } if (a === 'use') { S.car = v; C.respawnCar(true); } persist(); carShop(C); });
}
export function outfits(C, owned) {
  const L = S.look; const list = owned ? OUTFITS.filter((o) => S.outfits.includes(o.id)) : OUTFITS;
  let body = `<p class="sub">${owned ? 'Your wardrobe.' : 'Tailor Tess: "Let\'s make you a costume worth cooking in!"'}</p><div class="grid3">` + list.map((o) => `<button class="dish ${L.outfit === o.id ? 'on' : ''}" data-a="${S.outfits.includes(o.id) ? 'wear' : 'buy'}" data-v="${o.id}" ${!S.outfits.includes(o.id) && S.money < o.price ? 'disabled' : ''}><b>${o.n}</b><small>${S.outfits.includes(o.id) ? (L.outfit === o.id ? 'wearing' : 'owned') : money(o.price)}</small></button>`).join('') + '</div>';
  body += `<h3>MAKE IT YOURS</h3><p class="sub">Shirt colour</p><div class="sw">${['', '#ff5a5f', '#3fa7ff', '#4ade80', '#ffc93c', '#a78bfa', '#f472b6', '#111827'].map((c) => `<button data-a="shirt" data-v="${c}" style="background:${c || 'linear-gradient(45deg,#fff,#ccc)'}" class="${(L.shirt || '') === c ? 'on' : ''}"></button>`).join('')}</div>
    <p class="sub">Skin</p><div class="sw">${['#ffd9b8', '#f2c29b', '#d9a07a', '#b57a52', '#8d5a3b', '#6b4128'].map((c) => `<button data-a="skin" data-v="${c}" style="background:${c}"></button>`).join('')}</div>
    <p class="sub">Hair</p><div class="sw">${['#2b1d14', '#5a3820', '#9a5b2a', '#e0b25a', '#c0392b', '#ff7ab8', '#d8d8e0'].map((c) => `<button data-a="hair" data-v="${c}" style="background:${c}"></button>`).join('')}</div>
    <div class="seg wrap">${['short', 'spiky', 'bun', 'long', 'curly', 'pony', 'bald'].map((h) => `<button data-a="style" data-v="${h}" class="${L.hairStyle === h ? 'on' : ''}">${h}</button>`).join('')}</div>`;
  panel(owned ? '👕 WARDROBE' : '🧵 STITCH & STYLE', body, (a, v) => {
    if (a === 'buy') { const o = OUTFITS.find((x) => x.id === v); if (S.money >= o.price) { S.money -= o.price; S.outfits.push(v); L.outfit = v; C.sfx('buy'); } }
    if (a === 'wear') L.outfit = v; if (a === 'shirt') L.shirt = v || null; if (a === 'skin') L.skin = parseInt(v.slice(1), 16); if (a === 'hair') L.hair = parseInt(v.slice(1), 16); if (a === 'style') L.hairStyle = v;
    persist(); C.restyle(); outfits(C, owned); });
}
export function homeDecor(C) {
  const lv = S.homeLevel || 0; const up = [1200, 3000][lv];
  panel('🏠 MY HOUSE', row(`<b>${['Cozy Cottage', 'Family House', 'Mega Mansion'][lv]}</b><small>bigger rooms + more decor spots</small>`, lv < 2 ? btn('up', '', 'Upgrade ' + money(up), 'mbtn2 sm', S.money < up) : 'MAX') + `<h3>DECOR (${S.homeDecor.length}/4)</h3><div class="grid3">` +
    DECOR.map((d) => `<button class="dish" data-a="buy" data-v="${d.id}" ${S.money < d.price || S.homeDecor.length >= 4 ? 'disabled' : ''}><b>${d.n}</b><small>${money(d.price)}</small></button>`).join('') + '</div>' + (S.homeDecor.length ? btn('undo', '', '↩ Remove last decor', 'mbtn2 sm') : ''),
  (a, v) => { if (a === 'up' && S.money >= up) { S.money -= up; S.homeLevel = lv + 1; C.sfx('win'); } if (a === 'buy') { const d = DECOR.find((x) => x.id === v); if (S.money >= d.price) { S.money -= d.price; S.homeDecor.push(v); C.sfx('buy'); } } if (a === 'undo') S.homeDecor.pop(); persist(); C.rebuildRoom(); homeDecor(C); });
}
export function empire(C) {
  const bs = myBranches(); const mine = bs.reduce((a, [k, b]) => a + b.rep, 0); const tot = mine + Object.values(S.rivals).filter((r) => !r.owned).reduce((a, r) => a + r.rep, 0) || 1;
  let body = `<h3>MARKET SHARE</h3><div class="bar3"><i style="width:${mine / tot * 100}%;background:#14b8a6">You</i>${Object.entries(S.rivals).filter(([, r]) => !r.owned).map(([k, r]) => `<i style="width:${r.rep / tot * 100}%;background:${RIVALS[k].col}">${RIVALS[k].n.split(' ')[0]}</i>`).join('')}</div>`;
  body += bs.length ? bs.map(([k, br]) => row(`<b>${esc(br.name)}</b><small>⭐${Math.round(br.rep)} · 🧼${Math.round(br.sanitation)}% · 📦${br.stock} · 👥${br.staff.length} · grade ${br.grade || '–'}${br.broken.length ? ' · ⚠️ broken machine' : ''}</small>`, '<b>' + money(br.revenueToday) + '</b>')).join('') : '<p class="sub">No restaurants yet.</p>';
  if (S.mode === 'worker' || S.career.rank > 0 || S.career.xp > 0) body += `<h3>CAREER</h3>` + row(`🧑‍🍳 <b>${CAREER[S.career.rank].n}</b> at Mega Munch`, '<small>XP ' + S.career.xp + (CAREER[S.career.rank + 1] ? '/' + CAREER[S.career.rank + 1].xp : '') + '</small>');
  body += row('🏆 Trophies', '<b>' + S.trophies + '</b>') + row('🍽️ Total served', '<b>' + S.stats.served + '</b>') + row('💳 Loan', '<b>' + money(S.loan) + '</b>');
  panel('📈 MY EMPIRE', body);
}
export function trophies(C) { const t = [['First restaurant', Object.keys(S.branches).length >= 1], ['3 restaurants', Object.keys(S.branches).length >= 3], ['Grade A!', S.stats.aGrades > 0], ['5-star review', !!S.seen.five], ['100 customers served', S.stats.served >= 100], ['Manager at Mega Munch', S.career.rank >= 4], ['10 deliveries', S.deliveries >= 10], ['Food Emperor', !!S.seen.emperor]];
  panel('🏆 TROPHY SHELF', t.map(([n, ok]) => row((ok ? '🏆 ' : '🔒 ') + '<b>' + n + '</b>', ok ? '✅' : '')).join('')); }
export function garage(C) { panel('🚗 MY GARAGE', S.cars.map((id) => row(`<b>${CAR[id].n}</b>`, S.car === id ? '🔑' : btn('use', id, 'Drive this', 'mbtn2 sm'))).join('') + '<p class="sub">Buy more cars at Wheelie Deals.</p>', (a, v) => { if (a === 'use') { S.car = v; persist(); C.respawnCar(true, true); C.toast('🚗 ' + CAR[v].n + ' is waiting outside your house'); } garage(C); }); }
export function tv(C) { panel('📺 EATSVILLE NEWS', '<div class="feed">' + S.news.slice(0, 8).map((n) => `<p><small>Day ${n.day}</small> ${esc(n.text)}</p>`).join('') + '</div>' + `<p class="sub">Weather: sunny with a chance of meatballs.</p>`); }
export function buyLotPanel(C, lot) {
  const p = lotPrice(lot); const info = LOTS[lot];
  panel('🏷️ ' + info.name.toUpperCase(), `<p class="sub">Realtor Rita: "Great spot! Lots of hungry people walk by. Comes with a grill, a fryer and a soda fountain."</p>${row('Price', '<b>' + money(p) + '</b>')}${btn('buy', '', S.money >= p ? 'BUY IT!' : 'Not enough money yet', 'go', S.money < p)}`,
    (a) => { if (a === 'buy' && buyLot(lot)) { C.sfx('win'); close(); C.rebuildTownSigns(); C.rebuildRoom(); C.banner('🎉 ' + info.name + ' is YOURS!', 'Tap the office desk to set up your menu'); } });
}
export function dayReport(C, r, done) {
  const tot = r.branches.reduce((a, b) => a + b.rev, 0);
  panel('🌙 DAY ' + r.day + ' REPORT', (r.branches.length ? r.branches.map((b) => row(`<b>${esc(b.name)}</b><small>${b.served} served · ⭐${b.rep} · 🧼${b.san}%${b.grade ? ' · grade ' + b.grade : ''}</small>`, '<b>' + money(b.rev) + '</b>')).join('') : '<p class="sub">No restaurants yet. Keep saving!</p>') +
    row('💵 Earned', '<b>' + money(tot) + '</b>') + (r.wages ? row('👥 Wages', '<b>-' + money(r.wages) + '</b>') : '') + (r.loan ? row('🏦 Loan payment', '<b>-' + money(r.loan) + '</b>') : '') + (r.rivals.length ? '<h3>RIVAL NEWS</h3>' + r.rivals.map((t) => `<p class="sub">${esc(t)}</p>`).join('') : '') + btn('ok', '', '☀️ GOOD MORNING!', 'go'),
  () => { close(); done && done(); }, { noBack: true });
}
export function bossTalk(C, br) {
  const c = S.career, rk = CAREER[c.rank], nx = CAREER[c.rank + 1]; const mo = br.rival === 'mega';
  if (!mo) return panel('🍕 ' + br.brand.bossName.toUpperCase(), `<p class="sub">${br.brand.bossName}: "Ciao! You're from that OTHER restaurant? Hmph. Our pizza is the best in Eatsville. Rep: ${Math.round(S.rivals.pizza.rep)}!"</p>`);
  panel('🍔 MANAGER MO', `<p class="sub">${c.shift ? '"Back to work! Those burgers won\'t flip themselves!"' : '"Ready for a shift, ' + rk.n + '?"'}</p>${row('Rank', '<b>' + rk.n + '</b>')}${row('Wage per shift', '<b>' + money(rk.wage) + '</b> + tips')}${row('XP', '<b>' + c.xp + (nx ? ' / ' + nx.xp + ' for ' + nx.n : ' (top rank!)') + '</b>')}
    ${c.shift ? btn('out', '', '⏱️ CLOCK OUT (get paid)', 'go') : btn('in', '', '⏱️ CLOCK IN', 'go')}${!S.branches.A ? `<p class="sub">Save ${money(lotPrice('A'))} and buy the Main St Diner to start your own company!</p>` : ''}`,
  (a) => { if (a === 'in') { C.clockIn(); close(); } if (a === 'out') { C.clockOut(); close(); } });
}
export function pauseMenu(C) {
  panel('☰ MENU', btn('resume', '', '▶ RESUME', 'go') + btn('emp', '', '📈 My empire') + btn('how', '', '❓ How to play') + btn('snd', '', S.opts && S.opts.mute ? '🔇 Sound: OFF' : '🔊 Sound: ON') + (C.net() ? `<p class="sub">Co-op room <b class="code">${C.net()}</b></p>` : '') + btn('quit', '', '💾 Save & quit to title', 'mbtn2 danger'),
    (a) => { if (a === 'resume') close(); if (a === 'emp') empire(C); if (a === 'how') how(C, () => pauseMenu(C)); if (a === 'snd') { S.opts = S.opts || {}; S.opts.mute = !S.opts.mute; C.sound(); persist(); pauseMenu(C); } if (a === 'quit') { persist(); C.quit(); } }, { noMoney: false });
}
