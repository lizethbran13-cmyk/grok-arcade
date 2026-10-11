// The expeditions + the museum hub. Each builds geometry + colliders + gameplay into a World. Units: metres.
import { kit, PR, propSeed } from './lvlkit.js';
import { rbox } from './world.js';
import { rcyl, lathe, sph, cyl, torus, capsule, cone, tube, leaf, star, gear, blobGeo } from './shapes.js';
import { LEVELS, RELICS, TREASURES } from './data.js';
import { S } from './save.js';
import { textGeo } from './text3d.js';
import { rnd, rr, pick, shade, mix, fbm } from './props.js';
export const PI = Math.PI;
export const ENV = {
  outdoor: { sunDir: [0.4, 0.85, 0.35], sunColor: 0xfff0d0, sunI: 2.7, hemiSky: 0xcfe9ff, hemiGround: 0x6b8f4a, hemiI: 0.62, skyTop: 0x2f8fff, skyMid: 0x9fd8ff, skyBot: 0xe8f7ff, fog: 0xbfe6d0, fogD: 0.0075, envI: 0.85, exposure: 1.0, bloomT: 1.0, bloomS: 0.42, envLight: 0xfff4e0, sunDisc: 1 },
  museum: { sunDir: [0.35, 0.8, 0.45], sunColor: 0xfff1d6, sunI: 2.2, hemiSky: 0xfff4e6, hemiGround: 0xc9a27a, hemiI: 0.85, skyTop: 0x5fb4ff, skyMid: 0xbfe6ff, skyBot: 0xfff1d6, fog: 0xf6ead8, fogD: 0.004, envI: 0.9, exposure: 0.98, bloomT: 1.02, bloomS: 0.4, envLight: 0xfff3e0 },
};
export function buildLevel(id, w, seed) { kit(w); propSeed(11 + id.length * 17); const f = BUILD[id] || BUILD.hub; f(w); w.env = Object.assign({}, ENV.outdoor, w.env || {}); w.music = w.music || id; return w; }
export const BUILD = {};
const grassCol = (x, z) => { const n = fbm(x * 0.08, z * 0.08), m = fbm(x * 0.5 + 9, z * 0.5); return mix(mix(0x4caf2f, 0x2f8f2a, n), 0x7cc34a, m * 0.35); };
const dirtCol = (x, z) => mix(0xb8895a, 0x9b6f45, fbm(x * 0.4, z * 0.4));
// ===================================================================================== THE MUSEUM (hub)
BUILD.hub = (w) => { w.env = Object.assign({}, ENV.museum); w.music = 'hub'; w.camDist = 5.2;
  const X0 = -24, X1 = 24, Z0 = -22, Z1 = 18, H = 12, marble = [0xf3eee4, 0xe7dfd0];
  PR.tiles(w, X0, Z0, X1, Z1, 0, marble, 2, { check: true, bucket: 'g' });
  PR.stoneRoom(w, X0, Z0, X1, Z1, H, 0xe9dcc4, { doors: { S: [[-3, 3, 6]] }, wall: { col2: 0xf5ecd8, bh: 0.9, bl: 2.2, skip: 0.02 }, ceilCol: 0xf7efe2, beams: 6 });
  w.start = [0, 0, 13]; w.startYaw = PI;
  // columns, skylights + chandeliers
  for (const x of [-16, -8, 8, 16]) for (const z of [-12, 6]) PR.pillar(w, x, 0, z, H, 0xf1e8d6, { r: 0.6 });
  for (const z of [-8, 4]) { w.add('l', rbox(10, 0.1, 4, 0.05, 1), 0xfff8e6, 0, H - 0.05, z, 0, 0, 0, 1, 1, 1, 0.25); for (const x of [-12, 12]) { PR.lantern(w, x, H - 2.6, z, 0xffe6a8); } }
  w.lights.push({ x: 0, y: H - 3, z: -4, c: 0xfff1dc, i: 40, d: 40 }, { x: 0, y: H - 3, z: 10, c: 0xfff1dc, i: 30, d: 30 });
  // big 3D lettering over the relic hall
  const tg = textGeo('GROK RELIC MUSEUM', 0.9, 0.25); if (tg) w.add('x', tg, 0xd4a017, 0, 8.6, Z0 + 0.62); w.add('m', rbox(22, 1.6, 0.3, 0.1, 1), 0x7c2d12, 0, 8.4, Z0 + 0.5);
  PR.banner(w, -10, 10.5, Z0 + 0.6, 0, 0xdc2626, 4); PR.banner(w, 10, 10.5, Z0 + 0.6, 0, 0x1d4ed8, 4);
  // relic pedestals (fill as you recover them)
  LEVELS.forEach((L, i) => { const a = -0.9 + i * 0.45, x = Math.sin(a) * 11, z = -8 - Math.cos(a) * 6; const got = !!S.relics[L.relic]; PR.pedestal(w, x, 0, z, 0xf5f0e6, true); w.add('l', rcyl(0.9, 0.06, 0.02, 32), got ? 0xfde68a : 0x9ca3af, x, 0.01, z, 0, 0, 0, 1, 1, 1, got ? 0.5 : 0);
    const nm = textGeo(got ? RELICS[L.relic].n : '? ? ?', 0.16, 0.04); if (nm) w.add('g', nm, got ? 0x7c2d12 : 0x9ca3af, x, 0.45, z + 0.82); w.relicSlots = (w.relicSlots || []).concat([{ x, y: 2.0, z, id: L.relic, got }]);
    w.kiosks.push({ id: 'relic:' + L.relic, x, y: 0, z: z + 1.6, r: 1.6, label: got ? `${RELICS[L.relic].icon} ${RELICS[L.relic].n}` : '🔒 Empty case', fn: (app) => app.openKiosk('relic', L.relic) }); });
  // treasure cases along the side walls
  LEVELS.forEach((L, li) => { const side = li % 2 ? 1 : -1, zc = -14 + Math.floor(li / 2) * 10 + (li === 4 ? 0 : 0); const xw = side * 21.6;
    w.add('m', rbox(1.4, 1.0, 8.6, 0.08, 1), 0x7c4a1e, xw, 0.5, zc); w.solid(xw - 0.7, 0, zc - 4.3, xw + 0.7, 1.0, zc + 4.3); w.add('e', rbox(1.2, 1.0, 8.4, 0.05, 1), 0xe0f2fe, xw, 1.5, zc); w.add('x', rbox(1.3, 0.06, 8.5, 0.02, 1), 0xd4a017, xw, 2.02, zc);
    const got = S.treasures[L.id] || []; for (let k = 0; k < 5; k++) { const z = zc - 3.4 + k * 1.7; w.add('g', rcyl(0.25, 0.06, 0.02, 16), 0xfef3c7, xw, 1.0, z); if (got.includes(k)) { w.add('x', sph(14), [0xffc83d, 0x22d3ee, 0xf472b6, 0x4ade80, 0xa78bfa][k], xw, 1.35, z, 0, 0, 0, 0.22, 0.28, 0.22); w.add('l', sph(8), 0xfff7c2, xw, 1.65, z, 0, 0, 0, 0.06, 0.06, 0.06, 0.6); } else w.add('m', sph(10), 0x9ca3af, xw, 1.2, z, 0, 0, 0, 0.08); }
    const lab = textGeo(L.place.toUpperCase(), 0.22, 0.05); if (lab) w.add('g', lab, 0x7c2d12, xw - side * 0.75, 0.4, zc, 0, -side * PI / 2, 0);
    w.kiosks.push({ id: 'treasures:' + L.id, x: xw - side * 1.6, y: 0, z: zc, r: 2.2, dy: 2.5, label: `🏺 ${L.place} treasures (${got.length}/5)`, fn: (app) => app.openKiosk('treasures', L.id) }); });
  // dino skeleton centrepiece + rope barrier
  PR.dinoSkeleton(w, 0, 0, -1, PI / 2 + 0.3); for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; w.add('x', rcyl(0.08, 1.0, 0.02, 12), 0xd4a017, Math.cos(a) * 5.5, 0, -1 + Math.sin(a) * 4.2); w.add('x', sph(10), 0xd4a017, Math.cos(a) * 5.5, 1.05, -1 + Math.sin(a) * 4.2, 0, 0, 0, 0.12); const b = (i + 1) / 8 * PI * 2; PR.rope(w, Math.cos(a) * 5.5, 0.9, -1 + Math.sin(a) * 4.2, Math.cos(b) * 5.5, 0.9, -1 + Math.sin(b) * 4.2, 0xdc2626, 0.05, 0.2); }
  w.kiosks.push({ id: 'dino', x: 0, y: 0, z: 4, r: 1.5, label: '🦖 Read the dino plaque', fn: (app, g) => g.hud.say('martina', '"That\u2019s Bonesy the Grok-o-saurus. Professor Vintage tried to steal him once. He got stuck in the tail."') });
  // expedition map table (pick an expedition)
  { const x = 0, z = 9; w.slab('m', 0x7c4a1e, x, 0, z, 4.4, 1.0, 2.8, 0.12); w.add('m', rbox(4.0, 0.06, 2.4, 0.03, 1), 0xf3e2b5, x, 1.03, z); for (let i = 0; i < 5; i++) { const L = LEVELS[i], px = x - 1.6 + i * 0.8; w.add('g', cone(16), parseInt(L.col.slice(1), 16), px, 1.06, z + (i % 2 ? 0.4 : -0.4), 0, 0, 0, 0.18, 0.45, 0.18); w.add('l', sph(10), 0xffffff, px, 1.55, z + (i % 2 ? 0.4 : -0.4), 0, 0, 0, 0.07, 0.07, 0.07, 0.6); }
    w.add('m', tube([[-1.6, 1.07, z - 0.4], [-0.8, 1.07, z + 0.4], [0, 1.07, z - 0.4], [0.8, 1.07, z + 0.4], [1.6, 1.07, z - 0.4]], 0.03, 40, 6), 0xdc2626, 0, 0, 0); w.add('x', rcyl(0.3, 0.05, 0.02, 24), 0xd4a017, x + 1.7, 1.06, z + 0.9);
    w.kiosks.push({ id: 'map', x, y: 0, z: z + 2.2, r: 2.4, label: '🗺️ Expedition map', fn: (app) => app.openKiosk('map') }); }
  // wardrobe (west), gear shop (east), journal desk, newspaper stand
  { const x = -19, z = 12; w.slab('m', 0x8b5a2b, x, 0, z, 3.4, 4.2, 1.2, 0.15); w.add('m', rbox(1.5, 3.6, 0.1, 0.05, 1), 0xa0703a, x - 0.8, 2.3, z + 0.62); w.add('m', rbox(1.5, 3.6, 0.1, 0.05, 1), 0xa0703a, x + 0.8, 2.3, z + 0.62); w.add('x', sph(10), 0xd4a017, x - 0.15, 2.3, z + 0.7, 0, 0, 0, 0.08); w.add('x', sph(10), 0xd4a017, x + 0.15, 2.3, z + 0.7, 0, 0, 0, 0.08);
    w.add('e', rbox(1.2, 2.4, 0.06, 0.04, 1), 0xdbeafe, x + 2.6, 1.6, z + 0.2, 0, -0.3, 0); w.add('x', rbox(1.36, 2.56, 0.08, 0.05, 1), 0xd4a017, x + 2.6, 1.6, z + 0.15, 0, -0.3, 0); for (let i = 0; i < 4; i++) w.add('f', capsule(12), [0x8b5a2b, 0x0f766e, 0x4d7c0f, 0xf59e0b][i], x - 1.2 + i * 0.8, 4.6, z, 0, 0, 0, 0.5, 0.6, 0.3);
    const t = textGeo('WARDROBE', 0.3, 0.08); if (t) w.add('g', t, 0xfde68a, x, 4.7, z + 0.62); w.kiosks.push({ id: 'wardrobe', x, y: 0, z: z + 2, r: 2.4, label: '👒 Wardrobe: outfits & explorer', fn: (app) => app.openKiosk('wardrobe') }); }
  { const x = 18, z = 12; w.slab('m', 0x7c4a1e, x, 0, z, 4.4, 1.2, 1.6, 0.12); w.add('g', rbox(4.5, 0.1, 1.7, 0.04, 1), 0x0f766e, x, 1.22, z); w.add('m', rbox(4.4, 3, 0.3, 0.08, 1), 0x8b5a2b, x, 2.8, z - 1.2); w.solid(x - 2.2, 0, z - 1.4, x + 2.2, 4.3, z - 1.0);
    for (let i = 0; i < 4; i++) { w.add('m', rbox(0.6, 0.6, 0.4, 0.06, 1), [0xc08a4f, 0xdc2626, 0x2563eb, 0xf59e0b][i], x - 1.5 + i, 1.55, z - 0.2); } w.add('m', torus(0.2, 20), 0x5b3a1e, x - 1.8, 3.2, z - 1.0, 0, 0, 0, 0.3, 0.3, 0.3); w.add('m', rcyl(0.05, 0.45, 0.02, 10), 0x6b4423, x + 1.5, 1.3, z, 0.5, 0, 0); w.add('l', sph(10), 0xffa53d, x + 1.5, 1.75, z + 0.25, 0, 0, 0, 0.09, 0.12, 0.09, 1.4);
    const t = textGeo("TORTY'S GEAR SHOP", 0.3, 0.08); if (t) w.add('g', t, 0xfde68a, x, 4.5, z - 1.0); w.kiosks.push({ id: 'shop', x, y: 0, z: z + 2, r: 2.4, label: '🛒 Torty\u2019s Gear Shop', fn: (app) => app.openKiosk('shop') }); }
  w.martinaSpec = { x: 15, y: 0, z: 14.5, yaw: -PI / 2 - 0.4, s: 0.42, label: '🐢 Talk to Martina' };
  w.martinaSay = (g) => { const done = LEVELS.filter((L) => S.done[L.id]).length; const n = (S.stats.plays || 0) + done; const nick = n % 3 === 1 ? 'Torty' : 'Martina'; const lines = ['"Welcome back! I\u2019m ' + nick + ', the curator. Yes, a tortoise can run a museum. Slowly."', '"Professor Vintage keeps telling the Patrol it was YOU. Bring back relics and evidence and we\u2019ll prove him wrong!"', '"Tip: the Patrol can\u2019t see you inside a bush. Real explorers hide in bushes all the time."', '"Hold your torch up near bats and spiders. They hate it!"', '"Crack the whip near a golden ring to swing. Crack it near baddies to make them dizzy!"', done >= 5 ? '"You did it! Everyone calls me Torty now. I kind of like it."' : '"Need coins? Every coin you find buys gear in my shop. Torty\u2019s prices: very fair."'];
    g._mi = ((g._mi ?? -1) + 1) % lines.length; return (g._mi === 0 ? '' : '') + lines[g._mi]; };
  { const x = -18, z = -4; w.slab('m', 0x7c4a1e, x, 0, z, 3.0, 1.0, 1.8, 0.1); w.add('m', rbox(1.4, 0.12, 1.0, 0.03, 1), 0x7c2d12, x - 0.4, 1.06, z, 0, 0.2, 0); w.add('m', rbox(1.2, 0.05, 0.9, 0.02, 1), 0xfdf6e3, x - 0.4, 1.14, z, 0, 0.2, 0); w.add('x', rcyl(0.04, 0.6, 0.01, 8), 0x111827, x + 0.6, 1.0, z + 0.3); w.add('l', sph(12), 0xfff3c4, x + 0.9, 1.9, z - 0.5, 0, 0, 0, 0.2, 0.2, 0.2, 0.8); w.add('x', rcyl(0.03, 0.9, 0.01, 8), 0xd4a017, x + 0.9, 1.0, z - 0.5);
    w.kiosks.push({ id: 'journal', x: x + 1.6, y: 0, z, r: 2.2, label: '📓 Explorer\u2019s Journal', fn: (app) => app.openKiosk('journal') }); }
  { const x = -6, z = 15.5; w.slab('g', 0x1d4ed8, x, 0, z, 1.6, 1.4, 1.0, 0.1); w.add('m', rbox(1.4, 0.9, 0.06, 0.02, 1), 0xf5f5f4, x, 1.85, z + 0.4, -0.3, 0, 0); const t = textGeo('NEWS', 0.25, 0.06); if (t) w.add('g', t, 0xfacc15, x, 1.45, z + 0.52);
    w.kiosks.push({ id: 'news', x, y: 0, z: z - 1.4, r: 1.8, label: '📰 Read the newspaper', fn: (app) => app.openKiosk('news') }); }
  // benches, plants
  for (const [x, z, ry] of [[-10, 2, PI / 2], [10, 2, -PI / 2]]) PR.bench(w, x, 0, z, ry, 0x8b5a2b);
  for (const [x, z] of [[-22, 16], [22, 16], [-22, -20], [22, -20], [-4, 16.5], [4, 16.5]]) { PR.urn(w, x, 0, z, 1.2, 0xc2703d); PR.fern(w, x, 1.0, z, 1.2); }
  // courtyard outside the doors
  PR.ground(w, -30, 17.9, 30, 46, 0, (x, z) => (Math.abs(x) < 3 && z < 34) ? mix(0xd9c7a0, 0xc8b48a, fbm(x, z)) : grassCol(x, z), { bump: 0.2 });
  w.solid(-31, 0, 46, 31, 10, 47, { nocam: true }); w.solid(-31, 0, 18, -30, 10, 46, { nocam: true }); w.solid(30, 0, 18, 31, 10, 46, { nocam: true });
  PR.stairs(w, -3, 0, 17.5, 0, 0, 0.0, 1, 6, 0xe7dfd0);
  for (let i = 0; i < 14; i++) { const x = (i % 2 ? 1 : -1) * rr(8, 27), z = rr(24, 44); PR.jungleTree(w, x, 0, z, 0.8 + rnd() * 0.3); PR.fern(w, x + 2, 0, z + 1); }
  for (let i = 0; i < 10; i++) PR.bush(w, (i % 2 ? 1 : -1) * rr(4, 26), 0, rr(21, 44), 0.8 + rnd() * 0.4, 0x16a34a, { flowers: i % 3 === 0 });
  PR.grassTufts(w, -29, 20, 29, 45, 0, 500);
  { const x = 0, z = 34; w.add('m', rcyl(4, 0.8, 0.3, 40), 0xd6d3d1, x, 0, z); w.solid(x - 3.6, 0, z - 3.6, x + 3.6, 0.8, z + 3.6); w.add('e', rcyl(3.6, 0.1, 0.05, 40), 0x67e8f9, x, 0.62, z); w.add('m', rcyl(0.5, 2.2, 0.1, 24), 0xd6d3d1, x, 0.7, z); PR.monkeyStatue(w, x, 2.7, z, PI, 0x34d399, 0.5);
    w.anims.push((dt, t) => { if (w.game && Math.random() < 0.5) w.game.fx.emit(x + (Math.random() - 0.5) * 0.4, 4.4, z + (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 2, 3, (Math.random() - 0.5) * 2, 0.07, 0x9ff0ff, 0.9, 9, 0.5); }); }
  // the explorer jeep
  jeep(w, 12, 0, 30, -0.6);
  w.hint(-4, 8, 4, 16, '🗺️ Walk to the big map table and press ACT to pick an expedition!');
};
export function jeep(w, x, y, z, ry = 0, col = 0x65a30d) { const T = w.tf(x, y, z, ry); T.add('g', rbox(2.4, 0.9, 4.4, 0.35, 3), col, 0, 0.6, 0); T.add('g', rbox(2.3, 0.7, 1.6, 0.3, 3), shade(col, 0.9), 0, 1.3, 1.2); T.add('e', rbox(2.1, 0.7, 0.08, 0.04, 1), 0xbfe3ff, 0, 1.75, 0.35, -0.3, 0, 0);
  [-1, 1].forEach((s) => [-1, 1].forEach((b) => { T.add('m', rcyl(0.48, 0.38, 0.12, 24), 0x1f2937, s * 1.15, 0.48, b * 1.45, 0, 0, PI / 2); T.add('x', rcyl(0.24, 0.4, 0.05, 16), 0xd1d5db, s * 1.16, 0.48, b * 1.45, 0, 0, PI / 2); }));
  T.add('m', rcyl(0.48, 0.3, 0.12, 24), 0x1f2937, 0, 1.0, -2.3, PI / 2, 0, 0); T.add('f', rbox(2.0, 0.5, 1.4, 0.2, 2), 0x7c4a1e, 0, 1.3, -1.0); T.add('l', sph(10), 0xfff4c0, -0.8, 0.9, 2.22, 0, 0, 0, 0.18, 0.18, 0.08, 1); T.add('l', sph(10), 0xfff4c0, 0.8, 0.9, 2.22, 0, 0, 0, 0.18, 0.18, 0.08, 1);
  T.add('x', torus(0.08, 24), 0x374151, -0.5, 1.9, 0.9, -0.5, 0, 0, 0.35, 0.35, 0.35); T.solid(-1.2, 0, -2.3, 1.2, 1.6, 2.3); }
