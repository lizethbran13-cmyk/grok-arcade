// Holiday building shapes: every house gets a new themed silhouette (roof, towers, trim) on top of its walk-in interior.
import * as K from './kit.js?v=np10';
const H = false, PI = Math.PI;
const { rbox, rcyl, cyl, cone, sph, torus } = K;
const GINGER = ['bakery', 'sweets', 'icecream', 'shellshop', 'pottery', 'cafe', 'cinema', 'music', 'toys'];
const COTTAGE = ['burrow', 'shelby', 'school', 'inn', 'post', 'club', 'library', 'fossil'];
const CROOKED = ['burrow', 'shelby', 'school', 'bakery', 'music', 'toys', 'shellshop', 'pottery', 'sweets', 'icecream', 'cafe', 'inn', 'post', 'library', 'cinema', 'fossil', 'club'];
const hsh = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7) >>> 0;
export function restyle(B) { const id = B.id, h = hsh(id);
  if (!H) {
    if (GINGER.includes(id)) return Object.assign(B, { style: 'gable', ext: 0xb5651d, base: 0x7c3f12, roofCol: 0xf8fafc, trim: 0xffffff, frame: 0xffffff, shutters: [0xef4444, 0x16a34a][h % 2], roofH: Math.min(B.x1 - B.x0, B.z1 - B.z0) * 0.55, band: 0xffffff, _kind: 'ginger' });
    if (COTTAGE.includes(id)) return Object.assign(B, { style: 'gable', ext: [0x2e7d32, 0xc62828, 0x1d4ed8][h % 3], base: 0x7c2d12, roofCol: 0xf1f5f9, trim: 0xfef3c7, frame: 0xfef3c7, shutters: 0xfacc15, roofH: Math.min(B.x1 - B.x0, B.z1 - B.z0) * 0.7, _kind: 'cottage' });
    if (id === 'obs') return Object.assign(B, { style: 'flat', ext: 0xdbeafe, base: 0x93c5fd, trim: 0xffffff, frame: 0xe0f2fe, shutters: 0x60a5fa, band: 0x93c5fd, _kind: 'ice' });
    if (id === 'tortuga') return Object.assign(B, { style: 'flat', ext: 0xb91c1c, base: 0x7f1d1d, trim: 0xfacc15, frame: 0xffffff, band: 0x16a34a, _kind: 'workshop' });
    if (id === 'hall') return Object.assign(B, { ext: 0xc62828, trim: 0xfacc15, domeCol: 0xfacc15, _kind: 'santa' });
  } else {
    if (id === 'hall') return Object.assign(B, { style: 'flat', ext: 0x3b3355, base: 0x1f1b2e, trim: 0x9ca3af, frame: 0x6b7280, shutters: 0x1f2937, band: 0x581c87, _kind: 'manor' });
    if (id === 'tortuga') return Object.assign(B, { style: 'flat', ext: 0x334155, base: 0x1e293b, trim: 0x22c55e, frame: 0x94a3b8, band: 0x22c55e, _kind: 'lab' });
    if (CROOKED.includes(id)) return Object.assign(B, { style: 'gable', ext: [0x4b3b5c, 0x3f3f46, 0x57534e, 0x44403c][h % 4], base: 0x1c1917, roofCol: [0x1f1b2e, 0x292524][h % 2], trim: 0x78716c, frame: 0x57534e, shutters: 0x292524, roofH: Math.min(B.x1 - B.x0, B.z1 - B.z0) * 0.85, noPots: true, _kind: 'crooked' });
  }
  return B; }
