// Holiday map: the town is rebuilt as a new map of district "islands" (moved + turned) joined by new roads through open land.
import * as THREE from 'three';
export const MAPR = 190;
export const EXTRA = []; // extra hand-made districts (no scattered trees inside)
const SRC = { NW: [-132, -132, -47, -36], NC: [-47, -132, 47, -36], NE: [47, -132, 132, -36], W: [-132, -36, -47, 36], P: [-47, -36, 47, 36], E: [47, -36, 132, 36], SW: [-132, 36, -47, 132], SCE: [-47, 36, 132, 132] };
const mk = (s, cx, cz, th, extra) => { const scx = (s[0] + s[2]) / 2, scz = (s[1] + s[3]) / 2, c = Math.round(Math.cos(th)), sn = Math.round(Math.sin(th));
  let hw = (s[2] - s[0]) / 2, hd = (s[3] - s[1]) / 2; if (sn !== 0) [hw, hd] = [hd, hw];
  const M = new THREE.Matrix4().makeTranslation(cx, 0, cz).multiply(new THREE.Matrix4().makeRotationY(th)).multiply(new THREE.Matrix4().makeTranslation(-scx, 0, -scz));
  return Object.assign({ s, scx, scz, cx, cz, th, k: Math.round(th / (Math.PI / 2)), c, sn, M, d: [cx - hw, cz - hd, cx + hw, cz + hd] }, extra); };
