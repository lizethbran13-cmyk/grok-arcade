/* Preview-only mock of the Grok Arcade GA.MG host so the bonus cabinet (#52 Sled Dash) runs inside Candy's Snow Day. */
(function () {
  'use strict';
  var BEST = 'candySnowDay.cabBest';
  var reg = null;
  window.GA = window.GA || {};
  GA.MG = { register: function (d) { reg = d; }, U: {
    rr: function (c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); },
    heart: function (c, x, y, s, col) { c.save(); c.translate(x, y); c.scale(s / 20, s / 20); c.fillStyle = col || '#ff4f8b'; c.beginPath(); c.moveTo(0, 6); c.bezierCurveTo(-14, -4, -8, -16, 0, -8); c.bezierCurveTo(8, -16, 14, -4, 0, 6); c.fill(); c.restore(); },
    text: function (c, s, x, y, size, col, align, glow) { c.font = 'bold ' + Math.round(size) + 'px "Trebuchet MS", system-ui, sans-serif'; c.textAlign = align || 'center'; c.textBaseline = 'middle'; if (glow) { c.shadowColor = glow; c.shadowBlur = 12; } c.fillStyle = col || '#fff'; c.fillText(s, x, y); c.shadowBlur = 0; },
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; }, rand: function (a, b) { return a + Math.random() * (b - a); } } };
  var s = document.createElement('script'); s.src = './js/game-sleddash.js?v=snowlive1'; document.head.appendChild(s);
  var state = 'closed', score = 0, inst = null, cv, ctx, W = 360, H = 480, raf = 0, last = 0;
  function best() { try { return +localStorage.getItem(BEST) || 0; } catch (e) { return 0; } }
  var api = { get W() { return W; }, get H() { return H; }, get playing() { return state === 'play'; }, get touch() { return 'ontouchstart' in window; }, get score() { return score; },
    addScore: function (n) { if (state === 'play') score += n; }, setScore: function (n) { score = n; }, sfx: function () {}, best: best,
    gameOver: function () { state = 'over'; try { if (score > best()) localStorage.setItem(BEST, score); } catch (e) {} info(); if (window.__snowCab) window.__snowCab('over', score); } };
  function info() { var el = document.getElementById('cabInfo'); if (!el) return; el.textContent = state === 'over' ? 'Game over! Score ' + score + ' · Best ' + best() + ' · tap to play again' : state === 'ready' ? (reg ? (api.touch ? reg.howTouch : reg.howKeys) : '') + ' · Tap to start' : 'Score ' + score + ' · Best ' + best(); }
  function pos(e) { var r = cv.getBoundingClientRect(), t = e.touches ? e.touches[0] || e.changedTouches[0] : e; return [(t.clientX - r.left) * W / r.width, (t.clientY - r.top) * H / r.height]; }
  function frame(now) { if (state === 'closed') return; var dt = Math.min(0.05, (now - last) / 1000); last = now; inst.update(dt); inst.draw(ctx); if (state === 'play' && ((now / 250) | 0) % 2) info(); raf = requestAnimationFrame(frame); }
  function down(e) { e.preventDefault(); if (state !== 'play') { score = 0; inst.reset(); state = 'play'; info(); return; } var p = pos(e); inst.onDown && inst.onDown(p[0], p[1]); }
  function move(e) { if (state !== 'play') return; e.preventDefault(); var p = pos(e); inst.onMove && inst.onMove(p[0], p[1]); }
  function up() { inst && inst.onUp && inst.onUp(); }
  function key(e) { if (state === 'closed') return; if (e.code === 'Escape') { close(); return; } e.stopPropagation(); if (/Arrow|Key[WASD]/.test(e.code)) e.preventDefault(); if (e.type === 'keydown' && state !== 'play' && (e.code === 'Space' || e.code === 'Enter')) { down({ preventDefault: function () {} }); return; } inst.onKey && inst.onKey(e.code, e.type === 'keydown'); }
  function open() { if (!reg) return; var m = document.getElementById('cab'); cv = document.getElementById('cabCanvas'); cv.width = W; cv.height = H; ctx = cv.getContext('2d'); m.classList.add('on');
    if (!inst) { inst = reg.create(api); cv.addEventListener('mousedown', down); cv.addEventListener('mousemove', move); window.addEventListener('mouseup', up); cv.addEventListener('touchstart', down, { passive: false }); cv.addEventListener('touchmove', move, { passive: false }); cv.addEventListener('touchend', up); }
    inst.reset(); state = 'ready'; score = 0; info(); window.addEventListener('keydown', key, true); window.addEventListener('keyup', key, true); if (window.__snowCab) window.__snowCab('open'); last = performance.now(); raf = requestAnimationFrame(frame); }
  function close() { state = 'closed'; cancelAnimationFrame(raf); document.getElementById('cab').classList.remove('on'); window.removeEventListener('keydown', key, true); window.removeEventListener('keyup', key, true); if (window.__snowCab) window.__snowCab('close'); }
  document.addEventListener('DOMContentLoaded', function () { var b = document.getElementById('cabClose'); if (b) b.onclick = close; });
  window.SNOW_CAB = { open: open, close: close, state: function () { return state; } };
})();
