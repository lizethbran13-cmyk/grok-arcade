/* Grok Arcade - claw-machine-exclusive prizes (18 mini plushies + trinkets).
   They can't be bought at the Prize Counter: you win them in the Easy / Tricky Claw. The machines' contents rotate
   every 3 days through GA.CLAW_SETS. Each prize has a real 3D model (Prize3D) and hand-drawn icon art (PrizeArt). */
(function () {
  'use strict';
  var T = THREE;
  GA.PRIZE_CATS.push({ id: 'claw', name: 'Claw Catches', icon: '\uD83E\uDE9D' });
  var LIST = [
    // set A
    { id: 'cl_martina', name: 'Mini Martina', r: 0.12, desc: 'A pocket-size desert tortoise plush. Slow, steady, and very huggable.' },
    { id: 'cl_duck', name: 'Neon Rubber Duck', r: 0.11, desc: 'A squeaky duck in cool pink shades. Quack!' },
    { id: 'cl_donut', name: 'Sprinkle Donut', r: 0.115, desc: 'A squishy strawberry donut with rainbow sprinkles and a happy face.' },
    { id: 'cl_frog', name: 'Froggo', r: 0.12, desc: 'A chubby green frog with rosy cheeks and a tiny gold crown.' },
    { id: 'cl_bunny', name: 'Bun Bun', r: 0.115, desc: 'A fluffy white bunny with extra-floppy ears.' },
    { id: 'cl_gem', name: 'Mega Glow Gem', r: 0.105, rare: true, desc: 'RARE! A glowing crystal with a little smile. Shiny!' },
    // set B
    { id: 'cl_pupcandy', name: 'Pocket Candy', r: 0.12, desc: 'A chibi Candy head with her famous schnauzer beard and eyebrows.' },
    { id: 'cl_mushroom', name: 'Mushy', r: 0.115, desc: 'A red-capped mushroom buddy straight out of Grok Land.' },
    { id: 'cl_octo', name: 'Octo Pal', r: 0.12, desc: 'A purple octopus who gives the best eight-arm hugs.' },
    { id: 'cl_neko', name: 'Lucky Neko', r: 0.115, desc: 'A waving lucky cat with a golden bell. Brings good claw luck!' },
    { id: 'cl_slime', name: 'Rainbow Slime', r: 0.12, desc: 'A wobbly rainbow slime. Somehow it is always smiling.' },
    { id: 'cl_star', name: 'Star Pillow', r: 0.115, rare: true, desc: 'RARE! A sparkly golden star pillow for sleepy gamers.' },
    // set C
    { id: 'cl_cheeserat', name: 'Cheesy Rat', r: 0.12, desc: 'An official arcade rat hugging a big wedge of cheese.' },
    { id: 'cl_dice', name: 'Fuzzy Dice', r: 0.115, desc: 'A pair of fuzzy pink and cyan dice. Roll for luck!' },
    { id: 'cl_pengu', name: 'Pengu', r: 0.115, desc: 'A little penguin in a cozy red scarf.' },
    { id: 'cl_ghostlet', name: 'Ghostlet', r: 0.115, desc: 'A tiny lilac ghost with a bow. It escaped from Grok Spooks!' },
    { id: 'cl_axo', name: 'Axo', r: 0.12, desc: 'A pink axolotl with frilly gills and a permanent grin.' },
    { id: 'cl_ufo', name: 'Mini UFO', r: 0.115, rare: true, desc: 'RARE! A flying saucer with a little green alien waving from the dome.' }
  ];
  LIST.forEach(function (p) { GA.PRIZES.push({ id: p.id, cat: 'claw', name: p.name, price: 0, claw: true, rare: !!p.rare, r: p.r, desc: p.desc }); });
  GA.CLAW_SETS = [LIST.slice(0, 6).map(function (p) { return p.id; }), LIST.slice(6, 12).map(function (p) { return p.id; }), LIST.slice(12, 18).map(function (p) { return p.id; })];
  GA.isClawPrize = function (id) { var p = GA.findPrize(id); return !!(p && p.claw); };

  /* ================= 3D models (about 1 unit tall, standing on y=0, facing +z) ================= */
  var H = GA.Prize3D.H, add = H.add, sph = H.sph, box = H.box, cyl = H.cyl, cone = H.cone, tor = H.tor, lam = H.lam, shiny = H.shiny, metal = H.metal, glow = H.glow, grp = H.grp, rot = H.rot, eyes = H.eyes, blush = H.blush, smile = H.smile, tag = H.tag;
  function emis(c, k) { return new T.MeshLambertMaterial({ color: c, emissive: new T.Color(c).multiplyScalar(k || 0.3) }); }
  var M3 = {
    cl_martina: function () {
      var g = new T.Group(), shell = '#8a6a3a', dk = '#5e4524', skin = '#c9a56b';
      [[-0.24, 0.24], [0.24, 0.24], [-0.24, -0.2], [0.24, -0.2]].forEach(function (q) { add(g, sph(0.11, 12), lam(skin), q[0], 0.08, q[1], 1, 0.75, 1); });
      add(g, sph(0.4, 26), lam(shell), 0, 0.3, -0.02, 1, 0.72, 1.08);
      add(g, cyl(0.41, 0.41, 0.06, 26), lam('#d9c08a'), 0, 0.16, -0.02, 1, 1, 1.08);
      [[0, 0.58, 0], [-0.2, 0.46, 0.16], [0.2, 0.46, 0.16], [-0.2, 0.46, -0.2], [0.2, 0.46, -0.2], [0, 0.48, 0.26], [0, 0.48, -0.3]].forEach(function (q) { add(g, sph(0.1, 10), lam(dk), q[0], q[1], q[2], 1, 0.35, 1); });
      var h = grp(g, 0, 0.3, 0.42); add(h, sph(0.17, 18), lam(skin)); eyes(h, 0.05, 0.13, 0.07, 0.035); smile(h, -0.04, 0.155, 0.04); blush(h, -0.01, 0.13, 0.11);
      tag(g, 0.3, 0.2, -0.3); return g;
    },
    cl_duck: function () {
      var g = new T.Group(), Y = '#ffd84a';
      add(g, sph(0.34, 24), lam(Y), 0, 0.3, -0.04, 1.05, 0.85, 1.2);
      add(g, cone(0.12, 0.2, 10), lam(Y), 0, 0.42, -0.42).rotation.x = -1.2;
      var h = grp(g, 0, 0.7, 0.1); add(h, sph(0.24, 22), lam(Y));
      var bk = add(h, sph(0.11, 14), lam('#ff8a1f'), 0, -0.04, 0.23, 1.3, 0.45, 0.9);
      [-1, 1].forEach(function (sd) { add(h, box(0.13, 0.08, 0.03), shiny('#ff4fd8', 90), sd * 0.08, 0.06, 0.21); });
      add(h, box(0.06, 0.02, 0.02), shiny('#ff4fd8', 90), 0, 0.07, 0.22); blush(h, -0.04, 0.18, 0.15);
      [-1, 1].forEach(function (sd) { add(g, sph(0.12, 12), lam('#ffc21a'), sd * 0.3, 0.32, 0, 0.5, 0.8, 1.1); });
      return g;
    },
    cl_donut: function () {
      var g = new T.Group(), d = grp(g, 0, 0.47, 0); d.rotation.x = 0.15;
      add(d, tor(0.27, 0.15, 7, 14, 30), lam('#e0a35a'));
      var ic = add(d, tor(0.27, 0.13, 7, 12, 30), lam('#ff8fc8'), 0, 0, 0.05, 1, 1, 0.75);
      var cols = ['#3ff0ff', '#ffe14d', '#4ade80', '#ffffff', '#a78bfa'];
      for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2 + 0.2, rr = 0.27 + (i % 3 - 1) * 0.06; var s = add(d, box(0.06, 0.018, 0.018), lam(cols[i % 5]), Math.cos(a) * rr, Math.sin(a) * rr, 0.16); s.rotation.z = a * 2.3; }
      eyes(d, -0.2, 0.15, 0.08, 0.035); smile(d, -0.28, 0.16, 0.04); blush(d, -0.25, 0.14, 0.15);
      add(g, cyl(0.2, 0.24, 0.05, 20), lam('#c084fc'), 0, 0.025, 0); return g;
    },
    cl_frog: function () {
      var g = new T.Group(), G2 = '#5bd06a';
      add(g, sph(0.38, 24), lam(G2), 0, 0.32, 0, 1.1, 0.82, 1);
      add(g, sph(0.27, 20), lam('#c9f5b0'), 0, 0.26, 0.14, 1, 0.8, 0.8);
      [-1, 1].forEach(function (sd) { add(g, sph(0.13, 16), lam(G2), sd * 0.17, 0.62, 0.08); add(g, sph(0.08, 12), shiny('#16101f', 90), sd * 0.17, 0.64, 0.18, 1, 1.1, 0.6); add(g, sph(0.03, 8), glow('#ffffff'), sd * 0.17 - 0.03, 0.67, 0.22); add(g, sph(0.12, 12), lam(G2), sd * 0.3, 0.06, 0.22, 1, 0.5, 1.2); });
      var sm = add(g, tor(0.14, 0.018, Math.PI * 0.8, 6, 16), lam('#3a1020'), 0, 0.46, 0.33); rot(sm, 0, 0, Math.PI + Math.PI * 0.1);
      blush(g, 0.44, 0.31, 0.26);
      var cr = grp(g, 0, 0.72, 0); add(cr, cyl(0.1, 0.1, 0.06, 14), metal('#ffcf3a'));
      [0, 1, 2, 3, 4].forEach(function (i) { var a = i / 5 * Math.PI * 2; add(cr, cone(0.025, 0.07, 6), metal('#ffcf3a'), Math.cos(a) * 0.09, 0.06, Math.sin(a) * 0.09); });
      return g;
    },
    cl_bunny: function () {
      var g = new T.Group(), W = '#fbf7ff', P = '#ffb3d1';
      add(g, sph(0.3, 22), lam(W), 0, 0.27, 0, 1, 0.9, 0.95);
      var h = grp(g, 0, 0.62, 0.04); add(h, sph(0.24, 22), lam(W));
      [-1, 1].forEach(function (sd) { var e = grp(h, sd * 0.1, 0.2, -0.02); e.rotation.z = sd * -0.25; add(e, sph(0.07, 12), lam(W), 0, 0.18, 0, 1, 2.8, 0.7); add(e, sph(0.04, 10), lam(P), 0, 0.18, 0.03, 1, 2.6, 0.5); });
      eyes(h, 0.03, 0.2, 0.08, 0.035); add(h, sph(0.03, 8), lam('#ff6b9a'), 0, -0.04, 0.235); blush(h, -0.05, 0.2, 0.14);
      add(g, sph(0.09, 12), lam(W), 0, 0.2, -0.3); [-1, 1].forEach(function (sd) { add(g, sph(0.08, 10), lam(W), sd * 0.15, 0.06, 0.18, 1, 0.7, 1.3); });
      tag(g, 0.22, 0.25, -0.24); return g;
    },
    cl_gem: function () {
      var g = new T.Group();
      add(g, cyl(0.22, 0.27, 0.1, 6), metal('#ffcf3a'), 0, 0.05, 0);
      var gm = add(g, H.G('clgem', function () { return new T.OctahedronGeometry(0.34, 0); }), new T.MeshPhongMaterial({ color: '#3ff0ff', emissive: new T.Color('#0b7d93'), shininess: 140, specular: '#ffffff', flatShading: true }), 0, 0.52, 0, 0.85, 1.25, 0.85);
      eyes(g, 0.56, 0.17, 0.07, 0.03); smile(g, 0.47, 0.18, 0.035);
      var sp = []; for (var i = 0; i < 3; i++) sp.push(add(g, H.starGeo(0.04, 0.015, 0.01), glow('#fffbe0'), 0, 0, 0));
      g.userData.tick = function (t) { gm.rotation.y = Math.sin(t * 0.8) * 0.4; sp.forEach(function (s, k) { var a = t + k * 2.1; s.position.set(Math.cos(a) * 0.36, 0.55 + Math.sin(t * 2 + k) * 0.2, Math.sin(a) * 0.36); }); };
      return g;
    },
    cl_pupcandy: function () {
      var g = new T.Group(), gr = '#7b8088', W = '#eceef2';
      var h = grp(g, 0, 0.42, 0); add(h, sph(0.36, 24), lam(gr), 0, 0, 0, 1, 0.95, 0.95);
      add(h, sph(0.2, 18), lam('#9ea3ab'), 0, -0.06, 0.24, 1.1, 0.8, 0.9);
      add(h, sph(0.18, 16), lam(W), 0, -0.2, 0.25, 1.15, 1, 0.8);
      [-1, 1].forEach(function (sd) { add(h, box(0.16, 0.05, 0.06), lam(W), sd * 0.12, 0.12, 0.3).rotation.z = sd * -0.25; var e = add(h, sph(0.12, 12), lam('#4e5259'), sd * 0.3, 0.2, 0, 0.6, 1, 0.9); rot(e, 0, 0, sd * 0.7); });
      eyes(h, 0.04, 0.31, 0.12, 0.04); add(h, sph(0.06, 12), shiny('#111111', 90), 0, -0.02, 0.44, 1.2, 0.9, 0.8);
      var col = add(g, tor(0.24, 0.04, 7, 8, 24), lam('#ff7ab6'), 0, 0.1, 0); col.rotation.x = Math.PI / 2;
      add(g, sph(0.05, 10), metal('#ffd23b'), 0, 0.06, 0.24); add(g, cyl(0.2, 0.22, 0.06, 18), lam('#ff7ab6'), 0, 0.03, 0);
      return g;
    },
    cl_mushroom: function () {
      var g = new T.Group();
      add(g, cyl(0.17, 0.21, 0.4, 20), lam('#fff4e0'), 0, 0.2, 0);
      eyes(g, 0.24, 0.17, 0.07, 0.035); smile(g, 0.15, 0.19, 0.04); blush(g, 0.18, 0.16, 0.13);
      var cap = add(g, H.G('clcap', function () { return new T.SphereGeometry(0.4, 26, 14, 0, Math.PI * 2, 0, Math.PI / 2); }), lam('#e8323a'), 0, 0.38, 0, 1, 0.95, 1);
      add(g, cyl(0.4, 0.4, 0.04, 26), lam('#f6d7b0'), 0, 0.39, 0);
      [[0, 0.76, 0], [0.24, 0.6, 0.18], [-0.24, 0.6, 0.18], [0.26, 0.58, -0.18], [-0.22, 0.6, -0.22], [0, 0.64, 0.3]].forEach(function (q) { add(g, sph(0.065, 10), lam('#ffffff'), q[0], q[1], q[2], 1, 0.5, 1); });
      return g;
    },
    cl_octo: function () {
      var g = new T.Group(), P = '#a259ff';
      for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2 + 0.5; var t = add(g, sph(0.09, 12), lam(P), Math.cos(a) * 0.28, 0.07, Math.sin(a) * 0.28, 1.4, 0.7, 1); t.rotation.y = -a; add(g, sph(0.04, 8), lam('#ffc6f0'), Math.cos(a) * 0.38, 0.06, Math.sin(a) * 0.38); }
      add(g, sph(0.36, 24), lam(P), 0, 0.46, 0, 1, 1.05, 1);
      eyes(g, 0.5, 0.3, 0.12, 0.05); smile(g, 0.38, 0.33, 0.05); blush(g, 0.42, 0.29, 0.21);
      [[0.15, 0.78, 0.12], [-0.18, 0.72, 0.16], [0.02, 0.84, -0.1]].forEach(function (q) { add(g, sph(0.04, 8), lam('#d1a6ff'), q[0], q[1], q[2], 1, 0.6, 1); });
      return g;
    },
    cl_neko: function () {
      var g = new T.Group(), W = '#fffaf2';
      add(g, sph(0.3, 22), lam(W), 0, 0.28, 0, 1, 0.95, 0.9);
      var h = grp(g, 0, 0.66, 0.02); add(h, sph(0.26, 22), lam(W), 0, 0, 0, 1.1, 0.95, 1);
      [-1, 1].forEach(function (sd) { var e = add(h, cone(0.09, 0.14, 4), lam(W), sd * 0.16, 0.22, 0); rot(e, 0, 0, sd * -0.3); add(h, cone(0.05, 0.08, 4), lam('#ffb3c6'), sd * 0.16, 0.21, 0.03).rotation.z = sd * -0.3; });
      [-1, 1].forEach(function (sd) { var c = H.G('clnekoeye', function () { return new T.TorusGeometry(0.035, 0.01, 6, 12, Math.PI); }); var m = add(h, c, lam('#2a1a10'), sd * 0.1, 0.03, 0.25); rot(m, 0, 0, 0); });
      add(h, sph(0.025, 8), lam('#ff8fb4'), 0, -0.04, 0.27); blush(h, -0.05, 0.23, 0.16);
      [-1, 1].forEach(function (sd) { add(h, box(0.1, 0.008, 0.008), lam('#c8a88a'), sd * 0.2, -0.04, 0.22); });
      var arm = grp(g, 0.27, 0.5, 0.06); add(arm, sph(0.08, 12), lam(W), 0, 0.1, 0, 0.9, 1.6, 0.9); add(arm, sph(0.06, 10), lam('#ffb3c6'), 0, 0.22, 0.04, 1, 0.8, 0.5);
      var col = add(g, tor(0.17, 0.03, 7, 8, 20), lam('#e8323a'), 0, 0.5, 0.02); col.rotation.x = Math.PI / 2;
      add(g, sph(0.055, 12), metal('#ffcf3a'), 0, 0.44, 0.19);
      g.userData.tick = function (t) { arm.rotation.z = Math.sin(t * 4) * 0.35; };
      return g;
    },
    cl_slime: function () {
      var g = new T.Group();
      add(g, sph(0.4, 24), emis('#ff6b8a', 0.25), 0, 0.17, 0, 1, 0.42, 1);
      add(g, sph(0.33, 24), emis('#ffd23f', 0.25), 0, 0.33, 0, 1, 0.5, 1);
      add(g, sph(0.26, 22), emis('#4ade80', 0.25), 0, 0.48, 0, 1, 0.6, 1);
      add(g, sph(0.18, 20), emis('#3ff0ff', 0.25), 0, 0.62, 0, 1, 0.75, 1);
      add(g, sph(0.1, 14), emis('#a78bfa', 0.3), 0, 0.74, 0);
      eyes(g, 0.4, 0.31, 0.1, 0.045); smile(g, 0.3, 0.36, 0.05);
      return g;
    },
    cl_star: function () {
      var g = new T.Group(), s = grp(g, 0, 0.5, 0);
      var st = add(s, H.starGeo(0.46, 0.22, 0.2), new T.MeshPhongMaterial({ color: '#ffd23f', emissive: new T.Color('#7a5a00'), shininess: 60 }), 0, 0, -0.1);
      eyes(s, 0.02, 0.12, 0.08, 0.04); smile(s, -0.08, 0.12, 0.05); blush(s, -0.05, 0.11, 0.17);
      var sp = []; for (var i = 0; i < 3; i++) sp.push(add(g, H.starGeo(0.035, 0.013, 0.01), glow('#fffbe0'), 0, 0, 0));
      g.userData.tick = function (t) { s.rotation.y = Math.sin(t * 0.9) * 0.3; sp.forEach(function (q, k) { var a = t * 0.8 + k * 2.1; q.position.set(Math.cos(a) * 0.5, 0.5 + Math.sin(t * 2 + k) * 0.3, Math.sin(a) * 0.3); }); };
      return g;
    },
    cl_cheeserat: function () {
      var g = new T.Group(), W = '#e6e9f0';
      var tl = add(g, tor(0.22, 0.025, Math.PI * 1.2, 6, 18), lam('#ffb3c6'), 0.1, 0.12, -0.3); tl.rotation.x = Math.PI / 2;
      add(g, sph(0.3, 22), lam(W), 0, 0.3, -0.06, 0.95, 1, 1);
      var h = grp(g, 0, 0.62, 0.02); add(h, sph(0.22, 20), lam(W), 0, 0, 0, 1, 0.95, 1.05); add(h, cone(0.1, 0.16, 12), lam(W), 0, -0.04, 0.22).rotation.x = Math.PI / 2;
      add(h, sph(0.03, 8), lam('#ff6b9a'), 0, -0.04, 0.31);
      [-1, 1].forEach(function (sd) { add(h, sph(0.11, 14), lam(W), sd * 0.18, 0.16, -0.02, 1, 1, 0.35); add(h, sph(0.075, 12), lam('#ffb3c6'), sd * 0.18, 0.16, 0.02, 1, 1, 0.3); });
      eyes(h, 0.05, 0.17, 0.08, 0.035); blush(h, -0.03, 0.18, 0.14);
      var ch = add(g, H.G('clcheese', function () { return new T.CylinderGeometry(0.2, 0.2, 0.16, 3); }), lam('#ffd23f'), 0, 0.34, 0.26); ch.rotation.set(Math.PI / 2, 0, Math.PI / 6);
      [[-0.06, 0.37, 0.35], [0.05, 0.3, 0.35]].forEach(function (q) { add(g, sph(0.03, 8), lam('#e0a800'), q[0], q[1], q[2], 1, 1, 0.3); });
      [-1, 1].forEach(function (sd) { add(g, sph(0.06, 10), lam('#ffd0dc'), sd * 0.15, 0.36, 0.3); });
      tag(g, 0.24, 0.22, -0.2); return g;
    },
    cl_dice: function () {
      var g = new T.Group();
      function die(col, x, y, z, ry, n) {
        var d = grp(g, x, y, z); d.rotation.y = ry; add(d, box(0.36, 0.36, 0.36), lam(col));
        var pips = { 1: [[0, 0]], 3: [[-0.1, 0.1], [0, 0], [0.1, -0.1]], 5: [[-0.1, 0.1], [0.1, 0.1], [0, 0], [-0.1, -0.1], [0.1, -0.1]] }[n];
        pips.forEach(function (q) { add(d, sph(0.032, 8), lam('#ffffff'), q[0], q[1], 0.18, 1, 1, 0.35); });
        [[0, 0]].forEach(function () { add(d, sph(0.032, 8), lam('#ffffff'), 0, 0.18, 0, 1, 0.35, 1); });
        return d;
      }
      die('#ff6bd6', -0.17, 0.18, 0.04, 0.3, 5); die('#3ff0ff', 0.18, 0.18, -0.02, -0.35, 3);
      var s = add(g, tor(0.17, 0.012, Math.PI, 6, 16), lam('#ffffff'), 0, 0.42, 0); s.rotation.z = 0;
      return g;
    },
    cl_pengu: function () {
      var g = new T.Group();
      add(g, sph(0.32, 24), lam('#232338'), 0, 0.42, 0, 1, 1.3, 0.95);
      add(g, sph(0.25, 22), lam('#ffffff'), 0, 0.38, 0.1, 1, 1.25, 0.8);
      eyes(g, 0.62, 0.27, 0.08, 0.035); add(g, cone(0.05, 0.1, 10), lam('#ff9a1f'), 0, 0.55, 0.32).rotation.x = Math.PI / 2;
      blush(g, 0.53, 0.26, 0.14);
      [-1, 1].forEach(function (sd) { var f = add(g, sph(0.08, 10), lam('#232338'), sd * 0.31, 0.38, 0, 0.5, 1.4, 0.9); rot(f, 0, 0, sd * 0.4); add(g, sph(0.08, 10), lam('#ff9a1f'), sd * 0.12, 0.03, 0.12, 1, 0.45, 1.4); });
      var sc = add(g, tor(0.24, 0.05, 7, 8, 22), lam('#e8323a'), 0, 0.5, 0); sc.rotation.x = Math.PI / 2;
      add(g, box(0.09, 0.2, 0.04), lam('#e8323a'), 0.12, 0.38, 0.24).rotation.z = 0.2;
      return g;
    },
    cl_ghostlet: function () {
      var g = new T.Group(), b = grp(g, 0, 0.04, 0), m = emis('#d9b8ff', 0.3);
      add(b, sph(0.3, 24), m, 0, 0.55, 0, 1, 1.05, 1); add(b, cyl(0.3, 0.33, 0.32, 24), m, 0, 0.36, 0);
      for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; add(b, sph(0.08, 10), m, Math.cos(a) * 0.27, 0.2, Math.sin(a) * 0.27); }
      [-1, 1].forEach(function (sd) { add(b, sph(0.08, 12), m, sd * 0.34, 0.45, 0.05, 1.2, 0.8, 0.8); });
      eyes(b, 0.6, 0.27, 0.1, 0.05); add(b, sph(0.04, 10), lam('#3a1020'), 0, 0.47, 0.29, 1.2, 1, 0.4); blush(b, 0.5, 0.26, 0.17);
      var bow = grp(b, 0.16, 0.83, 0.08); [-1, 1].forEach(function (sd) { add(bow, sph(0.07, 10), lam('#ff4fd8'), sd * 0.07, 0, 0, 1.2, 0.8, 0.5); }); add(bow, sph(0.035, 8), lam('#ff8fe0'));
      g.userData.tick = function (t) { b.position.y = 0.04 + Math.sin(t * 2.4) * 0.04; };
      return g;
    },
    cl_axo: function () {
      var g = new T.Group(), P = '#ffaad4';
      add(g, sph(0.3, 22), lam(P), 0, 0.22, -0.12, 0.9, 0.75, 1.3);
      var tl = add(g, sph(0.12, 12), lam('#ff8fc8'), 0, 0.24, -0.48, 0.4, 1, 1.4);
      var h = grp(g, 0, 0.5, 0.16); add(h, sph(0.27, 22), lam(P), 0, 0, 0, 1.15, 0.9, 1);
      [-1, 1].forEach(function (sd) { for (var k = 0; k < 3; k++) { var gi = add(h, sph(0.05, 8), lam('#ff4f8b'), sd * 0.3, 0.13 - k * 0.1, -0.04, 1.8, 0.6, 0.6); gi.rotation.z = sd * (0.6 - k * 0.5); } });
      eyes(h, 0.04, 0.22, 0.13, 0.04); smile(h, -0.07, 0.25, 0.07); blush(h, -0.04, 0.22, 0.2);
      [-1, 1].forEach(function (sd) { add(g, sph(0.07, 10), lam(P), sd * 0.24, 0.06, 0.08, 1, 0.6, 1.3); add(g, sph(0.07, 10), lam(P), sd * 0.22, 0.06, -0.3, 1, 0.6, 1.3); });
      return g;
    },
    cl_ufo: function () {
      var g = new T.Group(), u = grp(g, 0, 0.3, 0);
      add(g, cyl(0.06, 0.18, 0.3, 14), new T.MeshBasicMaterial({ color: '#b8ffcf', transparent: true, opacity: 0.35, depthWrite: false }), 0, 0.15, 0);
      add(u, sph(0.44, 28), shiny('#b8c0d0', 90), 0, 0, 0, 1, 0.3, 1);
      add(u, tor(0.42, 0.03, 7, 8, 32), metal('#ff4fd8'), 0, 0, 0).rotation.x = Math.PI / 2;
      var al = grp(u, 0, 0.12, 0); add(al, sph(0.11, 16), lam('#4ade80'), 0, 0.09, 0, 1, 1.1, 1); eyes(al, 0.1, 0.09, 0.045, 0.025);
      [-1, 1].forEach(function (sd) { add(al, cyl(0.008, 0.008, 0.08, 6), lam('#4ade80'), sd * 0.05, 0.22, 0); add(al, sph(0.02, 8), glow('#ffe14d'), sd * 0.05, 0.27, 0); });
      add(u, H.G('cldome', function () { return new T.SphereGeometry(0.22, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2); }), new T.MeshPhongMaterial({ color: '#9ff7ff', transparent: true, opacity: 0.35, shininess: 140, specular: '#ffffff', depthWrite: false }), 0, 0.08, 0);
      var lights = []; for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; lights.push(add(u, sph(0.035, 8), glow(i % 2 ? '#ffe14d' : '#3ff0ff'), Math.cos(a) * 0.36, -0.04, Math.sin(a) * 0.36)); }
      g.userData.tick = function (t) { u.rotation.y = t * 0.8; u.position.y = 0.3 + Math.sin(t * 2) * 0.03; lights.forEach(function (l, k) { l.visible = Math.sin(t * 6 + k) > -0.3; }); };
      return g;
    }
  };
  Object.keys(M3).forEach(function (id) { GA.Prize3D.register(id, M3[id]); });

  /* ================= 2D icon art (100x100) ================= */
  var A = GA.PrizeArt.H, ball = A.ball, slab = A.slab, rr = A.rr, shadow = A.shadow, shine = A.shine, eye = A.eye, star = A.star, smile2 = A.smile, blush2 = A.blush, sparkle = A.sparkle, tag2 = A.tag, lt = A.lt, dk = A.dk;
  function face(g, x, y, s) { s = s || 1; eye(g, x - 8 * s, y, 3.4 * s); eye(g, x + 8 * s, y, 3.4 * s); blush2(g, x - 14 * s, y + 7 * s); blush2(g, x + 14 * s, y + 7 * s); smile2(g, x, y + 9 * s, 4.5 * s); }
  var D2 = {
    cl_martina: function (g) { shadow(g, 50, 92, 34); [[26, 82], [74, 82], [34, 70], [66, 70]].forEach(function (q) { ball(g, q[0], q[1], 9, 7, '#c9a56b'); }); ball(g, 50, 62, 34, 22, '#8a6a3a'); [[50, 50], [36, 58], [64, 58], [44, 68], [58, 68]].forEach(function (q) { ball(g, q[0], q[1], 8, 5, '#5e4524'); }); slab(g, 18, 70, 64, 7, 3, '#d9c08a'); ball(g, 76, 44, 16, 15, '#c9a56b'); eye(g, 72, 40, 2.6); eye(g, 82, 40, 2.6); smile2(g, 77, 48, 3.5); blush2(g, 70, 47); tag2(g, 22, 66); },
    cl_duck: function (g) { shadow(g, 50, 92, 32); ball(g, 50, 70, 32, 20, '#ffd84a'); ball(g, 50, 38, 20, 19, '#ffd84a'); ball(g, 66, 44, 11, 5, '#ff8a1f'); slab(g, 36, 31, 13, 8, 3, '#ff4fd8'); slab(g, 53, 31, 13, 8, 3, '#ff4fd8'); g.fillStyle = '#ff4fd8'; g.fillRect(48, 34, 6, 2); shine(g, 40, 30, 5, 2, 0.6); ball(g, 30, 70, 9, 12, '#ffc21a', 0.3); blush2(g, 40, 47); },
    cl_donut: function (g) { shadow(g, 50, 93, 30); g.lineWidth = 22; g.strokeStyle = '#e0a35a'; g.beginPath(); g.arc(50, 50, 26, 0, 7); g.stroke(); g.lineWidth = 17; g.strokeStyle = '#ff8fc8'; g.beginPath(); g.arc(50, 48, 26, 0, 7); g.stroke(); ['#3ff0ff', '#ffe14d', '#4ade80', '#ffffff', '#a78bfa'].forEach(function (c, i) { for (var k = 0; k < 3; k++) { var a = (i * 3 + k) * 0.42; g.save(); g.translate(50 + Math.cos(a) * 26, 48 + Math.sin(a) * 26); g.rotate(a * 2.3); g.fillStyle = c; g.fillRect(-4, -1.2, 8, 2.4); g.restore(); } }); eye(g, 42, 76, 2.6); eye(g, 58, 76, 2.6); smile2(g, 50, 84, 3.5); },
    cl_frog: function (g) { shadow(g, 50, 92, 34); ball(g, 50, 62, 36, 26, '#5bd06a'); ball(g, 50, 70, 24, 15, '#c9f5b0'); ball(g, 34, 36, 12, 12, '#5bd06a'); ball(g, 66, 36, 12, 12, '#5bd06a'); eye(g, 34, 36, 6); eye(g, 66, 36, 6); g.strokeStyle = '#3a1020'; g.lineWidth = 2.4; g.beginPath(); g.arc(50, 52, 13, 0.4, Math.PI - 0.4); g.stroke(); blush2(g, 26, 58); blush2(g, 74, 58); g.fillStyle = A.metal(g, 40, 60, '#ffcf3a'); g.beginPath(); g.moveTo(40, 26); g.lineTo(42, 16); g.lineTo(46, 22); g.lineTo(50, 13); g.lineTo(54, 22); g.lineTo(58, 16); g.lineTo(60, 26); g.closePath(); g.fill(); },
    cl_bunny: function (g) { shadow(g, 50, 92, 28); ball(g, 38, 22, 7, 18, '#fbf7ff', -0.25); ball(g, 62, 22, 7, 18, '#fbf7ff', 0.25); ball(g, 38, 23, 3.5, 13, '#ffb3d1', -0.25); ball(g, 62, 23, 3.5, 13, '#ffb3d1', 0.25); ball(g, 50, 74, 26, 18, '#fbf7ff'); ball(g, 50, 48, 21, 19, '#fbf7ff'); face(g, 50, 48, 0.9); ball(g, 50, 52, 2.5, 2, '#ff6b9a'); tag2(g, 66, 76); },
    cl_gem: function (g) { var gl = g.createRadialGradient(50, 46, 4, 50, 46, 46); gl.addColorStop(0, 'rgba(63,240,255,0.5)'); gl.addColorStop(1, 'rgba(63,240,255,0)'); g.fillStyle = gl; g.fillRect(0, 0, 100, 100); shadow(g, 50, 92, 26); slab(g, 30, 80, 40, 10, 3, '#ffcf3a'); g.fillStyle = '#3ff0ff'; g.beginPath(); g.moveTo(50, 8); g.lineTo(74, 44); g.lineTo(50, 82); g.lineTo(26, 44); g.closePath(); g.fill(); g.fillStyle = '#9ff7ff'; g.beginPath(); g.moveTo(50, 8); g.lineTo(50, 82); g.lineTo(26, 44); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.moveTo(50, 12); g.lineTo(38, 40); g.lineTo(44, 40); g.closePath(); g.fill(); eye(g, 43, 48, 2.6); eye(g, 57, 48, 2.6); smile2(g, 50, 56, 3); sparkle(g, 80, 18, 6); sparkle(g, 18, 30, 4); },
    cl_pupcandy: function (g) { shadow(g, 50, 92, 30); slab(g, 26, 82, 48, 8, 4, '#ff7ab6'); ball(g, 50, 50, 32, 30, '#7b8088'); ball(g, 22, 34, 9, 13, '#4e5259', 0.6); ball(g, 78, 34, 9, 13, '#4e5259', -0.6); ball(g, 50, 72, 20, 14, '#eceef2'); slab(g, 30, 34, 16, 5, 2, '#eceef2'); slab(g, 54, 34, 16, 5, 2, '#eceef2'); eye(g, 39, 46, 3.6); eye(g, 61, 46, 3.6); ball(g, 50, 58, 6, 5, '#111111'); ball(g, 50, 84, 4, 4, '#ffd23b'); },
    cl_mushroom: function (g) { shadow(g, 50, 92, 26); slab(g, 34, 50, 32, 38, 10, '#fff4e0'); face(g, 50, 66, 0.8); g.fillStyle = '#e8323a'; g.beginPath(); g.ellipse(50, 48, 40, 34, 0, Math.PI, 0); g.fill(); g.fillStyle = '#f6d7b0'; rr(g, 10, 46, 80, 6, 3); g.fill(); [[50, 24, 7], [30, 36, 6], [70, 36, 6], [40, 20, 4], [62, 22, 4]].forEach(function (q) { ball(g, q[0], q[1], q[2], q[2] * 0.75, '#ffffff'); }); shine(g, 28, 28, 6, 3, 0.4); },
    cl_octo: function (g) { shadow(g, 50, 93, 34); for (var i = 0; i < 6; i++) { var x = 20 + i * 12; ball(g, x, 84, 7, 9, '#a259ff'); ball(g, x, 90, 3, 2, '#ffc6f0'); } ball(g, 50, 52, 32, 32, '#a259ff'); face(g, 50, 54, 1.1); [[64, 28], [36, 32], [52, 22]].forEach(function (q) { ball(g, q[0], q[1], 3.5, 2.5, '#d1a6ff'); }); },
    cl_neko: function (g) { shadow(g, 50, 92, 28); ball(g, 50, 74, 25, 18, '#fffaf2'); g.fillStyle = '#fffaf2'; [[30, 1], [70, -1]].forEach(function (q) { g.beginPath(); g.moveTo(q[0] - 10, 34); g.lineTo(q[0] + q[1] * 2, 12); g.lineTo(q[0] + 10, 34); g.fill(); }); ball(g, 50, 42, 26, 22, '#fffaf2'); g.fillStyle = '#ffb3c6'; g.beginPath(); g.moveTo(26, 30); g.lineTo(31, 18); g.lineTo(36, 30); g.fill(); g.beginPath(); g.moveTo(64, 30); g.lineTo(69, 18); g.lineTo(74, 30); g.fill(); g.strokeStyle = '#2a1a10'; g.lineWidth = 2; [41, 59].forEach(function (x) { g.beginPath(); g.arc(x, 42, 4, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }); ball(g, 50, 49, 2.4, 2, '#ff8fb4'); blush2(g, 36, 50); blush2(g, 64, 50); ball(g, 82, 52, 7, 12, '#fffaf2'); slab(g, 30, 60, 40, 6, 3, '#e8323a'); ball(g, 50, 67, 5, 5, '#ffcf3a'); },
    cl_slime: function (g) { var c = ['#ff6b8a', '#ffd23f', '#4ade80', '#3ff0ff', '#a78bfa']; shadow(g, 50, 92, 36); ball(g, 50, 80, 40, 12, c[0]); ball(g, 50, 68, 33, 12, c[1]); ball(g, 50, 56, 26, 12, c[2]); ball(g, 50, 44, 18, 11, c[3]); ball(g, 50, 32, 9, 8, c[4]); eye(g, 42, 62, 3.4); eye(g, 58, 62, 3.4); smile2(g, 50, 70, 4); },
    cl_star: function (g) { var gl = g.createRadialGradient(50, 50, 4, 50, 50, 48); gl.addColorStop(0, 'rgba(255,214,64,0.5)'); gl.addColorStop(1, 'rgba(255,214,64,0)'); g.fillStyle = gl; g.fillRect(0, 0, 100, 100); shadow(g, 50, 93, 28); star(g, 50, 52, 42, '#e0a800'); star(g, 50, 50, 40, '#ffd23f'); face(g, 50, 52, 0.9); sparkle(g, 84, 16, 6); sparkle(g, 14, 22, 4); },
    cl_cheeserat: function (g) { shadow(g, 50, 92, 32); g.strokeStyle = '#ffb3c6'; g.lineWidth = 3; g.beginPath(); g.moveTo(74, 80); g.quadraticCurveTo(94, 70, 86, 50); g.stroke(); ball(g, 50, 70, 26, 20, '#e6e9f0'); ball(g, 32, 24, 10, 10, '#e6e9f0'); ball(g, 68, 24, 10, 10, '#e6e9f0'); ball(g, 32, 24, 6, 6, '#ffb3c6'); ball(g, 68, 24, 6, 6, '#ffb3c6'); ball(g, 50, 40, 21, 18, '#e6e9f0'); face(g, 50, 40, 0.85); ball(g, 50, 46, 2.6, 2.2, '#ff6b9a'); g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(30, 82); g.lineTo(70, 82); g.lineTo(62, 60); g.closePath(); g.fill(); g.fillStyle = '#e0a800'; [[52, 72, 3], [60, 77, 2.4], [44, 78, 2]].forEach(function (q) { g.beginPath(); g.arc(q[0], q[1], q[2], 0, 7); g.fill(); }); },
    cl_dice: function (g) { shadow(g, 50, 92, 36); function die(x, y, col, rot, n) { g.save(); g.translate(x, y); g.rotate(rot); slab(g, -17, -17, 34, 34, 8, col); g.fillStyle = '#fff'; ({ 3: [[-8, -8], [0, 0], [8, 8]], 5: [[-8, -8], [8, -8], [0, 0], [-8, 8], [8, 8]] })[n].forEach(function (q) { g.beginPath(); g.arc(q[0], q[1], 3, 0, 7); g.fill(); }); g.restore(); } g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(30, 44); g.quadraticCurveTo(50, 20, 70, 44); g.stroke(); die(32, 66, '#ff6bd6', -0.2, 5); die(68, 64, '#3ff0ff', 0.25, 3); },
    cl_pengu: function (g) { shadow(g, 50, 93, 26); ball(g, 50, 56, 26, 34, '#232338'); ball(g, 50, 60, 19, 27, '#ffffff'); ball(g, 26, 58, 6, 14, '#232338', 0.4); ball(g, 74, 58, 6, 14, '#232338', -0.4); eye(g, 42, 40, 3.2); eye(g, 58, 40, 3.2); g.fillStyle = '#ff9a1f'; g.beginPath(); g.moveTo(45, 47); g.lineTo(55, 47); g.lineTo(50, 54); g.fill(); slab(g, 26, 52, 48, 7, 3, '#e8323a'); slab(g, 58, 56, 8, 16, 2, '#e8323a'); ball(g, 40, 90, 8, 3, '#ff9a1f'); ball(g, 60, 90, 8, 3, '#ff9a1f'); },
    cl_ghostlet: function (g) { var gl = g.createRadialGradient(50, 48, 4, 50, 48, 46); gl.addColorStop(0, 'rgba(217,184,255,0.5)'); gl.addColorStop(1, 'rgba(217,184,255,0)'); g.fillStyle = gl; g.fillRect(0, 0, 100, 100); shadow(g, 50, 92, 26); var x = 50, y = 58, s = 1; var gr = g.createRadialGradient(42, 40, 2, 50, 58, 36); gr.addColorStop(0, '#f6eeff'); gr.addColorStop(0.5, '#d9b8ff'); gr.addColorStop(1, '#9a74d6'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 26, y + 22); g.lineTo(x - 26, y - 4); g.bezierCurveTo(x - 26, y - 40, x + 26, y - 40, x + 26, y - 4); g.lineTo(x + 26, y + 22); for (var i = 0; i < 4; i++) { var x0 = x + 26 - i * 13; g.quadraticCurveTo(x0 - 3, y + 30, x0 - 6.5, y + 22); g.quadraticCurveTo(x0 - 10, y + 14, x0 - 13, y + 22); } g.closePath(); g.fill(); face(g, 50, 52, 0.9); ball(g, 60, 24, 6, 4, '#ff4fd8'); ball(g, 72, 24, 6, 4, '#ff4fd8'); ball(g, 66, 24, 3, 3, '#ff8fe0'); },
    cl_axo: function (g) { shadow(g, 50, 92, 34); ball(g, 50, 72, 30, 16, '#ffaad4'); ball(g, 84, 74, 10, 6, '#ff8fc8'); [[-1, 0], [1, 0]].forEach(function (q) { for (var k = 0; k < 3; k++) ball(g, 50 + q[0] * 30, 30 + k * 9, 9, 3.5, '#ff4f8b', q[0] * (0.6 - k * 0.5)); }); ball(g, 50, 44, 28, 22, '#ffaad4'); eye(g, 38, 42, 3.6); eye(g, 62, 42, 3.6); g.strokeStyle = '#3a1020'; g.lineWidth = 2; g.beginPath(); g.arc(50, 46, 10, 0.3, Math.PI - 0.3); g.stroke(); blush2(g, 30, 52); blush2(g, 70, 52); },
    cl_ufo: function (g) { var gl = g.createRadialGradient(50, 50, 4, 50, 50, 46); gl.addColorStop(0, 'rgba(184,255,207,0.45)'); gl.addColorStop(1, 'rgba(184,255,207,0)'); g.fillStyle = gl; g.fillRect(0, 0, 100, 100); g.fillStyle = 'rgba(184,255,207,0.35)'; g.beginPath(); g.moveTo(40, 60); g.lineTo(60, 60); g.lineTo(72, 94); g.lineTo(28, 94); g.closePath(); g.fill(); ball(g, 50, 36, 9, 10, '#4ade80'); eye(g, 46, 35, 1.8); eye(g, 54, 35, 1.8); g.fillStyle = 'rgba(159,247,255,0.45)'; g.beginPath(); g.ellipse(50, 42, 18, 18, 0, Math.PI, 0); g.fill(); ball(g, 50, 52, 40, 11, '#b8c0d0'); g.fillStyle = '#ff4fd8'; rr(g, 12, 50, 76, 4, 2); g.fill(); [20, 35, 50, 65, 80].forEach(function (x, i) { ball(g, x, 58, 3, 3, i % 2 ? '#ffe14d' : '#3ff0ff'); }); sparkle(g, 84, 18, 5); }
  };
  Object.keys(D2).forEach(function (id) { GA.PrizeArt.register(id, D2[id]); });
})();
