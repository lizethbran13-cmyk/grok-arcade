/* Grok Arcade - speed & looks pass (Oct 2026). Makes the 3D hub smoother on phones without making it look worse:
   1. LIGHT POOL: every lamp in the arcade feeds a fixed set of real lights; the ones nearest you get them. Lights never pop
      and the number of lights never changes, so the phone never has to rebuild its shaders when you walk into a new room.
   2. AREA CULLING: only the area you're in (+ the rooms you can actually see from it) is drawn. Far away places (attic,
      basement, maintenance room, rooftop, gallery) hide the arcade floor, and the camera stops drawing past the fog.
   3. STATIC BATCHING: furniture that never moves is merged into a few big pieces per room (same look, way fewer draw calls).
      Anything the game moves, hides or recolors is spotted automatically and keeps drawing on its own.
   4. LOD: merged pieces far from the camera swap to lighter versions of round things (spheres, cylinders, rings).
   5. AUTO-TUNE: the screen sharpness (pixel ratio) gently adjusts to hold ~60 fps. The menu's Graphics switch still works:
      AUTO (default) / SHARP (always full sharpness) / SMOOTH (lighter, for older phones).
   6. MEMORY: rooms you haven't visited for 2 minutes give their GPU copies back (they come back on their own when you return).
   Debug: GA.Perf.stats(), GA.Perf.setMode('sharp'), ?gfx=sharp|smooth|auto, ?perf=off turns 2-4+6 off (for before/after). */