export function facade(w, B) { const k = B._kind; if (!k) return; const keep = w.region; w.region = 'shell';
  let dp = null; if (B.door) { const d = B.door, m = (d.a + d.b) / 2; dp = d.side === 's' ? [m, B.z1] : d.side === 'n' ? [m, B.z0] : d.side === 'e' ? [B.x1, m] : [B.x0, m]; }
  const so = w.solid; w.solid = function (x0, y0, z0, x1, y1, z1, o) { if (dp) { const dx = Math.max(x0 - dp[0], 0, dp[0] - x1), dz = Math.max(z0 - dp[1], 0, dp[1] - z1); if (Math.hypot(dx, dz) < 3.2) return null; } return so.call(w, x0, y0, z0, x1, y1, z1, o); };
  const { x0, z0, x1, z1 } = B, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, W = x1 - x0, D = z1 - z0, eh = B.wallH || B.ceil + 0.4, rH = B.roofH || 0, h = hsh(B.id);
  const corners = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]];
  const doorSide = B.door && B.door.side; const front = (x, z) => doorSide === 's' ? z > cz : doorSide === 'n' ? z < cz : doorSide === 'e' ? x > cx : x < cx;
  const tower = (x, z, r, ht, wall, roof, roofH, tilt = 0, bucket = 'm') => { w.add(bucket, cyl(24), wall, x, 0, z, tilt, 0, tilt * 0.6, r, ht, r); w.add('m', rcyl(r * 1.15, 0.35, 0.08, 24), shadeK(wall), x, ht - 0.1, z); w.add(bucket === 'l' ? 'l' : 'g', cone(24), roof, x + Math.sin(tilt * 0.6) * ht * 0.1, ht + 0.2, z - Math.sin(tilt) * ht * 0.1, tilt * 1.6, 0, tilt, r * 1.25, roofH, r * 1.25); w.solid(x - r, 0, z - r, x + r, ht, z + r); };
  if (k === 'ginger') { // icing drips along the eaves, gumdrops on the ridge, candy-cane posts, peppermint wall discs
    const alongX = W >= D; const L = (alongX ? W : D) + 0.5;
    for (let s of [-1, 1]) for (let i = 0; i <= L / 0.7; i++) { const p = -L / 2 + i * 0.7; const x = alongX ? cx + p : cx + s * (W / 2 + 0.45), z = alongX ? cz + s * (D / 2 + 0.45) : cz + p; w.add('g', sph(8), 0xffffff, x, eh - 0.05, z, 0, 0, 0, 0.22, 0.32, 0.22); }
    for (let i = 0; i < 6; i++) { const p = -L / 2 + 0.6 + i * (L - 1.2) / 5; w.add('g', sph(12), [0xef4444, 0x22c55e, 0xfacc15, 0xa855f7][i % 4], alongX ? cx + p : cx, eh + rH + 0.15, alongX ? cz : cz + p, 0, 0, 0, 0.35, 0.3, 0.35); }
    corners.filter(([x, z]) => front(x, z)).forEach(([x, z]) => { for (let j = 0; j < 8; j++) w.add('g', cyl(12), j % 2 ? 0xffffff : 0xdc2626, x, j * eh / 8, z, 0, 0, 0, 0.28, eh / 8, 0.28); w.add('g', torus(0.28, 16, PI), 0xdc2626, x + 0.5, eh + 0.05, z, 0, 0, 0, 0.5, 0.5, 0.5); w.solid(x - 0.3, 0, z - 0.3, x + 0.3, eh, z + 0.3); });
    corners.filter(([x, z]) => !front(x, z)).forEach(([x, z], i) => { w.add('m', rcyl(0.7, 3.2, 0.1, 16), 0xb5651d, x, 0, z); w.add('g', sph(10), 0xffffff, x, 3.25, z, 0, 0, 0, 0.75, 0.25, 0.75); }); }
  if (k === 'cottage') { // tall snowy chimney, round wreath over the door, string of bulbs along the eaves
    const chx = cx + (h % 2 ? W : -W) * 0.28, chz = cz + ((h >> 1) % 2 ? D : -D) * 0.2; w.add('m', rbox(1.1, eh + rH * 0.9, 1.1, 0.08), 0x9a3f2a, chx, (eh + rH * 0.9) / 2, chz); w.add('g', rbox(1.4, 0.3, 1.4, 0.1), 0xffffff, chx, eh + rH * 0.9 + 0.1, chz);
    for (let i = 0; i < 3; i++) w.add('g', sph(10), 0xe5e7eb, chx + i * 0.3, eh + rH * 0.9 + 0.8 + i * 0.7, chz, 0, 0, 0, 0.35 + i * 0.12);
    const alongX = W >= D, L = (alongX ? W : D); for (let s of [-1, 1]) for (let i = 0; i <= L / 1.1; i++) { const p = -L / 2 + i * 1.1, x = alongX ? cx + p : cx + s * (W / 2 + 0.5), z = alongX ? cz + s * (D / 2 + 0.5) : cz + p; w.add('l', sph(8), [0xff3b3b, 0x4ade80, 0xfacc15, 0x60a5fa][i % 4], x, eh - 0.25, z, 0, 0, 0, 0.12, 0.16, 0.12, 1.2); } }
  if (k === 'ice') { // ice palace: four corner towers with spires, a tall central spire, icicles
    corners.forEach(([x, z], i) => tower(x, z, 1.5, eh + 3 + (i % 2) * 1.5, 0xe0f2fe, 0x93c5fd, 3.4, 0, 'g'));
    w.add('g', cyl(24), 0xdbeafe, cx, eh, cz, 0, 0, 0, 2.2, 4.0, 2.2); w.add('g', cone(24), 0x60a5fa, cx, eh + 4, cz, 0, 0, 0, 2.6, 5.5, 2.6); w.add('l', sph(12), 0x7dd3fc, cx, eh + 9.8, cz, 0, 0, 0, 0.5, 0.5, 0.5, 1.4);
    for (let i = 0; i < 18; i++) { const t = i / 17; const x = x0 + t * W; [z0 - 0.4, z1 + 0.4].forEach((z) => w.add('g', cone(8), 0xe0f2fe, x, eh - 0.9 - (i % 3) * 0.3, z, PI, 0, 0, 0.14, 0.9 + (i % 3) * 0.3, 0.14)); } }
  if (k === 'workshop') { // toy-workshop complex: striped towers, a giant clock, gears, smokestacks, toy soldiers at the door, side halls
    [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].forEach(([x, z], i) => { tower(x, z, 2.0, eh + 4, i % 2 ? 0xffffff : 0xdc2626, 0x16a34a, 4.0); for (let j = 1; j < 4; j++) w.add('g', torus(0.08, 24), i % 2 ? 0xdc2626 : 0xffffff, x, j * (eh + 4) / 4, z, PI / 2, 0, 0, 2.05, 2.05, 1); w.add('x', sph(12), 0xfacc15, x, eh + 8.4, z, 0, 0, 0, 0.45); });
    const fz = doorSide === 'n' ? z0 - 0.4 : z1 + 0.4, fs = doorSide === 'n' ? -1 : 1;
    w.add('m', rcyl(2.2, 0.3, 0.06, 32), 0xfef3c7, cx, eh + 2.2, fz, PI / 2, 0, 0); w.add('x', rbox(0.15, 1.6, 0.1, 0.03), 0x111827, cx, eh + 2.8, fz + fs * 0.25); w.add('x', rbox(1.2, 0.15, 0.1, 0.03), 0x111827, cx + 0.5, eh + 2.2, fz + fs * 0.25);
    w.add('m', rbox(6, 4.6, 0.4, 0.1), 0xb91c1c, cx, eh + 2.3, fz - fs * 0.1);
    [-1, 1].forEach((s) => { w.add('x', torus(0.3, 32), 0xfacc15, cx + s * 6.5, eh - 1.4, fz, 0, 0, 0, 1.3, 1.3, 1); for (let j = 0; j < 8; j++) { const a = j / 8 * PI * 2; w.add('x', rbox(0.5, 0.5, 0.3, 0.05), 0xfacc15, cx + s * 6.5 + Math.cos(a) * 1.75, eh - 1.4 + Math.sin(a) * 1.75, fz, 0, 0, a); } });
    [[x0 + W * 0.3, cz], [x0 + W * 0.7, cz - D * 0.2]].forEach(([x, z]) => { w.add('m', cyl(16), 0x7f1d1d, x, eh, z, 0, 0, 0, 0.9, 6, 0.9); for (let i = 0; i < 3; i++) w.add('g', sph(10), 0xf1f5f9, x + i * 0.4, eh + 6.8 + i * 0.9, z, 0, 0, 0, 0.6 + i * 0.2); });
    if (B.door) { const d = B.door, c = (d.a + d.b) / 2; [-1, 1].forEach((s) => { const x = doorSide === 'n' || doorSide === 's' ? c + s * ((d.b - d.a) / 2 + 2.2) : (doorSide === 'e' ? x1 + 1.2 : x0 - 1.2), z = doorSide === 'n' ? z0 - 1.6 : doorSide === 's' ? z1 + 1.6 : c + s * 3; w.add('m', rbox(0.9, 0.3, 0.9, 0.05), 0x1f2937, x, 0.15, z); w.add('m', cyl(12), 0x1d4ed8, x, 0.3, z, 0, 0, 0, 0.32, 1.3, 0.32); w.add('g', sph(12), 0xfcd9b6, x, 1.9, z, 0, 0, 0, 0.32); w.add('m', cyl(12), 0x111827, x, 2.15, z, 0, 0, 0, 0.3, 0.9, 0.3); w.add('m', rbox(0.7, 0.12, 0.2, 0.04), 0xdc2626, x, 1.3, z); w.solid(x - 0.45, 0, z - 0.45, x + 0.45, 3, z + 0.45); }); } }
  if (k === 'santa') { const fz = doorSide === 'n' ? z0 - 0.35 : z1 + 0.35; w.add('g', torus(0.35, 32), 0x166534, cx, eh - 0.9, fz, 0, 0, 0, 1.0, 1.0, 1); w.add('g', sph(10), 0xdc2626, cx, eh - 1.8, fz, 0, 0, 0, 0.25); }
  if (k === 'crooked') { // leaning turret, crooked chimney, boarded planks, a sagging second gable
    const back = corners.filter(([x, z]) => !front(x, z)); const [tx, tz] = back[h % back.length];
    tower(tx, tz, 1.4, eh + rH * 0.6 + 1.5, shadeK(B.ext), 0x1f1b2e, 3.2, (h % 2 ? 1 : -1) * 0.12);
    w.add('l', rbox(0.5, 0.7, 0.05, 0.02), 0xfacc15, tx, eh + 0.6, tz + (tz > cz ? 1.42 : -1.42), 0, 0, 0, 1, 1, 1, 0.8);
    const chx = cx + (h % 3 - 1) * W * 0.25, chz = cz; w.add('m', rbox(0.9, rH + 2.5, 0.9, 0.06), 0x44403c, chx, eh + (rH + 2.5) / 2 - 0.5, chz, 0, 0, (h % 2 ? 0.18 : -0.18));
    const alongX = W >= D; for (let i = 0; i < 4; i++) { const p = (i - 1.5) * (alongX ? W : D) * 0.22, x = alongX ? cx + p : (front(x1, cz) ? x0 - 0.2 : x1 + 0.2), z = alongX ? (front(cx, z1) ? z0 - 0.2 : z1 + 0.2) : cz + p; w.add('m', rbox(alongX ? 1.8 : 0.08, 0.22, alongX ? 0.08 : 1.8, 0.02), 0x78350f, x, 2.2, z, 0, 0, alongX ? (i % 2 ? 0.35 : -0.3) : 0); w.add('m', rbox(alongX ? 1.8 : 0.08, 0.22, alongX ? 0.08 : 1.8, 0.02), 0x78350f, x, 1.7, z, alongX ? 0 : (i % 2 ? 0.3 : -0.3), 0, alongX ? (i % 2 ? -0.25 : 0.3) : 0); }
    { const T = w.tf(cx + (alongX ? W * 0.18 : 0), eh + rH * 0.35, cz + (alongX ? 0 : D * 0.18), alongX ? 0 : PI / 2); T.add('m', rbox(Math.min(W, D) * 0.5, 0.25, Math.min(W, D) * 0.55, 0.06), B.roofCol, 0, rH * 0.45, 0, 0.5, 0, 0.12); T.add('m', rbox(Math.min(W, D) * 0.5, 0.25, Math.min(W, D) * 0.55, 0.06), B.roofCol, 0, rH * 0.45, -Math.min(W, D) * 0.3, -0.5, 0, -0.1); } }
  if (k === 'manor') { // spooky manor: twin front towers with needle spires, a tall central gable, glowing windows, iron spikes
    corners.forEach(([x, z]) => tower(x, z, front(x, z) ? 2.0 : 1.5, eh + (front(x, z) ? 6 : 3.5), 0x2e2640, 0x111827, front(x, z) ? 6 : 4));
    corners.filter(([x, z]) => front(x, z)).forEach(([x, z]) => { for (let j = 0; j < 3; j++) w.add('l', rbox(0.5, 0.9, 0.05, 0.02), 0xfacc15, x, 2.6 + j * 2.4, z + (z > cz ? 2.02 : -2.02), 0, 0, 0, 1, 1, 1, 0.9); });
    w.add('m', rbox(W * 0.5, 4.5, 1.0, 0.1), 0x2e2640, cx, eh + 2.25, (doorSide === 'n' ? z0 + 0.3 : z1 - 0.3)); w.add('g', cone(4), 0x111827, cx, eh + 4.5, (doorSide === 'n' ? z0 + 0.3 : z1 - 0.3), 0, PI / 4, 0, W * 0.36, 3.5, 0.9);
    w.add('l', rcyl(0.9, 0.08, 0.02, 24), 0xa855f7, cx, eh + 3.0, (doorSide === 'n' ? z0 - 0.25 : z1 + 0.25), PI / 2, 0, 0, 1, 1, 1, 1.0);
    for (let i = 0; i < 14; i++) { const x = x0 + (i + 0.5) * W / 14; [z0 - 0.5, z1 + 0.5].forEach((z) => w.add('x', cone(6), 0x111827, x, eh + 0.4, z, 0, 0, 0, 0.1, 0.8, 0.1)); } }
  if (k === 'lab') { // mad-science lab: glowing glass dome, twin tesla coils, bubbling vats, crooked pipes, a lightning rod
    w.add('m', rcyl(Math.min(W, D) * 0.34, 1.0, 0.1, 40), 0x1e293b, cx, eh, cz); w.add('l', sph(28), 0x4ade80, cx, eh + 1.0, cz, 0, 0, 0, Math.min(W, D) * 0.3, Math.min(W, D) * 0.22, Math.min(W, D) * 0.3, 0.35);
    for (let i = 0; i < 6; i++) w.add('x', torus(0.05, 40, PI), 0x94a3b8, cx, eh + 1.0, cz, 0, i / 6 * PI, 0, Math.min(W, D) * 0.305, Math.min(W, D) * 0.225, 1);
    w.add('x', cyl(8), 0x94a3b8, cx, eh + 1 + Math.min(W, D) * 0.22, cz, 0, 0, 0, 0.08, 4, 0.08); w.add('l', sph(10), 0xfef08a, cx, eh + 5.2 + Math.min(W, D) * 0.22, cz, 0, 0, 0, 0.3, 0.3, 0.3, 1.6);
    corners.filter(([x, z]) => front(x, z)).forEach(([x, z]) => { w.add('x', cyl(16), 0x475569, x, 0, z, 0, 0, 0, 0.9, 1.2, 0.9); for (let j = 0; j < 7; j++) w.add('x', torus(0.12, 24), 0xb45309, x, 1.6 + j * 0.55, z, PI / 2, 0, 0, 0.75 - j * 0.06, 0.75 - j * 0.06, 1); w.add('x', cyl(10), 0x94a3b8, x, 1.2, z, 0, 0, 0, 0.25, 4.2, 0.25); w.add('l', sph(16), 0xa5f3fc, x, 5.9, z, 0, 0, 0, 0.75, 0.75, 0.75, 1.5); w.solid(x - 1, 0, z - 1, x + 1, 6.5, z + 1); });
    corners.filter(([x, z]) => !front(x, z)).forEach(([x, z], i) => { w.add('m', cyl(20), 0x334155, x, 0, z, 0, 0, 0, 1.6, 3.2, 1.6); w.add('l', rcyl(1.4, 0.1, 0.03, 20), 0x84cc16, x, 3.1, z, 0, 0, 0, 1, 1, 1, 0.9); for (let j = 0; j < 3; j++) w.add('l', sph(8), 0xbef264, x + (j - 1) * 0.5, 3.3 + j * 0.3, z, 0, 0, 0, 0.2, 0.2, 0.2, 1.2); w.add('x', cyl(10), 0x64748b, x, 3.2, z, 0, 0, i ? 0.9 : -0.9, 0.2, 5, 0.2); w.solid(x - 1.6, 0, z - 1.6, x + 1.6, 3.2, z + 1.6); }); }
  w.solid = so; w.region = keep; }
function shadeK(c) { const r = ((c >> 16) & 255) * 0.8, g = ((c >> 8) & 255) * 0.8, b = (c & 255) * 0.8; return (r << 16) | (g << 8) | b; }
