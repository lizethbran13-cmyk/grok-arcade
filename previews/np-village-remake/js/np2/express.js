// Polar Express: a real loop around the village, four stops, a locomotive + cars the player can ride.
import * as THREE from 'three';
import { E } from '../engine.js?v=np11';
import { sfx } from '../audio.js?v=np11';
import { makeFolk } from '../folk.js?v=np11';
import { G } from './vworld.js';
import * as K from './kit2.js';
import { panel, closePanel } from './panel.js';
const PI = Math.PI, E_ = PI / 2;

// Compact rectangular loop around the village core (inside the river, in front of the Workshop, east of the Events Center).
export const PE_Z = 126;
export const PE_LOOP = { xw: -72, xe: 128, zs: 126, zn: -88, r: 18 };

function buildPath() {
  const { xw, xe, zs, zn, r } = PE_LOOP, segs = [];
  const line = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0), yaw = Math.atan2(x1 - x0, z1 - z0);
    segs.push({ typ: 'line', x0, z0, x1, z1, len, yaw });
  };
  const arc = (cx, cz, rad, a0, a1) => {
    segs.push({ typ: 'arc', cx, cz, r: rad, a0, a1, len: Math.abs(a1 - a0) * rad });
  };
  line(xw + r, zs, xe - r, zs);
  arc(xe - r, zs - r, r, 0, PI / 2);
  line(xe, zs - r, xe, zn + r);
  arc(xe - r, zn + r, r, PI / 2, PI);
  line(xe - r, zn, xw + r, zn);
  arc(xw + r, zn + r, r, PI, PI * 1.5);
  line(xw, zn + r, xw, zs - r);
  arc(xw + r, zs - r, r, PI * 1.5, PI * 2);
  return { segs, len: segs.reduce((a, s) => a + s.len, 0) };
}
const PATH = buildPath();
export const PE_LEN = PATH.len;

export function pePose(s) {
  const L = PATH.len; s = ((s % L) + L) % L; let t = s;
  for (const g of PATH.segs) {
    if (t > g.len) { t -= g.len; continue; }
    if (g.typ === 'line') {
      const u = g.len < 1e-9 ? 0 : t / g.len;
      return { x: g.x0 + (g.x1 - g.x0) * u, z: g.z0 + (g.z1 - g.z0) * u, yaw: g.yaw };
    }
    const a = g.a0 + (t / g.len) * (g.a1 - g.a0);
    return { x: g.cx + g.r * Math.sin(a), z: g.cz + g.r * Math.cos(a), yaw: Math.atan2(Math.cos(a), -Math.sin(a)) };
  }
  return pePose(0);
}
function nearestS(x, z) {
  let best = 0, bd = 1e9; const N = 500;
  for (let i = 0; i < N; i++) { const s = i / N * PATH.len, p = pePose(s), d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; best = s; } }
  return best;
}

export const PE_STOPS = [
  { id: 'station', name: '🚂 Polar Express Station', x: 18, z: 126, wait: [18, 123.4], yaw: 0 },
  { id: 'elfvil', name: '🍄 Elf Village', x: 118, z: 126, wait: [118, 123.4], yaw: 0 },
  { id: 'workshop', name: '🧸 Workshop Side', x: -46, z: -88, wait: [-46, -91.2], yaw: PI },
  { id: 'events', name: '🎪 Events Center', x: -72, z: 2, wait: [-75.2, 2], yaw: E_ },
];
PE_STOPS.forEach((s) => { s.s = nearestS(s.x, s.z); s.zx = s.wait[1]; });
const CRUISE = 9, ACC = 5, DWELL_ST = 12, DWELL = 7;

function railBed(w, x0, z0, x1, z1) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), ry = Math.atan2(dx, dz);
  w.add('m', G.box(), 0xb8a48a, cx, 0, cz, 0, ry, 0, 4, 0.12, L);
  const px = Math.cos(ry) * 0.75, pz = -Math.sin(ry) * 0.75;
  w.add('x', G.box(), 0x64748b, cx + px, 0.2, cz + pz, 0, ry, 0, 0.12, 0.14, L);
  w.add('x', G.box(), 0x64748b, cx - px, 0.2, cz - pz, 0, ry, 0, 0.12, 0.14, L);
  const n = Math.max(2, Math.floor(L / 2));
  for (let i = 0; i <= n; i++) { const u = i / n; w.add('m', G.box(), 0x5b3a21, x0 + dx * u, 0.1, z0 + dz * u, 0, ry, 0, 3.2, 0.1, 0.35); }
}
function railArc(w, cx, cz, r, a0, a1) {
  const steps = 8; let px, pz;
  for (let i = 0; i <= steps; i++) {
    const a = a0 + (i / steps) * (a1 - a0), x = cx + r * Math.sin(a), z = cz + r * Math.cos(a);
    if (i) railBed(w, px, pz, x, z);
    px = x; pz = z;
  }
}

