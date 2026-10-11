// Menus & panels: title, pause, journal, dialog, clue cards, finale, town map, Style Station, mini-game launcher.
import { $, esc } from './util.js';
import { S, persist, resetSave } from './save.js';
import { sfx, setSound } from './audio.js';
import { HATS, BADGES, BONE_CLUES, SUSPECTS, clueText, boneStep, sideTasks, hint } from './story.js';
import { REGIONS, DOORS } from './town.js';
import { SKINS, HAIRS, HAIR_COLS, SHIRTS, PANTS, cleanLook } from './humans.js';
import * as MG from './minigames.js';
const hex = (c) => '#' + c.toString(16).padStart(6, '0');
export function panel(html, mount, cls = '') { const ui = $('ui'); ui.innerHTML = `<div class="panel ${cls}">${html}</div>`; ui.classList.add('open'); if (mount) mount(ui.firstChild); return ui.firstChild; }
export function closePanel() { const ui = $('ui'); ui.innerHTML = ''; ui.classList.remove('open'); }
const on = (c, sel, f) => { const e = c.querySelector(sel); if (e) e.onclick = (ev) => { ev.stopPropagation(); sfx('click'); f(ev); }; };
export class UI {
  constructor(app) { this.app = app; }
  get g() { return this.app.game; }
  open() { this.app.busy = true; } done() { this.app.busy = false; closePanel(); }
  title() { const app = this.app; const ui = $('ui'); ui.classList.add('open'); app.preview = false; ui.innerHTML = `<div class="title">
      <div class="logo"><span class="l0">GROK</span><span class="l1">PUP TOWN</span><span class="l2">CANDY'S HOMETOWN</span></div>
      <p class="tag">Visit Candy's cozy hometown! Meet the dogs, play games and solve the mystery of the missing Golden Bone.</p>
      <div class="tBtns"><button class="go" id="tPlay">▶ ${S.made ? 'BACK TO PUP TOWN' : 'VISIT PUP TOWN'}</button><button class="mbtn2" id="tLook">👤 CUSTOMIZE YOUR VISITOR</button><button class="mbtn2" id="tOnline">🌐 EXPLORE WITH FRIENDS</button><button class="mbtn2" id="tOpts">⚙️ OPTIONS</button></div>
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
      <p>💬 When a button pops up, tap it to <b>talk, inspect or play</b>.</p><p>🎾 <b>THROW</b> tosses a ball. Nearby dogs LOVE to fetch it!</p><p>🦴 Solve the mystery of the Golden Bone, find 🍪 golden biscuits, 🗝️ secrets, and play mini-games all over town. Ride the 🚌 Dog-Bus from its stops!</p>
      <p>⌨️ Keyboard: WASD/arrows, Space jump, E use, F throw, Esc pause.</p></div><button class="go" id="hOk">LET'S GO!</button>`, (c) => on(c, '#hOk', () => { S.seenHow = true; persist(); closePanel(); done && done(); })); }
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
      on(c, '#oBack', () => back()); on(c, '#oReset', () => { if (confirm('Erase all Pup Town progress?')) { resetSave(); location.reload(); } }); }); }
  journal(back) { const q = S.q.bone | 0, st = q >= 4 ? '✅' : q > 0 ? '🔎' : '❔'; const g = this.g;
    const cl = BONE_CLUES.map((c) => `<li class="${S.clues[c] ? '' : 'dim'}">${S.clues[c] ? '🔍 ' + esc(clueText(c)) : '🔒 Clue not found yet'}</li>`).join('');
    const sus = SUSPECTS.map((s) => { const v = S.sus[s.id] | 0; return `<li class="${v ? '' : 'dim'}">${v >= 2 ? '✅' : v ? '❓' : '🐶'} <b>${esc(s.n)}</b>: ${v >= 2 ? 'alibi checks out!' : v ? 'says they didn\'t do it… check the alibi' : esc(s.why)}</li>`; }).join('');
    panel(`<div class="topBar"><button class="back" id="jBack">◀</button><h2>📒 DETECTIVE JOURNAL</h2></div><div class="scroll">
      <h3>${st} WHO STOLE THE GOLDEN BONE?</h3><p class="sub">${esc(boneStep())}</p>${q === 1 ? `<p class="sub">💡 ${esc(hint())}</p>` : ''}<ul class="clues">${cl}</ul>
      <h3>🕵️ SUSPECTS</h3><ul class="clues">${sus}</ul>
      <h3>⭐ SIDE TASKS</h3><ul class="clues">${sideTasks().map(([d, t]) => `<li class="${d ? '' : 'dim'}">${d ? '✅' : '⬜'} ${esc(t)}</li>`).join('')}</ul>
      <h3>🍪 BISCUITS ${g.biscGot.size}/${g.world.gears.length} · 🗝️ SECRETS ${S.secrets.length}/${g.world.secrets.length}</h3>
      <h3>🏅 BADGES</h3><div class="badges">${Object.entries(BADGES).map(([k, n]) => `<span class="${S.badges[k] ? 'on' : ''}">${S.badges[k] ? esc(n) : '🔒 ???'}</span>`).join('')}</div></div>`, (c) => on(c, '#jBack', () => back ? back() : this.app.resume())); }
  dialog(name, lines, done) { this.open(); let i = 0; const ui = $('dlg'); const show = () => { const [sp, tx] = lines[i]; ui.innerHTML = `<b>${esc(sp || name)}</b><p>${esc(tx)}</p><small>${i < lines.length - 1 ? 'TAP ▶' : 'TAP ✖'}</small>`; ui.classList.add('on'); };
    const next = (e) => { e && e.preventDefault(); sfx('click'); i++; if (i >= lines.length) { ui.classList.remove('on'); ui.onclick = null; this.app.busy = false; window.removeEventListener('keydown', key); setTimeout(done, 30); } else show(); };
    const key = (e) => { if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') next(e); }; ui.onclick = next; setTimeout(() => window.addEventListener('keydown', key), 150); show(); }
  clue(id, text, nw) { this.open(); sfx(nw ? 'check' : 'click'); panel(`<h2>🔍 ${nw ? 'NEW CLUE!' : 'CLUE'}</h2><p class="clueTx">${esc(text)}</p><button class="go" id="cOk">GOT IT</button>`, (c) => on(c, '#cOk', () => this.done()), 'clueP'); }
  finale() { setTimeout(() => { this.open(); sfx('win'); panel(`<div class="fin"><h2>🦴 CASE CLOSED!</h2><h3>Who stole the Golden Bone?</h3><p>${esc('It was little Nugget! He only BORROWED it, to make the shiniest birthday surprise ever for Candy. Now the whole town is throwing Candy a birthday party in the square!')}</p><p class="rew">🎁 Detective Hat + Golden Bone Detective badge</p><button class="go" id="fOk">🎉 PARTY TIME!</button></div>`, (c) => on(c, '#fOk', () => this.done()), 'finP'); }, 400); }
  fade(mid) { const f = $('fade'); f.classList.add('on'); this.app.busy = true; setTimeout(() => { mid(); setTimeout(() => { f.classList.remove('on'); this.app.busy = false; }, 250); }, 450); }
  // ---------------- video call
  // ---------------- town map (drawn at the real shape of the town)
  map(g, back) { this.open(); const x0 = -48, x1 = 50, z0 = -68, z1 = 70, W = 420, H = Math.round(W * (z1 - z0) / (x1 - x0));
    panel(`<div class="topBar"><button class="back" id="mBack">◀</button><h2>🗺️ PUP TOWN</h2></div><div class="mapWrap"><canvas id="mapC" width="${W}" height="${H}"></canvas></div><p class="sub">You are the pink dot. 🚌 = Dog-Bus stops.</p>`, (c) => {
      const cv = c.querySelector('#mapC'), x = cv.getContext('2d'); const X = (v) => (v - x0) / (x1 - x0) * W, Z = (v) => (v - z0) / (z1 - z0) * H;
      x.fillStyle = '#8fdc7e'; x.fillRect(0, 0, W, H); x.fillStyle = '#6b7280'; x.fillRect(X(-23), Z(-23), X(23) - X(-23), Z(23) - Z(-23)); x.fillStyle = '#fde7c8'; x.fillRect(X(-16), Z(-16), X(16) - X(-16), Z(16) - Z(-16)); x.fillStyle = '#7dd3fc'; x.beginPath(); x.arc(X(0), Z(0), (X(5) - X(0)), 0, 7); x.fill();
      x.fillStyle = '#bbf7a0'; x.fillRect(X(-23), Z(27), X(23) - X(-23), Z(66) - Z(27)); x.fillStyle = '#7dd3fc'; x.beginPath(); x.ellipse(X(-13), Z(58), X(6.5) - X(0), Z(4.4) - Z(0), 0, 0, 7); x.fill();
      const cols = { hall: '#fecaca', library: '#c7d2fe', barkade: '#ddd6fe', bakery: '#fbcfe8', groomer: '#a5f3fc', fire: '#fca5a5', garden: '#bbf7d0', candy: '#fde68a' };
      for (const r of REGIONS) { x.fillStyle = cols[r.id] || '#eee'; x.strokeStyle = '#ff4fa0'; x.lineWidth = 2; x.fillRect(X(r.x0), Z(r.z0), X(r.x1) - X(r.x0), Z(r.z1) - Z(r.z0)); x.strokeRect(X(r.x0), Z(r.z0), X(r.x1) - X(r.x0), Z(r.z1) - Z(r.z0));
        x.fillStyle = '#1f2937'; x.font = 'bold 10px system-ui'; x.textAlign = 'center'; const nm = r.name.replace(/^\S+\s/, ''); const ws = nm.split(' '); const cx = (X(r.x0) + X(r.x1)) / 2, cy = (Z(r.z0) + Z(r.z1)) / 2; x.fillText(r.name.split(' ')[0], cx, cy - 8); x.fillText(ws.slice(-2).join(' '), cx, cy + 6); }
      x.font = 'bold 12px system-ui'; x.fillStyle = '#14532d'; x.fillText('🌳 PAW PARK', X(0), Z(47)); x.fillText('🔭 LOOKOUT HILL', X(0), Z(-56)); x.fillText('🦴 BACKYARD', X(-35), Z(49)); x.fillText('🚌', X(8), Z(21.5)); x.fillText('🚌', X(-12), Z(-21));
      const me = g.me; x.fillStyle = '#ff4fa0'; x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.arc(X(me.x), Z(me.z), 7, 0, 7); x.fill(); x.stroke();
      on(c, '#mBack', () => { if (back) back(); else this.done(); }); }); }
  wardrobe() { this.open(); const app = this.app; panel(`<div class="topBar"><button class="back" id="wBack">◀</button><h2>👕 STYLE STATION</h2></div><button class="mbtn2" id="wLook">👤 CHANGE HAIR, SKIN &amp; CLOTHES</button><h3>HATS</h3><div class="hats">${HATS.map((h) => `<button data-h="${h.id}" class="${S.outfit === h.id ? 'on' : ''} ${S.hats[h.id] ? '' : 'lock'}"><b>${S.hats[h.id] ? esc(h.n) : '🔒 ' + esc(h.n)}</b><small>${esc(h.how)}</small></button>`).join('')}</div>`, (c) => {
      on(c, '#wLook', () => this.custom(() => this.wardrobe()));
      c.querySelectorAll('[data-h]').forEach((b) => b.onclick = () => { if (!S.hats[b.dataset.h]) { sfx('deny'); return; } S.outfit = b.dataset.h; persist(); sfx('buy'); app.game.me.setOutfit(S.outfit); app.net.online && app.net.sendLook(); this.wardrobe(); });
      on(c, '#wBack', () => this.done()); }); }
  // ---------------- goo mixer (hands-on)
  // ---------------- 2D mini-games
  minigame(id, g) { const f = MG[{ bake: 'bake', groom: 'groom', squirrel: 'squirrel', stack: 'stack' }[id]]; if (!f) return; this.open(); f(this, g, (html, mount, cls) => panel(html, mount, 'mgP ' + (cls || '')), () => { this.done(); g.hud.dirty = true; }); }
}
