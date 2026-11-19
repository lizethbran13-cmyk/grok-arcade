// One builder per architecture. Every building in the village picks its own style + palette + details, so no two look alike.
import { G } from './vworld.js';
import * as K from './kit2.js';
const PI = Math.PI;
const SNOW = 0xf4f8ff;
// o: { x, z, ry, W, D, H, col, roof, trim, sign, signBg, signFg, style, door, win, shutter }
export function building(w, o) { const T = w.tf(o.x, 0, o.z, o.ry || 0); const f = STYLES[o.style] || STYLES.timber; const W = o.W, D = o.D;
  f(w, T, o); // walls + roof + details
  // collider for the shell (plus a little porch step zone)
  w.solidR(o.x, 0, o.z, W, o.H + 2, D, o.ry || 0);
  const dp = T.P(o.doorX || 0, 0, D / 2 + 0.9), ex = T.P(o.doorX || 0, 0, D / 2 + 3.2);
  o.door = { x: dp[0], z: dp[1] !== undefined ? dp[2] : dp[2], ex: ex[0], ez: ex[2], yaw: o.ry || 0 };
  w.zone('door', dp[0] - 1.6, -1, dp[2] - 1.6, dp[0] + 1.6, 3, dp[2] + 1.6, { place: o });
  return o; }
const signOn = (w, T, o, y, wdt = Math.min(o.W * 0.8, 9)) => K.sign(w, T, o.sign, 0, y, o.D / 2 + 0.14, wdt, Math.max(0.7, wdt / 9 * 1.1), o.signBg || '#7f1d1d', o.signFg || '#fff7e0');
const winRow = (T, o, y, n, lz, opt) => { const W = o.W; for (let i = 0; i < n; i++) { const lx = -W / 2 + (i + 0.5) * W / n; if (Math.abs(lx - (o.doorX || 0)) < 1.8 && lz > 0 && y < 3) continue; K.windowL(T, lx, y, lz, opt && opt.w || 1.1, opt && opt.h || 1.3, opt); } };
const sideWins = (T, o, y, n, opt) => { for (const s of [-1, 1]) for (let i = 0; i < n; i++) { const lz = -o.D / 2 + (i + 0.5) * o.D / n; const sub = { P: (lx, ly, z) => T.P(s * (o.W / 2) + 0.0, ly, lz - lx * s), ry: T.ry + s * PI / 2 };
      // window on a side wall: build in a rotated local frame
      const p = T.P(s * o.W / 2, 0, lz); const T2 = w_.tf(p[0], 0, p[2], T.ry + s * PI / 2); K.windowL(T2, 0, y, 0.0, opt && opt.w || 1.0, opt && opt.h || 1.2, opt); } };
