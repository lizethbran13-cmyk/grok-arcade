/* Grok Arcade - RATITA PREVIEW CENTER (3D). The room behind the Food Court (x -18..1.6, z 26.4..48), door between the slushie
   machine and the ice cream freezer. Run by LILI, Mimi's and Lily's distant cousin (Ratita Industries QA bot, built by Luna,
   Pi-rat & Snowie). Inside: Lili's reception desk, a poster wall of upcoming DLC + builds (live from the GitHub issues, every
   picture keeps its real shape via GA.Pics.frame), the SCHEDULED ADDITIONS board, the TIME JUMPER (plays real work-in-progress
   snapshots listed in preview.json; it malfunctions now and then), server racks, a lab bench, crates from the future and the
   bonus #32 CHRONO COURIER cabinet. Far away: the GL1TCH R00M where a misfiring jump can drop you (the exit portal is right there).
   Speed: one root (area:preview) that js/perf.js hides unless you're in the Food Court or here; LEDs/rivets are InstancedMeshes;
   static props get merged; posters are rebuilt when live data arrives so they sit under a noBatch group. */
(function () {
  'use strict';
  var T = THREE, PR = GA.Preview = {}, A, P, R, GR, mats = {}, CABS = {}, ANIM = [], st = { t: 0, spin: 1, flash: 0, sparks: 0, glitch: 0, built: false };
  PR.CABS = CABS; PR.st = st;
  var GLR = { name: 'glitch', minX: 120, maxX: 132, minZ: 100, maxZ: 112, maxY: 7, H: 5.2, spawn: { x: 126, z: 105.2 } };
  PR.GLITCH = GLR;
  var JX = -9.5, JZ = 38.6; // Time Jumper centre
  PR.JUMPER = { x: JX, z: JZ };

  /* ---------- helpers ---------- */
  function ph(c, s, e) { var k = c + '|' + (s || 30) + '|' + (e || ''); return mats[k] || (mats[k] = new T.MeshPhongMaterial({ color: c, shininess: s || 30, emissive: e ? new T.Color(e) : new T.Color(0) })); }
  function gl(c) { var k = 'g' + c; return mats[k] || (mats[k] = new T.MeshBasicMaterial({ color: c })); }
  function chrome() { return mats.chrome || (mats.chrome = new T.MeshPhongMaterial({ color: '#cfd8e6', shininess: 140, specular: '#ffffff' })); }
  function add(p, g, m, x, y, z) { var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); p.add(o); return o; }
  function bx(w, h, d) { return new T.BoxGeometry(w, h, d); }
  function cy(a, b, h, s) { return new T.CylinderGeometry(a, b, h, s || 20); }
  function sp(r, s) { return new T.SphereGeometry(r, s || 18, Math.max(6, Math.round((s || 18) * 0.66))); }
  function to(r, t, s, a) { return new T.TorusGeometry(r, t, 10, s || 32, a || Math.PI * 2); }
  function grp(name, par) { var g = new T.Group(); g.name = name; (par || R).add(g); return g; }
  function reg(name, g, kind) { g.updateMatrixWorld(true); return A.regItem(name, kind || 'prop', g); }
  function solid(minX, maxX, minZ, maxZ, name) { A.addSolid(minX, maxX, minZ, maxZ, name); }
  function cvs(w, h, draw) { var c = A.mkCanvas(w, h), t = A.canvasTex(c); if (draw) draw(c.getContext('2d'), w, h); t.needsUpdate = true; if (GA.Pics) GA.Pics.prep(t); return { c: c, tex: t, g: c.getContext('2d'), redraw: function (f) { f(c.getContext('2d'), w, h); t.needsUpdate = true; } }; }
  function planeM(w, h, tex, par, x, y, z, ry) { var m = add(par, new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, toneMapped: false }), x, y, z); if (ry) m.rotation.y = ry; return m; }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function neon(c, s, x, y, px, col, mw) { c.save(); c.font = '900 ' + px + 'px "Trebuchet MS",system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; var w = c.measureText(s).width; if (mw && w > mw) { c.font = '900 ' + Math.floor(px * mw / w) + 'px "Trebuchet MS",system-ui,sans-serif'; } c.shadowColor = col; c.shadowBlur = px * 0.35; c.fillStyle = col; c.fillText(s, x, y); c.shadowBlur = 0; c.fillStyle = '#ffffff'; c.globalAlpha = 0.55; c.fillText(s, x, y); c.restore(); }
  function txt(c, s, x, y, px, col, align, font) { c.font = (font || 'bold') + ' ' + px + 'px "Trebuchet MS",system-ui,sans-serif'; c.textAlign = align || 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(s, x, y); }
  function fitTxt(c, s, x, y, px, col, mw, align) { var f = px; do { c.font = 'bold ' + f + 'px "Trebuchet MS",system-ui,sans-serif'; f -= 2; } while (f > 10 && c.measureText(s).width > mw); c.textAlign = align || 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(s, x, y); }
  function wrapTxt(c, s, x, y, px, col, mw, lh, maxL) { c.font = 'bold ' + px + 'px "Trebuchet MS",system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; var words = String(s).split(/\s+/), lines = [], cur = ''; words.forEach(function (w) { var t2 = cur ? cur + ' ' + w : w; if (c.measureText(t2).width > mw && cur) { lines.push(cur); cur = w; } else cur = t2; }); if (cur) lines.push(cur); if (lines.length > maxL) { lines = lines.slice(0, maxL); lines[maxL - 1] = lines[maxL - 1].replace(/\s*\S*$/, '') + '\u2026'; } lines.forEach(function (l, i) { c.fillText(l, x, y + i * lh); }); return lines.length; }
  function glowFloor(par, c, w, d, x, z) { var m = new T.MeshBasicMaterial({ map: A.glowTex, color: c, transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending }); var f = add(par, new T.PlaneGeometry(w, d), m, x, 0.03, z); f.rotation.x = -Math.PI / 2; f.renderOrder = 2; A.noAud(f); return m; }
  function inter(o) { // same shape as the hub's cabinets: walk up -> prompt -> button
    var dir = new T.Vector3(o.dir[0], 0, o.dir[1]).normalize(), par = o.par || R;
    var gm = o.noGlow ? new T.MeshBasicMaterial({ transparent: true, opacity: 0 }) : glowFloor(par, o.col || '#2dd4bf', o.gw || 1.5, o.gh || 1.2, o.x, o.z);
    var an = new T.Object3D(); an.name = 'anchor ' + o.id; an.position.set(o.x - dir.x * 1.75, 0, o.z - dir.z * 1.75); an.rotation.y = Math.atan2(dir.x, dir.z); par.add(an); an.updateMatrixWorld(true);
    var cab = { game: { id: o.id, name: o.name, desc: o.desc || '', color: o.col || '#2dd4bf' }, kind: o.kind, id: o.id, group: an, x: o.x, z: o.z, rot: an.rotation.y, front: new T.Vector3(o.x, 0, o.z), dir: dir, glow: gm, nextDraw: Infinity, r: o.r || 1.1, ar: true, area: o.area || 'preview', data: o.data || {} };
    A.cabinets.push(cab); CABS[o.id] = cab; return cab;
  }
  PR.cab = function (id) { return CABS[id]; };
  function bubble(par, y, ink) {
    var c = A.mkCanvas(512, 200), t = A.canvasTex(c); t.minFilter = T.LinearFilter; t.generateMipmaps = false;
    var s = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false })); s.scale.set(2.3, 0.9, 1); s.position.set(0, y, 0); s.visible = false; s.renderOrder = 10; par.add(s); A.noAud(s);
    return { s: s, c: c, t: t, T: 0, last: null, ink: ink || '#0f3b36' };
  }
  function bubbleDraw(b, text) {
    var c = b.c, g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
    g.fillStyle = '#effffb'; g.strokeStyle = b.ink; g.lineWidth = 6; rr(g, 6, 6, w - 12, h - 46, 26); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(w / 2 - 20, h - 42); g.lineTo(w / 2, h - 8); g.lineTo(w / 2 + 20, h - 42); g.closePath(); g.fill(); g.stroke(); g.fillRect(w / 2 - 17, h - 46, 34, 6);
    g.fillStyle = b.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    var words = String(text).split(' '), lines = [], cur = '', px = 30; g.font = 'bold ' + px + 'px "Trebuchet MS",system-ui,sans-serif';
    function wrap(mw) { lines = []; cur = ''; words.forEach(function (wd) { var t2 = cur ? cur + ' ' + wd : wd; if (g.measureText(t2).width > mw) { lines.push(cur); cur = wd; } else cur = t2; }); if (cur) lines.push(cur); }
    wrap(w - 50); if (lines.length > 3) { px = 24; g.font = 'bold ' + px + 'px "Trebuchet MS",system-ui,sans-serif'; wrap(w - 40); lines = lines.slice(0, 4); }
    lines.forEach(function (ln, i) { g.fillText(ln, w / 2, (h - 40) / 2 + (i - (lines.length - 1) / 2) * (px + 4)); });
    b.t.needsUpdate = true;
  }

  /* ---------- the room shell ---------- */
  function tileTex() { var c = A.mkCanvas(256, 256), g = c.getContext('2d'); g.fillStyle = '#10243a'; g.fillRect(0, 0, 256, 256);
    for (var y = 0; y < 2; y++) for (var x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#142e48' : '#0e2134'; g.fillRect(x * 128 + 3, y * 128 + 3, 122, 122); }
    g.strokeStyle = 'rgba(45,212,191,.55)'; g.lineWidth = 2; g.strokeRect(1, 1, 254, 254); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke();
    g.fillStyle = 'rgba(251,113,133,.7)'; [[128, 128], [0, 0], [256, 0], [0, 256], [256, 256]].forEach(function (q) { g.beginPath(); g.arc(q[0], q[1], 5, 0, 7); g.fill(); });
    var t = A.canvasTex(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
  function panelTex() { var c = A.mkCanvas(256, 256), g = c.getContext('2d'); var gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#1d1640'); gr.addColorStop(1, '#2a1f5c'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(167,139,250,.35)'; g.lineWidth = 3; g.strokeRect(8, 8, 240, 240); g.strokeStyle = 'rgba(45,212,191,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(8, 128); g.lineTo(248, 128); g.stroke();
    g.fillStyle = 'rgba(207,216,230,.45)'; [[20, 20], [236, 20], [20, 236], [236, 236]].forEach(function (q) { g.beginPath(); g.arc(q[0], q[1], 4, 0, 7); g.fill(); });
    var t = A.canvasTex(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
  function shell() {
    var B = P, W = B.maxX - B.minX, D = B.maxZ - B.minZ, cx = (B.minX + B.maxX) / 2, cz = (B.minZ + B.maxZ) / 2, H = B.h, sh = grp('Preview Center shell'); A.noAud(sh);
    var ft = tileTex(); ft.repeat.set(W / 2, D / 2); var fl = add(sh, new T.PlaneGeometry(W, D), new T.MeshPhongMaterial({ map: ft, shininess: 80, specular: '#335566' }), cx, 0, cz); fl.rotation.x = -Math.PI / 2;
    var ce = add(sh, new T.PlaneGeometry(W, D), ph('#0c0a24', 10), cx, H, cz); ce.rotation.x = Math.PI / 2;
    var pt = panelTex(); function wallM(len) { var t2 = pt.clone(); t2.needsUpdate = true; t2.repeat.set(len / 2.2, (H - 1.1) / 2.2); return new T.MeshLambertMaterial({ map: t2 }); }
    function wall(len, h, x, y, z, ry, m) { var o = add(sh, new T.PlaneGeometry(len, h), m, x, y, z); o.rotation.y = ry; return o; }
    var dado = ph('#0f766e', 40), trim = gl('#2dd4bf'), trim2 = gl('#fb7185');
    // west, back (north = +z), east walls
    [[D, B.minX + 0.01, cz, Math.PI / 2], [W, cx, B.maxZ - 0.01, Math.PI], [D, B.maxX - 0.01, cz, -Math.PI / 2]].forEach(function (s2) {
      var len = s2[0], ox = s2[1], oz = s2[2], ry = s2[3]; wall(len, H - 1.1, ox, 1.1 + (H - 1.1) / 2, oz, ry, wallM(len)); wall(len, 1.1, ox, 0.55, oz, ry, dado);
      var nx = Math.sin(ry) * 0.03, nz = Math.cos(ry) * 0.03, along = Math.abs(Math.cos(ry)) > 0.5;
      add(sh, bx(along ? len : 0.05, 0.07, along ? 0.05 : len), trim, ox + nx, 1.12, oz + nz); add(sh, bx(along ? len : 0.05, 0.05, along ? 0.05 : len), trim2, ox + nx, H - 0.3, oz + nz); });
    // front wall (z = minZ, faces +z) with the doorway
    var dl = B.doorX - B.doorHW, dr = B.doorX + B.doorHW, zF = B.minZ + 0.01;
    [[B.minX, dl], [dr, B.maxX]].forEach(function (s2) { var len = s2[1] - s2[0], mx = (s2[0] + s2[1]) / 2; wall(len, H - 1.1, mx, 1.1 + (H - 1.1) / 2, zF, 0, wallM(len)); wall(len, 1.1, mx, 0.55, zF, 0, dado); add(sh, bx(len, 0.07, 0.05), trim, mx, 1.12, zF + 0.03); add(sh, bx(len, 0.05, 0.05), trim2, mx, H - 0.3, zF + 0.03); });
    wall(B.doorHW * 2, H - B.doorH, B.doorX, B.doorH + (H - B.doorH) / 2, zF, 0, wallM(B.doorHW * 2));
    // door reveal (the 0.4 m thick wall between the rooms) + door frames on both sides
    var rev = ph('#1e293b', 30); add(sh, bx(0.06, B.doorH, 0.4), rev, dl - 0.03, B.doorH / 2, (A.FOOD.maxZ + B.minZ) / 2); add(sh, bx(0.06, B.doorH, 0.4), rev, dr + 0.03, B.doorH / 2, (A.FOOD.maxZ + B.minZ) / 2); add(sh, bx(B.doorHW * 2 + 0.12, 0.06, 0.4), rev, B.doorX, B.doorH + 0.03, (A.FOOD.maxZ + B.minZ) / 2);
    var tealM = ph('#14b8a6', 80, '#053b36'), corM = ph('#fb7185', 70, '#4a0f1c');
    [A.FOOD.maxZ - 0.04, B.minZ + 0.04].forEach(function (z, k) { [-1, 1].forEach(function (sd) { add(sh, bx(0.14, B.doorH + 0.14, 0.08), k ? tealM : corM, B.doorX + sd * (B.doorHW + 0.07), (B.doorH + 0.14) / 2, z); }); add(sh, bx(B.doorHW * 2 + 0.28, 0.14, 0.08), k ? tealM : corM, B.doorX, B.doorH + 0.07, z); });
    // ceiling truss + light pods (rivet caps are one InstancedMesh)
    var truss = ph('#334155', 60), pod = gl('#e0fffb'), pods = [];
    for (var x = B.minX + 2.2; x < B.maxX - 0.5; x += 3.2) add(sh, bx(0.2, 0.26, D - 0.4), truss, x, H - 0.13, cz);
    for (var z = B.minZ + 2.5; z < B.maxZ - 0.5; z += 3.6) add(sh, bx(W - 0.4, 0.18, 0.16), truss, cx, H - 0.35, z);
    for (x = B.minX + 2.2; x < B.maxX - 0.5; x += 3.2) for (z = B.minZ + 2.5; z < B.maxZ - 0.5; z += 3.6) pods.push([x, z]);
    var pg = new T.CylinderGeometry(0.16, 0.22, 0.1, 14), im = new T.InstancedMesh(pg, pod, pods.length), m4 = new T.Matrix4(); pods.forEach(function (q, i) { m4.makeTranslation(q[0], H - 0.5, q[1]); im.setMatrixAt(i, m4); }); im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; sh.add(im);
    var l1 = new T.PointLight('#bffcf2', 0.75, 20, 1.4); l1.position.set(-4.5, H - 0.9, 33); R.add(l1); var l2 = new T.PointLight('#e9d5ff', 0.7, 20, 1.4); l2.position.set(-13.5, H - 0.9, 42); R.add(l2);
    var l3 = new T.PointLight('#5eead4', 0.9, 11, 1.6); l3.position.set(JX, 3.2, JZ); R.add(l3); st.coreLight = l3;
    // glowing floor path from the door to the Time Jumper
    var pm = new T.MeshBasicMaterial({ color: '#2dd4bf', transparent: true, opacity: 0.35, depthWrite: false, blending: T.AdditiveBlending }); st.path = pm;
    for (var i = 0; i < 9; i++) { var f = i / 8, px = B.doorX + (JX + 1.2 - B.doorX) * f, pz = B.minZ + 1.0 + (JZ - 5.3 - B.minZ - 1.0) * f; var ch = add(sh, new T.PlaneGeometry(0.5, 0.22), pm, px, 0.025, pz); ch.rotation.x = -Math.PI / 2; ch.rotation.z = Math.atan2(JX + 1.2 - B.doorX, JZ - 5.3 - B.minZ - 1.0) + Math.PI; ch.renderOrder = 2; }
  }
  /* food-court side: the big entrance sign + floor decal so you find the door */
  function entrance() {
    var B = P, z = A.FOOD.maxZ - 0.03, g = grp('Preview Center entrance sign');
    var s = cvs(1024, 320, function (c, w, h) { var gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#062a2a'); gr.addColorStop(1, '#1f0b2e'); c.fillStyle = gr; rr(c, 6, 6, w - 12, h - 12, 34); c.fill(); c.strokeStyle = '#2dd4bf'; c.lineWidth = 10; c.stroke();
      neon(c, 'RATITA PREVIEW CENTER', w / 2, 112, 92, '#5eead4', w - 70); c.font = 'bold 40px "Trebuchet MS",sans-serif'; c.fillStyle = '#fecdd3'; c.textAlign = 'center'; c.fillText('\uD83D\uDC2D sneak peeks \u00b7 schedule \u00b7 TIME JUMPER \u00b7 ask Lili', w / 2, 226); });
    var m = planeM(2.9, 0.906, s.tex, g, B.doorX - 0.2, 3.95, z - 0.02, Math.PI); A.regItem('sign:Preview Center', 'sign', m);
    var dc = A.decal('PREVIEW CENTER', 1.5, 0.5, '#2dd4bf', B.doorX, A.FOOD.maxZ - 1.0, Math.PI, 'Ratita Industries'); R.attach(dc); A.regItem('decal:PREVIEW CENTER', 'decal', dc);

  }

  /* ---------- LILI: round mint hover-bot, coral trim, goggle visor, three mouse-ear antennas (Luna, Pi-rat, Snowie made her) ---------- */
  var LI = {};
  function lili(par, x, z, ry) {
    var g = new T.Group(); g.name = 'Lili'; g.position.set(x, 0, z); g.rotation.y = ry; par.add(g); LI.g = g;
    var mint = new T.MeshPhongMaterial({ color: '#5eead4', shininess: 120, specular: '#ffffff' }), coral = ph('#fb7185', 90), dk = ph('#0f172a', 40), sil = chrome();
    var hov = new T.Group(); g.add(hov); LI.hov = hov;
    add(g, cy(0.32, 0.36, 0.05, 28), dk, 0, 0.025, 0); LI.ring = add(g, to(0.3, 0.035, 28), gl('#5eead4'), 0, 0.12, 0); LI.ring.rotation.x = Math.PI / 2;
    var thr = add(hov, new T.ConeGeometry(0.16, 0.3, 18), sil, 0, 0.42, 0); thr.rotation.x = Math.PI; LI.flame = add(hov, new T.ConeGeometry(0.1, 0.26, 14), new T.MeshBasicMaterial({ color: '#99f6e4', transparent: true, opacity: 0.7, depthWrite: false, blending: T.AdditiveBlending }), 0, 0.2, 0); LI.flame.rotation.x = Math.PI; A.noAud(LI.flame);
    var body = add(hov, sp(0.38, 28), mint, 0, 0.88, 0); body.scale.set(1, 1.05, 0.92);
    add(hov, to(0.385, 0.03, 32), coral, 0, 0.8, 0).rotation.x = Math.PI / 2;
    var belly = cvs(128, 128, function (c, w, h) { c.fillStyle = '#ecfeff'; c.beginPath(); c.arc(64, 64, 60, 0, 7); c.fill(); c.strokeStyle = '#fb7185'; c.lineWidth = 8; c.stroke(); c.fillStyle = '#0f766e'; c.font = 'bold 40px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('QA', 64, 52); c.font = 'bold 18px sans-serif'; c.fillText('LILI', 64, 88); });
    var bm = add(hov, new T.CircleGeometry(0.14, 24), new T.MeshBasicMaterial({ map: belly.tex }), 0, 0.86, 0.352); void bm;
    var head = new T.Group(); head.position.set(0, 1.42, 0); hov.add(head); LI.head = head;
    add(head, sp(0.3, 28), mint, 0, 0, 0).scale.set(1.08, 0.92, 1);
    add(head, cy(0.12, 0.16, 0.08, 20), sil, 0, -0.28, 0);
    // goggle visor: dark band + face screen
    var vis = add(head, new T.CylinderGeometry(0.305, 0.305, 0.2, 32, 1, true), ph('#111827', 90), 0, 0.02, 0); vis.scale.set(1.08, 1, 1);
    LI.face = cvs(256, 96); var fm = add(head, new T.PlaneGeometry(0.42, 0.1575), new T.MeshBasicMaterial({ map: LI.face.tex, toneMapped: false }), 0, 0.02, 0.322); void fm; faceDraw('idle');
    [-1, 1].forEach(function (sd) { add(head, cy(0.06, 0.06, 0.05, 16), coral, sd * 0.33, 0.02, 0).rotation.z = Math.PI / 2; });
    // three mouse-ear antennas: Luna (grey), Pi-rat (tan), Snowie (white)
    [['#9ca3af', -0.17], ['#d6a26b', 0], ['#ffffff', 0.17]].forEach(function (q, i) { var st2 = add(head, cy(0.012, 0.012, 0.16, 6), sil, q[1], 0.32 + (i === 1 ? 0.04 : 0), -0.02); st2.rotation.z = -q[1] * 1.2; var ear = add(head, cy(0.075, 0.075, 0.025, 20), ph(q[0], 40), q[1] * 1.25, 0.42 + (i === 1 ? 0.05 : 0), -0.02); ear.rotation.x = Math.PI / 2; add(head, cy(0.045, 0.045, 0.028, 16), ph('#fbcfe8', 30), q[1] * 1.25, 0.42 + (i === 1 ? 0.05 : 0), -0.005).rotation.x = Math.PI / 2; });
    // arms + clipboard tablet
    LI.arms = []; [-1, 1].forEach(function (sd) { var a = new T.Group(); a.position.set(sd * 0.38, 1.0, 0); hov.add(a); add(a, cy(0.025, 0.025, 0.36, 8), sil, 0, -0.18, 0); add(a, sp(0.05, 10), coral, 0, -0.38, 0); a.rotation.z = sd * 0.35; LI.arms.push(a); });
    var tab = new T.Group(); tab.position.set(0.02, -0.4, 0.12); LI.arms[1].add(tab); tab.rotation.set(-0.9, 0, -0.3); add(tab, bx(0.26, 0.34, 0.02), dk, 0, 0, 0); LI.tabScr = cvs(128, 160, function (c, w, h) { c.fillStyle = '#022c2a'; c.fillRect(0, 0, w, h); c.fillStyle = '#5eead4'; c.font = 'bold 16px monospace'; for (var i = 0; i < 6; i++) c.fillText((i < 4 ? '\u2611 ' : '\u2610 ') + ['DOOR', 'POSTERS', 'BOARD', 'JUMPER', 'CHEESE', 'NAP'][i], 8, 22 + i * 24); });
    add(tab, new T.PlaneGeometry(0.22, 0.275), new T.MeshBasicMaterial({ map: LI.tabScr.tex }), 0, 0, 0.012);
    LI.bub = bubble(g, 2.45, '#0f3b36');
    return g;
  }
  function faceDraw(mood) { if (!LI.face) return; LI.mood = mood; LI.face.redraw(function (c, w, h) { c.fillStyle = '#04201e'; c.fillRect(0, 0, w, h); c.fillStyle = mood === 'glitch' ? '#fb7185' : '#5eead4'; c.shadowColor = c.fillStyle; c.shadowBlur = 10;
    if (mood === 'blink') { c.fillRect(50, 46, 50, 6); c.fillRect(156, 46, 50, 6); }
    else if (mood === 'glitch') { c.font = 'bold 54px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('x_x', 128, 50); }
    else if (mood === 'happy') { c.beginPath(); c.arc(75, 60, 26, Math.PI, 0); c.arc(181, 60, 26, Math.PI, 0); c.lineWidth = 9; c.strokeStyle = '#5eead4'; c.stroke(); }
    else { c.fillRect(50, 26, 50, 42); c.fillRect(156, 26, 50, 42); c.fillStyle = '#04201e'; c.fillRect(50, 26, 50, mood === 'squint' ? 22 : 10); c.fillRect(156, 26, 50, mood === 'squint' ? 22 : 10); } c.shadowBlur = 0; }); }
  PR.say = function (text, secs) { if (!LI.bub) return text; bubbleDraw(LI.bub, text); LI.bub.s.visible = true; LI.bub.T = secs || 4.5; LI.bub.last = text; LI.talk = 1.2; return text; };
  PR.liliLine = function () { return LI.bub && LI.bub.T > 0 ? LI.bub.last : null; };
  PR.liliMood = function (m, secs) { faceDraw(m); LI.moodT = secs || 2; };

  function desk() {
    var x0 = -3.4, z0 = 30.4, g = grp('Lili\u2019s reception desk'); g.position.set(x0, 0, z0);
    var top = ph('#e2e8f0', 90), body = ph('#134e4a', 50), glowS = gl('#2dd4bf');
    add(g, bx(0.8, 1.0, 2.8), body, 0, 0.5, 0); add(g, bx(0.98, 0.06, 3.0), top, 0.05, 1.03, 0); add(g, bx(0.04, 0.06, 2.7), glowS, 0.42, 0.2, 0);
    [-1, 1].forEach(function (sd) { add(g, new T.CylinderGeometry(0.4, 0.4, 1.0, 24, 1, false, 0, Math.PI), body, 0, 0.5, sd * 1.4).rotation.y = sd > 0 ? -Math.PI / 2 : Math.PI / 2; add(g, new T.CylinderGeometry(0.49, 0.49, 0.06, 24, 1, false, 0, Math.PI), top, 0.05, 1.03, sd * 1.4).rotation.y = sd > 0 ? -Math.PI / 2 : Math.PI / 2; });
    var logo = cvs(512, 256, function (c, w, h) { c.fillStyle = '#0b3b38'; c.fillRect(0, 0, w, h); mouse(c, w / 2 - 110, 100, 46, '#9ca3af'); mouse(c, w / 2, 92, 52, '#d6a26b'); mouse(c, w / 2 + 110, 100, 46, '#ffffff'); neon(c, 'RATITA INDUSTRIES', w / 2, 204, 46, '#5eead4', w - 40); });
    planeM(1.6, 0.8, logo.tex, g, 0.41, 0.56, 0, Math.PI / 2);
    // two monitors, a bell, a cheese paperweight, a mini Time Jumper model, cousins' photo frames, a "QUALITY IS NOT OPTIONAL" mug
    [[-0.6, -0.15], [0.6, 0.15]].forEach(function (q, i) { var mo = new T.Group(); mo.position.set(-0.15, 1.06, q[0]); mo.rotation.y = Math.PI / 2 + q[1]; g.add(mo); add(mo, bx(0.06, 0.24, 0.06), chrome(), 0, 0.12, 0); add(mo, bx(0.6, 0.38, 0.04), ph('#0f172a', 60), 0, 0.42, 0);
      var sc = cvs(256, 160, function (c, w, h) { c.fillStyle = '#021b1a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2dd4bf'; c.lineWidth = 3; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#5eead4'; c.font = 'bold 18px monospace'; (i ? ['BUG LOG', '#1 not a bug', '#2 feature', '#3 cheese?!', '#4 ...nap'] : ['QA STATUS', 'DOOR  OK', 'BOARD OK', 'JUMPER ~OK', 'MOOD  meh']).forEach(function (l, k) { c.fillText(l, 16, 32 + k * 26); }); });
      planeM(0.56, 0.35, sc.tex, mo, 0, 0.42, 0.022); });
    add(g, cy(0.07, 0.08, 0.03, 18), chrome(), 0.25, 1.075, 0.9); add(g, sp(0.06, 14), ph('#fbbf24', 120), 0.25, 1.11, 0.9).scale.y = 0.7;
    var ch = add(g, new T.CylinderGeometry(0.12, 0.12, 0.08, 3), ph('#fcd34d', 30), 0.2, 1.1, -0.95); ch.rotation.y = 0.4;
    var mj = new T.Group(); mj.position.set(0.15, 1.06, -0.45); g.add(mj); add(mj, cy(0.1, 0.12, 0.03, 18), ph('#334155', 50), 0, 0.015, 0); add(mj, to(0.08, 0.008, 20), gl('#5eead4'), 0, 0.1, 0); var mr = add(mj, to(0.065, 0.008, 20), gl('#fb7185'), 0, 0.1, 0); mr.rotation.x = Math.PI / 2; ANIM.push(function (t) { mj.rotation.y = t * 1.5; mr.rotation.y = t * 2.3; });
    // cousins photo frames (canvas portraits, frame = canvas shape 3:4)
    [['Mimi', '#ff4fd8', '#ffe14d'], ['Lily', '#b9a3ff', '#7c3aed']].forEach(function (q, i) { var pf = new T.Group(); pf.position.set(-0.05, 1.06, 1.05 - i * 0.28); pf.rotation.y = Math.PI / 2 - 0.3 + i * 0.15; g.add(pf);
      add(pf, bx(0.2, 0.26, 0.02), ph('#fde68a', 80), 0, 0.14, 0); var pt = cvs(150, 200, function (c, w, h) { c.fillStyle = '#e0f2fe'; c.fillRect(0, 0, w, h); c.fillStyle = q[1]; rr(c, 30, 50, 90, 80, 22); c.fill(); c.fillStyle = '#111'; c.fillRect(52, 78, 12, 16); c.fillRect(86, 78, 12, 16); c.fillStyle = q[2]; c.fillRect(30, 140, 90, 50); c.fillStyle = '#334155'; c.font = 'bold 24px sans-serif'; c.textAlign = 'center'; c.fillText(q[0], 75, 34); });
      planeM(0.165, 0.22, pt.tex, pf, 0, 0.14, 0.012); add(pf, bx(0.02, 0.2, 0.1), ph('#fde68a', 80), 0, 0.08, -0.05).rotation.x = 0.4; });
    reg('Lili\u2019s reception desk', g, 'counter'); solid(x0 - 0.45, x0 + 0.55, z0 - 1.9, z0 + 1.9, 'Lili\u2019s reception desk');
    lili(R, x0 - 0.95, z0, Math.PI / 2);
    inter({ id: 'pv_lili', kind: 'pv_lili', name: 'Lili', desc: 'Ratita Industries QA bot. Mimi\u2019s and Lily\u2019s distant cousin.', col: '#5eead4', x: x0 + 1.25, z: z0, dir: [1, 0], r: 1.2, gw: 1.4, gh: 2.2 });
  }
  function mouse(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x - r * 0.75, y - r * 0.7, r * 0.5, 0, 7); c.arc(x + r * 0.75, y - r * 0.7, r * 0.5, 0, 7); c.fill(); c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.fillStyle = '#fbcfe8'; c.beginPath(); c.arc(x - r * 0.75, y - r * 0.7, r * 0.28, 0, 7); c.arc(x + r * 0.75, y - r * 0.7, r * 0.28, 0, 7); c.fill(); c.fillStyle = '#111827'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.1, r * 0.13, 0, 7); c.arc(x + r * 0.35, y - r * 0.1, r * 0.13, 0, 7); c.fill(); c.fillStyle = '#f472b6'; c.beginPath(); c.arc(x, y + r * 0.25, r * 0.14, 0, 7); c.fill(); }
  PR.mouse = mouse;

  /* ---------- the TIME JUMPER ---------- */
  var JM = {};
  PR.JM = JM;
  function jumper() {
    var g = grp('Time Jumper'); g.position.set(JX, 0, JZ); JM.g = g;
    var steel = ph('#475569', 70), dark = ph('#1e293b', 50), teal = new T.MeshPhongMaterial({ color: '#14b8a6', shininess: 120, emissive: '#064e47' }), coralM = ph('#fb7185', 80, '#3b0a14'), gold = ph('#fbbf24', 120, '#3a2500');
    // stepped dais + glowing seams + hazard ring
    add(g, cy(3.0, 3.1, 0.22, 48), dark, 0, 0.11, 0); add(g, cy(2.6, 2.7, 0.2, 48), steel, 0, 0.32, 0); add(g, cy(1.6, 1.7, 0.16, 40), ph('#0f172a', 90), 0, 0.5, 0);
    var seam = new T.MeshBasicMaterial({ color: '#2dd4bf', transparent: true, opacity: 0.9 }); JM.seam = seam;
    add(g, to(2.85, 0.03, 64), seam, 0, 0.225, 0).rotation.x = Math.PI / 2; add(g, to(2.45, 0.03, 64), seam, 0, 0.425, 0).rotation.x = Math.PI / 2; add(g, to(1.62, 0.04, 48), seam, 0, 0.585, 0).rotation.x = Math.PI / 2;
    var hz = cvs(512, 64, function (c, w, h) { for (var i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#111827' : '#facc15'; c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32 + 32, 0); c.lineTo(i * 32 + 16, h); c.lineTo(i * 32 - 16, h); c.fill(); } }); hz.tex.wrapS = T.RepeatWrapping; hz.tex.repeat.set(6, 1);
    var hzr = add(g, new T.CylinderGeometry(3.105, 3.105, 0.12, 64, 1, true), new T.MeshBasicMaterial({ map: hz.tex }), 0, 0.11, 0); void hzr;
    // four pylons with coils + cables to the ring
    for (var i = 0; i < 4; i++) { var a = i / 4 * Math.PI * 2 + Math.PI / 4, px = Math.cos(a) * 2.25, pz = Math.sin(a) * 2.25, py = new T.Group(); py.position.set(px, 0.42, pz); py.rotation.y = -a; g.add(py);
      add(py, bx(0.34, 3.2, 0.34), steel, 0, 1.6, 0); add(py, bx(0.4, 0.2, 0.4), coralM, 0, 3.25, 0); for (var k = 0; k < 6; k++) add(py, to(0.21, 0.035, 18), ph('#b45309', 90), 0, 0.7 + k * 0.16, 0).rotation.x = Math.PI / 2;
      add(py, sp(0.13, 14), gl('#99f6e4'), 0, 3.45, 0); add(py, bx(0.05, 1.4, 0.22), gl(i % 2 ? '#5eead4' : '#fb7185'), 0.18, 2.1, 0);
      var cab = new T.Mesh(new T.TubeGeometry(new T.QuadraticBezierCurve3(new T.Vector3(px * 1.05, 0.45, pz * 1.05), new T.Vector3(px * 1.25, 0.1, pz * 1.25), new T.Vector3(px * 1.3, 0.05, pz * 1.3).add(new T.Vector3(Math.cos(a + 0.6), 0, Math.sin(a + 0.6)).multiplyScalar(0.4))), 12, 0.05, 6), ph('#0f172a', 30)); g.add(cab); }
    // central pod: glass capsule with chrome caps + glowing core
    add(g, cy(0.95, 1.05, 0.25, 36), steel, 0, 0.72, 0); add(g, cy(0.85, 0.85, 0.06, 36), gold, 0, 0.86, 0);
    JM.glass = add(g, cy(0.82, 0.82, 2.2, 36, 1, true), new T.MeshPhongMaterial({ color: '#ccfbf1', transparent: true, opacity: 0.18, shininess: 150, side: T.DoubleSide, depthWrite: false }), 0, 1.98, 0);
    add(g, cy(0.98, 0.88, 0.3, 36), steel, 0, 3.22, 0); add(g, new T.SphereGeometry(0.9, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), dark, 0, 3.36, 0); add(g, cy(0.12, 0.2, 0.5, 16), chrome(), 0, 4.45, 0); JM.tip = add(g, sp(0.16, 16), gl('#5eead4'), 0, 4.78, 0);
    JM.core = add(g, new T.IcosahedronGeometry(0.42, 1), new T.MeshBasicMaterial({ color: '#5eead4', transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false }), 0, 1.9, 0); A.noAud(JM.core);
    JM.coreIn = add(g, new T.OctahedronGeometry(0.22), gl('#ffffff'), 0, 1.9, 0);
    // three gyroscope rings that spin around the pod
    JM.rings = [];
    [[2.05, '#5eead4', teal], [1.78, '#fb7185', coralM], [1.52, '#fbbf24', gold]].forEach(function (q, n) { var piv = new T.Group(); piv.position.y = 1.95; g.add(piv); var rg = new T.Group(); piv.add(rg);
      add(rg, to(q[0], 0.07, 64), q[2], 0, 0, 0); for (var k = 0; k < 8; k++) { var aa = k / 8 * Math.PI * 2; add(rg, sp(0.06, 10), gl(q[1]), Math.cos(aa) * q[0], Math.sin(aa) * q[0], 0); }
      piv.rotation.x = n === 0 ? Math.PI / 2 : n === 1 ? 0.6 : -0.6; piv.rotation.y = n * 1.1; JM.rings.push({ piv: piv, rg: rg, k: [0.6, -0.85, 1.15][n] }); A.noAud(piv); });
    // holo sign above (shows the jumper status)
    JM.holo = cvs(512, 128); var hm = add(g, new T.PlaneGeometry(2.0, 0.5), new T.MeshBasicMaterial({ map: JM.holo.tex, transparent: true, opacity: 0.92, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }), 0, 5.0, 0); JM.holoM = hm; A.noAud(hm);
    // Ratita plaque on the dais front
    var pq = cvs(512, 128, function (c, w, h) { c.fillStyle = '#0b2b29'; rr(c, 4, 4, w - 8, h - 8, 20); c.fill(); c.strokeStyle = '#fbbf24'; c.lineWidth = 6; c.stroke(); neon(c, 'TIME JUMPER', w / 2, 52, 52, '#5eead4', w - 40); txt(c, 'Ratita Industries \u00b7 Model TJ-3 \u00b7 mostly safe', w / 2, 100, 22, '#fecdd3'); });
    var pm = planeM(1.6, 0.4, pq.tex, g, 0, 0.32, -2.72, Math.PI); pm.rotation.x = 0; void pm;
    // sparks (one InstancedMesh, used by malfunctions)
    var sg = new T.BoxGeometry(0.05, 0.05, 0.05), smat = new T.MeshBasicMaterial({ color: '#fde68a' }); JM.sp = new T.InstancedMesh(sg, smat, 48); JM.sp.frustumCulled = false; JM.sp.visible = false; g.add(JM.sp); A.noAud(JM.sp);
    JM.spd = []; for (i = 0; i < 48; i++) JM.spd.push({ p: new T.Vector3(), v: new T.Vector3(), life: 0 });
    reg('Time Jumper', g, 'booth'); solid(JX - 3.1, JX + 3.1, JZ - 3.1, JZ + 3.1, 'Time Jumper');
    // control console in front (south)
    var cz = JZ - 3.85, co = grp('Time Jumper console'); co.position.set(JX, 0, cz);
    add(co, bx(2.2, 0.9, 0.7), dark, 0, 0.45, 0); var desk2 = add(co, bx(2.3, 0.08, 0.86), steel, 0, 0.95, -0.05); desk2.rotation.x = -0.28;
    JM.scr = cvs(512, 256); var sc = add(desk2, new T.PlaneGeometry(1.2, 0.6), new T.MeshBasicMaterial({ map: JM.scr.tex, toneMapped: false }), 0, 0.045, 0.05); sc.rotation.set(-Math.PI / 2, 0, Math.PI);
    // buttons (instanced) + 2 levers + the big red JUMP button
    var bcols = ['#5eead4', '#fb7185', '#fbbf24', '#a78bfa', '#4ade80'], bim = new T.InstancedMesh(new T.CylinderGeometry(0.04, 0.04, 0.03, 12), new T.MeshBasicMaterial({ color: '#ffffff' }), 20), mm = new T.Matrix4(), q4 = new T.Quaternion().setFromEuler(new T.Euler(0.28, 0, 0)), cc = new T.Color();
    for (i = 0; i < 20; i++) { var bxp = -0.95 + (i % 10) * 0.07 + (i >= 10 ? 1.25 : 0) - (i >= 10 ? 0.7 : 0), bzp = (i % 10 < 5 ? 0.12 : -0.02); mm.compose(new T.Vector3((i < 10 ? -0.95 : 0.65) + (i % 5) * 0.08, 1.0 - bzp * 0.28, bzp - 0.05), q4, new T.Vector3(1, 1, 1)); bim.setMatrixAt(i, mm); bim.setColorAt(i, cc.set(bcols[i % 5])); void bxp; }
    bim.instanceMatrix.needsUpdate = true; bim.instanceColor.needsUpdate = true; bim.frustumCulled = false; co.add(bim); A.noAud(bim); JM.btns = bim;
    JM.levers = []; [-0.85, 0.85].forEach(function (lx) { var lv = new T.Group(); lv.position.set(lx, 1.02, 0.05); co.add(lv); add(lv, cy(0.02, 0.02, 0.3, 8), chrome(), 0, 0.15, 0); add(lv, sp(0.05, 12), coralM, 0, 0.3, 0); lv.rotation.x = -0.4; JM.levers.push(lv); });
    JM.big = add(co, cy(0.11, 0.12, 0.08, 24), new T.MeshPhongMaterial({ color: '#ef4444', emissive: '#7f1d1d', shininess: 120 }), 0, 1.06, 0.18); JM.big.rotation.x = 0.28;
    JM.panel = add(co, bx(0.5, 0.36, 0.03), ph('#64748b', 80), 0.75, 0.5, -0.36); // the loose side panel (malfunctions rattle it)
    reg('Time Jumper console', co, 'booth'); solid(JX - 1.15, JX + 1.15, cz - 0.4, cz + 0.45, 'Time Jumper console');
    inter({ id: 'pv_jumper', kind: 'pv_jumper', name: 'Time Jumper', desc: 'Ratita Industries\u2019 Time Jumper: plays work-in-progress builds once they really work.', col: '#5eead4', x: JX, z: cz - 1.15, dir: [0, -1], r: 1.2, gw: 2.0, gh: 1.3 });
    // velvet-rope queue lane in front of the console
    var postM = ph('#fbbf24', 120), ropeM = ph('#0f766e', 20);
    [[-1.6, -0.9], [1.6, -0.9], [-1.6, -2.4], [1.6, -2.4]].forEach(function (q, n) { var pg2 = grp('Queue post ' + n); pg2.position.set(JX + q[0], 0, cz + q[1]); add(pg2, cy(0.16, 0.18, 0.04, 16), postM, 0, 0.02, 0); add(pg2, cy(0.03, 0.03, 0.9, 10), postM, 0, 0.47, 0); add(pg2, sp(0.06, 12), postM, 0, 0.95, 0); reg('Queue post ' + n, pg2); solid(JX + q[0] - 0.17, JX + q[0] + 0.17, cz + q[1] - 0.17, cz + q[1] + 0.17, 'Queue post ' + n); });
    [-1.6, 1.6].forEach(function (sx) { var rp = new T.Mesh(new T.TubeGeometry(new T.QuadraticBezierCurve3(new T.Vector3(JX + sx, 0.88, cz - 0.9), new T.Vector3(JX + sx, 0.6, cz - 1.65), new T.Vector3(JX + sx, 0.88, cz - 2.4)), 10, 0.03, 6), ropeM); R.add(rp); A.noAud(rp); });
    drawHolo(); drawConsole();
  }
  function drawHolo(msg, col) { if (!JM.holo) return; JM.holo.redraw(function (c, w, h) { c.clearRect(0, 0, w, h); neon(c, msg || (PR.jumperInfo ? PR.jumperInfo().holo : 'TIME JUMPER'), w / 2, h / 2, 60, col || '#5eead4', w - 30); c.fillStyle = 'rgba(94,234,212,.15)'; for (var y = 0; y < h; y += 6) c.fillRect(0, y, w, 2); }); }
  function drawConsole(lines, col) { if (!JM.scr) return; var info = PR.jumperInfo ? PR.jumperInfo() : { lines: ['BOOTING\u2026'] }; lines = lines || info.lines; JM.scr.redraw(function (c, w, h) { c.fillStyle = '#021b1a'; c.fillRect(0, 0, w, h); c.strokeStyle = col || '#2dd4bf'; c.lineWidth = 6; c.strokeRect(8, 8, w - 16, h - 16); c.fillStyle = col || '#5eead4'; c.font = 'bold 30px monospace'; c.textAlign = 'left'; c.textBaseline = 'middle'; lines.slice(0, 5).forEach(function (l, i) { c.fillText(String(l).slice(0, 26), 28, 46 + i * 42); }); c.fillStyle = 'rgba(0,0,0,.25)'; for (var y = 0; y < h; y += 4) c.fillRect(0, y, w, 1); }); }
  PR.drawHolo = drawHolo; PR.drawConsole = drawConsole;
  PR.spark = function (n) { if (!JM.sp) return; JM.sp.visible = true; var k = 0; JM.spd.forEach(function (s) { if (s.life <= 0 && k < (n || 30)) { k++; s.life = 0.6 + Math.random() * 0.6; var a = Math.random() * 6.28; s.p.set(Math.cos(a) * 0.9, 1.0 + Math.random() * 2.2, Math.sin(a) * 0.9 - 0.4); s.v.set(Math.cos(a) * (1 + Math.random() * 2.5), 1.5 + Math.random() * 3, Math.sin(a) * (1 + Math.random() * 2.5)); } }); st.sparks = 1.3; };
  PR.jumpFx = function (secs) { st.spinBoost = secs || 1.6; st.flash = 0; };
  PR.glitchFx = function (secs) { st.glitch = secs || 1.5; };

  /* ---------- posters: upcoming DLC + builds (rebuilt from live data) ---------- */
  var SLOTS = [];
  (function () { var i; for (i = 0; i < 6; i++) SLOTS.push({ x: -16.2 + i * 2.6, z: 47.99, ry: Math.PI, fx: -16.2 + i * 2.6, fz: 46.85, dir: [0, -1] }); for (i = 0; i < 5; i++) SLOTS.push({ x: -17.99, z: 43.2 - i * 3.0, ry: Math.PI / 2, fx: -16.85, fz: 43.2 - i * 3.0, dir: [1, 0] }); })();
  PR.SLOTS = SLOTS;
  var PG = null, POSTERS = [], PY = 2.42; // poster centre height (bottom edge clears the wainscot)
  PR.posters = function () { return POSTERS; };
  var STC = { building: ['IN THE LAB NOW', '#fb7185', '#3b0a1a'], queued: ['UP NEXT', '#5eead4', '#062a28'], shipped: ['OUT NOW', '#4ade80', '#052e16'], empty: ['YOUR IDEA HERE', '#a78bfa', '#1e1240'] };
  PR.STC = STC;
  function posterBoard(it) { // 512 x 785 canvas == 1.5 x 2.3 m board
    var s = STC[it ? it.stage : 'empty'] || STC.queued;
    return cvs(512, 785, function (c, w, h) {
      var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, s[2]); gr.addColorStop(0.55, '#0b1020'); gr.addColorStop(1, s[2]); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.strokeStyle = s[1]; c.lineWidth = 10; c.strokeRect(10, 10, w - 20, h - 20); c.globalAlpha = 0.18; for (var i = 0; i < 14; i++) { c.fillStyle = s[1]; c.beginPath(); c.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 0, 7); c.fill(); } c.globalAlpha = 1;
      if (!it) { neon(c, 'YOUR IDEA', w / 2, 120, 64, s[1], w - 60); neon(c, 'HERE', w / 2, 196, 64, s[1], w - 60); c.globalAlpha = 0.5; mouse(c, w / 2, 400, 70, '#a78bfa'); c.globalAlpha = 1; wrapTxt(c, 'Invent a DLC at the DLC Machine in the Hall of Records, or suggest a build at the Suggestion Booth. It shows up on this wall!', w / 2, 560, 26, '#e9d5ff', w - 80, 34, 5); return; }
      fitTxt(c, (it.gname || 'Grok Arcade').toUpperCase(), w / 2, 60, 30, '#e2e8f0', w - 60);
      wrapTxt(c, it.name || 'Mystery build', w / 2, 112, 44, '#ffffff', w - 60, 48, 2);
      c.fillStyle = s[1]; rr(c, w / 2 - 150, 616, 300, 56, 28); c.fill(); fitTxt(c, s[0], w / 2, 645, 30, '#0b1020', 280);
      fitTxt(c, (it.issue ? '#' + it.issue + ' \u00b7 ' : '') + (it.size || (it.kind === 'dlc' ? 'DLC' : 'BUILD')) + (it.when ? ' \u00b7 ' + it.when : ''), w / 2, 704, 26, '#cbd5e1', w - 60);
      txt(c, 'RATITA PREVIEW CENTER', w / 2, 750, 18, 'rgba(226,232,240,.6)');
    });
  }
  function arcadeArt(w, h) { // a picture for "Grok Arcade" builds (no cover image): drawn at the frame's exact shape
    return cvs(w, h, function (c) { var gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2a0b4a'); gr.addColorStop(1, '#0b2b29'); c.fillStyle = gr; c.fillRect(0, 0, w, h); neon(c, 'GROK', w / 2, h * 0.36, h * 0.24, '#ff4fd8', w - 30); neon(c, 'ARCADE', w / 2, h * 0.66, h * 0.24, '#3ff0ff', w - 30); });
  }
  PR.buildPosters = function (model) {
    if (!R) return; if (PG) { PG.parent.remove(PG); PG.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map && !o.material.map.__shared && o.material.map.isCanvasTexture) o.material.map.dispose(); }); }
    PG = grp('Poster wall'); PG.userData.noBatch = true; A.noAud(PG); POSTERS = [];
    Object.keys(CABS).forEach(function (k) { if (/^pv_poster/.test(k)) { var c = CABS[k], i = A.cabinets.indexOf(c); if (i >= 0) A.cabinets.splice(i, 1); delete CABS[k]; } });
    var list = (model && model.posters) || [];
    SLOTS.forEach(function (s, i) {
      var it = list[i] || null, g = new T.Group(); g.position.set(s.x, 0, s.z); g.rotation.y = s.ry; PG.add(g);
      var bd = posterBoard(it); planeM(1.5, 2.3, bd.tex, g, 0, PY, 0.045);
      add(g, bx(1.62, 2.42, 0.04), ph(it ? '#fbbf24' : '#6d28d9', 90), 0, PY, 0.02);
      // a little brass picture lamp over each poster
      add(g, bx(0.5, 0.05, 0.06), ph('#fbbf24', 120), 0, PY + 1.33, 0.2); add(g, cy(0.015, 0.015, 0.22, 6), ph('#fbbf24', 120), 0, PY + 1.25, 0.1).rotation.x = Math.PI / 2;
      if (it) {
        var url = PV().cover(it.game);
        if (url && GA.Pics) { var a = GA.Pics.aspect(url), fr = GA.Pics.frame(g, url, { x: 0, y: PY - 0.01, z: 0.07, maxW: 1.26, maxH: a < 1 ? 1.0 : 0.82, border: 0.035 }); it._frame = fr; }
        else { var art = arcadeArt(512, 300), fa = GA.Pics ? GA.Pics.frame : null; void fa; add(g, bx(1.3, 0.8, 0.04), ph('#fbbf24', 90), 0, PY - 0.01, 0.07); planeM(1.24, 0.7266, art.tex, g, 0, PY - 0.01, 0.095); }
      }
      POSTERS.push({ slot: i, it: it, g: g });
      inter({ id: 'pv_poster' + i, kind: 'pv_poster', name: it ? (it.gname + ': ' + it.name) : 'Empty poster spot', col: it ? (STC[it.stage] || STC.queued)[1] : '#a78bfa', x: s.fx, z: s.fz, dir: s.dir, r: 0.85, gw: 1.2, gh: 1.0, par: PG, data: { slot: i } });
    });
    PG.updateMatrixWorld(true); return POSTERS.length;
  };
  function PV() { return GA.PVD; }

  /* ---------- SCHEDULED ADDITIONS board (east wall) ---------- */
  var BD = {};
  function board() {
    var g = grp('Scheduled Additions board'); g.position.set(P.maxX - 0.02, 0, 37.8); g.rotation.y = -Math.PI / 2;
    add(g, bx(6.3, 3.3, 0.12), ph('#0f172a', 60), 0, 2.75, -0.04); add(g, bx(6.5, 0.12, 0.2), ph('#fbbf24', 110), 0, 4.45, 0); add(g, bx(6.5, 0.12, 0.2), ph('#fbbf24', 110), 0, 1.05, 0);
    BD.c = cvs(1024, 512); planeM(6.0, 3.0, BD.c.tex, g, 0, 2.75, 0.03);
    // split-flap clock blocks on top
    for (var i = 0; i < 6; i++) add(g, bx(0.36, 0.42, 0.12), ph(i % 2 ? '#1e293b' : '#334155', 40), -0.9 + i * 0.36, 4.75, 0.02);
    BD.clock = cvs(512, 96); planeM(2.16, 0.405, BD.clock.tex, g, 0, 4.75, 0.09);
    reg('Scheduled Additions board', g, 'sign'); drawBoard(null);
    inter({ id: 'pv_board', kind: 'pv_board', name: 'Scheduled Additions', desc: 'What\u2019s being built now, what\u2019s next, and what just shipped.', col: '#fbbf24', x: P.maxX - 1.35, z: 37.8, dir: [-1, 0], r: 1.4, gw: 1.4, gh: 3.0 });
    // a bench facing the board (sit and watch the flaps)
    var bn = grp('Board bench'); bn.position.set(P.maxX - 3.4, 0, 37.8); add(bn, bx(0.5, 0.08, 2.2), ph('#14b8a6', 60), 0, 0.46, 0); [-0.9, 0.9].forEach(function (z2) { add(bn, bx(0.44, 0.44, 0.08), ph('#334155', 60), 0, 0.22, z2); }); add(bn, bx(0.08, 0.5, 2.2), ph('#14b8a6', 60), -0.22, 0.78, 0);
    reg('Board bench', bn); solid(P.maxX - 3.68, P.maxX - 3.12, 36.65, 38.95, 'Board bench');
  }
  function drawBoard(model) {
    if (!BD.c) return; model = model || (PV() && PV().model()); var col = [['BUILDING NOW', '#fb7185', model ? model.building : []], ['UP NEXT', '#5eead4', model ? model.queued : []], ['JUST SHIPPED', '#4ade80', model ? model.shipped : []]];
    BD.c.redraw(function (c, w, h) { c.fillStyle = '#060b18'; c.fillRect(0, 0, w, h); neon(c, 'SCHEDULED ADDITIONS', w / 2, 40, 44, '#fbbf24', w - 40);
      col.forEach(function (q, k) { var x = 14 + k * (w - 28) / 3, cw = (w - 28) / 3 - 10; c.fillStyle = 'rgba(255,255,255,.05)'; rr(c, x, 78, cw, h - 120, 14); c.fill(); fitTxt(c, q[0], x + cw / 2, 102, 28, q[1], cw - 20);
        var L = q[2] || []; if (!L.length) { txt(c, k === 0 ? 'nothing on the bench' : k === 1 ? 'the queue is empty' : 'nothing yet', x + cw / 2, 160, 20, 'rgba(226,232,240,.5)'); }
        L.slice(0, 6).forEach(function (it, n) { var y = 140 + n * 50; c.fillStyle = 'rgba(0,0,0,.45)'; rr(c, x + 8, y, cw - 16, 44, 8); c.fill(); fitTxt(c, PV().boardName(it), x + 16, y + 15, 21, '#ffffff', cw - 32, 'left'); fitTxt(c, (it.gname || '') + (it.when ? ' \u00b7 ' + it.when : ''), x + 16, y + 34, 15, '#94a3b8', cw - 32, 'left'); });
        if (L.length > 6) txt(c, '+' + (L.length - 6) + ' more (walk up!)', x + cw / 2, h - 52, 18, q[1]); });
      var src = !model ? 'loading' : model.live ? 'LIVE from the Suggestion Booth + DLC Machine' : 'saved schedule (offline)'; txt(c, src + (model && model.updated ? ' \u00b7 preview.json ' + model.updated : ''), w / 2, h - 20, 17, 'rgba(226,232,240,.55)'); });
  }
  PR.drawBoard = drawBoard;
  function drawClock() { if (!BD.clock) return; var d = new Date(), s = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); BD.clock.redraw(function (c, w, h) { c.fillStyle = '#0b1020'; c.fillRect(0, 0, w, h); c.font = 'bold 64px monospace'; c.fillStyle = '#fde68a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s + ' PT', w / 2, h / 2 + 2); c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, h / 2, w, 2); }); BD.min = d.getMinutes(); }

  /* ---------- props: server racks, lab bench, crates, logo, planters, bonus #32 cabinet ---------- */
  function racks() {
    var g = grp('Server racks'), leds = [], x0 = -17.2;
    for (var i = 0; i < 5; i++) { var x = x0 + i * 1.22; add(g, bx(1.1, 2.6, 0.9), ph('#111827', 70), x, 1.3, P.minZ + 0.5); add(g, bx(1.0, 2.4, 0.02), ph('#1f2937', 40), x, 1.3, P.minZ + 0.96);
      for (var r2 = 0; r2 < 10; r2++) { add(g, bx(0.9, 0.03, 0.02), ph('#374151', 40), x, 0.3 + r2 * 0.22, P.minZ + 0.975); for (var k = 0; k < 6; k++) leds.push([x - 0.38 + k * 0.1, 0.36 + r2 * 0.22, P.minZ + 0.985]); }
      add(g, bx(1.1, 0.12, 0.9), ph('#2dd4bf', 80, '#064e47'), x, 2.66, P.minZ + 0.5); }
    var im = new T.InstancedMesh(new T.BoxGeometry(0.04, 0.03, 0.01), new T.MeshBasicMaterial({ color: '#ffffff' }), leds.length), m4 = new T.Matrix4(), cc = new T.Color(); leds.forEach(function (q, i) { m4.makeTranslation(q[0], q[1], q[2]); im.setMatrixAt(i, m4); im.setColorAt(i, cc.set(['#4ade80', '#5eead4', '#fbbf24', '#fb7185'][i % 4])); });
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.frustumCulled = false; g.add(im); A.noAud(im); st.leds = { im: im, n: leds.length, t: 0 };
    // cable tray over the racks
    add(g, bx(6.2, 0.08, 0.5), ph('#475569', 50), x0 + 2.44, 3.1, P.minZ + 0.5); for (i = 0; i < 6; i++) add(g, cy(0.04, 0.04, 0.5, 8), ph(['#fb7185', '#5eead4', '#fbbf24'][i % 3], 30), x0 + i * 1.0, 3.18, P.minZ + 0.5).rotation.x = Math.PI / 2;
    reg('Server racks', g); solid(x0 - 0.56, x0 + 4 * 1.22 + 0.56, P.minZ, P.minZ + 0.96, 'Server racks');
  }
  function bench() {
    var g = grp('Prototype lab bench'), x = -9.0, z = P.minZ + 0.6; g.position.set(x, 0, z);
    add(g, bx(3.2, 0.08, 1.0), ph('#e2e8f0', 80), 0, 0.95, 0); [-1.5, 1.5].forEach(function (sx) { [-0.4, 0.4].forEach(function (sz) { add(g, bx(0.08, 0.92, 0.08), chrome(), sx, 0.46, sz); }); }); add(g, bx(3.1, 0.05, 0.9), ph('#334155', 40), 0, 0.3, 0);
    // prototypes under glass domes: a hover-skate, a tiny portal, a robot arm, a cheese-powered battery
    [-1.1, -0.35, 0.4, 1.15].forEach(function (px, i) { add(g, cy(0.22, 0.24, 0.05, 20), ph('#1e293b', 60), px, 1.015, 0); var d = add(g, new T.SphereGeometry(0.22, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshPhongMaterial({ color: '#e0fffb', transparent: true, opacity: 0.22, shininess: 150, depthWrite: false }), px, 1.04, 0); void d;
      if (i === 0) { add(g, bx(0.26, 0.02, 0.08), ph('#fb7185', 80), px, 1.1, 0); add(g, to(0.03, 0.01, 10), gl('#5eead4'), px - 0.09, 1.08, 0); add(g, to(0.03, 0.01, 10), gl('#5eead4'), px + 0.09, 1.08, 0); }
      else if (i === 1) { var pt = add(g, to(0.09, 0.02, 20), gl('#a78bfa'), px, 1.16, 0); ANIM.push(function (t) { pt.rotation.y = t * 3; }); }
      else if (i === 2) { add(g, cy(0.02, 0.02, 0.16, 8), chrome(), px, 1.12, 0); var arm = add(g, bx(0.14, 0.02, 0.02), coralM(), px + 0.05, 1.2, 0); ANIM.push(function (t) { arm.rotation.z = Math.sin(t * 2) * 0.5; }); }
      else { add(g, new T.CylinderGeometry(0.08, 0.08, 0.06, 3), ph('#fcd34d', 30), px, 1.08, 0); add(g, bx(0.03, 0.08, 0.03), gl('#4ade80'), px, 1.15, 0); } });
    var tag = cvs(512, 64, function (c, w, h) { c.fillStyle = '#fef3c7'; c.fillRect(0, 0, w, h); txt(c, 'PROTOTYPES \u00b7 DO NOT TOUCH \u00b7 (Lili means it)', w / 2, h / 2, 26, '#7c2d12'); }); planeM(2.4, 0.3, tag.tex, g, 0, 0.62, 0.505);
    reg('Prototype lab bench', g); solid(x - 1.6, x + 1.6, z - 0.5, z + 0.5, 'Prototype lab bench');
  }
  function coralM() { return ph('#fb7185', 80); }
  function crates() {
    var g = grp('Crates from the future'), x = -17.0, z = 45.9;
    var lab = cvs(256, 256, function (c, w, h) { c.fillStyle = '#c08a4b'; c.fillRect(0, 0, w, h); c.strokeStyle = '#7c4a1e'; c.lineWidth = 12; c.strokeRect(6, 6, w - 12, h - 12); c.beginPath(); c.moveTo(6, 6); c.lineTo(w - 6, h - 6); c.stroke(); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(30, 90, w - 60, 76); txt(c, 'FRAGILE:', w / 2, 112, 28, '#b91c1c'); txt(c, 'THE FUTURE', w / 2, 146, 28, '#b91c1c'); });
    var cm = new T.MeshLambertMaterial({ map: lab.tex });
    [[0, 0.45, 0, 0.9, 0], [0.05, 1.25, 0.05, 0.7, 0.3], [0, 0.35, -0.95, 0.7, -0.2]].forEach(function (q) { var b = add(g, bx(q[3], q[3], q[3]), cm, x + q[0], q[1], z + q[2]); b.rotation.y = q[4]; });
    reg('Crates from the future', g); solid(x - 0.55, x + 0.55, z - 1.4, z + 0.55, 'Crates from the future');
  }
  function logoWall() {
    var g = grp('Ratita Industries logo'), s = cvs(1024, 320, function (c, w, h) { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(6,30,30,.85)'; rr(c, 6, 6, w - 12, h - 12, 40); c.fill(); c.strokeStyle = '#2dd4bf'; c.lineWidth = 8; c.stroke(); mouse(c, 140, 170, 70, '#9ca3af'); mouse(c, 884, 170, 70, '#ffffff'); neon(c, 'RATITA INDUSTRIES', w / 2, 120, 84, '#5eead4', 560); txt(c, 'R&D \u00b7 PREVIEW DIVISION \u00b7 \u201Cit works on our machine\u201D', w / 2, 222, 30, '#fecdd3'); });
    var m = planeM(4.8, 1.5, s.tex, g, JX, 4.6, P.maxZ - 0.04, Math.PI); A.regItem('sign:Ratita logo', 'sign', m);
  }
  function planters() { [[-0.6, 46.9], [-11.18, 27.3]].forEach(function (q, i) { var g = grp('Cheese planter ' + i); g.position.set(q[0], 0, q[1]); add(g, new T.CylinderGeometry(0.42, 0.42, 0.6, 3), ph('#fcd34d', 30), 0, 0.3, 0); add(g, cy(0.34, 0.34, 0.04, 3), ph('#3f2a1d', 10), 0, 0.6, 0);
    for (var k = 0; k < 7; k++) { var lf = add(g, sp(0.16, 10), ph(k % 2 ? '#22c55e' : '#16a34a', 20), Math.cos(k) * 0.16, 0.85 + (k % 3) * 0.14, Math.sin(k) * 0.16); lf.scale.set(1, 1.6, 0.6); lf.rotation.z = Math.cos(k) * 0.5; }
    reg('Cheese planter ' + i, g); solid(q[0] - 0.42, q[0] + 0.42, q[1] - 0.42, q[1] + 0.42, 'Cheese planter ' + i); }); }
  function cabinet32() {
    var x = P.maxX - 0.55, z = 44.6, g = grp('Chrono Courier cabinet'); g.position.set(x, 0, z); g.rotation.y = -Math.PI / 2;
    var body = ph('#0f766e', 60), side = ph('#fb7185', 70);
    add(g, bx(1.1, 1.0, 0.8), body, 0, 0.5, 0); add(g, bx(1.1, 1.1, 0.5), body, 0, 1.55, -0.15); add(g, bx(1.1, 0.5, 0.75), body, 0, 2.35, -0.02);
    [-0.56, 0.56].forEach(function (sx) { add(g, bx(0.04, 2.6, 0.85), side, sx, 1.3, 0); });
    var scr = cvs(320, 256, function (c, w, h) { var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a0b4a'); gr.addColorStop(1, '#062a28'); c.fillStyle = gr; c.fillRect(0, 0, w, h); ['#fbbf24', '#5eead4', '#fb7185'].forEach(function (col, i) { c.fillStyle = col; c.globalAlpha = 0.25; c.fillRect(0, 60 + i * 60, w, 52); c.globalAlpha = 1; }); c.fillStyle = '#d6a26b'; c.fillRect(60, 132, 34, 22); mouse(c, 77, 124, 12, '#d6a26b'); c.fillStyle = '#5eead4'; c.fillRect(200, 140, 30, 24); c.fillStyle = '#fbbf24'; c.fillRect(150, 80, 30, 24); neon(c, 'CHRONO COURIER', w / 2, 30, 30, '#fde68a', w - 20); txt(c, 'BONUS #32', w / 2, 236, 20, '#5eead4'); });
    var sm = planeM(0.9, 0.72, scr.tex, g, 0, 1.6, 0.11); sm.rotation.x = -0.12;
    var mq = cvs(512, 128, function (c, w, h) { c.fillStyle = '#06201e'; c.fillRect(0, 0, w, h); neon(c, 'CHRONO COURIER', w / 2, h / 2, 64, '#5eead4', w - 30); }); planeM(1.0, 0.25, mq.tex, g, 0, 2.4, 0.37);
    add(g, bx(1.0, 0.1, 0.5), ph('#1e293b', 40), 0, 1.0, 0.25).rotation.x = 0.2; add(g, sp(0.05, 10), gl('#ef4444'), -0.2, 1.08, 0.3); add(g, sp(0.05, 10), gl('#4ade80'), 0.2, 1.08, 0.3);
    reg('Chrono Courier cabinet', g, 'cabinet'); solid(x - 0.43, x + 0.45, z - 0.6, z + 0.6, 'Chrono Courier cabinet');
    inter({ id: 'pv_chrono', kind: 'pv_chrono', name: 'Chrono Courier', desc: 'Bonus #32 by Ratita Industries.', col: '#5eead4', x: x - 1.15, z: z, dir: [-1, 0], r: 1.0, data: { game: 'chrono' } });
  }

  /* ---------- the GL1TCH R00M (far away: x 120..132, z 100..112) ---------- */
  function glitchRoom() {
    var B = GLR, W = B.maxX - B.minX, D = B.maxZ - B.minZ, cx = (B.minX + B.maxX) / 2, cz = (B.minZ + B.maxZ) / 2, H = B.H;
    GR = new T.Group(); GR.name = 'area:glitch'; A.scene.add(GR); A.addRegion ? A.addRegion(B) : GA.Hub.addRegion(B);
    var chk = A.mkCanvas(64, 64), cg = chk.getContext('2d'); cg.fillStyle = '#ff00ff'; cg.fillRect(0, 0, 64, 64); cg.fillStyle = '#000'; cg.fillRect(0, 0, 32, 32); cg.fillRect(32, 32, 32, 32); var ct = A.canvasTex(chk); ct.wrapS = ct.wrapT = T.RepeatWrapping; ct.magFilter = T.NearestFilter; ct.repeat.set(W / 1.5, D / 1.5);
    var fl = add(GR, new T.PlaneGeometry(W, D), new T.MeshBasicMaterial({ map: ct }), cx, 0, cz); fl.rotation.x = -Math.PI / 2; A.noAud(fl);
    var wt = ct.clone(); wt.needsUpdate = true; wt.repeat.set(W / 1.5, H / 1.5); var wm = new T.MeshBasicMaterial({ map: wt, side: T.DoubleSide });
    [[W, cx, B.minZ, 0], [W, cx, B.maxZ, Math.PI], [D, B.minX, cz, Math.PI / 2], [D, B.maxX, cz, -Math.PI / 2]].forEach(function (q) { var m = add(GR, new T.PlaneGeometry(q[0], H), wm, q[1], H / 2, q[2]); m.rotation.y = q[3]; A.noAud(m); });
    var ce = add(GR, new T.PlaneGeometry(W, D), new T.MeshBasicMaterial({ color: '#120022' }), cx, H, cz); ce.rotation.x = Math.PI / 2; A.noAud(ce);
    [[B.minX - 1, B.maxX + 1, B.minZ - 1, B.minZ], [B.minX - 1, B.maxX + 1, B.maxZ, B.maxZ + 1], [B.minX - 1, B.minX, B.minZ - 1, B.maxZ + 1], [B.maxX, B.maxX + 1, B.minZ - 1, B.maxZ + 1]].forEach(function (q) { A.addWall(q[0], q[1], -1, 99, q[2], q[3]); });
    // floating junk (upside-down chair, a sideways cabinet, cheese, cubes) + a giant Lili face + the exit portal
    JM.float = [];
    var junk = grp('Glitch junk', GR); A.noAud(junk);
    for (var i = 0; i < 14; i++) { var k = i % 4, m = add(junk, k === 0 ? bx(0.5, 0.5, 0.5) : k === 1 ? new T.CylinderGeometry(0.3, 0.3, 0.2, 3) : k === 2 ? new T.IcosahedronGeometry(0.3, 0) : bx(0.3, 0.8, 0.3), new T.MeshBasicMaterial({ color: ['#ff00ff', '#fcd34d', '#5eead4', '#22d3ee'][k], wireframe: i % 3 === 0 }), cx - 4.5 + (i * 2.3) % 9, 1.4 + (i % 5) * 0.6, cz - 3.5 + (i * 1.7) % 7.5); JM.float.push({ m: m, s: 0.5 + (i % 4) * 0.3, y: m.position.y }); }
    var chair = new T.Group(); chair.position.set(cx + 3.2, 2.6, cz + 1.5); chair.rotation.z = Math.PI; junk.add(chair); add(chair, bx(0.5, 0.06, 0.5), ph('#14b8a6', 40), 0, 0.45, 0); add(chair, bx(0.5, 0.5, 0.06), ph('#14b8a6', 40), 0, 0.72, -0.22); [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(function (q) { add(chair, bx(0.05, 0.45, 0.05), chrome(), q[0], 0.22, q[1]); }); JM.float.push({ m: chair, s: 0.3, y: 2.6 });
    var face = cvs(512, 256, function (c, w, h) { c.fillStyle = '#04201e'; c.fillRect(0, 0, w, h); c.fillStyle = '#fb7185'; c.font = 'bold 150px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('x_x', w / 2, h / 2 - 10); c.fillStyle = 'rgba(94,234,212,.4)'; for (var y = 0; y < h; y += 8) c.fillRect(0, y, w, 3); });
    var fm = add(GR, new T.PlaneGeometry(4.0, 2.0), new T.MeshBasicMaterial({ map: face.tex }), cx, 3.0, B.maxZ - 0.05); fm.rotation.y = Math.PI; A.noAud(fm); JM.gface = fm;
    var sg = cvs(1024, 160, function (c, w, h) { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); neon(c, 'ERR0R 404: PREVIEW NOT F0UND', w / 2, 60, 64, '#ff00ff', w - 40); txt(c, 'walk into the glowing portal (or tap JUMP BACK) to go back', w / 2, 124, 30, '#5eead4'); });
    var sm = add(GR, new T.PlaneGeometry(5.6, 0.875), new T.MeshBasicMaterial({ map: sg.tex }), cx, 1.45, B.maxZ - 0.06); sm.rotation.y = Math.PI; A.noAud(sm);
    var pt = new T.Group(); pt.position.set(cx, 0, B.maxZ - 1.6); GR.add(pt); JM.portal = pt; A.noAud(pt);
    add(pt, to(1.0, 0.1, 40), gl('#5eead4'), 0, 1.3, 0); JM.pDisk = add(pt, new T.CircleGeometry(0.95, 40), new T.MeshBasicMaterial({ color: '#99f6e4', transparent: true, opacity: 0.55, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false }), 0, 1.3, 0);
    inter({ id: 'pv_gexit', kind: 'pv_gexit', name: 'Exit portal', desc: 'Back to the Preview Center.', col: '#5eead4', x: cx, z: B.maxZ - 2.6, dir: [0, -1], r: 1.4, gw: 2.0, gh: 1.6, par: GR, area: 'glitch' });
    // a golden glitch-cheese to grab (counts for the Glitch Tourist achievement)
    JM.gcheese = add(GR, new T.CylinderGeometry(0.22, 0.22, 0.16, 3), new T.MeshBasicMaterial({ color: '#fde047' }), cx - 3.5, 1.0, cz + 2.0); A.noAud(JM.gcheese);
    inter({ id: 'pv_gcheese', kind: 'pv_gcheese', name: 'Glitch cheese', desc: 'A cheese wedge that exists in 3 timelines at once.', col: '#fde047', x: cx - 3.5, z: cz + 3.0, dir: [0, -1], r: 0.9, par: GR, area: 'glitch' });
    GR.visible = false;
  }

  /* ---------- dense lab clutter: waiting lounge, WIP cabinet row, gadget tables, holo-table, kiosk, parts shelves, holo ship,
     crates (one InstancedMesh), floor cable runs, hanging banners. Animated bits sit in noBatch groups; the rest gets merged. ---------- */
  function plate(par, text, x, y, z, ry, w) { var c = cvs(256, 64, function (g, W, H) { g.fillStyle = '#0b2b29'; rr(g, 2, 2, W - 4, H - 4, 10); g.fill(); g.strokeStyle = '#fbbf24'; g.lineWidth = 3; g.stroke(); fitTxt(g, text, W / 2, H / 2 + 1, 26, '#ccfbf1', W - 20); }); return planeM(w || 0.5, (w || 0.5) / 4, c.tex, par, x, y, z, ry); }
  function plant(name, x, z, big) { var g = grp(name); g.position.set(x, 0, z); var r = big ? 0.36 : 0.28; add(g, cy(r, r * 0.8, big ? 0.55 : 0.42, 18), ph('#fb7185', 50), 0, (big ? 0.55 : 0.42) / 2, 0); add(g, cy(r * 0.9, r * 0.9, 0.03, 18), ph('#3f2a1d', 10), 0, big ? 0.56 : 0.43, 0);
    for (var k = 0; k < (big ? 9 : 6); k++) { var a = k * 2.4, lf = add(g, sp(big ? 0.17 : 0.13, 10), ph(k % 2 ? '#22c55e' : '#15803d', 20), Math.cos(a) * r * 0.5, (big ? 0.8 : 0.62) + (k % 3) * 0.16, Math.sin(a) * r * 0.5); lf.scale.set(0.7, 1.9, 0.5); lf.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5); }
    reg(name, g); solid(x - r, x + r, z - r, z + r, name); }
  function lounge() {
    var x = -14.4, z = 30.05, g = grp('Waiting lounge couch'); g.position.set(x, 0, z); var cor = ph('#f43f5e', 30), cush = ph('#fda4af', 20);
    add(g, bx(2.5, 0.4, 0.9), cor, 0, 0.24, 0); [-0.78, 0, 0.78].forEach(function (cx) { add(g, bx(0.74, 0.16, 0.74), cush, cx, 0.52, 0.06); add(g, bx(0.74, 0.5, 0.18), cush, cx, 0.82, -0.3); });
    add(g, bx(2.5, 0.75, 0.2), cor, 0, 0.6, -0.38); [-1.17, 1.17].forEach(function (ax) { add(g, bx(0.18, 0.62, 0.9), cor, ax, 0.38, 0); }); [-1.1, 1.1].forEach(function (ax) { [-0.35, 0.35].forEach(function (az) { add(g, cy(0.04, 0.03, 0.06, 8), chrome(), ax, 0.03, az); }); });
    add(g, bx(0.36, 0.3, 0.12), ph('#5eead4', 20), -0.75, 0.73, -0.14).rotation.z = 0.2; add(g, bx(0.36, 0.3, 0.12), ph('#fde68a', 20), 0.8, 0.73, -0.14).rotation.z = -0.15;
    reg('Waiting lounge couch', g); solid(x - 1.27, x + 1.27, z - 0.48, z + 0.46, 'Waiting lounge couch');
    var rug = add(R, new T.PlaneGeometry(3.6, 2.6), new T.MeshLambertMaterial({ map: cvs(256, 186, function (c, W, H) { c.fillStyle = '#1e1b4b'; c.fillRect(0, 0, W, H); c.strokeStyle = '#5eead4'; c.lineWidth = 6; c.strokeRect(10, 10, W - 20, H - 20); c.strokeStyle = '#fb7185'; c.lineWidth = 3; c.strokeRect(22, 22, W - 44, H - 44); PR.mouse(c, W / 2, H / 2 + 6, 26, 'rgba(94,234,212,.5)'); }).tex }), x, 0.02, z + 1.25); rug.rotation.x = -Math.PI / 2; A.noAud(rug);
    // coffee table with a little holo projector + magazines
    var t = grp('Lounge coffee table'); t.position.set(x, 0, z + 1.5); add(t, bx(1.2, 0.05, 0.62), new T.MeshPhongMaterial({ color: '#a5f3fc', transparent: true, opacity: 0.55, shininess: 150 }), 0, 0.42, 0); [-0.5, 0.5].forEach(function (lx) { add(t, bx(0.06, 0.4, 0.55), chrome(), lx, 0.2, 0); });
    ['#fb7185', '#5eead4', '#fbbf24'].forEach(function (c2, i) { var mg = add(t, bx(0.24, 0.015, 0.32), ph(c2, 20), -0.32 + i * 0.03, 0.455 + i * 0.016, -0.04); mg.rotation.y = i * 0.3; });
    add(t, cy(0.09, 0.11, 0.06, 16), ph('#1e293b', 60), 0.3, 0.475, 0); reg('Lounge coffee table', t); solid(x - 0.6, x + 0.6, z + 1.19, z + 1.81, 'Lounge coffee table');
    var hp = grp('Lounge holo', R); hp.userData.noBatch = true; A.noAud(hp); hp.position.set(x + 0.3, 0.52, z + 1.5);
    var hm = new T.MeshBasicMaterial({ color: '#5eead4', transparent: true, opacity: 0.55, wireframe: true, depthWrite: false, blending: T.AdditiveBlending }); var r1 = add(hp, to(0.14, 0.01, 20), hm, 0, 0.22, 0), r2 = add(hp, to(0.11, 0.01, 20), hm, 0, 0.22, 0), cone = add(hp, new T.ConeGeometry(0.16, 0.3, 16, 1, true), new T.MeshBasicMaterial({ color: '#5eead4', transparent: true, opacity: 0.12, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }), 0, 0.15, 0); cone.rotation.x = Math.PI;
    ANIM.push(function (t2) { r1.rotation.x = t2 * 1.3; r2.rotation.y = t2 * 1.9; });
    var bb = grp('Bean bag'); bb.position.set(-12.55, 0, 31.7); var b1 = add(bb, sp(0.45, 20), ph('#14b8a6', 20), 0, 0.3, 0); b1.scale.set(1, 0.62, 1); add(bb, sp(0.3, 16), ph('#14b8a6', 20), 0, 0.5, -0.2).scale.set(1, 0.7, 0.8); reg('Bean bag', bb); solid(-13.0, -12.1, 31.25, 32.15, 'Bean bag');
    plant('Lounge plant W', -16.3, 29.3, true); plant('Lounge plant E', -12.3, 29.5, false);
    // floor lamp
    var fl = grp('Lounge floor lamp'); fl.position.set(-16.1, 0, 32.75); add(fl, cy(0.18, 0.2, 0.04, 16), ph('#334155', 60), 0, 0.02, 0); add(fl, cy(0.02, 0.02, 1.6, 8), chrome(), 0, 0.82, 0); add(fl, cy(0.12, 0.22, 0.26, 16, 1, true), new T.MeshBasicMaterial({ color: '#fde68a', side: T.DoubleSide }), 0, 1.66, 0); reg('Lounge floor lamp', fl); solid(-16.3, -15.9, 32.55, 32.95, 'Lounge floor lamp');
    var sg = cvs(512, 96, function (c, W, H) { c.clearRect(0, 0, W, H); neon(c, 'WAITING AREA \u00b7 please wait patiently \u00b7 \u2013Lili', W / 2, H / 2, 40, '#fda4af', W - 20); }); var sm = add(R, new T.PlaneGeometry(2.4, 0.45), new T.MeshBasicMaterial({ map: sg.tex, transparent: true, depthWrite: false }), x, 3.35, P.minZ + 1.25); A.noAud(sm); void sm;
  }
  function wipRow() {
    var labels = [['COMING SOON', '#fb7185'], ['TOP SECRET', '#a78bfa'], ['NOT YET!', '#fbbf24']];
    labels.forEach(function (q, i) { var x = -6.75 + i * 1.12, z = P.minZ + 0.55, g = grp('WIP cabinet ' + (i + 1)); g.position.set(x, 0, z);
      add(g, bx(0.9, 1.9, 0.7), ph('#1f2937', 40), 0, 0.95, 0); add(g, bx(0.94, 0.4, 0.74), ph(q[1], 60), 0, 2.1, 0);
      var tarp = add(g, bx(0.98, 1.5, 0.78), new T.MeshPhongMaterial({ color: '#64748b', shininess: 5 }), 0, 1.15, 0.02); 
      var tape = cvs(512, 64, function (c, W, H) { for (var k = 0; k < 16; k++) { c.fillStyle = k % 2 ? '#111827' : '#facc15'; c.beginPath(); c.moveTo(k * 32, 0); c.lineTo(k * 32 + 32, 0); c.lineTo(k * 32 + 16, H); c.lineTo(k * 32 - 16, H); c.fill(); } c.fillStyle = '#facc15'; c.fillRect(150, 10, 212, 44); txt(c, 'WIP \u00b7 KEEP OUT', W / 2, H / 2, 26, '#111827'); });
      var tp = planeM(0.86, 0.12, tape.tex, g, 0, 1.25, 0.415); tp.rotation.z = 0.25 * (i % 2 ? 1 : -1);
      var mq = cvs(256, 96, function (c, W, H) { c.fillStyle = '#0b1020'; c.fillRect(0, 0, W, H); neon(c, q[0], W / 2, H / 2, 40, q[1], W - 16); }); planeM(0.9, 0.3375, mq.tex, g, 0, 2.1, 0.375);
      reg('WIP cabinet ' + (i + 1), g, 'cabinet'); });
    solid(-7.24, -4.02, P.minZ, P.minZ + 0.95, 'WIP cabinet row');
    // two floating holo screens with build progress above the row
    var hg = grp('WIP holo screens', R); hg.userData.noBatch = true; A.noAud(hg); st.wipHolo = [];
    [['BUILD 0.3', 62], ['BUILD 0.1', 18]].forEach(function (q, i) { var c = cvs(256, 128, function (g, W, H) { g.fillStyle = 'rgba(4,32,30,.6)'; g.fillRect(0, 0, W, H); g.strokeStyle = '#5eead4'; g.lineWidth = 4; g.strokeRect(4, 4, W - 8, H - 8); txt(g, q[0], W / 2, 34, 28, '#ccfbf1'); g.fillStyle = '#134e4a'; g.fillRect(24, 70, W - 48, 22); g.fillStyle = '#5eead4'; g.fillRect(24, 70, (W - 48) * q[1] / 100, 22); txt(g, q[1] + '%', W / 2, 110, 20, '#fde68a'); });
      var m = add(hg, new T.PlaneGeometry(0.9, 0.45), new T.MeshBasicMaterial({ map: c.tex, transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending }), -6.2 + i * 1.12, 2.95, P.minZ + 0.75); st.wipHolo.push(m); });
  }
  var GADGETS = ['HOVER-DRONE', 'POCKET PORTAL', 'ROBO-HEAD', 'CHEESE RAY', 'MINI KART', 'JET-SNEAKERS'];
  function gadgetTable(name, x, z, kind) {
    var g = grp(name); g.position.set(x, 0, z); add(g, cy(0.22, 0.32, 0.08, 20), ph('#1e293b', 60), 0, 0.04, 0); add(g, cy(0.07, 0.07, 0.85, 12), chrome(), 0, 0.5, 0); add(g, cy(0.5, 0.5, 0.06, 28), ph('#e2e8f0', 90), 0, 0.95, 0); add(g, to(0.5, 0.02, 32), gl('#5eead4'), 0, 0.95, 0).rotation.x = Math.PI / 2;
    add(g, new T.SphereGeometry(0.34, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshPhongMaterial({ color: '#e0fffb', transparent: true, opacity: 0.18, shininess: 150, depthWrite: false }), 0, 0.98, 0);
    plate(g, 'PROTOTYPE: ' + GADGETS[kind], 0, 0.85, 0.505, 0, 0.6); plate(g, 'PROTOTYPE: ' + GADGETS[kind], 0, 0.85, -0.505, Math.PI, 0.6);
    var d = new T.Group(); d.position.set(x, 1.12, z); d.userData.noBatch = true; R.add(d); A.noAud(d); var a1;
    if (kind === 0) { add(d, bx(0.16, 0.04, 0.16), ph('#fb7185', 60), 0, 0, 0); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { add(d, cy(0.05, 0.05, 0.01, 12), gl('#5eead4'), q[0] * 0.11, 0.02, q[1] * 0.11); }); a1 = function (t) { d.position.y = 1.15 + Math.sin(t * 3) * 0.04; d.rotation.y = t; }; }
    else if (kind === 1) { var r = add(d, to(0.1, 0.022, 24), gl('#a78bfa'), 0, 0.05, 0), r3 = add(d, new T.CircleGeometry(0.09, 20), new T.MeshBasicMaterial({ color: '#c4b5fd', transparent: true, opacity: 0.6, side: T.DoubleSide, depthWrite: false }), 0, 0.05, 0); a1 = function (t) { d.rotation.y = t * 1.5; r3.material.opacity = 0.4 + Math.sin(t * 6) * 0.2; void r; }; }
    else if (kind === 2) { add(d, bx(0.2, 0.18, 0.18), ph('#94a3b8', 90), 0, 0.02, 0); add(d, bx(0.14, 0.04, 0.01), gl('#5eead4'), 0, 0.04, 0.095); add(d, cy(0.01, 0.01, 0.1, 6), chrome(), 0, 0.16, 0); var tip = add(d, sp(0.025, 8), gl('#fb7185'), 0, 0.21, 0); a1 = function (t) { d.rotation.y = Math.sin(t * 0.8) * 0.6; tip.visible = Math.sin(t * 5) > 0; }; }
    else if (kind === 3) { add(d, cy(0.035, 0.05, 0.22, 12), ph('#fcd34d', 60), 0, 0, 0).rotation.z = Math.PI / 2; add(d, bx(0.06, 0.1, 0.04), ph('#1e293b', 40), -0.04, -0.06, 0); add(d, sp(0.03, 10), gl('#fde047'), 0.12, 0, 0); a1 = function (t) { d.rotation.y = t * 0.7; }; }
    else if (kind === 4) { add(d, bx(0.22, 0.05, 0.12), ph('#ef4444', 70), 0, -0.02, 0); add(d, bx(0.08, 0.05, 0.08), ph('#fbbf24', 70), -0.02, 0.03, 0); [[-0.07, -0.07], [0.07, -0.07], [-0.07, 0.07], [0.07, 0.07]].forEach(function (q) { add(d, cy(0.025, 0.025, 0.02, 10), ph('#111827', 20), q[0], -0.04, q[1]).rotation.x = Math.PI / 2; }); a1 = function (t) { d.rotation.y = t * 0.9; }; }
    else { [-0.06, 0.06].forEach(function (sx) { add(d, bx(0.08, 0.06, 0.18), ph('#5eead4', 60), sx, 0, 0); var fl = add(d, new T.ConeGeometry(0.03, 0.08, 8), gl('#fb923c'), sx, -0.07, -0.06); fl.rotation.x = Math.PI; }); a1 = function (t) { d.position.y = 1.14 + Math.abs(Math.sin(t * 2)) * 0.05; d.rotation.y = t * 0.6; }; }
    ANIM.push(a1); reg(name, g); solid(x - 0.5, x + 0.5, z - 0.5, z + 0.5, name);
  }
  function holoTable() {
    var x = -4.4, z = 38.6, g = grp('Holo-globe table'); g.position.set(x, 0, z); add(g, cy(0.62, 0.7, 0.85, 32), ph('#1e293b', 70), 0, 0.42, 0); add(g, cy(0.72, 0.72, 0.06, 32), ph('#334155', 90), 0, 0.88, 0); add(g, to(0.6, 0.025, 40), gl('#2dd4bf'), 0, 0.92, 0).rotation.x = Math.PI / 2; add(g, cy(0.3, 0.3, 0.02, 24), gl('#99f6e4'), 0, 0.92, 0);
    for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; add(g, bx(0.12, 0.02, 0.06), gl(i % 2 ? '#fb7185' : '#fbbf24'), Math.cos(a) * 0.48, 0.92, Math.sin(a) * 0.48).rotation.y = -a; }
    reg('Holo-globe table', g); solid(x - 0.72, x + 0.72, z - 0.72, z + 0.72, 'Holo-globe table');
    var h = grp('Holo globe', R); h.userData.noBatch = true; A.noAud(h); h.position.set(x, 1.55, z);
    var hm = new T.MeshBasicMaterial({ color: '#5eead4', wireframe: true, transparent: true, opacity: 0.5, depthWrite: false, blending: T.AdditiveBlending }), glb = add(h, new T.IcosahedronGeometry(0.38, 2), hm, 0, 0, 0);
    var ring = add(h, to(0.55, 0.01, 48), new T.MeshBasicMaterial({ color: '#fb7185', transparent: true, opacity: 0.7, depthWrite: false, blending: T.AdditiveBlending }), 0, 0, 0); ring.rotation.x = 1.2;
    var moons = []; for (i = 0; i < 3; i++) moons.push(add(h, new T.CylinderGeometry(0.05, 0.05, 0.035, 3), gl('#fde047'), 0, 0, 0));
    var beam = add(h, new T.CylinderGeometry(0.3, 0.32, 0.6, 24, 1, true), new T.MeshBasicMaterial({ color: '#5eead4', transparent: true, opacity: 0.08, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }), 0, -0.33, 0); void beam;
    var lab = cvs(512, 64, function (c, W, H) { c.clearRect(0, 0, W, H); neon(c, 'RATITA R&D \u00b7 WORLDWIDE \u00b7 (mostly the kitchen)', W / 2, H / 2, 30, '#5eead4', W - 10); }); var lm = add(h, new T.PlaneGeometry(1.6, 0.2), new T.MeshBasicMaterial({ map: lab.tex, transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }), 0, 0.62, 0);
    ANIM.push(function (t) { glb.rotation.y = t * 0.4; ring.rotation.z = t * 0.8; moons.forEach(function (m, k) { var a = t * (0.9 + k * 0.4) + k * 2; m.position.set(Math.cos(a) * 0.55, Math.sin(a * 1.3) * 0.15, Math.sin(a) * 0.55); m.rotation.y = t * 2; }); lm.rotation.y = t * 0.3; });
  }
  var KS = {};
  function kiosk() {
    var x = 0.95, z = 29.35, g = grp('Schedule kiosk'); g.position.set(x, 0, z); g.rotation.y = -Math.PI / 2;
    add(g, bx(0.6, 0.06, 0.45), ph('#1e293b', 60), 0, 0.03, 0); add(g, bx(0.16, 1.05, 0.16), ph('#14b8a6', 80, '#053b36'), 0, 0.56, 0); var hd = new T.Group(); hd.position.set(0, 1.2, 0.05); hd.rotation.x = -0.45; g.add(hd);
    add(hd, bx(0.66, 0.5, 0.06), ph('#0f172a', 60), 0, 0, 0); KS.c = cvs(512, 384); planeM(0.6, 0.45, KS.c.tex, hd, 0, 0, 0.032);
    var top = cvs(256, 64, function (c, W, H) { c.fillStyle = '#062a28'; c.fillRect(0, 0, W, H); neon(c, 'WHAT\u2019S NEXT?', W / 2, H / 2, 34, '#fbbf24', W - 10); }); planeM(0.64, 0.16, top.tex, g, 0, 1.62, 0.02);
    reg('Schedule kiosk', g); solid(x - 0.24, x + 0.3, z - 0.33, z + 0.33, 'Schedule kiosk'); drawKiosk(null);
    inter({ id: 'pv_kiosk', kind: 'pv_board', name: 'Schedule kiosk', desc: 'A quick look at the Scheduled Additions.', col: '#fbbf24', x: x - 1.1, z: z, dir: [-1, 0], r: 0.9 });
  }
  function drawKiosk(model) { if (!KS.c) return; model = model || (PV() && PV().model()); KS.c.redraw(function (c, W, H) { c.fillStyle = '#060b18'; c.fillRect(0, 0, W, H); txt(c, 'SCHEDULED ADDITIONS', W / 2, 30, 30, '#fbbf24');
    var rows = []; if (model) { model.building.slice(0, 3).forEach(function (it) { rows.push(['\u25CF', '#fb7185', it.name]); }); model.queued.slice(0, 3).forEach(function (it) { rows.push(['\u25CF', '#5eead4', it.name]); }); }
    if (!rows.length) rows.push(['', '#94a3b8', 'loading\u2026']); rows.slice(0, 6).forEach(function (r2, i) { var y = 80 + i * 46; c.fillStyle = 'rgba(255,255,255,.06)'; rr(c, 14, y - 19, W - 28, 38, 8); c.fill(); txt(c, r2[0], 36, y, 22, r2[1]); fitTxt(c, r2[2], 56, y, 24, '#ffffff', W - 80, 'left'); });
    txt(c, '\u25CF building now   \u25CF up next   (tap for more)', W / 2, H - 20, 16, '#94a3b8'); }); }
  function shelves() {
    var x = P.maxX - 0.3, z = 33.3, g = grp('Parts shelves'); g.position.set(x, 0, z); var fr = ph('#475569', 60);
    [-1.05, 1.05].forEach(function (sz) { add(g, bx(0.5, 2.2, 0.05), fr, 0, 1.1, sz); }); [0.12, 0.62, 1.12, 1.62, 2.12].forEach(function (sy) { add(g, bx(0.5, 0.04, 2.1), fr, 0, sy, 0); });
    var bins = [], cols = ['#fb7185', '#5eead4', '#fbbf24', '#a78bfa', '#4ade80'];
    for (var r2 = 0; r2 < 4; r2++) for (var k = 0; k < 5; k++) bins.push([-0.02, 0.14 + r2 * 0.5 + 0.11, -0.8 + k * 0.4, cols[(r2 + k) % 5]]);
    var im = new T.InstancedMesh(new T.BoxGeometry(0.36, 0.22, 0.32), new T.MeshPhongMaterial({ color: '#ffffff', shininess: 40 }), bins.length), m4 = new T.Matrix4(), cc = new T.Color();
    bins.forEach(function (q, i) { m4.makeTranslation(x + q[0], q[1], z + q[2]); im.setMatrixAt(i, m4); im.setColorAt(i, cc.set(q[3])); }); im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.frustumCulled = false; R.add(im); A.noAud(im);
    var gears = new T.InstancedMesh(new T.CylinderGeometry(0.06, 0.06, 0.03, 8), ph('#cbd5e1', 90), 12); for (var i = 0; i < 12; i++) { var q4 = new T.Quaternion().setFromEuler(new T.Euler(Math.PI / 2, 0, i)); m4.compose(new T.Vector3(x - 0.05, 0.31 + (i % 4) * 0.5, z - 0.9 + Math.floor(i / 4) * 0.85 + (i % 2) * 0.08), q4, new T.Vector3(1, 1, 1)); gears.setMatrixAt(i, m4); } gears.instanceMatrix.needsUpdate = true; gears.frustumCulled = false; R.add(gears); A.noAud(gears);
    plate(g, 'SPARE PARTS \u00b7 sign them out with Lili', -0.27, 2.32, 0, -Math.PI / 2, 1.2);
    reg('Parts shelves', g); solid(x - 0.28, x + 0.3, z - 1.1, z + 1.1, 'Parts shelves');
  }
  function holoShip() {
    var x = -0.9, z = 42.4, g = grp('Holo pedestal'); g.position.set(x, 0, z); add(g, cy(0.3, 0.36, 0.9, 6), ph('#1e293b', 70), 0, 0.45, 0); add(g, cy(0.32, 0.32, 0.05, 6), gl('#2dd4bf'), 0, 0.92, 0); plate(g, 'SNEAK PEEK: PIRATE PACK', 0, 0.6, 0.3, 0, 0.5);
    reg('Holo pedestal', g); solid(x - 0.36, x + 0.36, z - 0.36, z + 0.36, 'Holo pedestal');
    var h = grp('Holo ship', R); h.userData.noBatch = true; A.noAud(h); h.position.set(x, 1.4, z); var hm = new T.MeshBasicMaterial({ color: '#7dd3fc', transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending });
    add(h, bx(0.5, 0.12, 0.18), hm, 0, 0, 0); add(h, bx(0.12, 0.1, 0.16), hm, -0.22, 0.1, 0); add(h, cy(0.01, 0.01, 0.5, 6), hm, 0.02, 0.3, 0); var sail = add(h, new T.PlaneGeometry(0.28, 0.26), new T.MeshBasicMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.4, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }), 0.02, 0.32, 0); sail.rotation.y = Math.PI / 2;
    var flag = add(h, new T.PlaneGeometry(0.1, 0.06), new T.MeshBasicMaterial({ color: '#111827', side: T.DoubleSide }), 0.07, 0.53, 0); void flag;
    ANIM.push(function (t) { h.rotation.y = t * 0.6; h.position.y = 1.4 + Math.sin(t * 1.5) * 0.04; h.rotation.z = Math.sin(t * 1.2) * 0.06; });
  }
  function crateStacks() {
    var spots = [[-17.4, 47.35, 0, 0.7, 0.1], [-17.4, 47.35, 0.7, 0.55, -0.2], [-1.75, 47.35, 0, 0.7, 0.15], [0.95, 47.25, 0, 0.8, 0], [0.95, 47.25, 0.8, 0.6, 0.3], [1.0, 46.3, 0, 0.6, -0.1],
      [-16.6, 27.0 + 1.3, 0, 0.0, 0]].filter(function (q) { return q[3] > 0; });
    var tex = cvs(256, 256, function (c, W, H) { c.fillStyle = '#b07a3f'; c.fillRect(0, 0, W, H); c.strokeStyle = '#6b4219'; c.lineWidth = 14; c.strokeRect(7, 7, W - 14, H - 14); c.lineWidth = 8; c.beginPath(); c.moveTo(14, 90); c.lineTo(W - 14, 90); c.moveTo(14, 170); c.lineTo(W - 14, 170); c.stroke(); c.fillStyle = 'rgba(255,255,255,.88)'; c.fillRect(40, 104, W - 80, 52); txt(c, 'RATITA IND.', W / 2, 130, 28, '#0f766e'); });
    var im = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshLambertMaterial({ map: tex.tex }), spots.length), m4 = new T.Matrix4();
    spots.forEach(function (q, i) { m4.compose(new T.Vector3(q[0], q[2] + q[3] / 2, q[1]), new T.Quaternion().setFromEuler(new T.Euler(0, q[4], 0)), new T.Vector3(q[3], q[3], q[3])); im.setMatrixAt(i, m4); }); im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; R.add(im); A.noAud(im);
    [[-17.4, 47.35, 0.75], [-1.75, 47.35, 0.75], [0.95, 47.25, 0.85], [1.0, 46.3, 0.65]].forEach(function (q, i) { var h2 = q[2] * 0.55; solid(q[0] - h2, q[0] + h2, q[1] - h2, Math.min(P.maxZ, q[1] + h2), 'Crate stack ' + i); var b = new T.Object3D(); b.name = 'Crate stack ' + i; b.position.set(q[0], 0, q[1]); R.add(b); });
  }
  function cables() {
    var g = grp('Floor cable runs'); A.noAud(g); var cols = ['#fb7185', '#5eead4', '#fbbf24', '#a78bfa'];
    function run(pts, w) { cols.forEach(function (c2, k) { var off = (k - 1.5) * 0.07, v = pts.map(function (q) { return new T.Vector3(q[0] + off, 0.035, q[1]); }); var tb = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(v), 40, 0.03, 6), ph(c2, 40)); g.add(tb); }); void w; }
    run([[-13.4, 27.45], [-13.0, 30.0 + 2.4], [-12.0, 34.6], [-11.4, 36.6]]); run([[-6.5, 38.6], [-5.3, 38.9]]); run([[-9.0, 41.7], [-7.0, 43.2], [-4.9, 43.4]]);
    // cable ramp covers where they cross walkways
    [[-12.6, 33.6, 0.55], [-7.6, 42.6, -0.6]].forEach(function (q) { var r2 = add(g, bx(0.5, 0.06, 0.9), ph('#facc15', 30), q[0], 0.03, q[1]); r2.rotation.y = q[2]; });
    // ceiling catenary cables between trusses
    for (var i = 0; i < 5; i++) { var x0 = P.minX + 2.2 + i * 3.2, c3 = new T.Mesh(new T.TubeGeometry(new T.QuadraticBezierCurve3(new T.Vector3(x0, P.h - 0.3, 29), new T.Vector3(x0 + 1.6, P.h - 1.0, 31), new T.Vector3(x0 + 3.2, P.h - 0.3, 33)), 14, 0.025, 6), ph(cols[i % 4], 30)); g.add(c3); }
  }
  function banners() {
    var g = grp('Hanging banners'); A.noAud(g);
    [['PREVIEW', '#5eead4', -13.5], ['QUALITY', '#fb7185', -6.0], ['FUTURE', '#fbbf24', -1.8]].forEach(function (q, i) { var c = cvs(128, 384, function (cx, W, H) { cx.fillStyle = '#0f172a'; cx.fillRect(0, 0, W, H); cx.fillStyle = q[1]; cx.fillRect(0, 0, W, 16); cx.beginPath(); cx.moveTo(0, H - 40); cx.lineTo(W / 2, H); cx.lineTo(W, H - 40); cx.lineTo(W, H); cx.lineTo(0, H); cx.fillStyle = 'rgba(0,0,0,0)'; PR.mouse(cx, W / 2, 80, 28, q[1]); cx.save(); cx.translate(W / 2, 230); cx.rotate(Math.PI / 2); neon(cx, q[0], 0, 0, 52, q[1], 260); cx.restore(); });
      var m = add(g, new T.PlaneGeometry(0.6, 1.8), new T.MeshBasicMaterial({ map: c.tex, side: T.DoubleSide }), q[2], P.h - 1.5, 33.8 + i * 4.3); m.rotation.y = Math.PI / 2; add(g, cy(0.02, 0.02, 0.7, 6), chrome(), q[2], P.h - 0.58, 33.8 + i * 4.3).rotation.x = Math.PI / 2; });
  }
  function toolCart() {
    var x = -6.3, z = 33.1, g = grp('Rolling tool cart'); g.position.set(x, 0, z); g.rotation.y = 0.4; var fr = ph('#ef4444', 70);
    [0.25, 0.85].forEach(function (y) { add(g, bx(0.9, 0.05, 0.55), fr, 0, y, 0); }); [[-0.42, -0.25], [0.42, -0.25], [-0.42, 0.25], [0.42, 0.25]].forEach(function (q) { add(g, cy(0.02, 0.02, 0.85, 6), chrome(), q[0], 0.5, q[1]); add(g, sp(0.05, 8), ph('#111827', 20), q[0], 0.05, q[1]); });
    add(g, bx(0.5, 0.22, 0.3), ph('#f59e0b', 60), -0.15, 0.39, 0); add(g, bx(0.32, 0.2, 0.3), ph('#1e293b', 60), 0.25, 0.37, 0);
    add(g, bx(0.46, 0.32, 0.04), ph('#0f172a', 60), 0.1, 1.1, -0.12).rotation.x = -0.2; var sc = cvs(128, 96, function (c, W, H) { c.fillStyle = '#022c22'; c.fillRect(0, 0, W, H); c.strokeStyle = '#4ade80'; c.lineWidth = 3; c.beginPath(); for (var i = 0; i <= W; i += 4) c.lineTo(i, H / 2 + Math.sin(i / 9) * 22 * Math.sin(i / 37)); c.stroke(); txt(c, 'FLUX OK', W / 2, 14, 12, '#bbf7d0'); });
    var sm = planeM(0.42, 0.28, sc.tex, g, 0.1, 1.1, -0.095); sm.rotation.x = -0.2; add(g, cy(0.03, 0.03, 0.22, 8), ph('#94a3b8', 90), -0.3, 0.98, 0.1).rotation.z = 1.2; add(g, bx(0.12, 0.04, 0.2), ph('#fbbf24', 50), -0.3, 0.9, -0.1);
    reg('Rolling tool cart', g); solid(x - 0.55, x + 0.55, z - 0.45, z + 0.45, 'Rolling tool cart');
  }
  function clutter() { toolCart(); plant('Board plant', -1.0, 35.9, false); lounge(); wipRow(); gadgetTable('Gadget table 1', -10.6, 30.35, 0); gadgetTable('Gadget table 2', -7.6, 29.95, 1); gadgetTable('Gadget table 3', -14.6, 43.6, 2); gadgetTable('Gadget table 4', -9.6, 44.0, 3); gadgetTable('Gadget table 5', -4.6, 43.8, 4); gadgetTable('Gadget table 6', -14.6, 33.9, 5);
    holoTable(); kiosk(); shelves(); holoShip(); crateStacks(); cables(); banners(); vault(); }


  /* ---------- TIME JUMPER SAVE BOOTH: Lili's 'Save Vault' terminal. It keeps the LAST preview of every game that shipped
     (preview.json "archive" -> archive/<id>-beta/), playable forever with its own save. Slots fill with cartridges as betas arrive. ---------- */
  var VX = -2.6, VZ = 40.75, VT = { slots: [] }; PR.VAULT = { x: VX, z: VZ };
  function vault() {
    var g = grp('Time Jumper Save Booth'); g.position.set(VX, 0, VZ); g.rotation.y = Math.PI; VT.g = g; // local +z = the front (faces the Time Jumper queue)
    var body = ph('#14b8a6', 70, '#03302c'), dark = ph('#0f172a', 50), trim = ph('#fb7185', 90), gold = ph('#fbbf24', 110, '#3a2600'), steel = chrome();
    // plinth + glow strip
    add(g, bx(1.78, 0.12, 0.86), dark, 0, 0.06, 0); add(g, bx(1.7, 0.03, 0.02), gl('#5eead4'), 0, 0.1, 0.43);
    // main cabinet with rounded side columns (Ratita house style, like Lili's desk)
    add(g, bx(1.36, 1.86, 0.62), body, 0, 0.12 + 0.93, -0.02);
    [-1, 1].forEach(function (sd) { add(g, cy(0.17, 0.17, 1.86, 22), trim, sd * 0.7, 0.12 + 0.93, 0.02); add(g, cy(0.19, 0.19, 0.05, 22), gold, sd * 0.7, 2.0, 0.02); add(g, sp(0.12, 16), gold, sd * 0.7, 2.06, 0.02);
      for (var k = 0; k < 4; k++) add(g, bx(0.02, 0.03, 0.3), dark, sd * 0.875, 0.5 + k * 0.09, 0.02); }); // vents
    // arched crown (half drum) + floppy-disk emblem
    var cr = add(g, new T.CylinderGeometry(0.36, 0.36, 1.36, 28, 1, false, 0, Math.PI), body, 0, 1.98, -0.02); cr.rotation.z = Math.PI / 2; cr.rotation.y = 0;
    var cr2 = add(g, new T.CylinderGeometry(0.37, 0.37, 0.05, 28, 1, false, 0, Math.PI), gold, 0, 1.98, 0.3); cr2.rotation.x = Math.PI / 2; cr2.rotation.y = Math.PI / 2; cr2.rotation.z = 0;
    var fd = new T.Group(); fd.position.set(0, 2.12, 0.33); g.add(fd); add(fd, bx(0.34, 0.34, 0.03), ph('#1e3a8a', 60), 0, 0, 0); add(fd, bx(0.18, 0.11, 0.035), steel, 0.02, 0.11, 0.003); add(fd, bx(0.04, 0.07, 0.04), dark, 0.06, 0.11, 0.004);
    add(fd, bx(0.24, 0.13, 0.035), ph('#f8fafc', 30), 0, -0.07, 0.003); VT.disk = fd;
    // neon name sign (1.4 x 0.3 m at 4.67:1)
    var sg = cvs(560, 120, function (c, w, h) { c.fillStyle = '#04201e'; rr(c, 3, 3, w - 6, h - 6, 22); c.fill(); c.strokeStyle = '#fbbf24'; c.lineWidth = 5; c.stroke(); neon(c, 'SAVE VAULT', w / 2, h / 2 - 8, 60, '#5eead4', w - 40); txt(c, 'TIME JUMPER SAVE BOOTH \u00b7 RATITA INDUSTRIES', w / 2, h - 18, 17, '#fda4af'); });
    planeM(1.4, 0.3, sg.tex, g, 0, 2.72, 0.0); add(g, bx(0.04, 0.4, 0.04), steel, -0.5, 2.42, 0.0); add(g, bx(0.04, 0.4, 0.04), steel, 0.5, 2.42, 0.0); add(g, bx(1.44, 0.34, 0.03), dark, 0, 2.72, -0.02);
    // the glowing list screen (0.92 x 0.6 m, canvas 614 x 400), tilted back in a bezel
    var sc = new T.Group(); sc.position.set(0, 1.52, 0.37); sc.rotation.x = -0.16; g.add(sc); add(sc, bx(1.04, 0.72, 0.06), dark, 0, 0, 0); add(sc, bx(1.08, 0.04, 0.08), trim, 0, 0.38, 0); add(sc, bx(1.08, 0.04, 0.08), trim, 0, -0.38, 0);
    VT.scr = cvs(614, 400); planeM(0.92, 0.6, VT.scr.tex, sc, 0, 0, 0.032);
    [[-0.5, 0.34], [0.5, 0.34], [-0.5, -0.34], [0.5, -0.34]].forEach(function (q) { add(sc, sp(0.018, 8), steel, q[0], q[1], 0.035); });
    // tape reels behind a little window (left) + status lamps (right), above the slots
    var win = add(g, bx(0.46, 0.24, 0.02), new T.MeshPhongMaterial({ color: '#a5f3fc', transparent: true, opacity: 0.25, shininess: 150 }), -0.42, 0.25, 0.31); void win; add(g, bx(0.5, 0.28, 0.02), dark, -0.42, 0.25, 0.295);
    VT.reels = []; [-0.53, -0.31].forEach(function (rx) { var r = new T.Group(); r.position.set(rx, 0.25, 0.305); g.add(r); add(r, cy(0.095, 0.095, 0.012, 24), ph('#334155', 60), 0, 0, 0).rotation.x = Math.PI / 2; add(r, cy(0.065, 0.065, 0.016, 20), ph('#3f2a1d', 20), 0, 0, 0).rotation.x = Math.PI / 2;
      for (var k = 0; k < 3; k++) { var sp2 = add(r, bx(0.012, 0.18, 0.02), steel, 0, 0, 0.006); sp2.rotation.z = k * Math.PI / 3; } add(r, cy(0.02, 0.02, 0.03, 10), gold, 0, 0, 0.004).rotation.x = Math.PI / 2; VT.reels.push(r); });
    add(g, bx(0.22, 0.006, 0.006), ph('#3f2a1d', 20), -0.42, 0.17, 0.307);
    VT.lamps = []; ['#4ade80', '#fbbf24', '#fb7185'].forEach(function (c2, i) { add(g, cy(0.035, 0.035, 0.03, 14), dark, 0.4 + i * 0.1, 0.25, 0.31).rotation.x = Math.PI / 2; var l = add(g, sp(0.028, 12), gl(c2), 0.4 + i * 0.1, 0.25, 0.33); VT.lamps.push(l); });
    // cartridge slots: 2 rows x 5 (the bay), each a dark recess; a cartridge sticks out when a beta is archived there
    add(g, bx(1.2, 0.46, 0.05), ph('#0b1324', 40), 0, 0.62, 0.29);
    var CART = ['#fb7185', '#5eead4', '#fbbf24', '#a78bfa', '#4ade80'];
    for (var rI = 0; rI < 2; rI++) for (var k = 0; k < 5; k++) { var sx = -0.46 + k * 0.23, sy = 0.73 - rI * 0.22, sl = new T.Group(); sl.position.set(sx, sy, 0.31); g.add(sl);
      add(sl, bx(0.19, 0.07, 0.03), ph('#020617', 20), 0, 0, 0); add(sl, bx(0.17, 0.012, 0.02), gl('#164e63'), 0, -0.045, 0.006); // slot mouth + under-glow
      var ca = new T.Group(); sl.add(ca); add(ca, bx(0.16, 0.13, 0.07), ph(CART[(rI * 5 + k) % 5], 60), 0, 0.02, 0.03); add(ca, bx(0.12, 0.07, 0.005), ph('#f8fafc', 20), 0, 0.03, 0.068); add(ca, bx(0.16, 0.02, 0.07), ph('#1e293b', 40), 0, 0.09, 0.03);
      var led = add(sl, sp(0.012, 8), gl('#334155'), 0.08, -0.045, 0.02); ca.visible = false; VT.slots.push({ ca: ca, led: led, g: sl }); }
    // control ledge: keyboard, big SAVE button, a lever
    var ld = new T.Group(); ld.position.set(0, 1.08, 0.42); ld.rotation.x = 0.28; g.add(ld); add(ld, bx(1.2, 0.05, 0.28), dark, 0, 0, 0); add(ld, bx(1.22, 0.02, 0.02), trim, 0, 0.02, 0.14);
    var keys = [], km = new T.InstancedMesh(new T.BoxGeometry(0.045, 0.02, 0.04), ph('#e2e8f0', 40), 30), m4 = new T.Matrix4(); for (var i = 0; i < 30; i++) { m4.makeTranslation(-0.36 + (i % 10) * 0.055, 0.035, -0.08 + Math.floor(i / 10) * 0.05); km.setMatrixAt(i, m4); } ld.add(km); km.instanceMatrix.needsUpdate = true; void keys;
    add(ld, cy(0.07, 0.08, 0.04, 22), dark, 0.42, 0.04, 0); VT.btn = add(ld, cy(0.055, 0.055, 0.04, 22), ph('#fb7185', 90, '#5a0d1b'), 0.42, 0.07, 0);
    var lv = new T.Group(); lv.position.set(-0.5, 0.03, 0.02); ld.add(lv); add(lv, bx(0.08, 0.03, 0.08), steel, 0, 0, 0); var arm = add(lv, cy(0.012, 0.012, 0.16, 8), steel, 0, 0.08, 0); arm.rotation.x = 0.4; add(lv, sp(0.03, 12), gold, 0, 0.15, 0.06);
    // Ratita logo plate + hazard stripe on the plinth + a cable to the floor runs
    var lg = cvs(256, 96, function (c, w, h) { c.fillStyle = '#0b3b38'; rr(c, 2, 2, w - 4, h - 4, 14); c.fill(); mouse(c, 46, 56, 22, '#d6a26b'); txt(c, 'RATITA', 150, 36, 30, '#fbbf24'); txt(c, 'INDUSTRIES', 150, 66, 18, '#5eead4'); });
    planeM(0.34, 0.1275, lg.tex, g, 0.04, 0.25, 0.312);
    var hz = cvs(512, 32, function (c, w, h) { for (var i2 = 0; i2 < 16; i2++) { c.fillStyle = i2 % 2 ? '#111827' : '#facc15'; c.beginPath(); c.moveTo(i2 * 32, 0); c.lineTo(i2 * 32 + 32, 0); c.lineTo(i2 * 32 + 16, h); c.lineTo(i2 * 32 - 16, h); c.fill(); } });
    planeM(1.76, 0.055, hz.tex, g, 0, 0.06, 0.432);
    var cb = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0.55, 0.5, -0.33), new T.Vector3(0.62, 0.15, -0.55), new T.Vector3(0.9, 0.035, -0.8), new T.Vector3(1.3, 0.035, -0.9)]), 20, 0.03, 8), ph('#a78bfa', 40)); g.add(cb);
    reg('Time Jumper Save Booth', g, 'booth'); solid(VX - 0.92, VX + 0.92, VZ - 0.5, VZ + 0.46, 'Time Jumper Save Booth');
    inter({ id: 'pv_vault', kind: 'pv_vault', name: 'Save Vault', desc: 'The Time Jumper Save Booth: the last beta of every game that shipped, playable forever.', col: '#5eead4', x: VX, z: VZ - 1.05, dir: [0, -1], r: 1.1, gw: 1.5, gh: 1.0 });
    ANIM.push(function (t) { var on = VT.n > 0 || VT.p > 0; VT.reels.forEach(function (r, i) { r.rotation.z = -t * (on ? 2.2 : 0.4) * (i ? 1.15 : 1); });
      VT.lamps[0].visible = Math.sin(t * 2.4) > -0.6; VT.lamps[1].visible = VT.p > 0 ? Math.sin(t * 5) > 0 : true; VT.lamps[2].visible = VT.n === 0 && Math.sin(t * 1.3) > 0.2;
      VT.disk.position.y = 2.12 + Math.sin(t * 1.6) * 0.012; VT.slots.forEach(function (sl, i) { if (sl.pend) sl.led.material = gl(Math.sin(t * 5 + i) > 0 ? '#fbbf24' : '#3f2a00'); }); });
    drawVault(null);
  }
  function drawVault(model) {
    if (!VT.scr) return; model = model || (PV() && PV().model()); var A2 = (model && model.archive) || [], P2 = (model && model.pending) || [];
    VT.n = A2.length; VT.p = P2.length;
    VT.slots.forEach(function (sl, i) { sl.pend = false; if (i < A2.length) { sl.ca.visible = true; sl.ca.position.z = 0; sl.led.material = gl('#4ade80'); } else if (i < A2.length + P2.length) { sl.ca.visible = true; sl.ca.position.z = 0.05; sl.pend = true; } else { sl.ca.visible = false; sl.led.material = gl('#334155'); } });
    VT.scr.redraw(function (c, w, h) { c.fillStyle = '#021b1a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2dd4bf'; c.lineWidth = 4; rr(c, 6, 6, w - 12, h - 12, 18); c.stroke();
      neon(c, '\uD83D\uDCBE SAVE VAULT', w / 2, 40, 40, '#5eead4', w - 60); txt(c, 'final betas, playable forever \u00b7 own save', w / 2, 76, 18, '#99f6e4');
      var y = 104, rows = A2.slice(0, 4).map(function (p) { return ['\uD83D\uDCBE', p.name, 'Final Beta \u00b7 archived ' + (p.archived || ''), '#4ade80']; });
      if (!A2.length) { c.fillStyle = 'rgba(251,113,133,.12)'; rr(c, 22, y, w - 44, 92, 14); c.fill(); txt(c, 'NOTHING ARCHIVED YET', w / 2, y + 34, 30, '#fda4af'); txt(c, 'when a game ships, its last Time Jumper preview lands here', w / 2, y + 68, 17, '#fecdd3'); y += 108; }
      P2.slice(0, Math.max(1, 3 - rows.length)).forEach(function (p) { rows.push(['\u23F3', p.name, 'in the Jumper now \u00b7 archived at release', '#fbbf24']); });
      rows.slice(0, 4).forEach(function (r) { c.fillStyle = 'rgba(255,255,255,.06)'; rr(c, 22, y, w - 44, 58, 12); c.fill(); txt(c, r[0], 52, y + 29, 28, r[3]); fitTxt(c, r[1], 84, y + 20, 24, '#ffffff', w - 130, 'left'); fitTxt(c, r[2], 84, y + 44, 17, r[3], w - 130, 'left'); y += 66; });
      txt(c, A2.length + ' archived \u00b7 ' + P2.length + ' waiting \u00b7 ' + (10 - Math.min(10, A2.length + P2.length)) + ' empty slots', w / 2, h - 24, 17, '#94a3b8'); });
  }
  PR.drawVault = drawVault;

  /* ---------- the cheese-cog that pops out during a 'loose part' malfunction ---------- */
  PR.PART_SPOTS = [[-14.0, 37.5], [-5.6, 45.3], [-1.3, 33.2], [-12.2, 43.0], [-3.0, 34.4], [-6.0, 31.8]];
  var PT = {};
  function partBuild() {
    var g = grp('Loose cheese-cog'); g.userData.noBatch = true; A.noAud(g); PT.g = g;
    var cog = new T.Group(); cog.position.y = 0.32; g.add(cog); PT.cog = cog; var y = ph('#facc15', 120, '#5a4300');
    add(cog, cy(0.2, 0.2, 0.08, 24), y, 0, 0, 0).rotation.x = Math.PI / 2; add(cog, cy(0.07, 0.07, 0.1, 14), ph('#0f172a', 40), 0, 0, 0).rotation.x = Math.PI / 2;
    for (var i = 0; i < 10; i++) { var a = i / 10 * Math.PI * 2, t2 = add(cog, bx(0.08, 0.08, 0.08), y, Math.cos(a) * 0.23, Math.sin(a) * 0.23, 0); t2.rotation.z = a; }
    [0.05, -0.08, 0.11].forEach(function (q, k) { add(cog, sp(0.025, 8), ph('#b45309', 20), q, 0.08 - k * 0.06, 0.042); });
    PT.glow = new T.Sprite(new T.SpriteMaterial({ map: A.glowTex, color: '#fde68a', transparent: true, depthWrite: false, blending: T.AdditiveBlending })); PT.glow.scale.set(1.3, 1.3, 1); PT.glow.position.y = 0.35; g.add(PT.glow);
    PT.cab = inter({ id: 'pv_part', kind: 'pv_part', name: 'Cheese-cog', col: '#fde68a', x: PR.PART_SPOTS[0][0], z: PR.PART_SPOTS[0][1], dir: [0, 1], r: 1.1, par: g, noGlow: true });
    PT.cab.disabled = true; g.visible = false;
  }
  PR.showPart = function (i) { var q = PR.PART_SPOTS[i % PR.PART_SPOTS.length]; PT.g.position.set(q[0], 0, q[1]); PT.g.visible = true; PT.cab.front.set(q[0], 0, q[1]); PT.cab.x = q[0]; PT.cab.z = q[1]; PT.cab.group.position.set(-0, 0, -1.75); PT.g.updateMatrixWorld(true); PT.cab.disabled = false; PT.on = true; return q; };
  PR.hidePart = function () { if (!PT.g) return; PT.g.visible = false; PT.cab.disabled = true; PT.on = false; };
  PR.partPos = function () { return PT.on ? { x: PT.g.position.x, z: PT.g.position.z } : null; };

  /* ---------- build + frame ---------- */
  PR.build = function (api) {
    A = api; PR.api = api; P = api.PREV; if (!P) return;
    R = new T.Group(); R.name = 'area:preview'; A.scene.add(R);
    shell(); entrance(); desk(); jumper(); board(); racks(); bench(); crates(); logoWall(); planters(); cabinet32(); clutter(); partBuild(); glitchRoom();
    var M = GA.PVD ? GA.PVD.model() : null; PR.buildPosters(M); drawBoard(M); drawKiosk(M); drawClock();
    if (GA.PVD) GA.PVD.onChange(function () { var m2 = GA.PVD.model(); PR.buildPosters(m2); drawBoard(m2); drawKiosk(m2); drawVault(m2); drawHolo(); drawConsole(); if (PR.onData) PR.onData(m2); });
    R.updateMatrixWorld(true); A.anims.push(frame); st.built = true; PR.built = true;
  };
  var dummy = new T.Object3D(), tmpC = new T.Color();
  function frame(t, dt) {
    if (!st.built) return; dt = Math.max(0, Math.min(0.1, t - (st.t || t))); st.t = t;
    var area = GA.Hub.area ? GA.Hub.area() : 'main', here = area === 'preview' || area === 'food';
    if (GR) GR.visible = area === 'glitch';
    if (area === 'glitch' && JM.float) { JM.float.forEach(function (f, i) { f.m.rotation.x += dt * f.s; f.m.rotation.y += dt * f.s * 1.3; f.m.position.y = f.y + Math.sin(t * f.s * 2 + i) * 0.3; }); JM.portal.rotation.y = Math.sin(t) * 0.3; JM.pDisk.material.opacity = 0.4 + Math.sin(t * 5) * 0.15; JM.gcheese.rotation.y = t * 2; JM.gface.position.x = (GLR.minX + GLR.maxX) / 2 + (Math.random() < 0.05 ? (Math.random() - 0.5) * 0.4 : 0); }
    if (!here) return;
    // Time Jumper: rings, core, sparks, glitch flicker
    var boost = st.spinBoost > 0 ? 6 : 1; if (st.spinBoost > 0) st.spinBoost -= dt;
    JM.rings.forEach(function (r) { r.rg.rotation.z += dt * r.k * boost; r.piv.rotation.y += dt * 0.1 * boost; });
    JM.core.rotation.y = t * 0.8; JM.core.rotation.x = t * 0.5; var pul = 1 + Math.sin(t * 3) * 0.08 + (boost > 1 ? 0.3 : 0); JM.core.scale.setScalar(pul); JM.coreIn.rotation.y = -t * 2;
    var gl2 = st.glitch > 0; if (gl2) { st.glitch -= dt; JM.core.material.color.set(Math.random() < 0.5 ? '#fb7185' : '#ff00ff'); JM.seam.color.set(Math.random() < 0.5 ? '#ff00ff' : '#2dd4bf'); JM.panel.rotation.z = Math.sin(t * 40) * 0.15; JM.holoM.position.x = (Math.random() - 0.5) * 0.2; st.coreLight.intensity = Math.random() * 1.6; }
    else { JM.core.material.color.set('#5eead4'); JM.seam.color.set('#2dd4bf'); JM.panel.rotation.z = 0; JM.holoM.position.x = 0; st.coreLight.intensity = 0.9 + Math.sin(t * 3) * 0.15 + (boost > 1 ? 0.8 : 0); }
    JM.holoM.rotation.y = Math.PI + Math.sin(t * 0.6) * 0.25; JM.tip.material.color.set(Math.sin(t * 4) > 0 ? '#5eead4' : '#fb7185');
    JM.levers.forEach(function (lv, i) { lv.rotation.x = -0.4 + (boost > 1 ? Math.sin(t * 12 + i) * 0.3 : 0); });
    if (st.sparks > 0) { st.sparks -= dt; var alive = 0; JM.spd.forEach(function (s, i) { if (s.life > 0) { s.life -= dt; s.v.y -= 9 * dt; s.p.addScaledVector(s.v, dt); if (s.p.y < 0.6) { s.p.y = 0.6; s.v.y *= -0.4; } alive++; dummy.position.copy(s.p); dummy.scale.setScalar(Math.max(0.01, s.life)); } else { dummy.position.set(0, -10, 0); dummy.scale.setScalar(0.01); } dummy.updateMatrix(); JM.sp.setMatrixAt(i, dummy.matrix); }); JM.sp.instanceMatrix.needsUpdate = true; if (!alive && st.sparks <= 0) JM.sp.visible = false; }
    // Lili: hover bob, ring spin, look at you, blink, talk wiggle
    if (LI.g) { LI.hov.position.y = 0.06 + Math.sin(t * 2.2) * 0.04; LI.ring.rotation.z = t * 2; LI.flame.scale.y = 0.8 + Math.random() * 0.4;
      var p = GA.Hub.pose(), wp = LI.g.position, dx = p.x - wp.x, dz = p.z - wp.z, d = Math.hypot(dx, dz), want = d < 9 ? Math.atan2(dx, dz) - LI.g.rotation.y : Math.sin(t * 0.4) * 0.4; want = Math.atan2(Math.sin(want), Math.cos(want)); LI.head.rotation.y += (Math.max(-1, Math.min(1, want)) - LI.head.rotation.y) * Math.min(1, dt * 4);
      LI.arms[0].rotation.x = LI.talk > 0 ? Math.sin(t * 9) * 0.5 - 0.3 : Math.sin(t * 1.3) * 0.08; if (LI.talk > 0) LI.talk -= dt;
      if (LI.moodT > 0) { LI.moodT -= dt; if (LI.moodT <= 0) faceDraw('idle'); } else if (Math.sin(t * 1.7) > 0.995 && LI.mood !== 'blink') { faceDraw('blink'); LI.moodT = 0.15; }
      if (LI.bub.T > 0) { LI.bub.T -= dt; if (LI.bub.T <= 0) LI.bub.s.visible = false; } }
    // server LEDs twinkle (recolour a few instances)
    if (st.leds && (st.leds.t += dt) > 0.25) { st.leds.t = 0; for (var k = 0; k < 12; k++) { var i2 = Math.floor(Math.random() * st.leds.n); st.leds.im.setColorAt(i2, tmpC.set(Math.random() < 0.3 ? '#0b1020' : ['#4ade80', '#5eead4', '#fbbf24', '#fb7185'][i2 % 4])); } st.leds.im.instanceColor.needsUpdate = true; }
    if (PT.on) { PT.cog.rotation.y = t * 2.5; PT.cog.position.y = 0.32 + Math.abs(Math.sin(t * 4)) * 0.12; PT.glow.material.opacity = 0.6 + Math.sin(t * 8) * 0.3; }
    if (st.wipHolo) st.wipHolo.forEach(function (m, i) { m.material.opacity = 0.7 + Math.sin(t * 2 + i) * 0.15; m.position.y = 2.95 + Math.sin(t * 1.3 + i) * 0.03; });
    ANIM.forEach(function (f) { f(t); });
    if (st.path) st.path.opacity = 0.25 + Math.sin(t * 3) * 0.12;
    if (BD.clock && new Date().getMinutes() !== BD.min) drawClock();
    if (PR.onFrame) PR.onFrame(t, dt, area);
  }
})();
