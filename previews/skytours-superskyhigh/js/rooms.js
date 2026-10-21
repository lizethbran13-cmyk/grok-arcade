// Grok Snowie Sky Tours - dense, walk-in interiors: extra props, residents, chores and mini-game stations for every building.
// All geometry goes into the building's own 'in_<id>' region (culled / hidden with the interior).
import * as K from './kit.js?v=st9';
import { rbox } from './world.js?v=st9';
import { txt, bone, pendant, frameArt, clockW, bed, paperStackA, pine } from './map.js?v=st9';
const { rcyl, lathe, sph, cyl, cone, torus, capsule, tube, star, heart, wedge } = K;
const PI = Math.PI, pick = K.pick, BR = [0xef4444, 0x3b82f6, 0xfacc15, 0x22c55e, 0xa855f7, 0xf97316, 0xec4899, 0x14b8a6];
export const ROOMS = { npcs: [], acts: [] };
const npc = (o) => ROOMS.npcs.push(o), act = (o) => ROOMS.acts.push(o);
// ---------- small reusable props ----------
function plush(w, x, y, z, col, s = 1) { w.add('f', sph(14), col, x, y + 0.14 * s, z, 0, 0, 0, 0.15 * s, 0.14 * s, 0.13 * s); w.add('f', sph(12), col, x, y + 0.34 * s, z + 0.02 * s, 0, 0, 0, 0.11 * s); [-1, 1].forEach((a) => w.add('f', sph(8), 0xfbcfe8, x + a * 0.07 * s, y + 0.44 * s, z, 0, 0, 0, 0.04 * s)); }
function gift(w, x, y, z, s, col, rib = 0xffffff, ry = 0) { w.add('g', rbox(s, s * 0.8, s, s * 0.06), col, x, y + s * 0.4, z, 0, ry, 0); w.add('g', rbox(s * 1.02, s * 0.82, s * 0.16, 0.01), rib, x, y + s * 0.4, z, 0, ry, 0); w.add('g', rbox(s * 0.16, s * 0.82, s * 1.02, 0.01), rib, x, y + s * 0.4, z, 0, ry, 0); w.add('g', torus(0.35, 12), rib, x, y + s * 0.86, z, 0, ry, 0, s * 0.18, s * 0.18, s * 0.18); }
function mug(w, x, y, z, col) { w.add('g', lathe([[0, 0], [0.07, 0], [0.075, 0.14], [0, 0.14]], 14, 'mug2'), col, x, y, z); }
function books(w, x, y, z, n, axis = 'x', ry = 0) { for (let i = 0; i < n; i++) { const h = 0.2 + ((i * 7) % 5) * 0.025; const o = (i - n / 2) * 0.07; w.add('m', rbox(0.06, h, 0.18, 0.01), BR[(i * 3 + (x * 7 | 0)) & 7], axis === 'x' ? x + o : x, y + h / 2, axis === 'x' ? z : z + o, 0, ry, 0); } }
function shelfRack(w, x, z, ry, Wd, Hh, col, fill) { const T = w.tf(x, 0, z, ry); T.slab('m', col, 0, 0, -0.2, Wd, Hh, 0.06, 0.02); [-1, 1].forEach((s) => T.box('m', col, s * (Wd / 2 - 0.03), 0, 0, 0.06, Hh, 0.42, 0.02)); const n = Math.max(2, Math.round(Hh / 0.55)); const ys = []; for (let i = 0; i <= n; i++) { const y = 0.05 + i * (Hh - 0.1) / n; T.box('m', col, 0, y, 0, Wd, 0.04, 0.42, 0.01); ys.push(y + 0.04); } T.solid(-Wd / 2, 0, -0.22, Wd / 2, Hh, 0.21); if (fill) ys.slice(0, -1).forEach((y, i) => { for (let k = 0; k < Math.max(1, Math.floor(Wd / 0.32)); k++) { const lx = -Wd / 2 + 0.2 + k * 0.32; const p = T.P(lx, 0, 0); fill(p[0], y, p[2], i, k); } }); }
function counter(w, x, z, ry, L, top, body, H = 0.95) { const T = w.tf(x, 0, z, ry); T.slab('g', body, 0, 0, 0, L, H - 0.06, 0.62, 0.04); T.box('g', top, 0, H - 0.06, 0.01, L + 0.06, 0.06, 0.68, 0.02); for (let i = 0; i < Math.floor(L / 0.6); i++) T.box('x', 0xd1d5db, -L / 2 + 0.3 + i * 0.6, 0.62, 0.32, 0.18, 0.03, 0.02, 0.01); return T; }
function armchair(w, x, z, ry, col) { const T = w.tf(x, 0, z, ry); T.slab('f', col, 0, 0.12, 0, 0.9, 0.36, 0.85, 0.12); T.box('f', col, 0, 0.45, -0.36, 0.9, 0.62, 0.18, 0.08); [-1, 1].forEach((s) => T.box('f', col, s * 0.4, 0.45, 0, 0.14, 0.26, 0.85, 0.06)); T.box('f', 0xfef3c7, 0, 0.48, 0.02, 0.66, 0.1, 0.64, 0.05); [-1, 1].forEach((a) => [-1, 1].forEach((b) => T.add('m', cyl(6), 0x5b3a1e, a * 0.36, 0, b * 0.33, 0, 0, 0, 0.04, 0.12, 0.04))); }
function tvSet(w, x, z, ry, scr = 0x38bdf8) { const T = w.tf(x, 0, z, ry); T.slab('m', 0x3f3f46, 0, 0, 0, 1.5, 0.5, 0.45, 0.04); T.box('g', 0x111827, 0, 0.55, -0.05, 1.3, 0.78, 0.06, 0.03); T.box('l', scr, 0, 0.6, -0.01, 1.2, 0.68, 0.02, 0.01, 0.35); T.box('g', 0x111827, 0, 0.5, -0.05, 0.2, 0.06, 0.2, 0.02); }
function fireplace(w, x, z, ry, col = 0x9a3412) { const T = w.tf(x, 0, z, ry); T.slab('m', col, 0, 0, 0, 1.8, 1.4, 0.55, 0.05); T.box('m', 0x1c1917, 0, 0.12, 0.2, 1.0, 0.8, 0.2, 0.04); T.box('l', 0xff7a1a, 0, 0.16, 0.26, 0.8, 0.42, 0.06, 0.04, 0.9); T.add('l', cone(10), 0xffd23f, -0.15, 0.2, 0.25, 0, 0, 0, 0.12, 0.4, 0.06, 1.0); T.add('l', cone(10), 0xff4d1a, 0.18, 0.2, 0.25, 0, 0, 0, 0.1, 0.32, 0.06, 1.0); T.box('m', 0xfef3c7, 0, 1.4, 0.02, 2.0, 0.08, 0.68, 0.02); }
function stockings(w, T, n, y, z) { for (let i = 0; i < n; i++) { const lx = -0.6 + i * (1.2 / Math.max(1, n - 1)); const p = T.P(lx, y, z); w.add('f', capsule(8), i % 2 ? 0xffffff : 0xdc2626, p[0], y, p[2], 0, 0, 0, 0.14, 0.3, 0.1); w.add('f', sph(8), i % 2 ? 0xdc2626 : 0xffffff, p[0], y + 0.24, p[2], 0, 0, 0, 0.1, 0.06, 0.08); } }
function xmasTree(w, x, z, s = 1) { w.add('m', cyl(8), 0x7c4a1e, x, 0, z, 0, 0, 0, 0.12 * s, 0.5 * s, 0.12 * s); for (let i = 0; i < 3; i++) w.add('m', cone(14), i % 2 ? 0x15803d : 0x166534, x, (0.4 + i * 0.55) * s, z, 0, i, 0, (0.9 - i * 0.24) * s, 0.95 * s, (0.9 - i * 0.24) * s); for (let i = 0; i < 12; i++) { const a = i * 2.4, h = 0.6 + (i % 6) * 0.26, r = (0.85 - (h - 0.4) * 0.38) * s; w.add('l', sph(8), BR[i & 7], x + Math.cos(a) * r, h * s, z + Math.sin(a) * r, 0, 0, 0, 0.06 * s, 0.06 * s, 0.06 * s, 0.5); } w.add('l', star(), 0xffd23f, x, 2.15 * s, z, 0, 0, 0, 0.18 * s, 0.18 * s, 0.1 * s, 0.9); w.solid(x - 0.5 * s, 0, z - 0.5 * s, x + 0.5 * s, 2.2 * s, z + 0.5 * s); }
function rope(w, pts, col = 0xdc2626) { w.add('f', tube(pts, 0.03, 12, 6), col, 0, 0, 0); }
function lightString(w, pts, y) { pts.forEach(([x, z], i) => w.add('l', sph(6), BR[i & 7], x, y, z, 0, 0, 0, 0.06, 0.06, 0.06, 0.7)); }
function wallSign(w, s, x, y, z, ry, size, col, back) { const L = s.length * size * 0.62 + 0.4; const T = w.tf(x, y, z, ry); T.box('g', back, 0, -size * 0.6, 0, L, size * 1.6, 0.06, 0.03); txt(w, s, x + Math.sin(ry) * 0.05, y + size * 0.15 - size * 0.62, z + Math.cos(ry) * 0.05, ry, size, col); }
function petBed(w, x, z, col) { w.add('f', torus(0.45, 20), col, x, 0.16, z, PI / 2, 0, 0, 0.42, 0.42, 0.4); w.add('f', rcyl(0.42, 0.08, 0.03, 20), 0xfef3c7, x, 0.02, z); }
// =====================================================================================================
export function dressRooms(w) { const LG = w.lights; office(w); hangar(w); lounge(w); hall(w); barkery(w); museum(w); gadget(w); workshop(w); cocoa(w); w.region = 'out'; }
// ---------------- Tour Office ----------------
function office(w) { w.region = 'in_office';
  K.rug(w, -19, -21.5, 0, 2.4, 7.5, 0xff4fa0, 0xffd6ec);
  // souvenir shelf (west wall, north)
  shelfRack(w, -29.55, -29.2, PI / 2, 2.2, 2.2, 0xf9a8d4, (x, y, z, i, k) => { if (i === 0) mug(w, x, y, z, BR[k]); else if (i === 1) plush(w, x, y, z, 0xffffff, 0.8); else if (i === 2) { w.add('g', sph(10), 0xff4fa0, x, y + 0.1, z, 0, 0, 0, 0.12, 0.08, 0.08); w.add('g', rbox(0.3, 0.02, 0.03, 0.01), 0x334155, x, y + 0.2, z); } else w.add('g', rbox(0.18, 0.24, 0.02, 0.01), BR[(k + 2) & 7], x, y + 0.12, z); });
  txt(w, 'SOUVENIRS', -29.8, 2.55, -29.2, PI / 2, 0.16, 0xff4fa0);
  K.hhY('globe', w, -28.4, 0, -26.4, 0.16); w.solid(-28.6, 0, -26.6, -28.2, 0.8, -26.2);
  // waiting area: sofa + coffee table + magazines
  K.sofa(w, -29.3, -21.4, PI / 2, 0x3ff0ff, 0xa5f3fc, 15); K.hh('coffeeTable', w, -27.6, -21.4, 0.13, PI / 2, 12, 6, 3.2); for (let i = 0; i < 3; i++) w.add('m', rbox(0.3, 0.02, 0.22, 0.01), BR[i + 3], -27.6, 0.43 + i * 0.02, -21.8 + i * 0.3, 0, i * 0.4, 0); mug(w, -27.5, 0.42, -20.7, 0xff4fa0);
  // ticket kiosk (Ticket Rush) on the east wall
  { const T = w.tf(-8.9, 0, -21, -PI / 2); T.slab('g', 0xff4fa0, 0, 0, 0, 1.0, 1.1, 0.6, 0.08); T.box('g', 0xffffff, 0, 1.1, -0.1, 1.0, 0.9, 0.12, 0.05); T.box('l', 0x3ff0ff, 0, 1.18, -0.03, 0.82, 0.62, 0.02, 0.02, 0.35); T.box('x', 0x334155, 0.3, 0.6, 0.31, 0.24, 0.05, 0.02, 0.01); txt(w, 'TICKETS', -8.92, 2.15, -21, -PI / 2, 0.14, 0xff4fa0); }
  act({ room: 'office', x: -10.2, z: -21, r: 2.2, label: '🎟️ Ticket Rush (sell tours)', mg: 'tickets' });
  // weather board + flight schedule on the east wall
  K.whiteboard(w, 'z', -8.25, -27.5, 1.3, 2.6, -1); txt(w, 'TODAY: SUNNY  WIND: FLUFFY', -8.32, 3.05, -27.5, -PI / 2, 0.12, 0x2563eb);
  frameArt(w, 'z', -8.25, -24.4, 2.4, 1.0, 0.75, 0xbae6fd, -1); frameArt(w, 'z', -8.25, -18.5, 2.4, 1.0, 0.75, 0xfbcfe8, -1); K.cooler(w, -8.75, -25.6);
  // the model copter hanging over the lobby
  { const x = -19, y = 3.35, z = -22; w.add('x', cyl(6), 0x94a3b8, x, y + 0.3, z, 0, 0, 0, 0.01, 0.95, 0.01); w.add('g', sph(16), 0xff4fa0, x, y, z, 0, 0, 0, 0.42, 0.34, 0.6); w.add('e', sph(14), 0xbfe9ff, x, y + 0.08, z + 0.32, 0, 0, 0, 0.26, 0.22, 0.26); w.add('g', capsule(8), 0xff4fa0, x, y + 0.05, z - 0.9, PI / 2, 0, 0, 0.12, 0.9, 0.12); w.add('x', rbox(1.8, 0.02, 0.1, 0.01), 0x334155, x, y + 0.38, z, 0, 0.6, 0); w.add('x', rbox(1.8, 0.02, 0.1, 0.01), 0x334155, x, y + 0.38, z, 0, 0.6 + PI / 2, 0); }
  // luggage by the door + brochure stand
  K.hhY('suitcase', w, -22.4, 0, -17.3, 0.13, 0, 0x0ea5e9); K.hhY('suitcase', w, -22.5, 0.24, -17.3, 0.11, 0.3, 0xf97316); w.add('g', rbox(0.6, 0.85, 0.3, 0.05), 0xa78bfa, -22.4, 0.7, -17.6); w.solid(-22.85, 0, -17.65, -21.95, 0.75, -16.95);
  for (let i = 0; i < 6; i++) w.add('l', sph(6), BR[i], -28 + i * 3.6, 4.35, -31.75, 0, 0, 0, 0.07, 0.07, 0.07, 0.6);
  K.potPlant(w, -29.2, 0, -17.2, 1.1, 0x3ff0ff);
  npc({ id: 'tourist1', human: true, look: { skin: 4, hair: 2, hairC: 2, shirt: 3, pants: 2 }, room: 'office', at: [-26.2, -23.4], yaw: PI / 2, name: 'Tourist Tess', lines: [['Tourist Tess', 'I booked the Snowcap Peak tour! Is it true Snowie points out every cloud that looks like cheese?'], ['Tourist Tess', 'I\'ve counted eleven so far. From the waiting room.']] });
  npc({ id: 'tourist2', breed: 'poodle', s: 0.75, room: 'office', at: [-27.8, -19.2], yaw: PI / 2, name: 'Fifi', lines: [['Fifi', 'I am here for the luxury cloud tour. Do they serve biscuits at altitude? I simply must know.']] });
  npc({ id: 'agent', breed: 'corgi', s: 0.75, room: 'office', at: [-10.6, -22.4], yaw: -PI / 2, name: 'Ticket Agent Kiwi', lines: [['Kiwi', 'Tour tickets! Get your tour tickets! Each one comes with a free paw-print stamp.']], mg: 'tickets' }); }
