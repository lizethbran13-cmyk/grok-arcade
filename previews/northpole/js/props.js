// Household prop library. Every prop is real smooth geometry (no image textures), batched into the room,
// and registers simple box colliders so rats can climb it. Units: 1 = ~13 cm (a rat is ~0.6 tall).
import { rbox } from './world.js?v=np5';
import { rcyl, lathe, sph, cyl, cone, torus, capsule, tube, leaf, blade, blobGeo } from './shapes.js?v=np5';
const PI = Math.PI;
let seed = 1; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export function propSeed(s) { seed = s | 0 || 1; }
export const pick = (a) => a[(R() * a.length) | 0];
export const rnd = R;
const _sc = { r: 0, g: 0, b: 0 }; function shade(c, k) { const r = Math.min(255, ((c >> 16) & 255) * k) | 0, g = Math.min(255, ((c >> 8) & 255) * k) | 0, b = Math.min(255, (c & 255) * k) | 0; return (r << 16) | (g << 8) | b; }
function THREE_Color() { return _sc; }
const BOOK = [0xe94f64, 0x3b82f6, 0x22c55e, 0xf59e0b, 0x8b5cf6, 0x14b8a6, 0xf97316, 0xec4899, 0x0ea5e9, 0x84cc16, 0xb45309, 0x6366f1];
const BRIGHT = [0xff5d73, 0x4f9dff, 0x3ddc84, 0xffc93c, 0xa66bff, 0x2dd4bf, 0xff8a3d, 0xff6fcf];

