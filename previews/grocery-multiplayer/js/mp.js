// Online co-op for up to 3 via GrokNet (PeerJS, 5-letter room codes) - the same backend as the Arcade, Grok Sky, FC and Torty Town.
// Each player moves themselves; the host relays everyone's position at 12 Hz plus shared co-op events. Saves stay on each device.
// If a friend leaves, their avatar fades out; if the host leaves, everyone keeps playing solo (nobody is ever stuck).
import * as THREE from 'three';
import { makeHuman, animHuman, cleanLook } from './humans.js?v=ggt21mp';
import { panel, closePanel, on, toast } from './uikit.js?v=ggt21mp';
import { esc } from './util.js?v=ggt21mp';
const GN = window.GrokNet;
const SLOT_C = ['#ff4fd8', '#3ff0ff', '#ffd23f'];
function tagSprite(name, col) { const cv = document.createElement('canvas'), g = cv.getContext('2d'); const f = 'bold 44px system-ui,-apple-system,sans-serif'; g.font = f; const w = Math.ceil(g.measureText(name).width) + 56, h = 72; cv.width = w; cv.height = h; g.font = f;
  g.fillStyle = 'rgba(15,23,42,0.78)'; g.beginPath(); g.roundRect(2, 2, w - 4, h - 4, 30); g.fill(); g.lineWidth = 5; g.strokeStyle = col; g.stroke(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name, w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); const H = 0.42; s.scale.set(H * w / h, H, 1); s.renderOrder = 9; return s; } // aspect kept: never stretched
