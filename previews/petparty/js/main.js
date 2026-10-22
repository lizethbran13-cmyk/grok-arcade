// Grok Pet Party: flow (title, setup, online room, show phases), HUD, saves, networking glue.
import * as THREE from 'three';
import { E, initEngine, disposeTree } from './engine.js';
import { Studio, GUESTS } from './stage.js';
import { GAMES, FINAL, gameById } from './games.js';
import { CHARS, charById, G, mat } from './models.js';
import { initInput, readInput } from './input.js';
import { sfx, JINGLE, unlock, A } from './audio.js';
import { $, esc, toast, shuffle, clamp } from './util.js';
import { sky } from './props.js';

const GN = window.GrokNet;
const COLORS = ['#ff4fd8', '#3ff0ff', '#ffe14d', '#4ade80'];
const SKEY = 'grokPetParty.v1';
const S = Object.assign({ name: '', char: 'luna', len: 5, tickets: 0, trophies: 0, parties: 0, medals: {}, last: [] }, (() => { try { return JSON.parse(localStorage.getItem(SKEY)) || {}; } catch (e) { return {}; } })());
const save = () => { try { localStorage.setItem(SKEY, JSON.stringify(S)); } catch (e) {} };
const P = { mode: 'solo', roster: [], order: [], round: 0, stars: [], ph: 'title', phT: 0, d: {}, game: null, local: 0, room: null, inputs: {}, paused: false, lineI: -1 };
let studio, confetti;

/* ---------------- boot ---------------- */
initEngine($('c')); initInput();
studio = new Studio(); E.scene.add(studio.grp); makeConfetti(); showStudio();
E.frameCb = frame;
$('loading').classList.add('gone');
title();
addEventListener('pointerdown', unlock, { once: true });

function showStudio() { sky(E.scene, '#120a2a', '#3a1a6a'); E.scene.fog = new THREE.Fog('#1a0f3a', 30, 70); studio.grp.visible = true; E.shadowDirty = 2; }
function makeConfetti() { const n = 180; confetti = new THREE.InstancedMesh(G.plane(), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: '#ffffff' }), n); confetti.userData.p = [];
  const cols = ['#ff3fb4', '#ffd23f', '#16c79a', '#3ff0ff', '#a78bfa', '#ff7a3d'], c = new THREE.Color(); for (let i = 0; i < n; i++) { confetti.setColorAt(i, c.set(cols[i % 6])); confetti.userData.p.push([0, -99, 0, 0, Math.random() * 6]); } confetti.count = 0; E.scene.add(confetti); }
function burst(x, y, z) { const p = confetti.userData.p; p.forEach((q) => { q[0] = x + (Math.random() - 0.5) * 10; q[1] = y + Math.random() * 6; q[2] = z + (Math.random() - 0.5) * 6; q[3] = 0.6 + Math.random(); }); confetti.count = p.length; }
function stepConfetti(dt) { if (!confetti.count) return; const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(0.14, 0.09, 1), v = new THREE.Vector3(), e = new THREE.Euler(); let alive = 0;
  confetti.userData.p.forEach((p, i) => { p[1] -= p[3] * dt * 1.6; p[4] += dt * 5; if (p[1] > -0.2) alive++; q.setFromEuler(e.set(p[4], p[4] * 0.7, 0)); confetti.setMatrixAt(i, m.compose(v.set(p[0] + Math.sin(p[4]) * 0.2, p[1], p[2]), q, s)); });
  confetti.instanceMatrix.needsUpdate = true; if (!alive) confetti.count = 0; }

