// Gameplay placement helpers mixed into a World while a level is built.
import * as THREE from 'three';
import { World, rbox } from './world.js';
import { PR, propSeed } from './props.js';
import { rcyl, sph, cyl, torus, capsule, cone, wedge } from './shapes.js';
const PI = Math.PI;
export function kit(w) {
  const E = (o) => { o.id = w.ents.length; w.ents.push(o); return o; };
  let nPart = 0, nBaby = 0;
  Object.assign(w, {
    crumb(x, y, z) { return E({ k: 'crumb', x, y: y + 0.55, z }); },
    crumbLine(x0, y0, z0, x1, y1, z1, n) { for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); w.crumb(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t); } },
    crumbRing(x, y, z, r, n) { for (let i = 0; i < n; i++) { const a = i / n * PI * 2; w.crumb(x + Math.cos(a) * r, y, z + Math.sin(a) * r); } },
    crumbArc(x0, y0, z0, x1, y1, z1, h, n) { for (let i = 0; i < n; i++) { const t = i / (n - 1); w.crumb(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * PI) * h, z0 + (z1 - z0) * t); } },
    cheese(x, y, z) { return E({ k: 'cheese', x, y: y + 0.8, z }); },
    part(x, y, z) { return E({ k: 'part', x, y: y + 0.9, z, n: nPart++ }); },
    baby(x, y, z) { return E({ k: 'baby', x, y: y + 1.0, z, n: nBaby++ }); },
    heartP(x, y, z) { return E({ k: 'heart', x, y: y + 0.8, z }); },
    crate(x, y, z) { const e = E({ k: 'crate', x, y, z }); e.s = w.solid(x - 0.7, y, z - 0.7, x + 0.7, y + 1.4, z + 0.7, { dyn: true, crate: e }); e.s.dx = e.s.dy = e.s.dz = 0;
      const sub = new World(); const T = sub.tf(0, 0, 0); T.box('m', 0xd8a15a, 0, 0, 0, 1.4, 1.4, 1.4, 0.12); [-1, 1].forEach((s) => { T.box('m', 0xb07a3c, 0, 0.05, s * 0.71, 1.2, 0.25, 0.06, 0.04); T.box('m', 0xb07a3c, 0, 1.1, s * 0.71, 1.2, 0.25, 0.06, 0.04); T.box('m', 0xb07a3c, s * 0.71, 0.05, 0, 0.06, 0.25, 1.2, 0.04); T.box('m', 0xb07a3c, s * 0.71, 1.1, 0, 0.06, 0.25, 1.2, 0.04); });
      T.add('g', wedge(), 0xffd23f, 0, 0.7, 0.72, PI / 2, 0, 0, 0.45); T.add('g', wedge(), 0xffd23f, 0.72, 0.7, 0, PI / 2, PI / 2, 0, 0.45); T.add('g', wedge(), 0xffd23f, 0, 0.7, -0.72, PI / 2, PI, 0, 0.45); T.add('g', wedge(), 0xffd23f, -0.72, 0.7, 0, PI / 2, -PI / 2, 0, 0.45);
      const g = new THREE.Group(); sub.finalize(g); g.position.set(x, y, z); w.group.add(g); e.obj = g; return e; },
    cp(x, y, z, yaw = 0) { w.checkpoints.push({ x, y, z, yaw }); },
    hook(x, y, z) { w.hooks.push({ x, y, z }); },
    enemy(type, x, y, z, o) { w.enemies.push({ type, x, y, z, o }); },
    // dynamic object: build(T, sub) in local coords around (0,0,0); returns THREE.Group placed in the room
    dynObj(build) { const sub = new World(); build(sub.tf(0, 0, 0), sub); const g = new THREE.Group(); sub.finalize(g); w.group.add(g); return g; },
    // moving platform: centre-bottom x,y,z; size [sx,sy,sz]; off = travel; build optional visual
    mover(x, y, z, size, off, period, phase = 0, col = 0xffd23f, build) {
      const s = w.solid(x - size[0] / 2, y, z - size[2] / 2, x + size[0] / 2, y + size[1], z + size[2] / 2, { dyn: true });
      const obj = w.dynObj((T, sub) => { if (build) build(T, sub, size); else T.box('g', col, 0, 0, 0, size[0], size[1], size[2], 0.2); });
      w.movers.push({ s, base: [x - size[0] / 2, y, z - size[2] / 2], off, period, phase, obj, size }); return s; },
    door(id, x, y, z, sx, sy, sz, need, col = 0xff4fa0, msg) {
      const s = w.solid(x - sx / 2, y, z - sz / 2, x + sx / 2, y + sy, z + sz / 2, { dyn: true }); s.dx = s.dy = s.dz = 0;
      const obj = w.dynObj((T) => { T.box('g', col, 0, 0, 0, sx, sy, sz, 0.2); T.box('l', 0xffffff, 0, sy * 0.45, sz / 2 + 0.02, Math.min(sx, 1.4), 0.25, 0.05, 0.05, 0.6); T.box('l', 0xffffff, 0, sy * 0.45, -sz / 2 - 0.02, Math.min(sx, 1.4), 0.25, 0.05, 0.05, 0.6); for (let i = 0; i < 3; i++) T.add('x', cyl(10), 0xd1d5db, -sx / 2 + sx * (i + 1) / 4, 0, sz / 2 + 0.1, 0, 0, 0, 0.12, sy, 0.12); });
      obj.position.set(x, y, z); w.doors.push({ id, s, obj, need, open: false, y0: y, h: sy, msg }); return s; },
    plate(id, x, y, z, r = 1.4, col = 0x3ff0ff) { w.plates.push({ id, x, y, z, r, on: false }); w.add('x', rcyl(r, 0.15, 0.06, 28), 0x6b7280, x, y, z); w.add('l', rcyl(r * 0.8, 0.2, 0.06, 28), col, x, y, z, 0, 0, 0, 1, 1, 1, 0.4); w.solid(x - r, y, z - r, x + r, y + 0.15, z + r); },
    lever(id, x, y, z, ry = 0) { const lv = { id, x, y, z, on: false }; w.levers.push(lv); const T = w.tf(x, y, z, ry); T.box('x', 0x6b7280, 0, 0, 0, 1.4, 0.5, 1.0, 0.15); T.solid(-0.7, 0, -0.5, 0.7, 0.5, 0.5);
      lv.obj = w.dynObj((L) => { L.add('x', cyl(10), 0xd1d5db, 0, 0, 0, 0, 0, 0, 0.1, 1.4, 0.1); L.add('g', sph(16), 0xff3b5c, 0, 1.45, 0, 0, 0, 0, 0.3); }); lv.obj.position.set(x, y + 0.4, z); lv.obj.rotation.z = 0.7; lv.obj.rotation.y = ry; return lv; },
    fan(x, y, z, r, h, force = 30, col = 0x94a3b8) { w.zone('wind', x - r, y, z - r, x + r, y + h, z + r, { f: [0, force, 0] }); w.add('x', rcyl(r + 0.3, 0.5, 0.15, 32), 0x475569, x, y, z); w.solid(x - r - 0.3, y, z - r - 0.3, x + r + 0.3, y + 0.5, z + r + 0.3);
      const b = w.dynObj((T) => { for (let i = 0; i < 4; i++) T.add('g', rbox(r * 0.95, 0.08, r * 0.35, 0.04), col, Math.cos(i * PI / 2) * r * 0.5, 0, Math.sin(i * PI / 2) * r * 0.5, 0.25, -i * PI / 2, 0); T.add('x', sph(14), 0xd1d5db, 0, 0, 0, 0, 0, 0, 0.35, 0.2, 0.35); });
      b.position.set(x, y + 0.6, z); w.anims.push((dt) => { b.rotation.y += dt * 14; if (Math.random() < 0.25 && w.game) w.game.fx.emit(x + (Math.random() - 0.5) * r * 1.6, y + 1, z + (Math.random() - 0.5) * r * 1.6, 0, 8, 0, 0.05, 0xe0f7ff, 0.8, 0, 0); }); },
    sideWind(x0, y0, z0, x1, y1, z1, f) { w.zone('wind', x0, y0, z0, x1, y1, z1, { f }); },
    water(x0, y0, z0, x1, y1, z1) { w.zone('water', x0, y0, z0, x1, y1, z1); },
    hint(x0, z0, x1, z1, msg, y0 = -5, y1 = 60) { w.zone('hint', x0, y0, z0, x1, y1, z1, { msg }); },
    hot(x0, y0, z0, x1, y1, z1) { return w.solid(x0, y0, z0, x1, y1, z1, { hot: true }); },
    bounce(s, v) { s.bounce = v; return s; },
    // room shell: floor callback + 4 walls (+ ceiling)
    room(W, D, H, o = {}) { const x0 = -W / 2, x1 = W / 2, z0 = -D / 2, z1 = D / 2; (o.floor || ((a, b, c, d) => PR.floorPlanks(w, a, b, c, d)))(x0, z0, x1, z1);
      const wc = o.wall || 0xfff1dc; PR.wall(w, 'x', z0 - 0.6, x0 - 1.2, x1 + 1.2, H, o.wallN || wc, { side: 1, holes: o.holesN }); PR.wall(w, 'x', z1 + 0.6, x0 - 1.2, x1 + 1.2, H, o.wallS || wc, { side: -1, holes: o.holesS });
      PR.wall(w, 'z', x0 - 0.6, z0, z1, H, o.wallW || wc, { side: 1, holes: o.holesW }); PR.wall(w, 'z', x1 + 0.6, z0, z1, H, o.wallE || wc, { side: -1, holes: o.holesE });
      if (o.ceiling !== false) { w.add('w', rbox(W + 2, 1, D + 2, 0.1), o.ceil || 0xfffaf2, 0, H + 0.5, 0); w.solid(x0 - 1, H, z0 - 1, x1 + 1, H + 1, z1 + 1, { cam: true, nofloor: true });
        if (o.lamp !== false) { w.add('g', rcyl(3.2, 0.6, 0.3, 32), 0xffffff, 0, H - 0.6, 0); w.add('l', sph(24), 0xfff4d6, 0, H - 0.6, 0, 0, 0, 0, 2.6, 0.8, 2.6, 1.0); w.lights.push({ x: 0, y: H - 2.5, z: 0, c: 0xfff1dc, i: 60, d: 70 }); } }
      w.bounds = [x0, z0, x1, z1]; },
    frameArt(axis, at, c, y, W, H, side, art) { PR.frame(w, axis, at, c, y, W, H, side, art); },
  });
  return w;
}
export { PR, propSeed };
