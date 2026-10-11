// Gameplay placement helpers mixed into a World while a level is built: pickups, whip rings, checkpoints, doors,
// plates, levers, push blocks, braziers, statues, and the booby traps (boulders, spikes, darts, bridges, logs, jets, sand).
import * as THREE from 'three';
import { World, rbox } from './world.js';
import { PR, propSeed, rnd, pick, shade } from './props.js';
import { rcyl, sph, cyl, torus, capsule, cone, tube, leaf, star, blobGeo, lathe } from './shapes.js';
const PI = Math.PI;
export function kit(w) {
  const E = (o) => { o.id = w.ents.length; w.ents.push(o); return o; };
  let nT = 0, nE = 0;
  Object.assign(w, { spikeList: [], darts: [], boulders: [], planks: [], logs: [], jets: [], blocks: [], braziers: [], statues: [], officerSpecs: [], talks: [], kiosks: [], flames: [], hookObjs: [],
    coin(x, y, z) { return E({ k: 'coin', x, y: y + 0.7, z }); },
    coinLine(x0, y0, z0, x1, y1, z1, n) { for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); w.coin(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t); } },
    coinRing(x, y, z, r, n) { for (let i = 0; i < n; i++) { const a = i / n * PI * 2; w.coin(x + Math.cos(a) * r, y, z + Math.sin(a) * r); } },
    coinArc(x0, y0, z0, x1, y1, z1, h, n) { for (let i = 0; i < n; i++) { const t = i / (n - 1); w.coin(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * PI) * h, z0 + (z1 - z0) * t); } },
    treasure(x, y, z) { return E({ k: 'treasure', x, y: y + 0.9, z, n: nT++ }); },
    evidence(x, y, z) { return E({ k: 'evidence', x, y: y + 1.0, z, n: nE++ }); },
    heartP(x, y, z) { return E({ k: 'heart', x, y: y + 0.8, z }); },
    cp(x, y, z, yaw = 0) { w.checkpoints.push({ x, y, z, yaw }); },
    hook(x, y, z, post = true) { w.hooks.push({ x, y, z }); if (post) { w.add('m', cyl(10), 0x6b4423, x, y + 0.45, z, 0, 0, 0, 0.06, 0.6, 0.06); } },
    animal(type, x, y, z, o) { w.enemies.push({ type, x, y, z, o }); },
    officers(list, bounds, o = {}) { w.officerSpecs.push({ list, bounds, o }); },
    talk(x0, z0, x1, z1, who, msg, o = {}) { w.talks.push(Object.assign({ min: [x0, -50, z0], max: [x1, 200, z1], who, msg }, o)); },
    hint(x0, z0, x1, z1, msg, y0 = -50, y1 = 200) { w.zone('hint', x0, y0, z0, x1, y1, z1, { msg }); },
    water(x0, y0, z0, x1, y1, z1) { w.zone('water', x0, y0, z0, x1, y1, z1); },
    hideSpot(x, y, z, kind = 'bush') { w.zone('hide', x - 1.3, y - 0.5, z - 1.3, x + 1.3, y + 2, z + 1.3, { kind, x, z });
      if (kind === 'bush') PR.bush(w, x, y, z, 1.25, 0x15803d); else if (kind === 'barrel') { PR.barrel(w, x, y, z, 0x1d4ed8, 1.4); } else if (kind === 'crate') { w.add('m', rbox(1.8, 1.6, 1.8, 0.1, 1), 0xc08a4f, x, y + 0.8, z); }
      else if (kind === 'urn') PR.urn(w, x, y, z, 1.9, 0xc2703d);
      w.add('l', torus(0.06, 32), 0x86efac, x, y + 0.05, z, PI / 2, 0, 0, 1.25, 1.25, 1, 0.25); },
    // ---- puzzles ----
    door(id, x, y, z, sx, sy, sz, need, col = 0x8a7a5a, msg) {
      const s = w.solid(x - sx / 2, y, z - sz / 2, x + sx / 2, y + sy, z + sz / 2, { dyn: true, camBlock: false }); s.dx = s.dy = s.dz = 0;
      const obj = w.dynObj((T) => { T.box('m', col, 0, 0, 0, sx, sy, sz, 0.12); const fz = sz / 2 + 0.03; [-1, 1].forEach((sd) => { T.add('m', rbox(sx * 0.8, sy * 0.8, 0.06, 0.04, 1), shade(col, 1.12), 0, sy / 2, sd * fz); T.add('l', sph(16), 0x86efac, 0, sy * 0.62, sd * (fz + 0.05), 0, 0, 0, 0.32, 0.32, 0.06, 0.5); T.add('m', torus(0.12, 24), shade(col, 0.8), 0, sy * 0.62, sd * (fz + 0.04), 0, 0, 0, 0.45, 0.45, 0.3); }); });
      obj.position.set(x, y, z); w.doors.push({ id, s, obj, need, open: false, y0: y, h: sy, msg }); return s; },
    plate(id, x, y, z, r = 1.0, col = 0x86efac) { w.plates.push({ id, x, y, z, r, on: false }); w.add('m', rbox(r * 2.2, 0.2, r * 2.2, 0.06, 1), 0x78716c, x, y + 0.1, z); const top = w.dynObj((T) => { T.box('m', 0xa8a29e, 0, 0, 0, r * 1.8, 0.18, r * 1.8, 0.06); T.add('l', star(), col, 0, 0.2, 0, -PI / 2, 0, 0, r * 0.5, r * 0.5, 0.2, 0.4); }); top.position.set(x, y + 0.12, z); w.plates[w.plates.length - 1].obj = top; w.solid(x - r * 1.1, y, z - r * 1.1, x + r * 1.1, y + 0.25, z + r * 1.1); },
    lever(id, x, y, z, ry = 0) { const lv = { id, x, y, z, on: false }; w.levers.push(lv); const T = w.tf(x, y, z, ry); T.box('m', 0x78716c, 0, 0, 0, 1.0, 0.5, 0.7, 0.12); T.solid(-0.5, 0, -0.35, 0.5, 0.5, 0.35);
      lv.obj = w.dynObj((L) => { L.add('m', cyl(10), 0x6b4423, 0, 0, 0, 0, 0, 0, 0.07, 1.1, 0.07); L.add('g', sph(16), 0xef4444, 0, 1.15, 0, 0, 0, 0, 0.18); }); lv.obj.position.set(x, y + 0.4, z); lv.obj.rotation.order = 'YXZ'; lv.obj.rotation.y = ry; lv.obj.rotation.z = 0.6; return lv; },
    pushBlock(id, x, y, z, size = 1.8, col = 0xa8a29e) { const s = w.solid(x - size / 2, y, z - size / 2, x + size / 2, y + size, z + size / 2, { dyn: true, push: true }); s.dx = s.dy = s.dz = 0;
      const obj = w.dynObj((T) => { T.box('m', col, 0, 0, 0, size, size, size, 0.14); [-1, 1].forEach((sd) => { T.add('m', star(), shade(col, 0.8), 0, size / 2, sd * size / 2, 0, 0, 0, size * 0.25, size * 0.25, 0.2); T.add('m', star(), shade(col, 0.8), sd * size / 2, size / 2, 0, 0, PI / 2, 0, size * 0.25, size * 0.25, 0.2); }); });
      obj.position.set(x, y, z); const b = { id, s, obj, x, y, z, size, mv: null, x0: x, z0: z }; s.block = b; w.blocks.push(b); return b; },
    brazier(id, x, y, z) { const b = { id, x, y, z, lit: false }; w.braziers.push(b); w.add('m', lathe([[0.001, 0], [0.4, 0], [0.25, 0.3], [0.2, 0.9], [0.6, 1.2], [0.7, 1.4], [0.001, 1.25]], 24, 'brazier'), 0x78716c, x, y, z); w.add('x', torus(0.08, 24), 0xd4a017, x, y + 1.35, z, PI / 2, 0, 0, 0.68, 0.68, 0.6); w.solid(x - 0.6, y, z - 0.6, x + 0.6, y + 1.4, z + 0.6);
      for (let i = 0; i < 5; i++) w.add('m', blobGeo(i + 90, 0.3, 1), 0x292524, x + Math.cos(i * 1.3) * 0.25, y + 1.35, z + Math.sin(i * 1.3) * 0.25, 0, 0, 0, 0.18);
      b.obj = w.dynObj((T) => { T.add('l', sph(14), 0xff8a1f, 0, 0, 0, 0, 0, 0, 0.45, 0.6, 0.45, 1.5); T.add('l', cone(14), 0xffe066, 0, 0.1, 0, 0, 0, 0, 0.3, 1.1, 0.3, 2); }); b.obj.position.set(x, y + 1.6, z); b.obj.visible = false; return b; },
    statue(id, group, x, y, z, rot, target, kind = 'arrow') { const st = { id, group, x, y, z, rot: rot | 0, target: target | 0 }; w.statues.push(st); w.add('m', rbox(1.4, 0.6, 1.4, 0.1, 1), 0x8a7a5a, x, y + 0.3, z); w.solid(x - 0.7, y, z - 0.7, x + 0.7, y + 2.6, z + 0.7);
      st.obj = w.dynObj((T) => { T.add('m', rcyl(0.5, 1.6, 0.12, 24), 0xb7a77a, 0, 0, 0); T.add('m', sph(18), 0xb7a77a, 0, 1.9, 0, 0, 0, 0, 0.48); T.add('g', sph(10), 0x34d399, -0.17, 2.0, 0.42, 0, 0, 0, 0.09, 0.09, 0.05, 0.6); T.add('g', sph(10), 0x34d399, 0.17, 2.0, 0.42, 0, 0, 0, 0.09, 0.09, 0.05, 0.6); T.add('m', cone(12), 0xd6b370, 0, 1.0, 0.5, PI / 2, 0, 0, 0.22, 0.5, 0.22); });
      st.obj.position.set(x, y + 0.6, z); st.obj.rotation.y = st.rot * PI / 2; return st; },
    // ---- booby traps ----
    // spike floor tile area: spikes pop up on a timer (with a warning rumble first)
    spikes(x0, z0, x1, z1, y, period = 3, phase = 0, upFrac = 0.4) { const sp = { x0, z0, x1, z1, y, period, phase, upFrac, k: 0 }; w.spikeList.push(sp);
      w.add('m', rbox(x1 - x0, 0.1, z1 - z0, 0.03, 1), 0x57534e, (x0 + x1) / 2, y + 0.03, (z0 + z1) / 2);
      for (let x = x0 + 0.5; x < x1; x += 1.0) for (let z = z0 + 0.5; z < z1; z += 1.0) w.add('m', torus(0.1, 12), 0x292524, x, y + 0.09, z, PI / 2, 0, 0, 0.14, 0.14, 0.2);
      sp.obj = w.dynObj((T) => { for (let x = x0 + 0.5; x < x1; x += 1.0) for (let z = z0 + 0.5; z < z1; z += 1.0) { T.add('x', cone(10), 0xd1d5db, x, -0.7, z, 0, 0, 0, 0.13, 0.75, 0.13); T.add('x', sph(8), 0x9ca3af, x, -0.7, z, 0, 0, 0, 0.14, 0.05, 0.14); } }); sp.obj.position.y = y; return sp; },
    // dart wall: slots on a wall shoot suction-cup darts across a corridor (dir = [dx, dz])
    dartWall(x, y, z, dir, len, period = 2.2, phase = 0, n = 3, span = 3) { const d = { x, y, z, dir, len, period, phase, n, span, fired: -1 }; w.darts.push(d); const along = [dir[1], -dir[0]];
      for (let i = 0; i < n; i++) { const o = (n === 1 ? 0 : (i / (n - 1) - 0.5)) * span; const sx = x + along[0] * o, sz = z + along[1] * o; w.add('m', rbox(0.5, 0.5, 0.5, 0.08, 1), 0x57534e, sx, y + 0.95, sz); w.add('m', rcyl(0.12, 0.2, 0.03, 14), 0x111827, sx + dir[0] * 0.2, y + 1.2, sz + dir[1] * 0.2, PI / 2, Math.atan2(dir[0], dir[1]), 0); w.add('m', sph(10), 0xef4444, sx, y + 1.5, sz, 0, 0, 0, 0.08); } return d; },
    // rolling boulder along a path, triggered by a zone (player must reach the safe alcove / end)
    boulder(trig, path, r = 2.2, o = {}) { const b = { trig, path, r, st: 'wait', t: 0, i: 0, x: path[0][0], y: path[0][1] + r, z: path[0][2], rot: 0, sp: o.sp || 8.5, delay: o.delay || 0.6, id: w.boulders.length }; w.boulders.push(b); return b; },
    // rope bridge whose planks wobble then drop after you step on them (they come back)
    bridge(x0, z0, x1, z1, y, width = 2.4, collapse = true) { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.round(L / 0.8), ry = Math.atan2(x1 - x0, z1 - z0); const ux = (x1 - x0) / L, uz = (z1 - z0) / L;
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, cx = x0 + (x1 - x0) * t, cz = z0 + (z1 - z0) * t, sag = Math.sin(t * PI) * 0.3; const hw = width / 2, hl = 0.36;
        const ex = Math.abs(Math.sin(ry)) * hl + Math.abs(Math.cos(ry)) * hw, ez = Math.abs(Math.cos(ry)) * hl + Math.abs(Math.sin(ry)) * hw;
        const s = w.solid(cx - ex, y - 0.15 - sag, cz - ez, cx + ex, y - sag, cz + ez, { dyn: collapse }); if (collapse) { s.dx = s.dy = s.dz = 0; }
        const obj = w.dynObj((T) => T.add('m', rbox(width, 0.12, 0.66, 0.04, 1), pick([0xa0763f, 0x8b6534, 0xb0854a]), 0, -0.06, 0, 0, ry, (rnd() - 0.5) * 0.06)); obj.position.set(cx, y - sag, cz);
        if (collapse) { const p = { s, obj, st: 'ok', t: 0, x: cx, y: y - sag, z: cz, id: w.planks.length }; s.onStep = () => { if (p.st === 'ok') { p.st = 'shake'; p.t = 0; w.game && w.game.onPlank(p); } }; w.planks.push(p); } }
      const px = -uz * width / 2, pz = ux * width / 2;
      [-1, 1].forEach((sd) => { PR.rope(w, x0 + px * sd, y + 1.0, z0 + pz * sd, x1 + px * sd, y + 1.0, z1 + pz * sd, 0xc2a26f, 0.05, 0.35); PR.rope(w, x0 + px * sd, y - 0.05, z0 + pz * sd, x1 + px * sd, y - 0.05, z1 + pz * sd, 0xc2a26f, 0.04, 0.32);
        [[x0, z0], [x1, z1]].forEach(([a, b]) => { w.add('m', rcyl(0.16, 1.6, 0.04, 12), 0x6b4423, a + px * sd * 1.1, y - 0.4, b + pz * sd * 1.1); }); });
      // invisible side rails so nobody walks off sideways by accident
      return { n, ry }; },
    swingLog(x, y, z, axis, len = 4, period = 2.6, phase = 0) { const lg = { x, y, z, axis, len, period, phase, a: 0 }; w.logs.push(lg); w.add('m', rbox(axis === 'x' ? 0.5 : 4, 0.5, axis === 'x' ? 4 : 0.5, 0.1, 1), 0x6b4423, x, y + 0.25, z);
      lg.obj = w.dynObj((T) => { T.add('m', cyl(8), 0xc2a26f, -0.05, -len, 0, 0, 0, 0, 0.04, len, 0.04); T.add('m', cyl(8), 0xc2a26f, 0.05, -len, 0, 0, 0, 0, 0.04, len, 0.04); T.add('m', rcyl(0.55, 2.6, 0.2, 20), 0x8b5a2b, -1.3, -len - 0.2, 0, 0, 0, PI / 2); T.add('m', rcyl(0.56, 0.06, 0.02, 20), 0xd6b370, -1.31, -len - 0.2, 0, 0, 0, PI / 2); T.add('m', rcyl(0.56, 0.06, 0.02, 20), 0xd6b370, 1.25, -len - 0.2, 0, 0, 0, PI / 2); });
      lg.obj.position.set(x, y, z); lg.obj.rotation.order = 'YXZ'; lg.obj.rotation.y = axis === 'x' ? 0 : PI / 2; return lg; },
    jet(x, y, z, period = 3, phase = 0, kind = 'fire') { const j = { x, y, z, period, phase, kind, on: false }; w.jets.push(j); w.add('m', rcyl(0.5, 0.15, 0.05, 20), 0x57534e, x, y, z); w.add('m', rcyl(0.22, 0.16, 0.05, 16), 0x111827, x, y + 0.02, z);
      j.obj = w.dynObj((T) => { const c = kind === 'fire' ? [0xff7a1f, 0xffe066] : [0xe0f2fe, 0xffffff]; T.add('l', cone(16), c[0], 0, 0, 0, 0, 0, 0, 0.5, 2.6, 0.5, 1.2); T.add('l', cone(16), c[1], 0, 0, 0, 0, 0, 0, 0.28, 1.8, 0.28, 2); }); j.obj.position.set(x, y + 0.1, z); j.obj.visible = false; return j; },
    quicksand(x0, z0, x1, z1, y) { w.zone('sand', x0, y - 3, z0, x1, y + 0.6, z1); w.add('m', rbox(x1 - x0, 0.12, z1 - z0, 0.05, 1), 0xd9b26f, (x0 + x1) / 2, y + 0.0, (z0 + z1) / 2);
      for (let i = 0; i < (x1 - x0) * (z1 - z0) / 6; i++) w.add('m', torus(0.12, 20), 0xc49a52, x0 + rnd() * (x1 - x0), y + 0.06, z0 + rnd() * (z1 - z0), PI / 2, 0, 0, 0.3 + rnd() * 0.5, 0.3 + rnd() * 0.5, 0.2); },
    dynObj(build) { const sub = new World(); build(sub.tf(0, 0, 0), sub); const g = new THREE.Group(); sub.finalize(g); w.group.add(g); return g; },
    mover(x, y, z, size, off, period, phase = 0, col = 0xa8a29e) { const s = w.solid(x - size[0] / 2, y, z - size[2] / 2, x + size[0] / 2, y + size[1], z + size[2] / 2, { dyn: true });
      const obj = w.dynObj((T) => { T.box('m', col, 0, 0, 0, size[0], size[1], size[2], 0.12); T.add('l', star(), 0x86efac, 0, size[1] + 0.01, 0, -PI / 2, 0, 0, 0.35, 0.35, 0.1, 0.3); }); w.movers.push({ s, base: [x - size[0] / 2, y, z - size[2] / 2], off, period, phase, obj, size }); return s; },
    sideWall(x0, y0, z0, x1, y1, z1) { return w.solid(x0, y0, z0, x1, y1, z1, { nocam: true, nofloor: true }); },
  });
  return w;
}
export { PR, propSeed };
