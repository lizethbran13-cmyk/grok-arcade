/* Grok Arcade - bonus game #39: Chimney Drop (Grok North Pole Village tie-in).
   Santa's sleigh glides across the night sky. TAP to drop a present: land it in a moving chimney = +1 (golden chimney +3).
   A present that misses lands in the snow (lose a heart). Watch out for the snowman: hitting his hat costs a heart too. 3 hearts; it speeds up. */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'chimneydrop', name: 'Chimney Drop', ticketDiv: 4,
    howTouch: 'Help Santa deliver! The sleigh flies across the sky. TAP to drop a present and land it in a chimney. Chimney = +1, golden chimney = +3. A miss costs a heart. Don\u2019t bonk the snowman!',
    howKeys: 'Help Santa deliver! The sleigh flies across the sky. CLICK or press SPACE to drop a present and land it in a chimney. Chimney = +1, golden chimney = +3. A miss costs a heart. Don\u2019t bonk the snowman!',
    create: function (api) {
      var t, hearts, sx, sdir, gifts, houses, pops, msg, msgT, hurtT, spawnT, cool, delivered, stars;
      var COLS = ['#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b'];
      function say(s, col) { msg = [s, col]; msgT = 1.1; }
      function speed() { return 70 + Math.min(110, t * 2.2); }
      function burst(x, y, col, n) { for (var i = 0; i < (n || 10); i++) { var a = Math.random() * 6.28, s = 50 + Math.random() * 130; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.7, col: col }); } }
      function hurt(why) { if (hurtT > 0) return; hearts--; hurtT = 0.8; api.sfx('lifelost'); say(why, '#fca5a5'); if (hearts <= 0) api.gameOver(); }
      function addHouse(x) { var snow = Math.random() < 0.14; houses.push({ x: x, w: snow ? 40 : 70 + Math.random() * 30, h: snow ? 60 : 70 + Math.random() * 70, snow: snow, gold: !snow && Math.random() < 0.15, col: ['#b45309', '#9f1239', '#1d4ed8', '#166534'][(Math.random() * 4) | 0], done: false }); }
      function drop() { if (cool > 0 || !api.playing) return; cool = 0.35; gifts.push({ x: sx, y: 92, vy: 40, col: COLS[(Math.random() * COLS.length) | 0], rot: 0 }); api.sfx('click'); }
      return {
        reset: function () { t = 0; hearts = 3; sx = 60; sdir = 1; gifts = []; houses = []; pops = []; msgT = 0; hurtT = 0; cool = 0; delivered = 0; stars = []; for (var i = 0; i < 40; i++) stars.push([Math.random(), Math.random() * 0.5, Math.random() * 6]); var x = 40; while (x < api.W + 40) { addHouse(x); x += 120 + Math.random() * 60; } },
        update: function (dt) {
          if (msgT > 0) msgT -= dt; if (hurtT > 0) hurtT -= dt; if (cool > 0) cool -= dt;
          for (var i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.vy += 300 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          if (!api.playing) return; t += dt;
          sx += sdir * (120 + Math.min(80, t * 1.5)) * dt; if (sx > api.W - 50) { sx = api.W - 50; sdir = -1; } if (sx < 50) { sx = 50; sdir = 1; }
          var v = speed(), ground = api.H - 40;
          houses.forEach(function (hs) { hs.x -= v * dt; }); for (i = houses.length - 1; i >= 0; i--) if (houses[i].x + houses[i].w < -20) houses.splice(i, 1);
          var last = houses[houses.length - 1]; if (!last || last.x + last.w < api.W + 20) addHouse((last ? last.x + last.w : api.W) + 60 + Math.random() * 90);
          for (i = gifts.length - 1; i >= 0; i--) { var gf = gifts[i]; gf.vy += 420 * dt; gf.y += gf.vy * dt; gf.x -= v * dt * 0.15; gf.rot += dt * 3; var hit = null;
            houses.forEach(function (hs) { var top = ground - hs.h; if (hs.snow) { if (Math.abs(gf.x - (hs.x + hs.w / 2)) < 22 && gf.y > top - 4 && gf.y < top + 30) hit = { hs: hs, snow: true }; return; }
              var cx = hs.x + hs.w * 0.7, ctop = top - 26; if (!hs.done && Math.abs(gf.x - cx) < 14 && gf.y > ctop - 4 && gf.y < ctop + 10) hit = { hs: hs, chim: true }; else if (gf.x > hs.x && gf.x < hs.x + hs.w && gf.y > top) hit = { hs: hs, roof: true }; });
            if (hit && hit.chim) { var pts = hit.hs.gold ? 3 : 1; hit.hs.done = true; api.addScore(pts); delivered++; api.sfx(pts > 1 ? 'perfect' : 'point'); burst(gf.x, gf.y, hit.hs.gold ? '#ffd23f' : '#ffffff', 12); say(pts > 1 ? 'GOLDEN CHIMNEY! +3' : 'Delivered!', '#fff'); gifts.splice(i, 1); if (delivered >= 40 && GA.Prog) GA.Prog.event('chim40'); continue; }
            if (hit && hit.snow) { hurt('Bonk! Sorry, Mr. Snowman!'); burst(gf.x, gf.y, '#e0f2fe', 12); gifts.splice(i, 1); continue; }
            if ((hit && hit.roof) || gf.y > ground) { hurt('Missed the chimney!'); burst(gf.x, Math.min(gf.y, ground), '#e0f2fe', 8); gifts.splice(i, 1); } }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i, ground = H - 40; var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0b1d4a'); gr.addColorStop(1, '#3b5bab'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
          stars.forEach(function (s) { c.globalAlpha = 0.5 + Math.sin(t * 2 + s[2]) * 0.4; c.fillStyle = '#fff'; c.fillRect(s[0] * W, s[1] * H, 2, 2); }); c.globalAlpha = 1;
          c.fillStyle = '#fef9c3'; c.beginPath(); c.arc(W * 0.82, 70, 22, 0, 7); c.fill();
          houses.forEach(function (hs) { var top = ground - hs.h;
            if (hs.snow) { var cx = hs.x + hs.w / 2; c.fillStyle = '#f8fafc'; c.beginPath(); c.arc(cx, ground - 16, 18, 0, 7); c.arc(cx, ground - 42, 13, 0, 7); c.fill(); c.fillStyle = '#111827'; c.fillRect(cx - 11, top - 2, 22, 5); c.fillRect(cx - 7, top - 16, 14, 14); c.fillStyle = '#f97316'; c.fillRect(cx, ground - 43, 8, 3); return; }
            c.fillStyle = hs.col; c.fillRect(hs.x, top, hs.w, hs.h); c.fillStyle = '#f8fafc'; c.fillRect(hs.x - 4, top - 6, hs.w + 8, 8);
            c.fillStyle = hs.gold ? '#facc15' : '#7f1d1d'; c.fillRect(hs.x + hs.w * 0.7 - 11, top - 26, 22, 22); c.fillStyle = '#f8fafc'; c.fillRect(hs.x + hs.w * 0.7 - 13, top - 30, 26, 6);
            if (hs.done) { c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(hs.x + hs.w * 0.7, top - 40 - Math.sin(t * 3) * 3, 6, 0, 7); c.fill(); }
            c.fillStyle = '#fde68a'; for (var k = 0; k < 2; k++) c.fillRect(hs.x + 10 + k * (hs.w - 34), top + 18, 14, 16); });
          c.fillStyle = '#f8fafc'; c.fillRect(0, ground, W, H - ground);
          gifts.forEach(function (gf) { c.save(); c.translate(gf.x, gf.y); c.rotate(gf.rot * 0.3); c.fillStyle = gf.col; c.fillRect(-9, -9, 18, 18); c.fillStyle = '#fde047'; c.fillRect(-2, -9, 4, 18); c.fillRect(-9, -2, 18, 4); c.restore(); });
          // sleigh + reindeer
          c.save(); c.translate(sx, 74); if (sdir < 0) c.scale(-1, 1); c.fillStyle = '#b91c1c'; c.beginPath(); c.moveTo(-26, -6); c.lineTo(16, -6); c.lineTo(22, 8); c.lineTo(-22, 8); c.closePath(); c.fill(); c.strokeStyle = '#facc15'; c.lineWidth = 2; c.beginPath(); c.moveTo(-26, 12); c.lineTo(24, 12); c.stroke();
          c.fillStyle = '#ef4444'; c.beginPath(); c.arc(-6, -12, 8, 0, 7); c.fill(); c.fillStyle = '#f8fafc'; c.fillRect(-14, -22, 16, 4); c.fillStyle = '#92400e'; c.beginPath(); c.ellipse(46, 0, 12, 6, 0, 0, 7); c.fill(); c.beginPath(); c.arc(58, -6, 5, 0, 7); c.fill(); c.fillStyle = '#ef4444'; c.beginPath(); c.arc(63, -6, 2.5, 0, 7); c.fill(); c.strokeStyle = '#92400e'; c.beginPath(); c.moveTo(22, 0); c.lineTo(36, 0); c.stroke(); c.restore();
          for (i = 0; i < pops.length; i++) { var q = pops[i]; c.globalAlpha = Math.max(0, q.life / 0.7); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, 4, 0, 7); c.fill(); } c.globalAlpha = 1;
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ffffff' : 'rgba(255,255,255,.35)');
          U.text(c, String(api.score), W - 16, 32, 30, '#fff', 'right', '#7f1d1d'); U.text(c, 'CHIMNEY DROP', W / 2, 30, 14, '#fff', 'center', '#7f1d1d');
          if (msgT > 0) U.text(c, msg[0], W / 2, 140, 20, msg[1], 'center', '#000');
          if (api.playing && t < 4) U.text(c, api.touch ? 'TAP to drop a present!' : 'CLICK or SPACE to drop!', W / 2, H - 14, 18, '#1e3a8a', 'center', '#fff');
        },
        dbg: function () { return { t: t, hearts: hearts, sx: Math.round(sx), gifts: gifts.length, v: speed(), H: api.H, houses: houses.map(function (h) { return [h.x, h.snow, h.gold, h.done, h.w, h.h]; }), score: api.score }; },
        onDown: function () { drop(); },
        onKey: function (k, dn) { if (dn === false) return; if (k === ' ' || k === 'Space' || k === 'Enter') drop(); }
      };
    }
  });
})();
