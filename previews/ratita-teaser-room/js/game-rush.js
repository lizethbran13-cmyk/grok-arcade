/* Grok Arcade - bonus game #14: Rush Hour (Grok Rides tie-in).
   Your Grok Rides car speeds up a 3-lane highway. Tap the LEFT or RIGHT side (or swipe / arrow keys) to change lanes.
   Dodge the traffic, grab coins (+1) and gold wrenches (fix a heart). Bump a car and you lose a heart. 3 hearts. It speeds up! */
(function () {
  'use strict';
  var U = GA.MG.U;
  var COLS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#14b8a6', '#f8fafc'];
  function car(c, x, y, w, h, col, kind) {
    c.save(); c.translate(x, y);
    c.fillStyle = 'rgba(0,0,0,.25)'; U.rr(c, -w / 2 + 3, -h / 2 + 5, w, h, w * 0.3); c.fill();
    c.fillStyle = '#111'; [-1, 1].forEach(function (s) { c.fillRect(s > 0 ? w / 2 - 3 : -w / 2 - 1, -h * 0.34, 4, h * 0.2); c.fillRect(s > 0 ? w / 2 - 3 : -w / 2 - 1, h * 0.16, 4, h * 0.2); });
    c.fillStyle = col; U.rr(c, -w / 2 + 1, -h / 2, w - 2, h, w * 0.3); c.fill();
    c.fillStyle = 'rgba(190,230,255,.92)'; U.rr(c, -w / 2 + 5, -h * 0.28, w - 10, h * 0.2, 4); c.fill(); U.rr(c, -w / 2 + 6, h * 0.22, w - 12, h * 0.12, 3); c.fill();
    if (kind === 'taxi') { c.fillStyle = '#111'; c.fillRect(-w / 2 + 1, -2, w - 2, 4); c.fillStyle = '#fff'; c.fillRect(-6, -h * 0.05, 12, 5); }
    if (kind === 'truck') { c.fillStyle = '#d1d5db'; U.rr(c, -w / 2 + 2, -h * 0.02, w - 4, h * 0.5, 3); c.fill(); }
    if (kind === 'me') { c.fillStyle = '#fff'; c.fillRect(-3, -h / 2 + 3, 6, h - 6); c.fillStyle = '#fef08a'; c.fillRect(-w / 2 + 4, -h / 2 + 1, 6, 4); c.fillRect(w / 2 - 10, -h / 2 + 1, 6, 4); }
    else { c.fillStyle = '#ff6b6b'; c.fillRect(-w / 2 + 4, h / 2 - 4, 6, 3); c.fillRect(w / 2 - 10, h / 2 - 4, 6, 3); }
    c.restore();
  }
  GA.MG.register({
    id: 'rush', name: 'Rush Hour', ticketDiv: 2,
    howTouch: 'Tap the LEFT or RIGHT side of the screen to change lanes. Dodge the traffic, grab coins! A golden wrench fixes a heart. 3 hearts. It gets faster!',
    howKeys: 'Press \u2190 / \u2192 (or A / D) to change lanes. Dodge the traffic, grab coins! A golden wrench fixes a heart. 3 hearts. It gets faster!',
    create: function (api) {
      var t, lane, lx, hearts, inv, speed, dist, things, gapLeft, msg, msgT, passed, streak, sx0, REL = 0.35;
      var L = {};
      function layout() { var W = api.W, H = api.H; L.rw = Math.min(W - 40, 330); L.x0 = (W - L.rw) / 2; L.lw = L.rw / 3; L.cw = L.lw * 0.56; L.ch = L.cw * 1.75; L.py = H - Math.max(120, H * 0.2); }
      function laneX(i) { return L.x0 + L.lw * (i + 0.5); }
      function say(s, col) { msg = [s, col]; msgT = 1; }
      function move(d) { if (!api.playing) return; var n = U.clamp(lane + d, 0, 2); if (n !== lane) { lane = n; api.sfx('point'); } }
      function spawn() {
        // never block all three lanes: leave at least one open lane in each wave
        var open = Math.floor(Math.random() * 3), n = Math.random() < 0.35 + Math.min(0.3, dist / 6000) ? 2 : 1, used = {};
        for (var k = 0; k < n; k++) {
          var l; do { l = Math.floor(Math.random() * 3); } while (l === open || used[l]); used[l] = 1;
          var r = Math.random(), kind = r < 0.15 ? 'truck' : r < 0.3 ? 'taxi' : 'car';
          things.push({ t: 'car', lane: l, y: -L.ch * (kind === 'truck' ? 1.6 : 1), kind: kind, col: kind === 'taxi' ? '#facc15' : COLS[Math.floor(Math.random() * COLS.length)], h: kind === 'truck' ? L.ch * 1.6 : L.ch, done: false });
        }
        if (Math.random() < 0.7) things.push({ t: hearts < 3 && Math.random() < 0.12 ? 'wrench' : 'coin', lane: open, y: -L.ch * 0.5, h: 24 });
      }
      return {
        reset: function () { layout(); t = 0; lane = 1; lx = laneX(1); hearts = 3; inv = 0; speed = 240; dist = 0; things = []; gapLeft = 200; msgT = 0; passed = 0; streak = 0; },
        resize: function () { layout(); lx = laneX(lane); },
        update: function (dt) {
          t += dt; if (msgT > 0) msgT -= dt; lx += (laneX(lane) - lx) * Math.min(1, dt * 14);
          if (!api.playing) return;
          speed = Math.min(560, 240 + dist / 45); dist += speed * dt; if (inv > 0) inv -= dt;
          // waves are spaced by distance (all traffic drives at the same speed, so waves never merge into a wall)
          gapLeft -= speed * (1 - REL) * dt; if (gapLeft <= 0) { spawn(); gapLeft = Math.max(L.ch * 3.2 + 60, 560 - dist / 40); }
          for (var i = things.length - 1; i >= 0; i--) {
            var o = things[i]; o.y += speed * dt * (1 - REL);
            var ox = laneX(o.lane), hit = Math.abs(ox - lx) < L.cw * 0.8 && Math.abs(o.y - L.py) < (o.h + L.ch) / 2 - 6;
            if (o.t === 'car') {
              if (hit && inv <= 0) { hearts--; inv = 1.4; streak = 0; api.sfx('lifelost'); say('BONK! \uD83D\uDCA5', '#ff6b86'); if (hearts <= 0) { api.gameOver(); return; } }
              if (!o.done && o.y - o.h / 2 > L.py + L.ch / 2) { o.done = true; passed++; streak++; if (passed % 5 === 0) { api.addScore(1); say('+1 SMOOTH!', '#7dd3fc'); } if (GA.Prog && streak >= 25) GA.Prog.event('rush25'); }
            } else if (hit) {
              things.splice(i, 1);
              if (o.t === 'coin') { api.addScore(1); api.sfx('bonus'); }
              else { hearts = Math.min(3, hearts + 1); api.sfx('perfect'); say('\uD83D\uDD27 FIXED!', '#ffd23f'); }
              continue;
            }
            if (o.y > api.H + 200) things.splice(i, 1);
          }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i;
          c.fillStyle = '#86c06c'; c.fillRect(0, 0, W, H);
          // roadside trees scroll
          var off = (dist * 0.9) % 120;
          for (i = -1; i < H / 120 + 1; i++) { var y = i * 120 + off; c.fillStyle = '#3f8a3a'; c.beginPath(); c.arc(L.x0 - 18, y, 12, 0, 7); c.arc(L.x0 + L.rw + 18, y + 60, 12, 0, 7); c.fill(); }
          c.fillStyle = '#4b5563'; c.fillRect(L.x0, 0, L.rw, H);
          c.fillStyle = '#f8fafc'; c.fillRect(L.x0 - 4, 0, 4, H); c.fillRect(L.x0 + L.rw, 0, 4, H);
          var d = dist % 60;
          c.fillStyle = '#facc15'; for (var k = 1; k < 3; k++) for (i = -1; i < H / 60 + 1; i++) c.fillRect(L.x0 + L.lw * k - 2, i * 60 + d, 4, 30);
          for (i = 0; i < things.length; i++) {
            var o = things[i], x = laneX(o.lane);
            if (o.t === 'car') car(c, x, o.y, L.cw, o.h, o.col, o.kind);
            else if (o.t === 'coin') { c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(x, o.y, 11, 0, 7); c.fill(); c.strokeStyle = '#b8860b'; c.lineWidth = 2; c.stroke(); U.text(c, '$', x, o.y + 1, 13, '#8a5a00'); }
            else U.text(c, '\uD83D\uDD27', x, o.y, 26, '#fff');
          }
          if (!(inv > 0 && Math.floor(t * 12) % 2)) car(c, lx, L.py, L.cw, L.ch, '#ff4fd8', 'me');
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ff4f8b' : 'rgba(255,255,255,.3)');
          U.text(c, String(api.score), W - 16, 30, 30, '#fff', 'right', '#000');
          U.text(c, Math.round(speed / 5) + ' MPH', W - 16, 60, 16, '#fff', 'right', '#000');
          if (msgT > 0) U.text(c, msg[0], W / 2, H * 0.4, 28, msg[1], 'center', '#000');
          if (api.playing && t < 3) U.text(c, api.touch ? 'TAP LEFT / RIGHT to switch lanes' : '\u2190 \u2192 to switch lanes', W / 2, H * 0.55, 18, '#fff', 'center', '#000');
        },
        dbg: function () { return { lane: lane, hearts: hearts, passed: passed, speed: speed, py: L.py, ch: L.ch, things: things.map(function (o) { return { t: o.t, lane: o.lane, y: o.y, h: o.h }; }) }; },
        onDown: function (x) { sx0 = x; move(x < api.W / 2 ? -1 : 1); },
        onKey: function (k, down) { if (!down) return; if (k === 'ArrowLeft' || k === 'a' || k === 'A') move(-1); if (k === 'ArrowRight' || k === 'd' || k === 'D') move(1); }
      };
    }
  });
})();
