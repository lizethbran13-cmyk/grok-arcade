/* Grok Arcade - bonus game #7: Penalty Kick. 5 shots at a goalie: tap a spot in the goal (or swipe from the ball).
   Corners are hardest to save; the goalie gets smarter each shot. 1 point per goal, +1 for a top-corner goal.
   Fairness rule: the result always matches what you see. It is only SAVED if the goalie's drawn body/gloves
   actually touch the ball where it crosses the line (same geometry is used to draw him and to check the save). */
(function () {
  'use strict';
  var U = GA.MG.U;
  var BALL_R = 9, POST = 3.5, FLIGHT = 0.5;
  GA.MG.register({
    id: 'penalty', name: 'Penalty Kick', ticketDiv: 1,
    howTouch: 'Tap where you want to shoot inside the goal (or swipe from the ball). Beat the goalie! 5 shots. Top corners score a bonus point.',
    howKeys: 'Click a spot in the goal, or move the aim with \u2190 \u2192 \u2191 \u2193 and press SPACE to shoot. Beat the goalie! 5 shots. Top corners score a bonus point.',
    create: function (api) {
      var shots, results, shot, keeper, aim, popT, popS, popC, popBig, waitT, endT, t = 0, G, sw, fx, rip, last;
      function layout() {
        var W = api.W, H = api.H, gw = Math.min(W * 0.84, 560), gh = gw * 0.38;
        G = { x: (W - gw) / 2, y: Math.max(96, H * 0.2), w: gw, h: gh, bx: W / 2, by: H - Math.max(70, H * 0.14) };
      }
      function resetKeeper() { keeper = { x: G.x + G.w / 2, tx: G.x + G.w / 2, dive: 0, dir: 0, ang: 0, L: 0, wob: Math.random() * 6 }; }

      // ---- goalie shape (shared by drawing AND the save check) ----
      function kh() { return G.h * 0.62; }
      function pose() { // world transform: world = K + R(a) * (local + (0, -lift))
        return { kx: keeper.x, ky: G.y + G.h, a: keeper.dir * keeper.ang * keeper.dive, lift: keeper.L * keeper.dive, d: keeper.dive };
      }
      function parts(d) { // local coords, feet at (0,0), up = -y
        var h = kh(), gy = -h * 1.12 - d * 10, ay = -h * 1.1 - d * 10;
        return {
          rects: [{ x0: -16, y0: -h, x1: 16, y1: -h + h * 0.62, r: 8 }, { x0: -14, y0: -h * 0.4, x1: 14, y1: -h * 0.22, r: 0 }],
          segs: [{ ax: -14, ay: -h * 0.9, bx: -38, by: ay, r: 4.5 }, { ax: 14, ay: -h * 0.9, bx: 38, by: ay, r: 4.5 },
                 { ax: -8, ay: -h * 0.22, bx: -12, by: 0, r: 4 }, { ax: 8, ay: -h * 0.22, bx: 12, by: 0, r: 4 }],
          circs: [{ x: -40, y: gy, r: 10 }, { x: 40, y: gy, r: 10 }, { x: 0, y: -h - 12, r: 13 }]
        };
      }
      function toLocal(P, x, y) { var dx = x - P.kx, dy = y - P.ky, c = Math.cos(-P.a), s = Math.sin(-P.a); return { x: dx * c - dy * s, y: dx * s + dy * c + P.lift }; }
      function toWorld(P, x, y) { y -= P.lift; var c = Math.cos(P.a), s = Math.sin(P.a); return { x: P.kx + x * c - y * s, y: P.ky + x * s + y * c }; }
      function segDist(px, py, s) { var vx = s.bx - s.ax, vy = s.by - s.ay, l2 = vx * vx + vy * vy, k = l2 ? U.clamp(((px - s.ax) * vx + (py - s.ay) * vy) / l2, 0, 1) : 0; return Math.hypot(px - s.ax - vx * k, py - s.ay - vy * k) - s.r; }
      function rectDist(px, py, r) { var cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2, hx = (r.x1 - r.x0) / 2 - r.r, hy = (r.y1 - r.y0) / 2 - r.r, qx = Math.abs(px - cx) - hx, qy = Math.abs(py - cy) - hy; return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r.r; }
      function keeperGap(x, y) { // distance from ball edge to the nearest bit of goalie (<= 0 means touching)
        var P = pose(), q = toLocal(P, x, y), S = parts(P.d), m = 1e9, i;
        for (i = 0; i < S.rects.length; i++) m = Math.min(m, rectDist(q.x, q.y, S.rects[i]));
        for (i = 0; i < S.segs.length; i++) m = Math.min(m, segDist(q.x, q.y, S.segs[i]));
        for (i = 0; i < S.circs.length; i++) m = Math.min(m, Math.hypot(q.x - S.circs[i].x, q.y - S.circs[i].y) - S.circs[i].r);
        return m - BALL_R;
      }
      // plan a dive so the leading glove ends up at (gx, gy) - he can only save what his gloves/body really reach
      function planDive(gx, gy) {
        var h = kh(), Hg = h * 1.12 + 10, R = Math.hypot(Hg, 40), phi = Math.atan2(40, Hg);
        var ky = G.y + G.h, ht = U.clamp(ky - gy, 0, G.h * 1.05), dx = gx - keeper.x;
        if (Math.abs(dx) < G.w * 0.06) { keeper.dir = 0; keeper.ang = 0; keeper.L = U.clamp(ht - h * 0.8, 0, G.h * 0.45); keeper.tx = gx; return; }
        var dir = Math.sign(dx), a = U.clamp(Math.acos(Math.min(1, ht / R)) - phi, 0.3, 1.2);
        function liftFor(a) { return U.clamp((ht + 40 * Math.sin(a)) / Math.cos(a) - Hg, 0, G.h * 0.45); }
        function reachFor(a) { return 40 * Math.cos(a) + (Hg + liftFor(a)) * Math.sin(a); }
        if (reachFor(a) > Math.abs(dx)) { // close guess: no big dive (feet never cross the middle)
          if (ht < h) { keeper.dir = dir; keeper.ang = 0.12; keeper.L = 0; keeper.tx = gx; return; } // shuffle across, body behind the ball
          var lo = 0, hi = a; for (var i = 0; i < 18; i++) { var m = (lo + hi) / 2; if (reachFor(m) > Math.abs(dx)) hi = m; else lo = m; } a = lo; // high: small lean + jump
        }
        var L = liftFor(a);
        keeper.dir = dir; keeper.ang = a; keeper.L = L;
        keeper.tx = U.clamp(gx - dir * reachFor(a), G.x + 14, G.x + G.w - 14);
      }
      function kick(tx, ty) {
        if (!api.playing || shot || waitT > 0 || shots >= 5) return;
        shot = { sx: G.bx, sy: G.by, tx: tx, ty: ty, t: 0 };
        // goalie guesses: smarter every shot. Even a good guess can fall short at the corners.
        var smart = 0.2 + shots * 0.07, cx = G.x + G.w / 2, gx, gy;
        var ox = U.clamp(tx, G.x + 4, G.x + G.w - 4), oy = U.clamp(ty, G.y + 4, G.y + G.h - 2);
        if (Math.random() < smart) {
          var side = Math.abs(ox - cx) / (G.w / 2), top = 1 - (oy - G.y) / G.h; // 0..1
          var corner = Math.max(0, side - 0.45) / 0.55, short = corner * (0.35 + 0.65 * top) * Math.random();
          gx = ox - Math.sign(ox - cx) * short * G.w * 0.2; gy = oy + short * G.h * 0.35;
        } else { // wrong-ish guess: usually commits to a side, sometimes stays big in the middle
          var side2 = Math.random(); gx = side2 < 0.1 ? cx + (Math.random() - 0.5) * G.w * 0.1 : cx + (side2 < 0.55 ? -1 : 1) * G.w * (0.24 + Math.random() * 0.22); gy = G.y + G.h * (0.15 + Math.random() * 0.8); }
        planDive(gx, gy);
        api.sfx('click');
      }
      function burst(x, y, n, cols, sp) { for (var i = 0; i < n; i++) { var a = Math.random() * Math.PI * 2, v = sp * (0.4 + Math.random()); fx.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.5, life: 1.4 + Math.random() * 0.9, c: cols[i % cols.length], s: 7 + Math.random() * 6, rot: Math.random() * 6 }); } }
      function resolve() {
        var s = shot, inGoal = s.tx > G.x + POST && s.tx < G.x + G.w - POST && s.ty > G.y + POST && s.ty < G.y + G.h;
        var frame = !inGoal && ((Math.abs(s.tx - G.x) < POST + BALL_R || Math.abs(s.tx - G.x - G.w) < POST + BALL_R) && s.ty > G.y - BALL_R && s.ty < G.y + G.h || Math.abs(s.ty - G.y) < POST + BALL_R && s.tx > G.x - BALL_R && s.tx < G.x + G.w + BALL_R);
        var gap = keeperGap(s.tx, s.ty), saved = inGoal && gap <= 0;
        var pts = 0, res;
        last = { x: s.tx, y: s.ty, gap: gap, inGoal: inGoal, pose: pose() };
        s.vx = (s.tx - s.sx) * 0.6; s.vy = (s.ty - s.sy) * 0.6;
        if (!inGoal) { res = 'miss'; popS = frame ? 'OFF THE POST!' : (s.ty <= G.y ? 'OVER THE BAR!' : 'WIDE!'); popC = '#ff3b4f'; api.sfx('miss'); if (frame) { s.vx = -s.vx * 0.5; s.vy = 260; } }
        else if (saved) {
          res = 'save'; popS = 'SAVED!'; popC = '#ff8a3d'; api.sfx('buzz');
          var P = pose(), c = toWorld(P, 0, -kh() * 0.6); // parry away from his body
          var ax = s.tx - c.x, ay = s.ty - c.y, l = Math.hypot(ax, ay) || 1; s.vx = ax / l * 420; s.vy = Math.abs(ay / l) * 200 + 160;
          burst(s.tx, s.ty, 10, ['#fff', '#ffe14d'], 160);
        } else {
          pts = 1; var corner = s.ty < G.y + G.h * 0.38 && (s.tx < G.x + G.w * 0.22 || s.tx > G.x + G.w * 0.78);
          if (corner) pts = 2;
          res = 'goal'; popS = corner ? 'TOP BINS! +2' : 'GOAL!'; popC = '#3bff7a'; api.sfx(corner ? 'perfect' : 'point');
          api.addScore(pts);
          s.vx = 0; s.vy = 0; rip = { x: s.tx, y: s.ty, t: 0 };
          burst(s.tx, s.ty, 70, ['#3bff7a', '#ffe14d', '#ff4fd8', '#3ff0ff', '#fff'], 240);
          burst(G.x + 8, G.y + G.h, 25, ['#3bff7a', '#ffe14d', '#fff'], 260); burst(G.x + G.w - 8, G.y + G.h, 25, ['#ff4fd8', '#3ff0ff', '#fff'], 260);
        }
        results.push(res); last.res = res; last.pts = pts;
        popBig = res === 'goal'; popT = popBig ? 1.6 : 1.1; shots++; shot.done = true; shot.post = 0; shot.res = res; waitT = popBig ? 1.5 : 1.0;
        if (shots >= 5) endT = waitT + 0.2;
      }
      var inst = {
        reset: function () { layout(); shots = 0; results = []; shot = null; popT = 0; waitT = 0; endT = 0; fx = []; rip = null; last = null; aim = { x: G.x + G.w * 0.5, y: G.y + G.h * 0.5 }; resetKeeper(); sw = null; },
        resize: function () { layout(); resetKeeper(); },
        debug: function () { return { ready: !shot && waitT <= 0 && shots < 5, shots: shots, results: results.slice(), goal: { x: G.x, y: G.y, w: G.w, h: G.h }, ball: { x: G.bx, y: G.by }, keeper: { x: keeper.x, tx: keeper.tx, dir: keeper.dir, dive: keeper.dive, ang: keeper.ang, L: keeper.L }, flying: !!(shot && !shot.done), aim: aim, last: last, fx: fx.length, celebrating: !!(popT > 0 && popBig), score: api.score, ballR: BALL_R }; },
        // test hook: paint ONLY the goalie with the real drawing code (to compare the save check against actual pixels)
        maskKeeper: function (c, col) { drawKeeper(c, col); },
        gapAt: function (x, y) { return keeperGap(x, y); },
        update: function (dt) {
          t += dt; if (popT > 0) popT -= dt;
          for (var i = fx.length - 1; i >= 0; i--) { var p = fx[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.vx *= 0.985; p.vy *= 0.985; p.rot += dt * 8; p.life -= dt; if (p.life <= 0) fx.splice(i, 1); }
          if (rip) { rip.t += dt; if (rip.t > 1.2) rip = null; }
          // idle keeper sways, diving keeper moves toward his planned spot
          if (!shot) { keeper.x = G.x + G.w / 2 + Math.sin(t * 2 + keeper.wob) * G.w * 0.08; }
          else if (!shot.done) { var d = keeper.tx - keeper.x, sp = G.w * 1.9 * dt; keeper.x += Math.abs(d) < sp ? d : Math.sign(d) * sp; keeper.dive = Math.min(1, keeper.dive + dt * 4); }
          if (shot && !shot.done) { shot.t += dt / FLIGHT; if (shot.t >= 1) { shot.t = 1; resolve(); } }
          else if (shot && shot.done) { shot.post += dt; }
          if (!api.playing) return;
          if (waitT > 0) { waitT -= dt; if (waitT <= 0 && shots < 5) { shot = null; resetKeeper(); } }
          if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); }
        },
        onDown: function (x, y) { sw = { x: x, y: y }; },
        onMove: function (x, y, down) { if (!down && !shot) { aim.x = x; aim.y = y; } },
        onUp: function (x, y) {
          if (!sw) return; var dx = x - sw.x, dy = y - sw.y, len = Math.hypot(dx, dy), s0 = sw; sw = null;
          if (len > 28 && dy < -10 && Math.hypot(s0.x - G.bx, s0.y - G.by) < 140) { // swipe from the ball
            var k = (G.y + G.h * 0.55 - G.by) / dy; kick(G.bx + dx * k, U.clamp(G.y + G.h * (1.05 - len / 320), G.y - 20, G.y + G.h - 8)); return;
          }
          if (len <= 28) kick(x, y);
        },
        onKey: function (k, down) {
          if (!down || !api.playing) return;
          var st = G.w * 0.08;
          if (k === 'ArrowLeft') aim.x = Math.max(G.x - 20, aim.x - st); else if (k === 'ArrowRight') aim.x = Math.min(G.x + G.w + 20, aim.x + st);
          else if (k === 'ArrowUp') aim.y = Math.max(G.y - 20, aim.y - G.h * 0.15); else if (k === 'ArrowDown') aim.y = Math.min(G.y + G.h - 8, aim.y + G.h * 0.15);
          else if (k === ' ' || k === 'Enter') kick(aim.x, aim.y);
        },
        draw: function (c) {
          var W = api.W, H = api.H, i;
          var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a1630'); g.addColorStop(0.45, '#13254a'); g.addColorStop(0.46, '#1f8a3e'); g.addColorStop(1, '#156d30');
          c.fillStyle = g; c.fillRect(0, 0, W, H);
          // crowd dots (jump up and down while celebrating a goal)
          var cel = popT > 0 && popBig;
          for (i = 0; i < 90; i++) { c.fillStyle = ['#ff4fd8', '#3ff0ff', '#ffe14d', '#fff'][i % 4]; c.globalAlpha = cel ? 0.8 : 0.35; c.fillRect((i * 97) % W, 70 + ((i * 53) % Math.max(10, G.y - 80)) - (cel ? Math.abs(Math.sin(t * 12 + i)) * 6 : 0), 4, 4); }
          c.globalAlpha = 1;
          // pitch lines + spot
          c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, G.y + G.h); c.lineTo(W, G.y + G.h); c.stroke();
          c.strokeRect(G.x - G.w * 0.18, G.y + G.h, G.w * 1.36, (G.by - G.y - G.h) * 0.55);
          // net (ripples out from where the ball hit it) + frame
          c.strokeStyle = cel ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)'; c.lineWidth = 1;
          function nv(x, y) { if (!rip) return [x, y]; var d = Math.hypot(x - rip.x, y - rip.y), k = Math.max(0, 1 - rip.t / 1.2) * Math.exp(-d / 60) * 14 * Math.cos(d / 9 - rip.t * 18); var l = d || 1; return [x + (x - rip.x) / l * k, y + (y - rip.y) / l * k]; }
          var NX = 14, NY = 6, j, pt;
          for (i = 1; i < NX; i++) { c.beginPath(); for (j = 0; j <= 12; j++) { pt = nv(G.x + i * G.w / NX, G.y + j * G.h / 12); if (j) c.lineTo(pt[0], pt[1]); else c.moveTo(pt[0], pt[1]); } c.stroke(); }
          for (i = 1; i < NY; i++) { c.beginPath(); for (j = 0; j <= 28; j++) { pt = nv(G.x + j * G.w / 28, G.y + i * G.h / NY); if (j) c.lineTo(pt[0], pt[1]); else c.moveTo(pt[0], pt[1]); } c.stroke(); }
          c.strokeStyle = cel ? (Math.floor(t * 8) % 2 ? '#3bff7a' : '#fff') : '#fff'; c.lineWidth = 7; c.beginPath(); c.moveTo(G.x, G.y + G.h); c.lineTo(G.x, G.y); c.lineTo(G.x + G.w, G.y); c.lineTo(G.x + G.w, G.y + G.h); c.stroke();
          // ball behind the goalie if it went in / was saved at the line; keeper drawn after so overlap is visible
          var bx = G.bx, by = G.by, br = 16, sy = G.by;
          if (shot) {
            var e = shot.t, arc = Math.sin(Math.PI * Math.min(1, e)) * 40; bx = shot.sx + (shot.tx - shot.sx) * e; by = shot.sy + (shot.ty - shot.sy) * e - arc; br = 16 - (16 - BALL_R) * e; sy = shot.sy + (shot.ty - shot.sy) * shot.t;
            if (shot.done) { if (shot.res === 'goal') { br = BALL_R - 2 * Math.min(1, shot.post * 4); by += Math.min(1, shot.post * 3) * 10; } else { var ease = (1 - Math.exp(-3 * shot.post)) / 3; bx += shot.vx * ease; by += shot.vy * ease; sy = Math.max(sy, by); } }
          }
          var inNet = shot && shot.done && shot.res === 'goal';
          function ball() {
            c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(bx, sy + br * 0.8, br, br * 0.35, 0, 0, 7); c.fill();
            c.fillStyle = '#fff'; c.beginPath(); c.arc(bx, by, br, 0, 7); c.fill(); c.strokeStyle = '#111'; c.lineWidth = 2; c.stroke();
            c.fillStyle = '#111'; c.beginPath(); c.arc(bx, by, br * 0.35, 0, 7); c.fill();
          }
          if (inNet) ball();
          drawKeeper(c);
          // aim cursor (keyboard / hover)
          if (api.playing && !shot) { c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 3; c.beginPath(); c.arc(aim.x, aim.y, 14, 0, 7); c.moveTo(aim.x - 20, aim.y); c.lineTo(aim.x + 20, aim.y); c.moveTo(aim.x, aim.y - 20); c.lineTo(aim.x, aim.y + 20); c.stroke(); }
          if (!inNet) ball();
          // confetti
          for (i = 0; i < fx.length; i++) { var p = fx[i]; c.globalAlpha = Math.min(1, p.life); c.fillStyle = p.c; c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); c.restore(); }
          c.globalAlpha = 1;
          // header: 5 shot dots + score
          U.text(c, 'PENALTY KICK', 20, 32, 20, '#4ade80', 'left');
          U.text(c, String(api.score), W - 26, 32, 32, '#fff', 'right', 'rgba(255,255,255,0.5)');
          for (i = 0; i < 5; i++) {
            var r = results[i], cx = W / 2 - 64 + i * 32;
            c.fillStyle = r === 'goal' ? '#3bff7a' : r ? '#ff3b4f' : 'rgba(255,255,255,0.2)'; c.beginPath(); c.arc(cx, 32, 10, 0, 7); c.fill();
            c.strokeStyle = i === shots && api.playing ? '#fff' : 'rgba(0,0,0,0.4)'; c.lineWidth = 2; c.stroke();
          }
          if (api.playing && !shot && shots === 0) U.text(c, api.touch ? 'Tap a spot in the goal!' : 'Click a spot in the goal!', W / 2, G.y + G.h + 34, 18, 'rgba(255,255,255,0.85)');
          if (popT > 0) {
            c.globalAlpha = Math.min(1, popT * 2);
            if (popBig) { var age = (1.6 - popT), sc = age < 0.25 ? 0.5 + age * 2.6 : 1 + Math.sin(t * 10) * 0.05; c.save(); c.translate(W / 2, G.y + G.h + 70); c.scale(sc, sc); U.text(c, popS, 0, 0, popS.length > 6 ? 46 : 64, popC, 'center', '#000'); c.restore(); U.text(c, '\u26BD\uFE0F GOALAZO! \u26BD\uFE0F', W / 2, G.y + G.h + 118, 20, '#ffe14d', 'center', '#000'); }
            else U.text(c, popS, W / 2, G.y + G.h + 70, popS.length > 8 ? 34 : 44, popC, 'center', '#000');
            c.globalAlpha = 1;
          }
        }
      };
      function drawKeeper(c, mask) {
        var P = pose(), S = parts(P.d), i;
        c.save(); c.translate(P.kx, P.ky); c.rotate(P.a); c.translate(0, -P.lift);
        var body = mask || '#ffe14d', dark = mask || '#1b1030', glove = mask || '#ff4fd8', skin = mask || '#e8b48c';
        var r0 = S.rects[0]; c.fillStyle = body; U.rr(c, r0.x0, r0.y0, r0.x1 - r0.x0, r0.y1 - r0.y0, r0.r); c.fill();
        var r1 = S.rects[1]; c.fillStyle = dark; c.fillRect(r1.x0, r1.y0, r1.x1 - r1.x0, r1.y1 - r1.y0);
        c.lineCap = 'round';
        for (i = 0; i < 4; i++) { var s = S.segs[i]; c.strokeStyle = i < 2 ? body : dark; c.lineWidth = s.r * 2; c.beginPath(); c.moveTo(s.ax, s.ay); c.lineTo(s.bx, s.by); c.stroke(); }
        c.fillStyle = glove; for (i = 0; i < 2; i++) { c.beginPath(); c.arc(S.circs[i].x, S.circs[i].y, S.circs[i].r, 0, 7); c.fill(); }
        c.fillStyle = skin; c.beginPath(); c.arc(S.circs[2].x, S.circs[2].y, S.circs[2].r, 0, 7); c.fill();
        c.restore();
      }
      return inst;
    }
  });
})();
