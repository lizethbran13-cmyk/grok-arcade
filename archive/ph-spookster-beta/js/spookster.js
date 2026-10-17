// DLC #45 Spookster Mega Pack (Grok Pumpkin Hollow): the Sludge Site + THE GLOOMWORKS underground facility, the "Who built it and why?"
// mystery, 6 character skins and SPOOKY MODE 2.0 (ghost powers BOO / HAUNT / VANISH / FLICKER, inspired by Grok Spooks' Spook 'Em mode).
// Static props are real 3D geometry merged into each room's batched meshes (no images on walls, no stretched textures; canvas screens keep
// their real aspect). Everything sits on a floor, a counter or is fixed to a wall/ceiling with a visible mount.
import * as THREE from 'three';
import { S, persist } from './save.js?v=ph12';
import { sfx } from './audio.js?v=ph12';
import { panel } from './ui.js?v=ph12';
import { MB, toGroup } from './models.js?v=ph12';
import { P } from './geo.js?v=ph12';
import * as D from './spookdata.js?v=ph12';
import { E } from './engine.js?v=ph12';
const PI = Math.PI, UY = D.UY, FL = UY + 0.02, F0 = 0.02;
const $a = (c, s) => [...c.querySelectorAll(s)], $q = (c, s) => c.querySelector(s);
const sh = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const BTN = 'style="font:bold 16px system-ui;padding:12px 10px;margin:5px;border-radius:14px;border:0;min-width:92px;background:#fff3;color:#fff"';
const WIDE = 'style="display:block;width:94%;margin:6px auto;font:bold 15px system-ui;padding:11px;border-radius:12px;border:0;background:#fff3;color:#fff;text-align:left"';
const GOO = 0x39ff6a, GOO2 = 0x22c55e, STEEL = 0x64748b, DARK = 0x1f2937, WALL = 0x3b4656, TRIM = 0x22c55e;
const SCREENS = []; const scr = (x, y, z, ry, W, cw, ch, draw, reg, once) => SCREENS.push({ x, y: y + (reg && reg.startsWith('u_') ? UY : 0), z, ry, W, H: W * ch / cw, cw, ch, draw, reg, once });
// ================================================================== geometry
export function build(w, K, TH, building, floor) { const kb = w._forceB, kd = w._forceDrop, nt = w._noTH; w._forceB = null; w._forceDrop = false; w._noTH = true;
  site(w, K, TH, building, floor);
  if (D.OWN) { for (const r of D.ROOMS) labRoom(w, K, floor, r); w.oy = UY; lobby(w, K, TH); hall(w, K, TH); tests(w, K, TH); sludge(w, K, TH); archive(w, K, TH); lab(w, K, TH); core(w, K, TH); w.oy = 0; }
  w.region = 'out'; w._forceB = kb; w._forceDrop = kd; w._noTH = nt; }
const I = (w, id, x, y, z, r, label) => w.I({ kind: 'hol', id, x, y: y + (w.oy || 0), z, r, label });
const LP = (w, o) => { o.y += w.oy || 0; w.lights.push(o); };
// ------------------------------------------------------------------ surface: the Sludge Site
function site(w, K, TH, building, floor) { const s = D.SITE, [gx, ga, gb] = s.gate; w.region = 'out';
  floor(w, s.x0, s.z0, s.x1, s.z1, 'tile', 0.004, 0x3a3348, 0x332d40, 2.2); floor(w, s.x1, ga + 1, -112, gb - 1, 'tile', 0.006, 0x4b3f63, 0x3b3152, 1.4);
  // chain-link fence (posts + rails + see-through mesh), gate gap on the east side
  const fenceRun = (ax, at, a, b) => { const L = b - a; if (L < 0.2) return; const n = Math.max(1, Math.round(L / 2.6));
    for (let i = 0; i <= n; i++) { const p = a + L * i / n, x = ax === 'x' ? p : at, z = ax === 'x' ? at : p; w.add('x', K.cyl(10), 0x9ca3af, x, 0, z, 0, 0, 0, 0.06, 2.2, 0.06); w.add('x', K.sph(8), 0x9ca3af, x, 2.22, z, 0, 0, 0, 0.07); }
    const m = (a + b) / 2; for (const y of [0.12, 1.1, 2.1]) { if (ax === 'x') w.add('x', K.cyl(8), 0x9ca3af, m, y, at, 0, 0, PI / 2, 0.03, L, 0.03); else w.add('x', K.cyl(8), 0x9ca3af, at, y, m, PI / 2, 0, 0, 0.03, L, 0.03); }
    if (ax === 'x') w.add('e', K.rbox(L, 2.0, 0.02, 0.005), 0xcbd5e1, m, 1.1, at); else w.add('e', K.rbox(0.02, 2.0, L, 0.005), 0xcbd5e1, at, 1.1, m);
    if (ax === 'x') w.solid(a, 0, at - 0.12, b, 2.3, at + 0.12, { cam: false }); else w.solid(at - 0.12, 0, a, at + 0.12, 2.3, b, { cam: false }); };
  fenceRun('x', s.z1, s.x0, s.x1); fenceRun('z', s.x0, s.z0, s.z1); fenceRun('z', s.x1, s.z0, ga); fenceRun('z', s.x1, gb, s.z1);
  // glowing sludge pools with rim stones + cracks in the ground leaking goo
  for (const [x, z, rx, rz] of D.POOLS) { w.add('m', K.cyl(32), 0x2a2238, x, 0.005, z, 0, 0, 0, rx + 0.5, 0.03, rz + 0.5); w.add('l', K.cyl(32), GOO2, x, 0.03, z, 0, 0, 0, rx, 0.03, rz); w.add('l', K.cyl(28), GOO, x, 0.05, z, 0, 0, 0, rx * 0.7, 0.02, rz * 0.7);
    const n = Math.round((rx + rz) * 3); for (let i = 0; i < n; i++) { const a = i / n * PI * 2; w.add('m', K.blobGeo(i & 63, 0.25, 1), [0x4b4458, 0x5b5368, 0x3f3a4c][i % 3], x + Math.cos(a) * (rx + 0.35), 0.1, z + Math.sin(a) * (rz + 0.35), 0, a, 0, 0.32, 0.18, 0.28); }
    for (let k = 0; k < 3; k++) { const a = k * 2.1 + x, L = 2 + (k % 2) * 1.5, cx = x + Math.cos(a) * (rx + L / 2), cz = z + Math.sin(a) * (rz + L / 2); w.add('m', K.rbox(L, 0.02, 0.24, 0.01), 0x17131f, cx, 0.012, cz, 0, -a, 0); w.add('l', K.rbox(L * 0.9, 0.02, 0.08, 0.01), GOO2, cx, 0.02, cz, 0, -a, 0); }
    w.lights.push({ x, y: 1.2, z, c: GOO, i: 6, d: 9 }); }
  // warning signs on posts + traffic cones + striped sawhorses
  const signPost = (x, z, ry, t1, t2) => { w.add('x', K.cyl(10), 0x9ca3af, x, 0, z, 0, 0, 0, 0.06, 1.7, 0.06); w.add('m', K.rbox(1.9, 0.9, 0.06, 0.03), 0xfacc15, x, 1.9, z, 0, ry, 0); K.sign3d(w, t1, x + Math.sin(ry) * 0.05, 2.05, z + Math.cos(ry) * 0.05, ry, 0.15, 0x111827, 0xfacc15); if (t2) K.sign3d(w, t2, x + Math.sin(ry) * 0.05, 1.72, z + Math.cos(ry) * 0.05, ry, 0.11, 0x111827, 0xfacc15); };
  signPost(-152, -152.2, 0, 'DANGER: GOO', 'DO NOT TASTE'); signPost(-171, -146, PI * 0.15, 'KEEP OUT', '(MOSTLY)'); signPost(-139, -148, PI / 2, 'SLUDGE SITE', 'GOO INSPECTION');
  for (const [x, z] of [[-153, -159], [-147, -159], [-155, -153], [-181, -147], [-175, -153], [-165, -139], [-159, -144]]) K.cone3(w, x, z);
  const horse = (x, z, ry) => { const T = w.tf(x, 0, z, ry); [-0.7, 0.7].forEach((d) => { T.box('x', 0x6b7280, d, 0.45, 0.2, 0.06, 0.9, 0.06, 0.02); T.box('x', 0x6b7280, d, 0.45, -0.2, 0.06, 0.9, 0.06, 0.02); }); for (let i = 0; i < 5; i++) T.box('g', i % 2 ? 0xffffff : 0xf97316, -0.8 + i * 0.4, 0.95, 0, 0.4, 0.22, 0.08, 0.02); };
  horse(-150, -161.5, 0); horse(-182, -155, PI / 2); horse(-158, -138.5, 0.3);
  if (!D.OWN) { // locked teaser: gate shut + a sign
    w.solid(gx - 0.15, 0, ga, gx + 0.15, 2.3, gb, { cam: false }); for (let i = 0; i < 2; i++) { const z = ga + 1.5 + i * 3; w.add('x', K.rbox(0.06, 1.9, 2.9, 0.02), 0x9ca3af, gx, 1.1, z); w.add('e', K.rbox(0.02, 1.8, 2.8, 0.005), 0xcbd5e1, gx, 1.1, z); }
    const x = gx + 3.4, z = (ga + gb) / 2; w.add('x', K.cyl(10), 0x334155, x, 0, z - 2.4, 0, 0, 0, 0.12, 2.8, 0.12); w.add('x', K.cyl(10), 0x334155, x, 0, z + 2.4, 0, 0, 0, 0.12, 2.8, 0.12);
    w.add('m', K.rbox(0.16, 1.4, 5.4, 0.05), 0x14532d, x, 2.4, z); K.sign3d(w, 'SPOOKSTER MEGA PACK', x + 0.1, 2.62, z, PI / 2, 0.26, 0xbbf7d0, 0x14532d); K.sign3d(w, 'DLC  UNLOCK IN THE GROK ARCADE', x + 0.1, 2.1, z, PI / 2, 0.15, 0x1f2937, 0xfef3c7);
    for (let i = 0; i < 3; i++) K.cone3(w, x + 1.2, z - 2 + i * 2); I(w, 'sx_lock', x + 1.6, 0.2, z, 2.8, '🔒 What\'s under the green goo?'); return; }
  // open gate leaves
  [[ga, -1], [gb, 1]].forEach(([z, sd]) => { const T = w.tf(gx, 0, z, sd * 0.9); T.box('x', 0x9ca3af, 0.06, 1.1, -sd * 1.4, 0.06, 1.9, 2.8, 0.02); T.box('e', 0xcbd5e1, 0.06, 1.1, -sd * 1.4, 0.02, 1.8, 2.7, 0.005); });
  // Inspector Mabel's sample table: jars of goo, a microscope, a clipboard
  w.slab('m', 0x7c2d12, -146.5, 0, -152, 1.8, 0.85, 0.8, 0.04); for (let i = 0; i < 4; i++) K.beaker(w, -147.2 + i * 0.4, 0.85, -152.1, [GOO, GOO2, 0xa3e635, GOO][i], 0.8); w.add('x', K.cyl(12), DARK, -145.9, 0.85, -151.9, 0, 0, 0, 0.12, 0.05, 0.12); w.add('x', K.cyl(10), DARK, -145.9, 0.9, -151.95, 0.3, 0, 0, 0.04, 0.4, 0.04);
  w.add('m', K.rbox(0.3, 0.02, 0.4, 0.01), 0xfef3c7, -146.8, 0.87, -151.8, 0, 0.3, 0); [-147.2, -145.8].forEach((x) => [-152.3, -151.7].forEach((z) => w.add('x', K.cyl(8), 0x475569, x, 0, z, 0, 0, 0, 0.03, 0.85, 0.03)));
  // Ghostifier booth #1 (haunt the town!)
  ghostPod(w, K, -141, -164, 'out', 0); I(w, 'sx_ghost', -141, 0.2, -162.2, 2.0, '👻 Ghostifier: Spooky Mode 2.0');
  // THE WATER WORKS SHACK (walk in; elevator at the back)
  const B = D.SHACK; building(w, { id: B.id, x0: B.x0, z0: B.z0, x1: B.x1, z1: B.z1, ceil: B.ceil, ext: 0x4b5563, int: 0x3f3a35, band: 0x14532d, base: 0x1f2937, trim: 0x86efac, frame: 0x9ca3af, roofCol: 0x1f2937,
    floor: ['wood', 0x5b4a3a, 0x4a3b2e, 1.2], door: { side: 's', a: -172, b: -168, h: 3.6 }, curtain: 0x14532d, shutters: 0x111827, li: 20, style: 'gable', roofH: 6.2, noPots: true, winTop: 3.2, sign: ['HOLLOW HILLS WATER WORKS', 0.26, 0xdcfce7, 0x14532d] });
  w.region = 'out'; floor(w, -172, B.z1 + 0.2, -168, -152, 'tile', 0.006, 0x4b3f63, 0x3b3152, 1.0); TH.pumpkin(w, K, -173.6, 0, B.z1 + 0.9, 0.4); K.sign3d(w, 'EST 1926', -170, 4.4, B.z1 + 0.25, 0, 0.18, 0xdcfce7, 0x14532d);
  w.region = B.id; const fl = 0.12;
  for (let i = 0; i < 3; i++) { const x = -177 + i * 3; w.add('x', K.cyl(20), 0x475569, x, fl, -173.5, 0, 0, 0, 0.6, 1.6, 0.6); w.add('x', K.sph(16), 0x475569, x, fl + 1.6, -173.5, 0, 0, 0, 0.6, 0.35, 0.6); w.add('x', K.torus(0.12, 20), 0xb45309, x, fl + 1.1, -173.5 + 0.62, 0, 0, 0, 0.3, 0.3, 0.3); w.add('x', K.cyl(10), 0x475569, x, fl + 1.9, -173.5, 0, 0, 0, 0.12, B.ceil - 2.0, 0.12); w.solid(x - 0.6, fl, -174.1, x + 0.6, fl + 2, -172.9); }
  K.desk(w, -163, -175, -PI / 2, { L: 1.8 }); w.add('m', K.rbox(0.4, 0.04, 0.3, 0.01), 0xfef3c7, -163, fl + 0.88, -175); K.chair(w, -164.2, 0, -175, PI / 2, 0x14532d); K.filing(w, -161, -183.5, 0, 0x6b7280, 3);
  for (let i = 0; i < 4; i++) K.crate(w, -178.5 + (i % 2) * 1.1, fl + (i >> 1) * 1.0, -182.8, 1, i % 2 ? 0xa16207 : 0x854d0e); K.pipes(w, 'x', -185.6, -179.5, -160.5, 4.4, [0x64748b, 0x14532d, 0x475569]);
  liftDoor(w, K, -170, -185.75, 0, fl, 'SUB-LEVEL 13'); I(w, 'sx_down', -170, 0.2, -183.6, 1.9, '🛗 Ride the creaky elevator DOWN');
  K.sign3d(w, 'STAFF ONLY  VERY STAFF ONLY', -170, 3.95, -185.65, 0, 0.14, 0x111827, 0xfacc15); w.add('l', K.cyl(16), GOO2, -166, fl + 0.005, -181, 0, 0, 0, 0.5, 0.01, 0.35); // a little goo drip under the lift
}
function liftDoor(w, K, x, z, ry, fl, label) { const T = w.tf(x, fl, z, ry); T.box('x', 0x94a3b8, -1.25, 1.6, 0, 0.3, 3.2, 0.25, 0.04); T.box('x', 0x94a3b8, 1.25, 1.6, 0, 0.3, 3.2, 0.25, 0.04); T.box('x', 0x94a3b8, 0, 3.35, 0, 2.8, 0.3, 0.25, 0.04);
  T.box('x', 0x7b8794, -0.55, 1.6, 0.04, 1.08, 3.1, 0.08, 0.02); T.box('x', 0x8b97a4, 0.55, 1.6, 0.04, 1.08, 3.1, 0.08, 0.02); T.box('m', DARK, 0, 1.6, 0.09, 0.03, 3.1, 0.02, 0.005);
  T.box('x', 0x334155, 1.7, 1.25, 0.06, 0.3, 0.6, 0.06, 0.02); T.add('l', K.sph(10), GOO, 1.7, 1.35, 0.1, 0, 0, 0, 0.07, 0.07, 0.03); T.add('l', K.sph(10), 0xef4444, 1.7, 1.12, 0.1, 0, 0, 0, 0.06, 0.06, 0.03);
  T.box('m', 0x111827, 0, 3.8, 0.02, 2.4, 0.45, 0.08, 0.03); K.sign3d(w, label, x + Math.sin(ry) * 0.08, fl + 3.82, z + Math.cos(ry) * 0.08, ry, 0.17, GOO, 0x111827); }
