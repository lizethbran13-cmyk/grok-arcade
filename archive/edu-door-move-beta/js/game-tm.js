/* Grok Arcade - the 1983 RETRO GAMES (bonus #26-#31). They live in the OLD Grok Arcade, reached through Lily's Time Machine.
   #26 MUNCH MAZE '80   swipe to steer Gobbo round the maze, eat every dot; star dots make the Byte Bugs scared (eat them!)
   #27 STAR SWOOPERS '81 drag to move, auto-fire; the Swoopers sway in formation then dive at you in loops
   #28 TOAD ROAD '81    tap to hop forward, swipe to hop sideways/back; cross the road, ride the logs, fill the 5 lily pads
   #29 CENTI-BUG '81    drag to move, auto-fire; split the marching Centi-Bug, mind the bouncing spider
   #30 POGO PETE '83    (brand new) Pete bounces by himself; drag left/right to land on the clouds and climb as high as you can
   #31 TIME TANGLE '83  (brand new, Lily's own) tap when the clock hand is inside the glowing slice; it speeds up and flips
   All have CRT scanlines, touch + keyboard controls, high scores and ticket payouts like every bonus game. */
(function () {
  'use strict';
  var U = GA.MG.U;
  function scan(c, W, H) { c.fillStyle = 'rgba(0,0,0,.2)'; for (var y = 0; y < H; y += 3) c.fillRect(0, y, W, 1); var v = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = v; c.fillRect(0, 0, W, H); }
  function px(c, s, x, y, size, col, al) { c.font = 'bold ' + size + 'px "Courier New",monospace'; c.textAlign = al || 'center'; c.textBaseline = 'middle'; c.fillStyle = col || '#fff'; c.fillText(s, x, y); }
  function hud(c, api, lives, extra) { px(c, 'SCORE ' + api.score, 12, 24, 18, '#fff', 'left'); px(c, 'HI ' + Math.max(api.score, api.best()), api.W / 2, 24, 16, '#ffe14d'); for (var i = 0; i < lives; i++) { c.fillStyle = '#ff4f8b'; c.fillRect(api.W - 24 - i * 20, 16, 14, 14); } if (extra) px(c, extra, api.W - 12, 48, 14, '#7dd3fc', 'right'); }
  function swipe(st, x, y) { var dx = x - st.x0, dy = y - st.y0; if (Math.hypot(dx, dy) < 18) return null; return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'); }
  var KEYDIR = { ArrowLeft: 'L', a: 'L', A: 'L', ArrowRight: 'R', d: 'R', D: 'R', ArrowUp: 'U', w: 'U', W: 'U', ArrowDown: 'D', s: 'D', S: 'D' };
  var DV = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1] };
  function stars(n, W, H) { var a = []; for (var i = 0; i < n; i++) a.push([Math.random() * W, Math.random() * H, Math.random() * 1.5 + 0.5]); return a; }

  /* ===================== #26 MUNCH MAZE '80 ===================== */
  var MAZE = [
    '###############',
    '#o....#.#....o#',
    '#.##.##.##.##.#',
    '#.............#',
    '#.##.#.#.#.##.#',
    '#....#...#....#',
    '####.## ##.####',
    '   #.#   #.#   ',
    '####.# ### .###',
    '#......#......#',
    '#.##.#####.##.#',
    '#o.#.......#.o#',
    '##.#.#.#.#.#.##',
    '#....#...#....#',
    '#.###########.#',
    '#.............#',
    '###############'];
  GA.MG.register({
    id: 'tm_munch', name: 'Munch Maze \u201980', ticketDiv: 3, retro: true,
    howTouch: 'SWIPE (or drag) in a direction to steer Gobbo through the maze. Eat every dot (+1). Star dots make the Byte Bugs scared for a few seconds: eat them for +10! Clear the maze for a bonus. 3 lives.',
    howKeys: 'ARROW keys (or WASD) steer Gobbo through the maze. Eat every dot (+1). Star dots make the Byte Bugs scared for a few seconds: eat them for +10! Clear the maze for a bonus. 3 lives.',
    create: function (api) {
      var G, cols = 15, rows = MAZE.length, ts, ox, oy, P, bugs, lives, lvl, scared, t, sw = {}, dead, msg, msgT, dots;
      function layout() { ts = Math.floor(Math.min(api.W / cols, (api.H - 120) / rows)); ox = Math.floor((api.W - ts * cols) / 2); oy = Math.floor(70 + (api.H - 120 - ts * rows) / 2); }
      function wall(x, y) { if (y < 0 || y >= rows) return true; x = (x + cols) % cols; return G[y][x] === '#'; }
      function loadMaze() { G = MAZE.map(function (r) { return r.split(''); }); dots = 0; G.forEach(function (r) { r.forEach(function (c) { if (c === '.' || c === 'o') dots++; }); }); }
      function spawn() { P = { x: 7, y: 15, fx: 7, fy: 15, d: 'L', want: 'L', m: 0 }; var cs = ['#ff4f8b', '#3ff0ff', '#ffb347', '#a78bfa'];
        bugs = cs.map(function (c, i) { return { x: 6 + (i % 3), y: 7, fx: 6 + (i % 3), fy: 7, d: i % 2 ? 'L' : 'R', col: c, wait: i * 1.2, eaten: 0 }; }); scared = 0; dead = 0; }
      function step(o, sp, dt, pick) { // tile-to-tile movement; pick(o) chooses the next direction at each tile centre
        var dx = o.fx - o.x, dy = o.fy - o.y, d = Math.hypot(dx, dy), mv = sp * dt;
        if (d <= mv) { o.x = o.fx; o.y = o.fy; mv -= d; var nd = pick(o); if (nd) { var v = DV[nd], nx = o.x + v[0], ny = o.y + v[1]; if (!wall(nx, ny)) { o.d = nd; if (nx < 0) { o.x = cols; nx = cols - 1; } if (nx >= cols) { o.x = -1; nx = 0; } o.fx = nx; o.fy = ny; dx = o.fx - o.x; dy = o.fy - o.y; d = Math.hypot(dx, dy) || 1; o.x += dx / d * Math.min(mv, d); o.y += dy / d * Math.min(mv, d); } } }
        else { o.x += dx / d * mv; o.y += dy / d * mv; } }
      function opts(o) { return ['L', 'R', 'U', 'D'].filter(function (k) { var v = DV[k]; return !wall(o.x + v[0], o.y + v[1]); }); }
      var REV = { L: 'R', R: 'L', U: 'D', D: 'U' };
      function bugPick(b) { var o = opts(b).filter(function (k) { return k !== REV[b.d]; }); if (!o.length) o = opts(b); if (!o.length) return null;
        var best = o[0], bd = scared > 0 ? -1 : 1e9; o.forEach(function (k) { var v = DV[k], dd = Math.hypot(b.x + v[0] - P.x, b.y + v[1] - P.y); if (scared > 0 ? dd > bd : dd < bd) { bd = dd; best = k; } });
        return Math.random() < (scared > 0 ? 0.75 : 0.55 + Math.min(0.3, lvl * 0.05)) ? best : o[Math.floor(Math.random() * o.length)]; }
      function say(s) { msg = s; msgT = 1.4; }
      return {
        reset: function () { layout(); loadMaze(); lives = 3; lvl = 1; t = 0; msgT = 0; spawn(); say('READY!'); },
        resize: layout,
        update: function (dt) { if (msgT > 0) msgT -= dt; if (!api.playing) return; t += dt;
          if (dead > 0) { dead -= dt; if (dead <= 0) { if (lives <= 0) { api.gameOver(); return; } spawn(); say('READY!'); } return; }
          if (msgT > 0.9) return;
          step(P, 5.4 + lvl * 0.15, dt, function (o) { var v = DV[o.want]; if (!wall(o.x + v[0], o.y + v[1])) return o.want; v = DV[o.d]; return wall(o.x + v[0], o.y + v[1]) ? null : o.d; });
          var tx = Math.round(P.x), ty = Math.round(P.y); if (ty >= 0 && ty < rows && tx >= 0 && tx < cols) { var ch = G[ty][tx]; if (ch === '.' || ch === 'o') { G[ty][tx] = ' '; dots--; if (ch === 'o') { scared = 7 - Math.min(4, lvl * 0.6); api.addScore(5); api.sfx('powerup'); say('BUGS ARE SCARED!'); } else { api.addScore(1); if (dots % 4 === 0) api.sfx('boop'); }
            if (dots <= 0) { api.addScore(20 + lvl * 5); api.sfx('level'); lvl++; loadMaze(); spawn(); say('LEVEL ' + lvl + '!'); return; } } }
          if (scared > 0) scared -= dt;
          bugs.forEach(function (b) { if (b.wait > 0) { b.wait -= dt; return; } step(b, b.eaten > 0 ? 9 : scared > 0 ? 2.6 : 3.9 + lvl * 0.3, dt, b.eaten > 0 ? function (o) { if (Math.round(o.x) === 7 && Math.round(o.y) === 7) { o.eaten = 0; return null; } var oo = opts(o), best = oo[0], bd = 1e9; oo.forEach(function (k) { var v = DV[k], dd = Math.hypot(o.x + v[0] - 7, o.y + v[1] - 7); if (dd < bd) { bd = dd; best = k; } }); return best; } : bugPick);
            if (b.eaten <= 0 && Math.hypot(b.x - P.x, b.y - P.y) < 0.6) { if (scared > 0) { b.eaten = 1; api.addScore(10); api.sfx('perfect'); say('+10 CHOMP!'); } else { lives--; dead = 1.4; api.sfx('lifelost'); say(lives > 0 ? 'OUCH!' : 'GAME OVER'); } } });
        },
        draw: function (c) { var W = api.W, H = api.H, x, y; c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
          for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) { var ch = G[y][x], X = ox + x * ts, Y = oy + y * ts;
            if (ch === '#') { c.fillStyle = '#1d2bd8'; c.fillRect(X + 1, Y + 1, ts - 2, ts - 2); c.strokeStyle = '#5b8cff'; c.lineWidth = 2; c.strokeRect(X + 3, Y + 3, ts - 6, ts - 6); }
            else if (ch === '.') { c.fillStyle = '#ffd9b3'; c.fillRect(X + ts / 2 - 2, Y + ts / 2 - 2, 4, 4); }
            else if (ch === 'o' && Math.floor(t * 4) % 2 === 0) { c.fillStyle = '#ffe14d'; c.beginPath(); for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? ts * 0.16 : ts * 0.38; c.lineTo(X + ts / 2 + Math.cos(a) * r, Y + ts / 2 + Math.sin(a) * r); } c.fill(); } }
          // Gobbo: a purple munching blob with a little antenna
          var gx = ox + (P.x + 0.5) * ts, gy = oy + (P.y + 0.5) * ts, mo = dead > 0 ? 0 : Math.abs(Math.sin(t * 12)) * 0.6, ang = { R: 0, D: Math.PI / 2, L: Math.PI, U: -Math.PI / 2 }[P.d];
          if (!(dead > 0 && Math.floor(t * 10) % 2)) { c.fillStyle = '#c084fc'; c.beginPath(); c.moveTo(gx, gy); c.arc(gx, gy, ts * 0.45, ang + mo, ang + Math.PI * 2 - mo); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(gx + Math.cos(ang - 1.2) * ts * 0.2, gy + Math.sin(ang - 1.2) * ts * 0.2, ts * 0.08, 0, 7); c.fill(); c.strokeStyle = '#c084fc'; c.lineWidth = 2; c.beginPath(); c.moveTo(gx, gy - ts * 0.4); c.lineTo(gx + 3, gy - ts * 0.65); c.stroke(); c.fillStyle = '#ffe14d'; c.fillRect(gx + 1, gy - ts * 0.72, 4, 4); }
          bugs.forEach(function (b) { var bx = ox + (b.x + 0.5) * ts, by = oy + (b.y + 0.5) * ts, s = ts * 0.42; if (b.eaten > 0) { c.fillStyle = '#fff'; c.fillRect(bx - 6, by - 3, 4, 4); c.fillRect(bx + 2, by - 3, 4, 4); return; }
            var col = scared > 0 ? (scared < 2 && Math.floor(t * 6) % 2 ? '#fff' : '#2563eb') : b.col; c.fillStyle = col; c.fillRect(bx - s, by - s * 0.6, s * 2, s * 1.4); c.fillRect(bx - s * 0.6, by - s, s * 1.2, s * 0.5);
            for (var l = 0; l < 3; l++) c.fillRect(bx - s + l * s * 0.8, by + s * 0.8 + (Math.floor(t * 8 + l) % 2) * 2, s * 0.35, s * 0.3); c.fillStyle = '#000'; c.fillRect(bx - s * 0.5, by - s * 0.3, s * 0.3, s * 0.3); c.fillRect(bx + s * 0.2, by - s * 0.3, s * 0.3, s * 0.3);
            c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(bx - s * 0.5, by - s); c.lineTo(bx - s * 0.8, by - s * 1.4); c.moveTo(bx + s * 0.5, by - s); c.lineTo(bx + s * 0.8, by - s * 1.4); c.stroke(); });
          hud(c, api, lives, 'LVL ' + lvl); if (msgT > 0) px(c, msg, W / 2, oy + ts * 9.5, 22, '#ffe14d');
          if (api.playing && t < 3) px(c, api.touch ? 'SWIPE TO STEER' : 'ARROWS TO STEER', W / 2, H - 22, 15, '#7dd3fc');
          scan(c, W, H); },
        dbg: function () { return { P: [P.x, P.y, P.d], lives: lives, dots: dots, lvl: lvl, scared: scared }; },
        onDown: function (x, y) { sw.x0 = x; sw.y0 = y; },
        onMove: function (x, y, down) { if (!down) return; var d = swipe(sw, x, y); if (d) { P.want = d; sw.x0 = x; sw.y0 = y; } },
        onUp: function () {},
        onKey: function (k, down) { if (down && KEYDIR[k]) P.want = KEYDIR[k]; }
      };
    }
  });

  /* ===================== #27 STAR SWOOPERS '81 ===================== */
  GA.MG.register({
    id: 'tm_swoop', name: 'Star Swoopers \u201981', ticketDiv: 3, retro: true,
    howTouch: 'DRAG to move your ship (it fires by itself). The Swoopers sway in formation (+1 each) and then DIVE at you in loops (+3 if you get them mid-dive). Dodge their shots! Clear the wave for a bonus. 3 ships.',
    howKeys: 'LEFT / RIGHT (or A/D) to move your ship (it fires by itself). The Swoopers sway in formation (+1 each) and then DIVE at you in loops (+3 mid-dive). Dodge their shots! Clear the wave for a bonus. 3 ships.',
    create: function (api) {
      var t, px0, tx, lives, inv, shots, foes, eb, fireT, diveT, wave, booms, st, keyL, keyR, msg, msgT;
      function newWave() { foes = []; var cols = 6, rows = 3 + Math.min(2, Math.floor(wave / 2)); for (var r = 0; r < rows; r++) for (var k = 0; k < cols; k++) foes.push({ hx: (k - (cols - 1) / 2) * 44, hy: 90 + r * 38, x: api.W / 2, y: -40 - r * 30, st: 'enter', k: r, t: 0, col: ['#ff4fd8', '#3ff0ff', '#ffe14d', '#4ade80', '#fb923c'][r % 5] }); diveT = 2.5; msg = 'WAVE ' + wave; msgT = 1.4; }
      function boom(x, y, col) { for (var i = 0; i < 12; i++) { var a = Math.random() * 6.28, s = 40 + Math.random() * 120; booms.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6, col: col }); } }
      function hitMe() { if (inv > 0) return; lives--; inv = 2; api.sfx('lifelost'); boom(px0, api.H - 70, '#fff'); if (lives <= 0) api.gameOver(); }
      return {
        reset: function () { t = 0; px0 = tx = api.W / 2; lives = 3; inv = 0; shots = []; eb = []; fireT = 0; wave = 1; booms = []; st = stars(70, api.W, api.H); keyL = keyR = false; newWave(); },
        resize: function () {},
        update: function (dt) { var W = api.W, H = api.H, i; if (msgT > 0) msgT -= dt; st.forEach(function (s) { s[1] += s[2] * 40 * dt; if (s[1] > H) s[1] = 0; });
          for (i = booms.length - 1; i >= 0; i--) { var b = booms[i]; b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.life <= 0) booms.splice(i, 1); }
          if (!api.playing) return; t += dt; if (inv > 0) inv -= dt;
          if (keyL) tx = px0 - 300; if (keyR) tx = px0 + 300; tx = U.clamp(tx, 20, W - 20); px0 += U.clamp(tx - px0, -420 * dt, 420 * dt);
          var py = H - 70; fireT -= dt; if (fireT <= 0) { fireT = 0.3; shots.push({ x: px0, y: py - 18 }); api.sfx('zap'); }
          for (i = shots.length - 1; i >= 0; i--) { shots[i].y -= 520 * dt; if (shots[i].y < -10) shots.splice(i, 1); }
          var sway = Math.sin(t * 1.1) * 30;
          diveT -= dt; if (diveT <= 0) { var idle = foes.filter(function (f) { return f.st === 'home'; }); if (idle.length) { var f = idle[Math.floor(Math.random() * idle.length)]; f.st = 'dive'; f.t = 0; f.sx = f.x; f.sy = f.y; f.side = f.x < W / 2 ? 1 : -1; f.tx = px0; } diveT = Math.max(0.7, 2.2 - wave * 0.2) + Math.random(); }
          foes.forEach(function (f) { var hx = W / 2 + f.hx + sway, hy = f.hy; f.t += dt;
            if (f.st === 'enter') { f.x += (hx - f.x) * Math.min(1, dt * 2.2); f.y += (hy - f.y) * Math.min(1, dt * 2.2); if (Math.hypot(hx - f.x, hy - f.y) < 3) f.st = 'home'; }
            else if (f.st === 'home') { f.x = hx; f.y = hy + Math.sin(t * 3 + f.hx) * 3; }
            else if (f.st === 'dive') { var k = f.t / 2.6; f.x = f.sx + f.side * Math.sin(k * Math.PI * 2) * 70 + (f.tx - f.sx) * Math.min(1, k * 1.4); f.y = f.sy + k * (H + 60); if (Math.random() < dt * (0.9 + wave * 0.15) && f.y < py - 60) eb.push({ x: f.x, y: f.y + 10, vx: (px0 - f.x) * 0.25 }); if (f.y > H + 30) { f.st = 'enter'; f.y = -30; f.x = W / 2; } }
            if (Math.abs(f.x - px0) < 20 && Math.abs(f.y - py) < 18) { hitMe(); f.st = 'enter'; f.y = -30; } });
          for (i = eb.length - 1; i >= 0; i--) { var e = eb[i]; e.y += 230 * dt; e.x += e.vx * dt; if (Math.abs(e.x - px0) < 12 && Math.abs(e.y - py) < 14) { eb.splice(i, 1); hitMe(); continue; } if (e.y > H + 10) eb.splice(i, 1); }
          for (i = shots.length - 1; i >= 0; i--) { var s = shots[i]; for (var j = foes.length - 1; j >= 0; j--) { var f2 = foes[j]; if (Math.abs(s.x - f2.x) < 17 && Math.abs(s.y - f2.y) < 15) { api.addScore(f2.st === 'dive' ? 3 : 1); api.sfx(f2.st === 'dive' ? 'perfect' : 'brick'); boom(f2.x, f2.y, f2.col); foes.splice(j, 1); shots.splice(i, 1); break; } } }
          if (!foes.length) { api.addScore(10 + wave * 2); api.sfx('level'); wave++; newWave(); }
        },
        draw: function (c) { var W = api.W, H = api.H, py = H - 70; c.fillStyle = '#05010f'; c.fillRect(0, 0, W, H); st.forEach(function (s) { c.fillStyle = 'rgba(255,255,255,' + (0.3 + s[2] * 0.3) + ')'; c.fillRect(s[0], s[1], s[2], s[2]); });
          foes.forEach(function (f) { var fl = Math.floor(t * 6) % 2; c.fillStyle = f.col; c.beginPath(); c.moveTo(f.x, f.y - 12); c.lineTo(f.x + 16, f.y + (fl ? 2 : 8)); c.lineTo(f.x + 6, f.y + 4); c.lineTo(f.x, f.y + 12); c.lineTo(f.x - 6, f.y + 4); c.lineTo(f.x - 16, f.y + (fl ? 2 : 8)); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.fillRect(f.x - 5, f.y - 3, 3, 3); c.fillRect(f.x + 2, f.y - 3, 3, 3); });
          c.fillStyle = '#fef08a'; shots.forEach(function (s) { c.fillRect(s.x - 1.5, s.y - 8, 3, 10); }); c.fillStyle = '#ff6b6b'; eb.forEach(function (e) { c.fillRect(e.x - 2, e.y - 5, 4, 8); });
          if (!(inv > 0 && Math.floor(t * 12) % 2)) { c.fillStyle = '#e2e8f0'; c.beginPath(); c.moveTo(px0, py - 18); c.lineTo(px0 + 16, py + 12); c.lineTo(px0, py + 6); c.lineTo(px0 - 16, py + 12); c.closePath(); c.fill(); c.fillStyle = '#3ff0ff'; c.fillRect(px0 - 3, py - 6, 6, 8); c.fillStyle = Math.floor(t * 20) % 2 ? '#fb923c' : '#fde047'; c.fillRect(px0 - 4, py + 8, 8, 6); }
          booms.forEach(function (b) { c.globalAlpha = b.life / 0.6; c.fillStyle = b.col; c.fillRect(b.x - 2, b.y - 2, 4, 4); }); c.globalAlpha = 1;
          hud(c, api, lives, 'WAVE ' + wave); if (msgT > 0) px(c, msg, W / 2, H * 0.45, 26, '#ffe14d'); if (api.playing && t < 3) px(c, api.touch ? 'DRAG TO MOVE' : 'LEFT / RIGHT TO MOVE', W / 2, H - 22, 15, '#7dd3fc'); scan(c, W, H); },
        dbg: function () { return { lives: lives, foes: foes.length, wave: wave, x: px0 }; },
        onDown: function (x) { tx = x; }, onMove: function (x, y, d) { if (d) tx = x; }, onUp: function () {},
        onKey: function (k, d) { if (KEYDIR[k] === 'L') keyL = d; if (KEYDIR[k] === 'R') keyR = d; if (!d && !keyL && !keyR) tx = px0; }
      };
    }
  });

  /* ===================== #28 TOAD ROAD '81 ===================== */
  GA.MG.register({
    id: 'tm_toad', name: 'Toad Road \u201981', ticketDiv: 3, retro: true,
    howTouch: 'TAP to hop forward. SWIPE left, right or down to hop that way. Cross the busy road, then ride the logs and turtles over the river (don\u2019t fall in!). Fill all 5 lily pads. +1 per new row, +10 per lily pad. 3 lives.',
    howKeys: 'ARROW keys (or WASD) to hop. Cross the busy road, then ride the logs and turtles over the river (don\u2019t fall in!). Fill all 5 lily pads. +1 per new row, +10 per lily pad. 3 lives.',
    create: function (api) {
      var t, lanes, rows = 13, ts, cols, ox, oy, F, lives, best, pads, lvl, dead, timeLeft, sw = {}, msg, msgT;
      function layout() { cols = 11; ts = Math.floor(Math.min(api.W / cols, (api.H - 110) / rows)); ox = Math.floor((api.W - ts * cols) / 2); oy = Math.floor(66 + (api.H - 110 - ts * rows) / 2); }
      function mkLanes() { var sp = 1 + (lvl - 1) * 0.18; lanes = [];
        for (var r = 0; r < rows; r++) { var L = { r: r, kind: 'safe', items: [] };
          if (r >= 7 && r <= 11) { L.kind = 'road'; var d = r % 2 ? 1 : -1, v = d * (1.2 + (r % 3) * 0.6) * sp, n = 2 + (r % 2), len = r === 9 ? 2.4 : 1.2; for (var i = 0; i < n; i++) L.items.push({ x: i * cols / n + r, len: len, col: ['#ef4444', '#facc15', '#3b82f6', '#22c55e', '#f97316'][r % 5] }); L.v = v; }
          else if (r >= 1 && r <= 5) { L.kind = 'river'; var d2 = r % 2 ? -1 : 1, v2 = d2 * (0.9 + (r % 3) * 0.45) * sp, turtle = r === 2 || r === 5, n2 = turtle ? 3 : 2, len2 = turtle ? 2 : (r === 3 ? 4 : 3); for (var j = 0; j < n2; j++) L.items.push({ x: j * cols / n2 + r * 1.3, len: len2, turtle: turtle }); L.v = v2; }
          lanes.push(L); } }
      function home() { F = { x: 5, y: 12, ride: 0, hop: 0 }; best = 12; timeLeft = 30; }
      function die(why) { if (dead > 0) return; lives--; dead = 1.3; api.sfx('lifelost'); msg = why; msgT = 1.3; }
      function hop(d) { if (!api.playing || dead > 0 || F.hop > 0) return; var v = DV[d], nx = Math.round(F.x) + v[0], ny = F.y + v[1]; if (nx < 0 || nx >= cols || ny > 12) return; F.x = nx; F.y = ny; F.hop = 0.12; api.sfx('flap');
        if (ny < best && ny > 0) { best = ny; api.addScore(1); }
        if (ny === 0) { var slot = Math.round((F.x - 1) / 2); if (F.x % 2 === 1 && slot >= 0 && slot < 5 && !pads[slot]) { pads[slot] = true; api.addScore(10); api.sfx('perfect'); msg = 'SAFE! +10'; msgT = 1; if (pads.every(Boolean)) { api.addScore(25); lvl++; pads = [false, false, false, false, false]; mkLanes(); msg = 'LEVEL ' + lvl + '!'; msgT = 1.4; api.sfx('level'); } home(); } else die('MISSED THE PAD!'); } }
      return {
        reset: function () { layout(); t = 0; lives = 3; lvl = 1; pads = [false, false, false, false, false]; dead = 0; msgT = 0; mkLanes(); home(); },
        resize: layout,
        update: function (dt) { if (msgT > 0) msgT -= dt; if (F.hop > 0) F.hop -= dt; lanes.forEach(function (L) { if (!L.v) return; L.items.forEach(function (it) { it.x += L.v * dt; if (L.v > 0 && it.x > cols + 1) it.x -= cols + it.len + 2; if (L.v < 0 && it.x < -it.len - 1) it.x += cols + it.len + 2; }); });
          if (!api.playing) return; t += dt;
          if (dead > 0) { dead -= dt; if (dead <= 0) { if (lives <= 0) { api.gameOver(); return; } home(); } return; }
          timeLeft -= dt; if (timeLeft <= 0) { die('OUT OF TIME!'); return; }
          var L = lanes[F.y];
          if (L.kind === 'road') { if (L.items.some(function (it) { return F.x + 0.3 > it.x && F.x - 0.3 < it.x + it.len - 0.4 + 0.4 && F.x + 0.5 > it.x && F.x + 0.5 < it.x + it.len + 0.1; })) die('SPLAT!'); }
          else if (L.kind === 'river') { var on = L.items.find(function (it) { var sub = it.turtle && Math.sin(t * 1.3 + it.x) > 0.85; return !sub && F.x + 0.5 > it.x && F.x + 0.5 < it.x + it.len; }); if (!on) die('SPLASH!'); else { F.x += L.v * dt; if (F.x < -0.4 || F.x > cols - 0.6) die('SWEPT AWAY!'); } }
          else if (F.y !== 0 && Math.abs(F.x - Math.round(F.x)) > 0.01 && F.hop <= 0) F.x += (Math.round(F.x) - F.x) * Math.min(1, dt * 10);
        },
        draw: function (c) { var W = api.W, H = api.H; c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
          lanes.forEach(function (L) { var Y = oy + L.r * ts; c.fillStyle = L.kind === 'road' ? '#1f2937' : L.kind === 'river' ? '#1e3a8a' : L.r === 0 ? '#14532d' : '#4c1d95'; c.fillRect(ox, Y, ts * cols, ts);
            if (L.kind === 'road') { c.fillStyle = '#fde047'; for (var k = 0; k < cols; k += 2) c.fillRect(ox + k * ts + ts * 0.3, Y + ts - 2, ts * 0.6, 2); }
            if (L.kind === 'river') { c.fillStyle = 'rgba(147,197,253,.35)'; for (var k2 = 0; k2 < cols; k2++) c.fillRect(ox + ((k2 * ts + t * 20 * (L.r % 2 ? -1 : 1)) % (ts * cols) + ts * cols) % (ts * cols), Y + ts * 0.5, ts * 0.4, 2); }
            if (L.r === 0) for (var p = 0; p < 5; p++) { var PX = ox + (1 + p * 2) * ts; c.fillStyle = '#1e3a8a'; c.fillRect(PX, Y + 2, ts, ts - 2); c.fillStyle = '#4ade80'; c.beginPath(); c.arc(PX + ts / 2, Y + ts / 2 + 1, ts * 0.38, 0.3, Math.PI * 2 - 0.3); c.lineTo(PX + ts / 2, Y + ts / 2 + 1); c.fill(); if (pads[p]) { c.fillStyle = '#86efac'; c.fillRect(PX + ts * 0.3, Y + ts * 0.3, ts * 0.4, ts * 0.4); c.fillStyle = '#000'; c.fillRect(PX + ts * 0.35, Y + ts * 0.35, 3, 3); c.fillRect(PX + ts * 0.58, Y + ts * 0.35, 3, 3); } }
            L.items.forEach(function (it) { var X = ox + it.x * ts, w = it.len * ts; if (X > ox + cols * ts || X + w < ox) return; c.save(); c.beginPath(); c.rect(ox, Y, cols * ts, ts); c.clip();
              if (L.kind === 'road') { c.fillStyle = it.col; c.fillRect(X + 2, Y + ts * 0.18, w - 4, ts * 0.64); c.fillStyle = '#93c5fd'; c.fillRect(X + (L.v > 0 ? w - ts * 0.55 : ts * 0.15), Y + ts * 0.25, ts * 0.38, ts * 0.5); c.fillStyle = '#111'; c.fillRect(X + ts * 0.2, Y + ts * 0.08, ts * 0.3, ts * 0.12); c.fillRect(X + w - ts * 0.5, Y + ts * 0.08, ts * 0.3, ts * 0.12); c.fillRect(X + ts * 0.2, Y + ts * 0.8, ts * 0.3, ts * 0.12); c.fillRect(X + w - ts * 0.5, Y + ts * 0.8, ts * 0.3, ts * 0.12); }
              else if (it.turtle) { var sub = Math.sin(t * 1.3 + it.x) > 0.85; for (var q = 0; q < it.len; q++) { c.fillStyle = sub ? 'rgba(34,197,94,.3)' : '#16a34a'; c.beginPath(); c.arc(X + q * ts + ts / 2, Y + ts / 2, ts * 0.4, 0, 7); c.fill(); c.fillStyle = sub ? 'rgba(0,0,0,0)' : '#14532d'; c.fillRect(X + q * ts + ts * 0.35, Y + ts * 0.35, ts * 0.3, ts * 0.3); } }
              else { c.fillStyle = '#92400e'; c.fillRect(X + 2, Y + ts * 0.15, w - 4, ts * 0.7); c.fillStyle = '#b45309'; for (var r2 = 0; r2 < it.len; r2++) c.fillRect(X + r2 * ts + ts * 0.2, Y + ts * 0.3, ts * 0.5, 3); }
              c.restore(); }); });
          if (!(dead > 0 && Math.floor(t * 10) % 2)) { var FX = ox + (F.x + 0.5) * ts, FY = oy + (F.y + 0.5) * ts - (F.hop > 0 ? 4 : 0), s = ts * 0.36; c.fillStyle = dead > 0 ? '#fca5a5' : '#4ade80'; c.fillRect(FX - s, FY - s * 0.6, s * 2, s * 1.5); c.fillRect(FX - s * 1.25, FY + s * 0.3, s * 0.5, s * 0.7); c.fillRect(FX + s * 0.75, FY + s * 0.3, s * 0.5, s * 0.7); c.fillStyle = '#fff'; c.fillRect(FX - s * 0.8, FY - s, s * 0.6, s * 0.6); c.fillRect(FX + s * 0.2, FY - s, s * 0.6, s * 0.6); c.fillStyle = '#000'; c.fillRect(FX - s * 0.6, FY - s * 0.8, s * 0.25, s * 0.25); c.fillRect(FX + s * 0.4, FY - s * 0.8, s * 0.25, s * 0.25); }
          hud(c, api, lives, 'LVL ' + lvl); c.fillStyle = timeLeft < 8 ? '#ef4444' : '#4ade80'; c.fillRect(ox, oy + rows * ts + 8, ts * cols * Math.max(0, timeLeft / 30), 6);
          if (msgT > 0) px(c, msg, W / 2, oy + ts * 6.5, 22, '#ffe14d'); if (api.playing && t < 3) px(c, api.touch ? 'TAP = HOP \u00b7 SWIPE = SIDEWAYS' : 'ARROWS TO HOP', W / 2, H - 22, 15, '#7dd3fc'); scan(c, W, H); },
        dbg: function () { return { F: [F.x, F.y], lives: lives, pads: pads.filter(Boolean).length, time: timeLeft }; },
        onDown: function (x, y) { sw.x0 = x; sw.y0 = y; sw.done = false; },
        onMove: function (x, y, d) { if (!d || sw.done) return; var s = swipe(sw, x, y); if (s && Math.hypot(x - sw.x0, y - sw.y0) > 28) { sw.done = true; hop(s); } },
        onUp: function () { if (!sw.done) hop('U'); sw.done = true; },
        onKey: function (k, d) { if (d && KEYDIR[k]) hop(KEYDIR[k]); }
      };
    }
  });

  /* ===================== #29 CENTI-BUG '81 ===================== */
  GA.MG.register({
    id: 'tm_centi', name: 'Centi-Bug \u201981', ticketDiv: 3, retro: true,
    howTouch: 'DRAG to move your bug zapper around the bottom of the screen (it fires by itself). The Centi-Bug snakes down through the mushrooms: every segment is +1 (the head +3) and turns into a mushroom. The bouncing spider is +5. 3 lives.',
    howKeys: 'ARROW keys (or WASD) to move your bug zapper (it fires by itself). The Centi-Bug snakes down through the mushrooms: every segment is +1 (the head +3) and turns into a mushroom. The bouncing spider is +5. 3 lives.',
    create: function (api) {
      var t, cw, gw = 16, gh, ox, oy, mush, segs, shots, P, tx, ty, lives, fire, spider, lvl, inv, keys = {}, booms, msg, msgT;
      function layout() { cw = Math.floor(api.W / gw); gh = Math.floor((api.H - 90) / cw); ox = Math.floor((api.W - cw * gw) / 2); oy = 60; }
      function key(x, y) { return x + ',' + y; }
      function field() { mush = {}; for (var i = 0; i < 32; i++) { var x = Math.floor(Math.random() * gw), y = 1 + Math.floor(Math.random() * (gh - 6)); mush[key(x, y)] = 3; } }
      function bug() { segs = []; var n = Math.min(14, 9 + lvl); for (var i = 0; i < n; i++) segs.push({ x: 7 - i, y: 0, d: 1, head: i === 0, mx: 7 - i }); }
      function fx(c) { return ox + c * cw + cw / 2; } function fy(r) { return oy + r * cw + cw / 2; }
      return {
        reset: function () { layout(); t = 0; lives = 3; lvl = 1; field(); bug(); shots = []; fire = 0; inv = 0; booms = []; P = { x: api.W / 2, y: fy(gh - 2) }; tx = P.x; ty = P.y; spider = null; msgT = 0; },
        resize: layout,
        update: function (dt) { var i; if (msgT > 0) msgT -= dt; for (i = booms.length - 1; i >= 0; i--) { booms[i].life -= dt; if (booms[i].life <= 0) booms.splice(i, 1); } if (!api.playing) return; t += dt; if (inv > 0) inv -= dt;
          var zoneTop = fy(gh - 6), sp = 380 * dt; if (keys.L) tx = P.x - 200; if (keys.R) tx = P.x + 200; if (keys.U) ty = P.y - 200; if (keys.D) ty = P.y + 200;
          tx = U.clamp(tx, ox + 10, ox + gw * cw - 10); ty = U.clamp(ty, zoneTop, fy(gh - 1)); P.x += U.clamp(tx - P.x, -sp, sp); P.y += U.clamp(ty - P.y, -sp, sp);
          fire -= dt; if (fire <= 0 && shots.length < 2) { fire = 0.16; shots.push({ x: P.x, y: P.y - 12 }); api.sfx('zap'); }
          for (i = shots.length - 1; i >= 0; i--) { var s = shots[i]; s.y -= 640 * dt; var cx = Math.floor((s.x - ox) / cw), cy = Math.floor((s.y - oy) / cw), mk = key(cx, cy);
            if (mush[mk]) { mush[mk]--; if (mush[mk] <= 0) { delete mush[mk]; api.addScore(1); } shots.splice(i, 1); continue; }
            var hit = -1; for (var j = 0; j < segs.length; j++) { var g = segs[j]; if (Math.abs(fx(g.x) - s.x) < cw * 0.6 && Math.abs(fy(g.y) - s.y) < cw * 0.6) { hit = j; break; } }
            if (hit >= 0) { var g2 = segs[hit]; api.addScore(g2.head ? 3 : 1); api.sfx(g2.head ? 'perfect' : 'brick'); mush[key(Math.round(g2.x), g2.y)] = 3; booms.push({ x: fx(g2.x), y: fy(g2.y), life: 0.35 }); segs.splice(hit, 1); if (segs[hit]) segs[hit].head = true; shots.splice(i, 1); continue; }
            if (spider && Math.abs(spider.x - s.x) < cw && Math.abs(spider.y - s.y) < cw * 0.8) { api.addScore(5); api.sfx('perfect'); booms.push({ x: spider.x, y: spider.y, life: 0.4 }); spider = null; shots.splice(i, 1); continue; }
            if (s.y < oy) shots.splice(i, 1); }
          // the centi-bug: every segment steps one cell at a time; heads turn down at walls / mushrooms
          var rate = 6 + lvl * 0.8; segs.forEach(function (g) { g.acc = (g.acc || 0) + dt * rate; while (g.acc >= 1) { g.acc -= 1; var nx = g.x + g.d; if (nx < 0 || nx >= gw || mush[key(nx, g.y)]) { g.y++; g.d = -g.d; if (g.y >= gh) { g.y = gh - 5; } } else g.x = nx; } });
          segs.forEach(function (g) { if (inv <= 0 && Math.abs(fx(g.x) - P.x) < cw * 0.7 && Math.abs(fy(g.y) - P.y) < cw * 0.7) { lives--; inv = 2; api.sfx('lifelost'); msg = lives > 0 ? 'ZAPPED!' : 'GAME OVER'; msgT = 1.2; if (lives <= 0) api.gameOver(); else bug(); } });
          if (!spider && Math.random() < dt * 0.15) spider = { x: Math.random() < 0.5 ? ox : ox + gw * cw, y: zoneTop, vx: 0, vy: 0, t: 0 }; if (spider) { spider.t += dt; spider.vx = (spider.x < api.W / 2 ? 1 : -1) * 0; spider.x += (spider.x0 = spider.x0 || (spider.x < api.W / 2 ? 1 : -1)) * 110 * dt; spider.y = zoneTop + 30 + Math.abs(Math.sin(spider.t * 3)) * (fy(gh - 1) - zoneTop - 30); if (spider.x < ox - 20 || spider.x > ox + gw * cw + 20) spider = null; else if (inv <= 0 && Math.hypot(spider.x - P.x, spider.y - P.y) < cw) { lives--; inv = 2; spider = null; api.sfx('lifelost'); msg = lives > 0 ? 'BITTEN!' : 'GAME OVER'; msgT = 1.2; if (lives <= 0) api.gameOver(); } }
          if (!segs.length) { api.addScore(15 + lvl * 3); lvl++; api.sfx('level'); msg = 'LEVEL ' + lvl + '!'; msgT = 1.3; bug(); }
        },
        draw: function (c) { var W = api.W, H = api.H; c.fillStyle = '#000'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(124,58,237,.12)'; c.fillRect(ox, fy(gh - 6) - cw / 2, gw * cw, cw * 6);
          for (var k in mush) { var p = k.split(','), X = fx(+p[0]), Y = fy(+p[1]), hp = mush[k]; c.fillStyle = ['#000', '#f9a8d4', '#f472b6', '#ec4899'][hp]; c.beginPath(); c.arc(X, Y - 1, cw * 0.42, Math.PI, 0); c.fill(); c.fillStyle = '#fde68a'; c.fillRect(X - cw * 0.14, Y - 1, cw * 0.28, cw * 0.36); }
          segs.forEach(function (g) { var X = fx(g.x), Y = fy(g.y); c.fillStyle = g.head ? '#facc15' : '#22c55e'; c.beginPath(); c.arc(X, Y, cw * 0.44, 0, 7); c.fill(); c.fillStyle = '#14532d'; c.fillRect(X - 2, Y - cw * 0.44, 4, cw * 0.88); if (g.head) { c.fillStyle = '#000'; c.fillRect(X - 4, Y - 3, 3, 3); c.fillRect(X + 2, Y - 3, 3, 3); } var lg = Math.floor(t * 10 + g.x) % 2 ? 2 : -2; c.fillStyle = '#86efac'; c.fillRect(X - cw * 0.5, Y + lg, 3, 2); c.fillRect(X + cw * 0.5 - 3, Y - lg, 3, 2); });
          if (spider) { c.fillStyle = '#ef4444'; c.beginPath(); c.arc(spider.x, spider.y, cw * 0.4, 0, 7); c.fill(); c.strokeStyle = '#ef4444'; c.lineWidth = 2; for (var l = -1; l <= 1; l += 2) for (var q = 0; q < 3; q++) { c.beginPath(); c.moveTo(spider.x, spider.y); c.lineTo(spider.x + l * cw * 0.8, spider.y - 4 + q * 5 + Math.sin(t * 20 + q) * 2); c.stroke(); } }
          c.fillStyle = '#fef08a'; shots.forEach(function (s) { c.fillRect(s.x - 1.5, s.y - 8, 3, 10); });
          if (!(inv > 0 && Math.floor(t * 12) % 2)) { c.fillStyle = '#3ff0ff'; c.beginPath(); c.moveTo(P.x, P.y - 12); c.lineTo(P.x + 10, P.y + 9); c.lineTo(P.x - 10, P.y + 9); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.fillRect(P.x - 2, P.y - 4, 4, 5); }
          booms.forEach(function (b) { c.strokeStyle = '#fde047'; c.lineWidth = 2; c.beginPath(); c.arc(b.x, b.y, (0.4 - b.life) * 50 + 4, 0, 7); c.stroke(); });
          hud(c, api, lives, 'LVL ' + lvl); if (msgT > 0) px(c, msg, W / 2, H * 0.4, 24, '#ffe14d'); if (api.playing && t < 3) px(c, api.touch ? 'DRAG TO MOVE' : 'ARROWS TO MOVE', W / 2, H - 22, 15, '#7dd3fc'); scan(c, W, H); },
        dbg: function () { return { segs: segs.length, lives: lives, lvl: lvl, P: [P.x, P.y] }; },
        onDown: function (x, y) { tx = x; ty = y - 50; }, onMove: function (x, y, d) { if (d) { tx = x; ty = y - 50; } }, onUp: function () {},
        onKey: function (k, d) { var v = KEYDIR[k]; if (v) keys[v] = d; if (!d && !keys.L && !keys.R && !keys.U && !keys.D) { tx = P.x; ty = P.y; } }
      };
    }
  });

  /* ===================== #30 POGO PETE '83 (brand new) ===================== */
  GA.MG.register({
    id: 'tm_pogo', name: 'Pogo Pete \u201983', ticketDiv: 3, retro: true,
    howTouch: 'Pete bounces on his pogo stick all by himself! DRAG left and right to steer him onto the clouds and climb as high as you can (+1 every 10 m). Springs launch you, grey clouds crumble, coins are +3. Watch out for birds! Fall off the bottom and it\u2019s over.',
    howKeys: 'Pete bounces on his pogo stick all by himself! LEFT / RIGHT (or A/D) steer him onto the clouds. Climb as high as you can (+1 every 10 m). Springs launch you, grey clouds crumble, coins are +3. Watch out for birds! Fall off the bottom and it\u2019s over.',
    create: function (api) {
      var t, P, plats, coins, birds, cam, top, tx, keyL, keyR, height, lastScore, msg, msgT;
      function addPlat(y) { var W = api.W, k = Math.random(), h = -y / 10; plats.push({ x: 30 + Math.random() * (W - 110), y: y, w: 70, kind: h > 30 && k < 0.18 ? 'crumble' : h > 15 && k < 0.33 ? 'move' : 'cloud', spring: Math.random() < 0.08, vx: (Math.random() < 0.5 ? -1 : 1) * 60, gone: 0 }); if (Math.random() < 0.25) coins.push({ x: plats[plats.length - 1].x + 35, y: y - 34 }); if (h > 20 && Math.random() < 0.06) birds.push({ x: -30, y: y - 60, v: 90 + Math.random() * 60 }); }
      function gen() { while (top > cam - 200) { top -= 60 + Math.random() * 40 + Math.min(40, -top / 300); addPlat(top); } }
      return {
        reset: function () { var W = api.W, H = api.H; t = 0; plats = []; coins = []; birds = []; P = { x: W / 2, y: H - 120, vy: -600, vx: 0 }; cam = 0; top = H - 80; plats.push({ x: W / 2 - 50, y: H - 80, w: 100, kind: 'cloud', gone: 0 }); gen(); tx = P.x; keyL = keyR = false; height = 0; lastScore = 0; msgT = 0; },
        resize: function () {},
        update: function (dt) { var W = api.W, H = api.H; if (msgT > 0) msgT -= dt; if (!api.playing) return; t += dt;
          if (keyL) tx = P.x - 200; if (keyR) tx = P.x + 200; P.vx = U.clamp((tx - P.x) * 6, -360, 360); P.x += P.vx * dt; if (P.x < -10) P.x = W + 10; if (P.x > W + 10) P.x = -10;
          var oy0 = P.y; P.vy += 1250 * dt; P.y += P.vy * dt;
          if (P.vy > 0) plats.forEach(function (p) { if (p.gone) return; if (oy0 <= p.y - 2 && P.y >= p.y - 2 && P.x > p.x - 8 && P.x < p.x + p.w + 8) { P.y = p.y - 2; P.vy = p.spring ? -1180 : -640; api.sfx(p.spring ? 'powerup' : 'boop'); if (p.spring) { msg = 'BOING!'; msgT = 0.8; } if (p.kind === 'crumble') p.gone = 0.01; } });
          plats.forEach(function (p) { if (p.kind === 'move') { p.x += p.vx * dt; if (p.x < 6 || p.x > W - p.w - 6) p.vx = -p.vx; } if (p.gone > 0) p.gone += dt; });
          birds.forEach(function (b) { b.x += b.v * dt; if (b.x > W + 40) b.x = -40; if (Math.abs(b.x - P.x) < 18 && Math.abs(b.y - P.y + 20) < 16 && P.vy < 0) { P.vy = 300; api.sfx('crash'); msg = 'BONK!'; msgT = 0.8; } });
          for (var i = coins.length - 1; i >= 0; i--) { var c2 = coins[i]; if (Math.abs(c2.x - P.x) < 18 && Math.abs(c2.y - (P.y - 24)) < 22) { api.addScore(3); api.sfx('point'); coins.splice(i, 1); } }
          var want = P.y - H * 0.45; if (want < cam) cam = want; gen(); height = Math.max(height, Math.floor((H - 120 - P.y) / 10)); var sc = Math.floor(height / 10); if (sc > lastScore) { api.addScore(sc - lastScore); lastScore = sc; }
          plats = plats.filter(function (p) { return p.y < cam + H + 60 && p.gone < 0.6; }); coins = coins.filter(function (c3) { return c3.y < cam + H + 60; }); birds = birds.filter(function (b) { return b.y < cam + H + 60; });
          if (P.y > cam + H + 30) { api.sfx('lifelost'); api.gameOver(); } },
        draw: function (c) { var W = api.W, H = api.H, gr = c.createLinearGradient(0, 0, 0, H), k = Math.min(1, height / 3000); gr.addColorStop(0, k > 0.5 ? '#1e1b4b' : '#2563eb'); gr.addColorStop(1, k > 0.5 ? '#7c3aed' : '#93c5fd'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
          c.save(); c.translate(0, -cam);
          plats.forEach(function (p) { if (p.gone > 0) c.globalAlpha = Math.max(0, 1 - p.gone * 1.8); c.fillStyle = p.kind === 'crumble' ? '#9ca3af' : p.kind === 'move' ? '#fbcfe8' : '#fff'; for (var q = 0; q < 4; q++) { c.beginPath(); c.arc(p.x + 10 + q * (p.w - 20) / 3, p.y + 6, 13, 0, 7); c.fill(); } c.fillRect(p.x + 6, p.y + 2, p.w - 12, 14); if (p.spring) { c.fillStyle = '#ef4444'; c.fillRect(p.x + p.w / 2 - 8, p.y - 12, 16, 6); c.strokeStyle = '#94a3b8'; c.lineWidth = 2; c.beginPath(); c.moveTo(p.x + p.w / 2 - 6, p.y - 6); c.lineTo(p.x + p.w / 2 + 6, p.y - 3); c.lineTo(p.x + p.w / 2 - 6, p.y); c.stroke(); } c.globalAlpha = 1; });
          coins.forEach(function (o) { c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(o.x, o.y, 9 * Math.abs(Math.cos(t * 4 + o.x)) + 2, 10, 0, 0, 7); c.fill(); });
          birds.forEach(function (b) { c.fillStyle = '#111827'; c.beginPath(); c.moveTo(b.x - 14, b.y - (Math.floor(t * 8) % 2 ? 8 : -4)); c.lineTo(b.x, b.y); c.lineTo(b.x + 14, b.y - (Math.floor(t * 8) % 2 ? 8 : -4)); c.lineTo(b.x, b.y + 4); c.closePath(); c.fill(); c.fillStyle = '#fb923c'; c.fillRect(b.x + 8, b.y - 2, 6, 3); });
          var x = P.x, y = P.y, sq = P.vy < 0 && P.vy > -560 ? 0 : 3; c.strokeStyle = '#64748b'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 30 + sq); c.stroke(); c.fillStyle = '#ef4444'; c.fillRect(x - 10, y - 26 + sq, 20, 4);
          c.fillStyle = '#2563eb'; c.fillRect(x - 7, y - 46 + sq, 14, 18); c.fillStyle = '#f6c9a0'; c.beginPath(); c.arc(x, y - 54 + sq, 9, 0, 7); c.fill(); c.fillStyle = '#facc15'; c.fillRect(x - 10, y - 64 + sq, 20, 6); c.fillRect(x - 2, y - 70 + sq, 12, 6); c.fillStyle = '#000'; c.fillRect(x + (P.vx > 0 ? 2 : -5), y - 56 + sq, 3, 3);
          c.restore(); px(c, height + ' m', 12, 50, 16, '#fff', 'left'); hud(c, api, 0, null); if (msgT > 0) px(c, msg, W / 2, H * 0.3, 24, '#ffe14d'); if (api.playing && t < 3) px(c, api.touch ? 'DRAG LEFT / RIGHT TO STEER' : 'LEFT / RIGHT TO STEER', W / 2, H - 22, 15, '#fff'); scan(c, W, H); },
        dbg: function () { return { h: height, y: P.y, cam: cam, plats: plats.length }; },
        onDown: function (x) { tx = x; }, onMove: function (x, y, d) { if (d) tx = x; }, onUp: function () {},
        onKey: function (k, d) { if (KEYDIR[k] === 'L') keyL = d; if (KEYDIR[k] === 'R') keyR = d; if (!d && !keyL && !keyR) tx = P.x; }
      };
    }
  });

  /* ===================== #31 TIME TANGLE '83 (brand new, Lily's own game) ===================== */
  GA.MG.register({
    id: 'tm_tangle', name: 'Time Tangle \u201983', ticketDiv: 2, retro: true,
    howTouch: 'Lily\u2019s favourite game! The clock hand spins. TAP when it is inside the glowing slice: +1 (dead centre = PERFECT +3). Every hit makes the hand faster and flips its direction. Tap at the wrong time, or let it pass the slice 3 times, and you lose a gear. 3 gears!',
    howKeys: 'Lily\u2019s favourite game! The clock hand spins. Press SPACE when it is inside the glowing slice: +1 (dead centre = PERFECT +3). Every hit makes the hand faster and flips its direction. Press at the wrong time, or let it pass the slice 3 times, and you lose a gear. 3 gears!',
    create: function (api) {
      var t, a, dir, sp, tgt, wid, gears, passes, prevIn, hits, msg, msgT, pops, combo, shake;
      function newTarget() { var o = a + dir * (1.4 + Math.random() * 3); tgt = ((o % 6.2832) + 6.2832) % 6.2832; wid = Math.max(0.22, 0.75 - hits * 0.02); passes = 0; prevIn = false; }
      function diff(x, y) { var d = ((x - y) % 6.2832 + 6.2832 + 3.1416) % 6.2832 - 3.1416; return d; }
      function lose(why) { gears--; api.sfx('lifelost'); msg = why; msgT = 1; combo = 0; shake = 0.3; if (gears <= 0) api.gameOver(); else newTarget(); }
      function tap() { if (!api.playing) return; var d = Math.abs(diff(a, tgt)); if (d < wid / 2) { var perf = d < wid * 0.12; api.addScore(perf ? 3 : 1); combo++; if (combo % 5 === 0) { api.addScore(2); msg = 'COMBO x' + combo + '!'; } else msg = perf ? 'PERFECT +3' : 'TICK!'; msgT = 0.7; api.sfx(perf ? 'perfect' : 'tick'); hits++; dir = -dir; sp = Math.min(7.5, sp + 0.18); for (var i = 0; i < 14; i++) { var q = Math.random() * 6.28; pops.push({ a: tgt, r: 1, vx: Math.cos(q) * 120, vy: Math.sin(q) * 120, life: 0.6 }); } newTarget(); } else lose('TOO EARLY!'); }
      return {
        reset: function () { t = 0; a = -Math.PI / 2; dir = 1; sp = 2.2; hits = 0; gears = 3; msgT = 0; pops = []; combo = 0; shake = 0; newTarget(); },
        resize: function () {},
        update: function (dt) { if (msgT > 0) msgT -= dt; if (shake > 0) shake -= dt; pops.forEach(function (p) { p.life -= dt; }); pops = pops.filter(function (p) { return p.life > 0; }); if (!api.playing) return; t += dt;
          a += dir * sp * dt; var inside = Math.abs(diff(a, tgt)) < wid / 2; if (prevIn && !inside) { passes++; if (passes >= 3) lose('TOO SLOW!'); } prevIn = inside; },
        draw: function (c) { var W = api.W, H = api.H, cx = W / 2, cy = H * 0.52, R = Math.min(W, H) * 0.36; c.fillStyle = '#0b0620'; c.fillRect(0, 0, W, H); c.save(); if (shake > 0) c.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
          // gears spinning in the background
          for (var g = 0; g < 3; g++) { var gx = [W * 0.15, W * 0.85, W * 0.5][g], gy = [H * 0.2, H * 0.25, H * 0.9][g], gr = 40 + g * 10; c.save(); c.translate(gx, gy); c.rotate(t * (g % 2 ? -0.6 : 0.5)); c.fillStyle = 'rgba(167,139,250,.18)'; for (var k = 0; k < 10; k++) { c.rotate(Math.PI / 5); c.fillRect(-6, -gr - 8, 12, 14); } c.beginPath(); c.arc(0, 0, gr, 0, 7); c.fill(); c.restore(); }
          c.fillStyle = '#fef3c7'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill(); c.strokeStyle = '#a16207'; c.lineWidth = 10; c.stroke();
          c.fillStyle = 'rgba(74,222,128,.55)'; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R - 6, tgt - wid / 2, tgt + wid / 2); c.closePath(); c.fill(); c.strokeStyle = '#16a34a'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(tgt) * (R - 6), cy + Math.sin(tgt) * (R - 6)); c.stroke();
          c.fillStyle = '#1f2937'; for (var n = 0; n < 12; n++) { var q = n / 12 * Math.PI * 2 - Math.PI / 2; c.fillRect(cx + Math.cos(q) * (R - 18) - 3, cy + Math.sin(q) * (R - 18) - 3, 6, 6); }
          c.strokeStyle = '#7c3aed'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * (R - 14), cy + Math.sin(a) * (R - 14)); c.stroke(); c.fillStyle = '#7c3aed'; c.beginPath(); c.arc(cx, cy, 10, 0, 7); c.fill();
          pops.forEach(function (p) { var k2 = 1 - p.life / 0.6; c.globalAlpha = p.life / 0.6; c.fillStyle = '#fde047'; c.fillRect(cx + Math.cos(p.a) * (R - 30) + p.vx * k2, cy + Math.sin(p.a) * (R - 30) + p.vy * k2, 4, 4); }); c.globalAlpha = 1; c.restore();
          px(c, 'SCORE ' + api.score, 12, 24, 18, '#fff', 'left'); for (var i = 0; i < 3; i++) { c.fillStyle = i < gears ? '#a78bfa' : 'rgba(255,255,255,.2)'; c.beginPath(); c.arc(W - 22 - i * 26, 24, 9, 0, 7); c.fill(); }
          px(c, 'PASSES ' + passes + '/3', W / 2, cy + R + 30, 14, passes >= 2 ? '#f87171' : '#c4b5fd'); if (msgT > 0) px(c, msg, W / 2, cy - R - 30, 24, '#ffe14d'); if (api.playing && t < 3) px(c, api.touch ? 'TAP WHEN THE HAND IS IN THE GREEN' : 'SPACE WHEN THE HAND IS IN THE GREEN', W / 2, H - 22, 14, '#7dd3fc'); scan(c, W, H); },
        dbg: function () { return { a: a, tgt: tgt, wid: wid, gears: gears, hits: hits, inside: Math.abs(diff(a, tgt)) < wid / 2 }; },
        onDown: function () { tap(); }, onMove: function () {}, onUp: function () {},
        onKey: function (k, d) { if (d && (k === ' ' || k === 'Enter' || k === 'ArrowUp')) tap(); }
      };
    }
  });
  GA.TM_GAMES = ['tm_munch', 'tm_swoop', 'tm_toad', 'tm_centi', 'tm_pogo', 'tm_tangle'];
})();
