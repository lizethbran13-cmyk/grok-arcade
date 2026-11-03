/* Grok Arcade - bonus game #35: Sparkle Car Wash (Grok Rides Remastered tie-in).
   Muddy cars roll through the Sparkle Car Wash on the conveyor. DRAG over the mud splats to scrub them off before the car rolls out.
   Every splat +1, a spotless car +2 bonus, a GOLDEN car counts double. Cars with a WET PAINT sign are freshly painted: hands off!
   A muddy car leaving, or smudging wet paint, costs a heart. 3 hearts; the conveyor speeds up as you go. */
(function () {
  'use strict';
  var U = GA.MG.U;
  var COLS = ['#ef4444', '#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#14b8a6'];
  GA.MG.register({
    id: 'wash', name: 'Sparkle Car Wash', ticketDiv: 4,
    howTouch: 'Muddy cars roll through the Sparkle Car Wash! DRAG your finger over the brown mud splats to scrub them off before each car rolls out. Spotless cars score a bonus and GOLDEN cars count double. Cars with a WET PAINT sign were just painted: don\u2019t touch them!',
    howKeys: 'Muddy cars roll through the Sparkle Car Wash! Click and DRAG over the brown mud splats to scrub them off before each car rolls out. Spotless cars score a bonus and GOLDEN cars count double. Cars with a WET PAINT sign were just painted: don\u2019t touch them!',
    create: function (api) {
      var t, hearts, cars, bubbles, msg, msgT, hurtT, spawnT, washed, spotless, down, px, py, lx, ly, speed;
      function say(s, col) { msg = [s, col]; msgT = 1.3; }
      function busy() { return Math.min(1, washed / 30); }
      function rnd(a, b) { return a + Math.random() * (b - a); }
      function laneY(i) { return api.H * (0.36 + i * 0.27); }
      function spawn() { var lane = Math.random() < 0.5 ? 0 : 1; if (cars.some(function (c) { return c.lane === lane && c.x < 150; })) lane = 1 - lane; if (cars.some(function (c) { return c.lane === lane && c.x < 150; })) return;
        var r = Math.random(), k = r < 0.16 + busy() * 0.1 ? 'paint' : r < 0.26 ? 'gold' : 'mud', n = k === 'paint' ? 0 : 2 + Math.floor(Math.random() * (2 + busy() * 3)), sp = [];
        for (var i = 0; i < n; i++) sp.push({ x: rnd(-42, 42), y: rnd(-20, 6), r: rnd(9, 14), hp: 1 });
        cars.push({ x: -80, lane: lane, k: k, col: k === 'gold' ? '#ffcf3a' : COLS[(Math.random() * COLS.length) | 0], sp: sp, hit: false, done: false }); }
      function hurt(why) { if (hurtT > 0) return; hearts--; hurtT = 1.1; api.sfx('lifelost'); say(why, '#fca5a5'); if (hearts <= 0) api.gameOver(); }
      function foam(x, y, n, col) { for (var i = 0; i < (n || 6); i++) { var a = Math.random() * 6.28, s = 30 + Math.random() * 90; bubbles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.8, r: 3 + Math.random() * 5, col: col || 'rgba(255,255,255,.9)' }); } }
      function scrub(x0, y0, x1, y1) { var L = Math.hypot(x1 - x0, y1 - y0); if (L < 0.5) return; var steps = Math.ceil(L / 6);
        for (var s = 0; s <= steps; s++) { var x = x0 + (x1 - x0) * s / steps, y = y0 + (y1 - y0) * s / steps;
          for (var i = 0; i < cars.length; i++) { var c = cars[i], cy = laneY(c.lane); if (x < c.x - 60 || x > c.x + 60 || y < cy - 46 || y > cy + 30) continue;
            if (c.k === 'paint') { if (!c.hit) { c.hit = true; hurt('Oops! WET PAINT! Smudged it!'); foam(x, y, 8, c.col); } continue; }
            for (var j = 0; j < c.sp.length; j++) { var p = c.sp[j]; if (p.hp <= 0) continue; if (Math.hypot(c.x + p.x - x, cy + p.y - y) < p.r + 12) { p.hp -= Math.min(L, 6) / 70; if (Math.random() < 0.3) foam(x, y, 1); if (p.hp <= 0) { api.addScore(c.k === 'gold' ? 2 : 1); api.sfx('boop'); foam(c.x + p.x, cy + p.y, 8); } } } } } }
      return {
        reset: function () { t = 0; hearts = 3; cars = []; bubbles = []; msgT = 0; hurtT = 0; spawnT = 0.3; washed = 0; spotless = 0; down = false; px = py = lx = ly = 0; speed = 60; },
        resize: function () {},
        update: function (dt) {
          if (msgT > 0) msgT -= dt; if (hurtT > 0) hurtT -= dt;
          for (var i = bubbles.length - 1; i >= 0; i--) { var q = bubbles[i]; q.life -= dt; q.vy -= 30 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.96; if (q.life <= 0) bubbles.splice(i, 1); }
          if (!api.playing) return; t += dt; speed = 62 + busy() * 70;
          spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(0.95, 2.3 - busy() * 1.2); }
          if (down) { scrub(lx, ly, px, py); lx = px; ly = py; }
          for (var k = cars.length - 1; k >= 0; k--) { var c = cars[k]; c.x += speed * dt;
            if (!c.done && c.x > api.W - 40) { c.done = true; if (c.k === 'paint') { if (!c.hit) { api.addScore(1); say('Fresh paint, untouched. Nice! +1', '#86efac'); } }
              else { var left = c.sp.filter(function (p) { return p.hp > 0; }).length; if (left) hurt('A muddy car got out!'); else { washed++; spotless++; var b = c.k === 'gold' ? 4 : 2; api.addScore(b); api.sfx('perfect'); say(c.k === 'gold' ? 'GOLDEN SHINE! +4' : 'Spotless! +2', '#fde68a'); if (spotless >= 10 && GA.Prog) GA.Prog.event('wash10'); } } }
            if (c.x > api.W + 90) cars.splice(k, 1); }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i;
          // wash bay: tiled floor, blue walls, spinning brushes, conveyor lanes
          c.fillStyle = '#0ea5e9'; c.fillRect(0, 0, W, H); c.fillStyle = '#38bdf8'; for (i = 0; i < W; i += 48) c.fillRect(i, 84, 24, H);
          for (var ln = 0; ln < 2; ln++) { var y = laneY(ln); c.fillStyle = '#334155'; c.fillRect(0, y + 14, W, 26); c.fillStyle = '#64748b'; for (i = -40; i < W + 40; i += 28) c.fillRect(((i + t * speed) % (W + 40)) - 20, y + 22, 14, 10); }
          for (var bi = 0; bi < 2; bi++) { var bx = W * (0.32 + bi * 0.36); c.save(); c.translate(bx, 92); for (var r = 0; r < 8; r++) { c.fillStyle = r % 2 ? '#f472b6' : '#a78bfa'; c.fillRect(-10, r * 10 + Math.sin(t * 9 + r) * 2, 20, 8); } c.restore(); }
          c.fillStyle = '#0369a1'; c.fillRect(0, 0, W, 78); c.fillStyle = '#facc15'; c.fillRect(0, 78, W, 6);
          cars.forEach(function (cr) { var y = laneY(cr.lane), x = cr.x;
            c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 16, 58, 8, 0, 0, 7); c.fill();
            c.fillStyle = cr.col; U.rr(c, x - 56, y - 20, 112, 34, 14); c.fill(); U.rr(c, x - 30, y - 42, 62, 28, 12); c.fill();
            c.fillStyle = '#bfe8ff'; U.rr(c, x - 24, y - 37, 24, 18, 5); c.fill(); U.rr(c, x + 4, y - 37, 22, 18, 5); c.fill();
            c.fillStyle = 'rgba(255,255,255,.35)'; U.rr(c, x - 48, y - 15, 60, 6, 3); c.fill();
            c.fillStyle = '#fde68a'; c.beginPath(); c.arc(x + 52, y - 6, 4, 0, 7); c.fill();
            c.fillStyle = '#111827'; c.beginPath(); c.arc(x - 32, y + 14, 11, 0, 7); c.arc(x + 32, y + 14, 11, 0, 7); c.fill(); c.fillStyle = '#cbd5e1'; c.beginPath(); c.arc(x - 32, y + 14, 5, 0, 7); c.arc(x + 32, y + 14, 5, 0, 7); c.fill();
            if (cr.k === 'gold') { var sp2 = (Math.sin(t * 7 + x) + 1) / 2; c.globalAlpha = 0.5 + sp2 * 0.5; U.text(c, '\u2726', x + 40, y - 40, 20, '#fff', 'center'); c.globalAlpha = 1; }
            if (cr.k === 'paint') { c.fillStyle = '#fff'; U.rr(c, x - 34, y - 72, 68, 22, 5); c.fill(); c.fillStyle = '#ef4444'; for (i = 0; i < 4; i++) c.fillRect(x - 32 + i * 17, y - 54, 8, 3); U.text(c, 'WET PAINT', x, y - 57, 12, '#ef4444', 'center'); c.fillStyle = '#94a3b8'; c.fillRect(x - 1, y - 50, 2, 10);
              if (cr.hit) { c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x + 6, y - 6, 16, 7, 0.3, 0, 7); c.fill(); } }
            cr.sp.forEach(function (p) { if (p.hp <= 0) return; c.globalAlpha = 0.35 + p.hp * 0.65; c.fillStyle = '#7c4a1e'; c.beginPath(); c.arc(x + p.x, y + p.y, p.r, 0, 7); c.arc(x + p.x + p.r * 0.7, y + p.y + 2, p.r * 0.5, 0, 7); c.arc(x + p.x - p.r * 0.6, y + p.y - 3, p.r * 0.45, 0, 7); c.fill(); c.fillStyle = '#5b3412'; c.beginPath(); c.arc(x + p.x - 2, y + p.y - 2, p.r * 0.35, 0, 7); c.fill(); c.globalAlpha = 1; });
          });
          for (i = 0; i < bubbles.length; i++) { var q = bubbles[i]; c.globalAlpha = Math.max(0, q.life / 0.8); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, q.r, 0, 7); c.fill(); } c.globalAlpha = 1;
          if (down) { c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(px, py, 16, 0, 7); c.fill(); c.fillStyle = '#facc15'; U.rr(c, px - 12, py + 10, 24, 10, 4); c.fill(); }
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ffffff' : 'rgba(255,255,255,.35)');
          U.text(c, String(api.score), W - 16, 32, 30, '#fff', 'right', '#0c4a6e'); U.text(c, 'SPARKLE CAR WASH', W / 2, 58, 14, '#fff', 'center', '#0c4a6e');
          if (msgT > 0) U.text(c, msg[0], W / 2, 120, 20, msg[1], 'center', '#000');
          if (api.playing && t < 4) U.text(c, api.touch ? 'DRAG over the mud to scrub!' : 'CLICK & DRAG over the mud to scrub!', W / 2, H - 22, 18, '#fff', 'center', '#0c4a6e');
        },
        dbg: function () { return { t: t, hearts: hearts, washed: washed, cars: cars.map(function (c) { return [c.k, Math.round(c.x), Math.round(laneY(c.lane)), c.sp.filter(function (p) { return p.hp > 0; }).map(function (p) { return [Math.round(c.x + p.x), Math.round(laneY(c.lane) + p.y)]; })]; }) }; },
        onDown: function (x, y) { down = true; px = lx = x; py = ly = y; }, onMove: function (x, y) { px = x; py = y; }, onUp: function () { down = false; },
        onKey: function () {}
      };
    }
  });
})();