// ---- platforms, signs, the rest of the loop (called from buildVillage; south rails already exist)
export function dressRailway(w) {
  const { xw, xe, zs, zn, r } = PE_LOOP, z = PE_Z;
  // passing track + platform 2 at the main station (south of the main line)
  w.add('m', G.box(), 0xb8a48a, 18, 0, 131, 0, 0, 0, 72, 0.12, 4);
  for (let x = -16; x <= 52; x += 1.6) w.add('m', G.box(), 0x5b3a21, x, 0.1, 131, 0, 0, 0, 0.35, 0.1, 3.2);
  w.add('x', G.box(), 0x64748b, 18, 0.2, 130.25, 0, 0, 0, 72, 0.14, 0.12);
  w.add('x', G.box(), 0x64748b, 18, 0.2, 131.75, 0, 0, 0, 72, 0.14, 0.12);
  w.add('x', G.box(), 0x64748b, -10, 0.18, 128.5, 0, 0.55, 0, 0.12, 0.1, 6);
  w.add('x', G.box(), 0x64748b, 46, 0.18, 128.5, 0, -0.55, 0, 0.12, 0.1, 6);

  const platform = (cx, z0, L, D, label, sub, ry = 0) => {
    const T = w.tf(cx, 0, z0 + D / 2, ry);
    // axis-aligned helper (our four platforms sit on axis-aligned sides)
    w.add('m', G.box(), 0xcbd5e1, cx, 0, (z0 + z0 + D) / 2, 0, 0, 0, L, 0.16, D);
    w.add('l', G.box(), 0xfacc15, cx, 0.17, z0 + D - 0.12, 0, 0, 0, L, 0.03, 0.1, 0.2);
    w.solid(cx - L / 2, 0, z0, cx + L / 2, 0.16, z0 + D);
    for (let i = -2; i <= 2; i++) { K.lamp(w, cx + i * (L / 5.5), z0 + 0.7); if (Math.abs(i) < 2) K.bench(w, cx + i * (L / 6), z0 + D * 0.4, 0); }
    { const S = w.tf(cx, 0, z0 + 0.35, 0); K.sign(w, S, label, 0, 2.5, 0.05, Math.min(L * 0.7, 8.5), 0.7, '#7f1d1d', '#fff7e0'); if (sub) K.sign(w, S, sub, 0, 1.85, 0.05, Math.min(L * 0.6, 7), 0.4, '#14532d', '#fef3c7'); S.box('m', 0x1f2937, -2.8, 0, 0, 0.14, 2.2, 0.14); S.box('m', 0x1f2937, 2.8, 0, 0, 0.14, 2.2, 0.14); }
  };
  // Platform 1 at the grand station (north of the south rails — inside the loop)
  platform(18, 120.6, 56, 4.6, 'PLATFORM 1  ·  POLAR EXPRESS', 'LOOP  ·  STATION  ·  ELF VILLAGE  ·  WORKSHOP  ·  EVENTS');
  platform(18, 132.6, 50, 3.6, 'PLATFORM 2  ·  SIDING', 'WAITING / CHARTER SLEIGHS');
  platform(118, 120.6, 28, 4.6, 'ELF VILLAGE', '🍄 VILLAGE IS NORTH OF HERE');
  // Workshop Side: north of the north rails (toward Santa’s Workshop)
  w.add('m', G.box(), 0xcbd5e1, -46, 0, -91.1, 0, 0, 0, 28, 0.16, 4.6);
  w.add('l', G.box(), 0xfacc15, -46, 0.17, -88.9, 0, 0, 0, 28, 0.03, 0.1, 0.2);
  w.solid(-60, 0, -93.4, -32, 0.16, -88.8);
  for (let i = -2; i <= 2; i++) { K.lamp(w, -46 + i * 5, -92.6); if (Math.abs(i) < 2) K.bench(w, -46 + i * 5, -91.2, PI); }
  { const S = w.tf(-46, 0, -93.1, PI); K.sign(w, S, 'WORKSHOP SIDE', 0, 2.5, 0.05, 8.5, 0.7, '#7f1d1d', '#fff7e0'); K.sign(w, S, '🧸 TO SANTA’S WORKSHOP', 0, 1.85, 0.05, 7, 0.4, '#14532d', '#fef3c7'); S.box('m', 0x1f2937, -2.8, 0, 0, 0.14, 2.2, 0.14); S.box('m', 0x1f2937, 2.8, 0, 0, 0.14, 2.2, 0.14); }
  // Events Center: west of the west rails (toward the Events Center)
  w.add('m', G.box(), 0xcbd5e1, -75.1, 0, 2, 0, 0, 0, 4.6, 0.16, 28);
  w.add('l', G.box(), 0xfacc15, -73.0, 0.17, 2, 0, 0, 0, 0.1, 0.03, 28, 0.2);
  w.solid(-77.4, 0, -12, -72.8, 0.16, 16);
  for (let i = -2; i <= 2; i++) { K.lamp(w, -76.6, 2 + i * 5); if (Math.abs(i) < 2) K.bench(w, -75.2, 2 + i * 5, -E_); }
  { const S = w.tf(-77.2, 0, 2, -E_); K.sign(w, S, 'EVENTS CENTER', 0, 2.5, 0.05, 8.5, 0.7, '#7f1d1d', '#fff7e0'); K.sign(w, S, '🎪 TO THE EVENTS CENTER', 0, 1.85, 0.05, 7, 0.4, '#14532d', '#fef3c7'); S.box('m', 0x1f2937, -2.8, 0, 0, 0.14, 2.2, 0.14); S.box('m', 0x1f2937, 2.8, 0, 0, 0.14, 2.2, 0.14); }

  // the rest of the loop (south rails already laid in map.js)
  railBed(w, xe, zs - r, xe, zn + r);
  railBed(w, xe - r, zn, xw + r, zn);
  railBed(w, xw, zn + r, xw, zs - r);
  railArc(w, xe - r, zs - r, r, 0, PI / 2);
  railArc(w, xe - r, zn + r, r, PI / 2, PI);
  railArc(w, xw + r, zn + r, r, PI, PI * 1.5);
  railArc(w, xw + r, zs - r, r, PI * 1.5, PI * 2);

  const path = (x0, z0, x1, z1) => w.add('m', G.box(), 0xdfe6ef, (x0 + x1) / 2, 0, (z0 + z1) / 2, 0, 0, 0, Math.abs(x1 - x0) || 4, 0.03, Math.abs(z1 - z0) || 4);
  path(104, 118, 130, 122); path(118, 80, 118, 121);
  path(-54, -106, -38, -93); // workshop door to the new platform
  path(-91, -8, -77, 10); // events door to the new platform
  for (let i = 0; i < 4; i++) K.crate(w, 2 + i * 1.2, 122.2, 0.7, i, 0.16);
  K.crate(w, 36, 122.0, 0.8, 0.4, 0.16); K.crate(w, 37.1, 122.3, 0.6, -0.2, 0.16);
  { const T = w.tf(4, 0, 121.2, 0); T.box('m', 0x1f2937, 0, 0, 0, 0.16, 3.2, 0.16); K.sign(w, T, 'NEXT:  POLAR EXPRESS  ·  ALL ABOARD', 0, 3.4, 0.05, 6.4, 0.5, '#111827', '#facc15'); }
}

