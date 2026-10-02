/* Grok Arcade - bonus mini games: Snake, Brick Breaker, Grok Jet, Whack-a-Rat, Stack Tower */
(function () {
  'use strict';
  var U = GA.MG.U, rr = U.rr, txt = U.text, clamp = U.clamp, rand = U.rand;
  function bg(c, W, H, a, b) { var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, W, H); }

  /* ------------------------------------------------------------------ */
  /* 1. GROK SNAKE                                                       */
  /* ------------------------------------------------------------------ */
  GA.MG.register({
    id: 'snake', name: 'Grok Snake', ticketDiv: 2, dpad: true,
    howTouch: 'Swipe anywhere or use the arrow pad to steer. Eat the glowing fruit, and don\'t hit the walls or your own tail!',
    howKeys: 'Arrow keys or WASD to steer. Eat the glowing fruit, and don\'t hit the walls or your own tail!',
    create: function (api) {
      var N = 17, snake, prev, dir, q, food, bonus, tick, acc, alive, cell, ox, oy, fx, flash, sw = null, t = 0;
      function layout() {
        var avH = api.H - api.padH - 34;
        cell = Math.max(8, Math.floor(Math.min(api.W - 16, avH) / N));
        ox = Math.floor((api.W - cell * N) / 2); oy = Math.floor((avH - cell * N) / 2) + 8;
      }
      function occupied(x, y) { return snake.some(function (s) { return s.x === x && s.y === y; }); }
      function free() {
        for (var i = 0; i < 500; i++) {
          var x = Math.floor(Math.random() * N), y = Math.floor(Math.random() * N);
          if (!occupied(x, y) && !(food && food.x === x && food.y === y) && !(bonus && bonus.x === x && bonus.y === y)) return { x: x, y: y };
        }
        return { x: 0, y: 0 };
      }
      function turn(dx, dy) {
        var l = q.length ? q[q.length - 1] : dir;
        if ((l.x === -dx && l.y === -dy) || (l.x === dx && l.y === dy)) return;
        if (q.length < 3) q.push({ x: dx, y: dy });
      }
      function step() {
        if (q.length) dir = q.shift();
        var h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        var willEat = food.x === h.x && food.y === h.y;
        var hitSelf = snake.some(function (s, i) { return (i < snake.length - 1 || willEat) && s.x === h.x && s.y === h.y; });
        if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || hitSelf) {
          alive = false; flash = 0.6; api.sfx('crash'); api.gameOver(); return;
        }
        prev = snake.map(function (s) { return { x: s.x, y: s.y }; });
        snake.unshift(h);
        var grow = false;
        if (willEat) {
          grow = true; api.addScore(1); api.sfx('eat'); fx.push({ x: h.x, y: h.y, t: 0, c: '#ff4fd8' });
          food = free(); tick = Math.max(0.075, tick - 0.0035);
          if (!bonus && Math.random() < 0.2) { var b = free(); bonus = { x: b.x, y: b.y, t: 6 }; }
        } else if (bonus && bonus.x === h.x && bonus.y === h.y) {
          grow = true; api.addScore(3); api.sfx('bonus'); fx.push({ x: h.x, y: h.y, t: 0, c: '#ffe14d' }); bonus = null;
        }
        if (!grow) snake.pop(); else prev.push(prev[prev.length - 1]);
      }
      var inst = {
        reset: function () {
          layout();
          snake = [{ x: 6, y: 8 }, { x: 5, y: 8 }, { x: 4, y: 8 }]; prev = snake.map(function (s) { return { x: s.x, y: s.y }; });
          dir = { x: 1, y: 0 }; q = []; tick = 0.15; acc = 0; alive = true; bonus = null; food = null; food = free(); fx = []; flash = 0;
        },
        resize: layout,
        debug: function () { return { head: snake[0], dir: dir, food: food, len: snake.length, alive: alive, N: N }; },
        update: function (dt) {
          t += dt;
          if (flash > 0) flash -= dt;
          fx.forEach(function (f) { f.t += dt; }); fx = fx.filter(function (f) { return f.t < 0.5; });
          if (!api.playing || !alive) return;
          if (bonus) { bonus.t -= dt; if (bonus.t <= 0) bonus = null; }
          acc += dt;
          while (acc >= tick && alive) { acc -= tick; step(); }
        },
        onKey: function (k, down) {
          if (!down) return;
          if (k === 'ArrowUp') turn(0, -1); else if (k === 'ArrowDown') turn(0, 1);
          else if (k === 'ArrowLeft') turn(-1, 0); else if (k === 'ArrowRight') turn(1, 0);
        },
        onDown: function (x, y) { sw = { x: x, y: y }; },
        onMove: function (x, y, down) {
          if (!sw || !down) return;
          var dx = x - sw.x, dy = y - sw.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) > 22) {
            if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0); else turn(0, dy > 0 ? 1 : -1);
            sw = { x: x, y: y };
          }
        },
        onUp: function () { sw = null; },
        draw: function (c) {
          var W = api.W, H = api.H;
          bg(c, W, H, '#150a33', '#0b0520');
          // board
          c.fillStyle = '#1b1040'; rr(c, ox - 4, oy - 4, cell * N + 8, cell * N + 8, 10); c.fill();
          c.strokeStyle = '#3ff0ff'; c.lineWidth = 3; c.shadowColor = '#3ff0ff'; c.shadowBlur = 12; c.stroke(); c.shadowBlur = 0;
          for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if ((x + y) % 2 === 0) { c.fillStyle = '#21144d'; c.fillRect(ox + x * cell, oy + y * cell, cell, cell); }
          // food
          var pulse = 1 + Math.sin(t * 6) * 0.08;
          c.fillStyle = '#ff4fd8'; c.shadowColor = '#ff4fd8'; c.shadowBlur = 14;
          c.beginPath(); c.arc(ox + (food.x + 0.5) * cell, oy + (food.y + 0.55) * cell, cell * 0.36 * pulse, 0, 7); c.fill();
          c.shadowBlur = 0; c.fillStyle = '#7CFC9a'; c.fillRect(ox + (food.x + 0.48) * cell, oy + (food.y + 0.08) * cell, cell * 0.12, cell * 0.22);
          if (bonus) {
            var bx = ox + (bonus.x + 0.5) * cell, by = oy + (bonus.y + 0.5) * cell, r = cell * 0.45 * pulse;
            c.globalAlpha = bonus.t < 1.5 ? (Math.sin(t * 20) > 0 ? 1 : 0.3) : 1;
            c.fillStyle = '#ffe14d'; c.shadowColor = '#ffe14d'; c.shadowBlur = 16; c.beginPath();
            for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r; c.lineTo(bx + Math.cos(a) * rad, by + Math.sin(a) * rad); }
            c.fill(); c.shadowBlur = 0; c.globalAlpha = 1;
          }
          // snake (smoothly interpolated)
          var k = alive ? clamp(acc / tick, 0, 1) : 1;
          for (var s = snake.length - 1; s >= 0; s--) {
            var cs = snake[s], ps = prev[s] || cs;
            var sx = ps.x + (cs.x - ps.x) * k, sy = ps.y + (cs.y - ps.y) * k;
            var hue = 140 + (s / Math.max(1, snake.length)) * 60;
            c.fillStyle = (!alive && flash > 0 && Math.sin(t * 30) > 0) ? '#ffffff' : 'hsl(' + hue + ',90%,' + (s === 0 ? 62 : 52) + '%)';
            var pad = s === 0 ? 1 : 2;
            rr(c, ox + sx * cell + pad, oy + sy * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.3); c.fill();
            if (s === 0) {
              var ex = dir.x, ey = dir.y, hx = ox + (sx + 0.5) * cell, hy = oy + (sy + 0.5) * cell;
              [-1, 1].forEach(function (side) {
                var px = hx + ex * cell * 0.15 + (-ey) * side * cell * 0.2, py = hy + ey * cell * 0.15 + ex * side * cell * 0.2;
                c.fillStyle = '#fff'; c.beginPath(); c.arc(px, py, cell * 0.15, 0, 7); c.fill();
                c.fillStyle = '#111'; c.beginPath(); c.arc(px + ex * cell * 0.05, py + ey * cell * 0.05, cell * 0.08, 0, 7); c.fill();
              });
            }
          }
          fx.forEach(function (f) {
            c.globalAlpha = 1 - f.t / 0.5; c.strokeStyle = f.c; c.lineWidth = 3;
            c.beginPath(); c.arc(ox + (f.x + 0.5) * cell, oy + (f.y + 0.5) * cell, cell * (0.5 + f.t * 3), 0, 7); c.stroke(); c.globalAlpha = 1;
          });
          txt(c, 'Length ' + snake.length, ox + 4, oy + cell * N + 18, 16, '#cfc4f5', 'left');
        }
      };
      return inst;
    }
  });

  /* ------------------------------------------------------------------ */
  /* 2. BRICK BREAKER                                                    */
  /* ------------------------------------------------------------------ */
  GA.MG.register({
    id: 'bricks', name: 'Brick Breaker', ticketDiv: 60,
    howTouch: 'Drag anywhere to move the paddle. Tap to launch the ball. Clear every brick - you have 3 lives!',
    howKeys: 'Move the mouse (or Left/Right arrows) to steer the paddle. Click or Space to launch. You have 3 lives!',
    create: function (api) {
      var COLS = 8, bw, bh, ox, paddle, ball, bricks, lives, level, launched, parts, keys = {}, msg = '', msgT = 0, t = 0, hitCount;
      var ROWCOL = ['#ff4fd8', '#ff7a3d', '#ffe14d', '#4ade80', '#3ff0ff', '#818cf8', '#c084fc', '#f472b6'];
      function layout() {
        bw = Math.min(api.W, api.H * 0.8, 640); bh = api.H; ox = (api.W - bw) / 2;
        if (paddle) { paddle.w = bw * 0.2; paddle.y = bh - Math.max(80, bh * 0.13); }
        if (bricks) placeBricks();
      }
      function placeBricks() {
        var pad = 10, gap = 5, w = (bw - pad * 2 - gap * (COLS - 1)) / COLS, h = Math.max(16, Math.min(26, bh * 0.032)), top = Math.max(56, bh * 0.09);
        bricks.forEach(function (b) { b.x = pad + b.c * (w + gap); b.y = top + b.r * (h + gap); b.w = w; b.h = h; });
      }
      function buildLevel() {
        bricks = [];
        var rows = Math.min(4 + level, 8), pat = (level - 1) % 3;
        for (var r = 0; r < rows; r++) for (var c = 0; c < COLS; c++) {
          if (pat === 1 && (r + c) % 4 === 3) continue;
          if (pat === 2 && (c === 3 || c === 4) && r % 2 === 1) continue;
          var hp = (level >= 2 && r < Math.floor(level / 2)) ? 2 : 1;
          bricks.push({ r: r, c: c, hp: hp, max: hp, col: ROWCOL[r % ROWCOL.length] });
        }
        placeBricks();
      }
      function speed() { return bh * 0.56 * Math.min(1.45, (1 + (level - 1) * 0.07) * (1 + Math.min(hitCount, 40) * 0.004)); }
      function resetBall() { launched = false; ball = { x: paddle.x, y: paddle.y - 10, vx: 0, vy: 0, r: Math.max(7, bw * 0.014) }; }
      function launch() {
        if (launched || !api.playing) return;
        launched = true; var a = rand(-0.45, 0.45), s = speed();
        ball.vx = Math.sin(a) * s; ball.vy = -Math.cos(a) * s; api.sfx('paddle');
      }
      function burst(x, y, col) { for (var i = 0; i < 8; i++) parts.push({ x: x, y: y, vx: rand(-160, 160), vy: rand(-200, 80), t: 0, col: col }); }
      var inst = {
        reset: function () {
          level = 1; lives = 3; parts = []; hitCount = 0; msg = ''; bricks = null;
          paddle = { x: 0, w: 0, y: 0, h: 14 }; layout(); paddle.x = bw / 2; buildLevel(); resetBall();
        },
        resize: layout,
        debug: function () { return { paddleX: paddle.x + ox, paddleY: paddle.y, ballX: ball.x + ox, ballY: ball.y, launched: launched, lives: lives, level: level, bricks: bricks.filter(function (b) { return b.hp > 0; }).length, ox: ox, bw: bw }; },
        update: function (dt) {
          t += dt; if (msgT > 0) msgT -= dt;
          parts.forEach(function (p) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; });
          parts = parts.filter(function (p) { return p.t < 0.7; });
          if (!api.playing) return;
          var kd = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
          if (kd) paddle.x += kd * bw * 1.3 * dt;
          paddle.x = clamp(paddle.x, paddle.w / 2, bw - paddle.w / 2);
          if (!launched) { ball.x = paddle.x; ball.y = paddle.y - ball.r - 1; return; }
          ball.x += ball.vx * dt; ball.y += ball.vy * dt;
          if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); api.sfx('wall'); }
          if (ball.x > bw - ball.r) { ball.x = bw - ball.r; ball.vx = -Math.abs(ball.vx); api.sfx('wall'); }
          if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); api.sfx('wall'); }
          // paddle
          if (ball.vy > 0 && ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h &&
              ball.x >= paddle.x - paddle.w / 2 - ball.r && ball.x <= paddle.x + paddle.w / 2 + ball.r) {
            var rel = clamp((ball.x - paddle.x) / (paddle.w / 2), -1, 1), a = rel * 1.05, s = speed();
            ball.vx = Math.sin(a) * s; ball.vy = -Math.cos(a) * s; ball.y = paddle.y - ball.r; api.sfx('paddle');
          }
          // bricks (one hit per sub-step)
          for (var i = 0; i < bricks.length; i++) {
            var b = bricks[i]; if (b.hp <= 0) continue;
            var cx = clamp(ball.x, b.x, b.x + b.w), cy = clamp(ball.y, b.y, b.y + b.h), dx = ball.x - cx, dy = ball.y - cy;
            if (dx * dx + dy * dy <= ball.r * ball.r) {
              var ovX = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
              var ovY = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
              if (ovX < ovY) { ball.vx = ball.x < b.x + b.w / 2 ? -Math.abs(ball.vx) : Math.abs(ball.vx); }
              else { ball.vy = ball.y < b.y + b.h / 2 ? -Math.abs(ball.vy) : Math.abs(ball.vy); }
              b.hp--; hitCount++;
              if (b.hp <= 0) { api.addScore(10 * level); burst(b.x + b.w / 2, b.y + b.h / 2, b.col); } else api.addScore(5);
              api.sfx('brick');
              var sp = speed(), cur = Math.hypot(ball.vx, ball.vy) || 1; ball.vx *= sp / cur; ball.vy *= sp / cur;
              // keep the ball from going too horizontal
              if (Math.abs(ball.vy) < sp * 0.3) { ball.vy = (ball.vy < 0 ? -1 : 1) * sp * 0.3; ball.vx = Math.sign(ball.vx || 1) * Math.sqrt(sp * sp - ball.vy * ball.vy); }
              break;
            }
          }
          if (bricks.every(function (b) { return b.hp <= 0; })) {
            level++; buildLevel(); resetBall(); msg = 'LEVEL ' + level; msgT = 1.6; api.sfx('level');
          }
          if (ball.y - ball.r > bh) {
            lives--; api.sfx('lifelost');
            if (lives <= 0) { api.gameOver(); }
            else { resetBall(); msg = lives === 1 ? 'LAST LIFE!' : lives + ' LIVES LEFT'; msgT = 1.4; }
          }
        },
        onKey: function (k, down) { keys[k] = down; if (down && (k === ' ' || k === 'ArrowUp' || k === 'Enter')) launch(); },
        onDown: function (x) { paddle.x = x - ox; if (!launched) launch(); },
        onMove: function (x, y, down, e) { if (down || (e && e.pointerType === 'mouse')) paddle.x = x - ox; },
        draw: function (c) {
          var W = api.W, H = api.H;
          bg(c, W, H, '#120833', '#07031a');
          c.save(); c.translate(ox, 0);
          c.fillStyle = 'rgba(63,240,255,0.05)'; c.fillRect(0, 0, bw, bh);
          c.strokeStyle = 'rgba(63,240,255,0.5)'; c.lineWidth = 2; c.strokeRect(1, -2, bw - 2, bh + 4);
          bricks.forEach(function (b) {
            if (b.hp <= 0) return;
            c.fillStyle = b.col; c.globalAlpha = b.hp < b.max ? 0.55 : 1;
            c.shadowColor = b.col; c.shadowBlur = 8; rr(c, b.x, b.y, b.w, b.h, 5); c.fill(); c.shadowBlur = 0;
            c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(b.x + 4, b.y + 3, b.w - 8, 3);
            if (b.max > 1 && b.hp > 1) { c.strokeStyle = '#fff'; c.lineWidth = 2; rr(c, b.x + 2, b.y + 2, b.w - 4, b.h - 4, 4); c.stroke(); }
            c.globalAlpha = 1;
          });
          parts.forEach(function (p) { c.globalAlpha = 1 - p.t / 0.7; c.fillStyle = p.col; c.fillRect(p.x - 3, p.y - 3, 6, 6); });
          c.globalAlpha = 1;
          // paddle
          var g = c.createLinearGradient(0, paddle.y, 0, paddle.y + paddle.h); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#3ff0ff');
          c.fillStyle = g; c.shadowColor = '#3ff0ff'; c.shadowBlur = 16;
          rr(c, paddle.x - paddle.w / 2, paddle.y, paddle.w, paddle.h, 7); c.fill(); c.shadowBlur = 0;
          // ball
          c.fillStyle = '#ffe14d'; c.shadowColor = '#ffe14d'; c.shadowBlur = 16;
          c.beginPath(); c.arc(ball.x, ball.y, ball.r, 0, 7); c.fill(); c.shadowBlur = 0;
          for (var i = 0; i < 3; i++) U.heart(c, 22 + i * 26, bh - 24, 20, i < lives ? '#ff4f8b' : 'rgba(255,255,255,0.15)');
          txt(c, 'LEVEL ' + level, bw - 12, bh - 24, 16, '#cfc4f5', 'right');
          if (!launched && api.playing) txt(c, api.touch ? 'Tap to launch' : 'Click / Space to launch', bw / 2, paddle.y - 50, 20, '#fff', 'center', '#3ff0ff');
          if (msgT > 0) txt(c, msg, bw / 2, bh * 0.55, 34, '#ffe14d', 'center', '#ff4fd8');
          c.restore();
        }
      };
      return inst;
    }
  });

  /* ------------------------------------------------------------------ */
  /* 3. GROK JET (flappy-style)                                          */
  /* ------------------------------------------------------------------ */
  GA.MG.register({
    id: 'jet', name: 'Grok Jet', ticketDiv: 1,
    howTouch: 'Tap anywhere to flap your jet upward. Fly through the gaps between the neon towers!',
    howKeys: 'Click, Space or Up arrow to flap. Fly through the gaps between the neon towers!',
    create: function (api) {
      var s, jet, pipes, spd, groundY, dead, t = 0, scroll = 0, flameT = 0, sky1, sky2, stars, deadT = 0;
      function mkSky(n, hMin, hMax) { var a = [], x = 0; while (x < 2400) { var w = rand(30, 80); a.push({ x: x, w: w, h: rand(hMin, hMax) }); x += w + rand(2, 12); } return a; }
      function gapSize() { return Math.max(0.25 * api.H, 0.33 * api.H - api.score * 0.004 * api.H); }
      function addPipe(x) {
        var gap = gapSize(), last = pipes.length ? pipes[pipes.length - 1].gy : api.H * 0.45;
        var minY = gap / 2 + 40 * s, maxY = groundY - gap / 2 - 30 * s;
        var gy = clamp(last + rand(-0.26, 0.26) * api.H, minY, maxY);
        pipes.push({ x: x, gy: gy, gap: gap, w: 70 * s, passed: false, hue: [190, 300, 50][pipes.length % 3] });
      }
      function flap() { if (dead) return; jet.vy = -430 * s; flameT = 0.18; api.sfx('flap'); }
      var inst = {
        reset: function () {
          s = clamp(api.H / 640, 0.7, 1.6); groundY = api.H - 48 * s; spd = 150 * s;
          jet = { x: Math.min(api.W * 0.28, 260 * s), y: api.H * 0.42, vy: 0 }; pipes = []; dead = false; deadT = 0;
          var x = api.W + 60 * s; while (x < api.W * 2.2) { addPipe(x); x += 250 * s; }
          if (!sky1) { sky1 = mkSky(0, 40, 140); sky2 = mkSky(0, 80, 220); stars = []; for (var i = 0; i < 70; i++) stars.push({ x: Math.random(), y: Math.random() * 0.6, r: Math.random() * 1.6 + 0.4 }); }
        },
        resize: function () { if (!api.playing) inst.reset(); },
        start: function () { flap(); },
        debug: function () { return { x: jet.x, y: jet.y, vy: jet.vy, dead: dead, groundY: groundY, pipes: pipes.map(function (p) { return { x: p.x, w: p.w, gy: p.gy, gap: p.gap }; }) }; },
        update: function (dt) {
          t += dt; if (flameT > 0) flameT -= dt;
          if (!api.playing && !dead) { jet.y = api.H * 0.42 + Math.sin(t * 3) * 10 * s; return; }
          jet.vy = Math.min(jet.vy + 1450 * s * dt, 720 * s); jet.y += jet.vy * dt;
          if (jet.y < 16 * s) { jet.y = 16 * s; jet.vy = 0; }
          var r = 15 * s;
          if (dead) { if (jet.y > groundY - r) { jet.y = groundY - r; jet.vy = 0; } return; }
          spd = Math.min(225 * s, 150 * s + api.score * 2.5 * s);
          scroll += spd * dt;
          pipes.forEach(function (p) { p.x -= spd * dt; });
          if (pipes.length && pipes[0].x < -100 * s) pipes.shift();
          var lastX = pipes[pipes.length - 1].x; if (lastX < api.W + 100 * s) addPipe(lastX + 250 * s);
          var hr = r * 0.8, die = false;
          pipes.forEach(function (p) {
            if (!p.passed && p.x + p.w < jet.x - hr) { p.passed = true; api.addScore(1); api.sfx('point'); }
            if (jet.x + hr > p.x && jet.x - hr < p.x + p.w) {
              var top = p.gy - p.gap / 2, bot = p.gy + p.gap / 2;
              var cx = clamp(jet.x, p.x, p.x + p.w);
              [[top, -1e5], [bot, 1e5]].forEach(function (pair) {
                var y0 = Math.min(pair[0], pair[1]), y1 = Math.max(pair[0], pair[1]);
                var cy = clamp(jet.y, y0, y1), dx = jet.x - cx, dy = jet.y - cy;
                if (dx * dx + dy * dy < hr * hr) die = true;
              });
            }
          });
          if (jet.y + r > groundY) { jet.y = groundY - r; die = true; }
          if (die) { dead = true; jet.vy = Math.min(jet.vy, 0) - 120 * s; api.sfx('crash'); api.gameOver(); }
        },
        onDown: function () { if (api.playing) flap(); },
        onKey: function (k, down) { if (down && (k === ' ' || k === 'ArrowUp' || k === 'Enter')) flap(); },
        draw: function (c) {
          var W = api.W, H = api.H;
          bg(c, W, H, '#1a0b45', '#ff5fa8');
          stars.forEach(function (st) { c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(st.x * W, st.y * H, st.r, st.r); });
          c.fillStyle = 'rgba(255,225,77,0.85)'; c.beginPath(); c.arc(W * 0.78, H * 0.62, 70 * s, 0, 7); c.fill();
          [[sky2, 0.2, '#3a1a6e'], [sky1, 0.45, '#25104f']].forEach(function (L) {
            c.fillStyle = L[2]; var off = (scroll * L[1]) % 2400;
            for (var rep = 0; rep < 2; rep++) L[0].forEach(function (b) { var x = b.x - off + rep * 2400; if (x > -100 && x < W + 100) c.fillRect(x, groundY - b.h * s, b.w * s, b.h * s); });
          });
          pipes.forEach(function (p) {
            var col = 'hsl(' + p.hue + ',95%,60%)', top = p.gy - p.gap / 2, bot = p.gy + p.gap / 2;
            c.fillStyle = 'hsl(' + p.hue + ',60%,22%)'; c.strokeStyle = col; c.lineWidth = 4; c.shadowColor = col; c.shadowBlur = 14;
            c.fillRect(p.x, -10, p.w, top + 10); c.strokeRect(p.x, -10, p.w, top + 10);
            c.fillRect(p.x, bot, p.w, groundY - bot); c.strokeRect(p.x, bot, p.w, groundY - bot);
            c.fillStyle = col; c.fillRect(p.x - 6 * s, top - 14 * s, p.w + 12 * s, 14 * s); c.fillRect(p.x - 6 * s, bot, p.w + 12 * s, 14 * s);
            c.shadowBlur = 0;
          });
          // ground
          c.fillStyle = '#12082b'; c.fillRect(0, groundY, W, H - groundY);
          c.strokeStyle = '#3ff0ff'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, groundY); c.lineTo(W, groundY); c.stroke();
          c.strokeStyle = 'rgba(63,240,255,0.35)'; c.lineWidth = 2;
          for (var gx = -(scroll % (40 * s)); gx < W; gx += 40 * s) { c.beginPath(); c.moveTo(gx, groundY + 4); c.lineTo(gx - 20 * s, H); c.stroke(); }
          // jet
          var ang = clamp(jet.vy / (700 * s), -0.5, 1.0) * 0.9;
          c.save(); c.translate(jet.x, jet.y); c.rotate(ang); c.scale(s, s);
          if (flameT > 0 || !dead) { c.fillStyle = flameT > 0 ? '#ffb020' : 'rgba(255,140,40,0.6)'; c.beginPath(); c.moveTo(-18, -6); c.lineTo(-18 - (flameT > 0 ? 22 : 10) - Math.random() * 6, 0); c.lineTo(-18, 6); c.fill(); }
          c.fillStyle = '#ff4fd8'; c.beginPath(); c.moveTo(-10, -8); c.lineTo(-20, -18); c.lineTo(-4, -8); c.fill(); c.beginPath(); c.moveTo(-10, 8); c.lineTo(-20, 18); c.lineTo(-4, 8); c.fill();
          c.fillStyle = '#f5f3ff'; c.beginPath(); c.ellipse(0, 0, 22, 12, 0, 0, 7); c.fill();
          c.fillStyle = '#3ff0ff'; c.beginPath(); c.ellipse(7, -3, 8, 6, 0, 0, 7); c.fill();
          c.fillStyle = '#111'; c.beginPath(); c.arc(9, -3, 2.2, 0, 7); c.fill();
          c.fillStyle = '#ff4fd8'; c.fillRect(-12, 2, 18, 3);
          c.restore();
          txt(c, String(api.score), W / 2, 50 * s, 48 * s, '#fff', 'center', '#ff4fd8');
          if (!api.playing && api.state === 'ready') txt(c, 'Get ready!', W / 2, H * 0.3, 28, '#fff');
        }
      };
      return inst;
    }
  });

  /* ------------------------------------------------------------------ */
  /* 4. WHACK-A-RAT (boop Luna, Pi-rat and Snowie)                       */
  /* ------------------------------------------------------------------ */
  var RATS = {
    luna: { name: 'Luna', fur: '#a7adbb', dark: '#7d8394', belly: '#e6e8ee', eye: '#1b1b24' },
    pirat: { name: 'Pi-rat', fur: '#c99a6b', dark: '#9c7148', belly: '#f6e7d4', eye: '#1b1b24' },
    snowie: { name: 'Snowie', fur: '#fbfbff', dark: '#e3e1ee', belly: '#ffffff', eye: '#d0315a' }
  };
  function drawRat(c, type, x, y, sz, happy, t) {
    var R = RATS[type];
    c.save(); c.translate(x, y); var k = sz / 100; c.scale(k, k);
    // body
    c.fillStyle = R.fur; c.beginPath(); c.ellipse(0, 40, 46, 44, 0, 0, 7); c.fill();
    c.fillStyle = R.belly; c.beginPath(); c.ellipse(0, 50, 28, 30, 0, 0, 7); c.fill();
    // ears
    [-1, 1].forEach(function (sd) {
      c.fillStyle = R.dark; c.beginPath(); c.arc(sd * 34, -28, 22, 0, 7); c.fill();
      c.fillStyle = '#ffb3c8'; c.beginPath(); c.arc(sd * 34, -28, 13, 0, 7); c.fill();
    });
    // head
    c.fillStyle = R.fur; c.beginPath(); c.ellipse(0, 0, 40, 36, 0, 0, 7); c.fill();
    // snout
    c.fillStyle = R.belly; c.beginPath(); c.ellipse(0, 16, 20, 15, 0, 0, 7); c.fill();
    c.fillStyle = '#ff7fa6'; c.beginPath(); c.ellipse(0, 9, 7, 5, 0, 0, 7); c.fill();
    // cheeks
    c.fillStyle = 'rgba(255,120,160,0.45)'; c.beginPath(); c.arc(-24, 12, 7, 0, 7); c.arc(24, 12, 7, 0, 7); c.fill();
    // whiskers
    c.strokeStyle = 'rgba(60,40,60,0.55)'; c.lineWidth = 2;
    [-1, 1].forEach(function (sd) { for (var i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(sd * 14, 16 + i * 3); c.lineTo(sd * 44, 12 + i * 8); c.stroke(); } });
    // mouth
    c.strokeStyle = '#5a3a4a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, 14); c.lineTo(0, 19);
    c.arc(-4, 19, 4, 0, Math.PI); c.moveTo(8, 19); c.arc(4, 19, 4, 0, Math.PI); c.stroke();
    // eyes
    function eyeOpen(ex) {
      c.fillStyle = R.eye; c.beginPath(); c.arc(ex, -6, 8.5, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + 3, -9, 3, 0, 7); c.fill(); c.beginPath(); c.arc(ex - 2.5, -3, 1.5, 0, 7); c.fill();
    }
    function eyeHappy(ex) { c.strokeStyle = R.eye; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.arc(ex, -3, 7, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    function eyeClosed(ex) { c.strokeStyle = '#5a3a4a'; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath(); c.arc(ex, -8, 7, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); }
    if (happy) { eyeHappy(-15); if (type === 'pirat') eyeClosed(15); else eyeHappy(15); }
    else { eyeOpen(-15); if (type === 'pirat') eyeClosed(15); else eyeOpen(15); }
    if (type === 'luna') { c.fillStyle = '#ffe14d'; c.beginPath(); c.arc(0, -22, 8, 0, 7); c.fill(); c.fillStyle = R.fur; c.beginPath(); c.arc(4, -24, 7, 0, 7); c.fill(); }
    if (type === 'snowie') { c.fillStyle = '#ff9ec4'; c.beginPath(); c.arc(-11, -27, 4, 0, 7); c.arc(-5, -29, 4, 0, 7); c.fill(); }
    if (happy) { c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(-18, 46); c.lineTo(18, 34); c.lineTo(18, 52); c.closePath(); c.fill(); c.fillStyle = '#e8a800'; c.beginPath(); c.arc(4, 44, 3, 0, 7); c.arc(12, 47, 2, 0, 7); c.fill(); }
    // paws
    c.fillStyle = '#ffb3c8'; c.beginPath(); c.ellipse(-16, 58, 7, 5, 0, 0, 7); c.ellipse(16, 58, 7, 5, 0, 0, 7); c.fill();
    c.restore();
  }
  GA.drawRat = drawRat;
  GA.MG.register({
    id: 'rats', name: 'Whack-a-Rat', ticketDiv: 3,
    howTouch: 'Luna, Pi-rat and Snowie pop out of their hidey-holes. Tap them for a cheesy treat before they hide! Miss 3 and it\'s over.',
    howKeys: 'Luna, Pi-rat and Snowie pop out of their hidey-holes. Click them for a cheesy treat before they hide! Miss 3 and it\'s over.',
    create: function (api) {
      var holes, lives, spawnT, fx, t = 0, cell, ox, oy, combo, shake = 0, lastType = '';
      function layout() {
        var bs = Math.min(api.W - 16, (api.H - 90) * 0.95, 620);
        cell = bs / 3; ox = (api.W - bs) / 2; oy = Math.max(70, (api.H - bs) / 2 + 20);
        if (holes) holes.forEach(function (h, i) { var cx = i % 3, cy = Math.floor(i / 3); h.x = ox + (cx + 0.5) * cell; h.y = oy + (cy + 0.72) * cell; });
      }
      function diff() { return Math.min(1, api.score / 70); }
      function spawn() {
        var empty = holes.filter(function (h) { return !h.rat; });
        var active = 9 - empty.length, maxA = Math.min(3, 1 + Math.floor(api.score / 10));
        if (!empty.length || active >= maxA) return;
        var h = empty[Math.floor(Math.random() * empty.length)];
        var types = ['luna', 'pirat', 'snowie'].filter(function (x) { return x !== lastType; });
        var type = types[Math.floor(Math.random() * types.length)]; lastType = type;
        h.rat = { type: type, st: 'rise', t: 0, up: 1.6 - 0.8 * diff() + rand(-0.1, 0.15) };
      }
      var inst = {
        reset: function () {
          holes = []; for (var i = 0; i < 9; i++) holes.push({ x: 0, y: 0, rat: null });
          layout(); lives = 3; spawnT = 0.6; fx = []; combo = 0;
        },
        resize: layout,
        debug: function () { return { lives: lives, combo: combo, cell: cell, holes: holes.map(function (h) { return { x: h.x, y: h.y, rat: h.rat ? { type: h.rat.type, st: h.rat.st } : null }; }) }; },
        update: function (dt) {
          t += dt; if (shake > 0) shake -= dt;
          fx.forEach(function (f) { f.t += dt; f.y += (f.vy || -60) * dt; }); fx = fx.filter(function (f) { return f.t < (f.life || 0.9); });
          if (!api.playing) return;
          spawnT -= dt;
          if (spawnT <= 0) { spawn(); spawnT = (0.95 - 0.5 * diff()) * rand(0.8, 1.2); }
          holes.forEach(function (h) {
            var r = h.rat; if (!r) return; r.t += dt;
            if (r.st === 'rise' && r.t > 0.16) { r.st = 'up'; r.t = 0; }
            else if (r.st === 'up' && r.t > r.up) { r.st = 'hide'; r.t = 0; }
            else if (r.st === 'booped' && r.t > 0.45) { r.st = 'leave'; r.t = 0; }
            else if ((r.st === 'hide' || r.st === 'leave') && r.t > 0.16) {
              if (r.st === 'hide') {
                lives--; combo = 0; shake = 0.25; api.sfx('miss');
                fx.push({ kind: 'text', s: RATS[r.type].name + ' hid!', x: h.x, y: h.y - cell * 0.6, t: 0, col: '#ffb3c8' });
                if (lives <= 0) api.gameOver();
              }
              h.rat = null;
            }
          });
        },
        onDown: function (x, y) {
          if (!api.playing) return;
          for (var i = 0; i < holes.length; i++) {
            var h = holes[i], r = h.rat;
            if (!r || (r.st !== 'rise' && r.st !== 'up')) continue;
            if (Math.abs(x - h.x) < cell * 0.45 && y > h.y - cell * 0.82 && y < h.y + cell * 0.2) {
              r.st = 'booped'; r.t = 0; combo++;
              var pts = combo >= 5 ? 2 : 1; api.addScore(pts); api.sfx('boop'); setTimeout(function () { api.sfx('squeak'); }, 90);
              for (var j = 0; j < 5; j++) fx.push({ kind: 'heart', x: h.x + rand(-30, 30), y: h.y - cell * 0.5, vy: rand(-140, -70), t: 0, s: rand(14, 24) });
              fx.push({ kind: 'text', s: '+' + pts + ' ' + RATS[r.type].name + '!', x: h.x, y: h.y - cell * 0.85, t: 0, col: '#ffe14d' });
              return;
            }
          }
          combo = 0;
        },
        draw: function (c) {
          var W = api.W, H = api.H;
          bg(c, W, H, '#2a1150', '#120726');
          c.save(); if (shake > 0) c.translate(rand(-4, 4), rand(-3, 3));
          // grass-ish board
          c.fillStyle = '#3b1f6e'; rr(c, ox - 6, oy - 6, cell * 3 + 12, cell * 3 + 12, 24); c.fill();
          c.strokeStyle = '#ff8fd0'; c.lineWidth = 3; c.stroke();
          holes.forEach(function (h) {
            var hw = cell * 0.4, hh = cell * 0.14;
            c.fillStyle = '#1a0a33'; c.beginPath(); c.ellipse(h.x, h.y, hw, hh, 0, 0, 7); c.fill();
            var r = h.rat;
            if (r) {
              var p = 1;
              if (r.st === 'rise') p = r.t / 0.16; else if (r.st === 'hide' || r.st === 'leave') p = 1 - r.t / 0.16;
              p = clamp(p, 0, 1);
              var sz = cell * 0.62, ry = h.y + sz * 0.15 - p * sz * 0.85;
              c.save(); c.beginPath(); c.rect(h.x - cell / 2, h.y - cell, cell, cell); c.ellipse(h.x, h.y, hw, hh, 0, 0, Math.PI); c.clip();
              drawRat(c, r.type, h.x, ry, sz, r.st === 'booped' || r.st === 'leave', t);
              c.restore();
              if (r.st === 'up' || r.st === 'rise') {
                var urgency = r.st === 'up' ? r.t / r.up : 0;
                c.fillStyle = urgency > 0.7 ? '#ff4f8b' : 'rgba(255,255,255,0.9)';
                rr(c, h.x - cell * 0.28, h.y + hh + 4, cell * 0.56, Math.max(18, cell * 0.12), 8); c.fill();
                txt(c, RATS[r.type].name, h.x, h.y + hh + 4 + Math.max(18, cell * 0.12) / 2, Math.max(13, cell * 0.09), '#2a1150');
              }
            }
            c.strokeStyle = '#8f5bd6'; c.lineWidth = 4; c.beginPath(); c.ellipse(h.x, h.y, hw, hh, 0, 0, Math.PI); c.stroke();
          });
          fx.forEach(function (f) {
            c.globalAlpha = clamp(1 - f.t / (f.life || 0.9), 0, 1);
            if (f.kind === 'heart') U.heart(c, f.x, f.y, f.s, '#ff4f8b');
            else txt(c, f.s, f.x, f.y, 20, f.col, 'center', '#000');
            c.globalAlpha = 1;
          });
          c.restore();
          for (var i = 0; i < 3; i++) U.heart(c, 26 + i * 30, 26, 24, i < lives ? '#ff4f8b' : 'rgba(255,255,255,0.18)');
          if (combo >= 5) txt(c, 'COMBO x' + combo + '  (2 pts each)', W - 12, 26, 16, '#ffe14d', 'right');
        }
      };
      return inst;
    }
  });

  /* ------------------------------------------------------------------ */
  /* 5. STACK TOWER                                                      */
  /* ------------------------------------------------------------------ */
  GA.MG.register({
    id: 'stack', name: 'Stack Tower', ticketDiv: 2,
    howTouch: 'Tap to drop the sliding block on the tower. Overhangs get chopped off - line it up perfectly to keep it wide!',
    howKeys: 'Click, Space or Enter to drop the sliding block. Overhangs get chopped off - line it up perfectly to keep it wide!',
    create: function (api) {
      var bw, ox, bh, stack, cur, debris, camY, combo, popT, popS, t = 0, over;
      function layout() { bw = Math.min(api.W - 20, api.H * 0.7, 560); ox = (api.W - bw) / 2; bh = Math.max(20, Math.min(34, api.H / 22)); }
      function hue(i) { return (200 + i * 9) % 360; }
      function spawn() {
        var top = stack[stack.length - 1], n = stack.length, dir = n % 2 ? 1 : -1;
        // the block slides from fully off one side of the tower to fully off the other, so a late/early tap can miss
        var lo = top.x - top.w - 6, hi = top.x + top.w + 6;
        cur = { x: dir > 0 ? lo : hi, w: top.w, dir: dir, lo: lo, hi: hi, spd: bw * Math.min(1.2, 0.5 + api.score * 0.025) };
      }
      function drop() {
        if (!api.playing || over) return;
        var top = stack[stack.length - 1], L = Math.max(cur.x, top.x), R = Math.min(cur.x + cur.w, top.x + top.w), ow = R - L;
        var lvl = stack.length;
        if (ow <= 0) {
          debris.push({ x: cur.x, w: cur.w, lvl: lvl, vy: 0, y: 0, vr: cur.dir * 1.5, r: 0, h: hue(lvl) });
          over = true; cur = null; api.sfx('crash'); api.gameOver(); return;
        }
        if (Math.abs(cur.x - top.x) <= Math.max(4, bw * 0.012)) {
          L = top.x; ow = top.w; combo++; api.sfx('perfect'); popS = combo >= 3 ? 'PERFECT x' + combo + '  WIDER!' : 'PERFECT!'; popT = 1;
          if (combo >= 3) { var nw = Math.min(bw * 0.42, ow + bw * 0.04); L = clamp(L - (nw - ow) / 2, 0, bw - nw); ow = nw; }
        } else {
          combo = 0; api.sfx('drop');
          if (cur.x < top.x) debris.push({ x: cur.x, w: top.x - cur.x, lvl: lvl, vy: 0, y: 0, vr: -2, r: 0, h: hue(lvl) });
          if (cur.x + cur.w > top.x + top.w) debris.push({ x: top.x + top.w, w: cur.x + cur.w - (top.x + top.w), lvl: lvl, vy: 0, y: 0, vr: 2, r: 0, h: hue(lvl) });
        }
        stack.push({ x: L, w: ow, h: hue(lvl) });
        api.addScore(1); spawn();
      }
      var inst = {
        reset: function () { layout(); stack = [{ x: bw * 0.29, w: bw * 0.42, h: hue(0) }]; debris = []; camY = 0; combo = 0; popT = 0; over = false; spawn(); },
        resize: layout,
        debug: function () { var tp = stack[stack.length - 1]; return { cur: cur ? { x: cur.x + ox, w: cur.w, dir: cur.dir } : null, top: { x: tp.x + ox, w: tp.w }, height: stack.length, combo: combo, bw: bw }; },
        update: function (dt) {
          t += dt; if (popT > 0) popT -= dt;
          debris.forEach(function (d) { d.vy += 1600 * dt; d.y += d.vy * dt; d.r += d.vr * dt; });
          debris = debris.filter(function (d) { return d.y < api.H * 2; });
          var target = Math.max(0, (stack.length + 1) * bh - api.H * 0.55); camY += (target - camY) * Math.min(1, dt * 6);
          if (!api.playing || !cur) return;
          cur.x += cur.dir * cur.spd * dt;
          if (cur.x < cur.lo) { cur.x = cur.lo; cur.dir = 1; } if (cur.x > cur.hi) { cur.x = cur.hi; cur.dir = -1; }
        },
        onDown: function () { drop(); },
        onKey: function (k, down) { if (down && (k === ' ' || k === 'Enter' || k === 'ArrowDown')) drop(); },
        draw: function (c) {
          var W = api.W, H = api.H, h0 = hue(stack.length);
          bg(c, W, H, 'hsl(' + ((h0 + 180) % 360) + ',55%,18%)', 'hsl(' + h0 + ',50%,10%)');
          var baseY = H - 40 + camY;
          function block(x, lvl, w, hh, a) {
            var y = baseY - (lvl + 1) * bh;
            c.fillStyle = 'hsl(' + hh + ',85%,' + (a || 55) + '%)'; c.fillRect(ox + x, y, w, bh - 2);
            c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(ox + x, y, w, 4);
            c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(ox + x, y + bh - 6, w, 4);
          }
          c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(ox + bw * 0.22, baseY, bw * 0.56, H);
          stack.forEach(function (s, i) { if (baseY - (i + 1) * bh < H + bh) block(s.x, i, s.w, s.h); });
          if (cur) { block(cur.x, stack.length, cur.w, hue(stack.length), 62); c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(ox + cur.x, baseY - (stack.length + 1) * bh, cur.w, bh - 2); }
          debris.forEach(function (d) {
            var y = baseY - (d.lvl + 1) * bh + d.y;
            c.save(); c.translate(ox + d.x + d.w / 2, y + bh / 2); c.rotate(d.r);
            c.fillStyle = 'hsl(' + d.h + ',70%,50%)'; c.fillRect(-d.w / 2, -bh / 2, d.w, bh - 2); c.restore();
          });
          txt(c, String(api.score), W / 2, 60, 52, '#fff', 'center', 'rgba(255,255,255,0.6)');
          if (popT > 0) { c.globalAlpha = Math.min(1, popT * 2); txt(c, popS, W / 2, 110, 24, '#ffe14d', 'center', '#ff4fd8'); c.globalAlpha = 1; }
        }
      };
      return inst;
    }
  });
})();
