/* Grok Arcade - Ratita Preview Center rare prizes: the Lili Plush (finish Lili's QA checklist) and the Mini Time Jumper
   (score 30+ in Chrono Courier, bonus #32). */
(function () {
  'use strict';
  var T = THREE, mats = {};
  function ph(c, s, e) { var k = c + (s || 30) + (e || ''); return mats[k] || (mats[k] = new T.MeshPhongMaterial({ color: c, shininess: s || 30, emissive: e ? new T.Color(e) : new T.Color(0) })); }
  function gl(c) { return mats['g' + c] || (mats['g' + c] = new T.MeshBasicMaterial({ color: c })); }
  function add(p, g, m, x, y, z) { var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); p.add(o); return o; }
  var SP = function (r, s) { return new T.SphereGeometry(r, s || 20, Math.round((s || 20) * 0.7)); }, CY = function (a, b, h, s) { return new T.CylinderGeometry(a, b, h, s || 20); }, TO = function (r, t, s) { return new T.TorusGeometry(r, t, 10, s || 28); };
  function liliPlush() { var g = new T.Group(), mint = ph('#5eead4', 20), coral = ph('#fb7185', 20);
    add(g, CY(0.13, 0.15, 0.03, 24), ph('#0f172a', 20), 0, 0.015, 0); var body = add(g, SP(0.15, 22), mint, 0, 0.17, 0); body.scale.set(1, 1.05, 0.92); add(g, TO(0.15, 0.015, 28), coral, 0, 0.15, 0).rotation.x = Math.PI / 2;
    var hd = new T.Group(); hd.position.y = 0.38; g.add(hd); add(hd, SP(0.12, 22), mint, 0, 0, 0).scale.set(1.08, 0.92, 1); add(hd, CY(0.122, 0.122, 0.07, 24, 1, true), ph('#111827', 40), 0, 0.01, 0);
    [-1, 1].forEach(function (sd) { add(hd, new T.BoxGeometry(0.05, 0.03, 0.01), gl('#5eead4'), sd * 0.04, 0.01, 0.125); });
    [['#9ca3af', -0.07], ['#d6a26b', 0], ['#ffffff', 0.07]].forEach(function (q, i) { var e = add(hd, CY(0.032, 0.032, 0.012, 16), ph(q[0], 20), q[1] * 1.3, 0.15 + (i === 1 ? 0.02 : 0), 0); e.rotation.x = Math.PI / 2; });
    g.userData.tick = function (t) { g.children[1].position.y = 0.17 + Math.sin(t * 2.2) * 0.01; hd.rotation.y = Math.sin(t * 0.9) * 0.3; }; return g; }
  function miniJumper() { var g = new T.Group(), rings = [];
    add(g, CY(0.16, 0.18, 0.04, 28), ph('#334155', 60), 0, 0.02, 0); add(g, TO(0.165, 0.008, 32), gl('#2dd4bf'), 0, 0.04, 0).rotation.x = Math.PI / 2;
    add(g, CY(0.06, 0.06, 0.2, 18, 1, true), new T.MeshPhongMaterial({ color: '#ccfbf1', transparent: true, opacity: 0.3 }), 0, 0.15, 0); var core = add(g, new T.IcosahedronGeometry(0.035, 0), gl('#5eead4'), 0, 0.15, 0);
    [['#5eead4', 0.13], ['#fb7185', 0.11], ['#fbbf24', 0.09]].forEach(function (q, i) { var r = add(g, TO(q[1], 0.006, 32), ph(q[0], 90, q[0]), 0, 0.15, 0); r.rotation.x = i === 0 ? Math.PI / 2 : i * 0.7; rings.push(r); });
    g.userData.tick = function (t) { rings.forEach(function (r, i) { r.rotation.y = t * (1 + i * 0.6) * (i % 2 ? -1 : 1); }); core.rotation.y = t * 3; }; return g; }
  if (GA.Prize3D) { GA.Prize3D.register('pl_lili', liliPlush); GA.Prize3D.register('mini_jumper', miniJumper); }
  function sh(g, x, y, rx) { var gr = g.createRadialGradient(x, y, 1, x, y, rx); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, rx * 0.3, 0, 0, 7); g.fill(); }
  var ART = {
    pl_lili: function (g) { sh(g, 50, 92, 26); g.fillStyle = '#5eead4'; g.beginPath(); g.ellipse(50, 70, 22, 20, 0, 0, 7); g.fill(); g.strokeStyle = '#fb7185'; g.lineWidth = 3; g.beginPath(); g.ellipse(50, 68, 22, 4, 0, 0, 7); g.stroke(); g.beginPath(); g.arc(50, 38, 18, 0, 7); g.fill();
      g.fillStyle = '#111827'; g.fillRect(32, 34, 36, 9); g.fillStyle = '#5eead4'; g.fillRect(38, 36, 8, 5); g.fillRect(54, 36, 8, 5); [['#9ca3af', 38], ['#d6a26b', 50], ['#ffffff', 62]].forEach(function (q) { g.fillStyle = q[0]; g.beginPath(); g.arc(q[1], 18, 5, 0, 7); g.fill(); }); },
    mini_jumper: function (g) { sh(g, 50, 92, 30); g.fillStyle = '#334155'; g.fillRect(26, 80, 48, 8); g.fillStyle = 'rgba(204,251,241,.5)'; g.fillRect(42, 40, 16, 40); g.fillStyle = '#5eead4'; g.beginPath(); g.arc(50, 58, 6, 0, 7); g.fill();
      [['#5eead4', 26, 8], ['#fb7185', 8, 24], ['#fbbf24', 20, 14]].forEach(function (q) { g.strokeStyle = q[0]; g.lineWidth = 3; g.beginPath(); g.ellipse(50, 58, q[1], q[2], 0, 0, 7); g.stroke(); }); }
  };
  if (GA.PrizeArt) Object.keys(ART).forEach(function (k) { GA.PrizeArt.register(k, ART[k]); });
  if (GA.PRIZE_CATS && !GA.PRIZE_CATS.some(function (c) { return c.id === 'preview'; })) GA.PRIZE_CATS.push({ id: 'preview', name: 'Preview Rares', icon: '\uD83E\uDDEA' });
  [{ id: 'pl_lili', name: 'Lili Plush', desc: 'RARE! A squishy Lili with her three mouse-ear antennas. She still judges you, softly. Earned by finishing Lili\u2019s QA checklist in the Ratita Preview Center.' },
   { id: 'mini_jumper', name: 'Mini Time Jumper', desc: 'RARE! A desk-sized Time Jumper with spinning rings. It cannot time travel (Lili checked twice). Earned with 30+ in Chrono Courier.' }
  ].forEach(function (p) { if (!GA.findPrize || !GA.findPrize(p.id)) GA.PRIZES.push({ id: p.id, cat: 'preview', vault: true, preview: true, name: p.name, price: 0, desc: p.desc }); });
})();
