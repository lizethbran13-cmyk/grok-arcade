// Pi-rat the Pirate Pack: the hub ship "The Salty Cheddar" (a real sailable ship on the Squeaky Sea).
// The ship stays at the origin and the whole sea (islands, buoys, rocks) moves around it, so you can walk the deck while she sails.
import * as THREE from 'three';
import { BUILD } from './levels.js';
import { World, rbox } from './world.js';
import { rcyl, lathe, sph, cyl, cone, torus, capsule, tube, leaf, wedge, star, gear, blobGeo } from './shapes.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { PI, C, rnd, pseed, outdoor, landPoly, blobPoly, palm, bush, barrel, torch, crates, treasurePile, crystal, flag, cannonModel, captainNPC, parrotNPC, rockWall, camZone, ceiling, shell, starfish, coral, PR } from './pkit.js';
import { ISLES, P, mapPieces, isleOpen, ownsPirate, CAPTAIN } from './pirate.js';
import { PUI } from './pui.js';
import { sfx } from './audio.js';
import { persist } from './save.js';
import { inView } from './perf.js';
import './pisles.js';
const DECK = [[-7, 22], [7, 22], [7.6, 10], [7.6, -6], [7, -12], [5.5, -18], [3.2, -23], [0, -26.5], [-3.2, -23], [-5.5, -18], [-7, -12], [-7.6, -6], [-7.6, 10]];
const QD = 5.1; // quarterdeck height
function inset(pts, d) { let A = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; A += p[0] * q[1] - q[0] * p[1]; } if (A < 0) d = -d; const n = pts.length, out = []; for (let i = 0; i < n; i++) { const a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n];
  const n1 = norm2(b[1] - a[1], -(b[0] - a[0])), n2 = norm2(c[1] - b[1], -(c[0] - b[0])); const nx = n1[0] + n2[0], nz = n1[1] + n2[1], L = Math.hypot(nx, nz) || 1; out.push([b[0] - nx / L * d, b[1] - nz / L * d]); } return out; }
const norm2 = (x, z) => { const L = Math.hypot(x, z) || 1; return [x / L, z / L]; };
// shoelace sign: make sure our outline winds the way inset() expects
function hull(w) {
  const shape = new THREE.Shape(DECK.map(([x, z]) => new THREE.Vector2(x, -z)));
  let g = new THREE.ExtrudeGeometry(shape, { depth: 6.6, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 3, curveSegments: 6 }); g.rotateX(-PI / 2); g.translate(0, -7.15, 0);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), t = Math.max(0, Math.min(1, -y / 7)), k = Math.pow(t, 1.6); p.setX(i, p.getX(i) * (1 - 0.45 * k)); p.setZ(i, -2 + (p.getZ(i) + 2) * (1 - 0.1 * k)); }
  g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g, 0.02); g.computeVertexNormals();
  w.addFn('m', g, (c, x, y) => { if (y > -0.75) c.set(0x5b3a1f); else if (y > -1.15) c.set(0xffc83d); else if (y > -2.2) c.set(Math.floor(y * 1.6) % 2 ? 0x7c4a22 : 0x8b5a2b); else if (y > -2.75) c.set(0xf5f0e1); else c.set(0x7f1d1d); }, 0, 0, 0);
  // gunwale ring (hollow wall around the deck)
  const ring = new THREE.Shape(DECK.map(([x, z]) => new THREE.Vector2(x, -z))); ring.holes.push(new THREE.Path(inset(DECK, 0.55).map(([x, z]) => new THREE.Vector2(x, -z))));
  const rg = new THREE.ExtrudeGeometry(ring, { depth: 1.35, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 2, curveSegments: 6 }); rg.rotateX(-PI / 2);
  w.addFn('m', rg, (c, x, y) => c.set(y > 1.3 ? 0xc08552 : y > 0.9 ? 0x6b4423 : 0x7c4a22), 0, 0, 0);
  // floor collider (scanline) + rail colliders along the outline
  for (let z = -27; z < 22; z += 1) { const zc = z + 0.5, xs = []; for (let i = 0, j = DECK.length - 1; i < DECK.length; j = i++) { const [xi, zi] = DECK[i], [xj, zj] = DECK[j]; if ((zi > zc) !== (zj > zc)) xs.push((xj - xi) * (zc - zi) / (zj - zi) + xi); } xs.sort((a, b) => a - b); if (xs.length >= 2) w.solid(xs[0], -1, z, xs[xs.length - 1], 0, z + 1, { floor: true }); }
  const IN = inset(DECK, 0.3); for (let i = 0; i < IN.length; i++) { const a = IN[i], b = IN[(i + 1) % IN.length]; if (a[1] > 21 && b[1] > 21) continue; const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / 0.7);
    for (let k = 0; k <= n; k++) { const x = a[0] + (b[0] - a[0]) * k / n, z = a[1] + (b[1] - a[1]) * k / n; w.solid(x - 0.35, 0, z - 0.35, x + 0.35, 1.45, z + 0.35, { cam: false }); } }
  // planks
  const cols = [0xc98d55, 0xbd8048, 0xd39a62, 0xb7773f]; PR.floorPlanks(w, -7.3, -12, 7.3, 12.2, 0.02, cols); PR.floorPlanks(w, -6.2, -18, 6.2, -12, 0.02, cols); PR.floorPlanks(w, -4.2, -22.5, 4.2, -18, 0.02, cols); PR.floorPlanks(w, -2.2, -25, 2.2, -22.5, 0.02, cols);
}
function sail(w, x, y, z, wid, h, col = 0xfff7e6, emblem) { const R = wid * 0.85, th = 2 * Math.asin(Math.min(0.99, wid / 2 / R)); const g = new THREE.CylinderGeometry(R, R, h, 20, 4, true, -th / 2, th);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const yy = p.getY(i); const k = 1 - Math.pow(yy / (h / 2), 2) * 0.35; p.setX(i, p.getX(i) * (0.92 + 0.08 * k)); p.setZ(i, (p.getZ(i) - R * Math.cos(th / 2)) * k); } g.computeVertexNormals();
  w.addFn('s', g, (c, px, py) => c.set(Math.abs(py - (y + h * 0.25)) < h * 0.08 ? 0xdc2626 : col), x, y, z, 0, PI, 0);
  w.add('m', cyl(10), C.woodD, x, y + h / 2 + 0.2, z, 0, 0, PI / 2, 0.22, wid + 2, 0.22); w.add('m', cyl(10), C.woodD, x, y - h / 2 - 0.2, z - 0.3, 0, 0, PI / 2, 0.18, wid + 1, 0.18);
  if (emblem) { const zz = z - wid * 0.17 - 0.12; w.add('g', sph(16), 0xffffff, x, y + 0.5, zz, 0, 0, 0, 1.0, 1.05, 0.12); [-1, 1].forEach((s) => w.add('g', sph(10), 0x111827, x + s * 0.38, y + 0.6, zz - 0.1, 0, 0, 0, 0.22, 0.26, 0.05)); w.add('g', wedge(), 0xffd23f, x - 0.35, y - 0.4, zz - 0.12, 0, 0, 0, 0.7);
    [-1, 1].forEach((s) => { w.add('g', capsule(10), 0xffffff, x, y - 1.2, zz, 0, 0, s * 0.8, 0.22, 2.4, 0.12); }); } }
