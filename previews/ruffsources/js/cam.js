// Third-person follow camera: drag to orbit, eases back behind you while you move, pulls in so walls never block the view.
import * as THREE from 'three';
import { IN } from './input.js?v=rs6';
import { E } from './engine.js?v=rs6';
const _d = new THREE.Vector3(), _o = new THREE.Vector3();
export class FollowCam {
  constructor() { this.yaw = Math.PI; this.pitch = 0.32; this.dist = 6.5; this.want = 6.5; this.cur = 6.5; this.snap = true; this.tx = 0; this.ty = 0; this.tz = 0; this.hgt = 1.45; }
  update(dt, t, w, o = {}) { // t: {x,y,z,yaw,speed}
    const sens = o.sens || 1; if (IN.camDX || IN.camDY) { this.yaw -= IN.camDX * 0.0065 * sens; this.pitch = Math.max(-0.15, Math.min(1.25, this.pitch + IN.camDY * 0.0045)); IN.camDX = IN.camDY = 0; }
    const idle = performance.now() - IN.lastCam > 1400;
    if (idle && t.speed > 1.2 && !o.noAuto) { let d = (t.yaw + Math.PI) - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); this.yaw += d * Math.min(1, dt * 1.6); }
    const k = this.snap ? 1 : 1 - Math.exp(-12 * dt); this.tx += (t.x - this.tx) * k; this.ty += (t.y + this.hgt - this.ty) * k; this.tz += (t.z - this.tz) * k;
    const want = o.dist || this.want; _d.set(Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), Math.cos(this.yaw) * Math.cos(this.pitch)).normalize();
    // yaw convention: camera sits on the +yaw side looking back toward the target
    _o.set(this.tx, this.ty, this.tz); let dd = want; if (w) { const hit = w.ray(_o, _d, want + 0.4, (s) => !s.nocam && !s.floor); if (hit < want + 0.4) dd = Math.max(1.1, hit - 0.4); }
    this.cur = this.snap ? dd : (dd < this.cur ? dd : this.cur + (dd - this.cur) * Math.min(1, dt * 3)); this.snap = false;
    const c = E.camera; c.position.set(this.tx + _d.x * this.cur, this.ty + _d.y * this.cur, this.tz + _d.z * this.cur); c.lookAt(this.tx, this.ty + 0.1, this.tz);
    if (c.fov !== E.baseFov) { c.fov = E.baseFov; c.updateProjectionMatrix(); }
  }
  // camera-relative forward yaw used by the stick (stick up = away from the camera)
  get moveYaw() { return this.yaw + Math.PI; }
}
