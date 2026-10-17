// HUD: area chip, next goal, coins + rating, the context action button.
import { $ } from './util.js?v=ppk1';
import { S } from './save.js?v=ppk1';
import { goal } from './story.js?v=ppk1';
export class HUD {
  region(n) { const e = $('hArea'); if (e && e.textContent !== n) { e.textContent = n; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); } }
  setAct(a) { const b = $('tAct'); const k = a ? a.label : ''; if (k === this._ak) return; this._ak = k; if (a) { b.classList.remove('hidden'); b.textContent = a.label; } else b.classList.add('hidden'); }
  update() { const key = S.coins + '|' + S.rating + '|' + S.ladder + '|' + S.seenMatch + '|' + Object.keys(S.talks).length + '|' + Object.keys(S.drills).length + '|' + Object.keys(S.tour).length; if (key === this.key) return; this.key = key;
    $('hCoins').textContent = S.coins; $('hRate').textContent = S.rating.toFixed(1); $('hGoal').textContent = '⭐ ' + goal(); }
}
