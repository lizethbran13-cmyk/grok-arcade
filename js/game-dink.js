/* Grok Arcade - bonus game #18: Dink Duel (Grok Pickleball tie-in).
   You stand at the kitchen line; the CPU dinks soft shots over the net. The yellow ring shows where the ball will bounce.
   Pickleball rule: in the kitchen you must LET IT BOUNCE. TAP after the bounce to dink it back (tap near the top of the hop = PERFECT +3, else +1).
   Tap before the bounce = KITCHEN FAULT (lose a heart). Let it bounce twice = miss (lose a heart). Gold balls count double. 3 hearts, it speeds up! */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'dink', name: 'Dink Duel', ticketDiv: 3,
    howTouch: 'The CPU dinks the ball over the net. Pickleball rule: in the kitchen you must LET IT BOUNCE! TAP anywhere right after it bounces to dink it back. Tap at the top of the hop for PERFECT (+3). Tap before the bounce = KITCHEN FAULT. Let it bounce twice = miss. 3 hearts, gold balls count double!',
    howKeys: 'The CPU dinks the ball over the net. Pickleball rule: in the kitchen you must LET IT BOUNCE! Press SPACE (or click) right after it bounces to dink it back. Hit it at the top of the hop for PERFECT (+3). Swing before the bounce = KITCHEN FAULT. Let it bounce twice = miss. 3 hearts, gold balls count double!',
    create: function (api) {
      var t, hearts, ball, pops, msg, msgT, rally, perfects, swingT, cpuSwing, wait, L = {};
      function layout() { var W = api.W, H = api.H; L.top = Math.max(90, H * 0.16); L.bot = H - Math.max(70, H * 0.1); L.net = L.top + (L.bot - L.top) * 0.42; L.kit = L.net + (L.bot - L.top) * 0.2; L.cx = W / 2; L.wt = Math.min(W * 0.34, 170); L.wb = Math.min(W * 0.47, 250); }
      function lv() { return Math.min(1, rally / 30 + t / 150); }
      // court coords: u in [-1,1] across, v in [0,1] from the CPU's baseline (0) to yours (1); screen mapping with a bit of perspective
      function sx(u, v) { return L.cx + u * (L.wt + (L.wb - L.wt) * v); }
      function sy(v) { return L.top + (L.bot - L.top) * v; }
      function say(s, col) { msg = [s, col]; msgT = 1.1; }
      function serve() {
        var k = lv(), u0 = (Math.random() - 0.5) * 0.6, u1 = (Math.random() - 0.5) * 1.3;
        ball = { st: 'in', u0: u0, u1: u1, v0: 0.18, v1: 0.6 + Math.random() * 0.12, T1: 1.05 - k * 0.45, T2: 0.9 - k * 0.35, ht: 60 + Math.random() * 30, h2: 34 + Math.random() * 14, t: 0, gold: Math.random() < 0.12 };
        cpuSwing = 0.25; api.sfx('boop');
      }
      function pos() {
        var b = ball; if (!b) return null;
        if (b.st === 'in') { var k = b.t / b.T1; return { u: b.u0 + (b.u1 - b.u0) * k, v: b.v0 + (b.v1 - b.v0) * k, h: Math.sin(Math.PI * k) * b.ht }; }
        if (b.st === 'hop') { var k2 = b.t / b.T2; return { u: b.u1, v: b.v1 + 0.24 * k2, h: Math.sin(Math.PI * k2) * b.h2 }; }
        var k3 = b.t / 0.55; return { u: b.ru + (b.tu - b.ru) * k3, v: b.rv + (0.2 - b.rv) * k3, h: Math.sin(Math.PI * k3) * 70 };
      }
      function lose(text) { hearts--; rally = 0; api.sfx('lifelost'); say(text, '#ff6b6b'); ball = null; wait = 1.1; if (hearts <= 0) api.gameOver(); }
      function swing() {
        if (!api.playing || !ball || swingT > 0.15) return; swingT = 0.3; var b = ball;
        if (b.st === 'in') { if (b.t / b.T1 > 0.55) lose('KITCHEN FAULT! Let it bounce \uD83D\uDEAB'); else { api.sfx('miss'); swingT = 0.3; } return; }
        if (b.st !== 'hop') return;
        var k = b.t / b.T2, perfect = Math.abs(k - 0.5) < 0.17, pts = (perfect ? 3 : 1) * (b.gold ? 2 : 1), p = pos();
        api.addScore(pts); rally++; if (perfect) perfects++;
        api.sfx(perfect ? 'perfect' : 'point'); say((perfect ? 'PERFECT DINK! +' : 'Nice! +') + pts, perfect ? '#ffe14d' : '#7dd3fc');
        burst(sx(p.u, p.v), sy(p.v) - p.h, b.gold ? '#ffd23f' : '#e6ff3b');
        if (rally > 0 && rally % 10 === 0) say(rally + ' RALLY! \uD83D\uDD25', '#ff8fd0');
        if (perfects >= 5 && GA.Prog) GA.Prog.event('dinkPerfect5');
        ball = { st: 'out', ru: p.u, rv: p.v, tu: (Math.random() - 0.5) * 1.2, t: 0, gold: b.gold };
      }
      function burst(x, y, col) { for (var i = 0; i < 12; i++) { var a = Math.random() * 6.28, s = 60 + Math.random() * 120; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.6, col: col }); } }
      function person(c, x, y, s, shirt, hat, back) {
        c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(x, y + 2, 16 * s, 6 * s, 0, 0, 7); c.fill();
        c.fillStyle = '#1f2937'; U.rr(c, x - 9 * s, y - 22 * s, 7 * s, 22 * s, 3 * s); c.fill(); U.rr(c, x + 2 * s, y - 22 * s, 7 * s, 22 * s, 3 * s); c.fill();
        c.fillStyle = shirt; U.rr(c, x - 13 * s, y - 50 * s, 26 * s, 32 * s, 10 * s); c.fill();
        c.fillStyle = '#f1c7a5'; c.beginPath(); c.arc(x, y - 62 * s, 12 * s, 0, 7); c.fill();
        c.fillStyle = hat; c.beginPath(); c.arc(x, y - 65 * s, 12.5 * s, Math.PI, 0); c.fill(); c.fillRect(x - (back ? 14 : 4) * s, y - 66 * s, 18 * s, 3 * s);
        if (!back) { c.fillStyle = '#16101f'; c.beginPath(); c.arc(x - 4 * s, y - 61 * s, 1.8 * s, 0, 7); c.arc(x + 4 * s, y - 61 * s, 1.8 * s, 0, 7); c.fill(); }
      }
      function paddle(c, x, y, s, ang, col) { c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = '#3b2a1a'; c.fillRect(-2 * s, 0, 4 * s, 12 * s); c.fillStyle = col; U.rr(c, -9 * s, -22 * s, 18 * s, 23 * s, 8 * s); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke(); c.restore(); }
      return {
        reset: function () { layout(); t = 0; hearts = 3; ball = null; pops = []; msgT = 0; rally = 0; perfects = 0; swingT = 0; cpuSwing = 0; wait = 1.0; },
        resize: function () { layout(); },
        update: function (dt) {
          if (msgT > 0) msgT -= dt; if (swingT > 0) swingT -= dt; if (cpuSwing > 0) cpuSwing -= dt;
          for (var i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.vy += 300 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          if (!api.playing) return; t += dt;
          if (!ball) { wait -= dt; if (wait <= 0) serve(); return; }
          var b = ball; b.t += dt;
          if (b.st === 'in' && b.t >= b.T1) { b.st = 'hop'; b.t = 0; api.sfx('drop'); }
          else if (b.st === 'hop' && b.t >= b.T2) lose('Missed! It bounced twice');
          else if (b.st === 'out' && b.t >= 0.55) { ball = null; wait = 0.12; }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i;
          var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#7dd3fc'); gr.addColorStop(0.25, '#bbf7d0'); gr.addColorStop(1, '#4ade80'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
          // court
          c.fillStyle = '#2563eb'; c.beginPath(); c.moveTo(sx(-1, 0), sy(0)); c.lineTo(sx(1, 0), sy(0)); c.lineTo(sx(1, 1), sy(1)); c.lineTo(sx(-1, 1), sy(1)); c.closePath(); c.fill();
          var kv0 = (L.net - L.top) / (L.bot - L.top) - 0.2, kv1 = (L.kit - L.top) / (L.bot - L.top), nv = (L.net - L.top) / (L.bot - L.top);
          c.fillStyle = '#16a34a'; [[kv0, nv], [nv, kv1]].forEach(function (z) { c.beginPath(); c.moveTo(sx(-1, z[0]), sy(z[0])); c.lineTo(sx(1, z[0]), sy(z[0])); c.lineTo(sx(1, z[1]), sy(z[1])); c.lineTo(sx(-1, z[1]), sy(z[1])); c.closePath(); c.fill(); });
          c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(sx(-1, 0), sy(0)); c.lineTo(sx(1, 0), sy(0)); c.lineTo(sx(1, 1), sy(1)); c.lineTo(sx(-1, 1), sy(1)); c.closePath();
          [kv0, kv1].forEach(function (v) { c.moveTo(sx(-1, v), sy(v)); c.lineTo(sx(1, v), sy(v)); }); c.moveTo(sx(0, 0), sy(0)); c.lineTo(sx(0, kv0), sy(kv0)); c.moveTo(sx(0, kv1), sy(kv1)); c.lineTo(sx(0, 1), sy(1)); c.stroke();
          U.text(c, 'KITCHEN', L.cx, sy((nv + kv1) / 2) + 5, 13, 'rgba(255,255,255,.55)');
          // CPU
          var cu = ball && ball.st === 'in' ? ball.u0 : ball && ball.st === 'out' ? ball.tu : 0;
          person(c, sx(cu, 0.17), sy(0.17), 0.75, '#e11d48', '#fbbf24', false); paddle(c, sx(cu, 0.17) + 14, sy(0.17) - 30, 0.75, cpuSwing > 0 ? 0.8 : 0.2, '#f97316');
          // net
          c.fillStyle = 'rgba(15,23,42,.55)'; c.fillRect(sx(-1.08, nv), sy(nv) - 22, sx(1.08, nv) - sx(-1.08, nv), 22); c.fillStyle = '#fff'; c.fillRect(sx(-1.08, nv), sy(nv) - 24, sx(1.08, nv) - sx(-1.08, nv), 4);
          c.fillStyle = '#334155'; c.fillRect(sx(-1.08, nv) - 3, sy(nv) - 28, 5, 30); c.fillRect(sx(1.08, nv) - 2, sy(nv) - 28, 5, 30);
          var p = pos(), b = ball;
          // landing ring (Assist-style)
          if (b && b.st === 'in') { var rx = sx(b.u1, b.v1), ry = sy(b.v1), pul = 1 + Math.sin(t * 12) * 0.1; c.strokeStyle = '#ffe14d'; c.lineWidth = 3; c.beginPath(); c.ellipse(rx, ry, 16 * pul, 6 * pul, 0, 0, 7); c.stroke(); }
          // you (back to the camera), follow the ball's lane
          var yu = b ? (b.st === 'out' ? b.ru : b.u1) : 0; L.yu = L.yu == null ? 0 : L.yu + (yu - L.yu) * 0.15;
          var px = sx(L.yu, 0.93) - 14, pyy = sy(0.93);
          // ball shadow + ball
          if (p) { var bx = sx(p.u, p.v), by = sy(p.v); c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(bx, by, 8, 3, 0, 0, 7); c.fill(); }
          person(c, px, pyy, 1, '#3b82f6', '#1d4ed8', true);
          paddle(c, px + 22, pyy - 40, 1, swingT > 0 ? -0.9 + swingT * 2 : -0.2, '#22c55e');
          if (p) { var bx2 = sx(p.u, p.v), by2 = sy(p.v) - p.h, r = 7 + p.v * 4; c.fillStyle = b.gold ? '#ffd23f' : '#e6ff3b'; c.beginPath(); c.arc(bx2, by2, r, 0, 7); c.fill(); c.fillStyle = 'rgba(0,0,0,.25)'; [[-0.35, -0.2], [0.3, -0.3], [0, 0.35]].forEach(function (d) { c.beginPath(); c.arc(bx2 + d[0] * r, by2 + d[1] * r, r * 0.17, 0, 7); c.fill(); });
            if (b.st === 'hop') { var k = b.t / b.T2, ok = Math.abs(k - 0.5) < 0.17; c.strokeStyle = ok ? '#4ade80' : 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.beginPath(); c.arc(bx2, by2, r + 6 + (ok ? 0 : Math.abs(k - 0.5) * 30), 0, 7); c.stroke(); } }
          for (i = 0; i < pops.length; i++) { var q = pops[i]; c.globalAlpha = Math.max(0, q.life / 0.6); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, 5, 0, 7); c.fill(); } c.globalAlpha = 1;
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ff4f8b' : 'rgba(255,255,255,.4)');
          U.text(c, String(api.score), W - 16, 30, 30, '#fff', 'right', '#000');
          if (rally >= 3) U.text(c, 'RALLY ' + rally, W - 16, 60, 16, '#fff', 'right', '#000');
          if (msgT > 0) U.text(c, msg[0], W / 2, Math.max(60, L.top - 20), 22, msg[1], 'center', '#000');
          if (api.playing && t < 4) U.text(c, api.touch ? 'Let it BOUNCE, then TAP!' : 'Let it BOUNCE, then SPACE!', W / 2, H - 28, 18, '#fff', 'center', '#000');
        },
        dbg: function () { return { t: t, hearts: hearts, rally: rally, perfects: perfects, ball: ball ? { st: ball.st, k: ball.st === 'hop' ? ball.t / ball.T2 : ball.st === 'in' ? ball.t / ball.T1 : ball.t / 0.55 } : null }; },
        onDown: function () { swing(); },
        onKey: function (k, down) { if (down && (k === ' ' || k === 'Space' || k === 'space' || k === 'Enter' || k === 'ArrowUp')) swing(); }
      };
    }
  });
})();
