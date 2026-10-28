/* Grok Arcade - bonus game #38: Shell Drop (Grok Torty Town tie-in, Tortuga Tech Inc.).
   Gadgets fall down Tortuga Tech's drop tower. CRACKED ones (red cracks) will break: TAP them to bolt on a shell plate before they hit the pad.
   Plated / already-tough gadgets that land = +1 (golden gadgets +3). A cracked gadget that lands = BOING, lose a heart. Don't tap the
   Rubber Lettuce (it's already tough: tapping it wastes a plate, -1 heart). 3 hearts; drops speed up. */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'shelldrop', name: 'Shell Drop', ticketDiv: 4,
    howTouch: 'Tortuga Tech drop test! Gadgets fall from the tower. TAP the CRACKED ones (red cracks) to bolt on a shell plate before they land. Tough landings = +1, golden gadgets = +3. A cracked landing costs a heart. Don\u2019t tap the green Rubber Lettuce!',
    howKeys: 'Tortuga Tech drop test! Gadgets fall from the tower. CLICK the CRACKED ones (red cracks) to bolt on a shell plate before they land. Tough landings = +1, golden gadgets = +3. A cracked landing costs a heart. Don\u2019t click the green Rubber Lettuce!',
    create: function (api) {
      var t, hearts, items, pops, msg, msgT, hurtT, spawnT, landed;
      var KINDS = ['goggles', 'wheel', 'popper', 'box'];
      function say(s, col) { msg = [s, col]; msgT = 1.1; }
      function speed() { return 90 + Math.min(150, t * 3.2); }
      function spawn() { var r = Math.random(), k = r < 0.16 ? 'lettuce' : KINDS[(Math.random() * 4) | 0]; var gold = k !== 'lettuce' && Math.random() < 0.12;
        items.push({ x: 60 + Math.random() * (api.W - 120), y: 70, k: k, gold: gold, cracked: k !== 'lettuce' && Math.random() < 0.68, plated: false, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 2, bounce: 0 }); }
      function hurt(why) { if (hurtT > 0) return; hearts--; hurtT = 1.0; api.sfx('lifelost'); say(why, '#fca5a5'); if (hearts <= 0) api.gameOver(); }
      function burst(x, y, col, n) { for (var i = 0; i < (n || 10); i++) { var a = Math.random() * 6.28, s = 60 + Math.random() * 140; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.7, col: col }); } }
      function hex(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); for (var k = 0; k < 6; k++) { var a = k / 6 * 6.283 + 0.52; c[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill(); c.strokeStyle = '#6e4524'; c.lineWidth = 2; c.stroke(); }
      function drawItem(c, it) { c.save(); c.translate(it.x, it.y); c.rotate(it.rot * 0.15); var base = it.gold ? '#ffd23f' : null;
        if (it.k === 'goggles') { c.fillStyle = base || '#7c3aed'; U.rr(c, -30, -5, 60, 10, 5); c.fill(); [-14, 14].forEach(function (dx) { c.fillStyle = '#6b7280'; c.beginPath(); c.arc(dx, 0, 13, 0, 7); c.fill(); c.fillStyle = '#3ff0ff'; c.beginPath(); c.arc(dx, 0, 9, 0, 7); c.fill(); }); }
        else if (it.k === 'wheel') { c.fillStyle = '#1f2937'; c.beginPath(); c.arc(0, 0, 22, 0, 7); c.fill(); c.fillStyle = base || '#ffd23f'; c.beginPath(); c.arc(0, 0, 13, 0, 7); c.fill(); }
        else if (it.k === 'popper') { c.fillStyle = base || '#ff5d8f'; c.beginPath(); c.moveTo(-14, -22); c.lineTo(14, -22); c.lineTo(2, 22); c.lineTo(-2, 22); c.closePath(); c.fill(); c.fillStyle = '#3ff0ff'; c.beginPath(); c.arc(-6, -25, 4, 0, 7); c.arc(6, -25, 4, 0, 7); c.fill(); }
        else if (it.k === 'box') { c.fillStyle = base || '#d8a15a'; U.rr(c, -20, -18, 40, 36, 6); c.fill(); c.fillStyle = '#b07a3c'; c.fillRect(-20, -3, 40, 6); }
        else { c.fillStyle = '#4ade80'; c.beginPath(); c.arc(0, 0, 18, 0, 7); c.fill(); c.fillStyle = '#86efac'; c.beginPath(); c.arc(-5, -5, 9, 0, 7); c.fill(); }
        if (it.plated) { hex(c, -10, -6, 9, '#b98545'); hex(c, 9, 4, 9, '#0f9d8a'); }
        else if (it.cracked) { c.strokeStyle = 'rgba(239,68,68,' + (0.6 + Math.sin(t * 12) * 0.4) + ')'; c.lineWidth = 3; c.beginPath(); c.moveTo(-12, -8); c.lineTo(-3, 2); c.lineTo(4, -5); c.lineTo(12, 8); c.stroke(); }
        c.restore(); }
      return {
        reset: function () { t = 0; hearts = 3; items = []; pops = []; msgT = 0; hurtT = 0; spawnT = 0.6; landed = 0; },
        update: function (dt) {
          if (msgT > 0) msgT -= dt; if (hurtT > 0) hurtT -= dt;
          for (var i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.vy += 300 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          if (!api.playing) return; t += dt; spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(0.45, 1.25 - t * 0.012); }
          var pad = api.H - 70;
          for (i = items.length - 1; i >= 0; i--) { var it = items[i]; if (it.bounce > 0) { it.bounce -= dt; it.y -= 60 * dt; if (it.bounce <= 0) items.splice(i, 1); continue; }
            it.y += speed() * dt; it.rot += it.vr * dt;
            if (it.y >= pad) { if (it.cracked && !it.plated) { hurt('BOING! It cracked!'); burst(it.x, pad, '#fca5a5', 12); items.splice(i, 1); }
              else { var pts = it.gold ? 3 : 1; api.addScore(pts); landed++; api.sfx(pts > 1 ? 'perfect' : 'point'); burst(it.x, pad, it.gold ? '#ffd23f' : '#5eead4', 10); say(pts > 1 ? 'GOLDEN & TOUGH! +3' : 'CLONK! Not a scratch', '#fff'); it.bounce = 0.35; if (landed >= 40 && GA.Prog) GA.Prog.event('drop40'); } } }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i; var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#ffd59e'); gr.addColorStop(1, '#ff9f7a'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
          // drop tower frame + hazard pad
          c.fillStyle = '#ef4444'; c.fillRect(18, 60, 10, H - 120); c.fillRect(W - 28, 60, 10, H - 120); c.fillStyle = '#facc15'; c.fillRect(18, 60, W - 36, 12);
          for (i = 0; i < W / 30; i++) { c.fillStyle = i % 2 ? '#111827' : '#facc15'; c.fillRect(i * 30, H - 62, 30, 14); } c.fillStyle = '#3b82f6'; U.rr(c, 30, H - 74, W - 60, 14, 6); c.fill();
          items.forEach(function (it) { drawItem(c, it); });
          for (i = 0; i < pops.length; i++) { var q = pops[i]; c.globalAlpha = Math.max(0, q.life / 0.7); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, 4, 0, 7); c.fill(); } c.globalAlpha = 1;
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ffffff' : 'rgba(255,255,255,.35)');
          U.text(c, String(api.score), W - 16, 32, 30, '#fff', 'right', '#7c2d12'); U.text(c, 'SHELL DROP', W / 2, 58, 14, '#fff', 'center', '#0f766e');
          if (msgT > 0) U.text(c, msg[0], W / 2, 120, 20, msg[1], 'center', '#000');
          if (api.playing && t < 4) U.text(c, api.touch ? 'TAP the cracked gadgets!' : 'CLICK the cracked gadgets!', W / 2, H - 22, 18, '#7c2d12', 'center', '#fff');
        },
        dbg: function () { return { t: t, hearts: hearts, items: items.map(function (it) { return [it.k, Math.round(it.x), Math.round(it.y), it.cracked, it.plated]; }) }; },
        onDown: function (x, y) { var best = null, bd = 40; items.forEach(function (it) { var d = Math.hypot(it.x - x, it.y - y); if (d < bd && !it.bounce) { bd = d; best = it; } }); if (!best) return;
          if (best.k === 'lettuce') { hurt('That lettuce was already tough!'); return; } if (best.cracked && !best.plated) { best.plated = true; api.sfx('eat'); burst(best.x, best.y, '#b98545', 6); } },
        onKey: function () {}
      };
    }
  });
})();
