// HUD: hearts, coins, treasures, evidence, boss bar, speech bubbles, banners, evidence cards, "busted" card, prompts, toasts.
import { $, esc } from './util.js';
const WHO = { martina: ['🐢', 'MARTINA'], torty: ['🐢', 'TORTY'], patrol: ['👮', 'RELIC PATROL'], pickles: ['🕵️', 'INSPECTOR PICKLES'], vintage: ['🧐', 'PROFESSOR VINTAGE'], max: ['🤠', 'YOU'] };
export class HUD {
  constructor() { this.dirty = true; this.toasts = $('toast'); this.hintT = 0; this.sayT = 0; this.banT = 0; this.evT = 0; this.bustT = 0; this.bossB = null; }
  startLevel(g) { this.g = g; this.dirty = true; this.boss(null); this.hintT = 0; for (const id of ['hHint', 'hSay', 'hBanner', 'hEvCard', 'hBusted']) $(id).classList.remove('on'); $('hLevel').textContent = g.world.title || ''; }
  toast(m) { const d = document.createElement('div'); d.className = 'tst'; d.textContent = m; this.toasts.appendChild(d); while (this.toasts.children.length > 3) this.toasts.firstChild.remove(); setTimeout(() => d.classList.add('out'), 2300); setTimeout(() => d.remove(), 2800); }
  hint(m) { const h = $('hHint'); h.textContent = m; h.classList.add('on'); this.hintT = 6.5; }
  say(who, msg) { let w = WHO[who] || WHO.martina; if (who === 'martina' && /Torty/.test(msg) && !/Martina/.test(msg)) w = WHO.torty; $('hSayP').textContent = w[0]; $('hSayN').textContent = w[1]; $('hSayT').textContent = msg; $('hSay').classList.add('on'); this.sayT = Math.min(9, 3 + msg.length / 18); }
  banner(m) { const b = $('hBanner'); b.textContent = m; b.classList.add('on'); this.banT = 2.8; }
  evidence(t, n) { $('hEvT').textContent = t; $('hEvN').textContent = n + '/3'; $('hEvCard').classList.add('on'); this.evT = 3.2; }
  busted(name, lose) { $('hBustT').textContent = `${name} caught you! "Back to the start of the area, sneaky!"` + (lose ? ` (-${lose} 🪙)` : ''); $('hBusted').classList.add('on'); this.bustT = 2.4; }
  boss(B) { this.bossB = B; $('hBoss').classList.toggle('hidden', !B); if (B) $('hBossN').textContent = B.D.n; }
  setAct(a, hook) { const b = $('tAct'); if (a) { b.classList.remove('hidden'); if (b._l !== a.label) { b.innerHTML = esc(a.label); b._l = a.label; } } else b.classList.add('hidden'); $('tWhip').classList.toggle('ready', !!hook); }
  update(dt, g) {
    const tick = (k, id) => { if (this[k] > 0) { this[k] -= dt; if (this[k] <= 0) $(id).classList.remove('on'); } };
    tick('hintT', 'hHint'); tick('sayT', 'hSay'); tick('banT', 'hBanner'); tick('evT', 'hEvCard'); tick('bustT', 'hBusted');
    if (this.bossB) { const B = this.bossB; $('hBossF').style.width = Math.max(0, B.hp / B.D.hp * 100) + '%'; $('hBoss').classList.toggle('tired', B.st === 'tired'); }
    const me = g.me; $('tTorch').classList.toggle('lit', !!me.torch);
    const key = me.hearts + '|' + me.maxHearts + '|' + g.tally.coins + '|' + g.tally.treasures.length + '|' + g.tally.evidence.length + '|' + g.players.size + '|' + (me.hidden ? 1 : 0);
    if (key === this.key && !this.dirty) return; this.key = key; this.dirty = false;
    let h = ''; for (let i = 0; i < me.maxHearts; i++) h += `<i class="ht${i < me.hearts ? '' : ' off'}"></i>`; $('hHearts').innerHTML = h;
    $('hCoins').textContent = g.tally.coins; const hub = !g.L; $('hTreas').textContent = g.tally.treasures.length + '/5'; $('hEvid').textContent = g.tally.evidence.length + '/3'; $('hStats').classList.toggle('hidden', hub); $('hHidden').classList.toggle('hidden', !me.hidden);
    const ps = [...g.players.values()]; $('hPlayers').innerHTML = ps.length > 1 ? ps.map((p) => `<span style="border-color:${p.color}">${esc(p.name)} ${'❤'.repeat(Math.max(0, p.hearts))}</span>`).join('') : '';
  }
}
