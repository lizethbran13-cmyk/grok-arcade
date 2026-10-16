// Grok Ruffsources HQ - menus: title, look editor, how to play, journal (pause), clue cards, clue board, mini-game launcher.
import { $, esc } from './util.js?v=rs6';
import { S, persist, resetSave } from './save.js?v=rs6';
import { sfx, setSound } from './audio.js?v=rs6';
import { panel, closePanel, on } from './uikit.js?v=rs6';
import { SKINS, HAIRS, HAIR_COLS, SHIRTS, PANTS, cleanLook } from './humans.js?v=rs6';
import { CLUES, SUSPECTS, goal } from './story.js?v=rs6';
import { GAMES } from './mg.js?v=rs6';
import { BONES, NAPS } from './game.js?v=rs6';
const hex = (c) => '#' + c.toString(16).padStart(6, '0');
export class UI {
  constructor(app) { this.app = app; }
  get g() { return this.app.game; }
  title() { const app = this.app; const ui = $('ui'); ui.classList.add('open'); app.preview = false; ui.innerHTML = `<div class="title">
      <div class="logo"><span class="l0">GROK</span><span class="l1">RUFFSOURCES</span><span class="l2">HQ</span></div>
      <p class="tag">Start your first day at Ruffsources, the HR department Ratita Industries AND Tortuga Tech can't live without. Sort the mail, interview new hires... and find Candy's missing squeaky toy!</p>
      <div class="tBtns"><button class="go" id="tPlay">▶ ${S.made ? 'BACK TO WORK' : 'START YOUR FIRST DAY'}</button><button class="mbtn2" id="tLook">👤 YOUR LOOK</button><button class="mbtn2" id="tOpts">⚙️ OPTIONS</button></div>
      <p class="foot">A Grok game · Candy, Torty, Luna, Pi-rat & Snowie</p></div>`;
    on(ui, '#tPlay', () => { if (!S.made) return this.custom(() => app.play(), true); app.play(); }); on(ui, '#tLook', () => this.custom(() => this.title())); on(ui, '#tOpts', () => this.options(() => this.title())); }
  custom(done, first) { const app = this.app; app.preview = true; const L = S.look = cleanLook(S.look);
    const row = (k, arr, txt) => `<div class="swRow">${arr.map((c, i) => txt ? `<button data-k="${k}" data-i="${i}" class="txt ${L[k] === i ? 'on' : ''}">${c}</button>` : `<button data-k="${k}" data-i="${i}" class="${L[k] === i ? 'on' : ''}" style="background:${hex(c)}"></button>`).join('')}</div>`;
    panel(`<h2>👤 ${first ? 'NEW HIRE BADGE' : 'YOUR LOOK'}</h2><h3>NAME</h3><input id="cName" maxlength="12" value="${esc(S.name || '')}" placeholder="Your name">
      <h3>SKIN</h3>${row('skin', SKINS)}<h3>HAIR</h3>${row('hair', HAIRS, true)}${row('hairC', HAIR_COLS)}<h3>SHIRT</h3>${row('shirt', SHIRTS)}<h3>PANTS</h3>${row('pants', PANTS)}
      <button class="go" id="cOk">${first ? '🐾 CLOCK IN!' : 'DONE'}</button>`, (c) => {
      c.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => { sfx('click'); L[b.dataset.k] = +b.dataset.i; S.look = L; persist(); app.game.refreshMe(); this.custom(done, first); });
      on(c, '#cOk', () => { S.name = String(c.querySelector('#cName').value || '').slice(0, 12); S.made = true; persist(); app.game.refreshMe(); app.preview = false; done(); }); }, 'custP'); }
  options(back) { panel(`<h2>⚙️ OPTIONS</h2><div class="seg"><button id="oS" class="${S.opts.sound ? 'on' : ''}">🔊 Sound</button><button id="oM" class="${S.opts.music ? 'on' : ''}">🎵 Music</button></div>
      <p class="sub">Graphics are always on full: Turbo engine with soft shadows, ambient occlusion and bloom. The game sharpens itself automatically when your phone has speed to spare.</p>
      <button class="mbtn2 sm danger" id="oR">Reset save</button><button class="go" id="oB">BACK</button>`, (c) => {
      on(c, '#oS', () => { S.opts.sound = !S.opts.sound; persist(); setSound(S.opts.sound, S.opts.music); this.options(back); }); on(c, '#oM', () => { S.opts.music = !S.opts.music; persist(); setSound(S.opts.sound, S.opts.music); this.options(back); });
      on(c, '#oR', () => { if (confirm('Reset your Ruffsources save?')) { resetSave(); location.reload(); } }); on(c, '#oB', back); }); }
  how(done) { panel(`<h2>🐾 FIRST DAY!</h2><div class="how"><p>🕹️ Left thumb: walk (push far to run). Drag anywhere else to look around.</p><p>👉 Walk up to people, pets and glowing jobs, then tap the yellow button.</p><p>🏢 Every building is walk-in: Ruffsources HQ (6 rooms), Ratita Industries, Tortuga Tech and Bark & Brew.</p><p>🦴 Find ${BONES.length} Golden Bones, and spot Candy napping in 6 places.</p><p>⏸️ The top-right button opens your journal.</p></div><button class="go" id="hOk">LET'S GO!</button>`, (c) => on(c, '#hOk', () => { S.seenHow = true; persist(); done(); })); }
  pause() { const app = this.app; app.busy = true; const nC = Object.keys(S.clues).length;
    const job = (e, n, k) => `<div class="upRow"><span class="ic">${e}</span><div><b>${n}</b><br><small>best ${S.best[k] || 0}</small></div></div>`;
    panel(`<h2>📒 JOURNAL</h2><p class="sub">⭐ ${esc(goal())}</p>
      <div class="statGrid"><div><b>${S.bones.length}/${BONES.length}</b><small>🦴 Golden Bones</small></div><div><b>${S.naps.length}/6</b><small>💤 Naps spotted</small></div><div><b>${nC}/5</b><small>🔍 Clues</small></div><div><b>${S.hired}</b><small>🤝 Hired</small></div></div>
      <h3>JOBS</h3>${job('📬', 'Mail Sort (Mail Room)', 'mail')}${job('☕', 'Snack Orders (Break Room)', 'snack')}${job('🗂️', 'File It! (Archive)', 'file')}${job('🔧', 'Gadget Returns (Ratita)', 'gadget')}${job('🐢', 'Drop Tower (Tortuga Tech)', 'drop')}${job('☕', 'Pupuccino Pour (Bark & Brew)', 'pour')}
      <h3>BADGES</h3><p class="sub">${[['detective', '🕵️ Squeak Detective'], ['naps', '💤 Nap Spotter'], ['bones', '🦴 Bone Collector'], ['hr', '🤝 Great Hires']].map(([k, n]) => `<span class="badge ${S.badges[k] ? 'on' : ''}">${n}</span>`).join(' ')}</p>
      <div class="btnRow"><button class="go" id="pR">▶ RESUME</button></div><div class="btnRow"><button class="mbtn2 sm" id="pL">👤 Look</button><button class="mbtn2 sm" id="pO">⚙️ Options</button><button class="mbtn2 sm" id="pT">🏠 Title</button></div>`, (c) => {
      on(c, '#pR', () => app.resume()); on(c, '#pL', () => this.custom(() => this.pause())); on(c, '#pO', () => this.options(() => this.pause())); on(c, '#pT', () => app.toTitle()); }); }
  clueCard(cl, n) { const app = this.app; app.busy = true; panel(`<h2>🔍 CLUE ${n}/5</h2><p class="sub">${esc(cl.room)}</p><p class="clueTx"><b>${esc(cl.title)}</b><br>${esc(cl.text)}</p>${n >= 5 ? '<p class="sub">That\'s every clue! Pin the culprit on the clue board in Candy\'s office.</p>' : ''}<button class="go" id="cc">GOT IT</button>`, (c) => on(c, '#cc', () => app.resume())); }
  clueBoard() { const app = this.app; app.busy = true; const have = CLUES.filter((c) => S.clues[c.id]);
    panel(`<h2>📌 CLUE BOARD</h2><p class="sub">Who took Candy's squeaky toy?</p>${have.map((c) => `<div class="upRow"><span class="ic">📎</span><div><b>${esc(c.title)}</b><br><small>${esc(c.text)}</small></div></div>`).join('') || '<p class="sub">No clues pinned yet.</p>'}
      ${S.mys === 1 ? `<h3>ACCUSE</h3><div class="hats">${SUSPECTS.map((s) => `<button class="hat" data-s="${s.id}">${esc(s.name)}<small>${esc(s.why)}</small></button>`).join('')}</div>${have.length < 3 ? '<p class="sub">Tip: find at least 3 clues first!</p>' : ''}` : '<p class="sub">Case closed! (Or nearly.)</p>'}
      <button class="mbtn2" id="cb">CLOSE</button>`, (c) => { c.querySelectorAll('[data-s]').forEach((b) => b.onclick = () => { sfx('click'); app.resume(); this.g.accuse(b.dataset.s); }); on(c, '#cb', () => app.resume()); }); }
  minigame(id, done) { GAMES[id](done); }
}
