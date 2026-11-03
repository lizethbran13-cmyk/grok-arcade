/* Grok Arcade - bonus game #49: Pup Drop Catch (Candy's RuffSources Rescue tie-in).
   Haywire Ratita gadgets are flinging puppies out of the Gadget Works! Slide Candy (with her rescue net) left/right
   to catch falling pups. Dodge the falling gadget bolts. Golden pups = +3. A dropped pup or a bolt = a lost heart (3). Gets faster. */
(function () {
  'use strict';
  var U = GA.MG.U;
  var COLS = ['#f5deb3', '#c08552', '#ffffff', '#3b2a1a', '#e8a33d', '#9ca3af'];
  GA.MG.register({
    id: 'pupdrop', name: 'Pup Drop Catch', ticketDiv: 1,
    howTouch: 'Pups are flying out of the haywire Ratita Gadget Works! DRAG (or hold left/right side) to slide Candy and her rescue net under them. Dodge the grey gadget bolts. Golden pups are worth 3. 3 hearts.',
    howKeys: 'Pups are flying out of the haywire Ratita Gadget Works! Use \u2190 \u2192 (or A / D) to slide Candy and her rescue net under them. Dodge the grey gadget bolts. Golden pups are worth 3. 3 hearts.',
    create: function (api) {
      var t, items, hearts, cx, vx, spawnT, sp, msg, msgT, left, right, drag, flash;
      function say(s, c) { msg = [s, c]; msgT = 1; }
      function reset() { t = 0; items = []; hearts = 3; cx = api.W / 2; vx = 0; spawnT = 0.6; sp = 150; msg = null; msgT = 0; left = right = false; drag = null; flash = 0; parts = []; caught = 0; clouds = [0, 1, 2, 3].map(function (i) { return { x: Math.random() * api.W, y: 70 + i * 34, s: 0.7 + Math.random() * 0.6 }; }); api.setScore(0); }
      var parts = [], caught = 0, clouds = [];
      function burst(x, y, col, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.28, v = 60 + Math.random() * 160; parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, l: 0.7, c: col }); } }
      function spawn() { var r = Math.random(), bolt = r < Math.min(0.32, 0.12 + t * 0.004), gold = !bolt && r > 0.93;
        items.push({ x: 30 + Math.random() * (api.W - 60), y: -30, k: bolt ? 'bolt' : gold ? 'gold' : 'pup', c: COLS[Math.floor(Math.random() * COLS.length)], vy: sp * (0.8 + Math.random() * 0.4), sw: Math.random() * 6, done: false }); }
      function drawPup(c, x, y, col, s, gold, tt) { c.save(); c.translate(x, y); c.scale(s, s); var sw = Math.sin(tt * 3) * 0.12; c.rotate(sw);
        // parachute (pink canopy + strings)
        var cg = c.createLinearGradient(0, -62, 0, -38); cg.addColorStop(0, gold ? '#fde047' : '#f472b6'); cg.addColorStop(1, gold ? '#ca8a04' : '#be185d');
        c.fillStyle = cg; c.beginPath(); c.arc(0, -40, 26, Math.PI, 0); c.quadraticCurveTo(13, -46, 0, -40); c.quadraticCurveTo(-13, -46, -26, -40); c.fill();
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-8, -56, 8, 4, -0.4, 0, 7); c.fill();
        c.strokeStyle = 'rgba(80,40,60,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-25, -40); c.lineTo(-9, -12); c.moveTo(25, -40); c.lineTo(9, -12); c.moveTo(0, -40); c.lineTo(0, -20); c.stroke();
        if (gold) { c.shadowColor = '#fde047'; c.shadowBlur = 18; }
        var base = gold ? '#facc15' : col, bg = c.createRadialGradient(-5, -2, 2, 0, 4, 18); bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.25, base); bg.addColorStop(1, shade(base, -40));
        c.strokeStyle = 'rgba(40,25,20,.75)'; c.lineWidth = 1.6;
        c.fillStyle = shade(base, -30); c.beginPath(); c.ellipse(13, 10, 3, 8, -0.8 + Math.sin(tt * 14) * 0.4, 0, 7); c.fill(); c.stroke(); // wagging tail
        c.fillStyle = bg; c.beginPath(); c.ellipse(0, 7, 14, 11, 0, 0, 7); c.fill(); c.stroke();
        c.fillStyle = shade(base, -20); [-9, -3, 3, 9].forEach(function (px) { c.beginPath(); c.ellipse(px, 17 + Math.sin(tt * 10 + px) * 1.5, 3.4, 4, 0, 0, 7); c.fill(); c.stroke(); });
        var hg = c.createRadialGradient(-4, -12, 2, 0, -8, 14); hg.addColorStop(0, '#ffffff'); hg.addColorStop(0.3, base); hg.addColorStop(1, shade(base, -35));
        c.fillStyle = hg; c.beginPath(); c.arc(0, -8, 12, 0, 7); c.fill(); c.stroke(); c.shadowBlur = 0;
        c.fillStyle = gold ? '#ca8a04' : '#6b4423'; c.beginPath(); c.ellipse(-11, -8, 4.5, 9, 0.35, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.ellipse(11, -8, 4.5, 9, -0.35, 0, 7); c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(0, -3, 6, 4.5, 0, 0, 7); c.fill();
        c.fillStyle = '#111'; c.beginPath(); c.arc(-4.5, -10, 2.4, 0, 7); c.arc(4.5, -10, 2.4, 0, 7); c.fill(); c.beginPath(); c.ellipse(0, -5, 2.6, 2, 0, 0, 7); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(-3.8, -10.8, 0.9, 0, 7); c.arc(5.2, -10.8, 0.9, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,120,150,.5)'; c.beginPath(); c.arc(-8, -4, 2.2, 0, 7); c.arc(8, -4, 2.2, 0, 7); c.fill();
        c.fillStyle = '#ff4fa0'; c.fillRect(-9, 0, 18, 3); c.fillStyle = '#fde047'; c.beginPath(); c.arc(0, 4, 2, 0, 7); c.fill(); c.restore(); }
      function shade(hex, d) { var n = parseInt(hex.slice(1), 16), r = Math.max(0, Math.min(255, (n >> 16) + d)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + d)), b = Math.max(0, Math.min(255, (n & 255) + d)); return 'rgb(' + r + ',' + g + ',' + b + ')'; }
      function drawScene(c, W, H) {
        var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#60c5f8'); g.addColorStop(0.6, '#bfe6ff'); g.addColorStop(1, '#fde2f0'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,255,255,.9)'; clouds.forEach(function (cl) { c.beginPath(); c.arc(cl.x, cl.y, 18 * cl.s, 0, 7); c.arc(cl.x + 20 * cl.s, cl.y - 8 * cl.s, 22 * cl.s, 0, 7); c.arc(cl.x + 42 * cl.s, cl.y, 16 * cl.s, 0, 7); c.fill(); });
        c.fillStyle = '#86d48f'; c.beginPath(); c.moveTo(0, H - 40); for (var x = 0; x <= W; x += 20) c.lineTo(x, H - 120 - Math.sin(x * 0.01) * 30 - Math.sin(x * 0.027) * 14); c.lineTo(W, H - 40); c.fill();
        var hc = ['#fde68a', '#fbcfe8', '#bfdbfe', '#c7f9cc', '#fed7aa'], roof = ['#b91c1c', '#7c3aed', '#1d4ed8', '#15803d', '#c2410c'];
        for (var i = 0, hx = 10; hx < W; i++, hx += 110) { var hw = 70, hh = 46, hy = H - 40 - hh; c.fillStyle = hc[i % 5]; c.fillRect(hx, hy, hw, hh); c.fillStyle = roof[i % 5]; c.beginPath(); c.moveTo(hx - 8, hy); c.lineTo(hx + hw / 2, hy - 28); c.lineTo(hx + hw + 8, hy); c.fill();
          c.fillStyle = '#7dd3fc'; c.fillRect(hx + 10, hy + 12, 14, 12); c.fillRect(hx + 46, hy + 12, 14, 12); c.fillStyle = '#7c2d12'; c.fillRect(hx + 29, hy + 22, 12, 24); }
        var gg = c.createLinearGradient(0, H - 40, 0, H); gg.addColorStop(0, '#4ade80'); gg.addColorStop(1, '#16a34a'); c.fillStyle = gg; c.fillRect(0, H - 40, W, 40);
        c.fillStyle = 'rgba(21,128,61,.6)'; for (var k = 0; k < W; k += 9) c.fillRect(k, H - 40, 2, 5 + (k * 7) % 6);
        // Gadget Works factory along the top: pipes, hazard stripes, chutes that spit pups
        var fg = c.createLinearGradient(0, 0, 0, 52); fg.addColorStop(0, '#64748b'); fg.addColorStop(1, '#334155'); c.fillStyle = fg; c.fillRect(0, 0, W, 52);
        for (var k2 = 0; k2 < W; k2 += 24) { c.fillStyle = (k2 / 24) % 2 ? '#facc15' : '#111827'; c.beginPath(); c.moveTo(k2, 52); c.lineTo(k2 + 12, 52); c.lineTo(k2 + 24, 60); c.lineTo(k2 + 12, 60); c.fill(); }
        for (var k3 = 40; k3 < W; k3 += 140) { c.fillStyle = '#1f2937'; c.fillRect(k3, 52, 34, 14); c.fillStyle = '#0f172a'; c.fillRect(k3 + 4, 62, 26, 6); var on = Math.sin(t * 6 + k3) > 0; c.fillStyle = on ? '#ef4444' : '#7f1d1d'; c.beginPath(); c.arc(k3 + 17, 10, 4, 0, 7); c.fill(); }
        c.fillStyle = 'rgba(203,213,225,.55)'; for (var k4 = 0; k4 < 3; k4++) { var sx = W * (0.2 + k4 * 0.3), ph = (t * 0.6 + k4 * 0.33) % 1; c.beginPath(); c.arc(sx + ph * 20, -6 - ph * 10 + 30, 8 + ph * 10, 0, 7); c.fill(); }
        U.text(c, 'RATITA GADGET WORKS \u2699\uFE0F (haywire!)', W / 2, 26, 16, '#fde047', 'center', '#000');
        // rescue van parked at the right: caught pups pile up in the back
        var vx0 = W - 128, vy0 = H - 82; c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(vx0 + 58, H - 38, 62, 7, 0, 0, 7); c.fill();
        c.fillStyle = '#f8fafc'; c.fillRect(vx0, vy0, 100, 40); c.fillRect(vx0 + 74, vy0 - 14, 28, 20); c.fillStyle = '#be185d'; c.fillRect(vx0, vy0 + 18, 100, 9); c.fillStyle = '#7dd3fc'; c.fillRect(vx0 + 80, vy0 - 10, 18, 12);
        U.text(c, 'RUFFSOURCES', vx0 + 40, vy0 + 9, 10, '#be185d'); c.fillStyle = '#111827'; [vx0 + 20, vx0 + 80].forEach(function (wx) { c.beginPath(); c.arc(wx, vy0 + 42, 9, 0, 7); c.fill(); c.fillStyle = '#9ca3af'; c.beginPath(); c.arc(wx, vy0 + 42, 3.5, 0, 7); c.fill(); c.fillStyle = '#111827'; });
        for (var p2 = 0; p2 < Math.min(caught, 8); p2++) { c.fillStyle = COLS[p2 % COLS.length]; c.strokeStyle = 'rgba(40,25,20,.6)'; c.beginPath(); c.arc(vx0 + 10 + (p2 % 4) * 15, vy0 - 4 - Math.floor(p2 / 4) * 10, 7, 0, 7); c.fill(); c.stroke(); } }
      function drawBolt(c, x, y, a) { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = '#94a3b8'; c.fillRect(-4, -14, 8, 22); c.fillStyle = '#64748b'; c.fillRect(-10, -18, 20, 7); c.fillStyle = '#facc15'; c.beginPath(); c.arc(0, 12, 3, 0, 7); c.fill(); c.restore(); }
      function drawCandy(c, x, y) { // miniature schnauzer: grey body, white beard + eyebrows, holding a pink net
        c.save(); c.translate(x, y);
        c.strokeStyle = '#be185d'; c.lineWidth = 4; c.beginPath(); c.moveTo(-6, -20); c.lineTo(-30, -44); c.moveTo(6, -20); c.lineTo(30, -44); c.stroke();
        c.fillStyle = 'rgba(244,114,182,.35)'; c.strokeStyle = '#f472b6'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, -46, 38, 10, 0, 0, 7); c.fill(); c.stroke();
        c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, 22, 30, 6, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(30,30,40,.8)'; c.lineWidth = 2; c.fillStyle = '#e5e7eb'; [-16, -6, 6, 16].forEach(function (lx, i) { c.beginPath(); c.ellipse(lx, 17 + (i % 2 ? 1 : -1) * Math.sin(t * 12) * 2, 5, 6, 0, 0, 7); c.fill(); c.stroke(); }); var cb = c.createRadialGradient(-8, -2, 3, 0, 6, 28); cb.addColorStop(0, '#9ca3af'); cb.addColorStop(1, '#4b5563'); c.fillStyle = cb; c.beginPath(); c.ellipse(0, 6, 26, 16, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#374151'; c.beginPath(); c.ellipse(0, 0, 20, 7, 0, 0, 7); c.fill(); var ch = c.createRadialGradient(-5, -14, 2, 0, -10, 18); ch.addColorStop(0, '#a1a1aa'); ch.addColorStop(1, '#52525b'); c.fillStyle = ch; c.beginPath(); c.arc(0, -10, 16, 0, 7); c.fill(); c.stroke();
        c.fillStyle = '#4b5563'; c.beginPath(); c.moveTo(-13, -20); c.lineTo(-18, -34); c.lineTo(-5, -24); c.fill(); c.beginPath(); c.moveTo(13, -20); c.lineTo(18, -34); c.lineTo(5, -24); c.fill();
        c.fillStyle = '#e5e7eb'; c.beginPath(); c.ellipse(0, -1, 10, 9, 0, 0, 7); c.fill(); c.fillRect(-11, -16, 9, 3); c.fillRect(2, -16, 9, 3);
        c.fillStyle = '#111'; c.beginPath(); c.arc(-5, -11, 2.4, 0, 7); c.arc(5, -11, 2.4, 0, 7); c.arc(0, -5, 3, 0, 7); c.fill();
        c.fillStyle = '#ff4fa0'; c.fillRect(-12, 6, 24, 4); c.restore(); }
      return {
        reset: reset,
        resize: function () { cx = U.clamp(cx || api.W / 2, 40, api.W - 40); },
        update: function (dt) { if (!api.playing) return; t += dt; sp = Math.min(420, 150 + t * 5); if (msgT > 0) msgT -= dt; if (flash > 0) flash -= dt;
          var acc = (right ? 1 : 0) - (left ? 1 : 0); if (drag != null) cx += (drag - cx) * Math.min(1, dt * 14); else { vx += acc * 2600 * dt; vx *= Math.exp(-8 * dt); cx += vx * dt; }
          cx = U.clamp(cx, 40, api.W - 40); for (var q = parts.length - 1; q >= 0; q--) { var pp = parts[q]; pp.x += pp.vx * dt; pp.y += pp.vy * dt; pp.vy += 400 * dt; pp.l -= dt; if (pp.l <= 0) parts.splice(q, 1); } clouds.forEach(function (cl) { cl.x += 12 * cl.s * dt; if (cl.x > api.W + 80) cl.x = -80; });
          spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(0.38, 1.05 - t * 0.012) * (0.7 + Math.random() * 0.6); }
          var ny = api.H - 60 - 46;
          for (var i = items.length - 1; i >= 0; i--) { var it = items[i]; it.y += it.vy * dt; it.x += Math.sin(t * 3 + it.sw) * 20 * dt; it.sw += dt;
            if (!it.done && it.y > ny - 10 && it.y < ny + 14 && Math.abs(it.x - cx) < 40) { it.done = true; items.splice(i, 1);
              if (it.k === 'bolt') { hearts--; flash = 0.3; burst(it.x, it.y, '#94a3b8', 14); api.sfx('lifelost'); say('Ouch! Gadget bolt! \u26A1', '#fca5a5'); if (hearts <= 0) api.gameOver(); }
              else { var p = it.k === 'gold' ? 3 : 1; api.addScore(p); caught++; burst(it.x, it.y, p > 1 ? '#fde047' : '#f9a8d4', p > 1 ? 22 : 12); api.sfx(p > 1 ? 'perfect' : 'point'); say(p > 1 ? 'GOLDEN PUP! +3' : 'Caught! +1', '#4ade80'); }
              continue; }
            if (it.y > api.H + 30) { items.splice(i, 1); if (it.k !== 'bolt') { hearts--; flash = 0.3; api.sfx('lifelost'); say('A pup got away! \uD83D\uDE22', '#fca5a5'); if (hearts <= 0) api.gameOver(); } } } },
        draw: function (c) { var W = api.W, H = api.H;
          drawScene(c, W, H);
          for (var i = 0; i < items.length; i++) { var it = items[i]; if (it.k === 'bolt') drawBolt(c, it.x, it.y, t * 6 + it.sw); else { c.fillStyle = 'rgba(0,0,0,' + Math.min(0.22, it.y / H * 0.25) + ')'; c.beginPath(); c.ellipse(it.x, H - 38, 14 * Math.min(1, it.y / H + 0.3), 4, 0, 0, 7); c.fill(); drawPup(c, it.x, it.y, it.c, W > 600 ? 1.5 : 1.15, it.k === 'gold', t + it.sw); } }
          c.save(); c.translate(cx, H - 60); var cs = W > 600 ? 1.35 : 1; c.scale(cs, cs); drawCandy(c, 0, 0); c.restore();
          parts.forEach(function (pp) { c.globalAlpha = Math.max(0, pp.l / 0.7); c.fillStyle = pp.c; c.beginPath(); c.arc(pp.x, pp.y, 3.5, 0, 7); c.fill(); }); c.globalAlpha = 1;
          for (var h = 0; h < 3; h++) U.heart(c, 22 + h * 26, 84, 22, h < hearts ? '#ff4f8b' : 'rgba(255,255,255,.35)');
          if (msg && msgT > 0) { c.globalAlpha = Math.min(1, msgT * 2); U.text(c, msg[0], W / 2, H * 0.36, 24, msg[1], 'center', '#000'); c.globalAlpha = 1; }
          if (flash > 0) { c.fillStyle = 'rgba(239,68,68,' + (flash * 1.2) + ')'; c.fillRect(0, 0, W, H); } },
        onDown: function (x) { drag = x; }, onMove: function (x, y, down) { if (down) drag = x; }, onUp: function () { drag = null; },
        onKey: function (k, down) { if (k === 'ArrowLeft' || k === 'a' || k === 'A') left = down; if (k === 'ArrowRight' || k === 'd' || k === 'D') right = down; }
      };
    }
  });
})();
