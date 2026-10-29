/* Grok Arcade - bonus game #32: Chrono Courier (Ratita Preview Center tie-in, the cabinet stands in the Preview Center).
   Pi-rat runs the Ratita Industries time-mail desk. A parcel pops out of the Time Jumper in the middle; its stamp says which era it
   belongs to. Send it through the matching PORTAL: tap the portal (top / left / right / bottom) or press the arrow keys / WASD.
   Gold cheese parcels are worth 5. GLITCHY parcels (static + "???") must NOT be sent anywhere: wait and they fizzle by themselves.
   Every so often Lili's portals SHUFFLE places (a warning flashes first). A wrong portal, a parcel that runs out of time or a sent
   glitch costs one of Lili's 3 batteries. 60 seconds, it speeds up! */
(function () {
  'use strict';
  var U = GA.MG.U, ROUND = 60;
  var ERAS = [{ n: 'DINO TIMES', ic: '\uD83E\uDD95', c: '#4ade80' }, { n: '1983', ic: '\uD83D\uDD79\uFE0F', c: '#ff4fd8' }, { n: 'TODAY', ic: '\uD83C\uDFD9\uFE0F', c: '#fbbf24' }, { n: 'THE FUTURE', ic: '\uD83D\uDE80', c: '#5eead4' }];
  var DIRS = ['up', 'left', 'right', 'down'], KEYS = { arrowup: 0, w: 0, arrowleft: 1, a: 1, arrowright: 2, d: 2, arrowdown: 3, s: 3 };
  GA.CHRONO_TARGET = 30; // score for the Mini Time Jumper prize
  GA.MG.register({
    id: 'chrono', name: 'Chrono Courier', ticketDiv: 3,
    howTouch: 'Parcels pop out of the Time Jumper! Look at the STAMP and TAP the portal for that era (top, left, right or bottom). Gold cheese parcels = 5. Leave GLITCHY parcels (static, ???) alone, they fizzle by themselves. Watch out: the portals SHUFFLE!',
    howKeys: 'Parcels pop out of the Time Jumper! Look at the STAMP and press the ARROW (or WASD) for the portal with that era. Gold cheese parcels = 5. Leave GLITCHY parcels (static, ???) alone, they fizzle by themselves. Watch out: the portals SHUFFLE!',
    create: function (api) {
      var t, lives, cur, fly, pops, msg, msgT, combo, sent, order, shuffleT, warnT, glitchFx, L = {};
      function layout() { var W = api.W, H = api.H - (api.padH || 0); L.cx = W / 2; L.cy = H * 0.55; L.r = Math.min(W, H) * 0.34; L.pr = Math.min(64, Math.min(W, H) * 0.13); L.ps = Math.min(92, Math.min(W, H) * 0.2); }
      function portalPos(slot) { var d = DIRS[slot]; return d === 'up' ? [L.cx, L.cy - L.r] : d === 'down' ? [L.cx, L.cy + L.r] : d === 'left' ? [L.cx - L.r * 1.05, L.cy] : [L.cx + L.r * 1.05, L.cy]; }
      function say(s, col) { msg = [s, col]; msgT = 1.1; }
      function level() { return Math.min(1, t / ROUND); }
      function next() { var g = t > 6 && Math.random() < 0.12 + level() * 0.06, gold = !g && Math.random() < 0.08; cur = { era: Math.floor(Math.random() * 4), glitch: g, gold: gold, life: 0, max: g ? 1.9 : 3.2 - level() * 1.5, pop: 0 }; }
      function burst(x, y, col, n) { for (var i = 0; i < (n || 12); i++) { var a = Math.random() * 6.28, s = 60 + Math.random() * 140; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.6, col: col }); } }
      function miss(s) { lives--; combo = 0; api.sfx('lifelost'); say(s, '#ff6b6b'); glitchFx = 0.35; if (lives <= 0) { cur = null; api.gameOver(); } }
      function send(slot) {
        if (!api.playing || !cur || cur.pop < 0.15) return; var era = order[slot], p = portalPos(slot), c0 = cur;
        fly.push({ x: L.cx, y: L.cy, tx: p[0], ty: p[1], k: 0, c: c0 }); cur = null;
        if (c0.glitch) { miss('NOT the glitchy one! \u26A1'); }
        else if (era === c0.era) { sent++; combo++; var pts = c0.gold ? 5 : 1 + (combo >= 8 ? 1 : 0); api.addScore(pts); api.sfx(c0.gold ? 'perfect' : 'point'); burst(p[0], p[1], c0.gold ? '#ffd23f' : ERAS[era].c); if (c0.gold) say('\uD83E\uDDC0 GOLD CHEESE DELIVERED! +5', '#ffd23f'); else if (combo % 8 === 0) say(combo + ' ON TIME! Lili is impressed (quietly).', '#5eead4'); }
        else miss('Wrong era! That was for ' + ERAS[c0.era].n);
        if (api.playing) setTimeout(function () { if (api.playing && !cur) next(); }, 160);
      }
      function shuffle() { var o = order.slice(); for (var k = 0; k < 6; k++) { var i = Math.floor(Math.random() * 4), j = Math.floor(Math.random() * 4), x = o[i]; o[i] = o[j]; o[j] = x; } if (o.join() === order.join()) { var y = o[0]; o[0] = o[3]; o[3] = y; } order = o; api.sfx('point'); say('\uD83C\uDF00 PORTAL SHUFFLE!', '#a78bfa'); }
      function parcel(c, x, y, s, p, a) {
        c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = a == null ? 1 : a; var w = 92, h = 70, e = ERAS[p.era];
        if (p.glitch) { c.translate((Math.random() - 0.5) * 6, 0); }
        c.fillStyle = 'rgba(0,0,0,.3)'; U.rr(c, -w / 2 + 5, -h / 2 + 6, w, h, 8); c.fill();
        c.fillStyle = p.gold ? '#fcd34d' : p.glitch ? '#a855f7' : '#c08a4b'; U.rr(c, -w / 2, -h / 2, w, h, 8); c.fill();
        c.fillStyle = p.gold ? '#f59e0b' : p.glitch ? '#ff00ff' : '#8b5a2b'; c.fillRect(-6, -h / 2, 12, h);
        if (p.glitch) { for (var i = 0; i < 8; i++) { c.fillStyle = Math.random() < 0.5 ? '#000' : '#5eead4'; c.fillRect(-w / 2 + Math.random() * w, -h / 2 + Math.random() * h, 10 + Math.random() * 20, 3); } U.text(c, '???', 0, 2, 30, '#fff', 'center', '#ff00ff'); }
        else { c.fillStyle = '#fff'; U.rr(c, -w / 2 + 8, -h / 2 + 10, 48, 50, 6); c.fill(); c.strokeStyle = e.c; c.lineWidth = 4; c.stroke(); U.text(c, e.ic, -w / 2 + 32, 2, 28, '#000'); if (p.gold) U.text(c, '\uD83E\uDDC0', 26, 0, 28, '#000'); else U.text(c, 'RI', 26, 0, 20, '#fff'); }
        c.restore();
      }
      function piRat(c, x, y, r) { c.save(); c.translate(x, y); c.fillStyle = '#d6a26b'; c.beginPath(); c.arc(-r * 0.75, -r * 0.7, r * 0.5, 0, 7); c.arc(r * 0.75, -r * 0.7, r * 0.5, 0, 7); c.fill(); c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
        c.fillStyle = '#fbcfe8'; c.beginPath(); c.arc(-r * 0.75, -r * 0.7, r * 0.28, 0, 7); c.arc(r * 0.75, -r * 0.7, r * 0.28, 0, 7); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(-r * 0.35, -r * 0.1, r * 0.13, 0, 7); c.fill(); c.fillRect(r * 0.15, -r * 0.3, r * 0.45, r * 0.3); c.fillStyle = '#f472b6'; c.beginPath(); c.arc(0, r * 0.25, r * 0.14, 0, 7); c.fill();
        c.fillStyle = '#111827'; c.beginPath(); c.moveTo(-r * 0.9, -r * 0.55); c.quadraticCurveTo(0, -r * 1.6, r * 0.9, -r * 0.55); c.closePath(); c.fill(); U.text(c, '\u2620', 0, -r * 0.85, r * 0.45, '#fff'); c.restore(); }
      return {
        reset: function () { layout(); t = 0; lives = 3; cur = null; fly = []; pops = []; msgT = 0; combo = 0; sent = 0; order = [0, 1, 2, 3]; shuffleT = 14; warnT = 0; glitchFx = 0; next(); },
        resize: function () { layout(); },
        update: function (dt) {
          if (msgT > 0) msgT -= dt; if (glitchFx > 0) glitchFx -= dt;
          for (var i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.vy += 300 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          for (i = fly.length - 1; i >= 0; i--) { fly[i].k += dt * 5; if (fly[i].k >= 1) fly.splice(i, 1); }
          if (!api.playing) return;
          t += dt; if (t >= ROUND) { say('END OF SHIFT!', '#fff'); api.gameOver(); return; }
          if (t > 8) { shuffleT -= dt; if (shuffleT < 1.4 && warnT <= 0) warnT = 1.4; if (warnT > 0) { warnT -= dt; if (warnT <= 0) { shuffle(); shuffleT = 11 - level() * 4; } } }
          if (cur) { cur.pop = Math.min(1, cur.pop + dt * 5); cur.life += dt; if (cur.life >= cur.max) { var c0 = cur; cur = null; if (c0.glitch) { api.addScore(1); api.sfx('point'); say('Glitch fizzled. +1', '#a78bfa'); burst(L.cx, L.cy, '#a855f7', 8); } else miss('Too slow! The parcel time-jumped away.'); if (api.playing) next(); } }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i;
          var gr = c.createRadialGradient(L.cx, L.cy, 10, L.cx, L.cy, Math.max(W, H) * 0.7); gr.addColorStop(0, '#173b5a'); gr.addColorStop(1, '#0b0820'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
          c.strokeStyle = 'rgba(45,212,191,.12)'; c.lineWidth = 2; for (i = 1; i < 6; i++) { c.beginPath(); c.arc(L.cx, L.cy, L.r * i * 0.3 + (t * 30 % (L.r * 0.3)), 0, 7); c.stroke(); }
          for (i = 0; i < 4; i++) { var p = portalPos(i), e = ERAS[order[i]], warn = warnT > 0 && Math.sin(t * 30) > 0;
            c.save(); c.translate(p[0], p[1]); c.rotate(t * (i % 2 ? -1.2 : 1.2)); c.strokeStyle = warn ? '#fff' : e.c; c.lineWidth = 7; c.setLineDash([16, 8]); c.beginPath(); c.arc(0, 0, L.pr, 0, 7); c.stroke(); c.setLineDash([]); c.restore();
            c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.arc(p[0], p[1], L.pr - 8, 0, 7); c.fill(); U.text(c, e.ic, p[0], p[1] - 6, L.pr * 0.6, '#fff'); U.text(c, e.n, p[0], p[1] + L.pr * 0.5, Math.max(10, L.pr * 0.2), e.c, 'center', '#000');
            if (!api.touch) U.text(c, ['\u2191', '\u2190', '\u2192', '\u2193'][i], p[0] + L.pr * 0.75, p[1] - L.pr * 0.75, 16, 'rgba(255,255,255,.7)'); }
          // the little Time Jumper in the middle
          c.strokeStyle = '#5eead4'; c.lineWidth = 5; c.beginPath(); c.ellipse(L.cx, L.cy, L.ps * 0.75, L.ps * 0.3, t, 0, 7); c.stroke(); c.strokeStyle = '#fb7185'; c.beginPath(); c.ellipse(L.cx, L.cy, L.ps * 0.3, L.ps * 0.75, -t * 1.3, 0, 7); c.stroke();
          if (cur) { parcel(c, L.cx, L.cy, (0.5 + cur.pop * 0.5) * L.ps / 92, cur); var f = 1 - cur.life / cur.max; c.strokeStyle = f < 0.3 ? '#ff6b6b' : '#fde68a'; c.lineWidth = 6; c.beginPath(); c.arc(L.cx, L.cy, L.ps * 0.62, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); c.stroke(); }
          for (i = 0; i < fly.length; i++) { var q = fly[i]; parcel(c, q.x + (q.tx - q.x) * q.k, q.y + (q.ty - q.y) * q.k, (1 - q.k * 0.7) * L.ps / 92, q.c, 1 - q.k * 0.6); }
          for (i = 0; i < pops.length; i++) { var o = pops[i]; c.globalAlpha = Math.max(0, o.life / 0.6); c.fillStyle = o.col; c.fillRect(o.x - 3, o.y - 4, 6, 8); } c.globalAlpha = 1;
          piRat(c, 44, H - 50 - (api.padH || 0), 22);
          for (i = 0; i < 3; i++) { c.fillStyle = i < lives ? '#4ade80' : 'rgba(255,255,255,.2)'; U.rr(c, 18 + i * 34, 20, 26, 14, 3); c.fill(); c.fillRect(44 + i * 34, 24, 3, 6); }
          U.text(c, String(api.score), W - 16, 30, 30, '#fff', 'right', '#000');
          var tl = Math.max(0, ROUND - t), bw = Math.min(200, W * 0.4); c.fillStyle = 'rgba(0,0,0,.3)'; U.rr(c, W / 2 - bw / 2, 22, bw, 14, 7); c.fill(); c.fillStyle = tl < 10 ? '#ff6b6b' : '#5eead4'; U.rr(c, W / 2 - bw / 2, 22, Math.max(14, bw * tl / ROUND), 14, 7); c.fill();
          if (warnT > 0) U.text(c, '\u26A0 PORTALS ABOUT TO SHUFFLE \u26A0', W / 2, 62, 16, '#a78bfa', 'center', '#000');
          if (msgT > 0) U.text(c, msg[0], W / 2, L.cy + L.r + L.pr + 26 > H - 20 ? 90 : L.cy + L.r + L.pr + 26, 20, msg[1], 'center', '#000');
          if (api.playing && t < 3.5) U.text(c, api.touch ? 'TAP the portal that matches the stamp!' : 'ARROWS = portals \u00b7 match the stamp!', W / 2, 88, 15, '#fff', 'center', '#000');
          if (glitchFx > 0) { for (i = 0; i < 10; i++) { c.fillStyle = Math.random() < 0.5 ? 'rgba(255,0,255,.35)' : 'rgba(94,234,212,.35)'; c.fillRect(0, Math.random() * H, W, 4 + Math.random() * 12); } }
        },
        dbg: function () { return { t: t, lives: lives, sent: sent, combo: combo, order: order.slice(), cur: cur ? { era: cur.era, glitch: cur.glitch, gold: cur.gold, life: cur.life, max: cur.max, pop: cur.pop } : null, portals: [0, 1, 2, 3].map(function (i) { var p = portalPos(i); return { x: p[0], y: p[1], era: order[i] }; }) }; },
        onDown: function (x, y) { var best = -1, bd = 1e9; for (var i = 0; i < 4; i++) { var p = portalPos(i), d = Math.hypot(x - p[0], y - p[1]); if (d < bd) { bd = d; best = i; } } if (bd < L.pr * 1.6) send(best); },
        onKey: function (k, down) { if (!down) return; var i = KEYS[String(k).toLowerCase()]; if (i != null) send(i); }
      };
    }
  });
})();
