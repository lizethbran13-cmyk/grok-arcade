// HUD: area chip, objective, Golden Bones + naps counters, the context action button.
import { $ } from './util.js?v=rs5';
import { S } from './save.js?v=rs5';
import { goal } from './story.js?v=rs5';
export class HUD {
  region(n) { const e = $('hArea'); if (e && e.textContent !== n) { e.textContent = n; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); } }
  setAct(a) { const b = $('tAct'); const k = a ? a.label : ''; if (k === this._ak) return; this._ak = k; if (a) { b.classList.remove('hidden'); b.textContent = a.label; } else b.classList.add('hidden'); }
  update(g) { const key = S.bones.length + '|' + S.naps.length + '|' + S.mys + '|' + Object.keys(S.clues).length + '|' + !!S.talks.candy; if (key === this.key) return; this.key = key;
    $('hBones').textContent = S.bones.length + '/' + g.constructor.BN; $('hNaps').textContent = S.naps.length + '/6'; $('hGoal').textContent = '⭐ ' + goal(); }
}
