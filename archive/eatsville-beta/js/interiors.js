// Interiors: every building has a densely-propped room with things to do. Rooms are built on entry at IX (far from town).
import * as THREE from 'three';
import { P } from './geo.js';
import { MATS } from './mats.js';
import { MB, toGroup, XB } from './kit.js';
import { PR } from './props.js';
import { rcyl, torus, lathe, leaf } from './shapes.js';
import { textGeo } from './text3d.js';
import { canvasTex, rng } from './util.js';
import { BLD, THEMES, DECOR , HOME_PAINT, HOME_FLOOR, HOME_FAB, HOME_ITEMS } from './data.js';
import { STATIONS, DISH } from './food.js';
import { makePerson } from './people.js';
import { makeRat, makeMartina, makeCandy } from './ratmodels.js';
const PI = Math.PI;
export const IX = 1000;
const floorMats = {};
function floorMat(kind, col) { const k = kind + col; if (floorMats[k]) return floorMats[k];
  const c = '#' + new THREE.Color(col).getHexString();
  const tex = canvasTex('fl' + k, 512, (g, s) => { const r = rng(7);
    if (kind === 'check') { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#f8fafc' : c; g.fillRect(i * s / 8, j * s / 8, s / 8, s / 8); } }
    else if (kind === 'wood') { for (let j = 0; j < 8; j++) { const sh = 0.85 + r() * 0.3; g.fillStyle = `rgb(${190 * sh | 0},${130 * sh | 0},${80 * sh | 0})`; g.fillRect(0, j * s / 8, s, s / 8); g.fillStyle = 'rgba(60,30,10,.35)'; g.fillRect(0, j * s / 8, s, 3); const o = r() * s; g.fillRect(o, j * s / 8, 3, s / 8);
        for (let k2 = 0; k2 < 30; k2++) { g.fillStyle = 'rgba(90,50,20,.12)'; g.fillRect(r() * s, j * s / 8 + r() * s / 8, 30 + r() * 60, 1.5); } } }
    else { g.fillStyle = c; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * s / 4, 0); g.lineTo(i * s / 4, s); g.stroke(); g.beginPath(); g.moveTo(0, i * s / 4); g.lineTo(s, i * s / 4); g.stroke(); }
      for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.08})`; g.fillRect(r() * s, r() * s, 2, 2); } } });
  return (floorMats[k] = new THREE.MeshPhysicalMaterial({ map: tex, roughness: kind === 'wood' ? 0.55 : 0.25, clearcoat: 0.5, clearcoatRoughness: 0.3 })); }
// ---------- room shell ----------
function shell(R, W, D, o) {
  const B = R.B, x = new XB(B, IX, 0, 0, 0); const wall = o.wall, trim = o.trim, H = 3.8;
  const fm = floorMat(o.floor || 'tile', o.floorCol || trim); const fl = new THREE.Mesh(new THREE.PlaneGeometry(W, D), fm); fm.map.repeat.set(W / 2.4, D / 2.4); fl.rotation.x = -PI / 2; fl.position.set(IX, 0.01, 0); fl.receiveShadow = true; R.grp.add(fl);
  x.p('m', P.rboxS, 0x9ca3af, 0, -0.1, 0, 0, 0, 0, W + 1, 0.2, D + 1);
  // back + side walls (full), wainscot, baseboard, crown
  x.p('w', P.rboxS, wall, 0, H / 2 + 1.3, -D / 2 - 0.15, 0, 0, 0, W + 0.6, H + 2.6, 0.3); for (const s of [-1, 1]) x.p('w', P.rboxS, wall, s * (W / 2 + 0.15), H + 1.3, -D / 2 + 1.2, 0, 0, 0, 0.3, 2.6, 2.4); for (const s of [-1, 1]) x.p('w', P.rboxS, wall, s * (W / 2 + 0.15), H / 2, 0, 0, 0, 0, 0.3, H, D + 0.6);
  x.p('w', P.rboxS, o.wains || trim, 0, 0.6, -D / 2 + 0.02, 0, 0, 0, W, 1.2, 0.06); for (const s of [-1, 1]) x.p('w', P.rboxS, o.wains || trim, s * (W / 2 - 0.02), 0.6, 0, 0, 0, 0, 0.06, 1.2, D);
  x.p('g', P.rboxS, 0xffffff, 0, 1.22, -D / 2 + 0.05, 0, 0, 0, W, 0.06, 0.1); for (const s of [-1, 1]) x.p('g', P.rboxS, 0xffffff, s * (W / 2 - 0.05), 1.22, 0, 0, 0, 0, 0.1, 0.06, D);
  x.p('g', P.rboxS, 0xffffff, 0, H - 0.1, -D / 2 + 0.06, 0, 0, 0, W, 0.2, 0.15); for (const s of [-1, 1]) x.p('g', P.rboxS, 0xffffff, s * (W / 2 - 0.06), H - 0.1, 0, 0, 0, 0, 0.15, 0.2, D);
  // front wall: low cut-away so the camera sees in, with a door gap
  const dx = o.doorX || 0, gap = 2.4; const lw = (W / 2 + dx) - gap / 2, rw = (W / 2 - dx) - gap / 2;
  if (lw > 0) x.p('w', P.rboxS, wall, -W / 2 + lw / 2 - 0.15, 0.45, D / 2 + 0.15, 0, 0, 0, lw + 0.3, 0.9, 0.3); if (rw > 0) x.p('w', P.rboxS, wall, W / 2 - rw / 2 + 0.15, 0.45, D / 2 + 0.15, 0, 0, 0, rw + 0.3, 0.9, 0.3);
  x.p('g', P.rboxS, trim, -W / 2 + lw / 2 - 0.15, 0.93, D / 2 + 0.15, 0, 0, 0, lw + 0.4, 0.08, 0.4); x.p('g', P.rboxS, trim, W / 2 - rw / 2 + 0.15, 0.93, D / 2 + 0.15, 0, 0, 0, rw + 0.4, 0.08, 0.4);
  x.p('f', P.rboxS, 0xb91c1c, dx, 0.02, D / 2 - 0.5, 0, 0, 0, 2, 0.02, 1.2); // door mat
  for (const s of [-1, 1]) x.p('g', P.rboxS, trim, dx + s * (gap / 2 + 0.1), 1.2, D / 2 + 0.15, 0, 0, 0, 0.2, 2.4, 0.35);
  // windows in back wall
  const nw = Math.floor(W / 4.5); for (let i = 0; i < nw; i++) { const wx = -W / 2 + (i + 0.5) * W / nw; if (o.noBackWin && o.noBackWin(wx)) continue;
    x.p('n', P.rboxS, 0xbfe6ff, wx, 2.5, -D / 2 + 0.02, 0, 0, 0, 1.6, 1.3, 0.04); x.p('g', P.rboxS, 0xffffff, wx, 2.5, -D / 2 + 0.06, 0, 0, 0, 1.8, 1.5, 0.05); x.p('n', P.rboxS, 0xbfe6ff, wx, 2.5, -D / 2 + 0.09, 0, 0, 0, 1.6, 1.3, 0.04);
    x.p('g', P.rboxS, 0xffffff, wx, 2.5, -D / 2 + 0.1, 0, 0, 0, 0.06, 1.3, 0.04); for (const s of [-1, 1]) x.p('f', P.rbox, o.curtain || trim, wx + s * 1.0, 2.45, -D / 2 + 0.16, 0, 0, 0, 0.35, 1.8, 0.08); x.p('f', P.rbox, o.curtain || trim, wx, 3.25, -D / 2 + 0.16, 0, 0, 0, 2.3, 0.3, 0.1); }
  R.W = W; R.D = D; R.door = { x: dx, z: D / 2 - 0.6 };
  R.col.push({ x0: -W / 2 - 1, x1: -W / 2, z0: -D / 2 - 1, z1: D / 2 + 1 }, { x0: W / 2, x1: W / 2 + 1, z0: -D / 2 - 1, z1: D / 2 + 1 }, { x0: -W / 2 - 1, x1: W / 2 + 1, z0: -D / 2 - 1, z1: -D / 2 });
  R.col.push({ x0: -W / 2 - 1, x1: dx - gap / 2, z0: D / 2, z1: D / 2 + 1 }, { x0: dx + gap / 2, x1: W / 2 + 1, z0: D / 2, z1: D / 2 + 1 });
}
// place a prop: name, local x,z, rotation (multiples of PI/2), opts; adds collider
function put(R, name, lx, lz, ry = 0, o = {}, y = 0) { const x = new XB(R.B, IX + lx, y, lz, ry); const hs = PR[name](x, o); if (hs && !o.nocol) { const sw = Math.abs(Math.sin(ry)) > 0.5; const hx = sw ? hs[1] : hs[0], hz = sw ? hs[0] : hs[1]; R.col.push({ x0: lx - hx, x1: lx + hx, z0: lz - hz, z1: lz + hz }); } return x; }
function spot(R, id, lx, lz, label, kind, data = {}, r = 1.4) { const s = Object.assign({ id, x: lx, z: lz, label, kind, r }, data); R.spots.push(s); return s; }
function wallArt(R, lx, ly, side, o) { // side: 'b' back, 'l', 'r'
  const D = R.D, W = R.W; let x; if (side === 'b') x = new XB(R.B, IX + lx, ly, -D / 2 + 0.08, 0); else if (side === 'l') x = new XB(R.B, IX - W / 2 + 0.08, ly, lx, PI / 2); else x = new XB(R.B, IX + W / 2 - 0.08, ly, lx, -PI / 2); PR.frame(x, o); }
function wallProp(R, name, lx, ly, side, o = {}) { const D = R.D, W = R.W; let x; if (side === 'b') x = new XB(R.B, IX + lx, ly, -D / 2 + 0.1, 0); else if (side === 'l') x = new XB(R.B, IX - W / 2 + 0.1, ly, lx, PI / 2); else x = new XB(R.B, IX + W / 2 - 0.1, ly, lx, -PI / 2); PR[name](x, o); }
function npc(R, model, lx, lz, ry, anim = 'idle', label) { model.position.set(IX + lx, 0, lz); model.rotation.y = ry; R.npcs.push({ m: model, anim, label, x: lx, z: lz }); R.grp.add(model); R.col.push({ x0: lx - 0.35, x1: lx + 0.35, z0: lz - 0.35, z1: lz + 0.35 }); }
function ratNPC(id) { const r = makeRat(id); if (r.blaster) r.blaster.visible = false; r.root.userData.ratRig = r; return r.root; }
function person(look) { return makePerson(Object.assign({ skin: 0xf2c29b, hair: 0x5a3820, hairStyle: 'short', shirt: 0x3fa7ff, pants: 0x334155, shoes: 0x222222, hat: 'none' }, look)); }
export const NPCLOOK = {
  inspector: { skin: 0xf2d0b0, hair: 0x6b6b6b, hairStyle: 'short', shirt: 0xe5e7eb, coat: 0x6b7280, pants: 0x4b5563, hat: 'fedora', hatCol: 0x374151, mustache: 0x4b4b4b, brows: 'grumpy', clipboard: true, tie: 0x0f766e, monocle: true, w: 0.92 },
  critic: { skin: 0xffd9b8, hair: 0x2b1d14, hairStyle: 'short', shirt: 0x111827, pants: 0x111827, hat: 'beret', hatCol: 0x7f1d1d, mustache: 0x2b1d14, bowtie: 0xdc2626, w: 1.05 },
  mo: { skin: 0xd9a07a, hair: 0x1f1f2a, hairStyle: 'spiky', shirt: 0xe11d48, pants: 0x1f2937, hat: 'cap', hatCol: 0xffd23f, mustache: 0x1f1f2a, w: 1.2 },
  sal: { skin: 0xf2c29b, hair: 0x1f1f2a, hairStyle: 'bun', shirt: 0x7c3aed, apron: 0x16a34a, pants: 0x1f2937, hat: 'none', w: 1.1 },
  mayor: { skin: 0x8d5a3b, hair: 0xd8d8e0, hairStyle: 'short', shirt: 0xffffff, coat: 0x1e3a8a, pants: 0x1e3a8a, hat: 'none', tie: 0xdc2626, w: 1.15, glasses: true },
};
// ---------- restaurant ----------
export const HOME_SLOTS = (L, Rr) => [[L + 6.5, 3.5], [3, 4.5], [-3, 4.5], [Rr - 5, 2], [L + 5.4, -1.4, 0], [Rr - 1, -4, -PI / 2], [-6, 5.4], [6, 5.4]];
export const REST = { W: 22, D: 16, stX: { grill: -8.2, fryer: -6.1, drinks: -4.0, oven: -1.8, prep: 0.4, freezer: 2.6, stove: 4.8 }, sinkX: 7.0, trashX: 9.4, stZ: -6.9, counterZ: -3.2,
  tables: [[-6, 0.6], [6, 0.6], [-2, 0.6], [2, 0.6], [-6, 4.4], [6, 4.4], [-2, 4.4], [2, 4.4]], office: [-9.3, 6.2], doorX: 0, decor: [[-10, -1.8], [10, -1.8], [-10, 2.5], [10, 2.5], [-4, 6.8], [4, 6.8]] };
export function seatsFor(level) { const n = [4, 6, 8][Math.min(2, level)]; const out = []; REST.tables.slice(0, n).forEach(([tx, tz], ti) => { out.push({ x: tx - 0.95, z: tz, ry: PI / 2, t: ti, side: -1 }, { x: tx + 0.95, z: tz, ry: -PI / 2, t: ti, side: 1 }); }); return out; }
function restaurant(R, br) {
  const th = THEMES.find((t) => t.id === br.theme) || THEMES[0]; const W = REST.W, D = REST.D;
  const brand = br.brand; // rival colours if owned by a rival
  const wall = brand ? brand.wall : th.wall, trim = brand ? brand.trim : th.trim, seat = brand ? brand.seat : th.seat;
  shell(R, W, D, { wall, trim, floor: brand ? 'check' : th.floor, floorCol: trim, doorX: REST.doorX, noBackWin: () => true });
  // kitchen back wall: tiles band + hood
  const x = new XB(R.B, IX, 0, 0, 0); x.p('g', P.rboxS, 0xffffff, 0, 1.9, -D / 2 + 0.06, 0, 0, 0, W, 1.4, 0.04); for (let i = 0; i < 22; i++) x.p('g', P.rboxS, i % 2 ? trim : 0xffffff, -W / 2 + 0.5 + i, 2.7, -D / 2 + 0.07, 0, 0, 0, 0.98, 0.2, 0.03);
  x.p('x', P.rbox, 0xd6dbe3, -2, 3.2, -D / 2 + 0.6, 0, 0, 0, 14.5, 0.5, 1.1);
  if (!br.vacant) {
    for (const [st, sx] of Object.entries(REST.stX)) { const owned = br.stations[st]; put(R, owned ? st : 'emptySlot', sx, REST.stZ, 0); if (owned) R.stations.push({ id: st, x: sx, z: REST.stZ + 1.0 }); }
    put(R, 'sink', REST.sinkX, REST.stZ, 0); spot(R, 'sink', REST.sinkX, REST.stZ + 1.0, 'Wash', 'sink', {}, 1.2);
    put(R, 'trash', REST.trashX, REST.stZ + 0.3, 0); spot(R, 'trash', REST.trashX, REST.stZ + 1.1, 'Trash', 'trash', {}, 1.2);
    put(R, 'fridge', -10.2, -6.6, PI / 2); put(R, 'shelf', -10.3, -4.6, PI / 2, { w: 1.4, h: 1.8, items: 'jars' });
    // pass counter with gaps at both ends
    put(R, 'counter', -1.0, REST.counterZ, 0, { w: 13, col: trim, top: 0xf1f5f9 });
    for (let i = 0; i < 5; i++) put(R, 'stool', -6 + i * 2.5, REST.counterZ + 0.8, 0, { col: seat });
    put(R, 'register', 5.0, REST.counterZ, 0, { nocol: true });
    const lines = (br.menu || []).slice(0, 3).map((d) => (DISH[d] ? DISH[d].n.toUpperCase() + '  $' + Math.round(DISH[d].price * (br.priceK || 1)) : ''));
    wallProp(R, 'menuBoard', -2, 0.2, 'b', { w: 5, lines: [brand ? brand.n : (br.name || 'MENU').toUpperCase(), ...lines] });
    // dining tables
    const seats = seatsFor(br.level || 0); R.seats = seats;
    REST.tables.slice(0, [4, 6, 8][Math.min(2, br.level || 0)]).forEach(([tx, tz]) => { put(R, 'table', tx, tz, 0, { col: 0xffffff, cloth: brand ? null : (th.id === 'forest' ? 0xfef3c7 : null) }); put(R, 'chair', tx - 0.95, tz, PI / 2, { col: seat }); put(R, 'chair', tx + 0.95, tz, -PI / 2, { col: seat }); put(R, 'pendant', tx, tz, 0, { col: trim, nocol: true }); });
    R.tableSpots = REST.tables;
    const flowers = [0xff6b9a, 0xfacc15, 0xa78bfa, 0xf97316]; REST.tables.slice(0, [4, 6, 8][Math.min(2, br.level || 0)]).forEach(([tx, tz], i) => put(R, 'tableTop', tx, tz - 0.05, (i % 3) * 0.6, { flower: flowers[i % 4], vase: brand ? trim : 0x93c5fd }));
    put(R, 'cakeDome', 3.4, REST.counterZ, 0, { cake: brand ? 0xfde68a : 0xf9a8d4 }); put(R, 'tipJar', 5.9, REST.counterZ, 0); put(R, 'cakeDome', -6.8, REST.counterZ, 0.4, { cake: 0x92400e });
    { const pr = new XB(R.B, IX - 2, 2.9, REST.stZ - 0.15, 0); PR.potRack(pr, { w: 9 }); }
    put(R, 'easel', REST.doorX + 2.3, D / 2 - 1.3, -0.3, { t1: 'TODAY:', t2: br.special && DISH[br.special] ? DISH[br.special].n.toUpperCase().slice(0, 12) : 'SMILES!' });
    put(R, 'bench', REST.doorX - 6.3, D / 2 - 0.75, PI); put(R, 'plant', REST.doorX - 1.6, D / 2 - 0.6, 0, { pot: trim }); put(R, 'plant', REST.doorX + 1.6, D / 2 - 0.6, 0, { pot: trim });
    // office corner
    put(R, 'desk', REST.office[0], REST.office[1] + 0.2, PI / 2, { screen: trim }); spot(R, 'office', REST.office[0] + 1.0, REST.office[1] + 0.2, br.brand ? 'Clock in' : 'Office', 'office', {}, 1.4);
    put(R, 'plant', -10.2, 4.5, 0); put(R, 'plant', 10.2, 6.6, 0); put(R, 'coatRack', 10.3, 5.2, 0); put(R, 'waterCooler', -10.3, 0.6, 0);
    wallProp(R, 'clock', 7, 3.0, 'b'); wallArt(R, -3, 2.3, 'l', { art: 'burger', w: 1.4, h: 1 }); wallArt(R, 3.5, 2.3, 'l', { art: 'sun', w: 1.2, h: 1 }); wallArt(R, -3, 2.3, 'r', { art: 'heart', w: 1.2, h: 1 }); wallArt(R, 3.5, 2.3, 'r', { art: 'star', w: 1.2, h: 1 });
    wallArt(R, 9.4, 1.9, 'b', { art: 'text', text: 'WASH HANDS!', w: 1.6, h: 0.6 });
    // decor slots
    (br.decor || []).forEach((d, i) => { const p = REST.decor[i]; if (!p) return; const map = { plant: 'palm', aquarium: 'aquarium', jukebox: 'jukebox', arcade: 'arcade', statue: 'statue', fountain: 'chocFountain', neon: 'neon', piano: 'piano' }; const nm = map[d]; if (!nm) return;
      if (nm === 'neon') wallProp(R, 'neon', p[1], 2.6, p[0] < 0 ? 'l' : 'r'); else put(R, nm, p[0], p[1], p[0] < -5 ? PI / 2 : p[0] > 5 ? -PI / 2 : PI); });
    spot(R, 'exit', REST.doorX, D / 2 - 0.4, 'Exit', 'exit', {}, 1.3);
    if (brand && brand.boss) { const m = person(NPCLOOK[brand.boss]); npc(R, m, 8.2, 1.8, -PI / 2, 'idle', brand.bossName); spot(R, 'boss', 7.2, 1.8, 'Talk to ' + brand.bossName, 'boss', {}, 1.4); }
  } else {
    // empty shell for sale: dust sheets, boxes, ladder, realtor
    put(R, 'boxPile', -7, -5, 0); put(R, 'boxPile', 6, -6, 0.3); put(R, 'ladder', 3, -2, 0); put(R, 'paint', -3, -6.5, 0); put(R, 'crate', 8, 3, 0); put(R, 'crate', 8.6, 3.9, 0.4, { s: 0.5 });
    for (let i = 0; i < 3; i++) { const g = new XB(R.B, IX - 5 + i * 5, 0, 1, 0); g.p('f', P.sphere, 0xf1f5f9, 0, 0.5, 0, 0, i, 0, 1.0, 0.6, 0.8); R.col.push({ x0: -6 + i * 5, x1: -4 + i * 5, z0: 0.2, z1: 1.8 }); }
    put(R, 'plant', -10, 6, 0); wallArt(R, 0, 2.3, 'l', { art: 'text', text: 'COMING SOON?', w: 2.4, h: 0.8, tcol: 0x7c3aed });
    const m = person({ shirt: 0xffffff, coat: 0x0f766e, hairStyle: 'bun', hair: 0x9a5b2a, skin: 0xffd9b8, clipboard: true }); npc(R, m, 0, 3, 0, 'wave', 'Realtor Rita');
    spot(R, 'buy', 0, 4.2, 'Buy this place', 'buyLot', {}, 1.6); spot(R, 'exit', REST.doorX, D / 2 - 0.4, 'Exit', 'exit', {}, 1.3);
  }
}
// ---------- other buildings ----------
const LAYOUT = {
  home(R, st) { const lv = st.homeLevel || 0, W = [16, 20, 24][lv], D = 14; const hs = st.home || {}; const paint = HOME_PAINT.find((p) => p.id === hs.wall), fl = HOME_FLOOR.find((f) => f.id === hs.floor) || HOME_FLOOR[0], fab = HOME_FAB[hs.fab || 0];
    shell(R, W, D, { wall: paint ? paint.c : [0xfff1e6, 0xe0f2fe, 0xfdf4ff][lv], trim: fab, floor: fl.k, floorCol: fl.c, curtain: fab, doorX: -W / 2 + 3 });
    const L = -W / 2, Rr = W / 2;
    put(R, 'bed', L + 1.6, -4.8, 0, { col: fab }); spot(R, 'bed', L + 1.6, -2.9, 'Sleep', 'bed', {}, 1.5); put(R, 'lamp', L + 3.0, -6.2, 0); put(R, 'rug', L + 2, -1.6, 0, { col: 0xc4b5fd, w: 1.6, d: 1 });
    put(R, 'wardrobe', L + 4.5, -6.3, 0); spot(R, 'wardrobe', L + 4.5, -5.1, 'Wardrobe', 'wardrobe', {}, 1.3);
    put(R, 'sofa', 0, 1.2, PI, { col: fab }); put(R, 'tv', 0, -2.4, 0); spot(R, 'tv', 0, -0.4, 'Watch TV news', 'tv', {}, 1.4); put(R, 'rug', 0, -0.4, 0, { col: 0xfde68a, col2: 0xf97316, w: 2.6, d: 1.6 });
    put(R, 'fridge', Rr - 0.8, -6.2, -PI / 2); spot(R, 'fridge', Rr - 2.0, -6.2, 'Snack', 'fridge', {}, 1.3); put(R, 'counter', Rr - 3.2, -6.4, 0, { w: 2.4, col: 0xfef3c7 }); put(R, 'stove', Rr - 5.4, -6.4, 0);
    put(R, 'table', Rr - 3.2, -2.6, 0, { round: true, cloth: 0xfecaca }); put(R, 'chair', Rr - 4.2, -2.6, PI / 2, { col: 0x8b5cf6 }); put(R, 'chair', Rr - 2.2, -2.6, -PI / 2, { col: 0x8b5cf6 });
    put(R, 'desk', L + 1.2, 1.8, PI / 2, { screen: 0xff4fa0 }); spot(R, 'pc', L + 2.2, 1.8, 'Empire laptop', 'empire', {}, 1.3);
    put(R, 'shelf', Rr - 0.5, 0.5, -PI / 2, { w: 1.8, h: 1.6, items: 'books' }); for (let i = 0; i < Math.min(5, (st.trophies || 0)); i++) { const tx = new XB(R.B, IX + Rr - 0.5, 1.75, -0.2 + i * 0.35, -PI / 2); PR.trophy(tx); }
    spot(R, 'trophies', Rr - 1.6, 0.5, 'Trophy shelf', 'trophies', {}, 1.2);
    put(R, 'plant', Rr - 0.7, 5.5, 0); put(R, 'plant', L + 0.7, 5.5, 0, { pot: 0x60a5fa }); put(R, 'coatRack', -W / 2 + 5, 6.2, 0);
    wallArt(R, -3, 2.3, 'b', { art: 'hills', w: 1.6, h: 1.1 }); wallArt(R, 3, 2.3, 'b', { art: 'heart', w: 1, h: 1 }); wallArt(R, -2, 2.3, 'r', { art: 'star', w: 1, h: 1 }); wallProp(R, 'clock', 0, 3.1, 'l');
    // garage nook (door on right side)
    const gx = new XB(R.B, IX + Rr - 1.2, 0, 3.6, 0); gx.p('g', P.rboxS, 0x9ca3af, 0, 1.4, 0, 0, 0, 0, 1.6, 2.8, 0.2); for (let i = 0; i < 6; i++) gx.p('g', P.rboxS, 0xe5e7eb, 0, 0.3 + i * 0.45, 0.12, 0, 0, 0, 1.5, 0.05, 0.05);
    spot(R, 'garage', Rr - 1.2, 4.4, 'Garage (pick car)', 'garage', {}, 1.3);
    (st.homeDecor || []).forEach((d, i) => { const p = HOME_SLOTS(L, Rr)[i]; if (!p) return; const hi = HOME_ITEMS.find((h) => h.id === d); const map = { plant: 'palm', aquarium: 'aquarium', jukebox: 'jukebox', arcade: 'arcade', statue: 'statue', fountain: 'chocFountain', neon: 'palm', piano: 'piano' };
      if (hi) put(R, hi.prop, p[0], p[1], p[2] == null ? PI : p[2], Object.assign({ col: fab }, hi.o || {})); else put(R, map[d] || 'palm', p[0], p[1], p[2] == null ? PI : p[2]); });
    spot(R, 'decor', 2.5, 5.6, 'Decorate home', 'homeDecor', {}, 1.2);
    spot(R, 'exit', R.door.x, D / 2 - 0.4, 'Exit', 'exit', {}, 1.3);
    if (st.pet !== false) { const cr = makeCandy(); const c = cr.root; c.userData.candyRig = cr; c.scale.setScalar(0.55); npc(R, c, 2.2, 0.2, -0.6, 'pet', 'Candy'); spot(R, 'pet', 2.2, 1.1, 'Pet Candy', 'pet', {}, 1.2); }
  },
  house(R, st, b) { shell(R, 14, 12, { wall: new THREE.Color(b.col).lerp(new THREE.Color(0xffffff), 0.5).getHex(), trim: b.col2, floor: 'wood', curtain: b.col2, doorX: 2 });
    put(R, 'sofa', -3, -1, 0, { col: b.col2 }); put(R, 'tv', -3, -4.8, 0); put(R, 'rug', -3, -2.8, 0, { col: b.col, w: 2.4, d: 1.4 }); put(R, 'lamp', -5.8, -4.6, 0);
    put(R, 'table', 3.2, -1.6, 0, { cloth: 0xffffff }); put(R, 'chair', 2.2, -1.6, PI / 2, { col: b.col2 }); put(R, 'chair', 4.2, -1.6, -PI / 2, { col: b.col2 }); put(R, 'pendant', 3.2, -1.6, 0, { nocol: true, col: b.col2 });
    put(R, 'fridge', 6.3, -4.9, -PI / 2); put(R, 'counter', 4.3, -5.2, 0, { w: 2.4, col: 0xffffff }); put(R, 'shelf', -6.5, 1.5, PI / 2, { w: 1.6, h: 1.8, items: 'books', seed: b.x | 0 }); put(R, 'plant', 6.2, 4.5, 0); put(R, 'plant', -6.2, 4.5, 0, { pot: 0x22d3ee });
    wallArt(R, -3, 2.4, 'b', { art: 'hills', w: 1.5, h: 1 }); wallArt(R, 3.5, 2.4, 'b', { art: 'heart', w: 0.9, h: 0.9 }); wallProp(R, 'clock', 0, 3, 'r');
    const r = rng((b.x * 7 + b.z) | 0); const fam = []; for (let i = 0; i < 2; i++) { const L = { skin: [0xffd9b8, 0xd9a07a, 0x8d5a3b][(r() * 3) | 0], hair: [0x2b1d14, 0x9a5b2a, 0xe0b25a][(r() * 3) | 0], hairStyle: ['short', 'long', 'curly', 'pony'][(r() * 4) | 0], shirt: [0xff5a5f, 0x3fa7ff, 0x4ade80, 0xffc93c][(r() * 4) | 0], kid: i === 1 }; fam.push(L); }
    npc(R, person(fam[0]), 0.6, 1.4, 0, 'wave', b.name); npc(R, person(fam[1]), -1.2, 2.0, 0.3, 'idle');
    spot(R, 'family', 0.6, 2.6, 'Say hi', 'family', { house: b.id }, 1.6); spot(R, 'exit', R.door.x, 5.6, 'Exit', 'exit', {}, 1.3);
  },
  hall(R) { shell(R, 22, 14, { wall: 0xf1ead8, trim: 0x1e3a8a, floor: 'check', floorCol: 0x1e3a8a, curtain: 0x1e3a8a });
    put(R, 'counter', -6, -4.5, 0, { w: 5, col: 0x7c4a2d, top: 0xf1f5f9 }); for (let i = 0; i < 3; i++) { const x = new XB(R.B, IX - 8 + i * 2, 0.95, -4.5, 0); x.p('e', P.rboxS, 0xe0f2fe, 0, 0.6, 0.2, 0, 0, 0, 1.6, 1.2, 0.04); }
    npc(R, person({ shirt: 0xffffff, tie: 0x1e3a8a, hairStyle: 'pony', hair: 0x2b1d14, skin: 0xd9a07a }), -6, -5.6, 0, 'idle', 'Bank Teller'); spot(R, 'bank', -6, -3.3, 'Bank (loans)', 'bank', {}, 1.6);
    put(R, 'vault', -9.8, -6.6, 0, { nocol: true }); wallProp(R, 'vault', -9.6, 0, 'b');
    put(R, 'desk', 5.5, -4.6, 0, { col: 0x7c4a2d, screen: 0x22c55e }); npc(R, person(NPCLOOK.mayor), 5.5, -5.7, 0, 'wave', 'Mayor Bloom'); spot(R, 'mayor', 5.5, -3.4, 'Talk to the Mayor', 'mayor', {}, 1.6);
    put(R, 'flag', 3.2, -6.4, 0, { col: 0x2563eb }); put(R, 'flag', 7.8, -6.4, 0, { col: 0xdc2626 });
    // job board
    const jb = new XB(R.B, IX + 10.8, 0, 0, -PI / 2); jb.p('m', P.rboxS, 0x8b5a2b, 0, 1.8, 0, 0, 0, 0, 3.2, 1.8, 0.1); jb.p('f', P.rboxS, 0xd6a77a, 0, 1.8, 0.05, 0, 0, 0, 3.0, 1.6, 0.04);
    for (let i = 0; i < 6; i++) { jb.p('m', P.rboxS, [0xffffff, 0xfef3c7, 0xdbeafe][i % 3], -1.0 + (i % 3) * 1.0, 2.2 - ((i / 3) | 0) * 0.75, 0.09, 0, 0, (i - 2) * 0.04, 0.7, 0.55, 0.01); jb.p('g', P.sphere, 0xef4444, -1.0 + (i % 3) * 1.0, 2.45 - ((i / 3) | 0) * 0.75, 0.1, 0, 0, 0, 0.04); }
    spot(R, 'jobs', 9.6, 0, 'Hire staff', 'hire', {}, 1.6);
    for (let i = 0; i < 3; i++) put(R, 'bench', -6 + i * 4, 2.6, PI, { col: 0x7c4a2d }); put(R, 'palm', -10, 5.5, 0); put(R, 'palm', 10, 5.5, 0); put(R, 'waterCooler', -10.2, 1.2, 0); put(R, 'statue', 0, -1.2, 0);
    wallArt(R, -2, 2.4, 'b', { art: 'text', text: 'EATSVILLE', w: 2.6, h: 0.9, tcol: 0x1e3a8a }); wallArt(R, 2.5, 2.4, 'l', { art: 'star', w: 1, h: 1 }); wallProp(R, 'clock', 0, 3.2, 'b');
    spot(R, 'exit', 0, 6.6, 'Exit', 'exit', {}, 1.3);
  },
  gazette(R) { shell(R, 18, 12, { wall: 0xe2e8f0, trim: 0x111827, floor: 'wood', curtain: 0x475569 });
    put(R, 'press', -4, -4, 0); put(R, 'paperStack', -1, -4.5, 0); put(R, 'paperStack', -1.4, -3.8, 0.4);
    for (let i = 0; i < 3; i++) { put(R, 'desk', 2 + i * 2.4, -1, PI, { col: 0x64748b, screen: [0x22c55e, 0xf59e0b, 0x38bdf8][i] }); put(R, 'chair', 2 + i * 2.4, -1.8, PI, { col: 0x111827 }); }
    npc(R, person({ shirt: 0xfef3c7, tie: 0x111827, hairStyle: 'curly', hair: 0xe0b25a, glasses: true, skin: 0xffd9b8 }), 4.4, 1.0, PI, 'work', 'Editor Ink');
    spot(R, 'news', 4.4, 2.2, 'Read reviews & news', 'news', {}, 1.6); spot(R, 'ads', -4, -2.4, 'Buy an ad', 'ads', {}, 1.6);
    put(R, 'shelf', -8.3, 1.5, PI / 2, { items: 'books', w: 2, h: 2 }); put(R, 'shelf', 8.3, 1.5, -PI / 2, { items: 'boxes', w: 2, h: 2 }); put(R, 'plant', -8, 5, 0); put(R, 'waterCooler', 8.2, 5, 0); put(R, 'coatRack', 7, -5, 0);
    wallArt(R, -2, 2.6, 'r', { art: 'text', text: 'HOT OFF THE PRESS', w: 2.2, h: 0.6, tcol: 0xdc2626 }); wallProp(R, 'clock', 4, 3.0, 'b');
    spot(R, 'exit', 0, 5.6, 'Exit', 'exit', {}, 1.3);
  },
  market(R) { shell(R, 22, 14, { wall: 0xdcfce7, trim: 0x16a34a, floor: 'tile', floorCol: 0x16a34a });
    for (let i = 0; i < 4; i++) { put(R, 'shelf', -8 + i * 4, -2.5, 0, { w: 2.6, h: 1.8, items: ['produce', 'cans', 'jars', 'boxes'][i], seed: i }); put(R, 'shelf', -8 + i * 4, -3.2, PI, { w: 2.6, h: 1.8, items: ['boxes', 'produce', 'cans', 'jars'][i], seed: i + 5 }); }
    for (let i = 0; i < 4; i++) put(R, 'produceBin', -7.5 + i * 2.2, -5.9, 0, { col: [0xef4444, 0xfacc15, 0x22c55e, 0xfb923c][i] });
    put(R, 'fridge', 9.5, -5.8, -PI / 2, { col: 0xdbeafe }); put(R, 'fridge', 9.5, -4.6, -PI / 2, { col: 0xdbeafe }); put(R, 'freezer', 6, -6.2, 0);
    put(R, 'checkout', 5.5, 2.5, 0); npc(R, person({ shirt: 0x16a34a, apron: 0xffffff, hairStyle: 'short', hair: 0x2b1d14, skin: 0x8d5a3b, hat: 'cap', hatCol: 0x16a34a }), 5.5, 1.6, 0, 'idle', 'Grocer Gus');
    spot(R, 'stock', 5.5, 3.6, 'Buy ingredients', 'stock', {}, 1.7); put(R, 'cart', -9, 4.8, 0.2); put(R, 'cart', -8.2, 5.2, 0.4); put(R, 'crate', 9.6, 3, 0, { fill: 0xef4444 }); put(R, 'crate', 9.6, 4.2, 0, { fill: 0xfacc15 });
    wallArt(R, -2, 2.5, 'l', { art: 'text', text: 'FRESH!', w: 1.6, h: 0.7, tcol: 0x16a34a }); wallProp(R, 'clock', -6, 3.1, 'b');
    spot(R, 'exit', 0, 6.6, 'Exit', 'exit', {}, 1.3);
  },
  health(R) { shell(R, 18, 12, { wall: 0xe5e7eb, trim: 0x0f766e, floor: 'tile', floorCol: 0x0f766e });
    put(R, 'desk', 0, -3.6, 0, { col: 0x0f766e, screen: 0xef4444 }); npc(R, person(NPCLOOK.inspector), 0, -4.7, 0, 'angry', 'Inspector Grumbleton');
    spot(R, 'fines', 0, -2.4, 'Pay fines / Grades', 'fines', {}, 1.6); spot(R, 'quiz', -5.6, -2.8, 'Hygiene quiz', 'quiz', {}, 1.5);
    put(R, 'shelf', -7.2, -4.5, PI / 2, { items: 'boxes', w: 2, h: 2.2 }); put(R, 'shelf', 7.2, -4.5, -PI / 2, { items: 'books', w: 2, h: 2.2 }); put(R, 'desk', -5.6, -4, 0, { pc: true, screen: 0x22c55e });
    for (let i = 0; i < 4; i++) put(R, 'chair', -6 + i * 1.2, 3.5, PI, { col: 0x0f766e }); put(R, 'waterCooler', 7.5, 3, 0); put(R, 'plant', 7.5, 5, 0); put(R, 'sink', 5.6, -4.8, 0);
    wallArt(R, -3, 2.5, 'b', { art: 'text', text: 'WASH HANDS', w: 1.8, h: 0.7 }); wallArt(R, 3.5, 2.5, 'b', { art: 'text', text: 'NO MESSES', w: 1.8, h: 0.7, tcol: 0xdc2626 }); wallArt(R, 0, 2.5, 'l', { art: 'text', text: 'GRADE A OR ELSE', w: 2.2, h: 0.6, tcol: 0x0f766e }); wallProp(R, 'clock', 0, 3.1, 'r');
    spot(R, 'exit', 0, 5.6, 'Exit', 'exit', {}, 1.3);
  },
  ratita(R) { shell(R, 22, 15, { wall: 0xf5f3ff, trim: 0xff4fa0, floor: 'tile', floorCol: 0xa78bfa, curtain: 0xff4fa0 });
    const sts = ['oven', 'prep', 'freezer', 'stove']; sts.forEach((s, i) => { put(R, 'podium', -7.5 + i * 5, -1.8, 0, { col: 0xffffff }); const x = new XB(R.B, IX - 7.5 + i * 5, 0.9, -2.0, 0); const sc = { p: (k, g, c, px, py, pz, rx, ry, rz, sx, sy, sz, em) => x.p(k, g, c, px * 0.5, py * 0.5, pz * 0.5, rx, ry, rz, (sx ?? 1) * 0.5, (sy ?? sx ?? 1) * 0.5, (sz ?? sx ?? 1) * 0.5, em) }; PR[s](sc); });
    put(R, 'counter', 0, -5.2, 0, { w: 8, col: 0xff4fa0, top: 0xffffff }); put(R, 'shelf', -9.8, -4.5, PI / 2, { items: 'gadgets', w: 2.4, h: 2.2 }); put(R, 'shelf', 9.8, -4.5, -PI / 2, { items: 'gadgets', w: 2.4, h: 2.2, seed: 3 });
    put(R, 'robot', -9.5, 3, 0.6); put(R, 'robot', 9.5, 3, -0.6); put(R, 'palm', -9.8, 6, 0); put(R, 'palm', 9.8, 6, 0);
    const luna = ratNPC('luna'); luna.scale.setScalar(1.7); npc(R, luna, -2, -6.2, 0, 'rat', 'Luna'); const pir = ratNPC('pirat'); pir.scale.setScalar(1.7); npc(R, pir, 0.5, -6.2, 0, 'rat', 'Pi-rat'); const sno = ratNPC('snowie'); sno.scale.setScalar(1.7); npc(R, sno, 3, -6.2, 0, 'rat', 'Snowie');
    spot(R, 'shop', 0, -4.0, 'Kitchen Tech shop', 'ratitaShop', {}, 2.0); sts.forEach((s, i) => spot(R, 'look' + s, -7.5 + i * 5, -0.6, STATIONS[s].n, 'ratitaShop', {}, 1.2));
    wallArt(R, -4, 2.6, 'b', { art: 'rat', w: 1.6, h: 1.2 }); wallArt(R, 4, 2.6, 'b', { art: 'text', text: 'OOPS-PROOF*', w: 2, h: 0.7, tcol: 0xff4fa0 }); wallArt(R, 0, 2.5, 'l', { art: 'text', text: '*MOSTLY', w: 1.4, h: 0.5, tcol: 0x7c3aed });
    spot(R, 'exit', 0, 7.1, 'Exit', 'exit', {}, 1.3);
  },
  cars(R, st) { shell(R, 24, 14, { wall: 0xdbeafe, trim: 0xf97316, floor: 'tile', floorCol: 0x94a3b8 });
    const kinds = [['van', 0xffd23f], ['pickup', 0x3fa7ff], ['sport', 0xa855f7], ['hover', 0xff4fa0]]; kinds.forEach(([k, c], i) => { put(R, 'carShow', -8.4 + i * 5.6, -2.6, 0.5, { kind: k, col: c }); spot(R, 'car' + k, -8.4 + i * 5.6, 0.3, 'Look at car', 'carShop', {}, 1.6); });
    put(R, 'desk', 6, 4, PI, { col: 0xf97316 }); npc(R, person({ shirt: 0xf97316, tie: 0x111827, hairStyle: 'spiky', hair: 0xe0b25a, skin: 0xf2c29b, glasses: true }), 6, 4.9, PI, 'wave', 'Wheelie Walt');
    spot(R, 'dealer', 6, 3.0, 'Buy a car', 'carShop', {}, 1.6); put(R, 'plant', -11, 5.5, 0); put(R, 'plant', 11, 5.5, 0); put(R, 'vending', -11, 2, PI / 2); put(R, 'sofa', -6, 4.8, PI, { col: 0xf97316 });
    for (let i = 0; i < 5; i++) put(R, 'flag', -10 + i * 5, -6.5, 0, { col: [0xef4444, 0xfacc15, 0x3b82f6][i % 3], nocol: true });
    spot(R, 'exit', 0, 6.6, 'Exit', 'exit', {}, 1.3);
  },
  style(R) { shell(R, 18, 12, { wall: 0xfce7f3, trim: 0xdb2777, floor: 'wood', curtain: 0xdb2777 });
    for (let i = 0; i < 3; i++) put(R, 'rackClothes', -5 + i * 5, -1.5, 0, { seed: i * 2 }); for (let i = 0; i < 4; i++) put(R, 'mannequin', -6 + i * 4, -4.8, 0, { col: [0xffffff, 0xff4fa0, 0x4ade80, 0x7c3aed][i] });
    put(R, 'mirror', 8.6, 0, -PI / 2, { nocol: true }); wallProp(R, 'mirror', 1, 0, 'r'); put(R, 'shelf', -8.3, 2, PI / 2, { items: 'fabric', w: 2, h: 2 }); put(R, 'counter', 3, 3, 0, { w: 2.5, col: 0xdb2777 });
    npc(R, person({ shirt: 0xdb2777, hairStyle: 'long', hair: 0xff7ab8, skin: 0xffd9b8, glasses: true }), 3, 2.1, 0, 'wave', 'Tailor Tess'); spot(R, 'outfits', 3, 4.2, 'Costumes & outfits', 'outfits', {}, 1.7);
    put(R, 'plant', -8, 5, 0); put(R, 'rug', -2, 3, 0, { col: 0xf9a8d4, w: 2.4, d: 1.6 });
    spot(R, 'exit', 0, 5.6, 'Exit', 'exit', {}, 1.3);
  },
};
export { ratNPC };
export function buildInterior(bid, ctx) {
  const b = BLD[bid]; const R = { grp: new THREE.Group(), B: MB(), col: [], spots: [], stations: [], npcs: [], seats: [], bid, kind: b.kind };
  if (b.kind === 'rest') restaurant(R, ctx.branch(bid)); else (LAYOUT[b.kind] || LAYOUT.house)(R, ctx.state, b);
  const g = toGroup(R.B); g.traverse((o) => { if (o.isMesh && o.userData.mk === 'w') o.receiveShadow = true; }); R.grp.add(g);
  return R;
}
export function collideRoom(R, x, z, rad) { // x,z are room-local
  let hit = false;
  for (const c of R.col) { if (x > c.x0 - rad && x < c.x1 + rad && z > c.z0 - rad && z < c.z1 + rad) { hit = true; const dl = x - (c.x0 - rad), dr = c.x1 + rad - x, dt = z - (c.z0 - rad), db = c.z1 + rad - z, m = Math.min(dl, dr, dt, db);
      if (m === dl) x = c.x0 - rad; else if (m === dr) x = c.x1 + rad; else if (m === dt) z = c.z0 - rad; else z = c.z1 + rad; } }
  return { x, z, hit };
}
