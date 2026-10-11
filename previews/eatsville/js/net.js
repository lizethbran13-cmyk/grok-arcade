// Co-op for up to 3 via GrokNet (PeerJS). Host-authoritative: the host owns the company save, the clock and the live
// restaurant sim of the building the host is standing in. Each player moves themselves (owner-predicted) and reports
// position + actions; the host validates actions against its sim and relays state at ~12 Hz.
import * as THREE from 'three';
import { E } from './engine.js';
import { S, setS, persist, EV } from './empire.js';
import { RestSim } from './sim.js';
import { makePerson, animPerson } from './people.js';
import { makeCar, newCarState, poseCar } from './cars.js';
import { dishModel, DISH } from './food.js';
import { IX } from './interiors.js';
import { CAR, BLD } from './data.js';
import { panel, close } from './ui.js';
import { $, esc } from './util.js';
const GN = window.GrokNet;
let G = null, C = null, H = null; // game state, game API, helpers from main
const R = { room: null, remote: new Map(), acc: 0, n: 0, stAcc: 0, dirty: false, hostWhere: null, looks: {}, sentLook: 0 };
const online = () => !!(R.room && R.room.opened);
const isHost = () => online() && R.room.isHost;
const lookPack = () => ({ name: R.myName || (S && S.name) || 'Chef', look: H.myLook(), car: S ? S.car : 'hatch' });
const sanitizeState = (s) => { const o = JSON.parse(JSON.stringify(s)); delete o.look; delete o.opts; delete o.guest; return o; };
function status(t, ok) { const m = $('onlineMsg'); if (m) { m.textContent = t; m.style.color = ok ? '#15803d' : '#be123c'; } }
// ---------------- remote avatars ----------------
function remote(pid) { let r = R.remote.get(pid); if (!r) { r = { pid, x: 0, z: 0, ry: 0, sp: 0, w: 'town', drv: 0, c: null, carry: null, model: null, car: null, carKind: null, lookKey: '', carryKey: null, tx: 0, tz: 0 }; R.remote.set(pid, r); } return r; }
function dropRemote(pid) { const r = R.remote.get(pid); if (!r) return; if (r.model) E.scene.remove(r.model); if (r.car) E.scene.remove(r.car); if (r.tag) r.tag.remove(); R.remote.delete(pid); }
function styleRemote(r) { const L = R.looks[r.pid]; if (!L) return; const key = JSON.stringify(L.look);
  if (key !== r.lookKey) { if (r.model) E.scene.remove(r.model); r.model = makePerson(L.look); E.scene.add(r.model); r.lookKey = key; r.carryKey = null; }
  const ck = CAR[L.car] ? L.car : 'hatch'; if (ck !== r.carKind) { if (r.car) E.scene.remove(r.car); const d = CAR[ck]; r.car = makeCar(d.kind, d.col); E.scene.add(r.car); r.carKind = ck; r.cs = newCarState(d); }
  if (!r.tag) { r.tag = document.createElement('div'); r.tag.className = 'float ptag'; $('floats').appendChild(r.tag); } r.tag.textContent = L.name; }
const _v = new THREE.Vector3();
function drawRemotes(dt) { const here = G.where === 'town' ? 'town' : G.bid;
  for (const r of R.remote.values()) { styleRemote(r); if (!r.model) continue; const k = Math.min(1, dt * 10); r.x += (r.tx - r.x) * k; r.z += (r.tz - r.z) * k;
    const vis = r.w === here && G.state === 'play'; const inCar = vis && r.w === 'town' && r.drv;
    r.model.visible = vis && !inCar; if (r.car) r.car.visible = !!inCar;
    if (inCar) { r.cs.x = r.x; r.cs.z = r.z; r.cs.ry = r.ry; r.cs.v = r.sp; r.cs.spin += r.sp * dt * 2; poseCar(r.car, r.cs, G.t); }
    else if (vis) { r.model.position.set(r.x, 0, r.z); r.model.rotation.y = r.ry; animPerson(r.model, dt, { speed: r.sp, carry: !!r.carry });
      const rig = r.model.userData.rig; if (rig && r.carryKey !== (r.carry || null)) { r.carryKey = r.carry || null; rig.hold.clear(); if (r.carry) rig.hold.add(dishModel(r.carry === 'dirty' ? 'dirty' : r.carry, r.carry === 'bag' ? 1.2 : 1.6)); } }
    if (r.tag) { if (vis) { _v.set(r.x, inCar ? 2.6 : 2.5, r.z).project(E.camera); const on = _v.z < 1; r.tag.style.display = on ? '' : 'none'; if (on) r.tag.style.transform = `translate(${(_v.x * 0.5 + 0.5) * E.w}px,${(-_v.y * 0.5 + 0.5) * E.h}px) translate(-50%,-100%)`; } else r.tag.style.display = 'none'; } } }
