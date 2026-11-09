// Field Trips DLC zones, part 2: Airport Geography (Ratita Airways terminal), Harvest Hollow Farm (Torty's farm) and Pup Town Community
// Helpers (Main Street). Same rules as zones.js: one zone at a time, batched props, solid colliders, canvas boards never stretched.
import * as THREE from 'three';
import { Batch, G, solid, solidC, sign, PI } from './kit.js';
import { rng } from './util.js';
import { board, bus, put, lamp, bench, tree, planter, stopMarker, infoPost, rock } from './zones.js';

const rot = (x, z, ry) => { const c = Math.cos(ry), s = Math.sin(ry); return (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; };

// ============================================================ AIRPORT (Ratita Airways terminal, Gate R1)
function plane(b, grp, x, z, ry, s = 1) { const P = rot(x, z, ry); const at = (lx, lz) => P(lx * s, lz * s); // nose points local +x
  const [fx, fz] = at(0, 0); b.add('g', G.cyl, 0xf8fafc, fx, 2.2 * s, fz, 0, ry, PI / 2, 1.3 * s, 22 * s, 1.3 * s); { const [nx, nz] = at(11, 0); b.add('g', G.sph, 0xf8fafc, nx, 2.2 * s, nz, 0, ry, 0, 2.2 * s, 1.3 * s, 1.3 * s); const [cx, cz] = at(12.2, 0); b.add('e', G.box, 0x1e293b, cx, 2.7 * s, cz, 0, ry, 0, 0.8 * s, 0.4 * s, 1.4 * s); }
  { const [tx, tz] = at(-11.5, 0); b.add('g', G.cone, 0xf8fafc, tx, 2.4 * s, tz, 0, ry, -PI / 2, 1.25 * s, 3 * s, 1.25 * s); const [fx2, fz2] = at(-11, 0); b.add('g', G.box, 0x7c3aed, fx2, 4.4 * s, fz2, 0, ry, 0.35, 2.6 * s, 3.6 * s, 0.18 * s); for (const sd of [-1, 1]) { const [hx, hz] = at(-11.6, sd * 2.2); b.add('g', G.box, 0xf8fafc, hx, 2.6 * s, hz, 0, ry, 0, 1.6 * s, 0.12 * s, 3.6 * s); } }
  for (const sd of [-1, 1]) { const [wx, wz] = at(-0.5, sd * 6); b.add('g', G.box, 0xe2e8f0, wx, 1.7 * s, wz, 0, ry + sd * 0.25, 0, 3.6 * s, 0.22 * s, 10 * s); const [ex, ez] = at(1, sd * 4.2); b.add('x', G.cyl, 0x94a3b8, ex, 1.15 * s, ez, 0, ry, PI / 2, 0.65 * s, 2.6 * s, 0.65 * s); b.add('m', G.cyl, 0x111827, ...at(2.32, sd * 4.2).flatMap((v, i) => i === 0 ? [v, 1.15 * s] : [v]), 0, ry, PI / 2, 0.55 * s, 0.05 * s, 0.55 * s); }
  for (let i = 0; i < 14; i++) for (const sd of [-1, 1]) { const [wx, wz] = at(-8 + i * 1.3, sd * 1.27); b.add('e', G.box, 0x1e3a8a, wx, 2.55 * s, wz, 0, ry, 0, 0.42 * s, 0.4 * s, 0.05 * s); }
  for (const sd of [-1, 1]) { const [sx, sz] = at(-2, sd * 1.31); b.add('m', G.box, 0x7c3aed, sx, 1.75 * s, sz, 0, ry, 0, 18 * s, 0.25 * s, 0.04 * s); }
  for (const [lx, lz] of [[8, 0], [-1, 2.6], [-1, -2.6]]) { const [gx, gz] = at(lx, lz); b.add('x', G.cyl, 0x334155, gx, 0.6 * s, gz, 0, 0, 0, 0.08 * s, 1.2 * s, 0.08 * s); b.add('m', G.cyl, 0x111827, gx, 0.35 * s, gz, PI / 2, ry, 0, 0.35 * s, 0.3 * s, 0.35 * s); } }
export function buildAirport(grp, S) { const r = rng(7781); const b = new Batch(24); const Z = { name: 'Ratita Airways Terminal', spots: [], stops: [], anchors: [], indoor: true };
  const W = 40, D = 28, H = 7;
  b.box('m', 0xe7e5e4, 0, -0.05, 0, W, 0.05, D); for (let z = -D / 2 + 2; z < D / 2; z += 4) b.box('m', 0xd6d3d1, 0, 0.004, z, W, 0.01, 0.12); b.box('m', 0x7c3aed, 0, 0.006, 0, 2.2, 0.01, D - 1); // purple guide stripe
  const wc = 0xdbe4f0; b.box('w', wc, -W / 2 - 0.2, 0, 0, 0.4, H, D); b.box('w', wc, W / 2 + 0.2, 0, 0, 0.4, H, D); b.box('w', wc, -11.5, 0, D / 2 + 0.2, 17, H, 0.4); b.box('w', wc, 11.5, 0, D / 2 + 0.2, 17, H, 0.4); b.box('w', wc, 0, 3.4, D / 2 + 0.2, 6, H - 3.4, 0.4);
  b.box('m', 0x475569, 0, 0, -D / 2 - 0.2, W, 0.8, 0.4); b.box('e', 0xbfe3ff, 0, 0.8, -D / 2 - 0.2, W, H - 1.4, 0.06); b.box('w', wc, 0, H - 0.6, -D / 2 - 0.2, W, 0.6, 0.4); for (let x = -W / 2; x <= W / 2; x += 4) b.box('x', 0x64748b, x, 0.8, -D / 2 - 0.2, 0.16, H - 1.4, 0.2); // north window wall
  b.box('w', 0xf8fafc, 0, H, 0, W + 0.8, 0.2, D + 0.8); for (let x = -16; x <= 16; x += 8) for (const z of [-8, 0, 8]) b.box('l', 0xf8fafc, x, H - 0.1, z, 4, 0.06, 1.2, 0, 0.5);
  solid(-W / 2 - 1, -D / 2 - 1, W / 2 + 1, -D / 2, 0, H); solid(-W / 2 - 1, -D / 2, -W / 2, D / 2 + 1, 0, H); solid(W / 2, -D / 2, W / 2 + 1, D / 2 + 1, 0, H); solid(-W / 2, D / 2, -3, D / 2 + 1, 0, H); solid(3, D / 2, W / 2, D / 2 + 1, 0, H); solid(-3, D / 2 + 0.6, 3, D / 2 + 1.5, 0, H);
  for (const [x, z] of [[-10, -4], [10, 0.5], [-10, 6], [3, -4]]) { b.cyl('m', 0xf1f5f9, x, 0, z, 0.45, H); b.cyl('m', 0x7c3aed, x, 0, z, 0.5, 0.3); solidC(x, z, 1, 1, H); }
  // apron outside the glass: planes, jet bridge, tower, runway lights
  { const a = new Batch(); a.box('m', 0x6b7280, 0, -0.06, -60, 140, 0.05, 92); a.box('g', 0x6fae4f, 0, -0.08, -60, 400, 0.04, 300); for (let x = -60; x <= 60; x += 6) a.box('l', 0xfde047, x, -0.02, -46, 3, 0.01, 0.2, 0, 0.3); a.box('m', 0x374151, 0, -0.03, -70, 150, 0.02, 10); for (let x = -70; x <= 70; x += 5) a.box('l', 0xffffff, x, 0.0, -70, 2.4, 0.01, 0.3, 0, 0.5);
    plane(a, grp, -6, -27, PI / 2 + 0.15, 1.0); plane(a, grp, 26, -38, 0.2, 0.9); a.box('x', 0x94a3b8, -4.6, 2.2, -18.5, 2.4, 2.4, 9, 0); a.cyl('x', 0x64748b, -4.6, 0, -22, 0.3, 2.2);
    a.cyl('m', 0xe5e7eb, -34, 0, -44, 1.6, 16); a.cyl('e', 0x67e8f9, -34, 16, -44, 3.2, 3); a.cyl('m', 0x334155, -34, 19, -44, 3.4, 0.4); for (const [x, z] of [[14, -22], [18, -22], [22, -20]]) a.rbox('g', [0xfacc15, 0x60a5fa, 0xf97316][(x / 4) % 3 | 0], x, 0, z, 2.2, 1.2, 1.4);
    a.finish(grp); }
  put(grp, sign('✈️ RATITA AIRWAYS · GROK AIRPORT', 10, 1.0, { bg: '#4c1d95', border: '#fde047' }), 0, 6.05, -D / 2 + 0.2);
  // exit to the bus
  b.box('m', 0x7c3aed, 0, 0, D / 2 - 0.02, 6, 3.4, 0.06); b.box('e', 0x9bd5ff, 0, 0.3, D / 2 - 0.08, 5, 2.8, 0.03); put(grp, sign('EXIT · SCHOOL BUS 🚌', 2.6, 0.45, { bg: '#16a34a', border: '#fff' }), 0, 3.8, D / 2 - 0.1, PI);
  Z.spots.push({ x: 0, z: D / 2 - 1.6, r: 2.2, kind: 'bus', label: '🚌 Back to the bus (Depot)' });
  // 0 world floor map
  const fm = board(10, 6, (g, w, h) => { g.fillStyle = '#1d4ed8'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; for (let x = 0; x < w; x += w / 12) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += h / 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = '#fde047'; g.setLineDash([12, 10]); g.lineWidth = 4; g.beginPath(); g.moveTo(0, h * 0.52); g.lineTo(w, h * 0.52); g.stroke(); g.setLineDash([]);
    const C = [['NORTH\nAMERICA', 0.2, 0.28, 0.13, 0.15, '#22c55e'], ['SOUTH\nAMERICA', 0.29, 0.66, 0.06, 0.15, '#84cc16'], ['EUROPE', 0.5, 0.24, 0.055, 0.07, '#f59e0b'], ['AFRICA', 0.52, 0.55, 0.075, 0.16, '#eab308'], ['ASIA', 0.7, 0.3, 0.15, 0.14, '#f97316'], ['AUSTRALIA', 0.83, 0.7, 0.06, 0.06, '#ef4444'], ['ANTARCTICA', 0.5, 0.94, 0.3, 0.04, '#f8fafc']];
    for (const [n, x, y, rx, ry, c] of C) { g.fillStyle = c; g.beginPath(); g.ellipse(x * w, y * h, rx * w, ry * h, 0.2, 0, 7); g.fill(); g.fillStyle = '#0f172a'; g.font = `900 ${h * 0.04}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; n.split('\n').forEach((l, i, a) => g.fillText(l, x * w, y * h + (i - (a.length - 1) / 2) * h * 0.045)); }
    g.fillStyle = '#bfdbfe'; g.font = `italic 800 ${h * 0.04}px system-ui`; g.fillText('PACIFIC OCEAN', w * 0.06 + 40, h * 0.5); g.fillText('ATLANTIC', w * 0.4, h * 0.42); g.fillText('INDIAN OCEAN', w * 0.68, h * 0.62); g.fillText('ARCTIC OCEAN', w * 0.5, h * 0.05); g.fillText('SOUTHERN OCEAN', w * 0.25, h * 0.86); g.fillStyle = '#fde047'; g.fillText('EQUATOR', w * 0.92, h * 0.49); }, 1024);
  fm.rotation.x = -PI / 2; fm.position.set(-8, 0.03, 1.5); grp.add(fm); b.box('m', 0xfacc15, -8, 0.0, 1.5, 10.4, 0.02, 6.4);
  // 1 compass rose
  const cr = board(4, 4, (g, w, h) => { g.fillStyle = '#f8fafc'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.48, 0, 7); g.fill(); g.strokeStyle = '#1e3a8a'; g.lineWidth = 8; g.stroke(); const c = w / 2;
    for (let i = 0; i < 8; i++) { const a = i * PI / 4, L = i % 2 ? w * 0.22 : w * 0.4; g.fillStyle = i % 2 ? '#93c5fd' : (i === 0 ? '#dc2626' : '#1e3a8a'); g.beginPath(); g.moveTo(c + Math.sin(a) * L, c - Math.cos(a) * L); g.lineTo(c + Math.sin(a + 0.3) * w * 0.07, c - Math.cos(a + 0.3) * w * 0.07); g.lineTo(c + Math.sin(a - 0.3) * w * 0.07, c - Math.cos(a - 0.3) * w * 0.07); g.fill(); }
    g.fillStyle = '#0f172a'; g.font = `900 ${w * 0.08}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]].forEach(([t, dx, dy]) => g.fillText(t, c + dx * w * 0.43 * 0.92, c + dy * w * 0.43 * 0.92)); }, 512);
  cr.material.transparent = true; cr.rotation.x = -PI / 2; cr.position.set(8, 0.03, 5); grp.add(cr);
  // 2 time zone clocks on the west wall
  const cities = [['ZACATECAS', -6, 'NORTH AMERICA'], ['CUSCO', -5, 'SOUTH AMERICA'], ['CAIRO', 2, 'AFRICA'], ['TOKYO', 9, 'ASIA']];
  cities.forEach(([n, off, cont], i) => { const z = -9 + i * 3.4; const hr = (((12 + off + 6) % 24) + 24) % 24; const ck = board(2.4, 2.6, (g, w, h) => { g.fillStyle = '#0f172a'; g.fillRect(0, 0, w, h); const c = w / 2, cy = h * 0.42, R = w * 0.36; g.fillStyle = hr >= 7 && hr < 19 ? '#fef9c3' : '#312e81'; g.beginPath(); g.arc(c, cy, R, 0, 7); g.fill(); g.strokeStyle = '#facc15'; g.lineWidth = 8; g.stroke();
      const hh = hr % 12; g.strokeStyle = hr >= 7 && hr < 19 ? '#0f172a' : '#f8fafc'; g.lineWidth = 10; g.beginPath(); g.moveTo(c, cy); g.lineTo(c + Math.sin(hh / 12 * PI * 2) * R * 0.5, cy - Math.cos(hh / 12 * PI * 2) * R * 0.5); g.stroke(); g.lineWidth = 6; g.beginPath(); g.moveTo(c, cy); g.lineTo(c, cy - R * 0.8); g.stroke();
      g.font = `${h * 0.1}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(hr >= 7 && hr < 19 ? '☀️' : '🌙', c + R * 0.55, cy + R * 0.5); g.fillStyle = '#fde047'; g.font = `900 ${h * 0.08}px system-ui`; g.fillText(n, c, h * 0.84); g.fillStyle = '#93c5fd'; g.font = `800 ${h * 0.05}px system-ui`; g.fillText(cont, c, h * 0.93); }, 384);
    put(grp, ck, -W / 2 + 0.05, 3.6, z, PI / 2); });
  put(grp, sign('🕐 WORLD TIME ZONES', 5, 0.6, { bg: '#1e3a8a', border: '#fde047' }), -W / 2 + 0.06, 5.6, -4, PI / 2);
  // 3 giant globe
  b.cyl('x', 0x334155, 10, 0, -6, 0.9, 0.4); b.cyl('x', 0x94a3b8, 10, 0, -6, 0.12, 1.6); b.sph('g', 0x2563eb, 10, 3.1, -6, 1.6); for (const [a, e, sx] of [[0.3, 0.4, 0.7], [1.6, -0.1, 0.6], [2.6, 0.5, 0.8], [3.9, -0.4, 0.5], [5.0, 0.2, 0.6], [4.4, 0.9, 0.9]]) b.add('g', G.sph, [0x22c55e, 0x84cc16, 0xf59e0b][Math.round(a) % 3], 10 + Math.cos(a) * Math.cos(e) * 1.42, 3.1 + Math.sin(e) * 1.42, -6 + Math.sin(a) * Math.cos(e) * 1.42, 0, -a, e, 0.3, sx * 0.8, sx);
  { const eq = new THREE.Mesh(new THREE.TorusGeometry(1.66, 0.04, 6, 48), new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xfde047, emissiveIntensity: 0.6 })); eq.rotation.x = PI / 2; eq.position.set(10, 3.1, -6); grp.add(eq); } b.add('x', G.cyl, 0xcbd5e1, 10, 3.1, -6, 0, 0, 0.41, 0.05, 3.8, 0.05); solidC(10, -6, 2.2, 2.2, 5);
  put(grp, sign('🌐 OUR PLANET EARTH', 3, 0.5, { bg: '#0369a1', border: '#fff' }), 10, 0.75, -4.95);
  // 4 Gate R1 (desk, seats, window)
  b.rbox('m', 0x4c1d95, -4, 0, -10.6, 3.2, 1.1, 0.9); b.box('g', 0xede9fe, -4, 1.1, -10.6, 3.3, 0.06, 1.0); b.box('l', 0x67e8f9, -4.6, 1.2, -10.7, 0.5, 0.35, 0.04, 0, 0.6); solidC(-4, -10.6, 3.3, 1, 1.2);
  put(grp, sign('GATE R1 · BOARDING ✈️ CUSCO', 4.6, 0.5, { bg: '#111827', border: '#22d3ee', fg: '#67e8f9' }), -4, 3.4, -11.3);
  for (const z of [-7.2, -5.2]) for (let i = 0; i < 6; i++) { const x = -17 + i * 0.85; b.rbox('m', 0x7c3aed, x, 0.42, z, 0.7, 0.12, 0.7); b.rbox('m', 0x7c3aed, x, 0.5, z + 0.32, 0.7, 0.6, 0.1); b.box('x', 0x475569, x, 0, z, 0.06, 0.42, 0.06); } solidC(-14.9, -7.2, 5.4, 1, 1.1); solidC(-14.9, -5.2, 5.4, 1, 1.1);
  for (let i = 0; i < 5; i++) { const x = 1 + i * 0.85; b.rbox('m', 0x2563eb, x, 0.42, -12.6, 0.7, 0.12, 0.7); b.rbox('m', 0x2563eb, x, 0.5, -12.9, 0.7, 0.6, 0.1); } solidC(2.7, -12.7, 4.4, 0.9, 1.1);
  // departures board on the east wall
  put(grp, board(7, 3.2, (g, w, h) => { g.fillStyle = '#0b1020'; g.fillRect(0, 0, w, h); g.fillStyle = '#fde047'; g.font = `900 ${h * 0.1}px monospace`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('DEPARTURES  ✈️', w * 0.04, h * 0.09);
    [['RA 101', 'CUSCO', 'S. AMERICA', 'R1', 'BOARDING'], ['RA 220', 'CAIRO', 'AFRICA', 'R2', 'ON TIME'], ['RA 305', 'TOKYO', 'ASIA', 'R3', 'ON TIME'], ['RA 412', 'PARIS', 'EUROPE', 'R4', 'DELAYED'], ['RA 518', 'SYDNEY', 'AUSTRALIA', 'R2', 'ON TIME'], ['RA 600', 'ZACATECAS', 'N. AMERICA', 'R1', 'ON TIME']].forEach((r, i) => { const y = h * 0.24 + i * h * 0.125;
      g.font = `800 ${h * 0.065}px monospace`; [0.04, 0.2, 0.44, 0.72, 0.8].forEach((x, k) => { g.fillStyle = k === 4 ? (r[4] === 'DELAYED' ? '#f87171' : r[4] === 'BOARDING' ? '#4ade80' : '#e2e8f0') : k === 2 ? '#93c5fd' : '#f8fafc'; g.fillText(r[k], w * x, y); }); }); }, 768), W / 2 - 0.06, 3.9, -3, -PI / 2);
  // check-in counters + luggage
  for (let i = 0; i < 4; i++) { const x = -17 + i * 3; b.rbox('m', 0xf1f5f9, x, 0, 9.5, 2.4, 1.1, 1.0); b.box('m', 0x7c3aed, x, 0.3, 9.0, 2.4, 0.5, 0.02); b.box('x', 0x334155, x + 0.6, 1.1, 9.5, 0.6, 0.06, 0.6); b.box('l', 0x67e8f9, x - 0.5, 1.4, 9.7, 0.5, 0.35, 0.04, 0, 0.5); }
  b.box('x', 0x475569, -12.5, 0.4, 10.8, 12, 0.2, 0.8); solid(-18.6, 8.9, -6.4, 11.3, 0, 1.2); put(grp, sign('RATITA AIRWAYS · CHECK-IN', 7, 0.7, { bg: '#4c1d95', border: '#fde047' }), -12.5, 3.2, 12.4, PI);
  for (let i = 0; i < 6; i++) b.rbox('g', [0xef4444, 0x3b82f6, 0x22c55e, 0xfacc15, 0xf97316, 0xa855f7][i], -17.6 + i * 2.1, 0.5, 10.8, 0.7, 0.5, 0.45);
  // baggage carousel
  b.rbox('x', 0x334155, 12, 0, 9, 7, 0.6, 2.6); b.box('m', 0x111827, 12, 0.6, 9, 6.6, 0.05, 2.2); for (let i = 0; i < 7; i++) b.rbox('g', [0x7c3aed, 0xef4444, 0x0ea5e9, 0x16a34a][i % 4], 9.4 + i * 0.85, 0.65, 9 + (i % 2 ? 0.5 : -0.5), 0.6, 0.45, 0.35); solidC(12, 9, 7, 2.6, 1); put(grp, sign('🧳 BAGGAGE CLAIM', 3, 0.5, { bg: '#0f172a', border: '#facc15' }), 12, 3.4, 12.6, PI);
  // cafe kiosk + plants + bins
  b.rbox('m', 0xf59e0b, 16, 0, -11, 4, 1.1, 1.4); b.box('m', 0xfef3c7, 16, 1.1, -11, 4.1, 0.06, 1.5); b.box('m', 0x92400e, 16, 3.0, -11, 4.4, 0.15, 2.2); for (const sx of [-1.9, 1.9]) b.cyl('x', 0x92400e, 16 + sx, 1.1, -10.4, 0.06, 1.9); solidC(16, -11, 4, 1.4, 3.1); put(grp, sign('🧀 CHEESE & CO. CAFE', 3.6, 0.55, { bg: '#92400e', border: '#fde68a' }), 16, 3.5, -9.85);
  for (const [x, z] of [[-18.5, -12.5], [18.5, -1], [-18.5, 12.5], [6, 12.6], [-6, 12.6]]) { b.cyl('m', 0x9ca3af, x, 0, z, 0.4, 0.7); b.sph('f', 0x16a34a, x, 1.2, z, 0.6, 0.8, 0.6); solidC(x, z, 0.9, 0.9, 1.6); }
  // sky shop (souvenirs)
  b.rbox('m', 0x0e7490, 15, 0, 2.6, 3, 1.0, 1.0); b.box('e', 0xcffafe, 15, 1.0, 2.6, 2.9, 0.6, 0.9); solidC(15, 2.6, 3, 1, 1.6); b.sph('g', 0x2563eb, 14.3, 1.25, 2.6, 0.2); b.add('g', G.box, 0x7c3aed, 15.5, 1.2, 2.6, 0, 0.3, 0, 0.6, 0.1, 0.2);
  put(grp, sign('🛍️ SKY SHOP', 2.2, 0.45, { bg: '#0e7490', border: '#fde68a' }), 15, 2.1, 3.12); Z.spots.push({ x: 15, z: 4.0, r: 1.8, kind: 'shop', label: '🛍️ Sky Shop (souvenirs)' });
  // hanging model plane over the floor map, queue posts, security arch, vending machines, luggage carts, hanging gate signs
  { const hg = new THREE.Group(); const hb = new Batch(); plane(hb, hg, 0, 0, 0.5, 0.2); hb.finish(hg); hg.position.set(-8, 4.6, 1.5); grp.add(hg); for (const dx of [-1.2, 1.2]) b.cyl('x', 0x94a3b8, -8 + dx, 5.1, 1.5, 0.015, H - 5.1); }
  for (let i = 0; i < 6; i++) { const x = -17 + i * 2, z = 6.6; b.cyl('x', 0x94a3b8, x, 0, z, 0.05, 1.0); b.cyl('x', 0x475569, x, 0, z, 0.2, 0.05); if (i < 5) b.add('m', G.box, 0x7c3aed, x + 1, 0.9, z, 0, 0, 0, 2, 0.08, 0.04); } solid(-17.2, 6.45, -6.8, 6.75, 0, 1);
  b.box('x', 0x94a3b8, 5.2, 0, -8.5, 0.3, 2.6, 0.5); b.box('x', 0x94a3b8, 6.8, 0, -8.5, 0.3, 2.6, 0.5); b.box('x', 0x94a3b8, 6, 2.6, -8.5, 1.9, 0.3, 0.5); b.box('l', 0x22c55e, 6, 2.5, -8.24, 0.3, 0.12, 0.02, 0, 0.8); solidC(5.2, -8.5, 0.3, 0.5, 2.6); solidC(6.8, -8.5, 0.3, 0.5, 2.6); b.rbox('x', 0x334155, 8.6, 0, -8.5, 2.2, 0.9, 0.8); b.box('m', 0x111827, 8.6, 0.9, -8.5, 2.0, 0.04, 0.6); solidC(8.6, -8.5, 2.2, 0.8, 1);
  put(grp, sign('🛂 SECURITY', 1.9, 0.36, { bg: '#0f172a', border: '#22c55e' }), 6, 3.2, -8.24);
  [[19.3, 7.0, 0xdc2626], [19.3, 5.6, 0x2563eb]].forEach(([x, z, c]) => { b.rbox('g', c, x, 0, z, 0.8, 2.1, 1.2); b.box('e', 0xe0f2fe, x - 0.41, 0.9, z, 0.02, 0.9, 0.8); for (let k = 0; k < 6; k++) b.sph('g', [0xfacc15, 0xf97316, 0x22c55e][k % 3], x - 0.3, 1.0 + (k % 3) * 0.28, z - 0.25 + Math.floor(k / 3) * 0.5, 0.08); solidC(x, z, 0.8, 1.2, 2.1); });
  for (const [x, z] of [[-4.5, 10.8], [4.5, 9.8]]) { b.box('x', 0x64748b, x, 0.2, z, 1.4, 0.06, 0.7); b.box('x', 0x64748b, x - 0.68, 0.2, z, 0.05, 1.0, 0.7); for (const sx of [-0.5, 0.5]) for (const sz of [-0.3, 0.3]) b.sph('m', 0x111827, x + sx, 0.1, z + sz, 0.08); b.rbox('g', 0xef4444, x + 0.1, 0.26, z, 0.9, 0.5, 0.5); b.rbox('g', 0x0ea5e9, x + 0.1, 0.76, z, 0.7, 0.4, 0.4); solidC(x, z, 1.5, 0.8, 1.2); }
  for (const [x, z, t] of [[-4, -2.5, '✈️ GATES R1–R4  ⬆'], [12, 4.5, '🧳 BAGGAGE  ⬇  ·  🛍️ SKY SHOP ➡']]) { const sg = sign(t, 4.2, 0.5, { bg: '#111827', border: '#facc15', fg: '#fde047' }); put(grp, sg, x, 5.2, z); const sg2 = sg.clone(); put(grp, sg2, x, 5.2, z - 0.02, PI); b.cyl('x', 0x94a3b8, x - 1.8, 5.45, z, 0.02, H - 5.45); b.cyl('x', 0x94a3b8, x + 1.8, 5.45, z, 0.02, H - 5.45); }
  b.finish(grp, true);
  [[-10, 5.4, -4], [10, 5.4, -4], [-10, 5.4, 7], [10, 5.4, 7]].forEach(([x, y, z]) => { const L = new THREE.PointLight(0xf8fafc, 5, 16, 1); L.position.set(x, y, z); grp.add(L); });
  const stops = [[-8, 1.5], [8, 5], [-17.4, -2], [10, -3.6], [-1.2, -11.6]]; stops.forEach(([x, z], i) => Z.stops.push({ x, z, i, ring: stopMarker(grp, x, z, 0x22d3ee) }));
  Z.spawn = { x: 0, z: 8.4, yaw: PI }; S.busDoor = { x: 0, z: D / 2 - 1.6 };
  Z.guide = { id: 'snowie', x: -2.4, z: 5.4, yaw: PI * 0.1 }; Z.extra = [['luna', -6.6, -10.2, PI * 0.15, ['tie', 'headset']]]; Z.anchors = [[0, -2, 6], [-12, 4, 4], [12, -4, 4]];
  Z.bounds = { x0: -W / 2 + 0.5, x1: W / 2 - 0.5, z0: -D / 2 + 0.6, z1: D / 2 - 0.5 };
  Z.env = { skyTop: 0x3b82f6, skyMid: 0xbfdbfe, skyBot: 0xe0f2fe, sunDir: [0.3, 0.8, -0.5], sunColor: 0xfff4dc, sunI: 1.4, hemiSky: 0xf8fafc, hemiGround: 0x94a3b8, hemiI: 0.85, exposure: 0.78, fog: 0xdbeafe, fogD: 0.004, envI: 0.75, bloomT: 1.4, bloomS: 0.1 };
  void r; return Z; }

// ============================================================ HARVEST HOLLOW FARM (Torty's farm)
function cow(b, x, z, ry) { const P = rot(x, z, ry); const W = 0xf8fafc, K = 0x1f2937; b.add('m', G.box, W, x, 1.15, z, 0, ry, 0, 2.0, 0.95, 0.95); for (const [lx, ly, lz, s] of [[0.4, 1.4, 0.48, 0.32], [-0.5, 1.1, -0.48, 0.38], [-0.2, 1.5, 0.2, 0.3]]) { const [sx, sz] = P(lx, lz); b.add('m', G.sph, K, sx, ly, sz, 0, ry, 0, s, s * 0.8, 0.06); }
  const [hx, hz] = P(1.25, 0); b.add('m', G.box, W, hx, 1.5, hz, 0, ry, 0, 0.6, 0.6, 0.55); const [mx, mz] = P(1.58, 0); b.add('m', G.box, 0xf9a8d4, mx, 1.35, mz, 0, ry, 0, 0.12, 0.34, 0.5);
  for (const sd of [-1, 1]) { const [ex, ez] = P(1.4, sd * 0.2); b.add('g', G.sph, K, ex, 1.62, ez, 0, 0, 0, 0.06); const [hx2, hz2] = P(1.15, sd * 0.32); b.add('m', G.cone, 0xfef3c7, hx2, 1.9, hz2, 0, 0, sd * 0.5, 0.06, 0.2, 0.06); }
  for (const [lx, lz] of [[0.75, 0.3], [0.75, -0.3], [-0.75, 0.3], [-0.75, -0.3]]) { const [lx2, lz2] = P(lx, lz); b.add('m', G.box, W, lx2, 0.35, lz2, 0, ry, 0, 0.2, 0.7, 0.2); b.add('m', G.box, K, lx2, 0.05, lz2, 0, ry, 0, 0.22, 0.1, 0.22); }
  const [ux, uz] = P(-0.2, 0); b.add('m', G.sph, 0xf9a8d4, ux, 0.68, uz, 0, 0, 0, 0.22, 0.12, 0.22); solidC(x, z, 2.2, 2.2, 1.8); }
function fence(b, x0, z0, x1, z1, col = 0xf8fafc) { const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0); for (let k = 0; k <= L; k += 2) { const t = k / L; b.box('m', col, x0 + (x1 - x0) * t, 0, z0 + (z1 - z0) * t, 0.15, 1.1, 0.15); } for (const y of [0.45, 0.9]) b.add('m', G.box, col, (x0 + x1) / 2, y, (z0 + z1) / 2, 0, ry, 0, 0.08, 0.12, L); solid(Math.min(x0, x1) - 0.15, Math.min(z0, z1) - 0.15, Math.max(x0, x1) + 0.15, Math.max(z0, z1) + 0.15, 0, 1.1); }
export function buildFarm(grp, S) { const r = rng(4410); const b = new Batch(24); const Z = { name: 'Harvest Hollow Farm', spots: [], stops: [], anchors: [] };
  const g0 = new Batch(); g0.box('g', 0x7cb342, 0, -0.05, 0, 220, 0.05, 220); g0.finish(grp);
  b.box('m', 0xb08a5a, 0, 0, 5, 3, 0.02, 38); b.box('m', 0xb08a5a, -4, 0, -2, 34, 0.02, 2.6); // dirt lanes
  // barn + silo
  const BX = -14, BZ = -13; b.box('m', 0xb91c1c, BX, 0, BZ, 10, 5, 8); b.add('m', G.prism, 0x7f1d1d, BX, 5, BZ, 0, 0, 0, 10.8, 3.2, 8.6); b.box('m', 0xf8fafc, BX, 0, BZ + 4.02, 4, 3.6, 0.06); for (const sd of [-1, 1]) b.add('m', G.box, 0xb91c1c, BX + sd * 1, 1.8, BZ + 4.06, 0, 0, sd * 1.06, 0.18, 4.0, 0.04); b.box('m', 0xf8fafc, BX, 5.4, BZ + 4.02, 1.6, 1.4, 0.06); b.box('m', 0x7f1d1d, BX, 5.5, BZ + 4.06, 1.3, 1.1, 0.04); b.box('m', 0x1f2937, BX, 0, BZ + 4.05, 3.6, 3.3, 0.02); solid(BX - 5, BZ - 4, BX + 5, BZ + 4.1, 0, 8);
  put(grp, sign("TORTY'S FARM · HARVEST HOLLOW", 5.4, 0.7, { bg: '#7f1d1d', border: '#fde68a' }), BX, 4.4, BZ + 4.1);
  b.cyl('g', 0xcbd5e1, BX + 8, 0, BZ - 2, 1.8, 10); b.sph('g', 0x94a3b8, BX + 8, 10, BZ - 2, 1.8, 1.2, 1.8); for (let y = 1; y < 10; y += 2) b.cyl('x', 0x94a3b8, BX + 8, y, BZ - 2, 1.84, 0.08); solidC(BX + 8, BZ - 2, 3.6, 3.6, 11);
  for (const [x, z] of [[-7.6, -9], [-8.4, -7.6], [-17.5, -7.4]]) { b.add('m', G.cyl, 0xfacc15, x, 0.55, z, PI / 2, 0.3, 0, 0.55, 1.2, 0.55); solidC(x, z, 1.3, 1.3, 1.1); }
  // pasture + cows (west of the barn)
  fence(b, -30, -18, -20, -18); fence(b, -30, -18, -30, -4); fence(b, -30, -4, -24, -4); fence(b, -21, -4, -20, -4); fence(b, -20, -18, -20, -4);
  cow(b, -26, -12, 0.4); cow(b, -23, -7, -1.9); b.cyl('x', 0x64748b, -22, 0, -15.5, 0.9, 0.6); b.box('e', 0x60a5fa, -22, 0.5, -15.5, 1.4, 0.04, 1.4);
  // corn field (rows) + scarecrow + windmill
  for (let rI = 0; rI < 7; rI++) for (let i = 0; i < 9; i++) { const x = 7 + rI * 1.9, z = -19 + i * 1.5; const h = 1.9 + r() * 0.5; b.add('f', G.cyl, 0x4d7c0f, x, h / 2, z, 0, 0, 0, 0.06, h, 0.06); b.add('f', G.box, 0x65a30d, x, h * 0.6, z, 0, i, 0.6, 0.06, 0.9, 0.22); b.add('f', G.box, 0x65a30d, x, h * 0.45, z, 0, i + 2, -0.6, 0.06, 0.8, 0.2); if ((i + rI) % 2) b.add('g', G.sph, 0xfacc15, x + 0.12, h * 0.55, z, 0, 0, 0.3, 0.08, 0.22, 0.08); }
  solid(6.2, -19.8, 19.6, -6.6, 0, 2.4); b.box('m', 0x8a6a3b, 13, 0, -13, 13.6, 0.03, 13.6);
  b.cyl('m', 0x6b4426, 13, 0, -5.8, 0.08, 2.4); b.add('m', G.box, 0x6b4426, 13, 1.9, -5.8, 0, 0, 0, 1.6, 0.08, 0.08); b.sph('m', 0xfde68a, 13, 2.6, -5.8, 0.28); b.add('m', G.cone, 0xa16207, 13, 2.95, -5.8, 0, 0, 0, 0.45, 0.35, 0.45); b.box('m', 0x2563eb, 13, 1.3, -5.8, 0.6, 0.8, 0.3); solidC(13, -5.8, 0.6, 0.6, 2.6);
  b.cyl('m', 0xe5e7eb, 24, 0, -20, 0.35, 9); for (let i = 0; i < 4; i++) { const a = i * PI / 2 + 0.3; b.add('m', G.box, 0xf8fafc, 24 + Math.cos(a) * 1.2, 9 + Math.sin(a) * 1.2, -19.6, 0, 0, a, 2.4, 0.4, 0.05); } solidC(24, -20, 1, 1, 9);
  // pumpkin patch
  for (let i = 0; i < 18; i++) { const x = 7 + (i % 6) * 1.7, z = 1.2 + Math.floor(i / 6) * 1.5; b.add('g', G.sph, 0xf97316, x, 0.32, z, 0, i, 0, 0.42 + (i % 3) * 0.08, 0.32, 0.42); b.cyl('m', 0x4d7c0f, x, 0.55, z, 0.04, 0.18); b.sph('f', 0x4d7c0f, x + 0.4, 0.06, z + 0.2, 0.3, 0.05, 0.25); } solid(6.2, 0.4, 16.4, 5, 0, 0.7);
  put(grp, sign('🎃 PUMPKIN PATCH', 2.6, 0.45, { bg: '#c2410c', border: '#fde68a' }), 11.3, 1.2, 5.4);
  // bee boxes + sunflowers
  for (let i = 0; i < 3; i++) { const x = 16 + i * 1.4; for (let k = 0; k < 3; k++) b.box('m', [0xf8fafc, 0xfef3c7, 0xfde68a][k], x, 0.4 + k * 0.38, 9, 0.9, 0.36, 0.8); b.box('m', 0x6b7280, x, 1.54, 9, 1.0, 0.1, 0.9); b.box('x', 0x6b4426, x, 0, 9, 0.8, 0.4, 0.7); } solid(15.3, 8.4, 19.4, 9.6, 0, 1.6);
  for (let i = 0; i < 10; i++) { const x = 15 + i * 0.6, z = 11 + (i % 2) * 0.5; b.cyl('f', 0x4d7c0f, x, 0, z, 0.05, 2.2); b.add('g', G.cyl, 0xfacc15, x, 2.25, z, PI / 2.4, 0, 0, 0.32, 0.06, 0.32); b.add('m', G.cyl, 0x713f12, x, 2.26, z + 0.04, PI / 2.4, 0, 0, 0.15, 0.08, 0.15); } solid(14.7, 10.7, 21, 11.8, 0, 2.4);
  for (let i = 0; i < 8; i++) b.sph('g', 0xfacc15, 16 + Math.sin(i * 2.3) * 2, 1.6 + (i % 3) * 0.3, 9 + Math.cos(i * 1.7) * 1.5, 0.07); // bees
  put(grp, sign('🐝 BEE BOXES · POLLINATORS AT WORK', 4.2, 0.45, { bg: '#a16207', border: '#fff' }), 17.4, 2.0, 8.5);
  // seed garden raised beds + greenhouse
  for (let i = 0; i < 3; i++) { const x = -10 + i * 3; b.rbox('m', 0x8a5a33, x, 0, 6.5, 2.2, 0.45, 1.6); b.box('m', 0x3f2a14, x, 0.42, 6.5, 2.0, 0.06, 1.4); for (let k = 0; k < 8; k++) { const sx = x - 0.75 + (k % 4) * 0.5, sz = 6.1 + Math.floor(k / 4) * 0.8, s = 0.3 + i * 0.25; b.cyl('f', 0x65a30d, sx, 0.45, sz, 0.02, s * 0.6); b.sph('f', 0x84cc16, sx, 0.45 + s * 0.6, sz, 0.1 * (1 + i * 0.7), 0.05 * (1 + i), 0.1 * (1 + i * 0.7)); } solidC(x, 6.5, 2.2, 1.6, 0.5); }
  put(grp, board(3.4, 1.0, (g, w, h) => { g.fillStyle = '#fef3c7'; g.fillRect(0, 0, w, h); g.fillStyle = '#365314'; g.font = `900 ${h * 0.26}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🌱 SEED  →  🌿 SPROUT  →  🪴 PLANT', w / 2, h * 0.35); g.font = `800 ${h * 0.19}px system-ui`; g.fillText('needs ☀️ sun · 💧 water · 🟫 soil', w / 2, h * 0.74); }, 512), -7, 1.4, 4.9);
  b.box('x', 0xd1d5db, -7, 0, 4.9, 0.08, 0.9, 0.08);
  b.box('e', 0xd9f99d, -18, 0, 13, 5, 2.6, 4); b.add('e', G.prism, 0xd9f99d, -18, 2.6, 13, 0, PI / 2, 0, 4, 1.2, 5); solidC(-18, 13, 5, 4, 3.6); for (let i = 0; i < 6; i++) b.sph('f', 0x16a34a, -19.8 + i * 0.7, 0.6, 13, 0.3);
  // compost bin
  { const cx = -16, cz = 6.5; for (let k = 0; k < 4; k++) { b.box('m', 0x92400e, cx, k * 0.28, cz - 0.9, 2.2, 0.2, 0.1); b.box('m', 0x92400e, cx, k * 0.28, cz + 0.9, 2.2, 0.2, 0.1); b.box('m', 0x92400e, cx - 1.05, k * 0.28, cz, 0.1, 0.2, 1.8); b.box('m', 0x92400e, cx + 1.05, k * 0.28, cz, 0.1, 0.2, 1.8); } b.sph('m', 0x3f2a14, cx, 0.6, cz, 0.95, 0.45, 0.8); for (let i = 0; i < 6; i++) b.add('m', G.cyl, 0xf9a8d4, cx - 0.5 + i * 0.2, 1.0, cz + Math.sin(i) * 0.4, PI / 2, i, 0, 0.04, 0.3, 0.04); b.sph('g', 0xf97316, cx + 0.3, 1.05, cz - 0.2, 0.12); b.sph('g', 0x84cc16, cx - 0.4, 1.05, cz + 0.3, 0.1); solidC(cx, cz, 2.3, 2, 1.1);
    put(grp, sign('🪱 COMPOST · WORMS AT WORK', 2.8, 0.4, { bg: '#78350f', border: '#fde68a' }), cx, 1.6, cz + 1.0); }
  // tractor
  { const tx = -4, tz = -7; b.rbox('g', 0x16a34a, tx, 0.6, tz, 2.4, 1.0, 1.3); b.rbox('g', 0x16a34a, tx - 0.6, 1.6, tz, 1.0, 1.0, 1.2); b.box('e', 0x9bd5ff, tx - 0.6, 1.7, tz, 1.02, 0.7, 1.0); b.cyl('x', 0x334155, tx + 0.9, 1.6, tz, 0.07, 0.8); for (const [lx, rr] of [[-0.8, 0.75], [0.8, 0.45]]) for (const sd of [-1, 1]) { b.add('m', G.cyl, 0x111827, tx + lx, rr, tz + sd * 0.8, PI / 2, 0, 0, rr, 0.35, rr); b.add('g', G.cyl, 0xfacc15, tx + lx, rr, tz + sd * 0.82, PI / 2, 0, 0, rr * 0.45, 0.36, rr * 0.45); } solidC(tx, tz, 3, 2, 2.4); }
  // chicken coop
  { const cx = -24, cz = 4; b.box('m', 0xfef3c7, cx, 0.5, cz, 3, 1.8, 2.2); b.add('m', G.prism, 0xb91c1c, cx, 2.3, cz, 0, PI / 2, 0, 2.6, 1, 3.4); for (const sx of [-1.2, 1.2]) for (const sz of [-0.9, 0.9]) b.box('m', 0x6b4426, cx + sx, 0, cz + sz, 0.12, 0.5, 0.12); b.add('m', G.box, 0x8a5a33, cx, 0.3, cz + 1.6, -0.5, 0, 0, 0.5, 0.06, 1.2); solidC(cx, cz, 3.2, 2.4, 2.8);
    for (let i = 0; i < 4; i++) { const x = cx - 1.5 + i * 1.1, z = cz + 2.6 + (i % 2) * 0.6; b.sph('m', i % 2 ? 0xf8fafc : 0xb45309, x, 0.3, z, 0.25, 0.22, 0.3); b.sph('m', i % 2 ? 0xf8fafc : 0xb45309, x, 0.55, z + 0.2, 0.13); b.sph('g', 0xef4444, x, 0.7, z + 0.22, 0.05); b.add('g', G.cone, 0xf59e0b, x, 0.55, z + 0.36, PI / 2, 0, 0, 0.04, 0.1, 0.04); } }
  // farm stand (shop), the bus, trees + perimeter fence
  b.rbox('m', 0xb45309, 12, 0, 15, 3, 1.0, 1.2); b.box('m', 0xdc2626, 12, 2.3, 15, 3.4, 0.12, 1.8); for (const sx of [-1.5, 1.5]) b.cyl('m', 0x6b4426, 12 + sx, 0, 15.6, 0.06, 2.3); for (let i = 0; i < 4; i++) b.sph('g', [0xf97316, 0xfacc15, 0xdc2626, 0x84cc16][i], 11 + i * 0.65, 1.15, 15, 0.2); solidC(12, 15, 3, 1.2, 2.3);
  put(grp, sign('FARM STAND', 2, 0.42, { bg: '#b91c1c', border: '#fde68a' }), 12, 1.95, 15.65); Z.spots.push({ x: 12, z: 16.6, r: 1.8, kind: 'shop', label: '🛍️ Farm Stand (souvenirs)' });
  const B1 = bus(b, grp, 12, 22, PI); S.busDoor = { x: B1.door[0], z: B1.door[1] - 0.2 }; Z.spots.push({ x: S.busDoor.x, z: S.busDoor.z, r: 2.2, kind: 'bus', label: '🚌 Back to the bus (Depot)' });
  for (let i = 0; i < 26; i++) { const a = i / 26 * PI * 2 + r() * 0.1, d = 34 + r() * 5; tree(b, Math.cos(a) * d, Math.sin(a) * d, 1.1 + r() * 0.4, r); }
  fence(b, -28, 19.5, -3, 19.5, 0x8a5a33); fence(b, 3, 19.5, 6, 19.5, 0x8a5a33);
  for (const [x, z] of [[-3, 14], [3, 9]]) lamp(b, x, z, 0xffe4a0); bench(b, -5, 14.5, PI / 2); planter(b, 4, 14, 2.4, 0.9, [0xfacc15, 0xf97316, 0xdc2626]);
  b.finish(grp);
  const stops = [[-4.6, 8.4], [5.2, -10], [14.4, 7.0], [-14, -7.6], [-13.6, 6.4]]; stops.forEach(([x, z], i) => { Z.stops.push({ x, z, i, ring: stopMarker(grp, x, z, 0xfacc15) }); });
  Z.spawn = { x: 1.5, z: 16.5, yaw: PI }; Z.guide = { id: 'torty', x: -2.4, z: 11, yaw: PI * 0.25 }; Z.extra = [['luna', -9, -3.6, 0.3], ['snowie', 18.6, 6.8, -PI / 2]];
  Z.anchors = [[0, 2, 8], [-8, -4, 4], [10, 8, 4]]; Z.bounds = { r: 31 };
  Z.env = { skyTop: 0x3b82f6, skyMid: 0xbfdbfe, skyBot: 0xfef3c7, sunDir: [0.5, 0.6, 0.4], sunColor: 0xffe8c0, sunI: 2.6, hemiSky: 0xe0f2fe, hemiGround: 0x5b6b3a, hemiI: 0.9, exposure: 0.9, fog: 0xe8f0d8, fogD: 0.007, envI: 0.65, bloomT: 1.05, bloomS: 0.18 };
  return Z; }

// ============================================================ PUP TOWN · MAIN STREET (community helpers)
function shopFront(b, grp, x, z, w, d, h, col, roof, title, sg, ry = 0) { const P = rot(x, z, ry); b.add('m', G.box, col, x, h / 2, z, 0, ry, 0, w, h, d); b.add('m', G.box, roof, x, h + 0.2, z, 0, ry, 0, w + 0.4, 0.4, d + 0.4);
  const [fx, fz] = P(0, d / 2 + 0.03); for (const sx of [-w / 3, w / 3]) { const [wx, wz] = P(sx, d / 2 + 0.03); b.add('e', G.box, 0x9bd5ff, wx, 1.7, wz, 0, ry, 0, w / 4, 1.4, 0.05); b.add('m', G.box, 0xffffff, wx, 0.95, wz, 0, ry, 0, w / 4 + 0.2, 0.1, 0.2); }
  b.add('m', G.box, 0x7c2d12, fx, 1.2, fz, 0, ry, 0, 1.4, 2.4, 0.06); const s = sign(title, Math.min(w - 0.6, 7), 0.8, sg); const [sx, sz] = P(0, d / 2 + 0.08); s.position.set(sx, h - 0.6, sz); s.rotation.y = ry; grp.add(s);
  const c = Math.abs(Math.cos(ry)), si = Math.abs(Math.sin(ry)); solidC(x, z, w * c + d * si, d * c + w * si, h + 0.4); }
export function buildPuptown(grp, S) { const r = rng(3301); const b = new Batch(24); const Z = { name: 'Pup Town Main Street', spots: [], stops: [], anchors: [] };
  const g0 = new Batch(); g0.box('g', 0x7cb342, 0, -0.05, 0, 220, 0.05, 220); g0.finish(grp);
  b.box('m', 0x3f3f46, 0, 0, 0, 80, 0.04, 8); for (let x = -38; x <= 38; x += 4) b.box('l', 0xfde047, x, 0.045, 0, 2, 0.01, 0.16, 0, 0.15);
  for (const z of [-5, 5]) { b.box('m', 0xd6d3d1, 0, 0, z, 80, 0.16, 2); b.box('m', 0xe5e7eb, 0, 0, z + (z < 0 ? 1 : -1), 80, 0.18, 0.16); }
  for (let i = 0; i < 7; i++) b.box('m', 0xf8fafc, -4, 0.05, -3.2 + i * 1.07, 1.6, 0.01, 0.55); // crosswalk (x=-4)
  // north side: Fire Station, Library, Post Office (fronts at z = -6.2)
  { const fx = -16, fz = -11.2; b.box('m', 0xb91c1c, fx, 0, fz, 11, 6.4, 10); b.box('m', 0x7f1d1d, fx, 6.4, fz, 11.4, 0.5, 10.4); b.box('m', 0xf8fafc, fx, 5.0, fz + 5.02, 11, 0.12, 0.06);
    for (const sx of [-2.6, 2.6]) { b.box('m', 0x111827, fx + sx, 0, fz + 5.02, 4, 4.2, 0.04); for (let k = 0; k < 6; k++) b.box('m', 0x9ca3af, fx + sx, 3.0 + k * 0.2, fz + 5.05, 4, 0.06, 0.02); }
    solid(fx - 5.5, fz - 5, fx + 5.5, fz + 5.05, 0, 7); put(grp, sign('🚒 PUP TOWN FIRE STATION No. 1', 7, 0.8, { bg: '#7f1d1d', border: '#fde68a' }), fx, 5.6, fz + 5.1);
    // fire truck parked out front (nose east)
    const tx = fx + 2.6, tz = fz + 8.6; b.rbox('g', 0xdc2626, tx, 0.5, tz, 1.4, 1.9, 4.4, PI / 2); b.rbox('g', 0xdc2626, tx + 2.6, 0.5, tz, 1.4, 2.2, 1.6, PI / 2); b.box('e', 0x9bd5ff, tx + 3.32, 1.5, tz, 0.05, 0.8, 1.2); b.box('x', 0xe5e7eb, tx - 0.3, 2.45, tz, 4.0, 0.12, 0.5); for (let i = 0; i < 9; i++) b.box('x', 0xe5e7eb, tx - 2.1 + i * 0.45, 2.5, tz, 0.06, 0.08, 0.6);
    b.box('l', 0xef4444, tx + 2.4, 2.75, tz - 0.4, 0.3, 0.18, 0.25, 0, 0.9); b.box('l', 0x3b82f6, tx + 2.4, 2.75, tz + 0.4, 0.3, 0.18, 0.25, 0, 0.9); for (const lx of [-1.4, 0.6, 2.6]) for (const sd of [-1, 1]) b.add('m', G.cyl, 0x111827, tx + lx, 0.5, tz + sd * 0.72, PI / 2, 0, 0, 0.5, 0.3, 0.5);
    b.cyl('m', 0xf8fafc, tx - 0.4, 0.4, tz + 0.75, 0.35, 0.3, PI / 2); solidC(tx + 0.6, tz, 6.6, 1.8, 2.8);
    b.cyl('g', 0xdc2626, fx - 4.6, 0, fz + 5.9, 0.2, 0.7); b.sph('g', 0xdc2626, fx - 4.6, 0.72, fz + 5.9, 0.2); solidC(fx - 4.6, fz + 5.9, 0.5, 0.5, 0.9); }
  { const lx = 0, lz = -11.4; b.box('m', 0xede9fe, lx, 0, lz, 10, 6, 9.6); b.add('m', G.prism, 0x6d28d9, lx, 6, lz, 0, PI / 2, 0, 9.8, 1.6, 10.6); for (let i = 0; i < 4; i++) b.box('m', 0xe5e7eb, lx, i * 0.15, lz + 4.8 + 0.4 - i * 0.12, 6, 0.15, 1.2 - i * 0.2);
    for (const sx of [-2.6, -0.9, 0.9, 2.6]) b.cyl('m', 0xf8fafc, lx + sx, 0.6, lz + 5.3, 0.25, 4.4); b.box('m', 0xf8fafc, lx, 5.0, lz + 5.3, 6.4, 0.5, 0.7); b.box('m', 0x7c2d12, lx, 0.6, lz + 4.82, 1.6, 2.6, 0.06); for (const sx of [-3.8, 3.8]) b.box('e', 0x9bd5ff, lx + sx, 1.6, lz + 4.82, 1.4, 2.4, 0.05);
    solid(lx - 5, lz - 4.8, lx + 5, lz + 5.6, 0, 7); put(grp, sign('📚 PUP TOWN PUBLIC LIBRARY', 5.6, 0.6, { bg: '#4c1d95', border: '#fde68a' }), lx, 4.35, lz + 5.66);
    b.rbox('g', 0x2563eb, lx + 4.2, 0, lz + 6.4, 0.9, 1.2, 0.8); b.box('m', 0x111827, lx + 4.2, 0.85, lz + 6.81, 0.6, 0.12, 0.02); solidC(lx + 4.2, lz + 6.4, 0.9, 0.8, 1.3); put(grp, sign('BOOK RETURN', 0.9, 0.22, { bg: '#1e3a8a' }), lx + 4.2, 1.45, lz + 6.82);
    for (let i = 0; i < 6; i++) b.rbox('g', [0xef4444, 0x22c55e, 0xfacc15, 0x3b82f6, 0xa855f7, 0xf97316][i], lx - 3.8 + (i % 3) * 0.3, 1.0 + Math.floor(i / 3) * 0.5, lz + 4.75, 0.22, 0.4, 0.04); }
  shopFront(b, grp, 16, -11, 10, 9.6, 5.2, 0x1d4ed8, 0x1e3a8a, '✉️ PUP TOWN POST OFFICE', { bg: '#1e3a8a', border: '#fde68a' });
  b.cyl('x', 0xd4d4d8, 21.5, 0, -5.8, 0.07, 6.5); put(grp, board(1.6, 1.0, (g, w, h) => { g.fillStyle = '#b91c1c'; g.fillRect(0, 0, w, h); for (let i = 1; i < 7; i += 2) { g.fillStyle = '#fff'; g.fillRect(0, i * h / 7, w, h / 7); } g.fillStyle = '#1e3a8a'; g.fillRect(0, 0, w * 0.42, h * 4 / 7); }, 256), 22.32, 5.9, -5.8);
  for (const x of [12.6, 13.6]) { b.rbox('g', 0x1d4ed8, x, 0.25, -5.6, 0.8, 1.0, 0.7); b.cyl('g', 0x1d4ed8, x, 1.25, -5.6, 0.4, 0.7, PI / 2); b.box('x', 0x334155, x, 0, -5.6, 0.2, 0.25, 0.2); } solidC(13.1, -5.6, 2, 0.8, 1.6);
  for (let i = 0; i < 5; i++) b.rbox('m', 0xd6a15b, 18.6 + (i % 3) * 0.7, (i > 2 ? 0.55 : 0), -5.8, 0.6, 0.5, 0.5); solidC(19.3, -5.8, 2.3, 0.7, 1.1);
  // south side: Pup Clinic + houses, the park
  shopFront(b, grp, -14, 11.2, 10, 9.6, 5, 0xf8fafc, 0x0f766e, '🩺 PUP CLINIC · DOCTORS & VETS', { bg: '#0f766e', border: '#fff' }, PI);
  { const cx = -14, cz = 6.36; b.box('g', 0xef4444, cx + 3.7, 3.4, cz - 0.02, 1.1, 0.35, 0.05); b.box('g', 0xef4444, cx + 3.7, 3.03, cz - 0.02, 0.35, 1.1, 0.05); b.rbox('x', 0xe5e7eb, cx - 3.6, 0, cz - 0.6, 0.7, 1.2, 0.5); b.box('l', 0x67e8f9, cx - 3.6, 0.9, cz - 0.86, 0.4, 0.3, 0.02, 0, 0.6); solidC(cx - 3.6, cz - 0.6, 0.7, 0.5, 1.3); put(grp, sign('🧼 WASH 20 SEC', 1.4, 0.3, { bg: '#0e7490', border: '#fff' }), cx - 3.6, 1.6, cz - 0.86, PI); }
  shopFront(b, grp, -26, 11, 6, 7, 4.6, 0xfde68a, 0x92400e, '🏠 HOME', { bg: '#92400e', border: '#fff' }, PI);
  // park
  b.box('g', 0x65a30d, 13, 0.0, 12.2, 20, 0.04, 11); b.sph('e', 0x38bdf8, 17, 0.02, 14, 3, 0.04, 2.0); for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2; rock(b, 17 + Math.cos(a) * 3.1, 14 + Math.sin(a) * 2.1, 0.25, 0x9ca3af); } solidC(17, 14, 5.6, 3.6, 0.4);
  b.cyl('m', 0xd6d3d1, 8, 0, 10.5, 1.4, 0.6); b.cyl('e', 0x7dd3fc, 8, 0.4, 10.5, 1.2, 0.2); b.cyl('m', 0xd6d3d1, 8, 0.6, 10.5, 0.25, 1.2); b.sph('e', 0x7dd3fc, 8, 1.9, 10.5, 0.35); solidC(8, 10.5, 2.8, 2.8, 1.3);
  { const px = 11, pz = 15.5; b.box('g', 0xf97316, px, 0, pz, 0.12, 2.2, 0.12); b.box('g', 0xf97316, px + 1, 0, pz, 0.12, 2.2, 0.12); b.box('g', 0x2563eb, px + 0.5, 2.0, pz, 1.4, 0.3, 1.2); b.add('g', G.box, 0xfacc15, px + 2.0, 1.0, pz, 0, 0, -0.75, 0.6, 2.8, 0.06); solidC(px + 0.9, pz, 3.6, 1.4, 2.3);
    b.box('x', 0x334155, px - 3, 0, pz - 0.8, 0.1, 2.4, 0.1); b.box('x', 0x334155, px - 3, 0, pz + 0.8, 0.1, 2.4, 0.1); b.box('x', 0x334155, px - 3, 2.35, pz, 0.12, 0.1, 1.8); for (const sz of [-0.4, 0.4]) b.box('m', 0xdc2626, px - 3, 0.5, pz + sz, 0.5, 0.06, 0.3); solidC(px - 3, pz, 0.6, 1.8, 2.4); }
  put(grp, sign('🌳 PAW PARK', 2.2, 0.45, { bg: '#166534', border: '#fde68a' }), 6, 1.4, 6.6, PI); b.box('m', 0x6b4426, 6, 0, 6.6, 0.12, 1.2, 0.12);
  for (const [x, z] of [[21, 9], [5, 16], [22, 17], [14, 17.5]]) tree(b, x, z, 1.1, r);
  bench(b, 13, 8.2, PI); bench(b, 18.5, 10.6, PI);
  // stop sign, traffic light, lamps, sidewalk trees, hydrants, crossing-guard sign
  b.cyl('x', 0x94a3b8, -6.2, 0, 4.6, 0.05, 2.4); b.add('g', G.cyl8, 0xdc2626, -6.2, 2.5, 4.62, PI / 2, 0, PI / 8, 0.4, 0.04, 0.4); put(grp, sign('STOP', 0.55, 0.22, { bg: '#dc2626', border: false }), -6.2, 2.5, 4.66);
  b.cyl('x', 0x334155, -2, 0, -4.6, 0.08, 3.6); b.box('x', 0x111827, -2, 3.6, -4.6, 0.4, 1.1, 0.35); for (const [y, c] of [[4.4, 0xef4444], [4.1, 0xfacc15], [3.8, 0x22c55e]]) b.sph('l', c, -2, y, -4.4, 0.12, 0.12, 0.06, c === 0x22c55e ? 1 : 0.15);
  for (const x of [-25, -7, 7, 27]) { lamp(b, x, -4.6); lamp(b, x, 4.6); }
  for (const x of [-27, -24, 26, 30]) { tree(b, x, -5.4, 0.85, r); } planter(b, -8, 6.0, 2.4, 0.8); planter(b, 6.5, -5.6, 2, 0.7);
  // background houses (tidy rows)
  for (let i = 0; i < 6; i++) { const x = -30 + i * 12; b.box('m', [0xfde68a, 0xbfdbfe, 0xfecaca, 0xbbf7d0, 0xe9d5ff, 0xfed7aa][i], x, 0, -24, 7, 4, 6); b.add('m', G.prism, 0x7c2d12, x, 4, -24, 0, 0, 0, 7.4, 2, 6.4); b.box('e', 0x9bd5ff, x - 1.6, 1.6, -20.98, 1.2, 1, 0.04); b.box('m', 0x7c2d12, x + 1.4, 0, -20.98, 1, 2, 0.04); }
  for (let i = 0; i < 5; i++) { const x = -36 + i * 9; if (x > -21 && x < -7) continue; tree(b, x, 22, 1.2, r); }
  // souvenir cart + bus
  b.rbox('m', 0xdc2626, 3, 0, 6.4, 2.4, 1.0, 1.0); b.box('m', 0xf8fafc, 3, 2.1, 6.4, 2.8, 0.1, 1.5); for (const sx of [-1.2, 1.2]) b.cyl('x', 0x94a3b8, 3 + sx, 0, 6.9, 0.05, 2.1); solidC(3, 6.4, 2.4, 1, 2.2); put(grp, sign('PUP TOWN GIFTS', 2, 0.4, { bg: '#dc2626', border: '#fde68a' }), 3, 1.8, 5.9, PI);
  Z.spots.push({ x: 3, z: 5.0, r: 1.6, kind: 'shop', label: '🛍️ Pup Town Gifts (souvenirs)' });
  const B1 = bus(b, grp, 26, 2.0, 0); S.busDoor = { x: B1.door[0], z: B1.door[1] }; Z.spots.push({ x: S.busDoor.x, z: S.busDoor.z, r: 2.2, kind: 'bus', label: '🚌 Back to the bus (Depot)' });
  b.finish(grp);
  const stops = [[-12, -5.0], [1.6, -5.0], [10.4, -5.0], [-10.6, 5.2], [-4, 3.2]]; stops.forEach(([x, z], i) => Z.stops.push({ x, z, i, ring: stopMarker(grp, x, z, 0xf87171) }));
  Z.spawn = { x: 17, z: 5.2, yaw: -PI / 2 }; Z.guide = { id: 'candy', x: 11.5, z: 4.6, yaw: PI / 2 }; Z.noBusMonitor = true;
  Z.extra = [['luna', 13, 9.2, PI], ['snowie', 14, 9.4, PI], ['torty', 19.5, 9.4, -PI / 2]];
  Z.dogs = [['dalmatian', -14.5, -5.4, 0.2], ['collie', -0.6, -5.6, 0.1], ['beagle', 15, -5.4, -0.2], ['poodle', -16, 5.4, PI], ['golden', -5.4, 4.6, PI * 0.9]];
  Z.folkDogs = ['corgi', 'pug', 'shiba', 'husky']; Z.anchors = [[13, 12, 4], [-2, 0, 6], [-20, 0, 6]];
  Z.bounds = { x0: -32, x1: 32, z0: -6.2, z1: 18 };
  Z.env = { skyTop: 0x3b82f6, skyMid: 0xbfdbfe, skyBot: 0xe0f2fe, sunDir: [0.4, 0.65, 0.5], sunColor: 0xfff4dc, sunI: 2.5, hemiSky: 0xe0f2fe, hemiGround: 0x5b6b3a, hemiI: 0.9, exposure: 0.92, fog: 0xdbeafe, fogD: 0.006, envI: 0.7, bloomT: 1.05, bloomS: 0.2 };
  return Z; }
