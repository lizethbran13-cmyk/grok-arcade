/* Grok Arcade - bonus game #43: Cart Dash (Grok Grocery Tycoon tie-in).
   Push your Grok cart up a Shopsville aisle with 3 lanes. TAP the left or right side (or arrow keys) to swerve a lane.
   Catch groceries on your list (+1), golden Grok Goods (+3) and a sale-tag streak bonus; dodge spills and runaway carts (each costs a heart).
   3 hearts; the aisle speeds up. Perf: the shelf walls are drawn once to an offscreen strip and scrolled; tiny particle pool. */
(function () {
  'use strict';
  var U = GA.MG.U;
  var FOOD = [['#ef4444', 'apple'], ['#facc15', 'banana'], ['#f8fafc', 'milk'], ['#d97706', 'bread'], ['#22c55e', 'lettuce'], ['#f97316', 'carrot'], ['#a855f7', 'grapes'], ['#38bdf8', 'water']];
  GA.MG.register({
    id: 'cartdash', name: 'Cart Dash', ticketDiv: 4,
    howTouch: 'Shopping spree in Shopsville! TAP the left or right side to swerve your Grok cart between the 3 aisle lanes. Catch groceries (+1) and golden Grok Goods (+3). Dodge spills and runaway carts: each one costs a heart!',
    howKeys: 'Shopping spree in Shopsville! Press LEFT / RIGHT (or A / D, or click a side) to swerve your Grok cart between the 3 aisle lanes. Catch groceries (+1) and golden Grok Goods (+3). Dodge spills and runaway carts: each one costs a heart!',
    create: function (api) {
      var t, hearts, lane, cx, items, pops, msg, msgT, hurtT, spawnT, scroll, caught, streak, strip = null, stripKey = '';
      function laneX(k) { var W = api.W, m = W * 0.2; return m + (W - 2 * m) * (k + 0.5) / 3; }
      function cartY() { return api.H - 130; }
      function speed() { return 170 + Math.min(260, t * 5.5); }
      function say(s, col) { msg = [s, col]; msgT = 0.9; }
      function burst(x, y, col, n) { for (var i = 0; i < (n || 8) && pops.length < 60; i++) { var a = Math.random() * 6.28, s = 60 + Math.random() * 140; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 90, life: 0.6, col: col }); } }
      function hurt(why) { if (hurtT > 0) return; hearts--; hurtT = 0.8; streak = 0; api.sfx('lifelost'); say(why, '#fecaca'); if (hearts <= 0) api.gameOver(); }
      function spawn() { var r = Math.random(), k = r < 0.13 ? 'spill' : r < 0.24 ? 'cart' : r < 0.36 ? 'gold' : 'food'; var ln = (Math.random() * 3) | 0;
        if (k === 'spill' || k === 'cart') { var blocked = items.filter(function (i) { return (i.k === 'spill' || i.k === 'cart') && i.y < 120; }).map(function (i) { return i.lane; }); if (blocked.length >= 2 && blocked.indexOf(ln) < 0) k = 'food'; }
        items.push({ lane: ln, y: -40, k: k, f: FOOD[(Math.random() * FOOD.length) | 0], spin: Math.random() * 6 }); }
      function swerve(d) { if (!api.playing) return; var n = Math.max(0, Math.min(2, lane + d)); if (n !== lane) { lane = n; api.sfx('click'); } }
      // shelves: drawn once per size into a tall strip, then scrolled (no per-frame product drawing)
      function buildStrip() { var W = api.W, H = api.H, key = W + 'x' + H; if (strip && stripKey === key) return; stripKey = key; strip = document.createElement('canvas'); var sw = Math.round(W * 0.2), sh = 240; strip.width = sw * 2; strip.height = sh; var g = strip.getContext('2d');
        for (var side = 0; side < 2; side++) { var ox = side * sw; g.fillStyle = side ? '#16a34a' : '#ea580c'; g.fillRect(ox, 0, sw, sh); g.fillStyle = '#f1f5f9'; g.fillRect(ox + (side ? 0 : sw - 8), 0, 8, sh);
          for (var r = 0; r < 4; r++) { var y = r * 60; g.fillStyle = '#e2e8f0'; g.fillRect(ox + 4, y + 50, sw - 8, 6); for (var k = 0; k < 5; k++) { var f = FOOD[(r * 5 + k + side * 3) % FOOD.length]; g.fillStyle = f[0]; var bx = ox + 6 + k * (sw - 12) / 5; U.rr(g, bx, y + 22, (sw - 12) / 5 - 3, 28, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(bx + 3, y + 26, 4, 18); }
            g.fillStyle = '#facc15'; g.fillRect(ox + 8, y + 52, 14, 5); } } }
      function drawFood(c, x, y, f, s) { c.save(); c.translate(x, y); c.scale(s, s); var col = f[0], n = f[1];
        if (n === 'apple') { c.fillStyle = col; c.beginPath(); c.arc(0, 2, 14, 0, 7); c.fill(); c.fillStyle = '#15803d'; c.fillRect(-1.5, -16, 3, 7); c.beginPath(); c.ellipse(6, -12, 6, 3, -0.5, 0, 7); c.fill(); }
        else if (n === 'banana') { c.strokeStyle = col; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.arc(0, -10, 16, 0.5, 2.6); c.stroke(); }
        else if (n === 'milk') { c.fillStyle = col; c.fillRect(-10, -12, 20, 26); c.fillStyle = '#3b82f6'; c.fillRect(-10, 0, 20, 6); c.fillStyle = '#e2e8f0'; c.beginPath(); c.moveTo(-10, -12); c.lineTo(0, -20); c.lineTo(10, -12); c.fill(); }
        else if (n === 'bread') { c.fillStyle = col; U.rr(c, -15, -8, 30, 20, 9); c.fill(); c.strokeStyle = '#fde68a'; c.lineWidth = 2; for (var i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 8 - 3, -6); c.lineTo(i * 8 + 3, 2); c.stroke(); } }
        else if (n === 'lettuce') { c.fillStyle = col; for (var j = 0; j < 5; j++) { c.beginPath(); c.arc(Math.cos(j * 1.25) * 7, Math.sin(j * 1.25) * 7, 9, 0, 7); c.fill(); } c.fillStyle = '#86efac'; c.beginPath(); c.arc(0, 0, 6, 0, 7); c.fill(); }
        else if (n === 'carrot') { c.fillStyle = col; c.beginPath(); c.moveTo(-6, -10); c.lineTo(6, -10); c.lineTo(0, 16); c.closePath(); c.fill(); c.fillStyle = '#16a34a'; c.fillRect(-4, -18, 3, 8); c.fillRect(1, -18, 3, 8); }
        else if (n === 'grapes') { c.fillStyle = col; [[0, -8], [-6, -2], [6, -2], [0, 4], [-4, 10], [4, 10]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 5.5, 0, 7); c.fill(); }); }
        else { c.fillStyle = col; U.rr(c, -7, -14, 14, 28, 5); c.fill(); c.fillStyle = '#fff'; c.fillRect(-7, -4, 14, 7); }
        c.restore(); }
      function drawCart(c, x, y, col, tilt) { c.save(); c.translate(x, y); c.rotate(tilt || 0); c.strokeStyle = '#475569'; c.lineWidth = 4; c.beginPath(); c.moveTo(-26, -30); c.lineTo(-30, -44); c.stroke();
        c.fillStyle = col; c.beginPath(); c.moveTo(-26, -30); c.lineTo(26, -30); c.lineTo(20, 4); c.lineTo(-20, 4); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; for (var i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 12, -28); c.lineTo(i * 10, 2); c.stroke(); }
        c.fillStyle = '#1f2937'; c.beginPath(); c.arc(-16, 12, 6, 0, 7); c.arc(16, 12, 6, 0, 7); c.fill(); c.restore(); }
      return {
        reset: function () { t = 0; hearts = 3; lane = 1; cx = laneX(1); items = []; pops = []; msgT = 0; hurtT = 0; spawnT = 0.5; scroll = 0; caught = 0; streak = 0; },
        update: function (dt) {
          if (msgT > 0) msgT -= dt; if (hurtT > 0) hurtT -= dt;
          for (var i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.vy += 320 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          cx += (laneX(lane) - cx) * Math.min(1, dt * 16);
          if (!api.playing) return; t += dt; var v = speed(); scroll += v * dt;
          spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(0.3, 0.85 - t * 0.008) * (0.7 + Math.random() * 0.6); }
          var cy = cartY();
          for (i = items.length - 1; i >= 0; i--) { var it = items[i]; it.y += v * dt * (it.k === 'cart' ? 1.35 : 1); it.spin += dt * 3;
            if (!it.hit && it.lane === lane && Math.abs(it.y - (cy - 14)) < 30) { it.hit = true;
              if (it.k === 'spill') { hurt('Clean-up on aisle 3!'); burst(laneX(it.lane), cy, '#7dd3fc', 10); }
              else if (it.k === 'cart') { hurt('Runaway cart!'); burst(laneX(it.lane), cy - 20, '#94a3b8', 10); }
              else { var pts = it.k === 'gold' ? 3 : 1; streak++; if (streak > 0 && streak % 10 === 0) { pts += 5; say('SALE STREAK! +5', '#fde047'); api.sfx('perfect'); } else { api.sfx(pts > 1 ? 'perfect' : 'point'); if (pts > 1) say('GROK GOODS! +3', '#fde047'); }
                api.addScore(pts); caught++; burst(laneX(it.lane), cy - 30, pts > 1 ? '#facc15' : it.f[0], 8); if (caught >= 40 && GA.Prog) GA.Prog.event('cart40'); items.splice(i, 1); continue; } }
            if (it.y > api.H + 50) items.splice(i, 1); }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i; buildStrip();
          var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#fff7ed'); gr.addColorStop(1, '#fde68a'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
          var sw = strip.width / 2, off = scroll % strip.height;
          for (var y = -strip.height + off; y < H; y += strip.height) { c.drawImage(strip, 0, 0, sw, strip.height, 0, y, sw, strip.height); c.drawImage(strip, sw, 0, sw, strip.height, W - sw, y, sw, strip.height); }
          // checkered floor + lane stripes
          var m = W * 0.2, lw = (W - 2 * m) / 3, tile = 40, fo = scroll % (tile * 2);
          for (var ty = -tile * 2 + fo; ty < H; ty += tile) for (var tx = 0; tx < 6; tx++) { if (((Math.floor((ty - fo) / tile) + tx) & 1) === 0) { c.fillStyle = 'rgba(148,163,184,.18)'; c.fillRect(m + tx * lw / 2, ty, lw / 2, tile); } }
          c.fillStyle = 'rgba(234,88,12,.5)'; for (i = 1; i < 3; i++) for (var dy = -60 + (scroll % 60); dy < H; dy += 60) c.fillRect(m + lw * i - 2, dy, 4, 30);
          // hanging aisle sign
          c.fillStyle = '#16a34a'; U.rr(c, W / 2 - 92, 44, 184, 30, 8); c.fill(); U.text(c, 'SHOPSVILLE \u00b7 AISLE 3', W / 2, 59, 14, '#fff');
          items.forEach(function (it) { var x = laneX(it.lane), y = it.y;
            if (it.k === 'spill') { c.fillStyle = 'rgba(56,189,248,.75)'; c.beginPath(); c.ellipse(x, y, 30, 12, 0, 0, 7); c.ellipse(x + 14, y + 4, 14, 7, 0, 0, 7); c.fill(); c.fillStyle = '#facc15'; c.beginPath(); c.moveTo(x - 30, y - 6); c.lineTo(x - 22, y - 34); c.lineTo(x - 14, y - 6); c.closePath(); c.fill(); U.text(c, '!', x - 22, y - 16, 14, '#111'); }
            else if (it.k === 'cart') drawCart(c, x, y, '#94a3b8', Math.sin(it.spin) * 0.15);
            else if (it.k === 'gold') { c.fillStyle = 'rgba(253,224,71,.35)'; c.beginPath(); c.arc(x, y, 24 + Math.sin(it.spin * 2) * 3, 0, 7); c.fill(); c.fillStyle = '#facc15'; U.rr(c, -14 + x, y - 16, 28, 32, 6); c.fill(); c.fillStyle = '#7c3aed'; c.fillRect(x - 14, y - 4, 28, 9); U.text(c, 'GROK', x, y + 1, 8, '#fff'); }
            else { c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(x, y + 18, 14, 4, 0, 0, 7); c.fill(); drawFood(c, x, y + Math.sin(it.spin) * 3, it.f, 1.15); } });
          // your cart (flashes while hurt)
          if (!(hurtT > 0 && Math.floor(hurtT * 12) % 2)) { var cy = cartY(); drawCart(c, cx, cy, '#16a34a', (laneX(lane) - cx) * 0.004); c.fillStyle = '#f97316'; c.beginPath(); c.arc(cx - 6, cy - 34, 6, 0, 7); c.fill(); c.fillStyle = '#ef4444'; c.beginPath(); c.arc(cx + 8, cy - 33, 7, 0, 7); c.fill(); }
          for (i = 0; i < pops.length; i++) { var q = pops[i]; c.globalAlpha = Math.max(0, q.life / 0.6); c.fillStyle = q.col; c.fillRect(q.x - 3, q.y - 3, 6, 6); } c.globalAlpha = 1;
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 28, 22, i < hearts ? '#ef4444' : 'rgba(0,0,0,.2)');
          U.text(c, String(api.score), W - 16, 30, 30, '#fff', 'right', '#9a3412'); U.text(c, 'CART DASH', W / 2, 24, 15, '#fff', 'center', '#9a3412');
          if (streak >= 3) U.text(c, 'streak ' + streak, W / 2, 96, 13, '#16a34a');
          if (msgT > 0) U.text(c, msg[0], W / 2, H * 0.4, 22, msg[1], 'center', '#000');
          if (api.playing && t < 4) U.text(c, api.touch ? 'TAP left / right to swerve!' : 'LEFT / RIGHT to swerve!', W / 2, H - 24, 18, '#7c2d12', 'center', '#fff');
        },
        dbg: function () { return { t: t, hearts: hearts, lane: lane, items: items.length, score: api.score }; },
        onDown: function (x) { swerve(x < api.W / 2 ? -1 : 1); },
        onKey: function (k, dn) { if (dn === false) return; if (k === 'ArrowLeft' || k === 'a' || k === 'A') swerve(-1); else if (k === 'ArrowRight' || k === 'd' || k === 'D') swerve(1); }
      };
    }
  });
})();