// ---------------- packets ----------------
function myPos() { const P = G.P, c = G.carState; const drv = G.driving ? 1 : 0; const x = drv ? c.x : P.x, z = drv ? c.z : P.z;
  return [+x.toFixed(2), +z.toFixed(2), +(drv ? c.ry : P.ry).toFixed(2), +(drv ? c.v : P.sp || 0).toFixed(1), G.where === 'town' ? 'town' : G.bid, drv, P.carry || 0]; }
function applyPos(r, a) { const jump = r.w !== a[4] || Math.hypot(r.tx - a[0], r.tz - a[1]) > 8; r.tx = a[0]; r.tz = a[1]; if (jump) { r.x = a[0]; r.z = a[1]; } r.ry = a[2]; r.sp = a[3]; r.w = a[4]; r.drv = a[5]; r.carry = a[6] || null; }
function sendState(to) { const m = { t: 'st', s: sanitizeState(S) }; if (to) R.room.sendTo(to, m); else R.room.broadcast(m); R.dirty = false; R.stAcc = 0; }
function applyState(s) { const mine = S && S.guest ? { look: S.look, opts: S.opts, name: S.name } : { look: R.guestLook, name: R.myName }; const ns = Object.assign(s, { guest: true }); if (mine.look) ns.look = mine.look; if (mine.opts) ns.opts = mine.opts; if (mine.name) ns.name = mine.name; setS(ns);
  if (G.sim && G.sim.br && G.sim.br.key && ns.branches[G.sim.br.key]) G.sim.br = ns.branches[G.sim.br.key]; }
function onMsg(d, from) { if (!d || typeof d !== 'object') return; const host = isHost();
  if (host) {
    if (d.t === 'look') { R.looks[from] = { name: GN.cleanName(String(d.name || 'Chef')), look: d.look && typeof d.look === 'object' ? d.look : {}, car: String(d.car || 'hatch').slice(0, 12) }; R.room.broadcast({ t: 'looks', l: R.looks }); return; }
    if (d.t === 'me' && Array.isArray(d.p)) { applyPos(remote(from), d.p); return; }
    if (d.t === 'act') { let r = null; if (G.sim && remote(from).w === G.bid) { r = G.sim.act(from, +d.x || 0, +d.z || 0); } R.room.sendTo(from, { t: 'actr', r, id: d.id }); if (r === 'serve' || r === 'fix') R.dirty = true; return; }
    if (d.t === 'snowie') { if (G.sim && remote(from).w === G.bid && S.money >= 25 && G.sim.callSnowie()) { if (S.mode !== 'explore') S.money -= 25; EV.push({ t: 'toast', m: '📞 ' + ((R.looks[from] || {}).name || 'A friend') + ' called Snowie! (-$25)' }); R.dirty = true; } return; }
    if (d.t === 'earn') { const v = Math.max(0, Math.min(200, +d.v || 0)); S.money += v; S.stats.earned += v; if (d.what === 'deliv') S.deliveries++; persist(); R.dirty = true; return; }
  } else {
    if (d.t === 'st' && d.s) { const first = !S || !S.guest; applyState(d.s); if (first || G.state !== 'play') { close(); C.start(false); C.toast('🌐 Joined ' + ((R.looks[R.room._hostPid()] || {}).name || 'your friend') + '\'s Eatsville!'); } else C.changedRemote && C.changedRemote(); return; }
    if (d.t === 'looks') { R.looks = d.l || {}; delete R.looks[R.room.pid]; if (G.state !== 'play') roomPanel(); return; }
    if (d.t === 'p') { Net.stateTime = d.T; R.hostWhere = d.hw; for (const pid in d.ps) { if (pid === R.room.pid) continue; applyPos(remote(pid), d.ps[pid]); } for (const pid of [...R.remote.keys()]) if (!d.ps[pid]) dropRemote(pid);
      if (d.sim && G.sim && G.sim.clientOf === d.sim.bid && G.bid === d.sim.bid) G.sim.applySnap(d.sim.d); else if (G.sim && G.sim.clientOf && G.bid !== d.hw) { G.sim.cust = []; G.sim.staff = []; G.sim.insp = null; G.sim.snowie = null; } return; }
    if (d.t === 'ev' && d.e) { if (d.e.where && d.e.where !== G.bid) return; EV.push(Object.assign({}, d.e, { relayed: 1 })); return; }
    if (d.t === 'fx' && d.f) { if (G.sim && G.bid === d.bid) G.sim.fx.push(d.f); return; }
    if (d.t === 'actr') { H.afterSim(d.r); return; }
  } }
