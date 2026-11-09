/* Grok Arcade - bonus game #52: Sled Dash (Candy's Snow Day tie-in).
   Candy zooms down Sled Hill! Steer left/right between the pines and rocks, grab cocoa mugs (+1) and golden bones (+3).
   Hitting a tree or rock costs a heart (3 hearts). The hill gets faster. */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'sleddash', name: 'Sled Dash', ticketDiv: 1,
    howTouch: 'Candy is zooming down Sled Hill! DRAG left/right to steer the sled. Cocoa is worth 1, golden bones 3. Trees and rocks cost a heart. 3 hearts.',
    howKeys: 'Candy is zooming down Sled Hill! Use \u2190 \u2192 (or A / D) to steer the sled. Cocoa is worth 1, golden bones 3. Trees and rocks cost a heart. 3 hearts.',
    create: function (api) {
      var t, items, hearts, cx, vx, spawnT, left, right, drag, flash, msg, msgT, flakes, trail, inv, scroll;
      function say(s, c) { msg = [s, c]; msgT = 1; }
      function reset() { t = 0; items = []; hearts = 3; cx = api.W / 2; vx = 0; spawnT = 0.5; left = right = false; drag = null; flash = 0; msg = null; msgT = 0; trail = []; inv = 0; scroll = 0;
        flakes = []; for (var i = 0; i < 40; i++) flakes.push({ x: Math.random() * api.W, y: Math.random() * api.H, s: 0.5 + Math.random() }); }
      function speed() { return 170 + Math.min(260, t * 7); }
      function spawn() { var r = Math.random(), k = r < 0.5 ? 'tree' : r < 0.62 ? 'rock' : r < 0.93 ? 'cocoa' : 'bone';
        var x = 24 + Math.random() * (api.W - 48);
        if (k === 'tree' && Math.random() < Math.min(0.5, t * 0.012)) items.push({ x: U.clamp(x + (Math.random() < 0.5 ? -70 : 70), 24, api.W - 24), y: -40, k: 'tree' });
        items.push({ x: x, y: -40, k: k, a: Math.random() * 6 }); }
      function drawPine(c, x, y, s) { c.fillStyle = '#5b3a24'; c.fillRect(x - 3 * s, y + 8 * s, 6 * s, 9 * s);
        for (var i = 0; i < 3; i++) { var yy = y - 14 * s + i * 9 * s, w = (9 + i * 5) * s; c.fillStyle = i % 2 ? '#1f5a3a' : '#24653f'; c.beginPath(); c.moveTo(x, yy - 9 * s); c.lineTo(x + w, yy + 9 * s); c.lineTo(x - w, yy + 9 * s); c.closePath(); c.fill();
          c.fillStyle = '#f5f9ff'; c.beginPath(); c.moveTo(x, yy - 9 * s); c.lineTo(x + w * 0.45, yy - 1 * s); c.lineTo(x - w * 0.45, yy - 1 * s); c.closePath(); c.fill(); } }
      function drawSled(c, x, y) { c.save(); c.translate(x, y); c.rotate(U.clamp(vx / 1800, -0.35, 0.35));
        c.fillStyle = '#9ca3af'; c.fillRect(-15, -22, 3, 44); c.fillRect(12, -22, 3, 44); c.fillStyle = '#b07a45'; U.rr(c, -13, -18, 26, 38, 4); c.fill(); c.fillStyle = '#dc2626'; c.fillRect(-14, -18, 28, 4);
        c.fillStyle = '#6b7280'; c.beginPath(); c.ellipse(0, 6, 10, 13, 0, 0, 7); c.fill(); c.fillStyle = '#9ca3af'; c.beginPath(); c.ellipse(0, -8, 8, 7, 0, 0, 7); c.fill(); // Candy (schnauzer, from above)
        c.fillStyle = '#4b5563'; c.beginPath(); c.ellipse(-6, -11, 3, 5, -0.4, 0, 7); c.ellipse(6, -11, 3, 5, 0.4, 0, 7); c.fill(); c.fillStyle = '#e5e7eb'; c.beginPath(); c.ellipse(0, -15, 5, 3, 0, 0, 7); c.fill();
        c.fillStyle = '#dc2626'; c.fillRect(-9, -3, 18, 4); c.restore(); }
      function scene(c, W, H) { c.fillStyle = '#eef4fb'; c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(147,197,253,.35)'; c.lineWidth = 2; for (var k = 0; k < 6; k++) { var yy = ((scroll * 0.9 + k * H / 6) % H); c.beginPath(); c.moveTo(0, yy); c.quadraticCurveTo(W / 2, yy + 18, W, yy); c.stroke(); }
        c.fillStyle = 'rgba(203,213,225,.7)'; for (var i = 0; i < trail.length; i++) { var p = trail[i]; c.fillRect(p[0] - 14, p[1], 3, 4); c.fillRect(p[0] + 12, p[1], 3, 4); }
        c.fillStyle = '#1e3a8a'; c.fillRect(0, 0, W, 46); U.text(c, '\uD83D\uDEF7 CANDY\u2019S SLED DASH', W / 2, 24, 17, '#e0f2fe', 'center', '#000'); }
      return {
        reset: reset,
        resize: function () { cx = U.clamp(cx || api.W / 2, 24, api.W - 24); },
        update: function (dt) { flakes.forEach(function (f) { f.y += 50 * f.s * dt; f.x += Math.sin(f.y * 0.02) * 0.3; if (f.y > api.H) { f.y = -4; f.x = Math.random() * api.W; } });
          if (!api.playing) return; t += dt; if (msgT > 0) msgT -= dt; if (flash > 0) flash -= dt; if (inv > 0) inv -= dt; var sp = speed(); scroll += sp * dt;
          var acc = (right ? 1 : 0) - (left ? 1 : 0); if (drag != null) { var nx = cx + (drag - cx) * Math.min(1, dt * 12); vx = (nx - cx) / Math.max(dt, 1e-3); cx = nx; } else { vx += acc * 2600 * dt; vx *= Math.exp(-7 * dt); cx += vx * dt; }
          cx = U.clamp(cx, 24, api.W - 24); var py = api.H - 90;
          trail.forEach(function (p) { p[1] += sp * dt; }); trail.push([cx, py + 20]); while (trail.length && trail[0][1] > api.H) trail.shift(); if (trail.length > 120) trail.shift();
          spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(0.28, 0.75 - t * 0.01) * (0.7 + Math.random() * 0.6); }
          for (var i = items.length - 1; i >= 0; i--) { var it = items[i]; it.y += sp * dt; if (it.a != null) it.a += dt * 3;
            var hitR = it.k === 'tree' ? 18 : it.k === 'rock' ? 17 : 22;
            if (Math.abs(it.y - py) < hitR + 8 && Math.abs(it.x - cx) < hitR) {
              if (it.k === 'tree' || it.k === 'rock') { if (inv > 0) continue; items.splice(i, 1); hearts--; flash = 0.3; inv = 1.0; api.sfx('lifelost'); say(it.k === 'tree' ? 'Bonk! A pine tree \uD83C\uDF32' : 'Ouch! A rock \uD83E\uDEA8', '#fca5a5'); if (hearts <= 0) api.gameOver(); }
              else { items.splice(i, 1); var p2 = it.k === 'bone' ? 3 : 1; api.addScore(p2); api.sfx(p2 > 1 ? 'perfect' : 'point'); say(p2 > 1 ? 'Golden bone! +3' : 'Cocoa! +1', '#16a34a'); }
              continue; }
            if (it.y > api.H + 40) items.splice(i, 1); } },
        draw: function (c) { var W = api.W, H = api.H; scene(c, W, H); c.textAlign = 'center'; c.textBaseline = 'middle';
          for (var i = 0; i < items.length; i++) { var it = items[i];
            if (it.k === 'tree') drawPine(c, it.x, it.y, 1.3);
            else if (it.k === 'rock') { c.fillStyle = '#8b93a1'; c.beginPath(); c.ellipse(it.x, it.y, 17, 12, 0, 0, 7); c.fill(); c.fillStyle = '#f6f9ff'; c.beginPath(); c.ellipse(it.x - 2, it.y - 6, 12, 5, 0, 0, 7); c.fill(); }
            else { c.save(); c.translate(it.x, it.y); c.rotate(Math.sin(it.a) * 0.25); c.font = '28px system-ui, sans-serif'; c.fillText(it.k === 'bone' ? '\uD83E\uDDB4' : '\u2615', 0, 0); if (it.k === 'bone') { c.globalAlpha = 0.35; c.fillStyle = '#facc15'; c.beginPath(); c.arc(0, 0, 20, 0, 7); c.fill(); c.globalAlpha = 1; } c.restore(); } }
          if (!(inv > 0 && ((t * 12) | 0) % 2)) drawSled(c, cx, H - 90);
          c.fillStyle = 'rgba(255,255,255,.9)'; flakes.forEach(function (f) { c.fillRect(f.x, f.y, 2.5 * f.s, 2.5 * f.s); });
          for (var h = 0; h < 3; h++) U.heart(c, 22 + h * 26, 66, 22, h < hearts ? '#ff4f8b' : 'rgba(30,58,138,.25)');
          if (msg && msgT > 0) { c.globalAlpha = Math.min(1, msgT * 2); U.text(c, msg[0], W / 2, H * 0.36, 22, msg[1], 'center', '#fff'); c.globalAlpha = 1; }
          if (flash > 0) { c.fillStyle = 'rgba(239,68,68,' + (flash * 1.2) + ')'; c.fillRect(0, 0, W, H); } c.textBaseline = 'alphabetic'; },
        onDown: function (x) { drag = x; }, onMove: function (x, y, down) { if (down !== false) drag = x; }, onUp: function () { drag = null; },
        onKey: function (k, down) { if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'KeyA') left = down; if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'KeyD') right = down; }
      };
    }
  });
})();
