/* Grok Arcade - THE MYSTERIOUS ATTIC (3D + quest state). UI/puzzles live in js/attic-ui.js.
   Quest: find the hidden ceiling hatch (moves between 5 spots on the claw machines' 3-day clock, same for everyone) ->
   borrow Gary's ladder -> the keypad is dead: Gary remembers his long-lost brother Larry in the basement MAINTENANCE room ->
   sort Larry's fuse rack for a fuse -> install it -> beat the target score on Larry's old Ghost Lantern '83 cabinet to get the code ->
   the attic opens. Inside: six spooky (friendly!) rooms, clues that unlock a locked corridor to the Cobweb Library, a secret bookcase
   to the Foggy Observatory, spirit marbles, a weekly puzzle room + a weekly hidden mystery opus (both from the ISO week).
   Far-away regions: attic x -112..-72, library + observatory further south, maintenance room east of the basement. */
(function () {
  'use strict';
  var T = THREE, A, AT = GA.Attic = {}, mats = {}, G = {};
  function ph(c, s, e) { var k = 'p' + c + (s || 30) + (e || ''); return mats[k] || (mats[k] = new T.MeshPhongMaterial({ color: c, shininess: s || 30, specular: '#555555', emissive: e ? new T.Color(e) : new T.Color(0) })); }
  function lm(c) { var k = 'l' + c; return mats[k] || (mats[k] = new T.MeshLambertMaterial({ color: c })); }
  function gl(c) { var k = 'g' + c; return mats[k] || (mats[k] = new T.MeshBasicMaterial({ color: c })); }
  function add(par, geo, mat, x, y, z) { var m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); par.add(m); return m; }
  function geo(k, f) { return G[k] || (G[k] = f()); }
  function bx(w, h, d) { return geo('b' + w + ',' + h + ',' + d, function () { return new T.BoxGeometry(w, h, d); }); }
  function cy(a, b, h, s) { return geo('c' + a + ',' + b + ',' + h + ',' + (s || 20), function () { return new T.CylinderGeometry(a, b, h, s || 20); }); }
  function sp(r, s) { return geo('s' + r + ',' + (s || 18), function () { return new T.SphereGeometry(r, s || 18, Math.max(8, Math.round((s || 18) * 0.7))); }); }
  function to(r, t, arc, s) { return geo('t' + r + ',' + t + ',' + (arc || 7) + ',' + (s || 28), function () { return new T.TorusGeometry(r, t, 8, s || 28, arc || Math.PI * 2); }); }
  function cn(r, h, s) { return geo('k' + r + ',' + h + ',' + (s || 16), function () { return new T.ConeGeometry(r, h, s || 16); }); }
  function F(px, w) { return (w || 'bold') + ' ' + px + 'px "Trebuchet MS",system-ui,sans-serif'; }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function cvs(w, h, draw) { var c = A.mkCanvas(w, h), g = c.getContext('2d'); if (draw) draw(g, w, h); var t = A.canvasTex(c); return { c: c, g: g, tex: t }; }
  function glowText(g, s, x, y, px, col, maxW) { g.font = F(px); while (g.measureText(s).width > (maxW || 9999) && px > 8) { px -= 2; g.font = F(px); } g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = col; g.shadowBlur = px * 0.35; g.fillStyle = col; g.fillText(s, x, y); g.shadowBlur = 0; }
  function texPlane(w, h, tex, o) { o = o || {}; var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, transparent: !!o.transparent, side: o.double ? T.DoubleSide : T.FrontSide, depthWrite: !o.transparent })); return m; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  AT.hash = hash; AT.rng = rng;

  /* ---------- saved quest state ---------- */
  var S = GA.store.get('attic', null) || {};
  function D(k, v) { if (S[k] === undefined) S[k] = v; }
  D('seed', Math.floor(Math.random() * 1e9)); D('found', false); D('ladder', 'gary'); D('keypadSeen', false); D('maintTold', false); D('larryMet', false); D('fuse', 'none'); D('postcard', 'none');
  D('codeSeen', false); D('opened', false); D('clues', {}); D('door1', false); D('books', false); D('stars', {}); D('orbs', {}); D('weekly', {}); D('opus', {}); D('visited', {}); D('portraitTries', 0); D('jack', false); D('prizes', {});
  function save() { GA.store.set('attic', S); if (AT.onChange) AT.onChange(); }
  AT.S = function () { return S; }; AT.save = save;
  AT.reset = function () { S = { seed: S.seed }; ['found', 'keypadSeen', 'maintTold', 'larryMet', 'codeSeen', 'opened', 'door1', 'books', 'jack'].forEach(function (k) { S[k] = false; }); S.ladder = 'gary'; S.fuse = 'none'; S.postcard = 'none'; S.clues = {}; S.stars = {}; S.orbs = {}; S.weekly = {}; S.opus = {}; S.visited = {}; S.portraitTries = 0; S.prizes = {}; save(); AT.refresh(); };
  AT._reload = function () { S = GA.store.get('attic', null) || S; AT.refresh(); };
  // the keypad code is personal (from your own saved seed), so it can't be shared or guessed from someone else's game
  AT.code = function () { var r = rng(hash('attic-code:' + S.seed)), s = ''; for (var i = 0; i < 4; i++) s += Math.floor(r() * 10); return s; };

  /* ---------- clocks ---------- */
  AT._now = null; // tests: GA.Attic._now = Date.parse('2026-10-20T12:00:00Z')
  function now() { return AT._now != null ? AT._now : (GA.Areas && GA.Areas._now != null ? GA.Areas._now : Date.now()); }
  AT.period = function () { return GA.Claw && GA.Claw.period ? GA.Claw.period() : Math.floor(Math.floor(Date.now() / 864e5) / 3); }; // same 3-day clock as the claw machines
  AT.daysLeft = function () { return GA.Claw && GA.Claw.daysLeft ? GA.Claw.daysLeft() : 3; };
  AT.week = function () { return GA.Areas && GA.Areas.isoWeek ? GA.Areas.isoWeek(now()) : { key: 'w', w: 1, y: 2026 }; };
  AT.weekKey = function () { return AT.week().key; };
  AT.weekSeed = function () { return hash('attic-week:' + AT.weekKey()); };
  /* hatch hide spots (5). Never shown to players; the rotation picks one per 3-day period, same order for everyone. */
  var SPOTS = [{ x: -15.2, z: 6.6, a: 'main' }, { x: -16.0, z: -8.0, a: 'main' }, { x: 13.4, z: 10.4, a: 'bonus' }, { x: 3.4, z: 24.6, a: 'hall' }, { x: -3.0, z: 24.4, a: 'food' }];
  AT.SPOTS = SPOTS;
  function cycle(c) { var r = rng(hash('attic-hatch:' + c)), ord = [0, 1, 2, 3, 4]; for (var i = 4; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = ord[i]; ord[i] = ord[j]; ord[j] = t; } return ord; }
  // every spot once per 15 days, in a shuffled order, and never the same spot twice in a row
  AT.spotIndex = function (p) { p = p == null ? AT.period() : p; var c = Math.floor(p / 5), ord = cycle(c), prev = cycle(c - 1)[4]; if (ord[0] === prev) { var t = ord[0]; ord[0] = ord[1]; ord[1] = t; } return ord[((p % 5) + 5) % 5]; };
  AT.spot = function () { return SPOTS[AT.spotIndex()]; };
  // weekly content
  AT.THEMES = [{ id: 'clock', name: 'Clockwork Room', icon: '\u2699\uFE0F' }, { id: 'candle', name: 'Candle Room', icon: '\uD83D\uDD6F\uFE0F' }, { id: 'mirror', name: 'Hall of Mirrors', icon: '\uD83E\uDE9E' }, { id: 'kitchen', name: 'Haunted Kitchen', icon: '\uD83E\uDDEA' }];
  AT.weekNum = function () { var w = AT.week(); return (w.y || 2026) * 53 + (w.w || 1); }; // consecutive weeks always differ
  AT.theme = function () { return AT.THEMES[AT.weekNum() % AT.THEMES.length]; };
  AT.weeklyDone = function () { return !!S.weekly[AT.weekKey()]; };
  var OPUS = [{ r: 'attic', x: -110.6, z: -2.2 }, { r: 'attic', x: -86.2, z: -1.8 }, { r: 'attic', x: -73.2, z: 1.6 }, { r: 'attic2', x: -110.6, z: 44.5 }, { r: 'attic3', x: -104.0, z: 74.2 }, { r: 'attic', x: -97.4, z: -12.8 }];
  AT.opusSpot = function () { return OPUS[(AT.weekNum() * 5) % OPUS.length]; };
  AT.opusDone = function () { return !!S.opus[AT.weekKey()]; };
  AT.oddPortrait = function () { return (AT.weekNum() * 7 + 3) % 6; };
  AT.BOOK_COLS = [['RED', '#ef4444'], ['BLUE', '#3b82f6'], ['GREEN', '#22c55e'], ['GOLD', '#facc15'], ['PURPLE', '#a855f7'], ['WHITE', '#f8fafc']];
  AT.bookOrder = function () { var r = rng(hash('attic-books:' + S.seed)), a = [0, 1, 2, 3, 4, 5]; for (var i = 5; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a.slice(0, 3); };
  AT.CLUE_IDS = ['portrait', 'music', 'toys'];
  AT.clueCount = function () { return AT.CLUE_IDS.filter(function (k) { return S.clues[k]; }).length; };
  AT.ORB_N = 8;
  AT.orbCount = function () { return Object.keys(S.orbs).length; };

  /* ---------- the current objective (never names a place) ---------- */
  AT.objective = function () {
    if (!S.found) return { t: 'Gus swears there was an attic once\u2026 Search the arcade. Listen for creaks and look for dust.', step: 1 };
    if (S.ladder === 'gary' && !S.opened) return { t: 'The hatch is way too high. Borrow a ladder from someone handy.', step: 2 };
    if (S.ladder === 'carry') return { t: 'Bring the ladder back to the hatch. (It moves every few days!)', step: 2 };
    if (!S.keypadSeen) return { t: 'Climb the ladder and check the hatch.', step: 3 };
    if (S.fuse === 'none' && !S.maintTold) return { t: 'The keypad is dead: it needs a FUSE. Ask the IT guy.', step: 3 };
    if (S.fuse === 'none') return { t: 'Find the maintenance room and help out to get a fuse.', step: 3 };
    if (S.fuse === 'have') return { t: 'Install the fuse in the hatch keypad.', step: 3 };
    if (!S.codeSeen && !S.opened) return { t: 'The keypad wants a code. An old ghost cabinet knows it: beat ' + (GA.GHOST_TARGET || 30) + ' points.', step: 4 };
    if (!S.opened) return { t: 'Enter the code at the hatch keypad.', step: 4 };
    if (!S.door1) return { t: 'Explore the attic. Find clues (' + AT.clueCount() + '/3) to open the locked corridor.', step: 5 };
    if (!S.books) return { t: 'Something in the library is out of order\u2026 use your clues.', step: 5 };
    if (!S.stars[AT.weekKey()] && !S.stars.ever) return { t: 'Look through the observatory telescope.', step: 5 };
    return { t: 'Attic explored! New weekly puzzle + mystery opus every week. Marbles ' + AT.orbCount() + '/' + AT.ORB_N + '.', step: 6 };
  };
  AT.ev = function (k, n) { if (GA.Prog) GA.Prog.event(k, n); };
  AT.grant = function (id) { if (S.prizes[id]) return false; S.prizes[id] = Date.now(); save(); if (GA.Prog && GA.Prog.grant) GA.Prog.grant(id); return true; };

  /* ---------- regions ---------- */
  var ATT = { name: 'attic', minX: -112, maxX: -72, minZ: -14, maxZ: 14, maxY: 7, H: 3.2, ridge: 6.3, spawn: { x: -92, z: 9.2 } };
  var LIB = { name: 'attic2', minX: -112, maxX: -92, minZ: 30, maxZ: 46, maxY: 6, H: 4.6, spawn: { x: -94.4, z: 38 } };
  var OBS = { name: 'attic3', minX: -112, maxX: -92, minZ: 60, maxZ: 76, maxY: 9, H: 4.4, spawn: { x: -94.4, z: 68 } };
  var MNT = { name: 'maint', minX: 20, maxX: 34, minZ: 100, maxZ: 112, maxY: 5, H: 3.6, spawn: { x: 22.6, z: 106 } };
  AT.ATT = ATT; AT.LIB = LIB; AT.OBS = OBS; AT.MNT = MNT;
  var R = {}, CABS = {}, ANIM = { attic: [], attic2: [], attic3: [], maint: [], any: [] };
  AT.R = R;
  function mkRoot(k) { var g = new T.Group(); g.name = 'attic:' + k; A.scene.add(g); R[k] = g; return g; }
  function prop(root, name, x, z, ry) { var g = new T.Group(); g.name = name; g.position.set(x, 0, z); g.rotation.y = ry || 0; R[root].add(g); return g; }
  function reg(g, kind) { g.updateMatrixWorld(true); return A.regItem(g.name, kind || 'prop', g); }
  function solidOf(g, pad) { g.updateMatrixWorld(true); var b = new T.Box3(); g.traverse(function (o) { if (!o.isMesh) return; for (var q = o; q; q = q.parent) if (q.userData.noAudit) return; b.expandByObject(o); }); if (b.isEmpty()) return; pad = pad || 0; A.addSolid(b.min.x - pad, b.max.x + pad, b.min.z - pad, b.max.z + pad, g.name); }
  function wallBox(root, x0, x1, z0, z1, h, mat) { var m = add(R[root], bx(Math.max(0.05, x1 - x0), h, Math.max(0.05, z1 - z0)), mat, (x0 + x1) / 2, h / 2, (z0 + z1) / 2); A.noAud(m); A.addWall(x0, x1, -1, h, z0, z1); return m; }
  function inter(o) {
    var dir = new T.Vector3(o.dir[0], 0, o.dir[1]).normalize();
    var gm = new T.MeshBasicMaterial({ map: A.glowTex, color: o.col || '#a7f3d0', transparent: true, opacity: 0.28, depthWrite: false, blending: T.AdditiveBlending });
    var fl = add(R[o.root], new T.PlaneGeometry(o.gw || 1.5, o.gh || 1.2), gm, o.x, 0.03, o.z); fl.rotation.x = -Math.PI / 2; fl.renderOrder = 2; A.noAud(fl); if (o.hideGlow) fl.visible = false;
    var anchor = new T.Object3D(); anchor.position.set(o.x - dir.x * 1.75, 0, o.z - dir.z * 1.75); anchor.rotation.y = Math.atan2(dir.x, dir.z); R[o.root].add(anchor); anchor.updateMatrixWorld(true);
    var cab = { game: { id: o.id, name: o.name, desc: o.desc || '', color: o.col || '#a7f3d0' }, kind: o.kind, id: o.id, group: anchor, x: o.x, z: o.z, rot: anchor.rotation.y,
      front: new T.Vector3(o.x, 0, o.z), dir: dir, glow: gm, glowMesh: fl, nextDraw: Infinity, r: o.r || 1.2, area: o.root, ar: true, at: true, data: o.data || {} };
    A.cabinets.push(cab); CABS[o.id] = cab; return cab;
  }
  AT.cab = function (id) { return CABS[id]; };
  AT.H = function () { return { ph: ph, lm: lm, gl: gl, add: add, bx: bx, cy: cy, sp: sp, cn: cn, to: to, cvs: cvs, glowText: glowText, texPlane: texPlane, bubble: bubble, inter: inter, prop: prop, reg: reg, solidOf: solidOf, rr: rr, F: F, mkRoot: mkRoot, R: R, A: A, rng: rng, hash: hash }; };
  AT.ids = function () { return Object.keys(CABS); };
  function moveCab(cab, x, z) { cab.x = x; cab.z = z; cab.front.set(x, 0, z); cab.group.position.set(x - cab.dir.x * 1.75, 0, z - cab.dir.z * 1.75); cab.group.updateMatrixWorld(true); cab.glowMesh.position.set(x, 0.03, z); }
  function bubble(par, y) {
    var c = A.mkCanvas(512, 200), t = A.canvasTex(c); t.minFilter = T.LinearFilter; t.generateMipmaps = false;
    var s = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false })); s.scale.set(2.3, 0.9, 1); s.position.set(0, y, 0); s.visible = false; s.renderOrder = 10; par.add(s); A.noAud(s);
    var b = { s: s, left: 0, line: null };
    b.say = function (text, secs) { var g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      g.fillStyle = '#f4f7ff'; g.strokeStyle = '#4c3a7a'; g.lineWidth = 6; rr(g, 6, 6, w - 12, h - 46, 26); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(w / 2 - 20, h - 42); g.lineTo(w / 2, h - 8); g.lineTo(w / 2 + 20, h - 42); g.closePath(); g.fill(); g.stroke(); g.fillRect(w / 2 - 17, h - 46, 34, 6);
      g.fillStyle = '#2a1a40'; g.textAlign = 'center'; g.textBaseline = 'middle'; var px = 30, lines; function wrap() { lines = []; var cur = ''; g.font = F(px); String(text).split(' ').forEach(function (wd) { var q = cur ? cur + ' ' + wd : wd; if (g.measureText(q).width > w - 44) { lines.push(cur); cur = wd; } else cur = q; }); if (cur) lines.push(cur); }
      wrap(); if (lines.length > 3) { px = 24; wrap(); lines = lines.slice(0, 4); } lines.forEach(function (ln, i) { g.fillText(ln, w / 2, (h - 40) / 2 + (i - (lines.length - 1) / 2) * (px + 4)); });
      t.needsUpdate = true; s.visible = true; b.left = secs || 4.5; b.line = text; };
    b.tick = function (dt) { if (b.left > 0) { b.left -= dt; s.material.opacity = Math.min(1, b.left * 2); if (b.left <= 0) s.visible = false; } };
    return b;
  }
  var NPC = {}; AT.say = function (who, s, secs) { if (NPC[who] && NPC[who].bub) NPC[who].bub.say(s, secs || 5); };
  AT.npcLine = function (who) { return NPC[who] && NPC[who].bub ? NPC[who].bub.line : null; };
  function plankTex(base, line, rep) { var c = cvs(256, 256, function (g, w, h) { g.fillStyle = base; g.fillRect(0, 0, w, h); for (var i = 0; i < 8; i++) { g.fillStyle = i % 2 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.04)'; g.fillRect(0, i * 32, w, 31); g.fillStyle = line; g.fillRect(0, i * 32 + 31, w, 1.5); g.fillRect((i * 97) % w, i * 32, 1.5, 32); }
      for (i = 0; i < 40; i++) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 1); } }); c.tex.wrapS = c.tex.wrapT = T.RepeatWrapping; if (rep) c.tex.repeat.set(rep[0], rep[1]); return c.tex; }
  function cobweb() { var w = cvs(128, 128, function (c) { c.strokeStyle = 'rgba(235,235,245,.6)'; c.lineWidth = 1.4; for (var k = 0; k < 7; k++) { var a = k / 6 * Math.PI / 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 128, Math.sin(a) * 128); c.stroke(); } for (var r2 = 18; r2 < 128; r2 += 20) { c.beginPath(); for (k = 0; k <= 6; k++) { var a2 = k / 6 * Math.PI / 2, rr2 = r2 + (k % 2) * 4; if (k) c.lineTo(Math.cos(a2) * rr2, Math.sin(a2) * rr2); else c.moveTo(Math.cos(a2) * rr2, Math.sin(a2) * rr2); } c.stroke(); } }); return w.tex; }
  function dust(root, cx, cz, w, d, h, n, col) { var pos = new Float32Array(n * 3), seed = []; for (var i = 0; i < n; i++) { pos[i * 3] = cx + (Math.random() - 0.5) * w; pos[i * 3 + 1] = Math.random() * h; pos[i * 3 + 2] = cz + (Math.random() - 0.5) * d; seed.push(Math.random() * 6); }
    var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.BufferAttribute(pos, 3)); var pm = new T.PointsMaterial({ color: col || '#fff3c4', size: 0.05, transparent: true, opacity: 0.6, depthWrite: false }); var pts = new T.Points(gg, pm); R[root].add(pts); A.noAud(pts);
    return { pts: pts, tick: function (t, dt, fall) { var a = gg.attributes.position.array; for (var i = 0; i < n; i++) { a[i * 3 + 1] -= dt * (fall || 0.05); a[i * 3] += Math.sin(t * 0.7 + seed[i]) * dt * 0.05; if (a[i * 3 + 1] < 0) a[i * 3 + 1] = h; } gg.attributes.position.needsUpdate = true; } }; }
  function ghostNpc(root, name, x, z, tint, y) { var g = GA.AtticGhost(tint); g.position.set(x, y || 1.1, z); R[root].add(g); var bub = bubble(g, 1.2); NPC[name] = { g: g, bub: bub, y: y || 1.1, ph: Math.random() * 6 };
    ANIM.any.push(function (t, dt) { var n = NPC[name]; if (!n.g.parent.visible) return; n.bub.tick(dt); n.g.position.y = n.y + Math.sin(t * 1.6 + n.ph) * 0.12; var p = A.pose(); n.g.rotation.y = Math.atan2(p.x - n.g.position.x, p.z - n.g.position.z) * 0.9; });
    return g; }
  AT._ghostNpc = ghostNpc;

  /* =========================================================================================
     A) THE HATCH (in the arcade ceiling, moves every 3 days) + Gary's ladder
     ========================================================================================= */
  var HT = {};
  function buildHatch() {
    var r = mkRoot('hatch'), H = A.ROOM.h || 5, g = new T.Group(); g.name = 'attic hatch'; r.add(g); HT.g = g; A.noAud(g);
    var wood = ph('#6b4a2e', 20), dark = ph('#3b2a1b', 10);
    [[0, -0.68, 1.5, 0.1], [0, 0.68, 1.5, 0.1], [-0.68, 0, 0.1, 1.46], [0.68, 0, 0.1, 1.46]].forEach(function (q) { add(g, bx(q[2], 0.08, q[3]), wood, q[0], H - 0.05, q[1]); });
    var door = new T.Group(); door.position.set(-0.62, H - 0.06, 0); g.add(door); HT.door = door;
    add(door, bx(1.24, 0.05, 1.26), ph('#8a6a48', 15), 0.62, 0, 0); [-0.4, 0, 0.4].forEach(function (z) { add(door, bx(1.2, 0.02, 0.04), dark, 0.62, -0.035, z); });
    var cord = new T.Group(); cord.position.set(1.0, -0.03, 0); door.add(cord); add(cord, cy(0.008, 0.008, 0.8, 6), lm('#e7dcc0'), 0, -0.4, 0); add(cord, to(0.05, 0.012), ph('#c9a227', 80), 0, -0.84, 0); HT.cord = cord;
    // a thin warm light leaking around the gap + dust drifting down + a tiny dust pile on the floor
    var leak = add(g, new T.PlaneGeometry(1.3, 1.3), new T.MeshBasicMaterial({ color: '#ffd9a0', transparent: true, opacity: 0.0, depthWrite: false, blending: T.AdditiveBlending }), 0, H - 0.1, 0); leak.rotation.x = Math.PI / 2; HT.leak = leak;
    var n = 70, pos = new Float32Array(n * 3); for (var i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 1.1; pos[i * 3 + 1] = Math.random() * H; pos[i * 3 + 2] = (Math.random() - 0.5) * 1.1; }
    var dg = new T.BufferGeometry(); dg.setAttribute('position', new T.BufferAttribute(pos, 3)); HT.dust = new T.Points(dg, new T.PointsMaterial({ color: '#f5e6c8', size: 0.045, transparent: true, opacity: 0.55, depthWrite: false })); g.add(HT.dust);
    var pile = add(g, new T.CircleGeometry(0.45, 20), new T.MeshBasicMaterial({ color: '#bfae8f', transparent: true, opacity: 0.22, depthWrite: false }), 0.1, 0.022, 0.05); pile.rotation.x = -Math.PI / 2;
    // the ladder (placed under the hatch once you bring Gary's ladder)
    var lad = new T.Group(); g.add(lad); HT.ladder = lad; var lw = ph('#c08a4a', 25);
    [-1, 1].forEach(function (sd) { var rail = add(lad, bx(0.07, H + 0.25, 0.07), lw, sd * 0.24, (H + 0.25) / 2, 0); void rail; }); for (var k = 0; k < 15; k++) add(lad, cy(0.025, 0.025, 0.48, 8), lw, 0, 0.3 + k * 0.33, 0).rotation.z = Math.PI / 2;
    lad.position.set(0.15, 0, 0.75); lad.rotation.x = -0.12;
    HT.cab = inter({ id: 'at_hatch', kind: 'at_hatch', root: 'hatch', name: 'A draft from above\u2026', col: '#ffd9a0', x: 0, z: 0, dir: [0, 1], r: 1.15, hideGlow: true });
    HT.cab.noStand = true; HT.idx = -1;
    // Gary's ladder leaning on the wall behind the IT desk (you can borrow it)
    var gl2 = GA.AtticLadderModel(); gl2.scale.set(1.2, 1.5, 1.2); gl2.position.set(0.55, 0, A.ROOM.maxZ - 0.2); gl2.rotation.x = 0.16; r.add(gl2); A.noAud(gl2); HT.garyLadder = gl2;
    placeHatch(true);
  }
  function placeHatch(force) { var i = AT.spotIndex(); if (i === HT.idx && !force) return; HT.idx = i; var s = SPOTS[i]; HT.g.position.set(s.x, 0, s.z); moveCab(HT.cab, s.x, s.z); HT.g.updateMatrixWorld(true); refreshHatch(); }
  function refreshHatch() { if (!HT.g) return; HT.ladder.visible = S.ladder === 'placed'; HT.garyLadder.visible = S.ladder === 'gary'; HT.door.rotation.z = S.opened ? -0.9 : 0; HT.leak.material.opacity = S.opened ? 0.35 : 0.05;
    HT.cab.game.name = !S.found ? 'A draft from above\u2026' : S.opened ? 'The attic hatch' : 'The attic hatch (locked)'; }
  AT.refresh = function () { refreshHatch(); if (AT._refreshInside) AT._refreshInside(); };
  AT.placeHatch = placeHatch;
  var creakT = 0;
  function hatchFrame(t, dt) {
    if (!HT.g) return; placeHatch();
    var p = A.pose(), d = Math.hypot(p.x - HT.g.position.x, p.z - HT.g.position.z), a = HT.dust.geometry.attributes.position.array, H = A.ROOM.h || 5;
    for (var i = 0; i < a.length; i += 3) { a[i + 1] -= dt * 0.35; a[i] += Math.sin(t + i) * dt * 0.04; if (a[i + 1] < 0.05) { a[i + 1] = H - 0.1; a[i] = (Math.random() - 0.5) * 1.1; a[i + 2] = (Math.random() - 0.5) * 1.1; } }
    HT.dust.geometry.attributes.position.needsUpdate = true;
    creakT -= dt; var wob = d < 3.4 && !S.opened ? Math.max(0, Math.sin(t * 9)) * 0.03 * (1 - d / 3.4) : 0; HT.door.rotation.z = (S.opened ? -0.9 : 0) - wob; HT.cord.rotation.z = Math.sin(t * 1.3) * 0.12;
    if (d < 3.2 && creakT <= 0 && GA.Hub.area() !== 'attic') { creakT = 7 + Math.random() * 4; if (GA.Audio) GA.Audio.play('creak'); AT.lastCreak = Date.now(); }
  }

  /* =========================================================================================
     B) MAINTENANCE ROOM (behind a door in the Secret Basement) + LARRY (Gary's long-lost brother)
     ========================================================================================= */
  function buildMaintDoor() {
    var r = R.hatch, x0 = (GA.Areas.BASE ? GA.Areas.BASE.maxX : 11), z0 = 112.6, g = new T.Group(); g.name = 'Maintenance door'; g.position.set(x0, 0, z0); g.rotation.y = -Math.PI / 2; r.add(g);
    add(g, bx(1.5, 2.6, 0.12), ph('#3f4a3a', 40), 0, 1.3, 0.06); add(g, bx(1.2, 2.3, 0.06), ph('#5b6b4f', 30), 0, 1.17, 0.14);
    add(g, sp(0.06, 12), ph('#c9a227', 90), 0.45, 1.15, 0.2); var st = cvs(512, 160, function (c, w, h) { c.fillStyle = '#e8e2c8'; rr(c, 4, 4, w - 8, h - 8, 10); c.fill(); c.fillStyle = '#2b2b2b'; c.font = F(54); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('MAINTENANCE', w / 2, 62); c.font = F(30); c.fillText('knock first. or don\u2019t.', w / 2, 118); });
    var pl = texPlane(1.0, 0.31, st.tex); pl.position.set(0, 1.95, 0.18); g.add(pl);
    var vent = add(g, bx(0.6, 0.25, 0.04), ph('#8a8f98', 60), 0, 0.35, 0.17); void vent;
    reg(g, 'booth'); solidOf(g, 0.02);
    inter({ id: 'at_mdoor', kind: 'at_mdoor', root: 'hatch', name: 'Maintenance door', col: '#a3e635', x: x0 - 1.3, z: z0, dir: [-1, 0], r: 1.0 });
  }
  function larryModel(par) {
    var root = new T.Group(); par.add(root); var body = new T.Group(); root.add(body);
    var ov = lm('#e8742a'), skin = lm('#f1c7a0'), shirt = lm('#4b5563'), hair = lm('#6b5a4a'), dark = gl('#1b1030');
    [-0.15, 0.15].forEach(function (x) { add(body, bx(0.24, 0.6, 0.26), ov, x, 0.32, 0); add(body, bx(0.27, 0.12, 0.36), lm('#3b2a1a'), x, 0.03, 0.04); });
    add(body, bx(0.72, 0.72, 0.48), shirt, 0, 0.98, 0.02); add(body, bx(0.6, 0.5, 0.5), ov, 0, 0.88, 0.02); [-0.2, 0.2].forEach(function (x) { add(body, bx(0.08, 0.36, 0.02), ov, x, 1.16, 0.25); add(body, sp(0.035, 8), ph('#d1d5db', 80), x, 1.08, 0.27); });
    add(body, bx(0.2, 0.14, 0.02), lm('#f8fafc'), 0, 0.92, 0.26); // name patch
    add(body, bx(0.76, 0.1, 0.5), lm('#7c4a1e'), 0, 0.64, 0.02); [[-0.25, '#9ca3af'], [-0.12, '#dc2626'], [0.22, '#facc15']].forEach(function (q) { add(body, bx(0.07, 0.16, 0.06), lm(q[1]), q[0], 0.56, 0.27); }); // tool belt
    var aL = new T.Group(), aR = new T.Group(); aL.position.set(-0.44, 1.24, 0); aR.position.set(0.44, 1.24, 0); body.add(aL); body.add(aR);
    [aL, aR].forEach(function (a) { add(a, bx(0.2, 0.32, 0.22), shirt, 0, -0.13, 0); add(a, bx(0.16, 0.26, 0.17), skin, 0, -0.4, 0); add(a, sp(0.1, 10), skin, 0, -0.55, 0); });
    var wr = new T.Group(); wr.position.set(0, -0.6, 0.08); aR.add(wr); add(wr, bx(0.05, 0.05, 0.42), ph('#cbd5e1', 90), 0, 0, 0.18); add(wr, bx(0.16, 0.05, 0.08), ph('#cbd5e1', 90), 0, 0, 0.4);
    var head = new T.Group(); head.position.set(0, 1.62, 0); body.add(head);
    add(head, sp(0.31, 16), skin, 0, 0, 0); var beard = add(head, sp(0.27, 14), lm('#8a7560'), 0, -0.15, 0.08); beard.scale.set(1.12, 0.75, 0.85); // the family beard (bigger than Gary's)
    add(head, bx(0.15, 0.05, 0.03), lm('#c98d6b'), 0, -0.06, 0.3); [-0.11, 0.11].forEach(function (x) { add(head, sp(0.035, 8), dark, x, 0.05, 0.28); add(head, bx(0.12, 0.03, 0.03), lm('#8a7560'), x, 0.13, 0.28); });
    add(head, cy(0.32, 0.32, 0.16, 20), lm('#1d4ed8'), 0, 0.2, 0); add(head, bx(0.3, 0.03, 0.22), lm('#1d4ed8'), 0, 0.13, 0.34); // work cap
    var bub = bubble(root, 2.45);
    return { root: root, body: body, head: head, aL: aL, aR: aR, bub: bub };
  }
  function buildMaint() {
    var r = mkRoot('maint'), B = MNT, W = B.maxX - B.minX, Dz = B.maxZ - B.minZ, H = B.H, cx = (B.minX + B.maxX) / 2, cz = (B.minZ + B.maxZ) / 2; GA.Hub.addRegion(MNT);
    var fl = add(r, new T.PlaneGeometry(W, Dz), new T.MeshLambertMaterial({ map: cvs(128, 128, function (c, w, h) { c.fillStyle = '#5a5f66'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(0,0,0,.25)'; for (var i = 0; i <= w; i += 32) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); } c.fillStyle = 'rgba(30,30,30,.25)'; c.beginPath(); c.arc(80, 70, 22, 0, 7); c.fill(); }).tex }), cx, 0, cz); fl.rotation.x = -Math.PI / 2; fl.material.map.wrapS = fl.material.map.wrapT = T.RepeatWrapping; fl.material.map.repeat.set(W / 2, Dz / 2); A.noAud(fl);
    var ce = add(r, new T.PlaneGeometry(W, Dz), lm('#2a2d33'), cx, H, cz); ce.rotation.x = Math.PI / 2; A.noAud(ce);
    var wm = new T.MeshLambertMaterial({ map: cvs(128, 128, function (c, w, h) { c.fillStyle = '#6b7c63'; c.fillRect(0, 0, w, h * 0.55); c.fillStyle = '#4a5745'; c.fillRect(0, h * 0.55, w, h); c.fillStyle = '#f2c94c'; c.fillRect(0, h * 0.53, w, 4); for (var i = 0; i < 6; i++) { c.fillStyle = 'rgba(0,0,0,.06)'; c.fillRect(Math.random() * w, Math.random() * h, 20, 2); } }).tex });
    [[W, cx, B.minZ, 0], [W, cx, B.maxZ, Math.PI], [Dz, B.minX, cz, Math.PI / 2], [Dz, B.maxX, cz, -Math.PI / 2]].forEach(function (q) { var m = add(r, new T.PlaneGeometry(q[0], H), wm, q[1], H / 2, q[2]); if (q[3] === 0 || q[3] === Math.PI) { m.position.z = q[2]; m.rotation.y = q[3]; } else { m.position.x = q[1]; m.position.z = q[2]; m.rotation.y = q[3]; } A.noAud(m); });
    var th = 0.4; A.addWall(B.minX - 1, B.maxX + 1, -1, H + 3, B.minZ - th, B.minZ); A.addWall(B.minX - 1, B.maxX + 1, -1, H + 3, B.maxZ, B.maxZ + th); A.addWall(B.minX - th, B.minX, -1, H + 3, B.minZ - 1, B.maxZ + 1); A.addWall(B.maxX, B.maxX + th, -1, H + 3, B.minZ - 1, B.maxZ + 1);
    A.walls.push({ minX: B.minX - 1, maxX: B.maxX + 1, minY: H, maxY: H + 2, minZ: B.minZ - 1, maxZ: B.maxZ + 1 });
    var L = new T.PointLight('#ffe6b0', 1.0, 18, 1.3); L.position.set(cx, H - 0.4, cz); r.add(L);
    var bulb = add(r, sp(0.1, 10), gl('#fff2c4'), cx, H - 0.5, cz); add(r, cy(0.005, 0.005, 0.4, 4), gl('#222'), cx, H - 0.25, cz); void bulb;
    // pipes on the ceiling with valve wheels, a big boiler, shelves of paint cans, a mop called Dennis
    var pipes = new T.Group(); r.add(pipes); A.noAud(pipes);
    [[-0.5, '#b87333', 0.09], [0.5, '#8a8f98', 0.12]].forEach(function (q) { var m = add(pipes, cy(q[2], q[2], W, 12), ph(q[1], 70), cx, H - 0.3, B.minZ + 0.6 + (q[0] + 0.5) * 0.4); m.rotation.z = Math.PI / 2; });
    [23, 28, 32].forEach(function (x) { var v = add(pipes, to(0.14, 0.025, 7, 20), ph('#dc2626', 50), x, H - 0.3, B.minZ + 1.25); void v; });
    var boil = prop('maint', 'Boiler', 32.4, 109.6, 0); add(boil, cy(0.8, 0.85, 2.6, 24), ph('#7c3f2a', 40), 0, 1.3, 0); add(boil, cy(0.84, 0.84, 0.08, 24), ph('#c9a227', 80), 0, 0.5, 0); add(boil, cy(0.84, 0.84, 0.08, 24), ph('#c9a227', 80), 0, 2.2, 0);
    var gauge = add(boil, cy(0.18, 0.18, 0.05, 20), ph('#f8fafc', 60), -0.6, 1.6, 0.58); gauge.rotation.x = Math.PI / 2; gauge.rotation.z = 0.6; var needle = add(boil, bx(0.02, 0.14, 0.01), gl('#dc2626'), -0.6, 1.6, 0.62); needle.rotation.y = -0.6;
    var fire = add(boil, bx(0.5, 0.3, 0.02), gl('#ff8a2a'), 0, 0.85, 0.84); fire.rotation.y = 0; reg(boil, 'prop'); solidOf(boil, 0.02);
    var shelf = prop('maint', 'Paint shelf', 20.5, 102.2, Math.PI / 2); add(shelf, bx(2.0, 0.06, 0.5), lm('#6b4a2e'), 0, 0.6, 0); add(shelf, bx(2.0, 0.06, 0.5), lm('#6b4a2e'), 0, 1.3, 0); [-0.95, 0.95].forEach(function (x) { add(shelf, bx(0.06, 1.9, 0.5), lm('#4a3220'), x, 0.95, 0); });
    ['#ef4444', '#3b82f6', '#facc15', '#22c55e', '#a855f7', '#f97316'].forEach(function (c, i) { add(shelf, cy(0.12, 0.12, 0.24, 14), ph(c, 40), -0.7 + (i % 3) * 0.6, i < 3 ? 0.76 : 1.46, 0); }); reg(shelf, 'prop'); solidOf(shelf, 0.02);
    var mop = prop('maint', 'Dennis the mop', 33.4, 102.0, 0); var mh = add(mop, cy(0.025, 0.025, 1.6, 8), lm('#c08a4a'), 0, 0.85, 0); mh.rotation.z = 0.18; add(mop, cy(0.18, 0.12, 0.25, 12), lm('#e5e7eb'), -0.13, 0.12, 0); [-1, 1].forEach(function (sd) { add(mop, sp(0.03, 8), gl('#111'), -0.14 + sd * 0.05, 0.2, 0.15); }); reg(mop, 'prop'); solidOf(mop, 0.02);
    // workbench + Larry behind it
    var wb = prop('maint', 'Larry\u2019s workbench', 27.0, 110.7, Math.PI); add(wb, bx(2.6, 0.1, 0.9), lm('#8b5a2b'), 0, 0.92, 0); [-1.2, 1.2].forEach(function (x) { add(wb, bx(0.1, 0.9, 0.8), lm('#5b3a1e'), x, 0.45, 0); });
    add(wb, bx(0.5, 0.25, 0.3), ph('#dc2626', 40), -0.8, 1.1, 0); add(wb, cy(0.09, 0.08, 0.16, 14), lm('#f8fafc'), 0.7, 1.05, 0.1); add(wb, bx(0.3, 0.02, 0.2), lm('#fffdf0'), 0.2, 0.98, -0.1);
    var ph2 = cvs(256, 200, function (c, w, h) { c.fillStyle = '#f5ecd7'; c.fillRect(0, 0, w, h); c.fillStyle = '#8fb3d9'; c.fillRect(14, 14, w - 28, h - 60); c.fillStyle = '#14b8a6'; c.fillRect(70, 70, 40, 60); c.fillStyle = '#e8742a'; c.fillRect(140, 60, 50, 70); c.fillStyle = '#f1c7a0'; c.beginPath(); c.arc(90, 58, 18, 0, 7); c.arc(165, 46, 22, 0, 7); c.fill(); c.fillStyle = '#333'; c.font = F(18); c.textAlign = 'center'; c.fillText('me + lil Gary, 1994', w / 2, h - 22); });
    var frame = add(wb, bx(0.42, 0.34, 0.03), lm('#6b4a2e'), 0.2, 1.15, 0.28); frame.rotation.x = -0.25; var phm = texPlane(0.36, 0.28, ph2.tex); phm.position.set(0.2, 1.15, 0.3); phm.rotation.x = -0.25; phm.rotation.y = Math.PI; wb.add(phm); void frame;
    reg(wb, 'booth'); solidOf(wb, 0.02);
    var L2 = larryModel(r); L2.root.position.set(27.0, 0, 111.55); L2.root.rotation.y = Math.PI; NPC.larry = L2;
    inter({ id: 'at_larry', kind: 'at_larry', root: 'maint', name: 'Larry from Maintenance', col: '#e8742a', x: 27.0, z: 109.2, dir: [0, -1], r: 1.2 });
    // the fuse rack (fix-it task) on the north wall
    var fr = prop('maint', 'Fuse rack', 24.6, B.minZ + 0.18, 0); add(fr, bx(1.6, 1.3, 0.25), ph('#4b5563', 50), 0, 1.5, 0); add(fr, bx(1.5, 1.2, 0.04), ph('#1f2937', 30), 0, 1.5, 0.13);
    for (var i = 0; i < 6; i++) { add(fr, cy(0.05, 0.05, 0.22, 12), new T.MeshPhongMaterial({ color: '#fff7c2', transparent: true, opacity: 0.6 }), -0.55 + i * 0.22, 1.5, 0.18).rotation.x = 0; }
    var lab = cvs(256, 64, function (c, w, h) { c.fillStyle = '#facc15'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = F(34); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('FUSES', w / 2, h / 2); }); var lp = texPlane(0.6, 0.15, lab.tex); lp.position.set(0, 2.25, 0.14); fr.add(lp);
    reg(fr, 'booth'); solidOf(fr, 0.02);
    inter({ id: 'at_fuserack', kind: 'at_fuserack', root: 'maint', name: 'Fuse rack', col: '#facc15', x: 24.6, z: B.minZ + 1.55, dir: [0, 1], r: 1.0 });
    // the old Ghost Lantern '83 cabinet (wood, CRT bulge, green phosphor screen)
    var gc = prop('maint', 'Ghost Lantern \u201983 cabinet', 30.4, B.minZ + 0.6, 0), wood = lm('#4a2e1a');
    add(gc, bx(1.1, 2.0, 0.85), wood, 0, 1.0, 0); add(gc, bx(1.14, 0.08, 0.9), ph('#a7f3d0', 30), 0, 2.02, 0);
    var scr = cvs(256, 192, function () {}); HT.ghostScr = scr; var crt = add(gc, new T.SphereGeometry(0.62, 20, 12, Math.PI / 2 - 0.6, 1.2, Math.PI / 2 - 0.45, 0.9), new T.MeshBasicMaterial({ map: scr.tex }), 0, 1.38, -0.1); void crt;
    [-1, 1].forEach(function (sd) { add(gc, bx(0.08, 0.6, 0.06), wood, sd * 0.42, 1.38, 0.47); }); add(gc, bx(0.92, 0.08, 0.06), wood, 0, 1.69, 0.47); add(gc, bx(0.92, 0.08, 0.06), wood, 0, 1.07, 0.47);
    var cp = add(gc, bx(1.0, 0.1, 0.4), ph('#7c3aed', 30), 0, 0.95, 0.55); cp.rotation.x = 0.3; add(gc, sp(0.05, 10), gl('#a7f3d0'), -0.2, 1.03, 0.58); add(gc, sp(0.05, 10), gl('#fde047'), 0.2, 1.03, 0.58);
    var mq = cvs(512, 128, function (c, w, h) { c.fillStyle = '#0b1a12'; c.fillRect(0, 0, w, h); glowText(c, 'GHOST LANTERN \u201983', w / 2, h / 2, 62, '#a7f3d0', w - 30); }); var mqm = texPlane(1.0, 0.25, mq.tex); mqm.position.set(0, 1.86, 0.43); gc.add(mqm);
    reg(gc, 'cabinet'); solidOf(gc, 0.02);
    inter({ id: 'at_ghostcab', kind: 'at_ghostcab', root: 'maint', name: 'Ghost Lantern \u201983', col: '#a7f3d0', x: 30.4, z: B.minZ + 2.2, dir: [0, 1], r: 1.1 });
    // exit back to the basement
    var ex = prop('maint', 'Maintenance exit', B.minX + 0.1, 106, Math.PI / 2); add(ex, bx(1.5, 2.6, 0.12), ph('#3f4a3a', 40), 0, 1.3, 0.06); add(ex, bx(1.2, 2.3, 0.06), ph('#5b6b4f', 30), 0, 1.17, 0.14);
    var es = cvs(256, 80, function (c, w, h) { c.fillStyle = '#0d5f2c'; rr(c, 2, 2, w - 4, h - 4, 10); c.fill(); glowText(c, '\u25C0 BASEMENT', w / 2, h / 2, 36, '#e8fff0', w - 20); }); var ep = texPlane(0.9, 0.28, es.tex); ep.position.set(0, 2.82, 0.15); ex.add(ep); reg(ex, 'booth'); solidOf(ex, 0.02);
    inter({ id: 'at_mexit', kind: 'at_mexit', root: 'maint', name: 'Back to the basement', col: '#4ade80', x: B.minX + 1.3, z: 106, dir: [1, 0], r: 0.9 });
    var tt = 0; ANIM.maint.push(function (t, dt) { L2.bub.tick(dt); L2.body.position.y = Math.abs(Math.sin(t * 2)) * 0.02; L2.head.rotation.z = Math.sin(t * 1.4) * 0.06; L2.aR.rotation.x = -0.4 + Math.sin(t * 3) * 0.3; needle.rotation.y = -0.6 + Math.sin(t * 1.1) * 0.25; fire.material.color.setHSL(0.07 + Math.sin(t * 8) * 0.02, 1, 0.55);
      tt += dt; if (tt > 0.12) { tt = 0; drawGhostScreen(scr, t); } });
    drawGhostScreen(scr, 0);
  }
  function drawGhostScreen(s, t) { var c = s.g, w = 256, h = 192; c.fillStyle = '#04140b'; c.fillRect(0, 0, w, h); c.fillStyle = '#a7f3d0'; c.font = F(20); c.textAlign = 'center'; c.fillText('GHOST LANTERN \u201983', w / 2, 30);
    for (var i = 0; i < 4; i++) { var x = w / 2 + Math.cos(t * 0.8 + i * 1.6) * 80, y = 105 + Math.sin(t * 1.1 + i) * 40; c.beginPath(); c.arc(x, y, 13, Math.PI, 0); c.lineTo(x + 13, y + 12); c.lineTo(x - 13, y + 12); c.fill(); }
    c.fillStyle = '#fbbf24'; c.fillRect(w / 2 - 5, 100, 10, 18); c.fillStyle = (Math.floor(t * 2) % 2) ? '#fde047' : '#a7f3d0'; c.fillText('INSERT COIN', w / 2, 175); c.fillStyle = 'rgba(0,0,0,.25)'; for (var y2 = 0; y2 < h; y2 += 3) c.fillRect(0, y2, w, 1); s.tex.needsUpdate = true; }

  /* =========================================================================================
     C) THE ATTIC: six rooms under a sloped, raftered roof
        W column: Music Box Room (N) / Toy Room (S); middle: Portrait Gallery (N) / Dusty Storage (S, the hatch);
        E column: Weekly Puzzle Room (N) / Ghost Parlor (S, locked corridor to the library)
     ========================================================================================= */
  var IN = {}; AT.IN = IN;
  function attShell(root, B, opts) {
    var r = R[root], W = B.maxX - B.minX, Dz = B.maxZ - B.minZ, cx = (B.minX + B.maxX) / 2, cz = (B.minZ + B.maxZ) / 2, H = B.H, ridge = opts.ridge || H + 2;
    var fl = add(r, new T.PlaneGeometry(W, Dz), new T.MeshPhongMaterial({ map: plankTex('#6b4a32', 'rgba(30,15,5,.6)', [W / 4, Dz / 4]), shininess: 12 }), cx, 0, cz); fl.rotation.x = -Math.PI / 2; A.noAud(fl);
    var wt = plankTex(opts.wall || '#4a3352', 'rgba(20,8,30,.5)'); var shell = new T.Group(); r.add(shell); A.noAud(shell);
    function wall(len, x, z, ry, h) { var t2 = wt.clone(); t2.needsUpdate = true; t2.wrapS = t2.wrapT = T.RepeatWrapping; t2.repeat.set(len / 3, h / 3); t2.rotation = Math.PI / 2; var m = add(shell, new T.PlaneGeometry(len, h), new T.MeshLambertMaterial({ map: t2 }), x, h / 2, z); m.rotation.y = ry;
      var bb = add(shell, bx(len, 0.14, 0.05), ph('#2a1a12', 10), x + Math.sin(ry) * 0.03, 0.07, z + Math.cos(ry) * 0.03); bb.rotation.y = ry; }
    wall(W, cx, B.minZ, 0, H); wall(W, cx, B.maxZ, Math.PI, H);
    // gable end walls (pentagon: wall + triangle up to the ridge)
    [[B.minX, Math.PI / 2], [B.maxX, -Math.PI / 2]].forEach(function (q) { wall(Dz, q[0], cz, q[1], H); var sh2 = new T.Shape(); sh2.moveTo(-Dz / 2, 0); sh2.lineTo(Dz / 2, 0); sh2.lineTo(0, ridge - H); sh2.closePath(); var tri = add(shell, new T.ShapeGeometry(sh2), new T.MeshLambertMaterial({ color: opts.wall || '#4a3352' }), q[0], H, cz); tri.rotation.y = q[1]; });
    // sloped roof boards + rafters + ridge beam
    var slope = Math.hypot(Dz / 2, ridge - H), ang = Math.atan2(ridge - H, Dz / 2), rt = plankTex('#3a2a20', 'rgba(0,0,0,.5)', [W / 3, slope / 3]);
    [-1, 1].forEach(function (sd) { var m = add(shell, new T.PlaneGeometry(W, slope), new T.MeshLambertMaterial({ map: rt, side: T.DoubleSide }), cx, (H + ridge) / 2, cz + sd * Dz / 4); m.rotation.x = -sd * (Math.PI / 2 - ang); });
    var beam = ph('#5a3a22', 15);
    add(shell, bx(W, 0.24, 0.24), beam, cx, ridge - 0.12, cz);
    for (var x = B.minX + 1.5; x < B.maxX - 0.5; x += 3.2) { [-1, 1].forEach(function (sd) { var rf = add(shell, bx(0.18, slope, 0.18), beam, x, (H + ridge) / 2 - 0.12, cz + sd * Dz / 4); rf.rotation.x = -sd * (Math.PI / 2 - ang); }); add(shell, bx(0.14, 0.14, Dz * (1 - (ridge - 0.9 - H) / (ridge - H)) + 0.3), beam, x, ridge - 0.9, cz); }
    A.walls.push({ minX: B.minX - 1, maxX: B.maxX + 1, minY: ridge - 0.3, maxY: ridge + 3, minZ: B.minZ - 1, maxZ: B.maxZ + 1 });
    // keep the camera under the sloped roof: stepped boxes that follow each roof slope
    for (var st = 0; st < 10; st++) { var d0 = st * Dz / 20, y0 = H + (ridge - H) * (st + 1) / 10 - 0.25; A.walls.push({ minX: B.minX - 1, maxX: B.maxX + 1, minY: y0, maxY: ridge + 3, minZ: B.minZ - 1, maxZ: B.minZ + d0 + Dz / 20 }); A.walls.push({ minX: B.minX - 1, maxX: B.maxX + 1, minY: y0, maxY: ridge + 3, minZ: B.maxZ - d0 - Dz / 20, maxZ: B.maxZ + 1 }); }
    var th = 0.4; A.addWall(B.minX - 1, B.maxX + 1, -1, ridge + 3, B.minZ - th, B.minZ); A.addWall(B.minX - 1, B.maxX + 1, -1, ridge + 3, B.maxZ, B.maxZ + th); A.addWall(B.minX - th, B.minX, -1, ridge + 3, B.minZ - 1, B.maxZ + 1); A.addWall(B.maxX, B.maxX + th, -1, ridge + 3, B.minZ - 1, B.maxZ + 1);
    // round gable windows with moonlight
    [[B.minX + 0.02, Math.PI / 2], [B.maxX - 0.02, -Math.PI / 2]].forEach(function (q) { var wgp = new T.Group(); wgp.position.set(q[0], H + 0.9, cz); wgp.rotation.y = q[1]; shell.add(wgp); add(wgp, to(0.62, 0.08, 7, 30), ph('#2a1a12', 10), 0, 0, 0.02);
      add(wgp, new T.CircleGeometry(0.6, 30), new T.MeshBasicMaterial({ color: '#2b3f7a' }), 0, 0, 0.005); add(wgp, sp(0.16, 12), gl('#fff6d5'), 0.22, 0.2, -0.05).scale.z = 0.1; add(wgp, bx(1.2, 0.05, 0.05), ph('#2a1a12', 10), 0, 0, 0.04); add(wgp, bx(0.05, 1.2, 0.05), ph('#2a1a12', 10), 0, 0, 0.04); });
    // cobwebs in the corners
    var cw = cobweb(); [[B.minX + 0.03, B.minZ + 0.03, Math.PI / 2, 0], [B.maxX - 0.03, B.minZ + 0.03, -Math.PI / 2, 1], [B.minX + 0.03, B.maxZ - 0.03, Math.PI / 2, 1], [B.maxX - 0.03, B.maxZ - 0.03, -Math.PI / 2, 0]].forEach(function (q) { var m = texPlane(1.4, 1.4, cw, { transparent: true, double: true }); m.position.set(q[0], H - 0.7, q[1] + (q[1] > cz ? -0.7 : 0.7)); m.rotation.y = q[2]; if (q[3]) m.scale.x = -1; shell.add(m); });
    return shell;
  }
  function lantern(root, x, y, z, col) { var g = new T.Group(); g.position.set(x, y, z); R[root].add(g); A.noAud(g); add(g, cy(0.005, 0.005, 0.8, 4), gl('#222'), 0, 0.4, 0); add(g, cy(0.12, 0.14, 0.05, 6), ph('#2d2a3a', 60), 0, 0, 0); add(g, cn(0.13, 0.12, 6), ph('#2d2a3a', 60), 0, 0.3, 0);
    add(g, cy(0.1, 0.1, 0.24, 6), new T.MeshBasicMaterial({ color: col || '#ffcf7a', transparent: true, opacity: 0.85 }), 0, 0.14, 0); var s = new T.Sprite(new T.SpriteMaterial({ map: A.glowTex, color: col || '#ffcf7a', transparent: true, opacity: 0.6, depthWrite: false, blending: T.AdditiveBlending })); s.scale.set(1.4, 1.4, 1); s.position.y = 0.14; g.add(s); return g; }
  function sheeted(root, name, x, z, ry, w, h, d, kind) { // furniture under a dusty sheet (lathe/rounded shapes so it reads as cloth, not a box)
    var g = prop(root, name, x, z, ry), cloth = ph('#e8e2d0', 8);
    var b = add(g, new T.CylinderGeometry(0.5, 0.56, 1, 24, 1), cloth, 0, h / 2, 0); b.scale.set(w, h, d);
    var top = add(g, new T.SphereGeometry(0.5, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), cloth, 0, h, 0); top.scale.set(w, kind === 'tall' ? 0.25 : 0.4, d);
    for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2, f = add(g, cn(0.14, 0.3, 8), cloth, Math.cos(a) * w * 0.52, 0.12, Math.sin(a) * d * 0.52); f.rotation.x = Math.PI; }
    if (kind === 'sofa') { [-1, 1].forEach(function (sd) { var arm = add(g, sp(0.3, 14), cloth, sd * w * 0.45, h * 0.95, 0); arm.scale.set(0.8, 0.6, d * 1.6); }); var back = add(g, sp(0.5, 18), cloth, 0, h * 1.1, -d * 0.3); back.scale.set(w * 0.95, 0.5, 0.4); }
    reg(g, 'prop'); solidOf(g, 0.03); return g; }
  function crate(root, name, x, z, ry, n) { var g = prop(root, name, x, z, ry), wd = ph('#8a6a48', 15); for (var i = 0; i < n; i++) { var s = 0.7 - i * 0.12, b = add(g, bx(s, s * 0.8, s), wd, (i % 2) * 0.1, (i ? 0.56 + (i - 1) * 0.5 : 0) + s * 0.4, 0); b.rotation.y = i * 0.3; add(g, bx(s + 0.02, 0.05, s + 0.02), ph('#5b3a1e', 10), (i % 2) * 0.1, (i ? 0.56 + (i - 1) * 0.5 : 0) + s * 0.4, 0).rotation.y = i * 0.3; } reg(g, 'prop'); solidOf(g, 0.03); return g; }
  function orb(root, i, x, y, z) { var g = new T.Group(); g.position.set(x, 0, z); R[root].add(g); A.noAud(g); var o = add(g, sp(0.09, 16), new T.MeshPhongMaterial({ color: '#b8fff0', emissive: '#2a8f80', shininess: 120, transparent: true, opacity: 0.9 }), 0, y, 0);
    var s = new T.Sprite(new T.SpriteMaterial({ map: A.glowTex, color: '#7dffe0', transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending })); s.scale.set(0.6, 0.6, 1); s.position.y = y; g.add(s);
    var c = inter({ id: 'at_orb' + i, kind: 'at_orb', root: root, name: 'Spirit marble', col: '#7dffe0', x: x, z: z, dir: [0, 1], r: 0.95, hideGlow: true, data: { i: i, y: y } }); c.noStand = true; c.orbG = g; c.orbM = o;
    ANIM.any.push(function (t) { if (!g.visible) return; o.position.y = y + Math.sin(t * 2 + i) * 0.05; s.position.y = o.position.y; s.material.opacity = 0.4 + Math.sin(t * 3 + i) * 0.15; }); return c; }
  function partition(x0, x1, z0, z1) { wallBox('attic', x0, x1, z0, z1, ATT.ridge, IN.partMat); }
  function buildAttic() {
    var r = mkRoot('attic'), B = ATT; GA.Hub.addRegion(ATT);
    IN.partMat = new T.MeshLambertMaterial({ map: plankTex('#5a3f60', 'rgba(20,8,30,.5)', [3, 2]) });
    attShell('attic', B, { ridge: B.ridge, wall: '#4a3352' });
    // partitions with doorways (2.4 wide)
    [-99, -85].forEach(function (x) { partition(x - 0.1, x + 0.1, -14, -8.2); partition(x - 0.1, x + 0.1, -5.8, 5.8); partition(x - 0.1, x + 0.1, 8.2, 14); });
    [[-112, -106.7], [-104.3, -99.1], [-98.9, -93.2], [-90.8, -85.1], [-84.9, -79.7], [-77.3, -72]].forEach(function (q) { partition(q[0], q[1], -0.1, 0.1); });
    // door frames over the doorways
    [[-99, -7, 1], [-99, 7, 1], [-85, -7, 1], [-85, 7, 1], [-105.5, 0, 0], [-92, 0, 0], [-78.5, 0, 0]].forEach(function (q) { var f = new T.Group(); f.position.set(q[0], 0, q[1]); f.rotation.y = q[2] ? Math.PI / 2 : 0; r.add(f); A.noAud(f); add(f, bx(2.6, 0.22, 0.3), ph('#3a2414', 10), 0, 2.6, 0); [-1, 1].forEach(function (sd) { add(f, bx(0.14, 2.6, 0.3), ph('#3a2414', 10), sd * 1.27, 1.3, 0); }); });
    // room name plaques (above each doorway, both sides)
    var NAMES = [['MUSIC BOX ROOM', -105.5, -0.13, Math.PI, '#f9a8d4'], ['TOY ROOM', -105.5, 0.13, 0, '#fde047'], ['PORTRAIT GALLERY', -92, -0.13, Math.PI, '#c4b5fd'], ['DUSTY STORAGE', -92, 0.13, 0, '#e7dcc0'], ['WEEKLY PUZZLE ROOM', -78.5, -0.13, Math.PI, '#7dffe0'], ['GHOST PARLOR', -78.5, 0.13, 0, '#93c5fd']];
    NAMES.forEach(function (q) { var t = cvs(512, 96, function (c, w, h) { c.fillStyle = '#2a1a12'; rr(c, 4, 4, w - 8, h - 8, 14); c.fill(); c.strokeStyle = '#c9a227'; c.lineWidth = 5; c.stroke(); glowText(c, q[0], w / 2, h / 2 + 2, 46, q[4], w - 40); }); var m = texPlane(1.9, 0.36, t.tex); m.position.set(q[1], 3.0, q[2]); m.rotation.y = q[3]; r.add(m); A.wallSign('plaque ' + q[0] + q[2], m); });
    lantern('attic', -92, 3.9, 7, '#ffcf7a'); lantern('attic', -105.5, 3.9, -7, '#f9a8d4'); lantern('attic', -78.5, 3.9, 7, '#93c5fd'); lantern('attic', -105.5, 3.9, 7, '#fde047'); lantern('attic', -92, 3.9, -7, '#c4b5fd'); lantern('attic', -78.5, 3.9, -7, '#7dffe0');
    var L1 = new T.PointLight('#ffd9a0', 0.9, 22, 1.3); L1.position.set(-98, 3.6, 4); r.add(L1); var L2 = new T.PointLight('#b9a6ff', 0.8, 22, 1.3); L2.position.set(-84, 3.6, -4); r.add(L2);
    IN.dust = dust('attic', -92, 0, 38, 26, 4.5, 260);
    // ---- Dusty Storage (spawn; the hatch back down is in the floor) ----
    var hd = prop('attic', 'Hatch (floor)', -92, 12.6, 0); [[0, -0.66, 1.46, 0.12], [0, 0.66, 1.46, 0.12], [-0.66, 0, 0.12, 1.2], [0.66, 0, 0.12, 1.2]].forEach(function (q) { add(hd, bx(q[2], 0.06, q[3]), ph('#6b4a2e', 15), q[0], 0.03, q[1]); }); var hl = add(hd, new T.PlaneGeometry(1.2, 1.2), new T.MeshBasicMaterial({ color: '#ffe9b0' }), 0, 0.02, 0); hl.rotation.x = -Math.PI / 2;
    var lt = add(hd, bx(0.07, 1.1, 0.07), ph('#c08a4a', 25), -0.24, 0.5, 0.3); void lt; add(hd, bx(0.07, 1.1, 0.07), ph('#c08a4a', 25), 0.24, 0.5, 0.3); add(hd, cy(0.025, 0.025, 0.48, 8), ph('#c08a4a', 25), 0, 0.9, 0.3).rotation.z = Math.PI / 2;
    A.noAud(hd);
    inter({ id: 'at_down', kind: 'at_down', root: 'attic', name: 'Hatch back down to the arcade', col: '#ffd9a0', x: -92, z: 11.0, dir: [0, -1], r: 0.9 });
    sheeted('attic', 'sheet sofa', -96.2, 2.4, 0.15, 2.2, 0.8, 0.9, 'sofa'); sheeted('attic', 'sheet armchair', -87.6, 2.6, -0.4, 1.0, 0.95, 0.9, 'sofa'); sheeted('attic', 'sheet wardrobe', -97.6, 11.9, Math.PI / 2, 1.3, 2.1, 0.7, 'tall'); sheeted('attic', 'sheet clock', -86.0, 4.8, 0, 0.6, 2.0, 0.5, 'tall');
    crate('attic', 'storage crates', -87.2, 12.6, 0.2, 3);
    var tr = prop('attic', 'Old trunk', -95.0, 13.3, Math.PI); add(tr, bx(1.2, 0.55, 0.62), ph('#6b3a1e', 20), 0, 0.28, 0); add(tr, cy(0.31, 0.31, 1.2, 16, 1), ph('#7a4422', 20), 0, 0.56, 0).rotation.z = Math.PI / 2; [-0.4, 0.4].forEach(function (x) { add(tr, bx(0.06, 0.58, 0.64), ph('#c9a227', 80), x, 0.3, 0); }); add(tr, bx(0.12, 0.14, 0.04), ph('#c9a227', 80), 0, 0.5, -0.32);
    reg(tr, 'prop'); solidOf(tr, 0.02); inter({ id: 'at_trunk', kind: 'at_trunk', root: 'attic', name: 'Old trunk', col: '#e8b84a', x: -95.0, z: 11.9, dir: [0, -1], r: 0.9 });
    var rc = prop('attic', 'Rocking chair', -89.0, 12.0, Math.PI); IN.rocker = rc; var rw = ph('#5b3a1e', 20); [-1, 1].forEach(function (sd) { var rk = add(rc, to(0.6, 0.03, 1.2, 16), rw, sd * 0.28, 0.62, 0); rk.rotation.set(0, Math.PI / 2, Math.PI + 0.97); }); add(rc, bx(0.62, 0.06, 0.55), rw, 0, 0.5, 0); add(rc, bx(0.62, 0.8, 0.06), rw, 0, 0.9, -0.27); reg(rc, 'prop'); solidOf(rc, 0.02);
    var mq = prop('attic', 'Dress mannequin', -86.4, 9.6, -Math.PI / 2); add(mq, cy(0.03, 0.03, 0.9, 8), ph('#2b2b2b', 50), 0, 0.45, 0); add(mq, cy(0.2, 0.2, 0.04, 16), ph('#2b2b2b', 50), 0, 0.02, 0); var tor2 = add(mq, sp(0.28, 18), ph('#f3d9c0', 20), 0, 1.2, 0); tor2.scale.set(1, 1.4, 0.75); var skirt = add(mq, cn(0.42, 0.7, 18), ph('#7c3aed', 20), 0, 0.85, 0); void skirt; reg(mq, 'prop'); solidOf(mq, 0.02);
    ghostNpc('attic', 'boo', -90.2, 6.4, '#eef2ff', 1.2); var boo = NPC.boo.g; add(boo, cy(0.12, 0.13, 0.16, 20), ph('#1b1530', 50), 0, 0.72, 0); add(boo, cy(0.2, 0.2, 0.02, 24), ph('#1b1530', 50), 0, 0.64, 0); add(boo, bx(0.16, 0.05, 0.03), ph('#b3123a', 30), 0, 0.2, 0.3);
    inter({ id: 'at_boo', kind: 'at_boo', root: 'attic', name: 'Boo-ford the Butler Ghost', col: '#eef2ff', x: -90.2, z: 4.8, dir: [0, -1], r: 1.0 });
    // ---- Portrait Gallery: six portraits whose eyes follow you (one never does) ----
    IN.portraits = []; var PNAMES = ['Sir Reginald Fuzzbottom', 'Lady Wobbleton', 'Great-Great-Grandpa Gus', 'Baroness Von Snore', 'Captain Pickles', 'Little Lord Muffin'], PCOLS = ['#8b5cf6', '#ec4899', '#a16207', '#0ea5e9', '#16a34a', '#f97316'];
    var PSPOT = [[-96.5, -13.95, 0], [-92, -13.95, 0], [-87.5, -13.95, 0], [-98.85, -11.0, Math.PI / 2], [-85.15, -11.0, -Math.PI / 2], [-98.85, -2.8, Math.PI / 2]];
    PSPOT.forEach(function (q, i) {
      var g = new T.Group(); g.name = 'portrait ' + PNAMES[i]; g.position.set(q[0], 0, q[1]); g.rotation.y = q[2]; r.add(g);
      add(g, bx(1.25, 1.55, 0.08), ph('#c9a227', 70, '#2a1a00'), 0, 1.75, 0.04); add(g, bx(1.05, 1.35, 0.03), ph('#2a1a2a', 10), 0, 1.75, 0.08);
      var pc = cvs(256, 320, function (c, w, h) { var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2b1d3a'); gr.addColorStop(1, '#120a1c'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
        c.fillStyle = PCOLS[i]; c.beginPath(); c.ellipse(w / 2, h * 0.88, w * 0.42, h * 0.3, 0, 0, 7); c.fill(); c.fillStyle = '#f1c7a5'; c.beginPath(); c.ellipse(w / 2, h * 0.45, w * 0.26, h * 0.22, 0, 0, 7); c.fill();
        c.fillStyle = i === 2 ? '#d6d6d6' : ['#4a2b16', '#f5d06f', '#d6d6d6', '#1f2937', '#a16207', '#fde68a'][i]; c.beginPath(); c.ellipse(w / 2, h * 0.28, w * 0.28, h * 0.1, 0, Math.PI, 0); c.fill();
        if (i === 0 || i === 2 || i === 4) { c.fillStyle = i === 2 ? '#d6d6d6' : '#4a2b16'; c.beginPath(); c.ellipse(w / 2 - 22, h * 0.53, 22, 8, 0.3, 0, 7); c.ellipse(w / 2 + 22, h * 0.53, 22, 8, -0.3, 0, 7); c.fill(); }
        if (i === 4) { c.fillStyle = '#1f2937'; c.fillRect(w / 2 - 50, h * 0.16, 100, 18); c.beginPath(); c.moveTo(w / 2 - 70, h * 0.22); c.lineTo(w / 2 + 70, h * 0.22); c.lineTo(w / 2, h * 0.1); c.fill(); }
        c.fillStyle = '#7a2a2a'; c.fillRect(w / 2 - 16, h * 0.6, 32, 5); c.fillStyle = '#c9a227'; c.font = F(18); c.textAlign = 'center'; c.fillText(PNAMES[i], w / 2, h - 14); });
      var pm = texPlane(1.0, 1.3, pc.tex); pm.position.set(0, 1.75, 0.1); g.add(pm);
      var eyes = []; [-0.115, 0.115].forEach(function (ex) { var eg = new T.Group(); eg.position.set(ex, 1.75 + 0.07, 0.12); g.add(eg); add(eg, sp(0.055, 14), ph('#ffffff', 60), 0, 0, 0).scale.z = 0.5; var pu = add(eg, sp(0.025, 10), ph('#111', 90), 0, 0, 0.03); eyes.push({ g: eg, pu: pu }); });
      reg(g, 'decal'); A.noAud(g);
      var fx = q[0] + Math.sin(q[2]) * 1.3, fz = q[1] + Math.cos(q[2]) * 1.3;
      var cab = inter({ id: 'at_portrait' + i, kind: 'at_portrait', root: 'attic', name: PNAMES[i], col: PCOLS[i], x: fx, z: fz, dir: [Math.sin(q[2]), Math.cos(q[2])], r: 0.85, hideGlow: true, data: { i: i } }); void cab;
      IN.portraits.push({ g: g, eyes: eyes, i: i });
    });
    var bench = prop('attic', 'gallery bench', -92, -6.0, 0); add(bench, bx(1.8, 0.12, 0.55), ph('#7c2d4a', 20), 0, 0.46, 0); [-0.75, 0.75].forEach(function (x) { add(bench, bx(0.1, 0.42, 0.45), ph('#3a2414', 20), x, 0.21, 0); }); reg(bench, 'prop'); solidOf(bench, 0.02);
    // ---- Music Box Room ----
    var mb = prop('attic', 'Music box pedestal', -107.0, -10.6, 0); add(mb, cy(0.35, 0.45, 1.0, 20), ph('#3a2414', 20), 0, 0.5, 0); add(mb, cy(0.5, 0.5, 0.06, 24), ph('#c9a227', 70), 0, 1.03, 0);
    var box2 = GA.Prize3D ? GA.Prize3D.build('haunted_box') : new T.Group(); box2.scale.setScalar(1.3); box2.position.y = 1.06; mb.add(box2); IN.musicBox = box2; reg(mb, 'booth'); solidOf(mb, 0.02);
    inter({ id: 'at_musicbox', kind: 'at_musicbox', root: 'attic', name: 'The haunted music box', col: '#f9a8d4', x: -107.0, z: -9.0, dir: [0, 1], r: 1.0 });
    sheeted('attic', 'sheet piano', -102.4, -12.4, 0, 2.2, 1.1, 1.0); var gram = prop('attic', 'Gramophone', -110.6, -12.4, 0.6); add(gram, bx(0.5, 0.35, 0.5), ph('#5b3a1e', 30), 0, 0.6, 0); add(gram, cy(0.25, 0.3, 0.42, 16), ph('#3a2414', 20), 0, 0.21, 0); var horn = add(gram, new T.CylinderGeometry(0.4, 0.04, 0.7, 20, 1, true), new T.MeshPhongMaterial({ color: '#c9a227', shininess: 90, side: T.DoubleSide }), 0.15, 1.1, 0.15); horn.rotation.set(-0.7, 0, -0.4); reg(gram, 'prop'); solidOf(gram, 0.02);
    IN.notes = []; for (var n = 0; n < 6; n++) { var nm = cvs(64, 64, function (c) { c.fillStyle = '#f9a8d4'; c.font = F(48); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n % 2 ? '\u266A' : '\u266B', 32, 32); }); var ns = new T.Sprite(new T.SpriteMaterial({ map: nm.tex, transparent: true, depthWrite: false })); ns.scale.set(0.35, 0.35, 1); r.add(ns); IN.notes.push(ns); }
    var harp = prop('attic', 'Harp', -110.8, -4.0, Math.PI / 2); var hs = new T.Shape(); hs.moveTo(0, 0); hs.quadraticCurveTo(0.7, 0.6, 0.5, 1.6); hs.lineTo(0.4, 1.6); hs.quadraticCurveTo(0.55, 0.6, 0, 0.1); add(harp, new T.ExtrudeGeometry(hs, { depth: 0.08, bevelEnabled: false }), ph('#c9a227', 80), -0.25, 0.1, 0); for (var s2 = 0; s2 < 6; s2++) add(harp, cy(0.006, 0.006, 1.0 + s2 * 0.08, 4), gl('#f5f0e0'), -0.15 + s2 * 0.08, 0.6 + s2 * 0.04, 0.04); reg(harp, 'prop'); solidOf(harp, 0.02);
    // ---- Toy Room ----
    var rh = prop('attic', 'Rocking horse', -109.6, 3.0, 0.8); IN.horse = rh; var hb = add(rh, sp(0.3, 16), ph('#f5f0e6', 20), 0, 0.85, 0); hb.scale.set(1.6, 0.9, 0.8); add(rh, sp(0.17, 14), ph('#f5f0e6', 20), 0.45, 1.15, 0).scale.set(1.3, 0.9, 0.8); add(rh, bx(0.06, 0.25, 0.2), ph('#ef4444', 20), 0.38, 1.25, 0); [-1, 1].forEach(function (sd) { var rk = add(rh, to(0.8, 0.04, 1.0, 16), ph('#ef4444', 30), 0, 0.85, sd * 0.2); rk.rotation.z = Math.PI + 1.07; [-0.3, 0.3].forEach(function (x) { add(rh, cy(0.03, 0.03, 0.55, 8), ph('#f5f0e6', 20), x, 0.42, sd * 0.2); }); }); reg(rh, 'prop'); solidOf(rh, 0.05);
    var jack = prop('attic', 'Jack-in-the-box', -110.6, 11.8, Math.PI / 2); add(jack, bx(0.55, 0.55, 0.55), ph('#3b82f6', 30), 0, 0.28, 0); add(jack, cy(0.03, 0.03, 0.25, 8), ph('#c9a227', 80), 0.33, 0.3, 0).rotation.z = Math.PI / 2;
    var jk = new T.Group(); jk.position.y = 0.56; jack.add(jk); IN.jack = jk; for (var k = 0; k < 4; k++) add(jk, to(0.12, 0.02, 7, 14), ph('#9ca3af', 60), 0, k * 0.1, 0).rotation.x = Math.PI / 2; add(jk, sp(0.16, 14), ph('#f1c7a5', 20), 0, 0.5, 0); add(jk, cn(0.14, 0.3, 12), ph('#ef4444', 30), 0, 0.75, 0); add(jk, sp(0.04, 8), ph('#ef4444', 30), 0, 0.46, 0.15); jk.scale.y = 0.05;
    reg(jack, 'prop'); solidOf(jack, 0.02); inter({ id: 'at_jack', kind: 'at_jack', root: 'attic', name: 'Jack-in-the-box', col: '#3b82f6', x: -109.3, z: 11.8, dir: [1, 0], r: 0.85 });
    var tb2 = prop('attic', 'Toy chest', -102.4, 13.2, Math.PI); add(tb2, bx(1.3, 0.65, 0.7), ph('#f97316', 20), 0, 0.33, 0); add(tb2, bx(1.34, 0.08, 0.74), ph('#facc15', 30), 0, 0.68, 0); ['#ef4444', '#3b82f6', '#22c55e'].forEach(function (c, i) { add(tb2, bx(0.24, 0.24, 0.02), ph(c, 30), -0.4 + i * 0.4, 0.35, -0.36); });
    reg(tb2, 'booth'); solidOf(tb2, 0.02); inter({ id: 'at_toybox', kind: 'at_toybox', root: 'attic', name: 'Toy chest', col: '#f97316', x: -102.4, z: 11.8, dir: [0, -1], r: 0.9 });
    var trk = new T.Group(); trk.position.set(-106.2, 0, 8.6); r.add(trk); A.noAud(trk); var ring = add(trk, to(1.4, 0.04, 7, 48), ph('#6b4a2e', 20), 0, 0.03, 0); ring.rotation.x = Math.PI / 2; var ring2 = add(trk, to(1.55, 0.04, 7, 48), ph('#6b4a2e', 20), 0, 0.03, 0); ring2.rotation.x = Math.PI / 2; void ring2;
    var train = new T.Group(); trk.add(train); IN.train = train; [['#ef4444', 0], ['#3b82f6', -0.42], ['#22c55e', -0.84]].forEach(function (q, i) { var car = new T.Group(); car.userData.off = q[1]; train.add(car); add(car, bx(0.3, 0.2, 0.18), ph(q[0], 40), 0, 0.16, 0); if (i === 0) { add(car, cy(0.05, 0.05, 0.14, 10), ph('#111', 40), 0.08, 0.32, 0); } [-0.1, 0.1].forEach(function (x) { [-1, 1].forEach(function (sd) { add(car, cy(0.05, 0.05, 0.03, 12), ph('#111', 40), x, 0.06, sd * 0.1).rotation.x = Math.PI / 2; }); }); });
    ['B', 'O', 'O'].forEach(function (l, i) { var bc = cvs(64, 64, function (c) { c.fillStyle = ['#ef4444', '#facc15', '#3b82f6'][i]; c.fillRect(0, 0, 64, 64); c.fillStyle = '#fff'; c.font = F(46); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(l, 32, 34); }); var blk = add(r, bx(0.34, 0.34, 0.34), new T.MeshLambertMaterial({ map: bc.tex }), -103.4 + i * 0.4, 0.17, 2.2); blk.rotation.y = (i - 1) * 0.3; A.noAud(blk); });
    var teddy = prop('attic', 'Teddy bear', -110.8, 7.6, Math.PI / 2); var tc = ph('#a16207', 10); add(teddy, sp(0.25, 14), tc, 0, 0.3, 0).scale.set(1, 1.1, 0.9); add(teddy, sp(0.18, 14), tc, 0, 0.7, 0); [-1, 1].forEach(function (sd) { add(teddy, sp(0.07, 10), tc, sd * 0.14, 0.86, 0); add(teddy, sp(0.08, 10), tc, sd * 0.24, 0.35, 0.05); add(teddy, sp(0.025, 8), gl('#111'), sd * 0.06, 0.74, 0.16); }); reg(teddy, 'prop'); solidOf(teddy, 0.02);
    // ---- Ghost Parlor: tea party ghosts + the locked corridor ----
    var tt2 = prop('attic', 'Tea table', -78.6, 8.0, 0); add(tt2, cy(0.7, 0.7, 0.06, 28), ph('#f5f0e6', 30), 0, 0.72, 0); add(tt2, cy(0.06, 0.12, 0.7, 12), ph('#3a2414', 20), 0, 0.35, 0); [0, 2.1, 4.2].forEach(function (a) { add(tt2, cy(0.06, 0.05, 0.08, 12), ph('#f9a8d4', 50), Math.cos(a) * 0.4, 0.79, Math.sin(a) * 0.4); }); add(tt2, sp(0.13, 14), ph('#93c5fd', 60), 0, 0.88, 0); reg(tt2, 'prop'); solidOf(tt2, 0.02);
    ghostNpc('attic', 'wisp', -79.6, 9.2, '#bfdbfe', 0.85); ghostNpc('attic', 'willa', -77.4, 9.0, '#fbcfe8', 0.8); NPC.wisp.g.scale.setScalar(0.7); NPC.willa.g.scale.setScalar(0.65);
    inter({ id: 'at_wisps', kind: 'at_wisps', root: 'attic', name: 'Wisp & Willa', col: '#bfdbfe', x: -78.6, z: 6.3, dir: [0, -1], r: 1.0 });
    var fp = prop('attic', 'Ghost fireplace', -78.5, 13.7, Math.PI); add(fp, bx(2.0, 1.6, 0.5), ph('#6b6b7a', 20), 0, 0.8, 0); add(fp, bx(1.2, 0.9, 0.1), gl('#0b0b14'), 0, 0.55, -0.22); add(fp, bx(2.3, 0.12, 0.6), ph('#4a3220', 20), 0, 1.66, 0);
    IN.fire = []; for (var f2 = 0; f2 < 3; f2++) IN.fire.push(add(fp, cn(0.14 - f2 * 0.02, 0.5, 10), new T.MeshBasicMaterial({ color: '#7dd3fc', transparent: true, opacity: 0.8 }), -0.25 + f2 * 0.25, 0.4, -0.15)); reg(fp, 'prop'); solidOf(fp, 0.02);
    sheeted('attic', 'sheet loveseat', -82.6, 3.4, 0.6, 1.6, 0.8, 0.8, 'sofa');
    var cd = prop('attic', 'Corridor door', ATT.maxX - 0.1, 4.0, -Math.PI / 2); add(cd, bx(1.7, 2.7, 0.14), ph('#3a2414', 20), 0, 1.35, 0.07); add(cd, bx(1.4, 2.4, 0.06), ph('#5b2b4a', 20), 0, 1.22, 0.16);
    IN.chains = new T.Group(); cd.add(IN.chains); [-1, 1].forEach(function (sd) { for (var c3 = 0; c3 < 7; c3++) { var ln = add(IN.chains, to(0.05, 0.014, 7, 12), ph('#9ca3af', 90), sd * (0.08 + c3 * 0.08), 1.3 + Math.abs(c3 - 3) * 0.03, 0.22); ln.rotation.y = c3 % 2 ? Math.PI / 2 : 0; } });
    var lockG = add(IN.chains, bx(0.3, 0.26, 0.1), ph('#c9a227', 90), 0, 1.2, 0.26); void lockG; IN.clueLights = []; for (var cl = 0; cl < 3; cl++) IN.clueLights.push(add(cd, sp(0.06, 10), new T.MeshBasicMaterial({ color: '#333' }), -0.3 + cl * 0.3, 2.45, 0.2));
    var cds = cvs(512, 96, function (c, w, h) { c.fillStyle = '#2a1a12'; rr(c, 4, 4, w - 8, h - 8, 12); c.fill(); glowText(c, 'THE LONG CORRIDOR', w / 2, h / 2, 44, '#93c5fd', w - 30); }); var cdm = texPlane(1.5, 0.28, cds.tex); cdm.position.set(0, 2.9, 0.16); cd.add(cdm);
    reg(cd, 'booth'); solidOf(cd, 0.02); inter({ id: 'at_door1', kind: 'at_door1', root: 'attic', name: 'The long corridor', col: '#93c5fd', x: ATT.maxX - 1.35, z: 4.0, dir: [-1, 0], r: 1.0 });
    // ---- Weekly Puzzle Room: four decor sets, one shows each ISO week ----
    var wk = prop('attic', 'Weekly puzzle table', -78.5, -12.6, 0); add(wk, bx(1.8, 0.1, 0.9), ph('#3a2414', 20), 0, 0.9, 0); [-0.8, 0.8].forEach(function (x) { add(wk, bx(0.1, 0.9, 0.8), ph('#2a1a12', 20), x, 0.45, 0); }); reg(wk, 'booth'); solidOf(wk, 0.02);
    IN.wkSign = cvs(512, 128, function () {}); var wsm = texPlane(2.4, 0.6, IN.wkSign.tex); wsm.position.set(-78.5, 2.6, -13.95); r.add(wsm); A.wallSign('weekly room sign', wsm);
    inter({ id: 'at_weekly', kind: 'at_weekly', root: 'attic', name: 'Weekly puzzle', col: '#7dffe0', x: -78.5, z: -11.0, dir: [0, 1], r: 1.0 });
    IN.themes = {};
    var tc1 = new T.Group(); r.add(tc1); A.noAud(tc1); IN.themes.clock = tc1; IN.gears = []; [[-82.5, 2.0, -13.9, 0.7, '#c9a227'], [-81.2, 1.2, -13.9, 0.45, '#b87333'], [-75.0, 1.8, -13.9, 0.8, '#c9a227'], [-73.0, 1.0, -13.9, 0.4, '#9ca3af']].forEach(function (q, i) { var gg = new T.Group(); gg.position.set(q[0], q[1], q[2] + 0.1); tc1.add(gg); add(gg, cy(q[3], q[3], 0.08, 20), ph(q[4], 80), 0, 0, 0).rotation.x = Math.PI / 2; for (var tth = 0; tth < 12; tth++) { var a = tth / 12 * Math.PI * 2; add(gg, bx(0.12, 0.16, 0.08), ph(q[4], 80), Math.cos(a) * (q[3] + 0.06), Math.sin(a) * (q[3] + 0.06), 0).rotation.z = a; } add(gg, cy(0.08, 0.08, 0.12, 10), ph('#3a2414', 20), 0, 0, 0).rotation.x = Math.PI / 2; IN.gears.push({ g: gg, s: (i % 2 ? -1 : 1) / q[3] }); });
    var tc2 = new T.Group(); r.add(tc2); A.noAud(tc2); IN.themes.candle = tc2; IN.flames = []; [[-83.6, -9], [-83.6, -5], [-73.4, -9], [-73.4, -5], [-80.5, -3], [-76.5, -3]].forEach(function (q, i) { var c4 = new T.Group(); c4.position.set(q[0], 0, q[1]); tc2.add(c4); add(c4, cy(0.08, 0.14, 1.0, 10), ph('#c9a227', 80), 0, 0.5, 0); for (var k2 = -1; k2 <= 1; k2++) { add(c4, cy(0.035, 0.035, 0.3 + (i + k2 + 2) % 3 * 0.1, 10), ph('#fef3c7', 10), k2 * 0.15, 1.15, 0); var fl2 = add(c4, sp(0.04, 8), gl('#fbbf24'), k2 * 0.15, 1.36 + (i + k2 + 2) % 3 * 0.05, 0); fl2.scale.y = 1.8; IN.flames.push(fl2); } });
    var tc3 = new T.Group(); r.add(tc3); A.noAud(tc3); IN.themes.mirror = tc3; [[-83.0, -13.9, 0], [-80.4, -13.9, 0], [-76.6, -13.9, 0], [-74.0, -13.9, 0]].forEach(function (q, i) { var mg = new T.Group(); mg.position.set(q[0], 1.5, q[1] + 0.06); tc3.add(mg); add(mg, to(0.55, 0.06, 7, 28), ph('#c9a227', 90), 0, 0, 0).scale.y = 1.4; var mm = add(mg, new T.CircleGeometry(0.52, 28), new T.MeshPhongMaterial({ color: '#cfe8ff', shininess: 160, specular: '#ffffff', emissive: '#203048' }), 0, 0, 0.01); mm.scale.y = 1.4; if (i === 1) { var gh = GA.AtticGhost('#eef2ff'); gh.scale.setScalar(0.6); gh.position.set(0, -0.2, 0.03); mg.add(gh); IN.mirrorGhost = gh; } });
    var tc4 = new T.Group(); r.add(tc4); A.noAud(tc4); IN.themes.kitchen = tc4; var caul = new T.Group(); caul.position.set(-82.8, 0, -8); tc4.add(caul); add(caul, new T.SphereGeometry(0.55, 20, 12, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), new T.MeshPhongMaterial({ color: '#1f2937', shininess: 60, side: T.DoubleSide }), 0, 0.6, 0); var brew = add(caul, cy(0.45, 0.45, 0.04, 20), new T.MeshBasicMaterial({ color: '#4ade80' }), 0, 0.88, 0); IN.brew = brew; [0, 2.1, 4.2].forEach(function (a) { add(caul, cy(0.04, 0.04, 0.4, 6), ph('#1f2937', 40), Math.cos(a) * 0.35, 0.2, Math.sin(a) * 0.35); });
    var stove = new T.Group(); stove.position.set(-73.6, 0, -8.5); tc4.add(stove); add(stove, bx(0.9, 0.9, 1.2), ph('#334155', 50), 0, 0.45, 0); add(stove, cy(0.08, 0.08, 1.6, 10), ph('#1f2937', 40), 0.2, 1.7, 0); ['#ef4444', '#facc15', '#a855f7'].forEach(function (c, i) { add(stove, cy(0.12, 0.1, 0.3 + i * 0.05, 14), ph(c, 40), -0.2, 1.05, -0.35 + i * 0.35); });
    IN.bubbles = []; for (var bb2 = 0; bb2 < 5; bb2++) IN.bubbles.push(add(caul, sp(0.06, 8), new T.MeshBasicMaterial({ color: '#86efac', transparent: true, opacity: 0.8 }), 0, 0.9, 0));
    // ---- spirit marbles (8 across the attic, library and observatory) + the weekly mystery opus ----
    IN.orbs = [orb('attic', 0, -110.6, 0.25, -7.2), orb('attic', 1, -88.0, 1.05, -13.2), orb('attic', 2, -98.0, 0.2, 8.2), orb('attic', 3, -73.2, 0.35, 12.8), orb('attic', 4, -103.4, 0.62, 2.0)];
    var opG = new T.Group(); r.add(opG); A.noAud(opG); IN.opusG = opG; var sheet = cvs(128, 160, function (c, w, h) { c.fillStyle = '#f5ecd7'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2a1a12'; c.lineWidth = 1.5; for (var y = 0; y < 3; y++) for (var l = 0; l < 5; l++) { c.beginPath(); c.moveTo(10, 30 + y * 44 + l * 5); c.lineTo(w - 10, 30 + y * 44 + l * 5); c.stroke(); } c.fillStyle = '#2a1a12'; for (var nn = 0; nn < 9; nn++) { c.beginPath(); c.ellipse(22 + nn * 11, 34 + (nn * 7 % 3) * 44 + (nn % 4) * 3, 4, 3, -0.4, 0, 7); c.fill(); } c.fillStyle = '#7c3aed'; c.font = F(14); c.textAlign = 'center'; c.fillText('OPUS ???', w / 2, 16); });
    var opm = texPlane(0.4, 0.5, sheet.tex, { double: true }); opm.position.y = 1.0; opG.add(opm); IN.opusSheet = opm; var ops = new T.Sprite(new T.SpriteMaterial({ map: A.glowTex, color: '#c4b5fd', transparent: true, opacity: 0.5, depthWrite: false, blending: T.AdditiveBlending })); ops.scale.set(1.0, 1.0, 1); ops.position.y = 1.0; opG.add(ops);
    IN.opusCab = inter({ id: 'at_opus', kind: 'at_opus', root: 'attic', name: 'A floating sheet of music', col: '#c4b5fd', x: -110.6, z: -2.2, dir: [0, 1], r: 0.95, hideGlow: true }); IN.opusCab.noStand = true;
    ANIM.attic.push(function (t, dt) {
      IN.dust.tick(t, dt, 0.04); var p = A.pose();
      IN.portraits.forEach(function (P) { if (Math.hypot(p.x - P.g.position.x, p.z - P.g.position.z) > 9) return; var odd = P.i === AT.oddPortrait(); P.g.updateMatrixWorld(); P.eyes.forEach(function (e) { var w = new T.Vector3(); e.g.getWorldPosition(w); var v = new T.Vector3(p.x - w.x, 1.5 - w.y, p.z - w.z); if (odd) v.set(Math.sin(t * 0.6) * 3, 2 + Math.cos(t * 0.4), 0.5).applyQuaternion(P.g.quaternion); var inv = P.g.quaternion.clone().invert(); v.applyQuaternion(inv).normalize(); e.pu.position.set(v.x * 0.03, v.y * 0.03, 0.03); }); });
      IN.rocker.rotation.x = Math.sin(t * 1.3) * 0.08; IN.horse.rotation.z = Math.sin(t * 1.1) * 0.06;
      if (IN.musicBox.userData.tick) IN.musicBox.userData.tick(t); IN.notes.forEach(function (n, k) { var q = (t * 0.25 + k / 6) % 1; n.position.set(-107 + Math.sin(q * 6 + k) * 0.8, 1.5 + q * 1.8, -10.6 + Math.cos(q * 5 + k) * 0.5); n.material.opacity = 1 - q; });
      IN.train.children.forEach(function (car) { var a = t * 0.6 + car.userData.off; car.position.set(Math.cos(a) * 1.47, 0, Math.sin(a) * 1.47); car.rotation.y = -a; });
      IN.jack.scale.y = S.jack ? Math.min(1, IN.jack.scale.y + dt * 4) : 0.05; IN.fire.forEach(function (f, k) { f.scale.y = 1 + Math.sin(t * 7 + k * 2) * 0.25; });
      var th = AT.theme().id; IN.gears.forEach(function (gg) { gg.g.rotation.z = t * 0.6 * gg.s; }); if (th === 'candle') IN.flames.forEach(function (f, k) { f.scale.x = 1 + Math.sin(t * 11 + k) * 0.2; }); if (th === 'mirror' && IN.mirrorGhost) IN.mirrorGhost.position.x = Math.sin(t * 0.8) * 0.25; if (th === 'kitchen') IN.bubbles.forEach(function (b, k) { var q = (t * 0.6 + k / 5) % 1; b.position.set(Math.sin(k * 2) * 0.3, 0.9 + q * 0.5, Math.cos(k * 2) * 0.3); b.material.opacity = 1 - q; });
      if (IN.opusG.visible) { IN.opusSheet.rotation.y = t * 1.2; IN.opusSheet.position.y = 1.0 + Math.sin(t * 2) * 0.08; }
    });
  }

  /* =========================================================================================
     D) COBWEB LIBRARY (behind the long corridor) + FOGGY OBSERVATORY (behind the secret bookcase)
     ========================================================================================= */
  function bookshelf(root, name, x, z, ry, w, h, seed) {
    var g = prop(root, name, x, z, ry), wood = ph('#4a2e1a', 15); add(g, bx(w, h, 0.5), ph('#2a1a10', 10), 0, h / 2, -0.02); [-w / 2, w / 2].forEach(function (sx) { add(g, bx(0.08, h, 0.52), wood, sx, h / 2, 0); }); var rows = Math.floor(h / 0.55);
    var r = rng(seed), n = 0, cols = ['#7f1d1d', '#1e3a8a', '#14532d', '#713f12', '#581c87', '#334155', '#9a3412', '#0f766e'];
    var im = new T.InstancedMesh(bx(1, 1, 1), new T.MeshLambertMaterial({ color: '#ffffff' }), rows * 40), m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), ps = new T.Vector3(), col = new T.Color();
    for (var i = 0; i < rows; i++) { add(g, bx(w, 0.05, 0.5), wood, 0, 0.1 + i * 0.55, 0); var xx = -w / 2 + 0.1; while (xx < w / 2 - 0.12 && n < rows * 40) { var bw = 0.06 + r() * 0.06, bh = 0.32 + r() * 0.16, lean = r() < 0.08 ? 0.25 : 0; q.setFromEuler(new T.Euler(0, 0, lean)); sc.set(bw, bh, 0.32 + r() * 0.08); ps.set(xx + bw / 2, 0.13 + i * 0.55 + bh / 2, 0.02); m4.compose(ps, q, sc); im.setMatrixAt(n, m4); im.setColorAt(n, col.set(cols[Math.floor(r() * cols.length)])); n++; xx += bw + 0.01 + (lean ? 0.06 : 0); if (r() < 0.04) xx += 0.25; } }
    im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; g.add(im); A.noAud(im);
    var cw = cobweb(), web = texPlane(0.8, 0.8, cw, { transparent: true, double: true }); web.position.set(w / 2 - 0.4, h - 0.4, 0.27); g.add(web); A.noAud(web);
    reg(g, 'prop'); solidOf(g, 0.02); return g; }
  function buildLibrary() {
    var r = mkRoot('attic2'), B = LIB; GA.Hub.addRegion(LIB); attShell('attic2', B, { ridge: B.H + 1.6, wall: '#3b2a3f' });
    var L = new T.PointLight('#ffcf8a', 1.0, 22, 1.3); L.position.set(-102, 3.6, 38); r.add(L); lantern('attic2', -104, 4.2, 35, '#ffcf8a'); lantern('attic2', -99, 4.2, 41, '#c4b5fd');
    bookshelf('attic2', 'bookshelf N1', -107.5, B.minZ + 0.3, 0, 3.6, 3.4, 11); bookshelf('attic2', 'bookshelf N2', -101.5, B.minZ + 0.3, 0, 3.6, 3.4, 12); bookshelf('attic2', 'bookshelf N3', -96.0, B.minZ + 0.3, 0, 3.0, 3.4, 13);
    bookshelf('attic2', 'bookshelf S1', -107.5, B.maxZ - 0.3, Math.PI, 3.6, 3.4, 14); bookshelf('attic2', 'bookshelf S2', -101.5, B.maxZ - 0.3, Math.PI, 3.6, 3.4, 15); bookshelf('attic2', 'bookshelf S3', -96.0, B.maxZ - 0.3, Math.PI, 3.0, 3.4, 16);
    // the rolling ladder on the north shelves
    var rl = new T.Group(); rl.position.set(-104.6, 0, B.minZ + 1.1); rl.rotation.x = -0.25; r.add(rl); A.noAud(rl); [-1, 1].forEach(function (sd) { add(rl, bx(0.06, 3.6, 0.06), ph('#8a5a2b', 20), sd * 0.25, 1.75, 0); }); for (var k = 0; k < 10; k++) add(rl, cy(0.02, 0.02, 0.5, 6), ph('#8a5a2b', 20), 0, 0.3 + k * 0.34, 0).rotation.z = Math.PI / 2;
    // the puzzle shelf / secret bookcase on the west wall
    var pz = prop('attic2', 'Secret bookcase', B.minX + 0.3, 38, Math.PI / 2); IN.bookcase = pz; var door2 = new T.Group(); door2.position.set(-1.0, 0, 0); pz.add(door2); IN.bookDoor = door2; var inner = new T.Group(); inner.position.set(1.0, 0, 0); door2.add(inner);
    add(inner, bx(2.0, 3.2, 0.45), ph('#3a2414', 15), 0, 1.6, 0); [0.6, 1.2, 1.8, 2.4].forEach(function (y) { add(inner, bx(1.9, 0.05, 0.44), ph('#5b3a1e', 15), 0, y, 0.01); });
    IN.puzzleBooks = []; AT.BOOK_COLS.forEach(function (c, i) { var b = add(inner, bx(0.14, 0.42, 0.34), new T.MeshPhongMaterial({ color: c[1], emissive: new T.Color(c[1]).multiplyScalar(0.35), shininess: 40 }), -0.55 + i * 0.22, 1.43, 0.05); IN.puzzleBooks.push(b); });
    add(inner, bx(1.4, 0.02, 0.3), ph('#c9a227', 80), 0, 1.22, 0.1); var dark = add(pz, bx(1.9, 3.0, 0.05), gl('#05030a'), 0, 1.55, -0.24); void dark;
    reg(pz, 'booth'); solidOf(pz, 0.02);
    inter({ id: 'at_books', kind: 'at_books', root: 'attic2', name: 'A suspicious bookshelf', col: '#c4b5fd', x: B.minX + 1.65, z: 38, dir: [1, 0], r: 1.0 });
    // reading corner: chair, lamp, ghost librarian, floating books, globe
    var ch = prop('attic2', 'Reading chair', -101.0, 42.0, Math.PI); var vel = ph('#7c2d12', 15); add(ch, bx(1.0, 0.45, 0.9), vel, 0, 0.32, 0); add(ch, bx(1.0, 0.95, 0.22), vel, 0, 0.9, -0.36); [-1, 1].forEach(function (sd) { add(ch, bx(0.2, 0.62, 0.9), vel, sd * 0.5, 0.45, 0); }); reg(ch, 'prop'); solidOf(ch, 0.02);
    var gb = prop('attic2', 'Old globe', -96.6, 35.0, 0); add(gb, cy(0.18, 0.25, 0.7, 12), ph('#4a2e1a', 15), 0, 0.35, 0); var gs = add(gb, sp(0.38, 24), new T.MeshPhongMaterial({ map: cvs(128, 64, function (c, w, h) { c.fillStyle = '#c8b38a'; c.fillRect(0, 0, w, h); c.fillStyle = '#6b8f5a'; for (var i = 0; i < 9; i++) { c.beginPath(); c.ellipse(Math.random() * w, Math.random() * h, 10 + Math.random() * 12, 6 + Math.random() * 8, 0, 0, 7); c.fill(); } }).tex, shininess: 30 }), 0, 1.1, 0); IN.globe = gs; add(gb, to(0.42, 0.02, Math.PI * 1.4, 24), ph('#c9a227', 80), 0, 1.1, 0).rotation.y = Math.PI / 2; reg(gb, 'prop'); solidOf(gb, 0.02);
    ghostNpc('attic2', 'hush', -101.0, 40.4, '#e9d5ff', 1.25); add(NPC.hush.g, to(0.06, 0.012), ph('#2b2b2b', 60), -0.1, 0.42, 0.29); add(NPC.hush.g, to(0.06, 0.012), ph('#2b2b2b', 60), 0.1, 0.42, 0.29); add(NPC.hush.g, sp(0.12, 12), ph('#6b21a8', 20), 0, 0.68, -0.05).scale.set(1, 0.7, 1);
    inter({ id: 'at_hush', kind: 'at_hush', root: 'attic2', name: 'Madame Hush, the Librarian', col: '#e9d5ff', x: -101.0, z: 38.7, dir: [0, -1], r: 1.0 });
    IN.flyBooks = []; for (var f = 0; f < 5; f++) { var fb = new T.Group(); r.add(fb); A.noAud(fb); var cc = ['#7f1d1d', '#1e3a8a', '#14532d', '#713f12', '#581c87'][f]; [-1, 1].forEach(function (sd) { var pg = add(fb, bx(0.22, 0.02, 0.3), ph(cc, 20), sd * 0.11, 0, 0); pg.userData.sd = sd; }); add(fb, bx(0.42, 0.015, 0.28), lm('#f5ecd7'), 0, 0.012, 0); IN.flyBooks.push(fb); }
    IN.ldust = dust('attic2', -102, 38, 18, 14, 4.2, 140);
    IN.orbs.push(orb('attic2', 5, -93.2, 1.7, 31.0), orb('attic2', 6, -110.8, 0.3, 45.0));
    var bk = prop('attic2', 'Library exit', B.maxX - 0.1, 38, -Math.PI / 2); add(bk, bx(1.6, 2.6, 0.14), ph('#3a2414', 20), 0, 1.3, 0.07); add(bk, bx(1.3, 2.3, 0.06), ph('#5b2b4a', 20), 0, 1.17, 0.16); reg(bk, 'booth'); solidOf(bk, 0.02);
    inter({ id: 'at_back2', kind: 'at_back2', root: 'attic2', name: 'Back to the attic', col: '#93c5fd', x: B.maxX - 1.3, z: 38, dir: [-1, 0], r: 0.9 });
    ANIM.attic2.push(function (t, dt) { IN.ldust.tick(t, dt, 0.03); IN.globe.rotation.y = t * 0.2; IN.flyBooks.forEach(function (fb, i) { var a = t * 0.35 + i * 1.26; fb.position.set(-102 + Math.cos(a) * 3.2, 2.4 + Math.sin(t * 1.3 + i) * 0.35, 38 + Math.sin(a) * 2.4); fb.rotation.y = -a; fb.children.forEach(function (pg) { if (pg.userData.sd) pg.rotation.z = pg.userData.sd * (0.3 + Math.sin(t * 6 + i) * 0.3); }); });
      IN.bookDoor.rotation.y += ((S.books ? -1.2 : 0) - IN.bookDoor.rotation.y) * Math.min(1, dt * 2); IN.puzzleBooks.forEach(function (b, i) { b.position.z = 0.05 + (IN.pulled && IN.pulled.indexOf(i) >= 0 ? 0.12 : 0); }); });
  }
  function buildObservatory() {
    var r = mkRoot('attic3'), B = OBS, W = B.maxX - B.minX, Dz = B.maxZ - B.minZ, cx = (B.minX + B.maxX) / 2, cz = (B.minZ + B.maxZ) / 2, H = B.H; GA.Hub.addRegion(OBS);
    var fl = add(r, new T.CircleGeometry(1, 48), new T.MeshPhongMaterial({ map: plankTex('#3b3248', 'rgba(0,0,0,.5)', [4, 4]), shininess: 20 }), cx, 0, cz); fl.scale.set(W / 2, Dz / 2, 1); fl.rotation.x = -Math.PI / 2; A.noAud(fl);
    var under = add(r, new T.PlaneGeometry(W, Dz), lm('#1d1828'), cx, -0.01, cz); under.rotation.x = -Math.PI / 2; A.noAud(under);
    // round wall (lathe ring) + star dome
    var wallM = new T.MeshLambertMaterial({ map: plankTex('#2d2a45', 'rgba(0,0,0,.5)', [12, 1.5]), side: T.BackSide }); var rw = add(r, new T.CylinderGeometry(1, 1, H, 40, 1, true), wallM, cx, H / 2, cz); rw.scale.set(W / 2, 1, Dz / 2); A.noAud(rw);
    var sky = cvs(1024, 512, function (c, w, h) { var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0b1030'); gr.addColorStop(1, '#2a3570'); c.fillStyle = gr; c.fillRect(0, 0, w, h); for (var i = 0; i < 500; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.random() * 0.7) + ')'; var s = Math.random() < 0.08 ? 2.4 : 1.2; c.fillRect(Math.random() * w, Math.random() * h * 0.9, s, s); }
      c.strokeStyle = 'rgba(196,181,253,.5)'; c.lineWidth = 2; [[[200, 120], [240, 90], [290, 110], [300, 160], [250, 190], [210, 170]], [[600, 150], [650, 100], [700, 140], [680, 200]], [[820, 80], [870, 120], [840, 170]]].forEach(function (pts) { c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); c.stroke(); }); });
    var dome = add(r, new T.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshBasicMaterial({ map: sky.tex, side: T.BackSide, fog: false }), cx, H, cz); dome.scale.set(W / 2, 4.2, Dz / 2); A.noAud(dome); IN.dome = dome;
    var slit = add(r, new T.PlaneGeometry(1.2, 9), new T.MeshBasicMaterial({ color: '#c7d7ff', transparent: true, opacity: 0.12, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }), cx, H + 2.2, cz); slit.rotation.x = Math.PI / 2; A.noAud(slit);
    A.addWall(B.minX - 1, B.maxX + 1, -1, 99, B.minZ - 0.4, B.minZ); A.addWall(B.minX - 1, B.maxX + 1, -1, 99, B.maxZ, B.maxZ + 0.4); A.addWall(B.minX - 0.4, B.minX, -1, 99, B.minZ - 1, B.maxZ + 1); A.addWall(B.maxX, B.maxX + 0.4, -1, 99, B.minZ - 1, B.maxZ + 1);
    // keep the player inside the round wall: corner blocks (solids only) in the four corners of the bounding box
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { var x0 = q[0] < 0 ? B.minX : cx + W / 2 * 0.72, x1 = q[0] < 0 ? cx - W / 2 * 0.72 : B.maxX, z0 = q[1] < 0 ? B.minZ : cz + Dz / 2 * 0.72, z1 = q[1] < 0 ? cz - Dz / 2 * 0.72 : B.maxZ; A.addSolid(x0, x1, z0, z1, 'wall'); });
    A.walls.push({ minX: B.minX - 1, maxX: B.maxX + 1, minY: H + 3.8, maxY: H + 9, minZ: B.minZ - 1, maxZ: B.maxZ + 1 });
    var L = new T.PointLight('#a5b4fc', 1.0, 22, 1.2); L.position.set(cx, 3.6, cz); r.add(L);
    // ground fog: drifting translucent layers
    var ft = cvs(256, 256, function (c, w, h) { for (var i = 0; i < 30; i++) { var x = Math.random() * w, y = Math.random() * h, rad = 30 + Math.random() * 60, g2 = c.createRadialGradient(x, y, 1, x, y, rad); g2.addColorStop(0, 'rgba(220,230,255,.35)'); g2.addColorStop(1, 'rgba(220,230,255,0)'); c.fillStyle = g2; c.fillRect(0, 0, w, h); } }); ft.tex.wrapS = ft.tex.wrapT = T.RepeatWrapping;
    IN.fog = []; for (var i = 0; i < 3; i++) { var fm = new T.MeshBasicMaterial({ map: ft.tex.clone(), transparent: true, opacity: 0.55, depthWrite: false }); fm.map.needsUpdate = true; fm.map.wrapS = fm.map.wrapT = T.RepeatWrapping; var fp = add(r, new T.PlaneGeometry(W * 0.9, Dz * 0.9), fm, cx, 0.15 + i * 0.22, cz); fp.rotation.x = -Math.PI / 2; fp.renderOrder = 3; A.noAud(fp); IN.fog.push(fp); }
    // the big brass telescope on a platform
    var ts = prop('attic3', 'Great telescope', cx, cz - 0.6, 0); add(ts, cy(1.3, 1.4, 0.3, 32), ph('#3b3248', 40), 0, 0.15, 0); add(ts, to(1.32, 0.05, 7, 40), ph('#c9a227', 90), 0, 0.31, 0).rotation.x = Math.PI / 2;
    add(ts, cy(0.18, 0.28, 1.4, 16), ph('#4a2e1a', 20), 0, 1.0, 0); var tube = new T.Group(); tube.position.set(0, 1.8, 0); ts.add(tube); IN.scope = tube; var brass = ph('#c9a227', 100, '#2a1e00');
    add(tube, cy(0.28, 0.34, 2.6, 24), brass, 0, 0.5, 0); add(tube, cy(0.2, 0.22, 0.8, 20), brass, 0, -1.1, 0); add(tube, to(0.34, 0.04, 7, 30), brass, 0, 1.8, 0).rotation.x = Math.PI / 2; add(tube, cy(0.32, 0.32, 0.02, 24), new T.MeshPhongMaterial({ color: '#9fd8ff', emissive: '#1d4ed8', shininess: 150 }), 0, 1.81, 0);
    tube.rotation.x = -0.75; reg(ts, 'booth'); solidOf(ts, 0.02);
    inter({ id: 'at_scope', kind: 'at_scope', root: 'attic3', name: 'The great telescope', col: '#a5b4fc', x: cx, z: cz + 1.65, dir: [0, 1], r: 1.0 });
    // orrery + star chart table + ghost astronomer
    var orr = prop('attic3', 'Orrery', cx - 5.6, cz - 3.6, 0); add(orr, cy(0.3, 0.4, 0.9, 16), ph('#4a2e1a', 20), 0, 0.45, 0); var sun = add(orr, sp(0.2, 16), gl('#fde047'), 0, 1.25, 0); void sun; IN.planets = [];
    [[0.45, '#93c5fd', 0.07], [0.7, '#f97316', 0.09], [0.95, '#a7f3d0', 0.06]].forEach(function (q, k) { var arm = new T.Group(); arm.position.y = 1.25; orr.add(arm); add(arm, bx(q[0], 0.015, 0.015), ph('#c9a227', 80), q[0] / 2, 0, 0); add(arm, sp(q[2], 12), ph(q[1], 40), q[0], 0, 0); IN.planets.push({ a: arm, s: 1.2 / (k + 1) }); }); reg(orr, 'prop'); solidOf(orr, 0.05);
    var stb = prop('attic3', 'Star chart table', cx + 5.4, cz - 3.4, -0.5); add(stb, bx(1.5, 0.08, 0.9), ph('#4a2e1a', 20), 0, 0.85, 0); [-0.65, 0.65].forEach(function (x) { add(stb, bx(0.08, 0.85, 0.8), ph('#2a1a10', 20), x, 0.42, 0); }); var chart = texPlane(1.3, 0.75, sky.tex); chart.rotation.x = -Math.PI / 2; chart.position.y = 0.9; stb.add(chart); reg(stb, 'prop'); solidOf(stb, 0.02);
    ghostNpc('attic3', 'twinkle', cx - 4.6, cz + 3.6, '#bfdbfe', 1.3); var hat = add(NPC.twinkle.g, cn(0.22, 0.55, 18), ph('#1e3a8a', 30), 0, 0.85, 0); void hat; add(NPC.twinkle.g, sp(0.05, 8), gl('#fde047'), 0.05, 1.0, 0.12);
    inter({ id: 'at_twinkle', kind: 'at_twinkle', root: 'attic3', name: 'Sir Twinkle, Ghost Astronomer', col: '#bfdbfe', x: cx - 4.6, z: cz + 2.0, dir: [0, -1], r: 1.0 });
    IN.orbs.push(orb('attic3', 7, cx + 5.6, 1.0, cz + 3.4));
    var bk = prop('attic3', 'Observatory exit', B.maxX - 0.15, cz, -Math.PI / 2); add(bk, bx(1.6, 2.6, 0.14), ph('#3a2414', 20), 0, 1.3, 0.07); add(bk, bx(1.3, 2.3, 0.06), ph('#2d2a45', 20), 0, 1.17, 0.16); reg(bk, 'booth'); solidOf(bk, 0.02);
    inter({ id: 'at_back3', kind: 'at_back3', root: 'attic3', name: 'Back to the library', col: '#93c5fd', x: B.maxX - 1.45, z: cz, dir: [-1, 0], r: 0.9 });
    ANIM.attic3.push(function (t) { IN.fog.forEach(function (f, k) { f.material.map.offset.set((t * 0.01 * (k + 1)) % 1, (t * 0.007 * (k % 2 ? -1 : 1)) % 1); }); IN.planets.forEach(function (p) { p.a.rotation.y = t * p.s; }); IN.scope.rotation.y = Math.sin(t * 0.15) * 0.4; IN.dome.rotation.y = t * 0.01; });
  }

  /* =========================================================================================
     F) CLUTTER: every room packed with stuff (furniture, shelves, candles, books, toys, rugs, lamps,
        dust beams, hanging spiders, wandering ghosts). Floor furniture is audited + solid; small things
        sitting on furniture are decoration only.
     ========================================================================================= */
  var CAM = { attic: { pitch: 0.46, dist: 5.4, ahead: 2.2, fov: 8 }, attic2: { pitch: 0.44, dist: 5.6, ahead: 2.2, fov: 8 }, attic3: { pitch: 0.42, dist: 6.0, ahead: 2.0, fov: 6 }, maint: { pitch: 0.5, dist: 5.2, ahead: 2.0, fov: 10 } };
  AT.CAM = CAM;
  var FLAMES = [];
  function flame(par, x, y, z, s) { var f = add(par, sp(0.035 * (s || 1), 8), gl('#ffc14d'), x, y, z); f.scale.y = 1.8; FLAMES.push(f); var g2 = new T.Sprite(new T.SpriteMaterial({ map: A.glowTex, color: '#ffb347', transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending })); g2.scale.set(0.45 * (s || 1), 0.45 * (s || 1), 1); g2.position.set(x, y, z); par.add(g2); return f; }
  function candle(par, x, y, z, h) { h = h || 0.22; add(par, cy(0.03, 0.03, h, 10), ph('#fef3c7', 10), x, y + h / 2, z); add(par, cy(0.05, 0.06, 0.02, 12), ph('#c9a227', 80), x, y + 0.01, z); flame(par, x, y + h + 0.05, z); }
  function books(par, x, y, z, n, ry, seed) { var r = rng(seed || 7), cols = ['#7f1d1d', '#1e3a8a', '#14532d', '#713f12', '#581c87', '#334155', '#9a3412']; var yy = y; for (var i = 0; i < n; i++) { var w = 0.28 + r() * 0.1, d = 0.2 + r() * 0.06, h = 0.05 + r() * 0.03; var b = add(par, bx(w, h, d), ph(cols[Math.floor(r() * cols.length)], 15), x + (r() - 0.5) * 0.05, yy + h / 2, z); b.rotation.y = (ry || 0) + (r() - 0.5) * 0.5; yy += h; } return yy; }
  function jar(par, x, y, z, col) { add(par, cy(0.07, 0.08, 0.2, 12), new T.MeshPhongMaterial({ color: col, transparent: true, opacity: 0.6, shininess: 120 }), x, y + 0.1, z); add(par, cy(0.075, 0.075, 0.03, 12), ph('#6b4a2e', 20), x, y + 0.215, z); }
  function shelfUnit(root, name, x, z, ry, w, h, fill, seed) {
    var g = prop(root, name, x, z, ry), wd = ph('#4a2e1a', 15), r = rng(seed || 3); add(g, bx(w, h, 0.42), ph('#2a1a10', 10), 0, h / 2, -0.02);
    [-w / 2, w / 2].forEach(function (sx) { add(g, bx(0.07, h, 0.44), wd, sx, h / 2, 0); }); var rows = Math.max(2, Math.floor(h / 0.5));
    for (var i = 0; i < rows; i++) { var y = 0.08 + i * (h - 0.1) / rows; add(g, bx(w, 0.05, 0.44), wd, 0, y, 0); var xx = -w / 2 + 0.2;
      while (xx < w / 2 - 0.2) { var k = fill === 'mixed' ? ['books', 'jars', 'candles', 'toys'][Math.floor(r() * 4)] : fill;
        if (k === 'books') { for (var b = 0; b < 4 && xx < w / 2 - 0.1; b++) { var bw = 0.05 + r() * 0.05, bh = 0.26 + r() * 0.12; add(g, bx(bw, bh, 0.26), ph(['#7f1d1d', '#1e3a8a', '#14532d', '#713f12', '#581c87', '#a16207'][Math.floor(r() * 6)], 15), xx, y + 0.025 + bh / 2, 0.04); xx += bw + 0.012; } }
        else if (k === 'jars') jar(g, xx + 0.05, y + 0.025, 0.05, ['#86efac', '#93c5fd', '#f9a8d4', '#fde68a', '#c4b5fd'][Math.floor(r() * 5)]);
        else if (k === 'candles') { candle(g, xx + 0.05, y + 0.025, 0.06, 0.12 + r() * 0.1); }
        else if (k === 'toys') { var tc = ['#ef4444', '#3b82f6', '#22c55e', '#facc15'][Math.floor(r() * 4)]; if (r() < 0.5) add(g, sp(0.08, 12), ph(tc, 40), xx + 0.05, y + 0.105, 0.05); else add(g, bx(0.14, 0.14, 0.14), ph(tc, 30), xx + 0.05, y + 0.095, 0.05).rotation.y = r(); }
        else if (k === 'records') { for (var q = 0; q < 6; q++) add(g, bx(0.012, 0.3, 0.3), ph(q % 2 ? '#111' : '#2a1a40', 40), xx + q * 0.025, y + 0.175, 0.04); xx += 0.12; }
        else if (k === 'tools') { add(g, cy(0.1, 0.1, 0.18, 12), ph(['#ef4444', '#3b82f6', '#facc15', '#9ca3af'][Math.floor(r() * 4)], 40), xx + 0.06, y + 0.115, 0.04); }
        xx += 0.22 + r() * 0.1; } }
    var web = texPlane(0.6, 0.6, cobweb(), { transparent: true, double: true }); web.position.set(-w / 2 + 0.3, h - 0.25, 0.22); g.add(web); A.noAud(web);
    reg(g, 'prop'); solidOf(g, 0.02); return g; }
  function table(root, name, x, z, ry, w, d, h, top) { var g = prop(root, name, x, z, ry), wd = ph('#5b3a1e', 20); add(g, bx(w, 0.06, d), wd, 0, h, 0); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { add(g, bx(0.06, h, 0.06), ph('#3a2414', 20), q[0] * (w / 2 - 0.06), h / 2, q[1] * (d / 2 - 0.06)); });
    var cl = add(g, bx(w + 0.04, 0.012, d + 0.04), ph('#e8e2d0', 8), 0, h + 0.035, 0); void cl; if (top) top(g, h + 0.04); reg(g, 'prop'); solidOf(g, 0.02); return g; }
  function lamp(root, name, x, z, col) { var g = prop(root, name, x, z, 0); add(g, cy(0.18, 0.22, 0.05, 16), ph('#2a1a12', 40), 0, 0.025, 0); add(g, cy(0.025, 0.025, 1.5, 8), ph('#c9a227', 80), 0, 0.8, 0);
    add(g, new T.CylinderGeometry(0.18, 0.32, 0.36, 18, 1, true), new T.MeshPhongMaterial({ color: col || '#fde68a', emissive: new T.Color(col || '#fde68a').multiplyScalar(0.5), side: T.DoubleSide, transparent: true, opacity: 0.9 }), 0, 1.62, 0);
    var s = new T.Sprite(new T.SpriteMaterial({ map: A.glowTex, color: col || '#ffd27a', transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending })); s.scale.set(1.6, 1.6, 1); s.position.y = 1.55; g.add(s); reg(g, 'prop'); solidOf(g, 0.02); return g; }
  function candelabra(root, name, x, z) { var g = prop(root, name, x, z, 0), gd = ph('#c9a227', 80); add(g, cy(0.16, 0.2, 0.05, 14), gd, 0, 0.025, 0); add(g, cy(0.025, 0.03, 1.15, 8), gd, 0, 0.6, 0);
    [-1, 0, 1].forEach(function (k) { var arm = add(g, bx(0.32, 0.02, 0.02), gd, k * 0.16, 1.15, 0); void arm; candle(g, k * 0.28, 1.16 + (k ? 0 : 0.08), 0, 0.2); }); reg(g, 'prop'); solidOf(g, 0.03); return g; }
  function stack(root, name, x, z, n, seed) { var g = prop(root, name, x, z, 0); var y = books(g, 0, 0, 0, n, 0, seed); candle(g, 0.02, y, 0.02, 0.16); reg(g, 'prop'); solidOf(g, 0.03); return g; }
  function barrel(root, name, x, z, col) { var g = prop(root, name, x, z, 0); var b = add(g, cy(0.36, 0.36, 0.95, 18), ph(col || '#7c4a1e', 20), 0, 0.48, 0); b.scale.set(1, 1, 1); [0.15, 0.8].forEach(function (y) { add(g, cy(0.375, 0.375, 0.05, 18), ph('#6b6b7a', 60), 0, y, 0); }); reg(g, 'prop'); solidOf(g, 0.02); return g; }
  function chair(root, name, x, z, ry, col) { var g = prop(root, name, x, z, ry), v = ph(col || '#7c2d4a', 15); add(g, bx(0.62, 0.36, 0.6), v, 0, 0.28, 0); add(g, bx(0.62, 0.72, 0.14), v, 0, 0.7, -0.24); [-1, 1].forEach(function (sd) { add(g, bx(0.12, 0.5, 0.6), v, sd * 0.31, 0.35, 0); }); reg(g, 'prop'); solidOf(g, 0.02); return g; }
  function rug(root, x, z, w, d, c1, c2, ry) { var t = cvs(256, 256, function (c, W, H) { c.fillStyle = c1; c.fillRect(0, 0, W, H); c.strokeStyle = c2; c.lineWidth = 10; c.strokeRect(14, 14, W - 28, H - 28); c.lineWidth = 3; c.strokeRect(30, 30, W - 60, H - 60); c.fillStyle = c2; for (var i = 0; i < 5; i++) { c.beginPath(); c.arc(W / 2, H / 2, 16 + i * 18, 0, 7); c.globalAlpha = 0.25; c.fill(); } c.globalAlpha = 1; });
    var m = add(R[root], new T.PlaneGeometry(w, d), new T.MeshLambertMaterial({ map: t.tex, transparent: true }), x, 0.012, z); m.rotation.x = -Math.PI / 2; m.rotation.z = ry || 0; A.noAud(m); return m; }
  function frame(root, x, y, z, ry, w, h, draw) { var g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; R[root].add(g); A.noAud(g); add(g, bx(w + 0.12, h + 0.12, 0.05), ph('#c9a227', 60), 0, 0, 0.025); var t = cvs(128, Math.round(128 * h / w), draw); var m = texPlane(w, h, t.tex); m.position.z = 0.055; g.add(m); return g; }
  function beam(root, x, y, z, ry, len, tilt) { var m = add(R[root], new T.CylinderGeometry(0.35, 1.2, len, 16, 1, true), new T.MeshBasicMaterial({ color: '#cfe0ff', transparent: true, opacity: 0.07, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }), x, y, z); m.rotation.set(0, ry, 0); m.rotateZ(tilt); A.noAud(m); return m; }
  var SPIDERS = [];
  function spider(root, x, y, z) { var g = new T.Group(); g.position.set(x, y, z); R[root].add(g); A.noAud(g); var th = add(g, cy(0.004, 0.004, 1, 4), gl('#d8d8e8'), 0, 0.5, 0); void th; var b = add(g, sp(0.07, 10), ph('#1b1530', 40), 0, 0, 0); void b; [-1, 1].forEach(function (sd) { add(g, sp(0.02, 6), gl('#ffffff'), sd * 0.025, 0.02, 0.06); for (var k = 0; k < 4; k++) { var l = add(g, bx(0.12, 0.012, 0.012), ph('#1b1530', 40), sd * 0.08, -0.01, -0.04 + k * 0.03); l.rotation.z = sd * -0.5; } }); SPIDERS.push({ g: g, y: y, ph: Math.random() * 6 }); }
  var WANDER = [];
  function wanderer(root, path, tint, sc, speed) { var g = GA.AtticGhost(tint); g.scale.setScalar(sc || 0.55); R[root].add(g); A.noAud(g); WANDER.push({ g: g, path: path, sp: speed || 0.12, ph: Math.random() }); }
  function buildClutter() {
    // ---- Dusty Storage ----
    rug('attic', -92, 5.2, 6, 4, '#5b2b3a', '#c9a227'); lamp('attic', 'storage lamp', -94.4, 1.2); crate('attic', 'crates W', -97.9, 3.9, 0.4, 2); crate('attic', 'crates NE', -86.0, 1.1, -0.3, 2);
    sheeted('attic', 'sheet mirror', -93.4, 13.45, 0, 0.8, 1.9, 0.35, 'tall'); stack('attic', 'storage books', -90.4, 13.3, 6, 21); shelfUnit('attic', 'storage shelf', -98.75, 1.6, Math.PI / 2, 1.8, 2.2, 'mixed', 31);
    barrel('attic', 'storage barrel', -85.7, 13.3); var box = prop('attic', 'hat boxes', -89.7, 0.8, 0.3); add(box, cy(0.28, 0.28, 0.3, 18), ph('#f9a8d4', 20), 0, 0.15, 0); add(box, cy(0.22, 0.22, 0.26, 18), ph('#93c5fd', 20), 0.04, 0.43, 0); add(box, cy(0.15, 0.15, 0.2, 16), ph('#fde68a', 20), 0, 0.66, 0); reg(box, 'prop'); solidOf(box, 0.02);
    frame('attic', -96.6, 2.0, 13.95, Math.PI, 0.8, 1.0, function (c, w, h) { c.fillStyle = '#2b3a55'; c.fillRect(0, 0, w, h); c.fillStyle = '#fde68a'; c.beginPath(); c.arc(w * 0.7, h * 0.3, 14, 0, 7); c.fill(); c.fillStyle = '#1b2a3a'; c.fillRect(0, h * 0.7, w, h); });
    // ---- Portrait Gallery ----
    rug('attic', -92, -7, 9, 2.6, '#4c1d3a', '#c9a227'); [[-94.3, -12.9], [-89.7, -12.9]].forEach(function (q, i) { var b = prop('attic', 'bust ' + i, q[0], q[1], 0); add(b, cy(0.25, 0.3, 1.1, 14), ph('#e7e5e4', 30), 0, 0.55, 0); add(b, sp(0.2, 14), ph('#f5f5f4', 40), 0, 1.36, 0); add(b, sp(0.24, 14), ph('#f5f5f4', 40), 0, 1.15, 0).scale.set(1.2, 0.6, 0.8); if (i) add(b, cn(0.16, 0.3, 12), ph('#ef4444', 30), 0, 1.62, 0); else add(b, cy(0.12, 0.12, 0.08, 12), ph('#1b1530', 30), 0, 1.58, 0); reg(b, 'prop'); solidOf(b, 0.02); });
    candelabra('attic', 'gallery candelabra W', -97.6, -4.6); candelabra('attic', 'gallery candelabra E', -86.4, -8.6); sheeted('attic', 'sheet statue', -86.3, -4.4, 0, 0.7, 1.7, 0.7, 'tall');
    [[-94.6, -6.0], [-89.4, -6.0]].forEach(function (q, i) { var st = prop('attic', 'stanchion ' + i, q[0], q[1], 0); add(st, cy(0.12, 0.14, 0.04, 12), ph('#c9a227', 80), 0, 0.02, 0); add(st, cy(0.025, 0.025, 0.9, 8), ph('#c9a227', 80), 0, 0.47, 0); add(st, sp(0.05, 10), ph('#c9a227', 80), 0, 0.94, 0); reg(st, 'prop'); solidOf(st, 0.02); });
    // ---- Music Box Room ----
    rug('attic', -105.5, -6.5, 6.5, 6, '#3b1d4a', '#f9a8d4', 0.2); shelfUnit('attic', 'record shelf', -111.75, -10.2, Math.PI / 2, 1.6, 2.0, 'records', 41);
    var bass = prop('attic', 'Double bass', -108.6, -13.4, 0.2); var bb = add(bass, sp(0.4, 16), ph('#9a5b2a', 50), 0, 0.6, 0); bb.scale.set(1, 1.5, 0.45); add(bass, sp(0.3, 16), ph('#9a5b2a', 50), 0, 1.3, 0).scale.set(1, 1.1, 0.45); add(bass, bx(0.06, 1.0, 0.05), ph('#1b1530', 40), 0, 1.75, 0.08); reg(bass, 'prop'); solidOf(bass, 0.02);
    var drum = prop('attic', 'Drum', -100.5, -2.3, 0); add(drum, cy(0.4, 0.4, 0.5, 20), ph('#dc2626', 40), 0, 0.25, 0); add(drum, cy(0.41, 0.41, 0.02, 20), ph('#f5f0e6', 20), 0, 0.51, 0); [0, 1].forEach(function (k) { var s2 = add(drum, cy(0.015, 0.015, 0.4, 6), ph('#c08a4a', 20), -0.1 + k * 0.2, 0.62, 0); s2.rotation.z = k ? -0.6 : 0.6; }); reg(drum, 'prop'); solidOf(drum, 0.02);
    var ms = prop('attic', 'Music stand', -103.1, -10.0, 0.3); add(ms, cy(0.02, 0.02, 1.1, 6), ph('#1b1530', 40), 0, 0.55, 0); var msh = add(ms, bx(0.5, 0.36, 0.02), ph('#1b1530', 40), 0, 1.15, 0.03); msh.rotation.x = -0.4; var sheetm = add(ms, bx(0.42, 0.3, 0.005), ph('#f5ecd7', 10), 0, 1.16, 0.05); sheetm.rotation.x = -0.4; reg(ms, 'prop'); solidOf(ms, 0.05);
    candelabra('attic', 'music candelabra', -108.8, -1.4); sheeted('attic', 'sheet chair', -100.4, -10.2, 0.3, 0.8, 0.9, 0.8, 'sofa'); chair('attic', 'music chair', -110.6, -9.0 + 3.6, Math.PI / 2, '#5b21b6');
    // ---- Toy Room ----
    rug('attic', -105.5, 7.5, 6, 5.5, '#1e3a5f', '#fde047'); var dh = prop('attic', 'Dollhouse', -100.2, 12.9, Math.PI); add(dh, bx(1.0, 0.9, 0.6), ph('#fbcfe8', 20), 0, 0.45, 0); var roofG = add(dh, cn(0.78, 0.5, 4), ph('#ef4444', 20), 0, 1.15, 0); roofG.rotation.y = Math.PI / 4; roofG.scale.z = 0.55; [-0.25, 0.25].forEach(function (x) { add(dh, bx(0.2, 0.2, 0.02), gl('#fde68a'), x, 0.6, -0.31); }); add(dh, bx(0.2, 0.32, 0.02), ph('#7c2d12', 20), 0, 0.16, -0.31); reg(dh, 'prop'); solidOf(dh, 0.02);
    var pyr = prop('attic', 'Block pyramid', -111.3, 0.95, 0); [[0, 0, 0], [0.32, 0, 0], [-0.32, 0, 0], [0.16, 0.3, 0], [-0.16, 0.3, 0], [0, 0.6, 0]].forEach(function (q, i) { add(pyr, bx(0.3, 0.3, 0.3), ph(['#ef4444', '#3b82f6', '#22c55e', '#facc15', '#a855f7', '#f97316'][i], 30), q[0], q[1] + 0.15, q[2]); }); reg(pyr, 'prop'); solidOf(pyr, 0.02);
    table('attic', 'Doll tea table', -100.7, 2.5, 0, 0.9, 0.9, 0.5, function (g, y) { [0, 1.6, 3.2, 4.8].forEach(function (a) { add(g, cy(0.05, 0.04, 0.06, 10), ph('#f9a8d4', 50), Math.cos(a) * 0.28, y + 0.03, Math.sin(a) * 0.28); }); add(g, sp(0.08, 12), ph('#93c5fd', 50), 0, y + 0.08, 0); });
    shelfUnit('attic', 'toy shelf', -111.75, 5.0, Math.PI / 2, 1.6, 1.8, 'toys', 51);
    var top = new T.Group(); top.position.set(-104.2, 0, 5.2); R.attic.add(top); A.noAud(top); IN.top = top; add(top, cn(0.18, 0.3, 14), ph('#22c55e', 40), 0, 0.15, 0).rotation.x = Math.PI; add(top, cy(0.02, 0.02, 0.12, 6), ph('#facc15', 40), 0, 0.36, 0);
    var kite = frame('attic', -105.5, 2.2, 13.95, Math.PI, 0.9, 0.9, function (c, w, h) { c.fillStyle = '#1e3a5f'; c.fillRect(0, 0, w, h); c.fillStyle = '#ef4444'; c.beginPath(); c.moveTo(w / 2, 8); c.lineTo(w - 14, h / 2); c.lineTo(w / 2, h - 8); c.lineTo(14, h / 2); c.fill(); c.strokeStyle = '#fde047'; c.lineWidth = 3; c.beginPath(); c.moveTo(w / 2, 8); c.lineTo(w / 2, h - 8); c.moveTo(14, h / 2); c.lineTo(w - 14, h / 2); c.stroke(); }); void kite;
    for (var sd = 0; sd < 6; sd++) { var sol = new T.Group(); sol.position.set(-106.2 + Math.cos(sd) * 0.7, 0, 8.6 + Math.sin(sd) * 0.7); R.attic.add(sol); A.noAud(sol); add(sol, cy(0.04, 0.04, 0.16, 8), ph('#dc2626', 30), 0, 0.08, 0); add(sol, sp(0.035, 8), ph('#f1c7a5', 20), 0, 0.19, 0); add(sol, cy(0.035, 0.035, 0.07, 8), ph('#111', 30), 0, 0.25, 0); }
    // ---- Ghost Parlor ----
    rug('attic', -78.6, 8.2, 5, 4.6, '#1e3a5f', '#93c5fd'); var gfc = prop('attic', 'Grandfather clock', -73.0, 9.6, -Math.PI / 2); add(gfc, bx(0.6, 2.2, 0.4), ph('#5b3a1e', 30), 0, 1.1, 0); add(gfc, cy(0.22, 0.22, 0.03, 20), ph('#f5f0e6', 20), 0, 1.75, 0.21).rotation.x = Math.PI / 2; var pend = new T.Group(); pend.position.set(0, 1.45, 0.21); gfc.add(pend); add(pend, bx(0.02, 0.6, 0.02), ph('#c9a227', 80), 0, -0.3, 0); add(pend, cy(0.08, 0.08, 0.02, 14), ph('#c9a227', 80), 0, -0.6, 0).rotation.x = Math.PI / 2; IN.pend = pend; reg(gfc, 'prop'); solidOf(gfc, 0.02);
    shelfUnit('attic', 'parlor bookcase', -84.75, 11.8, Math.PI / 2, 2.0, 2.4, 'books', 61); chair('attic', 'fireside chair W', -80.9, 12.0, Math.PI - 0.5, '#1e3a8a'); chair('attic', 'fireside chair E', -76.2, 12.0, Math.PI + 0.5, '#1e3a8a');
    chair('attic', 'tea chair', -80.15, 7.9, Math.PI / 2, '#be185d'); lamp('attic', 'parlor lamp', -84.0, 1.0, '#bfdbfe'); [-79.3, -78.5, -77.7].forEach(function (x, i) { var g = new T.Group(); g.position.set(x, 1.72, 13.5); R.attic.add(g); A.noAud(g); candle(g, 0, 0, 0, 0.14 + i * 0.05); });
    frame('attic', -82.5, 2.0, 13.95, Math.PI, 0.9, 1.1, function (c, w, h) { c.fillStyle = '#312e81'; c.fillRect(0, 0, w, h); c.fillStyle = '#eef2ff'; c.beginPath(); c.arc(w / 2, h * 0.45, 30, Math.PI, 0); c.lineTo(w / 2 + 30, h * 0.75); c.lineTo(w / 2 - 30, h * 0.75); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(w / 2 - 10, h * 0.42, 4, 0, 7); c.arc(w / 2 + 10, h * 0.42, 4, 0, 7); c.fill(); });
    // ---- Weekly room (permanent bits) ----
    crate('attic', 'weekly crates W', -84.0, -1.3, 0.3, 2); crate('attic', 'weekly crates E', -73.0, -1.3, -0.2, 2); rug('attic', -78.5, -7.5, 5, 6, '#10251f', '#7dffe0');
    // ---- cobwebs, dust beams, spiders, wandering ghosts ----
    beam('attic', -109.5, 3.6, 0, Math.PI / 2, 6, 1.1); beam('attic', -74.5, 3.6, 0, -Math.PI / 2, 6, 1.1);
    [[-104, 4.2, -9], [-95, 4.4, 10], [-80, 4.2, -5], [-110, 3.6, 10], [-88, 4.1, -11]].forEach(function (q) { spider('attic', q[0], q[1], q[2]); });
    wanderer('attic', [[-92, 2.3, 4], [-92, 2.3, -4], [-105, 2.6, -6], [-105, 2.4, 6], [-92, 2.3, 4], [-79, 2.4, 6], [-79, 2.6, -6], [-92, 2.3, -4]], '#e0f2fe', 0.5, 0.06);
    wanderer('attic', [[-106, 1.8, 9], [-103, 2.2, 6], [-107, 2.0, 4]], '#fef9c3', 0.35, 0.18);
    // ---- Cobweb Library: more shelves, tables, stacks, candles ----
    var LB = LIB; rug('attic2', -102, 38, 9, 6, '#3b1d1d', '#c9a227');
    shelfUnit('attic2', 'lib W shelf N', LB.minX + 0.25, 34.0, Math.PI / 2, 2.4, 3.2, 'books', 71); shelfUnit('attic2', 'lib W shelf S', LB.minX + 0.25, 42.1, Math.PI / 2, 2.4, 3.2, 'books', 72);
    shelfUnit('attic2', 'lib E shelf N', LB.maxX - 0.25, 33.4, -Math.PI / 2, 2.4, 3.2, 'mixed', 73); shelfUnit('attic2', 'lib E shelf S', LB.maxX - 0.25, 42.6, -Math.PI / 2, 2.4, 3.2, 'mixed', 74);
    table('attic2', 'Reading table', -102.2, 34.6, 0, 3.0, 1.1, 0.8, function (g, y) { books(g, -1.0, y, 0, 5, 0.3, 81); books(g, 0.9, y, 0.1, 3, -0.2, 82); candle(g, -0.2, y, 0.2, 0.2); candle(g, 0.3, y, -0.2, 0.15); var op = add(g, bx(0.5, 0.02, 0.36), ph('#f5ecd7', 10), 0.2, y + 0.01, 0.15); op.rotation.y = 0.2; add(g, sp(0.12, 14), new T.MeshPhongMaterial({ color: '#c4b5fd', transparent: true, opacity: 0.7, shininess: 140, emissive: '#3b0764' }), -0.55, y + 0.12, -0.2); });
    table('attic2', 'Writing desk', -96.6, 42.4, Math.PI, 1.4, 0.7, 0.8, function (g, y) { books(g, -0.4, y, 0, 4, 0, 83); candle(g, 0.4, y, 0, 0.22); add(g, cy(0.04, 0.05, 0.1, 10), ph('#111', 40), 0.1, y + 0.05, 0.1); });
    chair('attic2', 'desk chair', -96.6, 41.2, 0, '#7c2d12'); stack('attic2', 'book stack 1', -106.9, 40.9, 7, 84); stack('attic2', 'book stack 2', -98.4, 36.6, 5, 85); stack('attic2', 'book stack 3', -105.0, 36.3, 8, 86);
    candelabra('attic2', 'lib candelabra W', -108.8, 38.0 + 3.0); candelabra('attic2', 'lib candelabra E', -94.2, 35.0); lamp('attic2', 'lib lamp', -99.2, 43.4, '#fde68a');
    [[-104, 4.4, 33], [-97, 4.4, 44], [-108, 4.2, 43]].forEach(function (q) { spider('attic2', q[0], q[1], q[2]); });
    wanderer('attic2', [[-106, 2.8, 33], [-98, 3.0, 33], [-98, 2.6, 43], [-106, 2.8, 43]], '#ede9fe', 0.4, 0.07);
    // ---- Foggy Observatory ----
    var oc = OBS; rug('attic3', -102, 68, 7, 7, '#0b1030', '#a5b4fc'); var arm = prop('attic3', 'Armillary sphere', -109.8, 68.0, 0); add(arm, cy(0.2, 0.3, 0.9, 14), ph('#4a2e1a', 20), 0, 0.45, 0); var ag = new T.Group(); ag.position.y = 1.3; arm.add(ag); IN.armil = ag; [0, 1, 2].forEach(function (k) { var rg = add(ag, to(0.38, 0.015, 7, 30), ph('#c9a227', 90), 0, 0, 0); rg.rotation.set(k * 1.0, k * 0.7, 0); }); add(ag, sp(0.08, 12), gl('#fde047'), 0, 0, 0); reg(arm, 'prop'); solidOf(arm, 0.05);
    var t2 = prop('attic3', 'Small telescope', -98.4, 73.0, -0.6); [0, 2.1, 4.2].forEach(function (a) { var l = add(t2, cy(0.015, 0.02, 1.1, 6), ph('#5b3a1e', 20), Math.sin(a) * 0.18, 0.5, Math.cos(a) * 0.18); l.rotation.set(Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3); }); var tb = add(t2, cy(0.06, 0.08, 0.9, 14), ph('#c9a227', 100), 0, 1.15, 0); tb.rotation.x = -0.9; reg(t2, 'prop'); solidOf(t2, 0.02);
    table('attic3', 'Astronomer desk', -105.0, 62.4, 0.3, 1.4, 0.7, 0.8, function (g, y) { books(g, -0.4, y, 0, 4, 0, 91); candle(g, 0.45, y, 0.1, 0.2); var sc2 = add(g, cy(0.03, 0.03, 0.5, 8), ph('#f5ecd7', 10), 0.05, y + 0.03, -0.1); sc2.rotation.z = Math.PI / 2; });
    var sg = prop('attic3', 'Star globe', -99.0, 62.4, 0); add(sg, cy(0.15, 0.25, 0.8, 12), ph('#4a2e1a', 20), 0, 0.4, 0); IN.sglobe = add(sg, sp(0.36, 24), new T.MeshPhongMaterial({ color: '#1e2a5a', emissive: '#0b1030', shininess: 80 }), 0, 1.1, 0); for (var st2 = 0; st2 < 14; st2++) { var a1 = st2 * 2.4, b1 = (st2 * 1.3) % 3 - 1.5; add(IN.sglobe, sp(0.025, 6), gl('#fde047'), Math.cos(a1) * Math.cos(b1) * 0.36, Math.sin(b1) * 0.36, Math.sin(a1) * Math.cos(b1) * 0.36); } reg(sg, 'prop'); solidOf(sg, 0.02);
    crate('attic3', 'star chart crates', -110.0, 71.6, 0.4, 2); stack('attic3', 'obs book stack', -96.0, 66.2, 6, 92); candelabra('attic3', 'obs candelabra', -108.2, 64.6 - 1.6);
    wanderer('attic3', [[-106, 3.6, 64], [-98, 3.8, 64], [-98, 3.6, 72], [-106, 3.8, 72]], '#bfdbfe', 0.45, 0.05);
    // ---- Maintenance Room ----
    var MB2 = MNT; var pg = new T.Group(); pg.position.set(27.4, 1.7, MB2.minZ + 0.05); R.maint.add(pg); A.noAud(pg); add(pg, bx(2.2, 1.2, 0.04), ph('#a16207', 10), 0, 0, 0.02); for (var tl = 0; tl < 7; tl++) { var tool = add(pg, bx(0.05, 0.3 + (tl % 3) * 0.1, 0.03), ph(['#9ca3af', '#ef4444', '#3b82f6', '#facc15'][tl % 4], 50), -0.9 + tl * 0.3, (tl % 2) * 0.15, 0.06); tool.rotation.z = (tl % 2 ? 0.3 : -0.2); }
    var lk = prop('maint', 'Lockers', MB2.maxX - 0.3, 105.4, -Math.PI / 2); for (var l2 = 0; l2 < 3; l2++) { add(lk, bx(0.58, 1.9, 0.5), ph(['#2563eb', '#16a34a', '#dc2626'][l2], 50), -0.6 + l2 * 0.6, 0.95, 0); [0.3, 0.4, 0.5].forEach(function (y) { add(lk, bx(0.3, 0.02, 0.01), gl('#0b1020'), -0.6 + l2 * 0.6, 1.6 - y + 0.4, 0.26); }); add(lk, bx(0.04, 0.12, 0.02), ph('#d1d5db', 80), -0.42 + l2 * 0.6, 1.0, 0.26); } add(lk, bx(0.3, 0.2, 0.01), ph('#f8fafc', 10), 0, 1.5, 0.265); reg(lk, 'prop'); solidOf(lk, 0.02);
    barrel('maint', 'oil barrel 1', 21.0, 110.9, '#1d4ed8'); barrel('maint', 'oil barrel 2', 21.9, 111.3, '#b91c1c'); shelfUnit('maint', 'parts shelf', MB2.minX + 0.25, 109.0, Math.PI / 2, 1.6, 1.9, 'tools', 101);
    var cot = prop('maint', 'Larry\u2019s cot', 31.0, 105.4, 0); add(cot, bx(0.85, 0.08, 2.0), ph('#4d7c0f', 20), 0, 0.45, 0); [[-0.38, -0.9], [0.38, -0.9], [-0.38, 0.9], [0.38, 0.9]].forEach(function (q) { add(cot, bx(0.05, 0.45, 0.05), ph('#6b7280', 50), q[0], 0.22, q[1]); }); add(cot, bx(0.6, 0.12, 0.35), ph('#f5f5f4', 10), 0, 0.55, -0.75); var bl = add(cot, bx(0.8, 0.06, 1.1), ph('#b91c1c', 10), 0, 0.52, 0.35); void bl; reg(cot, 'prop'); solidOf(cot, 0.02);
    chair('maint', 'Larry\u2019s armchair', 28.6, 104.4, Math.PI / 2 + 0.4, '#a16207'); var tv = prop('maint', 'Old TV', 25.4, 104.2, -Math.PI / 2 + 0.3); add(tv, bx(0.7, 0.55, 0.55), ph('#3f3f46', 30), 0, 0.55 + 0.28, 0); add(tv, bx(0.55, 0.4, 0.02), gl('#4ade80'), 0, 0.84, 0.28); add(tv, bx(0.6, 0.55, 0.5), ph('#5b3a1e', 20), 0, 0.28, 0); IN.tvScr = tv.children[1]; reg(tv, 'prop'); solidOf(tv, 0.02);
    var cart = prop('maint', 'Tool cart', 23.6, 110.9, 0); add(cart, bx(0.8, 0.7, 0.5), ph('#dc2626', 40), 0, 0.5, 0); [0.3, 0.55, 0.8].forEach(function (y) { add(cart, bx(0.78, 0.02, 0.01), gl('#111'), 0, y, 0.26); }); [-0.32, 0.32].forEach(function (x) { add(cart, cy(0.06, 0.06, 0.04, 10), ph('#111', 30), x, 0.06, 0.2).rotation.x = Math.PI / 2; }); reg(cart, 'prop'); solidOf(cart, 0.02);
    rug('maint', 29.6, 105.2, 3.2, 2.6, '#7c2d12', '#facc15'); [[23, MB2.H - 0.3, 104], [30, MB2.H - 0.3, 108]].forEach(function (q) { var g = new T.Group(); g.position.set(q[0], q[1], q[2]); R.maint.add(g); A.noAud(g); add(g, cy(0.005, 0.005, 0.3, 4), gl('#222'), 0, 0.15, 0); add(g, sp(0.08, 10), gl('#fff2c4'), 0, 0, 0); var s2 = new T.Sprite(new T.SpriteMaterial({ map: A.glowTex, color: '#ffe6b0', transparent: true, opacity: 0.6, depthWrite: false, blending: T.AdditiveBlending })); s2.scale.set(1.2, 1.2, 1); g.add(s2); });
    // ---- animate ----
    ANIM.any.push(function (t) {
      FLAMES.forEach(function (f, i) { if (!f.parent || !f.parent.visible) return; f.scale.x = 1 + Math.sin(t * 13 + i * 1.7) * 0.18; f.scale.y = 1.8 + Math.sin(t * 9 + i) * 0.3; });
      SPIDERS.forEach(function (s2) { s2.g.position.y = s2.y - 0.4 - Math.abs(Math.sin(t * 0.6 + s2.ph)) * 0.8; s2.g.children[0].scale.y = 0.4 + Math.abs(Math.sin(t * 0.6 + s2.ph)) * 0.8 + 0.4; s2.g.children[0].position.y = s2.g.children[0].scale.y / 2; });
      WANDER.forEach(function (w) { if (!w.g.parent.visible) return; var n = w.path.length, u = (t * w.sp + w.ph) % 1 * n, i = Math.floor(u), f2 = u - i, a = w.path[i], b = w.path[(i + 1) % n]; w.g.position.set(a[0] + (b[0] - a[0]) * f2, a[1] + (b[1] - a[1]) * f2 + Math.sin(t * 2) * 0.15, a[2] + (b[2] - a[2]) * f2); w.g.rotation.y = Math.atan2(b[0] - a[0], b[2] - a[2]); w.g.userData.mat.opacity = 0.65 + Math.sin(t * 1.5 + w.ph * 6) * 0.25; });
      if (IN.top) { IN.top.rotation.y = t * 12; IN.top.position.x = -104.2 + Math.sin(t * 0.7) * 0.3; } if (IN.pend) IN.pend.rotation.z = Math.sin(t * 2.4) * 0.3; if (IN.armil) { IN.armil.rotation.y = t * 0.5; IN.armil.rotation.x = t * 0.3; } if (IN.sglobe) IN.sglobe.rotation.y = t * 0.3;
      if (IN.tvScr && IN.tvScr.parent.parent.visible) IN.tvScr.material.color.setHSL(0.35 + Math.sin(t * 7) * 0.05, 0.8, 0.45 + Math.sin(t * 23) * 0.08);
    });
  }
  /* =========================================================================================
     E) build, per-frame, travel
     ========================================================================================= */
  function drawWeeklySign() { var th = AT.theme(), c = IN.wkSign.g, w = 512, h = 128; c.clearRect(0, 0, w, h); c.fillStyle = '#10251f'; rr(c, 4, 4, w - 8, h - 8, 16); c.fill(); c.strokeStyle = '#7dffe0'; c.lineWidth = 5; c.stroke();
    glowText(c, th.icon + ' ' + th.name.toUpperCase(), w / 2, 48, 44, '#7dffe0', w - 40); c.font = F(24); c.fillStyle = AT.weeklyDone() ? '#fde047' : '#d1fae5'; c.textAlign = 'center'; c.fillText(AT.weeklyDone() ? '\u2714 solved this week! new room next week' : 'this room changes every week', w / 2, 96); IN.wkSign.tex.needsUpdate = true; IN.wkKey = AT.weekKey() + AT.weeklyDone(); }
  function refreshInside() {
    if (!IN.orbs) return; IN.orbs.forEach(function (c) { var got = !!S.orbs[c.data.i]; c.orbG.visible = !got; c.disabled = got; });
    var th = AT.theme().id; Object.keys(IN.themes).forEach(function (k) { IN.themes[k].visible = k === th; });
    var os = AT.opusSpot(), done = AT.opusDone(); var par = R[os.r]; if (IN.opusG.parent !== par) par.add(IN.opusG); IN.opusG.position.set(os.x, 0, os.z); IN.opusG.visible = !done; moveCab(IN.opusCab, os.x, os.z); IN.opusCab.area = os.r; IN.opusCab.disabled = done;
    if (IN.opusCab.group.parent !== par) { par.add(IN.opusCab.group); par.add(IN.opusCab.glowMesh); }
    IN.chains.visible = !S.door1; IN.clueLights.forEach(function (m, i) { m.material.color.set(S.clues[AT.CLUE_IDS[i]] ? '#7dffe0' : '#333333'); });
    drawWeeklySign();
  }
  AT._refreshInside = refreshInside;
  var live = {}, lastP = null;
  AT.build = function (api) {
    A = api; AT.built = false;
    buildHatch(); buildMaintDoor(); buildMaint(); buildAttic(); buildLibrary(); buildObservatory(); buildClutter();
    GA.Hub.camTune = function (a) { return CAM[a] || null; };
    if (GA.Areas && GA.Areas.FOGS) { GA.Areas.FOGS.attic = ['#1a1230', 12, 34]; GA.Areas.FOGS.attic2 = ['#140f22', 10, 28]; GA.Areas.FOGS.attic3 = ['#2a3558', 6, 24]; GA.Areas.FOGS.maint = ['#121417', 10, 26]; }
    if (GA.Areas && GA.Areas.ARRIVE) { var go = GA.Areas.goTo;
      GA.Areas.ARRIVE.attic = function () { go(ATT.spawn.x, ATT.spawn.z, 0, -1); };
      GA.Areas.ARRIVE.attic_door1 = function () { go(ATT.maxX - 2.6, 4.0, -1, 0); };
      GA.Areas.ARRIVE.attic2 = function () { go(LIB.spawn.x, LIB.spawn.z, -1, 0); };
      GA.Areas.ARRIVE.attic2_back = function () { go(LIB.minX + 2.9, 38, 1, 0); };
      GA.Areas.ARRIVE.attic3 = function () { go(OBS.spawn.x, OBS.spawn.z, -1, 0); };
      GA.Areas.ARRIVE.hatch = function () { var s = AT.spot(); go(s.x, s.z + 1.4, 0, -1); };
      GA.Areas.ARRIVE.maint = function () { go(MNT.spawn.x, MNT.spawn.z, 1, 0); };
      GA.Areas.ARRIVE.maint_back = function () { var c = CABS.at_mdoor; go(c.x - 0.6, c.z, -1, 0); }; }
    ['attic', 'attic2', 'attic3', 'maint'].forEach(function (k) { R[k].visible = false; live[k] = false; });
    refreshInside(); refreshHatch(); AT.built = true; if (GA.Mimi && GA.Mimi.build) { try { GA.Mimi.build(); } catch (e) { if (window.console) console.warn('Mimi failed to build', e); } } if (GA.AtticUI && GA.AtticUI.init) GA.AtticUI.init();
  };
  AT.travel = function (where, cb) { if (GA.Areas && GA.Areas.travel) GA.Areas.travel(where, cb); };
  AT.frame = function (t, dt) {
    if (!AT.built) return; var area = GA.Hub.area();
    ['attic', 'attic2', 'attic3', 'maint'].forEach(function (k) { var on = area === k; if (on !== live[k]) { live[k] = on; R[k].visible = on; if (on) { S.visited[k] = true; save(); AT.ev('atVisit_' + k); if (AT.onEnter) AT.onEnter(k); } } });
    hatchFrame(t, dt);
    ANIM.any.forEach(function (f) { f(t, dt); }); if (live.attic) ANIM.attic.forEach(function (f) { f(t, dt); }); if (live.attic2) ANIM.attic2.forEach(function (f) { f(t, dt); }); if (live.attic3) ANIM.attic3.forEach(function (f) { f(t, dt); }); if (live.maint) ANIM.maint.forEach(function (f) { f(t, dt); });
    if (IN.wkKey !== AT.weekKey() + AT.weeklyDone()) refreshInside();
    if (AT.UIframe) AT.UIframe(t, dt, area);
    if (R.mimi) { R.mimi.visible = !/^(attic|attic2|attic3|maint|roof|basement|gallery)$/.test(area); if (GA.Mimi && GA.Mimi.frame) GA.Mimi.frame(t, dt); }
  };
  AT.mood = function () { return { area: GA.Hub.area(), spot: AT.spotIndex(), theme: AT.theme().id }; };
})();