// ---------------- Hangar ----------------
function hangar(w) { w.region = 'in_hangar';
  K.hazard && K.hazard(w, 21, -31.5, 5.2, 3.8, 0);
  // copter on a maintenance lift (Rotor Tune-up)
  { const x = 21, z = -31.6; w.slab('x', 0xfacc15, x, 0, z, 4.2, 0.18, 2.8, 0.04); for (let i = -1; i <= 1; i += 2) { w.add('x', rbox(0.08, 1.3, 2.6, 0.02), 0x475569, x + i * 1.6, 0.85, z, 0.45, 0, 0); w.add('x', rbox(0.08, 1.3, 2.6, 0.02), 0x475569, x + i * 1.6, 0.85, z, -0.45, 0, 0); } w.slab('x', 0xfacc15, x, 1.45, z, 4.2, 0.15, 2.8, 0.04);
    const y = 1.6; [-1, 1].forEach((s) => { w.add('x', rbox(0.08, 0.08, 3.0, 0.03), 0x334155, x + s * 0.7, y + 0.05, z); w.add('x', cyl(6), 0x334155, x + s * 0.7, y, z - 0.8, 0, 0, 0, 0.04, 0.35, 0.04); w.add('x', cyl(6), 0x334155, x + s * 0.7, y, z + 0.8, 0, 0, 0, 0.04, 0.35, 0.04); });
    w.add('g', sph(20), 0x3ff0ff, x, y + 1.05, z + 0.3, 0, 0, 0, 0.95, 0.75, 1.35); w.add('e', sph(16), 0xbfe9ff, x, y + 1.25, z + 1.15, 0, 0, 0, 0.62, 0.5, 0.55); w.add('g', capsule(10), 0x3ff0ff, x, y + 1.2, z - 1.7, PI / 2, 0, 0, 0.3, 2.2, 0.3); w.add('g', rbox(0.06, 0.6, 0.45, 0.02), 0xff4fa0, x, y + 1.45, z - 2.75);
    w.add('x', cyl(8), 0x334155, x, y + 1.75, z + 0.2, 0, 0, 0, 0.08, 0.35, 0.08); w.add('x', rbox(4.6, 0.04, 0.22, 0.02), 0x334155, x, y + 2.12, z + 0.2, 0, 0.3, 0); w.add('x', rbox(0.22, 0.04, 4.6, 0.02), 0x334155, x, y + 2.12, z + 0.2, 0, 0.3, 0);
    w.solid(x - 2.1, 0, z - 1.4, x + 2.1, y + 2.2, z + 1.4); txt(w, 'IN FOR A TUNE-UP', x, 0.4, z + 1.45, 0, 0.14, 0x111827); }
  act({ room: 'hangar', x: 21, z: -28.7, r: 2.4, label: '🔧 Rotor tune-up', mg: 'tune' });
  // pegboard tool wall + toolboxes + workbench
  { const x0 = 12.5, x1 = 19; w.add('m', rbox(x1 - x0, 1.6, 0.05, 0.02), 0xd6b88a, (x0 + x1) / 2, 2.1, -35.7); for (let i = 0; i < 9; i++) { const x = x0 + 0.5 + i * 0.7; if (i % 3 === 0) { w.add('x', rbox(0.06, 0.55, 0.03, 0.01), 0x64748b, x, 2.3, -35.62); w.add('x', torus(0.3, 10), 0x64748b, x, 2.62, -35.62, 0, 0, 0, 0.09); } else if (i % 3 === 1) { w.add('m', capsule(6), 0xb45309, x, 2.0, -35.62, 0, 0, 0, 0.06, 0.4, 0.06); w.add('x', rbox(0.28, 0.1, 0.08, 0.02), 0x475569, x, 2.32, -35.6); } else { w.add('g', capsule(6), 0xdc2626, x, 1.95, -35.62, 0, 0, 0, 0.07, 0.3, 0.07); w.add('x', cyl(6), 0x94a3b8, x, 2.1, -35.62, 0, 0, 0, 0.015, 0.4, 0.015); } } txt(w, 'SAFETY FIRST · NO BONKING', 15.75, 3.3, -35.7, 0, 0.2, 0xdc2626); }
  K.hh('toolbox', w, 13.5, -34.9, 0.16, 0, 0xdc2626); K.hh('toolbox', w, 17.8, -34.9, 0.16, 0, 0x2563eb); K.hh('workbench', w, 26, -34.9, 0.16, 0, 20, 6, 6); for (let i = 0; i < 5; i++) w.add('x', torus(0.3, 10), 0x94a3b8, 24.6 + i * 0.6, 0.98, -34.9, PI / 2, 0, 0, 0.12); w.add('g', rbox(0.5, 0.3, 0.35, 0.04), 0xfacc15, 27, 1.1, -34.8);
  // fuel drums + tug cart
  [[9.2, -26.4, 0xef4444], [9.2, -25.3, 0x2563eb], [10.1, -25.9, 0xfacc15]].forEach(([x, z, c]) => { w.add('x', cyl(16), c, x, 0, z, 0, 0, 0, 0.4, 1.1, 0.4); w.add('x', torus(0.08, 16), 0x334155, x, 0.75, z, PI / 2, 0, 0, 0.4); w.solid(x - 0.4, 0, z - 0.4, x + 0.4, 1.1, z + 0.4); });
  { const x = 14.6, z = -21; w.slab('g', 0xfacc15, x, 0.3, z, 1.6, 0.6, 1.0, 0.1); w.add('g', rbox(0.6, 0.7, 0.8, 0.08), 0xfacc15, x - 0.4, 1.15, z); w.add('e', rbox(0.06, 0.4, 0.7, 0.02), 0xbfe9ff, x - 0.05, 1.35, z); [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]].forEach(([a, b]) => w.add('m', torus(0.45, 14), 0x111827, x + a, 0.3, z + b, 0, 0, 0, 0.22, 0.22, 0.35)); txt(w, 'TUG', x + 0.3, 0.55, z + 0.52, 0, 0.14, 0x111827); }
  { const x = 26.5, z = -29.5; w.slab('x', 0x475569, x, 0.25, z, 1.4, 0.06, 0.8, 0.02); w.slab('x', 0x475569, x, 0.8, z, 1.4, 0.06, 0.8, 0.02); [[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]].forEach(([a, b]) => { w.add('x', cyl(6), 0x94a3b8, x + a, 0.1, z + b, 0, 0, 0, 0.03, 0.8, 0.03); w.add('m', sph(8), 0x111827, x + a, 0.08, z + b, 0, 0, 0, 0.08); }); for (let i = 0; i < 3; i++) w.add('g', rbox(0.3, 0.22, 0.25, 0.04), BR[i * 2], x - 0.4 + i * 0.4, 0.97, z); w.add('x', torus(0.3, 12), 0x94a3b8, x, 0.4, z, PI / 2, 0, 0, 0.25); }
  act({ room: 'hangar', x: 26.5, z: -28.2, r: 1.6, label: '🧰 Sort the spare parts', chore: { id: 'parts', msg: '🧰 Bolts with bolts, nuts with nuts, and one mystery cheese wedge (Luna\'s). Brie gives you a thumbs-up.', fx: 0xfacc15 } });
  for (let i = 0; i < 5; i++) w.add('m', torus(0.45, 16), 0x1f2937, 30.9, 0.2 + i * 0.36, -16.9 + 0, PI / 2, 0, 0, 0.5, 0.5, 0.6); w.solid(30.4, 0, -17.4, 31.4, 1.8, -16.4);
  { for (let i = 0; i < 3; i++) w.add('m', rbox(0.12, 0.05, 3.2, 0.02), 0x334155, 8.4, 1.6 + i * 0.5, -31.2); w.add('m', rbox(0.1, 1.8, 0.1, 0.02), 0x64748b, 8.35, 1.4, -32.9); w.add('m', rbox(0.1, 1.8, 0.1, 0.02), 0x64748b, 8.35, 1.4, -29.5); txt(w, 'SPARE ROTORS', 8.45, 2.9, -31.2, PI / 2, 0.16, 0x111827); }
  { w.add('f', rbox(9, 1.0, 0.04, 0.01), 0xff4fa0, 20, 6.4, -35.55); txt(w, 'SNOWIE SKY TOURS · MAINTENANCE', 20, 6.25, -35.5, 0, 0.32, 0xffffff); }
  for (let i = 0; i < 4; i++) w.add('l', sph(8), i % 2 ? 0xffd23f : 0xff4fa0, 10 + i * 6.5, 7.2, -35.6, 0, 0, 0, 0.12, 0.12, 0.12, 0.8);
  npc({ id: 'sprocket', breed: 'pupcorgi', s: 0.8, room: 'hangar', at: [18.6, -28.6], yaw: PI / 4, name: 'Sprocket', lines: [['Sprocket', 'I tighten the bolts. Brie tightens the OTHER bolts. Together we are... the Bolt Pups!'], ['Sprocket', 'Wanna help tune the rotors? The needle has to land in the green. Easy. Mostly.']], mg: 'tune' });
  npc({ id: 'rosa', human: true, look: { skin: 2, hair: 3, hairC: 3, shirt: 0, pants: 1 }, room: 'hangar', at: [12.6, -22.6], yaw: PI / 2, name: 'Captain Rosa', lines: [['Captain Rosa', 'Thirty years of flying and I\'ve never been towed home. ... Okay, twice. The tow-drone is very good at its job.']] }); }
