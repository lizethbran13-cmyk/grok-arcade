/* Grok Arcade - bonus game #25: Tail Swing (Grok Ratita Rescue tie-in).
   Luna zips through the giant kitchen with her Ratita Industries Grapple Tail. HOLD to grab the nearest glowing ring ahead and swing,
   LET GO to fly. Crumbs +1, cheese +5, every new ring +1. Fall to the floor and Candy the schnauzer boops you (lose a heart). 3 hearts. */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'swing', name: 'Tail Swing', ticketDiv: 3,
    howTouch: 'Luna has a Grapple Tail! HOLD the screen to grab the glowing ring ahead and swing. LET GO to fly forward. Grab crumbs (+1) and cheese (+5); every new ring is +1. Don\u2019t fall to the floor or Candy the dog will boop you! 3 hearts.',
    howKeys: 'Luna has a Grapple Tail! HOLD SPACE (or the mouse) to grab the glowing ring ahead and swing. LET GO to fly forward. Grab crumbs (+1) and cheese (+5); every new ring is +1. Don\u2019t fall to the floor or Candy the dog will boop you! 3 hearts.',
    create: function (api) {
      var t, hearts, P, rings, items, pops, link, hold, camX, msg, msgT, inv, grabs, lastRing, candyX, shake, L = {};
      function layout() { L.gy = api.H - Math.max(110, api.H * 0.17); L.top = Math.max(70, api.H * 0.1); L.s = Math.max(14, Math.min(22, api.W * 0.045)); L.g = api.H * 1.25; }
      function say(s, c) { msg = [s, c]; msgT = 1.1; }
      function burst(x, y, col, n) { for (var i = 0; i < (n || 12); i++) { var a = Math.random() * 6.28, s = 60 + Math.random() * 150; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.7, col: col }); } }
      function addRing(x) { var y = U.rand(L.top + 40, L.top + (L.gy - L.top) * 0.42); var r = { x: x, y: y, id: rings.length ? rings[rings.length - 1].id + 1 : 0 }; rings.push(r);
        // goodies along the swing arc below/after the ring
        var n = 2 + Math.floor(Math.random() * 3); for (var i = 0; i < n; i++) items.push({ x: x + 40 + i * 34, y: y + U.rand(110, 190), k: Math.random() < 0.12 ? 'cheese' : 'crumb', b: Math.random() * 6 });
        return r; }
      function attach(r) { link = r; var dx = P.x - r.x, dy = P.y - r.y; link.len = Math.max(70, Math.min(260, Math.hypot(dx, dy))); if (r.id > lastRing) { lastRing = r.id; grabs++; if (grabs > 1) { api.addScore(1); } if (grabs >= 25 && GA.Prog) GA.Prog.event('swing25'); } api.sfx('squeak'); }
      function tryGrab() { var best = null, bd = 1e9; for (var i = 0; i < rings.length; i++) { var r = rings[i]; if (r.x < P.x - 120 || r.x > P.x + api.W * 0.75) continue; var d = Math.hypot(r.x - P.x, r.y - P.y) + (r.x < P.x ? 120 : 0); if (d < 380 && d < bd) { bd = d; best = r; } } if (best) attach(best); }
      function hurt() { if (inv > 0) return; hearts--; inv = 1.5; shake = 0.35; api.sfx('lifelost'); say('BOOP! Candy got you!', '#ff6b6b'); burst(P.x, L.gy - 10, '#ffffff', 16);
        if (hearts <= 0) { api.gameOver(); return; }
        var r = null; for (var i = 0; i < rings.length; i++) if (rings[i].x > P.x - 40) { r = rings[i]; break; } r = r || rings[rings.length - 1];
        P.x = r.x - 60; P.y = r.y + 110; P.vx = 0; P.vy = 0; link = r; link.len = Math.hypot(P.x - r.x, P.y - r.y); L.go = false; L.wait = 0; }
      function drawRat(c, x, y, s, ang) {
        c.save(); c.translate(x, y); c.rotate(ang);
        c.strokeStyle = '#f9a8d4'; c.lineWidth = s * 0.18; c.lineCap = 'round'; c.beginPath(); c.moveTo(-s * 0.9, 0); c.quadraticCurveTo(-s * 1.6, -s * 0.2 + Math.sin(t * 9) * s * 0.3, -s * 2.0, -s * 0.6); c.stroke();
        c.fillStyle = '#a9afbd'; c.beginPath(); c.ellipse(0, 0, s, s * 0.68, 0, 0, 7); c.fill();
        c.fillStyle = '#c7ccd6'; c.beginPath(); c.ellipse(s * 0.85, -s * 0.2, s * 0.55, s * 0.45, 0, 0, 7); c.fill();
        c.fillStyle = '#f9a8d4'; c.beginPath(); c.arc(s * 0.6, -s * 0.7, s * 0.28, 0, 7); c.fill(); c.beginPath(); c.arc(s * 1.35, -s * 0.2, s * 0.12, 0, 7); c.fill();
        c.fillStyle = '#16101f'; c.beginPath(); c.arc(s * 1.0, -s * 0.32, s * 0.09, 0, 7); c.fill();
        c.fillStyle = '#ff4fa0'; U.rr(c, -s * 0.5, -s * 0.85, s * 0.8, s * 0.3, s * 0.1); c.fill(); c.fillStyle = '#ffd23f'; c.fillRect(-s * 0.3, -s * 0.95, s * 0.35, s * 0.14);
        c.restore();
      }
      function drawCandy(c, x, y, s) {
        var bob = Math.abs(Math.sin(t * 8)) * s * 0.12;
        c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 2, s * 1.4, s * 0.25, 0, 0, 7); c.fill();
        c.fillStyle = '#6b7280'; [-0.8, -0.3, 0.4, 0.9].forEach(function (k) { c.fillRect(x + k * s - s * 0.1, y - s * 0.6, s * 0.22, s * 0.6); });
        c.fillStyle = '#9ca3af'; c.beginPath(); c.ellipse(x, y - s * 0.8 - bob, s * 1.25, s * 0.55, 0, 0, 7); c.fill();
        c.fillStyle = '#9ca3af'; c.beginPath(); c.ellipse(x + s * 1.2, y - s * 1.4 - bob, s * 0.55, s * 0.5, 0, 0, 7); c.fill();
        c.fillStyle = '#e5e7eb'; c.beginPath(); c.ellipse(x + s * 1.6, y - s * 1.15 - bob, s * 0.38, s * 0.26, 0, 0, 7); c.fill();
        c.fillStyle = '#111'; c.beginPath(); c.arc(x + s * 1.95, y - s * 1.3 - bob, s * 0.1, 0, 7); c.fill(); c.beginPath(); c.arc(x + s * 1.35, y - s * 1.6 - bob, s * 0.08, 0, 7); c.fill();
        c.fillStyle = '#4b5563'; c.beginPath(); c.ellipse(x + s * 0.95, y - s * 1.8 - bob, s * 0.15, s * 0.32, -0.4, 0, 7); c.fill();
        c.fillStyle = '#ff4fa0'; c.fillRect(x + s * 0.75, y - s * 1.15 - bob, s * 0.15, s * 0.4);
        c.strokeStyle = '#9ca3af'; c.lineWidth = s * 0.18; c.beginPath(); c.moveTo(x - s * 1.2, y - s * 0.9 - bob); c.lineTo(x - s * 1.5, y - s * 1.4 - bob + Math.sin(t * 20) * s * 0.15); c.stroke();
      }
      return {
        reset: function () { layout(); t = 0; hearts = 3; rings = []; items = []; pops = []; msgT = 0; inv = 0; grabs = 0; lastRing = -1; shake = 0; hold = false; L.go = false; L.wait = 0;
          var x = api.W * 0.35; for (var i = 0; i < 8; i++) { addRing(x); x += U.rand(170, 230); } items.length = 0;
          var r0 = rings[0]; P = { x: r0.x - 90, y: r0.y + 120, vx: 0, vy: 0 }; attach(r0); camX = 0; candyX = 0; },
        resize: function () { layout(); },
        update: function (dt) {
          dt = Math.min(dt, 1 / 30);
          if (msgT > 0) msgT -= dt; if (shake > 0) shake -= dt;
          for (var i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.vy += 380 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          if (!api.playing) return; t += dt; if (inv > 0) inv -= dt;
          if (!L.go) { // grace period: hang still on the ring until the first press (or ~3s, so an idle round still ends)
            L.wait = (L.wait || 0) + dt; if (L.wait > 3) { L.go = true; hold = false; }             if (link) { P.x = link.x - link.len * 0.6; P.y = link.y + link.len * 0.8; P.vx = 0; P.vy = 0; } camX += (P.x - api.W * 0.3 - camX) * Math.min(1, dt * 4); return; }
          if (hold && !link) tryGrab();
          if (!hold && link) { link = null; P.vx *= 1.08; P.vy = Math.min(P.vy, 0) * 1.05 + P.vy * 0; if (P.vy > -40) P.vy -= 40; api.sfx('flap'); }
          P.vy += L.g * dt; P.x += P.vx * dt; P.y += P.vy * dt;
          if (link) { var dx = P.x - link.x, dy = P.y - link.y, d = Math.hypot(dx, dy) || 1; if (d > link.len) { var nx = dx / d, ny = dy / d; P.x = link.x + nx * link.len; P.y = link.y + ny * link.len; var vr = P.vx * nx + P.vy * ny; if (vr > 0) { P.vx -= vr * nx; P.vy -= vr * ny; } }
            // gentle pump so swings keep their energy and push forward
            var tx = -dy / d, ty = dx / d, vt = P.vx * tx + P.vy * ty, sg = vt >= 0 ? 1 : -1, k = (tx * sg > 0 ? 230 : 90) * sg; if (Math.abs(vt) < 5) k = tx > 0 ? 230 : -230; P.vx += tx * k * dt; P.vy += ty * k * dt; if (link.len > 80) link.len -= 25 * dt; }
          P.vx = U.clamp(P.vx, -500, 720);
          if (P.y < L.top) { P.y = L.top; if (P.vy < 0) P.vy = 0; }
          if (P.y > L.gy - L.s * 0.7) { P.y = L.gy - L.s * 0.7; hurt(); }
          // world stream
          var last = rings[rings.length - 1]; while (last.x < P.x + api.W * 1.6) { last = addRing(last.x + U.rand(170, 240) + Math.min(60, t * 1.2)); }
          while (rings.length > 3 && rings[0].x < camX - 200) rings.shift();
          for (i = items.length - 1; i >= 0; i--) { var o = items[i]; if (o.x < camX - 100) { items.splice(i, 1); continue; } if (Math.hypot(o.x - P.x, o.y - P.y) < L.s + 14) { items.splice(i, 1); if (o.k === 'cheese') { api.addScore(5); say('CHEESE! +5', '#ffd23f'); api.sfx('bonus'); burst(o.x, o.y, '#ffd23f', 14); } else { api.addScore(1); api.sfx('point'); burst(o.x, o.y, '#f5c26b', 6); } } }
          camX += (P.x - api.W * 0.3 - camX) * Math.min(1, dt * 4);
          candyX += ((P.x - 30) - candyX) * Math.min(1, dt * 1.5);
        },
        draw: function (c) {
          var W = api.W, H = api.H, gy = L.gy, i;
          c.save(); if (shake > 0) c.translate((Math.random() - 0.5) * 10 * shake / 0.35, (Math.random() - 0.5) * 8 * shake / 0.35);
          // kitchen wall: warm tiles with a parallax window and shelves
          c.fillStyle = '#fff1dd'; c.fillRect(-20, -20, W + 40, gy + 20);
          var tw = 46, ox = -((camX * 0.5) % tw); c.strokeStyle = 'rgba(214,160,120,.35)'; c.lineWidth = 1; for (var x = ox; x < W; x += tw) { c.beginPath(); c.moveTo(x, L.top); c.lineTo(x, gy); c.stroke(); } for (var y = L.top; y < gy; y += tw) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
          for (i = -1; i < 4; i++) { var wx = i * 420 - ((camX * 0.3) % 420); c.fillStyle = '#7dd3fc'; U.rr(c, wx + 60, L.top + 60, 140, 110, 10); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 6; c.stroke(); c.beginPath(); c.moveTo(wx + 130, L.top + 60); c.lineTo(wx + 130, L.top + 170); c.stroke();
            c.fillStyle = '#c08552'; c.fillRect(wx + 250, L.top + 120, 120, 10); c.fillStyle = ['#ef4444', '#3b82f6', '#22c55e'][(i + 9) % 3]; U.rr(c, wx + 262, L.top + 84, 26, 36, 6); c.fill(); c.fillStyle = '#ffd23f'; U.rr(c, wx + 300, L.top + 94, 30, 26, 6); c.fill(); }
          // ceiling rail
          c.fillStyle = '#9ca3af'; c.fillRect(-20, L.top - 14, W + 40, 10);
          c.save(); c.translate(-camX, 0);
          rings.forEach(function (r) { c.strokeStyle = '#94a3b8'; c.lineWidth = 2; c.beginPath(); c.moveTo(r.x, L.top - 6); c.lineTo(r.x, r.y - 10); c.stroke(); var on = link === r; c.strokeStyle = on ? '#ff4fa0' : '#3ff0ff'; c.lineWidth = 5; c.shadowColor = c.strokeStyle; c.shadowBlur = 12; c.beginPath(); c.arc(r.x, r.y, 10 + Math.sin(t * 5 + r.id) * 1.5, 0, 7); c.stroke(); c.shadowBlur = 0; });
          items.forEach(function (o) { var yy = o.y + Math.sin(t * 4 + o.b) * 4; if (o.k === 'cheese') { c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(o.x - 13, yy + 8); c.lineTo(o.x + 13, yy + 8); c.lineTo(o.x + 13, yy - 7); c.closePath(); c.fill(); c.fillStyle = 'rgba(160,90,0,.35)'; c.beginPath(); c.arc(o.x + 5, yy + 3, 2.5, 0, 7); c.fill(); } else { c.fillStyle = '#f5c26b'; c.beginPath(); c.arc(o.x, yy, 6, 0, 7); c.fill(); c.fillStyle = '#d9a04a'; c.beginPath(); c.arc(o.x + 2, yy - 1, 2, 0, 7); c.fill(); } });
          if (link) { c.strokeStyle = '#f9a8d4'; c.lineWidth = 3; c.beginPath(); c.moveTo(P.x - L.s * 0.8, P.y); c.lineTo(link.x, link.y); c.stroke(); }
          for (i = 0; i < pops.length; i++) { var p = pops[i]; c.globalAlpha = Math.max(0, p.life / 0.7); c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, 4, 0, 7); c.fill(); } c.globalAlpha = 1;
          c.restore();
          // counter-top floor + Candy patrolling below
          c.fillStyle = '#5b6b8c'; c.fillRect(-20, gy, W + 40, 10); c.fillStyle = '#f7f2e8'; c.fillRect(-20, gy + 10, W + 40, H - gy);
          var cs = 26, chk = -((camX) % (cs * 2)); for (var cx = chk; cx < W + cs * 2; cx += cs * 2) { c.fillStyle = '#f28c8c'; c.fillRect(cx, gy + 10, cs, cs); c.fillRect(cx + cs, gy + 10 + cs, cs, cs); }
          drawCandy(c, candyX - camX, gy + 10 + cs * 2 + 34, L.s * 1.3);
          var ang = link ? Math.atan2(link.y - P.y, link.x - P.x) - Math.PI / 2 + 0.6 : U.clamp(Math.atan2(P.vy, Math.max(60, P.vx)), -0.9, 0.9);
          if (!(inv > 0 && Math.floor(t * 12) % 2)) drawRat(c, P.x - camX, P.y, L.s, ang);
          c.restore();
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ff4f8b' : 'rgba(0,0,0,.25)');
          U.text(c, String(api.score), W - 16, 30, 30, '#fff', 'right', '#000');
          if (grabs > 1) U.text(c, 'RINGS ' + (grabs - 1), W - 16, 60, 15, '#3ff0ff', 'right', '#000');
          if (msgT > 0) U.text(c, msg[0], W / 2, 110, 22, msg[1], 'center', '#000');
          if (api.playing && (!L.go || t < 4)) U.text(c, api.touch ? 'HOLD to swing, LET GO to fly!' : 'HOLD SPACE to swing, LET GO to fly!', W / 2, H - 28, 17, '#fff', 'center', '#000');
        },
        dbg: function () { return { t: t, hearts: hearts, x: P.x, y: P.y, vx: P.vx, vy: P.vy, link: link ? link.id : -1, grabs: grabs, go: L.go, gy: L.gy, rings: rings.map(function (r) { return [r.x, r.y]; }) }; },
        onDown: function () { hold = true; L.go = true; },
        onMove: function () { },
        onUp: function () { hold = false; },
        onKey: function (k, down) { if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') { hold = down; if (down) L.go = true; } }
      };
    }
  });
})();