function ghostPod(w, K, x, z, reg, ry) { const y = reg === 'out' ? 0 : F0; w.add('x', K.cyl(28), 0x334155, x, y, z, 0, 0, 0, 1.0, 0.25, 1.0); w.add('l', K.torus(0.06, 32), 0xa78bfa, x, y + 0.26, z, PI / 2, 0, 0, 0.95, 0.95, 0.95);
  w.add('e', K.cyl(28), 0xe9d5ff, x, y + 0.25, z, 0, 0, 0, 0.85, 2.3, 0.85); w.add('x', K.cyl(28), 0x334155, x, y + 2.55, z, 0, 0, 0, 1.0, 0.25, 1.0); w.add('l', K.sph(16), 0xc4b5fd, x, y + 2.85, z, 0, 0, 0, 0.3, 0.18, 0.3);
  for (let i = 0; i < 3; i++) { const a = ry + i * 2.1 + 0.5; w.add('x', K.cyl(8), 0x475569, x + Math.cos(a) * 0.92, y + 0.25, z + Math.sin(a) * 0.92, 0, 0, 0, 0.05, 2.3, 0.05); }
  K.sign3d(w, 'GHOSTIFIER', x, y + 3.25, z, ry, 0.16, 0xede9fe, 0x4c1d95); LP(w, { x, y: y + 2, z: z, c: 0xa78bfa, i: 5, d: 7 }); w.solid(x - 1, y, z - 1, x + 1, y + 0.25, z + 1); }
// ------------------------------------------------------------------ facility rooms
function labRoom(w, K, floor, r) { w.region = r.id; const Y = UY, H = r.h, op = D.OPEN[r.id] || [];
  const fc = { u_gw_archive: ['wood', 0x6b4f3a], u_gw_lab: ['tile', 0xe2e8f0, 0x9ae6b4, 1.2], u_gw_core: ['tile', 0x1f2937, 0x273449, 2.0], u_gw_hall: ['tile', 0x475569, 0x3f4b5c, 1.0], u_gw_lift: ['tile', 0x4b5563, 0x374151, 1.5], u_gw_tests: ['tile', 0xd1d5db, 0x9ca3af, 1.5], u_gw_sludge: ['tile', 0x3f4b3f, 0x354235, 1.6] }[r.id];
  if (fc[0] === 'wood') floor(w, r.x0, r.z0, r.x1, r.z1, 'wood', Y, fc[1]); else floor(w, r.x0, r.z0, r.x1, r.z1, 'tile', Y, fc[1], fc[2], fc[3]);
  K.ceiling(w, r.x0, r.z0, r.x1, r.z1, Y + H, 0x2b3442, { lampCol: r.id === 'u_gw_core' ? 0xd9ffe4 : 0xeefdf3, lightCol: 0xd9ffe4, li: r.id === 'u_gw_hall' ? 14 : 18 });
  const sides = [['x', r.z0, r.x0, r.x1, -1], ['x', r.z1, r.x0, r.x1, 1], ['z', r.x0, r.z0, r.z1, -1], ['z', r.x1, r.z0, r.z1, 1]], wc = r.id === 'u_gw_archive' ? 0x5b4636 : r.id === 'u_gw_lab' ? 0x4a5d55 : WALL;
  for (const [ax, at, a, b, sd] of sides) { const holes = op.filter((o) => o[0] === ax && Math.abs(o[1] - at) < 0.1).map((o) => K.D(o[2], o[3], 3.6));
    K.wall(w, ax, at + sd * 0.15, a, b, H, wc, holes, { y: Y, th: 0.3, base: 0x111827, trim: TRIM, frame: 0x94a3b8 });
    // wall ribs every 3 m (skipping doorways) + a hazard band at the base
    for (let p = a + 1.5; p < b - 1; p += 3) { if (holes.some((hl) => p > hl[0] - 0.6 && p < hl[1] + 0.6)) continue; const x = ax === 'x' ? p : at - sd * 0.02, z = ax === 'x' ? at - sd * 0.02 : p;
      if (ax === 'x') w.add('x', K.rbox(0.22, H - 0.4, 0.12, 0.03), 0x566273, x, Y + H / 2, z); else w.add('x', K.rbox(0.12, H - 0.4, 0.22, 0.03), 0x566273, x, Y + H / 2, z); } }
}
const onWall = (ax, at, sd) => (ax === 'x' ? { z: at - sd * 0.2, ry: sd > 0 ? PI : 0 } : { x: at - sd * 0.2, ry: sd > 0 ? -PI / 2 : PI / 2 });
function sign(w, K, t, x, y, z, ry, s = 0.2, col = 0xdcfce7, back = 0x14532d) { K.sign3d(w, t, x, y, z, ry, s, col, back); }
function lobby(w, K, TH) { const r = D.RM.u_gw_lift; w.region = r.id;
  liftDoor(w, K, -212.2, 0, -PI / 2, F0, 'SUB-LEVEL 13'); I(w, 'sx_up', -213.8, 0.2, 0, 1.9, '🛗 Ride the elevator UP to the surface'); K.hazard(w, -214.5, 0, 3.6, 1.6, PI / 2);
  // security desk (Guard Bones)
  { const T = w.tf(-222, F0, 3.5, 0); T.slab('m', 0x334155, 0, 0, 0, 4.2, 1.05, 1.0, 0.06); T.box('g', 0x22c55e, 0, 1.08, 0, 4.3, 0.06, 1.1, 0.02); } K.monitor(w, null, -223, 1.13, 3.4, PI, 0x38bdf8); K.monitor(w, null, -221, 1.13, 3.4, PI, GOO); K.chair(w, -222, 0, 4.9, PI, 0x334155);
  w.solid(-224.1, 0, 3.0, -219.9, 1.05, 4.0); sign(w, K, 'SECURITY', -222, 1.55, 2.95, 0, 0.16);
  // staff lockers
  for (let i = 0; i < 8; i++) { const x = -230.6 + i * 0.95, T = w.tf(x, F0, -9.45, 0); T.slab('x', [0x0f766e, 0x115e59][i % 2], 0, 0, 0, 0.9, 2.2, 0.55, 0.03); for (let k = 0; k < 3; k++) T.box('m', 0x0b3b37, 0, 1.75 + k * 0.1, 0.28, 0.5, 0.03, 0.02, 0.005); T.box('x', 0xd1d5db, 0.3, 1.1, 0.29, 0.04, 0.22, 0.04, 0.01); }
  w.solid(-231.1, 0, -9.75, -223.4, 2.2, -9.15); { const T = w.tf(-227, F0, -7.6, 0); T.slab('m', 0x7c2d12, 0, 0.4, 0, 3.0, 0.08, 0.5, 0.03); [-1.3, 1.3].forEach((d) => T.box('x', 0x475569, d, 0.2, 0, 0.08, 0.4, 0.4, 0.01)); }
  I(w, 'sx_locker', -227, 0.2, -7.2, 2.0, '🧥 Staff lockers: try on a skin');
  // facility map board on the south wall + a welcome sign over the corridor
  w.add('m', K.rbox(5.2, 2.6, 0.12, 0.04), 0x111827, -225, 2.3, 9.75); scr(-225, 2.3, 9.68, PI, 5.0, 1024, 480, drawMap, r.id); I(w, 'sx_map', -225, 0.2, 8.3, 2.0, '🗺️ Facility map + case notes');
  sign(w, K, 'WELCOME TO THE GLOOMWORKS', -231.75, 4.3, 0, PI / 2, 0.24); sign(w, K, 'PLEASE DO NOT FEED THE GOO', -231.75, 3.85, 0, PI / 2, 0.13, 0x111827, 0xfacc15);
  K.cooler(w, -213.6, -8.6); TH.pumpkin(w, K, -213.6, F0, 8.6, 0.5); K.bench(w, -218, 9.3, PI, 0x14532d); K.bench(w, -230.8, 6, PI / 2, 0x14532d); K.rug(w, -222, 0, 0, 6, 3, 0x14532d, GOO2);
  for (let i = 0; i < 3; i++) K.parcel(w, -214 + (i % 2) * 0.6, F0 + (i >> 1) * 0.5, -6 + i * 0.3, 0.9); }
function hall(w, K, TH) { const r = D.RM.u_gw_hall; w.region = r.id;
  w.add('l', K.rbox(r.x1 - r.x0 - 1, 0.02, 0.24, 0.01), GOO2, (r.x0 + r.x1) / 2, F0 + 0.03, 0); for (let x = r.x0 + 3; x < r.x1 - 2; x += 6) w.add('l', K.rbox(0.9, 0.02, 0.9, 0.01), GOO, x, F0 + 0.035, 0, 0, PI / 4, 0);
  K.pipes(w, 'x', -3.6, r.x0 + 0.5, r.x1 - 0.5, 4.1, [0x64748b, GOO2, 0x475569]); K.pipes(w, 'x', 3.6, r.x0 + 0.5, r.x1 - 0.5, 4.1, [0x475569, 0x64748b, GOO2]);
  for (let x = r.x0 + 1; x < r.x1; x += 4) [-3.75, 3.75].forEach((z) => w.add('x', K.rbox(0.1, 0.9, 0.3, 0.02), 0x334155, x, 3.8, z));
  const ds = [['TEST CHAMBERS', -278, -3.82, 0], ['SLUDGE WORKS', -248, -3.82, 0], ['RECORDS ARCHIVE', -278, 3.82, PI], ['LAB B13', -248, 3.82, PI]]; for (const [t, x, z, ry] of ds) sign(w, K, t, x, 4.0, z, ry, 0.2);
  sign(w, K, 'THE GLOW CORE', -291.8, 4.0, 0, PI / 2, 0.22); sign(w, K, 'LOBBY  ELEVATOR', -232.3, 4.0, 0, -PI / 2, 0.18);
  for (const [x, z, ry] of [[-262, -3.3, 0], [-262, 3.3, PI], [-286, -3.3, 0], [-238, 3.3, PI]]) K.bench(w, x, z, ry, 0x334155);
  for (const [x, z] of [[-268, -3.7], [-240, 3.7]]) { w.add('x', K.rbox(0.3, 0.08, 0.14, 0.02), 0x334155, x, 1.55, z); w.add('g', K.capsule(14), 0xdc2626, x, 1.15, z + (z < 0 ? 0.14 : -0.14), 0, 0, 0, 0.13, 0.42, 0.13); }
  for (const [x, z, t] of [[-257, -3.84, 'SAFETY FIRST  GOO SECOND'], [-269, 3.84, 'NIGHT SHIFT RULES: NO SCREAMING']]) { const ry = z < 0 ? 0 : PI; w.add('m', K.rbox(3.4, 0.6, 0.05, 0.02), 0xfef3c7, x, 2.3, z); sign(w, K, t, x, 2.3, z + (z < 0 ? 0.04 : -0.04), ry, 0.12, 0x14532d, 0xfef3c7); } }
function chamber(w, K, cx, label) { const z0 = -31.7, z1 = -25.2, x0 = cx - 3, x1 = cx + 3;
  w.slab('x', 0x94a3b8, cx, 0, (z0 + z1) / 2, 6, 0.12, z1 - z0, 0.03, false); [x0, x1].forEach((x) => { w.add('x', K.rbox(0.18, 4.6, 0.18, 0.03), 0x64748b, x, 2.3, z1); w.add('e', K.rbox(0.05, 4.4, z1 - z0, 0.01), 0xd8fbff, x, 2.3, (z0 + z1) / 2); w.solid(x - 0.1, 0, z0, x + 0.1, 4.5, z1); });
  [[x0, cx - 0.9], [cx + 0.9, x1]].forEach(([a, b]) => { w.add('e', K.rbox(b - a, 4.4, 0.05, 0.01), 0xd8fbff, (a + b) / 2, 2.3, z1); w.solid(a, 0, z1 - 0.08, b, 4.5, z1 + 0.08); }); w.add('x', K.rbox(6.2, 0.2, 0.2, 0.03), 0x64748b, cx, 4.6, z1);
  w.add('x', K.rbox(1.8, 0.12, 0.2, 0.03), 0x64748b, cx, 3.2, z1); sign(w, K, label, cx, 4.95, z1 + 0.12, 0, 0.15); w.add('l', K.rbox(5.6, 0.04, 0.12, 0.01), GOO2, cx, 5.4, z0 + 0.4); }
function dummy(w, K, x, z, ry, sit) { const T = w.tf(x, F0 + (sit ? 0.45 : 0), z, ry); T.add('g', K.capsule(14), 0xfacc15, 0, 0.75, 0, 0, 0, 0, 0.34, 0.55, 0.26); T.add('g', K.sph(14), 0xfacc15, 0, 1.45, 0, 0, 0, 0, 0.22); [[-1, 1]].forEach(() => 0);
  [-1, 1].forEach((d) => { T.add('m', K.cyl(16), 0x111827, d * 0.1, 1.48, 0.2, PI / 2, 0, 0, 0.06, 0.02, 0.06); T.add('g', K.capsule(10), 0xfacc15, d * 0.4, 0.8, 0, 0, 0, d * 0.4, 0.1, 0.42, 0.1); T.add('g', K.capsule(10), 0x111827, d * 0.14, sit ? 0.18 : 0.3, sit ? 0.25 : 0, sit ? PI / 2 : 0, 0, 0, 0.12, 0.42, 0.12); });
  T.add('m', K.cyl(20), 0x111827, 0, 0.85, 0.27, PI / 2, 0, 0, 0.14, 0.01, 0.14); T.add('m', K.cyl(20), 0xfacc15, 0, 0.85, 0.275, PI / 2, 0, 0, 0.08, 0.01, 0.08); }
function tests(w, K, TH) { const r = D.RM.u_gw_tests; w.region = r.id;
  chamber(w, K, -288.4, 'TEST A  FOG FRIGHT'); chamber(w, K, -281.4, 'TEST B  GROWTH RAY'); chamber(w, K, -274.4, 'TEST C  SHADOW BOX'); chamber(w, K, -267.4, 'TEST D  GLOW TEST');
  // A: fog machine + a test dummy on a stool
  w.slab('x', 0x334155, -290.2, F0, -30.6, 1.2, 0.8, 0.8, 0.04); w.add('x', K.cyl(16), 0x111827, -289.6, F0 + 0.5, -30.2, PI / 2, 0, 0, 0.18, 0.2, 0.18); K.stool(w, -287.6, -28.5, 0x334155); dummy(w, K, -287.6, -28.5, 0.3, true);
  // B: growth-ray tripod aimed at a pedestal (the giant pumpkin itself is animated)
  w.slab('m', 0x9ca3af, -281.4, F0, -29.8, 2.4, 0.5, 2.4, 0.1); { const T = w.tf(-283.6, F0, -26.6, 0.8); [0, 2.1, 4.2].forEach((a) => T.add('x', K.cyl(8), 0x475569, Math.cos(a) * 0.35, 0.6, Math.sin(a) * 0.35, Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3, 0.035, 1.25, 0.035));
    T.add('x', K.cyl(16), 0x94a3b8, 0, 1.3, -0.2, PI / 2 - 0.25, 0, 0, 0.16, 0.9, 0.16); T.add('l', K.sph(12), 0xf472b6, 0, 1.42, -0.66, 0, 0, 0, 0.12); }
  // C: shadow box: a lamp + bat cut-outs fixed on the back wall
  K.lamp(w, -276, -28); for (let i = 0; i < 3; i++) { const x = -275.4 + i * 0.9, y = 2.2 + (i % 2) * 0.5; w.add('m', K.rbox(0.7, 0.32, 0.03, 0.01), 0x111827, x, y, -31.62); w.add('m', K.cone(3), 0x111827, x - 0.42, y, -31.62, 0, 0, PI / 2, 0.14, 0.3, 0.02); w.add('m', K.cone(3), 0x111827, x + 0.42, y, -31.62, 0, 0, -PI / 2, 0.14, 0.3, 0.02); }
  // D: glow pad (Snowie sits here)
  w.add('l', K.cyl(28), 0xa7f3d0, -267.4, F0 + 0.13, -28.4, 0, 0, 0, 1.4, 0.02, 1.4); w.add('l', K.torus(0.05, 28), GOO, -267.4, F0 + 0.15, -28.4, PI / 2, 0, 0, 1.5, 1.5, 1.5); LP(w, { x: -267.4, y: 2, z: -28.4, c: GOO, i: 6, d: 8 });
  // control consoles facing the chambers
  for (const x of [-286, -278, -270]) { const T = w.tf(x, F0, -13.4, 0); T.slab('m', 0x334155, 0, 0, 0, 3.4, 0.95, 1.1, 0.06); T.box('g', DARK, 0, 1.0, -0.15, 3.3, 0.08, 0.8, 0.02); for (let k = 0; k < 6; k++) T.add('l', K.sph(8), [GOO, 0xfacc15, 0xef4444][k % 3], -1.2 + k * 0.45, 1.06, 0.1, 0, 0, 0, 0.05, 0.03, 0.05);
    K.monitor(w, null, x - 0.9, 1.06, -13.7, 0, GOO); K.monitor(w, null, x + 0.9, 1.06, -13.7, 0, 0x38bdf8); K.chair(w, x, 0, -12.0, PI, 0x14532d); w.solid(x - 1.7, 0, -13.95, x + 1.7, 1.0, -12.85); }
  w.add('m', K.rbox(6.2, 2.0, 0.12, 0.04), 0x111827, -278, 3.4, -14.2); w.add('x', K.cyl(8), 0x475569, -280.8, 2.4, -14.2, 0, 0, 0, 0.05, 2.2, 0.05); w.add('x', K.cyl(8), 0x475569, -275.2, 2.4, -14.2, 0, 0, 0, 0.05, 2.2, 0.05); scr(-278, 3.4, -14.13, 0, 6.0, 1024, 330, drawTests, r.id);
  I(w, 'sx_test', -278, 0.2, -11.6, 1.8, '🎛️ Run Spooky Test #413'); I(w, 'sx_log', -286, 0.2, -11.6, 1.8, '📋 Read test log #412');
  for (let i = 0; i < 4; i++) K.crate(w, -263.6, F0 + (i >> 1) * 1.0, -20 + (i % 2) * 1.1, 0.95, 0x854d0e); K.filing(w, -290.8, -16, PI / 2, 0x6b7280, 4); K.filing(w, -290.8, -17, PI / 2, 0x6b7280, 4);
  sign(w, K, 'IF YOU CAN READ THIS YOU ARE NOT SCARED ENOUGH', -278, 4.9, -4.25, PI, 0.12, 0x111827, 0xfacc15); }
