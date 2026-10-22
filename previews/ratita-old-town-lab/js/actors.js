// Host-simulated actors: enemies, Candy the schnauzer, Martina the tortoise, bosses, enemy projectiles & shock rings.
import * as THREE from 'three';
import { makeEnemy, animEnemy, makeCandy, animCandy, makeMartina, animMartina, makeBoss, animBoss, MB, toGroup } from './models.js';
import { P } from './geo.js';
import { sfx } from './audio.js';
import { inView } from './perf.js';
export const ENEMY = { dust: { hp: 1, sp: 2.2, aggro: 7, r: 0.6 }, windup: { hp: 1, sp: 1.8, aggro: 6, r: 0.55 }, bot: { hp: 2, sp: 2.6, aggro: 8, r: 0.6 }, snail: { hp: 2, sp: 0.8, aggro: 4, r: 0.6 }, bee: { hp: 1, sp: 2.4, aggro: 8, r: 0.5, fly: true }, nut: { hp: 2, sp: 3.2, aggro: 8, r: 0.6 }, moth: { hp: 1, sp: 2.0, aggro: 8, r: 0.5, fly: true }, toycar: { hp: 2, sp: 4, aggro: 9, r: 0.7 } };
export const BOSS = {
  toast: { n: 'Toastzilla', hp: 3, r: 2.8, h: 4.2, moves: ['lob', 'hop', 'lob'], proj: 0xd4a373, sp: 3 },
  vac: { n: 'Sucky the Robo-Vac', hp: 3, r: 3.2, h: 2, moves: ['charge', 'charge', 'lob'], proj: 0x9aa0ab, sp: 3 },
  dustking: { n: 'Dust Bunny King', hp: 4, r: 3, h: 5, moves: ['hop', 'spawn', 'hop', 'lob'], proj: 0x9aa0ab, sp: 2.5 },
  sprinkler: { n: 'Sprinkles the Sprinkler-Bot', hp: 4, r: 2.6, h: 4.5, moves: ['ring', 'lob', 'ring'], proj: 0x7dd3fc, sp: 2 },
  rc: { n: 'RC Rumbler', hp: 4, r: 3.4, h: 4.5, moves: ['charge', 'lob', 'charge'], proj: 0x94a3b8, sp: 4 },
  clanky: { n: 'Clanky the Wind-Up Bot', hp: 5, r: 2.8, h: 8, moves: ['hop', 'ring', 'lob', 'spawn'], proj: 0xef4444, sp: 2.4 },
  kitty: { n: 'Clockwork Kitty', hp: 6, r: 3.4, h: 7, moves: ['hop', 'charge', 'ring', 'lob', 'spawn'], proj: 0xf9a8d4, sp: 3.2, spawn: 'moth' },
};
const projGeo = new THREE.SphereGeometry(0.5, 16, 12);
export class Actors {
  constructor(game) { this.g = game; this.list = []; this.proj = []; this.rings = []; this.nid = 1; this.candy = null; this.martina = null; this.boss = null; this.group = new THREE.Group(); game.scene.add(this.group); }
  dispose() { this.g.scene.remove(this.group); }
  spawnAll(w) {
    for (const e of w.enemies) this.addEnemy(e.type, e.x, e.y, e.z, e.o);
    if (w.candySpec) this.addCandy(w.candySpec);
    if (w.martinaSpec) this.addMartina(w.martinaSpec);
    if (w.bossSpec) this.addBoss(w.bossSpec);
  }
  addEnemy(type, x, y, z, o = {}) { const D = ENEMY[type] || ENEMY.dust; const m = makeEnemy(type); this.group.add(m.root);
    const e = { id: this.nid++, kind: 'e', type, x, y, z, hx: x, hz: z, hy: y, yaw: Math.random() * 6, hp: D.hp, D, rig: m, st: 'patrol', t: Math.random() * 5, range: o.range || 4, axis: o.axis || null, dead: false, flash: 0, speed: 0 }; this.list.push(e); return e; }
  addCandy(c) { const r = makeCandy(); this.group.add(r.root); this.candy = { kind: 'candy', x: c.x, y: 0, z: c.z, yaw: c.yaw || 0, rig: r, st: c.sleep ? 'sleep' : 'roam', path: c.path || [[c.x, c.z]], pi: 0, t: 0, speed: 0, home: [c.x, c.z], bounds: c.bounds, maxY: c.maxY || 1.6, barkT: 0 }; }
  addMartina(m) { const r = makeMartina(); this.group.add(r.root); this.martina = { kind: 'martina', x: m.x, y: m.y || 0, z: m.z, yaw: m.yaw || 0, rig: r, st: 'idle', path: m.path || [], pi: 0, speed: 0, plate: m.plate, say: m.say || 'Hi friend! Need a hand?', done: false, name: m.name || 'Martina', name2: m.name2 || m.name || 'Martina', label: m.label }; }
  addBoss(b) { const D = b.D ? Object.assign({}, BOSS[b.type], b.D) : BOSS[b.type]; const r = makeBoss(b.type); this.group.add(r.root); r.root.visible = true;
    this.boss = { kind: 'boss', type: b.type, D, x: b.x, y: b.y, z: b.z, yaw: b.yaw || 0, rig: r, st: 'wait', t: 0, hp: D.hp, arena: b.arena, mi: 0, vx: 0, vz: 0, flash: 0, active: false, dead: false, jumpT: 0 }; }
  // ---------------- host simulation ----------------
  step(dt) {
    const g = this.g, w = g.world, ps = g.alivePlayers();
    for (const e of this.list) { if (e.dead) continue; e.t += dt; e.flash = Math.max(0, e.flash - dt);
      let tgt = null, best = e.D.aggro; for (const p of ps) { const d = Math.hypot(p.x - e.x, p.z - e.z); if (d < best && Math.abs(p.y - e.y) < (e.D.fly ? 4 : 1.6)) { best = d; tgt = p; } }
      let vx = 0, vz = 0, sp = e.D.sp;
      if (tgt) { e.st = 'chase'; const dx = tgt.x - e.x, dz = tgt.z - e.z, d = Math.hypot(dx, dz) || 1; vx = dx / d; vz = dz / d; sp *= 1.25; if (Math.hypot(e.x - e.hx, e.z - e.hz) > e.range + 6) { vx = (e.hx - e.x); vz = (e.hz - e.z); const q = Math.hypot(vx, vz) || 1; vx /= q; vz /= q; } }
      else { e.st = 'patrol'; const a = e.t * sp / Math.max(1, e.range) * 0.6; let tx, tz; if (e.axis === 'x') { tx = e.hx + Math.sin(a) * e.range; tz = e.hz; } else if (e.axis === 'z') { tx = e.hx; tz = e.hz + Math.sin(a) * e.range; } else { tx = e.hx + Math.cos(a) * e.range; tz = e.hz + Math.sin(a) * e.range; } const dx = tx - e.x, dz = tz - e.z, d = Math.hypot(dx, dz); if (d > 0.1) { vx = dx / d * Math.min(1, d); vz = dz / d * Math.min(1, d); } }
      const nx = e.x + vx * sp * dt, nz = e.z + vz * sp * dt;
      if (e.D.fly) { e.x = nx; e.z = nz; const ty = tgt ? tgt.y + 1.2 : e.hy; e.y += (ty - e.y) * Math.min(1, dt * 1.5); }
      else { const gr = w.ground(nx, nz, e.y + 0.5, 0.1); if (gr.y > -1e8 && Math.abs(gr.y - e.y) < 0.6 && !blocked(w, nx, nz, e.y)) { e.x = nx; e.z = nz; e.y = gr.y; } else { e.t += 1.3; } }
      if (vx || vz) { let ty = Math.atan2(vx, vz), d = ty - e.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; e.yaw += d * Math.min(1, dt * 6); } e.speed = Math.hypot(vx, vz) * sp; }
    this.stepCandy(dt, ps); this.stepMartina(dt); this.stepBoss(dt, ps);
    for (const p of this.proj) { if (p.dead) continue; p.t += dt; p.vy -= 18 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; const gr = w.ground(p.x, p.z, p.y + 0.5, 0.1); if (p.y <= gr.y + 0.3 || p.t > 4) { p.dead = true; g.net.fx('splat', p.x, Math.max(gr.y, p.y), p.z, p.col); this.addRing(p.x, Math.max(gr.y, p.y - 0.3), p.z, 0.4, 1.8, p.col, 0.5); } }
    for (const r of this.rings) { if (r.dead) continue; r.t += dt; r.rad = r.r0 + (r.r1 - r.r0) * (r.t / r.dur); if (r.t >= r.dur) r.dead = true; }
    this.proj = this.proj.filter((p) => !p.dead); this.rings = this.rings.filter((r) => !r.dead);
  }
  stepCandy(dt, ps) { const c = this.candy; if (!c) return; c.t += dt; c.barkT -= dt; const g = this.g;
    let tgt = null, best = 20; for (const p of ps) { if (p.y > c.maxY) continue; const d = Math.hypot(p.x - c.x, p.z - c.z); if (d < best) { best = d; tgt = p; } }
    let sp = 0, tx = c.x, tz = c.z;
    if (c.st === 'sleep') { if (tgt && best < 11) { c.st = 'chase'; c.t = 0; g.net.fx('bark', c.x, 2, c.z); g.toastMsg('🐶 Candy woke up! Get off the floor!'); } }
    else if (c.st === 'happy') { if (c.t > 3) { c.st = 'roam'; c.t = 0; } }
    else if (tgt) { if (c.st !== 'chase') { c.st = 'chase'; c.t = 0; if (c.barkT <= 0) { g.net.fx('bark', c.x, 2, c.z); c.barkT = 4; } } tx = tgt.x; tz = tgt.z; sp = 5.6 + Math.min(1.5, c.t * 0.15) + (Math.sin(c.t * 0.9) > 0.85 ? 2 : 0); // zoomies!
      if (best < 1.9 && tgt.y < 2.2) { g.hitPlayer(tgt, c, 'slobber'); c.st = 'happy'; c.t = 0; } }
    else { c.st = c.st === 'chase' ? 'sniff' : c.st; if (c.st === 'sniff' && c.t > 2.5) { c.st = 'roam'; c.t = 0; } if (c.st === 'roam') { const p = c.path[c.pi % c.path.length]; tx = p[0]; tz = p[1]; sp = 3; if (Math.hypot(tx - c.x, tz - c.z) < 1) c.pi++; } }
    if (sp) { const dx = tx - c.x, dz = tz - c.z, d = Math.hypot(dx, dz) || 1; let nx = c.x + dx / d * sp * dt, nz = c.z + dz / d * sp * dt; const b = c.bounds; if (b) { nx = Math.max(b[0], Math.min(b[2], nx)); nz = Math.max(b[1], Math.min(b[3], nz)); }
      if (!blocked(this.g.world, nx, nz, 0.2, 1.1, 2.2)) { c.x = nx; c.z = nz; } else if (!blocked(this.g.world, nx, c.z, 0.2, 1.1, 2.2)) c.x = nx; else if (!blocked(this.g.world, c.x, nz, 0.2, 1.1, 2.2)) c.z = nz;
      let ty = Math.atan2(dx, dz), dd = ty - c.yaw; while (dd > Math.PI) dd -= Math.PI * 2; while (dd < -Math.PI) dd += Math.PI * 2; c.yaw += dd * Math.min(1, dt * 5); }
    c.speed = sp; }
  stepMartina(dt) { const m = this.martina; if (!m) return; if (m.st === 'walk') { const p = m.path[m.pi]; if (!p) { m.st = 'done'; m.speed = 0; this.g.toastMsg('🐢 ' + m.name2 + ': "Ta-da! I\u2019ll hold it for you!"'); return; } const dx = p[0] - m.x, dz = p[1] - m.z, d = Math.hypot(dx, dz); if (d < 0.3) { m.pi++; return; } const sp = 2.2; m.x += dx / d * sp * dt; m.z += dz / d * sp * dt; m.speed = sp; let ty = Math.atan2(dx, dz), dd = ty - m.yaw; while (dd > Math.PI) dd -= Math.PI * 2; while (dd < -Math.PI) dd += Math.PI * 2; m.yaw += dd * Math.min(1, dt * 3); const gr = this.g.world.ground(m.x, m.z, m.y + 1, 0.2); if (gr.y > -1e8) m.y = gr.y; } else m.speed = 0; }
  actMartina() { const m = this.martina; if (!m || m.st !== 'idle') return false; m.st = 'walk'; m.pi = 0; this.g.toastMsg('🐢 ' + m.name + ': "Follow me, slowpokes!"'); sfx('squeak'); return true; }
  stepBoss(dt, ps) { const B = this.boss; if (!B || B.dead) return; const g = this.g, D = B.D, A = B.arena; B.flash = Math.max(0, B.flash - dt);
    const inA = ps.filter((p) => p.x > A[0] - 1 && p.x < A[2] + 1 && p.z > A[1] - 1 && p.z < A[3] + 1 && p.y > B.y - 2);
    if (!B.active) { if (inA.length) { B.active = true; B.st = 'intro'; B.t = 0; g.onBossStart(B); } else return; }
    if (!inA.length && ps.length && B.st !== 'intro') { // everyone left the arena: reset quietly
      B.hp = D.hp; B.active = false; B.st = 'wait'; g.onBossReset(B); return; }
    B.t += dt; let tgt = null, bd = 1e9; for (const p of inA) { const d = Math.hypot(p.x - B.x, p.z - B.z); if (d < bd) { bd = d; tgt = p; } } tgt = tgt || ps[0];
    const face = (x, z, k = 4) => { let ty = Math.atan2(x - B.x, z - B.z), d = ty - B.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; B.yaw += d * Math.min(1, dt * k); };
    const clampA = () => { B.x = Math.max(A[0] + D.r, Math.min(A[2] - D.r, B.x)); B.z = Math.max(A[1] + D.r, Math.min(A[3] - D.r, B.z)); };
    if (B.st === 'intro') { if (tgt) face(tgt.x, tgt.z); if (B.t > 2) { B.st = 'move'; B.t = 0; } }
    else if (B.st === 'move') { if (tgt) { face(tgt.x, tgt.z); const dx = tgt.x - B.x, dz = tgt.z - B.z, d = Math.hypot(dx, dz) || 1; if (d > 6) { B.x += dx / d * D.sp * dt; B.z += dz / d * D.sp * dt; } else { B.x -= dz / d * D.sp * dt; B.z += dx / d * D.sp * dt; } clampA(); }
      if (B.t > 1.6) { B.mv = D.moves[B.mi++ % D.moves.length]; B.st = 'attack'; B.t = 0; B.n = 0; if (B.mv === 'charge' && tgt) { const dx = tgt.x - B.x, dz = tgt.z - B.z, d = Math.hypot(dx, dz) || 1; B.vx = dx / d; B.vz = dz / d; B.windup = 0.8; } if (B.mv === 'hop' && tgt) { B.hx0 = B.x; B.hz0 = B.z; B.hx1 = tgt.x; B.hz1 = tgt.z; } } }
    else if (B.st === 'attack') { const mv = B.mv;
      if (mv === 'lob') { if (tgt) face(tgt.x, tgt.z); const n = 3 + (D.hp - B.hp > 1 ? 2 : 0); if (B.t > 0.45 * B.n + 0.3 && B.n < n && tgt) { B.n++; const lead = (Math.random() - 0.5) * 3; this.lob(B.x, B.y + D.h, B.z, tgt.x + lead, tgt.y, tgt.z + (Math.random() - 0.5) * 3, D.proj); } if (B.t > 0.45 * n + 1.4) this.tire(B); }
      else if (mv === 'hop') { const T = 1.0; const k = Math.min(1, B.t / T); B.x = B.hx0 + (B.hx1 - B.hx0) * k; B.z = B.hz0 + (B.hz1 - B.hz0) * k; clampA(); B.jumpT = Math.sin(k * Math.PI) * 5; if (B.t >= T && !B.landed) { B.landed = true; B.jumpT = 0; this.addRing(B.x, B.y, B.z, D.r, D.r + 9, 0xffffff, 1.1); g.net.fx('stomp', B.x, B.y, B.z); B.n++; if (B.n < 2 && tgt) { B.t = 0; B.landed = false; B.hx0 = B.x; B.hz0 = B.z; B.hx1 = tgt.x; B.hz1 = tgt.z; } } if (B.landed && B.t > T + 0.6) { B.landed = false; this.tire(B); } }
      else if (mv === 'charge') { if (B.windup > 0) { B.windup -= dt; if (tgt) { const dx = tgt.x - B.x, dz = tgt.z - B.z, d = Math.hypot(dx, dz) || 1; B.vx = dx / d; B.vz = dz / d; } face(B.x + B.vx, B.z + B.vz, 10); } else { const sp = 14; B.x += B.vx * sp * dt; B.z += B.vz * sp * dt; const ox = B.x, oz = B.z; clampA(); if (ox !== B.x || oz !== B.z || B.t > 3.5) { g.net.fx('stomp', B.x, B.y, B.z); g.toastMsg('BONK! Now hit it! 💫'); this.tire(B, 4.2); } } }
      else if (mv === 'ring') { if (B.t > 0.7 * B.n + 0.3 && B.n < 3) { B.n++; this.addRing(B.x, B.y, B.z, D.r, D.r + 12, D.proj, 1.6); g.net.fx('stomp', B.x, B.y, B.z); } if (B.t > 3.2) this.tire(B); }
      else if (mv === 'spawn') { if (B.n === 0 && B.t > 0.5) { B.n = 1; const typ = D.spawn || (B.type === 'clanky' ? 'windup' : 'dust'); for (let i = 0; i < 2; i++) { const a = Math.random() * 6.28; const e = this.addEnemy(typ, B.x + Math.cos(a) * (D.r + 2), B.y + (typ === 'moth' ? 1.5 : 0), B.z + Math.sin(a) * (D.r + 2), { range: 3 }); e.minion = true; } g.net.fx('stomp', B.x, B.y, B.z); } if (B.t > 2) this.tire(B); } }
    else if (B.st === 'tired') { if (B.t > B.tireT) { B.st = 'move'; B.t = 0; } }
    else if (B.st === 'hurt') { if (B.t > 0.8) { B.st = 'move'; B.t = 0; } }
  }
  tire(B, t = 3.2) { B.st = 'tired'; B.t = 0; B.tireT = t; B.jumpT = 0; this.g.onBossTired && this.g.onBossTired(B); }
  lob(x, y, z, tx, ty, tz, col) { const T = 1.1; const vx = (tx - x) / T, vz = (tz - z) / T, vy = (ty - y + 0.5 * 18 * T * T) / T; this.proj.push({ id: this.nid++, x, y, z, vx, vy, vz, t: 0, col }); }
  addRing(x, y, z, r0, r1, col, dur) { this.rings.push({ id: this.nid++, x, y, z, r0, r1, rad: r0, col, dur, t: 0 }); }
  // damage from players (host)
  damage(id, dmg, from) { const g = this.g;
    if (id === 'boss') { const B = this.boss; if (!B || B.dead || !B.active) return false; if (B.st !== 'tired') { if (B.flash <= 0) { B.flash = 0.25; g.net.fx('clink', B.x, B.y + B.D.h * 0.6, B.z); } return false; }
      B.hp -= Math.min(1, dmg); B.flash = 0.4; B.st = 'hurt'; B.t = 0; g.net.fx('bosshit', B.x, B.y + B.D.h * 0.6, B.z); if (B.hp <= 0.01) { B.dead = true; B.st = 'dead'; this.list.forEach((e) => { if (e.minion) e.dead = true; }); g.onBossDefeated(B); } return true; }
    const e = this.list.find((q) => q.id === id); if (!e || e.dead) return false; e.hp -= dmg; e.flash = 0.25; if (e.hp <= 0) { e.dead = true; g.onEnemyKilled(e, from); } else g.net.fx('hit', e.x, e.y + 0.6, e.z); return true; }
  // ---------------- visuals ----------------
  render(dt) {
    for (const e of this.list) { const r = e.rig.root; if (e.dead) { if (r.visible) { r.visible = false; this.g.fx.burst(e.x, e.y + 0.5, e.z, 0xffffff, 12); sfx('pop'); } continue; } r.visible = true; r.position.set(e.x, e.y, e.z); r.rotation.y = e.yaw; e.adt = (e.adt || 0) + dt; if (inView(e.x, e.y + 0.6, e.z, 1.6)) { animEnemy(e.rig, e.adt, e.speed); e.adt = 0; } const s = e.flash > 0 ? 1.25 : 1; e.rig.body.scale.multiplyScalar(1); r.scale.setScalar(s); }
    const c = this.candy; if (c) { c.rig.root.position.set(c.x, 0, c.z); c.rig.root.rotation.y = c.yaw; c.adt = (c.adt || 0) + dt; if (inView(c.x, 1.5, c.z, 3.5)) { animCandy(c.rig, Math.min(0.1, c.adt), c.speed, c.st); c.adt = 0; } }
    const m = this.martina; if (m) { m.rig.root.position.set(m.x, m.y, m.z); m.rig.root.rotation.y = m.yaw; m.adt = (m.adt || 0) + dt; if (inView(m.x, m.y + 1, m.z, 3)) { animMartina(m.rig, Math.min(0.1, m.adt), m.speed); m.adt = 0; } }
    const B = this.boss; if (B) { const r = B.rig.root; r.visible = !B.dead; r.position.set(B.x, B.y + (B.jumpT || 0), B.z); r.rotation.y = B.yaw; animBoss(B.rig, dt, B.st === 'move' && B.mv === 'hop' ? 'hop' : B.st); r.scale.setScalar(B.flash > 0 ? 1.08 : 1);
      if (!this.stars) { const b = MB(); for (let i = 0; i < 5; i++) b.l.add(P.sphere, 0xffe14d, Math.cos(i / 5 * 6.28) * 1.6, 0, Math.sin(i / 5 * 6.28) * 1.6, 0, 0, 0, 0.3, 0.3, 0.3, 0.8); this.stars = toGroup(b, false); this.group.add(this.stars); }
      this.stars.visible = B.st === 'tired' && !B.dead; if (this.stars.visible) { this.stars.position.set(B.x, B.y + B.D.h + 1, B.z); this.stars.rotation.y += dt * 3; } }
    // projectiles + rings (pooled meshes)
    this.pm = this.pm || []; this.rm = this.rm || [];
    this.proj.forEach((p, i) => { let m = this.pm[i]; if (!m) { m = new THREE.Mesh(projGeo, new THREE.MeshStandardMaterial({ roughness: 0.6 })); m.castShadow = true; this.group.add(m); this.pm[i] = m; } m.visible = true; m.material.color.set(p.col); m.position.set(p.x, p.y, p.z); m.rotation.x += dt * 5; });
    for (let i = this.proj.length; i < this.pm.length; i++) this.pm[i].visible = false;
    this.rings.forEach((r, i) => { let m = this.rm[i]; if (!m) { m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 10, 64).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, toneMapped: false })); this.group.add(m); this.rm[i] = m; } m.visible = true; m.material.color.set(r.col); m.position.set(r.x, r.y + 0.25, r.z); m.scale.set(r.rad, 1 + (1 - r.t / r.dur) * 2, r.rad); m.material.opacity = 0.9 * (1 - r.t / r.dur * 0.6); });
    for (let i = this.rings.length; i < this.rm.length; i++) this.rm[i].visible = false;
  }
  // ---------------- danger to a (local) player ----------------
  dangerTo(p) {
    if (p.respawnT > 0 || p.hurtT > 0) return null;
    for (const e of this.list) { if (e.dead) continue; const dx = p.x - e.x, dz = p.z - e.z, dy = p.y - e.y; const hor = Math.hypot(dx, dz); if (hor < e.D.r + 0.3 && dy > -0.6 && dy < 1.2) { if (p.vy < -1 && dy > 0.35 && !e.D.fly) return { stomp: e }; if (p.spin > 0) return null; return { hurt: e }; } }
    const B = this.boss; if (B && B.active && !B.dead) { const dx = p.x - B.x, dz = p.z - B.z, hor = Math.hypot(dx, dz), dy = p.y - (B.y + (B.jumpT || 0));
      if (hor < B.D.r + 0.3 && dy > -0.5 && dy < B.D.h + 0.4) { if (dy > B.D.h - 0.8 && p.vy < 0) return { stompBoss: B }; if (B.st === 'tired' || B.st === 'hurt') return { push: B }; return { hurt: B }; } }
    for (const q of this.proj) { if (Math.hypot(p.x - q.x, p.y + 0.4 - q.y, p.z - q.z) < 0.9) return { hurt: q, proj: q }; }
    for (const r of this.rings) { const d = Math.hypot(p.x - r.x, p.z - r.z); if (Math.abs(d - r.rad) < 0.55 && p.y - r.y < 0.6 && p.y - r.y > -1) return { hurt: r }; }
    return null;
  }
  // ---------------- network ----------------
  snap() {
    const r = (v) => Math.round(v * 100) / 100;
    const o = { e: this.list.map((e) => [e.id, e.type, r(e.x), r(e.y), r(e.z), r(e.yaw), e.dead ? 1 : 0, r(e.speed), e.flash > 0 ? 1 : 0]), pr: this.proj.map((p) => [r(p.x), r(p.y), r(p.z), p.col]), rg: this.rings.map((q) => [r(q.x), r(q.y), r(q.z), r(q.rad), q.col, r(q.t / q.dur)]) };
    if (this.candy) { const c = this.candy; o.c = [r(c.x), r(c.z), r(c.yaw), c.st, r(c.speed)]; }
    if (this.martina) { const m = this.martina; o.m = [r(m.x), r(m.y), r(m.z), r(m.yaw), m.st, r(m.speed)]; }
    if (this.boss) { const B = this.boss; o.b = [r(B.x), r(B.y), r(B.z), r(B.yaw), B.st, B.hp, B.active ? 1 : 0, B.dead ? 1 : 0, r(B.jumpT || 0), B.flash > 0 ? 1 : 0, B.mv || '']; }
    return o; }
  applySnap(o) {
    const seen = new Set(); for (const a of o.e || []) { seen.add(a[0]); let e = this.list.find((q) => q.id === a[0]); if (!e) { e = this.addEnemy(a[1], a[2], a[3], a[4]); e.id = a[0]; }
      e.tx = a[2]; e.ty = a[3]; e.tz = a[4]; e.yaw = a[5]; e.dead = !!a[6]; e.speed = a[7]; e.flash = a[8] ? 0.1 : 0; if (e.x === undefined) { e.x = a[2]; e.y = a[3]; e.z = a[4]; } }
    this.proj = (o.pr || []).map((a) => ({ x: a[0], y: a[1], z: a[2], col: a[3] })); this.rings = (o.rg || []).map((a) => ({ x: a[0], y: a[1], z: a[2], rad: a[3], col: a[4], t: a[5], dur: 1 }));
    if (o.c && this.candy) { const c = this.candy; c.tx = o.c[0]; c.tz = o.c[1]; c.yaw = o.c[2]; c.st = o.c[3]; c.speed = o.c[4]; }
    if (o.m && this.martina) { const m = this.martina; m.tx = o.m[0]; m.ty = o.m[1]; m.tz = o.m[2]; m.yaw = o.m[3]; m.st = o.m[4]; m.speed = o.m[5]; }
    if (o.b && this.boss) { const B = this.boss, a = o.b; B.tx = a[0]; B.ty = a[1]; B.tz = a[2]; B.yaw = a[3]; const was = B.st; B.st = a[4]; B.hp = a[5]; const wasA = B.active; B.active = !!a[6]; const wasD = B.dead; B.dead = !!a[7]; B.jumpT = a[8]; B.flash = a[9] ? 0.1 : 0; B.mv = a[10];
      if (B.active && !wasA) this.g.onBossStart(B, true); if (!B.active && wasA && !B.dead) this.g.onBossReset(B, true); if (B.dead && !wasD) this.g.onBossDefeated(B, true); }
  }
  lerpRemote(dt) { const k = Math.min(1, dt * 10); const L = (o) => { if (o.tx == null) return; o.x = o.x == null ? o.tx : o.x + (o.tx - o.x) * k; if (o.ty != null) o.y = o.y == null ? o.ty : o.y + (o.ty - o.y) * k; o.z = o.z == null ? o.tz : o.z + (o.tz - o.z) * k; };
    this.list.forEach(L); if (this.candy) L(this.candy); if (this.martina) L(this.martina); if (this.boss) L(this.boss); }
}
// is (x,z) inside a wall-ish solid at height y? (for walkers)
const tmpB = [];
function blocked(w, x, z, y, r = 0.45, h = 0.8) { const c = w.near(x - r, z - r, x + r, z + r, tmpB); for (const s of c) { if (s.off) continue; if (s.max[1] <= y + 0.45 || s.min[1] >= y + h) continue; if (x + r > s.min[0] && x - r < s.max[0] && z + r > s.min[2] && z - r < s.max[2]) return true; } return false; }
