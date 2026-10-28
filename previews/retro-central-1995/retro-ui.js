/* Grok Arcade — RETRO CENTRAL (1995) UI, Modals, CRT Emulator Controls & Labels (Issue #88) */
(function () {
  'use strict';
  var RC = window.RC95 = window.RC95 || {};

  var labelEls = {};
  var nearestItem = null;
  var activeDialogNpc = null;
  var dialogQuoteIdx = 0;

  function el(id) { return document.getElementById(id); }

  /* ---------- Top HUD Refresh ---------- */
  RC.refreshHud = function () {
    var s = RC.load();
    var tixEl = el('hudTickets');
    var ownEl = el('hudOwnedConsoles');
    var starsEl = el('hudStars64');
    if (tixEl) tixEl.textContent = RC.getTickets();
    if (ownEl) ownEl.textContent = RC.ownedCount() + ' / ' + RC.CONSOLES.length;
    if (starsEl) starsEl.textContent = s.stars64 || 0;
  };
  RC.onHudChange = RC.refreshHud;

  /* ---------- 3D World Floating Labels & Proximity Prompt ---------- */
  RC.updateWorldLabels = function () {
    var cam = RC.getCamera && RC.getCamera();
    var pl = RC.getPlayer && RC.getPlayer();
    var items = RC.getInteractables ? RC.getInteractables() : [];
    var layer = el('labelsLayer');
    if (!cam || !pl || !layer) return;

    var W = window.innerWidth, H = window.innerHeight;
    var best = null, bestDist = 3.9;

    items.forEach(function (it) {
      var dom = labelEls[it.id];
      if (!dom) {
        dom = document.createElement('div');
        dom.className = 'world-label ' + (it.cssClass || '');
        dom.textContent = it.label;
        dom.onclick = function () { RC.activateInteractable(it); };
        layer.appendChild(dom);
        labelEls[it.id] = dom;
      }

      var v = new THREE.Vector3(it.wx != null ? it.wx : it.x, it.labelY || 2.2, it.wz != null ? it.wz : it.z);
      v.project(cam);
      if (v.z > 1) {
        dom.style.display = 'none';
      } else {
        var sx = (v.x * 0.5 + 0.5) * W;
        var sy = (-v.y * 0.5 + 0.5) * H;
        dom.style.display = 'block';
        dom.style.left = sx + 'px';
        dom.style.top = sy + 'px';
      }

      var d = Math.hypot(pl.x - it.x, pl.z - it.z);
      if (d < bestDist) {
        bestDist = d;
        best = it;
      }
    });

    nearestItem = best;
    var promptEl = el('interactPrompt');
    var promptText = el('interactPromptText');
    if (promptEl && promptText) {
      if (best && !RC.isGameOpen()) {
        promptEl.style.display = 'inline-flex';
        promptText.textContent = best.prompt || best.label;
      } else {
        promptEl.style.display = 'none';
      }
    }
  };

  RC.triggerNearestInteractable = function () {
    if (nearestItem) RC.activateInteractable(nearestItem);
  };

  RC.activateInteractable = function (it) {
    if (!it) return;
    if (it.kind === 'stand') {
      RC.openConsoleStandModal();
    } else if (it.kind === 'home_tv') {
      var s = RC.load();
      var c = RC.CONSOLES.find(function (x) { return x.id === s.activeConsole; }) || RC.CONSOLES[3];
      RC.openCrtGame(c.gameId, true);
    } else if (it.kind === 'game') {
      RC.openCrtGame(it.gameId, false);
    } else if (it.kind === 'npc') {
      RC.openNpcDialog(it.npcId);
    }
  };

  /* ---------- NPC & Family Pet Dialog Box ---------- */
  RC.openNpcDialog = function (npcId) {
    var npc = RC.NPCS[npcId];
    if (!npc) return;
    var s = RC.load();
    if (npcId.indexOf('pet_') === 0) {
      s.petsMet[npcId] = true;
      RC.save();
    }
    RC.sfx('talk');
    activeDialogNpc = npc;
    dialogQuoteIdx = 0;
    renderNpcDialog();
    el('dialogBox').style.display = 'block';
  };

  function renderNpcDialog() {
    if (!activeDialogNpc) return;
    el('dlgName').textContent = activeDialogNpc.name + (activeDialogNpc.sound ? ' · "' + activeDialogNpc.sound + '"' : '');
    el('dlgRole').textContent = activeDialogNpc.role;
    el('dlgBody').textContent = activeDialogNpc.quotes[dialogQuoteIdx % activeDialogNpc.quotes.length];
  }

  RC.nextNpcQuote = function () {
    if (!activeDialogNpc) return;
    dialogQuoteIdx++;
    RC.sfx('talk');
    if (dialogQuoteIdx >= activeDialogNpc.quotes.length) {
      el('dialogBox').style.display = 'none';
      activeDialogNpc = null;
    } else {
      renderNpcDialog();
    }
  };

  RC.closeNpcDialog = function () {
    el('dialogBox').style.display = 'none';
    activeDialogNpc = null;
  };

  /* ---------- Gary's 1995 Console Emporium Modal (Buy & Deliver to Retro Home) ---------- */
  RC.openConsoleStandModal = function () {
    RC.sfx('talk');
    renderConsoleStandCards();
    el('standModal').style.display = 'flex';
  };

  RC.closeConsoleStandModal = function () {
    el('standModal').style.display = 'none';
  };

  function renderConsoleStandCards() {
    var grid = el('consoleStandGrid');
    if (!grid) return;
    var s = RC.load();
    el('standTicketCount').textContent = RC.getTickets();
    el('standOwnedCount').textContent = RC.ownedCount() + ' / ' + RC.CONSOLES.length;

    grid.innerHTML = '';
    RC.CONSOLES.forEach(function (c) {
      var isOwned = !!s.owned[c.id];
      var isActive = s.activeConsole === c.id;
      var card = document.createElement('div');
      card.className = 'console-card' + (isOwned ? ' owned' : '') + (isActive ? ' active-tv' : '');

      card.innerHTML =
        '<div>' +
          '<div class="console-badge-row">' +
            '<span class="era-tag">' + c.era + '</span>' +
            '<span class="own-tag ' + (isOwned ? '' : 'price') + '">' +
              (isOwned ? (isActive ? '★ ON HOME CRT TV' : '✓ IN RETRO HOME') : ('🎟️ ' + c.price + ' TIX')) +
            '</span>' +
          '</div>' +
          '<div class="console-name" style="margin-top:6px">' + c.name + '</div>' +
          '<div class="console-maker">' + c.maker + '</div>' +
          '<p class="console-desc">' + c.desc + '</p>' +
        '</div>' +
        '<div>' +
          '<div class="console-game-box" style="margin-bottom:8px">' +
            '<div class="console-game-title">🎮 ' + c.gameTitle + '</div>' +
            '<div class="console-game-sub">' + c.gameSub + '</div>' +
          '</div>' +
          '<div class="console-card-btns"></div>' +
        '</div>';

      var btnWrap = card.querySelector('.console-card-btns');

      var buyOrHookBtn = document.createElement('button');
      buyOrHookBtn.className = 'hud-btn ' + (isOwned ? 'cyan' : 'gold');
      buyOrHookBtn.textContent = isOwned
        ? (isActive ? '✓ Hooked to Home TV' : '📺 Hook Up to Home TV')
        : ('🛒 Buy & Deliver (' + c.price + ' Tix)');
      buyOrHookBtn.onclick = function () {
        var res = RC.buyConsole(c.id);
        if (!res.ok) {
          alert(res.msg);
          return;
        }
        renderConsoleStandCards();
        RC.refreshHud();
      };
      btnWrap.appendChild(buyOrHookBtn);

      var playNowBtn = document.createElement('button');
      playNowBtn.className = 'hud-btn primary';
      playNowBtn.textContent = '▶ Play ' + c.shortName;
      playNowBtn.onclick = function () {
        if (!s.owned[c.id]) RC.buyConsole(c.id);
        s.activeConsole = c.id;
        RC.save();
        if (RC.refreshHomeConsoles) RC.refreshHomeConsoles();
        RC.closeConsoleStandModal();
        RC.openCrtGame(c.gameId, true);
      };
      btnWrap.appendChild(playNowBtn);

      grid.appendChild(card);
    });
  }

  /* ---------- 1995 CRT Tube TV Game Emulator Overlay ---------- */
  RC.openCrtGame = function (gameId, fromHomeTv) {
    var gInfo = RC.GAMES[gameId] || RC.GAMES.torty64;
    var s = RC.load();
    if (gInfo.consoleId && s.owned[gInfo.consoleId]) {
      s.activeConsole = gInfo.consoleId;
      RC.save();
      if (RC.refreshHomeConsoles) RC.refreshHomeConsoles();
    }

    el('crtTitle').textContent = gInfo.title + ' (' + gInfo.year + ')';
    el('crtSub').textContent = gInfo.consoleName + (fromHomeTv ? ' · Playing on Your 1995 Home 32" CRT Tube TV' : ' · Playing on 1995 Mall Kiosk');
    el('crtControlsHint').textContent = gInfo.controls + ' — ' + gInfo.goal;

    renderCrtConsoleSwitcher(gameId);
    el('crtOverlay').style.display = 'flex';
    RC.startGame(gameId, el('crtCanvas'));
  };

  function renderCrtConsoleSwitcher(currentGameId) {
    var bar = el('crtSwitcherBar');
    if (!bar) return;
    bar.innerHTML = '';
    RC.CONSOLES.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'crt-switch-btn' + (c.gameId === currentGameId ? ' active' : '');
      b.textContent = c.shortName + ': ' + c.gameTitle.split(':')[0];
      b.onclick = function () {
        var s = RC.load();
        s.owned[c.id] = true;
        s.activeConsole = c.id;
        RC.save();
        if (RC.refreshHomeConsoles) RC.refreshHomeConsoles();
        RC.refreshHud();
        RC.openCrtGame(c.gameId, true);
      };
      bar.appendChild(b);
    });
  }

  RC.closeCrtGame = function () {
    RC.stopGame();
    el('crtOverlay').style.display = 'none';
    RC.refreshHud();
  };

  /* ---------- Bind Touch & UI Buttons ---------- */
  function bindTouchHold(btnEl, onDown, onUp) {
    if (!btnEl) return;
    btnEl.addEventListener('pointerdown', function (e) { e.preventDefault(); onDown(); });
    btnEl.addEventListener('pointerup', function (e) { e.preventDefault(); onUp(); });
    btnEl.addEventListener('pointerleave', function () { onUp(); });
    btnEl.addEventListener('pointercancel', function () { onUp(); });
  }

  RC.initUI = function () {
    RC.load();
    RC.refreshHud();

    // Top HUD & Zone Warp buttons
    el('btnOpenStand').onclick = function () { RC.openConsoleStandModal(); };
    el('btnPlayTorty64').onclick = function () { RC.openCrtGame('torty64', false); };
    el('btnPlaySpeedRat').onclick = function () { RC.openCrtGame('speedrat1', false); };
    el('btnWarpPlaza').onclick = function () { RC.warpTo('plaza'); };
    el('btnWarpStand').onclick = function () { RC.warpTo('stand'); };
    el('btnWarpHome').onclick = function () { RC.warpTo('home'); };
    el('btnWarpPets').onclick = function () { RC.warpTo('pets'); };

    el('interactPrompt').onclick = function () { RC.triggerNearestInteractable(); };

    // Console stand buttons
    el('btnUnlockAllConsoles').onclick = function () {
      RC.unlockAllConsoles();
      renderConsoleStandCards();
      RC.refreshHud();
    };
    el('btnGrantTickets').onclick = function () {
      RC.addTickets(200);
      RC.sfx('buy');
      renderConsoleStandCards();
      RC.refreshHud();
    };
    el('btnCloseStand').onclick = function () { RC.closeConsoleStandModal(); };
    el('btnStandGoHome').onclick = function () {
      RC.closeConsoleStandModal();
      RC.warpTo('home');
    };

    // NPC dialog buttons
    el('btnDlgNext').onclick = function () { RC.nextNpcQuote(); };
    el('btnDlgClose').onclick = function () { RC.closeNpcDialog(); };

    // CRT Emulator buttons
    el('btnCloseCrt').onclick = function () { RC.closeCrtGame(); };
    el('btnToggleScanlines').onclick = function () {
      var sc = el('crtScanlines');
      if (sc) sc.style.display = sc.style.display === 'none' ? 'block' : 'none';
    };

    // CRT Touch Gamepad buttons
    bindTouchHold(el('padLeft'), function () { RC.setGameInput('left', true); }, function () { RC.setGameInput('left', false); });
    bindTouchHold(el('padRight'), function () { RC.setGameInput('right', true); }, function () { RC.setGameInput('right', false); });
    bindTouchHold(el('padUp'), function () { RC.setGameInput('up', true); }, function () { RC.setGameInput('up', false); });
    bindTouchHold(el('padDown'), function () { RC.setGameInput('down', true); }, function () { RC.setGameInput('down', false); });
    bindTouchHold(el('padJump'), function () { RC.setGameInput('jump', true); }, function () { RC.setGameInput('jump', false); });
    bindTouchHold(el('padAct'), function () { RC.setGameInput('action', true); }, function () { RC.setGameInput('action', false); });

    // Mobile Walk D-Pad
    bindTouchHold(el('walkUp'), function () { RC.setWalkKey('w', true); }, function () { RC.setWalkKey('w', false); });
    bindTouchHold(el('walkDown'), function () { RC.setWalkKey('s', true); }, function () { RC.setWalkKey('s', false); });
    bindTouchHold(el('walkLeft'), function () { RC.setWalkKey('a', true); }, function () { RC.setWalkKey('a', false); });
    bindTouchHold(el('walkRight'), function () { RC.setWalkKey('d', true); }, function () { RC.setWalkKey('d', false); });
  };
})();
