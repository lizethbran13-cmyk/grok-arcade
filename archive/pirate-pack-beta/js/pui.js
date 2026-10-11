// Pi-rat the Pirate Pack: menus (story, Captain talk, sea chart, results, Dresser Shop, locked teaser).
import { $, esc } from './util.js';
import { S, persist } from './save.js';
import { sfx } from './audio.js';
import { panel, closePanel } from './ui.js';
import { ISLES, isleOf, P, mapPieces, isleOpen, ownsPirate, DRESS, DRESS_TABS, dressSave, ownsItem, buyItem, isDressHat, CAPTAIN, PARROT } from './pirate.js';
import { OUTFITS } from './data.js';
const fmt = (t) => { const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + (s < 10 ? '0' : '') + s; };
// talking-head dialogue: lines = [[who, text], ...]
function say(app, lines, done, extra) { let i = 0; const who = { cap: ['🏴‍☠️', CAPTAIN, '#ffd23f'], par: ['🦜', PARROT, '#4ade80'], pir: ['🐀', 'Pi-rat', '#ffb3c8'], tor: ['🐢', 'Torty', '#a3e635'], cat: ['😼', 'Captain Clawbeard', '#c4b5fd'] };
  const show = () => { const [w, t] = lines[i]; const W = who[w] || who.cap; panel(`<div class="pSay"><div class="pFace" style="border-color:${W[2]}">${W[0]}</div><div><b style="color:${W[2]}">${esc(W[1])}</b><p>${esc(t)}</p></div></div>
      <div class="btnRow">${i < lines.length - 1 ? '<button class="go" id="sNext">NEXT ▶</button>' : (extra || '') + '<button class="go" id="sDone">OKAY!</button>'}</div>`, (c) => {
      const n = c.querySelector('#sNext'); if (n) n.onclick = () => { sfx('click'); i++; show(); }; const d = c.querySelector('#sDone'); if (d) d.onclick = () => { sfx('click'); if (done) done(); else app.resume(); };
      c.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => { sfx('click'); PUI.chart(app); }); }, 'pirPanel'); };
  app.paused = true; show(); }
