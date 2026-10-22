/* Grok Arcade - TORTUGA REMASTER WORKS (David's idea, Oct 21 2026): the place for remasters, sequels and quality-of-life fixes.
   Run by Martina "Torty" and Tortuga Tech Inc.; the big Remaster Machine's electronics are by Ratita Industries.
   Far-away walk-in region (x 120..146, z -14..12), reached through the Remaster Works door on the Records Annex back wall
   (x 15, z 48) or from the quick menu. The machine's panel (submit / my tickets / board / shelf) lives in js/remaster-ui.js.
   Smart performance: the whole room is one group that is hidden unless you're inside, repeated props are instanced. */
(function () {
  'use strict';
  var T = THREE, RW = GA.Remaster = {}, A, ROOT, DOOR, FX = { bots: [], vis: [], screens: [] };
  var B = RW.B = { name: 'remaster', minX: 120, maxX: 146, minZ: -14, maxZ: 12, maxY: 6, H: 5.2, spawn: { x: 122.6, z: -1 } };
  RW.DOOR = { x: 5.4, z: 62.4 }; // the express pod in the Grand Gallery
  var mats = {}, G = {};
  function ph(c, s, e) { var k = c + '|' + (s || 30) + '|' + (e || ''); return mats[k] || (mats[k] = new T.MeshPhongMaterial({ color: c, shininess: s || 30, emissive: e ? new T.Color(e) : new T.Color(0) })); }
  function gl(c) { var k = 'g' + c; return mats[k] || (mats[k] = new T.MeshBasicMaterial({ color: c })); }
  function geo(k, f) { return G[k] || (G[k] = f()); }
  function bx(w, h, d) { return geo('b' + w + ',' + h + ',' + d, function () { return new T.BoxGeometry(w, h, d); }); }
  function cy(a, b, h, s) { return geo('c' + a + ',' + b + ',' + h + ',' + (s || 16), function () { return new T.CylinderGeometry(a, b, h, s || 16); }); }
  function sp(r, s) { return geo('s' + r + ',' + (s || 16), function () { return new T.SphereGeometry(r, s || 16, Math.max(8, Math.round((s || 16) * 0.7))); }); }
  function to(r, t, s) { return geo('t' + r + ',' + t + ',' + (s || 24), function () { return new T.TorusGeometry(r, t, 8, s || 24); }); }
  function add(p, g, m, x, y, z) { var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); p.add(o); return o; }
  function grp(name, x, z, ry, par) { var g = new T.Group(); g.name = name; g.position.set(x || 0, 0, z || 0); g.rotation.y = ry || 0; (par || ROOT).add(g); return g; }
  function reg(g, kind) { g.updateMatrixWorld(true); return A.regItem(g.name, kind || 'prop', g); }
  function solidOf(g, pad) { g.updateMatrixWorld(true); var b = new T.Box3(), tmp = new T.Box3(); g.traverse(function (o) { if (!o.isMesh || o.isInstancedMesh) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); b.union(tmp); }); pad = pad || 0; A.addSolid(b.min.x - pad, b.max.x + pad, b.min.z - pad, b.max.z + pad, g.name); return b; }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function F(px) { return 'bold ' + px + 'px "Trebuchet MS",system-ui,sans-serif'; }
  function fit(g, s, maxW, px) { g.font = F(px); while (g.measureText(s).width > maxW && px > 8) { px -= 2; g.font = F(px); } return px; }
  function txt(g, s, x, y, px, col, maxW, glow) { fit(g, s, maxW || 9999, px); g.textAlign = 'center'; g.textBaseline = 'middle'; if (glow) { g.shadowColor = col; g.shadowBlur = px * 0.3; } g.fillStyle = col; g.fillText(s, x, y); g.shadowBlur = 0; }
  function cvs(w, h, draw) { var c = A.mkCanvas(w, h), g = c.getContext('2d'); draw(g, w, h); return { c: c, g: g, tex: A.canvasTex(c) }; }
  /* a canvas picture whose plane follows the canvas's own shape (never stretched) */
  function panel(par, cw, chh, pw, draw, x, y, z, ry, o) { var t = cvs(cw, chh, draw), m = new T.Mesh(new T.PlaneGeometry(pw, pw * chh / cw), new T.MeshBasicMaterial({ map: t.tex, transparent: !!(o && o.transparent) })); m.position.set(x, y, z); m.rotation.y = ry || 0; par.add(m); m.userData.cv = t; return m; }
  function inst(par, g, m, list, name) { var im = new T.InstancedMesh(g, m, list.length), o = new T.Object3D(); im.name = name;
    list.forEach(function (q, i) { o.position.set(q[0], q[1], q[2]); o.rotation.set(q[7] || 0, q[3] || 0, q[8] || 0); o.scale.set(q[4] || 1, q[5] || q[4] || 1, q[6] || q[4] || 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.instanceMatrix.needsUpdate = true; par.add(im); A.noAud(im); return im; }
  function pet(id, par, x, y, z, ry, s) { if (!GA.Prize3D || !GA.Prize3D.build) return null; var m = GA.Prize3D.build(id); m.position.set(x, y, z); m.rotation.y = ry || 0; m.scale.setScalar(s || 1); par.add(m); A.noAud(m); return m; }
  function inter(o) { // same shape as the hub's cabinets so the walk-up prompt + button just work
    var dir = new T.Vector3(o.dir[0], 0, o.dir[1]).normalize(), par = o.par || ROOT;
    var gm = new T.MeshBasicMaterial({ map: A.glowTex, color: o.col || '#4ade80', transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending });
    var fl = add(par, new T.PlaneGeometry(o.gw || 1.6, o.gh || 1.3), gm, o.x, 0.03, o.z); fl.rotation.x = -Math.PI / 2; fl.renderOrder = 2; A.noAud(fl);
    var an = new T.Object3D(); an.name = 'anchor ' + o.id; an.position.set(o.x - dir.x * 1.75, 0, o.z - dir.z * 1.75); an.rotation.y = Math.atan2(dir.x, dir.z); par.add(an); an.updateMatrixWorld(true);
    var cab = { game: { id: o.id, name: o.name, desc: o.desc || '', color: o.col || '#4ade80' }, kind: o.kind, id: o.id, group: an, x: o.x, z: o.z, rot: an.rotation.y, front: new T.Vector3(o.x, 0, o.z), dir: dir, glow: gm, nextDraw: Infinity, r: o.r || 1.2, ar: true, area: 'remaster', data: o.data || {} };
    A.cabinets.push(cab); RW.cabs[o.id] = cab; return cab;
  }
  RW.cabs = {};
  var GREEN = '#4ade80', TEAL = '#2dd4bf', SAND = '#e9c46a', RAT = '#ff4fd8';

  /* ---------- speech bubbles (Torty + a robot) ---------- */
  function bubble(par, y, ink) {
    var c = A.mkCanvas(512, 200), t = A.canvasTex(c); t.minFilter = T.LinearFilter; t.generateMipmaps = false;
    var s = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false })); s.scale.set(2.4, 0.94, 1); s.position.set(0, y, 0); s.visible = false; s.renderOrder = 10; par.add(s); A.noAud(s);
    var b = { s: s, c: c, t: t, T: 0, last: null };
    b.say = function (text, secs) { var g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      g.fillStyle = '#f0fff4'; g.strokeStyle = ink || '#166534'; g.lineWidth = 6; rr(g, 6, 6, w - 12, h - 46, 26); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(w / 2 - 20, h - 42); g.lineTo(w / 2, h - 8); g.lineTo(w / 2 + 20, h - 42); g.closePath(); g.fill(); g.stroke(); g.fillRect(w / 2 - 17, h - 46, 34, 6);
      g.fillStyle = '#123524'; g.textAlign = 'center'; g.textBaseline = 'middle'; var words = String(text).split(' '), lines = [], cur = '', px = 30; g.font = F(px);
      function wrap(mw) { lines = []; cur = ''; words.forEach(function (wd) { var tt = cur ? cur + ' ' + wd : wd; if (g.measureText(tt).width > mw) { lines.push(cur); cur = wd; } else cur = tt; }); if (cur) lines.push(cur); }
      wrap(w - 50); if (lines.length > 3) { px = 24; g.font = F(px); wrap(w - 40); lines = lines.slice(0, 4); }
      lines.forEach(function (ln, i) { g.fillText(ln, w / 2, (h - 40) / 2 + (i - (lines.length - 1) / 2) * (px + 4)); });
      t.needsUpdate = true; s.visible = true; b.T = secs || 5; b.last = text; return text; };
    b.tick = function (dt) { if (b.T > 0) { b.T -= dt; s.material.opacity = Math.min(1, b.T * 2); if (b.T <= 0) s.visible = false; } };
    return b;
  }

  /* ---------- the room shell ---------- */
  function shell() {
    var W = B.maxX - B.minX, D = B.maxZ - B.minZ, cx = (B.minX + B.maxX) / 2, cz = (B.minZ + B.maxZ) / 2, H = B.H;
    var g = grp('Remaster Works shell'); A.noAud(g);
    // floor: sealed workshop concrete with yellow/black safety lanes, a green Tortuga Tech logo in the middle
    var fc = cvs(512, 512, function (c, w, h) { c.fillStyle = '#5b6b66'; c.fillRect(0, 0, w, h); for (var i = 0; i < 900; i++) { c.fillStyle = i % 2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)'; c.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 3; for (i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 128, 0); c.lineTo(i * 128, h); c.moveTo(0, i * 128); c.lineTo(w, i * 128); c.stroke(); } });
    fc.tex.wrapS = fc.tex.wrapT = T.RepeatWrapping; fc.tex.repeat.set(W / 4, D / 4);
    var fl = add(g, new T.PlaneGeometry(W, D), new T.MeshPhongMaterial({ map: fc.tex, shininess: 40 }), cx, 0, cz); fl.rotation.x = -Math.PI / 2;
    var logo = cvs(512, 512, function (c, w, h) { c.strokeStyle = GREEN; c.lineWidth = 18; c.beginPath(); c.arc(w / 2, h / 2, 220, 0, 7); c.stroke(); c.fillStyle = 'rgba(74,222,128,.25)'; c.beginPath(); c.arc(w / 2, h / 2, 210, 0, 7); c.fill();
      c.fillStyle = '#2f855a'; c.beginPath(); c.ellipse(w / 2, h / 2 + 10, 130, 100, 0, 0, 7); c.fill(); c.strokeStyle = SAND; c.lineWidth = 8; for (var i = 0; i < 3; i++) { c.beginPath(); c.arc(w / 2, h / 2 + 10, 40 + i * 30, Math.PI, 0); c.stroke(); }
      c.fillStyle = '#ffffff'; c.font = F(46); c.textAlign = 'center'; c.fillText('TORTUGA TECH', w / 2, h - 70); });
    var lm = add(g, new T.PlaneGeometry(4.2, 4.2), new T.MeshBasicMaterial({ map: logo.tex, transparent: true, depthWrite: false }), 130.5, 0.012, -1); lm.rotation.x = -Math.PI / 2; lm.renderOrder = 1;
    // safety lanes (instanced stripes) from the door to the machine and around the crash rig
    var st = []; for (var x = B.minX + 1.5; x < 137.5; x += 0.9) { st.push([x, 0.011, -2.6, 0, 1]); st.push([x, 0.011, 0.6, 0, 1]); }
    inst(g, geo('lane', function () { var q = new T.PlaneGeometry(0.45, 0.12); q.rotateX(-Math.PI / 2); return q; }), gl('#facc15'), st, 'safety lane stripes');
    // walls: warm sandstone below, Tortuga green above, ceiling with light panels
    var wl = new T.MeshPhongMaterial({ color: '#d9c49a', shininess: 10 }), wu = ph('#1f5f45', 10), th = 0.3;
    [[W, cx, B.minZ - th / 2, 0], [W, cx, B.maxZ + th / 2, 0]].forEach(function (q) { add(g, bx(q[0] + th * 2, 2.2, th), wl, q[1], 1.1, q[2]); add(g, bx(q[0] + th * 2, H - 2.2, th), wu, q[1], 2.2 + (H - 2.2) / 2, q[2]); });
    [[B.minX - th / 2], [B.maxX + th / 2]].forEach(function (q) { add(g, bx(th, 2.2, D), wl, q[0], 1.1, cz); add(g, bx(th, H - 2.2, D), wu, q[0], 2.2 + (H - 2.2) / 2, cz); });
    add(g, bx(W, 0.12, 0.06), gl(SAND), cx, 2.2, B.minZ + 0.03); add(g, bx(W, 0.12, 0.06), gl(SAND), cx, 2.2, B.maxZ - 0.03); add(g, bx(0.06, 0.12, D), gl(SAND), B.minX + 0.03, 2.2, cz); add(g, bx(0.06, 0.12, D), gl(SAND), B.maxX - 0.03, 2.2, cz);
    var ce = add(g, new T.PlaneGeometry(W, D), ph('#18251f', 5), cx, H, cz); ce.rotation.x = Math.PI / 2;
    var lp = []; for (x = B.minX + 3; x < B.maxX - 1; x += 4.2) [-9, -1, 7].forEach(function (z) { lp.push([x, H - 0.04, z, 0, 1]); });
    inst(g, bx(2.4, 0.06, 0.5), gl('#f0fff4'), lp, 'ceiling light panels');
    // exposed roof beams + cable trays
    var bm = []; for (x = B.minX + 1; x < B.maxX; x += 4.2) bm.push([x, H - 0.25, cz, 0, 1]); inst(g, bx(0.25, 0.4, D), ph('#3b4a44', 20), bm, 'roof beams');
    [[124, 1], [138, 1]].forEach(function () {});
    var pl = new T.PointLight('#fff4d6', 0.7, 22, 1.5); pl.position.set(cx - 4, H - 0.8, cz); g.add(pl);
    var pl2 = new T.PointLight('#c4ffe0', 0.6, 20, 1.5); pl2.position.set(B.maxX - 5, H - 0.8, cz); g.add(pl2);
    // walls are solid
    [[B.minX - 1, B.maxX + 1, B.minZ - 1, B.minZ], [B.minX - 1, B.maxX + 1, B.maxZ, B.maxZ + 1], [B.minX - 1, B.minX, B.minZ - 1, B.maxZ + 1], [B.maxX, B.maxX + 1, B.minZ - 1, B.maxZ + 1]].forEach(function (q) { A.addWall(q[0], q[1], -1, 99, q[2], q[3]); });
    A.addWall(B.minX, B.maxX, H - 0.3, 99, B.minZ, B.maxZ);
    // big signs: entrance banner on the back (east) wall above the machine, and a welcome sign on the door wall
    var big = cvs(1024, 256, function (c, w, h) { var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#14532d'); gr.addColorStop(1, '#0b2b1c'); c.fillStyle = gr; rr(c, 4, 4, w - 8, h - 8, 26); c.fill(); c.strokeStyle = SAND; c.lineWidth = 8; c.stroke();
      txt(c, 'TORTUGA REMASTER WORKS', w / 2, 92, 96, GREEN, w - 60, true); txt(c, 'remasters \u00b7 sequels \u00b7 quality-of-life fixes', w / 2, 168, 40, '#fef3c7', w - 80); txt(c, 'a Tortuga Tech Inc. facility \u00b7 electronics by Ratita Industries', w / 2, 218, 30, '#fbcfe8', w - 80); });
    var s1 = new T.Mesh(new T.PlaneGeometry(7.2, 1.8), new T.MeshBasicMaterial({ map: big.tex })); s1.position.set(B.maxX - 0.04, 4.15, -1); s1.rotation.y = -Math.PI / 2; ROOT.add(s1); A.wallSign('TORTUGA REMASTER WORKS', s1);
    var wel = cvs(1024, 200, function (c, w, h) { c.fillStyle = '#0b2b1c'; rr(c, 4, 4, w - 8, h - 8, 20); c.fill(); c.strokeStyle = GREEN; c.lineWidth = 6; c.stroke(); txt(c, 'WELCOME TO THE WORKS!', w / 2, 72, 64, SAND, w - 60, true); txt(c, 'Hard hats optional \u00b7 shells mandatory \u00b7 ask Torty anything', w / 2, 146, 36, '#d1fae5', w - 60); });
    var s2 = new T.Mesh(new T.PlaneGeometry(4.6, 0.9), new T.MeshBasicMaterial({ map: wel.tex })); s2.position.set(B.minX + 0.04, 4.45, -1); s2.rotation.y = Math.PI / 2; ROOT.add(s2); A.wallSign('WELCOME TO THE WORKS', s2);
  }

  /* ---------- the exit door (west wall) ---------- */
  function exitDoor() {
    var g = grp('Remaster Works exit door', B.minX + 0.12, B.spawn.z, Math.PI / 2), fr = ph('#14532d', 30);
    add(g, bx(2.2, 3.0, 0.14), ph('#0f2a1f', 20), 0, 1.5, 0); [-1.15, 1.15].forEach(function (x) { add(g, bx(0.2, 3.2, 0.3), fr, x, 1.6, 0.05); }); add(g, bx(2.5, 0.25, 0.3), fr, 0, 3.2, 0.05);
    var pt = add(g, new T.PlaneGeometry(2.0, 2.85), new T.MeshBasicMaterial({ color: '#86efac', transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false }), 0, 1.45, 0.09); FX.exitPortal = pt;
    panel(g, 512, 96, 1.9, function (c, w, h) { c.fillStyle = '#052e16'; c.fillRect(0, 0, w, h); txt(c, '\u2190 BACK TO THE ARCADE', w / 2, h / 2, 48, GREEN, w - 30, true); }, 0, 3.55, 0.08);
    reg(g, 'booth'); A.addSolid(B.minX, B.minX + 0.4, B.spawn.z - 1.3, B.spawn.z + 1.3, 'Remaster Works exit door');
    inter({ id: 'rw_exit', kind: 'rw_exit', name: 'Back to the arcade', col: GREEN, x: B.minX + 1.4, z: B.spawn.z + 1.6, dir: [-1, 0], r: 1.0 });
  }

  /* ---------- THE REMASTER MACHINE (centerpiece, east side) ---------- */
  function machine() {
    var x0 = 141.2, z0 = -1, g = grp('Remaster Machine', x0, z0, -Math.PI / 2), body = ph('#1e3a2f', 60), trim = ph('#d4af37', 90, '#2a2000'), pink = ph(RAT, 50, '#3a0024'), chrome = ph('#cfd8e6', 110);
    // base plinth + main body + two side towers with spinning "remaster rings"
    add(g, bx(4.4, 0.3, 2.2), ph('#111827', 20), 0, 0.15, 0); add(g, bx(4.5, 0.06, 2.3), gl('#facc15'), 0, 0.31, 0);
    add(g, bx(2.6, 3.0, 1.5), body, 0, 1.8, -0.1); add(g, bx(2.7, 0.18, 1.6), trim, 0, 3.38, -0.1);
    [-1, 1].forEach(function (sd) { var tw = new T.Group(); tw.position.set(sd * 1.75, 0, -0.1); g.add(tw); add(tw, cy(0.42, 0.5, 3.6, 20), body, 0, 2.1, 0); add(tw, cy(0.46, 0.46, 0.12, 20), trim, 0, 3.95, 0);
      add(tw, sp(0.3, 16), gl(sd < 0 ? GREEN : RAT), 0, 4.2, 0); var ring = add(tw, to(0.62, 0.05, 32), gl(sd < 0 ? GREEN : RAT), 0, 2.4, 0); ring.rotation.x = Math.PI / 2; FX.screens.push({ ring: ring, sd: sd });
      for (var k = 0; k < 4; k++) add(tw, bx(0.1, 0.1, 0.06), gl(['#facc15', '#22d3ee', '#ff4fd8', '#4ade80'][k]), 0, 1.0 + k * 0.4, 0.47); });
    // big front screen (before -> after animation drawn on a canvas)
    var scr = cvs(512, 288, function () {}); FX.mscr = scr;
    var sm = new T.Mesh(new T.PlaneGeometry(2.2, 2.2 * 288 / 512), new T.MeshBasicMaterial({ map: scr.tex })); sm.position.set(0, 2.45, 0.66); g.add(sm);
    add(g, bx(2.36, 1.4, 0.06), trim, 0, 2.45, 0.62);
    // control desk: 4 type buttons (Remaster / Sequel / QoL / Other), a lever, a ticket printer slot
    var desk = add(g, bx(2.6, 0.12, 0.9), ph('#334155', 40), 0, 1.15, 0.95); desk.rotation.x = -0.25; add(g, bx(2.6, 1.0, 0.7), body, 0, 0.6, 0.9);
    [['#4ade80', -0.9], ['#38bdf8', -0.3], ['#facc15', 0.3], ['#c084fc', 0.9]].forEach(function (q) { add(g, cy(0.13, 0.15, 0.08, 16), gl(q[0]), q[1], 1.25, 0.98).rotation.x = -0.25; });
    var lever = new T.Group(); lever.position.set(1.45, 1.1, 0.9); g.add(lever); add(lever, cy(0.03, 0.03, 0.6, 8), chrome, 0, 0.3, 0); add(lever, sp(0.08, 12), gl('#ef4444'), 0, 0.6, 0); FX.lever = lever;
    add(g, bx(0.7, 0.06, 0.04), ph('#0b0b10', 10), 0, 0.85, 1.26); var tk = add(g, bx(0.5, 0.01, 0.3), ph('#fef3c7', 10), 0, 0.84, 1.36); FX.ticket = tk;
    // Ratita Industries electronics plate + logo (pink), Tortuga Tech plate (green)
    panel(g, 512, 128, 1.3, function (c, w, h) { c.fillStyle = '#2a0820'; rr(c, 2, 2, w - 4, h - 4, 16); c.fill(); c.strokeStyle = RAT; c.lineWidth = 6; c.stroke(); txt(c, 'ELECTRONICS BY RATITA INDUSTRIES', w / 2, 46, 34, RAT, w - 30, true); txt(c, '\uD83D\uDC2D squeak-certified circuits', w / 2, 94, 28, '#fbcfe8', w - 30); }, -0.65, 0.55, 1.26);
    panel(g, 512, 128, 1.1, function (c, w, h) { c.fillStyle = '#052e16'; rr(c, 2, 2, w - 4, h - 4, 16); c.fill(); c.strokeStyle = GREEN; c.lineWidth = 6; c.stroke(); txt(c, 'TORTUGA TECH INC.', w / 2, 46, 40, GREEN, w - 30, true); txt(c, 'shell-tough since forever', w / 2, 94, 28, '#d1fae5', w - 30); }, 0.75, 0.55, 1.26);
    panel(g, 1024, 192, 2.7, function (c, w, h) { c.fillStyle = '#0b2b1c'; rr(c, 4, 4, w - 8, h - 8, 24); c.fill(); c.strokeStyle = '#d4af37'; c.lineWidth = 8; c.stroke(); txt(c, 'THE REMASTER MACHINE', w / 2, 80, 84, SAND, w - 50, true); txt(c, 'pick a game \u00b7 pick a ticket \u00b7 pull the lever', w / 2, 152, 40, '#d1fae5', w - 60); }, 0, 3.85, -0.05);
    // a Ratita rat-ear antenna on top + cables to the towers
    [-0.35, 0.35].forEach(function (x) { add(g, sp(0.2, 14), pink, x, 3.75, -0.5).scale.set(1, 1, 0.3); });
    [-1, 1].forEach(function (sd) { var cb = add(g, cy(0.04, 0.04, 1.2, 8), ph('#111827', 20), sd * 1.1, 3.2, -0.3); cb.rotation.z = sd * 1.2; });
    reg(g, 'booth'); A.addSolid(x0 - 1.15, B.maxX, z0 - 2.25, z0 + 2.25, 'Remaster Machine');
    inter({ id: 'rw_machine', kind: 'rw_machine', name: 'The Remaster Machine', col: SAND, x: x0 - 2.35, z: z0, dir: [1, 0], r: 1.4, gw: 2.2 });
  }
  var BA = [['Grok Blocks', 'assets/hall/blocks/v-v1.webp', 'Re-Blocked', 'assets/remaster/rb-caves.webp'], ['Grok Rides', 'assets/hall/rides/v-v1.webp', 'Remastered', 'assets/hall/rides/1.webp']];
  var imgs = {}; function img(u) { if (!imgs[u]) { imgs[u] = new Image(); imgs[u].src = u; } return imgs[u]; }
  function drawMachineScreen(t) {
    var s = FX.mscr; if (!s) return; var c = s.g, w = s.c.width, h = s.c.height, k = Math.floor(t / 6) % BA.length, ph2 = (t % 6) / 6, q = BA[k];
    c.fillStyle = '#04140d'; c.fillRect(0, 0, w, h);
    function fitImg(u, x, y, mw, mh) { var im = img(u); if (!im.complete || !im.naturalWidth) return; var a = im.naturalWidth / im.naturalHeight, dw = mw, dh = dw / a; if (dh > mh) { dh = mh; dw = dh * a; } c.drawImage(im, x + (mw - dw) / 2, y + (mh - dh) / 2, dw, dh); }
    var split = Math.max(0, Math.min(1, (ph2 - 0.25) * 2.2)) * w;
    fitImg(q[1], 10, 44, w - 20, h - 90); c.save(); c.beginPath(); c.rect(0, 0, split, h); c.clip(); c.fillStyle = '#04140d'; c.fillRect(0, 0, w, h); fitImg(q[3], 10, 44, w - 20, h - 90); c.restore();
    c.fillStyle = GREEN; c.fillRect(split - 2, 40, 4, h - 80);
    txt(c, q[0] + (split > w / 2 ? ' \u2192 ' + q[2] : ' (before)'), w / 2, 22, 28, SAND, w - 20);
    txt(c, split > w / 2 ? 'REMASTERED \u2713' : 'REMASTERING\u2026 ' + Math.round(split / w * 100) + '%', w / 2, h - 22, 26, split > w / 2 ? GREEN : '#fbcfe8', w - 20);
    s.tex.needsUpdate = true;
  }

  /* ---------- Torty, host + CEO of Tortuga Tech (stands beside the machine) ---------- */
  var TORTY = {};
  function torty() {
    var g = grp('Torty the host', 137.6, 3.2, -Math.PI / 2 - 0.5); TORTY.g = g;
    add(g, cy(0.75, 0.85, 0.16, 24), ph('#14532d', 30), 0, 0.08, 0); add(g, to(0.8, 0.03, 32), gl(GREEN), 0, 0.17, 0).rotation.x = Math.PI / 2;
    var t = pet('pl_torty', g, 0, 0.16, 0, 0, 2.3); TORTY.m = t;
    var hat = new T.Group(); g.add(hat); if (t) { t.updateMatrixWorld(true); var bb = new T.Box3().setFromObject(t), cz2 = new T.Vector3(); bb.getCenter(cz2); g.worldToLocal(cz2); hat.position.set(cz2.x, bb.max.y - 0.06, cz2.z); } else hat.position.set(0, 1.0, 0); add(hat, new T.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), ph('#facc15', 60), 0, 0, 0); add(hat, cy(0.24, 0.24, 0.03, 16), ph('#facc15', 60), 0, 0, 0); TORTY.hat = hat;
    var tag = panel(g, 512, 128, 1.3, function (c, w, h) { c.fillStyle = '#f0fff4'; rr(c, 2, 2, w - 4, h - 4, 18); c.fill(); c.strokeStyle = '#166534'; c.lineWidth = 6; c.stroke(); txt(c, 'MARTINA \u201CTORTY\u201D', w / 2, 46, 44, '#14532d', w - 30); txt(c, 'host \u00b7 CEO of Tortuga Tech', w / 2, 96, 30, '#166534', w - 30); }, 0, 0.5, 0.86); void tag;
    TORTY.bub = bubble(g, 2.3); reg(g, 'prop'); A.addSolid(136.75, 138.45, 2.35, 4.05, 'Torty the host');
    inter({ id: 'rw_torty', kind: 'rw_torty', name: 'Torty (Martina)', col: GREEN, x: 135.7, z: 3.2, dir: [1, 0], r: 1.1 });
  }
  RW.say = function (s, secs) { return TORTY.bub ? TORTY.bub.say(s, secs) : s; };
  RW.line = function () { return TORTY.bub && TORTY.bub.T > 0 ? TORTY.bub.last : null; };

  /* ---------- board wall (north) + before/after showcase screens ---------- */
  function boardWall() {
    var g = grp('Remaster Board wall', 133.5, B.minZ + 0.05, 0);
    add(g, bx(6.2, 3.0, 0.1), ph('#0f1f18', 20), 0, 2.4, 0); add(g, bx(6.4, 0.12, 0.16), ph('#d4af37', 80), 0, 3.95, 0.02); add(g, bx(6.4, 0.12, 0.16), ph('#d4af37', 80), 0, 0.85, 0.02);
    var bc = cvs(1024, 480, function () {}); FX.board = bc;
    var m = new T.Mesh(new T.PlaneGeometry(6.0, 6.0 * 480 / 1024), new T.MeshBasicMaterial({ map: bc.tex })); m.position.set(0, 2.42, 0.07); g.add(m);
    reg(g, 'booth'); A.addSolid(130.3, 136.7, B.minZ, B.minZ + 0.3, 'Remaster Board wall');
    inter({ id: 'rw_board', kind: 'rw_board', name: 'Remaster Board', col: '#38bdf8', x: 133.5, z: B.minZ + 2.0, dir: [0, -1], r: 1.3, gw: 2.4 });
    RW.drawBoard();
    // before/after showcase screens (each picture keeps its real shape: P.frame sizes it from the image)
    var sh = grp('Before/After showcase', 0, 0, 0);
    var FR = [[123.6, 'Grok Blocks', 'BEFORE', 'assets/hall/blocks/v-v1.webp'], [126.4, 'Re-Blocked', 'AFTER', 'assets/remaster/rb-caves.webp'], [140.4, 'Grok Rides', 'BEFORE', 'assets/hall/rides/v-v1.webp'], [143.3, 'Remastered', 'AFTER', 'assets/hall/rides/1.webp']];
    FR.forEach(function (q) {
      if (GA.Pics && GA.Pics.frame) GA.Pics.frame(sh, q[3], { x: q[0], y: 2.75, z: B.minZ + 0.1, maxW: 2.5, maxH: 1.5, trim: ph(q[2] === 'AFTER' ? '#4ade80' : '#94a3b8', 60) });
      var lab = panel(sh, 512, 96, 1.6, function (c, w, h) { c.fillStyle = q[2] === 'AFTER' ? '#14532d' : '#334155'; rr(c, 2, 2, w - 4, h - 4, 14); c.fill(); txt(c, q[2] + ': ' + q[1], w / 2, h / 2, 44, '#ffffff', w - 30); }, q[0], 1.7, B.minZ + 0.12); void lab;
    });
    [[125, 'remaster #55'], [141.85, 'remaster']].forEach(function (q) { panel(sh, 256, 128, 0.5, function (c, w, h) { c.fillStyle = '#facc15'; c.beginPath(); c.moveTo(20, 30); c.lineTo(180, 30); c.lineTo(180, 6); c.lineTo(250, 64); c.lineTo(180, 122); c.lineTo(180, 98); c.lineTo(20, 98); c.closePath(); c.fill(); }, q[0], 2.75, B.minZ + 0.14, 0, { transparent: true }); });
    A.noAud(sh);
  }
  var ST = { new: ['New', '#7c3aed'], work: ['Working on it', '#d97706'], done: ['Done', '#16a34a'], wont: ['Won\u2019t do', '#6b7280'] };
  RW.drawBoard = function () {
    var b = FX.board; if (!b) return; var c = b.g, w = b.c.width, h = b.c.height, items = (RW.boardItems && RW.boardItems()) || [];
    c.fillStyle = '#04140d'; c.fillRect(0, 0, w, h); txt(c, 'REMASTER BOARD', w / 2, 40, 54, GREEN, w - 40, true);
    var cnt = { new: 0, work: 0, done: 0, wont: 0 }; items.forEach(function (i) { cnt[i.st] = (cnt[i.st] || 0) + 1; });
    ['new', 'work', 'done', 'wont'].forEach(function (k, i) { var x = 20 + i * 248; c.fillStyle = ST[k][1]; rr(c, x, 78, 236, 50, 12); c.fill(); txt(c, ST[k][0] + ': ' + cnt[k], x + 118, 103, 28, '#fff', 220); });
    if (!items.length) { txt(c, 'No tickets yet. Be the first!', w / 2, 230, 40, '#d1fae5', w - 60); txt(c, 'Walk up to the Remaster Machine to file one.', w / 2, 290, 30, '#a7f3d0', w - 60); }
    items.slice(0, 5).forEach(function (it, i) { var y = 150 + i * 64; c.fillStyle = 'rgba(255,255,255,.06)'; rr(c, 20, y, w - 40, 56, 10); c.fill(); c.fillStyle = ST[it.st][1]; rr(c, 28, y + 8, 190, 40, 8); c.fill(); txt(c, ST[it.st][0], 123, y + 28, 24, '#fff', 180);
      c.textAlign = 'left'; fit(c, '#' + it.n + ' ' + it.game + ': ' + it.name, w - 280, 30); c.fillStyle = '#ecfdf5'; c.fillText('#' + it.n + ' ' + it.game + (it.type ? ' (' + it.type + ')' : '') + ': ' + it.name, 236, y + 29); });
    txt(c, 'walk up to read every ticket', w / 2, h - 22, 24, '#86efac', w - 40);
    b.tex.needsUpdate = true;
  };

  /* ---------- shipped shelf (south wall): trophy shelf of shipped remasters + sequels ---------- */
  function shelf() {
    var g = grp('Shipped remasters shelf', 131.5, B.maxZ - 0.45, Math.PI), wood = ph('#7c4a26', 30), gold = ph('#d4af37', 90, '#2a2000');
    add(g, bx(5.6, 2.6, 0.08), ph('#2b1a10', 20), 0, 1.3, -0.26); [-2.76, 2.76].forEach(function (x) { add(g, bx(0.08, 2.6, 0.55), wood, x, 1.3, 0); }); [0.55, 1.35, 2.15].forEach(function (y) { add(g, bx(5.4, 0.06, 0.55), wood, 0, y, 0.0); });
    panel(g, 1024, 128, 5.0, function (c, w, h) { c.fillStyle = '#2b1a10'; c.fillRect(0, 0, w, h); txt(c, '\u2B50 SHIPPED REMASTERS & SEQUELS \u2B50', w / 2, h / 2, 60, '#fde68a', w - 40, true); }, 0, 2.95, 0.22);
    var items = (GA.REMASTER_SHELF || []); FX.shelf = [];
    items.slice(0, 4).forEach(function (it, i) {
      var x = -2.0 + i * 1.33, cg = (GA.findGame && GA.findGame(it.game)) || {}, col = cg.color || '#4ade80';
      // trophy cartridge on a plinth
      add(g, bx(0.5, 0.14, 0.3), gold, x, 1.45, 0.05); var cart = add(g, bx(0.46, 0.56, 0.1), ph(it.soon ? '#64748b' : col, 50, it.soon ? '' : '#111111'), x, 1.8, 0.05); FX.shelf.push(cart);
      add(g, bx(0.32, 0.24, 0.11), ph('#ffffff', 40), x, 1.86, 0.06); if (!it.soon) add(g, sp(0.06, 8), gl('#fde047'), x, 2.12, 0.05); else add(g, bx(0.5, 0.05, 0.12), gl('#facc15'), x, 1.8, 0.12).rotation.z = 0.5;
      panel(g, 256, 112, 1.1, function (c, w, h) { c.fillStyle = it.soon ? '#1e293b' : '#14532d'; rr(c, 2, 2, w - 4, h - 4, 10); c.fill(); txt(c, it.name, w / 2, 38, 26, '#fff', w - 16); txt(c, it.soon ? 'in the works' : it.kind + (it.issue ? ' \u00b7 #' + it.issue : ''), w / 2, 80, 22, it.soon ? '#fcd34d' : '#86efac', w - 16); }, x, 1.12, 0.29);
    });
    // lower shelf: boxed games + a mini Torty statue
    for (var k = 0; k < 7; k++) add(g, bx(0.32, 0.42, 0.08), ph(['#4ade80', '#38bdf8', '#f472b6', '#facc15', '#a78bfa', '#fb923c', '#22d3ee'][k], 30), -2.3 + k * 0.42, 0.79, 0.0).rotation.y = (k % 3 - 1) * 0.08;
    pet('md_martina', g, 2.3, 2.18, 0.05, 0, 0.7); pet('pl_torty', g, -2.3, 2.18, 0.05, 0.3, 0.6);
    reg(g, 'booth'); A.addSolid(128.6, 134.4, B.maxZ - 0.75, B.maxZ, 'Shipped remasters shelf');
    inter({ id: 'rw_shelf', kind: 'rw_shelf', name: 'Shipped remasters shelf', col: '#fde68a', x: 131.5, z: B.maxZ - 2.1, dir: [0, 1], r: 1.3, gw: 2.4 });
  }

  /* ---------- workshop: workbenches, monitors, parts wall, crash-test rig, robots, staff, pets ---------- */
  function workshop() {
    var steel = ph('#94a3b8', 80), dark = ph('#1f2937', 30), wood = ph('#a16207', 20), chrome = ph('#cfd8e6', 110);
    var k;
    // 3 workbenches in the middle-west, each with a monitor, tools, a half-built cabinet part
    var BEN = [[125.2, -7.6], [129.8, -7.6], [125.2, 6.0]];
    BEN.forEach(function (q, i) {
      var g = grp('Workbench ' + (i + 1), q[0], q[1], i === 2 ? Math.PI : 0);
      add(g, bx(2.6, 0.1, 1.0), wood, 0, 0.95, 0); [[-1.2, -0.4], [1.2, -0.4], [-1.2, 0.4], [1.2, 0.4]].forEach(function (p) { add(g, bx(0.08, 0.95, 0.08), steel, p[0], 0.47, p[1]); });
      add(g, bx(2.5, 0.06, 0.9), dark, 0, 0.3, 0); // lower shelf
      add(g, bx(0.06, 0.6, 1.0), ph('#0f172a', 20), -1.25, 1.3, 0); // pegboard end
      // monitor with code / a game frame
      var mon = new T.Group(); mon.position.set(-0.6, 0.98, -0.25); g.add(mon); add(mon, bx(0.7, 0.45, 0.04), ph('#111827', 30), 0, 0.42, 0); add(mon, cy(0.03, 0.05, 0.2, 8), dark, 0, 0.1, 0);
      panel(mon, 256, 160, 0.64, function (c, w, h) { c.fillStyle = '#052e16'; c.fillRect(0, 0, w, h); c.font = '16px monospace'; c.fillStyle = GREEN; ['> remaster.build()', '  shaders: shiny', '  caves: DARKER', '  fps: smooth \u2713', '> QA: Candy approves', '> ship? ask David'].forEach(function (l, k) { c.fillText(l, 10, 22 + k * 24); }); }, 0, 0.42, 0.025);
      // tools: wrench, screwdriver, soldering iron, a coffee mug labelled TORTY
      add(g, bx(0.3, 0.03, 0.06), chrome, 0.3, 1.02, 0.25).rotation.y = 0.4; add(g, cy(0.02, 0.02, 0.28, 6), ph('#ef4444', 30), 0.55, 1.02, 0.1).rotation.z = Math.PI / 2;
      add(g, cy(0.05, 0.05, 0.1, 12), ph('#ffffff', 50), 1.0, 1.05, -0.25); add(g, bx(0.4, 0.25, 0.3), ph(['#38bdf8', '#f472b6', '#facc15'][i], 40), 0.65, 1.13, -0.2); // half-built cabinet panel
      add(g, bx(0.5, 0.04, 0.35), ph('#065f46', 30), 0.1, 1.02, -0.05); for (var k = 0; k < 5; k++) add(g, bx(0.05, 0.03, 0.05), gl(['#facc15', '#22d3ee', '#f472b6'][k % 3]), -0.08 + k * 0.08, 1.05, -0.05); // circuit board
      add(g, bx(0.5, 0.3, 0.4), ph('#78350f', 20), 0.6, 0.48, 0); add(g, bx(0.5, 0.3, 0.4), ph('#1e40af', 20), -0.5, 0.48, 0.05); // parts bins under
      // stool
      var stl = grp('Workbench stool ' + (i + 1), q[0] + 0.4, q[1] + (i === 2 ? -1.0 : 1.0)); add(stl, cy(0.22, 0.22, 0.06, 14), ph('#15803d', 30), 0, 0.62, 0); add(stl, cy(0.03, 0.03, 0.6, 6), steel, 0, 0.3, 0); add(stl, cy(0.2, 0.2, 0.03, 12), steel, 0, 0.02, 0);
      reg(stl, 'prop'); A.addSolid(q[0] + 0.15, q[0] + 0.65, q[1] + (i === 2 ? -1.25 : 0.75), q[1] + (i === 2 ? -0.75 : 1.25), 'Workbench stool ' + (i + 1));
      reg(g, 'prop'); A.addSolid(q[0] - 1.35, q[0] + 1.35, q[1] - 0.55, q[1] + 0.55, 'Workbench ' + (i + 1));
    });
    // PARTS WALL (west half of the south wall): pegboard with instanced gears, wrenches, joysticks, buttons, cable reels + bins
    var pw = grp('Parts wall', 124.2, B.maxZ - 0.12, Math.PI);
    add(pw, bx(5.2, 2.6, 0.06), ph('#c8a26b', 10), 0, 1.65, 0); panel(pw, 512, 96, 2.4, function (c, w, h) { c.fillStyle = '#7c2d12'; rr(c, 2, 2, w - 4, h - 4, 12); c.fill(); txt(c, 'PARTS WALL \u00b7 take one, log one', w / 2, h / 2, 40, '#fde68a', w - 30); }, 0, 3.15, 0.05);
    var gears = [], wr = [], btn = [], joy = [];
    for (var r = 0; r < 4; r++) for (var cI = 0; cI < 9; cI++) { var x = -2.3 + cI * 0.58, y = 0.65 + r * 0.55 + 0.4, k2 = (r * 9 + cI) % 4; if (k2 === 0) gears.push([x, y, 0.08, 0, 1, 1, 1, Math.PI / 2]); else if (k2 === 1) wr.push([x, y, 0.06, 0, 1, 1, 1, 0, 0.6]); else if (k2 === 2) btn.push([x, y, 0.06, 0, 1, 1, 1, Math.PI / 2]); else joy.push([x, y, 0.08, 0, 1]); }
    inst(pw, geo('gear', function () { return new T.CylinderGeometry(0.16, 0.16, 0.05, 10); }), ph('#9ca3af', 90), gears, 'parts gears');
    inst(pw, bx(0.36, 0.06, 0.03), ph('#cbd5e1', 100), wr, 'parts wrenches');
    inst(pw, cy(0.09, 0.09, 0.05, 12), ph('#ef4444', 40, '#3a0000'), btn, 'parts buttons');
    inst(pw, sp(0.09, 10), ph('#111827', 40), joy, 'parts joystick knobs');
    var bins = []; for (k = 0; k < 6; k++) bins.push([-2.1 + k * 0.84, 0.25, 0.35, 0, 1]); inst(pw, bx(0.7, 0.5, 0.5), ph('#2563eb', 30), bins, 'parts bins');
    reg(pw, 'prop'); A.addSolid(121.5, 126.9, B.maxZ - 0.75, B.maxZ, 'Parts wall');
    // SHELL-TOUGH CRASH-TEST RIG (south-east): a rail, a sled with a crash-test shell, a padded barrier; it slams every few seconds
    var cr = grp('Shell-tough crash-test rig', 140.8, 7.6, 0);
    add(cr, bx(5.0, 0.1, 1.4), ph('#111827', 20), 0, 0.05, 0); [-0.45, 0.45].forEach(function (z) { add(cr, bx(4.8, 0.08, 0.08), chrome, 0, 0.16, z); });
    for (k = 0; k < 10; k++) add(cr, bx(0.24, 0.02, 0.24), gl(k % 2 ? '#facc15' : '#111827'), -2.25 + k * 0.5, 0.11, 0.62);
    var bar = new T.Group(); bar.position.set(2.3, 0, 0); cr.add(bar); add(bar, bx(0.4, 1.4, 1.6), ph('#dc2626', 30), 0, 0.8, 0); add(bar, bx(0.12, 1.2, 1.4), ph('#facc15', 20), -0.25, 0.8, 0); FX.barrier = bar;
    var sled = new T.Group(); sled.position.set(-1.6, 0.2, 0); cr.add(sled); FX.sled = sled; add(sled, bx(0.9, 0.12, 0.9), ph('#475569', 60), 0, 0.06, 0);
    var shellM = add(sled, new T.SphereGeometry(0.42, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), ph('#2f855a', 40), 0, 0.12, 0); shellM.scale.set(1, 0.75, 1.1); add(sled, to(0.42, 0.03, 24), ph('#e9c46a', 40), 0, 0.13, 0).rotation.x = Math.PI / 2;
    panel(sled, 128, 64, 0.32, function (c, w, h) { c.fillStyle = '#fef3c7'; c.fillRect(0, 0, w, h); txt(c, 'TEST', w / 2, h / 2, 34, '#111827', w - 10); }, 0, 0.38, 0.32);
    var post = add(cr, bx(0.1, 2.4, 0.1), chrome, -2.4, 1.2, -0.75); void post;
    panel(cr, 512, 192, 1.9, function (c, w, h) { c.fillStyle = '#111827'; rr(c, 2, 2, w - 4, h - 4, 14); c.fill(); c.strokeStyle = '#facc15'; c.lineWidth = 8; c.stroke(); txt(c, 'SHELL-TOUGH\u2122', w / 2, 62, 64, '#facc15', w - 30, true); txt(c, 'CRASH-TEST RIG', w / 2, 120, 40, '#ffffff', w - 30); txt(c, 'every remaster must survive this', w / 2, 164, 26, '#fca5a5', w - 30); }, 0, 2.1, -0.72);
    var dsp = cvs(256, 96, function () {}); FX.crashDisp = dsp; var dm = new T.Mesh(new T.PlaneGeometry(0.9, 0.34), new T.MeshBasicMaterial({ map: dsp.tex })); dm.position.set(-2.4, 2.0, -0.68); cr.add(dm);
    reg(cr, 'prop'); A.addSolid(138.2, 143.4, 6.8, 8.45, 'Shell-tough crash-test rig');
    // crates + barrels (instanced), cable runs on the floor, a forklift-sized "Remaster Cart" with a cabinet on it
    var crates = [[144.8, -12.6, 0], [144.8, -11.6, 0.2], [143.8, -12.6, -0.1], [144.8, -12.1, 0, 1.1], [121.0, -12.6, 0.15], [121.9, -12.6, 0]];
    inst(ROOT, bx(0.9, 0.9, 0.9), ph('#b7791f', 15), crates.map(function (q, i) { return [q[0], q[3] ? 1.35 : 0.45, q[1], q[2], q[3] ? 0.85 : 1]; }), 'crates');
    crates.forEach(function (q, i) { if (!q[3]) A.addSolid(q[0] - 0.5, q[0] + 0.5, q[1] - 0.5, q[1] + 0.5, 'crate ' + i); });
    var stamp = []; crates.forEach(function (q) { stamp.push([q[0], q[3] ? 1.35 : 0.45, q[1] + (q[3] ? 0.39 : 0.46), 0, 1]); });
    inst(ROOT, geo('crstamp', function () { return new T.PlaneGeometry(0.5, 0.2); }), gl('#14532d'), stamp, 'crate stamps');
    var barrels = [[121.2, 10.6], [121.2, 9.6], [145.0, 10.8]]; inst(ROOT, cy(0.32, 0.32, 0.9, 14), ph('#16a34a', 40), barrels.map(function (q) { return [q[0], 0.45, q[1], 0, 1]; }), 'barrels'); barrels.forEach(function (q, i) { A.addSolid(q[0] - 0.35, q[0] + 0.35, q[1] - 0.35, q[1] + 0.35, 'barrel ' + i); });
    var cab = grp('Remaster cart', 144.5, -6.6, -Math.PI / 2); add(cab, bx(1.4, 0.3, 1.1), ph('#f59e0b', 30), 0, 0.3, 0); [-0.55, 0.55].forEach(function (x) { [-0.45, 0.45].forEach(function (z) { add(cab, cy(0.14, 0.14, 0.08, 12), dark, x, 0.14, z).rotation.x = Math.PI / 2; }); });
    add(cab, bx(0.8, 1.6, 0.7), ph('#7c3aed', 40), 0, 1.25, 0); add(cab, bx(0.66, 0.5, 0.04), gl('#22d3ee'), 0, 1.55, 0.36); panel(cab, 256, 64, 0.66, function (c, w, h) { c.fillStyle = '#facc15'; c.fillRect(0, 0, w, h); txt(c, 'BEING REMASTERED', w / 2, h / 2, 28, '#111827', w - 10); }, 0, 2.15, 0.36);
    reg(cab, 'prop'); A.addSolid(143.9, 145.1, -7.35, -5.85, 'Remaster cart');
    // floor cables from the machine to the board and the benches
    var cbl = []; for (k = 0; k < 14; k++) cbl.push([137.5 - k * 0.5, 0.025, -12.4 + Math.sin(k) * 0.08, 0, 1]); inst(ROOT, bx(0.52, 0.04, 0.06), ph('#111827', 20), cbl, 'floor cables');
    // plants (instanced) in the corners
    var PL = [[121.0, -6.0], [121.0, 4.0], [145.2, 3.4], [136.6, 11.4], [127.6, 11.4], [137.6, -12.9]], pots = [], leaves = [];
    PL.forEach(function (q, i) { pots.push([q[0], 0.25, q[1], 0, 1]); for (var k3 = 0; k3 < 7; k3++) { var a = k3 * 0.9 + i; leaves.push([q[0] + Math.cos(a) * 0.15, 0.68 + (k3 % 3) * 0.13, q[1] + Math.sin(a) * 0.15, a, 0.55, 1.5, 0.55]); } A.addSolid(q[0] - 0.3, q[0] + 0.3, q[1] - 0.3, q[1] + 0.3, 'Works plant ' + i); });
    inst(ROOT, cy(0.27, 0.2, 0.5, 14), ph('#e9c46a', 20), pots, 'plant pots'); inst(ROOT, sp(0.2, 8), ph('#22a55a', 10), leaves, 'plant leaves');
    // desert touch for Torty: two potted cacti by the door
    [[121.0, -2.9], [121.0, 1.0]].forEach(function (q, i) { var c2 = grp('cactus ' + i, q[0], q[1]); add(c2, cy(0.26, 0.2, 0.4, 12), ph('#c2410c', 20), 0, 0.2, 0); add(c2, cy(0.13, 0.13, 0.9, 10), ph('#15803d', 20), 0, 0.85, 0); add(c2, cy(0.07, 0.07, 0.35, 8), ph('#15803d', 20), 0.16, 0.95, 0).rotation.z = -0.6; add(c2, sp(0.07, 8), ph('#f472b6', 20), 0, 1.33, 0); reg(c2, 'prop'); A.addSolid(q[0] - 0.28, q[0] + 0.28, q[1] - 0.28, q[1] + 0.28, 'cactus ' + i); });
  }

  /* Tortuga Tech robots: little rolling helpers (one carries a crate, one sweeps, one checks the crash rig) */
  function robots() {
    var body = ph('#e5e7eb', 90), green = ph('#16a34a', 40), dark = ph('#111827', 30);
    var R = [{ path: [[127.5, -3.8], [135.5, -3.8]], sp: 0.35, carry: true }, { path: [[123.5, 2.0], [128.4, 2.0]], sp: 0.28, broom: true }, { path: [[137.2, 5.6], [137.2, 9.8]], sp: 0.22, clip: true }];
    R.forEach(function (o, i) {
      var g = grp('Tortuga Tech bot ' + (i + 1), o.path[0][0], o.path[0][1]); add(g, cy(0.3, 0.34, 0.5, 16), body, 0, 0.45, 0); add(g, cy(0.32, 0.32, 0.08, 16), green, 0, 0.25, 0);
      add(g, cy(0.12, 0.12, 0.08, 10), dark, 0, 0.12, 0).rotation.z = Math.PI / 2; var hd = add(g, sp(0.26, 16), body, 0, 0.92, 0); hd.scale.set(1, 0.85, 1);
      add(g, bx(0.32, 0.12, 0.05), gl('#22d3ee'), 0, 0.95, 0.22); add(g, cy(0.01, 0.01, 0.25, 4), dark, 0, 1.25, 0); var bulb = add(g, sp(0.05, 8), gl(i === 1 ? '#facc15' : GREEN), 0, 1.38, 0);
      panel(g, 128, 64, 0.3, function (c, w, h) { c.fillStyle = '#14532d'; c.fillRect(0, 0, w, h); txt(c, 'TT-' + (i + 1), w / 2, h / 2, 36, '#fff', w - 10); }, 0, 0.5, 0.33);
      [-1, 1].forEach(function (sd) { add(g, bx(0.06, 0.32, 0.06), body, sd * 0.36, 0.6, 0.06).rotation.x = -0.6; });
      if (o.carry) add(g, bx(0.4, 0.3, 0.3), ph('#b7791f', 15), 0, 0.85, 0.42);
      if (o.broom) { add(g, cy(0.015, 0.015, 0.9, 6), ph('#a16207', 20), 0.36, 0.4, 0.3).rotation.x = 0.6; add(g, bx(0.3, 0.06, 0.1), ph('#fde68a', 10), 0.36, 0.05, 0.6); }
      if (o.clip) add(g, bx(0.22, 0.3, 0.02), ph('#fef3c7', 10), 0.3, 0.7, 0.3).rotation.x = -0.4;
      FX.bots.push({ g: g, o: o, ph: i * 1.3, bulb: bulb }); A.noAud(g);
    });
    // walking lane solids are not needed (bots never block the doorway paths; they pass through the open floor)
  }
  /* staff (Tortuga Tech crew in green overalls + hard hats) and visitors */
  var SKIN = ['#f1c7a5', '#c68b59', '#8d5524', '#f3d2b3'];
  function person(x, z, ry, k, pose, staff) {
    var g = grp('person ' + x + ',' + z, x, z, ry); A.noAud(g);
    var sk = ph(SKIN[k % 4], 15), sh = staff ? ph('#15803d', 20) : ph(['#38bdf8', '#f472b6', '#facc15', '#a78bfa', '#fb923c'][k % 5], 20), pa = staff ? ph('#14532d', 15) : ph(['#334155', '#1e3a8a', '#4b5563'][k % 3], 15);
    [-0.12, 0.12].forEach(function (lx) { add(g, bx(0.17, 0.62, 0.2), pa, lx, 0.31, 0); }); add(g, bx(0.5, 0.6, 0.3), sh, 0, 0.92, 0);
    var aL = add(g, bx(0.14, 0.5, 0.16), sh, -0.33, 0.95, 0.02), aR = add(g, bx(0.14, 0.5, 0.16), sh, 0.33, 0.95, 0.02);
    var hd = add(g, sp(0.22, 14), sk, 0, 1.45, 0); [-0.08, 0.08].forEach(function (ex) { add(hd, sp(0.03, 6), ph('#1f1235', 5), ex, 0.02, 0.2); });
    if (staff) { add(hd, new T.SphereGeometry(0.25, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), ph('#facc15', 60), 0, 0.06, 0); add(g, bx(0.2, 0.12, 0.02), gl('#fef3c7'), 0.12, 1.08, 0.16); }
    else add(hd, sp(0.23, 12), ph(['#2b1a10', '#f5d06f', '#111827'][k % 3], 10), 0, 0.07, -0.04).scale.set(1, 0.7, 1);
    if (pose === 'work') { aL.rotation.x = aR.rotation.x = -1.0; aL.position.z = aR.position.z = 0.18; }
    FX.vis.push({ g: g, hd: hd, aL: aL, aR: aR, pose: pose, ph: k * 1.7 });
    A.addSolid(x - 0.3, x + 0.3, z - 0.3, z + 0.3, 'person ' + x + ',' + z); return g;
  }
  function people() {
    person(125.6, -6.55, Math.PI, 0, 'work', true); person(130.2, -6.55, Math.PI, 1, 'work', true); person(124.8, 4.95, 0, 2, 'work', true);
    person(139.4, 5.7, Math.PI / 2 + 0.3, 3, 'look', true); // crash-rig tech
    person(133.0, -10.9, Math.PI, 4, 'look', false); person(134.4, -11.1, Math.PI + 0.3, 1, 'look', false); // reading the board
    person(130.2, 9.4, 0, 2, 'look', false); // at the shelf
  }
  /* pet cameos: Luna in goggles on bench 1, Pi-rat on top of the parts wall, Snowie at the monitor of bench 2, Candy is the QA inspector by the door */
  function pets() {
    var l = pet('pl_luna', ROOT, 124.4, 1.0, -7.5, 0.3, 0.55); FX.luna = l;
    if (l) { var gg = new T.Group(); gg.position.set(0, 0.55, 0.18); l.add(gg); [-0.08, 0.08].forEach(function (x) { add(gg, to(0.06, 0.015, 14), ph('#facc15', 60), x, 0, 0); }); }
    FX.pirat = pet('pl_pirat', ROOT, 125.4, 2.95, B.maxZ - 0.35, Math.PI, 0.55);
    FX.snowie = pet('pl_snowie', ROOT, 130.6, 1.0, -7.3, 0.2, 0.5);
    var bd = grp('Candy QA bed', 122.6, 8.6); add(bd, to(0.4, 0.13, 18), ph('#60a5fa', 15), 0, 0.13, 0).rotation.x = Math.PI / 2; add(bd, cy(0.38, 0.38, 0.06, 18), ph('#bfdbfe', 10), 0, 0.05, 0);
    FX.candy = pet('pl_candy', bd, 0, 0.08, 0, 0.6, 1.1);
    panel(bd, 256, 96, 0.8, function (c, w, h) { c.fillStyle = '#fef3c7'; rr(c, 2, 2, w - 4, h - 4, 10); c.fill(); txt(c, 'CANDY \u00b7 HEAD OF QA', w / 2, 34, 26, '#7c2d12', w - 16); txt(c, '(Ruffsources temp)', w / 2, 70, 22, '#92400e', w - 16); }, 0, 0.75, -0.5, 0);
    reg(bd, 'prop'); A.addSolid(122.1, 123.1, 8.1, 9.1, 'Candy QA bed');
  }

  /* ---------- the Tortuga Tech EXPRESS POD in the Hall's Grand Gallery (west side, x 5.4 z 62.4, door facing the aisle) ---------- */
  function hallDoor() {
    var d = RW.DOOR, g = new T.Group(); g.name = 'Remaster Works express pod'; g.position.set(d.x, 0, d.z); g.rotation.y = Math.PI / 2; A.scene.add(g); DOOR = g;
    var fr = ph('#14532d', 40), gold = ph('#d4af37', 90, '#2a2000'), glass = new T.MeshPhongMaterial({ color: '#d1fae5', transparent: true, opacity: 0.28, shininess: 120, depthWrite: false });
    add(g, cy(0.95, 1.0, 0.18, 28), fr, 0, 0.09, 0); add(g, to(0.98, 0.04, 32), gl('#4ade80'), 0, 0.19, 0).rotation.x = Math.PI / 2;
    add(g, cy(0.85, 0.85, 2.6, 28, true), glass, 0, 1.5, 0); add(g, cy(0.95, 0.95, 0.3, 28), fr, 0, 2.95, 0); add(g, sp(0.5, 18), gold, 0, 3.15, 0).scale.set(1, 0.4, 1);
    [-0.6, 0.6].forEach(function (x) { add(g, bx(0.12, 2.6, 0.12), gold, x, 1.5, 0.62); });
    var pm = add(g, new T.PlaneGeometry(1.1, 2.5), new T.MeshBasicMaterial({ color: '#4ade80', transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false }), 0, 1.45, 0.66);
    var sw = cvs(128, 256, function (c, w, h) { var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#bbf7d0'); gr.addColorStop(0.5, '#22c55e'); gr.addColorStop(1, '#064e3b'); c.fillStyle = gr; c.fillRect(0, 0, w, h); for (var i = 0; i < 12; i++) { c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(0, i * 22, w, 6); } });
    sw.tex.wrapT = T.RepeatWrapping; pm.material.map = sw.tex; pm.material.needsUpdate = true; FX.doorTex = sw.tex;
    var seat = add(g, bx(0.9, 0.12, 0.5), ph('#15803d', 30), 0, 0.6, -0.45); void seat; add(g, bx(0.9, 0.7, 0.1), ph('#15803d', 30), 0, 0.95, -0.72);
    var mini = pet('pl_torty', g, 0, 0.66, -0.4, 0, 0.55); FX.podTorty = mini;
    panel(g, 1024, 300, 2.4, function (c, w, h) { c.fillStyle = '#0b2b1c'; rr(c, 4, 4, w - 8, h - 8, 26); c.fill(); c.strokeStyle = '#d4af37'; c.lineWidth = 8; c.stroke(); txt(c, 'REMASTER WORKS', w / 2, 82, 104, GREEN, w - 50, true); txt(c, 'EXPRESS POD \u2192 Torty\u2019s workshop', w / 2, 170, 52, '#fef3c7', w - 60); txt(c, 'remasters \u00b7 sequels \u00b7 quality-of-life fixes', w / 2, 246, 40, '#fbcfe8', w - 60); }, 0, 3.75, 0.9);
    var bulbs = []; for (var i = 0; i < 10; i++) { var an2 = i / 10 * Math.PI * 2; bulbs.push(add(g, sp(0.05, 8), gl(i % 2 ? '#facc15' : GREEN), Math.sin(an2) * 0.96, 2.8, Math.cos(an2) * 0.96)); } FX.doorBulbs = bulbs;
    var bt = new T.Group(); bt.position.set(1.15, 0, 0.55); g.add(bt); add(bt, cy(0.2, 0.24, 0.42, 14), ph('#e5e7eb', 90), 0, 0.3, 0); add(bt, sp(0.18, 14), ph('#e5e7eb', 90), 0, 0.66, 0); add(bt, bx(0.22, 0.07, 0.04), gl('#22d3ee'), 0, 0.68, 0.16); add(bt, cy(0.22, 0.22, 0.05, 14), ph('#16a34a', 40), 0, 0.12, 0); FX.doorBot = bt;
    g.updateMatrixWorld(true); A.regItem('Remaster Works express pod', 'booth', g); A.addSolid(d.x - 1.0, d.x + 1.0, d.z - 1.0, d.z + 1.5, 'Remaster Works express pod');
    var fx = d.x + 1.9, fz = d.z;
    var gm = new T.MeshBasicMaterial({ map: A.glowTex, color: GREEN, transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending });
    var fl = new T.Mesh(new T.PlaneGeometry(1.4, 1.6), gm); fl.rotation.x = -Math.PI / 2; fl.position.set(fx, 0.03, fz); fl.renderOrder = 2; A.scene.add(fl); A.noAud(fl); FX.doorGlow = fl;
    var an = new T.Object3D(); an.name = 'anchor rw_door'; an.position.set(fx - 1.75, 0, fz); an.rotation.y = -Math.PI / 2; A.scene.add(an); an.updateMatrixWorld(true);
    var cab = { game: { id: 'rw_door', name: 'Tortuga Remaster Works', desc: '', color: GREEN }, kind: 'rw_door', id: 'rw_door', group: an, x: fx, z: fz, rot: -Math.PI / 2, front: new T.Vector3(fx, 0, fz), dir: new T.Vector3(-1, 0, 0), glow: gm, nextDraw: Infinity, r: 1.2, ar: true, area: 'hall', data: {} };
    A.cabinets.push(cab); RW.cabs.rw_door = cab;
  }

  /* extra workshop density: holo project table, QA test cabinets, pennant strings */
  function extras() {
    var ht = grp('Holo project table', 130.4, 5.4, 0), chrome = ph('#cfd8e6', 110);
    add(ht, cy(0.95, 1.05, 0.85, 28), ph('#1e3a2f', 50), 0, 0.42, 0); add(ht, cy(1.0, 1.0, 0.06, 28), gl('#22d3ee'), 0, 0.87, 0);
    var holo = new T.Group(); holo.position.y = 1.55; ht.add(holo); FX.holo = holo;
    var hm = new T.MeshBasicMaterial({ color: '#5eead4', transparent: true, opacity: 0.55, wireframe: true });
    add(holo, bx(0.5, 0.9, 0.45), hm, 0, 0, 0); add(holo, bx(0.4, 0.28, 0.02), new T.MeshBasicMaterial({ color: '#a7f3d0', transparent: true, opacity: 0.6 }), 0, 0.15, 0.24);
    var beam = add(ht, new T.ConeGeometry(0.7, 1.3, 24, 1, true), new T.MeshBasicMaterial({ color: '#99f6e4', transparent: true, opacity: 0.12, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }), 0, 1.5, 0); beam.rotation.x = Math.PI; A.noAud(beam);
    panel(ht, 512, 96, 1.4, function (c, w, h) { c.fillStyle = '#052e16'; rr(c, 2, 2, w - 4, h - 4, 12); c.fill(); txt(c, 'NEXT UP: GROK LAND SEQUEL', w / 2, h / 2, 40, '#5eead4', w - 20); }, 0, 0.5, 1.03);
    reg(ht, 'prop'); A.addSolid(129.35, 131.45, 4.35, 6.45, 'Holo project table');
    // QA test cabinets (north-east): two cabinets under test, a tester playing each
    [[138.6, '#38bdf8', 'QA: RE-BLOCKED'], [140.9, '#f472b6', 'QA: LAND 2']].forEach(function (q, i) {
      var c = grp('QA cabinet ' + (i + 1), q[0], -10.2, 0); add(c, bx(1.0, 1.9, 0.8), ph(q[1], 40), 0, 0.95, 0); add(c, bx(0.84, 0.6, 0.04), gl('#0f172a'), 0, 1.45, 0.41);
      var sc = panel(c, 256, 180, 0.8, function (g2, w, h) { g2.fillStyle = '#022c22'; g2.fillRect(0, 0, w, h); for (var k = 0; k < 6; k++) { g2.fillStyle = ['#4ade80', '#facc15', '#38bdf8'][k % 3]; g2.fillRect(20 + k * 36, h - 40 - (k * 13) % 60, 28, 28); } txt(g2, 'TESTING\u2026', w / 2, 30, 30, '#fde047', w - 20); }, 0, 1.45, 0.43); void sc;
      add(c, bx(0.9, 0.12, 0.4), ph('#111827', 30), 0, 1.0, 0.45).rotation.x = -0.3; add(c, sp(0.05, 8), gl('#ef4444'), -0.2, 1.08, 0.5);
      panel(c, 256, 64, 0.9, function (g2, w, h) { g2.fillStyle = '#111827'; g2.fillRect(0, 0, w, h); txt(g2, q[2], w / 2, h / 2, 30, q[1], w - 10); }, 0, 2.05, 0.41);
      reg(c, 'prop'); A.addSolid(q[0] - 0.52, q[0] + 0.52, -10.62, -9.78, 'QA cabinet ' + (i + 1));
      person(q[0], -9.15, Math.PI, 5 + i, 'work', i === 1);
    });
    var clip = grp('QA clipboard stand', 142.6, -9.6, 0); add(clip, cy(0.03, 0.03, 1.1, 6), chrome, 0, 0.55, 0); add(clip, bx(0.4, 0.5, 0.03), ph('#fef3c7', 10), 0, 1.15, 0.03).rotation.x = -0.3; reg(clip, 'prop'); A.addSolid(142.4, 142.8, -9.8, -9.4, 'QA clipboard stand');
    // west wall: Ratita spare-parts vending machine, a waiting bench, a robot charging dock
    var vm = grp('Ratita spare-parts vending machine', 120.65, -9.2, Math.PI / 2); add(vm, bx(1.3, 2.1, 0.8), ph('#be185d', 40, '#2a0016'), 0, 1.05, 0); add(vm, bx(0.9, 1.3, 0.04), new T.MeshPhongMaterial({ color: '#fce7f3', transparent: true, opacity: 0.35, shininess: 120 }), -0.12, 1.25, 0.41);
    var goods = []; for (var r2 = 0; r2 < 4; r2++) for (var c3 = 0; c3 < 4; c3++) goods.push([-0.45 + c3 * 0.22, 0.75 + r2 * 0.3, 0.3, 0, 1]); inst(vm, bx(0.14, 0.18, 0.12), ph('#facc15', 40), goods, 'vending goods');
    panel(vm, 512, 112, 1.2, function (c, w, h) { c.fillStyle = '#500724'; c.fillRect(0, 0, w, h); txt(c, 'RATITA SPARE PARTS', w / 2, 40, 42, '#ff4fd8', w - 20, true); txt(c, 'chips \u00b7 buttons \u00b7 cheese', w / 2, 88, 28, '#fbcfe8', w - 20); }, 0, 2.2, 0.41);
    reg(vm, 'prop'); A.addSolid(120, 121.1, -9.85, -8.55, 'Ratita spare-parts vending machine');
    var wb = grp('Waiting bench', 120.6, 5.8, Math.PI / 2); add(wb, bx(1.6, 0.1, 0.5), ph('#15803d', 30), 0, 0.46, 0); add(wb, bx(1.6, 0.5, 0.08), ph('#15803d', 30), 0, 0.76, -0.22); [-0.7, 0.7].forEach(function (x) { add(wb, bx(0.08, 0.44, 0.45), chrome, x, 0.22, 0); });
    add(wb, bx(0.3, 0.04, 0.22), ph('#fef3c7', 10), 0.4, 0.53, 0.05); reg(wb, 'prop'); A.addSolid(120.3, 120.9, 4.95, 6.65, 'Waiting bench');
    person(120.75, 5.4, Math.PI / 2, 6, 'look', false);
    var dock = grp('Robot charging dock', 121.0, -4.6, Math.PI / 2); add(dock, bx(0.9, 0.08, 0.9), ph('#111827', 30), 0, 0.04, 0); add(dock, bx(0.9, 1.2, 0.12), ph('#e5e7eb', 80), 0, 0.6, -0.4); add(dock, bx(0.5, 0.12, 0.04), gl('#4ade80'), 0, 1.0, -0.33);
    var db = new T.Group(); dock.add(db); add(db, cy(0.26, 0.3, 0.45, 14), ph('#e5e7eb', 90), 0, 0.33, 0); add(db, sp(0.22, 14), ph('#e5e7eb', 90), 0, 0.72, 0); add(db, bx(0.26, 0.08, 0.04), gl('#facc15'), 0, 0.74, 0.2); FX.sleepBot = db;
    panel(dock, 256, 64, 0.8, function (c, w, h) { c.fillStyle = '#052e16'; c.fillRect(0, 0, w, h); txt(c, 'TT-4 \u00b7 charging 87%', w / 2, h / 2, 26, '#4ade80', w - 10); }, 0, 1.3, -0.33);
    reg(dock, 'prop'); A.addSolid(120.5, 121.5, -5.1, -4.1, 'Robot charging dock');
    // pennant strings across the ceiling (Tortuga green / sand / Ratita pink), one instanced mesh
    var fl = [], tri = geo('pennant', function () { var g2 = new T.BufferGeometry(); g2.setAttribute('position', new T.Float32BufferAttribute([-0.18, 0, 0, 0.18, 0, 0, 0, -0.38, 0], 3)); g2.computeVertexNormals(); return g2; });
    [-8, -1, 6].forEach(function (z) { for (var x = B.minX + 0.6; x < B.maxX - 0.4; x += 0.55) fl.push([x, B.H - 0.75 + Math.cos((x - B.minX) / (B.maxX - B.minX) * Math.PI * 2) * 0.15, z, 0, 1]); });
    var pm = inst(ROOT, tri, new T.MeshBasicMaterial({ color: '#ffffff', side: T.DoubleSide }), fl, 'pennants'); pm.instanceColor = new T.InstancedBufferAttribute(new Float32Array(fl.length * 3), 3);
    var cc = new T.Color(); fl.forEach(function (q, i) { cc.set(['#4ade80', '#e9c46a', '#ff4fd8'][i % 3]); pm.setColorAt(i, cc); }); pm.instanceColor.needsUpdate = true;
  }

  /* ---------- travel ---------- */
  RW.inside = function () { var p = A ? A.pose() : null; return !!p && p.x > B.minX - 2 && p.x < B.maxX + 2 && p.z > B.minZ - 2 && p.z < B.maxZ + 2; };
  RW.enter = function (cb) { var AR = GA.Areas; if (AR && AR.ARRIVE) { AR.ARRIVE.remaster = function () { AR.goTo(B.spawn.x, B.spawn.z, 1, 0); }; AR.ARRIVE.remaster_back = function () { AR.goTo(RW.DOOR.x + 2.3, RW.DOOR.z, 1, 0); }; AR.travel('remaster', cb); } else { GA.Hub.setPlayer(B.spawn.x, B.spawn.z); if (cb) cb(); } };
  RW.leave = function (cb) { var AR = GA.Areas; if (AR && AR.ARRIVE) { AR.ARRIVE.remaster_back = function () { AR.goTo(RW.DOOR.x + 2.3, RW.DOOR.z, 1, 0); }; AR.travel('remaster_back', cb); } else GA.Hub.setPlayer(RW.DOOR.x + 2.3, RW.DOOR.z); };

  /* ---------- per-frame ---------- */
  var LINES = {
    torty: ['Welcome to the Works! I\u2019m Martina, but everybody calls me Torty.', 'Every remaster goes through the Shell-Tough rig. If it survives a tortoise, it survives anything.', 'Re-Blocked came out of this very room. Shiny caves, dark caves, happy David.', 'Got an idea for a sequel? The Remaster Machine is right behind me. Pull the lever!', 'Slow and steady ships the game. Well... steady, anyway.', 'Luna wired the machine. Please do not ask her what the pink button does.', 'Quality-of-life fixes count too! Tiny fixes make big smiles.'],
    bot: ['Yes, Torty!', 'Crash test complete, Torty. Shell intact.', 'Beep. Sweeping. Beep.', 'Torty, Pi-rat is on the parts wall again.']
  };
  RW.LINES = LINES;
  var idleT = 6, seen = false, botSay = 0, crashT = 0;
  function frame(t, dt) {
    var inR = RW.inside(); if (ROOT.visible !== inR) ROOT.visible = inR;
    var p = A.pose(); if (DOOR) { var nearDoor = p.z > 34 && p.z < 70 && p.x > 0 && p.x < 20; DOOR.visible = nearDoor; if (nearDoor) { if (FX.doorTex) FX.doorTex.offset.y = (t * 0.4) % 1; FX.doorBulbs.forEach(function (b, k) { b.visible = ((k + Math.floor(t * 5)) % 3) !== 0; }); FX.doorBot.rotation.y = Math.sin(t * 0.8) * 0.6; if (FX.podTorty) FX.podTorty.rotation.y = Math.sin(t * 0.6) * 0.4; } }
    if (!inR) { seen = false; return; }
    if (!seen) { seen = true; idleT = 9; RW.say(LINES.torty[0], 5); if (RW.onEnter) RW.onEnter(); }
    // machine: rings spin, lever wiggles, screen animates (redrawn ~8x a second, not every frame)
    FX.screens.forEach(function (s) { s.ring.position.y = 2.4 + Math.sin(t * 1.5 + s.sd) * 0.9; s.ring.rotation.z = t * s.sd; });
    if (FX.lever) FX.lever.rotation.x = RW._pull > 0 ? -0.9 : Math.sin(t * 0.7) * 0.05; if (RW._pull > 0) RW._pull -= dt;
    if (FX.ticket) FX.ticket.position.z = 1.36 + (RW._print > 0 ? (1 - RW._print) * 0.25 : 0); if (RW._print > 0) RW._print -= dt * 0.5;
    if (!FX._ms || t - FX._ms > 0.12) { FX._ms = t; drawMachineScreen(t); }
    // crash-test: sled races into the barrier every 6 s, the barrier shakes, the counter goes up
    var ct = t % 6, x = ct < 1.2 ? -1.6 : ct < 1.8 ? -1.6 + (ct - 1.2) / 0.6 * 3.15 : ct < 4.5 ? 1.55 - Math.min(1, (ct - 1.8) * 1.5) * 0.15 : 1.4 - (ct - 4.5) / 1.5 * 3.0;
    if (FX.sled) { FX.sled.position.x = x; FX.sled.rotation.z = ct > 1.8 && ct < 2.1 ? Math.sin(t * 60) * 0.06 : 0; }
    if (FX.barrier) FX.barrier.position.x = 2.3 + (ct > 1.8 && ct < 2.2 ? Math.sin(t * 80) * 0.04 : 0);
    var nC = Math.floor(t / 6); if (FX.crashDisp && nC !== crashT) { crashT = nC; var c = FX.crashDisp.g; c.fillStyle = '#052e16'; c.fillRect(0, 0, 256, 96); txt(c, 'CRASHES: ' + (1200 + nC), 128, 32, 30, GREEN, 240); txt(c, 'SHELL: 100% \u2713', 128, 70, 26, '#facc15', 240); FX.crashDisp.tex.needsUpdate = true; }
    // robots patrol, staff work, pets idle
    FX.bots.forEach(function (b) { var a = b.o.path[0], z = b.o.path[1], L = Math.hypot(z[0] - a[0], z[1] - a[1]), s = ((t * b.o.sp / L) + b.ph) % 2, f = s < 1 ? s : 2 - s; b.g.position.set(a[0] + (z[0] - a[0]) * f, Math.abs(Math.sin(t * 6)) * 0.01, a[1] + (z[1] - a[1]) * f); b.g.rotation.y = Math.atan2(z[0] - a[0], z[1] - a[1]) + (s < 1 ? 0 : Math.PI); b.bulb.visible = Math.floor(t * 3 + b.ph) % 2 === 0; });
    FX.vis.forEach(function (v) { var s = Math.sin(t * 6 + v.ph); if (v.pose === 'work') { v.aL.rotation.x = -1.0 + s * 0.15; v.aR.rotation.x = -1.0 - s * 0.15; } v.hd.rotation.y = Math.sin(t * 0.7 + v.ph) * 0.3; });
    if (FX.holo) { FX.holo.rotation.y = t * 0.7; FX.holo.position.y = 1.55 + Math.sin(t * 1.4) * 0.06; }
    if (FX.luna) FX.luna.rotation.y = 0.3 + Math.sin(t * 0.9) * 0.5; if (FX.pirat) FX.pirat.position.x = 125.4 + Math.sin(t * 0.4) * 1.8; if (FX.snowie) FX.snowie.rotation.y = 0.2 + Math.sin(t * 1.3) * 0.15; if (FX.candy) FX.candy.rotation.y = 0.6 + Math.sin(t * 0.5) * 0.4;
    if (TORTY.m) { TORTY.m.position.y = 0.16 + Math.abs(Math.sin(t * 1.2)) * 0.02; var want = Math.atan2(p.x - 137.6, p.z - 3.2) - TORTY.g.rotation.y; TORTY.m.rotation.y += ((Math.max(-0.8, Math.min(0.8, Math.atan2(Math.sin(want), Math.cos(want))))) - TORTY.m.rotation.y) * Math.min(1, dt * 2); }
    if (TORTY.bub) TORTY.bub.tick(dt); if (FX.botBub) FX.botBub.tick(dt);
    idleT -= dt; if (idleT <= 0 && !(GA.AreasUI && GA.AreasUI.kind && GA.AreasUI.kind())) { idleT = 12 + Math.random() * 6; if (Math.random() < 0.7) RW.say(LINES.torty[1 + Math.floor(Math.random() * (LINES.torty.length - 1))], 5); else if (FX.botBub) FX.botBub.say(LINES.bot[Math.floor(Math.random() * LINES.bot.length)], 3.5); }
  }

  RW.build = function (api) {
    A = api; ROOT = new T.Group(); ROOT.name = 'area:remaster'; A.scene.add(ROOT); (A.addRegion || GA.Hub.addRegion)(B);
    shell(); exitDoor(); machine(); torty(); boardWall(); shelf(); workshop(); robots(); people(); pets(); extras(); hallDoor();
    if (FX.bots[0]) FX.botBub = bubble(FX.bots[0].g, 1.9, '#0e7490');
    ROOT.visible = false; RW.built = true;
    var last = 0; A.anims.push(function (t) { var dt = last ? Math.min(0.05, t - last) : 0.016; last = t; frame(t, dt); });
  };
  RW.pull = function () { RW._pull = 0.8; RW._print = 1; };
  RW.fx = FX;
})();