export class MP {
  // cfg: { game, title, sub, scene, snap():state, here():zone key, look():look, onEvent(e, name, pid), remoteHook(r, s, dt, vis), remoteGone(r), menuBack() }
  constructor(app, cfg) { this.app = app; this.cfg = cfg; this.room = null; this.remotes = new Map(); this.names = {}; this.acc = 0; this.seen = {}; window.__mp = this; }
  get online() { return !!(this.room && this.room.opened); }
  get isHost() { return !this.online || this.room.isHost; }
  get count() { return this.online ? this.room.players().length : 1; }
  myName() { const S = this.cfg.save; return GN ? GN.cleanName((S && S.name) || this.cfg.defName || 'Player') : 'Player'; }
  slotOf(pid) { const p = this.room && this.room.players().find((q) => q.pid === pid); return p ? p.slot : 1; }
  // ---------- lobby ----------
  lobby(back) { const app = this.app; this.back = back || this.back; if (!GN) return toast('Online play is unavailable on this device'); if (this.room) return this.roomPanel(); app.busy = true;
    panel(`<h2>🌐 ${esc(this.cfg.title)}</h2><p class="sub">${esc(this.cfg.sub)} Up to 3 players: one hosts and shares the 5-letter code.</p>
      <p class="sub"><b>Your name</b></p><input id="mpN" class="mpIn" maxlength="12" value="${esc(this.myName())}"><button class="go" id="mpH">🏠 HOST A ROOM</button>
      <p class="sub"><b>Or join a friend</b></p><div class="mpRow"><input id="mpC" class="mpIn" maxlength="5" placeholder="ABCDE" autocomplete="off" autocapitalize="characters"><button class="mbtn2" id="mpJ">JOIN</button></div>
      <p class="sub" id="mpMsg"></p><button class="mbtn2" id="mpB">◀ BACK</button>`, (c) => {
      const nm = () => { const S = this.cfg.save; if (S) { S.name = GN.cleanName(c.querySelector('#mpN').value); this.cfg.persist && this.cfg.persist(); } };
      on(c, '#mpB', () => { if (this.room && !this.room.opened) this.leave(); this.close(); });
      on(c, '#mpH', () => { nm(); this.host(); });
      on(c, '#mpJ', () => { nm(); const code = GN.normalizeCode(c.querySelector('#mpC').value); if (!GN.validCode(code)) return this.status('Codes are 5 letters, like KDXPQ'); this.join(code); }); }); }
  close() { const app = this.app; app.busy = false; closePanel(); if (this.back) this.back(); else if (app.state === 'play') app.resume(); else app.ui.title(); }
  status(t, ok) { const m = document.getElementById('mpMsg'); if (m) { m.textContent = t; m.style.color = ok ? '#15803d' : '#be123c'; } }
  roomPanel() { const room = this.room; if (!room) return; const app = this.app; app.busy = true; const ps = room.players();
    const list = ps.map((p) => `<div class="mpP"><span style="background:${SLOT_C[p.slot] || '#fff'}"></span><b>${esc(this.names[p.pid] || p.name)}</b><small>${p.slot === 0 ? 'Host' : 'Player ' + (p.slot + 1)}${p.pid === room.pid ? ' (you)' : ''}</small></div>`).join('');
    panel(`<h2>ROOM <span class="mpCode">${room.code}</span></h2><p class="sub">Friends join with code <b>${room.code}</b> (${ps.length}/3)</p>${room.opened ? list : '<p class="sub" id="mpMsg">Connecting…</p>'}
      <p class="sub">${esc(this.cfg.how || '')}</p><div class="btnRow"><button class="mbtn2" id="mpL">LEAVE</button><button class="go" id="mpGo">▶ PLAY</button></div>`, (c) => {
      on(c, '#mpL', () => { this.leave(); this.close(); });
      on(c, '#mpGo', () => { app.busy = false; closePanel(); if (app.state === 'play') app.resume(); else if (this.cfg.play) this.cfg.play(); else app.play(); }); }); }
  // ---------- room ----------
  bind(room) { this.room = room; const app = this.app;
    room.on('status', (t) => this.status(t, true));
    room.on('open', () => { this.status('Connected!', true); this.names[room.pid] = this.myName(); for (const p of room.players()) this.names[p.pid] = this.names[p.pid] || p.name; this.roomPanel(); toast(room.isHost ? '🌐 Room ' + room.code + ' is open!' : '🌐 Joined room ' + room.code + '!'); });
    room.on('join', (p) => { if (p.pid !== room.pid) toast('👋 ' + p.name + ' joined!'); this.names[p.pid] = p.name; if (app.state !== 'play' || (app.busy && document.querySelector('.mpCode'))) this.roomPanel(); this.cfg.onJoin && this.cfg.onJoin(p); });
    room.on('leave', (p) => { toast('👋 ' + (this.names[p.pid] || p.name) + ' left. Keep going!'); this.drop(p.pid); if (document.querySelector('.mpCode')) this.roomPanel(); });
    room.on('message', (d, from) => this.onMsg(d, from));
    room.on('reconnecting', () => toast('Lost the host, reconnecting…'));
    room.on('error', (e) => { this.status(e.title + ': ' + e.message); this.dropAll(); this.room = null; if (app.state === 'play') toast((e.title || 'Room closed') + ' - you\'re playing solo now'); if (document.querySelector('.mpCode')) this.close(); });
    room.start(); }
  host(code) { this.status('Opening a room…', true); this.bind(GN.createRoom({ role: 'host', code: code || undefined, name: this.myName(), color: SLOT_C[0], max: 3, rejoin: !!code })); }
  join(code) { this.status('Joining ' + code + '…', true); this.bind(GN.createRoom({ role: 'join', code, name: this.myName(), color: SLOT_C[1], rejoin: !!this.fromHub })); }
  fromParams(prm) { this.fromHub = true; const S = this.cfg.save; if (S && prm.name) { S.name = prm.name; this.cfg.persist && this.cfg.persist(); } if (prm.mode === 'host') this.host(prm.code); else this.join(prm.code); this.roomPanel(); }
  leave() { if (!this.room) return; try { this.room.leave(); } catch (e) {} this.room = null; this.dropAll(); }
  // shared co-op event: everyone (including you) runs cfg.onEvent
  event(e) { if (!this.online) return; const m = { t: 'e', e, n: this.myName() }; this.room.broadcast(m); }
  // ---------- per-frame ----------
  tick(dt) { if (!this.online) { if (this.remotes.size) this.dropAll(); return; } this.acc += dt;
    if (this.acc >= 1 / 12) { this.acc = 0; const s = this.cfg.snap(); s.k = this.cfg.here(); s.L = cleanLook(this.cfg.look()); if (this.room.isHost) { const ps = { [this.room.pid]: s }; for (const [pid, r] of this.remotes) if (r.s) ps[pid] = r.s; this.room.broadcast({ t: 's', ps }); } else this.room.send({ t: 'p', s }); }
    const here = this.cfg.here(); for (const [, r] of this.remotes) this.drive(r, dt, here); }
  onMsg(d, from) { if (!d || typeof d !== 'object') return; const host = this.room && this.room.isHost;
    if (d.t === 'e') { this.cfg.onEvent && this.cfg.onEvent(d.e || {}, GN.cleanName(d.n || 'Friend'), from); return; }
    if (host && d.t === 'p' && d.s) { this.upd(from, d.s); return; }
    if (!host && d.t === 's' && d.ps) { for (const pid in d.ps) if (pid !== this.room.pid) this.upd(pid, d.ps[pid]); if (!this._nm || this._nm !== this.room.players().length) { this._nm = this.room.players().length; for (const p of this.room.players()) this.names[p.pid] = this.names[p.pid] || p.name; } for (const pid of [...this.remotes.keys()]) if (!d.ps[pid]) this.drop(pid); } }
  upd(pid, s) { if (!s || typeof s.x !== 'number') return; let r = this.remotes.get(pid); const lk = JSON.stringify(s.L || {});
    if (r && r.lk !== lk) { this.drop(pid); r = null; }
    if (!r) { const rig = makeHuman(s.L); const sl = this.slotOf(pid); const tag = tagSprite(this.names[pid] || 'Friend', SLOT_C[sl] || '#fff'); tag.position.y = 2.25; rig.root.add(tag);
      const blob = new THREE.Mesh(new THREE.CircleGeometry(0.4, 20), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.25, depthWrite: false })); blob.rotation.x = -Math.PI / 2; blob.renderOrder = 1;
      r = { pid, rig, tag, blob, lk, x: s.x, y: s.y, z: s.z, yaw: s.yaw || 0, s, slot: sl, ext: {} }; this.cfg.scene.add(rig.root, blob); this.remotes.set(pid, r); }
    r.s = s; }
  drive(r, dt, here) { const s = r.s; if (!s) return; const k = Math.min(1, dt * 12); const jump = Math.hypot(s.x - r.x, s.z - r.z) > 12;
    r.x = jump ? s.x : r.x + (s.x - r.x) * k; r.y = jump ? s.y : r.y + (s.y - r.y) * k; r.z = jump ? s.z : r.z + (s.z - r.z) * k; let dy = (s.yaw || 0) - r.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; r.yaw += dy * k;
    const vis = s.k === here && !s.hide; r.rig.root.visible = vis; r.blob.visible = vis && !s.air;
    if (vis) { r.rig.root.position.set(r.x, r.y, r.z); r.rig.root.rotation.y = r.yaw; r.blob.position.set(r.x, r.y + 0.03, r.z); animHuman(r.rig, dt, { speed: s.sp || 0, air: !!s.air, squash: 0 }); }
    this.cfg.remoteHook && this.cfg.remoteHook(r, s, dt, s.k === here); }
  drop(pid) { const r = this.remotes.get(pid); if (!r) return; this.cfg.scene.remove(r.rig.root, r.blob); r.rig.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map) o.material.map.dispose(); }); this.cfg.remoteGone && this.cfg.remoteGone(r); this.remotes.delete(pid); }
  dropAll() { for (const pid of [...this.remotes.keys()]) this.drop(pid); }
  debug() { return { online: this.online, host: this.isHost, code: this.room && this.room.code, n: this.count, here: this.cfg.here(), remotes: [...this.remotes.values()].map((r) => ({ name: this.names[r.pid], x: +r.x.toFixed(2), z: +r.z.toFixed(2), k: r.s.k, vis: r.rig.root.visible, ext: Object.keys(r.ext) })) }; }
}
export const MP_CSS = `.mpIn{width:100%;box-sizing:border-box;font:700 18px system-ui;padding:10px 12px;border-radius:12px;border:2px solid #cbd5e1;margin:4px 0 8px;text-transform:none}
.mpRow{display:flex;gap:8px;align-items:center}.mpRow .mpIn{flex:1;text-transform:uppercase;letter-spacing:4px}.mpCode{letter-spacing:5px;color:#7c3aed}
.mpP{display:flex;align-items:center;gap:10px;padding:8px 10px;margin:4px 0;border-radius:12px;background:rgba(124,58,237,.08)}.mpP span{width:16px;height:16px;border-radius:50%;flex:none}.mpP small{margin-left:auto;opacity:.7}
#mpBadge{position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top) + 6px);z-index:30;background:rgba(15,23,42,.72);color:#fff;font:700 12px system-ui;padding:4px 10px;border-radius:999px;pointer-events:none}#mpBadge.hidden{display:none}`;
export function mpBadge(mp) { let b = document.getElementById('mpBadge'); if (!b) { const st = document.createElement('style'); st.textContent = MP_CSS; document.head.appendChild(st); b = document.createElement('div'); b.id = 'mpBadge'; b.className = 'hidden'; document.body.appendChild(b); }
  const on = mp.online && mp.app.state === 'play'; b.classList.toggle('hidden', !on); if (on) { const t = '🌐 ' + mp.room.code + ' · ' + mp.count + '/3'; if (b.textContent !== t) b.textContent = t; } }
