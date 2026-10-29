/* Grok Land Party - FIESTA FITS wardrobe (live 3D preview) + in-game party bar (dances, confetti cannon, party horn) */
(function () {
'use strict';
const GP = window.GP, FF = GP.FF, T = THREE, $ = GP.$, esc = GP.esc, B = GP.FFbind; if (!FF || !B) return;
const Snd = GP.Snd;
FF.chip = (f) => { f = FF.clean(f); if (!f) return ''; const s = f.s && FF.SKINS.find((x) => x.id === f.s), h = f.h && FF.HATS.find((x) => x.id === f.h); return '<b class="ffChip">' + (s ? s.icon : '') + (h ? h.icon : '') + '</b>'; };
const arcadeUrl = () => (window.GrokNet && GrokNet.hubUrl ? GrokNet.hubUrl() : 'https://lizethbran13-cmyk.github.io/grok-arcade/');
function myColor() { return GP.colorNum(GP.save.color || '#ff4fd8'); }
function cur() { return Object.assign({ s: '', h: '', t: '' }, GP.save.fit || {}); }

/* ---------- DOM ---------- */
const W = document.createElement('div'); W.id = 'ffWard'; W.className = 'screen top hidden';
W.innerHTML = '<div class="card ffw"><div class="ffHead"><h2>\ud83d\udc55 FIESTA FITS</h2><button class="rbtn ffX" type="button" aria-label="Close">\u2715</button></div>' +
  '<div class="ffStage"><canvas id="ffCv"></canvas><div id="ffName"></div></div>' +
  '<div class="ffTabs" id="ffTabs"></div><div class="ffGrid" id="ffGrid"></div><div id="ffNote" class="ffNote"></div></div>';
document.body.appendChild(W);
const bar = document.createElement('div'); bar.id = 'ffBar'; bar.className = 'hidden'; document.body.appendChild(bar);
const pbtn = document.createElement('button'); pbtn.id = 'ffParty'; pbtn.type = 'button'; pbtn.className = 'rbtn hidden'; pbtn.setAttribute('aria-label', 'Party moves'); pbtn.textContent = '\ud83c\udf89';
const top = $('topbtns'); top.insertBefore(pbtn, top.firstChild);
function addBtn(afterId, id, cls) { const ref = $(afterId); if (!ref) return null; const b = document.createElement('button'); b.id = id; b.type = 'button'; b.className = cls; ref.parentNode.insertBefore(b, ref.nextSibling); return b; }
const tBtn = addBtn('colorRow', 'bFits', 'ffT'); const mBtn = addBtn('bHelp', 'bFitsMenu', 'btn gold');
const lRow = document.querySelector('#scrLobby .btnrow'); const lBtn = document.createElement('button'); lBtn.id = 'bFitsLobby'; lBtn.type = 'button'; lBtn.className = 'btn gold small'; lBtn.textContent = '\ud83d\udc55 FIESTA FITS'; if (lRow) lRow.parentNode.insertBefore(lBtn, lRow);
function labels() { const own = FF.owned(); if (tBtn) tBtn.innerHTML = '\ud83d\udc55 FIESTA FITS' + (own ? '' : ' <span class="ffDlc">DLC</span>'); if (mBtn) mBtn.innerHTML = '\ud83d\udc55 FIESTA FITS'; lBtn.classList.toggle('hidden', !own); }
labels();

/* ---------- preview renderer (its own small canvas) ---------- */
let R = null, scene, cam, hero = null, heroSig = '', open = false, tab = 'skins', last = 0, ang = 0, pvMove = '';
function ensureR() {
  if (R) return;
  const cv = $('ffCv');
  R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  scene = new T.Scene(); cam = new T.PerspectiveCamera(36, 1.4, 0.1, 50);
  scene.add(new T.HemisphereLight(0xffffff, 0xb08ad0, 0.62)); const d = new T.DirectionalLight(0xffffff, 0.85); d.position.set(3, 6, 5); scene.add(d); const d2 = new T.DirectionalLight(0xffc8f0, 0.3); d2.position.set(-4, 2, -3); scene.add(d2);
  const fl = new T.Mesh(new T.CylinderGeometry(2.1, 2.2, 0.2, 40), GP.mat(0xffe3f6)); fl.position.y = -0.1; scene.add(fl);
  const rim = new T.Mesh(new T.TorusGeometry(2.15, 0.06, 8, 48), GP.basic(0xff4fd8)); rim.rotation.x = Math.PI / 2; scene.add(rim);
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, b = new T.Mesh(GP.G.sphereLo, GP.basic([0xff4fd8, 0x3ff0ff, 0xffe14d, 0x4ade80][k % 4])); b.scale.setScalar(0.09); b.position.set(Math.cos(a) * 2.15, 0.02, Math.sin(a) * 2.15); scene.add(b); }
}
function size() { const cv = $('ffCv'), w = Math.max(200, cv.parentNode.clientWidth), h = Math.round(Math.min(260, Math.max(180, window.innerHeight * 0.3))); R.setSize(w, h, false); cv.style.width = w + 'px'; cv.style.height = h + 'px'; cam.aspect = w / h; cam.updateProjectionMatrix(); }
function rebuild(f) {
  const sig = FF.sig(FF.clean(f)) + '|' + myColor();
  if (sig === heroSig && hero) return; heroSig = sig;
  if (hero) scene.remove(hero.root);
  hero = GP.buildHero(myColor(), FF.clean(f)); FF.tag(hero, 'pv', myColor()); scene.add(hero.root);
}
function loop(now) {
  if (!open) return; requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  const f = Object.assign(cur(), pvFit || {}); rebuild(f);
  const running = tab === 'trails' && !FF.busy('pv');
  if (running) { ang += dt * 1.6; hero.root.position.set(Math.cos(ang) * 1.15, 0, Math.sin(ang) * 1.15); hero.root.rotation.y = -ang; }
  else { hero.root.position.lerp(new T.Vector3(0, 0, 0), Math.min(1, dt * 6)); pvT += dt; hero.root.rotation.y = FF.busy('pv') ? GP.angLerp(hero.root.rotation.y, 0.35, Math.min(1, dt * 6)) : GP.angLerp(hero.root.rotation.y, Math.sin(pvT * 0.7) * 1.25, Math.min(1, dt * 4)); }
  GP.poseHero(hero, running ? 'run' : 'idle', dt, 3);
  const wide = tab === 'trails' || (tab === 'moves' && (pvMove === 'cannon' || pvMove === 'spin'));
  cam.position.set(0, wide ? 2.5 : 1.6, wide ? 5.4 : 4.1); cam.lookAt(0, wide ? 1.0 : 1.05, 0);
  R.render(scene, cam);
}
let pvFit = null, pvT = 0;

/* ---------- wardrobe ---------- */
const TABS = [['skins', 'SKINS'], ['hats', 'HATS'], ['trails', 'TRAILS'], ['moves', 'MOVES']];
function list() { return tab === 'skins' ? FF.SKINS : tab === 'hats' ? FF.HATS : tab === 'trails' ? FF.TRAILS : FF.MOVES; }
const key = () => (tab === 'skins' ? 's' : tab === 'hats' ? 'h' : 't');
function draw() {
  const own = FF.owned(), f = cur();
  $('ffTabs').innerHTML = TABS.map(([id, n]) => '<button type="button" data-tab="' + id + '" class="' + (tab === id ? 'on' : '') + '">' + n + '</button>').join('');
  let h = '';
  if (tab !== 'moves') h += '<button type="button" class="ffItem' + (!f[key()] ? ' on' : '') + '" data-v=""><i>' + (tab === 'skins' ? '\ud83e\udde2' : tab === 'hats' ? '\ud83d\udeab' : '\u2796') + '</i><span>' + (tab === 'skins' ? 'Classic' : 'None') + '</span></button>';
  h += list().map((x) => '<button type="button" class="ffItem' + (tab !== 'moves' && f[key()] === x.id ? ' on' : '') + (own ? '' : ' lk') + '" data-v="' + x.id + '"><i>' + x.icon + '</i><span>' + esc(x.name) + '</span></button>').join('');
  $('ffGrid').innerHTML = h;
  const sk = FF.SKINS.find((x) => x.id === f.s);
  $('ffName').textContent = tab === 'moves' ? 'Tap a move to try it!' : (sk ? sk.name : 'Classic') + (f.h ? ' + ' + FF.HATS.find((x) => x.id === f.h).name : '') + (f.t ? ' + ' + FF.TRAILS.find((x) => x.id === f.t).name + ' trail' : '');
  $('ffNote').innerHTML = own
    ? (tab === 'moves' ? 'In a party, tap <b>\ud83c\udf89</b> (top right) to dance, fire the <b>confetti cannon</b> or toot the <b>party horn</b>. Everyone in the room sees it! Keys: 6-9 dances, C cannon, H horn.' : 'Your outfit shows on the board, in mini games, in Fiesta Mode and on the podium. Online friends see it too!')
    : '\ud83d\udd12 <b>Fiesta Fits</b> is a Mini Pack DLC. Try everything on here, then unlock it in the <b>Grok Arcade DLC Shop</b> for 25 \ud83c\udf9f\ufe0f.<br><a class="btn primary small ffGo" href="' + esc(arcadeUrl()) + '">GO TO THE ARCADE</a>';
}
function openW() { ensureR(); W.classList.remove('hidden'); open = true; pvFit = null; pvMove = ''; draw(); size(); heroSig = ''; last = performance.now(); requestAnimationFrame(loop); Snd.init(); }
function closeW() { W.classList.add('hidden'); open = false; pvFit = null; }
FF.openWardrobe = openW; FF.closeWardrobe = closeW;
W.addEventListener('click', (e) => {
  if (e.target.closest('.ffX') || e.target === W) { closeW(); return; }
  const tb = e.target.closest('[data-tab]'); if (tb) { tab = tb.dataset.tab; pvFit = null; draw(); Snd.fx('select'); return; }
  const it = e.target.closest('.ffItem'); if (!it) return;
  const v = it.dataset.v;
  if (tab === 'moves') { pvMove = v; FF.start('pv', v); return; }
  if (!FF.owned()) { pvFit = Object.assign(cur(), { [key()]: v }); $('ffName').textContent = '\ud83d\udd12 Preview: ' + (list().find((x) => x.id === v) || { name: 'Classic' }).name; Snd.fx('select'); if (tab === 'trails') FF.trailNow(hero); return; }
  const f = cur(); f[key()] = v; GP.save.fit = f; GP.persist(); pvFit = null; draw(); Snd.fx('ffEquip');
  if (GP.pushFit) GP.pushFit();
});
if (tBtn) tBtn.onclick = openW; if (mBtn) mBtn.onclick = openW; lBtn.onclick = openW;
addEventListener('resize', () => { if (open) size(); });

/* ---------- party bar ---------- */
bar.innerHTML = FF.MOVES.map((m) => '<button type="button" data-m="' + m.id + '"><i>' + m.icon + '</i><span>' + esc(m.name) + '</span></button>').join('');
let barOpen = false, lastUse = 0;
function use(id) { const now = performance.now(); if (now - lastUse < 1250) return; lastUse = now; B.doAct({ k: 'party', v: id }); const b = bar.querySelector('[data-m="' + id + '"]'); if (b) { b.classList.add('go'); setTimeout(() => b.classList.remove('go'), 400); } }
bar.addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (b) use(b.dataset.m); });
pbtn.onclick = () => { barOpen = !barOpen; Snd.init(); Snd.fx('select'); sync(); };
function canParty() {
  const S = B.S_(); if (!S || !FF.owned() || B.GS.menu) return false;
  if (S.pl.findIndex((p) => p.pid === B.GS.pid) < 0) return false;
  return (S.mode === 'board' && !!B.BOARD_PHASES[S.phase] && S.phase !== 'intro') || (S.phase === 'final' && !!S.final) || (S.mode === 'fiesta' && S.phase === 'roam');
}
function sync() { const ok = canParty(); pbtn.classList.toggle('hidden', !ok); pbtn.classList.toggle('on', ok && barOpen); bar.classList.toggle('hidden', !(ok && barOpen)); }
setInterval(() => { sync(); labels(); }, 250);
addEventListener('keydown', (e) => {
  if (!canParty() || e.repeat || /INPUT|TEXTAREA/.test((e.target && e.target.tagName) || '')) return;
  const m = { Digit6: 'disco', Digit7: 'robot', Digit8: 'floss', Digit9: 'spin', KeyC: 'cannon', KeyH: 'horn' }[e.code]; if (m) { e.preventDefault(); use(m); }
});
addEventListener('storage', (e) => { if (e.key === FF.KEY || e.key === 'grokDLC.owned') { labels(); if (GP.pushFit) GP.pushFit(); if (open) draw(); } });
window.__fits = { open: openW, close: closeW, use, canParty, bar: () => !bar.classList.contains('hidden'), tab: (t) => { tab = t; draw(); }, pick: (v) => { const it = $('ffGrid').querySelector('[data-v="' + v + '"]'); if (it) it.click(); } };
})();
