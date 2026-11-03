/* Grok Arcade - bonus game #22: Meteor Mayhem (Grok Disaster Zone tie-in).
   Meteors rain on Grok City! Red warning circles show where each one will land - drag (or arrow keys) to run out of them.
   Grab coins (+1) and gold stars (+5); a meteor that lands right next to you without hitting is a CLOSE CALL (+2).
   Umbrellas block one hit. 3 hearts; meteors get faster and bigger the longer you survive. */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'meteor', name: 'Meteor Mayhem', ticketDiv: 3,
    howTouch: 'Meteors are falling on Grok City! RED circles show where each one will land. Hold and DRAG left or right to run out of the circles. Grab coins (+1) and gold stars (+5). A meteor that just misses you is a CLOSE CALL (+2). Umbrellas block one hit. 3 hearts!',
    howKeys: 'Meteors are falling on Grok City! RED circles show where each one will land. Use the LEFT and RIGHT arrow keys (or A/D) to run out of the circles. Grab coins (+1) and gold stars (+5). A meteor that just misses you is a CLOSE CALL (+2). Umbrellas block one hit. 3 hearts!',
    create: function (api) {
      var t, hearts, px, tx, mets, coins, pops, booms, msg, msgT, inv, umb, close, spawnT, coinT, keyL, keyR, gy, shake, dodged, L = {};
      function layout() { L.gy = api.H - Math.max(120, api.H * 0.2); L.pr = Math.max(16, Math.min(24, api.W * 0.05)); }
      function rate() { return Math.max(0.42, 1.25 - t * 0.012); }
      function say(s, c) { msg = [s, c]; msgT = 1.1; }
      function burst(x, y, col, n) { for (var i = 0; i < (n || 14); i++) { var a = Math.random() * 6.28, s = 60 + Math.random() * 160; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 90, life: 0.8, col: col }); } }
      function spawnMeteor() {
        var r = Math.min(70, 34 + t * 0.6 + Math.random() * 14), W = api.W, x;
        // sometimes aim near the player so you have to move
        x = Math.random() < 0.45 ? px + U.rand(-r * 0.6, r * 0.6) : U.rand(r * 0.5, W - r * 0.5);
        x = U.clamp(x, 20, W - 20);
        mets.push({ x: x, r: r, T: Math.max(0.8, 1.35 - t * 0.008), t: 0, big: r > 58 });
      }
      function hit() {
        if (inv > 0) return;
        if (umb) { umb = false; inv = 0.8; say('Umbrella saved you!', '#7dd3fc'); api.sfx('point'); return; }
        hearts--; inv = 1.3; shake = 0.35; api.sfx('lifelost'); say('OUCH! Watch the red circles!', '#ff6b6b');
        if (hearts <= 0) api.gameOver();
      }
      function land(m) {
        api.sfx('crash'); booms.push({ x: m.x, r: m.r, life: 0.5 }); burst(m.x, L.gy, '#ff9f1c', 18); shake = Math.max(shake, 0.15);
        var d = Math.abs(px - m.x);
        if (d < m.r * 0.92) hit();
        else if (d < m.r + L.pr * 2.4 && inv <= 0) { api.addScore(2); close++; say('CLOSE CALL! +2', '#ffe14d'); if (close >= 10 && GA.Prog) GA.Prog.event('meteorClose10'); }
        dodged++;
      }
      function drawGuy(c, x, y, s) {
        var run = Math.sin(t * 16) * (Math.abs(tx - px) > 2 ? 1 : 0.15);
        c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, y + 2, s * 0.9, s * 0.25, 0, 0, 7); c.fill();
        c.strokeStyle = '#334155'; c.lineWidth = s * 0.28; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x - s * 0.2, y - s * 0.9); c.lineTo(x - s * 0.25 + run * s * 0.3, y - s * 0.05); c.moveTo(x + s * 0.2, y - s * 0.9); c.lineTo(x + s * 0.25 - run * s * 0.3, y - s * 0.05); c.stroke();
        c.fillStyle = '#3b82f6'; U.rr(c, x - s * 0.5, y - s * 1.9, s, s * 1.1, s * 0.35); c.fill();
        c.fillStyle = '#f6c9a0'; c.beginPath(); c.arc(x, y - s * 2.35, s * 0.55, 0, 7); c.fill();
        c.fillStyle = '#ef4444'; c.beginPath(); c.arc(x, y - s * 2.5, s * 0.58, Math.PI, 0); c.fill(); c.fillRect(x, y - s * 2.55, s * 0.85, s * 0.16);
        c.fillStyle = '#111827'; c.beginPath(); c.arc(x - s * 0.18, y - s * 2.3, s * 0.08, 0, 7); c.arc(x + s * 0.18, y - s * 2.3, s * 0.08, 0, 7); c.fill();
        if (umb) { c.strokeStyle = '#e2e8f0'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + s * 0.6, y - s * 1.4); c.lineTo(x + s * 0.6, y - s * 3.6); c.stroke(); c.fillStyle = '#ff4fd8'; c.beginPath(); c.arc(x + s * 0.6, y - s * 3.5, s * 1.3, Math.PI, 0); c.fill(); }
      }
      return {
        reset: function () { layout(); t = 0; hearts = 3; px = tx = api.W / 2; mets = []; coins = []; pops = []; booms = []; msgT = 0; inv = 0; umb = false; close = 0; spawnT = 1.0; coinT = 0.6; keyL = keyR = false; shake = 0; dodged = 0; },
        resize: function () { layout(); },
        update: function (dt) {
          if (msgT > 0) msgT -= dt; if (shake > 0) shake -= dt;
          for (var i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.vy += 380 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          for (i = booms.length - 1; i >= 0; i--) { booms[i].life -= dt; if (booms[i].life <= 0) booms.splice(i, 1); }
          if (!api.playing) return; t += dt; if (inv > 0) inv -= dt;
          if (keyL) tx = px - 300; if (keyR) tx = px + 300;
          tx = U.clamp(tx, L.pr, api.W - L.pr);
          var sp = 330 * dt; px += U.clamp(tx - px, -sp, sp);
          spawnT -= dt; if (spawnT <= 0) { spawnMeteor(); if (t > 25 && Math.random() < 0.35) spawnMeteor(); spawnT = rate(); }
          coinT -= dt; if (coinT <= 0) { coinT = U.rand(0.9, 1.6); var k = Math.random(); coins.push({ x: U.rand(24, api.W - 24), kind: k < 0.12 ? 'star' : k < 0.2 ? 'umb' : 'coin', life: 6, b: Math.random() * 6 }); }
          for (i = mets.length - 1; i >= 0; i--) { var m = mets[i]; m.t += dt; if (m.t >= m.T) { land(m); mets.splice(i, 1); } }
          for (i = coins.length - 1; i >= 0; i--) { var o = coins[i]; o.life -= dt; if (Math.abs(o.x - px) < L.pr + 12) { if (o.kind === 'coin') { api.addScore(1); api.sfx('point'); burst(o.x, L.gy - 20, '#ffd23f', 8); } else if (o.kind === 'star') { api.addScore(5); api.sfx('perfect'); say('GOLD STAR! +5', '#ffe14d'); burst(o.x, L.gy - 20, '#fff59d', 16); } else { umb = true; api.sfx('point'); say('Umbrella! Blocks one hit', '#ff8fd0'); } coins.splice(i, 1); continue; } if (o.life <= 0) coins.splice(i, 1); }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i, gy = L.gy;
          c.save(); if (shake > 0) c.translate((Math.random() - 0.5) * 10 * shake / 0.35, (Math.random() - 0.5) * 8 * shake / 0.35);
          var g = c.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, '#3b0764'); g.addColorStop(0.55, '#c2410c'); g.addColorStop(1, '#fdba74'); c.fillStyle = g; c.fillRect(-20, -20, W + 40, gy + 20);
          // city skyline
          var cols = ['#4cc9f0', '#f72585', '#ffca3a', '#8ac926', '#6a4c93', '#ff924c'];
          for (i = 0; i < 9; i++) { var bw = W / 8, bh = 90 + ((i * 53) % 110), bx = i * bw - 10; c.fillStyle = cols[i % 6]; c.fillRect(bx, gy - bh, bw - 6, bh); c.fillStyle = 'rgba(255,255,255,.55)'; for (var r = 0; r < Math.floor(bh / 26); r++) for (var q = 0; q < 2; q++) c.fillRect(bx + 8 + q * (bw / 2 - 4), gy - bh + 12 + r * 26, bw / 4, 12); }
          c.fillStyle = '#4a5260'; c.fillRect(-20, gy, W + 40, H - gy + 20); c.fillStyle = '#ffd23f'; for (i = 0; i < 8; i++) c.fillRect(i * W / 7 + 10, gy + 40, W / 14, 5);
          c.fillStyle = '#8fd46c'; c.fillRect(-20, gy - 6, W + 40, 8);
          // warning circles + falling meteors
          mets.forEach(function (m) { var k = m.t / m.T; c.strokeStyle = 'rgba(255,40,60,' + (0.5 + 0.5 * Math.sin(t * 20)) + ')'; c.lineWidth = 3; c.fillStyle = 'rgba(255,40,60,' + (0.15 + k * 0.25) + ')'; c.beginPath(); c.ellipse(m.x, gy + 4, m.r, m.r * 0.28, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.ellipse(m.x, gy + 4, m.r * k, m.r * 0.28 * k, 0, 0, 7); c.stroke(); });
          mets.forEach(function (m) { var k = m.t / m.T, my = -40 + (gy + 40) * k * k, mr = 12 + m.r * 0.22; for (var s = 1; s < 6; s++) { c.fillStyle = 'rgba(255,' + (160 + s * 15) + ',60,' + (0.5 - s * 0.08) + ')'; c.beginPath(); c.arc(m.x - s * 6, my - s * 16, mr * (1 - s * 0.12), 0, 7); c.fill(); } c.fillStyle = '#6b4f3a'; c.beginPath(); c.arc(m.x, my, mr, 0, 7); c.fill(); c.fillStyle = '#ff7b00'; c.beginPath(); c.arc(m.x - mr * 0.3, my - mr * 0.25, mr * 0.35, 0, 7); c.fill(); });
          booms.forEach(function (b) { c.globalAlpha = b.life / 0.5; c.fillStyle = '#fff3b0'; c.beginPath(); c.ellipse(b.x, gy, b.r * (1.4 - b.life), b.r * 0.5 * (1.4 - b.life), 0, 0, 7); c.fill(); c.globalAlpha = 1; });
          coins.forEach(function (o) { var y = gy - 22 + Math.sin(t * 4 + o.b) * 4; if (o.life < 1.2 && Math.floor(t * 8) % 2) return; if (o.kind === 'coin') { c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(o.x, y, 10 * Math.abs(Math.cos(t * 3 + o.b)) + 2, 11, 0, 0, 7); c.fill(); c.strokeStyle = '#b8860b'; c.lineWidth = 2; c.stroke(); } else if (o.kind === 'star') { c.fillStyle = '#fff176'; c.beginPath(); for (var k = 0; k < 10; k++) { var a = k * Math.PI / 5 - Math.PI / 2, rr = k % 2 ? 6 : 15; c.lineTo(o.x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); } else { c.fillStyle = '#ff4fd8'; c.beginPath(); c.arc(o.x, y, 13, Math.PI, 0); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(o.x, y); c.lineTo(o.x, y + 14); c.stroke(); } });
          if (!(inv > 0 && Math.floor(t * 12) % 2)) drawGuy(c, px, gy, L.pr * 0.75);
          for (i = 0; i < pops.length; i++) { var p = pops[i]; c.globalAlpha = Math.max(0, p.life / 0.8); c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, 5, 0, 7); c.fill(); } c.globalAlpha = 1;
          c.restore();
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ff4f8b' : 'rgba(255,255,255,.4)');
          U.text(c, String(api.score), W - 16, 30, 30, '#fff', 'right', '#000');
          if (close >= 3) U.text(c, 'CLOSE CALLS ' + close, W - 16, 60, 15, '#ffe14d', 'right', '#000');
          if (msgT > 0) U.text(c, msg[0], W / 2, 110, 22, msg[1], 'center', '#000');
          if (api.playing && t < 4) U.text(c, api.touch ? 'DRAG to run out of the red circles!' : 'LEFT / RIGHT to dodge the red circles!', W / 2, H - 28, 17, '#fff', 'center', '#000');
        },
        dbg: function () { return { t: t, hearts: hearts, px: px, pr: L.pr, close: close, dodged: dodged, umb: umb, inv: inv, W: api.W, mets: mets.map(function (m) { return { x: m.x, r: m.r, left: m.T - m.t }; }), coins: coins.map(function (o) { return { x: o.x, kind: o.kind }; }) }; },
        onDown: function (x) { tx = x; },
        onMove: function (x, y, down) { if (down) tx = x; },
        onUp: function () { },
        onKey: function (k, down) { if (k === 'ArrowLeft' || k === 'a' || k === 'A') keyL = down; if (k === 'ArrowRight' || k === 'd' || k === 'D') keyR = down; if (!down && !keyL && !keyR) tx = px; }
      };
    }
  });
})();