// ---------------- lobby ----------------
function lobby() { if (!GN) return C.toast('Online play is unavailable here', true); if (online()) return roomPanel();
  panel('🌐 CO-OP (up to 3)', `<p class="sub">Run one restaurant empire together! The host's save is the shared company. Friends cook, serve, clean, fix and deliver with you.</p>
    <h3>YOUR NAME</h3><input id="nName" maxlength="12" value="${esc((S && S.name) || '')}" placeholder="Chef name"><button class="go" data-a="host">🏠 HOST (uses my save)</button>
    <h3>OR JOIN WITH A CODE</h3><div class="joinRow"><input id="codeIn" maxlength="5" placeholder="ABCDE" autocomplete="off" autocapitalize="characters"><button class="mbtn2" data-a="join">JOIN</button></div><p class="sub" id="onlineMsg"></p>`,
  (a) => { const nm = GN.cleanName($('nName').value || 'Chef'); R.myName = nm; if (a === 'host') { if (G.state !== 'play') C.hostStart(); host(nm); } if (a === 'join') { const code = GN.normalizeCode($('codeIn').value); if (!GN.validCode(code)) return status('Codes are 5 letters, like KDXPQ'); join(code, nm); } },
  { noMoney: true, onBack: () => { if (R.room && !R.room.opened) leave(); close(); if (G.state !== 'play') C.title(); } }); }
function roomPanel() { if (!R.room) return; const room = R.room; const ps = room.players();
  const list = ps.map((p) => `<div class="pRow"><span class="sw" style="background:${p.color || '#ff7a3d'}"></span><b>${esc((R.looks[p.pid] || {}).name || p.name)}</b><small>${p.slot === 0 ? 'Host' : 'Player ' + (p.slot + 1)}${p.pid === room.pid ? ' (you)' : ''}</small></div>`).join('');
  panel('ROOM <span class="code">' + room.code + '</span>', `<p class="sub">Friends join with code <b>${room.code}</b> (${ps.length}/3)</p><div class="pList">${list}</div>
    ${room.isHost ? `<button class="go" data-a="play">${G.state === 'play' ? '▶ BACK TO TOWN' : '▶ START'}</button><p class="sub">You run the company: menus, buying and hiring are yours. Friends can join any time.</p>` : '<p class="sub">Loading your friend\'s town… 🍔</p>'}<button class="mbtn2" data-a="leave">LEAVE ROOM</button>`,
  (a) => { if (a === 'play') { close(); if (G.state !== 'play') C.hostStart(); } if (a === 'leave') { leave(); close(); if (G.state !== 'play' || S.guest) C.quit(); } }, { noMoney: true, noBack: true }); }
function bind(room) { R.room = room;
  room.on('status', (t) => status(t, true));
  room.on('open', () => { status('Connected!', true); C.sfx('coin'); room.send(Object.assign({ t: 'look' }, lookPack())); if (room.isHost) R.looks[room.pid] = lookPack(); roomPanel(); C.toast(room.isHost ? 'Room ' + room.code + ' is open!' : 'Joined room ' + room.code + '!'); });
  room.on('join', (p) => { if (p.pid !== room.pid) { C.toast('👋 ' + p.name + ' joined!'); C.sfx('squeak'); }
    if (room.isHost && p.pid !== room.pid) { if (S) sendState(p.pid); room.broadcast({ t: 'looks', l: R.looks }); } if (G.state !== 'play' || (room.isHost && $('ui').classList.contains('open') && $('ui').textContent.includes('ROOM'))) roomPanel(); });
  room.on('leave', (p) => { C.toast(p.name + ' left'); dropRemote(p.pid); if (room.isHost) { delete R.looks[p.pid]; if (G.sim) delete G.sim.carry[p.pid]; } });
  room.on('message', (d, from) => onMsg(d, from));
  room.on('reconnecting', () => C.toast('Lost the host - reconnecting…', true));
  room.on('error', (e) => { status(e.title + ': ' + e.message); const wasGuest = S && S.guest; R.room = null; for (const pid of [...R.remote.keys()]) dropRemote(pid); if (wasGuest) { C.toast(e.title + ' - back to the title', true); C.quit(); } });
  room.start(); }
