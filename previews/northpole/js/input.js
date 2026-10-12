// Input: floating thumb-stick (left), action buttons (right), drag-anywhere-else to look around. Keyboard + mouse too.
import { $ } from './util.js?v=np7';
export const IN = { mx: 0, my: 0, jump: false, keys: {}, edges: {}, camDX: 0, camDY: 0, lastCam: 0, stick: { id: null, x0: 0, y0: 0, x: 0, y: 0 }, held: {} };
const press = (k) => { IN.edges[k] = true; IN.held[k] = true; };
const release = (k) => { IN.held[k] = false; };
export function initInput() {
  window.addEventListener('keydown', (e) => { if (e.target && e.target.tagName === 'INPUT') return; if (IN.keys[e.code]) return; IN.keys[e.code] = true;
    const map = { Space: 'jump', KeyJ: 'spin', ShiftLeft: 'spin', KeyF: 'blast', KeyK: 'blast', KeyQ: 'hook', KeyG: 'hook', KeyE: 'act', Enter: 'act', Escape: 'pause', KeyP: 'pause' };
    if (map[e.code]) { press(map[e.code]); e.preventDefault(); } if (e.code.startsWith('Arrow')) e.preventDefault(); });
  window.addEventListener('keyup', (e) => { IN.keys[e.code] = false; const map = { Space: 'jump', KeyJ: 'spin', ShiftLeft: 'spin', KeyF: 'blast', KeyK: 'blast' }; if (map[e.code]) release(map[e.code]); });
  window.addEventListener('blur', () => { IN.keys = {}; IN.held = {}; });
  // buttons
  document.querySelectorAll('#touch [data-b]').forEach((el) => { const k = el.dataset.b;
    const on = (e) => { e.preventDefault(); e.stopPropagation(); press(k); el.classList.add('on'); if (navigator.vibrate) try { navigator.vibrate(6); } catch (x) {} };
    const off = (e) => { e.preventDefault(); release(k); el.classList.remove('on'); };
    el.addEventListener('touchstart', on, { passive: false }); el.addEventListener('touchend', off, { passive: false }); el.addEventListener('touchcancel', off, { passive: false });
    el.addEventListener('mousedown', on); el.addEventListener('mouseup', off); el.addEventListener('mouseleave', off); });
  // stick + look
  const z = $('touchZone'), knob = $('stickKnob'), ring = $('stickRing'); const S = IN.stick; let look = null, lx = 0, ly = 0;
  const startT = (e) => { e.preventDefault(); for (const t of e.changedTouches) { const left = t.clientX < window.innerWidth * 0.5 && t.clientY > window.innerHeight * 0.3;
      if (left && S.id === null) { S.id = t.identifier; S.x0 = t.clientX; S.y0 = t.clientY; S.x = S.y = 0; ring.style.left = knob.style.left = t.clientX + 'px'; ring.style.top = knob.style.top = t.clientY + 'px'; ring.classList.add('on'); knob.classList.add('on'); }
      else if (look === null) { look = t.identifier; lx = t.clientX; ly = t.clientY; } } };
  const moveT = (e) => { e.preventDefault(); for (const t of e.changedTouches) { if (t.identifier === S.id) { let dx = t.clientX - S.x0, dy = t.clientY - S.y0; const d = Math.hypot(dx, dy), R = 52; if (d > R) { // drag the base along so the stick never "runs out"
          S.x0 = t.clientX - dx / d * R; S.y0 = t.clientY - dy / d * R; dx = dx / d * R; dy = dy / d * R; ring.style.left = S.x0 + 'px'; ring.style.top = S.y0 + 'px'; }
        S.x = dx / R; S.y = -dy / R; knob.style.left = (S.x0 + dx) + 'px'; knob.style.top = (S.y0 + dy) + 'px'; }
      else if (t.identifier === look) { IN.camDX += (t.clientX - lx); IN.camDY += (t.clientY - ly); lx = t.clientX; ly = t.clientY; IN.lastCam = performance.now(); } } };
  const endT = (e) => { for (const t of e.changedTouches) { if (t.identifier === S.id) { S.id = null; S.x = S.y = 0; ring.classList.remove('on'); knob.classList.remove('on'); } if (t.identifier === look) look = null; } };
  z.addEventListener('touchstart', startT, { passive: false }); z.addEventListener('touchmove', moveT, { passive: false }); z.addEventListener('touchend', endT); z.addEventListener('touchcancel', endT);
  let md = false; z.addEventListener('mousedown', (e) => { md = true; lx = e.clientX; ly = e.clientY; }); window.addEventListener('mouseup', () => { md = false; });
  window.addEventListener('mousemove', (e) => { if (!md) return; IN.camDX += e.clientX - lx; IN.camDY += e.clientY - ly; lx = e.clientX; ly = e.clientY; IN.lastCam = performance.now(); });
}
export function readMove() {
  const K = IN.keys; let x = IN.stick.x, y = IN.stick.y;
  if (K.KeyA || K.ArrowLeft) x -= 1; if (K.KeyD || K.ArrowRight) x += 1; if (K.KeyW || K.ArrowUp) y += 1; if (K.KeyS || K.ArrowDown) y -= 1;
  const d = Math.hypot(x, y); if (d > 1) { x /= d; y /= d; } if (d < 0.12) { x = 0; y = 0; }
  return { x, y };
}
export function edge(k) { const v = !!IN.edges[k]; IN.edges[k] = false; return v; }
export function held(k) { return !!IN.held[k] || (k === 'jump' && !!IN.keys.Space); }
export function clearEdges() { IN.edges = {}; }