(function () {
  'use strict';
  var T = THREE, PF = GA.Perf = {};
  var R = null, S = null, CAM = null, O = null, on = !/[?&]perf=off\b/.test(location.search), MOBILE = false;
  var HIDE = 31, HUB_AREAS = { main: 1, bonus: 1, hall: 1, food: 1 };
  var HUB_BOX = { minX: -19.5, maxX: 19.5, minZ: -13.5, maxZ: 27.5 };
  var ST = PF._st = { lights: 0, pool: 0, chunks: 0, merged: 0, dyn: 0, roots: 0, lo: 0, freedMB: 0, disposed: 0, pr: 0, mode: 'auto', fps: 0 };
  var tmpV = new T.Vector3(), tmpV2 = new T.Vector3(), tmpM = new T.Matrix4(), tmpN = new T.Matrix3(), frustum = new T.Frustum(), projM = new T.Matrix4(), sph = new T.Sphere();
  var noopBR = T.Object3D.prototype.onBeforeRender, noopAR = T.Object3D.prototype.onAfterRender;

  /* ---------- graphics switch ---------- */
  var MODES = ['auto', 'sharp', 'smooth'], LABEL = { auto: 'AUTO', sharp: 'SHARP', smooth: 'SMOOTH' };
  var qm = /[?&]gfx=(auto|sharp|smooth)\b/.exec(location.search);
  var mode = qm ? qm[1] : ((GA.store && GA.store.get('gfx', null)) || 'auto'); if (MODES.indexOf(mode) < 0) mode = 'auto';
  var PR = { max: 1.6, min: 1, cur: 1.6 };
  function prFor(m) { return m === 'smooth' ? PR.min : PR.max; }
  function setPR(v) { v = Math.round(v * 100) / 100; if (!R || Math.abs(R.getPixelRatio() - v) < 0.01) { ST.pr = v; return; } R.setPixelRatio(v); ST.pr = v; }
  PF.mode = function () { return mode; };
  PF.setMode = function (m) { if (MODES.indexOf(m) < 0) return mode; mode = m; ST.mode = m; if (GA.store && !qm) GA.store.set('gfx', m); PR.cur = prFor(m); setPR(PR.cur); tune.win = []; tune.good = 0; LOD_D = m === 'smooth' ? 8 : MOBILE ? 12 : 16; label(); return mode; };
  function label() { var b = document.getElementById('menuGfx'); if (b) b.textContent = 'Graphics: ' + LABEL[mode]; }
  function wireBtn() {
    var foot = document.querySelector('#menu .menuFoot'); if (!foot || document.getElementById('menuGfx')) return;
    var b = document.createElement('button'); b.id = 'menuGfx'; b.className = 'pill'; b.type = 'button'; b.title = 'AUTO keeps it smooth, SHARP is always full detail, SMOOTH is lighter for older phones';
    var mute = document.getElementById('menuMute'); if (mute && mute.nextSibling) foot.insertBefore(b, mute.nextSibling); else foot.appendChild(b);
    b.addEventListener('click', function () { PF.setMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length]); if (GA.Audio) GA.Audio.play('click'); });
    label();
  }

  /* ---------- auto-tune (pixel ratio) ---------- */
  var tune = { win: [], t: 0, good: 0, cool: 0 };
  function autoTune(ms, dt) {
    if (ms > 250) return; // tab switch / loading hitch, not real frame time
    tune.win.push(ms); tune.t += dt; if (tune.cool > 0) tune.cool -= dt;
    if (tune.t < 1) return;
    var a = tune.win.slice().sort(function (x, y) { return x - y; }), med = a[Math.floor(a.length / 2)]; ST.fps = Math.round(1000 / med); tune.win = []; tune.t = 0;
    if (mode !== 'auto' || tune.cool > 0) return;
    if (med > 21 && PR.cur > PR.min + 0.01) { PR.cur = Math.max(PR.min, PR.cur - (med > 30 ? 0.2 : 0.1)); setPR(PR.cur); tune.good = 0; tune.cool = 1.5; }
    else if (med < 14.5) { if (++tune.good >= 3 && PR.cur < PR.max - 0.01) { PR.cur = Math.min(PR.max, PR.cur + 0.1); setPR(PR.cur); tune.good = 0; tune.cool = 2; } }
    else tune.good = 0;
  }

  /* ---------- 1. light pool ---------- */
  var K = 4, POOL = [], VL = [], scanT = 0;
  function effVis(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
  function scanLights() {
    S.traverse(function (o) { if (o.isPointLight && !o.userData.pfPool && !o.userData.pfSeen) { o.userData.pfSeen = true; o.layers.set(HIDE); VL.push({ l: o, s: 0 }); } });
    ST.lights = VL.length;
  }
  function initPool() {
    for (var i = 0; i < K; i++) { var pl = new T.PointLight('#ffffff', 0, 10, 1.5); pl.userData.pfPool = true; pl.name = 'perf:light' + i; S.add(pl); POOL.push({ pl: pl, src: null, want: null, k: 0 }); }
    scanLights(); ST.pool = K;
  }
  function updatePool(dt, px, pz) {
    if ((scanT += dt) > 3) { scanT = 0; scanLights(); }
    var best = [];
    for (var i = 0; i < VL.length; i++) {
      var v = VL[i], l = v.l; v.s = 0;
      if (!(l.intensity > 0) || !effVis(l)) continue;
      l.getWorldPosition(tmpV); var d = Math.hypot(tmpV.x - px, tmpV.y - 1.2, tmpV.z - pz), range = (l.distance > 0 ? l.distance : 40) + 4;
      if (d > range) continue; var f = 1 - d / range; v.s = l.intensity * (0.15 + f * f) * (POOL.some(function (p) { return p.src === l; }) ? 1.25 : 1);
      best.push(v);
    }
    best.sort(function (a, b) { return b.s - a.s; }); best = best.slice(0, K).map(function (v) { return v.l; });
    // keep lights in the slot they already have; hand free slots to new ones
    POOL.forEach(function (p) { p.want = best.indexOf(p.src) >= 0 ? p.src : null; });
    best.forEach(function (l) { if (POOL.some(function (p) { return p.want === l; })) return; var free = POOL.filter(function (p) { return !p.want; }).sort(function (a, b) { return a.k - b.k; })[0]; if (free) free.want = l; });
    POOL.forEach(function (p) {
      if (p.src !== p.want) { p.k -= dt * 7; if (p.k <= 0 || !p.src) { p.k = 0; p.src = p.want; } }
      else if (p.src) p.k = Math.min(1, p.k + dt * 7);
      var l = p.src, pl = p.pl;
      if (!l) { pl.intensity = 0; return; }
      l.getWorldPosition(pl.position); pl.color.copy(l.color); pl.distance = l.distance; pl.decay = l.decay; pl.intensity = l.intensity * p.k;
    });
  }

  /* ---------- 2. area culling ---------- */
  var HUB = [], REMOTE = [];
  function centerOf(o) { var b = new T.Box3().setFromObject(o); return b.isEmpty() ? null : b.getCenter(new T.Vector3()); }
  var HUBG = null, HALLG = null;
  function initZones() {
    // everything on the arcade floor (main hall, bonus zone, Hall wing, food court) goes under one node, so far-away
    // areas can hide it all with one switch; the Hall wing gets its own node inside it (it hides when you're far from it)
    HUBG = new T.Group(); HUBG.name = 'perf:hub'; HUBG.userData.noBatch = false;
    S.children.slice().forEach(function (o) {
      if (O.keep.indexOf(o) >= 0 || o.isLight || o.userData.pfPool) return;
      var c = centerOf(o); if (!c) return;
      if (c.x > HUB_BOX.minX && c.x < HUB_BOX.maxX && c.z > HUB_BOX.minZ && c.z < HUB_BOX.maxZ) HUB.push(o); else REMOTE.push({ o: o, seen: 0, freed: false });
    });
    S.add(HUBG); HUB.forEach(function (o) { HUBG.add(o); });
    var H3 = GA.Hall3D;
    if (H3 && H3.roots && H3.roots.length) {
      HALLG = new T.Group(); HALLG.name = 'perf:hall'; HUBG.add(HALLG);
      H3.roots.forEach(function (o) { if (o.parent === HUBG) HALLG.add(o); });
      HALLG.visible = H3.roots[0] ? H3.roots[0].visible : true; H3.roots.forEach(function (o) { o.visible = true; });
      H3.setVis = function (v) { HALLG.visible = v; };
    }
    // rooms that can't see each other: the Hall wing and the Food Court share a solid wall
    mask(HUBG, function () { return !HUB_AREAS[curArea]; });
    if (HALLG) mask(HALLG, function () { return curArea === 'food'; });
    HUBG.children.forEach(function (c) { if (c.name === 'area:food') mask(c, function () { return curArea === 'hall'; }); });
  }
  var curArea = 'main';
  // visibility mask: the game still switches the object on/off as before, this only adds "and not while you're in X"
  function mask(obj, hide) { var want = obj.visible; Object.defineProperty(obj, 'visible', { configurable: true, enumerable: true, get: function () { return want && !hide(); }, set: function (v) { want = !!v; } }); }
  function cullZones(area) {
    curArea = area;
    // draw distance follows the fog: nothing past the fog's far edge can be seen anyway
    if (S.fog && CAM) { var far = Math.min(O.far0, S.fog.far + 1.5); if (Math.abs(CAM.far - far) > 0.1) { CAM.far = far; CAM.updateProjectionMatrix(); } }
  }

  /* ---------- 3. static batching ---------- */
  var ROOTS = [], LOD_D = 12, CELL = 6, BUDGET = 4, OBSERVE = 4;
  function snapOf(o) { var p = o.position, q = o.quaternion, s = o.scale, m = o.material, c = m && bakeKey(m) && m.color ? m.color.getHex() + (m.emissive ? m.emissive.getHex() * 7 : 0) : 0; return [p.x, p.y, p.z, q.x, q.y, q.z, q.w, s.x, s.y, s.z, o.visible ? 1 : 0, m ? m.id : 0, o.geometry ? o.geometry.id : 0, c]; }
  function changed(o) { var a = o.userData.pfSnap; if (!a) return false; var p = o.position, q = o.quaternion, s = o.scale;
    return a[0] !== p.x || a[1] !== p.y || a[2] !== p.z || a[3] !== q.x || a[4] !== q.y || a[5] !== q.z || a[6] !== q.w || a[7] !== s.x || a[8] !== s.y || a[9] !== s.z || a[10] !== (o.visible ? 1 : 0) || (o.material ? a[11] !== o.material.id : false) || (o.geometry ? a[12] !== o.geometry.id : false) || (a[13] ? a[13] !== o.material.color.getHex() + (o.material.emissive ? o.material.emissive.getHex() * 7 : 0) : false); }
  function okMesh(o) {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.userData.pfDyn || o.userData.perfChunk) return false;
    var m = o.material, g = o.geometry; if (!m || Array.isArray(m) || m.transparent || m.visible === false || !g || !g.isBufferGeometry || !g.attributes.position || !g.attributes.normal) return false;
    if (g.morphAttributes && Object.keys(g.morphAttributes).length) return false;
    if (o.renderOrder !== 0 || !o.frustumCulled || o.layers.mask !== 1 || o.onBeforeRender !== noopBR || o.onAfterRender !== noopAR) return false;
    if (g.attributes.position.count > 20000) return false;
    return true;
  }
  function mkRoot(o) { var r = { o: o, st: 'observe', t: 0, chunks: [], watch: [], queue: [], breaks: 0, loose: 0, quiet: 0 }; o.userData.pfRoot = r; ROOTS.push(r); ST.roots = ROOTS.length; return r; }
  // members of a root = static-looking meshes under it, not inside a sub-root or a no-batch group
  function collect(r) {
    var out = [];
    (function walk(o) { for (var i = 0; i < o.children.length; i++) { var c = o.children[i]; if (c.userData.pfRoot || c.userData.noBatch || c.userData.perfChunk) continue; if (okMesh(c)) out.push(c); if (c.children.length) walk(c); } })(r.o);
    return out;
  }
  function chainOf(m, root) { var a = []; for (var o = m; o && o !== root; o = o.parent) a.push(o); return a; }
  function watchAll(r, members) {
    var seen = new Set(), w = [];
    members.forEach(function (m) { chainOf(m, r.o).forEach(function (o) { if (seen.has(o)) return; seen.add(o); o.userData.pfSnap = snapOf(o); w.push(o); }); });
    r.watch = w;
  }
  function breakRoot(r) {
    r.chunks.forEach(function (c) { c.members.forEach(function (m) { m.layers.set(0); }); if (c.mesh.parent) c.mesh.parent.remove(c.mesh); c.hi.dispose(); if (c.lo) c.lo.dispose(); ST.chunks--; ST.merged -= c.members.length; });
    r.chunks = []; r.queue = []; r.st = 'observe'; r.t = 0; r.loose = 0; r.quiet = 0; r.watch.forEach(function (o) { o.userData.pfSnap = null; }); r.watch = [];
  }
  function onChange(r, o) {
    if (o.isMesh) { if (!o.userData.pfDyn) { o.userData.pfDyn = true; ST.dyn++; } if (o.children.length && !o.userData.pfRoot) mkRoot(o); } // it moves / blinks: draw it on its own
    else if (!o.userData.pfRoot) { mkRoot(o); }        // a group that moves or hides as a whole: batch inside it instead
    o.userData.pfSnap = snapOf(o);
    if (!r.chunks.length && !r.queue.length) return;
    // already merged: take apart only the batches that contain it, everything else stays merged
    function under(m) { for (var q = m; q && q !== r.o; q = q.parent) if (q === o) return true; return false; }
    r.chunks = r.chunks.filter(function (c) {
      if (!c.members.some(under)) return true;
      c.members.forEach(function (m) { m.layers.set(0); }); if (c.mesh.parent) c.mesh.parent.remove(c.mesh); c.hi.dispose(); if (c.lo) c.lo.dispose();
      ST.chunks--; ST.merged -= c.members.length; r.loose = (r.loose || 0) + c.members.length; return false;
    });
    r.queue.forEach(function (g) { g.list = g.list.filter(function (e) { return !under(e.m); }); });
  }
  /* colour baking: plain lit materials that differ only by colour share one material, the colour goes into the vertices.
     (MeshBasic materials are NOT baked: the power outage dims those by changing their colour.) */
  var BAKED = {};
  function bakeKey(m) {
    if (!(m.isMeshLambertMaterial || m.isMeshPhongMaterial) || m.vertexColors || m.transparent || m.map || m.emissiveMap || m.lightMap || m.aoMap || m.alphaMap || m.envMap || m.specularMap || m.bumpMap || m.normalMap || m.wireframe || m.alphaTest > 0 || m.opacity < 1) return null;
    var k = (m.isMeshPhongMaterial ? 'P' + m.shininess + ',' + m.specular.getHex() : 'L') + '|' + m.side + '|' + (m.flatShading ? 1 : 0) + '|' + m.emissive.getHex() + '|' + (m.fog ? 1 : 0) + (m.depthTest ? 1 : 0) + (m.depthWrite ? 1 : 0) + (m.polygonOffset ? m.polygonOffsetFactor + ',' + m.polygonOffsetUnits : '') + (m.colorWrite ? 1 : 0);
    return k;
  }
  function bakedMat(k, m) {
    if (BAKED[k]) return BAKED[k];
    var o = { color: '#ffffff', vertexColors: true, side: m.side, emissive: m.emissive.clone(), fog: m.fog, depthTest: m.depthTest, depthWrite: m.depthWrite, polygonOffset: m.polygonOffset, polygonOffsetFactor: m.polygonOffsetFactor, polygonOffsetUnits: m.polygonOffsetUnits };
    var b = m.isMeshPhongMaterial ? new T.MeshPhongMaterial(Object.assign(o, { shininess: m.shininess, specular: m.specular.clone(), flatShading: m.flatShading })) : new T.MeshLambertMaterial(o);
    b.name = 'perf:baked'; return (BAKED[k] = b);
  }
  function sigOf(m) { var g = m.geometry; return (g.attributes.uv ? 'u' : '') + (g.attributes.color && m.material.vertexColors ? 'c' : ''); }
  function plan(r) {
    var members = collect(r); watchAll(r, members);
    r.o.updateMatrixWorld(true); var inv = new T.Matrix4().copy(r.o.matrixWorld).invert(), groups = {};
    members.forEach(function (m) {
      if (!effVisUnder(m, r.o)) return; // hidden right now: leave it alone
      var rel = new T.Matrix4().multiplyMatrices(inv, m.matrixWorld); tmpV.setFromMatrixPosition(rel);
      var cell = Math.floor(tmpV.x / CELL) + ',' + Math.floor(tmpV.y / CELL) + ',' + Math.floor(tmpV.z / CELL), bk = sigOf(m).indexOf('c') < 0 ? bakeKey(m.material) : null;
      var key = (bk ? 'B' + bk : m.material.id) + '|' + sigOf(m) + '|' + cell;
      (groups[key] = groups[key] || { mat: bk ? bakedMat(bk, m.material) : m.material, sig: sigOf(m) + (bk ? 'c' : ''), bake: !!bk, list: [] }).list.push({ m: m, rel: rel });
    });
    r.queue = Object.keys(groups).map(function (k) { return groups[k]; }).filter(function (g) { return g.list.length >= 2; });
    r.st = 'build';
  }
  function effVisUnder(m, root) { for (var o = m; o && o !== root; o = o.parent) if (!o.visible) return false; return true; }
  function merge(list, sig, lo, bake) {
    var nv = 0, ni = 0, parts = list.map(function (e) { var g = (lo && PF.lowGeo(e.m.geometry)) || e.m.geometry; nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; return { g: g, rel: e.rel, bc: bake ? e.m.material.color : null }; });
    var pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = sig.indexOf('u') >= 0 ? new Float32Array(nv * 2) : null, col = sig.indexOf('c') >= 0 ? new Float32Array(nv * 3) : null;
    var idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni), vo = 0, io = 0;
    parts.forEach(function (p) {
      var g = p.g, pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv, ca = g.attributes.color, n = pa.count, e = p.rel.elements; tmpN.getNormalMatrix(p.rel); var ne = tmpN.elements;
      for (var i = 0; i < n; i++) {
        var x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), k = (vo + i) * 3;
        pos[k] = e[0] * x + e[4] * y + e[8] * z + e[12]; pos[k + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; pos[k + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
        var a = na.getX(i), b = na.getY(i), c = na.getZ(i), X = ne[0] * a + ne[3] * b + ne[6] * c, Y = ne[1] * a + ne[4] * b + ne[7] * c, Z = ne[2] * a + ne[5] * b + ne[8] * c, L = Math.sqrt(X * X + Y * Y + Z * Z) || 1;
        nor[k] = X / L; nor[k + 1] = Y / L; nor[k + 2] = Z / L;
        if (uv) { uv[(vo + i) * 2] = ua.getX(i); uv[(vo + i) * 2 + 1] = ua.getY(i); }
        if (col) { if (p.bc) { col[k] = p.bc.r; col[k + 1] = p.bc.g; col[k + 2] = p.bc.b; } else { col[k] = ca.getX(i); col[k + 1] = ca.getY(i); col[k + 2] = ca.getZ(i); } }
      }
      var flip = p.rel.determinant() < 0, ix = g.index;
      if (ix) for (var j = 0; j < ix.count; j += 3) { var i0 = ix.getX(j) + vo, i1 = ix.getX(j + 1) + vo, i2 = ix.getX(j + 2) + vo; idx[io++] = i0; idx[io++] = flip ? i2 : i1; idx[io++] = flip ? i1 : i2; }
      else for (j = 0; j < n; j += 3) { idx[io++] = vo + j; idx[io++] = vo + (flip ? j + 2 : j + 1); idx[io++] = vo + (flip ? j + 1 : j + 2); }
      vo += n;
    });
    var out = new T.BufferGeometry(); out.setAttribute('position', new T.BufferAttribute(pos, 3)); out.setAttribute('normal', new T.BufferAttribute(nor, 3));
    if (uv) out.setAttribute('uv', new T.BufferAttribute(uv, 2)); if (col) out.setAttribute('color', new T.BufferAttribute(col, 3));
    out.setIndex(new T.BufferAttribute(idx, 1)); out.computeBoundingSphere(); out.computeBoundingBox(); out.userData.tris = io / 3;
    return out;
  }
  function buildOne(r, grp) {
    var live = grp.list.filter(function (e) { return !e.m.userData.pfDyn && e.m.parent && effVisUnder(e.m, r.o); }); if (live.length < 2) return;
    var hi = merge(live, grp.sig, false, grp.bake), lo = null;
    if (hi.userData.tris > 1200 && live.some(function (e) { return PF.lowGeo(e.m.geometry); })) { lo = merge(live, grp.sig, true, grp.bake); if (lo.userData.tris > hi.userData.tris * 0.8) { lo.dispose(); lo = null; } }
    var mesh = new T.Mesh(hi, grp.mat); mesh.matrixAutoUpdate = false; mesh.userData.perfChunk = true; mesh.userData.noAudit = true; mesh.name = 'perf:chunk'; r.o.add(mesh); mesh.updateMatrixWorld(true);
    live.forEach(function (e) { e.m.layers.set(HIDE); });
    r.chunks.push({ mesh: mesh, hi: hi, lo: lo, members: live.map(function (e) { return e.m; }), isLo: false }); ST.chunks++; ST.merged += live.length;
  }
  function batchFrame(dt) {
    var t0 = performance.now(); ST.bms = 0;
    for (var i = 0; i < ROOTS.length; i++) {
      var r = ROOTS[i]; if (r.st === 'off' || !r.o.parent || !effVis(r.o)) continue;
      // anything that moved / blinked / changed since last frame?
      var hit = 0;
      for (var w = 0; w < r.watch.length; w++) { var o = r.watch[w]; if (o.userData.pfSnap && changed(o)) { if (PF._log && PF._log.length < 60) { var a = o.userData.pfSnap, b = snapOf(o), d = []; for (var z = 0; z < a.length; z++) if (a[z] !== b[z]) d.push(z); PF._log.push([r.o.name, o.type, o.name || (o.parent && o.parent.name), d.join(','), r.st]); } onChange(r, o); hit++; } }
      if (hit) { r.hits = (r.hits || 0) + hit; r.lastHit = o && o.name; }
      if (hit && r.st !== 'observe') { r.breaks++; r.quiet = 0; }
      else if (hit) { r.watch.forEach(function (q) { q.userData.pfSnap = null; }); r.watch = []; } // still settling: re-collect without the movers, watch a little longer
      if (r.st === 'observe') { if (!r.watch.length) { var mem = collect(r); if (mem.length < 2) { r.st = 'idle'; continue; } watchAll(r, mem); } r.t += dt; if (r.t > OBSERVE) plan(r); }
      else if (r.st === 'done' && r.loose > 24 && (r.quiet += dt) > 6) { breakRoot(r); r.t = OBSERVE; } // lots fell out of their batches: re-merge the rest once it's calm
      else if (r.st === 'build') { while (r.queue.length && performance.now() - t0 < BUDGET) buildOne(r, r.queue.shift()); if (!r.queue.length) r.st = 'done'; }
      if (performance.now() - t0 > BUDGET * 2) break;
    }
    ST.bms = +(performance.now() - t0).toFixed(2);
  }
  function lodFrame() {
    var cp = CAM.position;
    for (var i = 0; i < ROOTS.length; i++) { var r = ROOTS[i]; if (!r.chunks.length || !r.o.visible) continue;
      for (var j = 0; j < r.chunks.length; j++) { var c = r.chunks[j]; if (!c.lo) continue; sph.copy(c.hi.boundingSphere).applyMatrix4(c.mesh.matrixWorld); var d = sph.center.distanceTo(cp) - sph.radius, far = c.isLo ? d > LOD_D - 1 : d > LOD_D + 1;
        if (far !== c.isLo) { c.isLo = far; c.mesh.geometry = far ? c.lo : c.hi; ST.lo += far ? 1 : -1; } } }
  }
  // lighter copy of a round geometry (fewer segments), or null when it is already simple
  PF.lowGeo = function (g) {
    if (!g || g.userData.pfLo !== undefined) return g ? g.userData.pfLo : null; var p = g.parameters, lo = null;
    try {
      if (p) switch (g.type) {
        case 'SphereGeometry': if (p.widthSegments > 10) lo = new T.SphereGeometry(p.radius, Math.max(8, p.widthSegments >> 1), Math.max(6, p.heightSegments >> 1), p.phiStart, p.phiLength, p.thetaStart, p.thetaLength); break;
        case 'CylinderGeometry': if (p.radialSegments > 10) lo = new T.CylinderGeometry(p.radiusTop, p.radiusBottom, p.height, Math.max(8, p.radialSegments >> 1), p.heightSegments, p.openEnded, p.thetaStart, p.thetaLength); break;
        case 'ConeGeometry': if (p.radialSegments > 10) lo = new T.ConeGeometry(p.radius, p.height, Math.max(8, p.radialSegments >> 1), p.heightSegments, p.openEnded, p.thetaStart, p.thetaLength); break;
        case 'TorusGeometry': if (p.tubularSegments > 12) lo = new T.TorusGeometry(p.radius, p.tube, Math.max(4, p.radialSegments >> 1), Math.max(8, p.tubularSegments >> 1), p.arc); break;
        case 'CircleGeometry': if (p.segments > 12) lo = new T.CircleGeometry(p.radius, Math.max(8, p.segments >> 1), p.thetaStart, p.thetaLength); break;
      }
    } catch (e) { lo = null; }
    if (lo && !lo.attributes.uv && g.attributes.uv) lo = null;
    g.userData.pfLo = lo; return lo;
  };

  /* ---------- 6. give back GPU memory of rooms you left a while ago ---------- */
  var memT = 0;
  function memFrame(dt, now) {
    if ((memT += dt) < 5) return; memT = 0;
    REMOTE.forEach(function (e) {
      if (effVis(e.o)) { e.seen = now; e.freed = false; return; }
      if (e.freed || !e.seen || now - e.seen < 120) return;
      var mine = new Set(), others = new Set(), bytes = 0;
      e.o.traverse(function (o) { if (o.geometry) mine.add(o.geometry); var ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(function (m) { if (m.map) mine.add(m.map); }); });
      S.traverse(function (o) { for (var q = o; q; q = q.parent) if (q === e.o) return; if (o.geometry) others.add(o.geometry); var ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(function (m) { if (m.map) others.add(m.map); }); });
      mine.forEach(function (x) { if (others.has(x)) return; if (x.isTexture) { var im = x.image; if (im && im.width) bytes += im.width * im.height * 4 * 1.33; } else if (x.attributes && x.attributes.position) bytes += x.attributes.position.count * 32; x.dispose(); ST.disposed++; });
      ST.freedMB = +(ST.freedMB + bytes / 1048576).toFixed(1); e.freed = true;
    });
  }

  /* ---------- frustum check (cabinet attract screens only redraw when you can see them) ---------- */
  PF.inView = function (x, y, z, r) { if (!CAM) return true; sph.center.set(x, y, z); sph.radius = r || 1.5; return frustum.intersectsSphere(sph); };

  /* ---------- hooks ---------- */
  PF.init = function (o) {
    O = o; R = o.renderer; S = o.scene; CAM = o.camera; O.far0 = CAM.far; MOBILE = !!o.mobile; PR.max = o.prMax || 1.6; PR.min = Math.min(PR.max, Math.max(1, Math.min(window.devicePixelRatio || 1, 1.0)));
    if (MOBILE && PR.max > 1.25) PR.min = Math.max(PR.min, 1.0);
    PF.setMode(mode); initPool();
    if (on) {
      initZones();
      // batch roots: the whole arcade floor + the Hall wing + every area that switches on/off by itself; anything else
      // that turns out to move or hide gets its own root automatically (see onChange)
      mkRoot(HUBG); if (HALLG) mkRoot(HALLG);
      REMOTE.forEach(function (e) { mkRoot(e.o); });
      HUBG.children.forEach(function (c) { if (c !== HALLG && (/^(area|attic):/.test(c.name) || !c.visible)) mkRoot(c); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireBtn); else wireBtn();
  };
  var lodT = 0, clock = 0;
  PF.frame = function (dt, ms) {
    if (!S) return; clock += dt;
    autoTune(ms, dt);
    var p = O.pose(); updatePool(dt, p.x, p.z);
    if (on) { cullZones(GA.Hub.area()); batchFrame(Math.min(0.25, Math.max(dt, (ms || 0) / 1000))); if ((lodT += dt) > 0.2) { lodT = 0; lodFrame(); } memFrame(dt, clock); }
    CAM.updateMatrixWorld(); projM.multiplyMatrices(CAM.projectionMatrix, CAM.matrixWorldInverse); frustum.setFromProjectionMatrix(projM);
  };
  PF.stats = function () { var i = R ? R.info : null; return Object.assign({}, ST, { on: on, calls: i ? i.render.calls : 0, tris: i ? i.render.triangles : 0, textures: i ? i.memory.textures : 0, geometries: i ? i.memory.geometries : 0, programs: i && i.programs ? i.programs.length : 0, poolLit: POOL.filter(function (q) { return q.src; }).length, pics: GA.Pics ? GA.Pics.stats : null }); };
  PF.enabled = function () { return on; };
  PF._why = function (o) { var r = null; for (var q = o.parent; q; q = q.parent) if (q.userData.pfRoot) { r = q.userData.pfRoot; break; } return { ok: okMesh(o), bake: o.material ? bakeKey(o.material) : null, mat: o.material && o.material.type, root: r ? (r.o.name || r.o.type) + ':' + r.st : null, noBatch: (function () { for (var q = o; q; q = q.parent) if (q.userData.noBatch) return true; return false; })(), vis: effVis(o), n: o.geometry && o.geometry.attributes.position.count }; };
  PF._obs = function () { return ROOTS.filter(function (r) { return r.st === 'observe'; }).map(function (r) { return [r.o.name || r.o.type, r.watch.length, +r.t.toFixed(2), effVis(r.o), r.breaks, r.hits]; }).filter(function (x) { return x[3]; }); };
  PF._roots = function () { var c = {}; ROOTS.forEach(function (r) { c[r.st] = (c[r.st] || 0) + 1; }); return c; };
})();
