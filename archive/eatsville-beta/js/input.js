// Input: floating thumb-stick (left), buttons (right), drag elsewhere to turn the camera. Keyboard + mouse too.
import { $ } from './util.js';
export const IN = { keys: {}, edges: {}, held: {}, camDX: 0, stick: { id: null, x0: 0, y0: 0, x: 0, y: 0 } };
const press = (k) => { IN.edges[k] = true; IN.held[k] = true; };
export function initInput() {
  const kmap = { Space: 'act', KeyE: 'act', Enter: 'act', KeyF: 'car', KeyQ: 'call', Escape: 'menu', KeyP: 'menu', ShiftLeft: 'run' };
  window.addEventListener('keydown', (e) => { if (e.target && e.target.tagName === 'INPUT') return; if (IN.keys[e.code]) return; IN.keys[e.code] = true; if (kmap[e.code]) { press(kmap[e.code]); e.preventDefault(); } if (e.code.startsWith('Arrow')) e.preventDefault(); });
  window.addEventListener('keyup', (e) => { IN.keys[e.code] = false; if (kmap[e.code]) IN.held[kmap[e.code]] = false; });
  window.addEventListener('blur', () => { IN.keys = {}; IN.held = {}; });
  document.querySelectorAll('[data-b]').forEach((el) => { const k = el.dataset.b;
    const on = (e) => { e.preventDefault(); e.stopPropagation(); press(k); el.classList.add('on'); try { navigator.vibrate && navigator.vibrate(8); } catch (x) {} };
    const off = (e) => { e.preventDefault(); IN.held[k] = false; el.classList.remove('on'); };
    el.addEventListener('touchstart', on, { passive: false }); el.addEventListener('touchend', off, { passive: false }); el.addEventListener('touchcancel', off, { passive: false });
    el.addEventListener('mousedown', on); el.addEventListener('mouseup', off); el.addEventListener('mouseleave', off); });
  const z = $('touchZone'), knob = $('stickKnob'), ring = $('stickRing'); const S = IN.stick; let look = null, lx = 0;
  z.addEventListener('touchstart', (e) => { e.preventDefault(); for (const t of e.changedTouches) { if (t.clientX < window.innerWidth * 0.55 && S.id === null) { S.id = t.identifier; S.x0 = t.clientX; S.y0 = t.clientY; S.x = S.y = 0; ring.style.left = knob.style.left = t.clientX + 'px'; ring.style.top = knob.style.top = t.clientY + 'px'; ring.classList.add('on'); knob.classList.add('on'); } else if (look === null) { look = t.identifier; lx = t.clientX; } } }, { passive: false });
  z.addEventListener('touchmove', (e) => { e.preventDefault(); for (const t of e.changedTouches) { if (t.identifier === S.id) { let dx = t.clientX - S.x0, dy = t.clientY - S.y0; const d = Math.hypot(dx, dy), R = 52; if (d > R) { S.x0 = t.clientX - dx / d * R; S.y0 = t.clientY - dy / d * R; dx = dx / d * R; dy = dy / d * R; ring.style.left = S.x0 + 'px'; ring.style.top = S.y0 + 'px'; }
    S.x = dx / R; S.y = -dy / R; knob.style.left = (S.x0 + dx) + 'px'; knob.style.top = (S.y0 + dy) + 'px'; } else if (t.identifier === look) { IN.camDX += t.clientX - lx; lx = t.clientX; } } }, { passive: false });
  const end = (e) => { for (const t of e.changedTouches) { if (t.identifier === S.id) { S.id = null; S.x = S.y = 0; ring.classList.remove('on'); knob.classList.remove('on'); } if (t.identifier === look) look = null; } };
  z.addEventListener('touchend', end); z.addEventListener('touchcancel', end);
  let md = false; z.addEventListener('mousedown', (e) => { md = true; lx = e.clientX; }); window.addEventListener('mouseup', () => { md = false; }); window.addEventListener('mousemove', (e) => { if (!md) return; IN.camDX += e.clientX - lx; lx = e.clientX; });
}
export function readMove() { const K = IN.keys; let x = IN.stick.x, y = IN.stick.y; if (K.KeyA || K.ArrowLeft) x -= 1; if (K.KeyD || K.ArrowRight) x += 1; if (K.KeyW || K.ArrowUp) y += 1; if (K.KeyS || K.ArrowDown) y -= 1;
  const d = Math.hypot(x, y); if (d > 1) { x /= d; y /= d; } if (d < 0.12) { x = 0; y = 0; } return { x, y }; }
export function edge(k) { const v = !!IN.edges[k]; IN.edges[k] = false; return v; }
export function clearEdges() { IN.edges = {}; }