// ---------------- Pilot Lounge ----------------
function lounge(w) { w.region = 'in_lounge';
  { const x = -19.8, z = 13; const T = w.tf(x, 0, z, 0); T.slab('g', 0xff4fa0, 0, 0, 0, 1.2, 2.0, 0.9, 0.08); T.box('l', 0xffd23f, 0, 1.25, 0.46, 0.9, 0.6, 0.02, 0.02, 0.35); T.box('g', 0x3ff0ff, 0, 0.95, 0.4, 1.0, 0.1, 0.4, 0.03); txt(w, 'SKY ACE 2', x, 1.75, z + 0.48, 0, 0.13, 0xffffff); }
  act({ room: 'lounge', x: -21, z: 14.6, r: 2.0, label: '🕹️ Play SKY ACE', mg: 'skyace' });
  // ping-pong table
  { const x = -22.4, z = 18.4; w.slab('g', 0x15803d, x, 0.68, z, 2.6, 0.06, 1.45, 0.02); w.add('m', rbox(2.62, 0.01, 0.03, 0.005), 0xffffff, x, 0.745, z); w.add('m', rbox(0.03, 0.16, 1.5, 0.01), 0xf1f5f9, x, 0.82, z); [[-1.1, -0.6], [1.1, -0.6], [-1.1, 0.6], [1.1, 0.6]].forEach(([a, b]) => w.add('x', cyl(6), 0x334155, x + a, 0, z + b, 0, 0, 0, 0.04, 0.68, 0.04)); w.add('g', sph(8), 0xffffff, x + 0.6, 0.79, z + 0.3, 0, 0, 0, 0.03); [-1, 1].forEach((s) => w.add('g', rcyl(0.09, 0.02, 0.01, 12), 0xdc2626, x + s * 1.0, 0.75, z - 0.2 * s)); w.solid(x - 1.3, 0, z - 0.73, x + 1.3, 0.74, z + 0.73); }
  act({ room: 'lounge', x: -22.4, z: 19.6, r: 1.8, label: '🏓 Ping-pong rally', chore: { id: 'pong', msg: '🏓 Pip! Pop! Pip! A 14-hit rally! Pilot Pip says you have "co-pilot reflexes".', fx: 0xffffff } });
  // coffee bar on the south wall
  { const T = counter(w, -20.2, 25.55, PI, 3.0, 0x1f2937, 0x0e7490); const p = T.P(0.8, 0, 0); w.add('x', rbox(0.45, 0.5, 0.4, 0.05), 0x94a3b8, p[0], 1.18, p[2]); w.add('g', rbox(0.12, 0.1, 0.12, 0.02), 0x111827, p[0], 1.0, p[2] - 0.2); for (let i = 0; i < 4; i++) mug(w, -21.4 + i * 0.25, 0.95, 25.5, BR[i]); K.hhY('jar', w, -18.9, 0.95, 25.5, 0.13, 0xc08552, 0xff4fa0); txt(w, 'FUEL FOR PILOTS', -20.2, 2.6, 25.72, PI, 0.16, 0xffd23f); }
  act({ room: 'lounge', x: -20.2, z: 24.2, r: 1.8, label: '☕ Grab a pilot coffee', chore: { id: 'coffee', msg: '☕ Extra foam, a rotor drawn in the milk. You feel ready for loop-the-loops.', fx: 0xfef3c7, zoom: 6 } });
  // bean bags, lockers, TV + flight sim chair
  [[-23.6, 22.8, 0xffd23f], [-21.9, 23.3, 0xa78bfa]].forEach(([x, z, c]) => { w.add('f', sph(16), c, x, 0.3, z, 0, 0, 0, 0.62, 0.36, 0.6); w.add('f', sph(14), c, x, 0.55, z + 0.25, 0, 0, 0, 0.45, 0.32, 0.25); w.solid(x - 0.5, 0, z - 0.5, x + 0.5, 0.5, z + 0.5, { cam: false }); });
  for (let i = 0; i < 4; i++) { const z = 21.4 + i * 0.62; w.add('x', rbox(0.5, 2.0, 0.58, 0.03), [0x3ff0ff, 0xff4fa0, 0xffd23f, 0x4ade80][i], -16.35, 1.0, z); w.add('x', rbox(0.02, 0.18, 0.22, 0.005), 0x334155, -16.62, 1.7, z); w.add('m', rbox(0.02, 0.14, 0.2, 0.005), 0xffffff, -16.62, 1.2, z); } w.solid(-16.6, 0, 21.1, -16.1, 2, 23.7);
  tvSet(w, -26.6, 12.45, 0, 0x7dd3fc); txt(w, 'CLOUDY, CHANCE OF SNOWIE', -26.6, 0.92, 12.5, 0, 0.065, 0xffffff, 'l', 0.4);
  shelfRack(w, -31.55, 23, PI / 2, 1.8, 1.8, 0x9a6a3e, (x, y, z, i, k) => { if (i === 0) books(w, x, y, z, 4, 'z'); else if (i === 1) { w.add('g', lathe([[0, 0], [0.08, 0], [0.08, 0.05], [0.03, 0.08], [0.06, 0.24], [0, 0.26]], 12, 'trophy'), 0xfacc15, x, y, z); } else plush(w, x, y, z, 0xffffff, 0.7); });
  lightString(w, Array.from({ length: 10 }, (_, i) => [-31.4 + i * 1.5, 12.35]), 3.6);
  npc({ id: 'pip', pet: 'blue', extras: ['goggles'], s: 1.0, room: 'lounge', at: [-20, 15.6], yaw: PI, name: 'Pilot Pip', lines: [['Pilot Pip', 'I hold the SKY ACE high score. Well, Pilot Pat says HE does. The machine says "29 (probably)".'], ['Pilot Pip', 'Wanna try? Tap to climb, let go to dive!']], mg: 'skyace' });
  npc({ id: 'naptime', breed: 'pug', s: 0.7, room: 'lounge', at: [-23.6, 22.8], y: 0.55, mode: 'sleep', noTurn: true, yaw: 0.5, name: 'Bean', lines: [['Bean', '...zzz... (Bean is "on standby". Very serious pilot business.)']] }); }
