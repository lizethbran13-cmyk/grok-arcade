// Holiday map: the town is rebuilt as a new map of district "islands" (moved + turned) joined by new roads through open land.
import * as THREE from 'three';
export const MAPR = 190;
const SRC = { NW: [-132, -132, -47, -36], NC: [-47, -132, 47, -36], NE: [47, -132, 132, -36], W: [-132, -36, -47, 36], P: [-47, -36, 47, 36], E: [47, -36, 132, 36], SW: [-132, 36, -47, 132], SCE: [-47, 36, 132, 132] };
export const BLOCKS = [['P', 0, 0, 2, '🎃 Pumpkin Square'], ['E', -107, 0, 1, '🛍️ Spooky Street'], ['W', 107, 0, 3, '🏡 Hollow Lane'], ['SCE', -30, -108, 0, '🏁 Broomstick Racetrack'], ['NE', 125, -108, 1, '🧪 Mad Science Yard'], ['NW', -120, 108, 2, '🏚️ Abandoned Village'], ['NC', -10, 108, 0, '🕯️ Haunted Hill'], ['SW', 110, 108, 1, '🎃 Pumpkin Patch']].map(([id, cx, cz, k, name]) => { const s = SRC[id], scx = (s[0] + s[2]) / 2, scz = (s[1] + s[3]) / 2, th = k * Math.PI / 2, c = Math.round(Math.cos(th)), sn = Math.round(Math.sin(th));
  let hw = (s[2] - s[0]) / 2, hd = (s[3] - s[1]) / 2; if (k % 2) [hw, hd] = [hd, hw];
  const M = new THREE.Matrix4().makeTranslation(cx, 0, cz).multiply(new THREE.Matrix4().makeRotationY(th)).multiply(new THREE.Matrix4().makeTranslation(-scx, 0, -scz));
  return { id, s, scx, scz, cx, cz, k, th, c, sn, M, name, d: [cx - hw, cz - hd, cx + hw, cz + hd] }; });
