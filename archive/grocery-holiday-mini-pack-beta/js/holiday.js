// DLC #58 Grocery Tycoon MINI PACK (25 tickets): HOLIDAY DECOR, UNIFORMS and a THANKSGIVING AISLE.
//  - Holiday decor: pick HARVEST (Thanksgiving) or WINTER HOLIDAYS (or off) in the Journal. Every store you own gets themed garlands,
//    wreaths, ceiling lights, an entrance display and facade decorations (rebuilt with the store's decor, so it streams like the rest).
//  - Uniforms: 7 apron + cap colours for your whole staff (and you).
//  - Thanksgiving Aisle: a new sales-floor fixture (turkeys, pies, cranberry sauce, stuffing, gravy, pumpkins, sweet potatoes) with
//    harvest endcaps and plush Luna, Pi-rat, Snowie, Candy and Torty. Main St gets one for free the first time you play with the pack.
// Unlocked by the Grok Arcade DLC Shop: localStorage 'grokDLC.grocery.you_choose' (Time Jumper builds are unlocked for testing).
import * as THREE from 'three';
import { PI, R, pick, rcyl, sph, cyl, cone, torus, capsule, star, blobGeo, txt, poster } from './art.js?v=ggt21mp';
import { rbox } from './world.js?v=ggt21mp';
export const KEY = 'grokDLC.grocery.you_choose';
const QS = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(''); } })();
export function owned() { try { if (QS.get('locked') === '1') return false; if (/\/(previews|archive)\//.test(location.pathname)) return true;
  if (localStorage.getItem(KEY)) return true; const l = JSON.parse(localStorage.getItem('grokDLC.owned') || '[]'); return Array.isArray(l) && l.indexOf(KEY) >= 0; } catch (e) { return false; } }
export const OWN = owned();
export const THEMES = { harvest: { n: 'Harvest (Thanksgiving)', e: '🦃' }, winter: { n: 'Winter Holidays', e: '🎄' }, off: { n: 'No decorations', e: '🚫' } };
export const UNIFORMS = [
  { id: 'classic', n: 'Classic Green', e: '🟢', c: 0x16a34a }, { id: 'harvest', n: 'Harvest Orange', e: '🍂', c: 0xea580c }, { id: 'cranberry', n: 'Cranberry', e: '🍒', c: 0x9f1239 },
  { id: 'holly', n: 'Holly Red', e: '🎅', c: 0xdc2626 }, { id: 'pine', n: 'Pine Green', e: '🌲', c: 0x166534 }, { id: 'navy', n: 'Navy Pro', e: '🔵', c: 0x1e3a8a }, { id: 'candy', n: 'Candy Pink', e: '🍬', c: 0xec4899 }];
export const uniformCol = (id) => (UNIFORMS.find((u) => u.id === id) || UNIFORMS[0]).c;
// ---------------------------------------------------------------- the player's apron + cap (only when you own the pack)
export function dressPlayer(rig, id) { if (!OWN || !rig || !rig.body || !id) return; const c = uniformCol(id), m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 }), w = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const ap = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 0.04), m); ap.position.set(0, 1.0, 0.3); ap.rotation.x = 0.05; rig.body.add(ap); const tag = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.02), w); tag.position.set(0.1, 1.14, 0.325); rig.body.add(tag);
  const st = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 6, 24, PI), m); st.position.set(0, 1.28, 0.06); st.rotation.set(-0.3, 0, 0); rig.body.add(st);
  if (rig.head) { const cap = new THREE.Mesh(new THREE.SphereGeometry(0.29, 18, 10, 0, PI * 2, 0, PI / 2), m); cap.position.set(0, 0.36, -0.01); cap.scale.set(1, 0.7, 1); rig.head.add(cap); const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 18), m); brim.position.set(0, 0.37, 0.24); brim.scale.set(1, 1, 0.9); rig.head.add(brim); } }