export const PUI = {
  say,
  // HQ: ship-in-a-bottle portal
  portal(app) { if (!ownsPirate()) return PUI.locked(app, 'pirate'); if (app.net.online) { app.hud.toast('🏴‍☠️ The pirate campaign is a solo adventure. Leave the online game first!'); return; }
    app.paused = true; const p = P(); panel(`<h2>🏴‍☠️ PI-RAT THE PIRATE PACK</h2><div class="pBottle">⛵</div><p class="sub">Pi-rat sets sail with ${CAPTAIN} and his cranky parrot ${PARROT}! Explore 5 islands, solve puzzles, beat the bosses and find the Legendary Golden Cheese.</p>
      <p class="sub">🗺️ Map pieces: <b>${mapPieces()}/4</b> · ${p.final ? '👑 Treasure found!' : '💀 Skull Rock waits'}</p><div class="btnRow"><button class="mbtn2" id="pbNo">NOT YET</button><button class="go" id="pbGo">⚓ ALL ABOARD!</button></div>`, (c) => {
      c.querySelector('#pbNo').onclick = () => app.resume(); c.querySelector('#pbGo').onclick = () => { sfx('buy'); app.resume(); app.loadLevel('pship', true); }; }, 'pirPanel'); },
  locked(app, what) { app.paused = true; panel(`<h2>🔒 PIRATE PACK</h2><div class="pBottle">🏴‍☠️</div><p class="sub">${what === 'dresser' ? 'The <b>Dresser Shop</b> (skins, clothes, hats and extras you can wear everywhere)' : 'The <b>Pi-rat the Pirate Pack</b> campaign'} is part of the MEGA DLC <b>Pi-rat the Pirate Pack</b>.</p>
      <p class="sub">Unlock it in the <b>Grok Arcade DLC Shop</b> (DLC Machine 3000 in the Hall of Game Records) for <b>175 🎟️</b>.</p><button class="go" id="lkOk">OKAY</button>`, (c) => { c.querySelector('#lkOk').onclick = () => app.resume(); }, 'pirPanel'); },
  intro(app) { const p = P(); if (p.intro) return; p.intro = 1; persist();
    say(app, [['cap', 'Ahoy, Pi-rat! Welcome aboard the Salty Cheddar, finest ship on the Squeaky Sea!'], ['par', 'Finest? It smells like old socks. SQUAWK.'], ['cap', 'Ignore Grumbles. He gets cranky at sea. And on land. And at lunch.'],
      ['cap', 'Legend says the Legendary Golden Cheese is hidden in Skull Rock, guarded by the pirate cat Captain Clawbeard!'], ['cap', 'To find the way we need 4 map pieces, one on each island. Take the wheel, or use the sea chart, and steer for Cheddar Cove!'],
      ['par', 'And try not to sink us. I just preened.'], ['pir', 'Aye aye, Captain! Let\u2019s find that treasure!']]); },
  captain(app) { const p = P(), n = mapPieces(); p.talk = (p.talk || 0) + 1; persist();
    const next = ISLES.find((i) => !p.done[i.id] && isleOpen(i)); const lines = p.final ? [['cap', 'Pi-rat, ye did it! The Legendary Golden Cheese! You\u2019re the bravest rat on the seven seas!'], ['par', 'Fine. FINE. You\u2019re a little bit amazing. Don\u2019t tell anyone I said that.']]
      : n >= 4 ? [['cap', 'All 4 map pieces! The path to Skull Rock is open. Steer north past the volcano!'], ['par', 'Skull Rock. Great. Spooky AND damp. My favourite. SQUAWK.']]
      : next ? [['cap', `Next stop: ${next.icon} ${next.n}! ${next.blurb}`], ['par', [`Wake me when we get there.`, `Is it lunch yet? It's never lunch.`, `I'm not cranky. I'm just... feathery.`, `Left! No, your OTHER left!`][p.talk % 4]]]
      : [['cap', 'Pick an island on the sea chart, matey!']];
    say(app, lines, null, '<button class="mbtn2" data-go="1">🗺️ SEA CHART</button>'); },
  parrot(app) { const L = ['Polly want a cracker? NO. Polly wants a NAP.', 'SQUAWK! Who touched my perch?', 'I have been at sea for 9 years. 9! My feathers are SALTY.', 'Fine, I\u2019ll help. But only because you have snacks.', 'Arr. That\u2019s pirate for "leave me alone".', 'Did you know rats can\u2019t fly? I did. I KNEW.'];
    P().pt = ((P().pt || 0) + 1) % L.length; persist(); say(app, [['par', L[P().pt]]]); },
  // sea chart: autopilot to an island
  chart(app) { const g = app.game, p = P(), w = g.world, n = mapPieces();
    panel(`<div class="topBar"><h2>🗺️ SEA CHART</h2><span class="coinsBadge">🗺️ ${n}/4</span></div><p class="sub">Tap an island and the Salty Cheddar sails there by herself. (Or take the wheel and steer!)</p>
      <div class="pChart">${ISLES.map((i, k) => { const open = isleOpen(i) && (!i.final || n >= 4); const done = p.done[i.id]; return `<button class="lvl ${open ? '' : 'lock'}" data-i="${i.id}" style="border-color:${i.col}"><span class="ic">${open ? i.icon : '🔒'}</span><div><b>${esc(i.n)}${done ? ' ✅' : ''}</b><small>${open ? esc(i.blurb) : i.final ? 'Needs all 4 map pieces' : 'Finish ' + esc(ISLES[k - 1].n) + ' first'} · Boss: ${esc(i.boss)} · 💎 ${(p.gems[i.id] || []).length}/5 · 🧰 ${(p.chests[i.id] || []).length}/3</small></div></button>`; }).join('')}</div>
      <button class="mbtn2" id="cBack">CLOSE</button>`, (c) => {
      c.querySelectorAll('.lvl').forEach((b) => b.onclick = () => { if (b.classList.contains('lock')) { sfx('deny'); return; } const I = isleOf(b.dataset.i); if (w.sailTo) { w.sailTo(I); app.resume(); app.hud.toast(`⛵ Setting sail for ${I.icon} ${I.n}!`); sfx('buy'); } });
      c.querySelector('#cBack').onclick = () => app.resume(); }, 'pirPanel'); app.paused = true; },
  levelDone(app, res) { const I = isleOf(res.level); const p = P(); const earned = res.crumbs + res.cheese * 10; S.cheese += earned; const first = !p.done[I.id]; p.done[I.id] = true;
    const u = (a, b) => [...new Set([...(a || []), ...b])]; p.gems[I.id] = u(p.gems[I.id], res.parts); p.chests[I.id] = u(p.chests[I.id], res.babies); if (!p.best[I.id] || res.time < p.best[I.id]) p.best[I.id] = res.time; if (I.final) p.final = true; persist(); app.paused = true;
    const n = mapPieces();
    panel(`<h2>🏴‍☠️ ${esc(I.n)} PLUNDERED!</h2><div class="gold">${I.final ? '🧀👑' : '🗺️✨'}</div>
      <div class="resRow"><b>🪙 ${earned}</b><small>doubloons → cheese</small></div><div class="resRow"><b>🧰 ${res.babies.length}/3</b><small>chests</small></div><div class="resRow"><b>💎 ${res.parts.length}/5</b><small>gems</small></div><div class="resRow"><b>⏱ ${fmt(res.time)}</b><small>time</small></div>
      ${I.final ? `<div class="newG">THE LEGENDARY GOLDEN CHEESE!<br><span>👑 You beat Captain Clawbeard!</span><small>The whole Squeaky Sea is celebrating. Grumbles almost smiled.</small></div>` : first ? `<div class="newG">MAP PIECE ${n}/4!<br><span>🗺️ ${n >= 4 ? 'The way to Skull Rock is open!' : 'The treasure map is coming together'}</span><small>Spend your cheese at the Dresser Shop on the ship</small></div>` : ''}
      <div class="btnRow"><button class="mbtn2" id="rAgain">↺ AGAIN</button><button class="go" id="rShip">⛵ BACK TO THE SHIP</button></div>`, (c) => {
      c.querySelector('#rShip').onclick = () => { closePanel(); app.loadLevel('pship', true); }; c.querySelector('#rAgain').onclick = () => { closePanel(); app.loadLevel(I.id, true); }; }, 'pirPanel'); },
  // ------------------------------------------------ Dresser Shop
  dresser(app, tab) { if (!ownsPirate()) return PUI.locked(app, 'dresser'); app.paused = true; tab = tab || PUI._tab || 'hat'; PUI._tab = tab; const d = dressSave();
    const cur = (slot) => slot === 'hat' ? S.outfit : d[slot];
    const items = DRESS[tab].map((it) => { const own = ownsItem(tab, it.id), on = cur(tab) === it.id; return `<button class="dItem ${on ? 'on' : ''} ${own ? '' : S.cheese >= it.c ? 'buyable' : 'poor'}" data-id="${it.id}"><b>${esc(it.n)}</b><small>${esc(it.d)}</small><i>${on ? '✔ WEARING' : own ? 'WEAR' : '🧀 ' + it.c}</i></button>`; }).join('');
    const offBtn = tab === 'hat' ? '' : `<button class="mbtn2 sm" id="dOff">${tab === 'skin' ? '🐀 Natural fur' : '🚫 Take it off'}</button>`;
    panel(`<div class="topBar"><h2>👗 DRESSER SHOP</h2><span class="coinsBadge">🧀 ${S.cheese}</span></div><p class="sub">Buy it once, wear it everywhere: Ratita HQ, the ship, the islands and every room.</p>
      <div class="seg dTabs">${DRESS_TABS.map(([k, l]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div><div class="dGrid">${items}</div>${offBtn}
      ${tab === 'hat' ? '<p class="sub sm">Regular hats from gadget parts are still in the Wardrobe at HQ.</p>' : ''}<button class="go" id="dDone">DONE</button>`, (c) => {
      c.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => { sfx('click'); PUI.dresser(app, b.dataset.t); });
      c.querySelectorAll('.dItem').forEach((b) => b.onclick = () => { const id = b.dataset.id; if (!ownsItem(tab, id)) { const r = buyItem(tab, id); if (r === 'poor') { sfx('deny'); app.hud.toast('Need more cheese! 🧀 Collect doubloons on the islands'); return; } if (r !== 'ok') return; sfx('buy'); app.hud.toast('🛍️ Bought! Looking sharp, matey'); } else sfx('squeak');
        if (tab === 'hat') S.outfit = S.outfit === id ? 'none' : id; else d[tab] = d[tab] === id ? 'none' : id; persist(); app.refreshMe(); if (app.net.online) app.net.sendLook(); PUI.dresser(app, tab); });
      const off = c.querySelector('#dOff'); if (off) off.onclick = () => { d[tab] = 'none'; persist(); sfx('click'); app.refreshMe(); PUI.dresser(app, tab); };
      c.querySelector('#dDone').onclick = () => app.resume(); }, 'pirPanel dPanel'); },
};
// keep the plain wardrobe honest: a dresser hat shows as "worn" there too
export const isAnyHat = (id) => OUTFITS.some((o) => o.id === id) || isDressHat(id);