function sludge(w, K, TH) { const r = D.RM.u_gw_sludge; w.region = r.id;
  for (const x of [-256, -248, -240]) { K.vat(w, x, -27.6, GOO2, 1.6, 4.0); w.add('x', K.cyl(16), 0x475569, x, 4.3, -27.6, 0, 0, 0, 0.22, r.h - 4.3, 0.22); w.add('x', K.rbox(3.8, 0.3, 0.3, 0.04), 0x334155, x, 0.15, -25.6); LP(w, { x, y: 2.5, z: -25, c: GOO, i: 7, d: 9 });
    sign(w, K, 'GLOW GOO', x, 2.2, -25.88, 0, 0.16, 0x111827, 0xbbf7d0); }
  // the arena of pipes overhead
  K.pipes(w, 'x', -22.6, r.x0 + 0.5, r.x1 - 0.5, 5.2, [0x64748b, GOO2, 0x475569]); for (let x = r.x0 + 2; x < r.x1; x += 5) w.add('x', K.cyl(8), 0x334155, x, 5.2, -22.6, 0, 0, 0, 0.05, r.h - 5.2, 0.05);
  // valve panel on the west wall + Pi-rat's chalkboard
  w.add('x', K.rbox(0.25, 2.2, 3.6, 0.05), 0x334155, -261.7, 1.6, -14); for (let i = 0; i < 3; i++) { const z = -15.2 + i * 1.2; w.add('x', K.cyl(10), 0x94a3b8, -261.45, 1.5, z, 0, 0, PI / 2, 0.06, 0.25, 0.06); w.add('x', K.torus(0.18, 24), [0xef4444, 0xfacc15, 0x3b82f6][i], -261.3, 1.5, z, 0, PI / 2, 0, 0.32, 0.32, 0.32); w.add('l', K.sph(8), GOO, -261.55, 2.4, z, 0, 0, 0, 0.06); }
  w.add('m', K.rbox(0.08, 1.4, 2.6, 0.03), 0x14532d, -261.8, 2.6, -18.6); w.add('m', K.rbox(0.1, 1.55, 2.75, 0.03), 0x7c2d12, -261.84, 2.6, -18.6); sign(w, K, 'RED DOWN', -261.7, 3.0, -18.6, PI / 2, 0.14, 0xffffff, 0x14532d); sign(w, K, 'YELLOW LEFT', -261.7, 2.6, -18.6, PI / 2, 0.14, 0xffffff, 0x14532d); sign(w, K, 'BLUE UP', -261.7, 2.2, -18.6, PI / 2, 0.14, 0xffffff, 0x14532d);
  I(w, 'sx_valves', -260.2, 0.2, -14, 1.9, '🔧 Fix the sludge valves');
  // the cracked overflow pipe going up to the surface, a puddle of goo and tiny round footprints to the valve panel
  w.add('x', K.cyl(20), 0x475569, -239.5, F0, -12.5, 0, 0, 0, 0.45, r.h, 0.45); w.add('x', K.torus(0.12, 24), 0x334155, -239.5, 1.2, -12.5, PI / 2, 0, 0, 0.5, 0.5, 0.5); w.add('l', K.rbox(0.1, 0.9, 0.06, 0.02), GOO, -239.5, 2.3, -12.05, 0, 0, 0.3); sign(w, K, 'OVERFLOW TO SURFACE', -239.5, 3.4, -12.0, 0, 0.12, 0x111827, 0xfacc15);
  w.add('l', K.cyl(24), GOO2, -239.5, F0 + 0.01, -11.4, 0, 0, 0, 1.1, 0.01, 0.8); for (let i = 0; i < 12; i++) { const t = i / 11, x = -240.6 - t * 18.5, z = -11.8 - Math.sin(t * PI) * 1.6 - (i % 2) * 0.25; w.add('l', K.cyl(12), GOO, x, F0 + 0.012, z, 0, 0, 0, 0.11, 0.008, 0.11); }
  I(w, 'sx_pipe', -239.5, 0.2, -10.6, 1.8, '🔍 Look at the cracked pipe');
  for (let i = 0; i < 6; i++) { const x = -258 + (i % 3) * 0.9, z = -8 + (i >> 2) * 0.9; w.add('x', K.cyl(18), [0x14532d, 0x166534, 0x334155][i % 3], x, F0, z, 0, 0, 0, 0.38, 1.1, 0.38); w.add('x', K.torus(0.06, 18), 0x111827, x, F0 + 0.55, z, PI / 2, 0, 0, 0.38, 0.38, 0.4); } w.solid(-258.5, 0, -8.5, -255.7, 1.1, -6.6);
  K.hazard(w, -248, -24.2, 22, 0.5, 0); K.robotArm(w, -236, -19); for (let i = 0; i < 3; i++) K.crate(w, -235.6, F0, -16 + i * 1.1, 0.95, 0x854d0e); }
function archive(w, K, TH) { const r = D.RM.u_gw_archive; w.region = r.id;
  for (const x of [-280, -274.5]) for (let i = 0; i < 4; i++) K.shelf(w, x, 11 + i * 3.6, PI / 2, 3.2, 2.6); for (let i = 0; i < 6; i++) K.filing(w, -291.2, 8 + i * 0.85, PI / 2, 0x78716c, 4);
  // the founder's portrait on the back wall (canvas painting, real aspect) in a gold frame
  w.add('x', K.rbox(2.5, 3.1, 0.12, 0.05), 0xd4a017, -278, 2.6, 31.75); scr(-278, 2.6, 31.66, PI, 2.2, 512, 640, drawPortrait, r.id, true); w.add('x', K.rbox(1.1, 0.16, 0.05, 0.02), 0xd4a017, -278, 0.85, 31.7); sign(w, K, 'PROF. CORNELIUS GOURDWICK', -278, 0.88, 31.66, PI, 0.08, 0x111827, 0xd4a017);
  [-280.6, -275.4].forEach((x) => { w.add('x', K.rbox(0.12, 0.12, 0.25, 0.02), 0x334155, x, 3.1, 31.7); w.add('l', K.sph(10), 0xfff1c1, x, 3.05, 31.5, 0, 0, 0, 0.12, 0.1, 0.12); });
  I(w, 'sx_portrait', -278, 0.2, 30.0, 1.9, '🖼️ Inspect the dusty portrait');
  // blueprint table + card-catalogue drawers
  K.desk(w, -268.5, 22, -PI / 2, { L: 2.6, top: 0x5b4636 }); w.add('m', K.rbox(1.0, 0.01, 1.6, 0.003), 0x1d4ed8, -268.5, 0.89, 22); for (let i = 0; i < 5; i++) w.add('l', K.rbox(0.8, 0.005, 0.02, 0.002), 0xbfdbfe, -268.5, 0.897, 21.4 + i * 0.3); K.lamp(w, -267.2, 23.6);
  for (let i = 0; i < 3; i++) { const T = w.tf(-266.4, F0, 12 + i * 1.3, -PI / 2); T.slab('m', 0x7c4a1e, 0, 0, 0, 1.2, 1.3, 0.6, 0.03); for (let k = 0; k < 4; k++) for (let j = 0; j < 2; j++) { T.box('m', 0x9a6a3e, -0.28 + j * 0.56, 0.22 + k * 0.28, 0.3, 0.5, 0.22, 0.02, 0.01); T.box('x', 0xd4a017, -0.28 + j * 0.56, 0.22 + k * 0.28, 0.32, 0.08, 0.03, 0.02, 0.005); } }
  w.solid(-266.7, 0, 11.3, -266.1, 1.3, 15.3); I(w, 'sx_files', -267.6, 0.2, 13.3, 1.8, '🗄️ Search the old file drawers');
  // Luna's reading nook
  K.desk(w, -288.5, 20, PI / 2, { L: 1.8, top: 0x5b4636 }); for (let i = 0; i < 4; i++) w.add('m', K.rbox(0.3, 0.06, 0.4, 0.01), [0x7c2d12, 0x1e3a8a, 0x14532d, 0x92400e][i], -288.5, 0.9 + i * 0.06, 19.6, 0, i * 0.3, 0); K.lamp(w, -289.3, 21.4); K.rug(w, -286, 26, 0, 3.2, 2.2, 0x7c2d12, 0xd4a017); K.sofa(w, -289.6, 26.5, PI / 2, 0x7c2d12, 0x9a3412, 14);
  for (let i = 0; i < 8; i++) K.parcel(w, -271 + (i % 4) * 0.7, F0 + (i >> 2) * 0.5, 29.8, 0.8); sign(w, K, 'QUIET PLEASE  GHOSTS ARE READING', -278, 4.3, 4.25, 0, 0.13); }
function lab(w, K, TH) { const r = D.RM.u_gw_lab; w.region = r.id;
  K.labBench(w, -250, 13, 0, 5, { top: DARK }); K.labBench(w, -250, 17.5, 0, 5, { top: DARK }); for (let i = 0; i < 8; i++) { K.beaker(w, -252 + i * 0.55, 0.95, 13 + (i % 2) * 0.3, [GOO, 0xa855f7, 0xf472b6, 0x38bdf8][i % 4], 1, i % 3); K.beaker(w, -252 + i * 0.55, 0.95, 17.5 - (i % 2) * 0.3, [0xfacc15, GOO, 0xa855f7][i % 3], 1, (i + 1) % 3); }
  // tesla coils (sparks are animated)
  for (const x of [-259, -237]) { w.add('x', K.cyl(24), 0x334155, x, F0, 29, 0, 0, 0, 0.7, 0.5, 0.7); w.add('x', K.cyl(20), 0x9a3412, x, F0 + 0.5, 29, 0, 0, 0, 0.32, 2.4, 0.32); for (let k = 0; k < 10; k++) w.add('x', K.torus(0.08, 20), 0xd97706, x, F0 + 0.7 + k * 0.22, 29, PI / 2, 0, 0, 0.36, 0.36, 0.36); w.add('x', K.torus(0.35, 28), 0xcbd5e1, x, F0 + 3.1, 29, PI / 2, 0, 0, 0.6, 0.6, 0.6); w.solid(x - 0.7, 0, 28.3, x + 0.7, 3.3, 29.7); LP(w, { x, y: 3.2, z: 28, c: 0xa5b4fc, i: 5, d: 8 }); }
  K.hazard(w, -259, 27, 2.6, 2.6, 0); K.hazard(w, -237, 27, 2.6, 2.6, 0);
  // chalkboard of formulas on the east wall
  w.add('m', K.rbox(0.1, 1.8, 5.2, 0.03), 0x14532d, -234.3, 2.6, 18); w.add('m', K.rbox(0.12, 1.95, 5.35, 0.03), 0x7c2d12, -234.35, 2.6, 18); sign(w, K, 'GLOW = GOO x MOON', -234.2, 3.1, 18, -PI / 2, 0.2, 0xffffff, 0x14532d); sign(w, K, 'BRIGHTER  SAFER  LONGER', -234.2, 2.5, 18, -PI / 2, 0.16, 0xffffff, 0x14532d); sign(w, K, 'DO NOT LICK THE COILS', -234.2, 2.05, 18, -PI / 2, 0.12, 0xfacc15, 0x14532d);
  // the Forever Glow mixing station
  w.add('x', K.cyl(24), 0x334155, -253, F0, 24, 0, 0, 0, 1.1, 0.9, 1.1); w.add('l', K.cyl(24), 0xa7f3d0, -253, F0 + 0.92, 24, 0, 0, 0, 0.95, 0.02, 0.95); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; w.add('g', K.cyl(12), [GOO, 0xa855f7, 0xf472b6, 0x38bdf8, 0xfacc15, 0xf97316][i], -253 + Math.cos(a) * 1.5, F0 + 0.95, 24 + Math.sin(a) * 1.5, 0, 0, 0, 0.12, 0.3, 0.12); }
  w.add('x', K.rbox(1.2, 0.9, 0.12, 0.03), 0x334155, -255.4, F0 + 0.45, 24.8, 0, 0.6, 0); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; w.add('x', K.cyl(8), 0x475569, -253 + Math.cos(a) * 1.5, F0, 24 + Math.sin(a) * 1.5, 0, 0, 0, 0.1, 0.95, 0.1); } w.solid(-254.1, 0, 22.9, -251.9, 0.9, 25.1);
  I(w, 'sx_potion', -253, 0.2, 21.9, 1.9, '🧪 Mix the Forever Glow');
  // Dr. Ivy's desk + notebook
  K.desk(w, -237, 16, -PI / 2, { L: 2.2, top: 0x5b4636 }); w.add('m', K.rbox(0.36, 0.05, 0.28, 0.01), 0x7c3aed, -237.2, 0.9, 16.2, 0, 0.4, 0); K.chair(w, -236, 0, 16, -PI / 2, 0x7c3aed); K.lamp(w, -236.4, 17.6); I(w, 'sx_diary', -238.6, 0.2, 16.2, 1.7, '📓 Peek at the notebook');
  // Ghostifier booth #2
  ghostPod(w, K, -258, 9, r.id, 0); I(w, 'sx_ghost', -256.2, 0.2, 10.2, 1.9, '👻 Ghostifier: Spooky Mode 2.0');
  for (let i = 0; i < 3; i++) K.serverRack(w, -261.3, 15 + i * 1.0, PI / 2); K.whiteboard(w, 'x', 31.85, -247, 2.2, 3.6, -1); }
