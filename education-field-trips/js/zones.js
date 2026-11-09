// Field Trips DLC zones (Turbo engine): the Field Trip Depot hub outside Lilith's Education Center, the Desert Nature Walk and the
// Ratita Science Lab. Only ONE zone is built at a time (the old one is disposed) to keep iPhone memory low. Dense + tidy, batched props.
import * as THREE from 'three';
import { Batch, G, solid, solidC, sign, PI, COL } from './kit.js';
import { MATS } from './mats.js';
import { rng } from './util.js';
import { lilithScreen } from './lilith.js';
import { blob } from './geo.js';
import { buildAirport, buildFarm, buildPuptown } from './zones2.js';

// canvas board whose plane always matches the canvas aspect (never stretched)
export function board(w, h, draw, px = 768) { const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * h / w); const g = c.getContext('2d'); draw(g, c.width, c.height);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.3 })); }
export const put = (grp, m, x, y, z, ry = 0) => { m.position.set(x, y, z); m.rotation.y = ry; grp.add(m); return m; };
export function lamp(b, x, z, col = 0xfff1c4) { b.cyl('x', 0x334155, x, 0, z, 0.08, 3.6); b.box('x', 0x334155, x, 3.55, z, 0.5, 0.1, 0.5); b.sph('l', col, x, 3.4, z, 0.26, 0.26, 0.26, 1.1); solidC(x, z, 0.3, 0.3, 3.6); }
export function bench(b, x, z, ry, col = 0x9a5b2e) { const c = Math.cos(ry), s = Math.sin(ry); b.box('m', col, x, 0.45, z, 1.8, 0.08, 0.5, ry); b.box('m', col, x - s * 0.22, 0.65, z - c * 0.22, 1.8, 0.4, 0.06, ry); for (const k of [-0.75, 0.75]) b.box('x', 0x334155, x + c * k, 0, z - s * k, 0.08, 0.45, 0.45, ry); solidC(x, z, Math.abs(c) * 1.8 + Math.abs(s) * 0.6, Math.abs(s) * 1.8 + Math.abs(c) * 0.6, 0.9); }
export function tree(b, x, z, s = 1, r = Math.random) { b.cyl('m', 0x6b4426, x, 0, z, 0.24 * s, 2.4 * s); const greens = [0x3f9b46, 0x2f8a3c, 0x55ad4f]; b.sph('f', greens[(r() * 3) | 0], x, 3.0 * s, z, 1.5 * s, 1.3 * s, 1.5 * s); b.sph('f', greens[(r() * 3) | 0], x + 0.7 * s, 2.6 * s, z + 0.3 * s, 1.0 * s); b.sph('f', greens[(r() * 3) | 0], x - 0.6 * s, 2.7 * s, z - 0.3 * s, 1.0 * s); solidC(x, z, 0.6, 0.6, 3); }
export function planter(b, x, z, w = 2.4, d = 0.9, fl = [0xf472b6, 0xfacc15, 0xa78bfa]) { b.rbox('m', 0x9ca3af, x, 0, z, w, 0.55, d); b.box('m', 0x5b3a24, x, 0.5, z, w - 0.2, 0.06, d - 0.2); for (let i = 0; i < w * 2.5; i++) { const px = x - w / 2 + 0.3 + i * (w - 0.6) / Math.max(1, w * 2.5 - 1); b.sph('f', 0x3f9b46, px, 0.7, z + ((i % 2) - 0.5) * 0.3, 0.2); b.sph('g', fl[i % fl.length], px, 0.86, z + ((i % 2) - 0.5) * 0.3, 0.1); } solidC(x, z, w, d, 0.6); }
export function hedge(b, x0, z0, x1, z1) { const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0); b.add('f', G.box, 0x2f7d3a, (x0 + x1) / 2, 0.6, (z0 + z1) / 2, 0, ry, 0, 1.0, 1.2, L); solid(Math.min(x0, x1) - 0.5, Math.min(z0, z1) - 0.5, Math.max(x0, x1) + 0.5, Math.max(z0, z1) + 0.5, 0, 1.2).nocam = true; }
// the yellow Ratita school bus (front faces +x when ry=0)
export function bus(b, grp, x, z, ry = 0) { const c = Math.cos(ry), s = Math.sin(ry); const P = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  const Y = 0xfacc15; b.add('g', G.box, Y, x, 1.75, z, 0, ry, 0, 9.2, 2.3, 2.6); b.add('g', G.box, Y, ...(() => { const [a, d] = P(5.0, 0); return [a, 1.2, d]; })(), 0, ry, 0, 1.2, 1.3, 2.5);
  b.add('m', G.box, 0x111827, x, 1.25, z, 0, ry, 0, 9.24, 0.14, 2.64); b.add('m', G.box, 0x111827, x, 0.75, z, 0, ry, 0, 9.24, 0.1, 2.64);
  for (let i = 0; i < 6; i++) { for (const sd of [-1, 1]) { const [wx, wz] = P(-3.6 + i * 1.3, sd * 1.31); b.add('e', G.box, 0x9bd5ff, wx, 2.2, wz, 0, ry, 0, 1.0, 0.8, 0.04); } }
  { const [wx, wz] = P(4.62, 0); b.add('e', G.box, 0x9bd5ff, wx, 2.2, wz, 0, ry, 0, 0.04, 0.9, 2.2); const [lx, lz] = P(5.62, 0); for (const sd of [-0.85, 0.85]) { const [hx, hz] = P(5.62, sd); b.add('l', G.box, 0xfff3c4, hx, 1.2, hz, 0, ry, 0, 0.06, 0.25, 0.35, 0.8); } void lx; void lz; }
  for (const lx of [-3, 3.4]) for (const sd of [-1, 1]) { const [wx, wz] = P(lx, sd * 1.25); b.add('m', G.cyl, 0x111827, wx, 0.55, wz, PI / 2, ry, 0, 0.55, 0.4, 0.55); b.add('x', G.cyl, 0x9ca3af, wx, 0.55, wz, PI / 2, ry, 0, 0.26, 0.42, 0.26); }
  { const [dx, dz] = P(3.6, 1.32); b.add('e', G.box, 0x9bd5ff, dx, 1.6, dz, 0, ry, 0, 0.9, 2.0, 0.05); const [sx, sz] = P(2.8, 1.45); b.add('g', G.cyl8, 0xdc2626, sx, 1.7, sz, PI / 2, ry, 0, 0.32, 0.04, 0.32); }
  b.add('g', G.box, 0xfef08a, x, 2.95, z, 0, ry, 0, 9.0, 0.12, 2.4); for (const sd of [-1, 1]) { const [lx, lz] = P(-4.55, sd * 0.9); b.add('l', G.box, 0xef4444, lx, 2.7, lz, 0, ry, 0, 0.05, 0.22, 0.22, 0.8); }
  const sg = sign('RATITA SCHOOL BUS · FIELD TRIPS', 6, 0.55, { bg: '#111827', border: '#facc15', fg: '#fde047' }); { const [px, pz] = P(-0.4, 1.33); sg.position.set(px, 2.75, pz); sg.rotation.y = ry; grp.add(sg); }
  const sg2 = sg.clone(); { const [px, pz] = P(-0.4, -1.33); sg2.position.set(px, 2.75, pz); sg2.rotation.y = ry + PI; grp.add(sg2); }
  const hw = Math.abs(5.6 * c) + Math.abs(1.35 * s), hd = Math.abs(5.6 * s) + Math.abs(1.35 * c); solid(x - hw, z - hd, x + hw, z + hd, 0, 3); return { door: P(3.6, 2.6) }; }