/* ---------------- screens ---------------- */
function ui(html, cls = '') { const u = $('ui'); u.innerHTML = html ? `<div class="screen ${cls}">${html}</div>` : ''; u.classList.toggle('open', !!html); return u.firstChild; }
function hud(on) { $('hud').classList.toggle('hidden', !on); $('touch').classList.toggle('hidden', !on); }
function title() {
  leaveGame(); P.ph = 'title'; hud(false); bubble(); showStudio(); studio.camShot('wide'); studio.setRoster(CHARS.slice(0, 4).map((c, i) => ({ name: c.n, char: c.id, color: COLORS[i] })), [0, 0, 0, 0]); studio.drawScreen('GROK PET PARTY', 'LIVE on Tortuga TV · tonight!');
  const el = ui(`<div class="logo">GROK<br><b>PET PARTY</b></div><div class="live">● LIVE on <b>TORTUGA TV</b></div>
    <p class="sub">The party game show for 1–4 players! 7 mini-games + the Grand Final.<br>Sponsored by <b class="rat">Ratita Industries</b> &amp; <b class="tor">Tortuga Tech</b></p>
    <button class="go" id="bSolo">🎉 PLAY (you + party bots)</button><button class="go alt" id="bOnline">🌐 PLAY ONLINE (room code)</button>
    <button class="mini" id="bShelf">🏆 Trophy shelf · 🎟️ ${S.tickets}</button>`, 'title');
  el.querySelector('#bSolo').onclick = () => setup('solo'); el.querySelector('#bOnline').onclick = () => setup('online'); el.querySelector('#bShelf').onclick = shelf;
}
function shelf() { const m = GAMES.map((g) => `<div class="row">${g.ic} ${g.n}<span>${'🥇'.repeat(Math.min(5, S.medals[g.id] || 0)) || '—'}</span></div>`).join('');
  const el = ui(`<h2>🏆 TROPHY SHELF</h2><div class="big">👑 Party Champ trophies: <b>${S.trophies}</b></div><div class="big">🎟️ Tickets: <b>${S.tickets}</b> · 🎉 Parties: <b>${S.parties}</b></div>${m}<button class="go" id="bk">◀ BACK</button>`); el.querySelector('#bk').onclick = title; }
