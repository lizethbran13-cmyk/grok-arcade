// Explorer: platformer physics vs box colliders, whip (swing + stun), torch, hiding, pushing blocks, getting "arrested".
import * as THREE from 'three';
import { topOf } from './world.js';
import { makeHero, animHero } from './models.js';
import { sfx } from './audio.js';
import { up } from './save.js';
const R = 0.36, HGT = 1.7, STEP = 0.5;
const G_UP = 25, G_DN = 34, JUMP = 10.0, JUMP2 = 9.0, MAXF = 28;
const tmp = [];
export class Player {
  constructor(o) {
    Object.assign(this, { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, onGround: false, gs: null, jumps: 0, coyote: 0, jbuf: 0, air: 0, whipT: 0, whipCd: 0, swing: null, hurtT: 0, respawnT: 0, speed: 0, dead: false, torch: false, hidden: false, caughtT: 0, pushT: 0, pushing: false, sand: 0, wave: 0 });
    this.hero = o.hero || 'max'; this.outfit = o.outfit || 'classic'; this.name = o.name || 'Explorer'; this.color = o.color || '#f59e0b'; this.local = !!o.local; this.pid = o.pid || 'me'; this.slot = o.slot || 0;
    this.rig = makeHero(this.hero, this.outfit); this.root = this.rig.root;
    this.maxHearts = 4 + (this.local ? up('hearts') : 0); this.hearts = this.maxHearts; this.cp = null;
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.45, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.renderOrder = 1; this.blob = sh;
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.022, 1, 6).translate(0, 0.5, 0).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5b3a1e, roughness: 0.7 })); line.visible = false; line.castShadow = true; this.whipLine = line;
  }
  addTo(scene) { scene.add(this.root, this.blob, this.whipLine); }
  removeFrom(scene) { scene.remove(this.root, this.blob, this.whipLine); }
  place(p, yaw = 0) { this.x = p[0]; this.y = p[1]; this.z = p[2]; this.vx = this.vy = this.vz = 0; this.yaw = yaw; this.swing = null; this.onGround = false; this.hidden = false; this.caughtT = 0; this.sand = 0; }
  get runSpeed() { return 6.4 + up('speed') * 0.6 + (this.hero === 'zoe' ? 0.3 : 0); }
  get whipRange() { return 11.5 + up('whip') * 2.5; }
  // ---------------- local control ----------------
  update(dt, inp, game) {
    const w = game.world; if (this.graceT > 0) this.graceT -= dt; if (this.respawnT > 0) { this.respawnT -= dt; if (this.respawnT <= 0) this.doRespawn(game); this.anim(dt); return; }
    if (this.caughtT > 0) { this.caughtT -= dt; this.vx = this.vz = 0; if (this.caughtT <= 0) { this.respawnT = 0.01; this.dead = false; } this.anim(dt); return; }
    this.hurtT = Math.max(0, this.hurtT - dt); this.whipCd -= dt; this.whipT = Math.max(0, this.whipT - dt); this.jbuf -= dt; this.coyote -= dt; this.wave = Math.max(0, this.wave - dt);
    if (inp.jumpP) this.jbuf = 0.14;
    if (inp.torchP) { this.torch = !this.torch; sfx(this.torch ? 'torch' : 'click'); game.onTorch && game.onTorch(this); }
    // ---- whip swing (scripted arc through the ring: fair and never misses) ----
    if (this.swing) { const s = this.swing; s.t += dt / s.dur; const t = Math.min(1, s.t);
      const nx = s.x0 + (s.x1 - s.x0) * t, nz = s.z0 + (s.z1 - s.z0) * t, ny0 = s.y0 + (s.y1 - s.y0) * t + Math.sin(t * Math.PI) * (s.land ? 1.9 : -s.sag), gy = w.ground(nx, nz, Math.max(s.y0, s.y1) + 0.5, 0.3).y, ny = Math.max(ny0, gy + 0.08); // never dip through the floor/bank
      this.vx = (nx - this.x) / dt; this.vz = (nz - this.z) / dt; this.vy = (ny - this.y) / dt; this.yaw = Math.atan2(s.x1 - s.x0, s.z1 - s.z0);
      const ox = this.x, oz = this.z; this.collideH(dt, game); this.y = ny; const blocked = Math.hypot(this.x - nx, this.z - nz) > 0.3;
      if (t >= 1 || blocked || inp.jumpP) { this.swing = null; this.whipLine.visible = false; const L = Math.hypot(s.x1 - s.x0, s.z1 - s.z0) || 1; this.vx = (s.x1 - s.x0) / L * 7; this.vz = (s.z1 - s.z0) / L * 7; this.vy = 6.5; this.jumps = 1; sfx('jump2'); }
      else { this.showLine(s.hx, s.hy, s.hz); this.speed = 0; this.anim(dt); return; } }
    // ---- move (camera relative) ----
    const cy = game.cam.yaw; const mx = inp.mx || 0, my = inp.my || 0;
    const fx = Math.sin(cy), fz = Math.cos(cy), rx = -Math.cos(cy), rz = Math.sin(cy);
    let dx = fx * my + rx * mx, dz = fz * my + rz * mx;
    const mag = Math.min(1, Math.hypot(mx, my)); if (mag > 0.15 && this.hidden) { this.hidden = false; game.onHide && game.onHide(this, false); }
    let sp = this.runSpeed * mag; const zs = w.zonesAt(this.x, this.y + 0.3, this.z); let sand = null, slip = false;
    for (const q of zs) { if (q.type === 'sand') sand = q; if (q.type === 'slip') slip = true; }
    if (sand) { sp *= 0.45; this.sand += dt; if (this.sand > 3.2) { this.fall(game, 'sand'); return; } } else this.sand = Math.max(0, this.sand - dt * 2);
    if (this.torch) sp *= 0.97;
    const acc = this.onGround ? (slip ? 3 : 15) : 8.5;
    this.vx += (dx * sp - this.vx) * Math.min(1, acc * dt); this.vz += (dz * sp - this.vz) * Math.min(1, acc * dt);
    if (mag > 0.1) { let ty = Math.atan2(dx, dz), d = ty - this.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; this.yaw += d * Math.min(1, 13 * dt); }
    // ---- jump ----
    if (this.jbuf > 0 && !this.hidden) {
      if (this.onGround || this.coyote > 0) { this.vy = JUMP * (sand ? 0.8 : 1); this.jumps = 1; this.onGround = false; this.coyote = 0; this.jbuf = 0; sfx('jump'); game.fx.puff(this.x, this.y, this.z, 4, sand ? 0xe9c98a : 0xf5f0e6); }
      else if (this.jumps === 1 && up('jump') > 0) { this.vy = JUMP2; this.jumps = 2; this.jbuf = 0; sfx('jump2'); game.fx.ring(this.x, this.y, this.z, 0xfde68a); } }
    // ---- whip ----
    if (inp.whipP && this.whipCd <= 0) { this.whipCd = 0.4; const h = game.hookTarget(this);
      if (h) { const x0 = this.x, z0 = this.z, ddx = h.x - x0, ddz = h.z - z0, Lh = Math.hypot(ddx, ddz) || 1; const reach = Math.min(Lh * 2, Lh + 7); let LD = null; if (h.land) { const L_ = Array.isArray(h.land[0]) ? h.land : [h.land]; let bd = 0; for (const q of L_) { const dt_ = (q[0] - h.x) * ddx + (q[2] - h.z) * ddz; if (dt_ > bd) { bd = dt_; LD = q; } } }
        const x1 = LD ? LD[0] : x0 + ddx / Lh * reach, z1 = LD ? LD[2] : z0 + ddz / Lh * reach;
        const g1 = LD ? LD[1] : w.ground(x1, z1, h.y, 0.3).y; const y1 = LD ? LD[1] + 0.9 : Math.max(this.y, g1 > -1e8 ? g1 : this.y) + 0.9; const reach2 = Math.hypot(x1 - x0, z1 - z0); const dur = Math.max(0.55, reach2 / 13);
        this.swing = { land: !!LD, t: 0, dur, x0, z0, y0: this.y, x1, z1, y1, sag: Math.max(0.35, Math.min(1.1, h.y - Math.max(this.y, y1) - 1.2)), hx: h.x, hy: h.y, hz: h.z }; this.vy = 0; sfx('whip'); game.onWhipSwing && game.onWhipSwing(this, h); }
      else { this.whipT = 0.35; sfx('whip'); game.onWhip(this); } }
    // ---- interact ----
    // ---- gravity ----
    let g = this.vy > 0 && inp.jumpH ? G_UP : G_DN; if (this.vy > 0 && !inp.jumpH && this.jumps >= 1 && !this.bounced) this.vy -= 30 * dt;
    this.vy -= g * dt; this.vy = Math.max(this.vy, -MAXF); if (sand && this.vy < -2) this.vy = -2;
    this.collide(dt, game, mag > 0.3 ? [dx, dz] : null);
    if (this.onGround) { this.air = 0; this.jumps = 0; this.coyote = 0.1; this.bounced = false; } else this.air += dt;
    if (this.y < w.killY) this.fall(game, 'fell');
    for (const q of zs) if (q.type === 'water' && this.y < q.max[1] - 0.25) { this.fall(game, 'splash'); break; }
    this.speed = Math.hypot(this.vx, this.vz); this.anim(dt);
  }
  collideH(dt, game) { const w = game.world; const c = w.near(this.x - 3, this.z - 3, this.x + 3, this.z + 3, tmp);
    const axis = (ax) => { for (const s of c) { if (s.ramp || s.off) continue; if (s.max[1] <= this.y + STEP || s.min[1] >= this.y + HGT) continue;
      if (this.x + R <= s.min[0] || this.x - R >= s.max[0] || this.z + R <= s.min[2] || this.z - R >= s.max[2]) continue;
      { const pl = Math.min(this.x + R - s.min[0], s.max[0] - this.x + R), pz = Math.min(this.z + R - s.min[2], s.max[2] - this.z + R), pen = Math.min(pl, pz); if (pen > 1.1 && !s.dyn) { if (s.max[1] - this.y < 1.6) { this.y = s.max[1]; if (this.vy < 0) this.vy = 0; } continue; } } // deep inside (sank into it): never shove sideways across the map
      let a = ax; if (s.dyn) { const px = Math.min(this.x + R - s.min[0], s.max[0] - this.x + R), pz = Math.min(this.z + R - s.min[2], s.max[2] - this.z + R); a = px < pz ? 0 : 2; }
      if (a === 0) { const l = this.x + R - s.min[0], r = s.max[0] - (this.x - R); if (l < r) { this.x -= l; if (this.vx > 0) this.vx = 0; } else { this.x += r; if (this.vx < 0) this.vx = 0; } }
      else { const l = this.z + R - s.min[2], r = s.max[2] - (this.z - R); if (l < r) { this.z -= l; if (this.vz > 0) this.vz = 0; } else { this.z += r; if (this.vz < 0) this.vz = 0; } }
      if (s.block) this._touch = s.block; if (s.hot) this.hurt(game, s, 'hot'); } };
    this.x += this.vx * dt; axis(0); this.z += this.vz * dt; axis(2); }
  collide(dt, game, wish) {
    const w = game.world; const wasG = this.onGround; this._touch = null;
    if (this.onGround && this.gs && this.gs.dyn) { this.x += this.gs.dx; this.y += this.gs.dy; this.z += this.gs.dz; }
    this.collideH(dt, game);
    // pushing a stone block: lean into it for a moment and it slides one step
    if (this._touch && wish && this.onGround) { this.pushT += dt; this.pushing = true; if (this.pushT > 0.35) { this.pushT = 0; game.tryPush(this._touch, wish, this); } } else { this.pushT = 0; this.pushing = false; }
    const c = w.near(this.x - 3, this.z - 3, this.x + 3, this.z + 3, tmp);
    const ny = this.y + this.vy * dt, rr = R * 0.7;
    if (this.vy <= 0) { let best = -1e9, bs = null; const low = wasG ? Math.min(ny, this.y - 0.3) : ny - 0.02;
      for (const s of c) { if (s.off || s.nofloor) continue; if (this.x + rr < s.min[0] || this.x - rr > s.max[0] || this.z + rr < s.min[2] || this.z - rr > s.max[2]) continue; const t = topOf(s, this.x, this.z); if (t <= this.y + STEP && t >= low && t > best) { best = t; bs = s; } }
      if (bs) { const fallV = this.vy; this.y = best; this.vy = 0; this.onGround = true; this.gs = bs;
        if (!wasG && fallV < -10) { sfx('land'); game.fx.puff(this.x, this.y, this.z, 5); }
        if (bs.bounce) { this.vy = bs.bounce; this.onGround = false; this.jumps = 1; this.bounced = true; sfx('bounce'); }
        if (bs.hot) this.hurt(game, bs, 'hot'); if (bs.onStep) bs.onStep(this); }
      else { this.y = ny; this.onGround = false; this.gs = null; }
    } else { let ny2 = ny; for (const s of c) { if (s.off || s.ramp) continue; if (this.x + rr < s.min[0] || this.x - rr > s.max[0] || this.z + rr < s.min[2] || this.z - rr > s.max[2]) continue; if (s.min[1] >= this.y + HGT - 0.02 && s.min[1] < ny2 + HGT) { ny2 = s.min[1] - HGT; this.vy = 0; } }
      this.y = ny2; this.onGround = false; this.gs = null; }
  }
  hurt(game, src, kind) {
    if (this.hurtT > 0 || this.respawnT > 0 || this.swing || this.caughtT > 0) return false;
    if (game.app && game.app.paused && kind !== 'fall') return false;
    this.hearts--; this.hurtT = 1.5; sfx('hurt'); game.fx.burst(this.x, this.y + 1, this.z, 0xffd23f, 10); game.cam.shake = 0.2;
    if (kind === 'hot') { this.vy = 10; this.onGround = false; game.toastMsg('Hot hot hot! 🔥'); } else this.knock(src);
    if (kind === 'dart') game.toastMsg('THWOP! Suction-cup dart 🎯');
    if (this.hearts <= 0) { this.respawnT = 1.3; this.dead = true; game.onFaint(this); }
    game.hud.dirty = true; return true;
  }
  knock(src, f = 8) { const sx = src && src.x != null ? src.x : this.x - Math.sin(this.yaw), sz = src && src.z != null ? src.z : this.z - Math.cos(this.yaw); const dx = this.x - sx, dz = this.z - sz, d = Math.hypot(dx, dz) || 1; this.vx = dx / d * f; this.vz = dz / d * f; this.vy = 7; this.onGround = false; }
  fall(game, why) { if (this.respawnT > 0) return; this.respawnT = 0.9; this.vx = this.vy = this.vz = 0; this.swing = null; this.whipLine.visible = false;
    if (why === 'splash') { sfx('splash'); game.fx.splash(this.x, this.y, this.z); game.toastMsg('SPLASH! The croc says "no swimming" 🐊'); } else if (why === 'sand') { sfx('splash'); game.toastMsg('Glub! Quicksand. Keep jumping next time! 🏜️'); } else game.toastMsg('Whoa! Back to the last flag 🚩');
    this.hearts = Math.max(1, this.hearts - 1); this.root.visible = false; game.hud.dirty = true; }
  arrest(game, by) { if (this.caughtT > 0 || this.respawnT > 0) return; this.caughtT = 1.8; this.swing = null; this.whipLine.visible = false; this.vx = this.vz = 0; game.onBusted(this, by); }
  doRespawn(game) { const p = this.cp || game.world.start; this.place(p, this.cpYaw || game.world.startYaw || 0); if (this.dead) { this.hearts = this.maxHearts; this.dead = false; } this.hurtT = 2; this.root.visible = true; game.fx.burst(this.x, this.y + 1, this.z, 0xffd23f, 14); game.hud.dirty = true; game.cam.snap = true; this.graceT = 4; }
  showLine(hx, hy, hz) { const L = this.whipLine; L.visible = true; const ax = this.x + Math.cos(this.yaw) * 0.3, ay = this.y + 1.75, az = this.z - Math.sin(this.yaw) * 0.3; L.position.set(ax, ay, az); L.lookAt(hx, hy, hz); L.scale.z = Math.hypot(hx - ax, hy - ay, hz - az); }
  anim(dt) {
    const rt = this.root; rt.position.set(this.x, this.y, this.z); rt.rotation.y = this.yaw;
    rt.visible = this.respawnT <= 0 && !this.camHide && !(this.hurtT > 0 && Math.floor(this.hurtT * 12) % 2 === 0 && this.hurtT < 1.4);
    if (this.whipT > 0 && this.whipTo) { const k = this.whipT / 0.35; if (k < 0.75) { const p = this.whipTo; const e = Math.min(1, (0.75 - k) * 5); this.showLine(this.x + (p.x - this.x) * e, this.y + 1.2 + (p.y - this.y - 1.2) * e, this.z + (p.z - this.z) * e); } } else if (!this.swing) this.whipLine.visible = false;
    animHero(this.rig, dt, { speed: this.onGround ? this.speed : 0, air: !this.onGround && !this.swing, vy: this.vy, whip: this.whipT > 0 ? this.whipT / 0.35 : 0, swing: !!this.swing, hide: this.hidden, caught: this.caughtT > 0, torch: this.torch, push: this.pushing, wave: this.wave > 0 });
    if (this.hidden) rt.scale.setScalar(0.85); else rt.scale.setScalar(1);
  }
  updateBlob(w) { const g = w.ground(this.x, this.z, this.y + 0.2, 0.05); const b = this.blob; if (g.y > -1e8 && this.root.visible) { b.visible = true; b.position.set(this.x, g.y + 0.03, this.z); const h = this.y - g.y; b.scale.setScalar(Math.max(0.35, 1 - h * 0.08)); b.material.opacity = Math.max(0.08, 0.3 - h * 0.02); } else b.visible = false; }
  // ---------------- network ----------------
  snap() { return [+this.x.toFixed(2), +this.y.toFixed(2), +this.z.toFixed(2), +this.yaw.toFixed(2), (this.onGround ? 1 : 0) | (this.torch ? 2 : 0) | (this.whipT > 0 ? 4 : 0) | (this.respawnT > 0 ? 8 : 0) | (this.swing ? 16 : 0) | (this.hurtT > 0 ? 32 : 0) | (this.hidden ? 64 : 0) | (this.caughtT > 0 ? 128 : 0) | (this.graceT > 0 ? 256 : 0), +this.speed.toFixed(1), +this.vy.toFixed(1), this.hearts, this.swing ? [+this.swing.hx.toFixed(1), +this.swing.hy.toFixed(1), +this.swing.hz.toFixed(1)] : 0]; }
  applySnap(a) { this.tx = a[0]; this.ty = a[1]; this.tz = a[2]; this.tyaw = a[3]; this.flags = a[4]; this.graceT = a[4] & 256 ? 1 : 0; this.speed = a[5]; this.vy = a[6]; this.hearts = a[7]; this.rHook = a[8] || null; if (this.x === 0 && this.y === 0 && this.z === 0) { this.x = a[0]; this.y = a[1]; this.z = a[2]; } }
  remoteUpdate(dt) { if (this.tx == null) return; const k = Math.min(1, dt * 12); if (Math.hypot(this.tx - this.x, this.tz - this.z) > 8) { this.x = this.tx; this.y = this.ty; this.z = this.tz; }
    this.x += (this.tx - this.x) * k; this.y += (this.ty - this.y) * k; this.z += (this.tz - this.z) * k; let d = this.tyaw - this.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; this.yaw += d * k;
    const f = this.flags || 0; this.onGround = !!(f & 1); this.torch = !!(f & 2); this.respawnT = f & 8 ? 1 : 0; this.hurtT = f & 32 ? 0.5 : 0; this.hidden = !!(f & 64); this.caughtT = f & 128 ? 1 : 0;
    const rt = this.root; rt.position.set(this.x, this.y, this.z); rt.rotation.y = this.yaw; rt.visible = !(f & 8);
    if ((f & 16) && this.rHook) this.showLine(this.rHook[0], this.rHook[1], this.rHook[2]); else this.whipLine.visible = false;
    animHero(this.rig, dt, { speed: this.onGround ? this.speed : 0, air: !this.onGround && !(f & 16), vy: this.vy, whip: f & 4 ? 0.6 : 0, swing: !!(f & 16), hide: this.hidden, caught: this.caughtT > 0, torch: this.torch }); }
}
