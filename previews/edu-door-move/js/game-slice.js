/* Grok Arcade - bonus game #10: Neon Slice. Neon fruit flies up from the bottom: swipe (or drag the mouse) through it to slice it.
   Slice several with one swipe for a COMBO, grab golden star fruit (+5), and don't touch the glitch bombs.
   3 hearts: you lose one for each fruit that falls back down and for each bomb you slice. */
(function () {
  'use strict';
  var U = GA.MG.U;
  var KINDS = {
    melon: { r: 30, skin: '#2fd47a', skin2: '#147a44', flesh: '#ff4f7a', pts: 1 },
    orange: { r: 24, skin: '#ff9a2e', skin2: '#c45a00', flesh: '#ffd08a', pts: 1 },
    berry: { r: 20, skin: '#ff4fd8', skin2: '#8a1a7a', flesh: '#ffc2f0', pts: 1 },
    lime: { r: 22, skin: '#b8ff3b', skin2: '#5a9a10', flesh: '#eaffb0', pts: 1 },
    plum: { r: 23, skin: '#8b5cf6', skin2: '#3b1a8a', flesh: '#e9d5ff', pts: 1 },
    star: { r: 22, skin: '#ffe14d', skin2: '#c98a00', flesh: '#fff6c0', pts: 5 }
  };
  var FRUITS = ['melon', 'orange', 'berry', 'lime', 'plum'];
  GA.MG.register({
    id: 'slice', name: 'Neon Slice', ticketDiv: 4,
    howTouch: 'Swipe your finger through the flying fruit to slice it! Slice 3+ in one swipe for a COMBO. Golden stars = +5. Don\u2019t slice the bombs, and don\u2019t let fruit fall. 3 hearts!',
    howKeys: 'Click and drag the mouse through the flying fruit to slice it! Slice 3+ in one swipe for a COMBO. Golden stars = +5. Don\u2019t slice the bombs, and don\u2019t let fruit fall. 3 hearts!',
    create: function (api) {
      var items, halves, parts, pops, trail, hearts, t, playT, spawnT, stroke, drops, flash, endT, S, G, down = false, last = null, lastCombo = 0;
      function layout() { S = U.clamp(Math.min(api.W, api.H) / 420, 0.8, 1.45); G = api.H * 1.05; }
      function launch(kind, xFrac) {
        var W = api.W, H = api.H, K = KINDS[kind] || { r: 24 }, r = (kind === 'bomb' ? 24 : K.r) * S;
        var x = U.clamp(xFrac * W, r + 10, W - r - 10), apex = H * U.rand(0.14, 0.42), vy = -Math.sqrt(2 * G * (H + r - apex));
        var tAir = 2 * -vy / G, tx = U.clamp(W * U.rand(0.25, 0.75), r, W - r), vx = (tx - x) / tAir;
        items.push({ k: kind, x: x, y: H + r, vx: vx, vy: vy, r: r, rot: Math.random() * 6, spin: U.rand(-3, 3), cut: false, id: Math.random() });
      }
      function wave() {
        var lvl = Math.min(6, 1 + Math.floor(playT / 12)), n = 1 + Math.floor(Math.random() * Math.min(4, 1 + lvl * 0.6));
        for (var i = 0; i < n; i++) {
          var r = Math.random(), k = FRUITS[Math.floor(Math.random() * FRUITS.length)];
          if (playT > 8 && r < 0.1 + lvl * 0.025) k = 'bomb'; else if (r > 0.94) k = 'star';
          launch(k, (i + 0.5) / n * 0.8 + 0.1 + U.rand(-0.06, 0.06));
        }
        spawnT = U.rand(1.15, 1.7) * Math.max(0.55, 1 - playT / 120);
      }
      function burst(x, y, col, n, sp) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.28, s = (sp || 160) * (0.4 + Math.random()); parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, l: 0.7, c: col, sz: 3 + Math.random() * 4 }); } }
      function pop(x, y, s, c, big) { pops.push({ x: x, y: y, s: s, c: c, l: 1, big: !!big }); }
      function hurt(x, y, why) {
        if (endT > 0) return; hearts--; flash = 0.35; api.sfx(why === 'bomb' ? 'crash' : 'miss');
        pop(U.clamp(x, 60, api.W - 60), U.clamp(y, 90, api.H - 40), why === 'bomb' ? 'BOOM!' : 'DROPPED!', '#ff4f6a', why === 'bomb');
        if (navigator.vibrate && why === 'bomb') try { navigator.vibrate(90); } catch (e) {}
        if (hearts <= 0) { hearts = 0; endT = 1.0; }
      }
      function slice(o, ang) {
        o.cut = true;
        if (o.k === 'bomb') { burst(o.x, o.y, '#ff3b4f', 24, 260); burst(o.x, o.y, '#ffe14d', 14, 200); hurt(o.x, o.y, 'bomb'); return; }
        var K = KINDS[o.k]; api.addScore(K.pts); api.sfx(o.k === 'star' ? 'perfect' : 'point');
        var nx = Math.cos(ang + Math.PI / 2), ny = Math.sin(ang + Math.PI / 2);
        [1, -1].forEach(function (sd) { halves.push({ k: o.k, x: o.x, y: o.y, vx: o.vx * 0.5 + nx * sd * 90, vy: Math.min(o.vy, 0) * 0.3 + ny * sd * 90 - 60, r: o.r, ang: ang, side: sd, spin: sd * U.rand(2, 4), rot: 0, l: 1.6 }); });
        burst(o.x, o.y, K.flesh, 12); burst(o.x, o.y, K.skin, 6);
        if (o.k === 'star') pop(o.x, o.y - o.r, '+5', '#ffe14d');
        stroke.n++; stroke.pts += K.pts; stroke.t = 0.28;
      }
      function endStroke() {
        if (stroke.n >= 3) { var b = stroke.n; api.addScore(b); api.sfx('level'); pop(api.W / 2, api.H * 0.3, 'COMBO x' + stroke.n + '!  +' + b, '#3ff0ff', true); }
        if (stroke.n > lastCombo) lastCombo = stroke.n;
        if (stroke.n >= 2 && GA.Prog) GA.Prog.event('sliceCombo', stroke.n);
        stroke = { n: 0, pts: 0, t: 0 };
      }
      function segHit(x0, y0, x1, y1) {
        var dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy; if (L2 < 4) return;
        var ang = Math.atan2(dy, dx);
        for (var i = 0; i < items.length; i++) {
          var o = items[i]; if (o.cut) continue;
          var tt = U.clamp(((o.x - x0) * dx + (o.y - y0) * dy) / L2, 0, 1), px = x0 + dx * tt - o.x, py = y0 + dy * tt - o.y;
          if (px * px + py * py < (o.r + 6) * (o.r + 6)) slice(o, ang);
        }
      }
      function move(x, y) {
        var now = t; if (!down) return;
        if (last) segHit(last.x, last.y, x, y);
        last = { x: x, y: y }; trail.push({ x: x, y: y, t: now });
      }
      var inst = {
        reset: function () { layout(); items = []; halves = []; parts = []; pops = []; trail = []; hearts = 3; t = 0; playT = 0; spawnT = 0.6; stroke = { n: 0, pts: 0, t: 0 }; drops = 0; flash = 0; endT = 0; down = false; last = null; lastCombo = 0; inst._clean = -1; },
        resize: function () { layout(); },
        debug: function () { return { hearts: hearts, drops: drops, combo: lastCombo, playT: playT, items: items.map(function (o) { return { k: o.k, x: o.x, y: o.y, vx: o.vx, vy: o.vy, r: o.r, cut: o.cut }; }) }; },
        update: function (dt) {
          t += dt;
          parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.l -= dt; }); parts = parts.filter(function (p) { return p.l > 0; });
          pops.forEach(function (p) { p.y -= 30 * dt; p.l -= dt * 0.9; }); pops = pops.filter(function (p) { return p.l > 0; });
          halves.forEach(function (h) { h.x += h.vx * dt; h.y += h.vy * dt; h.vy += G * dt; h.rot += h.spin * dt; h.l -= dt; }); halves = halves.filter(function (h) { return h.l > 0 && h.y < api.H + 80; });
          trail = trail.filter(function (p) { return t - p.t < 0.16; });
          if (flash > 0) flash -= dt;
          if (stroke.t > 0) { stroke.t -= dt; if (stroke.t <= 0 && stroke.n) endStroke(); }
          if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
          if (!api.playing) return;
          playT += dt; spawnT -= dt; if (spawnT <= 0) wave();
          for (var i = items.length - 1; i >= 0; i--) {
            var o = items[i]; o.x += o.vx * dt; o.y += o.vy * dt; o.vy += G * dt; o.rot += o.spin * dt;
            if (o.x < o.r && o.vx < 0) o.vx = -o.vx; if (o.x > api.W - o.r && o.vx > 0) o.vx = -o.vx;
            if (o.cut) { items.splice(i, 1); continue; }
            if (o.vy > 0 && o.y > api.H + o.r + 4) { items.splice(i, 1); if (o.k !== 'bomb') { drops++; hurt(o.x, api.H - 40, 'drop'); } }
          }
          if (drops === 0 && GA.Prog && api.score > 0 && Math.floor(api.score) !== inst._clean) { inst._clean = api.score; GA.Prog.event('sliceClean', api.score); }
        },
        onDown: function (x, y) { down = true; last = { x: x, y: y }; trail = [{ x: x, y: y, t: t }]; if (stroke.n) endStroke(); },
        onMove: function (x, y, isDown) { if (!isDown) { if (down) inst.onUp(); return; } if (!down) { down = true; last = { x: x, y: y }; } move(x, y); },
        onUp: function () { down = false; last = null; if (stroke.n) stroke.t = Math.min(stroke.t, 0.08); },
        draw: function (c) {
          var W = api.W, H = api.H, i;
          var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#12062e'); g.addColorStop(1, '#2a0c4a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
          c.strokeStyle = 'rgba(63,240,255,0.08)'; c.lineWidth = 1; for (i = 0; i < W; i += 40) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, H); c.stroke(); } for (i = 0; i < H; i += 40) { c.beginPath(); c.moveTo(0, i); c.lineTo(W, i); c.stroke(); }
          // halves
          halves.forEach(function (h) {
            var K = KINDS[h.k]; c.save(); c.globalAlpha = Math.min(1, h.l * 1.5); c.translate(h.x, h.y); c.rotate(h.ang + h.rot);
            c.beginPath(); c.arc(0, 0, h.r, h.side > 0 ? 0 : Math.PI, h.side > 0 ? Math.PI : Math.PI * 2); c.closePath(); c.fillStyle = K.skin; c.fill();
            c.beginPath(); c.arc(0, 0, h.r * 0.82, h.side > 0 ? 0 : Math.PI, h.side > 0 ? Math.PI : Math.PI * 2); c.closePath(); c.fillStyle = K.flesh; c.fill();
            if (h.k === 'melon') { c.fillStyle = '#1b1030'; for (var s = -2; s <= 2; s++) { c.beginPath(); c.ellipse(s * h.r * 0.28, h.side * h.r * 0.38, 2, 3.4, 0, 0, 7); c.fill(); } }
            c.restore();
          });
          // whole fruit + bombs
          items.forEach(function (o) {
            c.save(); c.translate(o.x, o.y);
            if (o.k === 'bomb') {
              c.shadowColor = '#ff3b4f'; c.shadowBlur = 18 + Math.sin(t * 12) * 6;
              var bg = c.createRadialGradient(-o.r * 0.35, -o.r * 0.35, 2, 0, 0, o.r); bg.addColorStop(0, '#5a5a6e'); bg.addColorStop(1, '#0d0d14'); c.fillStyle = bg; c.beginPath(); c.arc(0, 0, o.r, 0, 7); c.fill(); c.shadowBlur = 0;
              c.rotate(o.rot * 0.2); c.fillStyle = '#ff3b4f'; c.font = 'bold ' + Math.round(o.r * 0.9) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('\u2716', 0, 1);
              c.strokeStyle = '#c9a36b'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -o.r); c.quadraticCurveTo(o.r * 0.4, -o.r * 1.4, o.r * 0.2, -o.r * 1.6); c.stroke();
              c.fillStyle = Math.sin(t * 30) > 0 ? '#ffe14d' : '#ff7a3d'; c.beginPath(); c.arc(o.r * 0.2, -o.r * 1.62, 4, 0, 7); c.fill();
            } else {
              var K = KINDS[o.k]; c.rotate(o.rot); c.shadowColor = K.skin; c.shadowBlur = 16;
              if (o.k === 'star') { c.fillStyle = K.skin; c.beginPath(); for (var q = 0; q < 10; q++) { var a = -Math.PI / 2 + q * Math.PI / 5, rr = q % 2 ? o.r * 0.5 : o.r * 1.1; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); c.shadowBlur = 0; }
              else {
                var fg = c.createRadialGradient(-o.r * 0.35, -o.r * 0.4, o.r * 0.1, 0, 0, o.r * 1.05); fg.addColorStop(0, '#ffffff'); fg.addColorStop(0.18, K.skin); fg.addColorStop(1, K.skin2);
                c.fillStyle = fg; c.beginPath(); c.arc(0, 0, o.r, 0, 7); c.fill(); c.shadowBlur = 0;
                if (o.k === 'melon') { c.strokeStyle = 'rgba(10,70,30,0.6)'; c.lineWidth = 3; for (var m = -2; m <= 2; m++) { c.beginPath(); c.ellipse(m * o.r * 0.36, 0, o.r * 0.12, o.r * 0.95, 0, 0, 7); c.stroke(); } }
                if (o.k === 'berry') { c.fillStyle = 'rgba(255,255,255,0.5)'; for (var b = 0; b < 6; b++) { c.beginPath(); c.arc(Math.cos(b) * o.r * 0.5, Math.sin(b * 1.7) * o.r * 0.5, 1.6, 0, 7); c.fill(); } }
                c.fillStyle = '#3bd16f'; c.beginPath(); c.ellipse(o.r * 0.2, -o.r * 0.95, o.r * 0.3, o.r * 0.14, -0.5, 0, 7); c.fill();
              }
            }
            c.restore();
          });
          parts.forEach(function (p) { c.globalAlpha = Math.max(0, p.l / 0.7); c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, p.sz, 0, 7); c.fill(); }); c.globalAlpha = 1;
          // blade trail
          if (trail.length > 1) {
            c.lineCap = 'round'; c.lineJoin = 'round';
            for (i = 1; i < trail.length; i++) { var a0 = trail[i - 1], a1 = trail[i], k = 1 - (t - a1.t) / 0.16; c.strokeStyle = 'rgba(63,240,255,' + (0.9 * k) + ')'; c.shadowColor = '#3ff0ff'; c.shadowBlur = 14; c.lineWidth = 2 + 9 * k; c.beginPath(); c.moveTo(a0.x, a0.y); c.lineTo(a1.x, a1.y); c.stroke(); c.strokeStyle = 'rgba(255,255,255,' + k + ')'; c.lineWidth = 1 + 3 * k; c.stroke(); }
            c.shadowBlur = 0;
          }
          pops.forEach(function (p) { c.globalAlpha = Math.min(1, p.l * 2); U.text(c, p.s, p.x, p.y, (p.big ? 34 : 26) * Math.min(S, 1.2), p.c, 'center', '#000'); }); c.globalAlpha = 1;
          if (flash > 0) { c.fillStyle = 'rgba(255,40,70,' + (flash * 0.9) + ')'; c.fillRect(0, 0, W, H); }
          // HUD: title, hearts, score
          U.text(c, 'NEON SLICE', 16, 30, 19, '#3ff0ff', 'left');
          for (i = 0; i < 3; i++) U.heart(c, W / 2 - 34 + i * 34, 30, 30, i < hearts ? '#ff4f7a' : 'rgba(255,255,255,0.15)');
          U.text(c, String(api.score), W - 20, 32, 30, '#fff', 'right', 'rgba(0,0,0,0.4)');
          if (api.playing && playT < 4) U.text(c, api.touch ? 'Swipe through the fruit!' : 'Click + drag through the fruit!', W / 2, H * 0.62, 22 * Math.min(S, 1.1), '#ffe14d', 'center', '#000');
        }
      };
      return inst;
    }
  });
})();
