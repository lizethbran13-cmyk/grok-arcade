// Menus & panels: title, pause, journal, dialog, clue cards, video calls, map, dress-up, goo mixer, taste test.
import { $, esc } from './util.js';
import { S, persist, resetSave, ensureTT } from './save.js';
import { sfx, setSound } from './audio.js';
import { HATS, BADGES, CALLERS, callHint, goudaStep, gardenStep, tortugaStep, GOUDA_CLUES, GARDEN_CLUES, clueText } from './story.js';
import { CROSSOVER_GADGETS, CHAMBER_INFO } from './tortuga-wing.js';
import { REGIONS } from './campus.js';
import { drawFace } from './models2.js';
import { SKINS, HAIRS, HAIR_COLS, SHIRTS, PANTS, cleanLook } from './humans.js';
const hex = (c) => '#' + c.toString(16).padStart(6, '0');
const RATS = [{ id: 'luna', n: 'Luna', d: 'Gray & speedy', col: '#a9afbd' }, { id: 'pirat', n: 'Pi-rat', d: 'Cream, one-eyed explorer', col: '#c99a6b' }, { id: 'snowie', n: 'Snowie', d: 'Snow white & bouncy', col: '#fbfbff' }];
export { RATS };
export function panel(html, mount, cls = '') { const ui = $('ui'); ui.innerHTML = `<div class="panel ${cls}">${html}</div>`; ui.classList.add('open'); if (mount) mount(ui.firstChild); return ui.firstChild; }
export function closePanel() { const ui = $('ui'); ui.innerHTML = ''; ui.classList.remove('open'); }
const on = (c, sel, f) => { const e = c.querySelector(sel); if (e) e.onclick = (ev) => { ev.stopPropagation(); sfx('click'); f(ev); }; };
export class UI {
  constructor(app) { this.app = app; }
  get g() { return this.app.game; }
  open() { this.app.busy = true; } done() { this.app.busy = false; closePanel(); }
  title() { const app = this.app; const ui = $('ui'); ui.classList.add('open'); app.preview = false; ui.innerHTML = `<div class="title">
      <div class="logo"><span class="l0">GROK</span><span class="l1">RATITA</span><span class="l2">INDUSTRIES HQ</span></div>
      <p class="tag">It's your first day as the new intern! Meet Luna, Pi-rat, Snowie, Candy &amp; Torty, explore the HQ + the new attached <b>🐢 Tortuga Tech Wing</b>!</p>
      <div class="tBtns"><button class="go" id="tPlay">▶ ${S.made ? 'BACK TO WORK' : 'START YOUR FIRST DAY'}</button><button class="mbtn2 ttHeroBtn" id="bTortugaGo">🐢 TORTUGA TECH WING (NEW DLC!)</button><button class="mbtn2" id="tLook">👤 CUSTOMIZE YOUR INTERN</button><button class="mbtn2" id="tOnline">🌐 EXPLORE WITH FRIENDS</button><button class="mbtn2 sm" id="tOpts">⚙️ OPTIONS</button></div>
      <p class="foot">A Ratita Industries hub · up to 3 players</p></div>`;
    on(ui, '#tPlay', () => { if (!S.made) return this.custom(() => app.play(), true); app.play(); }); on(ui, '#bTortugaGo', () => { S.made = true; S.seenHow = true; persist(); app.play(); if (app.game) app.game.goToTortuga('hub'); }); on(ui, '#tLook', () => this.custom(() => this.title())); on(ui, '#tOnline', () => app.net.lobby()); on(ui, '#tOpts', () => this.options(() => this.title())); }
  // character creator (live 3D preview: the camera swings in to your intern)
  custom(done, first) { const app = this.app; app.preview = true; const L = S.look = cleanLook(S.look);
    const row = (k, arr, txt) => `<div class="swRow">${arr.map((c, i) => txt ? `<button data-k="${k}" data-i="${i}" class="txt ${L[k] === i ? 'on' : ''}">${c}</button>` : `<button data-k="${k}" data-i="${i}" class="${L[k] === i ? 'on' : ''}" style="background:${hex(c)}"></button>`).join('')}</div>`;
    panel(`<h2>👤 ${first ? 'NEW INTERN BADGE' : 'YOUR INTERN'}</h2><h3>NAME</h3><input id="cName" maxlength="12" value="${esc(S.name || '')}" placeholder="Your name">
      <h3>SKIN</h3>${row('skin', SKINS)}<h3>HAIR</h3>${row('hair', HAIRS, true)}${row('hairC', HAIR_COLS)}<h3>SHIRT</h3>${row('shirt', SHIRTS)}<h3>PANTS</h3>${row('pants', PANTS)}
      <button class="go" id="cOk">${first ? '🏢 CLOCK IN!' : 'DONE'}</button>`, (c) => {
      c.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => { sfx('click'); L[b.dataset.k] = +b.dataset.i; S.look = L; persist(); app.game.refreshMe(); app.net.online && app.net.sendLook(); this.custom(done, first); });
      c.querySelector('#cName').onchange = (e) => { S.name = String(e.target.value).slice(0, 12); persist(); };
      on(c, '#cOk', () => { S.name = String(c.querySelector('#cName').value || '').slice(0, 12); S.made = true; persist(); app.game.refreshMe(); app.preview = false; app.net.online && app.net.sendLook(); done(); }); }, 'custP'); }
  how(done) { panel(`<h2>❓ HOW TO EXPLORE</h2><div class="how"><p>🕹️ <b>Move</b> with the left side of the screen. <b>Swipe</b> the right side to look around.</p><p>⬆️ <b>JUMP</b> (tap twice to double jump, hold to glide)</p>
      <p>💬 When a button pops up, tap it to <b>talk, inspect or use</b> things.</p><p>🧀 <b>BLAST</b> shoots cheese (great for Pi-rat's target test).</p><p>🔎 Two mysteries to solve, ⚙️ golden gears to find, 🗝️ secrets, live 🚀 tests in the yard, and 📞 video calls with Mimi, Lily &amp; Lili!</p>
      <p>⌨️ Keyboard: WASD/arrows, Space jump, E use, F blast, Esc pause.</p></div><button class="go" id="hOk">LET'S GO!</button>`, (c) => on(c, '#hOk', () => { S.seenHow = true; persist(); closePanel(); done && done(); })); }
  pause() { const app = this.app; const online = app.net.online;
    panel(`<h2>⏸️ PAUSED</h2><div class="menu"><button class="go" id="pRes">▶ RESUME</button><button class="mbtn2" id="pJour">📒 JOURNAL</button><button class="mbtn2" id="pMap">🗺️ MAP</button><button class="mbtn2" id="pTortuga">🐢 TORTUGA TECH LAB</button>
      <button class="mbtn2" id="pOnline">🌐 ${online ? 'ROOM ' + app.net.room.code : 'PLAY WITH FRIENDS'}</button><button class="mbtn2" id="pHow">❓ HOW TO PLAY</button><button class="mbtn2" id="pOpt">⚙️ OPTIONS</button><button class="mbtn2" id="pLobby">🏢 BACK TO LOBBY</button>${online ? '<button class="mbtn2" id="pLeave">🚪 LEAVE ROOM</button>' : ''}<button class="mbtn2 sm" id="pTitle">🏠 TITLE</button></div>`, (c) => {
      on(c, '#pRes', () => app.resume()); on(c, '#pJour', () => this.journal(() => this.pause())); on(c, '#pMap', () => this.map(app.game, () => this.pause())); on(c, '#pTortuga', () => this.tortugaLab(app.game)); on(c, '#pOnline', () => app.net.lobby());
      on(c, '#pHow', () => this.how(() => this.pause())); on(c, '#pOpt', () => this.options(() => this.pause())); on(c, '#pLobby', () => { const g = app.game; g.me.place(g.world.start, g.world.startYaw); g.cam.snap = true; g.cam.yaw = g.world.startYaw; app.resume(); });
      on(c, '#pLeave', () => { app.net.leave(); app.resume(); }); on(c, '#pTitle', () => app.toTitle()); }); }
  options(back) { const o = S.opts; const seg = (id, opts, v) => `<div class="seg" id="${id}">${opts.map(([k, l]) => `<button data-v="${k}" class="${String(v) === String(k) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    panel(`<h2>⚙️ OPTIONS</h2><h3>SOUND</h3>${seg('oS', [[true, 'ON'], [false, 'OFF']], o.sound)}<h3>MUSIC</h3>${seg('oM', [[true, 'ON'], [false, 'OFF']], o.music)}<h3>CAMERA SPEED</h3>${seg('oC', [[0.6, 'SLOW'], [1, 'NORMAL'], [1.5, 'FAST']], o.camSens)}
      <h3>FLIP CAMERA</h3>${seg('oX', [[false, 'NORMAL'], [true, 'FLIPPED']], o.invertX)}<p class="sub">Graphics always run at full quality. They only get sharper when your phone has spare speed.</p><div class="btnRow"><button class="mbtn2 sm" id="oReset">🗑️ RESET SAVE</button><button class="go" id="oBack">DONE</button></div>`, (c) => {
      const bs = (id, f) => c.querySelectorAll('#' + id + ' button').forEach((b) => b.onclick = () => { sfx('click'); f(b.dataset.v); persist(); this.options(back); });
      bs('oS', (v) => { o.sound = v === 'true'; setSound(o.sound, o.music); }); bs('oM', (v) => { o.music = v === 'true'; setSound(o.sound, o.music); }); bs('oC', (v) => o.camSens = +v); bs('oX', (v) => o.invertX = v === 'true');
      on(c, '#oBack', () => back()); on(c, '#oReset', () => { if (confirm('Erase all HQ progress?')) { resetSave(); location.reload(); } }); }); }
  journal(back) { const st = (q) => (q >= 4 ? '✅' : q > 0 ? '🔎' : '❔'); const cl = (ids) => ids.map((c) => `<li class="${S.clues[c] ? '' : 'dim'}">${S.clues[c] ? '🔍 ' + esc(clueText(c)) : '🔒 Clue not found yet'}</li>`).join('');
    const g = this.g; const side = [[S.flags.goo, 'Mix bouncy goo for Prof. Fizzwick (Goo Lab)'], [S.flags.range, 'Ace Pi-rat\'s target test (Gadget Lab)'], [S.flags.toys, `Find Candy's 3 squeaky toys (${S.toys.length}/3)`], [S.flags.mug, 'Find Gary the intern\'s lost mug'],
      [(S.watched | 0) >= 3, `Watch 3 live tests for Luna (${Math.min(3, S.watched | 0)}/3)`], [Object.keys(S.calls).length >= 3, `Video call Mimi, Lily and Lili (${Object.keys(S.calls).length}/3)`], [S.badges.taste, 'Brave the cheese taste test (Cheese R&D)']];
    panel(`<div class="topBar"><button class="back" id="jBack">◀</button><h2>📒 JOURNAL</h2></div><div class="scroll">
      <h3>${st(S.q.gouda | 0)} THE GREAT GOUDA HEIST</h3><p class="sub">${esc(goudaStep())}</p><ul class="clues">${cl(GOUDA_CLUES)}</ul>
      <h3>${st(S.q.garden | 0)} THE SECRET GARDENER</h3><p class="sub">${esc(gardenStep())}</p><ul class="clues">${cl(GARDEN_CLUES)}</ul>
      <h3>${st(S.q.tortuga | 0)} 🐢 DLC: TORTUGA TECH EXPANSION</h3><p class="sub">${esc(tortugaStep())}</p>
      <h3>⭐ SIDE TASKS</h3><ul class="clues">${side.map(([d, t]) => `<li class="${d ? '' : 'dim'}">${d ? '✅' : '⬜'} ${esc(t)}</li>`).join('')}</ul>
      <h3>⚙️ GEARS ${g.gearGot.size}/${g.world.gears.length} · 🗝️ SECRETS ${S.secrets.length}/${g.world.secrets.length} · 🔑 ${S.keys.blue ? 'BLUE ' : ''}${S.keys.red ? 'RED' : ''}</h3>
      <h3>🏅 BADGES</h3><div class="badges">${Object.entries(BADGES).map(([k, n]) => `<span class="${S.badges[k] ? 'on' : ''}">${S.badges[k] ? esc(n) : '🔒 ???'}</span>`).join('')}</div></div>`, (c) => on(c, '#jBack', () => back ? back() : this.app.resume())); }
  // ---------------- dialog (bottom box, tap to continue)
  dialog(name, lines, done) { this.open(); let i = 0; const ui = $('dlg'); const show = () => { const [sp, tx] = lines[i]; ui.innerHTML = `<b>${esc(sp || name)}</b><p>${esc(tx)}</p><small>${i < lines.length - 1 ? 'TAP ▶' : 'TAP ✖'}</small>`; ui.classList.add('on'); };
    const next = (e) => { e && e.preventDefault(); sfx('click'); i++; if (i >= lines.length) { ui.classList.remove('on'); ui.onclick = null; this.app.busy = false; window.removeEventListener('keydown', key); setTimeout(done, 30); } else show(); };
    const key = (e) => { if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') next(e); }; ui.onclick = next; setTimeout(() => window.addEventListener('keydown', key), 150); show(); }
  clue(id, text, nw) { this.open(); sfx(nw ? 'check' : 'click'); panel(`<h2>🔍 ${nw ? 'NEW CLUE!' : 'CLUE'}</h2><p class="clueTx">${esc(text)}</p><button class="go" id="cOk">GOT IT</button>`, (c) => on(c, '#cOk', () => this.done()), 'clueP'); }
  finale(which) { const t = which === 'gouda' ? ['🧀 CASE CLOSED!', 'The Great Gouda Heist', 'Sweepy the robo-vac thought the Golden Gouda was the world\'s biggest crumb! It\'s back in its case now (with a "NOT A CRUMB" sign).', 'Chef Hat + Gouda Detective badge']
      : which === 'tortuga' ? ['🐢 MERGER COMPLETE!', 'Tortuga Tech Inc. × Ratita HQ', 'All 3 Shell-Tough Test Chambers passed certification! Tortuga Tech Inc. and Ratita Industries HQ are officially merged, and Martina "Torty" presented your golden shell honors!', '🐢 Tortuga Shell Helmet + Shell-Tough Engineer badge']
      : ['🌵 CASE CLOSED!', 'The Secret Gardener', 'Martina the desert tortoise lives in Pi-rat\'s secret Desert Dome, and she\'s been leaving flowers for Snowie every morning!', 'Flower hat + Secret Gardener badge'];
    setTimeout(() => { this.open(); sfx('win'); panel(`<div class="fin"><h2>${t[0]}</h2><h3>${t[1]}</h3><p>${esc(t[2])}</p><p class="rew">🎁 ${t[3]}</p><button class="go" id="fOk">YAY!</button></div>`, (c) => on(c, '#fOk', () => this.done()), 'finP'); }, 400); }
  fade(mid) { const f = $('fade'); f.classList.add('on'); this.app.busy = true; setTimeout(() => { mid(); setTimeout(() => { f.classList.remove('on'); this.app.busy = false; }, 250); }, 450); }
  // ---------------- video call
  call() { this.open(); panel(`<h2>📞 VIDEO CALL</h2><p class="sub">Who do you want to call?</p><div class="callPick">${Object.entries(CALLERS).map(([k, c]) => `<button data-k="${k}" style="--c:${c.col}"><b>${c.n}</b><small>${c.home}</small></button>`).join('')}</div><button class="mbtn2" id="cX">HANG UP</button>`, (c) => {
      c.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => { sfx('click'); this.callBot(b.dataset.k); }); on(c, '#cX', () => this.done()); }, 'callP'); }
  callBot(k) { const C = CALLERS[k]; let t = 0, talkT = 0, mood = 'idle', txt = 'Calling ' + C.n + '…', ringing = 1.4, glitch = 0; const face = document.createElement('canvas'); face.width = 256; face.height = 160; const F = { c: face, g: face.getContext('2d') };
    panel(`<div class="vc"><div class="vcScr"><canvas id="vcC" width="480" height="360"></canvas><span class="vcN">${C.n} · ${C.home}</span></div><p class="vcT" id="vcT"></p>
      <div class="btnRow"><button class="mbtn2" id="vH">💡 HINT</button><button class="mbtn2" id="vJ">😂 JOKE</button><button class="mbtn2" id="vM">✨ HOW ARE YOU?</button><button class="go" id="vB">👋 BYE</button></div></div>`, (c) => {
      const cv = c.querySelector('#vcC'), g = cv.getContext('2d'), T = c.querySelector('#vcT'); const say = (s, m = 'talk') => { txt = s; mood = m; talkT = Math.min(3.5, 0.9 + s.length * 0.04); T.textContent = s; };
      T.textContent = txt; sfx('squeak');
      const rnd = (a) => a[(Math.random() * a.length) | 0];
      let lt = performance.now(); const loop = () => { if (!cv.isConnected) return; requestAnimationFrame(loop); const nw = performance.now(); const dt = Math.min(0.1, (nw - lt) / 1000); lt = nw; t += dt;
        if (ringing > 0) { ringing -= dt; if (ringing <= 0) { S.calls[k] = 1; persist(); const gm = this.g; if (Object.keys(S.calls).length >= 3 && gm) gm.badge('calls'); gm && gm.checkCrown(); say(rnd(C.hi), 'happy'); sfx('check'); if (k === 'lili' && Math.random() < 0.4) glitch = 1.6; } }
        if (talkT > 0) talkT -= dt; if (glitch > 0) { glitch -= dt; if (glitch <= 0) say('Sorry! The Time Jumper sneezed. Where was I?', 'cool'); }
        const md = glitch > 0 ? 'glitch' : talkT > 0 ? (mood === 'talk' || mood === 'happy' ? 'talk' : mood) : (mood === 'talk' ? 'happy' : mood);
        // background: their room, head shell, then the face screen (drawn at its own 8:5 shape, never stretched)
        const W = cv.width, H = cv.height; const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, k === 'mimi' ? '#ffe4f3' : k === 'lily' ? '#ede9fe' : '#ccfbf1'); gr.addColorStop(1, k === 'mimi' ? '#ffb3da' : k === 'lily' ? '#c4b5fd' : '#5eead4'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
        g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 6; i++) g.fillRect(30 + i * 75, 30 + (i % 2) * 20, 46, 46);
        if (ringing > 0) { g.fillStyle = '#1f2937'; g.font = 'bold 34px system-ui'; g.textAlign = 'center'; g.fillText('📞 Ringing' + '.'.repeat(1 + ((t * 3) | 0) % 3), W / 2, H / 2); return; }
        const bob = Math.sin(t * 2) * 4 + (talkT > 0 ? Math.sin(t * 14) * 2 : 0); const hx = W / 2, hy = H * 0.5 + bob;
        g.fillStyle = k === 'mimi' ? '#ffffff' : k === 'lily' ? '#cfd8e6' : '#cfd8e6'; g.beginPath(); g.ellipse(hx, H + 40, 170, 120, 0, 0, 7); g.fill();
        g.fillStyle = k === 'mimi' ? '#ff4fa0' : k === 'lily' ? '#b9a3ff' : '#5eead4'; g.beginPath(); g.roundRect(hx - 150, hy - 110, 300, 210, 60); g.fill();
        if (k === 'mimi') { g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(hx, hy - 135, 14, 0, 7); g.fill(); g.fillRect(hx - 3, hy - 125, 6, 18); }
        if (k === 'lily') { g.fillStyle = '#7c3aed'; g.beginPath(); g.arc(hx - 120, hy - 95, 30, 0, 7); g.arc(hx + 120, hy - 95, 30, 0, 7); g.fill(); }
        if (k === 'lili') { g.fillStyle = '#fb7185'; g.beginPath(); g.moveTo(hx - 40, hy - 110); g.lineTo(hx, hy - 160); g.lineTo(hx + 40, hy - 110); g.fill(); }
        drawFace(k, F, md, talkT > 0 ? Math.abs(Math.sin(t * 13)) * 0.8 + 0.1 : 0, (t % 3.7) < 0.12, t);
        g.drawImage(face, hx - 128, hy - 80, 256, 160);
        if (glitch > 0) { for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(${(Math.random() * 255) | 0},${(Math.random() * 255) | 0},255,.35)`; g.fillRect(0, Math.random() * H, W, 6 + Math.random() * 18); } g.fillStyle = '#111'; g.font = 'bold 22px monospace'; g.textAlign = 'center'; g.fillText('⚠ TIME JUMPER INTERFERENCE ⚠', W / 2, 40); } };
      loop();
      on(c, '#vH', () => { if (ringing > 0) return; say(callHint(), 'talk'); }); on(c, '#vJ', () => { if (ringing > 0) return; say(rnd(C.jokes), 'happy'); });
      on(c, '#vM', () => { if (ringing > 0) return; const m = { mimi: ['Super! Gus let me run the claw machine today. I only grabbed myself twice!', 'Great! Did you know I was built in the pod on the LEFT? I still have the warranty!'],
        lily: ['Doing fine, dear. The Time Machine only went to 1987 once today.', 'Wonderful. I\'m reorganizing the retro shelf. Alphabetically. By sound effect.'],
        lili: ['Great! The Time Jumper only malfunctioned 4 times. That\'s a record! A bad one!', 'Busy! I\'m putting up posters for things that don\'t exist yet. It\'s my whole job!'] }; say(rnd(m[k]), 'happy'); if (k === 'lili' && Math.random() < 0.35) glitch = 1.4; });
      on(c, '#vB', () => { say('Bye bye! Call again soon!', 'happy'); setTimeout(() => this.done(), 700); }); }, 'callP'); }
  // ---------------- campus map (drawn at the real shape of the campus, never stretched)
  map(g, back) { this.open(); const x0 = -80, x1 = 80, z0 = -120, z1 = 36, W = 540, H = Math.round(W * (z1 - z0) / (x1 - x0));
    panel(`<div class="topBar"><button class="back" id="mBack">◀</button><h2>🗺️ CAMPUS MAP</h2></div><div class="mapWrap"><canvas id="mapC" width="${W}" height="${H}"></canvas></div><p class="sub">You are the pink dot. ⭐ = Executive Suite (glass elevator) ${S.secrets.includes('dome') ? '· 🌵 Desert Dome (freight lift)' : ''}</p>`, (c) => {
      const cv = c.querySelector('#mapC'), x = cv.getContext('2d'); const X = (v) => (v - x0) / (x1 - x0) * W, Z = (v) => (v - z0) / (z1 - z0) * H;
      x.fillStyle = '#8fdc7e'; x.fillRect(0, 0, W, H); x.fillStyle = '#d6d3d1'; x.fillRect(X(-60), Z(-116), X(60) - X(-60), Z(-46) - Z(-116)); x.fillStyle = '#6b7280'; x.fillRect(0, Z(30), W, Z(36) - Z(30));
      const cols = { atrium: '#ffd6ea', obs: '#bae6fd', whall: '#fde68a', ehall: '#fde68a', gadget: '#cbd5e1', goo: '#d9f99d', cafe: '#fed7aa', offices: '#c7d2fe', robo: '#94a3b8', cheese: '#fde047', security: '#e5e7eb', lounge: '#fdba74', dcr: '#fcd34d', tortuga: '#5eead4' };
      for (const r of REGIONS) { if (!cols[r.id]) continue; x.fillStyle = cols[r.id]; x.strokeStyle = '#ff4fa0'; x.lineWidth = 2; x.fillRect(X(r.x0), Z(r.z0), X(r.x1) - X(r.x0), Z(r.z1) - Z(r.z0)); x.strokeRect(X(r.x0), Z(r.z0), X(r.x1) - X(r.x0), Z(r.z1) - Z(r.z0));
        x.fillStyle = '#1f2937'; x.font = 'bold 10px system-ui'; x.textAlign = 'center'; const nm = r.name.replace(/^\S+\s/, ''); x.fillText(nm.length > 16 ? nm.split(' ').slice(-2).join(' ') : nm, (X(r.x0) + X(r.x1)) / 2, (Z(r.z0) + Z(r.z1)) / 2 + 4); }
      x.font = 'bold 13px system-ui'; x.fillStyle = '#7f1d1d'; x.fillText('🚀 TEST YARD', X(0), Z(-104)); x.fillText('⭐', X(7.5), Z(-23)); x.fillStyle = '#1f2937'; x.fillText('🚪 ENTRANCE', X(0), Z(16));
      const me = g.me; if (me.y > -10) { x.fillStyle = '#ff4fa0'; x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.arc(X(me.x), Z(me.z), 7, 0, 7); x.fill(); x.stroke(); } else { x.fillStyle = '#1f2937'; x.fillText('(you are underground!)', W / 2, 20); }
      on(c, '#mBack', () => { if (back) back(); else this.done(); }); }); }
  // ---------------- dress-up locker
  wardrobe() { this.open(); const app = this.app; panel(`<div class="topBar"><button class="back" id="wBack">◀</button><h2>👕 DRESS-UP LOCKER</h2></div><button class="mbtn2" id="wLook">👤 CHANGE HAIR, SKIN &amp; CLOTHES</button><h3>HATS</h3><div class="hats">${HATS.map((h) => `<button data-h="${h.id}" class="${S.outfit === h.id ? 'on' : ''} ${S.hats[h.id] ? '' : 'lock'}"><b>${S.hats[h.id] ? esc(h.n) : '🔒 ' + esc(h.n)}</b><small>${esc(h.how)}</small></button>`).join('')}</div>`, (c) => {
      on(c, '#wLook', () => this.custom(() => this.wardrobe()));
      c.querySelectorAll('[data-h]').forEach((b) => b.onclick = () => { if (!S.hats[b.dataset.h]) { sfx('deny'); return; } S.outfit = b.dataset.h; persist(); sfx('buy'); app.game.me.setOutfit(S.outfit); app.net.online && app.net.sendLook(); this.wardrobe(); });
      on(c, '#wBack', () => this.done()); }); }
  // ---------------- goo mixer (hands-on)
  goo(g) { this.open(); const C = [['pink', '#ff4fa0'], ['blue', '#4f9dff'], ['green', '#4ade80']]; const pick = [0, 0, 0];
    const draw = () => panel(`<h2>🧪 GOO MIXER</h2><p class="sub">Pick 3 goos (tap each jar to change it), then MIX!</p><div class="gooRow">${pick.map((p, i) => `<button class="jar" data-i="${i}" style="--c:${C[p][1]}"><span></span><b>${C[p][0].toUpperCase()}</b></button>`).join('')}</div>
      <div class="btnRow"><button class="mbtn2" id="gX">CANCEL</button><button class="go" id="gMix">🌀 MIX!</button></div>`, (c) => {
      c.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { sfx('click'); pick[+b.dataset.i] = (pick[+b.dataset.i] + 1) % 3; draw(); }); on(c, '#gX', () => this.done());
      on(c, '#gMix', () => { const k = pick.map((p) => C[p][0]).join('-'); const [x, y, z] = g.world.spots.cauldron; this.done();
        if (k === 'pink-blue-pink') { g.fx.burst(x, y + 0.3, z, 0xc084fc, 40, 8); g.fx.confetti(x, y + 1, z, 40); sfx('bounce'); g.toastMsg('✨ BOUNCY GOO! It boings right out of the cauldron!'); g.giveHat('goggles'); g.badge('goo'); if (!S.flags.goo) { S.flags.goo = 1; persist(); g.giveKey('blue'); } }
        else { const r = { 'green-green-green': 'SUPER SLIME. It says "blorp".', 'blue-blue-blue': 'a goo that smells like Mondays.', 'pink-pink-pink': 'bubblegum goo. Do NOT chew it.' }[k] || ['sock-scented goo.', 'goo that hums. Off-key.', 'a goo that is just… sad.', 'glow-in-the-dark pudding?'][(g.T * 7 | 0) % 4];
          g.fx.puff(x, y + 0.4, z, 12, pick[0] === 1 ? 0x93c5fd : pick[0] === 2 ? 0xbef264 : 0xf9a8d4); sfx('splat'); g.toastMsg('🧪 You made ' + r + ' Check the whiteboard!'); } }); });
    draw(); }
  taste(g) { this.open(); const T = [['🧀 Cheddar-Mint', 'Tastes like brushing your teeth with a sandwich. Refreshing?'], ['🍌 Blue Banana', 'It\'s blue. It\'s banana. Your tail is now slightly blue.'], ['❓ Mystery Cheese #7', 'It\'s… regular cheese. The mystery is why it\'s called #7.']];
    panel(`<h2>👅 TASTE TEST</h2><p class="sub">Dr. Brie's experimental cheeses. Try one!</p><div class="menu">${T.map((t, i) => `<button class="mbtn2" data-i="${i}">${t[0]}${S.flags['taste' + i] ? ' ✓' : ''}</button>`).join('')}</div><button class="go" id="tX">DONE</button>`, (c) => {
      c.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { const i = +b.dataset.i; sfx('cheese'); S.flags['taste' + i] = 1; persist(); g.toastMsg(T[i][0] + ': ' + T[i][1]); if (S.flags.taste0 && S.flags.taste1 && S.flags.taste2) g.badge('taste'); this.done(); });
      on(c, '#tX', () => this.done()); }); }

  tortugaLab(g, tab = 'chambers', focusChamber = 'crush', lastMsg = '') {
    this.open();
    const tt = ensureTT();
    const activeG = CROSSOVER_GADGETS.find((x) => x.id === tt.activeGadget) || CROSSOVER_GADGETS[0];
    const doneCount = (tt.tests.crush ? 1 : 0) + (tt.tests.plasma ? 1 : 0) + (tt.tests.crash ? 1 : 0);
    const statusCls = tt.damaged ? 'ttStatusBad' : 'ttStatusOk';
    const statusTxt = tt.damaged
      ? `⚠️ DAMAGED (${tt.integrity}% Integrity) — ${tt.brokenGadget || activeG.name} cracked! (-24% speed & sparks until welded at Repair Bench)`
      : `🛡️ SHELL-TOUGH READY (${tt.integrity}% Integrity) — Equipped: ${activeG.icon} ${activeG.name}`;

    let bodyHtml = '';
    if (tab === 'chambers') {
      const cards = ['crush', 'plasma', 'crash'].map((k) => {
        const ch = CHAMBER_INFO[k];
        const passed = (tt.tests[k] | 0) > 0;
        const sel = focusChamber === k ? 'ttCardSel' : '';
        return `<div class="ttCard ${sel}">
          <div class="ttCardHead"><b>${ch.icon} ${ch.title}</b> <span class="ttBadge ${passed ? 'ok' : ''}">${passed ? '✅ CERTIFIED (' + tt.tests[k] + 'x)' : '⏳ UNTESTED'}</span></div>
          <div class="ttSub">Operator: <b>${ch.pet}</b> · Load: <b>${ch.hazard}</b></div>
          <p class="ttDesc">${ch.desc}</p>
          <div class="row ttBtnRow">
            <button class="mbtn sm" data-run="${k}">🛡️ Standard Shell Test (+Scrap)</button>
            <button class="mbtn2 sm ttDangerBtn" data-over="${k}">⚡ Over-Charge Stress Test (Risk Crash!)</button>
          </div>
        </div>`;
      }).join('');
      bodyHtml = `<div class="ttGrid">${cards}</div>`;
    } else if (tab === 'gadgets') {
      const gCards = CROSSOVER_GADGETS.map((item) => {
        const owned = !!tt.gadgets[item.id];
        const eq = tt.activeGadget === item.id;
        return `<div class="ttCard ${eq ? 'ttCardSel' : ''}">
          <div class="ttCardHead"><b>${item.icon} ${item.name}</b> <span class="ttBadge ${eq ? 'ok' : ''}">${eq ? 'EQUIPPED' : owned ? 'BUILT' : item.cost + ' 🔩'}</span></div>
          <div class="ttSub"><b>${item.perk}</b></div>
          <p class="ttDesc">${item.desc}</p>
          <div class="row ttBtnRow">
            ${eq ? '<button class="mbtn2 sm" disabled>✓ Equipped on Rig</button>' : owned ? `<button class="mbtn sm" data-eq="${item.id}">Equip Gadget</button>` : `<button class="mbtn sm" data-buy="${item.id}">🔧 Fabricate (${item.cost} 🔩)</button>`}
          </div>
        </div>`;
      }).join('');
      bodyHtml = `<div class="ttGrid">${gCards}</div>`;
    } else {
      bodyHtml = `<div class="ttRepairBox">
        <h3>🔧 Plato's Shell-Armor Weld & Repair Bench</h3>
        <p class="ttDesc">Over-charged a test chamber or got clipped by the 50-Ton Crush Press? Cracked shell rigs suffer a <b>-24% move speed penalty</b> and emit warning sparks until welded back to 100% integrity. You are <b>never stuck</b>: use Scrap Bolts, grab free spare bolts from the bin, or trigger Tortuga Tech's Free Emergency Warranty Weld!</p>
        <div class="ttStatsRow">
          <span>🛡️ Integrity: <b>${tt.integrity}%</b></span>
          <span>🔩 Scrap Bolts: <b>${tt.scrap}</b></span>
          <span>💥 Total Crashes: <b>${tt.crashes | 0}</b></span>
          <span>🔧 Repairs Completed: <b>${tt.repairs | 0}</b></span>
        </div>
        <div class="row ttBtnRow">
          <button class="mbtn sm" id="ttWeldBolts">🔧 Precision Scute Weld (20 🔩 Bolts)</button>
          <button class="mbtn2 sm" id="ttWeldFree">🛡️ Emergency Warranty Weld (FREE)</button>
          <button class="mbtn2 sm" id="ttGrabScrap">♻️ Grab Free Spare Bolts (+30 🔩)</button>
        </div>
      </div>`;
    }

    panel(`<h2>🐢 TORTUGA TECH INC. — SHELL-TOUGH LAB</h2>
      <div class="ttStatusBar ${statusCls}">${statusTxt}</div>
      <div class="ttMetaRow">
        <span>🔩 Scrap Bolts: <b>${tt.scrap}</b></span>
        <span>🏛️ Chambers Certified: <b>${doneCount}/3</b></span>
        <span>🐾 Crew: <b>Torty, Luna, Pi-rat, Snowie & Candy</b></span>
      </div>
      ${lastMsg ? `<div class="ttMsgBanner">${esc(lastMsg)}</div>` : ''}
      <div class="row ttTabs">
        <button class="mbtn2 sm ${tab === 'chambers' ? 'active' : ''}" id="ttTabCh">🧪 Test Chambers (3)</button>
        <button class="mbtn2 sm ${tab === 'gadgets' ? 'active' : ''}" id="ttTabGa">⚙️ Crossover Gadgets (4)</button>
        <button class="mbtn2 sm ${tab === 'repair' ? 'active' : ''}" id="ttTabRe">🔧 Weld & Repair Bench ${tt.damaged ? '⚠️' : ''}</button>
      </div>
      ${bodyHtml}
      <div class="row" style="margin-top:10px">
        <button class="mbtn2 sm" id="ttTeleportHub">🐢 Warp to Torty's Desk</button>
        <button class="mbtn2 sm" id="ttTeleportCh">🧪 Warp to Chambers</button>
        <button class="mbtn sm" id="ttClose">Done</button>
      </div>`, (c) => {
      c.querySelector('#ttTabCh').onclick = () => { sfx('click'); this.tortugaLab(g, 'chambers', focusChamber); };
      c.querySelector('#ttTabGa').onclick = () => { sfx('click'); this.tortugaLab(g, 'gadgets', focusChamber); };
      c.querySelector('#ttTabRe').onclick = () => { sfx('click'); this.tortugaLab(g, 'repair', focusChamber); };
      c.querySelector('#ttClose').onclick = () => { sfx('click'); this.done(); };
      c.querySelector('#ttTeleportHub').onclick = () => { sfx('click'); this.done(); if (g) g.goToTortuga('hub'); };
      c.querySelector('#ttTeleportCh').onclick = () => { sfx('click'); this.done(); if (g) g.goToTortuga('chambers'); };

      c.querySelectorAll('[data-run]').forEach((b) => {
        b.onclick = () => {
          const k = b.getAttribute('data-run');
          const res = g ? g.runChamberTest(k, false) : { ok: true, msg: 'Test complete!' };
          this.tortugaLab(g, res.reason === 'damaged' ? 'repair' : 'chambers', k, res.msg);
        };
      });
      c.querySelectorAll('[data-over]').forEach((b) => {
        b.onclick = () => {
          const k = b.getAttribute('data-over');
          const res = g ? g.runChamberTest(k, true) : { ok: false, msg: 'Over-Charge crash!' };
          this.tortugaLab(g, 'repair', k, res.msg);
        };
      });
      c.querySelectorAll('[data-buy]').forEach((b) => {
        b.onclick = () => {
          const id = b.getAttribute('data-buy');
          const item = CROSSOVER_GADGETS.find((x) => x.id === id);
          if (!item) return;
          if ((tt.scrap | 0) < item.cost) {
            sfx('deny');
            this.tortugaLab(g, 'gadgets', focusChamber, `Need ${item.cost} Scrap Bolts! Run chamber tests or grab free bolts at the Repair Bench.`);
            return;
          }
          tt.scrap -= item.cost;
          tt.gadgets[id] = 1;
          tt.activeGadget = id;
          if ((S.q.tortuga | 0) < 2) S.q.tortuga = 2;
          persist(); sfx('win');
          if (g) { g.hud.dirty = true; g.toastMsg(`⚙️ Fabricated & equipped ${item.name}!`); }
          this.tortugaLab(g, 'gadgets', focusChamber, `🎉 Fabricated & equipped ${item.icon} ${item.name}!`);
        };
      });
      c.querySelectorAll('[data-eq]').forEach((b) => {
        b.onclick = () => {
          const id = b.getAttribute('data-eq');
          const item = CROSSOVER_GADGETS.find((x) => x.id === id);
          tt.activeGadget = id;
          persist(); sfx('click');
          if (g) g.hud.dirty = true;
          this.tortugaLab(g, 'gadgets', focusChamber, `Equipped ${item ? item.name : id}!`);
        };
      });
      const wb = c.querySelector('#ttWeldBolts');
      if (wb) wb.onclick = () => {
        const res = g ? g.repairShellRig('bolts') : { msg: 'Repaired!' };
        this.tortugaLab(g, 'repair', focusChamber, res.msg);
      };
      const wf = c.querySelector('#ttWeldFree');
      if (wf) wf.onclick = () => {
        const res = g ? g.repairShellRig('free') : { msg: 'Repaired!' };
        this.tortugaLab(g, 'repair', focusChamber, res.msg);
      };
      const gs = c.querySelector('#ttGrabScrap');
      if (gs) gs.onclick = () => {
        if (g) g.claimScrapBin();
        this.tortugaLab(g, 'repair', focusChamber, '🔩 Grabbed +30 Free Spare Scrap Bolts from the recycling bin!');
      };
    }, 'ttPanel');
  }

}
