/* Grok Arcade - 3D walkable hub (three.js r128) */
(function () {
  'use strict';
  var T = THREE;
  var Hub = GA.Hub = {};

  var ROOM = { minX: -18, maxX: 18, minZ: -12, maxZ: 12, h: 5 };
  var WING = { minX: 2, maxX: 18, minZ: ROOM.maxZ + 0.4, maxZ: 26, doorX: 10, doorHW: 1.5, doorH: 3.3 }; // Hall of Game Records wing behind the bonus zone's south wall
  var FOOD = { minX: ROOM.minX, maxX: WING.minX - 0.4, minZ: ROOM.maxZ + 0.4, maxZ: WING.maxZ, doorX: -11.6, doorHW: 1.5, doorH: 3.3 }; // Food Court behind the main hall's south wall (west of the Hall wing)
  var REGIONS = []; // far-away walk-in areas (rooftop deck, secret basement) registered by js/areas.js: {name,minX,maxX,minZ,maxZ,maxY,spawn:{x,z}}
  var DIV_X = 6, DOOR = 2.6, PR = 0.42; // divider wall x, half door width, player radius
  var MAIN_STEP = GA.MAIN_GAMES.length > 15 ? 1.48 : GA.MAIN_GAMES.length > 14 ? 1.55 : GA.MAIN_GAMES.length > 13 ? 1.66 : GA.MAIN_GAMES.length > 12 ? 1.78 : GA.MAIN_GAMES.length > 11 ? 1.95 : GA.MAIN_GAMES.length > 10 ? 2.1 : GA.MAIN_GAMES.length > 9 ? 2.3 : GA.MAIN_GAMES.length > 8 ? 2.5 : GA.MAIN_GAMES.length > 7 ? 2.8 : 3.2, MAIN_X0 = GA.MAIN_GAMES.length > 15 ? -17.22 : GA.MAIN_GAMES.length > 14 ? -16.95 : GA.MAIN_GAMES.length > 13 ? -17.0 : GA.MAIN_GAMES.length > 11 ? -16.9 : GA.MAIN_GAMES.length > 10 ? -16.5 : GA.MAIN_GAMES.length > 9 ? -16.2 : GA.MAIN_GAMES.length > 8 ? -15.6 : -6 - (GA.MAIN_GAMES.length - 1) * MAIN_STEP / 2; // main cabinets centred in the main hall (x -18..6)
  // more than 16 main cabinets: shrink them a little so they still fit side by side along the north wall (x -17.95..5.75), no overlaps
  var MAIN_K = 1; if (GA.MAIN_GAMES.length > 16) { MAIN_K = 23.7 / (1.44 * GA.MAIN_GAMES.length + 0.04 * (GA.MAIN_GAMES.length - 1)); MAIN_STEP = 1.48 * MAIN_K; MAIN_X0 = -17.95 + 0.72 * MAIN_K; }
  /* bonus cabinets stay full size: up to BONUS_EAST on the east wall, then a second row on the bonus room's north wall
     (under the raised BEST SCORES board), then a third row on the bonus side of the divider wall, clear of the doorway
     (room for 27). Only past that do the east-wall cabinets squeeze. */
  var BONUS_EAST = 15, BONUS_NORTH_X = [9.7, 11.2, 12.7, 14.2], BONUS_DIV_Z = [-9.2, -7.7, -6.2, -4.7, 4.7, 6.2, 7.7, 9.2];
  var BONUS_CAP = BONUS_EAST + BONUS_NORTH_X.length + BONUS_DIV_Z.length;
  var BONUS_K = 1, BONUS_STEP = 0; if (GA.wallBonus().length > BONUS_CAP) { var nE0 = GA.wallBonus().length - BONUS_CAP + BONUS_EAST; BONUS_K = 23.2 / (1.44 * nE0 + 0.04 * (nE0 - 1)); BONUS_STEP = 1.48 * BONUS_K; }
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
  var lock = false, camOv = null, camK = 0, camLast = null, tmpV = new T.Vector3(), tmpV2 = new T.Vector3(); // claw machine: locked walking + camera override

  /* ---------- helpers ---------- */
  var matCache = {}, geoCache = {};
  function lam(c) { var k = 'l' + c; return matCache[k] || (matCache[k] = new T.MeshLambertMaterial({ color: c })); }
  function basic(c) { var k = 'b' + c; return matCache[k] || (matCache[k] = new T.MeshBasicMaterial({ color: c })); }
  function box(w, h, d) { var k = 'x' + w + ',' + h + ',' + d; return geoCache[k] || (geoCache[k] = new T.BoxGeometry(w, h, d)); }
  function plane(w, h) { var k = 'p' + w + ',' + h; return geoCache[k] || (geoCache[k] = new T.PlaneGeometry(w, h)); }
  function cyl(rt, rb, h, s) { var k = 'c' + rt + ',' + rb + ',' + h + ',' + s; return geoCache[k] || (geoCache[k] = new T.CylinderGeometry(rt, rb, h, s || 12)); }
  function sph(r, s) { var k = 's' + r + ',' + s; return geoCache[k] || (geoCache[k] = new T.SphereGeometry(r, s || 14, Math.max(6, Math.floor((s || 14) * 0.7)))); }
  function mesh(geo, mat, x, y, z, parent) { var m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); (parent || curPar || scene).add(m); return m; }
  function rrF(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fill(); }
  function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function canvasTex(c) { var t = new T.CanvasTexture(c); t.anisotropy = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy() || 4) : 4; t.minFilter = T.LinearMipmapLinearFilter; return t; } // sharp signs at an angle (booth #20)
  function addSolid(minX, maxX, minZ, maxZ, name) { solids.push({ minX: minX, maxX: maxX, minZ: minZ, maxZ: maxZ, name: name || (curItem ? curItem.name : 'solid') }); }
  function addWall(minX, maxX, minY, maxY, minZ, maxZ) { walls.push({ minX: minX, maxX: maxX, minY: minY, maxY: maxY, minZ: minZ, maxZ: maxZ }); addSolid(minX, maxX, minZ, maxZ, 'wall'); }
  /* ---------- layout audit registry: every prop, cabinet, booth, counter and wall sign is registered with its real 3D bounds,
     so Hub.audit() can check that nothing clips into anything else, covers a sign, or blocks a walkway / cabinet spot. ---------- */
  var AUD = [], curPar = null, curItem = null;
  function noAud(m) { m.userData.noAudit = true; return m; }
  function boxOf(obj) {
    obj.updateMatrixWorld(true); var bb = new T.Box3(), tmp = new T.Box3();
    obj.traverse(function (o) {
      if (!o.isMesh || !o.geometry) return;
      for (var q = o; q; q = q.parent) if (q.userData.noAudit) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); bb.union(tmp);
    });
    return bb;
  }
  function regItem(name, kind, obj, extra) {
    var b = boxOf(obj); if (b.isEmpty()) return null;
    var it = { name: name, kind: kind, minX: b.min.x, maxX: b.max.x, minY: b.min.y, maxY: b.max.y, minZ: b.min.z, maxZ: b.max.z, obj: obj };
    if (kind === 'sign') { var n = new T.Vector3(0, 0, 1).applyQuaternion(obj.getWorldQuaternion(new T.Quaternion())); it.nx = Math.round(n.x); it.nz = Math.round(n.z); }
    if (extra) for (var k in extra) it[k] = extra[k];
    AUD.push(it); return it;
  }
  function begin(name, kind) { var g = new T.Group(); g.name = name; scene.add(g); curPar = g; curItem = { name: name, kind: kind || 'prop', g: g }; return g; }
  function end() { var c = curItem; curPar = null; curItem = null; return c ? regItem(c.name, c.kind, c.g) : null; }
  function wallSign(name, m) { scene.add(m); regItem('sign:' + name, 'sign', m); return m; }
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
    var dL = WING.doorX - WING.doorHW, dR = WING.doorX + WING.doorHW, sR = (ROOM.maxX + th) - dR;
    var fL = FOOD.doorX - FOOD.doorHW, fR = FOOD.doorX + FOOD.doorHW, sL0 = fL - (ROOM.minX - th), sM = dL - fR;
    mesh(box(sL0, H, th), wallMat, ROOM.minX - th + sL0 / 2, H / 2, ROOM.maxZ + th / 2);
    mesh(box(sM, H, th), wallMat, fR + sM / 2, H / 2, ROOM.maxZ + th / 2);
    mesh(box(sR, H, th), wallMat, dR + sR / 2, H / 2, ROOM.maxZ + th / 2);
    mesh(box(WING.doorHW * 2, H - WING.doorH, th), wallMat, WING.doorX, WING.doorH + (H - WING.doorH) / 2, ROOM.maxZ + th / 2);
    mesh(box(FOOD.doorHW * 2, H - FOOD.doorH, th), wallMat, FOOD.doorX, FOOD.doorH + (H - FOOD.doorH) / 2, ROOM.maxZ + th / 2);
    mesh(box(th, H, D), wallMat, ROOM.minX - th / 2, H / 2, 0);
    mesh(box(th, H, D), wallMat, ROOM.maxX + th / 2, H / 2, 0);
    // outer walls are kept to the arcade building (z -40..40) so the far-away rooftop deck and basement (js/areas.js) stay walkable
    addWall(-60, 60, -1, 99, -40, ROOM.minZ);
    // south wall: solid except the doorways into the Food Court and the Hall of Game Records wing (both add their own inner decor)
    addWall(-60, fL, -1, 99, ROOM.maxZ, ROOM.maxZ + th); addWall(fR, dL, -1, 99, ROOM.maxZ, ROOM.maxZ + th); addWall(dR, 60, -1, 99, ROOM.maxZ, ROOM.maxZ + th);
    walls.push({ minX: dL, maxX: dR, minY: WING.doorH, maxY: 99, minZ: ROOM.maxZ, maxZ: ROOM.maxZ + th });
    walls.push({ minX: fL, maxX: fR, minY: FOOD.doorH, maxY: 99, minZ: ROOM.maxZ, maxZ: ROOM.maxZ + th });
    addWall(FOOD.maxX, WING.minX, -1, 99, ROOM.maxZ, WING.maxZ); addWall(WING.maxX, 60, -1, 99, ROOM.maxZ, 40); addWall(-60, 60, -1, 99, WING.maxZ, 40);
    walls.push({ minX: FOOD.minX, maxX: FOOD.maxX, minY: H - 0.3, maxY: 99, minZ: FOOD.minZ, maxZ: FOOD.maxZ }); // Food Court ceiling (keeps the camera inside)
    addWall(-60, ROOM.minX, -1, 99, -40, 40); addWall(ROOM.maxX, 60, -1, 99, -40, 40);
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
    strip(ROOM.minX, ROOM.minZ + e, ROOM.maxX, ROOM.minZ + e, 0.1, cyan); strip(ROOM.minX, ROOM.maxZ - e, fL, ROOM.maxZ - e, 0.1, cyan); strip(fR, ROOM.maxZ - e, dL, ROOM.maxZ - e, 0.1, cyan); strip(dR, ROOM.maxZ - e, ROOM.maxX, ROOM.maxZ - e, 0.1, cyan);
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
    var GALL = !!(GA.Areas && GA.Areas.galleryLayout), s1 = GALL ? sign('GAME GALLERY\nall ' + GA.MAIN_GAMES.length + ' Grok games inside', 5.6, 1.0, '#3ff0ff') : sign('MAIN GAMES\nLizeth\'s Grok games', 7, 1.5, '#3ff0ff'); s1.position.set(-6, GALL ? 4.4 : 3.75, ROOM.minZ + 0.03); wallSign('MAIN GAMES', s1);
    var s2 = sign('BONUS ZONE\nNew mini games - earn tickets!', 7, 1.5, '#ff4fd8'); s2.position.set(ROOM.maxX - 0.03, 3.75, 0); s2.rotation.y = -Math.PI / 2; wallSign('BONUS ZONE', s2);
    var s3 = sign('BONUS ZONE  >', 4.6, 1.2, '#ff4fd8'); s3.position.set(DIV_X - 0.23, 4.1, 0); s3.rotation.y = -Math.PI / 2; wallSign('BONUS ZONE >', s3);
    var s3b = sign((GA.Areas && GA.Areas.galleryLayout) ? '< GAME GALLERY' : '< MAIN GAMES', 4.6, 1.2, '#3ff0ff'); s3b.position.set(DIV_X + 0.23, 4.1, 0); s3b.rotation.y = Math.PI / 2; wallSign('< MAIN GAMES', s3b);
    var s4 = sign('GROK ARCADE', 5.0, 1.0, '#ffe14d'); s4.position.set(ROOM.minX + 0.03, 3.4, 0.7); s4.rotation.y = Math.PI / 2; wallSign('GROK ARCADE', s4);
    regItem('decal:MAIN GAMES', 'decal', GALL ? decal('GAME GALLERY', 7, 1.6, '#3ff0ff', -6, -7.2, 0, 'walk up to the golden arch') : decal('MAIN GAMES', 7, 1.6, '#3ff0ff', -6, -7.2, 0, 'walk up to a cabinet to play'));
    regItem('decal:BONUS ZONE', 'decal', decal('BONUS ZONE', 6.4, 1.5, '#ff4fd8', 11.6, 0, Math.PI / 2, 'mini games - best scores saved'));
    regItem('decal:BONUS >>', 'decal', decal('BONUS  >>', 3.2, 1.1, '#ff4fd8', 3.2, 0, 0));
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
    GA.wallBonus().forEach(function (gm, i) {
      var nB = GA.wallBonus().length, y = nB > 16 ? 80 + i * (402 / (nB - 1)) : (nB > 15 ? 84 : nB > 14 ? 88 : nB > 13 ? 90 : nB > 12 ? 92 : nB > 11 ? 96 : nB > 10 ? 100 : nB > 9 ? 106 : nB > 8 ? 108 : nB > 7 ? 114 : nB > 6 ? 118 : nB > 5 ? 128 : 140) + i * (nB > 15 ? 26.5 : nB > 14 ? 28 : nB > 13 ? 30 : nB > 12 ? 32 : nB > 11 ? 34 : nB > 10 ? 37 : nB > 9 ? 40 : nB > 8 ? 45 : nB > 7 ? 50 : nB > 6 ? 56 : nB > 5 ? 64 : 70); g.font = font(nB > 16 ? 19 : nB > 15 ? 19 : nB > 14 ? 20 : nB > 13 ? 21 : nB > 12 ? 22 : nB > 11 ? 24 : nB > 10 ? 26 : nB > 9 ? 28 : nB > 8 ? 30 : nB > 7 ? 32 : nB > 6 ? 34 : nB > 5 ? 38 : 42); g.textAlign = 'left'; g.fillStyle = gm.color; g.fillText(gm.name, 50, y);
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
  Hub.refreshBoards = function () { scoreBoardDraw(); ticketDraw(); stockDraw(); galleryDraw(); };

  function plant(x, z, s, name) {
    s = s || 1; begin(name || ('plant ' + x.toFixed(1) + ',' + z.toFixed(1)), 'plant');
    mesh(cyl(0.38 * s, 0.3 * s, 0.6 * s, 10), lam('#ff7a3d'), x, 0.3 * s, z);
    mesh(cyl(0.4 * s, 0.4 * s, 0.06, 10), basic('#ffe14d'), x, 0.6 * s, z);
    var leaf = lam('#2fd47a'), leaf2 = lam('#1fa860');
    mesh(sph(0.45 * s, 8), leaf, x, 1.0 * s, z); mesh(sph(0.32 * s, 8), leaf2, x + 0.25 * s, 1.35 * s, z + 0.1); mesh(sph(0.3 * s, 8), leaf, x - 0.2 * s, 1.45 * s, z - 0.12);
    addSolid(x - 0.45 * s, x + 0.45 * s, z - 0.45 * s, z + 0.45 * s);
    end();
  }

  /* ---------- prize stock shelves + Achievement Gallery (dynamic canvas textures) ---------- */
  function stockDraw() {
    var d = dynTex.stock; if (!d || !GA.PrizeArt) return; var g = d.ctx, W = d.c.width, H = d.c.height;
    g.clearRect(0, 0, W, H);
    var left = GA.PRIZES.filter(function (p) { return !p.claw && !(GA.Prog && GA.Prog.owns(p.id)); }).sort(function (a, b) { return b.price - a.price; }).slice(0, 21);
    var rows = [H, H - 0.8 / 2.13 * H, H - 1.55 / 2.13 * H], sz = 112;
    left.forEach(function (p, i) { var r = Math.floor(i / 7), k = i % 7, x = 30 + k * 140 + (r % 2) * 28; g.drawImage(GA.PrizeArt.icon(p.id, 128), x, rows[r] - sz - 4, sz, sz); });
    if (!left.length) neonText(g, 'SOLD OUT!', W / 2, H / 2, 90, '#ffe14d');
    d.tex.needsUpdate = true;
  }
  function galleryDraw() {
    var d = dynTex.gallery; if (!d || !GA.PrizeArt || !GA.Prog) return; var g = d.ctx, W = d.c.width, H = d.c.height, c = GA.Prog.counts();
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1d0f45'); bg.addColorStop(1, '#2a1260'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#3ff0ff'; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, H - 8);
    neonText(g, 'PRIZES ' + c.prizes + '/' + c.prizeTotal + '    ACHIEVEMENTS ' + c.ach + '/' + c.achTotal, W / 2, 44, 40, '#ffe14d', W - 60);
    var top = 84, rowH = (H - top - 8) / 3, per = Math.ceil(GA.PRIZES.length / 3), cw = (W - 30) / per, sz = Math.min(cw - 6, rowH - 22);
    for (var r = 0; r < 3; r++) {
      var by = top + (r + 1) * rowH;
      var sh = g.createLinearGradient(0, by - 14, 0, by); sh.addColorStop(0, '#8b5a2b'); sh.addColorStop(1, '#4a2c12'); g.fillStyle = sh; g.fillRect(12, by - 14, W - 24, 12);
      g.fillStyle = '#3ff0ff'; g.fillRect(12, by - 3, W - 24, 3);
    }
    GA.PRIZES.forEach(function (p, i) {
      var r = Math.floor(i / per), k = i % per, x = 15 + k * cw + (cw - sz) / 2, y = top + (r + 1) * rowH - 14 - sz;
      if (GA.Prog.owns(p.id)) g.drawImage(GA.PrizeArt.icon(p.id, 128), x, y, sz, sz);
      else { g.globalAlpha = 0.5; g.drawImage(GA.PrizeArt.icon(p.id, 128, true), x, y, sz, sz); g.globalAlpha = 1; g.font = font(40); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillText('?', x + sz / 2, y + sz * 0.55); }
    });
    d.tex.needsUpdate = true;
  }
  var GAL = { x: ROOM.minX, z: -6, w: 5.6 };
  function buildGallery() {
    var grp = new T.Group(); grp.position.set(GAL.x + 0.5, 0, GAL.z); grp.rotation.y = Math.PI / 2; scene.add(grp);
    // cabinet body + back panel
    mesh(box(GAL.w + 0.4, 3.5, 0.5), lam('#2b1a55'), 0, 1.85, -0.3, grp);
    mesh(box(GAL.w + 0.4, 0.5, 0.95), lam('#4a2a86'), 0, 0.25, 0, grp);
    var gc = mkCanvas(1024, 560); dynTex.gallery = { c: gc, ctx: gc.getContext('2d'), tex: canvasTex(gc) };
    mesh(plane(GAL.w, GAL.w * 560 / 1024), new T.MeshBasicMaterial({ map: dynTex.gallery.tex }), 0, 0.55 + GAL.w * 560 / 1024 / 2, -0.04, grp);
    galleryDraw();
    // glass + neon frame
    var glass = new T.MeshBasicMaterial({ color: '#9ff7ff', transparent: true, opacity: 0.1, depthWrite: false });
    mesh(box(GAL.w, 3.0, 0.04), glass, 0, 2.05, 0.4, grp);
    var cy = basic('#3ff0ff'), pk = basic('#ff4fd8');
    mesh(box(GAL.w + 0.3, 0.08, 0.08), cy, 0, 3.6, 0.42, grp); mesh(box(GAL.w + 0.3, 0.08, 0.08), pk, 0, 0.52, 0.48, grp);
    [-1, 1].forEach(function (sd) { mesh(box(0.08, 3.1, 0.08), sd < 0 ? pk : cy, sd * (GAL.w / 2 + 0.15), 2.05, 0.42, grp); });
    var sg = sign('ACHIEVEMENT GALLERY', GAL.w, 0.66, '#3ff0ff', { col2: '#ffe14d' }); sg.position.set(0, 4.05, -0.04); grp.add(sg);
    var dc = decal('GALLERY', 3.0, 0.95, '#3ff0ff', 0, 0, 0, 'prizes + achievements'); scene.remove(dc); dc.position.set(0, 0.02, 1.9); dc.rotation.z = 0; grp.add(dc); noAud(dc);
    // two little trophy pedestals
    [-1].forEach(function (sd) { mesh(cyl(0.22, 0.26, 0.9, 10), lam('#4a2a86'), sd * (GAL.w / 2 + 0.55), 0.45, 0.1, grp); mesh(cyl(0.12, 0.06, 0.3, 10), basic('#ffe14d'), sd * (GAL.w / 2 + 0.55), 1.05, 0.1, grp); mesh(sph(0.09, 8), basic('#ffe14d'), sd * (GAL.w / 2 + 0.55), 1.25, 0.1, grp); });
    var gm = new T.MeshBasicMaterial({ map: glowTex, color: '#3ff0ff', transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending });
    var gl = mesh(plane(3.6, 1.8), gm, 0, 0.025, 1.45, grp); gl.rotation.x = -Math.PI / 2; gl.renderOrder = 2; noAud(gl);
    addSolid(ROOM.minX, GAL.x + 1.05, GAL.z - GAL.w / 2 - 0.2, GAL.z + GAL.w / 2 + 0.85, 'Achievement Gallery');
    grp.updateMatrixWorld(true); regItem('Achievement Gallery', 'booth', grp, { minX: Math.max(ROOM.minX, boxOf(grp).min.x) }); regItem('decal:GALLERY', 'decal', dc);
    cabinets.push({ game: { id: 'gallery', name: 'Achievement Gallery', desc: 'See your prizes and achievements.', color: '#3ff0ff' }, kind: 'gallery', id: 'gallery', group: grp, x: GAL.x + 0.5, z: GAL.z, rot: Math.PI / 2,
      front: new T.Vector3(0, 0, 1.75).applyMatrix4(grp.matrixWorld), dir: new T.Vector3(1, 0, 0), glow: gm, nextDraw: Infinity, r: 2.1 });
  }


  /* ---------- Suggestion Booth (south-west corner of the main hall) ---------- */
  var SBX = -14.9, SBZ = ROOM.maxZ - 0.9;
  function boothScreen(g, w, h, t) {
    var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0c2a3a'); gr.addColorStop(1, '#13104a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.save(); g.shadowColor = '#ffe14d'; g.shadowBlur = 10 + Math.sin(t * 3) * 6; g.fillStyle = '#ffe14d'; g.beginPath(); g.arc(w / 2, 46, 20, 0, 7); g.fill(); g.restore();
    g.fillStyle = '#c9ced8'; g.fillRect(w / 2 - 9, 64, 18, 12); g.fillStyle = '#16101f'; g.fillRect(w / 2 - 9, 68, 18, 2);
    g.font = font(17); g.textAlign = 'center'; g.fillStyle = '#7ff0ff'; g.fillText('BUG? IDEA?', w / 2, 98);
    g.font = font(14); g.fillStyle = '#ffffff'; g.fillText(Math.floor(t) % 2 ? 'Tap to suggest!' : 'See the board!', w / 2, 120);
  }
  function buildBooth() {
    var grp = new T.Group(); grp.position.set(SBX, 0, SBZ); grp.rotation.y = Math.PI; scene.add(grp);
    var cy = '#3ff0ff';
    mesh(box(1.7, 1.0, 0.8), lam('#1d4f6b'), 0, 0.5, 0, grp);
    mesh(box(1.8, 0.08, 0.9), basic(cy), 0, 1.02, 0, grp);
    mesh(box(1.5, 1.7, 0.3), lam('#163a52'), 0, 1.9, -0.25, grp);
    mesh(box(1.3, 1.0, 0.04), basic('#05020c'), 0, 1.95, -0.09, grp);
    var sc = mkCanvas(192, 144), sg = sc.getContext('2d'), stex = canvasTex(sc); stex.minFilter = T.LinearFilter; stex.generateMipmaps = false;
    mesh(plane(1.2, 0.9), new T.MeshBasicMaterial({ map: stex }), 0, 1.95, -0.065, grp);
    boothScreen(sg, 192, 144, 0); stex.needsUpdate = true;
    // little suggestion box with a slot + pencil cup on the counter
    mesh(box(0.42, 0.3, 0.32), lam('#ff4fd8'), 0.55, 1.2, 0.1, grp); mesh(box(0.26, 0.03, 0.05), basic('#16101f'), 0.55, 1.36, 0.1, grp);
    mesh(cyl(0.08, 0.08, 0.2, 10), lam('#ffe14d'), -0.6, 1.15, 0.15, grp); mesh(cyl(0.015, 0.015, 0.3, 6), basic('#ff3d5a'), -0.62, 1.3, 0.15, grp); mesh(cyl(0.015, 0.015, 0.3, 6), basic('#4ade80'), -0.57, 1.3, 0.12, grp);
    [-1, 1].forEach(function (sd) { mesh(box(0.07, 2.9, 0.07), basic(sd < 0 ? '#ff4fd8' : cy), sd * 0.88, 1.45, 0.38, grp); });
    var sgn = sign('PATCH SUGGESTIONS', 2.6, 0.55, cy, { col2: '#ffe14d' }); sgn.position.set(0, 3.15, -0.1); grp.add(sgn);
    var dc = decal('SUGGEST', 2.4, 0.8, cy, 0, 0, 0, 'bugs \u00b7 ideas \u00b7 balance'); scene.remove(dc); dc.position.set(0, 0.02, 1.7); dc.rotation.z = 0; grp.add(dc); noAud(dc);
    var gm = new T.MeshBasicMaterial({ map: glowTex, color: cy, transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending });
    var gl = mesh(plane(2.6, 1.8), gm, 0, 0.025, 1.4, grp); gl.rotation.x = -Math.PI / 2; gl.renderOrder = 2; noAud(gl);
    addSolid(SBX - 0.95, SBX + 0.95, SBZ - 0.5, ROOM.maxZ, 'Suggestion Booth');
    grp.updateMatrixWorld(true); regItem('Suggestion Booth', 'booth', grp); regItem('decal:SUGGEST', 'decal', dc);
    var last = -1; anims.push(function (t) { var k = Math.floor(t * 8); if (k === last) return; last = k; boothScreen(sg, 192, 144, t); stex.needsUpdate = true; });
    cabinets.push({ game: { id: 'suggest', name: 'Suggestion Booth', desc: 'Suggest patches and check the suggestion board.', color: cy }, kind: 'suggest', id: 'suggest', group: grp, x: SBX, z: SBZ, rot: Math.PI,
      front: new T.Vector3(0, 0, 1.6).applyMatrix4(grp.matrixWorld), dir: new T.Vector3(0, 0, -1), glow: gm, nextDraw: Infinity, r: 2.0 });
  }

  function buildDecor() {
    ensureGlow();
    // Prize counter (south wall, main hall)
    var px = -6, pz = ROOM.maxZ - 1.6;
    begin('Prize Counter', 'counter');
    mesh(box(6, 1.1, 1), lam('#7c3aed'), px, 0.55, pz);
    mesh(box(6.1, 0.08, 1.1), lam('#c084fc'), px, 1.14, pz);
    mesh(box(6, 0.08, 0.05), basic('#ffe14d'), px, 0.85, pz - 0.52);
    mesh(box(6, 0.08, 0.05), basic('#ff4fd8'), px, 0.3, pz - 0.52);
    addSolid(px - 3.05, px + 3.05, pz - 0.55, ROOM.maxZ);
    var bell = mesh(cyl(0.12, 0.16, 0.1, 12), basic('#ffe14d'), px + 2.2, 1.23, pz - 0.2); mesh(sph(0.04, 6), basic('#ffffff'), px + 2.2, 1.32, pz - 0.2);
    end();
    // shelves of plushies behind the counter
    begin('Prize Shelves', 'counter');
    mesh(box(6.4, 2.4, 0.5), lam('#2b1a55'), px, 1.2, ROOM.maxZ - 0.25);
    [0.75, 1.55, 2.3].forEach(function (y) { mesh(box(6.4, 0.06, 0.55), basic('#3ff0ff'), px, y - 0.32, ROOM.maxZ - 0.3); });
    // the prizes still in stock stand on the shelves (redeemed ones move to the Achievement Gallery)
    var skc = mkCanvas(1024, 352); dynTex.stock = { c: skc, ctx: skc.getContext('2d'), tex: canvasTex(skc) };
    var skm = mesh(plane(6.2, 2.13), new T.MeshBasicMaterial({ map: dynTex.stock.tex, transparent: true, depthWrite: false }), px, 0.43 + 2.13 / 2, ROOM.maxZ - 0.36); skm.rotation.y = Math.PI; skm.renderOrder = 2;
    end();
    stockDraw();
    // the counter itself is interactive: walk up to it to redeem tickets
    var pg = new T.Group(); pg.position.set(px, 0, pz); pg.rotation.y = Math.PI; scene.add(pg);
    var pgm = new T.MeshBasicMaterial({ map: glowTex, color: '#ffe14d', transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending });
    var pgl = mesh(plane(3.4, 1.8), pgm, 0, 0.025, 1.45, pg); pgl.rotation.x = -Math.PI / 2; pgl.renderOrder = 2;
    regItem('decal:PRIZES', 'decal', decal('PRIZES', 3.2, 1.0, '#ffe14d', px, pz - 1.75, Math.PI, 'redeem tickets here'));
    pg.updateMatrixWorld(true);
    cabinets.push({ game: { id: 'prizes', name: 'Prize Counter', desc: 'Redeem your tickets for prizes.', color: '#ffe14d' }, kind: 'prize', id: 'prizes', group: pg, x: px, z: pz, rot: Math.PI,
      front: new T.Vector3(0, 0, 1.75).applyMatrix4(pg.matrixWorld), dir: new T.Vector3(0, 0, -1), glow: pgm, nextDraw: Infinity, r: 2.0 });
    // ticket display sign (dynamic)
    var c = mkCanvas(1024, 300); dynTex.tickets = { c: c, ctx: c.getContext('2d'), tex: canvasTex(c) };
    var ts = new T.Mesh(plane(5, 1.46), new T.MeshBasicMaterial({ map: dynTex.tickets.tex })); ts.position.set(px, 3.35, ROOM.maxZ - 0.03); ts.rotation.y = Math.PI; wallSign('PRIZE COUNTER tickets', ts);
    ticketDraw();

    buildGallery();
    buildBooth();

    // Best scores board in the bonus zone (north wall)
    var c2 = mkCanvas(768, 520); dynTex.scores = { c: c2, ctx: c2.getContext('2d'), tex: canvasTex(c2) };
    // raised above the overflow cabinet row on this wall, like a marquee
    var sb = new T.Mesh(plane(3.6, 2.44), new T.MeshBasicMaterial({ map: dynTex.scores.tex })); sb.position.set(12.7, 3.68, ROOM.minZ + 0.03); wallSign('BEST SCORES board', sb);
    scoreBoardDraw();
    // a ticket machine next to scoreboard
    var tmx = 8.0, tmz = ROOM.minZ + 0.6;
    begin('Ticket Machine', 'prop');
    mesh(box(1.0, 1.8, 0.8), lam('#ff4fd8'), tmx, 0.9, tmz); mesh(plane(0.7, 0.5), basic('#ffe14d'), tmx, 1.3, tmz + 0.41);
    mesh(box(0.8, 0.12, 0.1), basic('#3ff0ff'), tmx, 0.7, tmz + 0.42);
    addSolid(tmx - 0.55, tmx + 0.55, ROOM.minZ, tmz + 0.45);
    end();

    // two real, playable claw machines (Easy + Tricky) by the prize counter (they replace the old decorative claw)
    if (GA.Claw && GA.Claw.build) {
      try { GA.Claw.build(api()); } catch (e) { if (window.console) console.warn('claw machines failed to build', e); }
    }

    // comfy couch on the west wall
    var sx = ROOM.minX + 0.7, sz = 4;
    begin('Couch', 'prop');
    mesh(box(1.0, 0.5, 3.2), lam('#db2777'), sx, 0.25, sz); mesh(box(0.35, 1.1, 3.2), lam('#be185d'), sx - 0.4, 0.55, sz);
    mesh(box(1.0, 0.75, 0.3), lam('#be185d'), sx, 0.38, sz - 1.6); mesh(box(1.0, 0.75, 0.3), lam('#be185d'), sx, 0.38, sz + 1.6);
    mesh(box(0.25, 0.4, 0.6), lam('#3ff0ff'), sx, 0.68, sz - 0.6); mesh(box(0.25, 0.4, 0.6), lam('#ffe14d'), sx, 0.68, sz + 0.7);
    addSolid(ROOM.minX, sx + 0.55, sz - 1.8, sz + 1.8);
    end();

    // plants (placed so none clip into a cabinet, booth or sign: the old NW one went through the Grok Sky cabinet,
    // and the old bonus-zone one stood in front of the Official Arcade Rats poster)
    plant(ROOM.minX + 0.8, 6.75, 1.0, 'plant W wall'); plant(ROOM.minX + 0.8, ROOM.maxZ - 0.8, 1.1, 'plant SW corner');
    plant(DIV_X - 0.9, ROOM.maxZ - 0.8, 1, 'plant S door-main'); plant(DIV_X + 0.9, ROOM.maxZ - 0.8, 1, 'plant S door-bonus');
    plant(DIV_X - 0.9, -DOOR - 0.7, 0.8, 'plant door N'); plant(DIV_X - 0.9, DOOR + 0.7, 0.8, 'plant door S');

    // bonus-zone stools / bean bags
    [[10.5, 6.5, '#3ff0ff'], [12, 7.5, '#ffe14d'], [10.2, -6.5, '#a78bfa']].forEach(function (b) {
      begin('bean bag ' + b[0] + ',' + b[1], 'prop');
      var m = mesh(sph(0.55, 12), lam(b[2]), b[0], 0.35, b[1]); m.scale.set(1, 0.65, 1); addSolid(b[0] - 0.5, b[0] + 0.5, b[1] - 0.5, b[1] + 0.5);
      end();
    });

    // floating neon shapes (cheap animated decor, up near the ceiling)
    var tor = mesh(new T.TorusGeometry(0.7, 0.08, 8, 32), basic('#ff4fd8'), -14.5, 3.4, 8.5);
    var oct = mesh(new T.OctahedronGeometry(0.45), basic('#3ff0ff'), -14.5, 3.4, 8.5);
    var star = mesh(new T.IcosahedronGeometry(0.35), basic('#ffe14d'), 12, 3.6, 0);
    anims.push(function (t) { tor.rotation.y = t * 0.8; tor.rotation.x = Math.sin(t * 0.5) * 0.4; oct.rotation.y = -t * 1.2; oct.position.y = 3.4 + Math.sin(t * 1.5) * 0.12; star.rotation.y = t; star.rotation.x = t * 0.6; star.position.y = 3.6 + Math.sin(t * 2) * 0.15; });

    // wall posters
    var p1 = sign('INSERT FUN', 2.4, 0.8, '#4ade80'); p1.position.set(ROOM.minX + 0.03, 1.85, 0); p1.rotation.y = Math.PI / 2; wallSign('INSERT FUN poster', p1);
    var p2 = sign('HIGH SCORE\nLIZETH', 2.2, 1.0, '#fb923c'); p2.position.set(ROOM.minX + 0.03, 2.2, 8.6); p2.rotation.y = Math.PI / 2; wallSign('HIGH SCORE poster', p2);
    // the Official Arcade Rats sign + portrait (bonus zone, south wall; kept clear of the last bonus cabinet and the plant)
    var RX = 14.4;
    var p3 = sign('LUNA  PI-RAT  SNOWIE\nofficial arcade rats', 3.4, 1.0, '#ff8fd0'); p3.position.set(RX, 2.6, ROOM.maxZ - 0.03); p3.rotation.y = Math.PI; wallSign('Official Arcade Rats sign', p3);
    // little rat portrait poster
    var rc = mkCanvas(512, 256), rg = rc.getContext('2d'); rg.fillStyle = '#2a1150'; rg.fillRect(0, 0, 512, 256); rg.strokeStyle = '#ff8fd0'; rg.lineWidth = 10; rg.strokeRect(5, 5, 502, 246);
    if (GA.drawRat) { GA.drawRat(rg, 'luna', 100, 120, 130, false); GA.drawRat(rg, 'pirat', 256, 120, 130, false); GA.drawRat(rg, 'snowie', 412, 120, 130, false); }
    var rp = new T.Mesh(plane(3.2, 1.6), new T.MeshBasicMaterial({ map: canvasTex(rc) })); rp.position.set(RX, 1.2, ROOM.maxZ - 0.03); rp.rotation.y = Math.PI; wallSign('Arcade Rats portrait', rp);
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
      case 'detective': {
        g.fillStyle = '#2a1d46'; g.fillRect(0, 0, w, h);
        for (i = 0; i < 6; i++) for (var dj = 0; dj < 5; dj++) { g.fillStyle = (i + dj) % 2 ? '#3b2a63' : '#33245a'; g.fillRect(i * w / 6, dj * h / 5, w / 6, h / 5); }
        var dpx = [[30, 30], [w - 40, 40], [40, h - 40], [w - 50, h - 36], [w / 2, 26]];
        dpx.forEach(function (q, k) { g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(q[0], q[1], 9, 0, 7); g.fill(); g.fillStyle = '#3a2400'; g.font = font(14); g.textAlign = 'center'; g.fillText('?', q[0], q[1] + 5); });
        var gx = w / 2 + Math.cos(t * 0.9) * w * 0.3, gy = h / 2 + Math.sin(t * 1.3) * h * 0.22;
        var near2 = dpx.some(function (q) { return Math.hypot(q[0] - gx, q[1] - gy) < 26; });
        g.fillStyle = near2 ? 'rgba(255,240,150,.55)' : 'rgba(191,233,255,.35)'; g.beginPath(); g.arc(gx, gy, 20, 0, 7); g.fill();
        g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.beginPath(); g.arc(gx, gy, 20, 0, 7); g.stroke();
        g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(gx + 14, gy + 14); g.lineTo(gx + 30, gy + 30); g.stroke(); g.lineCap = 'butt';
        if (near2) { g.font = font(20); g.textAlign = 'center'; g.fillStyle = '#ffd23f'; g.fillText('CLUE!', w / 2, h - 10); }
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
      case 'brawl': {
        var gb = g.createLinearGradient(0, 0, 0, h); gb.addColorStop(0, '#1a0638'); gb.addColorStop(1, '#4a0f4f'); g.fillStyle = gb; g.fillRect(0, 0, w, h);
        g.fillStyle = '#2a1458'; for (i = 0; i < 9; i++) { var tb = 26 + ((i * 29) % 34); g.fillRect(i * 22, h - 34 - tb, 18, tb); }
        g.fillStyle = '#ffe14d'; for (i = 0; i < 24; i++) if ((i * 7 + Math.floor(t * 2)) % 5) g.fillRect((i * 37) % 190 + 3, h - 50 - ((i * 13) % 40), 2, 2);
        g.fillStyle = '#ff4fd8'; g.fillRect(0, h - 34, w, 2); g.fillStyle = '#23104a'; g.fillRect(0, h - 32, w, 32);
        var cyc = (t * 1.6) % 2, hitter = cyc < 1 ? 0 : 1, ph3 = cyc % 1, reach = Math.max(0, Math.sin(Math.min(1, ph3 * 2.2) * Math.PI));
        function fighter(fx, dir, body, head, atk, hurt) {
          var bx2 = fx - (hurt ? dir * 4 : 0), gy2 = h - 34;
          g.fillStyle = '#111'; g.fillRect(bx2 - 9, gy2 - 16, 7, 16); g.fillRect(bx2 + 2, gy2 - 16, 7, 16);
          g.fillStyle = body; g.fillRect(bx2 - 11, gy2 - 40, 22, 25);
          g.fillStyle = head; g.fillRect(bx2 - 9, gy2 - 58, 18, 18); g.fillStyle = '#fff'; g.fillRect(bx2 + dir * 2, gy2 - 52, 4, 4);
          g.fillStyle = body; g.fillRect(bx2 + dir * 8 - (dir < 0 ? 8 + atk * 22 : 0), gy2 - 37, 8 + atk * 22, 7);
          g.fillStyle = '#ffd9b8'; g.fillRect(bx2 + dir * (12 + atk * 22) - 4, gy2 - 39, 9, 10);
        }
        var lx = w * 0.36, rx = w * 0.64;
        fighter(lx, 1, '#ff4a2e', '#ffb07a', hitter === 0 ? reach : 0, hitter === 1 && reach > 0.6);
        fighter(rx, -1, '#22d3ee', '#fde047', hitter === 1 ? reach : 0, hitter === 0 && reach > 0.6);
        if (reach > 0.75) { var sx3 = hitter === 0 ? rx - 12 : lx + 12, sy3 = h - 70; g.fillStyle = '#fff59a'; g.beginPath(); for (i = 0; i < 10; i++) { var ang = i * Math.PI / 5, rr = i % 2 ? 6 : 15; g.lineTo(sx3 + Math.cos(ang) * rr, sy3 + Math.sin(ang) * rr); } g.fill(); }
        var hp1 = 0.35 + 0.6 * (0.5 + 0.5 * Math.cos(t * 0.4)), hp2 = 0.3 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.33));
        g.fillStyle = '#000'; g.fillRect(6, 8, 76, 8); g.fillRect(w - 82, 8, 76, 8);
        g.fillStyle = '#ffe14d'; g.fillRect(7, 9, 74 * hp1, 6); g.fillRect(w - 7 - 74 * hp2, 9, 74 * hp2, 6);
        g.font = font(16); g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(String(60 - Math.floor(t * 3) % 60), w / 2, 18);
        if (Math.floor(t * 0.5) % 4 === 0) { g.font = font(30); g.fillStyle = '#ff3d6e'; g.fillText('FIGHT!', w / 2, 52); }
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
      case 'wires': {
        g.fillStyle = '#0d1a2b'; g.fillRect(0, 0, w, h);
        var wc = ['#ff3b4f', '#3ba7ff', '#ffd23b', '#3bff7a'], ord = [2, 0, 3, 1], done = Math.floor(t * 1.2) % 6;
        for (i = 0; i < 4; i++) {
          var ly = 22 + i * 26, ry = 22 + ord[i] * 26;
          g.fillStyle = wc[i]; g.fillRect(8, ly - 7, 22, 14); g.fillRect(w - 30, 22 + i * 26 - 7, 22, 14);
          if (i < done) { var ry2 = 22 + ord.indexOf(i) * 26; g.strokeStyle = wc[i]; g.lineWidth = 5; g.beginPath(); g.moveTo(30, ly); g.bezierCurveTo(w / 2, ly, w / 2, ry2, w - 30, ry2); g.stroke(); }
        }
        if (done >= 4) { g.font = font(22); g.textAlign = 'center'; g.fillStyle = '#ffe14d'; g.fillText('FIXED!', w / 2, h / 2); }
        break;
      }
      case 'penalty': {
        g.fillStyle = '#156d30'; g.fillRect(0, 0, w, h); g.fillStyle = '#0a1630'; g.fillRect(0, 0, w, h * 0.35);
        g.strokeStyle = '#fff'; g.lineWidth = 5; g.strokeRect(w * 0.18, h * 0.18, w * 0.64, h * 0.32);
        var kx = w / 2 + Math.sin(t * 2.4) * w * 0.18; g.fillStyle = '#ffe14d'; g.fillRect(kx - 8, h * 0.3, 16, h * 0.2);
        var e = (t * 0.8) % 1, bx = w / 2 + (w * 0.26) * e * (Math.floor(t * 0.8) % 2 ? 1 : -1), by = h * 0.82 - e * h * 0.5;
        g.fillStyle = '#fff'; g.beginPath(); g.arc(bx, by, 9 - e * 4, 0, 7); g.fill();
        break;
      }
      case 'fetch': {
        var gf = g.createLinearGradient(0, 0, 0, h); gf.addColorStop(0, '#7fd3ff'); gf.addColorStop(1, '#c9f0ff'); g.fillStyle = gf; g.fillRect(0, 0, w, h);
        g.fillStyle = '#5cc85a'; g.fillRect(0, h - 30, w, 30); g.fillStyle = '#e8c98f'; g.fillRect(0, h - 32, w, 4);
        var bxf = w - ((t * 90) % (w + 40)), byf = h - 80 - Math.sin(t * 4) * 4; g.fillStyle = '#d7ff3b'; g.beginPath(); g.arc(bxf, byf, 8, 0, 7); g.fill();
        var hop = Math.max(0, Math.sin(t * 3)) * 34, dxf = 56, dyf = h - 32 - hop;
        g.fillStyle = '#5d6168'; g.fillRect(dxf - 16, dyf - 12, 5, 12); g.fillRect(dxf + 10, dyf - 12, 5, 12);
        g.fillStyle = '#7b8088'; g.fillRect(dxf - 20, dyf - 28, 40, 18); g.fillRect(dxf + 12, dyf - 44, 20, 18);
        g.fillStyle = '#eceef2'; g.fillRect(dxf + 26, dyf - 32, 12, 9); g.fillRect(dxf + 14, dyf - 42, 12, 3);
        g.fillStyle = '#4e5259'; g.fillRect(dxf + 12, dyf - 50, 6, 8); g.fillRect(dxf - 26, dyf - 36, 6, 10);
        g.fillStyle = '#111'; g.fillRect(dxf + 22, dyf - 38, 3, 3); g.fillRect(dxf + 34, dyf - 36, 4, 4);
        g.font = font(18); g.textAlign = 'center'; g.fillStyle = '#ff4fd8'; g.fillText('CANDY!', w / 2 + 30, 24);
        break;
      }
      case 'ratmaze': {
        g.fillStyle = '#140a2b'; g.fillRect(0, 0, w, h);
        var mz = ['#########', '#...#...#', '#.#...#.#', '#.#.#.#.#', '#.......#', '#########'], ts = Math.floor(Math.min(w / 9, (h - 22) / 6)), mox = (w - ts * 9) / 2, moy = 2;
        for (y = 0; y < 6; y++) for (x = 0; x < 9; x++) { if (mz[y][x] === '#') { g.fillStyle = '#5b2fa8'; g.fillRect(mox + x * ts, moy + y * ts, ts, ts); } else if ((x + y + Math.floor(t * 2)) % 9 !== 0) { g.fillStyle = '#e9d8a6'; g.fillRect(mox + x * ts + ts / 2 - 2, moy + y * ts + ts / 2 - 2, 4, 4); } }
        var lap = (t * 2.2) % 14, rxm = lap < 7 ? 1 + lap : 8 - (lap - 7) * 1, rym = 4;
        g.fillStyle = '#ffd23b'; g.beginPath(); g.moveTo(mox + 7.5 * ts - 6, moy + 1.5 * ts + 5); g.lineTo(mox + 7.5 * ts + 6, moy + 1.5 * ts + 5); g.lineTo(mox + 7.5 * ts + 6, moy + 1.5 * ts - 5); g.closePath(); g.fill();
        if (GA.drawRat) GA.drawRat(g, ['luna', 'pirat', 'snowie'][Math.floor(t / 6.4) % 3], mox + (Math.min(7, Math.max(1, rxm)) + 0.5) * ts, moy + (rym + 0.5) * ts - 4, ts * 0.95, false);
        var cxm = mox + (1.5 + ((t * 1.6) % 6)) * ts, cym = moy + 1.5 * ts; g.fillStyle = '#f59e0b'; g.beginPath(); g.arc(cxm, cym, ts * 0.42, 0, 7); g.fill();
        g.beginPath(); g.moveTo(cxm - ts * 0.4, cym - ts * 0.1); g.lineTo(cxm - ts * 0.3, cym - ts * 0.55); g.lineTo(cxm - ts * 0.05, cym - ts * 0.35); g.fill(); g.beginPath(); g.moveTo(cxm + ts * 0.4, cym - ts * 0.1); g.lineTo(cxm + ts * 0.3, cym - ts * 0.55); g.lineTo(cxm + ts * 0.05, cym - ts * 0.35); g.fill();
        g.fillStyle = '#4ade80'; g.fillRect(cxm - ts * 0.22, cym - ts * 0.1, 4, 4); g.fillRect(cxm + ts * 0.12, cym - ts * 0.1, 4, 4);
        break;
      }
      case 'party': {
        var gpp = g.createLinearGradient(0, 0, 0, h); gpp.addColorStop(0, '#ffb3e6'); gpp.addColorStop(1, '#8ee8ff'); g.fillStyle = gpp; g.fillRect(0, 0, w, h);
        var spc = ['#3b82f6', '#ef4444', '#22c55e', '#facc15', '#a855f7'];
        for (i = 0; i < 8; i++) { var sxp = 18 + i * 22, syp = h * 0.62 + Math.sin(i * 0.9) * 22; g.fillStyle = spc[i % 5]; g.beginPath(); g.arc(sxp, syp, 9, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
        var pi2 = Math.floor(t * 1.5) % 8, pxp = 18 + pi2 * 22, pyp = h * 0.62 + Math.sin(pi2 * 0.9) * 22 - 16 - Math.abs(Math.sin(t * 4.7)) * 8;
        g.fillStyle = '#f97316'; g.fillRect(pxp - 6, pyp - 8, 12, 14); g.fillStyle = '#fff'; g.fillRect(pxp - 3, pyp - 5, 3, 3); g.fillRect(pxp + 2, pyp - 5, 3, 3);
        g.save(); g.translate(w - 34, 34); g.rotate(t * 2); g.fillStyle = '#fff'; g.fillRect(-13, -13, 26, 26); g.fillStyle = '#111'; g.beginPath(); g.arc(-6, -6, 3, 0, 7); g.arc(6, 6, 3, 0, 7); g.arc(0, 0, 3, 0, 7); g.fill(); g.restore();
        g.fillStyle = '#ffe14d'; g.font = font(26); g.textAlign = 'center'; g.fillText('\u2605', 30 + Math.sin(t * 2) * 6, 30);
        break;
      }
      case 'slice': {
        var gs = g.createLinearGradient(0, 0, 0, h); gs.addColorStop(0, '#12062e'); gs.addColorStop(1, '#2a0c4a'); g.fillStyle = gs; g.fillRect(0, 0, w, h);
        var fc = ['#2fd47a', '#ff9a2e', '#ff4fd8', '#b8ff3b'], cyc = (t * 0.9) % 1;
        for (i = 0; i < 3; i++) { var ph4 = (cyc + i / 3) % 1, fx = w * (0.25 + i * 0.25), fy = h - Math.sin(ph4 * Math.PI) * h * 0.75; g.fillStyle = fc[i]; g.shadowColor = fc[i]; g.shadowBlur = 8;
          if (ph4 > 0.5 && i === 1) { g.beginPath(); g.arc(fx - 6, fy, 11, Math.PI * 0.5, Math.PI * 1.5); g.fill(); g.beginPath(); g.arc(fx + 6, fy + 4, 11, -Math.PI * 0.5, Math.PI * 0.5); g.fill(); }
          else { g.beginPath(); g.arc(fx, fy, 11, 0, 7); g.fill(); } g.shadowBlur = 0; }
        var sx4 = w * 0.2 + ((t * 1.3) % 1) * w * 0.6; g.strokeStyle = '#3ff0ff'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(sx4 - 40, h * 0.3 + 20); g.lineTo(sx4, h * 0.3); g.stroke();
        g.font = font(18); g.textAlign = 'center'; g.fillStyle = '#3ff0ff'; g.fillText('SLICE!', w / 2, 22);
        break;
      }
      case 'snack': {
        var gn = g.createLinearGradient(0, 0, 0, h); gn.addColorStop(0, '#ffe6f4'); gn.addColorStop(1, '#ffd0a8'); g.fillStyle = gn; g.fillRect(0, 0, w, h);
        var trx = w / 2 + Math.sin(t * 1.6) * w * 0.25, tr = h - 40; g.fillStyle = '#fff'; g.strokeStyle = '#d6336c'; g.lineWidth = 3; g.fillRect(trx - 34, tr, 68, 8); g.strokeRect(trx - 34, tr, 68, 8);
        var sc4 = ['#f5ecd7', '#ffd23b', '#ff9a3c', '#7cc8ff', '#ff8fd0'], nst = 1 + Math.floor(t * 1.2) % 6;
        for (i = 0; i < nst; i++) { g.fillStyle = sc4[i % 5]; g.fillRect(trx - 16 + Math.sin(t * 3 + i) * i * 1.5, tr - 10 - i * 10, 32, 9); }
        var fy2 = ((t * 70) % (h - 60)) + 10; g.fillStyle = '#ff8fd0'; g.beginPath(); g.arc(w * 0.3 + Math.sin(t) * 20, fy2, 8, 0, 7); g.fill();
        g.fillStyle = '#6b3a1e'; g.fillRect(w * 0.72, (fy2 + 50) % (h - 60), 18, 12); g.strokeStyle = '#ff2d55'; g.lineWidth = 2; g.beginPath(); g.arc(w * 0.72 + 9, (fy2 + 50) % (h - 60) + 6, 12, 0, 7); g.stroke();
        g.font = font(18); g.textAlign = 'center'; g.fillStyle = '#d6336c'; g.fillText('SNACK STACK', w / 2, 22);
        break;
      }
      case 'life': {
        var gl1 = g.createLinearGradient(0, 0, 0, h); gl1.addColorStop(0, '#7dd3fc'); gl1.addColorStop(1, '#bae6fd'); g.fillStyle = gl1; g.fillRect(0, 0, w, h);
        g.fillStyle = '#86efac'; g.fillRect(0, h - 46, w, 46); g.fillStyle = '#4b5563'; g.fillRect(0, h - 30, w, 18);
        g.fillStyle = '#fde68a'; g.fillRect(w * 0.12, h - 96, 60, 50); g.fillStyle = '#ef4444'; g.beginPath(); g.moveTo(w * 0.12 - 8, h - 96); g.lineTo(w * 0.12 + 30, h - 126); g.lineTo(w * 0.12 + 68, h - 96); g.fill();
        g.fillStyle = '#7c3aed'; g.fillRect(w * 0.12 + 22, h - 72, 16, 26); g.fillStyle = '#fef08a'; g.fillRect(w * 0.12 + 6, h - 86, 12, 10); g.fillRect(w * 0.12 + 42, h - 86, 12, 10);
        var cx2 = ((t * 60) % (w + 80)) - 40; g.fillStyle = '#ff4fd8'; g.fillRect(cx2 - 24, h - 36, 48, 16); g.fillStyle = '#111'; g.beginPath(); g.arc(cx2 - 14, h - 19, 5, 0, 7); g.arc(cx2 + 14, h - 19, 5, 0, 7); g.fill();
        g.fillStyle = '#8b9099'; var dh = Math.abs(Math.sin(t * 4)) * 6; g.beginPath(); g.ellipse(w * 0.7, h - 54 - dh, 14, 9, 0, 0, 7); g.fill(); g.beginPath(); g.arc(w * 0.7 + 12, h - 62 - dh, 8, 0, 7); g.fill();
        g.font = font(20); g.textAlign = 'center'; g.fillStyle = '#0369a1'; g.fillText('GROK LIFE', w / 2, 24);
        break;
      }
      case 'dash': {
        var gd1 = g.createLinearGradient(0, 0, 0, h); gd1.addColorStop(0, '#5ec8ff'); gd1.addColorStop(1, '#c4f1ff'); g.fillStyle = gd1; g.fillRect(0, 0, w, h);
        g.fillStyle = '#9be36b'; g.beginPath(); g.ellipse(w * 0.25, h - 30, 70, 40, 0, Math.PI, 0); g.fill(); g.beginPath(); g.ellipse(w * 0.8, h - 30, 60, 30, 0, Math.PI, 0); g.fill();
        var off = (t * 80) % 24; for (i = -1; i < w / 12 + 1; i++) { g.fillStyle = i % 2 ? '#c27a3a' : '#a65f2a'; g.fillRect(i * 12 - off % 12, h - 26, 12, 26); }
        g.fillStyle = '#4ade80'; g.fillRect(0, h - 32, w, 8);
        g.strokeStyle = '#c27a3a'; g.lineWidth = 9; g.beginPath(); g.arc(w * 0.62, h - 62, 30, 0, 7); g.stroke(); g.strokeStyle = '#4ade80'; g.lineWidth = 3; g.beginPath(); g.arc(w * 0.62, h - 62, 26, 0, 7); g.stroke();
        for (i = 0; i < 5; i++) { var rx3 = ((i * 44 - t * 90) % (w + 40) + w + 40) % (w + 40) - 20, ry3 = h - 52 - Math.sin(i * 1.3 + t) * 8; g.strokeStyle = '#ffd23f'; g.lineWidth = 3; g.beginPath(); g.ellipse(rx3, ry3, 4 + Math.abs(Math.sin(t * 4 + i)) * 3, 7, 0, 0, 7); g.stroke(); }
        var hx3 = w * 0.28, hy3 = h - 48 - Math.abs(Math.sin(t * 5)) * 22;
        g.fillStyle = '#7c4dff'; g.beginPath(); g.arc(hx3, hy3, 13, 0, 7); g.fill(); g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(hx3 - 4, hy3 - 12); g.lineTo(hx3, hy3 - 22); g.lineTo(hx3 + 4, hy3 - 12); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(hx3 + 5, hy3 - 3, 4.5, 0, 7); g.arc(hx3 - 3, hy3 - 3, 4.5, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(hx3 + 6, hy3 - 3, 2, 0, 7); g.arc(hx3 - 2, hy3 - 3, 2, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(hx3 + 18, hy3 + 2, 4.5, 0, 7); g.arc(hx3 - 17, hy3 + 4, 4.5, 0, 7); g.fill();
        g.font = font(20); g.textAlign = 'center'; g.fillStyle = '#7c4dff'; g.fillText('GROK DASH', w / 2, 24);
        break;
      }
      case 'spooks': {
        var gs1 = g.createLinearGradient(0, 0, 0, h); gs1.addColorStop(0, '#1a0b3a'); gs1.addColorStop(1, '#3b1d6e'); g.fillStyle = gs1; g.fillRect(0, 0, w, h);
        g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(w * 0.84, 40, 13, 0, 7); g.fill(); g.fillStyle = '#1a0b3a'; g.beginPath(); g.arc(w * 0.84 + 6, 36, 11, 0, 7); g.fill();
        g.fillStyle = '#120726'; g.beginPath(); g.moveTo(16, h); g.lineTo(16, 70); g.lineTo(40, 48); g.lineTo(64, 70); g.lineTo(64, 58); g.lineTo(86, 40); g.lineTo(108, 58); g.lineTo(108, h); g.fill();
        for (i = 0; i < 4; i++) { g.fillStyle = (Math.floor(t * 1.5 + i) % 3) ? '#ffd23f' : '#3a2466'; g.fillRect(26 + (i % 2) * 22, 80 + Math.floor(i / 2) * 22, 9, 11); }
        var sw = Math.sin(t * 1.4) * 0.35, fx = w * 0.62, fy = h - 20;
        g.save(); g.globalAlpha = 0.35; g.fillStyle = '#fffbd0'; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + Math.cos(-2.1 + sw) * 140, fy + Math.sin(-2.1 + sw) * 140); g.lineTo(fx + Math.cos(-1.4 + sw) * 140, fy + Math.sin(-1.4 + sw) * 140); g.closePath(); g.fill(); g.restore();
        var gx = w * 0.55 + Math.sin(t * 1.4) * 40, gy = 60 + Math.sin(t * 3) * 8;
        g.save(); g.shadowColor = '#5dff8a'; g.shadowBlur = 16; g.fillStyle = '#5dff8a'; g.beginPath(); g.arc(gx, gy, 15, Math.PI, 0); g.lineTo(gx + 15, gy + 16);
        for (i = 0; i < 3; i++) g.quadraticCurveTo(gx + 15 - i * 10 - 5, gy + 22, gx + 15 - (i + 1) * 10, gy + 16); g.closePath(); g.fill(); g.restore();
        g.fillStyle = '#16101f'; g.beginPath(); g.arc(gx - 5, gy - 2, 3, 0, 7); g.arc(gx + 5, gy - 2, 3, 0, 7); g.fill(); g.beginPath(); g.ellipse(gx, gy + 7, 3, 2.5, 0, 0, 7); g.fill();
        g.fillStyle = '#b06bff'; g.beginPath(); g.arc(fx, fy, 10, 0, 7); g.fill(); g.fillStyle = '#ff4fd8'; g.fillRect(fx - 11, fy - 13, 22, 5);
        g.fillStyle = '#ffe14d'; g.fillRect(fx + 6, fy - 6, 14, 6);
        g.font = font(20); g.textAlign = 'center'; g.fillStyle = '#5dff8a'; g.fillText('GROK SPOOKS', w / 2, 24);
        break;
      }
      case 'blocks': {
        var gb1 = g.createLinearGradient(0, 0, 0, h); gb1.addColorStop(0, '#ffcf8a'); gb1.addColorStop(1, '#ffe9b8'); g.fillStyle = gb1; g.fillRect(0, 0, w, h);
        for (i = 0; i < w / 16 + 1; i++) { var bh = 34 + ((i * 37) % 5) * 6; g.fillStyle = i % 2 ? '#7cc24a' : '#6bb33e'; g.fillRect(i * 16, h - bh, 16, bh); g.fillStyle = '#a0703c'; g.fillRect(i * 16, h - bh + 10, 16, 4); }
        g.fillStyle = '#5a9a33'; g.fillRect(18, 52, 8, 40); g.fillStyle = '#3f8a2a'; g.fillRect(4, 40, 38, 14);
        var zx = ((t * 60) % (w + 80)) - 40, zy = h - 74 - Math.abs(Math.sin(t * 8)) * 4;
        g.fillStyle = '#f4f4f4'; g.fillRect(zx, zy, 36, 18); g.fillRect(zx + 30, zy - 14, 12, 18);
        g.fillStyle = '#222'; for (i = 0; i < 4; i++) g.fillRect(zx + 4 + i * 8, zy, 3, 18); g.fillRect(zx + 34, zy - 14, 3, 18);
        for (i = 0; i < 4; i++) { g.fillStyle = '#f4f4f4'; g.fillRect(zx + 2 + i * 9, zy + 18, 4, 12); g.fillStyle = '#222'; g.fillRect(zx + 2 + i * 9, zy + 26, 4, 4); }
        var tx2 = zx - 74; g.fillStyle = '#2f8f4e'; g.fillRect(tx2, h - 70, 56, 20); g.fillStyle = '#1f6b38'; g.fillRect(tx2 + 34, h - 84, 22, 16); g.fillStyle = '#bfe8ff'; g.fillRect(tx2 + 38, h - 81, 14, 9);
        g.fillStyle = '#222'; g.beginPath(); g.arc(tx2 + 12, h - 48, 7, 0, 7); g.arc(tx2 + 44, h - 48, 7, 0, 7); g.fill();
        g.fillStyle = '#ffe14d'; g.fillRect(tx2 + 8, h - 82, 10, 10); g.fillStyle = '#ff4f6d'; g.fillRect(tx2 + 20, h - 82, 10, 10);
        g.font = font(20); g.textAlign = 'center'; g.fillStyle = '#1f6b38'; g.fillText('GROK BLOCKS', w / 2, 24);
        break;
      }
      case 'poke': {
        var gp1 = g.createLinearGradient(0, 0, 0, h); gp1.addColorStop(0, '#8fd8ff'); gp1.addColorStop(1, '#d9f99d'); g.fillStyle = gp1; g.fillRect(0, 0, w, h);
        g.fillStyle = '#6ec96a'; g.beginPath(); g.ellipse(40, h - 30, 80, 34, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(w - 30, h - 26, 90, 36, 0, 0, 7); g.fill();
        g.fillStyle = '#4caf50'; g.fillRect(0, h - 26, w, 26);
        for (i = 0; i < 3; i++) { var tx3 = 20 + i * 70; g.fillStyle = '#8b5a2b'; g.fillRect(tx3 - 3, h - 70, 6, 30); g.fillStyle = '#2f9e44'; g.beginPath(); g.arc(tx3, h - 76, 16, 0, 7); g.fill(); }
        var by3 = h - 52 + Math.abs(Math.sin(t * 4)) * -10, bx3 = w * 0.5 + Math.sin(t * 1.2) * 30;
        g.fillStyle = '#ff9f43'; g.beginPath(); g.arc(bx3, by3, 15, 0, 7); g.fill(); g.beginPath(); g.moveTo(bx3 - 12, by3 - 8); g.lineTo(bx3 - 6, by3 - 24); g.lineTo(bx3 - 1, by3 - 11); g.moveTo(bx3 + 12, by3 - 8); g.lineTo(bx3 + 6, by3 - 24); g.lineTo(bx3 + 1, by3 - 11); g.fill();
        g.fillStyle = '#ffe14d'; g.beginPath(); g.moveTo(bx3 - 2, by3 - 2); g.lineTo(bx3 + 4, by3 + 2); g.lineTo(bx3 - 2, by3 + 6); g.fill();
        g.fillStyle = '#16101f'; g.beginPath(); g.arc(bx3 - 5, by3 - 3, 2.4, 0, 7); g.fill(); g.beginPath(); g.arc(bx3 + 5, by3 - 3, 2.4, 0, 7); g.fill();
        var ox3 = 30 + ((t * 60) % (w - 20)), oy3 = 60 - Math.sin(((t * 60) % (w - 20)) / (w - 20) * Math.PI) * 30;
        g.fillStyle = '#ff4f6b'; g.beginPath(); g.arc(ox3, oy3, 8, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ox3, oy3, 8, 0, Math.PI); g.fill(); g.fillStyle = '#222'; g.fillRect(ox3 - 8, oy3 - 1, 16, 2); g.beginPath(); g.arc(ox3, oy3, 2.5, 0, 7); g.fill();
        g.font = font(20); g.textAlign = 'center'; g.fillStyle = '#1f6b38'; g.fillText('GROK POKE', w / 2, 24);
        break;
      }
      case 'filing': {
        g.fillStyle = '#5a2333'; g.fillRect(0, 0, w, h);
        var bc = ['#ff4fd8', '#3ff0ff', '#4ade80', '#9ca3af'];
        for (i = 0; i < 4; i++) { g.fillStyle = '#6b7280'; g.fillRect(8 + i * (w - 16) / 4 + 3, h - 46, (w - 16) / 4 - 6, 40); g.fillStyle = bc[i]; g.fillRect(8 + i * (w - 16) / 4 + 12, h - 38, (w - 16) / 4 - 24, 9); }
        var fk = Math.floor(t / 1.1) % 3, fy = 40 + ((t % 1.1) / 1.1) * (h - 110);
        g.fillStyle = bc[fk]; g.fillRect(w / 2 - 26, fy - 8, 20, 8); g.fillRect(w / 2 - 26, fy, 52, 34); g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(w / 2 - 18, fy + 10, 36, 12);
        g.fillStyle = '#f1c7a5'; g.beginPath(); g.arc(w - 30, 52, 16, 0, 7); g.fill(); g.fillStyle = '#d6d6d6'; g.beginPath(); g.ellipse(w - 36, 60, 7, 3.5, 0.3, 0, 7); g.ellipse(w - 24, 60, 7, 3.5, -0.3, 0, 7); g.fill();
        g.strokeStyle = '#2b2b2b'; g.lineWidth = 1.5; g.beginPath(); g.arc(w - 35, 49, 4, 0, 7); g.moveTo(w - 21, 49); g.arc(w - 25, 49, 4, 0, 7); g.stroke();
        g.font = font(17); g.textAlign = 'center'; g.fillStyle = '#ffe14d'; g.fillText('FILING FRENZY', w / 2, 22);
        break;
      }
      case 'catch': {
        g.fillStyle = '#7cc56a'; g.fillRect(0, 0, w, h);
        for (i = 0; i < 6; i++) { var cx4 = w * (0.2 + (i % 3) * 0.3), cy4 = h * (i < 3 ? 0.45 : 0.8); g.fillStyle = '#2f9e44'; [[-12, 0, 12], [12, 0, 12], [0, -8, 14]].forEach(function (q) { g.beginPath(); g.arc(cx4 + q[0], cy4 + q[1], q[2], 0, 7); g.fill(); }); }
        var pi4 = Math.floor(t / 0.8) % 6, px4 = w * (0.2 + (pi4 % 3) * 0.3), py4 = h * (pi4 < 3 ? 0.45 : 0.8) - 18 - Math.sin((t % 0.8) / 0.8 * Math.PI) * 10;
        g.fillStyle = pi4 === 4 ? '#5b4b8a' : '#ffb84d'; g.beginPath(); g.arc(px4, py4, 11, 0, 7); g.fill(); g.fillStyle = '#16101f'; g.beginPath(); g.arc(px4 - 4, py4 - 2, 2, 0, 7); g.fill(); g.beginPath(); g.arc(px4 + 4, py4 - 2, 2, 0, 7); g.fill();
        g.font = font(18); g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('CRITTER CATCH', w / 2, 22);
        break;
      }
      case 'heist': {
        // night museum: a purple-hoodie hacker tiptoes past a swinging guard flashlight cone toward a glowing diamond
        var gh1 = g.createLinearGradient(0, 0, 0, h); gh1.addColorStop(0, '#1e1b4b'); gh1.addColorStop(1, '#4c1d95'); g.fillStyle = gh1; g.fillRect(0, 0, w, h);
        g.fillStyle = '#fef3c7'; g.beginPath(); g.arc(w - 26, 40, 11, 0, 7); g.fill(); g.fillStyle = '#1e1b4b'; g.beginPath(); g.arc(w - 21, 37, 10, 0, 7); g.fill();
        g.fillStyle = '#c4b5fd'; g.fillRect(0, h - 30, w, 30); g.fillStyle = '#a78bfa'; for (i = 0; i < 8; i++) g.fillRect(i * 26, h - 30, 2, 30);
        var gx5 = w * 0.75, gy5 = h - 40, sw5 = Math.sin(t * 1.4) * 0.5;
        g.fillStyle = 'rgba(255,240,140,.35)'; g.beginPath(); g.moveTo(gx5 - 6, gy5 - 18); g.lineTo(gx5 - 80, gy5 + 30 + sw5 * 30); g.lineTo(gx5 - 40, gy5 + 40 - sw5 * 30); g.closePath(); g.fill();
        g.fillStyle = '#2563eb'; rrF(g, gx5 - 9, gy5 - 22, 18, 26, 6); g.fillStyle = '#ffd7b0'; g.beginPath(); g.arc(gx5, gy5 - 30, 8, 0, 7); g.fill(); g.fillStyle = '#1e3a8a'; g.fillRect(gx5 - 9, gy5 - 40, 18, 5);
        var dy5 = 54 + Math.sin(t * 3) * 3; g.fillStyle = '#e0f2fe'; g.beginPath(); g.moveTo(w * 0.5, dy5 - 12); g.lineTo(w * 0.5 + 11, dy5); g.lineTo(w * 0.5, dy5 + 13); g.lineTo(w * 0.5 - 11, dy5); g.closePath(); g.fill();
        g.fillStyle = 'rgba(125,211,252,.5)'; g.beginPath(); g.arc(w * 0.5, dy5, 18 + Math.sin(t * 5) * 2, 0, 7); g.fill(); g.fillStyle = '#f4ede2'; g.fillRect(w * 0.5 - 9, dy5 + 14, 18, h - 30 - dy5 - 14);
        var hx5 = 22 + ((t * 18) % (w * 0.42)), bob5 = Math.abs(Math.sin(t * 6)) * 3;
        g.fillStyle = '#7c3aed'; rrF(g, hx5 - 9, h - 58 - bob5, 18, 24, 7); g.beginPath(); g.arc(hx5, h - 62 - bob5, 10, 0, 7); g.fill(); g.fillStyle = '#ffd7b0'; g.beginPath(); g.arc(hx5 + 2, h - 61 - bob5, 6, 0, 7); g.fill();
        g.fillStyle = '#16101f'; g.fillRect(hx5 - 6, h - 35, 5, 6); g.fillRect(hx5 + 2, h - 35, 5, 6); g.fillStyle = '#3ff0ff'; g.fillRect(hx5 + 7, h - 64 - bob5, 4, 3);
        g.font = font(19); g.textAlign = 'center'; g.fillStyle = '#ffd23f'; g.fillText('HEIST CREW', w / 2, 22);
        break;
      }
      case 'pickle': {
        // sunny park court: blue court with green kitchen, net, two players dinking a yellow ball back and forth
        var gq1 = g.createLinearGradient(0, 0, 0, h); gq1.addColorStop(0, '#7dd3fc'); gq1.addColorStop(0.45, '#bbf7d0'); gq1.addColorStop(1, '#22c55e'); g.fillStyle = gq1; g.fillRect(0, 0, w, h);
        g.fillStyle = '#2f9e44'; for (i = 0; i < 4; i++) { g.beginPath(); g.arc(18 + i * 58, 52, 16, 0, 7); g.fill(); }
        g.fillStyle = '#2563eb'; g.beginPath(); g.moveTo(w * 0.3, 62); g.lineTo(w * 0.7, 62); g.lineTo(w * 0.92, h - 8); g.lineTo(w * 0.08, h - 8); g.closePath(); g.fill();
        var ny = 62 + (h - 70) * 0.42; g.fillStyle = '#16a34a'; g.fillRect(w * 0.21, ny - 14, w * 0.58, 30);
        g.fillStyle = 'rgba(15,23,42,.6)'; g.fillRect(w * 0.18, ny - 12, w * 0.64, 12); g.fillStyle = '#fff'; g.fillRect(w * 0.18, ny - 14, w * 0.64, 3);
        var kq = (Math.sin(t * 2.2) + 1) / 2, qx = w * (0.42 + 0.16 * Math.sin(t * 1.3)), qy = 78 + kq * (h - 120), qh = Math.abs(Math.sin(t * 4.4)) * 16;
        g.fillStyle = '#e11d48'; rrF(g, w * 0.48, 66, 12, 16, 4); g.fillStyle = '#f1c7a5'; g.beginPath(); g.arc(w * 0.48 + 6, 62, 6, 0, 7); g.fill();
        g.fillStyle = '#3b82f6'; rrF(g, w * 0.45, h - 46, 20, 26, 7); g.fillStyle = '#f1c7a5'; g.beginPath(); g.arc(w * 0.45 + 10, h - 52, 9, 0, 7); g.fill(); g.fillStyle = '#1d4ed8'; g.beginPath(); g.arc(w * 0.45 + 10, h - 54, 9.5, Math.PI, 0); g.fill();
        g.fillStyle = '#22c55e'; g.beginPath(); g.ellipse(w * 0.45 + 28, h - 50, 7, 9, 0.4, 0, 7); g.fill();
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(qx, qy + 4, 5, 2, 0, 0, 7); g.fill();
        g.fillStyle = '#e6ff3b'; g.beginPath(); g.arc(qx, qy - qh, 5, 0, 7); g.fill();
        g.font = font(19); g.textAlign = 'center'; g.fillStyle = '#14532d'; g.fillText('GROK PICKLEBALL', w / 2, 24);
        break;
      }
      case 'sports': {
        // sports plaza: stadium lights, a big blue/yellow banner, balls bouncing across five lanes (soccer, basketball, tennis, bowling, volleyball)
        var gs1 = g.createLinearGradient(0, 0, 0, h); gs1.addColorStop(0, '#1e3a8a'); gs1.addColorStop(0.5, '#3b82f6'); gs1.addColorStop(0.51, '#16a34a'); gs1.addColorStop(1, '#15803d'); g.fillStyle = gs1; g.fillRect(0, 0, w, h);
        for (i = 0; i < 4; i++) { var lx7 = 18 + i * (w - 36) / 3; g.fillStyle = '#cbd5e1'; g.fillRect(lx7 - 1.5, 34, 3, 40); g.fillStyle = 'rgba(255,255,200,' + (0.6 + 0.4 * Math.sin(t * 3 + i)) + ')'; rrF(g, lx7 - 9, 30, 18, 8, 2); }
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.strokeRect(10, h * 0.55, w - 20, h * 0.4); g.beginPath(); g.arc(w / 2, h * 0.75, 14, 0, 7); g.moveTo(w / 2, h * 0.55); g.lineTo(w / 2, h * 0.95); g.stroke();
        var cols7 = ['#ffffff', '#f97316', '#e6ff3b', '#a855f7', '#fde047'];
        for (i = 0; i < 5; i++) { var bx7 = ((t * (40 + i * 9) + i * 50) % (w + 30)) - 15, by7 = h * 0.62 + i * 9 - Math.abs(Math.sin(t * (3 + i * 0.4) + i)) * 26;
          g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(bx7, h * 0.66 + i * 9, 6, 2, 0, 0, 7); g.fill(); g.fillStyle = cols7[i]; g.beginPath(); g.arc(bx7, by7, i === 3 ? 7 : 5.5, 0, 7); g.fill(); }
        g.fillStyle = '#facc15'; rrF(g, w * 0.08, 6, w * 0.84, 26, 6); g.font = font(16); g.textAlign = 'center'; g.fillStyle = '#1e3a8a'; g.fillText('GROK SPORTS COMMAND', w / 2, 24);
        break;
      }
      case 'kart': {
        // kart party: pink-sky candy hills, a curving checkered road and three karts drifting with purple sparks
        var gk = g.createLinearGradient(0, 0, 0, h); gk.addColorStop(0, '#5b6cff'); gk.addColorStop(0.45, '#ff8fd8'); gk.addColorStop(0.62, '#ffe6a8'); gk.addColorStop(0.63, '#4ade80'); gk.addColorStop(1, '#16a34a'); g.fillStyle = gk; g.fillRect(0, 0, w, h);
        for (i = 0; i < 4; i++) { g.fillStyle = ['#7cff6b', '#ff7ab6', '#3ff0ff', '#ffe14d'][i]; g.beginPath(); g.ellipse(((i * 70 - t * 12) % (w + 80) + w + 80) % (w + 80) - 40, h * 0.63, 46, 22 + i * 4, 0, Math.PI, 0); g.fill(); }
        var ry9 = h * 0.63; g.fillStyle = '#ff4fd8'; g.beginPath(); g.moveTo(w * 0.46, ry9); g.lineTo(w * 0.54, ry9); g.lineTo(w * 0.98, h); g.lineTo(w * 0.02, h); g.closePath(); g.fill();
        g.fillStyle = '#ffb3e6'; g.beginPath(); g.moveTo(w * 0.47, ry9); g.lineTo(w * 0.53, ry9); g.lineTo(w * 0.9, h); g.lineTo(w * 0.1, h); g.closePath(); g.fill();
        for (i = 0; i < 6; i++) { var q9 = ((i / 6 + t * 0.6) % 1), yy9 = ry9 + (h - ry9) * q9 * q9; g.fillStyle = '#fff'; g.fillRect(w / 2 - 1 - q9 * 2, yy9, 2 + q9 * 4, 2 + q9 * 6); }
        var kc9 = ['#e11d48', '#3ff0ff', '#ffd23f'];
        for (i = 0; i < 3; i++) { var kq = 0.35 + i * 0.25, kx9 = w / 2 + Math.sin(t * 1.6 + i * 2) * w * 0.22 * kq, ky9 = ry9 + (h - ry9) * kq * kq + 6, ks9 = 0.5 + kq * 0.7;
          g.save(); g.translate(kx9, ky9); g.rotate(Math.sin(t * 1.6 + i * 2) * 0.25); g.scale(ks9, ks9);
          g.fillStyle = '#1f2433'; g.fillRect(-16, 0, 8, 9); g.fillRect(8, 0, 8, 9); g.fillStyle = kc9[i]; rrF(g, -13, -6, 26, 11, 4); g.fillStyle = '#e8f1ff'; rrF(g, -5, -15, 10, 9, 3);
          for (var sp9 = 0; sp9 < 3; sp9++) { g.fillStyle = (sp9 + ((t * 10) | 0)) % 2 ? '#c084fc' : '#fb923c'; g.beginPath(); g.arc(-14 + Math.random() * 4, 9 + Math.random() * 3, 1.6, 0, 7); g.arc(14 - Math.random() * 4, 9 + Math.random() * 3, 1.6, 0, 7); g.fill(); }
          g.restore(); }
        for (i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#111827' : '#ffffff'; g.fillRect(w * 0.08 + i * (w * 0.84 / 8), 4, w * 0.84 / 8, 4); g.fillStyle = i % 2 ? '#ffffff' : '#111827'; g.fillRect(w * 0.08 + i * (w * 0.84 / 8), 8, w * 0.84 / 8, 4); }
        g.fillStyle = '#ff4fd8'; rrF(g, w * 0.08, 12, w * 0.84, 24, 6); g.font = font(16); g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('GROK KART PARTY', w / 2, 30);
        break;
      }
      case 'drift': {
        g.fillStyle = '#2a1a7a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffb3e6'; g.beginPath(); g.moveTo(w * 0.42, h * 0.38); g.lineTo(w * 0.58, h * 0.38); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
        var cl10 = ((t * 0.7) % 1), col10 = cl10 < 0.33 ? '#38bdf8' : cl10 < 0.66 ? '#fb923c' : '#c084fc';
        g.save(); g.translate(w / 2, h * 0.78); g.rotate(Math.sin(t * 2) * 0.3); g.fillStyle = '#1f2433'; g.fillRect(-24, 0, 10, 12); g.fillRect(14, 0, 10, 12); g.fillStyle = '#e11d48'; rrF(g, -20, -10, 40, 16, 6); g.fillStyle = '#e8f1ff'; rrF(g, -7, -24, 14, 13, 4);
        for (i = 0; i < 8; i++) { g.fillStyle = col10; g.beginPath(); g.arc((i % 2 ? 1 : -1) * (20 + Math.random() * 8), 12 + Math.random() * 6, 2.4, 0, 7); g.fill(); } g.restore();
        g.font = font(18); g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('SPARK DRIFT', w / 2, 22); g.fillStyle = col10; g.font = font(13); g.fillText('HOLD... LET GO!', w / 2, 44);
        break;
      }
      case 'hoop': {
        g.fillStyle = '#1d4ed8'; g.fillRect(0, 0, w, h); g.fillStyle = '#c2410c'; g.fillRect(0, h * 0.72, w, h * 0.28);
        var hx8 = w / 2 + Math.sin(t * 1.6) * w * 0.3; g.fillStyle = '#f8fafc'; rrF(g, hx8 - 26, 34, 52, 34, 3); g.strokeStyle = '#ef4444'; g.lineWidth = 2; g.strokeRect(hx8 - 10, 46, 20, 14);
        g.strokeStyle = '#f97316'; g.lineWidth = 3; g.beginPath(); g.ellipse(hx8, 70, 14, 4, 0, 0, 7); g.stroke();
        var k8 = (t % 1.2) / 1.2, by8 = h - 26 - k8 * (h - 100); g.fillStyle = '#f97316'; g.beginPath(); g.arc(w / 2, by8, 9 - k8 * 3, 0, 7); g.fill();
        g.font = font(18); g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('HOOP FRENZY', w / 2, 22);
        break;
      }
      case 'disaster': {
        // Disaster Zone: orange-purple storm sky, a purple kaiju stomping past the city, meteors streaking down, a lightning flash
        var gd1 = g.createLinearGradient(0, 0, 0, h); gd1.addColorStop(0, '#3b0764'); gd1.addColorStop(0.55, '#ea580c'); gd1.addColorStop(0.56, '#4a5260'); gd1.addColorStop(1, '#334155'); g.fillStyle = gd1; g.fillRect(0, 0, w, h);
        if (Math.sin(t * 2.3) > 0.93) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fde047'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * 0.8, 30); g.lineTo(w * 0.74, 60); g.lineTo(w * 0.8, 62); g.lineTo(w * 0.72, h * 0.55); g.stroke(); }
        var bc9 = ['#4cc9f0', '#f72585', '#ffca3a', '#8ac926', '#ff924c'];
        for (i = 0; i < 6; i++) { var bh9 = 30 + (i * 23) % 40; g.fillStyle = bc9[i % 5]; g.fillRect(i * w / 6 + 2, h * 0.55 - bh9, w / 6 - 4, bh9); }
        var kx9 = ((t * 18) % (w + 80)) - 40; g.fillStyle = '#7b5cd6'; g.beginPath(); g.ellipse(kx9, h * 0.42, 18, 26, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(kx9 + 10, h * 0.25, 12, 10, 0, 0, 7); g.fill(); g.fillStyle = '#5ff3ff'; for (i = 0; i < 3; i++) { g.beginPath(); g.moveTo(kx9 - 14, h * 0.3 + i * 9); g.lineTo(kx9 - 24, h * 0.27 + i * 9); g.lineTo(kx9 - 12, h * 0.36 + i * 9); g.fill(); }
        g.fillStyle = '#111'; g.beginPath(); g.arc(kx9 + 14, h * 0.23, 2, 0, 7); g.fill();
        for (i = 0; i < 4; i++) { var mk9 = ((t * 0.7 + i * 0.27) % 1), mx9 = (i * 47 + 30) % w + mk9 * 20, my9 = 34 + mk9 * (h * 0.5); g.strokeStyle = 'rgba(255,190,80,.7)'; g.lineWidth = 4; g.beginPath(); g.moveTo(mx9 - 16, my9 - 22); g.lineTo(mx9, my9); g.stroke(); g.fillStyle = '#8b5e3c'; g.beginPath(); g.arc(mx9, my9, 5, 0, 7); g.fill(); }
        g.fillStyle = '#ffd23f'; for (i = 0; i < 6; i++) g.fillRect(i * w / 5 + 6, h * 0.8, w / 10, 3);
        g.fillStyle = '#ff7b00'; rrF(g, w * 0.08, 6, w * 0.84, 26, 6); g.font = font(16); g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('GROK DISASTER ZONE', w / 2, 24);
        break;
      }
      case 'hunters': {
        // Monster Hunters: sunny meadow, a big round monster bobbing, a little hunter swinging a sword, title banner
        var gh1 = g.createLinearGradient(0, 0, 0, h); gh1.addColorStop(0, '#1ea7ff'); gh1.addColorStop(0.6, '#c8f4ff'); gh1.addColorStop(0.61, '#6cc24a'); gh1.addColorStop(1, '#3f9e44'); g.fillStyle = gh1; g.fillRect(0, 0, w, h);
        for (i = 0; i < 4; i++) { var tx7 = (i * 61 + 14) % w; g.fillStyle = '#8b5a2b'; g.fillRect(tx7 - 3, h * 0.48, 6, h * 0.13); g.fillStyle = '#3f9e44'; g.beginPath(); g.arc(tx7, h * 0.46, 16, 0, 7); g.fill(); }
        var mx7 = w * 0.62 + Math.sin(t * 0.8) * w * 0.12, by7 = Math.sin(t * 5) * 3; g.fillStyle = '#22d3ee'; g.beginPath(); g.ellipse(mx7, h * 0.56 + by7, 34, 22, 0, 0, 7); g.fill(); g.beginPath(); g.arc(mx7 - 30, h * 0.47 + by7, 16, 0, 7); g.fill();
        g.fillStyle = '#facc15'; for (i = 0; i < 3; i++) { g.beginPath(); g.moveTo(mx7 - 14 + i * 14, h * 0.47 + by7); g.lineTo(mx7 - 8 + i * 14, h * 0.38 + by7); g.lineTo(mx7 - 2 + i * 14, h * 0.47 + by7); g.fill(); }
        g.fillStyle = '#fff'; g.beginPath(); g.arc(mx7 - 34, h * 0.46 + by7, 5, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(mx7 - 36, h * 0.46 + by7, 2.5, 0, 7); g.fill();
        var hx7 = mx7 - 70; g.fillStyle = '#22d3ee'; g.fillRect(hx7 - 5, h * 0.58, 10, 12); g.fillStyle = '#f6c9a0'; g.beginPath(); g.arc(hx7, h * 0.55, 6, 0, 7); g.fill(); g.fillStyle = '#0e7490'; g.beginPath(); g.arc(hx7, h * 0.545, 6.5, Math.PI, 0); g.fill();
        g.save(); g.translate(hx7 + 6, h * 0.6); g.rotate(-1.2 + (Math.sin(t * 6) * 0.5 + 0.5) * 1.6); g.fillStyle = '#e2e8f0'; g.fillRect(-1.5, -18, 3, 18); g.restore();
        if (Math.sin(t * 6) > 0.7) { g.fillStyle = '#fde047'; g.font = font(12); g.textAlign = 'center'; g.fillText('\u2605', mx7 - 46, h * 0.5); }
        g.fillStyle = '#f59e0b'; rrF(g, w * 0.06, 6, w * 0.88, 26, 6); g.font = font(15); g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('GROK MONSTER HUNTERS', w / 2, 24);
        break;
      }
      case 'tame': {
        g.fillStyle = '#c8f4ff'; g.fillRect(0, 0, w, h); var gt2 = g.createLinearGradient(0, 0, 0, h * 0.75); gt2.addColorStop(0, '#1ea7ff'); gt2.addColorStop(1, '#c8f4ff'); g.fillStyle = gt2; g.fillRect(0, 0, w, h * 0.75); g.fillStyle = '#6cc24a'; g.fillRect(0, h * 0.75, w, h * 0.25);
        var mx2 = w / 2 + Math.sin(t * 1.1) * w * 0.22, k3 = (t % 1.4) / 1.4; g.strokeStyle = 'rgba(255,40,60,' + (0.5 + 0.5 * Math.sin(t * 18)) + ')'; g.lineWidth = 2; g.beginPath(); g.ellipse(mx2 + 20, h * 0.78, 26 * (0.4 + k3 * 0.6), 6, 0, 0, 7); g.stroke();
        g.fillStyle = '#fff4e6'; g.beginPath(); g.ellipse(mx2, h * 0.62, 28, 18, 0, 0, 7); g.fill(); g.beginPath(); g.arc(mx2 + 26, h * 0.54, 12, 0, 7); g.fill(); g.fillStyle = '#fde68a'; g.beginPath(); g.moveTo(mx2 + 24, h * 0.47); g.lineTo(mx2 + 30, h * 0.38); g.lineTo(mx2 + 34, h * 0.48); g.fill();
        g.fillStyle = '#111'; g.beginPath(); g.arc(mx2 + 30, h * 0.53, 2, 0, 7); g.fill(); g.fillStyle = '#fde047'; g.font = font(14); g.textAlign = 'center'; g.fillText('\u2605', mx2 - 18, h * 0.6);
        var px3 = mx2 - 50; g.fillStyle = '#22d3ee'; g.fillRect(px3 - 4, h * 0.7, 8, 10); g.fillStyle = '#0e7490'; g.beginPath(); g.arc(px3, h * 0.68, 5, 0, 7); g.fill();
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(w * 0.25, 30, w * 0.5, 7); g.fillStyle = '#f472b6'; g.fillRect(w * 0.25, 30, w * 0.5 * ((t * 0.15) % 1), 7);
        g.font = font(18); g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('TAME RUSH', w / 2, 22);
        break;
      }
      case 'meteor': {
        g.fillStyle = '#3b0764'; g.fillRect(0, 0, w, h); var gm2 = g.createLinearGradient(0, 0, 0, h * 0.75); gm2.addColorStop(0, '#3b0764'); gm2.addColorStop(1, '#fb923c'); g.fillStyle = gm2; g.fillRect(0, 0, w, h * 0.75); g.fillStyle = '#4a5260'; g.fillRect(0, h * 0.75, w, h * 0.25);
        var tx2 = w / 2 + Math.sin(t * 1.3) * w * 0.3, k2 = (t % 1.1) / 1.1; g.strokeStyle = 'rgba(255,40,60,' + (0.5 + 0.5 * Math.sin(t * 18)) + ')'; g.lineWidth = 2; g.beginPath(); g.ellipse(tx2, h * 0.78, 22, 6, 0, 0, 7); g.stroke();
        g.fillStyle = '#8b5e3c'; g.beginPath(); g.arc(tx2, 20 + k2 * (h * 0.7), 7, 0, 7); g.fill(); g.fillStyle = 'rgba(255,170,60,.6)'; g.beginPath(); g.arc(tx2 - 5, 8 + k2 * (h * 0.7), 6, 0, 7); g.fill();
        var px2 = w / 2 - Math.sin(t * 1.3) * w * 0.25; g.fillStyle = '#3b82f6'; g.fillRect(px2 - 4, h * 0.7, 8, 10); g.fillStyle = '#ef4444'; g.beginPath(); g.arc(px2, h * 0.68, 5, 0, 7); g.fill();
        g.font = font(18); g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('METEOR MAYHEM', w / 2, 22);
        break;
      }
      case 'ratita': {
        // Ratita Rescue: giant kitchen, three rats running along the counter, Candy peeking, cheese bouncing
        var gr1 = g.createLinearGradient(0, 0, 0, h); gr1.addColorStop(0, '#ffe8c2'); gr1.addColorStop(0.62, '#ffd2a1'); gr1.addColorStop(0.63, '#5b6b8c'); gr1.addColorStop(0.67, '#f7f2e8'); gr1.addColorStop(1, '#e9dfcc'); g.fillStyle = gr1; g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(214,160,120,.35)'; g.lineWidth = 1; for (i = 0; i < w; i += 18) { g.beginPath(); g.moveTo(i, 30); g.lineTo(i, h * 0.62); g.stroke(); }
        g.fillStyle = '#9ca3af'; g.beginPath(); g.ellipse(w * 0.86, h * 0.56, 26, 18, 0, 0, 7); g.fill(); g.fillStyle = '#e5e7eb'; g.beginPath(); g.ellipse(w * 0.8, h * 0.6, 12, 8, 0, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(w * 0.74, h * 0.58, 3, 0, 7); g.fill(); g.beginPath(); g.arc(w * 0.85, h * 0.5, 2, 0, 7); g.fill();
        ['#a9afbd', '#c99a6b', '#fbfbff'].forEach(function (c, k) { var rx = ((t * 40 + k * 46) % (w * 0.7)) + 10, ry = h * 0.6 - Math.abs(Math.sin(t * 6 + k)) * 10; g.fillStyle = c; g.beginPath(); g.ellipse(rx, ry, 11, 7, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(rx + 9, ry - 3, 6, 5, 0, 0, 7); g.fill(); g.fillStyle = '#f9a8d4'; g.beginPath(); g.arc(rx + 6, ry - 8, 3, 0, 7); g.fill(); g.strokeStyle = '#f9a8d4'; g.lineWidth = 2; g.beginPath(); g.moveTo(rx - 10, ry); g.lineTo(rx - 20, ry - 5); g.stroke(); });
        var cy9 = h * 0.4 + Math.sin(t * 3) * 6; g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(w * 0.5 - 14, cy9 + 8); g.lineTo(w * 0.5 + 14, cy9 + 8); g.lineTo(w * 0.5 + 14, cy9 - 6); g.closePath(); g.fill();
        g.fillStyle = '#ff4fa0'; rrF(g, w * 0.06, 6, w * 0.88, 26, 6); g.font = font(15); g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('GROK RATITA RESCUE', w / 2, 24);
        break;
      }
      case 'swing': {
        g.fillStyle = '#fff3e0'; g.fillRect(0, 0, w, h); g.fillStyle = '#f28c8c'; g.fillRect(0, h * 0.82, w, h * 0.18);
        for (i = 0; i < 3; i++) { var rxs = ((i * w / 2.4) - (t * 30) % (w / 2.4)) + 30; g.fillStyle = '#9ca3af'; g.fillRect(rxs - 1, 30, 2, h * 0.3 - 40); g.strokeStyle = '#3ff0ff'; g.lineWidth = 3; g.beginPath(); g.arc(rxs, h * 0.3, 7, 0, 7); g.stroke(); }
        var ax = w * 0.45 + Math.sin(t * 2.4) * 40, ay = h * 0.3 + Math.cos(t * 2.4) * 22 + 40; g.strokeStyle = '#f9a8d4'; g.lineWidth = 2; g.beginPath(); g.moveTo(w * 0.45, h * 0.3); g.lineTo(ax, ay); g.stroke(); g.fillStyle = '#a9afbd'; g.beginPath(); g.ellipse(ax, ay, 10, 7, 0, 0, 7); g.fill();
        g.font = font(18); g.textAlign = 'center'; g.fillStyle = '#ff4fa0'; g.fillText('TAIL SWING', w / 2, 22);
        break;
      }
      case 'lockpick': {
        g.fillStyle = '#1a0f2e'; g.fillRect(0, 0, w, h); g.fillStyle = '#d9b46a'; rrF(g, w * 0.12, h * 0.28, w * 0.76, h * 0.5, 10); g.fillStyle = '#5a4520'; g.fillRect(w * 0.15, h * 0.52, w * 0.7, h * 0.18);
        g.strokeStyle = '#4ade80'; g.lineWidth = 2; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(w * 0.14, h * 0.52); g.lineTo(w * 0.86, h * 0.52); g.stroke(); g.setLineDash([]);
        for (i = 0; i < 4; i++) { var px9 = w * (0.24 + i * 0.17), act9 = i === Math.floor(t * 0.8) % 4, y9 = act9 ? Math.abs(Math.sin(t * 3)) * 14 : (i < Math.floor(t * 0.8) % 4 ? 8 : 0);
          g.fillStyle = '#e5e7eb'; g.fillRect(px9 - 6, h * 0.3, 12, h * 0.2 - y9); g.fillStyle = i < Math.floor(t * 0.8) % 4 ? '#4ade80' : act9 ? '#3ff0ff' : '#7c6a9a'; g.fillRect(px9 - 6, h * 0.52 - y9 + 2, 12, h * 0.16); }
        g.font = font(17); g.textAlign = 'center'; g.fillStyle = '#ffd23f'; g.fillText('LOCKPICK PANIC', w / 2, 22);
        break;
      }
      case 'dink': {
        g.fillStyle = '#2563eb'; g.fillRect(0, 0, w, h); g.fillStyle = '#16a34a'; g.fillRect(0, h * 0.42, w, h * 0.28);
        g.fillStyle = 'rgba(15,23,42,.6)'; g.fillRect(0, h * 0.5, w, 10); g.fillStyle = '#fff'; g.fillRect(0, h * 0.5 - 2, w, 3);
        var dk = (t % 1.6) / 1.6, dy = 40 + dk * (h - 70), dh = dk < 0.6 ? Math.sin(dk / 0.6 * Math.PI) * 30 : Math.sin((dk - 0.6) / 0.4 * Math.PI) * 14;
        g.strokeStyle = '#ffe14d'; g.lineWidth = 2; g.beginPath(); g.ellipse(w / 2, 40 + 0.6 * (h - 70), 11, 4, 0, 0, 7); g.stroke();
        g.fillStyle = '#e6ff3b'; g.beginPath(); g.arc(w / 2, dy - dh, 6, 0, 7); g.fill();
        g.font = font(18); g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('DINK DUEL', w / 2, 22);
        break;
      }
      case 'laser': {
        g.fillStyle = '#140a26'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a1650'; g.fillRect(0, h - 34, w, 34);
        for (i = 0; i < 3; i++) { var lx6 = ((i * 70 - t * 60) % (w + 40) + w + 40) % (w + 40) - 20, low6 = i % 2 === 0, ly6 = low6 ? h - 46 : h - 86;
          g.fillStyle = '#5b4b8a'; g.fillRect(lx6 - 3, low6 ? ly6 - 4 : ly6 - 14, 6, low6 ? 16 : 18); g.strokeStyle = 'rgba(255,61,110,' + (0.7 + Math.sin(t * 20 + i) * 0.3) + ')'; g.lineWidth = 4; g.beginPath(); g.moveTo(lx6 - 26, ly6); g.lineTo(lx6 + 26, ly6); g.stroke(); }
        var jy6 = Math.max(0, Math.sin(t * 3.2)) * 26; g.fillStyle = '#7c3aed'; rrF(g, 40, h - 62 - jy6, 18, 24, 7); g.beginPath(); g.arc(49, h - 66 - jy6, 10, 0, 7); g.fill(); g.fillStyle = '#ffd7b0'; g.beginPath(); g.arc(51, h - 65 - jy6, 6, 0, 7); g.fill();
        g.fillStyle = '#7dd3fc'; var dx6 = w - ((t * 50) % w); g.beginPath(); g.moveTo(dx6, 44); g.lineTo(dx6 + 7, 52); g.lineTo(dx6, 61); g.lineTo(dx6 - 7, 52); g.closePath(); g.fill();
        g.font = font(19); g.textAlign = 'center'; g.fillStyle = '#ff3d6e'; g.fillText('LASER DASH', w / 2, 22);
        break;
      }
      case 'rides': {
        var gr1 = g.createLinearGradient(0, 0, 0, h); gr1.addColorStop(0, '#7dd3fc'); gr1.addColorStop(1, '#fbcfe8'); g.fillStyle = gr1; g.fillRect(0, 0, w, h);
        g.fillStyle = '#c4b5fd'; g.beginPath(); g.moveTo(0, h - 50); g.lineTo(46, h - 104); g.lineTo(84, h - 70); g.lineTo(126, h - 120); g.lineTo(w, h - 56); g.lineTo(w, h - 40); g.lineTo(0, h - 40); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.moveTo(114, h - 106); g.lineTo(126, h - 120); g.lineTo(138, h - 106); g.fill();
        g.fillStyle = '#86efac'; g.fillRect(0, h - 44, w, 44); g.fillStyle = '#4b5563'; g.fillRect(0, h - 32, w, 20);
        g.fillStyle = '#facc15'; for (i = 0; i < 6; i++) g.fillRect(((i * 40 - t * 120) % (w + 40) + w + 40) % (w + 40) - 20, h - 23, 18, 3);
        var bx = 30 + Math.sin(t * 0.7) * 12, by = 46 + Math.sin(t * 1.3) * 5; g.fillStyle = '#ff4fd8'; g.beginPath(); g.arc(bx, by, 14, 0, 7); g.fill(); g.fillStyle = '#ffd23f'; g.fillRect(bx - 2, by - 14, 4, 28); g.fillStyle = '#8b5a2b'; g.fillRect(bx - 5, by + 18, 10, 7);
        var hx = ((t * 50) % (w + 60)) - 30; g.fillStyle = '#38bdf8'; g.beginPath(); g.ellipse(w - hx, 42, 12, 7, 0, 0, 7); g.fill(); g.fillRect(w - hx + 8, 40, 16, 3); g.fillStyle = '#222'; g.fillRect(w - hx - 16 + Math.sin(t * 30) * 8, 33, 32, 2);
        var cx3 = w * 0.55 + Math.sin(t * 2) * 6; g.fillStyle = '#ff4fd8'; g.fillRect(cx3 - 22, h - 42, 44, 12); g.fillRect(cx3 - 12, h - 52, 24, 10); g.fillStyle = '#bfe8ff'; g.fillRect(cx3 - 9, h - 50, 18, 7);
        g.fillStyle = '#111'; g.beginPath(); g.arc(cx3 - 13, h - 29, 5, 0, 7); g.arc(cx3 + 13, h - 29, 5, 0, 7); g.fill();
        g.font = font(20); g.textAlign = 'center'; g.fillStyle = '#9d174d'; g.fillText('GROK RIDES', w / 2, 24);
        break;
      }
      case 'rush': {
        g.fillStyle = '#86c06c'; g.fillRect(0, 0, w, h); var rx0 = w * 0.2, rw3 = w * 0.6; g.fillStyle = '#4b5563'; g.fillRect(rx0, 0, rw3, h);
        g.fillStyle = '#facc15'; for (i = 0; i < 6; i++) { var yy = ((i * 30 + t * 140) % (h + 30)) - 30; g.fillRect(rx0 + rw3 / 3 - 1, yy, 3, 14); g.fillRect(rx0 + rw3 * 2 / 3 - 1, yy, 3, 14); }
        var tc = ['#3b82f6', '#facc15', '#22c55e'];
        for (i = 0; i < 3; i++) { var ty = ((i * 55 + t * 70) % (h + 40)) - 30; g.fillStyle = tc[i]; g.fillRect(rx0 + rw3 * ((i * 2) % 3 + 0.5) / 3 - 9, ty, 18, 28); }
        var ml = Math.floor(t / 1.1) % 3, mx3 = rx0 + rw3 * (ml + 0.5) / 3; g.fillStyle = '#ff4fd8'; g.fillRect(mx3 - 9, h - 44, 18, 30); g.fillStyle = '#fff'; g.fillRect(mx3 - 1, h - 42, 2, 26);
        g.font = font(18); g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('RUSH HOUR', w / 2, 22);
        break;
      }
      case 'parking': {
        g.fillStyle = '#4b5563'; g.fillRect(0, 0, w, h);
        for (i = 0; i < 6; i++) { g.fillStyle = '#f8fafc'; g.fillRect(10 + i * (w - 20) / 5 - 2, 34, 4, 56); }
        var pc = ['#ef4444', '#3b82f6', null, '#f59e0b', '#22c55e'];
        for (i = 0; i < 5; i++) { var px2 = 10 + (i + 0.5) * (w - 20) / 5; if (pc[i]) { g.fillStyle = pc[i]; g.fillRect(px2 - 12, 42, 24, 38); } else { g.fillStyle = 'rgba(74,222,128,' + (0.4 + Math.sin(t * 6) * 0.2) + ')'; g.fillRect(px2 - 16, 38, 32, 48); } }
        var my2 = h - 40 - ((t * 90) % (h - 90)), mx2 = 10 + 2.5 * (w - 20) / 5; g.fillStyle = '#ff4fd8'; g.fillRect(mx2 - 12, my2, 24, 38);
        g.font = font(18); g.textAlign = 'center'; g.fillStyle = '#4ade80'; g.fillText('PARKING PANIC', w / 2, 22);
        break;
      }
      case 'pets': {
        var gq = g.createLinearGradient(0, 0, 0, h); gq.addColorStop(0, '#a8e6ff'); gq.addColorStop(1, '#ffd6f0'); g.fillStyle = gq; g.fillRect(0, 0, w, h);
        g.fillStyle = '#7ed36f'; g.fillRect(0, h - 34, w, 34);
        var hop2 = Math.abs(Math.sin(t * 3)) * 14, dx2 = w * 0.32, dy2 = h - 40 - hop2;
        g.fillStyle = '#8b9099'; g.beginPath(); g.ellipse(dx2, dy2, 26, 16, 0, 0, 7); g.fill(); g.beginPath(); g.arc(dx2 + 22, dy2 - 16, 15, 0, 7); g.fill();
        g.fillStyle = '#eceef2'; g.beginPath(); g.ellipse(dx2 + 30, dy2 - 8, 10, 7, 0, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(dx2 + 24, dy2 - 20, 2.5, 0, 7); g.arc(dx2 + 38, dy2 - 9, 3, 0, 7); g.fill();
        g.fillStyle = '#c9a36b'; g.beginPath(); g.arc(w * 0.72, h - 44, 18, Math.PI, 0); g.fill(); g.fillStyle = '#a07a45'; g.beginPath(); g.arc(w * 0.72 + 20, h - 50, 7, 0, 7); g.fill();
        for (i = 0; i < 3; i++) { var hy = (h - 70 - ((t * 30 + i * 25) % 60)); if (GA.MG && GA.MG.U) GA.MG.U.heart(g, dx2 + 10 + i * 14, hy, 14 + i * 2, '#ff4f8b'); }
        g.font = font(20); g.textAlign = 'center'; g.fillStyle = '#ff4fd8'; g.fillText('GROK PETS', w / 2, 24);
        break;
      }
      case 'skee': {
        var gk = g.createLinearGradient(0, 0, 0, h); gk.addColorStop(0, '#1a0838'); gk.addColorStop(1, '#3a1c0a'); g.fillStyle = gk; g.fillRect(0, 0, w, h);
        var rc = ['#4ade80', '#a78bfa', '#3ff0ff', '#ff4fd8', '#ffe14d'];
        for (i = 0; i < 5; i++) { g.strokeStyle = rc[i]; g.lineWidth = 4; g.beginPath(); g.arc(w / 2, h * 0.36, 44 - i * 9, 0, 7); g.stroke(); }
        g.strokeStyle = '#ffe14d'; g.beginPath(); g.arc(28, 22, 9, 0, 7); g.arc(w - 28, 22, 9, 0, 7); g.stroke();
        g.fillStyle = '#a8652d'; g.beginPath(); g.moveTo(w / 2 - 40, h * 0.62); g.lineTo(w / 2 + 40, h * 0.62); g.lineTo(w / 2 + 70, h - 24); g.lineTo(w / 2 - 70, h - 24); g.fill();
        var kk = (t * 0.8) % 1, by = h - 34 - kk * (h * 0.62), br = 10 - kk * 4; g.fillStyle = kk > 0.85 ? '#ffe14d' : '#e9ddff'; g.beginPath(); g.arc(w / 2 + Math.sin(t) * 10 * kk, by, br, 0, 7); g.fill();
        g.font = font(16); g.textAlign = 'center'; g.fillStyle = '#ffb020'; g.fillText('SKEE-BALL', w / 2, h * 0.6);
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
  function buildCabinet(game, kind, x, z, rot, kOverride) {
    var grp = new T.Group(); grp.position.set(x, 0, z); grp.rotation.y = rot; scene.add(grp);
    var ck = kOverride || (kind === 'main' ? MAIN_K : kind === 'bonus' ? BONUS_K : 1); if (ck < 1) grp.scale.set(ck, 1, 1);
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
    var glow = mesh(plane(2.0, 1.8), gm, 0, 0.025, 1.45, grp); glow.rotation.x = -Math.PI / 2; glow.renderOrder = 2; noAud(glow);

    grp.updateMatrixWorld(true);
    // collider from rotated local bounds
    var pts = [[-0.72, -0.52], [0.72, -0.52], [-0.72, 0.95], [0.72, 0.95]].map(function (p) { return new T.Vector3(p[0], 0, p[1]).applyMatrix4(grp.matrixWorld); });
    addSolid(Math.min.apply(null, pts.map(function (p) { return p.x; })), Math.max.apply(null, pts.map(function (p) { return p.x; })),
      Math.min.apply(null, pts.map(function (p) { return p.z; })), Math.max.apply(null, pts.map(function (p) { return p.z; })), 'cabinet ' + game.name);
    regItem('cabinet ' + game.name, 'cabinet', grp);
    var front = new T.Vector3(0, 0, 1.75).applyMatrix4(grp.matrixWorld);
    var dir = new T.Vector3(Math.sin(rot), 0, Math.cos(rot));
    var cab = { game: game, kind: kind, id: game.id, group: grp, x: x, z: z, rot: rot, front: front, dir: dir, sctx: sg, stex: stex, glow: gm, nextDraw: 0, w: 192, h: 144 };
    cabinets.push(cab);
    attract(game.id, sg, 192, 144, Math.random() * 10, cab); stex.needsUpdate = true;
    return cab;
  }
  function ensureGlow() {
    if (glowTex) return glowTex;
    var gc = mkCanvas(128, 128), g = gc.getContext('2d'), grd = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return (glowTex = canvasTex(gc));
  }
  function buildCabinets() {
    cabBodyMat = lam('#1c1236');
    ensureGlow();
    // main games: along the north wall, facing south
    // main games live in the GAME GALLERY wing now (sorted into themed sections; js/areas.js has the layout). The main floor keeps a NEW! spotlight cabinet for the newest game.
    var GL = GA.Areas && GA.Areas.galleryLayout ? GA.Areas.galleryLayout(GA.MAIN_GAMES) : null;
    if (GL) {
      GA.MAIN_GAMES.forEach(function (gm, i) { var q = GL[i], c = buildCabinet(gm, 'main', q.x, q.z, q.rot, 1); c.gallery = true; c.sec = q.sec; });
      var nw = GA.Areas.newestGame(), sc2 = buildCabinet(nw, 'main', GA.Areas.SPOT.x, ROOM.minZ + 0.6, 0, 1); sc2.spot = true;
    } else GA.MAIN_GAMES.forEach(function (gm, i) { buildCabinet(gm, 'main', MAIN_X0 + i * MAIN_STEP, ROOM.minZ + 0.6, 0); });
    // bonus games: along the east wall of the bonus room, facing west
    var nAll = GA.wallBonus().length, nOver = BONUS_NORTH_X.length + BONUS_DIV_Z.length, nb = nAll > BONUS_EAST ? Math.max(BONUS_EAST, nAll - nOver) : nAll, stepB = BONUS_STEP || (nb > 15 ? 1.45 : nb > 14 ? 1.5 : nb > 13 ? 1.62 : nb > 12 ? 1.75 : nb > 11 ? 1.9 : nb > 10 ? 2.05 : nb > 9 ? 2.25 : nb > 8 ? 2.55 : nb > 7 ? 2.8 : nb > 6 ? 3.2 : nb > 5 ? 3.6 : 4);
    GA.wallBonus().forEach(function (gm, i) {
      if (i < nb) return buildCabinet(gm, 'bonus', ROOM.maxX - 0.6, -(nb - 1) * stepB / 2 + i * stepB, -Math.PI / 2);
      var j = i - nb; // overflow rows: north wall of the bonus room (facing south), then the divider wall (facing east)
      if (j < BONUS_NORTH_X.length) buildCabinet(gm, 'bonus', BONUS_NORTH_X[j], ROOM.minZ + 0.6, 0);
      else buildCabinet(gm, 'bonus', DIV_X + 0.75, BONUS_DIV_Z[j - BONUS_NORTH_X.length], Math.PI / 2);
    });
  }

  /* ---------- multiplayer antenna ---------- */
  var ANT = { x: 1.4, z: -3.4 };
  function buildAntenna() {
    var grp = new T.Group(); grp.position.set(ANT.x, 0, ANT.z); grp.rotation.y = 0.35; scene.add(grp);
    var cyan = '#3ff0ff', pink = '#ff4fd8', yel = '#ffe14d';
    // base platform with neon trim
    mesh(cyl(1.0, 1.15, 0.36, 24), lam('#2b1a5e'), 0, 0.18, 0, grp);
    var trim = mesh(new T.TorusGeometry(1.08, 0.05, 8, 40), basic(cyan), 0, 0.37, 0, grp); trim.rotation.x = Math.PI / 2;
    var trim2 = mesh(new T.TorusGeometry(1.16, 0.04, 8, 40), basic(pink), 0, 0.08, 0, grp); trim2.rotation.x = Math.PI / 2;
    // lattice tower (wireframe) around a solid mast
    var lat = new T.Mesh(new T.CylinderGeometry(0.1, 0.62, 3.9, 4, 7, true), new T.MeshBasicMaterial({ color: cyan, wireframe: true }));
    lat.position.set(0, 0.36 + 1.95, 0); grp.add(lat);
    var lat2 = new T.Mesh(new T.CylinderGeometry(0.08, 0.5, 3.9, 4, 7, true), new T.MeshBasicMaterial({ color: pink, wireframe: true }));
    lat2.position.copy(lat.position); lat2.rotation.y = Math.PI / 4; grp.add(lat2);
    mesh(cyl(0.06, 0.12, 4.1, 8), lam('#c7b8ff'), 0, 0.36 + 2.05, 0, grp);
    // dish + spike + glowing orb on top
    var dish = mesh(new T.SphereGeometry(0.42, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), new T.MeshLambertMaterial({ color: '#e9e2ff', side: T.DoubleSide }), 0, 3.0, 0.22, grp);
    dish.rotation.x = -Math.PI / 2 - 0.35;
    mesh(cyl(0.02, 0.02, 0.45, 6), basic(yel), 0, 3.0, 0.42, grp).rotation.x = Math.PI / 2 - 0.35;
    mesh(cyl(0.015, 0.03, 0.55, 6), basic('#ffffff'), 0, 4.62, 0, grp);
    var orb = mesh(sph(0.24, 16), new T.MeshBasicMaterial({ color: pink }), 0, 4.42, 0, grp);
    var halo = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: pink, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    halo.position.set(0, 4.42, 0); halo.scale.set(1.6, 1.6, 1); grp.add(halo);
    // blinking lights on the legs
    var blinks = [];
    for (var i = 0; i < 4; i++) { var a = i * Math.PI / 2 + Math.PI / 4, b = mesh(sph(0.06, 8), basic(i % 2 ? yel : cyan), Math.cos(a) * 0.36, 2.2, Math.sin(a) * 0.36, grp); blinks.push(b); }
    // expanding signal rings
    var rings = [];
    for (i = 0; i < 3; i++) {
      var rm = new T.MeshBasicMaterial({ color: i % 2 ? pink : cyan, transparent: true, opacity: 0.8, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
      var rg = mesh(new T.TorusGeometry(0.35, 0.025, 6, 40), rm, 0, 4.42, 0, grp); rg.rotation.x = Math.PI / 2; rings.push(rg);
    }
    // sign board (double sided) and a floor decal
    var sg = sign('MULTIPLAYER\nPlay with friends online', 2.8, 0.85, cyan, { col2: yel });
    sg.position.set(0, 1.55, 0.68); grp.add(sg);
    var sgb = sg.clone(); sgb.rotation.y = Math.PI; sgb.position.z = 0.66; grp.add(sgb);
    mesh(box(0.06, 0.9, 0.06), lam('#c7b8ff'), -1.2, 0.9, 0.67, grp); mesh(box(0.06, 0.9, 0.06), lam('#c7b8ff'), 1.2, 0.9, 0.67, grp);
    var dec = decal('ONLINE', 2.6, 0.9, cyan, 0, 0, 0, '2-3 players \u00b7 own phones'); scene.remove(dec); dec.position.set(0, 0.02, 1.75); grp.add(dec); noAud(dec);
    var gm = new T.MeshBasicMaterial({ map: glowTex, color: cyan, transparent: true, opacity: 0.35, depthWrite: false, blending: T.AdditiveBlending });
    var glow = mesh(plane(3.6, 3.6), gm, 0, 0.03, 0, grp); glow.rotation.x = -Math.PI / 2; glow.renderOrder = 2; noAud(glow);
    ANT.p = { grp: grp, orb: orb, halo: halo, rings: rings, blinks: blinks, dish: dish, lat: lat, lat2: lat2 };
    buildBrokenFx(grp);
    anims.push(function (t) {
      if (ANT.broken) return;
      orb.scale.setScalar(1 + Math.sin(t * 5) * 0.12); halo.material.opacity = 0.7 + Math.sin(t * 5) * 0.3;
      lat.rotation.y = t * 0.15; lat2.rotation.y = Math.PI / 4 - t * 0.12;
      rings.forEach(function (r, k) { var ph = (t * 0.55 + k / 3) % 1; r.scale.setScalar(1 + ph * 6); r.material.opacity = 0.85 * (1 - ph); });
      blinks.forEach(function (b, k) { b.visible = Math.sin(t * 6 + k * 1.7) > -0.2; });
    });
    addSolid(ANT.x - 1.0, ANT.x + 1.0, ANT.z - 1.0, ANT.z + 1.0, 'Multiplayer Antenna');
    grp.updateMatrixWorld(true); regItem('Multiplayer Antenna', 'booth', grp); regItem('decal:ONLINE', 'decal', dec);
    var dir = new T.Vector3(Math.sin(grp.rotation.y), 0, Math.cos(grp.rotation.y));
    var cab = { game: { id: 'mp', name: 'Multiplayer Antenna', desc: 'Host or join a room and play with friends on their own phones (2-3 players).', color: cyan },
      kind: 'mp', id: 'mp', group: grp, x: ANT.x, z: ANT.z, rot: grp.rotation.y, front: { x: ANT.x, z: ANT.z }, dir: dir, glow: gm, nextDraw: Infinity, r: 2.25, noStand: true };
    cabinets.push(cab);
  }


  /* ---------- broken antenna FX (sparks, smoke, flicker, OUT OF ORDER sign) ---------- */
  var sparks = [], smokes = [], sparkT = 0, sparkLight = null, shakeT = 0, brokenT = 0;
  function buildBrokenFx(grp) {
    var bx = ANT.bx = new T.Group(); bx.visible = false; grp.add(bx);
    var c = mkCanvas(512, 256), g = c.getContext('2d');
    g.fillStyle = '#d91e2a'; g.fillRect(0, 0, 512, 256);
    function stripes(y, h) { g.save(); g.beginPath(); g.rect(0, y, 512, h); g.clip(); for (var i = -2; i < 16; i++) { g.fillStyle = i % 2 ? '#ffd400' : '#141414'; g.beginPath(); g.moveTo(i * 40, y + h); g.lineTo(i * 40 + 40, y + h); g.lineTo(i * 40 + 40 + h, y); g.lineTo(i * 40 + h, y); g.closePath(); g.fill(); } g.restore(); }
    stripes(0, 38); stripes(218, 38);
    neonText(g, 'OUT OF ORDER', 256, 112, 74, '#ffffff', 480);
    g.font = font(30); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffe14d'; g.fillText('Ask Gary from IT!', 256, 178);
    var mat = new T.MeshBasicMaterial({ map: canvasTex(c), side: T.DoubleSide });
    var s1 = mesh(plane(2.1, 1.05), mat, 0.15, 1.6, 0.74, bx); s1.rotation.z = -0.13;
    var s2 = mesh(plane(2.1, 1.05), mat, -0.1, 1.6, 0.6, bx); s2.rotation.y = Math.PI; s2.rotation.z = 0.1;
    mesh(box(0.5, 0.07, 0.01), basic('#e5e7eb'), -0.75, 2.12, 0.75, bx).rotation.z = 0.5;
    mesh(box(0.5, 0.07, 0.01), basic('#e5e7eb'), 1.0, 2.0, 0.75, bx).rotation.z = -0.6;
    var sm = new T.MeshBasicMaterial({ color: '#fff3a0' });
    for (var i = 0; i < 40; i++) { var sp = mesh(box(0.05, 0.05, 0.05), sm, 0, -10, 0, grp); sp.userData.keepLit = true; noAud(sp); sparks.push({ m: sp, life: 0, vx: 0, vy: 0, vz: 0 }); }
    var scv = mkCanvas(64, 64), sg = scv.getContext('2d'), grd = sg.createRadialGradient(32, 32, 2, 32, 32, 30);
    grd.addColorStop(0, 'rgba(90,90,100,0.9)'); grd.addColorStop(1, 'rgba(90,90,100,0)'); sg.fillStyle = grd; sg.fillRect(0, 0, 64, 64);
    var stex = canvasTex(scv);
    for (i = 0; i < 12; i++) { var spr = new T.Sprite(new T.SpriteMaterial({ map: stex, transparent: true, depthWrite: false, opacity: 0 })); spr.position.set(0, -10, 0); grp.add(spr); smokes.push({ s: spr, ph: i / 12, dx: (Math.random() - 0.5) * 0.8 }); }
    sparkLight = new T.PointLight('#bfefff', 0, 5); sparkLight.position.set(0, 3.0, 0.4); grp.add(sparkLight);
  }
  function burst(n, col, x, y, z, power) {
    var k = 0;
    for (var i = 0; i < sparks.length && k < n; i++) {
      var s = sparks[i]; if (s.life > 0) continue; k++;
      s.life = 0.45 + Math.random() * 0.5; s.m.position.set(x, y, z); s.m.material.color.set(col || '#fff3a0');
      var a = Math.random() * Math.PI * 2, p = (power || 1) * (1 + Math.random() * 2.2);
      s.vx = Math.cos(a) * p; s.vz = Math.sin(a) * p; s.vy = 1 + Math.random() * 2.5 * (power || 1);
    }
  }
  function setBroken(b) {
    ANT.broken = b; var p = ANT.p; if (!p) return;
    ANT.bx.visible = b;
    p.rings.forEach(function (r) { r.visible = !b; });
    p.orb.material.color.set(b ? '#ff2a2a' : '#ff4fd8'); if (p.orb.material.userData._dim) p.orb.material.userData._dim.copy(p.orb.material.color);
    p.dish.rotation.z = b ? 0.55 : 0; p.dish.position.y = b ? 2.85 : 3.0;
    p.lat.rotation.z = b ? 0.04 : 0;
    if (!b) { sparkLight.intensity = 0; smokes.forEach(function (s) { s.s.material.opacity = 0; }); burst(26, '#3ff0ff', 0, 4.42, 0, 1.4); p.halo.material.opacity = 1; p.blinks.forEach(function (bl) { bl.visible = true; }); }
  }
  function updateBroken(dt) {
    var p = ANT.p; if (!p) return;
    for (var i = 0; i < sparks.length; i++) {
      var s = sparks[i]; if (s.life <= 0) continue;
      s.life -= dt; s.vy -= 9 * dt; s.m.position.x += s.vx * dt; s.m.position.y += s.vy * dt; s.m.position.z += s.vz * dt;
      s.m.scale.setScalar(Math.max(0.2, s.life * 2)); if (s.life <= 0 || s.m.position.y < 0.05) { s.life = 0; s.m.position.y = -10; }
    }
    if (!ANT.broken) return;
    brokenT += dt; sparkT -= dt;
    if (sparkT <= 0) { sparkT = 0.35 + Math.random() * 1.1; burst(6 + Math.floor(Math.random() * 8), Math.random() < 0.5 ? '#fff3a0' : '#9fe8ff', 0, 2.95, 0.35, 1); sparkLight.intensity = 2.5; if (Hub.onSpark && Math.hypot(P.x - ANT.x, P.z - ANT.z) < 7) Hub.onSpark(); }
    sparkLight.intensity *= Math.pow(0.002, dt);
    // flickering orb + halo, red blinking legs
    var fl = Math.random() < 0.18 ? 0.05 : 0.6 + Math.random() * 0.4;
    p.halo.material.opacity = fl; p.orb.scale.setScalar(0.8 + fl * 0.25);
    p.blinks.forEach(function (b, k) { b.visible = Math.random() < 0.5; });
    smokes.forEach(function (sm) {
      var ph = (brokenT * 0.42 + sm.ph) % 1;
      sm.s.position.set(sm.dx * ph, 3.0 + ph * 2.2, 0.2 + ph * 0.3); sm.s.scale.setScalar(0.4 + ph * 1.5); sm.s.material.opacity = 0.55 * (1 - ph) * Math.min(1, ph * 6);
    });
  }

  /* ---------- Gary from IT (NPC) ---------- */
  var GARY = { x: -1.0, z: 11.35, face: Math.PI, state: 'desk', path: [], seg: 0, t: 0, needed: false, cbFixed: null, cbDone: null, phase: 0 };
  var GDESK = { x: -1.0, z: 11.35 };
  function textSprite(text, w, h, bg, fg, px) {
    var c = mkCanvas(512, Math.round(512 * h / w)), g = c.getContext('2d');
    g.fillStyle = bg; U_rr(g, 6, 6, c.width - 12, c.height - 12, c.height * 0.35); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.stroke();
    g.font = font(px); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg; g.fillText(text, c.width / 2, c.height / 2 + 2);
    var sp = new T.Sprite(new T.SpriteMaterial({ map: canvasTex(c), transparent: true, depthTest: false })); sp.scale.set(w, h, 1); sp.renderOrder = 10; sp.userData.keepLit = true;
    return sp;
  }
  function buildGary() {
    // IT help desk next to the prize counter
    var dg = new T.Group(); dg.position.set(-1.0, 0, 10.6); dg.rotation.y = Math.PI; scene.add(dg);
    mesh(box(1.7, 0.08, 0.75), lam('#8b5a2b'), 0, 0.78, 0, dg);
    mesh(box(1.66, 0.7, 0.06), lam('#6b4220'), 0, 0.4, 0.34, dg);
    [-0.8, 0.8].forEach(function (x) { mesh(box(0.06, 0.74, 0.7), lam('#6b4220'), x, 0.37, 0, dg); });
    var monG = new T.Group(); monG.position.set(0.5, 0, 0); monG.rotation.y = 0.45; dg.add(monG); mesh(box(0.7, 0.45, 0.05), basic('#0b0f1a'), 0, 1.12, -0.1, monG); mesh(box(0.08, 0.3, 0.08), lam('#333'), 0, 0.92, -0.12, monG);
    var mon = mkCanvas(128, 80), mg = mon.getContext('2d'); mg.fillStyle = '#04121f'; mg.fillRect(0, 0, 128, 80); mg.font = font(16); mg.fillStyle = '#4ade80'; mg.textAlign = 'center'; mg.fillText('IT', 64, 46);
    var mb = mesh(plane(0.6, 0.38), new T.MeshBasicMaterial({ map: canvasTex(mon) }), 0, 1.12, -0.13, monG); mb.rotation.y = Math.PI;
    mesh(box(0.5, 0.03, 0.18), lam('#222'), 0.3, 0.83, 0.12, dg);
    mesh(box(0.25, 0.32, 0.25), lam('#9ca3af'), -0.62, 0.98, -0.1, dg);
    var sgn = sign('IT HELP DESK\nAsk Gary!', 2.6, 0.8, '#4ade80'); sgn.position.set(-1.0, 2.9, ROOM.maxZ - 0.03); sgn.rotation.y = Math.PI; wallSign('IT HELP DESK', sgn);
    addSolid(-1.9, -0.1, 10.2, ROOM.maxZ, 'IT Help Desk');
    dg.updateMatrixWorld(true); regItem('IT Help Desk', 'booth', dg);
    // Gary himself
    var root = GARY.root = new T.Group(); scene.add(root);
    var body = new T.Group(); root.add(body); GARY.body = body;
    var shirt = lam('#14b8a6'), skin = lam('#f1c7a0'), pants = lam('#c8a165'), dark = basic('#1b1030'), hair = lam('#6b5a4a');
    GARY.legL = new T.Group(); GARY.legR = new T.Group(); GARY.legL.position.set(-0.14, 0.62, 0); GARY.legR.position.set(0.14, 0.62, 0); body.add(GARY.legL); body.add(GARY.legR);
    [GARY.legL, GARY.legR].forEach(function (l) { mesh(box(0.22, 0.52, 0.24), pants, 0, -0.28, 0, l); mesh(box(0.25, 0.12, 0.34), lam('#3b2a1a'), 0, -0.57, 0.04, l); });
    mesh(box(0.64, 0.66, 0.44), shirt, 0, 0.95, 0.02, body);
    mesh(box(0.66, 0.08, 0.46), lam('#5b4a3a'), 0, 0.64, 0.02, body);
    mesh(box(0.03, 0.34, 0.01), basic('#2563eb'), -0.08, 1.08, 0.25, body); mesh(box(0.03, 0.34, 0.01), basic('#2563eb'), 0.08, 1.08, 0.25, body);
    mesh(box(0.16, 0.2, 0.02), basic('#ffffff'), 0, 0.88, 0.25, body);
    mesh(box(0.2, 0.1, 0.02), basic('#0f766e'), 0.18, 1.1, 0.24, body);
    // polo collar + button placket + pens in the pocket (pocket protector!)
    [-1, 1].forEach(function (sd) { var cl = mesh(box(0.2, 0.05, 0.14), lam('#f8fafc'), sd * 0.11, 1.27, 0.17, body); cl.rotation.set(0.5, 0, sd * -0.45); });
    mesh(box(0.07, 0.16, 0.015), lam('#0d9488'), 0, 1.19, 0.245, body); mesh(box(0.025, 0.025, 0.01), basic('#f8fafc'), 0, 1.22, 0.255, body); mesh(box(0.025, 0.025, 0.01), basic('#f8fafc'), 0, 1.15, 0.255, body);
    [['#ef4444', 0.13], ['#2563eb', 0.18], ['#111827', 0.23]].forEach(function (pn) { mesh(box(0.025, 0.12, 0.025), lam(pn[0]), pn[1], 1.16, 0.25, body); });
    GARY.armL = new T.Group(); GARY.armR = new T.Group(); GARY.armL.position.set(-0.4, 1.2, 0); GARY.armR.position.set(0.4, 1.2, 0); body.add(GARY.armL); body.add(GARY.armR);
    [GARY.armL, GARY.armR].forEach(function (a) { mesh(box(0.17, 0.3, 0.19), shirt, 0, -0.12, 0, a); mesh(box(0.14, 0.24, 0.15), skin, 0, -0.36, 0, a); mesh(sph(0.09, 8), skin, 0, -0.5, 0, a); });
    var wrench = GARY.wrench = new T.Group(); wrench.position.set(0, -0.56, 0.08); GARY.armR.add(wrench); wrench.visible = false;
    mesh(box(0.05, 0.05, 0.42), lam('#cbd5e1'), 0, 0, 0.18, wrench); mesh(box(0.14, 0.05, 0.08), lam('#cbd5e1'), 0, 0, 0.4, wrench);
    // coffee mug in the left hand (at the desk) - white with a green 'IT' stripe
    var mugG = GARY.mug = new T.Group(); mugG.position.set(0, -0.56, 0.1); GARY.armL.add(mugG);
    var mugC = mesh(cyl(0.085, 0.075, 0.17, 14), lam('#f8fafc'), 0, 0, 0, mugG); mugC.rotation.x = Math.PI / 2;
    var mugS = mesh(cyl(0.088, 0.088, 0.045, 14), lam('#22c55e'), 0, 0.03, 0, mugG); mugS.rotation.x = Math.PI / 2;
    var mugH = mesh(new T.TorusGeometry(0.045, 0.015, 6, 12), lam('#f8fafc'), 0.095, 0, 0, mugG); mugH.rotation.x = Math.PI / 2;
    mesh(cyl(0.07, 0.07, 0.01, 12), lam('#4a2c17'), 0, 0, 0, mugG).rotation.x = Math.PI / 2;
    // red toolbox in the left hand (when heading out for a repair)
    var tb = GARY.toolbox = new T.Group(); tb.position.set(0, -0.62, 0); GARY.armL.add(tb); tb.visible = false;
    mesh(box(0.42, 0.2, 0.18), lam('#dc2626'), 0, -0.14, 0, tb); mesh(box(0.43, 0.04, 0.19), lam('#991b1b'), 0, -0.05, 0, tb);
    mesh(box(0.2, 0.03, 0.03), lam('#1f2937'), 0, 0.02, 0, tb); [-0.09, 0.09].forEach(function (x) { mesh(box(0.03, 0.07, 0.03), lam('#1f2937'), x, -0.02, 0, tb); });
    mesh(box(0.06, 0.04, 0.01), lam('#facc15'), 0, -0.1, 0.095, tb);
    var head = new T.Group(); head.position.set(0, 1.56, 0); body.add(head); GARY.head = head;
    mesh(sph(0.29, 16), skin, 0, 0, 0, head);
    var hr = mesh(new T.TorusGeometry(0.24, 0.08, 8, 20, Math.PI * 1.3), hair, 0, 0.02, -0.04, head); hr.rotation.set(Math.PI / 2, 0, -Math.PI * 0.15 + Math.PI);
    [[-0.08, 0.27, 0.05, 0.3], [0.03, 0.29, 0.02, -0.2], [0.12, 0.26, 0.04, -0.5]].forEach(function (t) { var tf = mesh(box(0.1, 0.12, 0.1), hair, t[0], t[1], t[2], head); tf.rotation.z = t[3]; }); // messy tuft
    var beard = mesh(sph(0.24, 12), hair, 0, -0.14, 0.08, head); beard.scale.set(1.05, 0.62, 0.8);
    mesh(box(0.14, 0.04, 0.03), lam('#c98d6b'), 0, -0.07, 0.28, head);
    [-0.11, 0.11].forEach(function (x) { mesh(box(0.15, 0.11, 0.02), dark, x, 0.04, 0.29, head); mesh(box(0.11, 0.07, 0.01), basic('#bfe9ff'), x, 0.04, 0.302, head); });
    mesh(box(0.08, 0.025, 0.02), dark, 0, 0.06, 0.29, head);
    var tag = GARY.tag = textSprite('GARY FROM IT', 1.3, 0.3, '#0f766e', '#ffffff', 64); tag.position.set(0, 2.2, 0); root.add(tag);
    var bub = GARY.bubble = textSprite('!', 0.42, 0.42, '#ffe14d', '#1b1030', 150); bub.position.set(0, 2.7, 0); root.add(bub); bub.visible = false;
    var sc = mkCanvas(64, 64), sg = sc.getContext('2d'), grd = sg.createRadialGradient(32, 32, 4, 32, 32, 30);
    grd.addColorStop(0, 'rgba(0,0,0,0.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = grd; sg.fillRect(0, 0, 64, 64);
    var sh = mesh(plane(1.1, 1.1), new T.MeshBasicMaterial({ map: canvasTex(sc), transparent: true, depthWrite: false }), 0, 0.03, 0, root); sh.rotation.x = -Math.PI / 2;
    root.scale.setScalar(1.05);
    // emergency light over the help desk (only during a power cut)
    GARY.emerg = new T.PointLight('#ff3b3b', 0, 9); GARY.emerg.position.set(-1.0, 3.6, 10.2); scene.add(GARY.emerg);
    var gm = new T.MeshBasicMaterial({ map: glowTex, color: '#4ade80', transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending });
    var glow = mesh(plane(2.2, 1.8), gm, 0, 0.025, 1.45, dg); glow.rotation.x = -Math.PI / 2; glow.renderOrder = 2; noAud(glow);
    var front = new T.Vector3(0, 0, 1.75).applyMatrix4(dg.matrixWorld);
    GARY.cab = { game: { id: 'gary', name: 'Gary from IT', desc: 'Your friendly IT Manager.', color: '#4ade80' }, kind: 'npc', id: 'gary', group: dg, x: -1.0, z: 10.6, rot: Math.PI, front: front, dir: new T.Vector3(0, 0, -1), glow: gm, nextDraw: Infinity, r: 1.9 };
    cabinets.push(GARY.cab);
    placeGary();
  }
  function placeGary() { GARY.root.position.set(GARY.x, 0, GARY.z); GARY.root.rotation.y = GARY.face; }
  function garyGo(onFixed, onDone) {
    if (GARY.state !== 'desk') return false;
    GARY.cbFixed = onFixed; GARY.cbDone = onDone;
    GARY.path = [[-2.35, 11.3], [-2.35, 9.3], [ANT.x + 2.0, ANT.z + 1.9], [ANT.x + 1.45, ANT.z - 0.1]]; GARY.seg = 0; GARY.state = 'walk'; GARY.cab.disabled = true;
    return true;
  }
  function updateGary(dt) {
    if (!GARY.root) return;
    var G = GARY, moving = false, SPEED = 4.2;
    if (G.state === 'walk' || G.state === 'return') {
      var tgt = G.path[G.seg], dx = tgt[0] - G.x, dz = tgt[1] - G.z, d = Math.hypot(dx, dz), stp = SPEED * dt;
      if (d <= stp) { G.x = tgt[0]; G.z = tgt[1]; G.seg++; } else { G.x += dx / d * stp; G.z += dz / d * stp; }
      if (d > 0.01) { var want = Math.atan2(dx, dz), dA = ((want - G.face + Math.PI * 3) % (Math.PI * 2)) - Math.PI; G.face += dA * Math.min(1, dt * 12); }
      moving = true;
      if (G.seg >= G.path.length) {
        if (G.state === 'walk') { G.state = 'fix'; G.t = 0; G.wrench.visible = true; }
        else { G.state = 'desk'; G.face = Math.PI; G.cab.disabled = false; if (G.cbDone) { var cd = G.cbDone; G.cbDone = null; cd(); } }
      }
    } else if (G.state === 'fix') {
      G.t += dt; var wantF = Math.atan2(ANT.x - G.x, ANT.z - G.z), dF = ((wantF - G.face + Math.PI * 3) % (Math.PI * 2)) - Math.PI; G.face += dF * Math.min(1, dt * 8);
      G.armR.rotation.x = -1.6 + Math.sin(G.t * 16) * 0.5; G.armL.rotation.x = -0.6;
      G.body.position.y = -0.12; G.legL.rotation.x = -0.5; G.legR.rotation.x = 0.3;
      if (Math.floor(G.t * 8) !== Math.floor((G.t - dt) * 8)) burst(3, '#ffe14d', ANT.x - G.x > 0 ? -0.1 : 0.1, 1.4 + Math.random() * 1.5, 0.75, 0.6);
      if (G.t >= 2.6) {
        G.state = 'cheer'; G.t = 0; G.wrench.visible = false;
        if (G.cbFixed) { var cf = G.cbFixed; G.cbFixed = null; cf(); }
      }
    } else if (G.state === 'cheer') {
      G.t += dt; G.armR.rotation.x = G.armL.rotation.x = Math.PI - 0.3 + Math.sin(G.t * 12) * 0.2; G.body.position.y = Math.abs(Math.sin(G.t * 9)) * 0.12;
      G.legL.rotation.x = G.legR.rotation.x = 0;
      if (G.t > 0.9) { G.state = 'return'; G.path = [[ANT.x + 2.0, ANT.z + 1.9], [-2.35, 9.3], [-2.35, 11.3], [GDESK.x, GDESK.z]]; G.seg = 0; }
    }
    if (G.state === 'desk') {
      // typing at the computer
      G.phase += dt; var sip = Math.max(0, Math.sin(G.phase * 0.9) - 0.75) * 4; G.armL.rotation.x = -1.0 - sip * 0.9; G.armL.rotation.z = 0.25; G.armR.rotation.x = -1.2 + Math.cos(G.phase * 13) * 0.08;
      G.legL.rotation.x = G.legR.rotation.x = 0; G.body.position.y = 0; G.head.rotation.y = Math.sin(G.phase * 0.5) * 0.3;
      if (G.needed) { G.head.rotation.y = 0; G.armR.rotation.x = Math.PI - 0.2 + Math.sin(G.phase * 8) * 0.3; }
    } else if (moving) {
      G.phase += dt * 11; var sw = Math.sin(G.phase) * 0.7;
      G.legL.rotation.x = sw; G.legR.rotation.x = -sw; G.armL.rotation.x = -sw * 0.8; G.armR.rotation.x = sw * 0.8; G.body.position.y = Math.abs(Math.sin(G.phase)) * 0.05; G.head.rotation.y = 0;
    }
    G.mug.visible = G.state === 'desk'; G.toolbox.visible = !G.mug.visible; if (G.state !== 'desk') G.armL.rotation.z = 0;
    G.bubble.visible = G.needed && G.state === 'desk' && Hub._area !== 'hall'; G.tag.visible = Hub._area !== 'hall'; // labels draw on top, so hide them while you're in the Hall wing
    if (G.bubble.visible) G.bubble.position.y = 2.7 + Math.sin(time * 4) * 0.08;
    placeGary();
    if (G.emerg) G.emerg.intensity = powerTarget < 0.5 ? 1.6 + Math.sin(time * 5) * 0.8 : 0;
  }

  /* ---------- power (arcade shutdown / restore) ---------- */
  var LIGHTS = [], powerK = 1, powerTarget = 1, dimList = null, CLEAR_ON = new T.Color('#140a2b'), CLEAR_OFF = new T.Color('#030108'), tmpC = new T.Color();
  function collectDim() {
    dimList = [];
    scene.traverse(function (o) {
      if (!o.material || o.userData.keepLit) return;
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) {
        if ((m.isMeshBasicMaterial || m.isSpriteMaterial) && m.color && !m.userData._dim) { m.userData._dim = m.color.clone(); dimList.push(m); }
      });
    });
  }
  function applyPower() {
    if (!dimList) { if (powerK >= 1) return; collectDim(); }
    var k = powerK, flick = (powerK > 0.02 && powerK < 0.98 && Math.random() < 0.3) ? 0.4 : 1, f = (0.16 + 0.84 * k) * flick;
    LIGHTS.forEach(function (l) { l[0].intensity = l[1] * (0.18 + 0.82 * k) * flick; });
    dimList.forEach(function (m) { m.color.copy(m.userData._dim).multiplyScalar(f); });
    tmpC.copy(CLEAR_OFF).lerp(CLEAR_ON, k); renderer.setClearColor(tmpC); if (scene.fog) scene.fog.color.copy(tmpC);
  }
  function updatePower(dt) {
    if (powerK === powerTarget) return;
    powerK = powerTarget > powerK ? Math.min(powerTarget, powerK + dt / 1.4) : Math.max(powerTarget, powerK - dt / 1.1);
    applyPower();
  }

  /* ---------- player character (also used for friends' avatars) ---------- */
  function makeAvatar(o) {
    o = o || {};
    var root = new T.Group(), pp = {};
    var body = new T.Group(); root.add(body); pp.body = body;
    var hoodie = lam(o.color || '#ff8a1f'), skin = lam('#ffd9b8'), pants = lam(o.pants || '#2f5bea'), white = lam('#ffffff'), dark = basic('#1b1030');
    pp.legL = new T.Group(); pp.legR = new T.Group(); pp.legL.position.set(-0.14, 0.62, 0); pp.legR.position.set(0.14, 0.62, 0);
    body.add(pp.legL); body.add(pp.legR);
    [pp.legL, pp.legR].forEach(function (l) { mesh(box(0.2, 0.52, 0.22), pants, 0, -0.28, 0, l); mesh(box(0.24, 0.14, 0.32), white, 0, -0.56, 0.04, l); });
    mesh(box(0.56, 0.6, 0.36), hoodie, 0, 0.92, 0, body);
    mesh(box(0.5, 0.08, 0.02), basic(o.stripe || '#3ff0ff'), 0, 0.98, 0.19, body);
    pp.armL = new T.Group(); pp.armR = new T.Group(); pp.armL.position.set(-0.36, 1.16, 0); pp.armR.position.set(0.36, 1.16, 0);
    body.add(pp.armL); body.add(pp.armR);
    [pp.armL, pp.armR].forEach(function (a) { mesh(box(0.16, 0.48, 0.18), hoodie, 0, -0.22, 0, a); mesh(sph(0.1, 8), skin, 0, -0.5, 0, a); });
    var head = new T.Group(); head.position.set(0, 1.5, 0); body.add(head); pp.head = head;
    mesh(sph(0.3, 16), skin, 0, 0, 0, head);
    var hair = mesh(sph(0.315, 16), lam(o.hair || '#3b1f14'), 0, 0.06, -0.04, head); hair.scale.set(1, 0.85, 1);
    mesh(sph(0.055, 8), dark, -0.11, 0.0, 0.27, head); mesh(sph(0.055, 8), dark, 0.11, 0.0, 0.27, head);
    mesh(sph(0.02, 6), white, -0.095, 0.02, 0.32, head); mesh(sph(0.02, 6), white, 0.125, 0.02, 0.32, head);
    mesh(box(0.1, 0.025, 0.02), basic('#d9465f'), 0, -0.12, 0.29, head);
    mesh(sph(0.04, 6), basic('#ff9eb4'), -0.18, -0.07, 0.24, head); mesh(sph(0.04, 6), basic('#ff9eb4'), 0.18, -0.07, 0.24, head);
    var cap = mesh(sph(0.32, 14), lam(o.cap || '#ff4fd8'), 0, 0.15, -0.01, head); cap.scale.set(1.08, 0.62, 1.08);
    var brim = mesh(box(0.42, 0.04, 0.26), basic(o.brim || '#3ff0ff'), 0, 0.15, 0.31, head);
    pp.cap = [cap, brim];
    mesh(box(0.06, 0.16, 0.16), basic(o.brim || '#3ff0ff'), -0.31, 0, 0, head); mesh(box(0.06, 0.16, 0.16), basic(o.brim || '#3ff0ff'), 0.31, 0, 0, head);
    var sc = mkCanvas(64, 64), sg = sc.getContext('2d'), grd = sg.createRadialGradient(32, 32, 4, 32, 32, 30);
    grd.addColorStop(0, 'rgba(0,0,0,0.6)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = grd; sg.fillRect(0, 0, 64, 64);
    var sh = mesh(plane(1.2, 1.2), new T.MeshBasicMaterial({ map: canvasTex(sc), transparent: true, depthWrite: false }), 0, 0.03, 0, root); sh.rotation.x = -Math.PI / 2; sh.renderOrder = 3;
    var rg = mesh(new T.RingGeometry(0.48, 0.56, 32), new T.MeshBasicMaterial({ color: o.ring || '#3ff0ff', transparent: true, opacity: 0.8, depthWrite: false }), 0, 0.04, 0, root);
    rg.rotation.x = -Math.PI / 2; rg.renderOrder = 3; pp.ring = rg;
    // carry slots
    pp.hand = new T.Group(); pp.hand.position.set(0, -0.56, 0.1); pp.armR.add(pp.hand);
    pp.hatSlot = new T.Group(); pp.hatSlot.position.set(0, 0.08, 0); head.add(pp.hatSlot);
    pp.neck = new T.Group(); pp.neck.position.set(0, 0.86, 0.19); body.add(pp.neck);
    pp.carry = {};
    root.scale.setScalar(1.05);
    return { root: root, parts: pp };
  }
  // put prizes in the avatar's hand / on its head / around its neck
  function dress(av, c) {
    var pp = av.parts; c = c || {};
    function slot(key, grp, id, fit) {
      if (pp.carry[key] === (id || null)) return;
      pp.carry[key] = id || null; while (grp.children.length) grp.remove(grp.children[0]);
      pp[key + 'Model'] = null;
      if (!id || !GA.Prize3D) return;
      var m = GA.Prize3D.build(id), s = m.userData.size, ce = m.userData.center;
      var w = new T.Group(); grp.add(w); w.add(m); fit(m, s, ce, w); pp[key + 'Model'] = m;
    }
    slot('hand', pp.hand, c.hand, function (m, s, ce) { var k = 0.66 / Math.max(s.x, s.y, s.z, 0.01); m.scale.setScalar(k); m.position.set(-ce.x * k + 0.04, -ce.y * k + 0.1, -ce.z * k + 0.12); });
    slot('head', pp.hatSlot, c.head, function (m, s, ce) { var hh = m.userData.hat || { y: 0, s: 0.75 }; m.scale.setScalar(hh.s); m.position.set(0, hh.y - 0.1 * hh.s, 0); });
    slot('neck', pp.neck, c.neck, function (m, s) { var k = 0.4; m.scale.setScalar(k); m.position.set(0, 0.4 - s.y * k, 0.02); m.rotation.x = -0.12; });
    pp.cap.forEach(function (q) { q.visible = !c.head; });
  }
  function poseCarry(pp, sw, t) {
    if (pp.carry.hand) { pp.armR.rotation.x = -0.75 + sw * 0.12; pp.armR.rotation.z = 0.42; pp.hand.rotation.set(-pp.armR.rotation.x, 0, -0.42); } else { pp.armR.rotation.z = 0; pp.hand.rotation.set(0, 0, 0); }
    if (pp.headModel && pp.headModel.userData.tick) pp.headModel.userData.tick(t, 0.016, Math.abs(sw) > 0.05);
    if (pp.handModel && pp.handModel.userData.tick) pp.handModel.userData.tick(t, 0.016);
  }
  var me = null;
  function buildPlayer() {
    me = makeAvatar({}); player = me.root; scene.add(player); parts = me.parts; ring = parts.ring;
    if (GA.Carry) dress(me, GA.Carry.get());
  }

  /* ---------- friends in the hub (multiplayer) ---------- */
  var remotes = {};
  function tagTex(name, sub, col) {
    var c = mkCanvas(512, 160), g = c.getContext('2d');
    g.font = font(58); var w = Math.min(500, Math.max(200, g.measureText(name).width + 70));
    g.fillStyle = 'rgba(12,6,30,0.82)'; U_rr(g, 256 - w / 2, sub ? 4 : 30, w, sub ? 150 : 96, 40); g.fill();
    g.lineWidth = 7; g.strokeStyle = col; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; fitText(g, name, w - 40, 58); g.fillText(name, 256, sub ? 54 : 80);
    if (sub) { g.fillStyle = col; fitText(g, sub, w - 30, 36); g.fillText(sub, 256, 116); }
    return canvasTex(c);
  }
  function setTag(r, sub) {
    if (r.sub === sub && r.tag) return; r.sub = sub;
    var tx = tagTex(r.name, sub, r.color);
    if (!r.tag) { r.tag = new T.Sprite(new T.SpriteMaterial({ map: tx, depthTest: false, transparent: true })); r.tag.scale.set(1.7, 0.53, 1); r.tag.renderOrder = 20; r.tag.position.y = 2.35; r.av.root.add(r.tag); }
    else { r.tag.material.map.dispose(); r.tag.material.map = tx; r.tag.material.needsUpdate = true; }
  }
  Hub.remoteAdd = function (pid, o) {
    if (remotes[pid]) { Hub.remoteRemove(pid); }
    var av = makeAvatar({ color: o.color, ring: o.color, cap: '#3a2a6a', stripe: '#ffffff' });
    scene.add(av.root);
    var r = remotes[pid] = { pid: pid, name: o.name || 'Friend', color: o.color || '#3ff0ff', av: av, x: o.x != null ? o.x : SPAWN.x + 1.5, z: o.z != null ? o.z : SPAWN.z, face: 0, tx: 0, tz: 0, tf: 0, phase: 0, speed: 0, sub: null };
    r.tx = r.x; r.tz = r.z; setTag(r, o.sub || null);
    av.root.position.set(r.x, 0, r.z);
    return true;
  };
  Hub.remoteMove = function (pid, x, z, face) { var r = remotes[pid]; if (!r || !isFinite(x) || !isFinite(z)) return; r.tx = x; r.tz = z; r.tf = face || 0; if (!r.seen) { r.seen = 1; r.x = x; r.z = z; r.face = r.tf; } };
  Hub.remoteDress = function (pid, c) { var r = remotes[pid]; if (r) dress(r.av, c); };
  Hub.remoteTag = function (pid, sub) { var r = remotes[pid]; if (r) setTag(r, sub || null); };
  Hub.remoteRemove = function (pid) { var r = remotes[pid]; if (!r) return; scene.remove(r.av.root); delete remotes[pid]; };
  Hub.remotes = function () { var o = {}; for (var k in remotes) { var r = remotes[k]; o[k] = { name: r.name, x: +r.x.toFixed(2), z: +r.z.toFixed(2), carry: r.av.parts.carry, sub: r.sub, screen: Hub.toScreen(r.x, 1.2, r.z) }; } return o; };
  Hub.toScreen = function (x, y, z) { if (!camera) return null; var v = new T.Vector3(x, y, z).project(camera); return { x: Math.round((v.x * 0.5 + 0.5) * window.innerWidth), y: Math.round((-v.y * 0.5 + 0.5) * window.innerHeight), on: v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1 }; };
  function updateRemotes(dt) {
    for (var k in remotes) {
      var r = remotes[k], pp = r.av.parts, f = Math.min(1, dt * 10);
      var ox = r.x, oz = r.z; r.x += (r.tx - r.x) * f; r.z += (r.tz - r.z) * f;
      var dA = ((r.tf - r.face + Math.PI * 3) % (Math.PI * 2)) - Math.PI; r.face += dA * f;
      var sp = Math.hypot(r.x - ox, r.z - oz) / Math.max(dt, 1e-3); r.speed += (sp - r.speed) * Math.min(1, dt * 8);
      var walk = Math.min(1, r.speed / 5.2); r.phase += dt * (4 + 7 * walk) * (walk > 0.05 ? 1 : 0);
      var sw = Math.sin(r.phase) * 0.7 * walk;
      r.av.root.position.set(r.x, 0, r.z); r.av.root.rotation.y = r.face;
      pp.legL.rotation.x = sw; pp.legR.rotation.x = -sw; pp.armL.rotation.x = -sw * 0.9; pp.armR.rotation.x = sw * 0.9;
      pp.body.position.y = Math.abs(Math.sin(r.phase)) * 0.06 * walk;
      poseCarry(pp, sw, time);
    }
  }

  /* ---------- areas + dance emotes ---------- */
  function regionAt(x, z) {
    for (var i = 0; i < REGIONS.length; i++) { var r = REGIONS[i]; if (x >= r.minX - 1 && x <= r.maxX + 1 && z >= r.minZ - 1 && z <= r.maxZ + 1) return r.name; }
    if (z > ROOM.maxZ + 0.2) return x < FOOD.maxX + 0.2 ? 'food' : 'hall';
    return x > DIV_X ? 'bonus' : 'main';
  }
  var EMO = { name: null, t0: 0, was: false };
  function emotePose(pp, t) {
    var s1 = Math.sin(t * 8), s2 = Math.sin(t * 4), b = pp.body; EMO.was = true;
    b.rotation.set(0, 0, 0); pp.head.rotation.x = 0; pp.armL.rotation.set(0, 0, 0); pp.armR.rotation.set(0, 0, 0); pp.legL.rotation.set(0, 0, 0); pp.legR.rotation.set(0, 0, 0);
    switch (EMO.name) {
      case 'wave': pp.armR.rotation.z = 2.6 + s1 * 0.35; pp.armL.rotation.x = 0.1; pp.head.rotation.z = s2 * 0.08; break;
      case 'dance': b.position.y = Math.abs(s1) * 0.12; b.rotation.y = s2 * 0.45; pp.armL.rotation.z = -1.2 - s1 * 0.6; pp.armR.rotation.z = 1.2 - s1 * 0.6; pp.legL.rotation.x = s1 * 0.5; pp.legR.rotation.x = -s1 * 0.5; break;
      case 'spin': b.rotation.y = t * 9; b.position.y = Math.abs(Math.sin(t * 3)) * 0.18; pp.armL.rotation.z = -1.5; pp.armR.rotation.z = 1.5; break;
      case 'robot': var st = Math.floor(t * 3) % 4; pp.armL.rotation.x = st < 2 ? -1.5 : 0; pp.armR.rotation.x = st % 2 ? -1.5 : 0; pp.armL.rotation.z = -0.1; pp.armR.rotation.z = 0.1; b.rotation.y = [0, 0.5, 0, -0.5][st]; pp.head.rotation.y = -[0, 0.5, 0, -0.5][st]; b.position.y = 0; break;
      case 'jump': var ph2 = (t * 1.8) % 1; b.position.y = Math.sin(ph2 * Math.PI) * 0.7; pp.armL.rotation.z = -2.6 * Math.sin(ph2 * Math.PI); pp.armR.rotation.z = 2.6 * Math.sin(ph2 * Math.PI); pp.legL.rotation.x = -0.5 * Math.sin(ph2 * Math.PI); pp.legR.rotation.x = -0.5 * Math.sin(ph2 * Math.PI); break;
      case 'floss': var f = Math.sin(t * 10); b.rotation.z = f * 0.12; pp.armL.rotation.x = 0.3; pp.armR.rotation.x = 0.3; pp.armL.rotation.z = f * 0.7; pp.armR.rotation.z = f * 0.7; b.position.y = Math.abs(f) * 0.05; break;
      default: break;
    }
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
      if (!enabled || paused || lock) return;
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
      if (!enabled || paused || lock) return;
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
    if (enabled && !paused && !lock && !(GA.UI && GA.UI.menuOpen())) {
      if (keys.w || keys.ArrowUp) my += 1; if (keys.s || keys.ArrowDown) my -= 1;
      if (keys.a || keys.ArrowLeft) mx -= 1; if (keys.d || keys.ArrowRight) mx += 1;
      if (keys.q) C.yaw += 2.2 * dt; if (keys.e && !eTurnBlock) C.yaw -= 2.2 * dt;
      mx += joy.x; my += joy.y;
    }
    var mag = Math.hypot(mx, my); if (mag > 1) { mx /= mag; my /= mag; mag = 1; }
    var fx = -Math.sin(C.yaw), fz = -Math.cos(C.yaw), rx = Math.cos(C.yaw), rz = -Math.sin(C.yaw);
    var vx = (fx * my + rx * mx), vz = (fz * my + rz * mx);
    var SPEED = 5.2, SPK = GA.Boost && GA.Boost.speed ? GA.Boost.speed() : 1;
    var target = mag * SPEED * SPK; P.speed += (target - P.speed) * Math.min(1, dt * 10);
    if (mag > 0.01) {
      var want = Math.atan2(vx, vz), dA = ((want - P.face + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      P.face += dA * Math.min(1, dt * 12);
      var vl = Math.hypot(vx, vz) || 1;
      var nx = P.x + vx / vl * P.speed * dt, nz = P.z + vz / vl * P.speed * dt;
      var r = collide(nx, nz); P.x = r.x; P.z = r.z;
    }
    // animate character
    var walk = Math.min(1, P.speed / (SPEED * SPK));
    P.phase += dt * (4 + 7 * walk) * (walk > 0.05 ? 1 : 0);
    var sw = Math.sin(P.phase) * 0.7 * walk;
    player.position.set(P.x, 0, P.z); player.rotation.y = P.face;
    parts.legL.rotation.x = sw; parts.legR.rotation.x = -sw; parts.armL.rotation.x = -sw * 0.9; parts.armR.rotation.x = sw * 0.9;
    parts.body.position.y = Math.abs(Math.sin(P.phase)) * 0.06 * walk + (walk < 0.05 ? Math.sin(time * 2) * 0.015 : 0);
    parts.head.rotation.z = walk < 0.05 ? Math.sin(time * 1.3) * 0.05 : 0;
    ring.material.opacity = 0.55 + Math.sin(time * 4) * 0.25;
    poseCarry(parts, sw, time);
    if (EMO.name && walk > 0.2) EMO.name = null; // walking cancels a dance emote
    if (EMO.name) emotePose(parts, time - EMO.t0);
    else if (EMO.was) { EMO.was = false; parts.body.rotation.set(0, 0, 0); parts.head.rotation.x = 0; parts.armL.rotation.z = 0; parts.armR.rotation.z = 0; parts.legL.rotation.z = 0; parts.legR.rotation.z = 0; }
    updateRemotes(dt);

    // nearest cabinet
    var best = null, bd = 1e9;
    if (enabled && !lock) cabinets.forEach(function (c) {
      var dx = P.x - c.front.x, dz = P.z - c.front.z, d = Math.hypot(dx, dz);
      if (!c.disabled && d < (c.r || 1.45) && d < bd) { bd = d; best = c; }
    });
    if (!lock && best !== near) { near = best; if (Hub.onNear) Hub.onNear(near); }
    cabinets.forEach(function (c) { var o = c === near ? 0.8 + Math.sin(time * 6) * 0.2 : 0.3; c.glow.opacity += (o - c.glow.opacity) * Math.min(1, dt * 8); });

    // camera
    // when standing at a cabinet, lift the camera so the screen is visible above the character's head
    C.nb += ((near ? 1 : 0) - C.nb) * Math.min(1, dt * 3);
    var tx = P.x, ty = 1.35 + 0.75 * C.nb, tz = P.z;
    if (near) { tx += -near.dir.x * 0.6 * C.nb; tz += -near.dir.z * 0.6 * C.nb; }
    if (titleMode) { C.yaw += dt * 0.12; }
    var ct = Hub.camTune ? Hub.camTune(Hub._area) : null, cdist = ct ? Math.min(C.dist, ct.dist) : C.dist; // indoor rooms (attic) tune the camera: higher + closer so you see the room, not your back
    var pitch = Math.min(0.95, (ct ? ct.pitch : C.pitch) + 0.12 * C.nb);
    var cp = Math.cos(pitch), sp = Math.sin(pitch);
    var want = cdist, step = 0.12, dd = 0.4;
    var bx = Math.sin(C.yaw) * cp, by = sp, bz = Math.cos(C.yaw) * cp;
    for (dd = 0.4; dd <= cdist; dd += step) { if (inWall(tx + bx * dd, ty + by * dd, tz + bz * dd, 0.25)) { break; } }
    want = Math.min(cdist, dd - step);
    C.cur += (want - C.cur) * Math.min(1, dt * (want < C.cur ? 20 : 4));
    camera.position.set(tx + bx * C.cur, ty + by * C.cur, tz + bz * C.cur);
    var ah = ct && ct.ahead ? ct.ahead * (1 - C.nb) : 0; // indoor rooms look a little past you so you see the room
    camera.lookAt(tx - Math.sin(C.yaw) * ah, ty + 0.25 - 0.3 * C.nb, tz - Math.cos(C.yaw) * ah);
    var f0 = camera.userData.fov0 || 58, fov = ct && ct.fov ? f0 + ct.fov : f0; if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix(); }
    // claw machine close-up: blend smoothly into / out of the machine's camera
    if (camOv || camK > 0) {
      if (camOv) { var ca = camOv(); if (ca) camLast = ca; }
      camK += ((camOv ? 1 : 0) - camK) * Math.min(1, dt * 5); if (!camOv && camK < 0.01) camK = 0;
      if (camLast && camK > 0) {
        var k2 = camK * camK * (3 - 2 * camK);
        tmpV.set(tx, ty + 0.25 - 0.3 * C.nb, tz);
        camera.position.lerp(tmpV2.set(camLast[0], camLast[1], camLast[2]), k2); tmpV.lerp(tmpV2.set(camLast[3], camLast[4], camLast[5]), k2); camera.lookAt(tmpV);
      }
    }
    if (Hub._cam) { camera.position.set(Hub._cam[0], Hub._cam[1], Hub._cam[2]); camera.lookAt(Hub._cam[3], Hub._cam[4], Hub._cam[5]); }
    if (shakeT > 0) { shakeT -= dt; camera.position.x += (Math.random() - 0.5) * shakeT * 0.6; camera.position.y += (Math.random() - 0.5) * shakeT * 0.6; }

    // attract screens (throttled, near ones faster)
    var now = time;
    cabinets.forEach(function (c) {
      if (!c.sctx) return;
      if (powerK < 0.5) { if (!c.offDrawn) { c.offDrawn = true; c.sctx.fillStyle = '#000'; c.sctx.fillRect(0, 0, c.w, c.h); c.stex.needsUpdate = true; } return; }
      c.offDrawn = false;
      if (now < c.nextDraw) return;
      if (c.group.parent && c.group.parent.visible === false) { c.nextDraw = now + 0.5; return; }
      if (GA.Perf && !GA.Perf.inView(c.x, 1.6, c.z, 1.4)) { c.nextDraw = now + 0.25; return; } // off-screen: don't repaint its attract screen
      var d = Math.hypot(P.x - c.x, P.z - c.z);
      c.nextDraw = now + (d < 9 ? 1 / 15 : d < 16 ? 1 / 6 : 0.5);
      attract(c.id, c.sctx, c.w, c.h, now, c); c.stex.needsUpdate = true;
    });
    for (var i = 0; i < anims.length; i++) anims[i](time);
    if (GA.Pics) GA.Pics.tick(P.x, P.z, time);
    updateBroken(dt); updateGary(dt); updatePower(dt);

    // area label
    var area = regionAt(P.x, P.z);
    if (area !== Hub._area) { Hub._area = area; Hub._inBonus = area === 'bonus'; if (Hub.onArea) Hub.onArea(area === 'bonus', area); }
  }

  function frame(t) {
    requestAnimationFrame(frame);
    var rawMs = t - lastT, dt = Math.min(0.05, Math.max(0, rawMs / 1000)); lastT = t;
    if (paused) return;
    update(dt);
    if (GA.Perf) GA.Perf.frame(dt, rawMs);
    renderer.render(scene, camera);
  }

  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.userData.fov0 = w < h ? 70 : 58;
    C.dist = w < h ? 7.0 : 6.2;
    camera.updateProjectionMatrix();
  }

  /* ---------- extension API (claw machines build into the hub with the same helpers) ---------- */
  function api() { return { T: T, scene: scene, mesh: mesh, box: box, cyl: cyl, sph: sph, plane: plane, lam: lam, basic: basic, sign: sign, decal: decal, mkCanvas: mkCanvas, canvasTex: canvasTex, neonText: neonText, font: font,
    addSolid: addSolid, addWall: addWall, walls: walls, regItem: regItem, begin: begin, end: end, noAud: noAud, wallSign: wallSign, cabinets: cabinets, anims: anims, glowTex: glowTex, ROOM: ROOM, WING: WING, FOOD: FOOD, REGIONS: REGIONS, DIV_X: DIV_X, attract: function (id, g, w, h, t) { attract(id, g, w, h, t, {}); }, camera: function () { return camera; }, renderer: function () { return renderer; },
    pose: function () { return { x: P.x, z: P.z, face: P.face, speed: P.speed }; } }; }

  /* ---------- layout audit ---------- */
  Hub.audit = function () {
    var EPS = 0.02, out = { items: AUD.length, overlaps: [], covered: [], decals: [], solidOverlaps: [], blockedSpots: [], unreachable: [], outside: [] };
    function ov(a, b, pad) { pad = pad == null ? EPS : pad; return Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX) > pad && Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY) > pad && Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ) > pad; }
    function ov2(a, b, pad) { pad = pad == null ? EPS : pad; return Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX) > pad && Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ) > pad; }
    var phys = AUD.filter(function (k) { return k.kind !== 'sign' && k.kind !== 'decal'; });
    var signs = AUD.filter(function (k) { return k.kind === 'sign'; }), decals = AUD.filter(function (k) { return k.kind === 'decal'; });
    var th = 0.4, H = ROOM.h;
    var wallsA = [ { name: 'divider wall N', minX: DIV_X - th / 2, maxX: DIV_X + th / 2, minY: 0, maxY: H, minZ: ROOM.minZ, maxZ: -DOOR },
      { name: 'divider wall S', minX: DIV_X - th / 2, maxX: DIV_X + th / 2, minY: 0, maxY: H, minZ: DOOR, maxZ: ROOM.maxZ },
      { name: 'doorway lintel', minX: DIV_X - th / 2, maxX: DIV_X + th / 2, minY: 3.3, maxY: H, minZ: -DOOR, maxZ: DOOR },
      { name: 'south wall W of Hall door', minX: WING.minX - th, maxX: WING.doorX - WING.doorHW, minY: 0, maxY: H, minZ: ROOM.maxZ, maxZ: ROOM.maxZ + th },
      { name: 'south wall E of Hall door', minX: WING.doorX + WING.doorHW, maxX: WING.maxX, minY: 0, maxY: H, minZ: ROOM.maxZ, maxZ: ROOM.maxZ + th },
      { name: 'Hall door lintel', minX: WING.doorX - WING.doorHW, maxX: WING.doorX + WING.doorHW, minY: WING.doorH, maxY: H, minZ: ROOM.maxZ, maxZ: ROOM.maxZ + th },
      { name: 'south wall W of Food Court door', minX: ROOM.minX - th, maxX: FOOD.doorX - FOOD.doorHW, minY: 0, maxY: H, minZ: ROOM.maxZ, maxZ: ROOM.maxZ + th },
      { name: 'south wall E of Food Court door', minX: FOOD.doorX + FOOD.doorHW, maxX: WING.doorX - WING.doorHW, minY: 0, maxY: H, minZ: ROOM.maxZ, maxZ: ROOM.maxZ + th },
      { name: 'Food Court door lintel', minX: FOOD.doorX - FOOD.doorHW, maxX: FOOD.doorX + FOOD.doorHW, minY: FOOD.doorH, maxY: H, minZ: ROOM.maxZ, maxZ: ROOM.maxZ + th },
      { name: 'Food Court / Hall wall', minX: FOOD.maxX, maxX: WING.minX, minY: 0, maxY: H, minZ: ROOM.maxZ, maxZ: WING.maxZ } ];
    function within(p, r, my) { return p.minX >= r.minX - EPS && p.maxX <= r.maxX + EPS && p.minZ >= r.minZ - EPS && p.maxZ <= r.maxZ + EPS && p.maxY <= my + EPS; }
    function inArea(p) { if (within(p, ROOM, ROOM.h) || within(p, WING, ROOM.h) || within(p, FOOD, ROOM.h)) return true; for (var q = 0; q < REGIONS.length; q++) if (within(p, REGIONS[q], REGIONS[q].maxY || ROOM.h)) return true; return false; }
    // 1) physical things clipping into each other or into the divider wall
    for (var i = 0; i < phys.length; i++) {
      for (var j = i + 1; j < phys.length; j++) if (ov(phys[i], phys[j])) out.overlaps.push([phys[i].name, phys[j].name]);
      wallsA.forEach(function (w) { if (ov(phys[i], w)) out.overlaps.push([phys[i].name, w.name]); });
      var p0 = phys[i]; if (!p0.doorway && !inArea(p0)) out.outside.push(p0.name);
    }
    // 2) wall signs / posters: overlapping each other, or something standing in front of them (within 1.2 m of the wall)
    signs.forEach(function (sg, k) {
      var a = { minX: sg.minX - 0.05, maxX: sg.maxX + 0.05, minY: sg.minY, maxY: sg.maxY, minZ: sg.minZ - 0.05, maxZ: sg.maxZ + 0.05 };
      for (var m = k + 1; m < signs.length; m++) { var b = signs[m], bb = { minX: b.minX - 0.05, maxX: b.maxX + 0.05, minY: b.minY, maxY: b.maxY, minZ: b.minZ - 0.05, maxZ: b.maxZ + 0.05 }; if (ov(a, bb)) out.overlaps.push([sg.name, b.name]); }
      var ex = { minX: a.minX, maxX: a.maxX, minY: a.minY, maxY: a.maxY, minZ: a.minZ, maxZ: a.maxZ }, D = 1.2;
      if (sg.nx > 0) ex.maxX += D; else if (sg.nx < 0) ex.minX -= D; if (sg.nz > 0) ex.maxZ += D; else if (sg.nz < 0) ex.minZ -= D;
      phys.forEach(function (p) { if (ov(ex, p)) out.covered.push([sg.name, p.name]); });
    });
    // 3) floor decals hidden under props
    decals.forEach(function (d) { phys.forEach(function (p) { if (p.minY < 0.15 && ov2(d, p, 0.05)) out.decals.push([d.name, p.name]); }); });
    // 4) collision boxes overlapping (two things claiming the same floor)
    var sol = solids.filter(function (b) { return b.name !== 'wall'; });
    for (i = 0; i < sol.length; i++) for (j = i + 1; j < sol.length; j++) if (sol[i].name !== sol[j].name && ov2(sol[i], sol[j], 0.01)) out.solidOverlaps.push([sol[i].name, sol[j].name]);
    // 5) walkways: flood-fill the floor from the entrance (and from each far-away area's arrival spot); every cabinet / booth / counter spot must be reachable
    var G = 0.1;
    function clear(x, z) { for (var q = 0; q < solids.length; q++) { var b = solids[q], cx = Math.max(b.minX, Math.min(x, b.maxX)), cz = Math.max(b.minZ, Math.min(z, b.maxZ)); if ((x - cx) * (x - cx) + (z - cz) * (z - cz) < (PR - 0.01) * (PR - 0.01)) return false; } return true; }
    function flood(r, sp) {
      var nx = Math.round((r.maxX - r.minX) / G) + 1, nz = Math.round((r.maxZ - r.minZ) / G) + 1, free = new Uint8Array(nx * nz), seen = new Uint8Array(nx * nz);
      for (var a = 0; a < nx; a++) for (var b2 = 0; b2 < nz; b2++) free[a * nz + b2] = clear(r.minX + a * G, r.minZ + b2 * G) ? 1 : 0;
      var si = Math.round((sp.x - r.minX) / G), sk = Math.round((sp.z - r.minZ) / G), qu = [si * nz + sk]; seen[qu[0]] = 1;
      while (qu.length) { var c = qu.pop(), ci = Math.floor(c / nz), ck = c % nz; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var ni = ci + d[0], nk = ck + d[1]; if (ni < 0 || nk < 0 || ni >= nx || nk >= nz) return; var id = ni * nz + nk; if (!seen[id] && free[id]) { seen[id] = 1; qu.push(id); } }); }
      var reach = 0; for (a = 0; a < seen.length; a++) reach += seen[a];
      return { r: r, nx: nx, nz: nz, seen: seen, reach: reach };
    }
    var fills = [flood({ minX: ROOM.minX, maxX: ROOM.maxX, minZ: ROOM.minZ, maxZ: WING.maxZ }, SPAWN)].concat(REGIONS.map(function (r) { return flood(r, r.spawn); }));
    out.reachableCells = fills[0].reach; out.regionCells = {}; fills.slice(1).forEach(function (f) { out.regionCells[f.r.name] = f.reach; });
    cabinets.forEach(function (cb) {
      var f = cb.front, r = cb.r || 1.45, okSpot = false;
      fills.forEach(function (F) {
        if (okSpot || f.x < F.r.minX - r || f.x > F.r.maxX + r || f.z < F.r.minZ - r || f.z > F.r.maxZ + r) return;
        var i0 = Math.round((f.x - F.r.minX) / G), k0 = Math.round((f.z - F.r.minZ) / G), rr = Math.ceil(r / G);
        for (var di = -rr; di <= rr && !okSpot; di++) for (var dk = -rr; dk <= rr && !okSpot; dk++) { var ii = i0 + di, kk = k0 + dk; if (ii < 0 || kk < 0 || ii >= F.nx || kk >= F.nz) continue; if (Math.hypot(di * G, dk * G) < r - 0.1 && F.seen[ii * F.nz + kk]) okSpot = true; }
      });
      if (!okSpot) out.unreachable.push(cb.id);
      if (!clear(f.x, f.z) && !cb.noStand) out.blockedSpots.push(cb.id);
    });
    out.ok = !out.overlaps.length && !out.covered.length && !out.decals.length && !out.solidOverlaps.length && !out.unreachable.length && !out.outside.length;
    return out;
  };
  Hub.auditItems = function () { return AUD.map(function (k) { return { name: k.name, kind: k.kind, box: [k.minX, k.maxX, k.minY, k.maxY, k.minZ, k.maxZ].map(function (v) { return +v.toFixed(2); }) }; }); };

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
    var hl = new T.HemisphereLight('#d8ccff', '#4a2a6e', 0.85), al = new T.AmbientLight('#ffffff', 0.25);
    scene.add(hl); scene.add(al);
    var dl = new T.DirectionalLight('#ffffff', 0.55); dl.position.set(-4, 10, 6); scene.add(dl);
    LIGHTS = [[hl, 0.85], [al, 0.25], [dl, 0.55]];
    buildRoom(); buildSigns(); buildDecor(); buildCabinets(); buildAntenna();
    if (GA.Hall3D && GA.Hall3D.build) { try { GA.Hall3D.build(api()); } catch (e) { if (window.console) console.warn('Hall of Game Records failed to build', e); } }
    if (GA.Areas && GA.Areas.build) { try { GA.Areas.build(api()); } catch (e) { if (window.console) console.warn('Food Court / Rooftop / Basement failed to build', e); } }
    if (GA.Attic && GA.Attic.build) { try { GA.Attic.build(api()); } catch (e) { if (window.console) console.warn('Attic failed to build', e); } }
    buildGary(); buildPlayer(); setupInput();
    // restore position when coming back from a main game
    var saved = null; try { saved = JSON.parse(sessionStorage.getItem('grokArcade.pos') || 'null'); } catch (e) {}
    if (saved && isFinite(saved.x) && isFinite(saved.z)) { P.x = saved.x; P.z = saved.z; P.face = saved.face || 0; Hub._startYaw = saved.yaw || 0; }
    else { Hub._startYaw = SPAWN.yaw; P.face = Math.PI; }
    window.addEventListener('resize', resize); resize();
    if (GA.Perf) { try { GA.Perf.init({ renderer: renderer, scene: scene, camera: camera, mobile: mobile, prMax: Math.min(window.devicePixelRatio || 1, mobile ? 1.6 : 1.75), keep: [player, GARY.root].filter(Boolean), pose: function () { return P; } }); } catch (e) { if (window.console) console.warn('perf init', e); } }
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
  Hub.setFace = function (f) { P.face = f; P.speed = 0; };
  Hub.setCarry = function (c) { if (me) dress(me, c); };
  Hub.carryState = function () { return me ? { hand: me.parts.carry.hand || null, head: me.parts.carry.head || null, neck: me.parts.carry.neck || null, handMeshes: me.parts.hand.children.length, capHidden: !me.parts.cap[0].visible, hatMeshes: me.parts.hatSlot.children.length } : null; };
  Hub.playerScreen = function () { return Hub.toScreen(P.x, 1.1, P.z); };
  Hub.pose = function () { return { x: P.x, z: P.z, face: P.face, moving: P.speed > 0.3 }; };
  Hub.debugCam = function (a) { Hub._cam = a || null; }; // [px,py,pz, lx,ly,lz] or null
  Hub.garyPos = function () { return { x: GARY.x, z: GARY.z, face: GARY.face, state: GARY.state }; };
  Hub.cameraYaw = function (y) { if (y != null) C.yaw = y; return C.yaw; };
  Hub.renderer = function () { return renderer; };
  Hub.setAntennaBroken = function (b) { setBroken(!!b); };
  Hub.antennaBroken = function () { return !!ANT.broken; };
  Hub.setPower = function (on, instant) { powerTarget = on ? 1 : 0; if (instant) { powerK = powerTarget; applyPower(); } };
  Hub.power = function () { return { target: powerTarget, k: +powerK.toFixed(2) }; };
  Hub.shake = function (s) { shakeT = Math.max(shakeT, s || 0.6); };
  Hub.garyGo = function (onFixed, onDone) { return garyGo(onFixed, onDone); };
  Hub.garyNeeded = function (b) { GARY.needed = !!b; };
  Hub.gary = function () { return { state: GARY.state, x: +GARY.x.toFixed(2), z: +GARY.z.toFixed(2), needed: GARY.needed }; };
  Hub.garyScreen = function () {
    if (!camera || !GARY.root) return null; var v = new T.Vector3(GARY.x, 2.0, GARY.z).project(camera);
    var w = window.innerWidth, h = window.innerHeight, behind = v.z > 1;
    return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, on: !behind && v.x > -1 && v.x < 1 && v.y > -1 && v.y < 1, behind: behind, dist: Math.hypot(P.x - GARY.x, P.z - GARY.z) };
  };
  Hub.setLock = function (b) { lock = !!b; keys = {}; joy.x = joy.y = 0; joy.id = null; look.id = null; if (Hub._resetJoy) Hub._resetJoy(); };
  Hub.locked = function () { return lock; };
  Hub.setCamOverride = function (fn) { camOv = fn || null; };
  Hub.setEmote = function (n) { EMO.name = n || null; EMO.t0 = time; if (n) { EMO.was = true; P.speed = 0; } };
  Hub.emote = function () { return EMO.name; };
  Hub.addRegion = function (r) { REGIONS.push(r); return r; };
  Hub.regionAt = function (x, z) { return regionAt(x, z); };
  Hub.ROOM = ROOM; Hub.DIV_X = DIV_X; Hub.WING = WING; Hub.FOOD = FOOD; Hub.REGIONS = REGIONS; Hub.area = function () { return Hub._area || 'main'; };
})();
