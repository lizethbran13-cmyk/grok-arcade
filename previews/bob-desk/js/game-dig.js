/* Grok Arcade - bonus game #34: Bone Dig (Grok Pup Town tie-in).
   Candy the mini schnauzer digs up Paw Park. Dirt mounds pop up: PRESS AND HOLD one to dig (the ring fills), let go to stop.
   Bones +1, biscuits +2, the GOLDEN BONE +5. SPARKLY mounds hide treasure; WIGGLY mounds hide a sprinkler that soaks Candy (lose a heart).
   Mounds sink back after a while. 3 hearts; it gets busier the more you dig. */
(function () {
  'use strict';
  var U = GA.MG.U;
  GA.MG.register({
    id: 'dig', name: 'Bone Dig', ticketDiv: 4,
    howTouch: 'Help Candy dig up Paw Park! PRESS AND HOLD a dirt mound until the ring fills. Bones = +1, biscuits = +2, the GOLDEN BONE = +5. Sparkly mounds hide treats. WIGGLY mounds hide a sprinkler: don\u2019t dig those or Candy gets soaked!',
    howKeys: 'Help Candy dig up Paw Park! Click and HOLD a dirt mound until the ring fills (or hover one and hold SPACE). Bones = +1, biscuits = +2, the GOLDEN BONE = +5. Sparkly mounds hide treats. WIGGLY mounds hide a sprinkler: don\u2019t dig those or Candy gets soaked!',
    create: function (api) {
      var t, hearts, mounds, pops, msg, msgT, hurtT, spawnT, dug, hold, px, py, cx, cy, soak, gold;
      function say(s, col) { msg = [s, col]; msgT = 1.2; }
      function busy() { return Math.min(1, dug / 40); }
      function rnd(a, b) { return a + Math.random() * (b - a); }
      function spot() { for (var i = 0; i < 30; i++) { var x = rnd(50, api.W - 50), y = rnd(150, api.H - 70); if (mounds.every(function (m) { return Math.hypot(m.x - x, m.y - y) > 86; })) return [x, y]; } return null; }
      function spawn() { var p = spot(); if (!p) return; var r = Math.random(), k = r < 0.18 + busy() * 0.12 ? 'spr' : r < 0.26 ? 'gold' : r < 0.55 ? 'bisc' : 'bone';
        if (k === 'gold' && gold) k = 'bone'; mounds.push({ x: p[0], y: p[1], k: k, life: rnd(3.2, 4.6) - busy() * 1.2, prog: 0, up: 0 }); if (k === 'gold') gold = true; }
      function hurt(why) { if (hurtT > 0) return; hearts--; hurtT = 1.2; soak = 1; api.sfx('lifelost'); say(why, '#7dd3fc'); if (hearts <= 0) api.gameOver(); }
      function burst(x, y, col, n) { for (var i = 0; i < (n || 10); i++) { var a = Math.random() * 6.28, s = 60 + Math.random() * 140; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.7, col: col }); } }
      function at(x, y) { var best = null, bd = 60; mounds.forEach(function (m) { var d = Math.hypot(m.x - x, m.y - y); if (d < bd) { bd = d; best = m; } }); return best; }
      function bone(c, x, y, s, col) { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; U.rr(c, -16, -5, 32, 10, 5); c.fill(); [[-16, -5], [-16, 5], [16, -5], [16, 5]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 6, 0, 7); c.fill(); }); c.restore(); }
      return {
        reset: function () { t = 0; hearts = 3; mounds = []; pops = []; msgT = 0; hurtT = 0; spawnT = 0.4; dug = 0; hold = false; px = py = 0; cx = api.W / 2; cy = api.H - 60; soak = 0; gold = false; for (var i = 0; i < 3; i++) spawn(); },
        resize: function () {},
        update: function (dt) {
          if (msgT > 0) msgT -= dt; if (hurtT > 0) hurtT -= dt; if (soak > 0) soak -= dt * 0.8;
          for (var i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.vy += 300 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          if (!api.playing) return; t += dt;
          spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(0.5, 1.25 - busy() * 0.65); }
          var tg = hold ? at(px, py) : null; if (tg) { cx += (tg.x - cx) * Math.min(1, dt * 8); cy += (tg.y + 26 - cy) * Math.min(1, dt * 8); }
          for (var k = mounds.length - 1; k >= 0; k--) { var m = mounds[k]; m.up = Math.min(1, m.up + dt * 4);
            if (m === tg) { m.prog += dt * (1.6 + busy() * 0.4); if (Math.random() < dt * 14) burst(m.x, m.y + 6, '#8b5a2b', 1);
              if (m.prog >= 1) { mounds.splice(k, 1); dug++;
                if (m.k === 'spr') { hurt('SPLOOSH! A sprinkler! Candy is soaked!'); burst(m.x, m.y, '#7dd3fc', 22); }
                else { var pts = m.k === 'gold' ? 5 : m.k === 'bisc' ? 2 : 1; api.addScore(pts); api.sfx(pts > 2 ? 'perfect' : pts > 1 ? 'point' : 'eat'); burst(m.x, m.y, pts > 2 ? '#ffd23f' : '#e6c08a', pts > 2 ? 24 : 8); if (m.k === 'gold') { say('THE GOLDEN BONE! +5', '#ffd23f'); gold = false; } else if (dug % 12 === 0) say('Good girl, Candy! \uD83D\uDC3E', '#fde68a'); }
                if (dug >= 30 && GA.Prog) GA.Prog.event('dig30'); continue; } }
            else m.prog = Math.max(0, m.prog - dt * 0.5);
            m.life -= dt; if (m.life <= 0) { if (m.k === 'gold') gold = false; mounds.splice(k, 1); } }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i;
          // Paw Park lawn with mown stripes, a path and hedges
          for (var y = 0; y < H; y += 40) { c.fillStyle = (y / 40) % 2 ? '#7bd389' : '#86dc93'; c.fillRect(0, y, W, 40); }
          c.fillStyle = '#f3e3c3'; c.beginPath(); c.moveTo(W * 0.42, H); c.quadraticCurveTo(W * 0.6, H * 0.6, W * 0.35, 96); c.lineTo(W * 0.5, 96); c.quadraticCurveTo(W * 0.75, H * 0.6, W * 0.58, H); c.fill();
          c.fillStyle = '#3f9d4f'; for (i = 0; i < W; i += 34) { c.beginPath(); c.arc(i + 17, 98, 22, Math.PI, 0); c.fill(); }
          c.fillStyle = '#0ea5e9'; c.fillRect(0, 0, W, 76); c.fillStyle = '#ffd23f'; c.fillRect(0, 76, W, 6);
          mounds.forEach(function (m) { var s = m.up, wig = m.k === 'spr' ? Math.sin(t * 22 + m.x) * 3 : 0, fade = m.life < 1 ? 0.45 + 0.55 * Math.abs(Math.sin(m.life * 12)) : 1; c.globalAlpha = fade;
            c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(m.x, m.y + 14, 40 * s, 12 * s, 0, 0, 7); c.fill();
            c.fillStyle = '#8b5a2b'; c.beginPath(); c.ellipse(m.x + wig, m.y, 36 * s, 22 * s, 0, Math.PI, 0); c.lineTo(m.x + 36 * s + wig, m.y + 8); c.lineTo(m.x - 36 * s + wig, m.y + 8); c.fill();
            c.fillStyle = '#a0703f'; c.beginPath(); c.arc(m.x - 10 + wig, m.y - 8 * s, 6 * s, 0, 7); c.arc(m.x + 12 + wig, m.y - 4 * s, 5 * s, 0, 7); c.fill();
            if (m.k !== 'spr') { var sp = (Math.sin(t * 6 + m.x) + 1) / 2; c.fillStyle = m.k === 'gold' ? '#ffd23f' : '#fff'; c.globalAlpha = fade * (0.4 + sp * 0.6); U.text(c, '\u2726', m.x + 18, m.y - 22 * s, m.k === 'gold' ? 22 : 16, c.fillStyle, 'center'); c.globalAlpha = fade; }
            if (m.prog > 0) { c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.beginPath(); c.arc(m.x, m.y - 4, 44, -Math.PI / 2, -Math.PI / 2 + m.prog * 6.283); c.stroke(); }
            c.globalAlpha = 1; });
          // Candy: salt-and-pepper mini schnauzer with a beard and pink collar
          var hop = hold ? Math.abs(Math.sin(t * 18)) * 4 : Math.abs(Math.sin(t * 3)) * 2, fl = hurtT > 0 && Math.floor(hurtT * 12) % 2 === 0;
          if (!fl) { c.save(); c.translate(cx, cy - hop); c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, 26 + hop, 30, 8, 0, 0, 7); c.fill();
            c.fillStyle = '#8a9099'; c.beginPath(); c.ellipse(0, 6, 28, 18, 0, 0, 7); c.fill(); c.fillStyle = '#4b5058'; c.beginPath(); c.ellipse(0, -2, 24, 9, 0, 0, 7); c.fill();
            c.fillStyle = '#e8eaee'; [-16, -6, 8, 18].forEach(function (lx) { U.rr(c, lx - 4, 16, 8, 12, 4); c.fill(); }); c.fillStyle = '#4b5058'; c.save(); c.translate(26, -4); c.rotate(-0.6 + Math.sin(t * 14) * 0.4); U.rr(c, -3, -14, 6, 14, 3); c.fill(); c.restore();
            c.fillStyle = '#8a9099'; U.rr(c, -38, -30, 30, 28, 9); c.fill(); c.fillStyle = '#e8eaee'; c.beginPath(); c.ellipse(-30, -6, 12, 9, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(-26, -24, 8, 3, 0, 0, 7); c.fill();
            c.fillStyle = '#4b5058'; c.beginPath(); c.ellipse(-12, -26, 6, 9, 0.4, 0, 7); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(-27, -18, 2.6, 0, 7); c.fill(); c.beginPath(); c.ellipse(-40, -12, 4, 3, 0, 0, 7); c.fill();
            c.strokeStyle = '#ff4fa0'; c.lineWidth = 4; c.beginPath(); c.arc(-22, -2, 11, 0.3, 2.6); c.stroke();
            if (soak > 0) { c.fillStyle = 'rgba(125,211,252,' + soak + ')'; for (var d = 0; d < 6; d++) { c.beginPath(); c.arc(-30 + d * 12, -40 + ((t * 120 + d * 17) % 50), 3, 0, 7); c.fill(); } }
            c.restore(); }
          for (i = 0; i < pops.length; i++) { var q = pops[i]; c.globalAlpha = Math.max(0, q.life / 0.7); if (q.col === '#ffd23f' && i % 4 === 0) bone(c, q.x, q.y, 0.5, q.col); else { c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, 4, 0, 7); c.fill(); } } c.globalAlpha = 1;
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ffffff' : 'rgba(255,255,255,.35)');
          U.text(c, String(api.score), W - 16, 32, 30, '#fff', 'right', '#0c4a6e'); U.text(c, 'BONE DIG', W / 2, 58, 14, '#fff', 'center', '#0c4a6e'); bone(c, W / 2 - 52, 54, 0.45, '#ffd23f'); bone(c, W / 2 + 52, 54, 0.45, '#ffd23f');
          if (msgT > 0) U.text(c, msg[0], W / 2, 128, 20, msg[1], 'center', '#000');
          if (api.playing && t < 4) U.text(c, api.touch ? 'PRESS & HOLD a mound to dig!' : 'CLICK & HOLD a mound to dig!', W / 2, H - 22, 18, '#14532d', 'center', '#fff');
        },
        dbg: function () { return { t: t, hearts: hearts, mounds: mounds.map(function (m) { return [m.k, Math.round(m.x), Math.round(m.y), +m.prog.toFixed(2)]; }), dug: dug }; },
        onDown: function (x, y) { hold = true; px = x; py = y; }, onMove: function (x, y) { px = x; py = y; }, onUp: function () { hold = false; },
        onKey: function (k, down) { if (k === ' ' || k === 'Space') hold = down; }
      };
    }
  });
})();