// ---------------- Pup Town Hall ----------------
function hall(w) { const X = -240, Z = -150; w.region = 'in_hall';
  // forms counter (Stamp the Forms) on the west wall
  { const T = counter(w, X - 11.3, Z - 34, PI / 2, 4, 0xfacc15, 0x7c3f2c); paperStackA(w, X - 11.3, 0.95, Z - 35.4); paperStackA(w, X - 11.4, 0.95, Z - 32.8); w.add('g', rbox(0.3, 0.06, 0.2, 0.02), 0x1f2937, X - 11.2, 0.98, Z - 34.1); w.add('g', rcyl(0.05, 0.16, 0.01, 10), 0xdc2626, X - 11.2, 1.01, Z - 33.6); w.add('g', sph(8), 0xdc2626, X - 11.2, 1.2, Z - 33.6, 0, 0, 0, 0.07); txt(w, 'FORMS & PERMITS', X - 11.85, 2.7, Z - 34, PI / 2, 0.22, 0xfacc15); }
  act({ room: 'hall', x: X - 9.9, z: Z - 34, r: 2.2, label: '📝 Stamp the forms', mg: 'forms' });
  [Z - 27.4, Z - 26.6].forEach((z) => K.filing(w, X - 11.5, z, PI / 2, 0x94a3b8, 3)); K.whiteboard(w, 'x', Z - 22.25, X - 7.5, 1.2, 2.6, -1); txt(w, 'LOST: 1 SQUEAKY BONE. FOUND: 4.', X - 7.5, 2.75, Z - 22.3, PI, 0.12, 0x2563eb);
  // trophy case + Candy's portrait (east wall)
  { const x = X + 11.45, z = Z - 31.5; w.add('m', rbox(0.6, 0.3, 3.0, 0.04), 0x7c3f2c, x, 0.15, z); w.add('e', rbox(0.56, 1.6, 2.96, 0.04), 0xdff6ff, x, 1.1, z); w.add('m', rbox(0.6, 0.1, 3.0, 0.03), 0x7c3f2c, x, 1.95, z); for (let i = 0; i < 2; i++) w.add('m', rbox(0.5, 0.03, 2.9, 0.01), 0xffffff, x, 0.8 + i * 0.55, z);
    for (let i = 0; i < 8; i++) { const zz = z - 1.2 + (i % 4) * 0.8, yy = 0.83 + (i / 4 | 0) * 0.55; w.add('g', lathe([[0, 0], [0.09, 0], [0.09, 0.04], [0.03, 0.08], [0.1, 0.28], [0, 0.3]], 12, 'trophy2'), i % 3 ? 0xfacc15 : 0xd1d5db, x, yy, zz); } w.solid(x - 0.3, 0, z - 1.5, x + 0.3, 2, z + 1.5);
    txt(w, 'BEST DOG TROPHIES', x - 0.35, 2.3, z, -PI / 2, 0.18, 0xfacc15); }
  act({ room: 'hall', x: X + 10, z: Z - 31.5, r: 2.0, label: '🏆 Read the trophies', talk: [['Trophy plaque', '"Best Nap, 7 Years Running: CANDY." (There is a little doormat engraved on it.)'], ['Trophy plaque', '"Fastest Fetch: Rusty." "Loudest Bark: Bean." "Most Patient Mayor: Goldie (self-awarded)."']] });
  frameArt(w, 'z', X + 11.75, Z - 26.8, 2.6, 1.3, 1.0, 0x9ca3af, -1); { const x = X + 11.6, z = Z - 26.8; w.add('f', sph(12), 0x6b7280, x, 2.55, z, 0, 0, 0, 0.05, 0.28, 0.3); w.add('f', sph(10), 0x9ca3af, x - 0.02, 2.82, z, 0, 0, 0, 0.05, 0.18, 0.2); } txt(w, 'EMPLOYEE OF THE MONTH', X + 11.68, 3.35, Z - 26.8, -PI / 2, 0.12, 0xfacc15);
  // waiting bench + water bowls, podium, ceiling bunting
  { const x = X + 11.2, z = Z - 23.8; w.slab('m', 0x7c3f2c, x, 0.42, z, 0.6, 0.08, 2.4, 0.03); w.add('m', rbox(0.08, 0.6, 2.4, 0.03), 0x7c3f2c, x + 0.27, 0.8, z); [-1, 1].forEach((s) => w.add('m', rbox(0.5, 0.42, 0.08, 0.02), 0x5b3a1e, x, 0.21, z + s * 1.1)); }
  K.hh('dogBowl', w, X + 9.6, Z - 22.8, 0.16, 0x60a5fa, 0x7dd3fc); K.hh('dogBowl', w, X + 8.9, Z - 22.8, 0.16, 0xdc2626, 0x9a5b2d);
  { const x = X - 4.6, z = Z - 33.6; w.slab('m', 0x7c3f2c, x, 0, z, 0.8, 1.05, 0.6, 0.06); w.add('x', cyl(6), 0x334155, x, 1.05, z + 0.1, 0.4, 0, 0, 0.012, 0.35, 0.012); w.add('x', sph(8), 0x111827, x, 1.38, z + 0.24, 0, 0, 0, 0.05); bone(w, 'g', 0xfacc15, x, 0.6, z + 0.31, 0, 0.18); }
  for (let i = 0; i < 12; i++) { const x = X - 11 + i * 2, y = 4.7 - Math.abs(Math.sin(i * 1.3)) * 0.1; w.add('f', wedge(), i % 2 ? 0xdc2626 : 0xfacc15, x, y, Z - 31, PI, 0, -PI / 2, 0.45, 0.45, 0.4); } rope(w, [[X - 11.5, 4.9, Z - 31], [X, 4.6, Z - 31], [X + 11.5, 4.9, Z - 31]], 0xffffff);
  npc({ id: 'clerk', breed: 'dachshund', s: 0.8, room: 'hall', at: [X - 9.6, Z - 31.2], yaw: -PI / 2, name: 'Clerk Frankie', lines: [['Clerk Frankie', 'Every form in Pup Town gets a stamp. Then Candy naps on it. Then it gets ANOTHER stamp. That one says "napped on".'], ['Clerk Frankie', 'Help me stamp the pile? Quick, before she wakes up. Or... falls asleep. Same thing.']], mg: 'forms' });
  npc({ id: 'duchess', breed: 'poodle', collar: 0xa855f7, s: 0.75, room: 'hall', at: [X + 9.6, Z - 24.8], yaw: -PI / 2, name: 'Duchess', lines: [['Duchess', 'I am applying for a permit to bark at the mail carrier. Officially. With paperwork.']] });
  npc({ id: 'puppy', breed: 'chihuahua', s: 0.7, room: 'hall', at: [X - 7, Z - 23.4], yaw: PI, name: 'Peanut', walk: [[X - 7, Z - 23.4], [X + 7, Z - 23.4]], lines: [['Peanut', 'Shhh! Candy is napping! She always naps on the IMPORTANT forms. It\'s her job.']] }); }
// ---------------- Barkery ----------------
function barkery(w) { const X = -240, Z = -150; w.region = 'in_barkery';
  // bread + treat shelves behind the counter (east wall)
  shelfRack(w, X + 27.55, Z - 9.5, -PI / 2, 2.6, 2.0, 0xd6a96a, (x, y, z, i, k) => { if (i % 2 === 0) w.add('g', capsule(8), 0xc08552, x, y + 0.08, z, PI / 2, 0, PI / 2, 0.14, 0.28, 0.14); else bone(w, 'g', pick([0xfde68a, 0xf9a8d4, 0xc08552]), x, y + 0.07, z, PI / 2, 0.1); });
  // menu chalkboard (north wall) + cake stand + cookie jars on the counter
  { const x = X + 20, z = Z - 15.72; w.add('m', rbox(3.2, 1.3, 0.06, 0.03), 0x1f2937, x, 2.4, z); w.add('m', rbox(3.4, 1.5, 0.04, 0.03), 0x92400e, x, 2.4, z - 0.02); txt(w, 'MENU', x, 2.85, z + 0.05, 0, 0.2, 0xffffff); ['PUP-TART .... 1 BONE', 'BARK-ELS ..... 2 BONES', 'PAWCAKES ..... 3 BONES'].forEach((s, i) => txt(w, s, x, 2.5 - i * 0.24, z + 0.05, 0, 0.1, [0xfde68a, 0xf9a8d4, 0x93c5fd][i])); }
  { const x = X + 23, z = Z - 12.4; [0.32, 0.24, 0.16].forEach((r, i) => w.add('g', rcyl(r, 0.14, 0.04, 20), [0xfbcfe8, 0xffffff, 0xf472b6][i], x, 1.12 + i * 0.14, z)); w.add('g', sph(8), 0xdc2626, x, 1.58, z, 0, 0, 0, 0.05); }
  K.hhY('jar', w, X + 23, 1.05, Z - 7.4, 0.12, 0xc08552, 0xf472b6); K.hhY('jar', w, X + 23, 1.05, Z - 6.9, 0.12, 0xfde68a, 0x60a5fa);
  // flour sacks near the oven, bunting
  [[X + 26.6, Z - 15.1], [X + 25.9, Z - 15.3]].forEach(([x, z], i) => { w.add('f', sph(12), 0xf5f5f4, x, 0.38, z, 0, i, 0, 0.32, 0.4, 0.28); txt(w, 'FLOUR', x, 0.45, z + 0.29, 0, 0.07, 0x92400e); }); w.solid(X + 25.5, 0, Z - 15.6, X + 27, 0.8, Z - 14.8);
  for (let i = 0; i < 9; i++) w.add('f', wedge(), i % 2 ? 0xf472b6 : 0xffffff, X + 14.8 + i * 1.5, 3.7, Z - 15.8, PI, 0, -PI / 2, 0.3, 0.3, 0.3);
  // frosting station (Frost the Pup-Tarts) on the south wall
  { const T = counter(w, X + 19.4, Z - 4.55, PI, 2.2, 0xfbcfe8, 0xffffff, 0.9); for (let i = 0; i < 3; i++) { const p = T.P(-0.7 + i * 0.7, 0, 0); w.add('g', cone(10), [0xf472b6, 0x60a5fa, 0xfacc15][i], p[0], 0.9, p[2], PI, 0, 0, 0.07, 0.3, 0.07); w.add('g', sph(10), [0xf472b6, 0x60a5fa, 0xfacc15][i], p[0], 1.25, p[2], 0, 0, 0, 0.12, 0.15, 0.12); } for (let i = 0; i < 4; i++) bone(w, 'g', 0xd9a066, X + 18.6 + i * 0.45, 0.94, Z - 4.8, PI / 2, 0.12); txt(w, 'FROSTING STATION', X + 19.4, 2.2, Z - 4.3, PI, 0.15, 0xbe185d); }
  act({ room: 'barkery', x: X + 19.4, z: Z - 5.9, r: 1.9, label: '🦴 Frost the Pup-Tarts', mg: 'frost' });
  K.potPlant(w, X + 15, 0, Z - 4.8, 0.9, 0xf472b6);
  npc({ id: 'pudding', breed: 'pug', s: 0.72, room: 'barkery', at: [X + 18.6, Z - 11.2], yaw: 0, name: 'Pudding', lines: [['Pudding', '*munch munch* Do you ever eat a Pup-Tart so good you forget your own name? ... What was I saying?']] });
  npc({ id: 'tiny', breed: 'chihuahua', s: 0.65, room: 'barkery', at: [X + 20.6, Z - 8.4], yaw: PI / 2, name: 'Tiny', lines: [['Tiny', 'I\'m in line! I\'ve been in line since breakfast. It\'s a very good line.']] }); }
