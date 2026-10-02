/* Grok Arcade - UI glue: title, HUD, prompt, quick menu, launching */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
  if (isTouch) document.body.classList.add('touch');
  var menuIsOpen = false, started = false, launching = false;

  GA.UI = { menuOpen: function () { return menuIsOpen; } };

  function setTickets(n) { $('ticketCount').textContent = n; }
  GA.onTickets = function (n) { setTickets(n); };

  /* ---------- launching ---------- */
  GA.launchMain = function (game) {
    if (launching) return;
    launching = true;
    GA.lastLaunch = game.url;
    GA.Hub.savePos();
    GA.Audio.play('launch');
    $('fade').classList.add('on');
    setTimeout(function () { location.href = game.url; }, 320);
    // if navigation is blocked or the user comes back via bfcache, recover
    setTimeout(function () { launching = false; $('fade').classList.remove('on'); }, 4000);
  };
  GA.openBonus = function (id) {
    closeMenu(true);
    GA.Hub.setPaused(true);
    hidePrompt();
    GA.MG.open(id);
  };
  GA.interact = function (cab) {
    if (!cab || menuIsOpen || GA.MG.isOpen()) return;
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
    if (!cab || !started || GA.MG.isOpen()) { hidePrompt(); return; }
    var bonus = cab.kind === 'bonus';
    $('prompt').classList.toggle('bonus', bonus);
    $('pTag').textContent = bonus ? 'BONUS MINI GAME' : 'MAIN GAME';
    $('pName').textContent = cab.game.name;
    $('pDesc').textContent = cab.game.desc + (bonus ? '  Best: ' + GA.getBest(cab.id) : '');
    $('prompt').classList.remove('hidden');
    $('playBtn').classList.remove('hidden');
    $('playBtn').setAttribute('data-game', cab.id);
    if (!bonus) $('playBtn').setAttribute('data-href', cab.game.url); else $('playBtn').removeAttribute('data-href');
    document.body.classList.add('near');
  }
  function hidePrompt() {
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
  function buildMenu() {
    var gm = $('gridMain'), gb = $('gridBonus');
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
    if (!started || GA.MG.isOpen()) return;
    refreshMenu(); menuIsOpen = true; $('menu').classList.remove('hidden'); GA.Hub.clearInput(); GA.Audio.play('menu');
    $('menuScroll').scrollTop = 0;
  }
  function closeMenu(silent) {
    if (!menuIsOpen) return;
    menuIsOpen = false; $('menu').classList.add('hidden'); if (!silent) GA.Audio.play('click');
  }
  GA.UI.openMenu = openMenu; GA.UI.closeMenu = closeMenu;

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
    buildMenu();
    setTickets(GA.getTickets());
    $('hint').textContent = isTouch ? 'Left: move  \u00b7  Right: drag to look  \u00b7  Walk up to a cabinet!' : 'WASD / arrows to walk \u00b7 drag mouse or Q/E to look \u00b7 E/Enter to play \u00b7 M for menu';
    $('titleHelp').innerHTML = isTouch
      ? 'Joystick on the left to walk &middot; drag on the right to look<br>Walk up to a cabinet and press <b>PLAY</b> &middot; <b>MENU</b> lists every game'
      : '<b>WASD</b> / arrows to walk &middot; drag mouse or <b>Q</b>/<b>E</b> to look<br><b>E</b> or <b>Enter</b> to play &middot; <b>M</b> or <b>Tab</b> for the quick menu';
    GA.Hub.init($('scene'));
    GA.Hub.onNear = function (cab) { if (cab) GA.Audio.play('near'); showPrompt(cab); };
    GA.Hub.onArea = function (bonus) { var a = $('areaLabel'); a.textContent = bonus ? 'BONUS ZONE' : 'MAIN GAMES'; a.classList.toggle('bonus', bonus); };

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
      if (GA.MG.isOpen()) return;
      if (!started) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); } return; }
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === 'm' || k === 'Tab') { e.preventDefault(); if (menuIsOpen) closeMenu(); else openMenu(); }
      else if (k === 'Escape' && menuIsOpen) { e.preventDefault(); closeMenu(); }
    });
    // block pinch-zoom / double-tap zoom on iOS
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    document.addEventListener('dblclick', function (e) { e.preventDefault(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
