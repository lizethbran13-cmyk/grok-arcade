/* Grok Arcade - Time Machine rare prizes (3D models + 2D icons). Only earned through the Retro Arcade / Time Machine quest:
   Lily Plush, Tele Juice Bottle, Chrono-Booth Mk.0 Replica, Dale's Lucky Wrench, Golden 1983 Token. */
(function () {
  'use strict';
  var T = THREE, mats = {};
  function ph(c, s, e) { var k = c + (s || 30) + (e || ''); return mats[k] || (mats[k] = new T.MeshPhongMaterial({ color: c, shininess: s || 30, emissive: e ? new T.Color(e) : new T.Color(0) })); }
  function gl(c) { var k = 'g' + c; return mats[k] || (mats[k] = new T.MeshBasicMaterial({ color: c })); }
  function add(p, g, m, x, y, z) { var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); p.add(o); return o; }
  var BX = function (w, h, d) { return new T.BoxGeometry(w, h, d); }, SP = function (r, s) { return new T.SphereGeometry(r, s || 20, Math.round((s || 20) * 0.7)); }, CY = function (a, b, h, s) { return new T.CylinderGeometry(a, b, h, s || 20); }, TO = function (r, t, s, a) { return new T.TorusGeometry(r, t, 10, s || 24, a || Math.PI * 2); };
  function lilyPlush() { var g = new T.Group(), lav = ph('#c4b5fd', 20), coat = ph('#f8fafc', 10);
    add(g, SP(0.14, 18), lav, 0, 0.2, 0).scale.set(1, 1.1, 0.85); var ct = add(g, CY(0.13, 0.17, 0.2, 18, 1), coat, 0, 0.16, 0); void ct;
    [-1, 1].forEach(function (sd) { add(g, SP(0.05, 10), lav, sd * 0.07, 0.03, 0.02); add(g, SP(0.045, 10), coat, sd * 0.16, 0.2, 0); });
    var hd = add(g, BX(0.3, 0.22, 0.2), lav, 0, 0.44, 0); void hd; add(g, BX(0.26, 0.18, 0.02), ph('#2e1065', 40), 0, 0.44, 0.1);
    [-1, 1].forEach(function (sd) { add(g, BX(0.07, 0.015, 0.01), gl('#ddd6fe'), sd * 0.06, 0.45, 0.112); add(g, CY(0.035, 0.035, 0.03, 12), ph('#e5e7eb', 80), sd * 0.16, 0.44, 0).rotation.z = Math.PI / 2; });
    add(g, BX(0.06, 0.012, 0.01), gl('#ddd6fe'), 0.005, 0.4, 0.112); add(g, CY(0.006, 0.006, 0.12, 6), ph('#9ca3af', 60), 0.05, 0.6, 0); var ck = add(g, CY(0.035, 0.035, 0.015, 16), ph('#fef3c7', 40), 0.07, 0.67, 0); ck.rotation.x = Math.PI / 2; return g; }
  function teleJuice() { var g = new T.Group(), glass = new T.MeshPhongMaterial({ color: '#86efac', emissive: '#166534', transparent: true, opacity: 0.8, shininess: 140 });
    var pts = []; [[0, 0], [0.11, 0], [0.12, 0.02], [0.12, 0.2], [0.07, 0.28], [0.04, 0.32], [0.04, 0.38], [0, 0.38]].forEach(function (q) { pts.push(new T.Vector2(q[0], q[1])); }); add(g, new T.LatheGeometry(pts, 24), glass, 0, 0, 0);
    add(g, CY(0.048, 0.048, 0.06, 14), ph('#dc2626', 50), 0, 0.4, 0); var bub = []; for (var i = 0; i < 5; i++) bub.push(add(g, SP(0.018, 8), gl('#dcfce7'), (Math.random() - 0.5) * 0.12, 0.05 + i * 0.04, (Math.random() - 0.5) * 0.1));
    var lb = add(g, CY(0.122, 0.122, 0.08, 24, 1, true), ph('#052e16', 30), 0, 0.12, 0); void lb; g.userData.tick = function (t) { bub.forEach(function (b, i) { b.position.y = 0.04 + ((t * 0.12 + i * 0.04) % 0.2); }); }; return g; }
  function chronoBooth() { var g = new T.Group(), wd = ph('#7a4a28', 25), br = ph('#d4a23a', 90, '#3a2400');
    add(g, BX(0.36, 0.04, 0.34), br, 0, 0.02, 0); [-0.16, 0.16].forEach(function (x) { add(g, BX(0.04, 0.56, 0.32), wd, x, 0.32, 0); }); add(g, BX(0.36, 0.56, 0.03), wd, 0, 0.32, -0.15); add(g, BX(0.4, 0.06, 0.36), wd, 0, 0.63, 0);
    add(g, BX(0.28, 0.44, 0.01), new T.MeshPhongMaterial({ color: '#bfe9ff', transparent: true, opacity: 0.3 }), 0, 0.32, 0.16); add(g, CY(0.03, 0.04, 0.1, 12), ph('#b87333', 80), 0, 0.71, 0); var orb = add(g, SP(0.035, 10), gl('#a5f3fc'), 0, 0.78, 0);
    for (var i = 0; i < 3; i++) add(g, CY(0.015, 0.015, 0.06, 8), new T.MeshPhongMaterial({ color: '#fde68a', emissive: '#7c2d12' }), -0.1 + i * 0.1, 0.69, 0.1); g.userData.tick = function (t) { orb.scale.setScalar(0.7 + Math.abs(Math.sin(t * 13)) * 0.6); }; return g; }
  function daleWrench() { var g = new T.Group(), steel = ph('#cbd5e1', 110, '#1e293b'); var h = add(g, BX(0.06, 0.42, 0.03), steel, 0, 0.26, 0); void h; var hd = add(g, TO(0.07, 0.03, 18, Math.PI * 1.5), steel, 0, 0.52, 0); hd.rotation.z = Math.PI * 0.75; add(g, BX(0.065, 0.16, 0.034), ph('#dc2626', 40), 0, 0.12, 0);
    var tag = add(g, CY(0.05, 0.05, 0.01, 16), ph('#facc15', 50), 0.07, 0.06, 0); tag.rotation.x = Math.PI / 2; g.rotation.z = 0.25; return g; }
  function token83() { var g = new T.Group(), gold = ph('#ffcf3a', 120, '#5a3a00'); var c = add(g, CY(0.16, 0.16, 0.035, 36), gold, 0, 0.2, 0); c.rotation.x = Math.PI / 2; var rim = add(g, TO(0.16, 0.012, 36), gold, 0, 0.2, 0); void rim; var star = add(g, CY(0.06, 0.06, 0.04, 5), ph('#f59e0b', 90), 0, 0.2, 0.0); star.rotation.x = Math.PI / 2;
    add(g, CY(0.08, 0.1, 0.03, 20), ph('#5b3a1e', 20), 0, 0.015, 0); add(g, CY(0.01, 0.01, 0.06, 8), gold, 0, 0.05, 0); g.userData.tick = function (t) { c.rotation.z = t; star.rotation.y = t; }; return g; }
  if (GA.Prize3D) { GA.Prize3D.register('pl_lily', lilyPlush); GA.Prize3D.register('tele_juice', teleJuice); GA.Prize3D.register('chrono_booth', chronoBooth); GA.Prize3D.register('dale_wrench', daleWrench); GA.Prize3D.register('token_83', token83); }
  function sh(g, x, y, rx) { var gr = g.createRadialGradient(x, y, 1, x, y, rx); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, rx * 0.3, 0, 0, 7); g.fill(); }
  var ART = {
    pl_lily: function (g) { sh(g, 50, 92, 28); g.fillStyle = '#f8fafc'; g.beginPath(); g.moveTo(34, 88); g.lineTo(40, 56); g.lineTo(60, 56); g.lineTo(66, 88); g.fill(); g.fillStyle = '#c4b5fd'; g.fillRect(28, 20, 44, 34); g.fillStyle = '#2e1065'; g.fillRect(32, 24, 36, 26); g.strokeStyle = '#ddd6fe'; g.lineWidth = 3; g.beginPath(); g.moveTo(36, 36); g.lineTo(46, 36); g.moveTo(54, 36); g.lineTo(64, 36); g.moveTo(46, 44); g.lineTo(54, 43); g.stroke(); g.fillStyle = '#fef3c7'; g.beginPath(); g.arc(62, 12, 6, 0, 7); g.fill(); },
    tele_juice: function (g) { sh(g, 50, 92, 24); g.fillStyle = '#4ade80'; g.beginPath(); g.moveTo(34, 88); g.lineTo(34, 50); g.lineTo(44, 36); g.lineTo(44, 24); g.lineTo(56, 24); g.lineTo(56, 36); g.lineTo(66, 50); g.lineTo(66, 88); g.fill(); g.fillStyle = '#dc2626'; g.fillRect(43, 16, 14, 9); g.fillStyle = '#052e16'; g.fillRect(34, 60, 32, 14); g.fillStyle = '#bbf7d0'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillText('TELE', 50, 70); },
    chrono_booth: function (g) { sh(g, 50, 92, 28); g.fillStyle = '#7a4a28'; g.fillRect(28, 26, 44, 62); g.fillStyle = 'rgba(191,233,255,.6)'; g.fillRect(34, 32, 32, 50); g.fillStyle = '#d4a23a'; g.fillRect(26, 86, 48, 5); g.fillRect(24, 20, 52, 7); g.fillStyle = '#a5f3fc'; g.beginPath(); g.arc(50, 12, 6, 0, 7); g.fill(); },
    dale_wrench: function (g) { sh(g, 50, 90, 26); g.save(); g.translate(50, 54); g.rotate(0.6); g.fillStyle = '#cbd5e1'; g.fillRect(-5, -10, 10, 50); g.fillStyle = '#dc2626'; g.fillRect(-6, 20, 12, 20); g.beginPath(); g.arc(0, -18, 14, 0, 7); g.fill(); g.fillStyle = '#cbd5e1'; g.beginPath(); g.arc(0, -18, 12, 0, 7); g.fill(); g.fillStyle = '#1a0a33'; g.fillRect(-5, -32, 10, 14); g.restore(); },
    token_83: function (g) { sh(g, 50, 92, 26); g.fillStyle = '#ffcf3a'; g.beginPath(); g.arc(50, 50, 32, 0, 7); g.fill(); g.strokeStyle = '#b45309'; g.lineWidth = 4; g.stroke(); g.fillStyle = '#92400e'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('\u201983', 50, 52); }
  };
  if (GA.PrizeArt) Object.keys(ART).forEach(function (k) { GA.PrizeArt.register(k, ART[k]); });
  if (GA.PRIZE_CATS && !GA.PRIZE_CATS.some(function (c) { return c.id === 'time'; })) GA.PRIZE_CATS.push({ id: 'time', name: 'Time Rares', icon: '\u23F3' });
  [{ id: 'pl_lily', name: 'Lily Plush', desc: 'RARE! Lily the Bot, Mimi\u2019s sister, now huggable. Comes with a tiny clock. Earned on your first trip through time.' },
   { id: 'tele_juice', name: 'Tele Juice Bottle', desc: 'RARE! The green stuff that powers the Chrono-Gate. Do not drink (Dale). Earned by fixing the broken Chrono-Gate.' },
   { id: 'chrono_booth', name: 'Chrono-Booth Mk.0 Replica', desc: 'RARE! A tiny model of Lily\u2019s first time machine, crackling coil and all. Earned by fixing it in 1983 and riding it home.' },
   { id: 'dale_wrench', name: 'Dale\u2019s Lucky Wrench', desc: 'RARE! Dale\u2019s spare wrench (he has nine). It has never fixed anything. Earned when Dale visits the Time Lab.' },
   { id: 'token_83', name: 'Golden 1983 Token', desc: 'RARE! A shiny token from the OLD Grok Arcade. Earned by playing all 6 retro cabinets in 1983.' }
  ].forEach(function (p) { if (!GA.findPrize || !GA.findPrize(p.id)) GA.PRIZES.push({ id: p.id, cat: 'time', vault: true, attic: true, name: p.name, price: 0, desc: p.desc }); });
})();