// ---------------------------------------------------------------- holiday decor (built inside the store-decor World; region 'dx' = exterior)
const LEAF = [0xc2410c, 0xea580c, 0xb45309, 0xca8a04, 0x991b1b], BAUB = [0xdc2626, 0xfacc15, 0x2563eb, 0xe5e7eb, 0x16a34a];
function pumpkin(w, x, y, z, s = 1, col = 0xf97316) { for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; w.add('g', sph(), col, x + Math.cos(a) * 0.09 * s, y + 0.2 * s, z + Math.sin(a) * 0.09 * s, 0, -a, 0, 0.14 * s, 0.19 * s, 0.2 * s); } w.add('m', cyl(8), 0x4d7c0f, x, y + 0.36 * s, z, 0.2, 0, 0.1, 0.03 * s, 0.12 * s, 0.03 * s); }
function hay(w, x, z, ry = 0) { const T = w.tf(x, 0, z, ry); T.slab('m', 0xe2b85a, 0, 0, 0, 1.1, 0.5, 0.6, 0.06); for (let i = 0; i < 3; i++) T.box('m', 0x9a6a2a, -0.3 + i * 0.3, 0.25, 0, 0.02, 0.52, 0.62, 0.005); }
function cornStalk(w, x, z, h = 1.8) { for (let i = 0; i < 4; i++) { const a = i * 1.6; w.add('m', cyl(6), 0xc8a24a, x + Math.cos(a) * 0.08, 0, z + Math.sin(a) * 0.08, Math.sin(a) * 0.08, 0, Math.cos(a) * 0.08, 0.025, h, 0.025); for (let k = 0; k < 3; k++) w.add('m', blobGeo((i * 3 + k) & 31, 0.4, 1), 0xd4a84a, x + Math.cos(a + k) * 0.25, h * (0.35 + k * 0.2), z + Math.sin(a + k) * 0.25, 0, a + k, 0.6, 0.3, 0.04, 0.08); } w.add('m', capsule(), 0xf59e0b, x + 0.1, h * 0.55, z + 0.05, 0.3, 0, 0, 0.07, 0.2, 0.07); }
function wreath(w, x, y, z, ry, theme) { const T = w.tf(x, y, z, ry); const n = 16; for (let i = 0; i < n; i++) { const a = i / n * PI * 2; T.add('g', blobGeo(i & 31, 0.3, 1), theme === 'winter' ? pick([0x166534, 0x15803d, 0x14532d]) : pick(LEAF), Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0, 0, 0, a, 0.2, 0.14, 0.08); }
  if (theme === 'winter') { for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + 0.3; T.add('g', sph(), pick(BAUB), Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0.08, 0, 0, 0, 0.06); } T.add('g', rbox(0.3, 0.16, 0.06, 0.03), 0xdc2626, 0, -0.48, 0.08); [-1, 1].forEach((s) => T.add('g', rbox(0.06, 0.28, 0.04, 0.02), 0xdc2626, s * 0.08, -0.65, 0.07, 0, 0, s * 0.3)); }
  else { for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; T.add('m', capsule(), pick([0xf59e0b, 0xb45309, 0x7c2d12]), Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0.08, 0, 0, a, 0.06, 0.14, 0.06); } T.add('g', rbox(0.34, 0.16, 0.06, 0.03), 0xb45309, 0, -0.48, 0.08); } }
