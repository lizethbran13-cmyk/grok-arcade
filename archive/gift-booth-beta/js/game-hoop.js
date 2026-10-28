/* Grok Arcade - bonus game #19: Hoop Frenzy (Grok Sports Command tie-in).
   The hoop slides back and forth on the backboard. TAP to shoot: the ball flies straight up and takes a moment to get there,
   so shoot a little early (lead the hoop!). Swish = 3, rim-in = 2, miss = lose a heart. Rainbow MONEY balls count double.
   3 hearts; the hoop gets faster (and later starts bobbing) the more you score. */
(function () {
  'use strict';
  var U = GA.MG.U, FLY = 0.62;
  GA.MG.register({
    id: 'hoop', name: 'Hoop Frenzy', ticketDiv: 3,
    howTouch: 'The hoop slides back and forth. TAP to shoot the ball straight up. It takes a moment to get there, so shoot a little EARLY and lead the hoop! Dead center = SWISH (+3), touching the rim = +2, a miss loses a heart. Rainbow MONEY balls count double. 3 hearts!',
    howKeys: 'The hoop slides back and forth. Press SPACE (or click) to shoot the ball straight up. It takes a moment to get there, so shoot a little EARLY and lead the hoop! Dead center = SWISH (+3), touching the rim = +2, a miss loses a heart. Rainbow MONEY balls count double. 3 hearts!',
    create: function (api) {
      var t, hearts, shots, pops, msg, msgT, streak, swishes, hx, hdir, made, money, nextMoney, cool, L = {};
      function layout() { var W = api.W, H = api.H; L.hy = Math.max(150, H * 0.26); L.by = H - Math.max(110, H * 0.16); L.rw = Math.min(46, W * 0.12); L.left = W * 0.14; L.right = W * 0.86; }
      function speed() { return Math.min(2.4, 0.85 + made * 0.06); }
      function bob() { return made >= 12 ? Math.sin(t * 2.2) * Math.min(40, (made - 11) * 4) : 0; }
      function say(s, col) { msg = [s, col]; msgT = 1.0; }
      function hoopX(at) { // where the hoop will be after `at` seconds (it bounces between the walls)
        var span = L.right - L.left, p = (hx - L.left) + hdir * speed() * span * 0.5 * at; p = ((p % (2 * span)) + 2 * span) % (2 * span); return L.left + (p > span ? 2 * span - p : p);
      }
      function shoot() {
        if (!api.playing || cool > 0) return; cool = 0.32;
        shots.push({ x: api.W / 2, t: 0, money: money }); money = false; api.sfx('boop');
        nextMoney--; if (nextMoney <= 0) { money = true; nextMoney = 5 + Math.floor(Math.random() * 4); }
      }
      function land(s) {
        var off = Math.abs(s.x - hx), rimR = L.rw;
        if (off < rimR * 0.42) { var pts = 3 * (s.money ? 2 : 1); api.addScore(pts); made++; streak++; swishes++; api.sfx('perfect'); say((s.money ? 'MONEY ' : '') + 'SWISH! +' + pts, '#ffe14d'); burst(hx, L.hy + bob(), s.money ? '#ff4fd8' : '#ffd23f'); }
        else if (off < rimR + 10) { var p2 = 2 * (s.money ? 2 : 1); api.addScore(p2); made++; streak++; api.sfx('point'); say('Off the rim... IN! +' + p2, '#7dd3fc'); burst(hx, L.hy + bob(), '#fb923c'); }
        else { hearts--; streak = 0; api.sfx('lifelost'); say(s.x < hx ? 'Too early - lead it less!' : 'Too late - shoot earlier!', '#ff6b6b'); if (hearts <= 0) api.gameOver(); }
        if (streak > 0 && streak % 5 === 0) say(streak + ' IN A ROW! \uD83D\uDD25', '#ff8fd0');
        if (streak >= 5 && GA.Prog) GA.Prog.event('hoop5');
      }
      function burst(x, y, col) { for (var i = 0; i < 14; i++) { var a = Math.random() * 6.28, s = 60 + Math.random() * 140; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 50, life: 0.7, col: col }); } }
      function drawBall(c, x, y, r, mon) {
        if (mon) { var cols = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#a855f7']; for (var i = 0; i < 5; i++) { c.fillStyle = cols[i]; c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, i * 1.2566 + t * 4, (i + 1) * 1.2566 + t * 4); c.closePath(); c.fill(); } }
        else { c.fillStyle = '#f97316'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
        c.strokeStyle = 'rgba(40,20,10,.75)'; c.lineWidth = 1.6; c.beginPath(); c.arc(x, y, r, 0, 7); c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r); c.lineTo(x, y + r); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, 7); c.fill();
      }
      return {
        reset: function () { layout(); t = 0; hearts = 3; shots = []; pops = []; msgT = 0; streak = 0; swishes = 0; made = 0; hx = api.W / 2; hdir = 1; money = false; nextMoney = 4; cool = 0; },
        resize: function () { layout(); },
        update: function (dt) {
          if (msgT > 0) msgT -= dt; if (cool > 0) cool -= dt;
          for (var i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.vy += 320 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          if (!api.playing) return; t += dt;
          var span = L.right - L.left; hx += hdir * speed() * span * 0.5 * dt; if (hx > L.right) { hx = 2 * L.right - hx; hdir = -1; } if (hx < L.left) { hx = 2 * L.left - hx; hdir = 1; }
          for (var k = shots.length - 1; k >= 0; k--) { var s = shots[k]; s.t += dt; if (s.t >= FLY && !s.done) { s.done = true; land(s); } if (s.t > FLY + 0.45) shots.splice(k, 1); }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i, hy = L.hy + bob();
          // gym: wood floor, wall, crowd dots, neon lights
          var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1e1b4b'); gr.addColorStop(0.55, '#312e81'); gr.addColorStop(0.56, '#c2410c'); gr.addColorStop(1, '#9a3412'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
          for (i = 0; i < 40; i++) { c.fillStyle = ['#f472b6', '#38bdf8', '#facc15', '#a3e635'][i % 4]; c.globalAlpha = 0.35; c.beginPath(); c.arc((i * 53) % W, 70 + (i * 37) % 60, 5, 0, 7); c.fill(); } c.globalAlpha = 1;
          c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; for (i = 0; i < 12; i++) { var fy = H * 0.56 + i * (H * 0.44 / 12); c.beginPath(); c.moveTo(0, fy); c.lineTo(W, fy); c.stroke(); }
          c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.beginPath(); c.ellipse(W / 2, H * 0.8, W * 0.32, 26, 0, Math.PI, 0, false); c.stroke();
          // backboard track + backboard following the hoop
          c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(L.left - 40, hy - 78, L.right - L.left + 80, 6);
          c.fillStyle = 'rgba(255,255,255,.88)'; U.rr(c, hx - 58, hy - 92, 116, 78, 6); c.fill(); c.strokeStyle = '#ef4444'; c.lineWidth = 3; c.strokeRect(hx - 22, hy - 52, 44, 34);
          // aim helper: a faint ghost where the hoop will be when a ball shot NOW arrives
          if (made < 6) { var gx = hoopX(FLY); c.strokeStyle = 'rgba(255,225,77,.45)'; c.setLineDash([5, 5]); c.lineWidth = 2; c.beginPath(); c.ellipse(gx, hy, L.rw, 7, 0, 0, 7); c.stroke(); c.setLineDash([]); c.strokeStyle = 'rgba(255,225,77,.35)'; c.beginPath(); c.moveTo(W / 2, L.by - 30); c.lineTo(W / 2, hy + 12); c.stroke(); }
          // balls behind the rim (going up), then the rim, then falling balls in front
          var drawShots = function (front) { shots.forEach(function (s) { var k = Math.min(1, s.t / FLY), y = L.by + (hy - L.by) * (1 - (1 - k) * (1 - k)), r = 22 - k * 8; if (s.t > FLY) { y = hy + (s.t - FLY) * 420; r = 14; } if ((s.t > FLY) !== front) return; drawBall(c, s.x, y, r, s.money); }); };
          drawShots(false);
          c.strokeStyle = '#f97316'; c.lineWidth = 5; c.beginPath(); c.ellipse(hx, hy, L.rw, 8, 0, 0, 7); c.stroke();
          c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.5; for (i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(hx + i * L.rw / 3.2, hy + 4); c.lineTo(hx + i * L.rw / 4.5, hy + 34); c.stroke(); }
          drawShots(true);
          // ready ball at the bottom
          if (api.playing && cool <= 0) drawBall(c, W / 2, L.by, 22, money);
          for (i = 0; i < pops.length; i++) { var q = pops[i]; c.globalAlpha = Math.max(0, q.life / 0.7); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, 5, 0, 7); c.fill(); } c.globalAlpha = 1;
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ff4f8b' : 'rgba(255,255,255,.4)');
          U.text(c, String(api.score), W - 16, 30, 30, '#fff', 'right', '#000');
          if (streak >= 3) U.text(c, 'STREAK ' + streak, W - 16, 60, 16, '#fff', 'right', '#000');
          if (msgT > 0) U.text(c, msg[0], W / 2, Math.max(60, L.hy - 110), 22, msg[1], 'center', '#000');
          if (api.playing && t < 4) U.text(c, api.touch ? 'TAP to shoot - lead the hoop!' : 'SPACE to shoot - lead the hoop!', W / 2, H - 28, 18, '#fff', 'center', '#000');
        },
        dbg: function () { return { t: t, hearts: hearts, streak: streak, made: made, swishes: swishes, hx: hx, hdir: hdir, lead: hoopX(FLY), mid: api.W / 2, rw: L.rw, cool: cool, shots: shots.length }; },
        onDown: function () { shoot(); },
        onKey: function (k, down) { if (down && (k === ' ' || k === 'Space' || k === 'space' || k === 'Enter' || k === 'ArrowUp')) shoot(); }
      };
    }
  });
})();
