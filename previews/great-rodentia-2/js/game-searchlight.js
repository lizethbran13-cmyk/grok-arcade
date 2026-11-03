/* Grok Arcade - bonus game #50: Searchlight Sneak (Great Rodentia 2 Holiday Special tie-in).
   Snowie sneaks across the snowy prison yard at night. Searchlights sweep the yard; stay in the dark,
   grab cheese (+1) and reach the gift by the wall (+5) to clear a round. Each round adds a faster light.
   Caught in a beam = a lost heart (3). */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'searchlight', name: 'Searchlight Sneak', ticketDiv: 1,
    howTouch: 'Hold and drag anywhere to guide Snowie across the prison yard. Stay out of the searchlights, grab cheese, and reach the gift by the wall! 3 hearts.',
    howKeys: 'Arrows / WASD move Snowie across the prison yard. Stay out of the searchlights, grab cheese, and reach the gift by the wall! 3 hearts.',
    create: function (api) {
      var p, lights, cheese, hearts, round, keys = {}, tgt = null, inv, msg, msgT, t, flakes;
      function say(s, c) { msg = [s, c]; msgT = 1.2; }
      function newRound() {
        var W = api.W, H = api.H; p = { x: W / 2, y: H - 50 }; inv = 1.2; lights = []; cheese = [];
        var n = Math.min(6, 1 + round);
        for (var i = 0; i < n; i++) lights.push({ cx: U.rand(60, W - 60), cy: U.rand(H * 0.18, H * 0.75), ax: U.rand(40, W * 0.35), ay: U.rand(20, 90), sp: U.rand(0.5, 0.9) + round * 0.08, ph: U.rand(0, 6), r: Math.min(W, H) * 0.09 });
        for (var j = 0; j < 4; j++) cheese.push({ x: U.rand(30, W - 30), y: U.rand(H * 0.15, H * 0.8), got: false });
      }
      function lp(l) { return { x: l.cx + Math.sin(t * l.sp + l.ph) * l.ax, y: l.cy + Math.sin(t * l.sp * 0.7 + l.ph * 2) * l.ay }; }
      return {
        reset: function () { t = 0; hearts = 3; round = 1; msgT = 0; flakes = []; for (var i = 0; i < 60; i++) flakes.push([Math.random(), Math.random(), U.rand(0.5, 2)]); newRound(); },
        resize: function () { if (p) { p.x = U.clamp(p.x, 14, api.W - 14); p.y = U.clamp(p.y, 14, api.H - 14); } },
        update: function (dt) {
          t += dt; if (msgT > 0) msgT -= dt; if (!api.playing) return; if (inv > 0) inv -= dt;
          var vx = 0, vy = 0, s = 150;
          if (keys.ArrowLeft || keys.KeyA) vx--; if (keys.ArrowRight || keys.KeyD) vx++; if (keys.ArrowUp || keys.KeyW) vy--; if (keys.ArrowDown || keys.KeyS) vy++;
          if (tgt) { var dx = tgt.x - p.x, dy = tgt.y - p.y, d = Math.hypot(dx, dy); if (d > 4) { vx = dx / d; vy = dy / d; } }
          var m = Math.hypot(vx, vy); if (m > 1) { vx /= m; vy /= m; }
          p.x = U.clamp(p.x + vx * s * dt, 14, api.W - 14); p.y = U.clamp(p.y + vy * s * dt, 14, api.H - 14);
          for (var i = 0; i < cheese.length; i++) { var c = cheese[i]; if (!c.got && Math.hypot(c.x - p.x, c.y - p.y) < 22) { c.got = true; api.addScore(1); api.sfx('point'); } }
          if (inv <= 0) for (var k = 0; k < lights.length; k++) { var q = lp(lights[k]); if (Math.hypot(q.x - p.x, q.y - p.y) < lights[k].r) { hearts--; inv = 1.6; api.sfx('lifelost'); say('Spotted! \uD83D\uDEA8', '#ff6b86'); p.x = api.W / 2; p.y = api.H - 50; tgt = null; if (hearts <= 0) { api.gameOver(); return; } break; } }
          if (p.y < 46 && Math.abs(p.x - api.W / 2) < 40) { api.addScore(5); api.sfx('perfect'); round++; say('Over the wall! +5 \uD83C\uDF81', '#4ade80'); tgt = null; newRound(); }
        },
        draw: function (c) {
          var W = api.W, H = api.H; c.fillStyle = '#0b1530'; c.fillRect(0, 0, W, H);
          c.fillStyle = '#dbeafe'; c.globalAlpha = 0.12; for (var y = 0; y < H; y += 40) for (var x = (y / 40) % 2 * 20; x < W; x += 40) c.fillRect(x, y, 20, 20); c.globalAlpha = 1;
          c.fillStyle = '#475569'; c.fillRect(0, 0, W, 30); c.fillStyle = '#94a3b8'; for (var b = 0; b < W; b += 16) c.fillRect(b, 26, 10, 4);
          U.text(c, '\uD83C\uDF81', W / 2, 46, 30); U.text(c, 'ROUND ' + round, 10, 14, 13, '#fde68a', 'left');
          for (var i = 0; i < cheese.length; i++) if (!cheese[i].got) U.text(c, '\uD83E\uDDC0', cheese[i].x, cheese[i].y, 22);
          for (var k = 0; k < lights.length; k++) { var q = lp(lights[k]); var g = c.createRadialGradient(q.x, q.y, 2, q.x, q.y, lights[k].r); g.addColorStop(0, 'rgba(255,250,200,.85)'); g.addColorStop(1, 'rgba(255,250,200,.1)'); c.fillStyle = g; c.beginPath(); c.arc(q.x, q.y, lights[k].r, 0, 7); c.fill(); }
          if (!(inv > 0 && Math.floor(t * 10) % 2)) U.text(c, '\uD83D\uDC01', p.x, p.y, 26);
          for (var h = 0; h < 3; h++) U.heart(c, W - 20 - h * 24, 14, 16, h < hearts ? '#ff4f8b' : '#334155');
          c.fillStyle = '#fff'; for (var f = 0; f < flakes.length; f++) { var fl = flakes[f]; var fy = (fl[1] * H + t * 30 * fl[2]) % H; c.globalAlpha = 0.6; c.fillRect(fl[0] * W, fy, fl[2], fl[2]); } c.globalAlpha = 1;
          if (msgT > 0) U.text(c, msg[0], W / 2, H / 2, 24, msg[1], 'center', '#000');
        },
        onDown: function (x, y) { tgt = { x: x, y: y }; }, onMove: function (x, y) { if (tgt) tgt = { x: x, y: y }; }, onUp: function () { tgt = null; },
        onKey: function (k, down) { keys[k] = down; }
      };
    }
  });
})();
