/* Grok Arcade - bonus game #49: Pup Drop Catch (Candy's RuffSources Rescue tie-in).
   Haywire Ratita gadgets are flinging puppies out of the Gadget Works! Slide Candy (with her rescue net) left/right
   to catch falling pups. Dodge the falling gadget bolts. Golden pups = +3. A dropped pup or a bolt = a lost heart (3). Gets faster. */
(function () {
  'use strict';
  var U = GA.MG.U;
  var COLS = ['#f5deb3', '#c08552', '#ffffff', '#3b2a1a', '#e8a33d', '#9ca3af'];
  GA.MG.register({
    id: 'pupdrop', name: 'Pup Drop Catch', ticketDiv: 1,
    howTouch: 'Pups are flying out of the haywire Ratita Gadget Works! DRAG (or hold left/right side) to slide Candy and her rescue net under them. Dodge the grey gadget bolts. Golden pups are worth 3. 3 hearts.',
    howKeys: 'Pups are flying out of the haywire Ratita Gadget Works! Use \u2190 \u2192 (or A / D) to slide Candy and her rescue net under them. Dodge the grey gadget bolts. Golden pups are worth 3. 3 hearts.',
    create: function (api) {
      var t, items, hearts, cx, vx, spawnT, sp, msg, msgT, left, right, drag, flash;
      function say(s, c) { msg = [s, c]; msgT = 1; }
      function reset() { t = 0; items = []; hearts = 3; cx = api.W / 2; vx = 0; spawnT = 0.6; sp = 150; msg = null; msgT = 0; left = right = false; drag = null; flash = 0; api.setScore(0); }
      function spawn() { var r = Math.random(), bolt = r < Math.min(0.32, 0.12 + t * 0.004), gold = !bolt && r > 0.93;
        items.push({ x: 30 + Math.random() * (api.W - 60), y: -30, k: bolt ? 'bolt' : gold ? 'gold' : 'pup', c: COLS[Math.floor(Math.random() * COLS.length)], vy: sp * (0.8 + Math.random() * 0.4), sw: Math.random() * 6, done: false }); }
      function drawPup(c, x, y, col, s, gold) { c.save(); c.translate(x, y); c.scale(s, s);
        if (gold) { c.shadowColor = '#fde047'; c.shadowBlur = 18; }
        c.fillStyle = gold ? '#facc15' : col; c.beginPath(); c.ellipse(0, 6, 15, 11, 0, 0, 7); c.fill(); c.beginPath(); c.arc(0, -8, 12, 0, 7); c.fill(); c.shadowBlur = 0;
        c.fillStyle = gold ? '#ca8a04' : '#6b4423'; c.beginPath(); c.ellipse(-11, -10, 5, 9, 0.5, 0, 7); c.ellipse(11, -10, 5, 9, -0.5, 0, 7); c.fill();
        c.fillStyle = '#111'; c.beginPath(); c.arc(-4, -9, 2.2, 0, 7); c.arc(4, -9, 2.2, 0, 7); c.arc(0, -4, 2.6, 0, 7); c.fill();
        c.fillStyle = '#ff4fa0'; c.fillRect(-9, 1, 18, 3); c.restore(); }
      function drawBolt(c, x, y, a) { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = '#94a3b8'; c.fillRect(-4, -14, 8, 22); c.fillStyle = '#64748b'; c.fillRect(-10, -18, 20, 7); c.fillStyle = '#facc15'; c.beginPath(); c.arc(0, 12, 3, 0, 7); c.fill(); c.restore(); }
      function drawCandy(c, x, y) { // miniature schnauzer: grey body, white beard + eyebrows, holding a pink net
        c.save(); c.translate(x, y);
        c.strokeStyle = '#be185d'; c.lineWidth = 4; c.beginPath(); c.moveTo(-6, -20); c.lineTo(-30, -44); c.moveTo(6, -20); c.lineTo(30, -44); c.stroke();
        c.fillStyle = 'rgba(244,114,182,.35)'; c.strokeStyle = '#f472b6'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, -46, 38, 10, 0, 0, 7); c.fill(); c.stroke();
        c.fillStyle = '#6b7280'; c.beginPath(); c.ellipse(0, 6, 26, 16, 0, 0, 7); c.fill(); c.beginPath(); c.arc(0, -10, 16, 0, 7); c.fill();
        c.fillStyle = '#4b5563'; c.beginPath(); c.moveTo(-13, -20); c.lineTo(-18, -34); c.lineTo(-5, -24); c.fill(); c.beginPath(); c.moveTo(13, -20); c.lineTo(18, -34); c.lineTo(5, -24); c.fill();
        c.fillStyle = '#e5e7eb'; c.beginPath(); c.ellipse(0, -1, 10, 9, 0, 0, 7); c.fill(); c.fillRect(-11, -16, 9, 3); c.fillRect(2, -16, 9, 3);
        c.fillStyle = '#111'; c.beginPath(); c.arc(-5, -11, 2.4, 0, 7); c.arc(5, -11, 2.4, 0, 7); c.arc(0, -5, 3, 0, 7); c.fill();
        c.fillStyle = '#ff4fa0'; c.fillRect(-12, 6, 24, 4); c.restore(); }
      return {
        reset: reset,
        resize: function () { cx = U.clamp(cx || api.W / 2, 40, api.W - 40); },
        update: function (dt) { if (!api.playing) return; t += dt; sp = Math.min(420, 150 + t * 5); if (msgT > 0) msgT -= dt; if (flash > 0) flash -= dt;
          var acc = (right ? 1 : 0) - (left ? 1 : 0); if (drag != null) cx += (drag - cx) * Math.min(1, dt * 14); else { vx += acc * 2600 * dt; vx *= Math.exp(-8 * dt); cx += vx * dt; }
          cx = U.clamp(cx, 40, api.W - 40);
          spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(0.38, 1.05 - t * 0.012) * (0.7 + Math.random() * 0.6); }
          var ny = api.H - 60 - 46;
          for (var i = items.length - 1; i >= 0; i--) { var it = items[i]; it.y += it.vy * dt; it.x += Math.sin(t * 3 + it.sw) * 20 * dt; it.sw += dt;
            if (!it.done && it.y > ny - 10 && it.y < ny + 14 && Math.abs(it.x - cx) < 40) { it.done = true; items.splice(i, 1);
              if (it.k === 'bolt') { hearts--; flash = 0.3; api.sfx('lifelost'); say('Ouch! Gadget bolt! \u26A1', '#fca5a5'); if (hearts <= 0) api.gameOver(); }
              else { var p = it.k === 'gold' ? 3 : 1; api.addScore(p); api.sfx(p > 1 ? 'perfect' : 'point'); say(p > 1 ? 'GOLDEN PUP! +3' : 'Caught! +1', '#4ade80'); }
              continue; }
            if (it.y > api.H + 30) { items.splice(i, 1); if (it.k !== 'bolt') { hearts--; flash = 0.3; api.sfx('lifelost'); say('A pup got away! \uD83D\uDE22', '#fca5a5'); if (hearts <= 0) api.gameOver(); } } } },
        draw: function (c) { var W = api.W, H = api.H;
          var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7dd3fc'); g.addColorStop(1, '#fbcfe8'); c.fillStyle = g; c.fillRect(0, 0, W, H);
          c.fillStyle = '#475569'; c.fillRect(0, 0, W, 44); c.fillStyle = '#334155'; for (var k = 0; k < W; k += 70) c.fillRect(k + 10, 44, 40, 10);
          U.text(c, 'RATITA GADGET WORKS \u2699\uFE0F (haywire!)', W / 2, 22, 16, '#fde047');
          c.fillStyle = '#4ade80'; c.fillRect(0, H - 40, W, 40); c.fillStyle = '#22c55e'; c.fillRect(0, H - 40, W, 6);
          for (var i = 0; i < items.length; i++) { var it = items[i]; if (it.k === 'bolt') drawBolt(c, it.x, it.y, t * 6 + it.sw); else drawPup(c, it.x, it.y, it.c, W > 600 ? 1.5 : 1.15, it.k === 'gold'); }
          c.save(); c.translate(cx, H - 60); var cs = W > 600 ? 1.35 : 1; c.scale(cs, cs); drawCandy(c, 0, 0); c.restore();
          for (var h = 0; h < 3; h++) U.heart(c, 22 + h * 26, 70, 22, h < hearts ? '#ff4f8b' : 'rgba(255,255,255,.35)');
          if (msg && msgT > 0) { c.globalAlpha = Math.min(1, msgT * 2); U.text(c, msg[0], W / 2, H * 0.36, 24, msg[1], 'center', '#000'); c.globalAlpha = 1; }
          if (flash > 0) { c.fillStyle = 'rgba(239,68,68,' + (flash * 1.2) + ')'; c.fillRect(0, 0, W, H); } },
        onDown: function (x) { drag = x; }, onMove: function (x, y, down) { if (down) drag = x; }, onUp: function () { drag = null; },
        onKey: function (k, down) { if (k === 'ArrowLeft' || k === 'a' || k === 'A') left = down; if (k === 'ArrowRight' || k === 'd' || k === 'D') right = down; }
      };
    }
  });
})();
