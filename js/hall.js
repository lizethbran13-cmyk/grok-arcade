/* Grok Arcade - Hall of Game Records (3D wing behind the Bonus Zone) + Gus the grumpy archivist + the DLC Machine 3000.
   Built into the hub through the same extension API the claw machines use. Everything here is real 3D geometry:
   wood paneling, pilasters, coffered ceiling, marble pedestals with a spinning model per game, framed screenshots,
   brass stanchions with velvet ropes, Gus behind his desk and a big blinking retro-futuristic DLC machine. */
(function () {
  'use strict';
  var T = THREE, A, W, H3 = GA.Hall3D = {};
  var V = '20261009kp';
  var mats = {};
  function ph(c, s, e) { var k = 'p' + c + (s || 40) + (e || ''); return mats[k] || (mats[k] = new T.MeshPhongMaterial({ color: c, shininess: s || 40, specular: '#ffffff', emissive: e ? new T.Color(e) : new T.Color(0) })); }
  function gold() { return ph('#e8b84a', 90, '#3a2400'); }
  function brass() { return ph('#c9993a', 80, '#241500'); }
  function chrome() { return ph('#cfd8e6', 120, '#10131a'); }
  function glowM(c) { return A.basic(c); }
  function add(par, geo, mat, x, y, z) { var m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); par.add(m); return m; }
  var G = {};
  function geo(k, f) { return G[k] || (G[k] = f()); }
  function bx(w, h, d) { return geo('b' + w + ',' + h + ',' + d, function () { return new T.BoxGeometry(w, h, d); }); }
  function cy(a, b, h, s) { return geo('c' + a + ',' + b + ',' + h + ',' + (s || 20), function () { return new T.CylinderGeometry(a, b, h, s || 20); }); }
  function sp(r, s) { return geo('s' + r + ',' + (s || 20), function () { return new T.SphereGeometry(r, s || 20, Math.max(8, Math.round((s || 20) * 0.7))); }); }
  function to(r, t, arc, s) { return geo('t' + r + ',' + t + ',' + (arc || 7) + ',' + (s || 32), function () { return new T.TorusGeometry(r, t, 10, s || 32, arc || Math.PI * 2); }); }
  function cn(r, h, s) { return geo('k' + r + ',' + h + ',' + (s || 16), function () { return new T.ConeGeometry(r, h, s || 16); }); }
  function cvs(w, h, draw) { var c = A.mkCanvas(w, h), g = c.getContext('2d'); draw(g, w, h); var t = A.canvasTex(c); return { c: c, g: g, tex: t }; }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function plaqueTex(w, h, title, sub, col, bg) {
    return cvs(w, h, function (g) {
      var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, bg || '#3a2216'); gr.addColorStop(1, '#22120a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#e8b84a'; g.lineWidth = Math.max(3, h * 0.05); g.strokeRect(g.lineWidth, g.lineWidth, w - g.lineWidth * 2, h - g.lineWidth * 2);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      var px = Math.round(h * (sub ? 0.38 : 0.52)); g.font = 'bold ' + px + 'px "Trebuchet MS",system-ui,sans-serif'; while (g.measureText(title).width > w - 30 && px > 10) { px -= 2; g.font = 'bold ' + px + 'px "Trebuchet MS",system-ui,sans-serif'; }
      g.shadowColor = col || '#ffe14d'; g.shadowBlur = px * 0.3; g.fillStyle = col || '#ffe14d'; g.fillText(title, w / 2, h * (sub ? 0.38 : 0.52)); g.shadowBlur = 0;
      if (sub) { var sp2 = Math.round(h * 0.2); g.font = 'bold ' + sp2 + 'px "Trebuchet MS",system-ui,sans-serif'; while (g.measureText(sub).width > w - 30 && sp2 > 8) { sp2--; g.font = 'bold ' + sp2 + 'px "Trebuchet MS",system-ui,sans-serif'; } g.fillStyle = '#f5e6c8'; g.fillText(sub, w / 2, h * 0.76); }
    });
  }
  function planeM(w, h, tex, par, x, y, z) { var m = add(par, new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex }), x, y, z); return m; }
  function darker(c, k) { return new T.Color(c).multiplyScalar(k).getStyle(); }

  /* ---------- 3D emblems (one little model per game, ~0.5 tall, sits on the pedestal) ---------- */
  var EMB = {
    sky: function (g) { var b = add(g, cy(0.07, 0.07, 0.6, 16), ph('#f8fafc', 80), 0, 0.28, 0); b.rotation.z = Math.PI / 2; add(g, sp(0.07, 16), ph('#f8fafc', 80), 0.3, 0.28, 0); add(g, cn(0.07, 0.14, 16), ph('#38bdf8', 80), -0.36, 0.28, 0).rotation.z = Math.PI / 2;
      add(g, bx(0.16, 0.015, 0.62), ph('#38bdf8', 60), 0.02, 0.27, 0); add(g, bx(0.08, 0.14, 0.015), ph('#fde047', 60), -0.27, 0.36, 0); add(g, bx(0.07, 0.012, 0.22), ph('#38bdf8', 60), -0.27, 0.3, 0);
      [-0.16, 0.16].forEach(function (z) { var e = add(g, cy(0.03, 0.03, 0.09, 12), ph('#94a3b8', 90), 0.06, 0.24, z); e.rotation.z = Math.PI / 2; }); add(g, bx(0.12, 0.02, 0.02), glowM('#bfe9ff'), 0.25, 0.31, 0.06); },
    land: function (g) { add(g, bx(0.36, 0.26, 0.36), ph('#a16207', 30), 0, 0.13, 0); add(g, bx(0.38, 0.08, 0.38), ph('#4ade80', 40), 0, 0.29, 0); var s = add(g, new T.OctahedronGeometry(0.11), ph('#fde047', 100, '#5a4500'), 0, 0.48, 0); s.scale.set(1, 1.2, 0.4); g.userData.spin = s; },
    grid: function (g) { add(g, bx(0.56, 0.07, 0.18), ph('#f43f5e', 90), 0, 0.1, 0); add(g, bx(0.2, 0.08, 0.12), ph('#f43f5e', 90), -0.02, 0.17, 0); add(g, sp(0.05, 14), ph('#111827', 90), 0, 0.22, 0);
      add(g, bx(0.08, 0.015, 0.34), ph('#ffffff', 60), 0.3, 0.07, 0); add(g, bx(0.06, 0.12, 0.3), ph('#ffffff', 60), -0.3, 0.17, 0);
      [[0.19, 0.13], [0.19, -0.13], [-0.19, 0.13], [-0.19, -0.13]].forEach(function (w) { var t = add(g, cy(0.07, 0.07, 0.07, 18), ph('#1f2937', 30), w[0], 0.07, w[1]); t.rotation.x = Math.PI / 2; }); },
    voxels: function (g) { var c = ph('#a855f7', 60), k = ph('#22d3ee', 80); add(g, bx(0.44, 0.12, 0.12), c, 0.04, 0.3, 0); add(g, bx(0.1, 0.22, 0.1), c, -0.1, 0.16, 0); add(g, bx(0.18, 0.06, 0.06), k, 0.32, 0.3, 0); add(g, bx(0.06, 0.06, 0.14), glowM('#22d3ee'), 0.12, 0.38, 0); for (var i = 0; i < 3; i++) add(g, bx(0.05, 0.05, 0.05), glowM('#f0abfc'), 0.46 + i * 0.07, 0.3 + (i % 2) * 0.04, 0); },
    surfers: function (g) { var b = add(g, cy(0.12, 0.12, 0.03, 24), ph('#fb923c', 60), 0, 0.1, 0); b.scale.set(2.4, 1, 1); [-0.18, 0.18].forEach(function (x) { [-0.07, 0.07].forEach(function (z) { var w = add(g, cy(0.035, 0.035, 0.03, 12), ph('#facc15', 60), x, 0.06, z); w.rotation.x = Math.PI / 2; }); });
      var c = add(g, cy(0.12, 0.12, 0.03, 28), ph('#facc15', 110, '#5a4500'), 0, 0.38, 0); c.rotation.x = Math.PI / 2; g.userData.spin = c; },
    fc: function (g) { add(g, sp(0.2, 28), ph('#ffffff', 60), 0, 0.22, 0); var d = new T.IcosahedronGeometry(0.202, 0), pos = d.attributes.position; for (var i = 0; i < 12; i++) { var v = [[0, 1, 1.618], [0, -1, 1.618], [0, 1, -1.618], [0, -1, -1.618], [1, 1.618, 0], [-1, 1.618, 0], [1, -1.618, 0], [-1, -1.618, 0], [1.618, 0, 1], [-1.618, 0, 1], [1.618, 0, -1], [-1.618, 0, -1]][i], l = Math.hypot(v[0], v[1], v[2]); var p = add(g, cy(0.07, 0.07, 0.02, 5), ph('#111827', 40), v[0] / l * 0.195, 0.22 + v[1] / l * 0.195, v[2] / l * 0.195); p.lookAt(new T.Vector3(v[0], v[1], v[2]).multiplyScalar(2).add(new T.Vector3(0, 0.22, 0))); p.rotateX(Math.PI / 2); } void pos; },
    brawl: function (g) { var r = ph('#ff3d6e', 70); add(g, sp(0.17, 24), r, 0, 0.3, 0).scale.set(1, 0.9, 1.1); add(g, sp(0.08, 16), r, 0.12, 0.34, 0.12); add(g, cy(0.12, 0.13, 0.16, 20), ph('#ffffff', 40), 0, 0.1, 0); add(g, to(0.125, 0.02), ph('#ffe14d', 70), 0, 0.18, 0).rotation.x = Math.PI / 2; },
    party: function (g) { var d = add(g, bx(0.3, 0.3, 0.3), ph('#ffffff', 80), 0, 0.2, 0); d.rotation.set(0.6, 0.6, 0); var pip = ph('#ff6bd6', 40); [[0, 0, 0.151], [0.08, 0.08, -0.151], [-0.08, -0.08, -0.151], [0.151, 0.07, 0.07], [0.151, -0.07, -0.07], [-0.151, 0, 0]].forEach(function (q) { var m = add(d, sp(0.03, 10), pip, q[0], q[1], q[2]); m.scale.set(q[0] ? 0.4 : 1, 1, q[2] ? 0.4 : 1); });
      var s = add(g, new T.OctahedronGeometry(0.08), ph('#ffe14d', 100, '#5a4500'), 0.22, 0.48, 0); g.userData.spin = s; },
    detective: function (g) { var m = add(g, to(0.13, 0.025), brass(), 0, 0.34, 0); add(g, new T.CircleGeometry(0.13, 28), new T.MeshPhongMaterial({ color: '#bfe9ff', transparent: true, opacity: 0.45, shininess: 120 }), 0, 0.34, 0); var h = add(g, cy(0.025, 0.03, 0.24, 12), ph('#5b3a1e', 30), 0.12, 0.14, 0); h.rotation.z = 0.7; void m; add(g, bx(0.12, 0.16, 0.02), ph('#f5e6c8', 20), -0.15, 0.1, 0.05).rotation.y = 0.3; },
    pets: function (g) { var p = ph('#ff6bd6', 50); add(g, sp(0.13, 22), p, 0, 0.18, 0).scale.set(1, 0.8, 0.5); [[-0.13, 0.32], [-0.05, 0.37], [0.05, 0.37], [0.13, 0.32]].forEach(function (q) { add(g, sp(0.055, 16), p, q[0], q[1], 0).scale.set(1, 1.2, 0.5); }); },
    life: function (g) { add(g, bx(0.32, 0.24, 0.28), ph('#fef3c7', 30), 0, 0.12, 0); var r = add(g, cn(0.27, 0.18, 4), ph('#ff6bd6', 40), 0, 0.33, 0); r.rotation.y = Math.PI / 4; add(g, bx(0.07, 0.12, 0.01), ph('#7c3aed', 30), 0, 0.06, 0.141); [-0.09, 0.09].forEach(function (x) { add(g, bx(0.06, 0.06, 0.01), glowM('#fde68a'), x, 0.16, 0.141); }); add(g, bx(0.05, 0.12, 0.05), ph('#b45309', 30), 0.09, 0.4, -0.05); },
    dash: function (g) { var r = add(g, to(0.17, 0.035, 7, 40), ph('#ffd23f', 120, '#5a4000'), 0, 0.3, 0); g.userData.spin = r; },
    spooks: function (g) { var w = new T.MeshPhongMaterial({ color: '#d9ffe4', emissive: '#1f6b38', shininess: 60, transparent: true, opacity: 0.92 }); add(g, sp(0.15, 24), w, 0, 0.32, 0); var c = add(g, cy(0.15, 0.18, 0.18, 24, 1, true), w, 0, 0.22, 0); void c; [-0.05, 0.05].forEach(function (x) { add(g, sp(0.025, 10), ph('#111827', 80), x, 0.35, 0.135); }); add(g, sp(0.03, 10), ph('#111827', 40), 0, 0.28, 0.14).scale.set(1, 1.3, 0.5); g.userData.bob = true; },
    blocks: function (g) { var wh = ph('#f8fafc', 30), bk = ph('#111827', 30); add(g, bx(0.26, 0.26, 0.26), wh, 0, 0.2, 0); [-0.06, 0.06].forEach(function (x) { add(g, bx(0.04, 0.27, 0.02), bk, x, 0.2, 0.125); }); add(g, bx(0.27, 0.04, 0.02), bk, 0, 0.27, 0.125); [-0.09, 0.09].forEach(function (x) { add(g, bx(0.06, 0.1, 0.04), wh, x, 0.38, 0); add(g, bx(0.035, 0.035, 0.02), bk, x, 0.2, 0.135); }); add(g, bx(0.04, 0.1, 0.16), bk, 0, 0.36, -0.02); },
    sports: function (g) { var c = new T.Group(); c.position.y = 0.3; g.add(c); add(c, sp(0.12, 24), ph('#f97316', 50), 0, 0, 0); var ln = ph('#3b1d0a', 20); [0, Math.PI / 2].forEach(function (a) { var m = add(c, to(0.121, 0.006, 7, 32), ln, 0, 0, 0); m.rotation.y = a; }); add(c, to(0.121, 0.006, 7, 32), ln, 0, 0, 0).rotation.x = Math.PI / 2;
      var o = new T.Group(); o.position.y = 0.3; g.add(o); add(o, sp(0.06, 16), ph('#ffffff', 60), 0.22, 0, 0); add(o, sp(0.045, 14), ph('#e6ff3b', 60, '#2a3300'), -0.11, 0.05, 0.19); add(o, sp(0.055, 14), ph('#a855f7', 100), -0.11, -0.04, -0.19);
      add(g, cy(0.16, 0.19, 0.06, 24), gold(), 0, 0.03, 0); g.userData.spin = o; },
    kart: function (g) { var k = new T.Group(); k.position.y = 0.2; g.add(k); add(k, bx(0.22, 0.07, 0.32), ph('#e11d48', 90), 0, 0, 0); add(k, sp(0.08, 16), ph('#e8f1ff', 70), 0, 0.1, -0.03);
      var whs = []; [[-0.13, 0.11], [0.13, 0.11], [-0.13, -0.11], [0.13, -0.11]].forEach(function (q) { var w = add(k, cy(0.05, 0.05, 0.05, 16), ph('#1f2433', 30), q[0], -0.03, q[1]); w.rotation.z = Math.PI / 2; whs.push(w); });
      [-1, 1].forEach(function (sd) { add(k, sp(0.02, 8), ph('#c084fc', 10, '#c084fc'), sd * 0.05, 0, -0.19); });
      add(g, cy(0.16, 0.19, 0.06, 24), gold(), 0, 0.03, 0); g.userData.spin = k; },
    pickle: function (g) { var pd = new T.Group(); pd.position.set(-0.06, 0.3, 0); pd.rotation.z = 0.35; g.add(pd); var f = add(pd, cy(0.15, 0.15, 0.03, 28), ph('#22c55e', 90), 0, 0.06, 0); f.rotation.x = Math.PI / 2; f.scale.set(1, 1, 1.25); var e = add(pd, to(0.15, 0.012, 7, 32), ph('#14532d', 60), 0, 0.06, 0); e.scale.set(1, 1.25, 1);
      add(pd, cy(0.025, 0.028, 0.18, 12), ph('#3b2a1a', 30), 0, -0.17, 0); add(pd, sp(0.03, 10), ph('#3b2a1a', 30), 0, -0.26, 0);
      var bl = add(g, sp(0.08, 20), ph('#e6ff3b', 70, '#3a4500'), 0.17, 0.48, 0.05); [[0, 0.07, 0.04], [0.06, 0.02, 0.05], [-0.05, 0.03, 0.06], [0.02, -0.05, 0.065]].forEach(function (q) { add(bl, sp(0.016, 8), ph('#84a110', 20), q[0], q[1], q[2]); }); g.userData.spin = pd; },
    heist: function (g) { add(g, bx(0.34, 0.32, 0.3), ph('#4c1d95', 70), 0, 0.17, 0); add(g, bx(0.28, 0.26, 0.02), ph('#6d28d9', 90), 0, 0.17, 0.155); var d = add(g, cy(0.07, 0.07, 0.03, 20), ph('#ffcf3a', 120, '#5a4000'), 0.03, 0.18, 0.17); d.rotation.x = Math.PI / 2; add(g, bx(0.02, 0.1, 0.02), ph('#c9ced8', 90), -0.1, 0.18, 0.17); var gm = new T.MeshPhongMaterial({ color: '#bae6fd', emissive: '#0e7490', shininess: 140, flatShading: true }); var c = add(g, cn(0.09, 0.11, 8), gm, 0, 0.42, 0); c.rotation.x = Math.PI; add(g, cy(0.05, 0.09, 0.05, 8), gm, 0, 0.5, 0); },
    rides: function (g) { add(g, bx(0.4, 0.12, 0.22), ph('#ff4fd8', 100), 0, 0.22, 0); add(g, bx(0.22, 0.1, 0.2), ph('#38bdf8', 100), -0.03, 0.32, 0); [[0.15, 0.13], [0.15, -0.13], [-0.15, 0.13], [-0.15, -0.13]].forEach(function (w) { var t = add(g, cy(0.1, 0.1, 0.08, 20), ph('#1f2937', 20), w[0], 0.1, w[1]); t.rotation.x = Math.PI / 2; add(g, cy(0.05, 0.05, 0.09, 12), chrome(), w[0], 0.1, w[1]).rotation.x = Math.PI / 2; }); },
    poke: function (g) { var o = new T.Group(); o.position.y = 0.22; g.add(o); add(o, new T.SphereGeometry(0.18, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), ph('#ff4f6b', 90)); add(o, new T.SphereGeometry(0.18, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), ph('#ffffff', 90)); add(o, cy(0.183, 0.183, 0.03, 28), ph('#222222', 40)); var b = add(o, cy(0.055, 0.055, 0.03, 18), ph('#ffffff', 90), 0, 0, 0.175); b.rotation.x = Math.PI / 2; g.userData.spin = o; }
  };

  /* ---------- the wing ---------- */
  var EX = [], gus = {}, dlc = {}, state = { inHall: false, saidHi: false, vis: true }, ROOTS = []; // ROOTS: hidden when you're far away (saves draw calls on phones)
  function marbleTex() {
    var c = A.mkCanvas(512, 512), g = c.getContext('2d');
    for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#2b1a14' : '#efe6d8'; g.fillRect(i * 256, j * 256, 256, 256); }
    g.globalAlpha = 0.18; for (var k = 0; k < 40; k++) { g.strokeStyle = k % 2 ? '#8a7a66' : '#ffffff'; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); var x = Math.random() * 512, y = Math.random() * 512; g.moveTo(x, y); for (var s = 0; s < 5; s++) { x += (Math.random() - 0.5) * 120; y += Math.random() * 60; g.lineTo(x, y); } g.stroke(); }
    g.globalAlpha = 1; g.strokeStyle = '#c9993a'; g.lineWidth = 3; g.strokeRect(0, 0, 512, 512); g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 512); g.moveTo(0, 256); g.lineTo(512, 256); g.stroke();
    var t = A.canvasTex(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  }
  function buildShell() {
    var w = W, Wd = w.maxX - w.minX, D = w.maxZ - w.minZ, cx = (w.minX + w.maxX) / 2, cz = (w.minZ + w.maxZ) / 2, H = A.ROOM.h, th = 0.4;
    var shell = new T.Group(); shell.name = 'Hall shell'; A.scene.add(shell); A.noAud(shell); ROOTS.push(shell);
    var mt = marbleTex(); mt.repeat.set(Wd / 2.4, D / 2.4);
    var fl = add(shell, new T.PlaneGeometry(Wd, D), new T.MeshPhongMaterial({ map: mt, shininess: 70, specular: '#555555' }), cx, 0, cz); fl.rotation.x = -Math.PI / 2;
    // red carpet runner from the door to Gus's desk + gold edging
    var rc = add(shell, bx(2.0, 0.02, 4.0), ph('#9b1c31', 10), w.doorX, 0.012, w.minZ + 2.0); void rc;
    [-1, 1].forEach(function (sd) { add(shell, bx(0.06, 0.025, 4.0), gold(), w.doorX + sd * 1.0, 0.014, w.minZ + 2.0); });
    // walls (warm burgundy plaster) + dark wood wainscot, chair rail, crown molding
    var plaster = ph('#5a2333', 8), wood = ph('#4a2c1a', 30), woodL = ph('#6b4226', 40);
    add(shell, bx(th, H, D + th), plaster, w.minX - th / 2, H / 2, cz); add(shell, bx(th, H, D + th), plaster, w.maxX + th / 2, H / 2, cz);
    add(shell, bx(Wd + th * 2, H, th), plaster, cx, H / 2, w.maxZ + th / 2);
    // north wall inner face (the back of the arcade's south wall) gets the same plaster
    add(shell, bx(w.doorX - w.doorHW - w.minX, H, 0.04), plaster, (w.minX + w.doorX - w.doorHW) / 2, H / 2, w.minZ + 0.02);
    add(shell, bx(w.maxX - w.doorX - w.doorHW, H, 0.04), plaster, (w.maxX + w.doorX + w.doorHW) / 2, H / 2, w.minZ + 0.02);
    add(shell, bx(w.doorHW * 2, H - w.doorH, 0.04), plaster, w.doorX, w.doorH + (H - w.doorH) / 2, w.minZ + 0.02);
    function runX(z, y, h, d, mat, x0, x1) { add(shell, bx(x1 - x0, h, d), mat, (x0 + x1) / 2, y, z); }
    function runZ(x, y, h, d, mat) { add(shell, bx(d, h, D), mat, x, y, cz); }
    [[0.55, 1.1, 0.05, wood], [1.12, 0.07, 0.09, woodL], [H - 0.12, 0.24, 0.14, woodL], [H - 0.3, 0.05, 0.1, gold()], [0.05, 0.1, 0.08, woodL]].forEach(function (r) {
      runZ(w.minX + r[2] / 2, r[0], r[1], r[2], r[3]); runZ(w.maxX - r[2] / 2, r[0], r[1], r[2], r[3]); runX(w.maxZ - r[2] / 2, r[0], r[1], r[2], r[3], w.minX, w.maxX);
      if (r[0] < w.doorH) { runX(w.minZ + r[2] / 2 + 0.04, r[0], r[1], r[2], r[3], w.minX, w.doorX - w.doorHW); runX(w.minZ + r[2] / 2 + 0.04, r[0], r[1], r[2], r[3], w.doorX + w.doorHW, w.maxX); }
      else runX(w.minZ + r[2] / 2 + 0.04, r[0], r[1], r[2], r[3], w.minX, w.maxX);
    });
    // coffered ceiling: dark panel + crossing wooden beams + brass pendant lamps
    var ce = add(shell, new T.PlaneGeometry(Wd, D), ph('#2a1810', 10), cx, H, cz); ce.rotation.x = Math.PI / 2;
    for (var x = w.minX + 2; x < w.maxX - 0.5; x += 2) add(shell, bx(0.18, 0.22, D), wood, x, H - 0.11, cz);
    for (var z = w.minZ + 2.2; z < w.maxZ - 0.5; z += 2.2) add(shell, bx(Wd, 0.2, 0.18), wood, cx, H - 0.1, z);
    [[6, 16.4], [14, 16.4], [6, 22], [14, 22], [10, 20.6]].forEach(function (p) {
      add(shell, cy(0.012, 0.012, 0.9, 6), brass(), p[0], H - 0.45, p[1]);
      var sh = add(shell, new T.SphereGeometry(0.32, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshPhongMaterial({ color: '#c9993a', shininess: 80, side: T.DoubleSide }), p[0], H - 0.95, p[1]); void sh;
      add(shell, sp(0.13, 14), glowM('#fff3c4'), p[0], H - 1.0, p[1]);
      var gl = new T.Sprite(new T.SpriteMaterial({ map: A.glowTex, color: '#ffd98a', transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending })); gl.scale.set(1.6, 1.6, 1); gl.position.set(p[0], H - 1.05, p[1]); shell.add(gl);
    });
    // a warm light for the wing (cheap: one hemisphere-ish point light above the middle)
    var pl = new T.PointLight('#ffd9a0', 0.55, 16, 1.6); pl.position.set(cx, H - 0.6, cz); shell.add(pl);
    // camera walls of the wing are added by the hub (outer box); add the visible door trim on both sides
    A.walls.push({ minX: w.minX - 0.4, maxX: w.minX, minY: -1, maxY: 99, minZ: w.minZ, maxZ: w.maxZ });
    A.walls.push({ minX: w.minX, maxX: w.maxX, minY: H - 0.3, maxY: 99, minZ: w.minZ, maxZ: w.maxZ }); // ceiling: keeps the camera inside the wing
    return shell;
  }
  function pilaster(par, x, z, rotY) {
    var g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; par.add(g); ROOTS.push(g);
    add(g, bx(0.34, 0.25, 0.16), ph('#efe6d8', 40), 0, 0.125, 0.08); add(g, bx(0.26, 4.2, 0.1), ph('#e9dfcf', 30), 0, 2.35, 0.05);
    for (var i = -1; i <= 1; i++) add(g, bx(0.03, 4.0, 0.02), ph('#d6cab6', 20), i * 0.07, 2.35, 0.105);
    add(g, bx(0.34, 0.22, 0.16), gold(), 0, 4.5, 0.08);
  }
  function exhibit(gm, data, x, z, rot) {
    var col = gm.color || '#ffe14d', name = 'exhibit ' + gm.name;
    var g = new T.Group(); g.name = name; g.position.set(x, 0, z); g.rotation.y = rot; A.scene.add(g); ROOTS.push(g);
    // back panel in the game's colors with gold trim
    add(g, bx(1.44, 3.3, 0.1), ph(darker(col, 0.35), 20), 0, 1.75, 0.05);
    add(g, bx(1.44, 0.06, 0.12), gold(), 0, 3.42, 0.06); add(g, bx(1.44, 0.06, 0.12), gold(), 0, 0.08, 0.06);
    // framed screenshot (the real game, loaded from assets/hall)
    add(g, bx(1.3, 0.82, 0.08), gold(), 0, 2.32, 0.14);
    add(g, bx(1.2, 0.72, 0.02), ph('#111111', 10), 0, 2.32, 0.18);
    var tex = new T.TextureLoader().load(data.cover + '?v=' + V); tex.anisotropy = 4;
    var pic = planeM(1.16, 0.68, tex, g, 0, 2.32, 0.192); pic.material.toneMapped = false;
    // name plaque
    var nm = plaqueTex(512, 120, gm.name.toUpperCase(), null, col); planeM(1.3, 0.3, nm.tex, g, 0, 3.02, 0.11);
    // marble pedestal + gold rings + the spinning model
    add(g, cy(0.36, 0.42, 0.12, 28), ph('#efe6d8', 60), 0, 0.06, 0.62);
    add(g, cy(0.3, 0.3, 0.78, 28), ph('#f4ede2', 70), 0, 0.51, 0.62);
    add(g, cy(0.38, 0.36, 0.08, 28), ph('#efe6d8', 60), 0, 0.94, 0.62); add(g, to(0.3, 0.018, 7, 36), gold(), 0, 0.9, 0.62).rotation.x = Math.PI / 2; add(g, to(0.31, 0.016, 7, 36), gold(), 0, 0.14, 0.62).rotation.x = Math.PI / 2;
    var em = new T.Group(); em.position.set(0, 0.98, 0.62); g.add(em); (EMB[gm.id] || EMB.dash)(em);
    // info plaque on the pedestal
    var last = data.history[data.history.length - 1], first = data.history[0];
    var pq = plaqueTex(384, 110, 'v' + last.ver + ' \u00b7 since ' + first.date, data.history.length + ' updates \u00b7 ' + (data.versions.length ? data.versions.length + ' old version' + (data.versions.length > 1 ? 's' : '') : 'brand new'), '#ffe9a0');
    var pm = planeM(0.52, 0.15, pq.tex, g, 0, 0.62, 0.93); pm.rotation.x = -0.25;
    // brass stanchions with a red velvet rope in front
    var rope = ph('#b3123a', 20);
    [-0.6, 0.6].forEach(function (sx) { add(g, cy(0.1, 0.12, 0.04, 16), brass(), sx, 0.02, 1.02); add(g, cy(0.02, 0.02, 0.8, 10), brass(), sx, 0.42, 1.02); add(g, sp(0.045, 12), brass(), sx, 0.84, 1.02); });
    var curve = new T.QuadraticBezierCurve3(new T.Vector3(-0.6, 0.8, 1.02), new T.Vector3(0, 0.55, 1.06), new T.Vector3(0.6, 0.8, 1.02));
    add(g, geo('rope', function () { return new T.TubeGeometry(curve, 20, 0.022, 8, false); }), rope);
    // little spotlight can + soft light cone (not part of the layout audit)
    var lamp = new T.Group(); g.add(lamp); A.noAud(lamp);
    add(lamp, cy(0.07, 0.09, 0.16, 14), ph('#1f1f1f', 60), 0, 3.66, 0.5).rotation.x = 0.6; add(lamp, bx(0.04, 0.04, 0.34), ph('#1f1f1f', 60), 0, 3.72, 0.3);
    var cone = add(lamp, new T.ConeGeometry(0.55, 2.5, 20, 1, true), new T.MeshBasicMaterial({ color: '#fff1c4', transparent: true, opacity: 0.07, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }), 0, 2.38, 0.62);
    var gmFl = new T.MeshBasicMaterial({ map: A.glowTex, color: col, transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending });
    var fg = add(lamp, new T.PlaneGeometry(1.8, 1.4), gmFl, 0, 0.03, 1.55); fg.rotation.x = -Math.PI / 2; fg.renderOrder = 2;
    g.updateMatrixWorld(true);
    var pts = [[-0.72, 0], [0.72, 0], [-0.72, 1.12], [0.72, 1.12]].map(function (p) { return new T.Vector3(p[0], 0, p[1]).applyMatrix4(g.matrixWorld); });
    A.addSolid(Math.min.apply(null, pts.map(function (p) { return p.x; })), Math.max.apply(null, pts.map(function (p) { return p.x; })), Math.min.apply(null, pts.map(function (p) { return p.z; })), Math.max.apply(null, pts.map(function (p) { return p.z; })), name);
    A.regItem(name, 'booth', g);
    var cab = { game: { id: 'ex_' + gm.id, gid: gm.id, name: gm.name, desc: gm.desc, color: col }, kind: 'exhibit', id: 'ex_' + gm.id, gid: gm.id, group: g, x: x, z: z, rot: rot,
      front: new T.Vector3(0, 0, 1.75).applyMatrix4(g.matrixWorld), dir: new T.Vector3(Math.sin(rot), 0, Math.cos(rot)), glow: gmFl, nextDraw: Infinity, r: 1.05 };
    A.cabinets.push(cab);
    EX.push({ id: gm.id, g: g, em: em, cone: cone, cab: cab });
    return cab;
  }

  /* ---------- Gus, the grumpy archivist ---------- */
  function buildGus(par) {
    var root = new T.Group(); par.add(root);
    var skin = ph('#f1c7a5', 20), card = ph('#7a4b2a', 15), grey = ph('#d6d6d6', 10), shirt = ph('#dfe9f5', 20);
    var body = new T.Group(); body.position.y = 0; root.add(body);
    add(body, cy(0.18, 0.2, 0.7, 16), ph('#3b3b4a', 15), 0, 0.35, 0); // trousers (mostly behind the desk)
    var torso = add(body, sp(0.34, 24), card, 0, 1.05, 0); torso.scale.set(1, 1.3, 0.82);
    add(body, sp(0.2, 18), shirt, 0, 1.22, 0.16).scale.set(0.7, 1.1, 0.5);
    [-1, 1].forEach(function (sd) { var b = add(body, cn(0.06, 0.12, 12), ph('#b3123a', 40), sd * 0.055, 1.42, 0.27); b.rotation.z = sd * Math.PI / 2; });
    add(body, sp(0.03, 10), ph('#b3123a', 40), 0, 1.42, 0.275);
    [0.95, 1.07, 1.19].forEach(function (y) { add(body, sp(0.022, 8), ph('#e8d5b0', 60), 0.0, y, 0.285); });
    var badge = add(body, bx(0.12, 0.06, 0.01), gold(), -0.17, 1.25, 0.26); badge.rotation.y = -0.35;
    // arms (shoulder pivots so they can cross, stamp and wave)
    function arm(sd) { var a = new T.Group(); a.position.set(sd * 0.36, 1.36, 0); body.add(a); add(a, cy(0.075, 0.07, 0.46, 12), card, 0, -0.23, 0); add(a, sp(0.075, 12), skin, 0, -0.5, 0); return a; }
    var aL = arm(-1), aR = arm(1);
    var stamp = new T.Group(); stamp.position.set(0, -0.56, 0.02); aR.add(stamp); add(stamp, cy(0.035, 0.035, 0.12, 12), ph('#5b3a1e', 30), 0, 0.02, 0); add(stamp, bx(0.12, 0.04, 0.09), ph('#b3123a', 30), 0, -0.06, 0);
    // head
    var head = new T.Group(); head.position.set(0, 1.62, 0.02); body.add(head);
    add(head, sp(0.25, 26), skin, 0, 0.12, 0).scale.set(1, 1.08, 0.98);
    [-1, 1].forEach(function (sd) { add(head, sp(0.07, 12), skin, sd * 0.25, 0.1, -0.01).scale.set(0.5, 1, 0.8); add(head, sp(0.1, 14), grey, sd * 0.2, 0.17, -0.07).scale.set(0.8, 1.1, 1.2); });
    add(head, sp(0.08, 12), grey, 0, 0.2, -0.2).scale.set(1.8, 0.8, 0.8);
    var browL = add(head, bx(0.13, 0.045, 0.05), grey, -0.085, 0.24, 0.215), browR = add(head, bx(0.13, 0.045, 0.05), grey, 0.085, 0.24, 0.215);
    browL.rotation.z = -0.35; browR.rotation.z = 0.35;
    [-1, 1].forEach(function (sd) { add(head, sp(0.028, 10), ph('#111827', 90), sd * 0.085, 0.16, 0.225); var gl = add(head, to(0.055, 0.009, 7, 24), ph('#2b2b2b', 60), sd * 0.085, 0.16, 0.24); void gl; });
    add(head, bx(0.06, 0.012, 0.012), ph('#2b2b2b', 60), 0, 0.165, 0.245);
    add(head, sp(0.055, 14), ph('#e8a98a', 20), 0, 0.09, 0.25).scale.set(1, 1.1, 1);
    var mus = new T.Group(); mus.position.set(0, 0.02, 0.23); head.add(mus);
    [-1, 1].forEach(function (sd) { var m = add(mus, sp(0.07, 14), grey, sd * 0.06, 0, 0); m.scale.set(1.3, 0.6, 0.6); m.rotation.z = sd * 0.35; });
    var mouth = add(head, to(0.045, 0.01, Math.PI, 14), ph('#6b2a2a', 20), 0, -0.07, 0.225); // frown (arc pointing up)
    // speech bubble sprite
    var sbc = A.mkCanvas(512, 200), sbt = A.canvasTex(sbc); sbt.minFilter = T.LinearFilter; sbt.generateMipmaps = false;
    var bub = new T.Sprite(new T.SpriteMaterial({ map: sbt, transparent: true, depthWrite: false, depthTest: false })); bub.scale.set(2.3, 0.9, 1); bub.position.set(0, 2.45, 0); bub.visible = false; bub.renderOrder = 10; root.add(bub);
    gus = { root: root, body: body, head: head, aL: aL, aR: aR, stamp: stamp, browL: browL, browR: browR, mus: mus, mouth: mouth, bub: bub, sbc: sbc, sbt: sbt, sayT: 0, stampT: 3, react: 0 };
    A.noAud(bub);
  }
  function bubbleDraw(text) {
    var c = gus.sbc, g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
    g.fillStyle = '#fffdf5'; g.strokeStyle = '#3a2216'; g.lineWidth = 6; rr(g, 6, 6, w - 12, h - 46, 26); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(w / 2 - 20, h - 42); g.lineTo(w / 2, h - 8); g.lineTo(w / 2 + 20, h - 42); g.closePath(); g.fill(); g.stroke(); g.fillRect(w / 2 - 17, h - 46, 34, 6);
    g.fillStyle = '#2a1a10'; g.textAlign = 'center'; g.textBaseline = 'middle';
    var words = String(text).split(' '), lines = [], cur = '', px = 30; g.font = 'bold ' + px + 'px "Trebuchet MS",system-ui,sans-serif';
    words.forEach(function (wd) { var t = cur ? cur + ' ' + wd : wd; if (g.measureText(t).width > w - 50) { lines.push(cur); cur = wd; } else cur = t; }); if (cur) lines.push(cur);
    if (lines.length > 3) { px = 24; g.font = 'bold ' + px + 'px "Trebuchet MS",system-ui,sans-serif'; lines = []; cur = ''; words.forEach(function (wd) { var t = cur ? cur + ' ' + wd : wd; if (g.measureText(t).width > w - 40) { lines.push(cur); cur = wd; } else cur = t; }); if (cur) lines.push(cur); lines = lines.slice(0, 4); }
    lines.forEach(function (ln, i) { g.fillText(ln, w / 2, (h - 40) / 2 + (i - (lines.length - 1) / 2) * (px + 4)); });
    gus.sbt.needsUpdate = true;
  }
  H3.say = function (text, secs) { if (!gus.root) return; bubbleDraw(text); gus.bub.visible = true; gus.sayT = secs || 4.5; gus.react = 1; gus.last = text; };
  H3.gusLine = function () { return gus.sayT > 0 ? gus.last : null; };

  function buildDesk() {
    var x = W.doorX, z = W.minZ + 5.0; // desk faces the doorway (north)
    var g = new T.Group(); g.name = 'Gus\u2019s Records Desk'; g.position.set(x, 0, z); g.rotation.y = Math.PI; A.scene.add(g); ROOTS.push(g);
    var wood = ph('#5b3520', 40), woodL = ph('#7a4a2a', 50);
    // curved front made of three angled panels + top
    add(g, bx(1.4, 1.0, 0.12), wood, 0, 0.5, 0.36);
    [-1, 1].forEach(function (sd) { var p = add(g, bx(0.7, 1.0, 0.12), wood, sd * 0.95, 0.5, 0.18); p.rotation.y = -sd * 0.55; });
    var top = add(g, bx(2.5, 0.07, 0.9), woodL, 0, 1.04, 0.05); void top;
    add(g, bx(2.52, 0.04, 0.04), gold(), 0, 1.0, 0.5); add(g, bx(1.4, 0.04, 0.02), gold(), 0, 0.2, 0.43);
    var pq = plaqueTex(512, 120, 'RECORDS DESK', 'Curator: Gus \u00b7 no running', '#ffe14d'); planeM(1.1, 0.26, pq.tex, g, 0, 0.66, 0.43);
    // desk clutter: banker's lamp, paper stacks, bell, coffee mug, card file
    add(g, cy(0.07, 0.09, 0.03, 16), brass(), -0.9, 1.09, -0.05); add(g, cy(0.012, 0.012, 0.28, 8), brass(), -0.9, 1.22, -0.05);
    var sh = add(g, cy(0.05, 0.12, 0.1, 16, 1, true), new T.MeshPhongMaterial({ color: '#1f7a4a', shininess: 90, side: T.DoubleSide }), -0.9, 1.38, 0.02); sh.rotation.x = 0.35; add(g, sp(0.035, 10), glowM('#fff3c4'), -0.9, 1.35, 0.03);
    for (var i = 0; i < 6; i++) add(g, bx(0.26, 0.012, 0.34), ph(i % 2 ? '#f5f0e1' : '#fffaf0', 10), 0.62 + (i % 2) * 0.01, 1.085 + i * 0.013, -0.02).rotation.y = (i % 3 - 1) * 0.04;
    add(g, cy(0.06, 0.08, 0.05, 16), brass(), 0.25, 1.095, 0.3); add(g, sp(0.03, 10), brass(), 0.25, 1.14, 0.3);
    add(g, cy(0.05, 0.045, 0.11, 16), ph('#ffffff', 60), 1.0, 1.13, 0.12); add(g, to(0.03, 0.01), ph('#ffffff', 60), 1.055, 1.13, 0.12).rotation.y = Math.PI / 2;
    add(g, bx(0.24, 0.14, 0.18), ph('#3a2216', 30), -0.45, 1.14, 0.05); for (i = 0; i < 6; i++) add(g, bx(0.2, 0.1, 0.005), ph('#f5e6c8', 10), -0.45, 1.19, -0.02 + i * 0.025);
    // Gus himself, behind the desk
    var gg = new T.Group(); gg.position.set(0, 0, -0.55); g.add(gg); buildGus(gg);
    // tall filing cabinets behind him
    [-1.35, 1.35].forEach(function (sx) { add(g, bx(0.62, 1.7, 0.55), ph('#6b7280', 60), sx, 0.85, -1.25); for (var d = 0; d < 4; d++) { add(g, bx(0.56, 0.36, 0.02), ph('#7c8594', 70), sx, 0.25 + d * 0.4, -0.965); add(g, bx(0.16, 0.03, 0.04), chrome(), sx, 0.36 + d * 0.4, -0.95); add(g, bx(0.1, 0.06, 0.005), ph('#fffaf0', 10), sx, 0.3 + d * 0.4, -0.952); } });
    g.updateMatrixWorld(true);
    A.addSolid(x - 1.7, x + 1.7, z - 0.55, z + 1.6, 'Gus\u2019s Records Desk');
    A.regItem('Gus\u2019s Records Desk', 'booth', g);
    var gm = new T.MeshBasicMaterial({ map: A.glowTex, color: '#ffe14d', transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending });
    var gl = add(g, new T.PlaneGeometry(2.6, 1.6), gm, 0, 0.03, 1.5); gl.rotation.x = -Math.PI / 2; gl.renderOrder = 2; A.noAud(gl);
    A.cabinets.push({ game: { id: 'gus', name: 'Gus the Archivist', desc: 'The grumpy keeper of the Hall of Game Records.', color: '#ffe14d' }, kind: 'gus', id: 'gus', group: g, x: x, z: z, rot: Math.PI,
      front: new T.Vector3(0, 0, 1.55).applyMatrix4(g.matrixWorld), dir: new T.Vector3(0, 0, -1), glow: gm, nextDraw: Infinity, r: 1.5 });
    gus.world = new T.Vector3(x, 0, z + 0.55);
  }

  /* ---------- DLC Machine 3000 ---------- */
  function buildDLC() {
    var x = W.minX + 3.2, z = W.minZ + 0.75;
    var g = new T.Group(); g.name = 'DLC Machine 3000'; g.position.set(x, 0, z); A.scene.add(g); ROOTS.push(g);
    var body = ph('#2a2f7a', 90, '#0a0c2a'), trim = chrome(), pink = '#ff4fd8', cyn = '#3ff0ff', yel = '#ffe14d';
    add(g, bx(2.3, 0.22, 1.2), ph('#1c1f3a', 60), 0, 0.11, 0); add(g, bx(2.32, 0.05, 1.22), glowM(cyn), 0, 0.2, 0);
    add(g, bx(1.7, 2.0, 0.9), body, 0, 1.22, -0.05);
    [-1, 1].forEach(function (sd) { add(g, cy(0.45, 0.45, 2.0, 24), body, sd * 0.85, 1.22, -0.05); add(g, cy(0.47, 0.47, 0.06, 24), trim, sd * 0.85, 2.24, -0.05); add(g, cy(0.47, 0.47, 0.06, 24), trim, sd * 0.85, 0.25, -0.05); });
    // bubbling side tubes
    var bubbles = [];
    [-1, 1].forEach(function (sd) {
      var tube = add(g, cy(0.12, 0.12, 1.5, 18, 1, true), new T.MeshPhongMaterial({ color: sd < 0 ? '#7df9ff' : '#ff9ad8', transparent: true, opacity: 0.35, shininess: 120, side: T.DoubleSide, depthWrite: false }), sd * 1.08, 1.2, 0.25); void tube;
      add(g, cy(0.14, 0.14, 0.08, 18), trim, sd * 1.08, 0.43, 0.25); add(g, cy(0.14, 0.14, 0.08, 18), trim, sd * 1.08, 1.97, 0.25);
      for (var i = 0; i < 5; i++) { var b = add(g, sp(0.04 + Math.random() * 0.03, 10), glowM(sd < 0 ? cyn : pink), sd * 1.08 + (Math.random() - 0.5) * 0.1, 0.5 + i * 0.3, 0.25 + (Math.random() - 0.5) * 0.1); b.userData.ph = Math.random(); bubbles.push(b); }
    });
    // dome with a spinning glowing core and orbit rings
    var dome = add(g, new T.SphereGeometry(0.62, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshPhongMaterial({ color: '#bfe9ff', transparent: true, opacity: 0.28, shininess: 140, depthWrite: false }), 0, 2.22, -0.05); void dome;
    var core = add(g, new T.IcosahedronGeometry(0.2, 1), new T.MeshPhongMaterial({ color: '#ff4fd8', emissive: '#a0158a', shininess: 120, flatShading: true }), 0, 2.45, -0.05);
    var ring1 = add(g, to(0.34, 0.015, 7, 40), glowM(yel), 0, 2.45, -0.05), ring2 = add(g, to(0.42, 0.012, 7, 40), glowM(cyn), 0, 2.45, -0.05);
    add(g, cy(0.02, 0.02, 0.5, 8), trim, 0.5, 2.6, -0.3); var dish = add(g, new T.SphereGeometry(0.14, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.5), new T.MeshPhongMaterial({ color: '#e9e2ff', side: T.DoubleSide, shininess: 80 }), 0.5, 2.88, -0.3); dish.rotation.x = -1.2;
    // marquee with chasing bulbs
    var mq = cvs(512, 128, function (c, w, h) { var gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#2a0b4a'); gr.addColorStop(0.5, '#4a0f6a'); gr.addColorStop(1, '#2a0b4a'); c.fillStyle = gr; c.fillRect(0, 0, w, h); A.neonText(c, 'DLC MACHINE 3000', w / 2, h * 0.42, 54, pink, w - 30); c.font = 'bold 22px "Trebuchet MS",sans-serif'; c.fillStyle = yel; c.textAlign = 'center'; c.fillText('INVENT \u00b7 PRINT \u00b7 UNLOCK', w / 2, h * 0.82); });
    planeM(1.62, 0.42, mq.tex, g, 0, 2.0, 0.41);
    var bulbs = []; for (var i = 0; i < 18; i++) { var t = i / 18, bxp, byp; if (t < 0.5) { bxp = -0.85 + t * 2 * 1.7; byp = 2.25; } else { bxp = 0.85 - (t - 0.5) * 2 * 1.7; byp = 1.75; } var bl = add(g, sp(0.035, 10), glowM(i % 2 ? yel : '#ffffff'), bxp, byp, 0.43); bulbs.push(bl); }
    // CRT screen
    add(g, bx(1.12, 0.78, 0.06), ph('#111111', 40), 0, 1.3, 0.42);
    var scr = cvs(256, 176, function () {}); scr.tex.minFilter = T.LinearFilter; scr.tex.generateMipmaps = false; planeM(1.0, 0.68, scr.tex, g, 0, 1.3, 0.455);
    // control panel, buttons, lever and ticket slot
    var cp = add(g, bx(1.7, 0.12, 0.5), ph('#3b2f8a', 80), 0, 0.82, 0.55); cp.rotation.x = 0.4;
    [['#ff3d5a', -0.55], ['#ffe14d', -0.3], ['#4ade80', -0.05], ['#3ff0ff', 0.2]].forEach(function (b) { add(g, cy(0.06, 0.06, 0.05, 14), glowM(b[0]), b[1], 0.9, 0.58); });
    var lever = new T.Group(); lever.position.set(0.62, 0.92, 0.55); g.add(lever); add(lever, cy(0.025, 0.025, 0.42, 10), trim, 0, 0.21, 0); add(lever, sp(0.07, 14), ph('#ff3d5a', 100), 0, 0.44, 0); add(g, cy(0.08, 0.08, 0.06, 14), trim, 0.62, 0.9, 0.55);
    add(g, bx(0.6, 0.08, 0.06), ph('#05020c', 10), 0, 0.55, 0.42); var slotGlow = add(g, bx(0.56, 0.02, 0.01), glowM(yel), 0, 0.55, 0.455);
    var tk = cvs(256, 96, function (c, w, h) { c.fillStyle = '#fff3c4'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ff4fd8'; c.lineWidth = 6; c.setLineDash([10, 6]); c.strokeRect(6, 6, w - 12, h - 12); c.setLineDash([]); c.fillStyle = '#4a0f6a'; c.font = 'bold 30px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.fillText('DLC TICKET', w / 2, 44); c.font = 'bold 18px sans-serif'; c.fillText('\u2605 APPROVED (maybe) \u2605', w / 2, 74); });
    var ticket = planeM(0.5, 0.2, tk.tex, g, 0, 0.5, 0.47); ticket.material.side = T.DoubleSide; ticket.rotation.x = -1.2; ticket.visible = false;
    g.updateMatrixWorld(true);
    A.addSolid(x - 1.25, x + 1.25, W.minZ, z + 0.85, 'DLC Machine 3000');
    A.regItem('DLC Machine 3000', 'booth', g);
    var gm = new T.MeshBasicMaterial({ map: A.glowTex, color: pink, transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending });
    var gl = add(g, new T.PlaneGeometry(2.8, 1.8), gm, 0, 0.03, 1.75); gl.rotation.x = -Math.PI / 2; gl.renderOrder = 2; A.noAud(gl);
    A.cabinets.push({ game: { id: 'dlc', name: 'DLC Machine 3000', desc: 'Invent expansion packs and unlock shipped DLC with tickets.', color: pink }, kind: 'dlc', id: 'dlc', group: g, x: x, z: z, rot: 0,
      front: new T.Vector3(0, 0, 1.75).applyMatrix4(g.matrixWorld), dir: new T.Vector3(0, 0, 1), glow: gm, nextDraw: Infinity, r: 1.6 });
    dlc = { g: g, bubbles: bubbles, core: core, ring1: ring1, ring2: ring2, dish: dish, bulbs: bulbs, scr: scr, lever: lever, ticket: ticket, slotGlow: slotGlow, printT: 0, white: glowM('#ffffff'), yel: glowM(yel), pink: glowM(pink) };
    screenDraw(0);
  }
  function screenDraw(t) {
    var g = dlc.scr.g, w = 256, h = 176; g.fillStyle = '#04120f'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(63,240,255,0.08)'; for (var y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
    g.font = 'bold 22px monospace'; g.textAlign = 'center'; g.fillStyle = '#5dff8a';
    var printing = dlc.printT > 0;
    g.fillText(printing ? 'PRINTING...' : (Math.floor(t * 1.5) % 2 ? 'INSERT IDEA' : 'DLC 3000 OS'), w / 2, 36);
    for (var i = 0; i < 12; i++) { var v = (Math.sin(t * 4 + i * 0.9) * 0.5 + 0.5) * (printing ? 1 : 0.6); g.fillStyle = i % 3 ? '#3ff0ff' : '#ff4fd8'; g.fillRect(18 + i * 19, 150 - v * 90, 13, v * 90); }
    g.font = 'bold 14px monospace'; g.fillStyle = '#ffe14d'; g.fillText(printing ? '\u2588'.repeat(Math.floor((1 - dlc.printT / 2.2) * 12)) : 'TICKETS ACCEPTED', w / 2, 168);
    dlc.scr.tex.needsUpdate = true;
  }
  H3.print = function () { if (!dlc.g) return; dlc.printT = 2.2; dlc.ticket.visible = true; dlc.ticket.position.set(0, 0.5, 0.47); };
  H3.printing = function () { return dlc.printT > 0; };

  /* ---------- entrance (bonus-zone side) + inside decor ---------- */
  function buildEntrance() {
    var dz = A.ROOM.maxZ, x0 = W.doorX;
    var g = new T.Group(); g.name = 'Hall entrance arch'; A.scene.add(g);
    [-1, 1].forEach(function (sd) {
      var px = x0 + sd * (W.doorHW + 0.16);
      add(g, bx(0.34, 0.2, 0.3), ph('#efe6d8', 40), px, 0.1, dz - 0.15); add(g, cy(0.12, 0.12, 3.2, 20), ph('#f4ede2', 60), px, 1.8, dz - 0.15);
      for (var k = 0; k < 8; k++) add(g, bx(0.02, 3.0, 0.02), ph('#d6cab6', 20), px + Math.cos(k / 8 * Math.PI * 2) * 0.12, 1.8, dz - 0.15 + Math.sin(k / 8 * Math.PI * 2) * 0.12);
      add(g, bx(0.34, 0.2, 0.3), gold(), px, 3.42, dz - 0.15);
    });
    add(g, bx(W.doorHW * 2 + 0.66, 0.16, 0.3), gold(), x0, 3.6, dz - 0.15);
    A.noAud(g); // door trim hugs the wall around the doorway (its two pillars still block walking)
    [-1, 1].forEach(function (sd) { var px = x0 + sd * (W.doorHW + 0.16); A.addSolid(px - 0.17, px + 0.17, dz - 0.3, dz, 'Hall entrance arch'); });
    var s = plaqueTex(1024, 220, 'HALL OF GAME RECORDS', 'every Grok game \u00b7 pictures \u00b7 history \u00b7 old versions', '#ffe14d', '#3a1430');
    var sm = new T.Mesh(new T.PlaneGeometry(3.4, 0.73), new T.MeshBasicMaterial({ map: s.tex })); sm.position.set(x0, 4.25, dz - 0.03); sm.rotation.y = Math.PI; A.wallSign('HALL OF GAME RECORDS', sm);
    var dc = A.decal('HALL OF RECORDS', 3.0, 0.9, '#ffe14d', x0, dz - 1.5, Math.PI, 'pictures \u00b7 history \u00b7 old versions'); A.regItem('decal:HALL', 'decal', dc);
    // inside: big sign over the door + Gus's visitor rules + benches + plants + a golden joystick statue
    var s2 = plaqueTex(1024, 200, 'HALL OF GAME RECORDS', 'est. 2026 \u00b7 curator: Gus (he\u2019s grumpy)', '#ffe14d', '#3a1430');
    var sm2 = new T.Mesh(new T.PlaneGeometry(3.6, 0.7), new T.MeshBasicMaterial({ map: s2.tex })); sm2.position.set(x0, 4.2, W.minZ + 0.06); A.wallSign('HALL sign inside', sm2); ROOTS.push(sm2);
    var rules = cvs(512, 384, function (c, w, h) { c.fillStyle = '#f5ecd8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#7a4a2a'; c.lineWidth = 14; c.strokeRect(7, 7, w - 14, h - 14); c.fillStyle = '#3a2216'; c.textAlign = 'center'; c.font = 'bold 40px Georgia,serif'; c.fillText('VISITOR RULES', w / 2, 62); c.textAlign = 'left'; c.font = 'bold 26px Georgia,serif';
      ['1. No running.', '2. No touching the glass.', '3. No fun. (Kidding.)', '   (Not kidding.)', '4. Old versions = separate', '   saves. You\u2019re welcome.', '        - Gus'].forEach(function (l, i) { c.fillText(l, 36, 112 + i * 38); }); });
    var rm = new T.Mesh(new T.PlaneGeometry(1.5, 1.12), new T.MeshBasicMaterial({ map: rules.tex })); rm.position.set(14.6, 2.3, W.minZ + 0.06); A.wallSign('Visitor Rules', rm); ROOTS.push(rm);
    var fr = new T.Group(); fr.name = 'Visitor Rules frame'; A.scene.add(fr); ROOTS.push(fr); add(fr, bx(1.62, 1.24, 0.04), gold(), 14.6, 2.3, W.minZ + 0.03); A.noAud(fr);
    // bench + statue in the middle of the hall
    var b = new T.Group(); b.name = 'Golden Joystick statue'; A.scene.add(b); ROOTS.push(b); var bxz = [W.doorX, W.minZ + 9.0];
    add(b, cy(0.95, 1.0, 0.45, 32), ph('#5b3520', 40), bxz[0], 0.22, bxz[1]); add(b, cy(1.0, 1.0, 0.06, 32), ph('#9b1c31', 10), bxz[0], 0.47, bxz[1]);
    add(b, cy(0.32, 0.38, 0.9, 20), ph('#f4ede2', 70), bxz[0], 0.95, bxz[1]); add(b, cy(0.3, 0.2, 0.12, 20), gold(), bxz[0], 1.46, bxz[1]);
    var stick = add(b, cy(0.04, 0.05, 0.5, 12), gold(), bxz[0], 1.77, bxz[1]); void stick; var knob = add(b, sp(0.12, 20), ph('#ffcf3a', 120, '#5a4000'), bxz[0], 2.08, bxz[1]); void knob;
    A.addSolid(bxz[0] - 1.0, bxz[0] + 1.0, bxz[1] - 1.0, bxz[1] + 1.0); b.updateMatrixWorld(true); A.regItem('Golden Joystick statue', 'prop', b);
    // potted ferns
    [[12.9, W.minZ + 0.6], [7.1, W.minZ + 0.6]].forEach(function (p, i) {
      var pg = new T.Group(); pg.name = 'Hall fern ' + i; A.scene.add(pg); ROOTS.push(pg);
      add(pg, cy(0.3, 0.24, 0.55, 16), ph('#b45309', 30), p[0], 0.28, p[1]); add(pg, to(0.3, 0.03), gold(), p[0], 0.55, p[1]).rotation.x = Math.PI / 2;
      for (var k = 0; k < 7; k++) { var lf = add(pg, sp(0.16, 10), ph(k % 2 ? '#2f9e44' : '#3fbf5a', 20), p[0] + Math.cos(k) * 0.16, 0.8 + (k % 3) * 0.1, p[1] + Math.sin(k) * 0.12); lf.scale.set(0.6, 1.6, 0.6); lf.rotation.set(Math.cos(k) * 0.5, 0, Math.sin(k) * 0.5); }
      A.addSolid(p[0] - 0.32, p[0] + 0.32, p[1] - 0.32, p[1] + 0.32); pg.updateMatrixWorld(true); A.regItem('Hall fern ' + i, 'plant', pg);
    });
  }

  /* ---------- build ---------- */
  H3.build = function (api) {
    A = api; W = api.WING;
    buildShell(); buildEntrance();
    var games = GA.MAIN_GAMES.filter(function (g) { return GA.HALL_DATA && GA.HALL_DATA[g.id]; });
    var slots = [];
    [0, 1, 2, 3, 4].forEach(function (i) { slots.push([W.minX, W.minZ + 2.2 + i * 2.0, Math.PI / 2]); });
    [0, 1, 2, 3, 4, 5].forEach(function (i) { slots.push([W.minX + 2.8 + i * 2.08, W.maxZ, Math.PI]); });
    [4, 3, 2, 1, 0].forEach(function (i) { slots.push([W.maxX, W.minZ + 2.2 + i * 2.0, -Math.PI / 2]); });
    // overflow: one more exhibit at the back end of each side wall (clear of the back-wall exhibits)
    slots.push([W.minX, W.minZ + 12.2, Math.PI / 2]); slots.push([W.maxX, W.minZ + 12.2, -Math.PI / 2]);
    // 19th: free-standing on the right of Gus's desk, facing the entrance
    slots.push([W.doorX + 4.4, W.minZ + 5.6, Math.PI]);
    // 20th / 21st: free-standing on the left of Gus's desk, then beside the Golden Joystick statue facing it
    if (games.length > 19) slots.push([W.doorX - 4.4, W.minZ + 5.6, Math.PI]);
    if (games.length > 20) slots.push([W.doorX - 3.6, W.minZ + 9.2, Math.PI / 2]);
    var par = A.scene;
    games.forEach(function (gm, i) { var s = slots[i]; if (!s) return; exhibit(gm, GA.HALL_DATA[gm.id], s[0], s[1], s[2]); });
    // wood pilasters between the exhibits
    for (var i = 0; i < 4; i++) { pilaster(par, W.minX, W.minZ + 3.2 + i * 2.0, Math.PI / 2); pilaster(par, W.maxX, W.minZ + 3.2 + i * 2.0, -Math.PI / 2); }
    if (games.length > 16) pilaster(par, W.minX, W.minZ + 11.2, Math.PI / 2); if (games.length > 17) pilaster(par, W.maxX, W.minZ + 11.2, -Math.PI / 2);
    for (i = 0; i < 5; i++) pilaster(par, W.minX + 3.84 + i * 2.08, W.maxZ, Math.PI);
    buildDesk(); buildDLC();
    var last = -1;
    A.anims.push(function (t) {
      var p = A.pose(), inH = p.z > A.ROOM.maxZ - 3;
      var cam = A.camera().position, vis = p.z > A.ROOM.maxZ - 7 || cam.z > A.ROOM.maxZ - 7 || (p.x > A.DIV_X - 1.5 && p.z > -3);
      if (vis !== state.vis) { state.vis = vis; ROOTS.forEach(function (o) { o.visible = vis; }); }
      state.inHall = inH;
      var inside = p.z > A.ROOM.maxZ + 0.3; // greet once per visit (and not again within 30s)
      if (inside && !state.saidHi && GA.HallUI && !(GA.Hall && GA.Hall.isOpen()) && t - (state.hiT || -99) > 30) { state.saidHi = true; state.hiT = t; H3.say(GA.HallUI.line('hello'), 5); }
      if (p.z < A.ROOM.maxZ - 1.5) state.saidHi = false;
      var dt = state.lt ? Math.min(0.05, t - state.lt) : 0.016; state.lt = t;
      if (!inH) return;
      EX.forEach(function (e, k) { e.em.rotation.y = t * 0.7 + k; var s = e.em.children[0] && e.em.userData; if (e.em.userData.bob) e.em.position.y = 0.98 + Math.sin(t * 2 + k) * 0.03; void s; });
      // Gus: breathe, track the player, stamp papers, react when he talks
      if (gus.root) {
        gus.body.position.y = Math.sin(t * 1.6) * 0.012;
        var gw = gus.world, dx = p.x - gw.x, dz = p.z - gw.z, d = Math.hypot(dx, dz);
        var want = d < 7 ? Math.max(-0.9, Math.min(0.9, Math.atan2(-dx, -dz))) : Math.sin(t * 0.4) * 0.3;
        gus.head.rotation.y += (want - gus.head.rotation.y) * Math.min(1, dt * 4);
        gus.stampT -= dt; var st = 0;
        if (gus.stampT < 0) { st = Math.min(1, -gus.stampT * 3); if (gus.stampT < -0.7) { gus.stampT = 4 + Math.random() * 4; } }
        gus.aR.rotation.x = -0.4 - Math.sin(st * Math.PI) * 1.0; gus.aR.rotation.z = -0.15;
        gus.aL.rotation.x = -0.6 + (gus.sayT > 0 ? Math.sin(t * 8) * 0.25 : 0); gus.aL.rotation.z = 0.5;
        if (gus.sayT > 0) { gus.sayT -= dt; gus.mus.position.y = 0.02 + Math.abs(Math.sin(t * 14)) * 0.012; gus.bub.material.opacity = Math.min(1, gus.sayT * 2); if (gus.sayT <= 0) gus.bub.visible = false; }
        gus.react = Math.max(0, gus.react - dt * 1.5); gus.head.position.y = 1.62 + gus.react * Math.abs(Math.sin(t * 10)) * 0.04;
        var br = 0.35 + gus.react * 0.25; gus.browL.rotation.z = -br; gus.browR.rotation.z = br;
      }
      // DLC machine: bubbles, core, chasing bulbs, screen, printing
      if (dlc.g) {
        dlc.bubbles.forEach(function (b) { b.userData.ph = (b.userData.ph + dt * (dlc.printT > 0 ? 0.9 : 0.3)) % 1; b.position.y = 0.5 + b.userData.ph * 1.4; });
        dlc.core.rotation.y = t * (dlc.printT > 0 ? 6 : 1.2); dlc.core.rotation.x = t * 0.7; dlc.ring1.rotation.x = t * 1.3; dlc.ring2.rotation.y = t * 0.9; dlc.ring2.rotation.x = 1 + Math.sin(t) * 0.4; dlc.dish.rotation.z = t;
        var k = Math.floor(t * (dlc.printT > 0 ? 18 : 6)); dlc.bulbs.forEach(function (b, i) { b.material = (i + k) % 3 === 0 ? dlc.yel : (i + k) % 3 === 1 ? dlc.pink : dlc.white; });
        if (dlc.printT > 0) { dlc.printT -= dt; var q = 1 - Math.max(0, dlc.printT) / 2.2; dlc.lever.rotation.x = q < 0.3 ? q / 0.3 * 1.0 : 1.0 - Math.min(1, (q - 0.3) / 0.3); dlc.ticket.position.set(0, 0.5 - Math.min(0.25, q * 0.5), 0.47 + Math.min(0.3, q * 0.6)); dlc.slotGlow.visible = Math.floor(t * 10) % 2 === 0; if (dlc.printT <= 0) { dlc.ticket.visible = false; dlc.slotGlow.visible = true; dlc.lever.rotation.x = 0; } }
        var kk = Math.floor(t * 10); if (kk !== last) { last = kk; screenDraw(t); }
      }
    });
  };
  H3.exhibits = function () { return EX.map(function (e) { return { id: e.id, x: +e.cab.front.x.toFixed(2), z: +e.cab.front.z.toFixed(2) }; }); };
  H3.gus = function () { return { built: !!gus.root, talking: gus.sayT > 0, line: gus.last || null }; };
  H3.dlc = function () { return { built: !!dlc.g, printing: dlc.printT > 0 }; };
})();
