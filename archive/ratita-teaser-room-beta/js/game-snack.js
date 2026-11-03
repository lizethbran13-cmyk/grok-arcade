/* Grok Arcade - bonus game #12: Snack Stack. A pet-cafe catching game!
   Drag the tray left/right to catch falling pet snacks. They pile up on the tray, and a lopsided pile wobbles.
   Lean too far and the top snacks topple off! Carry the pile to a hungry pet at the side (Candy or Luna) to serve it:
   every snack scores, snacks the pet is craving score double, and tall piles get a height bonus.
   Never catch chocolate or onions (bad for pets): that costs a heart. 3 hearts. */
(function () {
  'use strict';
  var U = GA.MG.U;
  var SNACKS = {
    bone: { v: 1, c: '#f5ecd7', w: 1.0 }, fish: { v: 1, c: '#7cc8ff', w: 1.0 }, carrot: { v: 1, c: '#ff9a3c', w: 1.0 },
    cheese: { v: 2, c: '#ffd23b', w: 0.8 }, seed: { v: 1, c: '#d9a35b', w: 0.9 }, cupcake: { v: 4, c: '#ff8fd0', w: 0.22 },
    choc: { v: 0, c: '#6b3a1e', bad: 1, w: 0.0 }, onion: { v: 0, c: '#e9d8ff', bad: 1, w: 0.0 }
  };
  var GOOD = ['bone', 'fish', 'carrot', 'cheese', 'seed', 'cupcake'];
  var PETS = [{ id: 'candy', name: 'Candy', likes: ['bone', 'cheese', 'carrot'] }, { id: 'luna', name: 'Luna', likes: ['seed', 'cheese', 'carrot', 'fish'] }];
  function drawSnack(c, k, x, y, s, rot) {
    c.save(); c.translate(x, y); c.rotate(rot || 0); var S = SNACKS[k]; c.lineWidth = 2; c.strokeStyle = 'rgba(0,0,0,0.35)';
    if (k === 'bone') { c.fillStyle = S.c; U.rr(c, -s * 0.8, -s * 0.22, s * 1.6, s * 0.44, s * 0.2); c.fill(); [-1, 1].forEach(function (d) { c.beginPath(); c.arc(d * s * 0.8, -s * 0.2, s * 0.26, 0, 7); c.arc(d * s * 0.8, s * 0.2, s * 0.26, 0, 7); c.fill(); }); }
    else if (k === 'fish') { c.fillStyle = S.c; c.beginPath(); c.ellipse(-s * 0.1, 0, s * 0.7, s * 0.36, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(s * 0.5, 0); c.lineTo(s * 0.95, -s * 0.35); c.lineTo(s * 0.95, s * 0.35); c.closePath(); c.fill(); c.fillStyle = '#123'; c.beginPath(); c.arc(-s * 0.45, -s * 0.08, s * 0.08, 0, 7); c.fill(); }
    else if (k === 'carrot') { c.fillStyle = S.c; c.beginPath(); c.moveTo(-s * 0.85, 0); c.lineTo(s * 0.55, -s * 0.3); c.lineTo(s * 0.55, s * 0.3); c.closePath(); c.fill(); c.fillStyle = '#4ade80'; c.beginPath(); c.ellipse(s * 0.75, -s * 0.15, s * 0.28, s * 0.1, -0.5, 0, 7); c.ellipse(s * 0.75, s * 0.15, s * 0.28, s * 0.1, 0.5, 0, 7); c.fill(); }
    else if (k === 'cheese') { c.fillStyle = S.c; c.beginPath(); c.moveTo(-s * 0.8, s * 0.35); c.lineTo(s * 0.8, s * 0.35); c.lineTo(s * 0.8, -s * 0.15); c.lineTo(-s * 0.8, -s * 0.4); c.closePath(); c.fill(); c.fillStyle = '#e8a800'; c.beginPath(); c.arc(-s * 0.2, s * 0.05, s * 0.12, 0, 7); c.arc(s * 0.4, s * 0.15, s * 0.09, 0, 7); c.fill(); }
    else if (k === 'seed') { c.fillStyle = S.c; c.beginPath(); c.ellipse(0, 0, s * 0.8, s * 0.38, 0, 0, 7); c.fill(); c.strokeStyle = '#8a5a2b'; c.beginPath(); c.moveTo(-s * 0.6, 0); c.lineTo(s * 0.6, 0); c.stroke(); }
    else if (k === 'cupcake') { c.fillStyle = '#ff6fb0'; c.beginPath(); c.arc(0, -s * 0.12, s * 0.62, Math.PI, 0); c.fill(); c.fillStyle = '#c084fc'; c.beginPath(); c.moveTo(-s * 0.6, -s * 0.05); c.lineTo(s * 0.6, -s * 0.05); c.lineTo(s * 0.42, s * 0.45); c.lineTo(-s * 0.42, s * 0.45); c.closePath(); c.fill(); c.fillStyle = '#ff2d55'; c.beginPath(); c.arc(0, -s * 0.78, s * 0.16, 0, 7); c.fill(); c.shadowColor = '#ffe14d'; }
    else if (k === 'choc') { c.fillStyle = S.c; U.rr(c, -s * 0.75, -s * 0.38, s * 1.5, s * 0.76, s * 0.1); c.fill(); c.strokeStyle = '#3d1f0e'; c.beginPath(); c.moveTo(-s * 0.25, -s * 0.38); c.lineTo(-s * 0.25, s * 0.38); c.moveTo(s * 0.25, -s * 0.38); c.lineTo(s * 0.25, s * 0.38); c.moveTo(-s * 0.75, 0); c.lineTo(s * 0.75, 0); c.stroke(); }
    else if (k === 'onion') { c.fillStyle = S.c; c.beginPath(); c.arc(0, s * 0.08, s * 0.55, 0, 7); c.fill(); c.beginPath(); c.moveTo(-s * 0.15, -s * 0.4); c.lineTo(0, -s * 0.85); c.lineTo(s * 0.15, -s * 0.4); c.fill(); c.strokeStyle = '#b48ae0'; c.beginPath(); c.arc(0, s * 0.08, s * 0.3, -1.2, 1.2); c.stroke(); }
    if (S.bad) { c.strokeStyle = '#ff2d55'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, s * 0.95, 0, 7); c.moveTo(-s * 0.67, -s * 0.67); c.lineTo(s * 0.67, s * 0.67); c.stroke(); }
    c.restore();
  }
  function drawDog(c, x, y, sz, happy, t) {
    c.save(); c.translate(x, y); var k = sz / 100; c.scale(k, k);
    c.fillStyle = '#8b9099'; c.beginPath(); c.ellipse(0, 46, 40, 34, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(0, -2, 38, 34, 0, 0, 7); c.fill();
    c.fillStyle = '#6b7079'; c.beginPath(); c.moveTo(-34, -20); c.lineTo(-22, -48); c.lineTo(-10, -28); c.fill(); c.beginPath(); c.moveTo(34, -20); c.lineTo(22, -48); c.lineTo(10, -28); c.fill();
    c.fillStyle = '#eceef2'; c.beginPath(); c.ellipse(0, 18, 26, 20, 0, 0, 7); c.fill(); c.fillRect(-26, -16, 18, 6); c.fillRect(8, -16, 18, 6);
    c.fillStyle = '#222'; c.beginPath(); c.ellipse(0, 6, 7, 5, 0, 0, 7); c.fill();
    if (happy) { c.strokeStyle = '#222'; c.lineWidth = 4; c.beginPath(); c.arc(-14, -4, 6, Math.PI * 1.1, Math.PI * 1.9); c.arc(14, -4, 6, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.fillStyle = '#ff6b8a'; c.beginPath(); c.ellipse(0, 30, 7, 9 + Math.sin(t * 12) * 2, 0, 0, 7); c.fill(); }
    else { c.fillStyle = '#222'; c.beginPath(); c.arc(-14, -6, 5, 0, 7); c.arc(14, -6, 5, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(-12, -8, 2, 0, 7); c.arc(16, -8, 2, 0, 7); c.fill(); }
    c.fillStyle = '#ff4fd8'; U.rr(c, -26, 30, 52, 8, 4); c.fill();
    c.restore();
  }
  GA.MG.register({
    id: 'snack', name: 'Snack Stack', ticketDiv: 12,
    howTouch: 'Drag left/right to move the tray and catch falling snacks. Keep the pile balanced (catch near the middle!) and carry it to Candy or Luna at the sides to serve it. Craved snacks score double, tall piles get a bonus. NEVER catch chocolate or onions!',
    howKeys: 'Use \u2190 \u2192 (or A/D) to move the tray and catch snacks. Keep the pile balanced and carry it to Candy (left) or Luna (right) to serve. Craved snacks score double, tall piles get a bonus. Never catch chocolate or onions! 3 hearts.',
    create: function (api) {
      var t, tray, items, pile, lean, wob, hearts, falling, spawnT, parts, pops, served, endT, wants, keys, drag, hurtT, best;
      var L = {};
      function layout() { var W = api.W, H = api.H; L.W = W; L.H = H; L.floor = H - 40; L.trayY = H - 120; L.side = Math.max(70, Math.min(110, W * 0.2)); L.s = Math.max(18, Math.min(28, W * 0.06)); L.trayW = L.s * 4.2; }
      function pick() { var r = Math.random(), bad = Math.min(0.2, 0.08 + t * 0.0015); if (r < bad) return Math.random() < 0.6 ? 'choc' : 'onion'; var tot = 0, i; for (i = 0; i < GOOD.length; i++) tot += SNACKS[GOOD[i]].w; var x = Math.random() * tot; for (i = 0; i < GOOD.length; i++) { x -= SNACKS[GOOD[i]].w; if (x <= 0) return GOOD[i]; } return 'bone'; }
      function newWant(i) { var p = PETS[i]; wants[i] = p.likes[Math.floor(Math.random() * p.likes.length)]; }
      function spawn() { var m = L.side + L.s, x = U.rand(m, L.W - m); items.push({ k: pick(), x: x, y: -30, vy: U.rand(120, 160) + Math.min(220, t * 3.2), rot: U.rand(-1, 1), vr: U.rand(-2, 2) }); }
      function pop(x, y, s, col, big) { pops.push({ x: x, y: y, s: s, c: col, l: 1.2, big: !!big }); }
      function burst(x, y, col, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 7, sp = U.rand(60, 220); parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 90, l: U.rand(0.4, 0.9), c: col, sz: U.rand(2, 4.5) }); } }
      function pileTop() { return L.trayY - 8 - pile.length * L.s * 0.62; }
      function hurt(msg) { hearts--; hurtT = 0.6; api.sfx('lifelost'); pop(tray.x, L.trayY - 60, msg, '#ff6b86', true); if (hearts <= 0) { endT = 1.2; } }
      function topple(n, why) {
        n = Math.min(n, pile.length); if (!n) return;
        for (var i = 0; i < n; i++) { var p = pile.pop(); falling.push({ k: p.k, x: tray.x + p.off, y: pileTop(), vx: (lean > 0 ? 1 : -1) * U.rand(80, 200), vy: U.rand(-160, -60), rot: 0, vr: U.rand(-6, 6) }); }
        lean = pile.reduce(function (a, p) { return a + p.o * 0.32; }, 0); wob *= 0.3; api.sfx('crash'); pop(tray.x, pileTop() - 20, why || 'TOPPLE!', '#ffb020', true);
        if (n >= 3) hurt('\uD83D\uDC94 SPILLED!');
      }
      function serve(i) {
        if (!pile.length) return;
        var sum = 0, crave = 0; pile.forEach(function (p) { var v = SNACKS[p.k].v; if (p.k === wants[i] || p.k === 'cupcake') { v *= 2; crave++; } sum += v; });
        var h = pile.length, mult = h >= 10 ? 3 : h >= 6 ? 2 : 1, pts = sum * mult;
        api.addScore(pts); served++; best = Math.max(best, h);
        var px = i === 0 ? L.side * 0.5 : L.W - L.side * 0.5;
        burst(px, L.trayY - 40, '#ffe14d', 10 + h * 2); pop(px + (i === 0 ? 30 : -30), L.trayY - 120, '+' + pts + (mult > 1 ? ' x' + mult + '!' : ''), '#ffe14d', true);
        if (crave) pop(px + (i === 0 ? 30 : -30), L.trayY - 90, crave + ' craved!', '#ff8fd0');
        api.sfx(mult > 1 ? 'perfect' : 'eat'); if (GA.Prog && h >= 10) GA.Prog.event('snack10');
        pile = []; lean = 0; wob = 0; happy[i] = 1.4; newWant(i);
      }
      var happy = [0, 0];
      var inst = {
        reset: function () { layout(); t = 0; tray = { x: L.W / 2, vx: 0, tx: L.W / 2 }; items = []; pile = []; lean = 0; wob = 0; hearts = 3; falling = []; spawnT = 0.6; parts = []; pops = []; served = 0; endT = 0; wants = []; newWant(0); newWant(1); keys = {}; drag = null; hurtT = 0; best = 0; happy = [0, 0]; },
        resize: function () { var k = tray ? tray.x / Math.max(1, L.W) : 0.5; layout(); if (tray) { tray.x = tray.tx = k * L.W; } },
        botTo: function (x) { tray.tx = U.clamp(x, 0, L.W); },
        debug: function () { return { tray: tray.x, pile: pile.length, lean: lean, hearts: hearts, items: items.map(function (i) { return { k: i.k, x: i.x, y: i.y, bad: !!SNACKS[i.k].bad }; }), served: served, best: best, L: L, wants: wants.slice() }; },
        update: function (dt) {
          t += dt; hurtT = Math.max(0, hurtT - dt); happy[0] = Math.max(0, happy[0] - dt); happy[1] = Math.max(0, happy[1] - dt);
          parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; p.l -= dt; }); parts = parts.filter(function (p) { return p.l > 0; });
          pops.forEach(function (p) { p.y -= 36 * dt; p.l -= dt; }); pops = pops.filter(function (p) { return p.l > 0; });
          falling.forEach(function (f) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 700 * dt; f.rot += f.vr * dt; }); falling = falling.filter(function (f) { return f.y < L.H + 40; });
          if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
          if (!api.playing) return;
          // tray movement (keys or drag target); the heavier the pile, the more it sloshes
          var dir = (keys.ArrowLeft ? -1 : 0) + (keys.ArrowRight ? 1 : 0);
          if (dir) tray.tx = U.clamp(tray.x + dir * 60, 0, L.W);
          var prev = tray.x, k = 1 - Math.exp(-dt * 14);
          tray.x = U.clamp(tray.x + (tray.tx - tray.x) * k, L.trayW * 0.3, L.W - L.trayW * 0.3);
          var v = (tray.x - prev) / Math.max(dt, 1e-4); tray.vx = v;
          var acc = (v - (tray.lv || 0)); tray.lv = v;
          // wobble physics: lean drifts with the pile's offset, sudden moves slosh it
          var h = pile.length;
          if (h) { wob += (-acc * 0.0003 * h - wob * 3.2) * dt * 10; wob *= Math.exp(-dt * 1.4); var limit = Math.max(0.55, 1.6 - h * 0.08); var tilt = lean + wob; if (Math.abs(tilt) > limit) topple(Math.max(1, Math.ceil(h * 0.4))); else if (h >= 14) topple(4, 'TOO TALL!'); }
          // serve when reaching a side
          if (tray.x < L.side + L.trayW * 0.15 && pile.length) serve(0);
          else if (tray.x > L.W - L.side - L.trayW * 0.15 && pile.length) serve(1);
          // spawn + fall
          spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(0.38, 1.0 - t * 0.012) * U.rand(0.8, 1.2); }
          var top = pileTop();
          for (var i = items.length - 1; i >= 0; i--) {
            var it = items[i]; it.y += it.vy * dt; it.rot += it.vr * dt;
            var off = it.x - tray.x, half = L.trayW * 0.5 + L.s * 0.3;
            if (it.y >= top - L.s * 0.3 && it.y <= top + L.s * 0.6 && Math.abs(off) < half) {
              items.splice(i, 1);
              if (SNACKS[it.k].bad) { burst(it.x, it.y, '#ff2d55', 14); hurt(it.k === 'choc' ? '\uD83C\uDF6B Not for pets!' : '\uD83E\uDDC5 Yuck!'); if (pile.length) topple(Math.ceil(pile.length / 2), 'OOPS!'); continue; }
              var o = off / half; pile.push({ k: it.k, off: off * 0.5, o: o, rot: U.rand(-0.15, 0.15) }); lean += o * 0.32; wob += o * 0.15;
              api.sfx(it.k === 'cupcake' ? 'bonus' : 'point'); burst(it.x, top, SNACKS[it.k].c, 6);
              if (Math.abs(o) < 0.25) pop(tray.x, top - 30, 'Perfect!', '#4ade80');
              top = pileTop(); continue;
            }
            if (it.y > L.floor) { items.splice(i, 1); if (!SNACKS[it.k].bad) { api.sfx('drop'); burst(it.x, L.floor, '#c9a26b', 4); } }
          }
        },
        onDown: function (x) { drag = { x0: x, tx0: tray.tx }; },
        onMove: function (x, y, isDown) { if (!drag) return; if (!isDown) { drag = null; return; } tray.tx = U.clamp(drag.tx0 + (x - drag.x0) * 1.15, 0, L.W); },
        onUp: function () { drag = null; },
        onKey: function (k, down) { if (k === 'ArrowLeft' || k === 'ArrowRight') { keys[k] = down; if (!down) tray.tx = tray.x; } },
        draw: function (c) {
          var W = L.W, H = L.H, i, S = Math.min(1.25, W / 390);
          var bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#ffe6f4'); bg.addColorStop(1, '#ffd0a8'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
          // cafe wall stripes + bunting
          c.fillStyle = 'rgba(255,255,255,0.35)'; for (i = 0; i < W; i += 44) c.fillRect(i, 0, 22, L.floor);
          for (i = 0; i < 12; i++) { var bx = i * W / 11; c.fillStyle = ['#ff4fd8', '#3ff0ff', '#ffe14d', '#4ade80'][i % 4]; c.beginPath(); c.moveTo(bx - 12, 58); c.lineTo(bx + 12, 58); c.lineTo(bx, 78); c.closePath(); c.fill(); }
          c.fillStyle = '#b77945'; c.fillRect(0, L.floor, W, H - L.floor); c.fillStyle = '#9a6235'; for (i = 0; i < W; i += 60) c.fillRect(i, L.floor, 2, H - L.floor);
          // serving mats + pets
          [0, 1].forEach(function (s) {
            var px = s === 0 ? L.side * 0.5 : W - L.side * 0.5, py = L.trayY - 10, sz = Math.min(L.side * 0.95, 96);
            c.fillStyle = s === 0 ? 'rgba(255,79,216,0.18)' : 'rgba(63,240,255,0.2)'; U.rr(c, s === 0 ? 0 : W - L.side, 90, L.side, L.floor - 90, 14); c.fill();
            if (s === 0) drawDog(c, px, py, sz, happy[0] > 0, t); else if (GA.drawRat) GA.drawRat(c, 'luna', px, py - sz * 0.15, sz * 0.95, happy[1] > 0, t); else drawDog(c, px, py, sz, happy[1] > 0, t);
            // craving bubble
            var bxx = px, byy = py - sz * 0.95; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(bxx, byy, 30, 24, 0, 0, 7); c.fill(); c.beginPath(); c.arc(bxx + (s ? 12 : -12), byy + 30, 5, 0, 7); c.fill();
            drawSnack(c, wants[s], bxx, byy, 16, 0);
            U.text(c, PETS[s].name, px, L.floor + 18, 14 * S, '#5a2a10');
          });
          // falling snacks
          items.forEach(function (it) { if (it.k === 'cupcake') { c.shadowColor = '#ffe14d'; c.shadowBlur = 14; } drawSnack(c, it.k, it.x, it.y, L.s, it.rot); c.shadowBlur = 0; });
          falling.forEach(function (f) { c.globalAlpha = 0.85; drawSnack(c, f.k, f.x, f.y, L.s, f.rot); c.globalAlpha = 1; });
          // tray + pile (tilted by lean + wobble)
          var tilt = pile.length ? (lean + wob) : 0, ty = L.trayY;
          c.save(); c.translate(tray.x, ty);
          c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(0, L.floor - ty + 4, L.trayW * 0.45, 8, 0, 0, 7); c.fill();
          c.fillStyle = '#ffffff'; c.strokeStyle = '#d6336c'; c.lineWidth = 3; U.rr(c, -L.trayW / 2, -6, L.trayW, 12, 6); c.fill(); c.stroke();
          c.fillStyle = '#c0c4cc'; c.fillRect(-4, 6, 8, L.floor - ty - 6);
          for (i = 0; i < pile.length; i++) { var p = pile[i], yy = -8 - L.s * 0.62 * (i + 0.5), sway = tilt * (i + 1) * L.s * 0.22; drawSnack(c, p.k, p.off + sway, yy, L.s, p.rot + tilt * 0.25); }
          c.restore();
          if (pile.length >= 6) U.text(c, (pile.length >= 10 ? 'x3' : 'x2') + ' HEIGHT BONUS', tray.x, pileTop() - L.s - 8, 14 * S, '#7c3aed');
          var lim = Math.max(0.55, 1.6 - pile.length * 0.08), danger = pile.length ? Math.abs(tilt) / lim : 0;
          if (danger > 0.65 && Math.floor(t * 8) % 2 === 0) U.text(c, 'WOBBLY!', tray.x, pileTop() - L.s * 2, 18 * S, '#ff2d55');
          parts.forEach(function (p) { c.globalAlpha = Math.max(0, p.l / 0.9); c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, p.sz, 0, 7); c.fill(); }); c.globalAlpha = 1;
          pops.forEach(function (p) { c.globalAlpha = Math.min(1, p.l * 1.5); U.text(c, p.s, p.x, p.y, (p.big ? 26 : 18) * S, p.c, 'center', 'rgba(0,0,0,0.5)'); }); c.globalAlpha = 1;
          // HUD
          U.text(c, 'SNACK STACK', 14, 24, 18, '#d6336c', 'left');
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 26, 48, 22, i < hearts ? '#ff4f8b' : 'rgba(0,0,0,0.15)');
          U.text(c, String(api.score), W - 16, 30, 30, '#7c2d12', 'right');
          if (hurtT > 0) { c.fillStyle = 'rgba(255,45,85,' + (hurtT * 0.35) + ')'; c.fillRect(0, 0, W, H); }
          if (api.playing && t < 4) U.text(c, api.touch ? 'Drag to move the tray \u2194  Serve the pile at the sides!' : '\u2190 \u2192 to move  \u00b7  serve the pile at the sides!', W / 2, H * 0.36, 16 * S, '#7c2d12');
        }
      };
      return inst;
    }
  });
})();
