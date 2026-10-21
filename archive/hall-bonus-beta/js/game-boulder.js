/* Grok Arcade - bonus game #36: Boulder Run (Grok Lost Relics tie-in).
   A giant rolling boulder chases your explorer down a temple corridor! TAP the left or right side (or swipe / arrow keys)
   to hop between 3 lanes. Dodge spike tiles and fallen pillars, grab coins (+1) and golden Jade Monkey idols (+3).
   Hitting a trap costs a heart and lets the boulder roll closer. 3 hearts; the corridor speeds up as you go. */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'boulder', name: 'Boulder Run', ticketDiv: 4,
    howTouch: 'A giant boulder is rolling after you! TAP the left or right side of the screen to hop between the 3 lanes. Dodge the spike tiles and fallen pillars, grab coins and the golden Jade Monkey idols!',
    howKeys: 'A giant boulder is rolling after you! Press LEFT / RIGHT (or click the left or right side) to hop between the 3 lanes. Dodge the spike tiles and fallen pillars, grab coins and the golden Jade Monkey idols!',
    create: function (api) {
      var t, hearts, lane, lx, things, spawnT, speed, dist, hurtT, msg, msgT, idols, coinsRun, bz, sx0, sy0, sparks;
      function say(s, col) { msg = [s, col]; msgT = 1.2; }
      function laneX(i) { return api.W * (0.22 + i * 0.28); }
      function busy() { return Math.min(1, dist / 2600); }
      function spawn() { var free = [0, 1, 2]; var nTrap = Math.random() < 0.35 + busy() * 0.3 ? 2 : 1; var traps = [];
        for (var i = 0; i < nTrap; i++) { var k = (Math.random() * free.length) | 0; traps.push(free.splice(k, 1)[0]); }
        traps.forEach(function (l) { things.push({ l: l, y: -60, k: Math.random() < 0.5 ? 'spike' : 'pillar' }); });
        var r = Math.random(); if (free.length) { var cl = free[(Math.random() * free.length) | 0]; if (r < 0.12) things.push({ l: cl, y: -60, k: 'idol' }); else for (var j = 0; j < 3; j++) things.push({ l: cl, y: -60 - j * 46, k: 'coin' }); } }
      function hurt() { if (hurtT > 0) return; hearts--; hurtT = 1.0; bz = Math.min(1, bz + 0.34); api.sfx('lifelost'); say('OUCH! The boulder is gaining!', '#fca5a5'); if (hearts <= 0) api.gameOver(); }
      function move(d) { if (!api.playing) return; var n = Math.max(0, Math.min(2, lane + d)); if (n !== lane) { lane = n; api.sfx('boop'); } }
      return {
        reset: function () { t = 0; hearts = 3; lane = 1; lx = laneX(1); things = []; spawnT = 0.6; speed = 230; dist = 0; hurtT = 0; msgT = 0; idols = 0; coinsRun = 0; bz = 0; sparks = []; },
        resize: function () { lx = laneX(lane); },
        update: function (dt) {
          if (msgT > 0) msgT -= dt; if (hurtT > 0) hurtT -= dt;
          for (var i = sparks.length - 1; i >= 0; i--) { var q = sparks[i]; q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) sparks.splice(i, 1); }
          lx += (laneX(lane) - lx) * Math.min(1, dt * 16);
          if (!api.playing) return; t += dt; speed = 230 + busy() * 190; dist += speed * dt; bz = Math.max(0, bz - dt * 0.03);
          spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(0.55, 1.2 - busy() * 0.6) * 230 / speed * 1.6; }
          var py = api.H * 0.7;
          for (var k = things.length - 1; k >= 0; k--) { var o = things[k]; o.y += speed * dt;
            if (!o.got && o.l === lane && Math.abs(o.y - py) < 30) {
              if (o.k === 'coin') { o.got = true; coinsRun++; api.addScore(1); api.sfx('boop'); for (var s = 0; s < 5; s++) sparks.push({ x: lx, y: py, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 160, life: 0.4, col: '#fde047' }); if (coinsRun === 30 && GA.Prog) GA.Prog.event('boulder30'); }
              else if (o.k === 'idol') { o.got = true; idols++; api.addScore(3); api.sfx('perfect'); say('JADE MONKEY IDOL! +3', '#86efac'); }
              else if (hurtT <= 0) { o.got = true; hurt(); } }
            if (o.y > api.H + 80) things.splice(k, 1); }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i, py = H * 0.7;
          // temple corridor: sandstone floor tiles scrolling, mossy side walls with torches
          c.fillStyle = '#c8b48a'; c.fillRect(0, 0, W, H); var off = (dist % 60);
          for (var y = -60 + off; y < H; y += 60) for (i = 0; i < 3; i++) { c.fillStyle = (Math.floor((y - off) / 60) + i) % 2 ? '#b8a37a' : '#d6c49b'; c.fillRect(laneX(i) - W * 0.13, y, W * 0.26, 58); }
          c.fillStyle = '#7d7a62'; c.fillRect(0, 0, W * 0.07, H); c.fillRect(W * 0.93, 0, W * 0.07, H); c.fillStyle = '#5f8f2f';
          for (y = -80 + (dist * 1) % 160; y < H; y += 160) { c.fillRect(0, y, W * 0.05, 26); c.fillRect(W * 0.95, y + 70, W * 0.05, 26); c.fillStyle = '#ffa53d'; c.beginPath(); c.arc(W * 0.035, y + 50, 6 + Math.sin(t * 20 + y) * 1.5, 0, 7); c.arc(W * 0.965, y + 120, 6 + Math.cos(t * 20 + y) * 1.5, 0, 7); c.fill(); c.fillStyle = '#5f8f2f'; }
          things.forEach(function (o) { if (o.got) return; var x = laneX(o.l), y = o.y;
            if (o.k === 'coin') { var sq = Math.abs(Math.cos(t * 6 + y * 0.05)); c.fillStyle = '#f5b62a'; c.beginPath(); c.ellipse(x, y, 11 * sq + 2, 11, 0, 0, 7); c.fill(); c.fillStyle = '#ffe066'; c.beginPath(); c.ellipse(x, y, 6 * sq + 1, 6, 0, 0, 7); c.fill(); }
            else if (o.k === 'idol') { c.fillStyle = 'rgba(52,211,153,.35)'; c.beginPath(); c.arc(x, y, 26 + Math.sin(t * 8) * 3, 0, 7); c.fill(); c.fillStyle = '#34d399'; c.beginPath(); c.arc(x, y + 6, 13, 0, 7); c.fill(); c.beginPath(); c.arc(x, y - 10, 10, 0, 7); c.fill(); c.beginPath(); c.arc(x - 10, y - 12, 4.5, 0, 7); c.arc(x + 10, y - 12, 4.5, 0, 7); c.fill(); c.fillStyle = '#064e3b'; c.beginPath(); c.arc(x - 3.5, y - 11, 1.8, 0, 7); c.arc(x + 3.5, y - 11, 1.8, 0, 7); c.fill(); }
            else if (o.k === 'spike') { c.fillStyle = '#57534e'; U.rr(c, x - W * 0.12, y - 24, W * 0.24, 48, 6); c.fill(); c.fillStyle = '#e5e7eb'; for (var a = 0; a < 3; a++) for (var b = 0; b < 2; b++) { var sx = x - W * 0.08 + a * W * 0.08, sy = y - 8 + b * 20; c.beginPath(); c.moveTo(sx - 7, sy + 8); c.lineTo(sx, sy - 12); c.lineTo(sx + 7, sy + 8); c.fill(); } }
            else { c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 18, W * 0.12, 9, 0, 0, 7); c.fill(); c.fillStyle = '#a8a184'; U.rr(c, x - W * 0.12, y - 16, W * 0.24, 30, 14); c.fill(); c.fillStyle = '#8f8a70'; for (a = 0; a < 4; a++) c.fillRect(x - W * 0.1 + a * W * 0.06, y - 14, 3, 26); c.fillStyle = '#5f8f2f'; c.beginPath(); c.arc(x + W * 0.06, y - 12, 8, 0, 7); c.fill(); } });
          // explorer (fedora, jacket, running legs)
          var bob = Math.sin(t * 18) * 3, blink = hurtT > 0 && Math.floor(hurtT * 12) % 2; if (!blink) { var x = lx;
            c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, py + 30, 18, 6, 0, 0, 7); c.fill();
            c.fillStyle = '#6b5a45'; c.fillRect(x - 9, py + 8 + (bob > 0 ? 0 : 4), 7, 18); c.fillRect(x + 2, py + 8 + (bob > 0 ? 4 : 0), 7, 18);
            c.fillStyle = '#8b5a2b'; U.rr(c, x - 13, py - 16 + bob, 26, 28, 9); c.fill(); c.fillStyle = '#e9d8b4'; c.fillRect(x - 4, py - 14 + bob, 8, 18);
            c.fillStyle = '#f1c7a0'; c.beginPath(); c.arc(x, py - 26 + bob, 11, 0, 7); c.fill();
            c.fillStyle = '#7a5230'; c.beginPath(); c.ellipse(x, py - 32 + bob, 19, 5, 0, 0, 7); c.fill(); U.rr(c, x - 10, py - 46 + bob, 20, 14, 6); c.fill(); c.fillStyle = '#3f2a12'; c.fillRect(x - 10, py - 36 + bob, 20, 3); }
          // the boulder behind (bottom of the screen), rolls closer when you get hurt
          var bY = H + 70 - bz * 120 - Math.sin(t * 3) * 6, R = W * 0.36; c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(W / 2, bY - R * 0.1, R * 1.05, R * 0.4, 0, 0, 7); c.fill();
          c.fillStyle = '#8a8170'; c.beginPath(); c.arc(W / 2, bY, R, 0, 7); c.fill(); c.strokeStyle = '#6b6352'; c.lineWidth = 5; for (i = 0; i < 4; i++) { var aa = t * 5 + i * 1.57; c.beginPath(); c.arc(W / 2 + Math.cos(aa) * R * 0.5, bY + Math.sin(aa) * R * 0.25 - R * 0.4, R * 0.18, 0, 7); c.stroke(); }
          for (i = 0; i < sparks.length; i++) { var q = sparks[i]; c.globalAlpha = Math.max(0, q.life / 0.4); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, 3, 0, 7); c.fill(); } c.globalAlpha = 1;
          c.fillStyle = 'rgba(30,22,10,.55)'; c.fillRect(0, 0, W, 64);
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ffffff' : 'rgba(255,255,255,.35)');
          U.text(c, String(api.score), W - 16, 32, 30, '#fde047', 'right', '#3f2a12'); U.text(c, 'BOULDER RUN', W / 2, 40, 16, '#fff', 'center', '#3f2a12');
          if (msgT > 0) U.text(c, msg[0], W / 2, 110, 20, msg[1], 'center', '#000');
          if (api.playing && t < 4) U.text(c, api.touch ? 'TAP left / right to switch lanes!' : 'LEFT / RIGHT to switch lanes!', W / 2, 140, 17, '#fff', 'center', '#3f2a12');
        },
        dbg: function () { return { t: t, hearts: hearts, lane: lane, n: things.length, bz: bz }; },
        onDown: function (x, y) { sx0 = x; sy0 = y; move(x < api.W / 2 ? -1 : 1); }, onMove: function () {}, onUp: function () {},
        onKey: function (k, dn) { if (dn === false) return; if (k === 'ArrowLeft' || k === 'a' || k === 'A') move(-1); else if (k === 'ArrowRight' || k === 'd' || k === 'D') move(1); }
      };
    }
  });
})();
