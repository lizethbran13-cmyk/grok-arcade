/* Grok Arcade - the RECORDS ANNEX (booth #32): the Hall of Game Records doubled in size (z 26..48 behind the original Hall).
   Gus's Uncle Barnaby (the nicest guy in the family) runs a sorting station back here, plus: an Exhibit of the Week rotunda,
   a reading nook with game history books, a couch-and-armchair lounge, benches, a walk-in photo booth, the Stamp-O-Matic 5000
   quiz kiosk, memorabilia cases, 8 wall niches for future games and a daily lost-files scavenger hunt.
   Everything is real 3D geometry. Hundreds of books and folders are InstancedMeshes (one draw call each); the rest is static and
   gets merged by js/perf.js. You can SIT on every bench, armchair, the sofa and the booth stool (Gus hates it). */
(function () {
  'use strict';
  var T = THREE, H2 = GA.Hall2 = {}, A, W, K, ROOTS;
  var CABS = {}, SEATS = {}, FILES = [], st = { sit: null, banterT: 18, inAnnex: false, hiT: -99, lastSit: -99 };
  H2.CABS = CABS; H2.SEATS = SEATS; H2.FILES = FILES;
  function ph(c, s, e) { return K.ph(c, s, e); }
  function add(p, g, m, x, y, z) { return K.add(p, g, m, x, y, z); }
  function bx(w, h, d) { return K.bx(w, h, d); }
  function cy(a, b, h, s) { return K.cy(a, b, h, s); }
  function sp(r, s) { return K.sp(r, s); }
  function glow(c) { return A.basic(c); }
  function root(name) { var g = new T.Group(); g.name = name; A.scene.add(g); ROOTS.push(g); return g; }
  function glowFloor(g, c, w, d, x, z) { var m = new T.MeshBasicMaterial({ map: A.glowTex, color: c, transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending }); var gl = add(g, new T.PlaneGeometry(w, d), m, x || 0, 0.03, z || 0); gl.rotation.x = -Math.PI / 2; gl.renderOrder = 2; A.noAud(gl); return m; }
  function cab(o) { // o: id, kind, name, desc, color, x, z (front), dir [dx,dz], r, group, glow
    var c = { game: { id: o.id, name: o.name, desc: o.desc || '', color: o.color || '#ffe14d' }, kind: o.kind, ar: true, id: o.id, group: o.group, x: o.x, z: o.z, rot: 0,
      front: new T.Vector3(o.x, 0, o.z), dir: new T.Vector3(o.dir[0], 0, o.dir[1]), glow: o.glow || new T.MeshBasicMaterial({ transparent: true, opacity: 0 }), nextDraw: Infinity, r: o.r || 1.1, data: o.data || {} };
    A.cabinets.push(c); CABS[o.id] = c; return c;
  }
  function solid(minX, maxX, minZ, maxZ, name) { A.addSolid(minX, maxX, minZ, maxZ, name); }
  function reg(name, g, kind) { g.updateMatrixWorld(true); return A.regItem(name, kind || 'prop', g); }
  function canvasPlane(par, w, h, pw, ph2, draw, x, y, z, ry) { var t = K.cvs(w, h, draw); var m = K.planeM(pw, ph2, t.tex, par, x, y, z); if (ry) m.rotation.y = ry; return m; }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  H2._now = null; // tests can pin the clock
  function now() { return H2._now || Date.now(); }
  H2.dayKey = function () { var d = new Date(now()); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  H2.weekNo = function () { return Math.floor((now() - Date.UTC(2026, 0, 5)) / 604800000); };
  function games() { return GA.MAIN_GAMES.filter(function (g) { return GA.HALL_DATA && GA.HALL_DATA[g.id]; }); }
  H2.games = games;

  /* ---------- speech bubbles (Barnaby) ---------- */
  function bubble(par, y) {
    var c = A.mkCanvas(512, 200), t = A.canvasTex(c); t.minFilter = T.LinearFilter; t.generateMipmaps = false;
    var s = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false })); s.scale.set(2.3, 0.9, 1); s.position.set(0, y, 0); s.visible = false; s.renderOrder = 10; par.add(s); A.noAud(s);
    return { s: s, c: c, t: t, T: 0, last: null };
  }
  function bubbleDraw(b, text) {
    var c = b.c, g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
    g.fillStyle = '#f2fff4'; g.strokeStyle = '#1f5130'; g.lineWidth = 6; K.rr(g, 6, 6, w - 12, h - 46, 26); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(w / 2 - 20, h - 42); g.lineTo(w / 2, h - 8); g.lineTo(w / 2 + 20, h - 42); g.closePath(); g.fill(); g.stroke(); g.fillRect(w / 2 - 17, h - 46, 34, 6);
    g.fillStyle = '#12301c'; g.textAlign = 'center'; g.textBaseline = 'middle';
    var words = String(text).split(' '), lines = [], cur = '', px = 30; g.font = 'bold ' + px + 'px "Trebuchet MS",system-ui,sans-serif';
    function wrap(mw) { lines = []; cur = ''; words.forEach(function (wd) { var t = cur ? cur + ' ' + wd : wd; if (g.measureText(t).width > mw) { lines.push(cur); cur = wd; } else cur = t; }); if (cur) lines.push(cur); }
    wrap(w - 50); if (lines.length > 3) { px = 24; g.font = 'bold ' + px + 'px "Trebuchet MS",system-ui,sans-serif'; wrap(w - 40); lines = lines.slice(0, 4); }
    lines.forEach(function (ln, i) { g.fillText(ln, w / 2, (h - 40) / 2 + (i - (lines.length - 1) / 2) * (px + 4)); });
    b.t.needsUpdate = true;
  }
  var UB = null; // Barnaby's bubble
  H2.say = function (text, secs) { if (!UB) return; bubbleDraw(UB, text); UB.s.visible = true; UB.T = secs || 4.5; UB.last = text; if (BAR.root) BAR.react = 1; return text; };
  H2.barnabyLine = function () { return UB && UB.T > 0 ? UB.last : null; };

  /* ---------- Uncle Barnaby (round, cheerful, green cardigan, bow tie, fluffy white hair, big smile) ---------- */
  var BAR = {};
  function buildBarnaby(par) {
    var r = new T.Group(); par.add(r);
    var skin = ph('#f3c9a8', 20), card = ph('#3f8f5a', 15), shirt = ph('#fff7e6', 20), hair = ph('#f5f5f5', 10), pants = ph('#5b4636', 15);
    var body = new T.Group(); r.add(body);
    [-1, 1].forEach(function (sd) { add(body, cy(0.11, 0.1, 0.62, 12), pants, sd * 0.13, 0.31, 0); add(body, bx(0.18, 0.08, 0.3), ph('#2b1a10', 50), sd * 0.13, 0.04, 0.05); });
    var torso = add(body, sp(0.38, 24), card, 0, 0.98, 0); torso.scale.set(1, 1.15, 0.9);
    add(body, sp(0.2, 18), shirt, 0, 1.18, 0.2).scale.set(0.75, 1, 0.5);
    for (var i = 0; i < 4; i++) add(body, sp(0.025, 8), ph('#e8d5b0', 60), 0, 0.78 + i * 0.12, 0.34);
    [-1, 1].forEach(function (sd) { var bw = add(body, cn(0.07, 0.13, 12), ph('#ffcf3a', 60), sd * 0.06, 1.38, 0.27); bw.rotation.z = sd * Math.PI / 2; add(body, bx(0.02, 0.5, 0.02), ph('#b3123a', 30), sd * 0.16, 1.05, 0.33).rotation.z = sd * 0.08; });
    add(body, sp(0.032, 10), ph('#ffcf3a', 60), 0, 1.38, 0.28);
    add(body, bx(0.13, 0.16, 0.02), ph('#fff3c4', 10), 0.2, 1.08, 0.31).rotation.y = 0.3; // pocket notepad
    add(body, cy(0.008, 0.008, 0.16, 6), ph('#e11d48', 40), 0.24, 1.15, 0.33);
    function cn(a, b, s) { return new T.ConeGeometry(a, b, s); }
    function arm(sd) { var a = new T.Group(); a.position.set(sd * 0.4, 1.3, 0); body.add(a); add(a, cy(0.08, 0.075, 0.46, 12), card, 0, -0.23, 0); add(a, sp(0.08, 12), skin, 0, -0.5, 0); return a; }
    var aL = arm(-1), aR = arm(1);
    var fold = new T.Group(); fold.position.set(0, -0.56, 0.06); aR.add(fold); add(fold, bx(0.26, 0.02, 0.2), ph('#e8b85a', 20), 0, 0, 0); add(fold, bx(0.22, 0.015, 0.18), ph('#fffaf0', 10), 0, 0.015, 0);
    var head = new T.Group(); head.position.set(0, 1.6, 0.02); body.add(head);
    add(head, sp(0.26, 26), skin, 0, 0.12, 0).scale.set(1.02, 1.04, 0.98);
    [-1, 1].forEach(function (sd) { add(head, sp(0.07, 12), skin, sd * 0.26, 0.1, -0.01).scale.set(0.5, 1, 0.8); for (var k = 0; k < 3; k++) add(head, sp(0.09, 12), hair, sd * (0.2 + k * 0.02), 0.12 + k * 0.08, -0.08 - k * 0.03); add(head, sp(0.05, 10), ph('#f7a1a1', 10), sd * 0.15, 0.06, 0.2).scale.set(1, 0.7, 0.4); });
    add(head, sp(0.1, 12), hair, 0, 0.12, -0.22).scale.set(2, 1, 0.7);
    var browL = add(head, bx(0.11, 0.035, 0.04), hair, -0.09, 0.27, 0.22), browR = add(head, bx(0.11, 0.035, 0.04), hair, 0.09, 0.27, 0.22); browL.rotation.z = 0.25; browR.rotation.z = -0.25;
    [-1, 1].forEach(function (sd) { add(head, sp(0.03, 10), ph('#111827', 90), sd * 0.085, 0.17, 0.23); add(head, sp(0.012, 6), glow('#ffffff'), sd * 0.085 + 0.01, 0.18, 0.258); var gl = add(head, new T.TorusGeometry(0.06, 0.008, 6, 20), ph('#c9993a', 80), sd * 0.085, 0.17, 0.245); void gl; });
    add(head, bx(0.05, 0.01, 0.01), ph('#c9993a', 80), 0, 0.175, 0.25);
    add(head, sp(0.06, 14), ph('#eaa98a', 20), 0, 0.09, 0.26);
    var mouth = add(head, new T.TorusGeometry(0.07, 0.014, 8, 16, Math.PI), ph('#7a2a2a', 20), 0, 0.0, 0.225); mouth.rotation.z = Math.PI; // big smile
    add(head, bx(0.1, 0.03, 0.01), glow('#ffffff'), 0, -0.035, 0.245);
    UB = bubble(r, 2.5);
    BAR = { root: r, body: body, head: head, aL: aL, aR: aR, fold: fold, browL: browL, browR: browR, mouth: mouth, react: 0, wave: 0 };
  }

  /* ---------- 1. colonnade + RECORDS ANNEX sign + intercom horns ---------- */
  function colonnade() {
    var z = 26.6, g = root('Annex colonnade');
    [4.4, 7.2, 12.8, 15.6].forEach(function (x, i) {
      var c = new T.Group(); c.name = 'Annex column ' + i; c.position.set(x, 0, z); g.add(c);
      add(c, bx(0.62, 0.22, 0.62), ph('#efe6d8', 40), 0, 0.11, 0); add(c, cy(0.26, 0.26, 0.12, 24), ph('#e8b84a', 80, '#3a2400'), 0, 0.28, 0);
      add(c, cy(0.22, 0.24, 3.9, 24), ph('#f4ede2', 60), 0, 2.29, 0);
      for (var k = 0; k < 10; k++) { var a = k / 10 * Math.PI * 2; add(c, bx(0.03, 3.7, 0.03), ph('#d6cab6', 20), Math.cos(a) * 0.225, 2.29, Math.sin(a) * 0.225); }
      add(c, cy(0.3, 0.24, 0.16, 24), K.gold(), 0, 4.3, 0); add(c, bx(0.64, 0.14, 0.64), ph('#efe6d8', 40), 0, 4.45, 0);
      reg('Annex column ' + i, c); solid(x - 0.31, x + 0.31, z - 0.31, z + 0.31, 'Annex column ' + i);
    });
    var top = new T.Group(); g.add(top); A.noAud(top);
    add(top, bx(16, 0.36, 0.5), ph('#4a2c1a', 30), 10, 4.7, z); add(top, bx(16, 0.06, 0.54), K.gold(), 10, 4.5, z);
    // hanging sign (both faces)
    [0, Math.PI].forEach(function (ry) {
      var t = K.plaqueTex(1024, 220, 'THE RECORDS ANNEX', 'more records \u00b7 more seats \u00b7 more Gus (sorry)', '#ffe14d', '#3a1430');
      var m = new T.Mesh(new T.PlaneGeometry(3.6, 0.78), new T.MeshBasicMaterial({ map: t.tex })); m.position.set(10, 3.85, z + (ry ? -0.04 : 0.04)); m.rotation.y = ry; top.add(m);
    });
    add(top, bx(3.7, 0.86, 0.06), K.gold(), 10, 3.85, z); [-1.5, 1.5].forEach(function (dx) { add(top, cy(0.012, 0.012, 0.4, 6), K.brass(), 10 + dx, 4.35, z); });
    // Gus's intercom horns on the beam (that's how he yells at sitters back here)
    [5.8, 14.2].forEach(function (x) { [-1, 1].forEach(function (sd) { var h = add(top, new T.CylinderGeometry(0.16, 0.035, 0.36, 16, 1, true), new T.MeshPhongMaterial({ color: '#c9993a', shininess: 90, side: T.DoubleSide }), x, 4.2, z + sd * 0.4); h.rotation.x = sd * -1.9; add(top, sp(0.06, 10), K.brass(), x, 4.36, z + sd * 0.26); }); });
    // annex red carpet from the colonnade to the lounge
    add(top, bx(1.8, 0.02, 9.6), ph('#9b1c31', 10), 10, 0.012, 23.9 + 9.6 / 2 + 3.4); // z 27.3..36.9 (skirts the rotunda)
  }

  /* ---------- 2. future niches (empty slots for games #24+) ---------- */
  function niches() {
    var fr = K.free || [];
    fr.forEach(function (s, i) {
      var g = new T.Group(); g.name = 'Reserved niche ' + i; g.position.set(s[0], 0, s[1]); g.rotation.y = s[2]; A.scene.add(g); ROOTS.push(g);
      add(g, bx(1.44, 3.3, 0.1), ph('#2a1d3a', 20), 0, 1.75, 0.05); add(g, bx(1.44, 0.06, 0.12), K.gold(), 0, 3.42, 0.06); add(g, bx(1.44, 0.06, 0.12), K.gold(), 0, 0.08, 0.06);
      var n = K.free.length, num = 24 + i;
      var pq = K.plaqueTex(512, 150, 'COMING SOON', 'reserved for game #' + num + ' \u00b7 Gus is "thrilled"', '#bfe9ff', '#1d1430'); K.planeM(1.3, 0.38, pq.tex, g, 0, 3.0, 0.11);
      add(g, bx(1.0, 0.7, 0.04), ph('#3b2a50', 10), 0, 2.2, 0.11); add(g, bx(1.08, 0.78, 0.03), K.gold(), 0, 2.2, 0.09);
      canvasPlane(g, 256, 180, 0.94, 0.64, function (c, w, h) { c.fillStyle = '#120a22'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(191,233,255,.35)'; c.setLineDash([10, 8]); c.lineWidth = 4; c.strokeRect(14, 14, w - 28, h - 28); c.setLineDash([]); c.fillStyle = '#bfe9ff'; c.font = 'bold 96px Georgia,serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', w / 2, h / 2 + 6); }, 0, 2.2, 0.135);
      // pedestal under a dust sheet + little "PLEASE WAIT" stanchions
      add(g, cy(0.36, 0.42, 0.12, 24), ph('#efe6d8', 60), 0, 0.06, 0.62); add(g, cy(0.3, 0.3, 0.78, 24), ph('#f4ede2', 70), 0, 0.51, 0.62);
      var sheet = add(g, new T.ConeGeometry(0.44, 0.5, 18, 1, true), new T.MeshPhongMaterial({ color: '#e9e4f5', shininess: 10, side: T.DoubleSide }), 0, 1.15, 0.62); sheet.scale.set(1, 1, 0.9); void n;
      add(g, sp(0.16, 14), ph('#e9e4f5', 10), 0, 1.38, 0.62).scale.set(1, 0.7, 1);
      [-0.6, 0.6].forEach(function (sx) { add(g, cy(0.1, 0.12, 0.04, 14), K.brass(), sx, 0.02, 1.02); add(g, cy(0.02, 0.02, 0.8, 8), K.brass(), sx, 0.42, 1.02); add(g, sp(0.045, 10), K.brass(), sx, 0.84, 1.02); });
      add(g, bx(1.2, 0.03, 0.03), ph('#6d28d9', 20), 0, 0.72, 1.02);
      reg('Reserved niche ' + i, g);
      var pts = [[-0.72, 0], [0.72, 0], [-0.72, 1.12], [0.72, 1.12]].map(function (p) { return new T.Vector3(p[0], 0, p[1]).applyMatrix4(g.matrixWorld); });
      solid(Math.min.apply(null, pts.map(function (p) { return p.x; })), Math.max.apply(null, pts.map(function (p) { return p.x; })), Math.min.apply(null, pts.map(function (p) { return p.z; })), Math.max.apply(null, pts.map(function (p) { return p.z; })), 'Reserved niche ' + i);
    });
    // pilasters between the niches (both walls)
    [27.55, 29.65, 31.75, 33.85, 35.95].forEach(function (z) { K.pilaster(A.scene, W.minX, z, Math.PI / 2); K.pilaster(A.scene, W.maxX, z, -Math.PI / 2); });
  }

  /* ---------- 3. Exhibit of the Week rotunda ---------- */
  var EOTW = {};
  H2.eotwGame = function () { var gs = games(); var w = H2.weekNo(); return gs[((w % gs.length) + gs.length) % gs.length]; };
  function rotunda() {
    var x = 10, z = 31.2, g = root('Exhibit of the Week'); g.position.set(x, 0, z);
    var gm = H2.eotwGame(), col = gm.color || '#ffe14d', dd = GA.HALL_DATA[gm.id];
    // 3-step round dais
    [[1.85, 0.12, '#5b3520'], [1.55, 0.24, '#efe6d8'], [1.25, 0.36, '#9b1c31']].forEach(function (q, i) { add(g, cy(q[0], q[0], 0.12, 40), ph(q[2], i === 1 ? 60 : 20), 0, q[1] - 0.06, 0); add(g, new T.TorusGeometry(q[0], 0.02, 6, 48), K.gold(), 0, q[1], 0).rotation.x = Math.PI / 2; });
    // turntable + big model under a glass dome
    var tt = new T.Group(); tt.position.y = 0.36; g.add(tt);
    add(tt, cy(0.8, 0.85, 0.16, 36), ph('#f4ede2', 70), 0, 0.08, 0); add(tt, new T.TorusGeometry(0.8, 0.03, 8, 40), K.gold(), 0, 0.16, 0).rotation.x = Math.PI / 2;
    add(tt, cy(0.38, 0.42, 0.7, 28), ph(K.darker(col, 0.45), 40), 0, 0.51, 0); add(tt, cy(0.45, 0.45, 0.06, 28), K.gold(), 0, 0.88, 0);
    var em = new T.Group(); em.position.set(0, 0.92, 0); em.scale.setScalar(2.1); tt.add(em); (K.EMB[gm.id] || K.EMB.dash)(em);
    var dome = add(g, new T.SphereGeometry(0.98, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshPhongMaterial({ color: '#dff6ff', transparent: true, opacity: 0.16, shininess: 140, depthWrite: false }), 0, 1.24, 0); dome.scale.y = 1.4;
    add(g, new T.TorusGeometry(0.98, 0.035, 8, 40), K.brass(), 0, 1.25, 0).rotation.x = Math.PI / 2;
    // ring of tiny glowing bulbs around the top step
    for (var i = 0; i < 16; i++) { var a = i / 16 * Math.PI * 2; add(g, sp(0.04, 8), glow(i % 2 ? '#ffe14d' : col), Math.cos(a) * 1.4, 0.39, Math.sin(a) * 1.4); }
    // brass posts + rope arcs all the way round (with a gap at the front)
    for (i = 0; i < 8; i++) { var a2 = i / 8 * Math.PI * 2 + Math.PI / 8; add(g, cy(0.08, 0.1, 0.04, 12), K.brass(), Math.cos(a2) * 1.75, 0.02, Math.sin(a2) * 1.75); add(g, cy(0.018, 0.018, 0.8, 8), K.brass(), Math.cos(a2) * 1.75, 0.42, Math.sin(a2) * 1.75); add(g, sp(0.045, 10), K.brass(), Math.cos(a2) * 1.75, 0.84, Math.sin(a2) * 1.75); }
    // easel sign (front) with the game's cover + name
    var ez = -1.55, sg = new T.Group(); sg.position.set(0, 0, ez); sg.rotation.y = Math.PI; g.add(sg);
    [-0.5, 0.5].forEach(function (sx) { var l = add(sg, bx(0.05, 1.9, 0.05), ph('#5b3520', 30), sx, 0.95, 0.05); l.rotation.x = -0.08; });
    add(sg, bx(1.2, 0.9, 0.05), K.gold(), 0, 1.5, 0); add(sg, bx(1.12, 0.06, 0.08), ph('#5b3520', 30), 0, 1.02, 0.04);
    var tl = K.plaqueTex(512, 120, 'EXHIBIT OF THE WEEK', gm.name, col, '#2a0f30'); K.planeM(1.1, 0.26, tl.tex, sg, 0, 1.78, 0.03);
    var cover = new T.TextureLoader().load(dd.cover + '?v=' + K.V); K.planeM(0.86, 0.5, cover, sg, 0, 1.39, 0.03);
    var last = dd.history[dd.history.length - 1];
    canvasPlane(sg, 512, 96, 1.1, 0.2, function (c, w, h) { c.fillStyle = '#f5ecd8'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a2216'; c.font = 'bold 30px Georgia,serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('v' + last.ver + ' \u00b7 ' + dd.history.length + ' updates \u00b7 new pick every Monday', w / 2, h / 2); }, 0, 0.88, 0.05);
    // overhead chandelier (not audited, it's up in the ceiling)
    var ch = new T.Group(); g.add(ch); A.noAud(ch);
    add(ch, cy(0.015, 0.015, 0.7, 6), K.brass(), 0, 4.65, 0); add(ch, new T.TorusGeometry(0.75, 0.04, 8, 36), K.gold(), 0, 4.2, 0).rotation.x = Math.PI / 2; add(ch, new T.TorusGeometry(0.45, 0.03, 8, 30), K.gold(), 0, 4.05, 0).rotation.x = Math.PI / 2;
    for (i = 0; i < 10; i++) { var a3 = i / 10 * Math.PI * 2; add(ch, cy(0.03, 0.03, 0.14, 8), ph('#fff8e1', 30), Math.cos(a3) * 0.75, 4.29, Math.sin(a3) * 0.75); add(ch, sp(0.045, 8), glow('#fff3c4'), Math.cos(a3) * 0.75, 4.4, Math.sin(a3) * 0.75); add(ch, new T.OctahedronGeometry(0.05), new T.MeshPhongMaterial({ color: '#e0f2fe', shininess: 150, transparent: true, opacity: 0.8 }), Math.cos(a3) * 0.6, 3.9, Math.sin(a3) * 0.6); }
    var cone = add(ch, new T.ConeGeometry(1.4, 3.6, 24, 1, true), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.05, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }), 0, 2.2, 0); void cone;
    var gmat = glowFloor(g, col, 2.4, 1.4, 0, -2.6);
    reg('Exhibit of the Week', g); solid(x - 1.9, x + 1.9, z - 1.9, z + 1.9, 'Exhibit of the Week');
    cab({ id: 'h2_eotw', kind: 'h2_eotw', name: 'Exhibit of the Week', color: col, x: x, z: z - 2.65, dir: [0, -1], r: 1.15, group: g, glow: gmat, data: { gid: gm.id } });
    EOTW = { g: g, tt: tt, em: em, gid: gm.id };
  }

  /* ---------- seats ---------- */
  // face = the way you look when seated (player yaw). front = where you stand to sit down.
  function seat(id, name, x, z, face, y, grp, cam) {
    var dx = Math.sin(face), dz = Math.cos(face), fx = x + dx * 0.85, fz = z + dz * 0.85;
    SEATS[id] = { id: id, name: name, x: x, z: z, face: face, y: y || 0.45, fx: fx, fz: fz, cam: cam || null };
    cab({ id: id, kind: 'h2_seat', name: name, color: '#ffcf3a', x: fx, z: fz, dir: [dx, dz], r: 0.95, group: grp, data: { seat: id } });
  }
  var woodD = '#5b3520', woodL = '#7a4a2a';
  function bench(name, x, z, face) { // 1.8 long, seats look along face (+x or -x)
    var g = root(name); g.position.set(x, 0, z); g.rotation.y = face; // local +z = facing
    var w = ph(woodL, 40), d = ph(woodD, 30), cush = ph('#9b1c31', 10);
    add(g, bx(1.8, 0.08, 0.5), w, 0, 0.42, 0.02); add(g, bx(1.7, 0.08, 0.44), cush, 0, 0.49, 0.03);
    add(g, bx(1.8, 0.55, 0.08), w, 0, 0.82, -0.24); add(g, bx(1.7, 0.4, 0.04), cush, 0, 0.8, -0.19);
    for (var i = -2; i <= 2; i++) add(g, bx(0.05, 0.4, 0.03), K.gold(), i * 0.36, 0.82, -0.285);
    [-0.85, 0.85].forEach(function (sx) { add(g, bx(0.08, 0.42, 0.5), d, sx, 0.21, 0.02); add(g, bx(0.1, 0.06, 0.56), K.gold(), sx, 0.64, 0.02); add(g, bx(0.08, 0.2, 0.08), d, sx, 0.56, 0.2); });
    reg(name, g); var c = Math.cos(face), s = Math.sin(face);
    var ex = Math.abs(c) * 0.92 + Math.abs(s) * 0.31, ez = Math.abs(s) * 0.92 + Math.abs(c) * 0.31; solid(x - ex, x + ex, z - ez, z + ez, name);
    // two seats on the bench: offset along the bench's long axis (local x)
    [-0.45, 0.45].forEach(function (o, k) { seat(name.replace(/\W+/g, '_').toLowerCase() + '_' + k, name, x + c * o, z - s * o, face, 0.5, g); });
    return g;
  }
  function armchair(name, x, z, face, col) {
    var g = root(name); g.position.set(x, 0, z); g.rotation.y = face;
    var fab = ph(col, 15), d = ph(woodD, 30);
    add(g, bx(0.8, 0.3, 0.76), fab, 0, 0.3, 0); add(g, bx(0.66, 0.12, 0.6), ph(col, 25), 0, 0.5, 0.06);
    add(g, bx(0.8, 0.75, 0.18), fab, 0, 0.75, -0.3); add(g, cy(0.09, 0.09, 0.8, 14), fab, 0, 1.12, -0.3).rotation.z = Math.PI / 2;
    [-1, 1].forEach(function (sd) { add(g, bx(0.14, 0.38, 0.72), fab, sd * 0.36, 0.55, 0.01); add(g, cy(0.08, 0.08, 0.72, 12), fab, sd * 0.36, 0.74, 0.01).rotation.x = Math.PI / 2; [-0.3, 0.3].forEach(function (zz) { add(g, cy(0.03, 0.02, 0.15, 8), d, sd * 0.33, 0.075, zz); }); });
    for (var i = 0; i < 4; i++) add(g, sp(0.02, 6), K.gold(), -0.27 + i * 0.18, 0.95, -0.205);
    reg(name, g); solid(x - 0.42, x + 0.42, z - 0.42, z + 0.42, name);
    seat(name.replace(/\W+/g, '_').toLowerCase(), name, x + Math.sin(face) * 0.08, z + Math.cos(face) * 0.08, face, 0.52, g);
    return g;
  }
  function benches() { bench('Annex bench W', 6.3, 31.2, Math.PI / 2); bench('Annex bench E', 13.7, 31.2, -Math.PI / 2); }

  /* ---------- memorabilia cases: glass tables with real props inside ---------- */
  function caseProps(g, kind) {
    var k = new T.Group(); k.position.y = 0.95; g.add(k);
    if (kind === 0) { // the first Grok Sky plane + a toy control tower
      add(k, cy(0.05, 0.05, 0.5, 12), ph('#f8fafc', 80), -0.15, 0.08, 0).rotation.z = Math.PI / 2; add(k, bx(0.1, 0.012, 0.5), ph('#38bdf8', 60), -0.15, 0.08, 0); add(k, bx(0.06, 0.1, 0.012), ph('#fde047', 60), -0.37, 0.14, 0);
      add(k, cy(0.04, 0.05, 0.28, 10), ph('#e2e8f0', 50), 0.28, 0.14, 0); add(k, cy(0.08, 0.06, 0.08, 10), new T.MeshPhongMaterial({ color: '#7dd3fc', transparent: true, opacity: 0.7 }), 0.28, 0.32, 0);
    } else if (kind === 1) { // pickleball paddle + ball + a tiny kart
      var p = add(k, cy(0.12, 0.12, 0.02, 20), ph('#22c55e', 80), -0.2, 0.02, 0); p.scale.set(1, 1, 1.3); add(k, bx(0.04, 0.02, 0.14), ph('#3b2a1a', 30), -0.2, 0.02, 0.2); add(k, sp(0.04, 10), ph('#e6ff3b', 60, '#3a4500'), -0.02, 0.04, 0.08);
      add(k, bx(0.16, 0.05, 0.24), ph('#e11d48', 90), 0.25, 0.06, 0); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { add(k, cy(0.035, 0.035, 0.035, 10), ph('#1f2433', 30), 0.25 + q[0] * 0.09, 0.035, q[1] * 0.08).rotation.z = Math.PI / 2; });
    } else if (kind === 2) { // ghost jar + detective magnifier
      add(k, cy(0.1, 0.1, 0.24, 18), new T.MeshPhongMaterial({ color: '#d9f99d', transparent: true, opacity: 0.35, shininess: 120 }), -0.2, 0.12, 0); add(k, sp(0.06, 12), ph('#ecfdf5', 40, '#1f6b38'), -0.2, 0.12, 0); add(k, cy(0.11, 0.11, 0.04, 18), ph('#64748b', 60), -0.2, 0.26, 0);
      var mg = add(k, new T.TorusGeometry(0.08, 0.015, 8, 24), K.brass(), 0.22, 0.03, 0); mg.rotation.x = Math.PI / 2; add(k, bx(0.03, 0.02, 0.16), ph('#5b3a1e', 30), 0.22, 0.02, 0.15);
    } else { // golden cheese trophy + a tiny voxel block stack
      add(k, cy(0.07, 0.09, 0.05, 16), K.gold(), -0.2, 0.025, 0); var ch = add(k, new T.CylinderGeometry(0.12, 0.12, 0.08, 3), ph('#ffd23f', 90, '#6a4a00'), -0.2, 0.11, 0); ch.rotation.y = 0.4;
      for (var i = 0; i < 6; i++) add(k, bx(0.07, 0.07, 0.07), ph(['#a855f7', '#22d3ee', '#4ade80', '#ff4fd8', '#ffe14d', '#f97316'][i], 40), 0.18 + (i % 3) * 0.075, 0.035 + Math.floor(i / 3) * 0.075, 0);
    }
  }
  function cases() {
    [[6.3, 27.9, 0], [13.7, 27.9, 1], [6.3, 34.5, 2], [13.7, 34.5, 3]].forEach(function (q, i) {
      var name = 'Memorabilia case ' + i, g = root(name); g.position.set(q[0], 0, q[1]);
      add(g, bx(1.1, 0.85, 0.7), ph('#4a2c1a', 40), 0, 0.425, 0); add(g, bx(1.14, 0.05, 0.74), K.gold(), 0, 0.87, 0);
      add(g, bx(1.04, 0.45, 0.64), new T.MeshPhongMaterial({ color: '#dff6ff', transparent: true, opacity: 0.18, shininess: 140, depthWrite: false }), 0, 1.12, 0);
      [[-0.52, -0.32], [0.52, -0.32], [-0.52, 0.32], [0.52, 0.32]].forEach(function (c) { add(g, bx(0.03, 0.47, 0.03), K.brass(), c[0], 1.12, c[1]); });
      add(g, bx(1.08, 0.03, 0.68), K.brass(), 0, 1.36, 0);
      add(g, bx(0.98, 0.02, 0.58), ph('#7f1d1d', 10), 0, 0.9, 0); caseProps(g, q[2]);
      var lbl = ['FIRST FLIGHT (2026)', 'SPORTS NIGHT', 'SPOOKY & SNEAKY', 'SHINY THINGS'][i];
      canvasPlane(g, 256, 48, 0.5, 0.09, function (c, w, h) { c.fillStyle = '#c9993a'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a1a10'; c.font = 'bold 26px Georgia,serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(lbl, w / 2, h / 2); }, 0, 0.7, 0.355);
      canvasPlane(g, 256, 48, 0.5, 0.09, function (c, w, h) { c.fillStyle = '#c9993a'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a1a10'; c.font = 'bold 26px Georgia,serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(lbl, w / 2, h / 2); }, 0, 0.7, -0.355, Math.PI);
      reg(name, g); solid(q[0] - 0.57, q[0] + 0.57, q[1] - 0.37, q[1] + 0.37, name);
    });
  }

  /* ---------- 4. reading nook: shelves full of (instanced) books, rolling ladder, armchairs, lamp, rug ---------- */
  function nook() {
    var name = 'Reading nook shelves', g = root(name), x0 = W.minX, z0 = 37.0, z1 = 41.6;
    var wood = ph('#4a2c1a', 30), woodLt = ph('#6b4226', 40);
    add(g, bx(0.5, 3.0, z1 - z0), wood, x0 + 0.25, 1.5, (z0 + z1) / 2);
    var rows = [0.35, 0.95, 1.55, 2.15, 2.72];
    rows.forEach(function (y) { add(g, bx(0.56, 0.05, z1 - z0), woodLt, x0 + 0.3, y - 0.05, (z0 + z1) / 2); });
    [z0, z0 + 1.533, z0 + 3.066, z1].forEach(function (z) { add(g, bx(0.58, 3.0, 0.06), woodLt, x0 + 0.29, 1.5, z); });
    add(g, bx(0.62, 0.12, z1 - z0 + 0.1), woodLt, x0 + 0.31, 3.05, (z0 + z1) / 2); add(g, bx(0.62, 0.04, z1 - z0 + 0.1), K.gold(), x0 + 0.31, 2.98, (z0 + z1) / 2);
    // books: one InstancedMesh, every spine a different size/colour
    var pal = ['#b91c1c', '#1d4ed8', '#15803d', '#a16207', '#7c3aed', '#be185d', '#0f766e', '#f59e0b', '#334155', '#e11d48', '#0891b2', '#65a30d'];
    var R = rng(32), mats = [], n = 0, list = [];
    rows.forEach(function (y, ri) { if (ri === rows.length - 1) return; var z = z0 + 0.08; while (z < z1 - 0.1) { var w = 0.05 + R() * 0.05, h = 0.32 + R() * 0.18; if (Math.abs(((z - z0) % 1.533)) < 0.06) { z += 0.07; continue; } var lean = R() < 0.06 ? 0.25 : 0; list.push([x0 + 0.33, y + h / 2, z + w / 2, w, h, lean, pal[Math.floor(R() * pal.length)]]); z += w + 0.004 + (lean ? 0.08 : 0); } });
    var im = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshPhongMaterial({ color: '#ffffff', shininess: 20 }), list.length), m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), s = new T.Vector3(), cc = new T.Color();
    list.forEach(function (b, i) { e.set(b[5], 0, 0); q.setFromEuler(e); m4.compose(v.set(b[0], b[1], b[2]), q, s.set(0.34, b[4], b[3])); im.setMatrixAt(i, m4); im.setColorAt(i, cc.set(b[6])); n++; });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; g.add(im); void mats;
    // gold-leaf titles on the middle shelf + a "GAME HISTORY" plaque
    var pq = K.plaqueTex(512, 120, 'GAME HISTORY LIBRARY', 'borrow anything \u00b7 return it (Barnaby)', '#ffe14d'); var pm = K.planeM(1.6, 0.38, pq.tex, g, x0 + 0.62, 3.32, (z0 + z1) / 2); pm.rotation.y = Math.PI / 2;
    // rolling ladder on a brass rail
    add(g, bx(0.04, 0.04, z1 - z0), K.brass(), x0 + 0.66, 2.86, (z0 + z1) / 2);
    var ld = new T.Group(); ld.position.set(x0 + 0.78, 0, z0 + 3.6); ld.rotation.z = 0.12; g.add(ld);
    [-0.22, 0.22].forEach(function (zz) { add(ld, bx(0.05, 2.9, 0.05), woodLt, 0, 1.45, zz); }); for (var r2 = 0; r2 < 7; r2++) add(ld, bx(0.05, 0.04, 0.44), woodLt, 0, 0.3 + r2 * 0.38, 0);
    reg(name, g); solid(x0, x0 + 0.95, z0 - 0.05, z1 + 0.05, name);
    cab({ id: 'h2_books', kind: 'h2_books', name: 'Game History Library', color: '#ffe14d', x: x0 + 1.55, z: 39.3, dir: [1, 0], r: 0.9, group: g, glow: glowFloor(g, '#ffe14d', 1.2, 1.4, x0 + 1.6, 39.3) });
    // armchairs facing the shelves + side table with a green banker's lamp + floor lamp + round rug
    armchair('Nook armchair N', 5.4, 37.9, -Math.PI / 2 + 0.25, '#7c2d3a'); armchair('Nook armchair S', 5.4, 40.7, -Math.PI / 2 - 0.25, '#2d4a7c');
    var t = root('Nook side table'); t.position.set(5.5, 0, 39.3);
    add(t, cy(0.28, 0.28, 0.04, 24), ph(woodL, 50), 0, 0.62, 0); add(t, cy(0.04, 0.05, 0.6, 10), ph(woodD, 30), 0, 0.31, 0); add(t, cy(0.2, 0.22, 0.03, 18), ph(woodD, 30), 0, 0.015, 0);
    add(t, cy(0.06, 0.07, 0.03, 14), K.brass(), 0.08, 0.655, 0); add(t, cy(0.01, 0.01, 0.22, 6), K.brass(), 0.08, 0.77, 0); var sh = add(t, new T.CylinderGeometry(0.05, 0.11, 0.09, 14, 1, true), new T.MeshPhongMaterial({ color: '#1f7a4a', shininess: 90, side: T.DoubleSide }), 0.08, 0.9, 0); void sh; add(t, sp(0.03, 8), glow('#fff3c4'), 0.08, 0.87, 0);
    for (var b = 0; b < 3; b++) add(t, bx(0.18, 0.04, 0.13), ph(pal[b * 3], 20), -0.1, 0.66 + b * 0.04, 0.02).rotation.y = b * 0.3;
    add(t, cy(0.035, 0.03, 0.08, 12), ph('#ffffff', 60), -0.05, 0.68, -0.15);
    reg('Nook side table', t); solid(5.2, 5.8, 39.0, 39.6, 'Nook side table');
    var rug = root('Nook rug'); A.noAud(rug); var rgm = add(rug, cy(1.5, 1.5, 0.015, 40), ph('#6b2a3a', 8), 4.3, 0.009, 39.3); void rgm; add(rug, new T.TorusGeometry(1.35, 0.03, 4, 48), ph('#e8b84a', 30), 4.3, 0.018, 39.3).rotation.x = Math.PI / 2; add(rug, cy(0.9, 0.9, 0.016, 32), ph('#8a3a4a', 8), 4.3, 0.011, 39.3);
    var fl = root('Nook floor lamp'); fl.position.set(3.1, 0, 36.5);
    add(fl, cy(0.18, 0.2, 0.04, 16), K.brass(), 0, 0.02, 0); add(fl, cy(0.018, 0.018, 1.6, 8), K.brass(), 0, 0.82, 0); add(fl, new T.CylinderGeometry(0.16, 0.26, 0.3, 18, 1, true), new T.MeshPhongMaterial({ color: '#fde8b0', emissive: '#6a4a10', side: T.DoubleSide }), 0, 1.68, 0); add(fl, sp(0.06, 10), glow('#fff3c4'), 0, 1.6, 0);
    var lg = new T.Sprite(new T.SpriteMaterial({ map: A.glowTex, color: '#ffd98a', transparent: true, opacity: 0.5, depthWrite: false, blending: T.AdditiveBlending })); lg.scale.set(1.3, 1.3, 1); lg.position.set(0, 1.6, 0); fl.add(lg); A.noAud(lg);
    reg('Nook floor lamp', fl); solid(2.9, 3.3, 36.3, 36.7, 'Nook floor lamp');
  }

  /* ---------- 5. the lounge: sofa, armchairs, coffee table, lamps, big rug ---------- */
  function lounge() {
    var rug = root('Lounge rug'); A.noAud(rug); add(rug, bx(5.2, 0.015, 3.6), ph('#2a2f7a', 8), 10, 0.009, 40.4); add(rug, bx(4.8, 0.016, 3.2), ph('#3b3f9a', 8), 10, 0.011, 40.4);
    [[0, 1.55], [0, -1.55]].forEach(function (q) { add(rug, bx(4.8, 0.017, 0.06), ph('#ffe14d', 30), 10, 0.014, 40.4 + q[1]); });
    var name = 'Lounge sofa', g = root(name); g.position.set(10, 0, 41.62); g.rotation.y = Math.PI; // faces the rotunda
    var vel = ph('#7c3aed', 15), velL = ph('#8b5cf6', 25), d = ph(woodD, 30);
    add(g, bx(2.5, 0.3, 0.9), vel, 0, 0.3, 0); [-0.8, 0, 0.8].forEach(function (sx) { add(g, bx(0.78, 0.14, 0.72), velL, sx, 0.52, 0.07); add(g, bx(0.74, 0.5, 0.16), velL, sx, 0.85, -0.3).rotation.x = -0.12; });
    add(g, bx(2.5, 0.8, 0.2), vel, 0, 0.8, -0.36); add(g, cy(0.1, 0.1, 2.5, 14), vel, 0, 1.2, -0.36).rotation.z = Math.PI / 2;
    [-1, 1].forEach(function (sd) { add(g, bx(0.18, 0.42, 0.86), vel, sd * 1.16, 0.6, 0); add(g, cy(0.1, 0.1, 0.86, 12), vel, sd * 1.16, 0.82, 0).rotation.x = Math.PI / 2; [-0.35, 0.35].forEach(function (zz) { add(g, cy(0.035, 0.025, 0.15, 8), d, sd * 1.1, 0.075, zz); }); });
    for (var i = 0; i < 9; i++) add(g, sp(0.022, 6), K.gold(), -1.0 + i * 0.25, 1.0, -0.255);
    add(g, bx(0.36, 0.36, 0.1), ph('#ffcf3a', 15), -0.85, 0.75, -0.18).rotation.set(-0.2, 0.25, 0.1); add(g, bx(0.34, 0.34, 0.1), ph('#3ff0ff', 15), 0.86, 0.75, -0.18).rotation.set(-0.2, -0.25, -0.1);
    reg(name, g); solid(8.73, 11.27, 41.15, 42.1, name);
    [-0.8, 0, 0.8].forEach(function (o, k) { seat('lounge_sofa_' + k, 'Lounge sofa', 10 + o, 41.55, Math.PI, 0.52, g); });
    armchair('Lounge armchair W', 7.6, 40.0, Math.PI / 2, '#b45309'); armchair('Lounge armchair E', 12.4, 40.0, -Math.PI / 2, '#0f766e');
    var t = root('Lounge coffee table'); t.position.set(10, 0, 39.6);
    add(t, bx(1.3, 0.06, 0.62), ph(woodL, 60), 0, 0.42, 0); add(t, bx(1.2, 0.04, 0.52), ph(woodD, 30), 0, 0.12, 0); [[-0.58, -0.25], [0.58, -0.25], [-0.58, 0.25], [0.58, 0.25]].forEach(function (q) { add(t, cy(0.03, 0.025, 0.4, 8), ph(woodD, 30), q[0], 0.2, q[1]); });
    // magazines (GROK WEEKLY), a bowl of mints, Barnaby's guest book + pen
    var mag = K.cvs(128, 160, function (c, w, h) { c.fillStyle = '#ff4fd8'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = 'bold 20px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.fillText('GROK', w / 2, 26); c.fillText('WEEKLY', w / 2, 48); c.fillStyle = '#ffe14d'; c.fillRect(14, 60, w - 28, 70); c.fillStyle = '#2a0b4a'; c.font = 'bold 13px sans-serif'; c.fillText('GUS SMILES?!', w / 2, 100); c.fillText('(fake news)', w / 2, 118); });
    var mm = new T.MeshPhongMaterial({ map: mag.tex, shininess: 40 }); [[-0.35, 0.05, 0.3], [-0.25, -0.05, -0.2]].forEach(function (q, k) { var m = add(t, bx(0.24, 0.012, 0.3), mm, q[0], 0.456 + k * 0.012, q[1]); m.rotation.y = q[2]; });
    add(t, new T.SphereGeometry(0.11, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new T.MeshPhongMaterial({ color: '#bfe9ff', transparent: true, opacity: 0.55, side: T.DoubleSide }), 0.15, 0.56, 0);
    for (i = 0; i < 7; i++) add(t, sp(0.025, 8), ph(['#ff4f6b', '#ffffff', '#4ade80'][i % 3], 60), 0.15 + Math.cos(i) * 0.05, 0.5, Math.sin(i) * 0.05);
    add(t, bx(0.3, 0.05, 0.22), ph('#7f1d1d', 20), 0.45, 0.47, 0.05); add(t, bx(0.28, 0.01, 0.2), ph('#fffaf0', 10), 0.45, 0.498, 0.05); add(t, cy(0.008, 0.008, 0.16, 6), ph('#111827', 60), 0.5, 0.505, 0.0).rotation.z = Math.PI / 2;
    reg('Lounge coffee table', t); solid(9.33, 10.67, 39.27, 39.93, 'Lounge coffee table');
    [[8.35, 42.35], [11.65, 42.35]].forEach(function (q, k) {
      var n2 = 'Lounge lamp ' + k, l = root(n2); l.position.set(q[0], 0, q[1]);
      add(l, cy(0.16, 0.18, 0.04, 16), K.gold(), 0, 0.02, 0); add(l, cy(0.018, 0.018, 1.5, 8), K.gold(), 0, 0.77, 0); add(l, new T.CylinderGeometry(0.15, 0.24, 0.28, 18, 1, true), new T.MeshPhongMaterial({ color: '#fbcfe8', emissive: '#6a2a4a', side: T.DoubleSide }), 0, 1.6, 0); add(l, sp(0.06, 10), glow('#fff3c4'), 0, 1.52, 0);
      var lg = new T.Sprite(new T.SpriteMaterial({ map: A.glowTex, color: '#ffc2e0', transparent: true, opacity: 0.45, depthWrite: false, blending: T.AdditiveBlending })); lg.scale.set(1.2, 1.2, 1); lg.position.set(0, 1.55, 0); l.add(lg); A.noAud(lg);
      reg(n2, l); solid(q[0] - 0.19, q[0] + 0.19, q[1] - 0.19, q[1] + 0.19, n2);
    });
  }

  /* ---------- 6. "NO LOITERING" A-frame signs (Gus) with Barnaby's sticky note ---------- */
  function noLoiter() {
    [[8.3, 37.1, 0.4], [6.3, 29.4, Math.PI - 0.3]].forEach(function (q, i) {
      var name = 'No Loitering sign ' + i, g = root(name); g.position.set(q[0], 0, q[1]); g.rotation.y = q[2];
      var tx = K.cvs(256, 320, function (c, w, h) { c.fillStyle = '#fffbeb'; c.fillRect(0, 0, w, h); c.strokeStyle = '#b91c1c'; c.lineWidth = 14; c.strokeRect(7, 7, w - 14, h - 14); c.fillStyle = '#b91c1c'; c.textAlign = 'center'; c.font = 'bold 44px "Trebuchet MS",sans-serif'; c.fillText('NO', w / 2, 66); c.fillText('LOITERING', w / 2, 112); c.font = 'bold 22px Georgia,serif'; c.fillStyle = '#3a2216'; c.fillText('No sitting. No napping.', w / 2, 160); c.fillText('No "just resting".', w / 2, 188); c.fillText('- Gus', w / 2, 222);
        c.save(); c.translate(178, 268); c.rotate(-0.12); c.fillStyle = '#fde047'; c.fillRect(-62, -36, 124, 72); c.fillStyle = '#1f5130'; c.font = 'bold 15px "Trebuchet MS",sans-serif'; c.fillText('(he doesn\u2019t', 0, -8); c.fillText('mean it! -B)', 0, 14); c.restore(); });
      var mt = new T.MeshPhongMaterial({ map: tx.tex, shininess: 20 });
      [-1, 1].forEach(function (sd) { var p = new T.Group(); p.position.set(0, 0, 0); p.rotation.x = sd * 0.22; g.add(p); add(p, bx(0.5, 0.82, 0.03), ph('#5b3520', 30), 0, 0.42, sd * 0.03); var f = add(p, new T.PlaneGeometry(0.44, 0.55), mt, 0, 0.5, sd * 0.05); if (sd < 0) f.rotation.y = Math.PI; });
      reg(name, g); solid(q[0] - 0.28, q[0] + 0.28, q[1] - 0.28, q[1] + 0.28, name);
    });
  }

  /* ---------- 7. walk-in photo booth ---------- */
  var BOOTH = {};
  function photoBooth() {
    var name = 'Photo booth', g = root(name), x0 = W.minX, x1 = 3.95, z0 = 43.2, z1 = 45.6, H = 2.7;
    var body = ph('#d61f45', 50), trim = K.chrome(), cur = new T.MeshPhongMaterial({ color: '#7f1d1d', shininess: 10, side: T.DoubleSide });
    add(g, bx(0.15, H, z1 - z0), body, x0 + 0.075, H / 2, (z0 + z1) / 2); // back (west) wall
    add(g, bx(x1 - x0, H, 0.15), body, (x0 + x1) / 2, H / 2, z0 + 0.075); add(g, bx(x1 - x0, H, 0.15), body, (x0 + x1) / 2, H / 2, z1 - 0.075);
    add(g, bx(x1 - x0 + 0.1, 0.12, z1 - z0 + 0.1), trim, (x0 + x1) / 2, H + 0.06, (z0 + z1) / 2);
    [z0 + 0.075, z1 - 0.075].forEach(function (z) { for (var k = 0; k < 9; k++) add(g, sp(0.035, 8), glow(k % 2 ? '#ffe14d' : '#ffffff'), x0 + 0.25 + k * 0.2, 2.45, z + (z < (z0 + z1) / 2 ? -0.08 : 0.08)); });
    // marquee
    var mq = K.cvs(512, 128, function (c, w, h) { c.fillStyle = '#2a0b4a'; c.fillRect(0, 0, w, h); A.neonText(c, 'PHOTO BOOTH', w / 2, h * 0.42, 58, '#ff4fd8', w - 30); c.font = 'bold 22px "Trebuchet MS",sans-serif'; c.fillStyle = '#ffe14d'; c.textAlign = 'center'; c.fillText('4 POSES \u00b7 FREE \u00b7 SIT & SMILE', w / 2, h * 0.84); });
    var mqm = K.planeM(1.8, 0.45, mq.tex, g, x1 + 0.005, H + 0.38, (z0 + z1) / 2); mqm.rotation.y = Math.PI / 2;
    add(g, bx(0.06, 0.55, 1.9), ph('#1c1f3a', 40), x1 - 0.03, H + 0.38, (z0 + z1) / 2);
    // camera unit on the back wall (lens + flash) and a backdrop curtain behind the stool? no: the backdrop is on the side you sit facing away from
    add(g, bx(0.3, 0.5, 0.6), ph('#1f2937', 60), x0 + 0.3, 1.45, (z0 + z1) / 2); var lens = add(g, cy(0.1, 0.12, 0.08, 20), ph('#0b0b10', 120), x0 + 0.49, 1.5, (z0 + z1) / 2); lens.rotation.z = Math.PI / 2; add(g, cy(0.06, 0.06, 0.02, 16), glow('#7dd3fc'), x0 + 0.535, 1.5, (z0 + z1) / 2).rotation.z = Math.PI / 2;
    var flash = add(g, bx(0.04, 0.12, 0.36), glow('#fff8e1'), x0 + 0.46, 1.78, (z0 + z1) / 2);
    var scr = K.cvs(256, 128, function (c, w, h) { c.fillStyle = '#04120f'; c.fillRect(0, 0, w, h); c.fillStyle = '#5dff8a'; c.font = 'bold 30px monospace'; c.textAlign = 'center'; c.fillText('SMILE!', w / 2, 56); c.font = 'bold 20px monospace'; c.fillStyle = '#ffe14d'; c.fillText('LOOK HERE \u2193', w / 2, 100); });
    var sm = K.planeM(0.5, 0.25, scr.tex, g, x0 + 0.455, 1.12, (z0 + z1) / 2); sm.rotation.y = Math.PI / 2;
    // stool (you sit facing the camera) + photo strip slot outside
    var stool = new T.Group(); stool.position.set(3.45, 0, (z0 + z1) / 2); g.add(stool); add(stool, cy(0.2, 0.2, 0.08, 18), ph('#111827', 40), 0, 0.46, 0); add(stool, cy(0.03, 0.03, 0.42, 8), trim, 0, 0.21, 0); add(stool, new T.TorusGeometry(0.16, 0.015, 6, 20), trim, 0, 0.18, 0).rotation.x = Math.PI / 2; add(stool, cy(0.18, 0.2, 0.03, 16), trim, 0, 0.015, 0);
    // curtain (tied back) + rod
    add(g, cy(0.02, 0.02, z1 - z0, 8), trim, x1 - 0.02, 2.3, (z0 + z1) / 2).rotation.x = Math.PI / 2;
    [z0 + 0.32, z1 - 0.32].forEach(function (z) { var c = add(g, new T.CylinderGeometry(0.16, 0.22, 2.2, 14, 1, true), cur, x1 - 0.12, 1.2, z); c.scale.set(0.5, 1, 1); add(g, new T.TorusGeometry(0.12, 0.02, 6, 16), K.gold(), x1 - 0.12, 1.1, z).rotation.x = Math.PI / 2; });
    // sample photo strip on the outside wall
    var strip = K.cvs(96, 320, function (c, w, h) { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); ['#3ff0ff', '#ff4fd8', '#ffe14d', '#4ade80'].forEach(function (col, i) { c.fillStyle = col; c.fillRect(8, 8 + i * 76, w - 16, 66); c.fillStyle = '#1a0a33'; c.beginPath(); c.arc(w / 2, 34 + i * 76, 14, 0, 7); c.fill(); c.fillRect(w / 2 - 16, 48 + i * 76, 32, 20); }); });
    var stm = K.planeM(0.3, 1.0, strip.tex, g, (x0 + x1) / 2 + 0.4, 1.5, z0 - 0.005); stm.rotation.y = Math.PI;
    reg(name, g);
    solid(x0, x0 + 0.62, z0, z1, name); solid(x0, x1, z0, z0 + 0.15, name); solid(x0, x1, z1 - 0.15, z1, name);
    BOOTH = { g: g, flash: flash, fx: 3.45, fz: (z0 + z1) / 2, flashT: 0 };
    flash.visible = false;
    var gm = glowFloor(g, '#ff4fd8', 1.2, 1.6, 3.35, (z0 + z1) / 2);
    seat('booth_stool', 'Photo booth stool', 3.45, (z0 + z1) / 2, -Math.PI / 2, 0.5, g, [x0 + 0.62, 1.42, (z0 + z1) / 2, 3.45, 1.05, (z0 + z1) / 2]);
    // the booth itself is the seat's cabinet: re-tag it so the prompt offers PHOTOS
    var sc = CABS.booth_stool; sc.kind = 'h2_photo'; sc.front.set(3.3, 0, (z0 + z1) / 2); sc.glow = gm; sc.r = 0.75; SEATS.booth_stool.fx = 3.3;
  }
  H2.booth = function () { return BOOTH; };
  H2.flash = function () { if (BOOTH.flash) { BOOTH.flash.visible = true; BOOTH.flashT = 0.18; } };

  /* ---------- 8. Barnaby's sorting station ---------- */
  var SORT = {};
  function sortingStation() {
    var name = 'Barnaby\u2019s Sorting Station', g = root(name), xw = W.maxX;
    var wood = ph('#5b3520', 40), woodLt = ph('#7a4a2a', 50);
    // pigeonhole wall (5 x 9 cubbies) full of folders (instanced) + labels
    add(g, bx(0.45, 3.3, 4.6), ph('#4a2c1a', 30), xw - 0.225, 1.65, 39.3);
    for (var r = 0; r <= 5; r++) add(g, bx(0.5, 0.04, 4.6), woodLt, xw - 0.25, 0.9 + r * 0.46, 39.3);
    for (var c = 0; c <= 9; c++) add(g, bx(0.5, 2.3, 0.04), woodLt, xw - 0.25, 2.05, 37.0 + c * 0.511);
    var fl = [], R = rng(7), pal = ['#e8b85a', '#f0c674', '#ffd8a8', '#cdeffd', '#ffd6e7', '#d9f99d'];
    for (r = 0; r < 5; r++) for (c = 0; c < 9; c++) { var k = Math.floor(R() * 4); for (var f = 0; f < k; f++) fl.push([xw - 0.28, 0.92 + r * 0.46 + 0.17, 37.0 + c * 0.511 + 0.1 + f * 0.09 + R() * 0.03, R() * 0.3 - 0.15, pal[Math.floor(R() * pal.length)]]); }
    var im = new T.InstancedMesh(new T.BoxGeometry(0.36, 0.3, 0.025), new T.MeshPhongMaterial({ color: '#ffffff', shininess: 10 }), fl.length), m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), s1 = new T.Vector3(1, 1, 1), cc = new T.Color();
    fl.forEach(function (b, i) { e.set(b[3], 0, 0); q.setFromEuler(e); m4.compose(v.set(b[0], b[1], b[2]), q, s1); im.setMatrixAt(i, m4); im.setColorAt(i, cc.set(b[4])); });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; g.add(im);
    var lab = K.cvs(1024, 96, function (c2, w, h) { c2.fillStyle = '#c9993a'; c2.fillRect(0, 0, w, h); c2.fillStyle = '#2a1a10'; c2.font = 'bold 44px Georgia,serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; ['A\u2013F', 'G\u2013L', 'M\u2013R', 'S\u2013Z'].forEach(function (t, i) { c2.fillText(t, w * (i + 0.5) / 4, h / 2); }); });
    var lm = K.planeM(4.4, 0.2, lab.tex, g, xw - 0.5, 3.22, 39.3); lm.rotation.y = -Math.PI / 2;
    var top = K.plaqueTex(1024, 180, 'BARNABY\u2019S SORTING STATION', 'everything has a place \u00b7 even Gus', '#7df9a0', '#123020'); var tm = K.planeM(3.4, 0.6, top.tex, g, xw - 0.47, 3.65, 39.3); tm.rotation.y = -Math.PI / 2;
    // L-shaped desk with a little conveyor belt carrying folders + in/out trays + a pneumatic tube up to the ceiling ("GUS MAIL")
    add(g, bx(0.8, 0.95, 4.2), wood, 14.95, 0.475, 39.3); add(g, bx(0.9, 0.07, 4.3), woodLt, 14.95, 0.985, 39.3); add(g, bx(0.92, 0.03, 4.32), K.gold(), 14.95, 0.94, 39.3);
    var pq = K.plaqueTex(512, 110, 'SORTING DESK', 'Barnaby \u00b7 Assistant Archivist (unpaid, happy)', '#7df9a0', '#123020'); var pm = K.planeM(1.4, 0.3, pq.tex, g, 14.545, 0.6, 39.3); pm.rotation.y = -Math.PI / 2;
    add(g, bx(0.32, 0.04, 2.6), ph('#1f2937', 40), 14.95, 1.04, 39.3); for (var rl = 0; rl < 2; rl++) { var rlr = add(g, cy(0.03, 0.03, 0.34, 10), K.chrome(), 14.95, 1.05, 38.0 + rl * 2.6); rlr.rotation.z = Math.PI / 2; }
    var belt = []; for (var i = 0; i < 5; i++) { var bf = add(g, bx(0.26, 0.03, 0.2), ph(pal[i % pal.length], 20), 14.95, 1.075, 38.1 + i * 0.5); belt.push(bf); }
    [[14.9, 37.45, '#9ca3af'], [14.9, 41.15, '#c9993a']].forEach(function (q2) { add(g, bx(0.4, 0.08, 0.36), ph(q2[2], 60), q2[0], 1.06, q2[1]); for (var k2 = 0; k2 < 5; k2++) add(g, bx(0.34, 0.01, 0.3), ph('#fffaf0', 10), q2[0], 1.11 + k2 * 0.012, q2[1]); });
    var tube = add(g, new T.CylinderGeometry(0.09, 0.09, 3.6, 16, 1, true), new T.MeshPhongMaterial({ color: '#bfe9ff', transparent: true, opacity: 0.35, shininess: 140, side: T.DoubleSide, depthWrite: false }), 15.25, 2.8, 41.25); void tube;
    add(g, cy(0.12, 0.12, 0.12, 16), K.brass(), 15.25, 1.07, 41.25); add(g, cy(0.12, 0.12, 0.12, 16), K.brass(), 15.25, 4.55, 41.25);
    var cap = add(g, cy(0.07, 0.07, 0.2, 12), ph('#e8b85a', 30), 15.25, 1.4, 41.25);
    var gm2 = K.cvs(256, 64, function (c3, w, h) { c3.fillStyle = '#7f1d1d'; c3.fillRect(0, 0, w, h); c3.fillStyle = '#ffe14d'; c3.font = 'bold 34px "Trebuchet MS",sans-serif'; c3.textAlign = 'center'; c3.textBaseline = 'middle'; c3.fillText('GUS MAIL \u2191', w / 2, h / 2); });
    var gml = K.planeM(0.5, 0.125, gm2.tex, g, 15.13, 1.9, 41.25); gml.rotation.y = -Math.PI / 2;
    // desk clutter: a cheerful mug, a cactus, family photo of Gus as a baby (frowning), a bell, rubber stamps
    add(g, cy(0.05, 0.045, 0.11, 14), ph('#4ade80', 60), 14.75, 1.08, 40.5); add(g, cy(0.05, 0.06, 0.08, 12), ph('#b45309', 30), 14.75, 1.06, 37.9); add(g, cy(0.035, 0.035, 0.14, 10), ph('#16a34a', 20), 14.75, 1.17, 37.9);
    var ph2 = K.cvs(128, 100, function (c4, w, h) { c4.fillStyle = '#fef3c7'; c4.fillRect(0, 0, w, h); c4.fillStyle = '#f1c7a5'; c4.beginPath(); c4.arc(w / 2, 52, 30, 0, 7); c4.fill(); c4.strokeStyle = '#6b2a2a'; c4.lineWidth = 3; c4.beginPath(); c4.arc(w / 2, 74, 10, Math.PI * 1.15, Math.PI * 1.85); c4.stroke(); c4.fillStyle = '#111'; c4.fillRect(w / 2 - 14, 44, 6, 6); c4.fillRect(w / 2 + 8, 44, 6, 6); c4.fillStyle = '#3a2216'; c4.font = 'bold 11px sans-serif'; c4.textAlign = 'center'; c4.fillText('baby Gus, 1 day old', w / 2, 96); });
    var fr = new T.Group(); fr.position.set(14.72, 1.13, 40.05); fr.rotation.y = -Math.PI / 2 + 0.3; g.add(fr); add(fr, bx(0.22, 0.18, 0.02), K.gold(), 0, 0, 0); var pp = K.planeM(0.19, 0.15, ph2.tex, fr, 0, 0, 0.012); void pp;
    // Barnaby behind the desk
    var bg = new T.Group(); bg.position.set(16.3, 0, 39.3); bg.rotation.y = -Math.PI / 2; g.add(bg); buildBarnaby(bg);
    reg(name, g); solid(14.5, xw, 36.95, 41.65, name);
    cab({ id: 'h2_uncle', kind: 'h2_uncle', name: 'Uncle Barnaby', color: '#7df9a0', x: 13.65, z: 39.3, dir: [-1, 0], r: 1.25, group: g, glow: glowFloor(g, '#7df9a0', 1.6, 2.4, 13.75, 39.3) });
    SORT = { belt: belt, cap: cap, world: new T.Vector3(16.3, 0, 39.3) };
  }

  /* ---------- 9. Stamp-O-Matic 5000 (quiz kiosk) ---------- */
  var STAMP = {};
  function stampKiosk() {
    var name = 'Stamp-O-Matic 5000', g = root(name), x = 17.0, z = 44.3; g.position.set(x, 0, z); g.rotation.y = -Math.PI / 2; // faces west
    var body = ph('#b91c1c', 70, '#2a0505'), trim = K.chrome(), yel = '#ffe14d';
    add(g, bx(1.7, 0.2, 0.9), ph('#3a0d0d', 50), 0, 0.1, 0); add(g, bx(1.72, 0.04, 0.92), glow(yel), 0, 0.21, 0);
    add(g, bx(1.4, 1.7, 0.7), body, 0, 1.05, -0.05); [-1, 1].forEach(function (sd) { add(g, cy(0.12, 0.12, 1.7, 16), trim, sd * 0.72, 1.05, 0.28); });
    add(g, bx(1.1, 0.7, 0.05), ph('#111111', 40), 0, 1.35, 0.31);
    var scr = K.cvs(256, 160, function () {}); scr.tex.minFilter = T.LinearFilter; scr.tex.generateMipmaps = false; K.planeM(1.0, 0.62, scr.tex, g, 0, 1.35, 0.34);
    var mq = K.cvs(512, 128, function (c, w, h) { c.fillStyle = '#3a0505'; c.fillRect(0, 0, w, h); A.neonText(c, 'STAMP-O-MATIC 5000', w / 2, h * 0.4, 50, yel, w - 30); c.font = 'bold 22px "Trebuchet MS",sans-serif'; c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.fillText('GROK GAMES QUIZ \u00b7 WIN TICKETS', w / 2, h * 0.82); });
    K.planeM(1.4, 0.36, mq.tex, g, 0, 2.15, 0.31);
    // the big stamp arm on top
    var arm = new T.Group(); arm.position.set(0, 2.4, 0.05); g.add(arm); add(g, cy(0.1, 0.12, 0.3, 14), trim, 0, 2.5, -0.1);
    add(arm, bx(0.1, 0.1, 0.7), trim, 0, 0.12, 0.25); var head = new T.Group(); head.position.set(0, 0.12, 0.6); arm.add(head); add(head, cy(0.05, 0.05, 0.3, 12), ph('#5b3a1e', 30), 0, 0.05, 0); add(head, bx(0.34, 0.08, 0.24), ph('#d61f45', 30), 0, -0.13, 0);
    var stampTx = K.cvs(256, 128, function (c, w, h) { c.fillStyle = '#fff3c4'; c.fillRect(0, 0, w, h); c.strokeStyle = '#d61f45'; c.lineWidth = 8; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = '#d61f45'; c.font = 'bold 44px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('APPROVED', w / 2, h / 2); });
    var pad = K.planeM(0.5, 0.25, stampTx.tex, g, 0, 0.93, 0.62); pad.rotation.x = -Math.PI / 2;
    add(g, bx(0.62, 0.06, 0.4), ph('#3b2f2f', 40), 0, 0.88, 0.55);
    [['#ff3d5a', -0.45], ['#ffe14d', -0.15], ['#4ade80', 0.15], ['#3ff0ff', 0.45]].forEach(function (b) { add(g, cy(0.06, 0.06, 0.05, 14), glow(b[0]), b[1], 0.86, 0.36); });
    reg(name, g); solid(x - 0.47, x + 0.9, z - 0.87, z + 0.87, name);
    cab({ id: 'h2_quiz', kind: 'h2_quiz', name: 'Stamp-O-Matic 5000', color: yel, x: 15.45, z: z, dir: [-1, 0], r: 1.05, group: g, glow: glowFloor(g, yel, 1.8, 1.2, 0, 1.4) });
    STAMP = { arm: arm, scr: scr, t: 0, hit: 0 };
    stampScreen(0);
  }
  function stampScreen(t) {
    var g = STAMP.scr.g, w = 256, h = 160; g.fillStyle = '#1a0505'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,225,77,0.07)'; for (var y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
    g.textAlign = 'center'; g.font = 'bold 22px monospace'; g.fillStyle = STAMP.hit > 0 ? (STAMP.ok ? '#5dff8a' : '#ff5d5d') : '#ffe14d';
    g.fillText(STAMP.hit > 0 ? (STAMP.ok ? 'APPROVED!' : 'DENIED!') : (Math.floor(t * 1.2) % 2 ? 'QUIZ TIME' : 'TAP TO PLAY'), w / 2, 46);
    g.font = 'bold 15px monospace'; g.fillStyle = '#ffffff'; g.fillText('5 questions about', w / 2, 86); g.fillText('Grok games = tickets', w / 2, 108);
    for (var i = 0; i < 5; i++) { g.fillStyle = (Math.floor(t * 3) + i) % 5 === 0 ? '#ffe14d' : '#5a2a2a'; g.fillRect(48 + i * 34, 130, 24, 14); }
    STAMP.scr.tex.needsUpdate = true;
  }
  H2.stamp = function (ok) { STAMP.hit = 0.9; STAMP.ok = !!ok; };

  /* ---------- 10. grandfather clocks + ferns ---------- */
  function clocksAndPlants() {
    [[2.7, 47.3], [17.3, 47.3]].forEach(function (q, i) {
      var name = 'Grandfather clock ' + i, g = root(name); g.position.set(q[0], 0, q[1]); g.rotation.y = Math.PI;
      var wd = ph('#4a2c1a', 50);
      add(g, bx(0.62, 0.3, 0.42), wd, 0, 0.15, 0); add(g, bx(0.5, 1.6, 0.36), wd, 0, 1.1, 0); add(g, bx(0.62, 0.7, 0.42), wd, 0, 2.25, 0); add(g, bx(0.66, 0.12, 0.46), K.gold(), 0, 2.66, 0);
      add(g, bx(0.32, 1.1, 0.02), new T.MeshPhongMaterial({ color: '#dff6ff', transparent: true, opacity: 0.25 }), 0, 1.15, 0.185);
      var face = add(g, cy(0.22, 0.22, 0.03, 28), ph('#fff8e1', 30), 0, 2.27, 0.21); face.rotation.x = Math.PI / 2; add(g, new T.TorusGeometry(0.22, 0.02, 6, 28), K.gold(), 0, 2.27, 0.225);
      var hh = add(g, bx(0.02, 0.12, 0.01), ph('#111827', 40), 0, 2.31, 0.235), mh = add(g, bx(0.015, 0.18, 0.01), ph('#111827', 40), 0, 2.33, 0.24);
      var pend = new T.Group(); pend.position.set(0, 1.62, 0.1); g.add(pend); add(pend, bx(0.015, 0.7, 0.01), K.brass(), 0, -0.35, 0); add(pend, cy(0.08, 0.08, 0.02, 18), K.gold(), 0, -0.72, 0).rotation.x = Math.PI / 2;
      reg(name, g); solid(q[0] - 0.33, q[0] + 0.33, q[1] - 0.23, q[1] + 0.23, name);
      CLOCKS.push({ hh: hh, mh: mh, pend: pend });
    });
    [[2.45, 36.3], [17.55, 36.3]].forEach(function (p, i) {
      var name = 'Annex fern ' + i, pg = root(name);
      add(pg, cy(0.3, 0.24, 0.55, 16), ph('#b45309', 30), p[0], 0.28, p[1]); add(pg, new T.TorusGeometry(0.3, 0.03, 6, 20), K.gold(), p[0], 0.55, p[1]).rotation.x = Math.PI / 2;
      for (var k = 0; k < 9; k++) { var lf = add(pg, sp(0.16, 10), ph(k % 2 ? '#2f9e44' : '#3fbf5a', 20), p[0] + Math.cos(k * 0.8) * 0.15, 0.8 + (k % 3) * 0.1, p[1] + Math.sin(k * 0.8) * 0.11); lf.scale.set(0.55, 1.6, 0.55); lf.rotation.set(Math.cos(k) * 0.5, 0, Math.sin(k) * 0.5); }
      reg(name, pg); solid(p[0] - 0.32, p[0] + 0.32, p[1] - 0.32, p[1] + 0.32, name);
    });
  }
  var CLOCKS = [];

  /* ---------- 11. lost files (daily scavenger hunt, 6 of 13 spots) ---------- */
  var SPOTS = [[8.0, 24.4], [16.6, 26.0], [4.0, 27.4], [15.0, 29.4], [5.4, 33.4], [10.0, 35.4], [12.2, 36.4], [3.6, 42.3], [7.0, 44.6], [12.6, 44.0], [17.0, 42.6], [15.0, 22.0], [11.9, 13.3]];
  H2.SPOTS = SPOTS;
  H2.huntPick = function () { var r = rng(hash('h2files:' + H2.dayKey())), ord = SPOTS.map(function (_, i) { return i; }); for (var i = ord.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = ord[i]; ord[i] = ord[j]; ord[j] = t; } return ord.slice(0, 6); };
  function filesBuild() {
    var folder = ph('#e8b85a', 20), paper = ph('#fffaf0', 10), red = ph('#b3123a', 30);
    SPOTS.forEach(function (s, i) {
      var g = new T.Group(); g.name = 'Lost file ' + i; g.position.set(s[0], 0, s[1]); A.scene.add(g); ROOTS.push(g); A.noAud(g);
      var f = new T.Group(); f.position.y = 0.32; f.rotation.set(-0.5, i * 0.7, 0.1); g.add(f);
      add(f, bx(0.34, 0.02, 0.26), folder, 0, 0, 0); add(f, bx(0.1, 0.02, 0.04), folder, -0.1, 0, -0.14); for (var k = 0; k < 3; k++) add(f, bx(0.3, 0.006, 0.22), paper, 0.01 * k, 0.014 + k * 0.006, 0.01 * k);
      add(f, bx(0.12, 0.004, 0.05), red, 0.08, 0.035, 0.06);
      var sk = new T.Sprite(new T.SpriteMaterial({ map: A.glowTex, color: '#ffe9a0', transparent: true, opacity: 0.6, depthWrite: false, blending: T.AdditiveBlending })); sk.scale.set(0.9, 0.9, 1); sk.position.y = 0.32; g.add(sk);
      var c = cab({ id: 'h2_file' + i, kind: 'h2_file', name: 'A lost file!', color: '#ffe9a0', x: s[0], z: s[1], dir: [0, 1], r: 0.9, group: g, data: { spot: i } });
      FILES.push({ i: i, g: g, f: f, cab: c });
    });
    H2.refreshFiles();
  }
  function hunt() { var h = GA.store.get('h2Hunt', null); if (!h || h.day !== H2.dayKey()) { h = { day: H2.dayKey(), found: [], paid: false }; GA.store.set('h2Hunt', h); } return h; }
  H2.hunt = function () { var h = hunt(), pick = H2.huntPick(); return { day: h.day, found: h.found.slice(), paid: h.paid, spots: pick, left: pick.filter(function (i) { return h.found.indexOf(i) < 0; }).length }; };
  H2.refreshFiles = function () { var h = hunt(), pick = H2.huntPick(); FILES.forEach(function (F) { var on = pick.indexOf(F.i) >= 0 && h.found.indexOf(F.i) < 0; F.g.visible = on; F.cab.disabled = !on; }); };
  H2.pickFile = function (i) { var h = hunt(), pick = H2.huntPick(); if (pick.indexOf(i) < 0 || h.found.indexOf(i) >= 0) return null; h.found.push(i); GA.store.set('h2Hunt', h); H2.refreshFiles(); return { found: h.found.length, total: pick.length }; };
  H2.payHunt = function () { var h = hunt(); if (h.paid || h.found.length < 6) return false; h.paid = true; GA.store.set('h2Hunt', h); return true; };

  /* ---------- sitting (camera + pose + Gus's complaint) ---------- */
  H2.sit = function (id) {
    var s = SEATS[id]; if (!s || !GA.Hub) return false;
    GA.Hub.setPlayer(s.x, s.z); GA.Hub.setFace(s.face); GA.Hub.setEmote('sit'); st.sit = s; st.sitT = 0;
    var dx = Math.sin(s.face), dz = Math.cos(s.face);
    var cam = s.cam || [s.x + dx * 2.5 + dz * 0.9, 1.75, s.z + dz * 2.5 - dx * 0.9, s.x, 0.95, s.z];
    GA.Hub.setCamOverride(function () { return cam; });
    if (GA.Prog) GA.Prog.event('h2Sit');
    return true;
  };
  H2.stand = function () { var s = st.sit; if (!s) return false; st.sit = null; GA.Hub.setCamOverride(null); if (GA.Hub.emote() === 'sit') GA.Hub.setEmote(null); GA.Hub.setPlayer(s.fx, s.fz); return true; };
  H2.renderNow = function () { var R = A && A.renderer(); if (R) R.render(A.scene, A.camera()); };
  H2.sitting = function () { return st.sit ? st.sit.id : null; };
  H2.inAnnex = function () { return st.inAnnex; };

  /* ---------- build + animation ---------- */
  H2.build = function (api, kit) {
    A = api; W = api.WING; K = kit; ROOTS = kit.ROOTS;
    colonnade(); niches(); rotunda(); benches(); cases(); nook(); lounge(); noLoiter(); photoBooth(); sortingStation(); stampKiosk(); clocksAndPlants(); filesBuild();
    H2.built = true;
    var lastScr = -1;
    A.anims.push(function (t) {
      var dt = st.lt ? Math.min(0.05, t - st.lt) : 0.016; st.lt = t;
      var p = A.pose(), inA = p.x > W.minX && p.x < W.maxX && p.z > 26.2 && p.z < W.maxZ; st.inAnnex = inA;
      // stood up by walking away: put the player at the seat's front and give the camera back
      if (st.sit && !H2.posing && GA.Hub.emote() !== 'sit') { var s0 = st.sit; st.sit = null; GA.Hub.setCamOverride(null); GA.Hub.setPlayer(s0.fx, s0.fz); if (H2.onStand) H2.onStand(s0); }
      if (st.sit) st.sitT += dt;
      if (!(p.z > A.ROOM.maxZ - 3 && p.x > W.minX - 3)) return; // nothing to animate unless you're in/near the Hall wing
      if (EOTW.tt) { EOTW.tt.rotation.y = t * 0.45; EOTW.em.position.y = 0.92 + Math.sin(t * 1.6) * 0.04; }
      FILES.forEach(function (F) { if (F.g.visible) { F.f.position.y = 0.32 + Math.sin(t * 2.4 + F.i) * 0.05; F.f.rotation.y = F.i * 0.7 + t * 0.8; } });
      CLOCKS.forEach(function (c) { c.pend.rotation.z = Math.sin(t * 2.2) * 0.25; var d = new Date(); c.hh.rotation.z = -((d.getHours() % 12) / 12) * Math.PI * 2; c.mh.rotation.z = -(d.getMinutes() / 60) * Math.PI * 2; });
      if (BOOTH.flashT > 0) { BOOTH.flashT -= dt; if (BOOTH.flashT <= 0) BOOTH.flash.visible = false; }
      if (SORT.belt) { SORT.belt.forEach(function (b, i) { b.position.z = 38.1 + ((i * 0.5 + t * 0.25) % 2.5); }); SORT.cap.position.y = 1.4 + ((t * 0.6) % 3.0); SORT.cap.visible = SORT.cap.position.y < 4.3; }
      if (STAMP.arm) { if (STAMP.hit > 0) STAMP.hit -= dt; var k = STAMP.hit > 0 ? Math.sin(Math.min(1, (0.9 - STAMP.hit) * 4) * Math.PI) : 0; STAMP.arm.rotation.x = 0.15 + k * 0.6; var kk = Math.floor(t * 8); if (kk !== lastScr) { lastScr = kk; stampScreen(t); } }
      if (BAR.root) { // Barnaby: bobs, sorts folders into the cubbies, turns to look at you, waves when he talks
        var B = BAR, sw = SORT.world, dx = p.x - sw.x, dz = p.z - sw.z, d = Math.hypot(dx, dz);
        B.body.position.y = Math.abs(Math.sin(t * 1.8)) * 0.02;
        var want = d < 8 ? Math.max(-1.0, Math.min(1.0, Math.atan2(dx, dz) + Math.PI / 2)) : Math.sin(t * 0.5) * 0.5;
        if (!isFinite(want)) want = 0; want = ((want + Math.PI) % (Math.PI * 2)) - Math.PI; want = Math.max(-1, Math.min(1, want));
        B.head.rotation.y += (want - B.head.rotation.y) * Math.min(1, dt * 4);
        var sortPh = (t * 0.5) % 1; B.aR.rotation.x = -0.5 - Math.sin(sortPh * Math.PI * 2) * 0.5; B.aR.rotation.z = -0.2; B.fold.visible = sortPh < 0.5;
        B.aL.rotation.x = UB.T > 0 ? -2.4 + Math.sin(t * 9) * 0.3 : -0.3; B.aL.rotation.z = UB.T > 0 ? 0.3 : 0.15;
        B.react = Math.max(0, B.react - dt * 1.5); B.head.position.y = 1.6 + B.react * Math.abs(Math.sin(t * 10)) * 0.04;
        if (UB.T > 0) { UB.T -= dt; UB.s.material.opacity = Math.min(1, UB.T * 2); if (UB.T <= 0) UB.s.visible = false; }
      }
      if (H2.onFrame) H2.onFrame(t, dt, inA, p);
    });
  };
})();
