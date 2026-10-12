// Rat player: tight platformer physics vs box colliders + Ratita Industries gadgets.
import * as THREE from 'three';
import { topOf } from './world.js?v=np3';
import { makeRat, animRat, setOutfit } from './models.js?v=np3';
import { makeHuman, animHuman } from './humans.js?v=np3';
import { sfx } from './audio.js?v=np3';
import { up } from './save.js?v=np3';
const R = 0.34, HGT = 0.72, STEP = 0.45;
const G_UP = 26, G_DN = 34, JUMP = 10.2, JUMP2 = 9.0, JET = 8.4, MAXF = 26;
const tmp = [];
export class Player {
  constructor(o) {
    Object.assign(this, { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, onGround: false, gs: null, jumps: 0, coyote: 0, jbuf: 0, glide: false, air: 0, spin: 0, spinCd: 0, spinHang: false, blastCd: 0, zip: null, hurtT: 0, squash: 0, lean: 0, respawnT: 0, shield: 1, shieldCd: 0, speed: 0, dead: false });
    this.rat = o.rat || 'luna'; this.name = o.name || 'Rat'; this.color = o.color || '#ff4fd8'; this.local = !!o.local; this.pid = o.pid || 'me'; this.slot = o.slot || 0;
    this.human = this.rat === 'human'; this.hgt = this.human ? 1.75 : HGT; this.rig = this.human ? makeHuman(o.look) : makeRat(this.rat, o.outfit); if (this.human) setOutfit(this.rig, o.outfit); this.root = this.rig.root; this.gadgets = o.gadgets || new Set(['blaster']);
    this.maxHearts = 4 + (this.local ? up('hearts') : 0); this.hearts = this.maxHearts; this.cp = null;
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.renderOrder = 1; this.blob = sh;
    const bub = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 16), new THREE.MeshPhysicalMaterial({ color: 0x9ff3ff, transparent: true, opacity: 0.22, roughness: 0.05, iridescence: 1, depthWrite: false })); bub.position.y = 0.4; bub.visible = false; this.root.add(bub); this.bubble = bub;
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 6).translate(0, 0.5, 0).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffb3c8 })); line.visible = false; this.hookLine = line;
  }
  addTo(scene) { scene.add(this.root, this.blob, this.hookLine); }
  removeFrom(scene) { scene.remove(this.root, this.blob, this.hookLine); }
  setOutfit(o) { setOutfit(this.rig, o); }
  place(p, yaw = 0) { this.x = p[0]; this.y = p[1]; this.z = p[2]; this.vx = this.vy = this.vz = 0; this.yaw = yaw; this.zip = null; this.onGround = false; }
  get runSpeed() { return 7 + up('speed') * 0.8 + (this.gadgets.has('turbo') ? 2.1 : 0) + (this.rat === 'luna' ? 0.4 : 0); }
  // ---------------- local control ----------------
  update(dt, inp, game) {
    const w = game.world; if (this.respawnT > 0) { this.respawnT -= dt; if (this.respawnT <= 0) this.doRespawn(game); this.anim(dt); return; }
    this.hurtT = Math.max(0, this.hurtT - dt); this.spinCd -= dt; this.blastCd -= dt; this.squash = Math.max(0, this.squash - dt * 4); this.jbuf -= dt; this.coyote -= dt;
    if (this.gadgets.has('shield') && this.shield < 1) { this.shieldCd -= dt; if (this.shieldCd <= 0) { this.shield = 1; } }
    this.bubble.visible = this.gadgets.has('shield') && this.shield >= 1;
    if (inp.jumpP) this.jbuf = 0.13;
    // ---- grapple zip ----
    if (this.zip) { const z = this.zip; const dx = z.x - this.x, dy = z.y - this.y, dz = z.z - this.z, d = Math.hypot(dx, dy, dz);
      z.t += dt; const sp = 24; if (d < 0.6 || z.t > 1.6) { this.zip = null; this.vy = 9.5; this.vx = (dx / (d || 1)) * 6; this.vz = (dz / (d || 1)) * 6; this.jumps = 1; this.hookLine.visible = false; sfx('jump2'); }
      else { this.x += dx / d * sp * dt; this.y += dy / d * sp * dt; this.z += dz / d * sp * dt; this.yaw = Math.atan2(dx, dz); this.showLine(z); this.anim(dt); return; } }
    // ---- move ----
    const cy = game.cam.yaw; const mx = inp.mx, my = inp.my; // camera relative: stick up = away from camera
    const fx = Math.sin(cy), fz = Math.cos(cy), rx = -Math.cos(cy), rz = Math.sin(cy);
    let dx = fx * my + rx * mx, dz = fz * my + rz * mx; // right on stick -> screen right
    const mag = Math.min(1, Math.hypot(mx, my)); let sp = this.runSpeed * mag; if (this.glide) sp *= 1.25 + up('glide') * 0.12;
    const zs = w.zonesAt(this.x, this.y + 0.3, this.z); let slip = false, wind = null;
    for (const q of zs) { if (q.type === 'slip') slip = true; if (q.type === 'wind') wind = q; }
    const acc = this.onGround ? (slip ? 3 : 16) : 6;
    const tvx = dx * sp, tvz = dz * sp;
    this.vx += (tvx - this.vx) * Math.min(1, acc * dt); this.vz += (tvz - this.vz) * Math.min(1, acc * dt);
    if (mag > 0.1) { let ty = Math.atan2(dx, dz), d = ty - this.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; this.yaw += d * Math.min(1, 14 * dt); this.lean += (-d * 0.4 - this.lean) * Math.min(1, 8 * dt); } else this.lean *= 0.9;
    // ---- jump ----
    if (this.jbuf > 0) {
      if (this.onGround || this.coyote > 0) { this.vy = JUMP + (this.rat === 'snowie' ? 0.5 : 0); this.jumps = 1; this.onGround = false; this.coyote = 0; this.jbuf = 0; sfx('jump'); this.squash = -0.6; game.fx.puff(this.x, this.y, this.z, 4); }
      else if (this.jumps === 1) { this.vy = JUMP2; this.jumps = 2; this.jbuf = 0; sfx('jump2'); game.fx.ring(this.x, this.y, this.z); }
      else if (this.jumps === 2 && this.gadgets.has('jet')) { this.vy = JET; this.jumps = 3; this.jbuf = 0; sfx('glide'); game.fx.jet(this.x, this.y, this.z); }
    }
    // glide: hold jump while falling
    this.glide = !this.onGround && this.gadgets.has('glider') && inp.jumpH && this.vy < 0 && this.air > 0.2;
    if (this.glide && !this._wasGlide) sfx('glide'); this._wasGlide = this.glide;
    // ---- spin ----
    if (inp.spinP && this.spinCd <= 0) { this.spin = 0.42; this.spinCd = 0.5; sfx('spin'); if (!this.onGround && !this.spinHang) { this.vy = Math.max(this.vy, 3.5); this.spinHang = true; } game.onSpin(this); }
    if (this.spin > 0) this.spin -= dt;
    // ---- blast ----
    if (inp.blastP && this.blastCd <= 0) { this.blastCd = 0.34 - up('blast') * 0.05; game.fireBlast(this); }
    // ---- hook ----
    if (inp.hookP && this.gadgets.has('grapple')) { const h = game.hookTarget(this); if (h) { this.zip = { x: h.x, y: h.y - 1.0, z: h.z, t: 0, hx: h.x, hy: h.y, hz: h.z }; this.vy = 0; sfx('hook'); this.glide = false; } }
    // ---- gravity / wind ----
    let g = this.vy > 0 && inp.jumpH ? G_UP : G_DN; if (this.vy > 0 && !inp.jumpH && this.jumps >= 1 && !this.bounced) this.vy -= 30 * dt; // short hop when released
    this.vy -= g * dt; if (this.glide) this.vy = Math.max(this.vy, -2.3 + up('glide') * 0.4);
    if (wind) { const f = wind.f; this.vx += f[0] * dt; this.vz += f[2] * dt; if (f[1]) { this.vy += f[1] * dt * (this.glide ? 1.8 : 1); this.vy = Math.min(this.vy, this.glide ? 9 : 6); } }
    this.vy = Math.max(this.vy, -MAXF);
    this.collide(dt, game);
    if (this.onGround) { this.air = 0; this.jumps = 0; this.spinHang = false; this.coyote = 0.1; this.bounced = false; } else this.air += dt;
    // kill plane
    if (this.y < (this.x > 140 ? -45 : w.killY)) this.fall(game, 'fell');
    for (const q of zs) if (q.type === 'water' && this.y < q.max[1] - 0.2) { this.fall(game, 'splash'); break; }
    this.speed = Math.hypot(this.vx, this.vz);
    this.anim(dt);
  }
  collide(dt, game) {
    const w = game.world; const wasG = this.onGround;
    if (this.onGround && this.gs && this.gs.dyn) { this.x += this.gs.dx; this.y += this.gs.dy; this.z += this.gs.dz; }
    const c = w.near(this.x - 2.5, this.z - 2.5, this.x + 2.5, this.z + 2.5, tmp);
    const axis = (ax) => { for (const s of c) { if (s.ramp || s.off) continue; if (s.max[1] <= this.y + STEP || s.min[1] >= this.y + this.hgt) continue;
      if (this.x + R <= s.min[0] || this.x - R >= s.max[0] || this.z + R <= s.min[2] || this.z - R >= s.max[2]) continue;
      let a = ax; if (s.dyn) { const px = Math.min(this.x + R - s.min[0], s.max[0] - this.x + R), pz = Math.min(this.z + R - s.min[2], s.max[2] - this.z + R); a = px < pz ? 0 : 2; }
      if (a === 0) { const l = this.x + R - s.min[0], r = s.max[0] - (this.x - R); if (l < r) { this.x -= l; if (this.vx > 0) this.vx = 0; } else { this.x += r; if (this.vx < 0) this.vx = 0; } }
      else { const l = this.z + R - s.min[2], r = s.max[2] - (this.z - R); if (l < r) { this.z -= l; if (this.vz > 0) this.vz = 0; } else { this.z += r; if (this.vz < 0) this.vz = 0; } }
      if (s.hot) this.hurt(game, s, 'hot'); } };
    this.x += this.vx * dt; axis(0); this.z += this.vz * dt; axis(2);
    const ny = this.y + this.vy * dt, rr = R * 0.7;
    if (this.vy <= 0) { let best = -1e9, bs = null; const low = wasG ? Math.min(ny, this.y - 0.3) : ny - 0.02;
      for (const s of c) { if (s.off || s.nofloor) continue; if (this.x + rr < s.min[0] || this.x - rr > s.max[0] || this.z + rr < s.min[2] || this.z - rr > s.max[2]) continue; const t = topOf(s, this.x, this.z); if (t <= this.y + STEP && t >= low && t > best) { best = t; bs = s; } }
      if (bs) { const fallV = this.vy; this.y = best; this.vy = 0; this.onGround = true; this.gs = bs;
        if (!wasG && fallV < -9) { this.squash = Math.min(1, -fallV / 25); sfx('land'); game.fx.puff(this.x, this.y, this.z, 5); }
        if (bs.bounce) { this.vy = bs.bounce; this.onGround = false; this.jumps = 1; this.bounced = true; this.squash = 0.8; sfx('bounce'); game.fx.ring(this.x, this.y, this.z); game.onBounce && game.onBounce(bs); }
        if (bs.hot) this.hurt(game, bs, 'hot');
        if (bs.onStep) bs.onStep(this); }
      else { this.y = ny; this.onGround = false; this.gs = null; }
    } else { let ny2 = ny; for (const s of c) { if (s.off || s.ramp) continue; if (this.x + rr < s.min[0] || this.x - rr > s.max[0] || this.z + rr < s.min[2] || this.z - rr > s.max[2]) continue; if (s.min[1] >= this.y + this.hgt - 0.02 && s.min[1] < ny2 + this.hgt) { ny2 = s.min[1] - this.hgt; this.vy = 0; } }
      this.y = ny2; this.onGround = false; this.gs = null; }
  }
  hurt(game, src, kind) {
    if (this.hurtT > 0 || this.respawnT > 0 || this.zip) return false;
    if (game.app && game.app.paused && kind !== 'fall') return false; // co-op: the world keeps going for friends, but you can't get hurt while your pause menu is open
    if (kind !== 'fall' && this.gadgets.has('shield') && this.shield >= 1) { this.shield = 0; this.shieldCd = 8; this.hurtT = 1.0; sfx('pop'); game.fx.burst(this.x, this.y + 0.4, this.z, 0x9ff3ff, 14); this.knock(src); return true; }
    this.hearts--; this.hurtT = 1.5; sfx('hurt'); game.fx.burst(this.x, this.y + 0.4, this.z, 0xff6fb5, 10);
    if (kind === 'hot') { this.vy = 11; this.onGround = false; game.toastMsg('Ouch, hot! 🔥'); } else this.knock(src);
    if (kind === 'slobber') game.toastMsg('SLOBBERED by Candy! 🐶💦');
    if (this.hearts <= 0) { this.respawnT = 1.2; this.dead = true; game.onFaint(this); }
    game.hud.dirty = true; return true;
  }
  knock(src) { const sx = src && src.x != null ? src.x : this.x - Math.sin(this.yaw), sz = src && src.z != null ? src.z : this.z - Math.cos(this.yaw); const dx = this.x - sx, dz = this.z - sz, d = Math.hypot(dx, dz) || 1; this.vx = dx / d * 8; this.vz = dz / d * 8; this.vy = 7; this.onGround = false; }
  fall(game, why) { if (this.respawnT > 0) return; if (why === 'fell' && game.tryDescend && game.tryDescend(true)) return; this.respawnT = 0.9; this.vx = this.vy = this.vz = 0; if (why === 'splash') { sfx('splash'); game.fx.splash(this.x, this.y, this.z); game.toastMsg('Splash! Rats don\u2019t love baths 🛁'); } else game.toastMsg('Whoops! Back to the checkpoint'); this.hearts = Math.max(1, this.hearts - 1); this.fellHidden = true; this.root.visible = false; game.hud.dirty = true; }
  doRespawn(game) { const p = this.cp || game.world.start; this.place(p, this.cpYaw || game.world.startYaw || 0); if (this.dead) { this.hearts = this.maxHearts; this.dead = false; } this.hurtT = 2; this.root.visible = true; game.fx.burst(this.x, this.y + 0.4, this.z, 0xffd23f, 14); game.hud.dirty = true; game.cam.snap = true; }
  showLine(z) { const L = this.hookLine; L.visible = true; L.position.set(this.x, this.y + 0.4, this.z); L.lookAt(z.hx, z.hy, z.hz); L.scale.z = Math.hypot(z.hx - this.x, z.hy - this.y - 0.4, z.hz - this.z); }
  anim(dt) {
    const rt = this.root; rt.position.set(this.x, this.y, this.z); rt.rotation.y = this.yaw;
    rt.visible = this.respawnT <= 0 && !(this.hurtT > 0 && Math.floor(this.hurtT * 12) % 2 === 0 && this.hurtT < 1.4);
    (this.human ? animHuman : animRat)(this.rig, dt, { speed: this.onGround ? this.speed : 0, air: !this.onGround, glide: this.glide, spin: this.spin > 0 ? this.spin : 0, vy: this.vy, squash: this.squash > 0 ? this.squash : 0, lean: this.lean });
  }
  updateBlob(w) { const g = w.ground(this.x, this.z, this.y + 0.2, 0.05); const b = this.blob; if (g.y > -1e8 && this.root.visible) { b.visible = true; b.position.set(this.x, g.y + 0.03, this.z); const h = this.y - g.y; b.scale.setScalar(Math.max(0.35, 1 - h * 0.08)); b.material.opacity = Math.max(0.08, 0.3 - h * 0.02); } else b.visible = false; }
  // ---------------- network ----------------
  snap() { return [+this.x.toFixed(2), +this.y.toFixed(2), +this.z.toFixed(2), +this.yaw.toFixed(2), (this.onGround ? 1 : 0) | (this.glide ? 2 : 0) | (this.spin > 0 ? 4 : 0) | (this.respawnT > 0 ? 8 : 0) | (this.zip ? 16 : 0) | (this.hurtT > 0 ? 32 : 0), +this.speed.toFixed(1), +this.vy.toFixed(1), this.hearts]; }
  applySnap(a) { this.tx = a[0]; this.ty = a[1]; this.tz = a[2]; this.tyaw = a[3]; this.flags = a[4]; this.speed = a[5]; this.vy = a[6]; this.hearts = a[7]; if (this.x === 0 && this.y === 0 && this.z === 0) { this.x = a[0]; this.y = a[1]; this.z = a[2]; } }
  remoteUpdate(dt) { if (this.tx == null) return; const k = Math.min(1, dt * 12); if (Math.hypot(this.tx - this.x, this.tz - this.z) > 8) { this.x = this.tx; this.y = this.ty; this.z = this.tz; }
    this.x += (this.tx - this.x) * k; this.y += (this.ty - this.y) * k; this.z += (this.tz - this.z) * k; let d = this.tyaw - this.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; this.yaw += d * k;
    const f = this.flags || 0; this.onGround = !!(f & 1); this.glide = !!(f & 2); this.spin = f & 4 ? 0.3 : 0; this.respawnT = f & 8 ? 1 : 0; this.hurtT = f & 32 ? 0.5 : 0;
    const rt = this.root; rt.position.set(this.x, this.y, this.z); rt.rotation.y = this.yaw; rt.visible = !(f & 8);
    (this.human ? animHuman : animRat)(this.rig, dt, { speed: this.onGround ? this.speed : 0, air: !this.onGround, glide: this.glide, spin: this.spin, vy: this.vy, squash: 0, lean: 0 }); }
}
