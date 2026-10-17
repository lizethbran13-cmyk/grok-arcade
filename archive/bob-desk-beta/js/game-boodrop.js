/* Grok Arcade - bonus game #40: Boo Drop (Grok Pumpkin Hollow tie-in).
   Wisp the little ghost floats over Boo Row. TAP to drop a candy: land it in a jack-o'-lantern bucket = +1 (golden pumpkin +3).
   A candy that misses lands in the fog (lose a heart). Don't plop candy on the sleeping black cat. 3 hearts; it speeds up. */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'boodrop', name: 'Boo Drop', ticketDiv: 4,
    howTouch: 'Trick or treat! Wisp the ghost floats over Boo Row. TAP to drop a candy into a jack-o\u2019-lantern bucket. Bucket = +1, golden pumpkin = +3. A miss costs a heart. Don\u2019t wake the black cat!',
    howKeys: 'Trick or treat! Wisp the ghost floats over Boo Row. CLICK or press SPACE to drop a candy into a jack-o\u2019-lantern bucket. Bucket = +1, golden pumpkin = +3. A miss costs a heart. Don\u2019t wake the black cat!',
    create: function (api) {
      var t, hearts, sx, sdir, gifts, houses, pops, msg, msgT, hurtT, spawnT, cool, delivered, stars;
      var COLS = ['#f97316', '#a855f7', '#22c55e', '#facc15', '#ec4899'];
      function say(s, col) { msg = [s, col]; msgT = 1.1; }
      function speed() { return 70 + Math.min(110, t * 2.2); }
      function burst(x, y, col, n) { for (var i = 0; i < (n || 10); i++) { var a = Math.random() * 6.28, s = 50 + Math.random() * 130; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.7, col: col }); } }
      function hurt(why) { if (hurtT > 0) return; hearts--; hurtT = 0.8; api.sfx('lifelost'); say(why, '#fca5a5'); if (hearts <= 0) api.gameOver(); }
      function addHouse(x) { var snow = Math.random() < 0.14; houses.push({ x: x, w: snow ? 40 : 70 + Math.random() * 30, h: snow ? 60 : 70 + Math.random() * 70, snow: snow, gold: !snow && Math.random() < 0.15, col: ['#4c1d95', '#7c2d12', '#1e1b4b', '#14532d'][(Math.random() * 4) | 0], done: false }); }
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
            if (hit && hit.chim) { var pts = hit.hs.gold ? 3 : 1; hit.hs.done = true; api.addScore(pts); delivered++; api.sfx(pts > 1 ? 'perfect' : 'point'); burst(gf.x, gf.y, hit.hs.gold ? '#ffd23f' : '#ffffff', 12); say(pts > 1 ? 'GOLDEN PUMPKIN! +3' : 'Treat!', '#fff'); gifts.splice(i, 1); if (delivered >= 40 && GA.Prog) GA.Prog.event('boo40'); continue; }
            if (hit && hit.snow) { hurt('Mrrrow! You woke the cat!'); burst(gf.x, gf.y, '#c4b5fd', 12); gifts.splice(i, 1); continue; }
            if ((hit && hit.roof) || gf.y > ground) { hurt('Missed the bucket!'); burst(gf.x, Math.min(gf.y, ground), '#c4b5fd', 8); gifts.splice(i, 1); } }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i, ground = H - 40; var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#120726'); gr.addColorStop(0.7, '#3b1d5c'); gr.addColorStop(1, '#c2410c'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
          stars.forEach(function (s) { c.globalAlpha = 0.5 + Math.sin(t * 2 + s[2]) * 0.4; c.fillStyle = '#fff'; c.fillRect(s[0] * W, s[1] * H, 2, 2); }); c.globalAlpha = 1;
          c.fillStyle = '#fef3c7'; c.beginPath(); c.arc(W * 0.82, 70, 24, 0, 7); c.fill(); c.fillStyle = '#120726'; for (var bt = 0; bt < 3; bt++) { var bx = (W * 0.2 + bt * 90 + t * 25) % W, by = 110 + Math.sin(t * 3 + bt) * 12; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - 12, by - 6 - Math.abs(Math.sin(t * 9 + bt)) * 6); c.lineTo(bx - 5, by + 2); c.lineTo(bx + 5, by + 2); c.lineTo(bx + 12, by - 6 - Math.abs(Math.sin(t * 9 + bt)) * 6); c.closePath(); c.fill(); }
          houses.forEach(function (hs) { var top = ground - hs.h;
            if (hs.snow) { var cx = hs.x + hs.w / 2; c.fillStyle = '#111827'; c.beginPath(); c.ellipse(cx, ground - 14, 20, 14, 0, 0, 7); c.fill(); c.beginPath(); c.arc(cx + 14, ground - 30, 11, 0, 7); c.fill(); c.beginPath(); c.moveTo(cx + 6, ground - 36); c.lineTo(cx + 8, top + 8); c.lineTo(cx + 14, ground - 40); c.moveTo(cx + 16, ground - 40); c.lineTo(cx + 22, top + 8); c.lineTo(cx + 24, ground - 34); c.fill(); c.fillStyle = '#facc15'; c.fillRect(cx + 9, ground - 32, 4, 2); c.fillRect(cx + 17, ground - 32, 4, 2); c.fillStyle = '#c4b5fd'; c.font = 'bold 12px sans-serif'; c.fillText('z', cx - 4, ground - 44 - Math.sin(t * 2) * 4); return; }
            c.fillStyle = hs.col; c.fillRect(hs.x, top, hs.w, hs.h); c.fillStyle = '#1f1630'; c.beginPath(); c.moveTo(hs.x - 6, top + 2); c.lineTo(hs.x + hs.w * 0.35, top - 18); c.lineTo(hs.x + hs.w + 6, top + 2); c.closePath(); c.fill();
            var px = hs.x + hs.w * 0.7; c.fillStyle = hs.gold ? '#facc15' : '#f97316'; c.beginPath(); c.ellipse(px, top - 14, 14, 12, 0, 0, 7); c.fill(); c.fillStyle = '#15803d'; c.fillRect(px - 2, top - 30, 4, 5); c.fillStyle = '#111827'; c.fillRect(px - 12, top - 27, 24, 4); c.fillStyle = hs.gold ? '#7c2d12' : '#fde047'; c.beginPath(); c.moveTo(px - 8, top - 16); c.lineTo(px - 4, top - 20); c.lineTo(px, top - 16); c.moveTo(px + 1, top - 16); c.lineTo(px + 5, top - 20); c.lineTo(px + 9, top - 16); c.fill(); c.fillRect(px - 7, top - 10, 14, 3);
            if (hs.done) { c.fillStyle = 'rgba(250,204,21,.7)'; c.beginPath(); c.arc(hs.x + hs.w * 0.7, top - 40 - Math.sin(t * 3) * 3, 5, 0, 7); c.fill(); }
            c.fillStyle = '#fb923c'; for (var k = 0; k < 2; k++) c.fillRect(hs.x + 10 + k * (hs.w - 34), top + 18, 14, 16); });
          c.fillStyle = '#2a1f3d'; c.fillRect(0, ground, W, H - ground); c.fillStyle = 'rgba(196,181,253,.25)'; for (i = 0; i < 6; i++) { c.beginPath(); c.ellipse((i * 97 + t * 15) % (W + 80) - 40, ground + 4, 60, 10, 0, 0, 7); c.fill(); }
          gifts.forEach(function (gf) { c.save(); c.translate(gf.x, gf.y); c.rotate(gf.rot); c.fillStyle = gf.col; c.beginPath(); c.ellipse(0, 0, 8, 6, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(-7, 0); c.lineTo(-14, -5); c.lineTo(-14, 5); c.closePath(); c.moveTo(7, 0); c.lineTo(14, -5); c.lineTo(14, 5); c.closePath(); c.fill(); c.restore(); });
          // Wisp the ghost
          c.save(); c.translate(sx, 74 + Math.sin(t * 3) * 4); if (sdir < 0) c.scale(-1, 1); c.fillStyle = '#f5f3ff'; c.beginPath(); c.arc(0, -6, 16, Math.PI, 0); c.lineTo(16, 12); for (var wq = 0; wq < 4; wq++) c.lineTo(12 - wq * 8, wq % 2 ? 12 : 18 + Math.sin(t * 8 + wq) * 2); c.lineTo(-16, 12); c.closePath(); c.fill(); c.fillStyle = '#1e1b4b'; c.beginPath(); c.ellipse(-5, -8, 2.6, 3.6, 0, 0, 7); c.ellipse(5, -8, 2.6, 3.6, 0, 0, 7); c.fill(); c.beginPath(); c.arc(0, 0, 3, 0, Math.PI); c.fill(); c.fillStyle = '#f97316'; c.fillRect(14, -2, 12, 10); c.fillStyle = '#111827'; c.fillRect(13, -4, 14, 3); c.restore();
          for (i = 0; i < pops.length; i++) { var q = pops[i]; c.globalAlpha = Math.max(0, q.life / 0.7); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, 4, 0, 7); c.fill(); } c.globalAlpha = 1;
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ffffff' : 'rgba(255,255,255,.35)');
          U.text(c, String(api.score), W - 16, 32, 30, '#fff', 'right', '#4c1d95'); U.text(c, 'BOO DROP', W / 2, 30, 14, '#fff', 'center', '#4c1d95');
          if (msgT > 0) U.text(c, msg[0], W / 2, 140, 20, msg[1], 'center', '#000');
          if (api.playing && t < 4) U.text(c, api.touch ? 'TAP to drop a candy!' : 'CLICK or SPACE to drop!', W / 2, H - 14, 18, '#fde68a', 'center', '#000');
        },
        dbg: function () { return { t: t, hearts: hearts, sx: Math.round(sx), gifts: gifts.length, v: speed(), H: api.H, houses: houses.map(function (h) { return [h.x, h.snow, h.gold, h.done, h.w, h.h]; }), score: api.score }; },
        onDown: function () { drop(); },
        onKey: function (k, dn) { if (dn === false) return; if (k === ' ' || k === 'Space' || k === 'Enter') drop(); }
      };
    }
  });
})();
