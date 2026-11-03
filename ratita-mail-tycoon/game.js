/* Ratita Mail Tycoon (#91 PREVIEW) - Postmaster Pi-rat builds the Mailville mail empire, station by station.
   Saves: localStorage getItem/setItem only (live save key ratitaMailTycoon.save.v1). */
(function () {
  'use strict';
  var SAVE = 'ratitaMailTycoon.save.v1';
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { n = Math.round(n); return (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US'); };
  // ---------- data ----------
  var STATIONS = [
    { id: 'center', name: 'Mailville Center', cost: 0, col: '#dc2626' },
    { id: 'cheddar', name: 'Cheddar Heights', cost: 2500, col: '#f59e0b' },
    { id: 'whisker', name: 'Whisker Woods', cost: 6000, col: '#16a34a' },
    { id: 'squeaky', name: 'Squeaky Springs', cost: 11000, col: '#0ea5e9' },
    { id: 'burrow', name: 'Burrow Bay', cost: 18000, col: '#8b5cf6' }
  ];
  var BLD = {
    shop: { name: 'Main Mail Shop', icon: '\uD83C\uDFE4', base: 400, rent: 18, max: 5, col: '#dc2626', desc: 'Brings in customers. More mail every hour.' },
    sort: { name: 'Sorting Facility', icon: '\uD83C\uDFED', base: 600, rent: 26, max: 5, col: '#2563eb', desc: 'Sorts mail. Too little sorting = backlog = bad deliveries!' },
    same: { name: 'Same-Day Place', icon: '\u26A1', base: 700, rent: 24, max: 5, col: '#ef4444', desc: 'Delivers rush parcels. Pays the most.' },
    two: { name: '2-Day Place', icon: '\uD83D\uDCE6', base: 450, rent: 16, max: 5, col: '#3b82f6', desc: 'Delivers regular parcels.' },
    letters: { name: 'Letters & Media', icon: '\u2709\uFE0F', base: 900, rent: 0, max: 2, col: '#facc15', desc: 'Letters, magazines and DVDs. The big store is EXPENSIVE to rent \u2013 downsize to the kiosk if money is tight.' }
  };
  var LET_SIZE = ['Closed', 'Small Kiosk', 'Big Media Store'], LET_RENT = [0, 45, 190], LET_CAP = [0, 6, 16];
  var GANG = [
    { id: 'liz', name: 'Liz', who: 'Ringleader guinea pig \u00b7 Luna\u2019s rival', col: '#f5f5f4', col2: '#b45309', kind: 'pig' },
    { id: 'squeak', name: 'Squeak', who: 'Bling guinea pig \u00b7 Pi-rat\u2019s rival', col: '#92400e', col2: '#fbbf24', kind: 'pig', bling: true },
    { id: 'storm', name: 'Storm', who: 'Storm-grey guinea pig \u00b7 Snowie\u2019s rival', col: '#4b5563', col2: '#e5e7eb', kind: 'pig' },
    { id: 'meemee', name: 'Meemee', who: 'The cat \u00b7 Candy\u2019s rival', col: '#f97316', col2: '#fff7ed', kind: 'cat' },
    { id: 'lizardo', name: 'Lizardo', who: 'The lizard \u00b7 Torty\u2019s rival', col: '#65a30d', col2: '#facc15', kind: 'lizard' }
  ];
  var S = null; // game state
  function blank(mode) {
    var st = STATIONS.map(function (d, i) { return { id: d.id, own: i === 0 ? 'me' : 'none', rep: 60, gang: -1, b: { shop: 0, sort: 0, same: 0, two: 0, letters: 0 }, box: 4, trucks: 1, backlog: 0, good: 0, bad: 0 }; });
    var s = { v: 1, mode: mode, money: 1500, day: 1, hour: 8, sel: 0, tab: 'build', fundDay: 0, stats: { good: 0, bad: 0, fines: 0, earned: 0 }, log: [], st: st, nextRaid: 3 };
    if (mode === 'scratch') { st[0].b.shop = 1; st[0].b.sort = 1; st[0].b.two = 1; }
    else { s.money = 22000; s.day = 1; st.forEach(function (x, i) { x.own = i === 4 ? 'gang' : 'me'; x.gang = i === 4 ? 0 : -1; x.rep = i === 4 ? 20 : 70; x.b = { shop: 3, sort: 3, same: 2, two: 3, letters: i === 0 ? 2 : 1 }; x.box = 10; x.trucks = 3; }); }
    return s;
  }
  function load() { try { var j = localStorage.getItem(SAVE); if (j) { var o = JSON.parse(j); if (o && o.v === 1 && o.st) return o; } } catch (e) {} return null; }
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) {} }
  function log(t, cls) { S.log.unshift([t, cls || '']); S.log.length = Math.min(S.log.length, 7); drawLog(); }
  function upCost(k, lvl) { return Math.round(BLD[k].base * Math.pow(lvl + 1, 1.6) / 10) * 10; }
  function rentOf(x) { var r = 0; ['shop', 'sort', 'same', 'two'].forEach(function (k) { r += BLD[k].rent * x.b[k]; }); return r + LET_RENT[x.b.letters] + x.trucks * 10; }
  function broke() { return S.money < 0; }
  // ---------- simulation (1 tick = 1 game hour) ----------
  function tick() {
    if (!S || paused) return;
    S.hour++;
    var inc = 0;
    S.st.forEach(function (x, i) {
      if (x.own !== 'me') return;
      var made = x.box * 1.2 + x.b.shop * 5 + (x.b.shop ? 2 : 0);
      x.backlog += made;
      var sortCap = 3 + x.b.sort * 9;
      var sorted = Math.min(x.backlog, sortCap); x.backlog -= sorted;
      var same = Math.min(sorted * 0.3, x.b.same * 4), two = Math.min(sorted * 0.45, x.b.two * 6 + (x.trucks - 1) * 2), lt = Math.min(sorted * 0.25, LET_CAP[x.b.letters]);
      var left = sorted - same - two - lt; x.backlog += Math.max(0, left) * 0.6;
      var pay = same * 9 + two * 4 + lt * 3;
      // bad deliveries: an overflowing backlog or a tiny sorting team mixes up parcels
      var badCh = 0.02 + (x.b.sort === 0 ? 0.05 : 0) + Math.max(0, x.backlog - 25) / 300;
      var bad = 0; for (var n = 0; n < 3; n++) if (Math.random() < badCh) bad++;
      if (bad) { var fine = bad * (20 + 5 * x.b.same); inc -= fine; x.bad += bad; S.stats.bad += bad; S.stats.fines += fine; x.rep = Math.max(0, x.rep - bad * 3);
        log('\u274C ' + bad + ' bad deliver' + (bad > 1 ? 'ies' : 'y') + ' in ' + STATIONS[i].name + ' (' + (x.backlog > 25 ? 'backlog pile-up' : 'mixed-up stamps') + '): \u2212' + fmt(fine) + ' refunds', 'bad'); }
      else x.rep = Math.min(100, x.rep + 0.4);
      x.good += same + two + lt; S.stats.good += same + two + lt;
      inc += pay; x.backlog = Math.min(x.backlog, 120);
    });
    S.money += inc; if (inc > 0) S.stats.earned += inc;
    if (S.hour >= 20) newDay();
    drawHud(); if (S.hour % 3 === 0) drawPanel();
  }
  function newDay() {
    S.hour = 8; S.day++;
    var rent = 0; S.st.forEach(function (x) { if (x.own === 'me') rent += rentOf(x); });
    S.money -= rent; log('\uD83C\uDF19 Day ' + (S.day - 1) + ' done. Paid ' + fmt(rent) + ' rent.', rent > 0 ? '' : 'good');
    if (S.day >= S.nextRaid) raid();
    if (broke()) log('\uD83D\uDCB8 Out of money! Building is frozen until you use Pi-rat\u2019s free Emergency Stamp Fund.', 'bad');
    save(); drawPanel(); refreshWorld();
  }
  function raid() {
    S.nextRaid = S.day + 2 + Math.floor(Math.random() * 3);
    var mine = S.st.map(function (x, i) { return i; }).filter(function (i) { return S.st[i].own === 'me'; });
    if (mine.length < 2 && S.mode === 'scratch' && S.day < 6) { log('\uD83D\uDC39 The Guinea Pig Gang is watching Mailville\u2026', 'gang'); return; }
    var i = mine.sort(function (a, b) { return S.st[a].rep - S.st[b].rep; })[0]; if (i === undefined) return;
    var x = S.st[i], g = Math.floor(Math.random() * GANG.length);
    if (x.rep < 55) { x.own = 'gang'; x.gang = g; log('\uD83D\uDC39 ' + GANG[g].name + ' and the Guinea Pig Gang took over ' + STATIONS[i].name + '! Win it back with a Mail Race.', 'gang'); }
    else { x.rep -= 12; log('\uD83D\uDC39 ' + GANG[g].name + ' tried to steal ' + STATIONS[i].name + ' but the customers stayed loyal (rep \u221212).', 'gang'); }
    refreshWorld();
  }
  // ---------- actions ----------
  function act(a, k) {
    var x = S.st[S.sel];
    if (a === 'up') { if (broke()) return; var c = upCost(k, x.b[k]); if (S.money < c || x.b[k] >= BLD[k].max) return; S.money -= c; x.b[k]++; log('\uD83D\uDD28 ' + (x.b[k] === 1 ? 'Built ' : 'Upgraded ') + BLD[k].name + (k === 'letters' ? ' (' + LET_SIZE[x.b[k]] + ')' : ' to Lv ' + x.b[k]) + ' in ' + STATIONS[S.sel].name, 'good'); }
    if (a === 'down') { if (x.b.letters > 0) { x.b.letters--; log('\u2B07\uFE0F Downsized Letters & Media to ' + LET_SIZE[x.b.letters] + ' (rent now ' + fmt(LET_RENT[x.b.letters]) + '/day)'); } }
    if (a === 'box') { if (broke()) return; var cb = 60 + x.box * 15; if (S.money < cb || x.box >= 16) return; S.money -= cb; x.box++; log('\uD83D\uDCEE New mailbox in ' + STATIONS[S.sel].name + ' (' + x.box + ' total)', 'good'); }
    if (a === 'truck') { if (broke()) return; var ct = 500 * x.trucks; if (S.money < ct || x.trucks >= 5) return; S.money -= ct; x.trucks++; log('\uD83D\uDE9A New mail truck for ' + STATIONS[S.sel].name, 'good'); }
    if (a === 'buy') { var cs = STATIONS[S.sel].cost; if (broke() || S.money < cs || x.own !== 'none') return; S.money -= cs; x.own = 'me'; x.b.shop = 1; x.b.sort = 1; x.rep = 60; log('\uD83C\uDF89 Opened a new station: ' + STATIONS[S.sel].name + '!', 'good'); }
    if (a === 'fund') { if (!broke() || S.fundDay === S.day) return; S.money = 400; S.fundDay = S.day; S.st.forEach(function (y) { y.backlog = Math.min(y.backlog, 10); }); log('\uD83D\uDC00 Pi-rat\u2019s Emergency Stamp Fund (FREE): debt cleared, $400 to restart, backlog swept up!', 'good'); }
    if (a === 'race') { startRace(); return; }
    if (a === 'sel') { S.sel = k; focus(k); }
    if (a === 'tab') S.tab = k;
    save(); drawHud(); drawPanel(); refreshWorld();
  }
  // ---------- UI ----------
  function drawHud() {
    var own = S.st.filter(function (x) { return x.own === 'me'; }).length;
    $('hud').innerHTML = '<span class="pill">\uD83D\uDC00 Ratita Mail Tycoon</span><span class="pill ' + (broke() ? 'r' : 'g') + '">' + fmt(S.money) + '</span><span class="pill b">Day ' + S.day + ' \u00b7 ' + (S.hour > 12 ? S.hour - 12 + ' PM' : S.hour + (S.hour === 12 ? ' PM' : ' AM')) + '</span><span class="pill">\uD83C\uDFE4 ' + own + '/5 stations</span><span class="pill">\u2705 ' + Math.round(S.stats.good) + ' \u00b7 \u274C ' + S.stats.bad + '</span>' +
      '<button class="pill" id="menuB" style="cursor:pointer;color:#fff">\u2630 Menu</button>';
    $('menuB').onclick = function () { menu(); };
  }
  function drawPanel() {
    var i = S.sel, x = S.st[i], d = STATIONS[i], h = '';
    h += '<div class="tabs">' + STATIONS.map(function (q, j) { var o = S.st[j].own; return '<button class="tab' + (j === i ? ' on' : '') + '" data-a="sel" data-k="' + j + '">' + (o === 'gang' ? '\uD83D\uDC39 ' : o === 'none' ? '\uD83D\uDD12 ' : '') + q.name + '</button>'; }).join('') + '</div>';
    h += '<h2>' + d.name + '</h2>';
    if (broke()) h += '<div class="row" style="border:2px solid #ef4444"><div><b>\uD83D\uDCB8 You\u2019re out of money!</b><small>Bad deliveries cost refunds. Building is frozen.' + (S.fundDay === S.day ? ' The fund is used for today \u2013 it refills tomorrow.' : '') + '</small></div><button class="btn g" data-a="fund"' + (S.fundDay === S.day ? ' disabled' : '') + '>Free Stamp Fund</button></div>';
    if (x.own === 'none') {
      h += '<p>An empty lot with a FOR SALE sign. Open a new mail station here to grow Mailville.</p><div class="row"><div><b>Open ' + d.name + '</b><small>Starts with a Main Mail Shop + Sorting Lv 1</small></div><button class="btn y" data-a="buy"' + (S.money < d.cost || broke() ? ' disabled' : '') + '>' + fmt(d.cost) + '</button></div>';
    } else if (x.own === 'gang') {
      var g = GANG[x.gang];
      h += '<div class="row" style="border:2px solid #a855f7"><div><b>\uD83D\uDC39 ' + g.name + ' runs this station!</b><small>' + g.who + '. The Guinea Pig Gang keeps all the money here.</small></div></div>';
      h += '<p>Beat them in a <b>Mail Race</b>: sort 8 parcels, get 6 right. It\u2019s free to try again.</p><button class="btn" data-a="race">\uD83C\uDFC1 Start Mail Race</button>';
    } else {
      h += '<div class="row"><div><b>Reputation ' + Math.round(x.rep) + '/100</b><small>Under 55 and the Guinea Pig Gang can steal this station</small></div><div style="width:90px;height:10px;background:#334155;border-radius:6px"><div style="width:' + x.rep + '%;height:100%;background:' + (x.rep < 55 ? '#ef4444' : '#4ade80') + ';border-radius:6px"></div></div></div>';
      h += '<div class="row"><div><b>Backlog ' + Math.round(x.backlog) + ' pieces</b><small>' + (x.backlog > 25 ? '\u26A0\uFE0F Piling up! Upgrade sorting or deliveries.' : 'Rent ' + fmt(rentOf(x)) + '/day') + '</small></div></div>';
      h += '<h3>Buildings</h3>';
      Object.keys(BLD).forEach(function (k) {
        var B = BLD[k], l = x.b[k], c = upCost(k, l), mx = l >= B.max;
        var lab = k === 'letters' ? LET_SIZE[l] + ' \u00b7 rent ' + fmt(LET_RENT[l]) + '/day' : (l ? 'Lv ' + l + ' \u00b7 rent ' + fmt(B.rent * l) + '/day' : 'Not built');
        h += '<div class="row"><div><b>' + B.icon + ' ' + B.name + '</b><small>' + lab + '</small><small>' + B.desc + '</small></div><div style="display:flex;flex-direction:column;gap:4px">' +
          (mx ? '<button class="btn k" disabled>MAX</button>' : '<button class="btn ' + (k === 'letters' ? 'y' : 'b') + '" data-a="up" data-k="' + k + '"' + (S.money < c || broke() ? ' disabled' : '') + '>' + (l ? 'Up ' : 'Build ') + fmt(c) + '</button>') +
          (k === 'letters' && l > 0 ? '<button class="btn k" data-a="down">Downsize</button>' : '') + '</div></div>';
      });
      h += '<h3>Street</h3>';
      h += '<div class="row"><div><b>\uD83D\uDCEE Mailboxes: ' + x.box + '</b><small>Each one collects more mail</small></div><button class="btn b" data-a="box"' + (x.box >= 16 || S.money < 60 + x.box * 15 || broke() ? ' disabled' : '') + '>' + (x.box >= 16 ? 'MAX' : fmt(60 + x.box * 15)) + '</button></div>';
      h += '<div class="row"><div><b>\uD83D\uDE9A Trucks: ' + x.trucks + '</b><small>Help the 2-Day Place deliver</small></div><button class="btn b" data-a="truck"' + (x.trucks >= 5 || S.money < 500 * x.trucks || broke() ? ' disabled' : '') + '>' + (x.trucks >= 5 ? 'MAX' : fmt(500 * x.trucks)) + '</button></div>';
    }
    h += '<h3>Ratita Post crew</h3><small style="color:#cbd5e1">\uD83D\uDC00 Postmaster Pi-rat runs the Main Mail Shop. Luna sorts, Snowie zooms Same-Day, Candy guards the 2-Day trucks and Torty runs Letters & Media.</small>';
    $('panel').innerHTML = h;
    [].forEach.call($('panel').querySelectorAll('[data-a]'), function (b) { b.onclick = function () { var k = b.getAttribute('data-k'); act(b.getAttribute('data-a'), /^\d+$/.test(k) ? +k : k); }; });
  }
  function drawLog() { $('log').innerHTML = S.log.map(function (l) { return '<div class="' + l[1] + '">' + l[0] + '</div>'; }).join(''); }
  var paused = true;
  function overlay(html) { var o = $('ov'); o.innerHTML = '<div class="card">' + html + '</div>'; o.style.display = 'flex'; paused = true; }
  function closeOv() { $('ov').style.display = 'none'; paused = false; }
  function menu() {
    var sv = load();
    overlay('<div style="font-size:44px">\uD83D\uDC00\uD83D\uDCEE</div><h1>Ratita Mail Tycoon</h1><p>Postmaster <b>Pi-rat</b> needs you! Build Mailville\u2019s mail empire station by station \u2013 and keep the <b>Guinea Pig Gang</b> away.</p>' +
      '<div class="modes"><div class="mode"><b>\uD83C\uDF31 Start from Scratch</b><p>One small Mail Shop, a tiny Sorting Facility, a 2-Day Place and $1,500. Grow from there.</p><button class="btn y" id="mS">Start from Scratch</button></div>' +
      '<div class="mode"><b>\uD83C\uDFD9\uFE0F Built Empire</b><p>All 5 stations already built, $22,000 \u2013 but Liz\u2019s gang already holds Burrow Bay!</p><button class="btn b" id="mE">Start Built Empire</button></div></div>' +
      (sv ? '<p style="margin-top:12px"><button class="btn g" id="mC">\u25B6 Continue (Day ' + sv.day + ', ' + fmt(sv.money) + ')</button></p>' : '') +
      '<p style="font-size:12px;opacity:.8">PREVIEW build for David \u00b7 #91 \u00b7 saves stay in this preview only</p>');
    $('mS').onclick = function () { start(blank('scratch')); };
    $('mE').onclick = function () { start(blank('empire')); };
    if (sv) $('mC').onclick = function () { start(sv); };
  }
  function start(s) { S = s; S.log = S.log || []; closeOv(); save(); drawHud(); drawPanel(); drawLog(); refreshWorld(); focus(S.sel);
    if (!S.log.length) log('\uD83D\uDC00 Pi-rat: \u201CWelcome to Mailville! Sort fast, deliver right, and watch out for that Guinea Pig Gang.\u201D', 'good'); }
  // ---------- Mail Race (win a station back) ----------
  var RACE = null;
  var TYPES = [['\u26A1 SAME-DAY', '#ef4444'], ['\uD83D\uDCE6 2-DAY', '#3b82f6'], ['\u2709\uFE0F LETTER', '#facc15']];
  function startRace() { RACE = { n: 0, ok: 0, cur: Math.floor(Math.random() * 3) }; drawRace(); }
  function drawRace() {
    var g = GANG[S.st[S.sel].gang];
    if (RACE.n >= 8) {
      var win = RACE.ok >= 6;
      overlay('<h1>' + (win ? '\uD83C\uDFC6 You won!' : '\uD83D\uDC39 ' + g.name + ' wins this time') + '</h1><p>You sorted ' + RACE.ok + '/8 right.</p><p>' + (win ? STATIONS[S.sel].name + ' is back with Ratita Post! ' + g.name + ' runs off squeaking.' : 'No cost to try again \u2013 Pi-rat believes in you!') + '</p><button class="btn y" id="rD">' + (win ? 'Back to Mailville' : 'Try again (free)') + '</button>' + (win ? '' : ' <button class="btn k" id="rX">Later</button>'));
      $('rD').onclick = function () { if (win) { var x = S.st[S.sel]; x.own = 'me'; x.gang = -1; x.rep = 65; x.backlog = 0; log('\uD83C\uDFC6 Won back ' + STATIONS[S.sel].name + ' from ' + g.name + '!', 'good'); closeOv(); save(); drawPanel(); refreshWorld(); drawHud(); } else startRace(); };
      if (!win) $('rX').onclick = function () { closeOv(); };
      return;
    }
    var t = TYPES[RACE.cur];
    overlay('<h1>\uD83C\uDFC1 Mail Race vs ' + g.name + '</h1><p>Parcel ' + (RACE.n + 1) + ' of 8 \u00b7 ' + RACE.ok + ' right</p><div style="margin:14px auto;width:180px;height:110px;background:#d6a46c;border-radius:10px;position:relative;box-shadow:0 6px 0 #92400e"><div style="position:absolute;right:10px;top:10px;background:' + t[1] + ';color:#111;font-weight:900;padding:6px 8px;border-radius:6px">' + t[0] + '</div></div><p>Which bin?</p><div class="bins">' +
      TYPES.map(function (q, k) { return '<button class="btn" style="background:' + q[1] + ';color:' + (k === 2 ? '#111' : '#fff') + '" data-b="' + k + '">' + q[0] + '</button>'; }).join('') + '</div>');
    [].forEach.call(document.querySelectorAll('[data-b]'), function (b) { b.onclick = function () { if (+b.getAttribute('data-b') === RACE.cur) RACE.ok++; RACE.n++; RACE.cur = Math.floor(Math.random() * 3); drawRace(); }; });
  }
  // ---------- 3D world ----------
  var cv = $('cv'), ren = new THREE.WebGLRenderer({ canvas: cv, antialias: devicePixelRatio < 2 });
  ren.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  var scene = new THREE.Scene(); scene.background = new THREE.Color('#9bd3f5'); scene.fog = new THREE.Fog('#9bd3f5', 90, 190);
  var cam = new THREE.PerspectiveCamera(50, 1, 0.5, 400);
  scene.add(new THREE.HemisphereLight('#ffffff', '#7c9a5a', 0.85)); var sun = new THREE.DirectionalLight('#fff4d6', 0.7); sun.position.set(30, 60, 20); scene.add(sun);
  var MC = {}; function M(c) { return MC[c] || (MC[c] = new THREE.MeshLambertMaterial({ color: c })); }
  var GB = new THREE.BoxGeometry(1, 1, 1), GS = new THREE.SphereGeometry(1, 12, 9), GC = new THREE.CylinderGeometry(1, 1, 1, 12), GCo = new THREE.ConeGeometry(1, 1, 10);
  function mesh(g, c, sx, sy, sz, x, y, z, p) { var m = new THREE.Mesh(g, M(c)); m.scale.set(sx, sy, sz); m.position.set(x, y, z); (p || scene).add(m); return m; }
  function box(c, sx, sy, sz, x, y, z, p) { return mesh(GB, c, sx, sy, sz, x, y + sy / 2, z, p); }
  // canvas sign: plane size matches canvas aspect, so text is never stretched
  function sign(w, h, draw, p, x, y, z, ry) {
    var cw = 256, ch = Math.round(256 * h / w), c = document.createElement('canvas'); c.width = cw; c.height = ch; var g = c.getContext('2d');
    var tex = new THREE.CanvasTexture(c); var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    m.position.set(x, y, z); m.rotation.y = ry || 0; p.add(m); m.userData.redraw = function (a) { g.clearRect(0, 0, cw, ch); draw(g, cw, ch, a); tex.needsUpdate = true; }; m.userData.redraw(); return m;
  }
  function txt(g, s, x, y, col, sz, maxW) { g.fillStyle = col; g.font = '800 ' + sz + 'px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; var f = sz; while (maxW && g.measureText(s).width > maxW && f > 8) { f--; g.font = '800 ' + f + 'px system-ui,sans-serif'; } g.fillText(s, x, y); }
  // ground + roads
  box('#7cb35a', 260, 0.2, 200, 30, -0.2, 20);
  var LOT = [[-36, 0], [0, 0], [36, 0], [-18, 36], [18, 36]]; // Center in the middle of the top row
  var ORDER = [1, 0, 2, 3, 4]; // station index -> lot index (center lot for Mailville Center)
  box('#4b5563', 130, 0.06, 6, 0, 0, 18); [-36, 0, 36].forEach(function (x) { box('#4b5563', 6, 0.06, 26, x, 0, 5); }); [-18, 18].forEach(function (x) { box('#4b5563', 6, 0.06, 14, x, 0, 26); });
  for (var dx = -62; dx <= 62; dx += 5) box('#f8fafc', 2, 0.08, 0.3, dx, 0, 18);
  // pets ---------------------------------------------------------
  function rat(p, x, z, ry, col, patch, hat) {
    var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0; p.add(g);
    mesh(GS, col, 0.45, 0.32, 0.65, 0, 0.32, 0, g); mesh(GS, col, 0.28, 0.25, 0.3, 0, 0.42, 0.6, g);
    mesh(GS, '#fda4af', 0.06, 0.06, 0.06, 0, 0.42, 0.9, g); [-1, 1].forEach(function (s) { mesh(GS, '#fda4af', 0.12, 0.12, 0.04, s * 0.17, 0.66, 0.52, g); mesh(GS, '#111', 0.045, 0.045, 0.045, s * 0.13, 0.5, 0.82, g); });
    if (patch) { mesh(GS, '#111', 0.09, 0.09, 0.04, 0.13, 0.5, 0.84, g); box('#111', 0.5, 0.03, 0.03, 0, 0.54, 0.74, g).rotation.z = -0.35; }
    if (hat) { mesh(GC, '#1d4ed8', 0.2, 0.12, 0.2, 0, 0.7, 0.58, g); box('#111827', 0.3, 0.03, 0.15, 0, 0.62, 0.72, g); mesh(GS, '#facc15', 0.04, 0.04, 0.02, 0, 0.72, 0.78, g); }
    var t = mesh(GC, '#fda4af', 0.04, 0.9, 0.04, 0, 0.25, -0.95, g); t.rotation.x = 1.25; return g;
  }
  function schnauzer(p, x, z, ry) { var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0; p.add(g);
    box('#6b7280', 0.6, 0.45, 1.1, 0, 0.45, 0, g); [-1, 1].forEach(function (a) { [-1, 1].forEach(function (b) { box('#4b5563', 0.14, 0.45, 0.14, a * 0.2, 0, b * 0.4, g); }); });
    box('#6b7280', 0.42, 0.42, 0.5, 0, 0.85, 0.6, g); box('#d1d5db', 0.36, 0.22, 0.3, 0, 0.72, 0.9, g); box('#e5e7eb', 0.44, 0.06, 0.12, 0, 1.18, 0.78, g); mesh(GS, '#111', 0.06, 0.06, 0.06, 0, 0.88, 1.06, g);
    [-1, 1].forEach(function (s) { box('#4b5563', 0.12, 0.2, 0.1, s * 0.17, 1.25, 0.55, g).rotation.z = s * 0.3; }); box('#4b5563', 0.1, 0.25, 0.1, 0, 0.75, -0.6, g).rotation.x = -0.5; return g; }
  function tortoise(p, x, z, ry) { var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0; p.add(g);
    var sh = mesh(GS, '#a16207', 0.65, 0.4, 0.8, 0, 0.3, 0, g); for (var i = 0; i < 5; i++) mesh(GS, '#78350f', 0.18, 0.06, 0.18, Math.cos(i * 1.26) * 0.3, 0.62, Math.sin(i * 1.26) * 0.36, g);
    mesh(GS, '#a8a29e', 0.2, 0.18, 0.26, 0, 0.3, 0.85, g); [-1, 1].forEach(function (a) { [-1, 1].forEach(function (b) { mesh(GC, '#a8a29e', 0.12, 0.3, 0.12, a * 0.45, 0.12, b * 0.45, g); }); }); return g; }
  function gangMember(p, gi, x, z, ry) { var d = GANG[gi], g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0; p.add(g);
    if (d.kind === 'pig') { mesh(GS, d.col, 0.55, 0.45, 0.7, 0, 0.45, 0, g); mesh(GS, d.col2, 0.4, 0.3, 0.35, 0, 0.55, 0.35, g); [-1, 1].forEach(function (s) { mesh(GS, '#fca5a5', 0.1, 0.06, 0.12, s * 0.28, 0.85, 0.35, g); mesh(GS, '#111', 0.06, 0.06, 0.06, s * 0.18, 0.66, 0.66, g); });
      if (d.bling) { var ch = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.05, 6, 16), M('#fbbf24')); ch.position.set(0, 0.45, 0.42); ch.rotation.x = 1.2; g.add(ch); mesh(GS, '#fde047', 0.1, 0.1, 0.05, 0, 0.3, 0.62, g); box('#111', 0.5, 0.08, 0.06, 0, 0.66, 0.67, g); } }
    else if (d.kind === 'cat') { box(d.col, 0.5, 0.5, 1.0, 0, 0.35, 0, g); box(d.col, 0.5, 0.45, 0.45, 0, 0.75, 0.55, g); [-1, 1].forEach(function (s) { var e = mesh(GCo, d.col, 0.1, 0.22, 0.1, s * 0.16, 1.3, 0.55, g); mesh(GS, '#22c55e', 0.06, 0.06, 0.04, s * 0.12, 1.0, 0.79, g); }); box(d.col2, 0.25, 0.15, 0.1, 0, 0.82, 0.78, g); var t = box(d.col, 0.1, 0.9, 0.1, 0, 0.6, -0.55, g); t.rotation.x = -0.4; [-1, 1].forEach(function (a) { [-1, 1].forEach(function (b) { box(d.col, 0.12, 0.35, 0.12, a * 0.17, 0, b * 0.35, g); }); }); }
    else { box(d.col, 0.4, 0.25, 1.1, 0, 0.15, 0, g); box(d.col, 0.32, 0.22, 0.42, 0, 0.2, 0.72, g); [-1, 1].forEach(function (s) { mesh(GS, d.col2, 0.07, 0.07, 0.07, s * 0.15, 0.36, 0.82, g); }); var tl = box(d.col, 0.15, 0.12, 1.0, 0, 0.12, -1.0, g); [-1, 1].forEach(function (a) { [-1, 1].forEach(function (b) { box(d.col, 0.32, 0.08, 0.1, a * 0.3, 0.06, b * 0.35, g); }); }); box('#ef4444', 0.04, 0.02, 0.2, 0, 0.18, 1.0, g); }
    sign(1.8, 0.45, function (c, w, h) { c.fillStyle = '#581c87'; c.fillRect(0, 0, w, h); txt(c, '\uD83D\uDC39 ' + d.name.toUpperCase(), w / 2, h / 2, '#f0abfc', 34, w - 10); }, g, 0, 1.75, 0, 0);
    return g; }
  // stations ------------------------------------------------------
  var SLOTS = { shop: [0, -7, 7, 5, 6], sort: [-8, -6, 7, 6, 7], same: [8, -6, 5, 4, 5], two: [-8, 4, 6, 4, 5], letters: [8, 4, 4, 3, 4] }; // dx,dz,w,h,d
  var W = []; // per-station world parts
  function buildStation(i) {
    var L = LOT[ORDER[i]], root = new THREE.Group(); root.position.set(L[0], 0, L[1]); scene.add(root);
    var o = { root: root, bld: {}, boxes: [], trucks: [], lot: null, gang: null, crew: null, plaza: null };
    box('#d6d3d1', 28, 0.1, 22, 0, 0, -1, root); box('#e7e5e4', 8, 0.12, 6, 0, 0, 1.5, root); // plaza
    mesh(GC, '#94a3b8', 0.8, 0.6, 0.8, 0, 0.3, 1.5, root); mesh(GC, '#60a5fa', 0.6, 0.1, 0.6, 0, 0.62, 1.5, root); // fountain
    [[-13, -11], [13, -11], [-13, 9], [13, 9], [-4, 9], [4, 9]].forEach(function (q) { mesh(GC, '#78350f', 0.15, 1.2, 0.15, q[0], 0.6, q[1], root); mesh(GS, '#15803d', 0.9, 1.0, 0.9, q[0], 1.7, q[1], root); });
    [[-13, -1], [13, -1]].forEach(function (q) { mesh(GC, '#111827', 0.06, 2.6, 0.06, q[0], 1.3, q[1], root); mesh(GS, '#fef08a', 0.2, 0.2, 0.2, q[0], 2.7, q[1], root); });
    // plaza props: benches, parcel carts, flower beds, a stamp kiosk
    [[-2.6, 3.6], [2.6, 3.6]].forEach(function (q) { box('#92400e', 1.8, 0.12, 0.5, q[0], 0.4, q[1], root); box('#92400e', 1.8, 0.5, 0.1, q[0], 0.52, q[1] + 0.25, root); box('#111827', 0.1, 0.4, 0.4, q[0] - 0.8, 0, q[1], root); box('#111827', 0.1, 0.4, 0.4, q[0] + 0.8, 0, q[1], root); });
    [[-4, -0.4], [4, -0.4]].forEach(function (q) { box('#9ca3af', 1.2, 0.5, 0.8, q[0], 0.15, q[1], root); box('#d6a46c', 0.5, 0.4, 0.5, q[0] - 0.25, 0.65, q[1], root); box('#e7c08f', 0.4, 0.3, 0.4, q[0] + 0.3, 0.65, q[1], root); box('#ef4444', 0.12, 0.08, 0.12, q[0] - 0.2, 1.05, q[1] + 0.2, root); });
    [[-3.6, 5.6], [3.6, 5.6], [-11, 1.5], [11, 1.5]].forEach(function (q) { box('#78350f', 1.6, 0.35, 0.8, q[0], 0, q[1], root); [-0.5, 0, 0.5].forEach(function (f, n) { mesh(GS, ['#f472b6', '#facc15', '#a78bfa'][n], 0.18, 0.18, 0.18, q[0] + f, 0.5, q[1], root); }); });
    box('#1d4ed8', 1.2, 1.6, 1.0, -11, 0, -3.4, root); box('#facc15', 1.25, 0.3, 1.05, -11, 1.6, -3.4, root);
    // nameplate
    sign(8, 1.2, function (c, w, h) { c.fillStyle = STATIONS[i].col; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.fillRect(4, 4, w - 8, h - 8); txt(c, '\uD83D\uDCEE ' + STATIONS[i].name.toUpperCase(), w / 2, h / 2, '#111827', 22, w - 16); }, root, 0, 1.0, 10.05, 0);
    box('#111827', 0.15, 1.6, 0.15, -3.6, 0, 10, root); box('#111827', 0.15, 1.6, 0.15, 3.6, 0, 10, root);
    Object.keys(SLOTS).forEach(function (k) { var s = SLOTS[k], g = new THREE.Group(); g.position.set(s[0], 0, s[1]); root.add(g); o.bld[k] = { g: g, s: s, lv: -1 }; });
    o.lot = new THREE.Group(); root.add(o.lot);
    for (var f = -12; f <= 12; f += 2) { box('#a16207', 0.15, 0.9, 0.15, f, 0, -11, o.lot); box('#a16207', 0.15, 0.9, 0.15, f, 0, 8, o.lot); }
    box('#a16207', 25, 0.1, 0.1, 0, 0.7, -11, o.lot); box('#a16207', 25, 0.1, 0.1, 0, 0.7, 8, o.lot);
    box('#78350f', 0.2, 2, 0.2, 0, 0, 3, o.lot); sign(4, 2, function (c, w, h) { c.fillStyle = '#fef3c7'; c.fillRect(0, 0, w, h); c.strokeStyle = '#dc2626'; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8); txt(c, 'FOR SALE', w / 2, h * 0.38, '#dc2626', 40); txt(c, fmt(STATIONS[i].cost), w / 2, h * 0.72, '#111827', 30); }, o.lot, 0, 3, 3.15, 0);
    W[i] = o;
  }
  function drawBuilding(i, k) {
    var o = W[i].bld[k], x = S.st[i], lv = x.b[k], key = lv + (x.own === 'gang' ? 'g' : ''); if (o.lv === key) return; o.lv = key;
    while (o.g.children.length) { var c = o.g.children.pop(); if (c.material && c.material.map) { c.material.map.dispose(); c.material.dispose(); c.geometry.dispose(); } c.traverse && c.traverse(function (q) { if (q.material && q.material.map) { q.material.map.dispose(); q.material.dispose(); q.geometry.dispose(); } }); }
    var s = o.s, B = BLD[k], gang = x.own === 'gang';
    if (!lv) { box('#a8a29e', s[2], 0.15, s[4], 0, 0, 0, o.g); box('#f59e0b', 0.1, 0.8, 0.1, -s[2] / 2 + 0.3, 0, s[4] / 2 - 0.3, o.g); sign(3, 0.75, function (c, w, h) { c.fillStyle = '#fbbf24'; c.fillRect(0, 0, w, h); txt(c, 'BUILD: ' + B.name, w / 2, h / 2, '#111', 22, w - 10); }, o.g, 0, 0.6, s[4] / 2 + 0.05, 0); return; }
    var hgt = k === 'letters' ? [0, 2.4, 3.6][lv] : s[3] * (0.65 + lv * 0.12), wid = k === 'letters' ? [0, s[2] * 0.6, s[2]][lv] : s[2];
    box(gang ? '#6b21a8' : '#f8fafc', wid, hgt, s[4], 0, 0, 0, o.g); box(gang ? '#a855f7' : B.col, wid + 0.3, 0.5, s[4] + 0.3, 0, hgt, 0, o.g);
    box(gang ? '#c084fc' : B.col, wid, 0.25, 0.1, 0, hgt * 0.62, s[4] / 2 + 0.05, o.g);
    box('#1e293b', 1.2, 1.8, 0.1, 0, 0, s[4] / 2 + 0.05, o.g);
    for (var wx = -wid / 2 + 1; wx < wid / 2 - 0.6; wx += 1.6) if (Math.abs(wx) > 0.9) box('#93c5fd', 0.9, 0.8, 0.1, wx, 0.8, s[4] / 2 + 0.05, o.g);
    if (hgt > 3.5) for (var wx2 = -wid / 2 + 1; wx2 < wid / 2 - 0.6; wx2 += 1.6) box('#93c5fd', 0.9, 0.7, 0.1, wx2, hgt * 0.62 + 0.5, s[4] / 2 + 0.05, o.g);
    if (k === 'sort') { box('#374151', wid * 0.8, 0.5, 1, 0, 0, s[4] / 2 + 1.2, o.g); for (var p = 0; p < lv + 1; p++) box('#d6a46c', 0.5, 0.4, 0.5, -wid * 0.35 + p * 1.1, 0.5, s[4] / 2 + 1.2, o.g); }
    if (k === 'same') { mesh(GC, '#ef4444', 0.08, 2, 0.08, wid / 2 + 0.5, 1, 0, o.g); sign(1.2, 0.6, function (c, w, h) { c.fillStyle = '#ef4444'; c.fillRect(0, 0, w, h); txt(c, '\u26A1', w / 2, h / 2, '#fff', 60); }, o.g, wid / 2 + 0.5, 2.2, 0.05, 0); }
    var bw = Math.min(wid, 5.6);
    sign(bw, bw / 4, function (c, w, h) { c.fillStyle = gang ? '#3b0764' : '#111827'; c.fillRect(0, 0, w, h); c.strokeStyle = gang ? '#e879f9' : B.col; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6);
      txt(c, gang ? '\uD83D\uDC39 GANG ' + B.name.split(' ')[0].toUpperCase() : B.icon + ' ' + B.name.toUpperCase(), w / 2, h * 0.42, '#fff', 24, w - 16); txt(c, k === 'letters' ? LET_SIZE[lv] : 'LEVEL ' + lv, w / 2, h * 0.76, gang ? '#f0abfc' : '#fde047', 16); }, o.g, 0, hgt + 0.7, s[4] / 2 + 0.2, 0);
  }
  function drawStreet(i) {
    var o = W[i], x = S.st[i], n = x.own === 'none' ? 0 : x.box;
    while (o.boxes.length > n) o.root.remove(o.boxes.pop());
    while (o.boxes.length < n) { var j = o.boxes.length, side = j % 2 ? 1 : -1, row = Math.floor(j / 2), g = new THREE.Group();
      var px = j < 12 ? -12 + (row % 6) * 4.8 : (side * 13.5), pz = j < 12 ? (j % 2 ? 10.5 : -12.2) : -8 + (j - 12) * 4;
      g.position.set(px, 0, pz); box('#1e3a8a', 0.12, 0.7, 0.12, 0, 0, 0, g); box('#2563eb', 0.6, 0.6, 0.5, 0, 0.7, 0, g); mesh(GC, '#2563eb', 0.3, 0.5, 0.3, 0, 1.3, 0, g).rotation.z = Math.PI / 2; box('#ef4444', 0.05, 0.4, 0.05, 0.33, 1.3, 0, g);
      o.root.add(g); o.boxes.push(g); }
    var nt = x.own === 'me' ? x.trucks : 0;
    while (o.trucks.length > nt) o.root.remove(o.trucks.pop());
    while (o.trucks.length < nt) { var t = new THREE.Group(); box('#f8fafc', 1.4, 1.3, 2.6, 0, 0.3, -0.3, t); box(STATIONS[i].col, 1.42, 0.3, 2.62, 0, 0.9, -0.3, t); box('#1d4ed8', 1.4, 0.9, 1.0, 0, 0.3, 1.4, t); box('#93c5fd', 1.2, 0.4, 0.05, 0, 0.75, 1.92, t);
      [-1, 1].forEach(function (a) { [-1, 1].forEach(function (b) { mesh(GC, '#111', 0.3, 0.2, 0.3, a * 0.7, 0.3, b * 0.9, t).rotation.z = Math.PI / 2; }); }); t.userData.ph = o.trucks.length / 5; o.root.add(t); o.trucks.push(t); }
  }
  function refreshWorld() {
    if (!S) return;
    S.st.forEach(function (x, i) { var o = W[i];
      o.lot.visible = x.own === 'none'; Object.keys(SLOTS).forEach(function (k) { o.bld[k].g.visible = x.own !== 'none'; if (x.own !== 'none') drawBuilding(i, k); });
      drawStreet(i);
      if (o.gang && (x.own !== 'gang' || o.gang.userData.gi !== x.gang)) { o.root.remove(o.gang); o.gang = null; }
      if (x.own === 'gang' && !o.gang) { o.gang = new THREE.Group(); o.gang.userData.gi = x.gang; o.root.add(o.gang); gangMember(o.gang, x.gang, 0, 3.6, 0);
        var others = [0, 1, 2, 3, 4].filter(function (q) { return q !== x.gang; }).slice(0, 2); others.forEach(function (q, n) { gangMember(o.gang, q, (n ? 1 : -1) * 2.4, 3.2, (n ? -0.4 : 0.4)); });
        var fl = box('#581c87', 0.1, 4, 0.1, -6, 0, 3, o.gang); sign(2, 1.2, function (c, w, h) { c.fillStyle = '#a855f7'; c.fillRect(0, 0, w, h); txt(c, '\uD83D\uDC39 GANG', w / 2, h / 2, '#fff', 44); }, o.gang, -5, 3.4, 3, 0); }
      if (o.crew) o.crew.visible = x.own === 'me';
    });
  }
  // the Ratita Post crew lives at Mailville Center; cameos at the other stations
  function buildCrew() {
    var r = W[0].root, c = new THREE.Group(); r.add(c); W[0].crew = c;
    W[0].pirat = rat(c, 0, -2.6, 0, '#8b5a2b', true, true); W[0].piratSign = sign(2.2, 0.5, function (g, w, h) { g.fillStyle = '#1d4ed8'; g.fillRect(0, 0, w, h); txt(g, 'POSTMASTER PI-RAT', w / 2, h / 2, '#fff', 26, w - 10); }, c, 0, 1.5, -2.6, 0);
    rat(c, -6.5, -1.6, 0.4, '#6b7280'); sign(1.6, 0.4, function (g, w, h) { g.fillStyle = '#111827'; g.fillRect(0, 0, w, h); txt(g, 'LUNA \u00b7 sorting', w / 2, h / 2, '#e5e7eb', 26, w - 10); }, c, -6.5, 1.3, -1.6, 0);
    rat(c, 6.5, -2.2, -0.5, '#f8fafc'); sign(1.6, 0.4, function (g, w, h) { g.fillStyle = '#111827'; g.fillRect(0, 0, w, h); txt(g, 'SNOWIE \u00b7 same-day', w / 2, h / 2, '#fff', 26, w - 10); }, c, 6.5, 1.3, -2.2, 0);
    schnauzer(c, -5, 7.2, 0.3); sign(1.6, 0.4, function (g, w, h) { g.fillStyle = '#111827'; g.fillRect(0, 0, w, h); txt(g, 'CANDY \u00b7 2-day', w / 2, h / 2, '#fff', 26, w - 10); }, c, -5, 1.8, 7.2, 0);
    tortoise(c, 5.5, 7.4, -0.3); sign(1.6, 0.4, function (g, w, h) { g.fillStyle = '#111827'; g.fillRect(0, 0, w, h); txt(g, 'TORTY \u00b7 letters', w / 2, h / 2, '#fff', 26, w - 10); }, c, 5.5, 1.4, 7.4, 0);
    for (var i = 1; i < 5; i++) { var cc = new THREE.Group(); W[i].root.add(cc); W[i].crew = cc; [function () { rat(cc, 0, -2.4, 0, '#6b7280'); }, function () { rat(cc, 0, -2.4, 0, '#f8fafc'); }, function () { schnauzer(cc, 0, -2.4, 0); }, function () { tortoise(cc, 0, -2.4, 0); }][i - 1](); }
    // Guinea Pig Gang hideout at the edge of town
    var hq = new THREE.Group(); hq.position.set(58, 0, 38); scene.add(hq); box('#3b0764', 9, 4, 7, 0, 0, 0, hq); box('#a855f7', 9.4, 0.5, 7.4, 0, 4, 0, hq);
    sign(7, 1.4, function (g, w, h) { g.fillStyle = '#581c87'; g.fillRect(0, 0, w, h); txt(g, '\uD83D\uDC39 GUINEA PIG GANG HIDEOUT', w / 2, h / 2, '#f0abfc', 22, w - 12); }, hq, 0, 3, 3.55, 0);
    gangMember(hq, 0, -2.5, 5, 0); gangMember(hq, 1, 0, 5.3, 0); gangMember(hq, 2, 2.5, 5, 0); gangMember(hq, 3, -4.5, 4.5, 0.3); gangMember(hq, 4, 4.6, 4.6, -0.3);
  }
  // camera: drag to orbit, wheel/pinch to zoom, glides to the selected station
  var yaw = 0.5, pitch = 0.78, dist = 46, tgt = new THREE.Vector3(0, 0, 0), want = new THREE.Vector3(0, 0, 0);
  function focus(i) { var L = LOT[ORDER[i]]; if (walk) return; want.set(L[0], 0, L[1]); dist = 42; }
  var drag = null, pts = {};
  cv.addEventListener('pointerdown', function (e) { pts[e.pointerId] = [e.clientX, e.clientY]; drag = { x: e.clientX, y: e.clientY, moved: 0 }; });
  addEventListener('pointermove', function (e) { if (!drag || !pts[e.pointerId]) return; var ids = Object.keys(pts);
    if (ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]], d0 = Math.hypot(a[0] - b[0], a[1] - b[1]); pts[e.pointerId] = [e.clientX, e.clientY]; a = pts[ids[0]]; b = pts[ids[1]]; dist = Math.max(18, Math.min(110, dist * d0 / Math.max(1, Math.hypot(a[0] - b[0], a[1] - b[1])))); return; }
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy); yaw -= dx * 0.006; pitch = Math.max(0.35, Math.min(1.35, pitch + dy * 0.004)); pts[e.pointerId] = [e.clientX, e.clientY]; });
  addEventListener('pointerup', function (e) { delete pts[e.pointerId]; if (drag && drag.moved < 6 && S && e.target === cv) pick(e); if (!Object.keys(pts).length) drag = null; });
  cv.addEventListener('wheel', function (e) { dist = Math.max(18, Math.min(110, dist * (e.deltaY > 0 ? 1.1 : 0.9))); e.preventDefault(); }, { passive: false });
  // ---- WALK MODE: play as Postmaster Pi-rat (WASD/arrows or on-screen joystick) ----
  var walk = false, me = null, keys = {}, joy = { id: null, x: 0, y: 0, cx: 0, cy: 0 };
  function setWalk(on) { walk = on; var b = $('walkB'); if (b) b.textContent = on ? '\uD83D\uDDFA Map View' : '\uD83D\uDC00 Walk Around';
    if (!me) { me = rat(scene, 0, 0, 0, '#8b5a2b', true, true); me.scale.set(1.6, 1.6, 1.6); var L0 = LOT[ORDER[S ? S.sel : 0]]; me.position.set(L0[0], 0, L0[1] + 4); }
    me.visible = on; if (W[0].pirat) W[0].pirat.visible = !on; if (W[0].piratSign) W[0].piratSign.visible = !on;
    $('joy').style.display = on && ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 'block' : 'none';
    $('hint').textContent = on ? 'WASD / arrows (or joystick) to walk \u00b7 drag to turn \u00b7 walk into a station to open it' : 'Drag to look around \u00b7 tap a station on the map or in the list';
    var tch = 'ontouchstart' in window || navigator.maxTouchPoints > 0; $('log').style.display = on && tch ? 'none' : ''; if (tch && on) $('hint').textContent = 'Joystick to walk · drag to turn';
    if (on) { dist = 24; pitch = 0.8; } else { dist = 42; pitch = 0.78; } }
  addEventListener('keydown', function (e) { var k = e.key.toLowerCase(); if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].indexOf(k) < 0) return;
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return; keys[k] = 1; if (S && !walk && $('ov').style.display === 'none') setWalk(true); if (walk) e.preventDefault(); });
  addEventListener('keyup', function (e) { delete keys[e.key.toLowerCase()]; });
  addEventListener('blur', function () { keys = {}; });
  (function () { var j = document.createElement('div'); j.id = 'joy'; j.innerHTML = '<div id="joyK"></div>'; document.body.appendChild(j);
    var b = document.createElement('button'); b.id = 'walkB'; b.className = 'btn y'; b.textContent = '\uD83D\uDC00 Walk Around'; document.body.appendChild(b);
    b.addEventListener('click', function () { if (S) setWalk(!walk); });
    j.addEventListener('pointerdown', function (e) { e.stopPropagation(); joy.id = e.pointerId; var r = j.getBoundingClientRect(); joy.cx = r.left + r.width / 2; joy.cy = r.top + r.height / 2; try { j.setPointerCapture(e.pointerId); } catch (x) {} jm(e); });
    function jm(e) { if (e.pointerId !== joy.id) return; var dx = e.clientX - joy.cx, dy = e.clientY - joy.cy, m = Math.hypot(dx, dy), R = 45; if (m > R) { dx *= R / m; dy *= R / m; } joy.x = dx / R; joy.y = dy / R; $('joyK').style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; }
    j.addEventListener('pointermove', function (e) { e.stopPropagation(); jm(e); });
    function je(e) { if (e.pointerId !== joy.id) return; joy.id = null; joy.x = joy.y = 0; $('joyK').style.transform = ''; }
    j.addEventListener('pointerup', je); j.addEventListener('pointercancel', je); })();
  function solid(x, z) { for (var i = 0; i < 5; i++) { var L = LOT[ORDER[i]], st = S && S.st[i]; if (!st || st.own === 'none') continue;
      for (var k in SLOTS) { var q = SLOTS[k]; if (!st.b[k]) continue; if (Math.abs(x - L[0] - q[0]) < q[2] / 2 + 0.5 && Math.abs(z - L[1] - q[1]) < q[4] / 2 + 0.5) return true; } }
    var h = Math.abs(x - 58) < 5 && Math.abs(z - 38) < 4; return h; }
  var lastSt = -1;
  function walkStep(dt) { if (!walk || !me) return;
    var f = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0) - joy.y, r = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0) + joy.x, m = Math.hypot(f, r);
    if (m > 0.05) { if (m > 1) { f /= m; r /= m; } var sp = 11 * dt, fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
      var vx = (fx * f + rx * r) * sp, vz = (fz * f + rz * r) * sp, nx = Math.max(-90, Math.min(90, me.position.x + vx)), nz = Math.max(-90, Math.min(90, me.position.z + vz));
      if (!solid(nx, me.position.z)) me.position.x = nx; if (!solid(me.position.x, nz)) me.position.z = nz;
      me.rotation.y = Math.atan2(vx, vz); me.position.y = Math.abs(Math.sin(T * 14)) * 0.15; } else me.position.y = 0;
    want.set(me.position.x, 0, me.position.z); tgt.copy(want);
    var cur = -1; for (var i = 0; i < 5; i++) { var L = LOT[ORDER[i]]; if (Math.abs(me.position.x - L[0]) < 14 && Math.abs(me.position.z - L[1] + 1) < 11) cur = i; }
    if (cur >= 0 && cur !== lastSt && S && S.sel !== cur) act('sel', cur); lastSt = cur; }
  var ray = new THREE.Raycaster(), v2 = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  function pick(e) { v2.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); ray.setFromCamera(v2, cam); if (!ray.ray.intersectPlane(plane, hit)) return;
    for (var i = 0; i < 5; i++) { var L = LOT[ORDER[i]]; if (Math.abs(hit.x - L[0]) < 15 && Math.abs(hit.z - L[1] + 1) < 12) { act('sel', i); return; } } }
  function resize() { ren.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();
  var last = performance.now(), acc = 0, T = 0;
  function loop(now) { requestAnimationFrame(loop); var dt = Math.min(0.1, (now - last) / 1000); last = now; T += dt;
    if (S && !paused) { acc += dt; if (acc > 1.2) { acc = 0; tick(); } }
    walkStep(dt); if (!walk) tgt.lerp(want, Math.min(1, dt * 3));
    cam.position.set(tgt.x + Math.sin(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist, tgt.z + Math.cos(yaw) * Math.cos(pitch) * dist); cam.lookAt(tgt);
    W.forEach(function (o) { o.trucks.forEach(function (t) { var u = (T * 0.05 + t.userData.ph) % 1, per = 2 * (28 + 22), d = u * per, px, pz, ry;
      if (d < 28) { px = -14 + d; pz = 11.5; ry = Math.PI / 2; } else if (d < 50) { px = 14; pz = 11.5 - (d - 28); ry = Math.PI; } else if (d < 78) { px = 14 - (d - 50); pz = -10.5; ry = -Math.PI / 2; } else { px = -14; pz = -10.5 + (d - 78); ry = 0; }
      t.position.set(px, 0, pz); t.rotation.y = ry; }); });
    ren.render(scene, cam); }
  for (var i = 0; i < 5; i++) buildStation(i);
  buildCrew();
  S = null; menu(); requestAnimationFrame(loop);
  window.MT = { state: function () { return S; }, act: act, tick: tick, newDay: newDay, raid: raid, start: function (m) { start(blank(m)); }, focus: focus, walk: setWalk, me: function () { return me; }, cam: function (y, p, d) { yaw = y; pitch = p; dist = d; } };
})();