export const PR = {
  // ---------- structure ----------
  floorPlanks(w, x0, z0, x1, z1, y = 0, cols = [0xc98d55, 0xbd8048, 0xd39a62, 0xb7773f]) {
    const pw = 2.2; let i = 0; const C = new THREE_Color();
    w.add('m', rbox(x1 - x0, 0.3, z1 - z0, 0.05, 1), shade(cols[0], 0.45), (x0 + x1) / 2, y - 0.5, (z0 + z1) / 2); // dark seams between boards
    for (let x = x0; x < x1 - 0.01; x += pw, i++) { const ww = Math.min(pw, x1 - x); let z = z0 + ((i * 7.3) % 9) - 9;
      while (z < z1) { const len = 9 + ((i * 13 + z) % 5); const za = Math.max(z, z0), zb = Math.min(z + len, z1);
        if (zb - za > 0.2) { const base = shade(pick(cols), 0.88 + R() * 0.24), cx = x + ww / 2, cz = (za + zb) / 2, L = zb - za;
          w.add('m', rbox(ww - 0.12, 0.4, L - 0.12, 0.08, 2), base, cx, y - 0.2, cz);
          // wood grain: long thin darker streaks + the odd knot, nail heads at the board ends
          const ng = 2 + ((R() * 2) | 0); for (let k = 0; k < ng; k++) { const gl = L * (0.35 + R() * 0.5), gz = za + 0.4 + R() * Math.max(0.1, L - gl - 0.8) + gl / 2;
            w.add('m', rbox(0.07 + R() * 0.07, 0.03, gl, 0.012, 1), shade(base, 0.78 + R() * 0.1), x + 0.3 + R() * (ww - 0.6), y + 0.005, gz); }
          if (R() < 0.35) w.add('m', sph(10), shade(base, 0.62), x + 0.4 + R() * (ww - 0.8), y + 0.0, za + 1 + R() * Math.max(0.1, L - 2), 0, R() * 3, 0, 0.32, 0.03, 0.22);
          if (L > 3) [za + 0.45, zb - 0.45].forEach((nz) => [-0.5, 0.5].forEach((o) => w.add('x', sph(6), 0x8d8f94, cx + o * (ww - 0.7), y + 0.005, nz, 0, 0, 0, 0.08, 0.02, 0.08)));
        } z += len; } }
    w.solid(x0, y - 2, z0, x1, y, z1, { floor: true });
  },
  floorTiles(w, x0, z0, x1, z1, y = 0, a = 0xf3efe6, b = 0x3e4a6b, ts = 3) {
    w.add('m', rbox(x1 - x0, 0.3, z1 - z0, 0.05, 1), 0x9aa0a8, (x0 + x1) / 2, y - 0.2, (z0 + z1) / 2);
    for (let x = x0, i = 0; x < x1 - 0.01; x += ts, i++) for (let z = z0, j = 0; z < z1 - 0.01; z += ts, j++) { const ww = Math.min(ts, x1 - x), dd = Math.min(ts, z1 - z); w.add('g', rbox(ww - 0.12, 0.2, dd - 0.12, 0.06, 1), (i + j) % 2 ? a : b, x + ww / 2, y - 0.1, z + dd / 2); }
    w.solid(x0, y - 2, z0, x1, y, z1, { floor: true });
  },
  floorConcrete(w, x0, z0, x1, z1, y = 0) {
    w.add('m', rbox(x1 - x0, 0.3, z1 - z0, 0.05, 1), 0x5b616b, (x0 + x1) / 2, y - 0.5, (z0 + z1) / 2); // joint lines
    for (let x = x0, i = 0; x < x1 - 0.01; x += 8, i++) for (let z = z0, j = 0; z < z1 - 0.01; z += 8, j++) { const ww = Math.min(8, x1 - x), dd = Math.min(8, z1 - z); const c = shade([0x9ca3af, 0xa3a9b3, 0x959ca7][(i + j * 2) % 3], 0.94 + R() * 0.1);
      w.add('m', rbox(ww - 0.18, 0.4, dd - 0.18, 0.06, 1), c, x + ww / 2, y - 0.2, z + dd / 2);
      // speckles + the odd hairline crack on each slab
      for (let k = 0; k < 7; k++) w.add('m', sph(6), shade(c, R() < 0.5 ? 0.8 : 1.12), x + 0.5 + R() * (ww - 1), y + 0.0, z + 0.5 + R() * (dd - 1), 0, 0, 0, 0.12 + R() * 0.15, 0.02, 0.12 + R() * 0.15);
      if (R() < 0.45) { let cx = x + 1 + R() * (ww - 2), cz = z + 1 + R() * (dd - 2), a = R() * 6; for (let k = 0; k < 4; k++) { const l = 0.8 + R() * 1.2; a += (R() - 0.5) * 1.4; const nx = cx + Math.cos(a) * l, nz = cz + Math.sin(a) * l; w.add('m', rbox(0.06, 0.03, l, 0.01, 1), shade(c, 0.6), (cx + nx) / 2, y + 0.005, (cz + nz) / 2, 0, -a + PI / 2, 0); cx = nx; cz = nz; } } }
    w.solid(x0, y - 2, z0, x1, y, z1, { floor: true });
  },
  // decorative oil stain: dark glossy irregular puddle (flat, walk-over)
  oilStain(w, x, z, s = 2) { for (let k = 0; k < 5; k++) w.add('g', sph(14), k ? 0x1f2430 : 0x111827, x + (k ? (R() - 0.5) * s * 1.2 : 0), 0.0, z + (k ? (R() - 0.5) * s * 1.2 : 0), 0, R() * 6, 0, s * (k ? 0.35 + R() * 0.3 : 0.8), 0.025, s * (k ? 0.3 + R() * 0.3 : 0.6)); },
  // rat-scale floor clutter, skipping anything with a collider; kind 'home' | 'garage' | 'lab'
  scatter(w, x0, z0, x1, z1, n, kind = 'home') { const S = w.solids.filter((q) => !q.floor && q.max[1] > 0.05);
    const free = (x, z) => !S.some((q) => x > q.min[0] - 0.7 && x < q.max[0] + 0.7 && z > q.min[2] - 0.7 && z < q.max[2] + 0.7 && q.min[1] < 1);
    const K = { home: ['button', 'coin', 'pencil', 'crayon', 'marble', 'brick', 'cap', 'clip', 'dust', 'paper', 'sock', 'button', 'marble'], garage: ['nut', 'bolt', 'washer', 'screw', 'battery', 'rag', 'sawdust', 'drip', 'nut', 'washer', 'zip'], lab: ['gear', 'nut', 'washer', 'spring', 'chip', 'screw', 'button', 'battery', 'gear'] }[kind];
    let placed = 0, tries = 0; while (placed < n && tries++ < n * 8) { const x = x0 + R() * (x1 - x0), z = z0 + R() * (z1 - z0); if (!free(x, z)) continue; placed++; const a = R() * PI * 2, t = pick(K), T = w.tf(x, 0, z, a);
      if (t === 'button') { const c = pick(BRIGHT); T.add('g', rcyl(0.45, 0.14, 0.05, 20), c, 0, 0, 0); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([u, v]) => T.add('m', cyl(8), shade(c, 0.55), u * 0.1, 0.1, v * 0.1, 0, 0, 0, 0.05, 0.06, 0.05)); }
      else if (t === 'coin') { T.add('x', rcyl(0.55, 0.1, 0.04, 28), R() < 0.5 ? 0xd4a017 : 0xc0c6cf, 0, 0, 0); T.add('x', torus(0.04, 20), 0xffe58a, 0, 0.1, 0, PI / 2, 0, 0, 0.42); }
      else if (t === 'pencil') { const c = pick([0xffc93c, 0x3b82f6, 0xef4444]); T.add('g', cyl(6), c, 0, 0.14, 0, PI / 2, 0, 0, 0.14, 1.8, 0.14); T.add('m', cone(12), 0xf2c38b, 0, 0.14, 1.8, PI / 2, 0, 0, 0.14, 0.4, 0.14); T.add('m', cone(8), 0x333333, 0, 0.14, 2.12, PI / 2, 0, 0, 0.05, 0.12, 0.05); T.add('g', cyl(10), 0xff8fb1, 0, 0.14, -0.2, PI / 2, 0, 0, 0.15, 0.2, 0.15); }
      else if (t === 'crayon') { const c = pick(BRIGHT); T.add('g', cyl(10), c, 0, 0.18, 0, PI / 2, 0, 0, 0.18, 1.1, 0.18); T.add('g', cone(10), c, 0, 0.18, 1.1, PI / 2, 0, 0, 0.18, 0.35, 0.18); T.add('m', cyl(10), 0xffffff, 0, 0.18, 0.1, PI / 2, 0, 0, 0.19, 0.5, 0.19); }
      else if (t === 'marble') { w.add('e', sph(16), pick([0x60a5fa, 0x34d399, 0xf472b6, 0xfbbf24]), x, 0.32, z, 0, 0, 0, 0.32); w.add('l', sph(8), pick(BRIGHT), x, 0.32, z, 0, a, 0, 0.12, 0.2, 0.06, 0.2); }
      else if (t === 'brick') { const c = pick(BRIGHT); T.box('g', c, 0, 0, 0, 1.2, 0.45, 0.6, 0.05); [-0.3, 0.3].forEach((u) => T.add('g', rcyl(0.17, 0.12, 0.03, 14), c, u, 0.45, 0)); }
      else if (t === 'cap') { T.add('x', rcyl(0.5, 0.22, 0.04, 21), pick([0xef4444, 0x22c55e, 0x3b82f6, 0xffd23f]), 0, 0, 0); }
      else if (t === 'clip') { T.add('x', torus(0.035, 14, PI), 0xc0c6cf, 0, 0.04, 0.3, PI / 2, 0, 0, 0.25); T.add('x', torus(0.035, 14, PI), 0xc0c6cf, 0, 0.04, -0.3, -PI / 2, 0, 0, 0.2); [-0.25, 0.25].forEach((u) => T.add('x', cyl(6), 0xc0c6cf, u, 0.04, -0.3, PI / 2, 0, 0, 0.035, 0.6, 0.035)); }
      else if (t === 'dust') { for (let k = 0; k < 5; k++) T.add('f', sph(10), 0xd6d3d1, (R() - 0.5) * 0.6, 0.2, (R() - 0.5) * 0.6, 0, 0, 0, 0.3, 0.22, 0.3); }
      else if (t === 'paper') { w.add('m', blobGeo((x * 9 + z * 5) | 0, 0.35, 1), 0xf8fafc, x, 0.35, z, 0, a, 0, 0.4); }
      else if (t === 'sock') { const c = pick([0xf472b6, 0x60a5fa, 0xfbbf24]); T.add('f', capsule(12), c, 0, 0.18, 0, PI / 2, 0, 0, 0.35, 1.2, 0.2); T.add('f', capsule(12), c, 0.5, 0.18, 0.9, PI / 2, 0, 0, 0.32, 0.6, 0.2); T.add('f', cyl(12), 0xffffff, 0, 0.2, -0.9, PI / 2, 0, 0, 0.36, 0.25, 0.22); }
      else if (t === 'nut' || t === 'washer') { T.add('x', t === 'nut' ? cyl(6) : torus(0.35, 20), 0x9ca3af, 0, t === 'nut' ? 0 : 0.05, 0, t === 'nut' ? 0 : PI / 2, 0, 0, t === 'nut' ? 0.4 : 0.35, t === 'nut' ? 0.24 : 0.35, t === 'nut' ? 0.4 : 0.35); if (t === 'nut') T.add('m', cyl(12), 0x374151, 0, 0.25, 0, 0, 0, 0, 0.18, 0.02, 0.18); }
      else if (t === 'bolt' || t === 'screw') { T.add('x', cyl(8), 0xb0b6bf, 0, 0.12, 0, PI / 2, 0, 0, 0.1, 1.1, 0.1); T.add('x', t === 'bolt' ? cyl(6) : sph(12), 0xb0b6bf, 0, 0.14, -0.14, PI / 2, 0, 0, 0.24, t === 'bolt' ? 0.14 : 0.12, 0.24); }
      else if (t === 'battery') { T.add('g', cyl(16), 0x111827, 0, 0.3, 0, PI / 2, 0, 0, 0.3, 1.0, 0.3); T.add('g', cyl(16), 0xf59e0b, 0, 0.3, 0.6, PI / 2, 0, 0, 0.31, 0.4, 0.31); T.add('x', cyl(10), 0xd1d5db, 0, 0.3, 1.0, PI / 2, 0, 0, 0.1, 0.1, 0.1); }
      else if (t === 'rag') { w.add('f', blobGeo((x * 3 + z * 11) | 0, 0.3, 2), pick([0xef4444, 0x3b82f6]), x, 0.12, z, 0, a, 0, 1.4, 0.15, 1.0); }
      else if (t === 'sawdust') { for (let k = 0; k < 6; k++) w.add('m', sph(6), 0xe2b97a, x + (R() - 0.5) * 1.6, 0.0, z + (R() - 0.5) * 1.6, 0, 0, 0, 0.3 + R() * 0.3, 0.05, 0.3 + R() * 0.3); }
      else if (t === 'drip') { this.oilStain(w, x, z, 0.8 + R()); }
      else if (t === 'zip') { T.add('g', torus(0.03, 16, PI * 1.6), 0xf8fafc, 0, 0.05, 0, PI / 2, 0, 0, 0.6); }
      else if (t === 'gear') { T.add('x', cyl(12), pick([0xffd23f, 0x3ff0ff, 0xc0c6cf]), 0, 0, 0, 0, 0, 0, 0.5, 0.16, 0.5); for (let k = 0; k < 8; k++) T.box('x', 0xc0c6cf, Math.cos(k * PI / 4) * 0.55, 0, Math.sin(k * PI / 4) * 0.55, 0.18, 0.16, 0.18, 0.03); }
      else if (t === 'spring') { for (let k = 0; k < 5; k++) T.add('x', torus(0.05, 16), 0xc0c6cf, 0, 0.3, -0.5 + k * 0.25, 0, 0, 0, 0.28); }
      else if (t === 'chip') { T.box('g', 0x166534, 0, 0, 0, 1.4, 0.08, 1.0, 0.02); T.box('g', 0x111827, 0.2, 0.08, 0, 0.5, 0.1, 0.5, 0.03); for (let k = 0; k < 4; k++) T.box('x', 0xffd23f, -0.5, 0.08, -0.3 + k * 0.2, 0.25, 0.02, 0.06, 0.01); }
    } return placed; },
  // wall along x (at z) or z (at x), with baseboard; holes: [[from,to,top]] openings (windows/doors)
  wall(w, axis, at, from, to, h, col, o = {}) {
    const th = 1.2, side = o.side || 1; const segs = []; let cur = from; const holes = (o.holes || []).slice().sort((a, b) => a[0] - b[0]);
    for (const hl of holes) { if (hl[0] > cur) segs.push([cur, hl[0], 0, h]); segs.push([hl[0], hl[1], hl[3] || 0, hl[2], true]); cur = hl[1]; } if (cur < to) segs.push([cur, to, 0, h]);
    const put = (a, b, y0, y1) => { if (b - a < 0.01 || y1 - y0 < 0.01) return; const c = (a + b) / 2, L = b - a; if (axis === 'x') w.slab('w', col, c, y0, at, L, y1 - y0, th, 0.05, { wall: true }); else w.slab('w', col, at, y0, c, th, y1 - y0, L, 0.05, { wall: true }); };
    for (const sg of segs) { if (sg[4]) { put(sg[0], sg[1], sg[3], h); if (sg[2] > 0) put(sg[0], sg[1], 0, sg[2]); } else put(sg[0], sg[1], 0, h); }
    // baseboard + crown trim (trim pieces skip door holes)
    const bb = o.base || 0xfdf8f0; const off = side * (th / 2 + 0.12);
    for (const sg of segs) { if (sg[4] && !(sg[2] > 0)) continue; const c = (sg[0] + sg[1]) / 2, L = sg[1] - sg[0]; if (axis === 'x') w.add('g', rbox(L, 0.9, 0.24, 0.08), bb, c, 0.45, at + off); else w.add('g', rbox(0.24, 0.9, L, 0.08), bb, at + off, 0.45, c); }
    { const c = (from + to) / 2, L = to - from; if (axis === 'x') w.add('g', rbox(L, 0.6, 0.3, 0.1), bb, c, h - 0.3, at + off); else w.add('g', rbox(0.3, 0.6, L, 0.1), bb, at + off, h - 0.3, c); }
  },
  // window frame inside a wall hole + glass + sill + curtains
  window(w, axis, at, c, wid, y0, y1, side = 1, curtain = 0xff8fb1) {
    const T = axis === 'x' ? w.tf(c, 0, at, 0) : w.tf(at, 0, c, PI / 2); const fc = 0xffffff;
    T.box('g', fc, 0, y0 - 0.3, side * 0.7, wid + 0.8, 0.5, 3.0, 0.12); T.box('g', fc, 0, y1, 0, wid + 0.8, 0.5, 1.4, 0.12);
    [-1, 1].forEach((s) => T.box('g', fc, s * wid / 2, y0, 0, 0.45, y1 - y0, 1.4, 0.1)); T.box('g', fc, 0, y0, 0, 0.25, y1 - y0, 0.4, 0.06); T.box('g', fc, 0, (y0 + y1) / 2, 0, wid, 0.25, 0.4, 0.06);
    T.add('e', rbox(wid, y1 - y0, 0.08, 0.02), 0xcfefff, 0, (y0 + y1) / 2, 0);
    T.solid(-wid / 2 - 0.4, y0 - 0.3, Math.min(-side * 0.8, side * 2.2), wid / 2 + 0.4, y0 + 0.2, Math.max(-side * 0.8, side * 2.2)); // sill
    T.solid(-wid / 2, y0, -0.3, wid / 2, y1, 0.3, { glass: true });
    if (curtain) [-1, 1].forEach((s) => { for (let k = 0; k < 4; k++) T.add('f', capsule(10), curtain, s * (wid / 2 + 0.6 + k * 0.45), (y0 + y1) / 2 - 0.6, side * (0.9 + (k % 2) * 0.12), 0, 0, 0, 0.55, (y1 - y0) + 0.6, 0.35); T.add('x', cyl(12), 0xd4a373, 0, y1 + 0.9, side * 0.9, 0, 0, PI / 2, 0.12, wid + 6, 0.12); });
  },
  door(w, axis, at, c, wid, h, col = 0xf3e2c7, side = 1) {
    const T = axis === 'x' ? w.tf(c, 0, at, 0) : w.tf(at, 0, c, PI / 2);
    T.box('g', 0xffffff, -wid / 2 - 0.3, 0, 0, 0.6, h + 0.6, 1.5, 0.1); T.box('g', 0xffffff, wid / 2 + 0.3, 0, 0, 0.6, h + 0.6, 1.5, 0.1); T.box('g', 0xffffff, 0, h, 0, wid + 1.2, 0.6, 1.5, 0.1);
    T.box('g', col, 0, 0.05, -side * 0.2, wid, h - 0.1, 0.5, 0.1); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) T.box('g', col, (i - 0.5) * wid * 0.45, 1 + j * h * 0.45, -side * 0.5, wid * 0.36, h * 0.38, 0.12, 0.08);
    T.add('x', sph(14), 0xffd166, wid * 0.38, h * 0.47, -side * 0.65, 0, 0, 0, 0.35);
    T.solid(-wid / 2, 0, -0.5, wid / 2, h, 0.5);
  },
  mouseHole(w, axis, at, c, side = 1, glow = 0) {
    const T = axis === 'x' ? w.tf(c, 0, at, side > 0 ? 0 : Math.PI) : w.tf(at, 0, c, side > 0 ? Math.PI / 2 : -Math.PI / 2); const f = 0.62;
    T.add('m', cyl(28), 0x120a18, 0, 0, f, Math.PI / 2, 0, 0, 1.15, 0.06, 1.25);
    T.add('m', sph(24), 0x120a18, 0, 1.0, f, 0, 0, 0, 1.15, 1.15, 0.03);
    T.add('g', torus(0.16, 28, Math.PI), 0x8b5a2b, 0, 1.0, f + 0.05, 0, 0, 0, 1.25, 1.25, 1.25); [-1, 1].forEach((s) => T.box('g', 0x8b5a2b, s * 1.25, 0, f + 0.05, 0.4, 1.0, 0.4, 0.12));
    if (glow) T.add('l', sph(10), 0xffd27a, 0, 0.8, f - 0.02, 0, 0, 0, 0.6, 0.6, 0.05, 0.5);
  },
  // ---------- furniture ----------
  table(w, x, z, ry, L, D, H, top = 0xc58b52, leg = 0xa86f3c) {
    const T = w.tf(x, 0, z, ry); T.slab('g', top, 0, H - 0.6, 0, L, 0.6, D, 0.2); T.box('m', leg, 0, H - 1.3, 0, L - 1.2, 0.7, D - 1.2, 0.1);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { T.add('g', rcyl(0.45, H - 0.6, 0.1, 20), leg, a * (L / 2 - 0.9), 0, b * (D / 2 - 0.9)); T.solid(a * (L / 2 - 0.9) - 0.45, 0, b * (D / 2 - 0.9) - 0.45, a * (L / 2 - 0.9) + 0.45, H - 0.6, b * (D / 2 - 0.9) + 0.45, { cam: false }); });
    return H;
  },
  chair(w, x, z, ry, H = 3.4, col = 0xd99a5e, cush = 0xff7a90) {
    const T = w.tf(x, 0, z, ry); const S = 3.6;
    T.slab('g', col, 0, H - 0.35, 0, S, 0.35, S, 0.15); T.box('f', cush, 0, H, 0.1, S - 0.5, 0.35, S - 0.6, 0.18); T.solid(-S / 2, H, -S / 2, S / 2, H + 0.3, S / 2);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { T.add('g', rcyl(0.22, H - 0.35, 0.06, 16), col, a * (S / 2 - 0.35), 0, b * (S / 2 - 0.35)); T.solid(a * (S / 2 - 0.35) - 0.25, 0, b * (S / 2 - 0.35) - 0.25, a * (S / 2 - 0.35) + 0.25, H - 0.35, b * (S / 2 - 0.35) + 0.25, { cam: false }); });
    [-1, 1].forEach((a) => T.add('g', rcyl(0.2, 4.2, 0.06, 14), col, a * (S / 2 - 0.35), H, -S / 2 + 0.3));
    for (let i = 0; i < 3; i++) T.box('g', col, 0, H + 1.2 + i * 1.2, -S / 2 + 0.3, S - 0.4, 0.35, 0.3, 0.1); T.solid(-S / 2, H, -S / 2, S / 2, H + 4.2, -S / 2 + 0.55, { cam: false });
  },
  stool(w, x, z, ry, H = 2.2, col = 0x60a5fa) {
    const T = w.tf(x, 0, z, ry); T.slab('g', col, 0, H - 0.3, 0, 3.2, 0.3, 2.4, 0.12); [-1, 1].forEach((a) => T.slab('g', col, a * 1.3, 0, 0, 0.3, H - 0.3, 2.2, 0.1, { cam: false })); T.box('g', 0xffffff, 0, H, 0, 2.2, 0.06, 1.2, 0.03);
  },
  cabinets(w, x0, x1, z, ry, H, D, body = 0xf7f2e8, top = 0x4b5563, o = {}) {
    // run of base cabinets with countertop; ry=0 faces +z
    const L = x1 - x0, T = w.tf((x0 + x1) / 2, 0, z, ry);
    T.slab('m', body, 0, 0, 0, L, H - 0.5, D, 0.12, { cab: true }); T.box('m', 0x2f3542, 0, 0, D / 2 - 0.4, L - 0.2, 0.6, 0.3, 0.05);
    T.slab('g', top, 0, H - 0.5, 0.2, L + 0.4, 0.5, D + 0.5, 0.15);
    const n = Math.max(1, Math.round(L / 4)); for (let i = 0; i < n; i++) { const cx = -L / 2 + (i + 0.5) * L / n; T.box('g', o.door || 0xeef3f8, cx, 0.9, D / 2 + 0.05, L / n - 0.35, H - 2.6, 0.2, 0.12); T.box('g', o.door || 0xeef3f8, cx, H - 1.45, D / 2 + 0.05, L / n - 0.35, 0.75, 0.2, 0.1); T.add('x', capsule(10), 0xd1d5db, cx, H - 1.07, D / 2 + 0.3, 0, 0, PI / 2, 0.16, 1.0, 0.16); T.add('x', capsule(10), 0xd1d5db, cx + L / n * 0.3, H / 2 - 0.5, D / 2 + 0.3, 0, 0, 0, 0.16, 0.8, 0.16); }
    return H;
  },
  upperCabinets(w, x0, x1, z, ry, y0, H, D, col = 0xeef3f8) {
    const L = x1 - x0, T = w.tf((x0 + x1) / 2, 0, z, ry); T.slab('m', col, 0, y0, 0, L, H, D, 0.12);
    const n = Math.max(1, Math.round(L / 4)); for (let i = 0; i < n; i++) { const cx = -L / 2 + (i + 0.5) * L / n; T.box('g', 0xffffff, cx, y0 + 0.25, D / 2 + 0.05, L / n - 0.3, H - 0.5, 0.2, 0.12); T.add('x', capsule(10), 0xd1d5db, cx + L / n * 0.35, y0 + 0.9, D / 2 + 0.28, 0, 0, 0, 0.15, 0.9, 0.15); }
  },
  fridge(w, x, z, ry, H = 13, col = 0xe8f1ff) {
    const T = w.tf(x, 0, z, ry); T.slab('g', col, 0, 0, 0, 6, H, 5.4, 0.5); T.box('g', col, 0, 0.3, 2.75, 5.8, H * 0.6, 0.3, 0.2); T.box('g', col, 0, H * 0.62 + 0.2, 2.75, 5.8, H * 0.36, 0.3, 0.2);
    T.add('x', capsule(12), 0xc0c7d2, -2.3, H * 0.35, 3.15, 0, 0, 0, 0.3, 3.5, 0.3); T.add('x', capsule(12), 0xc0c7d2, -2.3, H * 0.78, 3.15, 0, 0, 0, 0.3, 1.8, 0.3);
    // magnets + kid drawing in 3D (raised shapes)
    BRIGHT.slice(0, 5).forEach((c, i) => T.add('g', sph(12), c, -1 + i * 0.7, H * 0.5 + (i % 2) * 0.8, 2.95, 0, 0, 0, 0.25, 0.25, 0.12));
    T.box('m', 0xffffff, 0.8, H * 0.3, 2.92, 2.6, 2.2, 0.05, 0.02); T.add('g', sph(12), 0xffd23f, 0.1, H * 0.3 + 1.7, 3.0, 0, 0, 0, 0.35, 0.35, 0.06); T.box('g', 0x4ade80, 0.8, H * 0.3 + 0.1, 2.97, 2.5, 0.25, 0.04, 0.02); T.box('g', 0xef4444, 1.2, H * 0.3 + 0.35, 2.97, 0.9, 0.8, 0.04, 0.02); T.add('g', cone(4), 0x7c3aed, 1.2, H * 0.3 + 1.15, 2.97, 0, PI / 4, 0, 0.7, 0.5, 0.05);
  },
  stove(w, x, z, ry, H, hot = []) {
    // returns burner centres (world) so the level can mark them hot
    const T = w.tf(x, 0, z, ry); T.slab('g', 0xf1f5f9, 0, 0, 0, 7.5, H - 0.4, 6, 0.2); T.slab('g', 0x1f2937, 0, H - 0.4, 0, 7.5, 0.4, 6, 0.15);
    T.box('e', 0x0b1220, 0, 1.6, 3.02, 5.4, 2.6, 0.1, 0.1); T.add('x', capsule(10), 0xcbd5e1, 0, 4.7, 3.3, 0, 0, PI / 2, 0.18, 5, 0.18);
    for (let i = 0; i < 4; i++) T.add('g', sph(12), 0x111827, -2.6 + i * 1.7, H - 0.9, 3.15, PI / 2, 0, 0, 0.35, 0.3, 0.35);
    T.box('g', 0xf1f5f9, 0, H, -2.6, 7.5, 1.6, 0.8, 0.2); T.solid(-3.75, H, -3, 3.75, H + 1.6, -2.2);
    const out = []; [[-1.8, -1], [1.8, -1], [-1.8, 1.4], [1.8, 1.4]].forEach(([bx, bz], i) => { const on = hot.includes(i);
      T.add(on ? 'l' : 'x', torus(0.18, 28), on ? 0xff4d2e : 0x374151, bx, H + 0.06, bz, PI / 2, 0, 0, 1.1, 1.1, 1, on ? 0.9 : 0); T.add(on ? 'l' : 'x', torus(0.2, 24), on ? 0xff6a2e : 0x374151, bx, H + 0.06, bz, PI / 2, 0, 0, 0.6, 0.6, 1, on ? 0.9 : 0);
      for (let k = 0; k < 4; k++) T.box('x', 0x4b5563, bx + Math.cos(k * PI / 2) * 0.95, H, bz + Math.sin(k * PI / 2) * 0.95, k % 2 ? 0.3 : 1.2, 0.3, k % 2 ? 1.2 : 0.3, 0.08);
      out.push({ p: T.P(bx, H, bz), on }); });
    return out;
  },
  sink(w, x, z, ry, H) { // basin cut into counter; returns water zone bounds
    const T = w.tf(x, 0, z, ry); T.box('x', 0xcbd5e1, 0, H - 2.2, 0, 6.4, 0.3, 4.4, 0.4);
    [[-3.3, 0, 0.4, 4.6], [3.3, 0, 0.4, 4.6], [0, -2.3, 7, 0.4], [0, 2.3, 7, 0.4]].forEach(([a, b, ww, dd]) => T.slab('x', 0xdbe3ec, a, H - 2.2, b, ww, 2.25, dd, 0.15));
    T.add('e', rbox(6.2, 1.2, 4.2, 0.2), 0x7dd3fc, 0, H - 1.5, 0);
    T.add('x', rcyl(0.35, 1.4, 0.1, 16), 0xe5e7eb, 0, H, -2.9); T.add('x', tube([[0, H + 1.3, -2.9], [0, H + 2.6, -2.6], [0, H + 2.5, -1.4], [0, H + 1.9, -1.1]], 0.22, 24, 12), 0xe5e7eb, 0, 0, 0);
    [-1, 1].forEach((s) => T.add('g', sph(12), s < 0 ? 0x60a5fa : 0xf87171, s * 1.1, H + 0.5, -2.9, 0, 0, 0, 0.4, 0.3, 0.4));
    return T;
  },
  couch(w, x, z, ry, L = 22, col = 0x6c7bd9, cush = 0x8b9bff) {
    const T = w.tf(x, 0, z, ry), D = 8;
    T.slab('f', col, 0, 0.8, 0, L, 1.8, D, 0.5); [-1, 1].forEach((s) => T.add('g', rcyl(0.4, 0.8, 0.1, 14), 0x5b3a20, s * (L / 2 - 1), 0, D / 2 - 1)); [-1, 1].forEach((s) => T.add('g', rcyl(0.4, 0.8, 0.1, 14), 0x5b3a20, s * (L / 2 - 1), 0, -D / 2 + 1));
    T.slab('f', col, 0, 2.6, -D / 2 + 1, L, 6, 2, 0.9); [-1, 1].forEach((s) => T.slab('f', col, s * (L / 2 - 1), 2.6, 0.3, 2.2, 2.6, D - 0.4, 0.9));
    const n = Math.round((L - 4.4) / 6), cw = (L - 4.4) / n, cushions = [];
    for (let i = 0; i < n; i++) { const cx = -L / 2 + 2.2 + (i + 0.5) * cw; T.box('f', cush, cx, 2.6, 0.6, cw - 0.2, 1.2, D - 2.8, 0.55); cushions.push(T.solid(cx - cw / 2, 2.6, -D / 2 + 2, cx + cw / 2, 3.8, D / 2, { bounce: 13 })); T.box('f', cush, cx, 3.6, -D / 2 + 2.3, cw - 0.4, 4, 1.4, 0.65); }
    T.add('f', sph(16), 0xffd23f, -L / 2 + 4, 4.9, -D / 2 + 3.2, -0.3, 0.4, 0, 1.6, 1.6, 0.6); T.add('f', sph(16), 0xff6fae, L / 2 - 4, 4.9, -D / 2 + 3.2, -0.3, -0.3, 0, 1.6, 1.6, 0.6);
    return cushions;
  },
  rug(w, x, z, ry, L, D, a = 0xf59e0b, b = 0xfef3c7) { const T = w.tf(x, 0, z, ry);
    T.box('f', a, 0, 0, 0, L, 0.22, D, 0.1, 0, 3); T.box('f', b, 0, 0.03, 0, L - 1.6, 0.24, D - 1.6, 0.1, 0, 3); T.box('f', a, 0, 0.06, 0, L - 4.4, 0.24, D - 4.4, 0.1, 0, 3);
    // tufted pile: rows of soft bumps, plus stitched border dots and tassels on the short ends
    const nx = Math.max(2, Math.round((L - 5) / 1.6)), nz = Math.max(2, Math.round((D - 5) / 1.6));
    for (let u = 0; u < nx; u++) for (let v = 0; v < nz; v++) if ((u + v) % 2 === 0) T.add('f', sph(10), shade(b, 0.92), -(L - 6) / 2 + u * (L - 6) / Math.max(1, nx - 1), 0.3, -(D - 6) / 2 + v * (D - 6) / Math.max(1, nz - 1), 0, 0, 0, 0.42, 0.07, 0.42);
    for (let u = 0; u < Math.floor(L / 0.9); u++) [-1, 1].forEach((sd) => T.add('f', sph(6), shade(a, 0.7), -L / 2 + 0.45 + u * 0.9, 0.25, sd * (D / 2 - 0.4), 0, 0, 0, 0.14, 0.04, 0.14));
    for (let v = 0; v < Math.floor(D / 0.5); v++) [-1, 1].forEach((sd) => T.add('f', cyl(6), b, sd * (L / 2 + 0.25), 0.05, -D / 2 + 0.25 + v * 0.5, 0, 0, PI / 2, 0.07, 0.5, 0.07));
    for (let i = 0; i < 6; i++) T.add('f', sph(10), [0xef4444, 0x3b82f6, 0x10b981][i % 3], -L / 2 + 4 + i * (L - 8) / 5, 0.3, 0, 0, 0, 0, 0.8, 0.08, 0.8); },
  bookshelf(w, x, z, ry, W, H, D = 3.2, col = 0x9a6a3e, shelves = 5) {
    const T = w.tf(x, 0, z, ry); const sh = []; T.slab('m', col, 0, 0, -D / 2 + 0.2, W, H, 0.4, 0.05); [-1, 1].forEach((s) => T.slab('g', col, s * (W / 2 - 0.25), 0, 0, 0.5, H, D, 0.1));
    for (let i = 0; i <= shelves; i++) { const y = i * (H - 0.5) / shelves; T.slab('g', col, 0, y, 0, W - 0.6, 0.45, D, 0.08); sh.push(y + 0.45);
      if (i < shelves) { let bx = -W / 2 + 0.8; const top = (H - 0.5) / shelves - 0.6; while (bx < W / 2 - 1.2) { const bw = 0.35 + R() * 0.35, bh = top * (0.55 + R() * 0.4); if (R() < 0.12) { bx += 0.8; continue; } if (R() < 0.1 && bx < W / 2 - 3) { // lying stack
            for (let k = 0; k < 3; k++) T.box('m', pick(BOOK), bx + 1, y + 0.45 + k * 0.4, 0.2, 2, 0.38, D - 0.9, 0.06); bx += 2.3; continue; }
          T.box('m', pick(BOOK), bx + bw / 2, y + 0.45, 0.2, bw, bh, D - 0.8 - R() * 0.4, 0.05); T.box('m', 0xfff3d6, bx + bw / 2, y + 0.55, 0.15, bw * 0.8, bh * 0.92, D - 0.95, 0.02); bx += bw + 0.03; } } }
    return sh;
  },
  tvStand(w, x, z, ry) { const T = w.tf(x, 0, z, ry); T.slab('g', 0x3f3f46, 0, 0, 0, 14, 3.4, 4, 0.2); [-1, 1].forEach((s) => T.box('m', 0x27272a, s * 3.4, 0.5, 2, 6.2, 2.4, 0.1, 0.06));
    T.slab('g', 0x111111, 0, 3.4, -0.6, 3, 0.3, 1.6, 0.1); T.box('g', 0x111111, 0, 3.7, -0.6, 0.6, 1.2, 0.4, 0.1); T.box('g', 0x18181b, 0, 4.6, -0.6, 13, 7.4, 0.5, 0.2); T.box('l', 0x3fb8ff, 0, 4.9, -0.32, 12.2, 6.8, 0.05, 0.05, 0.5);
    T.add('l', sph(16), 0xffe14d, 2, 8.6, -0.25, 0, 0, 0, 1, 1, 0.1, 0.6); T.box('l', 0x4ade80, 0, 5.5, -0.27, 12, 1.4, 0.05, 0.02, 0.2); T.solid(-6.5, 3.4, -0.9, 6.5, 12, -0.3);
    T.slab('g', 0xffffff, 4.5, 3.4, 0.8, 2.6, 0.6, 2, 0.15); T.add('l', sph(8), 0x60a5fa, 4.5, 4.05, 1.8, 0, 0, 0, 0.12, 0.12, 0.05, 1);
  },
  lamp(w, x, z, ry, H = 16, shade = 0xffe4b5) { const T = w.tf(x, 0, z, ry); T.add('x', rcyl(1.4, 0.3, 0.1, 24), 0x6b7280, 0, 0, 0); T.add('x', cyl(12), 0x9ca3af, 0, 0.3, 0, 0, 0, 0, 0.15, H - 3, 0.15); T.solid(-1.4, 0, -1.4, 1.4, 0.3, 1.4);
    T.add('f', lathe([[2.4, 0], [1.4, 3], [1.38, 3], [2.38, 0]], 32), shade, 0, H - 3, 0); T.add('l', sph(12), 0xfff1c1, 0, H - 2.2, 0, 0, 0, 0, 0.7, 0.9, 0.7, 1.2); w.lights.push({ x: T.P(0, 0, 0)[0], y: H - 2, z: T.P(0, 0, 0)[2], c: 0xffd59a }); },
  plant(w, x, y, z, s = 1, pot = 0xe76f51, leafC = 0x3fae5a) { const T = w.tf(x, y, z, R() * 6, s); T.add('g', lathe([[0, 0], [0.9, 0], [1.2, 1.6], [1.35, 1.7], [1.3, 1.85], [0, 1.85]], 24, 'pot'), pot); T.add('m', cyl(16), 0x5b3a1f, 0, 1.7, 0, 0, 0, 0, 1.15, 0.05, 1.15); T.solid(-1.2, 0, -1.2, 1.2, 1.85, 1.2);
    for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2 + R(); T.add('g', leaf(), i % 2 ? leafC : 0x2f9e4a, Math.cos(a) * 0.2, 1.7, Math.sin(a) * 0.2, -0.5 - R() * 0.6, a + PI / 2, 0, 1.1 + R() * 0.5, 2.1 + R() * 0.8, 1); } },
  bigPlant(w, x, z, s = 1) { const T = w.tf(x, 0, z, R() * 6, s); T.add('g', lathe([[0, 0], [2.2, 0], [2.8, 4], [3.0, 4.2], [0, 4.2]], 28, 'bpot'), 0xf4f1ea); T.solid(-2.8, 0, -2.8, 2.8, 4.2, 2.8); T.add('m', cyl(18), 0x5b3a1f, 0, 4.05, 0, 0, 0, 0, 2.7, 0.05, 2.7);
    for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2; const st = 4 + R() * 6; T.add('g', tube([[0, 4, 0], [Math.cos(a) * 1.5, 4 + st * 0.6, Math.sin(a) * 1.5], [Math.cos(a) * 3, 4 + st, Math.sin(a) * 3]], 0.08, 10, 5), 0x2f7d32); T.add('g', leaf(), i % 2 ? 0x3fae5a : 0x2a9d48, Math.cos(a) * 3, 4 + st, Math.sin(a) * 3, -1.0, a + PI / 2, 0, 2.2, 3.2, 1.6); } },
  // ---------- kitchen bits ----------
  mug(w, x, y, z, ry = 0, col = pick(BRIGHT), solid = true) { const T = w.tf(x, y, z, ry); T.add('g', lathe([[0, 0], [0.42, 0], [0.45, 0.06], [0.45, 0.82], [0.4, 0.82], [0.4, 0.1], [0, 0.1]], 28, 'mug'), col); T.add('g', torus(0.28, 20, PI * 1.2), col, 0.5, 0.42, 0, 0, 0, -PI * 0.6, 0.25, 0.25, 0.25); T.add('m', cyl(20), 0x6b3e1e, 0, 0.62, 0, 0, 0, 0, 0.4, 0.03, 0.4); if (solid) T.solid(-0.45, 0, -0.45, 0.45, 0.82, 0.45); },
  plate(w, x, y, z, n = 1, col = 0xffffff) { for (let i = 0; i < n; i++) w.add('g', lathe([[0, 0], [0.6, 0], [1.25, 0.12], [1.3, 0.2], [1.2, 0.2], [0.6, 0.08], [0, 0.08]], 32, 'plate'), i % 2 ? col : 0xdbeafe, x, y + i * 0.17, z); w.solid(x - 1.2, y, z - 1.2, x + 1.2, y + n * 0.17 + 0.05, z + 1.2); },
  bowl(w, x, y, z, col = 0x60a5fa, fill = 0) { w.add('g', lathe([[0, 0], [0.5, 0], [1.1, 0.4], [1.4, 1.0], [1.3, 1.02], [1.0, 0.5], [0, 0.12]], 32, 'bowl'), col, x, y, z); if (fill) { for (let i = 0; i < 9; i++) w.add('g', sph(14), pick([0xef4444, 0xf59e0b, 0xfacc15, 0x84cc16]), x + Math.cos(i * 2.4) * 0.6 * (i % 3) / 2, y + 0.75 + (i % 3) * 0.12, z + Math.sin(i * 2.4) * 0.6 * (i % 3) / 2, 0, 0, 0, 0.38); } w.solid(x - 1.3, y, z - 1.3, x + 1.3, y + 1.0, z + 1.3); },
  dogBowl(w, x, z, col = 0xef4444, food = 0x9a5b2d) { w.add('g', lathe([[0, 0], [1.6, 0], [1.3, 0.8], [1.15, 0.85], [1.0, 0.25], [0, 0.25]], 32, 'dbowl'), col, x, 0, z); for (let i = 0; i < 14; i++) w.add('m', sph(8), food, x + Math.cos(i * 2.2) * (i % 4) * 0.25, 0.5 + (i % 3) * 0.08, z + Math.sin(i * 2.2) * (i % 4) * 0.25, R(), R(), 0, 0.22, 0.15, 0.22); w.solid(x - 1.4, 0, z - 1.4, x + 1.4, 0.75, z + 1.4); },
  can(w, x, y, z, col = pick(BRIGHT), h = 1.4, r = 0.55) { w.add('x', rcyl(r, h, 0.06, 24), 0xd1d5db, x, y, z); w.add('g', rcyl(r + 0.01, h * 0.62, 0.02, 24), col, x, y + h * 0.18, z); w.add('g', rcyl(r + 0.02, h * 0.16, 0.02, 24), 0xffffff, x, y + h * 0.4, z); w.solid(x - r, y, z - r, x + r, y + h, z + r); },
  jar(w, x, y, z, fill = 0xf59e0b, lid = 0xef4444, h = 1.6) { w.add('e', rcyl(0.7, h, 0.25, 24), 0xe0f2fe, x, y, z); w.add('g', rcyl(0.6, h * 0.7, 0.2, 20), fill, x, y + 0.05, z); w.add('g', rcyl(0.72, 0.3, 0.08, 24), lid, x, y + h, z); w.solid(x - 0.7, y, z - 0.7, x + 0.7, y + h + 0.3, z + 0.7); },
  bottle(w, x, y, z, col = 0x22c55e, h = 2.4) { w.add('g', lathe([[0, 0], [0.5, 0], [0.55, 0.1], [0.55, h * 0.6], [0.25, h * 0.8], [0.2, h], [0, h]], 24, 'btl' + h), col, x, y, z); w.add('g', rcyl(0.24, 0.2, 0.05, 14), 0xffffff, x, y + h, z); w.add('g', rcyl(0.56, h * 0.25, 0.02, 24), 0xfff7ed, x, y + h * 0.2, z); w.solid(x - 0.5, y, z - 0.5, x + 0.5, y + h, z + 0.5); },
  cereal(w, x, y, z, ry = 0, col = pick(BRIGHT), h = 3.2) { const T = w.tf(x, y, z, ry); T.slab('m', col, 0, 0, 0, 2.2, h, 1.3, 0.06); T.box('m', 0xffffff, 0, h * 0.62, 0.63, 1.6, 0.9, 0.08, 0.04); T.add('g', sph(12), 0xffd23f, -0.3, h * 0.35, 0.69, 0, 0, 0, 0.32, 0.32, 0.1); T.add('g', sph(12), 0xff7a3d, 0.35, h * 0.3, 0.69, 0, 0, 0, 0.28, 0.28, 0.1); T.add('g', torus(0.35, 16), 0xf59e0b, 0.1, h * 0.18, 0.67, 0, 0, 0, 0.2, 0.2, 0.15); },
  toaster(w, x, y, z, ry = 0, col = 0xf43f5e) { const T = w.tf(x, y, z, ry); T.slab('g', col, 0, 0, 0, 2.6, 1.6, 1.6, 0.5); [-0.45, 0.45].forEach((s) => T.box('m', 0x1f2937, s, 1.5, 0, 0.3, 0.12, 1.1, 0.05)); T.box('m', 0xd4a373, -0.45, 1.6, 0, 0.22, 0.45, 0.9, 0.08); T.add('x', capsule(8), 0xcbd5e1, 1.35, 0.9, 0, 0, 0, PI / 2, 0.14, 0.3, 0.14); },
  kettle(w, x, y, z, col = 0x14b8a6) { w.add('g', lathe([[0, 0], [0.9, 0], [1.05, 0.5], [0.95, 1.3], [0.5, 1.6], [0, 1.65]], 28, 'ket'), col, x, y, z); w.add('g', torus(0.22, 20, PI), 0x111827, x, y + 1.6, z, 0, 0, 0, 0.6, 0.6, 0.6); w.add('g', cone(12), col, x + 1.1, y + 0.8, z, 0, 0, -1.0, 0.18, 0.8, 0.18); w.solid(x - 0.95, y, z - 0.95, x + 0.95, y + 1.65, z + 0.95); },
  pot(w, x, y, z, col = 0xef4444) { w.add('g', lathe([[0, 0], [1.4, 0], [1.5, 0.1], [1.5, 1.4], [1.62, 1.5], [1.5, 1.55], [1.42, 1.48], [1.42, 0.12], [0, 0.12]], 32, 'pot2'), col, x, y, z); [-1, 1].forEach((s) => w.add('x', torus(0.3, 14, PI), 0x9ca3af, x + s * 1.6, y + 1.2, z, 0, PI / 2, PI / 2 * s, 0.25)); w.solid(x - 1.5, y, z - 1.5, x + 1.5, y + 1.5, z + 1.5); },
  cuttingBoard(w, x, y, z, ry = 0, L = 5, D = 3) { const T = w.tf(x, y, z, ry); T.slab('m', 0xdeb887, 0, 0, 0, L, 0.3, D, 0.12); T.add('m', torus(0.3, 16), 0xb88a5a, L / 2 - 0.5, 0.3, 0, PI / 2, 0, 0, 0.25, 0.25, 0.25); },
  fruit(w, x, y, z, kind) { if (kind === 'apple') { w.add('g', sph(18), 0xe11d48, x, y + 0.5, z, 0, 0, 0, 0.55, 0.5, 0.55); w.add('m', cyl(6), 0x6b3e1e, x, y + 0.9, z, 0.2, 0, 0, 0.04, 0.3, 0.04); w.add('g', leaf(), 0x22c55e, x + 0.05, y + 1.05, z, 0, 0, -1.1, 0.18, 0.3, 0.18); w.solid(x - 0.5, y, z - 0.5, x + 0.5, y + 1, z + 0.5); }
    else if (kind === 'orange') { w.add('g', sph(18), 0xfb923c, x, y + 0.55, z, 0, 0, 0, 0.58); w.solid(x - 0.5, y, z - 0.5, x + 0.5, y + 1.1, z + 0.5); }
    else if (kind === 'banana') { w.add('g', tube([[x - 1, y + 0.5, z], [x - 0.3, y + 0.2, z + 0.1], [x + 0.5, y + 0.25, z], [x + 1, y + 0.6, z - 0.1]], 0.22, 20, 10), 0xfacc15, 0, 0, 0); w.solid(x - 1, y, z - 0.3, x + 1, y + 0.45, z + 0.3); }
    else { w.add('g', sph(14), 0xfde047, x, y + 0.4, z, 0, 0, 0, 0.5, 0.4, 0.4); }
  },
  breadLoaf(w, x, y, z, ry = 0) { const T = w.tf(x, y, z, ry); T.slab('m', 0xd08c4a, 0, 0, 0, 3.2, 1.2, 1.8, 0.6); T.add('m', capsule(16), 0xb86e30, 0, 1.0, 0, 0, 0, PI / 2, 1.8, 2.2, 1.2); for (let i = 0; i < 3; i++) T.box('m', 0xf7d9a8, -0.8 + i * 0.8, 1.55, 0, 0.12, 0.08, 1.2, 0.03); },
  spoonBridge(w, x0, y0, z0, x1, y1, z1, col = 0xc8925c) { // wooden spoon/ruler laid as a ramp you can walk on
    const L = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(x1 - x0, z1 - z0), pitch = Math.atan2(y1 - y0, L); const T = w.tf((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, ang);
    T.add('m', rbox(1.4, 0.3, Math.hypot(L, y1 - y0) + 0.4, 0.14), col, 0, 0, 0, -pitch, 0, 0); T.add('m', sph(16), col, 0, (y1 - y0) / 2 + 0.1, L / 2 + 0.6, -pitch, 0, 0, 1.0, 0.25, 1.3);
    const axis = Math.abs(x1 - x0) > Math.abs(z1 - z0) ? 'x' : 'z'; const dir = axis === 'x' ? Math.sign(x1 - x0) * Math.sign(y1 - y0 || 1) : Math.sign(z1 - z0) * Math.sign(y1 - y0 || 1);
    if (Math.abs(y1 - y0) < 0.05) w.solid(Math.min(x0, x1) - 0.7, y0 - 0.3, Math.min(z0, z1) - 0.7, Math.max(x0, x1) + 0.7, y0 + 0.15, Math.max(z0, z1) + 0.7);
    else w.solid(Math.min(x0, x1) - (axis === 'z' ? 0.7 : 0), Math.min(y0, y1), Math.min(z0, z1) - (axis === 'x' ? 0.7 : 0), Math.max(x0, x1) + (axis === 'z' ? 0.7 : 0), Math.max(y0, y1) + 0.15, Math.max(z0, z1) + (axis === 'x' ? 0.7 : 0), { ramp: [axis, dir] });
  },
  dishRack(w, x, y, z, ry = 0) { const T = w.tf(x, y, z, ry); T.slab('x', 0xe5e7eb, 0, 0, 0, 5, 0.3, 3.4, 0.1); for (let i = 0; i < 6; i++) T.add('x', cyl(8), 0xd1d5db, -2.2 + i * 0.88, 0.3, -1.5, 0, 0, 0, 0.06, 2.2, 0.06);
    for (let i = 0; i < 4; i++) T.add('g', lathe([[0, 0], [0.6, 0], [1.25, 0.12], [1.3, 0.2], [1.2, 0.2], [0.6, 0.08], [0, 0.08]], 32, 'plate'), [0xffffff, 0xfde68a, 0xbfdbfe, 0xfbcfe8][i], -1.8 + i * 0.9, 1.4, -0.4, 0, 0, PI / 2 - 0.15);
    T.solid(-2.5, 0, -1.7, 2.5, 0.3, 1.7); },
  sponge(w, x, y, z, ry = 0) { const T = w.tf(x, y, z, ry); T.box('f', 0xfde047, 0, 0, 0, 2.2, 0.8, 1.4, 0.25); T.box('f', 0x22c55e, 0, 0.8, 0, 2.2, 0.3, 1.4, 0.12); return T.solid(-1.1, 0, -0.7, 1.1, 1.1, 0.7, { bounce: 12, squish: true }); },
  soap(w, x, y, z, col = 0xc084fc) { w.add('g', rcyl(0.7, 2.2, 0.3, 24), col, x, y, z); w.add('g', rcyl(0.25, 0.4, 0.08, 14), 0xffffff, x, y + 2.2, z); w.add('g', cyl(10), 0xffffff, x + 0.3, y + 2.5, z, 0, 0, PI / 2, 0.1, 0.6, 0.1); w.solid(x - 0.7, y, z - 0.7, x + 0.7, y + 2.2, z + 0.7); },
  towelRoll(w, x, y, z) { w.add('f', rcyl(0.9, 2.8, 0.1, 24), 0xffffff, x, y + 0.2, z); w.add('m', rcyl(0.3, 3.0, 0.05, 14), 0xb08968, x, y + 0.1, z); w.add('x', rcyl(1.0, 0.2, 0.05, 24), 0x9ca3af, x, y, z); w.solid(x - 0.9, y, z - 0.9, x + 0.9, y + 3.1, z + 0.9); },
  microwave(w, x, y, z, ry = 0) { const T = w.tf(x, y, z, ry); T.slab('g', 0x334155, 0, 0, 0, 5, 3, 3.4, 0.3); T.box('e', 0x0f172a, -0.6, 0.4, 1.72, 3.2, 2.2, 0.05, 0.1); T.box('g', 0x475569, 1.8, 0.4, 1.72, 1, 2.2, 0.08, 0.08); T.box('l', 0x22d3ee, 1.8, 2.0, 1.78, 0.7, 0.3, 0.03, 0.03, 0.8); for (let i = 0; i < 3; i++) T.add('g', sph(8), 0x94a3b8, 1.8, 1.2 - i * 0.35, 1.8, 0, 0, 0, 0.12, 0.12, 0.05); },
  spiceRack(w, x, y, z, ry = 0) { const T = w.tf(x, y, z, ry); for (let k = 0; k < 2; k++) { T.slab('m', 0xb07a45, 0, k * 1.6, 0, 5, 0.25, 1.2, 0.08); for (let i = 0; i < 5; i++) { T.add('e', rcyl(0.35, 1.0, 0.1, 16), 0xe0f2fe, -2 + i, k * 1.6 + 0.25, 0); T.add('m', rcyl(0.3, 0.8, 0.08, 14), [0xb91c1c, 0x15803d, 0xca8a04, 0x7c2d12, 0xea580c][(i + k) % 5], -2 + i, k * 1.6 + 0.27, 0); T.add('g', rcyl(0.36, 0.25, 0.06, 16), 0x111827, -2 + i, k * 1.6 + 1.25, 0); } } },
  // ---------- living / bedroom ----------
  coffeeTable(w, x, z, ry, L = 12, D = 6, H = 2.6) { const T = w.tf(x, 0, z, ry); T.slab('g', 0xa16207, 0, H - 0.5, 0, L, 0.5, D, 0.25); T.slab('m', 0x854d0e, 0, 0.6, 0, L - 1.5, 0.3, D - 1.5, 0.1);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { T.add('g', rcyl(0.35, H - 0.5, 0.08, 16), 0x713f12, a * (L / 2 - 0.7), 0, b * (D / 2 - 0.7)); T.solid(a * (L / 2 - 0.7) - 0.35, 0, b * (D / 2 - 0.7) - 0.35, a * (L / 2 - 0.7) + 0.35, H - 0.5, b * (D / 2 - 0.7) + 0.35, { cam: false }); });
    return H; },
  remote(w, x, y, z, ry = 0) { const T = w.tf(x, y, z, ry); T.slab('g', 0x27272a, 0, 0, 0, 0.9, 0.3, 2.8, 0.15); T.add('g', sph(10), 0xef4444, 0, 0.3, 1.0, 0, 0, 0, 0.16, 0.1, 0.16); for (let i = 0; i < 6; i++) T.add('g', sph(8), 0x9ca3af, (i % 2 - 0.5) * 0.4, 0.3, 0.2 - (i >> 1) * 0.4, 0, 0, 0, 0.11, 0.07, 0.11); },
  magazine(w, x, y, z, ry = 0, n = 2) { const T = w.tf(x, y, z, ry); for (let i = 0; i < n; i++) { T.box('m', pick(BRIGHT), (i - 0.5) * 0.4, i * 0.12, 0, 3, 0.12, 4, 0.03); } T.solid(-1.7, 0, -2, 1.7, n * 0.12, 2); },
  frame(w, axis, at, c, y, W, H, side = 1, art = 0) { const T = axis === 'x' ? w.tf(c, y, at, side > 0 ? 0 : PI) : w.tf(at, y, c, side > 0 ? PI / 2 : -PI / 2);
    T.box('g', 0xd4a373, 0, 0, 0.3, W, H, 0.3, 0.1); T.box('m', 0xfefce8, 0, 0.35, 0.45, W - 0.7, H - 0.7, 0.05, 0.02);
    // raised 3D "painting": hills + sun / flower / boat
    if (art % 3 === 0) { T.add('g', sph(16), 0x4ade80, -W * 0.15, H * 0.1, 0.5, 0, 0, 0, W * 0.35, H * 0.25, 0.12); T.add('g', sph(16), 0x22c55e, W * 0.2, H * 0.08, 0.52, 0, 0, 0, W * 0.3, H * 0.2, 0.12); T.add('l', sph(14), 0xffd23f, W * 0.25, H * 0.7, 0.52, 0, 0, 0, W * 0.1, W * 0.1, 0.06, 0.2); }
    else if (art % 3 === 1) { T.add('g', cyl(10), 0x16a34a, 0, H * 0.15, 0.52, 0, 0, 0, 0.08, H * 0.4, 0.08); for (let i = 0; i < 6; i++) T.add('g', sph(12), 0xf472b6, Math.cos(i) * W * 0.12, H * 0.62 + Math.sin(i) * W * 0.12, 0.52, 0, 0, 0, W * 0.09, W * 0.09, 0.08); T.add('g', sph(12), 0xfde047, 0, H * 0.62, 0.56, 0, 0, 0, W * 0.07, W * 0.07, 0.08); }
    else { T.box('g', 0x60a5fa, 0, 0.4, 0.5, W - 0.8, H * 0.3, 0.08, 0.02); T.box('g', 0xef4444, 0, H * 0.33, 0.55, W * 0.4, H * 0.12, 0.12, 0.05); T.add('g', cone(3), 0xffffff, 0, H * 0.45, 0.55, 0, PI / 2, 0, W * 0.18, H * 0.35, 0.04); } },
  clock(w, axis, at, c, y, side = 1) { const T = axis === 'x' ? w.tf(c, y, at, side > 0 ? 0 : PI) : w.tf(at, y, c, side > 0 ? PI / 2 : -PI / 2); T.add('g', rcyl(1.6, 0.4, 0.15, 32), 0xef4444, 0, 0, 0.2, PI / 2, 0, 0); T.add('m', rcyl(1.35, 0.1, 0.03, 32), 0xffffff, 0, 0, 0.62, PI / 2, 0, 0);
    for (let i = 0; i < 12; i++) T.add('g', sph(6), 0x1f2937, Math.cos(i * PI / 6) * 1.1, Math.sin(i * PI / 6) * 1.1, 0.68, 0, 0, 0, 0.08); T.box('g', 0x111827, 0, 0, 0.7, 0.12, 0.9, 0.05, 0.02); T.add('g', rbox(0.7, 0.1, 0.05, 0.02), 0x111827, 0.3, 0.1, 0.7, 0, 0, 0.5); },
  bed(w, x, z, ry, col = 0x60a5fa, sheet = 0xfef3c7) { const T = w.tf(x, 0, z, ry); const L = 26, W = 16, H = 3.4;
    T.slab('g', 0xd4a373, 0, 0.8, 0, W, H - 1.6, L, 0.3); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => T.add('g', rcyl(0.6, 1, 0.15, 16), 0xb07a45, a * (W / 2 - 0.8), 0, b * (L / 2 - 0.8)));
    T.slab('f', sheet, 0, H - 0.8, 0.5, W - 0.5, 2, L - 1, 0.8, { bounce: 15 }); T.box('f', col, 0, H + 0.9, 3, W - 0.2, 0.8, L - 7, 0.4); T.add('f', capsule(16), col, 0, H + 1.1, -L / 2 + 7, 0, 0, PI / 2, 1.3, W - 2, 1.1);
    [-1, 1].forEach((s) => T.box('f', 0xffffff, s * 3.5, H + 1.2, -L / 2 + 3.2, 6, 1.4, 3.6, 0.7)); T.slab('g', 0xd4a373, 0, 0, -L / 2 - 0.4, W + 0.6, 11, 1, 0.3); T.add('g', sph(20), 0xd4a373, 0, 11, -L / 2 - 0.4, 0, 0, 0, W / 2, 2, 0.5);
    T.solid(-W / 2, H + 1.2, -L / 2 + 1.4, W / 2, H + 2.0, -L / 2 + 5);
    for (let i = 0; i < 5; i++) T.add('g', star(), 0xffd23f, -W / 2 + 2 + i * 3, 7 + (i % 2) * 1.6, -L / 2 + 0.15, 0, 0, i * 0.4, 0.5, 0.5, 0.4); },
  nightstand(w, x, z, ry, col = 0xf9a8d4) { const T = w.tf(x, 0, z, ry); T.slab('g', col, 0, 0, 0, 5, 5, 4.4, 0.3); T.box('g', 0xffffff, 0, 3.2, 2.2, 4.2, 1.3, 0.2, 0.1); T.add('g', sph(10), 0xffd23f, 0, 3.85, 2.4, 0, 0, 0, 0.3); return 5; },
  toyBlock(w, x, y, z, s = 2, ry = 0, col = pick(BRIGHT), o) { const T = w.tf(x, y, z, ry); T.slab('g', col, 0, 0, 0, s, s, s, s * 0.12, o); const lc = pick(BRIGHT.filter((c) => c !== col)); T.add('g', torus(0.3, 20), lc, 0, s / 2, s / 2 + 0.02, 0, 0, 0, s * 0.25, s * 0.25, s * 0.2); T.add('g', star(), lc, s / 2 + 0.02, s / 2, 0, 0, PI / 2, 0, s * 0.25, s * 0.25, s * 0.2); T.add('g', heart(), lc, -s / 2 - 0.02, s / 2, 0, 0, -PI / 2, 0, s * 0.22, s * 0.22, s * 0.2); return y + s; },
  ball(w, x, y, z, r = 1.5, a = 0xef4444, b = 0xffffff) { w.addFn('g', sph(28), (c, px, py, pz) => c.set(Math.sin(Math.atan2(pz - z, px - x) * 3) > 0 ? a : b), x, y + r, z, 0, 0, 0, r); w.solid(x - r * 0.75, y, z - r * 0.75, x + r * 0.75, y + r * 2, z + r * 0.75); },
  teddy(w, x, y, z, ry = 0, s = 1, col = 0xc08552) { const T = w.tf(x, y, z, ry, s); T.add('f', sph(20), col, 0, 1.6, 0, 0, 0, 0, 1.5, 1.7, 1.3); T.add('f', sph(20), col, 0, 3.8, 0.1, 0, 0, 0, 1.2); [-1, 1].forEach((sd) => { T.add('f', sph(14), col, sd * 0.9, 4.8, 0, 0, 0, 0, 0.45, 0.45, 0.3); T.add('f', capsule(12), col, sd * 1.6, 1.9, 0.4, 0.4, 0, sd * 0.8, 0.7, 1.2, 0.7); T.add('f', capsule(12), col, sd * 0.8, 0.5, 1.0, PI / 2, 0, 0, 0.8, 1.0, 0.8); });
    T.add('f', sph(14), 0xf5deb3, 0, 3.5, 1.1, 0, 0, 0, 0.55, 0.45, 0.4); T.add('g', sph(10), 0x111827, 0, 3.75, 1.45, 0, 0, 0, 0.16, 0.12, 0.1); [-1, 1].forEach((sd) => T.add('g', sph(10), 0x111827, sd * 0.42, 4.1, 1.0, 0, 0, 0, 0.13)); T.add('f', torus(0.35, 16), 0xef4444, 0, 2.95, 0.1, PI / 2, 0, 0, 0.75, 0.75, 0.5);
    T.solid(-1.5, 0, -1.3, 1.5, 3.1, 1.3); },
  // ---------- garage ----------
  tire(w, x, y, z, flat = true, s = 1) { if (flat) { w.add('m', torus(0.42, 36), 0x1f2937, x, y + 0.9 * s, z, PI / 2, 0, 0, 2.4 * s, 2.4 * s, 2.4 * s); w.add('x', rcyl(1.6 * s, 0.6 * s, 0.1, 24), 0x9ca3af, x, y + 0.6 * s, z); w.solid(x - 3 * s, y, z - 3 * s, x + 3 * s, y + 1.9 * s, z + 3 * s); }
    else { w.add('m', torus(0.42, 36), 0x1f2937, x, y + 3.2 * s, z, 0, 0, 0, 2.4 * s, 2.4 * s, 2.4 * s); w.add('x', rcyl(1.6 * s, 0.6 * s, 0.1, 24), 0x9ca3af, x, y + 3.2 * s, z - 0.3 * s, PI / 2, 0, 0); w.solid(x - 2.8 * s, y, z - 1 * s, x + 2.8 * s, y + 6 * s, z + 1 * s); } },
  toolbox(w, x, z, ry, col = 0xdc2626) { const T = w.tf(x, 0, z, ry); const steps = []; for (let i = 0; i < 4; i++) { T.slab('g', col, 0, i * 2.2, 0, 7, 2.1, 4.6, 0.15); T.box('x', 0xd1d5db, 0, i * 2.2 + 0.9, 2.35, 3.5, 0.3, 0.3, 0.12); }
    // pulled-out drawers make stairs
    [0, 2].forEach((i) => { T.slab('g', col, 0, i * 2.2 + 0.3, 3.4, 6.4, 1.6, 2.2, 0.12); steps.push(i); }); T.add('x', capsule(10), 0xd1d5db, 0, 9.4, 0, 0, 0, PI / 2, 0.25, 4, 0.25); return 8.8; },
  paintCan(w, x, y, z, col = pick(BRIGHT)) { w.add('x', rcyl(1.2, 2.2, 0.08, 28), 0xcbd5e1, x, y, z); w.add('g', rcyl(1.21, 1.2, 0.02, 28), col, x, y + 0.5, z); w.add('g', rcyl(1.05, 0.06, 0.02, 24), col, x, y + 2.2, z); w.add('x', torus(0.04, 20, PI), 0x9ca3af, x, y + 2.2, z, 0, 0, 0, 1.15, 1.0, 1.15); w.solid(x - 1.2, y, z - 1.2, x + 1.2, y + 2.25, z + 1.2); },
  cardboard(w, x, y, z, ry = 0, W = 5, H = 4, D = 5, open = false) { const T = w.tf(x, y, z, ry); T.slab('m', 0xc9a06a, 0, 0, 0, W, H, D, 0.12); if (!open) T.box('m', 0xd8b98b, 0, H, 0, W * 0.3, 0.06, D + 0.02, 0.02); else { [-1, 1].forEach((s) => T.add('m', rbox(W, 0.12, D / 2, 0.04), 0xb88c55, 0, H + 0.6, s * (D / 2 + 0.6), s * 0.9, 0, 0)); } T.box('m', 0xa47b4a, 0, H * 0.45, D / 2 + 0.01, W * 0.4, H * 0.2, 0.04, 0.02); return y + H; },
  workbench(w, x, z, ry, L = 20, H = 7, D = 6) { const T = w.tf(x, 0, z, ry); T.slab('m', 0xb07a45, 0, H - 0.8, 0, L, 0.8, D, 0.15); T.slab('m', 0x8b5a2b, 0, 1.6, 0, L - 1, 0.5, D - 1, 0.1);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => T.slab('m', 0x8b5a2b, a * (L / 2 - 0.6), 0, b * (D / 2 - 0.6), 0.8, H - 0.8, 0.8, 0.1, { cam: false })); return H; },
  hammer(w, x, y, z, ry = 0) { const T = w.tf(x, y, z, ry); T.add('m', capsule(12), 0xd4a373, 0, 0.3, 0, PI / 2, 0, 0, 0.4, 3.4, 0.4); T.box('x', 0x6b7280, 0, 0, -2.1, 0.8, 0.7, 1.8, 0.2); T.solid(-0.5, 0, -2.9, 0.5, 0.7, 1.9); },
  wrench(w, x, y, z, ry = 0, s = 1) { const T = w.tf(x, y, z, ry, s); T.box('x', 0x9ca3af, 0, 0, 0, 0.6, 0.25, 4, 0.1); [-1, 1].forEach((sd) => T.add('x', torus(0.3, 18, PI * 1.5), 0x9ca3af, 0, 0.12, sd * 2.2, PI / 2, 0, sd > 0 ? -PI * 0.75 : PI * 0.25, 0.6, 0.6, 0.6)); T.solid(-0.6, 0, -2.6, 0.6, 0.3, 2.6); },
  pegboard(w, axis, at, c, y0, W, H, side = 1) { const T = axis === 'x' ? w.tf(c, y0, at, side > 0 ? 0 : PI) : w.tf(at, y0, c, side > 0 ? PI / 2 : -PI / 2); T.box('m', 0xd6b88a, 0, 0, 0.2, W, H, 0.3, 0.05);
    for (let i = 1; i < W / 1.2; i++) for (let j = 1; j < H / 1.2; j++) T.add('m', cyl(6), 0x6b4f2a, -W / 2 + i * 1.2, j * 1.2, 0.36, PI / 2, 0, 0, 0.1, 0.02, 0.1); },
  shelfUnit(w, x, z, ry, W = 10, H = 18, D = 4, n = 4, col = 0x64748b) { const T = w.tf(x, 0, z, ry); const tops = []; [-1, 1].forEach((s) => [-1, 1].forEach((t) => T.slab('x', col, s * (W / 2 - 0.2), 0, t * (D / 2 - 0.2), 0.4, H, 0.4, 0.08, { cam: false })));
    for (let i = 1; i <= n; i++) { const y = i * H / n - 0.3; T.slab('x', 0x94a3b8, 0, y, 0, W, 0.3, D, 0.06); tops.push(y + 0.3); } return tops; },
  bike(w, x, z, ry) { const T = w.tf(x, 0, z, ry); [-1, 1].forEach((s) => { T.add('m', torus(0.08, 40), 0x1f2937, s * 5, 3.2, 0, 0, PI / 2, 0, 3.1, 3.1, 3.1); T.add('x', torus(0.04, 30), 0xd1d5db, s * 5, 3.2, 0, 0, PI / 2, 0, 2.6, 2.6, 2.6); });
    T.add('g', tube([[-5, 3.2, 0], [-1, 6.5, 0], [3.5, 6.8, 0], [5, 3.2, 0]], 0.25, 30, 10), 0x0ea5e9); T.add('g', tube([[-1, 6.5, 0], [0.5, 3.4, 0], [3.5, 6.8, 0]], 0.22, 20, 10), 0x0ea5e9); T.add('f', capsule(12), 0x111827, -1.3, 7.3, 0, 0, 0, PI / 2, 0.6, 1.8, 0.8); T.add('x', cyl(10), 0xd1d5db, 3.8, 6.8, 0, 0, 0, 0, 0.12, 1.4, 0.12); T.add('m', capsule(10), 0x111827, 3.8, 8.2, 0, PI / 2, 0, 0, 0.3, 3, 0.3); },
  // ---------- garden ----------
  grassField(w, x0, z0, x1, z1, y = 0, dens = 0.55, cols = [0x4caf50, 0x5cc35f, 0x3d9e43, 0x7bd36a]) { const n = Math.floor((x1 - x0) * (z1 - z0) * dens);
    for (let i = 0; i < n; i++) { const x = x0 + R() * (x1 - x0), z = z0 + R() * (z1 - z0); w.add('g', blade(), pick(cols), x, y, z, (R() - 0.5) * 0.3, R() * PI * 2, (R() - 0.5) * 0.3, 1.3 + R(), 1.4 + R() * 1.8, 1.3 + R()); } },
  flower(w, x, y, z, H = 6, col = pick([0xff5d8f, 0xffd23f, 0xa66bff, 0xff8a3d, 0xffffff]), solid = true) { w.add('g', tube([[x, y, z], [x + 0.3, y + H * 0.5, z - 0.2], [x, y + H, z]], 0.18, 16, 8), 0x2e9e45, 0, 0, 0); w.add('g', leaf(), 0x3fbf5a, x + 0.2, y + H * 0.35, z, -0.9, R() * 6, 0, 1.2, 1.8, 1);
    for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; w.add('g', sph(14), col, x + Math.cos(a) * 1.1, y + H, z + Math.sin(a) * 1.1, 0, -a, 0, 0.95, 0.22, 0.55); } w.add('g', sph(14), 0xffb020, x, y + H + 0.1, z, 0, 0, 0, 0.6, 0.3, 0.6);
    if (solid) w.solid(x - 1.6, y + H - 0.1, z - 1.6, x + 1.6, y + H + 0.3, z + 1.6, { cam: false }); return y + H + 0.3; },
  mushroom(w, x, y, z, s = 1, col = 0xef4444) { w.add('g', rcyl(0.5 * s, 1.6 * s, 0.2, 16), 0xfff7ed, x, y, z); w.add('g', sph(22), col, x, y + 1.6 * s, z, 0, 0, 0, 1.7 * s, 1.0 * s, 1.7 * s); for (let i = 0; i < 6; i++) { const a = i * 1.05; w.add('g', sph(10), 0xffffff, x + Math.cos(a) * 1.1 * s, y + 2.15 * s, z + Math.sin(a) * 1.1 * s, 0, 0, 0, 0.3 * s, 0.15 * s, 0.3 * s); }
    w.solid(x - 1.5 * s, y + 1.6 * s, z - 1.5 * s, x + 1.5 * s, y + 2.5 * s, z + 1.5 * s, { bounce: 12 * Math.sqrt(s) }); w.solid(x - 0.5 * s, y, z - 0.5 * s, x + 0.5 * s, y + 1.6 * s, z + 0.5 * s, { cam: false }); },
  rock(w, x, y, z, s = 2, col = 0x9ca3af) { w.add('g', blobGeo((x * 7 + z * 13) | 0, 0.22, 2), col, x, y + s * 0.4, z, 0, R() * 6, 0, s, s * 0.7, s * 0.9); w.solid(x - s * 0.8, y, z - s * 0.7, x + s * 0.8, y + s * 0.85, z + s * 0.7); return y + s * 0.85; },
  fence(w, axis, at, from, to, H = 22, col = 0xfff7ed) { for (let p = from; p <= to; p += 3) { const x = axis === 'x' ? p : at, z = axis === 'x' ? at : p; w.add('m', rbox(2.6, H, 0.6, 0.2), col, x, H / 2, z, 0, axis === 'x' ? 0 : PI / 2, 0); w.add('m', cone(4), col, x, H, z, 0, PI / 4 + (axis === 'x' ? 0 : PI / 2), 0, 1.84, 1.2, 0.42); }
    [5, H - 5].forEach((y) => { if (axis === 'x') w.add('m', rbox(to - from + 2, 1, 0.5, 0.2), 0xf5e6d0, (from + to) / 2, y, at + 0.6); else w.add('m', rbox(0.5, 1, to - from + 2, 0.2), 0xf5e6d0, at + 0.6, y, (from + to) / 2); });
    if (axis === 'x') w.solid(from - 1.5, 0, at - 0.6, to + 1.5, H + 30, at + 0.9, { wall: true }); else w.solid(at - 0.6, 0, from - 1.5, at + 0.9, H + 30, to + 1.5, { wall: true }); },
  flowerPot(w, x, z, s = 1, col = 0xd2691e, flowers = true) { const T = w.tf(x, 0, z, 0, s); T.add('g', lathe([[0, 0], [2.4, 0], [3.0, 4.3], [3.4, 4.4], [3.4, 5.0], [0, 5.0]], 32, 'fpot'), col); T.solid(-2.9, 0, -2.9, 2.9, 5.0, 2.9); T.add('m', cyl(24), 0x4a2f1b, 0, 4.85, 0, 0, 0, 0, 3.2, 0.2, 3.2);
    if (flowers) for (let i = 0; i < 3; i++) PR.flower(w, x + Math.cos(i * 2.1) * 1.4 * s, 5 * s, z + Math.sin(i * 2.1) * 1.4 * s, (4 + i * 1.5) * s, undefined, i === 1); return 5 * s; },
  wateringCan(w, x, z, ry = 0) { const T = w.tf(x, 0, z, ry); T.add('g', rcyl(2.2, 4.5, 0.4, 28), 0x22c55e); T.add('g', tube([[1.8, 1, 0], [4, 3.5, 0], [5.6, 5.5, 0]], 0.35, 20, 10), 0x22c55e); T.add('g', cone(16), 0x16a34a, 5.8, 5.5, 0, 0, 0, -0.8, 0.7, 0.8, 0.7); T.add('g', torus(0.18, 24, PI), 0x16a34a, 0, 4.5, 0, 0, PI / 2, 0, 1.6, 1.6, 1.6); T.solid(-2.2, 0, -2.2, 2.2, 4.5, 2.2); return 4.5; },
  gnome(w, x, z, ry = 0, s = 1) { const T = w.tf(x, 0, z, ry, s); T.add('g', rcyl(1.4, 2.4, 0.5, 24), 0x2563eb); T.add('g', sph(18), 0xfde2c4, 0, 3.1, 0, 0, 0, 0, 1.0); T.add('g', sph(18), 0xffffff, 0, 2.6, 0.5, 0, 0, 0, 1.0, 1.1, 0.7); T.add('g', cone(20), 0xdc2626, 0, 3.4, 0, -0.2, 0, 0, 1.1, 2.8, 1.1); T.add('g', sph(12), 0xf9a8a8, 0, 3.0, 0.95, 0, 0, 0, 0.3); [-1, 1].forEach((sd) => T.add('g', sph(8), 0x111827, sd * 0.35, 3.35, 0.85, 0, 0, 0, 0.12)); T.solid(-1.4, 0, -1.4, 1.4, 2.4, 1.4); },
  stone(w, x, z, r = 3) { w.add('m', blobGeo((x * 3 + z) | 0, 0.1, 2), 0xb8b2a6, x, 0.15, z, 0, R() * 6, 0, r, 0.35, r * 0.85); w.solid(x - r * 0.8, 0, z - r * 0.7, x + r * 0.8, 0.45, z + r * 0.7); },
  // ---------- attic ----------
  trunk(w, x, z, ry, col = 0x7c3aed) { const T = w.tf(x, 0, z, ry); T.slab('g', col, 0, 0, 0, 8, 4, 5, 0.3); T.add('g', capsule(20), col, 0, 4, 0, 0, 0, PI / 2, 5, 8.0, 2); T.solid(-4, 4, -2.5, 4, 5.3, 2.5);
    [-3, 0, 3].forEach((s) => T.box('x', 0xd4a017, s, 0, 0, 0.5, 4.2, 5.1, 0.1)); T.add('x', rbox(1, 1, 0.3, 0.1), 0xffd23f, 0, 3.4, 2.6); return 5.3; },
  beam(w, x0, y, z0, x1, z1, s = 1.6, col = 0x8b5a2b) { const L = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(x1 - x0, z1 - z0); w.add('m', rbox(s, s, L, 0.12), col, (x0 + x1) / 2, y + s / 2, (z0 + z1) / 2, 0, a, 0);
    w.solid(Math.min(x0, x1) - (Math.abs(z1 - z0) > 0.1 ? s / 2 : 0), y, Math.min(z0, z1) - (Math.abs(x1 - x0) > 0.1 ? s / 2 : 0), Math.max(x0, x1) + (Math.abs(z1 - z0) > 0.1 ? s / 2 : 0), y + s, Math.max(z0, z1) + (Math.abs(x1 - x0) > 0.1 ? s / 2 : 0), { cam: false }); },
  rockingHorse(w, x, z, ry) { const T = w.tf(x, 0, z, ry); T.add('m', torus(0.1, 40, PI * 0.6), 0x8b5a2b, -1, 6, 0, 0, PI / 2, PI * 1.2, 7, 6, 6); T.add('m', torus(0.1, 40, PI * 0.6), 0x8b5a2b, 1, 6, 0, 0, PI / 2, PI * 1.2, 7, 6, 6);
    T.add('g', capsule(20), 0xf5f5f4, 0, 3.8, 0, PI / 2, 0, 0, 2.6, 4.2, 2.4); T.add('g', capsule(16), 0xf5f5f4, 0, 6.2, 3.3, -0.5, 0, 0, 1.6, 2.4, 1.6); T.add('g', capsule(14), 0xf5f5f4, 0, 6.3, 4.8, PI / 2 + 0.2, 0, 0, 1.2, 1.4, 1.1);
    for (let i = 0; i < 5; i++) T.add('f', sph(10), 0xdc2626, 0, 7.4 - i * 0.6, 2.6 - i * 0.3, 0, 0, 0, 0.5, 0.6, 0.5); T.add('g', capsule(14), 0xdc2626, 0, 4.9, -0.2, 0, 0, PI / 2, 1.4, 2.2, 1.6); [-1, 1].forEach((s) => T.add('g', sph(8), 0x111827, s * 0.7, 6.9, 4.6, 0, 0, 0, 0.18)); for (let i = 0; i < 6; i++) T.add('f', capsule(8), 0x7c2d12, 0, 3.6 - i * 0.12, -3.4 - i * 0.3, 0.7 + i * 0.1, 0, 0, 0.35, 1.2, 0.35);
    T.solid(-1.3, 0, -2.6, 1.3, 5.2, 2.6); },
  lantern(w, x, y, z, col = 0xffc46b) { w.add('x', rcyl(0.8, 0.3, 0.1, 16), 0x374151, x, y, z); w.add('e', rcyl(0.7, 1.6, 0.2, 16), 0xfff7ed, x, y + 0.3, z); w.add('l', sph(12), col, x, y + 1.05, z, 0, 0, 0, 0.4, 0.55, 0.4, 1.4); w.add('x', cone(16), 0x374151, x, y + 1.9, z, 0, 0, 0, 0.9, 0.6, 0.9); w.add('x', torus(0.2, 16, PI), 0x374151, x, y + 2.6, z, 0, 0, 0, 0.35); w.solid(x - 0.8, y, z - 0.8, x + 0.8, y + 2.5, z + 0.8); w.lights.push({ x, y: y + 1.2, z, c: col }); },
  suitcase(w, x, y, z, ry, col = 0x0ea5e9) { const T = w.tf(x, y, z, ry); T.slab('g', col, 0, 0, 0, 6, 1.8, 4.2, 0.4); T.add('g', torus(0.25, 16, PI), 0x1f2937, 0, 1.8, 0, 0, 0, 0, 0.7, 0.5, 0.6); for (let i = 0; i < 3; i++) T.add('g', sph(12), BRIGHT[i + 2], -1.5 + i * 1.6, 1.85, 0.6, 0, 0, 0, 0.5, 0.06, 0.5); return y + 1.8; },
  globe(w, x, y, z) { w.add('m', rcyl(1, 0.3, 0.1, 20), 0x8b5a2b, x, y, z); w.add('x', cyl(8), 0xd4a017, x, y + 0.3, z, 0, 0, 0, 0.12, 1, 0.12); w.addFn('g', sph(28), (c, px, py, pz) => c.set(Math.sin(px * 3.1) * Math.cos(pz * 2.7) + Math.sin(py * 2.3) > 0.4 ? 0x22c55e : 0x3b82f6), x, y + 2.6, z, 0.4, 0, 0, 1.4); w.add('x', torus(0.04, 30, PI * 1.4), 0xd4a017, x, y + 2.6, z, 0, PI / 2, 0.4, 1.6, 1.6, 1.6); w.solid(x - 1.2, y, z - 1.2, x + 1.2, y + 4, z + 1.2); },
  web(w, x, y, z, ry = 0, s = 3) { const T = w.tf(x, y, z, ry, s); for (let i = 0; i < 6; i++) { const a = i / 6 * PI / 2; T.add('m', cyl(4), 0xf1f5f9, 0, 0, 0, 0, 0, -a - 0.0, 0.015, 1.6, 0.015); } for (let k = 1; k <= 3; k++) T.add('m', torus(0.012, 12, PI / 2), 0xf1f5f9, 0, 0, 0, PI / 2 * 0, 0, -PI / 2, k * 0.45, k * 0.45, k * 0.45); },
};
import { star, heart } from './shapes.js?v=np5';