export const BLOCKS = [['P', 0, 0, 0, '🎄 Candy Cane Square'], ['W', -107, 0, 1, '🏡 Gingerbread Lane'], ['E', 107, 0, 3, '🛍️ Mistletoe Street'], ['NW', -125.5, 108, 0, '🏺 Elf Quarter'], ['SCE', 30, 108, 0, '🏁 Reindeer Racetrack'], ['SW', -125.5, -108, 2, '🎄 Christmas Tree Farm'], ['NC', -15, -108, 2, '♨️ The North Pole'], ['NE', 98.5, -108, 0, '🧸 Workshop Yard']].map(([id, cx, cz, k, name]) => mk(SRC[id], cx, cz, k * Math.PI / 2, { id, name }));
export const LOTS = ([{"id": "burrow", "s": [-73, -33, -45, -7], "cx": -89.5, "cz": -26.5, "th": -1.5707963267948966}, {"id": "school", "s": [-73, 7, -47, 29], "cx": -122.5, "cz": -22.5, "th": -1.5707963267948966}, {"id": "shelby", "s": [-97, -29, -75, -7], "cx": -91.5, "cz": 1.5, "th": -1.5707963267948966}, {"id": "market", "s": [47, -31, 77, -7], "cx": 123.5, "cz": -25.5, "th": -1.5707963267948966}, {"id": "fossil", "s": [69, 7, 95, 31], "cx": 90.5, "cz": -5.5, "th": -1.5707963267948966}, {"id": "shellshop", "s": [77, -27, 97, -7], "cx": 121.5, "cz": 2.5, "th": -1.5707963267948966}, {"id": "sweets", "s": [47, 7, 67, 27], "cx": 121.5, "cz": 25.5, "th": -4.71238898038469}, {"id": "pottery", "s": [97, -25, 115, -7], "cx": 93.5, "cz": -31.5, "th": 1.5707963267948966}, {"id": "music", "s": [-95, -77, -69, -55], "cx": -110.5, "cz": 75, "th": -4.71238898038469}, {"id": "bakery", "s": [-119, -77, -97, -57], "cx": -140.5, "cz": 73, "th": -1.5707963267948966}, {"id": "toys", "s": [-117, -119, -95, -99], "cx": -111.5, "cz": 107, "th": -1.5707963267948966}, {"id": "inn", "s": [25, 37, 49, 59], "cx": 70.5, "cz": 115.5, "th": 0}, {"id": "club", "s": [-33, 71, -9, 93], "cx": -46.5, "cz": 83.5, "th": -1.5707963267948966}, {"id": "cinema", "s": [45, 41, 69, 63], "cx": 8.5, "cz": 84.5, "th": -3.141592653589793}, {"id": "post", "s": [-49, 37, -27, 57], "cx": -21.5, "cz": 85.5, "th": -3.141592653589793}, {"id": "icecream", "s": [65, 41, 82, 59], "cx": -49, "cz": 113.5, "th": 0}, {"id": "barn", "s": [-107, 41, -83, 63], "cx": -150.5, "cz": -123, "th": 0}, {"id": "green", "s": [-83, 67, -63, 85], "cx": -147.5, "cz": -99, "th": -1.5707963267948966}, {"id": "hall", "s": [-15, -67, 15, -39], "cx": -45, "cz": -134.5, "th": 0}, {"id": "spa", "s": [-39, -117, -7, -91], "cx": -11, "cz": -133.5, "th": 0}, {"id": "library", "s": [-49, -61, -25, -39], "cx": -48, "cz": -100.5, "th": 3.141592653589793}, {"id": "cafe", "s": [25, -61, 49, -39], "cx": -6, "cz": -100.5, "th": 3.141592653589793}, {"id": "obs", "s": [11, -117, 33, -95], "cx": 19, "cz": -131.5, "th": 0}, {"id": "tortuga", "s": [57, -71, 99, -39], "cx": 77.5, "cz": -91, "th": 1.5707963267948966}]).map((L) => mk(L.s, L.cx, L.cz, L.th, { id: L.id, lot: 1 }));
export const STREETS = [[-110.5, -42.5, -103.5, 42.5], [103.5, -42.5, 110.5, 42.5], [-129.5, 60, -122.5, 156], [-59.5, 96.5, 119.5, 103.5], [-137.5, -156, -130.5, -60], [-62, -119.5, 32, -112.5], [94.5, -156, 101.5, -60]];
const ALLB = [...LOTS, ...BLOCKS];
export function lotAt(x, z, m = 0) { for (const b of LOTS) if (x >= b.d[0] - m && x <= b.d[2] + m && z >= b.d[1] - m && z <= b.d[3] + m) return b; return null; }
export function DROP(b, x, z) { if (!LOTS.length || (b && b.lot)) return false; const p = b ? FW(b, x, z) : [x, z]; return !!lotAt(p[0], p[1], 0.2); }
function NU(p, i = 0, j = 1) { const L = lotAt(p[i], p[j], 0.8); if (!L) return; const x = p[i], z = p[j], o = [[L.d[0] - 1.6 - x, 0], [L.d[2] + 1.6 - x, 0], [0, L.d[1] - 1.6 - z], [0, L.d[3] + 1.6 - z]].sort((a, b) => Math.abs(a[0]) + Math.abs(a[1]) - Math.abs(b[0]) - Math.abs(b[1]))[0]; p[i] = x + o[0]; p[j] = z + o[1]; }
export function SB(x, z) { for (const b of ALLB) if (x >= b.s[0] && x < b.s[2] && z >= b.s[1] && z < b.s[3]) return b; return null; }
export function FW(b, x, z) { const dx = x - b.scx, dz = z - b.scz; return [b.cx + dx * b.c + dz * b.sn, b.cz - dx * b.sn + dz * b.c]; }
export function DB(x, z) { for (const b of ALLB) if (x >= b.d[0] - 0.5 && x <= b.d[2] + 0.5 && z >= b.d[1] - 0.5 && z <= b.d[3] + 0.5) { const dx = x - b.cx, dz = z - b.cz; return [b.scx + dx * b.c - dz * b.sn, b.scz + dx * b.sn + dz * b.c]; } return null; }
export function inBlock(x, z, m = 0) { for (const b of BLOCKS) if (x >= b.d[0] - m && x <= b.d[2] + m && z >= b.d[1] - m && z <= b.d[3] + m) return b; return null; }
export function RP(x, y, z) { const b = SB(x, z); if (!b) return [x, y, z]; const p = FW(b, x, z); return [p[0], y, p[1]]; }
const P3 = (a) => { const b = a && SB(a[0], a[2]); if (!b) return 0; const p = FW(b, a[0], a[2]); a[0] = p[0]; a[2] = p[1]; if (!b.lot) NU(a, 0, 2); return b.th || 1e-9; };
const P2 = (a) => { const b = a && SB(a[0], a[1]); if (!b) return 0; const p = FW(b, a[0], a[1]); a[0] = p[0]; a[1] = p[1]; if (!b.lot) NU(a, 0, 1); return b.th || 1e-9; };
const PO = (o) => { if (!o || typeof o.x !== 'number') return; const b = SB(o.x, o.z); if (!b) return; const p = FW(b, o.x, o.z); if (!b.lot) NU(p); o.x = p[0]; o.z = p[1]; if (o.yaw != null) o.yaw += b.th; };
const BOX = (b, x0, z0, x1, z1) => { const a = FW(b, x0, z0), c = FW(b, x1, z1); return [Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[0], c[0]), Math.max(a[1], c[1])]; };
const RB = (r) => { const b = SB((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2); if (!b) return; const q = BOX(b, Math.max(r.x0, b.s[0]), Math.max(r.z0, b.s[1]), Math.min(r.x1, b.s[2]), Math.min(r.z1, b.s[3])); r.x0 = q[0]; r.z0 = q[1]; r.x1 = q[2]; r.z1 = q[3]; };
export function relayout(w, T) {
  if (typeof window !== 'undefined') { const inR = (x, z) => T.REGIONS.some((r) => !r.under && x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1); const S0 = w.spots || {}; const F = S0.field || [];
    window.__SRC = { regions: T.REGIONS.filter((r) => !r.under).map((r) => ({ id: r.id, x0: r.x0, z0: r.z0, x1: r.x1, z1: r.z1 })), doors: JSON.parse(JSON.stringify(T.DOORS)),
      keep: [...(w.inter || []).filter((o) => o.y > -10 && !inR(o.x, o.z)).map((o) => [o.x, o.z, 2.6]), ...(w.gears || []).filter((g) => g[1] > -10 && !inR(g[0], g[2])).map((g) => [g[0], g[2], 1.2]), ...(w.plots || []).map((p) => [p[0], p[2], 1.6]), ...T.STOPS.map((s2) => [s2[0], s2[1], 3.5]), ...(S0.dials || []).map((d) => [d[0], d[2], 3]), ...(S0.sdoor ? [[S0.sdoor[0], S0.sdoor[1], 5]] : []), ...(S0.mill ? [[S0.mill[0], S0.mill[2], 5]] : [])],
      rects: [[T.TRACK.cx - T.TRACK.rx - 4, T.TRACK.cz - T.TRACK.rz - 4, T.TRACK.cx + T.TRACK.rx + 4, T.TRACK.cz + T.TRACK.rz + 4], ...(F.length ? [[Math.min(...F.map((f) => f[0])) - 1, Math.min(...F.map((f) => f[2])) - 1, Math.max(...F.map((f) => f[0])) + 1, Math.max(...F.map((f) => f[2])) + 1]] : []), [-38, -38, 38, 38]] }; }
  (w.inter || []).forEach(PO); (w.lights || []).forEach(PO); (w.secrets || []).forEach(PO);
  for (const k of ['gears', 'plots', 'plants']) (w[k] || []).forEach((a) => Array.isArray(a) ? P3(a) : PO(a));
  (w.zones || []).forEach((q) => { if (q._nl) return; const b = SB((q.min[0] + q.max[0]) / 2, (q.min[2] + q.max[2]) / 2); if (!b) return; const r = BOX(b, q.min[0], q.min[2], q.max[0], q.max[2]); q.min[0] = r[0]; q.min[2] = r[1]; q.max[0] = r[2]; q.max[2] = r[3]; });
  const S = w.spots || {}; for (const k in S) { const v = S[k]; if (k === 'stops' || !Array.isArray(v) || !v.length) continue;
    if (k === 'pond' || k === 'sdoor') P2(v); else if (k === 'mill') { const t = P3(v); if (t) S.millR = t; } else if (typeof v[0] === 'number') { v.length === 2 ? P2(v) : P3(v); } else v.forEach((e) => Array.isArray(e) ? (e.length === 2 ? P2(e) : P3(e)) : PO(e)); }
  if (w.start) { const t = P3(w.start); if (t) w.startYaw = (w.startYaw || 0) + t; }
  T.REGIONS.forEach((r) => { if (!r.under) RB(r); }); for (const k in T.DOORS) P2(T.DOORS[k]);
  T.AREAS.forEach(RB); T.AREAS.push(...BLOCKS.map((b) => ({ x0: b.d[0] - 8, z0: b.d[1] - 8, x1: b.d[2] + 8, z1: b.d[3] + 8, name: b.name, blk: 1, m: { x0: b.d[0], z0: b.d[1], x1: b.d[2], z1: b.d[3] } })));
  T.STOPS.forEach((s) => { const t = P2(s); if (t) s[2] += t; });
  { const b = SB(T.TRACK.cx, T.TRACK.cz); if (b) { const p = FW(b, T.TRACK.cx, T.TRACK.cz); T.TRACK.cx = p[0]; T.TRACK.cz = p[1]; if (b.k === 2) T.TRACK.flip = Math.PI; } }
}
export function relayNPC(d) { if (d._rl) return; d._rl = 1; if (d.at) d._src = d.at.slice(); const b0 = d.at && SB(d.at[0], d.at[1]); if (d.walk) { d.walk = d.walk.filter((p) => SB(p[0], p[1]) === b0); if (d.walk.length < 2) d.walk = null; } if (d.run && SB(d.run[0], d.run[1]) !== b0) d.run = null; if (d.at) { const t = P2(d.at); if (t) d.at[2] = (d.at[2] || 0) + t; } if (d.walk) d.walk.forEach(P2); if (d.run) P2(d.run); }
export function setP(x, z, yaw) { const b = SB(x, z); if (!b) return [x, z, yaw]; const p = FW(b, x, z); return [p[0], p[1], yaw + b.th]; }
// new roads in the open land between districts + scenery + the outer edge
let ROADS = [];
export function streets(w, floor) { const keep = w._forceB; w._forceB = null; for (const r of STREETS) { floor(w, r[0], r[1], r[2], r[3], 'tile', 0.004, 0xe8cfa6, 0xd9b98a, 1.6); ROADS.push(r); } w._forceB = keep; }
export function newLand(w, K, TH, floor, mesa) { const keep = w._forceB; w._forceB = null; const roads = ROADS = [];
  const rows = {}; for (const b of BLOCKS) { const key = Math.round(b.cz / 50); (rows[key] = rows[key] || []).push(b); }
  const zs = Object.keys(rows).map(Number).sort((a, b) => a - b).map((k) => rows[k]);
  for (let i = 0; i < zs.length - 1; i++) { const zA = Math.max(...zs[i].map((b) => b.d[3])), zB = Math.min(...zs[i + 1].map((b) => b.d[1])), zc = (zA + zB) / 2; roads.push([-MAPR + 14, zc - 3, MAPR - 14, zc + 3]); }
  for (const row of zs) { row.sort((a, b) => a.cx - b.cx); for (let i = 0; i < row.length - 1; i++) { const xA = row[i].d[2], xB = row[i + 1].d[0], xc = (xA + xB) / 2; const z0 = Math.min(row[i].d[1], row[i + 1].d[1]) - 8, z1 = Math.max(row[i].d[3], row[i + 1].d[3]) + 8; roads.push([xc - 3, z0, xc + 3, z1]); } }
  for (const r of roads) floor(w, r[0], r[1], r[2], r[3], 'tile', 0.0, 0xe8cfa6, 0xd9b98a, 1.4);
  const onRoad = (x, z, m) => roads.some((r) => x > r[0] - m && x < r[2] + m && z > r[1] - m && z < r[3] + m);
  let n = 0; for (let x = -MAPR + 12; x <= MAPR - 12; x += 11) for (let z = -MAPR + 12; z <= MAPR - 12; z += 11) { const jx = x + Math.sin(x * 12.9 + z * 7.1) * 3.5, jz = z + Math.cos(x * 3.7 - z * 9.3) * 3.5; if (inBlock(jx, jz, 3) || EXTRA.some((r) => jx > r[0] && jx < r[2] && jz > r[1] && jz < r[3]) || onRoad(jx, jz, 3.5) || ((x * 31 + z * 17) & 3) === 0) continue; TH.tree(w, K, jx, jz, 0.8 + ((x * 7 + z * 3) & 3) * 0.12); n++; }
  for (let i = 0; i < 26; i++) { const t = -MAPR + 8 + i * 14.6; mesa(w, t, MAPR - 4, 15, 9 + (i % 4) * 2.5, 8); mesa(w, t, -MAPR + 4, 15, 8 + (i % 3) * 3, 8); mesa(w, MAPR - 4, t, 8, 9 + (i % 3) * 3, 14); mesa(w, -MAPR + 4, t, 8, 8 + (i % 4) * 2.5, 14); }
  const R = MAPR + 4; w.solid(-R, 0, -R, R, 30, -MAPR + 1); w.solid(-R, 0, MAPR - 1, R, 30, R); w.solid(-R, 0, -R, -MAPR + 1, 30, R); w.solid(MAPR - 1, 0, -R, R, 30, R);
  w._forceB = keep; return n; }

// paved paths: from every building door straight out to the nearest new road (stops before other buildings)
export function doorPaths(w, floor, REGIONS, DOORS) { const keep = w._forceB; w._forceB = null; let n = 0;
  const regs = REGIONS.filter((r) => !r.under);
  for (const id in DOORS) { const r = regs.find((q) => q.id === id); if (!r) continue; const [x, z] = DOORS[id]; const b = inBlock(x, z, 2); if (!b) continue;
    let nx = x - (r.x0 + r.x1) / 2, nz = z - (r.z0 + r.z1) / 2; if (Math.abs(nx) / (r.x1 - r.x0) > Math.abs(nz) / (r.z1 - r.z0)) { nx = Math.sign(nx); nz = 0; } else { nz = Math.sign(nz); nx = 0; }
    let L = 0; for (; L < 90; L += 1) { const px = x + nx * (L + 1), pz = z + nz * (L + 1); if (ROADS.some((q) => px > q[0] && px < q[2] && pz > q[1] && pz < q[3])) { L += 2; break; } if (regs.some((q) => q !== r && px > q.x0 - 1.5 && px < q.x1 + 1.5 && pz > q.z0 - 1.5 && pz < q.z1 + 1.5)) break; if (!inBlock(px, pz, 16)) break; }
    if (L < 3) continue; const hw = 1.4, ax = x + nx * 0.3, az = z + nz * 0.3, bx = x + nx * L, bz = z + nz * L;
    floor(w, Math.min(ax, bx) - (nz ? hw : 0), Math.min(az, bz) - (nx ? hw : 0), Math.max(ax, bx) + (nz ? hw : 0), Math.max(az, bz) + (nx ? hw : 0), 'tile', 0.006, 0xe8cfa6, 0xd9b98a, 1.0); n++; }
  w._forceB = keep; return n; }

// characters never start inside a wall / prop: nudge to the nearest free spot
export function freeSpot(w, x, z, y) { const out = []; const blocked = (px, pz) => { w.near(px - 0.5, pz - 0.5, px + 0.5, pz + 0.5, out); return out.some((s) => !s.floor && !s.roof && !s.off && s.min[1] < y + 1.4 && s.max[1] > y + 0.3 && px + 0.35 > s.min[0] && px - 0.35 < s.max[0] && pz + 0.35 > s.min[2] && pz - 0.35 < s.max[2]); };
  if (!blocked(x, z)) return [x, z]; for (let r = 0.7; r < 9; r += 0.7) for (let a = 0; a < 6.28; a += 0.45) { const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (!blocked(px, pz)) return [px, pz]; } return [x, z]; }
