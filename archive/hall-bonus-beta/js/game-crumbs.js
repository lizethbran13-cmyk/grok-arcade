/* Grok Arcade - bonus game #33: Crumb Patrol (Grok Ratita Industries HQ tie-in).
   Sweepy the robo-vac cleans the HQ cafeteria floor. DRAG (or arrow keys / WASD) to steer. Crumbs +1, cheese bits +3.
   Don't suck up the GOLDEN GOUDA (it's not a crumb!), dodge the green goo puddles, and get out from under the
   giant intern sneakers before they STOMP (their shadow shows where). 3 hearts; it gets busier the more you clean. */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'crumbs', name: 'Crumb Patrol', ticketDiv: 4,
    howTouch: 'You are Sweepy the robo-vac! DRAG to steer. Crumbs = +1, cheese = +3. Do NOT suck up the GOLDEN GOUDA (it\u2019s not a crumb!), avoid green goo puddles, and move out from under the big shadows before the intern\u2019s sneaker STOMPS.',
    howKeys: 'You are Sweepy the robo-vac! Steer with the ARROW keys or WASD (or drag with the mouse). Crumbs = +1, cheese = +3. Do NOT suck up the GOLDEN GOUDA (it\u2019s not a crumb!), avoid green goo puddles, and move out from under the big shadows before the intern\u2019s sneaker STOMPS.',
    create: function (api) {
      var t, hearts, sx, sy, vx, vy, ang, tgt, keys, items, goo, stomps, pops, msg, msgT, hurtT, spawnT, stompT, cleaned, R = 24;
      function say(s, col) { msg = [s, col]; msgT = 1.1; }
      function busy() { return Math.min(1, cleaned / 60); }
      function rnd(a, b) { return a + Math.random() * (b - a); }
      function freeSpot() { for (var i = 0; i < 20; i++) { var x = rnd(40, api.W - 40), y = rnd(110, api.H - 50); if (Math.hypot(x - sx, y - sy) > 90) return [x, y]; } return [api.W / 2, api.H / 2]; }
      function spawn() { var p = freeSpot(), r = Math.random(), k = r < 0.12 + busy() * 0.06 ? 'gouda' : r < 0.32 ? 'cheese' : 'crumb'; items.push({ x: p[0], y: p[1], k: k, life: k === 'gouda' ? 5 : 9 + Math.random() * 4, w: Math.random() * 6 }); }
      function hurt(why) { if (hurtT > 0) return; hearts--; hurtT = 1.4; api.sfx('lifelost'); say(why, '#ff6b6b'); if (hearts <= 0) api.gameOver(); }
      function burst(x, y, col, n) { for (var i = 0; i < (n || 10); i++) { var a = Math.random() * 6.28, s = 50 + Math.random() * 120; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6, col: col }); } }
      return {
        reset: function () { t = 0; hearts = 3; sx = api.W / 2; sy = api.H * 0.6; vx = vy = 0; ang = 0; tgt = null; keys = {}; items = []; goo = []; stomps = []; pops = []; msgT = 0; hurtT = 0; spawnT = 0; stompT = 4; cleaned = 0; for (var i = 0; i < 6; i++) spawn(); var g = freeSpot(); goo.push({ x: g[0], y: g[1], r: 34 }); },
        resize: function () { sx = Math.min(sx, api.W - R); sy = Math.min(sy, api.H - R); },
        update: function (dt) {
          if (msgT > 0) msgT -= dt; if (hurtT > 0) hurtT -= dt;
          for (var i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          if (!api.playing) return; t += dt;
          // steering: towards the finger, or keys
          var ax = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), ay = (keys.d ? 1 : 0) - (keys.u ? 1 : 0), slow = goo.some(function (g) { return Math.hypot(g.x - sx, g.y - sy) < g.r + R * 0.4; });
          if (tgt && !ax && !ay) { var dx = tgt[0] - sx, dy = tgt[1] - sy, d = Math.hypot(dx, dy); if (d > 6) { ax = dx / d; ay = dy / d; } }
          var al = Math.hypot(ax, ay) || 1, sp = (slow ? 110 : 250) + busy() * 40; vx += ((ax / al) * sp - vx) * Math.min(1, dt * 6); vy += ((ay / al) * sp - vy) * Math.min(1, dt * 6);
          sx = Math.max(R, Math.min(api.W - R, sx + vx * dt)); sy = Math.max(90, Math.min(api.H - R, sy + vy * dt)); if (Math.hypot(vx, vy) > 20) ang = Math.atan2(vy, vx);
          if (slow && Math.random() < dt * 1.5) hurt('Goo in the brushes! Yuck!');
          // items
          spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(0.45, 1.2 - busy() * 0.6); }
          for (var k = items.length - 1; k >= 0; k--) { var it = items[k]; it.life -= dt; it.w += dt; if (it.life <= 0) { items.splice(k, 1); continue; }
            if (Math.hypot(it.x - sx, it.y - sy) < R + 10) { items.splice(k, 1);
              if (it.k === 'gouda') { hurt('NOT A CRUMB! That\u2019s the Golden Gouda!'); burst(it.x, it.y, '#ffd23f', 18); }
              else { var pts = it.k === 'cheese' ? 3 : 1; api.addScore(pts); cleaned++; api.sfx(pts > 1 ? 'point' : 'eat'); burst(it.x, it.y, pts > 1 ? '#ffd23f' : '#fde7c4', 6); if (cleaned % 15 === 0) { say('Sparkly clean! \u2728', '#7dd3fc'); if (goo.length < 4) { var g2 = freeSpot(); goo.push({ x: g2[0], y: g2[1], r: 28 + Math.random() * 14 }); } } } } }
          // sneaker stomps: shadow grows for 1.3 s, then STOMP
          stompT -= dt; if (stompT <= 0) { stomps.push({ x: Math.max(50, Math.min(api.W - 50, sx + rnd(-60, 60))), y: Math.max(130, Math.min(api.H - 50, sy + rnd(-60, 60))), t: 0 }); stompT = Math.max(1.4, 3.6 - busy() * 2); }
          for (var s = stomps.length - 1; s >= 0; s--) { var st = stomps[s], was = st.t; st.t += dt; if (was < 1.3 && st.t >= 1.3) { api.sfx('crash'); burst(st.x, st.y, '#cbd5e1', 12); if (Math.hypot(st.x - sx, st.y - sy) < 52 + R * 0.5) hurt('STOMP! Watch the shadows!'); } if (st.t > 1.9) stomps.splice(s, 1); }
          if (cleaned >= 40 && GA.Prog) GA.Prog.event('crumbs40');
        },
        draw: function (c) {
          var W = api.W, H = api.H, i;
          // cafeteria checker floor
          var ts = 48; for (var y = 0; y < H; y += ts) for (var x = 0; x < W; x += ts) { c.fillStyle = ((x + y) / ts) % 2 ? '#ffe4ef' : '#ffffff'; c.fillRect(x, y, ts, ts); }
          c.fillStyle = '#ff4fa0'; c.fillRect(0, 0, W, 76); c.fillStyle = '#ffd23f'; c.fillRect(0, 76, W, 6);
          goo.forEach(function (g) { c.fillStyle = 'rgba(74,222,128,.75)'; c.beginPath(); for (var a = 0; a <= 12; a++) { var an = a / 12 * 6.283, rr = g.r * (1 + Math.sin(an * 3 + t * 2) * 0.12); c.lineTo(g.x + Math.cos(an) * rr, g.y + Math.sin(an) * rr * 0.7); } c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(g.x - g.r * 0.3, g.y - g.r * 0.2, 5, 0, 7); c.fill(); });
          items.forEach(function (it) { var bob = Math.sin(it.w * 5) * 2, fade = it.life < 1.5 ? 0.4 + 0.6 * Math.abs(Math.sin(it.life * 10)) : 1; c.globalAlpha = fade;
            if (it.k === 'crumb') { c.fillStyle = '#d4a373'; c.beginPath(); c.arc(it.x, it.y + bob, 6, 0, 7); c.arc(it.x + 7, it.y + 3 + bob, 4, 0, 7); c.fill(); }
            else if (it.k === 'cheese') { c.fillStyle = '#ffc93c'; c.beginPath(); c.moveTo(it.x - 12, it.y + 8 + bob); c.lineTo(it.x + 12, it.y + 8 + bob); c.lineTo(it.x + 12, it.y - 8 + bob); c.closePath(); c.fill(); c.fillStyle = '#f59e0b'; c.beginPath(); c.arc(it.x + 6, it.y + 3 + bob, 2.5, 0, 7); c.fill(); }
            else { c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(it.x, it.y + bob, 20, 13, 0, 0, 7); c.fill(); c.strokeStyle = '#b45309'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#fff7'; c.beginPath(); c.arc(it.x - 6, it.y - 4 + bob, 4, 0, 7); c.fill(); U.text(c, '\u2716', it.x, it.y - 20 + bob, 14, '#ef4444', 'center', '#fff'); }
            c.globalAlpha = 1; });
          stomps.forEach(function (st) { var k = Math.min(1, st.t / 1.3); if (st.t < 1.3) { c.fillStyle = 'rgba(30,20,60,' + (0.15 + k * 0.35) + ')'; c.beginPath(); c.ellipse(st.x, st.y, 30 + k * 30, 18 + k * 18, 0, 0, 7); c.fill(); }
            else { var up = Math.min(1, (st.t - 1.3) / 0.6); c.globalAlpha = 1 - up; c.fillStyle = '#ff4fa0'; U.rr(c, st.x - 44, st.y - 34 - up * 40, 88, 60, 26); c.fill(); c.fillStyle = '#fff'; U.rr(c, st.x - 46, st.y + 14 - up * 40, 92, 14, 6); c.fill(); c.globalAlpha = 1; } });
          // Sweepy: round body, bumper, spinning brush, little face screen
          var fl = hurtT > 0 && Math.floor(hurtT * 12) % 2 === 0; if (!fl) { c.save(); c.translate(sx, sy); c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(3, 6, R, R * 0.8, 0, 0, 7); c.fill();
            c.rotate(ang); c.strokeStyle = '#94a3b8'; c.lineWidth = 2; for (var b = 0; b < 3; b++) { var ba = t * 20 + b * 2.09; c.beginPath(); c.moveTo(R * 0.7, R * 0.6); c.lineTo(R * 0.7 + Math.cos(ba) * 12, R * 0.6 + Math.sin(ba) * 12); c.stroke(); }
            c.fillStyle = '#e2e8f0'; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill(); c.fillStyle = '#ff4fa0'; c.beginPath(); c.arc(0, 0, R, -1.1, 1.1); c.lineTo(0, 0); c.fill(); c.fillStyle = '#f8fafc'; c.beginPath(); c.arc(0, 0, R * 0.72, 0, 7); c.fill();
            c.rotate(-ang); c.fillStyle = '#1e293b'; U.rr(c, -12, -8, 24, 14, 4); c.fill(); c.fillStyle = '#3ff0ff'; c.fillRect(-7, -4, 4, 5); c.fillRect(3, -4, 4, 5); c.restore(); }
          for (i = 0; i < pops.length; i++) { var q = pops[i]; c.globalAlpha = Math.max(0, q.life / 0.6); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, 4, 0, 7); c.fill(); } c.globalAlpha = 1;
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ffffff' : 'rgba(255,255,255,.35)');
          U.text(c, String(api.score), W - 16, 32, 30, '#fff', 'right', '#7a0b48'); U.text(c, 'CRUMB PATROL', W / 2, 58, 14, '#fff', 'center', '#7a0b48');
          if (msgT > 0) U.text(c, msg[0], W / 2, 112, 20, msg[1], 'center', '#000');
          if (api.playing && t < 4) U.text(c, api.touch ? 'DRAG to steer Sweepy!' : 'ARROWS / WASD to steer Sweepy!', W / 2, H - 26, 18, '#7a0b48', 'center', '#fff');
        },
        dbg: function () { return { t: t, hearts: hearts, sx: sx, sy: sy, items: items.length, goo: goo.length, stomps: stomps.length, cleaned: cleaned }; },
        onDown: function (x, y) { tgt = [x, y]; }, onMove: function (x, y, down) { if (down) tgt = [x, y]; }, onUp: function () { tgt = null; },
        onKey: function (k, down) { var m = { ArrowLeft: 'l', a: 'l', KeyA: 'l', ArrowRight: 'r', d: 'r', KeyD: 'r', ArrowUp: 'u', w: 'u', KeyW: 'u', ArrowDown: 'd', s: 'd', KeyS: 'd' }[k]; if (m) keys[m] = down; }
      };
    }
  });
})();