function core(w, K, TH) { const r = D.RM.u_gw_core; w.region = r.id; const cx = -310, cz = 0;
  w.add('x', K.cyl(48), 0x334155, cx, F0, cz, 0, 0, 0, 4.2, 0.35, 4.2); w.add('l', K.torus(0.06, 48), GOO, cx, F0 + 0.37, cz, PI / 2, 0, 0, 3.9, 3.9, 3.9); w.add('x', K.cyl(32), 0x475569, cx, F0 + 0.35, cz, 0, 0, 0, 1.6, 0.5, 1.6); w.solid(cx - 3.2, 0, cz - 3.2, cx + 3.2, 0.35, cz + 3.2);
  w.add('e', K.cyl(32), 0xd8fbff, cx, F0 + 0.85, cz, 0, 0, 0, 1.5, 4.6, 1.5); w.add('x', K.cyl(32), 0x475569, cx, F0 + 5.45, cz, 0, 0, 0, 1.7, 0.4, 1.7); w.add('x', K.cyl(16), 0x334155, cx, F0 + 5.85, cz, 0, 0, 0, 0.5, r.h - 5.85, 0.5); w.solid(cx - 1.6, 0, cz - 1.6, cx + 1.6, 5.8, cz + 1.6);
  for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2 + PI / 4; w.add('x', K.rbox(0.35, 5.6, 0.35, 0.05), 0x64748b, cx + Math.cos(a) * 2.4, F0 + 3.15, cz + Math.sin(a) * 2.4); w.add('l', K.rbox(0.08, 4.8, 0.08, 0.02), GOO2, cx + Math.cos(a) * 2.2, F0 + 3.0, cz + Math.sin(a) * 2.2); }
  // railing ring
  for (let i = 0; i < 20; i++) { const a = i / 20 * PI * 2; if (Math.abs(Math.cos(a) - 1) < 0.06) continue; w.add('x', K.cyl(8), 0x94a3b8, cx + Math.cos(a) * 4.0, F0 + 0.35, cz + Math.sin(a) * 4.0, 0, 0, 0, 0.04, 1.0, 0.04); } w.add('x', K.torus(0.02, 64), 0x94a3b8, cx, F0 + 1.35, cz, PI / 2, 0, 0, 4.0, 4.0, 4.0);
  LP(w, { x: cx, y: 3, z: cz, c: GOO, i: 14, d: 16 }); sign(w, K, 'THE GLOW CORE  EST 1926', cx, 6.5, -15.75, 0, 0.3);
  // the Case Board (cork, pinned papers, red strings)
  w.add('m', K.rbox(5.4, 2.6, 0.1, 0.04), 0xb45309, -302, 2.4, 15.75); w.add('m', K.rbox(5.6, 2.8, 0.06, 0.03), 0x5b3a1e, -302, 2.4, 15.8);
  const pins = [[-304, 3.2], [-301.6, 3.3], [-299.8, 2.9], [-303.3, 1.8], [-300.6, 1.7], [-302.2, 2.4]]; pins.forEach(([x, y], i) => { w.add('m', K.rbox(0.7, 0.5, 0.02, 0.005), [0xfef3c7, 0xffffff, 0xfde68a][i % 3], x, y, 15.68); w.add('g', K.sph(8), 0xef4444, x, y + 0.2, 15.66, 0, 0, 0, 0.05); });
  for (let i = 0; i < pins.length - 1; i++) { const [x1, y1] = pins[i], [x2, y2] = pins[5]; const L = Math.hypot(x2 - x1, y2 - y1); if (L < 0.1) continue; w.add('m', K.cyl(4), 0xdc2626, (x1 + x2) / 2, (y1 + y2) / 2 + 0.2, 15.65, 0, 0, Math.atan2(x1 - x2, y2 - y1), 0.012, L, 0.012); }
  sign(w, K, 'CASE BOARD', -302, 4.0, 15.68, PI, 0.2, 0xffffff, 0x7c2d12); I(w, 'sx_case', -302, 0.2, 14.0, 2.0, '🧩 Case Board: solve the mystery');
  // the founder's old desk + bust
  K.desk(w, -320, 10, PI / 2, { L: 2.4, top: 0x5b3a1e }); K.chair(w, -321.4, 0, 10, PI / 2, 0x7c2d12); K.lamp(w, -320.4, 11.4); w.add('m', K.rbox(0.5, 0.05, 0.36, 0.01), 0xfef3c7, -319.8, 0.88, 9.6, 0, 0.3, 0);
  w.slab('m', 0x9ca3af, -316, F0, 13.6, 0.8, 1.2, 0.8, 0.04); { const T = w.tf(-316, F0 + 1.2, 13.6, PI); T.add('m', K.sph(16), 0xcbd5e1, 0, 0.55, 0, 0, 0, 0, 0.3, 0.36, 0.3); T.add('m', K.capsule(12), 0xcbd5e1, 0, 0.12, 0, 0, 0, PI / 2, 0.2, 0.5, 0.2); [-1, 1].forEach((d) => T.add('m', K.capsule(10), 0xcbd5e1, d * 0.12, 0.45, 0.27, 0, 0, d * 1.2, 0.05, 0.16, 0.05)); }
  // Gloopy's nest of pipes (Gloopy himself is animated)
  for (let i = 0; i < 5; i++) w.add('x', K.cyl(16), [0x475569, 0x334155][i % 2], -320 + i * 0.7, F0, -12.5 + (i % 2) * 0.5, 0, 0, 0, 0.25, 0.6 + (i % 3) * 0.3, 0.25); w.add('l', K.cyl(24), GOO2, -317.6, F0 + 0.01, -10.8, 0, 0, 0, 1.3, 0.01, 0.9); K.rug(w, -317.6, -10.8, 0, 2.2, 1.6, 0x14532d, GOO);
  for (let i = 0; i < 6; i++) { const T = w.tf(-295 - (i % 3) * 1.1, F0, -14 + (i >> 1) * 0.0 + (i > 2 ? 1.1 : 0), 0); T.slab('x', 0x1f2937, 0, 0, 0, 0.9, 2.2, 0.9, 0.05); for (let k = 0; k < 5; k++) T.add('l', K.sph(6), [GOO, 0x38bdf8][k % 2], -0.3 + k * 0.15, 1.8, 0.46, 0, 0, 0, 0.03); } w.solid(-297.8, 0, -14.5, -294.5, 2.2, -12.4); }
// ================================================================== characters
const SCI = [ // [hair, coat, extra]  0 Ivy 1 Fizz 2 Gus 3 Dusty 4 Mabel 5 Volt 6 Bones, 7+ night shift
  [0x7c3aed, 0xf8fafc, 'bun'], [0x22c55e, 0xfacc15, 'mohawk'], [0x78350f, 0x1d4ed8, 'hardhat'], [0xd1d5db, 0x92400e, 'glasses'], [0x374151, 0x166534, 'cap'], [0xfacc15, 0xf8fafc, 'spiky'], [0xf5f5f4, 0x1e3a8a, 'skull'],
  [0xf8fafc, 0xf8fafc, 'wild'], [0xea580c, 0xf8fafc, 'wild'], [0x111827, 0xe2e8f0, 'bun'], [0x9ca3af, 0xf8fafc, 'spiky'], [0x60a5fa, 0xf8fafc, 'wild'], [0xf472b6, 0xf1f5f9, 'mohawk']];
const sciCache = new Map();
export function makeSci(v) { v = v % SCI.length; let g0 = sciCache.get(v); if (!g0) { const [hc, coat, ex] = SCI[v], skin = ex === 'skull' ? 0xf5f5f4 : [0xffe0c7, 0xe0a87c, 0xc68658, 0xf5c9a4][v % 4], b = MB();
    [-1, 1].forEach((d) => { b.f.add(P.capsule, 0x1f2937, d * 0.11, 0.42, 0, 0, 0, 0, 0.13, 0.36, 0.13); b.g.add(P.sphere, 0x111827, d * 0.11, 0.06, 0.05, 0, 0, 0, 0.1, 0.07, 0.15); });
    b.f.add(P.cyl, coat, 0, 0.92, 0, 0, 0, 0, 0.32, 0.9, 0.26); b.f.add(P.sphere, coat, 0, 1.36, 0, 0, 0, 0, 0.33, 0.14, 0.27); b.f.add(P.rbox, 0x0ea5e9, 0, 1.12, 0.24, 0, 0, 0, 0.14, 0.4, 0.04); if (coat === 0xf8fafc || coat === 0xf1f5f9 || coat === 0xe2e8f0) b.g.add(P.rbox, 0x60a5fa, -0.17, 1.15, 0.26, 0, 0, 0, 0.09, 0.05, 0.02);
    [-1, 1].forEach((d) => { b.f.add(P.capsule, coat, d * 0.38, 1.0, 0, 0, 0, d * 0.25, 0.12, 0.4, 0.12); b.g.add(P.sphere, ex === 'skull' ? 0xf5f5f4 : skin, d * 0.46, 0.68, 0.02, 0, 0, 0, 0.08); });
    b.g.add(P.cyl, skin, 0, 1.48, 0, 0, 0, 0, 0.08, 0.1, 0.08); b.g.add(P.sphere, skin, 0, 1.7, 0, 0, 0, 0, 0.24, 0.25, 0.23);
    if (ex === 'skull') { [-1, 1].forEach((d) => b.g.add(P.sphere, 0x111827, d * 0.085, 1.74, 0.18, 0, 0, 0, 0.065, 0.075, 0.04)); b.g.add(P.rbox, 0x111827, 0, 1.6, 0.21, 0, 0, 0, 0.14, 0.03, 0.02); b.f.add(P.cyl, 0x1e3a8a, 0, 1.92, 0, 0, 0, 0, 0.24, 0.1, 0.24); b.f.add(P.cyl, 0x1e3a8a, 0, 1.87, 0.1, 0.2, 0, 0, 0.2, 0.03, 0.22); b.x.add(P.sphere, 0xfacc15, 0, 1.94, 0.23, 0, 0, 0, 0.05, 0.05, 0.02); }
    else { [-1, 1].forEach((d) => { b.g.add(P.sphere, 0xffffff, d * 0.085, 1.74, 0.19, 0, 0, 0, 0.055, 0.065, 0.03); b.g.add(P.sphere, 0x1b1b24, d * 0.085, 1.735, 0.215, 0, 0, 0, 0.03, 0.038, 0.015); }); b.g.add(P.sphere, 0xf87171, 0, 1.62, 0.21, 0, 0, 0, 0.05, 0.025, 0.02);
      if (ex === 'glasses') [-1, 1].forEach((d) => b.x.add(P.torus, 0x111827, d * 0.085, 1.74, 0.22, 0, 0, 0, 0.07, 0.07, 0.07));
      else { b.x.add(P.torus, 0x374151, 0, 1.86, 0, PI / 2, 0, 0, 0.245, 0.245, 0.14); [-1, 1].forEach((d) => { b.x.add(P.cyl, 0x374151, d * 0.09, 1.88, 0.2, PI / 2, 0, 0, 0.075, 0.06, 0.075); b.l.add(P.cyl, [GOO, 0x38bdf8, 0xa855f7][v % 3], d * 0.09, 1.88, 0.235, PI / 2, 0, 0, 0.06, 0.01, 0.06, 0.4); }); }
      const H = (x, y, z, s) => b.f.add(P.sphere, hc, x, y, z, 0, 0, 0, s, s, s);
      if (ex === 'wild') { for (let i = 0; i < 9; i++) { const a = PI * 0.15 + i / 8 * PI * 0.7; H(Math.cos(a) * 0.26 * (i % 2 ? 1 : -1), 1.8 + Math.sin(a) * 0.08, -0.05 - (i % 3) * 0.06, 0.11); } H(0, 1.9, -0.08, 0.16); }
      if (ex === 'bun') { H(0, 1.83, -0.04, 0.24); H(0, 2.02, -0.1, 0.13); [-1, 1].forEach((d) => H(d * 0.2, 1.7, -0.08, 0.1)); }
      if (ex === 'spiky') for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2.2; b.f.add(P.cone, hc, Math.sin(a) * 0.16, 1.98, Math.cos(a) * 0.04 - 0.06, -0.2, 0, -a * 0.5, 0.06, 0.22, 0.06); }
      if (ex === 'mohawk') for (let i = 0; i < 5; i++) b.f.add(P.cone, hc, 0, 1.95 + Math.sin(i / 4 * PI) * 0.04, 0.12 - i * 0.08, -0.3 + i * 0.15, 0, 0, 0.05, 0.2, 0.08);
      if (ex === 'hardhat') { b.g.add(P.sphere, 0xfacc15, 0, 1.88, 0, 0, 0, 0, 0.26, 0.17, 0.26); b.g.add(P.cyl, 0xfacc15, 0, 1.86, 0.04, 0, 0, 0, 0.31, 0.03, 0.31); }
      if (ex === 'glasses') { H(-0.2, 1.8, -0.06, 0.12); H(0.2, 1.8, -0.06, 0.12); H(0, 1.88, -0.12, 0.13); }
      if (ex === 'cap') { b.f.add(P.sphere, 0x166534, 0, 1.86, 0, 0, 0, 0, 0.25, 0.14, 0.25); b.f.add(P.rbox, 0x166534, 0, 1.84, 0.24, 0, 0, 0, 0.28, 0.03, 0.18); b.g.add(P.rbox, 0xfef3c7, 0.18, 1.0, 0.26, 0, 0, 0, 0.14, 0.18, 0.02); } }
    g0 = toGroup(b); sciCache.set(v, g0); }
  const root = new THREE.Group(), body = g0.clone(); root.add(body); return { root, body, t: Math.random() * 6, ghost: false }; }
// ------------------------------------------------------------------ skins on the player (overlays on the human rig parts)
const skinMade = new WeakMap();
export function applySkin(rig, id) { if (!rig || !rig.human) return; const old = skinMade.get(rig); if (old) { old.forEach((m) => m.parent && m.parent.remove(m)); } const list = []; skinMade.set(rig, list); rig.body.children.forEach((c) => { c.visible = true; });
  rig.head.visible = true; if (!id || id === 'none' || id === 'ghost') return; const add = (par, b) => { const g = toGroup(b); par.add(g); list.push(g); };
  const C = { labcoat: [0xf8fafc, 0x1f2937, 0xf8fafc], hazmat: [0xfacc15, 0x111827, 0xfacc15], guard: [0x1e3a8a, 0x111827, 0x1e3a8a], sludge: [GOO2, 0x166534, GOO2], tester: [0xfacc15, 0x111827, 0xfacc15], phantom: [0xe9d5ff, 0xc4b5fd, 0xe9d5ff] }[id]; if (!C) return;
  const [coat, pant, sleeve] = C, em = id === 'sludge' || id === 'phantom' ? 0.35 : 0;
  { const b = MB(), k = id === 'labcoat' || id === 'phantom' ? 'f' : 'g'; b[k].add(P.capsule, coat, 0, 1.1, 0, 0, 0, 0, 0.54, 0.32, 0.38, em); b[k].add(P.sphere, coat, 0, 1.37, 0, 0, 0, 0, 0.3, 0.09, 0.22, em);
    if (id === 'labcoat' || id === 'phantom') { b.f.add(P.cyl, coat, 0, 0.7, 0, 0, 0, 0, 0.3, 0.45, 0.24, em); b.g.add(P.rbox, 0x60a5fa, -0.14, 1.18, 0.2, 0, 0, 0, 0.08, 0.05, 0.02); b.g.add(P.rbox, 0x0ea5e9, 0, 1.12, 0.205, 0, 0, 0, 0.12, 0.34, 0.02); }
    if (id === 'hazmat') { b.m.add(P.rbox, 0x111827, 0, 1.05, 0.22, 0, 0, 0, 0.22, 0.22, 0.02); b.l.add(P.sphere, 0xfacc15, 0, 1.05, 0.235, 0, 0, 0, 0.06, 0.06, 0.01); b.x.add(P.cyl, 0x9ca3af, 0, 1.15, -0.32, 0, 0, 0, 0.12, 0.45, 0.12); }
    if (id === 'guard') { b.x.add(P.sphere, 0xfacc15, -0.15, 1.22, 0.21, 0, 0, 0, 0.05, 0.06, 0.02); b.m.add(P.cyl, 0x111827, 0, 0.88, 0, 0, 0, 0, 0.27, 0.06, 0.2); b.x.add(P.cyl, 0x9ca3af, 0.24, 0.84, 0.08, 0, 0, 0, 0.04, 0.18, 0.04); }
    if (id === 'tester') { b.m.add(P.cyl, 0x111827, 0, 1.12, 0.21, PI / 2, 0, 0, 0.14, 0.01, 0.14); b.g.add(P.cyl, 0xfacc15, 0, 1.12, 0.215, PI / 2, 0, 0, 0.08, 0.01, 0.08); }
    if (id === 'sludge') for (let i = 0; i < 6; i++) b.l.add(P.sphere, GOO, Math.cos(i * 1.1) * 0.27, 0.95 + (i % 3) * 0.15, Math.sin(i * 1.1) * 0.2, 0, 0, 0, 0.07, 0.12, 0.07, 0.3);
    add(rig.body, b); }
  rig.legs.forEach((L) => { const b = MB(); b.g.add(P.capsule, pant, 0, -0.36, 0, 0, 0, 0, 0.215, 0.35, 0.215, id === 'sludge' ? 0.25 : 0); if (id === 'hazmat' || id === 'guard' || id === 'tester') b.g.add(P.sphere, 0x111827, 0, -0.76, 0.05, 0, 0, 0, 0.13, 0.09, 0.2); add(L, b); });
  rig.arms.forEach((A) => { const b = MB(); b.f.add(P.capsule, sleeve, 0, -0.2, 0, 0, 0, 0, 0.16, 0.26, 0.16, em); if (id === 'hazmat' || id === 'sludge') b.g.add(P.sphere, id === 'hazmat' ? 0x111827 : GOO, 0, -0.5, 0.01, 0, 0, 0, 0.09, 0.095, 0.085, em); add(A, b); });
  { const b = MB();
    if (id === 'labcoat') { for (let i = 0; i < 7; i++) { const a = PI * 0.2 + i / 6 * PI * 0.6; b.f.add(P.sphere, 0xf8fafc, Math.cos(a) * 0.3 * (i % 2 ? 1 : -1), 0.42 + Math.sin(a) * 0.06, -0.05, 0, 0, 0, 0.1, 0.1, 0.1); } b.x.add(P.torus, 0x374151, 0, 0.46, 0, PI / 2, 0, 0, 0.29, 0.29, 0.15); [-1, 1].forEach((d) => b.l.add(P.cyl, GOO, d * 0.1, 0.48, 0.25, PI / 2, 0, 0, 0.07, 0.02, 0.07, 0.4)); }
    if (id === 'phantom') { b.l.add(P.sphere, 0xe9d5ff, 0, 0.27, 0, 0, 0, 0, 0.3, 0.31, 0.29, 0.25); [-1, 1].forEach((d) => b.g.add(P.sphere, 0x1b1424, d * 0.1, 0.3, 0.25, 0, 0, 0, 0.06, 0.09, 0.03)); b.g.add(P.sphere, 0x1b1424, 0, 0.16, 0.27, 0, 0, 0, 0.05, 0.07, 0.02); b.x.add(P.torus, 0x374151, 0, 0.46, 0, PI / 2, 0, 0, 0.3, 0.3, 0.15); }
    if (id === 'hazmat') { b.e.add(P.sphere, 0xe0f2fe, 0, 0.27, 0.02, 0, 0, 0, 0.36, 0.38, 0.36); b.g.add(P.torus, 0xfacc15, 0, -0.04, 0, PI / 2, 0, 0, 0.3, 0.3, 0.3); }
    if (id === 'guard') { b.f.add(P.cyl, 0x1e3a8a, 0, 0.5, 0, 0, 0, 0, 0.29, 0.12, 0.29); b.f.add(P.cyl, 0x111827, 0, 0.45, 0.12, 0.2, 0, 0, 0.24, 0.03, 0.26); b.x.add(P.sphere, 0xfacc15, 0, 0.52, 0.29, 0, 0, 0, 0.06, 0.06, 0.02); }
    if (id === 'tester') { b.g.add(P.sphere, 0xfacc15, 0, 0.27, 0, 0, 0, 0, 0.29, 0.3, 0.28); [-1, 1].forEach((d) => { b.m.add(P.cyl, 0x111827, d * 0.29, 0.27, 0, 0, 0, PI / 2, 0.08, 0.01, 0.08); }); b.m.add(P.rbox, 0x111827, 0, 0.27, 0.28, 0, 0, 0, 0.02, 0.4, 0.01); }
    if (id === 'sludge') { b.l.add(P.sphere, GOO2, 0, 0.27, 0, 0, 0, 0, 0.3, 0.31, 0.29, 0.2); [-1, 1].forEach((d) => { b.g.add(P.sphere, 0xffffff, d * 0.11, 0.36, 0.22, 0, 0, 0, 0.09, 0.1, 0.07); b.g.add(P.sphere, 0x111827, d * 0.11, 0.36, 0.29, 0, 0, 0, 0.045, 0.05, 0.02); }); for (let i = 0; i < 5; i++) b.l.add(P.sphere, GOO, -0.2 + i * 0.1, 0.05 - (i % 2) * 0.05, 0.2, 0, 0, 0, 0.04, 0.09, 0.04, 0.3); }
    add(rig.head, b); } }
