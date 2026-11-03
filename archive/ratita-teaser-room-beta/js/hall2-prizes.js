/* Grok Arcade - Records Annex rare prizes (booth #32), earned in the Hall of Game Records' new back room:
   Barnaby Bobblehead (return all 6 lost files) and the Golden Rubber Stamp (5/5 at the Stamp-O-Matic 5000). */
(function () {
  'use strict';
  var T = THREE, mats = {};
  function ph(c, s, e) { var k = c + (s || 30) + (e || ''); return mats[k] || (mats[k] = new T.MeshPhongMaterial({ color: c, shininess: s || 30, emissive: e ? new T.Color(e) : new T.Color(0) })); }
  function add(p, g, m, x, y, z) { var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); p.add(o); return o; }
  var BX = function (w, h, d) { return new T.BoxGeometry(w, h, d); }, SP = function (r, s) { return new T.SphereGeometry(r, s || 20, Math.round((s || 20) * 0.7)); }, CY = function (a, b, h, s) { return new T.CylinderGeometry(a, b, h, s || 20); }, TO = function (r, t, s, a) { return new T.TorusGeometry(r, t, 10, s || 24, a || Math.PI * 2); };
  function bobble() { var g = new T.Group(), skin = ph('#f3c9a8', 20), hair = ph('#f5f5f5', 10), card = ph('#3f8f5a', 20);
    add(g, CY(0.14, 0.16, 0.06, 24), ph('#c9993a', 90, '#2a1800'), 0, 0.03, 0); add(g, BX(0.16, 0.025, 0.01), ph('#2a1a10', 20), 0, 0.03, 0.155);
    add(g, CY(0.07, 0.08, 0.16, 16), card, 0, 0.14, 0); add(g, SP(0.025, 8), ph('#ffcf3a', 60), 0, 0.21, 0.06);
    var spring = add(g, CY(0.012, 0.012, 0.05, 8), ph('#9ca3af', 90), 0, 0.245, 0); void spring;
    var hd = new T.Group(); hd.position.y = 0.33; g.add(hd); add(hd, SP(0.11, 22), skin, 0, 0, 0);
    [-1, 1].forEach(function (sd) { add(hd, SP(0.045, 12), hair, sd * 0.1, 0.01, -0.02); add(hd, SP(0.016, 8), ph('#111827', 80), sd * 0.038, 0.02, 0.098); add(hd, SP(0.02, 8), ph('#f7a1a1', 10), sd * 0.065, -0.02, 0.085).scale.set(1, 0.7, 0.4); add(hd, TO(0.025, 0.004, 14), ph('#c9993a', 90), sd * 0.038, 0.02, 0.104); });
    var sm = add(hd, TO(0.035, 0.008, 12, Math.PI), ph('#7a2a2a', 20), 0, -0.035, 0.095); sm.rotation.z = Math.PI;
    g.userData.tick = function (t) { hd.rotation.x = Math.sin(t * 6) * 0.18; hd.rotation.z = Math.sin(t * 4.3) * 0.08; }; return g; }
  function goldStamp() { var g = new T.Group(), gold = ph('#ffcf3a', 120, '#5a3a00');
    add(g, BX(0.3, 0.06, 0.2), gold, 0, 0.03, 0); add(g, BX(0.26, 0.02, 0.16), ph('#d61f45', 30), 0, -0.005, 0);
    add(g, CY(0.05, 0.07, 0.1, 18), gold, 0, 0.11, 0); add(g, CY(0.03, 0.03, 0.14, 12), ph('#5b3a1e', 30), 0, 0.23, 0); add(g, SP(0.06, 16), gold, 0, 0.33, 0);
    var star = add(g, CY(0.035, 0.035, 0.01, 5), ph('#fff3c4', 60), 0, 0.065, 0.101); star.rotation.x = Math.PI / 2;
    g.userData.tick = function (t) { g.children[4].scale.setScalar(1 + Math.abs(Math.sin(t * 3)) * 0.08); }; return g; }
  if (GA.Prize3D) { GA.Prize3D.register('pl_barnaby', bobble); GA.Prize3D.register('gold_stamp', goldStamp); }
  function sh(g, x, y, rx) { var gr = g.createRadialGradient(x, y, 1, x, y, rx); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, rx * 0.3, 0, 0, 7); g.fill(); }
  var ART = {
    pl_barnaby: function (g) { sh(g, 50, 92, 26); g.fillStyle = '#c9993a'; g.fillRect(30, 82, 40, 8); g.fillStyle = '#3f8f5a'; g.fillRect(40, 58, 20, 24); g.fillStyle = '#f3c9a8'; g.beginPath(); g.arc(50, 38, 22, 0, 7); g.fill(); g.fillStyle = '#f5f5f5'; g.beginPath(); g.arc(30, 36, 8, 0, 7); g.arc(70, 36, 8, 0, 7); g.fill(); g.fillStyle = '#111827'; g.fillRect(41, 33, 5, 5); g.fillRect(54, 33, 5, 5); g.strokeStyle = '#7a2a2a'; g.lineWidth = 3; g.beginPath(); g.arc(50, 42, 8, 0.2, Math.PI - 0.2); g.stroke(); g.fillStyle = '#ffcf3a'; g.fillRect(45, 58, 10, 5); },
    gold_stamp: function (g) { sh(g, 50, 92, 28); g.fillStyle = '#d61f45'; g.fillRect(24, 80, 52, 6); g.fillStyle = '#ffcf3a'; g.fillRect(22, 68, 56, 12); g.fillRect(40, 52, 20, 16); g.fillStyle = '#5b3a1e'; g.fillRect(46, 30, 8, 22); g.fillStyle = '#ffcf3a'; g.beginPath(); g.arc(50, 24, 12, 0, 7); g.fill(); g.strokeStyle = '#b45309'; g.lineWidth = 2; g.strokeRect(22, 68, 56, 12); }
  };
  if (GA.PrizeArt) Object.keys(ART).forEach(function (k) { GA.PrizeArt.register(k, ART[k]); });
  if (GA.PRIZE_CATS && !GA.PRIZE_CATS.some(function (c) { return c.id === 'hall'; })) GA.PRIZE_CATS.push({ id: 'hall', name: 'Hall Rares', icon: '\uD83C\uDFDB\uFE0F' });
  [{ id: 'pl_barnaby', name: 'Barnaby Bobblehead', desc: 'RARE! Uncle Barnaby on a spring. He nods at everything, especially when Gus says no. Earned by returning all 6 of his lost files.' },
   { id: 'gold_stamp', name: 'Golden Rubber Stamp', desc: 'RARE! The Stamp-O-Matic\u2019s golden APPROVED stamp. Earned with a perfect 5/5 in the Grok games quiz.' }
  ].forEach(function (p) { if (!GA.findPrize || !GA.findPrize(p.id)) GA.PRIZES.push({ id: p.id, cat: 'hall', vault: true, hall: true, name: p.name, price: 0, desc: p.desc }); });
})();
