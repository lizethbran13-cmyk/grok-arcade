// On-foot controller for a human visitor: smooth walking/running, jumping, step-up and box-collider pushing.
// Shared by Grok Ruffsources HQ and Grok Snowie Sky Tours. Real 3D rig (makeHuman), camera-relative stick control.
import * as THREE from 'three';
import { topOf } from './world.js?v=rs6';
import { makeHuman, animHuman } from './humans.js?v=rs6';
import { sfx } from './audio.js?v=rs6';
const R = 0.34, H = 1.75, STEP = 0.5, G = 30, JUMP = 9.2;
const near = [];
export class Walker {
  constructor(look) { Object.assign(this, { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, onGround: true, speed: 0, squash: 0, jbuf: 0, coyote: 0, frozen: false });
    this.rig = makeHuman(look); this.root = this.rig.root;
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.4, 20), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.25, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.renderOrder = 1; this.blob = sh; }
  addTo(s) { s.add(this.root, this.blob); } removeFrom(s) { s.remove(this.root, this.blob); }
  place(p, yaw = 0) { this.x = p[0]; this.y = p[1]; this.z = p[2]; this.vx = this.vy = this.vz = 0; this.yaw = yaw; this.sync(); }
  setVisible(v) { this.root.visible = v; this.blob.visible = v; }
  update(dt, inp, w, camYaw) {
    this.jbuf -= dt; this.coyote -= dt; this.squash = Math.max(0, this.squash - dt * 4); if (inp.jump) this.jbuf = 0.14;
    const fx = Math.sin(camYaw), fz = Math.cos(camYaw), rx = -Math.cos(camYaw), rz = Math.sin(camYaw);
    let dx = fx * inp.my + rx * inp.mx, dz = fz * inp.my + rz * inp.mx; const mag = this.frozen ? 0 : Math.min(1, Math.hypot(inp.mx, inp.my));
    if (this.frozen) { dx = dz = 0; }
    const sp = (mag > 0.85 ? 7.2 : 5.2) * mag, acc = this.onGround ? 14 : 5;
    this.vx += (dx * (sp / (Math.hypot(dx, dz) || 1)) - this.vx) * Math.min(1, acc * dt); this.vz += (dz * (sp / (Math.hypot(dx, dz) || 1)) - this.vz) * Math.min(1, acc * dt);
    if (mag > 0.1) { const ty = Math.atan2(dx, dz); let d = ty - this.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; this.yaw += d * Math.min(1, 12 * dt); }
    if (this.jbuf > 0 && (this.onGround || this.coyote > 0)) { this.vy = JUMP; this.onGround = false; this.coyote = 0; this.jbuf = 0; sfx('jump'); }
    this.vy -= G * dt; if (this.vy < -30) this.vy = -30;
    // horizontal move + push out of walls (sub-stepped so fast frames never tunnel)
    const n = Math.max(1, Math.ceil(Math.hypot(this.vx, this.vz) * dt / 0.25));
    for (let i = 0; i < n; i++) { this.x += this.vx * dt / n; this.z += this.vz * dt / n; this.collide(w); }
    // vertical
    const ny = this.y + this.vy * dt; const gr = w.ground(this.x, this.z, this.y + STEP, R * 0.8);
    if (this.vy <= 0 && gr.s && ny <= gr.y + 0.001) { if (!this.onGround && this.vy < -6) { this.squash = 1; sfx('land'); } this.y = gr.y; this.vy = 0; this.onGround = true; this.coyote = 0.12; }
    else { // head bump
      if (this.vy > 0) { w.near(this.x - R, this.z - R, this.x + R, this.z + R, near); for (const s of near) { if (s.nocol || s.floor) continue; if (this.x + R > s.min[0] && this.x - R < s.max[0] && this.z + R > s.min[2] && this.z - R < s.max[2] && this.y + H <= s.min[1] + 0.05 && ny + H > s.min[1]) { this.vy = 0; break; } } }
      this.y = this.y + this.vy * dt; if (this.onGround && (!gr.s || gr.y < this.y - 0.05)) { this.onGround = false; } }
    if (this.y < -30) { this.place(this.safe || [0, 2, 0], this.yaw); }
    if (this.onGround && !this.frozen) this.safe = [this.x, this.y + 0.2, this.z];
    this.speed = Math.hypot(this.vx, this.vz); this.sync(); animHuman(this.rig, dt, { speed: this.speed, air: !this.onGround, squash: this.squash });
  }
  collide(w) { w.near(this.x - R - 0.1, this.z - R - 0.1, this.x + R + 0.1, this.z + R + 0.1, near);
    for (const s of near) { if (s.nocol || s.floor || s.off) continue; const top = topOf(s, this.x, this.z); if (top <= this.y + STEP && !s.wall) continue; if (s.min[1] >= this.y + H - 0.05) continue; if (top <= this.y + STEP) continue;
      const ox = Math.min(this.x + R - s.min[0], s.max[0] - (this.x - R)), oz = Math.min(this.z + R - s.min[2], s.max[2] - (this.z - R)); if (ox <= 0 || oz <= 0) continue;
      if (ox < oz) { if (this.x < (s.min[0] + s.max[0]) / 2) this.x -= ox; else this.x += ox; this.vx *= 0.5; } else { if (this.z < (s.min[2] + s.max[2]) / 2) this.z -= oz; else this.z += oz; this.vz *= 0.5; } } }
  sync() { this.root.position.set(this.x, this.y, this.z); this.root.rotation.y = this.yaw; this.blob.position.set(this.x, this.y + 0.03, this.z); }
}