// ---------------- Shell Museum ----------------
function museum(w) { const X = 210, Z = -180; w.region = 'in_museum';
  // giant tortoise fossil
  { const x = X + 24.5, z = Z - 35.5; w.slab('m', 0xd6c7ae, x, 0, z, 4.2, 0.35, 2.4, 0.06); for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.22; w.add('g', sph(10), 0xfef3c7, x + Math.sin(a) * 1.6, 0.35 + Math.cos(a) * 1.3, z, 0, 0, 0, 0.16); } for (let i = 0; i < 5; i++) w.add('g', torus(0.07, 20, PI), 0xfef3c7, x - 1.2 + i * 0.6, 0.35, z, 0, 0, 0, 1.0 - Math.abs(i - 2) * 0.12, 1.25 - Math.abs(i - 2) * 0.22, 0.8);
    w.add('g', sph(12), 0xfef3c7, x + 2.05, 0.95, z, 0, 0, 0, 0.36, 0.28, 0.3); [-1, 1].forEach((s) => [-1, 1].forEach((t) => w.add('g', capsule(8), 0xfef3c7, x + s * 1.0, 0.5, z + t * 0.75, 0, 0, 0.3 * s, 0.14, 0.5, 0.14))); w.solid(x - 2.1, 0, z - 1.2, x + 2.1, 1.8, z + 1.2); txt(w, 'GRANDPA SHELLDON, 1,000,000 YEARS OLD (ISH)', x, 0.2, z + 1.25, 0, 0.1, 0x0f766e); }
  // observatory telescope
  { const x = X + 36, z = Z - 34.5; [0, 2.1, 4.2].forEach((a) => w.add('x', capsule(6), 0x334155, x + Math.cos(a) * 0.35, 0.55, z + Math.sin(a) * 0.35, Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35, 0.06, 1.1, 0.06)); w.add('g', cyl(16), 0xfacc15, x, 1.15, z, 0.9, 0, 0, 0.18, 1.6, 0.18); w.add('g', cyl(16), 0x0f766e, x, 1.15, z, 0.9, 0, 0, 0.12, -0.5, 0.12); w.solid(x - 0.45, 0, z - 0.45, x + 0.45, 1.4, z + 0.45); }
  act({ room: 'museum', x: X + 36, z: Z - 33.1, r: 1.8, label: '🔭 Peek through the telescope', chore: { id: 'scope', msg: '🔭 You spot Snowie\'s copter... from inside the museum. Wait, that\'s a seagull. A very fluffy seagull.', fx: 0x5eead4 } });
  // Shell Match kiosk (east wall)
  { const T = w.tf(X + 41.35, 0, Z - 28.5, -PI / 2); T.slab('g', 0x14b8a6, 0, 0, 0, 1.2, 1.0, 0.55, 0.08); T.box('l', 0xccfbf1, 0, 1.0, 0, 1.0, 0.7, 0.06, 0.03, 0.3); T.box('g', 0x0f766e, 0, 1.7, -0.05, 1.2, 0.12, 0.12, 0.03); txt(w, 'SHELL MATCH', X + 41.35, 2.05, Z - 28.5, -PI / 2, 0.14, 0x0f766e); }
  act({ room: 'museum', x: X + 40, z: Z - 28.5, r: 1.9, label: '🐚 Play Shell Match', mg: 'shells' });
  // stanchions + placards in front of the shell cases
  for (let i = 0; i < 10; i++) { const x = X + 20.5 + i * 2.3; w.add('x', cyl(10), 0xfacc15, x, 0, Z - 39.2, 0, 0, 0, 0.05, 0.9, 0.05); w.add('x', rcyl(0.16, 0.05, 0.02, 12), 0xfacc15, x, 0, Z - 39.2); w.solid(x - 0.08, 0, Z - 39.28, x + 0.08, 0.9, Z - 39.12); if (i < 9) rope(w, [[x, 0.85, Z - 39.2], [x + 1.15, 0.62, Z - 39.15], [x + 2.3, 0.85, Z - 39.2]]); }
  for (let i = 0; i < 5; i++) { const x = X + 21 + i * 4.5; w.add('m', rbox(0.6, 0.38, 0.05, 0.02), 0x0f766e, x, 0.75, Z - 39.6, -0.6, 0, 0); w.add('x', cyl(6), 0x334155, x, 0, Z - 39.65, 0, 0, 0, 0.02, 0.6, 0.02); }
  [[X + 26.5, Z - 29.5, 0xf472b6], [X + 33.5, Z - 29.5, 0xfacc15]].forEach(([x, z, c]) => { w.add('m', rbox(0.9, 1.0, 0.9, 0.05), 0xfef3c7, x, 0.5, z); w.addFn('g', sph(20), (cc, px, py, pz) => cc.set(Math.floor((px - x) * 6 + (pz - z) * 4) & 1 ? c : 0xffffff), x, 1.25, z, 0, 0, 0, 0.32, 0.22, 0.38); w.add('e', rbox(0.8, 0.7, 0.8, 0.04), 0xdff6ff, x, 1.35, z); w.solid(x - 0.45, 0, z - 0.45, x + 0.45, 1.7, z + 0.45); });
  K.potPlant(w, X + 19, 0, Z - 41.5, 1.1, 0x14b8a6); K.potPlant(w, X + 41, 0, Z - 41.5, 1.1, 0x14b8a6);
  frameArt(w, 'z', X + 18.25, Z - 34, 2.4, 1.6, 1.1, 0xa7f3d0, 1); frameArt(w, 'z', X + 18.25, Z - 29.5, 2.4, 1.6, 1.1, 0xfde68a, 1); txt(w, 'SHELLS THROUGH THE AGES', X + 18.35, 3.6, Z - 31.7, PI / 2, 0.18, 0x0f766e);
  // gift shelf + bench
  shelfRack(w, X + 18.55, Z - 27, PI / 2, 2.0, 1.6, 0x0f766e, (x, y, z, i, k) => w.add('g', sph(10), [0xf472b6, 0xfacc15, 0x5eead4, 0xc4b5fd][(i + k) & 3], x, y + 0.08, z, 0, k, 0, 0.12, 0.08, 0.14));
  { const x = X + 25, z = Z - 26.4; w.slab('m', 0x8b5e34, x, 0.4, z, 2.2, 0.08, 0.55, 0.03); [-1, 1].forEach((s) => w.add('m', rbox(0.08, 0.4, 0.5, 0.02), 0x5b3a1e, x + s * 1.0, 0.2, z)); }
  lightString(w, Array.from({ length: 12 }, (_, i) => [X + 19 + i * 2, Z - 43.7]), 4.9);
  npc({ id: 'ttkid1', pet: 'torty', s: 0.45, room: 'museum', at: [X + 22.8, Z - 37.6], yaw: PI, name: 'Little Pip', lines: [['Little Pip', 'Grandpa Shelldon was SO big! When I grow up I\'m going to be a fossil too!']] });
  npc({ id: 'ttkid2', pet: 'torty', s: 0.42, room: 'museum', at: [X + 37.2, Z - 37.4], yaw: PI, name: 'Twiggy', lines: [['Twiggy', 'This shell got drop-tested 400 times. I\'ve only been drop-tested twice. Off the couch.']] });
  npc({ id: 'guard', pet: 'ash', extras: ['glasses'], s: 1.0, room: 'museum', at: [X + 40.4, Z - 38.6], yaw: -PI / 2, name: 'Guard Gus', lines: [['Guard Gus', 'No touching the shells. No licking the shells. Yes, I have to say the licking one. Pup Town field trips.'], ['Guard Gus', 'The memory game by the wall is fine to touch, though. Torty insists.']], mg: 'shells' }); }
