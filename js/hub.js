/* Grok Arcade - 3D walkable hub (three.js r128) */
(function () {
  'use strict';
  var T = THREE;
  var Hub = GA.Hub = {};

  var ROOM = { minX: -18, maxX: 18, minZ: -12, maxZ: 12, h: 5 };
  var DIV_X = 6, DOOR = 2.6, PR = 0.42; // divider wall x, half door width, player radius
  var SPAWN = { x: -6, z: 5.2, yaw: 0 };

  var renderer, scene, camera, canvas;
  var solids = [];   // 2D AABBs for the player  {minX,maxX,minZ,maxZ}
  var walls = [];    // 3D AABBs for the camera  {minX,maxX,minY,maxY,minZ,maxZ}
  var cabinets = [];
  var anims = [];
  var dynTex = {};   // dynamic canvas signs (tickets, scores)
  var player, parts = {};
  var P = { x: SPAWN.x, z: SPAWN.z, face: Math.PI, speed: 0, phase: 0 };
  var C = { yaw: 0, pitch: 0.38, dist: 6.2, cur: 6.2, nb: 0 };
  var keys = {}, joy = { id: null, x: 0, y: 0, cx: 0, cy: 0 }, look = { id: null, x: 0, y: 0 }, mouse = { down: false, x: 0, y: 0 };
  var enabled = false, paused = false, titleMode = true, near = null, time = 0, lastT = 0, eTurnBlock = false;
  var ring;

  /* ---------- helpers ---------- */
  var matCache = {}, geoCache = {};
  function lam(c) { var k = 'l' + c; return matCache[k] || (matCache[k] = new T.MeshLambertMaterial({ color: c })); }
  function basic(c) { var k = 'b' + c; return matCache[k] || (matCache[k] = new T.MeshBasicMaterial({ color: c })); }
  function box(w, h, d) { var k = 'x' + w + ',' + h + ',' + d; return geoCache[k] || (geoCache[k] = new T.BoxGeometry(w, h, d)); }
  function plane(w, h) { var k = 'p' + w + ',' + h; return geoCache[k] || (geoCache[k] = new T.PlaneGeometry(w, h)); }
  function cyl(rt, rb, h, s) { var k = 'c' + rt + ',' + rb + ',' + h + ',' + s; return geoCache[k] || (geoCache[k] = new T.CylinderGeometry(rt, rb, h, s || 12)); }
  function sph(r, s) { var k = 's' + r + ',' + s; return geoCache[k] || (geoCache[k] = new T.SphereGeometry(r, s || 14, Math.max(6, Math.floor((s || 14) * 0.7)))); }
  function mesh(geo, mat, x, y, z, parent) { var m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); (parent || scene).add(m); return m; }
  function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function canvasTex(c) { var t = new T.CanvasTexture(c); t.anisotropy = 4; t.minFilter = T.LinearMipmapLinearFilter; return t; }
  function addSolid(minX, maxX, minZ, maxZ) { solids.push({ minX: minX, maxX: maxX, minZ: minZ, maxZ: maxZ }); }
  function addWall(minX, maxX, minY, maxY, minZ, maxZ) { walls.push({ minX: minX, maxX: maxX, minY: minY, maxY: maxY, minZ: minZ, maxZ: maxZ }); addSolid(minX, maxX, minZ, maxZ); }
  function font(px, w) { return (w || 'bold') + ' ' + px + 'px "Trebuchet MS", system-ui, sans-serif'; }
  function fitText(ctx, s, maxW, px, w) { ctx.font = font(px, w); while (ctx.measureText(s).width > maxW && px > 10) { px -= 2; ctx.font = font(px, w); } return px; }
  function neonText(ctx, s, x, y, px, col, maxW) {
    if (maxW) fitText(ctx, s, maxW, px); else ctx.font = font(px);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = col; ctx.shadowBlur = px * 0.35; ctx.lineWidth = Math.max(3, px * 0.09); ctx.strokeStyle = col;
    ctx.strokeText(s, x, y); ctx.shadowBlur = px * 0.2; ctx.fillStyle = '#ffffff'; ctx.fillText(s, x, y); ctx.shadowBlur = 0;
  }
  // a glowing sign plane with text
  function sign(text, w, h, col, opts) {
    opts = opts || {};
    var cw = 1024, ch = Math.round(cw * h / w), c = mkCanvas(cw, ch), x = c.getContext('2d');
    if (opts.bg !== false) {
      x.fillStyle = opts.bg || 'rgba(20,8,44,0.92)'; x.fillRect(0, 0, cw, ch);
      x.strokeStyle = col; x.lineWidth = 14; x.shadowColor = col; x.shadowBlur = 20; x.strokeRect(14, 14, cw - 28, ch - 28); x.shadowBlur = 0;
    }
    var lines = text.split('\n'), px = opts.px || Math.round(ch * (lines.length > 1 ? 0.34 : 0.55));
    lines.forEach(function (ln, i) {
      var sz = i === 0 ? px : Math.round(px * 0.55);
      var y = lines.length === 1 ? ch / 2 : ch * (i === 0 ? 0.4 : 0.76);
      neonText(x, ln, cw / 2, y, sz, i === 0 ? col : (opts.col2 || '#ffffff'), cw - 80);
    });
    var tex = canvasTex(c);
    var m = new T.Mesh(plane(w, h), new T.MeshBasicMaterial({ map: tex, transparent: opts.bg === false, depthWrite: opts.bg !== false }));
    return m;
  }

  /* ---------- room ---------- */
  function floorTex(a, b, line) {
    var c = mkCanvas(256, 256), x = c.getContext('2d');
    x.fillStyle = a; x.fillRect(0, 0, 256, 256); x.fillStyle = b; x.fillRect(0, 0, 128, 128); x.fillRect(128, 128, 128, 128);
    x.strokeStyle = line; x.lineWidth = 3; x.strokeRect(1.5, 1.5, 253, 253); x.beginPath(); x.moveTo(128, 0); x.lineTo(128, 256); x.moveTo(0, 128); x.lineTo(256, 128); x.stroke();
    var t = canvasTex(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  }
  function buildRoom() {
    // floors (main hall + bonus room, different colors for readable zones)
    var mainW = DIV_X - ROOM.minX, bonW = ROOM.maxX - DIV_X, D = ROOM.maxZ - ROOM.minZ;
    var t1 = floorTex('#2a1a5e', '#24164f', 'rgba(63,240,255,0.35)'); t1.repeat.set(mainW / 2, D / 2);
    var f1 = mesh(plane(mainW, D), new T.MeshLambertMaterial({ map: t1 }), ROOM.minX + mainW / 2, 0, 0); f1.rotation.x = -Math.PI / 2;
    var t2 = floorTex('#3a1450', '#311046', 'rgba(255,79,216,0.4)'); t2.repeat.set(bonW / 2, D / 2);
    var f2 = mesh(plane(bonW, D), new T.MeshLambertMaterial({ map: t2 }), DIV_X + bonW / 2, 0, 0); f2.rotation.x = -Math.PI / 2;
    // ceiling (dark, with star dots)
    var cc = mkCanvas(256, 256), cx = cc.getContext('2d'); cx.fillStyle = '#120830'; cx.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 40; i++) { cx.fillStyle = ['#3ff0ff', '#ff4fd8', '#ffe14d', '#ffffff'][i % 4]; cx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
    var ct = canvasTex(cc); ct.wrapS = ct.wrapT = T.RepeatWrapping; ct.repeat.set(6, 4);
    var ceil = mesh(plane(ROOM.maxX - ROOM.minX, D), new T.MeshBasicMaterial({ map: ct }), 0, ROOM.h, 0); ceil.rotation.x = Math.PI / 2;

    var wallMat = lam('#3b2370'), th = 0.4, H = ROOM.h;
    // outer walls
    mesh(box(ROOM.maxX - ROOM.minX + th * 2, H, th), wallMat, 0, H / 2, ROOM.minZ - th / 2);
    mesh(box(ROOM.maxX - ROOM.minX + th * 2, H, th), wallMat, 0, H / 2, ROOM.maxZ + th / 2);
    mesh(box(th, H, D), wallMat, ROOM.minX - th / 2, H / 2, 0);
    mesh(box(th, H, D), wallMat, ROOM.maxX + th / 2, H / 2, 0);
    addWall(-99, 99, -1, 99, -99, ROOM.minZ); addWall(-99, 99, -1, 99, ROOM.maxZ, 99);
    addWall(-99, ROOM.minX, -1, 99, -99, 99); addWall(ROOM.maxX, 99, -1, 99, -99, 99);
    // divider with a doorway into the Bonus Zone
    var len = ROOM.maxZ - DOOR, divMat = lam('#4a2a86'), doorH = 3.3;
    mesh(box(th, H, len), divMat, DIV_X, H / 2, ROOM.minZ + len / 2);
    mesh(box(th, H, len), divMat, DIV_X, H / 2, ROOM.maxZ - len / 2);
    mesh(box(th, H - doorH, DOOR * 2), divMat, DIV_X, doorH + (H - doorH) / 2, 0);
    addWall(DIV_X - th / 2, DIV_X + th / 2, -1, 99, ROOM.minZ, -DOOR); addWall(DIV_X - th / 2, DIV_X + th / 2, -1, 99, DOOR, ROOM.maxZ);
    walls.push({ minX: DIV_X - th / 2, maxX: DIV_X + th / 2, minY: doorH, maxY: 99, minZ: -DOOR, maxZ: DOOR });
    // door frame neon
    var pink = basic('#ff4fd8'), cyan = basic('#3ff0ff'), yel = basic('#ffe14d');
    [-1, 1].forEach(function (sd) { [-0.22, 0.22].forEach(function (o) { mesh(box(0.06, doorH, 0.08), pink, DIV_X + o, doorH / 2, sd * DOOR); }); });
    [-0.22, 0.22].forEach(function (o) { mesh(box(0.06, 0.08, DOOR * 2), pink, DIV_X + o, doorH, 0); });
    // neon strips along the walls (top + baseboard)
    function strip(x1, z1, x2, z2, y, mat) {
      var lx = Math.abs(x2 - x1), lz = Math.abs(z2 - z1);
      mesh(box(Math.max(lx, 0.07), 0.08, Math.max(lz, 0.07)), mat, (x1 + x2) / 2, y, (z1 + z2) / 2);
    }
    var e = 0.03;
    strip(ROOM.minX, ROOM.minZ + e, DIV_X, ROOM.minZ + e, 4.4, pink); strip(DIV_X, ROOM.minZ + e, ROOM.maxX, ROOM.minZ + e, 4.4, cyan);
    strip(ROOM.minX, ROOM.maxZ - e, DIV_X, ROOM.maxZ - e, 4.4, cyan); strip(DIV_X, ROOM.maxZ - e, ROOM.maxX, ROOM.maxZ - e, 4.4, pink);
    strip(ROOM.minX + e, ROOM.minZ, ROOM.minX + e, ROOM.maxZ, 4.4, pink); strip(ROOM.maxX - e, ROOM.minZ, ROOM.maxX - e, ROOM.maxZ, 4.4, yel);
    strip(ROOM.minX, ROOM.minZ + e, ROOM.maxX, ROOM.minZ + e, 0.1, cyan); strip(ROOM.minX, ROOM.maxZ - e, ROOM.maxX, ROOM.maxZ - e, 0.1, cyan);
    strip(ROOM.minX + e, ROOM.minZ, ROOM.minX + e, ROOM.maxZ, 0.1, cyan); strip(ROOM.maxX - e, ROOM.minZ, ROOM.maxX - e, ROOM.maxZ, 0.1, pink);
    [-0.22, 0.22].forEach(function (o) { strip(DIV_X + o, ROOM.minZ, DIV_X + o, -DOOR, 4.4, o < 0 ? pink : cyan); strip(DIV_X + o, DOOR, DIV_X + o, ROOM.maxZ, 4.4, o < 0 ? pink : cyan); });
    // ceiling light bars
    for (var lx = -14; lx <= 14; lx += 7) { var lb = mesh(box(4, 0.06, 0.25), basic('#e9e2ff'), lx, ROOM.h - 0.05, -4); var lb2 = lb.clone(); lb2.position.z = 4; scene.add(lb2); }
  }

  /* ---------- signs, decals and decor ---------- */
  function decal(text, w, h, col, x, z, rotY, sub) {
    var c = mkCanvas(1024, Math.round(1024 * h / w)), g = c.getContext('2d');
    g.strokeStyle = col; g.lineWidth = 12; g.shadowColor = col; g.shadowBlur = 18; g.globalAlpha = 0.9;
    U_rr(g, 16, 16, c.width - 32, c.height - 32, 40); g.stroke(); g.shadowBlur = 0; g.globalAlpha = 1;
    neonText(g, text, c.width / 2, c.height * (sub ? 0.4 : 0.5), Math.round(c.height * (sub ? 0.38 : 0.5)), col, c.width - 100);
    if (sub) { g.font = font(Math.round(c.height * 0.18)); g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.fillText(sub, c.width / 2, c.height * 0.76); }
    var m = mesh(plane(w, h), new T.MeshBasicMaterial({ map: canvasTex(c), transparent: true, depthWrite: false, opacity: 0.95 }), x, 0.02, z);
    m.rotation.x = -Math.PI / 2; m.rotation.z = rotY || 0; m.renderOrder = 1;
    return m;
  }
  function U_rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

  function buildSigns() {
    var s1 = sign('MAIN GAMES\nLizeth\'s Grok games', 7, 1.5, '#3ff0ff'); s1.position.set(-6.5, 3.75, ROOM.minZ + 0.03); scene.add(s1);
    var s2 = sign('BONUS ZONE\nNew mini games - earn tickets!', 7, 1.5, '#ff4fd8'); s2.position.set(ROOM.maxX - 0.03, 3.75, 0); s2.rotation.y = -Math.PI / 2; scene.add(s2);
    var s3 = sign('BONUS ZONE  >', 4.6, 1.2, '#ff4fd8'); s3.position.set(DIV_X - 0.23, 4.1, 0); s3.rotation.y = -Math.PI / 2; scene.add(s3);
    var s3b = sign('< MAIN GAMES', 4.6, 1.2, '#3ff0ff'); s3b.position.set(DIV_X + 0.23, 4.1, 0); s3b.rotation.y = Math.PI / 2; scene.add(s3b);
    var s4 = sign('GROK ARCADE', 7, 1.4, '#ffe14d'); s4.position.set(ROOM.minX + 0.03, 3.4, 0); s4.rotation.y = Math.PI / 2; scene.add(s4);
    decal('MAIN GAMES', 7, 1.6, '#3ff0ff', -6.5, -7.2, 0, 'walk up to a cabinet to play');
    decal('BONUS ZONE', 6.4, 1.5, '#ff4fd8', 11.6, 0, Math.PI / 2, 'mini games - best scores saved');
    decal('BONUS  >>', 3.2, 1.1, '#ff4fd8', 3.2, 0, 0);
    // center logo rug
    var c = mkCanvas(512, 512), g = c.getContext('2d');
    var grd = g.createRadialGradient(256, 256, 40, 256, 256, 250); grd.addColorStop(0, 'rgba(255,79,216,0.55)'); grd.addColorStop(0.7, 'rgba(63,240,255,0.25)'); grd.addColorStop(1, 'rgba(63,240,255,0)');
    g.fillStyle = grd; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill();
    g.strokeStyle = '#3ff0ff'; g.lineWidth = 8; g.shadowColor = '#3ff0ff'; g.shadowBlur = 16; g.beginPath(); g.arc(256, 256, 220, 0, 7); g.stroke();
    g.strokeStyle = '#ff4fd8'; g.shadowColor = '#ff4fd8'; g.beginPath(); g.arc(256, 256, 190, 0, 7); g.stroke(); g.shadowBlur = 0;
    neonText(g, 'GROK', 256, 220, 96, '#3ff0ff'); neonText(g, 'ARCADE', 256, 310, 74, '#ff4fd8');
    var rug = mesh(plane(6, 6), new T.MeshBasicMaterial({ map: canvasTex(c), transparent: true, depthWrite: false }), -6, 0.015, 1.2); rug.rotation.x = -Math.PI / 2; rug.renderOrder = 1;
  }

  function scoreBoardDraw() {
    var d = dynTex.scores; if (!d) return; var g = d.ctx, W = d.c.width, H = d.c.height;
    g.fillStyle = '#140829'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#ffe14d'; g.lineWidth = 10; g.strokeRect(8, 8, W - 16, H - 16);
    neonText(g, 'BEST SCORES', W / 2, 62, 58, '#ffe14d');
    GA.BONUS_GAMES.forEach(function (gm, i) {
      var y = 140 + i * 70; g.font = font(42); g.textAlign = 'left'; g.fillStyle = gm.color; g.fillText(gm.name, 50, y);
      g.textAlign = 'right'; g.fillStyle = '#ffffff'; g.fillText(String(GA.getBest(gm.id)), W - 50, y);
    });
    d.tex.needsUpdate = true;
  }
  function ticketDraw() {
    var d = dynTex.tickets; if (!d) return; var g = d.ctx, W = d.c.width, H = d.c.height;
    g.fillStyle = '#1a0a33'; g.fillRect(0, 0, W, H); g.strokeStyle = '#ffe14d'; g.lineWidth = 10; g.strokeRect(8, 8, W - 16, H - 16);
    neonText(g, 'PRIZE COUNTER', W / 2, H * 0.32, 66, '#ff4fd8');
    neonText(g, 'TICKETS: ' + GA.getTickets(), W / 2, H * 0.72, 60, '#ffe14d');
    d.tex.needsUpdate = true;
  }
  Hub.refreshBoards = function () { scoreBoardDraw(); ticketDraw(); };

  function plant(x, z, s) {
    s = s || 1;
    mesh(cyl(0.38 * s, 0.3 * s, 0.6 * s, 10), lam('#ff7a3d'), x, 0.3 * s, z);
    mesh(cyl(0.4 * s, 0.4 * s, 0.06, 10), basic('#ffe14d'), x, 0.6 * s, z);
    var leaf = lam('#2fd47a'), leaf2 = lam('#1fa860');
    mesh(sph(0.45 * s, 8), leaf, x, 1.0 * s, z); mesh(sph(0.32 * s, 8), leaf2, x + 0.25 * s, 1.35 * s, z + 0.1); mesh(sph(0.3 * s, 8), leaf, x - 0.2 * s, 1.45 * s, z - 0.12);
    addSolid(x - 0.45 * s, x + 0.45 * s, z - 0.45 * s, z + 0.45 * s);
  }

  function buildDecor() {
    // Prize counter (south wall, main hall)
    var px = -6, pz = ROOM.maxZ - 1.6;
    mesh(box(6, 1.1, 1), lam('#7c3aed'), px, 0.55, pz);
    mesh(box(6.1, 0.08, 1.1), lam('#c084fc'), px, 1.14, pz);
    mesh(box(6, 0.08, 0.05), basic('#ffe14d'), px, 0.85, pz - 0.52);
    mesh(box(6, 0.08, 0.05), basic('#ff4fd8'), px, 0.3, pz - 0.52);
    addSolid(px - 3.05, px + 3.05, pz - 0.55, ROOM.maxZ);
    // shelves of plushies behind the counter
    mesh(box(6.4, 2.4, 0.5), lam('#2b1a55'), px, 1.2, ROOM.maxZ - 0.25);
    [0.75, 1.55, 2.3].forEach(function (y) { mesh(box(6.4, 0.06, 0.55), basic('#3ff0ff'), px, y - 0.32, ROOM.maxZ - 0.3); });
    var cols = ['#ff4fd8', '#3ff0ff', '#ffe14d', '#4ade80', '#fb923c', '#a78bfa', '#f8fafc'];
    for (var r = 0; r < 3; r++) for (var i = 0; i < 7; i++) {
      var y = [0.75, 1.55, 2.3][r] - 0.32 + 0.22, x = px - 2.7 + i * 0.9 + (r % 2) * 0.2;
      var m = mesh(sph(0.2, 10), lam(cols[(i + r * 2) % cols.length]), x, y, ROOM.maxZ - 0.35);
      if ((i + r) % 3 === 0) { mesh(sph(0.08, 6), lam(cols[(i + r * 2) % cols.length]), x - 0.13, y + 0.17, ROOM.maxZ - 0.35); mesh(sph(0.08, 6), lam(cols[(i + r * 2) % cols.length]), x + 0.13, y + 0.17, ROOM.maxZ - 0.35); }
    }
    // ticket display sign (dynamic)
    var c = mkCanvas(1024, 300); dynTex.tickets = { c: c, ctx: c.getContext('2d'), tex: canvasTex(c) };
    var ts = mesh(plane(5, 1.46), new T.MeshBasicMaterial({ map: dynTex.tickets.tex }), px, 3.35, ROOM.maxZ - 0.03); ts.rotation.y = Math.PI;
    ticketDraw();

    // Best scores board in the bonus zone (north wall)
    var c2 = mkCanvas(768, 520); dynTex.scores = { c: c2, ctx: c2.getContext('2d'), tex: canvasTex(c2) };
    var sb = mesh(plane(4.4, 3), new T.MeshBasicMaterial({ map: dynTex.scores.tex }), 11.6, 2.4, ROOM.minZ + 0.03);
    scoreBoardDraw();
    // a ticket machine next to scoreboard
    var tmx = 8.0, tmz = ROOM.minZ + 0.6;
    mesh(box(1.0, 1.8, 0.8), lam('#ff4fd8'), tmx, 0.9, tmz); mesh(plane(0.7, 0.5), basic('#ffe14d'), tmx, 1.3, tmz + 0.41);
    mesh(box(0.8, 0.12, 0.1), basic('#3ff0ff'), tmx, 0.7, tmz + 0.42);
    addSolid(tmx - 0.55, tmx + 0.55, ROOM.minZ, tmz + 0.45);

    // claw machine (main hall, near prize counter)
    var cx = 1.8, cz = ROOM.maxZ - 1.4;
    mesh(box(1.5, 1.0, 1.5), lam('#0ea5e9'), cx, 0.5, cz);
    var glass = new T.MeshBasicMaterial({ color: '#9ff7ff', transparent: true, opacity: 0.18, depthWrite: false });
    mesh(box(1.4, 1.3, 1.4), glass, cx, 1.65, cz);
    mesh(box(1.5, 0.35, 1.5), lam('#ff4fd8'), cx, 2.47, cz);
    for (var k = 0; k < 6; k++) mesh(sph(0.18, 8), lam(cols[k]), cx - 0.4 + (k % 3) * 0.4, 1.15, cz - 0.3 + Math.floor(k / 3) * 0.5);
    var claw = mesh(cyl(0.03, 0.03, 0.6, 6), basic('#e5e7eb'), cx, 2.0, cz); var clawHead = mesh(sph(0.1, 8), basic('#ffe14d'), cx, 1.7, cz);
    anims.push(function (t) { var ox = Math.sin(t * 0.7) * 0.4, oz = Math.cos(t * 0.5) * 0.4; claw.position.set(cx + ox, 2.0, cz + oz); clawHead.position.set(cx + ox, 1.7 + Math.sin(t * 1.3) * 0.1, cz + oz); });
    var cs = sign('CLAW', 1.4, 0.34, '#ffe14d'); cs.position.set(cx, 2.47, cz - 0.76); cs.rotation.y = Math.PI; scene.add(cs);
    addSolid(cx - 0.8, cx + 0.8, cz - 0.8, cz + 0.8);

    // comfy couch on the west wall
    var sx = ROOM.minX + 0.7, sz = 4;
    mesh(box(1.0, 0.5, 3.2), lam('#db2777'), sx, 0.25, sz); mesh(box(0.35, 1.1, 3.2), lam('#be185d'), sx - 0.4, 0.55, sz);
    mesh(box(1.0, 0.75, 0.3), lam('#be185d'), sx, 0.38, sz - 1.6); mesh(box(1.0, 0.75, 0.3), lam('#be185d'), sx, 0.38, sz + 1.6);
    mesh(box(0.25, 0.4, 0.6), lam('#3ff0ff'), sx, 0.68, sz - 0.6); mesh(box(0.25, 0.4, 0.6), lam('#ffe14d'), sx, 0.68, sz + 0.7);
    addSolid(ROOM.minX, sx + 0.55, sz - 1.8, sz + 1.8);

    // plants
    plant(ROOM.minX + 0.8, ROOM.minZ + 0.8, 1.1); plant(ROOM.minX + 0.8, ROOM.maxZ - 0.8, 1.1);
    plant(DIV_X - 0.9, ROOM.maxZ - 0.8, 1); plant(DIV_X + 0.9, ROOM.maxZ - 0.8, 1); plant(ROOM.maxX - 0.8, ROOM.maxZ - 0.8, 1.1);
    plant(DIV_X - 0.9, -DOOR - 0.7, 0.8); plant(DIV_X - 0.9, DOOR + 0.7, 0.8);

    // bonus-zone stools / bean bags
    [[10.5, 6.5, '#3ff0ff'], [12, 7.5, '#ffe14d'], [10.2, -6.5, '#a78bfa']].forEach(function (b) {
      var m = mesh(sph(0.55, 12), lam(b[2]), b[0], 0.35, b[1]); m.scale.set(1, 0.65, 1); addSolid(b[0] - 0.5, b[0] + 0.5, b[1] - 0.5, b[1] + 0.5);
    });

    // floating neon shapes (cheap animated decor)
    var tor = mesh(new T.TorusGeometry(0.7, 0.08, 8, 32), basic('#ff4fd8'), -14.5, 3.4, 8.5);
    var oct = mesh(new T.OctahedronGeometry(0.45), basic('#3ff0ff'), -14.5, 3.4, 8.5);
    var star = mesh(new T.IcosahedronGeometry(0.35), basic('#ffe14d'), 12, 3.6, 0);
    anims.push(function (t) { tor.rotation.y = t * 0.8; tor.rotation.x = Math.sin(t * 0.5) * 0.4; oct.rotation.y = -t * 1.2; oct.position.y = 3.4 + Math.sin(t * 1.5) * 0.12; star.rotation.y = t; star.rotation.x = t * 0.6; star.position.y = 3.6 + Math.sin(t * 2) * 0.15; });

    // wall posters
    var p1 = sign('INSERT FUN', 2.4, 0.8, '#4ade80'); p1.position.set(ROOM.minX + 0.03, 2.2, -6); p1.rotation.y = Math.PI / 2; scene.add(p1);
    var p2 = sign('HIGH SCORE\nLIZETH', 2.2, 1.0, '#fb923c'); p2.position.set(ROOM.minX + 0.03, 2.2, 8.6); p2.rotation.y = Math.PI / 2; scene.add(p2);
    var p3 = sign('LUNA  PI-RAT  SNOWIE\nofficial arcade rats', 3.4, 1.0, '#ff8fd0'); p3.position.set(15, 2.4, ROOM.maxZ - 0.03); p3.rotation.y = Math.PI; scene.add(p3);
    // little rat portrait poster
    var rc = mkCanvas(512, 256), rg = rc.getContext('2d'); rg.fillStyle = '#2a1150'; rg.fillRect(0, 0, 512, 256); rg.strokeStyle = '#ff8fd0'; rg.lineWidth = 10; rg.strokeRect(5, 5, 502, 246);
    if (GA.drawRat) { GA.drawRat(rg, 'luna', 100, 120, 130, false); GA.drawRat(rg, 'pirat', 256, 120, 130, false); GA.drawRat(rg, 'snowie', 412, 120, 130, false); }
    var rp = mesh(plane(3.2, 1.6), new T.MeshBasicMaterial({ map: canvasTex(rc) }), 15, 1.0 + 0.3, ROOM.maxZ - 0.03); rp.rotation.y = Math.PI; rp.position.y = 1.2;
    p3.position.y = 2.6;
  }

  /* ---------- attract-mode screens ---------- */
  function attract(id, g, w, h, t, game) {
    var i, x, y;
    g.save();
    switch (id) {
      case 'sky': {
        var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#38bdf8'); gr.addColorStop(1, '#bae6fd'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.fillStyle = '#fde047'; g.beginPath(); g.arc(w * 0.82, h * 0.2, 14, 0, 7); g.fill();
        g.fillStyle = '#fff'; for (i = 0; i < 4; i++) { x = ((i * 70 - t * 30) % (w + 80) + w + 80) % (w + 80) - 40; g.fillRect(x, 20 + i * 14, 40, 10); g.fillRect(x + 8, 14 + i * 14, 22, 8); }
        g.fillStyle = '#475569'; for (i = 0; i < 12; i++) { var bh = 18 + ((i * 37) % 30); x = ((i * 18 - t * 12) % (w + 20) + w + 20) % (w + 20) - 18; g.fillRect(x, h - bh, 15, bh); }
        y = h * 0.45 + Math.sin(t * 2) * 6; x = w * 0.4;
        g.fillStyle = '#f8fafc'; g.fillRect(x - 30, y - 5, 60, 10); g.fillStyle = '#e11d48'; g.fillRect(x - 6, y - 2, 18, 22); g.fillRect(x - 6, y - 20, 18, 18); g.fillRect(x - 30, y - 14, 8, 10);
        g.fillStyle = '#0ea5e9'; for (i = 0; i < 5; i++) g.fillRect(x - 18 + i * 9, y - 3, 4, 3);
        break;
      }
      case 'land': {
        g.fillStyle = '#7dd3fc'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#22c55e'; g.fillRect(0, h - 22, w, 22);
        var plats = [[20, 95], [80, 75], [140, 55]];
        plats.forEach(function (p) { g.fillStyle = '#a16207'; g.fillRect(p[0], p[1], 46, 10); g.fillStyle = '#4ade80'; g.fillRect(p[0], p[1] - 4, 46, 5); });
        var ph = (t * 0.7) % 1, idx = Math.floor((t * 0.7) % 3), a = plats[idx], b = plats[(idx + 1) % 3];
        x = a[0] + 23 + (b[0] - a[0]) * ph; y = a[1] - 12 + (b[1] - a[1]) * ph - Math.sin(ph * Math.PI) * 30;
        g.fillStyle = '#f97316'; g.fillRect(x - 6, y - 8, 12, 14); g.fillStyle = '#fff'; g.fillRect(x - 3, y - 5, 3, 3); g.fillRect(x + 2, y - 5, 3, 3);
        g.fillStyle = '#facc15'; var cw = Math.abs(Math.sin(t * 4)) * 8 + 1; g.fillRect(160 - cw / 2, 25, cw, 12);
        break;
      }
      case 'grid': {
        g.fillStyle = '#15803d'; g.fillRect(0, 0, w, h); g.fillStyle = '#374151'; g.fillRect(w * 0.18, 0, w * 0.64, h);
        for (i = 0; i < 10; i++) { y = ((i * 20 + t * 140) % 200) - 20; g.fillStyle = i % 2 ? '#ef4444' : '#fff'; g.fillRect(w * 0.18 - 6, y, 6, 10); g.fillRect(w * 0.82, y, 6, 10); g.fillStyle = '#fff'; if (i % 2) g.fillRect(w / 2 - 2, y, 4, 12); }
        function car(cx, cy, col) { g.fillStyle = col; g.fillRect(cx - 7, cy - 14, 14, 28); g.fillStyle = '#111'; g.fillRect(cx - 11, cy - 11, 4, 7); g.fillRect(cx + 7, cy - 11, 4, 7); g.fillRect(cx - 11, cy + 5, 4, 7); g.fillRect(cx + 7, cy + 5, 4, 7); g.fillStyle = '#fff'; g.fillRect(cx - 8, cy - 18, 16, 4); }
        car(w * 0.38 + Math.sin(t * 1.3) * 10, h * 0.55, '#f43f5e'); car(w * 0.62 + Math.sin(t * 1.1 + 1) * 10, h * 0.62 + Math.sin(t * 0.8) * 12, '#3b82f6');
        for (i = 0; i < 8; i++) { g.fillStyle = (i % 2) ? '#000' : '#fff'; g.fillRect(w * 0.18 + i * (w * 0.08), (t * 140) % 200 - 30, w * 0.08, 6); }
        break;
      }
      case 'voxels': {
        g.fillStyle = '#1e1b4b'; g.fillRect(0, 0, w, h);
        for (i = 0; i < 14; i++) { var bx = ((i * 41 + t * 20) % (w + 30)) - 30, by = h - 20 - (i % 4) * 16; g.fillStyle = ['#a855f7', '#7c3aed', '#22d3ee', '#4c1d95'][i % 4]; g.fillRect(bx, by, 16, 16); g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(bx, by, 16, 3); }
        for (i = 0; i < 3; i++) { x = w * (0.25 + i * 0.25) + Math.sin(t * 2 + i) * 14; y = h * 0.35 + Math.cos(t * 1.7 + i) * 8; g.fillStyle = '#ef4444'; g.fillRect(x - 9, y - 9, 18, 18); g.fillStyle = '#fff'; g.fillRect(x - 5, y - 4, 4, 4); g.fillRect(x + 2, y - 4, 4, 4); }
        g.strokeStyle = '#22d3ee'; g.lineWidth = 2; x = w / 2 + Math.sin(t * 1.5) * 30; y = h * 0.4; g.beginPath(); g.arc(x, y, 12, 0, 7); g.moveTo(x - 18, y); g.lineTo(x + 18, y); g.moveTo(x, y - 18); g.lineTo(x, y + 18); g.stroke();
        if (Math.sin(t * 7) > 0.8) { g.fillStyle = '#fde047'; g.beginPath(); g.arc(w / 2, h - 8, 10, 0, 7); g.fill(); }
        break;
      }
      case 'surfers': {
        g.fillStyle = '#fdba74'; g.fillRect(0, 0, w, h); g.fillStyle = '#7c2d12'; g.beginPath(); g.moveTo(w * 0.42, 20); g.lineTo(w * 0.58, 20); g.lineTo(w, h); g.lineTo(0, h); g.fill();
        g.strokeStyle = '#fef3c7'; g.lineWidth = 2; g.beginPath(); g.moveTo(w * 0.47, 20); g.lineTo(w * 0.33, h); g.moveTo(w * 0.53, 20); g.lineTo(w * 0.67, h); g.stroke();
        for (i = 0; i < 6; i++) { var p = ((i / 6 + t * 0.6) % 1), py = 20 + p * p * (h - 20), sc = 0.2 + p; g.fillStyle = '#facc15'; g.beginPath(); g.arc(w / 2 + (i % 3 - 1) * 30 * sc, py, 4 * sc + 1, 0, 7); g.fill(); }
        var lane = Math.floor(t * 0.8) % 3 - 1, jy = Math.abs(Math.sin(t * 3)) * 10;
        x = w / 2 + lane * 36; g.fillStyle = '#2563eb'; g.fillRect(x - 7, h - 40 - jy, 14, 18); g.fillStyle = '#fcd34d'; g.fillRect(x - 6, h - 52 - jy, 12, 12); g.fillStyle = '#111'; g.fillRect(x - 7, h - 22 - jy, 5, 8); g.fillRect(x + 2, h - 22 - jy, 5, 8);
        break;
      }
      case 'fc': {
        g.fillStyle = '#16a34a'; g.fillRect(0, 0, w, h); for (i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#15803d' : '#16a34a'; g.fillRect(i * w / 6, 0, w / 6, h); }
        g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(6, 6, w - 12, h - 12); g.beginPath(); g.moveTo(w / 2, 6); g.lineTo(w / 2, h - 6); g.stroke(); g.beginPath(); g.arc(w / 2, h / 2, 18, 0, 7); g.stroke();
        g.strokeRect(w - 20, h / 2 - 18, 14, 36);
        var ph2 = (t * 0.5) % 1; x = 30 + ph2 * (w - 50); y = h / 2 + Math.sin(ph2 * 9) * 25;
        g.fillStyle = '#3b82f6'; g.fillRect(x - 30, y - 8, 10, 16); g.fillStyle = '#ef4444'; g.fillRect(w - 40, h / 2 - 8 + Math.sin(t * 3) * 10, 10, 16);
        g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill();
        if (ph2 > 0.85) { g.font = font(26); g.textAlign = 'center'; g.fillStyle = '#fde047'; g.fillText('GOAL!', w / 2, 40); }
        break;
      }
      case 'snake': {
        g.fillStyle = '#150a33'; g.fillRect(0, 0, w, h); var cs = 12;
        for (i = 0; i < 9; i++) { var pp = (t * 8 - i) , k = ((pp % 40) + 40) % 40, sx2, sy2;
          if (k < 12) { sx2 = 2 + k; sy2 = 2; } else if (k < 20) { sx2 = 14; sy2 = 2 + (k - 12); } else if (k < 32) { sx2 = 14 - (k - 20); sy2 = 10; } else { sx2 = 2; sy2 = 10 - (k - 32); }
          g.fillStyle = 'hsl(' + (140 + i * 6) + ',90%,' + (i ? 50 : 65) + '%)'; g.fillRect(sx2 * cs, sy2 * cs, cs - 2, cs - 2); }
        g.fillStyle = '#ff4fd8'; g.beginPath(); g.arc(8.5 * cs, 6.5 * cs, 5, 0, 7); g.fill();
        break;
      }
      case 'bricks': {
        g.fillStyle = '#0b0520'; g.fillRect(0, 0, w, h); var cl = ['#ff4fd8', '#ff7a3d', '#ffe14d', '#4ade80'];
        for (var r = 0; r < 4; r++) for (var c = 0; c < 8; c++) if (!((r * 8 + c + Math.floor(t)) % 7 === 0)) { g.fillStyle = cl[r]; g.fillRect(4 + c * 23, 10 + r * 11, 20, 8); }
        var bxx = w / 2 + Math.sin(t * 2.1) * (w / 2 - 10), byy = h * 0.55 + Math.sin(t * 3.3) * h * 0.25;
        g.fillStyle = '#ffe14d'; g.beginPath(); g.arc(bxx, byy, 4, 0, 7); g.fill(); g.fillStyle = '#3ff0ff'; g.fillRect(bxx - 18, h - 14, 36, 6);
        break;
      }
      case 'jet': {
        var gj = g.createLinearGradient(0, 0, 0, h); gj.addColorStop(0, '#1a0b45'); gj.addColorStop(1, '#ff5fa8'); g.fillStyle = gj; g.fillRect(0, 0, w, h);
        for (i = 0; i < 3; i++) { x = ((i * 70 - t * 50) % 210 + 210) % 210 - 20; var gy = 40 + ((i * 53) % 50); g.fillStyle = '#3ff0ff'; g.fillRect(x, 0, 18, gy); g.fillRect(x, gy + 50, 18, h); }
        y = h / 2 + Math.sin(t * 3) * 18; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(50, y, 12, 7, 0, 0, 7); g.fill(); g.fillStyle = '#ffb020'; g.fillRect(34, y - 2, 6, 4);
        break;
      }
      case 'rats': {
        g.fillStyle = '#2a1150'; g.fillRect(0, 0, w, h);
        var types = ['luna', 'pirat', 'snowie'];
        for (i = 0; i < 3; i++) {
          var hx = 32 + i * 64, hy = h * 0.72, up = Math.max(0, Math.sin(t * 2 + i * 2.1));
          g.fillStyle = '#12061f'; g.beginPath(); g.ellipse(hx, hy, 24, 7, 0, 0, 7); g.fill();
          if (up > 0.05 && GA.drawRat) { g.save(); g.beginPath(); g.rect(hx - 32, 0, 64, hy); g.clip(); GA.drawRat(g, types[i], hx, hy + 8 - up * 40, 42, up > 0.9); g.restore(); }
        }
        break;
      }
      case 'stack': {
        g.fillStyle = '#1e1036'; g.fillRect(0, 0, w, h); var n = Math.floor(t * 1.5) % 9;
        for (i = 0; i <= n; i++) { var ww = 90 - i * 4; g.fillStyle = 'hsl(' + (200 + i * 15) + ',85%,55%)'; g.fillRect(w / 2 - ww / 2 + (i === n ? Math.sin(t * 4) * 40 : 0), h - 12 - i * 12, ww, 11); }
        break;
      }
    }
    g.restore();
    // blinking footer
    if (Math.floor(t * 2) % 2 === 0) { g.font = font(15); g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, h - 22, w, 22); g.fillStyle = '#fff'; g.fillText(game.kind === 'bonus' ? 'PRESS PLAY' : 'INSERT COIN', w / 2, h - 6); }
    // scanlines
    g.fillStyle = 'rgba(0,0,0,0.12)'; for (var s = 0; s < h; s += 4) g.fillRect(0, s, w, 1);
  }

  /* ---------- cabinets ---------- */
  var cabBodyMat, glowTex;
  function buildCabinet(game, kind, x, z, rot) {
    var grp = new T.Group(); grp.position.set(x, 0, z); grp.rotation.y = rot; scene.add(grp);
    var col = game.color;
    mesh(box(1.3, 2.3, 1.0), cabBodyMat, 0, 1.15, 0, grp);
    mesh(box(0.07, 2.36, 1.04), basic(col), -0.68, 1.18, 0, grp);
    mesh(box(0.07, 2.36, 1.04), basic(col), 0.68, 1.18, 0, grp);
    mesh(box(1.42, 0.08, 1.08), basic(col), 0, 2.36, 0, grp);
    // marquee
    var mc = mkCanvas(512, 160), mg = mc.getContext('2d');
    var gr = mg.createLinearGradient(0, 0, 0, 160); gr.addColorStop(0, '#1a0b3a'); gr.addColorStop(1, '#2d1460'); mg.fillStyle = gr; mg.fillRect(0, 0, 512, 160);
    mg.strokeStyle = col; mg.lineWidth = 8; mg.strokeRect(6, 6, 500, 148);
    neonText(mg, game.name.toUpperCase(), 256, 84, 72, col, 470);
    var mq = mesh(plane(1.26, 0.4), new T.MeshBasicMaterial({ map: canvasTex(mc) }), 0, 2.08, 0.505, grp);
    // screen bezel + screen
    mesh(box(1.1, 0.88, 0.04), basic('#05020c'), 0, 1.47, 0.5, grp);
    var sc = mkCanvas(192, 144), sg = sc.getContext('2d'), stex = canvasTex(sc); stex.minFilter = T.LinearFilter; stex.generateMipmaps = false;
    var scr = mesh(plane(0.98, 0.74), new T.MeshBasicMaterial({ map: stex }), 0, 1.47, 0.525, grp);
    // control panel
    var cp = mesh(box(1.3, 0.14, 0.55), lam(col), 0, 1.0, 0.72, grp); cp.rotation.x = 0.32;
    mesh(box(1.26, 0.9, 0.3), cabBodyMat, 0, 0.5, 0.62, grp);
    mesh(cyl(0.025, 0.025, 0.16, 6), basic('#111111'), -0.3, 1.13, 0.68, grp);
    mesh(sph(0.06, 8), basic('#ff3d5a'), -0.3, 1.22, 0.68, grp);
    mesh(cyl(0.055, 0.055, 0.05, 10), basic('#ffe14d'), 0.15, 1.1, 0.72, grp);
    mesh(cyl(0.055, 0.055, 0.05, 10), basic('#3ff0ff'), 0.35, 1.08, 0.78, grp);
    mesh(box(1.1, 0.06, 0.02), basic(col), 0, 0.35, 0.775, grp);
    // floor glow
    var gm = new T.MeshBasicMaterial({ map: glowTex, color: col, transparent: true, opacity: 0.35, depthWrite: false, blending: T.AdditiveBlending });
    var glow = mesh(plane(2.0, 1.8), gm, 0, 0.025, 1.45, grp); glow.rotation.x = -Math.PI / 2; glow.renderOrder = 2;

    grp.updateMatrixWorld(true);
    // collider from rotated local bounds
    var pts = [[-0.72, -0.52], [0.72, -0.52], [-0.72, 0.95], [0.72, 0.95]].map(function (p) { return new T.Vector3(p[0], 0, p[1]).applyMatrix4(grp.matrixWorld); });
    addSolid(Math.min.apply(null, pts.map(function (p) { return p.x; })), Math.max.apply(null, pts.map(function (p) { return p.x; })),
      Math.min.apply(null, pts.map(function (p) { return p.z; })), Math.max.apply(null, pts.map(function (p) { return p.z; })));
    var front = new T.Vector3(0, 0, 1.75).applyMatrix4(grp.matrixWorld);
    var dir = new T.Vector3(Math.sin(rot), 0, Math.cos(rot));
    var cab = { game: game, kind: kind, id: game.id, group: grp, x: x, z: z, rot: rot, front: front, dir: dir, sctx: sg, stex: stex, glow: gm, nextDraw: 0, w: 192, h: 144 };
    cabinets.push(cab);
    attract(game.id, sg, 192, 144, Math.random() * 10, cab); stex.needsUpdate = true;
    return cab;
  }
  function buildCabinets() {
    cabBodyMat = lam('#1c1236');
    var gc = mkCanvas(128, 128), g = gc.getContext('2d'), grd = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    glowTex = canvasTex(gc);
    // main games: along the north wall, facing south
    GA.MAIN_GAMES.forEach(function (gm, i) { buildCabinet(gm, 'main', -15 + i * 3.4, ROOM.minZ + 0.6, 0); });
    // bonus games: along the east wall of the bonus room, facing west
    GA.BONUS_GAMES.forEach(function (gm, i) { buildCabinet(gm, 'bonus', ROOM.maxX - 0.6, -8 + i * 4, -Math.PI / 2); });
  }

  /* ---------- player character ---------- */
  function buildPlayer() {
    player = new T.Group(); scene.add(player);
    var body = new T.Group(); player.add(body); parts.body = body;
    var hoodie = lam('#ff8a1f'), skin = lam('#ffd9b8'), pants = lam('#2f5bea'), white = lam('#ffffff'), dark = basic('#1b1030');
    // legs
    parts.legL = new T.Group(); parts.legR = new T.Group(); parts.legL.position.set(-0.14, 0.62, 0); parts.legR.position.set(0.14, 0.62, 0);
    body.add(parts.legL); body.add(parts.legR);
    [parts.legL, parts.legR].forEach(function (l) { mesh(box(0.2, 0.52, 0.22), pants, 0, -0.28, 0, l); mesh(box(0.24, 0.14, 0.32), white, 0, -0.56, 0.04, l); });
    // torso
    mesh(box(0.56, 0.6, 0.36), hoodie, 0, 0.92, 0, body);
    mesh(box(0.5, 0.08, 0.02), basic('#3ff0ff'), 0, 0.98, 0.19, body);
    // arms
    parts.armL = new T.Group(); parts.armR = new T.Group(); parts.armL.position.set(-0.36, 1.16, 0); parts.armR.position.set(0.36, 1.16, 0);
    body.add(parts.armL); body.add(parts.armR);
    [parts.armL, parts.armR].forEach(function (a) { mesh(box(0.16, 0.48, 0.18), hoodie, 0, -0.22, 0, a); mesh(sph(0.1, 8), skin, 0, -0.5, 0, a); });
    // head
    var head = new T.Group(); head.position.set(0, 1.5, 0); body.add(head); parts.head = head;
    mesh(sph(0.3, 16), skin, 0, 0, 0, head);
    var hair = mesh(sph(0.315, 16), lam('#3b1f14'), 0, 0.06, -0.04, head); hair.scale.set(1, 0.85, 1);
    mesh(sph(0.055, 8), dark, -0.11, 0.0, 0.27, head); mesh(sph(0.055, 8), dark, 0.11, 0.0, 0.27, head);
    mesh(sph(0.02, 6), white, -0.095, 0.02, 0.32, head); mesh(sph(0.02, 6), white, 0.125, 0.02, 0.32, head);
    mesh(box(0.1, 0.025, 0.02), basic('#d9465f'), 0, -0.12, 0.29, head);
    mesh(sph(0.04, 6), basic('#ff9eb4'), -0.18, -0.07, 0.24, head); mesh(sph(0.04, 6), basic('#ff9eb4'), 0.18, -0.07, 0.24, head);
    // cap with neon brim
    var cap = mesh(sph(0.32, 14), lam('#ff4fd8'), 0, 0.15, -0.01, head); cap.scale.set(1.08, 0.62, 1.08);
    mesh(box(0.42, 0.04, 0.26), basic('#3ff0ff'), 0, 0.15, 0.31, head);
    // headphones
    mesh(box(0.06, 0.16, 0.16), basic('#3ff0ff'), -0.31, 0, 0, head); mesh(box(0.06, 0.16, 0.16), basic('#3ff0ff'), 0.31, 0, 0, head);
    // ground ring + blob shadow
    var sc = mkCanvas(64, 64), sg = sc.getContext('2d'), grd = sg.createRadialGradient(32, 32, 4, 32, 32, 30);
    grd.addColorStop(0, 'rgba(0,0,0,0.6)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = grd; sg.fillRect(0, 0, 64, 64);
    var sh = mesh(plane(1.2, 1.2), new T.MeshBasicMaterial({ map: canvasTex(sc), transparent: true, depthWrite: false }), 0, 0.03, 0, player); sh.rotation.x = -Math.PI / 2; sh.renderOrder = 3;
    ring = mesh(new T.RingGeometry(0.48, 0.56, 32), new T.MeshBasicMaterial({ color: '#3ff0ff', transparent: true, opacity: 0.8, depthWrite: false }), 0, 0.04, 0, player);
    ring.rotation.x = -Math.PI / 2; ring.renderOrder = 3;
    player.scale.setScalar(1.05);
  }

  /* ---------- collisions ---------- */
  function collide(x, z) {
    for (var it = 0; it < 3; it++) {
      for (var i = 0; i < solids.length; i++) {
        var b = solids[i];
        var cx = Math.max(b.minX, Math.min(x, b.maxX)), cz = Math.max(b.minZ, Math.min(z, b.maxZ));
        var dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
        if (d2 < PR * PR) {
          if (d2 > 1e-8) { var d = Math.sqrt(d2), push = PR - d; x += dx / d * push; z += dz / d * push; }
          else { // center inside the box: push out along shortest axis
            var l = x - b.minX, r = b.maxX - x, f = z - b.minZ, k = b.maxZ - z, m = Math.min(l, r, f, k);
            if (m === l) x = b.minX - PR; else if (m === r) x = b.maxX + PR; else if (m === f) z = b.minZ - PR; else z = b.maxZ + PR;
          }
        }
      }
    }
    return { x: x, z: z };
  }
  function inWall(x, y, z, pad) {
    for (var i = 0; i < walls.length; i++) { var w = walls[i]; if (x > w.minX - pad && x < w.maxX + pad && y > w.minY - pad && y < w.maxY + pad && z > w.minZ - pad && z < w.maxZ + pad) return true; }
    return false;
  }

  /* ---------- input ---------- */
  function setupInput() {
    window.addEventListener('keydown', function (e) {
      if (!enabled || paused) return;
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (GA.UI && GA.UI.menuOpen()) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(k) >= 0) e.preventDefault();
      if ((k === 'e' || k === 'Enter') && !e.repeat && near) { e.preventDefault(); if (k === 'e') eTurnBlock = true; if (GA.interact) GA.interact(near); return; }
      keys[k] = true;
    });
    window.addEventListener('keyup', function (e) { var k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys[k] = false; if (k === 'e') eTurnBlock = false; });
    window.addEventListener('blur', function () { keys = {}; joy.id = null; look.id = null; mouse.down = false; resetJoy(); });

    var joyEl = document.getElementById('joy'), knob = document.getElementById('joyKnob');
    function resetJoy() { joy.x = joy.y = 0; if (joyEl) { joyEl.style.left = ''; joyEl.style.top = ''; joyEl.style.bottom = ''; } if (knob) knob.style.transform = ''; }
    Hub._resetJoy = resetJoy;
    canvas.addEventListener('pointerdown', function (e) {
      if (!enabled || paused) return;
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        if (!document.body.classList.contains('touch')) document.body.classList.add('touch');
        e.preventDefault();
        if (e.clientX < window.innerWidth * 0.45 && joy.id === null) {
          joy.id = e.pointerId; var R = 70;
          joy.cx = Math.max(R + 8, Math.min(e.clientX, window.innerWidth * 0.45)); joy.cy = Math.max(R + 80, Math.min(e.clientY, window.innerHeight - R - 8));
          joyEl.style.left = (joy.cx - R) + 'px'; joyEl.style.top = (joy.cy - R) + 'px'; joyEl.style.bottom = 'auto';
          updJoy(e.clientX, e.clientY);
        } else if (look.id === null) { look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; }
        try { canvas.setPointerCapture(e.pointerId); } catch (er) {}
      } else { mouse.down = true; mouse.x = e.clientX; mouse.y = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (er) {} }
    });
    function updJoy(x, y) {
      var dx = x - joy.cx, dy = y - joy.cy, d = Math.hypot(dx, dy), R = 60;
      if (d > R) { dx *= R / d; dy *= R / d; }
      knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      var nx = dx / R, ny = -dy / R, m = Math.hypot(nx, ny);
      if (m < 0.12) { nx = ny = 0; }
      joy.x = nx; joy.y = ny;
    }
    canvas.addEventListener('pointermove', function (e) {
      if (e.pointerId === joy.id) { updJoy(e.clientX, e.clientY); return; }
      if (e.pointerId === look.id) { C.yaw -= (e.clientX - look.x) * 0.0085; C.pitch = clampP(C.pitch + (e.clientY - look.y) * 0.004); look.x = e.clientX; look.y = e.clientY; return; }
      if (mouse.down && e.pointerType === 'mouse') { C.yaw -= (e.clientX - mouse.x) * 0.006; C.pitch = clampP(C.pitch + (e.clientY - mouse.y) * 0.003); mouse.x = e.clientX; mouse.y = e.clientY; }
    });
    function up(e) {
      if (e.pointerId === joy.id) { joy.id = null; resetJoy(); }
      if (e.pointerId === look.id) look.id = null;
      if (e.pointerType === 'mouse') mouse.down = false;
    }
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    canvas.addEventListener('wheel', function (e) { e.preventDefault(); C.dist = Math.max(3.5, Math.min(9, C.dist + e.deltaY * 0.004)); }, { passive: false });
  }
  function clampP(p) { return Math.max(0.12, Math.min(0.85, p)); }

  /* ---------- update ---------- */
  function update(dt) {
    time += dt;
    var mx = 0, my = 0;
    if (enabled && !paused && !(GA.UI && GA.UI.menuOpen())) {
      if (keys.w || keys.ArrowUp) my += 1; if (keys.s || keys.ArrowDown) my -= 1;
      if (keys.a || keys.ArrowLeft) mx -= 1; if (keys.d || keys.ArrowRight) mx += 1;
      if (keys.q) C.yaw += 2.2 * dt; if (keys.e && !eTurnBlock) C.yaw -= 2.2 * dt;
      mx += joy.x; my += joy.y;
    }
    var mag = Math.hypot(mx, my); if (mag > 1) { mx /= mag; my /= mag; mag = 1; }
    var fx = -Math.sin(C.yaw), fz = -Math.cos(C.yaw), rx = Math.cos(C.yaw), rz = -Math.sin(C.yaw);
    var vx = (fx * my + rx * mx), vz = (fz * my + rz * mx);
    var SPEED = 5.2;
    var target = mag * SPEED; P.speed += (target - P.speed) * Math.min(1, dt * 10);
    if (mag > 0.01) {
      var want = Math.atan2(vx, vz), dA = ((want - P.face + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      P.face += dA * Math.min(1, dt * 12);
      var vl = Math.hypot(vx, vz) || 1;
      var nx = P.x + vx / vl * P.speed * dt, nz = P.z + vz / vl * P.speed * dt;
      var r = collide(nx, nz); P.x = r.x; P.z = r.z;
    }
    // animate character
    var walk = Math.min(1, P.speed / SPEED);
    P.phase += dt * (4 + 7 * walk) * (walk > 0.05 ? 1 : 0);
    var sw = Math.sin(P.phase) * 0.7 * walk;
    player.position.set(P.x, 0, P.z); player.rotation.y = P.face;
    parts.legL.rotation.x = sw; parts.legR.rotation.x = -sw; parts.armL.rotation.x = -sw * 0.9; parts.armR.rotation.x = sw * 0.9;
    parts.body.position.y = Math.abs(Math.sin(P.phase)) * 0.06 * walk + (walk < 0.05 ? Math.sin(time * 2) * 0.015 : 0);
    parts.head.rotation.z = walk < 0.05 ? Math.sin(time * 1.3) * 0.05 : 0;
    ring.material.opacity = 0.55 + Math.sin(time * 4) * 0.25;

    // nearest cabinet
    var best = null, bd = 1e9;
    if (enabled) cabinets.forEach(function (c) {
      var dx = P.x - c.front.x, dz = P.z - c.front.z, d = Math.hypot(dx, dz);
      if (d < 1.45 && d < bd) { bd = d; best = c; }
    });
    if (best !== near) { near = best; if (Hub.onNear) Hub.onNear(near); }
    cabinets.forEach(function (c) { var o = c === near ? 0.8 + Math.sin(time * 6) * 0.2 : 0.3; c.glow.opacity += (o - c.glow.opacity) * Math.min(1, dt * 8); });

    // camera
    // when standing at a cabinet, lift the camera so the screen is visible above the character's head
    C.nb += ((near ? 1 : 0) - C.nb) * Math.min(1, dt * 3);
    var tx = P.x, ty = 1.35 + 0.75 * C.nb, tz = P.z;
    if (near) { tx += -near.dir.x * 0.6 * C.nb; tz += -near.dir.z * 0.6 * C.nb; }
    if (titleMode) { C.yaw += dt * 0.12; }
    var pitch = Math.min(0.95, C.pitch + 0.12 * C.nb);
    var cp = Math.cos(pitch), sp = Math.sin(pitch);
    var want = C.dist, step = 0.12, dd = 0.4;
    var bx = Math.sin(C.yaw) * cp, by = sp, bz = Math.cos(C.yaw) * cp;
    for (dd = 0.4; dd <= C.dist; dd += step) { if (inWall(tx + bx * dd, ty + by * dd, tz + bz * dd, 0.25)) { break; } }
    want = Math.min(C.dist, dd - step);
    C.cur += (want - C.cur) * Math.min(1, dt * (want < C.cur ? 20 : 4));
    camera.position.set(tx + bx * C.cur, ty + by * C.cur, tz + bz * C.cur);
    camera.lookAt(tx, ty + 0.25 - 0.3 * C.nb, tz);

    // attract screens (throttled, near ones faster)
    var now = time;
    cabinets.forEach(function (c) {
      if (now < c.nextDraw) return;
      var d = Math.hypot(P.x - c.x, P.z - c.z);
      c.nextDraw = now + (d < 9 ? 1 / 15 : d < 16 ? 1 / 6 : 0.5);
      attract(c.id, c.sctx, c.w, c.h, now, c); c.stex.needsUpdate = true;
    });
    for (var i = 0; i < anims.length; i++) anims[i](time);

    // area label
    var inBonus = P.x > DIV_X;
    if (inBonus !== Hub._inBonus) { Hub._inBonus = inBonus; if (Hub.onArea) Hub.onArea(inBonus); }
  }

  function frame(t) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, Math.max(0, (t - lastT) / 1000)); lastT = t;
    if (paused) return;
    update(dt);
    renderer.render(scene, camera);
  }

  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < h ? 70 : 58;
    C.dist = w < h ? 7.0 : 6.2;
    camera.updateProjectionMatrix();
  }

  /* ---------- public API ---------- */
  Hub.init = function (cv) {
    canvas = cv;
    var mobile = document.body.classList.contains('touch');
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: !mobile || (window.devicePixelRatio || 1) < 2, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.6 : 1.75));
    renderer.setClearColor('#140a2b');
    scene = new T.Scene();
    scene.fog = new T.Fog('#140a2b', 22, 48);
    camera = new T.PerspectiveCamera(58, 1, 0.1, 80);
    scene.add(new T.HemisphereLight('#d8ccff', '#4a2a6e', 0.85));
    scene.add(new T.AmbientLight('#ffffff', 0.25));
    var dl = new T.DirectionalLight('#ffffff', 0.55); dl.position.set(-4, 10, 6); scene.add(dl);
    buildRoom(); buildSigns(); buildDecor(); buildCabinets(); buildPlayer(); setupInput();
    // restore position when coming back from a main game
    var saved = null; try { saved = JSON.parse(sessionStorage.getItem('grokArcade.pos') || 'null'); } catch (e) {}
    if (saved && isFinite(saved.x) && isFinite(saved.z)) { P.x = saved.x; P.z = saved.z; P.face = saved.face || 0; Hub._startYaw = saved.yaw || 0; }
    else { Hub._startYaw = SPAWN.yaw; P.face = Math.PI; }
    window.addEventListener('resize', resize); resize();
    requestAnimationFrame(function (t) { lastT = t; frame(t); });
  };
  Hub.setEnabled = function (b) { enabled = b; titleMode = !b; if (b) { C.yaw = Hub._startYaw != null ? Hub._startYaw : C.yaw; } };
  Hub.setPaused = function (b) { paused = b; keys = {}; joy.id = null; look.id = null; mouse.down = false; if (Hub._resetJoy) Hub._resetJoy(); if (!b) lastT = performance.now(); };
  Hub.clearInput = function () { keys = {}; joy.x = joy.y = 0; joy.id = null; look.id = null; if (Hub._resetJoy) Hub._resetJoy(); };
  Hub.near = function () { return near; };
  Hub.cabinets = function () { return cabinets; };
  Hub.savePos = function () { try { sessionStorage.setItem('grokArcade.pos', JSON.stringify({ x: P.x, z: P.z, face: P.face, yaw: C.yaw })); } catch (e) {} };
  Hub.teleport = function (id) {
    var c = cabinets.find(function (k) { return k.id === id; }); if (!c) return false;
    var p = new T.Vector3(0, 0, 1.75).applyMatrix4(c.group.matrixWorld);
    P.x = p.x; P.z = p.z; P.speed = 0;
    P.face = Math.atan2(-c.dir.x, -c.dir.z); C.yaw = Math.atan2(c.dir.x, c.dir.z); C.cur = C.dist;
    return true;
  };
  Hub.home = function () { P.x = SPAWN.x; P.z = SPAWN.z; P.face = Math.PI; C.yaw = 0; };
  Hub.state = function () { return { x: +P.x.toFixed(2), z: +P.z.toFixed(2), face: +P.face.toFixed(2), yaw: +C.yaw.toFixed(2), near: near ? near.id : null, enabled: enabled, paused: paused, calls: renderer.info.render.calls, tris: renderer.info.render.triangles }; };
  Hub.setPlayer = function (x, z) { P.x = x; P.z = z; };
  Hub.cameraYaw = function (y) { if (y != null) C.yaw = y; return C.yaw; };
  Hub.renderer = function () { return renderer; };
  Hub.ROOM = ROOM; Hub.DIV_X = DIV_X;
})();
