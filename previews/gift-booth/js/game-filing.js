/* Grok Arcade - bonus game #16: Gus's Filing Frenzy (Hall of Game Records tie-in).
   Folders fall toward Gus's filing cabinet. File the LOWEST folder into the drawer of the same color (tap the drawer, or keys 1-3 / arrows),
   and toss grey JUNK MAIL into the trash (4 / Down / T). Gold RECORD folders are worth 5. Wrong drawer or a folder hitting the floor costs
   one of Gus's 3 patience points. 60 seconds, it speeds up! */
(function () {
  'use strict';
  var U = GA.MG.U;
  var BINS = [{ n: 'PINK', c: '#ff4fd8' }, { n: 'CYAN', c: '#3ff0ff' }, { n: 'GREEN', c: '#4ade80' }, { n: 'TRASH', c: '#9ca3af' }];
  var GAMES = ['SKY', 'LAND', 'GRID', 'FC', 'PETS', 'LIFE', 'DASH', 'POKE', 'RIDES', 'BRAWL', 'SPOOKS', 'BLOCKS'];
  var ROUND = 60;
  var KEYS = { '1': 0, '2': 1, '3': 2, '4': 3, arrowleft: 0, arrowup: 1, arrowright: 2, arrowdown: 3, t: 3, a: 0, s: 1, d: 2, f: 3 };
  GA.MG.register({
    id: 'filing', name: 'Gus\u2019s Filing Frenzy', ticketDiv: 3,
    howTouch: 'Folders fall toward Gus\u2019s cabinet! TAP the drawer that matches the LOWEST folder\u2019s color. Grey JUNK MAIL goes in the TRASH. Folders with a glowing gold border are RECORDS worth 5. Wrong drawer or a dropped folder costs one of Gus\u2019s 3 patience. 60 seconds!',
    howKeys: 'Folders fall toward Gus\u2019s cabinet! Press 1 2 3 (or \u2190 \u2191 \u2192) for the drawer matching the LOWEST folder, and 4 / \u2193 for the TRASH (grey junk mail). Gold-bordered RECORD folders are worth 5. Wrong drawer or a dropped folder costs Gus\u2019s patience (3). 60 seconds!',
    create: function (api) {
      var t, patience, folders, pops, msg, msgT, combo, filed, spawnT, gusMood, flash, L = {};
      function layout() { var W = api.W, H = api.H; L.bw = Math.min((W - 24) / 4, 130); L.x0 = (W - L.bw * 4) / 2; L.bh = Math.min(120, H * 0.17); L.by = H - L.bh - 18; L.fw = Math.min(110, W * 0.26); L.fh = L.fw * 0.68; L.top = 128; }
      function say(s, col) { msg = [s, col]; msgT = 1.1; }
      function level() { return Math.min(1, t / ROUND); }
      function spawn() {
        var r = Math.random(), kind = r < 0.14 + level() * 0.08 ? 3 : Math.floor(Math.random() * 3), gold = kind !== 3 && Math.random() < 0.08;
        folders.push({ k: kind, gold: gold, y: L.top - L.fh, x: api.W / 2 + (Math.random() - 0.5) * Math.min(120, api.W * 0.3), lab: GAMES[Math.floor(Math.random() * GAMES.length)], rot: (Math.random() - 0.5) * 0.3, fly: 0 });
      }
      function lowest() { var best = null; for (var i = 0; i < folders.length; i++) { var f = folders[i]; if (f.fly) continue; if (!best || f.y > best.y) best = f; } return best; }
      function binX(i) { return L.x0 + L.bw * (i + 0.5); }
      function file(bin) {
        if (!api.playing) return; var f = lowest(); flash = [bin, 0.25];
        if (!f) { return; }
        f.fly = 0.001; f.tx = binX(bin); f.ty = L.by + 10; f.sx = f.x; f.sy = f.y;
        if (f.k === bin) {
          filed++; combo++; var pts = f.gold ? 5 : 1 + (combo >= 10 ? 1 : 0); api.addScore(pts); api.sfx(f.gold ? 'perfect' : 'point'); f.ok = true;
          burst(binX(bin), L.by, f.gold ? '#ffd23f' : BINS[bin].c);
          if (f.gold) say('\u2B50 RECORD FILED! +5', '#ffd23f'); else if (combo > 0 && combo % 10 === 0) { say(combo + ' IN A ROW! Gus almost smiled.', '#7dd3fc'); if (GA.Prog && combo >= 20) GA.Prog.event('filingCombo20'); }
          gusMood = Math.min(1, gusMood + 0.08);
        } else { f.ok = false; miss(f.k === 3 ? 'That\u2019s JUNK MAIL!' : 'WRONG DRAWER!'); }
      }
      function miss(s) { patience--; combo = 0; gusMood = 0; api.sfx('lifelost'); say(s + ' \uD83D\uDE24', '#ff6b6b'); if (patience <= 0) api.gameOver(); }
      function burst(x, y, col) { for (var i = 0; i < 12; i++) { var a = Math.random() * 6.28, s = 60 + Math.random() * 120; pops.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.6, col: col }); } }
      function folder(c, f) {
        var w = L.fw, h = L.fh, col = BINS[f.k].c;
        c.save(); c.translate(f.x, f.y); c.rotate(f.rot); if (f.fly) { var s = 1 - Math.min(1, f.fly) * 0.6; c.scale(s, s); }
        c.fillStyle = 'rgba(0,0,0,.25)'; U.rr(c, -w / 2 + 4, -h / 2 + 5, w, h, 6); c.fill();
        c.fillStyle = f.k === 3 ? '#d1d5db' : col; U.rr(c, -w / 2, -h / 2 - 10, w * 0.4, 16, 5); c.fill(); U.rr(c, -w / 2, -h / 2, w, h, 6); c.fill();
        c.fillStyle = 'rgba(255,255,255,.85)'; U.rr(c, -w * 0.36, -h * 0.2, w * 0.72, h * 0.38, 4); c.fill();
        if (f.k === 3) { U.text(c, 'JUNK MAIL', 0, 0, Math.round(w * 0.13), '#374151'); c.strokeStyle = '#6b7280'; c.lineWidth = 2; c.strokeRect(-w * 0.42, h * 0.24, w * 0.84, h * 0.14); }
        else { U.text(c, f.gold ? '\u2605 RECORD' : f.lab, 0, 0, Math.round(w * 0.15), '#1f2937'); }
        if (f.gold) { c.strokeStyle = '#ffd23f'; c.lineWidth = 5; c.shadowColor = '#ffd23f'; c.shadowBlur = 14; U.rr(c, -w / 2, -h / 2, w, h, 6); c.stroke(); c.shadowBlur = 0; for (var i = 0; i < 3; i++) { var a = t * 3 + i * 2.1; U.text(c, '\u2726', Math.cos(a) * w * 0.6, Math.sin(a) * h * 0.6, 14, '#fff8b0'); } }
        c.restore();
      }
      function drawGus(c, x, y, r) {
        c.save(); c.translate(x, y);
        c.fillStyle = '#7a4b2a'; c.beginPath(); c.ellipse(0, r * 1.25, r * 1.1, r * 0.6, 0, Math.PI, 0); c.fill();
        c.fillStyle = '#f1c7a5'; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
        c.fillStyle = '#d6d6d6'; c.beginPath(); c.arc(-r * 0.85, -r * 0.1, r * 0.35, 0, 7); c.arc(r * 0.85, -r * 0.1, r * 0.35, 0, 7); c.fill();
        var b = 0.35 - gusMood * 0.5; c.strokeStyle = '#bdbdbd'; c.lineWidth = r * 0.16; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-r * 0.6, -r * 0.35 - b * r * 0.3); c.lineTo(-r * 0.15, -r * 0.35 + b * r * 0.3); c.moveTo(r * 0.6, -r * 0.35 - b * r * 0.3); c.lineTo(r * 0.15, -r * 0.35 + b * r * 0.3); c.stroke();
        c.strokeStyle = '#2b2b2b'; c.lineWidth = 2.5; c.beginPath(); c.arc(-r * 0.36, -r * 0.08, r * 0.22, 0, 7); c.moveTo(r * 0.58, -r * 0.08); c.arc(r * 0.36, -r * 0.08, r * 0.22, 0, 7); c.stroke();
        c.fillStyle = '#111'; c.beginPath(); c.arc(-r * 0.36, -r * 0.08, r * 0.07, 0, 7); c.arc(r * 0.36, -r * 0.08, r * 0.07, 0, 7); c.fill();
        c.fillStyle = '#e8a98a'; c.beginPath(); c.arc(0, r * 0.15, r * 0.17, 0, 7); c.fill();
        c.fillStyle = '#d6d6d6'; c.beginPath(); c.ellipse(-r * 0.22, r * 0.38, r * 0.28, r * 0.13, 0.3, 0, 7); c.ellipse(r * 0.22, r * 0.38, r * 0.28, r * 0.13, -0.3, 0, 7); c.fill();
        c.strokeStyle = '#6b2a2a'; c.lineWidth = 3; c.beginPath(); if (gusMood > 0.6) c.arc(0, r * 0.5, r * 0.2, 0.3, Math.PI - 0.3); else c.arc(0, r * 0.72, r * 0.2, Math.PI + 0.4, -0.4); c.stroke();
        c.restore();
      }
      return {
        reset: function () { layout(); t = 0; patience = 3; folders = []; pops = []; msgT = 0; combo = 0; filed = 0; spawnT = 0.5; gusMood = 0.2; flash = null; },
        resize: function () { layout(); },
        update: function (dt) {
          if (msgT > 0) msgT -= dt; if (flash) { flash[1] -= dt; if (flash[1] <= 0) flash = null; }
          for (var i = pops.length - 1; i >= 0; i--) { var q = pops[i]; q.life -= dt; q.vy += 300 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) pops.splice(i, 1); }
          if (!api.playing) return;
          t += dt; spawnT -= dt; if (t >= ROUND) { say('CLOSING TIME!', '#fff'); api.gameOver(); return; }
          if (spawnT <= 0) { spawn(); spawnT = 1.0 - level() * 0.5; }
          var sp = 105 + level() * 95;
          for (i = folders.length - 1; i >= 0; i--) {
            var f = folders[i];
            if (f.fly) { f.fly += dt * 4; var k = Math.min(1, f.fly); f.x = f.sx + (f.tx - f.sx) * k; f.y = f.sy + (f.ty - f.sy) * k; if (f.fly >= 1) folders.splice(i, 1); continue; }
            f.y += sp * dt;
            if (f.y > L.by - L.fh * 0.3) { folders.splice(i, 1); if (f.k === 3) { api.sfx('point'); continue; } miss('DROPPED A FOLDER!'); if (!api.playing) return; }
          }
        },
        draw: function (c) {
          var W = api.W, H = api.H, i;
          var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#5a2333'); gr.addColorStop(0.7, '#3a1622'); gr.addColorStop(1, '#2a1810'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
          c.fillStyle = 'rgba(232,184,74,.35)'; c.fillRect(0, H * 0.55, W, 4);
          for (i = 0; i < 6; i++) { c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(i * W / 6 + 6, H * 0.56, W / 6 - 12, H * 0.2); }
          drawGus(c, W - 46, 108, 26);
          for (i = 0; i < 4; i++) {
            var x = L.x0 + L.bw * i, b = BINS[i], on = flash && flash[0] === i;
            c.fillStyle = i === 3 ? '#4b5563' : '#6b7280'; U.rr(c, x + 4, L.by, L.bw - 8, L.bh, 8); c.fill();
            c.fillStyle = on ? '#ffffff' : i === 3 ? '#374151' : '#7c8594'; U.rr(c, x + 10, L.by + 10, L.bw - 20, L.bh - 20, 6); c.fill();
            c.fillStyle = b.c; U.rr(c, x + L.bw * 0.2, L.by + 18, L.bw * 0.6, 22, 4); c.fill();
            U.text(c, b.n, x + L.bw / 2, L.by + 30, 13, '#111827');
            c.fillStyle = '#cfd8e6'; U.rr(c, x + L.bw * 0.3, L.by + L.bh * 0.62, L.bw * 0.4, 10, 5); c.fill();
            if (!api.touch) U.text(c, String(i + 1), x + L.bw / 2, L.by + L.bh - 12, 12, 'rgba(255,255,255,.7)');
          }
          var lo = lowest();
          for (i = 0; i < folders.length; i++) folder(c, folders[i]);
          if (lo && api.playing) { c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.setLineDash([6, 5]); U.rr(c, lo.x - L.fw / 2 - 6, lo.y - L.fh / 2 - 16, L.fw + 12, L.fh + 22, 8); c.stroke(); c.setLineDash([]); }
          for (i = 0; i < pops.length; i++) { var q = pops[i]; c.globalAlpha = Math.max(0, q.life / 0.6); c.fillStyle = q.col; c.fillRect(q.x - 3, q.y - 4, 6, 8); } c.globalAlpha = 1;
          for (i = 0; i < 3; i++) U.text(c, i < patience ? '\u2615' : '\u00b7', 24 + i * 30, 32, 24, '#fff');
          U.text(c, String(api.score), W - 16, 30, 30, '#fff', 'right', '#000');
          var tl = Math.max(0, ROUND - t), bw = Math.min(200, W * 0.4); c.fillStyle = 'rgba(0,0,0,.25)'; U.rr(c, W / 2 - bw / 2, 22, bw, 14, 7); c.fill(); c.fillStyle = tl < 10 ? '#ff6b6b' : '#ffd23f'; U.rr(c, W / 2 - bw / 2, 22, Math.max(14, bw * tl / ROUND), 14, 7); c.fill(); U.text(c, '\u23F1 ' + Math.ceil(tl), W / 2, 50, 14, '#fff', 'center', '#000');
          if (combo >= 3) U.text(c, 'STREAK ' + combo, 16, 62, 15, '#fff', 'left', '#000');
          if (msgT > 0) U.text(c, msg[0], W / 2, H * 0.48, 22, msg[1], 'center', '#000');
          if (api.playing && t < 3.5) U.text(c, api.touch ? 'TAP the drawer that matches the LOWEST folder!' : '1 2 3 = drawers \u00b7 4 = trash', W / 2, L.by - 14, 15, '#fff', 'center', '#000');
        },
        dbg: function () { var lo = lowest(); return { t: t, patience: patience, filed: filed, combo: combo, folders: folders.length, lowest: lo ? { k: lo.k, gold: lo.gold, y: lo.y } : null, bins: [0, 1, 2, 3].map(function (i) { return { x: binX(i), y: L.by + L.bh / 2 }; }) }; },
        onDown: function (x, y) { if (y < L.by - 20) { var lo = lowest(); if (!lo) return; return; } var i = Math.floor((x - L.x0) / L.bw); if (i >= 0 && i < 4) file(i); },
        onKey: function (k, down) { if (!down) return; var i = KEYS[String(k).toLowerCase()]; if (i != null) file(i); }
      };
    }
  });
})();
