// Level runtime: builds an expedition (or the museum), runs explorers/actors/traps/puzzles, the over-the-shoulder camera, and co-op hooks.
import * as THREE from 'three';
import { E, setEnvironment, followShadow } from './engine.js';
import { World, clearWorldCaches } from './world.js';
import { buildLevel } from './levels.js';
import './lv_jungle.js';
import './lv_caves.js';
import './lv_tunnels.js';
import './lv_pyramid.js';
import './lv_finale.js';
import { Player } from './player.js';
import { Actors } from './actors.js';
import { FX } from './fx.js';
import { pickupGeos, makeCheckpoint, makeHook, makeRelic } from './creatures.js';
import { MATS } from './mats.js';
import { updateFrustum, LightPool, disposeDeep } from './perf.js';
import { initTraps, stepTraps, triggerBoulder, dropPlank } from './traps.js';
import { sfx, playMusic } from './audio.js';
import { S, persist, up } from './save.js';
import { LEVELS, TREASURES, EVIDENCE } from './data.js';
import { readMove, edge, held, IN } from './input.js';
const PI = Math.PI;
let PG = null;
export class Game {
  constructor(app, levelId, opts = {}) {
    this.app = app; this.levelId = levelId; this.scene = E.scene; this.net = app.net; this.hud = app.hud; this.online = !!opts.online; this.host = !opts.online || opts.host; this.seed = opts.seed || 1;
    this.L = LEVELS.find((l) => l.id === levelId) || null; this.T = 0; this.got = new Set(); this.done = false; this.tally = { coins: 0, treasures: [], evidence: [], time: 0, busted: 0, relic: false };
    PG = PG || pickupGeos();
    const w = this.world = new World(); w.game = this; buildLevel(levelId, w, this.seed); w.finalize(this.scene);
    setEnvironment(w.env); this.fx = new FX(this.scene); this.actors = new Actors(this); this.actors.spawnAll(w);
    this.extra = []; this.buildPickups(); this.lightPool = new LightPool(this.scene, w.lights, w.lightN || 4);
    this.torchLight = new THREE.PointLight(0xffb060, 0, 14, 1.4); this.scene.add(this.torchLight); this.extra.push(this.torchLight); this.fill = new THREE.PointLight(0xfff0dc, 0, 10, 1.3); this.scene.add(this.fill); this.extra.push(this.fill); this.indoorT = 0;
    initTraps(this);
    this.players = new Map(); this.me = new Player({ hero: S.hero, outfit: S.outfit, name: S.name || 'You', local: true, pid: opts.pid || 'me' }); this.me.addTo(this.scene); this.me.place(w.start, w.startYaw || 0); this.me.cp = w.start.slice(); this.me.cpYaw = w.startYaw || 0;
    if (opts.slot) { const a = opts.slot * 2.1; this.me.x += Math.cos(a) * 1.3; this.me.z += Math.sin(a) * 1.3; }
    this.players.set(this.me.pid, this.me);
    this.cam = { yaw: (w.startYaw || 0), pitch: 0.3, dist: 4.8, pos: new THREE.Vector3(), tgt: new THREE.Vector3(), snap: true, shake: 0, side: 1 };
    this.hints = new Set(); this.talked = new Set(); this.act = null; this.chase = null; this.solved = new Set();
    playMusic(w.music || levelId); this.hud.startLevel(this);
  }
  dispose() { this.world.dispose(this.scene); disposeDeep(this.world.group); this.actors.dispose(); disposeDeep(this.actors.group); this.scene.remove(this.fx.mesh); this.fx.rings.forEach((r) => this.scene.remove(r.m));
    for (const p of this.players.values()) { p.removeFrom(this.scene); disposeDeep(p.root); } this.extra.forEach((o) => { this.scene.remove(o); if (o.isLight) o.dispose(); else disposeDeep(o); }); this.lightPool.dispose(this.scene);
    for (const k in this.inst || {}) { const im = this.inst[k].im; this.scene.remove(im); im.dispose && im.dispose(); }
    clearWorldCaches(); E.renderer.renderLists.dispose(); }
  buildPickups() { const w = this.world; this.inst = {};
    for (const k of ['coin', 'treasure', 'evidence', 'heart']) { const list = w.ents.filter((e) => e.k === k); if (!list.length) continue; const mat = k === 'evidence' ? MATS.m : k === 'treasure' || k === 'coin' ? MATS.x : MATS.g;
      const im = new THREE.InstancedMesh(PG[k], mat, list.length); im.castShadow = k !== 'coin'; im.frustumCulled = false; list.forEach((e, i) => { e.ii = i; if (k === 'treasure' && this.L && (S.treasures[this.L.id] || []).includes(e.n)) e.old = true; if (k === 'evidence' && this.L && (S.evidence[this.L.id] || []).includes(e.n)) e.old = true; }); this.scene.add(im); this.extra.push(im); this.inst[k] = { im, list }; }
    this.cps = w.checkpoints.map((c) => { const m = makeCheckpoint(); const sd = c.side ?? 2.6, fx = c.x - Math.cos(c.yaw || 0) * sd, fz = c.z + Math.sin(c.yaw || 0) * sd; const gy = w.ground(fx, fz, c.y + 2, 0.3); m.root.position.set(fx, gy && gy.y > -50 ? gy.y : c.y, fz); m.root.rotation.y = c.yaw || 0; this.scene.add(m.root); this.extra.push(m.root); c.obj = m; return c; });
    for (const h of w.hooks) { const m = makeHook(); m.position.set(h.x, h.y, h.z); this.scene.add(m); this.extra.push(m); h.obj = m; }
    if (w.relicPos) { const r = makeRelic(this.L ? this.L.relic : 'jade'); r.position.set(...w.relicPos); r.visible = !w.bossSpec; this.scene.add(r); this.extra.push(r); this.relic = r; }
    if (w.escape) { const b = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 30, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0x86efac, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); const e = w.escape; b.position.set((e[0] + e[2]) / 2, e[4] + 15, (e[1] + e[3]) / 2); b.visible = false; this.scene.add(b); this.extra.push(b); this.beacon = b; } }
  alivePlayers() { const a = []; for (const p of this.players.values()) if (p.respawnT <= 0 && p.caughtT <= 0) a.push(p); return a; }
  toastMsg(m) { this.hud.toast(m); }
  // ------------------------------------------------ frame
  update(dt) { if (this.timers && this.timers.length) { const due = []; this.timers = this.timers.filter((q) => (q.t -= dt) > 0 || (due.push(q), false)); for (const q of due) q.fn(); }
    if (this.done) { this.render(dt); this.updateCam(dt); return; }
    this.T += dt; this.tally.time += dt; const w = this.world, me = this.me;
    for (const m of w.movers) { const k = 0.5 - 0.5 * Math.cos((this.T / m.period + m.phase) * PI * 2); const nx = m.base[0] + m.off[0] * k, ny = m.base[1] + m.off[1] * k, nz = m.base[2] + m.off[2] * k;
      m.s.dx = nx - m.s.min[0]; m.s.dy = ny - m.s.min[1]; m.s.dz = nz - m.s.min[2]; for (let i = 0; i < 3; i++) m.s.max[i] += [m.s.dx, m.s.dy, m.s.dz][i]; m.s.min[0] = nx; m.s.min[1] = ny; m.s.min[2] = nz; if (m.obj) m.obj.position.set(nx + m.size[0] / 2, ny, nz + m.size[2] / 2); }
    for (const d of w.doors) { const tgt = d.open ? 1 : 0; d.k = (d.k || 0) + (tgt - (d.k || 0)) * Math.min(1, dt * 2.5); if (d.obj) d.obj.position.y = d.y0 - d.k * (d.h + 0.2); d.s.off = d.k > 0.6; }
    for (const b of w.blocks) this.stepBlock(b, dt);
    for (const a of w.anims) a(dt, this.T);
    const mv = this.app.paused ? { x: 0, y: 0 } : readMove();
    const inp = this.app.paused ? {} : { mx: mv.x, my: mv.y, jumpP: edge('jump'), jumpH: held('jump'), whipP: edge('whip'), torchP: edge('torch'), actP: edge('act') };
    if (w.tick) w.tick(dt, this);
    me.update(dt, inp, this); me.updateBlob(w);
    stepTraps(dt, this);
    for (const c of this.cps) if (!c.mine && Math.hypot(me.x - c.x, me.z - c.z) < 1.8 && Math.abs(me.y - c.y) < 2) { this.cps.forEach((q) => { q.mine = false; q.obj.lamp.material.color.set(0x777777); }); c.mine = true; c.obj.lamp.material.color.set(0xffd27a); me.cp = [c.x, c.y + 0.1, c.z]; me.cpYaw = c.yaw || 0; sfx('check'); this.fx.burst(c.x, c.y + 2.2, c.z, 0xffd27a, 12); this.toastMsg('🚩 Checkpoint!'); if (me.hearts < me.maxHearts) { me.hearts = me.maxHearts; this.hud.dirty = true; } }
    for (const c of this.cps) c.obj.flag.rotation.y = Math.sin(this.T * 2 + c.x) * 0.3;
    for (const q of w.zonesAt(me.x, me.y + 0.3, me.z)) { if (q.type === 'hint' && !this.hints.has(q)) { this.hints.add(q); this.hud.hint(q.msg); } if (q.type === 'door' && !this.app.paused) this.act = { kind: 'door', id: q.level, label: q.label }; }
    for (const t of w.talks) if (!this.talked.has(t) && me.x > t.min[0] && me.x < t.max[0] && me.z > t.min[2] && me.z < t.max[2] && (!t.when || t.when(this))) { this.talked.add(t); this.hud.say(t.who, t.msg); if (t.fn) t.fn(this); }
    this.collectNear(me, dt); this.updateAct(inp);
    const dg = this.actors.dangerTo(me); if (dg) { if (dg.gust) { const dx = me.x - dg.gust.x, dz = me.z - dg.gust.z, d = Math.hypot(dx, dz) || 1; me.vx += dx / d * 60 * dg.k * dt; me.vz += dz / d * 60 * dg.k * dt; } else if (dg.push) me.knock(dg.push, 6); else if (dg.hurt) me.hurt(this, dg.hurt, 'hit'); }
    for (const p of this.players.values()) if (!p.local) { p.remoteUpdate(dt); p.updateBlob(w); }
    if (this.host) this.actors.step(dt); else this.actors.lerpRemote(dt);
    if (this.host) this.hostLogic(dt);
    this.chaseTick(dt);
    this.net.tick && this.net.tick(dt, this);
    this.updateCam(dt); updateFrustum(E.camera); this.actors.render(dt); this.animPickups(dt); this.render(dt); this.hud.update(dt, this);
  }
  render(dt) { const me = this.me; this.fx.update(dt); followShadow(me.x, me.y, me.z); this.lightPool.update(dt, me.x, me.y + 2, me.z); this.world.updateLod(E.camera.position.x, E.camera.position.y, E.camera.position.z);
    const L = this.torchLight, on = me.torch && me.respawnT <= 0; const want = on ? (this.world.dark ? 26 : 12) * (1 + up('torch') * 0.25) : 0; L.intensity += (want - L.intensity) * Math.min(1, dt * 8); L.distance = 14 + up('torch') * 4;
    // hero fill light: under a roof the hero would read dark in the shade, so a soft warm light rides between hero and camera
    this.indoorT -= dt; if (this.indoorT <= 0) { this.indoorT = 0.25; const w = this.world; this.indoor = w.near(me.x - 0.2, me.z - 0.2, me.x + 0.2, me.z + 0.2, []).some((q) => !q.off && q.min[1] > me.y + 2 && q.min[1] < me.y + 14 && me.x > q.min[0] && me.x < q.max[0] && me.z > q.min[2] && me.z < q.max[2]); }
    { const F = this.fill, c = E.camera.position, want = this.indoor ? (this.world.fillI || 2.6) : 0; F.intensity += (want - F.intensity) * Math.min(1, dt * 4); F.position.set(me.x + (c.x - me.x) * 0.8, me.y + 2.6, me.z + (c.z - me.z) * 0.8); }
    if (on) { const f = me.rig.torch.userData.flame; f.getWorldPosition(L.position); L.intensity *= 0.94 + Math.sin(this.T * 23) * 0.04 + Math.sin(this.T * 37) * 0.03; } }
  // ------------------------------------------------ puzzles (host decides)
  hostLogic(dt) { const w = this.world; const ps = this.alivePlayers();
    for (const pl of w.plates) { let on = ps.some((p) => Math.abs(p.x - pl.x) < pl.r + 0.2 && Math.abs(p.z - pl.z) < pl.r + 0.2 && Math.abs(p.y - pl.y - 0.25) < 0.8); for (const b of w.blocks) if (Math.abs(b.x - pl.x) < pl.r && Math.abs(b.z - pl.z) < pl.r) on = true; if (on !== pl.on) { pl.on = on; sfx(on ? 'plate' : 'click'); if (this.online) this.net.bc({ t: 'plate', id: pl.id, on }); } }
    for (const d of w.doors) if (!d.open) { const ok = d.need.every((id) => this.isOn(id)); if (ok) this.setDoor(d.id, true); } }
  isOn(id) { const w = this.world; if (id === 'boss') return !!(this.actors.boss && this.actors.boss.dead); if (id.startsWith('S:')) return this.solved.has(id.slice(2)); const pl = w.plates.find((q) => q.id === id); if (pl) return pl.on; const lv = w.levers.find((q) => q.id === id); if (lv) return lv.on; const b = w.braziers.find((q) => q.id === id); if (b) return b.lit; return false; }
  setDoor(id, open, remote) { const d = this.world.doors.find((q) => q.id === id); if (!d || d.open === open) return; d.open = open; sfx('door'); this.cam.shake = 0.2; if (open && d.msg) this.toastMsg(d.msg); if (!remote && this.online && this.host) this.net.bc({ t: 'door', id, open }); }
  puzzle(what, id, remote) { const w = this.world; // apply a puzzle action (host) and tell everyone
    if (!this.host && !remote) { this.net.send({ t: 'puz', what, id }); return; }
    if (what === 'lever') { const lv = w.levers.find((q) => q.id === id); if (!lv || lv.on) return; lv.on = true; sfx('lever'); }
    else if (what === 'brazier') { const b = w.braziers.find((q) => q.id === id); if (!b || b.lit) return; b.lit = true; b.obj.visible = true; w.lights.push({ x: b.x, y: b.y + 2, z: b.z, c: 0xff9a3c, i: 22, d: 20 }); sfx('fire'); this.fx.burst(b.x, b.y + 1.6, b.z, 0xffa53d, 16); const n = w.braziers.filter((q) => q.lit).length; this.toastMsg(`🔥 Brazier lit! ${n}/${w.braziers.length}`); }
    else if (what === 'statue') { const st = w.statues.find((q) => q.id === id); if (!st) return; st.rot = (st.rot + 1) % 4; sfx('stone'); const grp = w.statues.filter((q) => q.group === st.group); if (grp.every((q) => q.rot === q.target) && !this.solved.has(st.group)) { this.solved.add(st.group); sfx('solve'); this.toastMsg('✨ Click! The statues line up!'); } }
    if (this.online && this.host) this.net.bc({ t: 'puzR', what, id, st: this.puzState() }); }
  puzState() { const w = this.world; return { lv: w.levers.map((l) => l.on ? 1 : 0), br: w.braziers.map((b) => b.lit ? 1 : 0), stt: w.statues.map((s) => s.rot), sv: [...this.solved] }; }
  applyPuzState(s) { const w = this.world; (s.lv || []).forEach((v, i) => { if (w.levers[i]) w.levers[i].on = !!v; }); (s.br || []).forEach((v, i) => { const b = w.braziers[i]; if (b && !!v && !b.lit) { b.lit = true; b.obj.visible = true; w.lights.push({ x: b.x, y: b.y + 2, z: b.z, c: 0xff9a3c, i: 22, d: 20 }); sfx('fire'); } }); (s.stt || []).forEach((v, i) => { if (w.statues[i]) w.statues[i].rot = v; }); this.solved = new Set(s.sv || []); }
  tryPush(b, wish, p) { if (b.mv) return; const ax = Math.abs(wish[0]) > Math.abs(wish[1]) ? 0 : 2; const dir = Math.sign(ax === 0 ? wish[0] : wish[1]); const dx = p.x - b.x, dz = p.z - b.z; if (ax === 0 ? Math.sign(-dx) !== dir || Math.abs(dz) > b.size * 0.55 : Math.sign(-dz) !== dir || Math.abs(dx) > b.size * 0.55) return;
    const tx = b.x + (ax === 0 ? dir * b.size : 0), tz = b.z + (ax === 2 ? dir * b.size : 0); const w = this.world, h = b.size / 2 - 0.05;
    const c = w.near(tx - h, tz - h, tx + h, tz + h, []); for (const s of c) { if (s === b.s || s.off) continue; if (s.max[1] <= b.y + 0.32 || s.min[1] >= b.y + b.size || s.plate) continue; if (tx + h > s.min[0] && tx - h < s.max[0] && tz + h > s.min[2] && tz - h < s.max[2]) { sfx('deny'); return; } }
    const gr = w.ground(tx, tz, b.y + 0.2, 0.0); if (Math.abs(gr.y - b.y) > 0.3) { sfx('deny'); return; }
    this.moveBlock(b, tx, tz); if (this.online) (this.host ? this.net.bc({ t: 'push', id: b.id, x: tx, z: tz }) : this.net.send({ t: 'push', id: b.id, x: tx, z: tz })); }
  moveBlock(b, tx, tz) { b.mv = { fx: b.x, fz: b.z, tx, tz, t: 0 }; sfx('push'); }
  stepBlock(b, dt) { const m = b.mv; if (!m) { b.s.dx = b.s.dz = 0; return; } m.t = Math.min(1, m.t + dt / 0.45); const k = m.t * m.t * (3 - 2 * m.t); const nx = m.fx + (m.tx - m.fx) * k, nz = m.fz + (m.tz - m.fz) * k; b.s.dx = nx - b.x; b.s.dz = nz - b.z; b.s.dy = 0; b.x = nx; b.z = nz;
    const h = b.size / 2; b.s.min[0] = b.x - h; b.s.max[0] = b.x + h; b.s.min[2] = b.z - h; b.s.max[2] = b.z + h; b.obj.position.set(b.x, b.y, b.z); if (Math.random() < 0.4) this.fx.puff(b.x, b.y, b.z, 1, 0xd6d3d1); if (m.t >= 1) b.mv = null; }
  onPlank(p) { dropPlank(this, p); }
  // ------------------------------------------------ pickups
  collectNear(p, dt) { for (const e of this.world.ents) { if (e.got) continue; const dx = p.x - e.x, dy = p.y + 0.9 - e.y, dz = p.z - e.z, d = Math.hypot(dx, dy, dz);
      if (e.k === 'coin' && d < 2.2 && d > 0.6) { const s = Math.min(1, dt * 9); e.x += dx * s; e.y += dy * s; e.z += dz * s; }
      if (d < (e.k === 'coin' ? 1.0 : 1.3)) this.pick(e.id, p.pid, true); }
    if (this.relic && this.relic.visible && !this.tally.relic && Math.hypot(p.x - this.relic.position.x, p.z - this.relic.position.z) < 1.8 && Math.abs(p.y + 1 - this.relic.position.y) < 2.4) { if (this.host) this.gotRelic(); else this.net.send({ t: 'relic' }); this.relic.visible = false; }
    const e = this.world.escape; if (this.chase && e && p.x > e[0] && p.x < e[2] && p.z > e[1] && p.z < e[3] && Math.abs(p.y - e[4]) < 3) { if (this.host) this.finish(); else this.net.send({ t: 'escape' }); } }
  pick(id, pid, local) { const e = this.world.ents[id]; if (!e || e.got) return; if (!this.host && local) this.net.send({ t: 'pick', id }); this.applyPick(e, pid); if (this.host && this.online) this.net.bc({ t: 'got', id, pid }); }
  applyPick(e, pid) { if (e.got) return; e.got = true; this.got.add(e.id); const T = this.tally, lid = this.L && this.L.id;
    if (e.k === 'coin') { T.coins++; sfx('coin'); this.fx.sparkle(e.x, e.y, e.z, 0xffd23f); }
    else if (e.k === 'treasure') { T.treasures.push(e.n); sfx('treasure'); this.fx.burst(e.x, e.y, e.z, 0x22d3ee, 18); this.toastMsg(`🏺 ${lid ? TREASURES[lid][e.n] : 'Treasure'}! ${T.treasures.length}/5`); }
    else if (e.k === 'evidence') { T.evidence.push(e.n); sfx('evidence'); this.fx.burst(e.x, e.y, e.z, 0xfdf6e3, 16); this.hud.evidence(lid ? EVIDENCE[lid][e.n] : 'A clue!', T.evidence.length); }
    else if (e.k === 'heart') { sfx('heart'); for (const p of this.players.values()) if (p.local) p.hearts = Math.min(p.maxHearts, p.hearts + 1); }
    this.hud.dirty = true; }
  animPickups(dt) { const t = this.T, m = this._m || (this._m = new THREE.Matrix4()), q = this._q || (this._q = new THREE.Quaternion()), s = this._s || (this._s = new THREE.Vector3()), v = this._v || (this._v = new THREE.Vector3()), upv = new THREE.Vector3(0, 1, 0);
    for (const k in this.inst) { const { im, list } = this.inst[k]; for (const e of list) { const sc = e.got ? 0 : e.old ? 0.75 : 1; q.setFromAxisAngle(upv, t * (k === 'coin' ? 3 : 1.5) + e.id); v.set(e.x, e.y + Math.sin(t * 3 + e.id) * 0.12, e.z); s.setScalar(sc); m.compose(v, q, s); im.setMatrixAt(e.ii, m); } im.instanceMatrix.needsUpdate = true; }
    if (this.relic && this.relic.visible) { this.relic.rotation.y = t * 1.2; this.relic.position.y = this.world.relicPos[1] + Math.sin(t * 2) * 0.15; if (Math.random() < 0.3) this.fx.sparkle(this.relic.position.x, this.relic.position.y, this.relic.position.z, 0xfff1a8); }
    for (const h of this.world.hooks) { const on = h === this.hookT; h.obj.scale.setScalar(on ? 1.25 + Math.sin(t * 10) * 0.1 : 1); h.obj.rotation.y = t * 0.8; }
    if (this.world.beams) for (const b of this.world.beams) b.obj.visible = this.solved.has(b.group);
    for (const st of this.world.statues) { const want = st.rot * PI / 2; let d = want - st.obj.rotation.y; st.obj.rotation.y += d * Math.min(1, dt * 6); }
    for (const pl of this.world.plates) if (pl.obj) pl.obj.position.y += ((pl.on ? pl.y + 0.02 : pl.y + 0.12) - pl.obj.position.y) * Math.min(1, dt * 10);
    for (const lv of this.world.levers) if (lv.obj) lv.obj.rotation.z += ((lv.on ? -0.6 : 0.6) - lv.obj.rotation.z) * Math.min(1, dt * 8);
    if (this.beacon) { this.beacon.visible = !!this.chase; this.beacon.material.opacity = 0.14 + Math.sin(t * 4) * 0.06; } }
  // ------------------------------------------------ whip / torch
  onWhip(p) { const R = 3.6 + up('whip') * 0.6, fx = Math.sin(p.yaw), fz = Math.cos(p.yaw); let best = null, bd = R + 1;
    const cand = []; for (const e of this.actors.list) if (!e.dead) cand.push({ id: e.id, x: e.x, y: e.y + 0.5, z: e.z, r: e.D.r }); for (const c of this.actors.cops) if (c.st !== 'gone') cand.push({ id: c.id, x: c.x, y: c.y + 1, z: c.z, r: 0.5 });
    const B = this.actors.boss; if (B && B.active && !B.dead) cand.push({ id: 'boss', x: B.x, y: B.y + 1.5, z: B.z, r: B.D.r });
    for (const c of cand) { const dx = c.x - p.x, dz = c.z - p.z, d = Math.hypot(dx, dz) - c.r; if (d < bd && d < R && Math.abs(c.y - p.y) < 3 && (dx * fx + dz * fz) / (Math.hypot(dx, dz) || 1) > 0.25) { bd = d; best = c; } }
    for (const lv of this.world.levers) if (!lv.on && Math.hypot(lv.x - p.x, lv.z - p.z) < R + 1.5 && Math.abs(lv.y - p.y) < 3) { best = best || { lever: lv, x: lv.x, y: lv.y + 1, z: lv.z }; }
    p.whipTo = best ? { x: best.x, y: best.y, z: best.z } : { x: p.x + fx * R, y: p.y + 1.1, z: p.z + fz * R };
    if (best) { p.yaw = Math.atan2(best.x - p.x, best.z - p.z); this.later(0.12, () => { if (best.lever) this.puzzle('lever', best.lever.id); else this.dealDamage(best.id, 1, p); sfx('crack'); this.fx.burst(best.x, best.y, best.z, 0xffffff, 8, 3); }); }
    else this.later(0.12, () => { sfx('crack'); this.fx.burst(p.whipTo.x, p.whipTo.y, p.whipTo.z, 0xfde68a, 5, 2); }); }
  // game-time timers (whip crack lands 0.12 s of GAME time later, so a frame hitch can never make a hit miss the boss's tired window)
  later(t, fn) { (this.timers || (this.timers = [])).push({ t, fn }); }
  dealDamage(id, dmg, from) { if (this.host) this.actors.damage(id, dmg, from); else this.net.send({ t: 'hit', id, dmg }); }
  hookTarget(p) { const rng = p.whipRange; let best = null, bs = -1e9; const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw);
    for (const h of this.world.hooks) { const dx = h.x - p.x, dy = h.y - p.y, dz = h.z - p.z, dh = Math.hypot(dx, dz), d = Math.hypot(dx, dy, dz); if (d > rng || dh < 1.0 || dy < 1.2) continue; const fr = (dx * fx + dz * fz) / (dh || 1); if (fr < -0.2) continue; const sc = fr * 4 - d * 0.3;
      const dir = new THREE.Vector3(dx, dy - 1.4, dz).normalize(); const o = new THREE.Vector3(p.x, p.y + 1.4, p.z); const hit = this.world.ray(o, dir, d - 0.8, (s) => !s.off && !s.nocam); if (hit < d - 1.0) continue; if (sc > bs) { bs = sc; best = h; } }
    return best; }
  // ------------------------------------------------ interactions (ACT button)
  updateAct(inp) { const me = this.me; let a = this.act && this.act.kind === 'door' ? this.act : null; this.act = null; const w = this.world, near = (o, r = 2.2) => Math.hypot(me.x - o.x, me.z - o.z) < r && Math.abs(me.y - o.y) < 2;
    const m = this.actors.martina; if (m && Math.hypot(me.x - m.x, me.z - m.z) < 3.4) a = { kind: 'fn', label: m.label || '🐢 Talk to Martina', fn: () => this.hud.say('martina', w.martinaSay ? w.martinaSay(this) : 'Need a hint, explorer?') };
    for (const lv of w.levers) if (!lv.on && near(lv, 2)) a = { kind: 'lever', id: lv.id, label: '🔧 Pull lever' };
    for (const b of w.braziers) if (!b.lit && near(b, 2.4)) a = me.torch ? { kind: 'brazier', id: b.id, label: '🔥 Light brazier' } : { kind: 'none', label: '🔥 Light your TORCH first' };
    for (const st of w.statues) if (near(st, 2.2)) a = { kind: 'statue', id: st.id, label: '🗿 Turn statue' };
    if (!this.chase) for (const q of w.zonesAt(me.x, me.y + 0.3, me.z)) if (q.type === 'hide' && !me.hidden) a = { kind: 'hide', label: q.kind === 'bush' ? '🌿 Hide in the bush' : '🫥 Hide' };
    if (me.hidden) a = { kind: 'unhide', label: '👀 Come out' };
    for (const k of w.kiosks) if (Math.hypot(me.x - k.x, me.z - k.z) < k.r && Math.abs(me.y - k.y) < (k.dy || 2.5) && (!k.when || k.when(this))) a = { kind: 'kiosk', id: k.id, label: typeof k.label === 'function' ? k.label(this) : k.label, fn: k.fn };
    this.hookT = this.hookTarget(me); this.hud.setAct(a, !!this.hookT); this.curAct = a;
    if (a && inp.actP) this.doAct(a, me); }
  doAct(a, p) { sfx('click');
    if (a.kind === 'lever') this.puzzle('lever', a.id); else if (a.kind === 'brazier') this.puzzle('brazier', a.id); else if (a.kind === 'statue') this.puzzle('statue', a.id);
    else if (a.kind === 'hide') { p.hidden = true; p.vx = p.vz = 0; sfx('rustle'); this.toastMsg('🌿 Shhh... hidden! The Patrol can\u2019t see you'); }
    else if (a.kind === 'unhide') { p.hidden = false; }
    else if (a.kind === 'door') this.app.enterLevelDoor(a.id);
    else if (a.kind === 'kiosk') { if (a.fn) a.fn(this.app, this); else this.app.openKiosk(a.id); }
    else if (a.kind === 'fn' && a.fn) a.fn(this.app, this); }
  onHide() {}
  // ------------------------------------------------ the Relic Patrol
  catchPlayer(p, c) { if (p.local) p.arrest(this, c); else this.net.sendTo(p.pid, { t: 'busted', by: c.name }); }
  onBusted(p, by) { const name = by && by.name ? by.name : by || 'the Relic Patrol'; this.tally.busted++; S.busted = (S.busted || 0) + 1; const lose = Math.min(this.tally.coins, 10); this.tally.coins -= lose; sfx('busted'); this.hud.busted(name, lose); this.hud.dirty = true; if (this.chase) this.chase.resetT = 1.9; }
  startChase(remote) { const w = this.world, sp = w.chaseSpec; if (!sp || this.chase) return; this.chase = { t: 0, resetT: 0 }; const A = this.actors;
    sp.list.forEach((o) => { const c = A.addCop(Object.assign({}, o, { st: 'chase' }), sp.bounds, { chase: true }); c.home = [o.x, o.y || 0, o.z]; c.tgt = this.me; c.lx = this.me.x; c.lz = this.me.z; c.t = -1.2; });
    playMusic('chase'); this.hud.banner('🚨 THE RELIC PATROL! RUN TO THE EXIT! 🚨'); sfx('siren'); if (!remote && this.online && this.host) this.net.bc({ t: 'chase' }); }
  chaseTick(dt) { const ch = this.chase; if (!ch) return; ch.t += dt; if (ch.resetT > 0) { ch.resetT -= dt; if (ch.resetT <= 0 && this.host) for (const c of this.actors.cops) if (c.chase && c.home) { c.x = c.home[0]; c.y = c.home[1]; c.z = c.home[2]; c.st = 'chase'; c.t = -1.5; c.lostT = 0; } } }
  onChaseLost(c) { if (this.actors.cops.filter((q) => q.chase).every((q) => q.st === 'gone')) this.toastMsg('😎 You lost them! Now get to the exit!'); }
  // ------------------------------------------------ events
  onAnimalGone(e) { S.animals[e.type] = (S.animals[e.type] || 0) + 1; if (this.online && this.host) this.net.bc({ t: 'gone', id: e.id }); }
  onFaint(p) { this.toastMsg('😵 Out of hearts! Back to the flag'); }
  onTorch(p) { if (this.online) {} }
  onBossStart(B, remote) { this.hud.boss(B); sfx('boss'); playMusic('boss'); this.hud.say('vintage', ['"Ah, the meddling explorer! Meet my Vine-Chopper!"', '"Behold, the Drill-o-Matic! Bow before its... drilliness!"', '"All aboard the Vintage Express! Next stop: YOUR DEFEAT!"', '"I am the MUMMY now! Mwahaha... *cough* bandages are itchy"', '"You again?! Fine. Face my Sky Suit!"'][Math.max(0, LEVELS.findIndex((l) => l.boss === B.type))]); }
  onBossReset(B) { this.hud.boss(null); playMusic(this.world.music || this.levelId); }
  onBossDefeated(B, remote) { this.hud.boss(null); sfx('win'); this.fx.confetti(B.x, B.y + 3, B.z, 90); this.cam.shake = 0.5; this.hud.say('vintage', B.type === 'zeppelin' ? '"NOOO! My beautiful plan! ...Is that the Relic Patrol? Uh oh."' : '"Curses! You win THIS time! Ta-ta!" (Vintage floats away on a tiny balloon)'); playMusic(this.world.music || this.levelId);
    if (this.relic) { this.relic.visible = true; } this.toastMsg('✨ The ' + (this.L ? this.L.n.split(' of ').pop() : 'relic') + ' relic is free! Grab it!'); }
  gotRelic(remote) { if (this.tally.relic) return; this.tally.relic = true; if (this.relic) this.relic.visible = false; sfx('relic'); this.fx.confetti(this.me.x, this.me.y + 2, this.me.z, 120); this.hud.banner('✨ ' + (this.L ? this.L.n.split(' of ').pop() + ' recovered!' : 'Relic!') + ' ✨'); this.me.wave = 2;
    const rp = this.world.relicPos; if (rp) { this.me.cp = [rp[0], rp[1] - 1.4, rp[2] + 2]; }
    if (this.online && this.host && !remote) this.net.bc({ t: 'relic' });
    if (this.world.chaseSpec) setTimeout(() => { if (this.host) this.startChase(); }, 1800); else setTimeout(() => { if (this.host) this.finish(); }, 2200); }
  finish(remote) { if (this.done) return; this.done = true; sfx('win'); this.fx.confetti(this.me.x, this.me.y + 2, this.me.z, 140); const T = this.tally;
    for (const c of this.actors.cops) { c.st = 'search'; c.chase = false; }
    const res = { level: this.levelId, coins: T.coins, treasures: T.treasures.slice(), evidence: T.evidence.slice(), time: T.time, busted: T.busted, relic: T.relic };
    if (this.online && this.host && !remote) this.net.bc({ t: 'done', res }); this.me.wave = 3;
    setTimeout(() => this.app.levelDone(res), 1700); }
  // ------------------------------------------------ over-the-shoulder camera (never clips walls, floors or ceilings)
  updateCam(dt) { const c = this.cam, me = this.me, cam = E.camera, sens = (S.opts.camSens || 1), w = this.world;
    if (IN.camDX || IN.camDY) { c.yaw -= IN.camDX * 0.0085 * sens * (S.opts.invertX ? -1 : 1); c.pitch = Math.max(-0.25, Math.min(1.1, c.pitch + IN.camDY * 0.005 * sens)); IN.camDX = IN.camDY = 0; }
    const manual = performance.now() - IN.lastCam < 1600;
    if (!manual && me.speed > 1 && !me.swing) { let d = me.yaw - c.yaw; while (d > PI) d -= PI * 2; while (d < -PI) d += PI * 2; if (Math.abs(d) < 2.3) c.yaw += d * Math.min(1, dt * 0.8 * (me.speed / 6.5)); }
    const B = this.actors.boss; const bossOn = B && B.active && !B.dead; let want = bossOn ? 8.5 : (w.camDist || 4.8); let pmax = 1.1;
    for (const q of w.zonesAt(me.x, me.y + 0.3, me.z)) if (q.type === 'camz') { want = Math.min(want, q.dist); pmax = q.pmax || pmax; }
    if (c.pitch > pmax) c.pitch += (pmax - c.pitch) * Math.min(1, dt * 4);
    c.dist += (want - c.dist) * Math.min(1, dt * 2);
    const ty = me.y + 1.55 + Math.min(0, me.vy) * 0.02; if (c.snap) c.tgt.set(me.x, ty, me.z); else { c.tgt.x = me.x; c.tgt.z = me.z; c.tgt.y += (ty - c.tgt.y) * (1 - Math.exp(-dt * (me.onGround ? 7 : 3.5))); }
    // shoulder offset (right side), shrinks when a wall is close on that side
    const rx = Math.cos(c.yaw), rz = -Math.sin(c.yaw); const sideWant = bossOn ? 0.2 : 0.55; const blk = (q) => !q.off && !q.nocam && !q.floor && (q.camBlock || q.ceil || (q.max[1] - q.min[1]) > 0.9);
    const so = w.ray(c.tgt, new THREE.Vector3(rx, 0, rz), sideWant + 0.4, blk); const side = Math.max(0, Math.min(sideWant, so - 0.4)); c.side += (side - c.side) * Math.min(1, dt * 6);
    const piv = new THREE.Vector3(c.tgt.x + rx * c.side, c.tgt.y, c.tgt.z + rz * c.side);
    const dir = new THREE.Vector3(-Math.sin(c.yaw) * Math.cos(c.pitch), Math.sin(c.pitch), -Math.cos(c.yaw) * Math.cos(c.pitch));
    // "sphere cast": centre + 4 offset rays, take the nearest hit, keep a margin
    let d = w.ray(piv, dir, c.dist + 0.6, blk); const up_ = new THREE.Vector3(0, 1, 0), rt = new THREE.Vector3().crossVectors(dir, up_).normalize(), u2 = new THREE.Vector3().crossVectors(rt, dir).normalize();
    for (const [a, b] of [[0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]]) { const o = piv.clone().addScaledVector(rt, a).addScaledVector(u2, b); d = Math.min(d, w.ray(o, dir, c.dist + 0.6, blk)); }
    d = Math.max(0.6, Math.min(c.dist, d - 0.4));
    if (c.cd == null || c.snap) c.cd = d; else if (d < c.cd - 0.05) c.cd += (d - c.cd) * Math.min(1, dt * 12); else if (d > c.cd + 0.3) c.cd += (d - c.cd) * Math.min(1, dt * 2.0);
    const want3 = piv.clone().addScaledVector(dir, c.cd);
    const gy = w.ground(want3.x, want3.z, want3.y + 0.4, 0.3).y; const minY = (gy > -1e8 ? gy : me.y) + 0.45; if (want3.y < minY) want3.y = minY;
    // ceiling check above the camera spot
    const ceil = w.ray(new THREE.Vector3(want3.x, me.y + 1.0, want3.z), up_, 30, (q) => !q.off && !q.nocam); const maxY = me.y + 1.0 + ceil - 0.35; if (want3.y > maxY) want3.y = Math.max(minY, maxY);
    if (c.snap) { c.pos.copy(want3); c.snap = false; } else { const kx = 1 - Math.exp(-dt * 16), ky = 1 - Math.exp(-dt * 10); c.pos.x += (want3.x - c.pos.x) * kx; c.pos.z += (want3.z - c.pos.z) * kx; c.pos.y += (want3.y - c.pos.y) * ky; }
    // final safety: if the smoothed spot is inside a solid, take the safe spot this frame
    if (this.insideSolid(c.pos)) c.pos.copy(want3);
    cam.position.copy(c.pos); if (c.shake > 0) { c.shake = Math.max(0, c.shake - dt); cam.position.x += (Math.random() - 0.5) * c.shake * 0.6; cam.position.y += (Math.random() - 0.5) * c.shake * 0.6; }
    me.camHide = c.cd < 0.9; cam.lookAt(piv.x, piv.y + 0.05, piv.z);
    const fov = E.baseFov + (bossOn ? 4 : 0) + (this.chase ? 3 : 0); if (Math.abs(cam.fov - fov) > 0.1) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 3); cam.updateProjectionMatrix(); } }
  insideSolid(p) { const c = this.world.near(p.x - 0.3, p.z - 0.3, p.x + 0.3, p.z + 0.3, this._ins || (this._ins = [])); for (const s of c) { if (s.off || s.nocam) continue; if (p.x > s.min[0] - 0.12 && p.x < s.max[0] + 0.12 && p.y > s.min[1] - 0.12 && p.y < s.max[1] + 0.12 && p.z > s.min[2] - 0.12 && p.z < s.max[2] + 0.12) return true; } return false; }
  // ------------------------------------------------ remote players
  addRemote(pid, info, slot) { if (this.players.has(pid)) return this.players.get(pid); const p = new Player({ hero: info.hero, outfit: info.outfit, name: info.name, pid, slot }); p.addTo(this.scene); p.place(this.world.start); this.players.set(pid, p); this.hud.dirty = true; return p; }
  removeRemote(pid) { const p = this.players.get(pid); if (!p || p.local) return; p.removeFrom(this.scene); this.players.delete(pid); this.hud.dirty = true; }
}
export { triggerBoulder, dropPlank };