function garland(w, axis, at, from, to, y, theme, side) { const L = to - from, n = Math.max(2, Math.round(L / 3)); for (let s = 0; s < n; s++) { const a0 = from + s * L / n, a1 = from + (s + 1) * L / n, k = 9;
  for (let i = 0; i <= k; i++) { const t = i / k, p = a0 + (a1 - a0) * t, yy = y - Math.sin(t * PI) * 0.45, x = axis === 'x' ? p : at + side * 0.18, z = axis === 'x' ? at + side * 0.18 : p; w.add('g', blobGeo((s * 7 + i) & 31, 0.3, 1), theme === 'winter' ? pick([0x166534, 0x15803d]) : pick(LEAF), x, yy, z, 0, R() * 6, 0, 0.17, 0.12, 0.12);
    if (i % 3 === 1) w.add('l', sph(), theme === 'winter' ? pick([0xfde047, 0xef4444, 0x60a5fa, 0xffffff]) : pick([0xfde68a, 0xfb923c]), x, yy - 0.12, z + (axis === 'x' ? side * 0.08 : 0), 0, 0, 0, 0.045, 0.045, 0.045, 0.7); }
  const bx = axis === 'x' ? a1 : at + side * 0.2, bz = axis === 'x' ? at + side * 0.2 : a1; if (s < n - 1) w.add('g', rbox(0.26, 0.16, 0.06, 0.03), theme === 'winter' ? 0xdc2626 : 0xb45309, bx, y + 0.02, bz, 0, axis === 'x' ? 0 : PI / 2, 0); } }
function giftStack(w, x, z) { [[0, 0, 0.6], [0.45, 0.1, 0.45], [-0.35, -0.2, 0.4], [0.1, 0.05, 0.35]].forEach(([dx, dz, s], i) => { const y = i === 3 ? 0.6 : 0, c = pick(BAUB); w.add('g', rbox(s, s, s, 0.03), c, x + dx, y + s / 2, z + dz, 0, R(), 0); w.add('g', rbox(s + 0.01, s + 0.01, 0.06, 0.01), 0xfde047, x + dx, y + s / 2, z + dz, 0, 0, 0); w.add('g', rbox(0.06, s + 0.01, s + 0.01, 0.01), 0xfde047, x + dx, y + s / 2, z + dz); }); }
function xmasTree(w, x, z, s = 1) { w.add('m', cyl(10), 0x7c4a1e, x, 0, z, 0, 0, 0, 0.12 * s, 0.4 * s, 0.12 * s); for (let i = 0; i < 4; i++) w.add('g', cone(16), 0x166534, x, (0.35 + i * 0.45) * s, z, 0, 0, 0, (0.9 - i * 0.19) * s, 0.75 * s, (0.9 - i * 0.19) * s);
  for (let i = 0; i < 18; i++) { const t = R(), a = R() * PI * 2, r = (0.85 - t * 0.7) * s; w.add(i % 3 ? 'g' : 'l', sph(), pick(BAUB), x + Math.cos(a) * r, (0.45 + t * 1.6) * s, z + Math.sin(a) * r, 0, 0, 0, 0.07 * s, 0.07 * s, 0.07 * s, 0.4); } w.add('l', star(), 0xfde047, x, 2.25 * s, z, 0, 0, 0, 0.25 * s, 0.25 * s, 0.1 * s, 0.6); w.solid(x - 0.8 * s, 0, z - 0.8 * s, x + 0.8 * s, 2.3 * s, z + 0.8 * s); }