// ---------------- Ratita Gadget Shop ----------------
function gadget(w) { const X = 210, Z = -180; w.region = 'in_gadget';
  // two display islands with gizmos
  [[X - 35.6, Z - 28.6], [X - 28.4, Z - 28.6]].forEach(([x, z], j) => { w.slab('g', 0xffffff, x, 0, z, 2.0, 0.85, 1.1, 0.06); w.add('g', rbox(2.04, 0.06, 1.14, 0.02), 0xff4fa0, x, 0.88, z);
    if (j === 0) { w.add('g', rbox(0.4, 0.12, 0.4, 0.04), 0x334155, x - 0.6, 0.97, z); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { w.add('x', cyl(6), 0x94a3b8, x - 0.6 + a * 0.22, 0.97, z + b * 0.22, 0, 0, 0, 0.012, 0.1, 0.012); w.add('g', rcyl(0.12, 0.01, 0.005, 12), 0x3ff0ff, x - 0.6 + a * 0.22, 1.08, z + b * 0.22); }); w.add('x', torus(0.25, 8), 0xfacc15, x + 0.1, 1.15, z, 0, 0, 0, 0.22); w.add('g', cone(12), 0xef4444, x + 0.65, 1.25, z, 0, 0, 0, 0.1, 0.25, 0.1); w.add('g', cyl(12), 0xffffff, x + 0.65, 0.91, z, 0, 0, 0, 0.1, 0.34, 0.1); }
    else { w.add('g', sph(12), 0x94a3b8, x - 0.5, 1.12, z, 0, 0, 0, 0.18); w.add('l', sph(6), 0x3ff0ff, x - 0.44, 1.16, z + 0.16, 0, 0, 0, 0.04, 0.04, 0.02, 0.8); w.add('g', rbox(0.3, 0.3, 0.3, 0.04), 0xfacc15, x + 0.2, 1.06, z); w.add('g', wedge(), 0xffd23f, x + 0.2, 1.24, z, PI / 2, 0, 0, 0.16); w.add('g', rcyl(0.16, 0.06, 0.02, 16), 0x334155, x + 0.7, 0.91, z); w.add('l', rcyl(0.1, 0.02, 0.01, 12), 0xff4fa0, x + 0.7, 0.97, z, 0, 0, 0, 1, 1, 1, 0.6); } });
  txt(w, 'NEW! CHEESE-O-MATIC 3000', X - 28.4, 1.42, Z - 28.04, 0, 0.08, 0xff4fa0);
  // Wire It Up test bench (east wall)
  { const T = w.tf(X - 24.6, 0, Z - 29.2, -PI / 2); T.slab('m', 0x475569, 0, 0, 0, 1.8, 0.9, 0.7, 0.05); T.box('g', 0x111827, 0, 0.9, -0.3, 1.7, 1.0, 0.08, 0.03); [0xef4444, 0x3ff0ff, 0xffd23f, 0x4ade80].forEach((c, i) => { T.add('l', sph(10), c, -0.6 + i * 0.4, 1.55, -0.24, 0, 0, 0, 0.08, 0.08, 0.04, 0.8); const p0 = T.P(-0.6 + i * 0.4, 1.2, -0.24), p1 = T.P(-0.4 + i * 0.25, 0.92, 0.15); w.add('f', tube([[p0[0], 1.2, p0[2]], [(p0[0] + p1[0]) / 2, 1.0, (p0[2] + p1[2]) / 2 + 0.05], [p1[0], 0.92, p1[2]]], 0.02, 8, 5), c, 0, 0, 0); }); txt(w, 'GADGET TEST BENCH', X - 24.3, 2.25, Z - 29.2, -PI / 2, 0.12, 0xffd23f); }
  act({ room: 'gadget', x: X - 25.7, z: Z - 29.2, r: 1.8, label: '🔌 Wire It Up (test gadgets)', mg: 'wires' });
  // pegboard of tools + sign behind Luna
  { w.add('m', rbox(5.2, 1.3, 0.05, 0.02), 0xd6b88a, X - 32, 2.3, Z - 35.7); for (let i = 0; i < 8; i++) { const x = X - 34.2 + i * 0.62; i % 2 ? w.add('x', rbox(0.05, 0.5, 0.03, 0.01), 0x64748b, x, 2.3, Z - 35.62) : w.add('g', capsule(6), BR[i], x, 2.2, Z - 35.62, 0, 0, 0, 0.07, 0.3, 0.07); } txt(w, 'RATITA INDUSTRIES', X - 32, 3.2, Z - 35.65, 0, 0.24, 0xff4fa0); }
  // crates of parts + ceiling pipes + robot vacuum
  K.crate(w, X - 38.9, 0, Z - 34.9, 0.8, 0xd8a15a); K.crate(w, X - 38.9, 0.8, Z - 34.9, 0.6, 0xff8fcb); K.pipes && K.pipes(w, 'x', Z - 35.5, X - 39.5, X - 24.5, 3.9);
  { const x = X - 31, z = Z - 24.6; w.add('g', rcyl(0.3, 0.1, 0.04, 20), 0xff4fa0, x, 0, z); w.add('l', sph(6), 0x4ade80, x, 0.12, z + 0.2, 0, 0, 0, 0.04, 0.03, 0.03, 0.8); }
  { const x = X - 32, y = 3.3, z = Z - 29; w.add('x', cyl(6), 0x94a3b8, x, y + 0.2, z, 0, 0, 0, 0.01, 0.9, 0.01); w.add('g', rbox(0.7, 0.2, 0.7, 0.06), 0xffd23f, x, y, z); w.add('g', wedge(), 0xfacc15, x, y + 0.12, z, PI / 2, 0, 0, 0.3); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { w.add('x', rbox(0.5, 0.04, 0.06, 0.01), 0x334155, x + a * 0.25, y + 0.05, z + b * 0.25, 0, Math.atan2(b, a), 0); w.add('g', rcyl(0.24, 0.02, 0.01, 16), 0xff4fa0, x + a * 0.45, y + 0.12, z + b * 0.45); }); txt(w, 'CHEESE DRONE (PROTOTYPE)', x, y - 0.3, z + 0.4, 0, 0.08, 0xff4fa0); }
  K.rug(w, X - 32, Z - 27, 0, 3.5, 2.5, 0xff4fa0, 0xffd23f);
  [[X - 26.2, Z - 23.0, 0x3ff0ff], [X - 25.4, Z - 23.0, 0xffd23f], [X - 24.6, Z - 23.0, 0x4ade80]].forEach(([x, z, c]) => { w.slab('g', c, x, 0, z, 0.7, 0.5, 0.6, 0.06); for (let i = 0; i < 4; i++) w.add('x', i % 2 ? sph(6) : torus(0.4, 8), 0x94a3b8, x - 0.18 + i * 0.12, 0.55, z, 0, 0, 0, 0.05); });
  txt(w, 'SPARE PARTS · 1 CHEESE EACH', X - 25.4, 0.8, Z - 22.68, 0, 0.07, 0x111827);
  frameArt(w, 'x', Z - 22.25, X - 36.5, 2.4, 1.2, 0.9, 0xfde68a, -1); frameArt(w, 'x', Z - 22.25, X - 27.5, 2.4, 1.2, 0.9, 0xbae6fd, -1);
  npc({ id: 'gizmo', pet: 'blue', extras: ['goggles'], s: 1.0, room: 'gadget', at: [X - 26.6, Z - 27.0], yaw: -PI / 2, name: 'Gizmo', lines: [['Gizmo', 'I\'m Luna\'s apprentice! Today I invented a hat that tells you if it\'s raining. It\'s a bucket. I\'m still working on it.'], ['Gizmo', 'Help test gadgets? Watch the lights, then copy them!']], mg: 'wires' });
  npc({ id: 'shopper', breed: 'shiba', s: 0.75, room: 'gadget', at: [X - 37.6, Z - 26.4], yaw: PI / 2, name: 'Mochi', lines: [['Mochi', 'I came for a squeaky toy and now I want a cheese-powered drone. This shop is dangerous.']] }); }
// ---------------- Toy Workshop ----------------
function workshop(w) { const X = -30, Z = 250; w.region = 'in_workshop';
  xmasTree(w, X - 42, Z + 30, 1.6);
  // toy train on an oval track
  { const x = X - 35, z = Z + 20.8; w.add('x', torus(0.03, 40), 0x64748b, x, 0.04, z, PI / 2, 0, 0, 2.2, 1.4, 1); w.add('x', torus(0.03, 40), 0x64748b, x, 0.04, z, PI / 2, 0, 0, 2.0, 1.2, 1); for (let i = 0; i < 4; i++) { const a = i * 0.45, px = x + Math.cos(a) * 2.1, pz = z + Math.sin(a) * 1.3; w.add('g', rbox(0.4, 0.3, 0.26, 0.04), [0xdc2626, 0x16a34a, 0x2563eb, 0xfacc15][i], px, 0.22, pz, 0, -a + PI / 2, 0); if (!i) w.add('g', cyl(8), 0x111827, px, 0.36, pz, 0, 0, 0, 0.06, 0.18, 0.06); } }
  act({ room: 'workshop', x: X - 35, z: Z + 22.6, r: 2.0, label: '🚂 Run the toy train', chore: { id: 'train', msg: '🚂 Choo choo! The toy train does three laps and toots "Jingle Bells". Badly. Perfectly.', fx: 0xfacc15 } });
  { const x = X - 32.5, z = Z + 17.3; w.add('g', rbox(2.6, 0.9, 1.4, 0.25), 0xdc2626, x, 0.75, z); w.add('g', rbox(0.5, 0.7, 1.4, 0.2), 0xdc2626, x - 1.3, 1.3, z); w.add('f', rbox(1.4, 0.2, 1.2, 0.08), 0x16a34a, x + 0.2, 1.25, z); [-1, 1].forEach((s) => w.add('x', tube([[x - 1.6, 0.1, z + s * 0.6], [x + 1.4, 0.1, z + s * 0.6], [x + 1.9, 0.6, z + s * 0.6]], 0.06, 8, 6), 0xfacc15, 0, 0, 0)); w.solid(x - 1.6, 0, z - 0.75, x + 1.6, 1.4, z + 0.75);
    K.hh('toolbox', w, x + 2.1, z + 0.2, 0.12, 0.4, 0xdc2626); for (let i = 0; i < 3; i++) w.add('g', lathe([[0, 0], [0.12, 0], [0.12, 0.22], [0, 0.22]], 12, 'can'), [0xdc2626, 0xfacc15, 0x16a34a][i], x + 1.8 + i * 0.25, 0, z - 0.7); txt(w, 'SLEIGH 2.0 (WIP)', x, 1.9, z, 0, 0.14, 0xffd23f); }
  act({ room: 'workshop', x: X - 32.5, z: Z + 18.7, r: 1.9, label: '🛷 Polish the sleigh', chore: { id: 'sleigh', msg: '🛷 Shiny! The sleigh now goes 3% faster. Santa will never know it was you. (Snowie will tell him.)', fx: 0xdc2626 } });
  K.hh('rockingHorse', w, X - 27.6, Z + 30.4, 0.13, PI); w.solid(X - 28.2, 0, Z + 29.6, X - 27, 1.0, Z + 31.2);
  // toy shelves (west wall)
  shelfRack(w, X - 43.55, Z + 23, PI / 2, 3.2, 2.4, 0xa0703f, (x, y, z, i, k) => { if (i === 0) w.add('g', rbox(0.2, 0.2, 0.2, 0.03), BR[(k * 3) & 7], x, y + 0.1, z); else if (i === 1) plush(w, x, y, z, [0xc08552, 0xffffff, 0xf472b6][k % 3], 0.8); else if (i === 2) { w.add('g', sph(10), BR[k & 7], x, y + 0.1, z, 0, 0, 0, 0.1); } else gift(w, x, y, z, 0.2, BR[(k + 1) & 7]); });
  // mail sacks of letters to Santa by the door
  [[X - 21.4, Z + 16.8], [X - 21.6, Z + 15.8]].forEach(([x, z], i) => { w.add('f', sph(12), 0xd6b88a, x, 0.45, z, 0, i, 0, 0.42, 0.5, 0.38); for (let k = 0; k < 3; k++) w.add('m', rbox(0.22, 0.02, 0.15, 0.005), 0xffffff, x - 0.1 + k * 0.08, 0.95 + k * 0.02, z, 0.3, k, 0); }); w.solid(X - 22, 0, Z + 15.3, X - 21, 0.9, Z + 17.3); txt(w, 'LETTERS', X - 21.5, 1.25, Z + 16.3, PI / 2, 0.12, 0xdc2626);
  act({ room: 'workshop', x: X - 22.4, z: Z + 16.3, r: 1.8, label: '✉️ Read a letter to Santa', letter: true });
  // ribbon spools + present piles
  for (let i = 0; i < 7; i++) w.add('f', cyl(14), BR[i], X - 28.5 + i * 0.4, 1.9, Z + 10.25, PI / 2, 0, 0, 0.16, 0.12, 0.16); w.add('x', rbox(3.0, 0.04, 0.04, 0.01), 0x94a3b8, X - 27.3, 2.06, Z + 10.3);
  [[X - 22.2, Z + 12.2], [X - 23.1, Z + 11.5], [X - 22.1, Z + 30.8], [X - 23.0, Z + 31.1]].forEach(([x, z], i) => { gift(w, x, 0, z, 0.55, BR[i * 2 & 7], 0xffffff, i); gift(w, x, 0.44, z, 0.36, BR[(i * 2 + 3) & 7], 0xfacc15, -i); w.solid(x - 0.3, 0, z - 0.3, x + 0.3, 0.75, z + 0.3); });
  lightString(w, Array.from({ length: 12 }, (_, i) => [X - 43.6 + i * 2, Z + 10.3]), 5.0); lightString(w, Array.from({ length: 12 }, (_, i) => [X - 43.6 + i * 2, Z + 31.7]), 5.0);
  npc({ id: 'jingle', pet: 'gold', extras: ['bow'], s: 1.1, room: 'workshop', at: [X - 37.6, Z + 17.8], yaw: 0.6, name: 'Jingle', lines: [['Jingle', 'I\'m in charge of the toy train! It runs on cocoa. Not really. Maybe a little.']] });
  npc({ id: 'tester', breed: 'pomeranian', s: 0.7, room: 'workshop', at: [X - 31.5, Z + 23.4], yaw: PI, name: 'Pip the Toy Tester', walk: [[X - 31.5, Z + 23.4], [X - 27.5, Z + 23.4], [X - 27.5, Z + 18]], lines: [['Pip', 'I\'m the Official Toy Tester! I tested 40 squeaky toys today. 39 passed. One squeaked BACK.']] }); }
