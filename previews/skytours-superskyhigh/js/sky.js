// Grok Snowie Sky Tours - SUPER SKY HIGH EXPANSION (DLC #47, MEGA, unlock key grokDLC.skytours.super_sky_high_expansion).
// Three new floating sky areas way above the valley, each one changes how your aircraft flies:
//   ❄️ Frostbite Isle  - snowfall, sideways gusts and ICE that builds up on your wings (slower + heavier) until you thaw out
//   🌋 Ember Isle      - a live volcano: thermal updrafts lift you, ash turbulence shakes you, lava bombs pop out of the crater
//   ⚔️ Fly High Arena  - a floating stadium where you battle high-tech planes and copters (bots) with foam-bubble blasters
// plus the Sky Highway (boost rings that carry you up there), 6 Sky Gems and new badges. Ceiling raised from 175 m to 320 m.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { E } from './engine.js?v=st8';
import { PADS, Hf, WATER_Y } from './map.js?v=st8';
import { S, persist } from './save.js?v=st8';
import { sfx } from './audio.js?v=st8';
import { talk, toast } from './uikit.js?v=st8';
import { textGeo } from './text3d.js?v=st8';
import { PLANE, buildPlane } from './planes.js?v=st8';
import { held } from './input.js?v=st8';
const PI = Math.PI, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
export const DLC_KEY = 'grokDLC.skytours.super_sky_high_expansion';
export function skyOwned() { try { if (/\/(previews|archive)\//.test(location.pathname) || /[?&]dlc=1/.test(location.search)) return true; if (localStorage.getItem(DLC_KEY)) return true; const L = JSON.parse(localStorage.getItem('grokDLC.owned') || '[]'); return Array.isArray(L) && L.some((k) => k === DLC_KEY || k === 'skytours.super_sky_high_expansion'); } catch (e) { return false; } }
// ---- layout ----
export const FROST = { id: 'frost', name: '❄️ Frostbite Isle', x: -280, z: 235, y: 205, r: 46, zone: 150 };
export const EMBER = { id: 'ember', name: '🌋 Ember Isle', x: 300, z: -290, y: 195, r: 46, zone: 150, crater: { x: 300, z: -290, y: 245, r: 13 } };
export const ARENA = { id: 'arena', name: '⚔️ Fly High Arena', x: -40, z: -330, y: 250, r: 115, floor: 200, top: 305, lobby: { x: -40, z: -200, y: 238, r: 18 } };
const ISLES = [FROST, EMBER, { x: ARENA.lobby.x, z: ARENA.lobby.z, y: ARENA.lobby.y, r: ARENA.lobby.r, lobby: true }];
const CEIL0 = 175, CEIL1 = 320;
const HIGHWAY = [[0, 40, -20], [-30, 80, 40], [-90, 120, 110], [-170, 160, 170], [-230, 195, 210], // heliport → Frostbite
  [-150, 230, 60], [-90, 245, -80], [-50, 245, -170], // Frostbite → Arena lobby
  [60, 235, -230], [170, 220, -270], [250, 210, -285]]; // Arena → Ember
const GEMS = [{ id: 'g_frost1', x: -305, y: 228, z: 205 }, { id: 'g_frost2', x: -250, y: 262, z: 270 }, { id: 'g_ember1', x: 300, y: 270, z: -290 }, { id: 'g_ember2', x: 340, y: 210, z: -250 }, { id: 'g_arena', x: -40, y: 300, z: -330 }, { id: 'g_high', x: -90, y: 312, z: 110 }];
export const BOT_TYPES = [
  { id: 'pirat', name: 'Pi-rat\'s Sky Corsair', plane: 'rescue', paint: 4, kind: 'heli' },
  { id: 'grumble', name: 'Grumble Jet', plane: 'jet', paint: 3, kind: 'wing' },
  { id: 'robo', name: 'Robo-Copter MK2', plane: 'twin', paint: 5, kind: 'heli' },
  { id: 'luna', name: 'Luna\'s Night Wing', plane: 'biplane', paint: 1, kind: 'wing' },
];
const LEVELS = { easy: { n: 'Easy', spd: 0.7, cd: 2.6, aim: 0.18, hp: 2, pay: 40 }, normal: { n: 'Normal', spd: 0.9, cd: 1.8, aim: 0.26, hp: 3, pay: 70 }, ace: { n: 'Ace', spd: 1.1, cd: 1.15, aim: 0.36, hp: 4, pay: 120 } };
// ---- geometry helpers (vertex-coloured, merged per area = few draw calls) ----
function col(g, c, k = 1) { g = g.index ? g.toNonIndexed() : g; const C = new THREE.Color(c); const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = C.r * k; a[i * 3 + 1] = C.g * k; a[i * 3 + 2] = C.b * k; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); for (const key of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(key)) g.deleteAttribute(key); return g; }
function put(L, g, c, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, k = 1) { g.scale(sx, sy, sz); g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz); g.translate(x, y, z); L.push(col(g, c, k)); }
function rnd(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
// a floating island: grassy/snowy/ashy top disc + jagged rock cone underneath
function islandGeo(L, I, top, rock, seed) { const R = rnd(seed);
  const t = new THREE.CylinderGeometry(I.r, I.r * 0.92, 4, 40, 1); put(L, t, top, I.x, I.y - 2, I.z);
  const u = new THREE.ConeGeometry(I.r * 0.92, I.r * 1.4, 28, 4); const p = u.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > I.r * 0.69) continue; const f = 1 + (R() - 0.5) * 0.25; p.setX(i, p.getX(i) * f); p.setZ(i, p.getZ(i) * f); } u.computeVertexNormals(); put(L, u, rock, I.x, I.y - 4 - I.r * 0.7, I.z, PI);
  for (let i = 0; i < 9; i++) { const a = R() * PI * 2, d = I.r * (0.5 + R() * 0.4), h = 6 + R() * 12; put(L, new THREE.ConeGeometry(2 + R() * 3, h, 7), rock, I.x + Math.cos(a) * d, I.y - 4 - h / 2 - R() * 10, I.z + Math.sin(a) * d, PI); } }
