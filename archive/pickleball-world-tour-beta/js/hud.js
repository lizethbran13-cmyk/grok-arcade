// HUD: area chip, next goal, paddle grit condition, coins + rating, the context action button.
import { $ } from './util.js?v=ppk2';
import { S } from './save.js?v=ppk2';
import { goal } from './story.js?v=ppk2';
export class HUD {
  region(n) { const e = $('hArea'); if (e && e.textContent !== n) { e.textContent = n; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); } }
  setAct(a) { const b = $('tAct'); const k = a ? a.label : ''; if (k === this._ak) return; this._ak = k; if (a) { b.classList.remove('hidden'); b.textContent = a.label; } else b.classList.add('hidden'); }
  update() {
    const cond = Math.max(0, Math.min(100, Math.round(S.padCond ?? 100)));
    const key = S.coins + '|' + S.rating + '|' + cond + '|' + S.ladder + '|' + S.seenMatch + '|' + (S.smash && S.smash.wins) + '|' + (S.dillers && S.dillers.wins) + '|' + Object.keys(S.talks).length + '|' + Object.keys(S.drills).length + '|' + Object.keys(S.tour).length;
    if (key === this.key) return; this.key = key;
    $('hCoins').textContent = S.coins;
    $('hRate').textContent = S.rating.toFixed(1);
    const hp = $('hPad'), hc = $('hPadChip');
    if (hp) hp.textContent = cond + '%';
    if (hc) {
      hc.style.color = cond <= 20 ? '#ff6b6b' : cond <= 50 ? '#fde047' : '#fff';
      hc.style.borderColor = cond <= 20 ? '#ef4444' : cond <= 50 ? '#eab308' : '';
    }
    $('hGoal').textContent = '⭐ ' + goal();
  }
}
