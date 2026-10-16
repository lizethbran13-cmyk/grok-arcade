// HUD: area chip, objective + distance, tour/rescue counters, altitude/speed, flight buttons and the context action button.
import { $ } from './util.js?v=st3';
import { S } from './save.js?v=st3';
import { goal } from './story.js?v=st3';
import { TOURS, RESCUES, Hf, WATER_Y } from './map.js?v=st3';
export class HUD {
  region(n) { const e = $('hArea'); if (e && e.textContent !== n) { e.textContent = n; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); } }
  setAct(a) { const b = $('tAct'); const k = a ? a.label : ''; if (k === this._ak) return; this._ak = k; if (a) { b.classList.remove('hidden'); b.textContent = a.label; } else b.classList.add('hidden'); }
  update(g) { this.t = (this.t || 0) + 1; if (this.t % 6) return; const c = g.cop, fly = g.mode === 'fly';
    this.region(g.areaName());
    const mode = fly ? 'fly' : 'walk'; if (mode !== this.mode) { this.mode = mode; $('tJump').textContent = fly ? '▲' : 'JUMP'; $('tDown').classList.toggle('hidden', !fly); $('hAlt').classList.toggle('hidden', !fly); document.body.classList.toggle('flying', fly); }
    if (fly) { const alt = Math.max(0, c.y - Math.max(Hf(c.x, c.z), WATER_Y)); $('hAlt').textContent = `⬆ ${alt.toFixed(0)} m · ${(Math.hypot(c.vx, c.vz) * 3.6).toFixed(0)} km/h`; }
    let gl = goal(g); if (g.race) gl += ` · ⏱ ${g.race.t.toFixed(1)} s`; else if (g.tgt && fly) gl += ` · ${Math.round(Math.hypot(g.tgt.x - c.x, g.tgt.z - c.z))} m`;
    if (gl !== this.gl) { this.gl = gl; $('hGoal').textContent = '⭐ ' + gl; }
    const k = S.tours.length + '|' + S.rescues.length; if (k !== this.key) { this.key = k; $('hTours').textContent = S.tours.length + '/' + TOURS.length; $('hRes').textContent = S.rescues.length + '/' + RESCUES.length; } }
}
