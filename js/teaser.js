/* Grok Arcade - RATITA TEASER ROOM (#90, PREVIEW). A walk-in "coming soon" theater off the Ratita Preview Center
   (door on the Preview Center's west wall, south of the poster row). Posters show every upcoming game / DLC / remaster / sequel
   with an estimated release, a scrolling COMING SOON marquee, Ratita Industries hologram, pet cameos, and a Release Calendar
   kiosk that links to the Time Jumper. Far-away region: x 40..62, z 150..168. Test: GA.Teaser.open() or ?area=teaser */
(function () {
  'use strict';
  var T = THREE, TZ = GA.Teaser = {}, H, A, add, bx, cy, sp, to, cvs, texPlane, mats = {};
  var B = TZ.B = { name: 'teaser', minX: 40, maxX: 62, minZ: 150, maxZ: 168, maxY: 6, H: 5, spawn: { x: 59.6, z: 159 } };
  var DOOR = { x: -18, z: 28.0 }, live = false, ANIM = [], WANT = /[?&]area=teaser\b/.test(location.search) || /^#teaser/.test(location.hash);
  /* the pipeline (estimates are honest guesses; everything waits for David's greenlight after screenshots) */
  var ITEMS = TZ.ITEMS = [
    { id: 'skytravel', issue: 80, name: 'Grok Sky DLC: Super Travel Expansion', kind: 'DLC', est: 'Nov 4', when: 'Waiting for your greenlight', col: '#38bdf8', c2: '#fde047', icon: '\u2708\uFE0F', slug: 'sky-super-travel-fixes', pet: 'Pi-rat in the cockpit' },
    { id: 'worldtour', name: 'Pickleball Park DLC: World Tour', kind: 'DLC', est: 'Nov 5', when: 'In the Time Jumper now', col: '#16a34a', c2: '#e6ff3b', icon: '\uD83C\uDF0D', slug: 'pickleball-world-tour', pet: 'Torty anchors TTN' },
    { id: 'landparty', issue: 82, name: 'Grok Land Party: Fiesta Fixes', kind: 'Fix Pack', est: 'Nov 6', when: 'Building now', col: '#ff6bd6', c2: '#ffe14d', icon: '\uD83C\uDF89', pet: 'Snowie hosts' },
    { id: 'edu', issue: 89, name: 'Education Center Updates', kind: 'Room Update', est: 'Nov 7', when: 'Building now', col: '#a78bfa', c2: '#fde68a', icon: '\uD83C\uDF93', pet: 'Lilith the Bot' },
    { id: 'airport', name: 'Grok Sky: Airport Tycoon', kind: 'DLC', est: 'Nov 9', when: 'In the Time Jumper now', col: '#0ea5e9', c2: '#f97316', icon: '\uD83D\uDEEB', slug: 'airport-tycoon', pet: 'Candy at the gate' },
    { id: 'mail', issue: 91, name: 'Ratita Mail Tycoon', kind: 'New Game', est: 'Nov 12', when: 'In the Time Jumper now', col: '#dc2626', c2: '#fbbf24', icon: '\uD83D\uDCEE', slug: 'ratita-mail-tycoon', pet: 'Postmaster Pi-rat' },
    { id: 'thanks', name: 'The Big Thanksgiving Game', kind: 'New Game', est: 'Nov 20', when: 'Starts building Nov 3', col: '#ea580c', c2: '#facc15', icon: '\uD83E\uDD83', slug: 'thanksgiving-feast', pet: 'Gobbles the turkey' },
    { id: 'rodentia2', name: 'Great Rodentia 2: Escape from National Ratita Prison', kind: 'Sequel', est: 'Early Dec', when: 'Queued', col: '#475569', c2: '#fb923c', icon: '\u26D3\uFE0F', pet: 'Luna plans the escape' },
    { id: 'ruff', name: 'Candy\u2019s RuffSources Rescue', kind: 'New Game', est: 'Mid Dec', when: 'Queued', col: '#0d9488', c2: '#fda4af', icon: '\uD83D\uDC36', slug: 'candy-ruffsources-rescue', pet: 'Candy to the rescue' },
    { id: 'trips', name: 'Education Center DLC: Field Trips', kind: 'DLC', est: 'Late Dec', when: 'Queued', col: '#7c3aed', c2: '#4ade80', icon: '\uD83D\uDE8C', pet: 'Torty rides the bus' }
  ];
  // live status: a poster whose preview has been archived as a Final Beta (and is no longer in the Time Jumper) has shipped
  (function liveSync() { var D = window.GROK_PREVIEW_DATA || {}, pv = (D.previews || []).map(function (x) { return x.id; }), ar = (D.archive || []).map(function (x) { return x.url || ''; }), LIVE = { mail: 'ratita-mail-tycoon/', airport: 'airport-tycoon/', ruff: 'candy-ruffsources-rescue/', thanks: 'thanksgiving-feast/' };
    ITEMS.forEach(function (it) { if (!it.slug || pv.indexOf(it.slug) >= 0) return; if (ar.some(function (u) { return u.indexOf(it.slug + '-beta') >= 0; })) { it.when = 'Live Now'; it.liveUrl = LIVE[it.id] || null; it.slug = null; } }); })();
  function ph(c, s, e) { var k = 'p' + c + (s || 30) + (e || ''); return mats[k] || (mats[k] = new T.MeshPhongMaterial({ color: c, shininess: s || 30, specular: '#444444', emissive: e ? new T.Color(e) : new T.Color(0) })); }
  function gl(c) { var k = 'g' + c; return mats[k] || (mats[k] = new T.MeshBasicMaterial({ color: c })); }
  function R() { return H.R.teaser; }
  function noA(m) { A.noAud(m); return m; }
  function sign(par, w, h, draw, x, y, z, ry) { var t = cvs(Math.round(w * 200), Math.round(h * 200), draw); var m = texPlane(w, h, t.tex); m.position.set(x, y, z); m.rotation.y = ry || 0; par.add(m); A.noAud(m); return t; }
  function txt(c, s, x, y, col, px, mw) { c.fillStyle = col; c.font = 'bold ' + px + 'px Trebuchet MS, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y, mw); }
  function wrap(c, s, x, y, mw, lh, col, px) { c.font = 'bold ' + px + 'px Trebuchet MS, sans-serif'; var w = s.split(' '), line = '', ys = y; w.forEach(function (wd) { var t = line ? line + ' ' + wd : wd; if (c.measureText(t).width > mw && line) { txt(c, line, x, ys, col, px, mw); line = wd; ys += lh; } else line = t; }); if (line) txt(c, line, x, ys, col, px, mw); return ys; }
  function lamp(x, y, z, col, i, d) { var L = new T.PointLight(col, i || 0.8, d || 14, 1.4); L.position.set(x, y, z); R().add(L); return L; }
  function tag(par, name, y) { sign(par, 0.62, 0.3, function (c, w, h) { var nm = name.split(' \u00b7 '); c.fillStyle = '#fff7ed'; c.fillRect(0, 0, w, h); c.strokeStyle = '#7c2d12'; c.lineWidth = 4; c.strokeRect(2, 2, w - 4, h - 4); txt(c, nm[0], w / 2, h * 0.33, '#7c2d12', 30); txt(c, nm[1] || '', w / 2, h * 0.72, '#9a3412', 17); }, 0, y || 0.75, 0.15, 0); }

  // ---------- pets (real species) ----------
  function rat(par, x, z, ry, col, name, patch, back) { var g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; par.add(g);
    var b = add(g, sp(0.17, 14), ph(col, 20), 0, 0.16, 0); b.scale.set(1, 0.8, 1.45); add(g, sp(0.1, 12), ph(patch ? '#6b5e52' : col, 20), 0, 0.22, 0.24); if (patch) { var hd0 = add(g, sp(0.13, 12), ph('#6b5e52', 20), 0, 0.2, 0.12); hd0.scale.set(1, 0.7, 0.8); } if (back) { var bk = add(g, sp(0.15, 12), ph(back, 20), 0, 0.22, -0.04); bk.scale.set(0.9, 0.55, 1.4); }
    add(g, sp(0.03, 8), ph('#f9a8d4', 20), 0, 0.21, 0.34);
    [-1, 1].forEach(function (sd) { add(g, sp(0.055, 8), ph('#fbcfe8', 20), sd * 0.075, 0.33, 0.2); if (!(patch && sd < 0)) add(g, sp(0.02, 6), gl('#111'), sd * 0.045, 0.26, 0.31); });
    if (patch) { add(g, cy(0.035, 0.035, 0.01, 10), gl('#000'), -0.045, 0.26, 0.315).rotation.x = Math.PI / 2; var st = add(g, to(0.1, 0.006, 4, 16), gl('#000'), 0, 0.27, 0.24); st.rotation.y = 0.3; }
    var tl = add(g, cy(0.016, 0.005, 0.4, 6), ph('#fbcfe8', 20), 0, 0.1, -0.38); tl.rotation.x = 1.25; tag(g, name, 0.62);
    ANIM.push(function (t) { g.rotation.y = ry + Math.sin(t * 1.4 + x * 3) * 0.4; }); return g; }
  function schnauzer(par, x, z, ry) { var g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; par.add(g); var gr = ph('#6b7280', 15), lt = ph('#d1d5db', 15);
    add(g, bx(0.32, 0.26, 0.6), gr, 0, 0.36, 0); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { add(g, cy(0.05, 0.05, 0.26, 8), lt, q[0] * 0.11, 0.13, q[1] * 0.22); });
    add(g, bx(0.24, 0.22, 0.24), gr, 0, 0.56, 0.36); add(g, bx(0.16, 0.12, 0.2), lt, 0, 0.5, 0.52); add(g, bx(0.15, 0.12, 0.08), lt, 0, 0.42, 0.56);
    add(g, sp(0.035, 8), gl('#111'), 0, 0.53, 0.63); [-1, 1].forEach(function (sd) { add(g, bx(0.08, 0.03, 0.03), lt, sd * 0.06, 0.64, 0.48); add(g, sp(0.022, 6), gl('#111'), sd * 0.06, 0.6, 0.49); var e = add(g, bx(0.07, 0.12, 0.03), gr, sd * 0.1, 0.71, 0.32); e.rotation.z = sd * 0.3; });
    var tl = add(g, cy(0.03, 0.02, 0.14, 6), gr, 0, 0.55, -0.32); tl.rotation.x = -0.6; tag(g, 'CANDY \u00b7 mini schnauzer', 0.95);
    ANIM.push(function (t) { tl.rotation.z = Math.sin(t * 9) * 0.6; }); return g; }
  function tortoise(par, x, z, ry) { var g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; par.add(g);
    var sh = add(g, sp(0.3, 16, 10), ph('#8a6a3b', 25), 0, 0.12, 0); sh.scale.set(1, 0.65, 1.2);
    for (var i = 0; i < 6; i++) add(g, cy(0.07, 0.07, 0.02, 6), ph('#5c4424', 20), Math.cos(i) * 0.15, 0.3, Math.sin(i) * 0.18);
    var hd = add(g, sp(0.09, 12), ph('#a8956a', 20), 0, 0.14, 0.4); [-1, 1].forEach(function (sd) { add(g, sp(0.018, 6), gl('#111'), sd * 0.045, 0.17, 0.47); add(g, cy(0.06, 0.06, 0.12, 8), ph('#a8956a', 20), sd * 0.2, 0.05, 0.2); add(g, cy(0.06, 0.06, 0.12, 8), ph('#a8956a', 20), sd * 0.2, 0.05, -0.2); });
    tag(g, 'TORTY \u00b7 desert tortoise', 0.72); ANIM.push(function (t) { hd.position.z = 0.4 + Math.sin(t * 1.2) * 0.03; }); return g; }

  // ---------- poster art (canvas is exactly the frame's aspect so nothing stretches) ----------
  function posterArt(it) { return function (c, w, h) {
    var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, it.col); g.addColorStop(1, '#0b0618'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,.08)'; for (var i = 0; i < 9; i++) { c.beginPath(); c.arc(w * ((i * 37) % 100) / 100, h * ((i * 53) % 100) / 100, 12 + (i % 3) * 10, 0, 7); c.fill(); }
    c.fillStyle = it.c2; c.fillRect(0, 0, w, 40); txt(c, (it.kind + (it.issue ? ' \u00b7 #' + it.issue : '')).toUpperCase(), w / 2, 21, '#111', 22, w - 20);
    c.font = '96px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(it.icon, w / 2, 125);
    var y = wrap(c, it.name, w / 2, 210, w - 30, 30, '#fff', 26);
    txt(c, it.pet, w / 2, Math.max(y + 34, 280), '#fde68a', 17, w - 20);
    c.fillStyle = '#111827'; c.fillRect(14, h - 108, w - 28, 92); c.strokeStyle = it.c2; c.lineWidth = 4; c.strokeRect(14, h - 108, w - 28, 92);
    txt(c, 'EST. RELEASE', w / 2, h - 88, '#9ca3af', 15); txt(c, it.est, w / 2, h - 60, it.c2, 34, w - 40); txt(c, it.when + (it.slug ? ' \u25B6' : ''), w / 2, h - 30, it.slug ? '#5eead4' : '#e5e7eb', 15, w - 36);
  }; }
  function poster(it, i, x, z, ry, nx, nz) { var p = H.prop('teaser', 'Poster: ' + it.name, x, z, ry);
    add(p, bx(1.66, 2.26, 0.06), ph('#1f2937', 60), 0, 2.05, 0); add(p, bx(1.58, 2.18, 0.03), ph(it.c2, 60, it.c2), 0, 2.05, 0.02);
    sign(p, 1.5, 2.1, posterArt(it), 0, 2.05, 0.045, 0);
    var spot = add(p, cy(0.05, 0.09, 0.14, 10), ph('#111', 60), 0, 3.4, 0.35); spot.rotation.x = -0.9; add(p, sp(0.05, 8), gl('#fffbeb'), 0, 3.35, 0.4);
    if (it.slug) { var bd = add(p, bx(0.5, 0.18, 0.04), gl('#14b8a6'), 0.55, 3.06, 0.05); bd.rotation.z = -0.2; }
    H.inter({ id: 'tz_p' + i, kind: 'at_tz_poster', root: 'teaser', name: it.name, col: it.col, x: x + nx * 1.25, z: z + nz * 1.25, dir: [nx, nz], r: 0.9, gw: 1.3, gh: 0.9, data: { i: i } });
  }

  function build() {
    var r = H.mkRoot('teaser'); GA.Hub.addRegion(B); var cx = (B.minX + B.maxX) / 2, cz = (B.minZ + B.maxZ) / 2, W = B.maxX - B.minX, D = B.maxZ - B.minZ, h = B.H;
    var ft = cvs(256, 256, function (c) { c.fillStyle = '#3b0d2e'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#4c1238'; for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) if ((i + j) % 2) c.fillRect(i * 32, j * 32, 32, 32); c.fillStyle = '#fbbf24'; for (i = 0; i < 6; i++) { c.beginPath(); c.arc(20 + i * 44, 20 + (i * 70) % 220, 3, 0, 7); c.fill(); } }).tex; ft.wrapS = ft.wrapT = T.RepeatWrapping; ft.repeat.set(W / 4, D / 4);
    var fl = add(r, new T.PlaneGeometry(W, D), new T.MeshLambertMaterial({ map: ft }), cx, 0, cz); fl.rotation.x = -Math.PI / 2; noA(fl);
    var ce = add(r, new T.PlaneGeometry(W, D), gl('#140a2b'), cx, h, cz); ce.rotation.x = Math.PI / 2; noA(ce);
    var wt = cvs(256, 256, function (c) { c.fillStyle = '#1e1037'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#2a1650'; for (var i = 0; i < 256; i += 32) c.fillRect(i, 0, 14, 256); c.fillStyle = '#dc2626'; c.fillRect(0, 200, 256, 8); c.fillStyle = '#7f1d1d'; c.fillRect(0, 208, 256, 48); }).tex;
    [[W, cx, B.minZ, 0], [W, cx, B.maxZ, Math.PI], [D, B.minX, cz, Math.PI / 2], [D, B.maxX, cz, -Math.PI / 2]].forEach(function (q) { var tt = wt.clone(); tt.needsUpdate = true; tt.wrapS = T.RepeatWrapping; tt.repeat.set(q[0] / 3, 1); var m = add(r, new T.PlaneGeometry(q[0], h), new T.MeshLambertMaterial({ map: tt }), q[1], h / 2, q[2]); m.rotation.y = q[3]; noA(m); });
    var th = 0.4; A.addWall(B.minX - 1, B.maxX + 1, -1, h + 3, B.minZ - th, B.minZ); A.addWall(B.minX - 1, B.maxX + 1, -1, h + 3, B.maxZ, B.maxZ + th); A.addWall(B.minX - th, B.minX, -1, h + 3, B.minZ - 1, B.maxZ + 1); A.addWall(B.maxX, B.maxX + th, -1, h + 3, B.minZ - 1, B.maxZ + 1);
    A.walls.push({ minX: B.minX - 1, maxX: B.maxX + 1, minY: h, maxY: h + 2, minZ: B.minZ - 1, maxZ: B.maxZ + 1 });
    [[-6, -4.5], [-6, 4.5], [6, -4.5], [6, 4.5], [0, 0]].forEach(function (q) { lamp(cx + q[0], h - 0.4, cz + q[1], '#fff1f2', 0.7, 14); var p = add(r, cy(0.35, 0.35, 0.06, 16), gl('#fde68a'), cx + q[0], h - 0.04, cz + q[1]); noA(p); });
    // ---- north wall: COMING SOON marquee + 4 posters ----
    var mq = cvs(1600, 160, null), mqm = texPlane(8, 0.8, mq.tex); mqm.position.set(cx, 4.35, B.maxZ - 0.08); mqm.rotation.y = Math.PI; r.add(mqm); noA(mqm);
    add(r, bx(8.3, 1.0, 0.12), ph('#7f1d1d', 40), cx, 4.35, B.maxZ - 0.02);
    var bulbs = []; for (var bi = 0; bi < 26; bi++) bulbs.push(add(r, sp(0.06, 6), gl('#fde047'), cx - 4.05 + bi * 0.324, bi % 2 ? 3.82 : 4.88, B.maxZ - 0.12));
    var mqOff = 0, msg = '\u2605 COMING SOON TO GROK ARCADE \u2605 ' + ITEMS.map(function (it) { return it.name.toUpperCase() + ' \u00b7 ' + it.est; }).join(' \u2605 ') + ' \u2605 ';
    function drawMq() { var c = mq.g, w = 1600, hh = 160; c.fillStyle = '#0b0618'; c.fillRect(0, 0, w, hh); c.font = 'bold 84px Trebuchet MS, sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillStyle = '#fde047'; c.shadowColor = '#f97316'; c.shadowBlur = 16; var tw = c.measureText(msg).width; var x0 = -(mqOff % tw); c.fillText(msg, x0, hh / 2 + 4); c.fillText(msg, x0 + tw, hh / 2 + 4); c.shadowBlur = 0; mq.tex.needsUpdate = true; }
    drawMq(); var mqT = 0; ANIM.push(function (t, dt) { mqT += dt; if (mqT > 0.05) { mqOff += 240 * mqT; mqT = 0; drawMq(); } bulbs.forEach(function (b, k) { b.visible = (Math.floor(t * 3) + k) % 3 !== 0; }); });
    var pi = 0;
    [-6.3, -4.3, 4.3, 6.3].forEach(function (dx) { poster(ITEMS[pi], pi, cx + dx, B.maxZ - 0.05, Math.PI, 0, -1); pi++; });
    // ---- west wall: 3 posters ----
    [cz + 4.6, cz, cz - 4.6].forEach(function (z) { poster(ITEMS[pi], pi, B.minX + 0.05, z, Math.PI / 2, 1, 0); pi++; });
    // ---- south wall: 3 posters ----
    [cx - 6.3, cx - 4.3, cx - 2.3].forEach(function (x) { poster(ITEMS[pi], pi, x, B.minZ + 0.05, 0, 0, 1); pi++; });
    // ---- Ratita Industries branding: big sign above the north posters' center + logo wall ----
    sign(r, 6.2, 1.1, function (c, w, hh) { c.fillStyle = '#111827'; c.fillRect(0, 0, w, hh); c.strokeStyle = '#dc2626'; c.lineWidth = 10; c.strokeRect(6, 6, w - 12, hh - 12); txt(c, '\uD83D\uDC00 RATITA TEASER ROOM', w / 2, hh * 0.42, '#fde047', 84, w - 40); txt(c, 'by Ratita Industries \u00b7 estimates, not promises!', w / 2, hh * 0.8, '#fca5a5', 32, w - 40); }, cx, 2.9, B.maxZ - 0.08, Math.PI);
    // ---- center: Ratita Industries hologram pedestal ----
    var ho = H.prop('teaser', 'Ratita Industries hologram', cx - 1, cz + 0.5, 0); add(ho, cy(0.9, 1.1, 0.5, 24), ph('#1f2937', 70), 0, 0.25, 0); add(ho, cy(0.75, 0.75, 0.06, 24), gl('#22d3ee'), 0, 0.53, 0);
    var holo = new T.Group(); holo.position.y = 1.6; ho.add(holo); var hm = new T.MeshBasicMaterial({ color: '#67e8f9', transparent: true, opacity: 0.45, depthWrite: false });
    var hb = add(holo, sp(0.42, 16), hm, 0, 0, 0); hb.scale.set(1, 0.8, 1.4); add(holo, sp(0.24, 12), hm, 0, 0.12, 0.55); [-1, 1].forEach(function (sd) { add(holo, sp(0.13, 10), hm, sd * 0.17, 0.42, 0.42); }); var htl = add(holo, cy(0.04, 0.01, 0.9, 6), hm, 0, -0.15, -0.9); htl.rotation.x = 1.2;
    var ring = add(ho, to(0.85, 0.02, 6, 40), gl('#22d3ee'), 0, 1.0, 0); ring.rotation.x = Math.PI / 2;
    sign(ho, 1.7, 0.32, function (c, w, hh) { c.fillStyle = '#083344'; c.fillRect(0, 0, w, hh); txt(c, 'RATITA INDUSTRIES', w / 2, hh / 2, '#67e8f9', 40, w - 10); }, 0, 0.3, 1.06, 0);
    ANIM.push(function (t) { holo.rotation.y = t * 0.8; holo.position.y = 1.6 + Math.sin(t * 2) * 0.08; ring.position.y = 0.7 + ((t * 0.6) % 1) * 1.6; });
    H.solidOf(ho, 0.05);
    // ---- Release Calendar kiosk (links to the Time Jumper) ----
    var kk = H.prop('teaser', 'Release Calendar kiosk', cx + 3.2, cz + 2.2, -Math.PI / 2); add(kk, bx(1.0, 1.2, 0.6), ph('#dc2626', 50), 0, 0.6, 0); var scr = add(kk, bx(0.9, 0.7, 0.06), gl('#0f172a'), 0, 1.6, 0.05); scr.rotation.x = -0.25;
    sign(kk, 0.82, 0.6, function (c, w, hh) { c.fillStyle = '#0f172a'; c.fillRect(0, 0, w, hh); txt(c, '\uD83D\uDCC5 RELEASE', w / 2, 34, '#fde047', 26); txt(c, 'CALENDAR', w / 2, 66, '#fde047', 26); txt(c, 'TAP \u25B6 TIME JUMPER', w / 2, 100, '#5eead4', 15); }, 0, 1.6, 0.09, 0).tex; 
    kk.children[kk.children.length - 1].rotation.x = -0.25; H.solidOf(kk, 0.05);
    H.inter({ id: 'tz_cal', kind: 'at_tz_cal', root: 'teaser', name: 'Release Calendar', col: '#fde047', x: cx + 1.9, z: cz + 2.2, dir: [-1, 0], r: 1.1 });
    // ---- theater benches + velvet ropes + snacks ----
    [[cx - 3.5, cz - 2.2], [cx + 1.5, cz - 2.2]].forEach(function (q, i) { var bn = H.prop('teaser', 'Theater bench ' + i, q[0], q[1], Math.PI); add(bn, bx(2.6, 0.12, 0.7), ph('#991b1b', 20), 0, 0.48, 0); add(bn, bx(2.6, 0.7, 0.12), ph('#991b1b', 20), 0, 0.85, 0.32); [-1.15, 1.15].forEach(function (x) { add(bn, bx(0.12, 0.48, 0.66), ph('#fbbf24', 60), x, 0.24, 0); }); H.solidOf(bn, 0.05); });
    for (var ri = 0; ri < 6; ri++) { var rp = H.prop('teaser', 'Rope post ' + ri, B.minX + 2.2, B.minZ + 2.2 + ri * 2.6, 0); add(rp, cy(0.18, 0.22, 0.06, 12), ph('#fbbf24', 80), 0, 0.03, 0); add(rp, cy(0.04, 0.04, 0.9, 8), ph('#fbbf24', 80), 0, 0.48, 0); add(rp, sp(0.07, 8), ph('#fbbf24', 80), 0, 0.96, 0); if (ri < 5) { var rope = add(rp, cy(0.03, 0.03, 2.6, 6), ph('#b91c1c', 10), 0, 0.82, 1.3); rope.rotation.x = Math.PI / 2; } }
    var pc = H.prop('teaser', 'Popcorn machine', B.maxX - 1.0, B.minZ + 1.0, -Math.PI / 4); add(pc, bx(0.9, 0.9, 0.7), ph('#dc2626', 40), 0, 0.45, 0); add(pc, bx(0.9, 0.8, 0.7), new T.MeshPhongMaterial({ color: '#fef9c3', transparent: true, opacity: 0.55 }), 0, 1.3, 0); for (var pk = 0; pk < 16; pk++) add(pc, sp(0.06, 5), ph('#fef3c7', 10), (pk % 4 - 1.5) * 0.18, 1.0 + Math.floor(pk / 4) * 0.08, ((pk * 7) % 3 - 1) * 0.18); add(pc, bx(1.0, 0.12, 0.8), ph('#fbbf24', 50), 0, 1.76, 0);
    sign(pc, 0.8, 0.22, function (c, w, hh) { c.fillStyle = '#fbbf24'; c.fillRect(0, 0, w, hh); txt(c, 'POPCORN', w / 2, hh / 2, '#7f1d1d', 30); }, 0, 1.95, 0.36, 0); H.solidOf(pc, 0.05);
    var sd = H.prop('teaser', 'Soda fridge', B.maxX - 0.5, B.minZ + 3.2, -Math.PI / 2); add(sd, bx(1.0, 1.9, 0.6), ph('#1d4ed8', 50), 0, 0.95, 0); add(sd, bx(0.85, 1.5, 0.03), new T.MeshPhongMaterial({ color: '#bfdbfe', transparent: true, opacity: 0.6 }), 0, 1.05, 0.31); for (var sdy = 0; sdy < 3; sdy++) for (var sdx = 0; sdx < 4; sdx++) add(sd, cy(0.05, 0.05, 0.22, 8), ph(['#ef4444', '#22c55e', '#f59e0b'][sdy], 40), -0.3 + sdx * 0.2, 0.55 + sdy * 0.45, 0.15); H.solidOf(sd, 0.05);
    [[B.minX + 0.7, B.maxZ - 0.7], [B.maxX - 0.7, B.maxZ - 0.7], [B.minX + 0.7, B.minZ + 0.7]].forEach(function (q, i) { var pt = H.prop('teaser', 'Plant ' + i, q[0], q[1], 0); add(pt, cy(0.28, 0.22, 0.5, 14), ph('#b45309', 20), 0, 0.25, 0); for (var l = 0; l < 7; l++) { var lf = add(pt, sp(0.2, 8), ph('#16a34a', 15), Math.cos(l) * 0.18, 0.7 + (l % 3) * 0.15, Math.sin(l) * 0.18); lf.scale.set(0.6, 1.3, 0.6); } H.solidOf(pt, 0.05); });
    // ---- pet cameos: rats on the front bench, Candy guarding the popcorn, Torty by the calendar ----
    var pr = H.prop('teaser', 'Pet crew', cx - 3.5, cz - 2.2, 0);
    rat(pr, -0.8, 0, 0, '#6b7280', 'LUNA \u00b7 grey fancy rat'); rat(pr, 0, 0, 0, '#f1efe9', 'PI-RAT \u00b7 one-eyed hooded rat', true); rat(pr, 0.8, 0, 0, '#f8fafc', 'SNOWIE \u00b7 white fancy rat');
    pr.children.forEach(function (g) { g.position.y = 0.55; });
    schnauzer(R(), B.maxX - 2.2, B.minZ + 1.6, -0.6); tortoise(R(), cx + 3.2, cz + 3.6, -Math.PI / 2);
    // ---- door back to the Preview Center (east wall) ----
    var ed = H.prop('teaser', 'Teaser Room door', B.maxX - 0.1, cz, -Math.PI / 2); add(ed, bx(1.6, 2.7, 0.12), ph('#7f1d1d', 50), 0, 1.35, 0); add(ed, bx(1.3, 2.4, 0.04), ph('#fca5a5', 50), 0, 1.3, 0.07);
    sign(ed, 1.6, 0.3, function (c, w, hh) { c.fillStyle = '#111827'; c.fillRect(0, 0, w, hh); txt(c, '\u23EA PREVIEW CENTER', w / 2, hh / 2, '#5eead4', 30); }, 0, 2.95, 0.08, 0);
    H.inter({ id: 'tz_exit', kind: 'at_tz_exit', root: 'teaser', name: 'Back to the Preview Center', col: '#5eead4', x: B.maxX - 1.3, z: cz, dir: [-1, 0], r: 1.0 });
    // ---- the door in the Ratita Preview Center (west wall, south of the poster row) ----
    H.mkRoot('teaser_door'); var md = H.prop('teaser_door', 'Ratita Teaser Room door', DOOR.x + 0.08, DOOR.z, Math.PI / 2);
    add(md, bx(1.4, 2.8, 0.14), ph('#7f1d1d', 50), 0, 1.4, 0); add(md, bx(1.05, 2.45, 0.05), ph('#fde047', 50, '#3a2400'), 0, 1.28, 0.08);
    sign(md, 1.6, 0.36, function (c, w, hh) { c.fillStyle = '#111827'; c.fillRect(0, 0, w, hh); c.strokeStyle = '#dc2626'; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, hh - 6); txt(c, '\uD83C\uDF9F\uFE0F TEASER ROOM', w / 2, hh / 2 + 2, '#fde047', 34, w - 16); }, 0, 3.1, 0.1, 0);
    H.inter({ id: 'tz_door', kind: 'at_tz_door', root: 'teaser_door', name: 'Ratita Teaser Room', col: '#fde047', x: DOOR.x + 1.3, z: DOOR.z, dir: [1, 0], r: 0.9 });
    r.visible = false;
    var ct0 = GA.Hub.camTune; GA.Hub.camTune = function (a) { return a === 'teaser' ? { pitch: 0.5, dist: 7.2, ahead: 2.2, fov: 10 } : (ct0 ? ct0(a) : null); };
    if (GA.Areas) { if (GA.Areas.FOGS) GA.Areas.FOGS.teaser = ['#1e1037', 20, 50]; if (GA.Areas.ARRIVE) { var go = GA.Areas.goTo; GA.Areas.ARRIVE.teaser = function () { go(B.spawn.x, B.spawn.z, -1, 0); }; GA.Areas.ARRIVE.teaser_out = function () { go(DOOR.x + 1.6, DOOR.z, 1, 0); }; GA.Areas.ARRIVE.teaser_jumper = function () { go(-9.5, 32.2, 0, 1); }; } }
    if (GA.Mimi) { var h0 = GA.Mimi.handles, p0 = GA.Mimi.prompt, o0 = GA.Mimi.open; GA.Mimi.handles = function (k) { return /^at_tz_/.test(k) || h0(k); }; GA.Mimi.prompt = function (cab) { return /^at_tz_/.test(cab.kind) ? prompt(cab) : p0.apply(this, arguments); }; GA.Mimi.open = function (cab) { return /^at_tz_/.test(cab.kind) ? open(cab) : o0.apply(this, arguments); };
      if (GA.Mimi.DEST && !GA.Mimi.DEST.some(function (d) { return d[2] === 'tz_door'; })) GA.Mimi.DEST.push(['\uD83C\uDF9F\uFE0F', 'Ratita Teaser Room', 'tz_door']); }
    if (GA.AtticUI) { var m0 = GA.AtticUI.map; GA.AtticUI.map = function (a) { return a === 'teaser' ? { minX: B.minX - 1, maxX: B.maxX + 1, minZ: B.minZ - 1, maxZ: B.maxZ + 1, rooms: [['TEASER ROOM', B.minX, B.maxX, B.minZ, B.maxZ, '#fde047']], marks: function () { return [['\uD83D\uDCC5', cx + 3.2, cz + 2.2], ['\uD83D\uDC00', cx - 1, cz + 0.5], ['\uD83D\uDEAA', B.maxX - 0.6, cz]]; } } : (m0 ? m0(a) : null); }; }
    TZ.built = true;
  }
  function prompt(cab) { var k = cab.kind;
    if (k === 'at_tz_door') return { tag: 'COMING SOON', name: 'Ratita Teaser Room', desc: 'Posters for every upcoming game, DLC, remaster and sequel, with estimated release dates.', btn: 'ENTER', key: 'enter', cls: 'npc' };
    if (k === 'at_tz_exit') return { tag: 'TEASER ROOM', name: 'Back to the Preview Center', desc: 'Out to Lili\u2019s Preview Center and the Time Jumper.', btn: 'EXIT', key: 'exit', cls: 'npc' };
    if (k === 'at_tz_cal') return { tag: 'RATITA INDUSTRIES', name: 'Release Calendar', desc: 'Every upcoming release in order, with links to the Time Jumper.', btn: 'OPEN', key: 'open', cls: 'npc' };
    var it = ITEMS[cab.data.i]; return { tag: it.kind.toUpperCase() + ' \u00b7 EST. ' + it.est.toUpperCase(), name: it.name, desc: it.when + '. ' + it.pet + '.', btn: it.slug ? '\u25B6 PREVIEW' : 'LOOK', key: 'look', cls: 'npc' };
  }
  function open(cab) { var k = cab.kind;
    if (k === 'at_tz_door') return GA.Areas.travel('teaser');
    if (k === 'at_tz_exit') return GA.Areas.travel('teaser_out');
    if (k === 'at_tz_cal') return UI.show();
    UI.item(cab.data.i);
  }
  // ================= DOM UI =================
  function root0() { var p = location.pathname, i = p.indexOf('/previews/'); if (i < 0) i = p.indexOf('/archive/'); return i >= 0 ? p.slice(0, i + 1) : p.replace(/[^/]*$/, ''); }
  TZ.previewUrl = function (slug) { return root0() + 'previews/' + slug + '/'; };
  var css = '#tzUI{position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;background:rgba(20,6,30,.6);font-family:Trebuchet MS,sans-serif}#tzUI.on{display:flex}#tzUI .p{background:#1e1037;color:#fff;border:4px solid #fde047;border-radius:18px;width:min(640px,94vw);max-height:86vh;overflow:auto;padding:16px 18px;position:relative}#tzUI h2{margin:0 0 6px;color:#fde047}#tzUI .x{position:absolute;right:10px;top:8px;background:#dc2626;color:#fff;border:0;border-radius:10px;font:bold 16px sans-serif;padding:4px 10px;cursor:pointer}#tzUI .row{display:flex;gap:10px;align-items:center;background:#2a1650;border-left:6px solid #fde047;border-radius:10px;padding:8px 10px;margin:6px 0}#tzUI .row .ic{font-size:26px}#tzUI .row .n{flex:1}#tzUI .row b{display:block}#tzUI .row small{color:#d8b4fe}#tzUI .est{font-weight:bold;color:#fde047;white-space:nowrap}#tzUI a.go,#tzUI button.go{display:inline-block;background:#14b8a6;color:#fff;border:0;border-radius:10px;padding:6px 10px;font:bold 13px Trebuchet MS,sans-serif;text-decoration:none;cursor:pointer;margin-top:4px}#tzUI .note{color:#fca5a5;font-size:12px;margin-top:8px}';
  var UI = TZ.UI = {}, rootEl;
  function el() { if (rootEl) return rootEl; var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); rootEl = document.createElement('div'); rootEl.id = 'tzUI'; document.body.appendChild(rootEl); return rootEl; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function row(it) { return '<div class="row" style="border-left-color:' + it.col + '"><span class="ic">' + it.icon + '</span><span class="n"><b>' + esc(it.name) + '</b><small>' + esc(it.kind + (it.issue ? ' \u00b7 #' + it.issue : '') + ' \u00b7 ' + it.when) + '</small>' + (it.slug ? '<br><a class="go" href="' + TZ.previewUrl(it.slug) + '">\u25B6 Play the preview</a>' : it.liveUrl ? '<br><a class="go" href="' + root0() + it.liveUrl + '">\u25B6 Play it now (live)</a>' : '') + '</span><span class="est">' + esc(it.est) + '</span></div>'; }
  function render(h) { var r = el(); r.innerHTML = '<div class="p"><button class="x" data-tz="close">\u2715</button>' + h + '<p><button class="go" data-tz="jump">\uD83D\uDD70\uFE0F Walk to the Time Jumper</button></p><div class="note">Dates are Ratita Industries estimates. Nothing ships until David says greenlight!</div></div>'; r.classList.add('on'); }
  UI.show = function () { render('<h2>\uD83D\uDCC5 Release Calendar</h2>' + ITEMS.map(row).join('')); };
  UI.item = function (i) { var it = ITEMS[i]; render('<h2>' + it.icon + ' Coming soon</h2>' + row(it) + '<p>\uD83D\uDC3E Pet cameo: ' + esc(it.pet) + '</p>'); };
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('#tzUI [data-tz]'); if (!b) return; var a = b.getAttribute('data-tz'); el().classList.remove('on'); if (a === 'jump' && GA.Areas) GA.Areas.travel('teaser_jumper'); });
  TZ.open = function () { if (GA.Areas && GA.Areas.travel && TZ.built) GA.Areas.travel('teaser'); };
  TZ.build = function () { if (TZ.built || !GA.Attic || !GA.Attic.H) return; H = GA.Attic.H(); A = H.A; add = H.add; bx = H.bx; cy = H.cy; sp = H.sp; to = H.to; cvs = H.cvs; texPlane = H.texPlane; build(); if (WANT) { WANT = false; setTimeout(function () { GA.Areas.travel('teaser'); }, 400); } };
  TZ.frame = function (t, dt) { if (!TZ.built) return; var on = GA.Hub.area() === 'teaser'; if (on !== live) { live = on; H.R.teaser.visible = on; } if (on) ANIM.forEach(function (f) { f(t, dt || 0.016); }); };
})();
