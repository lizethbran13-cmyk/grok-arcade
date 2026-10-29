// Smooth cartoon cars + arcade driving.
import * as THREE from 'three';
import { P } from './geo.js';
import { MB, toGroup, XB } from './kit.js';
import { rcyl, torus, cyl, sph, lathe } from './shapes.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const PI = Math.PI;
const RB = new RoundedBoxGeometry(1, 1, 1, 6, 0.32), RB2 = new RoundedBoxGeometry(1, 1, 1, 5, 0.22);
export function carBody(x, kind, col, lowWheels) {
  const dark = 0x1e293b, glass = 0x9fd8ff, chrome = 0xd8dee9;
  const L = kind === 'van' ? 4.6 : kind === 'sport' ? 4.2 : kind === 'pickup' ? 4.6 : 3.7, W = kind === 'van' ? 2.1 : 1.9;
  const base = kind === 'hover' ? 0.75 : 0.42;
  x.p('g', RB, col, 0, base + 0.42, 0, 0, 0, 0, W, 0.75, L);
  x.p('g', RB2, 0xffffff, 0, base + 0.2, 0, 0, 0, 0, W + 0.04, 0.12, L * 0.96); // side trim stripe
  if (kind === 'van') { x.p('g', RB, col, 0, base + 1.25, -0.3, 0, 0, 0, W * 0.98, 1.2, L * 0.78); x.p('n', RB2, glass, 0, base + 1.35, L * 0.36 - 0.05, -0.15, 0, 0, W * 0.9, 0.6, 0.08);
    x.p('n', RB2, glass, W * 0.49, base + 1.4, 0.4, 0, 0, 0, 0.06, 0.55, 0.9); x.p('n', RB2, glass, -W * 0.49, base + 1.4, 0.4, 0, 0, 0, 0.06, 0.55, 0.9);
    x.p('g', RB2, 0xffffff, W * 0.5, base + 1.25, -0.8, 0, 0, 0, 0.05, 0.8, 1.6); x.p('g', P.rboxS, 0xff4fa0, W * 0.52, base + 1.3, -0.8, 0, 0, 0, 0.04, 0.35, 1.2); // serving hatch + sign
    x.p('g', P.sphere, 0xffd23f, 0, base + 2.05, -0.6, 0, 0, 0, 0.5, 0.35, 0.5); x.p('g', rcyl(0.5, 0.12, 0.05), 0xe39a48, 0, base + 1.85, -0.6); // roof burger!
  } else if (kind === 'pickup') { x.p('g', RB, col, 0, base + 1.1, 0.35, 0, 0, 0, W * 0.96, 0.85, 1.7); x.p('n', RB2, glass, 0, base + 1.18, 1.2, -0.35, 0, 0, W * 0.86, 0.55, 0.08);
    x.p('m', P.rboxS, 0x7c5a3a, 0, base + 0.82, -1.3, 0, 0, 0, W * 0.86, 0.1, 1.5); x.p('g', P.rboxS, col, 0, base + 1.0, -2.2, 0, 0, 0, W * 0.96, 0.4, 0.12);
    [-1, 1].forEach((s) => x.p('n', RB2, glass, s * W * 0.48, base + 1.18, 0.35, 0, 0, 0, 0.06, 0.48, 1.2));
  } else { const cl = kind === 'sport' ? 1.7 : 2.1, ch = kind === 'sport' ? 0.55 : 0.72, cz = kind === 'sport' ? -0.25 : -0.15;
    x.p('g', RB, col, 0, base + 0.78 + ch * 0.5, cz, 0, 0, 0, W * 0.88, ch, cl); x.p('n', RB2, glass, 0, base + 0.82 + ch * 0.5, cz + cl * 0.47, -0.45, 0, 0, W * 0.78, ch * 0.75, 0.08);
    x.p('n', RB2, glass, 0, base + 0.82 + ch * 0.5, cz - cl * 0.47, 0.4, 0, 0, W * 0.78, ch * 0.7, 0.08);
    [-1, 1].forEach((s) => x.p('n', RB2, glass, s * W * 0.44, base + 0.86 + ch * 0.45, cz, 0, 0, 0, 0.06, ch * 0.62, cl * 0.8));
    if (kind === 'sport') { x.p('g', P.rboxS, dark, 0, base + 1.05, -L * 0.47, 0, 0, 0, W * 0.9, 0.06, 0.4); [-1, 1].forEach((s) => x.p('g', P.cyl, dark, s * 0.6, base + 0.9, -L * 0.47, 0, 0, 0, 0.05, 0.25, 0.05)); }
    if (kind === 'hover') { x.p('l', torus(0.18, 32), 0x3ff0ff, 0, base - 0.05, 0, PI / 2, 0, 0, 0.9, 1.5, 0.7, 0.5); x.p('g', P.sphere, 0xffffff, -0.4, base + 1.55, cz, 0, 0, -0.3, 0.22, 0.32, 0.08); x.p('g', P.sphere, 0xffffff, 0.4, base + 1.55, cz, 0, 0, 0.3, 0.22, 0.32, 0.08); }
  }
  // lights, bumpers, mirrors
  [-1, 1].forEach((s) => { x.p('l', P.sphere, 0xfff7c2, s * W * 0.32, base + 0.5, L * 0.5 - 0.02, 0, 0, 0, 0.2, 0.15, 0.08, 0.6); x.p('l', P.sphere, 0xff2a2a, s * W * 0.34, base + 0.55, -L * 0.5 + 0.02, 0, 0, 0, 0.18, 0.12, 0.06, 0.4);
    x.p('g', P.sphere, col, s * W * 0.52, base + 0.95, L * 0.18, 0, 0, 0, 0.12, 0.08, 0.06); });
  x.p('x', RB2, chrome, 0, base + 0.18, L * 0.5, 0, 0, 0, W * 0.92, 0.2, 0.18); x.p('x', RB2, chrome, 0, base + 0.18, -L * 0.5, 0, 0, 0, W * 0.92, 0.2, 0.18);
  x.p('g', P.rboxS, dark, 0, base + 0.35, L * 0.5 + 0.03, 0, 0, 0, W * 0.4, 0.18, 0.05);
  if (kind !== 'hover' && lowWheels) { const wz = L * 0.33; for (const s of [-1, 1]) for (const z of [-wz, wz]) { x.p('g', torus(0.42, 28), 0x1f1f24, s * W * 0.46, 0.42, z, 0, PI / 2, 0, 0.3, 0.3, 0.42); x.p('x', rcyl(0.2, 0.12, 0.04), chrome, s * W * 0.46 + s * 0.02, 0.42, z, 0, 0, s * PI / 2); } }
  return { L, W };
}
const carCache = new Map();
// a drivable car: body group + 4 spinning wheel groups
export function makeCar(kind, col) {
  const root = new THREE.Group(); const b = MB(); const x = new XB(b); const dim = carBody(x, kind, col, false); const body = toGroup(b); root.add(body);
  const wheels = [];
  if (kind !== 'hover') { const key = 'w'; let wg = carCache.get(key); if (!wg) { const w = MB(); w.g.add(torus(0.42, 28), 0x1f1f24, 0, 0, 0, 0, PI / 2, 0, 0.3, 0.3, 0.42); w.x.add(rcyl(0.2, 0.12, 0.04), 0xd8dee9, 0.03, 0, 0, 0, 0, PI / 2); for (let i = 0; i < 5; i++) w.g.add(P.sphere, 0x9ca3af, 0.1, Math.cos(i * 1.26) * 0.12, Math.sin(i * 1.26) * 0.12, 0, 0, 0, 0.03); wg = toGroup(w); carCache.set(key, wg); }
    const wz = dim.L * 0.33; for (const s of [-1, 1]) for (const z of [wz, -wz]) { const w = wg.clone(); if (s < 0) w.scale.x = -1; const piv = new THREE.Group(); piv.position.set(s * dim.W * 0.46, 0.42, z); piv.add(w); root.add(piv); wheels.push({ g: w, front: z > 0, s }); } }
  root.userData.car = { body, wheels, dim, kind };
  return root;
}
// arcade car state + stepping. input: {x,y} stick in camera space -> desired heading
export function newCarState(def) { return { x: 0, z: 0, ry: 0, v: 0, steer: 0, def, spin: 0 }; }
export function stepCar(c, inp, dt, camYaw, collide) {
  const max = c.def.spd; let thr = 0, steerT = 0;
  const m = Math.hypot(inp.x, inp.y);
  if (m > 0.15) { // stick points where you want to go (relative to the camera); reverse if pulling back hard while slow
    const want = camYaw - Math.atan2(inp.x, inp.y); let d = want - c.ry; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI;
    if (Math.abs(d) > 2.4 && c.v < 2) { thr = -0.6 * m; let d2 = d - Math.sign(d) * PI; steerT = Math.max(-1, Math.min(1, -d2 * 1.6)); }
    else { thr = m * (Math.abs(d) > 1.6 ? 0.35 : 1); steerT = Math.max(-1, Math.min(1, d * 1.8)); }
  }
  if (inp.brake) thr = c.v > 0.5 ? -1.5 : -0.6;
  c.steer += (steerT - c.steer) * Math.min(1, dt * 8);
  const acc = thr > 0 ? 9 : thr < 0 ? 14 : 0;
  c.v += thr * acc * dt; if (!thr) c.v -= Math.sign(c.v) * Math.min(Math.abs(c.v), 6 * dt);
  c.v = Math.max(-6, Math.min(max, c.v));
  const turn = c.steer * 2.2 * Math.min(1, Math.abs(c.v) / 5) * Math.sign(c.v || 1);
  c.ry += turn * dt;
  let nx = c.x + Math.sin(c.ry) * c.v * dt, nz = c.z + Math.cos(c.ry) * c.v * dt;
  const r = collide(nx, nz, 1.3);
  if (r.hit) { const sp = Math.abs(c.v); c.v *= -0.25; nx = r.x; nz = r.z; c.bump = sp; } else c.bump = 0;
  c.x = nx; c.z = nz; c.spin += c.v * dt / 0.42;
}
export function poseCar(root, c, t) {
  root.position.set(c.x, 0, c.z); root.rotation.y = c.ry; const C = root.userData.car;
  if (C.kind === 'hover') { C.body.position.y = 0.15 + Math.sin(t * 3) * 0.08; C.body.rotation.z = -c.steer * 0.08; return; }
  C.body.rotation.z = -c.steer * Math.min(1, Math.abs(c.v) / 12) * 0.05;
  for (const w of C.wheels) { w.g.rotation.x = c.spin; w.g.parent.rotation.y = w.front ? c.steer * 0.45 : 0; }
}
