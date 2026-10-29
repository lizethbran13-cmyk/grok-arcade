/* Grok Arcade - bonus game #41: Paw Stamp Rush (Grok Ruffsources HQ tie-in).
   Forms ride a conveyor past Biscuit's desk. TAP to slam the paw stamp: a form under the stamp = +1 (golden hire form +3).
   A form that rolls off unstamped costs a heart. Stamping Candy's squeaky toy (or thin air) costs a heart too. 3 hearts; it speeds up. */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'pawstamp', name: 'Paw Stamp Rush', ticketDiv: 4,
    howTouch: 'Paperwork time! Forms ride the conveyor under Biscuit\u2019s paw stamp. TAP when a form is under the stamp. Form = +1, golden hire form = +3. An unstamped form costs a heart. Don\u2019t stamp Candy\u2019s squeaky toy!',
    howKeys: 'Paperwork time! Forms ride the conveyor under Biscuit\u2019s paw stamp. CLICK or press SPACE when a form is under the stamp. Form = +1, golden hire form = +3. An unstamped form costs a heart. Don\u2019t stamp Candy\u2019s squeaky toy!',
    create: function (api) {
      var t, hearts, items, pops, msg, msgT, hurtT, spawnT, cool, slam, stamped, belt;
      var SX = function () { return api.W * 0.5; }, BY = function () { return api.H * 0.62; };
      function say(s, col) { msg = [s, col]; msgT = 1.0; }
      function speed() { return 90 + Math.min(150, t * 3); }
      function burst(x, y, col, n) { for (var i = 0; i < (n || 10); i++) { var a = Math.random() * 6.28, s = 50 + Math.random() * 130; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.7, col: col }); } }
      function hurt(why) { if (hurtT > 0) return; hearts--; hurtT = 0.6; api.sfx('lifelost'); say(why, '#fca5a5'); if (hearts <= 0) api.gameOver(); }
      function spawn() { var r = Math.random(), k = r < 0.16 ? 'toy' : r < 0.3 ? 'gold' : 'form'; items.push({ x: -40, k: k, done: false, hue: (Math.random() * 3) | 0 }); }
      function stamp() { if (cool > 0 || !api.playing) return; cool = 0.22; slam = 0.18; var sx = SX(), best = null, bd = 34;
        items.forEach(function (it) { if (it.done) return; var d = Math.abs(it.x - sx); if (d < bd) { bd = d; best = it; } });
        if (!best) { api.sfx('click'); hurt('Stamped the desk!'); return; }
        if (best.k === 'toy') { best.done = true; best.squeak = 1; api.sfx('lifelost'); hurt('SQUEAK! That\u2019s Candy\u2019s toy!'); burst(sx, BY() - 20, '#f472b6', 12); return; }
        best.done = true; var pts = best.k === 'gold' ? 3 : 1; api.addScore(pts); stamped++; api.sfx(pts > 1 ? 'perfect' : 'point'); burst(sx, BY() - 20, pts > 1 ? '#ffd23f' : '#fb923c', 12); say(pts > 1 ? 'HIRED! +3' : bd < 10 ? 'Perfect paw!' : 'Stamped!', '#fff');
        if (stamped >= 40 && GA.Prog) GA.Prog.event('paw40'); }
      return {
        reset: function () { t = 0; hearts = 3; items = []; pops = []; msgT = 0; hurtT = 0; spawnT = 0.6; cool = 0; slam = 0; stamped = 0; belt = 0; },
        update: function (dt) {
          if (msgT > 0) msgT -= dt; if (hurtT > 0) hurtT -= dt; if (cool > 0) cool -= dt; if (slam > 0) slam -= dt;
          for (var i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.vy += 300 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          if (!api.playing) return; t += dt; var v = speed(); belt += v * dt;
          spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(0.42, 1.25 - t * 0.012) * (0.75 + Math.random() * 0.5); }
          for (i = items.length - 1; i >= 0; i--) { var it = items[i]; it.x += v * dt; if (it.x > api.W + 40) { if (!it.done && it.k !== 'toy') hurt('A form got away!'); items.splice(i, 1); } }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i, sx = SX(), by = BY();
          var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#fff7ed'); gr.addColorStop(0.55, '#fed7aa'); gr.addColorStop(1, '#c8634a'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
          // office wall: window, RUFFSOURCES banner, clock
          c.fillStyle = '#bae6fd'; U.rr(c, W * 0.08, 64, W * 0.26, 90, 8); c.fill(); c.fillStyle = '#fff'; c.fillRect(W * 0.08 + W * 0.13 - 2, 64, 4, 90);
          c.fillStyle = '#14b8a6'; U.rr(c, W * 0.42, 70, W * 0.5, 34, 8); c.fill(); U.text(c, 'RUFFSOURCES HQ', W * 0.67, 88, 15, '#fff');
          c.fillStyle = '#fff'; c.beginPath(); c.arc(W * 0.67, 138, 20, 0, 7); c.fill(); c.strokeStyle = '#475569'; c.lineWidth = 3; c.beginPath(); c.moveTo(W * 0.67, 138); c.lineTo(W * 0.67 + Math.cos(t) * 14, 138 + Math.sin(t) * 14); c.stroke();
          // conveyor
          c.fillStyle = '#334155'; c.fillRect(0, by, W, 22); c.fillStyle = '#64748b'; for (i = -1; i < W / 30 + 1; i++) c.fillRect(((i * 30 + belt) % (W + 30)) - 15, by + 4, 14, 4);
          c.fillStyle = '#1e293b'; c.fillRect(0, by + 22, W, 10);
          // target marker under stamp
          c.fillStyle = 'rgba(255,138,61,.25)'; c.fillRect(sx - 30, by - 60, 60, 60);
          items.forEach(function (it) { var x = it.x, y = by - 4;
            if (it.k === 'toy') { if (it.squeak) { c.save(); c.translate(x, y - 6); c.scale(1.3, 0.6); } else { c.save(); c.translate(x, y - 14 - Math.abs(Math.sin(t * 6)) * 4); }
              c.fillStyle = '#f472b6'; c.beginPath(); c.ellipse(0, 0, 18, 11, 0, 0, 7); c.fill(); c.beginPath(); c.arc(-16, -6, 7, 0, 7); c.arc(-16, 6, 7, 0, 7); c.arc(16, -6, 7, 0, 7); c.arc(16, 6, 7, 0, 7); c.fill(); c.restore(); return; }
            c.fillStyle = it.k === 'gold' ? '#fde047' : ['#ffffff', '#e0f2fe', '#fef9c3'][it.hue]; c.save(); c.translate(x, y - 22); c.rotate(-0.05); U.rr(c, -22, -22, 44, 44, 4); c.fill(); c.strokeStyle = it.k === 'gold' ? '#ca8a04' : '#94a3b8'; c.lineWidth = 2; c.stroke();
            c.fillStyle = '#94a3b8'; for (var l = 0; l < 4; l++) c.fillRect(-15, -14 + l * 7, l === 0 ? 20 : 30, 2.5);
            if (it.k === 'gold') U.text(c, 'HIRE', 0, 16, 10, '#a16207');
            if (it.done) { c.fillStyle = it.k === 'gold' ? '#16a34a' : '#ea580c'; c.beginPath(); c.arc(2, 6, 7, 0, 7); c.fill(); [[-7, -3], [-2, -7], [5, -7], [10, -2]].forEach(function (q) { c.beginPath(); c.arc(q[0] + 1, q[1] + 1, 3, 0, 7); c.fill(); }); }
            c.restore(); });
          // the stamp arm (with Biscuit the corgi peeking over the desk)
          var sy = slam > 0 ? by - 50 : by - 110 - Math.sin(t * 4) * 3; c.fillStyle = '#7c3f2c'; c.fillRect(sx - 4, 0, 8, sy - 18);
          c.fillStyle = '#c8634a'; U.rr(c, sx - 26, sy - 20, 52, 22, 6); c.fill(); c.fillStyle = '#ea580c'; U.rr(c, sx - 22, sy, 44, 8, 3); c.fill();
          c.fillStyle = '#f59e0b'; c.beginPath(); c.ellipse(W * 0.84, H - 64, 30, 24, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(W * 0.84 - 26, H - 76); c.lineTo(W * 0.84 - 20, H - 104); c.lineTo(W * 0.84 - 8, H - 84); c.fill(); c.beginPath(); c.moveTo(W * 0.84 + 26, H - 76); c.lineTo(W * 0.84 + 20, H - 104); c.lineTo(W * 0.84 + 8, H - 84); c.fill();
          c.fillStyle = '#fff'; c.beginPath(); c.ellipse(W * 0.84, H - 54, 16, 12, 0, 0, 7); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(W * 0.84 - 10, H - 70, 3.5, 0, 7); c.arc(W * 0.84 + 10, H - 70, 3.5, 0, 7); c.arc(W * 0.84, H - 58, 4, 0, 7); c.fill();
          c.fillStyle = '#7c3f2c'; c.fillRect(0, H - 40, W, 40);
          for (i = 0; i < pops.length; i++) { var q = pops[i]; c.globalAlpha = Math.max(0, q.life / 0.7); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, 4, 0, 7); c.fill(); } c.globalAlpha = 1;
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ef4444' : 'rgba(0,0,0,.2)');
          U.text(c, String(api.score), W - 16, 32, 30, '#fff', 'right', '#9a3412'); U.text(c, 'PAW STAMP RUSH', W / 2, 30, 14, '#fff', 'center', '#9a3412');
          if (msgT > 0) U.text(c, msg[0], W / 2, by - 150, 20, msg[1], 'center', '#000');
          if (api.playing && t < 4) U.text(c, api.touch ? 'TAP to stamp the forms!' : 'CLICK or SPACE to stamp!', W / 2, H - 20, 18, '#fde68a', 'center', '#000');
        },
        dbg: function () { return { t: t, hearts: hearts, items: items.map(function (i) { return [Math.round(i.x), i.k, i.done]; }), score: api.score, W: api.W }; },
        onDown: function () { stamp(); },
        onKey: function (k, dn) { if (dn === false) return; if (k === ' ' || k === 'Space' || k === 'Enter') stamp(); }
      };
    }
  });
})();
