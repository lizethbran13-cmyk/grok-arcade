/* Grok Arcade - bonus game #13: Parking Panic (Grok Life tie-in).
   Your car slides back and forth along the street. Tap (or Space) to zoom up into the lot.
   Land in the glowing empty spot to score; bump a parked car and you lose a heart. 3 hearts. Gets faster! */
(function () {
  'use strict';
  var U = GA.MG.U;
  var COLS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6'];
  function car(c, x, y, w, h, col, up) {
    c.save(); c.translate(x, y); if (!up) c.rotate(Math.PI);
    c.fillStyle = '#111'; [-1, 1].forEach(function (s) { c.fillRect(s * w / 2 - (s > 0 ? 4 : 0), -h * 0.32, 4, h * 0.2); c.fillRect(s * w / 2 - (s > 0 ? 4 : 0), h * 0.14, 4, h * 0.2); });
    c.fillStyle = col; U.rr(c, -w / 2 + 2, -h / 2, w - 4, h, w * 0.3); c.fill();
    c.fillStyle = 'rgba(190,230,255,.9)'; U.rr(c, -w / 2 + 6, -h * 0.3, w - 12, h * 0.22, 4); c.fill();
    c.fillStyle = '#fef08a'; c.fillRect(-w / 2 + 5, -h / 2 + 1, 6, 4); c.fillRect(w / 2 - 11, -h / 2 + 1, 6, 4);
    c.restore();
  }
  GA.MG.register({
    id: 'parking', name: 'Parking Panic', ticketDiv: 1,
    howTouch: 'Your car slides along the street. TAP to zoom into the lot and land in the glowing empty spot! Bump a parked car and you lose a heart. 3 hearts. It gets faster!',
    howKeys: 'Your car slides along the street. Press SPACE (or \u2191) to zoom into the lot and land in the glowing empty spot! Bump a parked car and you lose a heart. 3 hearts.',
    create: function (api) {
      var t, n, spots, free, cx, dir, sp, fly, fy, hearts, msg, msgT, streak, parked;
      var L = {};
      function layout() { var W = api.W, H = api.H; n = W < 500 ? 5 : 7; L.sw = Math.min(90, (W - 20) / n); L.x0 = (W - L.sw * n) / 2; L.top = Math.max(70, H * 0.16); L.sh = L.sw * 1.5; L.road = H - 110; L.cw = L.sw * 0.62; L.ch = L.sw * 0.95; }
      function round() { spots = []; for (var i = 0; i < n; i++) spots.push(COLS[Math.floor(Math.random() * COLS.length)]); free = Math.floor(Math.random() * n); spots[free] = null; fly = false; fy = L.road; }
      function spotX(i) { return L.x0 + L.sw * (i + 0.5); }
      function launch() { if (!api.playing || fly) return; fly = true; api.sfx('point'); }
      function say(s, col) { msg = [s, col]; msgT = 1; }
      return {
        reset: function () { layout(); t = 0; hearts = 3; dir = 1; sp = 140; streak = 0; parked = []; cx = api.W / 2; msgT = 0; round(); },
        resize: function () { layout(); },
        update: function (dt) {
          t += dt; if (msgT > 0) msgT -= dt;
          if (!api.playing) return;
          if (!fly) { cx += dir * sp * dt; var m = L.x0 + L.cw / 2; if (cx < m) { cx = m; dir = 1; } if (cx > L.x0 + L.sw * n - L.cw / 2) { cx = L.x0 + L.sw * n - L.cw / 2; dir = -1; } }
          else {
            fy -= (420 + sp) * dt;
            if (fy <= L.top + L.sh / 2) {
              var i = Math.floor((cx - L.x0) / L.sw), off = Math.abs(cx - spotX(i));
              if (i === free && off < (L.sw - L.cw) / 2 + 6) { streak++; var pts = off < 6 ? 2 : 1; api.addScore(pts); api.sfx(pts > 1 ? 'perfect' : 'bonus'); say(pts > 1 ? 'PERFECT PARK! +2' : 'PARKED! +1', '#4ade80'); sp = Math.min(520, sp + 22); if (GA.Prog && streak >= 10) GA.Prog.event('park10'); round(); }
              else { hearts--; streak = 0; api.sfx('lifelost'); say('BUMP! \uD83D\uDCA5', '#ff6b86'); fly = false; fy = L.road; if (hearts <= 0) api.gameOver(); }
            }
          }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i;
          c.fillStyle = '#4b5563'; c.fillRect(0, 0, W, H);
          c.fillStyle = '#374151'; c.fillRect(0, L.road - L.ch, W, L.ch * 2);
          c.strokeStyle = '#facc15'; c.lineWidth = 4; c.setLineDash([24, 18]); c.beginPath(); c.moveTo(0, L.road + L.ch * 0.8); c.lineTo(W, L.road + L.ch * 0.8); c.stroke(); c.setLineDash([]);
          for (i = 0; i <= n; i++) { c.fillStyle = '#f8fafc'; c.fillRect(L.x0 + i * L.sw - 2, L.top, 4, L.sh); }
          for (i = 0; i < n; i++) {
            var x = spotX(i), y = L.top + L.sh / 2;
            if (spots[i]) car(c, x, y, L.cw, L.ch, spots[i], false);
            else { c.fillStyle = 'rgba(74,222,128,' + (0.35 + Math.sin(t * 6) * 0.15) + ')'; c.fillRect(x - L.sw / 2 + 4, L.top + 4, L.sw - 8, L.sh - 8); U.text(c, 'P', x, y, L.sw * 0.5, '#fff'); }
          }
          car(c, cx, fly ? fy : L.road, L.cw, L.ch, '#ff4fd8', true);
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ff4f8b' : 'rgba(255,255,255,.25)');
          U.text(c, String(api.score), W - 16, 30, 30, '#fff', 'right');
          if (msgT > 0) U.text(c, msg[0], W / 2, L.top + L.sh + 50, 28, msg[1], 'center', '#000');
          if (api.playing && t < 3) U.text(c, api.touch ? 'TAP to park!' : 'SPACE to park!', W / 2, H * 0.62, 22, '#fff');
        },
        onDown: function () { launch(); },
        onKey: function (k, down) { if (down && (k === ' ' || k === 'ArrowUp' || k === 'Enter')) launch(); }
      };
    }
  });
})();
