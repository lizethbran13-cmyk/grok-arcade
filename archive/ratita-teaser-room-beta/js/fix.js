/* Grok Arcade - broken Multiplayer Antenna: Gary from IT, the wire repair minigame, and the arcade power cut.
   - The antenna breaks on ~30% of visits, never on two visits in a row, and only blocks HOSTING. Joining with a code always works.
   - Fix 1: talk to Gary from IT (IT Help Desk by the prize counter). He walks over and repairs it.
   - Fix 2: the wire minigame (4 wires, 10 s). A wrong wire zaps you and shuts down the whole arcade until Gary restores power. */
(function () {
  'use strict';
  var Fix = GA.Fix = {};
  var S = { broken: false, powerOut: false, fixedBy: null };
  var CHANCE = 0.43, WIRE_TIME = 10; // 0.43 roll + "never twice in a row" = broken on ~30% of visits
  var WIRES = [{ c: '#ff3b4f', s: '\u25B2', n: 'red' }, { c: '#3ba7ff', s: '\u25CF', n: 'blue' }, { c: '#ffd23b', s: '\u25A0', n: 'yellow' }, { c: '#3bff7a', s: '\u2605', n: 'green' }];
  var openWhat = null, fromLobby = false, wireState = null, guideOn = false, toastT = 0;
  function $(id) { return document.getElementById(id); }
  function ss(k, v) { try { if (v === undefined) return JSON.parse(sessionStorage.getItem('grokArcade.' + k) || 'null'); sessionStorage.setItem('grokArcade.' + k, JSON.stringify(v)); } catch (e) { return null; } }
  function save() { ss('antenna.visit', { broken: S.broken, powerOut: S.powerOut }); }
  function changed() { if (GA.Hub) { GA.Hub.setAntennaBroken(S.broken); GA.Hub.garyNeeded(S.broken || S.powerOut); } if (Fix.onChange) Fix.onChange(); }

  /* one roll per visit (browser session); the result survives trips into games and back */
  function roll() {
    var q = new URLSearchParams(location.search), ov = q.get('antenna'), visit = ss('antenna.visit');
    if (ov === 'broken' || ov === 'ok') { S.broken = ov === 'broken'; S.powerOut = q.get('power') === 'out'; }
    else if (window.GrokNet && GrokNet.params()) { S.broken = false; S.powerOut = false; } // back from an online game: never block
    else if (visit) { S.broken = !!visit.broken; S.powerOut = !!visit.powerOut; }
    else {
      var last = GA.store.get('antenna.last', 'ok');
      S.broken = last !== 'broken' && Math.random() < CHANCE;
      GA.store.set('antenna.last', S.broken ? 'broken' : 'ok');
    }
    save();
  }

  /* ---------- DOM ---------- */
  function build() {
    var d = document.createElement('div');
    d.innerHTML =
      '<div id="fixDlg" class="fixOv hidden" role="dialog" aria-modal="true"><div class="fixCard">' +
        '<div class="fixWarn" id="fixWarn">\u26A0 OUT OF ORDER</div><h2 id="fixTitle">Multiplayer Antenna</h2><p id="fixMsg"></p>' +
        '<div class="fixBtns"><button id="fixGary" class="fixBtn gary">\uD83D\uDD27 FIND GARY FROM IT<small>He fixes it for you</small></button>' +
        '<button id="fixWires" class="fixBtn wires">\u26A1 FIX THE WIRES MYSELF<small>4 wires \u00b7 10 seconds \u00b7 don\u2019t mix them up!</small></button>' +
        '<button id="fixJoin" class="fixBtn join">\uD83D\uDD11 JOIN WITH A CODE<small>Joining a friend always works</small></button></div>' +
        '<button id="fixClose" class="fixLink">Close</button></div></div>' +
      '<div id="wires" class="fixOv hidden"><div class="wCard" id="wCard">' +
        '<div class="wHead"><b>FIX THE ANTENNA</b><span id="wTime">10</span></div><div class="wBar"><i id="wBarI"></i></div>' +
        '<div class="wHow" id="wHow">Drag each wire to the socket with the same color and symbol.</div>' +
        '<div class="wBoard" id="wBoard"><svg id="wSvg"></svg><div class="wCol" id="wPlugs"></div><div class="wCol r" id="wSocks"></div></div>' +
        '<div class="wFoot"><button id="wQuit" class="fixLink">Give up</button></div>' +
        '<div id="wResult" class="wResult hidden"></div></div></div>' +
      '<div id="zap" class="hidden"><div class="zapFlash"></div><svg class="zapBolt" viewBox="0 0 100 160"><polygon points="58,0 18,88 46,88 30,160 86,58 56,58 76,0" /></svg><div class="zapTxt">ZAP!!</div></div>' +
      '<div id="powerBanner" class="hidden">\u26A1 POWER OUT! <span>Find <b>Gary from IT</b> at the IT Help Desk by the prize counter</span></div>' +
      '<div id="garyTalk" class="hidden"><div class="gtFace">\uD83E\uDDD4\u200D\uD83D\uDCBB</div><div><b>GARY FROM IT</b><p id="gtText"></p></div></div>' +
      '<div id="garyArrow" class="hidden"><div class="gaTip">\u25B2</div><span>GARY</span></div>' +
      '<div id="fixToast" class="hidden"></div>';
    while (d.firstChild) document.body.appendChild(d.firstChild);
    var nb = document.createElement('div'); nb.id = 'mpBroken'; nb.className = 'mpBroken hidden';
    nb.innerHTML = '\u26A0 The antenna is <b>out of order</b>, so hosting is offline. Fix it (Gary from IT or the wires) to host. <b>Joining with a code still works!</b>';
    var s1 = $('mpS1'); if (s1) s1.insertBefore(nb, s1.firstChild);

    $('fixGary').addEventListener('click', function () { closeDlg(); seekGary(); });
    $('fixWires').addEventListener('click', function () { closeDlg(true); openWires(); });
    $('fixJoin').addEventListener('click', function () { closeDlg(true); GA.MP.open(); setTimeout(function () { var b = $('mpJoinBtn'); if (b) b.click(); }, 60); });
    $('fixClose').addEventListener('click', function () { closeDlg(); });
    $('fixDlg').addEventListener('click', function (e) { if (e.target === $('fixDlg')) closeDlg(); });
    $('wQuit').addEventListener('click', function () { endWires('quit'); });
    $('garyTalk').addEventListener('click', function () { $('garyTalk').classList.add('hidden'); });
    window.addEventListener('keydown', function (e) {
      if (!openWhat) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (openWhat === 'dlg') closeDlg(); else if (openWhat === 'wires' && wireState && !wireState.over) endWires('quit'); }
    }, true);
    setupBoard();
  }

  function pause(b) { if (GA.Hub) GA.Hub.setPaused(b); }
  function toast(msg, ms) {
    var t = $('fixToast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.add('hidden'); }, ms || 3200);
  }
  function say(text, ms) {
    $('gtText').textContent = text; $('garyTalk').classList.remove('hidden'); GA.Audio.play('talk');
    clearTimeout(say.t); say.t = setTimeout(function () { $('garyTalk').classList.add('hidden'); }, ms || 3800);
  }

  /* ---------- repair dialog ---------- */
  function openRepair(opts) {
    opts = opts || {}; fromLobby = !!opts.fromLobby;
    if (GA.MP && GA.MP.isOpen()) GA.MP.close();
    var out = S.powerOut;
    $('fixWarn').textContent = out ? '\u26A1 POWER OUT' : '\u26A0 OUT OF ORDER';
    $('fixMsg').innerHTML = out
      ? 'Someone crossed the wires and the whole arcade lost power! Only <b>Gary from IT</b> can fix this now. Joining a friend with a code still works.'
      : 'Sparks are flying and hosting is offline. <b>Gary from IT</b> can fix it, or you can try the wires yourself if you\u2019re in a hurry (careful, a wrong wire packs a zap!). Joining a friend with a code still works.';
    $('fixWires').classList.toggle('hidden', out);
    $('fixDlg').classList.remove('hidden'); openWhat = 'dlg'; pause(true); GA.Audio.play('buzz');
  }
  function closeDlg(keepPaused) { $('fixDlg').classList.add('hidden'); openWhat = null; if (!keepPaused) { pause(false); if (Fix.onChange) Fix.onChange(); } }

  /* ---------- finding + talking to Gary ---------- */
  function seekGary() {
    guideOn = true; $('garyArrow').classList.remove('hidden');
    toast('Gary from IT is at the IT Help Desk next to the prize counter. Follow the arrow!', 4200);
  }
  function guideLoop() {
    requestAnimationFrame(guideLoop);
    var a = $('garyArrow'); if (!a) return;
    var need = (S.broken || S.powerOut) && guideOn && !openWhat && !(GA.MG && GA.MG.isOpen()) && !(GA.MP && GA.MP.isOpen());
    var g = need && GA.Hub && GA.Hub.garyScreen(), st = GA.Hub && GA.Hub.gary();
    if (!g || !st || st.state !== 'desk' || g.dist < 2.6) { a.classList.add('hidden'); return; }
    a.classList.remove('hidden');
    var w = window.innerWidth, h = window.innerHeight, cx = w / 2, cy = h / 2, x = g.x, y = g.y;
    if (g.behind) { x = w - x; y = h; }
    var dx = x - cx, dy = y - cy, m = 70, k = Math.min((cx - m) / Math.max(1, Math.abs(dx)), (cy - m) / Math.max(1, Math.abs(dy)));
    if (g.on && !g.behind) { a.style.transform = 'translate(' + (x - 30) + 'px,' + (y - 90) + 'px)'; a.querySelector('.gaTip').style.transform = 'rotate(180deg)'; return; }
    k = Math.min(k, 1e6); var px = cx + dx * k, py = cy + dy * k;
    a.style.transform = 'translate(' + (px - 30) + 'px,' + (py - 30) + 'px)';
    a.querySelector('.gaTip').style.transform = 'rotate(' + (Math.atan2(dy, dx) * 180 / Math.PI + 90) + 'deg)';
  }
  var IDLE = ['Have you tried turning it off and on again?', 'The antenna is working great today. Go play with your friends!', 'Pro tip: Gary\u2019s Wire Rush is in the Bonus Zone. I hold the record. Probably.',
    'If anything breaks, you know where to find me.', 'Did you know? The antenna runs on pure arcade spirit. And Wi-Fi.'];
  function talk() {
    var st = GA.Hub.gary();
    if (st.state !== 'desk') { say('One sec, I\u2019m on it!'); return; }
    if (!S.broken && !S.powerOut) { say(IDLE[Math.floor(Math.random() * IDLE.length)]); if (GA.Prog) GA.Prog.event('garyChat'); return; }
    guideOn = false; $('garyArrow').classList.add('hidden');
    var out = S.powerOut;
    say(out ? 'Whoa, who crossed the wires?! Don\u2019t worry, I\u2019ve got this. Follow me!' : 'The antenna is acting up again? Classic. Be right there!', 3200);
    GA.Hub.garyGo(function () {
      // fixed!
      S.broken = false; S.fixedBy = 'gary'; if (GA.Prog) GA.Prog.event('garyFix');
      if (S.powerOut) { S.powerOut = false; GA.Hub.setPower(true); GA.Audio.play('powerup'); $('powerBanner').classList.add('hidden'); }
      save(); changed(); GA.Audio.play('fixed');
      say(out ? 'Power\u2019s back and the antenna is fixed. Maybe leave the wires to me next time!' : 'All fixed! Have fun playing online!', 4200);
      toast(out ? 'Power restored! The antenna works again.' : 'Antenna fixed! You can host a room now.', 3500);
    }, function () { if (Fix.onChange) Fix.onChange(); });
    if (Fix.onChange) Fix.onChange();
  }

  /* ---------- wire minigame ---------- */
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function openWires() {
    var left = shuffle([0, 1, 2, 3]), right = shuffle([0, 1, 2, 3]);
    while (right.join() === left.join()) right = shuffle(right);
    wireState = { left: left, right: right, done: {}, sel: null, drag: null, t: WIRE_TIME, over: false, last: performance.now() };
    var P = $('wPlugs'), K = $('wSocks'); P.innerHTML = ''; K.innerHTML = '';
    left.forEach(function (w) { var b = document.createElement('button'); b.className = 'wPlug'; b.setAttribute('data-w', w); b.style.setProperty('--c', WIRES[w].c); b.innerHTML = '<span>' + WIRES[w].s + '</span>'; b.setAttribute('aria-label', WIRES[w].n + ' wire'); P.appendChild(b); });
    right.forEach(function (w) { var b = document.createElement('button'); b.className = 'wSock'; b.setAttribute('data-w', w); b.style.setProperty('--c', WIRES[w].c); b.innerHTML = '<span>' + WIRES[w].s + '</span>'; b.setAttribute('aria-label', WIRES[w].n + ' socket'); K.appendChild(b); });
    $('wResult').classList.add('hidden'); $('wCard').classList.remove('shock');
    $('wires').classList.remove('hidden'); openWhat = 'wires'; pause(true); GA.Audio.play('open');
    drawWires(); requestAnimationFrame(wireTick);
  }
  function wireTick(now) {
    var w = wireState; if (!w || w.over || openWhat !== 'wires') return;
    w.t -= Math.min(0.1, (now - w.last) / 1000); w.last = now;
    $('wTime').textContent = Math.max(0, Math.ceil(w.t)); $('wBarI').style.width = Math.max(0, w.t / WIRE_TIME * 100) + '%';
    $('wBarI').classList.toggle('low', w.t < 3.5);
    if (w.t <= 0) { endWires('timeout'); return; }
    requestAnimationFrame(wireTick);
  }
  function center(el, side) { var b = $('wBoard').getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: (side === 'r' ? r.left : r.right) - b.left, y: r.top + r.height / 2 - b.top }; }
  function path(a, b) { var mx = (a.x + b.x) / 2; return 'M' + a.x + ',' + a.y + ' C' + mx + ',' + a.y + ' ' + mx + ',' + b.y + ' ' + b.x + ',' + b.y; }
  function drawWires() {
    var w = wireState, svg = $('wSvg'); if (!w) return; var h = '';
    Object.keys(w.done).forEach(function (k) {
      var p = document.querySelector('.wPlug[data-w="' + k + '"]'), s = document.querySelector('.wSock[data-w="' + k + '"]');
      h += '<path d="' + path(center(p), center(s, 'r')) + '" stroke="' + WIRES[k].c + '" />';
    });
    if (w.drag) { var pp = document.querySelector('.wPlug[data-w="' + w.drag.w + '"]'); h += '<path class="live" d="' + path(center(pp), w.drag.p) + '" stroke="' + WIRES[w.drag.w].c + '" />'; }
    else if (w.sel != null) { var ps = document.querySelector('.wPlug[data-w="' + w.sel + '"]'), c = center(ps); h += '<circle cx="' + c.x + '" cy="' + c.y + '" r="9" fill="' + WIRES[w.sel].c + '" />'; }
    svg.innerHTML = h;
    document.querySelectorAll('.wPlug').forEach(function (b) { var k = b.getAttribute('data-w'); b.classList.toggle('done', !!w.done[k]); b.classList.toggle('sel', String(w.sel) === k); });
    document.querySelectorAll('.wSock').forEach(function (b) { b.classList.toggle('done', !!w.done[b.getAttribute('data-w')]); });
  }
  function connect(plugW, sockW) {
    var w = wireState; if (!w || w.over) return;
    w.sel = null; w.drag = null;
    if (w.done[sockW]) { drawWires(); return; }
    if (plugW === sockW) {
      w.done[plugW] = true; GA.Audio.play('wire'); drawWires();
      if (Object.keys(w.done).length === 4) endWires('ok');
    } else { drawWires(); shock(plugW, sockW); }
  }
  function setupBoard() {
    var board = $('wBoard'), down = null;
    function bpos(e) { var b = board.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
    board.addEventListener('pointerdown', function (e) {
      var w = wireState; if (!w || w.over) return; e.preventDefault();
      var plug = e.target.closest('.wPlug'), sock = e.target.closest('.wSock');
      if (plug && !plug.classList.contains('done')) {
        var pw = +plug.getAttribute('data-w');
        down = { w: pw, x: e.clientX, y: e.clientY, id: e.pointerId }; w.drag = { w: pw, p: bpos(e) };
        try { board.setPointerCapture(e.pointerId); } catch (er) {}
        drawWires(); GA.Audio.play('click');
      } else if (sock && w.sel != null) { connect(w.sel, +sock.getAttribute('data-w')); }
    });
    board.addEventListener('pointermove', function (e) { var w = wireState; if (!w || !w.drag || !down || e.pointerId !== down.id) return; w.drag.p = bpos(e); drawWires(); });
    function up(e) {
      var w = wireState; if (!w || !down || e.pointerId !== down.id) return;
      var d0 = down; down = null;
      var el = document.elementFromPoint(e.clientX, e.clientY), sock = el && el.closest && el.closest('.wSock');
      if (sock && Math.hypot(e.clientX - d0.x, e.clientY - d0.y) > 12) { connect(d0.w, +sock.getAttribute('data-w')); return; }
      // a tap: select the plug, then tap its socket
      w.drag = null; w.sel = Math.hypot(e.clientX - d0.x, e.clientY - d0.y) <= 12 ? d0.w : null; drawWires();
    }
    board.addEventListener('pointerup', up); board.addEventListener('pointercancel', function (e) { down = null; if (wireState) { wireState.drag = null; drawWires(); } });
    window.addEventListener('resize', function () { if (openWhat === 'wires') drawWires(); });
  }
  function result(html, btns) {
    var r = $('wResult'); r.innerHTML = html + '<div class="wrBtns"></div>'; r.classList.remove('hidden');
    (btns || []).forEach(function (b) { var e = document.createElement('button'); e.className = 'fixBtn small ' + (b.cls || ''); e.textContent = b.t; e.addEventListener('click', b.fn); r.querySelector('.wrBtns').appendChild(e); });
  }
  function closeWires() { $('wires').classList.add('hidden'); openWhat = null; wireState = null; pause(false); if (Fix.onChange) Fix.onChange(); }
  function endWires(why) {
    var w = wireState; if (!w || w.over) return; w.over = true;
    if (why === 'ok') {
      GA.Audio.play('fixed'); S.broken = false; S.fixedBy = 'wires'; save(); if (GA.Prog) GA.Prog.event('wireFix');
      result('<div class="wrBig ok">ANTENNA FIXED!</div><p>Nice and fast. You can host a room now.</p>');
      setTimeout(function () { closeWires(); changed(); toast('Antenna fixed! Tap PLAY ONLINE to host.'); if (fromLobby) GA.MP.open(); }, 1300);
    } else if (why === 'timeout') {
      GA.Audio.play('miss');
      result('<div class="wrBig">OUT OF TIME!</div><p>The wires slipped out of place.</p>', [
        { t: 'TRY AGAIN', fn: function () { closeWires(); openWires(); } },
        { t: 'FIND GARY', cls: 'gary', fn: function () { closeWires(); seekGary(); } }]);
    } else { closeWires(); }
  }
  function shock(a, b) {
    var w = wireState; w.over = true;
    GA.Audio.play('zap'); GA.Audio.play('buzz');
    $('wCard').classList.add('shock'); $('zap').classList.remove('hidden');
    if (navigator.vibrate) try { navigator.vibrate([80, 40, 160]); } catch (e) {}
    Fix._lastShock = { plug: WIRES[a].n, socket: WIRES[b].n }; if (GA.Prog) GA.Prog.event('zapped');
    setTimeout(function () {
      $('zap').classList.add('hidden'); closeWires(); shutdown();
    }, 1300);
  }
  function shutdown() {
    S.powerOut = true; save();
    GA.Hub.setPower(false); GA.Hub.shake(0.8); GA.Audio.play('powerdown');
    $('powerBanner').classList.remove('hidden');
    changed(); guideOn = true;
    setTimeout(function () { toast('The whole arcade lost power! Find Gary from IT to get it back.', 4500); }, 900);
  }

  /* ---------- public ---------- */
  Fix.init = function () {
    roll(); build();
    if (S.powerOut) { GA.Hub.setPower(false, true); $('powerBanner').classList.remove('hidden'); guideOn = true; }
    changed(); requestAnimationFrame(guideLoop);
    if (GA.Hub) GA.Hub.onSpark = function () { GA.Audio.play('spark'); };
  };
  Fix.broken = function () { return S.broken; };
  Fix.powerOut = function () { return S.powerOut; };
  Fix.blocksHost = function () { return S.broken || S.powerOut; };
  Fix.isOpen = function () { return !!openWhat; };
  Fix.openRepair = openRepair; Fix.talk = talk; Fix.toast = toast; Fix.say = say;
  Fix.noPower = function (cab) { toast('No power! Find Gary from IT at the IT Help Desk to turn the arcade back on.'); GA.Audio.play('buzz'); guideOn = true; };
  Fix.lobbyBanner = function () { var b = $('mpBroken'); if (b) b.classList.toggle('hidden', !Fix.blocksHost()); };
  /* test hooks */
  Fix.set = function (o) {
    if ('broken' in o) S.broken = !!o.broken;
    if ('powerOut' in o) { S.powerOut = !!o.powerOut; GA.Hub.setPower(!S.powerOut, true); $('powerBanner').classList.toggle('hidden', !S.powerOut); }
    save(); changed();
  };
  Fix._debug = function () {
    var w = wireState;
    return { broken: S.broken, powerOut: S.powerOut, fixedBy: S.fixedBy, open: openWhat, guide: guideOn,
      wires: w ? { left: w.left.map(function (i) { return WIRES[i].n; }), right: w.right.map(function (i) { return WIRES[i].n; }), done: Object.keys(w.done).length, t: +w.t.toFixed(1), over: w.over } : null,
      gary: GA.Hub.gary(), power: GA.Hub.power(), antenna: GA.Hub.antennaBroken() };
  };
  Fix.CHANCE = CHANCE; Fix._roll = roll;
})();
