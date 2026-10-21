/* Grok Arcade (#50) - Bonus Zone East Wing + Grandma Mrs (head attendant of the Bonus Zone) + Grand Gallery decor.
   The East Wing opens through a wide arch in the bonus room's east wall (x 18.4..32, z -12..12). The Hall of Game Records'
   Grand Gallery (z 48.4..66) is built by js/hall.js (shell + exhibits); this file adds its sign, benches and plants.
   Grandma Mrs is Gary's great-great-grandmother: very nice, sometimes TOO nice, easily sidetracked, loves drama,
   and her phone is always broken. Talk to her at her attendant desk (js/grandma-ui.js). */
(function () {
  'use strict';
  var T = THREE, WG = GA.Wing50 = {}, A, B, ROOT, GROOT, FX = { tiles: null, crys: [], vis: [], kiosk: null };
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
    [[21.6, 7.2, '#3ff0ff'], [22.9, 8.0, '#ffe14d'], [19.9, 8.9, '#ff4fd8']].forEach(function (q, i) {
      var b = grp('East Wing bean bag ' + i, q[0], q[1]); var m = add(b, sp(0.5, 16), ph(q[2], 20), 0, 0.3, 0); m.scale.set(1, 0.6, 1); add(b, sp(0.32, 12), ph(q[2], 20), 0, 0.5, -0.22).scale.set(1, 0.8, 0.6);
      reg('East Wing bean bag ' + i, b); A.addSolid(q[0] - 0.5, q[0] + 0.5, q[1] - 0.5, q[1] + 0.5, 'East Wing bean bag ' + i);
    });
    // (plants are instanced in detailWing)
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

  /* ================= (#50 detail pass) ================= */
  var SH = {}; // shared geometries for the repeated props
  function sg(k, f) { return SH[k] || (SH[k] = f()); }
  function inst(par, geo, mat, list, name) { // list: [x, y, z, ry, sx, sy, sz]
    var m = new T.InstancedMesh(geo, mat, list.length), o = new T.Object3D(); m.name = name || 'instanced';
    list.forEach(function (q, i) { o.position.set(q[0], q[1], q[2]); o.rotation.set(0, q[3] || 0, 0); o.scale.set(q[4] || 1, q[5] || q[4] || 1, q[6] || q[4] || 1); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
    m.instanceMatrix.needsUpdate = true; par.add(m); A.noAud(m); return m;
  }
  function plants(par, pts, tag) { // pot + 7 leaves each, all instanced: 2 draw calls for every plant in the room
    var pots = [], leaves = [];
    pts.forEach(function (q, i) { pots.push([q[0], 0.25, q[1]]); for (var k = 0; k < 7; k++) { var a = k * 0.9 + i; leaves.push([q[0] + Math.cos(a) * 0.15, 0.68 + (k % 3) * 0.13, q[1] + Math.sin(a) * 0.15, a, 0.55, 1.5, 0.55]); } A.addSolid(q[0] - 0.28, q[0] + 0.28, q[1] - 0.28, q[1] + 0.28, tag + ' plant ' + i); });
    inst(par, sg('pot', function () { return cy(0.27, 0.2, 0.5, 14); }), ph('#d97706', 20), pots, tag + ' plant pots');
    inst(par, sg('leaf', function () { return sp(0.2, 8); }), ph('#22a55a', 10), leaves, tag + ' plant leaves');
  }
  function canvasPlane(par, cw, chh, pw, draw, x, y, z, ry) { // plane height follows the canvas aspect: pictures never stretch
    var t = cvsTex(cw, chh, draw), m = new T.Mesh(new T.PlaneGeometry(pw, pw * chh / cw), new T.MeshBasicMaterial({ map: t.tex })); m.position.set(x, y, z); m.rotation.y = ry || 0; par.add(m); return m;
  }
  /* chunky cartoon visitor (shared geometry + a few cached materials) */
  var SKIN = ['#f1c7a5', '#c68b59', '#8d5524', '#f3d2b3'], SHIRT = ['#3ff0ff', '#ffe14d', '#4ade80', '#ff7a3d', '#a78bfa', '#f472b6', '#60a5fa'];
  function visitor(par, x, z, ry, k, pose) {
    var g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; par.add(g); A.noAud(g);
    var sk = ph(SKIN[k % 4], 15), sh = ph(SHIRT[k % 7], 20), pa = ph(['#334155', '#1e3a8a', '#4b5563', '#78350f'][k % 4], 15), hr = ph(['#2b1a10', '#f5d06f', '#111827', '#8b4513'][k % 4], 10);
    var leg = sg('vleg', function () { return bx(0.17, 0.62, 0.2); }), body = sg('vbody', function () { return bx(0.5, 0.6, 0.3); }), arm = sg('varm', function () { return bx(0.14, 0.5, 0.16); }), head = sg('vhead', function () { return sp(0.22, 14); }), eye = sg('veye', function () { return sp(0.03, 6); });
    [-0.12, 0.12].forEach(function (lx) { add(g, leg, pa, lx, 0.31, 0); }); add(g, body, sh, 0, 0.92, 0);
    var aL = add(g, arm, sh, -0.33, 0.95, 0.02), aR = add(g, arm, sh, 0.33, 0.95, 0.02);
    if (pose === 'play') { aL.rotation.x = aR.rotation.x = -1.0; aL.position.z = aR.position.z = 0.18; aL.position.y = aR.position.y = 1.0; }
    var hd = add(g, head, sk, 0, 1.45, 0); add(hd, sp(0.23, 12), hr, 0, 0.07, -0.04).scale.set(1, 0.7, 1); [-0.08, 0.08].forEach(function (ex) { add(hd, eye, ph('#1f1235', 5), ex, 0.02, 0.2); });
    FX.vis.push({ g: g, hd: hd, aL: aL, aR: aR, pose: pose, ph: k * 1.7 });
    return g;
  }
  function pet(id, par, x, y, z, ry, s) { if (!GA.Prize3D || !GA.Prize3D.build) return null; var m = GA.Prize3D.build(id); m.position.set(x, y, z); m.rotation.y = ry || 0; m.scale.setScalar(s || 1); par.add(m); A.noAud(m); return m; }
  function cabAt(o) { // a walk-up spot for a prop (claw machines / ticket kiosk use the arcade's own handlers)
    var an = new T.Group(); an.name = 'anchor ' + o.id; an.position.set(o.x - o.dir[0] * 1.75, 0, o.z - o.dir[1] * 1.75); an.rotation.y = Math.atan2(o.dir[0], o.dir[1]); A.scene.add(an); an.updateMatrixWorld(true);
    var c = { game: { id: o.id, name: o.name, desc: o.desc || '', color: o.color || '#ffe14d' }, kind: o.kind, ar: !!o.ar, id: o.id, group: an, owner: o.group, x: o.x, z: o.z, rot: 0,
      front: new T.Vector3(o.x, 0, o.z), dir: new T.Vector3(o.dir[0], 0, o.dir[1]), glow: new T.MeshBasicMaterial({ transparent: true, opacity: 0 }), nextDraw: Infinity, r: o.r || 1.1, data: o.data || {} };
    A.cabinets.push(c); return c;
  }

  function detailWing() {
    var wood = ph('#6b4226', 30), chrome = ph('#cfd8e6', 110), glass = new T.MeshPhongMaterial({ color: '#dff6ff', transparent: true, opacity: 0.32, shininess: 120, depthWrite: false });
    // 1) light-up floor path from the arch to Grandma's desk (one instanced mesh, colours chase along it)
    var tiles = [], cols = []; for (var ix = 0; ix < 5; ix++) for (var iz = 0; iz < 3; iz++) tiles.push([21.9 + ix * 0.62, 0.016, -0.62 + iz * 0.62, 0, 1]);
    var tm = inst(ROOT, sg('tile', function () { var g = new T.PlaneGeometry(0.56, 0.56); g.rotateX(-Math.PI / 2); return g; }), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.75, depthWrite: false }), tiles, 'Light-up floor path');
    tm.renderOrder = 1; tm.instanceColor = new T.InstancedBufferAttribute(new Float32Array(tiles.length * 3), 3); FX.tiles = tm;
    var ring = cvsTex(512, 512, function (g, w, h) { g.strokeStyle = '#ff9ed2'; g.lineWidth = 14; g.shadowColor = '#ff4fd8'; g.shadowBlur = 24; g.beginPath(); g.arc(w / 2, h / 2, 220, 0, 7); g.stroke(); g.strokeStyle = '#3ff0ff'; g.shadowColor = '#3ff0ff'; g.beginPath(); g.arc(w / 2, h / 2, 180, 0, 7); g.stroke(); g.shadowBlur = 0; g.fillStyle = '#ffe14d'; g.font = 'bold 44px "Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.fillText('PRIZES!', w / 2, h / 2 + 15); });
    var rd = new T.Mesh(new T.PlaneGeometry(2.6, 2.6), new T.MeshBasicMaterial({ map: ring.tex, transparent: true, depthWrite: false })); rd.rotation.x = -Math.PI / 2; rd.position.set(22.6, 0.014, -6.6); rd.renderOrder = 1; ROOT.add(rd); A.noAud(rd);
    // 2) centre island: the Prize Peek kiosk (glass dome, spinning plushies, Luna sits on top "guarding" it)
    var k = grp('Prize Peek kiosk', 22.6, -6.6);
    add(k, cy(0.85, 0.95, 0.8, 28), ph('#ff4fd8', 40, '#3a0024'), 0, 0.4, 0); add(k, cy(0.9, 0.9, 0.06, 28), chrome, 0, 0.83, 0);
    add(k, new T.SphereGeometry(0.82, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), glass, 0, 0.86, 0); add(k, cy(0.12, 0.12, 0.08, 12), chrome, 0, 1.7, 0);
    var tt = new T.Group(); tt.position.y = 0.86; k.add(tt); FX.kiosk = tt;
    ['pl_candy', 'pl_snowie', 'pl_torty', 'pl_pirat'].forEach(function (id, i) { var m = pet(id, tt, Math.cos(i * 1.57) * 0.42, 0, Math.sin(i * 1.57) * 0.42, -i * 1.57 + Math.PI / 2, 0.4); void m; });
    var lt = canvasPlane(k, 512, 128, 1.5, function (g, w, h) { g.fillStyle = '#1d1430'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffe14d'; g.font = 'bold 54px "Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.fillText('PRIZE PEEK', w / 2, 62); g.fillStyle = '#fff'; g.font = 'bold 28px sans-serif'; g.fillText('win them at the claws!', w / 2, 106); }, 0, 0.45, 0.955); void lt;
    reg('Prize Peek kiosk', k); A.addSolid(21.7, 23.5, -7.5, -5.7, 'Prize Peek kiosk');
    // 3) north wall: two claw machines (the arcade's real Easy + Tricky claws) and the Ticket Muncher redemption kiosk
    [['easy', 21.4, '#3ff0ff', 'EASY CLAW'], ['tricky', 27.4, '#ff4fd8', 'TRICKY CLAW']].forEach(function (q) {
      var c = grp('East Wing claw ' + q[0], q[1], -11.35), base = ph(q[2], 40, q[2] === '#3ff0ff' ? '#06343a' : '#3a0024');
      add(c, bx(1.1, 0.9, 1.0), base, 0, 0.45, 0); add(c, bx(1.1, 1.0, 1.0), glass, 0, 1.4, 0); add(c, bx(1.14, 0.22, 1.04), base, 0, 2.0, 0);
      [[-0.53, -0.48], [0.53, -0.48], [-0.53, 0.48], [0.53, 0.48]].forEach(function (p) { add(c, bx(0.05, 1.0, 0.05), chrome, p[0], 1.4, p[1]); });
      add(c, cy(0.01, 0.01, 0.5, 4), chrome, 0.1, 1.65, 0.05); var cl = add(c, cy(0.09, 0.05, 0.12, 8), chrome, 0.1, 1.38, 0.05); void cl;
      ['pl_luna', 'pl_candy', 'pl_snowie', 'pl_pirat', 'pl_torty'].forEach(function (id, i) { pet(id, c, -0.32 + (i % 3) * 0.3, 0.92, -0.2 + Math.floor(i / 3) * 0.32, i, 0.28); });
      canvasPlane(c, 512, 128, 1.04, function (g, w, h) { g.fillStyle = '#120a22'; g.fillRect(0, 0, w, h); g.fillStyle = q[2]; g.font = 'bold 64px "Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.fillText(q[3], w / 2, 86); }, 0, 2.0, 0.53);
      add(c, bx(0.3, 0.06, 0.2), ph('#111827', 20), -0.3, 0.92, 0.42); add(c, sp(0.05, 8), ph('#ff4040', 40), -0.3, 1.0, 0.42);
      reg('East Wing claw ' + q[0], c); A.addSolid(q[1] - 0.57, q[1] + 0.57, -12, -10.83, 'East Wing claw ' + q[0]);
      cabAt({ id: q[0], kind: 'claw', name: q[3], x: q[1], z: -10.0, dir: [0, -1], r: 1.0, group: c });
    });
    var tk = grp('Ticket Muncher 9000', 24.4, -11.35);
    add(tk, bx(1.3, 1.9, 0.9), ph('#ffe14d', 40, '#2a2000'), 0, 0.95, 0); add(tk, bx(1.0, 0.6, 0.05), A.basic('#1d1430'), 0, 1.45, 0.46);
    canvasPlane(tk, 512, 256, 0.96, function (g, w, h) { g.fillStyle = '#1d1430'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffe14d'; g.font = 'bold 56px "Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.fillText('TICKET', w / 2, 80); g.fillText('MUNCHER 9000', w / 2, 140); g.fillStyle = '#7df9a0'; g.font = 'bold 34px sans-serif'; g.fillText('redeem prizes here \u2192', w / 2, 210); }, 0, 1.45, 0.49);
    add(tk, bx(0.5, 0.08, 0.2), ph('#111827', 20), 0, 0.85, 0.5); add(tk, cy(0.18, 0.18, 0.06, 16), A.basic('#ff4fd8'), 0, 2.0, 0.2);
    reg('Ticket Muncher 9000', tk); A.addSolid(23.75, 25.05, -12, -10.9, 'Ticket Muncher 9000');
    cabAt({ id: 'gm_tickets', kind: 'prize', name: 'Ticket Muncher 9000', x: 24.4, z: -10.0, dir: [0, -1], r: 1.0, group: tk });
    // 4) seating cluster on the rug: loveseat + coffee table (Snowie naps on the loveseat)
    var ls = grp('East Wing loveseat', 23.3, 4.6, Math.PI / 2), fab = ph('#7c3aed', 12);
    add(ls, bx(1.7, 0.42, 0.8), fab, 0, 0.33, 0); add(ls, bx(1.7, 0.6, 0.2), fab, 0, 0.75, -0.32); [-1, 1].forEach(function (sd) { add(ls, bx(0.18, 0.55, 0.8), fab, sd * 0.85, 0.55, 0); });
    add(ls, bx(0.5, 0.3, 0.12), ph('#ffe14d', 10), -0.45, 0.68, -0.18); reg('East Wing loveseat', ls); A.addSolid(22.9, 23.7, 3.7, 5.5, 'East Wing loveseat');
    var ct = grp('East Wing coffee table', 24.9, 4.6); add(ct, bx(0.9, 0.05, 0.6), wood, 0, 0.42, 0); [[-0.38, -0.24], [0.38, -0.24], [-0.38, 0.24], [0.38, 0.24]].forEach(function (p) { add(ct, cy(0.03, 0.03, 0.4, 6), wood, p[0], 0.2, p[1]); });
    add(ct, cy(0.1, 0.08, 0.08, 12), ph('#ff9ed2', 30), 0.2, 0.49, 0); add(ct, bx(0.3, 0.03, 0.22), ph('#60a5fa', 10), -0.2, 0.46, 0.05); reg('East Wing coffee table', ct); A.addSolid(24.45, 25.35, 4.3, 4.9, 'East Wing coffee table');
    // 5) Grandma's snack cart on the south wall (Pi-rat is "helping")
    var sc = grp('Grandma\u2019s snack cart', 25.0, 11.4, Math.PI);
    add(sc, bx(1.6, 0.9, 0.8), ph('#f472b6', 30), 0, 0.55, 0); add(sc, bx(1.7, 0.05, 0.9), ph('#ffffff', 50), 0, 1.02, 0);
    [-1, 1].forEach(function (sd) { add(sc, cy(0.03, 0.03, 1.1, 6), chrome, sd * 0.78, 1.55, 0.38); }); add(sc, bx(1.7, 0.06, 0.95), ph('#ff4fd8', 20), 0, 2.12, 0.1);
    add(sc, cy(0.16, 0.2, 0.18, 14), ph('#c58a4a', 10), -0.5, 1.14, 0.1); for (var c3 = 0; c3 < 3; c3++) add(sc, cy(0.1, 0.1, 0.03, 12), ph('#e2a35a', 10), 0.1 + c3 * 0.22, 1.06, 0.15);
    add(sc, cy(0.09, 0.09, 0.22, 12), ph('#7df9a0', 40), 0.55, 1.15, -0.15);
    [-0.6, 0.6].forEach(function (wx) { add(sc, cy(0.12, 0.12, 0.06, 12), ph('#111827', 10), wx, 0.12, 0.36).rotation.z = Math.PI / 2; });
    canvasPlane(sc, 512, 128, 1.5, function (g, w, h) { g.fillStyle = '#fff2f8'; g.fillRect(0, 0, w, h); g.fillStyle = '#a8325a'; g.font = 'bold 50px "Comic Sans MS","Trebuchet MS",cursive'; g.textAlign = 'center'; g.fillText('Grandma\u2019s Snacks \u2665 FREE', w / 2, 82); }, 0, 0.62, 0.41);
    pet('pl_pirat', sc, 0.0, 1.05, -0.2, 0.5, 0.5);
    reg('Grandma\u2019s snack cart', sc); A.addSolid(24.15, 25.85, 10.95, 12, 'Grandma\u2019s snack cart');
    // 6) plants (instanced) + visitors playing the cabinets
    plants(ROOT, [[19.0, -10.9], [19.0, 10.9], [22.75, -11.35], [25.95, -11.35], [31.2, -11.2], [31.2, 11.2], [21.2, 11.35], [28.6, 11.35]], 'East Wing');
    visitor(ROOT, 29.9, -5.92, Math.PI / 2, 0, 'play'); visitor(ROOT, 29.9, 2.96, Math.PI / 2, 1, 'play'); visitor(ROOT, 29.9, 7.4, Math.PI / 2, 2, 'play');
    visitor(ROOT, 27.4, -9.95, Math.PI, 3, 'play'); visitor(ROOT, 25.0, 10.2, 0, 4, 'wave');
  }

  function detailDesk() {
    var D = WG.DESK, g = grp('Grandma desk props', D.x, D.z), top = 1.06;
    // tea set: teapot + two cups on saucers
    var china = ph('#ffffff', 80), rose = ph('#f472b6', 40);
    var tp = add(g, sp(0.13, 14), china, 0.15, top + 0.12, 0.35); tp.scale.set(1, 0.85, 1); add(g, cy(0.03, 0.05, 0.12, 8), china, 0.15, top + 0.12, 0.2).rotation.x = -1.0; add(g, sp(0.035, 8), rose, 0.15, top + 0.24, 0.35);
    add(g, new T.TorusGeometry(0.06, 0.015, 6, 12), china, 0.15, top + 0.13, 0.5);
    [0.62, 1.0].forEach(function (z) { add(g, cy(0.07, 0.07, 0.01, 12), rose, 0.2, top + 0.005, z); add(g, cy(0.05, 0.035, 0.07, 10), china, 0.2, top + 0.045, z); });
    // cookie jar (pig-pink, with a lid and a cookie stuck in the top)
    add(g, cy(0.13, 0.15, 0.24, 16), ph('#ff9eb8', 40), 0.25, top + 0.12, -0.35); add(g, cy(0.14, 0.13, 0.04, 16), ph('#ff7fa6', 40), 0.25, top + 0.26, -0.35); add(g, cy(0.06, 0.06, 0.015, 10), ph('#c58a4a', 10), 0.25, top + 0.3, -0.33).rotation.x = 1.2;
    // little radio
    add(g, bx(0.22, 0.14, 0.12), ph('#b45309', 30), 0.32, top + 0.07, 0.0); add(g, cy(0.04, 0.04, 0.01, 12), ph('#e5e7eb', 60), 0.32, top + 0.08, 0.06).rotation.y = 0; var ant = add(g, cy(0.004, 0.004, 0.3, 4), ph('#d1d5db', 80), 0.38, top + 0.28, 0.0); ant.rotation.z = -0.4;
    // framed old photos of Gary's family (drawn portraits; each photo keeps its own aspect)
    var PH = [['Gary, age 7', '#7dd3fc', 1], ['Great-great-grandpa Walt', '#fcd34d', 2], ['The family, 1952', '#fda4af', 4]];
    PH.forEach(function (q, i) {
      var f = new T.Group(); f.position.set(0.3, top, -0.85 + i * 0.27 + (i === 2 ? 0.05 : 0)); f.rotation.y = -Math.PI / 2 + (i - 1) * 0.25; g.add(f);
      add(f, bx(0.24, 0.3, 0.02), ph('#c9993a', 80), 0, 0.15, 0); f.children[0].rotation.x = -0.12;
      canvasPlane(f, 160, 200, 0.2, function (c, w, h) { c.fillStyle = '#f5e6c8'; c.fillRect(0, 0, w, h); c.fillStyle = q[1]; c.fillRect(10, 10, w - 20, h - 50); for (var n = 0; n < q[2]; n++) { var px = w / 2 + (n - (q[2] - 1) / 2) * 30; c.fillStyle = '#f1c7a5'; c.beginPath(); c.arc(px, 70, 14, 0, 7); c.fill(); c.fillStyle = '#6b4226'; c.fillRect(px - 12, 86, 24, 50); }
        c.fillStyle = '#4a1030'; c.font = 'italic 15px Georgia,serif'; c.textAlign = 'center'; c.fillText(q[0], w / 2, h - 18); }, 0, 0.15, 0.012).rotation.x = -0.12;
    });
    A.noAud(g);
    // NO RUNNING, DEARS sign (A-frame, beside the desk) + rocking chair behind the desk + Candy's dog bed
    var sgn = grp('NO RUNNING, DEARS sign', D.x - 1.6, D.z - 2.2, -0.5);
    [-1, 1].forEach(function (sd) { var b = add(sgn, bx(0.6, 0.85, 0.03), ph('#fffbe6', 20), 0, 0.45, sd * 0.12); b.rotation.x = sd * 0.25; });
    canvasPlane(sgn, 256, 340, 0.54, function (c, w, h) { c.fillStyle = '#fffbe6'; c.fillRect(0, 0, w, h); c.strokeStyle = '#f472b6'; c.lineWidth = 10; c.strokeRect(8, 8, w - 16, h - 16); c.fillStyle = '#a8325a'; c.textAlign = 'center'; c.font = 'bold 44px "Comic Sans MS","Trebuchet MS",cursive'; c.fillText('NO', w / 2, 80); c.fillText('RUNNING,', w / 2, 140); c.fillText('DEARS', w / 2, 200); c.font = '60px sans-serif'; c.fillText('\u2665', w / 2, 290); }, 0, 0.47, 0.16).rotation.x = -0.25;
    reg('NO RUNNING, DEARS sign', sgn); A.addSolid(D.x - 1.95, D.x - 1.25, D.z - 2.5, D.z - 1.9, 'NO RUNNING, DEARS sign');
    var rc = grp('Rocking chair', D.x + 1.3, D.z - 2.1, -Math.PI / 2 - 0.3), wd = ph('#7a4a2a', 30);
    add(rc, bx(0.6, 0.06, 0.55), wd, 0, 0.45, 0); add(rc, bx(0.6, 0.7, 0.05), wd, 0, 0.85, -0.26); add(rc, bx(0.5, 0.4, 0.06), ph('#f7c8d8', 10), 0, 0.85, -0.22);
    [-0.28, 0.28].forEach(function (sx) { var r2 = add(rc, new T.TorusGeometry(0.6, 0.025, 6, 20, 1.2), wd, sx, 0.62, 0); r2.rotation.y = Math.PI / 2; r2.rotation.z = -Math.PI / 2 - 0.6; add(rc, cy(0.02, 0.02, 0.4, 6), wd, sx, 0.24, 0.2); add(rc, cy(0.02, 0.02, 0.4, 6), wd, sx, 0.24, -0.2); });
    add(rc, bx(0.5, 0.04, 0.45), ph('#3ff0ff', 10), 0, 0.5, 0.02); FX.rock = rc; reg('Rocking chair', rc); A.addSolid(D.x + 0.95, D.x + 1.65, D.z - 2.45, D.z - 1.75, 'Rocking chair');
    var bd = grp('Candy\u2019s dog bed', D.x + 1.25, D.z + 1.9); add(bd, new T.TorusGeometry(0.36, 0.12, 8, 18), ph('#60a5fa', 15), 0, 0.12, 0).rotation.x = Math.PI / 2; add(bd, cy(0.34, 0.34, 0.06, 18), ph('#bfdbfe', 10), 0, 0.05, 0);
    reg('Candy\u2019s dog bed', bd); A.addSolid(D.x + 0.77, D.x + 1.73, D.z + 1.42, D.z + 2.38, 'Candy\u2019s dog bed');
    var cn = pet('pl_candy', bd, 0, 0.08, 0, -2.2, 1.15); if (cn) { cn.rotation.z = 0.0; FX.candy = cn; }
    // zzz bubble over sleeping Candy
    var z = canvasPlane(bd, 128, 128, 0.35, function (c, w, h) { c.fillStyle = '#ffffff'; c.font = 'bold 54px "Trebuchet MS",sans-serif'; c.fillText('z', 20, 110); c.font = 'bold 40px sans-serif'; c.fillText('z', 66, 70); c.font = 'bold 28px sans-serif'; c.fillText('z', 96, 36); }, 0.1, 0.9, 0); z.material.transparent = true; z.rotation.y = -Math.PI / 2; FX.zzz = z;
  }

  function detailGallery() {
    var W = A.WING, AZ = W.annexZ || 48, gold = ph('#e8b84a', 90, '#3a2400'), G2 = GROOT;
    // crystal chandeliers (crystals instanced), two along the centre
    var crys = [];
    [[10, 53.0], [10, 61.0]].forEach(function (q) {
      add(G2, cy(0.012, 0.012, 0.6, 6), gold, q[0], 4.7, q[1]); add(G2, new T.TorusGeometry(0.55, 0.035, 8, 28), gold, q[0], 4.35, q[1]).rotation.x = Math.PI / 2; add(G2, new T.TorusGeometry(0.32, 0.03, 8, 22), gold, q[0], 4.15, q[1]).rotation.x = Math.PI / 2;
      add(G2, sp(0.14, 12), A.basic('#fff3c4'), q[0], 4.05, q[1]);
      for (var i = 0; i < 16; i++) { var a = i / 16 * Math.PI * 2; crys.push([q[0] + Math.cos(a) * 0.55, 4.22, q[1] + Math.sin(a) * 0.55, a, 0.6, 1.6, 0.6]); if (i % 2 === 0) crys.push([q[0] + Math.cos(a) * 0.32, 4.02, q[1] + Math.sin(a) * 0.32, a, 0.5, 1.3, 0.5]); }
      var gl = new T.Sprite(new T.SpriteMaterial({ map: A.glowTex, color: '#ffe9b0', transparent: true, opacity: 0.6, depthWrite: false, blending: T.AdditiveBlending })); gl.scale.set(2.2, 2.2, 1); gl.position.set(q[0], 4.1, q[1]); G2.add(gl);
    });
    inst(G2, sg('crys', function () { return new T.OctahedronGeometry(0.06, 0); }), new T.MeshPhongMaterial({ color: '#e0f7ff', shininess: 120, specular: '#ffffff', emissive: '#334455' }), crys, 'Chandelier crystals');
    // wall art above the exhibits (game-themed paintings, 4 shared textures, every frame matches its canvas aspect)
    var ART = [
      function (c, w, h) { var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3ff0ff'); g.addColorStop(1, '#1d1430'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = '#ffe14d'; c.beginPath(); c.arc(w * 0.7, h * 0.35, 30, 0, 7); c.fill(); c.fillStyle = '#4ade80'; c.fillRect(0, h * 0.75, w, h * 0.25); },
      function (c, w, h) { c.fillStyle = '#2a1050'; c.fillRect(0, 0, w, h); for (var i = 0; i < 6; i++) { c.fillStyle = ['#ff4fd8', '#3ff0ff', '#ffe14d'][i % 3]; c.fillRect(20 + i * 38, h - 30 - i * 14, 26, 20 + i * 14); } },
      function (c, w, h) { c.fillStyle = '#fef3c7'; c.fillRect(0, 0, w, h); c.fillStyle = '#a7adbb'; c.beginPath(); c.ellipse(w / 2, h * 0.62, 50, 34, 0, 0, 7); c.fill(); c.beginPath(); c.arc(w / 2 + 44, h * 0.48, 26, 0, 7); c.fill(); c.fillStyle = '#ffb3c8'; c.beginPath(); c.arc(w / 2 + 40, h * 0.3, 14, 0, 7); c.fill(); c.fillStyle = '#4a1030'; c.font = 'italic 16px Georgia'; c.fillText('Luna, in oils', 10, h - 10); },
      function (c, w, h) { c.fillStyle = '#7c2d12'; c.fillRect(0, 0, w, h); c.fillStyle = '#fcd34d'; c.beginPath(); c.arc(w / 2, h / 2, 46, 0, 7); c.fill(); c.fillStyle = '#a16207'; c.beginPath(); c.ellipse(w / 2, h * 0.78, 70, 24, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = 'italic 16px Georgia'; c.fillText('Torty at sunset', 10, h - 10); }
    ];
    var texs = ART.map(function (f) { return cvsTex(256, 160, f).tex; }), artGeo = new T.PlaneGeometry(1.2, 0.75), frameGeo = bx(1.32, 0.87, 0.04), frames = [];
    for (var i = 0; i < 7; i++) {
      [[W.minX + 0.03, Math.PI / 2, W.minX + 0.01], [W.maxX - 0.03, -Math.PI / 2, W.maxX - 0.01]].forEach(function (s, j) {
        var z = AZ + 2.4 + i * 2.0, m = new T.Mesh(artGeo, new T.MeshBasicMaterial({ map: texs[(i + j * 2) % 4] })); m.position.set(s[0] + (j ? -0.02 : 0.02), 4.15, z); m.rotation.y = s[1]; G2.add(m); A.noAud(m); frames.push([s[2], 4.15, z, s[1]]);
      });
    }
    inst(G2, frameGeo, gold, frames, 'Gallery art frames');
    // big painting on the back of the Annex wall: Gus and Barnaby, "a family portrait" (Gus is not smiling)
    canvasPlane(G2, 512, 256, 2.4, function (c, w, h) { c.fillStyle = '#3a1430'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e8b84a'; c.lineWidth = 12; c.strokeRect(6, 6, w - 12, h - 12); [[170, '#5b4636', '#f5f5f5', 0], [340, '#3f8f5a', '#f5f5f5', 1]].forEach(function (p) { c.fillStyle = p[1]; c.fillRect(p[0] - 50, 120, 100, 110); c.fillStyle = '#f3c9a8'; c.beginPath(); c.arc(p[0], 95, 38, 0, 7); c.fill(); c.strokeStyle = '#7a2a2a'; c.lineWidth = 5; c.beginPath(); if (p[3]) c.arc(p[0], 100, 16, 0.2, Math.PI - 0.2); else { c.moveTo(p[0] - 14, 112); c.lineTo(p[0] + 14, 112); } c.stroke(); });
      c.fillStyle = '#f5e6c8'; c.font = 'italic 22px Georgia'; c.textAlign = 'center'; c.fillText('Gus & Uncle Barnaby (Gus asked for this to be removed)', w / 2, h - 18); }, 10, 4.25, W.maxZ - 0.03, Math.PI);
    // plants + visitors + Torty on a visit
    plants(G2, [[2.65, 64.45], [17.35, 64.45], [8.0, 49.05], [12.0, 49.05], [8.6, 64.9], [11.4, 64.9]].filter(function (q) { return Math.abs(q[0] - 10) > 0.5; }), 'Gallery');
    visitor(G2, 4.1, 53.4, -Math.PI / 2, 5, 'look'); visitor(G2, 15.9, 55.4, Math.PI / 2, 6, 'look'); visitor(G2, 8.2, 60.4, Math.PI, 1, 'look'); visitor(G2, 12.4, 51.2, 0.4, 2, 'wave');
    var to = pet('pl_torty', G2, 13.2, 0, 59.6, Math.PI / 2 + 0.4, 1.9); FX.torty = to;
    var tc = canvasPlane(G2, 256, 96, 1.0, function (c, w, h) { c.fillStyle = '#fff7ed'; c.fillRect(0, 0, w, h); c.strokeStyle = '#a16207'; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6); c.fillStyle = '#7c2d12'; c.font = 'bold 30px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.fillText('Torty is visiting!', w / 2, 60); }, 13.2, 1.75, 59.6, -Math.PI / 2); tc.material.transparent = true; FX.tortyTag = tc;
    A.addSolid(12.6, 13.8, 59.0, 60.2, 'Torty (visiting)');
    // centre display: the Golden Cartridge case (every Grok game's first save, on velvet)
    var gc = new T.Group(); gc.name = 'Golden Cartridge case'; gc.position.set(10, 0, 54.4); G2.add(gc);
    add(gc, bx(1.1, 0.9, 1.1), ph('#3a1430', 20), 0, 0.45, 0); add(gc, bx(1.16, 0.06, 1.16), gold, 0, 0.92, 0); add(gc, bx(1.0, 0.8, 1.0), new T.MeshPhongMaterial({ color: '#e0f7ff', transparent: true, opacity: 0.3, shininess: 120, depthWrite: false }), 0, 1.35, 0);
    var crt = add(gc, bx(0.42, 0.5, 0.1), gold, 0, 1.3, 0); FX.cart = crt; add(gc, bx(0.3, 0.2, 0.11), ph('#ff4fd8', 30), 0, 1.36, 0);
    canvasPlane(gc, 512, 160, 1.0, function (c, w, h) { c.fillStyle = '#22120a'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffe14d'; c.font = 'bold 38px Georgia,serif'; c.textAlign = 'center'; c.fillText('THE GOLDEN CARTRIDGE', w / 2, 70); c.fillStyle = '#f5e6c8'; c.font = 'italic 30px Georgia,serif'; c.fillText('do not touch \u00b7 Gus', w / 2, 125); }, 0, 0.5, -0.56, Math.PI);
    gc.updateMatrixWorld(true); A.regItem('Golden Cartridge case', 'prop', gc); A.addSolid(9.42, 10.58, 53.82, 54.98, 'Golden Cartridge case');
  }
  function pets() {
    // Luna sits on top of the Prize Peek dome (she is NOT guarding it, she is planning), Snowie naps on the loveseat
    var k = FX.kiosk && FX.kiosk.parent; if (k) { var l = pet('pl_luna', k, 0, 1.72, 0, 0.6, 0.55); FX.luna = l; }
    pet('pl_snowie', ROOT, 23.3, 0.55, 5.25, Math.PI / 2, 0.45);
  }
  function animWing(t) {
    if (FX.tiles) { var c = new T.Color(), n = FX.tiles.count; for (var i = 0; i < n; i++) { var ix = Math.floor(i / 3); c.setHSL(((ix * 0.12 - t * 0.35) % 1 + 1) % 1, 0.9, 0.6 + 0.15 * Math.sin(t * 4 - ix)); FX.tiles.setColorAt(i, c); } FX.tiles.instanceColor.needsUpdate = true; }
    if (FX.kiosk) FX.kiosk.rotation.y = t * 0.5;
    if (FX.luna) FX.luna.rotation.y = 0.6 + Math.sin(t * 0.7) * 0.8;
    if (FX.rock) FX.rock.rotation.x = Math.sin(t * 1.4) * 0.06;
    if (FX.zzz) { FX.zzz.position.y = 0.85 + ((t * 0.25) % 1) * 0.3; FX.zzz.material.opacity = 1 - ((t * 0.25) % 1); }
    if (FX.candy) FX.candy.scale.y = 1.15 * (1 + Math.sin(t * 2) * 0.03);
    FX.vis.forEach(function (v) { if (v.g.parent !== ROOT) return; var s = Math.sin(t * 6 + v.ph); if (v.pose === 'play') { v.aL.rotation.x = -1.0 + s * 0.15; v.aR.rotation.x = -1.0 - s * 0.15; } else { v.aR.rotation.z = Math.sin(t * 5 + v.ph) * 0.5 + 0.5; } v.hd.rotation.y = Math.sin(t * 0.8 + v.ph) * 0.2; });
  }
  function animGallery(t) {
    if (FX.cart) FX.cart.rotation.y = t * 0.8;
    if (FX.torty) FX.torty.rotation.y = Math.PI / 2 + 0.4 + Math.sin(t * 0.5) * 0.25;
    FX.vis.forEach(function (v) { if (v.g.parent !== GROOT) return; v.hd.rotation.y = Math.sin(t * 0.5 + v.ph) * 0.35; if (v.pose === 'wave') v.aR.rotation.z = Math.sin(t * 4 + v.ph) * 0.4 + 0.4; });
  }

  WG.build = function (api) {
    A = api; B = api.BZX; WG._scene = api.scene; if (!B) return;
    ROOT = new T.Group(); ROOT.name = 'East Wing'; A.scene.add(ROOT);
    shell(); parlor(); desk(); gallery();
    GROOT = new T.Group(); GROOT.name = 'Grand Gallery decor'; A.scene.add(GROOT);
    detailWing(); detailDesk(); detailGallery(); pets();
    WG.built = true;
    var idleT = 9, seen = false;
    A.anims.push(function (t) {
      var dt = WG._lt ? Math.min(0.05, t - WG._lt) : 0.016; WG._lt = t;
      var p0 = A.pose(); ROOT.visible = p0.x > 4 && p0.z < 16; GROOT.visible = p0.z > 34 && p0.x > 0; if (GROOT.visible) animGallery(t);
      if (ROOT.visible) animWing(t);
      var p = p0; if (p.x < A.ROOM.maxX - 10 || p.z > A.ROOM.maxZ + 2) { if (BUB && BUB.T > 0) { BUB.T = 0; BUB.s.visible = false; } return; }
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
