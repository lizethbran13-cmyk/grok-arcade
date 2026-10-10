/* Grok Arcade - three new walk-in areas, built into the hub with the same extension API as the Hall wing:
   1. FOOD COURT (behind the main hall's south wall): snack bar + Chef Gio, brick pizza oven, slushie machine, ice cream freezer,
      tables and stools, the elevator + stairs up to the roof, and the locked STAFF ONLY door down to the basement.
   2. ROOFTOP PARTY DECK (far away at z -110, reached by elevator/stairs): DJ booth with DJ Byte, LED dance floor + disco ball,
      firework launch console, party schedule board, string lights, lounge, night sky and a glowing city all around.
   3. SECRET BASEMENT (far away at z +110, down the stairs behind the locked door): a dim retro arcade with rare old cabinets,
      a fuse-box lights puzzle, a code safe with clue posters, the vault display case, a jukebox and Gus's old desk.
   Gus's key hides in a different spot every ISO week (same spot for everyone that week). All real 3D geometry. */
(function () {
  'use strict';
  var T = THREE, A, AR = GA.Areas = {};
  var mats = {}, G = {};
  function ph(c, s, e) { var k = 'p' + c + (s || 40) + (e || ''); return mats[k] || (mats[k] = new T.MeshPhongMaterial({ color: c, shininess: s || 40, specular: '#ffffff', emissive: e ? new T.Color(e) : new T.Color(0) })); }
  function lm(c) { var k = 'l' + c; return mats[k] || (mats[k] = new T.MeshLambertMaterial({ color: c })); }
  function gl(c) { return A.basic(c); }
  function nofog(c) { var k = 'nf' + c; return mats[k] || (mats[k] = new T.MeshBasicMaterial({ color: c, fog: false })); }
  function chrome() { return ph('#d5dde8', 120, '#11141a'); }
  function gold() { return ph('#e8b84a', 90, '#3a2400'); }
  function add(par, geo, mat, x, y, z) { var m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); par.add(m); return m; }
  function geo(k, f) { return G[k] || (G[k] = f()); }
  function bx(w, h, d) { return geo('b' + w + ',' + h + ',' + d, function () { return new T.BoxGeometry(w, h, d); }); }
  function cy(a, b, h, s) { return geo('c' + a + ',' + b + ',' + h + ',' + (s || 24), function () { return new T.CylinderGeometry(a, b, h, s || 24); }); }
  function sp(r, s) { return geo('s' + r + ',' + (s || 20), function () { return new T.SphereGeometry(r, s || 20, Math.max(8, Math.round((s || 20) * 0.7))); }); }
  function to(r, t, arc, s) { return geo('t' + r + ',' + t + ',' + (arc || 7) + ',' + (s || 32), function () { return new T.TorusGeometry(r, t, 10, s || 32, arc || Math.PI * 2); }); }
  function cn(r, h, s) { return geo('k' + r + ',' + h + ',' + (s || 18), function () { return new T.ConeGeometry(r, h, s || 18); }); }
  function cvs(w, h, draw) { var c = A.mkCanvas(w, h), g = c.getContext('2d'); if (draw) draw(g, w, h); var t = A.canvasTex(c); return { c: c, g: g, tex: t }; }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function F(px, w) { return (w || 'bold') + ' ' + px + 'px "Trebuchet MS",system-ui,sans-serif'; }
  function fitFont(g, s, maxW, px, w) { g.font = F(px, w); while (g.measureText(s).width > maxW && px > 8) { px -= 2; g.font = F(px, w); } return px; }
  function glowText(g, s, x, y, px, col, maxW) { fitFont(g, s, maxW || 9999, px); g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = col; g.shadowBlur = px * 0.35; g.fillStyle = col; g.fillText(s, x, y); g.shadowBlur = 0; g.fillStyle = '#ffffff'; g.globalAlpha = 0.35; g.fillText(s, x, y); g.globalAlpha = 1; }
  function texPlane(w, h, tex, opts) { opts = opts || {}; var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, transparent: !!opts.transparent, fog: opts.fog !== false ? true : false, side: opts.double ? T.DoubleSide : T.FrontSide })); return m; }
  function glowSprite(col, s, op) { var g = new T.Sprite(new T.SpriteMaterial({ map: A.glowTex, color: col, transparent: true, opacity: op || 0.6, depthWrite: false, blending: T.AdditiveBlending })); g.scale.set(s, s, 1); return g; }
  /* every wall sign / poster is a real plane registered with the layout audit (it checks nothing stands in front of it) */
  function wallSign(area, name, w, h, tex, x, y, z, rotY) { var m = texPlane(w, h, tex); m.position.set(x, y, z); m.rotation.y = rotY || 0; A.wallSign(name, m); R[area].add(m); return m; }
  /* a named prop group (registered with the audit when done) */
  function prop(area, name, x, z, rotY) { var g = new T.Group(); g.name = name; g.position.set(x, 0, z); g.rotation.y = rotY || 0; R[area].add(g); return g; }
  function reg(g, kind) { g.updateMatrixWorld(true); return A.regItem(g.name, kind || 'prop', g); }
  function solidBox(name, minX, maxX, minZ, maxZ) { A.addSolid(minX, maxX, minZ, maxZ, name); }
  function solidOf(g, pad) { g.updateMatrixWorld(true); var b = new T.Box3(), tmp = new T.Box3(); g.traverse(function (o) { if (!o.isMesh) return; for (var q = o; q; q = q.parent) if (q.userData.noAudit) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); b.union(tmp); }); pad = pad || 0; A.addSolid(b.min.x - pad, b.max.x + pad, b.min.z - pad, b.max.z + pad, g.name); return b; }

  /* ---------- areas: roots (hidden when you're elsewhere, saves draw calls on phones) + regions ---------- */
  var R = {}, CABS = {}, ANIM = { food: [], roof: [], base: [], any: [] }, live = { food: true, roof: false, base: false };
  var ROOF = { name: 'roof', minX: -14, maxX: 14, minZ: -124, maxZ: -95, maxY: 30, spawn: { x: 0, z: -98.6 }, cx: 0, cz: -110 };
  var BASE = { name: 'basement', minX: -11, maxX: 11, minZ: 100, maxZ: 118, maxY: 4.2, H: 4.0, spawn: { x: 0, z: 102.9 }, cx: 0, cz: 109 };
  AR.ROOF = ROOF; AR.BASE = BASE;
  function mkRoot(k) { var g = new T.Group(); g.name = 'area:' + k; A.scene.add(g); R[k] = g; return g; }

  /* ---------- interactables (same shape as the hub's cabinets so the walk-up prompt + PLAY button just work) ---------- */
  function inter(o) {
    var dir = new T.Vector3(o.dir[0], 0, o.dir[1]).normalize();
    var gm = new T.MeshBasicMaterial({ map: A.glowTex, color: o.col || '#ffe14d', transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending });
    var fl = add(R[o.area], new T.PlaneGeometry(o.gw || 1.7, o.gh || 1.3), gm, o.x, 0.03, o.z); fl.rotation.x = -Math.PI / 2; fl.renderOrder = 2; A.noAud(fl);
    if (o.hideGlow) fl.visible = false;
    var anchor = new T.Object3D(); anchor.position.set(o.x - dir.x * 1.75, 0, o.z - dir.z * 1.75); anchor.rotation.y = Math.atan2(dir.x, dir.z); R[o.area].add(anchor); anchor.updateMatrixWorld(true);
    var cab = { game: { id: o.id, name: o.name, desc: o.desc || '', color: o.col || '#ffe14d' }, kind: o.kind, id: o.id, group: anchor, x: o.x, z: o.z, rot: anchor.rotation.y,
      front: new T.Vector3(o.x, 0, o.z), dir: dir, glow: gm, glowMesh: fl, nextDraw: Infinity, r: o.r || 1.3, area: o.area, ar: true, data: o.data || {} };
    A.cabinets.push(cab); CABS[o.id] = cab; return cab;
  }
  AR.cab = function (id) { return CABS[id]; };
  AR.ids = function () { return Object.keys(CABS); };

  /* ---------- shared NPC speech bubble ---------- */
  function bubble(par, y) {
    var c = A.mkCanvas(512, 200), t = A.canvasTex(c); t.minFilter = T.LinearFilter; t.generateMipmaps = false;
    var s = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false })); s.scale.set(2.3, 0.9, 1); s.position.set(0, y, 0); s.visible = false; s.renderOrder = 10; par.add(s); A.noAud(s);
    var b = { s: s, c: c, t: t, left: 0, line: null };
    b.say = function (text, secs) {
      var g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      g.fillStyle = '#fffdf5'; g.strokeStyle = '#3a2216'; g.lineWidth = 6; rr(g, 6, 6, w - 12, h - 46, 26); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(w / 2 - 20, h - 42); g.lineTo(w / 2, h - 8); g.lineTo(w / 2 + 20, h - 42); g.closePath(); g.fill(); g.stroke(); g.fillRect(w / 2 - 17, h - 46, 34, 6);
      g.fillStyle = '#2a1a10'; g.textAlign = 'center'; g.textBaseline = 'middle';
      var px = 30, lines; function wrap() { lines = []; var cur = ''; g.font = F(px); String(text).split(' ').forEach(function (wd) { var q = cur ? cur + ' ' + wd : wd; if (g.measureText(q).width > w - 44) { lines.push(cur); cur = wd; } else cur = q; }); if (cur) lines.push(cur); }
      wrap(); if (lines.length > 3) { px = 24; wrap(); lines = lines.slice(0, 4); }
      lines.forEach(function (ln, i) { g.fillText(ln, w / 2, (h - 40) / 2 + (i - (lines.length - 1) / 2) * (px + 4)); });
      t.needsUpdate = true; s.visible = true; b.left = secs || 4.5; b.line = text;
    };
    b.tick = function (dt) { if (b.left > 0) { b.left -= dt; s.material.opacity = Math.min(1, b.left * 2); if (b.left <= 0) s.visible = false; } };
    return b;
  }

  /* =====================================================================================================
     1) FOOD COURT
     ===================================================================================================== */
  var FC, chef = {}, oven = {}, slush = {};
  function tileTex(a, b, n) { var c = A.mkCanvas(256, 256), g = c.getContext('2d'), s = 256 / n; for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? a : b; g.fillRect(i * s, j * s, s, s); } g.globalAlpha = 0.18; g.strokeStyle = '#000'; for (i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 256); g.moveTo(0, i * s); g.lineTo(256, i * s); g.stroke(); } g.globalAlpha = 1; var t = A.canvasTex(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
  function subwayTex() { var c = A.mkCanvas(256, 128), g = c.getContext('2d'); g.fillStyle = '#c9c1b4'; g.fillRect(0, 0, 256, 128); for (var r = 0; r < 4; r++) for (var k = -1; k < 5; k++) { var x = k * 64 + (r % 2) * 32; g.fillStyle = r % 2 ? '#fff7ec' : '#fffdf7'; rr(g, x + 2, r * 32 + 2, 60, 28, 4); g.fill(); } var t = A.canvasTex(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
  function buildFoodShell() {
    var f = FC, W = f.maxX - f.minX, D = f.maxZ - f.minZ, cx = (f.minX + f.maxX) / 2, cz = (f.minZ + f.maxZ) / 2, H = A.ROOM.h, sh = R.food;
    var tt = tileTex('#c0392b', '#fff4e0', 8); tt.repeat.set(W / 4, D / 4);
    var fl = add(sh, new T.PlaneGeometry(W, D), new T.MeshPhongMaterial({ map: tt, shininess: 60, specular: '#444444' }), cx, 0, cz); fl.rotation.x = -Math.PI / 2;
    var ce = add(sh, new T.PlaneGeometry(W, D), ph('#3b2418', 10), cx, H, cz); ce.rotation.x = Math.PI / 2;
    for (var x = f.minX + 2.2; x < f.maxX - 0.5; x += 2.4) add(sh, bx(0.16, 0.2, D), ph('#5b3a26', 20), x, H - 0.1, cz);
    var plaster = ph('#ffe9c7', 10), st = subwayTex(), th = 0.06;
    function wall(w, h, x, y, z, ry, mat) { var m = add(sh, new T.PlaneGeometry(w, h), mat, x, y, z); m.rotation.y = ry; return m; }
    var tileM = function (len) { var t2 = st.clone(); t2.needsUpdate = true; t2.repeat.set(len / 2, 1.3 / 1.0); return new T.MeshLambertMaterial({ map: t2 }); };
    // west / south / east inner walls: cream plaster above, subway tile wainscot, red trim + neon line
    var sides = [ [D, f.minX + 0.01, cz, Math.PI / 2], [W, cx, f.maxZ - 0.01, Math.PI], [D, f.maxX - 0.01, cz, -Math.PI / 2] ];
    sides.forEach(function (sd) { var len = sd[0]; var ox = sd[1], oz = sd[2], ry = sd[3];
      wall(len, H - 1.3, ox, 1.3 + (H - 1.3) / 2, oz, ry, plaster); wall(len, 1.3, ox, 0.65, oz, ry, tileM(len));
      var nx = Math.sin(ry) * 0.03, nz = Math.cos(ry) * 0.03, tr = add(sh, bx(Math.abs(Math.cos(ry)) > 0.5 ? len : 0.06, 0.1, Math.abs(Math.cos(ry)) > 0.5 ? 0.06 : len), ph('#c0392b', 40), ox + nx, 1.34, oz + nz); void tr;
      add(sh, bx(Math.abs(Math.cos(ry)) > 0.5 ? len : 0.05, 0.06, Math.abs(Math.cos(ry)) > 0.5 ? 0.05 : len), gl('#ffb347'), ox + nx, H - 0.35, oz + nz); });
    // north inner wall (back of the arcade's south wall) with the doorway
    var dl = f.doorX - f.doorHW, dr = f.doorX + f.doorHW, zN = f.minZ + 0.01;
    [[f.minX, dl], [dr, f.maxX]].forEach(function (s2) { var len = s2[1] - s2[0], mx = (s2[0] + s2[1]) / 2; wall(len, H - 1.3, mx, 1.3 + (H - 1.3) / 2, zN, 0, plaster); wall(len, 1.3, mx, 0.65, zN, 0, tileM(len)); add(sh, bx(len, 0.1, 0.06), ph('#c0392b', 40), mx, 1.34, zN + 0.03); add(sh, bx(len, 0.06, 0.05), gl('#ffb347'), mx, H - 0.35, zN + 0.03); });
    wall(f.doorHW * 2, H - f.doorH, f.doorX, f.doorH + (H - f.doorH) / 2, zN, 0, plaster);
    // warm lights: one point light + pendant lamps
    var pl = new T.PointLight('#ffd9a0', 0.6, 22, 1.5); pl.position.set(cx, H - 0.8, cz); sh.add(pl);
    void th;
  }
  /* door arch on the main-hall side + signs (so you can find the new areas) */
  function buildFoodDoor() {
    var f = FC, dz = A.ROOM.maxZ, x0 = f.doorX, g = new T.Group(); g.name = 'Food Court door arch'; R.food.add(g);
    var red = ph('#e23b3b', 60), cream = ph('#fff1d6', 40);
    [-1, 1].forEach(function (sd) { var px = x0 + sd * (f.doorHW + 0.16);
      add(g, bx(0.32, 3.4, 0.3), red, px, 1.7, dz - 0.15); for (var k = 0; k < 6; k++) add(g, bx(0.34, 0.08, 0.32), cream, px, 0.3 + k * 0.55, dz - 0.15);
      add(g, sp(0.16, 16), gl('#ffe14d'), px, 3.55, dz - 0.15); A.addSolid(px - 0.16, px + 0.16, dz - 0.3, dz, 'Food Court door arch'); });
    // striped awning over the door
    for (var i = 0; i < 8; i++) { var aw = add(g, bx((f.doorHW * 2 + 0.6) / 8, 0.05, 0.7), ph(i % 2 ? '#ffffff' : '#e23b3b', 20), x0 - (f.doorHW + 0.3) + (i + 0.5) * (f.doorHW * 2 + 0.6) / 8, 3.55, dz - 0.38); aw.rotation.x = -0.35; }
    A.noAud(g);
    var s = cvs(1024, 300, function (c, w, h) { var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5a1010'); gr.addColorStop(1, '#2a0808'); c.fillStyle = gr; rr(c, 6, 6, w - 12, h - 12, 40); c.fill(); c.strokeStyle = '#ffb347'; c.lineWidth = 10; c.stroke();
      glowText(c, 'FOOD COURT', w / 2, 112, 120, '#ffd23f', w - 80); c.font = F(44); c.fillStyle = '#fff1d6'; c.textAlign = 'center'; c.fillText('\uD83C\uDF55 snacks \u00b7 \u2B06 ROOFTOP PARTY \u00b7 \uD83D\uDD12 ???', w / 2, 230); });
    wallSign('food', 'FOOD COURT door sign', 3.0, 0.88, s.tex, x0, 4.35, dz - 0.03, Math.PI);
    var dc = A.decal('FOOD COURT', 2.6, 0.8, '#ffb347', x0, dz - 1.45, Math.PI, 'snacks \u00b7 rooftop \u00b7 basement'); R.food.attach(dc); A.regItem('decal:FOOD COURT', 'decal', dc);
    // inside, above the door: big neon sign
    var s2 = cvs(1024, 256, function (c, w, h) { c.fillStyle = '#2a0f08'; rr(c, 4, 4, w - 8, h - 8, 30); c.fill(); c.strokeStyle = '#ff6b3d'; c.lineWidth = 8; c.stroke(); glowText(c, 'GROK EATS', w / 2, 96, 110, '#ff6b3d', w - 60); c.font = F(46); c.fillStyle = '#ffe9c7'; c.textAlign = 'center'; c.fillText('FOOD COURT \u00b7 open late', w / 2, 196); });
    wallSign('food', 'GROK EATS sign inside', 3.4, 0.85, s2.tex, x0, 4.2, f.minZ + 0.05, 0);
  }
  function stool(par, x, z, col) { add(par, cy(0.2, 0.22, 0.04, 20), chrome(), x, 0.02, z); add(par, cy(0.035, 0.035, 0.62, 10), chrome(), x, 0.33, z); add(par, cy(0.21, 0.19, 0.1, 22), ph(col, 50), x, 0.68, z); add(par, to(0.2, 0.025, 7, 24), chrome(), x, 0.64, z).rotation.x = Math.PI / 2; }
  function sauceBottle(par, x, y, z, col) { add(par, cy(0.04, 0.045, 0.18, 14), ph(col, 70), x, y + 0.09, z); add(par, cn(0.03, 0.06, 12), ph(col, 70), x, y + 0.21, z); add(par, cy(0.008, 0.008, 0.04, 6), ph('#ffffff', 30), x, y + 0.26, z); }
  function pizzaMesh(par, r, x, y, z, toppings) {
    var p = new T.Group(); p.position.set(x, y, z); par.add(p);
    add(p, cy(r, r * 0.96, 0.04, 28), ph('#e0a458', 20), 0, 0, 0); add(p, to(r * 0.96, 0.03, 7, 30), ph('#c9822e', 20), 0, 0.02, 0).rotation.x = Math.PI / 2;
    add(p, cy(r * 0.9, r * 0.9, 0.012, 28), ph('#c7362b', 30), 0, 0.024, 0); add(p, cy(r * 0.86, r * 0.86, 0.012, 28), ph('#ffd56b', 40), 0, 0.032, 0);
    var tp = toppings || ['pep', 'pep', 'mush', 'pep', 'olive', 'pep', 'mush'];
    tp.forEach(function (k, i) { var a = i * 2.4, d = r * (0.25 + (i % 3) * 0.2);
      if (k === 'pep') add(p, cy(r * 0.13, r * 0.13, 0.01, 14), ph('#b3261e', 40), Math.cos(a) * d, 0.042, Math.sin(a) * d);
      else if (k === 'mush') add(p, sp(r * 0.07, 10), ph('#e8dcc8', 20), Math.cos(a) * d, 0.042, Math.sin(a) * d).scale.set(1.2, 0.4, 1);
      else add(p, to(r * 0.045, r * 0.02, 7, 10), ph('#1f2937', 60), Math.cos(a) * d, 0.042, Math.sin(a) * d).rotation.x = Math.PI / 2; });
    return p;
  }
  function slushCup(par, x, y, z, col) { add(par, cy(0.055, 0.04, 0.16, 14), new T.MeshPhongMaterial({ color: '#ffffff', transparent: true, opacity: 0.65, shininess: 90 }), x, y + 0.08, z); add(par, cy(0.05, 0.036, 0.13, 14), ph(col, 50, col), x, y + 0.075, z).material = new T.MeshPhongMaterial({ color: col, emissive: new T.Color(col).multiplyScalar(0.25) }); add(par, sp(0.055, 12), ph(col, 40), x, y + 0.165, z).scale.set(1, 0.5, 1); add(par, cy(0.006, 0.006, 0.22, 6), ph('#ff4fd8', 30), x + 0.02, y + 0.2, z).rotation.z = 0.2; }
  function buildTables() {
    var cols = ['#ff6b3d', '#3ff0ff', '#ffd23f', '#4ade80', '#ff4fd8', '#a78bfa'], k = 0;
    [-14.2, -8.6, -3.4].forEach(function (x) { [15.8, 19.6].forEach(function (z) {
      var g = prop('food', 'Food Court table ' + (++k), x, z, 0), col = cols[k - 1];
      add(g, cy(0.62, 0.62, 0.06, 32), ph('#fff8ee', 60), 0, 0.76, 0); add(g, to(0.62, 0.03, 7, 36), ph(col, 60), 0, 0.76, 0).rotation.x = Math.PI / 2;
      add(g, cy(0.06, 0.08, 0.72, 12), chrome(), 0, 0.37, 0); add(g, cy(0.32, 0.36, 0.04, 24), chrome(), 0, 0.02, 0);
      [0, 1, 2, 3].forEach(function (i) { var a = i * Math.PI / 2 + Math.PI / 4; stool(g, Math.cos(a) * 0.98, Math.sin(a) * 0.98, col); });
      // something on every table (no empty tables!)
      add(g, bx(0.14, 0.12, 0.08), chrome(), 0.05, 0.85, -0.1); add(g, bx(0.1, 0.1, 0.005), ph('#ffffff', 10), 0.05, 0.86, -0.06);
      sauceBottle(g, -0.18, 0.79, -0.14, '#d62828'); sauceBottle(g, -0.28, 0.79, -0.06, '#f4c20d');
      if (k % 3 === 1) { add(g, cy(0.3, 0.3, 0.015, 28), chrome(), 0.12, 0.8, 0.18); pizzaMesh(g, 0.26, 0.12, 0.81, 0.18); }
      else if (k % 3 === 2) { slushCup(g, 0.2, 0.79, 0.15, '#3ff0ff'); slushCup(g, -0.15, 0.79, 0.25, '#ff4fd8'); }
      else { add(g, bx(0.34, 0.06, 0.24), ph('#e23b3b', 30), 0.1, 0.82, 0.16); for (var n = 0; n < 6; n++) add(g, bx(0.02, 0.12, 0.02), ph('#ffd23f', 30), 0.0 + (n % 3) * 0.08, 0.88, 0.12 + Math.floor(n / 3) * 0.06).rotation.z = (n - 2.5) * 0.15; }
      reg(g, 'prop'); solidBox(g.name, x - 1.2, x + 1.2, z - 1.2, z + 1.2);
      // pendant lamp above (not part of the audit, hangs from the ceiling)
      var lamp = new T.Group(); R.food.add(lamp); A.noAud(lamp);
      add(lamp, cy(0.01, 0.01, 1.7, 6), ph('#222222', 10), x, A.ROOM.h - 0.85, z);
      add(lamp, new T.SphereGeometry(0.34, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshPhongMaterial({ color: col, side: T.DoubleSide, shininess: 80 }), x, A.ROOM.h - 1.72, z);
      add(lamp, sp(0.12, 12), gl('#fff3c4'), x, A.ROOM.h - 1.78, z);
      var lg = glowSprite('#ffd98a', 1.4, 0.45); lg.position.set(x, A.ROOM.h - 1.85, z); lamp.add(lg);
    }); });
  }
  function menuBoardTex() {
    return cvs(1024, 300, function (c, w, h) {
      c.fillStyle = '#1b1210'; rr(c, 4, 4, w - 8, h - 8, 24); c.fill(); c.strokeStyle = '#ffb347'; c.lineWidth = 8; c.stroke();
      glowText(c, 'SNACK BAR \u00b7 MENU', w / 2, 44, 46, '#ffd23f', w - 40);
      var items = (GA.SNACKS || []).filter(function (s) { return !s.day; }).slice(0, 5);
      items.forEach(function (s, i) { var x = 30 + (i % 3) * 330, y = 104 + Math.floor(i / 3) * 96;
        c.font = '44px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(s.icon, x, y + 4);
        c.font = F(26); c.fillStyle = '#ffffff'; c.fillText(s.name, x + 58, y - 12); c.font = F(20); c.fillStyle = '#ffd23f'; c.fillText('\uD83C\uDF9F\uFE0F ' + s.tix + '  or  \uD83E\uDE99 ' + s.coins, x + 58, y + 18);
        c.font = F(17, 'normal'); c.fillStyle = '#b9f3ff'; c.fillText(s.boostShort, x + 58, y + 42); });
    });
  }
  function buildChef(par) {
    var root = new T.Group(); par.add(root);
    var skin = ph('#f1c7a5', 20), white = ph('#fbfbf7', 30), red = ph('#d62828', 40), dark = ph('#2b1b14', 30);
    var body = new T.Group(); root.add(body);
    add(body, cy(0.18, 0.2, 0.75, 16), ph('#3b3b4a', 15), 0, 0.37, 0);
    var torso = add(body, sp(0.36, 26), white, 0, 1.05, 0); torso.scale.set(1, 1.28, 0.86);
    add(body, sp(0.3, 22), ph('#f2f2ea', 20), 0, 0.82, 0.12).scale.set(1, 1, 0.5); // apron
    [0.95, 1.1, 1.25].forEach(function (y) { [-0.09, 0.09].forEach(function (x) { add(body, sp(0.025, 8), ph('#c9a227', 80), x, y, 0.3); }); });
    var sc = add(body, to(0.17, 0.05, 7, 20), red, 0, 1.43, 0.02); sc.rotation.x = Math.PI / 2; add(body, cn(0.07, 0.16, 12), red, 0.06, 1.33, 0.2).rotation.x = 0.4;
    function arm(sd) { var a = new T.Group(); a.position.set(sd * 0.38, 1.36, 0); body.add(a); add(a, cy(0.085, 0.075, 0.46, 12), white, 0, -0.23, 0); add(a, sp(0.08, 12), skin, 0, -0.5, 0); return a; }
    var aL = arm(-1), aR = arm(1);
    var spoon = new T.Group(); spoon.position.set(0, -0.55, 0.04); aR.add(spoon); add(spoon, cy(0.015, 0.015, 0.4, 8), ph('#8a5a2b', 30), 0, -0.05, 0.1).rotation.x = 1.2; add(spoon, sp(0.05, 10), ph('#8a5a2b', 30), 0, -0.13, 0.28).scale.set(1, 0.4, 1.3);
    var head = new T.Group(); head.position.set(0, 1.66, 0.02); body.add(head);
    add(head, sp(0.25, 26), skin, 0, 0.1, 0);
    add(head, sp(0.075, 14), ph('#e79a7c', 20), 0, 0.07, 0.25); // big friendly nose
    [-1, 1].forEach(function (sd) { add(head, sp(0.028, 10), ph('#111827', 90), sd * 0.09, 0.17, 0.22); add(head, sp(0.045, 10), ph('#ff9eb4', 10), sd * 0.15, 0.06, 0.19).scale.set(1, 0.6, 0.4); add(head, bx(0.09, 0.025, 0.03), dark, sd * 0.09, 0.24, 0.22).rotation.z = sd * -0.15; add(head, sp(0.07, 12), skin, sd * 0.25, 0.1, 0).scale.set(0.5, 1, 0.8); });
    var mus = new T.Group(); mus.position.set(0, 0.0, 0.24); head.add(mus);
    [-1, 1].forEach(function (sd) { var m = add(mus, sp(0.075, 14), dark, sd * 0.07, 0, 0); m.scale.set(1.4, 0.55, 0.6); m.rotation.z = sd * 0.3; add(mus, sp(0.03, 10), dark, sd * 0.16, 0.03, -0.01); }); // curly mustache
    add(head, to(0.04, 0.012, Math.PI, 14), ph('#7a2a2a', 20), 0, -0.07, 0.22).rotation.z = Math.PI; // smile
    // tall puffy chef hat
    add(head, cy(0.21, 0.23, 0.2, 24), white, 0, 0.36, -0.01);
    [[0, 0.58, 0], [-0.12, 0.54, 0.02], [0.12, 0.54, 0.02], [0, 0.55, -0.12], [0, 0.55, 0.11]].forEach(function (q) { add(head, sp(0.15, 18), white, q[0], q[1], q[2] - 0.01); });
    var bub = bubble(root, 2.65);
    chef = { root: root, body: body, head: head, aL: aL, aR: aR, mus: mus, bub: bub, mood: 0, cooking: 0 };
    return root;
  }
  function buildSnackBar() {
    var f = FC, x0 = -8.4, z0 = 23.1, g = prop('food', 'Snack Bar counter', x0, z0, 0);
    var red = ph('#d62828', 50), cream = ph('#fff1d6', 40), steel = chrome();
    add(g, bx(8.0, 1.0, 0.9), red, 0, 0.5, 0); add(g, bx(8.1, 0.08, 1.0), ph('#f8f8f2', 80), 0, 1.04, 0);
    for (var i = 0; i < 16; i++) add(g, bx(0.5, 0.9, 0.02), i % 2 ? cream : red, -3.75 + i * 0.5, 0.5, 0.455);
    add(g, bx(8.0, 0.06, 0.04), gl('#ffb347'), 0, 0.98, 0.47);
    // sneeze guard + warmers with snacks inside
    add(g, bx(3.4, 0.03, 0.5), new T.MeshPhongMaterial({ color: '#dff6ff', transparent: true, opacity: 0.35, shininess: 120 }), -1.2, 1.55, 0.05);
    [-2.8, 0.4].forEach(function (x) { add(g, cy(0.015, 0.015, 0.5, 6), steel, x, 1.3, 0.25); });
    [-2.4, -1.6, -0.8, 0].forEach(function (x, k) { add(g, bx(0.7, 0.08, 0.45), steel, x, 1.12, 0.0);
      if (k === 0) for (var n = 0; n < 4; n++) add(g, cy(0.05, 0.05, 0.4, 12), ph('#e8a24a', 30), x - 0.2 + n * 0.13, 1.2, 0.0).rotation.z = Math.PI / 2; // hot dogs / pretzels
      else if (k === 1) for (n = 0; n < 3; n++) { var pr = add(g, to(0.09, 0.03, 7, 16), ph('#9a5a1e', 40), x - 0.18 + n * 0.18, 1.2, 0); pr.rotation.x = -Math.PI / 2; }
      else if (k === 2) for (n = 0; n < 5; n++) add(g, sp(0.06, 10), ph('#f4c20d', 30), x - 0.24 + n * 0.12, 1.19, 0.02 * (n % 2)).scale.set(1, 0.5, 1); // nachos
      else { add(g, cy(0.22, 0.22, 0.02, 24), steel, x, 1.17, 0); pizzaMesh(g, 0.2, x, 1.19, 0); } });
    // cash register + tip jar + bell
    var reg0 = new T.Group(); reg0.position.set(2.3, 1.08, 0.05); g.add(reg0);
    add(reg0, bx(0.5, 0.18, 0.4), ph('#2b2f3a', 40), 0, 0.09, 0); add(reg0, bx(0.4, 0.26, 0.06), ph('#2b2f3a', 40), 0, 0.3, -0.12).rotation.x = -0.3; add(reg0, bx(0.34, 0.16, 0.01), gl('#4ade80'), 0, 0.31, -0.085).rotation.x = -0.3;
    for (var b = 0; b < 9; b++) add(reg0, bx(0.07, 0.03, 0.07), ph(b === 4 ? '#e23b3b' : '#e8e8e8', 30), -0.1 + (b % 3) * 0.1, 0.19, 0.03 + Math.floor(b / 3) * 0.08 - 0.06);
    add(g, cy(0.09, 0.08, 0.2, 16), new T.MeshPhongMaterial({ color: '#dff6ff', transparent: true, opacity: 0.5, shininess: 120 }), 3.1, 1.18, 0.1); add(g, cy(0.07, 0.07, 0.06, 12), gold(), 3.1, 1.13, 0.1);
    add(g, cy(0.08, 0.1, 0.03, 16), gold(), 1.5, 1.1, 0.25); add(g, sp(0.07, 14), gold(), 1.5, 1.14, 0.25).scale.set(1, 0.6, 1);
    // back counter: soda fountain + oven-side prep table + shelves of cups/boxes
    add(g, bx(7.6, 0.95, 0.7), ph('#a52020', 30), 0, 0.47, 2.2); add(g, bx(7.7, 0.05, 0.75), steel, 0, 0.97, 2.2);
    var sf = new T.Group(); sf.position.set(1.8, 1.0, 2.2); g.add(sf); add(sf, bx(1.2, 0.9, 0.5), ph('#2b2f3a', 50), 0, 0.45, 0); [0, 1, 2, 3].forEach(function (k) { add(sf, bx(0.22, 0.22, 0.02), gl(['#ff4f4f', '#ffd23f', '#3ff0ff', '#4ade80'][k]), -0.42 + k * 0.28, 0.7, -0.26); add(sf, cy(0.02, 0.02, 0.1, 8), steel, -0.42 + k * 0.28, 0.25, -0.24); });
    for (var s2 = 0; s2 < 5; s2++) add(g, cy(0.06, 0.045, 0.14, 12), ph('#ffffff', 20), -3.2 + s2 * 0.16, 1.07, 2.1);
    for (s2 = 0; s2 < 4; s2++) add(g, bx(0.55, 0.06, 0.55), ph('#e8d7b5', 10), -2.0, 1.03 + s2 * 0.065, 2.2); // pizza boxes
    pizzaMesh(g, 0.32, -0.6, 1.0, 2.2); // dough being prepped
    // little side gates so you can't walk behind the counter
    [-4.1, 4.1].forEach(function (x) { add(g, bx(0.12, 1.0, 2.4), red, x, 0.5, 1.4); add(g, bx(0.14, 0.06, 2.45), gl('#ffb347'), x, 1.02, 1.4); });
    // Chef Gio lives behind the counter
    var cr = buildChef(g); cr.position.set(-0.4, 0, 1.45); cr.rotation.y = 0; A.noAud(cr);
    reg(g, 'counter'); solidBox('Snack Bar counter', x0 - 4.2, x0 + 4.2, z0 - 0.5, f.maxZ);
    // menu board on the south wall above the back counter
    var mb = menuBoardTex(); wallSign('food', 'Snack Bar menu board', 5.6, 1.64, mb.tex, x0, 3.35, f.maxZ - 0.03, Math.PI);
    AR._menuTex = mb;
    inter({ id: 'fc_snack', kind: 'ar_snack', area: 'food', name: 'Snack Bar', col: '#ffb347', x: x0 - 1.2, z: z0 - 1.55, dir: [0, -1], r: 1.6, gw: 2.6 });
    inter({ id: 'fc_chef', kind: 'ar_chef', area: 'food', name: 'Chef Gio', col: '#4ade80', x: x0 + 2.4, z: z0 - 1.55, dir: [0, -1], r: 1.2 });
  }
  function buildOven() {
    var x0 = -14.6, z0 = 24.6, g = prop('food', 'Brick Pizza Oven', x0, z0, 0);
    var brick = ph('#b5522f', 15), brick2 = ph('#9a3f22', 15), stone = ph('#cfc6b8', 20);
    add(g, bx(2.7, 0.95, 2.2), stone, 0, 0.47, 0);
    for (var r = 0; r < 3; r++) for (var k = 0; k < 6; k++) add(g, bx(0.42, 0.26, 0.04), (r + k) % 2 ? brick : brick2, -1.05 + k * 0.42 + (r % 2) * 0.12, 0.17 + r * 0.29, 1.11);
    var dome = add(g, new T.SphereGeometry(1.15, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), brick, 0, 0.95, -0.05); void dome;
    // brick rings on the dome
    for (r = 1; r < 4; r++) { var tr = add(g, to(1.15 * Math.cos(r * 0.38), 0.025, 7, 36), brick2, 0, 0.95 + 1.15 * Math.sin(r * 0.38), -0.05); tr.rotation.x = Math.PI / 2; }
    // arched mouth with the fire inside
    add(g, to(0.48, 0.09, Math.PI, 24), stone, 0, 1.0, 1.05);
    add(g, bx(0.96, 0.5, 0.2), ph('#1a0b05', 5), 0, 1.22, 0.96);
    add(g, new T.CircleGeometry(0.47, 24, 0, Math.PI), ph('#1a0b05', 5), 0, 1.0, 1.06);
    var fire = new T.Group(); fire.position.set(0, 1.0, 0.7); g.add(fire); A.noAud(fire);
    var flames = []; for (var i = 0; i < 6; i++) { var fm = add(fire, cn(0.09 + (i % 2) * 0.04, 0.32 + (i % 3) * 0.08, 10), new T.MeshBasicMaterial({ color: i % 2 ? '#ffb020' : '#ff5a1f', transparent: true, opacity: 0.9 }), -0.3 + i * 0.12, 0.12, -0.1 * (i % 2)); flames.push(fm); }
    for (i = 0; i < 5; i++) add(fire, cy(0.04, 0.04, 0.4, 8), ph('#4a2a14', 10), -0.2 + i * 0.1, 0.03, -0.15).rotation.z = Math.PI / 2 + (i - 2) * 0.2;
    var fglow = glowSprite('#ff7a2a', 1.6, 0.7); fglow.position.set(0, 0.25, 0.25); fire.add(fglow);
    var flight = new T.PointLight('#ff8a3a', 0.9, 6, 2); flight.position.set(0, 1.2, 1.4); g.add(flight);
    // chimney + smoke puffs, pizza peel, PIZZA sign plate
    add(g, cy(0.18, 0.2, 1.4, 16), brick2, 0.3, 2.6, -0.5); add(g, cy(0.24, 0.24, 0.1, 16), stone, 0.3, 3.32, -0.5);
    var smoke = []; for (i = 0; i < 4; i++) { var sm = add(g, sp(0.16, 12), new T.MeshLambertMaterial({ color: '#d9d4cc', transparent: true, opacity: 0.4 }), 0.3, 3.5 + i * 0.3, -0.5); smoke.push(sm); A.noAud(sm); }
    var peel = new T.Group(); peel.position.set(1.2, 0, 1.0); g.add(peel); add(peel, cy(0.02, 0.02, 1.5, 8), ph('#8a5a2b', 30), 0, 0.85, 0).rotation.z = 0.12; add(peel, bx(0.36, 0.02, 0.4), ph('#b07a3e', 30), -0.09, 1.65, 0).rotation.set(1.45, 0, 0.12);
    var ps = cvs(512, 128, function (c, w, h) { c.fillStyle = '#2a0f08'; rr(c, 4, 4, w - 8, h - 8, 20); c.fill(); c.strokeStyle = '#ffd23f'; c.lineWidth = 6; c.stroke(); glowText(c, 'FORNO DI GIO', w / 2, h / 2, 60, '#ffd23f', w - 40); });
    var plate = texPlane(1.4, 0.35, ps.tex); plate.position.set(0, 2.25, 0.9); plate.rotation.x = -0.2; g.add(plate);
    // wood pile next to it
    var wp = prop('food', 'Oven wood pile', -17.15, 22.6, 0);
    for (var row = 0; row < 3; row++) for (var n = 0; n < 4 - row; n++) add(wp, cy(0.11, 0.11, 0.9, 12), ph(n % 2 ? '#7a4a24' : '#8f5a2c', 20), (n - (3 - row) / 2) * 0.23, 0.11 + row * 0.2, 0).rotation.x = Math.PI / 2;
    reg(wp, 'prop'); solidBox(wp.name, -17.75, -16.55, 22.1, 23.1);
    reg(g, 'booth'); solidBox(g.name, x0 - 1.4, x0 + 1.55, z0 - 1.2, FC.maxZ);
    oven = { g: g, flames: flames, fglow: fglow, flight: flight, smoke: smoke, boost: 0 };
    inter({ id: 'fc_oven', kind: 'ar_oven', area: 'food', name: 'Pizza Oven', col: '#ff7a2a', x: x0, z: z0 - 2.2, dir: [0, -1], r: 1.4 });
  }
  function swirlTex(col) { var c = A.mkCanvas(64, 128), g = c.getContext('2d'); g.fillStyle = col; g.fillRect(0, 0, 64, 128); g.globalAlpha = 0.35; g.fillStyle = '#ffffff'; for (var i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, i * 24); g.lineTo(64, i * 24 + 20); g.lineTo(64, i * 24 + 28); g.lineTo(0, i * 24 + 8); g.fill(); } var t = A.canvasTex(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
  function buildSlushie() {
    var x0 = -2.6, z0 = 25.4, g = prop('food', 'Slushie Machine', x0, z0, 0);
    add(g, bx(1.7, 0.95, 0.85), ph('#1d4ed8', 60), 0, 0.47, 0); add(g, bx(1.72, 0.06, 0.87), chrome(), 0, 0.97, 0);
    add(g, bx(1.4, 0.04, 0.3), ph('#9aa4b4', 60), 0, 1.0, 0.25); // drip tray
    var tanks = [];
    ['#ff3d6e', '#3ff0ff', '#a3ff3f'].forEach(function (col, i) { var x = -0.52 + i * 0.52;
      var tx = swirlTex(col); var liq = add(g, cy(0.2, 0.2, 0.62, 24), new T.MeshPhongMaterial({ map: tx, emissive: new T.Color(col).multiplyScalar(0.35), shininess: 60 }), x, 1.38, -0.05);
      add(g, cy(0.235, 0.235, 0.8, 24, 1, true), new T.MeshPhongMaterial({ color: '#e8fbff', transparent: true, opacity: 0.28, shininess: 140, side: T.DoubleSide }), x, 1.43, -0.05);
      add(g, cy(0.25, 0.25, 0.1, 24), chrome(), x, 1.86, -0.05); add(g, bx(0.12, 0.14, 0.12), ph('#e8e8e8', 40), x, 1.08, 0.18); add(g, bx(0.05, 0.16, 0.03), ph(col, 40), x, 1.16, 0.25).rotation.x = -0.4;
      tanks.push({ liq: liq, tex: tx, k: 0.6 + i * 0.25 }); });
    var ss = cvs(512, 128, function (c, w, h) { var gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#ff3d6e'); gr.addColorStop(0.5, '#3ff0ff'); gr.addColorStop(1, '#a3ff3f'); c.fillStyle = '#0b1640'; rr(c, 4, 4, w - 8, h - 8, 22); c.fill(); c.strokeStyle = gr; c.lineWidth = 7; c.stroke(); glowText(c, 'TURBO SLUSHIE', w / 2, h / 2, 62, '#bff8ff', w - 40); });
    var sgn = texPlane(1.6, 0.4, ss.tex); sgn.position.set(0, 2.18, 0.0); g.add(sgn);
    for (var i = 0; i < 4; i++) add(g, cy(0.06, 0.045, 0.14, 12), ph(['#ff3d6e', '#3ff0ff', '#a3ff3f', '#ffd23f'][i], 30), 0.95, 0.07 + i * 0.12, 0.25); // stacked cups on the floor stand
    reg(g, 'booth'); solidBox(g.name, x0 - 0.9, x0 + 1.1, z0 - 0.5, FC.maxZ);
    slush = { tanks: tanks };
    inter({ id: 'fc_slushie', kind: 'ar_slushie', area: 'food', name: 'Turbo Slushie', col: '#3ff0ff', x: x0, z: z0 - 1.6, dir: [0, -1], r: 1.2 });
    // ice cream freezer with a giant cone on top
    var x1 = 0.35, z1 = 25.2, f = prop('food', 'Ice Cream Freezer', x1, z1, 0);
    add(f, bx(1.5, 0.95, 0.95), ph('#ffffff', 50), 0, 0.47, 0); for (i = 0; i < 6; i++) add(f, bx(0.24, 0.94, 0.01), ph(i % 2 ? '#ff8fd0' : '#ffffff', 30), -0.6 + i * 0.24, 0.47, 0.48);
    add(f, bx(1.4, 0.04, 0.85), new T.MeshPhongMaterial({ color: '#dff6ff', transparent: true, opacity: 0.35, shininess: 140 }), 0, 0.98, 0);
    ['#ff8fd0', '#fff1c4', '#7a4a2a', '#a3ff3f', '#ffb347', '#c4b5fd'].forEach(function (col, k) { add(f, bx(0.38, 0.12, 0.3), ph(col, 20), -0.45 + (k % 3) * 0.45, 0.88, -0.17 + Math.floor(k / 3) * 0.36); add(f, sp(0.12, 12), ph(col, 20), -0.45 + (k % 3) * 0.45, 0.93, -0.17 + Math.floor(k / 3) * 0.36).scale.set(1.3, 0.4, 1); });
    var cone = new T.Group(); cone.position.set(0, 1.0, -0.15); f.add(cone);
    var cc = add(cone, cn(0.22, 0.7, 20), ph('#e0a458', 20), 0, 0.42, 0); cc.rotation.x = Math.PI;
    add(cone, sp(0.25, 22), ph('#ff8fd0', 40), 0, 0.85, 0); add(cone, sp(0.21, 22), ph('#fff1c4', 40), 0, 1.15, 0); add(cone, sp(0.08, 12), ph('#e23b3b', 80), 0, 1.38, 0);
    for (i = 0; i < 8; i++) add(cone, bx(0.05, 0.015, 0.015), ph(['#3ff0ff', '#ffd23f', '#4ade80', '#ff4fd8'][i % 4], 20), Math.cos(i) * 0.2, 0.92 + (i % 3) * 0.1, Math.sin(i) * 0.2).rotation.y = i;
    reg(f, 'booth'); solidBox(f.name, x1 - 0.8, x1 + 0.8, z1 - 0.55, FC.maxZ);
    slush.cone = cone;
    inter({ id: 'fc_icecream', kind: 'ar_icecream', area: 'food', name: 'Ice Cream', col: '#ff8fd0', x: x1 - 0.1, z: z1 - 1.55, dir: [0, -1], r: 1.1 });
  }
  /* elevator + stairs up to the roof, on the west wall */
  var ELEV = {};
  function elevatorTex(floor, up) { return cvs(256, 96, function (c, w, h) { c.fillStyle = '#05020c'; c.fillRect(0, 0, w, h); c.fillStyle = '#ff3d3d'; c.font = 'bold 64px "Courier New",monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#ff3d3d'; c.shadowBlur = 12; c.fillText((up ? '\u25B2 ' : '') + floor, w / 2, h / 2 + 4); }); }
  function buildElevator(area, x, z, rotY, floorLbl, name, id, target) {
    var g = prop(area, name, x, z, rotY);
    var steel = chrome(), frame = ph('#3a3f4a', 70);
    add(g, bx(2.2, 3.3, 0.4), frame, 0, 1.65, 0.2);
    var dl = add(g, bx(0.78, 2.6, 0.06), steel, -0.4, 1.32, 0.42), dr = add(g, bx(0.78, 2.6, 0.06), steel, 0.4, 1.32, 0.42);
    add(g, bx(0.02, 2.6, 0.07), ph('#111111', 10), 0, 1.32, 0.43);
    add(g, bx(1.9, 0.08, 0.1), gl('#3ff0ff'), 0, 2.72, 0.42);
    var ind = elevatorTex(floorLbl, true); var ip = texPlane(0.7, 0.26, ind.tex); ip.position.set(0, 3.0, 0.405); g.add(ip);
    var btn = new T.Group(); btn.position.set(0.85, 1.25, 0.4); g.add(btn); add(btn, bx(0.18, 0.4, 0.04), steel, 0, 0, 0); var b1 = add(btn, cy(0.045, 0.045, 0.03, 16), gl('#ffe14d'), 0, 0.08, 0.03); b1.rotation.x = Math.PI / 2; var b2 = add(btn, cy(0.045, 0.045, 0.03, 16), ph('#d0d6e0', 80), 0, -0.08, 0.03); b2.rotation.x = Math.PI / 2;
    reg(g, 'booth'); solidOf(g, 0.02);
    var dir = [Math.sin(rotY), Math.cos(rotY)];
    var cab = inter({ id: id, kind: 'ar_elevator', area: area, name: name, col: '#3ff0ff', x: x + dir[0] * 1.5, z: z + dir[1] * 1.5, dir: dir, r: 1.3, data: { target: target } });
    ELEV[id] = { dl: dl, dr: dr, open: 0, want: 0, ind: ind, cab: cab };
    return g;
  }
  function stairDoor(area, x, z, rotY, label, name, id, target, col) {
    var g = prop(area, name, x, z, rotY);
    add(g, bx(1.5, 2.6, 0.2), ph('#4a3426', 30), 0, 1.3, 0.1); add(g, bx(1.2, 2.3, 0.06), ph(col || '#2f6b3a', 40), 0, 1.15, 0.22);
    add(g, bx(0.5, 0.06, 0.03), chrome(), 0.2, 1.1, 0.27); add(g, bx(0.9, 0.5, 0.02), new T.MeshPhongMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.5, shininess: 140 }), 0, 1.75, 0.26);
    var es = cvs(512, 160, function (c, w, h) { c.fillStyle = '#0d5f2c'; rr(c, 4, 4, w - 8, h - 8, 18); c.fill(); c.strokeStyle = '#e8fff0'; c.lineWidth = 6; c.stroke(); glowText(c, label, w / 2, h / 2, 64, '#e8fff0', w - 40); });
    var ep = texPlane(1.3, 0.4, es.tex); ep.position.set(0, 2.85, 0.22); g.add(ep);
    reg(g, 'booth'); solidOf(g, 0.02);
    var dir = [Math.sin(rotY), Math.cos(rotY)];
    return inter({ id: id, kind: 'ar_stairs', area: area, name: name, col: '#4ade80', x: x + dir[0] * 1.3, z: z + dir[1] * 1.3, dir: dir, r: 1.1, data: { target: target } });
  }
  /* the locked basement door (east wall of the food court) */
  var BDOOR = {};
  function buildBasementDoor() {
    var x0 = FC.maxX, z0 = 15.0, g = prop('food', 'Basement door', x0, z0, -Math.PI / 2);
    add(g, bx(1.7, 2.9, 0.12), ph('#2b2f3a', 60), 0, 1.45, 0.06);
    add(g, bx(1.3, 2.5, 0.08), ph('#556070', 70), 0, 1.27, 0.15);
    for (var i = 0; i < 6; i++) add(g, sp(0.03, 8), chrome(), -0.55 + (i % 2) * 1.1, 0.3 + Math.floor(i / 2) * 1.0, 0.2);
    var st = cvs(512, 256, function (c, w, h) { c.fillStyle = '#ffd23f'; c.fillRect(0, 0, w, h); for (var k = -4; k < 12; k++) { c.fillStyle = '#111'; c.beginPath(); c.moveTo(k * 48, 0); c.lineTo(k * 48 + 24, 0); c.lineTo(k * 48 - 40, h); c.lineTo(k * 48 - 64, h); c.fill(); } c.fillStyle = '#111'; rr(c, 30, 50, w - 60, h - 100, 14); c.fill(); c.fillStyle = '#ffd23f'; c.font = F(64); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('STAFF ONLY', w / 2, h / 2 - 24); c.font = F(40); c.fillStyle = '#fff'; c.fillText('BASEMENT \u2193', w / 2, h / 2 + 30); });
    var sp0 = texPlane(1.1, 0.55, st.tex); sp0.position.set(0, 2.0, 0.2); g.add(sp0);
    // chains + padlock (light turns green when you're allowed in)
    var chains = new T.Group(); g.add(chains);
    [-1, 1].forEach(function (sd) { for (var k = 0; k < 7; k++) { var l = add(chains, to(0.05, 0.014, 7, 12), chrome(), sd * (0.08 + k * 0.08), 1.25 + k * 0.08 * -sd * 0.0 + Math.abs(k - 3) * 0.02, 0.24); l.rotation.y = k % 2 ? Math.PI / 2 : 0; l.rotation.z = sd * 0.4; } });
    var lock = new T.Group(); lock.position.set(0, 1.12, 0.27); g.add(lock); add(lock, bx(0.22, 0.2, 0.08), gold(), 0, 0, 0); add(lock, to(0.07, 0.018, Math.PI, 14), chrome(), 0, 0.1, 0); add(lock, cy(0.02, 0.02, 0.02, 10), ph('#111', 10), 0, -0.02, 0.045).rotation.x = Math.PI / 2;
    var lamp = add(g, sp(0.07, 12), new T.MeshBasicMaterial({ color: '#ff3d3d' }), 0.7, 2.75, 0.2); var lg = glowSprite('#ff3d3d', 0.7, 0.8); lg.position.copy(lamp.position); g.add(lg);
    // Gus's sticky note
    var nt = cvs(256, 256, function (c, w, h) { c.fillStyle = '#fff59a'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a2216'; c.font = F(34); c.textAlign = 'center'; c.fillText('DO NOT', w / 2, 70); c.fillText('ENTER.', w / 2, 112); c.font = F(26, 'italic bold'); c.fillText('(I lost the', w / 2, 160); c.fillText('key again)', w / 2, 192); c.fillText('- G', w / 2, 228); });
    var np = texPlane(0.32, 0.32, nt.tex); np.position.set(0.42, 1.55, 0.2); np.rotation.z = 0.12; g.add(np);
    reg(g, 'booth'); solidOf(g, 0.02);
    BDOOR = { g: g, lamp: lamp, lg: lg, chains: chains, lock: lock };
    inter({ id: 'fc_basement', kind: 'ar_bdoor', area: 'food', name: 'STAFF ONLY: Basement', col: '#ffd23f', x: x0 - 1.4, z: z0, dir: [-1, 0], r: 1.3 });
  }
  function plant(area, name, x, z, big) {
    var g = prop(area, name, x, z, 0), s = big ? 1.3 : 1;
    add(g, cy(0.3 * s, 0.24 * s, 0.55 * s, 18), ph('#d97706', 30), 0, 0.28 * s, 0); add(g, to(0.3 * s, 0.03, 7, 24), ph('#fff1d6', 30), 0, 0.55 * s, 0).rotation.x = Math.PI / 2;
    for (var k = 0; k < 8; k++) { var lf = add(g, sp(0.17 * s, 12), ph(k % 2 ? '#2f9e44' : '#3fbf5a', 20), Math.cos(k) * 0.16 * s, (0.8 + (k % 3) * 0.12) * s, Math.sin(k) * 0.13 * s); lf.scale.set(0.6, 1.7, 0.6); lf.rotation.set(Math.cos(k) * 0.5, 0, Math.sin(k) * 0.5); }
    reg(g, 'plant'); solidBox(name, x - 0.32 * s, x + 0.32 * s, z - 0.32 * s, z + 0.32 * s); return g;
  }
  function buildFoodDecor() {
    plant('food', 'Food Court plant NW', -17.3, 13.1); plant('food', 'Food Court plant NE', 1.0, 13.1); plant('food', 'Food Court plant E', 1.0, 21.4);
    // recycling + trash bins
    var tb = prop('food', 'Food Court bins', 1.0, 18.4, -Math.PI / 2);
    [['#2f6b3a', -0.3], ['#1d4ed8', 0.3]].forEach(function (q) { add(tb, cy(0.26, 0.24, 0.9, 20), ph(q[0], 40), q[1], 0.45, 0); add(tb, cy(0.28, 0.28, 0.08, 20), ph('#e8e8e8', 40), q[1], 0.93, 0); add(tb, bx(0.2, 0.03, 0.06), ph('#111', 10), q[1], 0.98, 0); });
    reg(tb, 'prop'); solidBox(tb.name, 0.65, 1.35, 17.75, 19.05);
    // chalkboard easel: today's special
    var ez = prop('food', 'Today\u2019s Special easel', -9.3, 13.3, 0.25);
    [-1, 1].forEach(function (sd) { var l = add(ez, bx(0.05, 1.5, 0.05), ph('#8a5a2b', 30), sd * 0.35, 0.72, 0); l.rotation.z = -sd * 0.1; }); var bl = add(ez, bx(0.05, 1.5, 0.05), ph('#8a5a2b', 30), 0, 0.72, -0.3); bl.rotation.x = -0.3;
    var cb = cvs(256, 320, function (c, w, h) { c.fillStyle = '#2b3a2e'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a5a2b'; c.lineWidth = 16; c.strokeRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = F(30); c.textAlign = 'center'; c.fillText('TODAY\u2019S', w / 2, 52); c.fillText('SPECIAL', w / 2, 86); c.font = '60px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.fillText('\uD83C\uDF55', w / 2, 160); c.font = F(22); c.fillStyle = '#ffd23f'; c.fillText('Help Chef Gio', w / 2, 220); c.fillText('cook = earn', w / 2, 248); c.fillText('\uD83E\uDE99 coins!', w / 2, 276); });
    AR._special = cb; var cp = texPlane(0.66, 0.84, cb.tex); cp.position.set(0, 1.0, 0.04); cp.rotation.x = -0.1; ez.add(cp);
    reg(ez, 'prop'); solidBox(ez.name, -9.75, -8.85, 12.95, 13.6);
    // elevator + stairs on the west wall, basement door on the east wall
    buildElevator('food', FC.minX, 17.0, Math.PI / 2, '1', 'Elevator to the Rooftop', 'fc_elevator', 'roof');
    stairDoor('food', FC.minX, 20.6, Math.PI / 2, 'STAIRS \u2191 ROOF', 'Stairs to the Rooftop', 'fc_stairs', 'roof');
    var rs = cvs(512, 320, function (c, w, h) { c.fillStyle = '#140a2b'; rr(c, 4, 4, w - 8, h - 8, 26); c.fill(); c.strokeStyle = '#ff4fd8'; c.lineWidth = 8; c.stroke(); glowText(c, '\u2B06 ROOFTOP', w / 2, 80, 80, '#ff4fd8', w - 40); glowText(c, 'PARTY DECK', w / 2, 160, 66, '#3ff0ff', w - 40); c.font = F(30); c.fillStyle = '#ffe14d'; c.textAlign = 'center'; c.fillText('DJ \u00b7 dance \u00b7 fireworks', w / 2, 236); c.fillText('Party Night: Fri & Sat!', w / 2, 278); });
    wallSign('food', 'ROOFTOP sign', 1.4, 0.875, rs.tex, FC.minX + 0.03, 2.9, 18.97, Math.PI / 2);
    buildBasementDoor();
  }
  function buildFoodCourt() {
    FC = A.FOOD; mkRoot('food');
    buildFoodShell(); buildFoodDoor(); buildTables(); buildSnackBar(); buildOven(); buildSlushie(); buildFoodDecor();
    ANIM.food.push(function (t, dt) {
      // oven fire flicker (roars while you cook), smoke puffs
      var k = 1 + oven.boost * 0.8; oven.flames.forEach(function (f, i) { f.scale.set(1, (0.75 + Math.abs(Math.sin(t * (7 + i) + i)) * 0.6) * k, 1); f.rotation.z = Math.sin(t * 5 + i) * 0.15; });
      oven.fglow.material.opacity = 0.5 + Math.sin(t * 13) * 0.1 + oven.boost * 0.3; oven.flight.intensity = 0.8 + Math.sin(t * 11) * 0.15 + oven.boost * 0.6;
      oven.smoke.forEach(function (s, i) { var q = (t * 0.25 + i / 4) % 1; s.position.y = 3.4 + q * 1.3; s.position.x = 0.3 + Math.sin(q * 6 + i) * 0.15; s.scale.setScalar(0.6 + q * 1.2); s.material.opacity = 0.45 * (1 - q); });
      oven.boost = Math.max(0, oven.boost - dt * 0.3);
      slush.tanks.forEach(function (tk) { tk.tex.offset.y = (t * tk.k * 0.25) % 1; tk.liq.rotation.y = t * tk.k; });
      slush.cone.rotation.y = t * 0.8; slush.cone.position.y = 1.0 + Math.sin(t * 2) * 0.03;
      // Chef Gio: stirs, looks at you, waves at the oven while you cook
      if (chef.root) {
        var p = A.pose(), wp = chef.root.getWorldPosition(new T.Vector3()), dx = p.x - wp.x, dz = p.z - wp.z, d = Math.hypot(dx, dz);
        var want = chef.cooking > 0 ? -1.2 : d < 8 ? Math.max(-0.9, Math.min(0.9, Math.atan2(dx, dz))) : Math.sin(t * 0.5) * 0.3;
        chef.body.rotation.y += (want - chef.body.rotation.y) * Math.min(1, dt * 3);
        chef.aR.rotation.x = -0.9 + Math.sin(t * (chef.cooking > 0 ? 9 : 3)) * 0.35; chef.aR.rotation.z = -0.2;
        chef.aL.rotation.x = chef.bub.left > 0 ? -1.4 + Math.sin(t * 8) * 0.3 : -0.3; chef.aL.rotation.z = chef.bub.left > 0 ? 0.6 : 0.2;
        chef.body.position.y = Math.abs(Math.sin(t * 2)) * 0.015; chef.mus.rotation.z = chef.bub.left > 0 ? Math.sin(t * 14) * 0.08 : 0;
        chef.cooking = Math.max(0, chef.cooking - dt); chef.bub.tick(dt);
      }
      // basement door light: red = locked, green = open for you this week
      var open = AR.unlocked(); if (open !== BDOOR.open) { BDOOR.open = open; var col = open ? '#4ade80' : '#ff3d3d'; BDOOR.lamp.material.color.set(col); BDOOR.lg.material.color.set(col); BDOOR.chains.visible = !open; BDOOR.lock.visible = !open; }
      BDOOR.lg.material.opacity = 0.6 + Math.sin(t * 4) * 0.25;
    });
  }
  AR.chefSay = function (s, secs) { if (chef.bub) chef.bub.say(s, secs || 4); };
  AR.chefCook = function (secs) { chef.cooking = secs || 3; oven.boost = 1; };
  AR.chefLine = function () { return chef.bub && chef.bub.left > 0 ? chef.bub.line : null; };

  /* =====================================================================================================
     2) ROOFTOP PARTY DECK  (x -14..14, z -124..-95; the elevator drops you at the south edge facing the DJ)
     ===================================================================================================== */
  var dj = {}, dance = {}, disco = {}, FW = {}, sched = {}, skyline = {};
  function plankTex() { var c = A.mkCanvas(256, 256), g = c.getContext('2d'); for (var i = 0; i < 8; i++) { g.fillStyle = ['#6b4a32', '#5e412c', '#735036', '#664630'][i % 4]; g.fillRect(0, i * 32, 256, 32); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, i * 32 + 30, 256, 2); var off = (i * 97) % 256; g.fillRect(off, i * 32, 2, 32); } var t = A.canvasTex(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
  function windowTex(seed) { var c = A.mkCanvas(64, 128), g = c.getContext('2d'); g.fillStyle = '#0d0a24'; g.fillRect(0, 0, 64, 128); var r = seed; function rnd() { r = (r * 9301 + 49297) % 233280; return r / 233280; }
    for (var y = 4; y < 124; y += 8) for (var x = 4; x < 60; x += 8) { if (rnd() < 0.42) { g.fillStyle = ['#ffe9a8', '#fff3d1', '#9be7ff', '#ffb3e6'][Math.floor(rnd() * 4)]; g.globalAlpha = 0.5 + rnd() * 0.5; g.fillRect(x, y, 5, 5); } } g.globalAlpha = 1; var t = A.canvasTex(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
  function skyTex() { var c = A.mkCanvas(1024, 512), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#05021a'); gr.addColorStop(0.45, '#1a0b45'); gr.addColorStop(0.62, '#3b1466'); gr.addColorStop(0.72, '#ff5aa8'); gr.addColorStop(0.8, '#2a0e4a'); gr.addColorStop(1, '#0a0420'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
    for (var i = 0; i < 420; i++) { var y = Math.random() * 300, a = Math.random(); g.fillStyle = 'rgba(255,255,255,' + (0.3 + a * 0.7) + ')'; var s2 = a > 0.93 ? 2.4 : 1.2; g.fillRect(Math.random() * 1024, y, s2, s2); }
    g.globalAlpha = 0.18; for (i = 0; i < 3; i++) { var cg = g.createRadialGradient(200 + i * 300, 120 + i * 30, 10, 200 + i * 300, 120 + i * 30, 160); cg.addColorStop(0, '#b06bff'); cg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = cg; g.fillRect(0, 0, 1024, 512); } g.globalAlpha = 1;
    return A.canvasTex(c); }
  function buildSky() {
    var r = R.roof, cx = ROOF.cx, cz = ROOF.cz;
    var dome = add(r, new T.SphereGeometry(62, 40, 20), new T.MeshBasicMaterial({ map: skyTex(), side: T.BackSide, fog: false, depthWrite: false }), cx, -6, cz); dome.renderOrder = -5; A.noAud(dome);
    var moon = add(r, new T.CircleGeometry(3.2, 40), new T.MeshBasicMaterial({ color: '#fff6d8', fog: false }), cx - 24, 30, cz - 42); moon.lookAt(cx, 0, cz); A.noAud(moon);
    var mh = glowSprite('#fff1c4', 16, 0.35); mh.material.fog = false; mh.position.copy(moon.position); r.add(mh);
    // skyline: a ring of towers with lit windows, beacons, a ferris wheel and two sweeping searchlights
    var city = new T.Group(); city.name = 'city skyline'; r.add(city); A.noAud(city); skyline.beacons = []; skyline.city = city;
    var wt = [windowTex(7), windowTex(19), windowTex(31), windowTex(43)];
    for (var i = 0; i < 46; i++) {
      var a = i / 46 * Math.PI * 2 + (i % 3) * 0.03, d = 36 + (i * 37 % 17), w = 4 + (i * 13 % 5), hgt = 14 + (i * 29 % 30), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      var t2 = wt[i % 4].clone(); t2.needsUpdate = true; t2.repeat.set(w / 4, hgt / 8);
      var b = add(city, bx(w, hgt + 30, w), new T.MeshBasicMaterial({ map: t2, fog: false }), x, -30 + (hgt + 30) / 2 - 8, z); b.rotation.y = -a;
      add(city, bx(w + 0.2, 0.4, w + 0.2), nofog(['#ff4fd8', '#3ff0ff', '#ffe14d', '#4ade80'][i % 4]), x, hgt - 8 + 0.2, z).rotation.y = -a;
      if (i % 4 === 0) { var bc = add(city, sp(0.35, 8), new T.MeshBasicMaterial({ color: '#ff3d3d', fog: false }), x, hgt - 8 + 2.5, z); add(city, cy(0.08, 0.08, 2.4, 6), nofog('#555a66'), x, hgt - 8 + 1.2, z); skyline.beacons.push(bc); }
    }
    // ferris wheel far away
    var fw = new T.Group(); fw.position.set(cx - 30, 4, cz - 40); fw.lookAt(cx, 4, cz); city.add(fw); var wheel = new T.Group(); fw.add(wheel);
    add(wheel, to(9, 0.15, 7, 64), nofog('#ff4fd8'), 0, 0, 0); add(wheel, to(6, 0.08, 7, 48), nofog('#3ff0ff'), 0, 0, 0);
    for (i = 0; i < 12; i++) { var sp2 = add(wheel, bx(0.1, 18, 0.1), nofog('#c4b5fd'), 0, 0, 0); sp2.rotation.z = i * Math.PI / 12; var cab = add(wheel, sp(0.6, 10), nofog(['#ffe14d', '#4ade80', '#ff8fd0', '#3ff0ff'][i % 4]), Math.cos(i * Math.PI / 6) * 9, Math.sin(i * Math.PI / 6) * 9, 0); void cab; }
    [-1, 1].forEach(function (sd) { var lg2 = add(fw, bx(0.3, 14, 0.3), nofog('#6d5aa8'), sd * 3, -6, 0); lg2.rotation.z = sd * 0.25; });
    skyline.wheel = wheel;
    skyline.beams = [];
    [[-20, -26], [24, 22]].forEach(function (q, k) { var bm = new T.Mesh(new T.ConeGeometry(2.2, 60, 20, 1, true), new T.MeshBasicMaterial({ color: k ? '#9be7ff' : '#ffb3e6', transparent: true, opacity: 0.09, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false }));
      bm.geometry.translate(0, -30, 0); var piv = new T.Group(); piv.position.set(cx + q[0], -10, cz + q[1] - 30); city.add(piv); piv.add(bm); bm.rotation.x = Math.PI; skyline.beams.push(piv); });
  }
  function buildDeck() {
    var r = R.roof, W = ROOF.maxX - ROOF.minX, D = ROOF.maxZ - ROOF.minZ, cx = (ROOF.minX + ROOF.maxX) / 2, cz = (ROOF.minZ + ROOF.maxZ) / 2;
    var pt = plankTex(); pt.repeat.set(W / 3, D / 3);
    var fl = add(r, new T.PlaneGeometry(W, D), new T.MeshPhongMaterial({ map: pt, shininess: 20 }), cx, 0, cz); fl.rotation.x = -Math.PI / 2;
    add(r, bx(W + 0.6, 0.5, D + 0.6), ph('#2a1f3a', 10), cx, -0.26, cz); // roof slab edge
    // glass railings with chrome top rail + posts (solid for walking; low for the camera)
    var glass = new T.MeshPhongMaterial({ color: '#bfe9ff', transparent: true, opacity: 0.22, shininess: 140, side: T.DoubleSide });
    var rail = new T.Group(); rail.name = 'roof railing'; r.add(rail); A.noAud(rail);
    function side(x0, z0, x1, z1) { var len = Math.hypot(x1 - x0, z1 - z0), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, ang = Math.atan2(x1 - x0, z1 - z0);
      var gp = add(rail, new T.PlaneGeometry(len, 1.0), glass, mx, 0.55, mz); gp.rotation.y = ang + Math.PI / 2;
      var tr = add(rail, bx(0.1, 0.08, len), chrome(), mx, 1.1, mz); tr.rotation.y = ang; var nl = add(rail, bx(0.05, 0.05, len), gl('#ff4fd8'), mx, 0.04, mz); nl.rotation.y = ang;
      for (var k = 0; k <= Math.floor(len / 2); k++) { var q = k / Math.floor(len / 2); add(rail, cy(0.04, 0.04, 1.1, 8), chrome(), x0 + (x1 - x0) * q, 0.55, z0 + (z1 - z0) * q); } }
    var e = 0.15; side(ROOF.minX + e, ROOF.minZ + e, ROOF.maxX - e, ROOF.minZ + e); side(ROOF.minX + e, ROOF.minZ + e, ROOF.minX + e, ROOF.maxZ - e); side(ROOF.maxX - e, ROOF.minZ + e, ROOF.maxX - e, ROOF.maxZ - e);
    side(ROOF.minX + e, ROOF.maxZ - e, -2.0, ROOF.maxZ - e); side(6.2, ROOF.maxZ - e, ROOF.maxX - e, ROOF.maxZ - e);
    function rw(minX, maxX, minZ, maxZ) { A.addSolid(minX, maxX, minZ, maxZ, 'wall'); A.walls.push({ minX: minX, maxX: maxX, minY: -1, maxY: 1.2, minZ: minZ, maxZ: maxZ }); }
    rw(ROOF.minX - 1, ROOF.maxX + 1, ROOF.minZ - 1, ROOF.minZ + 0.2); rw(ROOF.minX - 1, ROOF.maxX + 1, ROOF.maxZ - 0.2, ROOF.maxZ + 1); rw(ROOF.minX - 1, ROOF.minX + 0.2, ROOF.minZ - 1, ROOF.maxZ + 1); rw(ROOF.maxX - 0.2, ROOF.maxX + 1, ROOF.minZ - 1, ROOF.maxZ + 1);
    // elevator + stairs huts at the south edge
    var hut = prop('roof', 'Elevator hut', 2.1, -95.2, 0);
    add(hut, bx(9.6, 4.6, 0.4), ph('#3b2370', 20), 0, 2.3, 0); add(hut, bx(9.7, 0.15, 0.42), gl('#3ff0ff'), 0, 4.65, 0); add(hut, bx(9.7, 0.08, 0.41), gl('#ff4fd8'), 0, 0.05, 0);
    reg(hut, 'booth'); solidBox(hut.name, -2.7, 6.9, -95.36, -95);
    buildElevator('roof', 0, -95.4, Math.PI, 'R', 'Elevator down to the Food Court', 'rf_elevator', 'food');
    stairDoor('roof', 4.4, -95.4, Math.PI, 'STAIRS \u2193 FOOD', 'Stairs down to the Food Court', 'rf_stairs', 'food', '#6b2f6b');
    var welcome = cvs(1024, 256, function (c, w, h) { c.fillStyle = '#140a2b'; rr(c, 4, 4, w - 8, h - 8, 30); c.fill(); c.strokeStyle = '#ff4fd8'; c.lineWidth = 8; c.stroke(); glowText(c, 'ROOFTOP PARTY DECK', w / 2, 100, 100, '#ffe14d', w - 60); c.font = F(42); c.fillStyle = '#9be7ff'; c.textAlign = 'center'; c.fillText('DJ \u00b7 dance floor \u00b7 fireworks \u00b7 party night', w / 2, 196); });
    var wm = texPlane(4.4, 1.1, welcome.tex); hut.add(wm); wm.position.set(0, 3.88, -0.22); wm.rotation.y = Math.PI;
  }
  function speaker(par, x, z, s) { var g = new T.Group(); g.position.set(x, 0, z); par.add(g); var cones = [];
    add(g, bx(0.9 * s, 1.0 * s, 0.7 * s), ph('#16121f', 30), 0, 0.5 * s, 0); add(g, bx(0.75 * s, 0.85 * s, 0.6 * s), ph('#16121f', 30), 0, 1.45 * s, 0);
    [[0, 0.5, 0.36], [0, 1.6, 0.31], [0, 1.25, 0.31]].forEach(function (q, i) { var rad = (i === 0 ? 0.33 : i === 1 ? 0.13 : 0.22) * s; var c1 = add(g, to(rad, 0.03 * s, 7, 24), chrome(), q[0], q[1] * s, q[2] * s); var c2 = add(g, cn(rad * 0.95, 0.12 * s, 24), ph('#2a2a33', 20), q[0], q[1] * s, q[2] * s - 0.03); c2.rotation.x = -Math.PI / 2; cones.push(c2); void c1; });
    add(g, bx(0.92 * s, 0.04, 0.72 * s), gl('#3ff0ff'), 0, 0.98 * s, 0); return { g: g, cones: cones }; }
  function buildDJ() {
    var g = prop('roof', 'DJ Booth', 0, -120.5, 0);
    // booth desk with a glowing front panel
    add(g, bx(3.6, 1.05, 1.0), ph('#1b1530', 40), 0, 0.52, 0); add(g, bx(3.7, 0.06, 1.1), chrome(), 0, 1.08, 0);
    var fp = cvs(1024, 256); dj.front = fp; var fpm = texPlane(3.5, 0.9, fp.tex); fpm.position.set(0, 0.52, 0.505); g.add(fpm);
    // turntables + mixer + laptop
    dj.plats = [];
    [-1.1, 1.1].forEach(function (x) { add(g, bx(0.9, 0.08, 0.7), ph('#2b2b36', 60), x, 1.15, 0.0); var pl = add(g, cy(0.3, 0.3, 0.03, 32), ph('#111111', 90), x - 0.08, 1.2, 0.0); var lbl = add(pl, cy(0.1, 0.1, 0.035, 20), ph('#ff4fd8', 40), 0, 0, 0); void lbl; add(g, bx(0.04, 0.03, 0.36), chrome(), x + 0.28, 1.22, 0.05).rotation.y = 0.4; dj.plats.push(pl); });
    var mx = new T.Group(); mx.position.set(0, 1.12, 0.05); g.add(mx); add(mx, bx(0.8, 0.1, 0.6), ph('#2b2b36', 60), 0, 0.05, 0);
    dj.sliders = []; for (var i = 0; i < 5; i++) { add(mx, bx(0.03, 0.01, 0.34), ph('#111', 10), -0.28 + i * 0.14, 0.105, 0.04); dj.sliders.push(add(mx, bx(0.07, 0.04, 0.05), gl(['#3ff0ff', '#ff4fd8', '#ffe14d', '#4ade80', '#ff7a3d'][i]), -0.28 + i * 0.14, 0.12, 0.04)); }
    dj.leds = []; for (i = 0; i < 8; i++) dj.leds.push(add(mx, sp(0.02, 8), new T.MeshBasicMaterial({ color: '#4ade80' }), -0.3 + i * 0.085, 0.11, -0.22));
    var lap = new T.Group(); lap.position.set(1.55, 1.1, -0.2); lap.rotation.y = -0.4; g.add(lap); add(lap, bx(0.5, 0.02, 0.36), chrome(), 0, 0.01, 0); var scr = add(lap, bx(0.5, 0.34, 0.02), chrome(), 0, 0.18, -0.18); scr.rotation.x = -0.2; add(lap, bx(0.46, 0.3, 0.01), gl('#7c3aed'), 0, 0.18, -0.165).rotation.x = -0.2;
    // DJ Byte: a round robot with headphones and an LED face
    var bot = new T.Group(); bot.position.set(0, 0, -0.95); g.add(bot); A.noAud(bot);
    add(bot, cy(0.25, 0.3, 0.9, 20), ph('#c4b5fd', 70), 0, 0.45, 0); var bb = new T.Group(); bb.position.y = 0.9; bot.add(bb);
    add(bb, sp(0.42, 28), ph('#e9e2ff', 80), 0, 0.45, 0).scale.set(1, 0.95, 0.95);
    var face = cvs(256, 128); dj.face = face; var fm = add(bb, new T.SphereGeometry(0.425, 28, 14, Math.PI / 2 - 0.9, 1.8, 1.1, 0.95), new T.MeshBasicMaterial({ map: face.tex }), 0, 0.45, 0); fm.rotation.y = 0; void fm;
    add(bb, to(0.44, 0.04, Math.PI, 28), ph('#ff4fd8', 60), 0, 0.5, 0).rotation.z = 0; [-1, 1].forEach(function (sd) { var cup = add(bb, cy(0.14, 0.14, 0.12, 20), ph('#ff4fd8', 60), sd * 0.43, 0.45, 0); cup.rotation.z = Math.PI / 2; add(bb, cy(0.11, 0.11, 0.13, 20), ph('#16121f', 30), sd * 0.45, 0.45, 0).rotation.z = Math.PI / 2; });
    add(bb, cy(0.015, 0.015, 0.3, 6), chrome(), 0, 0.98, 0); var ant = add(bb, sp(0.06, 10), gl('#ffe14d'), 0, 1.14, 0);
    function rarm(sd) { var a = new T.Group(); a.position.set(sd * 0.33, 0.8, 0); bot.add(a); add(a, cy(0.06, 0.06, 0.5, 10), ph('#c4b5fd', 70), 0, -0.22, 0); add(a, sp(0.08, 12), ph('#e9e2ff', 70), 0, -0.48, 0); return a; }
    dj.bot = bot; dj.head = bb; dj.ant = ant; dj.aL = rarm(-1); dj.aR = rarm(1); dj.bub = bubble(bot, 2.6);
    // speakers + LED wall on a truss behind
    dj.spk = [speaker(g, -2.9, -0.1, 1.15), speaker(g, 2.9, -0.1, 1.15)];
    var led = cvs(1024, 512); dj.led = led; var lw = texPlane(6.4, 3.2, led.tex); lw.position.set(0, 2.55, -2.05); g.add(lw);
    add(g, bx(6.8, 0.15, 0.15), chrome(), 0, 4.25, -2.1); add(g, bx(6.8, 0.15, 0.15), chrome(), 0, 0.88, -2.1); [-3.35, 3.35].forEach(function (x) { add(g, bx(0.15, 4.3, 0.15), chrome(), x, 2.15, -2.1); });
    reg(g, 'booth'); solidBox(g.name, -3.5, 3.5, -122.8, -119.9);
    inter({ id: 'rf_dj', kind: 'ar_dj', area: 'roof', name: 'DJ Booth', col: '#ff4fd8', x: 0, z: -118.6, dir: [0, 1], r: 1.4, gw: 2.4 });
  }
  function buildDanceFloor() {
    var x0 = 0, z0 = -113, nx = 8, nz = 6, s = 1.0;
    var tex = cvs(512, 384); dance.tex = tex; dance.nx = nx; dance.nz = nz;
    var fl = add(R.roof, new T.PlaneGeometry(nx * s, nz * s), new T.MeshBasicMaterial({ map: tex.tex }), x0, 0.025, z0); fl.rotation.x = -Math.PI / 2; fl.name = 'decal:DANCE FLOOR'; A.regItem('decal:DANCE FLOOR', 'decal', fl);
    var edge = new T.Group(); R.roof.add(edge); A.noAud(edge); add(edge, bx(nx + 0.2, 0.05, 0.12), chrome(), x0, 0.025, z0 - nz / 2 - 0.06); add(edge, bx(nx + 0.2, 0.05, 0.12), chrome(), x0, 0.025, z0 + nz / 2 + 0.06); add(edge, bx(0.12, 0.05, nz), chrome(), x0 - nx / 2 - 0.06, 0.025, z0); add(edge, bx(0.12, 0.05, nz), chrome(), x0 + nx / 2 + 0.06, 0.025, z0);
    // truss posts (props) + overhead truss with the disco ball + moving head lights (not in the audit: they hang overhead)
    [-1, 1].forEach(function (sd) { var p2 = prop('roof', 'Dance truss post ' + (sd < 0 ? 'W' : 'E'), x0 + sd * 4.7, z0, 0); add(p2, bx(0.3, 4.8, 0.3), chrome(), 0, 2.4, 0); add(p2, bx(0.6, 0.08, 0.6), chrome(), 0, 0.04, 0); for (var k = 0; k < 6; k++) add(p2, bx(0.32, 0.03, 0.03), chrome(), 0, 0.4 + k * 0.8, 0.16).rotation.z = 0.6; reg(p2, 'prop'); solidBox(p2.name, x0 + sd * 4.7 - 0.3, x0 + sd * 4.7 + 0.3, z0 - 0.3, z0 + 0.3); });
    var top = new T.Group(); R.roof.add(top); A.noAud(top); add(top, bx(9.7, 0.3, 0.3), chrome(), x0, 4.85, z0);
    var ball = new T.Group(); ball.position.set(x0, 3.9, z0); top.add(ball); add(top, cy(0.01, 0.01, 0.8, 6), chrome(), x0, 4.4, z0);
    var mir = new T.MeshPhongMaterial({ color: '#e8eef8', shininess: 140, specular: '#ffffff', flatShading: true, emissive: '#1a1a2a' });
    add(ball, new T.IcosahedronGeometry(0.55, 2), mir); var bh = glowSprite('#ffffff', 2.4, 0.35); ball.add(bh);
    disco.ball = ball; disco.spots = [];
    for (var i = 0; i < 6; i++) { var sp3 = new T.Mesh(new T.CircleGeometry(0.22, 12), new T.MeshBasicMaterial({ color: ['#ff4fd8', '#3ff0ff', '#ffe14d', '#4ade80', '#ffffff', '#ff7a3d'][i], transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending })); sp3.rotation.x = -Math.PI / 2; R.roof.add(sp3); A.noAud(sp3); disco.spots.push(sp3); }
    disco.heads = [];
    [-3, -1, 1, 3].forEach(function (x, k) { var hdg = new T.Group(); hdg.position.set(x0 + x, 4.65, z0); top.add(hdg); add(hdg, cy(0.12, 0.15, 0.3, 14), ph('#1b1530', 50), 0, 0, 0); var beam = new T.Mesh(new T.ConeGeometry(0.7, 4.6, 16, 1, true), new T.MeshBasicMaterial({ color: ['#ff4fd8', '#3ff0ff', '#ffe14d', '#4ade80'][k], transparent: true, opacity: 0.12, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide })); beam.geometry.translate(0, -2.3, 0); hdg.add(beam); disco.heads.push(hdg); });
    inter({ id: 'rf_dance', kind: 'ar_dance', area: 'roof', name: 'Dance Floor', col: '#3ff0ff', x: x0, z: z0 + 1.2, dir: [0, 1], r: 2.2, hideGlow: true });
  }
  function buildFireworks() {
    var g = prop('roof', 'Fireworks console', 10.3, -112, -Math.PI / 2);
    add(g, bx(1.6, 1.0, 0.8), ph('#3b0d14', 40), 0, 0.5, 0); add(g, bx(1.66, 0.08, 0.9), chrome(), 0, 1.02, -0.05).rotation.x = 0.25;
    var big = add(g, cy(0.2, 0.22, 0.12, 28), new T.MeshPhongMaterial({ color: '#ff2a2a', emissive: '#5a0000', shininess: 90 }), 0, 1.12, 0.05); FW.btn = big;
    add(g, cy(0.27, 0.27, 0.06, 28), ph('#ffd23f', 40), 0, 1.06, 0.05);
    for (var i = 0; i < 5; i++) add(g, cy(0.05, 0.05, 0.05, 14), gl(['#ff4fd8', '#3ff0ff', '#ffe14d', '#4ade80', '#ff7a3d'][i]), -0.6 + i * 0.3, 1.08, -0.28);
    var hz = cvs(512, 128, function (c, w, h) { c.fillStyle = '#ffd23f'; c.fillRect(0, 0, w, h); for (var k = -2; k < 14; k++) { c.fillStyle = '#111'; c.beginPath(); c.moveTo(k * 40, 0); c.lineTo(k * 40 + 20, 0); c.lineTo(k * 40 - 20, h); c.lineTo(k * 40 - 40, h); c.fill(); } c.fillStyle = '#111'; rr(c, 30, 24, w - 60, h - 48, 10); c.fill(); c.fillStyle = '#ffd23f'; c.font = F(46); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('\uD83C\uDF86 FIREWORKS', w / 2, h / 2); });
    var hp = texPlane(1.5, 0.38, hz.tex); hp.position.set(0, 0.62, 0.405); g.add(hp);
    reg(g, 'booth'); solidBox(g.name, 9.85, 10.75, -112.85, -111.15);
    // launch rack by the east railing
    var rk = prop('roof', 'Firework launch rack', 12.7, -112, 0);
    add(rk, bx(1.2, 0.4, 2.6), ph('#2b2b36', 30), 0, 0.2, 0); FW.tubes = [];
    for (i = 0; i < 6; i++) { var tb = add(rk, cy(0.13, 0.13, 0.9, 16), ph(['#ff4fd8', '#3ff0ff', '#ffe14d', '#4ade80', '#ff7a3d', '#a78bfa'][i], 40), -0.25 + (i % 2) * 0.5, 0.8, -0.9 + Math.floor(i / 2) * 0.9); tb.rotation.z = -0.2; FW.tubes.push(tb.getWorldPosition ? tb : tb); add(rk, cy(0.1, 0.1, 0.02, 14), ph('#111', 10), -0.25 + (i % 2) * 0.5 - 0.09, 1.25, -0.9 + Math.floor(i / 2) * 0.9); }
    reg(rk, 'prop'); solidBox(rk.name, 12.05, 13.4, -113.4, -110.6);
    inter({ id: 'rf_fireworks', kind: 'ar_fireworks', area: 'roof', name: 'Fireworks Console', col: '#ff3d3d', x: 8.7, z: -112, dir: [-1, 0], r: 1.3 });
    buildFireworkSystem();
  }
  /* ---------- fireworks: one particle system (Points) + rocket heads ---------- */
  var FWS = { n: 2600 };
  function buildFireworkSystem() {
    var n = FWS.n, gq = new T.BufferGeometry(); FWS.pos = new Float32Array(n * 3); FWS.col = new Float32Array(n * 3); FWS.vel = new Float32Array(n * 3); FWS.life = new Float32Array(n); FWS.max = new Float32Array(n); FWS.grav = new Float32Array(n); FWS.base = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) FWS.pos[i * 3 + 1] = -999;
    gq.setAttribute('position', new T.BufferAttribute(FWS.pos, 3)); gq.setAttribute('color', new T.BufferAttribute(FWS.col, 3));
    var pm = new T.PointsMaterial({ size: 0.75, map: A.glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false, sizeAttenuation: true });
    FWS.pts = new T.Points(gq, pm); FWS.pts.frustumCulled = false; R.roof.add(FWS.pts); A.noAud(FWS.pts); FWS.next = 0; FWS.rockets = []; FWS.count = 0;
    FWS.flash = new T.PointLight('#ffffff', 0, 60, 1.5); FWS.flash.position.set(ROOF.cx + 14, 16, ROOF.cz); R.roof.add(FWS.flash);
  }
  function emit(x, y, z, vx, vy, vz, c, life, grav) { var i = FWS.next; FWS.next = (FWS.next + 1) % FWS.n; FWS.pos[i * 3] = x; FWS.pos[i * 3 + 1] = y; FWS.pos[i * 3 + 2] = z; FWS.vel[i * 3] = vx; FWS.vel[i * 3 + 1] = vy; FWS.vel[i * 3 + 2] = vz; FWS.base[i * 3] = c.r; FWS.base[i * 3 + 1] = c.g; FWS.base[i * 3 + 2] = c.b; FWS.life[i] = life; FWS.max[i] = life; FWS.grav[i] = grav; }
  var FW_TYPES = {
    peony: { name: 'Peony', cols: ['#ff4fd8', '#ffe14d'] }, ring: { name: 'Ring', cols: ['#3ff0ff', '#ffffff'] }, heart: { name: 'Heart', cols: ['#ff3d6e', '#ff8fd0'] },
    willow: { name: 'Golden Willow', cols: ['#ffcf3a', '#ffb020'] }, smile: { name: 'Smiley', cols: ['#ffe14d', '#4ade80'] }, grok: { name: 'GROK Sign', cols: ['#ff4fd8', '#3ff0ff'] }
  };
  AR.FW_TYPES = FW_TYPES;
  var textPts = null;
  function grokPoints() { if (textPts) return textPts; var c = A.mkCanvas(160, 48), g = c.getContext('2d'); g.fillStyle = '#fff'; g.font = 'bold 40px "Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('GROK', 80, 26); var d = g.getImageData(0, 0, 160, 48).data, out = []; for (var y = 0; y < 48; y += 2) for (var x = 0; x < 160; x += 2) if (d[(y * 160 + x) * 4 + 3] > 128) out.push([(x - 80) / 160, (24 - y) / 160]); textPts = out; return out; }
  function burst(type, x, y, z) {
    var def = FW_TYPES[type] || FW_TYPES.peony, c1 = new T.Color(def.cols[0]), c2 = new T.Color(def.cols[1]), i, n, a, b, sp4;
    var cam = A.camera().position, fwd = new T.Vector3(x - cam.x, 0, z - cam.z).normalize(), right = new T.Vector3(-fwd.z, 0, fwd.x); // flat shapes face the camera
    function flat(u, v, s, col, life) { emit(x, y, z, (right.x * u) * s, v * s, (right.z * u) * s, col, life, 1.6); }
    if (type === 'ring') { for (i = 0; i < 140; i++) { a = i / 140 * Math.PI * 2; flat(Math.cos(a), Math.sin(a), 9, i % 2 ? c1 : c2, 1.8); } }
    else if (type === 'heart') { for (i = 0; i < 160; i++) { a = i / 160 * Math.PI * 2; var hx = 16 * Math.pow(Math.sin(a), 3) / 16, hy = (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16; flat(hx, hy, 8, i % 3 ? c1 : c2, 2.0); } }
    else if (type === 'smile') { for (i = 0; i < 100; i++) { a = i / 100 * Math.PI * 2; flat(Math.cos(a), Math.sin(a), 8, c1, 2.0); } for (i = 0; i < 40; i++) { a = Math.PI * (1.15 + i / 40 * 0.7); flat(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 8, c2, 2.0); } [-0.35, 0.35].forEach(function (ex) { for (var k = 0; k < 10; k++) flat(ex + (Math.random() - 0.5) * 0.08, 0.3 + (Math.random() - 0.5) * 0.08, 8, c2, 2.0); }); }
    else if (type === 'grok') { grokPoints().forEach(function (q, k) { if (k % 2) return; flat(q[0] * 2.2, q[1] * 2.2, 9, k % 4 ? c1 : c2, 2.4); }); }
    else { n = type === 'willow' ? 150 : 180; for (i = 0; i < n; i++) { a = Math.random() * Math.PI * 2; b = Math.acos(2 * Math.random() - 1); sp4 = (type === 'willow' ? 5 : 8) * (0.85 + Math.random() * 0.3);
        emit(x, y, z, Math.sin(b) * Math.cos(a) * sp4, Math.cos(b) * sp4, Math.sin(b) * Math.sin(a) * sp4, i % 2 ? c1 : c2, type === 'willow' ? 3.2 : 1.7, type === 'willow' ? 3.5 : 2.2); } }
    FWS.flash.color.copy(c1); FWS.flash.intensity = 1.6; FWS.flash.position.set(x, y, z); FWS.count++;
    if (GA.Audio) { try { GA.Audio.play('firework'); } catch (e) {} }
  }
  AR.launch = function (type, opt) {
    if (!FWS.pts) return false; opt = opt || {};
    var k = FWS.rockets.length, from = new T.Vector3(12.7 + (k % 2 ? 0.25 : -0.25), 1.3, -112.9 + (k % 3) * 0.9);
    var to2 = new T.Vector3(opt.x != null ? opt.x : 22 + Math.random() * 10, opt.y != null ? opt.y : 16 + Math.random() * 8, opt.z != null ? opt.z : -112 + (Math.random() - 0.5) * 22);
    var head = add(R.roof, sp(0.12, 8), new T.MeshBasicMaterial({ color: '#fff6d0', fog: false }), from.x, from.y, from.z); A.noAud(head);
    FWS.rockets.push({ type: type, from: from, to: to2, t: 0, dur: opt.dur || 1.1, head: head });
    if (GA.Audio) { try { GA.Audio.play('launch'); } catch (e) {} }
    return true;
  };
  AR.fireworkStats = function () { var live = 0; for (var i = 0; i < FWS.n; i++) if (FWS.life[i] > 0) live++; return { rockets: FWS.rockets.length, live: live, bursts: FWS.count || 0 }; };
  function updateFireworks(dt) {
    for (var k = FWS.rockets.length - 1; k >= 0; k--) { var r = FWS.rockets[k]; r.t += dt / r.dur; var q = Math.min(1, r.t), e = 1 - (1 - q) * (1 - q);
      r.head.position.set(r.from.x + (r.to.x - r.from.x) * q, r.from.y + (r.to.y - r.from.y) * e, r.from.z + (r.to.z - r.from.z) * q);
      emit(r.head.position.x, r.head.position.y, r.head.position.z, (Math.random() - 0.5) * 0.6, -1, (Math.random() - 0.5) * 0.6, new T.Color('#ffcf8a'), 0.5, 0.5);
      if (q >= 1) { burst(r.type, r.to.x, r.to.y, r.to.z); R.roof.remove(r.head); FWS.rockets.splice(k, 1); } }
    for (var i = 0; i < FWS.n; i++) { if (FWS.life[i] <= 0) continue; FWS.life[i] -= dt; var j = i * 3, drag = Math.pow(0.35, dt);
      FWS.vel[j] *= drag; FWS.vel[j + 1] = FWS.vel[j + 1] * drag - FWS.grav[i] * dt; FWS.vel[j + 2] *= drag;
      FWS.pos[j] += FWS.vel[j] * dt; FWS.pos[j + 1] += FWS.vel[j + 1] * dt; FWS.pos[j + 2] += FWS.vel[j + 2] * dt;
      var f = Math.max(0, FWS.life[i] / FWS.max[i]), tw = f < 0.3 ? (Math.random() < 0.5 ? 1 : 0.3) : 1; FWS.col[j] = FWS.base[j] * f * tw; FWS.col[j + 1] = FWS.base[j + 1] * f * tw; FWS.col[j + 2] = FWS.base[j + 2] * f * tw;
      if (FWS.life[i] <= 0) FWS.pos[j + 1] = -999; }
    FWS.pts.geometry.attributes.position.needsUpdate = true; FWS.pts.geometry.attributes.color.needsUpdate = true;
    FWS.flash.intensity = Math.max(0, FWS.flash.intensity - dt * 3);
  }
  function buildSchedule() {
    var g = prop('roof', 'Party Schedule board', -12.9, -108, Math.PI / 2);
    [-1.6, 1.6].forEach(function (x) { add(g, cy(0.07, 0.07, 3.6, 10), chrome(), x, 1.8, 0); add(g, cy(0.25, 0.3, 0.08, 16), chrome(), x, 0.04, 0); });
    add(g, bx(3.7, 2.5, 0.12), ph('#1b1530', 40), 0, 2.2, 0);
    var sc = cvs(1024, 680); sched.tex = sc; var sm = texPlane(3.5, 2.32, sc.tex); sm.position.set(0, 2.2, 0.065); g.add(sm);
    for (var i = 0; i < 12; i++) add(g, sp(0.045, 8), gl(i % 2 ? '#ffe14d' : '#ff4fd8'), -1.75 + i * 0.318, 3.5, 0.07);
    reg(g, 'booth'); solidBox(g.name, -13.3, -12.5, -109.8, -106.2);
    inter({ id: 'rf_schedule', kind: 'ar_schedule', area: 'roof', name: 'Party Schedule', col: '#ffe14d', x: -11.3, z: -108, dir: [1, 0], r: 1.4 });
  }
  function couch(par, x, z, ry, col, name) { var g = prop('roof', name, x, z, ry); add(g, bx(2.4, 0.42, 0.9), ph(col, 20), 0, 0.21, 0); add(g, bx(2.4, 0.6, 0.25), ph(col, 20), 0, 0.6, -0.33); [-1.15, 1.15].forEach(function (sx) { add(g, bx(0.22, 0.6, 0.9), ph(col, 20), sx, 0.42, 0); });
    [-0.6, 0.6].forEach(function (sx, k) { add(g, sp(0.2, 14), ph(k ? '#ffe14d' : '#3ff0ff', 20), sx, 0.62, -0.1).scale.set(1, 1, 0.5); }); reg(g, 'prop'); solidOf(g, 0.02); return g; }
  function buildLounge() {
    couch(R.roof, -10.4, -119.6, Math.PI / 4, '#7c3aed', 'Roof couch W');
    couch(R.roof, -6.8, -121.6, 0.15, '#7c3aed', 'Roof couch N');
    var ct = prop('roof', 'Roof coffee table', -8.0, -118.4, 0); add(ct, cy(0.6, 0.6, 0.06, 28), new T.MeshPhongMaterial({ color: '#bfe9ff', transparent: true, opacity: 0.6, shininess: 140 }), 0, 0.42, 0); add(ct, cy(0.06, 0.1, 0.4, 12), chrome(), 0, 0.2, 0);
    slushCup(ct, 0.2, 0.45, 0.1, '#ff4fd8'); slushCup(ct, -0.2, 0.45, -0.1, '#4ade80'); add(ct, bx(0.3, 0.06, 0.3), ph('#e8d7b5', 10), 0.05, 0.48, -0.25); reg(ct, 'prop'); solidBox(ct.name, -8.65, -7.35, -119.05, -117.75);
    [[-8.2, -101.8, '#ff4fd8'], [-10.0, -100.4, '#3ff0ff'], [-6.4, -100.2, '#ffe14d']].forEach(function (q, i) { var bb = prop('roof', 'Bean bag ' + (i + 1), q[0], q[1], i); var m = add(bb, sp(0.55, 22), ph(q[2], 20), 0, 0.35, 0); m.scale.set(1, 0.62, 1); add(bb, sp(0.3, 16), ph(q[2], 20), 0, 0.62, -0.22).scale.set(1.2, 0.7, 0.6); reg(bb, 'prop'); solidBox(bb.name, q[0] - 0.55, q[0] + 0.55, q[1] - 0.6, q[1] + 0.55); });
    // party cooler + punch bowl
    var cl = prop('roof', 'Party cooler', 9.8, -102.6, -0.4); add(cl, bx(1.1, 0.7, 0.7), ph('#e23b3b', 50), 0, 0.35, 0); add(cl, bx(1.14, 0.12, 0.74), ph('#ffffff', 40), 0, 0.74, 0); add(cl, cy(0.4, 0.3, 0.3, 24), new T.MeshPhongMaterial({ color: '#ffb3e6', transparent: true, opacity: 0.6, shininess: 140 }), 0, 0.95, 0); add(cl, cy(0.37, 0.37, 0.02, 24), ph('#ff3d6e', 40, '#4a0a1a'), 0, 1.05, 0);
    reg(cl, 'prop'); solidOf(cl, 0.05);
    // palm planters in the corners
    [[-11.5, -122.3], [11.5, -122.3], [12.3, -99.5], [-12.0, -97.6]].forEach(function (q, i) { var pg = prop('roof', 'Roof palm ' + (i + 1), q[0], q[1], i);
      add(pg, bx(0.9, 0.7, 0.9), ph('#3b2370', 20), 0, 0.35, 0); add(pg, bx(0.95, 0.06, 0.95), gl('#3ff0ff'), 0, 0.72, 0);
      var tr2 = new T.Group(); tr2.position.y = 0.7; pg.add(tr2); for (var k = 0; k < 6; k++) { var seg = add(tr2, cy(0.09 - k * 0.006, 0.1 - k * 0.006, 0.42, 10), ph('#8a5a2b', 20), Math.sin(k * 0.3) * 0.1, 0.2 + k * 0.4, 0); seg.rotation.z = 0.05; }
      for (k = 0; k < 7; k++) { var lf = add(tr2, sp(0.5, 12), ph(k % 2 ? '#2f9e44' : '#3fbf5a', 20), Math.cos(k / 7 * 6.28) * 0.6, 2.55, Math.sin(k / 7 * 6.28) * 0.6); lf.scale.set(1.4, 0.12, 0.35); lf.rotation.y = -k / 7 * 6.28; lf.rotation.z = -0.35; }
      reg(pg, 'plant'); solidBox(pg.name, q[0] - 0.47, q[0] + 0.47, q[1] - 0.47, q[1] + 0.47); });
    // patio heaters
    [[6.4, -121.5], [-4.6, -98.2]].forEach(function (q, i) { var hg = prop('roof', 'Patio heater ' + (i + 1), q[0], q[1], 0); add(hg, cy(0.28, 0.32, 0.1, 18), chrome(), 0, 0.05, 0); add(hg, cy(0.05, 0.05, 2.2, 10), chrome(), 0, 1.15, 0); add(hg, cn(0.55, 0.3, 24), chrome(), 0, 2.4, 0).rotation.x = Math.PI; add(hg, cy(0.12, 0.12, 0.3, 14), new T.MeshBasicMaterial({ color: '#ff7a2a' }), 0, 2.15, 0); reg(hg, 'prop'); solidBox(hg.name, q[0] - 0.33, q[0] + 0.33, q[1] - 0.33, q[1] + 0.33); });
    // big neon ROOFTOP letters on posts at the north-west railing
    var ns = prop('roof', 'ROOFTOP neon sign', -6.6, -123.4, 0); [-2.3, 2.3].forEach(function (x) { add(ns, cy(0.06, 0.06, 2.8, 8), chrome(), x, 1.4, 0); });
    var nt = cvs(1024, 256, function (c, w, h) { glowText(c, '\u2605 ROOFTOP \u2605', w / 2, h / 2, 150, '#ff4fd8', w - 30); });
    var np = texPlane(4.8, 1.2, nt.tex, { transparent: true }); np.position.set(0, 2.3, 0.05); ns.add(np); reg(ns, 'prop'); solidBox(ns.name, -9.0, -4.2, -123.6, -123.2);
    // string lights: poles around the edge + sagging strings of bulbs criss-crossing the deck
    var poles = [[-13.3, -123.4], [0, -123.6], [13.3, -123.4], [13.4, -109.5], [13.3, -95.8], [-13.3, -95.8], [-13.4, -103.5], [-13.4, -114.5]];
    poles.forEach(function (q, i) { var pg = prop('roof', 'String light pole ' + (i + 1), q[0], q[1], 0); add(pg, cy(0.06, 0.08, 4.4, 10), ph('#2b2b36', 40), 0, 2.2, 0); add(pg, sp(0.1, 10), gl('#ffe9a8'), 0, 4.45, 0); reg(pg, 'prop'); solidBox(pg.name, q[0] - 0.12, q[0] + 0.12, q[1] - 0.12, q[1] + 0.12); });
    var strings = new T.Group(); R.roof.add(strings); A.noAud(strings); var bulbM = ['#ffe9a8', '#ff8fd0', '#9be7ff', '#ffe14d', '#b9ffb0'].map(function (c) { return new T.MeshBasicMaterial({ color: c }); }); sched.bulbs = [];
    [[0, 4], [1, 5], [2, 6], [3, 7], [0, 2], [5, 7], [1, 4], [1, 6]].forEach(function (pr) { var a = poles[pr[0]], b = poles[pr[1]], n = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.9);
      var pts = []; for (var k = 0; k <= n; k++) { var q = k / n; pts.push(new T.Vector3(a[0] + (b[0] - a[0]) * q, 4.35 - Math.sin(q * Math.PI) * 0.9, a[1] + (b[1] - a[1]) * q)); }
      add(strings, new T.TubeGeometry(new T.CatmullRomCurve3(pts), n * 2, 0.012, 4, false), ph('#222222', 10));
      pts.forEach(function (p, k) { if (k === 0 || k === n) return; var bm = add(strings, sp(0.07, 8), bulbM[(k + pr[0]) % 5], p.x, p.y - 0.1, p.z); sched.bulbs.push(bm); }); });
  }
  function buildRoof() {
    mkRoot('roof'); GA.Hub.addRegion(ROOF);
    buildSky(); buildDeck(); buildDJ(); buildDanceFloor(); buildFireworks(); buildSchedule(); buildLounge();
    ANIM.roof.push(function (t, dt) {
      var M = GA.AreasUI && GA.AreasUI.music ? GA.AreasUI.music() : { on: false, bpm: 110, beat: t * 2, track: null }, beat = M.beat, pulse = M.on ? Math.pow(1 - (beat % 1), 3) : 0.2 + 0.1 * Math.sin(t * 2);
      // LED dance floor + DJ front panel + LED wall + bot face (cheap: 10 fps canvas redraws)
      var kk = Math.floor(t * 10); if (kk !== dance.last) { dance.last = kk; drawDance(t, beat, M); drawDJ(t, beat, M); }
      dj.plats.forEach(function (p, i) { p.rotation.y = M.on ? t * 3.5 * (i ? 1 : -1) : 0; });
      dj.sliders.forEach(function (s2, i) { s2.position.z = 0.04 + Math.sin(t * 1.3 + i * 1.7) * 0.12; });
      dj.leds.forEach(function (l, i) { l.material.color.set(M.on && i < 8 * pulse + 1 ? (i > 5 ? '#ff3d3d' : i > 3 ? '#ffe14d' : '#4ade80') : '#1a2a1a'); });
      dj.spk.forEach(function (s2) { s2.cones.forEach(function (c2) { c2.scale.setScalar(1 + pulse * 0.12); }); });
      dj.head.rotation.x = M.on ? Math.sin(beat * Math.PI * 2) * 0.12 : Math.sin(t) * 0.03; dj.head.position.y = 0.9 + (M.on ? pulse * 0.04 : 0);
      dj.aR.rotation.x = M.on ? -1.2 + Math.sin(beat * Math.PI) * 0.5 : -0.4; dj.aL.rotation.x = M.on ? -1.0 - Math.sin(beat * Math.PI * 2) * 0.3 : -0.3; if (M.on && Math.floor(beat / 8) % 2) dj.aL.rotation.z = 2.4 + Math.sin(t * 8) * 0.2; else dj.aL.rotation.z = 0.15;
      dj.ant.material.color.set(Math.floor(beat) % 2 ? '#ffe14d' : '#ff4fd8'); dj.bub.tick(dt);
      // disco ball + spots + moving heads
      disco.ball.rotation.y = t * 0.6; disco.spots.forEach(function (s2, i) { var a = t * 0.6 + i * 1.05, rad = 1.5 + (i % 3) * 0.9; s2.position.set(Math.cos(a) * rad, 0.04, -113 + Math.sin(a) * rad * 0.7); s2.material.opacity = 0.35 + pulse * 0.4; });
      disco.heads.forEach(function (h2, i) { h2.rotation.z = Math.sin(t * 0.9 + i) * 0.55; h2.rotation.x = Math.cos(t * 0.7 + i * 2) * 0.35; h2.children[1].material.opacity = 0.07 + pulse * 0.12; });
      // city: beacons blink, wheel turns, searchlights sweep; string lights twinkle on the beat
      skyline.beacons.forEach(function (b, i) { b.visible = Math.floor(t * 1.2 + i * 0.37) % 2 === 0; });
      skyline.wheel.rotation.z = t * 0.12; skyline.beams.forEach(function (b, i) { b.rotation.z = Math.sin(t * 0.35 + i * 2) * 0.5; b.rotation.x = 0.3 + Math.cos(t * 0.27 + i) * 0.2; });
      var tw = Math.floor(t * 2); if (tw !== sched.tw) { sched.tw = tw; sched.bulbs.forEach(function (b, i) { b.visible = (i + tw) % 7 !== 0; }); }
      if (kk % 10 === 0 && kk !== sched.lastDraw) { sched.lastDraw = kk; drawSchedule(); }
      updateFireworks(dt);
      // Party Night: an automatic fireworks show every ~6 seconds while you're up here
      if (AR.party().night && t - (FWS.autoT || 0) > 6) { FWS.autoT = t; AR.launch(['peony', 'ring', 'willow', 'heart'][Math.floor(t) % 4]); }
    });
  }
  function drawDance(t, beat, M) {
    var c = dance.tex.g, w = dance.tex.c.width, h = dance.tex.c.height, s = w / dance.nx, cols = ['#ff4fd8', '#3ff0ff', '#ffe14d', '#4ade80', '#7c3aed', '#ff7a3d'];
    var b = Math.floor(beat), mode = M.on ? Math.floor(beat / 16) % 3 : 3;
    for (var i = 0; i < dance.nx; i++) for (var j = 0; j < dance.nz; j++) {
      var k = mode === 0 ? (i + j + b) % 6 : mode === 1 ? (Math.floor(Math.hypot(i - 3.5, j - 2.5) - beat) % 6 + 6) % 6 : mode === 2 ? ((i * 7 + j * 3 + b * 5) % 6) : (i + j + Math.floor(t)) % 6;
      var on = mode === 3 ? 0.35 : ((i + j + b) % 2 ? 1 : 0.45);
      c.fillStyle = '#0b0618'; c.fillRect(i * s, j * s, s, s); c.globalAlpha = on; c.fillStyle = cols[k]; rr(c, i * s + 4, j * s + 4, s - 8, s - 8, 8); c.fill(); c.globalAlpha = 1;
      c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(i * s + 8, j * s + 8, s - 16, 6);
    }
    dance.tex.tex.needsUpdate = true;
  }
  function drawDJ(t, beat, M) {
    var c = dj.led.g, w = dj.led.c.width, h = dj.led.c.height, i;
    var gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1a0640'); gr.addColorStop(1, '#05122e'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (i = 0; i < 32; i++) { var v = M.on ? Math.abs(Math.sin(t * 3 + i * 0.7) * Math.cos(beat * Math.PI + i)) : 0.08 + 0.05 * Math.sin(t + i); var bh2 = v * (h * 0.55); c.fillStyle = 'hsl(' + ((i * 11 + t * 40) % 360) + ',90%,60%)'; c.fillRect(20 + i * 31, h - 40 - bh2, 22, bh2); }
    glowText(c, M.on ? '\u266B ' + M.name + ' \u266B' : 'DJ BYTE', w / 2, 70, 64, '#ffe14d', w - 60);
    c.font = F(34); c.fillStyle = '#9be7ff'; c.textAlign = 'center'; c.fillText(M.on ? M.bpm + ' BPM \u00b7 tap the booth to switch' : 'Walk up and pick the music!', w / 2, 132);
    if (AR.party().night) { glowText(c, '\uD83C\uDF89 PARTY NIGHT \uD83C\uDF89', w / 2, 200, 56, '#ff4fd8', w - 60); }
    dj.led.tex.needsUpdate = true;
    var f = dj.front.g; f.fillStyle = '#0b0618'; f.fillRect(0, 0, 1024, 256); for (i = 0; i < 24; i++) { f.fillStyle = ['#ff4fd8', '#3ff0ff', '#ffe14d'][(i + Math.floor(beat)) % 3]; f.globalAlpha = M.on ? 0.4 + 0.6 * ((i + Math.floor(beat * 2)) % 4 === 0 ? 1 : 0.3) : 0.25; f.fillRect(10 + i * 42, 30, 30, 196); } f.globalAlpha = 1; glowText(f, 'DJ BYTE', 512, 128, 110, '#ffffff', 900); dj.front.tex.needsUpdate = true;
    // bot face: happy LED eyes that blink, mouth bounces to the beat
    var fc = dj.face.g; fc.fillStyle = '#0b1640'; fc.fillRect(0, 0, 256, 128); fc.fillStyle = '#3ff0ff'; var blink = Math.floor(t * 0.6) % 6 === 0 && (t % 1.66) < 0.15;
    [-1, 1].forEach(function (sd) { if (blink) fc.fillRect(128 + sd * 44 - 16, 54, 32, 6); else { fc.beginPath(); fc.arc(128 + sd * 44, 54, 14, Math.PI, 0); fc.lineWidth = 8; fc.strokeStyle = '#3ff0ff'; fc.stroke(); } });
    fc.fillStyle = '#ff4fd8'; var mh = M.on ? 6 + Math.abs(Math.sin(beat * Math.PI)) * 12 : 6; rr(fc, 108, 82, 40, mh, 4); fc.fill(); dj.face.tex.needsUpdate = true;
  }
  function drawSchedule() {
    if (!sched.tex) return; var c = sched.tex.g, w = sched.tex.c.width, h = sched.tex.c.height, P = AR.party(), days = AR.SCHEDULE;
    c.fillStyle = '#140a2b'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ffe14d'; c.lineWidth = 8; rr(c, 6, 6, w - 12, h - 12, 26); c.stroke();
    glowText(c, '\uD83C\uDF89 PARTY SCHEDULE', w / 2, 52, 56, '#ffe14d', w - 60);
    days.forEach(function (d, i) { var y = 104 + i * 70, today = i === P.dow; if (today) { c.fillStyle = 'rgba(255,79,216,.28)'; rr(c, 20, y - 30, w - 40, 62, 14); c.fill(); }
      c.textAlign = 'left'; c.textBaseline = 'middle'; c.font = F(30); c.fillStyle = today ? '#ffffff' : '#c4b5fd'; c.fillText(d.day, 40, y);
      c.font = '34px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.fillText(d.icon, 150, y + 2);
      c.font = F(28); c.fillStyle = today ? '#ffe14d' : '#ffffff'; c.fillText(d.name, 205, y - 10); c.font = F(19, 'normal'); c.fillStyle = '#9be7ff'; c.fillText(d.what, 205, y + 18); });
    c.textAlign = 'center'; c.font = F(26); c.fillStyle = P.night ? '#ff4fd8' : '#4ade80'; c.fillText(P.night ? '\uD83C\uDF86 PARTY NIGHT IS ON! Claim your bonus here.' : 'Next Party Night: ' + P.nextText, w / 2, h - 34);
    sched.tex.tex.needsUpdate = true;
  }
  AR.djSay = function (s) { if (dj.bub) dj.bub.say(s, 3.5); };

  /* =====================================================================================================
     3) SECRET BASEMENT  (x -11..11, z 100..118, ceiling 4 m; stairs come down at the south wall)
     ===================================================================================================== */
  var bs = {};
  function carpetTex() { var c = A.mkCanvas(256, 256), g = c.getContext('2d'); g.fillStyle = '#120a2a'; g.fillRect(0, 0, 256, 256);
    var cols = ['#ff4fd8', '#3ff0ff', '#ffe14d', '#7c3aed', '#4ade80'], r = 5; function rnd() { r = (r * 9301 + 49297) % 233280; return r / 233280; }
    for (var i = 0; i < 46; i++) { var x = rnd() * 256, y = rnd() * 256, k = Math.floor(rnd() * 3); g.strokeStyle = g.fillStyle = cols[Math.floor(rnd() * 5)]; g.lineWidth = 4; g.globalAlpha = 0.8;
      if (k === 0) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 14, y - 22); g.lineTo(x + 28, y); g.closePath(); g.stroke(); }
      else if (k === 1) { g.beginPath(); g.moveTo(x, y); for (var q = 0; q < 4; q++) g.lineTo(x + q * 8 + 8, y + (q % 2 ? -8 : 8)); g.stroke(); }
      else { g.beginPath(); g.arc(x, y, 7, 0, 7); g.stroke(); } }
    g.globalAlpha = 1; var t = A.canvasTex(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(5, 4); return t; }
  function brickTex() { var c = A.mkCanvas(256, 256), g = c.getContext('2d'); g.fillStyle = '#2a1714'; g.fillRect(0, 0, 256, 256);
    for (var y = 0; y < 8; y++) for (var x = -1; x < 5; x++) { var ox = (y % 2) * 32; g.fillStyle = ['#6b2f24', '#5a281f', '#743529', '#622c22'][(x * 3 + y * 5 + 8) % 4]; g.fillRect(x * 64 + ox + 3, y * 32 + 3, 58, 26); }
    var t = A.canvasTex(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
  function buildBaseShell() {
    var r = R.base, B = BASE, W = B.maxX - B.minX, D = B.maxZ - B.minZ, cx = B.cx, cz = B.cz, H = B.H;
    var fl = add(r, new T.PlaneGeometry(W, D), new T.MeshLambertMaterial({ map: carpetTex() }), cx, 0, cz); fl.rotation.x = -Math.PI / 2;
    var ce = add(r, new T.PlaneGeometry(W, D), lm('#1a1420'), cx, H, cz); ce.rotation.x = Math.PI / 2;
    var bt = brickTex(), shell = new T.Group(); shell.name = 'basement walls'; r.add(shell); A.noAud(shell);
    function wall(len, x, z, ry) { var t2 = bt.clone(); t2.needsUpdate = true; t2.repeat.set(len / 2.4, H / 1.2); var m = add(shell, new T.PlaneGeometry(len, H), new T.MeshLambertMaterial({ map: t2 }), x, H / 2, z); m.rotation.y = ry; add(shell, bx(len, 0.18, 0.06), ph('#1b1530', 20), x + Math.sin(ry) * 0.03, 0.09, z + Math.cos(ry) * 0.03).rotation.y = ry; }
    wall(W, cx, B.minZ, 0); wall(W, cx, B.maxZ, Math.PI); wall(D, B.minX, cz, Math.PI / 2); wall(D, B.maxX, cz, -Math.PI / 2);
    var th = 0.4; A.addWall(B.minX - 1, B.maxX + 1, -1, H + 3, B.minZ - th, B.minZ); A.addWall(B.minX - 1, B.maxX + 1, -1, H + 3, B.maxZ, B.maxZ + th);
    A.addWall(B.minX - th, B.minX, -1, H + 3, B.minZ - 1, B.maxZ + 1); A.addWall(B.maxX, B.maxX + th, -1, H + 3, B.minZ - 1, B.maxZ + 1);
    A.walls.push({ minX: B.minX - 1, maxX: B.maxX + 1, minY: H, maxY: H + 2, minZ: B.minZ - 1, maxZ: B.maxZ + 1 });
    // pipes + ducts along the ceiling, hanging bulbs (they only all light up once you fix the fuse box)
    var pip = new T.Group(); r.add(pip); A.noAud(pip);
    [[-7, '#7a7f8a', 0.12], [-6.4, '#b87333', 0.07], [6.6, '#7a7f8a', 0.16], [7.2, '#2f6b3a', 0.08]].forEach(function (q) { var m = add(pip, cy(q[2], q[2], D, 12), ph(q[1], 60), q[0], H - 0.25, cz); m.rotation.x = Math.PI / 2; for (var k = 0; k < 6; k++) add(pip, to(q[2] + 0.02, 0.025, 7, 12), ph('#3a3f4a', 40), q[0], H - 0.25, B.minZ + 1.5 + k * 3).rotation.y = 0; });
    add(pip, bx(W, 0.5, 0.7), ph('#5c6270', 50), cx, H - 0.3, B.maxZ - 0.6);
    bs.bulbs = []; bs.lights = [];
    [[-5, 103], [5, 103], [-5, 109], [5, 109], [-5, 115], [5, 115], [0, 106], [0, 112]].forEach(function (q, i) {
      add(pip, cy(0.005, 0.005, 0.6, 4), ph('#111', 10), q[0], H - 0.3, q[1]); var sh = add(pip, cn(0.22, 0.18, 16, true), ph('#2b5f3a', 40), q[0], H - 0.62, q[1]); void sh;
      var b = add(pip, sp(0.08, 10), new T.MeshBasicMaterial({ color: '#ffe9a8' }), q[0], H - 0.72, q[1]); var gs = glowSprite('#ffd98a', 1.2, 0.5); gs.position.copy(b.position); pip.add(gs); bs.bulbs.push({ b: b, g: gs, on: i < 2 });
    });
    bs.lamp1 = new T.PointLight('#ffd9a0', 0.9, 12, 1.4); bs.lamp1.position.set(0, 3.2, 104); r.add(bs.lamp1);
    bs.lamp2 = new T.PointLight('#ffd9a0', 0, 14, 1.4); bs.lamp2.position.set(0, 3.2, 113); r.add(bs.lamp2);
    bs.uv = new T.PointLight('#8a4dff', 0, 10, 1.2); bs.uv.position.set(-8, 2.8, 112); r.add(bs.uv);
    // cobwebs in the corners (Gus hasn't dusted since 1983)
    var web = cvs(128, 128, function (c, w, h) { c.strokeStyle = 'rgba(230,230,240,.55)'; c.lineWidth = 1.5; for (var k = 0; k < 7; k++) { var a = k / 6 * Math.PI / 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 128, Math.sin(a) * 128); c.stroke(); } for (var rr2 = 20; rr2 < 128; rr2 += 22) { c.beginPath(); for (k = 0; k <= 6; k++) { var a2 = k / 6 * Math.PI / 2, rad = rr2 * (k % 2 ? 0.9 : 1); if (k) c.lineTo(Math.cos(a2) * rad, Math.sin(a2) * rad); else c.moveTo(Math.cos(a2) * rad, Math.sin(a2) * rad); } c.stroke(); } });
    [[B.minX + 0.02, B.maxZ - 0.02, Math.PI / 2, 1], [B.maxX - 0.02, B.maxZ - 0.02, -Math.PI / 2, -1], [B.maxX - 0.02, B.minZ + 0.02, -Math.PI / 2, 1]].forEach(function (q) { var m = texPlane(1.2, 1.2, web.tex, { transparent: true, double: true }); m.material.depthWrite = false; m.position.set(q[0], H - 0.6, q[1] - q[3] * 0.6); m.rotation.y = q[2]; m.scale.x = q[3]; pip.add(m); });
  }
  /* rare old cabinets: woodgrain, a bulging CRT, real joystick + buttons, coin door */
  function woodTex(col) { var c = A.mkCanvas(64, 256), g = c.getContext('2d'); g.fillStyle = col; g.fillRect(0, 0, 64, 256); g.strokeStyle = 'rgba(0,0,0,.25)'; for (var i = 0; i < 18; i++) { g.lineWidth = 1 + (i % 3); g.beginPath(); g.moveTo(i * 3.6, 0); g.bezierCurveTo(i * 3.6 + 6, 80, i * 3.6 - 6, 170, i * 3.6 + 2, 256); g.stroke(); } return A.canvasTex(c); }
  function retroCab(o) {
    var g = prop('base', o.name, o.x, o.z, o.ry), wood = new T.MeshPhongMaterial({ map: woodTex(o.wood || '#6b3f22'), shininess: 20 });
    var sideShape = new T.Shape(); sideShape.moveTo(-0.38, 0); sideShape.lineTo(0.38, 0); sideShape.lineTo(0.38, 0.95); sideShape.lineTo(0.52, 1.05); sideShape.lineTo(0.52, 1.18); sideShape.lineTo(0.3, 1.32); sideShape.lineTo(0.3, 1.95); sideShape.lineTo(0.42, 2.0); sideShape.lineTo(0.42, 2.12); sideShape.lineTo(-0.38, 2.12); sideShape.lineTo(-0.38, 0);
    var sg = new T.ExtrudeGeometry(sideShape, { depth: 0.05, bevelEnabled: false });
    [-0.43, 0.38].forEach(function (x) { var m = add(g, sg, wood, x, 0, 0); m.rotation.y = -Math.PI / 2; m.position.x = x + 0.05; });
    add(g, bx(0.76, 0.95, 0.7), wood, 0, 0.475, -0.03); add(g, bx(0.76, 0.6, 0.12), ph('#16121f', 30), 0, 1.62, -0.36); add(g, bx(0.76, 0.85, 0.5), ph('#16121f', 30), 0, 1.6, -0.12);
    add(g, bx(0.76, 0.1, 0.82), ph('#16121f', 30), 0, 2.08, 0.0);
    // control panel
    var cp = add(g, bx(0.86, 0.06, 0.32), ph(o.panel || '#c0392b', 40), 0, 1.1, 0.36); cp.rotation.x = -0.25;
    add(g, cy(0.012, 0.012, 0.12, 8), chrome(), -0.18, 1.18, 0.36); add(g, sp(0.035, 12), ph('#ff2a2a', 60), -0.18, 1.25, 0.36);
    [0.06, 0.16, 0.26].forEach(function (x, i) { add(g, cy(0.03, 0.03, 0.025, 14), ph(['#ffe14d', '#3ff0ff', '#ff4fd8'][i], 60), x, 1.135 - (x - 0.06) * 0.0, 0.37); });
    // CRT bulge screen + bezel
    var scr = cvs(256, 224); o.scr = scr; var bez = new T.Group(); bez.position.set(0, 1.6, 0.14); bez.rotation.x = -0.12; g.add(bez); [[0, 0.27, 0.66, 0.06], [0, -0.27, 0.66, 0.06], [-0.3, 0, 0.06, 0.6], [0.3, 0, 0.06, 0.6]].forEach(function (q) { add(bez, bx(q[2], q[3], 0.05), ph('#0a0a0a', 30), q[0], q[1], 0); });
    var crt = new T.Mesh(new T.SphereGeometry(0.62, 24, 16, Math.PI / 2 - 0.42, 0.84, Math.PI / 2 - 0.36, 0.72), new T.MeshBasicMaterial({ map: scr.tex })); crt.position.set(0, 1.6, -0.45); crt.rotation.x = -0.12; g.add(crt);
    var gw = glowSprite(o.glow || '#3ff0ff', 1.2, 0.18); gw.position.set(0, 1.6, 0.28); g.add(gw);
    // marquee
    var mq = cvs(512, 128, function (c, w, h) { var gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, o.m1 || '#ff2a6d'); gr.addColorStop(1, o.m2 || '#ffd23f'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, h - 20, w, 20); glowText(c, o.title, w / 2, 56, 64, '#ffffff', w - 30); c.font = F(18); c.fillStyle = '#111'; c.textAlign = 'center'; c.fillText(o.year + ' \u00b7 RARE', w / 2, h - 10); });
    var mp = texPlane(0.74, 0.19, mq.tex); mp.position.set(0, 1.98, 0.43); g.add(mp);
    // coin door with glowing slots
    add(g, bx(0.36, 0.42, 0.02), chrome(), 0, 0.55, 0.33); [-0.07, 0.07].forEach(function (x) { add(g, bx(0.05, 0.1, 0.02), gl('#ff3d3d'), x, 0.62, 0.345); });
    if (o.broken) { var nt = cvs(256, 256, function (c, w, h) { c.fillStyle = '#fff59a'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a2216'; c.font = F(30); c.textAlign = 'center'; c.fillText('OUT OF', w / 2, 60); c.fillText('ORDER', w / 2, 96); c.font = F(22, 'italic bold'); c.fillText('fixing it.', w / 2, 150); c.fillText('since 1987.', w / 2, 182); c.fillText('- Gus', w / 2, 226); }); var np = texPlane(0.28, 0.28, nt.tex); np.position.set(0.12, 1.55, 0.2); np.rotation.set(-0.12, 0, 0.15); g.add(np); }
    reg(g, 'cabinet'); solidOf(g, 0.03);
    var dir = [Math.sin(o.ry), Math.cos(o.ry)];
    if (!o.broken) inter({ id: o.id, kind: 'ar_retro', area: 'base', name: o.title, desc: o.desc, col: o.glow || '#3ff0ff', x: o.x + dir[0] * 1.15, z: o.z + dir[1] * 1.15, dir: dir, r: 1.0, gw: 1.2, gh: 1.0 });
    o.g = g; bs.cabs.push(o); return g;
  }
  function drawRetro(o, t) {
    var c = o.scr.g, w = 256, h = 224, k, x, y; c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    if (o.broken) { for (k = 0; k < 600; k++) { c.fillStyle = Math.random() < 0.5 ? '#222' : '#666'; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }
    else if (o.id === 'rt_pong') { c.fillStyle = '#fff'; for (y = 0; y < h; y += 16) c.fillRect(w / 2 - 2, y, 4, 8); var by = h / 2 + Math.sin(t * 2.3) * 80, bxp = w / 2 + Math.sin(t * 3.1) * 110; c.fillRect(bxp - 4, by - 4, 8, 8); c.fillRect(14, by - 22 + Math.sin(t * 4) * 6, 6, 44); c.fillRect(w - 20, by - 22 - Math.sin(t * 3) * 8, 6, 44); c.font = 'bold 30px "Courier New",monospace'; c.textAlign = 'center'; c.fillText(Math.floor(t / 4) % 10, w / 2 - 36, 34); c.fillText(Math.floor(t / 5) % 10, w / 2 + 36, 34); }
    else if (o.id === 'rt_invaders') { var cols = ['#ff4fd8', '#3ff0ff', '#4ade80']; for (y = 0; y < 3; y++) for (x = 0; x < 7; x++) { c.fillStyle = cols[y]; var ix = 30 + x * 30 + Math.sin(t) * 16, iy = 30 + y * 24 + (t * 3 % 20); c.fillRect(ix, iy, 16, 10); c.fillRect(ix + (Math.floor(t * 2) % 2 ? -3 : 3), iy + 10, 4, 4); c.fillRect(ix + 12 + (Math.floor(t * 2) % 2 ? 3 : -3), iy + 10, 4, 4); } c.fillStyle = '#ffe14d'; var sx = w / 2 + Math.sin(t * 1.4) * 90; c.fillRect(sx - 12, h - 26, 24, 10); c.fillRect(sx - 3, h - 34, 6, 8); c.fillRect(sx - 1, h - 60 - (t * 200 % 120), 2, 10); }
    c.fillStyle = 'rgba(0,0,0,.25)'; for (y = 0; y < h; y += 3) c.fillRect(0, y, w, 1); // scanlines
    if (!o.broken && Math.floor(t * 1.5) % 2) { c.font = 'bold 18px "Courier New",monospace'; c.fillStyle = '#ffe14d'; c.textAlign = 'center'; c.fillText('INSERT COIN', w / 2, h - 8); }
    o.scr.tex.needsUpdate = true;
  }
  function buildPinball() {
    var g = prop('base', 'Old pinball machine', -7.6, 116.5, Math.PI);
    add(g, bx(0.75, 0.2, 1.45), ph('#3b1f6b', 50), 0, 0.95, 0); var pf = cvs(256, 512, function (c, w, h) { c.fillStyle = '#1a0f3a'; c.fillRect(0, 0, w, h); for (var k = 0; k < 9; k++) { c.fillStyle = ['#ff4fd8', '#3ff0ff', '#ffe14d'][k % 3]; c.beginPath(); c.arc(40 + (k % 3) * 88, 90 + Math.floor(k / 3) * 90, 18, 0, 7); c.fill(); } c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.moveTo(40, 470); c.lineTo(110, 500); c.moveTo(216, 470); c.lineTo(146, 500); c.stroke(); glowText(c, 'GROK', w / 2, 360, 70, '#ffe14d', w - 30); });
    var pp = texPlane(0.7, 1.4, pf.tex); pp.rotation.x = -Math.PI / 2 + 0.12; pp.position.set(0, 1.06, 0); g.add(pp);
    add(g, bx(0.72, 0.03, 1.42), new T.MeshPhongMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.22, shininess: 140 }), 0, 1.1, 0).rotation.x = 0.12;
    [[-0.32, -0.66], [0.32, -0.66], [-0.32, 0.66], [0.32, 0.66]].forEach(function (q) { add(g, cy(0.03, 0.03, 0.85, 8), chrome(), q[0], 0.43, q[1]); });
    add(g, bx(0.75, 0.75, 0.12), ph('#16121f', 30), 0, 1.5, -0.68); var bb = cvs(256, 256, function (c, w, h) { var gr = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 160); gr.addColorStop(0, '#ff4fd8'); gr.addColorStop(1, '#2a0e4a'); c.fillStyle = gr; c.fillRect(0, 0, w, h); glowText(c, 'SPACE', w / 2, 90, 54, '#ffe14d', w - 20); glowText(c, 'GUS', w / 2, 160, 64, '#3ff0ff', w - 20); c.font = F(20); c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText('1979', w / 2, 220); });
    var bp = texPlane(0.66, 0.66, bb.tex); bp.position.set(0, 1.5, -0.615); g.add(bp);
    bs.pinLights = []; for (var k = 0; k < 6; k++) bs.pinLights.push(add(g, sp(0.03, 8), new T.MeshBasicMaterial({ color: '#ffe14d' }), -0.25 + k * 0.1, 1.15, 0.5));
    reg(g, 'prop'); solidOf(g, 0.03);
  }
  function buildFuseBox() {
    var g = prop('base', 'Fuse box', BASE.maxX, 104.6, -Math.PI / 2);
    add(g, bx(1.0, 1.25, 0.2), ph('#6a7180', 50), 0, 1.55, 0.1); add(g, bx(0.9, 1.15, 0.03), ph('#545b68', 60), 0, 1.55, 0.215);
    var sc = cvs(256, 320); bs.fuseTex = sc; var fp = texPlane(0.78, 0.98, sc.tex); fp.position.set(0, 1.55, 0.235); g.add(fp);
    add(g, cy(0.05, 0.05, 1.7, 10), ph('#7a7f8a', 50), -0.3, 3.1, 0.08); add(g, cy(0.05, 0.05, 1.7, 10), ph('#7a7f8a', 50), 0.3, 3.1, 0.08);
    var hz = cvs(256, 96, function (c, w, h) { c.fillStyle = '#ffd23f'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = F(36); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('\u26A1 FUSES', w / 2, h / 2); }); var hp = texPlane(0.6, 0.22, hz.tex); hp.position.set(0, 2.32, 0.21); g.add(hp);
    reg(g, 'booth'); solidOf(g, 0.03);
    inter({ id: 'bs_fuse', kind: 'ar_fuse', area: 'base', name: 'Fuse Box', col: '#ffe14d', x: BASE.maxX - 1.3, z: 104.6, dir: [-1, 0], r: 1.1 });
  }
  function drawFuse() {
    if (!bs.fuseTex) return; var c = bs.fuseTex.g, w = 256, h = 320, st = AR.fuseState(); c.fillStyle = '#2b2f3a'; c.fillRect(0, 0, w, h);
    for (var i = 0; i < 16; i++) { var x = 24 + (i % 4) * 54, y = 24 + Math.floor(i / 4) * 66, on = st.grid[i]; c.fillStyle = '#111'; rr(c, x, y, 46, 56, 6); c.fill(); c.fillStyle = on ? '#4ade80' : '#ff3d3d'; rr(c, x + 12, on ? y + 6 : y + 26, 22, 24, 4); c.fill(); }
    c.font = F(22); c.fillStyle = st.solved ? '#4ade80' : '#ffe14d'; c.textAlign = 'center'; c.fillText(st.solved ? 'POWER ON' : 'ALL GREEN = POWER', w / 2, h - 16); bs.fuseTex.tex.needsUpdate = true;
  }
  function buildSafe() {
    var g = prop('base', 'Gus\u2019s code safe', 5.6, BASE.maxZ - 0.5, Math.PI);
    add(g, bx(1.1, 1.3, 0.8), ph('#3a3f4a', 90), 0, 0.65, 0); add(g, bx(0.96, 1.16, 0.04), ph('#4a515e', 100), 0, 0.65, 0.41);
    var dial = add(g, cy(0.16, 0.16, 0.06, 28), chrome(), -0.18, 0.82, 0.44); dial.rotation.x = Math.PI / 2; bs.dial = dial;
    for (var k = 0; k < 12; k++) add(dial, bx(0.01, 0.02, 0.03), ph('#111', 10), Math.cos(k / 12 * 6.28) * 0.13, 0.035, Math.sin(k / 12 * 6.28) * 0.13);
    var kp = cvs(128, 160, function (c, w, h) { c.fillStyle = '#111'; c.fillRect(0, 0, w, h); for (var i = 0; i < 12; i++) { c.fillStyle = '#c4c9d4'; rr(c, 10 + (i % 3) * 38, 40 + Math.floor(i / 3) * 30, 32, 24, 4); c.fill(); c.fillStyle = '#111'; c.font = F(16); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'][i], 26 + (i % 3) * 38, 52 + Math.floor(i / 3) * 30); } c.fillStyle = '#4ade80'; c.fillRect(10, 10, 108, 22); });
    var kpp = texPlane(0.26, 0.32, kp.tex); kpp.position.set(0.25, 0.85, 0.435); g.add(kpp);
    add(g, bx(0.04, 0.32, 0.06), chrome(), 0.25, 0.42, 0.45); [-0.4, 0.4].forEach(function (y) { add(g, cy(0.04, 0.04, 0.12, 10), chrome(), -0.5, 0.65 + y, 0.4); });
    var sym = cvs(512, 96, function (c, w, h) { c.fillStyle = '#16121f'; c.fillRect(0, 0, w, h); c.font = '56px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; AR.SAFE_SYMS.forEach(function (s2, i) { c.fillText(s2, 64 + i * 128, h / 2 + 4); }); });
    var sp5 = texPlane(0.8, 0.15, sym.tex); sp5.position.set(0, 1.18, 0.432); g.add(sp5);
    bs.safeDoor = g; reg(g, 'booth'); solidOf(g, 0.03);
    inter({ id: 'bs_safe', kind: 'ar_safe', area: 'base', name: 'Gus\u2019s Code Safe', col: '#4ade80', x: 5.6, z: BASE.maxZ - 1.95, dir: [0, -1], r: 1.1 });
  }
  function buildVault() {
    var g = prop('base', 'Rare prize vault', -0.6, BASE.maxZ - 0.62, Math.PI);
    add(g, bx(3.0, 0.7, 1.0), ph('#1b1530', 50), 0, 0.35, 0); add(g, bx(3.06, 0.06, 1.06), gold(), 0, 0.72, 0);
    var glass = new T.MeshPhongMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.18, shininess: 150, side: T.DoubleSide, depthWrite: false });
    add(g, bx(2.96, 1.3, 0.96), glass, 0, 1.4, 0); add(g, bx(3.06, 0.08, 1.06), gold(), 0, 2.08, 0);
    [[-1.5, -0.5], [1.5, -0.5], [-1.5, 0.5], [1.5, 0.5]].forEach(function (q) { add(g, bx(0.05, 1.32, 0.05), gold(), q[0], 1.4, q[1]); });
    bs.vaultSpots = []; [-1.0, 0, 1.0].forEach(function (x) { add(g, cy(0.22, 0.26, 0.12, 20), ph('#7c3aed', 60), x, 0.81, 0); var pd = new T.Group(); pd.position.set(x, 0.87, 0); g.add(pd); bs.vaultSpots.push(pd); });
    var vs = cvs(1024, 160, function (c, w, h) { c.fillStyle = '#140a2b'; rr(c, 4, 4, w - 8, h - 8, 20); c.fill(); c.strokeStyle = '#ffd23f'; c.lineWidth = 6; c.stroke(); glowText(c, '\uD83D\uDC8E RARE PRIZE VAULT \uD83D\uDC8E', w / 2, h / 2, 64, '#ffd23f', w - 40); });
    var vp = texPlane(2.4, 0.38, vs.tex); vp.position.set(0, 0.36, 0.505); g.add(vp);
    reg(g, 'counter'); solidOf(g, 0.03); bs.vault = g;
    inter({ id: 'bs_vault', kind: 'ar_vault', area: 'base', name: 'Rare Prize Vault', col: '#ffd23f', x: -0.6, z: BASE.maxZ - 2.0, dir: [0, -1], r: 1.3, gw: 2.2 });
  }
  function fillVault() { // real 3D prize models inside the case (owned ones glow)
    if (!bs.vaultSpots || !GA.Prize3D) return; ['gold_key', 'retro_cab', 'disco_ball'].forEach(function (id, i) { var pd = bs.vaultSpots[i]; while (pd.children.length) pd.remove(pd.children[0]);
      try { var m = GA.Prize3D.build(id); m.scale.setScalar(0.55); pd.add(m); A.noAud(m); pd.userData.m = m; } catch (e) {} }); }
  function buildJukebox() {
    var g = prop('base', 'Jukebox', 7.6, BASE.minZ + 0.5, 0);
    var sh = new T.Shape(); sh.moveTo(-0.55, 0); sh.lineTo(0.55, 0); sh.lineTo(0.55, 1.15); sh.absarc(0, 1.15, 0.55, 0, Math.PI, false); sh.lineTo(-0.55, 0);
    var body = add(g, new T.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 }), new T.MeshPhongMaterial({ color: '#7a1f2b', shininess: 80 }), 0, 0, -0.32); void body;
    var arch = new T.Mesh(new T.TorusGeometry(0.46, 0.05, 10, 32, Math.PI), new T.MeshBasicMaterial({ color: '#ffb020' })); arch.position.set(0, 1.15, 0.31); g.add(arch); bs.juke = { arch: arch, tubes: [] };
    [-0.47, 0.47].forEach(function (x) { var tb = add(g, cy(0.05, 0.05, 1.05, 12), new T.MeshBasicMaterial({ color: '#ff4fd8' }), x, 0.6, 0.31); bs.juke.tubes.push(tb); });
    var win = cvs(256, 256); bs.juke.win = win; var wp = texPlane(0.66, 0.6, win.tex); wp.position.set(0, 1.12, 0.315); g.add(wp);
    add(g, bx(0.86, 0.36, 0.05), ph('#c0c6d0', 90), 0, 0.42, 0.3); for (var k = 0; k < 8; k++) add(g, cy(0.025, 0.025, 0.04, 10), ph(['#ffe14d', '#3ff0ff', '#ff4fd8', '#4ade80'][k % 4], 60), -0.3 + k * 0.086, 0.68, 0.32).rotation.x = Math.PI / 2;
    reg(g, 'booth'); solidOf(g, 0.03);
    inter({ id: 'bs_jukebox', kind: 'ar_jukebox', area: 'base', name: 'Jukebox', col: '#ff4fd8', x: 7.6, z: BASE.minZ + 1.95, dir: [0, 1], r: 1.1 });
  }
  function buildGusDesk() {
    var g = prop('base', 'Gus\u2019s old desk', -8.0, BASE.minZ + 1.6, 0), wood = ph('#5a3a22', 30);
    add(g, bx(2.0, 0.08, 0.9), wood, 0, 0.8, 0); [[-0.92, -0.38], [0.92, -0.38], [-0.92, 0.38], [0.92, 0.38]].forEach(function (q) { add(g, bx(0.08, 0.8, 0.08), wood, q[0], 0.4, q[1]); });
    add(g, bx(0.55, 0.6, 0.8), wood, 0.7, 0.4, 0); for (var k = 0; k < 3; k++) add(g, bx(0.08, 0.03, 0.02), gold(), 0.7, 0.2 + k * 0.2, 0.41);
    // old beige computer, desk lamp, photo, coffee mug, paper stacks
    add(g, bx(0.5, 0.42, 0.45), ph('#d8cfb4', 20), -0.45, 1.05, -0.1); var cs = cvs(128, 96, function (c, w, h) { c.fillStyle = '#062b10'; c.fillRect(0, 0, w, h); c.fillStyle = '#4ade80'; c.font = 'bold 14px "Courier New",monospace'; c.fillText('C:\\GUS> _', 8, 24); c.fillText('KEY.TXT', 8, 46); c.fillText('lost again', 8, 66); });
    var cp = texPlane(0.38, 0.28, cs.tex); cp.position.set(-0.45, 1.06, 0.126); g.add(cp); add(g, bx(0.46, 0.04, 0.16), ph('#d8cfb4', 20), -0.45, 0.86, 0.3);
    var lamp = new T.Group(); lamp.position.set(0.7, 0.84, -0.2); g.add(lamp); add(lamp, cy(0.1, 0.12, 0.03, 16), ph('#2f6b3a', 60), 0, 0, 0); var arm = add(lamp, cy(0.015, 0.015, 0.4, 8), chrome(), 0, 0.2, 0.05); arm.rotation.x = 0.3; add(lamp, cn(0.12, 0.14, 16, true), ph('#2f6b3a', 60), 0, 0.42, 0.13).rotation.x = 2.3;
    var dl = new T.PointLight('#ffd98a', 0.6, 3.5, 1.5); dl.position.set(0.7, 1.2, 0.1); g.add(dl);
    var photo = cvs(128, 160, function (c, w, h) { c.fillStyle = '#c9a36a'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8d9b8'; c.fillRect(10, 10, w - 20, h - 50); c.fillStyle = '#8a7a5a'; c.beginPath(); c.arc(w / 2, 62, 24, 0, 7); c.fill(); c.fillRect(w / 2 - 30, 86, 60, 30); c.fillStyle = '#3a2216'; c.font = F(14); c.textAlign = 'center'; c.fillText('GUS 1983', w / 2, h - 18); });
    var fr = add(g, bx(0.2, 0.26, 0.02), gold(), 0.2, 0.97, -0.3); fr.rotation.x = -0.2; var ph2 = texPlane(0.17, 0.22, photo.tex); ph2.position.set(0.2, 0.97, -0.285); ph2.rotation.x = -0.2; g.add(ph2);
    add(g, cy(0.05, 0.045, 0.1, 14), ph('#ffffff', 40), 0.25, 0.89, 0.25); add(g, to(0.03, 0.01, 7, 10), ph('#ffffff', 40), 0.3, 0.89, 0.25).rotation.y = Math.PI / 2;
    for (k = 0; k < 4; k++) add(g, bx(0.24, 0.02, 0.32), ph(k % 2 ? '#f5f0e6' : '#e8e0cc', 10), -0.05 + k * 0.01, 0.85 + k * 0.022, 0.18).rotation.y = k * 0.1;
    // the chair
    var ch = new T.Group(); ch.position.set(0.0, 0, -0.75); g.add(ch); add(ch, cy(0.25, 0.25, 0.06, 18), ph('#3b2370', 20), 0, 0.5, 0); add(ch, bx(0.46, 0.5, 0.06), ph('#3b2370', 20), 0, 0.8, -0.22); add(ch, cy(0.03, 0.03, 0.45, 8), chrome(), 0, 0.25, 0); add(ch, cy(0.22, 0.22, 0.03, 5), chrome(), 0, 0.03, 0);
    reg(g, 'booth'); solidOf(g, 0.03);
    inter({ id: 'bs_gusdesk', kind: 'ar_gusdesk', area: 'base', name: 'Gus\u2019s Old Desk', col: '#ffd98a', x: -8.0, z: BASE.minZ + 3.2, dir: [0, 1], r: 1.1 });
  }
  function posterTex(sym, digit, line1, line2, col) { return cvs(384, 512, function (c, w, h) { var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, col); gr.addColorStop(1, '#140a2b'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = '#ffe9a8'; c.lineWidth = 10; c.strokeRect(10, 10, w - 20, h - 20);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = F(34); c.fillStyle = '#fff'; c.fillText(line1, w / 2, 56); c.font = '150px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.fillText(sym, w / 2, 210);
    glowText(c, String(digit), w / 2, 380, 120, '#ffe14d', w - 40); c.font = F(24, 'italic bold'); c.fillStyle = '#ffe9a8'; c.fillText(line2, w / 2, 470); }); }
  function buildPosters() {
    var code = AR.safeCode(), S = AR.SAFE_SYMS; bs.posters = [];
    var pA = posterTex(S[0], code[0], 'PIZZA NIGHT \u201983', 'Gio\u2019s lucky slice', '#a8322a'), pB = posterTex(S[1], code[1], 'HIGH SCORE CLUB', 'Gus\u2019s best level', '#2a3fa8'), pC = posterTex(S[2], code[2], 'NEW YEAR \u201984', 'fireworks launched', '#7c2aa8');
    bs.posters.push(wallSign('base', 'poster: pizza night', 1.0, 1.33, pA.tex, BASE.maxX - 0.03, 2.0, 111.0, -Math.PI / 2));
    bs.posters.push(wallSign('base', 'poster: high score club', 1.0, 1.33, pB.tex, -4.6, 2.0, BASE.minZ + 0.03, 0));
    bs.posters.push(wallSign('base', 'poster: new year 84', 1.0, 1.33, pC.tex, 9.2, 2.0, BASE.maxZ - 0.03, Math.PI));
    // glow-in-the-dark (UV) writing: only shows when the fuse box powers the blacklight
    var uv = cvs(512, 256, function (c, w, h) { c.clearRect(0, 0, w, h); c.shadowColor = '#c084fc'; c.shadowBlur = 20; c.fillStyle = '#e9d5ff'; c.font = '110px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(S[3], 150, h / 2); c.font = F(150); c.fillText('= ' + code[3], 340, h / 2); });
    var um = texPlane(1.8, 0.9, uv.tex, { transparent: true }); um.material.blending = T.AdditiveBlending; um.material.depthWrite = false; um.position.set(BASE.minX + 0.04, 2.6, 115.8); um.rotation.y = Math.PI / 2; R.base.add(um); A.noAud(um); bs.uvMsg = um; um.material.opacity = 0;
    var marq = cvs(1024, 200, function (c, w, h) { c.fillStyle = '#0b0618'; rr(c, 4, 4, w - 8, h - 8, 24); c.fill(); c.strokeStyle = '#ff4fd8'; c.lineWidth = 8; c.stroke(); glowText(c, 'SECRET ARCADE', w / 2, 82, 96, '#3ff0ff', w - 60); c.font = F(36); c.fillStyle = '#ffe14d'; c.textAlign = 'center'; c.fillText('est. 1983 \u00b7 rare cabinets \u00b7 rare prizes', w / 2, 160); });
    bs.marquee = wallSign('base', 'SECRET ARCADE marquee', 4.6, 0.9, marq.tex, -0.6, 3.15, BASE.maxZ - 0.03, Math.PI);
  }
  function buildBaseDecor() {
    // stairs up (south wall)
    stairDoor('base', 0, BASE.minZ, 0, 'STAIRS \u2191 FOOD', 'Stairs up to the Food Court', 'bs_stairs', 'food', '#4a3426');
    // old couch + rug + crates + boxes
    var rug = add(R.base, new T.CircleGeometry(2.2, 40), new T.MeshLambertMaterial({ color: '#5a1f4a' }), -2.6, 0.012, 108.6); rug.rotation.x = -Math.PI / 2; A.noAud(rug); // the couch sits on it, so it's not an audited decal
    var c2 = prop('base', 'Old basement couch', -1.0, 108.6, -Math.PI / 2); add(c2, bx(2.2, 0.45, 0.9), ph('#6b4a32', 15), 0, 0.22, 0); add(c2, bx(2.2, 0.6, 0.25), ph('#6b4a32', 15), 0, 0.62, -0.33); [-1.05, 1.05].forEach(function (x) { add(c2, bx(0.2, 0.62, 0.9), ph('#5a3c28', 15), x, 0.42, 0); }); add(c2, bx(0.4, 0.06, 0.4), ph('#8a6a4a', 15), 0.5, 0.47, 0.05).rotation.y = 0.4;
    reg(c2, 'prop'); solidOf(c2, 0.02);
    var crs = prop('base', 'Crate stack', 4.3, 106.9, 0);
    [[-0.3, -0.4, 0.1, 0], [0.5, 0.4, -0.2, 0], [0.0, 0.0, 0.3, 0.8]].forEach(function (q, i) { var cr = new T.Group(); cr.position.set(q[0], q[3], q[1]); cr.rotation.y = q[2]; crs.add(cr); add(cr, bx(0.8, 0.8, 0.8), ph('#9a6b3e', 15), 0, 0.4, 0); for (var k = 0; k < 2; k++) add(cr, bx(0.82, 0.08, 0.82), ph('#6b4a28', 15), 0, 0.12 + k * 0.56, 0);
      var lb = cvs(256, 128, function (c, w, h) { c.fillStyle = '#9a6b3e'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2a1a10'; c.lineWidth = 6; c.strokeRect(20, 20, w - 40, h - 40); c.fillStyle = '#2a1a10'; c.font = F(30); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(['TOKENS', 'SPARE PARTS', 'FRAGILE!'][i], w / 2, h / 2); }); var lp = texPlane(0.6, 0.3, lb.tex); lp.position.set(0, 0.42, 0.42); cr.add(lp); });
    reg(crs, 'prop'); solidOf(crs, 0.03);
    // marked boxes of old tokens, a mop bucket, a space heater
    var mb = prop('base', 'Mop bucket', 9.9, 113.8, 0); add(mb, cy(0.25, 0.22, 0.4, 18), ph('#ffd23f', 40), 0, 0.2, 0); add(mb, cy(0.012, 0.012, 1.4, 6), ph('#8a5a2b', 20), 0.08, 0.75, 0).rotation.z = 0.2; add(mb, sp(0.14, 10), ph('#e8e0cc', 10), 0.22, 0.12, 0).scale.set(1, 0.5, 1); reg(mb, 'prop'); solidBox(mb.name, 9.6, 10.3, 113.5, 114.1);
    var hx = prop('base', 'Space heater', 9.9, 108.2, -Math.PI / 2); add(hx, bx(0.5, 0.6, 0.25), ph('#d8cfb4', 30), 0, 0.3, 0); for (var k = 0; k < 4; k++) add(hx, bx(0.4, 0.03, 0.02), new T.MeshBasicMaterial({ color: '#ff6a2a' }), 0, 0.15 + k * 0.1, 0.13); reg(hx, 'prop'); solidBox(hx.name, 9.7, 10.1, 107.9, 108.5);
    // the three rare cabinets (west wall) + the out-of-order one
    bs.cabs = [];
    retroCab({ id: 'rt_pong', name: 'Retro cabinet: Paddle Pong', title: 'PADDLE PONG', year: '1972', x: BASE.minX + 0.45, z: 104.6, ry: Math.PI / 2, wood: '#6b3f22', panel: '#2b2b36', glow: '#ffffff', m1: '#ffffff', m2: '#9aa3b2', desc: 'The original! Bounce the ball past the CPU paddle. Super rare.' });
    retroCab({ id: 'rt_invaders', name: 'Retro cabinet: Galaxy Groks', title: 'GALAXY GROKS', year: '1978', x: BASE.minX + 0.45, z: 107.6, ry: Math.PI / 2, wood: '#2b1b3a', panel: '#c0392b', glow: '#4ade80', m1: '#7c3aed', m2: '#3ff0ff', desc: 'Rows of Grok invaders march down. Blast them before they land!' });
    retroCab({ id: 'rt_broken', name: 'Retro cabinet: out of order', title: 'MYSTERY', year: '1981', x: BASE.minX + 0.45, z: 110.6, ry: Math.PI / 2, wood: '#4a3426', panel: '#555', glow: '#666666', m1: '#555', m2: '#999', broken: true });
    retroCab({ id: 'rt_lock', name: 'Retro cabinet: Lock & Key', title: 'LOCK & KEY', year: '1983', x: BASE.minX + 0.45, z: 113.6, ry: Math.PI / 2, wood: '#5a3a22', panel: '#ffd23f', glow: '#ffd23f', m1: '#ffd23f', m2: '#ff7a3d', desc: 'Gus\u2019s own game: pick 5 locks against the clock. It\u2019s bonus game #20 Lockpick Panic in its rare original cabinet!' });
  }
  function buildBasement() {
    mkRoot('base'); GA.Hub.addRegion(BASE);
    buildBaseShell(); buildBaseDecor(); buildPinball(); buildFuseBox(); buildSafe(); buildVault(); buildJukebox(); buildGusDesk(); buildPosters(); fillVault();
    ANIM.base.push(function (t, dt) {
      var kk = Math.floor(t * 8); if (kk !== bs.lastK) { bs.lastK = kk; bs.cabs.forEach(function (o) { drawRetro(o, t); }); if (kk % 4 === 0) drawFuse(); drawJuke(t); }
      var fs = AR.fuseState().solved;
      bs.bulbs.forEach(function (b, i) { var on = fs || b.on, fl = !fs && i < 2 && Math.sin(t * 23 + i * 7) > 0.93; b.b.visible = on && !fl; b.g.visible = on && !fl; });
      bs.lamp1.intensity = fs ? 1.1 : (Math.sin(t * 23) > 0.93 ? 0.2 : 0.75); bs.lamp2.intensity = fs ? 1.1 : 0; bs.uv.intensity = fs ? 1.2 : 0;
      bs.uvMsg.material.opacity = fs ? 0.75 + Math.sin(t * 2) * 0.2 : 0;
      bs.pinLights.forEach(function (l, i) { l.material.color.set((Math.floor(t * 6) + i) % 3 ? '#3a2a10' : '#ffe14d'); });
      bs.dial.rotation.y = Math.sin(t * 0.4) * 0.3;
      bs.vaultSpots.forEach(function (pd, i) { pd.rotation.y = t * 0.6 + i; if (pd.userData.m && pd.userData.m.userData.tick) pd.userData.m.userData.tick(t); });
      var M = GA.AreasUI && GA.AreasUI.music ? GA.AreasUI.music() : { on: false, beat: 0 }; bs.juke.arch.material.color.setHSL(((M.on ? M.beat * 0.1 : t * 0.05) % 1), 0.9, 0.55);
      bs.juke.tubes.forEach(function (tb, i) { tb.material.color.setHSL(((t * 0.2 + i * 0.5) % 1), 0.9, 0.6); });
    });
  }
  function drawJuke(t) { var c = bs.juke.win.g, w = 256, h = 256, M = GA.AreasUI && GA.AreasUI.music ? GA.AreasUI.music() : { on: false }; var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a0d14'); gr.addColorStop(1, '#120408'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.save(); c.translate(w / 2, h / 2 + 10); c.rotate(M.on ? t * 4 : 0); c.fillStyle = '#111'; c.beginPath(); c.arc(0, 0, 80, 0, 7); c.fill(); c.strokeStyle = '#333'; for (var r2 = 30; r2 < 80; r2 += 8) { c.beginPath(); c.arc(0, 0, r2, 0, 7); c.stroke(); } c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(0, 0, 24, 0, 7); c.fill(); c.fillStyle = '#c0392b'; c.fillRect(-3, -20, 6, 14); c.restore();
    c.font = F(22); c.fillStyle = '#ffe9a8'; c.textAlign = 'center'; c.fillText(M.on ? M.name : 'PICK A SONG', w / 2, 26); bs.juke.win.tex.needsUpdate = true; }

  /* =====================================================================================================
     LOGIC: weekly key + unlock, fuse box, safe code, party schedule, snacks + boosts, travel between areas
     ===================================================================================================== */
  AR._now = null; // tests can pin the clock: GA.Areas._now = Date.parse('2026-10-20')
  function now() { return AR._now != null ? AR._now : Date.now(); }
  function isoWeek(ms) { var d0 = new Date(ms), d = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth(), d0.getUTCDate())), day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day);
    var y = d.getUTCFullYear(), w = Math.ceil(((d - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7); return { y: y, w: w, key: y + '-W' + (w < 10 ? '0' : '') + w }; }
  AR.isoWeek = isoWeek; AR.week = function () { return isoWeek(now()); };
  function rng(seed) { var s2 = (seed * 2654435761) >>> 0 || 1; return function () { s2 ^= s2 << 13; s2 >>>= 0; s2 ^= s2 >>> 17; s2 ^= s2 << 5; s2 >>>= 0; return s2 / 4294967296; }; }
  function wkSeed() { var w = AR.week(); return w.y * 100 + w.w; }
  /* Gus's key: ten hiding spots around the arcade; which one is used comes from the ISO week number (UTC), so it's the same for everyone,
     and it always moves to a different spot the next week (step 7 of 10 never repeats back-to-back). */
  AR.KEY_SPOTS = [
    { id: 'couch', area: 'main', x: -16.2, z: 1.7, name: 'behind the comfy couch', hint: 'I sat on that comfy couch by the wall for ONE minute. Now my key is gone. Couches eat things.' },
    { id: 'booth', area: 'main', x: -16.6, z: 9.7, name: 'by the Suggestion Booth', hint: 'Somebody SUGGESTED I keep my key in my pocket. Near that booth. Very funny.' },
    { id: 'ticket', area: 'bonus', x: 7.0, z: -10.0, name: 'by the Ticket Machine', hint: 'I was counting tickets at the Ticket Machine and... jingle, jingle, gone.' },
    { id: 'antenna', area: 'main', x: 1.4, z: -1.2, name: 'at the foot of the big antenna', hint: 'Gary was fixing that giant antenna. I bet he kicked my key somewhere under it.' },
    { id: 'beanbag', area: 'bonus', x: 13.3, z: 8.6, name: 'next to the bean bags', hint: 'Kids flop on those bean bags in the Bonus Zone all day. Things fall out of pockets. MY things.' },
    { id: 'statue', area: 'hall', x: 11.0, z: 23.2, name: 'behind the Golden Joystick', hint: 'I polished the Golden Joystick statue and set my key down behind it. Then I forgot. Don\u2019t tell anyone.' },
    { id: 'firewood', area: 'food', x: -16.0, z: 21.6, name: 'by Chef Gio\u2019s firewood', hint: 'Gio borrowed me for firewood duty. My key is probably next to his wood pile. Smells like pizza now.' },
    { id: 'bins', area: 'food', x: 0.0, z: 18.4, name: 'by the Food Court bins', hint: 'I tossed my lunch in the Food Court bins. I hope I didn\u2019t toss the key too. Check NEXT to them. Not in them.' },
    { id: 'dj', area: 'roof', x: 4.4, z: -119.4, name: 'by DJ Byte\u2019s speakers', hint: 'That robot DJ on the roof played music so loud my key jumped out of my pocket. Near the speakers.' },
    { id: 'prizes', area: 'main', x: -9.8, z: 10.4, name: 'at the end of the Prize Counter', hint: 'I was guarding the Prize Counter. My key is right under my nose, apparently. The left end.' }];
  AR.keyHint = function () { return AR.keySpot().hint; };
  AR.keySpotIndex = function (ms) { var w = isoWeek(ms != null ? ms : now()); return ((w.w * 7 + w.y * 3) % AR.KEY_SPOTS.length + AR.KEY_SPOTS.length) % AR.KEY_SPOTS.length; };
  AR.keySpot = function (ms) { return AR.KEY_SPOTS[AR.keySpotIndex(ms)]; };
  function S(k, d) { var v = GA.store.get('ar.' + k); return v == null ? d : v; }
  function SS(k, v) { GA.store.set('ar.' + k, v); }
  AR.get = S; AR.set = SS;
  AR.hasKey = function () { return S('keyWk', '') === AR.week().key; };
  AR.unlocked = function () { var wk = AR.week().key; return S('openWk', '') === wk || AR.hasKey(); };
  AR.unlock = function (how) { SS('openWk', AR.week().key); SS('openHow', how); if (GA.Prog) GA.Prog.event(how === 'key' ? 'bsKey' : 'bsPick'); };
  AR.takeKey = function () { if (AR.hasKey()) return false; SS('keyWk', AR.week().key); AR.unlock('key'); placeKey(); return true; };
  AR.pickCooldown = function () { return Math.max(0, Math.ceil((S('pickFailT', 0) + 20000 - now()) / 1000)); };
  AR.pickFailed = function () { SS('pickFailT', now()); };
  // fuse box: a 4x4 "lights out" board (tap a breaker = it + its neighbours flip). Scrambled from solved with week-seeded taps, so always solvable.
  function fuseLoad() { var wk = AR.week().key, f = S('fuse', null); if (f && f.wk === wk) return f; var r = rng(wkSeed() + 17), g = []; for (var i = 0; i < 16; i++) g.push(true);
    var n = 0; while (n < 5) { var k = Math.floor(r() * 16); flip(g, k); n++; } if (g.every(Boolean)) flip(g, 5); f = { wk: wk, grid: g, solved: false, moves: 0 }; SS('fuse', f); return f; }
  function flip(g, k) { var x = k % 4, y = Math.floor(k / 4); [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var nx = x + d[0], ny = y + d[1]; if (nx >= 0 && nx < 4 && ny >= 0 && ny < 4) g[ny * 4 + nx] = !g[ny * 4 + nx]; }); }
  AR.fuseState = function () { return fuseLoad(); };
  AR.fusePress = function (k) { var f = fuseLoad(); if (f.solved) return f; flip(f.grid, k); f.moves++; if (f.grid.every(Boolean)) { f.solved = true; GA.addTickets(25); if (GA.onTickets) GA.onTickets(GA.getTickets()); if (GA.Prog) GA.Prog.event('bsFuse'); f.reward = 25; } SS('fuse', f); drawFuse(); return f; };
  AR.fuseSolution = function () { // for tests / hints: brute force (2^16) the taps that solve it
    var f = fuseLoad(); for (var m = 0; m < 65536; m++) { var g = f.grid.slice(); for (var k = 0; k < 16; k++) if (m >> k & 1) flip(g, k); if (g.every(Boolean)) { var out = []; for (k = 0; k < 16; k++) if (m >> k & 1) out.push(k); return out; } } return null; };
  // the code safe: 4 digits that change weekly; 3 are on posters, the 4th is UV paint that only shows with the fuse box fixed
  AR.SAFE_SYMS = ['\uD83C\uDF55', '\uD83D\uDD79\uFE0F', '\uD83C\uDF86', '\u2B50'];
  AR.safeCode = function () { var r = rng(wkSeed() + 99); return [0, 1, 2, 3].map(function () { return Math.floor(r() * 10); }); };
  AR.trySafe = function (str) { var code = AR.safeCode().join(''); if (String(str) !== code) return { ok: false };
    var wk = AR.week().key; if (S('safeWk', '') === wk) return { ok: true, again: true };
    SS('safeWk', wk); var first = GA.Prog && !GA.Prog.owns('gold_key'), tix = first ? 50 : 30; GA.addTickets(tix); if (GA.onTickets) GA.onTickets(GA.getTickets());
    if (first && GA.Prog.grant) GA.Prog.grant('gold_key'); if (GA.Prog) GA.Prog.event('bsSafe'); return { ok: true, tix: tix, prize: first ? 'gold_key' : null }; };
  /* party schedule (local day of the week) */
  AR.SCHEDULE = [
    { day: 'MON', icon: '\uD83C\uDF55', name: 'Snack Attack', what: 'Snack Bar: everything half price' },
    { day: 'TUE', icon: '\uD83C\uDFA7', name: 'Tune Tuesday', what: 'DJ Byte plays the secret track' },
    { day: 'WED', icon: '\uD83D\uDC83', name: 'Dance-Off', what: 'Dance 20 s on the floor = 15 tickets' },
    { day: 'THU', icon: '\uD83D\uDD79\uFE0F', name: 'Throwback Thursday', what: 'Basement retro games pay x2' },
    { day: 'FRI', icon: '\uD83C\uDF89', name: 'PARTY NIGHT', what: '+50% bonus tickets, fireworks, free Party Hat' },
    { day: 'SAT', icon: '\uD83C\uDF89', name: 'PARTY NIGHT', what: '+50% bonus tickets, fireworks, free Party Hat' },
    { day: 'SUN', icon: '\uD83C\uDF66', name: 'Chill Sunday', what: 'Free Fizzy Grok Pop at the Snack Bar' }];
  AR.party = function () { var d = new Date(now()), dow = (d.getDay() + 6) % 7, night = dow === 4 || dow === 5;
    return { dow: dow, today: AR.SCHEDULE[dow], night: night, claimed: S('partyWk', '') === AR.week().key, nextText: night ? 'tonight!' : (dow === 6 ? 'Friday (5 days)' : 'Friday (' + (4 - dow) + ' day' + (4 - dow === 1 ? '' : 's') + ')') }; };
  AR.claimParty = function () { var P2 = AR.party(); if (!P2.night) return { ok: false, why: 'not tonight' }; if (P2.claimed) return { ok: false, why: 'claimed' };
    SS('partyWk', AR.week().key); GA.addTickets(30); if (GA.onTickets) GA.onTickets(GA.getTickets()); var hat = GA.Prog && !GA.Prog.owns('party_hat'); if (hat && GA.Prog.grant) GA.Prog.grant('party_hat'); if (GA.Prog) GA.Prog.event('partyClaim'); return { ok: true, tix: 30, hat: hat }; };
  /* snacks + boosts (GA.Boost is read by the hub for speed and by the mini game framework at game over) */
  GA.SNACKS = [
    { id: 'pizza', icon: '\uD83C\uDF55', name: 'Pizza Slice', tix: 15, coins: 3, boostShort: 'x2 tickets next bonus game', kind: 'mult', v: 2 },
    { id: 'slushie', icon: '\uD83E\uDD64', name: 'Turbo Slushie', tix: 10, coins: 2, boostShort: 'Run 50% faster for 2 min', kind: 'speed', secs: 120 },
    { id: 'icecream', icon: '\uD83C\uDF66', name: 'Sugar Rush Cone', tix: 12, coins: 2, boostShort: '+5 tickets for 3 games', kind: 'add', v: 5, games: 3 },
    { id: 'nachos', icon: '\uD83E\uDDC0', name: 'Lucky Nachos', tix: 8, coins: 2, boostShort: 'Next game pays 10+', kind: 'min', v: 10 },
    { id: 'soda', icon: '\uD83E\uDEE7', name: 'Fizzy Grok Pop', tix: 5, coins: 1, boostShort: 'Big burp + confetti!', kind: 'fun' }];
  AR.coins = function () { return S('coins', 0); };
  AR.addCoins = function (n) { SS('coins', Math.max(0, AR.coins() + n)); return AR.coins(); };
  AR.snackPrice = function (s) { var P2 = AR.party(); if (P2.dow === 0) return { tix: Math.ceil(s.tix / 2), coins: Math.max(1, Math.ceil(s.coins / 2)) }; if (P2.dow === 6 && s.id === 'soda') return { tix: 0, coins: 0 }; return { tix: s.tix, coins: s.coins }; };
  function boosts() { var b = S('boosts', null); if (!b) b = { next: [], speedUntil: 0 }; return b; }
  function saveB(b) { SS('boosts', b); }
  AR.buySnack = function (id, pay) {
    var s2 = GA.SNACKS.find(function (x) { return x.id === id; }); if (!s2) return { ok: false, why: 'unknown' };
    var pr = AR.snackPrice(s2);
    if (pay === 'coins') { if (AR.coins() < pr.coins) return { ok: false, why: 'coins', need: pr.coins - AR.coins() }; AR.addCoins(-pr.coins); }
    else if (pr.tix > 0) { if (GA.getTickets() < pr.tix) return { ok: false, why: 'tickets', need: pr.tix - GA.getTickets() }; if (!GA.spendTickets(pr.tix)) return { ok: false, why: 'tickets' }; }
    AR.giveBoost(s2); if (GA.Prog) GA.Prog.event('fcSnack'); return { ok: true, snack: s2, price: pr };
  };
  AR.giveBoost = function (s2) { var b = boosts();
    if (s2.kind === 'speed') b.speedUntil = Math.max(now(), b.speedUntil || 0) + s2.secs * 1000;
    else if (s2.kind !== 'fun') b.next.push({ id: s2.id, icon: s2.icon, name: s2.name, kind: s2.kind, v: s2.v, games: s2.games || 1 });
    saveB(b); };
  AR.boosts = function () { var b = boosts(); return { next: b.next.slice(), speedLeft: Math.max(0, Math.ceil(((b.speedUntil || 0) - now()) / 1000)) }; };
  AR.clearBoosts = function () { saveB({ next: [], speedUntil: 0 }); };
  var RETRO = { rt_pong: 1, rt_invaders: 1, lockpick: 0 };
  GA.Boost = {
    speed: function () { var b = boosts(); return (b.speedUntil || 0) > now() ? 1.5 : 1; },
    onGameOver: function (id, tix) {
      var out = tix, lbl = [], P2 = AR.party(), b = boosts();
      if (P2.night) { out = Math.ceil(out * 1.5); lbl.push('\uD83C\uDF89 Party Night +50%'); }
      if (P2.dow === 3 && RETRO[id]) { out *= 2; lbl.push('\uD83D\uDD79\uFE0F Throwback x2'); }
      if (b.next.length) { var x = b.next[0];
        if (x.kind === 'mult') { out = out * x.v; lbl.push(x.icon + ' x' + x.v); }
        else if (x.kind === 'add') { out += x.v; lbl.push(x.icon + ' +' + x.v); }
        else if (x.kind === 'min') { if (out < x.v) out = x.v; lbl.push(x.icon + ' lucky ' + x.v + '+'); }
        x.games--; if (x.games <= 0) b.next.shift(); saveB(b); }
      return out > tix || lbl.length ? { tix: out, label: lbl.length ? '(' + lbl.join(', ') + ')' : '' } : null;
    }
  };
  /* cooking with Chef Gio: result 'perfect' | 'good' | 'burnt' -> coins + a Chef's Special boost; the oven needs 60 s to heat up again */
  AR.cookReady = function () { return Math.max(0, Math.ceil((S('cookT', 0) + 60000 - now()) / 1000)); };
  AR.cookResult = function (q) { if (AR.cookReady() > 0) return { ok: false, why: 'hot', wait: AR.cookReady() }; SS('cookT', now());
    var coins = q === 'perfect' ? 3 : q === 'good' ? 2 : 1; AR.addCoins(coins);
    if (q === 'perfect') AR.giveBoost({ id: 'special', icon: '\uD83D\uDC68\u200D\uD83C\uDF73', name: 'Chef\u2019s Special', kind: 'mult', v: 3 }); else if (q === 'good') AR.giveBoost({ id: 'special', icon: '\uD83D\uDC68\u200D\uD83C\uDF73', name: 'Chef\u2019s Special', kind: 'mult', v: 2 });
    if (GA.Prog) { GA.Prog.event('fcCook'); if (q === 'perfect') GA.Prog.event('fcPerfect'); }
    AR.chefCook(3); return { ok: true, coins: coins, total: AR.coins(), q: q }; };

  /* ---------- the hidden key (a real little 3D brass key that sparkles; one spot per week) ---------- */
  var KEY = {};
  function buildKey() {
    var g = new T.Group(); g.name = 'Gus\u2019s key'; A.scene.add(g); A.noAud(g); var brass = gold();
    add(g, to(0.07, 0.022, 7, 20), brass, 0, 0, 0); add(g, cy(0.016, 0.016, 0.22, 10), brass, 0, -0.17, 0); add(g, bx(0.05, 0.03, 0.018), brass, 0.025, -0.24, 0); add(g, bx(0.035, 0.025, 0.018), brass, 0.02, -0.2, 0);
    var tag = add(g, cy(0.05, 0.05, 0.012, 16), ph('#ff4fd8', 40), 0.06, 0.09, 0); tag.rotation.x = Math.PI / 2;
    var inner = new T.Group(); inner.add(g.children.slice()[0]); // (keep children; inner pivot below)
    g.children.slice().forEach(function (c) { inner.add(c); }); g.add(inner); inner.rotation.z = -Math.PI / 2; inner.position.y = 0.06;
    var sp1 = glowSprite('#ffe14d', 0.9, 0.55); sp1.position.y = 0.08; g.add(sp1); KEY.g = g; KEY.inner = inner; KEY.sp = sp1;
    KEY.cab = { game: { id: 'key', name: 'Gus\u2019s Key', desc: '', color: '#ffe14d' }, kind: 'ar_key', id: 'ar_key', group: g, x: 0, z: 0, rot: 0, front: new T.Vector3(), dir: new T.Vector3(0, 0, 1), glow: new T.MeshBasicMaterial({ transparent: true, opacity: 0 }), nextDraw: Infinity, r: 1.1, ar: true, data: {}, area: 'any' };
    A.cabinets.push(KEY.cab); CABS.ar_key = KEY.cab; placeKey();
  }
  function placeKey() { if (!KEY.g || !AR.KEY_SPOTS.length) return; var sp = AR.keySpot(), taken = AR.hasKey(); KEY.spot = sp;
    KEY.g.position.set(sp.x, sp.y || 0.05, sp.z); KEY.g.visible = !taken; KEY.cab.x = sp.x; KEY.cab.z = sp.z; KEY.cab.front.set(sp.x, 0, sp.z); KEY.cab.disabled = taken; KEY.cab.r = 1.1; KEY.cab.noStand = !!sp.noStand;
    var a = new T.Object3D(); a.position.set(sp.x, 0, sp.z - 1.75); KEY.cab.group = a; a.updateMatrixWorld(true); KEY.wk = AR.week().key; }
  AR.placeKey = placeKey; AR.keyMesh = function () { return KEY.g; };

  /* ---------- travel between areas (elevator / stairs / basement door) with a quick fade ---------- */
  function goTo(x, z, vx, vz) { GA.Hub.setPlayer(x, z); GA.Hub.setFace(Math.atan2(vx, vz)); GA.Hub.cameraYaw(Math.atan2(-vx, -vz)); }
  AR.ARRIVE = {
    roof: function () { goTo(ROOF.spawn.x, ROOF.spawn.z, 0, -1); },
    basement: function () { goTo(BASE.spawn.x, BASE.spawn.z, 0, 1); },
    food_elev: function () { var c = CABS.fc_elevator; goTo(c.x + 0.6, c.z, 1, 0); },
    food_stairs: function () { var c = CABS.fc_stairs; goTo(c.x + 0.6, c.z, 1, 0); },
    food_base: function () { var c = CABS.fc_basement; goTo(c.x - 0.6, c.z, -1, 0); }
  };
  AR.travel = function (where, cb) {
    var f = document.getElementById('fade'); if (f) f.classList.add('on'); GA.Hub.setLock(true); if (GA.Audio) GA.Audio.play(where === 'roof' ? 'win' : 'click');
    setTimeout(function () { (AR.ARRIVE[where] || AR.ARRIVE.food_elev)(); GA.Hub.setLock(false); GA.Hub.clearInput(); tick(true); if (f) setTimeout(function () { f.classList.remove('on'); }, 120); if (cb) cb(); }, AR.fast ? 30 : 450);
  };

  /* ---------- per-frame: show only the area you're in (+ the food court from the main hall), area fog, animations ---------- */
  var FOGS = { main: ['#140a2b', 22, 48], roof: ['#1a0b45', 30, 75], basement: ['#0d0812', 9, 26] }, lastT = 0, curArea = null;
  function tick(force) {
    var p = A.pose(), area = GA.Hub.regionAt(p.x, p.z);
    var lf = area === 'food' || (area !== 'roof' && area !== 'basement' && p.z > 1), lr = area === 'roof', lb = area === 'basement';
    if (force || lf !== live.food) { live.food = lf; R.food.visible = lf; }
    if (force || lr !== live.roof) { live.roof = lr; R.roof.visible = lr; }
    if (force || lb !== live.base) { live.base = lb; R.base.visible = lb; }
    if (area !== curArea) { var prev = curArea; curArea = area; var fg = FOGS[area] || FOGS.main; if (A.scene.fog && (area === 'roof' || area === 'basement' || prev === 'roof' || prev === 'basement')) { A.scene.fog.near = fg[1]; A.scene.fog.far = fg[2]; A.scene.fog.color.set(fg[0]); A.renderer().setClearColor(fg[0]); }
      if (GA.Prog) { if (area === 'food') GA.Prog.event('fcVisit'); if (area === 'roof') GA.Prog.event('rfVisit'); if (area === 'basement') GA.Prog.event('bsVisit'); }
      if (AR.onArea) AR.onArea(area, prev); }
    return area;
  }
  AR.live = function () { return { food: live.food, roof: live.roof, base: live.base, area: curArea }; };
  function frame(t) {
    var dt = Math.min(0.05, Math.max(0, t - lastT)); lastT = t; tick(false);
    if (live.food) ANIM.food.forEach(function (f) { f(t, dt); });
    if (live.roof) ANIM.roof.forEach(function (f) { f(t, dt); });
    if (live.base) ANIM.base.forEach(function (f) { f(t, dt); });
    // ELEVATOR doors slide open when you're near
    for (var k in ELEV) { var e = ELEV[k], nr = GA.Hub.near() === e.cab; e.open += ((nr ? 1 : 0) - e.open) * Math.min(1, dt * 4); e.dl.position.x = -0.4 - e.open * 0.36; e.dr.position.x = 0.4 + e.open * 0.36; }
    // the key bobs + spins + sparkles (and jumps to its new spot when the week changes)
    if (KEY.g) { if (KEY.wk !== AR.week().key || KEY.g.visible === AR.hasKey()) placeKey(); KEY.inner.rotation.y = t * 2; KEY.g.position.y = (KEY.spot.y || 0.05) + Math.abs(Math.sin(t * 2.4)) * 0.08; KEY.sp.material.opacity = 0.35 + Math.abs(Math.sin(t * 3)) * 0.4; }
    if (GA.AreasUI && GA.AreasUI.frame) GA.AreasUI.frame(t, dt, curArea);
  }

  /* ---------- build everything into the hub ---------- */
  AR.build = function (api) {
    A = api; buildFoodCourt(); buildRoof(); buildBasement(); buildKey();
    R.roof.visible = false; R.base.visible = false; drawSchedule();
    A.anims.push(frame);
    AR.built = true;
  };
})();
