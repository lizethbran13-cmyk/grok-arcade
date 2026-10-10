/* Grok Arcade - two walk-up claw machines (Easy + Tricky) in the hub.
   Walk up, pay (free plays daily, then tickets), steer the claw with the pad / arrow keys, hit DROP.
   The claw drops, closes, lifts and carries the prize to the chute. Whether it holds on depends on your aim:
   - Easy Claw: wide claw, strong grip, no swing.
   - Tricky Claw: narrower, weaker grip, the claw swings on its cable and prizes can slip. Let it settle first!
   Contents rotate every 3 days (picked from the date). Wins go straight onto the Achievement Gallery shelf.
   The same deterministic simulation drives the real game and GA.Claw.simBatch (used to check win rates). */
(function () {
  'use strict';
  var T = THREE;
  var C = GA.Claw = {};
  var FLOOR = 0.98, TOPY = 1.95, RAILY = 2.17, AX = 0.55, AZ = 0.45, GX = 0.5, GZ = 0.4, DT = 1 / 120;
  var CH = { x: -0.42, z: 0.32, h: 0.13 }; // chute hole (front-left corner, machine-local coords; +z = player side)
  var CFG = {
    easy: { id: 'easy', name: 'Easy Claw', cost: 5, free: 2, R: 0.17, P: 0.19, k: 70, c: 16, limit: 25, n: 12, aMax: 1.05, grip: 0.97, buried: 0.45,
      liftSlip: [0.02, 0.10], carryHaz: 0.02, speed: 0.42, col: '#0e7490', glow: '#22d3ee', col2: '#ffe14d', blurb: 'Wide claw, strong grip' },
    tricky: { id: 'tricky', name: 'Tricky Claw', cost: 10, free: 1, R: 0.135, P: 0.17, k: 24, c: 1.0, limit: 30, n: 11, aMax: 0.85, grip: 0.84, buried: 0.3,
      liftSlip: [0.12, 0.4], carryHaz: 0.10, speed: 0.45, col: '#6b21a8', glow: '#c084fc', col2: '#ff4fd8', blurb: 'Swingy claw, slippery grip' }
  };
  C.CFG = CFG;

  /* ---------- helpers ---------- */
  function rngOf(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function prize(id) { return GA.findPrize(id) || { id: id, name: id, r: 0.115 }; }
  C._dayOffset = 0;
  function dayNum() { var d = new Date(Date.now() + C._dayOffset * 864e5); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5); }
  function period() { return Math.floor(dayNum() / 3); }
  function daysLeft() { return 3 - (((dayNum() % 3) + 3) % 3); }
  function contents(machine, p) { p = p == null ? period() : p; var S = GA.CLAW_SETS || [[]]; var i = machine === 'easy' ? p : p + 1; return S[((i % S.length) + S.length) % S.length].slice(); }
  C.contents = function (machine, dayOffset) { if (dayOffset == null) return contents(machine); var o = C._dayOffset; C._dayOffset = dayOffset; var r = contents(machine); C._dayOffset = o; return r; };
  C.daysLeft = daysLeft; C.period = period; // the attic hatch moves on this same 3-day clock

  /* ---------- the prize pile ---------- */
  function inChuteZone(x, z, pad) { return x < CH.x + CH.h + 0.035 + pad && z > CH.z - CH.h - 0.035 - pad; }
  /* Prize spacing (booth #17): every prize knows its real on-screen size (vr = how wide it is from above, vR = a ball that
     fully holds it, dy = how far its middle sits below the physics centre). Prizes on the floor never get closer than their
     widths; anything that can't fit on the floor rests on top of others, touching but never inside them. */
  function vis(o) { if (o.vR == null) { var v = prizeVis(o.id, o.r, o.tilt || 0); o.vr = v.vr; o.vR = v.vR; o.dy = v.dy; } return o; }
  function restY(x, z, r, items, skip) {
    var me = skip && skip.vR != null ? skip : null, y = FLOOR + r;
    for (var i = 0; i < items.length; i++) {
      var o = items[i]; if (o === skip) continue; var dx = x - o.x, dz = z - o.z, dh = dx * dx + dz * dz;
      if (me && o.vR != null) { var RR = me.vR + o.vR; if (dh < RR * RR) y = Math.max(y, (o.y - o.dy) + Math.sqrt(RR * RR - dh) + me.dy); }
      else { var rr = r + o.r; if (dh < rr * rr) y = Math.max(y, o.y + Math.sqrt(rr * rr - dh)); }
    }
    return y;
  }
  function resettle(items) { for (var pass = 0; pass < 3; pass++) { items.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (o) { o.y = Math.min(o.y, restY(o.x, o.z, o.r, items, o)); }); } }
  // lay the given prizes out: floor first (best-candidate spacing, widest gaps), then on top of the pile if the floor is full
  function scatter(items, rng) {
    var placed = [];
    items.forEach(function (o) { vis(o); });
    items.slice().sort(function (a, b) { return b.vr - a.vr; }).forEach(function (o) {
      var best = null, k, x, z, c;
      for (k = 0; k < 90; k++) {
        x = -AX + o.vr + rng() * (2 * (AX - o.vr)); z = -AZ + o.vr + rng() * (2 * (AZ - o.vr));
        if (inChuteZone(x, z, o.vr)) continue;
        c = 9;
        for (var i = 0; i < placed.length; i++) { var q = placed[i], d = Math.hypot(x - q.x, z - q.z); c = Math.min(c, q.floor ? d - (o.vr + q.vr) : d - (o.vR + q.vR)); }
        if (!best || c > best.c) best = { x: x, z: z, c: c };
      }
      if (best && best.c >= 0.008) { o.x = best.x; o.z = best.z; o.y = FLOOR + o.r; o.floor = true; }
      else { // no room left on the floor: rest it on top, in the lowest spot
        var low = null;
        for (k = 0; k < 90; k++) {
          x = -AX + o.vr + rng() * (2 * (AX - o.vr)); z = -AZ + o.vr + rng() * (2 * (AZ - o.vr)); if (inChuteZone(x, z, o.vr)) continue;
          var y = restY(x, z, o.r, placed, o); if (!low || y < low.y) low = { x: x, z: z, y: y };
        }
        o.x = low.x; o.z = low.z; o.y = low.y; o.floor = low.y <= FLOOR + o.r + 1e-6;
      }
      placed.push(o);
    });
    if (items.some(function (o) { return !o.floor; })) relaxFloor(items, rng);
    return items;
  }
  // the floor is a bit crowded: try nudging everything apart (like shaking the box) so every prize can sit on the floor
  function relaxFloor(items, rng) {
    var P = items.map(function (o) { return { o: o, x: o.floor ? o.x : -AX + o.vr + rng() * (2 * (AX - o.vr)), z: o.floor ? o.z : -AZ + o.vr + rng() * (2 * (AZ - o.vr)) }; }), GAP = 0.006, ok = false;
    function keepIn(q) {
      var r = q.o.vr; q.x = clamp(q.x, -AX + r, AX - r); q.z = clamp(q.z, -AZ + r, AZ - r);
      if (inChuteZone(q.x, q.z, r)) { var ex = (CH.x + CH.h + 0.035 + r) - q.x, ez = q.z - (CH.z - CH.h - 0.035 - r); if (ex < ez) q.x += ex + 0.001; else q.z -= ez + 0.001; }
    }
    for (var it = 0; it < 400 && !ok; it++) {
      ok = true;
      for (var i = 0; i < P.length; i++) for (var j = i + 1; j < P.length; j++) {
        var a = P[i], b = P[j], dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), need = a.o.vr + b.o.vr + GAP;
        if (d < need) { ok = false; if (d < 1e-6) { dx = rng() - 0.5; dz = rng() - 0.5; d = Math.hypot(dx, dz); } var push = (need - d) / 2 + 0.0005; a.x -= dx / d * push; a.z -= dz / d * push; b.x += dx / d * push; b.z += dz / d * push; }
      }
      P.forEach(keepIn);
    }
    if (!ok) return false;
    P.forEach(function (q) { q.o.x = q.x; q.o.z = q.z; q.o.y = FLOOR + q.o.r; q.o.floor = true; });
    return true;
  }
  function overlaps(items) { // pairs whose real shapes would poke into each other (should always be [])
    var out = [];
    for (var i = 0; i < items.length; i++) for (var j = i + 1; j < items.length; j++) {
      var a = vis(items[i]), b = vis(items[j]), dh = Math.hypot(a.x - b.x, a.z - b.z), bothFloor = Math.abs(a.y - a.r - FLOOR) < 0.002 && Math.abs(b.y - b.r - FLOOR) < 0.002;
      var bad = bothFloor ? dh < a.vr + b.vr - 0.002 : Math.hypot(dh, (a.y - a.dy) - (b.y - b.dy)) < a.vR + b.vR - 0.003;
      if (bad) out.push([a.id, b.id, +dh.toFixed(3)]);
    }
    return out;
  }
  function makePile(machine, seed) {
    var cfg = CFG[machine], rng = rngOf(seed), ids = contents(machine), list = [];
    var commons = ids.filter(function (id) { return !prize(id).rare; }), rares = ids.filter(function (id) { return prize(id).rare; });
    commons.forEach(function (id) { list.push(id, id); }); rares.forEach(function (id) { list.push(id); });
    while (list.length < cfg.n) list.push(commons[Math.floor(rng() * commons.length)]);
    list = list.slice(0, cfg.n);
    for (var i = list.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)), t = list[i]; list[i] = list[j]; list[j] = t; }
    var items = list.map(function (id, n) { return { id: id, r: prize(id).r || 0.115, x: 0, z: 0, y: FLOOR, rot: rng() * 6.283, tilt: (rng() - 0.5) * 0.3, uid: machine + n + '_' + seed }; });
    scatter(items, rng);
    resettle(items);
    return items;
  }
  function buried(o, items) { for (var i = 0; i < items.length; i++) { var q = items[i]; if (q === o) continue; if (q.y > o.y + o.r * 0.3 && Math.hypot(q.x - o.x, q.z - o.z) < (q.r + o.r) * 0.85) return true; } return false; }
  function surfaceY(x, z, items) { var y = FLOOR; for (var i = 0; i < items.length; i++) { var o = items[i], dh = Math.hypot(x - o.x, z - o.z); if (dh < o.r) y = Math.max(y, o.y + Math.sqrt(o.r * o.r - dh * dh)); } return y; }
  // where the palm stops when the claw comes down at (hx, hz)
  function stopY(cfg, hx, hz, items) {
    var s = FLOOR + cfg.P * 0.55;
    for (var i = 0; i < items.length; i++) {
      var o = items[i], dh = Math.hypot(hx - o.x, hz - o.z);
      if (dh < o.r * 0.75) s = Math.max(s, o.y + o.r * 0.9);                          // palm lands on top of it
      if (Math.abs(dh - cfg.R * 0.8) < o.r * 0.6) s = Math.max(s, o.y + o.r * 0.5 + cfg.P); // a prong tip lands on it
    }
    return s;
  }

  /* ---------- one play (pure simulation, fixed 1/120 s steps) ---------- */
  function newGame(machine, items, seed) {
    var cfg = CFG[machine];
    return { m: machine, cfg: cfg, items: items, rng: rngOf(seed), phase: 'move', gx: CH.x, gz: CH.z, vx: 0, vz: 0, sx: 0, sz: 0, svx: 0, svz: 0, cy: TOPY, open: 1, held: null, heldA: 0,
      t: 0, timeLeft: cfg.limit, slipAt: -1, falls: [], win: null, slipped: false, grabbed: false, done: false, cy0: TOPY, wait: 0, drop: false };
  }
  function swing(g, ax, az, dt) {
    var k = g.cfg.k, c = g.cfg.c;
    g.svx += (-k * g.sx - c * g.svx - ax) * dt; g.svz += (-k * g.sz - c * g.svz - az) * dt;
    g.sx += g.svx * dt; g.sz += g.svz * dt;
  }
  function drive(g, ix, iz, dt, speed) {
    var l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l; }
    var tvx = ix * speed, tvz = iz * speed, A = 2.4 * dt;
    var nvx = g.vx + clamp(tvx - g.vx, -A, A), nvz = g.vz + clamp(tvz - g.vz, -A, A);
    var nx = g.gx + nvx * dt, nz = g.gz + nvz * dt;
    if (nx < -GX || nx > GX) { nx = clamp(nx, -GX, GX); nvx = 0; }
    if (nz < -GZ || nz > GZ) { nz = clamp(nz, -GZ, GZ); nvz = 0; }
    var ax = (nvx - g.vx) / dt, az = (nvz - g.vz) / dt;
    g.vx = nvx; g.vz = nvz; g.gx = nx; g.gz = nz;
    swing(g, ax, az, dt);
  }
  function headX(g) { return g.gx + g.sx; }
  function headZ(g) { return g.gz + g.sz; }
  function letGo(g) { // the held prize drops from the claw
    var o = g.held; if (!o) return; g.held = null;
    o.x = headX(g); o.z = headZ(g); o.y = g.cy - g.cfg.P + o.r * 0.7;
    g.falls.push({ o: o, vy: 0 });
  }
  function step(g, dt, ix, iz, dropBtn) {
    var cfg = g.cfg; g.t += dt;
    // falling prizes
    for (var f = g.falls.length - 1; f >= 0; f--) {
      var F = g.falls[f], o = F.o; F.vy -= 9.8 * dt; o.y += F.vy * dt;
      var inHole = Math.abs(o.x - CH.x) < CH.h + 0.02 && Math.abs(o.z - CH.z) < CH.h + 0.02;
      if (inHole) { if (o.y < FLOOR - 0.35) { g.falls.splice(f, 1); if (!g.win) g.win = o.id; } continue; }
      if (inChuteZone(o.x, o.z, o.r * 0.5)) { // bounced off the chute wall back onto the pile
        if (o.x - (CH.x + CH.h + 0.035) > (CH.z - CH.h - 0.035) - o.z) o.x = Math.max(o.x, CH.x + CH.h + 0.04 + o.r); else o.z = Math.min(o.z, CH.z - CH.h - 0.04 - o.r);
      }
      o.x = clamp(o.x, -AX + o.r, AX - o.r); o.z = clamp(o.z, -AZ + o.r, AZ - o.r);
      vis(o); var ry = restY(o.x, o.z, o.r, g.items, o);
      if (o.y <= ry) { o.y = ry; g.items.push(o); g.falls.splice(f, 1); resettle(g.items); }
    }
    var hx = headX(g), hz = headZ(g);
    switch (g.phase) {
      case 'move':
        g.timeLeft -= dt; drive(g, ix, iz, dt, cfg.speed);
        if (dropBtn || g.drop || g.timeLeft <= 0) { g.phase = 'drop'; g.timeLeft = Math.max(0, g.timeLeft); g.vx = g.vz = 0; }
        break;
      case 'drop':
        swing(g, 0, 0, dt); g.cy -= 0.55 * dt;
        var s = stopY(cfg, hx, hz, g.items);
        if (g.cy <= s) { g.cy = s; g.phase = 'close'; g.t = 0; }
        break;
      case 'close':
        swing(g, 0, 0, dt); g.open = Math.max(0, 1 - g.t / 0.4);
        if (g.t >= 0.4) {
          var tip = g.cy - cfg.P, best = null;
          g.items.forEach(function (o) {
            var a = Math.hypot(hx - o.x, hz - o.z) / cfg.R, depth = (o.y + o.r) - tip;
            if (a >= cfg.aMax || depth < o.r * 0.3) return;
            if (!best || a < best.a) best = { o: o, a: a, depth: depth };
          });
          if (best) {
            var o2 = best.o, an = best.a / cfg.aMax;
            var p = cfg.grip * (1 - an * an) * Math.sqrt(Math.min(1, best.depth / (0.8 * o2.r))) * (buried(o2, g.items) ? cfg.buried : 1);
            if (g.rng() < p) {
              g.held = o2; g.heldA = an; g.grabbed = true; g.items.splice(g.items.indexOf(o2), 1); resettle(g.items);
              if (g.rng() < cfg.liftSlip[0] + cfg.liftSlip[1] * an * an) g.slipAt = 0.15 + g.rng() * 0.8;
            }
          }
          g.phase = 'lift'; g.t = 0; g.cy0 = g.cy;
        }
        break;
      case 'lift':
        swing(g, 0, 0, dt); g.cy = Math.min(TOPY, g.cy + 0.5 * dt);
        if (g.held && g.slipAt >= 0 && (g.cy - g.cy0) / Math.max(0.01, TOPY - g.cy0) >= g.slipAt) { g.slipped = true; letGo(g); }
        if (g.cy >= TOPY) { g.phase = 'carry'; g.t = 0; }
        break;
      case 'carry':
        var ex = CH.x - g.gx, ez = CH.z - g.gz, el = Math.hypot(ex, ez);
        if (el > 0.004) drive(g, clamp(ex / 0.06, -1, 1), clamp(ez / 0.06, -1, 1), dt, cfg.speed * 0.8);
        else { g.gx = CH.x; g.gz = CH.z; drive(g, 0, 0, dt, 0); g.wait += dt; }
        if (g.held) { var sw = Math.hypot(g.sx, g.sz); if (g.rng() < cfg.carryHaz * (1 + sw / 0.03) * (1 + 2 * g.heldA) * dt) { g.slipped = true; letGo(g); } }
        if (g.wait > 0.35) { g.phase = 'release'; g.t = 0; letGo(g); }
        break;
      case 'release':
        swing(g, 0, 0, dt); g.open = Math.min(1, g.t / 0.3);
        if (g.t > 0.6 && !g.falls.length) { g.phase = 'done'; g.done = true; }
        break;
    }
  }
  function aimBot(g, tx, tz, mode) { // used by simBatch only
    var ex = tx - g.gx, ez = tz - g.gz, ix, iz;
    if (mode === 'skilled') { ix = clamp(ex / 0.06, -1, 1); iz = clamp(ez / 0.06, -1, 1); }
    else { ix = Math.abs(ex) > 0.012 ? Math.sign(ex) : 0; iz = Math.abs(ez) > 0.012 ? Math.sign(ez) : 0; }
    var near = Math.hypot(ex, ez), w = Math.sqrt(g.cfg.k), amp = Math.hypot(g.sx, g.sz) + Math.hypot(g.svx, g.svz) / w;
    var drop = mode === 'skilled' ? (near < 0.006 && amp < 0.012) : near < 0.02;
    return [ix, iz, drop || g.timeLeft < 1.5];
  }
  C.simBatch = function (machine, n, mode, seed0) {
    var cfg = CFG[machine], wins = 0, slips = 0, grabs = 0, rare = 0, tsum = 0; seed0 = seed0 || 1;
    for (var i = 0; i < n; i++) {
      var items = makePile(machine, hash(machine + ':' + (seed0 + i))), r = rngOf(seed0 * 7919 + i), tx, tz;
      if (mode === 'random') { tx = -GX + r() * 2 * GX; tz = -GZ + r() * 2 * GZ; }
      else {
        var cand = items.filter(function (o) { return !buried(o, items); }).sort(function (a, b) { return b.y - a.y; });
        var o = cand[0] || items[0], sd = mode === 'skilled' ? 0.012 : 0.04;
        var gs = function () { return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(6.2832 * r()); };
        tx = clamp(o.x + gs() * sd, -GX, GX); tz = clamp(o.z + gs() * sd, -GZ, GZ);
      }
      var g = newGame(machine, items, seed0 * 104729 + i * 31 + 7), guard = 0;
      while (!g.done && guard++ < 120 * 90) { var inp = g.phase === 'move' ? aimBot(g, tx, tz, mode) : [0, 0, false]; step(g, DT, inp[0], inp[1], inp[2]); }
      if (g.win) { wins++; if (prize(g.win).rare) rare++; } if (g.slipped) slips++; if (g.grabbed) grabs++; tsum += cfg.limit - g.timeLeft;
    }
    return { machine: machine, mode: mode, n: n, wins: wins, rate: +(wins / n).toFixed(3), grabRate: +(grabs / n).toFixed(3), slips: slips, rareWins: rare, avgAimTime: +(tsum / n).toFixed(1) };
  };

  /* ---------- free plays + rotation state ---------- */
  function freeState() { var s = GA.store.get('claw', null), d = dayNum(); if (!s || s.day !== d) s = { day: d, used: { easy: 0, tricky: 0 } }; return s; }
  function freeLeft(m) { return Math.max(0, CFG[m].free - (freeState().used[m] || 0)); }
  function pay(m) {
    var cfg = CFG[m];
    if (freeLeft(m) > 0) { var s = freeState(); s.used[m] = (s.used[m] || 0) + 1; GA.store.set('claw', s); return 'free'; }
    var have = GA.getTickets(); if (have < cfg.cost) return false;
    GA.store.set('tickets', have - cfg.cost); // (not counted as Prize Counter spending)
    if (GA.onTickets) GA.onTickets(have - cfg.cost);
    return 'tickets';
  }
  C.freeLeft = freeLeft;

  /* ---------- 3D: machines in the hub ---------- */
  var M = {}, api = null, flatCache = {}, matLit = null, matBasic = null, lodV = new T.Vector3();
  function flatten(id, lo) { // merge a prize model into <= 2 vertex-coloured meshes (cheap enough for 23 prizes in the machines)
    var ck = id + (lo ? '~lo' : ''); if (flatCache[ck]) return flatCache[ck];
    var model = GA.Prize3D.build(id), lit = [], bas = []; model.updateMatrixWorld(true);
    model.traverse(function (o) {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
      var m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || m.visible === false) return;
      var src = lo && GA.Perf && GA.Perf.lowGeo ? (GA.Perf.lowGeo(o.geometry) || o.geometry) : o.geometry; // far-away copy: fewer segments
      var g2 = src.index ? src.toNonIndexed() : src.clone(); g2.applyMatrix4(o.matrixWorld);
      if (!g2.attributes.normal) g2.computeVertexNormals();
      var col = m.color ? m.color.clone() : new T.Color(1, 1, 1); if (m.emissive && !m.isMeshBasicMaterial) col.add(m.emissive);
      (m.isMeshBasicMaterial ? bas : lit).push({ g: g2, c: col });
    });
    function merge(parts) {
      if (!parts.length) return null; var n = 0; parts.forEach(function (p) { n += p.g.attributes.position.count; });
      var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), k = 0;
      parts.forEach(function (p) { var pa = p.g.attributes.position, na = p.g.attributes.normal; for (var i = 0; i < pa.count; i++, k++) { pos[k * 3] = pa.getX(i); pos[k * 3 + 1] = pa.getY(i); pos[k * 3 + 2] = pa.getZ(i); nor[k * 3] = na.getX(i); nor[k * 3 + 1] = na.getY(i); nor[k * 3 + 2] = na.getZ(i); col[k * 3] = p.c.r; col[k * 3 + 1] = p.c.g; col[k * 3 + 2] = p.c.b; } p.g.dispose(); });
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(nor, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3)); return g;
    }
    var bb = new T.Box3().setFromObject(model), size = bb.getSize(new T.Vector3()), ctr = bb.getCenter(new T.Vector3());
    var hr = 0, hh = 0, br = 0; [lit, bas].forEach(function (L) { L.forEach(function (p) { var pa = p.g.attributes.position; for (var i = 0; i < pa.count; i++) { var dx = pa.getX(i) - ctr.x, dy = pa.getY(i) - ctr.y, dz = pa.getZ(i) - ctr.z, h2 = Math.sqrt(dx * dx + dz * dz); if (h2 > hr) hr = h2; if (Math.abs(dy) > hh) hh = Math.abs(dy); var b3 = Math.sqrt(h2 * h2 + dy * dy); if (b3 > br) br = b3; } }); });
    flatCache[ck] = { lit: merge(lit), bas: merge(bas), size: Math.max(size.x, size.y, size.z) || 1, ctr: ctr, hr: hr, hh: hh, br: br };
    return flatCache[ck];
  }
  function prizeVis(id, r, tilt) { // real size of a prize model in the machine (see scatter)
    var f = flatten(id), s = (2 * r) / f.size * 1.08, ct = Math.cos(tilt || 0), st = Math.abs(Math.sin(tilt || 0));
    var hr = (f.hr * ct + f.hh * st) * s, hh = (f.hh * ct + f.hr * st) * s;
    var vR = f.br * s * 1.02; return { vr: Math.min(hr * 1.02, vR), vR: vR, dy: r - hh };
  }
  function itemMesh(o) {
    vis(o);
    var f = flatten(o.id), g = new T.Group(), rg = new T.Group(), inner = new T.Group(), s = (2 * o.r) / f.size * 1.08;
    if (!matLit) { matLit = new T.MeshLambertMaterial({ vertexColors: true }); matBasic = new T.MeshBasicMaterial({ vertexColors: true }); }
    if (f.lit) inner.add(new T.Mesh(f.lit, matLit)); if (f.bas) inner.add(new T.Mesh(f.bas, matBasic));
    inner.scale.setScalar(s); inner.position.set(-f.ctr.x * s, -f.ctr.y * s, -f.ctr.z * s);
    rg.add(inner);
    var fl = flatten(o.id, true); if (fl.lit !== f.lit) { var lo = new T.Group(); if (fl.lit) lo.add(new T.Mesh(fl.lit, matLit)); if (fl.bas) lo.add(new T.Mesh(fl.bas, matBasic)); lo.scale.copy(inner.scale); lo.position.copy(inner.position); lo.visible = false; rg.add(lo); g.userData.lod = { hi: inner, lo: lo }; } rg.rotation.set(o.tilt || 0, o.rot || 0, 0); rg.position.y = -o.dy; g.add(rg); g.userData.noBatch = true; return g;
  }
  function canvasSign(w, h) { var c = api.mkCanvas(w, h); return { c: c, g: c.getContext('2d'), tex: api.canvasTex(c) }; }
  function drawHeader(mc) {
    var s = mc.head, g = s.g, w = s.c.width, h = s.c.height, cfg = mc.cfg;
    g.fillStyle = '#12062b'; g.fillRect(0, 0, w, h);
    g.strokeStyle = cfg.glow; g.lineWidth = 10; g.strokeRect(6, 6, w - 12, h - 12);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = cfg.glow; g.shadowBlur = 18;
    g.fillStyle = '#ffffff'; g.font = api.font(86, 900); g.fillText(cfg.name.toUpperCase(), w / 2, h * 0.42);
    g.shadowBlur = 0; g.fillStyle = cfg.col2; g.font = api.font(38, 700); g.fillText('\uD83E\uDE9D ' + cfg.blurb, w / 2, h * 0.8);
    s.tex.needsUpdate = true;
  }
  function drawPanel(mc) {
    var s = mc.panel, g = s.g, w = s.c.width, h = s.c.height, cfg = mc.cfg, fl = freeLeft(cfg.id), dl = daysLeft();
    g.fillStyle = '#0b0420'; g.fillRect(0, 0, w, h); g.strokeStyle = cfg.col2; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffe14d'; g.font = api.font(46, 900);
    g.fillText(fl > 0 ? fl + ' FREE PLAY' + (fl > 1 ? 'S' : '') + ' TODAY' : cfg.cost + ' \uD83C\uDFAB PER PLAY', w / 2, h * 0.32);
    g.fillStyle = '#7df9ff'; g.font = api.font(36, 700); g.fillText('New prizes in ' + dl + ' day' + (dl > 1 ? 's' : ''), w / 2, h * 0.72);
    s.tex.needsUpdate = true; mc.panelKey = fl + ':' + dl;
  }
  function buildPile(mc, fresh) {
    var m = mc.cfg.id, p = period();
    if (fresh || !mc.items || mc.period !== p) { mc.refills = mc.period === p ? (mc.refills || 0) + 1 : 0; mc.period = p; mc.items = makePile(m, hash(m + ':' + p + ':' + mc.refills)); }
    while (mc.pileG.children.length) mc.pileG.remove(mc.pileG.children[0]);
    mc.items.forEach(function (o) { o.mesh = itemMesh(o); mc.pileG.add(o.mesh); o.mesh.position.set(o.x, o.y, o.z); });
  }
  function buildMachine(a, m, x, z, rot) {
    var cfg = CFG[m], mc = { cfg: cfg };
    var reg = a.begin('cabinet ' + cfg.name, 'cabinet');
    var g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = rot; reg.add(g); mc.g = g;
    var body = a.lam(cfg.col), trim = a.basic(cfg.glow), dark = a.lam('#1a0b33');
    a.mesh(a.box(1.3, 0.95, 1.1), body, 0, 0.475, 0, g);
    a.mesh(a.box(1.32, 0.05, 1.12), trim, 0, 0.93, 0, g); a.mesh(a.box(1.32, 0.05, 1.12), trim, 0, 0.04, 0, g);
    // prize door (front-left, under the chute) + panel + controls
    a.mesh(a.box(0.34, 0.3, 0.04), dark, CH.x, 0.32, 0.56, g); a.mesh(a.box(0.36, 0.03, 0.05), a.basic(cfg.col2), CH.x, 0.48, 0.56, g);
    mc.panel = canvasSign(512, 200); var pm = a.mesh(a.plane(0.74, 0.29), new T.MeshBasicMaterial({ map: mc.panel.tex }), 0.2, 0.62, 0.552, g);
    a.mesh(a.box(1.3, 0.05, 0.22), dark, 0, 0.97, 0.63, g);
    a.mesh(a.cyl(0.012, 0.012, 0.09, 6), a.basic('#dddddd'), 0.2, 1.03, 0.64, g); a.mesh(a.sph(0.035, 10), a.basic('#ff3b4f'), 0.2, 1.08, 0.64, g);
    a.mesh(a.cyl(0.05, 0.05, 0.03, 14), a.basic('#ff3b4f'), 0.42, 1.0, 0.64, g);
    a.mesh(a.cyl(0.04, 0.04, 0.03, 14), a.basic('#3ff0ff'), -0.06, 1.0, 0.64, g); // SHUFFLE button
    var shl = canvasSign(256, 64); shl.g.fillStyle = '#0b0420'; shl.g.fillRect(0, 0, 256, 64); shl.g.fillStyle = '#3ff0ff'; shl.g.font = api.font(40, 900); shl.g.textAlign = 'center'; shl.g.textBaseline = 'middle'; shl.g.fillText('SHUFFLE', 128, 34); shl.tex.needsUpdate = true;
    var shm = a.mesh(a.plane(0.2, 0.05), new T.MeshBasicMaterial({ map: shl.tex }), -0.06, 0.97, 0.7415, g); a.noAud(shm);
    // glass box + posts + header
    var glass = new T.MeshBasicMaterial({ color: '#cfefff', transparent: true, opacity: 0.1, depthWrite: false, side: T.DoubleSide });
    var fp = a.mesh(a.plane(1.26, 1.28), glass, 0, 1.6, 0.545, g); fp.renderOrder = 4;
    [-1, 1].forEach(function (sd) { var sp = a.mesh(a.plane(1.06, 1.28), glass, sd * 0.645, 1.6, 0, g); sp.rotation.y = Math.PI / 2; sp.renderOrder = 4; });
    a.mesh(a.box(1.26, 1.28, 0.03), a.lam('#24104a'), 0, 1.6, -0.535, g);
    [[-0.63, 0.53], [0.63, 0.53], [-0.63, -0.53], [0.63, -0.53]].forEach(function (p) { a.mesh(a.box(0.05, 1.32, 0.05), trim, p[0], 1.6, p[1], g); });
    a.mesh(a.box(1.3, 0.32, 1.1), body, 0, 2.41, 0, g);
    mc.head = canvasSign(768, 200); var hm = a.mesh(a.plane(1.26, 0.3), new T.MeshBasicMaterial({ map: mc.head.tex }), 0, 2.41, 0.552, g); drawHeader(mc);
    a.mesh(a.box(1.2, 0.02, 1.0), a.basic('#fff6c8'), 0, 2.245, 0, g); // light strip
    // inside: floor, chute, rails
    a.mesh(a.box(1.24, 0.03, 1.04), a.lam(m === 'easy' ? '#1f3d66' : '#3b1a5c'), 0, FLOOR - 0.015, 0, g);
    a.mesh(a.box(CH.h * 2, 0.004, CH.h * 2), a.basic('#000000'), CH.x, FLOOR + 0.003, CH.z, g);
    var acr = new T.MeshBasicMaterial({ color: cfg.glow, transparent: true, opacity: 0.35, depthWrite: false });
    var cw = CH.h * 2 + 0.06, ch = 0.17;
    a.mesh(a.box(0.02, ch, cw), acr, CH.x + CH.h + 0.03, FLOOR + ch / 2, CH.z, g).renderOrder = 3;
    a.mesh(a.box(cw, ch, 0.02), acr, CH.x, FLOOR + ch / 2, CH.z - CH.h - 0.03, g).renderOrder = 3;
    a.mesh(a.box(0.03, 0.03, 1.04), dark, -0.6, RAILY, 0, g); a.mesh(a.box(0.03, 0.03, 1.04), dark, 0.6, RAILY, 0, g);
    mc.bridge = a.mesh(a.box(1.2, 0.035, 0.045), a.lam('#9aa3b5'), 0, RAILY, 0, g);
    mc.cart = a.mesh(a.box(0.1, 0.05, 0.1), a.lam('#c7ccd8'), 0, RAILY - 0.04, 0, g);
    // the claw
    var metal = a.lam('#d7dce6'), claw = new T.Group(); g.add(claw); mc.claw = claw;
    a.mesh(a.cyl(0.05, 0.065, 0.07, 14), metal, 0, 0.035, 0, claw); a.mesh(a.sph(0.03, 8), a.basic(cfg.glow), 0, 0.08, 0, claw);
    mc.prongs = [];
    for (var i = 0; i < 3; i++) {
      var pv = new T.Group(); pv.rotation.y = i * Math.PI * 2 / 3; claw.add(pv);
      var arm = new T.Group(); arm.position.set(0, 0, 0.045); pv.add(arm);
      a.mesh(a.box(0.018, cfg.P, 0.018), metal, 0, -cfg.P / 2, 0, arm);
      var tp = a.mesh(a.box(0.018, 0.05, 0.018), metal, 0, -cfg.P - 0.012, -0.015, arm); tp.rotation.x = 0.7;
      mc.prongs.push(arm);
    }
    mc.cable = a.mesh(a.cyl(0.006, 0.006, 1, 5), a.basic('#444455'), 0, 0, 0, g);
    // aim helpers (only while playing)
    mc.ring = a.mesh(new T.RingGeometry(cfg.R * 0.82, cfg.R, 28), new T.MeshBasicMaterial({ color: cfg.col2, transparent: true, opacity: 0.85, depthWrite: false, side: T.DoubleSide }), 0, 0, 0, g);
    mc.ring.rotation.x = -Math.PI / 2; mc.ring.renderOrder = 5; mc.ring.visible = false;
    mc.laser = a.mesh(a.box(0.006, 1, 0.006), new T.MeshBasicMaterial({ color: '#ff3b4f', transparent: true, opacity: 0.6, depthWrite: false }), 0, 0, 0, g); mc.laser.visible = false; mc.laser.renderOrder = 5;
    mc.pileG = new T.Group(); g.add(mc.pileG); mc.fallG = new T.Group(); g.add(mc.fallG);
    // floor glow + collision
    var gm = new T.MeshBasicMaterial({ map: a.glowTex, color: cfg.glow, transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending });
    var gl = a.mesh(a.plane(1.7, 1.4), gm, 0, 0.025, 1.25, g); gl.rotation.x = -Math.PI / 2; gl.renderOrder = 2; a.noAud(gl);
    a.noAud(mc.ring); a.noAud(mc.laser); a.noAud(mc.cable);
    g.updateMatrixWorld(true);
    var c1 = new T.Vector3(-0.67, 0, -0.57).applyMatrix4(g.matrixWorld), c2 = new T.Vector3(0.67, 0, 0.72).applyMatrix4(g.matrixWorld);
    a.addSolid(Math.min(c1.x, c2.x), Math.max(c1.x, c2.x), Math.min(c1.z, c2.z), Math.max(c1.z, c2.z), 'cabinet ' + cfg.name);
    buildPile(mc); setClawPose(mc, null);
    a.end();
    drawPanel(mc);
    var front = new T.Vector3(0, 0, 1.3).applyMatrix4(g.matrixWorld), dir = new T.Vector3(0, 0, 1).applyQuaternion(g.quaternion).negate();
    mc.cab = { game: { id: 'claw_' + m, name: cfg.name, desc: cfg.blurb, color: cfg.glow }, kind: 'claw', id: 'claw_' + m, machine: m, group: g, x: x, z: z, rot: rot, front: front, dir: dir, glow: gm, nextDraw: Infinity, r: 1.25 };
    a.cabinets.push(mc.cab);
    M[m] = mc;
  }
  function setClawPose(mc, gm) {
    var gx = gm ? gm.gx : CH.x, gz = gm ? gm.gz : CH.z, hx = gm ? headX(gm) : gx, hz = gm ? headZ(gm) : gz, cy = gm ? gm.cy : TOPY, open = gm ? gm.open : 0.15;
    mc.bridge.position.z = gz; mc.cart.position.set(gx, RAILY - 0.04, gz);
    mc.claw.position.set(hx, cy, hz);
    var held = gm && gm.held, th;
    if (open > 0.02 || !held) th = -0.12 + (0.67) * open; else th = Math.asin(clamp((held.r * 0.85 - 0.045) / mc.cfg.P, 0, 0.9));
    if (held && open <= 0.02) th = Math.asin(clamp((held.r * 0.85 - 0.045) / mc.cfg.P, 0, 0.9));
    mc.prongs.forEach(function (arm) { arm.rotation.x = -th; });
    // cable from the cart down to the claw
    var top = new T.Vector3(gx, RAILY - 0.06, gz), bot = new T.Vector3(hx, cy + 0.07, hz), mid = top.clone().add(bot).multiplyScalar(0.5), len = top.distanceTo(bot);
    mc.cable.position.copy(mid); mc.cable.scale.set(1, Math.max(0.001, len), 1);
    mc.cable.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), top.sub(bot).normalize());
    if (held && held.mesh) held.mesh.position.set(hx, cy - mc.cfg.P + held.r * 0.7, hz);
  }
  C.build = function (a) {
    api = a;
    try { buildMachine(a, 'easy', 1.25, 11.2, Math.PI); buildMachine(a, 'tricky', 3.55, 11.2, Math.PI); }
    catch (e) { if (window.console) console.warn('claw build', e); }
    var last = 0, lastT = 0, acc = 0;
    a.anims.push(function (t) {
      var dt = Math.min(0.05, Math.max(0, t - lastT)); lastT = t;
      if (t - last > 3) { last = t; Object.keys(M).forEach(function (k) { var mc = M[k]; if (mc.panelKey !== freeLeft(k) + ':' + daysLeft()) drawPanel(mc); if (!G && mc.period !== period()) buildPile(mc); }); }
      if (t - (C._lodT || 0) > 0.25) { C._lodT = t; var cam = api.camera && api.camera(); if (cam) Object.keys(M).forEach(function (k) { // far away: lighter prize models
        var mc = M[k]; mc.g.getWorldPosition(lodV); var d = lodV.distanceTo(cam.position), far = !(G && cur === k) && !C.isOpen() && (mc.lodFar ? d > 6 : d > 7);
        mc.lodFar = far; mc.items.forEach(function (o) { var L = o.mesh && o.mesh.userData.lod; if (L && L.lo.visible !== far) { L.lo.visible = far; L.hi.visible = !far; } }); }); }
      Object.keys(M).forEach(function (k) { var mc = M[k]; if (!mc.shufAnim) return; mc.shufAnim += dt; var busy = false;
        mc.items.forEach(function (o) { if (!o.mesh || o.dropT == null) return; var q = clamp((mc.shufAnim - o.dropT) / 0.45, 0, 1), e = 1 - q; o.mesh.position.y = o.y + 0.32 * e * e - (q > 0.7 ? Math.sin((q - 0.7) / 0.3 * Math.PI) * 0.012 : 0); if (q < 1) busy = true; else { o.mesh.position.y = o.y; o.dropT = null; } });
        if (!busy) mc.shufAnim = 0; });
      if (G) { acc += dt; var n = 0; while (G && acc >= DT && n++ < 12) { tick(DT); acc -= DT; } if (n >= 12) acc = 0; if (G) render(); } else acc = 0;
    });
  };

  /* ---------- playing ---------- */
  var G = null, cur = null, mode = 'idle', inp = { x: 0, y: 0, keys: {}, drop: false }, ui = null, lastResult = null, cardShown = false;
  function tick(dt) {
    var kx = (inp.keys.r ? 1 : 0) - (inp.keys.l ? 1 : 0), kz = (inp.keys.d ? 1 : 0) - (inp.keys.u ? 1 : 0);
    var ix = clamp(inp.x + kx, -1, 1), iz = clamp(inp.y + kz, -1, 1), wasPhase = G.phase, hadHeld = !!G.held, hadWin = G.win;
    step(G, dt, ix, iz, inp.drop); inp.drop = false;
    if (wasPhase === 'move' && G.phase === 'drop') { snd('drop'); setPlaying(false); }
    if (wasPhase === 'close' && G.phase === 'lift' && G.held) snd('boop');
    if (hadHeld && !G.held && G.phase !== 'release' && G.slipped) snd('miss');
    if (!hadWin && G.win) onWin(G.win);
    if (G.done) finish();
  }
  function render() {
    var mc = M[cur]; if (!mc || !G) return;
    setClawPose(mc, G);
    G.items.forEach(function (o) { if (o.mesh) { if (o.mesh.parent !== mc.pileG) mc.pileG.add(o.mesh); o.mesh.position.set(o.x, o.y, o.z); } });
    G.falls.forEach(function (F) { var o = F.o; if (o.mesh) { o.mesh.position.set(o.x, o.y, o.z); o.mesh.visible = o.y > FLOOR - 0.3; } });
    var show = G.phase === 'move', hx = headX(G), hz = headZ(G);
    mc.ring.visible = mc.laser.visible = show;
    if (show) {
      var sy = surfaceY(hx, hz, G.items) + 0.006; mc.ring.position.set(hx, sy, hz);
      var top = G.cy - 0.01, len = Math.max(0.01, top - sy); mc.laser.position.set(hx, sy + len / 2, hz); mc.laser.scale.set(1, len, 1);
    }
    if (ui) {
      ui.time.textContent = G.phase === 'move' ? Math.ceil(G.timeLeft) + 's' : '';
      ui.time.classList.toggle('low', G.phase === 'move' && G.timeLeft < 6);
      drawRadar();
    }
  }
  function drawRadar() {
    var cv = ui.radar, g = cv.getContext('2d'), w = cv.width, h = cv.height, mc = M[cur], sc = Math.min((w - 12) / (2 * AX), (h - 12) / (2 * AZ));
    function X(x) { return w / 2 + x * sc; } function Z(z) { return h / 2 + z * sc; }
    g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(12,5,30,.85)'; g.fillRect(0, 0, w, h); g.strokeStyle = mc.cfg.glow; g.lineWidth = 2; g.strokeRect(X(-AX), Z(-AZ), 2 * AX * sc, 2 * AZ * sc);
    g.fillStyle = '#000'; g.fillRect(X(CH.x - CH.h), Z(CH.z - CH.h), 2 * CH.h * sc, 2 * CH.h * sc); g.fillStyle = '#7df9ff'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillText('CHUTE', X(CH.x), Z(CH.z) + 3);
    G.items.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (o) { var p = prize(o.id); g.fillStyle = p.rare ? '#ffe14d' : 'rgba(255,255,255,' + (0.35 + clamp((o.y - FLOOR) / 0.4, 0, 0.6)) + ')'; g.beginPath(); g.arc(X(o.x), Z(o.z), o.r * sc, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1; g.stroke(); });
    var hx = headX(G), hz = headZ(G); g.strokeStyle = mc.cfg.col2; g.lineWidth = 3; g.beginPath(); g.arc(X(hx), Z(hz), mc.cfg.R * sc, 0, 7); g.stroke();
    g.strokeStyle = '#ff3b4f'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(hx) - 5, Z(hz)); g.lineTo(X(hx) + 5, Z(hz)); g.moveTo(X(hx), Z(hz) - 5); g.lineTo(X(hx), Z(hz) + 5); g.stroke();
  }
  function snd(n) { if (GA.Audio) GA.Audio.play(n); }
  function onWin(id) {
    var mc = M[cur]; lastResult = { id: id, res: GA.Prog ? GA.Prog.clawWin(id, cur) : { ok: true } };
    snd('best'); if (GA.Hub && GA.Hub.refreshBoards) GA.Hub.refreshBoards();
  }
  function finish() {
    var g = G, mc = M[cur]; G = null;
    var won = g.win, res = lastResult; lastResult = null;
    mc.items = g.items; // the pile keeps what's left
    var removed = []; mc.pileG.children.slice().forEach(function (ch) { if (!mc.items.some(function (o) { return o.mesh === ch; })) removed.push(ch); }); removed.forEach(function (ch) { mc.pileG.remove(ch); });
    if (mc.items.length < 7) buildPile(mc, true);
    setClawPose(mc, null); mc.ring.visible = mc.laser.visible = false; drawPanel(mc);
    if (!won) snd(g.slipped ? 'lose' : 'miss');
    showResult(won, res, g);
  }
  function startPlay() {
    if (!cur || G) return;
    var how = pay(cur); if (!how) { showStart('need'); return; }
    if (GA.Prog && GA.Prog.clawPlay) GA.Prog.clawPlay(cur);
    var mc = M[cur]; if (!mc.items || mc.period !== period()) buildPile(mc, false);
    G = newGame(cur, mc.items, (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0); mc.items = G.items;
    inp.x = inp.y = 0; inp.keys = {}; inp.drop = false;
    hideCard(); setPlaying(true); drawPanel(mc); snd('start');
  }

  /* ---------- SHUFFLE (booth #17): re-scatter the prizes in a machine so none are stuck under or inside each other ---------- */
  var SHUF_CD = 4;
  function shufLeft(m) { var mc = M[m]; return mc && mc.shufAt ? Math.max(0, SHUF_CD - (performance.now() - mc.shufAt) / 1000) : 0; }
  function shufLabel() { var l = cur ? Math.ceil(shufLeft(cur)) : 0; return '\uD83D\uDD00 SHUFFLE' + (l > 0 ? ' (' + l + ')' : ''); }
  function shufTick() {
    if (!ui) return; var b = ui.card.querySelector('[data-act="shuffle"]'); if (!b) return;
    var l = cur ? shufLeft(cur) : 0; b.textContent = shufLabel(); b.disabled = l > 0;
    if (l > 0) setTimeout(shufTick, 250);
  }
  C.shuffle = function (m) {
    m = String(m || cur || '').replace(/^claw_/, ''); var mc = M[m]; if (!mc) return { ok: false, why: 'machine' };
    if (G) return { ok: false, why: 'playing' };
    var left = shufLeft(m); if (left > 0) return { ok: false, why: 'cooldown', left: +left.toFixed(1) };
    if (!mc.items || mc.period !== period()) buildPile(mc);
    mc.shufAt = performance.now(); mc.shufN = (mc.shufN || 0) + 1;
    scatter(mc.items, rngOf(hash(m + ':shuffle:' + mc.shufN + ':' + Date.now()))); resettle(mc.items);
    mc.items.forEach(function (o, i) { if (o.mesh) { if (o.mesh.parent !== mc.pileG) mc.pileG.add(o.mesh); o.mesh.position.set(o.x, o.y + 0.32, o.z); o.dropT = 0.05 * i; } });
    mc.shufAnim = 0.001; snd('click');
    return { ok: true, n: mc.items.length, overlaps: overlaps(mc.items).length };
  };
  C.overlaps = function (m) { var mc = M[m]; return mc ? overlaps(G && cur === m ? G.items : mc.items) : null; };
  C.pileCheck = function (machine, n) { // tests: lots of fresh piles + shuffles, count overlapping pairs and prizes on the floor
    var bad = 0, floor = 0, total = 0, worst = null;
    for (var i = 0; i < (n || 50); i++) { var items = makePile(machine, hash(machine + ':chk:' + i)); if (i % 2) { scatter(items, rngOf(i * 977)); resettle(items); }
      var ov = overlaps(items); bad += ov.length; if (ov.length && !worst) worst = { i: i, ov: ov, items: items.map(function (o) { return [o.id, +o.x.toFixed(3), +o.y.toFixed(3), +o.z.toFixed(3), o.floor, +o.vr.toFixed(3), +o.vR.toFixed(3), +o.dy.toFixed(3)]; }) }; total += items.length; items.forEach(function (o) { if (o.floor) floor++; }); }
    return { piles: n || 50, overlaps: bad, worst: worst, onFloor: +(floor / total).toFixed(2) };
  };

  /* ---------- overlay UI ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ensureUI() {
    if (ui) return ui;
    var d = document.createElement('div'); d.id = 'clawUI'; d.className = 'hidden';
    d.innerHTML = '<div class="clTop"><b id="clName"></b><span id="clInfo"></span><span id="clTime"></span></div>' +
      '<canvas id="clRadar" width="150" height="124"></canvas>' +
      '<div id="clPad" class="clCtl"><div id="clKnob"></div><span class="clArr u">\u25B2</span><span class="clArr d">\u25BC</span><span class="clArr l">\u25C0</span><span class="clArr r">\u25B6</span></div>' +
      '<button id="clDrop" class="clCtl" type="button">DROP</button>' +
      '<button id="clExit" type="button" aria-label="Leave the claw machine">\u2715</button>' +
      '<div id="clCard" class="clCard"></div>';
    document.body.appendChild(d);
    ui = { el: d, name: $('clName'), info: $('clInfo'), time: $('clTime'), radar: $('clRadar'), pad: $('clPad'), knob: $('clKnob'), drop: $('clDrop'), exit: $('clExit'), card: $('clCard') };
    var padId = null;
    function padMove(e) { var r = ui.pad.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width / 2 - 10, dx = (e.clientX - cx) / R, dy = (e.clientY - cy) / R, l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } if (l < 0.12) dx = dy = 0; inp.x = dx; inp.y = dy; ui.knob.style.transform = 'translate(' + (dx * R * 0.7) + 'px,' + (dy * R * 0.7) + 'px)'; }
    function padEnd() { padId = null; inp.x = inp.y = 0; ui.knob.style.transform = ''; }
    ui.pad.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); padId = e.pointerId; try { ui.pad.setPointerCapture(e.pointerId); } catch (x) {} padMove(e); });
    ui.pad.addEventListener('pointermove', function (e) { if (e.pointerId === padId) { e.preventDefault(); padMove(e); } });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { ui.pad.addEventListener(ev, function (e) { if (e.pointerId === padId) padEnd(); }); });
    ui.drop.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); if (G && G.phase === 'move') inp.drop = true; });
    ui.exit.addEventListener('click', function () { if (!G) C.close(); });
    ['touchstart', 'touchmove'].forEach(function (ev) { d.addEventListener(ev, function (e) { if (e.target.closest && e.target.closest('.clCtl')) e.preventDefault(); }, { passive: false }); });
    d.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    ui.card.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-act]'); if (!b) return; var act = b.getAttribute('data-act'); snd('click');
      if (act === 'play') startPlay();
      else if (act === 'leave') C.close();
      else if (act === 'again') showStart();
      else if (act === 'shuffle') { if (C.shuffle(cur).ok) shufTick(); }
      else if (act === 'view') { var id = b.getAttribute('data-id'); if (GA.PV && GA.PV.open) { var prev = GA.PV.onClose; GA.PV.onClose = function () { GA.PV.onClose = prev; if (prev) prev(); }; GA.PV.open(id, [id]); } }
    });
    window.addEventListener('keydown', function (e) {
      if (!C.isOpen() || (GA.PV && GA.PV.isOpen())) return;
      var k = e.key, m = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd' }[k];
      if (m) { inp.keys[m] = true; e.preventDefault(); e.stopPropagation(); return; }
      if (k === ' ' || k === 'Enter') { e.preventDefault(); e.stopPropagation(); if (G && G.phase === 'move') inp.drop = true; else if (!G && cardShown) { var p = ui.card.querySelector('[data-act="play"]:not([disabled])') || ui.card.querySelector('[data-act="again"]'); if (p) p.click(); } return; }
      if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); if (!G) C.close(); }
    }, true);
    window.addEventListener('keyup', function (e) { var m = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd' }[e.key]; if (m) inp.keys[m] = false; }, true);
    return ui;
  }
  function setPlaying(on) { ui.el.classList.toggle('playing', !!on); }
  function hideCard() { cardShown = false; ui.card.classList.add('hidden'); ui.exit.classList.add('hidden'); }
  function infoLine() { var cfg = CFG[cur], fl = freeLeft(cur); return fl > 0 ? fl + ' free play' + (fl > 1 ? 's' : '') + ' left today' : cfg.cost + ' \uD83C\uDFAB per play \u00b7 you have ' + GA.getTickets(); }
  function showStart(why) {
    var cfg = CFG[cur], fl = freeLeft(cur), have = GA.getTickets(), can = fl > 0 || have >= cfg.cost, dl = daysLeft();
    ui.name.textContent = cfg.name; ui.info.textContent = infoLine(); ui.time.textContent = '';
    var ids = contents(cur), own = GA.Prog ? GA.Prog.owns : function () { return false; };
    var h = '<div class="clT">\uD83E\uDE9D ' + esc(cfg.name.toUpperCase()) + '</div><div class="clSub">' + esc(cfg.blurb) + (cur === 'tricky' ? ' \u00b7 let the swing settle before you drop!' : ' \u00b7 great for beginners') + '</div>' +
      '<div class="clLine">' + ids.map(function (id) { var p = prize(id), o = own(id); return '<div class="clPz' + (o ? ' own' : '') + (p.rare ? ' rare' : '') + '" title="' + esc(p.name) + '"><img alt="" src="' + GA.PrizeArt.url(id, 96) + '"><span>' + esc(p.name) + '</span>' + (o ? '<i>\u2714</i>' : '') + (p.rare ? '<em>RARE</em>' : '') + '</div>'; }).join('') + '</div>' +
      '<div class="clRot">\uD83D\uDD04 New prizes in ' + dl + ' day' + (dl > 1 ? 's' : '') + '</div>' +
      '<div class="clCost">' + (fl > 0 ? '\uD83C\uDF81 ' + fl + ' FREE play' + (fl > 1 ? 's' : '') + ' left today' : cfg.cost + ' \uD83C\uDFAB per play \u00b7 you have ' + have) + '</div>' +
      (why === 'need' || !can ? '<div class="clNeed">You need ' + (cfg.cost - have) + ' more ticket' + (cfg.cost - have > 1 ? 's' : '') + '. Win some in the games!</div>' : '') +
      '<div class="clHow">Steer with the pad (or arrow keys), then hit DROP. Line the ring up over a prize!</div>' +
      '<div class="clBtns"><button type="button" class="clBtn" data-act="play"' + (can ? '' : ' disabled') + '>' + (fl > 0 ? 'PLAY FREE' : 'PLAY \u00b7 ' + cfg.cost + ' \uD83C\uDFAB') + '</button>' + '<button type="button" class="clBtn shuf" data-act="shuffle">' + shufLabel() + '</button>' + '<button type="button" class="clBtn ghost" data-act="leave">LEAVE</button></div>';
    ui.card.innerHTML = h; ui.card.classList.remove('hidden'); ui.exit.classList.remove('hidden'); cardShown = true; setPlaying(false);
  }
  function showResult(won, res, g) {
    ui.info.textContent = infoLine(); ui.time.textContent = '';
    var h;
    if (won) {
      var p = prize(won), dupe = res && res.res && res.res.dupe;
      h = '<div class="clT win">\uD83C\uDF89 YOU WON!</div><div class="clWin"><img alt="" src="' + GA.PrizeArt.url(won, 160) + '"><b>' + esc(p.name) + '</b>' + (p.rare ? '<em>RARE</em>' : '') + '</div>' +
        '<div class="clSub">' + (dupe ? 'You already had this one, so here are +2 bonus tickets!' : 'It\u2019s on your shelf in the Achievement Gallery. Tap VIEW 3D to see it, or carry it around!') + '</div>' +
        '<div class="clBtns"><button type="button" class="clBtn" data-act="view" data-id="' + esc(won) + '">VIEW 3D</button><button type="button" class="clBtn" data-act="again">PLAY AGAIN</button>' + '<button type="button" class="clBtn shuf" data-act="shuffle">' + shufLabel() + '</button>' + '<button type="button" class="clBtn ghost" data-act="leave">DONE</button></div>';
    } else {
      h = '<div class="clT">' + (g.slipped ? '\uD83D\uDE2E It slipped!' : g.grabbed ? '\uD83D\uDE2E So close!' : '\uD83D\uDE45 Missed!') + '</div>' +
        '<div class="clSub">' + (g.slipped ? (cur === 'tricky' ? 'The Tricky Claw has a weak grip. Center the ring on a prize and let the claw stop swinging first.' : 'Almost! Try to center the ring right over the prize.') : 'Line the ring up right over a prize that isn\u2019t buried under others.') + '</div>' +
        '<div class="clBtns"><button type="button" class="clBtn" data-act="again">PLAY AGAIN</button>' + '<button type="button" class="clBtn shuf" data-act="shuffle">' + shufLabel() + '</button>' + '<button type="button" class="clBtn ghost" data-act="leave">DONE</button></div>';
    }
    ui.card.innerHTML = h; ui.card.classList.remove('hidden'); ui.exit.classList.remove('hidden'); cardShown = true; setPlaying(false);
  }
  function camFn() {
    var mc = M[cur]; if (!mc) return null;
    var cam = api.camera(), asp = cam && cam.aspect || 0.5, fov = (cam && cam.fov || 60) * Math.PI / 180, hf = 2 * Math.atan(Math.tan(fov / 2) * asp);
    var d = Math.max(1.7, 0.66 / Math.tan(hf / 2), 0.95 / Math.tan(fov / 2)), tg = new T.Vector3(0, 1.55, 0.02), cp = tg.clone().add(new T.Vector3(0, 0.42, 0.9).multiplyScalar(d));
    mc.g.localToWorld(tg); mc.g.localToWorld(cp);
    return [cp.x, cp.y, cp.z, tg.x, tg.y, tg.z];
  }
  C.open = function (id) {
    var m = String(id || '').replace(/^claw_/, ''); if (!M[m] || C.isOpen()) return false;
    ensureUI(); cur = m; mode = 'open';
    var mc = M[m]; if (mc.period !== period()) buildPile(mc);
    if (GA.Hub) {
      GA.Hub.setLock(true); GA.Hub.setCamOverride(camFn);
      var sp = new T.Vector3(0.6, 0, 1.3).applyMatrix4(mc.g.matrixWorld); GA.Hub.setPlayer(sp.x, sp.z); if (GA.Hub.setFace) GA.Hub.setFace(Math.atan2(-mc.cab.dir.x, -mc.cab.dir.z));
    }
    document.body.classList.add('clawOn'); ui.el.classList.remove('hidden'); ui.el.style.setProperty('--cc', mc.cfg.glow); ui.el.style.setProperty('--cc2', mc.cfg.col2);
    showStart(); snd('open');
    return true;
  };
  C.close = function () {
    if (!C.isOpen() || G) return false;
    mode = 'idle'; ui.el.classList.add('hidden'); document.body.classList.remove('clawOn');
    if (GA.Hub) { GA.Hub.setCamOverride(null); GA.Hub.setLock(false); }
    var m = cur; cur = null; inp.x = inp.y = 0; inp.keys = {};
    if (M[m]) drawPanel(M[m]);
    snd('menu'); if (C.onClose) C.onClose();
    return true;
  };
  C.isOpen = function () { return mode === 'open'; };
  C.promptInfo = function (cabId) {
    var m = String(cabId || '').replace(/^claw_/, ''), cfg = CFG[m]; if (!cfg) return null;
    var fl = freeLeft(m), dl = daysLeft();
    return { name: cfg.name, desc: cfg.blurb + '. ' + (fl > 0 ? fl + ' free play' + (fl > 1 ? 's' : '') + ' left today' : cfg.cost + ' tickets per play (you have ' + GA.getTickets() + ')') + '. New prizes in ' + dl + ' day' + (dl > 1 ? 's' : '') + '!' };
  };

  /* ---------- test / debug hooks ---------- */
  C.state = function () {
    var g = G, mc = cur && M[cur];
    return { open: C.isOpen(), machine: cur, playing: !!g, phase: g ? g.phase : null, gx: g ? +g.gx.toFixed(3) : null, gz: g ? +g.gz.toFixed(3) : null, hx: g ? +headX(g).toFixed(3) : null, hz: g ? +headZ(g).toFixed(3) : null,
      swing: g ? +Math.hypot(g.sx, g.sz).toFixed(4) : 0, held: g && g.held ? g.held.id : null, timeLeft: g ? +g.timeLeft.toFixed(1) : null, card: !!(ui && cardShown),
      free: { easy: freeLeft('easy'), tricky: freeLeft('tricky') }, period: period(), daysLeft: daysLeft(), contents: { easy: contents('easy'), tricky: contents('tricky') },
      overlaps: mc ? overlaps(g ? g.items : mc.items).length : null, shuffleLeft: mc ? +shufLeft(cur).toFixed(1) : 0,
      pile: mc ? (g ? g.items : mc.items).map(function (o) { return { id: o.id, floor: !!o.floor, vr: +(o.vr || 0).toFixed(3), x: +o.x.toFixed(3), z: +o.z.toFixed(3), y: +o.y.toFixed(3), r: o.r, buried: buried(o, g ? g.items : mc.items) }; }) : null,
      pileIds: { easy: M.easy ? M.easy.items.map(function (o) { return o.id; }) : [], tricky: M.tricky ? M.tricky.items.map(function (o) { return o.id; }) : [] } };
  };
  C.setDayOffset = function (n) { C._dayOffset = +n || 0; Object.keys(M).forEach(function (k) { if (M[k].period !== period() && !(G && cur === k)) buildPile(M[k]); drawPanel(M[k]); }); return period(); };
  C.toScreen = function (lx, ly, lz) { var mc = M[cur]; if (!mc) return null; var v = new T.Vector3(lx, ly, lz); mc.g.localToWorld(v); return GA.Hub.toScreen ? GA.Hub.toScreen(v.x, v.y, v.z) : null; };
  C.machines = function () { return Object.keys(M).map(function (k) { return { id: k, x: M[k].cab.x, z: M[k].cab.z, front: [M[k].cab.front.x, M[k].cab.front.z] }; }); };
})();
