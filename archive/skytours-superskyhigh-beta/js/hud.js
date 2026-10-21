// HUD: area chip, objective + distance, tour/rescue counters, altitude/speed, flight buttons and the context action button.
import { $ } from './util.js?v=st10';
import { S } from './save.js?v=st10';
import { goal } from './story.js?v=st10';
import { PLANE } from './planes.js?v=st10';
import { TOURS, RESCUES, Hf, WATER_Y } from './map.js?v=st10';
export class HUD {
  region(n) { const e = $('hArea'); if (e && e.textContent !== n) { e.textContent = n; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); } }
  setAct(a) { const b = $('tAct'); const k = a ? a.label : ''; if (k === this._ak) return; this._ak = k; if (a) { b.classList.remove('hidden'); b.textContent = a.label; } else b.classList.add('hidden'); }
  update(g) { this.t = (this.t || 0) + 1; if (this.t % 6) return; const c = g.cop, fly = g.mode === 'fly';
    this.region(g.areaName());
    const mode = fly ? 'fly' : 'walk'; if (mode !== this.mode) { this.mode = mode; $('tJump').textContent = fly ? '▲' : 'JUMP'; $('tDown').classList.toggle('hidden', !fly); $('hAlt').classList.toggle('hidden', !fly); document.body.classList.toggle('flying', fly); }
    if (fly) { const alt = Math.max(0, c.y - Math.max(Hf(c.x, c.z), WATER_Y)); $('hAlt').textContent = `⬆ ${alt.toFixed(0)} m · ${(Math.hypot(c.vx, c.vz) * 3.6).toFixed(0)} km/h`; }
    { const fare = fly && g.fare && c.mode === 'fly' ? g.fareNow() : 0; const st = `🪙 ${S.coins} · ⭐${S.rating.toFixed(1)} · ${PLANE(c.id).emoji} ${c.hp}%${fare ? ' · 🧳+' + fare : ''}${c.hp <= 0 ? ' 🚫' : ''}${g.skyStatus && g.skyStatus() && !(g.sky && g.sky.bt) ? ' · ' + g.skyStatus() : ''}`; if (st !== this.st) { this.st = st; const e = $('hStat'); e.textContent = st; e.classList.toggle('low', c.hp < 30); } }
    let gl = (g.skyGoal && g.skyGoal()) || (g.mode === 'walk' && !S.carry && !g.race && g.walkGoal ? g.walkGoal() : goal(g)); if (g.race) gl += ` · ⏱ ${g.race.t.toFixed(1)} s`; else if (g.tgt && fly) gl += ` · ${Math.round(Math.hypot(g.tgt.x - c.x, g.tgt.z - c.z))} m`;
    if (gl !== this.gl) { this.gl = gl; $('hGoal').textContent = '⭐ ' + gl; }
    const k = S.tours.length + '|' + S.rescues.length; if (k !== this.key) { this.key = k; $('hTours').textContent = S.tours.length + '/' + TOURS.length; $('hRes').textContent = S.rescues.length + '/' + RESCUES.length; } }
}
