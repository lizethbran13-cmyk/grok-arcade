/* Grok Arcade - MIMI'S TIME LAB (#88). A cozy walk-in lab behind Mimi's Customer Relations desk (door on the north wall).
   Mimi hangs out inside next to her time machines, wall of clocks and retro props. The swirling RETRO CENTRAL portal opens
   /retro-central/ (1995) with your REAL save and tickets; its back button returns here via ../#mimilab.
   Far-away region: x -74..-56, z 126..144. */
(function () {
  'use strict';
  var T = THREE, ML = GA.MimiLab = {}, H, A, add, bx, cy, sp, to, cvs, texPlane, mats = {};
  var B = ML.B = { name: 'mlab', minX: -74, maxX: -56, minZ: 126, maxZ: 144, maxY: 6, H: 4.6, spawn: { x: -58.2, z: 135 } };
  var DOOR = { x: -16.2, z: -12 }, PORTAL = { x: -72.6, z: 135 }, live = false, ANIM = [];
  // coming back from Retro Central (../#mimilab): start inside the lab (the hub restores sessionStorage pos on build)
  try { if (/^#mimilab/.test(location.hash) || /[?&]area=mlab\b/.test(location.search)) { sessionStorage.setItem('grokArcade.pos', JSON.stringify({ x: B.spawn.x - 1.2, z: B.spawn.z, face: -Math.PI / 2, yaw: Math.PI / 2 })); ML.cameBack = true; history.replaceState(null, '', location.pathname); } } catch (e) {}
  function ph(c, s, e) { var k = 'p' + c + (s || 30) + (e || ''); return mats[k] || (mats[k] = new T.MeshPhongMaterial({ color: c, shininess: s || 30, specular: '#555555', emissive: e ? new T.Color(e) : new T.Color(0) })); }
  function gl(c) { var k = 'g' + c; return mats[k] || (mats[k] = new T.MeshBasicMaterial({ color: c })); }
  function brass() { return ph('#d4a23a', 90, '#3a2400'); }
  function chrome() { return ph('#d5dde8', 110, '#14181f'); }
  function R() { return H.R.mlab; }
  function noA(m) { A.noAud(m); return m; }
  function glowSprite(col, s, op) { var g = new T.Sprite(new T.SpriteMaterial({ map: A.glowTex, color: col, transparent: true, opacity: op || 0.5, depthWrite: false, blending: T.AdditiveBlending })); g.scale.set(s, s, 1); A.noAud(g); return g; }
  function lamp(x, y, z, col, i, d) { var L = new T.PointLight(col, i || 0.8, d || 12, 1.4); L.position.set(x, y, z); R().add(L); return L; }
  function sign(par, w, h, draw, x, y, z, ry) { var t = cvs(Math.round(w * 200), Math.round(h * 200), draw); var m = texPlane(w, h, t.tex); m.position.set(x, y, z); m.rotation.y = ry || 0; par.add(m); A.noAud(m); return t; }
  function txt(c, s, x, y, col, px) { c.fillStyle = col; c.font = 'bold ' + px + 'px Trebuchet MS, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); }

  function clock(par, x, y, z, ry, r, face, rim, speed) { // a wall clock with ticking hands
    var g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; par.add(g);
    var f = add(g, cy(r, r, 0.06, 28), ph(face, 40), 0, 0, 0); f.rotation.x = Math.PI / 2; add(g, to(r, r * 0.12, 8, 28), rim === 'brass' ? brass() : ph(rim, 60), 0, 0, 0.02);
    for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2; add(g, bx(r * 0.06, r * 0.16, 0.02), gl('#1f1633'), Math.sin(a) * r * 0.78, Math.cos(a) * r * 0.78, 0.04).rotation.z = -a; }
    var hh = new T.Group(); hh.position.z = 0.05; g.add(hh); add(hh, bx(r * 0.08, r * 0.5, 0.02), gl('#1f1633'), 0, r * 0.22, 0);
    var mh = new T.Group(); mh.position.z = 0.06; g.add(mh); add(mh, bx(r * 0.05, r * 0.75, 0.02), gl('#db2777'), 0, r * 0.35, 0);
    var ph0 = Math.random() * 6; ANIM.push(function (t) { mh.rotation.z = -(t * speed + ph0); hh.rotation.z = -(t * speed / 12 + ph0); });
    g.traverse(function (o) { A.noAud(o); }); return g;
  }
  function crt(par, x, y, z, ry, w, col, label) { var g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry || 0; par.add(g);
    add(g, bx(w, w * 0.8, w * 0.85), ph('#d6cfc0', 25), 0, w * 0.4, 0); add(g, bx(w * 0.6, w * 0.55, w * 0.4), ph('#c7bfae', 25), 0, w * 0.42, -w * 0.5);
    var t = cvs(160, 120, function (c, W, Hh) { var gr = c.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, col); gr.addColorStop(1, '#0b1020'); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); c.fillStyle = 'rgba(255,255,255,.08)'; for (var i = 0; i < Hh; i += 4) c.fillRect(0, i, W, 1); txt(c, label, W / 2, Hh / 2, '#fff', 22); });
    var s = texPlane(w * 0.8, w * 0.6, t.tex); s.position.set(0, w * 0.42, w * 0.43); g.add(s); return g; }

  function mimiModel(par) { // Mimi: round white helper bot with a big screen face, pink cheeks, antenna + Time-Lab goggles
    var g = new T.Group(); par.add(g); var w = ph('#f8fafc', 90), pk = ph('#f472b6', 60), dk = ph('#1e1b4b', 60);
    var base = add(g, sp(0.42, 24), w, 0, 0.55, 0); base.scale.set(1, 1.15, 0.9); add(g, to(0.36, 0.05, 8, 24), pk, 0, 0.3, 0).rotation.x = Math.PI / 2;
    add(g, cy(0.32, 0.4, 0.14, 24), dk, 0, 0.08, 0);
    var head = new T.Group(); head.position.set(0, 1.35, 0); g.add(head); var hd = add(head, sp(0.42, 28), w, 0, 0, 0); hd.scale.set(1.15, 0.95, 1);
    add(head, bx(0.6, 0.38, 0.05), dk, 0, 0, 0.38);
    var face = cvs(192, 128, function (c, W, Hh) { c.fillStyle = '#0b1026'; c.fillRect(0, 0, W, Hh); c.fillStyle = '#5eead4'; c.beginPath(); c.ellipse(60, 56, 16, 22, 0, 0, 7); c.ellipse(132, 56, 16, 22, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(66, 48, 6, 0, 7); c.arc(138, 48, 6, 0, 7); c.fill(); c.strokeStyle = '#5eead4'; c.lineWidth = 7; c.beginPath(); c.arc(96, 84, 18, 0.15, Math.PI - 0.15); c.stroke(); c.fillStyle = 'rgba(244,114,182,.7)'; c.beginPath(); c.arc(30, 92, 12, 0, 7); c.arc(162, 92, 12, 0, 7); c.fill(); });
    var fm = texPlane(0.56, 0.35, face.tex); fm.position.set(0, 0, 0.41); head.add(fm);
    add(head, cy(0.015, 0.015, 0.3, 6), chrome(), 0, 0.5, 0); var bulb = add(head, sp(0.06, 12), gl('#f472b6'), 0, 0.67, 0);
    // time goggles pushed up on her head
    [-1, 1].forEach(function (sd) { var gg = add(head, cy(0.09, 0.09, 0.06, 18), brass(), sd * 0.16, 0.36, 0.2); gg.rotation.x = Math.PI / 2 - 0.5; add(head, cy(0.065, 0.065, 0.07, 18), ph('#67e8f9', 120, '#0e4b5a'), sd * 0.16, 0.37, 0.23).rotation.x = Math.PI / 2 - 0.5; });
    add(head, to(0.44, 0.02, 6, 30), dk, 0, 0.3, 0).rotation.x = Math.PI / 2 - 0.25;
    var arms = []; [-1, 1].forEach(function (sd) { var a = new T.Group(); a.position.set(sd * 0.44, 0.75, 0); g.add(a); add(a, cy(0.06, 0.05, 0.4, 10), w, 0, -0.18, 0); add(a, sp(0.08, 12), pk, 0, -0.4, 0); a.rotation.z = sd * 0.35; arms.push(a); });
    var bub = H.bubble(g, 2.15);
    ANIM.push(function (t) { g.position.y = 0.06 + Math.sin(t * 2.2) * 0.05; head.rotation.y = Math.sin(t * 0.7) * 0.25; arms[1].rotation.z = 0.35 + Math.max(0, Math.sin(t * 1.3)) * 1.2; bulb.material.color.setHSL((t * 0.15) % 1, 0.8, 0.65); });
    return { g: g, bub: bub };
  }

  function build() {
    var r = H.mkRoot('mlab'); GA.Hub.addRegion(B); var cx = (B.minX + B.maxX) / 2, cz = (B.minZ + B.maxZ) / 2, W = B.maxX - B.minX, D = B.maxZ - B.minZ, h = B.H;
    // ---- shell: checkered retro floor, starry ceiling, mint + lilac walls ----
    var ft = cvs(256, 256, function (c) { for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? '#2b1f4a' : '#f3e8ff'; c.fillRect(i * 32, j * 32, 32, 32); } }).tex; ft.wrapS = ft.wrapT = T.RepeatWrapping; ft.repeat.set(W / 4, D / 4);
    var fl = add(r, new T.PlaneGeometry(W, D), new T.MeshLambertMaterial({ map: ft }), cx, 0, cz); fl.rotation.x = -Math.PI / 2; noA(fl);
    var ct = cvs(256, 256, function (c) { c.fillStyle = '#1a1036'; c.fillRect(0, 0, 256, 256); for (var i = 0; i < 70; i++) { c.fillStyle = ['#fff', '#fde68a', '#a5f3fc', '#f9a8d4'][i % 4]; c.fillRect((i * 97) % 256, (i * 53) % 256, 2, 2); } }).tex; ct.wrapS = ct.wrapT = T.RepeatWrapping; ct.repeat.set(3, 3);
    var ce = add(r, new T.PlaneGeometry(W, D), new T.MeshBasicMaterial({ map: ct }), cx, h, cz); ce.rotation.x = Math.PI / 2; noA(ce);
    var wt = cvs(256, 256, function (c) { c.fillStyle = '#ccfbf1'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#99f6e4'; for (var i = 0; i < 256; i += 32) c.fillRect(i, 0, 14, 150); c.fillStyle = '#7c3aed'; c.fillRect(0, 150, 256, 12); c.fillStyle = '#4c1d95'; c.fillRect(0, 162, 256, 94); c.fillStyle = '#f472b6'; c.fillRect(0, 200, 256, 6); for (var k = 0; k < 256; k += 64) { c.fillStyle = '#fde047'; c.beginPath(); c.moveTo(k + 32, 172); c.lineTo(k + 44, 192); c.lineTo(k + 20, 192); c.fill(); } }).tex;
    [[W, cx, B.minZ, 0], [W, cx, B.maxZ, Math.PI], [D, B.minX, cz, Math.PI / 2], [D, B.maxX, cz, -Math.PI / 2]].forEach(function (q, i) { var tt = wt.clone(); tt.needsUpdate = true; tt.wrapS = T.RepeatWrapping; tt.repeat.set(q[0] / 3, 1); var m = add(r, new T.PlaneGeometry(q[0], h), new T.MeshLambertMaterial({ map: tt }), i < 2 ? q[1] : q[1], h / 2, q[2]); m.rotation.y = q[3]; noA(m); });
    var th = 0.4; A.addWall(B.minX - 1, B.maxX + 1, -1, h + 3, B.minZ - th, B.minZ); A.addWall(B.minX - 1, B.maxX + 1, -1, h + 3, B.maxZ, B.maxZ + th); A.addWall(B.minX - th, B.minX, -1, h + 3, B.minZ - 1, B.maxZ + 1); A.addWall(B.maxX, B.maxX + th, -1, h + 3, B.minZ - 1, B.maxZ + 1);
    A.walls.push({ minX: B.minX - 1, maxX: B.maxX + 1, minY: h, maxY: h + 2, minZ: B.minZ - 1, maxZ: B.maxZ + 1 });
    lamp(cx, h - 0.5, cz - 4, '#fdf4ff', 0.9, 16); lamp(cx, h - 0.5, cz + 4, '#fdf4ff', 0.9, 16); lamp(PORTAL.x + 2, 2.2, PORTAL.z, '#22d3ee', 1.2, 10);
    // ceiling ring light + neon trim
    var ring = add(r, to(2.2, 0.06, 8, 48), gl('#f0abfc'), cx, h - 0.1, cz); ring.rotation.x = Math.PI / 2; noA(ring);
    [[B.minZ + 0.05, 0], [B.maxZ - 0.05, Math.PI]].forEach(function (q) { var n = add(r, bx(W - 0.4, 0.05, 0.05), gl('#5eead4'), cx, h - 0.25, q[0]); noA(n); });
    // big sign over the door
    sign(r, 4.4, 0.9, function (c, w2, h2) { c.fillStyle = '#1e1b4b'; c.fillRect(0, 0, w2, h2); c.strokeStyle = '#f472b6'; c.lineWidth = 10; c.strokeRect(6, 6, w2 - 12, h2 - 12); txt(c, '\u23F3 MIMI\u2019S TIME LAB \u23F3', w2 / 2, h2 * 0.42, '#fde68a', 70); txt(c, 'Ratita Industries \u00b7 Customer Relations \u00b7 Temporal Division', w2 / 2, h2 * 0.78, '#5eead4', 30); }, B.maxX - 0.06, 3.7, cz, -Math.PI / 2);

    // ---- exit door (east wall) back to the arcade floor ----
    var ed = H.prop('mlab', 'Lab door', B.maxX - 0.1, cz, -Math.PI / 2); add(ed, bx(1.6, 2.7, 0.12), ph('#7c3aed', 50), 0, 1.35, 0); add(ed, bx(1.3, 2.4, 0.04), ph('#c4b5fd', 50), 0, 1.3, 0.07); add(ed, sp(0.07, 12), brass(), 0.5, 1.2, 0.12);
    var ew = add(ed, cy(0.3, 0.3, 0.04, 24), ph('#fef3c7', 40), 0, 2.1, 0.1); ew.rotation.x = Math.PI / 2; noA(ew);
    H.inter({ id: 'at_mlab_exit', kind: 'at_mlab_exit', root: 'mlab', name: 'Back to the arcade', col: '#5eead4', x: B.maxX - 1.3, z: cz, dir: [-1, 0], r: 1.0 });

    // ---- RETRO CENTRAL portal (west wall) ----
    var pg = H.prop('mlab', 'Retro Central portal', PORTAL.x, PORTAL.z, Math.PI / 2);
    add(pg, cy(1.9, 2.1, 0.22, 40), ph('#312e81', 60), 0, 0.11, 0); var hz = add(pg, to(1.95, 0.05, 6, 48), gl('#facc15'), 0, 0.24, 0); hz.rotation.x = Math.PI / 2;
    var arch = add(pg, to(1.45, 0.2, 14, 48), ph('#ec4899', 90, '#4a0a2a'), 0, 1.85, 0); void arch;
    var arch2 = add(pg, to(1.6, 0.06, 8, 48), gl('#22d3ee'), 0, 1.85, 0.05); void arch2;
    for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2; var bulbm = add(pg, sp(0.07, 10), gl(i % 2 ? '#fde047' : '#a5f3fc'), Math.cos(a) * 1.45, 1.85 + Math.sin(a) * 1.45, 0.18); noA(bulbm); }
    var sw = cvs(256, 256), swm = new T.MeshBasicMaterial({ map: sw.tex, transparent: true }), disc = add(pg, new T.CircleGeometry(1.32, 48), swm, 0, 1.85, 0.02); noA(disc);
    function drawSwirl(t) { var c = sw.g; if (!c && sw.canvas) c = sw.canvas.getContext('2d'); if (!c) return; c.clearRect(0, 0, 256, 256); for (var k = 0; k < 22; k++) { c.strokeStyle = ['#22d3ee', '#ec4899', '#facc15', '#a78bfa'][k % 4]; c.lineWidth = 7; c.beginPath(); c.arc(128, 128, 8 + k * 5.5, t * (1 + k * 0.05) + k, t * (1 + k * 0.05) + k + 2.4); c.stroke(); } var gr = c.createRadialGradient(128, 128, 0, 128, 128, 60); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 256, 256); txt(c, '1995', 128, 132, '#7c3aed', 38); sw.tex.needsUpdate = true; }
    ML._swirlT = 0; ANIM.push(function (t) { if ((ML._swirlT += 1) % 2) return; drawSwirl(t * 1.6); }); drawSwirl(0);
    var pgl = glowSprite('#22d3ee', 5, 0.35); pgl.position.set(0, 1.85, 0.3); pg.add(pgl);
    sign(pg, 3.4, 0.7, function (c, w2, h2) { c.fillStyle = '#0f172a'; c.fillRect(0, 0, w2, h2); c.strokeStyle = '#22d3ee'; c.lineWidth = 8; c.strokeRect(5, 5, w2 - 10, h2 - 10); txt(c, 'RETRO CENTRAL \u00b7 1995', w2 / 2, h2 * 0.42, '#f472b6', 64); txt(c, 'LIVE WORLD \u00b7 your REAL save & tickets', w2 / 2, h2 * 0.78, '#a5f3fc', 30); }, 0, 3.9, 0.05, 0);
    [-1, 1].forEach(function (sd) { var col = add(pg, cy(0.16, 0.2, 3.4, 16), chrome(), sd * 2.15, 1.7, 0); void col; add(pg, sp(0.24, 16), gl(sd < 0 ? '#ec4899' : '#22d3ee'), sd * 2.15, 3.55, 0); for (var q = 0; q < 4; q++) add(pg, to(0.21, 0.035, 6, 18), brass(), sd * 2.15, 0.6 + q * 0.8, 0).rotation.x = Math.PI / 2; });
    // console + ticket booth by the portal
    var kb = H.prop('mlab', 'Portal console', PORTAL.x + 2.4, PORTAL.z - 2.6, Math.PI / 2 + 0.5); add(kb, bx(1.0, 1.0, 0.6), ph('#4c1d95', 40), 0, 0.5, 0); var kt = add(kb, bx(1.05, 0.06, 0.7), ph('#1e1b4b', 40), 0, 1.03, 0.04); kt.rotation.x = 0.35;
    sign(kb, 0.8, 0.45, function (c, w2, h2) { c.fillStyle = '#022c22'; c.fillRect(0, 0, w2, h2); txt(c, 'DEST: 1995', w2 / 2, h2 * 0.32, '#4ade80', 34); txt(c, 'SAVE: REAL \u2713', w2 / 2, h2 * 0.7, '#4ade80', 30); }, 0, 1.12, 0.12, 0).tex; 
    [['#ef4444', -0.3], ['#facc15', 0], ['#22c55e', 0.3]].forEach(function (q) { add(kb, cy(0.06, 0.06, 0.05, 12), gl(q[0]), q[1], 1.08, 0.32); });
    H.solidOf(kb, 0.05);
    H.inter({ id: 'at_mlab_portal', kind: 'at_mlab_portal', root: 'mlab', name: 'Retro Central (1995)', col: '#22d3ee', x: PORTAL.x + 2.0, z: PORTAL.z, dir: [1, 0], r: 1.3, gw: 2.2, gh: 1.8 });
    A.addSolid(PORTAL.x - 0.6, PORTAL.x + 0.6, PORTAL.z - 2.5, PORTAL.z + 2.5, 'Retro Central portal');

    // ---- wall of clocks (north wall) ----
    var cols = [['#fef3c7', 'brass'], ['#fce7f3', '#db2777'], ['#ecfeff', '#0891b2'], ['#f5f3ff', '#7c3aed'], ['#fef9c3', 'brass'], ['#dcfce7', '#16a34a']];
    for (var ci = 0; ci < 14; ci++) { var cc = cols[ci % cols.length]; clock(r, B.minX + 2.2 + ci * 1.0 + (ci % 2) * 0.2, 2.4 + ((ci * 7) % 3) * 0.55, B.minZ + 0.08, 0, 0.22 + ((ci * 5) % 3) * 0.08, cc[0], cc[1], 0.6 + (ci % 4) * 0.7); }
    // grandfather clock
    var gf = H.prop('mlab', 'Grandfather clock', B.minX + 1.0, B.minZ + 0.7, Math.PI / 4); add(gf, bx(0.7, 2.6, 0.45), ph('#7c2d12', 30), 0, 1.3, 0); add(gf, bx(0.5, 1.0, 0.04), ph('#fde68a', 80, '#3a2400'), 0, 0.9, 0.23);
    clock(gf, 0, 2.2, 0.24, 0, 0.24, '#fef3c7', 'brass', 0.8); var pend = new T.Group(); pend.position.set(0, 1.6, 0.26); gf.add(pend); add(pend, bx(0.02, 0.6, 0.02), brass(), 0, -0.3, 0); add(pend, cy(0.09, 0.09, 0.03, 16), brass(), 0, -0.62, 0).rotation.x = Math.PI / 2; ANIM.push(function (t) { pend.rotation.z = Math.sin(t * 2.4) * 0.35; }); H.solidOf(gf, 0.05);

    // ---- time machines ----
    // 1) the Chrono-Pod (glass capsule with spinning rings)
    var pod = H.prop('mlab', 'Chrono-Pod', B.minX + 4.0, B.maxZ - 3.0, Math.PI * 0.85); add(pod, cy(1.1, 1.25, 0.3, 32), ph('#334155', 60), 0, 0.15, 0);
    var glass = add(pod, new T.CylinderGeometry(0.85, 0.85, 2.2, 28, 1, true), new T.MeshPhongMaterial({ color: '#a5f3fc', transparent: true, opacity: 0.3, shininess: 120, side: T.DoubleSide }), 0, 1.4, 0); void glass; add(pod, sp(0.88, 24, 12), ph('#64748b', 80), 0, 2.5, 0).scale.set(1, 0.4, 1);
    var rings = []; for (var ri = 0; ri < 3; ri++) { var rg = add(pod, to(1.0, 0.05, 8, 40), gl(['#f472b6', '#22d3ee', '#facc15'][ri]), 0, 0.7 + ri * 0.7, 0); rings.push(rg); }
    var seat = add(pod, bx(0.6, 0.12, 0.5), ph('#be185d', 30), 0, 0.7, 0); void seat; ANIM.push(function (t) { rings.forEach(function (q, k) { q.rotation.x = Math.PI / 2 + Math.sin(t * (1 + k) + k) * 0.5; q.rotation.y = t * (0.6 + k * 0.4); }); });
    sign(pod, 1.2, 0.3, function (c, w2, h2) { c.fillStyle = '#0f172a'; c.fillRect(0, 0, w2, h2); txt(c, 'CHRONO-POD Mk.II', w2 / 2, h2 / 2, '#5eead4', 34); }, 0, 0.45, 1.2, 0); H.solidOf(pod, 0.05);
    // 2) the Tick-Tock Bicycle (a brass penny-farthing time machine)
    var bk = H.prop('mlab', 'Tick-Tock time bike', B.minX + 9.0, B.maxZ - 1.6, 0); var wh = add(bk, to(0.85, 0.06, 8, 32), brass(), -0.5, 0.88, 0); void wh; var wh2 = add(bk, to(0.35, 0.05, 8, 24), brass(), 0.9, 0.38, 0); void wh2;
    var fr = add(bk, cy(0.04, 0.04, 1.7, 8), chrome(), 0.2, 1.1, 0); fr.rotation.z = 1.0; add(bk, bx(0.4, 0.08, 0.2), ph('#7c2d12', 30), 0.1, 1.75, 0); clock(bk, -0.5, 0.88, 0.08, 0, 0.5, '#fef3c7', 'brass', 2.2);
    var dial = add(bk, cy(0.18, 0.18, 0.1, 16), ph('#22d3ee', 80, '#0e4b5a'), 0.5, 1.4, 0); dial.rotation.x = Math.PI / 2; H.solidOf(bk, 0.05);
    // 3) the Pocket Watch Portal-in-progress (giant watch on a workbench)
    var wb = H.prop('mlab', 'Workbench', B.minX + 14.5, B.maxZ - 1.0, Math.PI); add(wb, bx(3.0, 0.1, 1.0), ph('#a16207', 30), 0, 0.95, 0); [-1.4, 1.4].forEach(function (x) { [-0.4, 0.4].forEach(function (z) { add(wb, bx(0.08, 0.95, 0.08), ph('#713f12', 30), x, 0.47, z); }); });
    var pw = clock(wb, -0.4, 1.55, 0, 0, 0.55, '#fef9c3', 'brass', 3); pw.rotation.x = -0.3; add(wb, to(0.15, 0.04, 8, 16), brass(), -0.4, 2.18, 0);
    [['#ef4444', 0.6], ['#3b82f6', 0.85], ['#22c55e', 1.1]].forEach(function (q) { add(wb, cy(0.07, 0.07, 0.25, 10), ph(q[0], 60), q[1], 1.12, 0.2); });
    add(wb, bx(0.5, 0.05, 0.35), ph('#1e3a8a', 30), 0.9, 1.0, -0.2); sign(wb, 0.45, 0.3, function (c, w2, h2) { c.fillStyle = '#eff6ff'; c.fillRect(0, 0, w2, h2); c.strokeStyle = '#1d4ed8'; c.lineWidth = 2; for (var k = 10; k < w2; k += 14) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k, h2); c.stroke(); } txt(c, 'PLAN B', w2 / 2, h2 / 2, '#1d4ed8', 22); }, 0.9, 1.03, -0.2, 0).tex;
    var tb = add(wb, bx(0.35, 0.22, 0.25), ph('#dc2626', 40), 1.25, 1.11, -0.25); void tb; H.solidOf(wb, 0.05);

    // ---- retro corner: CRTs, consoles, cassettes, lava lamp, beanbags, rug ----
    var rug = add(r, new T.CircleGeometry(2.4, 40), new T.MeshLambertMaterial({ map: cvs(256, 256, function (c) { for (var k = 8; k > 0; k--) { c.fillStyle = ['#f472b6', '#22d3ee', '#facc15', '#a78bfa'][k % 4]; c.beginPath(); c.arc(128, 128, k * 16, 0, 7); c.fill(); } }).tex }), B.maxX - 5.4, 0.02, B.minZ + 4.0); rug.rotation.x = -Math.PI / 2; noA(rug);
    var tv = H.prop('mlab', 'Retro TV stand', B.maxX - 5.4, B.minZ + 1.0, 0); add(tv, bx(2.6, 0.7, 0.7), ph('#78350f', 30), 0, 0.35, 0);
    crt(tv, -0.6, 0.7, 0, 0, 0.9, '#7c3aed', 'PRESS START'); crt(tv, 0.6, 0.7, 0, 0, 0.7, '#0891b2', '1995!');
    [['#9ca3af', -1.0], ['#1f2937', -0.3], ['#e5e7eb', 0.4]].forEach(function (q) { add(tv, bx(0.5, 0.12, 0.35), ph(q[0], 40), q[1], 0.5, 0.36); });
    H.solidOf(tv, 0.05);
    var shelf = H.prop('mlab', 'Cassette shelf', B.maxX - 0.5, B.minZ + 6.5, -Math.PI / 2); add(shelf, bx(2.4, 2.2, 0.4), ph('#7c2d12', 30), 0, 1.1, 0);
    for (var sy = 0; sy < 4; sy++) { add(shelf, bx(2.3, 0.04, 0.38), ph('#451a03', 30), 0, 0.3 + sy * 0.5, 0.02); for (var sx = 0; sx < 12; sx++) add(shelf, bx(0.13, 0.32, 0.3), ph(['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899'][(sx + sy * 2) % 6], 30), -1.05 + sx * 0.19, 0.48 + sy * 0.5, 0.06); }
    H.solidOf(shelf, 0.02);
    [[-1.6, '#ec4899'], [1.4, '#22d3ee']].forEach(function (q) { var bb = H.prop('mlab', 'Beanbag', B.maxX - 5.4 + q[0], B.minZ + 4.4, 0); var s1 = add(bb, sp(0.55, 18), ph(q[1], 20), 0, 0.35, 0); s1.scale.set(1, 0.6, 1); H.solidOf(bb, 0); });
    var lv = H.prop('mlab', 'Lava lamp', B.maxX - 2.0, B.minZ + 1.0, 0); add(lv, cn(0.16, 0.3, 14), chrome(), 0, 0.15, 0); var lg = add(lv, cy(0.1, 0.16, 0.6, 14), new T.MeshPhongMaterial({ color: '#f472b6', transparent: true, opacity: 0.7, emissive: '#7a1640' }), 0, 0.6, 0); void lg;
    var blobs = []; for (var bi = 0; bi < 3; bi++) blobs.push(add(lv, sp(0.06, 10), gl('#fde047'), 0, 0.5, 0)); add(lv, cn(0.1, 0.15, 14), chrome(), 0, 0.98, 0).rotation.x = Math.PI;
    ANIM.push(function (t) { blobs.forEach(function (b, k) { b.position.y = 0.4 + (Math.sin(t * 0.8 + k * 2) * 0.5 + 0.5) * 0.4; }); });
    var arc = H.prop('mlab', 'Mini arcade cabinet', B.maxX - 1.0, B.minZ + 10.5, -Math.PI / 2); add(arc, bx(0.9, 2.0, 0.8), ph('#1e1b4b', 40), 0, 1.0, 0); add(arc, bx(0.92, 0.3, 0.6), ph('#ec4899', 40), 0, 2.05, 0.1);
    crt(arc, 0, 1.15, 0.12, 0, 0.6, '#16a34a', 'SPEED RAT'); add(arc, bx(0.9, 0.1, 0.4), ph('#312e81', 30), 0, 1.05, 0.5); add(arc, cy(0.03, 0.03, 0.18, 8), chrome(), -0.2, 1.17, 0.5); add(arc, sp(0.05, 10), gl('#ef4444'), -0.2, 1.27, 0.5); H.solidOf(arc, 0.05);

    // ---- Mimi's mini desk + Mimi herself ----
    var dk = H.prop('mlab', 'Mimi\u2019s lab desk', cx + 1.0, B.minZ + 5.6, 0); add(dk, bx(2.4, 0.9, 0.8), ph('#f472b6', 40), 0, 0.45, 0); add(dk, bx(2.5, 0.06, 0.9), ph('#fdf2f8', 60), 0, 0.92, 0);
    crt(dk, -0.7, 0.95, -0.1, 0.25, 0.5, '#db2777', 'HI!!'); add(dk, cy(0.12, 0.1, 0.18, 14), ph('#fde68a', 40), 0.5, 1.04, 0.1); clock(dk, 0.95, 1.2, 0, 0, 0.18, '#fef3c7', 'brass', 1.5);
    sign(dk, 1.6, 0.3, function (c, w2, h2) { c.fillStyle = '#fdf2f8'; c.fillRect(0, 0, w2, h2); txt(c, 'TEMPORAL CUSTOMER RELATIONS', w2 / 2, h2 / 2, '#be185d', 26); }, 0, 0.55, 0.41, 0).tex; H.solidOf(dk, 0.05);
    var mm = H.prop('mlab', 'Mimi (Time Lab)', cx + 1.0, B.minZ + 4.3, 0); ML.mimi = mimiModel(mm); A.addSolid(cx + 0.55, cx + 1.45, B.minZ + 3.85, B.minZ + 4.75, 'Mimi (Time Lab)');
    H.inter({ id: 'at_mlab_mimi', kind: 'at_mlab_mimi', root: 'mlab', name: 'Mimi the Bot', col: '#f472b6', x: cx + 1.0, z: B.minZ + 7.4, dir: [0, 1], r: 1.2 });

    // ---- pets cameo: Luna, Pi-rat, Snowie (rats), Candy (dog), Torty (tortoise) on a pet rug ----
    var pr = H.prop('mlab', 'Pet corner', cx - 1.0, B.maxZ - 5.0, 0);
    var prug = add(pr, new T.PlaneGeometry(3.2, 1.6), ph('#fde68a', 10), 0, 0.02, 0); prug.rotation.x = -Math.PI / 2; noA(prug);
    [['#9ca3af', -1.2, 'Luna'], ['#6b7280', -0.6, 'Pi-rat'], ['#f8fafc', 0, 'Snowie']].forEach(function (q) { var rt = new T.Group(); rt.position.set(q[1], 0, 0.2); pr.add(rt); var b1 = add(rt, sp(0.16, 14), ph(q[0], 20), 0, 0.15, 0); b1.scale.set(1, 0.8, 1.4); add(rt, sp(0.1, 12), ph(q[0], 20), 0, 0.22, 0.2); [-1, 1].forEach(function (sd) { add(rt, sp(0.05, 8), ph('#fbcfe8', 20), sd * 0.07, 0.32, 0.18); add(rt, sp(0.018, 6), gl('#111'), sd * 0.04, 0.25, 0.29); }); var tl = add(rt, cy(0.015, 0.006, 0.35, 6), ph('#fbcfe8', 20), 0, 0.1, -0.35); tl.rotation.x = 1.2; ANIM.push(function (t) { rt.rotation.y = Math.sin(t * 1.5 + q[1] * 3) * 0.5; }); });
    var dg = new T.Group(); dg.position.set(0.8, 0, 0.1); pr.add(dg); var db = add(dg, sp(0.22, 14), ph('#fde4cf', 20), 0, 0.28, 0); db.scale.set(0.9, 0.8, 1.4); add(dg, sp(0.16, 14), ph('#fde4cf', 20), 0, 0.48, 0.28); [-1, 1].forEach(function (sd) { add(dg, sp(0.07, 8), ph('#c08457', 20), sd * 0.12, 0.56, 0.24).scale.set(0.6, 1.3, 0.6); add(dg, sp(0.022, 6), gl('#111'), sd * 0.06, 0.5, 0.43); }); add(dg, sp(0.03, 6), gl('#111'), 0, 0.46, 0.45);
    var tt0 = new T.Group(); tt0.position.set(1.35, 0, -0.2); pr.add(tt0); var sh = add(tt0, sp(0.24, 16), ph('#4d7c0f', 30), 0, 0.15, 0); sh.scale.set(1, 0.6, 1.2); add(tt0, sp(0.09, 12), ph('#a3e635', 30), 0, 0.15, 0.3); add(tt0, sp(0.02, 6), gl('#111'), 0.04, 0.18, 0.38);
    sign(pr, 1.4, 0.3, function (c, w2, h2) { c.fillStyle = '#fef3c7'; c.fillRect(0, 0, w2, h2); txt(c, 'RATITA INDUSTRIES \u00b7 TEST PILOTS', w2 / 2, h2 / 2, '#92400e', 24); }, 0, 0.18, -0.8, Math.PI).tex;

    // ---- calendar + "now/then" board + timeline poster ----
    sign(r, 1.6, 1.2, function (c, w2, h2) { c.fillStyle = '#fff'; c.fillRect(0, 0, w2, h2); c.fillStyle = '#dc2626'; c.fillRect(0, 0, w2, 60); txt(c, 'OCTOBER 1995', w2 / 2, 32, '#fff', 34); c.strokeStyle = '#cbd5e1'; for (var k = 0; k < 7; k++) for (var j = 0; j < 4; j++) { c.strokeRect(10 + k * 42, 70 + j * 40, 42, 40); c.fillStyle = '#334155'; c.font = '16px sans-serif'; c.fillText(String(1 + k + j * 7), 22 + k * 42, 86 + j * 40); } c.strokeStyle = '#ec4899'; c.lineWidth = 4; c.beginPath(); c.arc(31 + 3 * 42, 90 + 2 * 40, 18, 0, 7); c.stroke(); }, B.minX + 0.06, 2.2, B.minZ + 4.5, Math.PI / 2);
    sign(r, 3.6, 1.1, function (c, w2, h2) { c.fillStyle = '#1e1b4b'; c.fillRect(0, 0, w2, h2); c.strokeStyle = '#facc15'; c.lineWidth = 6; c.beginPath(); c.moveTo(30, h2 / 2); c.lineTo(w2 - 30, h2 / 2); c.stroke(); [['1983', '#ff4fd8'], ['1995', '#22d3ee'], ['2026', '#4ade80'], ['????', '#a78bfa']].forEach(function (q, k) { var x = 60 + k * (w2 - 120) / 3; c.fillStyle = q[1]; c.beginPath(); c.arc(x, h2 / 2, 16, 0, 7); c.fill(); txt(c, q[0], x, h2 / 2 - 50, q[1], 40); }); txt(c, 'MIMI\u2019S TIMELINE OF FUN', w2 / 2, h2 - 30, '#fde68a', 30); }, B.minX + 0.06, 2.4, B.maxZ - 6.6, Math.PI / 2);
    // potted plants + hourglasses
    [[B.maxX - 1.0, B.maxZ - 1.0], [B.minX + 1.0, cz - 3.4], [B.maxX - 1.0, B.minZ + 14.4]].forEach(function (q, k) { var pt = H.prop('mlab', 'Plant ' + k, q[0], q[1], 0); add(pt, cy(0.28, 0.22, 0.5, 14), ph('#ea580c', 20), 0, 0.25, 0); for (var l = 0; l < 6; l++) { var lf = add(pt, sp(0.18, 10), ph('#16a34a', 20), Math.cos(l) * 0.15, 0.7 + (l % 3) * 0.15, Math.sin(l) * 0.15); lf.scale.set(0.6, 1.5, 0.6); } H.solidOf(pt, 0); });
    [[cx - 3.5, B.minZ + 6.0], [cx + 4.4, B.maxZ - 4.6]].forEach(function (q, k) { var hg = H.prop('mlab', 'Hourglass ' + k, q[0], q[1], 0); add(hg, cy(0.35, 0.35, 0.08, 16), ph('#7c2d12', 30), 0, 0.04, 0); add(hg, cy(0.35, 0.35, 0.08, 16), ph('#7c2d12', 30), 0, 1.36, 0); var top = add(hg, cn(0.28, 0.6, 16), new T.MeshPhongMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.35 }), 0, 1.0, 0); top.rotation.x = Math.PI; add(hg, cn(0.28, 0.6, 16), new T.MeshPhongMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.35 }), 0, 0.38, 0); var sand = add(hg, cn(0.2, 0.3, 14), ph('#facc15', 20), 0, 0.23, 0); void sand; [-1, 1].forEach(function (sd) { add(hg, cy(0.03, 0.03, 1.3, 6), brass(), sd * 0.3, 0.7, 0); }); var sp0 = hg; ANIM.push(function (t) { sp0.rotation.y = t * 0.3; }); H.solidOf(hg, 0.02); });
    // floating clock gears near the ceiling
    for (var gi = 0; gi < 6; gi++) { var gr0 = add(r, to(0.35 + (gi % 3) * 0.12, 0.06, 6, 12), brass(), B.minX + 3 + gi * 2.4, h - 0.8 - (gi % 2) * 0.4, cz + (gi % 2 ? 2.5 : -1.5)); noA(gr0); (function (g, k) { ANIM.push(function (t) { g.rotation.z = t * (k % 2 ? 0.8 : -0.8); g.rotation.x = 0.4; }); })(gr0, gi); }

    // ---- the door on the ARCADE FLOOR (north wall, left of Mimi's desk) ----
    H.mkRoot('mlab_door'); var md = H.prop('mlab_door', 'Mimi\u2019s Time Lab door', DOOR.x, DOOR.z + 0.08, 0);
    add(md, bx(1.7, 2.9, 0.14), ph('#7c3aed', 50), 0, 1.45, 0); add(md, bx(1.3, 2.5, 0.05), ph('#f0abfc', 50, '#3b0a3a'), 0, 1.3, 0.08); add(md, sp(0.07, 12), brass(), 0.48, 1.2, 0.14);
    clock(md, 0, 2.2, 0.12, 0, 0.3, '#fef3c7', 'brass', 1.2);
    sign(md, 1.9, 0.42, function (c, w2, h2) { c.fillStyle = '#1e1b4b'; c.fillRect(0, 0, w2, h2); c.strokeStyle = '#f472b6'; c.lineWidth = 6; c.strokeRect(4, 4, w2 - 8, h2 - 8); txt(c, '\u23F3 MIMI\u2019S TIME LAB', w2 / 2, h2 / 2 + 2, '#fde68a', 46); }, 0, 3.15, 0.1, 0);
    var dgl = glowSprite('#f472b6', 2.4, 0.25); dgl.position.set(0, 1.4, 0.3); md.add(dgl);
    H.inter({ id: 'at_mlab_door', kind: 'at_mlab_door', root: 'mlab_door', name: 'Mimi\u2019s Time Lab', col: '#f472b6', x: DOOR.x, z: DOOR.z + 1.3, dir: [0, 1], r: 1.0 });

    r.visible = false;
    var ct0 = GA.Hub.camTune; GA.Hub.camTune = function (a) { return a === 'mlab' ? { pitch: 0.44, dist: 5.6, ahead: 2.2, fov: 8 } : (ct0 ? ct0(a) : null); };
    if (GA.Areas) { if (GA.Areas.FOGS) GA.Areas.FOGS.mlab = ['#2a1b4a', 18, 46]; if (GA.Areas.ARRIVE) { var go = GA.Areas.goTo; GA.Areas.ARRIVE.mlab = function () { go(B.spawn.x, B.spawn.z, -1, 0); }; GA.Areas.ARRIVE.mlab_out = function () { go(DOOR.x, DOOR.z + 1.6, 0, 1); }; } }
    if (GA.Mimi) { var h0 = GA.Mimi.handles, p0 = GA.Mimi.prompt, o0 = GA.Mimi.open; GA.Mimi.handles = function (k) { return /^at_mlab_/.test(k) || h0(k); }; GA.Mimi.prompt = function (cab) { return /^at_mlab_/.test(cab.kind) ? prompt(cab) : p0.apply(this, arguments); }; GA.Mimi.open = function (cab) { return /^at_mlab_/.test(cab.kind) ? open(cab) : o0.apply(this, arguments); };
      if (GA.Mimi.DEST && !GA.Mimi.DEST.some(function (d) { return d[2] === 'at_mlab_door'; })) GA.Mimi.DEST.push(['\u23F3', 'Mimi\u2019s Time Lab', 'at_mlab_door']); }
    if (GA.AtticUI) { var m0 = GA.AtticUI.map; GA.AtticUI.map = function (a) { return a === 'mlab' ? { minX: B.minX - 1, maxX: B.maxX + 1, minZ: B.minZ - 1, maxZ: B.maxZ + 1, rooms: [['MIMI\u2019S TIME LAB', B.minX, B.maxX, B.minZ, B.maxZ, '#f472b6']], marks: function () { return [['\uD83C\uDF00', PORTAL.x + 1, PORTAL.z], ['\uD83E\uDD16', cx + 1, B.minZ + 4.3], ['\uD83D\uDEAA', B.maxX - 0.6, cz]]; } } : (m0 ? m0(a) : null); }; }
    ML.built = true;
  }
  var LINES = ['Welcome to my TIME LAB! Lily has a lab, so I made one too! Mine has MORE clocks!', 'That swirly portal goes to RETRO CENTRAL, 1995! Your real tickets work there!', 'Every clock in here shows a different time! It\u2019s fine! It\u2019s FINE!', 'Luna, Pi-rat and Snowie are my test pilots! Candy and Torty are moral support!', 'The Tick-Tock Bike doesn\u2019t work yet. It DOES go very fast backwards.'];
  function prompt(cab) { var k = cab.kind;
    if (k === 'at_mlab_door') return { tag: 'CUSTOMER RELATIONS \u00b7 TEMPORAL DIVISION', name: 'Mimi\u2019s Time Lab', desc: 'Mimi\u2019s cozy lab full of clocks, time machines and the portal to Retro Central (1995).', btn: 'ENTER', key: 'enter', cls: 'npc' };
    if (k === 'at_mlab_exit') return { tag: 'MIMI\u2019S TIME LAB', name: 'Back to the arcade', desc: 'Out to Mimi\u2019s desk on the arcade floor.', btn: 'EXIT', key: 'exit', cls: 'npc' };
    if (k === 'at_mlab_portal') return { tag: 'LIVE WORLD \u00b7 REAL SAVE', name: 'Retro Central (1995)', desc: 'Walk the neon 90s mall, buy consoles with your real tickets and play them at your Retro Home!', btn: 'TIME TRAVEL', key: 'go', cls: 'npc' };
    return { tag: 'MIMI\u2019S TIME LAB', name: 'Mimi the Bot', desc: 'Mimi, on her temporal break. She has goggles now.', btn: 'TALK', key: 'talk', cls: 'npc' };
  }
  function toast(s, ms) { if (GA.Fix && GA.Fix.toast) GA.Fix.toast(s, ms || 3200); }
  ML.goPortal = function () { if (GA.Audio) GA.Audio.play('launch'); toast('\uD83D\uDD70\uFE0F Time traveling to Retro Central (1995)!', 2400); if (GA.Prog) GA.Prog.event('mlabPortal'); GA.Hub.savePos(); var f = document.getElementById('fade'); if (f) f.classList.add('on'); setTimeout(function () { ML._nav('retro-central/'); }, 380); setTimeout(function () { if (f) f.classList.remove('on'); }, 4000); };
  ML._nav = function (u) { location.href = u; };
  function open(cab) { var k = cab.kind;
    if (k === 'at_mlab_door') return GA.Areas.travel('mlab');
    if (k === 'at_mlab_exit') return GA.Areas.travel('mlab_out');
    if (k === 'at_mlab_portal') return ML.goPortal();
    var line = LINES[(ML._li = ((ML._li || 0) + 1)) % LINES.length]; if (ML.mimi && ML.mimi.bub) ML.mimi.bub.say(line, 5); if (GA.Audio) GA.Audio.play('click');
  }
  ML.build = function () { if (ML.built || !GA.Attic || !GA.Attic.H) return; H = GA.Attic.H(); A = H.A; add = H.add; bx = H.bx; cy = H.cy; sp = H.sp; to = H.to; cvs = H.cvs; texPlane = H.texPlane; build(); };
  ML.frame = function (t, dt) { if (!ML.built) return; var on = GA.Hub.area() === 'mlab'; if (on !== live) { live = on; H.R.mlab.visible = on; if (on && ML.mimi && ML.mimi.bub && !ML._hi) { ML._hi = 1; ML.mimi.bub.say(ML.cameBack ? 'Welcome back from 1995! Did you bring me a souvenir?!' : LINES[0], 5); } } if (on) { ANIM.forEach(function (f) { f(t, dt); }); if (ML.mimi && ML.mimi.bub) ML.mimi.bub.tick(dt); } };
  var cn = function (a, b, c) { return H.cn(a, b, c); };
})();