// ---- train mesh
const MAT = new Map();
const mat = (c, em = 0) => { const k = c + ':' + em; let m = MAT.get(k); if (!m) { m = new THREE.MeshStandardMaterial({ color: c, emissive: em ? c : 0x000000, emissiveIntensity: em, roughness: 0.55, metalness: 0.15 }); MAT.set(k, m); } return m; };
const GEO = { box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 12), sph: new THREE.SphereGeometry(1, 10, 8), cone: new THREE.ConeGeometry(1, 1, 10) };
// box helper: bottom-centred, added to a group
function add(g, typ, col, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, em = 0) {
  const m = new THREE.Mesh(GEO[typ], mat(col, em)); m.position.set(x, typ === 'box' ? y + sy / 2 : y, z); m.scale.set(sx, typ === 'box' ? sy : sy, typ === 'box' ? sz : typ === 'cyl' || typ === 'cone' ? sz : sz); if (typ === 'cyl' || typ === 'cone') m.scale.set(sx, sy, sz);
  if (typ === 'box') { /* already bottom-centred via y+sy/2 */ } else { m.position.set(x, y, z); }
  if (rx || ry || rz) m.rotation.set(rx, ry, rz);
  g.add(m); return m;
}
function box(g, col, x, y, z, sx, sy, sz, em) { const m = new THREE.Mesh(GEO.box, mat(col, em)); m.position.set(x, y + sy / 2, z); m.scale.set(sx, sy, sz); g.add(m); return m; }
function cyl(g, col, x, y, z, r, h, rx = 0, ry = 0, rz = 0, em = 0) { const m = new THREE.Mesh(GEO.cyl, mat(col, em)); m.position.set(x, y, z); m.scale.set(r, h, r); m.rotation.set(rx, ry, rz); g.add(m); return m; }

