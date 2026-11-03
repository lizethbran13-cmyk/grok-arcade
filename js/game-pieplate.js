/* Grok Arcade - bonus game #51: Pie Plate Catch (Torty's Harvest Feast tie-in).
   Chef Mimo's haywire Ratita kitchen is flinging food! Slide Pi-rat's pie plate left/right to catch pies (+2) and corn (+1).
   Burnt toast costs a heart (3 hearts). Gets faster. */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'pieplate', name: 'Pie Plate Catch', ticketDiv: 1,
    howTouch: 'Chef Mimo\u2019s haywire Ratita kitchen is flinging food! DRAG (or hold left/right side) to slide the pie plate. Pies are worth 2, corn 1. Burnt toast costs a heart. 3 hearts.',
    howKeys: 'Chef Mimo\u2019s haywire Ratita kitchen is flinging food! Use \u2190 \u2192 (or A / D) to slide the pie plate. Pies are worth 2, corn 1. Burnt toast costs a heart. 3 hearts.',
    create: function (api) {
      var t, items, hearts, cx, vx, spawnT, left, right, drag, flash, msg, msgT, leaves;
      function say(s, c) { msg = [s, c]; msgT = 1; }
      function reset() { t = 0; items = []; hearts = 3; cx = api.W / 2; vx = 0; spawnT = 0.6; left = right = false; drag = null; flash = 0; msg = null; msgT = 0;
        leaves = []; for (var i = 0; i < 14; i++) leaves.push({ x: Math.random() * api.W, y: Math.random() * api.H, s: 0.6 + Math.random() * 0.8, a: Math.random() * 6 }); }
      function spawn() { var r = Math.random(), k = r < Math.min(0.34, 0.16 + t * 0.004) ? 'toast' : r < 0.62 ? 'pie' : 'corn';
        items.push({ x: 30 + Math.random() * (api.W - 60), y: -30, k: k, vy: (140 + t * 5) * (0.8 + Math.random() * 0.4), sw: Math.random() * 6 }); }
      function scene(c, W, H) {
        var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7c2d12'); g.addColorStop(0.55, '#ea580c'); g.addColorStop(1, '#fde68a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        leaves.forEach(function (l) { c.save(); c.translate(l.x, l.y); c.rotate(l.a); c.fillStyle = 'rgba(250,204,21,.45)'; c.beginPath(); c.ellipse(0, 0, 8 * l.s, 4 * l.s, 0, 0, 7); c.fill(); c.restore(); });
        c.fillStyle = '#475569'; c.fillRect(0, 0, W, 50); for (var k = 0; k < W; k += 24) { c.fillStyle = (k / 24) % 2 ? '#facc15' : '#111827'; c.beginPath(); c.moveTo(k, 50); c.lineTo(k + 12, 50); c.lineTo(k + 24, 58); c.lineTo(k + 12, 58); c.fill(); }
        U.text(c, 'CHEF MIMO\u2019S HAYWIRE KITCHEN \uD83E\uDD83', W / 2, 26, 16, '#fde047', 'center', '#000');
        c.fillStyle = '#92400e'; c.fillRect(0, H - 40, W, 40); c.fillStyle = '#b45309'; for (var j = 0; j < W; j += 40) c.fillRect(j, H - 40, 2, 40); }
      return {
        reset: reset,
        resize: function () { cx = U.clamp(cx || api.W / 2, 40, api.W - 40); },
        update: function (dt) { if (!api.playing) return; t += dt; if (msgT > 0) msgT -= dt; if (flash > 0) flash -= dt;
          leaves.forEach(function (l) { l.y += 30 * l.s * dt; l.a += dt; if (l.y > api.H) { l.y = -10; l.x = Math.random() * api.W; } });
          var acc = (right ? 1 : 0) - (left ? 1 : 0); if (drag != null) cx += (drag - cx) * Math.min(1, dt * 14); else { vx += acc * 2600 * dt; vx *= Math.exp(-8 * dt); cx += vx * dt; }
          cx = U.clamp(cx, 40, api.W - 40);
          spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(0.35, 0.9 - t * 0.012) * (0.7 + Math.random() * 0.6); }
          var py = api.H - 70;
          for (var i = items.length - 1; i >= 0; i--) { var it = items[i]; it.y += it.vy * dt; it.sw += dt;
            if (it.y > py - 12 && it.y < py + 12 && Math.abs(it.x - cx) < 44) { items.splice(i, 1);
              if (it.k === 'toast') { hearts--; flash = 0.3; api.sfx('lifelost'); say('Burnt toast! \uD83D\uDD25', '#fca5a5'); if (hearts <= 0) api.gameOver(); }
              else { var p = it.k === 'pie' ? 2 : 1; api.addScore(p); api.sfx(p > 1 ? 'perfect' : 'point'); say(p > 1 ? 'Pie! +2' : 'Corn! +1', '#4ade80'); }
              continue; }
            if (it.y > api.H + 30) items.splice(i, 1); } },
        draw: function (c) { var W = api.W, H = api.H; scene(c, W, H);
          c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = (W > 600 ? 42 : 32) + 'px system-ui, sans-serif';
          for (var i = 0; i < items.length; i++) { var it = items[i]; c.save(); c.translate(it.x, it.y); c.rotate(Math.sin(it.sw * 3) * 0.3); c.fillText(it.k === 'toast' ? '\uD83D\uDD25' : it.k === 'pie' ? '\uD83E\uDD67' : '\uD83C\uDF3D', 0, 0); c.restore(); }
          var py = H - 70; c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(cx, py + 14, 46, 7, 0, 0, 7); c.fill();
          var pg = c.createLinearGradient(0, py - 8, 0, py + 8); pg.addColorStop(0, '#ffffff'); pg.addColorStop(1, '#cbd5e1'); c.fillStyle = pg; c.strokeStyle = '#64748b'; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, py, 44, 10, 0, 0, 7); c.fill(); c.stroke();
          for (var h = 0; h < 3; h++) U.heart(c, 22 + h * 26, 84, 22, h < hearts ? '#ff4f8b' : 'rgba(255,255,255,.35)');
          if (msg && msgT > 0) { c.globalAlpha = Math.min(1, msgT * 2); U.text(c, msg[0], W / 2, H * 0.36, 24, msg[1], 'center', '#000'); c.globalAlpha = 1; }
          if (flash > 0) { c.fillStyle = 'rgba(239,68,68,' + (flash * 1.2) + ')'; c.fillRect(0, 0, W, H); } c.textBaseline = 'alphabetic'; },
        onDown: function (x) { drag = x; }, onMove: function (x, y, down) { if (down) drag = x; }, onUp: function () { drag = null; },
        onKey: function (k, down) { if (k === 'ArrowLeft' || k === 'a' || k === 'A') left = down; if (k === 'ArrowRight' || k === 'd' || k === 'D') right = down; }
      };
    }
  });
})();
