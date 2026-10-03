/* Grok Arcade - bonus game #7: Penalty Kick. 5 shots at a goalie: tap a spot in the goal (or swipe from the ball).
   Corners are hardest to save; the goalie gets smarter each shot. 1 point per goal, +1 for a top-corner goal. */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'penalty', name: 'Penalty Kick', ticketDiv: 1,
    howTouch: 'Tap where you want to shoot inside the goal (or swipe from the ball). Beat the goalie! 5 shots. Top corners score a bonus point.',
    howKeys: 'Click a spot in the goal, or move the aim with \u2190 \u2192 \u2191 \u2193 and press SPACE to shoot. Beat the goalie! 5 shots. Top corners score a bonus point.',
    create: function (api) {
      var shots, results, shot, keeper, aim, popT, popS, popC, waitT, endT, t = 0, G, sw;
      function layout() {
        var W = api.W, H = api.H, gw = Math.min(W * 0.84, 560), gh = gw * 0.38;
        G = { x: (W - gw) / 2, y: Math.max(96, H * 0.2), w: gw, h: gh, bx: W / 2, by: H - Math.max(70, H * 0.14) };
      }
      function resetKeeper() { keeper = { x: G.x + G.w / 2, tx: G.x + G.w / 2, dive: 0, dir: 0, lift: 0, wob: Math.random() * 6 }; }
      function kick(tx, ty) {
        if (!api.playing || shot || waitT > 0 || shots >= 5) return;
        shot = { sx: G.bx, sy: G.by, tx: tx, ty: ty, t: 0 };
        // goalie guesses: smarter every shot; corners are hard to reach
        var smart = 0.3 + shots * 0.08, right = Math.random() < smart ? tx : G.x + Math.random() * G.w;
        keeper.tx = U.clamp(right, G.x + G.w * 0.1, G.x + G.w * 0.9); keeper.dir = Math.sign(keeper.tx - keeper.x); keeper.lift = Math.random() < smart ? (G.y + G.h - ty) / G.h : Math.random() * 0.6;
        api.sfx('click');
      }
      function resolve() {
        var s = shot, inGoal = s.tx > G.x + 6 && s.tx < G.x + G.w - 6 && s.ty > G.y + 6 && s.ty < G.y + G.h;
        var reachX = 46 + G.w * 0.05, reachTop = G.y + G.h - G.h * (0.55 + 0.5 * keeper.lift);
        var saved = inGoal && Math.abs(keeper.x - s.tx) < reachX && s.ty > reachTop - 10;
        var pts = 0;
        if (!inGoal) { results.push('miss'); popS = 'WIDE!'; popC = '#ff3b4f'; api.sfx('miss'); }
        else if (saved) { results.push('save'); popS = 'SAVED!'; popC = '#ff8a3d'; api.sfx('buzz'); }
        else {
          pts = 1; var corner = s.ty < G.y + G.h * 0.38 && (s.tx < G.x + G.w * 0.22 || s.tx > G.x + G.w * 0.78);
          if (corner) pts = 2;
          results.push('goal'); popS = corner ? 'TOP BINS! +2' : 'GOAL!'; popC = '#3bff7a'; api.sfx(corner ? 'perfect' : 'point');
          api.addScore(pts);
        }
        popT = 1.1; shots++; shot.done = true; shot.res = results[results.length - 1]; waitT = 1.0;
        if (shots >= 5) endT = 1.2;
      }
      var inst = {
        reset: function () { layout(); shots = 0; results = []; shot = null; popT = 0; waitT = 0; endT = 0; aim = { x: G.x + G.w * 0.5, y: G.y + G.h * 0.5 }; resetKeeper(); sw = null; },
        resize: function () { layout(); resetKeeper(); },
        debug: function () { return { shots: shots, results: results.slice(), goal: { x: G.x, y: G.y, w: G.w, h: G.h }, ball: { x: G.bx, y: G.by }, keeper: { x: keeper.x }, flying: !!(shot && !shot.done), aim: aim }; },
        update: function (dt) {
          t += dt; if (popT > 0) popT -= dt;
          // idle keeper sways, diving keeper moves toward the guess
          if (!shot || shot.done) { if (!shot) { keeper.x = G.x + G.w / 2 + Math.sin(t * 2 + keeper.wob) * G.w * 0.08; } }
          else { var d = keeper.tx - keeper.x, sp = G.w * 1.9 * dt; keeper.x += Math.abs(d) < sp ? d : Math.sign(d) * sp; keeper.dive = Math.min(1, keeper.dive + dt * 4); }
          if (shot && !shot.done) { shot.t += dt / 0.5; if (shot.t >= 1) { shot.t = 1; resolve(); } }
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
          var W = api.W, H = api.H;
          var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a1630'); g.addColorStop(0.45, '#13254a'); g.addColorStop(0.46, '#1f8a3e'); g.addColorStop(1, '#156d30');
          c.fillStyle = g; c.fillRect(0, 0, W, H);
          // crowd dots
          for (var i = 0; i < 90; i++) { c.fillStyle = ['#ff4fd8', '#3ff0ff', '#ffe14d', '#fff'][i % 4]; c.globalAlpha = 0.35; c.fillRect((i * 97) % W, 70 + ((i * 53) % Math.max(10, G.y - 80)), 4, 4); }
          c.globalAlpha = 1;
          // pitch lines + spot
          c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, G.y + G.h); c.lineTo(W, G.y + G.h); c.stroke();
          c.strokeRect(G.x - G.w * 0.18, G.y + G.h, G.w * 1.36, (G.by - G.y - G.h) * 0.55);
          // net + frame
          c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1;
          for (i = 1; i < 14; i++) { c.beginPath(); c.moveTo(G.x + i * G.w / 14, G.y); c.lineTo(G.x + i * G.w / 14, G.y + G.h); c.stroke(); }
          for (i = 1; i < 6; i++) { c.beginPath(); c.moveTo(G.x, G.y + i * G.h / 6); c.lineTo(G.x + G.w, G.y + i * G.h / 6); c.stroke(); }
          c.strokeStyle = '#fff'; c.lineWidth = 7; c.beginPath(); c.moveTo(G.x, G.y + G.h); c.lineTo(G.x, G.y); c.lineTo(G.x + G.w, G.y); c.lineTo(G.x + G.w, G.y + G.h); c.stroke();
          // keeper
          var kx = keeper.x, ky = G.y + G.h, lean = keeper.dir * keeper.dive, kh = G.h * 0.62;
          c.save(); c.translate(kx, ky); c.rotate(lean * 0.65); c.translate(0, -keeper.lift * keeper.dive * G.h * 0.25);
          c.fillStyle = '#ffe14d'; U.rr(c, -16, -kh, 32, kh * 0.62, 8); c.fill();
          c.fillStyle = '#1b1030'; c.fillRect(-14, -kh * 0.4, 28, kh * 0.18);
          c.strokeStyle = '#ffe14d'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(-14, -kh * 0.9); c.lineTo(-38, -kh * 1.1 - keeper.dive * 10); c.moveTo(14, -kh * 0.9); c.lineTo(38, -kh * 1.1 - keeper.dive * 10); c.stroke();
          c.fillStyle = '#ff4fd8'; c.beginPath(); c.arc(-40, -kh * 1.12 - keeper.dive * 10, 8, 0, 7); c.arc(40, -kh * 1.12 - keeper.dive * 10, 8, 0, 7); c.fill();
          c.strokeStyle = '#1b1030'; c.lineWidth = 8; c.beginPath(); c.moveTo(-8, -kh * 0.22); c.lineTo(-12, 0); c.moveTo(8, -kh * 0.22); c.lineTo(12, 0); c.stroke();
          c.fillStyle = '#e8b48c'; c.beginPath(); c.arc(0, -kh - 12, 13, 0, 7); c.fill();
          c.restore();
          // aim cursor (keyboard / hover)
          if (api.playing && !shot) { c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 3; c.beginPath(); c.arc(aim.x, aim.y, 14, 0, 7); c.moveTo(aim.x - 20, aim.y); c.lineTo(aim.x + 20, aim.y); c.moveTo(aim.x, aim.y - 20); c.lineTo(aim.x, aim.y + 20); c.stroke(); }
          // ball
          var bx = G.bx, by = G.by, br = 16;
          if (shot) { var e = shot.t, arc = Math.sin(Math.PI * Math.min(1, e)) * 40; bx = shot.sx + (shot.tx - shot.sx) * e; by = shot.sy + (shot.ty - shot.sy) * e - arc; br = 16 - 7 * e; }
          c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(bx, (shot ? shot.sy + (shot.ty - shot.sy) * shot.t : G.by) + br * 0.8, br, br * 0.35, 0, 0, 7); c.fill();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(bx, by, br, 0, 7); c.fill(); c.strokeStyle = '#111'; c.lineWidth = 2; c.stroke();
          c.fillStyle = '#111'; c.beginPath(); c.arc(bx, by, br * 0.35, 0, 7); c.fill();
          // header: 5 shot dots + score
          U.text(c, 'PENALTY KICK', 20, 32, 20, '#4ade80', 'left');
          U.text(c, String(api.score), W - 26, 32, 32, '#fff', 'right', 'rgba(255,255,255,0.5)');
          for (i = 0; i < 5; i++) {
            var r = results[i], cx = W / 2 - 64 + i * 32;
            c.fillStyle = r === 'goal' ? '#3bff7a' : r ? '#ff3b4f' : 'rgba(255,255,255,0.2)'; c.beginPath(); c.arc(cx, 32, 10, 0, 7); c.fill();
            c.strokeStyle = i === shots && api.playing ? '#fff' : 'rgba(0,0,0,0.4)'; c.lineWidth = 2; c.stroke();
          }
          if (api.playing && !shot && shots === 0) U.text(c, api.touch ? 'Tap a spot in the goal!' : 'Click a spot in the goal!', W / 2, G.y + G.h + 34, 18, 'rgba(255,255,255,0.85)');
          if (popT > 0) { c.globalAlpha = Math.min(1, popT * 2); U.text(c, popS, W / 2, G.y + G.h * 0.5, 44, popC, 'center', '#000'); c.globalAlpha = 1; }
        }
      };
      return inst;
    }
  });
})();
