/* Grok Arcade - bonus game #9: Rat Maze Dash. Pick Luna, Pi-rat (one eye) or Snowie (white) and scurry through
   the maze munching seeds (+1) and cheese (+5). Dodge the cat! Grab a squeaky toy and the cat gets distracted
   for a few seconds - boop it back to its bed for bonus points. Clear every treat to reach the next maze.
   Swipe / on-screen arrow pad on phones, arrow keys or WASD on desktop. 3 hearts. */
(function () {
  'use strict';
  var U = GA.MG.U;
  var MAZES = [
    ['###############','#o.....#.....o#','#.##.#.#.#.##.#','#.............#','#.##.##.##.##.#','#....#...#....#','####.#.#.#.####','.......C.......','####.#.#.#.####','#....#...#....#','#.##...#...##.#','#T.#.#...#.#.T#','##.#.#.#.#.#.##','#......R......#','#.####.#.####.#','#o...........o#','###############'],
    ['###############','#T...........T#','#.##.#####.##.#','#.#.........#.#','#.#.##.#.##.#.#','#...#.....#...#','###.#.###.#.###','.......C.......','#.##.#.#.#.##.#','#..#.#...#.#..#','##.....#.....##','##.##.###.##.##','#o....###....o#','#.##.#.R.#.##.#','#.##.#.#.#.##.#','#o...........o#','###############'],
    ['###############','#o...........o#','#.##.##.##.##.#','#.............#','#.#.##.#.##.#.#','#.#..#...#..#.#','#.##.#.#.#.##.#','#....#.C.#....#','###.##.#.##.###','#......#......#','#.#.#.###.#.#.#','#T#.#.....#.#T#','#.#.##.#.##.#.#','#......R......#','#.####.#.####.#','#o...........o#','###############'],
    ['###############','#T...........T#','#.#.###.###.#.#','#.#...#.#...#.#','#.#.#.#.#.#.#.#','#...#.....#...#','###.#.###.#.###','.......C.......','#.###.#.#.###.#','#.#...#.#...#.#','#.#.###.###.#.#','#o...........o#','##.##.#.#.##.##','#..#..#R#..#..#','#.##.##.##.##.#','#o...........o#','###############']
  ];
  var RATS = [
    { id: 'luna', name: 'Luna', tag: 'Silver sweetheart', col: '#c3c8d6' },
    { id: 'pirat', name: 'Pi-rat', tag: 'One eye, big heart', col: '#e0b080' },
    { id: 'snowie', name: 'Snowie', tag: 'Snow-white speedster', col: '#ffffff' }
  ];
  var CATS = [
    { body: '#f59e0b', dark: '#b45309', eye: '#4ade80', name: 'Ginger' },
    { body: '#3a3a48', dark: '#1d1d26', eye: '#facc15', name: 'Tux', white: true },
    { body: '#f1ece4', dark: '#9a5b2e', eye: '#38bdf8', name: 'Calico', patch: '#e07a2e' }
  ];
  var DIRS = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } };
  var COLS = 15, ROWS = 17, RAT_SPEED = 5.2;

  GA.MG.register({
    id: 'ratmaze', name: 'Rat Maze Dash', ticketDiv: 15, dpad: true,
    howTouch: 'Pick your rat, then swipe anywhere or use the arrow pad to scurry. Eat seeds & cheese, dodge the cat! A squeaky toy distracts the cat - boop it for bonus points. 3 hearts.',
    howKeys: 'Pick your rat (1/2/3 or arrows + Enter), then steer with the arrow keys or WASD. Eat seeds & cheese, dodge the cat! A squeaky toy distracts the cat - boop it for bonus points. 3 hearts.',
    create: function (api) {
      var t = 0, phase, sel, rat, cats, grid, maze, level, lives, left, tile, ox, oy, hudY, mazeCv, parts, pops, banner, bannerT, pauseT, scaredT, boopChain, invT, eaten, golden, sw, cards, goBtn, deathT, mazeIdx;
      sel = U.clamp(+GA.store.get('ratmaze.rat', 0) || 0, 0, 2);
      function open(x, y) { if (y < 0 || y >= ROWS) return false; x = ((x % COLS) + COLS) % COLS; return maze[y][x] !== '#'; }
      function layout() {
        var W = api.W, H = api.H, hud = 40, avH = H - api.padH - hud - 10;
        tile = Math.floor(Math.max(10, Math.min((W - 12) / COLS, avH / ROWS, 46)));
        ox = Math.floor((W - tile * COLS) / 2); hudY = 6; oy = Math.floor(hud + Math.max(0, (avH - tile * ROWS) / 2));
        if (maze) buildMazeCanvas();
        layoutCards();
      }
      function layoutCards() {
        var W = api.W, H = api.H - api.padH, portrait = W < H * 0.9 || W < 520;
        cards = [];
        if (portrait) {
          var cw = Math.min(W - 40, 360), ch = Math.min(116, (H - 210) / 3);
          for (var i = 0; i < 3; i++) cards.push({ x: (W - cw) / 2, y: 92 + i * (ch + 12), w: cw, h: ch, row: true });
          goBtn = { x: W / 2 - 90, y: 92 + 3 * (ch + 12) + 4, w: 180, h: 54 };
        } else {
          var cw2 = Math.min(220, (W - 80) / 3), ch2 = Math.min(250, H - 240);
          for (var j = 0; j < 3; j++) cards.push({ x: W / 2 - (cw2 * 1.5 + 20) + j * (cw2 + 20), y: 100, w: cw2, h: ch2 });
          goBtn = { x: W / 2 - 90, y: 100 + ch2 + 24, w: 180, h: 56 };
        }
      }
      function buildMazeCanvas() {
        var d = api.dpr; mazeCv = document.createElement('canvas'); mazeCv.width = Math.ceil(tile * COLS * d); mazeCv.height = Math.ceil(tile * ROWS * d);
        var g = mazeCv.getContext('2d'); g.scale(d, d);
        var hue = [268, 200, 320, 160][mazeIdx % 4];
        g.fillStyle = 'hsl(' + hue + ',45%,9%)'; g.fillRect(0, 0, tile * COLS, tile * ROWS);
        // soft bedding dots on the floor
        g.fillStyle = 'hsla(' + hue + ',40%,22%,0.5)';
        for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) if (maze[y][x] !== '#' && (x * 7 + y * 3) % 5 === 0) g.fillRect(x * tile + tile * 0.2, y * tile + tile * 0.7, 2, 2);
        for (y = 0; y < ROWS; y++) for (x = 0; x < COLS; x++) {
          if (maze[y][x] !== '#') continue;
          var px = x * tile, py = y * tile;
          g.fillStyle = 'hsl(' + hue + ',55%,30%)'; g.fillRect(px, py, tile, tile);
          g.fillStyle = 'hsl(' + hue + ',55%,38%)'; g.fillRect(px + 2, py + 2, tile - 4, tile * 0.35);
        }
        // neon outline on wall edges that touch the floor
        g.strokeStyle = 'hsl(' + hue + ',100%,70%)'; g.lineWidth = Math.max(2, tile * 0.09); g.lineCap = 'round'; g.shadowColor = g.strokeStyle; g.shadowBlur = 6;
        g.beginPath();
        for (y = 0; y < ROWS; y++) for (x = 0; x < COLS; x++) {
          if (maze[y][x] !== '#') continue; var px2 = x * tile, py2 = y * tile;
          if (y > 0 && maze[y - 1][x] !== '#') { g.moveTo(px2, py2); g.lineTo(px2 + tile, py2); }
          if (y < ROWS - 1 && maze[y + 1][x] !== '#') { g.moveTo(px2, py2 + tile); g.lineTo(px2 + tile, py2 + tile); }
          if (x > 0 && maze[y][x - 1] !== '#') { g.moveTo(px2, py2); g.lineTo(px2, py2 + tile); }
          if (x < COLS - 1 && maze[y][x + 1] !== '#') { g.moveTo(px2 + tile, py2); g.lineTo(px2 + tile, py2 + tile); }
        }
        g.stroke(); g.shadowBlur = 0;
        // the cat bed
        var c = findChar('C'); g.fillStyle = 'rgba(255,120,180,0.35)'; g.beginPath(); g.ellipse((c.x + 0.5) * tile, (c.y + 0.62) * tile, tile * 0.46, tile * 0.3, 0, 0, 7); g.fill();
      }
      function findChar(ch) { for (var y = 0; y < ROWS; y++) { var x = maze[y].indexOf(ch); if (x >= 0) return { x: x, y: y }; } return { x: 7, y: 7 }; }
      function catSpeed() { return Math.min(RAT_SPEED * 0.97, RAT_SPEED * (0.6 + (level - 1) * 0.06)); }
      function catCount() { return level >= 6 ? 3 : level >= 3 ? 2 : 1; }
      function placeActors() {
        var r = findChar('R'), c = findChar('C');
        rat = { x: r.x, y: r.y, dir: { x: 0, y: 0 }, want: { x: 0, y: 0 }, face: 1, step: 0, happy: 0 };
        cats = [];
        for (var i = 0; i < catCount(); i++) cats.push({ x: c.x, y: c.y, dir: { x: 0, y: 0 }, home: { x: c.x, y: c.y }, wait: 2.2 + i * 4.5, scared: false, k: i, mode: 0 });
        invT = 1.2; sw = null;
      }
      function loadLevel() {
        mazeIdx = (level - 1) % MAZES.length; maze = MAZES[mazeIdx];
        grid = []; left = 0; eaten = 0; golden = null;
        for (var y = 0; y < ROWS; y++) { grid.push([]); for (var x = 0; x < COLS; x++) { var ch = maze[y][x], v = ch === '.' ? 1 : ch === 'o' ? 2 : ch === 'T' ? 3 : 0; grid[y].push(v); if (v === 1 || v === 2) left++; } }
        scaredT = 0; boopChain = 0; buildMazeCanvas(); placeActors();
        show(level === 1 ? 'READY!' : 'MAZE ' + level, 1.4); pauseT = 1.3;
      }
      function show(s, d) { banner = s; bannerT = d; }
      function burst(x, y, col, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.28, s = 40 + Math.random() * 120; parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 0.5, c: col }); } }
      function pop(x, y, s, c) { pops.push({ x: x, y: y, s: s, c: c, l: 0.9 }); }
      function sx(x) { return ox + (x + 0.5) * tile; }
      function sy(y) { return oy + (y + 0.5) * tile; }
      function setWant(d) { if (phase !== 'play' || !d) return; rat.want = { x: d.x, y: d.y }; if (rat.dir.x === -d.x && rat.dir.y === -d.y && (d.x || d.y)) rat.dir = { x: d.x, y: d.y }; }
      // grid movement: entities glide between tile centres and can only turn on a centre
      function advance(e, step, choose) {
        var guard = 0;
        while (step > 1e-7 && guard++ < 8) {
          var tx = Math.round(e.x), ty = Math.round(e.y), atC = Math.abs(e.x - tx) < 1e-5 && Math.abs(e.y - ty) < 1e-5;
          if (atC) { e.x = tx; e.y = ty; if (e.x < 0) e.x += COLS; if (e.x >= COLS) e.x -= COLS; choose(e); if (!e.dir.x && !e.dir.y) return; }
          var d = atC ? 1 : e.dir.x ? (e.dir.x > 0 ? Math.ceil(e.x) - e.x : e.x - Math.floor(e.x)) : (e.dir.y > 0 ? Math.ceil(e.y) - e.y : e.y - Math.floor(e.y));
          if (!e.dir.x && !e.dir.y) return;
          var m = Math.min(d, step); e.x += e.dir.x * m; e.y += e.dir.y * m; step -= m;
          if (m >= d - 1e-7) { e.x = Math.round(e.x); e.y = Math.round(e.y); }
        }
        if (e.x < -0.5) e.x += COLS; if (e.x > COLS - 0.5) e.x -= COLS;
      }
      function chooseRat(e) {
        if ((e.want.x || e.want.y) && open(e.x + e.want.x, e.y + e.want.y)) e.dir = { x: e.want.x, y: e.want.y };
        else if (!open(e.x + e.dir.x, e.y + e.dir.y)) e.dir = { x: 0, y: 0 };
        if (e.dir.x) e.face = e.dir.x;
        eat(e.x, e.y);
      }
      function eat(x, y) {
        x = ((x % COLS) + COLS) % COLS; var v = grid[y][x]; if (!v) return;
        grid[y][x] = 0;
        if (v === 1) { api.addScore(1); left--; eaten++; if (eaten % 2 === 0) api.sfx('eat'); }
        else if (v === 2) { api.addScore(5); left--; eaten++; api.sfx('bonus'); rat.happy = 0.8; burst(sx(x), sy(y), '#ffd23b', 10); pop(sx(x), sy(y) - tile * 0.6, '+5', '#ffe14d'); }
        else if (v === 3) { api.addScore(2); api.sfx('squeak'); scare(); burst(sx(x), sy(y), '#ff8fd0', 14); pop(sx(x), sy(y) - tile * 0.6, 'SQUEAK!', '#ff8fd0'); }
        if (eaten === 50 && !golden) { var c = findChar('C'); golden = { x: c.x, y: c.y + (open(c.x, c.y + 1) ? 1 : 0), t: 9 }; }
        if (left <= 0) levelClear();
      }
      function scare() {
        scaredT = Math.max(3.5, 7 - (level - 1) * 0.5); boopChain = 0;
        cats.forEach(function (c) { if (c.wait <= 0) { c.scared = true; c.dir = { x: -c.dir.x, y: -c.dir.y }; } });
      }
      function levelClear() {
        var bonus = 25 * level; api.addScore(bonus); api.sfx('level'); phase = 'clear'; pauseT = 1.8;
        show('MAZE CLEAR! +' + bonus, 1.8);
        if (level % 2 === 0 && lives < 3) { lives++; pop(api.W / 2, oy + tile * 9, '+1 \u2665', '#ff6b8a'); }
      }
      function chooseCat(c) {
        var opts = [], rx = Math.round(rat.x), ry = Math.round(rat.y);
        [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].forEach(function (d) {
          if (!open(c.x + d.x, c.y + d.y)) return;
          if (d.x === -c.dir.x && d.y === -c.dir.y && (c.dir.x || c.dir.y)) return; // no U-turns
          opts.push(d);
        });
        if (!opts.length) { c.dir = { x: -c.dir.x, y: -c.dir.y }; return; }
        var tx, ty, flee = c.scared;
        // fair AI: alternate chasing and wandering; early levels add plenty of randomness
        if (c.mode === 1) { var cr = [[1, 1], [COLS - 2, 1], [1, ROWS - 2], [COLS - 2, ROWS - 2]][(c.k + mazeIdx) % 4]; tx = cr[0]; ty = cr[1]; }
        else if (c.k === 1) { tx = rx + rat.dir.x * 3; ty = ry + rat.dir.y * 3; } // the second cat tries to cut you off
        else { tx = rx; ty = ry; }
        var rnd = Math.max(0.08, 0.35 - (level - 1) * 0.05);
        if (flee || Math.random() < rnd) {
          if (flee) opts.sort(function (a, b) { return dist2(c.x + b.x, c.y + b.y, rx, ry) - dist2(c.x + a.x, c.y + a.y, rx, ry); });
          c.dir = (flee && Math.random() < 0.7) ? opts[0] : opts[Math.floor(Math.random() * opts.length)];
          return;
        }
        opts.sort(function (a, b) { return dist2(c.x + a.x, c.y + a.y, tx, ty) - dist2(c.x + b.x, c.y + b.y, tx, ty); });
        c.dir = opts[0];
      }
      function dist2(ax, ay, bx, by) { var dx = Math.abs(ax - bx); dx = Math.min(dx, COLS - dx); return dx * dx + (ay - by) * (ay - by); }
      function caught() {
        lives--; api.sfx('lifelost'); phase = 'caught'; deathT = 1.3; burst(sx(rat.x), sy(rat.y), '#ff6b8a', 18);
        show(lives > 0 ? 'CAUGHT!' : 'GAME OVER', 1.3);
      }
      function startRun() { phase = 'play'; GA.store.set('ratmaze.rat', sel); level = 1; lives = 3; loadLevel(); api.sfx('start'); }
      function hit(b, x, y) { return b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }

      var inst = {
        reset: function () { t = 0; phase = 'pick'; level = 1; lives = 3; parts = []; pops = []; banner = ''; bannerT = 0; pauseT = 0; scaredT = 0; maze = MAZES[0]; mazeIdx = 0; grid = null; rat = null; cats = []; layout(); },
        resize: function () { layout(); },
        // test / debug hook
        debug: function () {
          return { phase: phase, rat: rat && { x: rat.x, y: rat.y, dir: rat.dir, type: RATS[sel].id }, sel: sel, level: level, lives: lives, left: left, tile: tile, ox: ox, oy: oy,
            scared: scaredT, cats: cats.map(function (c) { return { x: c.x, y: c.y, wait: c.wait, scared: c.scared }; }), cards: cards, go: goBtn, catSpeed: level ? catSpeed() : 0, ratSpeed: RAT_SPEED };
        },
        pick: function (i) { sel = i; startRun(); },
        testClear: function () { if (phase !== 'play') return; for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) grid[y][x] = 0; left = 0; levelClear(); },
        update: function (dt) {
          t += dt;
          parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; p.l -= dt; }); parts = parts.filter(function (p) { return p.l > 0; });
          pops.forEach(function (p) { p.y -= 34 * dt; p.l -= dt; }); pops = pops.filter(function (p) { return p.l > 0; });
          if (bannerT > 0) bannerT -= dt;
          if (!api.playing || phase === 'pick') return;
          if (phase === 'caught') { deathT -= dt; if (deathT <= 0) { if (lives <= 0) { phase = 'over'; api.gameOver(); } else { phase = 'play'; placeActors(); pauseT = 0.9; show('GO!', 0.9); } } return; }
          if (phase === 'clear') { pauseT -= dt; if (pauseT <= 0) { level++; phase = 'play'; loadLevel(); } return; }
          if (phase !== 'play') return;
          if (pauseT > 0) { pauseT -= dt; return; }
          if (invT > 0) invT -= dt; if (rat.happy > 0) rat.happy -= dt;
          var moving = rat.dir.x || rat.dir.y;
          advance(rat, RAT_SPEED * dt, chooseRat);
          if (!rat.dir.x && !rat.dir.y && (rat.want.x || rat.want.y)) chooseRat(rat); // start moving from a standstill
          if (moving) rat.step += dt * 14;
          if (phase !== 'play') return; // just cleared the maze
          if (golden) { golden.t -= dt; if (golden.t <= 0) golden = null; else if (Math.abs(rat.x - golden.x) < 0.5 && Math.abs(rat.y - golden.y) < 0.5) { api.addScore(15); api.sfx('perfect'); burst(sx(golden.x), sy(golden.y), '#ff3b6b', 14); pop(sx(golden.x), sy(golden.y) - tile * 0.6, '+15', '#ff8fb0'); golden = null; } }
          if (scaredT > 0) { scaredT -= dt; if (scaredT <= 0) cats.forEach(function (c) { c.scared = false; }); }
          var sp = catSpeed();
          for (var i = 0; i < cats.length; i++) {
            var c = cats[i];
            if (c.wait > 0) { c.wait -= dt; continue; }
            c.modeT = (c.modeT || 0) + dt; var cyc = c.modeT % 12; c.mode = cyc > 8.5 ? 1 : 0; // ~8.5 s chase, 3.5 s wander
            advance(c, (c.scared ? sp * 0.55 : sp) * dt, chooseCat);
            var dx = Math.abs(c.x - rat.x); dx = Math.min(dx, COLS - dx);
            if (dx < 0.62 && Math.abs(c.y - rat.y) < 0.62) {
              if (c.scared) {
                boopChain++; var pts = 10 * Math.pow(2, Math.min(2, boopChain - 1)); api.addScore(pts); api.sfx('boop');
                burst(sx(c.x), sy(c.y), '#9fb0ff', 14); pop(sx(c.x), sy(c.y) - tile * 0.6, 'BOOP! +' + pts, '#c8d2ff');
                c.x = c.home.x; c.y = c.home.y; c.dir = { x: 0, y: 0 }; c.scared = false; c.wait = 3;
              } else if (invT <= 0) { caught(); return; }
            }
          }
        },
        onDown: function (x, y) {
          if (phase === 'pick') {
            for (var i = 0; i < cards.length; i++) if (hit(cards[i], x, y)) { if (sel === i) { startRun(); return; } sel = i; api.sfx('click'); return; }
            if (hit(goBtn, x, y)) startRun();
            return;
          }
          sw = { x: x, y: y };
        },
        onMove: function (x, y, down) {
          if (!down || !sw || phase === 'pick') return;
          var dx = x - sw.x, dy = y - sw.y, th = Math.max(14, tile * 0.5);
          if (Math.abs(dx) < th && Math.abs(dy) < th) return;
          setWant(Math.abs(dx) > Math.abs(dy) ? { x: dx > 0 ? 1 : -1, y: 0 } : { x: 0, y: dy > 0 ? 1 : -1 });
          sw = { x: x, y: y };
        },
        onUp: function () { sw = null; },
        onKey: function (k, down) {
          if (!down) return;
          if (phase === 'pick') {
            if (k === '1' || k === '2' || k === '3') { sel = +k - 1; startRun(); return; }
            if (k === 'ArrowLeft' || k === 'ArrowUp') { sel = (sel + 2) % 3; api.sfx('click'); }
            else if (k === 'ArrowRight' || k === 'ArrowDown') { sel = (sel + 1) % 3; api.sfx('click'); }
            else if (k === ' ' || k === 'Enter') startRun();
            return;
          }
          if (DIRS[k]) setWant(DIRS[k]);
        },
        draw: function (c) {
          var W = api.W, H = api.H, i;
          c.fillStyle = '#0d0620'; c.fillRect(0, 0, W, H);
          if (phase === 'pick') { drawPick(c); drawFx(c); return; }
          // HUD
          for (i = 0; i < 3; i++) U.heart(c, ox + 14 + i * 26, hudY + 16, 22, i < lives ? '#ff4f8b' : 'rgba(255,255,255,0.18)');
          U.text(c, 'MAZE ' + level, W / 2, hudY + 16, 18, '#ffe14d');
          U.text(c, RATS[sel].name, ox + tile * COLS - 4, hudY + 16, 16, RATS[sel].col, 'right');
          // maze + items
          c.drawImage(mazeCv, ox, oy, tile * COLS, tile * ROWS);
          c.save(); c.beginPath(); c.rect(ox, oy, tile * COLS, tile * ROWS); c.clip();
          for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) {
            var v = grid[y][x]; if (!v) continue; var px = sx(x), py = sy(y);
            if (v === 1) drawSeed(c, px, py, tile, (x + y) % 2);
            else if (v === 2) drawCheese(c, px, py + Math.sin(t * 3 + x) * tile * 0.05, tile);
            else drawToy(c, px, py, tile);
          }
          if (golden && (golden.t > 2 || Math.floor(t * 8) % 2)) drawBerry(c, sx(golden.x), sy(golden.y), tile);
          cats.forEach(function (ct) { drawCat(c, ct); });
          if (rat && phase !== 'caught' || (phase === 'caught' && Math.floor(t * 10) % 2)) drawPlayer(c);
          c.restore();
          if (rat && rat.x > COLS - 1) { c.save(); c.beginPath(); c.rect(ox, oy, tile * COLS, tile * ROWS); c.clip(); c.translate(-COLS * tile, 0); drawPlayer(c); c.restore(); }
          drawFx(c);
          if (bannerT > 0 && banner) { var bs = Math.min(40, W / 12); c.fillStyle = 'rgba(13,6,32,0.7)'; c.fillRect(0, oy + tile * 8 - bs * 0.9, W, bs * 1.8); U.text(c, banner, W / 2, oy + tile * 8.5 - tile * 0.5, bs, '#ffe14d', 'center', '#ff4fd8'); }
          if (scaredT > 0 && phase === 'play') U.text(c, 'CAT DISTRACTED ' + Math.ceil(scaredT) + 's', W / 2, oy + tile * ROWS + 14, 14, '#c8d2ff');
        }
      };
      function drawFx(c) {
        parts.forEach(function (p) { c.globalAlpha = Math.max(0, p.l * 2); c.fillStyle = p.c; c.fillRect(p.x - 2, p.y - 2, 4, 4); }); c.globalAlpha = 1;
        pops.forEach(function (p) { c.globalAlpha = Math.min(1, p.l * 2); U.text(c, p.s, p.x, p.y, Math.max(14, tile * 0.6), p.c, 'center', '#000'); }); c.globalAlpha = 1;
      }
      function drawPick(c) {
        var W = api.W;
        U.text(c, 'CHOOSE YOUR RAT', W / 2, 40, Math.min(30, W / 13), '#ffe14d', 'center', '#ff4fd8');
        U.text(c, api.touch ? 'Tap a rat, then GO!' : 'Click, 1 / 2 / 3, or arrows + Enter', W / 2, 70, 15, '#c8b8ff');
        cards.forEach(function (b, i) {
          var on = i === sel, R = RATS[i];
          c.fillStyle = on ? 'rgba(255,79,216,0.25)' : 'rgba(40,25,90,0.75)'; U.rr(c, b.x, b.y, b.w, b.h, 16); c.fill();
          c.lineWidth = on ? 4 : 2; c.strokeStyle = on ? '#ff4fd8' : '#5b4a9a'; c.stroke();
          var bob = on ? Math.sin(t * 5) * 3 : 0;
          if (b.row) {
            var s = Math.min(b.h * 0.62, 80); GA.drawRat(c, R.id, b.x + 16 + s * 0.6, b.y + b.h / 2 - s * 0.25 + bob, s, on && Math.floor(t * 1.5) % 3 === 0);
            U.text(c, R.name, b.x + s * 1.35 + 24, b.y + b.h * 0.38, Math.min(26, b.h * 0.26), on ? '#fff' : '#ddd', 'left');
            U.text(c, R.tag, b.x + s * 1.35 + 24, b.y + b.h * 0.68, Math.min(15, b.h * 0.15), R.col === '#ffffff' ? '#e8e8ff' : R.col, 'left');
          } else {
            var s2 = Math.min(b.w * 0.6, 120); GA.drawRat(c, R.id, b.x + b.w / 2, b.y + b.h * 0.35 + bob, s2, on && Math.floor(t * 1.5) % 3 === 0);
            U.text(c, R.name, b.x + b.w / 2, b.y + b.h - 50, 24, on ? '#fff' : '#ddd');
            U.text(c, R.tag, b.x + b.w / 2, b.y + b.h - 22, 14, R.col === '#ffffff' ? '#e8e8ff' : R.col);
          }
          U.text(c, String(i + 1), b.x + b.w - 16, b.y + 16, 14, 'rgba(255,255,255,0.5)');
        });
        c.fillStyle = '#ffe14d'; U.rr(c, goBtn.x, goBtn.y, goBtn.w, goBtn.h, 14); c.fill();
        U.text(c, 'GO, ' + RATS[sel].name.toUpperCase() + '!', goBtn.x + goBtn.w / 2, goBtn.y + goBtn.h / 2, 22, '#2a1150');
      }
      function drawPlayer(c) {
        var px = sx(rat.x), py = sy(rat.y), s = tile * 0.92, wig = Math.sin(rat.step) * 0.12;
        if (invT > 0 && Math.floor(t * 12) % 2) c.globalAlpha = 0.5;
        // tail (pink) trailing behind the movement direction
        var bx = -(rat.dir.x || 0), by = -(rat.dir.y || (rat.dir.x ? 0 : -1));
        c.strokeStyle = '#ffadc8'; c.lineWidth = Math.max(2, tile * 0.1); c.lineCap = 'round'; c.beginPath();
        c.moveTo(px + bx * s * 0.3, py + by * s * 0.3 + s * 0.2);
        c.quadraticCurveTo(px + bx * s * 0.7 + by * s * wig * 3, py + by * s * 0.7 + s * 0.2 + bx * s * wig * 3, px + bx * s * 0.95, py + by * s * 0.85 + s * 0.15); c.stroke();
        c.save(); c.translate(px, py); c.rotate((rat.dir.x || 0) * 0.18 + wig * 0.4);
        GA.drawRat(c, RATS[sel].id, 0, -s * 0.18, s, rat.happy > 0, t);
        c.restore(); c.globalAlpha = 1;
      }
      function drawCat(c, ct) {
        var px = sx(ct.x), py = sy(ct.y), r = tile * 0.46, C = CATS[ct.k % 3], sc = ct.scared, end = sc && scaredT < 2 && Math.floor(t * 8) % 2, sleep = ct.wait > 0;
        var body = sc ? (end ? '#ffffff' : '#7c8cff') : C.body, dark = sc ? '#4c5bd6' : C.dark;
        c.save(); c.translate(px, py + Math.sin(t * 8 + ct.k) * (sleep ? 0 : tile * 0.03));
        // ears
        c.fillStyle = body; [-1, 1].forEach(function (s) { c.beginPath(); c.moveTo(s * r * 0.95, -r * 0.2); c.lineTo(s * r * 0.75, -r * 1.25); c.lineTo(s * r * 0.15, -r * 0.75); c.closePath(); c.fill(); });
        c.fillStyle = '#ff9ec4'; [-1, 1].forEach(function (s) { c.beginPath(); c.moveTo(s * r * 0.78, -r * 0.4); c.lineTo(s * r * 0.7, -r * 1.0); c.lineTo(s * r * 0.35, -r * 0.7); c.closePath(); c.fill(); });
        c.fillStyle = body; c.beginPath(); c.ellipse(0, 0, r, r * 0.88, 0, 0, 7); c.fill();
        if (!sc && C.patch) { c.fillStyle = C.patch; c.beginPath(); c.arc(-r * 0.45, -r * 0.4, r * 0.38, 0, 7); c.fill(); c.fillStyle = '#3a2a22'; c.beginPath(); c.arc(r * 0.5, -r * 0.35, r * 0.3, 0, 7); c.fill(); }
        if (!sc && C.white) { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, r * 0.4, r * 0.55, r * 0.42, 0, 0, 7); c.fill(); }
        if (!sc && !C.patch && !C.white) { c.strokeStyle = dark; c.lineWidth = Math.max(1.5, r * 0.12); [-0.3, 0, 0.3].forEach(function (o) { c.beginPath(); c.moveTo(o * r, -r * 0.85); c.lineTo(o * r * 0.8, -r * 0.5); c.stroke(); }); }
        // eyes
        if (sleep) { c.strokeStyle = '#222'; c.lineWidth = Math.max(1.5, r * 0.1); [-1, 1].forEach(function (s) { c.beginPath(); c.arc(s * r * 0.38, -r * 0.1, r * 0.17, 0.2, Math.PI - 0.2); c.stroke(); }); U.text(c, 'z', r * 0.9, -r * 1.1 - Math.sin(t * 2) * 3, Math.max(10, r * 0.7), '#c8d2ff'); }
        else if (sc) { c.strokeStyle = '#fff'; c.lineWidth = Math.max(1.5, r * 0.1); [-1, 1].forEach(function (s) { c.beginPath(); for (var a = 0; a < 9; a++) { var rr = a / 9 * r * 0.22, an = a * 1.4 + t * 8 * s; c.lineTo(s * r * 0.38 + Math.cos(an) * rr, -r * 0.1 + Math.sin(an) * rr); } c.stroke(); }); }
        else {
          [-1, 1].forEach(function (s) { c.fillStyle = C.eye; c.beginPath(); c.ellipse(s * r * 0.38, -r * 0.1, r * 0.2, r * 0.22, 0, 0, 7); c.fill();
            var lx = U.clamp(rat.x - ct.x, -1, 1) * r * 0.06, ly = U.clamp(rat.y - ct.y, -1, 1) * r * 0.06;
            c.fillStyle = '#111'; c.beginPath(); c.ellipse(s * r * 0.38 + lx, -r * 0.1 + ly, r * 0.06, r * 0.18, 0, 0, 7); c.fill(); });
        }
        c.fillStyle = '#ff7fa6'; c.beginPath(); c.moveTo(-r * 0.1, r * 0.2); c.lineTo(r * 0.1, r * 0.2); c.lineTo(0, r * 0.32); c.closePath(); c.fill();
        c.strokeStyle = sc ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.75)'; c.lineWidth = 1;
        [-1, 1].forEach(function (s) { for (var w = -1; w <= 1; w++) { c.beginPath(); c.moveTo(s * r * 0.3, r * 0.3); c.lineTo(s * r * 1.15, r * 0.25 + w * r * 0.18); c.stroke(); } });
        c.restore();
      }
      function drawSeed(c, x, y, tl, k) {
        c.save(); c.translate(x, y); c.rotate(k ? 0.6 : -0.6);
        c.fillStyle = '#e9d8a6'; c.beginPath(); c.ellipse(0, 0, tl * 0.09, tl * 0.15, 0, 0, 7); c.fill();
        c.fillStyle = '#6b5a3a'; c.fillRect(-tl * 0.018, -tl * 0.12, tl * 0.036, tl * 0.24);
        c.restore();
      }
      function drawCheese(c, x, y, tl) {
        var s = tl * 0.36; c.save(); c.translate(x, y); c.shadowColor = '#ffd23b'; c.shadowBlur = 10;
        c.fillStyle = '#ffd23b'; c.beginPath(); c.moveTo(-s, s * 0.6); c.lineTo(s, s * 0.6); c.lineTo(s, -s * 0.2); c.lineTo(-s, s * 0.6 - s * 0.05); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(-s, s * 0.55); c.lineTo(s, -s * 0.25); c.lineTo(s * 0.6, -s * 0.7); c.closePath(); c.fillStyle = '#ffe680'; c.fill(); c.shadowBlur = 0;
        c.fillStyle = '#e0a800'; c.beginPath(); c.arc(s * 0.4, s * 0.25, s * 0.14, 0, 7); c.arc(-s * 0.2, s * 0.38, s * 0.1, 0, 7); c.arc(s * 0.75, s * 0.05, s * 0.09, 0, 7); c.fill();
        c.restore();
      }
      function drawToy(c, x, y, tl) {
        var s = tl * 0.3 * (1 + Math.sin(t * 6) * 0.12); c.save(); c.translate(x, y); c.shadowColor = '#ff8fd0'; c.shadowBlur = 14;
        c.fillStyle = '#ff8fd0'; c.beginPath(); c.arc(0, 0, s, 0, 7); c.fill(); c.shadowBlur = 0;
        c.fillStyle = '#fff'; c.beginPath(); c.arc(-s * 0.35, -s * 0.35, s * 0.25, 0, 7); c.fill();
        c.strokeStyle = '#c2185b'; c.lineWidth = Math.max(1.5, s * 0.15); c.beginPath(); c.arc(0, 0, s * 0.6, 0.3, 2.8); c.stroke();
        c.restore();
      }
      function drawBerry(c, x, y, tl) {
        var s = tl * 0.34; c.save(); c.translate(x, y + Math.sin(t * 4) * 2); c.shadowColor = '#ff3b6b'; c.shadowBlur = 12;
        c.fillStyle = '#ff3b6b'; c.beginPath(); c.moveTo(0, s); c.bezierCurveTo(-s * 1.2, s * 0.2, -s, -s * 0.8, 0, -s * 0.5); c.bezierCurveTo(s, -s * 0.8, s * 1.2, s * 0.2, 0, s); c.fill(); c.shadowBlur = 0;
        c.fillStyle = '#4ade80'; c.beginPath(); c.moveTo(-s * 0.5, -s * 0.6); c.lineTo(0, -s * 0.9); c.lineTo(s * 0.5, -s * 0.6); c.lineTo(0, -s * 0.4); c.closePath(); c.fill();
        c.fillStyle = '#ffe14d'; [[-0.3, 0], [0.3, 0.05], [0, 0.4], [-0.1, -0.25], [0.25, -0.25]].forEach(function (p) { c.fillRect(p[0] * s, p[1] * s, 2, 2); });
        c.restore();
      }
      return inst;
    }
  });
})();