let w_ = null;
export const STYLES = {
  // log cabin / lodge: banded log walls, deep snowy gable roof, stone chimney, porch with posts
  log(w, T, o) { w_ = w; const { W, D, H } = o; K.walls(w, T, W, H, D, o.col || 0x8b5a2b, 'log'); T.box('m', 0x57534e, 0, 0, 0, W + 0.3, 0.5, D + 0.3);
    K.gable(T, o.roof || 0x5b3a21, H, W, o.rise || W * 0.42, D); K.chimney(T, W * 0.28, -D * 0.2, H, W * 0.42 + 1.2, 0x78716c);
    if (o.porch !== false) { T.box('m', 0x6b4423, 0, 0, D / 2 + 1.3, W * 0.8, 0.3, 2.6); T.box('m', o.roof || 0x5b3a21, 0, H - 0.4, D / 2 + 1.4, W * 0.84, 0.25, 2.8); T.box('m', SNOW, 0, H - 0.15, D / 2 + 1.4, W * 0.84, 0.12, 2.8);
      for (const s of [-1, 1]) T.box('m', 0x6b4423, s * W * 0.38, 0.3, D / 2 + 2.5, 0.25, H - 0.7, 0.25); }
    K.doorL(w, T, o.doorX || 0, D / 2, 1.6, 2.5, o.doorCol || 0x7f1d1d); winRow(T, o, 1.3, o.win || 3, D / 2 + 0.05, { shutter: o.shutter || 0x166534 }); sideWins(T, o, 1.3, 2, {});
    if (o.H > 5.5) winRow(T, o, H - 2.0, o.win || 3, D / 2 + 0.05, { shutter: o.shutter || 0x166534, h: 1.0 });
    signOn(w, T, o, H - 0.15); },
  // half-timbered shop: plaster + dark beams, steep front gable, display windows, striped awning
  timber(w, T, o) { w_ = w; const { W, D, H } = o; K.walls(w, T, W, H, D, o.col || 0xfff1d6, 'plain'); T.box('m', 0x57534e, 0, 0, 0, W + 0.2, 0.6, D + 0.2);
    const beam = o.trim || 0x3b2414; for (let i = 0; i <= 4; i++) T.box('m', beam, -W / 2 + i * W / 4, 0.6, D / 2 + 0.03, 0.22, H - 0.6, 0.08); T.box('m', beam, 0, H * 0.55, D / 2 + 0.03, W, 0.22, 0.08); T.box('m', beam, 0, H - 0.2, D / 2 + 0.03, W, 0.22, 0.08);
    for (let i = 0; i < 4; i++) T.add('m', G.box(), beam, -W / 2 + (i + 0.5) * W / 4, H * 0.55 + 0.1, D / 2 + 0.03, 0, 0, (i % 2 ? 1 : -1) * 0.7, 0.16, (H * 0.45) * 1.2, 0.07);
    K.gableX(T, o.roof || 0x7f1d1d, H, W, o.rise || W * 0.55, D); T.box('m', o.col || 0xfff1d6, 0, H, D / 2 - 0.02, 0.01, 0.01, 0.01);
    // display windows + awning
    for (const s of [-1, 1]) { T.box('m', beam, s * W * 0.3, 0.6, D / 2 + 0.05, W * 0.26, 2.1, 0.12); T.box('l', 0xffe2a8, s * W * 0.3, 0.75, D / 2 + 0.1, W * 0.23, 1.8, 0.06, 0, 0.3); }
    const aw = o.awning || [0xdc2626, 0xffffff]; for (let i = 0; i < 10; i++) T.add('f', G.box(), aw[i % 2], -W * 0.45 + (i + 0.5) * W * 0.09, 3.05, D / 2 + 0.75, 0.45, 0, 0, W * 0.09, 0.08, 1.5);
    K.doorL(w, T, o.doorX || 0, D / 2, 1.5, 2.4, o.doorCol || 0x14532d); winRow(T, o, H * 0.55 + 1.2, 3, D / 2 + 0.05, { shutter: o.shutter, h: 1.0, w: 0.9 }); sideWins(T, o, 1.6, 2, {});
    signOn(w, T, o, 3.65, Math.min(W * 0.7, 8)); },
  // red/brown brick civic building: flat roof with parapet, columns, tall windows (bank, post office, university)
  brick(w, T, o) { w_ = w; const { W, D, H } = o; K.walls(w, T, W, H, D, o.col || 0xa33a2a, 'brick'); T.box('m', o.trim || 0xf5efe0, 0, 0, 0, W + 0.4, 0.7, D + 0.4);
    T.box('m', o.trim || 0xf5efe0, 0, H, 0, W + 0.5, 0.45, D + 0.5); T.box('m', o.col || 0xa33a2a, 0, H + 0.45, D / 2, W + 0.5, 0.9, 0.4); T.box('m', SNOW, 0, H + 0.45, 0, W + 0.3, 0.2, D + 0.3);
    if (o.pediment) { T.add('m', G.prism(), o.trim || 0xf5efe0, 0, H + 0.45, D / 2 + 0.6, 0, PI / 2, 0, 0.9, 2.2, W * 0.55); for (const s of [-1, -0.33, 0.33, 1]) T.add('m', G.cyl(12), o.trim || 0xf5efe0, s * W * 0.25, 0.7, D / 2 + 1.0, 0, 0, 0, 0.35, H - 0.25, 0.35); T.box('m', o.trim || 0xf5efe0, 0, H - 0.1, D / 2 + 1.0, W * 0.58, 0.55, 1.2); }
    if (o.clock) { T.add('m', G.cyl(20), 0xf5efe0, 0, H + 2.4, D / 2 + 0.25, PI / 2, 0, 0, 1.1, 0.2, 1.1); T.add('m', G.cyl(20), 0x1c1917, 0, H + 2.4, D / 2 + 0.3, PI / 2, 0, 0, 0.95, 0.18, 0.95); T.add('m', G.cyl(20), 0xfef3c7, 0, H + 2.4, D / 2 + 0.33, PI / 2, 0, 0, 0.88, 0.18, 0.88); T.box('m', 0x111111, 0, H + 2.4, D / 2 + 0.5, 0.08, 0.7, 0.04); T.box('m', 0x111111, 0.25, H + 2.4, D / 2 + 0.5, 0.5, 0.07, 0.04); T.box('m', o.col || 0xa33a2a, 0, H + 0.45, D / 2 + 0.1, 3, 3.2, 0.3); }
    K.doorL(w, T, o.doorX || 0, D / 2, 2.0, 2.9, o.doorCol || 0x1e3a8a, { frame: o.trim }); winRow(T, o, 1.5, o.win || 4, D / 2 + 0.05, { arch: true, frame: o.trim || 0xf5efe0, h: 1.8 }); if (H > 6) winRow(T, o, 4.6, o.win || 4, D / 2 + 0.05, { frame: o.trim || 0xf5efe0, h: 1.4 }); sideWins(T, o, 1.6, 3, { frame: o.trim || 0xf5efe0, h: 1.6 });
    signOn(w, T, o, o.pediment ? H + 0.25 : H - 0.55); },
  // tall narrow gingerbread-style house: candy trim, scalloped roof, gumdrops (bakery, sweets)
  ginger(w, T, o) { w_ = w; const { W, D, H } = o; K.walls(w, T, W, H, D, o.col || 0xb5651d, 'plain'); T.box('m', 0xffffff, 0, H - 0.3, D / 2 + 0.05, W + 0.1, 0.3, 0.1);
    for (let i = 0; i < 12; i++) T.add('m', G.sph(8), 0xffffff, -W / 2 + (i + 0.5) * W / 12, H - 0.3, D / 2 + 0.1, 0, 0, 0, W / 24, 0.22, 0.1);
    K.gableX(T, o.roof || 0xfde68a, H, W, W * 0.6, D); for (let i = 0; i < 7; i++) T.add('g', G.hemi(8), [0xdc2626, 0x16a34a, 0xf5c542, 0xdb2777][i % 4], -W * 0.4 + i * W * 0.8 / 6, H + 0.2 + (i < 4 ? i : 6 - i) * W * 0.6 / 4 * 0.6, D / 2 + 0.5, 0, 0, 0, 0.32, 0.32, 0.32);
    for (const s of [-1, 1]) K.candyCane(w, T.P(s * (W / 2 + 0.4), 0, D / 2 + 0.6)[0], T.P(s * (W / 2 + 0.4), 0, D / 2 + 0.6)[2], 2.8, 0);
    K.doorL(w, T, o.doorX || 0, D / 2, 1.5, 2.4, 0xdb2777, { frame: 0xffffff }); winRow(T, o, 1.4, 2, D / 2 + 0.05, { frame: 0xffffff, shutter: 0x16a34a }); winRow(T, o, H - 1.9, 3, D / 2 + 0.05, { frame: 0xffffff, h: 0.9, w: 0.8 }); sideWins(T, o, 1.5, 2, { frame: 0xffffff });
    signOn(w, T, o, 3.4, Math.min(W * 0.75, 7)); },
  // grey stone with slate roof and round tower (security, state dept, logistics)
  stone(w, T, o) { w_ = w; const { W, D, H } = o; K.walls(w, T, W, H, D, o.col || 0x8b8f96, 'stone'); K.gable(T, o.roof || 0x334155, H, W, W * 0.35, D, true, 0.4);
    if (o.tower) { const tx = W / 2 - 0.4, tz = D / 2 - 0.4; T.add('m', G.cyl(12), o.col || 0x8b8f96, tx, 0, tz, 0, 0, 0, 1.8, H + 3, 1.8); T.add('m', G.cone(12), o.roof || 0x334155, tx, H + 3, tz, 0, 0, 0, 2.1, 3.2, 2.1); T.add('m', G.cone(12), SNOW, tx, H + 4.3, tz, 0, 0, 0, 1.2, 1.9, 1.2); K.windowL(T, tx, H + 1, tz + 1.82, 0.6, 0.9, { arch: true }); }
    K.doorL(w, T, o.doorX || 0, D / 2, 1.8, 2.7, o.doorCol || 0x1f2937, { frame: 0xd6d3d1 }); winRow(T, o, 1.6, o.win || 3, D / 2 + 0.05, { frame: 0xd6d3d1, arch: true }); sideWins(T, o, 1.6, 2, { frame: 0xd6d3d1 });
    if (o.flags) for (const s of [-1, 1]) { const p = T.P(s * (W / 2 + 1.2), 0, D / 2 + 1.5); w.add('x', G.cyl(6), 0xd1d5db, p[0], 0, p[2], 0, 0, 0, 0.06, 6, 0.06); w.add('f', G.box(), o.flags[s < 0 ? 0 : 1], p[0] + 0.6, 4.6, p[2], 0, T.ry, 0, 1.2, 0.8, 0.04); }
    signOn(w, T, o, H - 0.6); },
  // gambrel barn: two-pitch roof, X doors, hay loft
  barn(w, T, o) { w_ = w; const { W, D, H } = o; K.walls(w, T, W, H, D, o.col || 0x9b2c2c, 'board'); const rc = o.roof || 0x3f3f46;
    T.add('m', G.box(), rc, -W * 0.34, H + 0.9, 0, 0, 0, 0.95, W * 0.42, 0.25, D + 1); T.add('m', G.box(), rc, W * 0.34, H + 0.9, 0, 0, 0, -0.95, W * 0.42, 0.25, D + 1);
    T.add('m', G.box(), rc, -W * 0.14, H + 2.6, 0, 0, 0, 0.35, W * 0.34, 0.25, D + 1); T.add('m', G.box(), rc, W * 0.14, H + 2.6, 0, 0, 0, -0.35, W * 0.34, 0.25, D + 1);
    T.add('m', G.box(), SNOW, -W * 0.14, H + 2.8, 0, 0, 0, 0.35, W * 0.3, 0.12, D + 1.04); T.add('m', G.box(), SNOW, W * 0.14, H + 2.8, 0, 0, 0, -0.35, W * 0.3, 0.12, D + 1.04);
    // front gambrel infill
    T.add('m', G.prism(), o.col || 0x9b2c2c, 0, H, D / 2 - 0.2, 0, 0, 0, W * 0.98, 2.6, 0.4); T.add('m', G.prism(), o.col || 0x9b2c2c, 0, H, -D / 2 + 0.2, 0, 0, 0, W * 0.98, 2.6, 0.4);
    const dw = Math.min(5, W * 0.4); T.box('m', 0xffffff, 0, 0, D / 2 + 0.05, dw + 0.4, 3.9, 0.1); T.box('m', o.col2 || 0x7f1d1d, 0, 0, D / 2 + 0.1, dw, 3.6, 0.1);
    T.add('m', G.box(), 0xffffff, 0, 1.8, D / 2 + 0.17, 0, 0, 0.62, 0.18, 4.2, 0.05); T.add('m', G.box(), 0xffffff, 0, 1.8, D / 2 + 0.17, 0, 0, -0.62, 0.18, 4.2, 0.05);
    T.box('m', 0xffffff, 0, H + 0.4, D / 2 + 0.05, 1.8, 1.6, 0.1); T.box('m', 0x3b2414, 0, H + 0.5, D / 2 + 0.1, 1.4, 1.3, 0.1); sideWins(T, o, 2.0, 3, { frame: 0xffffff });
    if (o.cupola) { T.box('m', 0xffffff, 0, H + 3.0, 0, 1.6, 1.4, 1.6); T.add('m', G.cone(4), rc, 0, H + 4.4, 0, 0, PI / 4, 0, 1.4, 1.2, 1.4); T.add('x', G.cyl(4), 0xf5c542, 0, H + 5.6, 0, 0, 0, 0, 0.03, 0.9, 0.03); }
        signOn(w, T, o, H - 0.2, Math.min(W * 0.6, 8)); },
  // A-frame (the Claus home): roof down to the ground, huge front glass triangle, stone chimney, wrap porch
  aframe(w, T, o) { w_ = w; const { W, D, H } = o; const rc = o.roof || 0x6b3f1f; T.box('m', 0x57534e, 0, 0, 0, W, 0.6, D);
    T.add('m', G.prism(), rc, 0, 0, 0, 0, 0, 0, W + 1.2, H + 3, D + 0.6); T.add('m', G.prism(), SNOW, 0, (H + 3) * 0.32, 0, 0, 0, 0, (W + 1.2) * 0.7, (H + 3) * 0.7, D + 0.7);
    T.add('m', G.prism(), o.col || 0x8b5a2b, 0, 0.1, D / 2 + 0.25, 0, 0, 0, W - 0.4, H + 2.4, 0.3); // front gable wall
    T.add('l', G.prism(), 0xffd08a, 0, 3.0, D / 2 + 0.45, 0, 0, 0, W * 0.5, (H + 2.4) * 0.48, 0.08, 0.25); for (let i = -2; i <= 2; i++) T.box('m', 0x3b2414, i * W * 0.1, 3.0, D / 2 + 0.5, 0.12, (H + 2.4) * 0.48 * (1 - Math.abs(i) * 0.2), 0.06);
    K.chimney(T, -W * 0.15, -D * 0.1, 0, H + 4.5, 0x78716c); T.box('m', 0x6b4423, 0, 0, D / 2 + 1.8, W + 2, 0.35, 3.2);
    for (const s of [-1, 1]) T.box('m', 0x6b4423, s * (W / 2 + 0.6), 0.35, D / 2 + 3.2, 0.25, 2.8, 0.25); T.box('m', 0x6b4423, 0, 0.9, D / 2 + 3.3, W + 1.4, 0.12, 0.1);
    K.doorL(w, T, o.doorX || 0, D / 2 + 0.4, 1.8, 2.6, 0x991b1b); // side dormers with windows
    for (const s of [-1, 1]) { T.box('m', o.col || 0x8b5a2b, s * W * 0.32, 1.8, D * 0.1, 2.2, 2.2, 3); K.gable(w.tf(...xz(T.P(s * W * 0.32, 0, D * 0.1)), T.ry + s * PI / 2), rc, 4.0, 3, 1.3, 2.2, true, 0.3); }
    signOn(w, T, o, 2.95 + 0.0, 5); },
  // white wooden chapel with steeple and stained-glass windows
  chapel(w, T, o) { w_ = w; const { W, D, H } = o; K.walls(w, T, W, H, D, 0xfafaf9, 'board'); K.gable(T, o.roof || 0x7f1d1d, H, W, W * 0.6, D, true, 0.4);
    const tz = D / 2 - 1.6; T.box('m', 0xfafaf9, 0, 0, tz, 3.2, H + 5, 3.2); T.box('m', o.roof || 0x7f1d1d, 0, H + 5, tz, 3.6, 0.3, 3.6); T.box('m', 0xfafaf9, 0, H + 5.3, tz, 2.4, 2.4, 2.4);
    T.add('m', G.arch(8), 0x1c1917, 0, H + 5.6, tz + 1.21, 0, 0, 0, 1.2, 1.3, 0.04); T.add('m', G.cone(8), o.roof || 0x7f1d1d, 0, H + 7.7, tz, 0, PI / 8, 0, 1.8, 5.5, 1.8); T.add('m', G.cone(8), SNOW, 0, H + 7.7, tz, 0, PI / 8 + 0.2, 0, 1.0, 2.6, 1.0);
    T.box('x', 0xf5c542, 0, H + 13.1, tz, 0.15, 1.4, 0.15); T.box('x', 0xf5c542, 0, H + 13.9, tz, 0.8, 0.15, 0.15);
    K.doorL(w, T, 0, D / 2 + 0.0, 1.8, 2.8, 0x7f1d1d); for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const lz = -D / 2 + 2 + i * (D - 5) / 2; const p = T.P(s * W / 2, 0, lz); const T2 = w.tf(p[0], 0, p[2], T.ry + s * PI / 2); T2.box('m', 0xfafaf9, 0, 1.4, 0, 1.3, 2.4, 0.12); T2.add('l', G.arch(8), [0x60a5fa, 0xf472b6, 0xfacc15][i], 0, 1.5, 0.08, 0, 0, 0, 1.0, 2.6, 0.06, 0.4); }
    K.sign(w, T, o.sign, 0, 0.9, D / 2 + 3.2, 4.2, 0.65, '#fafaf9', '#7f1d1d', { frame: 0x7f1d1d }); },
  // glass greenhouse: metal frame + transparent panes + plants inside visible
  glass(w, T, o) { w_ = w; const { W, D, H } = o; T.box('m', 0xe7e5e4, 0, 0, 0, W, 0.6, D); T.box('e', 0xd9f2ff, 0, 0.6, 0, W, H - 0.6, D); T.add('e', G.prism(), 0xd9f2ff, 0, H, 0, 0, 0, 0, W, W * 0.35, D);
    for (let i = 0; i <= 6; i++) { const lz = -D / 2 + i * D / 6; T.box('x', 0xf8fafc, -W / 2, 0.6, lz, 0.1, H - 0.6, 0.1); T.box('x', 0xf8fafc, W / 2, 0.6, lz, 0.1, H - 0.6, 0.1); T.box('x', 0xf8fafc, 0, H + W * 0.35 - 0.1, lz, 0.1, 0.12, 0.1); }
    T.box('x', 0xf8fafc, 0, H, 0, W + 0.1, 0.1, D + 0.1); for (let i = 0; i < 10; i++) T.add('m', G.sph(8), [0x16a34a, 0x22c55e, 0xf472b6, 0xfacc15, 0xef4444][i % 5], (i % 2 ? 1 : -1) * W * 0.3, 1.1, -D / 2 + 1 + i * (D - 2) / 9, 0, 0, 0, 0.6, 0.5, 0.6);
    T.box('m', 0xe7e5e4, 0, 0, D / 2 + 0.05, 1.8, 2.6, 0.1); T.box('e', 0xbfe3ff, 0, 0.1, D / 2 + 0.1, 1.5, 2.4, 0.06);
    K.sign(w, T, o.sign, 0, 3.4, D / 2 + 0.2, 4, 0.6, '#14532d', '#ecfccb', { frame: 0xf8fafc }); },
  // big domed workshop: brick base, glass dome with golden ribs, giant clock, smokestacks, side wings
  dome(w, T, o) { w_ = w; const { W, D, H } = o; K.walls(w, T, W, H, D, o.col || 0x9a3412, 'brick'); T.box('m', 0xf5efe0, 0, H, 0, W + 0.5, 0.5, D + 0.5); T.box('m', SNOW, 0, H + 0.5, 0, W + 0.2, 0.15, D + 0.2);
    const r = Math.min(W, D) * 0.42; T.add('m', G.cyl(16), 0xf5efe0, 0, H + 0.5, 0, 0, 0, 0, r + 0.4, 1.2, r + 0.4); T.add('e', G.hemi(16), 0xfde68a, 0, H + 1.7, 0, 0, 0, 0, r, r * 0.9, r);
    for (let i = 0; i < 8; i++) T.add('x', G.torus(0.04, 16, PI), 0xf5c542, 0, H + 1.7, 0, 0, i / 8 * PI, 0, r * 1.01, r * 0.91, r * 1.01); T.add('l', G.sph(10), 0xffe08a, 0, H + 1.7 + r * 0.9, 0, 0, 0, 0, 0.6, 0.6, 0.6, 1.2);
    T.add('l', G.sph(12), 0xfff3c4, 0, H + 1.4, 0, 0, 0, 0, r * 0.8, r * 0.7, r * 0.8, 0.15);
    T.add('m', G.cyl(24), 0xf5c542, 0, H - 2.2, D / 2 + 0.1, PI / 2, 0, 0, 2.5, 0.3, 2.5); T.add('m', G.cyl(24), 0xfffbeb, 0, H - 2.2, D / 2 + 0.15, PI / 2, 0, 0, 2.2, 0.3, 2.2); T.box('m', 0x111111, 0, H - 2.2, D / 2 + 0.47, 0.14, 1.6, 0.05); T.box('m', 0x111111, 0.5, H - 2.2, D / 2 + 0.47, 1.0, 0.12, 0.05);
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; T.box('m', 0x111111, Math.cos(a) * 1.9, H - 2.2 + Math.sin(a) * 1.9 - 0.12, D / 2 + 0.47, 0.12, 0.24, 0.04); }
    for (const s of [-1, 1]) { T.box('m', o.col || 0x9a3412, s * (W / 2 + 4), 0, 0, 8, H - 2, D * 0.7); K.gable(w.tf(...xz(T.P(s * (W / 2 + 4), 0, 0)), T.ry), o.roof || 0x1e3a8a, H - 2, 8, 3, D * 0.7); K.chimney(w.tf(...xz(T.P(s * (W / 2 + 4), 0, 0)), T.ry), s * 2, -2, H - 2, 6, 0x57534e);
      const T2 = w.tf(...xz(T.P(s * (W / 2 + 4), 0, D * 0.35)), T.ry); K.windowL(T2, -2, 1.6, 0.05, 1.2, 1.5, { arch: true }); K.windowL(T2, 2, 1.6, 0.05, 1.2, 1.5, { arch: true }); }
    for (const s of [-1, 1]) { const p = T.P(s * (W / 2 + 4), 0, 0); w.solidR(p[0], 0, p[2], 8, H, D * 0.7, T.ry); }
    K.doorL(w, T, 0, D / 2, 3.2, 3.6, 0x7f1d1d, { frame: 0xf5efe0 }); winRow(T, o, 1.6, 6, D / 2 + 0.05, { arch: true, frame: 0xf5efe0, h: 1.8 }); sideWins(T, o, 1.6, 3, { frame: 0xf5efe0 });
    signOn(w, T, o, 4.6, 10); },
  // train station: long canopy on iron posts over a platform, small ticket hall with clock tower
  station(w, T, o) { w_ = w; const { W, D, H } = o; T.box('m', 0xb8c2cc, 0, 0, 0, W + 8, 0.4, D + 6); K.walls(w, T, W * 0.5, H, D, o.col || 0x14532d, 'board'); K.gable(T, o.roof || 0x7f1d1d, H, W * 0.5, 2.6, D);
    T.box('m', o.col || 0x14532d, W * 0.25 - 1.5, 0, D / 2 - 1.5, 3, H + 4, 3); T.add('m', G.cone(4), o.roof || 0x7f1d1d, W * 0.25 - 1.5, H + 4, D / 2 - 1.5, 0, PI / 4, 0, 2.4, 2.4, 2.4); T.add('m', G.cyl(16), 0xfffbeb, W * 0.25 - 1.5, H + 2.6, D / 2 + 0.02, PI / 2, 0, 0, 1, 0.1, 1);
    for (let i = 0; i < 7; i++) { const lx = -W / 2 - 3 + i * (W + 6) / 6; T.add('x', G.cyl(8), 0x1f2937, lx, 0.4, -D / 2 - 2.5, 0, 0, 0, 0.12, 3.8, 0.12); } T.box('m', o.roof || 0x7f1d1d, 0, 4.2, -D / 2 - 2.0, W + 7, 0.25, 3.6); T.box('m', SNOW, 0, 4.45, -D / 2 - 2.0, W + 7, 0.12, 3.6);
    K.doorL(w, T, 0, D / 2, 1.8, 2.6, 0x7f1d1d); winRow(T, { ...o, W: W * 0.5 }, 1.5, 2, D / 2 + 0.05, { frame: 0xfef3c7 }); signOn(w, T, o, H + 0.9, 9); },
  // modern-ish office with glass band and flat roof (admin/IT, elf resources)
  office(w, T, o) { w_ = w; const { W, D, H } = o; K.walls(w, T, W, H, D, o.col || 0x475569, 'plain'); T.box('m', o.trim || 0xe2e8f0, 0, 0, 0, W + 0.2, 0.5, D + 0.2); T.box('m', o.trim || 0xe2e8f0, 0, H, 0, W + 0.4, 0.4, D + 0.4); T.box('m', SNOW, 0, H + 0.4, 0, W + 0.2, 0.18, D + 0.2);
    T.box('l', 0xc7e8ff, 0, H * 0.45, D / 2 + 0.03, W * 0.9, H * 0.3, 0.06, 0, 0.12); for (let i = 0; i <= 8; i++) T.box('m', o.trim || 0xe2e8f0, -W * 0.45 + i * W * 0.9 / 8, H * 0.45, D / 2 + 0.08, 0.1, H * 0.3, 0.06);
    if (o.dish) { T.add('x', G.cyl(6), 0xd1d5db, W * 0.3, H + 0.4, 0, 0, 0, 0, 0.1, 1.6, 0.1); T.add('x', G.hemi(12), 0xe5e7eb, W * 0.3, H + 2.2, 0, -1.0, 0, 0, 1.3, 0.5, 1.3); }
    K.doorL(w, T, o.doorX || 0, D / 2, 1.8, 2.5, o.doorCol || 0x0f172a, { frame: o.trim || 0xe2e8f0 }); sideWins(T, o, 1.6, 2, {}); signOn(w, T, o, H - 0.55); },
  // little round elf cottage (non-enterable homes in Elf Village) - mushroom-cap snowy roof
  cottage(w, T, o) { const { W, H } = o; T.add('m', G.cyl(10), o.col || 0xfde68a, 0, 0, 0, 0, 0, 0, W / 2, H, W / 2); T.add('m', G.cone(10), o.roof || 0xb91c1c, 0, H, 0, 0, 0, 0, W / 2 + 0.8, W * 0.55, W / 2 + 0.8); T.add('m', G.cone(10), SNOW, 0, H + W * 0.18, 0, 0, 0.2, 0, W / 2 + 0.2, W * 0.4, W / 2 + 0.2);
    T.box('g', 0x7c2d12, 0, 0, W / 2 - 0.05, 1.0, 1.8, 0.2); T.add('l', G.cyl(10), 0xffd08a, -W * 0.28, 1.6, W * 0.42, PI / 2, 0, 0, 0.32, 0.08, 0.32, 0.3); T.add('l', G.cyl(10), 0xffd08a, W * 0.28, 1.6, W * 0.42, PI / 2, 0, 0, 0.32, 0.08, 0.32, 0.3);
    T.box('m', 0x78716c, W * 0.2, H, -W * 0.1, 0.5, W * 0.5, 0.5); },
};
const xz = (p) => [p[0], 0, p[2]];
function R2(i) { return ((i * 9301 + 49297) % 233280) / 233280; }