// a cute see-through ghost (Spooky Mode 2.0); the walking human rig hides while you're a ghost
let GHOSTG = null; function ghostGeo() { if (GHOSTG) return GHOSTG; const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(new THREE.Vector2(Math.sin(t * PI * 0.55 + 0.3) * 0.5 * (1 - t * 0.12) + 0.0001, t * 1.45)); } pts.push(new THREE.Vector2(0, 1.58));
  const g = new THREE.LatheGeometry(pts, 28); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < 0.05) { const a = Math.atan2(p.getZ(i), p.getX(i)); p.setY(i, 0.07 * Math.sin(a * 7)); } g.computeVertexNormals(); return (GHOSTG = g); }
function makeGhost() { const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: 0xf5f3ff, emissive: 0x6d28d9, emissiveIntensity: 0.25, roughness: 0.4, transparent: true, opacity: 0.88 }); const body = new THREE.Mesh(ghostGeo(), mat); g.add(body);
  const dk = new THREE.MeshBasicMaterial({ color: 0x1b1424 }); [-1, 1].forEach((d) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), dk); e.scale.set(1, 1.35, 0.5); e.position.set(d * 0.16, 1.18, 0.42); g.add(e); const arm = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), mat); arm.scale.set(1, 2.1, 1); arm.position.set(d * 0.5, 0.8, 0.08); arm.rotation.z = d * 0.7; g.add(arm); });
  const mo = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), dk); mo.scale.set(1, 1.2, 0.5); mo.position.set(0, 0.96, 0.46); g.add(mo); g.userData = { mat, mo }; return g; }
// ================================================================== canvases (real aspect: the plane is always W x W*ch/cw)
function drawMap(x, t) { const W = 1024, H = 480, X = S.sx; x.fillStyle = '#06140c'; x.fillRect(0, 0, W, H); x.fillStyle = '#39ff6a'; x.font = 'bold 34px system-ui'; x.fillText('THE GLOOMWORKS · SUB-LEVEL 13', 26, 46);
  const mx = (v) => 40 + (v + 326) / 116 * 600, mz = (v) => 260 + v * 5.6; x.lineWidth = 3;
  for (const r of D.ROOMS) { const here = r.id === (SC_REG || ''); x.fillStyle = here ? '#14532d' : '#0b2a17'; x.strokeStyle = '#39ff6a'; x.fillRect(mx(r.x0), mz(r.z0), mx(r.x1) - mx(r.x0), mz(r.z1) - mz(r.z0)); x.strokeRect(mx(r.x0), mz(r.z0), mx(r.x1) - mx(r.x0), mz(r.z1) - mz(r.z0));
    x.fillStyle = '#bbf7d0'; x.font = 'bold 15px system-ui'; const nm = r.name.replace(/^\S+\s/, ''); x.fillText(nm.length > 18 ? nm.slice(0, 17) + '…' : nm, mx(r.x0) + 6, mz((r.z0 + r.z1) / 2) + 5); }
  if ((t * 2 | 0) % 2) { x.fillStyle = '#facc15'; x.beginPath(); x.arc(mx(-222), mz(0), 9, 0, PI * 2); x.fill(); x.font = 'bold 14px system-ui'; x.fillText('YOU ARE HERE', mx(-222) - 46, mz(0) - 16); }
  x.fillStyle = '#39ff6a'; x.font = 'bold 26px system-ui'; x.fillText('CASE NOTES', 680, 96); x.font = '19px system-ui';
  D.CLUE_IDS.forEach((k, i) => { x.fillStyle = X.clues[k] ? '#bbf7d0' : '#4b6b57'; x.fillText((X.clues[k] ? '✔ ' : '? ') + (X.clues[k] ? D.CLUES[k][0].replace(/^\S+\s/, '') : '?????'), 680, 136 + i * 34); });
  x.fillStyle = X.done.solved ? '#39ff6a' : '#facc15'; x.font = 'bold 20px system-ui'; x.fillText(X.done.solved ? 'CASE CLOSED!' : 'CASE OPEN', 680, 360); x.fillStyle = '#9ca3af'; x.font = '17px system-ui'; const st = D.step(); x.fillText(st.length > 34 ? st.slice(0, 33) + '…' : st, 680, 392); x.fillText(`Glow Vials ${X.vials.length}/8`, 680, 424); }
function drawTests(x, t) { const W = 1024, H = 330; x.fillStyle = '#071018'; x.fillRect(0, 0, W, H); x.fillStyle = '#39ff6a'; x.font = 'bold 30px system-ui'; x.fillText('SPOOKY TEST STATUS', 24, 42);
  const T = [['A  FOG FRIGHT', 0.62 + Math.sin(t) * 0.2], ['B  GROWTH RAY', 0.5 + Math.sin(t * 0.7) * 0.4], ['C  SHADOW BOX', 0.35 + Math.sin(t * 1.3 + 1) * 0.15], ['D  GLOW TEST', S.sx.done.forever ? 1 : 0.8 + Math.sin(t * 2) * 0.1]];
  T.forEach(([n, v], i) => { const y = 84 + i * 56; x.fillStyle = '#cbd5e1'; x.font = 'bold 22px system-ui'; x.fillText(n, 24, y + 22); x.fillStyle = '#1f2937'; x.fillRect(300, y, 560, 30); x.fillStyle = v > 0.85 ? '#39ff6a' : v > 0.5 ? '#facc15' : '#38bdf8'; x.fillRect(300, y, 560 * Math.max(0, Math.min(1, v)), 30); x.fillStyle = '#fff'; x.fillText(Math.round(v * 100) + '%', 880, y + 24); });
  x.fillStyle = '#9ca3af'; x.font = '18px system-ui'; x.fillText(S.sx.done.tests ? 'TEST #413 PASSED · thank you, volunteer!' : 'TEST #413 waiting for a volunteer at the console', 24, H - 14); }
function drawPortrait(x) { const W = 512, H = 640; const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3b2a1a'); g.addColorStop(1, '#1c130b'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = '#4a3527'; x.beginPath(); x.ellipse(256, 600, 210, 190, 0, PI, 0); x.fill(); x.fillStyle = '#f8fafc'; x.beginPath(); x.ellipse(256, 520, 150, 150, 0, PI * 1.15, PI * 1.85); x.fill(); // lab coat collar
  x.fillStyle = '#f1c9a0'; x.beginPath(); x.ellipse(256, 300, 115, 140, 0, 0, PI * 2); x.fill(); x.fillStyle = '#e8e8e8'; for (let i = 0; i < 10; i++) { const a = PI * 0.95 + i / 9 * PI * 1.1; x.beginPath(); x.arc(256 + Math.cos(a) * 125, 270 + Math.sin(a) * 120, 38, 0, PI * 2); x.fill(); }
  x.fillStyle = '#d6d3d1'; x.beginPath(); x.ellipse(256, 372, 80, 26, 0, 0, PI); x.fill(); x.beginPath(); x.ellipse(206, 352, 52, 16, -0.25, 0, PI * 2); x.fill(); x.beginPath(); x.ellipse(306, 352, 52, 16, 0.25, 0, PI * 2); x.fill(); // moustache
  x.strokeStyle = '#1f2937'; x.lineWidth = 7; [196, 316].forEach((cx) => { x.beginPath(); x.arc(cx, 290, 34, 0, PI * 2); x.stroke(); x.fillStyle = '#39ff6a55'; x.fill(); x.fillStyle = '#111'; x.beginPath(); x.arc(cx, 292, 9, 0, PI * 2); x.fill(); }); x.beginPath(); x.moveTo(230, 290); x.lineTo(282, 290); x.stroke();
  x.fillStyle = '#39ff6a'; x.beginPath(); x.arc(420, 520, 28, 0, PI * 2); x.fill(); x.fillStyle = '#d4a017'; x.font = 'bold 30px Georgia'; x.fillText('1926', 30, 620); }
// ================================================================== runtime
import { animFolk } from './folk.js?v=ph12';
let ST = null, SC_REG = '';
const roomOf = (x, z) => { for (const r of D.ROOMS) if (x >= r.x0 - 0.2 && x <= r.x1 + 0.2 && z >= r.z0 - 0.2 && z <= r.z1 + 0.2) return r.id; return null; };
function mkMesh(geo, col, em) { return new THREE.Mesh(geo, em ? new THREE.MeshBasicMaterial({ color: col, toneMapped: false }) : new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 })); }
function init(w, G) { ST = { t: 0, screens: [], H: [], nextPuff: 0, nextSpark: 0 }; const sc = G.scene; G.spookClue = (k) => addClue(G, k); G.spookSkin = (id) => setSkin(G, id); G.spookGhost = () => !!SP.on;
  if (S.sx.skin && S.sx.skin !== 'none' && S.sx.skins[S.sx.skin]) applySkin(G.me.rig, S.sx.skin);
  // goo bubbles in the surface pools (one instanced draw call)
  { const N = 40, im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 7), new THREE.MeshBasicMaterial({ color: 0x7dff9a, toneMapped: false }), N); im.frustumCulled = false; const B = [];
    for (let i = 0; i < N; i++) { const p = D.POOLS[i % D.POOLS.length], a = Math.random() * PI * 2, r = Math.sqrt(Math.random()) * 0.75; B.push({ x: p[0] + Math.cos(a) * p[2] * r, z: p[1] + Math.sin(a) * p[3] * r, ph: Math.random(), sp: 0.35 + Math.random() * 0.4 }); }
    ST.bub = im; ST.B = B; sc.add(im); }
  if (!D.OWN) return;
  for (const s of SCREENS) { const cv = document.createElement('canvas'); cv.width = s.cw; cv.height = s.ch; const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 2;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s.W, s.H), new THREE.MeshBasicMaterial({ map: tx, toneMapped: false })); m.position.set(s.x, s.y, s.z); m.rotation.y = s.ry; m.visible = false; sc.add(m); const o = { s, cv, x: cv.getContext('2d'), tx, m, last: -9 }; if (s.once) { s.draw(o.x, 0); tx.needsUpdate = true; o.done = true; } ST.screens.push(o); }
  // the Glow Core orb + swirl ring
  ST.orb = mkMesh(new THREE.SphereGeometry(1, 28, 18), 0x6dff8e, true); ST.orb.position.set(-310, UY + 3.1, 0); sc.add(ST.orb); ST.ring = mkMesh(new THREE.TorusGeometry(1.25, 0.05, 8, 48), 0xd9ffe4, true); ST.ring.position.copy(ST.orb.position); sc.add(ST.ring);
  // Test B: the growing pumpkin (base sits on the pedestal top)
  { const g = new THREE.Group(), m1 = new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.45 }), m2 = new THREE.MeshStandardMaterial({ color: 0xf06a10, roughness: 0.45 }), sg = new THREE.SphereGeometry(1, 16, 12);
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2, m = new THREE.Mesh(sg, i % 2 ? m1 : m2); m.scale.set(0.38, 0.5, 0.28); m.position.set(Math.cos(a) * 0.28, 0.5, Math.sin(a) * 0.28); m.rotation.y = -a; g.add(m); }
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x4a6a22 })); st.position.y = 1.08; g.add(st); g.position.set(-281.4, UY + 0.52 + 0.025, -29.8); ST.pump = g; sc.add(g); }
  // Gloopy (a friendly goo blob, born in Test Chamber 7)
  { const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: 0x39ff6a, emissive: 0x0f7a2a, emissiveIntensity: 0.6, roughness: 0.2, transparent: true, opacity: 0.85 }); const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), mat); b.scale.set(1, 0.8, 1); b.position.y = 0.4; g.add(b);
    const wh = new THREE.MeshBasicMaterial({ color: 0xffffff }), bk = new THREE.MeshBasicMaterial({ color: 0x111827 }); [-1, 1].forEach((d) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), wh); e.position.set(d * 0.17, 0.62, 0.36); g.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 6), bk); p.position.set(d * 0.17, 0.62, 0.46); g.add(p); });
    const mo = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 6, 16, PI), bk); mo.position.set(0, 0.46, 0.44); mo.rotation.z = PI; g.add(mo); g.position.set(-317.6, UY + 0.03, -10.8); g.userData.b = b; ST.gloopy = g; sc.add(g); }
  // Glow Vials
  { const vg = new THREE.CylinderGeometry(0.09, 0.11, 0.34, 12); vg.translate(0, 0.17, 0); const im = new THREE.InstancedMesh(vg, new THREE.MeshBasicMaterial({ color: 0x6dff8e, toneMapped: false }), D.VIALS.length); im.frustumCulled = false; ST.vial = im; sc.add(im); }
  // hauntable props (Spooky Mode 2.0): they stand on the floor and only move while haunted
  const HP = [['chair', -216.5, -3.5], ['bucket', -250, 2.7], ['cone', -276, -2.7], ['skeleton', -264.6, -9.5], ['barrel', -244, -16], ['cart', -270, 28], ['rack', -244, 26.5], ['cart', -298, 8], ['chair', -284, -12]];
  for (const [k, x, z] of HP) { const b = MB(); const C = (g, c, ...a) => b.g.add(g, c, ...a);
    if (k === 'chair') { C(P.cyl, 0x111827, 0, 0.05, 0, 0, 0, 0, 0.3, 0.06, 0.3); C(P.cyl, 0x6b7280, 0, 0.27, 0, 0, 0, 0, 0.04, 0.4, 0.04); C(P.rbox, 0x14532d, 0, 0.5, 0, 0, 0, 0, 0.5, 0.1, 0.5); C(P.rbox, 0x14532d, 0, 0.85, -0.23, 0, 0, 0, 0.5, 0.6, 0.08); }
    if (k === 'bucket') { C(P.cyl, 0xfacc15, 0, 0.2, 0, 0, 0, 0, 0.25, 0.4, 0.25); C(P.cyl, 0x9a6a3e, 0.08, 0.9, 0, 0, 0, 0.12, 0.025, 1.4, 0.025); C(P.sphere, 0xe5e7eb, 0.0, 0.32, 0, 0, 0, 0, 0.16, 0.08, 0.16); }
    if (k === 'cone') { C(P.cone, 0xff7a1a, 0, 0.3, 0, 0, 0, 0, 0.2, 0.6, 0.2); C(P.rbox, 0xff7a1a, 0, 0.02, 0, 0, 0, 0, 0.45, 0.04, 0.45); }
    if (k === 'skeleton') { C(P.cyl, 0x334155, 0, 0.03, 0, 0, 0, 0, 0.3, 0.06, 0.3); C(P.cyl, 0x9ca3af, 0, 0.6, 0, 0, 0, 0, 0.03, 1.1, 0.03); C(P.sphere, 0xf5f5f4, 0, 1.55, 0, 0, 0, 0, 0.17, 0.19, 0.17); for (let i = 0; i < 4; i++) C(P.torus, 0xf5f5f4, 0, 1.0 + i * 0.1, 0, PI / 2, 0, 0, 0.16, 0.12, 0.2); [-1, 1].forEach((d) => { C(P.sphere, 0x111827, d * 0.06, 1.58, 0.14, 0, 0, 0, 0.04, 0.05, 0.02); C(P.capsule, 0xf5f5f4, d * 0.22, 1.05, 0, 0, 0, d * 0.25, 0.05, 0.45, 0.05); }); }
    if (k === 'barrel') { C(P.cyl, 0x14532d, 0, 0.5, 0, 0, 0, 0, 0.38, 1.0, 0.38); C(P.torus, 0x111827, 0, 0.3, 0, PI / 2, 0, 0, 0.38, 0.38, 0.3); C(P.torus, 0x111827, 0, 0.75, 0, PI / 2, 0, 0, 0.38, 0.38, 0.3); b.l.add(P.cyl, GOO, 0, 1.01, 0, 0, 0, 0, 0.3, 0.01, 0.3); }
    if (k === 'cart') { C(P.rbox, 0x475569, 0, 0.75, 0, 0, 0, 0, 0.9, 0.06, 0.5); C(P.rbox, 0x475569, 0, 0.3, 0, 0, 0, 0, 0.9, 0.06, 0.5); [-0.4, 0.4].forEach((x2) => [-0.2, 0.2].forEach((z2) => { C(P.cyl, 0x94a3b8, x2, 0.42, z2, 0, 0, 0, 0.02, 0.7, 0.02); C(P.sphere, 0x111827, x2, 0.05, z2, 0, 0, 0, 0.05); })); for (let i = 0; i < 4; i++) C(P.rbox, [0x7c2d12, 0x1e3a8a, 0x14532d, 0x92400e][i], -0.3 + i * 0.2, 0.92, 0, 0, 0, 0, 0.12, 0.28, 0.36); }
    if (k === 'rack') { C(P.rbox, 0x9a6a3e, 0, 0.45, 0, 0, 0, 0, 0.8, 0.05, 0.3); [-0.35, 0.35].forEach((x2) => C(P.cyl, 0x9a6a3e, x2, 0.22, 0, 0, 0, 0, 0.03, 0.45, 0.03)); for (let i = 0; i < 4; i++) { b.e.add(P.cyl, 0xd8fbff, -0.27 + i * 0.18, 0.62, 0, 0, 0, 0, 0.05, 0.3, 0.05); b.l.add(P.cyl, [GOO, 0xa855f7, 0xf472b6, 0x38bdf8][i], -0.27 + i * 0.18, 0.56, 0, 0, 0, 0, 0.045, 0.18, 0.045); } }
    const g = toGroup(b); g.position.set(x, UY + 0.03, z); g.visible = false; sc.add(g); ST.H.push({ k, x, z, g, reg: roomOf(x, z), t: 0 }); }
  if (S.sx.done.solved) addGloopyInter(w); }
