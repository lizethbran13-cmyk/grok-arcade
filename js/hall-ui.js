/* Grok Arcade - Hall of Game Records overlay: Gus's directory of every game, and one exhibit per game with
   a picture gallery, the update history and playable old versions (separate saves). */
(function () {
  'use strict';
  var L = GA.HallUI = {};
  var H = GA.Hall = {};
  var LINES = {
    hello: ['Oh. A visitor. Wipe your feet. These records don\u2019t dust themselves.', 'Welcome to the Hall of Game Records. Please don\u2019t breathe on the exhibits.', 'Shh! This is a museum. Mostly. Okay, it\u2019s a room. A FANCY room.'],
    talk: ['What. I\u2019m busy. Filing. Very important filing.', 'Sixteen games. SIXTEEN. Do you know how many folders that is?', 'You want the directory? Fine. Here. Don\u2019t bend the pages.', 'I\u2019ve been the archivist since... this morning. Feels like forever.', 'Ask me about any game. Or don\u2019t. Honestly, both are fine.'],
    pics: ['Yes, those are pictures. Of games. Riveting.', 'Swipe gently. Those pixels are ANTIQUES.', 'Ooh, a screenshot. I\u2019ll alert the newspapers.'],
    hist: ['Ah, the update logs. My favorite bedtime reading. Zzz.', 'Every update, written down by me. With my good pen.', 'Version this, version that. In MY day games had one version: done.'],
    old: ['Playing an OLD version? Bold. Your newest save is safe. I checked. Twice.', 'Old versions keep their own save. I put them in a separate drawer.', 'Careful, these old builds are vintage. Like me.'],
    none: ['Nothing in the vault for this one. It\u2019s brand new. Go away. Nicely.'],
    launch: ['Fine, go play. Don\u2019t touch the glass on your way out.', 'Off you go. I\u2019ll just stand here. Alone. Filing.'],
    bye: ['Finally, some peace and quiet.', 'Don\u2019t let the velvet rope hit you on the way out.', 'Come back never. ...Okay, come back tomorrow.'],
    pester: ['You again.', 'Still here?', 'Do I look like a tour guide?', 'I am THIS close to closing early.', 'Okay, okay. You\u2019re persistent. I respect that. A little.', '...Fine. You\u2019re my favorite visitor. Don\u2019t tell anyone.']
  };
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  L.line = function (k) { return pick(LINES[k] || LINES.talk); };
  L.LINES = LINES;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function snd(n) { try { GA.Audio.play(n); } catch (e) {} }
  var openNow = false, cur = null, tab = 'pics', pic = 0, pester = 0, view = 'dir';
  function games() { return GA.MAIN_GAMES.filter(function (g) { return GA.HALL_DATA && GA.HALL_DATA[g.id]; }); }
  function data(id) { return GA.HALL_DATA[id]; }
  function say(k, txt) { var t = txt || L.line(k); var el = $('hlGus'); if (el) el.textContent = t; if (GA.Hall3D && GA.Hall3D.say) GA.Hall3D.say(t, 5); H.lastLine = t; return t; }
  function seen(id) { var s = GA.store.get('hallSeen', {}); if (!s[id]) { s[id] = 1; GA.store.set('hallSeen', s); } var n = Object.keys(s).length; if (GA.Prog) GA.Prog.event('hallSeen', n); return n; }
  H.seenCount = function () { return Object.keys(GA.store.get('hallSeen', {})).length; };

  function build() {
    var d = document.createElement('div'); d.id = 'hl'; d.className = 'pzOv hidden'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    d.innerHTML = '<div class="pzPanel hlPanel"><div class="pzHead"><div class="pzTitle"><b id="hlTitle">\uD83C\uDFDB\uFE0F HALL OF GAME RECORDS</b><span id="hlSub">Curated (grumpily) by Gus</span></div><span class="hlNav hidden" id="hlNav"><button class="pzTab" id="hlPrev" aria-label="Previous exhibit">\u25C0</button><button class="pzTab" id="hlDir" aria-label="All games">\u2630</button><button class="pzTab" id="hlNext" aria-label="Next exhibit">\u25B6</button></span><button id="hlClose" class="xBtn" aria-label="Close">&#10005;</button></div>' +
      '<div class="hlGusRow"><div class="hlGusFace" aria-hidden="true"><i class="b1"></i><i class="b2"></i><i class="g1"></i><i class="g2"></i><i class="m"></i></div><div class="hlBubble" id="hlGus" role="status"></div></div>' +
      '<div class="pzTabs" id="hlTabs"></div><div class="pzScroll" id="hlBody"></div></div>';
    document.body.appendChild(d);
    $('hlClose').addEventListener('click', close);
    $('hlPrev').addEventListener('click', function () { step(-1); }); $('hlNext').addEventListener('click', function () { step(1); }); $('hlDir').addEventListener('click', function () { snd('click'); H.openDirectory(); });
    d.addEventListener('click', function (e) { if (e.target === d) close(); });
    window.addEventListener('keydown', function (e) {
      if (!openNow) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      else if (view === 'ex' && tab === 'pics' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); e.stopPropagation(); go(e.key === 'ArrowRight' ? 1 : -1); }
    }, true);
    $('hlGus').addEventListener('click', function () { pester++; say(null, pester > 5 ? LINES.pester[5] : LINES.pester[Math.min(pester - 1, 4)]); snd('click'); });
  }
  function show() {
    if (!$('hl')) build();
    if (GA.UI && GA.UI.closeMenu) GA.UI.closeMenu(true);
    if (!openNow) { openNow = true; $('hl').classList.remove('hidden'); document.body.classList.add('pzOn'); if (GA.Hub) { GA.Hub.setPaused(true); if (GA.Hub.clearInput) GA.Hub.clearInput(); } snd('open'); }
  }
  /* ---------- Gus's directory ---------- */
  H.openDirectory = function () {
    show(); view = 'dir'; cur = null; $('hlNav').classList.add('hidden');
    $('hlTitle').textContent = '\uD83C\uDFDB\uFE0F HALL OF GAME RECORDS'; $('hlSub').textContent = 'Every Grok game \u00b7 ' + H.seenCount() + '/' + games().length + ' exhibits visited';
    $('hlTabs').innerHTML = '<span class="hlHint">Pick a game. Gus will (reluctantly) show you everything.</span>';
    $('hlBody').innerHTML = '<div class="hlDir">' + games().map(function (g) {
      var dd = data(g.id), last = dd.history[dd.history.length - 1];
      return '<button class="hlCard" data-g="' + g.id + '" style="--c:' + g.color + '"><img src="' + dd.cover + '" alt="" loading="lazy"><b>' + esc(g.name) + '</b><small>v' + esc(last.ver) + ' \u00b7 ' + dd.history.length + ' updates \u00b7 ' + (dd.versions.length ? dd.versions.length + ' old' : 'new') + '</small></button>';
    }).join('') + '</div>';
    Array.prototype.forEach.call(document.querySelectorAll('.hlCard'), function (b) { b.addEventListener('click', function () { snd('click'); H.open(b.getAttribute('data-g')); }); });
    say('talk'); $('hlBody').scrollTop = 0;
  };
  /* ---------- one exhibit ---------- */
  H.open = function (gid, t) {
    var g = GA.findGame(gid), dd = data(gid); if (!g || !dd) return false;
    show(); view = 'ex'; cur = gid; pic = 0; seen(gid); $('hlNav').classList.remove('hidden');
    $('hlTitle').textContent = g.name.toUpperCase(); $('hlSub').textContent = 'Exhibit ' + (games().indexOf(g) + 1) + ' of ' + games().length + ' \u00b7 ' + dd.repo;
    $('hlTabs').innerHTML = '<button class="pzTab" data-t="pics">\uD83D\uDCF8 Pics <small>' + dd.pics.length + '</small></button><button class="pzTab" data-t="hist">\uD83D\uDCDC History <small>' + dd.history.length + '</small></button><button class="pzTab" data-t="old">\uD83D\uDCFC Old <small>' + dd.versions.length + '</small></button>';
    Array.prototype.forEach.call(document.querySelectorAll('#hlTabs .pzTab[data-t]'), function (b) { b.addEventListener('click', function () { snd('click'); setTab(b.getAttribute('data-t')); }); });
    say(null, dd.quip);
    setTab(t || 'pics', true);
    return true;
  };
  function step(k) { var gs = games(), i = gs.findIndex(function (g) { return g.id === cur; }); snd('click'); H.open(gs[(i + k + gs.length) % gs.length].id, tab); }
  function setTab(t, quiet) {
    tab = t; Array.prototype.forEach.call(document.querySelectorAll('#hlTabs .pzTab[data-t]'), function (b) { b.classList.toggle('on', b.getAttribute('data-t') === t); });
    var dd = data(cur), g = GA.findGame(cur), h = '';
    if (t === 'pics') {
      h = '<div class="hlViewer"><button class="hlArrow l" id="hlL" aria-label="Previous picture">\u276E</button><div class="hlFrame"><img id="hlImg" alt=""></div><button class="hlArrow r" id="hlR" aria-label="Next picture">\u276F</button></div>' +
        '<div class="hlCap" id="hlCap"></div><div class="hlThumbs">' + dd.pics.map(function (p, i) { return '<button class="hlTh" data-i="' + i + '"><img src="' + p.src + '" alt="' + esc(p.cap) + '" loading="lazy"></button>'; }).join('') + '</div>' +
        '<div class="hlBtns"><button class="bigBtn" id="hlPlay">\u25B6 PLAY NEWEST</button></div>';
    } else if (t === 'hist') {
      h = '<ol class="hlTime">' + dd.history.slice().reverse().map(function (e, i) { return '<li class="' + (i === 0 ? 'now' : '') + '"><div class="hlVer" style="--c:' + g.color + '">v' + esc(e.ver) + '</div><div><div class="hlDate">' + esc(e.date) + (i === 0 ? ' \u00b7 <b>NEWEST</b>' : '') + '</div><b class="hlEt">' + esc(e.title) + '</b><p>' + esc(e.text) + '</p></div></li>'; }).join('') + '</ol>' +
        '<div class="sbMeta center">Written from the ' + esc(dd.repo) + ' update log by Gus. With his good pen.</div>';
    } else {
      if (!dd.versions.length) h = '<div class="sbEmpty">\uD83D\uDDC4\uFE0F ' + esc(dd.noOld || 'No old versions yet.') + '</div>';
      else h = '<div class="hlWarn">\uD83D\uDCBE Old versions keep their <b>own separate save</b>, so your newest ' + esc(g.name) + ' progress stays safe. Some old versions may not have newer features (or online play) yet.</div>' +
        '<div class="hlVers">' + dd.versions.slice().reverse().map(function (v) { return '<div class="hlVcard"><img src="' + v.thumb + '" alt="" loading="lazy"><div class="hlVinfo"><b>Version ' + esc(v.ver) + '</b><span>' + esc(v.title) + '</span></div><button class="bigBtn alt hlOld" data-l="' + v.label + '">\u25B6 PLAY v' + esc(v.ver) + '</button></div>'; }).join('') + '</div>';
      h += '<div class="hlBtns"><button class="bigBtn" id="hlPlay">\u25B6 PLAY NEWEST</button></div>';
    }
    $('hlBody').innerHTML = h; $('hlBody').scrollTop = 0;
    if (t === 'pics') {
      $('hlL').addEventListener('click', function () { go(-1); }); $('hlR').addEventListener('click', function () { go(1); });
      Array.prototype.forEach.call(document.querySelectorAll('.hlTh'), function (b) { b.addEventListener('click', function () { pic = +b.getAttribute('data-i'); drawPic(); snd('click'); }); });
      var fr = document.querySelector('.hlFrame'), sx = null;
      fr.addEventListener('pointerdown', function (e) { sx = e.clientX; }); fr.addEventListener('pointerup', function (e) { if (sx != null && Math.abs(e.clientX - sx) > 40) go(e.clientX < sx ? 1 : -1); sx = null; });
      drawPic();
    }
    Array.prototype.forEach.call(document.querySelectorAll('.hlOld'), function (b) { b.addEventListener('click', function () { H.playOld(cur, b.getAttribute('data-l')); }); });
    var pb = $('hlPlay'); if (pb) pb.addEventListener('click', function () { say('launch'); close(true); GA.launchMain(g); });
    if (!quiet) say(t === 'old' && !dd.versions.length ? 'none' : t);
  }
  function go(k) { var n = data(cur).pics.length; pic = (pic + k + n) % n; drawPic(); snd('click'); }
  function drawPic() {
    var p = data(cur).pics[pic]; $('hlImg').src = p.src; $('hlImg').alt = p.cap; $('hlCap').textContent = (pic + 1) + ' / ' + data(cur).pics.length + ' \u00b7 ' + p.cap;
    Array.prototype.forEach.call(document.querySelectorAll('.hlTh'), function (b, i) { b.classList.toggle('on', i === pic); });
  }
  H.playOld = function (gid, label) {
    var dd = data(gid), v = dd && dd.versions.find(function (x) { return x.label === label; }); if (!v) return false;
    H.lastOld = v.url; if (GA.Prog) GA.Prog.event('oldVersion');
    say(null, 'Version ' + v.ver + '. Vintage. Separate save, as promised. Off you go.');
    close(true);
    GA.launchMain({ id: gid, name: GA.findGame(gid).name + ' v' + v.ver, url: v.url });
    return true;
  };
  function close(silent) {
    if (!openNow) return; openNow = false; $('hl').classList.add('hidden'); document.body.classList.remove('pzOn'); if (silent !== true) { snd('menu'); if (GA.Hall3D && GA.Hall3D.say) GA.Hall3D.say(L.line('bye'), 3.5); }
    if (GA.Hub) GA.Hub.setPaused(false); if (H.onClose) H.onClose();
  }
  H.close = close;
  H.isOpen = function () { return openNow; };
  H.state = function () { return { open: openNow, view: view, game: cur, tab: tab, pic: pic, img: $('hlImg') ? $('hlImg').getAttribute('src') : null, gus: $('hlGus') ? $('hlGus').textContent : null }; };
  H.tab = function (t) { if (view === 'ex') setTab(t); };
  H.next = function (k) { if (view === 'ex') step(k || 1); };
  H.talk = function () { pester++; H.openDirectory(); if (pester > 3) say(null, LINES.pester[Math.min(pester - 4, 5)]); };
})();
