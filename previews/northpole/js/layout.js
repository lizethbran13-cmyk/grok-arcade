// Holiday layout: whole districts are rotated 180° through the town centre (a rotation, not a mirror, so signs stay readable).
export const LAYOUT = ['NS', 'NWSE'];
const GRP = { WC: 'WE', EC: 'WE', CN: 'NS', CS: 'NS', EN: 'NESW', WS: 'NESW', WN: 'NWSE', ES: 'NWSE' };
export function RF(x, z) { if (!(x <= 118 && x >= -118) || z > 160 || z < -160) return false; const c = x < -47 ? 'W' : x > 47 ? 'E' : 'C', r = z < -36 ? 'N' : z > 36 ? 'S' : 'C'; const g = GRP[c + r]; return !!g && LAYOUT.includes(g); }
export function RP(x, y, z) { return RF(x, z) ? [-x, y, -z] : [x, y, z]; }
const P3 = (a) => { if (a && RF(a[0], a[2])) { a[0] = -a[0]; a[2] = -a[2]; return true; } return false; };
const P2 = (a) => { if (a && RF(a[0], a[1])) { a[0] = -a[0]; a[1] = -a[1]; return true; } return false; };
const PO = (o) => { if (o && typeof o.x === 'number' && RF(o.x, o.z)) { o.x = -o.x; o.z = -o.z; if (o.yaw != null) o.yaw += Math.PI; return true; } return false; };
const RB = (r) => { if (RF((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2)) { const a = r.x0, b = r.z0; r.x0 = -r.x1; r.x1 = -a; r.z0 = -r.z1; r.z1 = -b; } };
export function relayout(w, T) {
  (w.inter || []).forEach(PO); (w.lights || []).forEach(PO); (w.secrets || []).forEach(PO);
  for (const k of ['gears', 'plots', 'plants']) (w[k] || []).forEach((a) => Array.isArray(a) ? P3(a) : PO(a));
  (w.zones || []).forEach((q) => { if (RF((q.min[0] + q.max[0]) / 2, (q.min[2] + q.max[2]) / 2)) { const a = q.min[0], b = q.min[2]; q.min[0] = -q.max[0]; q.max[0] = -a; q.min[2] = -q.max[2]; q.max[2] = -b; } });
  const S = w.spots || {}; for (const k in S) { const v = S[k]; if (k === 'stops' || k === 'dials' || k === 'sdoor' || !Array.isArray(v) || !v.length) continue;
    if (k === 'pond') P2(v); else if (k === 'mill') { if (P3(v)) S.millR = 1; } else if (typeof v[0] === 'number') { v.length === 2 ? P2(v) : P3(v); } else v.forEach((e) => Array.isArray(e) ? (e.length === 2 ? P2(e) : P3(e)) : PO(e)); }
  if (w.start && P3(w.start)) w.startYaw = (w.startYaw || 0) + Math.PI;
  T.REGIONS.forEach(RB); T.AREAS.forEach(RB); for (const k in T.DOORS) P2(T.DOORS[k]);
  T.STOPS.forEach((s) => { if (P2(s)) s[2] += Math.PI; });
  if (RF(T.TRACK.cx, T.TRACK.cz)) { T.TRACK.cx = -T.TRACK.cx; T.TRACK.cz = -T.TRACK.cz; T.TRACK.flip = Math.PI; }
}
export function relayNPC(d) { if (d._rl) return; d._rl = 1; if (d.at && RF(d.at[0], d.at[1])) { d.at[0] = -d.at[0]; d.at[1] = -d.at[1]; d.at[2] = (d.at[2] || 0) + Math.PI; } if (d.walk) d.walk.forEach(P2); if (d.run) P2(d.run); }
