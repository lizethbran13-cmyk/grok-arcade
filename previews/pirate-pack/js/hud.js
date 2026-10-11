// HUD: hearts, cheese, parts, babies, boss bar, prompts, toasts, hints.
import { $, esc } from './util.js';
export class HUD {
  constructor() { this.dirty = true; this.el = $('hud'); this.toasts = $('toast'); this.hintT = 0; this.bossB = null; }
  startLevel(g) { this.g = g; this.dirty = true; this.boss(null); this.hintT = 0; $('hHint').classList.remove('on'); $('hud').classList.remove('hidden'); $('hLevel').textContent = g.world.title || ''; const pir = !!g.world.pirate; const ic = (id, t) => { const el = $(id); if (el && el.previousSibling) el.previousSibling.textContent = t; }; ic('hCheese', pir ? '🪙 ' : '🧀 '); ic('hBabies', pir ? '🧰 ' : '🐭 '); ic('hParts', pir ? '💎 ' : '⚙️ '); }
  toast(m) { const d = document.createElement('div'); d.className = 'tst'; d.textContent = m; this.toasts.appendChild(d); while (this.toasts.children.length > 3) this.toasts.firstChild.remove(); setTimeout(() => d.classList.add('out'), 2300); setTimeout(() => d.remove(), 2800); }
  hint(m) { const h = $('hHint'); h.textContent = m; h.classList.add('on'); this.hintT = 6; }
  boss(B) { this.bossB = B; $('hBoss').classList.toggle('hidden', !B); if (B) { $('hBossN').textContent = B.D.n; } }
  setAct(a, hook) { const b = $('tAct'); if (a) { b.classList.remove('hidden'); b.innerHTML = esc(a.label); } else b.classList.add('hidden'); $('tHook').classList.toggle('ready', !!hook); }
  update(dt, g) {
    if (this.hintT > 0) { this.hintT -= dt; if (this.hintT <= 0) $('hHint').classList.remove('on'); }
    if (this.bossB) { const B = this.bossB; $('hBossF').style.width = Math.max(0, B.hp / B.D.hp * 100) + '%'; $('hBoss').classList.toggle('tired', B.st === 'tired'); }
    const me = g.me; const key = me.hearts + '|' + me.maxHearts + '|' + g.tally.crumbs + '|' + g.tally.cheese + '|' + g.tally.parts.length + '|' + g.tally.babies.length + '|' + (me.shield >= 1 && me.gadgets.has('shield') ? 1 : 0) + '|' + g.players.size;
    if (key === this.key && !this.dirty) return; this.key = key; this.dirty = false;
    let h = ''; for (let i = 0; i < me.maxHearts; i++) h += `<i class="ht${i < me.hearts ? '' : ' off'}"></i>`; if (me.gadgets.has('shield')) h += `<i class="sh${me.shield >= 1 ? '' : ' off'}"></i>`; $('hHearts').innerHTML = h;
    $('hCheese').textContent = g.tally.crumbs + g.tally.cheese * 10; const hq = g.levelId === 'hq' || g.levelId === 'pship';
    $('hParts').textContent = g.tally.parts.length + '/5'; $('hBabies').textContent = g.tally.babies.length + '/3'; $('hStats').classList.toggle('hidden', hq);
    $('tHook').classList.toggle('hidden', !me.gadgets.has('grapple'));
    const ps = [...g.players.values()]; $('hPlayers').innerHTML = ps.length > 1 ? ps.map((p) => `<span style="border-color:${p.color}">${esc(p.name)} ${'❤'.repeat(Math.max(0, p.hearts))}</span>`).join('') : '';
  }
}
