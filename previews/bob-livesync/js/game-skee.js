/* Grok Arcade - bonus game #11: Skee-Ball. The classic ticket-arcade game!
   Drag up from the ball and let go: a longer drag rolls it harder, and the direction aims it.
   The ball rolls up the lane, hops off the ramp and drops into a ring: 10-50, or the tiny 100 pockets in the top corners.
   9 balls; the last one is GOLDEN and scores double. */
(function () {
  'use strict';
  var U = GA.MG.U;
  var BALLS = 9, CX = 0, CV = 0.72; // board ring centre (u, v)
  var RINGS = [[0.1, 50, '#ffe14d'], [0.2, 40, '#ff4fd8'], [0.31, 30, '#3ff0ff'], [0.43, 20, '#a78bfa'], [0.56, 10, '#4ade80']];
  var POCKETS = [[-0.66, 1.13], [0.66, 1.13]], POCKET_R = 0.1;
  function scoreAt(u, v) {
    if (v > 1.3 || v < 0.05 || Math.abs(u) > 1.0) return 0;
    for (var i = 0; i < 2; i++) if (Math.hypot(u - POCKETS[i][0], v - POCKETS[i][1]) < POCKET_R) return 100;
    var d = Math.hypot(u - CX, v - CV);
    for (var k = 0; k < RINGS.length; k++) if (d < RINGS[k][0]) return RINGS[k][1];
    return 0;
  }
  GA.MG.register({
    id: 'skee', name: 'Skee-Ball', ticketDiv: 20,
    howTouch: 'Drag UP from the ball and let go to roll it. Longer drag = harder roll, tilt your drag to aim. Rings score 10-50, the tiny corner pockets are 100! 9 balls, and the last one is GOLDEN (double points).',
    howKeys: 'Click + drag UP from the ball and let go (longer drag = harder roll), or use \u2190 \u2192 to aim and hold SPACE to power up, release to roll. Corner pockets = 100! 9 balls, the last is GOLDEN (x2).',
    create: function (api) {
      var t, balls, ball, drag, pops, parts, L, last, hits, endT, charge, aimK, msg, hist, cnt100;
      function layout() {
        var W = api.W, H = api.H, top = 64;
        var bw = Math.min(W * 0.9, H * 0.48), bh = bw * 0.82;
        L = { W: W, H: H, cx: W / 2, bTop: top, bBot: top + bh, bHalf: bw / 2, laneTop: top + bh + 6, laneBot: H - 30, ballY: H - 92, topHalf: bw * 0.36, botHalf: Math.min(W * 0.46, bw * 0.62) };
        L.laneLen = L.ballY - L.laneTop; L.br = Math.max(16, Math.min(26, W * 0.055));
      }
      function toScr(u, v) { return { x: L.cx + u * L.bHalf, y: L.bBot - (v / 1.3) * (L.bBot - L.bTop) }; }
      function laneHalf(y) { var k = (y - L.laneTop) / (L.laneBot - L.laneTop); return L.topHalf + (L.botHalf - L.topHalf) * k; }
      // drag (pixels) -> landing spot on the board
      function landFor(dx, dy) { var d = Math.max(1, -dy), p = d / L.laneLen; return { u: U.clamp(dx / d * 1.7, -1.15, 1.15), v: 0.08 + p * 1.05, p: p }; }
      function dragFor(u, v) { var p = (v - 0.08) / 1.05, d = p * L.laneLen; return { dx: u / 1.7 * d, dy: -d }; }
      function pop(x, y, s, c, big) { pops.push({ x: x, y: y, s: s, c: c, l: 1.3, big: !!big }); }
      function burst(x, y, c, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 7, s = U.rand(60, 240); parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, l: U.rand(0.4, 0.9), c: c, sz: U.rand(2, 4.5) }); } }
      function golden() { return balls === BALLS - 1; }
      function roll(dx, dy) {
        if (ball || balls >= BALLS || endT > 0) return;
        var land = landFor(dx, dy);
        if (land.p < 0.08) { msg = { s: 'Drag further up!', l: 1.2 }; return; }
        land.u += U.rand(-0.02, 0.02); land.v += U.rand(-0.02, 0.02);
        ball = { ph: 'roll', k: 0, u: land.u, v: land.v, x: L.cx, y: L.ballY, r: L.br, gold: golden(), dur: 0.85 - Math.min(0.35, land.p * 0.25) };
        api.sfx('click');
      }
      function settle() {
        var pts = scoreAt(ball.u, ball.v), s = toScr(ball.u, ball.v), mult = ball.gold ? 2 : 1;
        hist.push(pts * mult); balls++;
        if (pts > 0) { api.addScore(pts * mult); api.sfx(pts >= 50 ? 'perfect' : 'point'); burst(s.x, s.y, pts === 100 ? '#ffe14d' : '#3ff0ff', pts === 100 ? 30 : 14); pop(s.x, s.y - 20, '+' + pts * mult + (mult > 1 ? ' GOLD!' : ''), pts === 100 ? '#ffe14d' : '#ffffff', pts >= 50); hits++;
          if (pts === 100) { cnt100++; if (GA.Prog) GA.Prog.event('skee100'); } }
        else { api.sfx('miss'); pop(s.x, Math.min(s.y, L.bBot) - 10, ball.v > 1.3 ? 'TOO HARD!' : ball.v < 0.12 ? 'TOO SOFT!' : 'MISS', '#ff6b86'); }
        ball = null;
        if (balls >= BALLS) endT = 1.1;
      }
      var inst = {
        reset: function () { layout(); t = 0; balls = 0; ball = null; drag = null; pops = []; parts = []; hits = 0; endT = 0; charge = null; aimK = 0; msg = null; hist = []; cnt100 = 0; },
        resize: function () { layout(); },
        debug: function () { return { balls: balls, left: BALLS - balls, rolling: !!ball, ready: !ball && balls < BALLS && endT <= 0, ball: { x: L.cx, y: L.ballY, r: L.br }, laneLen: L.laneLen, hist: hist.slice(), golden: golden(), board: { top: L.bTop, bot: L.bBot, half: L.bHalf }, dragFor: { c50: dragFor(CX, CV), p100: dragFor(POCKETS[1][0], POCKETS[1][1]) }, hits: hits, cnt100: cnt100 }; },
        scoreAt: scoreAt,
        update: function (dt) {
          t += dt;
          parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.l -= dt; }); parts = parts.filter(function (p) { return p.l > 0; });
          pops.forEach(function (p) { p.y -= 34 * dt; p.l -= dt; }); pops = pops.filter(function (p) { return p.l > 0; });
          if (msg) { msg.l -= dt; if (msg.l <= 0) msg = null; }
          if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
          if (!api.playing) return;
          if (charge) { charge.t += dt; charge.p = 0.1 + Math.abs(((charge.t * 0.75) % 2) - 1) * 1.15; }
          if (ball) {
            ball.k += dt / (ball.ph === 'roll' ? ball.dur : ball.ph === 'fly' ? 0.38 : 0.3);
            var e = Math.min(1, ball.k);
            if (ball.ph === 'roll') {
              var y = L.ballY + (L.laneTop - L.ballY) * (1 - Math.pow(1 - e, 1.6)), uLane = ball.u * 0.55 * e;
              ball.x = L.cx + uLane * laneHalf(y); ball.y = y; ball.r = L.br * (0.62 + 0.38 * (1 - e));
              if (e >= 1) { ball.ph = 'fly'; ball.k = 0; ball.fx = ball.x; ball.fy = ball.y; }
            } else if (ball.ph === 'fly') {
              var to = toScr(U.clamp(ball.u, -1.1, 1.1), Math.min(ball.v, 1.36)), arc = Math.sin(e * Math.PI) * 50;
              ball.x = ball.fx + (to.x - ball.fx) * e; ball.y = ball.fy + (to.y - ball.fy) * e - arc; ball.r = L.br * (0.62 - 0.1 * e) * (1 + Math.sin(e * Math.PI) * 0.25);
              if (e >= 1) { ball.ph = 'drop'; ball.k = 0; }
            } else { ball.r = L.br * 0.52 * (1 - e * 0.7); if (e >= 1) settle(); }
          }
        },
        onDown: function (x, y) { if (ball || balls >= BALLS) return; drag = { x0: x, y0: y, x: x, y: y }; },
        onMove: function (x, y, isDown) { if (!drag) return; if (!isDown) { inst.onUp(x, y); return; } drag.x = x; drag.y = y; },
        onUp: function (x, y) { if (!drag) return; var d = drag; drag = null; if (x != null) { d.x = x; d.y = y; } if (d.y0 - d.y > 12) roll(d.x - d.x0, d.y - d.y0); },
        onKey: function (k, down) {
          if (k === 'ArrowLeft' && down) aimK = U.clamp(aimK - 0.12, -1, 1);
          else if (k === 'ArrowRight' && down) aimK = U.clamp(aimK + 0.12, -1, 1);
          else if ((k === ' ' || k === 'ArrowUp') && down && !charge && !ball) charge = { t: 0, p: 0.1 };
          else if ((k === ' ' || k === 'ArrowUp') && !down && charge) { var p = charge.p, d = p * L.laneLen; charge = null; roll(aimK / 1.7 * d * 1.1, -d); }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i, S = Math.min(1.25, W / 390);
          var bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1a0838'); bg.addColorStop(1, '#0b0420'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
          // board (wood frame + backboard)
          var bx = L.cx - L.bHalf - 14, bw = L.bHalf * 2 + 28;
          c.fillStyle = '#5a3418'; U.rr(c, bx, L.bTop - 14, bw, L.bBot - L.bTop + 26, 16); c.fill();
          var bb = c.createLinearGradient(0, L.bTop, 0, L.bBot); bb.addColorStop(0, '#2b1460'); bb.addColorStop(1, '#3d1d7a'); c.fillStyle = bb; U.rr(c, bx + 10, L.bTop - 4, bw - 20, L.bBot - L.bTop + 6, 10); c.fill();
          // rings (outer first)
          var cen = toScr(CX, CV), sc = L.bHalf, vk = (L.bBot - L.bTop) / 1.3;
          for (i = RINGS.length - 1; i >= 0; i--) {
            var R = RINGS[i], rx = R[0] * sc, ry = R[0] * vk;
            c.fillStyle = i % 2 ? '#1a0b38' : '#24104a'; c.beginPath(); c.ellipse(cen.x, cen.y, rx, ry, 0, 0, 7); c.fill();
            c.strokeStyle = R[2]; c.shadowColor = R[2]; c.shadowBlur = 10; c.lineWidth = 3.5; c.stroke(); c.shadowBlur = 0;
            var ly = i === 0 ? cen.y : cen.y + (RINGS[i][0] + (i ? RINGS[i - 1][0] : 0)) / 2 * vk;
            U.text(c, String(R[1]), cen.x, ly, (i === 0 ? 17 : 14) * S, R[2]);
          }
          POCKETS.forEach(function (q) { var p = toScr(q[0], q[1]), pr = POCKET_R * sc; c.fillStyle = '#0a0418'; c.beginPath(); c.ellipse(p.x, p.y, pr, POCKET_R * vk, 0, 0, 7); c.fill(); c.strokeStyle = '#ffe14d'; c.shadowColor = '#ffe14d'; c.shadowBlur = 12 + Math.sin(t * 6) * 6; c.lineWidth = 3.5; c.stroke(); c.shadowBlur = 0; U.text(c, '100', p.x, p.y, 13 * S, '#ffe14d'); });
          // lane
          var lt = L.laneTop, lb = L.laneBot;
          var lg = c.createLinearGradient(0, lt, 0, lb); lg.addColorStop(0, '#6b3d1c'); lg.addColorStop(1, '#a8652d'); c.fillStyle = lg;
          c.beginPath(); c.moveTo(L.cx - L.topHalf, lt); c.lineTo(L.cx + L.topHalf, lt); c.lineTo(L.cx + L.botHalf, lb); c.lineTo(L.cx - L.botHalf, lb); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 1; for (i = 1; i < 6; i++) { var fk = i / 6; c.beginPath(); c.moveTo(L.cx - L.topHalf + fk * L.topHalf * 2, lt); c.lineTo(L.cx - L.botHalf + fk * L.botHalf * 2, lb); c.stroke(); }
          [-1, 1].forEach(function (sd) { c.strokeStyle = sd < 0 ? '#ff4fd8' : '#3ff0ff'; c.shadowColor = c.strokeStyle; c.shadowBlur = 10; c.lineWidth = 5; c.beginPath(); c.moveTo(L.cx + sd * L.topHalf, lt); c.lineTo(L.cx + sd * L.botHalf, lb); c.stroke(); c.shadowBlur = 0; });
          // the hump (ramp) at the top of the lane
          var hg = c.createLinearGradient(0, lt - 4, 0, lt + 22); hg.addColorStop(0, '#ffcf8a'); hg.addColorStop(1, '#8a4f22'); c.fillStyle = hg;
          c.beginPath(); c.moveTo(L.cx - L.topHalf, lt + 20); c.quadraticCurveTo(L.cx, lt - 18, L.cx + L.topHalf, lt + 20); c.closePath(); c.fill();
          // aim guide while dragging / charging
          var guide = null;
          if (drag && drag.y0 - drag.y > 6) guide = landFor(drag.x - drag.x0, drag.y - drag.y0);
          if (charge) guide = { u: aimK, v: 0.08 + charge.p * 1.05, p: charge.p };
          if (!drag && !charge && !ball && api.playing && !api.touch) guide = null;
          if (guide) {
            var gs = toScr(U.clamp(guide.u * 0.9, -1, 1), Math.min(guide.v, 1.3)); c.save(); c.setLineDash([8, 10]); c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 3; c.beginPath(); c.moveTo(L.cx, L.ballY); c.quadraticCurveTo(L.cx + guide.u * 0.3 * L.topHalf, L.laneTop, gs.x, gs.y); c.stroke(); c.restore();
            // power meter
            var mh = L.laneLen * 0.7, mx = W - 26, my = L.ballY - mh + 20, pk = U.clamp(guide.p / 1.2, 0, 1);
            c.fillStyle = 'rgba(255,255,255,0.12)'; U.rr(c, mx - 9, my, 18, mh, 9); c.fill();
            var col = guide.v > 1.3 ? '#ff4f6a' : guide.v > 1.0 ? '#ffe14d' : '#4ade80'; c.fillStyle = col; U.rr(c, mx - 9, my + mh * (1 - pk), 18, mh * pk, 9); c.fill();
            U.text(c, 'POWER', mx - 4, my - 14, 12, '#fff');
          }
          if (!api.touch && api.playing && !drag && !ball) { var ax = L.cx + aimK * 60; c.fillStyle = 'rgba(255,225,77,0.8)'; c.beginPath(); c.moveTo(ax, L.ballY - L.br - 26); c.lineTo(ax - 8, L.ballY - L.br - 12); c.lineTo(ax + 8, L.ballY - L.br - 12); c.fill(); }
          // waiting ball
          function drawBall(x, y, r, gold) { var g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); if (gold) { g.addColorStop(0, '#fff8c0'); g.addColorStop(0.5, '#ffcf3a'); g.addColorStop(1, '#a8740a'); c.shadowColor = '#ffe14d'; c.shadowBlur = 16; } else { g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#d9c6ff'); g.addColorStop(1, '#6a4aa8'); } c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.shadowBlur = 0; }
          if (!ball && balls < BALLS) { var bob = Math.sin(t * 3) * 2; drawBall(L.cx + (drag ? U.clamp((drag.x - drag.x0) * 0.15, -20, 20) : 0), L.ballY + bob + (drag ? U.clamp((drag.y - drag.y0) * -0.05, -6, 0) : 0), L.br, golden()); }
          if (ball) drawBall(ball.x, ball.y, ball.r, ball.gold);
          // balls left
          for (i = 0; i < BALLS; i++) { var used = i < balls, gx = L.cx - (BALLS - 1) * 9 + i * 18, gy = H - 14; c.globalAlpha = used ? 0.2 : 1; drawBall(gx, gy, 6.5, i === BALLS - 1); } c.globalAlpha = 1;
          parts.forEach(function (p) { c.globalAlpha = Math.max(0, p.l / 0.9); c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, p.sz, 0, 7); c.fill(); }); c.globalAlpha = 1;
          pops.forEach(function (p) { c.globalAlpha = Math.min(1, p.l * 1.5); U.text(c, p.s, p.x, p.y, (p.big ? 30 : 24) * S, p.c, 'center', '#000'); }); c.globalAlpha = 1;
          U.text(c, 'SKEE-BALL', 14, 26, 18, '#ffe14d', 'left');
          U.text(c, 'BALL ' + Math.min(BALLS, balls + 1) + '/' + BALLS + (golden() && balls < BALLS ? ' \u2605 GOLD x2' : ''), 14, 48, 14, golden() ? '#ffe14d' : '#cdbdff', 'left');
          U.text(c, String(api.score), W - 16, 32, 30, '#fff', 'right', 'rgba(0,0,0,0.4)');
          if (msg) U.text(c, msg.s, W / 2, L.ballY - 70, 22 * S, '#ffe14d', 'center', '#000');
          else if (api.playing && balls === 0 && !ball && !drag) U.text(c, api.touch ? 'Drag UP from the ball \u2191' : 'Drag UP from the ball, or hold SPACE', W / 2, L.ballY - 70, 20 * S, '#ffe14d', 'center', '#000');
        }
      };
      return inst;
    }
  });
})();