function makeLoco() {
  const g = new THREE.Group(); const BUR = 0x7f1d1d, BLK = 0x1c1917, GLD = 0xf5c542, GRN = 0x14532d;
  // pilot / cowcatcher
  box(g, 0x111827, 0, 0.15, 3.5, 2.0, 0.25, 0.7); box(g, BUR, 0, 0.2, 3.85, 1.6, 0.5, 0.2);
  // running board + wheels
  box(g, BLK, 0, 0.05, 0.4, 2.3, 0.2, 6.2);
  for (const z of [-1.8, -0.4, 1.0, 2.3]) { cyl(g, 0x111827, -1.05, 0.38, z, 0.36, 0.18, 0, 0, E_); cyl(g, 0x111827, 1.05, 0.38, z, 0.36, 0.18, 0, 0, E_); }
  // boiler
  cyl(g, 0x292524, 0, 1.45, 1.15, 0.85, 3.6, E_, 0, 0);
  box(g, BLK, 0, 0.7, 1.15, 1.5, 0.9, 3.4);
  // stack + lamp + dome
  cyl(g, BLK, 0, 2.0, 2.5, 0.22, 1.1); cyl(g, 0x111827, 0, 3.05, 2.5, 0.32, 0.2);
  cyl(g, GLD, 0, 2.15, 1.0, 0.2, 0.35);
  const lamp = new THREE.Mesh(GEO.sph, mat(0xfff1a8, 1.4)); lamp.position.set(0, 1.55, 3.15); lamp.scale.set(0.18, 0.18, 0.18); g.add(lamp);
  box(g, 0x111827, 0, 1.3, 2.95, 0.4, 0.4, 0.2);
  // cab
  box(g, BUR, 0, 0.7, -1.85, 2.2, 2.15, 2.1);
  box(g, 0x111827, 0, 2.85, -1.85, 2.3, 0.16, 2.2);
  box(g, GRN, 0, 3.0, -1.85, 2.0, 0.12, 1.9);
  for (const s of [-1, 1]) { box(g, 0x7dd3fc, s * 1.12, 1.7, -1.55, 0.06, 0.7, 0.7, 0.5); box(g, 0x7dd3fc, s * 1.12, 1.7, -2.2, 0.06, 0.7, 0.55, 0.5); }
  box(g, 0x7dd3fc, 0, 1.85, -0.82, 1.2, 0.55, 0.06, 0.5);
  // gold stripe + name plate
  box(g, GLD, 0, 1.15, 1.2, 1.52, 0.08, 3.5);
  box(g, GLD, 0, 1.55, -1.85, 2.22, 0.08, 2.12);
  g.userData.len = 7.2; return g;
}
function makeTender() {
  const g = new THREE.Group();
  box(g, 0x1c1917, 0, 0.15, 0, 2.15, 1.7, 3.2);
  box(g, 0x111827, 0, 1.85, 0, 2.2, 0.12, 3.3);
  box(g, 0xf5c542, 0, 0.9, 0, 2.16, 0.08, 3.22);
  box(g, 0x292524, 0, 1.85, 0, 1.6, 0.7, 2.4); // coal pile
  for (const z of [-1.0, 1.0]) { cyl(g, 0x111827, -1.0, 0.32, z, 0.3, 0.16, 0, 0, E_); cyl(g, 0x111827, 1.0, 0.32, z, 0.3, 0.16, 0, 0, E_); }
  g.userData.len = 3.6; return g;
}
function makeCoach(col = 0x7f1d1d) {
  const g = new THREE.Group(); const GLD = 0xf5c542;
  box(g, col, 0, 0.45, 0, 2.3, 2.15, 5.6);
  box(g, 0x1c1917, 0, 2.6, 0, 2.4, 0.14, 5.75);
  box(g, 0x14532d, 0, 2.74, 0, 2.15, 0.1, 5.5);
  box(g, GLD, 0, 1.05, 0, 2.32, 0.08, 5.62);
  // windows both sides
  for (const s of [-1, 1]) for (let i = -2; i <= 2; i++) box(g, 0xfde68a, s * 1.16, 1.45, i * 0.95, 0.05, 0.7, 0.7, 0.55);
  // end doors
  box(g, 0x3b1414, 0, 0.55, 2.82, 0.8, 1.7, 0.06); box(g, 0x3b1414, 0, 0.55, -2.82, 0.8, 1.7, 0.06);
  // vestibule platforms
  box(g, 0x1c1917, 0, 0.35, 3.05, 1.6, 0.12, 0.45); box(g, 0x1c1917, 0, 0.35, -3.05, 1.6, 0.12, 0.45);
  for (const z of [-1.8, 0, 1.8]) { cyl(g, 0x111827, -1.05, 0.32, z, 0.3, 0.16, 0, 0, E_); cyl(g, 0x111827, 1.05, 0.32, z, 0.3, 0.16, 0, 0, E_); }
  // a couple of visible seats (so the car feels furnished through the windows)
  for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) box(g, 0x14532d, s * 0.55, 0.55, i * 1.3, 0.55, 0.45, 0.5);
  g.userData.len = 6.4; return g;
}

