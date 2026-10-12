// Co-op for up to 3 via GrokNet (PeerJS, 5-letter codes). Host-authoritative test schedule; each rat moves itself.
// Mysteries, gears and hats are saved per player (everyone gets to solve them on their own device).
import { S, persist } from './save.js?v=np2';
import { esc, $ } from './util.js?v=np2';
import { sfx } from './audio.js?v=np2';
import { panel, closePanel } from './ui.js?v=np2';
import { SHIRTS, cleanLook } from './humans.js?v=np2';
const col = (L) => '#' + SHIRTS[cleanLook(L && L.look).shirt].toString(16).padStart(6, '0');
const GN = window.GrokNet;
export class Net {
  constructor(app) { this.app = app; this.room = null; this.looks = {}; this.acc = 0; this.n = 0; }
  get online() { return !!(this.room && this.room.opened); }
  get isHost() { return !this.online || this.room.isHost; }
  myName() { return GN ? GN.cleanName(S.name || 'Visitor') : 'Visitor'; }
  bc(m) { if (this.online && this.room.isHost) this.room.broadcast(m); }
  send(m) { if (this.online && !this.room.isHost) this.room.send(m); }
  tick(dt, g) { if (!this.online) return; this.acc += dt; if (this.acc < 1 / 15) return; this.acc = 0; this.n++;
    if (this.room.isHost) { const ps = {}; for (const [pid, p] of g.players) ps[p.local ? this.room.pid : pid] = p.snap(); const m = { t: 's', T: +g.T.toFixed(2), ps };
      m.tod = S.opts.tod || 'auto'; this.room.broadcast(m); }
    else this.room.send({ t: 'p', s: g.me.snap() }); }
  lobby() { const app = this.app; if (!GN) return app.hud.toast('Online play unavailable'); if (this.online) return this.roomPanel(); app.busy = true;
    panel(`<div class="topBar"><button class="back" id="nBack">◀</button><h2>🌐 EXPLORE WITH FRIENDS</h2></div><p class="sub">Up to 3 visitors! One player hosts and shares the 5-letter code.</p>
      <h3>YOUR NAME</h3><input id="nName" maxlength="12" value="${esc(this.myName())}"><button class="go" id="bHost">🏠 HOST</button><h3>OR JOIN WITH A CODE</h3>
      <div class="joinRow"><input id="codeIn" maxlength="5" placeholder="ABCDE" autocomplete="off" autocapitalize="characters"><button class="mbtn2" id="bJoin">JOIN</button></div><p class="sub" id="onlineMsg"></p>`, (c) => {
      const nm = () => { S.name = GN.cleanName(c.querySelector('#nName').value); persist(); };
      c.querySelector('#nBack').onclick = () => { if (this.room && !this.room.opened) this.leave(); app.busy = false; app.state === 'play' ? app.resume() : app.toTitle(); };
      c.querySelector('#bHost').onclick = () => { nm(); sfx('click'); this.host(); };
      c.querySelector('#bJoin').onclick = () => { nm(); sfx('click'); const code = GN.normalizeCode(c.querySelector('#codeIn').value); if (!GN.validCode(code)) return this.status('Codes are 5 letters, like KDXPQ'); this.join(code); }; }); }
  status(t, ok) { const m = $('onlineMsg'); if (m) { m.textContent = t; m.style.color = ok ? '#15803d' : '#be123c'; } }
  roomPanel() { const room = this.room; if (!room) return; const app = this.app; app.busy = true; const ps = room.players();
    const list = ps.map((p) => { const L = this.looks[p.pid] || {}; return `<div class="pRow"><span class="sw" style="background:${col(L)}"></span><b>${esc(L.name || p.name)}</b><small>Intern · ${p.slot === 0 ? 'Host' : 'Player ' + (p.slot + 1)}${p.pid === room.pid ? ' (you)' : ''}</small></div>`; }).join('');
    panel(`<div class="topBar"><h2>ROOM <span class="code">${room.code}</span></h2></div><p class="sub">Friends join with code <b>${room.code}</b> (${ps.length}/3)</p><div class="pList">${list}</div>
      <button class="mbtn2" id="bLook">👤 CUSTOMIZE YOUR INTERN</button>
      <div class="btnRow"><button class="mbtn2" id="bLeave">LEAVE</button><button class="go" id="bGo">▶ EXPLORE</button></div><p class="sub">Everyone explores together. The host's clock runs the sky. Mysteries, biscuits and hats save on each player's own device.</p>`, (c) => {
      c.querySelector('#bLeave').onclick = () => { this.leave(); app.busy = false; app.toTitle(); };
      c.querySelector('#bLook').onclick = () => { sfx('click'); app.ui.custom(() => this.roomPanel()); };
      c.querySelector('#bGo').onclick = () => { app.busy = false; closePanel(); app.play(); }; }); }
  sendLook() { if (!this.room) return; const L = { t: 'look', name: this.myName(), look: cleanLook(S.look), outfit: S.outfit }; if (this.room.isHost) { this.looks[this.room.pid] = L; this.room.broadcast({ t: 'looks', looks: this.looks }); this.applyLooks(); } else this.room.send(L); }
  applyLooks() { const g = this.app.game; if (!g) return; for (const pid in this.looks) { if (pid === this.room.pid) continue; const p = g.players.get(pid), L = this.looks[pid]; const key = JSON.stringify(L.look) + L.outfit; if (p && p._lk !== key) { g.removeRemote(pid); const q = g.addRemote(pid, L, this.slotOf(pid)); q._lk = key; } } }
  bind(room) { this.room = room; const app = this.app;
    room.on('status', (t) => this.status(t, true));
    room.on('open', () => { this.status('Connected!', true); sfx('cheese'); this.sendLook(); this.roomPanel(); app.hud.toast(room.isHost ? 'Room ' + room.code + ' is open!' : 'Joined room ' + room.code + '!'); });
    room.on('join', (p) => { if (p.pid !== room.pid) { app.hud.toast('👋 ' + p.name + ' joined!'); sfx('squeak'); } if (room.isHost) room.broadcast({ t: 'looks', looks: this.looks }); if (app.state !== 'play') this.roomPanel(); });
    room.on('leave', (p) => { app.hud.toast(p.name + ' left'); if (app.game) app.game.removeRemote(p.pid); delete this.looks[p.pid]; if (app.state !== 'play') this.roomPanel(); });
    room.on('message', (d, from) => this.onMsg(d, from));
    room.on('reconnecting', () => app.hud.toast('Lost the host - reconnecting…'));
    room.on('error', (e) => { this.status(e.title + ': ' + e.message); const g = app.game; if (g) for (const pid of [...g.players.keys()]) if (!g.players.get(pid).local) g.removeRemote(pid); this.room = null; if (app.state === 'play') app.hud.toast(e.title + ' - you\'re exploring solo now'); });
    room.start(); }
  host(code) { this.status('Opening a room…', true); this.looks = {}; this.bind(GN.createRoom({ role: 'host', code: code || undefined, name: this.myName(), color: GN.COLORS[0], max: 3, rejoin: !!code })); }
  join(code) { this.status('Joining ' + code + '…', true); this.bind(GN.createRoom({ role: 'join', code, name: this.myName(), color: GN.COLORS[1], rejoin: !!this.fromHub })); }
  fromParams(prm) { this.fromHub = true; S.name = prm.name; persist(); this.lobby(); if (prm.mode === 'host') this.host(prm.code); else this.join(prm.code); }
  leave() { if (!this.room) return; try { this.room.leave(); } catch (e) {} const g = this.app.game; if (g) for (const pid of [...g.players.keys()]) if (!g.players.get(pid).local) g.removeRemote(pid); this.room = null; this.looks = {}; }
  onMsg(d, from) { const app = this.app, g = app.game; if (!d || typeof d !== 'object') return; const host = this.room && this.room.isHost;
    if (d.t === 'look' && host) { this.looks[from] = { name: GN.cleanName(d.name), look: cleanLook(d.look), outfit: String(d.outfit || 'none').slice(0, 12) }; this.room.broadcast({ t: 'looks', looks: this.looks }); this.applyLooks(); if (app.state !== 'play') this.roomPanel(); return; }
    if (d.t === 'looks' && !host) { this.looks = d.looks || {}; this.applyLooks(); if (app.state !== 'play') this.roomPanel(); return; }
    if (!g) return;
    if (d.t === 'heli') { if (host) this.room.broadcast(d); return; }
    if (host) { if (d.t === 'p' && Array.isArray(d.s)) { const L = this.looks[from] || { name: 'Visitor' }; g.addRemote(from, L, this.slotOf(from)).applySnap(d.s); } }
    else { if (d.t === 's') { for (const pid in d.ps) { if (pid === this.room.pid) continue; const L = this.looks[pid] || { name: 'Visitor' }; g.addRemote(pid, L, this.slotOf(pid)).applySnap(d.ps[pid]); }
        for (const pid of [...g.players.keys()]) if (!g.players.get(pid).local && !d.ps[pid]) g.removeRemote(pid);
        const off = d.T - g.T; if (Math.abs(off) > 1) g.T = d.T; else g.T += off * 0.3;
        if (d.tod) g.hostTod = d.tod; } } }
  slotOf(pid) { const p = this.room && this.room.players().find((q) => q.pid === pid); return p ? p.slot : 1; }
}
