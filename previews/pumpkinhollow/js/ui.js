// Menus & panels: title, pause, journal, dialog, clue cards, finale, town map, Style Station, mini-game launcher.
import { $, esc } from './util.js?v=ph5';
import { S, persist, resetSave } from './save.js?v=ph5';
import { sfx, setSound } from './audio.js?v=ph5';
import { HATS, BADGES, SUN_CLUES, SUSPECTS, clueText, sunStep, sideTasks, hint } from './story.js?v=ph5';
import { REGIONS, DOORS, AREAS, STOPS, TRACK } from './town.js?v=ph5';
import { SKINS, HAIRS, HAIR_COLS, SHIRTS, PANTS, cleanLook } from './humans.js?v=ph5';
import * as MG from './minigames.js?v=ph5';
const hex = (c) => '#' + c.toString(16).padStart(6, '0');
export function panel(html, mount, cls = '') { const ui = $('ui'); { const t = $('toast'); if (t && !ui.classList.contains('open')) { t.innerHTML = ''; t.classList.add('low'); } } /* menus open with a clean screen (no reward pills over their header) */ ui.innerHTML = `<div class="panel ${cls}">${html}</div>`; ui.classList.add('open'); if (mount) mount(ui.firstChild); return ui.firstChild; }
export function closePanel() { const ui = $('ui'); ui.innerHTML = ''; ui.classList.remove('open'); const t = $('toast'); if (t && !t.children.length) t.classList.remove('low'); }
const on = (c, sel, f) => { const e = c.querySelector(sel); if (e) e.onclick = (ev) => { ev.stopPropagation(); sfx('click'); f(ev); }; };
export class UI {
  constructor(app) { this.app = app; }
  get g() { return this.app.game; }
  open() { this.app.busy = true; } done() { this.app.busy = false; closePanel(); }
  title() { const app = this.app; const ui = $('ui'); ui.classList.add('open'); app.preview = false; ui.innerHTML = `<div class="title">
      <div class="logo"><span class="l0">GROK</span><span class="l1">PUMPKIN HOLLOW</span><span class="l2">A SPOOKY HUB</span></div>
      <p class="tag">Visit Pumpkin Hollow, a moonlit town of friendly ghosts and pumpkinheads! Explore the Abandoned Village, the graveyard and the bat caves, and solve: Who swiped the Moon Lantern?</p>
      <div class="tBtns"><button class="go" id="tPlay">▶ ${S.made ? 'BACK TO PUMPKIN HOLLOW' : 'VISIT PUMPKIN HOLLOW'}</button><button class="mbtn2" id="tLook">👤 CUSTOMIZE YOUR VISITOR</button><button class="mbtn2" id="tOnline">🌐 EXPLORE WITH FRIENDS</button><button class="mbtn2" id="tOpts">⚙️ OPTIONS</button></div>
      <p class="foot">A Grok hub · up to 3 players</p></div>`;
    on(ui, '#tPlay', () => { if (!S.made) return this.custom(() => app.play(), true); app.play(); }); on(ui, '#tLook', () => this.custom(() => this.title())); on(ui, '#tOnline', () => app.net.lobby()); on(ui, '#tOpts', () => this.options(() => this.title())); }
  custom(done, first) { const app = this.app; app.preview = true; const L = S.look = cleanLook(S.look);
    const row = (k, arr, txt) => `<div class="swRow">${arr.map((c, i) => txt ? `<button data-k="${k}" data-i="${i}" class="txt ${L[k] === i ? 'on' : ''}">${c}</button>` : `<button data-k="${k}" data-i="${i}" class="${L[k] === i ? 'on' : ''}" style="background:${hex(c)}"></button>`).join('')}</div>`;
    panel(`<h2>👤 ${first ? 'NEW VISITOR' : 'YOUR LOOK'}</h2><h3>NAME</h3><input id="cName" maxlength="12" value="${esc(S.name || '')}" placeholder="Your name">
      <h3>SKIN</h3>${row('skin', SKINS)}<h3>HAIR</h3>${row('hair', HAIRS, true)}${row('hairC', HAIR_COLS)}<h3>SHIRT</h3>${row('shirt', SHIRTS)}<h3>PANTS</h3>${row('pants', PANTS)}
      <button class="go" id="cOk">${first ? '🐾 LET\'S GO!' : 'DONE'}</button>`, (c) => {
      c.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => { sfx('click'); L[b.dataset.k] = +b.dataset.i; S.look = L; persist(); app.game.refreshMe(); app.net.online && app.net.sendLook(); this.custom(done, first); });
      c.querySelector('#cName').onchange = (e) => { S.name = String(e.target.value).slice(0, 12); persist(); };
      on(c, '#cOk', () => { S.name = String(c.querySelector('#cName').value || '').slice(0, 12); S.made = true; persist(); app.game.refreshMe(); app.preview = false; app.net.online && app.net.sendLook(); done(); }); }, 'custP'); }
  how(done) { panel(`<h2>❓ HOW TO PLAY</h2><div class="how"><p>🕹️ <b>Move</b> with the left side of the screen. <b>Swipe</b> the right side to look around.</p><p>⬆️ <b>JUMP</b> (tap twice to double jump, hold to glide)</p>
      <p>💬 When a button pops up, tap it to <b>talk, inspect or play</b>.</p><p>☀️ Solve <b>Who swiped the Moon Lantern?</b>, find 🏮 Candy Corns, 🗝️ secrets and play mini-games all over town.</p><p>🐦 Tired legs? Hop on the <b>Ghost Train</b> at any blue stop sign!</p>
      <p>⌨️ Keyboard: WASD/arrows, Space jump, E use, Esc pause.</p></div><button class="go" id="hOk">LET'S GO!</button>`, (c) => on(c, '#hOk', () => { S.seenHow = true; persist(); closePanel(); done && done(); })); }
  pause() { const app = this.app; const online = app.net.online;
    panel(`<h2>⏸️ PAUSED</h2><div class="menu"><button class="go" id="pRes">▶ RESUME</button><button class="mbtn2" id="pJour">📒 JOURNAL</button><button class="mbtn2" id="pMap">🗺️ MAP</button>
      <button class="mbtn2" id="pOnline">🌐 ${online ? 'ROOM ' + app.net.room.code : 'PLAY WITH FRIENDS'}</button><button class="mbtn2" id="pHow">❓ HOW TO PLAY</button><button class="mbtn2" id="pOpt">⚙️ OPTIONS</button><button class="mbtn2" id="pLobby">🏢 BACK TO LOBBY</button>${online ? '<button class="mbtn2" id="pLeave">🚪 LEAVE ROOM</button>' : ''}<button class="mbtn2 sm" id="pTitle">🏠 TITLE</button></div>`, (c) => {
      on(c, '#pRes', () => app.resume()); on(c, '#pJour', () => this.journal(() => this.pause())); on(c, '#pMap', () => this.map(app.game, () => this.pause())); on(c, '#pOnline', () => app.net.lobby());
      on(c, '#pHow', () => this.how(() => this.pause())); on(c, '#pOpt', () => this.options(() => this.pause())); on(c, '#pLobby', () => { const g = app.game; g.me.place(g.world.start, g.world.startYaw); g.cam.snap = true; g.cam.yaw = g.world.startYaw; app.resume(); });
      on(c, '#pLeave', () => { app.net.leave(); app.resume(); }); on(c, '#pTitle', () => app.toTitle()); }); }
  options(back) { const o = S.opts; const seg = (id, opts, v) => `<div class="seg" id="${id}">${opts.map(([k, l]) => `<button data-v="${k}" class="${String(v) === String(k) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    panel(`<h2>⚙️ OPTIONS</h2><h3>SOUND</h3>${seg('oS', [[true, 'ON'], [false, 'OFF']], o.sound)}<h3>MUSIC</h3>${seg('oM', [[true, 'ON'], [false, 'OFF']], o.music)}<h3>CAMERA SPEED</h3>${seg('oC', [[0.6, 'SLOW'], [1, 'NORMAL'], [1.5, 'FAST']], o.camSens)}
      <h3>TIME OF DAY</h3>${seg('oT', [['auto', 'AUTO'], ['day', 'DAY'], ['evening', 'EVENING']], o.tod || 'auto')}<h3>FLIP CAMERA</h3>${seg('oX', [[false, 'NORMAL'], [true, 'FLIPPED']], o.invertX)}<p class="sub">Graphics always run at full quality. They only get sharper when your phone has spare speed.</p><div class="btnRow"><button class="mbtn2 sm" id="oReset">🗑️ RESET SAVE</button><button class="go" id="oBack">DONE</button></div>`, (c) => {
      const bs = (id, f) => c.querySelectorAll('#' + id + ' button').forEach((b) => b.onclick = () => { sfx('click'); f(b.dataset.v); persist(); this.options(back); });
      bs('oS', (v) => { o.sound = v === 'true'; setSound(o.sound, o.music); }); bs('oM', (v) => { o.music = v === 'true'; setSound(o.sound, o.music); }); bs('oC', (v) => o.camSens = +v); bs('oX', (v) => o.invertX = v === 'true'); bs('oT', (v) => o.tod = v);
      on(c, '#oBack', () => back()); on(c, '#oReset', () => { if (confirm('Erase all Pumpkin Hollow progress?')) { resetSave(); location.reload(); } }); }); }
  journal(back) { const q = S.q.sun | 0, st = q >= 4 ? '✅' : q > 0 ? '🔎' : '❔'; const g = this.g;
    const cl = SUN_CLUES.map((c) => `<li class="${S.clues[c] ? '' : 'dim'}">${S.clues[c] ? '🔍 ' + esc(clueText(c)) : '🔒 Clue not found yet'}</li>`).join('');
    const sus = SUSPECTS.map((s) => { const v = S.sus[s.id] | 0; return `<li class="${v ? '' : 'dim'}">${v >= 2 ? '✅' : v ? '❓' : '🦎'} <b>${esc(s.n)}</b>: ${v >= 2 ? 'alibi checks out!' : v ? 'says they didn\'t do it… check the alibi' : esc(s.why)}</li>`; }).join('');
    panel(`<div class="topBar"><button class="back" id="jBack">◀</button><h2>📒 DETECTIVE JOURNAL</h2></div><div class="scroll">
      <h3>${st} WHO SWIPED THE MOON LANTERN?</h3><p class="sub">${esc(sunStep())}</p>${q === 1 ? `<p class="sub">💡 ${esc(hint())}</p>` : ''}<ul class="clues">${cl}</ul>
      <h3>🕵️ SUSPECTS</h3><ul class="clues">${sus}</ul>
      <h3>⭐ SIDE TASKS</h3><ul class="clues">${sideTasks().map(([d, t]) => `<li class="${d ? '' : 'dim'}">${d ? '✅' : '⬜'} ${esc(t)}</li>`).join('')}</ul>
      <h3>🏮 CANDY CORNS ${g.biscGot.size}/${g.world.gears.length} · 🗝️ SECRETS ${S.secrets.length}/${g.world.secrets.length}</h3>
      <h3>🏅 BADGES</h3><div class="badges">${Object.entries(BADGES).filter(([k]) => !k.startsWith('row_')).map(([k, n]) => `<span class="${S.badges[k] ? 'on' : ''}">${S.badges[k] ? esc(n) : '🔒 ???'}</span>`).join('')}</div></div>`, (c) => on(c, '#jBack', () => back ? back() : this.app.resume())); }
  dialog(name, lines, done) { this.open(); let i = 0; const ui = $('dlg'); const show = () => { const [sp, tx] = lines[i]; ui.innerHTML = `<b>${esc(sp || name)}</b><p>${esc(tx)}</p><small>${i < lines.length - 1 ? 'TAP ▶' : 'TAP ✖'}</small>`; ui.classList.add('on'); };
    const next = (e) => { e && e.preventDefault(); sfx('click'); i++; if (i >= lines.length) { ui.classList.remove('on'); ui.onclick = null; this.app.busy = false; window.removeEventListener('keydown', key); setTimeout(done, 30); } else show(); };
    const key = (e) => { if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') next(e); }; ui.onclick = next; setTimeout(() => window.addEventListener('keydown', key), 150); show(); }
  clue(id, text, nw) { this.open(); sfx(nw ? 'check' : 'click'); panel(`<h2>🔍 ${nw ? 'NEW CLUE!' : 'CLUE'}</h2><p class="clueTx">${esc(text)}</p><button class="go" id="cOk">GOT IT</button>`, (c) => on(c, '#cOk', () => this.done()), 'clueP'); }
  finale() { setTimeout(() => { this.open(); sfx('win'); panel(`<div class="fin"><h2>🏮 CASE CLOSED!</h2><h3>Who swiped the Moon Lantern?</h3><p>${esc('It was little Wisp, the littlest ghost! She only BORROWED it to light up Haunted Hill for Grandpa Boo, who is secretly scared of the dark. Now the Moon Lantern is home, and the Midnight Festival is starting in the square!')}</p><p class="rew">🎁 Detective Cloak Hat + Moon Lantern Detective badge</p><button class="go" id="fOk">🎃 TO THE FESTIVAL!</button></div>`, (c) => on(c, '#fOk', () => this.done()), 'finP'); }, 400); }
  fade(mid) { const f = $('fade'); f.classList.add('on'); this.app.busy = true; setTimeout(() => { mid(); setTimeout(() => { f.classList.remove('on'); this.app.busy = false; }, 250); }, 450); }
  // ---------------- video call
  // ---------------- town map (drawn at the real shape of the town)
  map(g, back) { this.open(); const x0 = -190, x1 = 190, z0 = -190, z1 = 190, W = 440, H = 440;
    panel(`<div class="topBar"><button class="back" id="mBack">◀</button><h2>🗺️ PUMPKIN HOLLOW</h2></div><div class="mapWrap"><canvas id="mapC" width="${W}" height="${H}"></canvas></div><p class="sub">You are the pink dot. 👻 = Ghost Train stops.</p>`, (c) => {
      const cv = c.querySelector('#mapC'), x = cv.getContext('2d'); const X = (v) => (v - x0) / (x1 - x0) * W, Z = (v) => (v - z0) / (z1 - z0) * H;
      x.fillStyle = '#f1d3a1'; x.fillRect(0, 0, W, H); const AC = ['#fde7c8', '#fcd9b0', '#e9d8b4', '#f5c9a8', '#f3e1b9', '#cfe8a8', '#f0c890', '#e8b98a'];
      AREAS.forEach((a, i) => { if (!a.blk) return; x.fillStyle = AC[i % AC.length]; x.fillRect(X(a.x0), Z(a.z0), X(a.x1) - X(a.x0), Z(a.z1) - Z(a.z0)); });
      x.strokeStyle = '#c2a27a'; x.lineWidth = 6; x.beginPath(); x.arc(X(0), Z(0), X(34.9) - X(0), 0, 7); x.stroke(); x.fillStyle = '#7dd3fc'; x.beginPath(); x.ellipse(X(0), Z(0), X(10) - X(0), Z(7.5) - Z(0), 0, 0, 7); x.fill();
      x.strokeStyle = '#d9543d'; x.lineWidth = 5; x.beginPath(); x.ellipse(X(TRACK.cx), Z(TRACK.cz), X(TRACK.rx) - X(0), Z(TRACK.rz) - Z(0), 0, 0, 7); x.stroke();
      for (const r of REGIONS) { if (r.id.startsWith('u_')) continue; x.fillStyle = '#fff7ed'; x.strokeStyle = '#ff6b35'; x.lineWidth = 2; x.fillRect(X(r.x0), Z(r.z0), X(r.x1) - X(r.x0), Z(r.z1) - Z(r.z0)); x.strokeRect(X(r.x0), Z(r.z0), X(r.x1) - X(r.x0), Z(r.z1) - Z(r.z0));
        x.fillStyle = '#1f2937'; x.font = '13px system-ui'; x.textAlign = 'center'; x.fillText(r.name.split(' ')[0], (X(r.x0) + X(r.x1)) / 2, (Z(r.z0) + Z(r.z1)) / 2 + 5); }
      x.font = 'bold 11px system-ui'; x.fillStyle = '#7c2d12'; AREAS.forEach((a) => { if (!a.blk) return; const tx = a.name.replace(/^\S+\s/, '').toUpperCase(), mw = X(a.x1) - X(a.x0) - 6; let fs = 11; x.font = `bold ${fs}px system-ui`; while (fs > 7 && x.measureText(tx).width > mw) { fs -= 0.5; x.font = `bold ${fs}px system-ui`; } x.fillText(tx, (X(a.x0) + X(a.x1)) / 2, Z(a.z0) + 12); });
      x.font = '14px system-ui'; STOPS.forEach((s2) => x.fillText('👻', X(s2[0]), Z(s2[1]) + 5));
      const me = g.me; if (!g.under) { x.fillStyle = '#ff4fa0'; x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.arc(X(me.x), Z(me.z), 7, 0, 7); x.fill(); x.stroke(); }
      on(c, '#mBack', () => { if (back) back(); else this.done(); }); }); }
  express(g, from) { this.open(); panel(`<h2>🚂 GHOST TRAIN</h2><p class="sub">Whoooo! Where to? (Free, fast and a little drafty.)</p><div class="tBtns">${STOPS.map((s2, i) => `<button class="mbtn2" data-i="${i}" ${i === from ? 'disabled' : ''}>${s2[3]}${i === from ? ' (you are here)' : ''}</button>`).join('')}<button class="mbtn2" id="eX">✖ STAY HERE</button></div>`, (c) => {
      c.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { if (+b.dataset.i === from) return; sfx('click'); this.done(); g.travel(+b.dataset.i); }); on(c, '#eX', () => this.done()); }); }
  wardrobe() { this.open(); const app = this.app; panel(`<div class="topBar"><button class="back" id="wBack">◀</button><h2>👕 STYLE STATION</h2></div><button class="mbtn2" id="wLook">👤 CHANGE HAIR, SKIN &amp; CLOTHES</button><h3>HATS</h3><div class="hats">${HATS.map((h) => `<button data-h="${h.id}" class="${S.outfit === h.id ? 'on' : ''} ${S.hats[h.id] ? '' : 'lock'}"><b>${S.hats[h.id] ? esc(h.n) : '🔒 ' + esc(h.n)}</b><small>${esc(h.how)}</small></button>`).join('')}</div>`, (c) => {
      on(c, '#wLook', () => this.custom(() => this.wardrobe()));
      c.querySelectorAll('[data-h]').forEach((b) => b.onclick = () => { if (!S.hats[b.dataset.h]) { sfx('deny'); return; } S.outfit = b.dataset.h; persist(); sfx('buy'); app.game.me.setOutfit(S.outfit); app.net.online && app.net.sendLook(); this.wardrobe(); });
      on(c, '#wBack', () => this.done()); }); }
  // ---------------- goo mixer (hands-on)
  // ---------------- 2D mini-games
  minigame(id, g) { const f = MG[{ polish: 'polish', catch: 'catchGame', bubbles: 'bubbles', tougher: 'tougher' }[id]]; if (!f) return; this.open(); f(this, g, (html, mount, cls) => panel(html, mount, 'mgP ' + (cls || '')), () => { this.done(); g.hud.dirty = true; }); }
}
