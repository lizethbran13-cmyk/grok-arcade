/* Grok Arcade - bonus game #8: Candy's Fetch. Lizeth's mini schnauzer Candy runs through the park.
   One touch: tap (or SPACE) to jump - hold for a higher jump. Catch tennis balls (+1) and golden bones (+3),
   hop over bushes and hydrants. 3 hearts; the park slowly speeds up. */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'fetch', name: 'Candy\'s Fetch', ticketDiv: 3,
    howTouch: 'Tap anywhere to make Candy jump (hold for a higher jump). Catch tennis balls and golden bones, hop over bushes and hydrants. 3 hearts!',
    howKeys: 'Press SPACE, \u2191 or click to make Candy jump (hold for a higher jump). Catch tennis balls and golden bones, hop over bushes and hydrants. 3 hearts!',
    create: function (api) {
      var dog, items, parts, pops, hearts, speed, dist, spawnT, t = 0, held = false, hurtT = 0, endT = 0, GY, S, playT = 0, cutPending = false;
      var GRAV = 2300, JUMP = 820, CUT = 0.45, MIN_HOLD = 0.1;
      function layout() {
        var W = api.W, H = api.H, oldGY = GY; S = U.clamp(Math.min(W, H) / 420, 0.75, 1.5); GY = H - Math.max(70, H * 0.17);
        if (dog) { dog.x = Math.min(W * 0.2, 150 * S + 40); if (dog.ground) dog.y = GY; else dog.y += GY - oldGY; }
        if (items && oldGY) items.forEach(function (o) { o.y += GY - oldGY; });
      }
      // narrow (phone portrait) screens show less of the park ahead, so the park scrolls slower there: same reaction time everywhere
      function speedK() { return U.clamp(api.W / 1000, 0.6, 1); }
      function jump() {
        if (!api.playing) return; held = true;
        if (dog.ground || dog.coyote > 0) { dog.vy = -JUMP * S; dog.ground = false; dog.coyote = 0; dog.jt = 0; cutPending = false; api.sfx('flap'); }
        else dog.buffer = 0.12;
      }
      // a quick tap still gives a useful hop (cut is applied after MIN_HOLD), holding gives the full jump
      function release() { held = false; if (dog.vy < 0) { if (dog.jt < MIN_HOLD) cutPending = true; else dog.vy *= CUT; } }
      function spawn() {
        var W = api.W, r = Math.random(), lastObs = items.filter(function (o) { return o.k === 'bush' || o.k === 'hyd'; }).pop();
        var gapOK = !lastObs || lastObs.x < W - Math.max(260 * S, speed * 0.95 + 60 * S); // always room to land and jump again
        if (r < 0.38 && gapOK && dist > 300) { items.push({ k: Math.random() < 0.5 ? 'bush' : 'hyd', x: W + 40, y: GY, w: (Math.random() < 0.5 ? 34 : 26) * S, h: (Math.random() < 0.5 ? 34 : 46) * S }); }
        else if (r < 0.9) { var hgt = [0.2, 0.38, 0.55][Math.floor(Math.random() * 3)]; items.push({ k: 'ball', x: W + 30, y: GY - 30 * S - hgt * 260 * S, r: 13 * S, bob: Math.random() * 6 }); }
        else items.push({ k: 'bone', x: W + 30, y: GY - (115 + Math.random() * 70) * S, r: 16 * S, bob: Math.random() * 6 });
        spawnT = (0.55 + Math.random() * 0.55) * (420 / speed);
      }
      function burst(x, y, col, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.28, s = 80 + Math.random() * 180; parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, l: 0.6, c: col }); } }
      function pop(x, y, s, c) { pops.push({ x: x, y: y, s: s, c: c, l: 0.9 }); }
      var inst = {
        reset: function () { dog = { x: 0, y: 0, vy: 0, ground: true, coyote: 0, buffer: 0, run: 0, jt: 1 }; layout(); dog.y = GY; items = []; parts = []; pops = []; hearts = 3; speed = 300 * speedK(); dist = 0; playT = 0; spawnT = 0.8; hurtT = 0; endT = 0; held = false; cutPending = false; },
        resize: function () { layout(); },
        debug: function () { return { dog: { x: dog.x, y: dog.y, vy: dog.vy, ground: dog.ground }, gy: GY, s: S, hearts: hearts, speed: speed, items: items.map(function (o) { return { k: o.k, x: o.x, y: o.y, w: o.w || o.r * 2, h: o.h || o.r * 2 }; }) }; },
        update: function (dt) {
          t += dt;
          parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; p.l -= dt; }); parts = parts.filter(function (p) { return p.l > 0; });
          pops.forEach(function (p) { p.y -= 40 * dt; p.l -= dt; }); pops = pops.filter(function (p) { return p.l > 0; });
          if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
          if (!api.playing) { dog.run += dt * 6; return; }
          playT += dt; speed = Math.min(620, 300 + playT * 8) * speedK(); dist += speed * dt; dog.run += dt * speed / 40;
          if (hurtT > 0) hurtT -= dt;
          // dog physics (variable jump height, coyote time, jump buffer)
          if (!dog.ground) {
            dog.jt += dt; if (cutPending && dog.jt >= MIN_HOLD) { cutPending = false; if (dog.vy < 0) dog.vy *= CUT; }
            dog.vy += GRAV * S * dt * (dog.vy > 0 ? 1.25 : 1); dog.y += dog.vy * dt;
            if (dog.y >= GY) { dog.y = GY; dog.vy = 0; dog.ground = true; if (dog.buffer > 0) { var wasHeld = held; dog.buffer = 0; jump(); held = wasHeld; if (!wasHeld) release(); } }
          }
          else dog.coyote = 0.08;
          if (dog.buffer > 0) dog.buffer -= dt; if (!dog.ground && dog.coyote > 0) dog.coyote -= dt;
          spawnT -= dt; if (spawnT <= 0) spawn();
          var bx = dog.x, by = dog.y - 22 * S, bw = 46 * S, bh = 34 * S, px = dog.x + 10 * S, py = dog.y - 30 * S, pw = 72 * S, ph = 56 * S;
          for (var i = items.length - 1; i >= 0; i--) {
            var o = items[i]; o.x -= speed * dt;
            if (o.k === 'ball' || o.k === 'bone') {
              var oy = o.y + Math.sin(t * 4 + o.bob) * 4;
              if (Math.abs(o.x - px) < pw / 2 + o.r && Math.abs(oy - py) < ph / 2 + o.r) {
                var pts = o.k === 'bone' ? 3 : 1; api.addScore(pts); api.sfx(o.k === 'bone' ? 'perfect' : 'point');
                burst(o.x, oy, o.k === 'bone' ? '#ffd23b' : '#d7ff3b', 10); pop(o.x, oy - 20, '+' + pts, o.k === 'bone' ? '#ffd23b' : '#eaff7a'); items.splice(i, 1); continue;
              }
            } else if (!o.hit && hurtT <= 0 && Math.abs(o.x - bx) < (o.w + bw) / 2 - 8 * S && dog.y > GY - o.h + 6 * S) {
              o.hit = true; hearts--; hurtT = 1.2; api.sfx('crash'); burst(dog.x, dog.y - 20, '#ff6b8a', 14); pop(dog.x, dog.y - 70 * S, hearts > 0 ? 'OUCH!' : 'TIRED!', '#ff6b8a');
              if (hearts <= 0) endT = 0.9;
            }
            if (o.x < -80) items.splice(i, 1);
          }
        },
        onDown: function () { jump(); },
        onUp: function () { release(); },
        onKey: function (k, down) { if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Enter') { if (down) jump(); else release(); } },
        draw: function (c) {
          var W = api.W, H = api.H, i;
          var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7fd3ff'); g.addColorStop(0.7, '#c9f0ff'); c.fillStyle = g; c.fillRect(0, 0, W, H);
          // sun + clouds + hills (parallax)
          c.fillStyle = '#fff3a0'; c.beginPath(); c.arc(W * 0.82, H * 0.16, 34 * S, 0, 7); c.fill();
          c.fillStyle = 'rgba(255,255,255,0.9)'; for (i = 0; i < 4; i++) { var cx = ((i * 260 - dist * 0.08) % (W + 300) + W + 300) % (W + 300) - 150, cy = H * 0.12 + (i % 2) * 50 * S; c.beginPath(); c.arc(cx, cy, 24 * S, 0, 7); c.arc(cx + 26 * S, cy - 10 * S, 30 * S, 0, 7); c.arc(cx + 56 * S, cy, 22 * S, 0, 7); c.fill(); }
          c.fillStyle = '#8fdc7a'; c.beginPath(); c.moveTo(0, GY); for (i = 0; i <= 20; i++) { var hx = i / 20 * W; c.lineTo(hx, GY - 60 * S - Math.sin(i * 0.9 + dist * 0.002) * 26 * S); } c.lineTo(W, GY); c.fill();
          c.fillStyle = '#5cc85a'; c.fillRect(0, GY, W, H - GY); c.fillStyle = '#4fb34e'; for (i = 0; i < 30; i++) { var gx = ((i * 57 - dist) % (W + 60) + W + 60) % (W + 60) - 30; c.fillRect(gx, GY + 8 + (i % 3) * 14, 18, 4); }
          c.fillStyle = '#e8c98f'; c.fillRect(0, GY - 2, W, 6);
          // items
          items.forEach(function (o) {
            if (o.k === 'bush') { c.fillStyle = '#2f9a45'; c.beginPath(); c.arc(o.x - o.w * 0.25, o.y - o.h * 0.45, o.w * 0.45, 0, 7); c.arc(o.x + o.w * 0.25, o.y - o.h * 0.45, o.w * 0.45, 0, 7); c.arc(o.x, o.y - o.h * 0.7, o.w * 0.5, 0, 7); c.fill(); c.fillStyle = '#ff6bd6'; c.beginPath(); c.arc(o.x - 5, o.y - o.h * 0.7, 3, 0, 7); c.arc(o.x + 7, o.y - o.h * 0.45, 3, 0, 7); c.fill(); }
            else if (o.k === 'hyd') { c.fillStyle = '#ff3b4f'; U.rr(c, o.x - o.w / 2, o.y - o.h, o.w, o.h, 6); c.fill(); c.fillStyle = '#c21f33'; c.fillRect(o.x - o.w / 2 - 4, o.y - o.h * 0.65, o.w + 8, 7); c.beginPath(); c.arc(o.x, o.y - o.h, o.w / 2, Math.PI, 0); c.fill(); }
            else { var oy = o.y + Math.sin(t * 4 + o.bob) * 4;
              if (o.k === 'ball') { c.fillStyle = '#d7ff3b'; c.beginPath(); c.arc(o.x, oy, o.r, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(o.x - o.r * 0.9, oy, o.r * 0.8, -1, 1); c.stroke(); c.beginPath(); c.arc(o.x + o.r * 0.9, oy, o.r * 0.8, 2.14, 4.14); c.stroke(); }
              else { c.save(); c.translate(o.x, oy); c.rotate(Math.sin(t * 3) * 0.3); c.shadowColor = '#ffd23b'; c.shadowBlur = 14; c.fillStyle = '#ffd23b'; c.fillRect(-o.r * 0.8, -o.r * 0.22, o.r * 1.6, o.r * 0.44); [-1, 1].forEach(function (sx) { c.beginPath(); c.arc(sx * o.r * 0.85, -o.r * 0.25, o.r * 0.32, 0, 7); c.arc(sx * o.r * 0.85, o.r * 0.25, o.r * 0.32, 0, 7); c.fill(); }); c.restore(); }
            }
          });
          // Candy the mini schnauzer (salt & pepper coat, white beard + eyebrows)
          var dx = dog.x, dy = dog.y, s = S, leg = dog.ground ? Math.sin(dog.run) * 7 * s : 4 * s;
          if (!(hurtT > 0 && Math.floor(hurtT * 12) % 2)) {
            c.save(); c.translate(dx, dy);
            c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(0, GY - dy + 2, 26 * s, 6 * s, 0, 0, 7); c.fill();
            c.fillStyle = '#5d6168'; [-15, -8, 9, 16].forEach(function (lx, k) { c.fillRect(lx * s - 3 * s, -16 * s + (k % 2 ? leg : -leg) * 0.5, 6 * s, 16 * s); });
            c.fillStyle = '#d9dade'; [-15, -8, 9, 16].forEach(function (lx, k) { c.fillRect(lx * s - 3 * s, -4 * s + (k % 2 ? leg : -leg) * 0.5, 6 * s, 4 * s); });
            c.fillStyle = '#7b8088'; U.rr(c, -24 * s, -38 * s, 46 * s, 24 * s, 10 * s); c.fill();
            c.fillStyle = '#9ea3ab'; U.rr(c, -20 * s, -26 * s, 38 * s, 12 * s, 6 * s); c.fill();
            c.strokeStyle = '#5d6168'; c.lineWidth = 5 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(-22 * s, -34 * s); c.lineTo(-30 * s, -46 * s + Math.sin(t * 18) * 3 * s); c.stroke();
            c.save(); c.translate(24 * s, -40 * s); c.rotate(dog.ground ? 0 : U.clamp(dog.vy / 3000, -0.3, 0.3));
            c.fillStyle = '#7b8088'; U.rr(c, -12 * s, -14 * s, 24 * s, 22 * s, 7 * s); c.fill();
            c.fillStyle = '#9ea3ab'; U.rr(c, 6 * s, -6 * s, 16 * s, 12 * s, 4 * s); c.fill();
            c.fillStyle = '#eceef2'; c.beginPath(); c.moveTo(6 * s, 4 * s); c.lineTo(23 * s, 4 * s); c.lineTo(18 * s, 16 * s); c.lineTo(9 * s, 14 * s); c.fill();
            c.fillStyle = '#eceef2'; c.fillRect(-2 * s, -12 * s, 13 * s, 4 * s);
            c.fillStyle = '#111'; c.beginPath(); c.arc(4 * s, -6 * s, 2.6 * s, 0, 7); c.arc(22 * s, -2 * s, 3.4 * s, 0, 7); c.fill();
            c.fillStyle = '#4e5259'; c.beginPath(); c.moveTo(-10 * s, -12 * s); c.lineTo(-4 * s, -24 * s); c.lineTo(1 * s, -12 * s); c.fill();
            c.fillStyle = '#ff7ab6'; c.fillRect(-8 * s, 6 * s, 14 * s, 4 * s);
            c.restore(); c.restore();
          }
          parts.forEach(function (p) { c.globalAlpha = Math.max(0, p.l / 0.6); c.fillStyle = p.c; c.fillRect(p.x - 3, p.y - 3, 6, 6); }); c.globalAlpha = 1;
          pops.forEach(function (p) { c.globalAlpha = Math.min(1, p.l * 2); U.text(c, p.s, p.x, p.y, 26 * S, p.c, 'center', '#000'); }); c.globalAlpha = 1;
          // HUD
          U.text(c, 'CANDY\'S FETCH', 20, 32, 20, '#ff6bd6', 'left');
          for (i = 0; i < 3; i++) { var hx2 = W / 2 - 34 + i * 34; c.fillStyle = i < hearts ? '#ff4f7a' : 'rgba(0,0,0,0.2)'; c.beginPath(); c.moveTo(hx2, 40); c.bezierCurveTo(hx2 - 16, 28, hx2 - 10, 14, hx2, 22); c.bezierCurveTo(hx2 + 10, 14, hx2 + 16, 28, hx2, 40); c.fill(); }
          U.text(c, String(api.score), W - 26, 34, 32, '#fff', 'right', 'rgba(0,0,0,0.4)');
          if (api.playing && dist < 900) U.text(c, api.touch ? 'Tap to jump! Hold = higher' : 'SPACE / click to jump! Hold = higher', W / 2, Math.min(H * 0.35, GY - 200 * S), 20, '#1b4d8a');
        }
      };
      return inst;
    }
  });
})();
