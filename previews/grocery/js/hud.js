// HUD: area chip, goal line, money / clock / rank chips, carried case + carts, the context action button.
import { $ } from './util.js?v=ggt12';
import { S } from './save.js?v=ggt12';
import { goal } from './story.js?v=ggt12';
import { RANKS, DEPTS } from './data.js?v=ggt12';
import { fmtClock, storeIds, mine } from './sim.js?v=ggt12';
export class HUD {
  region(n) { const e = $('hArea'); if (e && e.textContent !== n) { e.textContent = n; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); } }
  setAct(a) { const b = $('tAct'); const k = a ? a.label : ''; if (k === this._ak) return; this._ak = k; if (a) { b.classList.remove('hidden'); b.textContent = a.label; } else b.classList.add('hidden'); }
  update(g) { const clock = fmtClock(S.time), r = RANKS[S.rank]; const key = Math.round(S.money) + '|' + clock + '|' + S.xp + '|' + S.rank + '|' + (g.carry ? g.carry.dept : '') + '|' + g.cartsHeld + '|' + S.day + '|' + S.mode + '|' + g.fp + '|' + JSON.stringify(S.daily && S.daily.t);
    if (key === this.key) return; this.key = key;
    $('hMoney').textContent = '$' + Math.round(S.money).toLocaleString('en-US'); $('hClock').textContent = 'Day ' + S.day + ' · ' + clock;
    $('hRank').textContent = S.mode === 'career' ? r.e + ' ' + r.n + (RANKS[S.rank + 1] ? ' · ' + S.xp + '/' + RANKS[S.rank + 1].xp : '') : '🏪 ' + storeIds().filter(mine).length + ' stores';
    const x = $('hCarry'); const t = g.carry ? '📦 ' + DEPTS[g.carry.dept].e + ' case' : g.cartsHeld ? '🛒 ×' + g.cartsHeld : ''; x.textContent = t; x.classList.toggle('hidden', !t);
    $('hGoal').textContent = '⭐ ' + goal(); const v = $('tView'); if (v) v.classList.toggle('on2', g.fp); }
}