BUILD.pship = (w) => {
  w.pirate = true; w.forceRat = 'pirat'; w.gadgets = ['blaster', 'glider', 'grapple']; w.music = 'ship'; w.camDist = 7.2;
  const SEA_Y = -2.5; const sea = outdoor(w, { fogD: 0.0017, fog: 0xc6e9ff, skyTop: 0x2a86f5, skyMid: 0xa8e0ff }, { y: SEA_Y, size: 2600, amp: 0.9 });
  w.start = [0, 0.1, 6]; w.startYaw = PI; w.cp(-3.5, 0, -9, PI);
  hull(w);
  // ---- stern castle: cabin below, quarterdeck on top
  const wallC = 0x8b5a2b, trim = 0xffc83d;
  [-1, 1].forEach((s) => { w.slab('m', wallC, s * 6.85, 0, 17, 0.5, QD, 10.2, 0.12); for (let k = 0; k < 2; k++) { const pz = 15 + k * 4; w.add('x', torus(0.12, 24), trim, s * 6.55, 2.6, pz, 0, PI / 2, 0, 0.6); w.add('l', rcyl(0.55, 0.1, 0.04, 20), 0xbfe9ff, s * 6.58, 2.6, pz, 0, 0, PI / 2, 1, 1, 1, 0.25); } });
  w.slab('m', wallC, 0, 0, 22.15, 14, QD, 0.5, 0.12); for (let i = -2; i <= 2; i++) { w.add('l', rbox(1.4, 1.6, 0.1, 0.1), 0xffd36b, i * 2.6, 2.2, 22.45, 0, 0, 0, 1, 1, 1, 0.6); w.add('m', rbox(1.6, 0.18, 0.2, 0.05), trim, i * 2.6, 3.05, 22.45); }
  // front wall with a door opening
  w.slab('m', wallC, -4.4, 0, 12.15, 5.2, QD, 0.5, 0.12); w.slab('m', wallC, 4.4, 0, 12.15, 5.2, QD, 0.5, 0.12); w.slab('m', wallC, 0, 3.6, 12.15, 3.6, QD - 3.6, 0.5, 0.12);
  w.add('x', torus(0.12, 32, PI), trim, 0, 3.4, 11.85, 0, 0, 0, 1.75, 0.6, 1); w.add('m', rbox(3.8, 0.3, 0.7, 0.1), C.woodL, 0, 3.5, 11.9);
  ceiling(w, -6.6, 12.4, 6.6, 21.9, QD - 0.5, 0.5, 0x6b4423); w.solid(-7.2, QD - 0.5, 12.1, 7.2, QD, 22.4, { floor: true }); PR.floorPlanks(w, -6.9, 12.1, 6.9, 22.3, QD + 0.02, [0xc98d55, 0xbd8048, 0xd39a62]);
  camZone(w, -6.6, 12.4, 6.6, 21.9, -1, QD - 0.6, 4.3, 0.5);
  // quarterdeck rails (gaps at the stair tops)
  const rail = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(x1 - x0, z1 - z0); w.add('m', rbox(0.22, 0.22, L, 0.08), C.woodL, (x0 + x1) / 2, QD + 1.2, (z0 + z1) / 2, 0, a, 0); for (let t = 0; t <= L; t += 1.2) { const x = x0 + (x1 - x0) * t / L, z = z0 + (z1 - z0) * t / L; w.add('m', lathe([[0, 0], [0.12, 0], [0.16, 0.4], [0.1, 0.8], [0.12, 1.1], [0, 1.15]], 12, 'balu'), 0xd39a62, x, QD, z); } w.solid(Math.min(x0, x1) - 0.15, QD, Math.min(z0, z1) - 0.15, Math.max(x0, x1) + 0.15, QD + 1.3, Math.max(z0, z1) + 0.15, { cam: false }); };
  rail(-3.7, 12.2, 3.7, 12.2); rail(-7, 13.6, -7, 22); rail(7, 13.6, 7, 22); rail(-7, 22.1, 7, 22.1);
  // stairs up both sides
  [-1, 1].forEach((s) => { const x = s * 5.6; for (let i = 0; i < 12; i++) { const y = (i + 1) * QD / 12, z = 12.1 - (12 - i) * 0.75 + 0.375; w.slab('m', i % 2 ? 0xbd8048 : 0xc98d55, x, 0, z, 2.6, y, 0.75, 0.06); } w.add('m', rbox(0.2, 0.2, 9.4, 0.06), C.woodL, x - s * 1.35, 3.0, 7.6, -0.5, 0, 0); });
  // ---- masts + sails + rigging
  const mast = (z, y0, h, r) => { w.add('m', cyl(18, 0.75), 0x7c4a22, 0, y0, z, 0, 0, 0, r, h, r); w.solid(-r, y0, z - r, r, y0 + h, z + r); for (let k = 1; k < h / 6; k++) w.add('x', torus(0.15, 20), 0x4b4b52, 0, y0 + k * 6, z, PI / 2, 0, 0, r * 1.05, r * 1.05, 1); };
  mast(-2, 0, 36, 0.75); mast(-16, 0, 27, 0.55); mast(19.5, QD, 17, 0.42);
  sail(w, 0, 10, -2.1, 13, 8.5, 0xfff7e6, true); sail(w, 0, 21, -2.1, 10, 6.5); sail(w, 0, 9.5, -16.1, 10, 7); sail(w, 0, 18.5, -16.1, 8, 5); sail(w, 0, QD + 8, 19.4, 7, 5.5);
  w.add('s', wedge(), 0xfff7e6, 0, 3.4, -25, 0, -PI / 2, 0, 0.1, 9, 10); w.add('m', cyl(10), C.woodD, 0, 1.4, -24.5, PI / 2 - 0.25, 0, 0, 0.28, 9, 0.28); // jib + bowsprit
  [-1, 1].forEach((s) => { for (let k = 0; k < 5; k++) w.add('m', tube([[s * 7.2, 1.4, -6 + k * 1.2], [s * 1.0, 15, -2.6 + k * 0.15]], 0.04, 6, 4), C.rope, 0, 0, 0); });
  w.add('m', tube([[0, 36, -2], [0, 20, -14], [0, 27, -16], [0, 3, -25]], 0.05, 30, 4), C.rope, 0, 0, 0);
  flag(w, 0, 36, -2, 3, 0x111827, PI / 2);
  // crow's nest
  w.add('m', rcyl(2.7, 0.4, 0.1, 28), 0x7c4a22, 0, 14.6, -2); w.solid(-2.6, 14.6, -4.6, 2.6, 15, 0.6); w.add('m', lathe([[2.5, 0], [2.7, 0], [2.75, 1.2], [2.55, 1.2]], 28, 'nest'), 0x8b5a2b, 0, 15, -2); for (let i = 0; i < 3; i++) w.add('x', torus(0.08, 32), 0x4b4b52, 0, 15.2 + i * 0.45, -2, PI / 2, 0, 0, 2.74, 2.74, 1);
  w.hook(3.2, 6.6, 0.8); w.hook(-3.4, 11.4, -3.6); w.hook(3.4, 16.4, -3.2);
  (w.kiosks = w.kiosks || []).push({ id: 'spy', x: 0, y: 15, z: -2, r: 3, label: '🔭 Look through the spyglass', fn: (app, g) => { const n = ISLES.find((i) => !P().done[i.id] && isleOpen(i) && (!i.final || mapPieces() >= 4)) || ISLES[ISLES.length - 1]; const s = P().sea; const dx = n.sea[0] - s.x, dz = n.sea[1] - s.z; const d = Math.hypot(dx, dz);
    const rel = Math.atan2(-dx, -dz) - s.h; let r = rel; while (r > PI) r -= PI * 2; while (r < -PI) r += PI * 2; const dir = Math.abs(r) < 0.4 ? 'straight ahead' : Math.abs(r) > 2.6 ? 'behind us' : r > 0 ? 'off the left side' : 'off the right side'; sfx('check'); g.toastMsg(`🔭 Land ho! ${n.icon} ${n.n} is ${Math.round(d)} paces ${dir}`); } });
  // ---- wheel, chart, captain, Grumbles
  { const T = w.tf(0, QD, 14.2, 0); T.box('m', 0x7c4a22, 0, 0, 0, 1, 1.6, 1, 0.15); T.add('x', rcyl(0.25, 0.4, 0.05, 16), trim, 0, 1.6, 0.0, PI / 2, 0, 0); T.solid(-0.6, 0, -0.6, 0.6, 1.7, 0.6);
    const wheel = w.dynObj((W) => { W.add('m', torus(0.09, 40), 0x8b5a2b, 0, 0, 0, 0, 0, 0, 1.25); W.add('m', torus(0.07, 32), 0x8b5a2b, 0, 0, 0, 0, 0, 0, 0.45); for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; W.add('m', cyl(8), 0x9a6a3e, 0, 0, 0, 0, 0, a, 0.06, 1.65, 0.06); W.add('m', lathe([[0, 0], [0.09, 0], [0.11, 0.25], [0.07, 0.45], [0, 0.5]], 10, 'spoke'), 0xc08552, Math.sin(a) * -1.6, Math.cos(a) * 1.6, 0, 0, 0, a); } W.add('x', sph(12), trim, 0, 0, 0, 0, 0, 0, 0.18, 0.18, 0.3); });
    wheel.position.set(0, QD + 2.05, 13.65); w.wheel = wheel; }
  w.kiosks.push({ id: 'wheel', x: 0, y: QD, z: 13.2, r: 2.4, label: (g) => w.steer.on ? '🚶 Let go of the wheel' : '⛵ Take the wheel', fn: (app, g) => { const st = w.steer; st.on = !st.on; w.ship.auto = null; if (st.on) { g.me.place([0, QD + 0.05, 12.7], PI); g.toastMsg('⛵ Stick UP = full sail, left/right = steer. JUMP lets go.'); sfx('door'); } } });
  { const T = w.tf(-4.4, QD, 18.4, 0.2); T.box('m', 0x6b4423, 0, 0, 0, 2.6, 1.5, 1.8, 0.12); T.box('m', 0xf5deb3, 0, 1.5, 0, 2.3, 0.04, 1.5, 0.02); T.add('m', tube([[-0.8, 1.56, -0.4], [-0.2, 1.56, 0.1], [0.4, 1.56, -0.2], [0.8, 1.56, 0.4]], 0.02, 20, 4), 0xdc2626, 0, 0, 0); T.add('x', rcyl(0.15, 0.5, 0.04, 12), 0xd4a017, 0.9, 1.55, -0.5, 0, 0, PI / 2 - 0.2); T.solid(-1.3, 0, -0.9, 1.3, 1.55, 0.9); }
  w.kiosks.push({ id: 'chart', x: -4.4, y: QD, z: 16.8, r: 2.4, label: '🗺️ Sea Chart (pick an island)', fn: (app) => PUI.chart(app) });
  captainNPC(w, 3.9, QD, 15.6, PI + 0.4, { fn: (app) => PUI.captain(app) });
  { w.add('m', cyl(10), C.woodD, -2.6, QD, 13.2, 0, 0, 0, 0.1, 2.0, 0.1); w.add('m', cyl(10), C.woodD, -2.6, QD + 2, 13.2, 0, 0, PI / 2, 0.08, 1.2, 0.08); w.add('m', rcyl(0.6, 0.15, 0.05, 16), C.woodD, -2.6, QD, 13.2); w.solid(-3.1, QD, 12.7, -2.1, QD + 2.1, 13.7, { cam: false }); }
  parrotNPC(w, { perch: [-2.6, QD + 2.08, 13.2, PI] }); w.kiosks.push({ id: 'parrot', x: -2.6, y: QD, z: 13.2, r: 2.0, label: '🦜 Talk to Grumbles (he\u2019s cranky)', fn: (app) => PUI.parrot(app) });
  // ---- cabin: Dresser Shop, treasure shelf, ship-in-a-bottle back to HQ
  PR.rug(w, 0, 17, 0, 8, 5, 0xb91c1c, 0xffd23f);
  { const T = w.tf(0, 0, 20.9, 0); T.slab('g', 0xd946ef, 0, 0, 0, 4.2, 4.4, 1.6, 0.25); T.box('e', 0xdff6ff, 0, 1.0, -0.82, 2.4, 2.8, 0.06, 0.1); T.add('x', torus(0.1, 32), trim, 0, 2.4, -0.86, 0, 0, 0, 1.25, 1.55, 1); T.box('g', 0xffd23f, 0, 4.4, 0, 4.4, 0.25, 1.8, 0.1);
    for (let i = 0; i < 5; i++) { T.add('f', capsule(12), [0xdc2626, 0x1d4ed8, 0xffd23f, 0x22c55e, 0xff6fb5][i], -2.9 - (i % 2) * 0.1, 1.9, -1.2 + i * 0.5, 0, 0, 0, 0.42, 1.5, 0.18); } T.add('x', cyl(10), 0x9ca3af, -2.9, 3.1, -0.2, PI / 2, 0, 0, 0.05, 2.8, 0.05); T.add('x', cyl(10), 0x9ca3af, -2.9, 0, -1.6, 0, 0, 0, 0.05, 3.1, 0.05); T.add('x', cyl(10), 0x9ca3af, -2.9, 0, 1.2, 0, 0, 0, 0.05, 3.1, 0.05);
    for (let i = 0; i < 3; i++) T.add('f', sph(12), [0x111111, 0x1e3a8a, 0xdc2626][i], 3.0, 1.2 + i * 0.05, -0.8 + i * 0.6, 0, 0, 0, 0.35, 0.22, 0.35); T.box('m', 0x6b4423, 3.0, 0, -0.2, 1.4, 1.1, 2.2, 0.1); }
  const dressLbl = () => ownsPirate() ? '👗 Dresser Shop' : '🔒 Dresser Shop';
  w.kiosks.push({ id: 'dresser', x: 0, y: 0, z: 19, r: 2.8, label: dressLbl, fn: (app) => PUI.dresser(app) });
  const pieces = mapPieces(); { const T = w.tf(6.2, 0, 17.2, -PI / 2); T.slab('m', 0x6b4423, 0, 0, 0, 5, 3.6, 0.9, 0.1); for (let k = 0; k < 2; k++) T.box('m', 0x8b5a2b, 0, 1.3 + k * 1.2, -0.1, 4.8, 0.12, 1.0, 0.04);
    ISLES.slice(0, 4).forEach((I, i) => { const has = P().done[I.id]; if (has) { T.add('m', rcyl(0.2, 0.9, 0.05, 12), 0xf5deb3, -1.7 + i * 1.15, 1.6, -0.1, 0, 0, PI / 2); T.add('l', rcyl(0.1, 0.25, 0.03, 10), parseInt(I.col.slice(1), 16), -1.7 + i * 1.15, 1.6, -0.1, 0, 0, PI / 2, 1, 1, 1, 0.5); } else T.add('m', rcyl(0.18, 0.05, 0.02, 10), 0x4b3621, -1.7 + i * 1.15, 1.45, -0.1); });
    if (P().final) { T.add('x', wedge(), 0xffc400, -0.6, 2.6, 0, 0, 0, 0, 1.0); T.add('l', sph(12), 0xfff3b0, 0, 3.2, 0, 0, 0, 0, 0.4, 0.4, 0.4, 0.8); } else T.add('x', rcyl(0.8, 0.12, 0.05, 20), 0x6b7280, 0, 2.55, -0.1); }
  w.kiosks.push({ id: 'shelf', x: 5, y: 0, z: 17.2, r: 2.2, label: `🏆 Treasure shelf (${pieces}/4 map pieces)`, fn: (app, g) => { sfx('check'); g.toastMsg(P().final ? '👑 The Legendary Golden Cheese! You did it, Pi-rat!' : `🗺️ ${pieces}/4 map pieces. ${pieces >= 4 ? 'Skull Rock is open!' : 'Find the rest on the islands!'}`); } });
  { const T = w.tf(-5.6, 0, 17.4, PI / 2); T.slab('m', 0x7c4a22, 0, 0, 0, 2.4, 1.6, 1.6, 0.12); T.add('e', capsule(18), 0xbff4ff, 0, 2.2, 0, 0, 0, PI / 2, 0.75, 1.6, 0.75); T.add('m', rcyl(0.3, 0.4, 0.05, 12), 0x9a6a3e, 0, 2.2, 1.35, PI / 2, 0, 0);
    T.add('g', rbox(1.2, 0.3, 0.4, 0.1), 0x8b5a2b, 0, 1.95, 0); T.add('s', wedge(), 0xffffff, 0, 2.15, 0, 0, PI / 2, 0, 0.02, 0.7, 0.6); T.add('l', sph(10), 0xff4fa0, 0, 2.6, 0, 0, 0, 0, 0.1, 0.1, 0.1, 1.2); }
  w.kiosks.push({ id: 'bottle', x: -4.6, y: 0, z: 17.4, r: 2.2, label: '🏠 Ship-in-a-bottle: back to Ratita HQ', fn: (app) => { sfx('door'); app.loadLevel('hq', true); } });
  // cabin dressing: hammock, lantern lights, barrels, chest, table
  w.add('f', tube([[-6.3, 3.2, 13.4], [-5.2, 1.7, 15], [-6.3, 3.2, 16.6]], 0.45, 20, 10), 0xfde68a, 0, 0, 0); barrel(w, 5.6, 0, 13.4, 0.8); barrel(w, 5.6, 0, 20.8, 0.8, 1.2, 0x8b5a2b); treasurePile(w, 3.2, 0, 13.6, 0.55);
  [[-3, 15], [3, 19]].forEach(([x, z]) => { w.add('x', cyl(8), 0x4b4b52, x, 3.6, z, 0, 0, 0, 0.04, 1.0, 0.04); PR.lantern(w, x, 2.6, z); w.lights.push({ x, y: 3.2, z, c: 0xffc46b, i: 9, d: 11 }); });
  // ---- deck dressing: cannons, barrels, crates, ropes, buckets, lanterns, chest, figurehead
  const cans = [[-6.3, -6, -PI / 2], [6.3, -6, PI / 2], [-6.3, 3.5, -PI / 2], [6.3, 3.5, PI / 2]];
  cans.forEach(([x, z, ry], i) => { const T = w.tf(x, 0, z, ry); cannonModel(T); T.solid(-0.8, 0, -1, 0.8, 1.4, 1); w.kiosks.push({ id: 'can' + i, x: x - Math.sin(ry) * 1.6, y: 0, z, r: 1.8, label: '💥 Fire the cannon!', fn: (app, g) => { const P_ = T.P(0, 1.2, -1.6); sfx('bosshit'); g.fx.burst(P_[0], P_[1], P_[2], 0xfff1c1, 18, 6); g.cam.shake = 0.35; const dx = -Math.sin(ry), dz = -Math.cos(ry); for (let k = 0; k < 10; k++) g.fx.emit(P_[0], P_[1], P_[2], dx * (22 + k), 6 - k * 0.2, dz * (22 + k), 0.22, 0x2d2d33, 1.6, 1, 0); g.toastMsg(['💥 KABOOM!', '💥 Bullseye! (on the ocean)', '🦜 Grumbles: "MY EARS!"', '💥 Ka-BLAM!'][(g.T * 3 | 0) % 4]); } }); });
  barrel(w, -5.8, 0, 9.5, 0.9); barrel(w, -4.6, 0, 10.4, 0.8, 0.5, 0x8b5a2b); barrel(w, 5.8, 0, -10.5, 0.9); crates(w, 4.8, 0, 9.4, 0.3, 3); crates(w, -4.4, 0, -11.2, -0.2, 2);
  w.crate(-2.8, 0, -8.6); w.crate(2.8, 0, -12.4); w.crate(-1.6, 0, 9.8);
  for (let i = 0; i < 3; i++) w.add('m', torus(0.28, 24), C.rope, 3.4 + i * 0.05, 0.25 + i * 0.25, -8.5, PI / 2, 0, 0, 0.9 - i * 0.12, 0.9 - i * 0.12, 1.2); w.add('m', torus(0.28, 24), C.rope, -3.6, 0.25, 4.6, PI / 2, 0, 0, 0.8, 0.8, 1.2);
  w.add('m', lathe([[0, 0], [0.45, 0], [0.55, 0.8], [0, 0.8]], 16), 0x9a6a3e, 1.9, 0, 4.4); w.add('x', torus(0.04, 16), 0x9ca3af, 1.9, 0.8, 4.4, PI / 2, 0, 0, 0.5, 0.5, 1);
  [[-7.1, -2], [7.1, -2], [-7.1, 8], [7.1, 8]].forEach(([x, z]) => { PR.lantern(w, x, 1.45, z); w.lights.push({ x, y: 2.8, z, c: 0xffc46b, i: 14, d: 10 }); });
  w.add('g', sph(20), 0xffc83d, 0, -0.4, -27.4, 0, 0, 0, 0.9, 0.95, 1.2); w.add('g', sph(14), 0xffc83d, 0, 0.3, -28.2, 0, 0, 0, 0.5, 0.45, 0.6); [-1, 1].forEach((s) => w.add('g', sph(10), 0xffc83d, s * 0.45, 0.85, -27.8, 0, 0, 0, 0.3, 0.3, 0.1)); w.add('x', wedge(), 0xffe14d, -0.3, -1.3, -27.6, 0, 0, 0, 0.6);
  // ---- the sea: islands + rocks + buoys live in seaG, which moves around the ship
  const seaG = new THREE.Group(); w.group.add(seaG); w.seaG = seaG;
  ISLES.forEach((I) => { const lod = new THREE.LOD(); const hi = new World(), lo = new World(); hi.game = null; isleVisual(hi, I, false); isleVisual(lo, I, true); const gh = new THREE.Group(), gl = new THREE.Group(); hi.finalize(gh); lo.finalize(gl);
    lod.addLevel(gh, 0); lod.addLevel(gl, 520); lod.position.set(I.sea[0], SEA_Y, I.sea[1]); seaG.add(lod); I._lod = lod; if (hi.lights.length) I._lights = hi.lights; });
  pseed(77); const sw = new World(); for (let i = 0; i < 26; i++) { const a = rnd() * PI * 2, r = 150 + rnd() * 1100; const x = Math.cos(a) * r, z = -400 + Math.sin(a) * r; if (ISLES.some((I) => Math.hypot(I.sea[0] - x, I.sea[1] - z) < I.r + 60) || Math.hypot(x, z) < 80) continue;
    if (i % 3) { sw.add('m', blobGeo(i & 31, 0.3, 2), i % 2 ? 0x7a6f66 : 0x8d8178, x, 0, z, 0, i, 0, 6 + rnd() * 8, 4 + rnd() * 8, 6 + rnd() * 6); sw.add('g', blobGeo((i + 5) & 31, 0.2, 1), 0xf5f0e1, x, 1, z, 0, 0, 0, 7 + rnd() * 6, 0.6, 7); }
    else { sw.add('g', lathe([[0, -1], [1.4, -0.8], [1.6, 0.6], [0.4, 1.2], [0, 1.2]], 16, 'buoy'), i % 2 ? 0xdc2626 : 0xffffff, x, 0, z, 0, 0, 0, 1.6); sw.add('l', sph(10), 0xfff07a, x, 3.4, z, 0, 0, 0, 0.6, 0.6, 0.6, 1); sw.add('x', cyl(8), 0x4b4b52, x, 1.6, z, 0, 0, 0, 0.12, 1.6, 0.12); } }
  { const gg = new THREE.Group(); sw.finalize(gg); gg.position.y = SEA_Y; seaG.add(gg); }
  // dolphins + gulls that keep the ship company (ship-relative)
  const dol = []; for (let i = 0; i < 3; i++) { const g = w.dynObj((T) => { T.add('g', sph(18), 0x6b8fb5, 0, 0, 0, 0, 0, 0, 0.9, 0.8, 2.4); T.add('g', sph(14), 0xe5edf5, 0, -0.35, 0.3, 0, 0, 0, 0.7, 0.45, 1.8); T.add('g', cone(12), 0x5a7ea3, 0, 0.8, -0.2, -0.4, 0, 0, 0.35, 1.0, 0.6); T.add('g', cone(12), 0x5a7ea3, 0, 0, -2.6, PI / 2, 0, 0, 0.25, 0.9, 1.2); T.add('g', sph(10), 0x6b8fb5, 0, -0.1, 2.6, 0, 0, 0, 0.3, 0.25, 0.6); [-1, 1].forEach((s) => { T.add('g', sph(8), 0x111111, s * 0.5, 0.2, 1.7, 0, 0, 0, 0.1); }); }); dol.push(g); }
  const gulls = []; for (let i = 0; i < 4; i++) { const g = w.dynObj((T) => { T.add('g', sph(12), 0xffffff, 0, 0, 0, 0, 0, 0, 0.4, 0.35, 0.8); T.add('g', cone(10), 0xffb020, 0, 0.1, 0.9, PI / 2, 0, 0, 0.08, 0.3, 0.08); [-1, 1].forEach((s) => T.add('g', sph(10), 0xe5e7eb, s * 0.9, 0.1, 0, 0, 0, s * 0.2, 0.9, 0.06, 0.35)); }); gulls.push(g); }
  // ---- ship state + sailing
  const ps = P().sea; const ship = w.ship = { v: 0, auto: null, saveT: 0, introT: 0 }; w.steer = { on: false, mx: 0, my: 0 };
  w.sailTo = (I) => { ship.auto = I; w.steer.on = false; };
  const nearIsle = () => { let best = null, bd = 1e9; for (const I of ISLES) { const d = Math.hypot(I.sea[0] - ps.x, I.sea[1] - ps.z); if (d < I.r + 52 && d < bd) { bd = d; best = I; } } return best; };
  w.actsFn = (me, g) => { const I = nearIsle(); if (!I || me.y < -1) return null; const open = isleOpen(I) && (!I.final || mapPieces() >= 4);
    return { label: open ? `⚓ Go ashore: ${I.icon} ${I.n}` : `🔒 ${I.n}: ${I.final ? 'needs 4 map pieces' : 'not yet'}`, fn: (app, gg) => { if (!open) { sfx('deny'); gg.toastMsg(I.final ? `💀 Skull Rock is wrapped in storm clouds. Find all 4 map pieces first! (${mapPieces()}/4)` : `🔒 Finish the island before it first!`); return; } persist(); sfx('door'); app.loadLevel(I.id, true); } }; };
  const wakeL = [-3.2, 3.2];
  w.tick = (dt, g) => { const st = w.steer; let tv = 0, turn = 0;
    if (!ship.introT && g.T > 0.8) { ship.introT = 1; if (!P().intro) { PUI.intro(g.app); } }
    if (st.on) { tv = st.my > 0.1 ? st.my * 26 : st.my < -0.3 ? -6 : 0; turn = -st.mx * 0.5; }
    else if (ship.auto) { const I = ship.auto, dx = I.sea[0] - ps.x, dz = I.sea[1] - ps.z, d = Math.hypot(dx, dz); if (d < I.r + 34) { ship.auto = null; sfx('check'); g.toastMsg(`🏝️ Land ho! ${I.icon} ${I.n}. Tap ⚓ to go ashore!`); }
      else { const hd = Math.atan2(-dx, -dz); let r = hd - ps.h; while (r > PI) r -= PI * 2; while (r < -PI) r += PI * 2; turn = Math.max(-0.5, Math.min(0.5, r * 1.5)); tv = Math.abs(r) > 1.2 ? 8 : Math.min(26, 6 + (d - I.r) * 0.25); } }
    ship.v += (tv - ship.v) * Math.min(1, dt * (tv > ship.v ? 0.6 : 0.9)); ps.h += turn * dt * Math.min(1, 0.35 + Math.abs(ship.v) / 14);
    ps.x += -Math.sin(ps.h) * ship.v * dt; ps.z += -Math.cos(ps.h) * ship.v * dt;
    for (const I of ISLES) { const dx = ps.x - I.sea[0], dz = ps.z - I.sea[1], d = Math.hypot(dx, dz), m = I.r + 20; if (d < m) { ps.x = I.sea[0] + dx / d * m; ps.z = I.sea[1] + dz / d * m; if (Math.abs(ship.v) > 4) { g.toastMsg('🪨 Bonk! Too close to shore'); g.cam.shake = 0.3; } ship.v *= 0.3; } }
    const R = Math.hypot(ps.x, ps.z + 600); if (R > 1500) { ps.x *= 0.999; ps.z = (ps.z + 600) * 0.999 - 600; ship.v *= 0.95; }
    const c = Math.cos(-ps.h), s = Math.sin(-ps.h); seaG.rotation.y = -ps.h; seaG.position.set(-ps.x * c - ps.z * s, Math.sin(g.T * 0.9) * 0.18, ps.x * s - ps.z * c);
    const U = sea.userData.U; U.uOff.value.set(ps.x, ps.z); U.uRot.value = ps.h;
    if (w.wheel) w.wheel.rotation.z += (-(st.on ? st.mx : turn) * 1.4 - w.wheel.rotation.z) * Math.min(1, dt * 3);
    if (st.on && g.me) { g.me.x = 0; g.me.z = 12.7; g.me.yaw = PI; }
    // wake + spray
    if (Math.abs(ship.v) > 3 && inView(0, SEA_Y, 24, 6)) for (const x of wakeL) if (Math.random() < Math.abs(ship.v) / 40) g.fx.emit(x + (Math.random() - 0.5), SEA_Y + 0.4, 23 + Math.random() * 2, x * 0.3, 1.5, 4 + Math.random() * 3, 0.35, 0xffffff, 1.2, 0.5, 0);
    if (ship.v > 8 && Math.random() < 0.3) g.fx.emit((Math.random() - 0.5) * 3, SEA_Y + 0.8, -27, (Math.random() - 0.5) * 6, 3 + Math.random() * 2, -2, 0.25, 0xe0f7ff, 0.8, 1, 0);
    // friends
    dol.forEach((d, i) => { const t = g.T * 0.8 + i * 2.1, k = (t % 6) / 6; const side = i % 2 ? 1 : -1; d.position.set(side * (14 + i * 3), SEA_Y - 1.2 + Math.sin(k * PI) * 3.2, -30 + ((t * 9) % 70)); d.rotation.x = Math.cos(k * PI) * 0.9; d.visible = ship.v > 4 || k < 0.99; });
    gulls.forEach((b, i) => { const a = g.T * (0.35 + i * 0.05) + i * 1.6, r = 14 + i * 4; b.position.set(Math.cos(a) * r, 26 + i * 2.5 + Math.sin(g.T + i) * 1.5, -4 + Math.sin(a) * r); b.rotation.y = -a; b.rotation.z = 0.35; b.children.forEach((m) => {}); });
    ship.saveT += dt; if (ship.saveT > 3) { ship.saveT = 0; persist(); }
  };
  w.hint(-8, -27, 8, 12, '⛵ The Salty Cheddar! Take the WHEEL on the back deck, or use the SEA CHART. The Dresser Shop is in the captain\u2019s cabin.', -2, 4);
  w.env.envLight = 0xfff3e0; w.title = '⛵ The Salty Cheddar';
};
// hub-sea island silhouettes (detailed + far LOD). These are visuals only; landing loads the real island.
function isleVisual(w, I, lo) { const id = I.id, R = I.r * 0.75; pseed(id.length * 97 + (lo ? 1 : 0));
  const sand = id === 'p_volcano' ? 0x4a4040 : id === 'p_skull' ? 0x6b6470 : 0xf3d9a4, top = id === 'p_volcano' ? 0x3a3436 : id === 'p_skull' ? 0x4a4553 : 0x5cbf4a;
  w.add('m', blobGeo(id.length, 0.12, lo ? 1 : 3), sand, 0, -1, 0, 0, 0, 0, R * 1.15, 4, R); if (!lo) w.add('g', blobGeo(id.length + 3, 0.1, 2), 0xffffff, 0, -0.2, 0, 0, 0, 0, R * 1.22, 0.4, R * 1.07);
  if (id !== 'p_lagoon') w.add('m', blobGeo(id.length + 1, 0.16, lo ? 1 : 2), top, 0, 2.2, -R * 0.1, 0, 0.6, 0, R * 0.8, 3, R * 0.7);
  const nP = lo ? 0 : id === 'p_cove' ? 14 : id === 'p_jungle' ? 10 : id === 'p_lagoon' ? 12 : 0; for (let i = 0; i < nP; i++) { const a = rnd() * PI * 2, r = R * (0.3 + rnd() * 0.6); palm(w, Math.cos(a) * r * 1.1, 2.5, Math.sin(a) * r * 0.9, 12 + rnd() * 8, 0.25, rnd() * 6); }
  if (id === 'p_cove') { rockWall(w, -R * 0.6, -R * 0.8, R * 0.6, -R * 0.45, 0, 22, 0x9a8f86); if (!lo) { w.add('m', cyl(8), 0x5b3a1f, 0, 22, -R * 0.6, 0, 0, 0, 0.3, 8, 0.3); w.add('f', rbox(5, 3, 0.2, 0.1), 0x111827, 2.6, 28.5, -R * 0.6); w.add('g', sph(10), 0xffffff, 2.4, 28.6, -R * 0.6 + 0.15, 0, 0, 0, 0.8, 0.8, 0.1); } }
  if (id === 'p_jungle') { for (let i = 0; i < (lo ? 3 : 7); i++) { const a = i * 0.9; const x = Math.cos(a) * R * 0.45, z = Math.sin(a) * R * 0.4 - 6; w.add('m', cyl(10), 0x5b3a1f, x, 0, z, 0, 0, 0, 2, 26, 2); w.add('g', blobGeo(i + 9, 0.2, lo ? 1 : 2), [0x2f9e4a, 0x237a3b, 0x3fae5a][i % 3], x, 28, z, 0, i, 0, 11, 7, 11); }
    w.add('m', rbox(22, 14, 22, 2), 0x9ca39a, 0, 0, -R * 0.55); w.add('m', rbox(14, 8, 14, 1.5), 0xa8a29e, 0, 14, -R * 0.55); }
  if (id === 'p_volcano') { w.add('m', lathe([[0, 0], [R, 0], [R * 0.45, 48], [R * 0.2, 56], [R * 0.16, 52], [0, 52]], lo ? 16 : 40, 'volc' + (lo ? 1 : 0)), 0x4a3f3f, 0, 0, -8); w.add('l', rcyl(R * 0.17, 1.5, 0.3, 24), 0xff6a1a, 0, 51.5, -8, 0, 0, 0, 1, 1, 1, 1.3);
    if (!lo) { for (let i = 0; i < 4; i++) w.add('l', tube([[Math.cos(i * 1.7) * R * 0.18, 52, -8 + Math.sin(i * 1.7) * R * 0.18], [Math.cos(i * 1.7) * R * 0.45, 30, -8 + Math.sin(i * 1.7) * R * 0.45], [Math.cos(i * 1.7) * R * 0.8, 4, -8 + Math.sin(i * 1.7) * R * 0.8]], 1.0, 20, 6), 0xff5a1a, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0.9); w.lights.push({ x: 0, y: 60, z: -8, c: 0xff6a1a, i: 60, d: 120 }); }
    for (let i = 0; i < (lo ? 2 : 5); i++) w.add('g', blobGeo(i + 20, 0.25, lo ? 1 : 2), 0x6b6070, Math.sin(i) * 6, 62 + i * 7, -8 + Math.cos(i) * 4, 0, i, 0, 9 + i * 2, 5 + i, 9 + i * 2); }
  if (id === 'p_lagoon') { w.add('e', rcyl(R * 0.6, 1, 0.3, 32), 0x5eead4, 0, 0.3, 0); w.add('m', blobGeo(7, 0.2, lo ? 1 : 2), 0x6b8f5e, R * 0.2, 3, -R * 0.55, 0, 0, 0, 16, 7, 12); w.add('m', sph(lo ? 12 : 24), 0x8b6a3e, R * 0.2, 7, -R * 0.55, 0, 0, 0, 13, 7, 10); w.add('m', sph(16), 0xb8a27c, R * 0.2, 6, -R * 0.55 + 12, 0, 0, 0, 4.2, 3.4, 4.2);
    if (!lo) { w.add('m', rbox(10, 6, 30, 2), 0x6b4423, -R * 0.4, 2, -R * 0.3, 0.3, 0.8, 0.4); w.add('m', cyl(8), 0x5b3a1f, -R * 0.4, 4, -R * 0.3, 0.7, 0, 0.3, 0.6, 18, 0.6); for (let i = 0; i < 6; i++) coral(w, Math.cos(i) * R * 0.9, 0, Math.sin(i) * R * 0.9, 3, [0xff6f91, 0xffd23f, 0xa78bfa][i % 3]); } }
  if (id === 'p_skull') { w.add('g', sph(lo ? 16 : 36), 0xd6d3c8, 0, 22, -6, 0, 0, 0, R * 0.55, R * 0.48, R * 0.5); w.add('g', rbox(R * 0.7, 14, R * 0.6, 4), 0xd6d3c8, 0, 6, R * 0.06); [-1, 1].forEach((s) => { w.add('m', sph(lo ? 10 : 20), 0x1f1b2a, s * R * 0.2, 24, R * 0.32, 0, 0, 0, R * 0.13, R * 0.15, R * 0.12); w.add('l', sph(12), 0x7dffb0, s * R * 0.2, 24, R * 0.4, 0, 0, 0, R * 0.05, R * 0.06, R * 0.04, 1.4); });
    w.add('m', sph(12), 0x1f1b2a, 0, 16, R * 0.42, 0, 0, 0, R * 0.06, R * 0.08, R * 0.05); for (let i = -3; i <= 3; i++) w.add('g', rbox(R * 0.08, 5, 3, 0.8), 0xf5f0e1, i * R * 0.09, 4.5, R * 0.36);
    for (let i = 0; i < (lo ? 3 : 8); i++) w.add('g', blobGeo(i + 40, 0.25, lo ? 1 : 2), 0x3b3550, Math.sin(i * 1.3) * R * 0.9, 50 + (i % 3) * 6, -6 + Math.cos(i * 1.3) * R * 0.7, 0, i, 0, 16, 6, 14); if (!lo) w.lights.push({ x: 0, y: 30, z: 20, c: 0x7dffb0, i: 50, d: 90 }); }
}
// ---- Ratita HQ: the ship-in-a-bottle portal + a Dresser Shop closet (the pack is advertised even when not owned)
const _hq = BUILD.hq;
BUILD.hq = (w) => { _hq(w); const own = ownsPirate();
  { const x = -5.5, z = 12.6; w.slab('m', 0x7c4a22, x, 0, z, 2.6, 1.4, 1.6, 0.15); w.add('x', rbox(2.7, 0.15, 1.7, 0.05), 0xffc83d, x, 1.45, z);
    w.add('e', capsule(20), 0xbff4ff, x, 2.45, z, 0, 0, PI / 2, 0.8, 1.7, 0.8); w.add('m', rcyl(0.32, 0.45, 0.06, 14), 0x9a6a3e, x - 1.55, 2.45, z, 0, 0, PI / 2);
    w.add('g', rbox(1.3, 0.32, 0.45, 0.12), 0x8b5a2b, x, 1.95, z); w.add('m', cyl(8), 0x5b3a1f, x, 2.0, z, 0, 0, 0, 0.04, 0.85, 0.04); w.add('s', wedge(), 0xfff7e6, x + 0.05, 2.35, z, 0, PI / 2, 0, 0.03, 0.45, 0.5); w.add('g', rbox(0.3, 0.18, 0.02, 0.02), 0x111827, x, 2.8, z + 0.02);
    w.add('g', rbox(2.4, 0.08, 1.4, 0.04), 0x2a86f5, x, 1.6, z); w.lights.push({ x, y: 3.4, z, c: 0x7dd3fc, i: 14, d: 8 }); flag(w, x + 1.1, 1.5, z - 0.6, 2.2, 0x111827, -0.4);
    w.kiosks.push({ id: 'pirateBottle', x, y: 0, z: z - 1.6, r: 2.6, label: own ? '🏴‍☠️ Pirate Pack: sail away with Pi-rat!' : '🏴‍☠️ Pirate Pack (DLC)', fn: (app) => PUI.portal(app) }); }
  { const T = w.tf(1.6, 0, 13.9, PI); T.slab('g', 0xd946ef, 0, 0, 0, 3.2, 4.2, 1.2, 0.25); T.box('e', 0xdff6ff, 0, 0.8, -0.62, 1.9, 2.6, 0.06, 0.1); T.add('x', torus(0.08, 32), 0xffd23f, 0, 2.1, -0.66, 0, 0, 0, 1.0, 1.35, 1); T.box('g', 0xffd23f, 0, 4.2, 0, 3.4, 0.22, 1.4, 0.08);
    T.add('g', sph(12), 0xffd23f, 0, 4.7, 0, 0, 0, 0, 0.35, 0.35, 0.35); }
  w.kiosks.push({ id: 'hqDresser', x: 1.6, y: 0, z: 12.2, r: 2.2, label: own ? '👗 Dresser Shop (skins & clothes)' : '👗 Dresser Shop (Pirate Pack)', fn: (app) => PUI.dresser(app) });
};
