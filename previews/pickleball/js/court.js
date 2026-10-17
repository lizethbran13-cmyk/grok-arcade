// Grok Pickleball Park - court pieces: regulation courts (20 x 44 ft, 7 ft kitchen), sagging nets with tape + center strap,
// chain-link fences with windscreens, stepped bleachers, light towers, umpire chairs, benches, ball hoppers. Real smooth geometry.
import * as K from './kit.js?v=ppk1';
import { rbox } from './world.js?v=ppk1';
import { txt } from './art.js?v=ppk1';
const { rcyl, lathe, sph, cyl, cone, torus, capsule, tube } = K;
const PI = Math.PI, R = K.R;
export const CW = { HW: 3.048, HL: 6.705, K: 2.134, POST: 3.35, NS: 0.914, NM: 0.864 };
export const PAL = {
  blue: { court: 0x2f7fd6, kit: 0x2563c0, out: 0x3d8f4e },
  green: { court: 0x2f9e57, kit: 0x258a49, out: 0x1f6f8b },
  purple: { court: 0x6d4fd1, kit: 0x5b3fc0, out: 0x2b3a55 },
  teal: { court: 0x14a3a8, kit: 0x0f8c91, out: 0x3b4f63 },
  orange: { court: 0xe98a2d, kit: 0xd8761d, out: 0xb98a55 },
};
const LINE = 0xffffff;
// one full court centred at (cx,cz): net along x, baselines at cz +/- 6.7
export function court(w, cx, cz, pal = PAL.blue, o = {}) {
  const { HW, HL } = CW, Kz = CW.K, runX = o.runX || 3.0, runZ = o.runZ || 3.4, y0 = o.y || 0;
  // surround + playing surface + kitchens (slight bevels so light catches the edges)
  w.slab('m', pal.out, cx, y0, cz, HW * 2 + runX * 2, 0.06, HL * 2 + runZ * 2, 0.03, { floor: true });
  w.add('g', rbox(HW * 2, 0.02, HL * 2 - Kz * 2, 0.008, 1), pal.court, cx, y0 + 0.07, cz);
  [-1, 1].forEach((s) => w.add('g', rbox(HW * 2, 0.02, HL - Kz, 0.008, 1), pal.court, cx, y0 + 0.07, cz + s * (Kz + (HL - Kz) / 2)));
  [-1, 1].forEach((s) => w.add('g', rbox(HW * 2, 0.021, Kz, 0.008, 1), pal.kit, cx, y0 + 0.071, cz + s * Kz / 2));
  // lines (2 in wide)
  const L = (x0, z0, x1, z1) => w.add('m', rbox(Math.max(0.05, x1 - x0), 0.012, Math.max(0.05, z1 - z0), 0.004, 1), LINE, cx + (x0 + x1) / 2, y0 + 0.085, cz + (z0 + z1) / 2);
  [-1, 1].forEach((s) => { L(s * HW - 0.025, -HL, s * HW + 0.025, HL); L(-HW, s * HL - 0.025, HW, s * HL + 0.025); L(-HW, s * Kz - 0.025, HW, s * Kz + 0.025);
    const a = s > 0 ? Kz : -HL, b = s > 0 ? HL : -Kz; L(-0.025, a, 0.025, b); L(-0.025, s * HL - s * 0.2 - 0.1, 0.025, s * HL - s * 0.2 + 0.1); });
  if (o.logo !== false) { w.add('g', rcyl(0.55, 0.015, 0.005, 32), 0xe6ff3b, cx, y0 + 0.08, cz + (HL + runZ * 0.55)); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; w.add('m', rcyl(0.07, 0.018, 0.004, 12), 0x9fb81a, cx + Math.cos(a) * 0.3, y0 + 0.081, cz + HL + runZ * 0.55 + Math.sin(a) * 0.3); } }
  net(w, cx, cz, y0, o.netCol);
  // court-side gear: benches + ball hopper + paddle on the bench + water cooler
  if (o.gear !== false) { const bx = cx + HW + runX - 0.6; [-1, 1].forEach((s) => { const T = w.tf(bx, y0 + 0.06, cz + s * 2.6, -PI / 2); T.box('m', o.bench || 0x2563eb, 0, 0.42, 0, 1.8, 0.07, 0.45, 0.03); [-0.75, 0.75].forEach((a) => T.box('x', 0x475569, a, 0, 0, 0.06, 0.42, 0.4, 0.02)); T.solid(-0.9, 0, -0.25, 0.9, 0.5, 0.25);
      if (R() < 0.7) { paddleProp(w, bx + 0.05, y0 + 0.56, cz + s * 2.6 + 0.4, PI / 2, 0.3, R() < 0.5 ? 0xef4444 : 0x22c55e); } });
    hopper(w, cx - HW - runX + 0.9, y0 + 0.06, cz + 1.2); K.cooler(w, bx, cz); }
  return { x: cx, z: cz };
}
export function net(w, cx, cz, y0 = 0, col = 0x111827) {
  const { POST, NS, NM } = CW; const H = (x) => { const t = Math.min(1, Math.abs(x) / 3.048); return NM + (NS - NM) * t * t; };
  [-1, 1].forEach((s) => { w.add('x', rcyl(0.045, NS + 0.06, 0.02, 16), 0x334155, cx + s * POST, y0 + 0.06, cz); w.add('x', rcyl(0.12, 0.05, 0.02, 16), 0x334155, cx + s * POST, y0 + 0.06, cz); w.add('g', sph(10), 0xe6ff3b, cx + s * POST, y0 + NS + 0.12, cz, 0, 0, 0, 0.05); });
  // the mesh body: translucent dark panel per segment following the sag, + white tape on top, + bottom cord, + center strap
  const N = 10; for (let i = 0; i < N; i++) { const xa = -POST + i * (POST * 2 / N), xb = xa + POST * 2 / N, xm = (xa + xb) / 2, h = H(xm) - 0.08;
    w.add('e', rbox(xb - xa + 0.005, h, 0.012, 0.004, 1), col, cx + xm, y0 + 0.06 + 0.06 + h / 2, cz);
    w.add('g', rbox(xb - xa + 0.01, 0.06, 0.035, 0.01, 1), 0xffffff, cx + xm, y0 + 0.06 + H(xm) - 0.03, cz, 0, 0, Math.atan2(H(xb) - H(xa), xb - xa)); }
  // mesh threads (a few real strands so it reads as a net up close)
  for (let i = 0; i <= 26; i++) { const x = -POST + i * (POST * 2 / 26); w.add('m', rbox(0.006, H(x) - 0.06, 0.006, 0.002, 1), 0x0b0f19, cx + x, y0 + 0.12 + (H(x) - 0.06) / 2, cz); }
  for (let j = 1; j < 6; j++) w.add('m', rbox(POST * 2, 0.006, 0.006, 0.002, 1), 0x0b0f19, cx, y0 + 0.12 + j * 0.13, cz);
  w.add('m', rbox(POST * 2, 0.02, 0.02, 0.006, 1), 0x1f2937, cx, y0 + 0.13, cz); w.add('g', rbox(0.05, NM, 0.04, 0.01, 1), 0xffffff, cx, y0 + 0.06 + NM / 2, cz);
  w.solid(cx - POST - 0.05, y0, cz - 0.05, cx + POST + 0.05, y0 + NS + 0.1, cz + 0.05, { cam: false });
}
// a paddle lying around / on display (real rounded paddle: face, edge guard, grip, butt cap)
export function paddleProp(w, x, y, z, ry, rx = 0, col = 0x22c55e, s = 1, edge = 0x111827, grit = false) { const T = w.tf(x, y, z, ry, s);
  T.add('g', rbox(0.2, 0.012, 0.25, 0.006, 1), col, 0, 0, 0.1, rx, 0, 0); T.add('g', rcyl(0.1, 0.012, 0.005, 24), col, 0, -0.006, 0.225, rx, 0, 0); T.add('g', rcyl(0.1, 0.012, 0.005, 24), col, 0, -0.006, -0.025, rx, 0, 0);
  T.add('g', rbox(0.214, 0.018, 0.04, 0.008, 1), edge, 0, 0, 0.3, rx, 0, 0); T.add('f', capsule(10), 0x1f2937, 0, 0, -0.14, PI / 2 + rx, 0, 0, 0.055, 0.12, 0.045); if (grit) T.add('m', rbox(0.18, 0.004, 0.22, 0.003, 1), 0x6b7280, 0, 0.008, 0.11, rx, 0, 0); }
