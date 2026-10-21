/* Grok Arcade (#50) - Bonus Zone East Wing + Grandma Mrs (head attendant of the Bonus Zone) + Grand Gallery decor.
   The East Wing opens through a wide arch in the bonus room's east wall (x 18.4..32, z -12..12). The Hall of Game Records'
   Grand Gallery (z 48.4..66) is built by js/hall.js (shell + exhibits); this file adds its sign, benches and plants.
   Grandma Mrs is Gary's great-great-grandmother: very nice, sometimes TOO nice, easily sidetracked, loves drama,
   and her phone is always broken. Talk to her at her attendant desk (js/grandma-ui.js). */
(function () {
  'use strict';
  var T = THREE, WG = GA.Wing50 = {}, A, B, ROOT;
  var mats = {};
  function ph(c, s, e) { var k = c + '|' + (s || 30) + '|' + (e || ''); return mats[k] || (mats[k] = new T.MeshPhongMaterial({ color: c, shininess: s || 30, emissive: e ? new T.Color(e) : new T.Color(0) })); }
  function add(p, g, m, x, y, z) { var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); p.add(o); return o; }
  function bx(w, h, d) { return new T.BoxGeometry(w, h, d); }
  function cy(a, b, h, s) { return new T.CylinderGeometry(a, b, h, s || 16); }
  function sp(r, s) { return new T.SphereGeometry(r, s || 16, Math.max(8, Math.round((s || 16) * 0.7))); }
  function grp(name, x, z, ry) { var g = new T.Group(); g.name = name; g.position.set(x || 0, 0, z || 0); g.rotation.y = ry || 0; ROOT.add(g); return g; }
  function reg(name, g, kind) { g.updateMatrixWorld(true); return A.regItem(name, kind || 'prop', g); }
  function cvsTex(w, h, draw) { var c = A.mkCanvas(w, h), g = c.getContext('2d'); draw(g, w, h); var t = A.canvasTex(c); return { c: c, g: g, tex: t }; }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  WG.DESK = { x: 26.6, z: -3.2 }; // Grandma's attendant desk (she stands east of it, facing the arch)

  /* ---------- East Wing shell ---------- */
  function shell() {
    var W = B.maxX - B.minX, D = B.maxZ - B.minZ, cx = (B.minX + B.maxX) / 2, H = A.ROOM.h, th = 0.4;
    var g = grp('East Wing shell'); A.noAud(g);
    // floor: the bonus room's purple checker, but with a warm "grandma's parlor" rug in the middle
    var fc = A.mkCanvas(256, 256), x = fc.getContext('2d'); x.fillStyle = '#3a1450'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#311046'; x.fillRect(0, 0, 128, 128); x.fillRect(128, 128, 128, 128);
    x.strokeStyle = 'rgba(255,79,216,0.4)'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, 253, 253); x.beginPath(); x.moveTo(128, 0); x.lineTo(128, 256); x.moveTo(0, 128); x.lineTo(256, 128); x.stroke();
    var ft = A.canvasTex(fc); ft.wrapS = ft.wrapT = T.RepeatWrapping; ft.repeat.set(W / 2, D / 2);
    var fl = add(g, new T.PlaneGeometry(W, D), new T.MeshLambertMaterial({ map: ft }), cx, 0, 0); fl.rotation.x = -Math.PI / 2;
    var cc = A.mkCanvas(256, 256), c2 = cc.getContext('2d'); c2.fillStyle = '#120830'; c2.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 40; i++) { c2.fillStyle = ['#3ff0ff', '#ff4fd8', '#ffe14d', '#ffffff'][i % 4]; c2.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
    var ct = A.canvasTex(cc); ct.wrapS = ct.wrapT = T.RepeatWrapping; ct.repeat.set(3, 4);
    var ce = add(g, new T.PlaneGeometry(W, D), new T.MeshBasicMaterial({ map: ct }), cx, H, 0); ce.rotation.x = Math.PI / 2;
    var wall = A.lam('#3b2370');
    add(g, bx(W + th, H, th), wall, cx, H / 2, B.minZ - th / 2); add(g, bx(W + th, H, th), wall, cx, H / 2, B.maxZ + th / 2); add(g, bx(th, H, D + th * 2), wall, B.maxX + th / 2, H / 2, 0);
    var pink = A.basic('#ff4fd8'), cyan = A.basic('#3ff0ff'), yel = A.basic('#ffe14d');
    function strip(x1, z1, x2, z2, y, m) { add(g, bx(Math.max(Math.abs(x2 - x1), 0.07), 0.08, Math.max(Math.abs(z2 - z1), 0.07)), m, (x1 + x2) / 2, y, (z1 + z2) / 2); }
    var e = 0.03;
    strip(B.minX, B.minZ + e, B.maxX, B.minZ + e, 4.4, cyan); strip(B.minX, B.maxZ - e, B.maxX, B.maxZ - e, 4.4, pink); strip(B.maxX - e, B.minZ, B.maxX - e, B.maxZ, 4.4, yel);
    strip(B.minX, B.minZ + e, B.maxX, B.minZ + e, 0.1, cyan); strip(B.minX, B.maxZ - e, B.maxX, B.maxZ - e, 0.1, cyan); strip(B.maxX - e, B.minZ, B.maxX - e, B.maxZ, 0.1, pink);
    // the arch: neon frame on both faces, wing side gets its own sign
    [A.ROOM.maxX - 0.03, B.minX + 0.03].forEach(function (ax) { [-1, 1].forEach(function (sd) { add(g, bx(0.08, B.archH, 0.08), pink, ax, B.archH / 2, sd * B.archHW); }); add(g, bx(0.08, 0.08, B.archHW * 2), pink, ax, B.archH, 0); });
    [-1, 1].forEach(function (sd) { strip(B.minX + e, sd * B.archHW, B.minX + e, sd * (D / 2), 4.4, pink); strip(B.minX + e, sd * B.archHW, B.minX + e, sd * (D / 2), 0.1, cyan); });
    for (var lx = B.minX + 3; lx < B.maxX - 1; lx += 5) [-6, 0, 6].forEach(function (lz) { add(g, bx(4, 0.06, 0.25), A.basic('#e9e2ff'), lx + 1.2, H - 0.05, lz); });
    var pl = new T.PointLight('#ffd6f5', 0.5, 18, 1.6); pl.position.set(cx, H - 0.7, 0); g.add(pl);
    var s1 = A.sign('< BONUS ZONE', 4.2, 1.0, '#ff4fd8'); s1.position.set(B.minX + 0.04, 4.25, 0); s1.rotation.y = Math.PI / 2; A.wallSign('< BONUS ZONE (East Wing side)', s1);
    var s2 = A.sign('BONUS ZONE: EAST WING\nhead attendant: Grandma Mrs', 7.4, 1.3, '#ffe14d'); s2.position.set(B.maxX - 0.03, 4.0, 0); s2.rotation.y = -Math.PI / 2; A.wallSign('EAST WING', s2);
    A.regItem('decal:EAST WING', 'decal', A.decal('EAST WING', 4.6, 1.2, '#ffe14d', 20.6, 0, -Math.PI / 2, 'more bonus games - ask Grandma'));
  }

  /* ---------- parlor corner: rug, armchair, side table with the cookie jar, plants, bean bags ---------- */
  function parlor() {
    var rug = cvsTex(512, 512, function (g, w, h) {
      g.fillStyle = '#7a2d4a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f7c8d8'; g.lineWidth = 14; g.strokeRect(20, 20, w - 40, h - 40); g.lineWidth = 6; g.strokeRect(48, 48, w - 96, h - 96);
      for (var i = 0; i < 6; i++) for (var j = 0; j < 6; j++) { g.fillStyle = (i + j) % 2 ? '#f7c8d8' : '#ffe14d'; g.beginPath(); g.arc(96 + i * 64, 96 + j * 64, 10, 0, 7); g.fill(); }
    });
    var rm = new T.Mesh(new T.PlaneGeometry(4.2, 4.2), new T.MeshLambertMaterial({ map: rug.tex })); rm.rotation.x = -Math.PI / 2; rm.position.set(24.8, 0.012, 4.6); ROOT.add(rm); A.noAud(rm);
    // armchair (floral) + side table + cookie jar
    var ch = grp('Grandma\u2019s armchair', 27.4, 6.0, -Math.PI * 0.75), fab = ph('#e98bb4', 10), wood = ph('#6b4226', 30);
    add(ch, bx(1.0, 0.42, 0.9), fab, 0, 0.35, 0); add(ch, bx(1.0, 0.9, 0.22), fab, 0, 0.9, -0.36); [-1, 1].forEach(function (sd) { add(ch, bx(0.2, 0.55, 0.9), fab, sd * 0.5, 0.6, 0); });
    [[-0.4, -0.35], [0.4, -0.35], [-0.4, 0.35], [0.4, 0.35]].forEach(function (q) { add(ch, cy(0.04, 0.04, 0.16, 8), wood, q[0], 0.08, q[1]); });
    add(ch, sp(0.18, 12), ph('#fff1a8', 10), -0.2, 0.68, -0.05).scale.set(1.3, 0.6, 1); // a doily cushion
    reg('Grandma\u2019s armchair', ch); A.addSolid(26.75, 28.05, 5.35, 6.65, 'Grandma\u2019s armchair');
    var tb = grp('Cookie table', 25.6, 7.4); add(tb, cy(0.42, 0.42, 0.05, 20), wood, 0, 0.7, 0); add(tb, cy(0.05, 0.08, 0.68, 10), wood, 0, 0.35, 0); add(tb, cy(0.3, 0.3, 0.03, 16), ph('#ffffff', 60), 0, 0.73, 0);
    add(tb, cy(0.13, 0.15, 0.26, 16), new T.MeshPhongMaterial({ color: '#cfeaff', transparent: true, opacity: 0.55, shininess: 90 }), 0, 0.87, 0); add(tb, sp(0.1, 10), ph('#ff4fd8', 30), 0, 1.03, 0).scale.set(1, 0.5, 1);
    [[0, 0.8], [0.05, 0.86], [-0.05, 0.9]].forEach(function (q) { add(tb, cy(0.07, 0.07, 0.025, 12), ph('#c58a4a', 10), q[0], q[1], 0); });
    reg('Cookie table', tb); A.addSolid(25.15, 26.05, 6.95, 7.85, 'Cookie table');
    // bean bags (the Bonus Zone's famous ones got a second set out here)
    [[21.6, 7.2, '#3ff0ff'], [22.9, 8.0, '#ffe14d'], [21.4, -7.6, '#ff4fd8']].forEach(function (q, i) {
      var b = grp('East Wing bean bag ' + i, q[0], q[1]); var m = add(b, sp(0.5, 16), ph(q[2], 20), 0, 0.3, 0); m.scale.set(1, 0.6, 1); add(b, sp(0.32, 12), ph(q[2], 20), 0, 0.5, -0.22).scale.set(1, 0.8, 0.6);
      reg('East Wing bean bag ' + i, b); A.addSolid(q[0] - 0.5, q[0] + 0.5, q[1] - 0.5, q[1] + 0.5, 'East Wing bean bag ' + i);
    });
    [[19.0, -10.9], [19.0, 10.9]].forEach(function (q, i) { var pg = grp('East Wing plant ' + i, q[0], q[1]); add(pg, cy(0.26, 0.2, 0.5, 14), ph('#d97706', 20), 0, 0.25, 0); for (var k = 0; k < 6; k++) { var lf = add(pg, sp(0.2, 8), ph('#22a55a', 10), Math.cos(k) * 0.14, 0.7 + (k % 3) * 0.12, Math.sin(k) * 0.14); lf.scale.set(0.6, 1.4, 0.6); } reg('East Wing plant ' + i, pg); A.addSolid(q[0] - 0.27, q[0] + 0.27, q[1] - 0.27, q[1] + 0.27, 'East Wing plant ' + i); });
  }

  /* ---------- Grandma Mrs + her attendant desk ---------- */
  var GM = {}, BUB = null;
  function bubble(par, y) {
    var c = A.mkCanvas(512, 200), t = A.canvasTex(c); t.minFilter = T.LinearFilter; t.generateMipmaps = false;
    var s = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false })); s.scale.set(2.4, 0.94, 1); s.position.set(0, y, 0); s.visible = false; s.renderOrder = 10; par.add(s); A.noAud(s);
    return { s: s, c: c, t: t, T: 0, last: null };
  }
  function bubbleDraw(b, text) {
    var c = b.c, g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
    g.fillStyle = '#fff2f8'; g.strokeStyle = '#8a2a5a'; g.lineWidth = 6; rr(g, 6, 6, w - 12, h - 46, 26); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(w / 2 - 20, h - 42); g.lineTo(w / 2, h - 8); g.lineTo(w / 2 + 20, h - 42); g.closePath(); g.fill(); g.stroke(); g.fillRect(w / 2 - 17, h - 46, 34, 6);
    g.fillStyle = '#4a1030'; g.textAlign = 'center'; g.textBaseline = 'middle';
    var words = String(text).split(' '), lines = [], cur = '', px = 30; g.font = 'bold ' + px + 'px "Trebuchet MS",system-ui,sans-serif';
    function wrap(mw) { lines = []; cur = ''; words.forEach(function (wd) { var tt = cur ? cur + ' ' + wd : wd; if (g.measureText(tt).width > mw) { lines.push(cur); cur = wd; } else cur = tt; }); if (cur) lines.push(cur); }
    wrap(w - 50); if (lines.length > 3) { px = 24; g.font = 'bold ' + px + 'px "Trebuchet MS",system-ui,sans-serif'; wrap(w - 40); lines = lines.slice(0, 4); }
    lines.forEach(function (ln, i) { g.fillText(ln, w / 2, (h - 40) / 2 + (i - (lines.length - 1) / 2) * (px + 4)); });
    b.t.needsUpdate = true;
  }
  WG.say = function (text, secs) { if (!BUB) return text; bubbleDraw(BUB, text); BUB.s.visible = true; BUB.T = secs || 4.5; BUB.last = text; GM.react = 1; return text; };
  WG.line = function () { return BUB && BUB.T > 0 ? BUB.last : null; };
  WG.phoneUp = function (on) { GM.phoneUp = !!on; };

  function grandma(par) {
    var r = new T.Group(); par.add(r);
    var skin = ph('#f1c7a5', 15), card = ph('#e46aa6', 12), dress = ph('#a78bfa', 15), hair = ph('#f3f4f6', 8), shoe = ph('#5b3a29', 20), pearl = ph('#fffaf0', 90);
    var body = new T.Group(); r.add(body);
    add(body, cy(0.36, 0.5, 0.75, 20), dress, 0, 0.5, 0); // skirt
    [-0.12, 0.12].forEach(function (x) { add(body, cy(0.05, 0.05, 0.16, 8), ph('#e8d6c8', 10), x, 0.1, 0.02); add(body, bx(0.13, 0.07, 0.22), shoe, x, 0.035, 0.05); });
    var torso = add(body, sp(0.33, 20), card, 0, 1.0, 0); torso.scale.set(1, 1.12, 0.88);
    for (var i = 0; i < 4; i++) add(body, sp(0.025, 8), ph('#ffe14d', 60), 0, 1.18 - i * 0.12, 0.29);
    for (i = 0; i < 11; i++) { var a = -1.1 + i * 0.22; add(body, sp(0.028, 8), pearl, Math.sin(a) * 0.17, 1.3 - Math.cos(a) * 0.08, 0.2 + Math.cos(a) * 0.05); }
    function arm(sd) { var g = new T.Group(); g.position.set(sd * 0.34, 1.22, 0); body.add(g); add(g, cy(0.075, 0.07, 0.44, 12), card, 0, -0.22, 0); add(g, sp(0.075, 12), skin, 0, -0.47, 0); return g; }
    var aL = arm(-1), aR = arm(1);
    // her phone (big buttons, cracked screen, sparkly case) in her right hand
    var phn = new T.Group(); phn.position.set(0, -0.52, 0.06); aR.add(phn); add(phn, bx(0.13, 0.22, 0.03), ph('#ff4fd8', 60, '#3a0020'), 0, 0, 0);
    var scr = add(phn, new T.PlaneGeometry(0.11, 0.19), A.basic('#9be7ff'), 0, 0, 0.016); scr.rotation.y = 0;
    var head = new T.Group(); head.position.set(0, 1.52, 0.02); body.add(head);
    add(head, sp(0.25, 22), skin, 0, 0.05, 0).scale.set(1, 1.05, 0.98);
    add(head, sp(0.27, 18), hair, 0, 0.16, -0.05).scale.set(1, 0.75, 1); add(head, sp(0.14, 14), hair, 0, 0.36, -0.12); // bun
    add(head, new T.TorusGeometry(0.06, 0.012, 6, 14), ph('#e46aa6', 20), 0, 0.42, -0.14).rotation.x = Math.PI / 2; // hair ribbon
    [-0.09, 0.09].forEach(function (x) { add(head, sp(0.032, 10), ph('#1f1235', 10), x, 0.08, 0.22); var lens = add(head, new T.TorusGeometry(0.06, 0.01, 6, 16), ph('#c9993a', 80), x, 0.08, 0.235); void lens; add(head, sp(0.05, 10), ph('#ff9eb8', 5), x * 1.6, -0.03, 0.18).scale.set(1, 0.6, 0.4); });
    add(head, bx(0.06, 0.012, 0.012), ph('#c9993a', 80), 0, 0.08, 0.24);
    add(head, sp(0.04, 10), ph('#e9a98a', 10), 0, 0.0, 0.25);
    var mouth = add(head, new T.TorusGeometry(0.06, 0.013, 8, 16, Math.PI), ph('#a8325a', 20), 0, -0.08, 0.215); mouth.rotation.z = Math.PI;
    GM.body = body; GM.head = head; GM.aL = aL; GM.aR = aR; GM.phone = phn; GM.scr = scr; GM.mouth = mouth;
    return r;
  }
  function desk() {
    var D = WG.DESK, g = grp('Grandma Mrs\u2019s attendant desk', D.x, D.z), wood = ph('#7a4a2a', 30), top = ph('#f7c8d8', 40);
    add(g, bx(0.9, 1.0, 2.4), wood, 0, 0.5, 0); add(g, bx(1.0, 0.06, 2.5), top, 0, 1.03, 0);
    var plq = cvsTex(512, 160, function (c, w, h) { c.fillStyle = '#3a1430'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ffe14d'; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16); c.textAlign = 'center'; c.fillStyle = '#ffe14d'; c.font = 'bold 50px "Trebuchet MS",sans-serif'; c.fillText('HEAD ATTENDANT', w / 2, 66); c.fillStyle = '#fff'; c.font = 'bold 34px "Trebuchet MS",sans-serif'; c.fillText('Grandma Mrs \u00b7 ask me anything!', w / 2, 120); });
    var pm = new T.Mesh(new T.PlaneGeometry(1.9, 0.6), new T.MeshBasicMaterial({ map: plq.tex })); pm.position.set(-0.46, 0.62, 0); pm.rotation.y = -Math.PI / 2; g.add(pm);
    // desk clutter: teacup, knitting basket with yarn, a "PHONE HELP?" sign, a candy bowl
    add(g, cy(0.07, 0.05, 0.08, 12), ph('#ffffff', 60), 0.1, 1.1, 0.8); add(g, cy(0.1, 0.1, 0.01, 14), ph('#ffffff', 60), 0.1, 1.065, 0.8);
    add(g, cy(0.18, 0.14, 0.16, 14), ph('#c58a4a', 10), 0.05, 1.14, -0.8); add(g, sp(0.09, 10), ph('#3ff0ff', 10), 0.0, 1.24, -0.82); add(g, sp(0.08, 10), ph('#ff4fd8', 10), 0.1, 1.24, -0.74);
    [-1, 1].forEach(function (s) { add(g, cy(0.006, 0.006, 0.36, 4), ph('#d1d5db', 80), 0.05 + s * 0.04, 1.32, -0.8).rotation.z = s * 0.5; });
    add(g, sp(0.16, 14), new T.MeshPhongMaterial({ color: '#dff6ff', transparent: true, opacity: 0.5 }), 0.1, 1.12, 0.1).scale.set(1, 0.5, 1);
    var hs = cvsTex(256, 160, function (c, w, h) { c.fillStyle = '#fffbe6'; c.fillRect(0, 0, w, h); c.fillStyle = '#a8325a'; c.textAlign = 'center'; c.font = 'bold 40px "Comic Sans MS","Trebuchet MS",cursive'; c.fillText('PHONE', w / 2, 62); c.fillText('HELP??', w / 2, 112); c.font = '22px sans-serif'; c.fillText('(please) \u2665', w / 2, 146); });
    var hm = new T.Mesh(new T.PlaneGeometry(0.42, 0.26), new T.MeshBasicMaterial({ map: hs.tex })); hm.position.set(-0.1, 1.24, 0.4); hm.rotation.y = -Math.PI / 2 + 0.2; g.add(hm);
    reg('Grandma Mrs\u2019s attendant desk', g); A.addSolid(D.x - 0.5, D.x + 0.5, D.z - 1.25, D.z + 1.25, 'Grandma Mrs\u2019s attendant desk');
    var gm = grp('Grandma Mrs', D.x + 0.95, D.z, -Math.PI / 2); GM.root = grandma(gm); BUB = bubble(gm, 2.35);
    A.addSolid(D.x + 0.55, D.x + 1.35, D.z - 0.4, D.z + 0.4, 'Grandma Mrs');
    // walk-up spot in front of the desk (west side, facing her)
    var fx = D.x - 1.35, fz = D.z, an = new T.Group(); an.name = 'anchor gm_mrs'; an.position.set(fx - 1.75, 0, fz); an.rotation.y = Math.PI / 2; A.scene.add(an); an.updateMatrixWorld(true);
    var glw = new T.MeshBasicMaterial({ map: A.glowTex, color: '#ff9ed2', transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending });
    var gp = new T.Mesh(new T.PlaneGeometry(1.4, 2.2), glw); gp.rotation.x = -Math.PI / 2; gp.position.set(fx + 0.2, 0.03, fz); gp.renderOrder = 2; ROOT.add(gp); A.noAud(gp);
    var c = { game: { id: 'gm_mrs', name: 'Grandma Mrs', desc: '', color: '#ff9ed2' }, kind: 'gm_mrs', ar: true, id: 'gm_mrs', group: an, owner: g, x: fx, z: fz, rot: 0,
      front: new T.Vector3(fx, 0, fz), dir: new T.Vector3(1, 0, 0), glow: glw, nextDraw: Infinity, r: 1.25, data: {} };
    A.cabinets.push(c); WG.cab = c;
  }

  /* ---------- Grand Gallery decor (the Hall's new back room) ---------- */
  function gallery() {
    var W = A.WING, AZ = W.annexZ || 48, gold = ph('#e8b84a', 90, '#3a2400');
    var t = cvsTex(1024, 220, function (g, w, h) { var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a1430'); gr.addColorStop(1, '#22120a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = '#e8b84a'; g.lineWidth = 10; g.strokeRect(10, 10, w - 20, h - 20); g.textAlign = 'center'; g.fillStyle = '#ffe14d'; g.font = 'bold 96px Georgia,serif'; g.fillText('THE GRAND GALLERY', w / 2, 118); g.fillStyle = '#f5e6c8'; g.font = 'bold 40px "Trebuchet MS",sans-serif'; g.fillText('room to breathe \u00b7 room to grow \u00b7 Gus still says no running', w / 2, 180); });
    [[AZ - 0.02, Math.PI], [AZ + 0.42, 0]].forEach(function (q, i) { var m = new T.Mesh(new T.PlaneGeometry(3.4, 0.73), new T.MeshBasicMaterial({ map: t.tex })); m.position.set(W.doorX, 4.15, q[0]); m.rotation.y = q[1]; A.wallSign(i ? 'GRAND GALLERY (inside)' : 'GRAND GALLERY', m); });
    // runner carpet down the middle + two velvet benches + two big ferns
    var rc = add(ROOT, bx(2.0, 0.02, W.maxZ - AZ - 2.4), ph('#9b1c31', 10), W.doorX, 0.012, (AZ + W.maxZ) / 2 - 0.6); A.noAud(rc);
    [[7.0, 57.2], [13.0, 57.2]].forEach(function (q, i) {
      var b = grp('Gallery bench ' + i, q[0], q[1]); add(b, bx(0.6, 0.12, 2.0), ph('#7a1530', 10), 0, 0.48, 0); add(b, bx(0.66, 0.06, 2.06), gold, 0, 0.4, 0);
      [[-0.22, -0.85], [0.22, -0.85], [-0.22, 0.85], [0.22, 0.85]].forEach(function (p) { add(b, cy(0.035, 0.035, 0.38, 8), gold, p[0], 0.19, p[1]); });
      reg('Gallery bench ' + i, b); A.addSolid(q[0] - 0.33, q[0] + 0.33, q[1] - 1.03, q[1] + 1.03, 'Gallery bench ' + i);
    });
    [[10, 64.6]].forEach(function (q, i) { var f = grp('Gallery fern ' + i, q[0], q[1]); add(f, cy(0.3, 0.24, 0.6, 16), ph('#efe6d8', 60), 0, 0.3, 0); for (var k = 0; k < 8; k++) { var lf = add(f, sp(0.22, 8), ph('#2f9e55', 10), Math.cos(k * 0.8) * 0.2, 0.85 + (k % 3) * 0.12, Math.sin(k * 0.8) * 0.2); lf.scale.set(0.5, 1.5, 0.5); } reg('Gallery fern ' + i, f); A.addSolid(q[0] - 0.31, q[0] + 0.31, q[1] - 0.31, q[1] + 0.31, 'Gallery fern ' + i); });
  }

  WG.build = function (api) {
    A = api; B = api.BZX; if (!B) return;
    ROOT = new T.Group(); ROOT.name = 'East Wing'; A.scene.add(ROOT);
    shell(); parlor(); desk(); gallery();
    WG.built = true;
    var idleT = 9, seen = false;
    A.anims.push(function (t) {
      var dt = WG._lt ? Math.min(0.05, t - WG._lt) : 0.016; WG._lt = t;
      var p = A.pose(); if (p.x < A.ROOM.maxX - 10 || p.z > A.ROOM.maxZ + 2) { if (BUB && BUB.T > 0) { BUB.T = 0; BUB.s.visible = false; } return; }
      var D = WG.DESK, dx = p.x - (D.x + 0.95), dz = p.z - D.z, d = Math.hypot(dx, dz);
      GM.body.position.y = Math.abs(Math.sin(t * 1.3)) * 0.015;
      var want = d < 9 ? Math.max(-0.9, Math.min(0.9, Math.atan2(dz, -dx))) : Math.sin(t * 0.4) * 0.4; if (!isFinite(want)) want = 0;
      GM.head.rotation.y += (want - GM.head.rotation.y) * Math.min(1, dt * 3);
      GM.head.rotation.z = BUB && BUB.T > 0 ? Math.sin(t * 3) * 0.06 : 0;
      // right arm holds her phone up (squinting at it) when it's acting up, otherwise she knits with the left
      var up = GM.phoneUp || (Math.sin(t * 0.23) > 0.55); GM.aR.rotation.x += ((up ? -1.6 : -0.25) - GM.aR.rotation.x) * Math.min(1, dt * 4);
      GM.scr.material.color.set(up && Math.floor(t * 3) % 2 ? '#ff5d5d' : '#9be7ff');
      GM.aL.rotation.x = BUB && BUB.T > 0 ? -2.3 + Math.sin(t * 8) * 0.3 : -0.6 + Math.sin(t * 5) * 0.12;
      GM.react = Math.max(0, (GM.react || 0) - dt * 1.5);
      if (BUB && BUB.T > 0) { BUB.T -= dt; BUB.s.material.opacity = Math.min(1, BUB.T * 2); if (BUB.T <= 0) BUB.s.visible = false; }
      // walk-in hello + chatter when you're nearby (she gets sidetracked a lot)
      var inWing = p.x > B.minX - 0.2;
      if (inWing && !seen) { seen = true; if (WG.onEnter) WG.onEnter(); idleT = 12; }
      if (!inWing && p.x < A.ROOM.maxX - 4) seen = false;
      if (inWing && d < 8 && !(GA.AreasUI && GA.AreasUI.kind && GA.AreasUI.kind())) { idleT -= dt; if (idleT <= 0) { idleT = 13 + Math.random() * 8; if (WG.onIdle) WG.onIdle(); } }
    });
  };
})();
