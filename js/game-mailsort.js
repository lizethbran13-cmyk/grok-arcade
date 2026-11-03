/* Grok Arcade - bonus game #48: Mail Sort Rush (Ratita Mail Tycoon tie-in).
   Postmaster Pi-rat's sorting belt! Parcels slide down the belt; TAP the bin that matches the stamp color
   (red SAME-DAY, blue 2-DAY, yellow LETTERS & MEDIA) while the parcel is in the sort zone. Guinea Pig Gang bling boxes: let them pass!
   Wrong bin or a missed parcel = a lost heart (3). Gets faster. */
(function () {
  'use strict';
  var U = GA.MG.U;
  var BINS = [['SAME-DAY', '#ef4444', '\u26A1'], ['2-DAY', '#3b82f6', '\uD83D\uDCE6'], ['LETTERS', '#facc15', '\u2709\uFE0F']];
  GA.MG.register({
    id: 'mailsort', name: 'Mail Sort Rush', ticketDiv: 1,
    howTouch: 'Parcels slide down Pi-rat\u2019s belt. When one is in the glowing SORT ZONE, TAP the bin with the same color stamp (red SAME-DAY, blue 2-DAY, yellow LETTERS). Shiny Guinea Pig Gang boxes: DON\u2019T sort them! 3 hearts.',
    howKeys: 'Parcels slide down Pi-rat\u2019s belt. When one is in the SORT ZONE, press 1, 2 or 3 (or \u2190 \u2193 \u2192) for the matching bin. Shiny Guinea Pig Gang boxes: DON\u2019T sort them! 3 hearts.',
    create: function (api) {
      var t, items, hearts, sp, spawnT, msg, msgT, combo, L = {};
      function layout() { var W = api.W, H = api.H; L.bx = W / 2; L.bw = Math.min(170, W * 0.36); L.zone = H * 0.58; L.zh = 70; L.binY = H - 70; L.binW = Math.min(150, (W - 40) / 3); }
      function say(s, c) { msg = [s, c]; msgT = 1; }
      function spawn() { var gang = Math.random() < Math.min(0.22, 0.06 + t * 0.003); items.push({ y: -40, k: gang ? -1 : Math.floor(Math.random() * 3), sz: 46 + Math.random() * 14, done: false }); }
      function inZone() { for (var i = 0; i < items.length; i++) { var it = items[i]; if (!it.done && Math.abs(it.y - L.zone) < L.zh / 2 + it.sz / 2) return it; } return null; }
      function sort(b) { if (!api.playing) return; var it = inZone(); if (!it) { api.sfx('bad'); say('Nothing in the zone!', '#fca5a5'); return; }
        it.done = true;
        if (it.k === -1) { hearts--; combo = 0; api.sfx('lifelost'); say('That was Squeak\u2019s bling box! \uD83D\uDC39', '#ff6b86'); if (hearts <= 0) api.gameOver(); return; }
        if (it.k === b) { combo++; var p = combo >= 5 ? 2 : 1; api.addScore(p); api.sfx(p > 1 ? 'perfect' : 'point'); say(p > 1 ? 'SORTED! COMBO +2' : 'SORTED! +1', '#4ade80'); sp = Math.min(380, sp + 6); }
        else { hearts--; combo = 0; api.sfx('lifelost'); say('Wrong bin! Bad delivery \uD83D\uDCA5', '#ff6b86'); if (hearts <= 0) api.gameOver(); } }
      function binX(i) { return api.W / 2 + (i - 1) * (L.binW + 10); }
      return {
        reset: function () { layout(); t = 0; items = []; hearts = 3; sp = 120; spawnT = 0.4; msgT = 0; combo = 0; },
        resize: function () { layout(); },
        update: function (dt) { t += dt; if (msgT > 0) msgT -= dt; if (!api.playing) return;
          spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(0.55, 1.5 - t * 0.012); }
          for (var i = items.length - 1; i >= 0; i--) { var it = items[i]; it.y += sp * dt;
            if (!it.done && it.y - it.sz / 2 > L.zone + L.zh / 2) { it.done = true; if (it.k >= 0) { hearts--; combo = 0; api.sfx('lifelost'); say('Missed! Late delivery \uD83D\uDCEC', '#ff6b86'); if (hearts <= 0) api.gameOver(); } else { api.addScore(1); say('Bling box rejected! +1', '#a7f3d0'); } }
            if (it.y > api.H + 60 || (it.done && it.k >= 0 && it.y > L.zone + 10 && it.fade === undefined)) { if (it.y > api.H + 60) items.splice(i, 1); } } },
        draw: function (c) { var W = api.W, H = api.H, i;
          var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1e3a8a'); g.addColorStop(1, '#0f172a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
          c.fillStyle = '#374151'; c.fillRect(L.bx - L.bw / 2, 0, L.bw, L.binY - 50); c.strokeStyle = '#9ca3af'; c.lineWidth = 2;
          for (i = 0; i < 16; i++) { var yy = ((t * sp) % 40) + i * 40 - 40; c.beginPath(); c.moveTo(L.bx - L.bw / 2, yy); c.lineTo(L.bx + L.bw / 2, yy); c.stroke(); }
          c.fillStyle = 'rgba(94,234,212,' + (0.18 + Math.sin(t * 5) * 0.06) + ')'; c.fillRect(L.bx - L.bw / 2 - 8, L.zone - L.zh / 2, L.bw + 16, L.zh); U.text(c, 'SORT ZONE', L.bx + L.bw / 2 + 12, L.zone, 14, '#5eead4', 'left');
          items.forEach(function (it) { if (it.done && it.k >= 0) return; var s = it.sz; c.save(); c.translate(L.bx, it.y);
            if (it.k === -1) { c.fillStyle = '#a855f7'; U.rr(c, -s / 2, -s / 2, s, s, 6); c.fill(); c.fillStyle = '#facc15'; for (var j = 0; j < 4; j++) { c.beginPath(); c.arc(-s / 3 + j * s / 4.5, -s / 3, 3, 0, 7); c.fill(); } U.text(c, '\uD83D\uDC39', 0, 4, s * 0.45, '#fff'); }
            else { c.fillStyle = it.k === 2 ? '#fef3c7' : '#d6a46c'; U.rr(c, -s / 2, -s * 0.38, s, s * 0.76, 5); c.fill(); c.fillStyle = it.k === 2 ? '#e5e7eb' : '#b45309'; c.fillRect(-2, -s * 0.38, 4, s * 0.76); c.fillStyle = BINS[it.k][1]; c.fillRect(s / 2 - 16, -s * 0.38 + 4, 12, 12); }
            c.restore(); });
          for (i = 0; i < 3; i++) { var x = binX(i); c.fillStyle = BINS[i][1]; U.rr(c, x - L.binW / 2, L.binY - 38, L.binW, 76, 10); c.fill(); U.text(c, BINS[i][2] + ' ' + BINS[i][0], x, L.binY - 8, 16, '#111'); U.text(c, api.touch ? 'TAP' : String(i + 1), x, L.binY + 20, 14, '#111'); }
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ff4f8b' : 'rgba(255,255,255,.25)');
          U.text(c, String(api.score), W - 16, 30, 30, '#fff', 'right'); U.text(c, '\uD83D\uDC00 Postmaster Pi-rat', W / 2, 30, 16, '#fde68a');
          if (msgT > 0) U.text(c, msg[0], W / 2, L.zone - L.zh, 22, msg[1], 'center', '#000'); },
        onDown: function (x, y) { if (y < L.binY - 50) return; var best = 0, bd = 1e9; for (var i = 0; i < 3; i++) { var d = Math.abs(x - binX(i)); if (d < bd) { bd = d; best = i; } } sort(best); },
        onKey: function (k, down) { if (!down) return; var m = { '1': 0, '2': 1, '3': 2, ArrowLeft: 0, ArrowDown: 1, ArrowRight: 2 }; if (k in m) sort(m[k]); }
      };
    }
  });
})();
