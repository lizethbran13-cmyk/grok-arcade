/* Grok Arcade - bonus game #6: Gary's Wire Rush. Match each wire to the socket with the same color + symbol before time runs out.
   Panels grow from 3 to 6 wires and the timer gets shorter. Wrong wire = ZAP (lose a life). 3 lives. */
(function () {
  'use strict';
  var U = GA.MG.U;
  var W6 = [{ c: '#ff3b4f', s: '\u25B2', n: 'red' }, { c: '#3ba7ff', s: '\u25CF', n: 'blue' }, { c: '#ffd23b', s: '\u25A0', n: 'yellow' },
    { c: '#3bff7a', s: '\u2605', n: 'green' }, { c: '#c084fc', s: '\u25C6', n: 'purple' }, { c: '#ff8a3d', s: '\u271A', n: 'orange' }];
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  GA.MG.register({
    id: 'wires', name: 'Gary\'s Wire Rush', ticketDiv: 4,
    howTouch: 'Drag each wire on the left to the socket with the SAME color and symbol (or tap a wire, then its socket). Finish the panel before time runs out. A wrong wire zaps you: 3 lives!',
    howKeys: 'Drag with the mouse (or click a wire, then its socket). Keys: press the wire number, then the socket number. Same color + symbol! A wrong wire zaps you: 3 lives.',
    create: function (api) {
      var round, lives, pan, drag, sel, zapT, flashT, popT, popS, waitT, t = 0, lay;
      function layout() {
        if (!pan) return;
        var W = api.W, H = api.H, top = 118, bot = H - 26, k = pan.k, rowH = Math.min(78, (bot - top) / k);
        var pw = Math.min(92, W * 0.2), ph = Math.min(58, rowH * 0.78), bw = Math.min(W - 24, 640), ox = (W - bw) / 2, y0 = top + (bot - top - rowH * k) / 2 + rowH / 2;
        lay = { pw: pw, ph: ph, lx: ox, rx: ox + bw - pw, y: function (i) { return y0 + i * rowH; } };
      }
      function newPanel() {
        var k = Math.min(6, 3 + Math.floor(round / 2)), ids = shuffle([0, 1, 2, 3, 4, 5]).slice(0, k), left = shuffle(ids.slice()), right = shuffle(ids.slice());
        while (right.join() === left.join()) right = shuffle(right);
        var T = (k * 1.5 + 2.5) * Math.max(0.55, 1 - round * 0.035);
        pan = { k: k, left: left, right: right, done: {}, t: T, T: T }; drag = null; sel = null; layout();
      }
      function plugAt(x, y) { for (var i = 0; i < pan.k; i++) { var yy = lay.y(i); if (x >= lay.lx - 8 && x <= lay.lx + lay.pw + 8 && Math.abs(y - yy) <= lay.ph / 2 + 8) return pan.left[i]; } return null; }
      function sockAt(x, y) { for (var i = 0; i < pan.k; i++) { var yy = lay.y(i); if (x >= lay.rx - 14 && x <= lay.rx + lay.pw + 8 && Math.abs(y - yy) <= lay.ph / 2 + 8) return pan.right[i]; } return null; }
      function pPos(w) { var i = pan.left.indexOf(w); return { x: lay.lx + lay.pw, y: lay.y(i) }; }
      function sPos(w) { var i = pan.right.indexOf(w); return { x: lay.rx, y: lay.y(i) }; }
      function connect(a, b) {
        drag = null; sel = null;
        if (!api.playing || waitT > 0 || pan.done[a] || pan.done[b]) return;
        if (a === b) {
          pan.done[a] = true; api.addScore(1); api.sfx('wire');
          if (Object.keys(pan.done).length === pan.k) {
            var bonus = Math.ceil(pan.t); api.addScore(bonus); api.sfx('level'); popS = 'PANEL FIXED!  +' + (bonus + pan.k); popT = 1.2; round++; waitT = 0.7;
          }
        } else {
          lives--; zapT = 0.6; flashT = 0.35; api.sfx('zap'); popS = 'ZAP!'; popT = 0.8;
          if (lives <= 0) { api.gameOver(); }
        }
      }
      var inst = {
        reset: function () { round = 0; lives = 3; zapT = 0; flashT = 0; popT = 0; waitT = 0; newPanel(); },
        resize: layout,
        debug: function () {
          return { k: pan.k, lives: lives, round: round, t: +pan.t.toFixed(2), done: Object.keys(pan.done).length,
            left: pan.left.map(function (w, i) { return { n: W6[w].n, x: lay.lx + lay.pw / 2, y: lay.y(i) }; }),
            right: pan.right.map(function (w, i) { return { n: W6[w].n, x: lay.rx + lay.pw / 2, y: lay.y(i) }; }) };
        },
        update: function (dt) {
          t += dt; if (zapT > 0) zapT -= dt; if (flashT > 0) flashT -= dt; if (popT > 0) popT -= dt;
          if (!api.playing) return;
          if (waitT > 0) { waitT -= dt; if (waitT <= 0) newPanel(); return; }
          pan.t -= dt;
          if (pan.t <= 0) { lives--; api.sfx('lifelost'); popS = 'TOO SLOW!'; popT = 1; flashT = 0.2; if (lives <= 0) { pan.t = 0; api.gameOver(); } else newPanel(); }
        },
        onDown: function (x, y) {
          if (!api.playing || waitT > 0) return;
          var p = plugAt(x, y);
          if (p != null && !pan.done[p]) { drag = { w: p, x: x, y: y, sx: x, sy: y }; api.sfx('click'); return; }
          var s = sockAt(x, y); if (s != null && sel != null) connect(sel, s);
        },
        onMove: function (x, y, down) { if (drag && down) { drag.x = x; drag.y = y; } },
        onUp: function (x, y) {
          if (!drag) return; var d = drag;
          var s = sockAt(x, y);
          if (s != null && Math.hypot(x - d.sx, y - d.sy) > 12) { connect(d.w, s); return; }
          drag = null; sel = Math.hypot(x - d.sx, y - d.sy) <= 12 ? d.w : null;
        },
        onKey: function (k, down) {
          if (!down || !api.playing) return; var n = parseInt(k, 10); if (!(n >= 1 && n <= pan.k)) return;
          if (sel == null) { var w = pan.left[n - 1]; if (!pan.done[w]) { sel = w; api.sfx('click'); } } else connect(sel, pan.right[n - 1]);
        },
        draw: function (c) {
          var W = api.W, H = api.H;
          var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d1a2b'); g.addColorStop(1, '#071019'); c.fillStyle = g; c.fillRect(0, 0, W, H);
          c.save();
          if (zapT > 0) c.translate((Math.random() - 0.5) * 16 * zapT, (Math.random() - 0.5) * 16 * zapT);
          // circuit traces
          c.strokeStyle = 'rgba(63,240,255,0.08)'; c.lineWidth = 2;
          for (var i = 0; i < 9; i++) { var yy = 120 + i * (H - 140) / 8; c.beginPath(); c.moveTo(0, yy); c.lineTo(W * 0.3, yy); c.lineTo(W * 0.35, yy + 20); c.lineTo(W, yy + 20); c.stroke(); }
          // header: round, lives, timer
          U.text(c, 'PANEL ' + (round + 1), 20, 34, 20, '#4ade80', 'left');
          for (i = 0; i < 3; i++) U.heart(c, W - 30 - i * 30, 34, 22, i < lives ? '#ff4f8b' : 'rgba(255,255,255,0.18)');
          U.text(c, String(api.score), W / 2, 34, 34, '#fff', 'center', 'rgba(255,255,255,0.5)');
          var frac = Math.max(0, pan.t / pan.T); c.fillStyle = 'rgba(255,255,255,0.12)'; U.rr(c, 20, 66, W - 40, 12, 6); c.fill();
          c.fillStyle = frac < 0.3 ? '#ff3b4f' : '#ffd23b'; U.rr(c, 20, 66, Math.max(12, (W - 40) * frac), 12, 6); c.fill();
          U.text(c, 'Same color + symbol!', W / 2, 98, 15, 'rgba(255,255,255,0.7)');
          // wires
          function wire(a, b, col, wdt) { var mx = (a.x + b.x) / 2; c.strokeStyle = col; c.lineWidth = wdt || 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(a.x, a.y); c.bezierCurveTo(mx, a.y, mx, b.y, b.x, b.y); c.stroke(); }
          Object.keys(pan.done).forEach(function (w) { wire(pPos(+w), sPos(+w), W6[w].c); });
          if (drag) wire(pPos(drag.w), { x: drag.x, y: drag.y }, W6[drag.w].c, 9);
          // plugs + sockets
          pan.left.forEach(function (w, i) {
            var y = lay.y(i), d = pan.done[w];
            c.globalAlpha = d ? 0.55 : 1; c.fillStyle = W6[w].c; U.rr(c, lay.lx, y - lay.ph / 2, lay.pw, lay.ph, 12); c.fill();
            c.strokeStyle = sel === w ? '#fff' : 'rgba(255,255,255,0.7)'; c.lineWidth = sel === w ? 5 : 3; c.stroke();
            U.text(c, W6[w].s, lay.lx + lay.pw / 2, y + 1, lay.ph * 0.5, '#1b1030'); U.text(c, String(i + 1), lay.lx - 12, y, 13, 'rgba(255,255,255,0.4)');
          });
          pan.right.forEach(function (w, i) {
            var y = lay.y(i), d = pan.done[w];
            c.globalAlpha = 1; c.fillStyle = d ? W6[w].c : '#0b1522'; U.rr(c, lay.rx, y - lay.ph / 2, lay.pw, lay.ph, 12); c.fill();
            c.strokeStyle = W6[w].c; c.lineWidth = 4; c.stroke();
            U.text(c, W6[w].s, lay.rx + lay.pw / 2, y + 1, lay.ph * 0.5, d ? '#1b1030' : W6[w].c); U.text(c, String(i + 1), lay.rx + lay.pw + 12, y, 13, 'rgba(255,255,255,0.4)');
          });
          c.globalAlpha = 1; c.restore();
          if (flashT > 0) { c.fillStyle = 'rgba(255,255,255,' + Math.min(0.85, flashT * 2.6) + ')'; c.fillRect(0, 0, W, H); }
          if (zapT > 0) {
            c.save(); c.translate(W / 2, H / 2); c.rotate(Math.sin(t * 40) * 0.15); var s = Math.min(W, H) / 400;
            c.scale(s, s); c.fillStyle = '#ffe14d'; c.strokeStyle = '#1b1030'; c.lineWidth = 6;
            c.beginPath(); [[16, -80], [-24, 8], [4, 8], [-12, 80], [44, -22], [14, -22], [34, -80]].forEach(function (p, j) { if (j) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); c.fill(); c.stroke(); c.restore();
          }
          if (popT > 0) { c.globalAlpha = Math.min(1, popT * 2); U.text(c, popS, W / 2, H / 2 + (zapT > 0 ? 110 : 0), 34, popS === 'ZAP!' || popS === 'TOO SLOW!' ? '#ff3b4f' : '#3bff7a', 'center', '#000'); c.globalAlpha = 1; }
        }
      };
      return inst;
    }
  });
})();
