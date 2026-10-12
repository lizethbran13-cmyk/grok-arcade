// HUD: area name, Snowflakes, current objective, prompts, toasts, timers.
import { $, esc } from './util.js?v=np10';
import { S } from './save.js?v=np10';
import { sunStep } from './story.js?v=np10';
export class HUD {
  constructor() { this.dirty = true; this.toasts = $('toast'); }
  region(n) { const e = $('hArea'); if (e && e.textContent !== n) { e.textContent = n; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); } }
  // over an open menu (shop, journal, mini-game...) rewards queue up one at a time in a slim strip at the bottom instead of stacking over the panel's header
  toast(m) { const ui = document.getElementById('ui'), busy = ui && ui.classList.contains('open'); this.toasts.classList.toggle('low', !!busy);
    if (busy) { (this.tq || (this.tq = [])).push(m); if (this.tq.length > 4) this.tq.shift(); if (!this.tqOn) this.pump(); return; }
    const d = document.createElement('div'); d.className = 'tst'; d.textContent = m; this.toasts.appendChild(d); while (this.toasts.children.length > 3) this.toasts.firstChild.remove(); setTimeout(() => d.classList.add('out'), 2800); setTimeout(() => d.remove(), 3300); }
  pump() { const m = this.tq && this.tq.shift(); if (!m) { this.tqOn = false; return; } this.tqOn = true; this.toasts.classList.add('low'); this.toasts.innerHTML = ''; const d = document.createElement('div'); d.className = 'tst'; d.textContent = m; this.toasts.appendChild(d);
    setTimeout(() => d.classList.add('out'), 1500); setTimeout(() => { d.remove(); const ui = document.getElementById('ui'); if (!(ui && ui.classList.contains('open'))) this.toasts.classList.remove('low'); this.pump(); }, 1850); }
  setAct(a) { const b = $('tAct'); const k = a ? a.label : ''; if (k === this._ak) return; this._ak = k; if (a) { b.classList.remove('hidden'); b.textContent = a.label; } else b.classList.add('hidden'); }
  timer(t) { const e = $('hTimer'); if (e.textContent !== t) { e.textContent = t; e.classList.toggle('hidden', !t); } }
  throwMode(on) { const b = $('tBlast'); if (b) b.classList.toggle('big', !!on); }
  update(dt, g) { const key = g.biscGot.size + '|' + S.q.sun + '|' + Object.keys(S.sus).map((k) => S.sus[k]).join('') + '|' + Object.keys(S.clues).length + '|' + g.players.size + '|' + S.toys.length + '|' + S.plants.length;
    if (key === this.key && !this.dirty) return; this.key = key; this.dirty = false;
    $('hGears').textContent = g.biscGot.size + '/' + g.world.gears.length; $('hKeys').innerHTML = S.toys.length && !S.flags.toys ? `<span class="chip">🎁 ${S.toys.length}/3</span>` : '';
    $('hGoal').textContent = (S.q.sun | 0) < 4 ? '☀️ ' + sunStep() : '⭐ Explore! Snowflakes, secrets, mini-games and friends.';
    const ps = [...g.players.values()]; $('hPlayers').innerHTML = ps.length > 1 ? ps.map((p) => `<span>${esc(p.name)}</span>`).join('') : ''; }
}