function setup(kind) {
  const el = ui(`<h2>${kind === 'solo' ? '🎉 NEW PARTY' : '🌐 ONLINE PARTY'}</h2><h3>YOUR NAME</h3><input id="nm" maxlength="12" value="${esc(S.name || charById(S.char).n)}">
    <h3>PICK YOUR CONTESTANT</h3><div class="chars">${CHARS.map((c) => `<button class="ch ${c.id === S.char ? 'sel' : ''}" data-c="${c.id}"><i>${{ luna: '🐀', pirat: '🏴‍☠️', snowie: '❄️', candy: '🐶', torty: '🐢', grok: '🤖' }[c.id]}</i><b>${c.n}</b><small>${c.blurb}</small></button>`).join('')}</div>
    ${kind === 'solo' ? `<h3>HOW LONG?</h3><div class="lens">${[[3, 'Quick'], [5, 'Classic'], [7, 'Mega']].map(([n, t]) => `<button class="ln ${S.len === n ? 'sel' : ''}" data-n="${n}">${t}<small>${n} games + Final</small></button>`).join('')}</div>
    <button class="go" id="bGo">▶ START THE SHOW</button>` : `<button class="go" id="bHost">🏠 HOST A ROOM</button><h3>OR JOIN WITH A CODE</h3><div class="join"><input id="code" maxlength="5" placeholder="ABCDE" autocapitalize="characters"><button class="go alt" id="bJoin">JOIN</button></div><p class="sub" id="nmsg"></p>`}
    <button class="mini" id="bk">◀ BACK</button>`);
  el.querySelectorAll('.ch').forEach((b) => b.onclick = () => { S.char = b.dataset.c; el.querySelectorAll('.ch').forEach((x) => x.classList.toggle('sel', x === b)); save(); });
  el.querySelectorAll('.ln').forEach((b) => b.onclick = () => { S.len = +b.dataset.n; el.querySelectorAll('.ln').forEach((x) => x.classList.toggle('sel', x === b)); save(); });
  const nm = () => { S.name = (el.querySelector('#nm').value || '').replace(/[<>&"]/g, '').trim().slice(0, 12) || charById(S.char).n; save(); };
  el.querySelector('#bk').onclick = () => { leaveRoom(); title(); };
  if (kind === 'solo') el.querySelector('#bGo').onclick = () => { nm(); P.mode = 'solo'; startParty([{ name: S.name, char: S.char, color: COLORS[0], pid: 'me' }]); };
  else { el.querySelector('#bHost').onclick = () => { nm(); openRoom('host'); }; el.querySelector('#bJoin').onclick = () => { nm(); const c = GN.normalizeCode(el.querySelector('#code').value); if (!GN.validCode(c)) return toast('Type the 5-letter code', true); openRoom('join', c); }; }
}
/* ---------------- online room (GrokNet, the same PeerJS layer as Grok FC / Brawl / Grid / Kart) ---------------- */
function leaveRoom() { if (P.room) { try { P.room.leave(); } catch (e) {} P.room = null; } }
function openRoom(role, code) {
  if (!GN) return toast('Online play unavailable', true); leaveRoom();
  const r = P.room = GN.createRoom({ role, code, name: S.name, color: COLORS[0], max: 4, state: { char: S.char } });
  r.on('status', (t) => { const m = $('nmsg'); if (m) m.textContent = t; });
  r.on('error', (e) => { P.room = null; if (P.ph !== 'title' && P.mode === 'client') { toast(e.title + ': ' + e.message, true); title(); } else { const m = $('nmsg'); if (m) m.textContent = e.title + ' – ' + e.message; else toast(e.title, true); } });
  r.on('open', () => roomPanel()); r.on('players', () => { if (P.ph === 'room') roomPanel(); });
  r.on('leave', (p) => { if (P.mode === 'host' && P.ph !== 'room') { const i = P.roster.findIndex((x) => x.pid === p.pid); if (i >= 0) { P.roster[i].pid = null; P.roster[i].bot = 1; toast(`${p.name} left – a party bot takes over`); } } });
  r.on('message', (d, from) => onNet(d, from));
  r.start();
}
function roomPanel() { P.ph = 'room'; const r = P.room; if (!r) return; const pl = r.players(); const fill = Math.max(0, 4 - pl.length);
  const el = ui(`<h2>🌐 ROOM <span class="code">${r.code}</span></h2><p class="sub">${r.isHost ? 'Tell friends this code. Up to 4 players. Party bots fill empty spots.' : 'Waiting for the host to start the show…'}</p>
    <div class="plist">${pl.map((p, i) => `<div class="row"><i style="background:${COLORS[i]}"></i>${esc(p.name)} · ${charById(p.state && p.state.char).n}${p.host ? ' 🏠' : ''}</div>`).join('')}${Array(fill).fill('<div class="row dim"><i></i>Party bot</div>').join('')}</div>
    ${r.isHost ? `<h3>HOW LONG?</h3><div class="lens">${[[3, 'Quick'], [5, 'Classic'], [7, 'Mega']].map(([n, t]) => `<button class="ln ${S.len === n ? 'sel' : ''}" data-n="${n}">${t}<small>${n} + Final</small></button>`).join('')}</div><button class="go" id="bStart">▶ START THE SHOW</button>` : ''}
    <button class="mini" id="bk">◀ LEAVE ROOM</button>`);
  el.querySelectorAll('.ln').forEach((b) => b.onclick = () => { S.len = +b.dataset.n; save(); roomPanel(); });
  el.querySelector('#bk').onclick = () => { leaveRoom(); title(); };
  const bs = el.querySelector('#bStart'); if (bs) bs.onclick = () => { P.mode = 'host'; startParty(r.players().map((p, i) => ({ name: p.name, char: (p.state && p.state.char) || 'luna', color: COLORS[i], pid: p.pid === r.pid ? 'me' : p.pid }))); };
}
function onNet(d, from) {
  if (!d || typeof d !== 'object') return;
  if (P.mode === 'host' || (P.room && P.room.isHost)) { if (d.t === 'in') P.inputs[from] = { mx: clamp(+d.mx || 0, -1, 1), mz: clamp(+d.mz || 0, -1, 1), a: d.a ? 1 : 0 }; return; }
  if (d.t === 'start') { P.mode = 'client'; P.roster = d.roster; P.order = d.order; P.stars = d.stars; P.local = P.roster.findIndex((p) => p.pid === P.room.pid); if (P.local < 0) P.local = 0; }
  else if (d.t === 'ph') enterPh(d.ph, d.d);
  else if (d.t === 's' && P.game && P.ph === 'play') { P.game.apply(d.s); (d.m || []).forEach(showMsg); }
}
const bcast = (d) => { if (P.mode === 'host' && P.room) P.room.broadcast(d); };

/* ---------------- the show ---------------- */
function startParty(humans) {
  const used = new Set(humans.map((h) => h.char)), bots = CHARS.map((c) => c.id).filter((c) => !used.has(c));
  const roster = humans.slice(0, 4); while (roster.length < 4) { const c = bots.shift() || 'grok'; roster.push({ name: charById(c).n + ' Bot', char: c, color: COLORS[roster.length], pid: null, bot: 1 }); }
  roster.forEach((p, i) => p.color = COLORS[i]);
  // random order, avoiding the games that opened the last party
  let pool = shuffle(GAMES.map((g) => g.id)); const last = S.last || []; pool.sort((a, b) => (last.indexOf(a) >= 0 && last.indexOf(a) < 2) - (last.indexOf(b) >= 0 && last.indexOf(b) < 2));
  if (roster.length < 4) pool = pool.filter((id) => id !== 'smash');
  P.order = pool.slice(0, S.len); S.last = P.order.slice(); save();
  P.roster = roster; P.stars = roster.map(() => 0); P.round = 0; P.local = roster.findIndex((p) => p.pid === 'me'); P.guests = shuffle(GUESTS.map((g, i) => i));
  if (P.mode === 'host') bcast({ t: 'start', roster: roster.map((p) => Object.assign({}, p, { pid: p.pid === 'me' ? P.room.pid : p.pid })), order: P.order, stars: P.stars });
  setPh('live', { lines: [['rico', "Gooood evening! You're watching GROK PET PARTY, LIVE on Tortuga TV! 📺"], ['martina', 'Brought to you by Ratita Industries… and Tortuga Tech: shell-tough since forever! 🐢'], ['rico', 'Love it, Torty! Our favourite co-host, folks!'], ['rico', `Tonight: ${P.order.length} mini-games and a GRAND FINAL. Let's meet our contestants!`]], dur: 9 });
}
function setPh(ph, d = {}) { d.stars = P.stars; d.round = P.round; enterPh(ph, d); bcast({ t: 'ph', ph, d }); }
function enterPh(ph, d) {
  P.ph = ph; P.d = d; P.phT = d.dur || 4; P.lineI = -1; if (d.stars) P.stars = d.stars; if (d.round != null) P.round = d.round; $('skip').classList.toggle('hidden', P.mode === 'client' || ph === 'play');
  const R = P.roster;
  if (ph === 'live') { studio.celebrate = 0; ui(''); hud(false); leaveGame(); showStudio(); studio.setRoster(R, P.stars); studio.camShot('host'); studio.drawScreen('GROK PET PARTY', 'LIVE on Tortuga TV'); JINGLE.show(); }
  if (ph === 'pick') { leaveGame(); showStudio(); ui(''); hud(false); const g = gameById(d.gid); studio.camShot('screen'); studio.drawScreen(g.n, d.final ? 'Worth DOUBLE stars!' : `Game ${P.round + 1} of ${P.order.length}`, d.final ? '#ffb000' : ['#ff3fb4', '#16c79a', '#3f7dff', '#ff7a3d'][P.round % 4], g.ic); (d.final ? JINGLE.final : JINGLE.tv)(); }
  if (ph === 'how') { const g = gameById(d.gid); buildGame(g, d.seed); hud(false); bubble();
    ui(`<div class="card"><div class="gic">${g.ic}</div><h2>${g.n}</h2><p>${g.how}</p><div class="ctl">🕹️ Drag on the left side to move${g.act ? ` · tap <b>${g.act}</b>` : ''}</div><div class="spon">${P.round % 2 ? 'Tortuga Tech tested · shell-tough props' : 'Presented by Ratita Industries'}</div><div class="cd" id="cd">3</div></div>`, 'pop'); }
  if (ph === 'play') { ui(''); hud(true); $('actBtn').textContent = gameById(d.gid).act || '★'; $('actBtn').classList.toggle('hidden', !gameById(d.gid).act); sfx('go'); }
  if (ph === 'end') { hud(false); const pl = d.places; ui(`<div class="card"><h2>${gameById(d.gid).ic} RESULTS</h2>${pl.map((r) => `<div class="row res ${r.i === P.local ? 'me' : ''}"><b>${['🥇', '🥈', '🥉', '4️⃣'][r.place - 1]}</b><i style="background:${R[r.i].color}"></i>${esc(R[r.i].name)}<span>+${r.st} ⭐</span></div>`).join('')}</div>`, 'pop');
    const me = pl.find((r) => r.i === P.local); if (me && me.place === 1) { JINGLE.win(); } else sfx('point'); }
  if (ph === 'stand') { leaveGame(); showStudio(); ui(''); studio.setRoster(R, P.stars); studio.camShot(d.intro ? 'podium' : 'board'); studio.drawScreen('STANDINGS', R.map((p, i) => [p.name, P.stars[i], p.color, i]).sort((a, b) => b[1] - a[1]), '#3f7dff'); }
  if (ph === 'guest') { studio.camShot('guest'); const gd = GUESTS[d.g]; studio.showGuest(gd); studio.setRoster(R, P.stars); studio.drawScreen(`GUEST: ${gd.n.toUpperCase()}`, 'booked by Ruffsources', '#3b4a8f', '⭐'); JINGLE.guest(); }
  if (ph === 'finalIntro') { leaveGame(); showStudio(); studio.showGuest(null); studio.camShot('wide'); studio.drawScreen('THE GRAND FINAL', 'Crown Chase · DOUBLE stars', '#ffb000', '👑'); JINGLE.final(); }
  if (ph === 'crown') { leaveGame(); showStudio(); ui(''); hud(false); studio.champX = -3.6 + d.champ * 2.4; studio.setRoster(R, P.stars); studio.champ = d.champ; studio.celebrate = 1; studio.camShot('champ'); studio.drawScreen(`${R[d.champ].name.toUpperCase()}`, '👑 PARTY CHAMP 👑', '#ffb000'); burst(0, 9, -3); JINGLE.win(); }
  if (ph === 'over') { hud(false); rewards(d); }
  if (d.lines) { P.lines = d.lines; P.lineDur = (d.dur || 4) / d.lines.length; } else { P.lines = null; bubble(); }
}
function buildGame(g, seed) { leaveGame(); studio.grp.visible = false; E.scene.fog = null;
  P.game = new g.C({ seed, players: P.roster.map((p, i) => Object.assign({}, p, { local: i === P.local })) }); E.scene.add(P.game.grp); E.shadowDirty = 2; }
function leaveGame() { if (P.game) { E.scene.remove(P.game.grp); disposeTree(P.game.grp); P.game = null; } }
function nextAfterRound() {
  if (P.round < P.order.length) { const gi = P.guests[P.round % P.guests.length], gd = GUESTS[gi];
    // a guest every round: Candy (Ruffsources) introduces them, and they give last place a little boost so nobody is left behind
    const lastI = P.stars.indexOf(Math.min(...P.stars)); P.stars[lastI] += 1;
    setPh('guest', { g: gi, dur: 9, lines: [['candy', `Woof! Ruffsources booked tonight's surprise guest… give it up for ${gd.n.toUpperCase()}!`], ['guest', gd.line], ['guest', `${gd.gift} (${P.roster[lastI].name})`], ...(P.round % 2 ? [['rico', 'What a guest! Thanks for the intro, Torty!'], ['martina', 'Aww, anytime, Rico! Everybody calls me Torty around here. 🐢💚']] : [['rico', 'This guest spot is brought to you by Ratita Industries!']])] }); }
}
function hostStep(dt) {
  const d = P.d; P.phT -= dt;
  if (P.ph === 'play') { const g = P.game; if (!g) return;
    g.av.forEach((a, i) => { const p = P.roster[i]; if (i === P.local) a.inp = readInput(); else if (p.pid && P.inputs[p.pid]) a.inp = P.inputs[p.pid]; else { const v = g.ai(i) || {}; a.inp = { mx: (v.mx || 0) * 0.84, mz: (v.mz || 0) * 0.84, a: v.a || 0 }; } });
    g.update(dt); const m = g.msgs.splice(0); m.forEach(showMsg);
    P.sT = (P.sT || 0) - dt; if (P.mode === 'host' && P.sT <= 0) { P.sT = 1 / 12; bcast({ t: 's', s: g.snap(), m }); }
    if (g.done) { const pl = g.places(), mult = d.final ? 2 : 1; pl.forEach((r) => { r.st = [4, 3, 2, 1][r.place - 1] * mult; P.stars[r.i] += r.st; });
      const me = pl.find((r) => r.i === P.local); if (me && me.place === 1 && !d.final) { S.medals[d.gid] = (S.medals[d.gid] || 0) + 1; save(); }
      setPh('end', { gid: d.gid, places: pl, final: d.final, dur: 4.5 }); }
    return; }
  if (P.phT > 0) return;
  if (P.ph === 'live') setPh('stand', { dur: 5, lines: P.roster.map((p, i) => [i % 2 ? 'martina' : 'rico', `${['Contestant one', 'Number two', 'Number three', 'And number four'][i]}: ${p.name}!${p.bot ? ' (party bot)' : ''}`]), intro: 1 });
  else if (P.ph === 'stand') { if (P.d.intro || P.round < P.order.length && P.d.afterGuest) return pickNext(); if (P.round < P.order.length) nextAfterRound(); else setPh('finalIntro', { dur: 6, lines: [['rico', "It's time… for the GRAND FINAL! Every star counts DOUBLE!"], ['martina', 'The golden stage is Tortuga Tech tested. Shell-tough! Good luck everyone!']] }); }
  else if (P.ph === 'guest') { studio.showGuest(null); setPh('stand', { dur: 3.5, afterGuest: 1, lines: [['rico', 'Back to the game! Here are the standings…']] }); }
  else if (P.ph === 'pick') setPh('how', { gid: d.gid, seed: d.seed, final: d.final, dur: 5.5 });
  else if (P.ph === 'how') setPh('play', { gid: d.gid, final: d.final });
  else if (P.ph === 'end') { if (d.final) { const mx = Math.max(...P.stars); const champ = P.stars.indexOf(mx); setPh('crown', { champ, dur: 8, lines: [['rico', `Ladies, gentlemen and pets… your PARTY CHAMP is ${P.roster[champ].name}! 👑`], ['martina', 'Thanks for watching Tortuga TV! Tickets and trophies for everyone!'], ['candy', 'Woof! Ruffsources will book more guests next time!']] }); } else { P.round++; setPh('stand', { dur: 4.5, lines: [['rico', P.round >= P.order.length ? 'What a show! Let\u2019s check the scores before the final…' : 'Let\u2019s look at the scoreboard!']] }); } }
  else if (P.ph === 'finalIntro') setPh('pick', { gid: 'crown', seed: (Math.random() * 1e9) | 0, final: 1, dur: 3.2 });
  else if (P.ph === 'crown') setPh('over', { champ: d.champ, dur: 1e9 });
}
function pickNext() { setPh('pick', { gid: P.order[P.round], seed: (Math.random() * 1e9) | 0, dur: 3.2 }); }
function rewards(d) {
  const me = P.local, champ = d.champ === me, st = P.stars[me] || 0, tk = st * 2 + (champ ? 30 : 8);
  if (!P.paid) { P.paid = 1; S.tickets += tk; S.parties++; if (champ) S.trophies++; save(); }
  const order = P.roster.map((p, i) => i).sort((a, b) => P.stars[b] - P.stars[a]);
  const el = ui(`<div class="card"><h2>${champ ? '👑 YOU ARE THE PARTY CHAMP!' : '🎉 WHAT A PARTY!'}</h2>${order.map((i, k) => `<div class="row res ${i === me ? 'me' : ''}"><b>${k + 1}</b><i style="background:${P.roster[i].color}"></i>${esc(P.roster[i].name)}<span>${P.stars[i]} ⭐</span></div>`).join('')}
    <div class="big">+${tk} 🎟️ tickets${champ ? ' · +1 👑 trophy' : ''}</div><button class="go" id="again">🔁 ${P.mode === 'client' ? 'BACK TO MENU' : 'PLAY AGAIN'}</button><button class="mini" id="menu">🏠 MENU</button></div>`, 'pop');
  el.querySelector('#again').onclick = () => { P.paid = 0; if (P.mode === 'client') { leaveRoom(); return title(); } if (P.mode === 'host' && P.room) { P.ph = 'room'; return roomPanel(); } startParty([P.roster[me]].map((p) => Object.assign({}, p, { pid: 'me' }))); };
  el.querySelector('#menu').onclick = () => { P.paid = 0; leaveRoom(); title(); };
}
/* ---------------- HUD + bubbles ---------------- */
const WHO = { rico: ['Rico', 'Ratita Industries', '#ff3fb4'], martina: ['Martina "Torty"', 'Tortuga Tech', '#16c79a'], candy: ['Candy', 'Ruffsources HR', '#3b4a8f'], guest: ['Guest', 'booked by Ruffsources', '#a78bfa'] };
function bubble(who, text) { const b = $('bubble'); if (!who) { b.className = 'hidden'; return; } const w = WHO[who]; let n = w[0]; if (who === 'guest' && P.d.g != null) n = GUESTS[P.d.g].n; b.className = ''; b.innerHTML = `<div class="who" style="background:${w[2]}">${esc(n)} <small>${w[1]}</small></div><div class="txt">${esc(text)}</div>`; }
let feedT = 0; function showMsg(m) { if (m[0] === 's') { if (m[2] < 0 || m[2] === P.local || ['gold', 'point', 'splash', 'boom'].includes(m[1])) sfx(m[1]); return; } if (!m[1]) return; if (m[2] === P.local || m[2] < 0 || /CROWN|stole|bumped|point|goo!/i.test(m[1])) { const f = $('feed'); f.textContent = m[1]; f.className = 'show' + (m[2] === P.local ? ' me' : ''); feedT = 2.2; } }
function drawHud() { const g = P.game; if (!g) return; const t = Math.max(0, Math.ceil(g.time));
  $('hTitle').textContent = gameById(P.d.gid).n; $('hTime').textContent = g.hud ? g.hud(P.local) : `⏱ ${t}`; $('hTime').classList.toggle('low', !g.hud && t <= 5);
  $('chips').innerHTML = P.roster.map((p, i) => `<div class="chip ${i === P.local ? 'me' : ''} ${g.av[i].out ? 'out' : ''}" style="border-color:${p.color}"><i style="background:${p.color}"></i>${esc(p.name.slice(0, 8))}<b>${g.rankScore && P.d.gid === 'goo' ? (g.av[i].out ? '💀' : '✓') : g.av[i].score}</b></div>`).join('');
  const me = g.av[P.local]; $('outNote').classList.toggle('hidden', !(me && me.out && P.d.gid === 'goo')); }
/* ---------------- main loop ---------------- */
let lastCd = 0, inT = 0;
function frame(dt) {
  if (P.paused && P.mode === 'solo') dt = 0;
  if (P.ph !== 'title' && P.ph !== 'room') { if (P.mode !== 'client') hostStep(dt); else P.phT -= dt; }
  // client: send my input
  if (P.mode === 'client' && P.room && P.ph === 'play') { inT -= dt; if (inT <= 0) { inT = 0.05; const i = readInput(); P.room.send({ t: 'in', mx: +i.mx.toFixed(2), mz: +i.mz.toFixed(2), a: i.a }); } }
  if (P.lines) { const k = Math.min(P.lines.length - 1, Math.floor(((P.d.dur || 4) - P.phT) / P.lineDur)); if (k !== P.lineI && k >= 0) { P.lineI = k; bubble(P.lines[k][0], P.lines[k][1]); P.talk = P.lines[k][0]; } }
  if (P.ph === 'how') { const c = Math.ceil(Math.min(3, P.phT)); const el = $('cd'); if (el && c !== lastCd) { el.textContent = c > 0 ? c : 'GO!'; if (c > 0) sfx('tick'); lastCd = c; } }
  if (P.game && (P.ph === 'play' || P.ph === 'how' || P.ph === 'end')) { P.game.view(dt, P.mode !== 'client'); P.game.camera(dt, P.local); if (P.ph === 'play') drawHud(); }
  else { studio.update(dt, P.talk); studio.camera(dt); if (P.ph === 'title') { studio.camShot('wide'); } }
  stepConfetti(dt); if (feedT > 0) { feedT -= dt; if (feedT <= 0) $('feed').className = ''; }
}
$('skip').onclick = () => { if (P.mode !== 'client' && P.ph !== 'play' && P.ph !== 'over') P.phT = Math.min(P.phT, 0.05); };
$('menuBtn').onclick = () => { P.paused = true; $('pause').classList.remove('hidden'); };
$('pResume').onclick = () => { P.paused = false; $('pause').classList.add('hidden'); };
$('pSound').onclick = () => { A.on = !A.on; $('pSound').textContent = A.on ? '🔊 Sound: ON' : '🔇 Sound: OFF'; };
$('pLeave').onclick = () => { P.paused = false; $('pause').classList.add('hidden'); leaveRoom(); title(); };
// test / screenshot hooks
window.__pp = { P, S, studio, E, GAMES, solo: () => { P.mode = 'solo'; startParty([{ name: 'David', char: 'pirat', color: COLORS[0], pid: 'me' }]); },
  go: (gid, dur) => { P.mode = 'solo'; if (!P.roster.length) startParty([{ name: 'David', char: 'pirat', color: COLORS[0], pid: 'me' }]); setPh('how', { gid, seed: 12345, final: gid === 'crown' ? 1 : 0, dur: dur || 0.01 }); },
  ph: (ph, d) => setPh(ph, d || {}), mem: () => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null, info: () => E.renderer.info.memory };
