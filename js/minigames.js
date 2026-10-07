/* Grok Arcade - bonus mini game framework (full-screen overlay, 2D canvas) */
(function () {
  'use strict';
  var defs = {}, order = [];
  var el, cv, ctx, dpr = 1, W = 0, H = 0;
  var cur = null, inst = null, state = 'closed', raf = 0, last = 0, score = 0, overToken = 0;
  var pointers = {};
  function $(id) { return document.getElementById(id); }

  var api = {
    get W() { return W; }, get H() { return H; }, get dpr() { return dpr; },
    get state() { return state; },
    get playing() { return state === 'play'; },
    get padH() { return el && el.classList.contains('pad') ? 190 : 0; },
    get touch() { return document.body.classList.contains('touch'); },
    get score() { return score; },
    addScore: function (n) { if (state !== 'play') return; score += n; updScore(); },
    setScore: function (n) { score = n; updScore(); },
    sfx: function (n) { GA.Audio.play(n); },
    gameOver: function () { gameOver(); },
    best: function () { return cur ? GA.getBest(cur.id) : 0; }
  };

  function updScore() {
    $('mgScoreVal').textContent = score;
    $('mgBestVal').textContent = Math.max(score, cur ? GA.getBest(cur.id) : 0);
  }

  function resize() {
    if (!cv) return;
    var r = cv.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    if (inst && inst.resize) inst.resize();
  }

  var hooks = { open: [], start: [], over: [], close: [] };
  function fire(k) { var a = Array.prototype.slice.call(arguments, 1); hooks[k].forEach(function (f) { try { f.apply(null, a); } catch (e) { if (window.console) console.warn(e); } }); }
  function register(def) { defs[def.id] = def; order.push(def.id); }

  function open(id) {
    var d = defs[id]; if (!d) return false;
    if (state !== 'closed') close(true);
    cur = d;
    el.classList.remove('hidden');
    el.classList.toggle('pad', !!d.dpad && api.touch);
    el.setAttribute('data-game', id);
    $('mgTitle').textContent = d.name;
    resize();
    inst = d.create(api);
    inst.reset();
    score = 0; updScore();
    state = 'ready';
    $('mgReadyName').textContent = d.name;
    $('mgReadyHow').textContent = api.touch ? d.howTouch : d.howKeys;
    $('mgReadyBest').textContent = 'Best: ' + GA.getBest(id);
    $('mgReady').classList.remove('hidden');
    $('mgOver').classList.add('hidden');
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    GA.Audio.play('open');
    fire('open', id);
    return true;
  }

  function close(silent) {
    var id = cur && cur.id;
    state = 'closed'; overToken++;
    cancelAnimationFrame(raf);
    el.classList.add('hidden');
    el.classList.remove('pad');
    cur = null; inst = null; pointers = {};
    if (id) fire('close', id);
    if (!silent) { GA.Audio.play('menu'); if (GA.onMiniClose) GA.onMiniClose(id); }
  }

  function start() {
    if (!cur) return;
    $('mgReady').classList.add('hidden');
    $('mgOver').classList.add('hidden');
    overToken++;
    inst.reset();
    score = 0; updScore();
    state = 'play';
    if (inst.start) inst.start();
    GA.Audio.play('click');
    fire('start', cur.id);
  }

  function gameOver() {
    if (state !== 'play') return;
    state = 'over';
    var id = cur.id, prev = GA.getBest(id), isNew = score > prev;
    if (isNew) GA.setBest(id, score);
    var tix = Math.max(1, Math.floor(score / (cur.ticketDiv || 1)));
    if (score <= 0) tix = 1;
    var total = GA.addTickets(tix);
    if (GA.Prog) GA.Prog.onGameOver(id, score, isNew);
    if (GA.onTickets) GA.onTickets(total);
    fire('over', id, score);
    var tok = ++overToken;
    setTimeout(function () {
      if (tok !== overToken || state !== 'over') return;
      $('mgOverScore').textContent = score;
      $('mgOverBest').textContent = Math.max(prev, score);
      $('mgNew').classList.toggle('hidden', !isNew);
      $('mgTix').textContent = '+' + tix + (tix === 1 ? ' ticket' : ' tickets') + '  (total ' + total + ')';
      $('mgOver').classList.remove('hidden');
      GA.Audio.play(isNew ? 'best' : 'lose');
    }, 750);
    updScore();
  }

  function loop(now) {
    if (state === 'closed') return;
    raf = requestAnimationFrame(loop);
    var dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    if (inst) {
      // fixed sub-steps for fair, consistent physics
      var steps = Math.ceil(dt / (1 / 120)), h = dt / Math.max(1, steps);
      for (var i = 0; i < steps; i++) inst.update(h);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      inst.draw(ctx);
    }
  }

  function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

  function keyName(e) {
    var k = e.key;
    if (k.length === 1) k = k.toLowerCase();
    var map = { w: 'ArrowUp', a: 'ArrowLeft', s: 'ArrowDown', d: 'ArrowRight' };
    return map[k] || k;
  }

  function init() {
    el = $('mg'); cv = $('mgCanvas'); ctx = cv.getContext('2d');
    window.addEventListener('resize', function () { if (state !== 'closed') setTimeout(resize, 60); });
    cv.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (state !== 'play' || !inst) return;
      pointers[e.pointerId] = true;
      try { cv.setPointerCapture(e.pointerId); } catch (er) {}
      var p = pos(e); if (inst.onDown) inst.onDown(p.x, p.y, e);
    });
    cv.addEventListener('pointermove', function (e) {
      if (state !== 'play' || !inst) return;
      var p = pos(e); if (inst.onMove) inst.onMove(p.x, p.y, !!pointers[e.pointerId] || e.pointerType === 'mouse' && e.buttons > 0, e);
    });
    function up(e) {
      if (!pointers[e.pointerId]) return;
      delete pointers[e.pointerId];
      if (state !== 'play' || !inst) return;
      var p = pos(e); if (inst.onUp) inst.onUp(p.x, p.y, e);
    }
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    $('mgBack').addEventListener('click', function () { close(); });
    $('mgExit').addEventListener('click', function () { close(); });
    $('mgAgain').addEventListener('click', function () { start(); });
    $('mgReady').addEventListener('click', function () { start(); });
    $('mgReady').addEventListener('pointerdown', function (e) { e.preventDefault(); });

    // on-screen d-pad (snake)
    Array.prototype.forEach.call(document.querySelectorAll('#mgPad button'), function (b) {
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation();
        b.classList.add('on'); setTimeout(function () { b.classList.remove('on'); }, 120);
        if (state === 'play' && inst && inst.onKey) inst.onKey(b.getAttribute('data-k'), true);
        else if (state === 'ready') start();
      });
    });

    window.addEventListener('keydown', function (e) {
      if (state === 'closed') return;
      var k = keyName(e);
      if (k === 'Escape') { e.preventDefault(); close(); return; }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab'].indexOf(k) >= 0) e.preventDefault();
      if (state === 'ready' && (k === ' ' || k === 'Enter')) { start(); return; }
      if (state === 'over') {
        if (k === 'Enter' && !$('mgOver').classList.contains('hidden')) start();
        return;
      }
      if (state === 'play' && inst && inst.onKey && !e.repeat) inst.onKey(k, true);
    }, true);
    window.addEventListener('keyup', function (e) {
      if (state !== 'play' || !inst || !inst.onKey) return;
      inst.onKey(keyName(e), false);
    }, true);
  }

  /* small drawing helpers shared by games */
  var U = {
    rr: function (c, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    },
    heart: function (c, x, y, s, col) {
      c.save(); c.translate(x, y); c.scale(s / 20, s / 20); c.fillStyle = col || '#ff4f8b';
      c.beginPath(); c.moveTo(0, 6); c.bezierCurveTo(-14, -4, -8, -16, 0, -8); c.bezierCurveTo(8, -16, 14, -4, 0, 6); c.fill(); c.restore();
    },
    text: function (c, s, x, y, size, col, align, glow) {
      c.font = 'bold ' + Math.round(size) + 'px "Trebuchet MS", system-ui, sans-serif';
      c.textAlign = align || 'center'; c.textBaseline = 'middle';
      if (glow) { c.shadowColor = glow; c.shadowBlur = 12; }
      c.fillStyle = col || '#fff'; c.fillText(s, x, y); c.shadowBlur = 0;
    },
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
    rand: function (a, b) { return a + Math.random() * (b - a); }
  };

  GA.MG = {
    register: register, open: open, close: close, start: start,
    isOpen: function () { return state !== 'closed'; },
    state: function () { return state; },
    current: function () { return cur ? cur.id : null; },
    inst: function () { return inst; },
    list: function () { return order.slice(); },
    init: init, U: U, hooks: hooks,
    score: function () { return score; }
  };
})();
