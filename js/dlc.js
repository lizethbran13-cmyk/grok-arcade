/* Grok Arcade - DLC Machine 3000.
   1) INVENT: pick a game, name an expansion pack, say what's in it and its size. Submitting costs a few tickets (your first idea is free),
      prints a DLC ticket and opens a prefilled GitHub issue on grok-arcade with the "dlc" label (same way the Suggestion Booth works).
   2) DLC SHOP: once a DLC is built and shipped it is listed in GA.DLC_SHOP and can be unlocked with tickets.
      Buying sets localStorage['grokDLC.<game>.<id>'] (same origin as every game, lizethbran13-cmyk.github.io), which the game reads to unlock it.
   3) MY DLC + DLC BOARD: your ideas, what you own, and the live board of every submitted idea and its status.
   Prices are scaled by size and tuned to how fast tickets come in (a good bonus round pays about 8-15 tickets):
   Mini Pack 50 (about 5 rounds), Expansion 150 (about 15 rounds), MEGA Expansion 300 (about 30 rounds, a real goal like the Silver Trophy). */
(function () {
  'use strict';
  var REPO = 'lizethbran13-cmyk/grok-arcade';
  var API = 'https://api.github.com/repos/' + REPO + '/issues?labels=dlc&state=all&per_page=50&sort=updated';
  GA.DLC_SIZES = [
    { id: 'mini', name: 'Mini Pack', icon: '\uD83C\uDF81', ex: 'new items, skins or outfits', price: 50 },
    { id: 'exp', name: 'Expansion', icon: '\uD83D\uDDFA\uFE0F', ex: 'a new level, area or mode', price: 150 },
    { id: 'mega', name: 'MEGA Expansion', icon: '\uD83C\uDF0D', ex: 'a whole new world or campaign', price: 300 }
  ];
  GA.DLC_IDEA_COST = 5; // first idea is free
  /* Shipped DLC you can unlock with tickets. When a DLC idea gets built, add it here:
     { id: 'neon_skins', game: 'rides', name: 'Neon Paint Pack', size: 'mini', desc: '...' }  -> the game checks localStorage 'grokDLC.rides.neon_skins'. */
  GA.DLC_SHOP = GA.DLC_SHOP || [];
  var K_MINE = 'grokArcade.dlcIdeas', K_BOARD = 'grokArcade.dlcBoard', K_OWNED = 'grokArcade.dlcOwned', K_DRAFT = 'grokArcade.dlcDraft', K_FREE = 'grokArcade.dlcFreeUsed';
  var D = GA.DLC = {}, openNow = false, tab = 'new', size = 'mini', loading = false;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function snd(n) { try { GA.Audio.play(n); } catch (e) {} }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function toast(m, ms) { if (GA.Fix && GA.Fix.toast) GA.Fix.toast(m, ms || 3200); }
  function gus(t) { if (GA.Hall3D && GA.Hall3D.say) GA.Hall3D.say(t, 5); var el = $('dlcGus'); if (el) el.textContent = t; }
  function sizeOf(id) { return GA.DLC_SIZES.find(function (s) { return s.id === id; }) || GA.DLC_SIZES[0]; }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'dlc'; }
  function tix() { return GA.getTickets(); }
  function refreshTix() { if (GA.onTickets) GA.onTickets(tix()); var e = $('dlcTix'); if (e) e.textContent = tix(); }
  /* tickets can never go below zero */
  D.spend = function (n) { n = Math.max(0, Math.floor(+n || 0)); if (tix() < n) return false; GA.store.set('tickets', tix() - n); refreshTix(); return true; };
  D.price = function (sizeId) { return sizeOf(sizeId).price; };
  D.ideaCost = function () { return load(K_FREE, 0) ? GA.DLC_IDEA_COST : 0; };
  D.key = function (item) { return 'grokDLC.' + item.game + '.' + item.id; };
  D.owns = function (item) { if (typeof item === 'string') item = D.find(item); if (!item) return false; try { return !!localStorage.getItem(D.key(item)); } catch (e) { return !!load(K_OWNED, {})[item.game + '.' + item.id]; } };
  D.find = function (id) { return GA.DLC_SHOP.find(function (x) { return x.id === id || x.game + '.' + x.id === id; }); };
  D.buy = function (id) {
    var it = D.find(id); if (!it) return { ok: false, why: 'unknown' };
    if (D.owns(it)) return { ok: false, why: 'owned' };
    var price = it.price || D.price(it.size);
    if (tix() < price) return { ok: false, why: 'tickets', need: price - tix() };
    if (!D.spend(price)) return { ok: false, why: 'tickets', need: price - tix() };
    var rec = { owned: true, id: it.id, game: it.game, name: it.name, t: Date.now(), from: 'grok-arcade' };
    try { localStorage.setItem(D.key(it), JSON.stringify(rec)); } catch (e) {}
    var o = load(K_OWNED, {}); o[it.game + '.' + it.id] = rec.t; store(K_OWNED, o);
    try { var all = JSON.parse(localStorage.getItem('grokDLC.owned') || '[]'); if (all.indexOf(D.key(it)) < 0) all.push(D.key(it)); localStorage.setItem('grokDLC.owned', JSON.stringify(all)); } catch (e) {}
    if (GA.Prog) GA.Prog.event('dlcBuy');
    return { ok: true, left: tix(), key: D.key(it) };
  };

  /* ---------- composing an idea ---------- */
  D.compose = function (gameName, sz, name, text) {
    var s = sizeOf(sz); name = String(name || '').trim().slice(0, 60); text = String(text || '').trim();
    var g = GA.MAIN_GAMES.find(function (x) { return x.name === gameName; }) || { id: 'arcade', name: gameName };
    var title = '[' + gameName + '] DLC: ' + name;
    var body = '**Game:** ' + gameName + '\n**Size:** ' + s.name + ' (' + s.ex + ')\n**Unlock price:** ' + s.price + ' tickets\n**Unlock key (when shipped):** grokDLC.' + g.id + '.' + slug(name) + '\n\n### What\u2019s in it\n' + (text || name) +
      '\n\n---\n_Printed by the DLC Machine 3000 in the Grok Arcade Hall of Game Records \u00b7 ' + new Date().toISOString().slice(0, 10) + '_';
    var url = 'https://github.com/' + REPO + '/issues/new?title=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(body) + '&labels=dlc';
    var copy = 'Grok Arcade DLC idea\nGame: ' + gameName + '\nSize: ' + s.name + ' (' + s.price + ' tickets to unlock)\nName: ' + name + '\nWhat\u2019s in it: ' + (text || name);
    return { title: title, body: body, url: url, copy: copy, size: s, gameId: g.id, key: 'grokDLC.' + g.id + '.' + slug(name) };
  };
  function form() { return { game: $('dlcGame').value, size: size, name: $('dlcName').value, text: $('dlcText').value }; }
  function saveDraft() { store(K_DRAFT, form()); }
  function msg(h, cls) { var m = $('dlcMsg'); m.innerHTML = h; m.className = 'sbMsg ' + (cls || ''); }
  D.submit = function (via) {
    var f = form();
    if (f.name.trim().length < 3) { msg('Give your DLC a name first (at least 3 letters).', 'bad'); snd('buzz'); gus('No name? I can\u2019t file a nameless DLC. That\u2019s chaos.'); return { ok: false, why: 'name' }; }
    if ((f.text || '').trim().length < 4) { msg('Say what\u2019s in it: new levels, skins, a boss, a world...', 'bad'); snd('buzz'); return { ok: false, why: 'text' }; }
    var cost = D.ideaCost();
    if (cost && tix() < cost) { msg('Submitting costs ' + cost + ' tickets and you have ' + tix() + '. Play a bonus game to earn a few more!', 'bad'); snd('buzz'); gus('No tickets, no filing. Rules are rules.'); return { ok: false, why: 'tickets', need: cost - tix() }; }
    if (cost && !D.spend(cost)) return { ok: false, why: 'tickets' };
    if (!cost) store(K_FREE, 1);
    var s = D.compose(f.game, f.size, f.name, f.text), num = 'DLC-' + Date.now().toString(36).toUpperCase().slice(-6);
    D.lastUrl = s.url; D.last = { num: num, s: s, f: f, cost: cost };
    var mine = load(K_MINE, []); mine.unshift({ t: Date.now(), num: num, game: f.game, size: f.size, name: f.name.trim(), text: f.text.trim(), via: via || 'GitHub', cost: cost }); store(K_MINE, mine.slice(0, 100));
    if (GA.Prog) GA.Prog.event('dlcIdea');
    if (GA.Hall3D && GA.Hall3D.print) GA.Hall3D.print();
    snd('win');
    if (via === 'Copied') { copyText(s.copy); }
    else { var w = null; try { w = window.open(s.url, '_blank', 'noopener'); } catch (e) {} D.popupBlocked = !w; }
    $('dlcName').value = ''; $('dlcText').value = ''; store(K_DRAFT, null);
    showTicket(num, f, s, cost, via);
    gus(['Filed. Under \u201CThings I didn\u2019t ask for.\u201D', 'Another DLC idea? Fine. Stamped. APPROVED. Probably.', 'Ooh, ' + s.size.name + '. Fancy. I\u2019ll put it on the pile.'][Math.floor(Math.random() * 3)]);
    return { ok: true, num: num, cost: cost, left: tix(), url: s.url };
  };
  function copyText(txt) {
    D.lastCopy = txt;
    try { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt).catch(function () {}); } catch (e) {}
    return Promise.resolve();
  }
  function showTicket(num, f, s, cost, via) {
    var b = $('dlcBody');
    b.innerHTML = '<div class="dlcTicket" id="dlcTicket"><div class="dlcTkTop">\uD83C\uDFAB DLC TICKET <span>#' + esc(num) + '</span></div>' +
      '<div class="dlcTkName">' + esc(f.name.trim()) + '</div><div class="dlcTkRow"><span>GAME</span><b>' + esc(f.game) + '</b></div><div class="dlcTkRow"><span>SIZE</span><b>' + s.size.icon + ' ' + esc(s.size.name) + '</b></div>' +
      '<div class="dlcTkRow"><span>UNLOCK PRICE</span><b>' + s.size.price + ' tickets</b></div><div class="dlcTkRow"><span>FILING FEE</span><b>' + (cost ? cost + ' tickets' : 'FREE (first idea!)') + '</b></div>' +
      '<div class="dlcTkWhat">' + esc(f.text.trim()) + '</div><div class="dlcBar" aria-hidden="true"></div><div class="dlcStamp">FILED BY GUS</div></div>' +
      '<div class="sbMsg ok" id="dlcMsg">' + (via === 'Copied' ? '\uD83D\uDCCB Copied! Paste it to your assistant.' : 'GitHub opened in a new tab: tap <b>Create</b> there to send it to the DLC Board.' + (D.popupBlocked ? ' <a href="' + esc(s.url) + '" target="_blank" rel="noopener">Open GitHub</a>' : '')) + ' Saved under <b>My DLC</b>.</div>' +
      '<div class="sbBtns"><button class="bigBtn" id="dlcAnother" type="button">\u270F\uFE0F NEW IDEA</button><button class="bigBtn alt" id="dlcSeeBoard" type="button">\uD83D\uDCCB BOARD</button></div>';
    $('dlcAnother').addEventListener('click', function () { snd('click'); setTab('new'); });
    $('dlcSeeBoard').addEventListener('click', function () { snd('click'); setTab('board'); });
    refreshTix();
  }

  /* ---------- tabs ---------- */
  function renderNew() {
    var d = load(K_DRAFT, null) || {}, games = GA.MAIN_GAMES.map(function (g) { return g.name; }).concat(['Grok Arcade']), sel = d.game && games.indexOf(d.game) >= 0 ? d.game : games[0]; size = d.size || size;
    var cost = D.ideaCost();
    $('dlcBody').innerHTML = '<label class="sbL">Which game?<select id="dlcGame">' + games.map(function (g) { return '<option' + (g === sel ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join('') + '</select></label>' +
      '<div class="sbL">How big?<div class="dlcSizes">' + GA.DLC_SIZES.map(function (s) { return '<button type="button" class="dlcSize' + (s.id === size ? ' on' : '') + '" data-s="' + s.id + '"><b>' + s.icon + ' ' + s.name + '</b><small>' + s.ex + '</small><i>' + s.price + ' \uD83C\uDF9F\uFE0F to unlock</i></button>'; }).join('') + '</div></div>' +
      '<label class="sbL">DLC name<input id="dlcName" maxlength="60" placeholder="e.g. Volcano Island Pack" value="' + esc(d.name || '') + '"></label>' +
      '<label class="sbL">What\u2019s in it?<textarea id="dlcText" maxlength="1500" rows="4" placeholder="New levels, skins, a boss, a whole new world...">' + esc(d.text || '') + '</textarea></label>' +
      '<div class="sbBtns"><button id="dlcSubmit" class="bigBtn" type="button">\uD83D\uDDA8\uFE0F PRINT &amp; SUBMIT <small>' + (cost ? cost + ' \uD83C\uDF9F\uFE0F' : 'FREE') + '</small></button><button id="dlcCopy" class="bigBtn alt" type="button">\uD83D\uDCCB COPY</button></div>' +
      '<div id="dlcMsg" class="sbMsg">Submitting ' + (cost ? 'costs ' + cost + ' tickets' : 'is <b>free</b> the first time, then ' + GA.DLC_IDEA_COST + ' tickets') + '. When your DLC gets built it shows up in the <b>DLC Shop</b> to unlock with tickets.</div>';
    Array.prototype.forEach.call(document.querySelectorAll('.dlcSize'), function (b) { b.addEventListener('click', function () { size = b.getAttribute('data-s'); Array.prototype.forEach.call(document.querySelectorAll('.dlcSize'), function (x) { x.classList.toggle('on', x === b); }); saveDraft(); snd('click'); }); });
    ['dlcGame', 'dlcName', 'dlcText'].forEach(function (id) { $(id).addEventListener('input', saveDraft); $(id).addEventListener('keydown', function (e) { e.stopPropagation(); }); });
    $('dlcSubmit').addEventListener('click', function () { D.submit('GitHub'); }); $('dlcCopy').addEventListener('click', function () { D.submit('Copied'); });
  }
  function renderShop() {
    var list = GA.DLC_SHOP;
    var h = '<div class="dlcShopHead">Shipped DLC you can unlock. Buying one unlocks it in that game right away (same save, just refresh the game).</div>';
    if (!list.length) h += '<div class="sbEmpty">\uD83D\uDCE6 Nothing shipped yet!<br>When a DLC idea from the board gets built, it shows up here to unlock with tickets.<br><small>Prices: Mini Pack 50 \u00b7 Expansion 150 \u00b7 MEGA 300</small></div>';
    h += list.map(function (it) {
      var g = GA.findGame(it.game) || { name: it.game, color: '#ff4fd8' }, s = sizeOf(it.size), price = it.price || s.price, own = D.owns(it), can = tix() >= price;
      return '<div class="dlcItem' + (own ? ' owned' : ' locked') + '" data-dlc="' + esc(it.game + '.' + it.id) + '" style="--c:' + g.color + '"><div class="sbTop"><span class="sbSt ' + (own ? 'done' : 'new') + '">' + (own ? '\u2705 OWNED' : '\uD83D\uDD12 LOCKED') + '</span><span class="sbGameTag">' + esc(g.name) + '</span><span class="sbType">' + s.icon + ' ' + esc(s.name) + '</span></div>' +
        '<div class="sbTitle">' + esc(it.name) + '</div><div class="sbLast">' + esc(it.desc || '') + '</div>' +
        (own ? '<div class="sbMeta">Unlocked in ' + esc(g.name) + '. Have fun!</div>' : '<button class="bigBtn dlcBuy" data-buy="' + esc(it.game + '.' + it.id) + '"' + (can ? '' : ' disabled') + '>' + (can ? '\uD83C\uDF9F\uFE0F UNLOCK \u00b7 ' + price : 'NEED ' + (price - tix()) + ' MORE') + '</button>') + '</div>';
    }).join('');
    $('dlcBody').innerHTML = h;
    Array.prototype.forEach.call(document.querySelectorAll('.dlcBuy'), function (b) { b.addEventListener('click', function () {
      var r = D.buy(b.getAttribute('data-buy'));
      if (r.ok) { snd('win'); toast('\uD83C\uDF81 DLC unlocked! Open the game to play it.', 3600); gus('Unlocked. Receipt filed. Don\u2019t lose it.'); }
      else { snd('buzz'); toast(r.why === 'tickets' ? 'You need ' + r.need + ' more tickets.' : 'Already yours!'); }
      renderShop(); refreshTix();
    }); });
  }
  function renderMine() {
    var mine = load(K_MINE, []), board = (load(K_BOARD, null) || {}).items || [];
    var own = GA.DLC_SHOP.filter(function (it) { return D.owns(it); });
    var h = own.length ? '<h3 class="dlcH">\uD83C\uDF81 DLC you own</h3>' + own.map(function (it) { return '<div class="sbItem mine"><div class="sbTop"><span class="sbSt done">\u2705 OWNED</span><span class="sbGameTag">' + esc((GA.findGame(it.game) || {}).name || it.game) + '</span></div><div class="sbTitle">' + esc(it.name) + '</div></div>'; }).join('') : '';
    h += '<h3 class="dlcH">\uD83D\uDCA1 Your DLC ideas</h3>';
    if (!mine.length) h += '<div class="sbEmpty">No DLC ideas yet. Tap <b>Invent</b> to make one!</div>';
    h += mine.map(function (m) { var hit = board.find(function (b) { return b.name === m.name && b.game === m.game; }); var s = sizeOf(m.size);
      return '<div class="sbItem mine"><div class="sbTop"><span class="sbSt ' + (hit ? hit.st : 'sent') + '">' + (hit ? ST[hit.st][1] + ' ' + ST[hit.st][0] : '\uD83C\uDFAB #' + esc(m.num)) + '</span><span class="sbGameTag">' + esc(m.game) + '</span><span class="sbType">' + s.icon + ' ' + esc(s.name) + '</span></div><div class="sbTitle">' + esc(m.name) + '</div><div class="sbLast">' + esc(String(m.text).slice(0, 160)) + '</div></div>'; }).join('');
    $('dlcBody').innerHTML = h;
  }
  var ST = { new: ['Filed', '\uD83D\uDDC2\uFE0F'], work: ['Being built', '\uD83D\uDEE0\uFE0F'], done: ['Shipped', '\uD83C\uDF81'], wont: ['Not this time', '\uD83D\uDEAB'] };
  D.statusOf = function (it) { var labs = (it.labels || []).map(function (l) { return String(l.name || l).toLowerCase(); }); if (labs.indexOf('shipped') >= 0) return 'done'; if (it.state === 'closed') return labs.indexOf('wontfix') >= 0 || it.state_reason === 'not_planned' ? 'wont' : 'done'; return labs.indexOf('in-progress') >= 0 ? 'work' : 'new'; };
  D.parse = function (issues) {
    return (issues || []).filter(function (it) { return !it.pull_request; }).map(function (it) {
      var m = /^\s*\[([^\]]{1,40})\]\s*(?:DLC:\s*)?(.*)$/.exec(it.title || ''), body = String(it.body || ''), sm = /\*\*Size:\*\*\s*([^(\n]+)/.exec(body);
      return { n: it.number, game: m ? m[1] : 'General', name: m ? m[2] : it.title, size: sm ? sm[1].trim() : '', st: D.statusOf(it), url: it.html_url, upd: Date.parse(it.updated_at) || 0 };
    });
  };
  function fetchBoard() {
    if (loading) return; loading = true; renderBoard('Loading the DLC Board\u2026');
    fetch(API, { headers: { Accept: 'application/vnd.github+json' } }).then(function (r) { if (!r.ok) { var e = new Error('http'); e.status = r.status; throw e; } return r.json(); })
      .then(function (iss) { store(K_BOARD, { t: Date.now(), items: D.parse(iss) }); loading = false; renderBoard(); })
      .catch(function (e) { loading = false; renderBoard(!e.status ? '\uD83D\uDCE1 Looks like you\u2019re offline. Showing the last board we saved.' : e.status === 403 || e.status === 429 ? '\u23F3 GitHub needs a little break. Showing the last saved board.' : 'Couldn\u2019t load the board right now (' + e.status + ').'); });
  }
  D.refresh = fetchBoard;
  function renderBoard(m) {
    if (tab !== 'board') return;
    var c = load(K_BOARD, null), h = '<div class="sbBar"><button id="dlcRefresh" class="pzTab on" type="button">\uD83D\uDD04 Refresh</button><span class="sbWhen">' + (c ? 'Live from GitHub' : 'Not loaded yet') + '</span></div>';
    if (m) h += '<div class="sbMsg' + (loading ? '' : ' warn') + '" id="dlcBoardMsg">' + esc(m) + '</div>';
    if (c && c.items) {
      if (!c.items.length) h += '<div class="sbEmpty">No DLC ideas on the board yet. Be the first!</div>';
      h += c.items.map(function (i) { return '<div class="sbItem dlcBoardItem" data-n="' + i.n + '"><div class="sbTop"><span class="sbSt ' + i.st + '">' + ST[i.st][1] + ' ' + ST[i.st][0] + '</span><span class="sbGameTag">' + esc(i.game) + '</span>' + (i.size ? '<span class="sbType">' + esc(i.size) + '</span>' : '') + '</div><div class="sbTitle">' + esc(i.name) + '</div><div class="sbMeta">#' + i.n + ' \u00b7 <a href="' + esc(i.url) + '" target="_blank" rel="noopener">open</a></div></div>'; }).join('');
    }
    $('dlcBody').innerHTML = h; $('dlcRefresh').addEventListener('click', function () { snd('click'); fetchBoard(); });
  }
  function setTab(t) {
    tab = t; Array.prototype.forEach.call(document.querySelectorAll('#dlcTabs .pzTab'), function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === t); });
    if (t === 'new') renderNew(); else if (t === 'shop') renderShop(); else if (t === 'mine') renderMine(); else { renderBoard(); var c = load(K_BOARD, null); if (!c || Date.now() - c.t > 60000) fetchBoard(); }
    $('dlcBody').scrollTop = 0;
  }
  D.tab = setTab;
  function build() {
    var d = document.createElement('div'); d.id = 'dlc'; d.className = 'pzOv hidden'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    d.innerHTML = '<div class="pzPanel dlcPanel"><div class="pzHead"><div class="pzTitle"><b>\uD83D\uDDA8\uFE0F DLC MACHINE 3000</b><span>Invent expansion packs \u00b7 unlock shipped DLC</span></div><div class="pzTix">\uD83C\uDF9F\uFE0F <b id="dlcTix">0</b></div><button id="dlcClose" class="xBtn" aria-label="Close">&#10005;</button></div>' +
      '<div class="hlGusRow small"><div class="hlBubble" id="dlcGus">Beep boop. Feed me ideas. Gus says I\u2019m \u201Ca lot.\u201D</div></div>' +
      '<div class="pzTabs" id="dlcTabs"><button class="pzTab on" data-tab="new">\u270F\uFE0F Invent</button><button class="pzTab" data-tab="shop">\uD83D\uDED2 DLC Shop</button><button class="pzTab" data-tab="mine">\uD83D\uDCC2 My DLC</button><button class="pzTab" data-tab="board">\uD83D\uDCCB DLC Board</button></div>' +
      '<div class="pzScroll" id="dlcBody"></div></div>';
    document.body.appendChild(d);
    $('dlcClose').addEventListener('click', close); d.addEventListener('click', function (e) { if (e.target === d) close(); });
    Array.prototype.forEach.call(d.querySelectorAll('#dlcTabs .pzTab'), function (b) { b.addEventListener('click', function () { snd('click'); setTab(b.getAttribute('data-tab')); }); });
    window.addEventListener('keydown', function (e) { if (openNow && e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } }, true);
  }
  D.open = function (which) {
    if (!$('dlc')) build(); if (GA.UI && GA.UI.closeMenu) GA.UI.closeMenu(true);
    openNow = true; $('dlc').classList.remove('hidden'); document.body.classList.add('pzOn'); refreshTix();
    if (GA.Hub) { GA.Hub.setPaused(true); if (GA.Hub.clearInput) GA.Hub.clearInput(); } snd('open'); setTab(which || 'new');
  };
  function close() { if (!openNow) return; openNow = false; $('dlc').classList.add('hidden'); document.body.classList.remove('pzOn'); snd('menu'); if (GA.Hub) GA.Hub.setPaused(false); if (D.onClose) D.onClose(); }
  D.close = close; D.isOpen = function () { return openNow; };
})();
