/* Grok Arcade - bonus game #24: Tame Rush (Grok Monster Hunters tie-in). NOTE: Ratita Rescue is not in the Arcade yet, so it takes the next number (#25).
   A big cartoon monster stomps around. Drag (or arrow keys) to run in close: your hunter swings by itself (+1).
   Stand on the side with the glowing weak spot for +2. Dodge the RED circles (stomps, falling rocks) and the
   RED tail-sweep band. Fill the TAME meter to tame the monster (+10) and a tougher one shows up. 3 hearts. */
(function () {
  'use strict';
  var U = GA.MG.U;
  var MONS = [
    { n: 'PUFFHORN', body: '#fff4e6', belly: '#ffe4c4', acc: '#f59e0b', horn: '#fde68a', need: 18 },
    { n: 'RAPTERIX', body: '#22d3ee', belly: '#ecfeff', acc: '#facc15', horn: '#fef3c7', need: 22 },
    { n: 'BOGGLUG', body: '#84cc16', belly: '#ecfccb', acc: '#f472b6', horn: '#fde68a', need: 24 },
    { n: 'EMBERWING', body: '#ef4444', belly: '#fde68a', acc: '#fb923c', horn: '#fef3c7', need: 26 },
    { n: 'STARFANG', body: '#6d28d9', belly: '#ede9fe', acc: '#fde047', horn: '#fde047', need: 30 }];
  GA.MG.register({
    id: 'tame', name: 'Tame Rush', ticketDiv: 3,
    howTouch: 'A big monster is stomping around! Hold and DRAG left or right to move. Get close and your hunter swings by itself (+1). Stand on the side with the glowing STAR weak spot for +2. Run out of RED circles and the RED tail sweep! Fill the TAME meter to tame it (+10). 3 hearts!',
    howKeys: 'A big monster is stomping around! Use LEFT and RIGHT (or A/D) to move. Get close and your hunter swings by itself (+1). Stand on the side with the glowing STAR weak spot for +2. Run out of RED circles and the RED tail sweep! Fill the TAME meter to tame it (+10). 3 hearts!',
    create: function (api) {
      var t, hearts, px, tx, keyL, keyR, inv, swingT, swingA, m, atks, pops, msg, msgT, shake, tamed, L = {};
      function layout() { L.gy = api.H - Math.max(120, api.H * 0.2); L.pr = Math.max(14, Math.min(22, api.W * 0.045)); L.R = Math.max(46, Math.min(110, api.W * 0.17)); }
      function say(s, c) { msg = [s, c]; msgT = 1.1; }
      function burst(x, y, col, n) { for (var i = 0; i < (n || 14); i++) { var a = Math.random() * 6.28, s = 60 + Math.random() * 170; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 100, life: 0.8, col: col }); } }
      function newMon() { var D = MONS[tamed % MONS.length], lvl = tamed; m = { D: D, x: api.W / 2, tx: api.W / 2, face: 1, hits: 0, need: D.need + Math.floor(lvl / MONS.length) * 6, atkT: 1.6, sp: 70 + lvl * 12, weak: Math.random() < 0.5 ? -1 : 1, weakT: 4, hurt: 0, dizzy: 0, happy: 0, wob: 0, lvl: lvl }; }
      function hit() {
        if (inv > 0) return; hearts--; inv = 1.3; shake = 0.35; api.sfx('lifelost'); say('OUCH! Run out of the red!', '#ff6b6b');
        if (hearts <= 0) api.gameOver();
      }
      function attack() {
        var k = Math.random(), R = L.R, sp = Math.max(0.65, 1.1 - m.lvl * 0.06);
        if (k < 0.4) atks.push({ k: 'stomp', x: m.x + m.face * R * 0.35, r: R * 1.0, T: sp, t: 0 });
        else if (k < 0.7) { var side = px >= m.x ? 1 : -1; atks.push({ k: 'sweep', side: side, x0: side > 0 ? m.x : 0, x1: side > 0 ? api.W : m.x, T: sp + 0.15, t: 0 }); m.face = side; }
        else { var n = 1 + (m.lvl >= 2 ? 1 : 0) + (m.lvl >= 4 ? 1 : 0); for (var i = 0; i < n; i++) atks.push({ k: 'rock', x: U.clamp(px + (i ? U.rand(-120, 120) : 0), 20, api.W - 20), r: Math.max(30, L.R * 0.5), T: sp + 0.25 + i * 0.25, t: 0 }); }
        m.atkT = Math.max(0.85, 2.2 - m.lvl * 0.15) + Math.random() * 0.8;
      }
      function land(a) {
        api.sfx('crash'); shake = Math.max(shake, 0.18);
        if (a.k === 'sweep') { if ((px > a.x0 && px < a.x1)) hit(); burst(a.side > 0 ? (a.x0 + a.x1) / 2 : (a.x0 + a.x1) / 2, L.gy - 10, '#fde68a', 10); }
        else { if (Math.abs(px - a.x) < a.r * 0.9) hit(); burst(a.x, L.gy, a.k === 'rock' ? '#a8a29e' : '#d6c3a5', 16); }
      }
      function drawMon(c) {
        var D = m.D, R = L.R, x = m.x, gy = L.gy, bob = Math.sin(t * 6) * 3 * (m.dizzy > 0 ? 0 : 1), f = m.face, sq = 1 + m.wob * 0.06 * Math.sin(t * 40);
        c.save(); c.translate(x, gy); if (m.happy > 0) c.globalAlpha = Math.max(0, m.happy / 0.9);
        c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, 4, R * 1.1, R * 0.22, 0, 0, 7); c.fill();
        // legs
        c.fillStyle = D.body; [-0.55, -0.2, 0.2, 0.55].forEach(function (q, i) { var lift = Math.max(0, Math.sin(t * 8 + i * 1.6)) * 8 * (Math.abs(m.tx - m.x) > 4 ? 1 : 0); U.rr(c, q * R - R * 0.13, -R * 0.45 - lift, R * 0.26, R * 0.45, R * 0.12); c.fill(); });
        // tail
        c.fillStyle = D.body; c.beginPath(); c.ellipse(-f * R * 1.0, -R * 0.75 + bob, R * 0.45, R * 0.16, f * 0.4, 0, 7); c.fill();
        // body
        c.scale(sq, 1 / sq); c.fillStyle = D.body; c.beginPath(); c.ellipse(0, -R * 0.8 + bob, R * 0.95, R * 0.58, 0, 0, 7); c.fill();
        c.fillStyle = D.belly; c.beginPath(); c.ellipse(f * R * 0.15, -R * 0.62 + bob, R * 0.55, R * 0.3, 0, 0, 7); c.fill();
        // back spikes
        c.fillStyle = D.acc; for (var i = 0; i < 4; i++) { var sx = (i - 1.5) * R * 0.32; c.beginPath(); c.moveTo(sx - R * 0.1, -R * 1.3 + bob + Math.abs(i - 1.5) * 6); c.lineTo(sx, -R * 1.55 + bob + Math.abs(i - 1.5) * 6); c.lineTo(sx + R * 0.1, -R * 1.3 + bob + Math.abs(i - 1.5) * 6); c.fill(); }
        // head
        var hx = f * R * 0.95, hy = -R * 1.05 + bob; c.fillStyle = D.body; c.beginPath(); c.arc(hx, hy, R * 0.42, 0, 7); c.fill();
        c.fillStyle = D.belly; c.beginPath(); c.ellipse(hx + f * R * 0.22, hy + R * 0.12, R * 0.24, R * 0.17, 0, 0, 7); c.fill();
        c.fillStyle = D.horn; c.beginPath(); c.moveTo(hx + f * R * 0.05, hy - R * 0.32); c.lineTo(hx + f * R * 0.2, hy - R * 0.7); c.lineTo(hx + f * R * 0.3, hy - R * 0.28); c.fill();
        // eyes
        if (m.dizzy > 0) { c.strokeStyle = '#111827'; c.lineWidth = 3; [0.02, 0.22].forEach(function (q) { var ex = hx + f * R * q, ey = hy - R * 0.08; c.beginPath(); c.moveTo(ex - 5, ey - 5); c.lineTo(ex + 5, ey + 5); c.moveTo(ex + 5, ey - 5); c.lineTo(ex - 5, ey + 5); c.stroke(); }); }
        else [0.02, 0.22].forEach(function (q) { var ex = hx + f * R * q, ey = hy - R * 0.08; c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey, R * 0.1, 0, 7); c.fill(); c.fillStyle = '#111827'; c.beginPath(); c.arc(ex + f * 2, ey, R * 0.055, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + f * 3, ey - 3, R * 0.02, 0, 7); c.fill(); });
        if (m.hurt > 0) { c.fillStyle = 'rgba(255,255,255,' + m.hurt * 2 + ')'; c.beginPath(); c.ellipse(0, -R * 0.8, R * 0.95, R * 0.58, 0, 0, 7); c.fill(); }
        c.restore();
        // weak spot star
        if (m.happy <= 0) { var wx = x + m.weak * R * 0.75, wy = gy - R * 0.85 + bob, s = 10 + Math.sin(t * 8) * 2.5; c.fillStyle = '#fde047'; c.shadowColor = '#fde047'; c.shadowBlur = 16; c.beginPath(); for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? s * 0.45 : s; c.lineTo(wx + Math.cos(a) * rr, wy + Math.sin(a) * rr); } c.closePath(); c.fill(); c.shadowBlur = 0; }
        if (m.dizzy > 0) for (var j = 0; j < 3; j++) { var a2 = t * 4 + j * 2.1; U.text(c, '\u2605', hx + x + Math.cos(a2) * 26, gy - R * 1.55 + Math.sin(a2) * 7, 16, '#fde047', 'center', '#000'); }
      }
      function drawHunter(c, x, y, s) {
        var run = Math.sin(t * 16) * (Math.abs(tx - px) > 2 ? 1 : 0.1), fc = m && m.x >= x ? 1 : -1;
        c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, y + 2, s * 0.9, s * 0.25, 0, 0, 7); c.fill();
        c.strokeStyle = '#3b2314'; c.lineWidth = s * 0.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - s * 0.2, y - s * 0.9); c.lineTo(x - s * 0.25 + run * s * 0.3, y - s * 0.05); c.moveTo(x + s * 0.2, y - s * 0.9); c.lineTo(x + s * 0.25 - run * s * 0.3, y - s * 0.05); c.stroke();
        c.fillStyle = '#22d3ee'; U.rr(c, x - s * 0.5, y - s * 1.95, s, s * 1.15, s * 0.35); c.fill();
        c.fillStyle = '#f6c9a0'; c.beginPath(); c.arc(x, y - s * 2.4, s * 0.55, 0, 7); c.fill();
        c.fillStyle = '#0e7490'; c.beginPath(); c.arc(x, y - s * 2.55, s * 0.6, Math.PI, 0); c.fill(); c.fillStyle = '#facc15'; c.beginPath(); c.moveTo(x - 3, y - s * 3.1); c.lineTo(x, y - s * 3.5); c.lineTo(x + 3, y - s * 3.1); c.fill();
        c.fillStyle = '#111827'; c.beginPath(); c.arc(x + fc * s * 0.18, y - s * 2.35, s * 0.08, 0, 7); c.fill();
        // sword swing
        var a = swingA > 0 ? (-1.9 + (1 - swingA / 0.22) * 2.6) : -0.6; c.save(); c.translate(x + fc * s * 0.45, y - s * 1.5); c.scale(fc, 1); c.rotate(a);
        c.fillStyle = '#e2e8f0'; U.rr(c, -3, -s * 1.9, 6, s * 1.7, 3); c.fill(); c.fillStyle = '#b07a4a'; c.fillRect(-7, -s * 0.25, 14, 5); c.restore();
        if (swingA > 0.12) { c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 4; c.beginPath(); c.arc(x + fc * s * 0.45, y - s * 1.5, s * 1.9, fc > 0 ? -1.6 : Math.PI + 0.3, fc > 0 ? -0.3 : Math.PI + 1.6); c.stroke(); }
      }
      return {
        reset: function () { layout(); t = 0; hearts = 3; px = tx = api.W * 0.2; keyL = keyR = false; inv = 0; swingT = 0; swingA = 0; atks = []; pops = []; msgT = 0; shake = 0; tamed = 0; newMon(); },
        resize: function () { layout(); },
        update: function (dt) {
          if (msgT > 0) msgT -= dt; if (shake > 0) shake -= dt; if (swingA > 0) swingA -= dt;
          for (var i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.vy += 380 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          if (!api.playing) return; t += dt; if (inv > 0) inv -= dt;
          if (keyL) tx = px - 300; if (keyR) tx = px + 300; tx = U.clamp(tx, L.pr, api.W - L.pr);
          var sp = 340 * dt; px += U.clamp(tx - px, -sp, sp);
          // monster
          if (m.hurt > 0) m.hurt -= dt; if (m.wob > 0) m.wob -= dt * 3;
          if (m.happy > 0) { m.happy -= dt; m.x += m.face * 120 * dt; if (m.happy <= 0) { newMon(); m.x = m.face > 0 ? -L.R * 2 : api.W + L.R * 2; m.tx = api.W / 2; say('Here comes ' + m.D.n + '!', '#fde68a'); } return; }
          if (m.dizzy > 0) m.dizzy -= dt;
          else {
            if (Math.abs(m.tx - m.x) < 6) m.tx = U.clamp(Math.random() < 0.6 ? px + U.rand(-80, 80) : U.rand(L.R, api.W - L.R), L.R, api.W - L.R);
            var ms = m.sp * dt; m.x += U.clamp(m.tx - m.x, -ms, ms); if (Math.abs(m.tx - m.x) > 4) m.face = m.tx > m.x ? 1 : -1;
            m.atkT -= dt; if (m.atkT <= 0 && atks.length < 3) attack();
            m.weakT -= dt; if (m.weakT <= 0) { m.weak = -m.weak; m.weakT = 3 + Math.random() * 2.5; }
          }
          for (i = atks.length - 1; i >= 0; i--) { var a = atks[i]; a.t += dt; if (a.t >= a.T) { land(a); atks.splice(i, 1); } }
          // auto swing when close
          swingT -= dt; var d = px - m.x;
          if (Math.abs(d) < L.R * 1.25 && swingT <= 0) { swingT = 0.34; swingA = 0.22; api.sfx('point');
            var weak = (d * m.weak > 0); var pts = weak || m.dizzy > 0 ? 2 : 1; api.addScore(pts); m.hits += pts; m.hurt = 0.15; m.wob = 1;
            burst(m.x + m.weak * (weak ? L.R * 0.75 : L.R * 0.2), L.gy - L.R * 0.85, weak ? '#fde047' : '#ffffff', weak ? 12 : 6); if (weak && Math.random() < 0.3) say('WEAK SPOT! +2', '#fde047');
            if (m.hits >= m.need) { tamed++; api.addScore(10); api.sfx('perfect'); say('\uD83D\uDC96 ' + m.D.n + ' TAMED! +10', '#f9a8d4'); burst(m.x, L.gy - L.R, '#f9a8d4', 30); m.happy = 0.9; m.face = px < m.x ? 1 : -1; atks = []; if (tamed >= 3 && GA.Prog) GA.Prog.event('tame3'); }
            else if (m.hits >= m.need * 0.6 && !m.dz) { m.dz = true; m.dizzy = 2.2; atks = []; say('DIZZY! Attack now!', '#fde047'); } }
        },
        draw: function (c) {
          var W = api.W, H = api.H, gy = L.gy, i;
          c.save(); if (shake > 0) c.translate((Math.random() - 0.5) * 10 * shake / 0.35, (Math.random() - 0.5) * 8 * shake / 0.35);
          var g = c.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, '#1ea7ff'); g.addColorStop(1, '#c8f4ff'); c.fillStyle = g; c.fillRect(-20, -20, W + 40, gy + 20);
          c.fillStyle = '#86c96a'; for (i = 0; i < 6; i++) { c.beginPath(); c.ellipse(i * W / 5, gy - 10, W / 5, 60 + (i % 3) * 18, 0, Math.PI, 0); c.fill(); }
          c.fillStyle = '#3f9e44'; for (i = 0; i < 7; i++) { var tx2 = (i * 97 + 30) % W; c.fillStyle = '#8b5a2b'; c.fillRect(tx2 - 4, gy - 70, 8, 60); c.fillStyle = '#3f9e44'; c.beginPath(); c.arc(tx2, gy - 82, 26, 0, 7); c.fill(); }
          c.fillStyle = '#6cc24a'; c.fillRect(-20, gy, W + 40, H - gy + 20); c.fillStyle = '#4fa83d'; c.fillRect(-20, gy, W + 40, 6);
          atks.forEach(function (a) { var k = a.t / a.T, al = 0.5 + 0.5 * Math.sin(t * 20); c.strokeStyle = 'rgba(255,40,60,' + al + ')'; c.lineWidth = 3; c.fillStyle = 'rgba(255,40,60,' + (0.15 + k * 0.25) + ')';
            if (a.k === 'sweep') { c.fillRect(a.x0, gy - 16, a.x1 - a.x0, 30); c.strokeRect(a.x0, gy - 16, a.x1 - a.x0, 30); }
            else { c.beginPath(); c.ellipse(a.x, gy + 4, a.r, a.r * 0.28, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.ellipse(a.x, gy + 4, a.r * k, a.r * 0.28 * k, 0, 0, 7); c.stroke();
              if (a.k === 'rock') { var ry = -30 + (gy + 30) * k * k; c.fillStyle = '#8a7f74'; c.beginPath(); c.arc(a.x, ry, 14, 0, 7); c.fill(); c.fillStyle = '#a8a29e'; c.beginPath(); c.arc(a.x - 4, ry - 4, 6, 0, 7); c.fill(); } } });
          drawMon(c);
          if (!(inv > 0 && Math.floor(t * 12) % 2)) drawHunter(c, px, gy, L.pr * 1.15);
          for (i = 0; i < pops.length; i++) { var p = pops[i]; c.globalAlpha = Math.max(0, p.life / 0.8); c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, 5, 0, 7); c.fill(); } c.globalAlpha = 1;
          c.restore();
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ff4f8b' : 'rgba(255,255,255,.4)');
          U.text(c, String(api.score), W - 16, 30, 30, '#fff', 'right', '#000');
          // tame meter
          var bw = Math.min(260, W * 0.55), bx = W / 2 - bw / 2; c.fillStyle = 'rgba(0,0,0,.35)'; U.rr(c, bx, 54, bw, 14, 7); c.fill(); c.fillStyle = '#f472b6'; U.rr(c, bx, 54, Math.max(14, bw * Math.min(1, m.hits / m.need)), 14, 7); c.fill();
          U.text(c, m.D.n + ' \u00b7 TAME', W / 2, 46, 14, '#fff', 'center', '#000'); if (tamed) U.text(c, 'TAMED ' + tamed, W - 16, 60, 15, '#f9a8d4', 'right', '#000');
          if (msgT > 0) U.text(c, msg[0], W / 2, 110, 22, msg[1], 'center', '#000');
          if (api.playing && t < 4) U.text(c, api.touch ? 'DRAG in close to swing, dodge the RED!' : 'LEFT / RIGHT: get close to swing, dodge the RED!', W / 2, H - 28, 16, '#fff', 'center', '#000');
        },
        dbg: function () { return { t: t, hearts: hearts, px: px, mx: m.x, hits: m.hits, need: m.need, tamed: tamed, atks: atks.map(function (a) { return a.k; }), W: api.W }; },
        onDown: function (x) { tx = x; },
        onMove: function (x, y, down) { if (down) tx = x; },
        onUp: function () { },
        onKey: function (k, down) { if (k === 'ArrowLeft' || k === 'a' || k === 'A') keyL = down; if (k === 'ArrowRight' || k === 'd' || k === 'D') keyR = down; if (!down && !keyL && !keyR) tx = px; }
      };
    }
  });
})();