export function buildHoliday(w, d, G, theme) { if (!OWN || !theme || theme === 'off') return; const { x0, x1, z0, z1 } = d, cx = G.cx, H = 6.2, W = x1 - x0, win = theme === 'winter';
  // ---- outside: wreath over the doors, garland under the canopy, seasonal displays by the planters
  w.region = 'dx'; wreath(w, cx, 3.25, z1 + 0.32, 0, theme); if (!d.strip) { garland(w, 'x', z1 + 3.0, cx - 4.2, cx + 4.2, 3.7, theme, 1); [-1, 1].forEach((s) => { const x = cx + s * 10.2, z = z1 + 2.2; if (win) { giftStack(w, x, z); xmasTree(w, x + s * 1.6, z + 0.2, 0.8); } else { hay(w, x, z, 0); pumpkin(w, x - 0.3, 0.5, z, 1.1); pumpkin(w, x + 0.3, 0.5, z + 0.05, 0.8, 0xfbbf24); pumpkin(w, x + 0.75, 0, z + 0.6, 1.3); pumpkin(w, x - 0.8, 0, z + 0.5, 0.9, 0xfef3c7); cornStalk(w, x + s * 1.1, z - 0.1); } }); }
  // ---- inside: garlands along the front and side walls, wreaths, ceiling lights, an entrance display
  w.region = 'di'; garland(w, 'x', z1, x0 + 1, x1 - 1, 5.1, theme, -1); garland(w, 'x', G.back, x0 + 1, x1 - 1, 5.0, theme, 1); garland(w, 'z', x0, G.back + 1, z1 - 1, 5.1, theme, 1); garland(w, 'z', x1, G.back + 1, z1 - 1, 5.1, theme, -1);
  for (let z = G.back + 6; z < z1 - 3; z += 10) { wreath(w, x0 + 0.25, 3.9, z, PI / 2, theme); wreath(w, x1 - 0.25, 3.9, z, -PI / 2, theme); }
  for (let zz = G.back + 4; zz < z1 - 2; zz += 7) for (let x = x0 + 2; x < x1 - 1.5; x += 1.6) w.add('l', sph(), win ? pick([0xfde047, 0xef4444, 0x60a5fa, 0x4ade80, 0xffffff]) : pick([0xfde68a, 0xfb923c, 0xfacc15]), x, 5.75 - Math.sin((x - x0) * 0.6) * 0.12, zz, 0, 0, 0, 0.06, 0.06, 0.06, 0.8);
  for (let zz = G.back + 4; zz < z1 - 2; zz += 7) w.add('m', rbox(W - 3, 0.012, 0.012, 0.004, 1), 0x1f2937, cx + 0.25, 5.8, zz);
  if (win) for (let i = 0; i < 10; i++) { const x = x0 + 3 + R() * (W - 6), z = G.back + 3 + R() * (z1 - G.back - 8); w.add('m', cyl(4), 0x94a3b8, x, 4.7, z, 0, 0, 0, 0.006, 1.4, 0.006); w.add('l', star(), 0xffffff, x, 4.6, z, 0, R() * 3, 0, 0.18, 0.18, 0.04, 0.4); }
  else for (let i = 0; i < 10; i++) { const x = x0 + 3 + R() * (W - 6), z = G.back + 3 + R() * (z1 - G.back - 8); w.add('m', cyl(4), 0x94a3b8, x, 4.7, z, 0, 0, 0, 0.006, 1.4, 0.006); pumpkin(w, x, 4.25, z, 0.8, pick([0xf97316, 0xfbbf24, 0xea580c])); }
  // entrance display (right of the doors, clear of the walkway, Pi-rat's spot and the checkouts)
  { const x = cx + 3.9, z = z1 - 2.3; if (win) { xmasTree(w, x + 0.3, z - 0.2, 1.0); giftStack(w, x - 0.7, z + 0.6); } else { w.add('m', rcyl(0.95, 0.35, 0.05, 28), 0x7c4a1e, x, 0, z); hay(w, x, z - 0.2, 0.2); pumpkin(w, x - 0.3, 0.5, z - 0.2, 1.2); pumpkin(w, x + 0.35, 0.5, z - 0.25, 0.9, 0xfbbf24); pumpkin(w, x + 0.6, 0.35, z + 0.5, 1.0); pumpkin(w, x - 0.6, 0.35, z + 0.55, 0.8, 0xfef3c7); cornStalk(w, x + 1.0, z - 0.5, 1.6); cornStalk(w, x - 1.0, z - 0.5, 1.5); w.solid(x - 1, 0, z - 0.9, x + 1, 1.2, z + 0.9); }
    poster(w, 'x', z1, cx + 7.6, 2.4, 2.4, 1.0, win ? 0xdc2626 : 0xb45309, -1, win ? 'HAPPY HOLIDAYS!' : 'HAPPY HARVEST!', 0xffffff);
    txt(w, 'from Luna, Pi-rat, Snowie, Candy & Torty', cx + 7.6, 1.75, z1 - 0.22, PI, 0.11, win ? 0x166534 : 0x7c2d12); }
  w.region = 'dx'; }