export function stopMarker(grp, x, z, col = 0xfacc15) { const m = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 8, 28), MATS.l); const cc = new THREE.Color(col).multiplyScalar(1.8); const n = m.geometry.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = cc.r; a[i * 3 + 1] = cc.g; a[i * 3 + 2] = cc.b; } m.geometry.setAttribute('color', new THREE.BufferAttribute(a, 3)); m.rotation.x = -PI / 2; m.position.set(x, 0.08, z); grp.add(m); return m; }
export function infoPost(b, grp, x, z, ry, title, col = '#7c2d12') { b.box('m', 0x6b4426, x, 0, z, 0.14, 1.5, 0.14, ry); const s = sign(title, 1.6, 0.5, { bg: col, border: '#fde68a' }); s.position.set(x + Math.sin(ry) * 0.09, 1.55, z + Math.cos(ry) * 0.09); s.rotation.y = ry; grp.add(s); }

// ============================================================ HUB: Field Trip Depot
function buildHub(grp, S) { const r = rng(89); const b = new Batch(24); const Z = { name: 'Field Trip Depot', spots: [], stops: [], anchors: [] };
  const g0 = new Batch(); g0.box('g', 0x6fae4f, 0, -0.05, 0, 160, 0.05, 160); g0.finish(grp);
  b.box('m', 0xd6cfc4, 0, 0, -2, 46, 0.04, 26); // plaza
  for (let x = -22; x <= 22; x += 2) b.box('m', 0xc8bfb2, x, 0.045, -2, 0.06, 0.01, 26); for (let z = -14; z <= 10; z += 2) b.box('m', 0xc8bfb2, 0, 0.045, z, 46, 0.01, 0.06);
  b.box('m', 0x3f3f46, 0, 0, 15, 60, 0.05, 8); for (let x = -26; x <= 26; x += 5) b.box('l', 0xfff5c0, x, 0.06, 15, 2.2, 0.01, 0.16, 0, 0.15); // bus loop road
  b.box('m', 0xe5e7eb, 0, 0, 10.6, 60, 0.18, 0.8); // curb
  for (let i = 0; i < 6; i++) b.box('m', 0xf8fafc, -12 + i * 0.9, 0.06, 15, 0.5, 0.01, 7); // crosswalk
  // ---- Education Center facade (north)
  const ex = 0, ez = -20; b.box('m', 0xede9fe, ex, 0, ez, 30, 7.5, 9); b.box('m', 0x7c3aed, ex, 7.5, ez, 30.6, 0.6, 9.6); b.box('m', 0x5b21b6, ex, 0, ez + 4.52, 30, 0.8, 0.06);
  for (const wx of [-12, -8, -4, 4, 8, 12]) { b.box('e', 0x9bd5ff, ex + wx, 2.0, ez + 4.53, 2.2, 1.8, 0.05); b.box('e', 0x9bd5ff, ex + wx, 4.8, ez + 4.53, 2.2, 1.6, 0.05); b.box('m', 0xffffff, ex + wx, 1.9, ez + 4.6, 2.4, 0.1, 0.25); }
  b.box('m', 0x4c1d95, ex, 0, ez + 4.55, 3.2, 3.4, 0.1); b.box('e', 0xfde68a, ex, 0.1, ez + 4.62, 2.6, 3.0, 0.04); b.box('m', 0xa78bfa, ex, 3.4, ez + 5.4, 5, 0.18, 1.8); for (const sx of [-2.3, 2.3]) b.cyl('x', 0xe5e7eb, ex + sx, 0, ez + 6.1, 0.1, 3.4);
  solid(ex - 15, ez - 4.5, ex + 15, ez + 4.6, 0, 8);
  put(grp, sign('🎓 GROK ARCADE EDUCATION CENTER', 11, 1.2, { bg: '#4c1d95', border: '#fde68a', fg: '#fde68a' }), ex, 6.2, ez + 4.62);
  put(grp, sign('FIELD TRIP DEPOT', 4.6, 0.7, { bg: '#7c3aed', border: '#fde68a' }), ex, 4.0, ez + 6.3);
  for (const [bx, t, c] of [[-9.5, 'HOMESCHOOL IS\nFOR WINNERS 🏆', '#7c3aed'], [9.5, 'REGULAR SCHOOL:\nDREAMS FLOAT AROUND 🎈', '#0ea5e9']]) { b.cyl('x', 0x334155, ex + bx, 0, ez + 5.2, 0.06, 4.6); put(grp, sign(t, 2.6, 1.3, { bg: c, border: '#fde68a' }), ex + bx, 3.4, ez + 5.32); }
  // ---- the bus at the curb + bus shelter
  const B1 = bus(b, grp, -2, 13.2, PI); S.busDoor = { x: B1.door[0], z: B1.door[1] - 0.2 };
  b.box('m', 0x334155, 12, 0, 9.4, 4.4, 0.1, 1.6); b.box('e', 0xbfe3ff, 12, 0.1, 8.65, 4.4, 2.4, 0.05); b.box('m', 0x7c3aed, 12, 2.5, 9.4, 4.6, 0.12, 1.8); for (const sx of [-2.1, 2.1]) b.box('x', 0x334155, 12 + sx, 0, 8.7, 0.08, 2.5, 0.08); bench(b, 12, 9.1, PI); put(grp, sign('BUS STOP · TRIPS', 2.2, 0.36, { bg: '#111827', border: '#facc15' }), 12, 2.85, 8.6, PI);
  // ---- Trip Board (big billboard)
  b.box('m', 0x4c1d95, -6, 0, 2, 0.25, 1.3, 0.25); b.box('m', 0x4c1d95, -1.6, 0, 2, 0.25, 1.3, 0.25); b.rbox('m', 0x312e81, -3.8, 1.2, 2, 5.4, 3.4, 0.3); solidC(-3.8, 2, 5.6, 0.6, 4.6);
  S.boardMesh = put(grp, board(5.0, 3.0, (g, w, h) => drawBoard(g, w, h, S)), -3.8, 2.9, 2.17); Z.spots.push({ x: -3.8, z: 3.8, r: 2.6, kind: 'board', label: '🚌 Pick a field trip' });
  // ---- Lilith's big screen (she can't move, so she streams to the Depot)
  b.cyl('x', 0x94a3b8, 6.5, 0, -5, 0.14, 2.2); b.rbox('g', 0xe0e7ff, 6.5, 1.9, -5, 3.4, 2.4, 0.3); const scr = lilithScreen(3.0, 2.0, 384); scr.m.position.set(6.5, 3.1, -4.83); grp.add(scr.m); S.lilithScreen = scr; solidC(6.5, -5, 3.4, 0.6, 4.3);
  put(grp, sign('LILITH THE BOT · LIVE FROM CLASS', 3.4, 0.4, { bg: '#7c3aed', border: '#fde68a' }), 6.5, 4.5, -4.83); Z.spots.push({ x: 6.5, z: -3.2, r: 2.4, kind: 'lilith', label: '📺 Talk to Lilith' });
  // ---- Lesson Save Vault terminal
  b.rbox('x', 0x475569, 13, 0, -6, 1.6, 2.2, 1.0); b.box('l', 0xfde047, 13, 1.25, -5.48, 1.2, 0.7, 0.03, 0, 0.5); b.box('g', 0xfacc15, 13, 2.2, -6, 1.7, 0.2, 1.1); solidC(13, -6, 1.6, 1.0, 2.4);
  put(grp, sign('📚 LESSON SAVE VAULT', 2.4, 0.45, { bg: '#854d0e', border: '#fde047' }), 13, 2.75, -5.44); Z.spots.push({ x: 13, z: -4.4, r: 2.0, kind: 'vault', label: '📚 Open the Lesson Save Vault' });
  // ---- Souvenir case (things you buy on trips show up here)
  b.rbox('m', 0x7c2d12, -13, 0, -6, 3.4, 0.9, 1.0); b.box('m', 0xf8fafc, -13, 1.5, -6, 3.3, 0.04, 0.9); b.box('e', 0xdbeafe, -13, 0.9, -6, 3.3, 1.2, 0.95); b.box('m', 0x7c2d12, -13, 2.1, -6, 3.4, 0.1, 1.0); solidC(-13, -6, 3.4, 1.0, 2.2);
  put(grp, sign('TRIP SOUVENIRS', 2.2, 0.36, { bg: '#7c2d12', border: '#fde68a' }), -13, 2.5, -5.48); S.souvenirSlots = [-14.4, -13.7, -13.0, -12.3, -11.6].flatMap((x) => [[x, -6, 1.15]]).concat([-14.4, -13.7, -13.0, -12.3, -11.6].map((x) => [x, -6, 1.75])); Z.spots.push({ x: -13, z: -4.4, r: 2.0, kind: 'souvenirs', label: '🎁 Look at your souvenirs' });
  // ---- Candy's charging post (free recovery for Lilith's tablet)
  b.rbox('g', 0x16a34a, 6.5, 0, 8.2, 0.7, 1.4, 0.5); b.box('l', 0x86efac, 6.5, 1.0, 8.47, 0.4, 0.25, 0.02, 0, 0.7); solidC(6.5, 8.2, 0.7, 0.5, 1.5); put(grp, sign('⚡ FREE CHARGING', 1.4, 0.3, { bg: '#166534', border: '#86efac' }), 6.5, 1.65, 8.47);
  Z.spots.push({ x: 6.5, z: 7.0, r: 1.8, kind: 'charge', label: "⚡ Candy's free tablet charger" });
  // ---- plaza dressing: planters, benches, lamps, trees, flag, bike rack, picnic tables, hopscotch, bulletin board
  for (const [x, z] of [[-18, -8], [18, -8], [-18, 4], [18, 4], [-8, 8.5], [6, 0]]) lamp(b, x, z);
  for (const [x, z] of [[-9, -12], [9, -12]]) planter(b, x, z, 4, 1);
  planter(b, -20.5, -2, 1, 6); planter(b, 20.5, -2, 1, 6);
  bench(b, 1.5, -10, PI); bench(b, -3.5, -10, PI); bench(b, 17, 0, -PI / 2); bench(b, -17, 0, PI / 2);
  for (const [x, z] of [[-21, -13], [21, -13], [-21, 9], [21, 9], [-26, -4], [26, -4], [-26, 6], [26, 6], [-30, -16], [30, -16]]) tree(b, x, z, 1 + r() * 0.3, r);
  b.cyl('x', 0xd4d4d8, -15, 0, -12.5, 0.08, 7); put(grp, board(1.6, 1.0, (g, w, h) => { g.fillStyle = '#7c3aed'; g.fillRect(0, 0, w, h); g.fillStyle = '#fde68a'; g.fillRect(0, h / 3, w, h / 3); g.font = `${h * 0.3}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🎓', w / 2, h / 2); }, 256), -14.2, 6.3, -12.5);
  for (let i = 0; i < 5; i++) { b.box('x', 0x64748b, 16 + i * 0.6, 0, 6.6, 0.05, 0.8, 0.6); } b.box('x', 0x64748b, 17.2, 0.75, 6.6, 2.6, 0.05, 0.05); solidC(17.2, 6.6, 2.8, 0.7, 0.8);
  for (const [x, z] of [[-14, 4.5], [-10, 4.5]]) { b.box('m', 0xb45309, x, 0.75, z, 2.2, 0.08, 1.1); b.box('m', 0xb45309, x, 0.42, z + 0.85, 2.2, 0.06, 0.35); b.box('m', 0xb45309, x, 0.42, z - 0.85, 2.2, 0.06, 0.35); b.box('x', 0x475569, x, 0, z, 0.1, 0.75, 0.9); solidC(x, z, 2.2, 2.0, 0.9); }
  for (let i = 0; i < 8; i++) { const hz = -4 + i * 0.9; b.box('m', [0xf472b6, 0x60a5fa, 0xfacc15, 0x34d399][i % 4], -16 + (i % 3 === 1 ? 0.5 : 0), 0.05, hz, i % 3 === 1 ? 1.6 : 0.75, 0.01, 0.75); }
  { const BX = 15.5, BZ = -11; b.box('m', 0x7c2d12, BX - 1.3, 0, BZ, 0.12, 1.8, 0.12); b.box('m', 0x7c2d12, BX + 1.3, 0, BZ, 0.12, 1.8, 0.12); b.box('m', 0xb45309, BX, 1.0, BZ, 2.8, 1.4, 0.1); solidC(BX, BZ, 2.8, 0.3, 2); }
  put(grp, board(2.6, 1.3, (g, w, h) => { g.fillStyle = '#fef3c7'; g.fillRect(0, 0, w, h); const notes = [['PERMISSION SLIPS\nTURN IN HERE', '#fde047'], ['LOST: 1 SOCK\n(ask Candy)', '#fca5a5'], ['5 TRIPS:\nPICK ONE!', '#93c5fd'], ['GOGGLES\nREQUIRED', '#86efac']]; notes.forEach(([t, c], i) => { const x = 14 + (i % 2) * w / 2, y = 10 + Math.floor(i / 2) * h / 2; g.fillStyle = c; g.fillRect(x, y, w / 2 - 28, h / 2 - 20); g.fillStyle = '#1f2937'; g.font = `800 ${h * 0.075}px system-ui`; g.textAlign = 'center'; t.split('\n').forEach((l, k) => g.fillText(l, x + (w / 2 - 28) / 2, y + h * 0.17 + k * h * 0.11)); }); }, 512), 15.5, 1.02, -10.94);
  // school-supply crates + backpack hooks by the door
  for (let i = 0; i < 4; i++) b.rbox('m', [0xef4444, 0x3b82f6, 0x22c55e, 0xf59e0b][i], -5 + i * 0.9, 0, -14.7, 0.7, 0.5, 0.5);
  // fence hedges around the depot (tidy edge)
  hedge(b, -23, -16, -23, 10); hedge(b, 23, -16, 23, 10); hedge(b, -32, 19.5, 32, 19.5);
  solid(-60, 10.8, -30, 19, 0, 2); solid(30, 10.8, 60, 19, 0, 2);
  b.finish(grp);
  Z.spawn = { x: 0, z: 4, yaw: PI }; Z.anchors = [[0, -6, 6], [-10, -2, 4], [10, 2, 4]];
  Z.pets = { candy: [4.6, 9.0, PI * 0.8] }; Z.bounds = { x0: -22.5, x1: 22.5, z0: -15.5, z1: 19 };
  Z.env = { skyTop: 0x3b82f6, skyMid: 0xbfdbfe, skyBot: 0xe0f2fe, sunDir: [0.4, 0.62, 0.45], sunColor: 0xfff4dc, sunI: 2.5, hemiSky: 0xe0f2fe, hemiGround: 0x5b6b3a, hemiI: 0.9, exposure: 0.92, fog: 0xdbeafe, fogD: 0.006, envI: 0.7, bloomT: 1.05, bloomS: 0.2 };
  return Z; }
export function drawBoard(g, w, h, S) { g.fillStyle = '#1e1b4b'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fde68a'; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = '#fde68a'; g.font = `900 ${h * 0.085}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🚌 FIELD TRIPS · PICK A TRIP', w / 2, h * 0.1);
  (S.trips || []).forEach((t, i) => { const y = h * 0.24 + i * h * 0.145; g.fillStyle = t.ready ? t.color : '#475569'; g.fillRect(w * 0.05, y - h * 0.055, w * 0.9, h * 0.11); g.fillStyle = '#fff'; g.textAlign = 'left'; g.font = `800 ${h * 0.058}px system-ui`;
    g.fillText(`${t.icon} ${t.name}`, w * 0.08, y); g.textAlign = 'right'; g.font = `800 ${h * 0.045}px system-ui`; g.fillText(t.ready ? (S.done && S.done[t.id] ? '✅ DONE · REPLAY' : '▶ BOARD THE BUS') : '🔒 COMING SOON', w * 0.93, y); }); }

// ============================================================ DESERT NATURE WALK (Torty Town / Martina's habitat)
function saguaro(b, x, z, s, r) { const c = 0x3f7d3a; b.add('g', G.cyl, c, x, 2.2 * s, z, 0, 0, 0, 0.32 * s, 4.4 * s, 0.32 * s); b.sph('g', c, x, 4.4 * s, z, 0.32 * s);
  const arms = 1 + ((r() * 2.5) | 0); for (let i = 0; i < arms; i++) { const sd = i % 2 ? 1 : -1, h = (1.6 + r() * 1.2) * s, a = r() * PI; const ax = x + Math.cos(a) * sd * 0.65 * s, az = z + Math.sin(a) * sd * 0.65 * s; b.add('g', G.cyl, c, (x + ax) / 2, h, (z + az) / 2, 0, -a, PI / 2 * sd, 0.2 * s, 0.7 * s, 0.2 * s); b.add('g', G.cyl, c, ax, h + 0.6 * s, az, 0, 0, 0, 0.2 * s, 1.3 * s, 0.2 * s); b.sph('g', c, ax, h + 1.25 * s, az, 0.2 * s); }
  if (r() < 0.5) b.sph('g', 0xfef9c3, x, 4.75 * s, z, 0.12 * s); solidC(x, z, 0.7 * s, 0.7 * s, 4); }
function prickly(b, x, z, r) { for (let i = 0; i < 4; i++) { const a = r() * PI; b.add('g', G.sph, 0x5f9e47, x + (i - 1.5) * 0.25, 0.35 + (i % 2) * 0.4, z + (r() - 0.5) * 0.3, 0, a, 0.3, 0.32, 0.4, 0.09); } if (r() < 0.6) b.sph('g', 0xdb2777, x, 1.0, z, 0.08); solidC(x, z, 1.0, 0.6, 1); }
export function rock(b, x, z, s, col = 0xb07a4f) { b.add('m', G.ico, col, x, s * 0.35, z, 0, x * 3, 0, s, s * 0.7, s * 0.9); if (s > 0.6) solidC(x, z, s * 1.6, s * 1.6, s); }
function buildDesert(grp, S) { const r = rng(5501); const b = new Batch(24); const Z = { name: 'Desert Nature Walk', spots: [], stops: [], anchors: [] };
  const g0 = new Batch(); g0.box('m', 0xe6c690, 0, -0.05, 0, 220, 0.05, 220); g0.finish(grp);
  // winding trail + rope posts
  const trail = [[0, 18], [0, 10], [-6, 2], [-8, -8], [-2, -16], [8, -18], [14, -8], [12, 2], [6, 8]]; for (let i = 0; i < trail.length - 1; i++) { const [x0, z0] = trail[i], [x1, z1] = trail[i + 1]; const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0); b.add('m', G.box, 0xc9a26b, (x0 + x1) / 2, 0.01, (z0 + z1) / 2, 0, ry, 0, 2.6, 0.03, L + 2.6);
    for (let k = 0; k <= L; k += 3) { const t = k / L, px = x0 + (x1 - x0) * t, pz = z0 + (z1 - z0) * t, nx = Math.cos(ry) * 1.7, nz = -Math.sin(ry) * 1.7; for (const sd of [-1, 1]) b.cyl('m', 0x7c5a3a, px + nx * sd, 0, pz + nz * sd, 0.07, 0.75, 0, 0, 0, 1); } }
  // ---- ranger kiosk (adobe) + shade ramada + bus
  b.box('m', 0xd9a066, -12, 0, 14, 7, 3.4, 5); b.box('m', 0xb9773f, -12, 3.4, 14, 7.6, 0.35, 5.6); for (let i = 0; i < 7; i++) b.cyl('m', 0x6b4426, -15.4 + i * 1.13, 3.2, 16.7, 0.09, 0.7, PI / 2); b.box('m', 0x7c2d12, -12, 0, 16.52, 1.3, 2.3, 0.08); b.box('e', 0x9bd5ff, -14.2, 1.3, 16.52, 1.4, 1.0, 0.05); b.box('e', 0x9bd5ff, -9.8, 1.3, 16.52, 1.4, 1.0, 0.05); solidC(-12, 14, 7, 5, 4);
  put(grp, sign("MARTINA'S DESERT HABITAT\nTORTY TOWN NATURE TRAIL", 5, 1.0, { bg: '#7c2d12', border: '#fde68a' }), -12, 4.4, 16.6);
  for (const [x, z] of [[4, 12], [10, 12], [4, 16], [10, 16]]) b.cyl('m', 0x6b4426, x, 0, z, 0.14, 2.8); b.box('m', 0xa3794b, 7, 2.8, 14, 7.2, 0.18, 5.2); for (let i = 0; i < 9; i++) b.box('m', 0x8a5a33, 3.6 + i * 0.85, 2.98, 14, 0.4, 0.08, 5.2);
  for (const z of [13, 15]) { b.box('m', 0x9a5b2e, 7, 0.75, z, 2.6, 0.08, 0.9); b.box('m', 0x9a5b2e, 7, 0.42, z + 0.7, 2.6, 0.06, 0.3); b.box('m', 0x9a5b2e, 7, 0.42, z - 0.7, 2.6, 0.06, 0.3); b.box('x', 0x475569, 7, 0, z, 0.1, 0.75, 0.8); solidC(7, z, 2.6, 1.6, 0.9); }
  b.cyl('x', 0x60a5fa, 10.8, 0, 11.6, 0.3, 1.0); b.box('x', 0x94a3b8, 10.8, 1.0, 11.6, 0.5, 0.15, 0.4); solidC(10.8, 11.6, 0.6, 0.6, 1.2); // water fountain
  const B1 = bus(b, grp, 12, 22, PI); S.busDoor = { x: B1.door[0], z: B1.door[1] - 0.2 };
  Z.spots.push({ x: S.busDoor.x, z: S.busDoor.z, r: 2.2, kind: 'bus', label: '🚌 Back to the bus (Depot)' });
  // ---- Martina's habitat pen (low adobe wall) with burrow + lunch patch
  const hx = -9, hz = -10; for (const [x0, z0, x1, z1] of [[-15, -16, -3, -16], [-15, -16, -15, -4], [-3, -16, -3, -11], [-3, -7, -3, -4], [-15, -4, -3, -4]]) { const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0); b.add('m', G.box, 0xd9a066, (x0 + x1) / 2, 0.45, (z0 + z1) / 2, 0, ry, 0, 0.4, 0.9, L); solid(Math.min(x0, x1) - 0.2, Math.min(z0, z1) - 0.2, Math.max(x0, x1) + 0.2, Math.max(z0, z1) + 0.2, 0, 0.9); }
  b.sph('m', 0xc9a26b, hx - 3, 0, hz - 3, 2.2, 1.0, 2.0); b.add('m', G.sph, 0x2a1a10, hx - 3, 0.35, hz - 1.35, 0, 0, 0, 0.75, 0.5, 0.35); solidC(hx - 3, hz - 3.2, 3.6, 3.0, 1);
  for (let i = 0; i < 10; i++) { b.sph('f', [0x84cc16, 0x65a30d][i % 2], hx + 2 + (i % 5) * 0.6, 0.15, hz + 2 + Math.floor(i / 5) * 0.7, 0.28, 0.18, 0.28); } b.sph('g', 0xfacc15, hx + 3.6, 0.3, hz + 2.4, 0.1);
  put(grp, sign('🐢 TORTOISE HABITAT · PLEASE DO NOT TOUCH', 3.6, 0.45, { bg: '#7c2d12', border: '#fde68a' }), -9, 1.25, -3.75);
  // ---- desert flora: saguaros, prickly pears, barrels, rocks, wildflowers, tumbleweeds, mesas
  for (let i = 0; i < 46; i++) { const a = r() * PI * 2, d = 8 + r() * 34, x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(x) < 3 && z > 6) continue; if (x > -16 && x < -2 && z > -17 && z < -3) continue; if (x > 2 && x < 12 && z > 10 && z < 26) continue; if (x < -8 && z > 10) continue;
    const k = r(); if (k < 0.32) saguaro(b, x, z, 0.8 + r() * 0.5, r); else if (k < 0.6) prickly(b, x, z, r); else if (k < 0.78) { b.sph('g', 0x4d8a3a, x, 0.4, z, 0.45, 0.4, 0.45); b.sph('g', 0xf97316, x, 0.82, z, 0.09); solidC(x, z, 0.8, 0.8, 0.8); } else rock(b, x, z, 0.4 + r() * 1.0, [0xb07a4f, 0xa0623a, 0xc28a5a][(r() * 3) | 0]); }
  for (let i = 0; i < 70; i++) { const x = (r() - 0.5) * 70, z = (r() - 0.5) * 70; b.sph('g', [0xf472b6, 0xfacc15, 0xfb923c, 0xa78bfa, 0xffffff][(r() * 5) | 0], x, 0.12, z, 0.1); b.sph('f', 0x6b8e3a, x, 0.04, z, 0.18, 0.06, 0.18); }
  for (const [mx, mz, w, h, d] of [[-70, -60, 40, 18, 22], [60, -70, 34, 22, 24], [80, 20, 26, 14, 30], [-80, 30, 30, 16, 26]]) { for (let k = 0; k < 4; k++) b.box('m', [0xc0703f, 0xd08a55, 0xb5653a, 0xd99a62][k], mx, k * h / 4, mz, w - k * 2, h / 4, d - k * 2); }
  for (let i = 0; i < 6; i++) b.sph('f', 0xb8955e, -20 + i * 8, 0.45, 26 - (i % 2) * 52, 0.45);
  // dry creek + footbridge
  b.box('m', 0xcfb07a, 20, 0.0, -2, 3.2, 0.02, 40); for (let i = 0; i < 18; i++) rock(b, 18.6 + (i % 2) * 2.8, -20 + i * 2.2, 0.25, 0xa8a29e);
  // ---- trail stops (glowing rings + info posts)
  const stops = [[-2.5, -0.5], [-6, -4.2], [-1, -17.5], [-3.6, -11.5], [13.5, -6]];
  stops.forEach(([x, z], i) => { Z.stops.push({ x, z, i, ring: stopMarker(grp, x, z, 0xfacc15) }); infoPost(b, grp, x + 1.4, z, -PI / 2, (S.trip.stops[i][0]).toUpperCase(), '#7c2d12'); });
  // a big saguaro right at stop 0 + wildflower carpet at stop 2 (tidy, deliberate)
  saguaro(b, -4.2, -1.2, 1.4, r); for (let i = 0; i < 26; i++) { const a = i * 2.4, d = 1.2 + (i % 5) * 0.35; b.sph('g', [0xf472b6, 0xfacc15, 0xfb923c, 0xa78bfa][i % 4], -1 + Math.cos(a) * d, 0.14, -20.2 + Math.sin(a) * d * 0.6, 0.11); }
  // ---- souvenir stand
  b.rbox('m', 0xb45309, 13, 0, 6, 2.6, 1.0, 1.2); b.box('f', 0xf97316, 13, 2.2, 6, 3.0, 0.1, 1.6); for (const sx of [-1.3, 1.3]) b.cyl('m', 0x6b4426, 13 + sx, 0, 6.6, 0.06, 2.2); solidC(13, 6, 2.6, 1.2, 2.2); b.sph('g', 0x3f7d3a, 12.3, 1.2, 6, 0.18, 0.3, 0.18); b.sph('g', 0x8a6a3b, 13.4, 1.15, 6, 0.25, 0.14, 0.3);
  put(grp, sign('TRAIL SHOP', 1.8, 0.4, { bg: '#b45309', border: '#fde68a' }), 13, 2.0, 6.65); Z.spots.push({ x: 13, z: 7.6, r: 1.8, kind: 'shop', label: '🛍️ Trail Shop (souvenirs)' });
  b.finish(grp);
  Z.spawn = { x: 1.5, z: 16.5, yaw: PI }; Z.guide = { id: 'torty', x: -2.2, z: 11, yaw: PI * 0.25 }; Z.anchors = [[0, 0, 10], [8, -10, 6], [-4, 6, 4]];
  Z.bounds = { r: 40 }; Z.extra = [['snowie', 7, 13.6, PI / 2]];
  Z.env = { skyTop: 0x2f78d6, skyMid: 0xa8d0f0, skyBot: 0xf6dfb4, sunDir: [0.45, 0.7, 0.3], sunColor: 0xfff0d0, sunI: 2.8, hemiSky: 0xe6f0ff, hemiGround: 0x9a6b3a, hemiI: 0.9, exposure: 0.9, fog: 0xf0dcb8, fogD: 0.006, envI: 0.65, bloomT: 1.05, bloomS: 0.18 };
  return Z; }