function addGloopyInter(w) { if (w.inter.some((o) => o.id === 'sx_gloopy')) return; w.inter.push({ kind: 'hol', id: 'sx_gloopy', x: -317.6, y: UY + 0.2, z: -9.2, r: 2.0, label: S.sx.done.gloopy ? '🟢 Play with Gloopy' : '🟢 Say hello to the valve-opener' }); }
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SV = new THREE.Vector3(), EU = new THREE.Euler();
export function tick(w, dt, G) { const me = G.me; if (!me) return; if (!ST) init(w, G); ST.t += dt; const t = ST.t; const reg = G.region || 'out', inGW = reg.startsWith('u_gw'); SC_REG = reg;
  // surface goo
  const nearSite = !G.under && me.x < -100 && me.z < -100; ST.bub.visible = nearSite; const fixed = S.sx.done.valves && S.sx.done.gloopy;
  if (nearSite) { const B = ST.B; for (let i = 0; i < B.length; i++) { const b = B[i], k = (t * b.sp * (fixed ? 0.3 : 1) + b.ph) % 1, s = (fixed ? 0.04 : 0.07) + Math.sin(k * PI) * (fixed ? 0.05 : 0.13); M4.compose(V.set(b.x, 0.04 + k * 0.12, b.z), Q.identity(), SV.set(s, s * 0.8, s)); ST.bub.setMatrixAt(i, M4); } ST.bub.instanceMatrix.needsUpdate = true;
    if (!fixed && t > ST.nextPuff) { ST.nextPuff = t + 0.35; const p = D.POOLS[(Math.random() * D.POOLS.length) | 0]; for (let i = 0; i < 4; i++) G.fx.emit(p[0] + (Math.random() - 0.5) * p[2], 0.1, p[1] + (Math.random() - 0.5) * p[3], (Math.random() - 0.5) * 0.8, 2.2 + Math.random() * 1.8, (Math.random() - 0.5) * 0.8, 0.09, GOO, 1.1, 5, 0.6); } }
  if (D.OWN) {
    for (const o of ST.screens) { const on = G.vis && G.vis.has(o.s.reg); o.m.visible = on; if (!on || o.done) continue; if (t - o.last < 0.4) continue; o.last = t; o.s.draw(o.x, t); o.tx.needsUpdate = true; }
    const cv = inGW && G.vis.has('u_gw_core'), fv = S.sx.done.forever; ST.orb.visible = ST.ring.visible = cv; if (cv) { const k = 1 + Math.sin(t * (fv ? 3 : 1.6)) * 0.08; ST.orb.scale.setScalar((fv ? 1.15 : 0.95) * k); ST.orb.material.color.setHex(fv ? 0xeafff0 : 0x6dff8e); ST.ring.rotation.set(t * 0.8, t * 1.3, 0); }
    ST.pump.visible = inGW && G.vis.has('u_gw_tests'); if (ST.pump.visible) { const k = 1 + 0.45 * (0.5 - 0.5 * Math.cos(t * 0.6)); ST.pump.scale.setScalar(1.35 * k); }
    ST.gloopy.visible = inGW && G.vis.has('u_gw_core') && !!S.sx.done.solved; if (ST.gloopy.visible) { const b = ST.gloopy.userData.b, h = Math.abs(Math.sin(t * (S.sx.done.gloopy ? 4 : 2))); b.scale.set(1 + (1 - h) * 0.12, 0.8 - (1 - h) * 0.1 + h * 0.08, 1 + (1 - h) * 0.12); ST.gloopy.rotation.y = Math.atan2(me.x - ST.gloopy.position.x, me.z - ST.gloopy.position.z); }
    ST.vial.visible = inGW; if (inGW) { D.VIALS.forEach((p, i) => { const got = S.sx.vials.includes(i); M4.compose(V.set(p[0], p[1] + 0.03, p[2]), Q.setFromEuler(EU.set(0, t * 1.5 + i, 0)), SV.setScalar(got ? 0 : 1)); ST.vial.setMatrixAt(i, M4);
        if (!got && Math.hypot(me.x - p[0], me.z - p[2]) < 1.1 && Math.abs(me.y - p[1]) < 1.6) { S.sx.vials.push(i); persist(); sfx('pop'); G.fx.burst(p[0], p[1] + 0.4, p[2], GOO, 16, 4); G.toastMsg(`🧪 Glow Vial ${S.sx.vials.length}/8`); if (S.sx.vials.length >= D.VIALS.length) { unlockSkin(G, 'guard'); G.badge('vials'); } G.hud.dirty = true; } }); ST.vial.instanceMatrix.needsUpdate = true; }
    if (inGW && t > ST.nextSpark) { ST.nextSpark = t + 0.12; if (G.vis.has('u_gw_lab')) for (const x of [-259, -237]) if (Math.random() < 0.6) { const a = Math.random() * PI * 2; G.fx.emit(x + Math.cos(a) * 0.6, UY + 3.15, 29 + Math.sin(a) * 0.6, Math.cos(a) * 3, 0.5 + Math.random(), Math.sin(a) * 3, 0.05, 0xc7d2fe, 0.25, 0, 3); }
      if (G.vis.has('u_gw_tests') && Math.random() < 0.5) G.fx.emit(-289.6, UY + 0.65, -29.9, 0.6 + Math.random() * 0.6, 0.3, 0.6, 0.35, 0xe5e7eb, 1.6, -0.2, 0.8); }
    for (const h of ST.H) { const on = inGW && G.vis.has(h.reg); h.g.visible = on; if (!on) continue; if (h.t > 0) { h.t -= dt; const k = h.t; h.g.rotation.set(Math.sin(k * 23) * 0.12, h.k === 'chair' ? k * 6 : Math.sin(k * 9) * 0.5, Math.sin(k * 19) * 0.12); h.g.position.y = UY + 0.03 + Math.abs(Math.sin(k * 14)) * 0.18; if (h.t <= 0) { h.g.rotation.set(0, 0, 0); h.g.position.y = UY + 0.03; } } } }
  if (SP.on) spookTick(G, dt); }
// ================================================================== helpers for activities
function result(title, big, sub, done) { panel(`<h2>${title}</h2><p class="clueTx">${big}</p><p class="sub">${sub}</p><button class="go" id="fx">OK</button>`, (c) => { $q(c, '#fx').onclick = () => { sfx('click'); done(); }; }, 'mgP'); }
function addClue(G, k) { const nw = !S.sx.clues[k]; S.sx.clues[k] = 1; persist(); if (nw) { G.toastMsg(`🔍 New clue: ${D.CLUES[k][0]} (${D.CLUE_IDS.filter((q) => S.sx.clues[q]).length}/6)`); sfx('check'); G.hud.dirty = true; } return nw; }
function clueAct(G, k, done) { const nw = addClue(G, k); panel(`<h2>🔍 ${nw ? 'NEW CLUE!' : 'CLUE'}</h2><p class="clueTx">${D.CLUES[k][1]}</p><p class="sub">${D.CLUE_IDS.filter((q) => S.sx.clues[q]).length}/6 clues · the Case Board is in the Glow Core</p><button class="go" id="fx">GOT IT</button>`, (c) => { $q(c, '#fx').onclick = () => { sfx('click'); done(); }; }, 'clueP'); }
function unlockSkin(G, id) { if (S.sx.skins[id]) return; S.sx.skins[id] = 1; persist(); const s = D.SKINS.find((q) => q.id === id); setTimeout(() => G.toastMsg(`🧥 New skin: ${s ? s.n : id}! (Staff lockers or the Style Station)`), 600); sfx('win'); }
function setSkin(G, id) { if (!S.sx.skins[id]) return false; S.sx.skin = id; persist(); applySkin(G.me.rig, id); if (SP.on) G.me.rig.body.visible = false; return true; }
function travel(G, done, p, msg) { done(); G.app.ui.fade(() => { G.me.place([p[0], p[1], p[2]], p[3]); G.cam.yaw = p[3]; G.cam.snap = true; }); sfx('door'); if (msg) setTimeout(() => G.toastMsg(msg), 900); }
function skinPanel(G, done) { const X = S.sx; panel(`<h2>🧥 STAFF LOCKERS</h2><p class="sub">Spookster skins · ${Object.keys(X.skins).length - 1}/6 unlocked</p>${D.SKINS.map((s) => `<button ${WIDE} data-k="${s.id}">${X.skins[s.id] ? (X.skin === s.id ? '✅ ' : '🧥 ') + s.n : '🔒 ' + s.n}<br><small style="opacity:.75;font-weight:normal">${s.how}</small></button>`).join('')}<button class="go" id="fx">DONE</button>`,
  (c) => { $a(c, '[data-k]').forEach((b) => b.onclick = () => { if (!setSkin(G, b.dataset.k)) { sfx('deny'); return; } sfx('buy'); skinPanel(G, done); }); $q(c, '#fx').onclick = () => { sfx('click'); done(); }; }, 'mgP'); }
export function skinButtons() { if (!D.OWN) return ''; const X = S.sx; return `<h3>🧪 SPOOKSTER SKINS</h3><div class="hats">${D.SKINS.map((s) => `<button data-sk="${s.id}" class="${X.skin === s.id ? 'on' : ''} ${X.skins[s.id] ? '' : 'lock'}"><b>${X.skins[s.id] ? s.n : '🔒 ' + s.n}</b><small>${s.how}</small></button>`).join('')}</div>`; }
// ------------------------------------------------------------------ mini-games
function testGame(G, done) { let ok = 0, tries = 0, pos = 0, dir = 1, zone = 0.3, run = true; const start = 0.35;
  const draw = () => panel(`<h2>🎛️ SPOOKY TEST #413</h2><p class="sub">Stop the glow needle inside the green zone · ${ok}/3 calibrated · tries left ${5 - tries}</p><div style="position:relative;height:46px;margin:18px auto;max-width:320px;border-radius:12px;background:#1f2937;overflow:hidden"><div id="zn" style="position:absolute;top:0;bottom:0;left:${start * 100}%;width:${zone * 100}%;background:#22c55e"></div><div id="nd" style="position:absolute;top:-4px;bottom:-4px;width:6px;border-radius:3px;background:#facc15;left:0"></div></div><button class="go" id="st">STOP!</button>`,
    (c) => { $q(c, '#st').onclick = () => { if (!run) return; const hit = pos >= start && pos <= start + zone; tries++; if (hit) { ok++; sfx('pop'); zone *= 0.72; } else sfx('bump'); if (ok >= 3) { run = false; clearInterval(iv); const f = !S.sx.done.tests; S.sx.done.tests = 1; persist(); if (f) unlockSkin(G, 'tester'); return result('🎛️ TEST PASSED!', 'Glow meter calibrated', 'Tester Fizz writes your name in the log: "Volunteer, very steady, a little spooky."', done); } if (tries >= 5) { run = false; clearInterval(iv); return result('🎛️ WOBBLY!', `${ok}/3 calibrated`, 'The needle is slippery. Try again!', done); } draw(); }; }, 'mgP');
  draw(); const iv = setInterval(() => { if (!run) return clearInterval(iv); pos += dir * 0.022 * (1 + ok * 0.35); if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; } const e = document.getElementById('nd'); if (!e) { run = false; return clearInterval(iv); } e.style.left = `calc(${pos * 100}% - 3px)`; }, 30); }
