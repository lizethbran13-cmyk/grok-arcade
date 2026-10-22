// Phone portrait controls: floating joystick on the left of the screen, one big action button bottom-right. Keyboard too.
import { $ } from './util.js';
export const IN = { mx: 0, mz: 0, a: 0 };
const keys = {};
export function initInput() {
  const pad = $('pad'), knob = $('knob'), zone = $('stickZone'), btn = $('actBtn'); let tid = null, ox = 0, oy = 0;
  zone.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; tid = t.identifier; ox = t.clientX; oy = t.clientY; pad.style.left = ox + 'px'; pad.style.top = oy + 'px'; pad.classList.add('on'); e.preventDefault(); }, { passive: false });
  zone.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) if (t.identifier === tid) { let dx = t.clientX - ox, dy = t.clientY - oy; const d = Math.hypot(dx, dy), R = 50; if (d > R) { dx *= R / d; dy *= R / d; } knob.style.transform = `translate(${dx}px,${dy}px)`; IN.mx = dx / R; IN.mz = dy / R; } e.preventDefault(); }, { passive: false });
  const end = (e) => { for (const t of e.changedTouches) if (t.identifier === tid) { tid = null; IN.mx = IN.mz = 0; knob.style.transform = ''; pad.classList.remove('on'); } };
  zone.addEventListener('touchend', end); zone.addEventListener('touchcancel', end);
  // mouse drag for desktop testing
  let md = false; zone.addEventListener('mousedown', (e) => { md = true; ox = e.clientX; oy = e.clientY; pad.style.left = ox + 'px'; pad.style.top = oy + 'px'; pad.classList.add('on'); });
  addEventListener('mousemove', (e) => { if (!md) return; let dx = e.clientX - ox, dy = e.clientY - oy; const d = Math.hypot(dx, dy), R = 50; if (d > R) { dx *= R / d; dy *= R / d; } knob.style.transform = `translate(${dx}px,${dy}px)`; IN.mx = dx / R; IN.mz = dy / R; });
  addEventListener('mouseup', () => { if (md) { md = false; IN.mx = IN.mz = 0; knob.style.transform = ''; pad.classList.remove('on'); } });
  const press = (v) => (e) => { IN.btn = v; btn.classList.toggle('dn', v); e.preventDefault(); };
  btn.addEventListener('touchstart', press(1), { passive: false }); btn.addEventListener('touchend', press(0)); btn.addEventListener('mousedown', press(1)); btn.addEventListener('mouseup', press(0)); btn.addEventListener('mouseleave', () => { IN.btn = 0; btn.classList.remove('dn'); });
  addEventListener('keydown', (e) => { keys[e.code] = 1; }); addEventListener('keyup', (e) => { keys[e.code] = 0; });
}
export function readInput() {
  let kx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0), kz = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  return { mx: kx || IN.mx, mz: kz || IN.mz, a: keys.Space || keys.Enter || IN.btn ? 1 : 0 };
}
