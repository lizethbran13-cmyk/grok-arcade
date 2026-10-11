// Co-op for up to 3 explorers via GrokNet (PeerJS, 5-letter codes). Host-authoritative: animals, the Relic Patrol,
// Vintage's machines, pickups, puzzles, doors and traps live on the host; each explorer moves itself and reports in.
import { S, persist } from './save.js';
import { HEROES, OUTFITS } from './data.js';
import { esc, $ } from './util.js';
import { sfx } from './audio.js';
import { panel, closePanel } from './ui.js';
import { triggerBoulder, dropPlank } from './traps.js';
const GN = window.GrokNet;
const COLS = ['#f59e0b', '#22d3ee', '#f472b6'];
export class Net {
  constructor(app) { this.app = app; this.room = null; this.looks = {}; this.acc = 0; this.n = 0; }
  get online() { return !!(this.room && this.room.opened); }
  get isHost() { return !this.online || this.room.isHost; }
  myName() { return GN ? GN.cleanName(S.name || (HEROES.find((h) => h.id === S.hero) || HEROES[0]).n.split(' ')[0]) : 'Explorer'; }
  bc(m) { if (this.online && this.room.isHost) this.room.broadcast(m); }
  send(m) { if (this.online && !this.room.isHost) this.room.send(m); }
  sendTo(pid, m) { if (this.online && this.room.isHost) this.room.sendTo(pid, m); }
  fx(type, x, y, z, col, remote) { const g = this.app.game; if (!g) return; const f = g.fx;
    if (type === 'splat') { f.burst(x, y + 0.2, z, col || 0x84cc16, 10, 4); sfx('splat'); }
    else if (type === 'stomp') { f.puff(x, y, z, 14, 0xe5e7eb); g.cam.shake = 0.35; sfx('boom'); }
    else if (type === 'clink') { f.burst(x, y, z, 0xcbd5e1, 5, 3); sfx('hit'); }
    else if (type === 'bosshit') { f.burst(x, y, z, 0xffe14d, 20, 7); sfx('bosshit'); g.cam.shake = 0.3; }
    else if (type === 'alert') { f.burst(x, y, z, 0xfde047, 8, 2); sfx('whistle'); }
    else if (type === 'dizzy') { f.ring(x, y, z, 0xfde047, 1.2); sfx('dizzy'); }
    else if (type === 'scare') { f.puff(x, y, z, 6, 0xffffff); }
    else if (type === 'warn') { f.burst(x, y, z, 0xef4444, 8, 2); }
    if (!remote && this.online && this.room.isHost) this.room.broadcast({ t: 'fx', ty: type, x: +x.toFixed(1), y: +y.toFixed(1), z: +z.toFixed(1), c: col || 0 }); }
  tick(dt, g) { if (!this.online) return; this.acc += dt; if (this.acc < 1 / 15) return; this.acc = 0; this.n++;
    if (this.room.isHost) { const ps = {}; for (const [pid, p] of g.players) ps[p.local ? this.room.pid : pid] = p.snap();
      const w = g.world; const m = { t: 's', lv: g.levelId, T: +g.T.toFixed(2), ps, a: g.actors.snap(), d: w.doors.map((d) => d.open ? 1 : 0), pl: w.plates.map((p) => p.on ? 1 : 0), bl: w.blocks.map((b) => [+b.x.toFixed(2), +b.z.toFixed(2)]), tl: [g.tally.coins, g.tally.treasures, g.tally.evidence], ch: g.chase ? 1 : 0 };
      if (this.n % 20 === 0) { m.g = [...g.got]; m.pz = g.puzState(); } this.room.broadcast(m); }
    else this.room.send({ t: 'p', s: g.me.snap(), lv: g.levelId }); }
  // ---------- lobby ----------
  lobby() { const app = this.app; if (!GN) return app.hud.toast('Online play unavailable'); if (this.online) return this.roomPanel();
    panel(`<div class="topBar"><button class="back" id="nBack">◀</button><h2>🌐 PLAY WITH FRIENDS</h2></div><p class="sub">Up to 3 explorers! One player hosts and shares the 5-letter code.</p>
      <h3>YOUR NAME</h3><input id="nName" maxlength="12" value="${esc(this.myName())}"><button class="go" id="bHost">🏛️ HOST A GAME</button><h3>OR JOIN WITH A CODE</h3>
      <div class="joinRow"><input id="codeIn" maxlength="5" placeholder="ABCDE" autocomplete="off" autocapitalize="characters"><button class="mbtn2" id="bJoin">JOIN</button></div><p class="sub" id="onlineMsg"></p>`, (c) => {
      const nm = () => { S.name = GN.cleanName(c.querySelector('#nName').value); persist(); };
      c.querySelector('#nBack').onclick = () => { if (this.room && !this.room.opened) this.leave(); app.toTitle(); };
      c.querySelector('#bHost').onclick = () => { nm(); sfx('click'); this.host(); };
      c.querySelector('#bJoin').onclick = () => { nm(); sfx('click'); const code = GN.normalizeCode(c.querySelector('#codeIn').value); if (!GN.validCode(code)) return this.status('Codes are 5 letters, like KDXPQ'); this.join(code); }; }); }
  status(t, ok) { const m = $('onlineMsg'); if (m) { m.textContent = t; m.style.color = ok ? '#4ade80' : '#fca5a5'; } }
  roomPanel() { const room = this.room; if (!room) return; const app = this.app; app.paused = true; const ps = room.players();
    const list = ps.map((p) => { const L = this.looks[p.pid] || {}; const h = HEROES.find((q) => q.id === L.hero) || HEROES[0]; return `<div class="pRow"><span class="sw" style="background:${COLS[p.slot % 3]}"></span><b>${esc(L.name || p.name)}</b><small>${h.n} · ${p.slot === 0 ? 'Host' : 'Player ' + (p.slot + 1)}${p.pid === room.pid ? ' (you)' : ''}</small></div>`; }).join('');
    panel(`<div class="topBar"><h2>ROOM <span class="code">${room.code}</span></h2></div><p class="sub">Friends join with code <b>${room.code}</b> (${ps.length}/3)</p><div class="pList">${list}</div>
      <h3>YOUR EXPLORER</h3><div class="hero">${HEROES.map((h) => `<button data-h="${h.id}" class="${S.hero === h.id ? 'on' : ''}"><i style="background:${h.col}"></i>${h.n.split(' ')[0]}</button>`).join('')}</div>
      ${room.isHost ? `<div class="btnRow"><button class="mbtn2" id="bLeave">LEAVE</button><button class="go" id="bStart" ${ps.length < 2 ? 'disabled' : ''}>GO TO THE MUSEUM ▶</button></div>${ps.length < 2 ? '<p class="sub">Waiting for a friend to join…</p>' : '<p class="sub">You pick the expeditions. Everyone shares coins, treasures and evidence!</p>'}`
        : `<p class="sub">Waiting for the host to start… 🗺️</p><div class="btnRow"><button class="mbtn2" id="bLeave">LEAVE</button></div>`}`, (c) => {
      c.querySelector('#bLeave').onclick = () => { this.leave(); app.toTitle(); };
      c.querySelectorAll('[data-h]').forEach((b) => b.onclick = () => { S.hero = b.dataset.h; persist(); sfx('click'); this.sendLook(); this.roomPanel(); });
      const st = c.querySelector('#bStart'); if (st) st.onclick = () => { closePanel(); app.loadLevel('hub', true); }; }); }
  sendLook() { if (!this.room) return; const L = { t: 'look', name: this.myName(), hero: S.hero, outfit: S.outfit }; if (this.room.isHost) { this.looks[this.room.pid] = L; this.room.broadcast({ t: 'looks', looks: this.looks }); } else this.room.send(L); }
  bind(room) { this.room = room; const app = this.app;
    room.on('status', (t) => this.status(t, true));
    room.on('open', () => { this.status('Connected!', true); sfx('coin'); this.sendLook(); this.roomPanel(); app.hud.toast(room.isHost ? 'Room ' + room.code + ' is open!' : 'Joined room ' + room.code + '!'); });
    room.on('join', (p) => { if (p.pid !== room.pid) { app.hud.toast('👋 ' + p.name + ' joined!'); sfx('whistle'); }
      if (room.isHost) { room.broadcast({ t: 'looks', looks: this.looks }); if (app.state === 'play' && app.game) room.sendTo(p.pid, { t: 'load', level: app.game.levelId, seed: app.game.seed }); }
      if (app.state !== 'play') this.roomPanel(); });
    room.on('leave', (p) => { app.hud.toast(p.name + ' left'); if (app.game) app.game.removeRemote(p.pid); if (app.state !== 'play') this.roomPanel(); });
    room.on('message', (d, from) => { try { this.onMsg(d, from); } catch (e) { console.warn(e); } });
    room.on('reconnecting', () => app.hud.toast('Lost the host - reconnecting…'));
    room.on('error', (e) => { this.status(e.title + ': ' + e.message); const was = app.state === 'play' && app.game && app.game.online; this.room = null; if (was) { app.hud.toast(e.title + ' - back to the museum'); app.loadLevel('hub'); } });
    room.start(); }
  host(code) { this.status('Opening a room…', true); this.looks = {}; this.bind(GN.createRoom({ role: 'host', code: code || undefined, name: this.myName(), color: GN.COLORS[0], max: 3, rejoin: !!code })); }
  join(code) { this.status('Joining ' + code + '…', true); this.bind(GN.createRoom({ role: 'join', code, name: this.myName(), color: GN.COLORS[1], rejoin: !!this.fromHub })); }
  fromParams(prm) { this.fromHub = true; S.name = prm.name; persist(); this.lobby(); if (prm.mode === 'host') this.host(prm.code); else this.join(prm.code); }
  leave() { if (!this.room) return; try { this.room.leave(); } catch (e) {} this.room = null; this.looks = {}; }
  slotOf(pid) { const p = this.room && this.room.players().find((q) => q.pid === pid); return p ? p.slot : 1; }
  remote(g, pid) { const L = this.looks[pid] || { name: 'Explorer', hero: 'zoe', outfit: 'urban' }; const slot = this.slotOf(pid); const p = g.addRemote(pid, L, slot); p.color = COLS[slot % 3]; return p; }
  onMsg(d, from) { const app = this.app, g = app.game; if (!d || typeof d !== 'object') return; const host = this.room && this.room.isHost;
    if (d.t === 'look' && host) { this.looks[from] = { name: GN.cleanName(d.name), hero: HEROES.some((h) => h.id === d.hero) ? d.hero : 'zoe', outfit: OUTFITS.some((o) => o.id === d.outfit) ? d.outfit : 'classic' }; this.room.broadcast({ t: 'looks', looks: this.looks }); if (app.state !== 'play') this.roomPanel(); return; }
    if (d.t === 'looks' && !host) { this.looks = d.looks || {}; if (app.state !== 'play') this.roomPanel(); return; }
    if (d.t === 'load' && !host) { app.loadLevel(String(d.level), false, { seed: d.seed }); return; }
    if (!g) return; const w = g.world;
    if (d.t === 'trap') { if (d.k === 'b' && w.boulders[d.i]) triggerBoulder(g, w.boulders[d.i], true); else if (d.k === 'p' && w.planks[d.i]) dropPlank(g, w.planks[d.i], true); if (host) this.room.broadcast(d); return; }
    if (d.t === 'push') { const b = w.blocks[d.id | 0]; if (b && !b.mv) { if (host) { const wish = [Math.sign(d.x - b.x), Math.sign(d.z - b.z)]; const pl = g.players.get(from); if (pl) g.tryPush(b, wish, pl); } else g.moveBlock(b, +d.x, +d.z); } return; }
    if (host) {
      if (d.lv && d.lv !== g.levelId) return;
      if (d.t === 'p') { if (Array.isArray(d.s)) this.remote(g, from).applySnap(d.s); }
      else if (d.t === 'pick') g.pick(d.id | 0, from, false);
      else if (d.t === 'hit') g.actors.damage(d.id === 'boss' ? 'boss' : d.id | 0, Math.min(2, +d.dmg || 1), g.players.get(from));
      else if (d.t === 'puz') g.puzzle(String(d.what), String(d.id));
      else if (d.t === 'relic') g.gotRelic();
      else if (d.t === 'escape') { if (g.chase) g.finish(); }
    } else {
      if (d.t === 's') { if (d.lv !== g.levelId) return; for (const pid in d.ps) { if (pid === this.room.pid) continue; this.remote(g, pid).applySnap(d.ps[pid]); }
        for (const pid of [...g.players.keys()]) if (!g.players.get(pid).local && !d.ps[pid]) g.removeRemote(pid);
        g.actors.applySnap(d.a); if (Math.abs(d.T - g.T) > 1) g.T = d.T; else g.T += (d.T - g.T) * 0.3;
        (d.d || []).forEach((o, i) => { const dr = w.doors[i]; if (dr && !!o !== dr.open) g.setDoor(dr.id, !!o, true); });
        (d.pl || []).forEach((o, i) => { if (w.plates[i]) w.plates[i].on = !!o; });
        (d.bl || []).forEach((p, i) => { const b = w.blocks[i]; if (b && !b.mv && (Math.abs(b.x - p[0]) > 0.05 || Math.abs(b.z - p[1]) > 0.05)) g.moveBlock(b, p[0], p[1]); });
        if (d.tl) { g.tally.coins = d.tl[0]; g.tally.treasures = d.tl[1]; g.tally.evidence = d.tl[2]; g.hud.dirty = true; }
        if (d.ch && !g.chase) g.startChase(true);
        if (d.pz) g.applyPuzState(d.pz);
        if (d.g) for (const id of d.g) { const e = w.ents[id]; if (e && !e.got) g.applyPick(e, null); } }
      else if (d.t === 'fx') this.fx(d.ty, d.x, d.y, d.z, d.c, true);
      else if (d.t === 'got') { const e = w.ents[d.id]; if (e) g.applyPick(e, d.pid); }
      else if (d.t === 'door') g.setDoor(d.id, d.open, true);
      else if (d.t === 'plate') { const p = w.plates.find((q) => q.id === d.id); if (p && p.on !== d.on) { p.on = d.on; sfx(d.on ? 'plate' : 'click'); } }
      else if (d.t === 'puzR') { g.applyPuzState(d.st || {}); sfx(d.what === 'statue' ? 'stone' : d.what === 'lever' ? 'lever' : 'fire'); }
      else if (d.t === 'chase') g.startChase(true);
      else if (d.t === 'busted') g.me.arrest(g, { name: d.by });
      else if (d.t === 'gone') { const e = g.actors.list.find((q) => q.id === d.id); if (e) e.dead = true; }
      else if (d.t === 'relic') { if (!g.tally.relic) g.gotRelic(true); }
      else if (d.t === 'done') { g.tally.coins = d.res.coins; g.tally.treasures = d.res.treasures; g.tally.evidence = d.res.evidence; g.tally.relic = d.res.relic; g.finish(true); }
    } }
}