export function hopper(w, x, y, z) { const T = w.tf(x, y, z, 0); [-1, 1].forEach((a) => [-1, 1].forEach((b) => T.add('x', cyl(8), 0x94a3b8, a * 0.18, 0, b * 0.18, 0, 0, 0, 0.012, 0.8, 0.012)));
  T.box('x', 0xcbd5e1, 0, 0.55, 0, 0.42, 0.32, 0.42, 0.02); for (let i = 0; i < 9; i++) T.add('g', sph(8), 0xe6ff3b, -0.12 + (i % 3) * 0.12, 0.84 + (i / 3 | 0) * 0.03, -0.12 + ((i * 2) % 3) * 0.12, 0, 0, 0, 0.037); T.solid(-0.25, 0, -0.25, 0.25, 0.9, 0.25, { cam: false }); }
export function ballBucket(w, x, y, z, col = 0xe6ff3b, n = 10) { w.add('g', lathe([[0, 0], [0.2, 0], [0.24, 0.36], [0.22, 0.37], [0, 0.37]], 20, 'bucket'), 0xff8a3d, x, y, z); for (let i = 0; i < n; i++) w.add('g', sph(10), col, x + Math.cos(i * 2.4) * 0.12 * (i % 3) / 2, y + 0.33 + (i / 5 | 0) * 0.04, z + Math.sin(i * 2.4) * 0.12 * (i % 3) / 2, 0, 0, 0, 0.037); }
// chain-link fence run with windscreen panels (dark green) and the park name every few panels
export function fence(w, axis, at, from, to, H = 3.0, o = {}) { const st = 2.5, n = Math.max(1, Math.round((to - from) / st)), d = (to - from) / n;
  for (let i = 0; i <= n; i++) { const p = from + i * d, x = axis === 'x' ? p : at, z = axis === 'x' ? at : p; w.add('x', rcyl(0.045, H, 0.02, 12), 0x475569, x, 0, z); }
  const mid = (from + to) / 2, L = to - from; const top = (axis === 'x') ? [mid, H - 0.02, at, L, 0.06, 0.06] : [at, H - 0.02, mid, 0.06, 0.06, L];
  w.add('x', rbox(top[3], top[4], top[5], 0.02, 1), 0x475569, top[0], top[1], top[2]);
  const ws = o.windscreen !== false, wh = o.wh || 1.8; if (ws) { if (axis === 'x') w.add('f', rbox(L, wh, 0.03, 0.01, 1), o.col || 0x14532d, mid, 0.15 + wh / 2, at); else w.add('f', rbox(0.03, wh, L, 0.01, 1), o.col || 0x14532d, at, 0.15 + wh / 2, mid); }
  // chain-link above the screen: translucent mesh panel
  const ch = H - (ws ? wh + 0.15 : 0.1); if (axis === 'x') w.add('e', rbox(L, ch, 0.015, 0.005, 1), 0x94a3b8, mid, H - ch / 2, at); else w.add('e', rbox(0.015, ch, L, 0.005, 1), 0x94a3b8, at, H - ch / 2, mid);
  if (ws && o.words) { for (let k = 0; k < n; k += 4) { const c = from + (k + 2) * d; if (c > to - 1) continue; const s = o.side || 1; if (axis === 'x') txt(w, o.words, c, 0.95, at + s * 0.04, s > 0 ? 0 : PI, 0.2, 0xe6ff3b, 'g'); else txt(w, o.words, at + s * 0.04, 0.95, c, s > 0 ? PI / 2 : -PI / 2, 0.2, 0xe6ff3b, 'g'); } }
  if (axis === 'x') w.solid(from, 0, at - 0.08, to, H, at + 0.08, { wall: true }); else w.solid(at - 0.08, 0, from, at + 0.08, H, to, { wall: true }); }
