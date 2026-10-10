/* Grok Arcade - UI glue: title, HUD, prompt, quick menu, launching */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
  if (isTouch) document.body.classList.add('touch');
  var menuIsOpen = false, started = false, launching = false;

  GA.UI = { menuOpen: function () { return menuIsOpen; } };
  function pzOpen() { return !!(GA.PZ && GA.PZ.isOpen()) || !!(GA.PV && GA.PV.isOpen()) || !!(GA.SB && GA.SB.isOpen()) || !!(GA.Claw && GA.Claw.isOpen()) || !!(GA.Hall && GA.Hall.isOpen()) || !!(GA.DLC && GA.DLC.isOpen()) || !!(GA.AreasUI && GA.AreasUI.isOpen()); }
  function hm() { return GA.HubMP && GA.HubMP.active() ? GA.HubMP : null; }

  function setTickets(n) { $('ticketCount').textContent = n; }
  GA.onTickets = function (n) { setTickets(n); };

  /* ---------- launching ---------- */
  GA.launchMain = function (game) {
    if (launching) return;
    if (GA.Fix && GA.Fix.powerOut()) { closeMenu(true); GA.Fix.noPower(); return; }
    launching = true;
    GA.lastLaunch = game.url;
    if (GA.Prog) GA.Prog.onLaunch(game.id);
    GA.Hub.savePos();
    GA.Audio.play('launch');
    $('fade').classList.add('on');
    setTimeout(function () { location.href = game.url; }, 320);
    // if navigation is blocked or the user comes back via bfcache, recover
    setTimeout(function () { launching = false; $('fade').classList.remove('on'); }, 4000);
  };
  GA.openBonus = function (id) {
    closeMenu(true);
    if (GA.Fix && GA.Fix.powerOut()) { GA.Fix.noPower(); return; }
    GA.Hub.setPaused(true);
    hidePrompt();
    GA.MG.open(id);
  };
  GA.interact = function (cab) {
    if (!cab || menuIsOpen || GA.MG.isOpen() || (GA.MP && GA.MP.isOpen()) || GA.Fix.isOpen() || pzOpen()) return;
    if (cab.kind === 'npc') { GA.Fix.talk(); return; }
    if (cab.kind === 'prize') { hidePrompt(); GA.PZ.openCounter(); return; }
    if (cab.kind === 'gallery') { hidePrompt(); GA.PZ.openGallery(); return; }
    if (cab.kind === 'suggest') { hidePrompt(); GA.SB.open(); return; }
    if (cab.kind === 'exhibit') { hidePrompt(); GA.Hall.open(cab.gid); return; }
    if (cab.kind === 'gus') { hidePrompt(); GA.Hall.talk(); return; }
    if (cab.kind === 'dlc') { hidePrompt(); GA.DLC.open(); return; }
    if (cab.ar && GA.AreasUI) { if (/^ar_retro$/.test(cab.kind) && GA.Fix.powerOut()) { GA.Fix.noPower(cab); return; } hidePrompt(); GA.AreasUI.open(cab); return; }
    if (cab.kind === 'mp' && GA.Fix.blocksHost()) { hidePrompt(); GA.Fix.openRepair(); return; }
    if (GA.Fix.powerOut()) { GA.Fix.noPower(cab); return; }
    if (cab.kind === 'claw') { hidePrompt(); if (GA.Claw) GA.Claw.open(cab.id); return; }
    if (cab.kind === 'mp') { hidePrompt(); GA.MP.open(); return; }
    if (cab.kind === 'main' && hm()) {
      var mode = hm().cabinetMode(cab);
      if (mode === 'launch') { hidePrompt(); GA.HubMP.launch(cab.id); return; }
      if (mode === 'suggest') { GA.HubMP.suggest(cab.id); return; }
      if (mode === 'solo') { if (GA.Fix && GA.Fix.toast) GA.Fix.toast(cab.game.name + ' is a solo game. Leave the room (tap the room code at the top) to play it.', 3600); GA.Audio.play('buzz'); return; }
    }
    if (cab.kind === 'main') GA.launchMain(cab.game); else GA.openBonus(cab.id);
  };
  GA.onMiniClose = function () {
    GA.Hub.setPaused(false);
    GA.Hub.refreshBoards();
    setTickets(GA.getTickets());
    showPrompt(GA.Hub.near());
  };
  window.addEventListener('pageshow', function () { launching = false; $('fade').classList.remove('on'); });

  /* ---------- prompt ---------- */
  function showPrompt(cab) {
    if (!cab || !started || GA.MG.isOpen() || (GA.MP && GA.MP.isOpen()) || (GA.Fix && GA.Fix.isOpen()) || pzOpen()) { hidePrompt(); return; }
    var bonus = cab.kind === 'bonus', mp = cab.kind === 'mp';
    var special = null;
    if (cab.ar && GA.AreasUI) special = GA.AreasUI.prompt(cab);
    else if (cab.kind === 'prize') { var pc = GA.Prog ? GA.Prog.counts() : { prizes: 0, prizeTotal: 0 }; special = { tag: 'PRIZE COUNTER', name: 'Redeem Tickets', desc: 'You have ' + GA.getTickets() + ' tickets. Trade them for plushies, models, trophies and more! (' + pc.prizes + '/' + pc.prizeTotal + ' collected)', btn: 'PRIZES', key: 'browse prizes', cls: 'prize', pb: 'pzPlay' }; }
    else if (cab.kind === 'gallery') { var gc = GA.Prog ? GA.Prog.counts() : { ach: 0, achTotal: 0, prizes: 0, prizeTotal: 0 }; special = { tag: 'ACHIEVEMENT GALLERY', name: 'Your Trophy Room', desc: 'Achievements ' + gc.ach + '/' + gc.achTotal + ' \u00b7 Prizes ' + gc.prizes + '/' + gc.prizeTotal + '. See your collection and what to unlock next!', btn: 'VIEW', key: 'open the gallery', cls: 'gallery', pb: 'galPlay' }; }
    else if (cab.kind === 'suggest') special = { tag: 'SUGGESTION BOOTH', name: 'Patch Suggestions', desc: 'Found a bug or have an idea for any game? Send a suggestion, then check the board to see what\u2019s being worked on!', btn: 'SUGGEST', key: 'make a suggestion', cls: 'gallery', pb: 'galPlay' };
    else if (cab.kind === 'exhibit') { var hd = GA.HALL_DATA[cab.gid], hl = hd.history[hd.history.length - 1]; special = { tag: 'HALL OF GAME RECORDS', name: cab.game.name, desc: hd.pics.length + ' pictures \u00b7 ' + hd.history.length + ' updates (newest v' + hl.ver + ') \u00b7 ' + (hd.versions.length ? hd.versions.length + ' playable old version' + (hd.versions.length > 1 ? 's' : '') : 'no old versions yet'), btn: 'VIEW', key: 'view the exhibit', cls: 'gallery', pb: 'galPlay' }; }
    else if (cab.kind === 'gus') special = { tag: 'RECORDS DESK', name: 'Gus the Archivist', desc: 'The grumpy keeper of the Hall of Game Records. He has the directory of every game. He will sigh about it.', btn: 'TALK', key: 'talk to Gus', cls: 'npc' };
    else if (cab.kind === 'dlc') special = { tag: 'DLC MACHINE 3000', name: 'Invent & Unlock DLC', desc: 'Suggest an expansion pack for any game (' + (GA.DLC.ideaCost() ? GA.DLC.ideaCost() + ' tickets' : 'first one free') + '), print your DLC ticket, check the DLC Board, and unlock shipped DLC with tickets. You have ' + GA.getTickets() + '.', btn: 'OPEN', key: 'use the DLC Machine', cls: 'prize', pb: 'pzPlay' };
    else if (cab.kind === 'npc') special = { tag: 'IT HELP DESK', name: 'Gary from IT', desc: GA.Fix.blocksHost() ? (GA.Fix.powerOut() ? 'The power is out! Gary can turn it back on and fix the antenna.' : 'The Multiplayer Antenna is broken. Ask Gary to fix it!') : 'Your friendly IT Manager. Say hi!', btn: 'TALK', key: 'talk to Gary', cls: 'npc' };
    else if (cab.kind === 'claw' && !GA.Fix.powerOut() && GA.Claw) { var ci = GA.Claw.promptInfo(cab.id) || { name: cab.game.name, desc: '' }; special = { tag: 'CLAW MACHINE', name: ci.name, desc: ci.desc, btn: 'PLAY', key: 'play the claw', cls: 'prize', pb: 'pzPlay' }; }
    else if (mp && GA.Fix.blocksHost()) special = { tag: GA.Fix.powerOut() ? 'NO POWER' : 'OUT OF ORDER', name: cab.game.name, desc: 'Hosting is offline until it\u2019s fixed. Get Gary from IT or fix the wires. Joining a friend with a code still works.', btn: isTouch ? 'FIX /<br>JOIN' : 'FIX / JOIN', key: 'see repair options', cls: 'broken' };
    else if (GA.Fix.powerOut()) special = { tag: 'NO POWER', name: cab.game.name, desc: 'The arcade lost power. Ask Gary from IT (IT Help Desk by the prize counter) to turn it back on.', btn: 'NO POWER', key: 'check', cls: 'broken' };
    $('prompt').classList.remove('npc', 'broken', 'prize', 'gallery', 'together'); $('playBtn').classList.remove('pzPlay', 'galPlay', 'togBtn'); chalBtn(false);
    if (special) {
      $('prompt').classList.remove('mp', 'bonus'); $('prompt').classList.add(special.cls);
      $('pTag').textContent = special.tag; $('pName').textContent = special.name; $('pDesc').textContent = special.desc;
      $('playBtn').innerHTML = special.btn; $('playBtn').classList.remove('mpBtn'); if (special.pb) $('playBtn').classList.add(special.pb); $('playBtn').setAttribute('data-game', cab.id); $('playBtn').removeAttribute('data-href');
      $('pKey').innerHTML = 'Press <kbd>E</kbd> or <kbd>Enter</kbd> to ' + special.key;
      $('prompt').classList.remove('hidden'); $('playBtn').classList.remove('hidden'); document.body.classList.add('near'); return;
    }
    $('prompt').classList.toggle('mp', mp);
    $('playBtn').innerHTML = mp ? (isTouch ? 'PLAY<br>ONLINE' : '&#9654; PLAY ONLINE') : '&#9654; PLAY';
    $('playBtn').classList.toggle('mpBtn', mp);
    $('pKey').innerHTML = mp ? 'Press <kbd>E</kbd> or <kbd>Enter</kbd> to open the lobby' : 'Press <kbd>E</kbd> or <kbd>Enter</kbd> to play';
    if (mp) {
      $('pTag').textContent = 'MULTIPLAYER'; $('pName').textContent = cab.game.name; $('pDesc').textContent = cab.game.desc;
      $('prompt').classList.remove('hidden'); $('playBtn').classList.remove('hidden'); $('playBtn').setAttribute('data-game', 'mp'); $('playBtn').removeAttribute('data-href');
      document.body.classList.add('near'); return;
    }
    $('prompt').classList.toggle('bonus', bonus);
    $('pTag').textContent = bonus ? 'BONUS MINI GAME' : 'MAIN GAME';
    var tm = hm() && !bonus ? hm().cabinetMode(cab) : null;
    if (tm) {
      var host = GA.HubMP.room().players().find(function (p) { return p.host; });
      $('prompt').classList.add('together'); $('playBtn').classList.add('togBtn');
      $('pTag').textContent = tm === 'launch' ? 'PLAY TOGETHER' : tm === 'suggest' ? 'ASK THE HOST' : 'SOLO ONLY';
      $('pName').textContent = cab.game.name;
      $('pDesc').textContent = tm === 'launch' ? 'Takes everyone in your room into ' + cab.game.name + ' online.' : tm === 'suggest' ? (host ? host.name : 'The host') + ' picks the game. Suggest this one and they can say yes!' : 'This one has no online mode. Leave the room to play it solo.';
      $('playBtn').innerHTML = tm === 'launch' ? (isTouch ? 'PLAY<br>ALL' : '&#9654; PLAY TOGETHER') : tm === 'suggest' ? 'SUGGEST' : (isTouch ? 'SOLO<br>ONLY' : 'SOLO ONLY');
      $('pKey').innerHTML = 'Press <kbd>E</kbd> or <kbd>Enter</kbd> to ' + (tm === 'launch' ? 'start it for everyone' : tm === 'suggest' ? 'suggest it' : 'see why');
      $('prompt').classList.remove('hidden'); $('playBtn').classList.remove('hidden'); $('playBtn').setAttribute('data-game', cab.id); $('playBtn').removeAttribute('data-href');
      document.body.classList.add('near'); return;
    }
    if (bonus && hm() && GA.HubMP.withFriends()) chalBtn(true, cab.id);
    $('pName').textContent = cab.game.name;
    $('pDesc').textContent = cab.game.desc + (bonus ? '  Best: ' + GA.getBest(cab.id) : '');
    $('prompt').classList.remove('hidden');
    $('playBtn').classList.remove('hidden');
    $('playBtn').setAttribute('data-game', cab.id);
    if (!bonus) $('playBtn').setAttribute('data-href', cab.game.url); else $('playBtn').removeAttribute('data-href');
    document.body.classList.add('near');
  }
  function chalBtn(on, id) {
    var b = $('chalBtn');
    if (!b) { if (!on) return; b = document.createElement('button'); b.id = 'chalBtn'; b.className = 'hidden'; b.innerHTML = '&#9876; CHALLENGE'; b.setAttribute('aria-label', 'Challenge your friends to this game');
      b.addEventListener('pointerdown', function (e) { e.stopPropagation(); }); b.addEventListener('click', function () { GA.Audio.unlock(); GA.HubMP.challenge(b.getAttribute('data-game')); }); $('hud').appendChild(b); }
    b.classList.toggle('hidden', !on); if (id) b.setAttribute('data-game', id);
  }
  function hidePrompt() {
    chalBtn(false);
    $('prompt').classList.add('hidden'); $('playBtn').classList.add('hidden');
    document.body.classList.remove('near');
  }

  /* ---------- quick menu ---------- */
  function card(g, bonus) {
    var d = document.createElement('div'); d.className = 'card'; d.style.setProperty('--c', g.color); d.setAttribute('data-game', g.id);
    d.innerHTML = '<div class="cName"></div><div class="cDesc"></div>' + (bonus ? '<div class="cBest"></div>' : '') +
      '<div class="cBtns"><button class="bPlay">&#9654; PLAY</button><button class="bGo">GO TO</button></div>';
    d.querySelector('.cName').textContent = g.name;
    d.querySelector('.cDesc').textContent = g.desc;
    var play = d.querySelector('.bPlay'), go = d.querySelector('.bGo');
    play.setAttribute('aria-label', 'Play ' + g.name); go.setAttribute('aria-label', 'Teleport to ' + g.name + ' cabinet');
    if (!bonus) play.setAttribute('data-href', g.url);
    play.addEventListener('click', function () {
      GA.Audio.unlock();
      if (bonus) GA.openBonus(g.id); else { closeMenu(true); GA.launchMain(g); }
    });
    go.addEventListener('click', function () { GA.Hub.teleport(g.id); closeMenu(); GA.Audio.play('near'); });
    return d;
  }
  function mpCard() {
    var d = document.createElement('div'); d.className = 'card mpCard'; d.style.setProperty('--c', '#3ff0ff'); d.setAttribute('data-game', 'mp');
    d.innerHTML = '<div class="cName">Multiplayer Antenna</div><div class="cDesc">Host or join a room and play Brawl, Grid, Land, Voxels or Sky with friends on their own phones (2-3 players).</div>' +
      '<div class="cBtns"><button class="bPlay bMp" id="menuMpOpen">&#9654; OPEN LOBBY</button><button class="bGo" id="menuMpGo">GO TO</button></div>';
    d.querySelector('.bPlay').addEventListener('click', function () { GA.Audio.unlock(); closeMenu(true); GA.MP.open(); });
    d.querySelector('.bGo').addEventListener('click', function () { GA.Hub.teleport('mp'); closeMenu(); GA.Audio.play('near'); });
    return d;
  }
  function pzCard(kind) {
    var d = document.createElement('div'), gal = kind === 'gallery'; d.className = 'card pzMenuCard'; d.style.setProperty('--c', gal ? '#3ff0ff' : '#ffe14d'); d.setAttribute('data-game', kind);
    d.innerHTML = '<div class="cName"></div><div class="cDesc"></div><div class="cBtns"><button class="bPlay"></button><button class="bGo">GO TO</button></div>';
    d.querySelector('.cName').textContent = gal ? 'Achievement Gallery' : 'Prize Counter';
    d.querySelector('.cDesc').textContent = gal ? 'Your prize shelves and every achievement, with progress toward the next ones.' : 'Trade your tickets for plushies, models, trophies and the Golden Joystick!';
    d.querySelector('.bPlay').innerHTML = gal ? '&#127942; OPEN' : '&#127903; REDEEM';
    d.querySelector('.bPlay').addEventListener('click', function () { GA.Audio.unlock(); closeMenu(true); if (gal) GA.PZ.openGallery(); else GA.PZ.openCounter(); });
    d.querySelector('.bGo').addEventListener('click', function () { GA.Hub.teleport(gal ? 'gallery' : 'prizes'); closeMenu(); GA.Audio.play('near'); });
    return d;
  }
  function clawCard() {
    var d = document.createElement('div'); d.className = 'card pzMenuCard'; d.style.setProperty('--c', '#c084fc'); d.setAttribute('data-game', 'claw');
    d.innerHTML = '<div class="cName">Claw Machines</div><div class="cDesc">Easy Claw + Tricky Claw by the prize counter. Win exclusive mini prizes for your gallery! New prizes every 3 days.</div><div class="cBtns"><button class="bPlay">&#129693; GO PLAY</button><button class="bGo">TRICKY</button></div>';
    d.querySelector('.bPlay').addEventListener('click', function () { GA.Hub.teleport('claw_easy'); closeMenu(); GA.Audio.play('near'); });
    d.querySelector('.bGo').addEventListener('click', function () { GA.Hub.teleport('claw_tricky'); closeMenu(); GA.Audio.play('near'); });
    return d;
  }
  function sbCard() {
    var d = document.createElement('div'); d.className = 'card pzMenuCard'; d.style.setProperty('--c', '#3ff0ff'); d.setAttribute('data-game', 'suggest');
    d.innerHTML = '<div class="cName">Suggestion Booth</div><div class="cDesc">Suggest patches (bugs, ideas, balance) for any game and check the Suggestion Board.</div><div class="cBtns"><button class="bPlay">&#128161; SUGGEST</button><button class="bGo">GO TO</button></div>';
    d.querySelector('.bPlay').addEventListener('click', function () { GA.Audio.unlock(); closeMenu(true); GA.SB.open(); });
    d.querySelector('.bGo').addEventListener('click', function () { GA.Hub.teleport('suggest'); closeMenu(); GA.Audio.play('near'); });
    return d;
  }
  function hallCard() {
    var d = document.createElement('div'); d.className = 'card pzMenuCard'; d.style.setProperty('--c', '#e8b84a'); d.setAttribute('data-game', 'hall');
    d.innerHTML = '<div class="cName">Hall of Game Records</div><div class="cDesc">Pictures, update history and playable old versions of every game. Curated (grumpily) by Gus.</div><div class="cBtns"><button class="bPlay">&#127963;&#65039; BROWSE</button><button class="bGo">GO TO</button></div>';
    d.querySelector('.bPlay').addEventListener('click', function () { GA.Audio.unlock(); closeMenu(true); GA.Hall.openDirectory(); });
    d.querySelector('.bGo').addEventListener('click', function () { GA.Hub.teleport('gus'); closeMenu(); GA.Audio.play('near'); });
    return d;
  }
  function dlcCard() {
    var d = document.createElement('div'); d.className = 'card pzMenuCard'; d.style.setProperty('--c', '#ff4fd8'); d.setAttribute('data-game', 'dlc');
    d.innerHTML = '<div class="cName">DLC Machine 3000</div><div class="cDesc">Invent expansion packs for any game, print a DLC ticket, watch the DLC Board and unlock shipped DLC with tickets.</div><div class="cBtns"><button class="bPlay">&#128424;&#65039; OPEN</button><button class="bGo">GO TO</button></div>';
    d.querySelector('.bPlay').addEventListener('click', function () { GA.Audio.unlock(); closeMenu(true); GA.DLC.open(); });
    d.querySelector('.bGo').addEventListener('click', function () { GA.Hub.teleport('dlc'); closeMenu(); GA.Audio.play('near'); });
    return d;
  }
  function buildMenu() {
    var gm = $('gridMain'), gb = $('gridBonus');
    var ph = document.createElement('h2'); ph.className = 'secTitle pzSec'; ph.innerHTML = 'Prizes, Records &amp; Suggestions <small>spend tickets &middot; trophies &middot; game history &middot; suggest patches &amp; DLC</small>';
    var pgd = document.createElement('div'); pgd.className = 'grid'; pgd.id = 'gridPrize'; pgd.appendChild(pzCard('prizes')); pgd.appendChild(pzCard('gallery')); pgd.appendChild(clawCard()); pgd.appendChild(sbCard()); if (GA.Hall) pgd.appendChild(hallCard()); if (GA.DLC) pgd.appendChild(dlcCard());
    var mainTitle = document.querySelector('#menuScroll .secTitle.main'); if (mainTitle) { mainTitle.parentNode.insertBefore(ph, mainTitle); mainTitle.parentNode.insertBefore(pgd, mainTitle); if (GA.Carry) GA.Carry.buildMenu(mainTitle); }
    $('gridMp').appendChild(mpCard());
    GA.MAIN_GAMES.forEach(function (g) { gm.appendChild(card(g, false)); });
    GA.BONUS_GAMES.forEach(function (g) { gb.appendChild(card(g, true)); });
    $('helpText').innerHTML = isTouch
      ? '<b>Controls:</b> left thumb = joystick to walk &middot; drag on the right side to look around &middot; walk up to a cabinet and tap the big PLAY button.'
      : '<b>Controls:</b> WASD / arrow keys to walk &middot; drag the mouse or Q / E to turn the camera &middot; E or Enter to play at a cabinet &middot; M or Tab opens this menu &middot; Esc closes.';
  }
  function refreshMenu() {
    Array.prototype.forEach.call(document.querySelectorAll('#gridBonus .card'), function (d) {
      d.querySelector('.cBest').textContent = 'Best: ' + GA.getBest(d.getAttribute('data-game'));
    });
    $('menuMute').textContent = 'Sound: ' + (GA.Audio.isMuted() ? 'OFF' : 'ON');
  }
  function openMenu() {
    if (!started || GA.MG.isOpen() || (GA.MP && GA.MP.isOpen()) || GA.Fix.isOpen() || pzOpen()) return;
    refreshMenu(); if (GA.Carry) GA.Carry.renderMenu(); menuIsOpen = true; $('menu').classList.remove('hidden'); GA.Hub.clearInput(); GA.Audio.play('menu');
    $('menuScroll').scrollTop = 0;
  }
  function closeMenu(silent) {
    if (!menuIsOpen) return;
    menuIsOpen = false; $('menu').classList.add('hidden'); if (!silent) GA.Audio.play('click');
  }
  GA.UI.openMenu = openMenu; GA.UI.closeMenu = closeMenu;
  GA.UI.refreshPrompt = function () { if (started) showPrompt(GA.Hub.near()); };

  /* ---------- start ---------- */
  function start() {
    if (started) return;
    started = true;
    GA.Audio.unlock();
    GA.Audio.play('start');
    $('title').classList.add('hidden');
    $('hud').classList.remove('hidden');
    GA.Hub.setEnabled(true);
    showPrompt(GA.Hub.near());
    setTimeout(function () { $('hint').style.opacity = '0.75'; }, 8000);
  }

  function init() {
    GA.MG.init();
    GA.MP.init();
    GA.onMpClose = function () { showPrompt(GA.Hub.near()); };
    if (GA.PZ) GA.PZ.onClose = function () { setTickets(GA.getTickets()); showPrompt(GA.Hub.near()); };
    if (GA.Claw) GA.Claw.onClose = function () { setTickets(GA.getTickets()); showPrompt(GA.Hub.near()); };
    if (GA.Hall) GA.Hall.onClose = function () { showPrompt(GA.Hub.near()); };
    if (GA.DLC) GA.DLC.onClose = function () { setTickets(GA.getTickets()); showPrompt(GA.Hub.near()); };
    buildMenu();
    setTickets(GA.getTickets());
    $('hint').textContent = isTouch ? 'Left: move  \u00b7  Right: drag to look  \u00b7  Walk up to a cabinet!' : 'WASD / arrows to walk \u00b7 drag mouse or Q/E to look \u00b7 E/Enter to play \u00b7 M for menu';
    $('titleHelp').innerHTML = isTouch
      ? 'Joystick on the left to walk &middot; drag on the right to look<br>Walk up to a cabinet and press <b>PLAY</b> &middot; <b>MENU</b> lists every game'
      : '<b>WASD</b> / arrows to walk &middot; drag mouse or <b>Q</b>/<b>E</b> to look<br><b>E</b> or <b>Enter</b> to play &middot; <b>M</b> or <b>Tab</b> for the quick menu';
    GA.Hub.init($('scene'));
    if (GA.Carry) GA.Carry.apply();
    GA.Fix.init();
    GA.Fix.onChange = function () { showPrompt(GA.Hub.near()); };
    GA.Hub.onNear = function (cab) { if (cab) GA.Audio.play('near'); showPrompt(cab); };
    GA.Hub.onArea = function (bonus, area) { var a = $('areaLabel'), hall = area === 'hall', AN = { food: 'FOOD COURT', roof: 'ROOFTOP PARTY', basement: 'SECRET BASEMENT', gallery: 'GAME GALLERY' }; a.textContent = AN[area] || (hall ? 'HALL OF RECORDS' : bonus ? 'BONUS ZONE' : 'ARCADE FLOOR'); a.classList.toggle('bonus', bonus); a.classList.toggle('hall', hall); ['food', 'roof', 'basement', 'gallery'].forEach(function (k) { a.classList.toggle('ar_' + k, area === k); }); if (bonus && started && GA.Prog) GA.Prog.event('bonusZone'); };

    $('startBtn').addEventListener('click', start);
    $('title').addEventListener('click', function (e) { if (e.target === $('title')) start(); });
    $('playBtn').addEventListener('click', function () { GA.Audio.unlock(); GA.interact(GA.Hub.near()); });
    $('playBtn').addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    $('menuBtn').addEventListener('click', function () { if (menuIsOpen) closeMenu(); else openMenu(); });
    $('menuClose').addEventListener('click', function () { closeMenu(); });
    $('menu').addEventListener('click', function (e) { if (e.target === $('menu')) closeMenu(); });
    $('muteBtn').addEventListener('click', function () { GA.Audio.toggle(); refreshMenu(); });
    $('menuMute').addEventListener('click', function () { GA.Audio.toggle(); refreshMenu(); });
    $('menuHome').addEventListener('click', function () { GA.Hub.home(); closeMenu(); });

    window.addEventListener('keydown', function (e) {
      if (GA.MG.isOpen() || (GA.MP && GA.MP.isOpen()) || GA.Fix.isOpen() || pzOpen()) return;
      if (!started) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); } return; }
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === 'm' || k === 'Tab') { e.preventDefault(); if (menuIsOpen) closeMenu(); else openMenu(); }
      else if (k === 'Escape' && menuIsOpen) { e.preventDefault(); closeMenu(); }
    });
    // block pinch-zoom / double-tap zoom on iOS
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    document.addEventListener('dblclick', function (e) { e.preventDefault(); });
    // coming back from an online game: skip the title and reopen the lobby room
    var prm = window.GrokNet && GrokNet.params();
    if (prm) { start(); GA.MP.resume(prm); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