function padGeo(L, x, y, z, c) { put(L, new THREE.CylinderGeometry(6, 6.3, 0.5, 32), 0xe5e7eb, x, y - 0.25, z); put(L, new THREE.CylinderGeometry(5.2, 5.2, 0.06, 32), c, x, y + 0.02, z); put(L, new THREE.BoxGeometry(0.7, 0.07, 4.2), 0xffffff, x - 1.3, y + 0.06, z); put(L, new THREE.BoxGeometry(0.7, 0.07, 4.2), 0xffffff, x + 1.3, y + 0.06, z); put(L, new THREE.BoxGeometry(2.0, 0.07, 0.7), 0xffffff, x, y + 0.06, z); }
function tree(L, x, y, z, s, snow) { put(L, new THREE.CylinderGeometry(0.3 * s, 0.4 * s, 2 * s, 6), 0x6b4423, x, y + s, z); for (let i = 0; i < 3; i++) { put(L, new THREE.ConeGeometry((2.2 - i * 0.55) * s, 2.4 * s, 8), 0x166534, x, y + (2.4 + i * 1.3) * s, z); if (snow) put(L, new THREE.ConeGeometry((1.3 - i * 0.33) * s, 1.0 * s, 8), 0xffffff, x, y + (3.1 + i * 1.3) * s, z); } }
const PLAT_MAT = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.02 });
const GLOW_MAT = () => new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
function meshOf(L, mat, shadow = true) { const m = new THREE.Mesh(mergeGeometries(L, false), mat); m.castShadow = shadow; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); return m; }
function sign(txt, h, c) { const g = textGeo(txt, h, h * 0.25); return g ? col(g, c, 1.6) : null; }

export function installSky(Game) { Object.assign(Game.prototype, SKY);
  // groundAt: island tops and pads are solid ground (only when you are above them, so you can fly under an island)
  const g0 = Game.prototype.groundAt; Game.prototype.groundAt = function (x, z, y) { const r = g0.call(this, x, z, y); if (!this.sky || !this.sky.on) return r; const top = skyTop(x, z, y); if (top != null && top > r.y) return { y: top, water: false }; return r; };
  const a0 = Game.prototype.areaName; Game.prototype.areaName = function () { const s = this.sky; if (s && s.on) { if (s.bt) return '⚔️ Fly High Arena · ' + LEVELS[s.bt.lv].n; const c = this.mode === 'walk' ? this.me : this.cop, A = skyArea(c.x, c.y, c.z); if (A) return A.name; } return a0.call(this); };
  const t0 = Game.prototype.target; Game.prototype.target = function () { const s = this.sky; if (s && s.bt) { const c = this.cop, e = s.bt.bots.filter((b) => b.hp > 0 && b.team !== 0).sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z))[0]; if (e) return { x: e.x, y: e.y, z: e.z, n: e.name }; } return t0.call(this); };
}
// highest island/pad surface under (x, z) that is at or below y + a little
function skyTop(x, z, y) { let best = null; for (const I of ISLES) { const d = Math.hypot(x - I.x, z - I.z); if (d < I.r - 0.5 && y >= I.y - 3) best = best == null ? I.y : Math.max(best, I.y); } return best; }
function skyArea(x, y, z) { if (y < 120) return null; if (Math.hypot(x - ARENA.x, z - ARENA.z) < ARENA.r + 25 && y > ARENA.floor - 25) return ARENA; if (Math.hypot(x - ARENA.lobby.x, z - ARENA.lobby.z) < 40) return { name: '⚔️ Arena Lobby' }; for (const I of [FROST, EMBER]) if (Math.hypot(x - I.x, z - I.z) < I.zone) return I; if (y > 180) return { name: '☁️ Super Sky High' }; return null; }