export function SB(x, z) { for (const b of BLOCKS) if (x >= b.s[0] && x < b.s[2] && z >= b.s[1] && z < b.s[3]) return b; return null; }
export function FW(b, x, z) { const dx = x - b.scx, dz = z - b.scz; return [b.cx + dx * b.c + dz * b.sn, b.cz - dx * b.sn + dz * b.c]; }
export function DB(x, z) { for (const b of BLOCKS) if (x >= b.d[0] - 0.5 && x <= b.d[2] + 0.5 && z >= b.d[1] - 0.5 && z <= b.d[3] + 0.5) { const dx = x - b.cx, dz = z - b.cz; return [b.scx + dx * b.c - dz * b.sn, b.scz + dx * b.sn + dz * b.c]; } return null; }
export function inBlock(x, z, m = 0) { for (const b of BLOCKS) if (x >= b.d[0] - m && x <= b.d[2] + m && z >= b.d[1] - m && z <= b.d[3] + m) return b; return null; }
export function RP(x, y, z) { const b = SB(x, z); if (!b) return [x, y, z]; const p = FW(b, x, z); return [p[0], y, p[1]]; }
const P3 = (a) => { const b = a && SB(a[0], a[2]); if (!b) return 0; const p = FW(b, a[0], a[2]); a[0] = p[0]; a[2] = p[1]; return b.th || 1e-9; };
const P2 = (a) => { const b = a && SB(a[0], a[1]); if (!b) return 0; const p = FW(b, a[0], a[1]); a[0] = p[0]; a[1] = p[1]; return b.th || 1e-9; };
const PO = (o) => { if (!o || typeof o.x !== 'number') return; const b = SB(o.x, o.z); if (!b) return; const p = FW(b, o.x, o.z); o.x = p[0]; o.z = p[1]; if (o.yaw != null) o.yaw += b.th; };
const BOX = (b, x0, z0, x1, z1) => { const a = FW(b, x0, z0), c = FW(b, x1, z1); return [Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[0], c[0]), Math.max(a[1], c[1])]; };
const RB = (r) => { const b = SB((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2); if (!b) return; const q = BOX(b, Math.max(r.x0, b.s[0]), Math.max(r.z0, b.s[1]), Math.min(r.x1, b.s[2]), Math.min(r.z1, b.s[3])); r.x0 = q[0]; r.z0 = q[1]; r.x1 = q[2]; r.z1 = q[3]; };
export function relayout(w, T) {
  (w.inter || []).forEach(PO); (w.lights || []).forEach(PO); (w.secrets || []).forEach(PO);
  for (const k of ['gears', 'plots', 'plants']) (w[k] || []).forEach((a) => Array.isArray(a) ? P3(a) : PO(a));
  (w.zones || []).forEach((q) => { if (q._nl) return; const b = SB((q.min[0] + q.max[0]) / 2, (q.min[2] + q.max[2]) / 2); if (!b) return; const r = BOX(b, q.min[0], q.min[2], q.max[0], q.max[2]); q.min[0] = r[0]; q.min[2] = r[1]; q.max[0] = r[2]; q.max[2] = r[3]; });
  const S = w.spots || {}; for (const k in S) { const v = S[k]; if (k === 'stops' || !Array.isArray(v) || !v.length) continue;
    if (k === 'pond' || k === 'sdoor') P2(v); else if (k === 'mill') { const t = P3(v); if (t) S.millR = t; } else if (typeof v[0] === 'number') { v.length === 2 ? P2(v) : P3(v); } else v.forEach((e) => Array.isArray(e) ? (e.length === 2 ? P2(e) : P3(e)) : PO(e)); }
  if (w.start) { const t = P3(w.start); if (t) w.startYaw = (w.startYaw || 0) + t; }
  T.REGIONS.forEach((r) => { if (!r.under) RB(r); }); for (const k in T.DOORS) P2(T.DOORS[k]);
  T.AREAS.forEach(RB); T.AREAS.push(...BLOCKS.map((b) => ({ x0: b.d[0], z0: b.d[1], x1: b.d[2], z1: b.d[3], name: b.name, blk: 1 })));
  T.STOPS.forEach((s) => { const t = P2(s); if (t) s[2] += t; });
  { const b = SB(T.TRACK.cx, T.TRACK.cz); if (b) { const p = FW(b, T.TRACK.cx, T.TRACK.cz); T.TRACK.cx = p[0]; T.TRACK.cz = p[1]; if (b.k === 2) T.TRACK.flip = Math.PI; } }
}
export function relayNPC(d) { if (d._rl) return; d._rl = 1; if (d.at) { const t = P2(d.at); if (t) d.at[2] = (d.at[2] || 0) + t; } if (d.walk) d.walk.forEach(P2); if (d.run) P2(d.run); }
export function setP(x, z, yaw) { const b = SB(x, z); if (!b) return [x, z, yaw]; const p = FW(b, x, z); return [p[0], p[1], yaw + b.th]; }
// new roads in the open land between districts + scenery + the outer edge
export function newLand(w, K, TH, floor, mesa) { const keep = w._forceB; w._forceB = null; const roads = [];
  const rows = {}; for (const b of BLOCKS) { const key = Math.round(b.cz / 50); (rows[key] = rows[key] || []).push(b); }
  const zs = Object.keys(rows).map(Number).sort((a, b) => a - b).map((k) => rows[k]);
  for (let i = 0; i < zs.length - 1; i++) { const zA = Math.max(...zs[i].map((b) => b.d[3])), zB = Math.min(...zs[i + 1].map((b) => b.d[1])), zc = (zA + zB) / 2; roads.push([-MAPR + 14, zc - 3, MAPR - 14, zc + 3]); }
  for (const row of zs) { row.sort((a, b) => a.cx - b.cx); for (let i = 0; i < row.length - 1; i++) { const xA = row[i].d[2], xB = row[i + 1].d[0], xc = (xA + xB) / 2; const z0 = Math.min(row[i].d[1], row[i + 1].d[1]) - 8, z1 = Math.max(row[i].d[3], row[i + 1].d[3]) + 8; roads.push([xc - 3, z0, xc + 3, z1]); } }
  for (const r of roads) floor(w, r[0], r[1], r[2], r[3], 'tile', 0.0, 0xe8cfa6, 0xd9b98a, 1.4);
  const onRoad = (x, z, m) => roads.some((r) => x > r[0] - m && x < r[2] + m && z > r[1] - m && z < r[3] + m);
  let n = 0; for (let x = -MAPR + 12; x <= MAPR - 12; x += 11) for (let z = -MAPR + 12; z <= MAPR - 12; z += 11) { const jx = x + Math.sin(x * 12.9 + z * 7.1) * 3.5, jz = z + Math.cos(x * 3.7 - z * 9.3) * 3.5; if (inBlock(jx, jz, 3) || onRoad(jx, jz, 3.5) || ((x * 31 + z * 17) & 3) === 0) continue; TH.tree(w, K, jx, jz, 0.8 + ((x * 7 + z * 3) & 3) * 0.12); n++; }
  for (let i = 0; i < 26; i++) { const t = -MAPR + 8 + i * 14.6; mesa(w, t, MAPR - 4, 15, 9 + (i % 4) * 2.5, 8); mesa(w, t, -MAPR + 4, 15, 8 + (i % 3) * 3, 8); mesa(w, MAPR - 4, t, 8, 9 + (i % 3) * 3, 14); mesa(w, -MAPR + 4, t, 8, 8 + (i % 4) * 2.5, 14); }
  const R = MAPR + 4; w.solid(-R, 0, -R, R, 30, -MAPR + 1); w.solid(-R, 0, MAPR - 1, R, 30, R); w.solid(-R, 0, -R, -MAPR + 1, 30, R); w.solid(MAPR - 1, 0, -R, R, 30, R);
  w._forceB = keep; return n; }