function layoutTrain() {
  const root = new THREE.Group();
  const parts = [makeLoco(), makeTender(), makeCoach(0x7f1d1d), makeCoach(0x9f1239), makeCoach(0x7f1d1d)];
  // pack along local +z (forward = loco). rear of consist at negative z.
  const lens = parts.map((p) => p.userData.len);
  const gap = 0.25; let total = lens.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
  let z = total / 2;
  const cars = [];
  parts.forEach((p, i) => { z -= lens[i] / 2; p.position.z = z; root.add(p); cars.push({ g: p, localZ: z, len: lens[i], kind: i === 0 ? 'loco' : i === 1 ? 'tender' : 'coach' }); z -= lens[i] / 2 + gap; });
  root.userData.len = total;
  return { root, cars, len: total };
}

export const Express = {
  expressInit() {
    const w = this.world;
    const built = layoutTrain();
    const st = PE_STOPS[0], pose0 = pePose(st.s);
    this.pe = {
      root: built.root, cars: built.cars, len: built.len,
      x: pose0.x, z: pose0.z, yaw: pose0.yaw, s: st.s, dir: 1,
      v: 0, phase: 'stop', si: 0, dwell: DWELL_ST, _px: pose0.x, _pz: pose0.z, steam: 0,
      solids: [], ride: false,
    };
    built.root.position.set(0, 0, 0); built.root.rotation.set(0, 0, 0);
    this._pePlaceCars();
    E.scene.add(built.root);
    // dynamic solids (one per car) so the train is a real obstacle
    this.pe.cars.forEach((c) => {
      const s = { min: [0, 0, 0], max: [0, 0, 0], dyn: true, dx: 0, dy: 0, dz: 0, off: false, region: 'out' };
      w.dyn.push(s); this.pe.solids.push(s);
    });
    this._pePlaceSolids();
    // staff / passengers that travel with the train (solid NPCs; positions updated each tick)
    const cond = this.addNpc({ kind: 'elf', rig: makeFolk('christmas', 1), x: this.pe.x, z: PE_Z + 2.2, yaw: 0, r: 0.42, h: 1.5, zone: 'out', still: true, peCrew: true, name: 'Conductor Elf Gower', lines: ['Tickets, please! This is the Polar Express. We run a loop around the North Pole: Station, Elf Village, Workshop Side, then the Events Center.', 'Next stop is announced as we pull in. Hold tight, and there’s cocoa in the second car!', 'When we stop, hop off on the platform side. All aboard!'] });
    const p1 = this.addNpc({ kind: 'elf', rig: makeFolk('christmas', 4), x: this.pe.x, z: PE_Z + 2.2, yaw: 0, r: 0.4, h: 1.45, zone: 'out', still: true, peCrew: true, name: 'Passenger Elf Coco', lines: ['I ride this every morning with a mug of cocoa. Best view of the village!'] });
    const p2 = this.addNpc({ kind: 'elf', rig: makeFolk('christmas', 6), x: this.pe.x, z: PE_Z + 2.2, yaw: 0, r: 0.4, h: 1.45, zone: 'out', still: true, peCrew: true, name: 'Passenger Elf Belle', lines: ['We go all the way around: Elf Village, the Workshop, the Events Center, then back to the station!'] });
    this.pe.crew = [cond, p1, p2];
    // board acts at each stop (labels updated while the train is away)
    PE_STOPS.forEach((s) => this.acts.push({ x: s.wait[0], z: s.wait[1], r: s.id === 'station' ? 10 : 7, label: '🚂 Board the Polar Express', kind: 'peboard', stop: s.id, zone: 'out' }));
    this._peSeatCar = 3; // second coach
  },

  _pePlaceCars() {
    const pe = this.pe; if (!pe) return;
    pe.cars.forEach((c) => { const p = pePose(pe.s + c.localZ); c.g.position.set(p.x, 0, p.z); c.g.rotation.set(0, p.yaw, 0); c._p = p; });
    const mid = pePose(pe.s); pe.x = mid.x; pe.z = mid.z; pe.yaw = mid.yaw;
  },
  _pePlaceSolids() {
    const pe = this.pe; if (!pe) return;
    pe.cars.forEach((c, i) => {
      const p = c._p || pePose(pe.s + c.localZ), s = pe.solids[i], sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
      const hx = Math.abs(sy) * (c.len / 2) + Math.abs(cy) * 1.25;
      const hz = Math.abs(cy) * (c.len / 2) + Math.abs(sy) * 1.25;
      s.min[0] = p.x - hx; s.min[1] = 0; s.min[2] = p.z - hz;
      s.max[0] = p.x + hx; s.max[1] = 2.8; s.max[2] = p.z + hz;
      s.dx = p.x - (c._lx || p.x); s.dy = 0; s.dz = p.z - (c._lz || p.z); s.off = !!pe.ride; s.dyn = true;
      c._lx = p.x; c._lz = p.z;
    });
  },

  _peSeat() {
    const pe = this.pe, c = pe.cars[this._peSeatCar] || pe.cars[3], p = c._p || pePose(pe.s + c.localZ);
    const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw), lx = 0.55;
    return { x: p.x + cy * lx, y: 1.15, z: p.z - sy * lx, yaw: p.yaw };
  },

  _peCrewPlace() {
    const pe = this.pe; if (!pe || !pe.crew) return;
    const slots = [
      { car: 2, side: 1.25, along: 3.05 },
      { car: 3, side: 1.25, along: -3.05 },
      { car: 4, side: 1.25, along: 3.05 },
    ];
    pe.crew.forEach((n, i) => {
      const sl = slots[i], c = pe.cars[sl.car]; if (!n || !c) return;
      const p = pePose(pe.s + c.localZ + sl.along), sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
      n.x = p.x + cy * sl.side; n.z = p.z - sy * sl.side; n.y = 0.55; n.yaw = p.yaw + (sl.along < 0 ? PI : 0);
      n.root.position.set(n.x, n.y, n.z); n.root.rotation.y = n.yaw;
      n.root.visible = this.zone === 'out' && !n.hidden;
    });
  },

  peEta(stopId) {
    const pe = this.pe, dest = PE_STOPS.find((s) => s.id === stopId) || PE_STOPS[pe.si];
    if (pe.phase === 'stop' && PE_STOPS[pe.si].id === dest.id) return 0;
    let dist = (dest.s - pe.s + PE_LEN) % PE_LEN, t = dist / CRUISE + 2;
    // add dwells for stops we'll pass first
    let i = pe.si;
    if (pe.phase === 'stop') t += Math.max(0, pe.dwell);
    for (let k = 0; k < PE_STOPS.length; k++) {
      i = (i + 1) % PE_STOPS.length; if (PE_STOPS[i].id === dest.id) break;
      t += PE_STOPS[i].id === 'station' ? DWELL_ST : DWELL;
    }
    return t;
  },

  expressUpdate(dt) {
    const pe = this.pe; if (!pe) return;
    if (pe.phase === 'stop') {
      pe.dwell -= dt; pe.v = 0;
      if (pe.dwell <= 0) {
        pe.si = (pe.si + 1) % PE_STOPS.length;
        pe.phase = 'go';
        if (this.zone === 'out' && Math.hypot(this.me.x - pe.x, this.me.z - pe.z) < 42) this.toastMsg('🚂 All aboard! The Polar Express is departing.');
      }
    } else {
      const target = PE_STOPS[pe.si];
      let dist = (target.s - pe.s + PE_LEN) % PE_LEN;
      const vmax = dist < 22 ? Math.max(1.2, Math.sqrt(Math.max(0, 2 * ACC * dist))) : CRUISE;
      const aim = Math.min(CRUISE, vmax);
      if (pe.v < aim) pe.v = Math.min(aim, pe.v + ACC * dt);
      else pe.v = Math.max(aim, pe.v - ACC * dt);
      pe.s = (pe.s + pe.v * dt + PE_LEN) % PE_LEN;
      dist = (target.s - pe.s + PE_LEN) % PE_LEN;
      if (dist < 0.7 && pe.v < 1.6) {
        pe.s = target.s; pe.v = 0; pe.phase = 'stop';
        pe.dwell = target.id === 'station' ? DWELL_ST : DWELL;
        if (this.peRide) this.toastMsg('🚂 ' + target.name + '. Tap to hop off, or stay on for the next stop.');
        else if (this.peWaitStop && this.peWaitStop === target.id) { this.peWaitStop = null; this.peBoard(target.id); }
        else if (this.zone === 'out' && Math.hypot(this.me.x - pe.x, this.me.z - pe.z) < 50) this.toastMsg('🚂 The Polar Express is at ' + target.name + '.');
        sfx('honk');
      }
    }
    this._pePlaceCars();
    pe.root.visible = this.zone === 'out';
    this._pePlaceSolids();
    this._peCrewPlace();
    if (Math.abs(pe.v) > 0.4) { pe.steam = (pe.steam || 0) - dt; if (pe.steam <= 0 && this.fx && this.zone === 'out') { pe.steam = 0.35; const loco = pe.cars[0], p = loco._p || pePose(pe.s + loco.localZ); this.fx.puff(p.x + Math.sin(p.yaw) * 2.5, 3.4, p.z + Math.cos(p.yaw) * 2.5, 4); } }
    for (const a of this.acts) if (a.kind === 'peboard') {
      const at = pe.phase === 'stop' && PE_STOPS[pe.si].id === a.stop;
      a.label = pe.ride ? (at ? '🚂 Hop off the Polar Express' : '🚂 Riding — next stop soon') : at ? '🚂 Board the Polar Express' : '🚂 Wait for the Polar Express';
    }
    if (pe.ride && this.peRide) { const s = this._peSeat(); this.me.place([s.x, s.y, s.z], s.yaw); this.me.vx = this.me.vz = this.me.vy = 0; this.me.onGround = true; if (this.me.root) this.me.root.visible = false; if (this.me.blob) this.me.blob.visible = false; }
  },

  peAct(a) {
    if (a.kind === 'peboard') { this.peBoard(a.stop); return true; }
    if (a.kind === 'peticket' || a.kind === 'peout') { this.peFromHall(a.kind === 'peticket'); return true; }
    return false;
  },

  peFromHall(ticket) {
    const pe = this.pe, at = pe && pe.phase === 'stop' && PE_STOPS[pe.si].id === 'station';
    if (ticket) return this.pePanel('station');
    // walk out to the platforms
    sfx('door');
    this.fade(() => {
      if (this.zone === 'int') this.leaveInt(true);
      this.loadFar('out'); this.zone = 'out'; this.showZone('out');
      const st = PE_STOPS[0]; this.me.place([st.wait[0], 0.2, st.wait[1]], st.yaw); this.cam.yaw = st.yaw; this.doorCd = 1.2;
      this.toastMsg(at ? '🚂 The Polar Express is at the platform. All aboard!' : '🚂 Platform 1. The Polar Express will be along shortly.');
    });
  },

  pePanel(stopId) {
    const pe = this.pe, stop = PE_STOPS.find((s) => s.id === stopId) || PE_STOPS[1];
    const at = pe.phase === 'stop' && PE_STOPS[pe.si].id === stop.id;
    const eta = Math.ceil(this.peEta(stop.id));
    const rows = PE_STOPS.map((s) => {
      const here = pe.phase === 'stop' && PE_STOPS[pe.si].id === s.id;
      return `<p style="margin:4px 0;font-weight:700">${here ? '🔴 Now' : '·'} ${s.name}${here ? '  —  boarding' : ''}</p>`;
    }).join('');
    this.app.busy = true;
    panel(`<h2>🚂 POLAR EXPRESS</h2><p class="sub">The loop around the North Pole: Station, Elf Village, Workshop Side, Events Center, and back to the station.</p>
      <div style="text-align:left">${rows}</div>
      <p style="margin:10px 0 6px;font-weight:700">${at ? 'The train is at ' + stop.name + ' right now.' : ('Next arrival at ' + stop.name + ' in about ' + eta + ' second' + (eta === 1 ? '' : 's') + '.')}</p>
      <button class="go" id="pB">${at ? '🚂 All aboard!' : '⏳ Wait and board when it arrives'}</button>
      <button class="mbtn2" id="pP">🚪 Go out to the platform</button>
      <button class="mbtn2" id="pX">✖ Stay here</button>`, (c) => {
      c.querySelector('#pB').onclick = () => { sfx('click'); closePanel(); this.app.busy = false; this.peBoard(stop.id, true); };
      c.querySelector('#pP').onclick = () => { sfx('click'); closePanel(); this.app.busy = false; this.peFromHall(false); };
      c.querySelector('#pX').onclick = () => { sfx('click'); this.done(); };
    });
  },

  peBoard(stopId, wait) {
    const pe = this.pe; if (!pe) return;
    if (pe.ride && this.peRide) { if (pe.phase === 'stop') this.peAlight(); else this.toastMsg('🚂 Wait until the next stop to hop off.'); return; }
    const at = pe.phase === 'stop' && PE_STOPS[pe.si].id === stopId;
    const go = () => {
      if (this.zone === 'int') this.leaveInt(true);
      this.loadFar('out'); this.zone = 'out'; this.showZone('out');
      pe.ride = true; this.peRide = true;
      const s = this._peSeat(); this.me.place([s.x, s.y, s.z], s.yaw); if (this.me.root) this.me.root.visible = false; if (this.me.blob) this.me.blob.visible = false; this.cam.yaw = pe.yaw; this.cam.pitch = 0.18; this.doorCd = 0.8;
      sfx('honk'); this.toastMsg('🚂 All aboard! Look around as we ride. Hop off when we stop. Cocoa’s on the conductor.');
      if (!this._peCocoa) { this._peCocoa = true; setTimeout(() => { if (this.peRide) this.toastMsg('☕ Conductor Gower hands you a mug of hot cocoa.'); }, 2200); }
    };
    if (at) { sfx('door'); this.fade(go); return; }
    if (!wait) { this.pePanel(stopId); return; }
    // wait on the platform; expressUpdate boards you when the train pulls in
    sfx('click');
    const stop = PE_STOPS.find((s) => s.id === stopId) || PE_STOPS[1];
    this.fade(() => {
      if (this.zone === 'int') this.leaveInt(true);
      this.loadFar('out'); this.zone = 'out'; this.showZone('out');
      this.me.place([stop.wait[0], 0.2, stop.wait[1]], stop.yaw); this.cam.yaw = stop.yaw; this.doorCd = 1;
      this.peWaitStop = stopId;
      this.toastMsg('🚂 Waiting on the platform. The Polar Express will be here soon.');
    });
  },

  peAlight() {
    const pe = this.pe; if (!pe || pe.phase !== 'stop') { this.toastMsg('🚂 Wait until the next stop to hop off.'); return; }
    const stop = PE_STOPS[pe.si];
    pe.ride = false; this.peRide = false;
    sfx('door');
    this.fade(() => {
      if (this.me.root) this.me.root.visible = true; if (this.me.blob) this.me.blob.visible = true;
      this.me.place([stop.wait[0], 0.2, stop.wait[1]], stop.yaw + PI); this.cam.yaw = stop.yaw + PI; this.cam.pitch = 0.36; this.doorCd = 1;
      this.toastMsg('🚂 You hop off at ' + stop.name + '.');
    });
  },
};
