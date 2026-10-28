/* Grok Arcade — RETRO CENTRAL (1995) Playable CRT & Kiosk Copycat Games (Issue #88)
   1. Super Torty 64 (1995 N64 / Mario 64 copycat — 3D perspective courtyard, triple jump, Goomba-Bots, 5 Power Stars)
   2. Speed Rat 1991: Green Hill (1991 Sega Genesis / Sonic 1 copycat — loops, golden rings, springs, Dr. Egg-Rat)
   3. Speed Rat 2: Spin Dash (1992-1995 Sonic 2 copycat — Chemical Zone, Spin-Dash turbo, sidekick Squeaks)
   4. 8-Bit Plumber Bros. '85 (1983-1991 NES/SNES Mario copycat — ? blocks, Super Cheese, pipes, flagpole)
   5. Polygonal Shell Fighter '95 (1995 Tortuga DreamBox 32X-CD — flat-shaded 3D polygon ring fighter)
   6. Wireframe Cyber-Maze '95 (1995 Ratita Virtual-Visor 95 — Red-LED stereoscopic vector tank shooter)
*/
(function () {
  'use strict';
  var RC = window.RC95 = window.RC95 || {};

  var canvas = null, ctx = null;
  var activeGameId = null;
  var rafId = 0;
  var keys = { left: false, right: false, up: false, down: false, jump: false, action: false };
  var justPressed = { jump: false, action: false };
  var gs = null;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  RC.setGameInput = function (k, isDown) {
    if (isDown && !keys[k]) {
      if (k === 'jump') justPressed.jump = true;
      if (k === 'action') justPressed.action = true;
    }
    keys[k] = !!isDown;
  };

  function bindKeys() {
    window.addEventListener('keydown', function (e) {
      if (!activeGameId) return;
      var c = e.code || e.key;
      if (c === 'ArrowLeft' || c === 'KeyA') { RC.setGameInput('left', true); e.preventDefault(); }
      else if (c === 'ArrowRight' || c === 'KeyD') { RC.setGameInput('right', true); e.preventDefault(); }
      else if (c === 'ArrowUp' || c === 'KeyW') { RC.setGameInput('up', true); e.preventDefault(); }
      else if (c === 'ArrowDown' || c === 'KeyS') { RC.setGameInput('down', true); e.preventDefault(); }
      else if (c === 'Space' || c === 'KeyZ') { RC.setGameInput('jump', true); e.preventDefault(); }
      else if (c === 'KeyX' || c === 'ShiftLeft' || c === 'ShiftRight') { RC.setGameInput('action', true); e.preventDefault(); }
    });
    window.addEventListener('keyup', function (e) {
      if (!activeGameId) return;
      var c = e.code || e.key;
      if (c === 'ArrowLeft' || c === 'KeyA') RC.setGameInput('left', false);
      else if (c === 'ArrowRight' || c === 'KeyD') RC.setGameInput('right', false);
      else if (c === 'ArrowUp' || c === 'KeyW') RC.setGameInput('up', false);
      else if (c === 'ArrowDown' || c === 'KeyS') RC.setGameInput('down', false);
      else if (c === 'Space' || c === 'KeyZ') RC.setGameInput('jump', false);
      else if (c === 'KeyX' || c === 'ShiftLeft' || c === 'ShiftRight') RC.setGameInput('action', false);
    });
  }
  bindKeys();

  /* ======================================================================
     1. SUPER TORTY 64 (1995 Nintortuga 64 — Mario 64 Copycat)
     ====================================================================== */
  function initTorty64() {
    gs = {
      t: 0,
      px: 0,
      pz: -60,
      py: 0,
      vy: 0,
      vx: 0,
      vz: 0,
      facing: 0,
      jumpCombo: 0,
      comboTimer: 0,
      spinTimer: 0,
      stars: 0,
      coins: 0,
      score: 0,
      bannerTimer: 90,
      bannerText: 'COURSE 1: CASTLE COURTYARD · COLLECT 5 POWER STARS!',
      starList: [
        { x: -130, z: 30, y: 18, got: false, label: 'Courtyard Pillar Star' },
        { x: 135, z: 40, y: 18, got: false, label: 'Fountain Garden Star' },
        { x: 0, z: 145, y: 42, got: false, label: 'Castle Balcony Star' },
        { x: -95, z: 195, y: 24, got: false, label: 'Tower Top Star' },
        { x: 105, z: 190, y: 24, got: false, label: 'King Bob-Rat Star' }
      ],
      coinList: [],
      baddies: [
        { x: -65, z: 60, vx: 0.9, alive: true },
        { x: 70, z: 85, vx: -1.0, alive: true },
        { x: 0, z: 120, vx: 1.1, alive: true }
      ]
    };
    for (var i = 0; i < 16; i++) {
      var ang = (i / 16) * Math.PI * 2;
      gs.coinList.push({
        x: Math.cos(ang) * 95,
        z: 75 + Math.sin(ang) * 65,
        got: false
      });
    }
  }

  function updateAndDrawTorty64(W, H) {
    gs.t++;
    var spd = 2.8;
    var ax = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    var az = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
    if (ax !== 0 || az !== 0) {
      var len = Math.hypot(ax, az) || 1;
      gs.vx = (ax / len) * spd;
      gs.vz = (az / len) * spd;
      gs.facing = Math.atan2(gs.vx, gs.vz);
    } else {
      gs.vx *= 0.78;
      gs.vz *= 0.78;
    }

    gs.px = clamp(gs.px + gs.vx, -210, 210);
    gs.pz = clamp(gs.pz + gs.vz, -110, 240);

    if (gs.comboTimer > 0) gs.comboTimer--;
    else if (gs.py === 0) gs.jumpCombo = 0;

    if (justPressed.jump && gs.py <= 1) {
      gs.jumpCombo = (gs.jumpCombo % 3) + 1;
      gs.vy = gs.jumpCombo === 3 ? 11.2 : gs.jumpCombo === 2 ? 8.8 : 7.2;
      gs.comboTimer = 42;
      RC.sfx(gs.jumpCombo === 3 ? 'triple' : 'jump');
      if (gs.jumpCombo === 3) {
        gs.bannerText = 'WAHOO!! TRIPLE SHELL JUMP!';
        gs.bannerTimer = 55;
      }
    }
    if (justPressed.action && gs.spinTimer <= 0) {
      gs.spinTimer = 24;
      RC.sfx('spindash');
    }
    if (gs.spinTimer > 0) gs.spinTimer--;

    gs.py += gs.vy;
    if (gs.py > 0) gs.vy -= 0.48;
    if (gs.py <= 0) { gs.py = 0; gs.vy = 0; }

    // Project 3D world point (x, y, z) onto 2D CRT screen
    var camZ = gs.pz - 155;
    var camY = 95;
    var fov = 260;
    function proj(wx, wy, wz) {
      var dz = Math.max(20, wz - camZ);
      var scale = fov / dz;
      return {
        sx: W * 0.5 + (wx - gs.px * 0.35) * scale,
        sy: H * 0.36 + (camY - wy) * scale,
        s: scale,
        dz: dz
      };
    }

    // Sky & N64 polygon mountains
    var skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.45);
    skyGrad.addColorStop(0, '#1d4ed8');
    skyGrad.addColorStop(1, '#7dd3fc');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H * 0.45);

    // Clouds & N64 castle silhouette
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (var ci = 0; ci < 5; ci++) {
      var cx = ((ci * 180 + gs.t * 0.3) % (W + 120)) - 60;
      ctx.beginPath();
      ctx.ellipse(cx, 44 + (ci % 2) * 20, 46, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Checkerboard 3D courtyard lawn
    var groundGrad = ctx.createLinearGradient(0, H * 0.42, 0, H);
    groundGrad.addColorStop(0, '#15803d');
    groundGrad.addColorStop(1, '#166534');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, H * 0.42, W, H * 0.58);

    // Draw perspective checkerboard tiles
    for (var gz = -100; gz <= 240; gz += 34) {
      for (var gx = -204; gx <= 170; gx += 34) {
        var p1 = proj(gx, 0, gz);
        var p2 = proj(gx + 34, 0, gz);
        var p3 = proj(gx + 34, 0, gz + 34);
        var p4 = proj(gx, 0, gz + 34);
        var isPath = Math.abs(gx + 17) < 38;
        var parity = ((Math.floor(gx / 34) + Math.floor(gz / 34)) & 1) === 0;
        ctx.fillStyle = isPath
          ? (parity ? '#d6d3d1' : '#a8a29e')
          : (parity ? '#22c55e' : '#16a34a');
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.lineTo(p3.sx, p3.sy);
        ctx.lineTo(p4.sx, p4.sy);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 3D Peach/Torty Castle in back (z = 245)
    var cas = proj(0, 0, 245);
    var cw = 180 * cas.s, ch = 135 * cas.s;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cas.sx - cw * 0.5, cas.sy - ch, cw, ch);
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.moveTo(cas.sx - cw * 0.58, cas.sy - ch);
    ctx.lineTo(cas.sx, cas.sy - ch * 1.55);
    ctx.lineTo(cas.sx + cw * 0.58, cas.sy - ch);
    ctx.closePath();
    ctx.fill();
    // Stained-glass Torty Emblem on castle
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cas.sx, cas.sy - ch * 0.68, 22 * cas.s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Collect coins
    gs.coinList.forEach(function (c) {
      if (c.got) return;
      if (Math.hypot(gs.px - c.x, gs.pz - c.z) < 22) {
        c.got = true;
        gs.coins++;
        gs.score += 25;
        RC.sfx('ring');
        RC.recordScore('torty64', gs.score, 2);
      }
      var cp = proj(c.x, 10 + Math.sin(gs.t * 0.1 + c.x) * 3, c.z);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(cp.sx, cp.sy, Math.max(3, 8 * cp.s * Math.abs(Math.cos(gs.t * 0.08))), Math.max(4, 10 * cp.s), 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Goomba-Bots
    gs.baddies.forEach(function (b) {
      if (!b.alive) return;
      b.x += b.vx;
      if (b.x > 140 || b.x < -140) b.vx = -b.vx;
      var dist = Math.hypot(gs.px - b.x, gs.pz - b.z);
      if (dist < 24) {
        if (gs.py > 8 || gs.spinTimer > 0) {
          b.alive = false;
          gs.vy = 7.5;
          gs.score += 100;
          RC.sfx('spring');
          gs.bannerText = 'STOMPED GOOMBA-BOT! +100 PTS';
          gs.bannerTimer = 45;
          RC.recordScore('torty64', gs.score, 5);
        }
      }
      var bp = proj(b.x, 12, b.z);
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.arc(bp.sx, bp.sy, Math.max(6, 15 * bp.s), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(bp.sx - 6 * bp.s, bp.sy - 4 * bp.s, 4 * bp.s, 4 * bp.s);
      ctx.fillRect(bp.sx + 2 * bp.s, bp.sy - 4 * bp.s, 4 * bp.s, 4 * bp.s);
    });

    // 5 Golden Power Stars
    gs.starList.forEach(function (st, idx) {
      var bob = Math.sin(gs.t * 0.08 + idx) * 6;
      var sp = proj(st.x, st.y + bob, st.z);
      // Pillar shadow base
      var baseP = proj(st.x, 0, st.z);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(baseP.sx, baseP.sy, Math.max(5, 16 * baseP.s), Math.max(3, 7 * baseP.s), 0, 0, Math.PI * 2);
      ctx.fill();

      if (!st.got && Math.hypot(gs.px - st.x, gs.pz - st.z) < 28 && Math.abs(gs.py - st.y) < 34) {
        st.got = true;
        gs.stars++;
        gs.score += 200;
        RC.sfx('star');
        gs.bannerText = '★ HERE WE GO!! GOT POWER STAR #' + gs.stars + ': ' + st.label.toUpperCase() + '! (+15 TIX)';
        gs.bannerTimer = 95;
        RC.recordScore('torty64', gs.score, 15);
        if (gs.stars >= 5) {
          setTimeout(function () {
            if (gs && activeGameId === 'torty64') {
              gs.starList.forEach(function (s) { s.got = false; });
              gs.bannerText = 'ALL 5 COURTYARD STARS COLLECTED! NEW STAR LAP READY!';
              gs.bannerTimer = 90;
            }
          }, 1800);
        }
      }

      var r = Math.max(8, 20 * sp.s);
      drawStarShape(ctx, sp.sx, sp.sy, 5, r, r * 0.45, st.got ? 'rgba(148,163,184,0.5)' : '#facc15', '#f59e0b');
    });

    // Draw Torty in her Red Plumber Cap
    var ps = proj(gs.px, 0, gs.pz);
    var pp = proj(gs.px, gs.py + 16, gs.pz);
    // Ground shadow under Torty
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(ps.sx, ps.sy, Math.max(8, 20 * ps.s), Math.max(4, 9 * ps.s), 0, 0, Math.PI * 2);
    ctx.fill();

    // Green Tortoise Shell
    var pr = Math.max(12, 22 * pp.s);
    ctx.save();
    ctx.translate(pp.sx, pp.sy);
    if (gs.spinTimer > 0) ctx.rotate(gs.t * 0.6);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(0, 0, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#065f46';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Red N64 "T" Cap on top
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -pr * 0.55, pr * 0.72, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-pr * 0.85, -pr * 0.62, pr * 1.7, pr * 0.22);
    ctx.fillStyle = '#fff';
    ctx.font = '900 ' + Math.round(pr * 0.55) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('T', 0, -pr * 0.68);
    ctx.restore();

    // N64 Top HUD Overlay
    drawN64Hud(W, H);
  }

  function drawStarShape(c, cx, cy, spikes, outerR, innerR, fill, stroke) {
    var rot = Math.PI / 2 * 3;
    var step = Math.PI / spikes;
    c.beginPath();
    c.moveTo(cx, cy - outerR);
    for (var i = 0; i < spikes; i++) {
      c.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      c.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    c.closePath();
    c.fillStyle = fill;
    c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); }
  }

  function drawN64Hud(W, H) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(14, 12, W - 28, 42);
    ctx.font = '900 18px Trebuchet MS, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'left';
    ctx.fillText('★ × ' + gs.stars + ' / 5', 26, 39);
    ctx.fillStyle = '#fde047';
    ctx.fillText('● COINS × ' + gs.coins, 155, 39);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('TORTY 64 SCORE: ' + gs.score, 315, 39);
    ctx.fillStyle = '#a7f3d0';
    ctx.textAlign = 'right';
    ctx.font = '800 13px Trebuchet MS, sans-serif';
    ctx.fillText('JUMP COMBO: ' + (gs.jumpCombo === 3 ? 'TRIPLE!' : gs.jumpCombo + 'x'), W - 26, 38);

    if (gs.bannerTimer > 0) {
      gs.bannerTimer--;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(W * 0.12, H - 54, W * 0.76, 36);
      ctx.strokeStyle = '#facc15';
      ctx.strokeRect(W * 0.12, H - 54, W * 0.76, 36);
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.font = '900 14px Trebuchet MS, sans-serif';
      ctx.fillText(gs.bannerText, W * 0.5, H - 31);
    }
  }

  /* ======================================================================
     2 & 3. SPEED RAT 1991 & SPEED RAT 2: SPIN DASH (Sonic 1 & 2 Copycats)
     ====================================================================== */
  function initSpeedRat(isSequel) {
    gs = {
      sequel: !!isSequel,
      t: 0,
      camX: 0,
      x: 90,
      y: 346 - 22,
      vx: 0,
      vy: 0,
      groundY: 346,
      onGround: true,
      rolling: false,
      spinCharge: 0,
      loopAngle: 0,
      inLoop: false,
      rings: 0,
      score: 0,
      bossHp: 5,
      bossX: 1650,
      bannerTimer: 85,
      bannerText: isSequel
        ? 'SPEED RAT 2 (1992): CHEMICAL SPIN-DASH ZONE · HOLD X TO SPIN DASH!'
        : 'SPEED RAT 1991: GREEN HILL ZONE · ACT 1 · COLLECT GOLDEN RINGS!',
      ringList: [],
      springs: [380, 820, 1260],
      loops: [560, 1080],
      badniks: [
        { x: 310, alive: true },
        { x: 720, alive: true },
        { x: 960, alive: true },
        { x: 1390, alive: true }
      ]
    };
    for (var i = 0; i < 42; i++) {
      gs.ringList.push({
        x: 160 + i * 36,
        y: (i % 7 === 0) ? 215 : 272,
        got: false
      });
    }
  }

  function updateAndDrawSpeedRat(W, H) {
    gs.t++;
    var groundY = H - 86;
    gs.groundY = groundY;

    // Spin Dash charge in Speed Rat 1 & 2
    if ((keys.action || (keys.down && justPressed.jump)) && gs.onGround) {
      gs.spinCharge = Math.min(16, gs.spinCharge + 2.5);
      gs.rolling = true;
      if (justPressed.action) RC.sfx('spindash');
    } else if (gs.spinCharge > 0 && !keys.action) {
      gs.vx = 11.5 + gs.spinCharge * 0.45;
      gs.spinCharge = 0;
      gs.rolling = true;
      RC.sfx('spindash');
      gs.bannerText = 'SUPERSONIC SPIN DASH BLAST PROCESSING!!';
      gs.bannerTimer = 50;
    }

    if (keys.right) gs.vx = Math.min(13.5, gs.vx + 0.55);
    else if (keys.left) gs.vx = Math.max(-8, gs.vx - 0.55);
    else gs.vx *= 0.94;

    if (Math.abs(gs.vx) > 6.5 && keys.down) gs.rolling = true;
    else if (Math.abs(gs.vx) < 2.2 && gs.spinCharge === 0) gs.rolling = false;

    if (justPressed.jump && gs.onGround) {
      gs.vy = -11.4;
      gs.onGround = false;
      gs.rolling = true;
      RC.sfx('jump');
    }

    gs.x += gs.vx;
    if (gs.x < 40) { gs.x = 40; gs.vx = 0; }
    if (gs.x > 1820) { gs.x = 120; gs.bannerText = 'ZONE CLEAR! BONUS +25 TICKETS! NEXT ACT!'; gs.bannerTimer = 75; RC.recordScore(gs.sequel ? 'speedrat2' : 'speedrat1', gs.score + 500, 25); }

    gs.y += gs.vy;
    if (!gs.onGround) gs.vy += 0.56;
    if (gs.y >= groundY - 22) {
      gs.y = groundY - 22;
      gs.vy = 0;
      gs.onGround = true;
    }

    // Check 360 Loop-de-Loops!
    gs.loops.forEach(function (lx) {
      if (Math.abs(gs.x - lx) < 54 && Math.abs(gs.vx) > 4.2 && gs.onGround) {
        gs.loopAngle = ((gs.x - (lx - 54)) / 108) * Math.PI * 2;
      }
    });

    // Check Red/Yellow Springs
    gs.springs.forEach(function (sx) {
      if (Math.abs(gs.x - sx) < 22 && gs.y > groundY - 45) {
        gs.vy = -14.2;
        gs.onGround = false;
        gs.rolling = true;
        RC.sfx('spring');
      }
    });

    // Collect Golden Rings
    gs.ringList.forEach(function (r) {
      if (r.got) return;
      var ry = groundY - (310 - r.y);
      if (Math.hypot(gs.x - r.x, gs.y - ry) < 28) {
        r.got = true;
        gs.rings++;
        gs.score += 50;
        RC.sfx('ring');
        RC.recordScore(gs.sequel ? 'speedrat2' : 'speedrat1', gs.score, 2);
      }
    });

    // Badniks & Dr. Egg-Rat Boss
    gs.badniks.forEach(function (b) {
      if (!b.alive) return;
      if (Math.abs(gs.x - b.x) < 28 && Math.abs(gs.y - (groundY - 22)) < 32) {
        if (gs.rolling || !gs.onGround || Math.abs(gs.vx) > 5) {
          b.alive = false;
          gs.vy = -7.5;
          gs.score += 150;
          RC.sfx('spring');
          RC.recordScore(gs.sequel ? 'speedrat2' : 'speedrat1', gs.score, 5);
        }
      }
    });

    // Dr. Egg-Rat Hovercraft at x = 1650
    var eggX = gs.bossX + Math.sin(gs.t * 0.05) * 65;
    var eggY = groundY - 95 + Math.cos(gs.t * 0.08) * 18;
    if (gs.bossHp > 0 && Math.hypot(gs.x - eggX, gs.y - eggY) < 42) {
      gs.bossHp--;
      gs.vy = -9.5;
      gs.vx = -6;
      gs.score += 250;
      RC.sfx('hit');
      gs.bannerText = gs.bossHp > 0
        ? 'HIT DR. EGG-RAT! (' + gs.bossHp + ' HP LEFT)'
        : 'DR. EGG-RAT DEFEATED!! +30 TICKETS!';
      gs.bannerTimer = 65;
      RC.recordScore(gs.sequel ? 'speedrat2' : 'speedrat1', gs.score, gs.bossHp === 0 ? 30 : 8);
    }

    gs.camX = clamp(gs.x - W * 0.3, 0, 1400);

    // Draw Background (Green Hill 1991 vs Chemical Spin-Dash 1992)
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    if (gs.sequel) {
      bg.addColorStop(0, '#1e1b4b');
      bg.addColorStop(0.6, '#4c1d95');
      bg.addColorStop(1, '#0f172a');
    } else {
      bg.addColorStop(0, '#1d4ed8');
      bg.addColorStop(0.65, '#38bdf8');
      bg.addColorStop(1, '#0284c7');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Parallax Hills / Chemical Pipes
    for (var hi = 0; hi < 8; hi++) {
      var hx = hi * 240 - (gs.camX * 0.35) % 240;
      ctx.fillStyle = gs.sequel ? '#312e81' : '#15803d';
      ctx.beginPath();
      ctx.arc(hx + 80, groundY, 95, Math.PI, 0);
      ctx.fill();
    }

    // 360 Checkerboard Loops
    gs.loops.forEach(function (lx) {
      var sx = lx - gs.camX;
      ctx.strokeStyle = gs.sequel ? '#a855f7' : '#d97706';
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.arc(sx, groundY - 68, 64, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.stroke();
    });

    // Iconic Sonic Checkerboard Brown/Orange Ground + Emerald Grass
    ctx.fillStyle = gs.sequel ? '#eab308' : '#22c55e';
    ctx.fillRect(0, groundY, W, 16);
    for (var tx = -((gs.camX | 0) % 32); tx < W; tx += 32) {
      for (var ty = groundY + 16; ty < H; ty += 24) {
        var odd = (((tx + (gs.camX | 0)) >> 5) + ((ty - groundY) >> 4)) & 1;
        ctx.fillStyle = gs.sequel
          ? (odd ? '#3b0764' : '#581c87')
          : (odd ? '#92400e' : '#b45309');
        ctx.fillRect(tx, ty, 32, 24);
      }
    }

    // Draw Springs
    gs.springs.forEach(function (spX) {
      var sx = spX - gs.camX;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(sx - 14, groundY - 16, 28, 10);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(sx - 10, groundY - 6, 20, 6);
    });

    // Draw Golden Rings
    gs.ringList.forEach(function (r) {
      if (r.got) return;
      var rx = r.x - gs.camX;
      if (rx < -20 || rx > W + 20) return;
      var ry = groundY - (310 - r.y);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(rx, ry, 9, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw Badnik Crab/Moto-Bots
    gs.badniks.forEach(function (b) {
      if (!b.alive) return;
      var bx = b.x - gs.camX;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(bx, groundY - 16, 15, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.fillRect(bx - 8, groundY - 22, 5, 5);
      ctx.fillRect(bx + 3, groundY - 22, 5, 5);
    });

    // Draw Dr. Egg-Rat Boss Mobile
    if (gs.bossHp > 0) {
      var ex = eggX - gs.camX;
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(ex, eggY, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(ex - 26, eggY, 52, 14);
      ctx.fillStyle = '#fff';
      ctx.font = '900 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EGG-RAT (' + gs.bossHp + ')', ex, eggY - 34);
    }

    // If Speed Rat 2, draw orange two-tailed pal "Squeaks" following behind!
    var px = gs.x - gs.camX;
    var py = gs.y;
    if (gs.sequel) {
      var sx2 = px - 36;
      var sy2 = py + Math.sin(gs.t * 0.25) * 4;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(sx2, sy2, 14, 0, Math.PI * 2);
      ctx.fill();
      // Spinning twin tails
      ctx.strokeStyle = '#fed7aa';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx2 - 12, sy2);
      ctx.lineTo(sx2 - 24, sy2 - 6 + Math.sin(gs.t * 0.8) * 6);
      ctx.stroke();
    }

    // Draw Cobalt-Blue Supersonic Speed Rat (with Red Sneakers!)
    ctx.save();
    ctx.translate(px, py);
    if (gs.rolling || gs.spinCharge > 0) {
      ctx.rotate(gs.t * 0.65);
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      // Blue spikes & body
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(0, -4, 17, 0, Math.PI * 2);
      ctx.fill();
      // Sonic spikes on back
      ctx.beginPath();
      ctx.moveTo(-10, -14); ctx.lineTo(-26, -18); ctx.lineTo(-14, -4);
      ctx.moveTo(-10, -4); ctx.lineTo(-25, -4); ctx.lineTo(-12, 4);
      ctx.fill();
      // Red power sneakers
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-14, 10, 12, 8);
      ctx.fillRect(2, 10, 12, 8);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-12, 12, 10, 2);
      ctx.fillRect(4, 12, 10, 2);
    }
    ctx.restore();

    // 16-Bit Yellow/Blue Sonic HUD
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(14, 12, W - 28, 42);
    ctx.font = '900 17px Trebuchet MS, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'left';
    ctx.fillText('RINGS: ' + gs.rings, 26, 39);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('SCORE: ' + gs.score, 155, 39);
    ctx.fillStyle = '#f43f5e';
    ctx.fillText('SPEED: ' + Math.round(Math.abs(gs.vx) * 28) + ' MPH', 310, 39);
    ctx.fillStyle = '#fde047';
    ctx.textAlign = 'right';
    ctx.font = '800 13px Trebuchet MS, sans-serif';
    ctx.fillText(gs.sequel ? 'SPIN DASH: HOLD X' : 'LOOP ZONE · 16-BIT', W - 24, 38);

    if (gs.bannerTimer > 0) {
      gs.bannerTimer--;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(W * 0.1, H - 52, W * 0.8, 34);
      ctx.fillStyle = '#facc15';
      ctx.textAlign = 'center';
      ctx.font = '900 13.5px Trebuchet MS, sans-serif';
      ctx.fillText(gs.bannerText, W * 0.5, H - 30);
    }
  }

  /* ======================================================================
     4. 8-BIT PLUMBER BROS. '85 (RES-83 NES Copycat)
     ====================================================================== */
  function initPlumber85() {
    gs = {
      t: 0,
      x: 80,
      y: 340,
      vx: 0,
      vy: 0,
      onGround: true,
      coins: 0,
      score: 0,
      blocks: [
        { x: 180, y: 190, hit: false },
        { x: 225, y: 190, hit: false },
        { x: 270, y: 190, hit: false },
        { x: 430, y: 175, hit: false },
        { x: 475, y: 175, hit: false }
      ],
      koopas: [
        { x: 330, vx: -1.4, alive: true },
        { x: 540, vx: -1.6, alive: true }
      ],
      bannerTimer: 75,
      bannerText: 'WORLD 1-1 (1985 8-BIT) · BUMP ? BLOCKS & GRAB THE FLAGPOLE!'
    };
  }

  function updateAndDrawPlumber85(W, H) {
    gs.t++;
    var groundY = H - 72;
    if (keys.right) gs.vx = 4.2;
    else if (keys.left) gs.vx = -4.2;
    else gs.vx *= 0.8;

    if (justPressed.jump && gs.onGround) {
      gs.vy = -10.8;
      gs.onGround = false;
      RC.sfx('jump');
    }

    gs.x = clamp(gs.x + gs.vx, 30, W - 40);
    gs.y += gs.vy;
    if (!gs.onGround) gs.vy += 0.52;
    if (gs.y >= groundY - 20) {
      gs.y = groundY - 20;
      gs.vy = 0;
      gs.onGround = true;
    }

    // Sky & 8-bit bricks
    ctx.fillStyle = '#5c94fc';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#c84c0c';
    ctx.fillRect(0, groundY, W, H - groundY);

    // Green Warp Pipe
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(350, groundY - 58, 46, 58);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(344, groundY - 68, 58, 14);

    // ? Mystery Blocks
    gs.blocks.forEach(function (b) {
      var by = groundY - 115;
      if (!b.hit && Math.abs(gs.x - b.x) < 22 && gs.vy < 0 && Math.abs(gs.y - (by + 28)) < 22) {
        b.hit = true;
        gs.vy = 2;
        gs.coins++;
        gs.score += 100;
        RC.sfx('ring');
        RC.recordScore('plumber85', gs.score, 5);
      }
      ctx.fillStyle = b.hit ? '#78716c' : '#f59e0b';
      ctx.fillRect(b.x - 16, by, 32, 32);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(b.x - 16, by, 32, 32);
      ctx.fillStyle = '#fff';
      ctx.font = '900 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(b.hit ? '·' : '?', b.x, by + 23);
    });

    // Castle Flagpole on right
    var flagX = W - 85;
    ctx.fillStyle = '#bbf7d0';
    ctx.fillRect(flagX, groundY - 190, 6, 190);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(flagX - 34, groundY - 185, 34, 24);
    if (Math.abs(gs.x - flagX) < 22) {
      gs.score += 300;
      gs.x = 70;
      gs.blocks.forEach(function (b) { b.hit = false; });
      RC.sfx('star');
      gs.bannerText = 'COURSE CLEAR! +15 TICKETS! NEXT WORLD 1-2!';
      gs.bannerTimer = 75;
      RC.recordScore('plumber85', gs.score, 15);
    }

    // Player 8-Bit Plumber Rat
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(gs.x - 12, gs.y - 18, 24, 18);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(gs.x - 12, gs.y - 6, 24, 14);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(gs.x - 6, gs.y - 14, 12, 8);

    // 8-Bit Top HUD
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(14, 12, W - 28, 38);
    ctx.fillStyle = '#fff';
    ctx.font = '900 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('PLUMBER-85: ' + gs.score + '   COINS: ' + gs.coins + '   WORLD 1-1', 26, 36);
  }

  /* ======================================================================
     5. POLYGONAL SHELL FIGHTER '95 (Tortuga DreamBox 32X-CD)
     ====================================================================== */
  function initShellFighter() {
    gs = {
      t: 0,
      p1x: 240,
      p2x: 480,
      p1hp: 100,
      p2hp: 100,
      p1atk: 0,
      p2atk: 0,
      wins: 0,
      score: 0
    };
  }

  function updateAndDrawShellFighter(W, H) {
    gs.t++;
    if (keys.left) gs.p1x = Math.max(110, gs.p1x - 3.6);
    if (keys.right) gs.p1x = Math.min(gs.p2x - 48, gs.p1x + 3.6);
    if ((justPressed.jump || justPressed.action) && gs.p1atk <= 0) {
      gs.p1atk = 18;
      RC.sfx('spindash');
      if (Math.abs(gs.p2x - gs.p1x) < 95) {
        gs.p2hp = Math.max(0, gs.p2hp - 18);
        gs.p2x = Math.min(W - 90, gs.p2x + 28);
        gs.score += 120;
        RC.sfx('hit');
        RC.recordScore('shellfighter95', gs.score, 6);
        if (gs.p2hp <= 0) {
          gs.wins++;
          gs.p2hp = 100;
          gs.p1hp = 100;
          gs.p1x = 220;
          gs.p2x = 500;
          RC.sfx('star');
          RC.recordScore('shellfighter95', gs.score + 300, 20);
        }
      }
    }
    if (gs.p1atk > 0) gs.p1atk--;

    // Simple AI for Mecha-Rat 32X
    if (gs.t % 45 === 0 && Math.abs(gs.p2x - gs.p1x) < 95) {
      gs.p2atk = 14;
      gs.p1hp = Math.max(20, gs.p1hp - 8);
    } else if (gs.p2x > gs.p1x + 68) {
      gs.p2x -= 1.8;
    }
    if (gs.p2atk > 0) gs.p2atk--;

    // Flat-shaded 1995 Virtua Fighter 3D Ring
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.moveTo(80, H - 120);
    ctx.lineTo(W - 80, H - 120);
    ctx.lineTo(W - 20, H - 35);
    ctx.lineTo(20, H - 35);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw flat-polygon fighters
    var floorY = H - 85;
    drawPolyFighter(gs.p1x, floorY, '#10b981', '#facc15', gs.p1atk > 0, 1);
    drawPolyFighter(gs.p2x, floorY, '#f43f5e', '#38bdf8', gs.p2atk > 0, -1);

    // Health bars
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(30, 24, 240, 20);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(30, 24, 2.4 * gs.p1hp, 20);

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(W - 270, 24, 240, 20);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(W - 270, 24, 2.4 * gs.p2hp, 20);

    ctx.fillStyle = '#fff';
    ctx.font = '900 15px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TORTY 32X  VS  MECHA-RAT · KO WINS: ' + gs.wins, W * 0.5, 39);
  }

  function drawPolyFighter(x, y, c1, c2, attacking, dir) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.moveTo(-20, 0); ctx.lineTo(20, 0); ctx.lineTo(14, -58); ctx.lineTo(-14, -58);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.moveTo(-14, -60); ctx.lineTo(14, -60); ctx.lineTo(0, -86);
    ctx.closePath();
    ctx.fill();
    if (attacking) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(dir > 0 ? 14 : -58, -50, 44, 14);
    }
    ctx.restore();
  }

  /* ======================================================================
     6. WIREFRAME CYBER-MAZE '95 (Ratita Virtual-Visor 95 Red Vector VR)
     ====================================================================== */
  function initCyberMaze() {
    gs = {
      t: 0,
      angle: 0,
      score: 0,
      cores: 0,
      beam: 0,
      targetX: 0
    };
  }

  function updateAndDrawCyberMaze(W, H) {
    gs.t++;
    if (keys.left) gs.angle -= 0.05;
    if (keys.right) gs.angle += 0.05;
    gs.targetX = Math.sin(gs.t * 0.03 - gs.angle * 2) * (W * 0.28);

    if (justPressed.jump || justPressed.action) {
      gs.beam = 12;
      RC.sfx('talk');
      if (Math.abs(gs.targetX) < 68) {
        gs.cores++;
        gs.score += 150;
        RC.sfx('star');
        RC.recordScore('cybermaze95', gs.score, 8);
      }
    }
    if (gs.beam > 0) gs.beam--;

    // Pure Black + Glowing Red Virtual Boy 1995 Vector Grid
    ctx.fillStyle = '#050002';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;

    var midY = H * 0.5;
    for (var i = -6; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(W * 0.5 + i * 28, midY);
      ctx.lineTo(W * 0.5 + i * 140, H);
      ctx.stroke();
    }
    for (var r = 1; r <= 6; r++) {
      var y = midY + r * r * 6.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Wireframe Red Data Core Drone
    var tx = W * 0.5 + gs.targetX;
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 3;
    ctx.strokeRect(tx - 32, midY - 32, 64, 64);
    ctx.beginPath();
    ctx.moveTo(tx, midY - 46); ctx.lineTo(tx + 46, midY); ctx.lineTo(tx, midY + 46); ctx.lineTo(tx - 46, midY);
    ctx.closePath();
    ctx.stroke();

    // Red Laser Beams
    if (gs.beam > 0) {
      ctx.strokeStyle = '#fda4af';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(80, H - 20); ctx.lineTo(W * 0.5, midY);
      ctx.moveTo(W - 80, H - 20); ctx.lineTo(W * 0.5, midY);
      ctx.stroke();
    }

    // Reticle & HUD
    ctx.strokeRect(W * 0.5 - 24, midY - 24, 48, 48);
    ctx.fillStyle = '#f43f5e';
    ctx.font = '900 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('VIRTUAL-VISOR 95 · RED DATA CORES: ' + gs.cores + ' · SCORE: ' + gs.score, 24, 34);
  }

  /* ======================================================================
     Main Emulator Loop & Public API
     ====================================================================== */
  function tick() {
    if (!activeGameId || !canvas || !ctx) return;
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (activeGameId === 'torty64') updateAndDrawTorty64(W, H);
    else if (activeGameId === 'speedrat1') updateAndDrawSpeedRat(W, H);
    else if (activeGameId === 'speedrat2') updateAndDrawSpeedRat(W, H);
    else if (activeGameId === 'plumber85') updateAndDrawPlumber85(W, H);
    else if (activeGameId === 'shellfighter95') updateAndDrawShellFighter(W, H);
    else if (activeGameId === 'cybermaze95') updateAndDrawCyberMaze(W, H);

    justPressed.jump = false;
    justPressed.action = false;
    rafId = requestAnimationFrame(tick);
  }

  RC.startGame = function (gameId, canvasEl) {
    canvas = canvasEl || document.getElementById('crtCanvas');
    if (!canvas) return;
    canvas.width = 768;
    canvas.height = 432;
    ctx = canvas.getContext('2d');
    activeGameId = gameId || 'torty64';

    keys = { left: false, right: false, up: false, down: false, jump: false, action: false };
    justPressed = { jump: false, action: false };

    if (activeGameId === 'torty64') initTorty64();
    else if (activeGameId === 'speedrat1') initSpeedRat(false);
    else if (activeGameId === 'speedrat2') initSpeedRat(true);
    else if (activeGameId === 'plumber85') initPlumber85();
    else if (activeGameId === 'shellfighter95') initShellFighter();
    else if (activeGameId === 'cybermaze95') initCyberMaze();
    else initTorty64();

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  };

  RC.stopGame = function () {
    activeGameId = null;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  };

  RC.isGameOpen = function () {
    return !!activeGameId;
  };
})();
