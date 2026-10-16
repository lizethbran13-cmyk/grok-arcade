// Walk-in building shells: thick walls with door/window holes (each wall side is a camera-fade group so it hides while it
// blocks your view inside), a floor, and a roof on its own region (hidden while you're inside, so the rooms read like a dollhouse).
import * as K from './kit.js?v=rs5';
import { rbox } from './world.js?v=rs5';
export const BUILDINGS = [];
// b: { id, name, x0, z0, x1, z1, h, wall, trim, roof, floor:'wood'|'tile'|'carpet'|'marble', fc1, fc2, doors:[{side:'s'|'n'|'e'|'w', at, w}], win:{n,s,e,w}, flat }
export function shell(w, b) {
  const { x0, z0, x1, z1 } = b, h = b.h || 5, th = 0.5; BUILDINGS.push(b); b.fades = []; b.sideF = {};
  w.region = 'out';
  const holes = (side, from, to) => { const H = []; for (const d of b.doors || []) if (d.side === side) H.push(K.D(d.at - d.w / 2, d.at + d.w / 2, d.top || 3.2));
    const nw = (b.win && b.win[side] != null) ? b.win[side] : Math.floor((to - from) / 6); const L = to - from; if (nw > 0) for (let i = 0; i < nw; i++) { const c = from + (i + 0.5) * L / nw; if (H.some((q) => c + 1.3 > q[0] - 0.6 && c - 1.3 < q[1] + 0.6)) continue; H.push(K.G(c - 1.2, c + 1.2, Math.min(h - 0.9, 3.6), 1.1)); }
    return H; };
  const side = (s, axis, at, from, to) => { w.fadeBegin(); b.sideF[s] = w._fg; K.wall(w, axis, at, from, to, h, b.wall, holes(s, from, to), { bucket: 'm', trim: b.trim, base: b.base || b.trim, frame: b.frame || b.trim, th }); b.fades.push(w._fg); w.fadeEnd(); };
  side('s', 'x', z1, x0 - th / 2, x1 + th / 2); side('n', 'x', z0, x0 - th / 2, x1 + th / 2); side('w', 'z', x0, z0 + th / 2, z1 - th / 2); side('e', 'z', x1, z0 + th / 2, z1 - th / 2);
  // cornice + plinth bands on the outside (out region: always visible from the street)
  w.region = 'roof_' + b.id;
  w.add('m', rbox(x1 - x0 + 1.2, 0.5, z1 - z0 + 1.2, 0.12), b.trim, (x0 + x1) / 2, h + 0.25, (z0 + z1) / 2);
  w.add('m', rbox(x1 - x0 + 0.2, 0.3, z1 - z0 + 0.2, 0.06), b.roof, (x0 + x1) / 2, h + 0.62, (z0 + z1) / 2);
  if (!b.flat) { [[x0, z0, x1, z0], [x0, z1, x1, z1]].forEach(([a, z]) => w.add('m', rbox(x1 - x0 + 1.2, 0.7, 0.4, 0.1), b.trim, (x0 + x1) / 2, h + 0.85, z)); [x0, x1].forEach((x) => w.add('m', rbox(0.4, 0.7, z1 - z0 + 1.2, 0.1), b.trim, x, h + 0.85, (z0 + z1) / 2)); }
  // rooftop gear so the skyline isn't flat
  const ac = (x, z) => { w.add('x', rbox(1.6, 0.9, 1.2, 0.12), 0xcbd5e1, x, h + 1.2, z); w.add('x', K.cyl(18), 0x94a3b8, x, h + 1.65, z, 0, 0, 0, 0.45, 0.06, 0.45); };
  if ((x1 - x0) > 10) { ac(x0 + 3, z0 + 3); ac(x1 - 4, z0 + 2.5); }
  w.region = 'in_' + b.id; K.floor(w, x0 + th / 2, z0 + th / 2, x1 - th / 2, z1 - th / 2, b.floor || 'wood', 0.06, b.fc1, b.fc2);
  // doorstep outside each door
  w.region = 'out'; for (const d of b.doors || []) { const o = 1.0; if (d.side === 's') w.slab('g', 0xd6d3d1, d.at, 0, z1 + o, d.w + 1.6, 0.06, 1.6, 0.04, { floor: true }); else if (d.side === 'n') w.slab('g', 0xd6d3d1, d.at, 0, z0 - o, d.w + 1.6, 0.06, 1.6, 0.04, { floor: true }); else if (d.side === 'e') w.slab('g', 0xd6d3d1, x1 + o, 0, d.at, 1.6, 0.06, d.w + 1.6, 0.04, { floor: true }); else w.slab('g', 0xd6d3d1, x0 - o, 0, d.at, 1.6, 0.06, d.w + 1.6, 0.04, { floor: true }); }
  return b;
}
// interior partition with doorways (fade group too), shorter than the outer walls
export function part(w, b, axis, at, from, to, doors = [], col, h = 3.4) { w.region = 'in_' + b.id; w.fadeBegin(); K.wall(w, axis, at, from, to, h, col || 0xfff7ed, doors.map((d) => K.D(d - 1.1, d + 1.1, 2.7)), { bucket: 'm', trim: b.itrim || 0xffffff, th: 0.3 }); b.fades.push(w._fg); w.fadeEnd(); }
export function inside(b, x, z, m = 0) { return x > b.x0 - m && x < b.x1 + m && z > b.z0 - m && z < b.z1 + m; }
export function buildingAt(x, z) { for (const b of BUILDINGS) if (inside(b, x, z)) return b; return null; }
// add facade decorations (signs, canopies, awnings) to a wall side's fade group so they hide together with that wall
export function onSide(w, b, s, fn) { const k = w._fg; w._fg = b.sideF[s]; try { fn(); } finally { w._fg = k; } }
