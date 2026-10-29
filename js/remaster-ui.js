/* Grok Arcade - the Remaster Machine panel (Tortuga Remaster Works). Same flow as the Suggestion Booth / DLC Machine 3000:
   pick a game + a ticket type (Remaster / Sequel / Quality of Life / Other), add a title + details, then PRINT & SUBMIT opens a
   prefilled GitHub issue labelled "remaster". #60 rules: nothing reloads, your text is kept until you tap IT SENT, SEND AGAIN is free,
   and the board uses the ONE shared GitHub request (GA.ghIssues) so the boards never eat the hourly limit.
   Tabs: New ticket · My tickets · Remaster Board (New / Working on it / Done / Won't do) · Shipped shelf. Free to file. */
(function () {
  'use strict';
  var REPO = 'lizethbran13-cmyk/grok-arcade';
  var K_MINE = 'grokArcade.rmIdeas', K_BOARD = 'grokArcade.rmBoard', K_DRAFT = 'grokArcade.rmDraft', K_PEND = 'grokArcade.rmPending';
  GA.REMASTER_TYPES = [
    { id: 'Remaster', icon: '\u2728', ex: 'same game, rebuilt shinier' },
    { id: 'Sequel', icon: '2\uFE0F\u20E3', ex: 'part 2: new story, new world' },
    { id: 'Quality of Life', icon: '\uD83D\uDEE0\uFE0F', ex: 'smoother controls, fixes, comfort' },
    { id: 'Other', icon: '\uD83D\uDCA1', ex: 'anything else for an old game' }
  ];
  /* the shelf: shipped remasters + sequels (add new ones here when they ship) */
  GA.REMASTER_SHELF = GA.REMASTER_SHELF || [
    { name: 'Grok Voxels: Re-Voxeled', kind: 'Remaster', game: 'voxels', issue: 68, shipped: '2026-10-28', desc: 'Grok Voxels rebuilt on the Re-Voxeled 4.0 engine: 8 dynamic point lights, directional sun shadows + voxel AO, 3 shader modes (Ultra, Neon Overdrive, Classic), physical 3D ammo & casings, Tortuga Bio-Dome & Solar Citadel biomes, Exo-Armor & Thermal Jam with Field Repair, and all 5 family pets.' },
    { name: 'Grok Grid 2', kind: 'Sequel', game: 'grid2', issue: 63, shipped: '2026-10-28', desc: 'High-speed sequel to Grok Grid: 14 circuits including Tortuga Superspeedway, Indy Brickyard GP & Tokyo Neon Drift, 4 racing series (Formula, IndyCar, Stock Car, Drift), 8 cars, Drift Boost Chains (x1-x5 Overdrive), Luna\u2019s Garage Tuning, Candy\u2019s Pit Tow, and all 5 family pets.' },
    { name: 'Grok Sports: Re-Commanded', kind: 'Remaster', game: 'sports', issue: 83, shipped: '2026-10-28', desc: 'Grok Sports rebuilt on the Tempest engine: crisp 3D courts & rinks, 5-save Slot Picker, live Arcade Coin Shop, Practice Drills, Custom Match Builder, and Tempest Stadium.' },
    { name: 'Grok FC 2', kind: 'Sequel', game: 'fc2', issue: 74, shipped: '2026-10-28', desc: 'The full 3D soccer sequel: 5 save slots, 3D Tempest Stadium with Jumbotron & floodlights, Career Mode, Custom Club Creator, Penalty Shootout, Skills Challenge, and pack opener.' },
    { name: 'Grok Sky Remastered', kind: 'Remaster', game: 'sky', issue: 62, shipped: '2026-10-28', desc: 'Grok Sky rebuilt on the Tempest engine: 5-save Slot Picker, dynamic weather & time-of-day, Remaster Flight HUD, Hangar Paint Shop, Ring Trials, and Cargo Runs.' },
    { name: 'Grok Land 2', kind: 'Sequel', game: 'land2', issue: 56, shipped: '2026-10-22', desc: 'The first Grok sequel: three Boost Zones (Meadow Rush, Canyon Rush, Shell Speedway), new worlds, better graphics on all 12 classics, online co-op and pet cameos.' },
    { name: 'Grok Blocks: Re-Blocked', kind: 'Remaster', game: 'blocksrb', issue: 55, shipped: '2026-10-21', desc: 'Grok Blocks on a shiny new engine: day and night, shiny ice and water, the dark glowing Crystal Caves, Blossom Hills and the Pet Corner.' },
    { name: 'Grok Rides Remastered', kind: 'Remaster', game: 'rides', desc: 'Grok Rides rebuilt on the Tempest engine: a huge free-roam world with 31 rides, real jobs, races, weather and co-op.' },
  ];
  var RM = GA.RemasterUI = {}, openNow = false, tab = 'new', type = 'Remaster', loading = false;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function snd(n) { try { GA.Audio.play(n); } catch (e) {} }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function toast(m, ms) { if (GA.Fix && GA.Fix.toast) GA.Fix.toast(m, ms || 3200); }
  function ago(ts) { var s = Math.max(0, (Date.now() - ts) / 1000); if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + ' h ago'; return Math.floor(s / 86400) + ' d ago'; }
  function torty(t) { if (GA.Remaster && GA.Remaster.say) GA.Remaster.say(t, 5); var el = $('rmTorty'); if (el) el.textContent = t; }
  RM.games = function () { return GA.MAIN_GAMES.map(function (g) { return g.name; }).concat(GA.BONUS_GAMES ? GA.BONUS_GAMES.map(function (g) { return g.name; }) : []).concat(['Grok Arcade', 'Other']); };

  /* ---------- composing ---------- */
  RM.compose = function (game, kind, title, text) {
    title = String(title || '').trim().slice(0, 70); text = String(text || '').trim();
    var t = '[' + game + '] ' + kind + ': ' + title;
    var body = '**Game:** ' + game + '\n**Ticket type:** ' + kind + '\n\n### Details\n' + (text || title) +
      '\n\n---\n_Printed by the Remaster Machine at Tortuga Remaster Works (Grok Arcade) \u00b7 ' + new Date().toISOString().slice(0, 10) + '_';
    var url = 'https://github.com/' + REPO + '/issues/new?title=' + encodeURIComponent(t) + '&body=' + encodeURIComponent(body) + '&labels=remaster';
    var copy = 'Grok Arcade remaster ticket\nGame: ' + game + '\nType: ' + kind + '\nTitle: ' + title + '\nDetails: ' + (text || title);
    return { title: t, body: body, url: url, copy: copy };
  };
  function form() { return { game: $('rmGame').value, type: type, title: $('rmTitle').value, text: $('rmText').value }; }
  function saveDraft() { store(K_DRAFT, form()); }
  function msg(h, cls) { var m = $('rmMsg'); if (m) { m.innerHTML = h; m.className = 'sbMsg ' + (cls || ''); } }
  RM.submit = function (via) { try { return submitNow(via); } catch (e) { try { msg('Hmm, that didn\u2019t go through. Your ticket is still here: tap <b>PRINT &amp; SUBMIT</b> to try again.', 'bad'); } catch (e2) {} return { ok: false, why: 'error' }; } };
  function submitNow(via) {
    var f = form();
    if (f.title.trim().length < 3) { msg('Give your ticket a title first (at least 3 letters).', 'bad'); snd('buzz'); torty('A ticket with no name? Even my shell has a name.'); return { ok: false, why: 'title' }; }
    if (f.text.trim().length < 4) { msg('Say what you want: shinier graphics, a part 2, a fix...', 'bad'); snd('buzz'); return { ok: false, why: 'text' }; }
    var pend = load(K_PEND, null), again = pend && pend.title === f.title.trim() && pend.text === f.text.trim() && pend.game === f.game && pend.type === f.type;
    var s = RM.compose(f.game, f.type, f.title, f.text), num = again ? pend.num : 'RM-' + Date.now().toString(36).toUpperCase().slice(-6);
    RM.last = { num: num, s: s, f: f };
    if (!again) { var mine = load(K_MINE, []); mine.unshift({ t: Date.now(), num: num, game: f.game, type: f.type, title: f.title.trim(), text: f.text.trim(), via: via || 'GitHub' }); store(K_MINE, mine.slice(0, 100)); if (GA.Prog && GA.Prog.event) try { GA.Prog.event('remaster'); } catch (e) {} }
    GA.submitAt = Date.now();
    store(K_DRAFT, f);
    store(K_PEND, via === 'Copied' ? null : { num: num, game: f.game, type: f.type, title: f.title.trim(), text: f.text.trim(), url: s.url, t: Date.now() });
    if (GA.Remaster && GA.Remaster.pull) GA.Remaster.pull();
    snd('win');
    if (via === 'Copied') { RM.lastCopy = s.copy; try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s.copy).catch(function () {}); } catch (e) {} store(K_DRAFT, null); }
    else { var w = null; try { w = window.open(s.url, '_blank', 'noopener'); } catch (e) {} RM.popupBlocked = !w; }
    showTicket(num, f, s, via);
    torty(['Ticket printed! The Tortuga Tech crew will take a look, slow and steady.', 'Ooh, a ' + f.type.toLowerCase() + ' ticket for ' + f.game + '! Into the Shell-Tough rig it goes. Kidding!', 'Filed! Pi-rat, stop chewing the tickets.'][Math.floor(Math.random() * 3)]);
    return { ok: true, num: num, url: s.url, again: !!again };
  }
  function showTicket(num, f, s, via) {
    var ti = GA.REMASTER_TYPES.find(function (x) { return x.id === f.type; }) || GA.REMASTER_TYPES[0];
    $('rmBody').innerHTML = '<div class="dlcTicket rmTicket" id="rmTicket"><div class="dlcTkTop">\uD83C\uDFAB REMASTER TICKET <span>#' + esc(num) + '</span></div>' +
      '<div class="dlcTkName">' + esc(f.title.trim()) + '</div><div class="dlcTkRow"><span>GAME</span><b>' + esc(f.game) + '</b></div><div class="dlcTkRow"><span>TYPE</span><b>' + ti.icon + ' ' + esc(f.type) + '</b></div>' +
      '<div class="dlcTkRow"><span>FILING FEE</span><b>FREE</b></div><div class="dlcTkWhat">' + esc(f.text.trim()) + '</div><div class="dlcBar" aria-hidden="true"></div><div class="dlcStamp rmStamp">TORTUGA TECH \u2713</div></div>' +
      '<div class="sbMsg ok" id="rmMsg">' + (via === 'Copied' ? '\uD83D\uDCCB Copied! Paste it to your assistant.' : 'GitHub opened in a new tab: tap <b>Create</b> there to send it to the Remaster Board.' + (RM.popupBlocked ? ' <a href="' + esc(s.url) + '" target="_blank" rel="noopener">Open GitHub</a>' : '')) + ' Saved under <b>My tickets</b>.' +
      (via === 'Copied' ? '' : '<div class="sbBtns"><button class="bigBtn" id="rmSent" type="button">\u2705 IT SENT</button><button class="bigBtn alt" id="rmAgain" type="button">\uD83D\uDD01 SEND AGAIN</button></div><small>Your ticket stays saved until you tap IT SENT.</small>') + '</div>' +
      '<div class="sbBtns"><button class="bigBtn" id="rmAnother" type="button">\u270F\uFE0F NEW TICKET</button><button class="bigBtn alt" id="rmSeeBoard" type="button">\uD83D\uDCCB BOARD</button></div>';
    $('rmAnother').addEventListener('click', function () { snd('click'); store(K_PEND, null); store(K_DRAFT, null); setTab('new'); });
    if ($('rmSent')) $('rmSent').addEventListener('click', function () { snd('coin'); store(K_PEND, null); store(K_DRAFT, null); msg('\uD83C\uDF89 Sent! It shows on the <b>Remaster Board</b> in a minute. Saved under <b>My tickets</b>.', 'ok'); });
    if ($('rmAgain')) $('rmAgain').addEventListener('click', function () { snd('click'); var pd = load(K_PEND, null); if (!pd) return; var w = null; try { w = window.open(pd.url, '_blank', 'noopener'); } catch (e) {} GA.submitAt = Date.now(); if (!w) msg('Tap here to open GitHub: <a href="' + esc(pd.url) + '" target="_blank" rel="noopener">Open GitHub</a>. Your ticket stays saved until you tap IT SENT.', 'ok'); });
    $('rmSeeBoard').addEventListener('click', function () { snd('click'); setTab('board'); });
  }

  /* ---------- tabs ---------- */
  function renderNew() {
    var d = load(K_DRAFT, null) || {}, games = RM.games(), sel = d.game && games.indexOf(d.game) >= 0 ? d.game : games[0]; type = d.type || type;
    $('rmBody').innerHTML = '<label class="sbL">Which game?<select id="rmGame">' + games.map(function (g) { return '<option' + (g === sel ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join('') + '</select></label>' +
      '<div class="sbL">What kind of ticket?<div class="dlcSizes rmTypes">' + GA.REMASTER_TYPES.map(function (s) { return '<button type="button" class="dlcSize rmType' + (s.id === type ? ' on' : '') + '" data-t="' + esc(s.id) + '"><b>' + s.icon + ' ' + esc(s.id) + '</b><small>' + esc(s.ex) + '</small></button>'; }).join('') + '</div></div>' +
      '<label class="sbL">Title<input id="rmTitle" maxlength="70" placeholder="e.g. Grok Land 2: Boost Mode" value="' + esc(d.title || '') + '"></label>' +
      '<label class="sbL">Details<textarea id="rmText" maxlength="1500" rows="4" placeholder="What should be new, shinier or fixed?">' + esc(d.text || '') + '</textarea></label>' +
      '<div class="sbBtns"><button id="rmSubmit" class="bigBtn" type="button">\uD83D\uDDA8\uFE0F PRINT &amp; SUBMIT <small>FREE</small></button><button id="rmCopy" class="bigBtn alt" type="button">\uD83D\uDCCB COPY</button></div>' +
      '<div id="rmMsg" class="sbMsg">Filing is <b>free</b>. Your ticket goes on the <b>Remaster Board</b>, and when it ships it lands on the <b>Shipped shelf</b>.</div>';
    Array.prototype.forEach.call(document.querySelectorAll('.rmType'), function (b) { b.addEventListener('click', function () { type = b.getAttribute('data-t'); Array.prototype.forEach.call(document.querySelectorAll('.rmType'), function (x) { x.classList.toggle('on', x === b); }); saveDraft(); snd('click'); }); });
    ['rmGame', 'rmTitle', 'rmText'].forEach(function (id) { $(id).addEventListener('input', saveDraft); $(id).addEventListener('change', saveDraft); $(id).addEventListener('keydown', function (e) { e.stopPropagation(); }); });
    $('rmSubmit').addEventListener('click', function () { RM.submit('GitHub'); });
    $('rmCopy').addEventListener('click', function () { RM.submit('Copied'); });
    var pd = load(K_PEND, null); if (pd && pd.title === (d.title || '').trim() && pd.text === (d.text || '').trim()) { $('rmSubmit').innerHTML = '\uD83D\uDD01 SEND AGAIN <small>FREE</small>'; msg('\uD83D\uDCDD Your last ticket (#' + esc(pd.num) + ') is still here in case it didn\u2019t send. Tap SEND AGAIN, or change it for a new ticket.', 'ok'); }
  }
  var ST = { new: ['New', '\uD83C\uDD95'], work: ['Working on it', '\uD83D\uDEE0\uFE0F'], done: ['Done', '\u2705'], wont: ['Won\u2019t do', '\uD83D\uDEAB'] };
  RM.ST = ST;
  RM.statusOf = function (it) { var labs = (it.labels || []).map(function (l) { return String(l.name || l).toLowerCase(); }); if (labs.indexOf('shipped') >= 0) return 'done'; if (it.state === 'closed') return labs.indexOf('wontfix') >= 0 || it.state_reason === 'not_planned' ? 'wont' : 'done'; return labs.indexOf('in-progress') >= 0 ? 'work' : 'new'; };
  RM.parse = function (issues) {
    return (issues || []).filter(function (it) { return !it.pull_request; }).map(function (it) {
      var m = /^\s*\[([^\]]{1,40})\]\s*(?:(Remaster|Sequel|Quality of Life|Other):\s*)?(.*)$/i.exec(it.title || ''), tm = /\*\*Ticket type:\*\*\s*([^\n]+)/.exec(String(it.body || ''));
      return { n: it.number, game: m ? m[1] : 'General', type: (m && m[2]) || (tm ? tm[1].trim() : ''), name: m ? m[3] : it.title, st: RM.statusOf(it), url: it.html_url, upd: Date.parse(it.updated_at) || 0 };
    });
  };
  RM.boardItems = function () { var c = load(K_BOARD, null); return c && c.items ? c.items : []; };
  if (GA.Remaster) GA.Remaster.boardItems = RM.boardItems;
  function fetchBoard() {
    if (loading) return; loading = true; renderBoard('Loading the Remaster Board\u2026');
    GA.ghIssues(true).then(function (all) { store(K_BOARD, { t: Date.now(), items: RM.parse(GA.ghLabeled(all, 'remaster')) }); loading = false; renderBoard(); if (GA.Remaster && GA.Remaster.drawBoard) GA.Remaster.drawBoard(); })
      .catch(function (e) { loading = false; var mins = e.reset ? Math.max(1, Math.ceil((e.reset * 1000 - Date.now()) / 60000)) : 0;
        if (!load(K_BOARD, null)) { var pv = load('grokArcade.pvIssues', null); if (pv && pv.items) store(K_BOARD, { t: pv.t || 0, items: RM.parse(GA.ghLabeled(pv.items, 'remaster')) }); }
        try { renderBoard(!e.status ? '\uD83D\uDCE1 Couldn\u2019t refresh (offline or GitHub is slow). Showing the last board we saved.' : e.status === 403 || e.status === 429 ? '\u23F3 Couldn\u2019t refresh: GitHub needs a little break (too many checks this hour).' + (mins ? ' Try again in about ' + mins + ' min.' : '') + ' Showing the last saved board.' : 'Couldn\u2019t refresh the board right now (' + e.status + '). Showing the last saved one.'); } catch (er) {} });
  }
  RM.refresh = function (quiet) { // quiet refresh for the big wall screen (shares the one GitHub request; never more than once a minute)
    var c = load(K_BOARD, null); if (c && Date.now() - c.t < 60000) return;
    if (!GA.ghIssues) return; GA.ghIssues(false).then(function (all) { store(K_BOARD, { t: Date.now(), items: RM.parse(GA.ghLabeled(all, 'remaster')) }); if (GA.Remaster && GA.Remaster.drawBoard) GA.Remaster.drawBoard(); }).catch(function () {});
  };
  function renderBoard(m) {
    if (tab !== 'board' || !$('rmBody')) return;
    var c = load(K_BOARD, null), h = '<div class="sbBar"><button id="rmRefresh" class="pzTab on" type="button">\uD83D\uDD04 Refresh</button><span class="sbWhen">' + (c ? 'Updated ' + ago(c.t) : 'Not loaded yet') + '</span></div>';
    h += '<div class="rmLegend">' + ['new', 'work', 'done', 'wont'].map(function (k) { return '<span class="sbSt ' + k + '">' + ST[k][1] + ' ' + ST[k][0] + '</span>'; }).join(' ') + '</div>';
    if (m) h += '<div class="sbMsg' + (loading ? '' : ' warn') + '" id="rmBoardMsg">' + esc(m) + '</div>';
    if (!c && m && !loading) h += '<div class="sbEmpty">Nothing saved yet. Tap <b>Refresh</b> in a little bit.</div>';
    if (c && c.items) {
      if (!c.items.length) h += '<div class="sbEmpty">No remaster tickets yet. Be the first!</div>';
      h += c.items.map(function (i) { return '<div class="sbItem rmBoardItem" data-n="' + i.n + '"><div class="sbTop"><span class="sbSt ' + i.st + '">' + ST[i.st][1] + ' ' + ST[i.st][0] + '</span><span class="sbGameTag">' + esc(i.game) + '</span>' + (i.type ? '<span class="sbType">' + esc(i.type) + '</span>' : '') + '</div><div class="sbTitle">' + esc(i.name) + '</div><div class="sbMeta">#' + i.n + ' \u00b7 <a href="' + esc(i.url) + '" target="_blank" rel="noopener">open</a></div></div>'; }).join('');
    }
    $('rmBody').innerHTML = h; $('rmRefresh').addEventListener('click', function () { snd('click'); fetchBoard(); });
  }
  function renderMine() {
    var mine = load(K_MINE, []), board = RM.boardItems(), h = '<h3 class="dlcH">\uD83C\uDFAB Your remaster tickets</h3>';
    if (!mine.length) h += '<div class="sbEmpty">No tickets yet. Tap <b>New ticket</b> to file one!</div>';
    h += mine.map(function (m) { var hit = board.find(function (b) { return b.name === m.title && b.game === m.game; });
      return '<div class="sbItem mine"><div class="sbTop"><span class="sbSt ' + (hit ? hit.st : 'sent') + '">' + (hit ? ST[hit.st][1] + ' ' + ST[hit.st][0] : '\uD83C\uDFAB #' + esc(m.num)) + '</span><span class="sbGameTag">' + esc(m.game) + '</span><span class="sbType">' + esc(m.type) + '</span></div><div class="sbTitle">' + esc(m.title) + '</div><div class="sbLast">' + esc(String(m.text).slice(0, 160)) + '</div></div>'; }).join('');
    $('rmBody').innerHTML = h;
  }
  function renderShelf() {
    var h = '<div class="dlcShopHead">Remasters and sequels that came out of the Works. Tap PLAY to try one.</div>';
    h += GA.REMASTER_SHELF.map(function (it) { var g = (GA.findGame && GA.findGame(it.game)) || {};
      return '<div class="sbItem rmShelfItem" style="--c:' + (g.color || '#4ade80') + '"><div class="sbTop"><span class="sbSt ' + (it.soon ? 'work' : 'done') + '">' + (it.soon ? '\uD83D\uDEE0\uFE0F In the works' : '\u2B50 Shipped' + (it.shipped ? ' ' + esc(it.shipped) : '')) + '</span><span class="sbType">' + esc(it.kind) + '</span>' + (it.issue ? '<span class="sbGameTag">#' + it.issue + '</span>' : '') + '</div>' +
        '<div class="sbTitle">' + esc(it.name) + '</div><div class="sbLast">' + esc(it.desc || '') + '</div>' + (!it.soon && g.url ? '<div class="sbMeta"><a class="dlcPlay" href="' + esc(g.url) + '" target="_blank" rel="noopener">\u25B6 PLAY</a></div>' : '') + '</div>'; }).join('');
    $('rmBody').innerHTML = h;
  }
  function setTab(t) {
    tab = t; Array.prototype.forEach.call(document.querySelectorAll('#rmTabs .pzTab'), function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === t); });
    if (t === 'new') renderNew(); else if (t === 'mine') renderMine(); else if (t === 'shelf') renderShelf(); else { renderBoard(); var c = load(K_BOARD, null); if (!c || Date.now() - c.t > 60000) fetchBoard(); }
    $('rmBody').scrollTop = 0;
  }
  RM.tab = setTab;
  function build() {
    var d = document.createElement('div'); d.id = 'rmPanel'; d.className = 'pzOv hidden'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    d.innerHTML = '<div class="pzPanel dlcPanel rmPanel"><div class="pzHead"><div class="pzTitle"><b>\uD83D\uDC22 THE REMASTER MACHINE</b><span>Tortuga Tech Inc. \u00b7 electronics by Ratita Industries</span></div><button id="rmClose" class="xBtn" aria-label="Close">&#10005;</button></div>' +
      '<div class="hlGusRow small"><div class="hlBubble" id="rmTorty">Hi! I\u2019m Martina, call me Torty. Want a game remastered, a sequel, or a fix? Pull the lever!</div></div>' +
      '<div class="pzTabs" id="rmTabs"><button class="pzTab on" data-tab="new">\u270F\uFE0F New ticket</button><button class="pzTab" data-tab="mine">\uD83D\uDCC2 My tickets</button><button class="pzTab" data-tab="board">\uD83D\uDCCB Remaster Board</button><button class="pzTab" data-tab="shelf">\u2B50 Shelf</button></div>' +
      '<div class="pzScroll" id="rmBody"></div></div>';
    document.body.appendChild(d);
    $('rmClose').addEventListener('click', close); d.addEventListener('click', function (e) { if (e.target === d) close(); });
    Array.prototype.forEach.call(d.querySelectorAll('#rmTabs .pzTab'), function (b) { b.addEventListener('click', function () { snd('click'); setTab(b.getAttribute('data-tab')); }); });
    window.addEventListener('keydown', function (e) { if (openNow && e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } }, true);
  }
  RM.open = function (which) {
    if (!$('rmPanel')) build(); if (GA.UI && GA.UI.closeMenu) GA.UI.closeMenu(true);
    openNow = true; $('rmPanel').classList.remove('hidden'); document.body.classList.add('pzOn');
    if (GA.Hub) { GA.Hub.setPaused(true); if (GA.Hub.clearInput) GA.Hub.clearInput(); } snd('open'); setTab(which || 'new');
  };
  function close() { if (!openNow) return; openNow = false; $('rmPanel').classList.add('hidden'); document.body.classList.remove('pzOn'); snd('menu'); if (GA.Hub) GA.Hub.setPaused(false); }
  RM.close = close; RM.isOpen = function () { return openNow; };

  /* ---------- walk-up prompts + actions for the Works (called from js/areas-ui.js for rw_* kinds) ---------- */
  RM.prompt = function (cab) {
    switch (cab.kind) {
      case 'rw_door': return { tag: 'TORTUGA REMASTER WORKS \u2192', name: 'Remasters, sequels & fixes', desc: 'Torty\u2019s workshop: file remaster, sequel and quality-of-life tickets at the Remaster Machine, check the Remaster Board and see the shelf of shipped remasters.', btn: 'ENTER', key: 'go to the Works', cls: 'gallery', pb: 'galPlay' };
      case 'rw_exit': return { tag: 'EXIT', name: 'Back to the arcade', desc: 'Back to the Grand Gallery in the Hall of Game Records.', btn: 'GO', key: 'go back', cls: 'gallery', pb: 'galPlay' };
      case 'rw_machine': return { tag: 'THE REMASTER MACHINE', name: 'File a remaster ticket', desc: 'Pick a game and a ticket type (Remaster, Sequel, Quality of Life or Other), add a title and details, and print it. Free! Electronics by Ratita Industries.', btn: 'OPEN', key: 'use the Remaster Machine', cls: 'prize', pb: 'pzPlay' };
      case 'rw_board': return { tag: 'REMASTER BOARD', name: 'Every remaster ticket', desc: 'New, Working on it, Done or Won\u2019t do: see what the Tortuga Tech crew is building.', btn: 'VIEW', key: 'read the board', cls: 'gallery', pb: 'galPlay' };
      case 'rw_shelf': return { tag: 'SHIPPED SHELF', name: 'Shipped remasters & sequels', desc: GA.REMASTER_SHELF.filter(function (x) { return !x.soon; }).map(function (x) { return x.name; }).join(', ') + ' shipped from here. More on the way!', btn: 'VIEW', key: 'look at the shelf', cls: 'gallery', pb: 'galPlay' };
      case 'rw_torty': return { tag: 'TORTUGA TECH INC.', name: 'Martina \u201CTorty\u201D', desc: 'The desert tortoise who runs Tortuga Tech and hosts the Works. Say hi!', btn: 'TALK', key: 'talk to Torty', cls: 'npc' };
    }
    return null;
  };
  RM.act = function (cab) {
    var k = cab.kind, RW = GA.Remaster;
    if (k === 'rw_door') { snd('open'); RW.enter(); return; }
    if (k === 'rw_exit') { snd('click'); RW.leave(); return; }
    if (k === 'rw_machine') return RM.open('new');
    if (k === 'rw_board') return RM.open('board');
    if (k === 'rw_shelf') return RM.open('shelf');
    if (k === 'rw_torty') { var L = RW.LINES.torty, s = L[1 + Math.floor(Math.random() * (L.length - 1))]; RW.say(s, 5); toast('Torty: \u201C' + s + '\u201D', 4200); snd('talk'); return; }
  };
  // the wall screen keeps itself fresh while you're in the Works (shared request, at most once a minute)
  setInterval(function () { if (GA.Remaster && GA.Remaster.inside && GA.Remaster.built && GA.Remaster.inside()) RM.refresh(true); }, 20000);
})();
