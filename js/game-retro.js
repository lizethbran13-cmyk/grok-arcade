/* Grok Arcade - the two rare cabinets in the Secret Basement (not on the bonus wall; you play them down there):
   PADDLE PONG '72: drag your paddle, return the ball past the CPU. +1 per return, +5 per goal. The CPU scoring 3 ends it.
   GALAXY GROKS '78: drag to move, your ship auto-fires. Clear waves of marching Grok invaders; dodge their bombs. 3 ships. */
(function () {
  'use strict';
  var U = GA.MG.U;
  function scan(c, W, H) { c.fillStyle = 'rgba(0,0,0,.22)'; for (var y = 0; y < H; y += 3) c.fillRect(0, y, W, 1); var v = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = v; c.fillRect(0, 0, W, H); }
  function px(c, s, x, y, size, col) { c.font = 'bold ' + size + 'px "Courier New",monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col || '#fff'; c.fillText(s, x, y); }

  GA.MG.register({
    id: 'rt_pong', name: 'Paddle Pong \u201972', ticketDiv: 2, retro: true,
    howTouch: 'DRAG left and right to move your paddle (bottom). Bounce the ball back: +1 for every return, +5 when it gets past the CPU. If the CPU scores 3 goals, game over! The ball gets faster.',
    howKeys: 'Use \u2190 / \u2192 (or A / D, or the mouse) to move your paddle (bottom). Bounce the ball back: +1 for every return, +5 when it gets past the CPU. If the CPU scores 3 goals, game over!',
    create: function (api) {
      var b, me, cpu, pw, ph, cpuGoals, myGoals, serveT, held = {}, aim = null, flash = 0;
      function serve(dir) { var W = api.W, H = api.H; b = { x: W / 2, y: H / 2, vx: (Math.random() < 0.5 ? -1 : 1) * W * 0.25, vy: dir * H * 0.38, sp: 1 }; serveT = 0.9; }
      return {
        reset: function () { var W = api.W; pw = Math.max(70, W * 0.22); ph = 12; me = W / 2; cpu = W / 2; cpuGoals = 0; myGoals = 0; serve(1); },
        update: function (dt) { var W = api.W, H = api.H, top = 70, bot = H - 70 - api.padH;
          if (flash > 0) flash -= dt;
          var mv = (held.ArrowRight ? 1 : 0) - (held.ArrowLeft ? 1 : 0); if (mv) { me += mv * W * 1.3 * dt; aim = null; } if (aim != null) me += (aim - me) * Math.min(1, dt * 16); me = U.clamp(me, pw / 2, W - pw / 2);
          // CPU: tracks the ball with a speed limit (beatable!)
          var want = b.vy < 0 ? b.x : W / 2, cs = W * (0.55 + Math.min(0.5, myGoals * 0.05)); cpu += U.clamp(want - cpu, -cs * dt, cs * dt); cpu = U.clamp(cpu, pw / 2, W - pw / 2);
          if (!api.playing) return; if (serveT > 0) { serveT -= dt; return; }
          b.x += b.vx * b.sp * dt; b.y += b.vy * b.sp * dt;
          if (b.x < 8) { b.x = 8; b.vx = Math.abs(b.vx); api.sfx('boop'); } if (b.x > W - 8) { b.x = W - 8; b.vx = -Math.abs(b.vx); api.sfx('boop'); }
          if (b.vy > 0 && b.y > bot - ph && b.y < bot + 10 && Math.abs(b.x - me) < pw / 2 + 8) { b.y = bot - ph; b.vy = -Math.abs(b.vy); b.vx = (b.x - me) / (pw / 2) * W * 0.6; b.sp = Math.min(2.4, b.sp + 0.07); api.addScore(1); api.sfx('point'); }
          if (b.vy < 0 && b.y < top + ph && b.y > top - 10 && Math.abs(b.x - cpu) < pw / 2 + 8) { b.y = top + ph; b.vy = Math.abs(b.vy); b.vx = (b.x - cpu) / (pw / 2) * W * 0.5 + (Math.random() - 0.5) * W * 0.2; api.sfx('boop'); }
          if (b.y < top - 40) { myGoals++; api.addScore(5); api.sfx('perfect'); flash = 0.5; serve(1); }
          if (b.y > bot + 40) { cpuGoals++; api.sfx('lifelost'); if (cpuGoals >= 3) { api.gameOver(); return; } serve(-1); } },
        draw: function (c) { var W = api.W, H = api.H, top = 70, bot = H - 70 - api.padH;
          c.fillStyle = flash > 0 ? '#1a3a1a' : '#050505'; c.fillRect(0, 0, W, H); c.fillStyle = '#ddd'; for (var x = 0; x < W; x += 22) c.fillRect(x, H / 2 - 2 - api.padH / 2, 12, 4);
          c.fillStyle = '#fff'; c.fillRect(cpu - pw / 2, top, pw, ph); c.fillRect(me - pw / 2, bot - ph, pw, ph); c.fillRect(b.x - 7, b.y - 7, 14, 14);
          px(c, String(cpuGoals), W * 0.15, H / 2 - 40 - api.padH / 2, 44, '#bbb'); px(c, String(myGoals), W * 0.15, H / 2 + 40 - api.padH / 2, 44, '#fff');
          px(c, 'CPU', W * 0.85, H / 2 - 40 - api.padH / 2, 18, '#888'); px(c, 'YOU', W * 0.85, H / 2 + 40 - api.padH / 2, 18, '#fff');
          for (var i = 0; i < 3; i++) px(c, i < 3 - cpuGoals ? '\u25A0' : '\u25A1', W / 2 - 24 + i * 24, top - 30, 20, '#fff');
          if (serveT > 0 && api.playing) px(c, 'READY', W / 2, H / 2 + 60 - api.padH / 2, 26, '#ffe14d');
          scan(c, W, H); },
        onDown: function (x) { aim = x; }, onMove: function (x, y, down) { if (down || !api.touch) aim = x; },
        onKey: function (k, down) { held[k] = down; },
        _state: function () { return { cpuGoals: cpuGoals, myGoals: myGoals, b: b, me: me, cpu: cpu }; }
      };
    }
  });

  GA.MG.register({
    id: 'rt_invaders', name: 'Galaxy Groks \u201978', ticketDiv: 3, retro: true,
    howTouch: 'DRAG to move your ship. It fires by itself! Blast the marching Grok invaders before they reach you, and dodge their bombs. Top row = 2 points, the flying saucer = 10. 3 ships.',
    howKeys: 'Use \u2190 / \u2192 (or A / D, or the mouse) to move. Your ship fires by itself! Blast the marching Grok invaders before they reach you, and dodge their bombs. Top row = 2 points, the saucer = 10. 3 ships.',
    create: function (api) {
      var ship, lives, inv, dir, stepT, stepI, shots, bombs, fireT, ufo, wave, held = {}, aim = null, hitT, booms;
      var ROWS = 4, COLS = 6, cols = ['#ff4fd8', '#3ff0ff', '#4ade80', '#ffe14d'];
      function newWave() { inv = []; var W = api.W, gx = Math.min(52, W * 0.13); for (var r = 0; r < ROWS; r++) for (var cI = 0; cI < COLS; cI++) inv.push({ x: W / 2 + (cI - (COLS - 1) / 2) * gx, y: 110 + r * 40 + Math.min(wave, 5) * 10, r: r, alive: true });
        dir = 1; stepI = Math.max(0.12, 0.55 - wave * 0.06); stepT = stepI; }
      function alive() { return inv.filter(function (q) { return q.alive; }); }
      function invader(c, x, y, r, f) { c.fillStyle = cols[r % 4]; var s = 4; var shape = r % 2 ? ['  X  X  ', ' XXXXXX ', 'XX XX XX', 'XXXXXXXX', f ? 'X X  X X' : ' X    X '] : ['   XX   ', ' XXXXXX ', 'XXXXXXXX', 'XX XX XX', f ? ' X XX X ' : 'X      X'];
        shape.forEach(function (row, j) { for (var i = 0; i < 8; i++) if (row[i] === 'X') c.fillRect(x - 16 + i * s, y - 10 + j * s, s, s); }); }
      return {
        reset: function () { ship = api.W / 2; lives = 3; wave = 0; shots = []; bombs = []; booms = []; fireT = 0.4; ufo = null; hitT = 0; newWave(); },
        update: function (dt) { var W = api.W, H = api.H, gy = H - 90 - api.padH;
          var mv = (held.ArrowRight ? 1 : 0) - (held.ArrowLeft ? 1 : 0); if (mv) { ship += mv * W * 0.9 * dt; aim = null; } if (aim != null) ship += U.clamp(aim - ship, -W * 1.2 * dt, W * 1.2 * dt); ship = U.clamp(ship, 22, W - 22);
          booms.forEach(function (bm) { bm.t += dt; }); booms = booms.filter(function (bm) { return bm.t < 0.4; });
          if (!api.playing) return; if (hitT > 0) { hitT -= dt; return; }
          fireT -= dt; if (fireT <= 0) { fireT = 0.42; shots.push({ x: ship, y: gy - 16 }); api.sfx('boop'); }
          shots.forEach(function (s) { s.y -= H * 0.9 * dt; }); shots = shots.filter(function (s) { return s.y > 40; });
          var al = alive(); stepT -= dt * (1 + (ROWS * COLS - al.length) * 0.05);
          if (stepT <= 0) { stepT = stepI; var minX = Infinity, maxX = -Infinity; al.forEach(function (q) { minX = Math.min(minX, q.x); maxX = Math.max(maxX, q.x); });
            if ((dir > 0 && maxX + 24 > W - 10) || (dir < 0 && minX - 24 < 10)) { dir = -dir; al.forEach(function (q) { q.y += 18; }); } else al.forEach(function (q) { q.x += dir * 12; });
            if (al.length && Math.random() < 0.45 + wave * 0.05) { var sh = al[Math.floor(Math.random() * al.length)]; bombs.push({ x: sh.x, y: sh.y + 12 }); } }
          bombs.forEach(function (bm) { bm.y += H * (0.32 + wave * 0.02) * dt; });
          if (!ufo && Math.random() < dt * 0.06) ufo = { x: -30, v: W * 0.25 }; if (ufo) { ufo.x += ufo.v * dt; if (ufo.x > W + 40) ufo = null; }
          shots.forEach(function (s) { al.forEach(function (q) { if (q.alive && !s.dead && Math.abs(s.x - q.x) < 17 && Math.abs(s.y - q.y) < 13) { q.alive = false; s.dead = true; api.addScore(q.r === 0 ? 2 : 1); api.sfx('point'); booms.push({ x: q.x, y: q.y, t: 0, c: cols[q.r % 4] }); } });
            if (ufo && !s.dead && Math.abs(s.x - ufo.x) < 22 && Math.abs(s.y - 70) < 14) { s.dead = true; api.addScore(10); api.sfx('perfect'); booms.push({ x: ufo.x, y: 70, t: 0, c: '#ff3d3d' }); ufo = null; } });
          shots = shots.filter(function (s) { return !s.dead; });
          var hit = false; bombs = bombs.filter(function (bm) { if (Math.abs(bm.x - ship) < 18 && Math.abs(bm.y - gy) < 12) { hit = true; return false; } return bm.y < H; });
          var landed = alive().some(function (q) { return q.y > gy - 30; });
          if (hit || landed) { lives--; api.sfx('lifelost'); hitT = 1.0; bombs = []; booms.push({ x: ship, y: gy, t: 0, c: '#ffe14d' }); if (landed) newWave(); if (lives <= 0) { api.gameOver(); return; } }
          if (!alive().length) { wave++; api.addScore(5); api.sfx('win'); newWave(); } },
        draw: function (c) { var W = api.W, H = api.H, gy = H - 90 - api.padH, f = Math.floor(Date.now() / 400) % 2;
          c.fillStyle = '#03030a'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,255,255,.5)'; for (var i = 0; i < 40; i++) c.fillRect((i * 97) % W, (i * 57 + Date.now() / 60) % H, 2, 2);
          inv.forEach(function (q) { if (q.alive) invader(c, q.x, q.y, q.r, f); });
          if (ufo) { c.fillStyle = '#ff3d3d'; c.beginPath(); c.ellipse(ufo.x, 70, 22, 8, 0, 0, 7); c.fill(); c.fillStyle = '#ffb3b3'; c.beginPath(); c.ellipse(ufo.x, 64, 10, 7, 0, Math.PI, 0); c.fill(); }
          c.fillStyle = '#fff'; shots.forEach(function (s) { c.fillRect(s.x - 2, s.y - 8, 4, 12); }); c.fillStyle = '#ff6b6b'; bombs.forEach(function (bm) { c.fillRect(bm.x - 3, bm.y - 6, 6, 10); });
          if (!(hitT > 0 && Math.floor(hitT * 10) % 2)) { c.fillStyle = '#ffe14d'; c.fillRect(ship - 18, gy - 4, 36, 10); c.fillRect(ship - 6, gy - 12, 12, 8); c.fillRect(ship - 2, gy - 18, 4, 6); }
          booms.forEach(function (bm) { c.fillStyle = bm.c; for (var k = 0; k < 8; k++) { var a = k / 8 * 6.28, d = bm.t * 90; c.fillRect(bm.x + Math.cos(a) * d - 2, bm.y + Math.sin(a) * d - 2, 4, 4); } });
          c.fillStyle = '#4ade80'; c.fillRect(0, gy + 14, W, 2);
          for (i = 0; i < lives; i++) { c.fillStyle = '#ffe14d'; c.fillRect(16 + i * 30, gy + 26, 22, 7); }
          px(c, 'WAVE ' + (wave + 1), W - 60, gy + 30, 16, '#3ff0ff');
          scan(c, W, H); },
        onDown: function (x) { aim = x; }, onMove: function (x, y, down) { if (down || !api.touch) aim = x; },
        onKey: function (k, down) { held[k] = down; },
        _state: function () { return { lives: lives, wave: wave, alive: alive().length, shots: shots.length }; }
      };
    }
  });
})();