const ARW = ['⬆️', '➡️', '⬇️', '⬅️'], VC = ['#ef4444', '#facc15', '#3b82f6'], VN = ['RED', 'YELLOW', 'BLUE'], GOAL = [2, 3, 0];
function valveGame(G, done) { if (S.sx.done.valves) return result('🔧 VALVES HOLDING', S.sx.done.gloopy ? 'No more leaks!' : 'The valves are right… for now', S.sx.done.gloopy ? 'Gloopy is the official valve guard now. The goo stays in the tanks.' : 'Gus says somebody small keeps turning them back at night. Who could it be?', done);
  const v = [0, 1, 2].map((i) => (GOAL[i] + 1 + ((Math.random() * 3) | 0)) % 4);
  const draw = () => panel(`<h2>🔧 SLUDGE VALVES</h2><p class="sub">Tap a valve to turn it. Pi-rat's chalkboard: RED down, YELLOW left, BLUE up.</p><div>${v.map((a, i) => `<button data-i="${i}" style="font-size:40px;padding:14px;margin:6px;border-radius:50%;border:6px solid ${VC[i]};background:#1f2937;width:92px;height:92px">${ARW[a]}</button>`).join('')}</div><p class="sub">${v.map((a, i) => `${VN[i]} ${a === GOAL[i] ? '✅' : '❌'}`).join(' · ')}</p>`,
    (c) => $a(c, '[data-i]').forEach((b) => b.onclick = () => { const i = +b.dataset.i; v[i] = (v[i] + 1) % 4; sfx('click'); if (v.every((a, k) => a === GOAL[k])) { S.sx.done.valves = 1; persist(); unlockSkin(G, 'hazmat'); G.fx.confetti(G.me.x, G.me.y + 1.5, G.me.z, 40); return result('🔧 GOO REROUTED!', 'The goo flows back into the tanks', S.sx.done.gloopy ? 'The leak up top is fixed for good!' : 'Gus: "Great! But I bet our tiny valve-opener will be back tonight. Squish, squish."', done); } draw(); }), 'mgP');
  draw(); }
function filesGame(G, done) { const E = sh(['🧪', '🎃', '👻', '🦇', '💀', '🔦', '🧪', '🎃', '👻', '🦇', '💀', '🔦']); const open = new Set(), got = new Set(); let first = -1, lock = false, moves = 0;
  const draw = () => panel(`<h2>🗄️ THE OLD FILE DRAWERS</h2><p class="sub">Each label has a twin. Match all 6 pairs to open the BLUEPRINT drawer · moves ${moves}</p><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;max-width:320px;margin:0 auto">${E.map((e, i) => `<button data-i="${i}" style="aspect-ratio:1/1;font-size:30px;border-radius:12px;border:0;background:${got.has(i) ? '#14532d' : '#7c4a1e'};color:#fff">${open.has(i) || got.has(i) ? e : '🗂️'}</button>`).join('')}</div>`,
    (c) => $a(c, '[data-i]').forEach((b) => b.onclick = () => { const i = +b.dataset.i; if (lock || got.has(i) || open.has(i)) return; open.add(i); sfx('click');
      if (first < 0) { first = i; draw(); return; } moves++; if (E[first] === E[i]) { got.add(first); got.add(i); open.clear(); first = -1; sfx('pop'); if (got.size === 12) return clueAct(G, 'blueprint', done); draw(); return; }
      lock = true; draw(); setTimeout(() => { open.clear(); first = -1; lock = false; if (document.querySelector('[data-i]')) draw(); }, 700); }), 'mgP');
  draw(); }
function potionGame(G, done) { const X = S.sx; if (!X.done.gloopy) return result('🧪 NOT YET', 'Dr. Ivy shakes her head', X.done.solved ? 'First go and meet the valve-opener in the Glow Core. The goo has to stay in the tanks!' : 'Dr. Ivy: "The Forever Glow? I have no idea what you mean." (She looks VERY nervous.)', done);
  const ING = ['🟢', '🌙', '🍬', '🦇', '✨', '🎃']; const seq = []; for (let i = 0; i < 6; i++) seq.push((Math.random() * 6) | 0); let i = 0, show = true;
  const draw = (lit) => panel(`<h2>🧪 THE FOREVER GLOW</h2><p class="sub">${show ? 'Watch Dr. Ivy\'s recipe…' : `Repeat the recipe (${i}/6)`}</p><div>${ING.map((b, k) => `<button data-k="${k}" style="font-size:32px;padding:12px;margin:5px;border-radius:16px;border:0;min-width:72px;background:${lit === k ? '#39ff6a' : '#fff3'}">${b}</button>`).join('')}</div>`,
    (c) => { if (show) return; $a(c, '[data-k]').forEach((b) => b.onclick = () => { if (+b.dataset.k === seq[i]) { i++; sfx('pop'); if (i === 6) { const f = !X.done.forever; X.done.forever = 1; persist(); if (f) { G.badge('forever'); G.fx.confetti(G.me.x, G.me.y + 1.5, G.me.z, 90); } return result('✨ THE FOREVER GLOW!', 'The mixture glows brighter than the moon', 'Dr. Ivy: "Great-Grandpa\'s dream, finished at last! The Glow Core will light every street this Halloween." Go and look at the Core!', done); } draw(); } else { sfx('bump'); result('💨 FIZZ!', 'Wrong ingredient', 'A puff of purple smoke. Dr. Ivy\'s hair is now standing straight up. Try again!', done); } }); }, 'mgP');
  let k = 0; const play = () => { if (k >= seq.length * 2) { show = false; draw(); return; } draw(k % 2 ? -1 : seq[k >> 1]); if (!(k % 2)) sfx('click'); k++; setTimeout(play, k % 2 ? 620 : 220); }; play(); }
function caseBoard(G, done) { const X = S.sx, nc = D.CLUE_IDS.filter((k) => X.clues[k]).length;
  if (X.done.solved) return result('🧩 CASE CLOSED', 'Prof. Gourdwick built the Gloomworks in 1926', 'To make a Forever Glow so no kid in Pumpkin Hollow is ever afraid of the dark. Dr. Ivy reopened it as a Halloween surprise, and Gloopy was opening the valves to make friends up top!', done);
  if (nc < 4) return panel(`<h2>🧩 CASE BOARD</h2><p class="sub">${nc}/6 clues pinned. Find at least 4 to solve the case.</p>${D.CLUE_IDS.map((k) => `<p class="clueTx" style="font-size:14px;margin:4px 0">${X.clues[k] ? D.CLUES[k][0] : '❔ ?????'}</p>`).join('')}<p class="sub">Look in the Archive, the Test Chambers, the Sludge Works and Lab B13. And ask Candy up top!</p><button class="go" id="fx">OK</button>`, (c) => { $q(c, '#fx').onclick = () => { sfx('click'); done(); }; }, 'mgP');
  let q = 0; const ask = () => { const [Qt, O, A] = D.CASE[q]; panel(`<h2>🧩 CASE BOARD ${q + 1}/3</h2><p class="clueTx">${Qt}</p>${O.map((o, i) => `<button ${WIDE} data-i="${i}">${o}</button>`).join('')}`, (c) => $a(c, '[data-i]').forEach((b) => b.onclick = () => { if (+b.dataset.i !== A) { sfx('bump'); G.toastMsg('🤔 Hmm, that doesn\'t fit the clues. Look again!'); return; } sfx('check'); q++; if (q < 3) return ask();
    X.done.solved = 1; persist(); G.badge('gloomworks'); G.fx.confetti(G.me.x, G.me.y + 1.5, G.me.z, 120); addGloopyInter(G.world); G.hud.dirty = true;
    panel(`<div class="fin"><h2>🔆 CASE CLOSED!</h2><h3>Who built the Gloomworks, and why?</h3><p>In 1926, <b>Prof. Cornelius Gourdwick</b>, the founder of Pumpkin Hollow, dug a secret lab under the hills to make a <b>Forever Glow</b>: a light that never goes out, so no kid is ever afraid of the dark.</p><p>His great-granddaughter <b>Dr. Ivy Gourdwick</b> reopened the lab to finish it as a Halloween surprise. All those spooky tests make the glow brighter, safer and longer.</p><p>And the green sludge? A tiny goo blob born in Test Chamber 7 kept opening the valves, sending glow-goo up the cracked pipe to make friends up top. <b>He's waiting for you in the Glow Core!</b></p></div><button class="go" id="fx">MEET HIM</button>`, (c2) => { $q(c2, '#fx').onclick = () => { sfx('click'); done(); }; }, 'mgP'); }), 'mgP'); }; ask(); }
function gloopyGame(G, done) { const X = S.sx; if (X.done.gloopy) { const L = ['Gloopy bounces happily: "Bloop!"', 'Gloopy is guarding the valves now. Very seriously. For about a minute at a time.', 'Gloopy made you a present: a tiny glowing gummy worm. It\'s slightly chewed.', 'Gloopy does a little goo dance. Squish, squish, squish!']; X._g = ((X._g | 0) + 1) % L.length; return result('🟢 GLOOPY', L[X._g], 'Your squishy friend from Test Chamber 7.', done); }
  let score = 0, tl = 18, over = false; const draw = () => panel(`<h2>🟢 MAKE FRIENDS WITH GLOOPY</h2><p class="sub">Gloopy only opened the valves because he was lonely! Toss him gummy worms 🪱 (not socks 🧦) · <b id="sc">${score}</b>/10 · ⏱️ <b id="tt">${tl | 0}</b>s</p><div id="gg" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:300px;margin:0 auto">${[...Array(9)].map((_, k) => `<button data-k="${k}" style="aspect-ratio:1/1;font-size:38px;border-radius:16px;border:0;background:#14532d"></button>`).join('')}</div>`,
    (c) => $a(c, '[data-k]').forEach((b) => b.onclick = () => { if (over) return; if (b.dataset.v === 'w') { score++; sfx('pop'); b.textContent = '💚'; b.dataset.v = ''; const e = document.getElementById('sc'); if (e) e.textContent = score; if (score >= 10) end(); } else if (b.dataset.v === 's') { score = Math.max(0, score - 1); sfx('bump'); b.textContent = ''; b.dataset.v = ''; const e = document.getElementById('sc'); if (e) e.textContent = score; } }), 'mgP');
  draw(); const iv = setInterval(() => { tl -= 0.6; const e = document.getElementById('tt'); if (!e) { over = true; clearInterval(iv); return; } e.textContent = Math.max(0, tl | 0); const bs = $a(document, '#gg button'); bs.forEach((b) => { if (b.textContent !== '💚') { b.textContent = ''; b.dataset.v = ''; } else b.textContent = ''; }); for (let n = 0; n < 2; n++) { const b = bs[(Math.random() * bs.length) | 0]; if (!b) continue; const g = Math.random() < 0.72; b.textContent = g ? '🪱' : '🧦'; b.dataset.v = g ? 'w' : 's'; } if (tl <= 0) end(); }, 600);
  function end() { if (over) return; over = true; clearInterval(iv); const ok = score >= 10; if (ok) { X.done.gloopy = 1; persist(); unlockSkin(G, 'sludge'); G.badge('gloopy'); G.fx.confetti(G.me.x, G.me.y + 1.5, G.me.z, 80); const it = G.world.inter.find((o) => o.id === 'sx_gloopy'); if (it) it.label = '🟢 Play with Gloopy'; }
    result(ok ? '🟢 BEST FRIENDS!' : '🟢 ALMOST!', ok ? 'Gloopy is your friend now!' : `${score}/10 gummy worms`, ok ? (X.done.valves ? 'Gloopy promises to stop opening the valves. The goo stays in the tanks and the Sludge Site is safe again!' : 'Gloopy promises to stop opening the valves. Now fix the valve panel in the Sludge Works so the goo goes home!') : 'Gloopy wants 10 gummy worms. Try again!', done); } }
// ================================================================== SPOOKY MODE 2.0 (based on Grok Spooks' "Spook 'Em": BOO / HAUNT / VANISH / FLICKER)
const SP = { on: false }; const PW = [['boo', '👻', 'BOO', 1.6], ['haunt', '🪑', 'HAUNT', 6], ['vanish', '🫥', 'VANISH', 10], ['flicker', '💡', 'FLICKER', 12]];
const DOORPT = { u_gw_tests: [-278, -4.6], u_gw_sludge: [-248, -4.6], u_gw_archive: [-278, 4.6], u_gw_lab: [-248, 4.6], u_gw_core: [-291.4, 0], u_gw_hall: null };
const ROUTES = [['u_gw_tests', [[-286, -15], [-270, -15], [-276, -21]]], ['u_gw_sludge', [[-256, -21], [-241, -22], [-246, -12]]], ['u_gw_archive', [[-285, 18], [-270, 22], [-276, 12]]], ['u_gw_lab', [[-255, 15.5], [-243, 22], [-247, 11]]], ['u_gw_core', [[-300, -9], [-300, 9], [-319, 5]]], ['u_gw_hall', [[-286, 0], [-238, 0]]]];
const SCI_NAMES = ['Night-shift Nora', 'Night-shift Ned', 'Dr. Drowsy', 'Intern Ike', 'Prof. Pickles', 'Guard Gourd'];
function ghostOn(G, mode) { if (SP.on) ghostOff(G, true); const rig = G.me.rig, gh = makeGhost(); gh.position.y = 0.1; rig.root.add(gh); SP.saved = rig.root.children.filter((c) => c !== gh).map((c) => [c, c.visible]); SP.saved.forEach(([c]) => c.visible = false);
  Object.assign(SP, { on: true, mode, gh, cd: { boo: 0, haunt: 0, vanish: 0, flicker: 0 }, van: 0, flick: 0, flickReg: null, t: 0, left: 180, sci: [], won: false, spotted: 0 });
  const bar = document.createElement('div'); bar.id = 'spBar'; bar.style.cssText = 'position:fixed;right:max(8px,env(safe-area-inset-right));top:24%;z-index:40;display:flex;flex-direction:column;gap:7px';
  bar.innerHTML = PW.map(([k, e, n], i) => `<button data-p="${k}" style="position:relative;width:62px;height:62px;border-radius:18px;border:2px solid #c4b5fd;background:#2e1065cc;color:#fff;font:bold 10px system-ui;padding:0;overflow:hidden"><span style="font-size:24px;display:block;line-height:30px">${e}</span>${n}<small style="position:absolute;top:2px;left:5px;opacity:.6">${i + 1}</small><i style="position:absolute;left:0;bottom:0;width:100%;height:0;background:#0008"></i></button>`).join('') + '<button data-p="x" style="width:62px;height:40px;border-radius:14px;border:0;background:#7f1d1dcc;color:#fff;font:bold 13px system-ui">✖ EXIT</button>';
  document.body.appendChild(bar); bar.querySelectorAll('button').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); b.dataset.p === 'x' ? ghostOff(G) : power(G, b.dataset.p); }));
  const dk = document.createElement('div'); dk.id = 'spDark'; dk.style.cssText = 'position:fixed;inset:0;z-index:5;pointer-events:none;background:radial-gradient(circle at 50% 55%,#0000 0,#000c 70%);opacity:0;transition:opacity .25s'; document.body.appendChild(dk); SP.bar = bar; SP.dark = dk;
  SP.key = (e) => { if (e.target && e.target.tagName === 'INPUT') return; const i = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code); if (i >= 0) power(G, PW[i][0]); if (e.code === 'Escape' && !document.querySelector('#ui.open')) ghostOff(G); }; window.addEventListener('keydown', SP.key);
  if (mode === 'night') { const sc = G.scene; ROUTES.forEach(([reg, pts], i) => { const rig = makeSci(7 + i), p = pts[0]; rig.root.position.set(p[0], UY, p[1]); sc.add(rig.root);
      const bar2 = new THREE.Group(), bg = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.12), new THREE.MeshBasicMaterial({ color: 0x111827, depthTest: false, transparent: true, opacity: 0.8 })), fe = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.08), new THREE.MeshBasicMaterial({ color: 0xa855f7, depthTest: false, transparent: true })), su = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.05), new THREE.MeshBasicMaterial({ color: 0xfacc15, depthTest: false, transparent: true }));
      fe.position.z = su.position.z = 0.002; su.position.y = -0.1; bg.renderOrder = 998; fe.renderOrder = su.renderOrder = 999; bar2.add(bg, fe, su); bar2.position.y = 2.5; rig.root.add(bar2);
      SP.sci.push({ rig, reg, pts, wp: 1, x: p[0], z: p[1], yaw: 0, fear: 0, sus: 0, st: 'walk', wait: 0, fl: null, n: SCI_NAMES[i], bar: bar2, fe, su }); });
    G.toastMsg('👻 NIGHT SHIFT: scare all 6 scientists out of the Gloomworks before 6:00 AM. Don\'t let them spot you!'); }
  else G.toastMsg('👻 You are a ghost! BOO people from behind for extra scares. Tap ✖ to turn back.');
  sfx('part'); G.fx.ring && G.fx.ring(G.me.x, G.me.y + 0.1, G.me.z, 0xc4b5fd); }
