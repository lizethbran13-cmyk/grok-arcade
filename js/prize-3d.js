/* Grok Arcade - real 3D prize models + achievement medals (three.js primitives, toy/plush style).
   GA.Prize3D.build(id) -> THREE.Group about 1 unit tall, standing on y=0, facing +z.
   GA.Prize3D.medal(achId) -> a 3D medal with ribbon. group.userData.tick(t) animates (propellers, bobbleheads...). */
(function () {
  'use strict';
  var T = THREE;
  var mats = {}, geos = {};
  function lam(c) { return mats['l' + c] || (mats['l' + c] = new T.MeshLambertMaterial({ color: c })); }
  function shiny(c, s) { var k = 'p' + c + (s || 60); return mats[k] || (mats[k] = new T.MeshPhongMaterial({ color: c, shininess: s || 60, specular: '#ffffff' })); }
  function metal(c) { var k = 'm' + c; return mats[k] || (mats[k] = new T.MeshPhongMaterial({ color: c, shininess: 110, specular: '#fff6d0', emissive: new T.Color(c).multiplyScalar(0.12) })); }
  function glow(c) { return mats['g' + c] || (mats['g' + c] = new T.MeshBasicMaterial({ color: c })); }
  function G(k, f) { return geos[k] || (geos[k] = f()); }
  function sph(r, s) { s = s || 20; return G('s' + r + ',' + s, function () { return new T.SphereGeometry(r, s, Math.max(8, Math.round(s * 0.7))); }); }
  function box(w, h, d) { return G('b' + w + ',' + h + ',' + d, function () { return new T.BoxGeometry(w, h, d); }); }
  function cyl(a, b, h, s) { return G('c' + a + ',' + b + ',' + h + ',' + (s || 20), function () { return new T.CylinderGeometry(a, b, h, s || 20); }); }
  function cone(r, h, s) { return G('k' + r + ',' + h + ',' + (s || 14), function () { return new T.ConeGeometry(r, h, s || 14); }); }
  function tor(r, t, arc, rs, ts) { return G('t' + r + ',' + t + ',' + (arc || 7) + ',' + (rs || 10) + ',' + (ts || 28), function () { return new T.TorusGeometry(r, t, rs || 10, ts || 28, arc || Math.PI * 2); }); }
  function add(par, geo, mat, x, y, z, sx, sy, sz) {
    var m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0);
    if (sx != null) m.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz);
    par.add(m); return m;
  }
  function rot(m, x, y, z) { m.rotation.set(x || 0, y || 0, z || 0); return m; }
  function grp(par, x, y, z) { var g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); if (par) par.add(g); return g; }
  function texOf(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.anisotropy = 4; return t; }

  /* ---------- shared plush bits ---------- */
  function eyes(par, y, z, sep, r, col, skip) {
    [-1, 1].forEach(function (sd) {
      if (skip === sd) return;
      add(par, sph(r, 14), shiny(col || '#16101f', 90), sd * sep, y, z, 1, 1.15, 0.6);
      add(par, sph(r * 0.36, 8), glow('#ffffff'), sd * sep - r * 0.3, y + r * 0.35, z + r * 0.5);
    });
  }
  function closedEye(par, x, y, z, r) { var m = add(par, tor(r, r * 0.22, Math.PI, 6, 14), lam('#4a2a3a'), x, y, z); rot(m, 0, 0, Math.PI); return m; }
  function blush(par, y, z, sep) { [-1, 1].forEach(function (sd) { add(par, sph(0.05, 10), lam('#ff8fb4'), sd * sep, y, z, 1, 0.6, 0.3); }); }
  function smile(par, y, z, r) { var m = add(par, tor(r || 0.05, 0.012, Math.PI * 0.8, 6, 14), lam('#5a2033'), 0, y, z); rot(m, 0, 0, Math.PI + Math.PI * 0.1); return m; }
  function tag(par, x, y, z) { // little pink heart sewn-on tag = it's a plush!
    var t = add(par, box(0.08, 0.1, 0.012), lam('#ffffff'), x, y, z); var h = new T.Shape(); h.moveTo(0, -0.022); h.bezierCurveTo(-0.04, 0.01, -0.02, 0.035, 0, 0.015); h.bezierCurveTo(0.02, 0.035, 0.04, 0.01, 0, -0.022);
    add(t, G('heart', function () { return new T.ShapeGeometry(h); }), glow('#ff4fd8'), 0, 0, 0.008); return t;
  }

  /* ---------- Grok Brawl fighter plushies ---------- */
  var FIGHTERS = {
    blaze: { body: '#ff4a2e', acc: '#ffb020', skin: '#ffcfa6' }, volt: { body: '#2b2f7a', acc: '#ffd400', skin: '#ffe0bd' },
    boulder: { body: '#4fbf5a', acc: '#a8a29e', skin: '#9a958c' }, nova: { body: '#a259ff', acc: '#ff6be6', skin: '#ffd9c2' },
    frost: { body: '#3fd8ff', acc: '#e8fbff', skin: '#ffe6d6' }, sakura: { body: '#ffffff', acc: '#ff5fb0', skin: '#ffe0cc' },
    prime: { body: '#262640', acc: '#ffc531', skin: '#ffd9a8' }
  };
  function fighter(id) {
    var F = FIGHTERS[id], g = new T.Group(), b = lam(F.body);
    add(g, sph(0.13, 14), lam(new T.Color(F.body).multiplyScalar(0.8).getStyle()), -0.13, 0.07, 0.03, 1, 0.7, 1.2);
    add(g, sph(0.13, 14), lam(new T.Color(F.body).multiplyScalar(0.8).getStyle()), 0.13, 0.07, 0.03, 1, 0.7, 1.2);
    add(g, sph(0.27, 22), b, 0, 0.3, 0, 1, 0.92, 0.9);
    var belt = add(g, cyl(0.262, 0.262, 0.06, 24), lam(F.acc), 0, 0.3, 0, 1, 1, 0.9);
    [-1, 1].forEach(function (sd) { var a = add(g, sph(0.09, 12), b, sd * 0.29, 0.34, 0.02, 1, 1.5, 1); rot(a, 0, 0, sd * 0.5); add(g, sph(0.075, 12), lam(F.skin === '#9a958c' ? '#9a958c' : F.skin), sd * 0.35, 0.22, 0.04); });
    if (id === 'volt') { var bs = new T.Shape(); bs.moveTo(0.02, 0.09); bs.lineTo(-0.05, -0.01); bs.lineTo(0, -0.01); bs.lineTo(-0.03, -0.1); bs.lineTo(0.06, 0.02); bs.lineTo(0.01, 0.02); bs.closePath(); add(g, G('bolt', function () { return new T.ExtrudeGeometry(bs, { depth: 0.02, bevelEnabled: false }); }), glow('#ffd400'), 0, 0.2, 0.22); }
    if (id === 'nova' || id === 'prime') add(g, starGeo(0.07, 0.03, 0.02), glow(F.acc), 0, 0.19, 0.23);
    if (id === 'sakura') flower(g, 0, 0.19, 0.235, 0.05, '#ff5fb0');
    if (id === 'prime') { var cape = add(g, cyl(0.3, 0.36, 0.5, 20, 1, true), lam('#7a1030'), 0, 0.33, -0.04); cape.material = new T.MeshLambertMaterial({ color: '#8a1236', side: T.DoubleSide }); cape.geometry = new T.CylinderGeometry(0.29, 0.36, 0.52, 20, 1, true, Math.PI * 0.6, Math.PI * 0.8); }
    // head
    var h = grp(g, 0, 0.74, 0);
    add(h, sph(0.27, 24), lam(F.skin), 0, 0, 0, 1, 0.95, 0.95);
    if (id === 'boulder') { [[-0.16, 0.12, 0.16, 0.07], [0.14, 0.16, 0.14, 0.06], [0.05, -0.13, 0.2, 0.05], [-0.2, -0.02, 0.06, 0.05]].forEach(function (q) { add(h, G('rock' + q[3], function () { return new T.DodecahedronGeometry(q[3]); }), lam('#6f6a62'), q[0], q[1], q[2]); }); add(h, sph(0.16, 14), lam('#4fbf5a'), 0, 0.2, -0.02, 1.2, 0.45, 1.2); }
    if (id === 'blaze') { add(h, cyl(0.272, 0.272, 0.06, 26), lam('#d61f1f'), 0, 0.08, 0, 1, 1, 0.95); [[-0.14, 0.27, 0.0, 0.08, 0.2], [0, 0.32, 0, 0.1, 0.26], [0.14, 0.27, 0, 0.08, 0.2], [-0.07, 0.3, -0.12, 0.08, 0.2], [0.08, 0.29, -0.13, 0.08, 0.2]].forEach(function (q) { add(h, cone(q[3], q[4], 10), lam('#ff7a1a'), q[0], q[1], q[2]); add(h, cone(q[3] * 0.5, q[4] * 0.6, 8), glow('#ffd23b'), q[0], q[1] - 0.03, q[2] + 0.04); }); }
    if (id === 'volt') { for (var i = 0; i < 7; i++) { var a = -1.2 + i * 0.4, sp = add(h, cone(0.06, 0.22, 8), lam('#ffd400'), Math.sin(a) * 0.17, 0.24 - Math.abs(a) * 0.04, Math.cos(a) * 0.02 - 0.05); rot(sp, -0.3, 0, -a * 0.8); } add(h, sph(0.26, 18, 0), lam('#ffd400'), 0, 0.06, -0.04, 1.02, 0.75, 1); }
    if (id === 'nova') { var hood = add(h, sph(0.29, 22), lam('#a259ff'), 0, 0.02, -0.03); hood.geometry = new T.SphereGeometry(0.29, 22, 16, Math.PI * 1.15, Math.PI * 1.7); hood.material = new T.MeshLambertMaterial({ color: '#a259ff', side: T.DoubleSide }); hood.rotation.y = Math.PI / 2 + Math.PI; add(h, cyl(0.29, 0.29, 0.04, 26), lam('#ff6be6'), 0, 0.12, 0); var tail = add(h, cone(0.05, 0.22, 8), lam('#ff6be6'), 0.22, 0.1, -0.2); rot(tail, 0, 0, -1.2); }
    if (id === 'frost') { var hel = add(h, sph(0.29, 22), shiny('#bff4ff', 120), 0, 0.02, 0); hel.geometry = new T.SphereGeometry(0.29, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.45); add(h, cone(0.06, 0.24, 8), shiny('#e8fbff', 120), 0, 0.36, 0); add(h, box(0.06, 0.04, 0.05), shiny('#3fb6e0'), 0, 0.12, 0.27); }
    if (id === 'sakura') { var hair = add(h, sph(0.285, 22), lam('#ff5fb0'), 0, 0.03, -0.02); hair.geometry = new T.SphereGeometry(0.285, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.5); hair.rotation.x = -0.35; add(h, sph(0.1, 14), lam('#ff5fb0'), -0.21, 0.2, -0.04); add(h, sph(0.1, 14), lam('#ff5fb0'), 0.21, 0.2, -0.04); flower(h, 0.21, 0.22, 0.07, 0.04, '#ffffff'); }
    if (id === 'prime') { var cr = grp(h, 0, 0.26, 0); add(cr, cyl(0.15, 0.15, 0.08, 18, 1, true), metal('#ffc531'), 0, 0, 0).material = new T.MeshPhongMaterial({ color: '#ffc531', shininess: 110, specular: '#fff6d0', side: T.DoubleSide }); for (var k = 0; k < 5; k++) { var aa = k / 5 * Math.PI * 2; add(cr, cone(0.04, 0.1, 6), metal('#ffc531'), Math.sin(aa) * 0.14, 0.08, Math.cos(aa) * 0.14); } add(cr, sph(0.03, 8), glow('#ff3d6e'), 0, 0.01, 0.155); }
    var fz = 0.25;
    if (id === 'prime') { [-1, 1].forEach(function (sd) { add(h, sph(0.045, 10), glow('#ffc531'), sd * 0.1, 0.0, fz, 1.2, 0.8, 0.5); }); }
    else eyes(h, 0.0, fz, 0.1, 0.042);
    blush(h, -0.07, 0.235, 0.16); smile(h, -0.07, 0.262, 0.045);
    tag(g, 0.2, 0.2, -0.18);
    return g;
  }
  function starGeo(r, ri, d) { return G('star' + r + ri + d, function () { var s = new T.Shape(); for (var i = 0; i < 10; i++) { var a = Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? ri : r; if (i) s.lineTo(Math.cos(a) * q, Math.sin(a) * q); else s.moveTo(Math.cos(a) * q, Math.sin(a) * q); } s.closePath(); return new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); }); }
  function flower(par, x, y, z, r, col) { for (var i = 0; i < 5; i++) { var a = i / 5 * Math.PI * 2; add(par, sph(r * 0.55, 8), lam(col), x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, z, 1, 1, 0.4); } add(par, sph(r * 0.35, 8), glow('#ffd23b'), x, y, z + 0.01, 1, 1, 0.5); }

  /* ---------- Grok Invaders alien plush (puffy voxels) ---------- */
  function invader() {
    var P = ['..X.....X..', '...X...X...', '..XXXXXXX..', '.XX.XXX.XX.', 'XXXXXXXXXXX', 'X.XXXXXXX.X', 'X.X.....X.X', '...XX.XX...'];
    var g = new T.Group(), s = 0.09, ox = -5 * s, top = 0.95, m = lam('#4ade80'), m2 = lam('#22c55e');
    for (var y = 0; y < 8; y++) for (var x = 0; x < 11; x++) if (P[y][x] === 'X') {
      var b = add(g, box(s * 1.04, s * 1.04, 0.22), (x + y) % 2 ? m : m2, ox + x * s, top - y * s, 0);
      add(g, sph(s * 0.62, 10), (x + y) % 2 ? m : m2, ox + x * s, top - y * s, 0.1, 1, 1, 0.5); // puffy front
      void b;
    }
    [3, 7].forEach(function (ex) { var x0 = ox + ex * s, y0 = top - 3 * s; add(g, sph(0.06, 14), glow('#ffffff'), x0, y0, 0.14, 1, 1, 0.5); add(g, sph(0.032, 10), shiny('#16101f', 90), x0 + 0.01, y0 - 0.008, 0.17); add(g, sph(0.01, 6), glow('#ffffff'), x0, y0 + 0.012, 0.19); });
    blush(g, top - 5 * s, 0.155, 0.27);
    smile(g, top - 4.6 * s, 0.165, 0.05);
    tag(g, 0.32, top - 6.5 * s, 0.12);
    g.position.y = -0.18; var w = new T.Group(); w.add(g); return w;
  }

  /* ---------- the rats: Luna, Pi-rat (one eye), Snowie ---------- */
  var RATS = { luna: { fur: '#a7adbb', dark: '#7d8394', belly: '#e6e8ee', eye: '#1b1b24' }, pirat: { fur: '#c99a6b', dark: '#9c7148', belly: '#f6e7d4', eye: '#1b1b24' }, snowie: { fur: '#fbfbff', dark: '#e3e1ee', belly: '#ffffff', eye: '#d0315a' } };
  function rat(type) {
    var R = RATS[type], g = new T.Group(), fur = lam(R.fur), pink = lam('#ffb3c8');
    add(g, sph(0.3, 22), fur, 0, 0.3, -0.04, 1, 0.95, 1.15);
    add(g, sph(0.2, 18), lam(R.belly), 0, 0.27, 0.13, 1, 1.05, 0.6);
    [-1, 1].forEach(function (sd) { add(g, sph(0.08, 10), pink, sd * 0.16, 0.04, 0.18, 1, 0.55, 1.3); add(g, sph(0.06, 10), pink, sd * 0.13, 0.33, 0.27, 1, 1.2, 0.8); });
    // tail
    var curve = new T.CatmullRomCurve3([new T.Vector3(0, 0.12, -0.36), new T.Vector3(0.12, 0.05, -0.55), new T.Vector3(0.32, 0.06, -0.5), new T.Vector3(0.4, 0.2, -0.3), new T.Vector3(0.34, 0.34, -0.2)]);
    add(g, G('tail', function () { return new T.TubeGeometry(curve, 28, 0.03, 8, false); }), pink);
    var h = grp(g, 0, 0.68, 0.06);
    add(h, sph(0.24, 22), fur, 0, 0, 0, 1.05, 0.95, 1);
    add(h, sph(0.13, 16), lam(R.belly), 0, -0.07, 0.17, 1.1, 0.85, 0.9);
    add(h, sph(0.045, 12), shiny('#ff7fa6', 80), 0, -0.02, 0.29);
    [-1, 1].forEach(function (sd) {
      var e = grp(h, sd * 0.19, 0.2, -0.02); e.rotation.z = -sd * 0.35;
      add(e, cyl(0.13, 0.13, 0.04, 22), lam(R.dark), 0, 0, 0).rotation.x = Math.PI / 2;
      add(e, cyl(0.085, 0.085, 0.045, 20), pink, 0, 0, 0.004).rotation.x = Math.PI / 2;
      for (var i = -1; i <= 1; i++) { var w = add(h, cyl(0.004, 0.004, 0.22, 4), lam('#5a4a5a'), sd * 0.18, -0.06 + i * 0.022, 0.2); rot(w, 0, 0, Math.PI / 2 + sd * i * 0.18); }
    });
    if (type === 'pirat') { eyes(h, 0.05, 0.2, 0.09, 0.05, R.eye, 1); closedEye(h, 0.09, 0.07, 0.215, 0.04); }
    else eyes(h, 0.05, 0.2, 0.09, 0.05, R.eye);
    blush(h, -0.05, 0.2, 0.15);
    // a bow so they look like gifts
    var bow = grp(g, 0, 0.5, 0.2); add(bow, cone(0.06, 0.1, 10), glow('#ff4fd8'), -0.05, 0, 0).rotation.z = Math.PI / 2; add(bow, cone(0.06, 0.1, 10), glow('#ff4fd8'), 0.05, 0, 0).rotation.z = -Math.PI / 2; add(bow, sph(0.03, 8), glow('#ff4fd8'));
    tag(g, 0.22, 0.24, -0.25);
    return g;
  }

  /* ---------- Candy the miniature schnauzer ---------- */
  function candy() {
    var g = new T.Group(), gray = lam('#7b8088'), light = lam('#a3a8b0'), dark = lam('#5d6168'), white = lam('#eceef2');
    var bodyG = grp(g, 0, 0, -0.05);
    add(bodyG, sph(0.22, 20), gray, 0, 0.42, 0, 1, 0.85, 1.55);
    add(bodyG, sph(0.15, 14), light, 0, 0.34, 0.05, 1, 0.7, 1.6);
    [[-0.12, 0.2], [0.12, 0.2], [-0.12, -0.18], [0.12, -0.18]].forEach(function (q) { add(bodyG, cyl(0.06, 0.055, 0.3, 12), dark, q[0], 0.17, q[1]); add(bodyG, sph(0.065, 10), white, q[0], 0.04, q[1] + 0.02, 1, 0.7, 1.2); add(bodyG, cyl(0.064, 0.064, 0.08, 12), white, q[0], 0.09, q[1]); });
    var tl = add(bodyG, cyl(0.03, 0.04, 0.18, 8), dark, 0, 0.6, -0.33); rot(tl, -0.5, 0, 0);
    var h = grp(g, 0, 0.72, 0.28);
    add(h, sph(0.17, 18), gray, 0, 0, 0, 1, 1, 1);
    add(h, box(0.2, 0.15, 0.22), light, 0, -0.06, 0.15);
    add(h, sph(0.11, 14), white, 0, -0.15, 0.17, 1.05, 1.2, 1.1); // the beard!
    add(h, sph(0.08, 12), white, -0.05, -0.2, 0.2, 0.8, 1.2, 0.8); add(h, sph(0.08, 12), white, 0.05, -0.2, 0.2, 0.8, 1.2, 0.8);
    add(h, sph(0.04, 10), shiny('#111111', 120), 0, -0.02, 0.27, 1.2, 0.9, 1);
    [-1, 1].forEach(function (sd) { add(h, box(0.09, 0.03, 0.05), white, sd * 0.07, 0.08, 0.13).rotation.z = sd * -0.25; var ear = add(h, cone(0.07, 0.14, 4), dark, sd * 0.13, 0.11, -0.02); rot(ear, 0.4, 0, sd * 2.6); });
    eyes(h, 0.04, 0.14, 0.065, 0.035);
    add(g, tor(0.115, 0.022, 7, 8, 24), lam('#ff7ab6'), 0, 0.58, 0.2).rotation.x = Math.PI / 2 + 0.6;
    add(g, cyl(0.035, 0.035, 0.012, 14), metal('#ffd23b'), 0, 0.52, 0.31).rotation.x = Math.PI / 2 - 0.4;
    tag(g, 0.18, 0.4, -0.2);
    return g;
  }

  /* ---------- Grok Dash heroes (Rayman-style floating hands & feet) ---------- */
  var DASHC = { grok: ['#7c4dff', '#ffd23f'], speedy: ['#ff3b3b', '#ffe14d'], floaty: ['#ff6bd6', '#7df9ff'] };
  function dashHero(kind) {
    var C = DASHC[kind], g = new T.Group(), B = lam(C[0]), A = lam(C[1]), W = lam('#ffffff');
    var feet = [-1, 1].map(function (sd) { return add(g, sph(0.1, 14), A, sd * 0.15, 0.06, 0.06, 1.15, 0.7, 1.6); });
    add(g, sph(0.27, 24), B, 0, 0.43, 0);
    add(g, sph(0.17, 16), lam(new T.Color(C[0]).lerp(new T.Color('#ffffff'), 0.55).getStyle()), 0, 0.36, 0.15, 1, 0.95, 0.6);
    var hands = [-1, 1].map(function (sd) { return add(g, sph(0.085, 14), W, sd * 0.41, 0.42, 0.06); });
    [-1, 1].forEach(function (sd) { add(g, sph(0.075, 14), W, sd * 0.09, 0.51, 0.215, 0.9, 1.25, 0.6); });
    eyes(g, 0.5, 0.262, 0.09, 0.038); smile(g, 0.4, 0.262, 0.05); blush(g, 0.42, 0.24, 0.16);
    if (kind === 'grok') {
      [[-0.05, -0.35], [0.03, 0.1], [0.1, 0.5]].forEach(function (q) { var c = add(g, cone(0.05, 0.2, 10), A, q[0], 0.74, 0.02); rot(c, 0, 0, q[1] * 0.6); });
      var sc = add(g, tor(0.2, 0.05, 7, 10, 28), A, 0, 0.27, 0.02); sc.rotation.x = Math.PI / 2 - 0.15; add(g, box(0.08, 0.18, 0.04), A, 0.12, 0.2, 0.2).rotation.z = 0.3;
    }
    if (kind === 'speedy') {
      [[0, 0.62, 0.5], [0.14, 0.5, 0.9], [-0.14, 0.5, 0.9]].forEach(function (q) { var c = add(g, cone(0.08, 0.3, 10), lam(new T.Color(C[0]).multiplyScalar(0.75).getStyle()), q[0], q[1], -0.24); rot(c, -q[2] - 0.6, 0, -q[0] * 2); });
      var hb = add(g, tor(0.262, 0.03, 7, 8, 32), A, 0, 0.56, 0); hb.rotation.x = Math.PI / 2;
    }
    var ears = null;
    if (kind === 'floaty') {
      ears = grp(g, 0, 0.7, 0); add(ears, cyl(0.025, 0.025, 0.08, 8), A, 0, 0, 0);
      [-1, 1].forEach(function (sd) { var e = add(ears, sph(0.07, 12), A, sd * 0.17, 0.05, 0, 2.4, 0.35, 0.8); rot(e, 0, 0, sd * 0.15); });
    }
    tag(g, 0.2, 0.3, -0.22);
    g.userData.tick = function (t) { hands.forEach(function (h, i) { h.position.y = 0.42 + Math.sin(t * 2.4 + i * 1.6) * 0.03; }); if (ears) ears.rotation.y = t * 4; };
    return g;
  }
  function brutus() {
    var g = new T.Group(), tan = lam('#d6a66a'), cream = lam('#fff4e6'), dk = lam('#a8773f');
    add(g, sph(0.28, 20), tan, 0, 0.34, -0.05, 1.15, 0.8, 1.2);
    add(g, sph(0.18, 16), cream, 0, 0.3, 0.12, 1, 0.8, 0.9);
    [[-0.17, 0.17], [0.17, 0.17], [-0.17, -0.22], [0.17, -0.22]].forEach(function (q) { add(g, cyl(0.07, 0.07, 0.2, 12), tan, q[0], 0.1, q[1]); add(g, sph(0.075, 10), cream, q[0], 0.02, q[1] + 0.03, 1, 0.6, 1.2); });
    var h = grp(g, 0, 0.62, 0.2);
    add(h, sph(0.22, 20), tan, 0, 0, 0, 1.15, 0.95, 1);
    add(h, sph(0.13, 14), cream, 0, -0.08, 0.15, 1.3, 0.85, 0.8);
    [-1, 1].forEach(function (sd) { add(h, sph(0.08, 12), cream, sd * 0.09, -0.12, 0.17, 1, 1.1, 0.9); var ear = add(h, sph(0.07, 10), dk, sd * 0.2, 0.15, -0.02, 1.2, 0.7, 0.5); rot(ear, 0, 0, sd * 0.6); });
    add(h, sph(0.05, 10), shiny('#2a1a10', 120), 0, -0.01, 0.27, 1.3, 0.8, 0.8);
    [-1, 1].forEach(function (sd) { add(h, cone(0.022, 0.06, 6), lam('#ffffff'), sd * 0.06, -0.12, 0.26); });
    eyes(h, 0.06, 0.19, 0.09, 0.035);
    var col = add(g, tor(0.17, 0.03, 7, 8, 24), lam('#e11d48'), 0, 0.5, 0.15); col.rotation.x = Math.PI / 2 + 0.5;
    add(g, sph(0.03, 10), metal('#ffd23b'), 0, 0.43, 0.32);
    tag(g, 0.25, 0.35, -0.25);
    return g;
  }
  function ringTrophy() {
    var g = new T.Group(), M = metal('#ffcf3a');
    add(g, box(0.5, 0.12, 0.36), lam('#5a3418'), 0, 0.06, 0); add(g, box(0.24, 0.05, 0.01), M, 0, 0.07, 0.182);
    add(g, cyl(0.04, 0.06, 0.2, 12), M, 0, 0.22, 0);
    var r = grp(g, 0, 0.62, 0); add(r, tor(0.28, 0.075, 7, 14, 40), M, 0, 0, 0);
    var spk = []; for (var i = 0; i < 4; i++) spk.push(add(g, starGeo(0.035, 0.012, 0.005), glow('#fffbe0'), 0, 0, 0));
    g.userData.tick = function (t) { r.rotation.y = t * 1.6; spk.forEach(function (s, k) { var a = t * 0.9 + k * 1.57; s.position.set(Math.cos(a) * 0.45, 0.6 + Math.sin(t * 2 + k) * 0.25, Math.sin(a) * 0.3); s.rotation.z = t * 2; }); };
    return g;
  }


  /* ---------- Grok Spooks prizes ---------- */
  function ghostShape(par, col, s, glowy) {
    var mat = glowy ? new T.MeshLambertMaterial({ color: col, emissive: new T.Color(col).multiplyScalar(0.35) }) : lam(col);
    var g = grp(par, 0, 0, 0); add(g, sph(0.3 * s, 24), mat, 0, 0.55 * s, 0, 1, 1.05, 1);
    add(g, cyl(0.3 * s, 0.33 * s, 0.32 * s, 24), mat, 0, 0.36 * s, 0);
    for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; add(g, sph(0.08 * s, 10), mat, Math.cos(a) * 0.27 * s, 0.2 * s, Math.sin(a) * 0.27 * s); }
    return g;
  }
  function goob() {
    var g = new T.Group(), b = grp(g, 0, 0.05, 0); ghostShape(b, '#5dff8a', 1, true);
    [-1, 1].forEach(function (sd) { add(b, sph(0.08, 12), lam('#5dff8a'), sd * 0.34, 0.45, 0.05, 1.2, 0.8, 0.8); });
    eyes(b, 0.62, 0.27, 0.1, 0.05); var mo = add(b, sph(0.05, 12), lam('#3a1020'), 0, 0.48, 0.29, 1.2, 1, 0.4);
    add(b, sph(0.025, 8), lam('#ff6b8a'), 0, 0.465, 0.31, 1.3, 0.7, 0.4); blush(b, 0.52, 0.26, 0.17); tag(b, 0.22, 0.3, -0.24);
    g.userData.tick = function (t) { b.position.y = 0.05 + Math.sin(t * 2.2) * 0.04; b.rotation.z = Math.sin(t * 1.3) * 0.06; };
    return g;
  }
  function boo() {
    var g = new T.Group(), b = grp(g, 0, 0.08, 0), W = new T.MeshLambertMaterial({ color: '#f4f2ff', emissive: new T.Color('#5a5080') });
    add(b, sph(0.32, 28), W, 0, 0.45, 0);
    [-1, 1].forEach(function (sd) { var h = add(b, sph(0.1, 12), W, sd * 0.13, 0.52, 0.27, 1.1, 0.85, 0.6); rot(h, 0, 0, sd * 0.4); var e = add(b, cone(0.06, 0.14, 10), W, sd * 0.2, 0.74, -0.05); rot(e, 0, 0, -sd * 0.6); });
    var mo = add(b, sph(0.08, 14), lam('#ff7a9e'), 0, 0.33, 0.27, 1.3, 0.7, 0.5);
    [-1, 1].forEach(function (sd) { add(b, cone(0.02, 0.05, 6), lam('#ffffff'), sd * 0.04, 0.36, 0.32).rotation.x = Math.PI; });
    blush(b, 0.42, 0.28, 0.22); add(b, cone(0.1, 0.22, 12), W, 0, 0.18, -0.2).rotation.x = -2.2; tag(b, 0.22, 0.3, -0.26);
    g.userData.tick = function (t) { b.position.y = 0.08 + Math.sin(t * 1.8) * 0.05; b.rotation.y = Math.sin(t * 0.7) * 0.25; };
    return g;
  }
  function waltzy() {
    var g = new T.Group(), b = grp(g, 0, 0.04, 0); ghostShape(b, '#ff8fe0', 1.05, true);
    add(b, cone(0.42, 0.3, 24), lam('#e04fbf'), 0, 0.17, 0);
    [-1, 1].forEach(function (sd) { var a = add(b, sph(0.08, 12), lam('#ff8fe0'), sd * 0.36, 0.55 + sd * 0.06, 0.05, 1.2, 0.8, 0.8); });
    eyes(b, 0.66, 0.29, 0.1, 0.048); smile(b, 0.52, 0.31, 0.06); blush(b, 0.56, 0.28, 0.18);
    var tia = grp(b, 0, 0.88, 0); add(tia, cyl(0.13, 0.15, 0.05, 20), metal('#ffcf3a'), 0, 0, 0);
    [-0.09, 0, 0.09].forEach(function (x, i) { add(tia, cone(0.035, i === 1 ? 0.13 : 0.09, 8), metal('#ffcf3a'), x, 0.07, 0.1); });
    add(tia, sph(0.03, 10), glow('#3ff0ff'), 0, 0.03, 0.15);
    add(b, sph(0.05, 12), metal('#ffcf3a'), 0, 0.3, 0.35); tag(b, 0.24, 0.32, -0.26);
    g.userData.tick = function (t) { b.rotation.y = Math.sin(t * 1.2) * 0.5; b.position.y = 0.04 + Math.abs(Math.sin(t * 2.4)) * 0.05; };
    return g;
  }
  function vacReplica() {
    var g = new T.Group(); stand(g, '#3a2466', 0.8);
    var v = grp(g, 0, 0.08, 0), body = shiny('#5b6b8c', 70), gold = metal('#ffcf3a');
    add(v, box(0.42, 0.62, 0.28), body, 0, 0.42, -0.04);
    add(v, box(0.46, 0.06, 0.32), gold, 0, 0.1, -0.04); add(v, box(0.46, 0.06, 0.32), gold, 0, 0.74, -0.04);
    var tank = add(v, cyl(0.13, 0.13, 0.42, 20), new T.MeshLambertMaterial({ color: '#7dffb0', emissive: new T.Color('#1f9f4a'), transparent: true, opacity: 0.85 }), 0, 0.42, 0.13);
    var gh = grp(v, 0, 0.4, 0.13); ghostShape(gh, '#ffffff', 0.22, true);
    var hose = add(v, tor(0.2, 0.035, Math.PI * 1.1, 8, 24), lam('#2a2f3a'), 0.28, 0.5, 0.05); rot(hose, 0, Math.PI / 2, 0.2);
    var noz = add(v, cyl(0.07, 0.04, 0.32, 14), shiny('#9aa6c0', 90), 0.34, 0.66, 0.24); rot(noz, 1.1, 0, 0);
    add(v, cyl(0.075, 0.075, 0.03, 14), gold, 0.34, 0.74, 0.37).rotation.x = 1.1;
    add(v, sph(0.035, 10), glow('#ff4fd8'), -0.13, 0.66, 0.11); add(v, sph(0.035, 10), glow('#3ff0ff'), -0.13, 0.58, 0.11);
    g.userData.tick = function (t) { gh.rotation.y = t * 2; gh.position.y = 0.4 + Math.sin(t * 3) * 0.06; };
    return g;
  }
  function kcFlash() {
    var g = new T.Group(); keyRing(g, 0.92);
    var f = grp(g, 0, 0.42, 0); rot(f, 0, 0, -0.3);
    add(f, cyl(0.07, 0.07, 0.38, 16), shiny('#ff4fd8', 80), 0, 0, 0); add(f, cyl(0.11, 0.075, 0.12, 16), metal('#ffcf3a'), 0, 0.24, 0);
    add(f, cyl(0.1, 0.1, 0.01, 16), glow('#fffbe0'), 0, 0.305, 0); add(f, box(0.05, 0.08, 0.03), lam('#ffe14d'), 0, 0.02, 0.07);
    var gh = grp(g, -0.22, 0.72, 0.05); ghostShape(gh, '#7dffb0', 0.32, true);
    g.userData.tick = function (t) { gh.position.y = 0.72 + Math.sin(t * 2.5) * 0.04; };
    return g;
  }
  function gooJar() {
    var g = new T.Group();
    add(g, cyl(0.26, 0.26, 0.62, 28), new T.MeshPhongMaterial({ color: '#d8ffe6', transparent: true, opacity: 0.3, shininess: 120, specular: '#ffffff' }), 0, 0.33, 0);
    var goo = add(g, cyl(0.24, 0.24, 0.42, 28), new T.MeshLambertMaterial({ color: '#39ff6a', emissive: new T.Color('#16a83a') }), 0, 0.23, 0);
    eyes(g, 0.3, 0.24, 0.07, 0.035);
    add(g, cyl(0.28, 0.28, 0.1, 28), shiny('#7c4dff', 60), 0, 0.68, 0);
    var bub = []; for (var i = 0; i < 4; i++) bub.push(add(g, sph(0.03, 8), glow('#ccffd9'), 0, 0, 0));
    g.userData.tick = function (t) { goo.scale.y = 1 + Math.sin(t * 2) * 0.04; bub.forEach(function (q, k) { var y = ((t * 0.25 + k * 0.25) % 1); q.position.set(Math.cos(k * 1.7) * 0.13, 0.05 + y * 0.38, Math.sin(k * 1.7) * 0.13); }); };
    return g;
  }
  function lavaLamp() {
    var g = new T.Group(), M = metal('#b8c0d0');
    add(g, cyl(0.1, 0.2, 0.26, 20), M, 0, 0.13, 0);
    add(g, cyl(0.07, 0.15, 0.55, 20), new T.MeshLambertMaterial({ color: '#8b5cf6', emissive: new T.Color('#3b1d8a'), transparent: true, opacity: 0.8 }), 0, 0.535, 0);
    add(g, cyl(0.03, 0.08, 0.14, 20), M, 0, 0.88, 0);
    var bl = [0.07, 0.05, 0.045].map(function (r) { return add(g, sph(r, 14), new T.MeshBasicMaterial({ color: '#ff4fd8' }), 0, 0.4, 0); });
    g.userData.tick = function (t) { bl.forEach(function (q, k) { var y = 0.32 + (Math.sin(t * 0.6 + k * 2.1) * 0.5 + 0.5) * 0.4; q.position.set(Math.sin(t + k) * 0.02, y, 0); var sc = 1 + Math.sin(t * 1.3 + k) * 0.25; q.scale.set(sc, 1 / sc + 0.3, sc); }); };
    return g;
  }

  /* ---------- keychains, posters, hats ---------- */
  function keyRing(g, y) { add(g, tor(0.11, 0.015, 7, 8, 30), metal('#c9ced8'), 0, y, 0); for (var i = 0; i < 3; i++) { var l = add(g, tor(0.03, 0.009, 7, 6, 14), metal('#9aa1ad'), 0, y - 0.13 - i * 0.05, 0); if (i % 2) l.rotation.y = Math.PI / 2; } }
  function kcSnake() {
    var g = new T.Group(); keyRing(g, 0.88);
    var pts = []; for (var i = 0; i <= 36; i++) { var t = i / 36, a = t * Math.PI * 3.4; pts.push(new T.Vector3(Math.cos(a) * (0.22 - t * 0.1), 0.14 + t * 0.45, Math.sin(a) * (0.22 - t * 0.1))); }
    var curve = new T.CatmullRomCurve3(pts);
    add(g, G('snake', function () { return new T.TubeGeometry(curve, 80, 0.055, 10, false); }), lam('#4ade80'));
    var hp = pts[pts.length - 1], h = grp(g, hp.x, hp.y + 0.03, hp.z);
    add(h, sph(0.085, 14), lam('#4ade80'), 0, 0, 0, 1.1, 0.85, 1.3);
    eyes(h, 0.04, 0.07, 0.045, 0.022);
    add(h, box(0.02, 0.005, 0.07), glow('#ff4fd8'), 0, -0.02, 0.12);
    return g;
  }
  function joystickModel(par, base, stick, knob, sc, glowCol) {
    var g = grp(par, 0, 0, 0); g.scale.setScalar(sc || 1);
    add(g, box(0.62, 0.16, 0.42), shiny(base, 80), 0, 0.08, 0);
    add(g, cyl(0.05, 0.05, 0.03, 14), shiny('#ff3d5a', 100), -0.2, 0.17, 0.1); add(g, cyl(0.05, 0.05, 0.03, 14), shiny('#3ff0ff', 100), 0.2, 0.17, 0.1);
    add(g, cyl(0.1, 0.13, 0.05, 18), shiny('#222', 60), 0, 0.18, -0.04);
    var s = grp(g, 0, 0.18, -0.04); s.rotation.z = 0.15;
    add(s, cyl(0.025, 0.025, 0.42, 10), metal(stick), 0, 0.21, 0);
    add(s, sph(0.1, 18), glowCol ? metal(knob) : shiny(knob, 100), 0, 0.45, 0);
    return g;
  }
  function kcJoy() { var g = new T.Group(); keyRing(g, 0.88); var j = joystickModel(g, '#7c3aed', '#cfd3dc', '#ff3d5a', 0.85); j.position.y = 0.06; return g; }
  function posterTex(kind) {
    return texOf(256, 360, function (c, w, h) {
      var bg = c.createLinearGradient(0, 0, 0, h); if (kind === 'brawl') { bg.addColorStop(0, '#1a0638'); bg.addColorStop(1, '#ff3d6e'); } else { bg.addColorStop(0, '#140a2b'); bg.addColorStop(1, '#3b1a78'); }
      c.fillStyle = bg; c.fillRect(0, 0, w, h); c.textAlign = 'center';
      if (kind === 'brawl') {
        c.fillStyle = '#ffe14d'; c.font = 'bold 54px "Trebuchet MS",sans-serif'; c.fillText('GROK', w / 2, 70); c.fillText('BRAWL', w / 2, 126);
        c.fillStyle = '#ff4a2e'; c.fillRect(32, 170, 66, 110); c.fillStyle = '#ffcfa6'; c.beginPath(); c.arc(65, 160, 34, 0, 7); c.fill();
        c.fillStyle = '#2b2f7a'; c.fillRect(158, 170, 66, 110); c.fillStyle = '#ffe0bd'; c.beginPath(); c.arc(191, 160, 34, 0, 7); c.fill(); c.fillStyle = '#ffd400'; c.beginPath(); c.moveTo(160, 140); c.lineTo(175, 110); c.lineTo(190, 135); c.lineTo(205, 105); c.lineTo(222, 140); c.fill();
        c.fillStyle = '#fff'; c.font = 'bold 44px sans-serif'; c.fillText('VS', w / 2, 240); c.font = 'bold 22px sans-serif'; c.fillText('BLAZE  \u00b7  VOLT', w / 2, 330);
      } else {
        c.shadowColor = '#3ff0ff'; c.shadowBlur = 16; c.fillStyle = '#3ff0ff'; c.font = 'bold 62px "Trebuchet MS",sans-serif'; c.fillText('GROK', w / 2, 76);
        c.shadowColor = '#ff4fd8'; c.fillStyle = '#ff4fd8'; c.font = 'bold 46px "Trebuchet MS",sans-serif'; c.fillText('ARCADE', w / 2, 128); c.shadowBlur = 0;
        c.fillStyle = '#1c1236'; c.fillRect(78, 160, 100, 170); c.strokeStyle = '#ffe14d'; c.lineWidth = 5; c.strokeRect(78, 160, 100, 170);
        c.fillStyle = '#3ff0ff'; c.fillRect(92, 176, 72, 56); c.fillStyle = '#ff3d5a'; c.beginPath(); c.arc(106, 270, 9, 0, 7); c.fill(); c.fillStyle = '#ffe14d'; c.beginPath(); c.arc(150, 270, 9, 0, 7); c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,0.1)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(w * 0.6, 0); c.lineTo(0, h * 0.5); c.fill();
    });
  }
  function poster(kind) {
    var g = new T.Group(), f = grp(g, 0, 0.5, 0); f.rotation.x = -0.08;
    add(f, box(0.7, 0.95, 0.04), lam('#2a1a10'), 0, 0, 0);
    var m = new T.Mesh(new T.PlaneGeometry(0.62, 0.86), new T.MeshBasicMaterial({ map: posterTex(kind) })); m.position.z = 0.022; f.add(m);
    add(f, sph(0.025, 8), glow('#ff3d5a'), -0.31, 0.44, 0.03); add(f, sph(0.025, 8), glow('#3ff0ff'), 0.31, 0.44, 0.03);
    var leg = add(g, box(0.05, 0.6, 0.04), lam('#2a1a10'), 0, 0.3, -0.2); rot(leg, -0.4, 0, 0);
    return g;
  }
  function letterTex(ch, bg, fg) { return texOf(128, 128, function (c, w, h) { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = fg; c.font = 'bold 96px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, w / 2, h / 2 + 6); }); }
  function cap() {
    var g = new T.Group(), dome = add(g, sph(0.42, 28), lam('#ff4fd8'), 0, 0.1, 0);
    dome.geometry = new T.SphereGeometry(0.42, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2); dome.scale.set(1, 0.85, 1);
    add(g, cyl(0.425, 0.425, 0.06, 28), lam('#e23cbf'), 0, 0.1, 0);
    var brim = add(g, cyl(0.3, 0.3, 0.03, 26), lam('#3ff0ff'), 0, 0.11, 0.36, 1.25, 1, 1);
    brim.rotation.x = 0.08;
    add(g, sph(0.04, 10), lam('#ff4fd8'), 0, 0.47, 0);
    for (var i = 0; i < 6; i++) { var s = add(g, box(0.008, 0.36, 0.008), lam('#ffd6f5'), 0, 0, 0); var a = i / 6 * Math.PI * 2; s.position.set(Math.sin(a) * 0.24, 0.32, Math.cos(a) * 0.24); s.lookAt(0, 0.6, 0); s.rotateX(Math.PI / 2); }
    var lt = new T.Mesh(new T.PlaneGeometry(0.22, 0.22), new T.MeshBasicMaterial({ map: letterTex('G', 'rgba(0,0,0,0)', '#ffffff'), transparent: true })); lt.position.set(0, 0.3, 0.34); lt.rotation.x = -0.45; g.add(lt);
    g.userData.hat = { y: 0.1, s: 0.86 };
    return g;
  }
  function propeller() {
    var g = new T.Group(), cols = ['#ff3b4f', '#ffe14d', '#3ba7ff', '#4ade80'];
    for (var i = 0; i < 4; i++) { var m = new T.Mesh(new T.SphereGeometry(0.4, 10, 12, i * Math.PI / 2, Math.PI / 2, 0, Math.PI / 2), lam(cols[i])); m.position.y = 0.08; m.scale.y = 0.8; g.add(m); }
    add(g, cyl(0.405, 0.405, 0.06, 26), lam('#2b6fd6'), 0, 0.08, 0);
    add(g, cyl(0.02, 0.02, 0.2, 8), metal('#cfd3dc'), 0, 0.48, 0);
    var p = grp(g, 0, 0.58, 0);
    add(p, sph(0.04, 10), metal('#cfd3dc'));
    add(p, sph(0.3, 14), shiny('#ff3b4f'), -0.28, 0, 0, 0.95, 0.07, 0.3); add(p, sph(0.3, 14), shiny('#ffe14d'), 0.28, 0, 0, 0.95, 0.07, 0.3);
    g.userData.tick = function (t, dt, spin) { p.rotation.y += (dt || 0.016) * (spin ? 18 : 6); };
    g.userData.hat = { y: 0.1, s: 0.88 };
    return g;
  }

  /* ---------- models + figures ---------- */
  function stand(g, col, w) { add(g, box(w || 0.9, 0.08, 0.5), shiny(col, 50), 0, 0.04, 0); add(g, box((w || 0.9) * 0.4, 0.03, 0.02), metal('#ffe14d'), 0, 0.045, 0.255); }
  function fcBall() {
    var g = new T.Group();
    add(g, tor(0.2, 0.04, 7, 10, 30), metal('#ffcf3a'), 0, 0.06, 0).rotation.x = Math.PI / 2;
    add(g, cyl(0.24, 0.28, 0.06, 26), metal('#d9a520'), 0, 0.03, 0);
    var b = grp(g, 0, 0.47, 0);
    add(b, G('ico', function () { return new T.IcosahedronGeometry(0.38, 3); }), shiny('#f8fafc', 50));
    var ico = new T.IcosahedronGeometry(1, 0), pos = ico.attributes.position, seen = {};
    for (var i = 0; i < pos.count; i++) { var v = new T.Vector3().fromBufferAttribute(pos, i).normalize(), k = v.toArray().map(function (n) { return n.toFixed(2); }).join(); if (seen[k]) continue; seen[k] = 1;
      var p = add(b, cyl(0.12, 0.12, 0.03, 5), shiny('#1e1e2a', 40), v.x * 0.37, v.y * 0.37, v.z * 0.37); p.lookAt(v.clone().multiplyScalar(2)); p.rotateX(Math.PI / 2); }
    // signatures
    var sig = texOf(256, 128, function (c) { c.strokeStyle = '#1d4ed8'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(20, 80); c.bezierCurveTo(60, 20, 80, 120, 120, 60); c.bezierCurveTo(150, 30, 170, 100, 230, 50); c.stroke(); c.strokeStyle = '#e11d48'; c.beginPath(); c.moveTo(40, 110); c.bezierCurveTo(90, 90, 140, 125, 200, 100); c.stroke(); });
    var sp = new T.Mesh(new T.SphereGeometry(0.385, 24, 12, -0.5, 1.0, 1.0, 0.7), new T.MeshBasicMaterial({ map: sig, transparent: true })); sp.rotation.y = 0.0; b.add(sp);
    return g;
  }
  function gary() {
    var g = new T.Group(); stand(g, '#8b5a2b', 0.6);
    add(g, box(0.3, 0.36, 0.2), lam('#14b8a6'), 0, 0.26, 0);
    add(g, box(0.1, 0.12, 0.01), lam('#ffffff'), 0, 0.36, 0.101);
    add(g, box(0.04, 0.2, 0.012), lam('#2563eb'), 0, 0.3, 0.105);
    [-1, 1].forEach(function (sd) { add(g, box(0.08, 0.28, 0.1), lam('#14b8a6'), sd * 0.2, 0.28, 0); add(g, sph(0.045, 8), lam('#f1c7a0'), sd * 0.2, 0.12, 0); });
    add(g, cyl(0.03, 0.03, 0.08, 6), metal('#cfd3dc'), 0, 0.48, 0); // the spring!
    var h = grp(g, 0, 0.72, 0);
    add(h, sph(0.24, 22), lam('#f1c7a0'), 0, 0, 0, 1, 1, 0.95);
    add(h, sph(0.245, 22), lam('#6b5a4a'), 0, 0.05, -0.03, 1, 0.82, 0.95);
    [[-0.08, 0.22, 0.05, 0.4], [0.03, 0.24, 0.02, -0.2], [0.12, 0.21, 0.04, -0.5]].forEach(function (q) { add(h, box(0.09, 0.1, 0.09), lam('#6b5a4a'), q[0], q[1], q[2]).rotation.z = q[3]; });
    add(h, sph(0.15, 14), lam('#6b5a4a'), 0, -0.13, 0.12, 1, 0.5, 0.6); // beard
    [-1, 1].forEach(function (sd) { add(h, box(0.13, 0.09, 0.02), lam('#1b1030'), sd * 0.09, 0.03, 0.225); add(h, box(0.1, 0.06, 0.01), shiny('#bfe9ff', 120), sd * 0.09, 0.03, 0.236); add(h, sph(0.018, 6), glow('#16101f'), sd * 0.09, 0.03, 0.24); });
    add(h, box(0.05, 0.02, 0.02), lam('#1b1030'), 0, 0.04, 0.23);
    add(h, box(0.07, 0.015, 0.01), lam('#c98d6b'), 0, -0.07, 0.235);
    g.userData.tick = function (t) { h.rotation.x = Math.sin(t * 5) * 0.12; h.rotation.z = Math.sin(t * 3.3) * 0.06; };
    return g;
  }
  function landFig() {
    var g = new T.Group();
    add(g, box(0.6, 0.3, 0.6), lam('#8b5a2b'), 0, 0.15, 0); add(g, box(0.62, 0.08, 0.62), lam('#4ade80'), 0, 0.31, 0);
    for (var i = 0; i < 6; i++) add(g, box(0.06, 0.04 + (i % 3) * 0.02, 0.06), lam('#22c55e'), -0.25 + (i * 0.19) % 0.5, 0.36, -0.22 + (i * 0.23) % 0.45);
    var hero = grp(g, 0, 0.35, 0);
    add(hero, box(0.34, 0.42, 0.3), lam('#f97316'), 0, 0.3, 0);
    [-1, 1].forEach(function (sd) { add(hero, box(0.1, 0.12, 0.1), lam('#c2410c'), sd * 0.1, 0.05, 0); add(hero, box(0.08, 0.2, 0.08), lam('#f97316'), sd * 0.22, 0.32, 0).rotation.z = sd * (sd > 0 ? -0.9 : 0.3); add(hero, box(0.07, 0.09, 0.01), glow('#ffffff'), sd * 0.07, 0.38, 0.151); add(hero, box(0.035, 0.05, 0.01), glow('#16101f'), sd * 0.07, 0.37, 0.157); });
    smile(hero, 0.25, 0.155, 0.04);
    var coin = add(hero, cyl(0.07, 0.07, 0.02, 20), metal('#facc15'), 0.36, 0.55, 0); coin.rotation.x = Math.PI / 2;
    add(coin, starGeo(0.035, 0.015, 0.01), metal('#b45309'), 0, 0.011, 0).rotation.x = -Math.PI / 2;
    g.userData.tick = function (t) { coin.rotation.z = t * 2.5; coin.position.y = 0.55 + Math.sin(t * 3) * 0.02; };
    return g;
  }
  function skyPlane() {
    var g = new T.Group(); stand(g, '#2b1a55', 0.8);
    add(g, cyl(0.02, 0.02, 0.38, 8), metal('#cfd3dc'), 0, 0.27, 0);
    var p = grp(g, 0, 0.55, 0); p.rotation.set(0.12, -0.6, 0);
    var body = add(p, cyl(0.075, 0.075, 0.8, 18), shiny('#f1f5f9', 80), 0, 0, 0); body.rotation.x = Math.PI / 2;
    add(p, sph(0.075, 18), shiny('#f1f5f9', 80), 0, 0, 0.4, 1, 1, 1.5);
    add(p, cone(0.075, 0.2, 18), shiny('#f1f5f9', 80), 0, 0.02, -0.5).rotation.x = -Math.PI / 2;
    add(p, box(0.012, 0.02, 0.62), glow('#38bdf8'), 0.072, 0.02, 0.0); add(p, box(0.012, 0.02, 0.62), glow('#38bdf8'), -0.072, 0.02, 0.0);
    add(p, box(0.1, 0.035, 0.05), shiny('#1e293b', 120), 0, 0.045, 0.47);
    var wing = add(p, box(1.0, 0.018, 0.17), shiny('#cbd5e1', 70), 0, -0.02, 0.03); wing.rotation.y = 0;
    [-1, 1].forEach(function (sd) { var e = add(p, cyl(0.04, 0.035, 0.14, 14), shiny('#64748b', 70), sd * 0.24, -0.06, 0.06); e.rotation.x = Math.PI / 2; add(p, box(0.02, 0.05, 0.03), glow(sd < 0 ? '#ef4444' : '#22c55e'), sd * 0.5, -0.01, 0.03); });
    add(p, box(0.36, 0.014, 0.1), shiny('#cbd5e1', 70), 0, 0.02, -0.5);
    var fin = add(p, box(0.016, 0.2, 0.14), shiny('#e11d48', 70), 0, 0.12, -0.48); fin.rotation.x = -0.3;
    add(p, box(0.018, 0.04, 0.06), glow('#fde047'), 0, 0.15, -0.5);
    return g;
  }
  function gridCar() {
    var g = new T.Group(); stand(g, '#1f1f2e', 0.85);
    var c = grp(g, 0, 0.12, 0); c.rotation.y = -0.6; c.scale.setScalar(1.35);
    var red = shiny('#f43f5e', 90);
    add(c, box(0.2, 0.08, 0.62), red, 0, 0.05, 0);
    add(c, box(0.34, 0.07, 0.2), red, 0, 0.04, -0.05);
    add(c, cone(0.09, 0.32, 4), red, 0, 0.04, 0.44).rotation.set(Math.PI / 2, Math.PI / 4, 0);
    add(c, box(0.46, 0.02, 0.08), shiny('#ffffff', 60), 0, 0.02, 0.56);
    add(c, box(0.4, 0.08, 0.06), red, 0, 0.2, -0.36); add(c, box(0.02, 0.14, 0.08), shiny('#222', 40), -0.18, 0.13, -0.36); add(c, box(0.02, 0.14, 0.08), shiny('#222', 40), 0.18, 0.13, -0.36);
    add(c, box(0.12, 0.08, 0.16), shiny('#111', 100), 0, 0.12, 0.02);
    add(c, tor(0.08, 0.012, Math.PI, 6, 16), shiny('#333', 60), 0, 0.12, 0.08).rotation.y = Math.PI / 2;
    add(c, sph(0.045, 12), shiny('#ffe14d', 100), 0, 0.17, 0.0);
    [[0.2, 0.3], [-0.2, 0.3], [0.21, -0.27], [-0.21, -0.27]].forEach(function (q) { var w = add(c, cyl(0.085, 0.085, 0.09, 18), lam('#1a1a1a'), q[0], 0.06, q[1]); w.rotation.z = Math.PI / 2; add(w, cyl(0.04, 0.04, 0.095, 12), metal('#9ca3af')); });
    var num = new T.Mesh(new T.PlaneGeometry(0.08, 0.08), new T.MeshBasicMaterial({ map: letterTex('1', '#ffffff', '#f43f5e') })); num.position.set(0, 0.092, 0.2); num.rotation.x = -Math.PI / 2; c.add(num);
    return g;
  }
  /* ---------- trophies ---------- */
  function trophy(col, big) {
    var g = new T.Group(), M = metal(col);
    add(g, box(0.5, 0.12, 0.5), lam('#2a1a10'), 0, 0.06, 0); add(g, box(0.42, 0.1, 0.42), lam('#3b2416'), 0, 0.17, 0);
    add(g, box(0.24, 0.05, 0.01), M, 0, 0.17, 0.212);
    var pts = [[0.0, 0], [0.15, 0], [0.13, 0.03], [0.05, 0.06], [0.04, 0.2], [0.06, 0.24], [0.1, 0.27], [0.2, 0.36], [0.27, 0.52], [0.3, 0.68], [0.31, 0.72], [0.29, 0.72], [0.27, 0.7], [0.0, 0.7]].map(function (p) { return new T.Vector2(p[0], p[1]); });
    add(g, G('cup', function () { return new T.LatheGeometry(pts, 32); }), M, 0, 0.22, 0);
    [-1, 1].forEach(function (sd) { var h = add(g, tor(0.1, 0.022, Math.PI * 1.1, 8, 18), M, sd * 0.29, 0.7, 0); h.rotation.z = sd > 0 ? -Math.PI / 2 - 0.15 : Math.PI / 2 + 0.15; });
    var st = add(g, starGeo(0.09, 0.04, 0.02), metal(new T.Color(col).lerp(new T.Color('#ffffff'), 0.4).getStyle()), 0, 0.68, 0.24); st.rotation.x = -0.2;
    if (big) { var spk = []; for (var i = 0; i < 4; i++) spk.push(add(g, starGeo(0.035, 0.012, 0.005), glow('#fffbe0'), 0, 0, 0)); g.userData.tick = function (t) { spk.forEach(function (s, k) { var a = t * 0.9 + k * 1.57; s.position.set(Math.cos(a) * 0.45, 0.6 + Math.sin(t * 2 + k) * 0.25, Math.sin(a) * 0.45); s.rotation.y = t * 3; }); }; }
    return g;
  }
  function goldenJoy() {
    var g = new T.Group(); var j = joystickModel(g, '#e6a817', '#ffd54a', '#ffcf3a', 1.25, true); j.position.y = 0;
    var halo = new T.Mesh(new T.RingGeometry(0.36, 0.44, 40), new T.MeshBasicMaterial({ color: '#ffd54a', transparent: true, opacity: 0.5, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending })); halo.position.y = 0.62; g.add(halo);
    g.userData.tick = function (t) { halo.rotation.z = t; halo.lookAt(halo.position.clone().add(new T.Vector3(0, 0, 1))); halo.material.opacity = 0.25 + Math.sin(t * 3) * 0.1; };
    return g;
  }


  /* ---------- Grok Blocks prizes ---------- */
  function zebraPlush() {
    var g = new T.Group(), b = grp(g, 0, 0, 0), W = lam('#f4f4f4'), K = lam('#222222');
    [[-0.16, 0.2], [0.16, 0.2], [-0.16, -0.16], [0.16, -0.16]].forEach(function (p) {
      add(b, box(0.1, 0.28, 0.1), W, p[0], 0.14, p[1]);
      add(b, box(0.11, 0.05, 0.11), K, p[0], 0.2, p[1]);
      add(b, box(0.12, 0.05, 0.12), K, p[0], 0.03, p[1]);
    });
    add(b, box(0.42, 0.3, 0.58), W, 0, 0.4, 0);
    [-0.2, -0.06, 0.08, 0.2].forEach(function (z) { add(b, box(0.44, 0.32, 0.055), K, 0, 0.4, z); });
    add(b, box(0.16, 0.2, 0.16), W, 0, 0.58, 0.26);
    add(b, box(0.06, 0.22, 0.16), K, 0, 0.62, 0.26);
    add(b, box(0.22, 0.18, 0.2), W, 0, 0.68, 0.4);
    add(b, box(0.23, 0.05, 0.08), K, 0, 0.74, 0.4);
    add(b, box(0.18, 0.06, 0.08), K, 0, 0.64, 0.5);
    eyes(b, 0.72, 0.5, 0.06, 0.026);
    [-1, 1].forEach(function (sd) { add(b, box(0.05, 0.09, 0.04), W, sd * 0.07, 0.82, 0.38); });
    add(b, box(0.04, 0.16, 0.04), K, 0, 0.46, -0.34);
    tag(b, 0.2, 0.38, -0.26);
    g.userData.tick = function (t) { b.rotation.y = Math.sin(t * 0.8) * 0.15; };
    return g;
  }
  function rhinoPlush() {
    var g = new T.Group(), b = grp(g, 0, 0, 0), C = lam('#8d8a84'), D = lam('#5c5a56');
    [[-0.18, 0.18], [0.18, 0.18], [-0.18, -0.2], [0.18, -0.2]].forEach(function (p) { add(b, box(0.13, 0.26, 0.13), C, p[0], 0.13, p[1]); });
    add(b, box(0.52, 0.34, 0.58), C, 0, 0.4, -0.02);
    add(b, box(0.32, 0.24, 0.26), C, 0, 0.46, 0.36);
    add(b, box(0.18, 0.1, 0.12), D, 0, 0.4, 0.5);
    add(b, cone(0.04, 0.16, 8), D, 0, 0.66, 0.46);
    eyes(b, 0.54, 0.48, 0.09, 0.028);
    blush(b, 0.46, 0.42, 0.16);
    [-1, 1].forEach(function (sd) { add(b, box(0.06, 0.05, 0.08), C, sd * 0.18, 0.56, 0.3); });
    tag(b, 0.22, 0.36, -0.28);
    g.userData.tick = function (t) { b.position.y = Math.abs(Math.sin(t * 1.6)) * 0.03; };
    return g;
  }
  function leopardPlush() {
    var g = new T.Group(), b = grp(g, 0, 0, 0), W = lam('#e8eef2'), S = lam('#8aa0b0'), P = lam('#ffb6c8');
    [[-0.14, 0.16], [0.14, 0.16], [-0.14, -0.16], [0.14, -0.16]].forEach(function (p, i) {
      add(b, box(0.09, 0.26, 0.09), i % 2 ? S : W, p[0], 0.13, p[1]);
    });
    add(b, box(0.4, 0.26, 0.56), W, 0, 0.38, 0);
    [[-0.1, 0.08], [0.1, -0.08], [0, 0.16], [-0.12, -0.14]].forEach(function (p) { add(b, box(0.08, 0.08, 0.08), S, p[0], 0.46, p[1]); });
    add(b, box(0.22, 0.18, 0.2), W, 0, 0.52, 0.32);
    [-1, 1].forEach(function (sd) {
      add(b, box(0.06, 0.1, 0.04), W, sd * 0.07, 0.68, 0.3);
      add(b, box(0.04, 0.06, 0.03), P, sd * 0.07, 0.66, 0.32);
    });
    eyes(b, 0.56, 0.42, 0.06, 0.024);
    blush(b, 0.5, 0.38, 0.1);
    var tail = grp(b, 0, 0.4, -0.3); rot(tail, 0.4, 0, 0.5);
    add(tail, box(0.06, 0.06, 0.28), W, 0, 0, -0.1);
    add(tail, box(0.08, 0.08, 0.08), S, 0, 0, -0.24);
    tag(b, -0.18, 0.34, -0.2);
    g.userData.tick = function (t) { tail.rotation.z = 0.5 + Math.sin(t * 2) * 0.35; b.rotation.y = Math.sin(t * 0.6) * 0.1; };
    return g;
  }
  function rangerHat() {
    var g = new T.Group();
    add(g, cyl(0.52, 0.52, 0.045, 28), lam('#c9a24a'), 0, 0.08, 0);
    add(g, cyl(0.28, 0.32, 0.28, 20), lam('#f0c24b'), 0, 0.22, 0);
    add(g, cyl(0.3, 0.3, 0.05, 20), lam('#2f6b4a'), 0, 0.12, 0);
    add(g, cyl(0.3, 0.26, 0.04, 20), lam('#e2b43a'), 0, 0.36, 0);
    add(g, box(0.1, 0.1, 0.02), metal('#ffcf3a'), 0, 0.22, 0.3);
    add(g, box(0.02, 0.07, 0.012), glow('#e23b3b'), 0, 0.22, 0.312);
    add(g, box(0.07, 0.02, 0.012), glow('#e23b3b'), 0, 0.22, 0.312);
    g.userData.hat = { y: 0.05, s: 0.72 };
    return g;
  }
  function kcDart() {
    var g = new T.Group(); keyRing(g, 0.92);
    var d = grp(g, 0, 0.38, 0); rot(d, 0, 0, 0.55);
    add(d, cyl(0.04, 0.028, 0.32, 12), shiny('#ff7a1a', 70), 0, 0.05, 0);
    add(d, cone(0.012, 0.16, 8), metal('#cfd3dc'), 0, 0.28, 0);
    add(d, cyl(0.02, 0.045, 0.08, 10), lam('#2f6b4a'), 0, -0.12, 0);
    add(d, cone(0.05, 0.12, 3), lam('#e23b3b'), 0, -0.2, 0).rotation.x = Math.PI;
    return g;
  }
  function snowGlobe() {
    var g = new T.Group();
    add(g, cyl(0.32, 0.36, 0.16, 24), lam('#6b4423'), 0, 0.08, 0);
    add(g, cyl(0.34, 0.34, 0.04, 24), metal('#ffcf3a'), 0, 0.17, 0);
    add(g, sph(0.34, 28), new T.MeshPhongMaterial({ color: '#d8f4ff', transparent: true, opacity: 0.28, shininess: 140, specular: '#ffffff' }), 0, 0.5, 0);
    var inn = grp(g, 0, 0.3, 0);
    add(inn, box(0.28, 0.08, 0.28), lam('#7da84a'), 0, 0, 0);
    add(inn, box(0.12, 0.1, 0.16), lam('#f4f4f4'), -0.02, 0.09, 0.02);
    add(inn, box(0.13, 0.04, 0.04), lam('#222222'), -0.02, 0.1, 0.04);
    add(inn, box(0.04, 0.16, 0.04), lam('#6b4423'), 0.1, 0.14, -0.06);
    add(inn, box(0.12, 0.1, 0.12), lam('#3f8a3a'), 0.1, 0.24, -0.06);
    var flakes = [];
    for (var i = 0; i < 8; i++) flakes.push(add(g, box(0.018, 0.018, 0.018), glow('#ffffff'), 0, 0.4, 0));
    g.userData.tick = function (t) {
      inn.rotation.y = t * 0.35;
      flakes.forEach(function (f, k) {
        var y = (t * 0.18 + k * 0.125) % 1, a = k * 0.8 + t * 0.25;
        f.position.set(Math.cos(a) * 0.16, 0.24 + (1 - y) * 0.42, Math.sin(a) * 0.16);
      });
    };
    return g;
  }
  function rescueTruck() {
    var g = new T.Group(); stand(g, '#1d3a28', 0.95);
    var t = grp(g, 0, 0.12, 0); t.rotation.y = -0.55; t.scale.setScalar(0.2);
    var body = lam('#2f6b4a'), cab = lam('#d8efe2'), bed = lam('#24563a'), bar = lam('#9aa8b8'), wh = lam('#222222');
    add(t, box(2.1, 0.7, 4.4), body, 0, 0.8, 0);
    add(t, box(2, 0.5, 1.5), cab, 0, 1.5, 0.9);
    add(t, box(1.9, 0.9, 2.2), bed, 0, 1.5, -1.1);
    [[-0.9, -0.4], [0.9, -0.4], [-0.9, -1.8], [0.9, -1.8]].forEach(function (p) { add(t, box(0.08, 0.95, 0.08), bar, p[0], 2.05, p[1]); });
    add(t, box(1.9, 0.08, 1.6), bar, 0, 2.5, -1.1);
    add(t, box(0.55, 0.32, 0.8), lam('#f4f4f4'), 0, 1.2, -1.1);
    add(t, box(0.57, 0.08, 0.12), lam('#222222'), 0, 1.22, -0.95);
    [[-0.8, 1.5], [0.8, 1.5], [-0.8, -1.5], [0.8, -1.5]].forEach(function (p) { add(t, box(0.5, 0.5, 0.35), wh, p[0], 0.45, p[1]); });
    add(t, box(0.28, 0.22, 0.08), glow('#f2e27a'), -0.55, 1.05, 2.22);
    add(t, box(0.28, 0.22, 0.08), glow('#f2e27a'), 0.55, 1.05, 2.22);
    add(t, box(0.06, 0.28, 0.02), glow('#e23b3b'), 1.06, 0.95, 0.55);
    add(t, box(0.22, 0.06, 0.02), glow('#e23b3b'), 1.06, 0.95, 0.55);
    return g;
  }


  /* ---------- Grok Rides prizes ---------- */
  function grokloonPlush() {
    var g = new T.Group(), b = grp(g, 0, 0, 0), P = lam('#ff4fd8'), Y = lam('#ffd23f');
    add(b, box(0.26, 0.18, 0.26), lam('#b07a43'), 0, 0.09, 0);
    add(b, box(0.28, 0.04, 0.28), lam('#8b5a2b'), 0, 0.19, 0);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { var r = add(b, cyl(0.008, 0.008, 0.26, 5), lam('#6b4423'), q[0] * 0.13, 0.32, q[1] * 0.13); r.rotation.set(-q[1] * 0.3, 0, q[0] * 0.3); });
    var bal = grp(b, 0, 0.72, 0);
    add(bal, sph(0.34, 26), P, 0, 0, 0, 1, 1.08, 1);
    [-0.5, 0.5].forEach(function (a) { var st = add(bal, sph(0.345, 26), Y, 0, 0, 0, 0.32, 1.085, 1.005); st.rotation.y = a * 1.6; });
    add(bal, cyl(0.12, 0.1, 0.08, 16), P, 0, -0.38, 0);
    eyes(bal, 0.04, 0.33, 0.1, 0.035);
    blush(bal, -0.04, 0.31, 0.17);
    var sm = add(bal, tor(0.05, 0.012, Math.PI, 6, 12), lam('#16101f'), 0, -0.06, 0.33); sm.rotation.z = Math.PI;
    tag(b, 0.14, 0.1, 0.14);
    g.userData.tick = function (t) { bal.position.y = 0.72 + Math.sin(t * 1.4) * 0.03; bal.rotation.z = Math.sin(t * 0.9) * 0.05; };
    return g;
  }
  function ridesMonster() {
    var g = new T.Group(); stand(g, '#3b1d5c', 0.95);
    var t = grp(g, 0, 0.1, 0); t.rotation.y = -0.6; t.scale.setScalar(0.19);
    var body = shiny('#ff4fd8', 80), wh = lam('#1a1a1a'), rim = metal('#c9ced8'), fl = glow('#ffd23f');
    add(t, box(2.2, 0.7, 3.6), body, 0, 2.0, 0);
    add(t, box(1.9, 0.7, 1.6), body, 0, 2.7, -0.2);
    add(t, box(1.92, 0.5, 1.4), lam('#bfe8ff'), 0, 2.75, -0.2);
    add(t, box(2.24, 0.18, 1.2), fl, 0, 2.1, 1.0);
    add(t, box(2.6, 0.18, 0.3), rim, 0, 1.3, 1.1); add(t, box(2.6, 0.18, 0.3), rim, 0, 1.3, -1.1);
    [[-1.3, 1.25], [1.3, 1.25], [-1.3, -1.25], [1.3, -1.25]].forEach(function (p) { var w = add(t, cyl(0.95, 0.95, 0.75, 22), wh, p[0], 0.95, p[1]); w.rotation.z = Math.PI / 2; var r = add(t, cyl(0.42, 0.42, 0.78, 14), rim, p[0], 0.95, p[1]); r.rotation.z = Math.PI / 2; });
    add(t, box(0.3, 0.22, 0.08), glow('#f2e27a'), -0.7, 2.05, 1.82); add(t, box(0.3, 0.22, 0.08), glow('#f2e27a'), 0.7, 2.05, 1.82);
    g.userData.tick = function (tt) { t.position.y = 0.1 + Math.abs(Math.sin(tt * 2.2)) * 0.03; };
    return g;
  }
  function taxiHat() {
    var g = new T.Group();
    add(g, cyl(0.36, 0.36, 0.06, 24), lam('#222222'), 0, 0.03, 0);
    add(g, box(0.62, 0.26, 0.24), shiny('#facc15', 70), 0, 0.2, 0);
    var tx = new T.MeshBasicMaterial({ map: texOf(128, 48, function (c, w, h) { c.fillStyle = '#fff6b0'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TAXI', w / 2, h / 2 + 2); }) });
    add(g, new T.PlaneGeometry(0.52, 0.18), tx, 0, 0.21, 0.121); var bk = add(g, new T.PlaneGeometry(0.52, 0.18), tx, 0, 0.21, -0.121); bk.rotation.y = Math.PI;
    for (var i = 0; i < 6; i++) add(g, box(0.103, 0.04, 0.245), lam(i % 2 ? '#111111' : '#ffffff'), -0.258 + i * 0.103, 0.08, 0);
    g.userData.hat = { y: 0.05, s: 0.7 };
    return g;
  }
  function kcWrench() {
    var g = new T.Group(); keyRing(g, 0.92);
    var w = grp(g, 0, 0.42, 0); rot(w, 0, 0, 0.5); var M = metal('#ffcf3a');
    add(w, box(0.07, 0.4, 0.04), M, 0, 0, 0);
    var hd = add(w, tor(0.08, 0.03, Math.PI * 1.5, 8, 18), M, 0, 0.24, 0); hd.rotation.z = Math.PI * 0.75;
    add(w, cyl(0.05, 0.05, 0.04, 14), M, 0, -0.22, 0).rotation.x = Math.PI / 2;
    return g;
  }

  /* ---------- Grok Poke prizes ---------- */
  var CRIT = { embercub: { c: '#ff9f43', b: '#ffe0b8' }, puddlepup: { c: '#4fb3ff', b: '#d6f0ff' }, leafkit: { c: '#5dd66f', b: '#e3ffd9' } };
  function critterBody(par, k, matOverride) {
    var C = CRIT[k], M = matOverride || lam(C.c), Bm = matOverride || lam(C.b);
    var body = add(par, sph(0.2, 24), M, 0, 0.2, 0, 1, 0.95, 0.9);
    add(par, sph(0.13, 18), Bm, 0, 0.18, 0.1, 1, 1, 0.6);
    [-1, 1].forEach(function (sd) { add(par, sph(0.07, 12), M, sd * 0.11, 0.05, 0.08, 1, 0.7, 1.2); });
    var hd = grp(par, 0, 0.5, 0.02);
    add(hd, sph(0.2, 26), M, 0, 0, 0, 1.08, 0.98, 1);
    add(hd, sph(0.09, 14), Bm, 0, -0.06, 0.16, 1.2, 0.8, 0.6);
    eyes(hd, 0.02, 0.17, 0.08, 0.035); if (!matOverride) blush(hd, -0.04, 0.17, 0.13);
    smile(hd, -0.07, 0.2, 0.03);
    if (k === 'embercub') {
      [-1, 1].forEach(function (sd) { var e = add(hd, cone(0.07, 0.16, 12), M, sd * 0.12, 0.18, 0); rot(e, 0, 0, -sd * 0.35); });
      var tl = add(par, cone(0.07, 0.22, 12), matOverride || glow('#ffcf3a'), 0, 0.26, -0.22); rot(tl, -0.9, 0, 0);
      add(par, sph(0.06, 10), matOverride || glow('#ff6b2c'), 0, 0.33, -0.3);
    } else if (k === 'puddlepup') {
      [-1, 1].forEach(function (sd) { var e = add(hd, sph(0.07, 12), M, sd * 0.19, 0.0, -0.02, 0.6, 1.5, 1); rot(e, 0, 0, sd * 0.3); });
      var fin = add(hd, cone(0.06, 0.14, 10), lam('#2b8fe0'), 0, 0.2, -0.02, 0.5, 1, 1.4); void fin;
      add(par, sph(0.07, 12), M, 0, 0.16, -0.2, 1, 0.8, 1.4);
    } else {
      [-1, 1].forEach(function (sd) { var e = add(hd, sph(0.08, 12), lam('#2f9e44'), sd * 0.12, 0.17, 0, 0.45, 1.3, 0.25); rot(e, 0, 0, -sd * 0.45); });
      var lf = add(par, sph(0.1, 12), lam('#2f9e44'), 0, 0.3, -0.22, 0.4, 1.3, 0.3); rot(lf, -0.6, 0, 0);
    }
    return { body: body, head: hd };
  }
  function critterPlush(k) {
    var g = new T.Group(), b = grp(g, 0, 0, 0); var r = critterBody(b, k);
    tag(b, 0.15, 0.12, 0.12);
    g.userData.tick = function (t) { r.head.rotation.z = Math.sin(t * 1.6) * 0.08; r.head.position.y = 0.5 + Math.sin(t * 2.2) * 0.01; };
    return g;
  }
  function kcOrb() {
    var g = new T.Group(); keyRing(g, 0.9);
    var o = grp(g, 0, 0.42, 0);
    var top = add(o, new T.SphereGeometry(0.16, 26, 14, 0, Math.PI * 2, 0, Math.PI / 2), shiny('#ff4f6b', 80)); void top;
    add(o, new T.SphereGeometry(0.16, 26, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), shiny('#ffffff', 80));
    add(o, cyl(0.163, 0.163, 0.03, 26), lam('#222222'));
    var bt = add(o, cyl(0.05, 0.05, 0.03, 18), lam('#222222'), 0, 0, 0.155); bt.rotation.x = Math.PI / 2;
    var bt2 = add(o, cyl(0.032, 0.032, 0.035, 18), glow('#ffffff'), 0, 0, 0.165); bt2.rotation.x = Math.PI / 2;
    g.userData.tick = function (t) { o.rotation.y = Math.sin(t * 1.2) * 0.4; };
    return g;
  }
  function earsHat() {
    var g = new T.Group(), O = lam('#ff9f43');
    var band = add(g, tor(0.3, 0.035, Math.PI, 10, 28), O, 0, 0.06, 0); band.rotation.y = Math.PI / 2;
    [-1, 1].forEach(function (sd) { var e = add(g, cone(0.11, 0.24, 14), O, 0, 0.3, sd * 0.2); rot(e, sd * 0.35, 0, 0); var inr = add(g, cone(0.06, 0.14, 10), lam('#ffe0b8'), 0.04, 0.27, sd * 0.2); rot(inr, sd * 0.35, 0, 0); });
    add(g, sph(0.05, 10), glow('#ffcf3a'), 0, 0.33, 0);
    g.userData.hat = { y: 0.02, s: 0.75 };
    return g;
  }
  function shinyStatue() {
    var g = new T.Group(); stand(g, '#1f6b38', 0.8);
    var s = grp(g, 0, 0.08, 0); s.scale.setScalar(1.05);
    critterBody(s, 'embercub', metal('#ffcf3a'));
    var sp = [];
    for (var i = 0; i < 4; i++) sp.push(add(g, sph(0.035, 8), glow('#fff8b0'), 0, 0, 0));
    g.userData.tick = function (t) { s.rotation.y = Math.sin(t * 0.6) * 0.5; sp.forEach(function (m, i) { var a = t * 1.5 + i * 1.57; m.position.set(Math.cos(a) * 0.36, 0.45 + Math.sin(a * 1.3) * 0.2, Math.sin(a) * 0.3); }); };
    return g;
  }
  /* ---------- Hall of Game Records prizes ---------- */
  function gusPlush() {
    var g = new T.Group(), b = grp(g, 0, 0, 0), C = lam('#8a5a3b'), S = lam('#f1c7a5'), Gr = lam('#d6d6d6');
    add(b, sph(0.24, 24), C, 0, 0.24, 0, 1, 0.95, 0.85); add(b, sph(0.12, 16), lam('#dfe9f5'), 0, 0.3, 0.14, 0.8, 1.2, 0.5);
    [-1, 1].forEach(function (sd) { var bt = add(b, cone(0.045, 0.09, 10), lam('#b3123a'), sd * 0.045, 0.43, 0.18); rot(bt, 0, 0, sd * Math.PI / 2); add(b, sph(0.075, 12), C, sd * 0.24, 0.24, 0.04, 0.8, 1.3, 0.8); add(b, sph(0.07, 12), lam('#3b3b4a'), sd * 0.1, 0.03, 0.08, 1, 0.6, 1.3); });
    add(b, box(0.07, 0.035, 0.01), metal('#e8b84a'), -0.12, 0.34, 0.2);
    var hd = grp(b, 0, 0.62, 0.02); add(hd, sph(0.2, 26), S, 0, 0, 0, 1.05, 1, 0.95);
    [-1, 1].forEach(function (sd) { add(hd, sph(0.08, 12), Gr, sd * 0.18, 0.03, -0.04, 0.8, 1, 1.1); add(hd, sph(0.05, 10), S, sd * 0.2, -0.01, 0.02, 0.5, 1, 0.8);
      var br = add(hd, box(0.1, 0.03, 0.04), Gr, sd * 0.07, 0.1, 0.17); rot(br, 0, 0, -sd * 0.35);
      add(hd, tor(0.045, 0.007, 7, 6, 20), shiny('#2b2b2b', 80), sd * 0.07, 0.03, 0.19); add(hd, sph(0.02, 8), shiny('#16101f', 90), sd * 0.07, 0.03, 0.18);
      var mu = add(hd, sph(0.06, 12), Gr, sd * 0.05, -0.08, 0.17, 1.3, 0.55, 0.6); rot(mu, 0, 0, sd * 0.35); });
    add(hd, sph(0.045, 12), lam('#e8a98a'), 0, -0.02, 0.2);
    var fr = add(hd, tor(0.035, 0.008, Math.PI, 6, 12), lam('#6b2a2a'), 0, -0.15, 0.17); void fr;
    tag(b, 0.17, 0.12, 0.15);
    g.userData.tick = function (t) { hd.rotation.y = Math.sin(t * 0.8) * 0.25; hd.rotation.z = Math.sin(t * 1.3) * 0.05; };
    return g;
  }
  function kcStamp() {
    var g = new T.Group(); keyRing(g, 0.92);
    var s = grp(g, 0, 0.3, 0); add(s, sph(0.07, 14), lam('#5b3520'), 0, 0.22, 0, 1, 0.8, 1); add(s, cyl(0.035, 0.045, 0.16, 12), lam('#7a4a2a'), 0, 0.12, 0);
    add(s, box(0.2, 0.06, 0.14), shiny('#b3123a', 50), 0, 0.02, 0); add(s, box(0.18, 0.015, 0.12), lam('#ffd1dc'), 0, -0.016, 0);
    g.userData.tick = function (t) { s.position.y = 0.3 + Math.abs(Math.sin(t * 2)) * 0.04; };
    return g;
  }
  function dlcReplica() {
    var g = new T.Group(); stand(g, '#1c1f3a', 0.9);
    var B = shiny('#2a2f7a', 90), Ch = metal('#cfd8e6');
    add(g, box(0.5, 0.52, 0.28), B, 0, 0.36, 0); [-1, 1].forEach(function (sd) { add(g, cyl(0.13, 0.13, 0.52, 18), B, sd * 0.25, 0.36, 0); add(g, cyl(0.04, 0.04, 0.42, 12), new T.MeshPhongMaterial({ color: sd < 0 ? '#7df9ff' : '#ff9ad8', transparent: true, opacity: 0.6 }), sd * 0.32, 0.36, 0.08); add(g, cyl(0.135, 0.135, 0.02, 18), Ch, sd * 0.25, 0.62, 0); });
    add(g, new T.SphereGeometry(0.18, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshPhongMaterial({ color: '#bfe9ff', transparent: true, opacity: 0.3, shininess: 120, depthWrite: false }), 0, 0.62, 0);
    var core = add(g, new T.IcosahedronGeometry(0.07, 1), new T.MeshPhongMaterial({ color: '#ff4fd8', emissive: '#a0158a', flatShading: true }), 0, 0.7, 0);
    var ring = add(g, tor(0.11, 0.006, 7, 6, 30), glow('#ffe14d'), 0, 0.7, 0);
    var scr = texOf(128, 64, function (c, w, h) { c.fillStyle = '#04120f'; c.fillRect(0, 0, w, h); c.fillStyle = '#5dff8a'; c.font = 'bold 14px monospace'; c.textAlign = 'center'; c.fillText('DLC 3000', w / 2, 20); for (var i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#3ff0ff' : '#ff4fd8'; c.fillRect(10 + i * 14, 56 - (i % 4 + 1) * 7, 9, (i % 4 + 1) * 7); } });
    add(g, new T.PlaneGeometry(0.3, 0.15), new T.MeshBasicMaterial({ map: scr }), 0, 0.42, 0.142);
    var bulbs = []; for (var i = 0; i < 8; i++) bulbs.push(add(g, sph(0.012, 6), glow('#ffffff'), -0.21 + i * 0.06, 0.56, 0.142));
    ['#ff3d5a', '#ffe14d', '#4ade80'].forEach(function (c, i) { add(g, cyl(0.018, 0.018, 0.02, 10), glow(c), -0.1 + i * 0.07, 0.22, 0.15).rotation.x = Math.PI / 2; });
    var lv = add(g, cyl(0.008, 0.008, 0.12, 6), Ch, 0.17, 0.25, 0.15); void lv; add(g, sph(0.022, 10), shiny('#ff3d5a', 100), 0.17, 0.31, 0.15);
    g.userData.tick = function (t) { core.rotation.y = t * 2; core.rotation.x = t; ring.rotation.x = t * 1.3; var k = Math.floor(t * 6); bulbs.forEach(function (b, i) { b.material = glow((i + k) % 2 ? '#ffe14d' : '#ff4fd8'); }); };
    return g;
  }

  /* ---------- Grok Heist Crew prizes ---------- */
  function baronPlush() {
    var g = new T.Group(), b = grp(g, 0, 0, 0), suit = lam('#4c1d95'), skin = lam('#ffd9b8'), blk = lam('#1f1633');
    add(b, sph(0.21, 24), suit, 0, 0.2, 0, 1, 0.95, 0.9);
    add(b, box(0.12, 0.16, 0.05), lam('#f5f3ff'), 0, 0.26, 0.17); add(b, cone(0.035, 0.12, 4), lam('#b91c1c'), 0, 0.25, 0.2).rotation.x = Math.PI;
    [-1, 1].forEach(function (sd) { add(b, sph(0.075, 12), blk, sd * 0.11, 0.04, 0.07, 1.1, 0.6, 1.3); var a = add(b, sph(0.065, 12), suit, sd * 0.2, 0.24, 0.02, 1, 1.5, 1); rot(a, 0, 0, sd * 0.5); });
    var hd = grp(b, 0, 0.52, 0.02);
    add(hd, sph(0.19, 26), skin, 0, 0, 0, 1.05, 0.98, 1);
    eyes(hd, 0.02, 0.16, 0.075, 0.03); blush(hd, -0.04, 0.16, 0.12);
    var mo = add(hd, tor(0.045, 0.008, 7, 6, 20), metal('#ffcf3a'), 0.075, 0.02, 0.19); void mo;
    [-1, 1].forEach(function (sd) { var m = add(hd, sph(0.05, 12), lam('#6b4226'), sd * 0.05, -0.06, 0.17, 1.4, 0.45, 0.6); rot(m, 0, 0, -sd * 0.35); });
    add(hd, cyl(0.2, 0.2, 0.02, 24), blk, 0, 0.16, 0); add(hd, cyl(0.12, 0.12, 0.22, 22), blk, 0, 0.28, 0); add(hd, cyl(0.122, 0.122, 0.04, 22), lam('#a855f7'), 0, 0.2, 0);
    tag(b, 0.16, 0.12, 0.12);
    g.userData.tick = function (t) { hd.rotation.z = Math.sin(t * 1.3) * 0.07; hd.rotation.y = Math.sin(t * 0.7) * 0.15; };
    return g;
  }
  function gogglesHat() {
    var g = new T.Group(), D = lam('#1f2937'), F = lam('#374151'), LM = new T.MeshBasicMaterial({ color: '#4ade80' });
    var band = add(g, tor(0.3, 0.03, Math.PI, 10, 28), D, 0, 0.06, 0); band.rotation.y = Math.PI / 2;
    var lens = [];
    [-1, 1].forEach(function (sd) { var c = add(g, cyl(0.1, 0.11, 0.12, 20), F, 0.27, 0.2, sd * 0.11); c.rotation.z = Math.PI / 2; var l = add(g, cyl(0.075, 0.075, 0.02, 20), LM, 0.34, 0.2, sd * 0.11); l.rotation.z = Math.PI / 2; lens.push(l); add(g, tor(0.1, 0.012, 7, 6, 20), metal('#9aa1ad'), 0.335, 0.2, sd * 0.11).rotation.y = Math.PI / 2; });
    add(g, box(0.06, 0.05, 0.06), F, 0.29, 0.2, 0);
    g.userData.hat = { y: 0.02, s: 0.75 };
    g.userData.tick = function (t) { var k = 0.75 + Math.sin(t * 4) * 0.25; LM.color.setRGB(0.29 * k, 0.87 * k, 0.5 * k); };
    return g;
  }
  function kcBanana() {
    var g = new T.Group(); keyRing(g, 0.92);
    var b = grp(g, 0, 0.4, 0), Y = lam('#facc15');
    add(b, sph(0.08, 16), lam('#fde047'), 0, 0.06, 0, 1, 0.9, 1); add(b, cyl(0.018, 0.022, 0.08, 8), lam('#6b4226'), 0, 0.15, 0);
    [0, 2.1, 4.2].forEach(function (a) { var p = grp(b, 0, 0.02, 0); p.rotation.y = a; var f = add(p, sph(0.055, 12), Y, 0, -0.1, 0.07, 0.8, 1.9, 0.35); rot(f, -0.55, 0, 0); });
    g.userData.tick = function (t) { b.rotation.y = Math.sin(t * 1.4) * 0.5; };
    return g;
  }
  function moonstone() {
    var g = new T.Group(); stand(g, '#7f1d1d', 0.7);
    add(g, cyl(0.12, 0.15, 0.22, 20), lam('#ede9fe'), 0, 0.19, 0); add(g, cyl(0.14, 0.14, 0.03, 20), metal('#ffcf3a'), 0, 0.31, 0);
    var d = grp(g, 0, 0.55, 0), M = new T.MeshPhongMaterial({ color: '#bae6fd', emissive: '#0e7490', shininess: 140, specular: '#ffffff', flatShading: true });
    add(d, cone(0.17, 0.2, 8), M, 0, -0.06, 0).rotation.x = Math.PI; add(d, cyl(0.1, 0.17, 0.08, 8), M, 0, 0.08, 0);
    var halo = add(g, sph(0.26, 18), new T.MeshBasicMaterial({ color: '#a5f3fc', transparent: true, opacity: 0.18, depthWrite: false }), 0, 0.55, 0);
    var sp = []; for (var i = 0; i < 3; i++) sp.push(add(g, sph(0.025, 8), glow('#ffffff'), 0, 0, 0));
    g.userData.tick = function (t) { d.rotation.y = t * 0.9; d.position.y = 0.55 + Math.sin(t * 1.8) * 0.02; halo.scale.setScalar(1 + Math.sin(t * 3) * 0.06); sp.forEach(function (m, i) { var a = t * 1.6 + i * 2.1; m.position.set(Math.cos(a) * 0.3, 0.58 + Math.sin(a * 1.4) * 0.12, Math.sin(a) * 0.24); }); };
    return g;
  }
  function heistVan() {
    var g = new T.Group(); stand(g, '#3b0764', 1.0);
    var v = grp(g, 0, 0.1, 0), P = shiny('#7c3aed', 70), Gl = shiny('#bfe8ff', 90);
    add(v, box(0.7, 0.3, 0.34), P, 0, 0.21, 0); add(v, box(0.5, 0.12, 0.33), P, -0.08, 0.41, 0);
    add(v, box(0.2, 0.1, 0.345), Gl, 0.2, 0.41, 0); add(v, box(0.06, 0.1, 0.3), Gl, 0.355, 0.33, 0);
    add(v, box(0.705, 0.05, 0.345), lam('#ffd23f'), 0, 0.2, 0);
    [-1, 1].forEach(function (sd) { add(v, box(0.16, 0.08, 0.01), Gl, -0.15, 0.4, sd * 0.168); });
    [[0.22, 0.17], [0.22, -0.17], [-0.22, 0.17], [-0.22, -0.17]].forEach(function (w) { var t = add(v, cyl(0.075, 0.075, 0.06, 18), lam('#1a1a1a'), w[0], 0.06, w[1]); t.rotation.x = Math.PI / 2; var h = add(v, cyl(0.035, 0.035, 0.065, 12), metal('#c9ced8'), w[0], 0.06, w[1]); h.rotation.x = Math.PI / 2; });
    add(v, sph(0.035, 10), glow('#fff7c2'), 0.355, 0.2, 0.11); add(v, sph(0.035, 10), glow('#fff7c2'), 0.355, 0.2, -0.11);
    var bag = add(v, sph(0.08, 14), lam('#ffd23f'), -0.15, 0.53, 0, 1, 0.85, 1); add(v, cyl(0.02, 0.03, 0.04, 8), lam('#b45309'), -0.15, 0.61, 0);
    g.userData.tick = function (t) { v.rotation.y = Math.sin(t * 0.5) * 0.35; bag.position.y = 0.53 + Math.abs(Math.sin(t * 3)) * 0.015; };
    return g;
  }

  /* ---------- Grok Pickleball prizes ---------- */
  function pickleBall(par, r, x, y, z) { var b = add(par, sph(r, 22), lam('#e6ff3b'), x, y, z); var H = lam('#9bb315'); for (var i = 0; i < 10; i++) { var a = i * 2.4, e = Math.acos(1 - 2 * (i + 0.5) / 10); add(b, sph(r * 0.17, 8), H, Math.sin(e) * Math.cos(a) * r * 0.93, Math.cos(e) * r * 0.93, Math.sin(e) * Math.sin(a) * r * 0.93, 1, 1, 0.4).lookAt(0, 0, 0); } return b; }
  function picklePlush() {
    var g = new T.Group(), b = grp(g, 0, 0, 0), P = lam('#65a30d'), Pl = lam('#84cc16');
    var body = add(b, sph(0.17, 26), P, 0, 0.33, 0, 1, 1.75, 0.95); void body;
    for (var i = 0; i < 9; i++) add(b, sph(0.025, 8), Pl, Math.sin(i * 2.3) * 0.15, 0.15 + (i % 5) * 0.08, Math.cos(i * 2.3) * 0.13 + 0.02);
    [-1, 1].forEach(function (sd) { add(b, sph(0.06, 12), P, sd * 0.09, 0.05, 0.05, 1, 0.6, 1.3); var a = add(b, sph(0.05, 12), P, sd * 0.17, 0.3, 0.03, 1, 1.6, 1); rot(a, 0, 0, sd * 0.6); });
    var hd = grp(b, 0, 0.46, 0.1); eyes(hd, 0.02, 0.06, 0.06, 0.032); blush(hd, -0.04, 0.06, 0.1); smile(hd, -0.05, 0.075, 0.035);
    add(b, cyl(0.16, 0.17, 0.05, 20), lam('#ffffff'), 0, 0.58, 0); add(b, cyl(0.17, 0.17, 0.02, 20, 1), lam('#22c55e'), 0, 0.565, 0.02); // headband
    var pd = grp(b, 0.22, 0.28, 0.06); rot(pd, 0, 0, -0.5); var f = add(pd, cyl(0.09, 0.09, 0.02, 22), shiny('#3b82f6', 60), 0, 0.1, 0); f.rotation.x = Math.PI / 2; f.scale.set(1, 1, 1.25); add(pd, cyl(0.016, 0.018, 0.1, 10), lam('#3b2a1a'), 0, -0.02, 0);
    tag(b, 0.13, 0.12, 0.13);
    g.userData.tick = function (t) { b.rotation.z = Math.sin(t * 1.5) * 0.05; pd.rotation.z = -0.5 + Math.sin(t * 3) * 0.15; };
    return g;
  }
  function kcPickleball() {
    var g = new T.Group(); keyRing(g, 0.9);
    var o = grp(g, 0, 0.42, 0); pickleBall(o, 0.15, 0, 0, 0);
    g.userData.tick = function (t) { o.rotation.y = t * 0.8; o.position.y = 0.42 + Math.sin(t * 3) * 0.01; };
    return g;
  }
  function visorHat() {
    var g = new T.Group(), C = lam('#22c55e');
    var band = add(g, tor(0.3, 0.035, Math.PI * 1.3, 10, 30), C, 0, 0.06, 0); band.rotation.set(Math.PI / 2, 0, -Math.PI * 0.15 + Math.PI / 2);
    var br = add(g, new T.CylinderGeometry(0.34, 0.34, 0.02, 30, 1, false, -Math.PI * 0.35, Math.PI * 0.7), shiny('#16a34a', 40), 0.06, 0.07, 0); void br;
    add(g, box(0.02, 0.08, 0.14), lam('#ffffff'), 0.3, 0.1, 0);
    pickleBall(g, 0.045, 0.31, 0.11, 0.0);
    g.userData.hat = { y: 0.02, s: 0.75 };
    return g;
  }
  function paddleTrophy() {
    var g = new T.Group(); stand(g, '#14532d', 0.8);
    add(g, cyl(0.1, 0.13, 0.16, 20), metal('#ffcf3a'), 0, 0.16, 0);
    var pd = grp(g, 0, 0.5, 0), Gd = metal('#ffcf3a');
    var f = add(pd, cyl(0.17, 0.17, 0.03, 30), Gd, 0, 0.1, 0); f.rotation.x = Math.PI / 2; f.scale.set(1, 1, 1.3);
    add(pd, tor(0.17, 0.012, 7, 8, 32), metal('#b45309'), 0, 0.1, 0).scale.set(1, 1.3, 1);
    add(pd, cyl(0.03, 0.035, 0.2, 12), lam('#1f2937'), 0, -0.2, 0); add(pd, sph(0.035, 10), lam('#1f2937'), 0, -0.3, 0);
    var bl = grp(g, 0.24, 0.72, 0.05); pickleBall(bl, 0.06, 0, 0, 0);
    var sp = []; for (var i = 0; i < 3; i++) sp.push(add(g, sph(0.025, 8), glow('#fff8b0'), 0, 0, 0));
    g.userData.tick = function (t) { pd.rotation.y = Math.sin(t * 0.7) * 0.6; bl.position.y = 0.72 + Math.abs(Math.sin(t * 2.6)) * 0.08; sp.forEach(function (m, i) { var a = t * 1.5 + i * 2.1; m.position.set(Math.cos(a) * 0.32, 0.6 + Math.sin(a * 1.3) * 0.15, Math.sin(a) * 0.26); }); };
    return g;
  }
  /* ---------- Grok Disaster Zone prizes ---------- */
  function kcDuck() {
    var g = new T.Group(); keyRing(g, 0.9); var o = grp(g, 0, 0.42, 0), Y = shiny('#ffd60a', 70);
    add(o, sph(0.13, 24), Y, 0, 0, 0, 1.15, 0.85, 1); var hd = add(o, sph(0.085, 20), Y, 0, 0.12, 0.07); void hd;
    add(o, cone(0.035, 0.08, 12), lam('#ff7b00'), 0, 0.11, 0.17).rotation.x = Math.PI / 2; eyes(o, 0.14, 0.135, 0.045, 0.016);
    add(o, sph(0.06, 12), Y, 0, 0.03, -0.13, 1, 0.6, 1); add(g, cyl(0.16, 0.16, 0.02, 24), new T.MeshPhongMaterial({ color: '#48cae4', transparent: true, opacity: 0.55, shininess: 90 }), 0, 0.31, 0);
    g.userData.tick = function (t) { o.position.y = 0.42 + Math.sin(t * 2) * 0.02; o.rotation.z = Math.sin(t * 1.6) * 0.12; o.rotation.y = Math.sin(t * 0.7) * 0.6; };
    return g;
  }
  function hardHat() {
    var g = new T.Group(), Y = shiny('#facc15', 70);
    add(g, new T.SphereGeometry(0.26, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), Y, 0, 0.05, 0);
    add(g, cyl(0.34, 0.34, 0.025, 36), Y, 0, 0.05, 0.03).scale.set(1, 1, 1.12);
    add(g, box(0.05, 0.03, 0.42), shiny('#eab308', 60), 0, 0.27, 0).rotation.x = 0; add(g, tor(0.24, 0.012, Math.PI, 6, 20), shiny('#eab308', 60), 0, 0.06, 0).rotation.y = Math.PI / 2;
    add(g, cyl(0.045, 0.05, 0.05, 16), lam('#334155'), 0, 0.17, 0.235).rotation.x = Math.PI / 2 - 0.4; add(g, sph(0.035, 14), glow('#fffbe0'), 0, 0.18, 0.26);
    g.userData.hat = { y: 0.04, s: 0.8 };
    return g;
  }
  function roargonPlush() {
    var g = new T.Group(), b = grp(g, 0, 0, 0), P = lam('#7b5cd6'), Pd = lam('#6a4cc4'), Bl = lam('#f7d27e'), Sp = new T.MeshPhongMaterial({ color: '#5ff3ff', emissive: '#1aa9c4', shininess: 80 });
    add(b, sph(0.19, 24), P, 0, 0.22, 0, 1, 1.05, 0.95); add(b, sph(0.13, 18), Bl, 0, 0.21, 0.09, 1, 1.2, 0.5);
    [-1, 1].forEach(function (sd) { add(b, sph(0.075, 12), Pd, sd * 0.11, 0.06, 0.05, 1, 0.7, 1.3); var a = add(b, sph(0.05, 12), P, sd * 0.17, 0.27, 0.07, 1, 1.4, 1); rot(a, 0.5, 0, sd * 0.6); });
    var tl = grp(b, 0, 0.1, -0.16); add(tl, cone(0.09, 0.32, 16), P, 0, 0, -0.12).rotation.x = -Math.PI / 2 - 0.3;
    var hd = grp(b, 0, 0.5, 0.02); add(hd, sph(0.15, 24), P, 0, 0, 0, 1, 0.95, 1); add(hd, sph(0.1, 18), P, 0, -0.04, 0.11, 1.05, 0.75, 0.9);
    [[-0.035, 0.035], [0.035, 0.035]].forEach(function (q) { add(hd, cone(0.012, 0.03, 6), lam('#ffffff'), q[0], -0.085, 0.18 + q[1] * 0.3).rotation.x = Math.PI; });
    eyes(hd, 0.07, 0.13, 0.06, 0.028); blush(hd, 0.0, 0.13, 0.1);
    var sp = []; for (var i = 0; i < 5; i++) sp.push(add(b, cone(0.04 - i * 0.004, 0.1, 10), Sp, 0, 0.62 - i * 0.11, -0.1 - i * 0.03));
    sp.forEach(function (m, i) { m.rotation.x = -0.5 - i * 0.25; });
    tag(b, 0.16, 0.12, 0.1);
    g.userData.tick = function (t) { hd.rotation.z = Math.sin(t * 1.4) * 0.08; tl.rotation.y = Math.sin(t * 2) * 0.35; Sp.emissiveIntensity = 0.7 + Math.sin(t * 3) * 0.3; };
    return g;
  }
  function ufoModel() {
    var g = new T.Group(); add(g, cyl(0.22, 0.25, 0.08, 28), lam('#1e293b'), 0, 0.04, 0); add(g, cyl(0.03, 0.03, 0.22, 10), metal('#9aa5b1'), 0, 0.18, 0);
    var u = grp(g, 0, 0.42, 0); add(u, sph(0.3, 36), metal('#c7d0dc'), 0, 0, 0, 1, 0.22, 1);
    add(u, new T.SphereGeometry(0.13, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshPhongMaterial({ color: '#9be7ff', transparent: true, opacity: 0.6, shininess: 120 }), 0, 0.04, 0);
    add(u, sph(0.05, 14), lam('#7cff6b'), 0, 0.08, 0); eyes(u, 0.1, 0.045, 0.02, 0.012);
    var lights = []; for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2; lights.push(add(u, sph(0.022, 10), glow(i % 2 ? '#ff4fd8' : '#3ff0ff'), Math.cos(a) * 0.27, -0.01, Math.sin(a) * 0.27)); }
    var beam = add(g, new T.CylinderGeometry(0.06, 0.2, 0.3, 24, 1, true), new T.MeshBasicMaterial({ color: '#8dff9a', transparent: true, opacity: 0.35, side: T.DoubleSide, depthWrite: false }), 0, 0.24, 0); void beam;
    g.userData.tick = function (t) { u.rotation.y = t * 1.2; u.position.y = 0.42 + Math.sin(t * 1.8) * 0.02; lights.forEach(function (l, k) { l.visible = Math.floor(t * 6 + k) % 2 === 0; }); };
    return g;
  }
  function disasterCup() {
    var g = trophy('#ffcf3a', true), oldTick = g.userData.tick;
    var o = grp(g, 0, 0.75, 0);
    var m = grp(o, 0.36, 0, 0); add(m, sph(0.06, 16), lam('#8b5e3c'), 0, 0, 0); add(m, sph(0.03, 10), glow('#ff9f1c'), -0.03, 0.02, 0.04); add(m, cone(0.05, 0.14, 12), new T.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.6 }), 0.09, 0.06, 0).rotation.z = -1.1;
    var bs = new T.Shape(); bs.moveTo(0, 0.09); bs.lineTo(-0.035, 0); bs.lineTo(0, 0.005); bs.lineTo(-0.02, -0.09); bs.lineTo(0.04, 0.02); bs.lineTo(0.005, 0.015); bs.lineTo(0.03, 0.09);
    var bolt = add(o, G('dzbolt', function () { return new T.ExtrudeGeometry(bs, { depth: 0.02, bevelEnabled: false }); }), glow('#fde047'), -0.18, 0, 0.31);
    var sn = grp(o, -0.18, 0, -0.31); for (var i = 0; i < 3; i++) add(sn, box(0.11, 0.015, 0.015), shiny('#bde0fe', 90), 0, 0, 0).rotation.z = i * Math.PI / 3;
    g.userData.tick = function (t) { if (oldTick) oldTick(t); o.rotation.y = t * 0.8; o.position.y = 0.75 + Math.sin(t * 2) * 0.03; bolt.rotation.y = -t * 0.8; sn.rotation.z = t * 1.5; };
    return g;
  }
  /* ---------- Grok Sports Command prizes ---------- */
  function bBall(par, r, x, y, z) { var b = add(par, sph(r, 24), shiny('#f97316', 30), x, y, z); var L = lam('#3b1d0a');
    [0, Math.PI / 2].forEach(function (a) { var m = add(b, tor(r * 1.002, r * 0.04, 7, 6, 36), L); m.rotation.y = a; }); var e = add(b, tor(r * 1.002, r * 0.04, 7, 6, 36), L); e.rotation.x = Math.PI / 2; return b; }
  function mvpPlush() {
    var g = new T.Group(), b = grp(g, 0, 0, 0), F = lam('#a16207'), Fd = lam('#7c4a03'), J = lam('#2563eb');
    add(b, sph(0.17, 24), J, 0, 0.24, 0, 1, 1.05, 0.9); add(b, sph(0.12, 16), lam('#fde68a'), 0, 0.22, 0.08, 1, 1.1, 0.5);
    var num = add(b, box(0.06, 0.1, 0.01), lam('#facc15'), 0, 0.26, 0.16); void num;
    [-1, 1].forEach(function (sd) { add(b, sph(0.07, 12), F, sd * 0.1, 0.06, 0.06, 1, 0.7, 1.3); var a = add(b, sph(0.055, 12), F, sd * 0.16, 0.25, 0.08, 1, 1.5, 1); rot(a, 0.6, 0, sd * 0.5); });
    var hd = grp(b, 0, 0.5, 0); add(hd, sph(0.15, 24), F, 0, 0, 0);
    [-1, 1].forEach(function (sd) { add(hd, sph(0.055, 12), F, sd * 0.11, 0.11, -0.01); add(hd, sph(0.03, 10), lam('#fbcfe8'), sd * 0.11, 0.11, 0.03, 1, 1, 0.5); });
    add(hd, sph(0.065, 14), lam('#fde68a'), 0, -0.04, 0.12, 1, 0.8, 0.6); add(hd, sph(0.025, 10), shiny('#16101f', 90), 0, -0.02, 0.165);
    eyes(hd, 0.035, 0.142, 0.055, 0.026); blush(hd, -0.025, 0.125, 0.09);
    var bl = grp(b, 0, 0.2, 0.2); bBall(bl, 0.09, 0, 0, 0);
    tag(b, -0.15, 0.1, 0.1);
    g.userData.tick = function (t) { hd.rotation.z = Math.sin(t * 1.6) * 0.08; bl.rotation.y = t * 0.6; };
    return g;
  }
  function kcHoop() {
    var g = new T.Group(); keyRing(g, 0.9);
    var o = grp(g, 0, 0.5, 0); add(o, box(0.3, 0.2, 0.02), shiny('#f8fafc', 50), 0, 0.12, -0.02); add(o, box(0.1, 0.07, 0.005), lam('#ef4444'), 0, 0.08, 0);
    add(o, tor(0.075, 0.009, 7, 6, 24), shiny('#f97316', 80), 0, 0.02, 0.08).rotation.x = Math.PI / 2;
    add(o, new T.CylinderGeometry(0.075, 0.045, 0.1, 12, 1, true), new T.MeshLambertMaterial({ color: '#ffffff', wireframe: true }), 0, -0.03, 0.08);
    bBall(o, 0.05, 0, -0.04, 0.08);
    g.userData.tick = function (t) { o.rotation.y = Math.sin(t * 0.9) * 0.5; };
    return g;
  }
  function sweatband() {
    var g = new T.Group(); var bd = add(g, new T.CylinderGeometry(0.3, 0.3, 0.09, 36, 1, true), new T.MeshLambertMaterial({ color: '#2563eb', side: T.DoubleSide }), 0, 0.05, 0); void bd;
    add(g, tor(0.3, 0.012, 7, 6, 36), lam('#facc15'), 0, 0.005, 0).rotation.x = Math.PI / 2; add(g, tor(0.3, 0.012, 7, 6, 36), lam('#facc15'), 0, 0.095, 0).rotation.x = Math.PI / 2;
    var st = add(g, starGeo(0.05, 0.022, 0.01), metal('#facc15'), 0, 0.05, 0.305); void st;
    add(g, new T.CylinderGeometry(0.29, 0.29, 0.085, 36, 1, true), new T.MeshLambertMaterial({ color: '#1e3a8a', side: T.BackSide }), 0, 0.05, 0); // terry lining
    g.userData.hat = { y: 0.06, s: 0.75 };
    return g;
  }
  function goldenPin() {
    var g = new T.Group(); add(g, cyl(0.22, 0.25, 0.08, 28), lam('#4c1d95'), 0, 0.04, 0); add(g, cyl(0.2, 0.2, 0.02, 28), metal('#a855f7'), 0, 0.09, 0);
    var prof = [[0, 0], [0.06, 0], [0.085, 0.08], [0.095, 0.16], [0.08, 0.26], [0.045, 0.34], [0.04, 0.38], [0.055, 0.44], [0.055, 0.48], [0.035, 0.53], [0, 0.545]].map(function (p) { return new T.Vector2(p[0], p[1]); });
    var pin = grp(g, 0, 0.1, 0); add(pin, G('bpin', function () { return new T.LatheGeometry(prof, 28); }), metal('#ffcf3a'), 0, 0, 0);
    add(pin, cyl(0.043, 0.043, 0.012, 20), lam('#ef4444'), 0, 0.36, 0); add(pin, cyl(0.046, 0.046, 0.012, 20), lam('#ef4444'), 0, 0.395, 0);
    var orb = add(g, sph(0.065, 20), shiny('#a855f7', 100), 0.17, 0.165, 0.05);
    var sp = []; for (var i = 0; i < 3; i++) sp.push(add(g, sph(0.02, 8), glow('#fff8b0'), 0, 0, 0));
    g.userData.tick = function (t) { pin.rotation.y = t * 0.6; orb.position.set(Math.cos(t * 1.2) * 0.17, 0.165, Math.sin(t * 1.2) * 0.17); orb.rotation.x = t * 3; sp.forEach(function (m, k) { var a = t * 1.4 + k * 2.1; m.position.set(Math.cos(a) * 0.24, 0.35 + Math.sin(a * 1.3) * 0.15, Math.sin(a) * 0.2); }); };
    return g;
  }
  function sportsCup() {
    var g = trophy('#ffcf3a', true), oldTick = g.userData.tick;
    var o = grp(g, 0, 0.75, 0); var b1 = grp(o, 0.36, 0, 0); bBall(b1, 0.065, 0, 0, 0);
    var b2 = add(o, sph(0.06, 18), shiny('#ffffff', 60), -0.18, 0, 0.31); add(b2, sph(0.025, 8), lam('#111827'), 0, 0, 0.05); add(b2, sph(0.025, 8), lam('#111827'), 0.04, 0.03, -0.02);
    var b3 = add(o, sph(0.045, 16), lam('#e6ff3b'), -0.18, 0, -0.31); void b3;
    g.userData.tick = function (t) { if (oldTick) oldTick(t); o.rotation.y = t * 0.8; o.position.y = 0.75 + Math.sin(t * 2) * 0.03; };
    return g;
  }
  /* ---------- Grok Kart Party prizes ---------- */
  function checkTex() { return texOf(128, 32, function (c, w, h) { for (var i = 0; i < 16; i++) for (var j = 0; j < 4; j++) { c.fillStyle = (i + j) % 2 ? '#111827' : '#ffffff'; c.fillRect(i * 8, j * 8, 8, 8); } }); }
  var _ck = null; function checkMat() { return _ck || (_ck = new T.MeshLambertMaterial({ map: checkTex() })); }
  function kWheel(par, x, y, z, r) { var w = grp(par, x, y, z); add(w, cyl(r, r, r * 0.8, 24), lam('#1f2433'), 0, 0, 0).rotation.z = Math.PI / 2; add(w, cyl(r * 0.55, r * 0.55, r * 0.84, 18), shiny('#e5e7eb', 90), 0, 0, 0).rotation.z = Math.PI / 2; add(w, tor(r * 0.95, r * 0.12, 7, 8, 24), lam('#111827'), 0, 0, 0).rotation.y = Math.PI / 2; return w; }
  function chinPlush() {
    var g = new T.Group(), b = grp(g, 0, 0, 0), F = lam('#c7c9d1'), Fl = lam('#eef0f4');
    add(b, sph(0.19, 24), F, 0, 0.2, 0, 1.05, 0.95, 0.95); add(b, sph(0.12, 18), Fl, 0, 0.18, 0.1, 1, 1, 0.6);
    var sc = add(b, tor(0.13, 0.03, 7, 8, 24), lam('#ff4fd8'), 0, 0.36, 0); sc.rotation.x = Math.PI / 2; add(b, box(0.05, 0.14, 0.02), lam('#ff4fd8'), 0.1, 0.28, 0.12).rotation.z = 0.4;
    [-1, 1].forEach(function (sd) { add(b, sph(0.07, 12), F, sd * 0.12, 0.05, 0.08, 1, 0.6, 1.3); });
    var wh = grp(b, 0, 0.24, 0.2); add(wh, tor(0.07, 0.014, 7, 8, 24), lam('#1f2433'), 0, 0, 0); add(wh, box(0.12, 0.016, 0.01), lam('#1f2433'), 0, 0, 0);
    [-1, 1].forEach(function (sd) { add(b, sph(0.05, 12), F, sd * 0.07, 0.24, 0.18); });
    var hd = grp(b, 0, 0.5, 0); add(hd, sph(0.17, 26), lam('#d1d5db'), 0, 0, 0, 1.08, 0.95, 1);
    [-1, 1].forEach(function (sd) { var e = add(hd, sph(0.085, 16), F, sd * 0.14, 0.13, -0.02, 1, 1.1, 0.5); e.rotation.z = -sd * 0.4; add(hd, sph(0.055, 12), lam('#fbcfe8'), sd * 0.14, 0.13, 0.02, 1, 1.1, 0.3).rotation.z = -sd * 0.4; });
    eyes(hd, 0.02, 0.15, 0.065, 0.032); add(hd, sph(0.022, 10), lam('#f472b6'), 0, -0.04, 0.17); blush(hd, -0.04, 0.14, 0.1);
    var wm = new T.LineBasicMaterial({ color: '#94a3b8' }); [-1, 1].forEach(function (sd) { for (var k = -1; k <= 1; k++) { var ge = new T.BufferGeometry().setFromPoints([new T.Vector3(sd * 0.03, -0.04, 0.17), new T.Vector3(sd * 0.16, -0.03 + k * 0.03, 0.12)]); hd.add(new T.Line(ge, wm)); } });
    add(b, sph(0.07, 14), Fl, 0, 0.12, -0.2); // fluffy tail
    tag(b, -0.17, 0.12, 0.1);
    g.userData.tick = function (t) { hd.rotation.z = Math.sin(t * 1.7) * 0.08; wh.rotation.z = Math.sin(t * 2.2) * 0.5; };
    return g;
  }
  function seekerKc() {
    var g = new T.Group(); keyRing(g, 0.9);
    var o = grp(g, 0, 0.5, 0); add(o, sph(0.11, 22), shiny('#2563eb', 90), 0, 0, 0, 0.85, 1.25, 0.85); add(o, sph(0.06, 14), shiny('#93c5fd', 90), 0, 0.12, 0.02);
    add(o, sph(0.04, 14), glow('#ffffff'), 0, 0.01, 0.085); add(o, sph(0.022, 10), glow('#ff2d55'), 0, 0.01, 0.112);
    add(o, cyl(0.0, 0.05, 0.1, 14), glow('#ffd23f'), 0, -0.17, 0).rotation.x = Math.PI;
    [-1, 1].forEach(function (sd) { var f = add(o, box(0.1, 0.06, 0.012), shiny('#3ff0ff', 60), sd * 0.1, -0.05, 0); f.rotation.z = sd * 0.6; });
    g.userData.tick = function (t) { o.rotation.y = t * 1.2; o.position.y = 0.5 + Math.sin(t * 2) * 0.02; };
    return g;
  }
  function racingHelmet() {
    var g = new T.Group(), P = shiny('#ff4fd8', 110);
    var dome = add(g, sph(0.33, 32), P, 0, 0.08, 0); dome.geometry = new T.SphereGeometry(0.33, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.58);
    var visor = add(g, sph(0.335, 28), new T.MeshPhongMaterial({ color: '#3ff0ff', shininess: 140, specular: '#ffffff', transparent: true, opacity: 0.85 }), 0, 0.08, 0);
    visor.geometry = new T.SphereGeometry(0.335, 28, 10, -0.9, 1.8, Math.PI * 0.32, Math.PI * 0.2); visor.rotation.y = 0;
    var stripe = add(g, sph(0.336, 24), new T.MeshLambertMaterial({ map: checkTex() }), 0, 0.08, 0); stripe.geometry = new T.SphereGeometry(0.336, 24, 10, -0.12, 0.24, 0, Math.PI * 0.55); stripe.rotation.y = Math.PI;
    var bolt = add(g, starGeo(0.05, 0.02, 0.01), metal('#ffd23f'), 0.24, 0.2, 0.14); bolt.lookAt(0.6, 0.4, 0.4);
    add(g, tor(0.33, 0.02, 7, 8, 40), lam('#1f2433'), 0, 0.09, 0).rotation.x = Math.PI / 2;
    g.userData.hat = { y: 0.02, s: 0.78 };
    return g;
  }
  function partyKart() {
    var g = new T.Group(); add(g, cyl(0.34, 0.37, 0.07, 32), lam('#1f2433'), 0, 0.035, 0);
    var top = add(g, cyl(0.33, 0.33, 0.02, 32), checkMat(), 0, 0.08, 0); void top;
    var k = grp(g, 0, 0.2, 0), R = shiny('#e11d48', 120);
    add(k, box(0.22, 0.08, 0.36), R, 0, 0, 0); add(k, sph(0.11, 18), R, 0, 0.02, 0.15, 1, 0.6, 0.9);
    [-1, 1].forEach(function (sd) { add(k, sph(0.04, 12), shiny('#ffffff', 90), sd * 0.15, -0.01, 0, 1, 1, 3); });
    add(k, box(0.12, 0.08, 0.06), lam('#1f2433'), 0, 0.07, -0.06);
    var hd = add(k, box(0.12, 0.1, 0.1), shiny('#e8f1ff', 80), 0, 0.17, -0.02); add(hd, box(0.09, 0.03, 0.01), glow('#3ff0ff'), 0, 0.01, 0.052); add(hd, cyl(0.006, 0.006, 0.06, 6), lam('#ff4fd8'), 0, 0.08, 0); add(hd, sph(0.015, 8), glow('#ff4fd8'), 0, 0.11, 0);
    var W = [kWheel(k, -0.14, -0.04, 0.12, 0.05), kWheel(k, 0.14, -0.04, 0.12, 0.05), kWheel(k, -0.15, -0.035, -0.13, 0.06), kWheel(k, 0.15, -0.035, -0.13, 0.06)];
    [-1, 1].forEach(function (sd) { add(k, cyl(0.016, 0.02, 0.06, 10), shiny('#cbd5e1', 90), sd * 0.05, 0.02, -0.2).rotation.x = Math.PI / 2 - 0.4; });
    var fl = [-1, 1].map(function (sd) { var f = add(k, cyl(0.0, 0.025, 0.1, 10), glow('#c084fc'), sd * 0.05, 0.03, -0.26); f.rotation.x = -Math.PI / 2 + 0.4; return f; });
    g.userData.tick = function (t) { k.rotation.y = t * 0.5; W.forEach(function (w) { w.rotation.x = t * 6; }); fl.forEach(function (f, i) { f.scale.set(1, 0.8 + Math.abs(Math.sin(t * 18 + i)) * 0.5, 1); }); k.position.y = 0.2 + Math.abs(Math.sin(t * 3)) * 0.01; };
    return g;
  }
  function kartCup() {
    var g = trophy('#ffcf3a', true), oldTick = g.userData.tick;
    var pole = add(g, cyl(0.008, 0.008, 0.36, 8), lam('#6b4423'), 0.3, 0.42, 0); void pole;
    var fl = add(g, new T.PlaneGeometry(0.2, 0.12, 8, 1), new T.MeshLambertMaterial({ map: checkTex(), side: T.DoubleSide }), 0.4, 0.54, 0);
    var wh = grp(g, 0, 1.05, 0); add(wh, tor(0.09, 0.016, 7, 8, 30), lam('#1f2433'), 0, 0, 0); add(wh, box(0.17, 0.02, 0.016), lam('#1f2433'), 0, 0, 0); add(wh, sph(0.025, 10), metal('#ffcf3a'), 0, 0, 0);
    var pos = fl.geometry.attributes.position, base = pos.array.slice();
    g.userData.tick = function (t) { if (oldTick) oldTick(t); wh.rotation.z = t * 1.5; wh.rotation.y = Math.sin(t) * 0.4; for (var i = 0; i < pos.count; i++) { var x = base[i * 3]; pos.setZ(i, Math.sin(t * 5 + x * 30) * 0.015 * (x + 0.1) * 5); } pos.needsUpdate = true; };
    return g;
  }
  var BUILD = {
    kc_snake: kcSnake, kc_joy: kcJoy, poster_arcade: function () { return poster('arcade'); }, poster_brawl: function () { return poster('brawl'); }, cap: cap, propeller: propeller,
    pl_luna: function () { return rat('luna'); }, pl_pirat: function () { return rat('pirat'); }, pl_snowie: function () { return rat('snowie'); },
    pl_invader: invader, pl_candy: candy, pl_brutus: brutus, tr_ring: ringTrophy,
    pl_goob: goob, pl_boo: boo, pl_waltzy: waltzy, vac_replica: vacReplica, kc_flash: kcFlash, goo_jar: gooJar, lava_lamp: lavaLamp,
    pl_grokloon: grokloonPlush, rides_monster: ridesMonster, taxi_hat: taxiHat, kc_wrench: kcWrench,
    pl_baron: baronPlush, goggles_hat: gogglesHat, kc_banana: kcBanana, moonstone: moonstone, heist_van: heistVan,
    pl_pickle: picklePlush, kc_pball: kcPickleball, pb_visor: visorHat, tr_paddle: paddleTrophy,
    pl_chinchino: chinPlush, kc_seeker: seekerKc, kart_helmet: racingHelmet, kart_model: partyKart, tr_kart: kartCup,
    pl_mvp: mvpPlush, kc_hoop: kcHoop, sw_band: sweatband, gold_pin: goldenPin, tr_sports: sportsCup,
    kc_duck: kcDuck, hard_hat: hardHat, pl_roargon: roargonPlush, ufo_model: ufoModel, tr_disaster: disasterCup,
    pl_embercub: function () { return critterPlush('embercub'); }, pl_puddlepup: function () { return critterPlush('puddlepup'); }, pl_leafkit: function () { return critterPlush('leafkit'); }, kc_orb: kcOrb, ears_hat: earsHat, shiny_statue: shinyStatue, pl_gus: gusPlush, kc_stamp: kcStamp, dlc_replica: dlcReplica,
    pl_zebra: zebraPlush, pl_rhino: rhinoPlush, pl_leopard: leopardPlush, ranger_hat: rangerHat, kc_dart: kcDart, snow_globe: snowGlobe, rescue_truck: rescueTruck,
    pl_dash: function () { return dashHero('grok'); }, pl_speedy: function () { return dashHero('speedy'); }, pl_floaty: function () { return dashHero('floaty'); },
    fc_ball: fcBall, gary_bobble: gary, land_fig: landFig, sky_plane: skyPlane, grid_car: gridCar,
    tr_bronze: function () { return trophy('#cd7f32'); }, tr_silver: function () { return trophy('#c0c7d0'); }, tr_gold: function () { return trophy('#ffcf3a', true); }, golden_joy: goldenJoy
  };
  Object.keys(FIGHTERS).forEach(function (k) { BUILD['pl_' + k] = function () { return fighter(k); }; });
  var HATS = { cap: 1, propeller: 1, ranger_hat: 1, taxi_hat: 1, ears_hat: 1, goggles_hat: 1, pb_visor: 1, sw_band: 1, kart_helmet: 1, hard_hat: 1 };

  function build(id) {
    if (/^ach:/.test(id)) return medal(id.slice(4));
    var f = BUILD[id], g;
    try { g = f ? f() : null; } catch (e) { g = null; if (window.console) console.warn('prize model failed', id, e); }
    if (!g) { g = new T.Group(); add(g, starGeo(0.3, 0.13, 0.08), metal('#ffe14d'), 0, 0.5, 0); }
    g.userData.id = id;
    // measure so callers can scale (most models are ~1 unit tall)
    var bb = new T.Box3().setFromObject(g); g.userData.size = bb.getSize(new T.Vector3()); g.userData.center = bb.getCenter(new T.Vector3());
    return g;
  }

  /* ---------- achievement medals ---------- */
  var CAT_COL = { Tickets: ['#ffcf3a', '#ff4fd8', '#ffe14d'], Prizes: ['#ff9ad8', '#ff4fd8', '#3ff0ff'], Arcade: ['#7ff0ff', '#3ff0ff', '#a78bfa'], Antenna: ['#c4b5fd', '#a78bfa', '#4ade80'], 'High Scores': ['#ffb066', '#ff7a3d', '#ffe14d'], Claw: ['#7df9ff', '#22d3ee', '#c084fc'] };
  function achById(id) { return (GA.ACHIEVEMENTS || []).find(function (a) { return a.id === id; }); }
  function medal(achId, locked) {
    var a = achById(achId) || { name: 'Achievement', icon: '\u2B50', cat: 'Arcade', desc: '' };
    var C = CAT_COL[a.cat] || CAT_COL.Arcade, face = locked ? '#6b6585' : C[0];
    var g = new T.Group(), d = grp(g, 0, 0.36, 0);
    add(d, cyl(0.3, 0.3, 0.06, 40), metal(face), 0, 0, 0).rotation.x = Math.PI / 2;
    add(d, tor(0.3, 0.035, 7, 10, 44), metal(locked ? '#8d87a8' : '#ffe9a0'), 0, 0, 0);
    var front = texOf(256, 256, function (c, w, h) {
      var gr = c.createRadialGradient(w * 0.4, h * 0.35, 10, w / 2, h / 2, w / 2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.25, face); gr.addColorStop(1, new T.Color(face).multiplyScalar(0.55).getStyle());
      c.fillStyle = gr; c.beginPath(); c.arc(w / 2, h / 2, w / 2, 0, 7); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 5; c.setLineDash([10, 8]); c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 16, 0, 7); c.stroke(); c.setLineDash([]);
      c.font = '120px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      if (locked) { c.globalAlpha = 0.6; c.fillText('\uD83D\uDD12', w / 2, h / 2 + 8); } else c.fillText(a.icon, w / 2, h / 2 + 8);
    });
    var back = texOf(256, 256, function (c, w, h) {
      c.fillStyle = new T.Color(face).multiplyScalar(0.75).getStyle(); c.beginPath(); c.arc(w / 2, h / 2, w / 2, 0, 7); c.fill();
      c.fillStyle = '#2a1a3a'; c.textAlign = 'center'; c.textBaseline = 'middle';
      var words = a.name.toUpperCase().split(' '), lines = [], cur = '';
      words.forEach(function (wd) { if ((cur + ' ' + wd).trim().length > 11) { if (cur) lines.push(cur); cur = wd; } else cur = (cur + ' ' + wd).trim(); }); if (cur) lines.push(cur);
      var px = lines.length > 2 ? 30 : 36; c.font = 'bold ' + px + 'px "Trebuchet MS",sans-serif';
      lines.forEach(function (ln, i) { c.fillText(ln, w / 2, h / 2 + (i - (lines.length - 1) / 2) * (px + 6)); });
      c.font = 'bold 20px sans-serif'; c.fillText('\u2605 GROK ARCADE \u2605', w / 2, h - 46);
    });
    var fm = new T.Mesh(new T.CircleGeometry(0.29, 40), new T.MeshPhongMaterial({ map: front, shininess: 80, specular: '#ffffff' })); fm.position.z = 0.032; d.add(fm);
    var bm = new T.Mesh(new T.CircleGeometry(0.29, 40), new T.MeshPhongMaterial({ map: back, shininess: 80, specular: '#ffffff' })); bm.position.z = -0.032; bm.rotation.y = Math.PI; d.add(bm);
    // ribbon
    add(g, tor(0.05, 0.012, 7, 6, 16), metal('#ffe9a0'), 0, 0.69, 0);
    [-1, 1].forEach(function (sd) { var r = add(g, box(0.14, 0.42, 0.012), lam(sd < 0 ? C[1] : C[2]), sd * 0.07, 0.92, -0.01); r.rotation.z = sd * 0.28; });
    g.userData.id = 'ach:' + achId; g.userData.medal = true;
    var bb = new T.Box3().setFromObject(g); g.userData.size = bb.getSize(new T.Vector3()); g.userData.center = bb.getCenter(new T.Vector3());
    return g;
  }

  GA.Prize3D = { build: build, medal: medal, isHat: function (id) { return !!HATS[id]; }, ids: Object.keys(BUILD),
    // extension point (claw machine prizes add their own models)
    register: function (id, fn) { BUILD[id] = fn; GA.Prize3D.ids = Object.keys(BUILD); },
    H: { add: add, sph: sph, box: box, cyl: cyl, cone: cone, tor: tor, lam: lam, shiny: shiny, metal: metal, glow: glow, grp: grp, rot: rot, eyes: eyes, blush: blush, smile: smile, tag: tag, starGeo: starGeo, G: G } };
})();
