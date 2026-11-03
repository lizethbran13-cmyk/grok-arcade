/* Grok Arcade - 3D VIEW (inspect owned prizes + achievement medals) and CARRY (hold a prize, wear a hat, wear a medal).
   GA.Carry: { hand: prizeId|null, head: hatId|null, neck: 'ach:<id>'|null } saved in localStorage (grokArcade.carry).
   GA.PV.open(id, list) opens the 3D viewer; drag = spin, pinch / wheel = zoom, arrows = next item. */
(function () {
  'use strict';
  var T = THREE;
  function $(id) { return document.getElementById(id); }
  function snd(n) { try { GA.Audio.play(n); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function isAch(id) { return /^ach:/.test(id || ''); }
  function achOf(id) { return (GA.ACHIEVEMENTS || []).find(function (a) { return 'ach:' + a.id === id; }); }
  function info(id) {
    if (isAch(id)) { var a = achOf(id) || {}; return { name: a.name || 'Achievement', desc: a.desc || '', kind: 'ACHIEVEMENT MEDAL \u00b7 ' + (a.cat || '').toUpperCase(), icon: a.icon }; }
    var p = GA.findPrize(id) || {}; var cat = (GA.PRIZE_CATS || []).find(function (c) { return c.id === p.cat; });
    return { name: p.name || id, desc: p.desc || '', kind: (GA.Prize3D.isHat(id) ? 'HAT' : cat ? cat.name.toUpperCase() : 'PRIZE') + (p.price ? ' \u00b7 ' + p.price + ' TICKETS' : '') };
  }

  /* ================= CARRY ================= */
  var C = GA.Carry = {}, listeners = [];
  var S = GA.store.get('carry', null) || {};
  function valid() {
    var ch = false;
    if (S.hand && !(GA.Prog.owns(S.hand) && !GA.Prize3D.isHat(S.hand))) { S.hand = null; ch = true; }
    if (S.head && !(GA.Prog.owns(S.head) && GA.Prize3D.isHat(S.head))) { S.head = null; ch = true; }
    if (S.neck && !(isAch(S.neck) && GA.Prog.isUnlocked(S.neck.slice(4)))) { S.neck = null; ch = true; }
    return ch;
  }
  S = { hand: S.hand || null, head: S.head || null, neck: S.neck || null };
  if (valid()) GA.store.set('carry', S);
  function changed() {
    GA.store.set('carry', S);
    if (GA.Hub && GA.Hub.setCarry) GA.Hub.setCarry(C.get());
    listeners.forEach(function (f) { try { f(C.get()); } catch (e) {} });
    renderMenu();
  }
  C.get = function () { return { hand: S.hand, head: S.head, neck: S.neck }; };
  C.slotFor = function (id) { return isAch(id) ? 'neck' : GA.Prize3D.isHat(id) ? 'head' : 'hand'; };
  C.isOn = function (id) { return S[C.slotFor(id)] === id; };
  C.canUse = function (id) { return isAch(id) ? GA.Prog.isUnlocked(id.slice(4)) : GA.Prog.owns(id); };
  C.equip = function (id) { if (!id || !C.canUse(id)) return false; S[C.slotFor(id)] = id; changed(); if (GA.Prog) GA.Prog.event(C.slotFor(id) === 'head' ? 'wearHat' : C.slotFor(id) === 'neck' ? 'wearMedal' : 'carry'); return true; };
  C.unequip = function (slot) { if (!S[slot]) return; S[slot] = null; changed(); };
  C.toggle = function (id) { if (C.isOn(id)) { C.unequip(C.slotFor(id)); return false; } return C.equip(id); };
  C.on = function (f) { listeners.push(f); };
  C.verb = function (id, on) { var s = C.slotFor(id); return s === 'head' ? (on ? 'TAKE OFF' : 'WEAR') : s === 'neck' ? (on ? 'TAKE OFF' : 'WEAR MEDAL') : (on ? 'PUT AWAY' : 'CARRY'); };
  C.apply = function () { valid(); if (GA.Hub && GA.Hub.setCarry) GA.Hub.setCarry(C.get()); };

  /* quick menu: "My Stuff" (collapsed until you tap it) */
  var menuOpen = false;
  C.buildMenu = function (before) {
    var h = document.createElement('h2'); h.className = 'secTitle stuffSec'; h.id = 'stuffTitle';
    h.innerHTML = '<button id="stuffToggle" class="stuffToggle" aria-expanded="false"><span>\uD83C\uDF92 My Stuff</span> <small id="stuffSum"></small><i aria-hidden="true">\u25BC</i></button>';
    var d = document.createElement('div'); d.id = 'stuffBox'; d.className = 'stuffBox hidden';
    before.parentNode.insertBefore(h, before); before.parentNode.insertBefore(d, before);
    $('stuffToggle').addEventListener('click', function () { menuOpen = !menuOpen; snd('click'); renderMenu(); });
    renderMenu();
  };
  function chip(id, on) {
    var inf = info(id), u = isAch(id) ? '' : GA.PrizeArt.url(id, 96);
    return '<button class="stuffChip' + (on ? ' on' : '') + '" data-stuff="' + esc(id) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + (u ? '<img alt="" src="' + u + '">' : '<span class="stuffEmo">' + (inf.icon || '\uD83C\uDFC5') + '</span>') + '<b>' + esc(inf.name.replace(/ Plush$/, '')) + '</b><small>' + (on ? '\u2714 ' + (C.slotFor(id) === 'hand' ? 'IN HAND' : 'WEARING') : C.verb(id, false)) + '</small></button>';
  }
  function renderMenu() {
    var sum = $('stuffSum'); if (!sum) return;
    var bits = []; if (S.hand) bits.push('\u270B ' + info(S.hand).name.replace(/ Plush$/, '')); if (S.head) bits.push('\uD83E\uDDE2 ' + info(S.head).name); if (S.neck) bits.push('\uD83C\uDFC5 ' + info(S.neck).name);
    sum.textContent = bits.length ? bits.join(' \u00b7 ') : 'empty hands \u00b7 tap to carry a prize';
    $('stuffToggle').setAttribute('aria-expanded', menuOpen ? 'true' : 'false'); $('stuffTitle').classList.toggle('open', menuOpen);
    var box = $('stuffBox'); box.classList.toggle('hidden', !menuOpen); if (!menuOpen) return;
    var owned = GA.Prog.ownedIds(), hats = owned.filter(GA.Prize3D.isHat), held = owned.filter(function (i) { return !GA.Prize3D.isHat(i); });
    var meds = GA.Prog.list().filter(function (a) { return a.unlocked; }).map(function (a) { return 'ach:' + a.id; });
    if (!owned.length && !meds.length) { box.innerHTML = '<p class="stuffEmpty">Nothing yet! Win tickets in the Bonus Zone and redeem prizes at the Prize Counter, then carry them around here.</p>'; return; }
    var h = '<div class="stuffRow"><span class="stuffLbl">\u270B IN YOUR HAND</span><button class="pill stuffNone" data-none="hand"' + (S.hand ? '' : ' disabled') + '>Empty hands</button></div><div class="stuffGrid">' + (held.length ? held.map(function (i) { return chip(i, S.hand === i); }).join('') : '<p class="stuffEmpty">No prizes to carry yet.</p>') + '</div>';
    if (hats.length) h += '<div class="stuffRow"><span class="stuffLbl">\uD83E\uDDE2 ON YOUR HEAD</span><button class="pill stuffNone" data-none="head"' + (S.head ? '' : ' disabled') + '>No hat</button></div><div class="stuffGrid">' + hats.map(function (i) { return chip(i, S.head === i); }).join('') + '</div>';
    if (meds.length) h += '<div class="stuffRow"><span class="stuffLbl">\uD83C\uDFC5 MEDAL</span><button class="pill stuffNone" data-none="neck"' + (S.neck ? '' : ' disabled') + '>No medal</button></div><div class="stuffGrid">' + meds.map(function (i) { return chip(i, S.neck === i); }).join('') + '</div>';
    box.innerHTML = h;
    Array.prototype.forEach.call(box.querySelectorAll('[data-stuff]'), function (b) { b.addEventListener('click', function () { C.toggle(b.getAttribute('data-stuff')); snd('click'); }); });
    Array.prototype.forEach.call(box.querySelectorAll('[data-none]'), function (b) { b.addEventListener('click', function () { C.unequip(b.getAttribute('data-none')); snd('click'); }); });
  }
  C.renderMenu = renderMenu;

  /* ================= 3D VIEWER ================= */
  var V = GA.PV = {}, el, cv, R, scene, cam, pivot, model, ped, list = [], idx = 0, cur = null, open = false, raf = 0, lastT = 0, time = 0;
  var rotY = 0.5, rotX = 0.15, dist = 3.3, vel = 0, idleT = 0, ptrs = {}, pinch0 = 0, dist0 = 0, spun = 0;
  function build() {
    el = document.createElement('div'); el.id = 'pv'; el.className = 'pvOv hidden'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', '3D view');
    el.innerHTML = '<canvas id="pvCanvas" aria-label="3D model, drag to spin"></canvas>' +
      '<div class="pvTop"><div class="pvTitle"><small id="pvKind"></small><b id="pvName"></b></div><button id="pvClose" class="xBtn" aria-label="Close 3D view">&#10005;</button></div>' +
      '<button id="pvPrev" class="pvNav l" aria-label="Previous">&#8249;</button><button id="pvNext" class="pvNav r" aria-label="Next">&#8250;</button>' +
      '<div class="pvHint" id="pvHint"></div>' +
      '<div class="pvBottom"><p id="pvDesc"></p><div class="pvBtns"><button id="pvEquip" class="bigBtn"></button><button id="pvReset" class="pill" aria-label="Reset view">&#8634; RESET</button></div><div class="pvState" id="pvState"></div></div>';
    document.body.appendChild(el);
    cv = $('pvCanvas');
    R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); R.setClearColor(0x000000, 0);
    scene = new T.Scene(); cam = new T.PerspectiveCamera(40, 1, 0.05, 50);
    scene.add(new T.HemisphereLight('#ffffff', '#5a3a8a', 0.75)); scene.add(new T.AmbientLight('#ffffff', 0.2));
    var dl = new T.DirectionalLight('#ffffff', 0.8); dl.position.set(2, 4, 3); scene.add(dl);
    var p1 = new T.PointLight('#ff4fd8', 0.7, 10); p1.position.set(-2.5, 1.5, -1.5); scene.add(p1);
    var p2 = new T.PointLight('#3ff0ff', 0.7, 10); p2.position.set(2.5, 0.6, -1.5); scene.add(p2);
    ped = new T.Group(); scene.add(ped);
    var top = new T.Mesh(new T.CylinderGeometry(0.9, 1.0, 0.18, 48), new T.MeshPhongMaterial({ color: '#2a1656', shininess: 40 })); top.position.y = -0.09; ped.add(top);
    var ring = new T.Mesh(new T.TorusGeometry(0.95, 0.025, 8, 64), new T.MeshBasicMaterial({ color: '#3ff0ff' })); ring.rotation.x = Math.PI / 2; ring.position.y = -0.005; ped.add(ring);
    var ring2 = new T.Mesh(new T.TorusGeometry(1.0, 0.02, 8, 64), new T.MeshBasicMaterial({ color: '#ff4fd8' })); ring2.rotation.x = Math.PI / 2; ring2.position.y = -0.17; ped.add(ring2);
    pivot = new T.Group(); scene.add(pivot);
    $('pvClose').addEventListener('click', function () { V.close(); });
    $('pvPrev').addEventListener('click', function () { step(-1); });
    $('pvNext').addEventListener('click', function () { step(1); });
    $('pvReset').addEventListener('click', function () { rotY = 0.5; rotX = 0.15; dist = 3.3; vel = 0; snd('click'); });
    $('pvEquip').addEventListener('click', function () { if (!cur) return; var on = C.toggle(cur); snd(on ? 'fixed' : 'click'); ui(); });
    cv.addEventListener('pointerdown', function (e) { e.preventDefault(); ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; try { cv.setPointerCapture(e.pointerId); } catch (er) {} idleT = 0; vel = 0; var k = Object.keys(ptrs); if (k.length === 2) { pinch0 = pd(); dist0 = dist; } });
    cv.addEventListener('pointermove', function (e) {
      var p = ptrs[e.pointerId]; if (!p) return; e.preventDefault(); idleT = 0;
      var k = Object.keys(ptrs);
      if (k.length >= 2) { p.x = e.clientX; p.y = e.clientY; var d = pd(); if (pinch0 > 10) setDist(dist0 * pinch0 / Math.max(10, d)); return; }
      var dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      rotY += dx * 0.011; rotX = Math.max(-0.7, Math.min(1.0, rotX + dy * 0.008)); vel = dx * 0.011 / 0.016; spun += Math.abs(dx * 0.011);
    });
    function up(e) { delete ptrs[e.pointerId]; if (Object.keys(ptrs).length < 2) pinch0 = 0; }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); idleT = 0; setDist(dist * (1 + Math.max(-0.3, Math.min(0.3, e.deltaY * 0.0015)))); }, { passive: false });
    el.addEventListener('keydown', function (e) { e.stopPropagation(); });
    window.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); V.close(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); step(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); step(1); }
      else if (e.key === '+' || e.key === '=') setDist(dist * 0.85); else if (e.key === '-') setDist(dist * 1.18);
    }, true);
    window.addEventListener('resize', function () { if (open) resize(); });
  }
  function pd() { var k = Object.keys(ptrs); if (k.length < 2) return 0; var a = ptrs[k[0]], b = ptrs[k[1]]; return Math.hypot(a.x - b.x, a.y - b.y); }
  function setDist(d) { dist = Math.max(2.0, Math.min(6.5, d)); }
  function resize() { var w = window.innerWidth, h = window.innerHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.fov = w < h ? 50 : 38; cam.updateProjectionMatrix(); }
  function setModel(id) {
    if (model) { pivot.remove(model); model = null; }
    cur = id; model = GA.Prize3D.build(id);
    var s = model.userData.size, c = model.userData.center, m = Math.max(s.x, s.y, s.z) || 1, k = 1.45 / m;
    model.scale.setScalar(k); model.position.set(-c.x * k, -(c.y - s.y / 2) * k, -c.z * k);
    pivot.add(model); pivot.userData.h = s.y * k;
    rotY = isAch(id) ? 0 : 0.5; rotX = 0.12; vel = 0; idleT = 0; spun = 0;
    ui();
  }
  function ui() {
    var inf = info(cur), on = C.isOn(cur), sl = C.slotFor(cur);
    $('pvKind').textContent = inf.kind; $('pvName').textContent = inf.name; $('pvDesc').textContent = inf.desc;
    var ic = sl === 'head' ? '\uD83E\uDDE2 ' : sl === 'neck' ? '\uD83C\uDFC5 ' : '\u270B ';
    $('pvEquip').textContent = (on ? '' : ic) + C.verb(cur, on); $('pvEquip').classList.toggle('alt', on);
    var st = S[sl] && S[sl] !== cur ? 'Swaps out: ' + info(S[sl]).name : on ? (sl === 'hand' ? 'You\u2019re carrying this around the arcade!' : 'You\u2019re wearing this in the arcade!') : (sl === 'hand' ? 'Hold it in your hand while you walk around.' : sl === 'head' ? 'Wear it on your head in the arcade.' : 'Wear the medal around your neck in the arcade.');
    $('pvState').textContent = st;
    $('pvHint').textContent = document.body.classList.contains('touch') ? 'Drag to spin \u00b7 pinch to zoom' : 'Drag to spin \u00b7 scroll to zoom \u00b7 \u2190 \u2192 next';
    var multi = list.length > 1; $('pvPrev').classList.toggle('hidden', !multi); $('pvNext').classList.toggle('hidden', !multi);
  }
  function step(d) { if (list.length < 2) return; idx = (idx + d + list.length) % list.length; setModel(list[idx]); snd('click'); }
  function loop(t) {
    if (!open) return; raf = requestAnimationFrame(loop);
    var dt = Math.min(0.05, (t - lastT) / 1000 || 0); lastT = t; time += dt; idleT += dt;
    if (!Object.keys(ptrs).length) { if (Math.abs(vel) > 0.05) { rotY += vel * dt; vel *= Math.pow(0.04, dt); } else if (idleT > 2.2) rotY += dt * 0.55; }
    pivot.rotation.set(0, 0, 0); pivot.rotateY(rotY);
    var h = pivot.userData.h || 1, ty = h * 0.45;
    cam.position.set(0, ty + Math.sin(rotX) * dist, Math.cos(rotX) * dist); cam.lookAt(0, ty, 0);
    ped.rotation.y = time * 0.2;
    if (model && model.userData.tick) model.userData.tick(time, dt);
    R.render(scene, cam);
  }
  V.open = function (id, lst) {
    // only prizes you OWN and achievements you've UNLOCKED can be viewed in 3D
    if (!id || !GA.Carry.canUse(id)) return false;
    if (!el) build();
    list = (lst && lst.length ? lst : [id]).filter(function (x) { return GA.Carry.canUse(x); }); idx = Math.max(0, list.indexOf(id)); if (list.indexOf(id) < 0) { list.unshift(id); idx = 0; }
    open = true; el.classList.remove('hidden'); document.body.classList.add('pvOn'); resize(); setModel(id);
    cancelAnimationFrame(raf); lastT = performance.now(); raf = requestAnimationFrame(loop); snd('open');
    if (GA.Prog) GA.Prog.event('view3d');
    return true;
  };
  V.close = function () { if (!open) return; open = false; ptrs = {}; cancelAnimationFrame(raf); el.classList.add('hidden'); document.body.classList.remove('pvOn'); snd('menu'); if (V.onClose) V.onClose(); };
  V.isOpen = function () { return open; };
  V.state = function () { return { open: open, id: cur, rotY: +rotY.toFixed(3), rotX: +rotX.toFixed(3), dist: +dist.toFixed(3), spun: +spun.toFixed(3), n: list.length, idx: idx, meshes: model ? (function () { var n = 0; model.traverse(function (o) { if (o.isMesh) n++; }); return n; })() : 0 }; };
})();