// ---------------- Cocoa Cabin ----------------
function cocoa(w) { const X = -30, Z = 250; w.region = 'in_cocoa';
  { const T = w.tf(X + 32.6, 0, Z + 9.2, 0); stockings(w, T, 3, 1.25, 0.42); } K.rug(w, X + 30.2, Z + 10.8, 0, 2.8, 1.8, 0xdc2626, 0xfef3c7);
  armchair(w, X + 29.4, Z + 10.6, 2.4, 0xdc2626); armchair(w, X + 30.9, Z + 10.75, PI - 0.35, 0x16a34a);
  xmasTree(w, X + 21.2, Z + 19, 1.05);
  shelfRack(w, X + 25, Z + 8.35, 0, 2.0, 1.9, 0x7c3f2c, (x, y, z, i, k) => { if (i === 1) mug(w, x, y, z, BR[k]); else books(w, x, y, z, 4); });
  { const x = X + 33.72; w.add('m', rbox(0.05, 1.2, 2.4, 0.03), 0x1f2937, x, 2.6, Z + 14); txt(w, 'COCOA MENU', x - 0.05, 2.95, Z + 14, -PI / 2, 0.16, 0xfef3c7); ['CLASSIC', 'PEPPERMINT', 'MARSHMALLOW MOUNTAIN'].forEach((s, i) => txt(w, s, x - 0.05, 2.6 - i * 0.22, Z + 14, -PI / 2, 0.09, [0xfde68a, 0xfecaca, 0xffffff][i])); }
  { const x = X + 31.5, z = Z + 12.1; w.add('x', rcyl(0.3, 0.4, 0.04, 20), 0x7c3f2c, x, 1.0, z); w.add('m', rcyl(0.26, 0.02, 0.01, 20), 0x5b2a0e, x, 1.38, z); K.hhY('jar', w, x, 1.0, Z + 16.4, 0.13, 0xffffff, 0xef4444); }
  // marshmallow catch table
  { const x = X + 27, z = Z + 19.3; K.tableR(w, x, z, 0.5, 0.75, 0xfef3c7); K.hhY('jar', w, x, 0.75, z, 0.12, 0xffffff, 0x60a5fa); for (let i = 0; i < 5; i++) w.add('m', rbox(0.07, 0.06, 0.07, 0.02), 0xfff7ed, x + 0.25 + (i % 2) * 0.08, 0.78, z - 0.2 + i * 0.08); }
  act({ room: 'cocoa', x: X + 27, z: Z + 18.1, r: 1.8, label: '☕ Marshmallow Catch', mg: 'marsh' });
  lightString(w, Array.from({ length: 8 }, (_, i) => [X + 20.5 + i * 1.8, Z + 8.3]), 3.5); lightString(w, Array.from({ length: 8 }, (_, i) => [X + 20.5 + i * 1.8, Z + 19.7]), 3.5);
  frameArt(w, 'z', X + 20.25, Z + 11.5, 2.2, 1.0, 0.8, 0xbbf7d0, 1);
  npc({ id: 'truffle', pet: 'cocoa', s: 1.0, room: 'cocoa', at: [X + 25.6, Z + 15.2], yaw: PI / 2, name: 'Truffle', lines: [['Truffle', 'I\'m on my fourth cocoa. Marsh says I have to stop at five. I\'m drinking this one VERY slowly.']] });
  npc({ id: 'firedog', breed: 'collie', s: 0.75, room: 'cocoa', at: [X + 30.1, Z + 12.6], mode: 'sleep', noTurn: true, yaw: 2.4, name: 'Ember', lines: [['Ember', '...zzz... (Ember is toasty warm by the fire. One ear twitches when you say "cocoa".)']] }); }
