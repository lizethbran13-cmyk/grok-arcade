/* Grok Arcade - Multiplayer Antenna lobby (HOST / JOIN, players, ready, host-picked game) */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  var GN = window.GrokNet;
  var MP = GA.MP = {};
  var room = null, openFlag = false, screen = 's1', prof = null, joining = false, going = false;

  function show(s) { screen = s; ['s1', 's2', 's3', 's4', 's5'].forEach(function (k) { $('mp' + k.toUpperCase()).classList.toggle('hidden', k !== s); }); $('mpBody').scrollTop = 0; }
  function snd(n) { try { GA.Audio.play(n); } catch (e) {} }

  /* ---------- profile ---------- */
  function loadProfile() {
    prof = GN.savedProfile();
    if (!prof.hasName) prof.name = 'Player ' + (1 + ((Math.random() * 9) | 0));
    $('mpName').value = prof.name;
    var wrap = $('mpColors'); wrap.innerHTML = '';
    GN.COLORS.forEach(function (c) {
      var b = document.createElement('button'); b.style.setProperty('--c', c); b.setAttribute('aria-label', 'Color ' + c); b.setAttribute('data-c', c);
      b.addEventListener('click', function () { prof.color = c; syncColors(); snd('click'); saveProfile(); });
      wrap.appendChild(b);
    });
    syncColors();
  }
  function syncColors() { Array.prototype.forEach.call($('mpColors').children, function (b) { b.classList.toggle('on', b.getAttribute('data-c') === prof.color); }); }
  function saveProfile() { prof.name = GN.cleanName($('mpName').value); GN.saveProfile(prof.name, prof.color); }

  /* ---------- open / close ---------- */
  MP.open = function () {
    if (openFlag) return;
    openFlag = true;
    if (GA.UI && GA.UI.closeMenu) GA.UI.closeMenu(true);
    GA.Hub.setPaused(true);
    $('mp').classList.remove('hidden');
    if (GA.Fix) GA.Fix.lobbyBanner();
    snd('menu'); if (GA.Prog) GA.Prog.event('antenna');
    if (room && !room.destroyed) { show(room.opened ? 's3' : 's5'); render(); }
    else { room = null; show('s1'); }
  };
  MP.close = function () {
    if (!openFlag) return;
    openFlag = false; $('mp').classList.add('hidden');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    GA.Hub.setPaused(false);
    if (GA.onMpClose) GA.onMpClose();
  };
  MP.isOpen = function () { return openFlag; };
  MP.room = function () { return room; };

  /* ---------- room lifecycle ---------- */
  function wireRoom(r) {
    r.on('open', function () { if (r !== room) return; joining = false; show('s3'); render(); snd(r.isHost ? 'start' : 'launch'); if (GA.Prog) GA.Prog.event('room'); });
    r.on('players', function () { if (r === room) render(); });
    r.on('meta', function () { if (r === room) render(); });
    r.on('ping', function () { if (r === room && screen === 's3') renderPlayers(); });
    r.on('join', function () { if (r === room) snd('near'); });
    r.on('leave', function () { if (r === room) snd('click'); });
    r.on('status', function (t) { if (r === room && screen === 's5') $('mpWaitM').textContent = t; if (r === room && screen === 's3') render(); });
    r.on('reconnecting', function () { if (r === room) render(); });
    r.on('reconnected', function () { if (r === room) render(); });
    r.on('message', function (d) { if (r !== room || !d) return; if (d.t === 'go') go(d); });
    r.on('error', function (e) {
      if (r !== room) return;
      room = null; joining = false;
      if (!openFlag) MP.open();
      if (screen === 's2' || (screen === 's5' && !r.isHost && !r.opts.rejoin && (e.code === 'notfound' || e.code === 'full' || e.code === 'p2p'))) {
        show('s2'); var el = $('mpJoinErr'); el.classList.remove('hidden'); el.querySelector('b').textContent = e.title; el.querySelector('span').textContent = e.message; snd('click');
      } else { $('mpErrT').textContent = e.title; $('mpErrM').textContent = e.message; $('mpS4').setAttribute('data-error', e.code); show('s4'); }
      $('mpJoinErr').setAttribute('data-error', e.code);
    });
  }
  function host() {
    saveProfile();
    if (GA.Fix && GA.Fix.blocksHost()) { GA.Fix.openRepair({ fromLobby: true }); return; }
    room = GN.createRoom({ role: 'host', autoCode: true, name: prof.name, color: prof.color, pid: GN.pid() });
    wireRoom(room);
    room.setMeta({ game: GA.store.get('mp.lastGame', 'brawl') });
    $('mpWaitT').textContent = 'Opening a room\u2026'; $('mpWaitM').textContent = ''; show('s5');
    room.start();
  }
  function join() {
    var code = GN.normalizeCode($('mpCode').value);
    $('mpCode').value = code;
    var err = $('mpJoinErr');
    if (code.length !== GN.CODE_LEN) { err.classList.remove('hidden'); err.querySelector('b').textContent = 'Code is ' + GN.CODE_LEN + ' letters'; err.querySelector('span').textContent = 'Ask the host for the code on their screen.'; err.setAttribute('data-error', 'short'); return; }
    err.classList.add('hidden'); saveProfile(); joining = true;
    room = GN.createRoom({ role: 'join', code: code, name: prof.name, color: prof.color, pid: GN.pid(), state: { ready: false } });
    wireRoom(room);
    $('mpWaitT').textContent = 'Joining ' + code + '\u2026'; $('mpWaitM').textContent = ''; show('s5');
    room.start();
  }
  function leave() { if (room) { var r = room; room = null; r.leave(); } joining = false; show('s1'); snd('click'); }
  // rejoin the room after coming back from a game (URL has ?mp=...)
  MP.resume = function (prm) {
    prof = { name: prm.name, color: prm.color }; GN.saveProfile(prm.name, prm.color); $('mpName').value = prm.name; syncColors();
    room = GN.createRoom({ role: prm.mode, code: prm.code, name: prm.name, color: prm.color, pid: prm.pid, slot: prm.slot, rejoin: true, state: { ready: false } });
    wireRoom(room);
    if (room.isHost) room.setMeta({ game: GA.store.get('mp.lastGame', 'brawl') });
    MP.open(); $('mpWaitT').textContent = 'Back to the lobby\u2026'; $('mpWaitM').textContent = 'Room ' + prm.code; show('s5');
    room.start();
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
  };

  /* ---------- rendering ---------- */
  function gameById(id) { return GA.mpGames().find(function (g) { return g.id === id; }) || GA.mpGames()[0]; }
  function renderPlayers() {
    var list = room.players(), wrap = $('mpPlayers'), me = room.pid, h = '';
    list.forEach(function (p) {
      var ready = p.host || p.ready;
      h += '<div class="mpP" style="--c:' + GN.cleanColor(p.color) + '" data-pid="' + GN.esc(p.pid) + '"><span class="dot"></span><span class="nm">' + GN.esc(p.name) +
        (p.host ? '<span class="tg">HOST</span>' : '') + (p.pid === me ? '<span class="tg">YOU</span>' : '') + '</span>' +
        (!p.host && room.isHost ? '<span class="ms">' + (p.ping | 0) + ' ms</span>' : (p.pid === me && !p.host ? '<span class="ms">' + (room.ping | 0) + ' ms</span>' : '')) +
        '<span class="rd' + (ready ? ' ok' : '') + '">' + (ready ? 'READY \u2713' : 'NOT READY') + '</span></div>';
    });
    for (var i = list.length; i < room.max; i++) h += '<div class="mpP empty">' + (i === 1 ? 'Waiting for a friend\u2026' : 'Open seat (optional)') + '</div>';
    wrap.innerHTML = h;
    $('mpCount').textContent = list.length + '/' + room.max;
  }
  function renderGames() {
    var wrap = $('mpGames'), cur = (room.meta() || {}).game || 'brawl';
    if (!wrap.children.length) {
      GA.mpGames().forEach(function (g) {
        var b = document.createElement('button'); b.className = 'mpG'; b.style.setProperty('--c', g.color); b.setAttribute('data-game', g.id);
        b.innerHTML = '<b></b><small></small>'; b.querySelector('b').textContent = g.name; b.querySelector('small').textContent = g.desc;
        b.addEventListener('click', function () {
          if (!room) return;
          if (!room.isHost) { flashStatus('Only the host picks the game'); return; }
          room.setMeta({ game: g.id }); GA.store.set('mp.lastGame', g.id); snd('click');
        });
        wrap.appendChild(b);
      });
    }
    Array.prototype.forEach.call(wrap.children, function (b) { b.classList.toggle('on', b.getAttribute('data-game') === cur); b.setAttribute('aria-pressed', b.getAttribute('data-game') === cur ? 'true' : 'false'); });
    wrap.classList.toggle('locked', !room.isHost);
    $('mpGameHint').textContent = room.isHost ? 'you pick' : 'host picks';
    // Brawl only: 1v1 (default) or 3-player free-for-all (needs 3 players)
    var m = room.meta() || {}, isBrawl = cur === 'brawl', n = room.players().length, fmt = m.fmt === 'ffa' && n >= 3 ? 'ffa' : '1v1';
    $('mpFmtRow').classList.toggle('hidden', !isBrawl);
    $('mpFmt1').classList.toggle('on', fmt === '1v1'); $('mpFmt3').classList.toggle('on', fmt === 'ffa');
    $('mpFmt1').setAttribute('aria-pressed', fmt === '1v1' ? 'true' : 'false'); $('mpFmt3').setAttribute('aria-pressed', fmt === 'ffa' ? 'true' : 'false');
    $('mpFmt1').disabled = !room.isHost; $('mpFmt3').disabled = !room.isHost || n < 3;
    $('mpFmtHint').textContent = n < 3 ? '3P needs a 3rd player' : fmt === 'ffa' ? 'all 3 fight!' : (room.isHost ? 'the 3rd player watches' : 'host picks');
  }
  function curFmt() { var m = room.meta() || {}; return m.fmt === 'ffa' && room.players().length >= 3 ? 'ffa' : '1v1'; }
  function setFmt(f) { if (!room || !room.isHost) return; if (f === 'ffa' && room.players().length < 3) { flashStatus('3P free-for-all needs 3 players'); return; } room.setMeta({ fmt: f }); snd('click'); }
  var flashT = 0;
  function flashStatus(t) { $('mpStatus').textContent = t; clearTimeout(flashT); flashT = setTimeout(render, 1600); }
  function render() {
    if (!room || screen !== 's3') return;
    $('mpCodeShow').textContent = room.code;
    $('mpCodeHint').textContent = room.isHost ? 'Tell your friends this code' : 'You joined this room';
    renderPlayers(); renderGames();
    var list = room.players(), others = list.filter(function (p) { return !p.host; }), notReady = others.filter(function (p) { return !p.ready; });
    var me = room.me(), g = gameById((room.meta() || {}).game), st = '';
    var canStart = room.isHost && list.length >= 2 && notReady.length === 0;
    $('mpStartBtn').classList.toggle('hidden', !room.isHost); $('mpStartBtn').disabled = !canStart;
    $('mpReady').classList.toggle('hidden', room.isHost);
    var iAmReady = !!(me && me.ready);
    $('mpReady').classList.toggle('isReady', iAmReady); $('mpReady').textContent = iAmReady ? 'READY \u2713' : 'I\u2019M READY';
    if (!room.isHost && !room._welcomed) st = 'Reconnecting to the host\u2026';
    else if (room.isHost) {
      if (list.length < 2) st = 'Waiting for a friend to join with code ' + room.code;
      else if (notReady.length) st = 'Waiting for ' + notReady.map(function (p) { return p.name; }).join(' & ') + ' to tap READY';
      else st = 'Everyone is ready! Tap START to play ' + g.name + (g.id === 'brawl' ? (curFmt() === 'ffa' ? ' (3P free-for-all)' : ' (1 vs 1)') : '');
    } else st = iAmReady ? 'Waiting for the host to start ' + g.name + '\u2026' : 'Tap I\u2019M READY when you are set';
    clearTimeout(flashT); $('mpStatus').textContent = st;
  }

  /* ---------- start ---------- */
  function start() {
    if (!room || !room.isHost) return;
    var list = room.players();
    if (list.length < 2 || list.some(function (p) { return !p.host && !p.ready; })) return;
    var g = gameById((room.meta() || {}).game);
    room.broadcast({ t: 'go', game: g.id, n: list.length, fmt: g.id === 'brawl' ? curFmt() : undefined }, { self: true });
  }
  function go(d) {
    if (going || !room) return;
    var g = gameById(d.game), me = room.me(); if (!g || !me) return;
    going = true; room.markNavigating(); if (GA.Prog) GA.Prog.onLaunch(g.id);
    var url = GN.buildUrl(GA.gameUrl(g), { mode: room.isHost ? 'host' : 'join', code: room.code, name: me.name, color: me.color, pid: room.pid, slot: me.slot, n: d.n, hub: hubParam() }, d.fmt === 'ffa' ? { fmt: 'ffa' } : null);
    MP.lastUrl = url;
    $('mpStatus').textContent = 'Starting ' + g.name + '\u2026';
    snd('launch'); $('fade').classList.add('on');
    try { GA.Hub.savePos(); } catch (e) {}
    // the host waits a moment so the "go" message reaches everyone before its page unloads
    setTimeout(function () { location.href = url; }, room.isHost ? 700 : 150);
    setTimeout(function () { going = false; $('fade').classList.remove('on'); }, 6000);
  }
  // the games link back here; only pass it along when this isn't the published hub
  function hubParam() { var here = location.origin + location.pathname; return here === GN.HUB_URL ? null : here; }

  /* ---------- wiring ---------- */
  MP.init = function () {
    loadProfile();
    $('mpClose').addEventListener('click', function () { MP.close(); snd('click'); });
    $('mp').addEventListener('click', function (e) { if (e.target === $('mp')) MP.close(); });
    $('mpName').addEventListener('change', saveProfile);
    $('mpName').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
    $('mpHostBtn').addEventListener('click', function () { GA.Audio.unlock(); host(); });
    $('mpJoinBtn').addEventListener('click', function () { GA.Audio.unlock(); saveProfile(); $('mpJoinErr').classList.add('hidden'); show('s2'); setTimeout(function () { try { $('mpCode').focus(); } catch (e) {} }, 60); });
    $('mpCode').addEventListener('input', function (e) { var v = GN.normalizeCode(e.target.value); if (v !== e.target.value) e.target.value = v; $('mpJoinErr').classList.add('hidden'); });
    $('mpCode').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); join(); } });
    $('mpJoinGo').addEventListener('click', join);
    $('mpJoinBack').addEventListener('click', function () { show('s1'); snd('click'); });
    $('mpLeave').addEventListener('click', leave);
    $('mpWaitCancel').addEventListener('click', leave);
    $('mpErrOk').addEventListener('click', function () { show('s1'); snd('click'); });
    $('mpReady').addEventListener('click', function () { if (!room) return; var me = room.me(); room.setState({ ready: !(me && me.ready) }); snd('click'); render(); });
    $('mpStartBtn').addEventListener('click', start);
    $('mpFmt1').addEventListener('click', function () { setFmt('1v1'); });
    $('mpFmt3').addEventListener('click', function () { setFmt('ffa'); });
    // keep game keys (WASD, E, M) from reaching the hub while typing / in the lobby
    $('mp').addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Escape') MP.close(); });
    window.addEventListener('pageshow', function (e) { if (e.persisted) { going = false; $('fade').classList.remove('on'); } });
  };
  MP._debug = function () { return { screen: screen, open: openFlag, code: room && room.code, isHost: room && room.isHost, players: room ? room.players().map(function (p) { return { name: p.name, slot: p.slot, ready: p.host || p.ready, host: p.host }; }) : [], meta: room && room.meta(), opened: !!(room && room.opened) }; };
})();