const SKY = {
  skyCeil() { return this.sky && this.sky.on ? CEIL1 : CEIL0; },
  buildSky() { const on = skyOwned(); const s = this.sky = { on, ice: 0, gust: 0, gx: 0, gz: 0, bombs: [], shots: [], bt: null, gemM: {}, hw: [], hwT: 0, warn: 0, fx: 0, near: null }; if (!on) return;
    const scene = this.scene, P = PLAT_MAT(), G = GLOW_MAT(); const L = [], LG = [];
    // ---------- Frostbite Isle ----------
    { const I = FROST, R = rnd(7); islandGeo(L, I, 0xf8fafc, 0x64748b, 11);
      for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2 + 0.3, d = I.r - 6; const h = 14 + R() * 16; put(L, new THREE.ConeGeometry(4 + R() * 2, h, 6), 0xbfe9ff, I.x + Math.cos(a) * d, I.y + h / 2, I.z + Math.sin(a) * d, 0, R() * 3); put(L, new THREE.ConeGeometry(2, h * 0.35, 6), 0xffffff, I.x + Math.cos(a) * d, I.y + h - h * 0.17, I.z + Math.sin(a) * d); }
      put(L, new THREE.CylinderGeometry(13, 13, 0.3, 32), 0x93c5fd, I.x + 18, I.y + 0.05, I.z - 14); // frozen pond
      // Cocoa Lodge (thaws your wings)
      const lx = I.x - 20, lz = I.z + 10; put(L, new THREE.BoxGeometry(12, 6, 9), 0x8b5a2b, lx, I.y + 3, lz); put(L, new THREE.ConeGeometry(9, 5, 4), 0xffffff, lx, I.y + 8.5, lz, 0, PI / 4, 0, 1, 1, 0.8); put(L, new THREE.BoxGeometry(2.4, 3.6, 0.3), 0x3f2a14, lx, I.y + 1.8, lz - 4.6); put(L, new THREE.BoxGeometry(1.2, 4, 1.2), 0x7c2d12, lx + 4, I.y + 9, lz + 2); LG.push(col(new THREE.BoxGeometry(2, 1.6, 0.2).translate(lx - 3.5, I.y + 3.5, lz - 4.6), 0xffb347, 1.5), col(new THREE.BoxGeometry(2, 1.6, 0.2).translate(lx + 3.5, I.y + 3.5, lz - 4.6), 0xffb347, 1.5));
      const sg = sign('COCOA LODGE', 1.0, 0xffe4b5); if (sg) { sg.translate(lx, I.y + 7.2, lz - 4.9); sg.rotateY && 0; LG.push(sg); }
      for (let i = 0; i < 14; i++) { const a = R() * PI * 2, d = 10 + R() * (I.r - 16); const x = I.x + Math.cos(a) * d, z = I.z + Math.sin(a) * d; if (Math.hypot(x - I.x, z - I.z) < 9 || Math.hypot(x - lx, z - lz) < 9) continue; tree(L, x, I.y, z, 0.9 + R() * 0.6, true); }
      // snow-rat snowman
      { const x = I.x + 6, z = I.z + 14; put(L, new THREE.SphereGeometry(2, 14, 10), 0xffffff, x, I.y + 2, z); put(L, new THREE.SphereGeometry(1.4, 14, 10), 0xffffff, x, I.y + 4.8, z); put(L, new THREE.SphereGeometry(0.5, 8, 6), 0xffffff, x - 0.9, I.y + 6.1, z); put(L, new THREE.SphereGeometry(0.5, 8, 6), 0xffffff, x + 0.9, I.y + 6.1, z); put(L, new THREE.ConeGeometry(0.25, 1.2, 8), 0xf97316, x, I.y + 4.8, z - 1.6, -PI / 2); }
      padGeo(L, I.x, I.y, I.z, 0x38bdf8); s.lodge = { x: lx, z: lz };
      PADS.push({ id: 'sky_frost', x: I.x, z: I.z, y: I.y + 0.05, col: 0x38bdf8, name: 'Frostbite Isle Pad', town: 'frost', sky: true }); }
    // ---------- Ember Isle (volcano) ----------
    { const I = EMBER, R = rnd(3), C = I.crater; islandGeo(L, I, 0x44403c, 0x292524, 23);
      const v = new THREE.CylinderGeometry(C.r + 2, 34, C.y - I.y, 28, 3, true); const p = v.attributes.position; for (let i = 0; i < p.count; i++) { const f = 1 + (R() - 0.5) * 0.12; p.setX(i, p.getX(i) * f); p.setZ(i, p.getZ(i) * f); } v.computeVertexNormals(); put(L, v, 0x57534e, C.x, I.y + (C.y - I.y) / 2, C.z);
      put(L, new THREE.TorusGeometry(C.r + 1.5, 1.6, 8, 28), 0x3f3f46, C.x, C.y, C.z, PI / 2);
      LG.push(col(new THREE.CylinderGeometry(C.r + 0.5, C.r + 0.5, 0.5, 28).translate(C.x, C.y - 3, C.z), 0xff5a1f, 2.2));
      for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2 + 0.5, run = 34 - C.r - 2, hh = C.y - I.y, ang = Math.atan2(hh, run), len = Math.hypot(hh, run) * 0.92; const g = new THREE.BoxGeometry(2.4 - 0.0, 0.35, len); g.translate(0, 0.9, len / 2); g.rotateX(ang); g.rotateY(a); g.translate(C.x + Math.sin(a) * (C.r + 2), C.y, C.z + Math.cos(a) * (C.r + 2)); LG.push(col(g, 0xff7a1a, 1.8)); } // lava rivers
      for (let i = 0; i < 18; i++) { const a = R() * PI * 2, d = 36 + R() * 8; put(L, new THREE.DodecahedronGeometry(1 + R() * 2, 0), 0x1c1917, I.x + Math.cos(a) * d, I.y + 0.6, I.z + Math.sin(a) * d, R(), R(), R()); }
      const px = I.x - 30, pz = I.z + 24; padGeo(L, px, I.y, pz, 0xf97316); // Heat-Proof pad on the rim
      { put(L, new THREE.BoxGeometry(7, 4.5, 6), 0x78716c, px + 12, I.y + 2.25, pz + 8); put(L, new THREE.CylinderGeometry(3.2, 3.2, 0.6, 16), 0xef4444, px + 12, I.y + 4.8, pz + 8); const sg = sign('LAVA LAB', 0.8, 0xfff1d6); if (sg) LG.push(sg.translate(px + 12, I.y + 5.6, pz + 4.8)); }
      PADS.push({ id: 'sky_ember', x: px, z: pz, y: I.y + 0.05, col: 0xf97316, name: 'Ember Isle Heat-Proof Pad', town: 'ember', sky: true });
      ISLES.push({ x: px, z: pz, y: I.y, r: 0 }); s.emberPad = { x: px, z: pz }; }
    // ---------- Fly High Arena ----------
    { const A = ARENA, R = rnd(5), lb = A.lobby; // lobby platform + gate
      put(L, new THREE.CylinderGeometry(lb.r, lb.r * 0.8, 3, 32), 0xe2e8f0, lb.x, lb.y - 1.5, lb.z); put(L, new THREE.ConeGeometry(lb.r * 0.8, 22, 24), 0x94a3b8, lb.x, lb.y - 14, lb.z, PI); padGeo(L, lb.x, lb.y, lb.z, 0xff4fa0);
      PADS.push({ id: 'sky_arena', x: lb.x, z: lb.z, y: lb.y + 0.05, col: 0xff4fa0, name: 'Fly High Arena Lobby', town: 'arena', sky: true });
      for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2 + PI / 16; const x = A.x + Math.cos(a) * A.r, z = A.z + Math.sin(a) * A.r; put(L, new THREE.CylinderGeometry(1.4, 1.4, A.top - A.floor, 10), 0xcbd5e1, x, (A.top + A.floor) / 2, z); LG.push(col(new THREE.SphereGeometry(2.4, 12, 8).translate(x, A.top + 1, z), i % 2 ? 0xff4fa0 : 0x3ff0ff, 1.8), col(new THREE.SphereGeometry(1.8, 12, 8).translate(x, A.floor - 1, z), i % 2 ? 0x3ff0ff : 0xff4fa0, 1.6)); }
      LG.push(col(new THREE.TorusGeometry(A.r, 0.7, 8, 96).rotateX(PI / 2).translate(A.x, A.top, A.z), 0x3ff0ff, 1.5), col(new THREE.TorusGeometry(A.r, 0.7, 8, 96).rotateX(PI / 2).translate(A.x, A.floor, A.z), 0xff4fa0, 1.5));
      // floating cover blocks to dodge behind
      s.cover = []; for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2 + 0.4, d = 30 + R() * 50, x = A.x + Math.cos(a) * d, z = A.z + Math.sin(a) * d, y = 225 + R() * 50, w = 9 + R() * 6; put(L, new THREE.BoxGeometry(w, w * 0.6, w), i % 2 ? 0xa78bfa : 0x60a5fa, x, y, z); s.cover.push({ x, y, z, h: w / 2 + 1.2 }); }
      const sg = sign('FLY HIGH ARENA', 2.6, 0xff4fa0); if (sg) { const g = sg.clone(); g.translate(lb.x, lb.y + 16, lb.z - 6); LG.push(g); }
      // the gate arch you fly through
      LG.push(col(new THREE.TorusGeometry(10, 0.8, 10, 40, PI).translate(lb.x, lb.y + 2, lb.z - lb.r + 2), 0xffd23f, 1.6));
      // the energy net under the arena (soft bounce, nobody falls)
      const net = new THREE.Mesh(new THREE.CircleGeometry(A.r, 48).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: 0x3ff0ff, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); net.position.set(A.x, A.floor, A.z); net.renderOrder = 2; scene.add(net); s.net = net; }
    // ---------- Sky Highway boost rings ----------
    { const tg = new THREE.TorusGeometry(7, 0.55, 10, 40); for (let i = 0; i < HIGHWAY.length; i++) { const [x, y, z] = HIGHWAY[i], n = HIGHWAY[Math.min(HIGHWAY.length - 1, i + 1)], pv = HIGHWAY[Math.max(0, i - 1)]; const yaw = Math.atan2(n[0] - pv[0], n[2] - pv[2]); const g = tg.clone().rotateY(yaw).translate(x, y, z); LG.push(col(g, i % 2 ? 0x3ff0ff : 0xa78bfa, 1.7)); s.hw.push({ x, y, z, dx: Math.sin(yaw), dz: Math.cos(yaw) }); } }
    s.mesh = meshOf(L, P); scene.add(s.mesh); s.glow = meshOf(LG, G, false); scene.add(s.glow);
    // ---------- Sky Gems ----------
    { const gg = new THREE.OctahedronGeometry(1.6, 0); for (const q of GEMS) { const m = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 1.4, roughness: 0.2, metalness: 0.3 })); m.position.set(q.x, q.y, q.z); m.visible = !(S.gems || []).includes(q.id); scene.add(m); s.gemM[q.id] = m; } }
    // ---------- weather particles: snow + ash (Points around the camera) ----------
    { const N = 700, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 80; pos[i * 3 + 1] = (Math.random() - 0.5) * 50; pos[i * 3 + 2] = (Math.random() - 0.5) * 80; } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); s.wx = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.9, depthWrite: false })); s.wx.frustumCulled = false; s.wx.visible = false; scene.add(s.wx); }
    // lava bomb + foam shot pools
    { const bg = new THREE.IcosahedronGeometry(1.3, 1), bm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff6a1a).multiplyScalar(2), toneMapped: false }); for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(bg, bm); m.visible = false; scene.add(m); s.bombs.push({ m, life: 0 }); } s.bombT = 1;
      const sgm = new THREE.SphereGeometry(0.7, 12, 8); s.shotMat = [new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3ff0ff).multiplyScalar(2), toneMapped: false }), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff4fa0).multiplyScalar(2), toneMapped: false })]; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(sgm, s.shotMat[0]); m.visible = false; scene.add(m); s.shots.push({ m, life: 0 }); } }
    if (!S.sky) { S.sky = { wins: {}, best: 0, ko: 0 }; persist(); }
  },
  // ------------------------------------------------------------------ per frame
  skyUpdate(dt, busy) { const s = this.sky; if (!s) return; if (!s.on) { const c = this.cop; if (this.mode === 'fly' && c.mode === 'fly' && c.y > CEIL0 - 3 && (!s.lockT || this.T - s.lockT > 20)) { s.lockT = this.T; toast('🔒 Higher up is the SUPER SKY HIGH EXPANSION: Frostbite Isle, Ember Isle and the Fly High Arena. Unlock it at the Grok Arcade DLC Shop (175 🎟️).'); } return; } const c = this.cop, fly = this.mode === 'fly' && c.mode === 'fly', T = this.T;
    // gems spin
    for (const id in s.gemM) { const m = s.gemM[id]; if (!m.visible) continue; m.rotation.y = T * 2; m.position.y = GEMS.find((q) => q.id === id).y + Math.sin(T * 2 + m.position.x) * 0.5; if (fly && Math.hypot(c.x - m.position.x, c.y - m.position.y, c.z - m.position.z) < 6) this.skyGem(id); }
    const fr = fly ? Math.hypot(c.x - FROST.x, c.z - FROST.z) : 1e9, er = fly ? Math.hypot(c.x - EMBER.x, c.z - EMBER.z) : 1e9;
    const inFrost = fr < FROST.zone && c.y > 140, inEmber = er < EMBER.zone && c.y > 140;
    // ---- Frostbite: gusts + icing ----
    s.gust -= dt; if (s.gust <= 0) { s.gust = 2 + Math.random() * 3; const a = Math.random() * PI * 2, k = 4 + Math.random() * 6; s.tgx = Math.cos(a) * k; s.tgz = Math.sin(a) * k; }
    if (inFrost) { const shelter = fr < FROST.r + 4 && c.y < FROST.y + 18 ? 0.15 : 1; s.gx += ((s.tgx || 0) - s.gx) * Math.min(1, dt * 1.5); s.gz += ((s.tgz || 0) - s.gz) * Math.min(1, dt * 1.5); c.x += s.gx * shelter * dt; c.z += s.gz * shelter * dt; s.ice = Math.min(100, s.ice + dt * 2.6); if (s.ice > 0 && !S.badges.snowbird && fr < FROST.r) this.skyBadge('snowbird', '❄️ Snowbird', 'You flew over Frostbite Isle!'); }
    else { s.gx *= Math.exp(-dt * 2); s.gz *= Math.exp(-dt * 2); s.ice = Math.max(0, s.ice - dt * (inEmber ? 25 : c.y < 120 ? 8 : 3)); }
    if (this.mode === 'fly' && c.mode === 'ground' && c.onPad && c.onPad.id === 'sky_frost') s.ice = Math.max(0, s.ice - dt * 30); // the lodge's cocoa steam thaws you on the pad
    if (fly && s.ice > 0) { const PLi = PLANE(c.id); if (PLi.kind === 'wing') c.sp = Math.max(PLi.min, (c.sp || PLi.min) * (1 - s.ice / 100 * 0.35 * dt * 2.2)); c.vx *= 1 - s.ice / 100 * 0.35 * dt * 2.2; c.vz *= 1 - s.ice / 100 * 0.35 * dt * 2.2; if (!held('jump')) c.y -= s.ice / 100 * 3 * dt; if (s.ice > 60 && (!s.iceT || T - s.iceT > 9)) { s.iceT = T; toast('🧊 Ice on your wings! You\'re slower and heavier. Land on the Frostbite pad (cocoa steam) or fly somewhere warm to thaw.'); } }
    // ---- Ember: thermals, turbulence, lava bombs ----
    const C = EMBER.crater, cr = fly ? Math.hypot(c.x - C.x, c.z - C.z) : 1e9;
    if (fly && cr < 28 && c.y > C.y - 10) { c.vy = Math.max(c.vy, 9 * (1 - cr / 28) + 3); if (!S.badges.lavaproof && c.y > C.y + 15) this.skyBadge('lavaproof', '🌋 Lava-Proof', 'You rode the volcano\'s thermal updraft!'); if (c.y < C.y + 6 && (!s.hotT || T - s.hotT > 3)) { s.hotT = T; toast('🔥 Too hot down there! The thermal pushes you back up.'); } }
    if (inEmber) { const k = (1 - er / EMBER.zone) * 2.2; c.x += Math.sin(T * 7.3) * k * dt; c.z += Math.cos(T * 6.1) * k * dt; c.y += Math.sin(T * 9.7) * k * 0.6 * dt; if (this.cam && E.camera) { E.camera.position.y += Math.sin(T * 31) * 0.05 * k; } }
    s.bombT -= dt; if (er < EMBER.zone + 80 && s.bombT <= 0) { s.bombT = 1.4 + Math.random() * 1.6; const b = s.bombs.find((q) => q.life <= 0); if (b) { const a = Math.random() * PI * 2, sp = 6 + Math.random() * 10; Object.assign(b, { x: C.x, y: C.y, z: C.z, vx: Math.cos(a) * sp, vy: 26 + Math.random() * 14, vz: Math.sin(a) * sp, life: 6 }); b.m.visible = true; if (er < EMBER.zone) sfx('bosshit'); } }
    for (const b of s.bombs) { if (b.life <= 0) continue; b.life -= dt; b.vy -= 12 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.m.position.set(b.x, b.y, b.z); b.m.rotation.x += dt * 3; if (Math.random() < 0.5) this.fx.emit(b.x, b.y, b.z, 0, 0.5, 0, 0.35, 0x57534e, 1.2, -1, 1);
      if (b.y < EMBER.y - 60 || b.life <= 0) { b.life = 0; b.m.visible = false; continue; }
      if (b.y < EMBER.y + 0.5 && Math.hypot(b.x - EMBER.x, b.z - EMBER.z) < EMBER.r) { b.life = 0; b.m.visible = false; this.fx.burst(b.x, EMBER.y + 0.5, b.z, 0xff7a1a, 10, 4); continue; }
      if (fly && !s.bt && Math.hypot(b.x - c.x, b.y - c.y - 1.2, b.z - c.z) < 3.8) { b.life = 0; b.m.visible = false; this.fx.burst(c.x, c.y + 1.5, c.z, 0xff7a1a, 18, 6); sfx('hit'); this.setHp(c.hp - 6); c.vx += b.vx * 0.8; c.vz += b.vz * 0.8; c.vy = 6; toast('🌋 Lava bomb! −6% (it was mostly a hot marshmallow)'); } }
    // ---- weather particles ----
    { const w = s.wx, cp = E.camera.position, snow = (inFrost || (this.mode === 'walk' && Math.hypot(this.me.x - FROST.x, this.me.z - FROST.z) < FROST.r + 5)), ash = inEmber; w.visible = snow || ash; if (w.visible) { w.material.color.set(snow ? 0xffffff : 0x57534e); w.material.size = snow ? 0.35 : 0.22; const p = w.geometry.attributes.position, a = p.array, fall = snow ? 5 : -2.5; for (let i = 0; i < a.length; i += 3) { a[i + 1] -= fall * dt; a[i] += (s.gx * 0.6 + Math.sin(T + i) * 0.4) * dt; a[i + 2] += s.gz * 0.6 * dt; if (a[i + 1] < -25) a[i + 1] += 50; if (a[i + 1] > 25) a[i + 1] -= 50; if (a[i] > 40) a[i] -= 80; if (a[i] < -40) a[i] += 80; if (a[i + 2] > 40) a[i + 2] -= 80; if (a[i + 2] < -40) a[i + 2] += 80; } p.needsUpdate = true; w.position.copy(cp); } }
    // ash makes it hazy near the volcano
    if (this.scene.fog) { const base = s.fog0 == null ? (s.fog0 = this.scene.fog.density) : s.fog0, want = inEmber ? base + 0.004 * (1 - er / EMBER.zone) : inFrost ? base + 0.0015 : base; this.scene.fog.density += (want - this.scene.fog.density) * Math.min(1, dt * 2); }
    // ---- Sky Highway boost rings ----
    if (fly) for (let i = 0; i < s.hw.length; i++) { const r = s.hw[i]; if (Math.hypot(c.x - r.x, c.y - r.y, c.z - r.z) < 7.5 && (s.hwI !== i || T - s.hwT > 2)) { s.hwI = i; s.hwT = T; const n = HIGHWAY[Math.min(HIGHWAY.length - 1, i + 1)], up = (n[1] - r.y) > 5 ? 8 : 2; const PL = PLANE(c.id); if (PL.kind === 'wing') c.sp = Math.min(PL.spd * 1.6, (c.sp || PL.min) + 18); else { c.vx += r.dx * 22; c.vz += r.dz * 22; } c.vy = Math.max(c.vy, up); sfx('glide'); this.fx.ring(r.x, r.y, r.z, i % 2 ? 0x3ff0ff : 0xa78bfa, 7); if (!S.badges.highway && i === HIGHWAY.length - 1) this.skyBadge('highway', '🛣️ Sky Highway Star', 'You rode the Sky Highway all the way to Ember Isle!'); } }
    // ---- island undersides: you can't fly through rock ----
    if (fly) for (const I of ISLES) { if (!I.r) continue; const d = Math.hypot(c.x - I.x, c.z - I.z); const bottom = I.y - 4 - (I.lobby ? 22 : I.r * 1.4) * Math.max(0, 1 - d / I.r); if (d < I.r && c.y < I.y - 3.5 && c.y + 3 > bottom) { const hs = Math.hypot(c.vx, c.vz); if (c.y + 3 - bottom < 3) { c.y = bottom - 3; c.vy = Math.min(c.vy, 0); } else { const k = (I.r - d + 0.5) / Math.max(d, 0.01); c.x += (c.x - I.x) * k; c.z += (c.z - I.z) * k; if (PLANE(c.id).kind === 'wing') c.yaw = Math.atan2(c.x - I.x, c.z - I.z); c.vx *= 0.3; c.vz *= 0.3; } if (hs > 8 && (!s.rockT || T - s.rockT > 1.5)) { s.rockT = T; sfx('hit'); this.setHp(c.hp - 3); toast('🪨 Bonk on the island rock! −3%'); } } }
    // arena cover blocks
    if (fly && s.cover) for (const b of s.cover) { const dx = c.x - b.x, dy = c.y + 1.2 - b.y, dz = c.z - b.z; if (Math.abs(dx) < b.h && Math.abs(dy) < b.h * 0.6 + 0.6 && Math.abs(dz) < b.h) { const ax = b.h - Math.abs(dx), az = b.h - Math.abs(dz); if (ax < az) { c.x += Math.sign(dx) * ax; c.vx = 0; } else { c.z += Math.sign(dz) * az; c.vz = 0; } if (PLANE(c.id).kind === 'wing') c.yaw += 1.2 * dt * 10; } }
    // first time up here: a hello from Snowie
    if (fly && c.y > 185 && !S.talks.skyhigh) { S.talks.skyhigh = 1; persist(); talk([['Snowie', 'WHOA, we\'re SUPER SKY HIGH! Up here the weather is wild: ❄️ Frostbite Isle freezes your wings, 🌋 Ember Isle has a real volcano, and the ⚔️ Fly High Arena is where pilots battle!'], ['Snowie', 'Fly through the purple and cyan Sky Highway rings for a boost, and grab the 6 shiny 💎 Sky Gems!']]); }
    if (s.bt) this.battleUpdate(dt, busy);
  },
  skyAct(best) { const s = this.sky; if (!s || !s.on) return best; const c = this.cop, lb = ARENA.lobby;
    if (s.bt) return this.mode === 'fly' && c.mode === 'fly' ? { label: `🫧 FIRE${s.bt.cool > 0 ? '…' : ''}`, f: () => this.fire() } : best;
    if (this.mode === 'fly' && (c.mode === 'ground' || c.mode === 'fly') && Math.hypot(c.x - lb.x, c.z - lb.z) < 26 && Math.abs(c.y - lb.y) < 22) return { label: '⚔️ Fly High Arena', f: () => this.arenaMenu() };
    if (this.mode === 'fly' && c.mode === 'ground' && c.onPad && c.onPad.id === 'sky_frost' && s.ice > 1) return { label: '☕ Thaw with cocoa steam', f: () => { s.ice = 0; sfx('ding'); this.fx.puff(c.x, c.y + 1, c.z, 16, 0xffffff); toast('☕ Ahh, toasty. Wings de-iced!'); } };
    return best; },
  skyGem(id) { const s = this.sky; S.gems = S.gems || []; if (S.gems.includes(id)) return; S.gems.push(id); persist(); const m = s.gemM[id]; m.visible = false; sfx('check'); this.fx.burst(m.position.x, m.position.y, m.position.z, 0x22d3ee, 20, 5); toast(`💎 Sky Gem! (${S.gems.length}/${GEMS.length})`); setTimeout(() => this.earn(25, 'sky gem'), 500); if (S.gems.length >= GEMS.length) this.skyBadge('gemhunter', '💎 Gem Hunter', 'You found all 6 Sky Gems!'); },
  skyBadge(id, name, why) { if (S.badges[id]) return; S.badges[id] = 1; persist(); setTimeout(() => { sfx('win'); toast(`🏅 Badge: ${name}. ${why}`); }, 700); },
  // ------------------------------------------------------------------ Fly High Arena battles
  arenaMenu() { const app = this.app; app.busy = true; const go = (team) => talk([['Ref Rex', 'How tough should the bots be?']], null, Object.keys(LEVELS).map((k) => ({ t: `${LEVELS[k].n} (+${LEVELS[k].pay} 🪙)${S.sky && S.sky.wins && S.sky.wins[k] ? ' 🏆' : ''}`, f: () => { app.busy = false; this.startBattle(team, k); } })).concat([{ t: 'Back', f: () => { app.busy = false; } }]));
    talk([['Ref Rex', 'Welcome to the FLY HIGH ARENA! Bots fly high-tech planes and copters. Tap 🫧 FIRE to shoot foam bubbles (they lock on to whoever is in front of you). Pop every enemy before the clock runs out!'], ['Ref Rex', 'Nobody gets hurt and your aircraft takes NO damage in here: the arena gives everyone bubble shields. Ready?']], null,
      [{ t: '⚔️ Free-for-all (you vs 3 bots)', f: () => go(false) }, { t: '🤝 Team up with Candy (2 vs 2)', f: () => go(true) }, { t: 'Not now', f: () => { app.busy = false; } }]); },
  startBattle(team, lv) { const s = this.sky, c = this.cop, A = ARENA, Lv = LEVELS[lv]; if (this.race) { this.race = null; this.showRings(); }
    const types = team ? [{ id: 'candy', name: 'Candy (your teammate)', plane: 'classic', paint: 2, kind: 'heli', team: 0 }, Object.assign({ team: 1 }, BOT_TYPES[1]), Object.assign({ team: 1 }, BOT_TYPES[0])] : BOT_TYPES.slice(0, 3).map((b, i) => Object.assign({ team: i + 1 }, b));
    const bots = types.map((B, i) => { const M = buildPlane(B.plane, B.paint, { hp: 100, display: true }); this.scene.add(M.root); const a = (i + 1) / (types.length + 1) * PI * 2 + PI / 2; const b = { ...B, M, x: A.x + Math.cos(a) * 70, y: 245 + i * 6, z: A.z + Math.sin(a) * 70, yaw: 0, sp: 0, hp: B.team === 0 ? 5 : Lv.hp, max: B.team === 0 ? 5 : Lv.hp, cd: 2 + Math.random() * 2, wob: Math.random() * 9, roll: 0 }; b.yaw = Math.atan2(A.x - b.x, A.z - b.z); return b; });
    // you start at the south edge facing in
    c.mode = 'fly'; c.onPad = null; c.x = A.x; c.z = A.z + A.r - 30; c.y = 252; c.vx = c.vz = c.vy = 0; c.yaw = PI; const PL = PLANE(c.id); if (PL.kind === 'wing') c.sp = PL.min + 4; this.cam.snap = true; this.cam.yaw = c.yaw + PI;
    s.bt = { lv, team, bots, me: 5, meMax: 5, t: 150, cool: 0, hitT: 0, score: 0, done: false }; s.ice = 0; sfx('win'); toast(`⚔️ FIGHT! ${team ? 'You + Candy vs 2 bots' : 'Free-for-all vs 3 bots'} · ${Lv.n}`); this.app.hud.battle && this.app.hud.battle(s.bt); },
  fire() { const s = this.sky, B = s && s.bt; if (!B || B.cool > 0) return; const c = this.cop; B.cool = 0.45; const tg = this.aim(c.x, c.y + 1.2, c.z, c.yaw, 0, 0.7, 110); this.shoot(c.x, c.y + 1.2, c.z, c.yaw, tg, 0); sfx('click'); },
  aim(x, y, z, yaw, team, cone, range) { const s = this.sky, B = s.bt, c = this.cop; let best = null, bs = 1e9; const cand = B.bots.filter((b) => b.hp > 0 && b.team !== team).map((b) => ({ x: b.x, y: b.y, z: b.z, ref: b })); if (team !== 0 && B.me > 0) cand.push({ x: c.x, y: c.y + 1, z: c.z, ref: 'me' });
    for (const q of cand) { const dx = q.x - x, dz = q.z - z, d = Math.hypot(dx, q.y - y, dz); if (d > range || d < 1) continue; const off = Math.abs(wrap(Math.atan2(dx, dz) - yaw)); if (off > cone) continue; const sc = d * (1 + off * 2); if (sc < bs) { bs = sc; best = q; } } return best; },
  shoot(x, y, z, yaw, tg, team, inacc = 0) { const s = this.sky, sh = s.shots.find((q) => q.life <= 0); if (!sh) return; const sp = 95; let dx = Math.sin(yaw), dy = 0, dz = Math.cos(yaw); if (tg) { const tx = tg.x - x, ty = tg.y - y, tz = tg.z - z, L = Math.hypot(tx, ty, tz); dx = tx / L; dy = ty / L; dz = tz / L; } if (inacc) { dx += (Math.random() - 0.5) * inacc; dy += (Math.random() - 0.5) * inacc * 0.6; dz += (Math.random() - 0.5) * inacc; const L = Math.hypot(dx, dy, dz); dx /= L; dy /= L; dz /= L; }
    Object.assign(sh, { x: x + dx * 3, y: y + dy * 3, z: z + dz * 3, vx: dx * sp, vy: dy * sp, vz: dz * sp, life: 1.4, team }); sh.m.material = s.shotMat[team === 0 ? 0 : 1]; sh.m.visible = true; },
  battleUpdate(dt, busy) { const s = this.sky, B = s.bt, c = this.cop, A = ARENA, Lv = LEVELS[B.lv], T = this.T; if (busy) return;
    B.t -= dt; B.cool = Math.max(0, B.cool - dt);
    // keep the player inside the arena (soft walls + the bouncy energy net)
    const d = Math.hypot(c.x - A.x, c.z - A.z); if (d > A.r - 4) { const k = (A.r - 4) / d; c.x = A.x + (c.x - A.x) * k; c.z = A.z + (c.z - A.z) * k; c.vx *= -0.3; c.vz *= -0.3; if (PLANE(c.id).kind === 'wing') c.yaw = Math.atan2(A.x - c.x, A.z - c.z); if (!B.wallT || T - B.wallT > 2) { B.wallT = T; toast('🧱 Arena wall! Turn back in.'); } }
    if (c.y < A.floor + 2) { c.y = A.floor + 2; c.vy = 12; this.fx.ring(c.x, A.floor, c.z, 0x3ff0ff, 4); sfx('glide'); } if (c.y > A.top - 3) { c.y = A.top - 3; c.vy = Math.min(c.vy, 0); }
    if (c.mode === 'crash' || c.mode === 'tow' || c.mode === 'ground') return this.endBattle('left');
    // bots
    for (const b of B.bots) { if (b.hp <= 0) continue; b.wob += dt;
      const foes = B.bots.filter((o) => o !== b && o.hp > 0 && o.team !== b.team).map((o) => ({ x: o.x, y: o.y, z: o.z })); if (b.team !== 0 && B.me > 0) foes.push({ x: c.x, y: c.y, z: c.z, me: 1 });
      let tg = foes.sort((p, q) => Math.hypot(p.x - b.x, p.z - b.z) - Math.hypot(q.x - b.x, q.z - b.z))[0];
      const bd = Math.hypot(b.x - A.x, b.z - A.z); let tx, ty, tz; if (bd > A.r - 22 || !tg) { tx = A.x; tz = A.z; ty = 250; } else { const orbit = b.kind === 'heli' ? 26 : 0; const a = Math.atan2(b.x - tg.x, b.z - tg.z) + (b.kind === 'heli' ? 0.9 : 0); tx = tg.x + Math.sin(a) * orbit; tz = tg.z + Math.cos(a) * orbit; ty = tg.y + Math.sin(b.wob) * 6; }
      const want = Math.atan2(tx - b.x, tz - b.z), turn = (b.kind === 'wing' ? 1.4 : 2.2) * Lv.spd; const dyaw = clamp(wrap(want - b.yaw), -turn * dt, turn * dt); b.yaw += dyaw; b.roll += (clamp(dyaw / dt / turn, -1, 1) * 0.5 - b.roll) * Math.min(1, dt * 4);
      const sp = (b.kind === 'wing' ? 34 : 24) * Lv.spd * (b.team === 0 ? 1 : 1); b.x += Math.sin(b.yaw) * sp * dt; b.z += Math.cos(b.yaw) * sp * dt; b.y += clamp(ty - b.y, -10, 10) * dt; b.y = clamp(b.y, A.floor + 6, A.top - 6);
      for (const k of s.cover) { const dx = b.x - k.x, dy = b.y - k.y, dz = b.z - k.z; if (Math.abs(dx) < k.h + 2 && Math.abs(dz) < k.h + 2 && Math.abs(dy) < k.h) b.y += Math.sign(dy || 1) * 12 * dt; }
      b.M.root.position.set(b.x, b.y, b.z); b.M.root.rotation.set(0, b.yaw, 0); b.M.root.rotation.z = b.roll; for (const p of b.M.spin) p.o.rotation[p.ax] += dt * 14 * Math.sign(p.k || 1); for (const q of b.M.discs) { q.material.opacity = 0.16; q.visible = true; }
      b.cd -= dt; if (b.cd <= 0 && tg) { const t2 = this.aim(b.x, b.y, b.z, b.yaw, b.team, 0.5, 85); if (t2) { b.cd = Lv.cd * (0.8 + Math.random() * 0.5) * (b.team === 0 ? 0.9 : 1); this.shoot(b.x, b.y, b.z, b.yaw, t2, b.team, 0.6 - Lv.aim); } else b.cd = 0.3; } }
    // shots
    for (const sh of s.shots) { if (sh.life <= 0) continue; sh.life -= dt; sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.z += sh.vz * dt; sh.m.position.set(sh.x, sh.y, sh.z); if (sh.life <= 0) { sh.m.visible = false; continue; }
      let hit = false; for (const k of s.cover) if (Math.abs(sh.x - k.x) < k.h && Math.abs(sh.z - k.z) < k.h && Math.abs(sh.y - k.y) < k.h * 0.6) { hit = true; this.fx.burst(sh.x, sh.y, sh.z, 0xffffff, 5, 2); break; }
      if (!hit) for (const b of B.bots) { if (b.hp <= 0 || b.team === sh.team) continue; if (Math.hypot(sh.x - b.x, sh.y - b.y, sh.z - b.z) < 3.8) { hit = true; b.hp--; this.fx.burst(b.x, b.y + 1, b.z, sh.team === 0 ? 0x3ff0ff : 0xff4fa0, 12, 4); sfx('hit'); if (b.hp <= 0) this.botKO(b, sh.team === 0); break; } }
      if (!hit && sh.team !== 0 && B.me > 0 && Math.hypot(sh.x - c.x, sh.y - c.y - 1.2, sh.z - c.z) < 3.6) { hit = true; B.me--; this.fx.burst(c.x, c.y + 1.5, c.z, 0xff4fa0, 14, 4); sfx('bosshit'); toast(B.me > 0 ? `🫧 Bubble hit! Shields ${B.me}/${B.meMax}` : '🫧 POP! Your bubble shield burst.'); }
      if (hit) { sh.life = 0; sh.m.visible = false; } }
    const foesLeft = B.bots.filter((b) => b.hp > 0 && b.team !== 0).length;
    if (!foesLeft) return this.endBattle('win'); if (B.me <= 0) return this.endBattle('lose'); if (B.t <= 0) return this.endBattle('time');
  },
  botKO(b, mine) { const B = this.sky.bt; this.fx.confetti(b.x, b.y, b.z, 40); this.fx.puff(b.x, b.y, b.z, 12, 0xffffff); b.M.root.visible = false; if (mine) { B.score++; S.sky.ko = (S.sky.ko || 0) + 1; persist(); } toast(`💥 ${b.name} popped!${mine ? ' (+1 for you)' : ''}`); if (S.sky.ko >= 10) this.skyBadge('ace10', '🎯 Sky Ace', 'You popped 10 bots in the Fly High Arena!'); },
  endBattle(why) { const s = this.sky, B = s.bt; if (!B) return; s.bt = null; for (const b of B.bots) { this.scene.remove(b.M.root); b.M.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); } for (const sh of s.shots) { sh.life = 0; sh.m.visible = false; }
    const Lv = LEVELS[B.lv], c = this.cop; let msg;
    if (why === 'win') { const first = !S.sky.wins[B.lv]; S.sky.wins[B.lv] = (S.sky.wins[B.lv] || 0) + 1; S.sky.best = Math.max(S.sky.best || 0, Math.round(B.t)); persist(); sfx('win'); this.fx.confetti(c.x, c.y + 2, c.z, 80); setTimeout(() => this.earn(Lv.pay + (first ? 30 : 0), first ? 'arena win + first-win bonus' : 'arena win'), 900); this.skyBadge('arena', '⚔️ Arena Champ', 'You won a Fly High Arena battle!'); if (B.lv === 'ace') this.skyBadge('arenaace', '👑 Ace of the Arena', 'You beat the Ace bots!'); msg = [['Ref Rex', `VICTORY! ${B.score} pops by you with ${Math.round(B.t)} s left. That's ${Lv.pay}${first ? ' + 30 first-win bonus' : ''} coins!`]]; }
    else if (why === 'lose') { msg = [['Ref Rex', 'POP! Your bubble shield burst, so that round goes to the bots. No harm done. Try again, or pick an easier level!']]; sfx('deny'); }
    else if (why === 'time') { const pay = B.score * 8; if (pay) setTimeout(() => this.earn(pay, 'arena pops'), 600); msg = [['Ref Rex', `Time! Nobody won this one, but you popped ${B.score} bot${B.score === 1 ? '' : 's'}${pay ? ` (+${pay} coins)` : ''}.`]]; }
    else { toast('⚔️ Battle ended.'); }
    if (why !== 'left') { const lb = ARENA.lobby; c.x = lb.x; c.z = lb.z - 4; c.y = lb.y + 6; c.vx = c.vz = 0; c.vy = 0; c.mode = 'fly'; this.cam.snap = true; talk(msg); } this.app.hud.battle && this.app.hud.battle(null); },
  skyStatus() { const s = this.sky; if (!s || !s.on) return ''; if (s.bt) return `🫧 ${'●'.repeat(s.bt.me)}${'○'.repeat(s.bt.meMax - s.bt.me)} · 👾 ${s.bt.bots.filter((b) => b.hp > 0 && b.team !== 0).length} left · ⏱ ${Math.ceil(s.bt.t)} s`; if (s.ice > 1) return `🧊 Ice ${Math.round(s.ice)}%`; return ''; },
  skyGoal() { const s = this.sky; if (!s || !s.on) return null; if (s.bt) return `Arena: pop the bots! ${this.skyStatus()}`; if (s.ice > 40) return `${this.skyStatus()} · thaw out somewhere warm`; return null; },
};
export { GEMS, HIGHWAY, LEVELS };
