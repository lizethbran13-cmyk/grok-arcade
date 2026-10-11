// Host-simulated actors: cartoon animals, the Relic Patrol (chases YOU), Martina "Torty", river crocs and Professor Vintage's machines.
import * as THREE from 'three';
import { makeOfficer, animOfficer, MB, toGroup } from './models.js';
import { makeAnimal, animAnimal, ANIMAL, makeMartina, animMartina, makeMech, animMech } from './creatures.js';
import { BOSSES } from './data.js';
import { P } from './geo.js';
import { star, torus } from './shapes.js';
import { sfx } from './audio.js';
import { inView } from './perf.js';
import { up } from './save.js';
const projGeo = (() => { const g = new THREE.TorusGeometry(0.3, 0.12, 10, 20, Math.PI * 0.85); return g; })(), ballGeo = new THREE.SphereGeometry(0.45, 18, 12);
const OFFICER_NAMES = ['Officer Waffles', 'Officer Pudding', 'Officer Noodle', 'Officer Biscuit', 'Officer Muffin', 'Officer Pickle Jr.'];
const SHOUTS = ['"STOP, RELIC THIEF!"', '"Halt in the name of the museum!"', '"I see a fedora! GET \u2019EM!"', '"Freeze! ...please?"', '"You\u2019re under arrest! Probably!"', '"Come back, I just want to talk! And arrest you!"'];
const LOST = ['"Where\u2019d they go?"', '"Huh. Was it a bush all along?"', '"Lost \u2019em. Donut break?"', '"I\u2019ll get you next time, explorer!"'];
export class Actors {
  constructor(game) { this.g = game; this.list = []; this.cops = []; this.proj = []; this.rings = []; this.crocs = []; this.nid = 1; this.martina = null; this.boss = null; this.group = new THREE.Group(); game.scene.add(this.group); }
  dispose() { this.g.scene.remove(this.group); }
  spawnAll(w) {
    for (const e of w.enemies) { if (e.type === 'croc') this.addCroc(e); else this.addAnimal(e.type, e.x, e.y, e.z, e.o); }
    for (const sp of w.officerSpecs) for (const o of sp.list) this.addCop(o, sp.bounds, sp.o);
    if (w.martinaSpec) this.addMartina(w.martinaSpec);
    if (w.bossSpec) this.addBoss(w.bossSpec);
  }
  addAnimal(type, x, y, z, o = {}) { const D = ANIMAL[type] || ANIMAL.snake; const m = makeAnimal(type); this.group.add(m.root);
    const e = { id: this.nid++, kind: 'a', type, x, y, z, hx: x, hz: z, hy: y, yaw: Math.random() * 6, D, rig: m, st: 'patrol', t: Math.random() * 5, range: o.range || 4, axis: o.axis || null, dead: false, flash: 0, speed: 0, throwT: 2 + Math.random() * 2, scareT: 0 }; this.list.push(e); return e; }
  addCroc(c) { const m = makeAnimal('croc'); this.group.add(m.root); this.crocs.push({ rig: m, path: c.o.path, i: 0, x: c.x, y: c.y, z: c.z, yaw: 0, t: Math.random() * 3 }); }
  addCop(o, bounds, opt = {}) { const chief = !!o.chief; const r = makeOfficer(chief ? 'chief' : 'officer'); this.group.add(r.root);
    const c = { id: this.nid++, kind: 'cop', chief, name: chief ? 'Inspector Pickles' : OFFICER_NAMES[(this.cops.length) % OFFICER_NAMES.length], x: o.x, y: o.y || 0, z: o.z, hx: o.x, hz: o.z, yaw: o.yaw || 0, rig: r, st: o.st || 'patrol', path: o.path || null, pi: 0, t: 0, speed: 0, bounds, lostT: 0, tgt: null, chase: !!opt.chase, shoutT: 0, dizzy: 0, sightR: o.sight || 9.5 }; this.cops.push(c); return c; }
  addMartina(m) { const r = makeMartina(); r.root.scale.setScalar(m.s || 0.42); this.group.add(r.root); this.martina = { kind: 'martina', x: m.x, y: m.y || 0, z: m.z, yaw: m.yaw || 0, rig: r, st: 'idle', speed: 0, label: m.label }; }
  addBoss(b) { const D = BOSSES[b.type]; const r = makeMech(b.type); this.group.add(r.root);
    this.boss = { kind: 'boss', type: b.type, D, x: b.x, y: b.y, z: b.z, yaw: b.yaw || 0, rig: r, st: 'wait', t: 0, hp: D.hp, arena: b.arena, mi: 0, vx: 0, vz: 0, flash: 0, active: false, dead: false, jumpT: 0 }; }
  // ---------------- host simulation ----------------
  step(dt) {
    const g = this.g, w = g.world, ps = g.alivePlayers();
    for (const e of this.list) { if (e.dead) continue; e.t += dt; e.flash = Math.max(0, e.flash - dt);
      let tgt = null, best = e.D.aggro; for (const p of ps) { if (p.hidden) continue; const d = Math.hypot(p.x - e.x, p.z - e.z); if (d < best && Math.abs(p.y - e.y) < (e.D.fly ? 5 : 2)) { best = d; tgt = p; } }
      let vx = 0, vz = 0, sp = e.D.sp;
      // after a bite the critter backs off for a moment (no bite-lock while you stand still on a phone)
      if (!(e.backT > 0)) for (const p of ps) if (Math.hypot(p.x - e.x, p.z - e.z) < e.D.r + 0.4 && Math.abs(p.y - e.y) < 1.2) { e.biteT = (e.biteT || 0) + dt; if (e.biteT > 0.25) { e.backT = 2.4; e.biteT = 0; e.bx = p.x; e.bz = p.z; } }
      // torch-shy critters back away from a lit torch
      let torchP = null; if (e.D.torch) for (const p of ps) if (p.torch && Math.hypot(p.x - e.x, p.z - e.z) < 5 + up('torch') * 1.5) torchP = p;
      if (e.st === 'scared') { e.scareT -= dt; const p = e.from || ps[0]; if (p) { const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz) || 1; vx = dx / d; vz = dz / d; sp *= 1.8; } if (e.scareT <= 0) { e.dead = true; g.onAnimalGone(e); } }
      else if (e.backT > 0) { e.backT -= dt; e.st = 'shy'; const dx = e.x - e.bx, dz = e.z - e.bz, d = Math.hypot(dx, dz) || 1; vx = dx / d; vz = dz / d; sp *= 0.7; }
      else if (torchP) { e.st = 'shy'; const dx = e.x - torchP.x, dz = e.z - torchP.z, d = Math.hypot(dx, dz) || 1; vx = dx / d; vz = dz / d; sp *= 0.9; }
      else if (tgt) { e.st = 'chase'; const dx = tgt.x - e.x, dz = tgt.z - e.z, d = Math.hypot(dx, dz) || 1;
        if (e.type === 'monkey' && d > 3.5) { e.throwT -= dt; if (e.throwT <= 0) { e.throwT = 2.6 + Math.random(); e.st = 'throw'; e.thT = 0.5; this.lob(e.x, e.y + 1.2, e.z, tgt.x, tgt.y + 0.5, tgt.z, 0xfde047, 'banana'); sfx('throw'); } if (d < 7) { vx = 0; vz = 0; } else { vx = dx / d; vz = dz / d; } }
        else { vx = dx / d; vz = dz / d; sp *= 1.2; }
        if (Math.hypot(e.x - e.hx, e.z - e.hz) > e.range + 7) { vx = (e.hx - e.x); vz = (e.hz - e.z); const q = Math.hypot(vx, vz) || 1; vx /= q; vz /= q; } e.face = Math.atan2(dx, dz); }
      else { e.st = 'patrol'; const a = e.t * sp / Math.max(1, e.range) * 0.5; let tx, tz; if (e.axis === 'x') { tx = e.hx + Math.sin(a) * e.range; tz = e.hz; } else if (e.axis === 'z') { tx = e.hx; tz = e.hz + Math.sin(a) * e.range; } else { tx = e.hx + Math.cos(a) * e.range; tz = e.hz + Math.sin(a) * e.range; } const dx = tx - e.x, dz = tz - e.z, d = Math.hypot(dx, dz); if (d > 0.1) { vx = dx / d * Math.min(1, d); vz = dz / d * Math.min(1, d); } e.face = null; }
      const nx = e.x + vx * sp * dt, nz = e.z + vz * sp * dt;
      if (e.D.fly) { e.x = nx; e.z = nz; const ty = tgt && e.st === 'chase' ? tgt.y + 1.4 : e.hy; e.y += (ty - e.y) * Math.min(1, dt * 1.5); }
      else { const gr = w.ground(nx, nz, e.y + 0.6, 0.1); if (gr.y > -1e8 && Math.abs(gr.y - e.y) < 0.7 && !blocked(w, nx, nz, e.y)) { e.x = nx; e.z = nz; e.y = gr.y; } else { e.t += 1.3; if (e.st === 'scared') { e.scareT = Math.min(e.scareT, 0.2); } } }
      const fy = e.face != null && (e.st === 'chase' || e.st === 'throw') ? e.face : (vx || vz) ? Math.atan2(vx, vz) : null; if (fy != null) { let d = fy - e.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; e.yaw += d * Math.min(1, dt * 7); }
      if (e.thT > 0) { e.thT -= dt; e.st = 'throw'; } e.speed = Math.hypot(vx, vz) * sp; }
    this.stepCops(dt, ps); this.stepBoss(dt, ps);
    for (const p of this.proj) { if (p.dead) continue; if (p.delay > 0) { p.delay -= dt; continue; } p.t += dt; p.vy -= 18 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; const gr = w.ground(p.x, p.z, p.y + 0.5, 0.1); if (p.y <= gr.y + 0.3 || p.t > 4) { p.dead = true; g.net.fx('splat', p.x, Math.max(gr.y, p.y), p.z, p.col); if (p.kind !== 'banana') this.addRing(p.x, Math.max(gr.y, p.y - 0.3), p.z, 0.4, p.kind === 'bomb' ? 2.6 : 2.2, p.kind === 'bomb' ? 0xf0abfc : p.col, 0.55); } }
    for (const r of this.rings) { if (r.dead) continue; r.t += dt; r.rad = r.r0 + (r.r1 - r.r0) * (r.t / r.dur); if (r.t >= r.dur) r.dead = true; }
    this.proj = this.proj.filter((p) => !p.dead); this.rings = this.rings.filter((r) => !r.dead);
    for (const c of this.crocs) { c.t += dt; const P_ = c.path; if (P_ && P_.length) { const q = P_[c.i % P_.length]; const dx = q[0] - c.x, dz = q[1] - c.z, d = Math.hypot(dx, dz); if (d < 0.5) c.i++; else { c.x += dx / d * 1.6 * dt; c.z += dz / d * 1.6 * dt; let a = Math.atan2(dx, dz) - c.yaw; while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; c.yaw += a * Math.min(1, dt * 2); } } }
  }
  // the Relic Patrol: patrol -> spot (needs line of sight, hiding works) -> chase -> lose you -> search -> back home
  canSee(c, p) { if (p.hidden || p.respawnT > 0 || p.caughtT > 0 || (p.graceT > 0 && !c.chase)) return false; const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz); if (Math.abs(p.y - c.y) > 4) return false;
    const R = c.chase ? 40 : Math.max(5, c.sightR - up('sneak') * 2) ; if (d > R) return false; if (!c.chase && d > 3) { let a = Math.atan2(dx, dz) - c.yaw; while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; if (Math.abs(a) > 1.15) return false; }
    const o = new THREE.Vector3(c.x, c.y + 1.5, c.z), dir = new THREE.Vector3(dx, p.y + 1.2 - c.y - 1.5, dz); const L = dir.length(); dir.normalize(); const hit = this.g.world.ray(o, dir, L, (s) => !s.off && !s.nocam && (s.max[1] - s.min[1]) > 1.0 && !s.floor); return hit >= L - 0.3; }
  stepCops(dt, ps) { const g = this.g, w = g.world;
    for (const c of this.cops) { c.t += dt; c.shoutT -= dt; let tx = c.x, tz = c.z, sp = 0; const B = c.bounds;
      if (c.st === 'dizzy') { c.dizzy -= dt; if (c.dizzy <= 0) { c.st = 'search'; c.t = 0; } }
      else if (c.st === 'cheer' || c.st === 'gone') { if (c.t > 2.2) { if (c.chase && c.st === 'cheer') { c.st = 'chase'; c.t = 0; } else if (c.st === 'cheer') { c.st = 'return'; c.t = 0; } } }
      else { let seen = null, bd = 1e9; for (const p of ps) if (this.canSee(c, p)) { const d = Math.hypot(p.x - c.x, p.z - c.z); if (d < bd) { bd = d; seen = p; } }
        if (seen) { if (c.st !== 'chase') { c.st = 'chase'; c.t = 0; sfx('whistle'); if (c.shoutT <= 0) { c.shoutT = 6; g.toastMsg('🚨 ' + c.name + ': ' + SHOUTS[(Math.random() * SHOUTS.length) | 0]); } g.net.fx('alert', c.x, c.y + 2.4, c.z); } c.tgt = seen; c.lostT = 0; c.lx = seen.x; c.lz = seen.z; }
        if (c.st === 'chase') { if (!seen) { c.lostT += dt; if (c.lostT > (c.chase ? 6 : 2.5)) { c.st = 'search'; c.t = 0; if (c.shoutT <= 0) { c.shoutT = 5; g.toastMsg('❓ ' + c.name + ': ' + LOST[(Math.random() * LOST.length) | 0]); } } }
          const p = c.tgt; tx = seen ? p.x : c.lx; tz = seen ? p.z : c.lz; sp = (c.chief ? 4.9 : 5.3) + (c.chase ? 0.3 : 0);
          if (p && seen && Math.hypot(p.x - c.x, p.z - c.z) < 1.15 && Math.abs(p.y - c.y) < 1.4) { g.catchPlayer(p, c); c.st = 'cheer'; c.t = 0; } }
        else if (c.st === 'search') { sp = 1.4; tx = c.x + Math.sin(c.t * 1.3) * 2; tz = c.z + Math.cos(c.t * 1.3) * 2; c.yaw += dt * 1.5; if (c.t > 3.5) { c.st = c.chase ? 'gone' : 'return'; c.t = 0; if (c.chase) { g.onChaseLost(c); } } }
        else if (c.st === 'return') { tx = c.hx; tz = c.hz; sp = 2.6; if (Math.hypot(c.x - c.hx, c.z - c.hz) < 0.6) { c.st = 'patrol'; c.pi = 0; } }
        else if (c.st === 'patrol') { if (c.path && c.path.length) { const q = c.path[c.pi % c.path.length]; tx = q[0]; tz = q[1]; sp = 2.2; if (Math.hypot(c.x - tx, c.z - tz) < 0.5) c.pi++; } else { c.yaw += Math.sin(c.t * 0.5) * dt * 0.8; } } }
      if (sp > 0) { const dx = tx - c.x, dz = tz - c.z, d = Math.hypot(dx, dz); if (d > 0.15) { let nx = c.x + dx / d * sp * dt, nz = c.z + dz / d * sp * dt; if (B) { nx = Math.max(B[0], Math.min(B[2], nx)); nz = Math.max(B[1], Math.min(B[3], nz)); }
        const gr = w.ground(nx, nz, c.y + 0.7, 0.2); const ok = (x, z) => { const gg = w.ground(x, z, c.y + 0.7, 0.2); return gg.y > -1e8 && Math.abs(gg.y - c.y) < 0.8 && !blocked(w, x, z, c.y, 0.45, 1.6); };
        if (ok(nx, nz)) { c.x = nx; c.z = nz; c.y = gr.y; } else if (ok(nx, c.z)) c.x = nx; else if (ok(c.x, nz)) c.z = nz;
        let a = Math.atan2(dx, dz) - c.yaw; while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; c.yaw += a * Math.min(1, dt * 6); } c.speed = d > 0.15 ? sp : 0; } else c.speed = 0; } }
  stunCop(c, from) { if (c.st === 'dizzy' || c.st === 'gone') return; c.st = 'dizzy'; c.dizzy = 4; c.t = 0; this.g.net.fx('dizzy', c.x, c.y + 2, c.z); this.g.toastMsg('💫 ' + c.name + ' is seeing stars!'); }
  scareAnimal(e, from) { if (e.dead || e.st === 'scared') return; e.st = 'scared'; e.scareT = 1.6; e.from = from; this.g.net.fx('scare', e.x, e.y + 0.6, e.z); }
  stepBoss(dt, ps) { const B = this.boss; if (!B || B.dead) return; const g = this.g, D = B.D, A = B.arena; B.flash = Math.max(0, B.flash - dt);
    const inA = ps.filter((p) => p.x > A[0] - 1 && p.x < A[2] + 1 && p.z > A[1] - 1 && p.z < A[3] + 1 && p.y > B.y - 2);
    if (!B.active) { if (inA.length) { B.active = true; B.st = 'intro'; B.t = 0; g.onBossStart(B); } else return; }
    if (!inA.length && ps.length && B.st !== 'intro') { B.hp = D.hp; B.active = false; B.st = 'wait'; g.onBossReset(B); return; }
    B.t += dt; let tgt = null, bd = 1e9; for (const p of inA) { const d = Math.hypot(p.x - B.x, p.z - B.z); if (d < bd) { bd = d; tgt = p; } } tgt = tgt || ps[0];
    const face = (x, z, k = 4) => { let ty = Math.atan2(x - B.x, z - B.z), d = ty - B.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; B.yaw += d * Math.min(1, dt * k); };
    const clampA = () => { B.x = Math.max(A[0] + D.r, Math.min(A[2] - D.r, B.x)); B.z = Math.max(A[1] + D.r, Math.min(A[3] - D.r, B.z)); };
    if (B.st === 'intro') { if (tgt) face(tgt.x, tgt.z); if (B.t > 2.4) { B.st = 'move'; B.t = 0; } }
    else if (B.st === 'move') { if (tgt) { face(tgt.x, tgt.z); const dx = tgt.x - B.x, dz = tgt.z - B.z, d = Math.hypot(dx, dz) || 1; if (d > 7) { B.x += dx / d * D.sp * dt; B.z += dz / d * D.sp * dt; } else { B.x -= dz / d * D.sp * dt; B.z += dx / d * D.sp * dt; } clampA(); }
      if (B.t > 1.8) { B.mv = D.moves[B.mi++ % D.moves.length]; B.st = 'attack'; B.t = 0; B.n = 0; B.landed = false; if (B.mv === 'charge' && tgt) { const dx = tgt.x - B.x, dz = tgt.z - B.z, d = Math.hypot(dx, dz) || 1; B.vx = dx / d; B.vz = dz / d; B.windup = 0.9; g.net.fx('warn', B.x, B.y + D.h + 1, B.z); } if (B.mv === 'hop' && tgt) { B.hx0 = B.x; B.hz0 = B.z; B.hx1 = tgt.x; B.hz1 = tgt.z; } this.sigStart(B, tgt); } }
    else if (B.st === 'attack') { const mv = B.mv;
      if (mv === 'lob') { if (tgt) face(tgt.x, tgt.z); const n = 3 + (D.hp - B.hp > 1 ? 1 : 0); if (B.t > 0.5 * B.n + 0.35 && B.n < n && tgt) { B.n++; this.lob(B.x, B.y + D.h, B.z, tgt.x + (Math.random() - 0.5) * 3, tgt.y, tgt.z + (Math.random() - 0.5) * 3, D.proj, 'ball'); sfx('throw'); } if (B.t > 0.5 * n + 1.5) this.tire(B); }
      else if (mv === 'hop') { const T = 1.1; const k = Math.min(1, B.t / T); B.x = B.hx0 + (B.hx1 - B.hx0) * k; B.z = B.hz0 + (B.hz1 - B.hz0) * k; clampA(); B.jumpT = Math.sin(k * Math.PI) * 4.5; if (B.t >= T && !B.landed) { B.landed = true; B.jumpT = 0; this.addRing(B.x, B.y, B.z, D.r, D.r + 8, 0xffffff, 1.2); g.net.fx('stomp', B.x, B.y, B.z); B.n++; if (B.n < 2 && tgt) { B.t = 0; B.landed = false; B.hx0 = B.x; B.hz0 = B.z; B.hx1 = tgt.x; B.hz1 = tgt.z; } } if (B.landed && B.t > T + 0.6) { B.landed = false; this.tire(B); } }
      else if (mv === 'charge') { if (B.windup > 0) { B.windup -= dt; if (tgt) { const dx = tgt.x - B.x, dz = tgt.z - B.z, d = Math.hypot(dx, dz) || 1; B.vx = dx / d; B.vz = dz / d; } face(B.x + B.vx, B.z + B.vz, 10); } else { const sp = 13; B.x += B.vx * sp * dt; B.z += B.vz * sp * dt; const ox = B.x, oz = B.z; clampA(); if (ox !== B.x || oz !== B.z || B.t > 3.5) { g.net.fx('stomp', B.x, B.y, B.z); g.toastMsg('BONK! He\u2019s dizzy, WHIP HIM! 💫'); this.tire(B, 4.4); } } }
      else if (this.sigStep(B, tgt, dt, face, clampA)) {}
      else if (mv === 'ring') { if (B.t > 0.8 * B.n + 0.3 && B.n < 3) { B.n++; this.addRing(B.x, B.y, B.z, D.r, D.r + 11, D.proj, 1.7); g.net.fx('stomp', B.x, B.y, B.z); } if (B.t > 3.4) this.tire(B); }
      else if (mv === 'spawn') { if (B.n === 0 && B.t > 0.5) { B.n = 1; const typ = D.spawn || 'monkey'; for (let i = 0; i < 2; i++) { const a = Math.random() * 6.28; const e = this.addAnimal(typ, B.x + Math.cos(a) * (D.r + 2.5), B.y + (typ === 'bat' ? 1.5 : 0), B.z + Math.sin(a) * (D.r + 2.5), { range: 3 }); e.minion = true; } g.net.fx('stomp', B.x, B.y, B.z); } if (B.t > 2) this.tire(B); } }
    else if (B.st === 'tired') { if (B.t > B.tireT) { B.st = 'move'; B.t = 0; } }
    else if (B.st === 'hurt') { if (B.t > 0.9) { B.st = 'move'; B.t = 0; } } }
  // ---------------- signature moves (one per machine) ----------------
  sigStart(B, tgt) { const g = this.g, D = B.D, mv = B.mv; if (mv === D.sig) g.toastMsg({ gust: '🌪️ ROTOR GUST! Grab the floor... er, run AWAY!', burrow: '🕳️ The drill dives underground! Watch for the rumbling ring!', rampage: '🚂 RAMPAGE! Three charges in a row: dodge sideways!', laser: '👁️ EYE LASER! JUMP over the sweeping beam!', rain: '💣 Bomb rain! Get out of the glowing circles!' }[mv] || '');
    if (mv === 'rampage') { B.n = 0; B.windup = 0.8; if (tgt) { const dx = tgt.x - B.x, dz = tgt.z - B.z, d = Math.hypot(dx, dz) || 1; B.vx = dx / d; B.vz = dz / d; } g.net.fx('warn', B.x, B.y + D.h + 1, B.z); }
    if (mv === 'laser') { B.laser = B.yaw; B.lsp = (Math.random() < 0.5 ? 1 : -1) * 1.5; g.net.fx('warn', B.x, B.y + D.h + 1, B.z); }
    if (mv === 'burrow') g.net.fx('warn', B.x, B.y + D.h + 1, B.z);
    if (mv === 'gust') g.net.fx('warn', B.x, B.y + D.h + 1, B.z); }
  sigStep(B, tgt, dt, face, clampA) { const g = this.g, D = B.D, mv = B.mv;
    if (mv === 'gust') { // spins the rotor up, then a 2 s gust shoves everyone near outwards (no damage, but there are spikes / walls)
      if (tgt) face(tgt.x, tgt.z, 2); if (B.t > 0.9 && B.t < 2.9 && Math.random() < 0.6) { const a = Math.random() * 6.28, r = 2 + Math.random() * 7; g.fx.puff(B.x + Math.cos(a) * r, B.y + 0.6, B.z + Math.sin(a) * r, 1, 0xbbf7d0); }
      if (B.t > 0.9 && B.t < 2.9 && ((B.t * 3) | 0) !== B.n) { B.n = (B.t * 3) | 0; this.addRing(B.x, B.y, B.z, D.r, D.r + 8, 0xbbf7d0, 0.6, true); }
      if (B.t > 3.6) this.tire(B, 3.0); return true; }
    if (mv === 'burrow') { // sinks, tunnels under the target (warning ring follows it), then bursts up with a shockwave
      if (B.t < 0.7) { B.jumpT = -B.t / 0.7 * (D.h + 0.5); }
      else if (B.t < 2.6) { B.jumpT = -(D.h + 0.5); if (tgt) { const dx = tgt.x - B.x, dz = tgt.z - B.z, d = Math.hypot(dx, dz); if (d > 0.3 && B.t < 2.0) { B.x += dx / d * Math.min(d, 9 * dt); B.z += dz / d * Math.min(d, 9 * dt); clampA(); } }
        if (((B.t * 4) | 0) !== B.n) { B.n = (B.t * 4) | 0; this.addRing(B.x, B.y, B.z, 0.6, D.r + 0.6, 0xa78bfa, 0.3, true); if (Math.random() < 0.5) g.fx.puff(B.x, B.y + 0.2, B.z, 3, 0x8d7a66); } }
      else if (!B.landed) { B.landed = true; B.jumpT = 0; this.addRing(B.x, B.y, B.z, D.r, D.r + 7, 0xa78bfa, 1.0); g.net.fx('stomp', B.x, B.y, B.z); }
      if (B.t > 3.6) { B.jumpT = 0; this.tire(B, 3.6); } return true; }
    if (mv === 'rampage') { // three charges back to back, re-aiming after each wall bonk; dizzy for longer afterwards
      if (B.windup > 0) { B.windup -= dt; if (tgt) { const dx = tgt.x - B.x, dz = tgt.z - B.z, d = Math.hypot(dx, dz) || 1; B.vx = dx / d; B.vz = dz / d; } face(B.x + B.vx, B.z + B.vz, 10); return true; }
      const sp = 12; B.x += B.vx * sp * dt; B.z += B.vz * sp * dt; const ox = B.x, oz = B.z; clampA(); if (Math.random() < 0.5) g.fx.puff(B.x, B.y + 0.3, B.z, 2, 0xe5e7eb);
      if (ox !== B.x || oz !== B.z) { g.net.fx('stomp', B.x, B.y, B.z); B.n++; if (B.n >= 3) { g.toastMsg('CHOO... choo... He\u2019s dizzy! WHIP HIM! 💫'); this.tire(B, 5); } else { B.windup = 0.85; g.net.fx('warn', B.x, B.y + D.h + 1, B.z); } }
      return true; }
    if (mv === 'laser') { // a low eye beam sweeps a full circle: jump over it when it reaches you
      if (B.t > 0.8) B.laser += B.lsp * dt; if (B.t > 0.8 + (Math.PI * 2) / Math.abs(B.lsp)) { B.laser = null; this.tire(B, 3.4); } return true; }
    if (mv === 'rain') { // Vintage flies up and drops bombs on glowing circles around every explorer
      if (B.t < 4.4) B.jumpT = Math.min(3.5, B.t * 4); if (B.t > 0.4 && B.n < 7 && B.t > 0.4 + B.n * 0.4) { const ps = this.g.alivePlayers ? this.g.alivePlayers() : []; const p = ps[B.n % Math.max(1, ps.length)] || tgt; if (p) { const tx = p.x + (Math.random() - 0.5) * 5, tz = p.z + (Math.random() - 0.5) * 5;
          this.addRing(tx, p.y, tz, 1.4, 1.5, 0xf0abfc, 1.25, true); const sy = B.y + 14; this.proj.push({ id: this.nid++, x: tx, y: sy, z: tz, vx: 0, vy: -2, vz: 0, t: 0, col: 0x581c87, kind: 'bomb', delay: 0.7 }); } B.n++; }
      if (B.t > 4.4) { B.jumpT = Math.max(0, B.jumpT - dt * 6); if (B.jumpT <= 0) this.tire(B, 3.4); } return true; }
    return false; }
  tire(B, t = 3.4) { B.st = 'tired'; B.t = 0; B.tireT = t; B.jumpT = 0; }
  lob(x, y, z, tx, ty, tz, col, kind) { const T = 1.1; const vx = (tx - x) / T, vz = (tz - z) / T, vy = (ty - y + 0.5 * 18 * T * T) / T; this.proj.push({ id: this.nid++, x, y, z, vx, vy, vz, t: 0, col, kind }); }
  addRing(x, y, z, r0, r1, col, dur, safe = false) { this.rings.push({ id: this.nid++, x, y, z, r0, r1, rad: r0, col, dur, t: 0, safe }); }
  damage(id, dmg, from) { const g = this.g;
    if (id === 'boss') { const B = this.boss; if (!B || B.dead || !B.active) return false; if (B.st !== 'tired') { if (B.flash <= 0) { B.flash = 0.25; g.net.fx('clink', B.x, B.y + B.D.h * 0.6, B.z); } return false; }
      B.hp -= 1; B.flash = 0.4; B.st = 'hurt'; B.t = 0; g.net.fx('bosshit', B.x, B.y + B.D.h * 0.6, B.z); if (B.hp <= 0.01) { B.dead = true; B.st = 'dead'; this.list.forEach((e) => { if (e.minion && !e.dead) { e.dead = true; } }); g.onBossDefeated(B); } else g.toastMsg(['"Ow! My monocle!"', '"You ruffian! That was my good coat!"', '"Unhand my machine!"', '"Curses! Double curses!"'][B.hp % 4]); return true; }
    const e = this.list.find((q) => q.id === id); if (e) { this.scareAnimal(e, from); return true; } const c = this.cops.find((q) => q.id === id); if (c) { this.stunCop(c, from); return true; } return false; }
  // ---------------- visuals ----------------
  render(dt) {
    for (const e of this.list) { const r = e.rig.root; if (e.dead) { if (r.visible) { r.visible = false; this.g.fx.puff(e.x, e.y + 0.4, e.z, 10, 0xffffff); } continue; } r.visible = true; r.position.set(e.x, e.y, e.z); r.rotation.y = e.yaw; e.adt = (e.adt || 0) + dt; if (inView(e.x, e.y + 0.6, e.z, 1.8)) { animAnimal(e.rig, Math.min(0.1, e.adt), e.speed, e.st); e.adt = 0; } }
    for (const c of this.cops) { const r = c.rig.root; r.visible = c.st !== 'gone' || c.t < 0.4; r.position.set(c.x, c.y, c.z); r.rotation.y = c.yaw; c.adt = (c.adt || 0) + dt; if (inView(c.x, c.y + 1, c.z, 2.5)) { animOfficer(c.rig, Math.min(0.1, c.adt), c.speed, c.st); c.adt = 0; } }
    for (const c of this.crocs) { const r = c.rig.root; r.position.set(c.x, c.y, c.z); r.rotation.y = c.yaw; c.adt = (c.adt || 0) + dt; if (inView(c.x, c.y, c.z, 3)) { animAnimal(c.rig, c.adt, 0, ''); c.adt = 0; } }
    const m = this.martina; if (m) { m.rig.root.position.set(m.x, m.y, m.z); m.rig.root.rotation.y = m.yaw; m.adt = (m.adt || 0) + dt; if (inView(m.x, m.y + 0.5, m.z, 2)) { animMartina(m.rig, Math.min(0.1, m.adt), m.speed); m.adt = 0; } }
    const B = this.boss; if (B) { const r = B.rig.root; r.visible = !B.dead; r.position.set(B.x, B.y + (B.jumpT || 0), B.z); r.rotation.y = B.yaw; animMech(B.rig, dt, B.st === 'attack' && B.mv === 'hop' ? 'move' : B.st); r.scale.setScalar(B.flash > 0 ? 1.08 : 1);
      if (!this.stars) { const b = MB(); for (let i = 0; i < 5; i++) b.l.add(star(), 0xffe14d, Math.cos(i / 5 * 6.28) * 1.6, 0, Math.sin(i / 5 * 6.28) * 1.6, 0, 0, 0, 0.3, 0.3, 0.3, 0.8); this.stars = toGroup(b, false); this.group.add(this.stars); }
      this.stars.visible = B.st === 'tired' && !B.dead; if (this.stars.visible) { this.stars.position.set(B.x, B.y + B.D.h + 1.2, B.z); this.stars.rotation.y += dt * 3; } }
    if (B) { if (!this.beamM) { this.beamM = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1, 12).rotateX(Math.PI / 2).translate(0, 0, 0.5), new THREE.MeshBasicMaterial({ color: 0xff3b3b, toneMapped: false })); this.beamGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1, 12, 1, true).rotateX(Math.PI / 2).translate(0, 0, 0.5), new THREE.MeshBasicMaterial({ color: 0xff8a8a, transparent: true, opacity: 0.35, toneMapped: false, depthWrite: false })); this.beamM.add(this.beamGlow); this.group.add(this.beamM); }
      const on = !B.dead && B.st === 'attack' && B.mv === 'laser' && B.laser != null; this.beamM.visible = on; if (on) { this.beamM.position.set(B.x + Math.sin(B.laser) * B.D.r, B.y + 0.45, B.z + Math.cos(B.laser) * B.D.r); this.beamM.rotation.y = B.laser; this.beamM.scale.set(1, 1, 15 - B.D.r); this.beamGlow.scale.set(1 + Math.sin(this.g.T * 30) * 0.15, 1 + Math.sin(this.g.T * 30) * 0.15, 1); if (Math.random() < 0.4) this.g.fx.puff(B.x + Math.sin(B.laser) * 15, B.y + 0.2, B.z + Math.cos(B.laser) * 15, 1, 0xff8a8a); } }
    this.pm = this.pm || []; this.rm = this.rm || [];
    this.proj.forEach((p, i) => { let m = this.pm[i]; if (!m) { m = new THREE.Mesh(ballGeo, new THREE.MeshStandardMaterial({ roughness: 0.4 })); m.castShadow = true; this.group.add(m); this.pm[i] = m; } m.geometry = p.kind === 'banana' ? projGeo : ballGeo; m.visible = !(p.delay > 0); m.material.color.set(p.col); m.scale.setScalar(p.kind === 'bomb' ? 1.35 : 1); m.position.set(p.x, p.y, p.z); m.rotation.x += dt * 8; m.rotation.z += dt * 5; });
    for (let i = this.proj.length; i < this.pm.length; i++) this.pm[i].visible = false;
    this.rings.forEach((r, i) => { let m = this.rm[i]; if (!m) { m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 10, 64).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, toneMapped: false })); this.group.add(m); this.rm[i] = m; } m.visible = true; m.material.color.set(r.col); m.position.set(r.x, r.y + 0.25, r.z); m.scale.set(r.rad, 1 + (1 - r.t / r.dur) * 2, r.rad); m.material.opacity = 0.9 * (1 - r.t / r.dur * 0.6); });
    for (let i = this.rings.length; i < this.rm.length; i++) this.rm[i].visible = false;
  }
  dangerTo(p) {
    if (p.respawnT > 0 || p.hurtT > 0 || p.caughtT > 0) return null;
    for (const e of this.list) { if (e.dead || e.st === 'scared' || e.st === 'shy') continue; const dx = p.x - e.x, dz = p.z - e.z, dy = p.y - e.y; if (Math.hypot(dx, dz) < e.D.r + 0.35 && dy > -1.2 && dy < 1.2) return { hurt: e }; }
    const B = this.boss; if (B && B.active && !B.dead) { const dx = p.x - B.x, dz = p.z - B.z, hor = Math.hypot(dx, dz), dy = p.y - (B.y + (B.jumpT || 0));
      if (hor < B.D.r + 0.35 && dy > -0.5 && dy < B.D.h + 0.4) { if (B.st === 'tired' || B.st === 'hurt' || B.st === 'intro') return { push: B }; return { hurt: B }; } }
    if (B && B.active && !B.dead && B.st === 'attack' && B.mv === 'gust') { const dx = p.x - B.x, dz = p.z - B.z, hor = Math.hypot(dx, dz); if (hor < B.D.r + 8.5 && hor > 0.1) return { gust: B, k: 1 - hor / (B.D.r + 9) }; }
    if (B && B.active && !B.dead && B.laser != null && B.st === 'attack' && B.mv === 'laser') { const dx = p.x - B.x, dz = p.z - B.z, hor = Math.hypot(dx, dz); let da = Math.atan2(dx, dz) - B.laser; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2; if (hor > B.D.r && hor < 15 && Math.abs(da) * hor < 0.5 && p.y - B.y < 0.75) return { hurt: B }; }
    for (const q of this.proj) { if (Math.hypot(p.x - q.x, p.y + 0.9 - q.y, p.z - q.z) < 0.95) return { hurt: q, proj: q }; }
    for (const r of this.rings) { if (r.safe) continue; const d = Math.hypot(p.x - r.x, p.z - r.z); if (Math.abs(d - r.rad) < 0.55 && p.y - r.y < 0.6 && p.y - r.y > -1) return { hurt: r }; }
    return null; }
  // ---------------- network ----------------
  snap() { const r = (v) => Math.round(v * 100) / 100;
    const o = { e: this.list.map((e) => [e.id, e.type, r(e.x), r(e.y), r(e.z), r(e.yaw), e.dead ? 1 : 0, r(e.speed), e.st]), c: this.cops.map((c) => [r(c.x), r(c.y), r(c.z), r(c.yaw), c.st, r(c.speed)]), pr: this.proj.map((p) => [r(p.x), r(p.y), r(p.z), p.col, p.kind === 'banana' ? 1 : p.kind === 'bomb' ? 2 : 0, p.delay > 0 ? 1 : 0]), rg: this.rings.map((q) => [r(q.x), r(q.y), r(q.z), r(q.rad), q.col, r(q.t / q.dur), q.safe ? 1 : 0]) };
    if (this.boss) { const B = this.boss; o.b = [r(B.x), r(B.y), r(B.z), r(B.yaw), B.st, B.hp, B.active ? 1 : 0, B.dead ? 1 : 0, r(B.jumpT || 0), B.flash > 0 ? 1 : 0, B.mv || '', B.laser != null && B.st === 'attack' ? r(B.laser) : null]; }
    o.k = this.crocs.map((c) => [r(c.x), r(c.z), r(c.yaw)]); return o; }
  applySnap(o) {
    for (const a of o.e || []) { let e = this.list.find((q) => q.id === a[0]); if (!e) { e = this.addAnimal(a[1], a[2], a[3], a[4]); e.id = a[0]; } e.tx = a[2]; e.ty = a[3]; e.tz = a[4]; e.yaw = a[5]; e.dead = !!a[6]; e.speed = a[7]; e.st = a[8]; }
    (o.c || []).forEach((a, i) => { const c = this.cops[i]; if (!c) return; c.tx = a[0]; c.ty = a[1]; c.tz = a[2]; c.yaw = a[3]; const was = c.st; c.st = a[4]; c.speed = a[5]; if (c.st === 'chase' && was !== 'chase') sfx('whistle'); });
    this.proj = (o.pr || []).map((a) => ({ x: a[0], y: a[1], z: a[2], col: a[3], kind: a[4] === 1 ? 'banana' : a[4] === 2 ? 'bomb' : 'ball', delay: a[5] ? 1 : 0 })); this.rings = (o.rg || []).map((a) => ({ x: a[0], y: a[1], z: a[2], rad: a[3], col: a[4], t: a[5], dur: 1, safe: !!a[6] }));
    (o.k || []).forEach((a, i) => { const c = this.crocs[i]; if (c) { c.x = a[0]; c.z = a[1]; c.yaw = a[2]; } });
    if (o.b && this.boss) { const B = this.boss, a = o.b; B.tx = a[0]; B.ty = a[1]; B.tz = a[2]; B.yaw = a[3]; B.st = a[4]; B.hp = a[5]; const wasA = B.active; B.active = !!a[6]; const wasD = B.dead; B.dead = !!a[7]; B.jumpT = a[8]; B.flash = a[9] ? 0.1 : 0; B.mv = a[10]; B.laser = a[11];
      if (B.active && !wasA) this.g.onBossStart(B, true); if (!B.active && wasA && !B.dead) this.g.onBossReset(B, true); if (B.dead && !wasD) this.g.onBossDefeated(B, true); } }
  lerpRemote(dt) { const k = Math.min(1, dt * 10); const L = (o) => { if (o.tx == null) return; o.x = o.x == null ? o.tx : o.x + (o.tx - o.x) * k; if (o.ty != null) o.y = o.y == null ? o.ty : o.y + (o.ty - o.y) * k; o.z = o.z == null ? o.tz : o.z + (o.tz - o.z) * k; };
    this.list.forEach(L); this.cops.forEach(L); if (this.boss) L(this.boss); }
}
const tmpB = [];
function blocked(w, x, z, y, r = 0.45, h = 0.9) { const c = w.near(x - r, z - r, x + r, z + r, tmpB); for (const s of c) { if (s.off) continue; if (s.max[1] <= y + 0.5 || s.min[1] >= y + h) continue; if (x + r > s.min[0] && x - r < s.max[0] && z + r > s.min[2] && z - r < s.max[2]) return true; } return false; }