// ============================================================ RATITA SCIENCE LAB
function buildLab(grp, S) { const b = new Batch(24); const Z = { name: 'Ratita Science Lab', spots: [], stops: [], anchors: [], indoor: true };
  const W = 36, D = 26, H = 6; // room centred at 0,0 ; door south (z=+13)
  b.box('m', 0xd9e1ea, 0, -0.05, 0, W, 0.05, D); for (let x = -W / 2 + 1; x < W / 2; x += 2) for (let z = -D / 2 + 1; z < D / 2; z += 2) if (((x + z) / 2 | 0) % 2 === 0) b.box('m', 0xb9c6d6, x, 0.005, z, 1.96, 0.012, 1.96);
  const wc = 0xbfd3ea; b.box('w', wc, 0, 0, -D / 2 - 0.2, W, H, 0.4); b.box('w', wc, -W / 2 - 0.2, 0, 0, 0.4, H, D); b.box('w', wc, W / 2 + 0.2, 0, 0, 0.4, H, D); b.box('w', wc, -10.5, 0, D / 2 + 0.2, 15, H, 0.4); b.box('w', wc, 10.5, 0, D / 2 + 0.2, 15, H, 0.4); b.box('w', wc, 0, 3.2, D / 2 + 0.2, 6, H - 3.2, 0.4);
  b.box('w', 0xf8fafc, 0, H, 0, W + 0.8, 0.2, D + 0.8); b.box('m', 0x1d4ed8, 0, 0, -D / 2 + 0.02, W, 0.5, 0.06); b.box('m', 0x1d4ed8, -W / 2 + 0.02, 0, 0, 0.06, 0.5, D); b.box('m', 0x1d4ed8, W / 2 - 0.02, 0, 0, 0.06, 0.5, D);
  solid(-W / 2 - 1, -D / 2 - 1, W / 2 + 1, -D / 2, 0, H); solid(-W / 2 - 1, -D / 2, -W / 2, D / 2 + 1, 0, H); solid(W / 2, -D / 2, W / 2 + 1, D / 2 + 1, 0, H); solid(-W / 2, D / 2, -3, D / 2 + 1, 0, H); solid(3, D / 2, W / 2, D / 2 + 1, 0, H);
  solid(-3, D / 2 + 0.6, 3, D / 2 + 1.5, 0, H); // door is the exit spot, not a hole
  for (let x = -14; x <= 14; x += 7) for (const z of [-7, 3]) b.box('l', 0xf8fafc, x, H - 0.12, z, 3, 0.06, 0.8, 0, 0.5);
  b.box('m', 0x2563eb, 0, 0, D / 2 - 0.02, 6, 3.2, 0.06); b.box('e', 0x9bd5ff, 0, 0.3, D / 2 - 0.08, 5, 2.6, 0.03); put(grp, sign('EXIT · BUS', 2.0, 0.4, { bg: '#16a34a', border: '#fff' }), 0, 3.6, D / 2 - 0.1, PI);
  Z.spots.push({ x: 0, z: D / 2 - 1.6, r: 2.2, kind: 'bus', label: '🚌 Back to the bus (Depot)' });
  put(grp, sign('🐀 RATITA INDUSTRIES · SCIENCE WING', 10, 1.0, { bg: '#1e3a8a', border: '#fde047' }), 0, 4.6, -D / 2 + 0.25);
  // whiteboard: scientific method + periodic-style poster
  b.box('m', 0xffffff, -7, 1.2, -D / 2 + 0.25, 7.4, 2.6, 0.08); put(grp, board(7.2, 2.4, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d4ed8'; g.font = `900 ${h * 0.12}px system-ui`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('THE SCIENTIFIC METHOD', w * 0.04, h * 0.12); ['1. Ask a question ❓', '2. Make a guess (hypothesis) 💭', '3. Test it 🧪', '4. Look at the results 📊', '5. Share what you learned 📣'].forEach((t, i) => { g.fillStyle = ['#dc2626', '#ea580c', '#16a34a', '#2563eb', '#7c3aed'][i]; g.font = `800 ${h * 0.095}px system-ui`; g.fillText(t, w * 0.06, h * 0.3 + i * h * 0.145); }); }, 768), -7, 2.5, -D / 2 + 0.3);
  put(grp, board(4.4, 2.4, (g, w, h) => { g.fillStyle = '#0f172a'; g.fillRect(0, 0, w, h); const el = [['H', '#f87171'], ['He', '#a78bfa'], ['C', '#94a3b8'], ['N', '#60a5fa'], ['O', '#38bdf8'], ['Na', '#fbbf24'], ['Fe', '#fb923c'], ['Au', '#facc15'], ['Ag', '#e2e8f0'], ['Cu', '#f97316'], ['Ne', '#f472b6'], ['Ca', '#4ade80']]; el.forEach(([s, c], i) => { const x = 14 + (i % 6) * (w - 28) / 6, y = h * 0.2 + Math.floor(i / 6) * h * 0.36; g.fillStyle = c; g.fillRect(x, y, (w - 28) / 6 - 8, h * 0.3); g.fillStyle = '#0f172a'; g.font = `900 ${h * 0.14}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x + ((w - 28) / 6 - 8) / 2, y + h * 0.15); }); g.fillStyle = '#fde047'; g.font = `900 ${h * 0.09}px system-ui`; g.fillText('ELEMENTS', w / 2, h * 0.09); }, 512), 9, 2.5, -D / 2 + 0.3);
  // lab benches (rows) with beakers, flasks, burners, stools
  const bcol = [0x22c55e, 0x3b82f6, 0xf472b6, 0xfacc15, 0xa855f7];
  for (const z of [-4, 1.5]) for (const x of [-10, -3.5, 3.5, 10]) { b.rbox('m', 0xe2e8f0, x, 0, z, 4.6, 0.9, 1.4); b.box('m', 0x1f2937, x, 0.9, z, 4.8, 0.08, 1.5); solidC(x, z, 4.8, 1.5, 1);
    for (let i = 0; i < 4; i++) { const px = x - 1.6 + i * 1.05; b.add('e', G.cyl, 0xe0f2fe, px, 1.15, z + (i % 2 ? 0.3 : -0.2), 0, 0, 0, 0.12, 0.42, 0.12); b.add('l', G.cyl, bcol[(i + Math.abs(x | 0)) % 5], px, 1.05, z + (i % 2 ? 0.3 : -0.2), 0, 0, 0, 0.1, 0.2, 0.1, 0.25); }
    b.add('x', G.cyl, 0x64748b, x + 1.9, 1.0, z, 0, 0, 0, 0.12, 0.2, 0.12); b.cyl('x', 0x94a3b8, x + 1.9, 1.1, z, 0.02, 0.6); for (const sx of [-1.4, 0, 1.4]) { b.cyl('x', 0x475569, x + sx, 0, z + 1.2, 0.04, 0.6); b.cyl('m', 0x2563eb, x + sx, 0.6, z + 1.2, 0.22, 0.06); } }
  // ---- 5 lab stations (stops)
  // 0 safety station: goggles rack + eyewash + lab coats
  b.rbox('m', 0xfef08a, -15.5, 0, 8, 1.2, 2.2, 3.0); for (let i = 0; i < 5; i++) { b.add('g', G.box, 0x38bdf8, -14.85, 1.6, 6.9 + i * 0.55, 0, 0, 0, 0.06, 0.16, 0.42); } b.cyl('x', 0x16a34a, -14.8, 0.9, 9.2, 0.25, 0.08); for (let i = 0; i < 3; i++) b.add('f', G.box, 0xffffff, -16.8 + 0, 1.1, 5.6 + i * 0.6, 0, 0, 0, 0.1, 1.2, 0.5); solidC(-15.5, 8, 1.4, 3.2, 2.4);
  put(grp, sign('🥽 SAFETY STATION', 2.6, 0.45, { bg: '#ca8a04', border: '#fff' }), -14.85, 2.65, 8, PI / 2);
  // 1 microscope bench
  b.rbox('m', 0xe2e8f0, -15.5, 0, -2, 1.4, 0.9, 3.6); b.box('m', 0x1f2937, -15.5, 0.9, -2, 1.5, 0.08, 3.7); for (const z of [-3.2, -2, -0.8]) { b.box('x', 0x1f2937, -15.6, 0.98, z, 0.4, 0.06, 0.4); b.add('x', G.cyl, 0x0f172a, -15.6, 1.35, z, 0, 0, 0.35, 0.07, 0.6, 0.07); b.add('g', G.cyl, 0xf8fafc, -15.5, 1.4, z, 0, 0, 0, 0.12, 0.08, 0.12); } solidC(-15.5, -2, 1.5, 3.7, 1.3);
  put(grp, board(1.6, 1.2, (g, w, h) => { g.fillStyle = '#ecfccb'; g.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { g.strokeStyle = '#65a30d'; g.lineWidth = 4; g.fillStyle = '#d9f99d'; const x = (i % 5) * w / 4.6 + 20, y = Math.floor(i / 5) * h / 2.6 + 30; g.beginPath(); g.ellipse(x, y, 40, 30, i, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#4d7c0f'; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); } g.fillStyle = '#14532d'; g.font = `900 ${h * 0.12}px system-ui`; g.textAlign = 'center'; g.fillText('PLANT CELLS x400', w / 2, h * 0.93); }, 384), -17.7, 2.3, -2, PI / 2);
  // 2 matter tank: ice / water / steam
  for (const [x, c, lab] of [[-4, 0xe0f2fe, 'SOLID'], [0, 0x60a5fa, 'LIQUID'], [4, 0xf1f5f9, 'GAS']]) { b.rbox('x', 0x334155, x, 0, -9.6, 3.0, 0.7, 1.6); b.box('e', 0xbfe3ff, x, 0.7, -9.6, 2.8, 1.8, 1.4); if (lab === 'SOLID') for (let i = 0; i < 6; i++) b.add('e', G.box, 0xffffff, x - 0.8 + (i % 3) * 0.8, 0.95 + Math.floor(i / 3) * 0.5, -9.6, 0, i, 0, 0.45, 0.45, 0.45); else if (lab === 'LIQUID') b.box('e', 0x3b82f6, x, 0.72, -9.6, 2.7, 1.0, 1.3); else for (let i = 0; i < 10; i++) b.sph('e', 0xffffff, x - 1 + (i % 5) * 0.5, 1.2 + Math.floor(i / 5) * 0.6, -9.6 + (i % 2 - 0.5) * 0.4, 0.22); put(grp, sign(lab, 1.4, 0.32, { bg: '#1e3a8a', border: '#93c5fd' }), x, 2.75, -8.85); }
  solidC(0, -9.6, 11, 1.7, 2.6); put(grp, sign('🧊 STATES OF MATTER', 4, 0.5, { bg: '#0369a1', border: '#fff' }), 0, 3.4, -8.85);
  // 3 plant lab: grow shelves with glowing lights
  for (const z of [-6, -3]) { b.box('x', 0x94a3b8, 15.6, 0, z, 1.2, 2.6, 2.4); for (let k = 0; k < 3; k++) { b.box('m', 0xf8fafc, 15.6, 0.3 + k * 0.8, z, 1.2, 0.05, 2.4); b.box('l', 0xe879f9, 15.6, 0.95 + k * 0.8, z, 1.0, 0.03, 2.2, 0, 0.6); for (let i = 0; i < 4; i++) { b.cyl('m', 0xb45309, 15.6, 0.35 + k * 0.8, z - 0.9 + i * 0.6, 0.12, 0.18); b.sph('f', 0x22c55e, 15.6, 0.62 + k * 0.8, z - 0.9 + i * 0.6, 0.16 + (i % 2) * 0.05); } } solidC(15.6, z, 1.3, 2.5, 2.6); }
  put(grp, sign('🌱 PLANT LAB', 2.4, 0.45, { bg: '#15803d', border: '#fff' }), 16.9, 3.1, -4.5, -PI / 2);
  // 4 rocket bay behind glass
  b.box('m', 0x334155, 13.5, 0, 8.5, 6.5, 0.15, 6); b.box('e', 0xbfe3ff, 10.2, 0, 8.5, 0.06, 3.4, 6); solid(10, 5.5, 10.4, 11.5, 0, 3.4); b.cyl('x', 0x64748b, 14, 0.15, 8.5, 1.2, 0.3);
  b.add('g', G.cyl, 0xf8fafc, 14, 2.2, 8.5, 0, 0, 0, 0.45, 3.4, 0.45); b.add('g', G.cone, 0xdc2626, 14, 4.35, 8.5, 0, 0, 0, 0.45, 0.9, 0.45); for (let i = 0; i < 3; i++) { const a = i * 2.09; b.add('g', G.box, 0xdc2626, 14 + Math.cos(a) * 0.55, 0.9, 8.5 + Math.sin(a) * 0.55, 0, -a, 0, 0.5, 0.9, 0.06); } b.add('e', G.cyl, 0x0ea5e9, 14.3, 2.9, 8.5 + 0.44, PI / 2, 0, 0, 0.16, 0.04, 0.16);
  solidC(14, 8.5, 2, 2, 5); put(grp, sign('🚀 ROCKET BAY · SNOWIE', 3, 0.45, { bg: '#b91c1c', border: '#fff' }), 10.1, 3.7, 8.5, -PI / 2);
  // fume hood, sinks, cabinets, fire extinguisher, plants, robot arm, safety posters
  b.rbox('x', 0x94a3b8, -12, 0, -11.9, 3, 2.6, 1.1); b.box('e', 0xbfe3ff, -12, 1.0, -11.3, 2.8, 1.2, 0.04); b.box('l', 0xfef9c3, -12, 2.4, -11.6, 2.6, 0.04, 0.6, 0, 0.4); solidC(-12, -11.9, 3, 1.2, 2.6);
  for (const x of [5, 7.5]) { b.rbox('m', 0xf8fafc, x, 0, -12.2, 2.2, 0.95, 0.8); b.box('x', 0xcbd5e1, x, 0.95, -12.2, 1.2, 0.04, 0.5); b.cyl('x', 0x94a3b8, x, 0.95, -12.45, 0.03, 0.5); } solidC(6.25, -12.2, 4.8, 0.9, 1);
  for (let i = 0; i < 6; i++) b.rbox('m', [0x60a5fa, 0x34d399, 0xfbbf24][i % 3], -17.4, 0 + 0, 4.5 - i * 0.0 + (i - 2.5) * 1.1 - 6, 0.6, 1.8, 1.0); solid(-18, -9.5, -17, -2.5 - 0, 0, 2);
  b.cyl('g', 0xdc2626, -3, 0, 12.4, 0.16, 0.7); b.cyl('x', 0x111827, -3, 0.7, 12.4, 0.05, 0.15);
  for (const [x, z] of [[-17, 12], [17, 12], [17, -12]]) { b.cyl('m', 0xb45309, x, 0, z, 0.35, 0.6); b.sph('f', 0x16a34a, x, 1.1, z, 0.55, 0.7, 0.55); solidC(x, z, 0.8, 0.8, 1.5); }
  for (const [x, t, c] of [[-9, 'GOGGLES ON! 🥽', '#ca8a04'], [9, 'NO TASTING IN THE LAB 🚫👅', '#dc2626']]) put(grp, sign(t, 3.6, 0.6, { bg: c, border: '#fff' }), x, 3.4, D / 2 - 0.1, PI);
  b.finish(grp, true);
  const lights = [[-10, 2.5, -4], [10, 2.5, -4], [-10, 2.5, 5], [10, 2.5, 5], [0, 2.5, 0]].map(([x, y, z]) => { const L = new THREE.PointLight(0xf8fafc, 5, 14, 1); L.position.set(x, H - 0.6, z); grp.add(L); return L; }); void lights;
  const stops = [[-13.8, 8], [-13.6, -2], [0, -7.6], [13.6, -4.5], [8.6, 8.5]];
  stops.forEach(([x, z], i) => Z.stops.push({ x, z, i, ring: stopMarker(grp, x, z, 0x38bdf8) }));
  b.rbox('m', 0x7c2d12, 6, 0, 11.6, 2.6, 1.0, 1.0); solidC(6, 11.6, 2.6, 1.0, 1.2); put(grp, sign('LAB GIFT CART', 1.8, 0.36, { bg: '#7c2d12', border: '#fde68a' }), 6, 1.4, 11.08, PI); Z.spots.push({ x: 6, z: 10.2, r: 1.8, kind: 'shop', label: '🛍️ Lab Gift Cart (souvenirs)' });
  { const gb = new Batch(); gb.rbox('g', 0x7c2d12, 6, 0, 11.6, 0.01, 0.01, 0.01); for (let i = 0; i < 3; i++) gb.add('g', G.cone, [0xdc2626, 0x2563eb, 0xf8fafc][i], 5.3 + i * 0.7, 1.25, 11.6, 0, 0, 0, 0.12, 0.45, 0.12); gb.finish(grp); }
  Z.spawn = { x: 0, z: 8.8, yaw: PI }; S.busDoor = { x: 0, z: D / 2 - 1.6 };
  Z.guide = { id: 'luna', x: -1.6, z: 5.6, yaw: PI * 0.15 }; Z.extra = [['snowie', 12, 6, -PI / 2]]; Z.anchors = [[0, -2, 6], [-8, 7, 4], [8, -1, 4]];
  Z.bounds = { x0: -W / 2 + 0.5, x1: W / 2 - 0.5, z0: -D / 2 + 0.5, z1: D / 2 - 0.5 };
  Z.env = { skyTop: 0x93c5fd, skyMid: 0xe0f2fe, skyBot: 0xf8fafc, sunDir: [0.3, 0.9, 0.25], sunColor: 0xffffff, sunI: 0.8, hemiSky: 0xf8fafc, hemiGround: 0x94a3b8, hemiI: 0.8, exposure: 0.74, fog: 0xe0f2fe, fogD: 0.002, envI: 0.75, bloomT: 1.5, bloomS: 0.08 };
  return Z; }

const BUILD = { desert: buildDesert, lab: buildLab, airport: (g, S) => buildAirport(g, S), farm: (g, S) => buildFarm(g, S), puptown: (g, S) => buildPuptown(g, S) };
export function buildZone(id, grp, S) { COL.boxes.length = 0; return (BUILD[id] || buildHub)(grp, S); }
// free GPU + canvas memory of a zone (shared MATS are kept)
export function disposeZone(grp) { const shared = new Set(Object.values(MATS)); grp.traverse((o) => { if (o.geometry && !o.geometry.userData.keep) o.geometry.dispose(); const m = o.material; if (m && !shared.has(m)) { (Array.isArray(m) ? m : [m]).forEach((mm) => { if (mm.map) { mm.map.dispose(); mm.map.image = null; } mm.dispose(); }); } });
  while (grp.children.length) grp.remove(grp.children[0]); }