// =====================================================================================================
// cottages: one generic, door-aware layout in a local frame (door always at local +z), with a resident and a chore
const COTT = {
  pupH0: { who: ['Biscuit', { breed: 'corgi' }], chore: ['kitchen', '🍪 Bake biscuits with Biscuit', '🍪 The kitchen smells like peanut butter. Biscuit eats three "for quality control".'], line: 'Welcome to my house! It\'s called Biscuit\'s House because I\'m Biscuit. And because of the biscuits.' },
  pupH1: { who: ['Ziggy', { breed: 'beagle' }], chore: ['petbed', '🎾 Play fetch with Ziggy', '🎾 Ziggy fetches the ball 11 times and brings back a sock once. Good boy.'], line: 'Fetch Cottage! I named it. I name everything Fetch. My couch is called Fetch.' },
  pupH2: { who: ['Granny Pug', { breed: 'pug' }], chore: ['bed', '🛏️ Fluff the pillows', '🛏️ Fluffed! Granny Pug immediately takes a nap. Mission accomplished.'], line: 'The Kennel Inn has the softest beds in Pup Town, dear. Candy stayed here once. She\'s still asleep, I think.' },
  pupH3: { who: ['Waggles', { breed: 'golden' }], chore: ['plant', '💧 Water the plants', '💧 Splish! The plants perk up. So does Waggles\' tail.'], line: 'Welcome to Wagstaff Home! Mind the plants. I talk to them. They\'re good listeners.' },
  pupH4: { who: ['Barkley', { breed: 'basset' }], chore: ['shelf', '📖 Read Barkley a story', '📖 "The Pup Who Flew" — Barkley howls at the good parts. All of the parts.'], line: 'Barkley Cabin. I\'m Barkley. I like books about adventures. I like naps more.' },
  tortH0: { who: ['Shellby', { pet: 'torty', s: 0.55 }], chore: ['kitchen', '🥬 Wash the lettuce', '🥬 Crisp and clean! Shellby says it\'s the best lettuce of the century. He would know.'], line: 'Welcome to Shellby Home. Take your time. Everybody here does.' },
  tortH1: { who: ['Slowpoke', { pet: 'torty', s: 0.5 }], chore: ['sofa', '🧶 Untangle the yarn', '🧶 Untangled! Slowpoke had been working on it since last Tuesday. Of last year.'], line: 'Hello... there... I was going to say something... but you already got here.' },
  tortH2: { who: ['Leafy', { pet: 'torty', s: 0.55 }], chore: ['plant', '🥗 Pick a salad', '🥗 Fresh dandelions, clover and one suspicious strawberry. Leafy approves.'], line: 'The Lettuce Patch is my house AND my lunch. Very efficient.' },
  tortH3: { who: ['Mossy', { pet: 'torty', s: 0.6 }], chore: ['shelf', '🪨 Polish the pebble collection', '🪨 Shiny! Mossy has 212 pebbles. Each has a name. That one is Gerald.'], line: 'Pebble Place, home of the finest pebble collection in Torty Town. Possibly the world.' },
  tortH4: { who: ['Nana Shell', { pet: 'torty', s: 0.62 }], chore: ['bed', '🥚 Tuck in the hatchlings', '🥚 Three hatchlings, three tiny blankets. They\'re asleep before you finish. Torty-speed!'], line: 'Hatchling House! Shh, the little ones are napping. They nap a lot. Like Candy.' },
  npH0: { who: ['Jingle Jr.', { pet: 'rose', extras: ['bow'] }], chore: ['shelf', '🔔 Ring the jingle bells', '🔔 Jingle jingle! Somewhere outside, a husky starts singing along.'], line: 'Jingle Cottage! My uncle Jingle runs the toy train. I run... the bells. All of them.' },
  npH1: { who: ['Frost', { breed: 'husky' }], chore: ['petbed', '🔥 Stoke the fire', '🔥 Crackle crackle. Frost flops in front of it like a fluffy rug.'], line: 'Frosty Lodge! It\'s cold outside, cozy inside. I prefer outside. My fur insists.' },
  npH2: { who: ['Peppermint', { pet: 'cream', extras: ['bow'] }], chore: ['kitchen', '🍬 Make candy canes', '🍬 Twist, twist, twist! A red-and-white candy cane. Don\'t tell the Candy Cane Pole.'], line: 'Peppermint House smells like peppermint. Every single day. I am not complaining.' },
  npH3: { who: ['Snowdrop', { breed: 'sheepdog' }], chore: ['sofa', '🧦 Hang the stockings', '🧦 All hung by the chimney with care. Snowdrop hangs one for Snowie too.'], line: 'Snowdrop Cabin! I can\'t see out the window because of my fur. I assume it\'s snowing.' },
};
export const COTTAGE_IDS = Object.keys(COTT);
export function cottageRoom(w, b, theme, door) { const id = b.id, C = COTT[id]; w.region = 'in_' + id; const kind = id.startsWith('pup') ? 'pup' : id.startsWith('tort') ? 'tort' : 'np';
  const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, a = { s: 0, e: PI / 2, n: PI, w: -PI / 2 }[door], c = Math.cos(a), sn = Math.sin(a);
  const ew = door === 'e' || door === 'w', hx = (ew ? b.z1 - b.z0 : b.x1 - b.x0) / 2, hz = (ew ? b.x1 - b.x0 : b.z1 - b.z0) / 2;
  const P = (lx, lz) => [cx + lx * c + lz * sn, cz - lx * sn + lz * c]; const ac = theme.ac, wood = kind === 'np' ? 0x8b5a2b : 0x9a6a3e;
  const at = (lx, lz, f) => { const p = P(lx, lz); f(p[0], p[1]); };
  // floor rug + ceiling light
  at(0, 0.2, (x, z) => { K.rug(w, x, z, a, Math.min(3.4, hx * 2 - 3), Math.min(2.4, hz * 2 - 3), ac, theme.ac2 || 0xfef3c7); pendant(w, x, z, ac, 3.0); w.lights.push({ x, y: 2.8, z, c: 0xfff1dc, i: 9, d: 10 }); });
  // bed (back-left) + nightstand + lamp
  at(-hx + 1.0, -hz + 1.25, (x, z) => bed(w, x, z, a, ac)); at(-hx + 2.25, -hz + 0.45, (x, z) => { w.slab('m', wood, x, 0, z, 0.5, 0.55, 0.45, 0.04); w.add('g', lathe([[0, 0], [0.12, 0], [0.04, 0.05], [0.03, 0.3], [0, 0.3]], 12, 'lampb'), 0xfef3c7, x, 0.55, z); w.add('f', lathe([[0.16, 0], [0.09, 0.18], [0, 0.18]], 16, 'lamps'), ac, x, 0.8, z); w.add('l', sph(8), 0xfff3c4, x, 0.84, z, 0, 0, 0, 0.06, 0.06, 0.06, 0.6); });
  // kitchen run along the back wall (right) + fridge
  at(hx - 2.0, -hz + 0.36, (x, z) => { const T = counter(w, x, z, a, 2.2, kind === 'np' ? 0xdc2626 : 0x4b5563, 0xf7f2e8); const s1 = T.P(-0.6, 0, 0.02), s2 = T.P(0.35, 0, 0.02); w.add('x', rcyl(0.12, 0.02, 0.01, 14), 0x111827, s1[0], 0.95, s1[2]); w.add('x', rcyl(0.12, 0.02, 0.01, 14), 0x111827, s1[0] + (s2[0] - s1[0]) * 0.3, 0.95, s1[2] + (s2[2] - s1[2]) * 0.3); K.hhY('pot', w, s1[0], 0.97, s1[2], 0.09, pick(BR)); K.hhY('kettle', w, s2[0], 0.95, s2[2], 0.08, ac);
    const s3 = T.P(0.85, 0, 0); w.add('g', lathe([[0, 0], [0.16, 0], [0.2, 0.1], [0, 0.1]], 14, 'fbowl'), 0xffffff, s3[0], 0.95, s3[2]); [0xef4444, 0xfacc15, 0x22c55e].forEach((fc, i) => w.add('g', sph(8), fc, s3[0] + (i - 1) * 0.07, 1.06, s3[2], 0, 0, 0, 0.06)); });
  at(hx - 0.5, -hz + 0.45, (x, z) => { const T = w.tf(x, 0, z, a); T.slab('g', kind === 'tort' ? 0xa7f3d0 : 0xe8f1ff, 0, 0, 0, 0.8, 1.9, 0.7, 0.08); T.box('x', 0xc0c7d2, -0.3, 0.9, 0.36, 0.04, 0.5, 0.04, 0.02); T.box('x', 0xc0c7d2, -0.3, 1.55, 0.36, 0.04, 0.25, 0.04, 0.02); for (let i = 0; i < 3; i++) T.add('g', rbox(0.1, 0.1, 0.01, 0.01), BR[i + 2], -0.05 + i * 0.13, 1.2 + (i % 2) * 0.15, 0.36); });
  // dining table (right, middle)
  at(hx - 1.25, 0.55, (x, z) => { K.tableR(w, x, z, 0.5, 0.75, theme.top || 0xfde68a); const s1 = P(hx - 1.25, 0.55 - 0.85), s2 = P(hx - 1.25, 0.55 + 0.85); K.stool(w, s1[0], s1[1], ac); K.stool(w, s2[0], s2[1], ac); w.add('g', rcyl(0.14, 0.02, 0.01, 14), 0xffffff, x + 0.15, 0.75, z); mug(w, x - 0.15, 0.75, z + 0.1, pick(BR)); });
  // sofa (left wall) + coffee table + TV / fireplace on the opposite wall
  at(-hx + 0.5, 1.0, (x, z) => K.sofa(w, x, z, a + PI / 2, kind === 'tort' ? 0x14b8a6 : kind === 'np' ? 0xdc2626 : 0x8b5cf6, kind === 'np' ? 0xfecaca : 0xc4b5fd, 11));
  at(-hx + 1.55, 1.0, (x, z) => { w.slab('m', wood, x, 0, z, ew ? 0.9 : 0.55, 0.38, ew ? 0.55 : 0.9, 0.04, undefined, 0, 2); books(w, x, 0.38, z, 2); });
  // front-left corner: bookshelf, front-right: pet bed / theme corner
  at(-hx + 0.9, hz - 0.3, (x, z) => shelfRack(w, x, z, a + PI, 1.3, 1.7, wood, (sx, y, sz, i, k) => { if (kind === 'tort' && i === 1) w.add('g', sph(8), pick([0x9ca3af, 0xd6d3d1, 0x78716c]), sx, y + 0.06, sz, 0, 0, 0, 0.08, 0.06, 0.08); else if (kind === 'np' && i === 2) gift(w, sx, y, sz, 0.18, BR[k & 7]); else books(w, sx, y, sz, 3); }));
  at(hx - 1.0, hz - 0.9, (x, z) => { if (kind === 'np') { const T = w.tf(x, 0, z, a + PI); fireplace(w, x, z, a + PI); stockings(w, T, 2, 1.2, 0.36); } else { petBed(w, x, z, ac); if (kind === 'pup') { bone(w, 'g', 0xfef3c7, x, 0.2, z, 0.4, 0.22); K.hh('dogBowl', w, x - 0.6 * c, z + 0.6 * sn, 0.12, ac); } else { for (let i = 0; i < 3; i++) w.add('m', sph(10), 0x4ade80, x - 0.3 + i * 0.3, 0.14, z, 0, 0, 0, 0.16, 0.1, 0.14); } } });
  at(hx - 0.35, hz - 0.35 - (kind === 'np' ? 0 : 0), (x, z) => { if (kind !== 'np') K.potPlant(w, x, 0, z, 0.9, ac); });
  if (kind === 'np') at(-hx + 3.0, -hz + 1.0, (x, z) => xmasTree(w, x, z, 0.75));
  if (kind === 'tort') at(-hx + 3.0, -hz + 0.35, (x, z) => { w.add('m', rbox(0.9, 0.3, 0.4, 0.04), 0x8b5e34, x, 0.15, z, 0, a, 0); for (let i = 0; i < 3; i++) w.add('m', sph(8), 0x4ade80, x - 0.25 + i * 0.25, 0.36, z, 0, 0, 0, 0.12, 0.1, 0.12); });
  // wall art on the back wall + a clock on the left wall
  at(-hx + 1.0, -hz + 0.12, (x, z) => { const T = w.tf(x, 1.95, z, a); T.box('m', 0x7c4a1e, 0, 0, 0, 1.1, 0.8, 0.05, 0.02); T.box('m', theme.art || 0xbae6fd, 0, 0.06, 0.03, 0.95, 0.66, 0.03, 0.01); T.add('g', kind === 'pup' ? sph(10) : kind === 'tort' ? sph(10) : star(), kind === 'np' ? 0xfacc15 : ac, 0, 0.4, 0.06, 0, 0, 0, 0.16, kind === 'tort' ? 0.1 : 0.16, 0.04); });
  at(-hx + 0.12, -0.8, (x, z) => { const T = w.tf(x, 2.3, z, a + PI / 2); T.add('g', rcyl(0.26, 0.06, 0.02, 24), 0xffffff, 0, 0, 0.03, PI / 2, 0, 0); T.box('g', 0x111827, 0, 0.0, 0.08, 0.02, 0.16, 0.01, 0.005); T.box('g', 0x111827, 0.05, 0.0, 0.08, 0.1, 0.02, 0.01, 0.005); });
  // resident + chore spot
  const spots = { kitchen: [hx - 2.0, -hz + 1.3], bed: [-hx + 2.3, -hz + 1.6], sofa: [-hx + 1.5, 2.2], shelf: [-hx + 1.0, hz - 1.2], petbed: [hx - 1.0, hz - 1.9], plant: [hx - 1.1, hz - 0.9] };
  const sp = P(...spots[C.chore[0]]); act({ room: id, x: sp[0], z: sp[1], r: 1.7, label: C.chore[1], chore: { id, msg: C.chore[2], fx: ac, helped: true } });
  const np = P(0.7, -0.5); npc(Object.assign({ id: 'res_' + id, room: id, at: np, yaw: a, name: C.who[0], lines: [[C.who[0], C.line]] }, C.who[1], C.who[1].breed ? { s: 0.72 } : C.who[1].pet === 'torty' ? {} : { s: 1.0 }));
}
export { fireplace, armchair, mug, shelfRack, lightString, books, counter, plush, wallSign };
