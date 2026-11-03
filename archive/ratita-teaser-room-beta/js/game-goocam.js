/* Grok Arcade - bonus game #45: Goo Cam (Grok Dr. Vic: The Lost Lab tie-in).
   Dark abandoned Ratita Industries lab. DRAG your flashlight (the camera follows it). Anomalies (wobbly glowing ghosts) only show up in the light.
   HOLD the light on one to film it (the REC ring fills) -> followers (+points). Gold Ghost Rats are worth more. Green GOO BLOBS splat your lens if you
   keep the light on them too long. An anomaly that fades away unfilmed costs a heart. 3 hearts; things speed up. Perf: room drawn once per size offscreen. */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'goocam', name: 'Goo Cam', ticketDiv: 4,
    howTouch: 'Help Dr. Vic go viral in the Lost Lab! DRAG your flashlight around the dark lab. Anomalies only show up in the light: HOLD the light on one until the REC ring fills to film it. Gold Ghost Rats are worth extra! Don\u2019t keep the light on green GOO blobs or they splat your camera. If an anomaly fades away unfilmed, you lose a heart.',
    howKeys: 'Help Dr. Vic go viral in the Lost Lab! Move your flashlight with the mouse or the ARROW keys / WASD. Anomalies only show up in the light: HOLD the light on one until the REC ring fills to film it. Gold Ghost Rats are worth extra! Don\u2019t keep the light on green GOO blobs or they splat your camera. If an anomaly fades away unfilmed, you lose a heart.',
    create: function (api) {
      var t, hearts, lx, ly, wx, wy, kx, ky, things, pops, msg, msgT, hurtT, spawnT, splatT, filmed, streak, bg = null, bgKey = '';
      function L() { var W = api.W, H = api.H; return { W: W, H: H, top: 70, bot: H - 20, r: Math.max(46, Math.min(W, H) * 0.15) }; }
      function say(s, col) { msg = [s, col]; msgT = 1; }
      function burst(x, y, col, n) { for (var i = 0; i < (n || 10) && pops.length < 70; i++) { var a = Math.random() * 6.28, s = 50 + Math.random() * 140; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.7, col: col }); } }
      function hurt(why) { if (hurtT > 0) return; hearts--; hurtT = 0.9; streak = 0; api.sfx('lifelost'); say(why, '#fecaca'); if (hearts <= 0) api.gameOver(); }
      function life() { return Math.max(2.2, 4.6 - t * 0.04); }
      function spawn() {
        var l = L(), r = Math.random(), k = t > 5 && r < 0.24 ? 'goo' : r < 0.36 ? 'gold' : 'ghost', tries = 0, x, y;
        do { x = 40 + Math.random() * (l.W - 80); y = l.top + 40 + Math.random() * (l.bot - l.top - 80); tries++; } while (tries < 8 && things.some(function (q) { return Math.hypot(q.x - x, q.y - y) < 70; }));
        things.push({ k: k, x: x, y: y, t0: t, life: k === 'goo' ? life() * 1.1 : life(), rec: 0, ph: Math.random() * 6, vx: (Math.random() * 2 - 1) * 14, vy: (Math.random() * 2 - 1) * 10 });
      }
      function buildBg() {
        var l = L(), d = api.dpr || 1, key = l.W + 'x' + l.H + '@' + d; if (bg && bgKey === key) return; bgKey = key;
        bg = document.createElement('canvas'); bg.width = Math.round(l.W * d); bg.height = Math.round(l.H * d); var g = bg.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
        g.fillStyle = '#2a2f2a'; g.fillRect(0, 0, l.W, l.H);
        // mossy brick wall
        for (var y = 0, row = 0; y < l.H * 0.62; y += 16, row++) for (var x = -(row % 2) * 16; x < l.W; x += 32) { var v = 40 + ((x * 7 + y * 13) % 23); g.fillStyle = 'rgb(' + (v + 30) + ',' + (v + 8) + ',' + v + ')'; g.fillRect(x + 1, y + 1, 30, 14); if ((x * 3 + y) % 7 === 0) { g.fillStyle = 'rgba(74,222,128,.25)'; g.fillRect(x + 2, y + 10, 18, 5); } }
        // floor tiles
        var fy = l.H * 0.62; g.fillStyle = '#3f4440'; g.fillRect(0, fy, l.W, l.H - fy); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; for (x = 0; x < l.W; x += 36) { g.beginPath(); g.moveTo(x, fy); g.lineTo(x + (x - l.W / 2) * 0.5, l.H); g.stroke(); } for (y = fy; y < l.H; y += 22) { g.beginPath(); g.moveTo(0, y); g.lineTo(l.W, y); g.stroke(); }
        // pipes, goo vat, sign, shelves
        g.fillStyle = '#6b7280'; g.fillRect(0, 84, l.W, 9); g.fillRect(l.W * 0.82, 84, 9, fy - 84); g.fillStyle = '#9a3412'; for (x = 20; x < l.W; x += 70) g.fillRect(x, 82, 6, 13);
        var vx = l.W * 0.18, vy = fy - 70; g.fillStyle = '#475569'; g.fillRect(vx - 32, vy - 6, 64, 80); g.fillStyle = 'rgba(74,222,128,.7)'; g.fillRect(vx - 26, vy + 14, 52, 54); g.fillStyle = 'rgba(187,247,208,.6)'; g.fillRect(vx - 22, vy + 18, 8, 40);
        g.fillStyle = '#57534e'; g.fillRect(l.W * 0.55, fy - 90, 90, 6); g.fillRect(l.W * 0.55, fy - 50, 90, 6); for (var i = 0; i < 5; i++) { g.fillStyle = ['#4ade80', '#a3e635', '#22c55e'][i % 3]; g.fillRect(l.W * 0.55 + 6 + i * 17, fy - 106, 11, 16); g.fillStyle = '#e5e7eb'; g.fillRect(l.W * 0.55 + 6 + i * 17, fy - 109, 11, 4); }
        g.fillStyle = '#7f1d1d'; U.rr(g, l.W / 2 - 86, 104, 172, 24, 4); g.fill(); U.text(g, 'RATITA INDUSTRIES', l.W / 2, 116, 12, '#fecaca');
        g.strokeStyle = 'rgba(255,255,255,.12)'; for (i = 0; i < 6; i++) { g.beginPath(); var cx0 = (i * 97) % l.W; g.moveTo(cx0, 0); g.quadraticCurveTo(cx0 + 20, 30, cx0 + 40, 4); g.stroke(); }
      }
      function drawGhost(c, q, a, lit) { var s = q.k === 'gold' ? 0.8 : 1, wob = Math.sin(t * 3 + q.ph) * 4, x = q.x, y = q.y + wob;
        c.globalAlpha = a; var col = q.k === 'gold' ? '#facc15' : '#c4b5fd';
        c.fillStyle = q.k === 'gold' ? 'rgba(250,204,21,.25)' : 'rgba(167,139,250,.25)'; c.beginPath(); c.arc(x, y, 30 * s, 0, 7); c.fill();
        if (q.k === 'gold') { // ghost rat: ears + tail
          c.fillStyle = col; c.beginPath(); c.arc(x - 12, y - 14, 7, 0, 7); c.arc(x + 12, y - 14, 7, 0, 7); c.fill(); c.beginPath(); c.ellipse(x, y, 17, 14, 0, 0, 7); c.fill(); c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 15, y + 6); c.quadraticCurveTo(x + 30, y + 2 + wob, x + 26, y - 12); c.stroke();
          c.fillStyle = '#f472b6'; c.beginPath(); c.arc(x, y + 3, 3, 0, 7); c.fill(); }
        else { c.fillStyle = col; c.beginPath(); c.arc(x, y - 4, 18, Math.PI, 0); c.lineTo(x + 18, y + 16); for (var i = 0; i < 4; i++) c.lineTo(x + 18 - (i + 0.5) * 9, y + 16 + (i % 2 ? 0 : 6) + Math.sin(t * 6 + i) * 2); c.lineTo(x - 18, y + 16); c.closePath(); c.fill(); }
        c.fillStyle = '#1e1b4b'; c.beginPath(); c.arc(x - 6, y - 5, 3, 0, 7); c.arc(x + 6, y - 5, 3, 0, 7); c.fill(); if (lit) { c.beginPath(); c.ellipse(x, y + 5, 3, 4, 0, 0, 7); c.fill(); }
        c.globalAlpha = 1; }
      function drawGoo(c, q, a) { var x = q.x, y = q.y, p = 1 + Math.sin(t * 5 + q.ph) * 0.08; c.globalAlpha = a; c.fillStyle = '#16a34a'; c.beginPath(); c.ellipse(x, y + 4, 22 * p, 16 / p, 0, 0, 7); c.fill(); c.fillStyle = '#4ade80'; c.beginPath(); c.ellipse(x - 2, y, 18 * p, 13 / p, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(x - 8, y - 5, 4, 0, 7); c.fill(); c.fillStyle = '#052e16'; c.beginPath(); c.arc(x - 5, y, 2.5, 0, 7); c.arc(x + 5, y, 2.5, 0, 7); c.fill(); U.text(c, 'GOO', x, y - 22, 11, '#bbf7d0', 'center', '#052e16'); c.globalAlpha = 1; }
      return {
        reset: function () { var l = L(); t = 0; hearts = 3; lx = wx = l.W / 2; ly = wy = (l.top + l.bot) / 2; kx = ky = 0; things = []; pops = []; msgT = 0; hurtT = 0; spawnT = 0.8; splatT = 0; filmed = 0; streak = 0; },
        update: function (dt) {
          var l = L(), i;
          if (msgT > 0) msgT -= dt; if (hurtT > 0) hurtT -= dt; if (splatT > 0) splatT -= dt;
          for (i = pops.length - 1; i >= 0; i--) { var p = pops[i]; p.life -= dt; p.vy += 200 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) pops.splice(i, 1); }
          if (kx || ky) { wx = Math.max(0, Math.min(l.W, wx + kx * 420 * dt)); wy = Math.max(l.top, Math.min(l.bot, wy + ky * 420 * dt)); }
          lx += (wx - lx) * Math.min(1, dt * 14); ly += (wy - ly) * Math.min(1, dt * 14);
          if (!api.playing) return; t += dt;
          spawnT -= dt; if (spawnT <= 0 && things.length < 6) { spawn(); spawnT = Math.max(0.55, 1.5 - t * 0.016) * (0.8 + Math.random() * 0.4); }
          for (i = things.length - 1; i >= 0; i--) { var q = things[i], age = t - q.t0, d = Math.hypot(q.x - lx, q.y - ly), inL = d < l.r * 0.8;
            q.x = Math.max(30, Math.min(l.W - 30, q.x + q.vx * dt)); q.y = Math.max(l.top + 30, Math.min(l.bot - 30, q.y + q.vy * dt));
            if (q.k === 'goo') { if (inL) { q.rec += dt; if (q.rec > 0.55) { hurt('SPLAT! Goo on the lens!'); splatT = 1.1; burst(q.x, q.y, '#4ade80', 14); api.sfx('lifelost'); things.splice(i, 1); continue; } } else q.rec = Math.max(0, q.rec - dt * 2);
              if (age > q.life) things.splice(i, 1); continue; }
            if (inL) { q.rec += dt; if (q.rec >= (q.k === 'gold' ? 0.75 : 0.6)) { filmed++; streak++; var pts = q.k === 'gold' ? 3 : 1; if (streak % 8 === 0) { pts += 4; say('VIRAL! x' + streak + ' +4', '#fde047'); api.sfx('perfect'); } else { say(q.k === 'gold' ? 'GHOST RAT! +3' : 'FILMED! +1', q.k === 'gold' ? '#fde047' : '#ddd6fe'); api.sfx(q.k === 'gold' ? 'perfect' : 'point'); }
                api.addScore(pts); burst(q.x, q.y, q.k === 'gold' ? '#facc15' : '#c4b5fd', 12); if (filmed >= 40 && GA.Prog) GA.Prog.event('goo40'); things.splice(i, 1); continue; } }
            else q.rec = Math.max(0, q.rec - dt * 0.5);
            if (age > q.life) { hurt('It got away!'); things.splice(i, 1); } }
        },
        draw: function (c) {
          var l = L(), i; buildBg(); c.drawImage(bg, 0, 0, l.W, l.H);
          // things faintly visible in the dark (so you know where to look), fully in the light
          things.forEach(function (q) { var age = t - q.t0, fade = Math.min(1, age * 3) * Math.min(1, (q.life - age) * 2), d = Math.hypot(q.x - lx, q.y - ly), lit = d < l.r; var a = Math.max(0, fade) * (lit ? 1 : 0.0);
            if (q.k === 'goo') drawGoo(c, q, a); else drawGhost(c, q, a, lit); });
          // darkness with a flashlight hole
          var dk = c.createRadialGradient(lx, ly, l.r * 0.55, lx, ly, l.r * 1.25); dk.addColorStop(0, 'rgba(5,8,6,0)'); dk.addColorStop(1, 'rgba(5,8,6,.94)'); c.fillStyle = dk; c.fillRect(0, 0, l.W, l.H);
          things.forEach(function (q) { var d = Math.hypot(q.x - lx, q.y - ly); if (d >= l.r) { var age = t - q.t0, a = 0.25 + 0.2 * Math.sin(t * 4 + q.ph); if (age < q.life) { c.fillStyle = q.k === 'goo' ? 'rgba(74,222,128,' + a * 0.7 + ')' : q.k === 'gold' ? 'rgba(250,204,21,' + a + ')' : 'rgba(196,181,253,' + a + ')'; c.beginPath(); c.arc(q.x, q.y, 5, 0, 7); c.fill(); } } });
          // REC rings
          things.forEach(function (q) { if (q.rec <= 0) return; var need = q.k === 'goo' ? 0.55 : q.k === 'gold' ? 0.75 : 0.6, f = Math.min(1, q.rec / need); c.strokeStyle = q.k === 'goo' ? '#4ade80' : '#ef4444'; c.lineWidth = 4; c.beginPath(); c.arc(q.x, q.y, 30, -Math.PI / 2, -Math.PI / 2 + f * 6.283); c.stroke(); });
          // camera viewfinder
          c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2; var vf = l.r * 0.7; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { c.beginPath(); c.moveTo(lx + s[0] * vf, ly + s[1] * (vf - 12)); c.lineTo(lx + s[0] * vf, ly + s[1] * vf); c.lineTo(lx + s[0] * (vf - 12), ly + s[1] * vf); c.stroke(); });
          var recOn = things.some(function (q) { return q.rec > 0 && q.k !== 'goo'; }); if (recOn && Math.floor(t * 4) % 2) { c.fillStyle = '#ef4444'; c.beginPath(); c.arc(lx - vf + 8, ly - vf + 10, 5, 0, 7); c.fill(); U.text(c, 'REC', lx - vf + 30, ly - vf + 10, 11, '#fff'); }
          for (i = 0; i < pops.length; i++) { var p = pops[i]; c.globalAlpha = Math.max(0, p.life / 0.7); c.fillStyle = p.col; c.fillRect(p.x - 3, p.y - 3, 6, 6); } c.globalAlpha = 1;
          if (splatT > 0) { c.globalAlpha = Math.min(1, splatT) * 0.8; c.fillStyle = '#22c55e'; [[0.3, 0.4, 60], [0.6, 0.55, 80], [0.45, 0.7, 50], [0.75, 0.3, 40]].forEach(function (s) { c.beginPath(); c.arc(l.W * s[0], l.H * s[1], s[2], 0, 7); c.fill(); }); c.globalAlpha = 1; }
          c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, l.W, 58);
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 22, 22, i < hearts ? '#ef4444' : 'rgba(255,255,255,.2)');
          U.text(c, String(api.score), l.W - 16, 24, 30, '#fff', 'right', '#14532d'); U.text(c, 'GOO CAM', l.W / 2, 18, 15, '#4ade80', 'center', '#052e16'); U.text(c, '\uD83D\uDCF9 ' + (filmed * 137) + ' followers', l.W / 2, 42, 12, '#e5e7eb', 'center', '#000');
          if (msgT > 0) U.text(c, msg[0], l.W / 2, l.H * 0.78, 22, msg[1], 'center', '#000');
          if (api.playing && t < 4) U.text(c, api.touch ? 'DRAG the flashlight \u00b7 HOLD it on ghosts to film' : 'Mouse / arrows move the light \u00b7 hold it on ghosts', l.W / 2, l.H - 10, 15, '#fff', 'center', '#052e16');
        },
        dbg: function () { return { t: t, hearts: hearts, lx: lx, ly: ly, filmed: filmed, score: api.score, things: things.map(function (q) { return { k: q.k, x: q.x, y: q.y, rec: q.rec }; }) }; },
        onDown: function (x, y) { wx = x; wy = y; },
        onMove: function (x, y, down) { if (down || !api.touch) { wx = x; wy = y; } },
        onKey: function (k, dn) { var on = dn !== false; if (k === 'ArrowLeft' || k === 'a' || k === 'A') kx = on ? -1 : (kx < 0 ? 0 : kx); else if (k === 'ArrowRight' || k === 'd' || k === 'D') kx = on ? 1 : (kx > 0 ? 0 : kx); else if (k === 'ArrowUp' || k === 'w' || k === 'W') ky = on ? -1 : (ky < 0 ? 0 : ky); else if (k === 'ArrowDown' || k === 's' || k === 'S') ky = on ? 1 : (ky > 0 ? 0 : ky); }
      };
    }
  });
})();
