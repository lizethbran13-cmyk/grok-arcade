// Menu kit: panels, talk bubbles with choices, toasts and the canvas helpers the 2D mini-games use.
import { $, esc } from './util.js?v=rs6';
import { sfx } from './audio.js?v=rs6';
export function panel(html, mount, cls = '') { const ui = $('ui'); ui.innerHTML = `<div class="panel ${cls}">${html}</div>`; ui.classList.add('open'); const c = ui.firstChild; if (mount) mount(c); return c; }
export function closePanel() { const ui = $('ui'); ui.innerHTML = ''; ui.classList.remove('open'); }
export const on = (c, sel, f) => { const e = c.querySelector(sel); if (e) e.onclick = (ev) => { ev.stopPropagation(); sfx('click'); f(ev); }; };
export function toast(m) { const t = $('toast'); if (!t) return; const d = document.createElement('div'); d.className = 'tst'; d.textContent = m; t.appendChild(d); while (t.children.length > 3) t.firstChild.remove(); setTimeout(() => d.classList.add('out'), 2600); setTimeout(() => d.remove(), 3100); }
// talk: lines = [[who, text], ...]; choices on the last line: [{t, f}]
export function talk(lines, done, choices) { let i = 0; const box = $('dlg');
  const show = () => { const [who, tx] = lines[i]; const last = i === lines.length - 1;
    box.innerHTML = `<div class="dBox"><b>${esc(who)}</b><p>${esc(tx)}</p>${last && choices ? `<div class="dCh">${choices.map((c, k) => `<button data-k="${k}">${esc(c.t)}</button>`).join('')}</div>` : `<small>tap ▶</small>`}</div>`; box.classList.add('on');
    if (last && choices) box.querySelectorAll('[data-k]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); sfx('click'); box.classList.remove('on'); box.innerHTML = ''; box.onclick = null; choices[+b.dataset.k].f(); });
    box.onclick = (e) => { if (last && choices) return; e.stopPropagation(); sfx('click'); i++; if (i >= lines.length) { box.classList.remove('on'); box.innerHTML = ''; box.onclick = null; done && done(); } else show(); }; };
  show(); }
export function talking() { return $('dlg').classList.contains('on'); }
export function loop(cv, f) { let lt = performance.now(), alive = true; const tick = () => { if (!alive || !cv.isConnected) return; requestAnimationFrame(tick); const n = performance.now(); const dt = Math.min(0.05, (n - lt) / 1000); lt = n; f(dt); }; requestAnimationFrame(tick); return () => { alive = false; }; }
export const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
export const ptr = (cv, W, H) => (e) => { const r = cv.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e; return [(p.clientX - r.left) / r.width * W, (p.clientY - r.top) / r.height * H]; };
export { esc };
