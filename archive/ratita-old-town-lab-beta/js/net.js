import { myDress } from './pirate.js';
// Co-op for up to 3 via GrokNet (PeerJS). Host-authoritative world (enemies, bosses, Candy, pickups, doors);
// each rat moves itself (owner-predicted) and reports hits/pickups to the host, which validates and relays.
import { S, persist } from './save.js';
import { RATS, LEVELS } from './data.js';
import { esc, $ } from './util.js';
import { sfx } from './audio.js';
import { panel, closePanel } from './ui.js';
const GN = window.GrokNet;
const cleanDress = (d) => d && typeof d === 'object' ? { top: String(d.top || 'none').slice(0, 12), skin: String(d.skin || 'none').slice(0, 12), acc: String(d.acc || 'none').slice(0, 12) } : null;
export class Net {
  constructor(app) { this.app = app; this.room = null; this.looks = {}; this.acc = 0; this.n = 0; this.level = 'hq'; this.seed = 1; }
  get online() { return !!(this.room && this.room.opened); }
  get isHost() { return !this.online || this.room.isHost; }
  myName() { return GN ? GN.cleanName(S.name || RATS.find((r) => r.id === S.rat).n) : 'Rat'; }
  // ---------- messaging ----------
  bc(m) { if (this.online && this.room.isHost) this.room.broadcast(m); }
  send(m) { if (this.online && !this.room.isHost) this.room.send(m); }
  sendTo(pid, m) { if (this.online && this.room.isHost) this.room.sendTo(pid, m); }
  fx(type, x, y, z, col, remote) { const g = this.app.game; if (!g) return; const f = g.fx;
    if (type === 'splat') { f.burst(x, y + 0.2, z, col || 0xd4a373, 10, 4); sfx('splat'); }
    else if (type === 'bark') { sfx('bark'); f.ring(x, y, z, 0xffffff, 3); g.cam.shake = 0.15; }
    else if (type === 'stomp') { f.puff(x, y, z, 14, 0xe5e7eb); g.cam.shake = 0.35; sfx('bosshit'); }
    else if (type === 'pop') { f.burst(x, y, z, 0xffd23f, 12); f.burst(x, y, z, 0xffffff, 8); sfx('pop'); }
    else if (type === 'hit') { f.burst(x, y, z, 0xffffff, 6); sfx('hit'); }
    else if (type === 'clink') { f.burst(x, y, z, 0xcbd5e1, 5, 3); sfx('hit'); }
    else if (type === 'bosshit') { f.burst(x, y, z, 0xffe14d, 20, 7); sfx('bosshit'); g.cam.shake = 0.3; }
    if (!remote && this.online && this.room.isHost) this.room.broadcast({ t: 'fx', ty: type, x: +x.toFixed(1), y: +y.toFixed(1), z: +z.toFixed(1), c: col || 0 }); }
  tick(dt, g) { if (!this.online) return; this.acc += dt; if (this.acc < 1 / 15) return; this.acc = 0; this.n++;
    if (this.room.isHost) { const ps = {}; for (const [pid, p] of g.players) ps[p.local ? this.room.pid : pid] = p.snap();
      const m = { t: 's', lv: g.levelId, T: +g.T.toFixed(2), ps, a: g.actors.snap(), d: g.world.doors.map((d) => d.open ? 1 : 0), tl: [g.tally.crumbs, g.tally.cheese, g.tally.parts, g.tally.babies] };
      if (this.n % 20 === 0) m.g = [...g.got]; this.room.broadcast(m); }
    else this.room.send({ t: 'p', s: g.me.snap(), lv: g.levelId }); }
  // ---------- lobby ----------
  lobby() { const app = this.app; if (!GN) return app.hud.toast('Online play unavailable');
    if (this.online) return this.roomPanel();
    panel(`<div class="topBar"><button class="back" id="nBack">◀</button><h2>🌐 PLAY WITH FRIENDS</h2></div><p class="sub">Up to 3 rats! One player hosts and shares the 5-letter code.</p>
      <h3>YOUR NAME</h3><input id="nName" maxlength="12" value="${esc(this.myName())}"><button class="go" id="bHost">🏠 HOST A GAME</button><h3>OR JOIN WITH A CODE</h3>
      <div class="joinRow"><input id="codeIn" maxlength="5" placeholder="ABCDE" autocomplete="off" autocapitalize="characters"><button class="mbtn2" id="bJoin">JOIN</button></div><p class="sub" id="onlineMsg"></p>`, (c) => {
      const nm = () => { S.name = GN.cleanName(c.querySelector('#nName').value); persist(); };
      c.querySelector('#nBack').onclick = () => { if (this.room && !this.room.opened) this.leave(); app.toTitle(); };
      c.querySelector('#bHost').onclick = () => { nm(); sfx('click'); this.host(); };
      c.querySelector('#bJoin').onclick = () => { nm(); sfx('click'); const code = GN.normalizeCode(c.querySelector('#codeIn').value); if (!GN.validCode(code)) return this.status('Codes are 5 letters, like KDXPQ'); this.join(code); }; }); }
  status(t, ok) { const m = $('onlineMsg'); if (m) { m.textContent = t; m.style.color = ok ? '#15803d' : '#be123c'; } this.lastStatus = t; }
  roomPanel() { const room = this.room; if (!room) return; const app = this.app; app.paused = true; const ps = room.players();
    const list = ps.map((p) => { const L = this.looks[p.pid] || {}; const r = RATS.find((q) => q.id === L.rat) || RATS[0]; return `<div class="pRow"><span class="sw" style="background:${r.col}"></span><b>${esc(L.name || p.name)}</b><small>${r.n} · ${p.slot === 0 ? 'Host' : 'Player ' + (p.slot + 1)}${p.pid === room.pid ? ' (you)' : ''}</small></div>`; }).join('');
    panel(`<div class="topBar"><h2>ROOM <span class="code">${room.code}</span></h2></div><p class="sub">Friends join with code <b>${room.code}</b> (${ps.length}/3)</p><div class="pList">${list}</div>
      <h3>YOUR RAT</h3><div class="seg">${RATS.map((r) => `<button data-r="${r.id}" class="${S.rat === r.id ? 'on' : ''}">${r.n}</button>`).join('')}</div>
      ${room.isHost ? `<div class="btnRow"><button class="mbtn2" id="bLeave">LEAVE</button><button class="go" id="bStart" ${ps.length < 2 ? 'disabled' : ''}>GO TO HQ ▶</button></div>${ps.length < 2 ? '<p class="sub">Waiting for a friend to join…</p>' : '<p class="sub">You pick the rooms. Everyone shares cheese, parts and babies!</p>'}`
        : `<p class="sub">Waiting for the host to start… 🐀</p><div class="btnRow"><button class="mbtn2" id="bLeave">LEAVE</button></div>`}`, (c) => {
      c.querySelector('#bLeave').onclick = () => { this.leave(); app.toTitle(); };
      c.querySelectorAll('[data-r]').forEach((b) => b.onclick = () => { S.rat = b.dataset.r; persist(); sfx('squeak'); this.sendLook(); this.roomPanel(); });
      const st = c.querySelector('#bStart'); if (st) st.onclick = () => { closePanel(); app.loadLevel('hq', true); }; }); }
  sendLook() { const L = { t: 'look', name: this.myName(), rat: S.rat, outfit: S.outfit, dress: myDress() }; if (this.room.isHost) { this.looks[this.room.pid] = L; this.room.broadcast({ t: 'looks', looks: this.looks }); } else this.room.send(L); }
  bind(room) { this.room = room; const app = this.app;
    room.on('status', (t) => this.status(t, true));
    room.on('open', () => { this.status('Connected!', true); sfx('cheese'); this.sendLook(); this.roomPanel(); app.hud.toast(room.isHost ? 'Room ' + room.code + ' is open!' : 'Joined room ' + room.code + '!'); });
    room.on('join', (p) => { if (p.pid !== room.pid) { app.hud.toast('👋 ' + p.name + ' joined!'); sfx('squeak'); }
      if (room.isHost) { room.broadcast({ t: 'looks', looks: this.looks }); if (app.state === 'play' && app.game) room.sendTo(p.pid, { t: 'load', level: app.game.levelId, seed: app.game.seed }); }
      if (app.state !== 'play') this.roomPanel(); });
    room.on('leave', (p) => { app.hud.toast(p.name + ' left'); if (app.game) app.game.removeRemote(p.pid); if (app.state !== 'play') this.roomPanel(); });
    room.on('message', (d, from) => this.onMsg(d, from));
    room.on('reconnecting', () => app.hud.toast('Lost the host - reconnecting…'));
    room.on('error', (e) => { this.status(e.title + ': ' + e.message); const was = app.state === 'play' && app.game && app.game.online; this.room = null; if (was) { app.hud.toast(e.title + ' - back to HQ'); app.loadLevel('hq'); } });
    room.start(); }
  host(code) { this.status('Opening a room…', true); this.looks = {}; this.bind(GN.createRoom({ role: 'host', code: code || undefined, name: this.myName(), color: GN.COLORS[0], max: 3, rejoin: !!code })); }
  join(code) { this.status('Joining ' + code + '…', true); this.bind(GN.createRoom({ role: 'join', code, name: this.myName(), color: GN.COLORS[1], rejoin: !!this.fromHub })); }
  fromParams(prm) { this.fromHub = true; S.name = prm.name; persist(); this.lobby(); if (prm.mode === 'host') this.host(prm.code); else this.join(prm.code); }
  leave() { if (!this.room) return; try { this.room.leave(); } catch (e) {} this.room = null; this.looks = {}; }
  // ---------- messages ----------
  onMsg(d, from) { const app = this.app, g = app.game; if (!d || typeof d !== 'object') return; const host = this.room && this.room.isHost;
    if (d.t === 'look' && host) { this.looks[from] = { name: GN.cleanName(d.name), rat: RATS.some((r) => r.id === d.rat) ? d.rat : 'luna', outfit: String(d.outfit || 'none').slice(0, 12), dress: cleanDress(d.dress) }; this.room.broadcast({ t: 'looks', looks: this.looks }); if (app.state !== 'play') this.roomPanel(); return; }
    if (d.t === 'looks' && !host) { this.looks = d.looks || {}; if (app.state !== 'play') this.roomPanel(); return; }
    if (d.t === 'load' && !host) { app.loadLevel(d.level, false, { seed: d.seed }); return; }
    if (!g) return;
    if (host) {
      if (d.lv && d.lv !== g.levelId) return;
      if (d.t === 'p') { const L = this.looks[from] || { name: 'Rat', rat: 'luna' }; const p = g.addRemote(from, L, this.slotOf(from)); if (Array.isArray(d.s)) p.applySnap(d.s); }
      else if (d.t === 'pick') g.pick(d.id | 0, from, false);
      else if (d.t === 'hit') g.actors.damage(typeof d.id === 'number' ? d.id : 'boss', Math.min(2, +d.dmg || 1), from);
      else if (d.t === 'act') { if (d.what === 'martina') g.actors.actMartina(); else if (d.what === 'lever') g.pullLever(d.id); }
      else if (d.t === 'gold') g.finish();
    } else {
      if (d.t === 's') { if (d.lv !== g.levelId) return; for (const pid in d.ps) { if (pid === this.room.pid) continue; const L = this.looks[pid] || { name: 'Rat', rat: 'luna' }; g.addRemote(pid, L, this.slotOf(pid)).applySnap(d.ps[pid]); }
        for (const pid of [...g.players.keys()]) if (!g.players.get(pid).local && !d.ps[pid]) g.removeRemote(pid);
        g.actors.applySnap(d.a); if (Math.abs(d.T - g.T) > 1) g.T = d.T; else g.T += (d.T - g.T) * 0.3;
        (d.d || []).forEach((o, i) => { const dr = g.world.doors[i]; if (dr && !!o !== dr.open) g.setDoor(dr.id, !!o, true); });
        if (d.tl) { g.tally.crumbs = d.tl[0]; g.tally.cheese = d.tl[1]; g.tally.parts = d.tl[2]; g.tally.babies = d.tl[3]; g.hud.dirty = true; }
        if (d.g) for (const id of d.g) { const e = g.world.ents[id]; if (e && !e.got) g.applyPick(e, null); } }
      else if (d.t === 'got') { const e = g.world.ents[d.id]; if (e) g.applyPick(e, d.pid); }
      else if (d.t === 'door') g.setDoor(d.id, d.open, true);
      else if (d.t === 'lever') { const lv = g.world.levers.find((q) => q.id === d.id); if (lv && !lv.on) { lv.on = true; if (lv.obj) lv.obj.rotation.z = -0.9; } }
      else if (d.t === 'fx') this.fx(d.ty, d.x, d.y, d.z, d.c, true);
      else if (d.t === 'ouch') g.me.hurt(g, { x: d.x, z: d.z }, d.kind);
      else if (d.t === 'done') { g.tally.crumbs = d.res.crumbs; g.tally.cheese = d.res.cheese; g.tally.parts = d.res.parts; g.tally.babies = d.res.babies; g.finish(true); }
    } }
  slotOf(pid) { const p = this.room && this.room.players().find((q) => q.pid === pid); return p ? p.slot : 1; }
}
