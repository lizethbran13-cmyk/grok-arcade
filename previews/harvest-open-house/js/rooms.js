// Harvest Hollow Open House: enterable interiors. Each room is built only when you walk in and fully disposed when you leave (keeps phone memory low).
import * as THREE from 'three';
import { Batch, G, solid, COL, sign, PI } from './kit.js';
import { MATS } from './mats.js';

const W = 14, D = 10, H = 4.6;
export const DOORS = [ // outside door spots (x,z = where you stand), face = yaw you leave facing
  { id: 'barn', name: "Torty's Barn", x: -55.2, z: -14, out: [-54.6, -14, PI / 2] },
  { id: 'bakery', name: 'Hollow Bakery', x: -12, z: -17.8, out: [-12, -17.4, 0] }];
export const ACORNS = { barn: [[-5.6, -3.6], [5.4, 2.4]], bakery: [[5.8, -3.6]] }; // room-local spots (more come in later rooms + outdoors)

export function initRooms(ctx) {
  const { scene, P, cam, S, sfx, toast, talk, msg, makePet, animPet } = ctx;
  let cur = null; // { id, ox, oz, grp, boxes, lights, npcs, acorns, door }
  // glowing door frames + signs outside
  { const b = new Batch(); for (const d of DOORS) { const fx = d.id === 'barn'; const x = fx ? d.x - 1.25 : d.x, z = fx ? d.z : d.z - 1.15;
      b.box('l', 0xffd27a, x, 2.2, z, fx ? 0.12 : 1.6, 0.12, fx ? 1.6 : 0.12, 0, 0.6); for (const s of [-0.8, 0.8]) b.box('l', 0xffd27a, fx ? x : x + s, 0, fx ? z + s : z, 0.12, 2.2, 0.12, 0, 0.6); }
    const g = new THREE.Group(); b.finish(g, false); scene.add(g); }
  function shell(b, ox, oz, wall, floor, trim) {
    b.box('m', floor, ox, 0.0, oz, W, 0.04, D); b.box('m', wall, ox, 0, oz - D / 2, W, H, 0.3); b.box('m', wall, ox - W / 2, 0, oz, 0.3, H, D); b.box('m', wall, ox + W / 2, 0, oz, 0.3, H, D);
    b.box('m', wall, ox - 4.3, 0, oz + D / 2, W / 2 - 1.3, H, 0.3); b.box('m', wall, ox + 4.3, 0, oz + D / 2, W / 2 - 1.3, H, 0.3); b.box('m', wall, ox, 2.6, oz + D / 2, 2.6, H - 2.6, 0.3);
    b.box('m', trim, ox, 0.04, oz - D / 2 + 0.2, W, 0.25, 0.1); b.box('l', 0xffd27a, ox, 2.5, oz + D / 2 - 0.2, 2.6, 0.12, 0.1, 0, 0.6);
    b.box('m', 0x6b3f22, ox, 0, oz + D / 2, 2.6, 2.6, 0.2); b.box('m', 0x8a5a33, ox - 0.62, 0.2, oz + D / 2 - 0.12, 1.1, 2.2, 0.04); b.box('m', 0x8a5a33, ox + 0.62, 0.2, oz + D / 2 - 0.12, 1.1, 2.2, 0.04); b.sph('l', 0xfacc15, ox + 0.2, 1.1, oz + D / 2 - 0.16, 0.07, 0.07, 0.07, 0.8); }
  function walls(ox, oz) { const bx = [];
    bx.push(solid(ox - W / 2 - 0.3, oz - D / 2 - 0.3, ox + W / 2 + 0.3, oz - D / 2 + 0.15, 0, 6)); bx.push(solid(ox - W / 2 - 0.3, oz - D / 2, ox - W / 2 + 0.15, oz + D / 2 + 0.3, 0, 6));
    bx.push(solid(ox + W / 2 - 0.15, oz - D / 2, ox + W / 2 + 0.3, oz + D / 2 + 0.3, 0, 6)); bx.push(solid(ox - W / 2, oz + D / 2 - 0.15, ox - 1.3, oz + D / 2 + 0.3, 0, 6));
    bx.push(solid(ox + 1.3, oz + D / 2 - 0.15, ox + W / 2, oz + D / 2 + 0.3, 0, 6)); bx.push(solid(ox - 1.3, oz + D / 2 - 0.15, ox + 1.3, oz + D / 2 + 0.3, 0, 6)); bx.push(solid(ox - W / 2, oz - D / 2, ox + W / 2, oz + D / 2, H - 0.05, H + 0.4)); return bx; }
  const BUILD = {
    barn(b, ox, oz, bx, add) { shell(b, ox, oz, 0x9b2c2c, 0x8a6a45, 0x5b2a1a);
      for (let i = -6; i <= 6; i += 1.2) b.box('m', 0x7c5a3a, ox + i, 0.045, oz, 0.06, 0.01, D); // floor boards
      for (const sx of [-1, 1]) { const x = ox + sx * 4.8; b.box('m', 0x5b3a24, x, 0, oz - 2.5, 0.25, H, 0.25); b.box('m', 0x5b3a24, x, 0, oz + 1.5, 0.25, H, 0.25); }
      b.box('m', 0x5b3a24, ox, H - 0.4, oz - 2.5, W, 0.25, 0.25); b.box('m', 0x5b3a24, ox, H - 0.4, oz + 1.5, W, 0.25, 0.25);
      // hay bale wall (left back) + loft
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4 - r; c++) { b.rbox('m', 0xe3c062, ox - 6.1 + c * 1.6 + r * 0.8, r * 0.85, oz - 4.3, 1.55, 0.85, 0.9); }
      bx.push(solid(ox - 7, oz - 5, ox - 0.4, oz - 3.7, 0, 3));
      b.box('m', 0x7c5a3a, ox - 4.5, 2.6, oz - 3.5, 5, 0.15, 3); // hayloft
      // tool wall (right back) = shop counter
      b.box('m', 0x8a5a33, ox + 4, 0, oz - 4.2, 4, 1.0, 1.0); b.box('m', 0xd9b38c, ox + 4, 1.0, oz - 4.2, 4.1, 0.06, 1.1); bx.push(solid(ox + 1.9, oz - 5, ox + 6.1, oz - 3.6, 0, 2));
      for (let i = 0; i < 5; i++) { b.cyl('m', 0x6b4a2e, ox + 2.4 + i * 0.8, 1.4, oz - 4.85, 0.04, 1.8); b.box('x', i === 2 ? 0xfacc15 : 0x9ca3af, ox + 2.4 + i * 0.8, 3.1, oz - 4.85, 0.5, 0.12, 0.08); }
      // stalls with feed troughs (left/right front)
      for (const sx of [-1, 1]) { b.box('m', 0x6b4a2e, ox + sx * 5.6, 0, oz + 2.8, 2.4, 1.1, 0.15); b.box('m', 0x6b4a2e, ox + sx * 4.4, 0, oz + 3.6, 0.15, 1.1, 1.8); b.box('m', 0x5b3a24, ox + sx * 5.8, 0, oz + 4.2, 1.6, 0.4, 0.6);
        bx.push(solid(ox + sx * 5.6 - 1.25, oz + 2.7, ox + sx * 5.6 + 1.25, oz + 2.95, 0, 1.2)); }
      // lanterns, barrels, sacks, pumpkins
      for (const [x, z] of [[-1.6, -4.4], [1.2, 3.8], [-2.8, 3.9]]) { b.cyl('m', 0x7c4a1e, ox + x, 0, oz + z, 0.42, 1.0); bx.push(solid(ox + x - 0.45, oz + z - 0.45, ox + x + 0.45, oz + z + 0.45, 0, 1)); }
      for (const [x, z] of [[0.2, -4.3], [0.9, -4.4]]) b.sph('m', 0xd6c7a1, ox + x, 0.35, oz + z, 0.35, 0.4, 0.3);
      for (const [x, z, s] of [[-0.8, 3.6, 0.4], [2.6, 3.3, 0.3], [6.2, -1.6, 0.45], [-6.3, 0.4, 0.35]]) { b.sph('g', 0xf07b1f, ox + x, s * 0.8, oz + z, s * 1.1, s * 0.8, s * 1.1); }
      for (const x of [-3, 0, 3]) b.sph('l', 0xffd59a, ox + x, H - 0.9, oz - 0.5, 0.18, 0.22, 0.18, 1);
      add(sign("TORTY'S TOOLS", 2.6, 0.5, { bg: '#7c2d12', border: '#fbbf24' }), ox + 4, 2.3, oz - 4.75);
      add(sign('FEED BIN', 1.6, 0.4, { bg: '#14532d', border: '#fbbf24' }), ox - 5.8, 1.5, oz + 4.6, PI);
      return { npcs: [['brownie', 3.8, -3.1, 0, 'Farmhand Brownie'], ['luna', -3.2, 1.2, PI / 4, 'Luna']], light: 0xffd59a };
    },
    bakery(b, ox, oz, bx, add) { shell(b, ox, oz, 0xf5e1c4, 0xc08552, 0xb45309);
      for (let i = -6.5; i <= 6.5; i += 1) for (let j = -4.5; j <= 4.5; j += 1) if (((i + j + 11) | 0) % 2) b.box('m', 0xf1e4c8, ox + i, 0.045, oz + j, 1, 0.012, 1); // checker floor
      // brick oven (back center) + bake station
      b.box('m', 0xa1462a, ox, 0, oz - 4.3, 3.2, 2.6, 1.2); b.sph('m', 0xa1462a, ox, 2.6, oz - 4.3, 1.6, 0.8, 0.6); b.box('e', 0xff7a1a, ox, 0.6, oz - 3.68, 1.4, 0.9, 0.02, 0, 0.6);
      b.cyl('m', 0x5b3a24, ox + 0.9, 3.0, oz - 4.6, 0.2, 1.6); bx.push(solid(ox - 1.7, oz - 5, ox + 1.7, oz - 3.6, 0, 3));
      b.box('m', 0xe5e7eb, ox, 0, oz - 2.2, 3.4, 0.95, 1.0); b.box('m', 0xd6d3d1, ox, 0.95, oz - 2.2, 3.5, 0.06, 1.1); bx.push(solid(ox - 1.75, oz - 2.75, ox + 1.75, oz - 1.65, 0, 1.2));
      b.cyl('m', 0xc08552, ox - 0.9, 1.0, oz - 2.2, 0.35, 0.08); b.cyl('m', 0x9ca3af, ox + 0.9, 1.0, oz - 2.2, 0.3, 0.25); b.cyl('m', 0xd6c7a1, ox, 1.0, oz - 2.1, 0.06, 0.6, PI / 2);
      // display counter (right) with pies + glass
      b.box('m', 0x8a5a33, ox + 4.4, 0, oz - 0.5, 1.2, 1.0, 5); b.box('w', 0xbfe6ff, ox + 4.4, 1.0, oz - 0.5, 1.2, 0.6, 5); bx.push(solid(ox + 3.7, oz - 3.1, ox + 5.1, oz + 2.1, 0, 2));
      for (let k = 0; k < 5; k++) { const col = [0xe8a33d, 0xb8432a, 0x9c6b45, 0xe8a33d, 0x7c2d12][k]; b.cyl('m', 0xd9b38c, ox + 4.4, 1.05, oz - 2.6 + k * 1.05, 0.38, 0.12); b.cyl('g', col, ox + 4.4, 1.13, oz - 2.6 + k * 1.05, 0.32, 0.06); }
      // shelves (left wall) with bread + flour sacks
      for (let r = 0; r < 3; r++) { b.box('m', 0x7c4a1e, ox - 6.5, 0.6 + r * 0.9, oz - 1.2, 0.7, 0.06, 4.5); for (let k = 0; k < 5; k++) b.sph('g', [0xd4a04f, 0xc08552, 0xe3c062][(k + r) % 3], ox - 6.5, 0.8 + r * 0.9, oz - 3 + k * 0.9, 0.28, 0.16, 0.2); }
      bx.push(solid(ox - 7, oz - 3.6, ox - 6.1, oz + 1.2, 0, 3));
      for (const [x, z] of [[-5.9, 2.8], [-5.2, 3.6]]) { b.sph('m', 0xf4f4f5, ox + x, 0.4, oz + z, 0.4, 0.45, 0.35); }
      // cafe tables
      for (const [x, z] of [[-2.6, 2.2], [1.2, 2.6]]) { b.cyl('x', 0x2f3437, ox + x, 0, oz + z, 0.06, 0.75); b.cyl('m', 0xfff7ed, ox + x, 0.75, oz + z, 0.6, 0.05); b.cyl('g', 0xe8a33d, ox + x, 0.8, oz + z, 0.2, 0.05);
        for (const s of [-1, 1]) b.cyl('m', 0xb45309, ox + x + s * 0.85, 0, oz + z, 0.25, 0.45); bx.push(solid(ox + x - 0.6, oz + z - 0.6, ox + x + 0.6, oz + z + 0.6, 0, 1)); }
      // bunting + ribbon board
      for (let i = 0; i < 12; i++) b.box('f', [0xf97316, 0xfacc15, 0xb91c1c][i % 3], ox - 5.5 + i, H - 0.7, oz - 4.8, 0.4, 0.35, 0.03);
      b.box('m', 0x7c2d12, ox - 3.6, 1.4, oz - 4.82, 2.2, 1.4, 0.05);
      for (let i = 0; i < Math.min(6, S.ribbons || 0); i++) b.sph('l', [0x2563eb, 0xfacc15, 0xdc2626][i % 3], ox - 4.4 + (i % 3) * 0.8, 2.4 - Math.floor(i / 3) * 0.6, oz - 4.75, 0.16, 0.16, 0.04, 0.4);
      for (const x of [-3, 0, 3]) b.sph('l', 0xfff1d6, ox + x, H - 0.9, oz, 0.2, 0.2, 0.2, 1);
      add(sign('HOLLOW BAKERY', 3, 0.6, { bg: '#b45309', border: '#fde68a' }), ox, 3.6, oz - 4.8);
      add(sign('RIBBONS', 1.6, 0.35, { bg: '#7c2d12', border: '#fbbf24' }), ox - 3.6, 3.0, oz - 4.78);
      add(sign('PIE SHOP', 1.6, 0.4, { bg: '#b45309', border: '#fde68a' }), ox + 3.75, 1.9, oz - 0.5, -PI / 2);
      return { npcs: [['cream', 0.2, -3.0, 0, 'Baker Cream'], ['snowie', -2.6, 3.2, PI, 'Snowie']], light: 0xfff1d6 };
    }
  };
  const ROOMI = { barn: 0, bakery: 1 };
  function acornMesh() { const g = new THREE.Group(); const b = new Batch(); b.sph('l', 0xfacc15, 0, 0.45, 0, 0.22, 0.28, 0.22, 0.9); b.sph('m', 0x7c4a1e, 0, 0.66, 0, 0.24, 0.1, 0.24); b.cyl('m', 0x5b3a24, 0, 0.72, 0, 0.03, 0.12); b.finish(g, false); return g; }
  function enter(id) { const d = DOORS.find((q) => q.id === id), ox = 300 + ROOMI[id] * 60, oz = 0; const grp = new THREE.Group(), b = new Batch(), bx = [];
    const add = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; grp.add(o); };
    const info = BUILD[id](b, ox, oz, bx, add); bx.push(...walls(ox, oz)); b.finish(grp);
    const cb = new Batch(); cb.box('m', 0x5b3a24, ox, H, oz, W + 0.6, 0.25, D + 0.6); cb.finish(grp, false);
    const lights = [-3.5, 3.5].map((dx) => { const L = new THREE.PointLight(info.light, 16, 14, 1); L.position.set(ox + dx, H - 0.6, oz); grp.add(L); return L; });
    const npcs = info.npcs.map(([pid, x, z, yaw, who]) => { const p = makePet(pid, { s: pid === 'luna' || pid === 'snowie' ? 1.3 : 1.25 }); p.x = ox + x; p.z = oz + z; p.yaw = yaw; p.who = who; grp.add(p.root); return p; });
    S.acorns = S.acorns || []; const acorns = (ACORNS[id] || []).map(([x, z], i) => { const key = id + i; if (S.acorns.includes(key)) return null; const m = acornMesh(); m.position.set(ox + x, 0, oz + z); grp.add(m); return { key, m, x: ox + x, z: oz + z }; }).filter(Boolean);
    scene.add(grp); cur = { id, d, ox, oz, grp, boxes: bx, npcs, acorns };
    P.x = ox; P.z = oz + D / 2 - 3.2; P.yaw = PI; cam.yaw = 0; cam.snap = true; sfx('door'); toast('🚪 ' + d.name);
    if (ctx.onEnter) ctx.onEnter(id, cur); }
  function leave() { if (!cur) return; const d = cur.d; for (const bb of cur.boxes) { const i = COL.boxes.indexOf(bb); if (i >= 0) COL.boxes.splice(i, 1); }
    scene.remove(cur.grp); cur.grp.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map) { o.material.map.dispose(); } if (o.material && !Object.values(MATS).includes(o.material)) o.material.dispose && o.material.dispose(); });
    cur = null; P.x = d.out[0]; P.z = d.out[1]; P.yaw = d.out[2]; cam.yaw = d.out[2] + PI; cam.snap = true; sfx('door'); }
  function spots() { if (!cur) return DOORS.map((d) => ({ x: d.x, z: d.z, r: 1.8, label: '🚪 Enter ' + d.name, f: () => enter(d.id) }));
    const o = [{ x: cur.ox, z: cur.oz + D / 2 - 0.6, r: 1.4, label: '🚪 Go outside', f: leave }];
    for (const a of cur.acorns) if (!a.got) o.push({ x: a.x, z: a.z, r: 1.3, label: '🌰 Grab the golden acorn!', f: () => { a.got = true; a.m.visible = false; S.acorns.push(a.key); S.coins += 5; sfx('cheer'); toast(`🌰 Golden acorn ${S.acorns.length}/20! +5 🪙`); if (ctx.onAcorn) ctx.onAcorn(S.acorns.length); } });
    if (ctx.roomSpots) o.push(...ctx.roomSpots(cur)); return o; }
  function step(dt) { if (!cur) return; const t = performance.now() / 1000; for (const p of cur.npcs) { p.speed = 0; p.noTurn = true; animPet(p, dt, P); }
    for (const a of cur.acorns) if (!a.got) { a.m.rotation.y = t * 2; a.m.position.y = Math.sin(t * 3) * 0.08; } }
  return { enter, leave, spots, step, inside: () => cur, DOORS };
}
