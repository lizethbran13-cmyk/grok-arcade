/* Grok Arcade - bonus game #42: Ring Dash (Grok Snowie Sky Tours tie-in).
   Snowie's tour copter zooms right. HOLD to climb, let go to dip. Fly through a sky ring = +1 (golden ring +3).
   Missing a ring or bumping a seagull costs a heart. Touching the clouds below or the top of the sky just bounces you. 3 hearts; it speeds up. */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'ringdash', name: 'Ring Dash', ticketDiv: 4,
    howTouch: 'Fly with Snowie! HOLD to climb, let go to dip. Fly the copter through the sky rings. Ring = +1, golden ring = +3. A missed ring or a seagull bump costs a heart.',
    howKeys: 'Fly with Snowie! HOLD the mouse button or SPACE to climb, let go to dip. Fly the copter through the sky rings. Ring = +1, golden ring = +3. A missed ring or a seagull bump costs a heart.',
    create: function (api) {
      var t, hearts, y, vy, hold, rings, gulls, pops, clouds, msg, msgT, hurtT, ringT, gullT, passed;
      var CX = 90;
      function say(s, col) { msg = [s, col]; msgT = 1.0; }
      function speed() { return 140 + Math.min(150, t * 3.2); }
      function burst(x, yy, col, n) { for (var i = 0; i < (n || 10); i++) { var a = Math.random() * 6.28, s = 50 + Math.random() * 130; pops.push({ x: x, y: yy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.7, col: col }); } }
      function hurt(why) { if (hurtT > 0) return; hearts--; hurtT = 0.9; api.sfx('lifelost'); say(why, '#fecaca'); if (hearts <= 0) api.gameOver(); }
      function top() { return 60; } function bot() { return api.H - 60; }
      return {
        reset: function () { t = 0; hearts = 3; y = api.H * 0.45; vy = 0; hold = false; rings = []; gulls = []; pops = []; msgT = 0; hurtT = 0; ringT = 0.8; gullT = 4; passed = 0;
          clouds = []; for (var i = 0; i < 7; i++) clouds.push([Math.random() * api.W, 70 + Math.random() * (api.H - 200), 30 + Math.random() * 40, 0.3 + Math.random() * 0.5]); },
        update: function (dt) {
          if (msgT > 0) msgT -= dt; if (hurtT > 0) hurtT -= dt;
          for (var i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.vy += 300 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          clouds.forEach(function (c) { c[0] -= c[3] * 60 * dt; if (c[0] < -80) { c[0] = api.W + 80; c[1] = 70 + Math.random() * (api.H - 200); } });
          if (!api.playing) return; t += dt; var v = speed();
          vy += (hold ? -560 : 460) * dt; vy = U.clamp(vy, -280, 300); y += vy * dt;
          if (y < top()) { y = top(); vy = Math.max(0, vy); } if (y > bot()) { y = bot(); vy = -160; api.sfx('click'); }
          ringT -= dt; if (ringT <= 0) { var gap = 0.95 + Math.max(0, 0.6 - t * 0.01); ringT = gap; var last = rings.length ? rings[rings.length - 1].y : api.H * 0.45, ny = U.clamp(last + U.rand(-1, 1) * (80 + Math.min(70, t * 1.5)), top() + 50, bot() - 50); rings.push({ x: api.W + 40, y: ny, gold: Math.random() < 0.15, done: false }); }
          gullT -= dt; if (gullT <= 0 && t > 5) { gullT = U.rand(2.2, 4.2) - Math.min(1.2, t * 0.02); gulls.push({ x: api.W + 30, y: U.rand(top() + 20, bot() - 20), ph: Math.random() * 6 }); }
          for (i = rings.length - 1; i >= 0; i--) { var r = rings[i]; r.x -= v * dt;
            if (!r.done && r.x < CX + 4 && r.x > CX - 16) { if (Math.abs(y - r.y) < 34) { r.done = true; r.ok = true; var pts = r.gold ? 3 : 1; api.addScore(pts); passed++; api.sfx(pts > 1 ? 'perfect' : 'point'); burst(r.x, r.y, r.gold ? '#ffd23f' : '#ff4fa0', 12); say(pts > 1 ? 'GOLDEN RING! +3' : ['Wheee!', 'Nice!', 'Swoosh!'][passed % 3], '#fff'); if (passed >= 40 && GA.Prog) GA.Prog.event('ring40'); } }
            if (!r.done && r.x < CX - 16) { r.done = true; hurt('Missed a ring!'); }
            if (r.x < -60) rings.splice(i, 1); }
          for (i = gulls.length - 1; i >= 0; i--) { var gl = gulls[i]; gl.x -= (v + 60) * dt; gl.y += Math.sin(t * 3 + gl.ph) * 30 * dt; if (!gl.hit && Math.abs(gl.x - CX) < 26 && Math.abs(gl.y - y) < 20) { gl.hit = true; hurt('Bonk! A seagull!'); burst(CX, y, '#ffffff', 10); } if (gl.x < -40) gulls.splice(i, 1); }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i;
          var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#38bdf8'); gr.addColorStop(0.7, '#bae6fd'); gr.addColorStop(1, '#f0f9ff'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
          c.fillStyle = '#fef08a'; c.beginPath(); c.arc(W * 0.84, 80, 26, 0, 7); c.fill();
          c.fillStyle = 'rgba(255,255,255,.85)'; clouds.forEach(function (q) { c.beginPath(); c.ellipse(q[0], q[1], q[2], q[2] * 0.45, 0, 0, 7); c.ellipse(q[0] + q[2] * 0.5, q[1] - 8, q[2] * 0.6, q[2] * 0.4, 0, 0, 7); c.fill(); });
          // snowy hills + village roofs scrolling below
          var off = (t * 40) % 160; c.fillStyle = '#86efac'; c.beginPath(); c.moveTo(0, H); for (i = 0; i <= W + 160; i += 20) c.lineTo(i - off, H - 50 - Math.sin((i) / 60) * 16); c.lineTo(W, H); c.closePath(); c.fill();
          c.fillStyle = '#f8fafc'; c.fillRect(0, H - 18, W, 18);
          for (i = 0; i < 6; i++) { var hx = ((i * 140 - t * 70) % (W + 140) + W + 140) % (W + 140) - 70; c.fillStyle = ['#fca5a5', '#fde68a', '#93c5fd'][i % 3]; c.fillRect(hx, H - 44, 34, 26); c.fillStyle = '#ef4444'; c.beginPath(); c.moveTo(hx - 4, H - 44); c.lineTo(hx + 17, H - 60); c.lineTo(hx + 38, H - 44); c.closePath(); c.fill(); }
          // rings: back half, copter, front half
          function ringHalf(r, front) { c.lineWidth = 9; c.strokeStyle = r.ok ? 'rgba(255,255,255,.5)' : r.gold ? '#facc15' : '#ff4fa0'; c.beginPath(); c.ellipse(r.x, r.y, 12, 40, 0, front ? -Math.PI / 2 : Math.PI / 2, front ? Math.PI / 2 : Math.PI * 1.5); c.stroke(); }
          rings.forEach(function (r) { ringHalf(r, false); });
          // Snowie's copter
          c.save(); c.translate(CX, y); c.rotate(U.clamp(vy / 900, -0.3, 0.3)); if (hurtT > 0 && Math.floor(hurtT * 12) % 2) c.globalAlpha = 0.45;
          c.fillStyle = '#334155'; c.fillRect(-36, -3, 26, 5); c.fillStyle = '#ff4fa0'; c.beginPath(); c.ellipse(0, 0, 24, 15, 0, 0, 7); c.fill(); c.fillStyle = '#bae6fd'; c.beginPath(); c.ellipse(9, -3, 11, 9, 0, 0, 7); c.fill();
          c.fillStyle = '#e5e7eb'; c.beginPath(); c.arc(9, -2, 6, 0, 7); c.fill(); c.fillStyle = '#f9a8d4'; c.beginPath(); c.arc(5, -8, 3, 0, 7); c.arc(13, -8, 3, 0, 7); c.fill(); c.fillStyle = '#111'; c.fillRect(10, -3, 2, 2);
          c.fillStyle = '#334155'; c.fillRect(-14, 15, 30, 3); c.fillRect(-1, -20, 3, 6); var bl = Math.abs(Math.sin(t * 30)) * 30 + 6; c.fillRect(-bl, -22, bl * 2, 3); c.fillRect(-40, -8 - Math.sin(t * 30) * 6, 3, 12);
          c.restore(); c.globalAlpha = 1;
          rings.forEach(function (r) { ringHalf(r, true); });
          gulls.forEach(function (gl) { var f = Math.sin(t * 12 + gl.ph) * 7; c.strokeStyle = '#475569'; c.lineWidth = 3; c.beginPath(); c.moveTo(gl.x - 14, gl.y - f); c.quadraticCurveTo(gl.x - 6, gl.y - 8, gl.x, gl.y); c.quadraticCurveTo(gl.x + 6, gl.y - 8, gl.x + 14, gl.y - f); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(gl.x, gl.y + 2, 6, 4, 0, 0, 7); c.fill(); c.fillStyle = '#f59e0b'; c.fillRect(gl.x - 10, gl.y + 1, 5, 2); });
          for (i = 0; i < pops.length; i++) { var q = pops[i]; c.globalAlpha = Math.max(0, q.life / 0.7); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, 4, 0, 7); c.fill(); } c.globalAlpha = 1;
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ff4fa0' : 'rgba(255,255,255,.45)');
          U.text(c, String(api.score), W - 16, 32, 30, '#fff', 'right', '#0369a1'); U.text(c, 'RING DASH', W / 2, 30, 14, '#fff', 'center', '#0369a1');
          if (msgT > 0) U.text(c, msg[0], W / 2, 90, 20, msg[1], 'center', '#0c4a6e');
          if (api.playing && t < 4) U.text(c, api.touch ? 'HOLD to climb, let go to dip!' : 'HOLD mouse or SPACE to climb!', W / 2, H - 30, 17, '#0c4a6e', 'center', '#fff');
        },
        dbg: function () { return { t: t, hearts: hearts, y: Math.round(y), vy: Math.round(vy), rings: rings.map(function (r) { return [Math.round(r.x), Math.round(r.y), r.done]; }), score: api.score, H: api.H }; },
        onDown: function () { hold = true; }, onMove: function () {}, onUp: function () { hold = false; },
        onKey: function (k, dn) { if (k === ' ' || k === 'Space' || k === 'Enter' || k === 'ArrowUp') hold = dn !== false; }
      };
    }
  });
})();
