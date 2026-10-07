/* Grok Arcade - Prize Counter (redeem tickets) + Achievement Gallery (prize shelves + achievements) overlays. */
(function () {
  'use strict';
  var Z = GA.PZ = {};
  var openWhat = null, tab = 'all', gtab = 'shelves', pending = null;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function snd(n) { try { GA.Audio.play(n); } catch (e) {} }
  var TIX = '<span class="pzT" aria-hidden="true">\uD83C\uDF9F\uFE0F</span>';

  function build() {
    var d = document.createElement('div'); d.id = 'pz'; d.className = 'pzOv hidden'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    d.innerHTML = '<div class="pzPanel" id="pzPanel">' +
      '<div class="pzHead"><div class="pzTitle"><b id="pzTitle">PRIZE COUNTER</b><span id="pzSub">Trade tickets for prizes</span></div>' +
      '<div class="pzTix" title="Your tickets">' + TIX + ' <b id="pzTix">0</b></div><button id="pzClose" class="xBtn" aria-label="Close">&#10005;</button></div>' +
      '<div class="pzTabs" id="pzTabs" role="tablist"></div>' +
      '<div class="pzScroll" id="pzScroll"></div>' +
      '<div class="pzFoot" id="pzFoot"></div></div>' +
      '<div id="pzConfirm" class="pzConfirm hidden" role="alertdialog" aria-modal="true"><div class="pzCCard">' +
      '<img id="pzCImg" alt=""><div class="pzCName" id="pzCName"></div><p id="pzCMsg"></p>' +
      '<div class="pzCBtns"><button id="pzYes" class="bigBtn">YES, REDEEM</button><button id="pzNo" class="bigBtn alt">NOT YET</button></div></div></div>';
    document.body.appendChild(d);
    $('pzClose').addEventListener('click', function () { close(); });
    d.addEventListener('click', function (e) { if (e.target === d) close(); });
    $('pzNo').addEventListener('click', function () { hideConfirm(); snd('click'); });
    $('pzYes').addEventListener('click', doRedeem);
    $('pzConfirm').addEventListener('click', function (e) { if (e.target === $('pzConfirm')) hideConfirm(); });
    window.addEventListener('keydown', function (e) {
      if (!openWhat) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (pending) hideConfirm(); else close(); }
      else if (e.key === 'Enter' && pending) { e.preventDefault(); doRedeem(); }
    }, true);
  }

  function setTix() { $('pzTix').textContent = GA.getTickets(); }
  function tabs(list, cur, onPick) {
    var t = $('pzTabs'); t.innerHTML = '';
    list.forEach(function (x) {
      var b = document.createElement('button'); b.className = 'pzTab' + (x.id === cur ? ' on' : ''); b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', x.id === cur ? 'true' : 'false'); b.setAttribute('data-tab', x.id);
      b.innerHTML = (x.icon ? '<span aria-hidden="true">' + x.icon + '</span> ' : '') + esc(x.name) + (x.n != null ? ' <small>' + x.n + '</small>' : '');
      b.addEventListener('click', function () { onPick(x.id); snd('click'); });
      t.appendChild(b);
    });
  }

  /* ---------- Prize Counter ---------- */
  function renderCounter() {
    openWhat = 'counter'; setTix();
    $('pzPanel').className = 'pzPanel counter';
    $('pzTitle').textContent = 'PRIZE COUNTER'; $('pzSub').textContent = 'Trade your tickets for prizes \u00b7 win tickets in the Bonus Zone';
    tabs([{ id: 'all', name: 'All' }].concat(GA.PRIZE_CATS), tab, function (id) { tab = id; renderCounter(); $('pzScroll').scrollTop = 0; });
    var have = GA.getTickets(), list = GA.PRIZES.filter(function (p) { return tab === 'all' || p.cat === tab; }).slice().sort(function (a, b) { return a.price - b.price; });
    var h = '<div class="pzGrid">';
    list.forEach(function (p) {
      var own = GA.Prog.owns(p.id), can = have >= p.price;
      h += '<div class="pzCard' + (own ? ' owned' : can ? ' can' : ' cant') + '" data-prize="' + p.id + '">' +
        '<div class="pzImg"><img alt="" src="' + GA.PrizeArt.url(p.id, 160) + '"></div>' +
        '<div class="pzName">' + esc(p.name) + '</div><div class="pzDesc">' + esc(p.desc) + '</div>' +
        '<div class="pzPrice">' + TIX + ' ' + p.price + '</div>' +
        (own ? '<button class="pzBtn own" disabled>\u2714 OWNED</button>'
          : can ? '<button class="pzBtn buy" data-buy="' + p.id + '">REDEEM</button>'
            : '<button class="pzBtn need" disabled>NEED ' + (p.price - have) + ' MORE</button>') + '</div>';
    });
    $('pzScroll').innerHTML = h + '</div>';
    Array.prototype.forEach.call($('pzScroll').querySelectorAll('[data-buy]'), function (b) { b.addEventListener('click', function () { askRedeem(b.getAttribute('data-buy')); }); });
    var c = GA.Prog.counts();
    $('pzFoot').innerHTML = '<span>Collected <b>' + c.prizes + '/' + c.prizeTotal + '</b> prizes</span><button class="pill" id="pzToGallery">\uD83C\uDFC6 VIEW GALLERY</button>';
    $('pzToGallery').addEventListener('click', function () { snd('click'); renderGallery('shelves'); $('pzScroll').scrollTop = 0; });
  }
  function askRedeem(id) {
    var p = GA.findPrize(id); if (!p || GA.Prog.owns(id)) return;
    var have = GA.getTickets();
    if (have < p.price) { snd('buzz'); return; }
    pending = id;
    $('pzCImg').src = GA.PrizeArt.url(id, 160); $('pzCName').textContent = p.name;
    $('pzCMsg').innerHTML = 'Spend <b>' + p.price + '</b> tickets?<br>You\u2019ll have <b>' + (have - p.price) + '</b> left.';
    $('pzConfirm').classList.remove('hidden'); snd('menu');
  }
  function hideConfirm() { pending = null; $('pzConfirm').classList.add('hidden'); }
  function doRedeem() {
    if (!pending) return; var id = pending; hideConfirm();
    var r = GA.Prog.redeem(id);
    if (!r.ok) { snd('buzz'); renderCounter(); return; }
    snd('fixed'); setTix();
    renderCounter();
    var ft = $('pzFoot').querySelector('span'); if (ft) { ft.className = 'pzGot'; ft.textContent = '\uD83C\uDF89 You got the ' + GA.findPrize(id).name + '! It\u2019s on your gallery shelf.'; }
    var card = $('pzScroll').querySelector('[data-prize="' + id + '"]'); if (card) card.classList.add('just');
  }

  /* ---------- Achievement Gallery ---------- */
  function renderGallery(which) {
    openWhat = 'gallery'; gtab = which || gtab; setTix();
    $('pzPanel').className = 'pzPanel gallery';
    var c = GA.Prog.counts();
    $('pzTitle').textContent = 'ACHIEVEMENT GALLERY'; $('pzSub').textContent = 'Your prize collection and arcade achievements';
    tabs([{ id: 'shelves', name: 'Prize Shelves', icon: '\uD83E\uDDF8', n: c.prizes + '/' + c.prizeTotal }, { id: 'ach', name: 'Achievements', icon: '\uD83C\uDFC6', n: c.ach + '/' + c.achTotal }], gtab, function (id) { renderGallery(id); $('pzScroll').scrollTop = 0; });
    var h = '';
    if (gtab === 'shelves') {
      GA.PRIZE_CATS.forEach(function (cat) {
        var ps = GA.PRIZES.filter(function (p) { return p.cat === cat.id; });
        var n = ps.filter(function (p) { return GA.Prog.owns(p.id); }).length;
        h += '<div class="shelfBlock"><div class="shelfLbl">' + cat.icon + ' ' + esc(cat.name) + ' <small>' + n + '/' + ps.length + '</small></div><div class="shelf">';
        ps.forEach(function (p) {
          var own = GA.Prog.owns(p.id);
          h += '<div class="slot' + (own ? ' owned' : '') + '" data-slot="' + p.id + '" title="' + esc(p.name) + '"><img alt="" src="' + GA.PrizeArt.url(p.id, 140, !own) + '">' +
            (own ? '<span class="slotName">' + esc(p.name.replace(/ Plush$/, '')) + '</span>' : '<span class="slotQ">?</span><span class="slotName dim">' + TIX + ' ' + p.price + '</span>') + '</div>';
        });
        h += '</div><div class="shelfEdge"></div></div>';
      });
      $('pzFoot').innerHTML = '<span>' + (c.prizes ? 'Nice collection!' : 'Your shelves are empty. Redeem tickets at the Prize Counter!') + '</span><button class="pill" id="pzToCounter">\uD83C\uDF9F\uFE0F PRIZE COUNTER</button>';
    } else {
      var list = GA.Prog.list(), cats = [];
      list.forEach(function (a) { if (cats.indexOf(a.cat) < 0) cats.push(a.cat); });
      h += '<div class="achSum"><div class="achBar"><i style="width:' + Math.round(c.ach / c.achTotal * 100) + '%"></i></div><b>' + c.ach + ' of ' + c.achTotal + ' unlocked</b></div>';
      cats.forEach(function (cat) {
        h += '<div class="achCat">' + esc(cat) + '</div><div class="achGrid">';
        list.filter(function (a) { return a.cat === cat; }).sort(function (x, y) { return (y.unlocked - x.unlocked); }).forEach(function (a) {
          var pct = Math.round(a.cur / a.goal * 100);
          h += '<div class="ach' + (a.unlocked ? ' on' : '') + '" data-ach="' + a.id + '"><div class="achIco" aria-hidden="true">' + (a.unlocked ? a.icon : '\uD83D\uDD12') + '</div><div class="achTxt"><b>' + esc(a.name) + '</b><span>' + esc(a.desc) + '</span>' +
            (a.unlocked ? '<em>\u2714 Unlocked ' + new Date(a.at).toLocaleDateString() + '</em>' : (a.goal > 1 ? '<div class="achProg"><i style="width:' + pct + '%"></i><small>' + a.cur + ' / ' + a.goal + '</small></div>' : '<em class="lk">Locked</em>')) + '</div></div>';
        });
        h += '</div>';
      });
      $('pzFoot').innerHTML = '<span>Achievements save on this device.</span><button class="pill" id="pzToCounter">\uD83C\uDF9F\uFE0F PRIZE COUNTER</button>';
    }
    $('pzScroll').innerHTML = h;
    $('pzToCounter').addEventListener('click', function () { snd('click'); renderCounter(); $('pzScroll').scrollTop = 0; });
  }

  /* ---------- open / close ---------- */
  function show() {
    if (GA.UI && GA.UI.closeMenu) GA.UI.closeMenu(true);
    $('pz').classList.remove('hidden'); $('pzScroll').scrollTop = 0; document.body.classList.add('pzOn');
    if (GA.Hub) GA.Hub.setPaused(true); snd('open');
  }
  Z.openCounter = function () { if (!$('pz')) build(); tab = 'all'; renderCounter(); show(); if (GA.Prog) GA.Prog.event('counter'); };
  Z.openGallery = function (which) { if (!$('pz')) build(); renderGallery(which || 'shelves'); show(); if (GA.Prog) GA.Prog.event('gallery'); };
  function close() {
    if (!openWhat) return; hideConfirm(); openWhat = null; $('pz').classList.add('hidden'); document.body.classList.remove('pzOn'); snd('menu');
    if (GA.Hub) { GA.Hub.setPaused(false); GA.Hub.refreshBoards(); }
    if (GA.onTickets) GA.onTickets(GA.getTickets());
    if (Z.onClose) Z.onClose();
  }
  Z.close = close;
  Z.isOpen = function () { return !!openWhat; };
  Z.view = function () { return openWhat; };
  Z.redeemNow = function (id) { askRedeem(id); }; // test hook (still shows the confirm step)
})();