// a fenced box around a court group with a gate gap on one side
export function fencedBox(w, x0, z0, x1, z1, gates = [], o = {}) { const runs = { n: [x0, x1], s: [x0, x1], w: [z0, z1], e: [z0, z1] };
  for (const sd of ['n', 's', 'w', 'e']) { const [a, b] = runs[sd]; const at = sd === 'n' ? z0 : sd === 's' ? z1 : sd === 'w' ? x0 : x1; const axis = sd === 'n' || sd === 's' ? 'x' : 'z';
    const gs = gates.filter((g) => g.side === sd).sort((p, q) => p.at - q.at); let cur = a; const side = sd === 'n' || sd === 'w' ? -1 : 1;
    for (const g of gs) { if (g.at - g.w / 2 > cur + 0.5) fence(w, axis, at, cur, g.at - g.w / 2, o.H, Object.assign({ side }, o)); cur = g.at + g.w / 2; }
    if (b > cur + 0.5) fence(w, axis, at, cur, b, o.H, Object.assign({ side }, o)); } }
// stepped bleachers: rows run along `axis`, rising away from the court (dir = +1/-1 on the perpendicular axis). Returns seat spots.
export function bleachers(w, axis, x0, x1, at, dir, rows = 6, o = {}) { const seats = [], rh = 0.42, rd = 0.8, cols = o.cols || [0x2563eb, 0x1d4ed8];
  for (let r = 0; r < rows; r++) { const y = r * rh, off = at + dir * (r * rd + rd / 2), L = x1 - x0, m = (x0 + x1) / 2;
    if (axis === 'x') { w.slab('m', 0x94a3b8, m, 0, off, L, y + rh, rd, 0.03); w.add('g', rbox(L, 0.08, 0.42, 0.03, 1), cols[r % 2], m, y + rh + 0.04, off - dir * 0.1); }
    else { w.slab('m', 0x94a3b8, off, 0, m, rd, y + rh, L, 0.03); w.add('g', rbox(0.42, 0.08, L, 0.03, 1), cols[r % 2], off - dir * 0.1, y + rh + 0.04, m); }
    for (let s = x0 + 0.6; s < x1 - 0.4; s += 0.75) seats.push(axis === 'x' ? { x: s, y: y + rh + 0.02, z: off - dir * 0.05, ry: dir > 0 ? PI : 0 } : { x: off - dir * 0.05, y: y + rh + 0.02, z: s, ry: dir > 0 ? -PI / 2 : PI / 2 }); }
  // back rail
  const bo = at + dir * (rows * rd + 0.1), by = rows * rh + 1.0; if (axis === 'x') { w.add('x', rbox(x1 - x0, 0.06, 0.06, 0.02, 1), 0xcbd5e1, (x0 + x1) / 2, by, bo); w.solid(x0, 0, bo - 0.1, x1, by, bo + 0.1, { wall: true }); } else { w.add('x', rbox(0.06, 0.06, x1 - x0, 0.02, 1), 0xcbd5e1, bo, by, (x0 + x1) / 2); w.solid(bo - 0.1, 0, x0, bo + 0.1, by, x1, { wall: true }); }
  return seats; }
