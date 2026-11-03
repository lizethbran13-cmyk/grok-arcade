/* Grok Arcade - bonus game #44: Target Drill (Grok Pickleball Park tie-in).
   Coach Luna's ball machine at the Grok Pickleball Park Training Center fires balls over the net. DRAG (or tap) to slide your paddle under the landing marker.
   WHERE the ball meets your paddle aims the return (left edge = left, centre = straight, right edge = right; a dotted guide shows it):
   any return +1, a return into the gold target ring +3 (the ring then moves), golden balls +2 more, a 10-ball streak +5.
   Balls marked OUT are going wide: LET THEM GO (+1 good call) or lose a heart. 3 hearts; the machine speeds up and a second machine joins. Perf: the park + court are drawn once per size to an offscreen canvas; tiny particle pool. */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'targetdrill', name: 'Target Drill', ticketDiv: 4,
    howTouch: 'Coach Luna\u2019s ball machine drill at Grok Pickleball Park! DRAG to slide your paddle under the landing marker. Where the ball hits your paddle aims the return: use the edges to steer it into the gold target ring for +3. Balls marked OUT are going wide: let them go! Miss a ball or hit an OUT ball and you lose a heart.',
    howKeys: 'Coach Luna\u2019s ball machine drill at Grok Pickleball Park! Move your paddle with LEFT / RIGHT (or A / D, or the mouse) to get under the landing marker. Where the ball hits your paddle aims the return: use the edges to steer it into the gold target ring for +3. Balls marked OUT are going wide: let them go! Miss a ball or hit an OUT ball and you lose a heart.',
    create: function (api) {
      var t, hearts, px, want, keyDir, balls, backs, pops, msg, msgT, hurtT, spawnT, lastArr, rally, returns, coachX, partnerX, tgt, tgtPulse, bg = null, bgKey = '';
      function L() { var W = api.W, H = api.H, mx = Math.round(W * 0.1), top = 92, bot = H - 26, net = top + Math.round((bot - top) * 0.36); return { W: W, H: H, mx: mx, top: top, bot: bot, net: net, kit: net + Math.round((bot - net) * 0.26), hy: bot - Math.round((bot - net) * 0.2), reach: Math.max(34, W * 0.11) }; }
      function say(s, col) { msg = [s, col]; msgT = 0.9; }
      function burst(x, y, col, n) { for (var i = 0; i < (n || 8) && pops.length < 60; i++) { var a = Math.random() * 6.28, s = 60 + Math.random() * 150; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.6, col: col }); } }
      function hurt(why) { if (hurtT > 0) return; hearts--; hurtT = 0.8; rally = 0; api.sfx('lifelost'); say(why, '#fecaca'); if (hearts <= 0) api.gameOver(); }
      function flight() { return Math.max(0.62, 1.35 - t * 0.011); }
      function doubles() { return t > 30; }
      function newTarget(l) { var hw = (l.W - 2 * l.mx) / 2, cx0 = l.W / 2; var nx; do { nx = cx0 + (Math.random() * 2 - 1) * hw * 0.72; } while (tgt && Math.abs(nx - tgt.x) < hw * 0.3); tgt = { x: nx, y: l.top + (l.net - 22 - l.top) * (0.35 + Math.random() * 0.3), r: Math.max(24, l.W * 0.075) }; tgtPulse = 0; }
      function aimX(b, l) { var off = Math.max(-1, Math.min(1, (b.tx - px) / l.reach)); return l.W / 2 + off * (l.W / 2 - l.mx) * 0.98; }
      function spawn() {
        var l = L(), r = Math.random(), k = t > 6 && r < 0.15 ? 'out' : r < 0.27 ? 'gold' : 'ball';
        var from = doubles() && Math.random() < 0.5 ? 1 : 0, ox = from ? partnerX : coachX, oy = l.net - 52;
        var tx = k === 'out' ? (Math.random() < 0.5 ? l.mx * 0.45 : l.W - l.mx * 0.45) : l.mx + 24 + Math.random() * (l.W - 2 * l.mx - 48);
        var T = flight() * (0.85 + Math.random() * 0.3), arr = t + T; if (arr < lastArr + 0.5) { arr = lastArr + 0.5; T = arr - t; } lastArr = arr;
        balls.push({ k: k, ox: ox, oy: oy, tx: tx, ty: l.hy, t0: t, T: T, arc: 60 + Math.random() * 50, from: from });
        api.sfx('click');
      }
      function bpos(b, l) { var u = Math.min(1.15, (t - b.t0) / b.T); return { u: u, x: b.ox + (b.tx - b.ox) * u, y: b.oy + (b.ty - b.oy) * u, z: Math.max(0, Math.sin(Math.PI * Math.min(1, u)) * b.arc) }; }
      function buildBg() {
        var l = L(), d = api.dpr || 1, key = l.W + 'x' + l.H + '@' + d; if (bg && bgKey === key) return; bgKey = key;
        bg = document.createElement('canvas'); bg.width = Math.round(l.W * d); bg.height = Math.round(l.H * d); var g = bg.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
        var sk = g.createLinearGradient(0, 0, 0, l.top); sk.addColorStop(0, '#38bdf8'); sk.addColorStop(1, '#bae6fd'); g.fillStyle = sk; g.fillRect(0, 0, l.W, l.top);
        g.fillStyle = '#4ade80'; g.fillRect(0, l.top - 18, l.W, l.H); g.fillStyle = '#22c55e'; for (var i = 0; i < 9; i++) { g.beginPath(); g.arc(i * l.W / 8, l.top - 14, 22, Math.PI, 0); g.fill(); }
        for (i = 0; i < 4; i++) { var tx0 = l.W * (0.08 + i * 0.28); g.fillStyle = '#92400e'; g.fillRect(tx0 - 3, l.top - 40, 6, 24); g.fillStyle = i % 2 ? '#16a34a' : '#15803d'; g.beginPath(); g.arc(tx0, l.top - 46, 16, 0, 7); g.arc(tx0 - 10, l.top - 38, 11, 0, 7); g.arc(tx0 + 10, l.top - 38, 11, 0, 7); g.fill(); }
        g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(l.W * 0.7, 26, 26, 8, 0, 0, 7); g.ellipse(l.W * 0.7 + 14, 20, 14, 7, 0, 0, 7); g.fill();
        // court: blue playing area, green surround, white lines, shaded kitchens
        g.fillStyle = '#15803d'; g.fillRect(l.mx - 14, l.top - 4, l.W - 2 * l.mx + 28, l.bot - l.top + 18);
        g.fillStyle = '#2563eb'; g.fillRect(l.mx, l.top, l.W - 2 * l.mx, l.bot - l.top);
        var kTop = l.net - (l.kit - l.net); g.fillStyle = 'rgba(250,204,21,.22)'; g.fillRect(l.mx, kTop, l.W - 2 * l.mx, l.kit - kTop);
        g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.strokeRect(l.mx, l.top, l.W - 2 * l.mx, l.bot - l.top);
        g.beginPath(); g.moveTo(l.mx, l.kit); g.lineTo(l.W - l.mx, l.kit); g.moveTo(l.mx, kTop); g.lineTo(l.W - l.mx, kTop); g.moveTo(l.W / 2, l.top); g.lineTo(l.W / 2, kTop); g.moveTo(l.W / 2, l.kit); g.lineTo(l.W / 2, l.bot); g.stroke();
        g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText('KITCHEN', l.W / 2 - l.W * 0.2, l.kit - 8); g.fillText('KITCHEN', l.W / 2 + l.W * 0.2, l.kit - 8);
        // net
        g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(l.mx - 10, l.net + 4, l.W - 2 * l.mx + 20, 6);
        g.fillStyle = '#334155'; g.fillRect(l.mx - 12, l.net - 22, 6, 28); g.fillRect(l.W - l.mx + 6, l.net - 22, 6, 28);
        g.strokeStyle = 'rgba(15,23,42,.55)'; g.lineWidth = 1; for (var nx = l.mx - 6; nx < l.W - l.mx + 6; nx += 6) { g.beginPath(); g.moveTo(nx, l.net - 18); g.lineTo(nx, l.net + 2); g.stroke(); } for (var ny = l.net - 14; ny < l.net + 2; ny += 5) { g.beginPath(); g.moveTo(l.mx - 6, ny); g.lineTo(l.W - l.mx + 6, ny); g.stroke(); }
        g.fillStyle = '#f8fafc'; g.fillRect(l.mx - 6, l.net - 21, l.W - 2 * l.mx + 12, 4);
        // park sign
        g.fillStyle = '#16a34a'; U.rr(g, l.W / 2 - 96, 40, 192, 26, 8); g.fill(); g.strokeStyle = '#e6ff3b'; g.lineWidth = 2; U.rr(g, l.W / 2 - 96, 40, 192, 26, 8); g.stroke(); U.text(g, 'GROK PICKLEBALL PARK', l.W / 2, 53, 13, '#fff');
      }
      function drawBall(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.fillStyle = 'rgba(0,0,0,.28)'; for (var i = 0; i < 5; i++) { var a = i * 1.26 + 0.4; c.beginPath(); c.arc(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.15, 0, 7); c.fill(); } c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.4, r * 0.25, 0, 7); c.fill(); }
      function drawMachine(c, x, y, col) { c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 20, 22, 5, 0, 0, 7); c.fill(); c.fillStyle = '#334155'; U.rr(c, x - 18, y - 4, 36, 24, 6); c.fill(); c.fillStyle = col; U.rr(c, x - 15, y - 1, 30, 10, 4); c.fill();
        c.fillStyle = '#e6ff3b'; c.beginPath(); c.arc(x - 8, y - 9, 6, 0, 7); c.arc(x + 3, y - 11, 6, 0, 7); c.arc(x + 11, y - 7, 5, 0, 7); c.fill(); c.fillStyle = '#1f2937'; c.fillRect(x - 4, y + 12, 8, 8); c.fillStyle = '#111'; c.beginPath(); c.arc(x - 12, y + 21, 3.5, 0, 7); c.arc(x + 12, y + 21, 3.5, 0, 7); c.fill(); }
      function swing(l) { // returns at the hit line
        for (var i = balls.length - 1; i >= 0; i--) { var b = balls[i]; if (t - b.t0 < b.T) continue; var dx = Math.abs(b.tx - px), inReach = dx < l.reach;
          if (b.k === 'out') { if (inReach) { hurt('That was OUT!'); burst(b.tx, l.hy, '#f87171', 10); } else { api.addScore(1); api.sfx('point'); say('Good call! +1', '#bbf7d0'); } balls.splice(i, 1); continue; }
          if (!inReach) { hurt('Missed!'); burst(b.tx, l.hy, '#e6ff3b', 8); balls.splice(i, 1); continue; }
          var lx = aimX(b, l), ly = tgt.y, hit = Math.abs(lx - tgt.x) < tgt.r * 1.15, pts = (hit ? 3 : 1) + (b.k === 'gold' ? 2 : 0); rally++; returns++;
          if (rally % 10 === 0) { pts += 5; say('STREAK x' + rally + '! +5', '#fde047'); api.sfx('perfect'); } else if (hit) { say(b.k === 'gold' ? 'GOLDEN TARGET! +5' : 'TARGET! +3', '#fde047'); api.sfx('perfect'); } else if (b.k === 'gold') { say('GOLDEN BALL! +3', '#fde047'); api.sfx('perfect'); } else api.sfx('point');
          if (hit) { burst(tgt.x, tgt.y, '#facc15', 12); newTarget(l); }
          api.addScore(pts); burst(b.tx, l.hy - 10, b.k === 'gold' ? '#facc15' : '#e6ff3b', 8); if (returns >= 40 && GA.Prog) GA.Prog.event('drill40');
          backs.push({ x: b.tx, y: l.hy, vx: (lx - b.tx) / 0.5, vy: (ly - l.hy) / 0.5, life: 0.5, gold: b.k === 'gold' }); balls.splice(i, 1); }
      }
      return {
        reset: function () { var l = L(); t = 0; hearts = 3; px = want = l.W / 2; keyDir = 0; balls = []; backs = []; pops = []; msgT = 0; hurtT = 0; spawnT = 0.6; lastArr = -9; rally = 0; returns = 0; coachX = l.W / 2; partnerX = l.W * 0.72; tgt = null; newTarget(l); },
        update: function (dt) {
          var l = L(), i;
          if (msgT > 0) msgT -= dt; if (hurtT > 0) hurtT -= dt; tgtPulse += dt;
          for (i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.vy += 320 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          for (i = backs.length - 1; i >= 0; i--) { var bk = backs[i]; bk.life -= dt; bk.x += bk.vx * dt; bk.y += bk.vy * dt; if (bk.life <= 0) backs.splice(i, 1); }
          if (keyDir) want = Math.max(l.mx, Math.min(l.W - l.mx, want + keyDir * 520 * dt));
          px += (want - px) * Math.min(1, dt * 18);
          // coaches drift toward the side they will hit from next
          var cWant = doubles() ? l.W * 0.3 : l.W / 2 + Math.sin(t * 0.9) * l.W * 0.18; coachX += (cWant - coachX) * Math.min(1, dt * 3); partnerX += (l.W * 0.7 + Math.sin(t * 1.1) * l.W * 0.06 - partnerX) * Math.min(1, dt * 3);
          if (!api.playing) return; t += dt;
          spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(doubles() ? 0.5 : 0.62, 1.25 - t * 0.012) * (0.8 + Math.random() * 0.4); }
          swing(l);
        },
        draw: function (c) {
          var l = L(), i; buildBg(); c.drawImage(bg, 0, 0, l.W, l.H);
          // gold target ring on the far side
          var tr = tgt.r * (1 + Math.sin(tgtPulse * 5) * 0.06); c.fillStyle = 'rgba(250,204,21,.25)'; c.beginPath(); c.ellipse(tgt.x, tgt.y, tr, tr * 0.5, 0, 0, 7); c.fill(); c.strokeStyle = '#facc15'; c.lineWidth = 3; c.beginPath(); c.ellipse(tgt.x, tgt.y, tr, tr * 0.5, 0, 0, 7); c.stroke(); c.beginPath(); c.ellipse(tgt.x, tgt.y, tr * 0.45, tr * 0.22, 0, 0, 7); c.stroke();
          c.fillStyle = '#f97316'; c.beginPath(); c.moveTo(tgt.x - 6, tgt.y); c.lineTo(tgt.x, tgt.y - 16); c.lineTo(tgt.x + 6, tgt.y); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.fillRect(tgt.x - 3, tgt.y - 9, 6, 2);
          // Coach Luna's ball machine (+ a second machine later)
          drawMachine(c, coachX, l.net - 50, '#16a34a'); if (doubles()) drawMachine(c, partnerX, l.net - 50, '#f97316');
          // aim guide for the next ball about to arrive
          var nb = null; balls.forEach(function (b) { if (b.k !== 'out' && (!nb || b.t0 + b.T < nb.t0 + nb.T)) nb = b; });
          if (nb && nb.t0 + nb.T - t < 0.7 && Math.abs(nb.tx - px) < l.reach) { var ax = aimX(nb, l); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.setLineDash([6, 6]); c.beginPath(); c.moveTo(nb.tx, l.hy - 14); c.quadraticCurveTo((nb.tx + ax) / 2, (l.hy + tgt.y) / 2 - 60, ax, tgt.y); c.stroke(); c.setLineDash([]); }
          // landing markers + balls in flight
          balls.forEach(function (b) { var p = bpos(b, l), out = b.k === 'out';
            c.strokeStyle = out ? 'rgba(248,113,113,.9)' : b.k === 'gold' ? 'rgba(250,204,21,.95)' : 'rgba(230,255,59,.9)'; c.lineWidth = 3; var rr0 = 16 - p.u * 6; c.beginPath(); c.ellipse(b.tx, b.ty, rr0 + 6, rr0 * 0.45 + 3, 0, 0, 7); c.stroke();
            if (out) { U.text(c, 'OUT', Math.max(22, Math.min(l.W - 22, b.tx)), b.ty - 22, 14, '#fff', 'center', '#b91c1c'); }
            c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(p.x, p.y + 6, 9, 3.5, 0, 0, 7); c.fill();
            var r = 8 + p.z * 0.06; if (b.k === 'gold') { c.fillStyle = 'rgba(253,224,71,.35)'; c.beginPath(); c.arc(p.x, p.y - p.z, r + 7, 0, 7); c.fill(); }
            drawBall(c, p.x, p.y - p.z, r, out ? '#fb923c' : b.k === 'gold' ? '#facc15' : '#e6ff3b'); });
          backs.forEach(function (bk) { drawBall(c, bk.x, bk.y - Math.sin(bk.life / 0.5 * Math.PI) * 40, 7, bk.gold ? '#facc15' : '#e6ff3b'); });
          // your paddle (flashes while hurt)
          if (!(hurtT > 0 && Math.floor(hurtT * 12) % 2)) { var pw = l.reach * 2; c.fillStyle = 'rgba(230,255,59,.22)'; c.beginPath(); c.ellipse(px, l.hy, l.reach, 10, 0, 0, 7); c.fill();
            c.fillStyle = '#1f2937'; U.rr(c, px - 6, l.hy + 6, 12, 22, 4); c.fill(); c.fillStyle = '#111827'; U.rr(c, px - pw * 0.42, l.hy - 18, pw * 0.84, 26, 12); c.fill(); c.fillStyle = '#e6ff3b'; U.rr(c, px - pw * 0.42 + 3, l.hy - 15, pw * 0.84 - 6, 20, 10); c.fill();
            U.text(c, 'MAXGRIT', px, l.hy - 5, 10, '#14532d'); }
          for (i = 0; i < pops.length; i++) { var q = pops[i]; c.globalAlpha = Math.max(0, q.life / 0.6); c.fillStyle = q.col; c.fillRect(q.x - 3, q.y - 3, 6, 6); } c.globalAlpha = 1;
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 22, 22, i < hearts ? '#ef4444' : 'rgba(0,0,0,.2)');
          U.text(c, String(api.score), l.W - 16, 24, 30, '#fff', 'right', '#14532d'); U.text(c, 'TARGET DRILL', l.W / 2, 20, 15, '#fff', 'center', '#14532d');
          if (rally >= 3) U.text(c, 'streak ' + rally, l.W / 2, l.top + 14, 13, '#fff', 'center', '#1e3a8a');
          if (doubles() && t < 33) U.text(c, 'TWO MACHINES!', l.W / 2, l.net + 40, 22, '#fde047', 'center', '#000');
          if (msgT > 0) U.text(c, msg[0], l.W / 2, l.net + 70, 22, msg[1], 'center', '#000');
          if (api.playing && t < 4) U.text(c, api.touch ? 'DRAG your paddle \u00b7 edges aim the return' : 'LEFT / RIGHT or mouse \u00b7 edges aim', l.W / 2, l.H - 10, 16, '#fff', 'center', '#14532d');
        },
        dbg: function () { var l = L(); return { t: t, hearts: hearts, px: px, balls: balls.map(function (b) { return { k: b.k, tx: b.tx, eta: b.t0 + b.T - t }; }), returns: returns, score: api.score, reach: l.reach, tgt: tgt, aim: function (tx) { return aimX({ tx: tx }, l); } }; },
        onDown: function (x) { var l = L(); want = Math.max(l.mx, Math.min(l.W - l.mx, x)); },
        onMove: function (x, y, down) { var l = L(); if (down || !api.touch) want = Math.max(l.mx, Math.min(l.W - l.mx, x)); },
        onKey: function (k, dn) { if (k === 'ArrowLeft' || k === 'a' || k === 'A') keyDir = dn === false ? (keyDir < 0 ? 0 : keyDir) : -1; else if (k === 'ArrowRight' || k === 'd' || k === 'D') keyDir = dn === false ? (keyDir > 0 ? 0 : keyDir) : 1; }
      };
    }
  });
})();
