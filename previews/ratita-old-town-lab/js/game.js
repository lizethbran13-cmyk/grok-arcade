// Level runtime: builds a room, runs players/actors/pickups/doors/movers, camera, and co-op sync hooks.
import * as THREE from 'three';
import { E, setEnvironment, followShadow } from './engine.js';
import { World, clearWorldCaches } from './world.js';
import { buildLevel } from './levels.js';
import './levels2.js';
import { Player } from './player.js';
import { Actors } from './actors.js';
import { FX } from './fx.js';
import { pickupGeos, makeBaby, makeCheckpoint, makeHook, makeShot, animRat } from './models.js';
import { MATS } from './mats.js';
import { updateFrustum, LightPool, disposeDeep } from './perf.js';
import { sfx, playMusic } from './audio.js';
import { S, persist, up } from './save.js';
import { LEVELS, gadgetsFor } from './data.js';
import { readMove, edge, held, IN } from './input.js';
import { piratePickupGeos, makeChest, makeMapGoal } from './pmodels.js';
import { myDress } from './pirate.js';
import './plevels.js';
import './oldtown.js';
const PI = Math.PI;
let PG = null, PGP = null;
export class Game {
  constructor(app, levelId, opts = {}) {
    this.app = app; this.levelId = levelId; this.scene = E.scene; this.net = app.net; this.hud = app.hud; this.online = !!opts.online; this.host = !opts.online || opts.host; this.seed = opts.seed || 1;
    this.levelIdx = LEVELS.findIndex((l) => l.id === levelId); this.T = 0; this.got = new Set(); this.done = false; this.tally = { crumbs: 0, cheese: 0, parts: [], babies: [], time: 0, crates: 0 };
    PG = PG || pickupGeos();
    const w = this.world = new World(); w.game = this; buildLevel(levelId, w, this.seed); w.finalize(this.scene);
    setEnvironment(w.env); this.applyFog();
    this.fx = new FX(this.scene); this.actors = new Actors(this); this.actors.spawnAll(w);
    this.buildPickups(); this.buildLights();
    this.players = new Map(); const gad = levelId === 'hq' ? gadgetsFor(0, S) : gadgetsFor(this.levelIdx, S);
    this.pirate = !!w.pirate; this.me = new Player({ rat: w.forceRat || S.rat, outfit: S.outfit, dress: myDress(), name: S.name || 'You', local: true, gadgets: w.gadgets ? new Set(w.gadgets) : gad, pid: opts.pid || 'me' }); this.me.addTo(this.scene); this.me.place(w.start, w.startYaw || 0); this.me.cp = w.start.slice(); this.me.cpYaw = w.startYaw || 0;
    if (opts.slot) { const a = (opts.slot) * 2.1; this.me.x += Math.cos(a) * 1.2; this.me.z += Math.sin(a) * 1.2; }
    this.players.set(this.me.pid, this.me);
    this.cam = { yaw: (w.startYaw || 0), pitch: 0.36, dist: 6.6, pos: new THREE.Vector3(), tgt: new THREE.Vector3(), snap: true, shake: 0 };
    this.shots = []; this.hints = new Set(); this.msgT = 0; this.act = null;
    playMusic(w.music || levelId); this.hud.startLevel(this);
  }
  applyFog() { const f = this.world.env; if (this.scene.fog) { this.scene.fog.color.set(f.fog); this.scene.fog.density = f.fogD || 0.004; } }
  dispose() { this.world.dispose(this.scene); disposeDeep(this.world.group); this.actors.dispose(); disposeDeep(this.actors.group); this.scene.remove(this.fx.mesh); this.fx.rings.forEach((r) => this.scene.remove(r.m));
    for (const p of this.players.values()) { p.removeFrom(this.scene); disposeDeep(p.root); } this.extra.forEach((o) => { this.scene.remove(o); disposeDeep(o); }); if (this.lightPool) this.lightPool.dispose(this.scene);
    for (const k in this.inst || {}) { const im = this.inst[k].im; this.scene.remove(im); im.dispose && im.dispose(); }
    clearWorldCaches(); E.renderer.renderLists.dispose(); }
  buildPickups() {
    const w = this.world; this.extra = []; this.inst = {}; const PGX = w.pirate ? Object.assign({}, PG, PGP || (PGP = piratePickupGeos())) : PG;
    for (const k of ['crumb', 'cheese', 'part', 'heart']) { const list = w.ents.filter((e) => e.k === k); if (!list.length) continue; const mat = k === 'part' ? MATS.g : k === 'heart' ? MATS.g : MATS.g;
      const im = new THREE.InstancedMesh(PGX[k], mat, list.length); im.castShadow = k !== 'crumb'; im.frustumCulled = false; list.forEach((e, i) => { e.ii = i; }); this.scene.add(im); this.extra.push(im); this.inst[k] = { im, list }; }
    this.babies = w.ents.filter((e) => e.k === 'baby').map((e, i) => { const b = w.pirate ? makeChest(i) : makeBaby(i); b.root.position.set(e.x, e.y, e.z); this.scene.add(b.root); this.extra.push(b.root); e.obj = b; return e; });
    this.crates = w.ents.filter((e) => e.k === 'crate');
    this.cps = w.checkpoints.map((c) => { const m = makeCheckpoint(); m.root.position.set(c.x, c.y, c.z); m.root.rotation.y = c.yaw || 0; this.scene.add(m.root); this.extra.push(m.root); c.obj = m; return c; });
    this.hookObjs = w.hooks.map((h) => { const m = makeHook(); m.position.set(h.x, h.y, h.z); this.scene.add(m); this.extra.push(m); h.obj = m; return h; });
    if (w.goldPos) { const g = w.pirate && !w.finalGold ? makeMapGoal() : new THREE.Mesh(PG.gold, MATS.x); g.castShadow = true; g.position.set(...w.goldPos); g.visible = !w.bossSpec; this.scene.add(g); this.extra.push(g); this.gold = g; const halo = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.18, depthWrite: false, toneMapped: false })); g.add(halo); }
    this.shotGeo = makeShot();
  }
  buildLights() { this.lightPool = new LightPool(this.scene, this.world.lights, 4); this.lightsAdded = []; }
  alivePlayers() { const a = []; for (const p of this.players.values()) if (p.respawnT <= 0) a.push(p); return a; }
  toastMsg(m) { this.hud.toast(m); }
  // ------------------------------------------------ frame
  update(dt) {
    if (this.done) { this.render(dt); return; }
    this.T += dt; this.tally.time += dt; const w = this.world, me = this.me;
    // movers / doors
    for (const m of w.movers) { const k = 0.5 - 0.5 * Math.cos((this.T / m.period + m.phase) * PI * 2); const ox = m.s.min[0]; const nx = m.base[0] + m.off[0] * k, ny = m.base[1] + m.off[1] * k, nz = m.base[2] + m.off[2] * k;
      m.s.dx = nx - m.s.min[0]; m.s.dy = ny - m.s.min[1]; m.s.dz = nz - m.s.min[2]; for (let i = 0; i < 3; i++) { m.s.max[i] += [m.s.dx, m.s.dy, m.s.dz][i]; } m.s.min[0] = nx; m.s.min[1] = ny; m.s.min[2] = nz; if (m.obj) m.obj.position.set(nx + m.size[0] / 2, ny, nz + m.size[2] / 2); }
    for (const d of w.doors) { const tgt = d.open ? 1 : 0; d.k = (d.k || 0) + (tgt - (d.k || 0)) * Math.min(1, dt * 3); if (d.obj) d.obj.position.y = d.y0 - d.k * (d.h + 0.2); d.s.off = d.k > 0.6; }
    for (const a of w.anims) a(dt, this.T);
    // local player
    const mv = this.app.paused ? { x: 0, y: 0 } : readMove();
    const inp = this.app.paused ? {} : { mx: mv.x, my: mv.y, jumpP: edge('jump'), jumpH: held('jump'), spinP: edge('spin'), blastP: edge('blast'), hookP: edge('hook'), actP: edge('act') };
    const st = w.steer; if (st && st.on) { st.mx = inp.mx || 0; st.my = inp.my || 0; inp.mx = inp.my = 0; inp.blastP = inp.spinP = inp.hookP = false; if (inp.jumpP) { inp.jumpP = false; st.on = false; this.toastMsg('🚶 You let go of the wheel'); } }
    if (w.tick) w.tick(dt, this);
    me.update(dt, inp, this); me.updateBlob(w);
    // checkpoints (per player)
    for (const c of this.cps) if (!c.mine && Math.hypot(me.x - c.x, me.z - c.z) < 1.6 && Math.abs(me.y - c.y) < 2) { this.cps.forEach((q) => { q.mine = false; q.obj.lamp.material.color.set(0x777777); }); c.mine = true; c.obj.lamp.material.color.set(0x7dffb0); me.cp = [c.x, c.y + 0.1, c.z + 0.0]; me.cpYaw = c.yaw || 0; sfx('check'); this.fx.burst(c.x, c.y + 2.6, c.z, 0x7dffb0, 12); this.toastMsg('✅ Checkpoint!'); }
    for (const c of this.cps) c.obj.flag.rotation.y = Math.sin(this.T * 2 + c.x) * 0.3;
    // hint zones
    for (const q of w.zonesAt(me.x, me.y + 0.3, me.z)) { if (q.type === 'hint' && !this.hints.has(q)) { this.hints.add(q); this.hud.hint(q.msg); } if (q.type === 'door' && !this.app.paused) this.act = { kind: 'door', id: q.level, label: q.label }; }
    // pickups
    this.collectNear(me, dt);
    // interact prompt
    this.updateAct(inp);
    // danger
    const dg = this.actors.dangerTo(me); if (dg) { if (dg.stomp) { me.vy = 11; me.jumps = 1; sfx('hit'); this.dealDamage(dg.stomp.id, 2, me); this.fx.ring(me.x, me.y, me.z); } else if (dg.stompBoss) { me.vy = 13; me.jumps = 1; this.dealDamage('boss', 1, me); } else if (dg.push) { me.knock(dg.push); } else if (dg.hurt) { me.hurt(this, dg.hurt, 'hit'); } }
    // shots
    this.updateShots(dt);
    // remote players
    for (const p of this.players.values()) if (!p.local) { p.remoteUpdate(dt); p.updateBlob(w); }
    // actors
    if (this.host) this.actors.step(dt); else this.actors.lerpRemote(dt);
    updateFrustum(E.camera); this.actors.render(dt);
    if (this.host) this.hostLogic(dt);
    this.animPickups(dt);
    this.net.tick && this.net.tick(dt, this);
    this.updateCam(dt); this.render(dt); this.hud.update(dt, this);
    if (this.lightPool) this.lightPool.update(dt, me.x, me.y + 2, me.z);
  }
  // big friendly actors (Martina, Candy) vanish while they sit between the camera and your rat
  hideOccluders(cp, tg) { const A = this.actors; for (const [o, r] of [[A.martina, 2.6], [A.candy, 2.4]]) { if (!o || !o.rig) continue; const R = o.rig.root; const px = o.x, py = o.y + r * 0.5, pz = o.z;
      const sx = tg.x - cp.x, sy = tg.y - cp.y, sz = tg.z - cp.z, L2 = sx * sx + sy * sy + sz * sz || 1; let t = ((px - cp.x) * sx + (py - cp.y) * sy + (pz - cp.z) * sz) / L2; t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(cp.x + sx * t - px, cp.y + sy * t - py, cp.z + sz * t - pz); R.visible = !(t < 0.92 && d < r) && Math.hypot(cp.x - px, cp.y - py, cp.z - pz) > r + 0.4; } }
  // static props marked fadeable (tire stacks etc.) hide while they sit between the camera and your rat
  hideStatic(cp, tg) { const F = this.world.fades; if (!F || !F.length) return; const ox = cp.x, oy = cp.y, oz = cp.z, dx = tg.x - ox, dy = tg.y + 0.6 - oy, dz = tg.z - oz;
    for (const f of F) { const b = f.box; let t0 = 0, t1 = 0.95, ok = true; const o = [ox, oy, oz], d = [dx, dy, dz], mn = [b.min.x - 0.3, b.min.y, b.min.z - 0.3], mx = [b.max.x + 0.3, b.max.y + 0.3, b.max.z + 0.3];
      for (let i = 0; i < 3 && ok; i++) { if (Math.abs(d[i]) < 1e-6) { if (o[i] < mn[i] || o[i] > mx[i]) ok = false; continue; } let a = (mn[i] - o[i]) / d[i], c = (mx[i] - o[i]) / d[i]; if (a > c) { const q = a; a = c; c = q; } t0 = Math.max(t0, a); t1 = Math.min(t1, c); if (t0 > t1) ok = false; }
      const inside = tg.x > mn[0] && tg.x < mx[0] && tg.z > mn[2] && tg.z < mx[2] && tg.y > mn[1] - 0.5 && tg.y < mx[1] + 1.2;
      const near = ox > mn[0] - 2.5 && ox < mx[0] + 2.5 && oz > mn[2] - 2.5 && oz < mx[2] + 2.5 && oy < mx[1] + 2.5; const vis = !((ok || near) && !inside); for (const m of f.meshes) m.visible = vis; } }
  render(dt) { this.fx.update(dt); followShadow(this.me.x, this.me.y, this.me.z); }
  // ------------------------------------------------ host-only: plates/doors/gold
  hostLogic(dt) { const w = this.world; const ps = this.alivePlayers(); const m = this.actors.martina;
    for (const pl of w.plates) { if (pl.latch && pl.on) continue; let on = ps.some((p) => Math.abs(p.x - pl.x) < pl.r && Math.abs(p.z - pl.z) < pl.r && Math.abs(p.y - pl.y) < 0.8); if (m && Math.hypot(m.x - pl.x, m.z - pl.z) < pl.r + 1) on = true; if (on !== pl.on) { pl.on = on; pl.dirty = true; } }
    for (const d of w.doors) if (!d.open) { const ok = d.need.every((id) => { const pl = w.plates.find((q) => q.id === id); if (pl) return pl.on; const lv = w.levers.find((q) => q.id === id); return lv ? lv.on : false; }); if (ok) this.setDoor(d.id, true); }
  }
  setDoor(id, open, remote) { const d = this.world.doors.find((q) => q.id === id); if (!d || d.open === open) return; d.open = open; sfx('door'); if (open && d.msg) this.toastMsg(d.msg); if (!remote && this.online && this.host) this.net.bc({ t: 'door', id, open }); }
  // ------------------------------------------------ pickups
  collectNear(p, dt) { const mag = p.gadgets.has('magnet') ? 4.5 : 1.8;
    for (const e of this.world.ents) { if (e.got || e.k === 'crate') continue; const dx = p.x - e.x, dy = p.y + 0.4 - e.y, dz = p.z - e.z, d = Math.hypot(dx, dy, dz);
      if (e.k === 'crumb' && d < mag && d > 0.7) { const s = Math.min(1, dt * 10); e.x += dx * s; e.y += dy * s; e.z += dz * s; }
      if (d < (e.k === 'baby' ? 1.3 : 0.95)) this.pick(e.id, p.pid, true); }
    if (this.gold && this.gold.visible && !this.done && Math.hypot(p.x - this.gold.position.x, p.z - this.gold.position.z) < 1.8 && Math.abs(p.y + 0.5 - this.gold.position.y) < 2.2) { if (this.host) this.finish(); else this.net.send({ t: 'gold' }); this.gold.visible = false; }
  }
  pick(id, pid, local) { const e = this.world.ents[id]; if (!e || e.got) return; if (!this.host && local) { this.net.send({ t: 'pick', id }); } this.applyPick(e, pid); if (this.host && this.online) this.net.bc({ t: 'got', id, pid }); }
  applyPick(e, pid) { if (e.got) return; e.got = true; this.got.add(e.id); const T = this.tally;
    if (e.k === 'crumb') { T.crumbs++; sfx('crumb'); this.fx.sparkle(e.x, e.y, e.z, 0xffd23f); }
    else if (e.k === 'cheese') { T.cheese++; sfx('cheese'); this.fx.burst(e.x, e.y, e.z, 0xffd23f, 16); this.toastMsg(this.pirate ? '💰 Bag of doubloons! +10' : '🧀 Big cheese! +10'); }
    else if (e.k === 'part') { T.parts.push(e.n); sfx('part'); this.fx.burst(e.x, e.y, e.z, 0x3ff0ff, 18); this.toastMsg(this.pirate ? `💎 Pirate gem ${T.parts.length}/5` : `⚙️ Ratita Industries part ${T.parts.length}/5`); }
    else if (e.k === 'baby') { T.babies.push(e.n); sfx('baby'); this.fx.confetti(e.x, e.y, e.z, 30); this.toastMsg(this.pirate ? `🧰 Treasure chest! ${T.babies.length}/3` : `🐭 Baby Ratita rescued! ${T.babies.length}/3`); if (e.obj) e.obj.root.visible = false; }
    else if (e.k === 'heart') { sfx('heart'); for (const p of this.players.values()) if (p.local) p.hearts = Math.min(p.maxHearts, p.hearts + 1); }
    else if (e.k === 'crate') { T.crumbs += 5; T.crates++; sfx('pop'); this.fx.burst(e.x, e.y + 0.6, e.z, 0xd8a15a, 14); this.fx.burst(e.x, e.y + 0.6, e.z, 0xffd23f, 8); if (e.obj) e.obj.visible = false; if (e.s) e.s.off = true; }
    this.hud.dirty = true; }
  animPickups(dt) { const t = this.T, m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    for (const k in this.inst) { const { im, list } = this.inst[k]; for (const e of list) { const sc = e.got ? 0 : 1; q.setFromAxisAngle(up, t * 2 + e.id); v.set(e.x, e.y + Math.sin(t * 3 + e.id) * 0.12, e.z); s.setScalar(sc); m.compose(v, q, s); im.setMatrixAt(e.ii, m); } im.instanceMatrix.needsUpdate = true; }
    for (const b of this.babies) if (!b.got) { b.obj.root.position.y = b.y + Math.sin(t * 2 + b.id) * 0.2; b.obj.root.rotation.y = t * 0.6; if (b.obj.rat) animRat(b.obj.rat, dt, { speed: 2, air: false, glide: false, spin: 0, vy: 0, squash: 0, lean: 0 }); else if (b.obj.lid) b.obj.lid.rotation.z = 0.15 + Math.max(0, Math.sin(t * 3 + b.id)) * 0.35; if (Math.random() < 0.05) this.fx.sparkle(b.x, b.y, b.z, 0xff9fe0); }
    if (this.gold && this.gold.visible) { this.gold.rotation.y = t * 1.5; this.gold.position.y = this.world.goldPos[1] + Math.sin(t * 2) * 0.2; if (Math.random() < 0.3) this.fx.sparkle(this.gold.position.x, this.gold.position.y, this.gold.position.z); }
    for (const h of this.hookObjs) { const on = h === this.hookT; h.obj.scale.setScalar(on ? 1.25 + Math.sin(t * 10) * 0.1 : 1); h.obj.rotation.y = t; }
  }
  // ------------------------------------------------ combat
  dealDamage(id, dmg, from) { if (this.host) this.actors.damage(id, dmg, from && from.pid); else { this.net.send({ t: 'hit', id, dmg }); this.fx.burst(from.x, from.y + 0.5, from.z, 0xffffff, 4); } }
  hitPlayer(p, src, kind) { if (p.local) p.hurt(this, src, kind); else this.net.sendTo(p.pid, { t: 'ouch', kind, x: src.x, z: src.z }); }
  onSpin(p) { const R = 1.6 + up('spin') * 0.45; this.fx.ring(p.x, p.y + 0.3, p.z, 0xffe14d, R);
    for (const e of this.actors.list) if (!e.dead && Math.hypot(e.x - p.x, e.z - p.z) < R + e.D.r * 0.5 && Math.abs(e.y - p.y) < 1.5) this.dealDamage(e.id, 1, p);
    const B = this.actors.boss; if (B && B.active && !B.dead && Math.hypot(B.x - p.x, B.z - p.z) < R + B.D.r && p.y - B.y < B.D.h) this.dealDamage('boss', 1, p);
    this.breakCrates(p.x, p.y, p.z, R + 0.4); }
  breakCrates(x, y, z, R) { for (const c of this.crates) if (!c.got && Math.hypot(c.x - x, c.z - z) < R && Math.abs(c.y - y) < 1.6) this.pick(c.id, this.me.pid, true); }
  fireBlast(p) { const mega = p.gadgets.has('mega'); const dirs = mega ? [-0.18, 0, 0.18] : [0]; sfx('blast');
    // soft auto-aim
    let tgt = null, bd = 18; const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw); const cand = this.actors.list.filter((e) => !e.dead).map((e) => ({ x: e.x, y: e.y + 0.5, z: e.z })); const B = this.actors.boss; if (B && B.active && !B.dead) cand.push({ x: B.x, y: B.y + B.D.h * 0.5, z: B.z });
    for (const c of this.crates) if (!c.got) cand.push({ x: c.x, y: c.y + 0.5, z: c.z });
    for (const c of cand) { const dx = c.x - p.x, dz = c.z - p.z, d = Math.hypot(dx, dz); if (d < bd && (dx * fx + dz * fz) / (d || 1) > 0.7 && Math.abs(c.y - p.y) < 5) { bd = d; tgt = c; } }
    let ay = p.yaw, vy = 0; if (tgt) { ay = Math.atan2(tgt.x - p.x, tgt.z - p.z); vy = (tgt.y - (p.y + 0.5)) / (bd / 22); }
    for (const da of dirs) { const m = this.shotGeo.clone(); m.position.set(p.x + Math.sin(ay) * 0.5, p.y + 0.5, p.z + Math.cos(ay) * 0.5); this.scene.add(m); const sp = 22 + up('blast') * 3; this.shots.push({ m, vx: Math.sin(ay + da) * sp, vy, vz: Math.cos(ay + da) * sp, t: 0, owner: p, dmg: 1 + up('blast') * 0.34 }); }
    p.yaw = ay; }
  updateShots(dt) { const w = this.world; for (const s of this.shots) { s.t += dt; const m = s.m; m.position.x += s.vx * dt; m.position.y += s.vy * dt; m.position.z += s.vz * dt; const P = m.position; let hit = s.t > 1.2;
      if (!hit) for (const e of this.actors.list) if (!e.dead && Math.hypot(e.x - P.x, e.y + 0.5 - P.y, e.z - P.z) < e.D.r + 0.4) { this.dealDamage(e.id, s.dmg, s.owner); hit = true; break; }
      const B = this.actors.boss; if (!hit && B && B.active && !B.dead && Math.hypot(B.x - P.x, B.z - P.z) < B.D.r + 0.3 && P.y > B.y - 0.5 && P.y < B.y + B.D.h + 0.5) { this.dealDamage('boss', 0.34, s.owner); hit = true; }
      if (!hit) for (const c of this.crates) if (!c.got && Math.hypot(c.x - P.x, c.y + 0.5 - P.y, c.z - P.z) < 1.1) { this.pick(c.id, this.me.pid, true); hit = true; break; }
      if (!hit) { const g = w.ground(P.x, P.z, P.y + 0.1, 0.05); if (P.y < g.y + 0.05) hit = true; else { const c = w.near(P.x - 0.2, P.z - 0.2, P.x + 0.2, P.z + 0.2, this._t || (this._t = [])); for (const q of c) if (!q.off && P.x > q.min[0] && P.x < q.max[0] && P.y > q.min[1] && P.y < q.max[1] && P.z > q.min[2] && P.z < q.max[2]) { hit = true; break; } } }
      if (hit) { s.dead = true; this.scene.remove(m); this.fx.burst(P.x, P.y, P.z, 0xffd23f, 6, 3); sfx('splat'); } }
    this.shots = this.shots.filter((s) => !s.dead); }
  hookTarget(p) { const rng = 12 + up('hook') * 3; let best = null, bs = -1e9; const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw);
    for (const h of this.world.hooks) { const dx = h.x - p.x, dy = h.y - p.y, dz = h.z - p.z, d = Math.hypot(dx, dy, dz); if (d > rng || d < 1.2) continue; const fr = (dx * fx + dz * fz) / (Math.hypot(dx, dz) || 1); const sc = fr * 4 - d * 0.3 + (dy > 0 ? 1 : 0); if (fr < -0.3) continue;
      const dir = new THREE.Vector3(dx, dy, dz).normalize(); const o = new THREE.Vector3(p.x, p.y + 0.5, p.z); const hit = this.world.ray(o, dir, d - 0.8, (s) => !s.off); if (hit < d - 0.9) continue; if (sc > bs) { bs = sc; best = h; } }
    return best; }
  // ------------------------------------------------ interactions
  updateAct(inp) { const me = this.me; let a = this.act && this.act.kind === 'door' ? this.act : null; this.act = null;
    const m = this.actors.martina; if (m && m.st === 'idle' && Math.hypot(me.x - m.x, me.z - m.z) < 4.5) a = { kind: 'martina', label: m.label || '🐢 Ask Martina for help' };
    for (const lv of this.world.levers) if (!lv.on && Math.hypot(me.x - lv.x, me.z - lv.z) < 2 && Math.abs(me.y - lv.y) < 1.5) a = { kind: 'lever', id: lv.id, label: '🔧 Pull lever' };
    for (const k of this.world.kiosks || []) if (Math.hypot(me.x - k.x, me.z - k.z) < k.r && Math.abs(me.y - k.y) < (k.dy || 2) && (!k.when || k.when(this))) a = { kind: 'kiosk', id: k.id, label: typeof k.label === 'function' ? k.label(this) : k.label, fn: k.fn };
    if (this.world.actsFn && !this.app.paused && !a) { const a2 = this.world.actsFn(me, this); if (a2) a = Object.assign({ kind: 'fn' }, a2); }
    // grapple target highlight
    this.hookT = me.gadgets.has('grapple') ? this.hookTarget(me) : null;
    this.hud.setAct(a, !!this.hookT); this.curAct = a;
    if (a && inp.actP) this.doAct(a, me);
  }
  doAct(a, p) { sfx('click');
    if (a.kind === 'martina') { if (this.host) this.actors.actMartina(); else this.net.send({ t: 'act', what: 'martina' }); }
    else if (a.kind === 'lever') { if (this.host) this.pullLever(a.id); else this.net.send({ t: 'act', what: 'lever', id: a.id }); }
    else if (a.kind === 'door') this.app.enterLevelDoor(a.id);
    else if (a.kind === 'kiosk') { if (a.fn) a.fn(this.app, this); else this.app.openKiosk(a.id); }
    else if (a.kind === 'fn' && a.fn) a.fn(this.app, this);
  }
  pullLever(id) { const lv = this.world.levers.find((q) => q.id === id); if (!lv || lv.on) return; lv.on = true; if (lv.obj) lv.obj.rotation.z = -0.9; sfx('door'); if (this.online && this.host) this.net.bc({ t: 'lever', id }); }
  // ------------------------------------------------ events
  onEnemyKilled(e, pid) { this.tally.crumbs += 3; this.net.fx('pop', e.x, e.y + 0.5, e.z); this.hud.dirty = true; if (this.online && this.host) this.net.bc({ t: 'kill', id: e.id }); }
  onFaint(p) { this.toastMsg('😵 Fainted! Back to the checkpoint'); }
  onBossStart(B, remote) { this.hud.boss(B); sfx('boss'); playMusic('boss'); this.toastMsg('⚠️ ' + B.D.n + '!'); }
  onBossReset(B) { this.hud.boss(null); playMusic(this.world.music || this.levelId); }
  onBossTired() {}
  onBossDefeated(B, remote) { this.hud.boss(null); sfx('win'); this.fx.confetti(B.x, B.y + 3, B.z, 90); this.toastMsg('🎉 ' + B.D.n + ' beaten! ' + (this.world.pirate ? 'Grab the map piece! 🗺️' : 'Grab the Golden Cheese!')); playMusic(this.world.music || this.levelId); if (this.gold) { this.gold.visible = true; this.world.goldPos = this.world.goldPos || [B.x, B.y + 1.5, B.z]; } }
  finish(remote) { if (this.done) return; this.done = true; sfx('win'); this.fx.confetti(this.me.x, this.me.y + 2, this.me.z, 120); const T = this.tally;
    const res = { level: this.levelId, crumbs: T.crumbs, cheese: T.cheese, parts: T.parts.slice(), babies: T.babies.slice(), time: T.time, crates: T.crates };
    if (this.online && this.host && !remote) this.net.bc({ t: 'done', res });
    setTimeout(() => this.app.levelDone(res), 1600); }
  // ------------------------------------------------ camera
  updateCam(dt) { const c = this.cam, me = this.me, cam = E.camera, sens = (S.opts.camSens || 1);
    if (IN.camDX || IN.camDY) { c.yaw -= IN.camDX * 0.0085 * sens * (S.opts.invertX ? -1 : 1); c.pitch = Math.max(-0.15, Math.min(1.15, c.pitch + IN.camDY * 0.005 * sens)); IN.camDX = IN.camDY = 0; }
    const manual = performance.now() - IN.lastCam < 1500;
    if (!manual && me.speed > 1 && !me.zip) { let d = me.yaw - c.yaw; while (d > PI) d -= PI * 2; while (d < -PI) d += PI * 2; if (Math.abs(d) < 2.2) c.yaw += d * Math.min(1, dt * 0.9 * (me.speed / 7)); }
    const B = this.actors.boss; const bossOn = B && B.active && !B.dead; const steer = this.world.steer && this.world.steer.on; let want = bossOn ? 9.5 : (this.world.camDist || 6.6); let pmax = 1.15;
    for (const q of this.world.zonesAt(me.x, me.y + 0.3, me.z)) if (q.type === 'camz') { want = Math.min(want, q.dist); pmax = q.pmax || pmax; }
    if (steer) { want = 30; let dy = PI - c.yaw; while (dy > PI) dy -= PI * 2; while (dy < -PI) dy += PI * 2; if (!manual) c.yaw += dy * Math.min(1, dt * 1.5); c.pitch += (0.3 - c.pitch) * Math.min(1, dt * 2); } if (c.pitch > pmax) c.pitch += (pmax - c.pitch) * Math.min(1, dt * 4);
    c.dist += (want - c.dist) * Math.min(1, dt * 2);
    const ty = steer ? 7 : me.y + 1.0 + Math.min(0, me.vy) * 0.02; const tx = steer ? 0 : me.x, tz = steer ? 2 : me.z; if (steer || c.wasSteer) { const k = c.snap ? 1 : Math.min(1, dt * 3); c.tgt.x += (tx - c.tgt.x) * k; c.tgt.z += (tz - c.tgt.z) * k; c.tgt.y += (ty - c.tgt.y) * k; c.wasSteer = steer || Math.hypot(c.tgt.x - me.x, c.tgt.z - me.z) > 0.3; } else c.tgt.set(me.x, c.snap ? ty : c.tgt.y + (ty - c.tgt.y) * (1 - Math.exp(-dt * (me.onGround ? 6 : 3))), me.z);
    const dir = new THREE.Vector3(-Math.sin(c.yaw) * Math.cos(c.pitch), Math.sin(c.pitch), -Math.cos(c.yaw) * Math.cos(c.pitch));
    // camera collision: ignore floors and small clutter (only big things pull the camera in), smoothed with hysteresis so it never snaps
    const big = (q) => q.camBlock || (q.cam !== false && !q.off && !q.nocam && !q.floor && (q.max[1] - q.min[1]) > 1.2 && Math.max(q.max[0] - q.min[0], q.max[2] - q.min[2]) > 1.6);
    let d = steer ? c.dist + 1 : this.world.ray(c.tgt, dir, c.dist + 0.5, big); d = Math.max(1.2, Math.min(c.dist, d - 0.45));
    if (c.cd == null || c.snap) c.cd = d;
    else if (d < c.cd - 0.05) c.cd += (d - c.cd) * Math.min(1, dt * 9); // pull in quickly but smoothly
    else if (d > c.cd + 0.35) c.cd += (d - c.cd) * Math.min(1, dt * 2.2); // ease back out slowly, only once clearly free
    const want3 = c.tgt.clone().addScaledVector(dir, c.cd);
    // stay above the floor / rugs / low clutter under the camera
    const gy = this.world.ground(want3.x, want3.z, want3.y + 0.5, 0.3).y; const minY = (gy > -1e8 ? gy : me.y) + 0.7; if (want3.y < minY) want3.y = minY;
    if (c.snap) { c.pos.copy(want3); c.snap = false; } else { const kx = 1 - Math.exp(-dt * 14), ky = 1 - Math.exp(-dt * 8); c.pos.x += (want3.x - c.pos.x) * kx; c.pos.z += (want3.z - c.pos.z) * kx; c.pos.y += (want3.y - c.pos.y) * ky; }
    cam.position.copy(c.pos); if (c.shake > 0) { c.shake -= dt; cam.position.x += (Math.random() - 0.5) * c.shake; cam.position.y += (Math.random() - 0.5) * c.shake; }
    cam.lookAt(c.tgt.x, c.tgt.y + 0.2, c.tgt.z); this.hideOccluders(cam.position, c.tgt); this.hideStatic(cam.position, c.tgt); const fov = E.baseFov + (bossOn ? 4 : 0); if (Math.abs(cam.fov - fov) > 0.1) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 3); cam.updateProjectionMatrix(); }
  }
  // ------------------------------------------------ remote player management
  addRemote(pid, info, slot) { if (this.players.has(pid)) return this.players.get(pid); const p = new Player({ rat: info.rat, outfit: info.outfit, dress: info.dress, name: info.name, pid, slot }); p.addTo(this.scene); p.place(this.world.start); this.players.set(pid, p); this.hud.dirty = true; return p; }
  removeRemote(pid) { const p = this.players.get(pid); if (!p || p.local) return; p.removeFrom(this.scene); this.players.delete(pid); this.hud.dirty = true; }
}
