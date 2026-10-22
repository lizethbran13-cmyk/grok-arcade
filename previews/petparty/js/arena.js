// Mini-game base: avatars, movement, collisions, camera, snapshots (host runs the rules, everyone renders the state).
import * as THREE from 'three';
import { makeChar, animChar, G, mat, part } from './models.js';
import { E, fitDist } from './engine.js';
import { damp, clamp, wrapAng } from './util.js';
export const CS = 1.45; // character scale in mini-games
export class Arena {
  constructor(ctx) {
    this.ctx = ctx; this.grp = new THREE.Group(); this.players = ctx.players; this.seed = ctx.seed; this.t = 0; this.time = this.dur || 45; this.done = false;
    this.av = this.players.map((p) => ({ x: 0, z: 0, y: 0, vy: 0, vx: 0, vz: 0, ry: 0, stun: 0, out: 0, score: 0, inp: { mx: 0, mz: 0, a: 0 }, pa: 0, ap: 0, tx: 0, tz: 0, ty: 0 }));
    this.msgs = []; this.cam = { mode: 'fit', W: 14, H: 14, pitch: 0.95, tx: 0, tz: 0, ty: 0 };
  }
  get speed() { return 4.6; }
  spawn(pos, charOf) {
    this.meshes = this.players.map((p, i) => { const m = makeChar(charOf ? charOf(p) : p.char, p.color); m.scale.setScalar(CS); this.grp.add(m);
      const a = this.av[i]; a.x = a.tx = pos[i][0]; a.z = a.tz = pos[i][1]; a.ry = pos[i][2] ?? Math.PI; m.position.set(a.x, 0, a.z);
      // floating name ring + star so everyone can find themselves
      const ring = part(G.tor(), mat(p.color, { emissive: p.color, emissiveIntensity: 1.2 }), 0, 0.03, 0, 0.42, 0.42, 0.42, m, false); ring.rotation.x = Math.PI / 2;
      if (p.local) { const st = part(G.cone(), mat('#ffd23f', { emissive: '#ffb000', emissiveIntensity: 1.5 }), 0, 1.55, 0, 0.12, 0.22, 0.12, m, false); st.rotation.x = Math.PI; m.userData.mark = st; }
      return m; });
  }
  // shared top-down movement. walls(x,z,r) -> [px,pz] push-out or null
  move(dt, o = {}) {
    const sp = o.speed ?? this.speed;
    this.av.forEach((a, i) => {
      a.ap = a.inp.a && !a.pa; a.pa = a.inp.a;
      if (a.out) { return; }
      if (a.stun > 0) { a.stun -= dt; a.vx = damp(a.vx, 0, 6, dt); a.vz = damp(a.vz, 0, 6, dt); }
      else {
        let mx = a.inp.mx, mz = a.inp.mz; const l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; }
        const k = o.momentum ? o.momentum : 14; const s = sp * (a.slow || 1);
        a.vx = damp(a.vx, mx * s, k, dt); a.vz = damp(a.vz, mz * s, k, dt);
        if (l > 0.15) a.ry = Math.atan2(mx, mz);
      }
      a.x += a.vx * dt; a.z += a.vz * dt;
      if (o.jump) { if (a.ap && a.y <= 0.001 && a.stun <= 0) { a.vy = o.jump; this.sfx('jump', i); } a.vy -= 20 * dt; a.y += a.vy * dt; if (a.y < 0 && !a.fall) { a.y = 0; a.vy = 0; } }
      if (o.bounds) { a.x = clamp(a.x, -o.bounds[0], o.bounds[0]); a.z = clamp(a.z, -o.bounds[1], o.bounds[1]); }
      if (o.walls) for (let k = 0; k < 2; k++) { const r = o.walls(a.x, a.z, 0.4); if (r) { a.x = r[0]; a.z = r[1]; } }
    });
    if (o.push !== false) for (let i = 0; i < this.av.length; i++) for (let j = i + 1; j < this.av.length; j++) {
      const a = this.av[i], b = this.av[j]; if (a.out || b.out) continue; const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), m = 0.85;
      if (d < m && d > 1e-4) { const p = (m - d) / 2, nx = dx / d, nz = dz / d; a.x -= nx * p; a.z -= nz * p; b.x += nx * p; b.z += nz * p; if (this.onBump) this.onBump(i, j, nx, nz); }
    }
  }
  sfx(n, i) { this.msgs.push(['s', n, i ?? -1]); }
  say(text, i) { this.msgs.push(['m', text, i ?? -1]); }
  // ---- snapshots ----
  snapAv() { return this.av.map((a) => [+a.x.toFixed(2), +a.z.toFixed(2), +a.y.toFixed(2), +a.ry.toFixed(2), a.score, a.stun > 0 ? 1 : 0, a.out ? 1 : 0, a.hold ? 1 : 0]); }
  applyAv(s) { s.forEach((v, i) => { const a = this.av[i]; if (!a) return; a.tx = v[0]; a.tz = v[1]; a.ty = v[2]; a.ry = v[3]; a.score = v[4]; a.stunV = v[5]; a.out = v[6]; a.hold = v[7]; }); }
  snap() { return { a: this.snapAv(), t: +this.time.toFixed(1), g: this.snapG ? this.snapG() : 0 }; }
  apply(s) { this.applyAv(s.a); this.time = s.t; if (this.applyG) this.applyG(s.g); }
  // ---- render ----
  view(dt, host) {
    this.meshes.forEach((m, i) => {
      const a = this.av[i];
      if (host) { a.tx = a.x; a.tz = a.z; a.ty = a.y; a.stunV = a.stun > 0; }
      const px = m.position.x, pz = m.position.z;
      m.position.x = host ? a.tx : damp(px, a.tx, 14, dt); m.position.z = host ? a.tz : damp(pz, a.tz, 14, dt);
      m.position.y = (this.groundY ? this.groundY(i) : 0) + a.ty;
      m.rotation.y += wrapAng(a.ry - m.rotation.y) * (1 - Math.exp(-14 * dt));
      const sp = Math.hypot(m.position.x - px, m.position.z - pz) / Math.max(dt, 1e-3);
      animChar(m, E.t, sp, a.ty > 0.05); m.userData.body.rotation.z = a.stunV ? Math.sin(E.t * 20) * 0.25 : 0;
      if (m.userData.mark) { m.userData.mark.position.y = 1.55 + Math.sin(E.t * 4) * 0.08; }
      if (!this.keepOut) m.visible = !a.out || (a.outT || 0) > 0;
    });
    if (this.viewG) this.viewG(dt, host);
  }
  camera(dt, local) {
    const c = this.cam, cam = E.camera;
    let tx = c.tx, tz = c.tz, d;
    if (c.mode === 'follow' && local >= 0 && this.meshes[local]) { const m = this.meshes[local].position; tx = clamp(m.x, -c.cx, c.cx); tz = clamp(m.z, -c.cz, c.cz); d = c.d; }
    else d = fitDist(c.W, c.H * Math.sin(c.pitch) + 2);
    if (c.mode !== 'follow') tz -= (c.H || 14) * 0.1; const want = new THREE.Vector3(tx, c.ty + Math.sin(c.pitch) * d, tz + Math.cos(c.pitch) * d);
    if (!this._camInit) { cam.position.copy(want); this._camInit = 1; } else cam.position.lerp(want, 1 - Math.exp(-5 * dt));
    cam.lookAt(cam.position.x, c.ty, cam.position.z - Math.cos(c.pitch) * d);
  }
  places() { // rank by score: [{i, place}]
    const s = this.av.map((a, i) => ({ i, s: this.rankScore ? this.rankScore(i) : a.score })).sort((x, y) => y.s - x.s);
    let pl = 1; return s.map((r, k) => { if (k > 0 && r.s < s[k - 1].s) pl = k + 1; return { i: r.i, place: pl, s: r.s }; });
  }
  // cheap helpers for AI
  steer(a, x, z, stop = 0.15) { const dx = x - a.x, dz = z - a.z, d = Math.hypot(dx, dz); if (d < stop) return { mx: 0, mz: 0 }; return { mx: dx / d, mz: dz / d }; }
}
