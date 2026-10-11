// Menus & panels: title, pause, how-to, options, expedition map, results, wardrobe, gear shop, journal, newspaper, relic cases.
import { $, esc } from './util.js';
import { S, persist, up, resetSave } from './save.js';
import { HEROES, LEVELS, RELICS, TREASURES, EVIDENCE, UPGRADES, OUTFITS, HEADLINES, outfitUnlocked, countEvidence, countTreasures, levelUnlocked } from './data.js';
import { sfx, setSound } from './audio.js';
import { BUILD } from './levels.js';
export function panel(html, mount, cls = '') { const ui = $('ui'); ui.innerHTML = `<div class="panel ${cls}">${html}</div>`; ui.classList.add('open'); if (mount) mount(ui.firstChild); return ui.firstChild; }
export function closePanel() { const ui = $('ui'); ui.innerHTML = ''; ui.classList.remove('open'); }
const fmt = (t) => { const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + (s < 10 ? '0' : '') + s; };
const built = (L) => !!BUILD[L.id];
const needTxt = (o) => { const [k, v] = o.need.split(':'); return k === 'relic' ? 'Recover the ' + RELICS[v].n : k === 'evidence' ? `Find ${v} evidence` : k === 'coins' ? `Collect ${v} coins` : ''; };
const back = (c, f) => { const b = c.querySelector('#xBack'); if (b) b.onclick = () => { sfx('click'); f(); }; };
const top = (t, coins) => `<div class="topBar"><button class="back" id="xBack">◀</button><h2>${t}</h2>${coins ? `<span class="coinsBadge">🪙 ${S.coins}</span>` : ''}</div>`;
export const UI = {
  title(app) { const ui = $('ui'); ui.innerHTML = `<div class="title">
      <div class="logo"><span class="l0">GROK</span><span class="l1">LOST</span><span class="l2">RELICS</span></div>
      <div style="flex:1"></div>
      <p class="tag">Find the ancient relics before Professor Vintage does...<br>and prove to the Relic Patrol you're the good guy!</p>
      <div class="hero">${HEROES.map((h) => `<button class="${S.hero === h.id ? 'on' : ''}" data-h="${h.id}"><i style="background:${h.col}"></i>${esc(h.n)}<small>${esc(h.d)}</small></button>`).join('')}</div>
      <div class="tBtns"><button class="go" id="tPlay">▶ PLAY</button><button class="mbtn2" id="tOnline">🌐 PLAY WITH FRIENDS</button><button class="mbtn2 sm" id="tOpts">⚙️ OPTIONS</button></div>
      <p class="tiny">🪙 ${S.coins} · 🗿 ${Object.keys(S.relics).length}/5 relics · 🏺 ${countTreasures(S)}/25 · 🔍 ${countEvidence(S)}/15 evidence</p></div>`; ui.classList.add('open');
    ui.querySelectorAll('[data-h]').forEach((b) => b.addEventListener('click', () => { S.hero = b.dataset.h; persist(); sfx('click'); app.refreshMe(); UI.title(app); }));
    $('tPlay').onclick = () => { sfx('click'); app.play(); }; $('tOnline').onclick = () => { sfx('click'); app.net.lobby(); }; $('tOpts').onclick = () => UI.options(app, () => UI.title(app)); },
  story(app, done) { const H = HEADLINES[0]; panel(`<h2>📰 BREAKING NEWS</h2><div class="news"><div class="ed">THE GROKVILLE GAZETTE · EXTRA!</div><b>${esc(H.h)}</b><small>${esc(H.s)}</small></div>
      <p class="sub">You're an explorer who just wants relics safe in the museum. But sneaky Professor Vintage keeps stealing them and blaming YOU.</p><p class="sub">🗿 Recover the 5 ancient relics · 🔍 collect evidence · 🚨 dodge the Relic Patrol · 🧐 beat Vintage's crazy machines</p>
      <button class="go" id="sGo">LET'S GO! 🤠</button>`, (c) => { c.querySelector('#sGo').onclick = () => { sfx('click'); S.seenStory = true; persist(); done(); }; }); },
  pause(app) { const g = app.game, hub = g.levelId === 'hub'; panel(`<h2>⏸ PAUSED</h2>
      <button class="go" id="pRes">▶ RESUME</button>${hub ? '' : `<button class="mbtn2" id="pRestart">↺ RESTART EXPEDITION</button><button class="mbtn2" id="pHub">🏛️ BACK TO THE MUSEUM</button>`}
      <button class="mbtn2" id="pHow">❓ HOW TO PLAY</button><button class="mbtn2" id="pOpt">⚙️ OPTIONS</button>${app.net.room ? '<button class="mbtn2" id="pLeave">🚪 LEAVE ONLINE GAME</button>' : ''}<button class="mbtn2" id="pTitle">🏁 TITLE SCREEN</button>`, (c) => {
      c.querySelector('#pRes').onclick = () => app.resume(); const q = (id, f) => { const el = c.querySelector(id); if (el) el.onclick = f; };
      const hostOnly = () => app.net.room && !app.net.room.isHost && (app.hud.toast('Only the host can do that'), true);
      q('#pRestart', () => { if (hostOnly()) return; app.resume(); app.loadLevel(g.levelId, true); }); q('#pHub', () => { if (hostOnly()) return; app.resume(); app.loadLevel('hub', true); });
      q('#pHow', () => UI.how(app, () => UI.pause(app))); q('#pOpt', () => UI.options(app, () => UI.pause(app))); q('#pLeave', () => { app.net.leave(); app.resume(); app.loadLevel('hub'); }); q('#pTitle', () => { app.net.leave(); app.toTitle(); }); }); },
  how(app, done) { panel(`<h2>❓ HOW TO PLAY</h2><div class="how">
      <p>🕹️ <b>Left thumb</b>: touch the left side and slide to run.</p><p>👆 <b>Right side</b>: drag empty space to look around.</p>
      <p>⬆️ <b>JUMP</b>: tap again in the air for a double jump (with Spring Boots).</p>
      <p>🪢 <b>WHIP</b>: glows when a golden ring is in reach. Tap it to SWING! Near baddies it makes them dizzy (the Patrol too).</p>
      <p>🔥 <b>TORCH</b>: lights dark caves and temples. Bats and spiders hate it. Light braziers with it.</p>
      <p>✋ <b>ACT</b> button pops up for statues, levers, bushes to hide in, and talking.</p>
      <p>🚨 The <b>Relic Patrol</b> thinks YOU are the thief! Stay out of their flashlight cones or hide in a bush.</p>
      <p>🪨 Traps: run from boulders, time the spikes and darts, never stop on a wobbly bridge.</p>
      <p>🧐 Vintage's machines get dizzy ⭐ after attacking. Crack the whip on them then!</p>
      <p>🏺 Each expedition: 5 treasures, 3 pieces of evidence, lots of coins, and one ancient relic.</p></div><button class="go" id="hBack">GOT IT!</button>`, (c) => { c.querySelector('#hBack').onclick = () => { S.seenHow = true; persist(); done(); }; }); },
  options(app, done) { const o = S.opts; const seg = (id, opts, v) => `<div class="seg" id="${id}">${opts.map(([k, l]) => `<button data-v="${k}" class="${String(v) === String(k) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    panel(`<h2>⚙️ OPTIONS</h2><h3>SOUND</h3>${seg('oS', [['1', 'ON'], ['0', 'OFF']], o.sound ? 1 : 0)}<h3>MUSIC</h3>${seg('oM', [['1', 'ON'], ['0', 'OFF']], o.music ? 1 : 0)}<h3>CAMERA SPEED</h3>${seg('oC', [['0.6', 'SLOW'], ['1', 'NORMAL'], ['1.5', 'FAST']], o.camSens)}
      <h3>LOOK LEFT/RIGHT</h3>${seg('oI', [['0', 'NORMAL'], ['1', 'FLIPPED']], o.invertX ? 1 : 0)}<p class="sub">✨ Graphics are always on full. The game sharpens itself automatically when your phone has speed to spare.</p><button class="go" id="oBack">DONE</button><button class="mbtn2 sm danger" id="oReset">Reset save</button>`, (c) => {
      const bs = (id, f) => c.querySelectorAll('#' + id + ' button').forEach((b) => b.onclick = () => { sfx('click'); f(b.dataset.v); persist(); UI.options(app, done); });
      bs('oS', (v) => { o.sound = v === '1'; setSound(o.sound, o.music); }); bs('oM', (v) => { o.music = v === '1'; setSound(o.sound, o.music); }); bs('oC', (v) => { o.camSens = +v; }); bs('oI', (v) => { o.invertX = v === '1'; });
      c.querySelector('#oBack').onclick = () => { sfx('click'); done(); }; c.querySelector('#oReset').onclick = () => { if (confirm('Erase all progress?')) { resetSave(); location.reload(); } }; }); },
  map(app) { panel(top('🗺️ EXPEDITIONS') + LEVELS.map((L, i) => { const un = levelUnlocked(i, S) && built(L), d = S.done[L.id]; const tr = (S.treasures[L.id] || []).length, ev = (S.evidence[L.id] || []).length;
      return `<button class="lvl ${un ? '' : 'lock'}" data-l="${L.id}" style="border-color:${L.col}"><span class="ic">${un ? L.icon : built(L) ? '🔒' : '🚧'}</span><div><b>${esc(L.n)}</b><small>${esc(L.place)} · ${!built(L) ? 'Being dug up... coming soon!' : un ? `${d ? '✅ ' : ''}🏺 ${tr}/5 · 🔍 ${ev}/3${S.best[L.id] ? ' · ⏱ ' + fmt(S.best[L.id]) : ''}` : 'Finish the last expedition first'}</small></div></button>`; }).join(''), (c) => {
      back(c, () => app.resume());
      c.querySelectorAll('[data-l]').forEach((b) => b.onclick = () => { const L = LEVELS.find((l) => l.id === b.dataset.l); const i = LEVELS.indexOf(L);
        if (!built(L)) { sfx('deny'); return app.hud.toast('🚧 Still digging that one up!'); } if (!levelUnlocked(i, S)) { sfx('deny'); return app.hud.toast('🔒 Finish ' + LEVELS[i - 1].n + ' first!'); }
        if (app.net.room && !app.net.room.isHost) return app.hud.toast('The host picks the expedition 🗺️'); sfx('click'); UI.confirm(app, L); }); }); },
  confirm(app, L) { panel(`<h2>${L.icon} ${esc(L.n)}</h2><p class="sub">${esc(L.place)}</p><p class="sub">${esc(L.blurb)}</p><p class="sub">🗿 Relic: <b>${RELICS[L.relic].icon} ${esc(RELICS[L.relic].n)}</b></p>
      <button class="go" id="cGo">🚙 HOP IN THE JEEP!</button><button class="mbtn2" id="xBack">NOT YET</button>`, (c) => { back(c, () => UI.map(app)); c.querySelector('#cGo').onclick = () => { sfx('click'); app.loadLevel(L.id, true); }; }); },
  results(app, res, o) { const L = LEVELS.find((l) => l.id === res.level); const H = o.headline;
    panel(`<h2>${res.relic ? '🏆 EXPEDITION COMPLETE!' : '🏁 BACK TO BASE'}</h2>${res.relic ? `<div class="relicBig">${RELICS[L.relic].icon}</div><p class="sub"><b>${esc(RELICS[L.relic].n)}</b> is safe in the museum!</p>` : ''}
      <div><span class="resRow"><b>🪙 ${res.coins}</b><small>coins</small></span><span class="resRow"><b>🏺 ${res.treasures.length}/5</b><small>treasures</small></span><span class="resRow"><b>🔍 ${res.evidence.length}/3</b><small>evidence</small></span><span class="resRow"><b>⏱ ${fmt(res.time)}</b><small>time</small></span><span class="resRow"><b>🚨 ${res.busted}</b><small>busted</small></span></div>
      ${o.newOutfits.map((x) => `<div class="newG"><span>👒 New outfit: ${esc(x.n)}</span><small>Try it on at the museum wardrobe!</small></div>`).join('')}
      ${H ? `<div class="news"><div class="ed">THE GROKVILLE GAZETTE</div><b>${esc(H.h)}</b><small>${esc(H.s)}</small></div>` : ''}
      <button class="go" id="rGo">🏛️ BACK TO THE MUSEUM</button><button class="mbtn2" id="rAgain">↺ PLAY AGAIN</button>`, (c) => {
      c.querySelector('#rGo').onclick = () => { sfx('click'); if (app.net.room && !app.net.room.isHost) return app.hud.toast('Waiting for the host…'); app.loadLevel('hub', true); };
      c.querySelector('#rAgain').onclick = () => { sfx('click'); if (app.net.room && !app.net.room.isHost) return app.hud.toast('Waiting for the host…'); app.loadLevel(res.level, true); }; }); },
  wardrobe(app) { panel(top('👒 WARDROBE') + `<h3>EXPLORER</h3><div class="hero">${HEROES.map((h) => `<button class="${S.hero === h.id ? 'on' : ''}" data-h="${h.id}"><i style="background:${h.col}"></i>${esc(h.n.split(' ')[0])}</button>`).join('')}</div>
      <h3>OUTFITS</h3><div class="hats">${OUTFITS.map((o) => { const un = outfitUnlocked(o, S); return `<button class="hat ${S.outfit === o.id ? 'on' : ''} ${un ? '' : 'lock'}" data-o="${o.id}">${un ? '' : '🔒 '}${esc(o.n)}<small>${un ? (S.outfit === o.id ? 'Wearing' : 'Tap to wear') : esc(needTxt(o))}</small></button>`; }).join('')}</div>`, (c) => {
      back(c, () => app.resume());
      c.querySelectorAll('[data-h]').forEach((b) => b.onclick = () => { S.hero = b.dataset.h; persist(); sfx('click'); app.refreshMe(); UI.wardrobe(app); });
      c.querySelectorAll('[data-o]').forEach((b) => b.onclick = () => { const o = OUTFITS.find((q) => q.id === b.dataset.o); if (!outfitUnlocked(o, S)) { sfx('deny'); return app.hud.toast('🔒 ' + needTxt(o)); } S.outfit = o.id; persist(); sfx('buy'); app.refreshMe(); UI.wardrobe(app); }); }); },
  shop(app) { panel(top('🛒 TORTY\u2019S GEAR SHOP', true) + `<p class="sub">"Everything an explorer needs. No refunds if you fall in a river." - Torty 🐢</p>` + UPGRADES.map((u) => { const lv = up(u.id), max = lv >= u.max, cost = u.cost[lv];
      return `<div class="upRow"><span class="ic">${u.icon}</span><div><b>${esc(u.n)}</b> ${'●'.repeat(lv)}${'○'.repeat(u.max - lv)}<br><small>${esc(u.d)}</small></div><button class="buy ${max ? 'max' : S.coins < cost ? 'poor' : ''}" data-u="${u.id}">${max ? 'MAX' : '🪙 ' + cost}</button></div>`; }).join(''), (c) => {
      back(c, () => app.resume());
      c.querySelectorAll('[data-u]').forEach((b) => b.onclick = () => { const u = UPGRADES.find((q) => q.id === b.dataset.u), lv = up(u.id); if (lv >= u.max) return; const cost = u.cost[lv]; if (S.coins < cost) { sfx('deny'); return app.hud.toast('Not enough coins! Explore more 🪙'); }
        S.coins -= cost; S.up[u.id] = lv + 1; persist(); sfx('buy'); app.hud.toast(`${u.icon} ${u.n} upgraded!`); app.refreshMe(); UI.shop(app); }); }); },
  journal(app) { const an = Object.entries(S.animals || {}); panel(top('📓 EXPLORER\u2019S JOURNAL') + `<h3>RELICS ${Object.keys(S.relics).length}/5</h3>` + LEVELS.map((L) => { const R = RELICS[L.relic], got = S.relics[L.relic]; return `<div class="ev ${got ? '' : 'lock'}">${got ? R.icon : '❔'} <b>${got ? esc(R.n) : '???'}</b>${got ? ' · ' + esc(R.d) : ' · ' + esc(L.place)}</div>`; }).join('')
      + `<h3>EVIDENCE AGAINST VINTAGE ${countEvidence(S)}/15</h3>` + LEVELS.map((L) => EVIDENCE[L.id].map((e, i) => (S.evidence[L.id] || []).includes(i) ? `<div class="ev">🔍 ${esc(e)}</div>` : `<div class="ev lock">🔒 ${esc(L.place)} clue #${i + 1}</div>`).join('')).join('')
      + `<h3>CRITTERS SHOOED</h3><div class="ev">${an.length ? an.map(([k, v]) => `${({ monkey: '🐒', snake: '🐍', croc: '🐊', bat: '🦇', spider: '🕷️', scorpion: '🦂', rat: '🐀', beetle: '🪲' })[k] || '🐾'} ${k} ×${v}`).join(' · ') : 'None yet! Crack your whip at a cheeky monkey.'}</div><div class="ev">🚨 Times busted by the Relic Patrol: ${S.busted || 0}</div>`, (c) => back(c, () => app.resume())); },
  news(app) { const list = HEADLINES.filter((H) => !H.after || S.done[H.after]); panel(top('📰 THE GROKVILLE GAZETTE') + list.slice().reverse().map((H) => `<div class="news"><b>${esc(H.h)}</b><small>${esc(H.s)}</small></div>`).join(''), (c) => back(c, () => app.resume())); },
  relic(app, id) { const R = RELICS[id], got = S.relics[id], L = LEVELS.find((l) => l.relic === id); panel(`<h2>${got ? R.icon + ' ' + esc(R.n) : '🔒 EMPTY CASE'}</h2>${got ? `<div class="relicBig">${R.icon}</div><p class="sub">${esc(R.d)}</p><p class="sub">Recovered from ${esc(L.n)}.</p>` : `<p class="sub">A relic from <b>${esc(L.place)}</b> belongs here. Professor Vintage wants it too!</p>`}<button class="go" id="xBack">OK</button>`, (c) => back(c, () => app.resume())); },
  treasures(app, lid) { const L = LEVELS.find((l) => l.id === lid), got = S.treasures[lid] || []; panel(top('🏺 ' + esc(L.place).toUpperCase()) + TREASURES[lid].map((t, i) => `<div class="ev ${got.includes(i) ? '' : 'lock'}">${got.includes(i) ? '✨ ' + esc(t) : '🔒 ???'}</div>`).join(''), (c) => back(c, () => app.resume())); },
};