function ghostOff(G, quiet) { if (!SP.on) return; SP.on = false; if (SP.gh && SP.gh.parent) SP.gh.parent.remove(SP.gh); (SP.saved || []).forEach(([c, v]) => c.visible = v); if (S.sx.skin && S.sx.skin !== 'none') applySkin(G.me.rig, S.sx.skin);
  SP.bar && SP.bar.remove(); SP.dark && SP.dark.remove(); window.removeEventListener('keydown', SP.key); for (const s of SP.sci || []) s.rig.root.parent && s.rig.root.parent.remove(s.rig.root); SP.sci = []; G.hud.timer(''); if (!quiet) { sfx('pop'); G.toastMsg('👤 Back to normal. That was spooky!'); } }
function power(G, k) { if (!SP.on || G.app.busy || document.querySelector('#ui.open')) return; if (SP.cd[k] > 0) { sfx('deny'); return; } const me = G.me, P0 = PW.find((p) => p[0] === k); SP.cd[k] = P0[3];
  if (k === 'boo') { sfx('squeak'); G.fx.ring && G.fx.ring(me.x, me.y + 1, me.z, 0xc4b5fd); for (let i = 0; i < 18; i++) { const a = i / 18 * PI * 2; G.fx.emit(me.x, me.y + 1.1, me.z, Math.cos(a) * 5, 0.4, Math.sin(a) * 5, 0.12, 0xe9d5ff, 0.5, 0, 2); } SP.gh.userData.mo.scale.set(2.2, 2.8, 0.5); SP.booT = 0.4;
    if (SP.mode === 'night') { for (const s of SP.sci) { if (s.st === 'flee' || s.st === 'gone') continue; const d = Math.hypot(s.x - me.x, s.z - me.z); if (d > 4.2) continue; const behind = Math.sin(s.yaw) * (me.x - s.x) + Math.cos(s.yaw) * (me.z - s.z) < 0; scare(G, s, behind ? 45 : 25); if (behind) G.toastMsg('👻 Sneaky BOO from behind! Extra scary!'); } }
    else { let n0 = 0; for (const n of G.npcs) { if (!n.rig.root.visible || n.override) continue; const d = Math.hypot(n.x - me.x, n.z - me.z); if (d > 5 || Math.abs(n.y - me.y) > 2.5) continue; n0++; const by = n.y, k0 = { t: 0.9 }; n.override = (q, dt) => { k0.t -= dt; q.y = by + Math.max(0, Math.sin((0.9 - k0.t) / 0.9 * PI)) * 0.8; q.yaw += dt * 14; q.sp = 0; if (k0.t <= 0) { q.y = by; q.override = null; } }; }
      if (n0) { S.sx.spooks = (S.sx.spooks | 0) + n0; persist(); G.toastMsg(n0 > 1 ? `😱 ${n0} people jumped! (${S.sx.spooks} spooks)` : `😱 Eek! (${S.sx.spooks} spooks)`); if (S.sx.spooks >= 25) G.badge('spooker'); } } }
  if (k === 'haunt') { let best = null, bd = 3.5; for (const h of ST.H) { if (!h.g.visible) continue; const d = Math.hypot(h.x - me.x, h.z - me.z); if (d < bd) { bd = d; best = h; } }
    if (!best) { SP.cd.haunt = 0; sfx('deny'); G.toastMsg('🪑 Nothing to haunt here. Float next to a chair, bucket, cone, cart or skeleton!'); return; } best.t = 4; sfx('squeak'); G.fx.burst(best.x, UY + 1, best.z, 0xc4b5fd, 14, 3); SP.haunt = best; SP.hauntT = 4; if (SP.mode !== 'night') { G.toastMsg('🪑 Wooo! The ' + best.k + ' is haunted!'); } }
  if (k === 'vanish') { SP.van = 5; sfx('part'); G.toastMsg('🫥 Invisible for 5 seconds!'); }
  if (k === 'flicker') { SP.flick = 3; SP.flickReg = G.region; sfx('click'); } }
function scare(G, s, v) { s.fear = Math.min(100, s.fear + v); s.st = s.st === 'walk' || s.st === 'look' ? 'jump' : s.st; s.wait = 0.5; G.fx.burst(s.x, UY + 2.1, s.z, 0xa855f7, 8, 2);
  if (s.fear >= 100) { s.st = 'flee'; const d = DOORPT[s.reg]; s.fl = []; if (d) { s.fl.push(d); s.fl.push([d[0], 0]); } s.fl.push([-231, 0], [-215, 0]); sfx('squeak'); G.toastMsg(`😱 ${s.n} runs away screaming! (${SP.sci.filter((q) => q.st === 'flee' || q.st === 'gone').length}/6)`); } }
function spookTick(G, dt) { const me = G.me, t = (SP.t += dt); for (const k in SP.cd) SP.cd[k] = Math.max(0, SP.cd[k] - dt);
  if (SP.bar) SP.bar.querySelectorAll('button[data-p]').forEach((b) => { const k = b.dataset.p; if (k === 'x') return; const P0 = PW.find((p) => p[0] === k); const i = b.querySelector('i'); i.style.height = (SP.cd[k] / P0[3] * 100) + '%'; });
  const gh = SP.gh; gh.position.y = 0.15 + Math.sin(t * 2.4) * 0.12; gh.rotation.z = Math.sin(t * 1.7) * 0.05; if (SP.booT > 0) { SP.booT -= dt; if (SP.booT <= 0) gh.userData.mo.scale.set(1, 1.2, 0.5); }
  if (SP.van > 0) SP.van -= dt; gh.userData.mat.opacity = SP.van > 0 ? 0.22 + Math.sin(t * 10) * 0.05 : 0.88;
  if (SP.flick > 0) SP.flick -= dt; SP.dark.style.opacity = SP.flick > 0 ? (Math.sin(t * 30) > -0.2 ? 1 : 0.4) : 0; if (SP.hauntT > 0) SP.hauntT -= dt;
  if (Math.random() < dt * 8) G.fx.emit(me.x + (Math.random() - 0.5) * 0.6, me.y + 0.3, me.z + (Math.random() - 0.5) * 0.6, 0, -0.2, 0, 0.06, 0xe9d5ff, 0.6, -0.5, 1);
  if (SP.mode !== 'night') return;
  if (!G.region.startsWith('u_gw')) { endNight(G, false, 'You floated out of the Gloomworks!'); return; }
  SP.left -= dt; const mins = Math.max(0, SP.left) / 180 * 360, hh = 6 - Math.ceil(mins / 60 - 1e-6), clock = `${hh <= 0 ? 12 : hh}:${String(Math.floor(60 - (mins % 60 || 60)) % 60).padStart(2, '0')} AM`;
  const gone = SP.sci.filter((q) => q.st === 'gone' || q.st === 'flee').length; G.hud.timer(`👻 ${clock} · scared ${gone}/6${SP.van > 0 ? ' · 🫥' : ''}`);
  for (const s of SP.sci) { const r = s.rig; if (s.st === 'gone') continue; let sp = 0;
    if (s.st === 'flee') { const p = s.fl[0], dx = p[0] - s.x, dz = p[1] - s.z, d = Math.hypot(dx, dz); if (d < 0.4) { s.fl.shift(); if (!s.fl.length) { s.st = 'gone'; r.root.visible = false; G.fx.burst(s.x, UY + 1, s.z, 0xe9d5ff, 12, 3); continue; } } else { s.x += dx / d * 4.2 * dt; s.z += dz / d * 4.2 * dt; s.yaw = Math.atan2(dx, dz); sp = 4; } }
    else { const inRoom = G.region === s.reg || (s.reg === 'u_gw_hall' && G.region === 'u_gw_hall'); const frozen = SP.flick > 0 && SP.flickReg === s.reg;
      if (frozen) { s.fear = Math.min(100, s.fear + 7 * dt); if (Math.random() < dt * 2) G.fx.emit(s.x, UY + 2.2, s.z, 0, 1, 0, 0.12, 0xfacc15, 0.6, 0, 1); }
      if (SP.hauntT > 0 && SP.haunt && Math.hypot(SP.haunt.x - s.x, SP.haunt.z - s.z) < 7) { s.fear = Math.min(100, s.fear + 16 * dt); s.yaw += (Math.atan2(SP.haunt.x - s.x, SP.haunt.z - s.z) - s.yaw) * Math.min(1, dt * 4); }
      if (s.fear >= 100) { scare(G, s, 0); continue; }
      if (s.st === 'jump') { s.wait -= dt; r.root.position.y = UY + Math.max(0, Math.sin((0.5 - s.wait) / 0.5 * PI)) * 0.5; if (s.wait <= 0) { s.st = 'look'; s.wait = 1.2; r.root.position.y = UY; } }
      else if (s.st === 'look') { s.wait -= dt; s.yaw += dt * 2.2; if (s.wait <= 0) s.st = 'walk'; }
      else if (!frozen) { const p = s.pts[s.wp], dx = p[0] - s.x, dz = p[1] - s.z, d = Math.hypot(dx, dz); if (d < 0.3) { s.wp = (s.wp + 1) % s.pts.length; s.st = 'look'; s.wait = 1.4; } else { s.x += dx / d * 1.25 * dt; s.z += dz / d * 1.25 * dt; let a = Math.atan2(dx, dz) - s.yaw; while (a > PI) a -= PI * 2; while (a < -PI) a += PI * 2; s.yaw += a * Math.min(1, dt * 5); sp = 1.25; } }
      // can they see me? (same room, close, in front, not vanished, not frozen)
      const dx = me.x - s.x, dz = me.z - s.z, d = Math.hypot(dx, dz), fw = (Math.sin(s.yaw) * dx + Math.cos(s.yaw) * dz) / Math.max(d, 0.01);
      if (inRoom && !frozen && SP.van <= 0 && d < 6.5 && fw > 0.55 && s.st !== 'jump') { s.sus += 45 * dt * (d < 3 ? 1.6 : 1); if (s.sus >= 100) { s.sus = 0; SP.left -= 15; SP.spotted++; sfx('deny'); G.cam.shake = 0.3; G.toastMsg(`❗ ${s.n} spotted you! "Is somebody there?" (−15 minutes of night)`); s.st = 'look'; s.wait = 1.5; } } else s.sus = Math.max(0, s.sus - 20 * dt); }
    r.root.position.x = s.x; r.root.position.z = s.z; r.root.rotation.y = s.yaw; r.root.visible = G.vis.has(s.reg) || s.st === 'flee'; animFolk(r, dt, sp);
    s.fe.scale.x = Math.max(0.001, s.fear / 100); s.fe.position.x = -0.43 * (1 - s.fear / 100); s.su.scale.x = Math.max(0.001, s.sus / 100); s.su.position.x = -0.43 * (1 - s.sus / 100); s.su.material.color.setHex(s.sus > 60 ? 0xef4444 : 0xfacc15); s.bar.visible = s.st !== 'flee'; s.bar.quaternion.copy(r.root.quaternion).invert().multiply(E.camera.quaternion); }
  if (SP.sci.every((q) => q.st === 'gone')) endNight(G, true); else if (SP.left <= 0) endNight(G, false, '6:00 AM! The day shift is here.'); }
function endNight(G, win, why) { const sp = SP.spotted, left = Math.max(0, SP.left | 0), n = SP.sci.filter((q) => q.st === 'gone' || q.st === 'flee').length; ghostOff(G, true); G.app.ui.open && G.app.ui.open();
  const done = () => G.app.ui.done(); if (win) { const f = !S.sx.done.night; S.sx.done.night = 1; const sc = 600 + left * 5 - sp * 50; S.sx.best = Math.max(S.sx.best | 0, sc); persist(); if (f) { unlockSkin(G, 'phantom'); G.badge('nightshift'); } G.fx.confetti(G.me.x, G.me.y + 1.5, G.me.z, 90); sfx('win');
    result('👻 NIGHT SHIFT CLEARED!', `All 6 scientists ran home screaming · score ${sc}`, `Spotted ${sp} time${sp === 1 ? '' : 's'} · best ${S.sx.best}. Dr. Ivy: "Every year somebody says the Gloomworks is haunted. Now it really is!"`, done); }
  else { sfx('bump'); result('🌅 NIGHT OVER', `${n}/6 scientists scared`, `${why || ''} Tip: BOO from behind is extra scary, and FLICKER freezes everybody in the room.`, done); } }
// ================================================================== interactions
export function act(id, G, done) { if (!id.startsWith('sx_')) return false; const X = S.sx;
  switch (id) {
    case 'sx_lock': panel(`<h2>🧪 SPOOKSTER MEGA PACK</h2><p class="clueTx">Something under the Sludge Site is bubbling…</p><p class="sub">A whole underground facility with mad scientists, spooky tests and a big mystery, plus 6 new skins and Spooky Mode 2.0. Unlock the DLC in the <b>Grok Arcade</b> to open the gate!</p><button class="go" id="fx">OK</button>`, (c) => { $q(c, '#fx').onclick = () => { sfx('click'); done(); }; }, 'mgP'); break;
    case 'sx_down': { const f = !X.done.down; if (SP.on && SP.mode === 'night') ghostOff(G, true); travel(G, done, D.ARRIVE, f ? '🧪 Ding! SUB-LEVEL 13… "Welcome to the Gloomworks" is painted on the wall. Somebody is still working down here!' : null); if (f) { X.done.down = 1; persist(); setTimeout(() => unlockSkin(G, 'labcoat'), 1400); } break; }
    case 'sx_up': if (SP.on && SP.mode === 'night') ghostOff(G, true); travel(G, done, D.SURFACE, null); break;
    case 'sx_map': { const nc = D.CLUE_IDS.filter((k) => X.clues[k]).length; panel(`<h2>🗺️ GLOOMWORKS MAP</h2><p class="sub">${D.step()}</p><p class="clueTx" style="font-size:15px">🔍 Clues ${nc}/6 · 🧪 Glow Vials ${X.vials.length}/8 · 🧥 Skins ${Object.keys(X.skins).length - 1}/6</p><p class="sub">🧫 Test Chambers & 🛢️ Sludge Works to the south, 📚 Archive & ⚗️ Lab B13 to the north, and the 🔆 Glow Core at the far west end of the hall.</p><button class="go" id="fx">OK</button>`, (c) => { $q(c, '#fx').onclick = () => { sfx('click'); done(); }; }, 'mgP'); break; }
    case 'sx_locker': skinPanel(G, done); break;
    case 'sx_log': clueAct(G, 'log', done); break; case 'sx_pipe': clueAct(G, 'pipe', done); break; case 'sx_portrait': clueAct(G, 'portrait', done); break;
    case 'sx_diary': if (!X.clues.log && !X.clues.portrait) { result('📔 A LOCKED DIARY', 'It has a little gourd-shaped lock', 'Hmm. Maybe find out who the Gourdwicks are first (the Archive portrait or the test log).', done); break; } clueAct(G, 'diary', done); break;
    case 'sx_test': testGame(G, done); break; case 'sx_valves': valveGame(G, done); break; case 'sx_files': if (X.clues.blueprint) clueAct(G, 'blueprint', done); else filesGame(G, done); break;
    case 'sx_case': caseBoard(G, done); break; case 'sx_gloopy': gloopyGame(G, done); break; case 'sx_potion': potionGame(G, done); break;
    case 'sx_ghost': { if (SP.on) { ghostOff(G); done(); break; } const ng = G.region && G.region.startsWith('u_gw');
      panel(`<h2>👻 GHOSTIFIER 2.0</h2><p class="sub">Spooky Mode 2.0 · step in and turn into a ghost! Powers: 👻 BOO (bigger from behind) · 🪑 HAUNT stuff · 🫥 VANISH · 💡 FLICKER the lights</p><button ${WIDE} data-m="free">👻 FREE HAUNT<br><small style="opacity:.75;font-weight:normal">Float around and BOO anyone you like · ${X.spooks | 0} spooks so far</small></button><button ${WIDE} data-m="night" ${ng ? '' : 'disabled style="opacity:.5"'}>🌙 NIGHT SHIFT${X.done.night ? ' ✅' : ''}<br><small style="opacity:.75;font-weight:normal">${ng ? `Scare 6 night-shift scientists out before 6 AM${X.best ? ' · best ' + X.best : ''}` : 'Only in the Gloomworks (Lab B13 Ghostifier)'}</small></button><button class="go" id="fx">NOT NOW</button>`,
        (c) => { $a(c, '[data-m]').forEach((b) => b.onclick = () => { if (b.dataset.m === 'night' && !ng) return; sfx('click'); done(); setTimeout(() => ghostOn(G, b.dataset.m), 60); }); $q(c, '#fx').onclick = () => { sfx('click'); done(); }; }, 'mgP'); break; }
    default: return false; }
  return true; }
export function ghosted() { return !!SP.on; }
