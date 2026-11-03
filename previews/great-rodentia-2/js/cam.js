// Third-person follow camera: drag to orbit, eases back behind you while you move, pulls in so walls never block the view.
import * as THREE from 'three';
import { IN } from './input.js?v=gr3';
import { E } from './engine.js?v=gr3';
const _d = new THREE.Vector3(), _o = new THREE.Vector3();
export class FollowCam {
  constructor() { this.yaw = Math.PI; this.pitch = 0.32; this.dist = 6.5; this.want = 6.5; this.cur = 6.5; this.snap = true; this.tx = 0; this.ty = 0; this.tz = 0; this.hgt = 1.45; }
  update(dt, t, w, o = {}) { // t: {x,y,z,yaw,speed}
    const sens = o.sens || 1; if (IN.camDX || IN.camDY) { this.yaw -= IN.camDX * 0.0065 * sens; this.pitch = Math.max(-0.15, Math.min(1.25, this.pitch + IN.camDY * 0.0045)); IN.camDX = IN.camDY = 0; }
    const idle = performance.now() - IN.lastCam > 1400;
    if (idle && t.speed > 1.2 && !o.noAuto) { let d = (t.yaw + Math.PI) - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); this.yaw += d * Math.min(1, dt * 1.6); }
    const k = this.snap ? 1 : 1 - Math.exp(-12 * dt); this.tx += (t.x - this.tx) * k; this.ty += (t.y + this.hgt - this.ty) * k; this.tz += (t.z - this.tz) * k;
    const want = o.dist || this.want; this.lift = this.lift || 0; _o.set(this.tx, this.ty, this.tz);
    // yaw convention: camera sits on the +yaw side looking back toward the target
    const cast = (pe) => { _d.set(Math.sin(this.yaw) * Math.cos(pe), Math.sin(pe), Math.cos(this.yaw) * Math.cos(pe)).normalize(); let dd = want;
      if (w) { const hit = w.ray(_o, _d, want + 0.4, (s) => !s.nocam && !s.floor && !s.see && !s.off); if (hit < want + 0.4) dd = Math.max(1.1, hit - 0.4); }
      if (o.box) { const B = o.box, m = 0.45; for (const [p0, dv, lo, hi] of [[this.tx, _d.x, B[0] + m, B[2] - m], [this.tz, _d.z, B[1] + m, B[3] - m]]) { if (dv > 1e-3 && p0 + dv * dd > hi) dd = Math.max(0.8, (hi - p0) / dv); if (dv < -1e-3 && p0 + dv * dd < lo) dd = Math.max(0.8, (lo - p0) / dv); } }
      return dd; };
    // blocked close behind? find the lowest pitch that gives a clear view and swing up over the wall instead of hugging the rat
    let goal = 0; if (cast(this.pitch) < want * 0.7) { goal = Math.max(0, 1.2 - this.pitch); for (let a = 0.1; a <= 1.2 - this.pitch + 1e-6; a += 0.1) if (cast(this.pitch + a) >= want * 0.7) { goal = a; break; } }
    this.lift += (goal - this.lift) * (this.snap ? 1 : Math.min(1, dt * (goal > this.lift ? 4 : 1.2)));
    const dd = cast(Math.min(1.3, this.pitch + this.lift));
    this.cur = this.snap ? dd : (dd < this.cur ? dd : this.cur + (dd - this.cur) * Math.min(1, dt * 3)); this.snap = false;
    const c = E.camera; c.position.set(this.tx + _d.x * this.cur, this.ty + _d.y * this.cur, this.tz + _d.z * this.cur); c.lookAt(this.tx, this.ty + 0.1, this.tz);
    if (c.fov !== E.baseFov) { c.fov = E.baseFov; c.updateProjectionMatrix(); }
  }
  // camera-relative forward yaw used by the stick (stick up = away from the camera)
  get moveYaw() { return this.yaw + Math.PI; }
}
