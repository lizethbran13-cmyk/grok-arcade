/* Grok Arcade - bonus game #17: Laser Dash (Grok Heist Crew tie-in).
   Your thief sneaks down a night-time museum hall. Low red lasers: JUMP over them (tap the top half / Up / Space).
   High lasers: DUCK under them (hold the bottom half / Down). Grab floating diamonds for +3. Each laser you pass is +1.
   Touch a laser and the alarm goes off: you lose a heart. 3 hearts, 60 seconds, it speeds up! */
(function () {
  'use strict';
  var U = GA.MG.U;
  var ROUND = 60;
  GA.MG.register({
    id: 'laser', name: 'Laser Dash', ticketDiv: 3,
    howTouch: 'Sneak through the museum! TAP the TOP half to JUMP over low lasers. HOLD the BOTTOM half to DUCK under high lasers. Grab diamonds for +3. Touch a laser = ALARM (you lose a heart). 3 hearts, 60 seconds!',
    howKeys: 'Sneak through the museum! Press UP or SPACE to JUMP over low lasers. HOLD DOWN to DUCK under high lasers. Grab diamonds for +3. Touch a laser = ALARM (you lose a heart). 3 hearts, 60 seconds!',
    create: function (api) {
      var t, hearts, things, pops, msg, msgT, passed, streak, gems, y, vy, duckKey, duckTouch, inv, alarmT, nextD, scroll, L = {};
      function layout() { var W = api.W, H = api.H; L.hH = Math.max(46, Math.min(96, H * 0.11)); L.s = L.hH / 60; L.gy = Math.round(H * 0.74); L.tx = Math.round(W * 0.24); L.tw = L.hH * 0.5; }
      function speed() { return (230 + Math.min(1, t / ROUND) * 210) * L.s; }
      function air() { return y < -0.5; }
      function ducking() { return (duckKey || duckTouch) && !air(); }
      function say(s, col) { msg = [s, col]; msgT = 1; }
      function jump() { if (!api.playing || air()) return; vy = -Math.sqrt(2 * 2600 * L.s * L.hH * 1.5); y = -1; api.sfx('click'); }
      function spawn() {
        var W = api.W, x = W + 40, r = Math.random(), lv = Math.min(1, t / ROUND);
        var k = r < 0.45 ? 'low' : r < 0.85 ? 'high' : 'gem';
        if (k === 'low') things.push({ k: 'low', x: x, y: L.gy - L.hH * 0.28 });
        else if (k === 'high') things.push({ k: 'high', x: x, y: L.gy - L.hH * 0.78 });
        if (k === 'gem' || Math.random() < 0.3) things.push({ k: 'gem', x: x + (k === 'gem' ? 0 : 0.5) * speed() * 0.5, y: Math.random() < 0.5 ? L.gy - L.hH * 0.5 : L.gy - L.hH * 1.75 });
        // next one far enough away to land / stand up again, closer as it speeds up
        nextD = speed() * (0.85 - lv * 0.25 + Math.random() * 0.45);
      }
      function hit() {
        hearts--; streak = 0; inv = 1.1; alarmT = 0.8; api.sfx('lifelost'); say('\uD83D\uDEA8 ALARM!', '#ff3d6e');
        if (hearts <= 0) { say('BUSTED!', '#ff3d6e'); api.gameOver(); }
      }
      function burst(x, yy, col) { for (var i = 0; i < 12; i++) { var a = Math.random() * 6.28, sp = 60 + Math.random() * 120; pops.push({ x: x, y: yy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 0.6, col: col }); } }
      function thiefBox() { var h = ducking() ? L.hH * 0.45 : L.hH; return { x0: L.tx - L.tw / 2, x1: L.tx + L.tw / 2, top: L.gy + y - h, bot: L.gy + y }; }
      function thief(c) {
        var d = ducking(), h = d ? L.hH * 0.45 : L.hH, x = L.tx, fy = L.gy + y, s = L.s, run = air() ? 0 : Math.sin(t * 16);
        if (inv > 0 && Math.floor(inv * 12) % 2) c.globalAlpha = 0.45;
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x, L.gy + 2, 16 * s, 4 * s, 0, 0, 7); c.fill();
        c.fillStyle = '#16101f'; c.fillRect(x - 9 * s + run * 4 * s, fy - 8 * s, 7 * s, 8 * s); c.fillRect(x + 2 * s - run * 4 * s, fy - 8 * s, 7 * s, 8 * s);
        c.fillStyle = '#7c3aed'; U.rr(c, x - 12 * s, fy - h + h * 0.38, 24 * s, h * 0.55, 8 * s); c.fill();
        var hy = fy - h + h * 0.26, hr = (d ? 10 : 12) * s;
        c.beginPath(); c.arc(x, hy, hr + 2 * s, 0, 7); c.fill();
        c.fillStyle = '#ffd7b0'; c.beginPath(); c.arc(x + 3 * s, hy + 1 * s, hr * 0.7, 0, 7); c.fill();
        c.fillStyle = '#16101f'; c.fillRect(x - 3 * s, hy - 3 * s, 14 * s, 4 * s); c.fillStyle = '#3ff0ff'; c.fillRect(x + 1 * s, hy - 2.5 * s, 3 * s, 3 * s); c.fillRect(x + 6 * s, hy - 2.5 * s, 3 * s, 3 * s);
        c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(x - 12 * s, fy - h * 0.55, 7 * s, 0, 7); c.fill(); // loot bag
        c.globalAlpha = 1;
      }
      function gem(c, x, yy, r) {
        c.fillStyle = 'rgba(125,211,252,.35)'; c.beginPath(); c.arc(x, yy, r * 1.7 + Math.sin(t * 6) * 2, 0, 7); c.fill();
        c.fillStyle = '#e0f2fe'; c.beginPath(); c.moveTo(x, yy - r); c.lineTo(x + r * 0.9, yy - r * 0.2); c.lineTo(x, yy + r); c.lineTo(x - r * 0.9, yy - r * 0.2); c.closePath(); c.fill();
        c.fillStyle = '#7dd3fc'; c.beginPath(); c.moveTo(x - r * 0.9, yy - r * 0.2); c.lineTo(x + r * 0.9, yy - r * 0.2); c.lineTo(x, yy + r); c.closePath(); c.fill();
      }
      return {
        reset: function () { layout(); t = 0; hearts = 3; things = []; pops = []; msgT = 0; passed = 0; streak = 0; gems = 0; y = 0; vy = 0; duckKey = duckTouch = false; inv = 0; alarmT = 0; nextD = api.W * 0.6; scroll = 0; },
        resize: function () { layout(); },
        update: function (dt) {
          if (msgT > 0) msgT -= dt; if (alarmT > 0) alarmT -= dt;
          for (var i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.vy += 300 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          if (!api.playing) return;
          t += dt; if (inv > 0) inv -= dt;
          if (t >= ROUND) { say('TIME! Clean getaway!', '#ffd23f'); api.gameOver(); return; }
          if (y < 0 || vy < 0) { vy += 2600 * L.s * dt; y += vy * dt; if (y >= 0) { y = 0; vy = 0; } }
          var sp = speed(), dx = sp * dt; scroll += dx; nextD -= dx; if (nextD <= 0) spawn();
          var b = thiefBox();
          for (i = things.length - 1; i >= 0; i--) {
            var o = things[i]; o.x -= dx;
            if (o.k === 'gem') {
              if (!o.got && o.x > b.x0 - 10 && o.x < b.x1 + 10 && o.y > b.top - 10 && o.y < b.bot + 6) { o.got = 1; gems++; api.addScore(3); api.sfx('perfect'); burst(o.x, o.y, '#7dd3fc'); say('\uD83D\uDC8E +3', '#7dd3fc'); }
              if (o.got || o.x < -30) things.splice(i, 1);
              continue;
            }
            var half = 26 * L.s; // beam is ~52px wide between two emitters
            if (!o.hit && !o.done && o.x + half > b.x0 && o.x - half < b.x1 && o.y > b.top && o.y < b.bot) { if (inv <= 0) { o.hit = 1; hit(); if (!api.playing) return; } }
            if (!o.done && o.x + half < b.x0) { o.done = 1; if (!o.hit) { passed++; streak++; api.addScore(1); api.sfx('point'); if (streak === 20 && GA.Prog) GA.Prog.event('laser20'); if (streak > 0 && streak % 10 === 0) say(streak + ' IN A ROW! \uD83E\uDD77', '#a5f3fc'); } }
            if (o.x < -60) things.splice(i, 1);
          }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i, s = L.s;
          var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1e1b4b'); gr.addColorStop(1, '#3b0764'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
          // gallery wall: framed paintings + pillars scrolling by (parallax)
          var ps = 220 * s, off = (scroll * 0.5) % ps;
          for (var x = -off; x < W + ps; x += ps) {
            c.fillStyle = '#2e1a5e'; c.fillRect(x, L.gy - L.hH * 3.2, 26 * s, L.hH * 3.2);
            c.fillStyle = '#ffd23f'; c.fillRect(x + 70 * s, L.gy - L.hH * 2.9, 90 * s, 64 * s); c.fillStyle = ['#38bdf8', '#f472b6', '#4ade80'][Math.abs(Math.round((x + scroll * 0.5) / ps)) % 3]; c.fillRect(x + 76 * s, L.gy - L.hH * 2.9 + 6 * s, 78 * s, 52 * s);
            c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(x + 115 * s, L.gy - L.hH * 2.9 + 30 * s, 14 * s, 0, 7); c.fill();
          }
          if (alarmT > 0) { c.fillStyle = 'rgba(255,40,80,' + (0.25 * Math.abs(Math.sin(alarmT * 18))) + ')'; c.fillRect(0, 0, W, H); }
          // floor
          c.fillStyle = '#c4b5fd'; c.fillRect(0, L.gy, W, H - L.gy); c.fillStyle = '#a78bfa'; var to = scroll % (60 * s); for (x = -to; x < W; x += 60 * s) c.fillRect(x, L.gy, 2, H - L.gy);
          c.fillStyle = '#ede9fe'; c.fillRect(0, L.gy, W, 4);
          // lasers + gems
          for (i = 0; i < things.length; i++) { var o = things[i];
            if (o.k === 'gem') { gem(c, o.x, o.y + Math.sin(t * 4 + o.x * 0.02) * 3, 10 * s); continue; }
            var half = 26 * s, fl = 0.75 + Math.sin(t * 30 + i) * 0.25;
            c.fillStyle = '#5b4b8a'; if (o.k === 'low') { c.fillRect(o.x - half - 4 * s, o.y - 6 * s, 8 * s, L.gy - o.y + 6 * s); c.fillRect(o.x + half - 4 * s, o.y - 6 * s, 8 * s, L.gy - o.y + 6 * s); }
            else { c.fillRect(o.x - half - 4 * s, o.y - 6 * s, 8 * s, 12 * s); c.fillRect(o.x + half - 4 * s, o.y - 6 * s, 8 * s, 12 * s); c.fillRect(o.x - half - 2 * s, L.gy - L.hH * 3.2, 4 * s, L.hH * 3.2 - (L.gy - o.y) - 6 * s); c.fillRect(o.x + half - 2 * s, L.gy - L.hH * 3.2, 4 * s, L.hH * 3.2 - (L.gy - o.y) - 6 * s); }
            c.strokeStyle = o.hit ? 'rgba(255,255,255,.9)' : 'rgba(255,61,110,' + fl + ')'; c.lineWidth = 5 * s; c.shadowColor = '#ff3d6e'; c.shadowBlur = 12; c.beginPath(); c.moveTo(o.x - half, o.y); c.lineTo(o.x + half, o.y); c.stroke(); c.shadowBlur = 0;
            c.strokeStyle = '#ffe4ec'; c.lineWidth = 1.5 * s; c.beginPath(); c.moveTo(o.x - half, o.y); c.lineTo(o.x + half, o.y); c.stroke();
          }
          thief(c);
          for (i = 0; i < pops.length; i++) { var q = pops[i]; c.globalAlpha = Math.max(0, q.life / 0.6); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, 5, 0, 7); c.fill(); } c.globalAlpha = 1;
          // HUD
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ff4f8b' : 'rgba(255,255,255,.3)');
          U.text(c, String(api.score), W - 16, 30, 30, '#fff', 'right', '#000');
          var tl = Math.max(0, ROUND - t), bw = Math.min(200, W * 0.4); c.fillStyle = 'rgba(0,0,0,.3)'; U.rr(c, W / 2 - bw / 2, 22, bw, 14, 7); c.fill(); c.fillStyle = tl < 10 ? '#ff6b6b' : '#ffd23f'; U.rr(c, W / 2 - bw / 2, 22, Math.max(14, bw * tl / ROUND), 14, 7); c.fill(); U.text(c, '\u23F1 ' + Math.ceil(tl), W / 2, 50, 14, '#fff', 'center', '#000');
          if (streak >= 3) U.text(c, '\uD83E\uDD77 ' + streak, W - 16, 62, 16, '#a5f3fc', 'right', '#000');
          if (msgT > 0) U.text(c, msg[0], W / 2, H * 0.3, 28, msg[1], 'center', '#000');
          if (api.touch) { c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(0, L.gy + 8, W, H - L.gy - 8); U.text(c, ducking() ? '\u2B07 DUCKING' : '\u2B07 HOLD HERE TO DUCK', W / 2, (L.gy + H) / 2 + 10, 15, 'rgba(255,255,255,.55)'); }
          if (api.playing && t < 3.5) U.text(c, api.touch ? 'TAP up top to JUMP \u2022 HOLD down here to DUCK' : 'UP / SPACE = JUMP \u2022 hold DOWN = DUCK', W / 2, H * 0.22, 16, '#fff', 'center', '#000');
        },
        dbg: function () { return { t: t, hearts: hearts, passed: passed, streak: streak, gems: gems, y: y, air: air(), duck: ducking(), tx: L.tx, tw: L.tw, gy: L.gy, hH: L.hH, speed: speed(), things: things.map(function (o) { return { k: o.k, x: o.x, y: o.y, hit: !!o.hit, done: !!o.done }; }) }; },
        onDown: function (x, yy) { if (yy > L.gy + 8) duckTouch = true; else jump(); },
        onUp: function () { duckTouch = false; },
        onKey: function (k, down) { if (k === 'ArrowDown') { duckKey = !!down; return; } if (down && (k === 'ArrowUp' || k === ' ')) jump(); }
      };
    }
  });
})();
