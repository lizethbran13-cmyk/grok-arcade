/* Grok Arcade - Mysterious Attic rare prizes (3D models + 2D icons). Only found in the attic quest (not at the Prize Counter):
   Boo-ford Plush, Haunted Music Box, Golden Fuse keychain, Brass Telescope, Spooky Lantern. Also registers the carryable ladder model. */
(function () {
  'use strict';
  var T = THREE, mats = {};
  function ph(c, s, e) { var k = c + (s || 30) + (e || ''); return mats[k] || (mats[k] = new T.MeshPhongMaterial({ color: c, shininess: s || 30, emissive: e ? new T.Color(e) : new T.Color(0) })); }
  function gl(c, o) { var k = 'g' + c + (o || 1); return mats[k] || (mats[k] = new T.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o || 1 })); }
  function add(p, g, m, x, y, z) { var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); p.add(o); return o; }
  var BX = function (w, h, d) { return new T.BoxGeometry(w, h, d); }, SP = function (r, s) { return new T.SphereGeometry(r, s || 20, Math.round((s || 20) * 0.7)); }, CY = function (a, b, h, s) { return new T.CylinderGeometry(a, b, h, s || 20); }, TO = function (r, t, s, a) { return new T.TorusGeometry(r, t, 10, s || 28, a || Math.PI * 2); };
  // the friendly ghost (Boo-ford), shared by the plush and the attic NPCs
  function ghostBody(col) {
    var g = new T.Group(), m = new T.MeshPhongMaterial({ color: col || '#f4f7ff', shininess: 40, emissive: '#1a2240', transparent: true, opacity: 0.93 });
    var pts = []; for (var i = 0; i <= 14; i++) { var a = i / 14 * Math.PI * 0.5; pts.push(new T.Vector2(Math.sin(a) * 0.3 + (i > 12 ? 0.02 : 0), 0.32 + Math.cos(a) * 0.3)); }
    pts.unshift(new T.Vector2(0.34, 0)); pts.unshift(new T.Vector2(0.3, -0.06));
    var body = new T.Mesh(new T.LatheGeometry(pts.reverse(), 28), m); g.add(body);
    for (var k = 0; k < 7; k++) { var a2 = k / 7 * Math.PI * 2; add(g, SP(0.075, 12), m, Math.cos(a2) * 0.28, -0.03, Math.sin(a2) * 0.28); }
    [-1, 1].forEach(function (sd) { add(g, SP(0.05, 12), ph('#1b1530', 80), sd * 0.1, 0.42, 0.26).scale.set(0.8, 1.2, 0.5); add(g, SP(0.04, 10), ph('#ff9eb4', 10), sd * 0.18, 0.33, 0.24).scale.set(1, 0.6, 0.4); });
    var mo = add(g, TO(0.05, 0.014, 14, Math.PI), ph('#1b1530', 40), 0, 0.33, 0.28); mo.rotation.z = Math.PI;
    [-1, 1].forEach(function (sd) { var a = add(g, SP(0.08, 12), m, sd * 0.33, 0.3, 0.02); a.scale.set(1.3, 0.7, 0.7); });
    g.userData.mat = m; return g;
  }
  GA.AtticGhost = ghostBody;
  function booPlush() { var g = new T.Group(), b = ghostBody('#eef2ff'); b.position.y = 0.06; g.add(b);
    add(g, BX(0.18, 0.04, 0.02), ph('#1b1530', 40), 0, 0.53, 0.27); var hat = add(g, CY(0.12, 0.13, 0.16, 20), ph('#1b1530', 50), 0, 0.72, 0); add(g, CY(0.2, 0.2, 0.02, 24), ph('#1b1530', 50), 0, 0.64, 0); void hat; // tiny butler top hat + bow tie
    g.userData.tick = function (t) { b.position.y = 0.06 + Math.sin(t * 2) * 0.03; b.rotation.y = Math.sin(t * 0.7) * 0.4; }; return g; }
  function musicBox() { var g = new T.Group(), wood = ph('#7a3e1d', 40), gold = ph('#e8b84a', 90, '#3a2400');
    add(g, BX(0.56, 0.26, 0.4), wood, 0, 0.13, 0); add(g, BX(0.6, 0.03, 0.44), gold, 0, 0.27, 0); var lid = new T.Group(); lid.position.set(0, 0.28, -0.2); g.add(lid); add(lid, BX(0.56, 0.06, 0.4), wood, 0, 0.03, 0.2); lid.rotation.x = -1.1;
    var crank = add(g, CY(0.015, 0.015, 0.14, 8), gold, 0.33, 0.14, 0); crank.rotation.z = Math.PI / 2;
    var bal = new T.Group(); bal.position.set(0, 0.3, 0.02); g.add(bal); add(bal, CY(0.06, 0.08, 0.03, 16), gold, 0, 0, 0); var dancer = add(bal, CY(0.015, 0.09, 0.16, 12), ph('#f9a8d4', 30), 0, 0.1, 0); add(bal, SP(0.03, 10), ph('#f1c7a5', 20), 0, 0.2, 0); void dancer;
    var notes = []; for (var i = 0; i < 3; i++) notes.push(add(g, SP(0.025, 8), gl('#ffe14d'), 0, 0.4, 0));
    g.userData.tick = function (t) { bal.rotation.y = t * 2; crank.rotation.x = t * 3; notes.forEach(function (n, k) { var p = (t * 0.5 + k / 3) % 1; n.position.set(Math.sin(p * 6 + k) * 0.15, 0.35 + p * 0.4, 0); n.scale.setScalar(1 - p); }); }; return g; }
  function goldenFuse() { var g = new T.Group(), gold = ph('#ffcf3a', 110, '#4a3000'), glass = new T.MeshPhongMaterial({ color: '#fff7c2', transparent: true, opacity: 0.45, shininess: 140 });
    var f = new T.Group(); f.position.y = 0.32; f.rotation.z = Math.PI / 2; g.add(f);
    add(f, CY(0.07, 0.07, 0.36, 20), glass, 0, 0, 0); [-1, 1].forEach(function (sd) { add(f, CY(0.08, 0.08, 0.08, 20), gold, 0, sd * 0.2, 0); add(f, CY(0.03, 0.03, 0.06, 10), gold, 0, sd * 0.27, 0); });
    var wire = add(f, CY(0.008, 0.008, 0.34, 6), gl('#ffb020'), 0, 0, 0); void wire; var ring = add(g, TO(0.07, 0.015, 20), gold, -0.27, 0.32, 0); ring.rotation.y = Math.PI / 2;
    var sp = add(g, SP(0.03, 8), gl('#fffbe0'), 0, 0.32, 0);
    g.userData.tick = function (t) { f.rotation.x = Math.sin(t) * 0.3; sp.scale.setScalar(0.6 + Math.abs(Math.sin(t * 5)) * 0.8); }; return g; }
  function telescope() { var g = new T.Group(), brass = ph('#c9a227', 100, '#2a1e00'), wood = ph('#5b3a1e', 30);
    [0, 2.1, 4.2].forEach(function (a) { var l = add(g, CY(0.015, 0.02, 0.5, 8), wood, Math.sin(a) * 0.12, 0.24, Math.cos(a) * 0.12); l.rotation.set(Math.cos(a) * 0.35, 0, -Math.sin(a) * 0.35); });
    var tube = new T.Group(); tube.position.y = 0.5; g.add(tube); tube.rotation.z = 0.5;
    add(tube, CY(0.05, 0.065, 0.46, 20), brass, 0, 0.05, 0); add(tube, CY(0.035, 0.04, 0.2, 16), brass, 0, -0.26, 0); add(tube, TO(0.068, 0.012, 24), brass, 0, 0.28, 0).rotation.x = Math.PI / 2;
    add(tube, CY(0.062, 0.062, 0.01, 20), new T.MeshPhongMaterial({ color: '#9fd8ff', shininess: 150, emissive: '#123a66' }), 0, 0.285, 0);
    g.userData.tick = function (t) { tube.rotation.y = Math.sin(t * 0.4) * 0.6; }; return g; }
  function lantern() { var g = new T.Group(), iron = ph('#2d2a3a', 70);
    add(g, CY(0.16, 0.18, 0.05, 6), iron, 0, 0.025, 0); add(g, CY(0.17, 0.12, 0.06, 6), iron, 0, 0.5, 0); add(g, new T.ConeGeometry(0.12, 0.12, 6), iron, 0, 0.59, 0);
    var ring = add(g, TO(0.06, 0.012, 20), iron, 0, 0.7, 0); void ring;
    for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; add(g, BX(0.015, 0.42, 0.015), iron, Math.cos(a) * 0.15, 0.26, Math.sin(a) * 0.15); }
    add(g, CY(0.145, 0.145, 0.42, 6, 1, true), new T.MeshPhongMaterial({ color: '#b8ffd8', transparent: true, opacity: 0.3, shininess: 120 }), 0, 0.26, 0);
    var gh = ghostBody('#b8ffd8'); gh.scale.setScalar(0.32); gh.position.y = 0.14; g.add(gh);
    var fl = add(g, SP(0.04, 10), gl('#7dffb0'), 0, 0.2, 0);
    g.userData.tick = function (t) { gh.position.y = 0.14 + Math.sin(t * 2.4) * 0.03; gh.rotation.y = t; fl.scale.setScalar(0.8 + Math.sin(t * 9) * 0.2); }; return g; }
  function ladder() { var g = new T.Group(), wood = ph('#c08a4a', 25); [-1, 1].forEach(function (sd) { add(g, BX(0.06, 1.6, 0.06), wood, sd * 0.2, 0.8, 0); }); for (var i = 0; i < 6; i++) add(g, CY(0.022, 0.022, 0.4, 8), wood, 0, 0.15 + i * 0.26, 0).rotation.z = Math.PI / 2;
    add(g, BX(0.5, 0.06, 0.08), ph('#facc15', 30), 0, 1.6, 0); return g; }
  GA.AtticLadderModel = ladder;
  if (GA.Prize3D) { GA.Prize3D.register('pl_booford', booPlush); GA.Prize3D.register('haunted_box', musicBox); GA.Prize3D.register('golden_fuse', goldenFuse); GA.Prize3D.register('brass_scope', telescope); GA.Prize3D.register('spooky_lantern', lantern); GA.Prize3D.register('attic_ladder', ladder); }
  // ---------- 2D icons ----------
  function sh(g, x, y, rx) { var gr = g.createRadialGradient(x, y, 1, x, y, rx); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, rx * 0.3, 0, 0, 7); g.fill(); }
  function ghost2d(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, Math.PI, 0); for (var i = 0; i <= 4; i++) g.lineTo(x + r - i * r / 2, y + r * (i % 2 ? 0.7 : 0.95)); g.closePath(); g.fill(); g.fillStyle = '#1b1530'; g.beginPath(); g.ellipse(x - r * 0.35, y - r * 0.1, r * 0.13, r * 0.2, 0, 0, 7); g.ellipse(x + r * 0.35, y - r * 0.1, r * 0.13, r * 0.2, 0, 0, 7); g.fill(); g.beginPath(); g.arc(x, y + r * 0.2, r * 0.15, 0, Math.PI); g.fill(); }
  var ART = {
    pl_booford: function (g) { sh(g, 50, 90, 30); ghost2d(g, 50, 52, 30, '#eef2ff'); g.fillStyle = '#1b1530'; g.fillRect(38, 14, 24, 10); g.fillRect(32, 22, 36, 4); g.fillRect(44, 66, 12, 4); },
    haunted_box: function (g) { sh(g, 50, 90, 32); g.fillStyle = '#7a3e1d'; g.fillRect(22, 56, 56, 30); g.fillStyle = '#e8b84a'; g.fillRect(20, 52, 60, 5); g.fillStyle = '#7a3e1d'; g.save(); g.translate(22, 52); g.rotate(-0.9); g.fillRect(0, -6, 56, 6); g.restore(); g.fillStyle = '#f9a8d4'; g.beginPath(); g.moveTo(50, 30); g.lineTo(44, 50); g.lineTo(56, 50); g.fill(); g.fillStyle = '#ffe14d'; g.font = 'bold 18px sans-serif'; g.fillText('\u266A', 66, 30); g.fillText('\u266B', 28, 36); },
    golden_fuse: function (g) { sh(g, 50, 88, 30); g.fillStyle = 'rgba(255,247,194,.6)'; g.fillRect(28, 42, 44, 18); g.fillStyle = '#ffcf3a'; g.fillRect(18, 40, 12, 22); g.fillRect(70, 40, 12, 22); g.strokeStyle = '#ffb020'; g.lineWidth = 2; g.beginPath(); g.moveTo(30, 51); for (var i = 0; i < 8; i++) g.lineTo(32 + i * 5, 47 + (i % 2) * 8); g.lineTo(70, 51); g.stroke(); g.strokeStyle = '#ffcf3a'; g.lineWidth = 4; g.beginPath(); g.arc(12, 51, 6, 0, 7); g.stroke(); },
    brass_scope: function (g) { sh(g, 50, 92, 28); g.strokeStyle = '#5b3a1e'; g.lineWidth = 4; g.beginPath(); g.moveTo(50, 56); g.lineTo(34, 90); g.moveTo(50, 56); g.lineTo(66, 90); g.moveTo(50, 56); g.lineTo(50, 92); g.stroke(); g.save(); g.translate(50, 50); g.rotate(-0.5); g.fillStyle = '#c9a227'; g.fillRect(-30, -8, 56, 16); g.fillRect(26, -10, 6, 20); g.fillStyle = '#9fd8ff'; g.fillRect(30, -7, 3, 14); g.restore(); },
    spooky_lantern: function (g) { sh(g, 50, 92, 24); g.fillStyle = '#2d2a3a'; g.fillRect(32, 84, 36, 6); g.fillRect(30, 26, 40, 8); g.beginPath(); g.moveTo(36, 26); g.lineTo(50, 12); g.lineTo(64, 26); g.fill(); g.fillStyle = 'rgba(184,255,216,.45)'; g.fillRect(34, 34, 32, 50); ghost2d(g, 50, 56, 11, '#b8ffd8'); g.strokeStyle = '#2d2a3a'; g.lineWidth = 3; g.strokeRect(34, 34, 32, 50); }
  };
  if (GA.PrizeArt) Object.keys(ART).forEach(function (k) { GA.PrizeArt.register(k, ART[k]); });
  if (GA.PRIZE_CATS && !GA.PRIZE_CATS.some(function (c) { return c.id === 'attic'; })) GA.PRIZE_CATS.push({ id: 'attic', name: 'Attic Rares', icon: '\uD83D\uDC7B' });
  [{ id: 'pl_booford', name: 'Boo-ford Plush', desc: 'RARE! The attic\u2019s butler ghost, now extra squishy. Found by collecting every spirit marble in the attic.' },
   { id: 'haunted_box', name: 'Haunted Music Box', desc: 'RARE! It plays the attic lullaby all by itself. Found in the Cobweb Library.' },
   { id: 'golden_fuse', name: 'Golden Fuse Keychain', desc: 'RARE! A spare golden fuse from Larry\u2019s maintenance room. Thanks for sorting the rack!' },
   { id: 'brass_scope', name: 'Brass Telescope', desc: 'RARE! The Foggy Observatory\u2019s little brass telescope. It points at ghost constellations.' },
   { id: 'spooky_lantern', name: 'Spooky Lantern', desc: 'RARE! A tiny friendly ghost lives in this lantern. Earned in the attic\u2019s weekly puzzle room.' }
  ].forEach(function (p) { if (!GA.findPrize || !GA.findPrize(p.id)) GA.PRIZES.push({ id: p.id, cat: 'attic', vault: true, attic: true, name: p.name, price: 0, desc: p.desc }); });
})();
