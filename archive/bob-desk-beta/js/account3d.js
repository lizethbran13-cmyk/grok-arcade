/* Grok Arcade - BOB'S ACCOUNT DESK (3D), issue #49. A walk-up booth on the main floor's west wall (between the Achievement
   Gallery and the couch), run by BOB: Lili's long, chatty, nice-but-pushy big brother (Ratita Industries account bot).
   Real meshes only (no billboards): booth walls + back wall art, a counter with a customer screen that shows YOUR account ID,
   a scrolling "Premium Platinum Plus" ticker, brochures, a bell, a take-a-number roll, and Bob himself (tall amber hover-bot:
   headset, vest + tie, visor eyes with very busy eyebrows, the family's three mouse-ear antennas, waving a brochure at you).
   Walk up -> prompt -> GA.AccountUI (kind ac_desk). */
(function () {
  'use strict';
  var T = THREE, B3 = GA.Account3D = {}, A, R, mats = {}, BOB = {}, st = { t: 0, built: false, wave: 0, mood: 'idle', moodT: 0, blinkT: 2 };
  var X0 = -18, ZC = -0.1; // west wall (ROOM.minX) / booth centre
  B3.SPOT = { x: X0 + 2.9, z: ZC };

  function ph(c, s, e) { var k = c + '|' + (s || 30) + '|' + (e || ''); return mats[k] || (mats[k] = new T.MeshPhongMaterial({ color: c, shininess: s || 30, emissive: e ? new T.Color(e) : new T.Color(0) })); }
  function gl(c) { var k = 'g' + c; return mats[k] || (mats[k] = new T.MeshBasicMaterial({ color: c })); }
  function chrome() { return mats.chrome || (mats.chrome = new T.MeshPhongMaterial({ color: '#cfd8e6', shininess: 140, specular: '#ffffff' })); }
  function add(p, g, m, x, y, z) { var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); p.add(o); return o; }
  function bx(w, h, d) { return new T.BoxGeometry(w, h, d); }
  function cy(a, b, h, s) { return new T.CylinderGeometry(a, b, h, s || 24); }
  function sp(r, s) { return new T.SphereGeometry(r, s || 24, Math.max(8, Math.round((s || 24) * 0.66))); }
  function to(r, t, s, a) { return new T.TorusGeometry(r, t, 12, s || 36, a || Math.PI * 2); }
  function cvs(w, h, draw) { var c = A.mkCanvas(w, h), t = A.canvasTex(c); if (draw) draw(c.getContext('2d'), w, h); t.needsUpdate = true; return { c: c, tex: t, redraw: function (f) { f(c.getContext('2d'), w, h); t.needsUpdate = true; } }; }
  function face(par, w, h, tex, x, y, z, ry) { var m = add(par, new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, toneMapped: false }), x, y, z); if (ry) m.rotation.y = ry; return m; }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  var FONT = '"Trebuchet MS",system-ui,sans-serif';
  function neon(c, s, x, y, px, col, mw) { c.save(); c.font = '900 ' + px + 'px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; var w = c.measureText(s).width; if (mw && w > mw) c.font = '900 ' + Math.floor(px * mw / w) + 'px ' + FONT; c.shadowColor = col; c.shadowBlur = px * 0.35; c.fillStyle = col; c.fillText(s, x, y); c.shadowBlur = 0; c.fillStyle = '#fff'; c.globalAlpha = 0.55; c.fillText(s, x, y); c.restore(); }
  function txt(c, s, x, y, px, col, mw, wt) { c.save(); c.font = (wt || 'bold') + ' ' + px + 'px ' + FONT; var w = c.measureText(s).width; if (mw && w > mw) c.font = (wt || 'bold') + ' ' + Math.floor(px * mw / w) + 'px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(s, x, y); c.restore(); }
  function mouse(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x - r * 0.62, y - r * 0.62, r * 0.48, 0, 7); c.arc(x + r * 0.62, y - r * 0.62, r * 0.48, 0, 7); c.fill(); c.beginPath(); c.arc(x, y, r * 0.72, 0, 7); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(x - r * 0.25, y - r * 0.08, r * 0.09, 0, 7); c.arc(x + r * 0.25, y - r * 0.08, r * 0.09, 0, 7); c.fill(); c.fillStyle = '#f472b6'; c.beginPath(); c.arc(x, y + r * 0.2, r * 0.11, 0, 7); c.fill(); }
  function glowFloor(c, w, d, x, z) { var m = new T.MeshBasicMaterial({ map: A.glowTex, color: c, transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending }); var f = add(R, new T.PlaneGeometry(w, d), m, x, 0.03, z); f.rotation.x = -Math.PI / 2; f.renderOrder = 2; A.noAud(f); return m; }

  /* ---------- the booth ---------- */
  var AMB = '#f59e0b', NAVY = '#1e1b4b';
  function booth() {
    var g = new T.Group(); g.name = 'Bob\u2019s Account Desk booth'; R.add(g);
    var navy = ph(NAVY, 40), trim = gl(AMB), top = ph('#fef3c7', 90), wood = ph('#7c2d12', 30);
    // back wall art: header + Premium poster + LIVE SYNC sign + the Ratita family logo
    var back = cvs(1024, 782, function (c, w, h) {
      var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2e1065'); gr.addColorStop(1, '#0b0820'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(245,158,11,.18)'; c.lineWidth = 2; for (var i = -h; i < w; i += 46) { c.beginPath(); c.moveTo(i, h); c.lineTo(i + h, 0); c.stroke(); }
      c.fillStyle = '#120a2e'; rr(c, 150, 8, 724, 104, 26); c.fill(); c.strokeStyle = AMB; c.lineWidth = 6; c.stroke();
      neon(c, 'BOB\u2019S ACCOUNT DESK', w / 2, 62, 62, '#fbbf24', 680);
      // left: Premium poster
      c.save(); c.translate(40, 230); c.fillStyle = '#fde68a'; rr(c, 0, 0, 280, 360, 18); c.fill(); c.fillStyle = '#7c2d12'; rr(c, 10, 10, 260, 340, 12); c.fill();
      txt(c, '\u2605 PREMIUM \u2605', 140, 56, 40, '#fde68a', 240, '900'); txt(c, 'PLATINUM', 140, 108, 44, '#fff', 240, '900'); txt(c, 'PLUS', 140, 158, 52, '#fbbf24', 240, '900');
      txt(c, 'Gold sticker!', 140, 214, 26, '#fde68a', 240); txt(c, 'Extra sparkle!', 140, 248, 26, '#fde68a', 240); txt(c, 'Bob says hi more!', 140, 282, 26, '#fde68a', 240);
      c.save(); c.translate(140, 190); c.rotate(-0.42); c.fillStyle = 'rgba(239,68,68,.92)'; rr(c, -150, -30, 300, 60, 10); c.fill(); txt(c, 'COMING NEVER', 0, 2, 36, '#fff', 280, '900'); c.restore();
      c.restore();
      // right: live sync sign
      c.save(); c.translate(704, 230); c.fillStyle = '#0f172a'; rr(c, 0, 0, 280, 360, 18); c.fill(); c.strokeStyle = '#38bdf8'; c.lineWidth = 6; rr(c, 6, 6, 268, 348, 14); c.stroke();
      neon(c, 'LIVE SYNC', 140, 54, 44, '#38bdf8', 250); txt(c, 'coming soon', 140, 98, 30, '#bae6fd', 250);
      c.strokeStyle = '#38bdf8'; c.lineWidth = 5; c.beginPath(); c.arc(140, 168, 40, 0.4, Math.PI * 1.9); c.stroke(); c.beginPath(); c.moveTo(178, 140); c.lineTo(182, 170); c.lineTo(152, 160); c.stroke();
      txt(c, 'needs a save server', 140, 236, 26, '#fbbf24', 250); txt(c, '3 devices \u00b7 friends', 140, 276, 26, '#e0f2fe', 250); txt(c, 'for now: TRANSFER CODE', 140, 318, 24, '#a7f3d0', 250);
      c.restore();
      mouse(c, w / 2 - 70, 724, 30, '#9ca3af'); mouse(c, w / 2, 718, 34, '#d6a26b'); mouse(c, w / 2 + 70, 724, 30, '#ffffff');
    });
    face(g, 3.6, 2.75, back.tex, X0 + 0.065, 1.375, ZC, Math.PI / 2);
    add(g, bx(0.06, 2.83, 3.68), navy, X0 + 0.02, 1.415, ZC);
    add(g, bx(0.05, 0.05, 3.7), trim, X0 + 0.08, 2.8, ZC);
    // side walls with rounded front edges and an amber strip
    [-1, 1].forEach(function (sd) {
      var z = ZC + sd * 1.82, w = new T.Group(); w.position.set(0, 0, z); g.add(w);
      add(w, bx(1.9, 2.3, 0.08), navy, X0 + 0.95, 1.15, 0);
      add(w, cy(0.06, 0.06, 2.3, 18), ph(AMB, 80), X0 + 1.9, 1.15, 0);
      add(w, bx(1.9, 0.04, 0.1), trim, X0 + 0.95, 2.3, 0);
      add(w, bx(1.86, 0.06, 0.09), trim, X0 + 0.95, 0.12, 0);
      var stripes = cvs(256, 128, function (c, W, H) { c.fillStyle = NAVY; c.fillRect(0, 0, W, H); c.fillStyle = AMB; for (var i = 0; i < 4; i++) { rr(c, 18, 18 + i * 26, W - 36, 12, 6); c.fill(); } });
      face(w, 1.0, 0.5, stripes.tex, X0 + 1.1, 1.65, -sd * 0.045, sd < 0 ? 0 : Math.PI);
    });
    // the counter
    var c0 = new T.Group(); c0.name = 'counter'; c0.position.set(X0 + 1.75, 0, ZC); g.add(c0);
    add(c0, bx(0.55, 1.0, 2.5), navy, 0, 0.5, 0); add(c0, bx(0.72, 0.06, 2.62), top, 0.04, 1.03, 0);
    [-1, 1].forEach(function (sd) { var e = add(c0, new T.CylinderGeometry(0.275, 0.275, 1.0, 24, 1, false, 0, Math.PI), navy, 0, 0.5, sd * 1.25); e.rotation.y = sd > 0 ? 0 : Math.PI; var t2 = add(c0, new T.CylinderGeometry(0.36, 0.36, 0.06, 24, 1, false, 0, Math.PI), top, 0.04, 1.03, sd * 1.31); t2.rotation.y = sd > 0 ? 0 : Math.PI; });
    add(c0, bx(0.04, 0.05, 2.5), trim, 0.285, 0.93, 0); add(c0, bx(0.04, 0.05, 2.5), trim, 0.285, 0.1, 0);
    var front = cvs(1024, 320, function (c, w, h) { c.fillStyle = '#1e1b4b'; c.fillRect(0, 0, w, h); neon(c, 'ACCOUNTS \u00b7 SAVE TRANSFER', w / 2, 70, 58, '#fbbf24', w - 80); txt(c, 'move your WHOLE Grok save to another device', w / 2, 140, 34, '#fde68a', w - 80); mouse(c, 150, 230, 44, '#f59e0b'); mouse(c, w - 150, 230, 44, '#f59e0b'); txt(c, 'RATITA INDUSTRIES', w / 2, 236, 40, '#c4b5fd', 600, '900'); });
    face(c0, 2.3, 0.72, front.tex, 0.28, 0.52, 0, Math.PI / 2);
    // scrolling ticker strip (texture offset, still a flat panel)
    B3.tick = cvs(1024, 64, function (c, w, h) { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.font = '900 40px ' + FONT; c.textBaseline = 'middle'; c.fillStyle = '#fbbf24'; c.shadowColor = '#f59e0b'; c.shadowBlur = 8; c.fillText('\u2605 PREMIUM PLATINUM PLUS \u2605 COMING NEVER \u2605 ASK BOB \u2605 ', 8, 34); });
    B3.tick.tex.wrapS = T.RepeatWrapping; B3.tick.tex.repeat.set(1.6, 1);
    face(c0, 2.3, 0.12, B3.tick.tex, 0.285, 1.0 - 0.1, 0, Math.PI / 2).position.y = 0.86;
    // customer screen (shows your account), bell, brochures, take-a-number, mug
    var scr = new T.Group(); scr.position.set(0.05, 1.06, -0.55); scr.rotation.y = Math.PI / 2 - 0.25; c0.add(scr);
    add(scr, cy(0.09, 0.12, 0.04, 20), chrome(), 0, 0.02, 0); add(scr, bx(0.05, 0.22, 0.05), chrome(), 0, 0.14, -0.02);
    add(scr, bx(0.66, 0.42, 0.05), ph('#0f172a', 70), 0, 0.42, 0);
    B3.screen = cvs(512, 320); face(scr, 0.6, 0.375, B3.screen.tex, 0, 0.42, 0.027); drawScreen();
    var bell = new T.Group(); bell.position.set(0.12, 1.06, 0.55); c0.add(bell); add(bell, cy(0.08, 0.08, 0.02, 20), ph('#334155', 40), 0, 0.01, 0); var dome = add(bell, new T.SphereGeometry(0.065, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), chrome(), 0, 0.02, 0); void dome; add(bell, cy(0.008, 0.008, 0.03, 8), chrome(), 0, 0.1, 0);
    var bro = cvs(128, 180, function (c, w, h) { c.fillStyle = '#fbbf24'; c.fillRect(0, 0, w, h); c.fillStyle = '#7c2d12'; c.fillRect(6, 6, w - 12, h - 12); txt(c, 'PREMIUM', w / 2, 40, 26, '#fde68a', w - 16, '900'); txt(c, 'PLATINUM', w / 2, 74, 22, '#fff', w - 16, '900'); txt(c, 'PLUS', w / 2, 106, 30, '#fbbf24', w - 16, '900'); txt(c, '(not real)', w / 2, 150, 18, '#fde68a', w - 16); });
    B3.broTex = bro.tex;
    for (var i = 0; i < 3; i++) { var bb = new T.Group(); bb.position.set(0.1 + i * 0.015, 1.065 + i * 0.012, 0.95 - i * 0.03); bb.rotation.set(-Math.PI / 2, 0, Math.PI / 2 + (i - 1) * 0.12); c0.add(bb); add(bb, bx(0.2, 0.28, 0.01), ph('#fbbf24', 30), 0, 0, 0); face(bb, 0.19, 0.27, bro.tex, 0, 0, 0.006); }
    var num = new T.Group(); num.position.set(0.14, 1.06, 0.12); c0.add(num); add(num, cy(0.07, 0.07, 0.16, 20), ph('#dc2626', 60), 0, 0.08, 0); add(num, bx(0.02, 0.06, 0.09), gl('#fef3c7'), 0.07, 0.1, 0);
    var mug = new T.Group(); mug.position.set(-0.18, 1.06, -1.05); c0.add(mug); add(mug, cy(0.06, 0.055, 0.13, 18), ph('#fef3c7', 60), 0, 0.065, 0); var hnd = add(mug, to(0.035, 0.01, 14), ph('#fef3c7', 60), 0, 0.07, 0.065); hnd.rotation.y = Math.PI / 2;
    // floor mat (glow) + a little "MAX 3 DEVICES" floor decal in front
    B3.glow = glowFloor(AMB, 1.6, 1.4, X0 + 2.9, ZC);
    var mat = cvs(512, 256, function (c, w, h) { c.fillStyle = 'rgba(30,27,75,.92)'; rr(c, 6, 6, w - 12, h - 12, 40); c.fill(); c.strokeStyle = AMB; c.lineWidth = 8; c.stroke(); neon(c, 'NEXT CUSTOMER', w / 2, 92, 54, '#fbbf24', w - 60); txt(c, '(that\u2019s you!)', w / 2, 170, 40, '#fde68a', w - 60); });
    var mm = add(g, new T.PlaneGeometry(1.2, 0.6), new T.MeshBasicMaterial({ map: mat.tex, transparent: true, toneMapped: false }), X0 + 2.45, 0.02, ZC); mm.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
    A.addSolid(X0, X0 + 2.05, ZC - 1.88, ZC + 1.88, 'Bob\u2019s Account Desk');
    g.updateMatrixWorld(true); A.regItem('Bob\u2019s Account Desk', 'prop', g);
  }
  function drawScreen() {
    if (!B3.screen) return; var ac = GA.Account && GA.Account.get();
    B3.screen.redraw(function (c, w, h) {
      c.fillStyle = '#0b1020'; c.fillRect(0, 0, w, h); c.strokeStyle = AMB; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12);
      txt(c, 'YOUR ACCOUNT', w / 2, 46, 34, '#fbbf24', w - 40, '900');
      if (ac && ac.id) { neon(c, ac.id.slice(0, 3) + ' ' + ac.id.slice(3), w / 2, 140, 96, '#fde68a', w - 60); txt(c, ac.name, w / 2, 222, 40, '#fff', w - 60); txt(c, 'Live Sync: coming soon', w / 2, 278, 26, '#7dd3fc', w - 60); }
      else { txt(c, 'not signed up yet', w / 2, 130, 40, '#fff', w - 60); txt(c, 'Talk to Bob! (It\u2019s free.', w / 2, 200, 30, '#fde68a', w - 60); txt(c, 'He WILL mention Premium.)', w / 2, 244, 30, '#fde68a', w - 60); }
    });
  }
  B3.refresh = drawScreen;

  /* ---------- BOB ---------- */
  function bob() {
    var g = new T.Group(); g.name = 'Bob'; g.userData.noBatch = true; g.position.set(X0 + 0.9, 0, ZC); g.rotation.y = Math.PI / 2; R.add(g); BOB.g = g;
    var amber = new T.MeshPhongMaterial({ color: '#fbbf24', shininess: 120, specular: '#ffffff' }), vest = ph('#1e3a8a', 50), dk = ph('#0f172a', 40), sil = chrome(), tie = ph('#dc2626', 70);
    add(g, cy(0.34, 0.38, 0.05, 28), dk, 0, 0.025, 0); var ring = add(g, to(0.32, 0.035, 28), gl('#fbbf24'), 0, 0.12, 0); ring.rotation.x = Math.PI / 2;
    var hov = new T.Group(); g.add(hov); BOB.hov = hov;
    var thr = add(hov, new T.ConeGeometry(0.15, 0.3, 18), sil, 0, 0.42, 0); thr.rotation.x = Math.PI;
    BOB.flame = add(hov, new T.ConeGeometry(0.09, 0.26, 14), new T.MeshBasicMaterial({ color: '#fde68a', transparent: true, opacity: 0.75, depthWrite: false, blending: T.AdditiveBlending }), 0, 0.2, 0); BOB.flame.rotation.x = Math.PI; A.noAud(BOB.flame);
    // long body: a tall capsule
    add(hov, cy(0.3, 0.26, 0.72, 32), amber, 0, 1.0, 0); add(hov, sp(0.26, 28), amber, 0, 0.64, 0).scale.set(1, 0.6, 1); add(hov, sp(0.3, 28), amber, 0, 1.36, 0).scale.set(1, 0.45, 1);
    // vest front (a slice of cylinder), tie, name badge, belt
    var v = add(hov, new T.CylinderGeometry(0.305, 0.265, 0.7, 32, 1, true, -1.15, 2.3), vest, 0, 1.0, 0); v.material = vest; v.material.side = T.DoubleSide;
    var tg = new T.Group(); tg.position.set(0, 1.0, 0.3); tg.rotation.x = -0.06; hov.add(tg); add(tg, bx(0.08, 0.06, 0.03), tie, 0, 0.3, 0); var tb = add(tg, new T.CylinderGeometry(0.075, 0.02, 0.48, 4), tie, 0, 0.04, 0); tb.rotation.y = Math.PI / 4; tb.scale.set(1, 1, 0.3); BOB.tie = tg;
    var badge = cvs(160, 96, function (c, w, h) { c.fillStyle = '#fff'; rr(c, 2, 2, w - 4, h - 4, 12); c.fill(); c.fillStyle = '#dc2626'; c.fillRect(2, 2, w - 4, 30); txt(c, 'HELLO my name is', w / 2, 18, 16, '#fff', w - 10); txt(c, 'BOB', w / 2, 64, 44, '#111', w - 10, '900'); });
    var bg = face(hov, 0.16, 0.096, badge.tex, 0.15, 1.14, 0.268); bg.rotation.y = 0.5;
    add(hov, to(0.29, 0.028, 32), ph('#7c2d12', 60), 0, 0.68, 0).rotation.x = Math.PI / 2;
    // neck + head
    add(hov, cy(0.1, 0.14, 0.16, 20), sil, 0, 1.55, 0);
    var head = new T.Group(); head.position.set(0, 1.86, 0); hov.add(head); BOB.head = head;
    add(head, sp(0.28, 30), amber, 0, 0, 0).scale.set(1.0, 1.08, 0.96);
    var vis = add(head, new T.CylinderGeometry(0.283, 0.283, 0.2, 32, 1, true), ph('#111827', 90), 0, 0.02, 0); vis.scale.set(1.0, 1, 0.97);
    BOB.face = cvs(256, 112); face(head, 0.4, 0.175, BOB.face.tex, 0, 0.02, 0.278); faceDraw('idle');
    // headset: band over the top, ear cups, mic boom
    add(head, to(0.31, 0.024, 28, Math.PI), dk, 0, 0.02, -0.03); // ear to ear over the top
    [-1, 1].forEach(function (sd) { var cup = add(head, cy(0.08, 0.08, 0.06, 20), dk, sd * 0.3, 0.02, 0); cup.rotation.z = Math.PI / 2; add(head, cy(0.055, 0.055, 0.065, 18), gl('#fbbf24'), sd * 0.302, 0.02, 0).rotation.z = Math.PI / 2; });
    var boom = add(head, cy(0.011, 0.011, 0.3, 8), dk, 0.24, -0.12, 0.17); boom.rotation.set(Math.PI / 2, 0, 0); boom.rotation.set(0.0, -0.75, 1.35);
    add(head, sp(0.03, 12), ph('#dc2626', 40), 0.1, -0.17, 0.27);
    // the family's three mouse-ear antennas (Luna grey, Pi-rat tan, Snowie white) - a bit taller than Lili's, of course
    [['#9ca3af', -0.15], ['#d6a26b', 0], ['#ffffff', 0.15]].forEach(function (q, i) { var y0 = 0.3 + (i === 1 ? 0.05 : 0); var s2 = add(head, cy(0.012, 0.012, 0.2, 6), sil, q[1], y0, -0.06); s2.rotation.z = -q[1] * 1.1; var ear = add(head, cy(0.07, 0.07, 0.025, 20), ph(q[0], 40), q[1] * 1.3, y0 + 0.12, -0.06); ear.rotation.x = Math.PI / 2; add(head, cy(0.042, 0.042, 0.028, 16), ph('#fbcfe8', 30), q[1] * 1.3, y0 + 0.12, -0.045).rotation.x = Math.PI / 2; });
    // long arms: left gestures, right waves a Premium brochure
    BOB.arms = []; [-1, 1].forEach(function (sd) { var a = new T.Group(); a.position.set(sd * 0.32, 1.3, 0); hov.add(a); add(a, sp(0.06, 14), sil, 0, 0, 0); add(a, cy(0.026, 0.026, 0.5, 10), sil, 0, -0.26, 0); add(a, sp(0.06, 14), amber, 0, -0.52, 0); a.rotation.z = sd * 0.25; BOB.arms.push(a); });
    var br = new T.Group(); br.position.set(0, -0.56, 0.06); BOB.arms[1].add(br); br.rotation.set(-1.2, 0, 0); add(br, bx(0.2, 0.28, 0.012), ph('#fbbf24', 30), 0, -0.1, 0); face(br, 0.19, 0.27, B3.broTex, 0, -0.1, 0.007); BOB.bro = br;
    g.updateMatrixWorld(true); // Bob stands inside the booth on purpose, so he isn't a separate layout-audit item
  }
  function faceDraw(mood) { if (!BOB.face) return; BOB.mood = mood; BOB.face.redraw(function (c, w, h) {
    c.fillStyle = '#1c0f02'; c.fillRect(0, 0, w, h); var col = mood === 'shock' ? '#f87171' : '#fbbf24'; c.fillStyle = col; c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = 10; c.lineCap = 'round';
    var up = mood === 'pushy' ? 14 : mood === 'happy' ? 4 : 0;
    // eyebrows: Bob's are VERY expressive
    c.lineWidth = 8; c.beginPath(); c.moveTo(42, 30 - up); c.lineTo(100, mood === 'pushy' ? 12 : 22 - up); c.moveTo(156, mood === 'pushy' ? 12 : 22 - up); c.lineTo(214, 30 - up); c.stroke();
    if (mood === 'blink') { c.fillRect(48, 64, 50, 7); c.fillRect(158, 64, 50, 7); }
    else if (mood === 'happy') { c.lineWidth = 9; c.beginPath(); c.arc(73, 78, 24, Math.PI, 0); c.moveTo(207, 78); c.arc(183, 78, 24, Math.PI, 0); c.stroke(); }
    else if (mood === 'shock') { c.beginPath(); c.arc(73, 70, 22, 0, 7); c.arc(183, 70, 22, 0, 7); c.fill(); }
    else { c.fillRect(48, 46, 50, 46); c.fillRect(158, 46, 50, 46); c.fillStyle = '#1c0f02'; c.fillRect(48 + (mood === 'pushy' ? 26 : 16), 58, 18, 22); c.fillRect(158 + (mood === 'pushy' ? 26 : 16), 58, 18, 22); }
    c.shadowBlur = 0; }); }
  B3.mood = function (m, secs) { faceDraw(m); st.moodT = secs || 2.5; };
  B3.wave = function (secs) { st.wave = secs || 2.5; };

  /* ---------- build + animate ---------- */
  B3.build = function (api) {
    A = api; if (!GA.Account) return;
    R = new T.Group(); R.name = 'Bob\u2019s Account Desk'; A.scene.add(R);
    booth(); bob();
    var cab = { game: { id: 'ac_desk', name: 'Bob\u2019s Account Desk', desc: '', color: AMB }, kind: 'ac_desk', id: 'ac_desk', x: B3.SPOT.x, z: B3.SPOT.z, front: new T.Vector3(B3.SPOT.x, 0, B3.SPOT.z), dir: new T.Vector3(1, 0, 0), glow: B3.glow, nextDraw: Infinity, r: 1.2, ar: true, area: 'main', data: {} };
    var an = new T.Object3D(); an.name = 'anchor ac_desk'; an.position.set(B3.SPOT.x - 1.75, 0, B3.SPOT.z); an.rotation.y = Math.PI / 2; R.add(an); an.updateMatrixWorld(true); cab.group = an; cab.rot = an.rotation.y;
    A.cabinets.push(cab); B3.cab = cab;
    R.updateMatrixWorld(true); A.anims.push(frame); st.built = true; B3.built = true;
  };
  function frame(t) {
    if (!st.built) return; var dt = Math.max(0, Math.min(0.1, t - (st.t || t))); st.t = t;
    if (GA.Hub.area && GA.Hub.area() !== 'main') return;
    var p = A.pose(), dx = p.x - BOB.g.position.x, dz = p.z - BOB.g.position.z, d = Math.sqrt(dx * dx + dz * dz), near = d < 6.5;
    BOB.hov.position.y = 0.06 + Math.sin(t * 2.1) * 0.05; BOB.flame.scale.y = 0.85 + Math.sin(t * 23) * 0.15;
    // head follows you when you're close (he WILL make eye contact)
    var want = near ? Math.max(-0.9, Math.min(0.9, Math.atan2(dx, dz) - Math.PI / 2)) : Math.sin(t * 0.5) * 0.35; if (want > Math.PI) want -= Math.PI * 2;
    var yaw = Math.atan2(dx, dz) - BOB.g.rotation.y; while (yaw > Math.PI) yaw -= Math.PI * 2; while (yaw < -Math.PI) yaw += Math.PI * 2; if (near) want = Math.max(-0.9, Math.min(0.9, yaw));
    BOB.head.rotation.y += (want - BOB.head.rotation.y) * Math.min(1, dt * 5); BOB.head.rotation.z = Math.sin(t * 1.3) * 0.05;
    // brochure wave: always a little, LOTS when you're close or he's selling
    if (st.wave > 0) st.wave -= dt; var hard = st.wave > 0 || d < 3.2;
    BOB.arms[1].rotation.z = hard ? 2.3 + Math.sin(t * 9) * 0.35 : 0.35 + Math.sin(t * 1.6) * 0.1; BOB.arms[1].rotation.x = hard ? -0.5 : -0.15;
    BOB.arms[0].rotation.z = -0.3 - (near ? 0.5 + Math.sin(t * 3) * 0.25 : Math.sin(t * 1.2) * 0.08); BOB.arms[0].rotation.x = near ? -0.9 : -0.1;
    BOB.tie.rotation.z = Math.sin(t * 2.6) * 0.12;
    if (st.moodT > 0) { st.moodT -= dt; if (st.moodT <= 0) faceDraw('idle'); }
    else { st.blinkT -= dt; if (st.blinkT <= 0 && BOB.mood !== 'blink') { faceDraw('blink'); st.blinkT = 0.14; } else if (st.blinkT <= 0) { faceDraw(d < 3.2 ? 'pushy' : 'idle'); st.blinkT = 2 + Math.random() * 3; } else if (BOB.mood !== 'blink' && (d < 3.2) !== (BOB.mood === 'pushy')) faceDraw(d < 3.2 ? 'pushy' : 'idle'); }
    if (B3.tick) B3.tick.tex.offset.x = (t * 0.08) % 1;
  }
})();