function host(name, code) { status('Opening a room…', true); R.looks = {}; if (S) S.name = name; bind(GN.createRoom({ role: 'host', code: code || undefined, name, color: GN.COLORS[0], max: 3, rejoin: !!code })); }
function join(code, name, rejoin) { let gl = null; try { const sv = JSON.parse(localStorage.getItem('grokEatsville.v1') || 'null'); gl = sv && sv.look; } catch (e) {} R.guestLook = gl || { outfit: 'diner', skin: [0xf2c29b, 0xc68642, 0x8d5524, 0xffdbac][(Math.random() * 4) | 0], hair: [0x2b1d14, 0xe0b04a, 0xb5482a][(Math.random() * 3) | 0], hairStyle: 'long' }; status('Joining ' + code + '…', true); R.looks = {}; bind(GN.createRoom({ role: 'join', code, name, color: GN.COLORS[1], rejoin: !!rejoin })); }
function leave() { if (!R.room) return; try { R.room.leave(); } catch (e) {} R.room = null; for (const pid of [...R.remote.keys()]) dropRemote(pid); R.looks = {}; Net.stateTime = null; }
// ---------------- the API main.js uses ----------------
export const Net = {
  stateTime: null,
  init(g, c, h) { G = g; C = c; H = h; },
  code: () => (R.room ? R.room.code : null), active: online, isHost, isClient: () => online() && !R.room.isHost, pid: () => (online() ? R.room.pid : 'me'),
  lobby, leave, roomPanel, hostWhere: () => R.hostWhere,
  fromUrl() { const p = GN.params(); if (!p) return; const nm = GN.cleanName(p.name || 'Chef'); R.myName = nm; lobby(); if (p.mode === 'host') { C.hostStart(); host(nm, p.code); } else join(p.code, nm, true); },
  clientSim(bid, br, room) { const s = new RestSim(bid, br, room, {}); s.clientOf = bid; s.cust = []; return s; },
  query(x, z) { if (!G.sim) return null; if (R.hostWhere !== G.bid) return { a: 'none', label: '🌐 Work here with your host' }; return G.sim.query(R.room.pid, x, z); },
  act(x, z) { if (R.hostWhere !== G.bid) { C.toast('🌐 Restaurants run live where the host is. Head to ' + (BLD[R.hostWhere] ? BLD[R.hostWhere].name : 'your host') + '!'); return null; } R.room.send({ t: 'act', x: +x.toFixed(2), z: +z.toFixed(2) }); return null; },
  callSnowie() { R.room.send({ t: 'snowie' }); return true; },
  earn(v, what) { if (Net.isClient()) { R.room.send({ t: 'earn', v, what }); return true; } return false; },
  pushState() { if (isHost()) R.dirty = true; },
  where() { R.acc = 1; },
  relayEvent(e) { if (!isHost() || e.relayed || e.local) return; const ev = Object.assign({}, e); if (G.where === 'room' && (e.t === 'quip' || e.t === 'banner')) ev.where = G.bid; R.room.broadcast({ t: 'ev', e: ev }); },
  relayFx(f) { if (isHost() && G.bid) R.room.broadcast({ t: 'fx', f, bid: G.bid }); },
  sendLook() { if (!online()) return; const L = lookPack(); if (isHost()) { R.looks[R.room.pid] = L; R.room.broadcast({ t: 'looks', l: R.looks }); } else R.room.send(Object.assign({ t: 'look' }, L)); },
  tick(dt) { if (!online()) return; drawRemotes(dt); if (G.state !== 'play') return; R.acc += dt; R.stAcc += dt; if (R.acc < 1 / 12) return; R.acc = 0; R.n++;
    if (isHost()) { const ps = {}; ps[R.room.pid] = myPos(); for (const r of R.remote.values()) ps[r.pid] = [+r.tx.toFixed(2), +r.tz.toFixed(2), r.ry, r.sp, r.w, r.drv, r.carry || 0];
      for (const r of R.remote.values()) { if (G.sim && r.w === G.bid) r.carry = G.sim.carry[r.pid] || (r.carry === 'bag' ? 'bag' : null); }
      const m = { t: 'p', T: +S.time.toFixed(2), ps, hw: G.where === 'town' ? 'town' : G.bid }; if (G.sim) m.sim = { bid: G.bid, d: G.sim.snap() }; R.room.broadcast(m);
      if ((R.dirty && R.stAcc > 0.5) || R.stAcc > 4) sendState(); }
    else { R.room.send({ t: 'me', p: myPos() }); if (R.n % 60 === 0) Net.sendLook(); } },
};
