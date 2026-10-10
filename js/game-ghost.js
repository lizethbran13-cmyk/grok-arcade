/* Grok Arcade - bonus game #23: GHOST LANTERN '83 (a "vintage" 1983 cabinet found in Larry's maintenance room).
   Friendly cartoon ghosts drift in from the edges toward your candle. TAP a ghost to catch it in your lantern.
   Small ghost = 1, big grumpy ghost = 3 taps / 4 pts, golden ghost = 5 pts (fast!). A ghost that reaches the candle blows out
   one of your 3 candles. Catch streaks make your lantern beam wider. Green-phosphor CRT look with scanlines.
   Beat the target score and the cabinet prints the attic keypad code (see js/attic-ui.js). */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.GHOST_TARGET = 30;
  function ghostShape(c, x, y, r, col, t, face) {
    c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath(); c.arc(0, -r * 0.15, r, Math.PI, 0);
    var n = 4; for (var i = 0; i <= n; i++) { var px = r - (2 * r) * i / n, py = r * 0.75 + Math.sin(t * 8 + i) * r * 0.12 * (i % 2 ? 1 : -1); c.lineTo(px, py); }
    c.closePath(); c.fill();
    c.fillStyle = '#10261a'; var ey = -r * 0.25;
    if (face === 'grump') { c.fillRect(-r * 0.5, ey - r * 0.25, r * 0.35, r * 0.08); c.fillRect(r * 0.15, ey - r * 0.25, r * 0.35, r * 0.08); }
    c.beginPath(); c.ellipse(-r * 0.32, ey, r * 0.13, r * 0.2, 0, 0, 7); c.ellipse(r * 0.32, ey, r * 0.13, r * 0.2, 0, 0, 7); c.fill();
    c.beginPath(); if (face === 'grump') { c.arc(0, r * 0.32, r * 0.2, Math.PI * 1.1, Math.PI * 1.9); c.strokeStyle = '#10261a'; c.lineWidth = r * 0.08; c.stroke(); } else { c.arc(0, r * 0.1, r * 0.18, 0, Math.PI); c.fill(); }
    c.fillStyle = 'rgba(255,150,170,.6)'; c.beginPath(); c.arc(-r * 0.55, r * 0.05, r * 0.1, 0, 7); c.arc(r * 0.55, r * 0.05, r * 0.1, 0, 7); c.fill();
    c.restore();
  }
  GA.MG.register({
    id: 'ghost', name: 'Ghost Lantern \u201983', ticketDiv: 3,
    howTouch: 'Friendly ghosts float toward your candle! TAP a ghost to catch it in your lantern. Big grumpy ghosts need 3 taps (4 pts), golden ghosts are worth 5. If a ghost reaches the candle it blows one out \u2014 lose all 3 and it\u2019s game over. Catch streaks make your lantern beam bigger!',
    howKeys: 'Friendly ghosts float toward your candle! CLICK a ghost to catch it in your lantern. Big grumpy ghosts need 3 clicks (4 pts), golden ghosts are worth 5. If a ghost reaches the candle it blows one out \u2014 lose all 3 and it\u2019s game over. Catch streaks make your lantern beam bigger!',
    create: function (api) {
      var G, candles, t, spawnT, streak, pops, flash, caught, msg, msgT;
      function cx() { return api.W / 2; } function cy() { return (api.H - api.padH) * 0.6; }
      function spawn() {
        var W = api.W, H = api.H - api.padH, a = Math.random() * Math.PI * 2, R = Math.max(W, H) * 0.62, lvl = Math.min(1, t / 70), r = Math.random();
        var kind = r < 0.1 + lvl * 0.05 ? 'gold' : r < 0.28 + lvl * 0.12 ? 'big' : 'small';
        var sp = (kind === 'gold' ? 95 : kind === 'big' ? 38 : 55) * (1 + lvl * 0.9);
        G.push({ x: cx() + Math.cos(a) * R, y: cy() + Math.sin(a) * R * 0.8, k: kind, hp: kind === 'big' ? 3 : 1, r: kind === 'big' ? 34 : kind === 'gold' ? 20 : 24, sp: sp, w: Math.random() * 6, hit: 0 });
      }
      function say(s, col) { msg = [s, col]; msgT = 1.0; }
      function tapAt(x, y) {
        if (!api.playing) return; var best = null, bd = 1e9, reach = 14 + Math.min(16, streak * 1.5);
        G.forEach(function (g) { var d = Math.hypot(g.x - x, g.y - y) - g.r; if (d < reach && d < bd) { bd = d; best = g; } });
        if (!best) { streak = 0; api.sfx('tick'); return; }
        best.hp--; best.hit = 0.18;
        if (best.hp > 0) { api.sfx('point'); return; }
        var pts = best.k === 'gold' ? 5 : best.k === 'big' ? 4 : 1; streak++; if (streak > 0 && streak % 8 === 0) { pts += 3; say('LANTERN STREAK x' + streak + '! +3', '#ffe14d'); }
        api.addScore(pts); caught++; api.sfx(best.k === 'gold' ? 'perfect' : 'boop');
        pops.push({ x: best.x, y: best.y, t: 0, s: '+' + pts, c: best.k === 'gold' ? '#ffe14d' : '#a7f3d0' });
        G.splice(G.indexOf(best), 1);
      }
      return {
        reset: function () { G = []; candles = 3; t = 0; spawnT = 0.6; streak = 0; pops = []; flash = 0; caught = 0; msg = null; msgT = 0; },
        start: function () {},
        update: function (dt) {
          pops.forEach(function (p) { p.t += dt; }); pops = pops.filter(function (p) { return p.t < 0.8; }); if (flash > 0) flash -= dt; if (msgT > 0) msgT -= dt;
          G.forEach(function (g) { g.w += dt; if (g.hit > 0) g.hit -= dt; });
          if (!api.playing) return;
          t += dt; spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(0.42, 1.25 - t * 0.012) * (0.75 + Math.random() * 0.5); }
          var X = cx(), Y = cy();
          for (var i = G.length - 1; i >= 0; i--) { var g = G[i], dx = X - g.x, dy = Y - g.y, d = Math.hypot(dx, dy);
            if (d < 26) { G.splice(i, 1); candles--; streak = 0; flash = 0.4; api.sfx('lifelost'); say('WHOOSH! A candle went out!', '#ff8fa3'); if (candles <= 0) { api.gameOver(); return; } continue; }
            var wob = Math.sin(g.w * 3) * 30; g.x += (dx / d * g.sp + (-dy / d) * wob * 0.6) * dt; g.y += (dy / d * g.sp + (dx / d) * wob * 0.6) * dt; }
        },
        draw: function (c) {
          var W = api.W, H = api.H, X = cx(), Y = cy(), tt = performance.now() / 1000;
          c.fillStyle = '#04140b'; c.fillRect(0, 0, W, H);
          var gr = c.createRadialGradient(X, Y, 10, X, Y, Math.max(W, H) * 0.7); gr.addColorStop(0, 'rgba(255,214,120,.22)'); gr.addColorStop(0.35, 'rgba(60,160,90,.10)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
          // cartoon attic silhouette (rafters + round window + moon)
          c.strokeStyle = 'rgba(120,255,170,.18)'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, H * 0.32); c.lineTo(W / 2, H * 0.06); c.lineTo(W, H * 0.32); c.stroke();
          c.fillStyle = 'rgba(167,243,208,.15)'; c.beginPath(); c.arc(W / 2, H * 0.17, 26, 0, 7); c.fill();
          // candle + lantern glow
          for (var k = 0; k < 3; k++) { var x = X - 36 + k * 36, on = k < candles; c.fillStyle = on ? '#fef3c7' : '#4b5563'; c.fillRect(x - 8, Y - 6, 16, 34);
            if (on) { var fl = 1 + Math.sin(tt * 14 + k) * 0.15; c.fillStyle = '#fbbf24'; c.beginPath(); c.ellipse(x, Y - 14, 6 * fl, 11 * fl, 0, 0, 7); c.fill(); c.fillStyle = '#fff7d6'; c.beginPath(); c.ellipse(x, Y - 12, 3, 6, 0, 0, 7); c.fill(); }
            else { c.fillStyle = 'rgba(200,200,200,.4)'; c.beginPath(); c.arc(x + Math.sin(tt * 2 + k) * 4, Y - 20 - (tt * 20 % 20), 4, 0, 7); c.fill(); } }
          G.forEach(function (g) { var col = g.k === 'gold' ? '#fde047' : g.k === 'big' ? '#86efac' : '#d1fae5'; if (g.hit > 0) col = '#ffffff';
            c.globalAlpha = 0.92; ghostShape(c, g.x, g.y + Math.sin(g.w * 4) * 4, g.r, col, g.w, g.k === 'big' ? 'grump' : 'happy'); c.globalAlpha = 1;
            if (g.k === 'big') for (var h = 0; h < g.hp; h++) U.heart(c, g.x - 12 + h * 12, g.y - g.r - 12, 10, '#f472b6'); });
          pops.forEach(function (p) { c.globalAlpha = 1 - p.t / 0.8; U.text(c, p.s, p.x, p.y - p.t * 50, 22, p.c, 'center', p.c); c.globalAlpha = 1; });
          if (flash > 0) { c.fillStyle = 'rgba(255,255,255,' + flash * 0.5 + ')'; c.fillRect(0, 0, W, H); }
          if (msgT > 0 && msg) U.text(c, msg[0], W / 2, H * 0.12 + 40, 20, msg[1], 'center', msg[1]);
          U.text(c, 'TARGET ' + GA.GHOST_TARGET + (api.score >= GA.GHOST_TARGET ? '  \u2714' : ''), W - 12, 24, 15, api.score >= GA.GHOST_TARGET ? '#ffe14d' : 'rgba(167,243,208,.7)', 'right');
          U.text(c, 'STREAK ' + streak, 12, 24, 15, 'rgba(167,243,208,.7)', 'left');
          // CRT scanlines + vignette
          c.fillStyle = 'rgba(0,0,0,.18)'; for (var y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
          var vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
          U.text(c, api.touch ? 'TAP the ghosts before they reach the candles!' : 'CLICK the ghosts before they reach the candles!', W / 2, H - 26 - api.padH, 14, 'rgba(167,243,208,.6)');
        },
        onDown: function (x, y) { tapAt(x, y); },
        _state: function () { return { ghosts: G.length, candles: candles, t: t, caught: caught, streak: streak }; },
        _add: function (n) { api.addScore(n); }, _end: function () { api.gameOver(); },
        _catchAll: function () { G.slice().forEach(function (g) { while (G.indexOf(g) >= 0) tapAt(g.x, g.y); }); }
      };
    }
  });
})();
