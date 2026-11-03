/* Grok Arcade - multiplayer HUB: friends in the same room walk around the arcade together.
   - see each other's avatars with name tags (and carried prizes / hats / medals)
   - the HOST launches everyone into a main game from its cabinet; friends SUGGEST a game (host accepts or declines)
   - Bonus Zone BATTLES: challenge friends to the same bonus game, everyone plays at the same time,
     live shared scoreboard, winner when everyone is done.
   Uses the room from the Multiplayer Antenna lobby (grok-net.js); solo play is untouched when there's no room. */
(function () {
  'use strict';
  var H = GA.HubMP = {};
  var room = null, sendI = 0, lastPos = null, lastSentAt = 0, act = null, chal = null, liveI = 0, sugg = null, suggT = 0;
  function $(id) { return document.getElementById(id); }
  function snd(n) { try { GA.Audio.play(n); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(t, ms) { if (GA.Fix && GA.Fix.toast) GA.Fix.toast(t, ms || 2600); }
  function gname(id) { var g = GA.findGame(id); return g ? g.name : id; }
  function others() { return room ? room.players().filter(function (p) { return p.pid !== room.pid; }) : []; }
  function pname(pid) { var p = room && room.players().find(function (q) { return q.pid === pid; }); return p ? p.name : 'A friend'; }
  function pcol(pid) { var p = room && room.players().find(function (q) { return q.pid === pid; }); return p ? p.color : '#3ff0ff'; }

  H.active = function () { return !!(room && room.opened && !room.destroyed); };
  H.withFriends = function () { return H.active() && others().length > 0; };
  H.isHost = function () { return H.active() && room.isHost; };
  H.room = function () { return room; };

  /* ---------- attach / detach (called by the lobby) ---------- */
  H.attach = function (r) {
    if (room === r) return; H.detach(); room = r;
    r.on('open', function () { if (r !== room) return; pushState(); sync(); });
    r.on('players', function () { if (r === room) sync(); });
    r.on('reconnected', function () { if (r === room) { pushState(); sync(); } });
    r.on('leave', function (p) { if (r !== room) return; GA.Hub.remoteRemove(p.pid); if (chal && chal.p[p.pid] && chal.p[p.pid].st !== 'done') { chal.p[p.pid].st = 'left'; renderVs(); } });
    r.on('message', function (d, from) { if (r === room && d && from !== r.pid) onMsg(d, from); });
    clearInterval(sendI); sendI = setInterval(tick, 100);
    sync();
  };
  H.detach = function () {
    clearInterval(sendI); sendI = 0;
    if (room) others().forEach(function (p) { GA.Hub.remoteRemove(p.pid); });
    var rm = GA.Hub.remotes ? GA.Hub.remotes() : {}; Object.keys(rm).forEach(function (k) { GA.Hub.remoteRemove(k); });
    room = null; lastPos = null; hideSuggest(); endChal(true); chip();
  };

  function pushState() { if (!H.active()) return; room.setState({ carry: GA.Carry ? GA.Carry.get() : null, act: act }); }
  function sync() {
    if (!room) return;
    var list = H.active() ? others() : [], have = GA.Hub.remotes(), keep = {};
    list.forEach(function (p) {
      keep[p.pid] = 1;
      if (!have[p.pid]) GA.Hub.remoteAdd(p.pid, { name: p.name, color: p.color });
      var st = p.state || {};
      GA.Hub.remoteDress(p.pid, st.carry || {});
      GA.Hub.remoteTag(p.pid, st.act ? '\uD83C\uDFAE ' + gname(st.act) : (p.host ? 'HOST' : null));
    });
    Object.keys(have).forEach(function (k) { if (!keep[k]) GA.Hub.remoteRemove(k); });
    if (list.length && GA.Prog) GA.Prog.event('hubFriends');
    chip(); if (GA.UI && GA.UI.refreshPrompt) GA.UI.refreshPrompt();
  }
  function tick() {
    if (!H.active()) return;
    var p = GA.Hub.pose(), now = Date.now();
    var moved = !lastPos || Math.abs(p.x - lastPos.x) > 0.02 || Math.abs(p.z - lastPos.z) > 0.02 || Math.abs(p.face - lastPos.face) > 0.05;
    if (moved || now - lastSentAt > 1000) { room.broadcast({ t: 'pos', x: +p.x.toFixed(2), z: +p.z.toFixed(2), f: +p.face.toFixed(2) }); lastPos = p; lastSentAt = now; }
  }
  if (GA.Carry) GA.Carry.on(function () { pushState(); });

  /* ---------- HUD room chip ---------- */
  function chip() {
    var c = $('roomChip');
    if (!c) { c = document.createElement('button'); c.id = 'roomChip'; c.className = 'roomChip hidden'; c.setAttribute('aria-label', 'Room - open the lobby'); c.addEventListener('click', function () { snd('click'); GA.MP.open(); }); $('hud').appendChild(c); }
    if (!H.active()) { c.classList.add('hidden'); document.body.classList.remove('inRoom'); return; }
    var list = room.players();
    c.innerHTML = '<span class="rcDot"></span><b>' + esc(room.code) + '</b>' + list.map(function (p) { return '<i style="--c:' + p.color + '">' + esc(p.name) + (p.host ? ' \u2605' : '') + '</i>'; }).join('');
    c.classList.remove('hidden'); document.body.classList.add('inRoom');
  }

  /* ---------- launching main games together ---------- */
  H.cabinetMode = function (cab) { // how the PLAY button behaves at a main cabinet while in a room with friends
    if (!H.withFriends() || !cab || cab.kind !== 'main') return null;
    if (!cab.game.mp) return 'solo';
    return room.isHost ? 'launch' : 'suggest';
  };
  H.launch = function (id) { if (!H.isHost()) return false; return GA.MP.launch(id); };
  H.suggest = function (id) {
    if (!H.active() || room.isHost) return false;
    if (Date.now() - suggT < 1500) return false; suggT = Date.now();
    room.send({ t: 'suggest', game: id }); snd('click');
    toast('You suggested ' + gname(id) + '. Waiting for ' + pname(room._hostPid()) + '\u2026', 3000);
    return true;
  };
  function showSuggest(from, game) {
    var g = GA.findGame(game); if (!g || !g.mp) return;
    sugg = { from: from, game: game };
    var d = $('hmSuggest');
    if (!d) {
      d = document.createElement('div'); d.id = 'hmSuggest'; d.className = 'hmPop hidden'; d.setAttribute('role', 'alertdialog');
      d.innerHTML = '<div class="hmTxt" id="hmSugTxt"></div><div class="hmBtns"><button class="bigBtn go" id="hmSugYes">PLAY IT &#9654;</button><button class="bigBtn alt" id="hmSugNo">NOT NOW</button></div>';
      document.body.appendChild(d);
      $('hmSugYes').addEventListener('click', function () { var s = sugg; hideSuggest(); if (s) { room.sendTo(s.from, { t: 'suggestOk', game: s.game }); H.launch(s.game); } });
      $('hmSugNo').addEventListener('click', function () { var s = sugg; hideSuggest(); snd('click'); if (s && room) room.sendTo(s.from, { t: 'suggestNo', game: s.game }); });
    }
    $('hmSugTxt').innerHTML = '<b style="color:' + pcol(from) + '">' + esc(pname(from)) + '</b> wants to play <b>' + esc(g.name) + '</b>!<small>Everyone in the room goes together.</small>';
    d.classList.remove('hidden'); snd('near');
  }
  function hideSuggest() { sugg = null; var d = $('hmSuggest'); if (d) d.classList.add('hidden'); }

  /* ---------- Bonus Zone battles ---------- */
  function newChal(id, game, from) { return { id: id, game: game, from: from, p: {}, t0: Date.now(), done: false, winner: null }; }
  H.challenge = function (game) {
    if (!H.withFriends() || !GA.isBonus(game)) return false;
    var id = Math.random().toString(36).slice(2, 8);
    chal = newChal(id, game, room.pid);
    chal.p[room.pid] = { st: 'in', s: 0 };
    others().forEach(function (p) { chal.p[p.pid] = { st: 'ask', s: 0 }; });
    room.broadcast({ t: 'chal', id: id, game: game });
    GA.openBonus(game); renderVs(); snd('start');
    return true;
  };
  function invite(d, from) {
    hideInvite();
    var c = newChal(d.id, d.game, from); c.p[from] = { st: 'in', s: 0 };
    room.players().forEach(function (p) { if (p.pid !== from) c.p[p.pid] = c.p[p.pid] || { st: 'ask', s: 0 }; });
    var pend = $('hmInvite');
    if (!pend) {
      pend = document.createElement('div'); pend.id = 'hmInvite'; pend.className = 'hmPop vs hidden'; pend.setAttribute('role', 'alertdialog');
      pend.innerHTML = '<div class="hmTxt" id="hmInvTxt"></div><div class="hmBtns"><button class="bigBtn go" id="hmInvYes">&#9876; ACCEPT</button><button class="bigBtn alt" id="hmInvNo">NO THANKS</button></div>';
      document.body.appendChild(pend);
      $('hmInvYes').addEventListener('click', function () { acceptInvite(); });
      $('hmInvNo').addEventListener('click', function () { var c2 = H._invite; hideInvite(); snd('click'); if (c2 && room) room.broadcast({ t: 'chalNo', id: c2.id }); });
    }
    H._invite = c;
    $('hmInvTxt').innerHTML = '<b style="color:' + pcol(from) + '">' + esc(pname(from)) + '</b> challenges you to <b>' + esc(gname(d.game)) + '</b>!<small>Play at the same time. Highest score wins.</small>';
    pend.classList.remove('hidden'); snd('near');
    clearTimeout(H._invT); H._invT = setTimeout(function () { if (H._invite === c) { hideInvite(); if (room) room.broadcast({ t: 'chalNo', id: c.id }); } }, 30000);
  }
  function hideInvite() { H._invite = null; clearTimeout(H._invT); var d = $('hmInvite'); if (d) d.classList.add('hidden'); }
  function acceptInvite() {
    var c = H._invite; hideInvite(); if (!c || !room) return;
    if (GA.MG.isOpen()) GA.MG.close(true);
    if (GA.PZ && GA.PZ.isOpen()) GA.PZ.close(); if (GA.PV && GA.PV.isOpen()) GA.PV.close(); if (GA.MP.isOpen()) GA.MP.close();
    chal = c; chal.p[room.pid] = { st: 'in', s: 0 };
    room.broadcast({ t: 'chalJoin', id: c.id });
    GA.openBonus(c.game); renderVs(); snd('start');
  }
  H.acceptInvite = acceptInvite;
  function endChal(silent) { chal = null; clearInterval(liveI); liveI = 0; var v = $('vsBoard'); if (v) v.classList.add('hidden'); var r = $('mgVsRes'); if (r) r.classList.add('hidden'); hideInvite(); }
  function check() {
    if (!chal || chal.done) return;
    var ids = Object.keys(chal.p), waiting = ids.some(function (k) { return chal.p[k].st === 'ask' || chal.p[k].st === 'in'; });
    if (Date.now() - chal.t0 > 32000) ids.forEach(function (k) { if (chal.p[k].st === 'ask') chal.p[k].st = 'no'; });
    waiting = ids.some(function (k) { return chal.p[k].st === 'ask' || chal.p[k].st === 'in'; });
    var played = ids.filter(function (k) { return chal.p[k].st === 'done' || chal.p[k].st === 'left'; });
    if (!waiting && played.length >= 2) {
      chal.done = true;
      var best = Math.max.apply(null, played.map(function (k) { return chal.p[k].s; }));
      var win = played.filter(function (k) { return chal.p[k].s === best; });
      chal.winner = win.length === 1 ? win[0] : null; chal.tie = win.length > 1;
      if (chal.winner === room.pid && GA.Prog) GA.Prog.event('battleWin');
      snd(chal.winner === room.pid ? 'best' : 'level');
    } else if (!waiting && played.length < 2 && ids.every(function (k) { return k === room.pid || chal.p[k].st === 'no'; }) && chal.p[room.pid] && chal.p[room.pid].st !== 'in') {
      chal.done = true; chal.nobody = true;
    }
  }
  function renderVs() {
    var v = $('vsBoard');
    if (!v) { v = document.createElement('div'); v.id = 'vsBoard'; v.className = 'vsBoard hidden'; v.setAttribute('aria-live', 'polite'); $('mg').appendChild(v); }
    var r = $('mgVsRes');
    if (!r) { r = document.createElement('div'); r.id = 'mgVsRes'; r.className = 'mgVsRes hidden'; var card = document.querySelector('#mgOver .mgCard'); card.insertBefore(r, card.querySelector('.mgBtns')); }
    if (!chal || !room) { v.classList.add('hidden'); r.classList.add('hidden'); return; }
    check();
    var ids = Object.keys(chal.p).filter(function (k) { return chal.p[k].st !== 'no'; }).sort(function (a, b) { return chal.p[b].s - chal.p[a].s; });
    var head = chal.done ? (chal.nobody ? 'Nobody accepted this time' : chal.tie ? '\uD83E\uDD1D It\u2019s a tie!' : '\uD83C\uDFC6 ' + esc(pname(chal.winner)) + (chal.winner === room.pid ? ' (you)' : '') + ' wins!') : '\u2694 BATTLE \u00b7 ' + esc(gname(chal.game));
    v.innerHTML = '<div class="vsHead' + (chal.done ? ' done' : '') + '">' + head + '</div>' + ids.map(function (k) {
      var q = chal.p[k], lab = q.st === 'ask' ? 'deciding\u2026' : q.st === 'done' ? '\u2714 ' + q.s : q.st === 'left' ? q.s + ' (left)' : String(q.s);
      return '<div class="vsRow' + (k === room.pid ? ' me' : '') + (chal.done && k === chal.winner ? ' win' : '') + '" data-pid="' + esc(k) + '"><span class="dot" style="background:' + pcol(k) + '"></span><span class="nm">' + esc(pname(k)) + (k === room.pid ? ' (you)' : '') + '</span><b>' + lab + '</b></div>';
    }).join('');
    v.classList.toggle('hidden', !(GA.MG.isOpen() && GA.MG.current() === chal.game));
    r.innerHTML = head + (chal.done ? '' : '<small>Waiting for everyone to finish\u2026</small>');
    r.classList.toggle('hidden', false);
  }
  H.vs = function () { return chal ? { id: chal.id, game: chal.game, done: chal.done, winner: chal.winner, tie: !!chal.tie, p: JSON.parse(JSON.stringify(chal.p)) } : null; };

  // hooks from the mini game framework
  GA.MG.hooks.start.push(function (id) {
    if (H.active()) { act = id; pushState(); }
    if (chal && chal.game === id && room && chal.p[room.pid] && chal.p[room.pid].st === 'in') {
      clearInterval(liveI); liveI = setInterval(function () { if (!chal || GA.MG.state() !== 'play') return; var s = GA.MG.score(); if (s !== chal.p[room.pid].s) { chal.p[room.pid].s = s; room.broadcast({ t: 'live', id: chal.id, s: s }); renderVs(); } }, 400);
    }
    renderVs();
  });
  GA.MG.hooks.over.push(function (id, score) {
    if (chal && chal.game === id && room && chal.p[room.pid] && chal.p[room.pid].st === 'in') {
      clearInterval(liveI); chal.p[room.pid] = { st: 'done', s: score }; room.broadcast({ t: 'final', id: chal.id, s: score }); renderVs();
    }
  });
  GA.MG.hooks.open.push(function (id) { if (H.active()) { act = id; pushState(); } if (chal && chal.game !== id) endChal(); renderVs(); });
  GA.MG.hooks.close.push(function (id) {
    if (chal && chal.game === id && room && chal.p[room.pid] && chal.p[room.pid].st === 'in') { chal.p[room.pid] = { st: 'left', s: GA.MG.score() }; room.broadcast({ t: 'final', id: chal.id, s: chal.p[room.pid].s, left: 1 }); }
    if (chal && chal.done) endChal(); else if (chal) { var c = chal; setTimeout(function () { if (chal === c && !GA.MG.isOpen()) { check(); if (c.done) { toast(c.nobody ? 'Battle over' : c.tie ? 'Battle: it\u2019s a tie!' : 'Battle: ' + pname(c.winner) + ' wins ' + gname(c.game) + '!', 3500); endChal(); } } }, 50); }
    if (H.active()) { act = null; pushState(); }
  });

  /* ---------- messages ---------- */
  function onMsg(d, from) {
    switch (d.t) {
      case 'pos': GA.Hub.remoteMove(from, d.x, d.z, d.f); break;
      case 'suggest': if (room.isHost) showSuggest(from, d.game); break;
      case 'suggestNo': toast(pname(from) + ' said not now for ' + gname(d.game) + '.', 3000); snd('click'); break;
      case 'suggestOk': toast(pname(from) + ' said YES! Starting ' + gname(d.game) + '\u2026', 3000); break;
      case 'chal': invite(d, from); break;
      case 'chalJoin': if (chal && chal.id === d.id) { chal.p[from] = { st: 'in', s: 0 }; renderVs(); } else if (H._invite && H._invite.id === d.id) H._invite.p[from] = { st: 'in', s: 0 }; break;
      case 'chalNo': if (chal && chal.id === d.id && chal.p[from]) { chal.p[from].st = 'no'; renderVs(); } else if (H._invite && H._invite.id === d.id && H._invite.p[from]) H._invite.p[from].st = 'no'; break;
      case 'live': if (chal && chal.id === d.id) { chal.p[from] = { st: chal.p[from] && chal.p[from].st === 'done' ? 'done' : 'in', s: +d.s || 0 }; renderVs(); } break;
      case 'final': if (chal && chal.id === d.id) { chal.p[from] = { st: d.left ? 'left' : 'done', s: +d.s || 0 }; renderVs(); } else if (H._invite && H._invite.id === d.id) H._invite.p[from] = { st: d.left ? 'left' : 'done', s: +d.s || 0 }; break;
    }
  }
  setInterval(function () { if (chal && !chal.done) renderVs(); }, 1000);
  H._debug = function () { return { active: H.active(), friends: others().map(function (p) { return p.name; }), remotes: GA.Hub.remotes(), vs: H.vs(), invite: !!H._invite, suggest: sugg }; };
})();
