/* Grok Arcade - bonus game #21: Spark Drift (Grok Kart Party tie-in).
   Your kart races down a candy-coloured road. When a corner comes, HOLD to drift: the sparks under the wheels
   charge BLUE -> ORANGE -> PURPLE. LET GO to fire the mini-turbo: blue +1, orange +2, purple ULTRA +3.
   Hold too long and you spin out; never drift a corner and you bonk the wall (both lose a heart).
   Gold star corners count double. 3 hearts; the sparks charge faster the further you go. */
(function () {
  'use strict';
  var U = GA.MG.U;
  var LV = [0.55, 1.25, 1.95, 2.75]; // charge thresholds: blue, orange, purple, spin-out
  var SPK = ['#7dd3fc', '#38bdf8', '#fb923c', '#c084fc'];
  GA.MG.register({
    id: 'drift', name: 'Spark Drift', ticketDiv: 3,
    howTouch: 'Corners are coming! When the road bends, HOLD anywhere to drift. Watch the sparks: BLUE, then ORANGE, then PURPLE. LET GO to blast a mini-turbo: blue +1, orange +2, PURPLE ULTRA +3. Hold too long and you SPIN OUT, skip a corner and you bonk the wall (you lose a heart). Gold star corners count double. 3 hearts!',
    howKeys: 'Corners are coming! When the road bends, HOLD SPACE (or the mouse) to drift. Watch the sparks: BLUE, then ORANGE, then PURPLE. LET GO to blast a mini-turbo: blue +1, orange +2, PURPLE ULTRA +3. Hold too long and you SPIN OUT, skip a corner and you bonk the wall (you lose a heart). Gold star corners count double. 3 hearts!',
    create: function (api) {
      var t, hearts, dist, spd, curve, seg, holding, charge, drifted, msg, msgT, pops, made, ultras, ustreak, boost, spin, tilt, nStar;
      function rate() { return Math.min(1.75, 1 + made * 0.035); }
      function lvl() { return charge >= LV[2] ? 3 : charge >= LV[1] ? 2 : charge >= LV[0] ? 1 : 0; }
      function say(s, col) { msg = [s, col]; msgT = 1.1; }
      function newSeg(prevCorner) {
        if (prevCorner) { seg = { kind: 'straight', len: Math.max(0.9, 1.7 - made * 0.03) + Math.random() * 0.6, t: 0 }; return; }
        nStar--; var star = nStar <= 0; if (star) nStar = 4 + Math.floor(Math.random() * 3);
        seg = { kind: 'corner', dir: Math.random() < 0.5 ? -1 : 1, len: 3.4 + Math.random() * 0.5, t: 0, star: star }; drifted = false;
      }
      function hurt(s) { hearts--; ustreak = 0; spin = 0.9; api.sfx('lifelost'); say(s, '#ff6b6b'); if (hearts <= 0) api.gameOver(); }
      function release() {
        if (!holding) return; holding = false; var L = lvl(), mul = seg.star ? 2 : 1;
        if (L === 0) { say('Too short - hold longer!', '#fde68a'); charge = 0; return; }
        var pts = L * mul; api.addScore(pts); made++; boost = 0.5 + L * 0.35; api.sfx(L === 3 ? 'perfect' : 'point');
        if (L === 3) { ultras++; ustreak++; if (ustreak >= 5 && GA.Prog) GA.Prog.event('drift5'); } else ustreak = 0;
        say((L === 3 ? 'ULTRA TURBO! +' : L === 2 ? 'SUPER TURBO! +' : 'Turbo +') + pts + (mul > 1 ? ' \u2B50' : ''), SPK[L]);
        burst(api.W / 2, api.H * 0.8, SPK[L]); charge = 0;
      }
      function press() {
        if (!api.playing || spin > 0) return;
        if (seg.kind !== 'corner') { say('Wait for the corner!', '#fde68a'); return; }
        if (drifted) return; holding = true; drifted = true; charge = 0; api.sfx('boop');
      }
      function burst(x, y, col) { for (var i = 0; i < 16; i++) { var a = Math.random() * 6.28, s = 60 + Math.random() * 160; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.7, col: col }); } }
      function drawKart(c, x, y, s, ang) {
        c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
        c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, 26, 54, 10, 0, 0, 7); c.fill();
        [-38, 38].forEach(function (wx) { c.fillStyle = '#1f2433'; U.rr(c, wx - 12, 2, 24, 28, 8); c.fill(); c.fillStyle = '#e5e7eb'; c.fillRect(wx - 5, 12, 10, 8); });
        var gr = c.createLinearGradient(0, -20, 0, 22); gr.addColorStop(0, '#ff6b8a'); gr.addColorStop(1, '#e11d48'); c.fillStyle = gr; U.rr(c, -36, -14, 72, 34, 14); c.fill();
        c.fillStyle = '#fff'; U.rr(c, -44, 4, 14, 10, 5); c.fill(); U.rr(c, 30, 4, 14, 10, 5); c.fill();
        c.fillStyle = '#ff2d55'; [-24, 24].forEach(function (lx) { U.rr(c, lx - 7, -4, 14, 6, 2); c.fill(); });
        [-12, 12].forEach(function (ex) { c.fillStyle = '#cbd5e1'; c.beginPath(); c.arc(ex, 16, 5, 0, 7); c.fill(); c.fillStyle = boost > 0 ? '#ffd23f' : '#334155'; c.beginPath(); c.arc(ex, 16, 3, 0, 7); c.fill(); });
        c.fillStyle = '#1f2433'; U.rr(c, -14, -32, 28, 20, 6); c.fill(); // seat
        c.fillStyle = '#e8f1ff'; U.rr(c, -17, -60, 34, 28, 9); c.fill(); // Grok head (from behind)
        c.fillStyle = '#ff4fd8'; c.fillRect(-1.5, -72, 3, 12); c.beginPath(); c.arc(0, -73, 4, 0, 7); c.fill();
        c.restore();
      }
      return {
        reset: function () { t = 0; hearts = 3; dist = 0; spd = 1; curve = 0; holding = false; charge = 0; drifted = false; msgT = 0; pops = []; made = 0; ultras = 0; ustreak = 0; boost = 0; spin = 0; tilt = 0; nStar = 5; newSeg(true); seg.len = 2.2; },
        resize: function () {},
        update: function (dt) {
          if (msgT > 0) msgT -= dt;
          for (var i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.vy += 320 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          if (!api.playing) return; t += dt;
          boost = Math.max(0, boost - dt); spin = Math.max(0, spin - dt);
          spd = 1 + Math.min(0.8, made * 0.02) + (boost > 0 ? 0.6 : 0) - (spin > 0 ? 0.5 : 0); dist += dt * spd * 6;
          seg.t += dt; var k = seg.t / seg.len;
          var tc = seg.kind === 'corner' ? seg.dir * Math.sin(Math.min(1, k) * Math.PI) : 0; curve += (tc - curve) * Math.min(1, dt * 5);
          if (holding) { charge += dt * rate(); if (charge >= LV[3]) { holding = false; charge = 0; hurt('SPUN OUT! Let go sooner'); } }
          tilt += ((holding ? seg.dir * 0.32 : -curve * 0.08) + (spin > 0 ? Math.sin(t * 30) * 0.4 : 0) - tilt) * Math.min(1, dt * 8);
          if (seg.kind === 'corner' && k > 0.62 && !drifted) { drifted = true; hurt('BONK! Drift the corners'); }
          if (k >= 1) { if (seg.kind === 'corner' && holding) release(); newSeg(seg.kind === 'corner'); }
          if (holding && Math.random() < 0.9) { var col = SPK[lvl()]; [-1, 1].forEach(function (s) { pops.push({ x: api.W / 2 + s * 40 * (api.W < 500 ? 0.9 : 1.1), y: api.H * 0.84, vx: (Math.random() - 0.5) * 120 - seg.dir * 60, vy: -40 - Math.random() * 80, life: 0.35, col: col }); }); }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i, hz = H * 0.4, cx = W / 2, sc = Math.min(1.45, W / 360);
          // sky + candy hills
          var sk = c.createLinearGradient(0, 0, 0, hz); sk.addColorStop(0, '#5b6cff'); sk.addColorStop(0.6, '#ff8fd8'); sk.addColorStop(1, '#ffe6a8'); c.fillStyle = sk; c.fillRect(0, 0, W, hz + 2);
          var hs = -curve * 40 - dist * 2 * curve;
          for (i = 0; i < 7; i++) { var hx = ((i * 170 + hs) % (W + 340) + W + 340) % (W + 340) - 170; c.fillStyle = ['#7cff6b', '#ff7ab6', '#3ff0ff', '#ffe14d'][i % 4]; c.beginPath(); c.ellipse(hx, hz + 6, 110, 46 + (i % 3) * 14, 0, Math.PI, 0); c.fill(); }
          c.fillStyle = '#6ee7b7'; c.fillRect(0, hz, W, H - hz);
          // road: rows from the horizon down, bending with the curve
          var rows = 90;
          for (i = 0; i < rows; i++) {
            var p0 = i / rows, p1 = (i + 1) / rows, y0 = hz + (H - hz) * p0 * p0, y1 = hz + (H - hz) * p1 * p1 + 1;
            var d = 1 - p0, w0 = W * 0.05 + W * 1.0 * p0, ox = curve * d * d * W * 0.55, x0 = cx + ox;
            var z = 1 / (p0 + 0.05), band = Math.floor(z * 2 + dist) % 2;
            c.fillStyle = band ? '#6ee7b7' : '#4ade80'; c.fillRect(0, y0, W, y1 - y0);
            c.fillStyle = band ? '#ff4fd8' : '#ffffff'; c.fillRect(x0 - w0 * 0.58, y0, w0 * 1.16, y1 - y0);
            c.fillStyle = band ? '#ff9ad6' : '#ffb3e6'; c.fillRect(x0 - w0 * 0.5, y0, w0, y1 - y0);
            if (band) { c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(x0 - w0 * 0.012, y0, w0 * 0.024, y1 - y0); }
          }
          // corner sign
          if (seg.kind === 'straight' && seg.len - seg.t < 0.9 || seg.kind === 'corner' && seg.t < 0.5) {
            var up = seg.kind === 'corner' ? seg : null, dir = up ? up.dir : 0;
            if (up) { c.fillStyle = up.star ? '#ffd23f' : '#ffffff'; U.rr(c, cx - 70, hz - 70, 140, 48, 12); c.fill(); U.text(c, (dir < 0 ? '\u25C0 ' : '') + 'DRIFT!' + (dir > 0 ? ' \u25B6' : ''), cx, hz - 46, 24, up.star ? '#7c2d12' : '#e11d48'); if (up.star) U.text(c, '\u2B50 x2', cx, hz - 10, 16, '#ffd23f', 'center', '#000'); }
            else U.text(c, 'Corner ahead...', cx, hz - 40, 18, '#fff', 'center', '#000');
          }
          // spark meter
          if (holding) { var mw = Math.min(260, W * 0.6), mx = cx - mw / 2, my = H * 0.62; c.fillStyle = 'rgba(0,0,0,.4)'; U.rr(c, mx - 4, my - 4, mw + 8, 22, 9); c.fill();
            [[0, LV[0], '#64748b'], [LV[0], LV[1], SPK[1]], [LV[1], LV[2], SPK[2]], [LV[2], LV[3], SPK[3]]].forEach(function (z) { c.fillStyle = z[2]; c.globalAlpha = 0.45; c.fillRect(mx + mw * z[0] / LV[3], my, mw * (z[1] - z[0]) / LV[3], 14); }); c.globalAlpha = 1;
            c.fillStyle = '#fff'; c.fillRect(mx + mw * Math.min(1, charge / LV[3]) - 2, my - 3, 4, 20); }
          drawKart(c, cx + tilt * 30, H * 0.8, sc, tilt);
          if (boost > 0) for (i = -1; i <= 1; i += 2) { c.fillStyle = 'rgba(255,170,40,' + Math.min(1, boost * 2) + ')'; c.beginPath(); c.ellipse(cx + tilt * 30 + i * 12 * sc, H * 0.8 + 32 * sc, 7 * sc, 16 * sc + Math.random() * 8, 0, 0, 7); c.fill(); }
          for (i = 0; i < pops.length; i++) { var q = pops[i]; c.globalAlpha = Math.max(0, q.life / 0.7); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, 4, 0, 7); c.fill(); } c.globalAlpha = 1;
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ff4f8b' : 'rgba(255,255,255,.4)');
          U.text(c, String(api.score), W - 16, 30, 30, '#fff', 'right', '#000');
          if (ustreak >= 2) U.text(c, 'ULTRA x' + ustreak, W - 16, 60, 16, '#e9d5ff', 'right', '#000');
          if (msgT > 0) U.text(c, msg[0], cx, H * 0.53, 24, msg[1], 'center', '#000');
          if (api.playing && t < 4) U.text(c, api.touch ? 'HOLD in corners, LET GO on purple!' : 'HOLD SPACE in corners, let go on purple!', cx, H - 22, 17, '#fff', 'center', '#000');
        },
        dbg: function () { return { t: t, hearts: hearts, seg: seg.kind, segT: seg.t, segLen: seg.len, star: !!seg.star, holding: holding, drifted: drifted, charge: charge, lvl: lvl(), made: made, ultras: ultras, ustreak: ustreak }; },
        onDown: function () { press(); },
        onUp: function () { release(); },
        onKey: function (k, down) { if (k === ' ' || k === 'Space' || k === 'space' || k === 'Enter' || k === 'ArrowUp') { if (down) press(); else release(); } }
      };
    }
  });
})();
