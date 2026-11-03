// HUD: area name, gears, current objective, prompts, toasts, timers.
import { $, esc } from './util.js';
import { S, ensureTT } from './save.js';
import { goudaStep, gardenStep, tortugaStep } from './story.js';
export class HUD {
  constructor() { this.dirty = true; this.toasts = $('toast'); }
  region(n) { const e = $('hArea'); if (e && e.textContent !== n) { e.textContent = n; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); } }
  toast(m) { const d = document.createElement('div'); d.className = 'tst'; d.textContent = m; this.toasts.appendChild(d); while (this.toasts.children.length > 3) this.toasts.firstChild.remove(); setTimeout(() => d.classList.add('out'), 2800); setTimeout(() => d.remove(), 3300); }
  setAct(a) { const b = $('tAct'); const k = a ? a.label : ''; if (k === this._ak) return; this._ak = k; if (a) { b.classList.remove('hidden'); b.textContent = a.label; } else b.classList.add('hidden'); }
  timer(t) { const e = $('hTimer'); if (e.textContent !== t) { e.textContent = t; e.classList.toggle('hidden', !t); } }
  update(dt, g) { const tt = ensureTT(); const key = g.gearGot.size + '|' + S.q.gouda + '|' + S.q.garden + '|' + S.q.tortuga + '|' + tt.integrity + '|' + tt.damaged + '|' + tt.scrap + '|' + g.region + '|' + Object.keys(S.clues).length + '|' + JSON.stringify(S.keys) + '|' + g.players.size + '|' + S.toys.length;
    if (key === this.key && !this.dirty) return; this.key = key; this.dirty = false;
    $('hGears').textContent = g.gearGot.size + '/' + g.world.gears.length;
    const shEl = $('hShell'); if (shEl) { shEl.textContent = (tt.damaged ? '⚠️ CRACKED ' : '🐢 Shell ') + tt.integrity + '% · 🔩 ' + tt.scrap; shEl.classList.toggle('dmg', !!tt.damaged); } $('hKeys').innerHTML = (S.keys.blue ? '<i class="kc b"></i>' : '') + (S.keys.red ? '<i class="kc r"></i>' : '');
    const goal = (tt.damaged || g.region === 'tortuga' || ((S.q.tortuga | 0) > 0 && (S.q.tortuga | 0) < 4)) ? '🐢 ' + tortugaStep() : (S.q.gouda | 0) < 4 && (S.q.gouda | 0) > 0 ? '🧀 ' + goudaStep() : (S.q.garden | 0) < 4 && (S.q.garden | 0) > 0 ? '🌵 ' + gardenStep() : (S.q.gouda | 0) === 0 ? '🧀 ' + goudaStep() : (S.q.garden | 0) === 0 ? '🌵 ' + gardenStep() : '🐢 ' + tortugaStep();
    $('hGoal').textContent = goal;
    const ps = [...g.players.values()]; $('hPlayers').innerHTML = ps.length > 1 ? ps.map((p) => `<span>${esc(p.name)}</span>`).join('') : ''; }
}
