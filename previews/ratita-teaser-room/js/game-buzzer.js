/* Grok Arcade - bonus game #46: Buzzer Blitz (Grok Pet Party tie-in).
   Tortuga TV Network studio. Rico calls a pet on the big screen and that pet's podium lights up: TAP its buzzer before the timer bar empties.
   Fast buzzes score extra, gold STAR rounds are worth 3. A GOO card from Dr. Vic means hands off: wait it out for +1.
   Wrong buzzer / too slow / buzzing on GOO costs a heart. 3 hearts; rounds speed up. Perf: studio drawn once per size offscreen. */
(function () {
  'use strict';
  var U = GA.MG.U;
  var PETS = [{ n: 'LUNA', e: '\uD83D\uDC00', c: '#f472b6' }, { n: 'TORTY', e: '\uD83D\uDC22', c: '#4ade80' }, { n: 'CANDY', e: '\uD83D\uDC36', c: '#facc15' }, { n: 'PI-RAT', e: '\uD83C\uDFF4\u200D\u2620\uFE0F', c: '#38bdf8' }];
  GA.MG.register({
    id: 'buzzer', name: 'Buzzer Blitz', ticketDiv: 4,
    howTouch: 'Be the fastest pet on the Tortuga TV Network! Rico calls out a pet on the big screen and its podium lights up: TAP that buzzer before the timer runs out. Fast buzzes score extra and gold STAR rounds are worth 3. When Dr. Vic\u2019s GOO card shows up, DON\u2019T buzz! Wrong buzzers and slow paws cost a heart.',
    howKeys: 'Be the fastest pet on the Tortuga TV Network! Rico calls out a pet on the big screen and its podium lights up: press 1-4 (or click the buzzer) before the timer runs out. Fast buzzes score extra and gold STAR rounds are worth 3. When Dr. Vic\u2019s GOO card shows up, DON\u2019T buzz! Wrong buzzers and slow paws cost a heart.',
    create: function (api) {
      var t, hearts, round, pops, msg, msgT, hurtT, wait, hits, streak, bg = null, bgKey = '', flash = [0, 0, 0, 0];
      function L() { var W = api.W, H = api.H, top = 70, sh = Math.min(H * 0.3, 230), py = top + sh + 30, cw = (W - 36) / 2, ch = Math.min((H - py - 30) / 2, 190);
        var pods = []; for (var i = 0; i < 4; i++) pods.push({ x: 12 + (i % 2) * (cw + 12), y: py + Math.floor(i / 2) * (ch + 12), w: cw, h: ch });
        return { W: W, H: H, top: top, sh: sh, pods: pods }; }
      function say(s, col) { msg = [s, col]; msgT = 1; }
      function burst(x, y, col, n) { for (var i = 0; i < (n || 10) && pops.length < 70; i++) { var a = Math.random() * 6.28, s = 60 + Math.random() * 160; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.7, col: col }); } }
      function hurt(why) { if (hurtT > 0) return; hearts--; hurtT = 0.6; streak = 0; api.sfx('lifelost'); say(why, '#fecaca'); if (hearts <= 0) api.gameOver(); }
      function dur() { return Math.max(0.85, 2.3 - t * 0.022); }
      function next() { var r = Math.random(), k = t > 6 && r < 0.18 ? 'goo' : r < 0.3 ? 'star' : 'pet';
        round = { k: k, p: Math.floor(Math.random() * 4), t0: t, d: k === 'goo' ? 1.3 : dur() }; }
      function buildBg() {
        var l = L(), d = api.dpr || 1, key = l.W + 'x' + l.H + '@' + d; if (bg && bgKey === key) return; bgKey = key;
        bg = document.createElement('canvas'); bg.width = Math.round(l.W * d); bg.height = Math.round(l.H * d); var g = bg.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
        var gr = g.createLinearGradient(0, 0, 0, l.H); gr.addColorStop(0, '#1e0b3a'); gr.addColorStop(1, '#0b1030'); g.fillStyle = gr; g.fillRect(0, 0, l.W, l.H);
        for (var i = 0; i < 7; i++) { g.fillStyle = 'rgba(255,79,216,' + (0.05 + (i % 2) * 0.04) + ')'; g.beginPath(); var x0 = (i + 0.5) * l.W / 7; g.moveTo(x0 - 10, 0); g.lineTo(x0 + 10, 0); g.lineTo(x0 + 70, l.H); g.lineTo(x0 - 70, l.H); g.fill(); }
        for (i = 0; i < 40; i++) { g.fillStyle = ['#ff4fd8', '#38bdf8', '#facc15'][i % 3]; g.globalAlpha = 0.5; g.beginPath(); g.arc((i * 73) % l.W, 62 + ((i * 37) % 8), 2.5, 0, 7); g.fill(); } g.globalAlpha = 1;
        g.fillStyle = '#111827'; U.rr(g, 12, l.top, l.W - 24, l.sh, 14); g.fill(); g.strokeStyle = '#ff4fd8'; g.lineWidth = 4; g.stroke();
        U.text(g, 'TORTUGA TV NETWORK', l.W / 2, l.top + l.sh - 12, 11, '#38bdf8', 'center');
        U.text(g, 'Ratita Industries \u00b7 Tortuga Tech', l.W / 2, l.H - 10, 11, 'rgba(255,255,255,.5)', 'center');
      }
      function inPod(l, x, y) { for (var i = 0; i < 4; i++) { var p = l.pods[i]; if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i; } return -1; }
      function buzz(i) { if (!api.playing || !round || wait > 0 || i < 0) return; var l = L(), p = l.pods[i]; flash[i] = 0.25;
        if (round.k === 'goo') { hurt('GOO! Paws off!'); burst(p.x + p.w / 2, p.y + p.h / 2, '#4ade80', 14); round = null; wait = 0.5; return; }
        if (i !== round.p) { hurt('Wrong buzzer!'); round = null; wait = 0.5; return; }
        var f = 1 - (t - round.t0) / round.d, pts = round.k === 'star' ? 3 : 1; if (f > 0.6) pts++; hits++; streak++;
        if (streak % 10 === 0) { pts += 5; say('ON FIRE! x' + streak + ' +5', '#fde047'); api.sfx('perfect'); } else say((round.k === 'star' ? 'STAR! ' : f > 0.6 ? 'FAST! ' : 'BUZZ! ') + '+' + pts, round.k === 'star' ? '#fde047' : '#f9a8d4');
        api.addScore(pts); burst(p.x + p.w / 2, p.y + p.h / 2, round.k === 'star' ? '#facc15' : PETS[i].c, 14); if (hits >= 40 && GA.Prog) GA.Prog.event('buzz40'); round = null; wait = 0.3; }
      return {
        reset: function () { t = 0; hearts = 3; round = null; pops = []; msgT = 0; hurtT = 0; wait = 0.9; hits = 0; streak = 0; flash = [0, 0, 0, 0]; },
        update: function (dt) {
          var i; if (msgT > 0) msgT -= dt; if (hurtT > 0) hurtT -= dt; for (i = 0; i < 4; i++) if (flash[i] > 0) flash[i] -= dt;
          for (i = pops.length - 1; i >= 0; i--) { var p = pops[i]; p.life -= dt; p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) pops.splice(i, 1); }
          if (!api.playing) return; t += dt;
          if (!round) { wait -= dt; if (wait <= 0) next(); return; }
          if (t - round.t0 > round.d) { if (round.k === 'goo') { api.addScore(1); say('Good wait! +1', '#bbf7d0'); } else hurt('Too slow!'); round = null; wait = Math.max(0.2, 0.5 - t * 0.004); }
        },
        draw: function (c) {
          var l = L(), i; buildBg(); c.drawImage(bg, 0, 0, l.W, l.H);
          var cx = l.W / 2, cy = l.top + l.sh * 0.45;
          if (round) { var f = Math.max(0, 1 - (t - round.t0) / round.d);
            if (round.k === 'goo') { c.fillStyle = '#16a34a'; c.beginPath(); c.ellipse(cx, cy, 70, 44, 0, 0, 7); c.fill(); c.fillStyle = '#4ade80'; c.beginPath(); c.ellipse(cx - 4, cy - 6, 58, 36, 0, 0, 7); c.fill(); U.text(c, 'GOO! DON\u2019T BUZZ', cx, cy, 20, '#052e16', 'center'); }
            else { var pe = PETS[round.p]; U.text(c, round.k === 'star' ? '\u2B50 STAR ROUND \u2B50' : 'BUZZ FOR', cx, l.top + 24, 15, round.k === 'star' ? '#fde047' : '#e5e7eb', 'center'); c.font = Math.round(l.sh * 0.32) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(pe.e, cx, cy + 4); U.text(c, pe.n, cx, cy + l.sh * 0.26, 24, pe.c, 'center', '#000'); }
            c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(30, l.top + l.sh - 30, l.W - 60, 8); c.fillStyle = f > 0.4 ? '#4ade80' : '#ef4444'; c.fillRect(30, l.top + l.sh - 30, (l.W - 60) * f, 8); }
          else U.text(c, api.playing ? 'Get ready\u2026' : 'BUZZER BLITZ', cx, cy, 22, '#f9a8d4', 'center');
          for (i = 0; i < 4; i++) { var p = l.pods[i], pe2 = PETS[i], lit = round && round.k !== 'goo' && round.p === i, bx = p.x + p.w / 2, by = p.y + p.h * 0.42, br = Math.min(p.w, p.h) * 0.3;
            c.fillStyle = '#1f2937'; U.rr(c, p.x, p.y, p.w, p.h, 14); c.fill(); c.strokeStyle = lit ? (round.k === 'star' ? '#facc15' : pe2.c) : 'rgba(255,255,255,.15)'; c.lineWidth = lit ? 5 : 2; c.stroke();
            c.fillStyle = '#4b5563'; c.beginPath(); c.ellipse(bx, by + br * 0.35, br * 1.1, br * 0.45, 0, 0, 7); c.fill();
            c.fillStyle = flash[i] > 0 ? '#fff' : lit ? '#ef4444' : '#7f1d1d'; c.beginPath(); c.ellipse(bx, by, br, br * 0.55, 0, 0, 7); c.fill();
            if (lit) { c.globalAlpha = 0.35 + 0.25 * Math.sin(t * 14); c.fillStyle = '#fecaca'; c.beginPath(); c.ellipse(bx, by, br * 1.25, br * 0.75, 0, 0, 7); c.fill(); c.globalAlpha = 1; }
            c.font = Math.round(br * 0.7) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(pe2.e, bx, p.y + p.h * 0.78); U.text(c, (i + 1) + ' ' + pe2.n, bx, p.y + p.h - 10, 11, pe2.c, 'center'); }
          for (i = 0; i < pops.length; i++) { var q = pops[i]; c.globalAlpha = Math.max(0, q.life / 0.7); c.fillStyle = q.col; c.fillRect(q.x - 3, q.y - 3, 6, 6); } c.globalAlpha = 1;
          c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, l.W, 58);
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 22, 22, i < hearts ? '#ef4444' : 'rgba(255,255,255,.2)');
          U.text(c, String(api.score), l.W - 16, 24, 30, '#fff', 'right', '#831843'); U.text(c, 'BUZZER BLITZ', l.W / 2, 18, 15, '#ff4fd8', 'center', '#000'); U.text(c, '\uD83D\uDD14 ' + hits + ' buzzes', l.W / 2, 42, 12, '#e5e7eb', 'center', '#000');
          if (msgT > 0) U.text(c, msg[0], l.W / 2, l.top + l.sh + 14, 20, msg[1], 'center', '#000');
        },
        dbg: function () { return { t: t, hearts: hearts, hits: hits, score: api.score, round: round }; },
        onDown: function (x, y) { buzz(inPod(L(), x, y)); },
        onKey: function (k, dn) { if (dn === false) return; var i = '1234'.indexOf(k); if (i >= 0) buzz(i); }
      };
    }
  });
})();
