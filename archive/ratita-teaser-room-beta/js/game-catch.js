/* Grok Arcade - bonus game #15: Critter Catch (Grok Poke tie-in).
   Six bushes. Critters pop up for a moment - tap them (or press 1-6 / Q W E A S D) to toss an orb and catch them.
   Shiny critters are worth 5. Gloom blobs pop up too - catching one costs a heart. A missed critter just runs off (combo resets). 3 hearts. It speeds up! */
(function () {
  'use strict';
  var U = GA.MG.U;
  var KINDS = [
    { n: 'Embercub', c: '#ff9f43', e: 'ears' }, { n: 'Puddlepup', c: '#4fb3ff', e: 'floppy' }, { n: 'Leafkit', c: '#5dd66f', e: 'leaf' },
    { n: 'Zipferret', c: '#ffe14d', e: 'ears' }, { n: 'Bunbun', c: '#f5e6ff', e: 'bunny' }, { n: 'Mushling', c: '#ff6b8b', e: 'cap' }
  ];
  var ROUND = 60;
  var KEYS = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, q: 0, w: 1, e: 2, a: 3, s: 4, d: 5 };
  function dots(c, col, list) { c.fillStyle = col; for (var i = 0; i < list.length; i++) { c.beginPath(); c.arc(list[i][0], list[i][1], list[i][2], 0, 7); c.fill(); } }
  function critter(c, x, y, r, k, shiny, t) {
    var col = shiny ? '#ffd23f' : k.c;
    c.save(); c.translate(x, y);
    c.fillStyle = col;
    if (k.e === 'ears') { c.beginPath(); c.moveTo(-r * 0.8, -r * 0.4); c.lineTo(-r * 0.5, -r * 1.25); c.lineTo(-r * 0.1, -r * 0.7); c.moveTo(r * 0.8, -r * 0.4); c.lineTo(r * 0.5, -r * 1.25); c.lineTo(r * 0.1, -r * 0.7); c.fill(); }
    if (k.e === 'bunny') { c.beginPath(); c.ellipse(-r * 0.35, -r * 1.1, r * 0.2, r * 0.55, -0.15, 0, 7); c.ellipse(r * 0.35, -r * 1.1, r * 0.2, r * 0.55, 0.15, 0, 7); c.fill(); }
    if (k.e === 'floppy') { c.beginPath(); c.ellipse(-r * 0.9, -r * 0.1, r * 0.25, r * 0.5, 0.4, 0, 7); c.ellipse(r * 0.9, -r * 0.1, r * 0.25, r * 0.5, -0.4, 0, 7); c.fill(); }
    c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
    if (k.e === 'leaf') { c.fillStyle = '#2f9e44'; c.beginPath(); c.ellipse(0, -r * 1.05, r * 0.22, r * 0.45, 0.5, 0, 7); c.fill(); }
    if (k.e === 'cap') { c.fillStyle = '#ff4f6b'; c.beginPath(); c.arc(0, -r * 0.35, r * 1.05, Math.PI, 0); c.fill(); dots(c, '#fff', [[-r * 0.4, -r * 0.75, r * 0.16], [r * 0.35, -r * 0.65, r * 0.12]]); }
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-r * 0.35, -r * 0.4, r * 0.28, r * 0.18, -0.5, 0, 7); c.fill();
    dots(c, '#16101f', [[-r * 0.32, -r * 0.05, r * 0.14], [r * 0.32, -r * 0.05, r * 0.14]]);
    dots(c, '#fff', [[-r * 0.28, -r * 0.1, r * 0.05], [r * 0.36, -r * 0.1, r * 0.05]]);
    dots(c, 'rgba(255,110,140,.55)', [[-r * 0.6, r * 0.25, r * 0.13], [r * 0.6, r * 0.25, r * 0.13]]);
    c.strokeStyle = '#16101f'; c.lineWidth = Math.max(1.5, r * 0.07); c.beginPath(); c.arc(0, r * 0.18, r * 0.2, 0.2, Math.PI - 0.2); c.stroke();
    if (shiny) { c.fillStyle = '#fff'; for (var i = 0; i < 3; i++) { var a = t * 3 + i * 2.1; U.text(c, '\u2726', Math.cos(a) * r * 1.4, Math.sin(a) * r * 1.2, r * 0.5, '#fff8b0'); } }
    c.restore();
  }
  function gloom(c, x, y, r, t) {
    c.save(); c.translate(x, y);
    c.fillStyle = '#4b3a6b'; c.beginPath();
    for (var i = 0; i <= 16; i++) { var a = i / 16 * Math.PI * 2, rr = r * (1 + Math.sin(a * 5 + t * 6) * 0.08); c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    c.fill();
    c.fillStyle = '#c4b5fd'; c.beginPath(); c.ellipse(-r * 0.32, -r * 0.1, r * 0.16, r * 0.1, 0.3, 0, 7); c.ellipse(r * 0.32, -r * 0.1, r * 0.16, r * 0.1, -0.3, 0, 7); c.fill();
    c.strokeStyle = '#c4b5fd'; c.lineWidth = 2; c.beginPath(); c.moveTo(-r * 0.3, r * 0.35); c.lineTo(-r * 0.1, r * 0.25); c.lineTo(r * 0.1, r * 0.35); c.lineTo(r * 0.3, r * 0.25); c.stroke();
    c.restore();
  }
  GA.MG.register({
    id: 'catch', name: 'Critter Catch', ticketDiv: 3,
    howTouch: 'Critters pop out of the 6 bushes - TAP them fast to toss an orb and catch them! Shiny gold critters are worth 5. Don\u2019t tap the purple Gloom blobs (you lose a heart). 3 hearts, 60 seconds. It speeds up!',
    howKeys: 'Critters pop out of the 6 bushes - press 1-6 (or Q W E / A S D) for that bush, or click them! Shiny gold critters are worth 5. Don\u2019t catch the purple Gloom blobs (you lose a heart). 3 hearts, 60 seconds. It speeds up!',
    create: function (api) {
      var t, hearts, holes, orbs, pops, msg, msgT, combo, caught, shinies, spawnT, L = {};
      function layout() { var W = api.W, H = api.H; L.cw = Math.min(W / 3, 150); L.x0 = (W - L.cw * 3) / 2; L.top = Math.max(110, H * 0.26); L.rh = Math.min((H - L.top - 90) / 2, 280); L.r = Math.min(L.cw * 0.3, L.rh * 0.3); }
      function holePos(i) { return { x: L.x0 + L.cw * (i % 3 + 0.5), y: L.top + L.rh * (Math.floor(i / 3) + 0.6) }; }
      function say(s, col) { msg = [s, col]; msgT = 1; }
      function level() { return Math.min(1, t / ROUND); }
      function spawn() {
        var free = []; for (var i = 0; i < 6; i++) if (!holes[i]) free.push(i); if (!free.length) return;
        var h = free[Math.floor(Math.random() * free.length)], r = Math.random();
        var bad = r < 0.12 + level() * 0.14, shiny = !bad && Math.random() < 0.07;
        holes[h] = { k: bad ? null : KINDS[Math.floor(Math.random() * KINDS.length)], bad: bad, shiny: shiny, t: 0, life: (bad ? 1.8 : 1.45) - level() * 0.55, gone: 0 };
      }
      function tapHole(i) {
        if (!api.playing) return; var o = holes[i]; var p = holePos(i);
        orbs.push({ x: api.W / 2, y: api.H + 20, tx: p.x, ty: p.y - L.r * 0.6, t: 0, hit: o && !o.gone ? o : null, hole: i });
      }
      function resolve(ob) {
        var o = ob.hit; if (!o || o.gone || holes[ob.hole] !== o) { combo = 0; return; }
        var p = holePos(ob.hole); o.gone = 1;
        if (o.bad) { hearts--; combo = 0; api.sfx('lifelost'); say('GLOOM! \uD83D\uDCA8', '#c4b5fd'); burst(p.x, p.y, '#6b5b9a'); if (hearts <= 0) api.gameOver(); return; }
        caught++; combo++; var pts = o.shiny ? 5 : 1 + (combo >= 10 ? 1 : 0); api.addScore(pts);
        api.sfx(o.shiny ? 'perfect' : 'point'); burst(p.x, p.y, o.shiny ? '#ffd23f' : o.k.c);
        if (o.shiny) { shinies++; say('\u2728 SHINY ' + o.k.n.toUpperCase() + '! +5', '#ffd23f'); if (shinies >= 3 && GA.Prog) GA.Prog.event('catchShiny3'); }
        else if (combo > 0 && combo % 10 === 0) say(combo + ' COMBO! x2', '#7dd3fc');
      }
      function burst(x, y, col) { for (var i = 0; i < 12; i++) { var a = Math.random() * 6.28, s = 60 + Math.random() * 120; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.6, col: col }); } }
      function pick(x, y) { var best = -1, bd = 1e9; for (var i = 0; i < 6; i++) { var p = holePos(i), d = Math.hypot(x - p.x, y - (p.y - L.r * 0.5)); if (d < bd) { bd = d; best = i; } } return bd < L.cw * 0.6 ? best : -1; }
      return {
        reset: function () { layout(); t = 0; hearts = 3; holes = [null, null, null, null, null, null]; orbs = []; pops = []; msgT = 0; combo = 0; caught = 0; shinies = 0; spawnT = 0.6; },
        resize: function () { layout(); },
        update: function (dt) {
          if (msgT > 0) msgT -= dt;
          for (var i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.vy += 300 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          if (!api.playing) return;
          t += dt; spawnT -= dt; if (t >= ROUND) { say('TIME!', '#fff'); api.gameOver(); return; }
          if (spawnT <= 0) { spawn(); if (Math.random() < level() * 0.5) spawn(); spawnT = 0.95 - level() * 0.5; }
          for (i = 0; i < 6; i++) { var o = holes[i]; if (!o) continue; o.t += dt; if (o.gone) { o.gone += dt; if (o.gone > 0.25) holes[i] = null; } else if (o.t > o.life) { if (!o.bad) { combo = 0; } holes[i] = null; } }
          for (i = orbs.length - 1; i >= 0; i--) { var ob = orbs[i]; ob.t += dt * 5; if (ob.t >= 1) { orbs.splice(i, 1); resolve(ob); if (!api.playing) return; } }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i;
          var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#9be7ff'); gr.addColorStop(0.3, '#c8f7a6'); gr.addColorStop(1, '#6fbf5a'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
          c.fillStyle = 'rgba(255,255,255,.7)'; [[0.2, 0.08], [0.7, 0.13]].forEach(function (q) { var x = ((q[0] * W + t * 12) % (W + 120)) - 60; dots(c, 'rgba(255,255,255,.7)', [[x, q[1] * H, 18], [x + 20, q[1] * H - 6, 22], [x + 42, q[1] * H, 16]]); });
          for (i = 0; i < 6; i++) {
            var p = holePos(i), o = holes[i], r = L.r;
            // critter rises out from behind the bush
            if (o) {
              var up = o.gone ? Math.max(0, 1 - o.gone * 4) : Math.min(1, o.t * 6, (o.life - o.t) * 6 + 0.2), cy = p.y - r * 0.2 - up * r * 1.3;
              c.save(); c.beginPath(); c.rect(p.x - L.cw / 2, 0, L.cw, p.y); c.clip();
              if (o.bad) gloom(c, p.x, cy, r, t); else critter(c, p.x, cy, r, o.k, o.shiny, t);
              c.restore();
            }
            dots(c, '#2f9e44', [[p.x - r * 0.95, p.y + r * 0.1, r * 0.8], [p.x + r * 0.95, p.y + r * 0.1, r * 0.8], [p.x, p.y - r * 0.15, r * 0.95]]);
            dots(c, '#40c057', [[p.x - r * 0.5, p.y - r * 0.3, r * 0.35], [p.x + r * 0.6, p.y - r * 0.05, r * 0.3]]);
            dots(c, '#ff6b8b', [[p.x - r * 0.9, p.y - r * 0.2, r * 0.1], [p.x + r * 1.1, p.y + r * 0.3, r * 0.1]]);
            if (!api.touch) U.text(c, String(i + 1), p.x, p.y + r * 0.85, 13, 'rgba(255,255,255,.75)');
          }
          for (i = 0; i < orbs.length; i++) { var ob = orbs[i], k = ob.t, x = ob.x + (ob.tx - ob.x) * k, y = ob.y + (ob.ty - ob.y) * k - Math.sin(k * Math.PI) * 120, s = 13;
            c.save(); c.translate(x, y); c.rotate(k * 8); c.fillStyle = '#ff4f6b'; c.beginPath(); c.arc(0, 0, s, Math.PI, 0); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, s, 0, Math.PI); c.fill(); c.fillStyle = '#222'; c.fillRect(-s, -1.5, s * 2, 3); c.beginPath(); c.arc(0, 0, 4, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 2.2, 0, 7); c.fill(); c.restore(); }
          for (i = 0; i < pops.length; i++) { var q = pops[i]; c.globalAlpha = Math.max(0, q.life / 0.6); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, 5, 0, 7); c.fill(); } c.globalAlpha = 1;
          for (i = 0; i < 3; i++) U.heart(c, 22 + i * 28, 30, 22, i < hearts ? '#ff4f8b' : 'rgba(255,255,255,.4)');
          U.text(c, String(api.score), W - 16, 30, 30, '#fff', 'right', '#000');
          var tl = Math.max(0, ROUND - t), bw = Math.min(200, W * 0.4); c.fillStyle = 'rgba(0,0,0,.25)'; U.rr(c, W / 2 - bw / 2, 22, bw, 14, 7); c.fill(); c.fillStyle = tl < 10 ? '#ff6b6b' : '#ffd23f'; U.rr(c, W / 2 - bw / 2, 22, Math.max(14, bw * tl / ROUND), 14, 7); c.fill(); U.text(c, '\u23F1 ' + Math.ceil(tl), W / 2, 50, 14, '#fff', 'center', '#000');
          if (combo >= 3) U.text(c, 'COMBO ' + combo, W - 16, 60, 16, '#fff', 'right', '#000');
          if (msgT > 0) U.text(c, msg[0], W / 2, L.top - 30, 26, msg[1], 'center', '#000');
          if (api.playing && t < 3) U.text(c, api.touch ? 'TAP the critters! Not the Gloom!' : 'Press 1-6 (or click) to catch!', W / 2, H - 40, 18, '#fff', 'center', '#000');
        },
        dbg: function () { return { t: t, hearts: hearts, caught: caught, shinies: shinies, combo: combo, holes: holes.map(function (o, i) { var p = holePos(i); return o ? { bad: o.bad, shiny: o.shiny, gone: !!o.gone, t: o.t, x: p.x, y: p.y } : null; }) }; },
        onDown: function (x, y) { var h = pick(x, y); if (h >= 0) tapHole(h); },
        onKey: function (k, down) { if (!down) return; var h = KEYS[String(k).toLowerCase()]; if (h != null) tapHole(h); }
      };
    }
  });
})();