// stadium light tower: lattice pole + light bank (glow) + a pooled point-light spot
export function lightTower(w, x, z, faceRy, H = 11, col = 0xfff6d8) { w.add('x', rcyl(0.35, 0.4, 0.05, 16), 0x64748b, x, 0, z); w.add('x', cyl(12, 0.7), 0x94a3b8, x, 0.4, z, 0, 0, 0, 0.22, H, 0.22);
  for (let i = 1; i < 7; i++) w.add('x', torus(0.15, 16), 0x94a3b8, x, i * H / 7, z, PI / 2, 0, 0, 0.24, 0.24, 0.24);
  const T = w.tf(x, H + 0.4, z, faceRy); T.box('x', 0x334155, 0, 0, 0, 2.6, 1.6, 0.4, 0.06); for (let a = 0; a < 4; a++) for (let b = 0; b < 3; b++) { T.add('x', rcyl(0.24, 0.12, 0.04, 16), 0x1f2937, -0.95 + a * 0.63, 0.32 + b * 0.5, 0.2, PI / 2, 0, 0); T.add('l', rcyl(0.19, 0.03, 0.01, 16), col, -0.95 + a * 0.63, 0.32 + b * 0.5, 0.33, PI / 2, 0, 0, 1, 1, 1, 0.9); }
  w.solid(x - 0.4, 0, z - 0.4, x + 0.4, H, z + 0.4); }
export function umpireChair(w, x, z, ry) { const T = w.tf(x, 0, z, ry); [-1, 1].forEach((a) => [-1, 1].forEach((b) => T.add('x', cyl(10), 0xffffff, a * 0.35, 0, b * 0.35, 0, 0, 0, 0.04, 1.8, 0.04)));
  for (let i = 1; i < 5; i++) T.box('x', 0xffffff, 0, i * 0.38, 0.38, 0.7, 0.04, 0.08, 0.01); T.box('g', 0x1d4ed8, 0, 1.8, 0, 0.9, 0.1, 0.9, 0.04); T.box('g', 0x1d4ed8, 0, 1.9, -0.4, 0.9, 0.7, 0.1, 0.04); T.box('g', 0xffffff, 0, 2.3, 0.42, 0.9, 0.06, 0.12, 0.02);
  T.add('m', rbox(0.4, 0.3, 0.02, 0.01, 1), 0x1f2937, 0.25, 2.36, 0.46, -0.6, 0, 0); T.solid(-0.45, 0, -0.45, 0.45, 2.0, 0.45); }
export function scoreFrame(w, x, y, z, ry, W = 5, H = 2.8) { const T = w.tf(x, y, z, ry); T.box('x', 0x111827, 0, 0, 0, W + 0.4, H + 0.4, 0.4, 0.1); T.box('g', 0x1e3a8a, 0, H + 0.4, 0, W + 0.6, 0.5, 0.45, 0.1);
  [-1, 1].forEach((s) => T.add('x', cyl(12), 0x475569, s * (W / 2 - 0.4), -y, 0, 0, 0, 0, 0.14, y, 0.14)); }
