/* Grok Arcade - bonus game #47: Baggage Belt Rush (Grok Sky: Airport Tycoon tie-in).
   Torty's Airport baggage hall. Tagged bags ride the belt down to the sorter: TAP the cart whose city matches the FRONT bag's tag (keys 1-3).
   Gold VIP bags are worth 3. Wrong cart or a bag falling off the belt costs a heart. 3 hearts; the belt speeds up. Hall drawn once per size offscreen. */
(function () {
  'use strict';
  var U = GA.MG.U;
  var CITY = [{ n: 'PARIS', c: '#38bdf8' }, { n: 'TOKYO', c: '#f472b6' }, { n: 'RIO', c: '#facc15' }];
  var BAGC = ['#7c2d12', '#1e3a8a', '#365314', '#581c87', '#334155'];
  GA.MG.register({
    id: 'bagbelt', name: 'Baggage Belt Rush', ticketDiv: 4,
    howTouch: 'Torty\u2019s Airport baggage hall is SWAMPED! Bags ride the belt down to the sorter: TAP the cart (PARIS, TOKYO or RIO) that matches the FRONT bag\u2019s tag. Gold VIP bags are worth 3. A wrong cart or a bag falling off the belt costs a heart!',
    howKeys: 'Torty\u2019s Airport baggage hall is SWAMPED! Bags ride the belt down to the sorter: press 1-3 (or click a cart) to send the FRONT bag to the matching city. Gold VIP bags are worth 3. A wrong cart or a bag falling off the belt costs a heart!',
    create: function (api) {
      var t, hearts, bags, spawn, pops, msg, msgT, hurtT, sorted, bg = null, bgKey = '', flash = [0, 0, 0];
      function L() { var W = api.W, H = api.H, top = 66, ch = Math.min(150, H * 0.2), cy = H - ch - 14, cw = (W - 48) / 3, bx = W / 2, bw = Math.min(150, W * 0.42), end = cy - 34;
        var carts = []; for (var i = 0; i < 3; i++) carts.push({ x: 12 + i * (cw + 12), y: cy, w: cw, h: ch });
        return { W: W, H: H, top: top, carts: carts, bx: bx, bw: bw, end: end }; }
      function say(s, col) { msg = [s, col]; msgT = 1; }
      function burst(x, y, col, n) { for (var i = 0; i < (n || 10) && pops.length < 70; i++) { var a = Math.random() * 6.28, s = 60 + Math.random() * 160; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.7, col: col }); } }
      function hurt(why) { if (hurtT > 0) return; hearts--; hurtT = 0.5; api.sfx('lifelost'); say(why, '#fecaca'); if (hearts <= 0) api.gameOver(); }
      function speed() { return Math.min(260, 70 + t * 2.4); }
      function buildBg() {
        var l = L(), d = api.dpr || 1, key = l.W + 'x' + l.H + '@' + d; if (bg && bgKey === key) return; bgKey = key;
        bg = document.createElement('canvas'); bg.width = Math.round(l.W * d); bg.height = Math.round(l.H * d); var g = bg.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
        var gr = g.createLinearGradient(0, 0, 0, l.H); gr.addColorStop(0, '#0c4a6e'); gr.addColorStop(1, '#0f172a'); g.fillStyle = gr; g.fillRect(0, 0, l.W, l.H);
        for (var i = 0; i < 12; i++) { g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(0, l.top + i * 60, l.W, 2); }
        g.fillStyle = '#1f2937'; g.fillRect(l.bx - l.bw / 2 - 8, l.top, l.bw + 16, l.end - l.top + 10);
        g.fillStyle = '#374151'; g.fillRect(l.bx - l.bw / 2, l.top, l.bw, l.end - l.top);
        g.fillStyle = '#facc15'; for (i = 0; l.top + i * 24 < l.end; i++) g.fillRect(l.bx - l.bw / 2 - 8, l.top + i * 24, 8, 12), g.fillRect(l.bx + l.bw / 2, l.top + i * 24 + 12, 8, 12);
        g.font = '34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('\uD83D\uDC22', 26, l.top + 30); g.fillText('\uD83D\uDC36', l.W - 26, l.top + 30);
        U.text(g, 'TORTY', 26, l.top + 58, 10, '#bbf7d0'); U.text(g, 'CANDY', l.W - 26, l.top + 58, 10, '#fde68a');
      }
      function front() { var f = null; for (var i = 0; i < bags.length; i++) if (!f || bags[i].y > f.y) f = bags[i]; return f; }
      function send(i) { if (!api.playing || i < 0 || i > 2) return; flash[i] = 0.18; var f = front(), l = L(), c = l.carts[i]; if (!f) return;
        bags.splice(bags.indexOf(f), 1);
        if (f.city === i) { var pts = f.vip ? 3 : 1; api.addScore(pts); sorted++; api.sfx('coin'); burst(c.x + c.w / 2, c.y + 20, f.vip ? '#fde047' : CITY[i].c, f.vip ? 16 : 9); say(f.vip ? 'VIP bag! +3' : CITY[i].n + '! +1', f.vip ? '#fde047' : '#bbf7d0'); }
        else hurt('Wrong cart! That was ' + CITY[f.city].n); }
      function inCart(l, x, y) { for (var i = 0; i < 3; i++) { var c = l.carts[i]; if (x >= c.x && x <= c.x + c.w && y >= c.y - 20 && y <= c.y + c.h) return i; } return -1; }
      return {
        reset: function () { t = 0; hearts = 3; bags = []; spawn = 0.6; pops = []; msgT = 0; hurtT = 0; sorted = 0; flash = [0, 0, 0]; },
        resize: function () { bg = null; },
        update: function (dt) {
          var i; if (msgT > 0) msgT -= dt; if (hurtT > 0) hurtT -= dt; for (i = 0; i < 3; i++) if (flash[i] > 0) flash[i] -= dt;
          for (i = pops.length - 1; i >= 0; i--) { var p = pops[i]; p.life -= dt; p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) pops.splice(i, 1); }
          if (!api.playing) return; t += dt; var l = L();
          spawn -= dt; if (spawn <= 0 && bags.length < 6) { bags.push({ y: l.top - 30, city: Math.floor(Math.random() * 3), vip: Math.random() < 0.12, col: BAGC[Math.floor(Math.random() * BAGC.length)], wob: Math.random() * 6 }); spawn = Math.max(0.55, 1.6 - t * 0.02); }
          var sp = speed(); bags.sort(function (a, b) { return b.y - a.y; });
          for (i = 0; i < bags.length; i++) { var lim = i === 0 ? 1e9 : bags[i - 1].y - 56; bags[i].y = Math.min(bags[i].y + sp * dt, lim); }
          if (bags.length && bags[0].y > l.end) { var b = bags.shift(); burst(l.bx, l.end, '#94a3b8', 8); hurt('Bag fell off the belt!'); }
        },
        draw: function (c) {
          var l = L(), i; buildBg(); c.drawImage(bg, 0, 0, l.W, l.H);
          var off = (t * speed()) % 24; c.fillStyle = 'rgba(0,0,0,.25)'; for (i = -1; l.top + i * 24 < l.end; i++) { var yy = l.top + i * 24 + off; if (yy > l.top && yy < l.end) c.fillRect(l.bx - l.bw / 2, yy, l.bw, 3); }
          var f = front();
          for (i = 0; i < bags.length; i++) { var b = bags[i], w = l.bw * 0.7, h = 44, x = l.bx - w / 2, y = b.y - h / 2;
            c.fillStyle = b.vip ? '#ca8a04' : b.col; U.rr(c, x, y, w, h, 8); c.fill(); if (b === f) { c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke(); }
            c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(l.bx - 12, y - 8, 24, 8);
            c.fillStyle = CITY[b.city].c; U.rr(c, l.bx - 30, y + 10, 60, 24, 5); c.fill(); U.text(c, CITY[b.city].n, l.bx, y + 22, 12, '#0f172a'); if (b.vip) U.text(c, '\u2B50', x + w - 10, y + 10, 14, '#fff'); }
          for (i = 0; i < 3; i++) { var ct = l.carts[i];
            c.fillStyle = flash[i] > 0 ? '#fff' : '#1e293b'; U.rr(c, ct.x, ct.y, ct.w, ct.h, 14); c.fill(); c.strokeStyle = CITY[i].c; c.lineWidth = 4; c.stroke();
            c.fillStyle = '#111827'; c.beginPath(); c.arc(ct.x + ct.w * 0.25, ct.y + ct.h, 9, 0, 7); c.arc(ct.x + ct.w * 0.75, ct.y + ct.h, 9, 0, 7); c.fill();
            U.text(c, '\u2708\uFE0F', ct.x + ct.w / 2, ct.y + ct.h * 0.38, Math.min(34, ct.h * 0.3), '#fff'); U.text(c, (i + 1) + ' ' + CITY[i].n, ct.x + ct.w / 2, ct.y + ct.h * 0.72, 14, CITY[i].c); }
          for (i = 0; i < pops.length; i++) { var q = pops[i]; c.globalAlpha = Math.max(0, q.life / 0.7); c.fillStyle = q.col; c.fillRect(q.x - 3, q.y - 3, 6, 6); } c.globalAlpha = 1;
          c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, l.W, 58);
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 22, 22, i < hearts ? '#ef4444' : 'rgba(255,255,255,.2)');
          U.text(c, String(api.score), l.W - 16, 24, 30, '#fff', 'right', '#0c4a6e'); U.text(c, 'BAGGAGE BELT RUSH', l.W / 2, 18, 15, '#38bdf8', 'center', '#000'); U.text(c, '\uD83E\uDDF3 ' + sorted + ' sorted', l.W / 2, 42, 12, '#e5e7eb', 'center', '#000');
          if (!api.playing && !bags.length) U.text(c, 'BAGGAGE BELT RUSH', l.W / 2, l.top + 120, 22, '#7dd3fc', 'center');
          if (msgT > 0) U.text(c, msg[0], l.W / 2, l.carts[0].y - 18, 18, msg[1], 'center', '#000');
        },
        dbg: function () { return { t: t, hearts: hearts, sorted: sorted, score: api.score, bags: bags.length }; },
        onDown: function (x, y) { send(inCart(L(), x, y)); },
        onKey: function (k, dn) { if (dn === false) return; send('123'.indexOf(k)); }
      };
    }
  });
})();
