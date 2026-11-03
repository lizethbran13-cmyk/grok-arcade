/* Grok Arcade — Issue #73: Online Play Update (GA.Online3D + GA.OnlinePlay)
 * - Online play across all 40 of 41 Main Games (all except Grok Surfers unless Lizeth says otherwise!)
 * - Auto-Online policy for all Future Games unless Lizeth marks "No Need"
 * - All 5 Pets (Luna, Pi-rat, Snowie, Candy, Torty) in 3D at the Multiplayer Antenna + in the Relay Crew UI
 * - Real consequences for disconnects / rage-quits / packet fouls (-Signal Integrity & -Tickets fee)
 * - Never-Stuck Guarantee: Candy & Torty's Free Emergency Signal Rebuild (0 tickets)
 */
(function () {
  'use strict';
  var GA = window.GA = window.GA || {};
  var O3 = GA.Online3D = {};
  var OP = GA.OnlinePlay = {};

  function $(id) { return document.getElementById(id); }
  function snd(n) { try { if (GA.Audio) GA.Audio.play(n); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- Persistent State (Signal, Fair-Play Standing, Policy Overrides) ---------- */
  var S = {
    signal: 100,
    strikes: 0,
    cloudShield: true,
    piratClaimed: false,
    surfersOverride: false,
    autoFutureOnline: true,
    noNeedIds: {},
    activeTab: 'code',
    filter: 'all',
    search: '',
    focusGame: null,
    lastEvent: 'All 5 pets have the Ratita \u00d7 Tortuga Relay humming at 100% Signal Integrity!'
  };

  var PET_CREW = [
    {
      id: 'luna',
      icon: '\uD83D\uDC2D',
      name: 'Luna',
      title: 'Lead Ratita Net-Engineer',
      color: '#f472b6',
      role: 'Tunes high-frequency cheese-capacitor relays & cuts lobby ping across all 40 online games.',
      btn: '\uD83D\uDD27 Tune Packet Router (+15% Signal)',
      codePrefix: 'LUNA'
    },
    {
      id: 'pirat',
      icon: '\uD83C\uDFF4\u200D\u2620\uFE0F',
      name: 'Pi-rat',
      title: 'Party-Code Corsair',
      color: '#fbbf24',
      role: 'Guards the 5-letter Party Code chest & hands out lucky crew codes + bonus arcade tickets.',
      btn: '\uD83D\uDDDD\uFE0F Roll VIP Code & +5 \uD83C\uDF9F\uFE0F Bonus',
      codePrefix: 'PRAT'
    },
    {
      id: 'snowie',
      icon: '\uD83D\uDC36',
      name: 'Snowie',
      title: 'Cloud-Relay Navigator',
      color: '#38bdf8',
      role: 'Wraps your room in a weatherproof Cloud Shield that absorbs the next accidental disconnect.',
      btn: '\u2601\uFE0F Arm Weatherproof Cloud Shield',
      codePrefix: 'SNOW'
    },
    {
      id: 'candy',
      icon: '\uD83D\uDC15',
      name: 'Candy',
      title: 'Fair-Play Schnauzer Marshal',
      color: '#ec4899',
      role: 'Checks fair-play standing, waives first-time foul strikes, and runs Emergency Signal Rebuilds.',
      btn: '\uD83C\uDF80 Clear 1 Foul Strike & +10% Signal',
      codePrefix: 'CNDY'
    },
    {
      id: 'torty',
      icon: '\uD83D\uDC22',
      name: 'Torty',
      title: 'Tortuga Shell-Tough Firewall',
      color: '#4ade80',
      role: 'Bolts Tortuga Tech shell plates onto the antenna mast so packet storms never drop your party.',
      btn: '\uD83D\uDEE1\uFE0F Bolt Shell Armor (+20% Signal)',
      codePrefix: 'TORT'
    }
  ];

  function loadState() {
    try {
      var saved = GA.store && GA.store.get('online73.state', null);
      if (saved && typeof saved === 'object') {
        if (typeof saved.signal === 'number') S.signal = Math.max(0, Math.min(100, saved.signal));
        if (typeof saved.strikes === 'number') S.strikes = Math.max(0, saved.strikes);
        if (typeof saved.cloudShield === 'boolean') S.cloudShield = saved.cloudShield;
        if (typeof saved.piratClaimed === 'boolean') S.piratClaimed = saved.piratClaimed;
        if (typeof saved.surfersOverride === 'boolean') S.surfersOverride = saved.surfersOverride;
        if (typeof saved.autoFutureOnline === 'boolean') S.autoFutureOnline = saved.autoFutureOnline;
        if (saved.noNeedIds && typeof saved.noNeedIds === 'object') S.noNeedIds = saved.noNeedIds;
      }
    } catch (e) {}
    syncPolicyToCatalog();
  }

  function saveState() {
    try {
      if (GA.store) {
        GA.store.set('online73.state', {
          signal: S.signal,
          strikes: S.strikes,
          cloudShield: S.cloudShield,
          piratClaimed: S.piratClaimed,
          surfersOverride: S.surfersOverride,
          autoFutureOnline: S.autoFutureOnline,
          noNeedIds: S.noNeedIds
        });
      }
    } catch (e) {}
  }

  function syncPolicyToCatalog() {
    if (!GA.ONLINE_POLICY) return;
    GA.ONLINE_POLICY.surfersOverride = !!S.surfersOverride;
    GA.ONLINE_POLICY.autoFutureOnline = S.autoFutureOnline !== false;
    GA.ONLINE_POLICY.noNeedIds = S.noNeedIds || {};
    var surf = GA.MAIN_GAMES && GA.MAIN_GAMES.find(function (g) { return g.id === 'surfers'; });
    if (surf && GA.applyOnlinePolicy) {
      GA.applyOnlinePolicy(surf);
      surf.mpMode = surf.mp ? 'Endless Runner Race (2-3P Override)' : 'Solo Runner (Lizeth\u2019s Rule)';
    }
    if (GA.FUTURE_GAMES && GA.applyOnlinePolicy) {
      GA.FUTURE_GAMES.forEach(function (fg) {
        fg.noNeedMp = !!S.noNeedIds[fg.id];
        GA.applyOnlinePolicy(fg);
        fg.futureAutoMp = !!fg.mp;
      });
    }
  }

  /* ---------- 3D Pet Crew & Relay Console at Multiplayer Antenna ---------- */
  var screenCvs = null, pets3d = [];

  O3.build = function (A, ANT) {
    if (GA.Hub && GA.Hub.setAntennaBroken && S.integrity > 0) GA.Hub.setAntennaBroken(false);
    if (!A || !ANT || !ANT.p || !ANT.p.grp) return;
    var T = A.T, grp = ANT.p.grp;

    function mat(c, r, m, em, ei) {
      var o = { color: c, roughness: r != null ? r : 0.45, metalness: m || 0 };
      if (em != null) { o.emissive = em; o.emissiveIntensity = ei != null ? ei : 0.35; }
      return new T.MeshStandardMaterial(o);
    }
    function box(w, h, d, m, x, y, z, p) {
      var ms = new T.Mesh(new T.BoxGeometry(w, h, d), m);
      ms.position.set(x, y, z);
      (p || grp).add(ms);
      return ms;
    }
    function cyl(rt, rb, h, s, m, x, y, z, p) {
      var ms = new T.Mesh(new T.CylinderGeometry(rt, rb, h, s || 12), m);
      ms.position.set(x, y, z);
      (p || grp).add(ms);
      return ms;
    }
    function sph(r, m, x, y, z, p) {
      var ms = new T.Mesh(new T.SphereGeometry(r, 12, 10), m);
      ms.position.set(x, y, z);
      (p || grp).add(ms);
      return ms;
    }

    var hq = new T.Group();
    hq.name = 'onlinePlayHQ3D';
    A.noAud(hq);
    grp.add(hq);

    // Front Ratita × Tortuga Relay Console pedestal on the antenna deck
    var tealMat = mat(0x0f766e, 0.4, 0.3);
    var goldMat = mat(0xfbbf24, 0.3, 0.5, 0xf59e0b, 0.25);
    box(0.76, 0.38, 0.36, tealMat, 0, 0.55, 0.72, hq);
    box(0.80, 0.05, 0.40, goldMat, 0, 0.75, 0.72, hq);

    var c = A.mkCanvas(320, 160);
    var tex = A.canvasTex(c);
    screenCvs = { c: c, t: tex };
    var scr = new T.Mesh(
      new T.PlaneGeometry(0.68, 0.32),
      new T.MeshBasicMaterial({ map: tex })
    );
    scr.position.set(0, 0.55, 0.905);
    hq.add(scr);

    // Build all 5 Pets around the Multiplayer Antenna base
    function buildLuna() {
      var g = new T.Group();
      var white = mat(0xf8fafc, 0.5), pink = mat(0xf472b6, 0.5), dark = mat(0x0f172a, 0.4);
      sph(0.12, white, 0, 0.11, 0, g);
      sph(0.10, white, 0, 0.24, 0.04, g);
      sph(0.05, pink, -0.08, 0.32, 0.02, g);
      sph(0.05, pink, 0.08, 0.32, 0.02, g);
      cyl(0.085, 0.095, 0.055, 12, goldMat, 0, 0.34, 0.04, g);
      sph(0.018, dark, -0.036, 0.25, 0.13, g);
      sph(0.018, dark, 0.036, 0.25, 0.13, g);
      box(0.024, 0.13, 0.024, mat(0xcbd5e1, 0.25, 0.8), 0.10, 0.17, 0.07, g);
      return g;
    }
    function buildTorty() {
      var g = new T.Group();
      var green = mat(0x22c55e, 0.5), shell = mat(0x065f46, 0.4, 0.15), dark = mat(0x0f172a, 0.4);
      sph(0.14, shell, 0, 0.11, -0.02, g);
      cyl(0.145, 0.145, 0.028, 12, goldMat, 0, 0.06, -0.02, g);
      sph(0.09, green, 0, 0.17, 0.12, g);
      box(0.13, 0.042, 0.038, goldMat, 0, 0.20, 0.18, g);
      sph(0.018, dark, -0.032, 0.17, 0.19, g);
      sph(0.018, dark, 0.032, 0.17, 0.19, g);
      return g;
    }
    function buildPirat() {
      var g = new T.Group();
      var fur = mat(0x9ca3af, 0.55), hat = mat(0x111827, 0.5), red = mat(0xdc2626, 0.5);
      sph(0.11, fur, 0, 0.10, 0, g);
      sph(0.095, fur, 0, 0.22, 0.04, g);
      sph(0.045, fur, -0.075, 0.29, 0.02, g);
      sph(0.045, fur, 0.075, 0.29, 0.02, g);
      cyl(0.096, 0.096, 0.032, 12, red, 0, 0.27, 0.04, g);
      box(0.22, 0.055, 0.16, hat, 0, 0.32, 0.04, g);
      box(0.055, 0.035, 0.02, goldMat, 0, 0.32, 0.125, g);
      box(0.14, 0.09, 0.10, mat(0x78350f, 0.6), 0.16, 0.05, 0.02, g);
      return g;
    }
    function buildSnowie() {
      var g = new T.Group();
      var snow = mat(0xffffff, 0.4, 0.05, 0xe0f2fe, 0.15), scarf = mat(0x0ea5e9, 0.45), pink = mat(0xec4899, 0.4), dark = mat(0x0f172a, 0.4);
      sph(0.14, snow, 0, 0.13, 0, g);
      sph(0.115, snow, 0, 0.29, 0.04, g);
      sph(0.052, snow, -0.08, 0.37, 0.02, g);
      sph(0.052, snow, 0.08, 0.37, 0.02, g);
      cyl(0.105, 0.105, 0.04, 12, scarf, 0, 0.21, 0.03, g);
      box(0.095, 0.045, 0.035, pink, 0, 0.40, 0.04, g);
      sph(0.018, dark, -0.04, 0.30, 0.13, g);
      sph(0.018, dark, 0.04, 0.30, 0.13, g);
      return g;
    }
    function buildCandy() {
      var g = new T.Group();
      var coat = mat(0x64748b, 0.5), beard = mat(0xf8fafc, 0.45), bow = mat(0xec4899, 0.35, 0.15, 0xf472b6, 0.2), dark = mat(0x0f172a, 0.4);
      box(0.16, 0.16, 0.20, coat, 0, 0.09, 0, g);
      box(0.14, 0.13, 0.14, coat, 0, 0.22, 0.04, g);
      box(0.12, 0.08, 0.09, beard, 0, 0.19, 0.11, g);
      box(0.095, 0.04, 0.035, bow, 0, 0.30, 0.05, g);
      sph(0.018, dark, -0.035, 0.23, 0.115, g);
      sph(0.018, dark, 0.035, 0.23, 0.115, g);
      return g;
    }

    pets3d = [];
    var pLuna = buildLuna(); pLuna.position.set(-0.60, 0.36, 0.56); hq.add(pLuna);
    pets3d.push({ g: pLuna, baseY: 0.36, phase: 0.1 });

    var pTorty = buildTorty(); pTorty.position.set(0.60, 0.36, 0.56); hq.add(pTorty);
    pets3d.push({ g: pTorty, baseY: 0.36, phase: 1.3 });

    var pPirat = buildPirat(); pPirat.position.set(-0.78, 0.36, 0.06); pPirat.rotation.y = 0.4; hq.add(pPirat);
    pets3d.push({ g: pPirat, baseY: 0.36, phase: 2.5 });

    var pSnowie = buildSnowie(); pSnowie.position.set(0.78, 0.36, 0.06); pSnowie.rotation.y = -0.4; hq.add(pSnowie);
    pets3d.push({ g: pSnowie, baseY: 0.36, phase: 3.7 });

    var pCandy = buildCandy(); pCandy.position.set(0, 0.77, 0.72); hq.add(pCandy);
    pets3d.push({ g: pCandy, baseY: 0.77, phase: 4.9 });

    A.anims.push(function (t) {
      for (var i = 0; i < pets3d.length; i++) {
        var pt = pets3d[i];
        pt.g.position.y = pt.baseY + Math.abs(Math.sin(t * 2.7 + pt.phase)) * 0.03;
        pt.g.rotation.y = Math.sin(t * 1.5 + pt.phase) * 0.16;
      }
    });

    OP.refresh3D();
  };

  OP.refresh3D = function () {
    if (!screenCvs) return;
    var ctx = screenCvs.c.getContext('2d'), w = screenCvs.c.width, h = screenCvs.c.height;
    ctx.fillStyle = '#090d24';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = S.signal > 40 ? '#3ff0ff' : (S.signal > 0 ? '#fbbf24' : '#ef4444');
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 17px "Trebuchet MS", sans-serif';
    ctx.fillText('\uD83D\uDC2D RATITA \u00d7 \uD83D\uDC22 TORTUGA RELAY', w / 2, 28);

    var mpCount = GA.mpGames ? GA.mpGames().length : 40;
    var totalCount = GA.MAIN_GAMES ? GA.MAIN_GAMES.length : 41;
    ctx.fillStyle = '#3ff0ff';
    ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
    ctx.fillText(mpCount + '/' + totalCount + ' GAMES ONLINE \u00b7 #73', w / 2, 62);

    ctx.fillStyle = S.signal > 40 ? '#4ade80' : (S.signal > 0 ? '#fbbf24' : '#f87171');
    ctx.font = 'bold 19px "Trebuchet MS", sans-serif';
    ctx.fillText('SIGNAL: ' + S.signal + '% \u00b7 5 PET CREW', w / 2, 96);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
    ctx.fillText(S.surfersOverride ? 'SURFERS: ONLINE OVERRIDE!' : 'SURFERS: SOLO (LIZETH RULE)', w / 2, 130);
    screenCvs.t.needsUpdate = true;
  };

  /* ---------- Mock Pet Crew Room Builder (for 1-Click Quick-Join Crew Room) ---------- */
  function createPetCrewRoom(gameId, customCode) {
    var GN = window.GrokNet;
    var prof = GN ? GN.savedProfile() : { name: 'Player 1', color: '#3ff0ff' };
    var myPid = (GN && GN.pid) ? GN.pid() : 'me-local';
    var code = customCode || ('GRK' + ((10 + Math.floor(Math.random() * 89))));
    var g = (GA.MAIN_GAMES || []).find(function (x) { return x.id === gameId; }) || (GA.mpGames && GA.mpGames()[0]) || { id: 'brawl', name: 'Grok Brawl' };

    var handlers = {};
    var meta = { game: g.id };
    var myState = { ready: true, carry: GA.Carry ? GA.Carry.get() : null };
    var list = [
      { pid: myPid, name: prof.name || 'Lizeth', color: prof.color || '#3ff0ff', slot: 0, host: true, ready: true, ping: 12, state: myState },
      { pid: 'pet-luna', name: 'Luna \uD83D\uDC2D', color: '#f472b6', slot: 1, host: false, ready: true, ping: 16, state: { ready: true, carry: {} } },
      { pid: 'pet-torty', name: 'Torty \uD83D\uDC22', color: '#4ade80', slot: 2, host: false, ready: true, ping: 19, state: { ready: true, carry: {} } }
    ];

    var r = {
      isHost: true,
      code: code,
      pid: myPid,
      name: list[0].name,
      color: list[0].color,
      max: 3,
      ping: 18,
      opened: true,
      destroyed: false,
      navigating: false,
      _welcomed: true,
      on: function (ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); return r; },
      off: function (ev, fn) { if (handlers[ev]) handlers[ev] = handlers[ev].filter(function (f) { return f !== fn; }); return r; },
      _emit: function (ev) {
        var a = handlers[ev], args = Array.prototype.slice.call(arguments, 1);
        if (a) a.slice().forEach(function (f) { try { f.apply(null, args); } catch (e) {} });
      },
      players: function () { return list.slice(); },
      count: function () { return list.length; },
      me: function () { return list[0]; },
      player: function (pid) { return list.find(function (p) { return p.pid === pid; }) || null; },
      meta: function () { return meta; },
      setMeta: function (m) {
        for (var k in m) meta[k] = m[k];
        r._emit('meta', meta);
      },
      setState: function (s) {
        for (var k in s) myState[k] = s[k];
        list[0].ready = !!myState.ready;
        r._emit('players', list);
      },
      send: function (d) { r._emit('message', d, myPid); return true; },
      broadcast: function (d, opts) { if (opts && opts.self) r._emit('message', d, myPid); return true; },
      sendTo: function () { return true; },
      markNavigating: function () { r.navigating = true; },
      leave: function () { r.destroyed = true; }
    };
    return r;
  }

  /* ---------- Build & Wire the Online Play HQ UI inside #mp ---------- */
  function injectLobbyTabs() {
    var mpPanel = document.querySelector('#mp .mpPanel');
    var mpBody = $('mpBody');
    if (!mpPanel || !mpBody || $('opTopWrap')) return;

    // Update header title
    var titleEl = mpPanel.querySelector('.mpTitle');
    if (titleEl) {
      titleEl.innerHTML = '<span class="mpAnt" aria-hidden="true"></span>ONLINE PLAY HQ <span>#73 Room Browser &middot; Policy &middot; Pet Relay</span>';
    }

    var topWrap = document.createElement('div');
    topWrap.id = 'opTopWrap';
    topWrap.className = 'opTopWrap';
    topWrap.innerHTML =
      '<div id="opHudBar" class="opHudBar"></div>' +
      '<div class="opTabs" role="tablist" aria-label="Online Play HQ Sections">' +
        '<button type="button" class="opTab on" data-op-tab="code" id="opTabCode">\uD83D\uDCE1 HOST / JOIN</button>' +
        '<button type="button" class="opTab" data-op-tab="browser" id="opTabBrowser">\uD83C\uDF10 ROOM BROWSER</button>' +
        '<button type="button" class="opTab" data-op-tab="policy" id="opTabPolicy">\uD83D\uDCDC LIZETH\u2019S POLICY</button>' +
        '<button type="button" class="opTab" data-op-tab="pets" id="opTabPets">\uD83D\uDC3E PET RELAY &amp; SHIELD</button>' +
      '</div>';
    mpPanel.insertBefore(topWrap, mpBody);

    // Quick Pet Crew banner inside #mpS1
    var s1 = $('mpS1');
    if (s1 && !$('opQuickCrewBox')) {
      var qb = document.createElement('div');
      qb.id = 'opQuickCrewBox';
      qb.className = 'opQuickCrewBox';
      qb.innerHTML =
        '<div class="opQcText"><b>\uD83D\uDC3E Pet Crew Instant Lobby (#73):</b> Browse all <span id="opQcCount">40</span> Online Games or jump straight into a ready 3-player room with <b>Luna \uD83D\uDC2D</b> &amp; <b>Torty \uD83D\uDC22</b>!</div>' +
        '<div class="opQcBtns">' +
          '<button type="button" id="opBtnQuickCrew" class="opBtn primary">\u26A1 QUICK-JOIN PET CREW ROOM</button>' +
          '<button type="button" id="opBtnOpenBrowser" class="opBtn alt">\uD83C\uDF10 BROWSE ALL 40 GAMES</button>' +
        '</div>';
      s1.appendChild(qb);
    }

    // Create the 3 new tab sections inside #mpBody
    var secBrowser = document.createElement('section');
    secBrowser.id = 'opSecBrowser';
    secBrowser.className = 'mpSec opSec hidden';
    mpBody.appendChild(secBrowser);

    var secPolicy = document.createElement('section');
    secPolicy.id = 'opSecPolicy';
    secPolicy.className = 'mpSec opSec hidden';
    mpBody.appendChild(secPolicy);

    var secPets = document.createElement('section');
    secPets.id = 'opSecPets';
    secPets.className = 'mpSec opSec hidden';
    mpBody.appendChild(secPets);

    // Wire tab buttons
    Array.prototype.forEach.call(topWrap.querySelectorAll('.opTab'), function (btn) {
      btn.addEventListener('click', function () {
        snd('click');
        OP.setTab(btn.getAttribute('data-op-tab'));
      });
    });

    if ($('opBtnQuickCrew')) {
      $('opBtnQuickCrew').addEventListener('click', function () {
        snd('launch');
        OP.quickJoinCrew(GA.store ? GA.store.get('mp.lastGame', 'brawl') : 'brawl');
      });
    }
    if ($('opBtnOpenBrowser')) {
      $('opBtnOpenBrowser').addEventListener('click', function () {
        snd('click');
        OP.setTab('browser');
      });
    }
  }

  OP.setTab = function (tab) {
    S.activeTab = tab || 'code';
    var tabs = document.querySelectorAll('#opTopWrap .opTab');
    Array.prototype.forEach.call(tabs, function (b) {
      var on = b.getAttribute('data-op-tab') === S.activeTab;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    var isCode = S.activeTab === 'code';
    ['mpS1', 'mpS2', 'mpS3', 'mpS4', 'mpS5'].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      if (!isCode) {
        el.setAttribute('data-op-prev-hidden', el.classList.contains('hidden') ? '1' : '0');
        el.classList.add('hidden');
      }
    });
    if (isCode) {
      var dbg = GA.MP && GA.MP._debug ? GA.MP._debug() : { screen: 's1' };
      var activeScreen = 'mp' + (dbg.screen || 's1').toUpperCase();
      ['mpS1', 'mpS2', 'mpS3', 'mpS4', 'mpS5'].forEach(function (id) {
        var el = $(id);
        if (el) el.classList.toggle('hidden', id !== activeScreen);
      });
    }

    if ($('opSecBrowser')) $('opSecBrowser').classList.toggle('hidden', S.activeTab !== 'browser');
    if ($('opSecPolicy')) $('opSecPolicy').classList.toggle('hidden', S.activeTab !== 'policy');
    if ($('opSecPets')) $('opSecPets').classList.toggle('hidden', S.activeTab !== 'pets');

    renderAll();
    if ($('mpBody')) $('mpBody').scrollTop = 0;
  };

  function standingLabel() {
    if (S.signal <= 0) return { text: 'RELAY LOCKOUT (0%)', cls: 'bad' };
    if (S.signal < 45 || S.strikes >= 2) return { text: 'DEGRADED (' + S.signal + '%)', cls: 'warn' };
    return { text: 'EXEMPLARY (' + S.signal + '%)', cls: 'ok' };
  }

  function renderHudBar() {
    var bar = $('opHudBar');
    if (!bar) return;
    var mpCount = GA.mpGames ? GA.mpGames().length : 40;
    var totalCount = GA.MAIN_GAMES ? GA.MAIN_GAMES.length : 41;
    var st = standingLabel();
    var tix = GA.getTickets ? GA.getTickets() : 0;
    var futCount = (GA.FUTURE_GAMES || []).filter(function (g) { return g.mp; }).length;
    var futTotal = (GA.FUTURE_GAMES || []).length;

    bar.innerHTML =
      '<span class="opChip ' + st.cls + '" id="opSignalChip">\uD83D\uDCE1 Signal: <b>' + st.text + '</b></span>' +
      '<span class="opChip info" id="opCountChip">\uD83D\uDFE2 Online Games: <b>' + mpCount + '/' + totalCount + '</b></span>' +
      '<span class="opChip info">\uD83D\uDE80 Future Auto-MP: <b>' + (S.autoFutureOnline ? 'ON (' + futCount + '/' + futTotal + ')' : 'MANUAL') + '</b></span>' +
      '<span class="opChip tix">\uD83C\uDF9F\uFE0F Tickets: <b id="opTixVal">' + tix + '</b></span>';

    if ($('opTabBrowser')) {
      $('opTabBrowser').textContent = '\uD83C\uDF10 ROOM BROWSER (' + mpCount + ')';
    }
    if ($('opQcCount')) {
      $('opQcCount').textContent = String(mpCount);
    }
  }

  function roomCodeForGame(g, idx) {
    var clean = g.id.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return (clean + '73924').slice(0, 5);
  }

  function renderBrowser() {
    var wrap = $('opSecBrowser');
    if (!wrap) return;
    var mpList = GA.mpGames ? GA.mpGames() : [];
    var new73Count = mpList.filter(function (g) { return g.newlyOnline73; }).length;

    var filtered = mpList.filter(function (g) {
      if (S.filter === 'new73' && !g.newlyOnline73) return false;
      if (S.search) {
        var q = S.search.toLowerCase();
        var hay = (g.name + ' ' + (g.mpMode || '') + ' ' + g.desc).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });

    if (S.focusGame) {
      filtered.sort(function (a, b) {
        if (a.id === S.focusGame) return -1;
        if (b.id === S.focusGame) return 1;
        return 0;
      });
    }

    var lockBanner = '';
    if (S.signal <= 0) {
      lockBanner =
        '<div class="opLockAlert">' +
          '<b>\uD83D\uDEA8 RELAY SIGNAL AT 0% (PACKET LOCKOUT):</b> Disconnecting/fouling dropped your relay signal to 0%! ' +
          '<button type="button" class="opBtn emergency" id="opBrowserEmergencyBtn">\uD83D\uDE91 FREE PET CREW SIGNAL REBUILD (0 \uD83C\uDF9F\uFE0F)</button>' +
        '</div>';
    }

    var h =
      lockBanner +
      '<div class="opBrowserControls">' +
        '<div class="opFilters">' +
          '<button type="button" class="opFilt' + (S.filter === 'all' ? ' on' : '') + '" data-filt="all">All Online (' + mpList.length + ')</button>' +
          '<button type="button" class="opFilt' + (S.filter === 'new73' ? ' on' : '') + '" data-filt="new73">\u2728 Newly Online #73 (' + new73Count + ')</button>' +
        '</div>' +
        '<input type="search" id="opSearchInput" class="opSearch" placeholder="Search 40 online games or modes\u2026" value="' + esc(S.search) + '">' +
      '</div>' +
      '<div class="opRoomGrid">';

    filtered.forEach(function (g, idx) {
      var pet = PET_CREW[idx % PET_CREW.length];
      var code = roomCodeForGame(g, idx);
      var ping = 14 + ((idx * 5) % 24);
      var focused = S.focusGame === g.id;
      h +=
        '<div class="opRoomCard' + (focused ? ' focused' : '') + '" style="--c:' + esc(g.color || '#3ff0ff') + '" data-room-game="' + esc(g.id) + '">' +
          '<div class="opRcTop">' +
            '<span class="opRcBadge ' + (g.newlyOnline73 ? 'new73' : 'live') + '">' + (g.newlyOnline73 ? '\u2728 NEW ONLINE #73' : '\uD83D\uDFE2 LIVE ONLINE') + '</span>' +
            '<span class="opRcCode">CODE: <b>' + code + '</b> &middot; ' + ping + 'ms</span>' +
          '</div>' +
          '<div class="opRcName">' + esc(g.name) + '</div>' +
          '<div class="opRcMode">' + esc(g.mpMode || '2-3P Online Multiplayer') + ' &middot; Host: <b>' + pet.icon + ' ' + pet.name + '</b> (2/3)</div>' +
          '<div class="opRcBtns">' +
            '<button type="button" class="opBtn primary opQuickJoinBtn" data-gid="' + esc(g.id) + '" data-code="' + code + '">\u26A1 QUICK JOIN CREW</button>' +
            '<button type="button" class="opBtn alt opSelectHostBtn" data-gid="' + esc(g.id) + '">\uD83D\uDCE1 PICK FOR ROOM</button>' +
          '</div>' +
        '</div>';
    });
    h += '</div>';
    wrap.innerHTML = h;

    Array.prototype.forEach.call(wrap.querySelectorAll('.opFilt'), function (b) {
      b.addEventListener('click', function () {
        snd('click');
        S.filter = b.getAttribute('data-filt');
        renderBrowser();
      });
    });

    var inp = $('opSearchInput');
    if (inp) {
      inp.addEventListener('input', function () {
        S.search = inp.value;
        renderBrowser();
        var ni = $('opSearchInput');
        if (ni) { ni.focus(); ni.setSelectionRange(ni.value.length, ni.value.length); }
      });
    }

    if ($('opBrowserEmergencyBtn')) {
      $('opBrowserEmergencyBtn').addEventListener('click', function () {
        OP.emergencyRebuild();
      });
    }

    Array.prototype.forEach.call(wrap.querySelectorAll('.opQuickJoinBtn'), function (b) {
      b.addEventListener('click', function () {
        var gid = b.getAttribute('data-gid');
        var code = b.getAttribute('data-code');
        OP.quickJoinCrew(gid, code);
      });
    });

    Array.prototype.forEach.call(wrap.querySelectorAll('.opSelectHostBtn'), function (b) {
      b.addEventListener('click', function () {
        var gid = b.getAttribute('data-gid');
        if (GA.store) GA.store.set('mp.lastGame', gid);
        OP.quickJoinCrew(gid);
      });
    });
  }

  function renderPolicy() {
    var wrap = $('opSecPolicy');
    if (!wrap) return;
    var surf = (GA.MAIN_GAMES || []).find(function (g) { return g.id === 'surfers'; });
    var surfOnline = !!(surf && surf.mp);
    var mpCount = GA.mpGames ? GA.mpGames().length : 40;
    var totalCount = GA.MAIN_GAMES ? GA.MAIN_GAMES.length : 41;

    var newly73 = (GA.MAIN_GAMES || []).filter(function (g) { return g.newlyOnline73; });

    var h =
      '<div class="opPolicyBox">' +
        '<div class="opPolHeader">' +
          '<span class="opPolTag">ISSUE #73 &middot; RULE 1</span>' +
          '<h3>All Main Games Online Except Grok Surfers (Unless Lizeth Says Otherwise!)</h3>' +
        '</div>' +
        '<p class="opPolDesc">Per Lizeth\u2019s decree: <b>' + mpCount + ' of ' + totalCount + ' Main Games</b> have online multiplayer enabled right now, including all 7 newly upgraded solo titles (' + newly73.map(function (g) { return '<b>' + esc(g.name) + '</b>'; }).join(', ') + '). <b>Grok Surfers</b> stays Solo-Only unless Lizeth toggles the override below!</p>' +
        '<div class="opSurfersCard ' + (surfOnline ? 'overrideOn' : 'soloLock') + '">' +
          '<div class="opSurfInfo">' +
            '<div class="opSurfTitle">\uD83C\uDFC4 Grok Surfers &mdash; <span id="opSurfersStatusText">' + (surfOnline ? '\uD83D\uDFE2 ONLINE OVERRIDE ACTIVE (Lizeth Said Otherwise!)' : '\uD83D\uDD12 SOLO-ONLY BY LIZETH\u2019S RULE') + '</span></div>' +
            '<div class="opSurfSub">' + (surfOnline ? 'Grok Surfers is currently included in the Online Room Browser (41/41 games online)!' : 'Default rule active: 40/41 Main Games online; Grok Surfers is solo endless runner.') + '</div>' +
          '</div>' +
          '<button type="button" id="opToggleSurfers" class="opBtn ' + (surfOnline ? 'alt' : 'primary') + '">' +
            (surfOnline ? '\uD83D\uDD12 Restore Solo-Only Rule' : '\uD83C\uDFC4\u200D\u2640\uFE0F Lizeth Says Otherwise: Enable Surfers Online!') +
          '</button>' +
        '</div>' +
      '</div>' +

      '<div class="opPolicyBox">' +
        '<div class="opPolHeader">' +
          '<span class="opPolTag">ISSUE #73 &middot; RULE 2</span>' +
          '<h3>Future Games Auto-Online Registry (&ldquo;Unless I Say No Need!&rdquo;)</h3>' +
        '</div>' +
        '<p class="opPolDesc">Every future Grok Arcade game registered via <code>GA.registerFutureGame()</code> automatically receives <b>Online Multiplayer (<code>mp: true</code>)</b> by default unless Lizeth clicks <b>&ldquo;No Need&rdquo;</b> for that game!</p>' +
        '<div class="opPolMasterRow">' +
          '<span><b>Default Policy for All New Future Games:</b> <span class="opBadgeOk">' + (S.autoFutureOnline ? '\u2705 AUTO-ONLINE ENABLED' : '\u26A0\uFE0F MANUAL ONLY') + '</span></span>' +
          '<button type="button" id="opToggleAutoFuture" class="opBtn alt">' + (S.autoFutureOnline ? 'Switch Default to Manual' : 'Enable Default Auto-Online') + '</button>' +
        '</div>' +
        '<div class="opFutureGrid">';

    (GA.FUTURE_GAMES || []).forEach(function (fg) {
      var isNoNeed = !!S.noNeedIds[fg.id];
      var isOnline = !!fg.mp;
      h +=
        '<div class="opFutCard ' + (isOnline ? 'futOn' : 'futOff') + '" data-future-card="' + esc(fg.id) + '">' +
          '<div class="opFutTop">' +
            '<span class="opFutIssue">Issue #' + fg.issue + '</span>' +
            '<span class="opFutState ' + (isOnline ? 'on' : 'off') + '">' + (isOnline ? '\uD83D\uDFE2 AUTO-ONLINE' : '\uD83D\uDEAB NO NEED (SOLO)') + '</span>' +
          '</div>' +
          '<div class="opFutName">' + esc(fg.name) + '</div>' +
          '<div class="opFutMode">' + esc(fg.mpMode) + '</div>' +
          '<button type="button" class="opBtn small opToggleFutureBtn ' + (isNoNeed ? 'primary' : 'alt') + '" data-fid="' + esc(fg.id) + '">' +
            (isNoNeed ? '\u2705 Re-Enable Auto-Online' : '\uD83D\uDEAB Lizeth Says "No Need"') +
          '</button>' +
        '</div>';
    });

    h += '</div></div>';
    wrap.innerHTML = h;

    var surfBtn = $('opToggleSurfers');
    if (surfBtn) {
      surfBtn.addEventListener('click', function () {
        snd('powerup');
        S.surfersOverride = !S.surfersOverride;
        syncPolicyToCatalog();
        saveState();
        refreshQuickMenuBadges();
        OP.refresh3D();
        renderAll();
      });
    }

    var autoBtn = $('opToggleAutoFuture');
    if (autoBtn) {
      autoBtn.addEventListener('click', function () {
        snd('click');
        S.autoFutureOnline = !S.autoFutureOnline;
        syncPolicyToCatalog();
        saveState();
        renderAll();
      });
    }

    Array.prototype.forEach.call(wrap.querySelectorAll('.opToggleFutureBtn'), function (b) {
      b.addEventListener('click', function () {
        snd('click');
        var fid = b.getAttribute('data-fid');
        if (S.noNeedIds[fid]) delete S.noNeedIds[fid];
        else S.noNeedIds[fid] = true;
        syncPolicyToCatalog();
        saveState();
        renderAll();
      });
    });
  }

  function renderPets() {
    var wrap = $('opSecPets');
    if (!wrap) return;
    var st = standingLabel();
    var tix = GA.getTickets ? GA.getTickets() : 0;

    var h =
      '<div class="opConseqBox">' +
        '<div class="opConseqTop">' +
          '<div>' +
            '<div class="opPolTag">RATITA \u00d7 TORTUGA RELAY INTEGRITY &amp; FAIR PLAY</div>' +
            '<h3>\uD83D\uDCE1 Signal Integrity: <span id="opSignalPct">' + S.signal + '%</span> &middot; Standing: <span class="opStandTxt ' + st.cls + '">' + st.text + '</span></h3>' +
          '</div>' +
          '<div class="opStrikesBadge">Foul Strikes: <b id="opStrikesCount">' + S.strikes + '/3</b> &middot; Cloud Shield: <b id="opShieldState">' + (S.cloudShield ? '\u2601\uFE0F ARMED' : 'OFF') + '</b></div>' +
        '</div>' +
        '<div class="opMeterBar"><div class="opMeterFill ' + st.cls + '" style="width:' + S.signal + '%"></div></div>' +
        '<div class="opEventBanner" id="opEventBanner">' + esc(S.lastEvent) + '</div>' +
        '<div class="opConseqActions">' +
          '<button type="button" id="opSimDisconnect" class="opBtn warn">\u26A0\uFE0F Rage-Quit / Disconnect (-35% Signal &middot; -15 \uD83C\uDF9F\uFE0F Bail)</button>' +
          '<button type="button" id="opSimFoul" class="opBtn warn">\u26A1 Relay Packet Foul (-25% Signal &middot; -10 \uD83C\uDF9F\uFE0F Fee)</button>' +
          '<button type="button" id="opPaidTune" class="opBtn alt"' + (S.signal >= 100 || tix < 15 ? ' disabled' : '') + '>\uD83D\uDD27 Pit Relay Tune-Up (+50% Signal &middot; -15 \uD83C\uDF9F\uFE0F)</button>' +
          '<button type="button" id="opEmergencyRebuild" class="opBtn emergency">\uD83D\uDE91 CANDY &amp; TORTY\u2019S FREE EMERGENCY SIGNAL REBUILD (0 \uD83C\uDF9F\uFE0F &mdash; NEVER STUCK!)</button>' +
        '</div>' +
      '</div>' +

      '<div class="opPetGrid">';

    PET_CREW.forEach(function (p) {
      h +=
        '<div class="opPetCard" style="--c:' + p.color + '" data-pet-id="' + p.id + '">' +
          '<div class="opPetHead">' +
            '<span class="opPetIcon">' + p.icon + '</span>' +
            '<div><div class="opPetName">' + esc(p.name) + '</div><div class="opPetTitle">' + esc(p.title) + '</div></div>' +
          '</div>' +
          '<p class="opPetRole">' + esc(p.role) + '</p>' +
          '<button type="button" class="opBtn primary small opPetActBtn" data-pet="' + p.id + '">' + esc(p.btn) + '</button>' +
        '</div>';
    });

    h += '</div>';
    wrap.innerHTML = h;

    if ($('opSimDisconnect')) {
      $('opSimDisconnect').addEventListener('click', function () {
        OP.applyPenalty('disconnect');
      });
    }
    if ($('opSimFoul')) {
      $('opSimFoul').addEventListener('click', function () {
        OP.applyPenalty('foul');
      });
    }
    if ($('opPaidTune')) {
      $('opPaidTune').addEventListener('click', function () {
        if (!GA.spendTickets || !GA.spendTickets(15)) {
          S.lastEvent = 'Not enough tickets for paid tune-up \u2014 use Candy & Torty\u2019s FREE Emergency Signal Rebuild!';
          renderAll();
          return;
        }
        snd('powerup');
        S.signal = Math.min(100, S.signal + 50);
        S.strikes = Math.max(0, S.strikes - 1);
        S.lastEvent = 'Luna & Torty tuned the relay! +50% Signal Integrity (-15 \uD83C\uDF9F\uFE0F).';
        saveState();
        OP.refresh3D();
        renderAll();
      });
    }
    if ($('opEmergencyRebuild')) {
      $('opEmergencyRebuild').addEventListener('click', function () {
        OP.emergencyRebuild();
      });
    }

    Array.prototype.forEach.call(wrap.querySelectorAll('.opPetActBtn'), function (b) {
      b.addEventListener('click', function () {
        OP.petAction(b.getAttribute('data-pet'));
      });
    });
  }

  OP.applyPenalty = function (kind) {
    if (S.cloudShield && kind === 'disconnect') {
      snd('near');
      S.cloudShield = false;
      S.signal = Math.max(0, S.signal - 10);
      S.lastEvent = '\u2601\uFE0F Snowie\u2019s Cloud Shield softened the disconnect! Only -10% Signal and 0 ticket fee.';
      saveState();
      OP.refresh3D();
      renderAll();
      return;
    }
    snd('buzz');
    var sigLoss = kind === 'disconnect' ? 35 : 25;
    var fee = kind === 'disconnect' ? 15 : 10;
    S.signal = Math.max(0, S.signal - sigLoss);
    S.strikes = Math.min(3, S.strikes + 1);

    var curTix = GA.getTickets ? GA.getTickets() : 0;
    var paid = Math.min(curTix, fee);
    if (paid > 0 && GA.spendTickets) {
      GA.spendTickets(paid);
    } else if (paid > 0 && GA.addTickets) {
      GA.addTickets(-paid);
    }

    if (S.signal <= 0) {
      S.lastEvent = '\uD83D\uDEA8 RELAY LOCKOUT (0% Signal)! Fair-Play Bail charged (-' + paid + ' \uD83C\uDF9F\uFE0F). Click Candy & Torty\u2019s FREE Emergency Signal Rebuild so you\u2019re never stuck!';
    } else {
      S.lastEvent = '\u26A0\uFE0F ' + (kind === 'disconnect' ? 'Rage-quit disconnect' : 'Relay packet foul') + '! -' + sigLoss + '% Signal Integrity & -' + paid + ' \uD83C\uDF9F\uFE0F Fair-Play fee (Strike ' + S.strikes + '/3).';
    }
    saveState();
    OP.refresh3D();
    renderAll();
  };

  OP.emergencyRebuild = function () {
    snd('powerup');
    S.signal = 100;
    S.strikes = 0;
    S.cloudShield = true;
    var bonusMsg = '';
    if (GA.getTickets && GA.getTickets() < 10 && GA.addTickets) {
      GA.addTickets(10);
      bonusMsg = ' + 10 \uD83C\uDF9F\uFE0F Emergency Starter Bail';
    }
    S.lastEvent = '\uD83D\uDE91 Candy & Torty completed a FREE Emergency Signal Rebuild! Signal restored to 100%, strikes cleared, Cloud Shield armed' + bonusMsg + ' \u2014 you\u2019re never stuck!';
    saveState();
    OP.refresh3D();
    renderAll();
  };

  OP.petAction = function (petId) {
    snd('powerup');
    if (petId === 'luna') {
      S.signal = Math.min(100, S.signal + 15);
      S.lastEvent = '\uD83D\uDC2D Luna tuned the Ratita packet router! Signal Integrity +15% (now ' + S.signal + '%).';
    } else if (petId === 'pirat') {
      var vipCode = 'PRAT' + ((1 + Math.floor(Math.random() * 9)));
      if (!S.piratClaimed && GA.addTickets) {
        S.piratClaimed = true;
        GA.addTickets(5);
        S.lastEvent = '\uD83C\uDFF4\u200D\u2620\uFE0F Pi-rat rolled VIP Party Code ' + vipCode + ' and tossed you +5 \uD83C\uDF9F\uFE0F Bonus Tickets!';
      } else {
        S.lastEvent = '\uD83C\uDFF4\u200D\u2620\uFE0F Pi-rat rolled fresh VIP Party Code ' + vipCode + ' for your next crew match!';
      }
    } else if (petId === 'snowie') {
      S.cloudShield = true;
      S.signal = Math.min(100, S.signal + 10);
      S.lastEvent = '\uD83D\uDC36 Snowie armed the Weatherproof Cloud Shield and boosted Signal +10%!';
    } else if (petId === 'candy') {
      S.strikes = Math.max(0, S.strikes - 1);
      S.signal = Math.min(100, S.signal + 10);
      S.lastEvent = '\uD83D\uDC15 Candy cleared 1 Fair-Play Foul Strike and boosted Signal Integrity to ' + S.signal + '%!';
    } else if (petId === 'torty') {
      S.signal = Math.min(100, S.signal + 20);
      S.lastEvent = '\uD83D\uDC22 Torty bolted Tortuga Shell-Plate Armor onto the relay! Signal Integrity +20% (now ' + S.signal + '%).';
    }
    saveState();
    OP.refresh3D();
    renderAll();
  };

  OP.quickJoinCrew = function (gameId, customCode) {
    if (S.signal <= 0) {
      // Never-stuck guarantee: auto-rebuild if they try to quick-join at 0% signal!
      OP.emergencyRebuild();
    }
    var g = (GA.mpGames ? GA.mpGames() : []).find(function (x) { return x.id === gameId; }) || (GA.mpGames ? GA.mpGames()[0] : null);
    if (!g) return;
    if (GA.store) GA.store.set('mp.lastGame', g.id);

    if (!GA.MP.isOpen()) GA.MP.open();
    var mock = createPetCrewRoom(g.id, customCode);
    if (GA.MP && GA.MP.attachMockRoom) {
      GA.MP.attachMockRoom(mock);
      mock._emit('open');
    }
    OP.setTab('code');
  };

  OP.openForGame = function (gameId) {
    S.focusGame = gameId || null;
    if (!GA.MP.isOpen()) GA.MP.open();
    if (gameId === 'surfers' && !S.surfersOverride) {
      OP.setTab('policy');
    } else {
      OP.setTab('browser');
    }
  };

  function refreshQuickMenuBadges() {
    var surfCard = document.querySelector('#gridMain .card[data-game="surfers"]');
    if (!surfCard) return;
    var badge = surfCard.querySelector('.cMpBadge');
    if (badge) {
      if (S.surfersOverride) {
        badge.className = 'cMpBadge online';
        badge.textContent = '\uD83D\uDFE2 ONLINE MULTIPLAYER \u00b7 Endless Runner Race (Lizeth Override!)';
      } else {
        badge.className = 'cMpBadge soloRule';
        badge.textContent = '\uD83C\uDFC4 SOLO ONLY \u00b7 Lizeth\u2019s Rule';
      }
    }
  }

  function renderAll() {
    renderHudBar();
    renderBrowser();
    renderPolicy();
    renderPets();
  }

  OP.init = function () {
    loadState();
    injectLobbyTabs();
    renderAll();

    // Keep HUD bar refreshed whenever MP opens
    var origOpen = GA.MP && GA.MP.open;
    if (origOpen && !GA.MP._opWrapped) {
      GA.MP._opWrapped = true;
      GA.MP.open = function () {
        origOpen.apply(GA.MP, arguments);
        injectLobbyTabs();
        OP.setTab(S.activeTab || 'code');
      };
    }
  };

  OP._debug = function () {
    return {
      signal: S.signal,
      strikes: S.strikes,
      cloudShield: S.cloudShield,
      surfersOverride: S.surfersOverride,
      autoFutureOnline: S.autoFutureOnline,
      mpGamesCount: GA.mpGames ? GA.mpGames().length : 0,
      mainGamesCount: GA.MAIN_GAMES ? GA.MAIN_GAMES.length : 0,
      futureGamesCount: GA.FUTURE_GAMES ? GA.FUTURE_GAMES.length : 0,
      petsCount: PET_CREW.length,
      pets3dCount: pets3d.length
    };
  };
})();
