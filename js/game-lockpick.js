/* Grok Arcade - bonus game #20: Lockpick Panic (Secret Basement tie-in) + GA.LockCore, the pin-tumbler lock the basement door uses too.
   Each lock has pins. The active pin bobs up and down as you rake it; TAP when its gap lines up with the green SHEAR LINE to set it.
   Dead center = PERFECT. A miss strains your pick (3 strains = it snaps = lose a pick). Every lock has a timer. 3 picks.
   Locks get more pins and faster pins; every 4th lock is a shaky GOLD master lock worth extra. */
(function () {
  'use strict';
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  /* ---------- the lock itself (shared) ---------- */
  function LockCore() {
    var L = { pins: [], cur: 0, t: 0, strain: 0, maxStrain: 3, speed: 1, win: 0.12, gold: false, open: false, flash: 0, msg: null, msgT: 0, shake: 0, popT: 0 };
    L.reset = function (n, speed, win, gold) { L.pins = []; for (var i = 0; i < n; i++) L.pins.push({ set: false, ph: Math.random() * 6.28, sp: speed * (0.85 + Math.random() * 0.35), y: 0, cut: 0.25 + Math.random() * 0.4 }); L.cur = 0; L.strain = 0; L.open = false; L.gold = !!gold; L.speed = speed; L.win = win; L.popT = 0; };
    L.pinY = function (p) { // 0 = resting low, 1 = pushed all the way up. Triangle wave (fair + readable), gold locks wobble the speed.
      var ph = p.ph + L.t * p.sp * (L.gold ? 1 + 0.45 * Math.sin(L.t * 2.3 + p.cut * 9) : 1), q = (ph / Math.PI) % 2; return q < 1 ? q : 2 - q; };
    L.update = function (dt) { L.t += dt; L.pins.forEach(function (p, i) { p.y = p.set ? p.cut : i === L.cur ? L.pinY(p) : 0.04; }); if (L.msgT > 0) L.msgT -= dt; if (L.flash > 0) L.flash -= dt; if (L.shake > 0) L.shake -= dt; if (L.open) L.popT += dt; };
    // the pin's gap is at height p.y - p.cut + 0.7: aligned when p.y == p.cut (we draw the shear line at the gap's target spot)
    L.tap = function () { if (L.open || !L.pins.length) return null; var p = L.pins[L.cur], off = Math.abs(p.y - p.cut);
      if (off <= L.win) { p.set = true; var perfect = off <= L.win * 0.35; L.cur++; L.msg = [perfect ? 'PERFECT!' : 'CLICK!', perfect ? '#ffe14d' : '#4ade80']; L.msgT = 0.7; if (L.cur >= L.pins.length) { L.open = true; L.flash = 0.6; } return { hit: true, perfect: perfect, open: L.open }; }
      L.strain++; L.shake = 0.3; L.msg = [p.y > p.cut ? 'Too high!' : 'Too low!', '#ff6b6b']; L.msgT = 0.7; return { hit: false, snapped: L.strain >= L.maxStrain }; };
    L.draw = function (c, x0, y0, W, H) {
      var n = L.pins.length || 1, gold = L.gold, sx = L.shake > 0 ? (Math.random() - 0.5) * 8 : 0; c.save(); c.translate(x0 + sx, y0);
      // lock body
      var body = c.createLinearGradient(0, 0, 0, H); body.addColorStop(0, gold ? '#ffe9a0' : '#d9b46a'); body.addColorStop(1, gold ? '#b8860b' : '#8a6a2a'); c.fillStyle = body; rr(c, 0, 0, W, H, 22); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 4; c.stroke();
      var shear = H * 0.46, plugTop = shear, plugH = H * 0.36, colW = W / (n + 1.2), pw = Math.min(46, colW * 0.62);
      c.fillStyle = '#5a4520'; rr(c, W * 0.04, plugTop, W * 0.92, plugH, 12); c.fill(); // the plug
      c.fillStyle = '#3a2c12'; rr(c, W * 0.04, plugTop + plugH * 0.68, W * 0.92, plugH * 0.18, 6); c.fill(); // keyway
      // shear line
      c.fillStyle = 'rgba(74,222,128,.25)'; c.fillRect(W * 0.04, shear - H * 0.035, W * 0.92, H * 0.07); c.strokeStyle = '#4ade80'; c.lineWidth = 3; c.setLineDash([10, 8]); c.beginPath(); c.moveTo(W * 0.04, shear); c.lineTo(W * 0.96, shear); c.stroke(); c.setLineDash([]);
      L.pins.forEach(function (p, i) {
        var cx = colW * (i + 0.8), act = i === L.cur && !L.open, travel = H * 0.3, gapY = shear + (p.cut - p.y) * travel; // when p.y==p.cut the gap sits on the shear line
        c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, cx - pw / 2 - 5, H * 0.04, pw + 10, plugTop + plugH * 0.64 - H * 0.04, 8); c.fill(); // pin chamber
        // spring
        c.strokeStyle = '#c9ced8'; c.lineWidth = 3; c.beginPath(); var top = H * 0.06, sb = gapY - H * 0.2; for (var k = 0; k <= 8; k++) { var yy = top + (sb - top) * k / 8; c.lineTo(cx + (k % 2 ? pw * 0.32 : -pw * 0.32), yy); } c.stroke();
        // driver pin (silver, above the gap) + key pin (colored, below)
        var dg = c.createLinearGradient(cx - pw / 2, 0, cx + pw / 2, 0); dg.addColorStop(0, '#9aa1ad'); dg.addColorStop(0.5, '#f1f4f8'); dg.addColorStop(1, '#8a919c'); c.fillStyle = dg; rr(c, cx - pw / 2, sb, pw, gapY - sb - 2, 6); c.fill();
        c.fillStyle = p.set ? '#4ade80' : act ? (gold ? '#ff4fd8' : '#3ff0ff') : '#7c6a9a'; rr(c, cx - pw / 2, gapY + 2, pw, H * (0.16 + p.cut * 0.3), 6); c.fill();
        c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(cx - pw / 2 + 5, gapY + 6, 5, H * 0.1);
        if (act) { c.strokeStyle = '#ffe14d'; c.lineWidth = 3; rr(c, cx - pw / 2 - 7, H * 0.02, pw + 14, H * 0.84, 10); c.stroke(); }
      });
      // the pick (rakes under the active pin)
      if (!L.open && L.pins.length) { var ap = L.pins[L.cur], px = colW * (L.cur + 0.8), py = plugTop + plugH * 0.62 - (ap.y - 0.04) * H * 0.05; c.strokeStyle = L.strain >= L.maxStrain - 1 ? '#ff6b6b' : '#e5e7eb'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(W + 30, plugTop + plugH * 0.78); c.lineTo(px + 14, py + 8); c.lineTo(px, py); c.stroke(); c.lineCap = 'butt'; }
      // strain meter
      for (var s2 = 0; s2 < L.maxStrain; s2++) { c.fillStyle = s2 < L.strain ? '#ff3d3d' : 'rgba(0,0,0,.3)'; rr(c, W * 0.06 + s2 * 34, H * 0.9, 28, 12, 5); c.fill(); }
      if (L.open) { c.fillStyle = 'rgba(74,222,128,' + Math.max(0, 0.6 - L.popT) + ')'; rr(c, 0, 0, W, H, 22); c.fill(); }
      c.restore();
    };
    return L;
  }
  GA.LockCore = { make: LockCore };

  /* ---------- bonus game #20 ---------- */
  var U = GA.MG.U;
  GA.MG.register({
    id: 'lockpick', name: 'Lockpick Panic', ticketDiv: 3,
    howTouch: 'The glowing pin bobs up and down. TAP anywhere when its gap lines up with the green SHEAR LINE to set it. Set every pin to open the lock before the timer runs out! A miss strains your pick (3 = it snaps). Dead center = PERFECT. Gold master locks wobble! 3 picks.',
    howKeys: 'The glowing pin bobs up and down. Press SPACE (or click) when its gap lines up with the green SHEAR LINE to set it. Set every pin to open the lock before the timer runs out! A miss strains your pick (3 = it snaps). Dead center = PERFECT. Gold master locks wobble! 3 picks.',
    create: function (api) {
      var L = LockCore(), picks, locks, timer, tmax, pops, msg, msgT, nextT, combo;
      function newLock() { var n = Math.min(5, 3 + Math.floor(locks / 2)), gold = locks > 0 && (locks + 1) % 4 === 0, sp = Math.min(4.2, 1.5 + locks * 0.22), win = Math.max(0.065, 0.13 - locks * 0.007);
        L.reset(n, sp, win, gold); tmax = Math.max(7, 13 - locks * 0.4) + (gold ? 3 : 0); timer = tmax; nextT = 0; }
      function say(s, col) { msg = [s, col]; msgT = 1.1; }
      function lose(why) { picks--; api.sfx('lifelost'); say(why, '#ff6b6b'); combo = 0; if (picks <= 0) { api.gameOver(); return; } L.strain = 0; if (why === 'Out of time!') newLock(); }
      function tap() { if (!api.playing || nextT > 0) return; var r = L.tap(); if (!r) return;
        if (r.hit) { combo++; api.addScore(1 + (r.perfect ? 1 : 0)); api.sfx(r.perfect ? 'perfect' : 'point'); if (r.perfect) pops.push({ x: api.W / 2, y: api.H * 0.3, t: 0, s: 'PERFECT +2', c: '#ffe14d' });
          if (r.open) { var bonus = 5 + Math.ceil(timer) + (L.gold ? 10 : 0); api.addScore(bonus); locks++; say((L.gold ? 'GOLD LOCK! ' : 'UNLOCKED! ') + '+' + bonus, L.gold ? '#ffd23f' : '#4ade80'); api.sfx('win'); nextT = 0.9; } }
        else { api.sfx('bad'); if (r.snapped) lose('SNAP! Pick broke!'); } }
      return {
        reset: function () { picks = 3; locks = 0; pops = []; msg = null; msgT = 0; combo = 0; newLock(); },
        start: function () {},
        update: function (dt) { L.update(dt); if (msgT > 0) msgT -= dt; pops.forEach(function (p) { p.t += dt; }); pops = pops.filter(function (p) { return p.t < 0.9; });
          if (nextT > 0) { nextT -= dt; if (nextT <= 0) newLock(); return; }
          if (api.playing) { timer -= dt; if (timer <= 0) { timer = 0; lose('Out of time!'); } } },
        draw: function (c) { var W = api.W, H = api.H;
          var bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1a0f2e'); bg.addColorStop(1, '#0b0618'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
          // brick wall texture
          c.fillStyle = 'rgba(120,50,40,.18)'; for (var y = 0; y < H; y += 28) for (var x = -((y / 28) % 2) * 30; x < W; x += 60) c.fillRect(x + 2, y + 2, 56, 24);
          var lw = Math.min(W * 0.9, 480), lh = Math.min(H * 0.48, 380), lx = (W - lw) / 2, ly = H * 0.2; L.draw(c, lx, ly, lw, lh);
          // HUD: lock #, picks, timer bar
          U.text(c, 'LOCK ' + (locks + 1) + (L.gold ? '  \u2605 GOLD' : ''), W / 2, ly - 30, 22, L.gold ? '#ffd23f' : '#ffffff', 'center', L.gold ? '#ffd23f' : null);
          for (var i = 0; i < 3; i++) U.text(c, i < picks ? '\uD83D\uDD27' : '\u2716', W / 2 - 40 + i * 40, ly + lh + 34, 26, i < picks ? '#fff' : '#555');
          var tb = ly + lh + 66, tw = lw * Math.max(0, timer / tmax); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(lx, tb, lw, 12); c.fillStyle = timer < 3 ? '#ff3d3d' : '#4ade80'; c.fillRect(lx, tb, tw, 12);
          if (L.msgT > 0 && L.msg) U.text(c, L.msg[0], W / 2, ly + lh * 0.2, 30, L.msg[1], 'center', L.msg[1]);
          if (msgT > 0 && msg) U.text(c, msg[0], W / 2, ly + lh + 110, 26, msg[1], 'center', msg[1]);
          pops.forEach(function (p) { c.globalAlpha = 1 - p.t / 0.9; U.text(c, p.s, p.x, p.y - p.t * 40, 20, p.c); c.globalAlpha = 1; });
          U.text(c, api.touch ? 'TAP when the gap hits the green line' : 'SPACE when the gap hits the green line', W / 2, H - 30 - api.padH, 15, 'rgba(255,255,255,.6)');
        },
        onDown: function () { tap(); }, onKey: function (k, down) { if (down && (k === ' ' || k === 'Space' || k === 'Enter' || k === 'ArrowUp')) tap(); },
        // test hooks
        _L: L, _state: function () { return { picks: picks, locks: locks, timer: timer, cur: L.cur, pins: L.pins.length, gold: L.gold }; }, _tapPerfect: function () { var p = L.pins[L.cur]; if (p) { p.y = p.cut; } tap(); }
      };
    }
  });
})();
