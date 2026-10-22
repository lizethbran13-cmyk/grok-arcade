/* Grok Arcade - bonus game #37: Patty Panic (Grok Eatsville Tycoon tie-in).
   You're on the grill at the Main St Diner. Raw patties land on the Ratita Industries grill (6 spots).
   Each side cooks raw -> GOLDEN -> burnt. TAP a patty while it's golden to flip it (+1); tap again when the second side is golden to serve it (+2).
   Burnt patties cost a heart. Sometimes the Ratita grill hiccups and LAUNCHES a patty into the air: tap it before it lands for +3!
   Grease splats appear: tap them to wipe before Inspector Grumbleton's clipboard meter fills (or lose a heart). 3 hearts; it speeds up. */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'flip', name: 'Patty Panic', ticketDiv: 4,
    howTouch: 'Work the grill at the Main St Diner! TAP a patty when it turns GOLDEN to flip it, then tap again when the other side is golden to serve it. Don\u2019t let them burn! Tap flying patties when the Ratita grill launches them (+3) and tap grease splats before the Inspector notices.',
    howKeys: 'Work the grill at the Main St Diner! CLICK a patty when it turns GOLDEN to flip it, then click again when the other side is golden to serve it. Don\u2019t let them burn! Click flying patties when the Ratita grill launches them (+3) and click grease splats before the Inspector notices.',
    create: function (api) {
      var t, hearts, slots, pops, msg, msgT, hurtT, spawnT, served, grease, insp, flyer, flyT, shake;
      function say(s, col) { msg = [s, col]; msgT = 1.3; }
      function speed() { return 1 + Math.min(1.2, served / 25); }
      function geo() { var W = api.W, H = api.H, gw = Math.min(W - 40, 420), gx = (W - gw) / 2, gy = H * 0.36, gh = Math.min(H * 0.42, 330); return { gx: gx, gy: gy, gw: gw, gh: gh }; }
      function slotPos(i) { var g = geo(); return { x: g.gx + g.gw * (0.2 + (i % 3) * 0.3), y: g.gy + g.gh * (0.3 + Math.floor(i / 3) * 0.42) }; }
      function hurt(why) { if (hurtT > 0) return; hearts--; hurtT = 1.1; shake = 0.35; api.sfx('lifelost'); say(why, '#fca5a5'); if (hearts <= 0) api.gameOver(); }
      function burst(x, y, col, n) { for (var i = 0; i < (n || 10); i++) { var a = Math.random() * 6.28, s = 60 + Math.random() * 150; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 90, life: 0.7, col: col }); } }
      function spawn() { var free = []; for (var i = 0; i < 6; i++) if (!slots[i]) free.push(i); if (!free.length) return; var i2 = free[(Math.random() * free.length) | 0];
        slots[i2] = { side: 0, c: 0, rate: (0.22 + Math.random() * 0.08) * speed(), land: 0.3 }; }
      // cook level c: 0..1 raw->golden window starts at 0.62, burnt at 1
      function golden(p) { return p.c >= 0.62 && p.c < 1; }
      function pattyCol(c) { if (c < 0.62) { var k = c / 0.62; return 'rgb(' + Math.round(236 - k * 60) + ',' + Math.round(130 - k * 40) + ',' + Math.round(140 - k * 80) + ')'; } if (c < 1) return '#b8742f'; return '#3b2416'; }
      function drawPatty(c, x, y, s, p, rot) { c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(s, s);
        c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, 10, 42, 13, 0, 0, 7); c.fill();
        c.fillStyle = p ? pattyCol(p.c) : '#b8742f'; c.beginPath(); c.ellipse(0, 0, 40, 24, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(-10, -8, 18, 6, -0.2, 0, 7); c.fill();
        if (p && p.side === 1) { c.strokeStyle = 'rgba(40,20,10,.55)'; c.lineWidth = 4; for (var i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(-26, i * 9 - 4); c.lineTo(26, i * 9 + 4); c.stroke(); } }
        if (p && golden(p)) { c.strokeStyle = '#fde047'; c.lineWidth = 4; c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 14); c.beginPath(); c.ellipse(0, 0, 46, 29, 0, 0, 7); c.stroke(); c.globalAlpha = 1; }
        c.restore(); }
      function at(x, y) { for (var i = 0; i < 6; i++) { var sp = slotPos(i); if (Math.hypot((sp.x - x) / 1.4, sp.y - y) < 42) return i; } return -1; }
      return {
        reset: function () { t = 0; hearts = 3; slots = [null, null, null, null, null, null]; pops = []; msgT = 0; hurtT = 0; spawnT = 0.3; served = 0; grease = []; insp = 0; flyer = null; flyT = 7; shake = 0; },
        resize: function () {},
        update: function (dt) {
          if (msgT > 0) msgT -= dt; if (hurtT > 0) hurtT -= dt; if (shake > 0) shake -= dt;
          for (var i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.vy += 320 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          if (!api.playing) return; t += dt;
          spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(0.55, 1.6 - served * 0.03); }
          for (var k = 0; k < 6; k++) { var p = slots[k]; if (!p) continue; if (p.land > 0) p.land -= dt; p.c += p.rate * dt; if (Math.random() < dt * 6) { var sp = slotPos(k); pops.push({ x: sp.x + (Math.random() - 0.5) * 50, y: sp.y - 10, vx: 0, vy: -40, life: 0.5, col: 'rgba(255,255,255,.5)' }); }
            if (p.c >= 1.18) { var s2 = slotPos(k); burst(s2.x, s2.y, '#475569', 14); slots[k] = null; hurt('Burnt! Inspector frowns...'); } }
          // Ratita grill hiccup: launch a patty into the air
          flyT -= dt; if (flyT <= 0 && !flyer) { var full = []; for (var j = 0; j < 6; j++) if (slots[j]) full.push(j); if (full.length) { var jj = full[(Math.random() * full.length) | 0], sp3 = slotPos(jj); flyer = { x: sp3.x, y: sp3.y, vx: (Math.random() - 0.5) * 160, vy: -api.H * 0.95, rot: 0, p: slots[jj] }; slots[jj] = null; api.sfx('zap'); say('\uD83D\uDC00 RATITA GRILL HICCUP! Catch it!', '#93c5fd'); } flyT = 6 + Math.random() * 5; }
          if (flyer) { flyer.vy += api.H * 0.9 * dt; flyer.x += flyer.vx * dt; flyer.y += flyer.vy * dt; flyer.rot += dt * 9; if (flyer.y > api.H + 40) { flyer = null; hurt('Splat! It hit the floor.'); } }
          // grease + inspector meter
          if (Math.random() < dt * (0.12 + served * 0.004)) { var g = geo(); if (grease.length < 4) grease.push({ x: g.gx + 30 + Math.random() * (g.gw - 60), y: g.gy + g.gh + 22 + Math.random() * 40, r: 16 + Math.random() * 10 }); }
          if (grease.length) insp += dt * grease.length * 0.09; else insp = Math.max(0, insp - dt * 0.25);
          if (insp >= 1) { insp = 0.25; grease = []; hurt('\uD83D\uDD75\uFE0F Grumbleton: \u201CGREASY! Hmph.\u201D'); }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i, g = geo(); c.save(); if (shake > 0) c.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
          // diner kitchen: teal + white tiles, hood, counter
          c.fillStyle = '#ccfbf1'; c.fillRect(0, 0, W, H); for (var y = 0; y < H * 0.34; y += 28) for (var x = (y / 28) % 2 ? 14 : 0; x < W; x += 28) { c.fillStyle = '#99f6e4'; c.fillRect(x, y, 14, 14); }
          c.fillStyle = '#94a3b8'; U.rr(c, g.gx - 10, H * 0.2, g.gw + 20, H * 0.08, 10); c.fill(); c.fillStyle = '#cbd5e1'; c.fillRect(g.gx, H * 0.27, g.gw, 8);
          c.fillStyle = '#f97316'; U.rr(c, 0, 0, W, 76, 0); c.fill(); c.fillStyle = '#fff7ed'; c.fillRect(0, 76, W, 6);
          c.fillStyle = '#e2e8f0'; c.fillRect(0, g.gy + g.gh, W, H - g.gy - g.gh); c.fillStyle = '#14b8a6'; c.fillRect(0, g.gy + g.gh + 90, W, H);
          // grill
          c.fillStyle = '#374151'; U.rr(c, g.gx - 8, g.gy - 8, g.gw + 16, g.gh + 16, 18); c.fill(); c.fillStyle = '#1f2937'; U.rr(c, g.gx, g.gy, g.gw, g.gh, 12); c.fill();
          c.strokeStyle = '#4b5563'; c.lineWidth = 5; for (i = 1; i < 9; i++) { c.beginPath(); c.moveTo(g.gx + 10, g.gy + i * g.gh / 9); c.lineTo(g.gx + g.gw - 10, g.gy + i * g.gh / 9); c.stroke(); }
          c.fillStyle = 'rgba(249,115,22,' + (0.15 + 0.08 * Math.sin(t * 5)) + ')'; U.rr(c, g.gx, g.gy, g.gw, g.gh, 12); c.fill();
          U.text(c, 'RATITA INDUSTRIES', W / 2, g.gy + g.gh + 2, 12, '#cbd5e1', 'center');
          for (i = 0; i < 6; i++) { var sp = slotPos(i), p = slots[i]; if (!p) { c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 3; c.beginPath(); c.ellipse(sp.x, sp.y, 40, 24, 0, 0, 7); c.stroke(); continue; }
            drawPatty(c, sp.x, sp.y - (p.land > 0 ? p.land * 120 : 0), 1, p); if (p.c >= 1) U.text(c, '\uD83D\uDD25', sp.x + 30, sp.y - 26, 20, '#fff', 'center'); }
          grease.forEach(function (q) { c.fillStyle = 'rgba(180,140,40,.75)'; c.beginPath(); c.arc(q.x, q.y, q.r, 0, 7); c.arc(q.x + q.r * 0.8, q.y + 4, q.r * 0.55, 0, 7); c.arc(q.x - q.r * 0.7, q.y + 6, q.r * 0.45, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(q.x - 4, q.y - 4, 4, 0, 7); c.fill(); });
          if (flyer) drawPatty(c, flyer.x, flyer.y, 1, flyer.p, flyer.rot);
          for (i = 0; i < pops.length; i++) { var q = pops[i]; c.globalAlpha = Math.max(0, q.life / 0.7); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, 4, 0, 7); c.fill(); } c.globalAlpha = 1;
          // inspector meter
          var mx = W / 2 - 80, my = 92; c.fillStyle = 'rgba(15,23,42,.6)'; U.rr(c, mx, my, 160, 16, 8); c.fill(); c.fillStyle = insp > 0.7 ? '#ef4444' : '#facc15'; U.rr(c, mx + 2, my + 2, 156 * Math.min(1, insp), 12, 6); c.fill(); U.text(c, '\uD83D\uDD75\uFE0F', mx - 14, my + 13, 16, '#fff', 'center');
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ffffff' : 'rgba(255,255,255,.35)');
          U.text(c, String(api.score), W - 16, 32, 30, '#fff', 'right', '#7c2d12'); U.text(c, 'PATTY PANIC', W / 2, 58, 14, '#fff', 'center', '#7c2d12');
          if (msgT > 0) U.text(c, msg[0], W / 2, 140, 19, msg[1], 'center', '#000');
          if (api.playing && t < 4) U.text(c, (api.touch ? 'TAP' : 'CLICK') + ' patties when they glow GOLDEN!', W / 2, H - 24, 17, '#fff', 'center', '#134e4a');
          c.restore();
        },
        dbg: function () { return { t: t, hearts: hearts, served: served, slots: slots.map(function (p) { return p ? [p.side, +p.c.toFixed(2)] : 0; }), grease: grease.length, insp: +insp.toFixed(2), flyer: !!flyer }; },
        onDown: function (x, y) { if (!api.playing) return;
          if (flyer && Math.hypot(flyer.x - x, flyer.y - y) < 60) { var fx = flyer.x, fy = flyer.y; flyer = null; api.addScore(3); api.sfx('perfect'); burst(fx, fy, '#ffd23f', 22); say('Nice catch! +3', '#fde047'); return; }
          for (var k = 0; k < grease.length; k++) if (Math.hypot(grease[k].x - x, grease[k].y - y) < grease[k].r + 22) { var gq = grease.splice(k, 1)[0]; api.sfx('fixed'); burst(gq.x, gq.y, '#e0f2fe', 8); return; }
          var i = at(x, y); if (i < 0) return; var p = slots[i], sp = slotPos(i); if (!p || p.land > 0) return;
          if (golden(p)) { if (p.side === 0) { p.side = 1; p.c = 0.15; api.addScore(1); api.sfx('point'); burst(sp.x, sp.y, '#fcd34d', 6); }
            else { slots[i] = null; served++; api.addScore(2); api.sfx('ding'); burst(sp.x, sp.y, '#ffd23f', 14); if (served % 10 === 0) say('Order up! ' + served + ' burgers \uD83C\uDF54', '#fde68a'); if (served >= 25 && GA.Prog) GA.Prog.event('flip25'); } }
          else if (p.c < 0.62) { api.sfx('boop'); say('Not yet! Wait for GOLDEN', '#fff'); }
        },
        onMove: function () {}, onUp: function () {}, onKey: function () {}
      };
    }
  });
})();
