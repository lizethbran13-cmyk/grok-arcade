// Grok Snowie Sky Tours - SUPER SKY HIGH EXPANSION (DLC #47, MEGA, unlock key grokDLC.skytours.super_sky_high_expansion).
// Three new floating sky areas way above the valley, each one changes how your aircraft flies:
//   ❄️ Frostbite Isle  - snowfall, sideways gusts and ICE that builds up on your wings (slower + heavier) until you thaw out
//   🌋 Ember Isle      - a live volcano: thermal updrafts lift you, ash turbulence shakes you, lava bombs pop out of the crater
//   ⚔️ Fly High Arena  - a floating stadium where you battle high-tech planes and copters (bots) with foam-bubble blasters
// plus the Sky Highway (boost rings that carry you up there), 6 Sky Gems and new badges. Ceiling raised from 175 m to 320 m.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { E } from './engine.js?v=st10';
import { PADS, Hf, WATER_Y } from './map.js?v=st10';
import { S, persist } from './save.js?v=st10';
import { sfx } from './audio.js?v=st10';
import { talk, toast } from './uikit.js?v=st10';
import { textGeo } from './text3d.js?v=st10';
import { PLANE, buildPlane } from './planes.js?v=st10';
import { held } from './input.js?v=st10';
const PI = Math.PI, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
import { DLC_KEY, skyOwned } from './dlc.js?v=st10';
import { FROST, EMBER, VOLC, ARENA, LOBBY, ISLES, VENTS, LAVA, COVER, JUMBO, PIT, volcR } from './skyworld.js?v=st10';
import { SPOTS } from './map.js?v=st10';
export { DLC_KEY, skyOwned, FROST, EMBER, ARENA };
const CRATER = { x: VOLC.x, z: VOLC.z, y: EMBER.y + VOLC.h, r: VOLC.top };
ARENA.lobby = { x: LOBBY.x, z: LOBBY.z, y: LOBBY.y, r: LOBBY.r };
const CEIL0 = 175, CEIL1 = 320;
const HIGHWAY = [[0, 40, -20], [-30, 80, 40], [-90, 120, 110], [-170, 160, 170], [-225, 198, 205], // heliport → Frostbite
  [-150, 230, 60], [-90, 240, -40], [-55, 242, -100], // Frostbite → Arena lobby
  [40, 235, -150], [130, 222, -200], [215, 210, -250]]; // Arena lobby → Ember
const GEMS = [{ id: 'g_frost1', x: -300, y: 232, z: 190 }, { id: 'g_frost2', x: -235, y: 262, z: 285 }, { id: 'g_ember1', x: CRATER.x, y: CRATER.y + 30, z: CRATER.z }, { id: 'g_ember2', x: 350, y: 215, z: -240 }, { id: 'g_arena', x: ARENA.x, y: 296, z: ARENA.z }, { id: 'g_high', x: -90, y: 312, z: 110 }];
// arena bots fly the new DLC aircraft (each with its own paint + glowing team tag)
export const BOT_TYPES = [
  { id: 'pirat', name: 'Pi-rat\'s Thunder Jet-Copter', plane: 'jetcopter', paint: 4, kind: 'heli', c: 0xff4fa0 },
  { id: 'grumble', name: 'Grumble\'s Midnight Wing', plane: 'stealth', paint: 3, kind: 'wing', c: 0xa78bfa },
  { id: 'robo', name: 'Robo Aurora Drone MK2', plane: 'hover', paint: 5, kind: 'heli', c: 0xfacc15 },
  { id: 'luna', name: 'Luna\'s Night Wing', plane: 'stealth', paint: 1, kind: 'wing', c: 0x3ff0ff },
];
const LEVELS = { easy: { n: 'Easy', spd: 0.7, cd: 2.6, aim: 0.18, hp: 2, pay: 40 }, normal: { n: 'Normal', spd: 0.9, cd: 1.8, aim: 0.26, hp: 3, pay: 70 }, ace: { n: 'Ace', spd: 1.1, cd: 1.15, aim: 0.36, hp: 4, pay: 120 } };
function col(g, c, k = 1) { g = g.index ? g.toNonIndexed() : g; const C = new THREE.Color(c); const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = C.r * k; a[i * 3 + 1] = C.g * k; a[i * 3 + 2] = C.b * k; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); for (const key of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(key)) g.deleteAttribute(key); return g; }
const GLOW_MAT = () => new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
function meshOf(L, mat) { const m = new THREE.Mesh(mergeGeometries(L, false), mat); m.matrixAutoUpdate = false; m.updateMatrix(); return m; }
// a 16:9 canvas screen (texture is 512×288, plane is w×h with the same ratio, so nothing is stretched)
function screen(J) { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 288; const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(J.w, J.h), new THREE.MeshBasicMaterial({ map: tx, toneMapped: false })); m.position.set(J.x, J.y, J.z); m.rotation.y = J.ry; return { m, cv, tx, ctx: cv.getContext('2d') }; }
function inArena(x, y, z) { return Math.hypot(x - ARENA.x, z - ARENA.z) < ARENA.r + 45 && y > ARENA.floor - 40; }

export function installSky(Game) { Object.assign(Game.prototype, SKY);
  const a0 = Game.prototype.areaName; Game.prototype.areaName = function () { const s = this.sky; if (s && s.on) { if (s.bt) return '⚔️ Fly High Arena · ' + LEVELS[s.bt.lv].n; const c = this.mode === 'walk' ? this.me : this.cop, A = skyArea(c.x, c.y, c.z); if (A) return A.name; } return a0.call(this); };
  const t0 = Game.prototype.target; Game.prototype.target = function () { const s = this.sky; if (s && s.bt) { const c = this.cop, e = s.bt.bots.filter((b) => b.hp > 0 && b.team !== 0).sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z))[0]; if (e) return { x: e.x, y: e.y, z: e.z, n: e.name }; } return t0.call(this); };
}
function skyArea(x, y, z) { if (y < 120) return null; if (Math.hypot(x - ARENA.x, z - ARENA.z) < ARENA.r + 25 && y > ARENA.floor - 25) return ARENA; if (Math.hypot(x - LOBBY.x, z - LOBBY.z) < LOBBY.r + 12) return { name: '⚔️ Arena Lobby' }; { let B = null, bd = 1e9; for (const I of [FROST, EMBER]) { const d = Math.hypot(x - I.x, z - I.z); if (d < I.zone && d < bd) { bd = d; B = I; } } if (B) return B; } if (y > 180) return { name: '☁️ Super Sky High' }; return null; }

const SKY = {
  skyCeil() { return this.sky && this.sky.on ? CEIL1 : CEIL0; },
  buildSky() { const on = skyOwned(); const s = this.sky = { on, ice: 0, gust: 0, gx: 0, gz: 0, bombs: [], shots: [], bt: null, gemM: {}, hw: [], hwT: 0, warn: 0, fx: 0, near: null, cover: COVER, scr: [], pit: [], ventT: 0, plumeT: 0, lavaT: 0, scrT: 0 }; if (!on) return;
    const scene = this.scene, LG = [];
    // the arena crowd stays visible across the whole bowl (you always see the far stands from inside)
    for (const m of this.world.detailMeshes) { const ws = m.userData.ws; if (ws && ws.center.y > 180 && Math.hypot(ws.center.x - ARENA.x, ws.center.z - ARENA.z) < ARENA.stand1 + 12) m.userData.dr = 420; }
    // Sky Highway boost rings
    { const tg = new THREE.TorusGeometry(7, 0.55, 10, 40); for (let i = 0; i < HIGHWAY.length; i++) { const [x, y, z] = HIGHWAY[i], n = HIGHWAY[Math.min(HIGHWAY.length - 1, i + 1)], pv = HIGHWAY[Math.max(0, i - 1)]; const yaw = Math.atan2(n[0] - pv[0], n[2] - pv[2]); LG.push(col(tg.clone().rotateY(yaw).translate(x, y, z), i % 2 ? 0x3ff0ff : 0xa78bfa, 1.7)); s.hw.push({ x, y, z, dx: Math.sin(yaw), dz: Math.cos(yaw) }); } }
    s.glow = meshOf(LG, GLOW_MAT()); scene.add(s.glow);
    // the soft energy net under the arena floor
    { const net = new THREE.Mesh(new THREE.CircleGeometry(ARENA.r, 64).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: 0x3ff0ff, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); net.position.set(ARENA.x, ARENA.floor, ARENA.z); net.renderOrder = 2; scene.add(net); s.net = net; }
    // Sky Gems
    { const gg = new THREE.OctahedronGeometry(1.6, 0), gm = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 1.4, roughness: 0.2, metalness: 0.3 }); for (const q of GEMS) { const m = new THREE.Mesh(gg, gm); m.position.set(q.x, q.y, q.z); m.visible = !(S.gems || []).includes(q.id); scene.add(m); s.gemM[q.id] = m; } }
    // jumbotrons (live score) + pit-hangar display aircraft (the 3 new DLC ships)
    for (const J of JUMBO) { const sc = screen(J); scene.add(sc.m); s.scr.push(sc); } this.skyScreens(true);
    ['jetcopter', 'stealth', 'hover'].forEach((id, i) => { const P = PIT[i]; if (!P || !PLANE(id)) return; const M = buildPlane(id, 0, { hp: 100, display: true }); M.root.position.set(P.x, P.y, P.z); M.root.rotation.y = P.ry + 0.5; scene.add(M.root); s.pit.push(M); });
    // weather particles: snow + ash (Points around the camera)
    { const N = 700, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 80; pos[i * 3 + 1] = (Math.random() - 0.5) * 50; pos[i * 3 + 2] = (Math.random() - 0.5) * 80; } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); s.wx = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.9, depthWrite: false })); s.wx.frustumCulled = false; s.wx.visible = false; scene.add(s.wx); }
    // lava bomb + foam shot pools
    { const bg = new THREE.IcosahedronGeometry(1.3, 1), bm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff6a1a).multiplyScalar(2), toneMapped: false }); for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(bg, bm); m.visible = false; scene.add(m); s.bombs.push({ m, life: 0 }); } s.bombT = 1;
      const sgm = new THREE.SphereGeometry(0.7, 12, 8); s.shotMat = [new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3ff0ff).multiplyScalar(2), toneMapped: false }), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff4fa0).multiplyScalar(2), toneMapped: false })]; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(sgm, s.shotMat[0]); m.visible = false; scene.add(m); s.shots.push({ m, life: 0 }); } }
    if (!S.sky) { S.sky = { wins: {}, best: 0, ko: 0 }; persist(); }
  },
  // draw the three arena jumbotrons (idle: Snowie's welcome card; in battle: live scoreboard)
  skyScreens(force) { const s = this.sky; if (!s || !s.scr.length) return; const B = s.bt; const key = B ? `${B.me}|${B.bots.map((b) => b.hp).join(',')}|${Math.ceil(B.t)}` : 'idle' + Math.floor(this.T / 4 || 0) % 2; if (!force && key === s.scrK) return; s.scrK = key;
    for (const sc of s.scr) { const g = sc.ctx; const gr = g.createLinearGradient(0, 0, 0, 288); gr.addColorStop(0, '#1e1b4b'); gr.addColorStop(1, '#0f172a'); g.fillStyle = gr; g.fillRect(0, 0, 512, 288); g.strokeStyle = '#ff4fa0'; g.lineWidth = 8; g.strokeRect(4, 4, 504, 280); g.textAlign = 'center'; g.fillStyle = '#3ff0ff'; g.font = 'bold 34px sans-serif'; g.fillText('⚔️ FLY HIGH ARENA', 256, 48);
      if (B) { g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif'; g.fillText(`⏱ ${Math.ceil(B.t)} s   ·   ${LEVELS[B.lv].n}`, 256, 92); g.font = 'bold 24px sans-serif'; g.textAlign = 'left'; g.fillStyle = '#3ff0ff'; g.fillText(`YOU  ${'●'.repeat(B.me)}${'○'.repeat(B.meMax - B.me)}`, 30, 136); B.bots.forEach((b, i) => { g.fillStyle = b.hp > 0 ? '#' + (b.c || 0xff4fa0).toString(16).padStart(6, '0') : '#64748b'; g.fillText(`${b.name.slice(0, 26)}  ${b.hp > 0 ? '●'.repeat(b.hp) : 'POPPED'}`, 30, 172 + i * 34); }); }
      else if (key.endsWith('0')) { g.fillStyle = '#fff'; g.font = 'bold 28px sans-serif'; g.fillText('❄️ Announcer: SNOWIE!', 256, 110); g.font = '24px sans-serif'; g.fillStyle = '#fde68a'; g.fillText('Sign up with Ref Rex in the lobby', 256, 160); g.fillText('Easy · Normal · Ace', 256, 196); g.fillStyle = '#ff4fa0'; g.fillText(`Your KOs: ${(S.sky && S.sky.ko) || 0}`, 256, 240); }
      else { g.fillStyle = '#fff'; g.font = 'bold 28px sans-serif'; g.fillText('NEW: SUPER SKY HIGH SHIPS', 256, 110); g.font = '24px sans-serif'; g.fillStyle = '#fde68a'; g.fillText('⚡ Thunder Jet-Copter', 256, 156); g.fillText('🌙 Midnight Stealth Wing', 256, 192); g.fillText('🛸 Aurora Hover-Drone', 256, 228); }
      sc.tx.needsUpdate = true; } },
  // ------------------------------------------------------------------ per frame
  skyUpdate(dt, busy) { const s = this.sky; if (!s) return; if (!s.on) { const c = this.cop; if (this.mode === 'fly' && c.mode === 'fly' && c.y > CEIL0 - 3 && (!s.lockT || this.T - s.lockT > 20)) { s.lockT = this.T; toast('🔒 Higher up is the SUPER SKY HIGH EXPANSION: Frostbite Isle, Ember Isle and the Fly High Arena. Unlock it at the Grok Arcade DLC Shop (175 🎟️).'); } return; } const c = this.cop, fly = this.mode === 'fly' && c.mode === 'fly', T = this.T;
    // gems spin
    for (const id in s.gemM) { const m = s.gemM[id]; if (!m.visible) continue; m.rotation.y = T * 2; m.position.y = GEMS.find((q) => q.id === id).y + Math.sin(T * 2 + m.position.x) * 0.5; if (fly && Math.hypot(c.x - m.position.x, c.y - m.position.y, c.z - m.position.z) < 6) this.skyGem(id); }
    const fr = fly ? Math.hypot(c.x - FROST.x, c.z - FROST.z) : 1e9, er = fly ? Math.hypot(c.x - EMBER.x, c.z - EMBER.z) : 1e9;
    const arena = !!s.bt || inArena(c.x, c.y, c.z); const inFrost = !arena && fr < FROST.zone && c.y > 140, inEmber = !arena && er < EMBER.zone && c.y > 140;
    // ---- Frostbite: gusts + icing ----
    s.gust -= dt; if (s.gust <= 0) { s.gust = 2 + Math.random() * 3; const a = Math.random() * PI * 2, k = 4 + Math.random() * 6; s.tgx = Math.cos(a) * k; s.tgz = Math.sin(a) * k; }
    if (inFrost) { const shelter = fr < FROST.r + 4 && c.y < FROST.y + 18 ? 0.15 : 1; s.gx += ((s.tgx || 0) - s.gx) * Math.min(1, dt * 1.5); s.gz += ((s.tgz || 0) - s.gz) * Math.min(1, dt * 1.5); c.x += s.gx * shelter * dt; c.z += s.gz * shelter * dt; s.ice = Math.min(100, s.ice + dt * 2.6); if (s.ice > 0 && !S.badges.snowbird && fr < FROST.r) this.skyBadge('snowbird', '❄️ Snowbird', 'You flew over Frostbite Isle!'); }
    else { s.gx *= Math.exp(-dt * 2); s.gz *= Math.exp(-dt * 2); s.ice = Math.max(0, s.ice - dt * (inEmber ? 25 : c.y < 120 ? 8 : 3)); }
    if (this.mode === 'fly' && c.mode === 'ground' && c.onPad && c.onPad.id === 'sky_frost') s.ice = Math.max(0, s.ice - dt * 30); // the lodge's cocoa steam thaws you on the pad
    if (fly && s.ice > 0) { const PLi = PLANE(c.id); if (PLi.kind === 'wing') c.sp = Math.max(PLi.min, (c.sp || PLi.min) * (1 - s.ice / 100 * 0.35 * dt * 2.2)); c.vx *= 1 - s.ice / 100 * 0.35 * dt * 2.2; c.vz *= 1 - s.ice / 100 * 0.35 * dt * 2.2; if (!held('jump')) c.y -= s.ice / 100 * 3 * dt; if (s.ice > 60 && (!s.iceT || T - s.iceT > 9)) { s.iceT = T; toast('🧊 Ice on your wings! You\'re slower and heavier. Land on the Frostbite pad (cocoa steam) or fly somewhere warm to thaw.'); } }
    // ---- Ember: thermals, turbulence, lava bombs ----
    const C = CRATER, cr = fly && !arena ? Math.hypot(c.x - C.x, c.z - C.z) : 1e9;
    if (fly && cr < 30 && c.y > C.y - 10) { c.vy = Math.max(c.vy, 9 * (1 - cr / 30) + 3); if (!S.badges.lavaproof && c.y > C.y + 15) this.skyBadge('lavaproof', '🌋 Lava-Proof', 'You rode the volcano\'s thermal updraft!'); if (c.y < C.y + 6 && (!s.hotT || T - s.hotT > 3)) { s.hotT = T; toast('🔥 Too hot down there! The thermal pushes you back up.'); } }
    if (inEmber) { const k = (1 - er / EMBER.zone) * 2.2; c.x += Math.sin(T * 7.3) * k * dt; c.z += Math.cos(T * 6.1) * k * dt; c.y += Math.sin(T * 9.7) * k * 0.6 * dt; if (this.cam && E.camera) { E.camera.position.y += Math.sin(T * 31) * 0.05 * k; } }
    s.bombT -= dt; if (!arena && er < EMBER.zone + 60 && s.bombT <= 0) { s.bombT = 1.4 + Math.random() * 1.6; const b = s.bombs.find((q) => q.life <= 0); if (b) { const a = Math.random() * PI * 2, sp = 6 + Math.random() * 10; Object.assign(b, { x: C.x, y: C.y, z: C.z, vx: Math.cos(a) * sp, vy: 26 + Math.random() * 14, vz: Math.sin(a) * sp, life: 6 }); b.m.visible = true; if (er < EMBER.zone) sfx('bosshit'); } }
    this.skyFx(dt, er, arena);
    for (const b of s.bombs) { if (b.life <= 0) continue; b.life -= dt; b.vy -= 12 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.m.position.set(b.x, b.y, b.z); b.m.rotation.x += dt * 3; if (Math.random() < 0.5) this.fx.emit(b.x, b.y, b.z, 0, 0.5, 0, 0.35, 0x57534e, 1.2, -1, 1);
      if (b.y < EMBER.y - 60 || b.life <= 0) { b.life = 0; b.m.visible = false; continue; }
      if (b.vy < 0 && b.y < EMBER.y + 0.5 + (Math.hypot(b.x - VOLC.x, b.z - VOLC.z) < VOLC.base ? 6 : 0) && Math.hypot(b.x - EMBER.x, b.z - EMBER.z) < EMBER.r) { b.life = 0; b.m.visible = false; this.fx.burst(b.x, EMBER.y + 0.5, b.z, 0xff7a1a, 10, 4); continue; }
      if (fly && !arena && Math.hypot(b.x - c.x, b.y - c.y - 1.2, b.z - c.z) < 3.8) { b.life = 0; b.m.visible = false; this.fx.burst(c.x, c.y + 1.5, c.z, 0xff7a1a, 18, 6); sfx('hit'); this.setHp(c.hp - 6); c.vx += b.vx * 0.8; c.vz += b.vz * 0.8; c.vy = 6; toast('🌋 Lava bomb! −6% (it was mostly a hot marshmallow)'); } }
    // ---- weather particles ----
    { const w = s.wx, cp = E.camera.position, snow = (inFrost || (this.mode === 'walk' && Math.hypot(this.me.x - FROST.x, this.me.z - FROST.z) < FROST.r + 5)), ash = inEmber; w.visible = snow || ash; if (w.visible) { w.material.color.set(snow ? 0xffffff : 0x57534e); w.material.size = snow ? 0.35 : 0.22; const p = w.geometry.attributes.position, a = p.array, fall = snow ? 5 : -2.5; for (let i = 0; i < a.length; i += 3) { a[i + 1] -= fall * dt; a[i] += (s.gx * 0.6 + Math.sin(T + i) * 0.4) * dt; a[i + 2] += s.gz * 0.6 * dt; if (a[i + 1] < -25) a[i + 1] += 50; if (a[i + 1] > 25) a[i + 1] -= 50; if (a[i] > 40) a[i] -= 80; if (a[i] < -40) a[i] += 80; if (a[i + 2] > 40) a[i + 2] -= 80; if (a[i + 2] < -40) a[i + 2] += 80; } p.needsUpdate = true; w.position.copy(cp); } }
    // ash makes it hazy near the volcano
    if (this.scene.fog) { const base = s.fog0 == null ? (s.fog0 = this.scene.fog.density) : s.fog0, want = inEmber ? base + 0.004 * (1 - er / EMBER.zone) : inFrost ? base + 0.0005 : base; this.scene.fog.density += (want - this.scene.fog.density) * Math.min(1, dt * 2); }
    // ---- Sky Highway boost rings ----
    if (fly) for (let i = 0; i < s.hw.length; i++) { const r = s.hw[i]; if (Math.hypot(c.x - r.x, c.y - r.y, c.z - r.z) < 7.5 && (s.hwI !== i || T - s.hwT > 2)) { s.hwI = i; s.hwT = T; const n = HIGHWAY[Math.min(HIGHWAY.length - 1, i + 1)], up = (n[1] - r.y) > 5 ? 8 : 2; const PL = PLANE(c.id); if (PL.kind === 'wing') c.sp = Math.min(PL.spd * 1.6, (c.sp || PL.min) + 18); else { c.vx += r.dx * 22; c.vz += r.dz * 22; } c.vy = Math.max(c.vy, up); sfx('glide'); this.fx.ring(r.x, r.y, r.z, i % 2 ? 0x3ff0ff : 0xa78bfa, 7); if (!S.badges.highway && i === HIGHWAY.length - 1) this.skyBadge('highway', '🛣️ Sky Highway Star', 'You rode the Sky Highway all the way to Ember Isle!'); } }
    // ---- island undersides: you can't fly through rock ----
    if (fly) for (const I of ISLES) { const d = Math.hypot(c.x - I.x, c.z - I.z); const bottom = I.y - 4 - (I.lobby ? 26 : I.r * 1.1) * Math.max(0, 1 - d / I.r); if (d < I.r && c.y < I.y - 3.5 && c.y + 3 > bottom) { const hs = Math.hypot(c.vx, c.vz); if (c.y + 3 - bottom < 3) { c.y = bottom - 3; c.vy = Math.min(c.vy, 0); } else { const k = (I.r - d + 0.5) / Math.max(d, 0.01); c.x += (c.x - I.x) * k; c.z += (c.z - I.z) * k; if (PLANE(c.id).kind === 'wing') c.yaw = Math.atan2(c.x - I.x, c.z - I.z); c.vx *= 0.3; c.vz *= 0.3; } if (hs > 8 && (!s.rockT || T - s.rockT > 1.5)) { s.rockT = T; sfx('hit'); this.setHp(c.hp - 3); toast('🪨 Bonk on the island rock! −3% (repairs cost coins at the Repair Shop)'); } } }
    // the volcano cone is solid rock: push out, and a fast hit is a real bump
    if (fly && c.y > EMBER.y - 1 && c.y < CRATER.y) { const dx = c.x - VOLC.x, dz = c.z - VOLC.z, d = Math.hypot(dx, dz), a = Math.atan2(dz, dx), R = volcR(c.y - EMBER.y, a) + 2.2; if (d < R && d > VOLC.top - 2) { const k = R / Math.max(d, 0.01); c.x = VOLC.x + dx * k; c.z = VOLC.z + dz * k; const hs = Math.hypot(c.vx, c.vz); c.vx *= 0.2; c.vz *= 0.2; c.vy = Math.max(c.vy, 2); if (PLANE(c.id).kind === 'wing') c.yaw = Math.atan2(dx, dz); const sp = hs; if (sp > 1.5 && (!s.rockT || T - s.rockT > 1.2)) { s.rockT = T; const dmg = Math.max(1, Math.min(30, Math.round(sp * 0.6))); sfx('hit'); this.setHp(c.hp - dmg); if (c.hp <= 0 || sp > 26) { this.crash('bonk', Math.min(1.5, sp / 30)); return; } toast(dmg <= 3 ? '🌋 Little scrape on the volcano! −' + dmg + '%' : dmg < 12 ? '🌋 Bonk on the volcano! −' + dmg + '%' : '🌋 BIG volcano crash! −' + dmg + '%'); } c.x += dx / Math.max(d, 0.01) * 0.6; c.z += dz / Math.max(d, 0.01) * 0.6; } }
    // arena cover blocks
    if (fly && s.bt) for (const b of s.cover) { const dx = c.x - b.x, dy = c.y + 1.2 - b.y, dz = c.z - b.z; if (Math.abs(dx) < b.h && Math.abs(dy) < b.h * 0.6 + 0.6 && Math.abs(dz) < b.h) { const ax = b.h - Math.abs(dx), az = b.h - Math.abs(dz); if (ax < az) { c.x += Math.sign(dx) * ax; c.vx = 0; } else { c.z += Math.sign(dz) * az; c.vz = 0; } if (PLANE(c.id).kind === 'wing') c.yaw += 1.2 * dt * 10; } }
    // first time up here: a hello from Snowie
    if (fly && c.y > 185 && !S.talks.skyhigh) { S.talks.skyhigh = 1; persist(); talk([['Snowie', 'WHOA, we\'re SUPER SKY HIGH! Up here the weather is wild: ❄️ Frostbite Isle freezes your wings, 🌋 Ember Isle has a real volcano, and the ⚔️ Fly High Arena is where pilots battle!'], ['Snowie', 'Fly through the purple and cyan Sky Highway rings for a boost, and grab the 6 shiny 💎 Sky Gems!']]); }
    if (s.bt) this.battleUpdate(dt, busy);
    s.scrT -= dt; if (s.scrT <= 0) { s.scrT = 0.5; if (Math.hypot(E.camera.position.x - ARENA.x, E.camera.position.z - ARENA.z) < 420) this.skyScreens(false); }
    for (const M of s.pit) for (const p of M.spin) p.o.rotation[p.ax] += dt * 2;
  },
  // steam vents, the smoke plume over the crater and bubbling lava (only when you are nearby)
  skyFx(dt, er, arena) { const s = this.sky, cp = E.camera.position, near = Math.hypot(cp.x - EMBER.x, cp.z - EMBER.z) < 420 && !arena; if (!near) return;
    s.plumeT -= dt; if (s.plumeT <= 0) { s.plumeT = 0.12; const a = Math.random() * PI * 2, r = Math.random() * VOLC.top * 0.7; this.fx.emit(CRATER.x + Math.cos(a) * r, CRATER.y + 1, CRATER.z + Math.sin(a) * r, (Math.random() - 0.5) * 1.5, 5 + Math.random() * 3, (Math.random() - 0.5) * 1.5, 5 + Math.random() * 3, Math.random() < 0.3 ? 0x57534e : 0x3f3f46, 6, -1, 7); }
    s.ventT -= dt; if (s.ventT <= 0 && VENTS.length) { s.ventT = 0.18; const v = VENTS[(Math.random() * VENTS.length) | 0]; this.fx.emit(v[0] + (Math.random() - 0.5), EMBER.y + 0.6, v[1] + (Math.random() - 0.5), 0, 3.5 + Math.random() * 2, 0, 2.2, 0xf1f5f9, 2.2, -1, 3); }
    s.lavaT -= dt; if (s.lavaT <= 0 && LAVA.length) { s.lavaT = 0.25; const L = LAVA[(Math.random() * LAVA.length) | 0], p = Array.isArray(L) ? L[(Math.random() * L.length) | 0] : L; if (p) { const x = p.x ?? p[0], y = (p.y ?? p[1]) + (p.x != null ? 0 : EMBER.y), z = p.z ?? p[2]; this.fx.emit(x, y + 0.4, z, 0, 2, 0, 0.6, 0xff7a1a, 0.7, -1, 1); } } },
  skyAct(best) { const s = this.sky; if (!s || !s.on) return best; const c = this.cop, lb = ARENA.lobby, sp = SPOTS.signup, pp = SPOTS.lobbyPad;
    if (s.bt) return this.mode === 'fly' && c.mode === 'fly' ? { label: `🫧 FIRE${s.bt.cool > 0 ? '…' : ''}`, f: () => this.fire() } : best;
    if (this.mode === 'walk' && sp && Math.hypot(this.me.x - sp[0], this.me.z - sp[1]) < 3.5 && Math.abs(this.me.y - lb.y) < 6) return { label: '⚔️ Sign up with Ref Rex', f: () => this.arenaMenu() };
    if (this.mode === 'fly' && (c.mode === 'ground' || c.mode === 'fly') && pp && Math.hypot(c.x - pp[0], c.z - pp[1]) < 14 && Math.abs(c.y - lb.y) < 18) return { label: '⚔️ Fly High Arena', f: () => this.arenaMenu() };
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
    const bots = types.map((B, i) => { const M = buildPlane(B.plane, B.paint, { hp: 100, display: true }); this.scene.add(M.root); const tc = B.team === 0 ? 0x3ff0ff : (B.c || 0xff4fa0); { const ring = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.18, 8, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(tc).multiplyScalar(2), toneMapped: false })); ring.rotation.x = PI / 2; ring.position.y = 1.4; M.root.add(ring); const tg = textGeo(B.name.split(' (')[0], 0.9, 0.2); if (tg) { tg.computeBoundingBox(); const bb = tg.boundingBox; tg.translate(-(bb.max.x + bb.min.x) / 2, 0, 0); const t1 = new THREE.Mesh(tg, ring.material); t1.position.y = 6.2; t1.name = 'tag'; M.root.add(t1); } } const a = (i + 1) / (types.length + 1) * PI * 2 + PI / 2; const b = { ...B, M, x: A.x + Math.cos(a) * 70, y: 245 + i * 6, z: A.z + Math.sin(a) * 70, yaw: 0, sp: 0, hp: B.team === 0 ? 5 : Lv.hp, max: B.team === 0 ? 5 : Lv.hp, cd: 2 + Math.random() * 2, wob: Math.random() * 9, roll: 0 }; b.yaw = Math.atan2(A.x - b.x, A.z - b.z); return b; });
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
      b.M.root.position.set(b.x, b.y, b.z); b.M.root.rotation.set(0, b.yaw, 0); b.M.root.rotation.z = b.roll; { const tg = b.M.root.getObjectByName('tag'); if (tg) tg.rotation.set(0, Math.atan2(E.camera.position.x - b.x, E.camera.position.z - b.z) - b.yaw, -b.roll); } for (const p of b.M.spin) p.o.rotation[p.ax] += dt * 14 * Math.sign(p.k || 1); for (const q of b.M.discs) { q.material.opacity = 0.16; q.visible = true; }
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
    if (why !== 'left') { const pp = SPOTS.lobbyPad || [LOBBY.x, LOBBY.z]; c.x = pp[0]; c.z = pp[1]; c.y = LOBBY.y + 6; c.vx = c.vz = 0; c.vy = 0; c.mode = 'fly'; this.cam.snap = true; talk(msg); } this.app.hud.battle && this.app.hud.battle(null); },
  skyStatus() { const s = this.sky; if (!s || !s.on) return ''; if (s.bt) return `🫧 ${'●'.repeat(s.bt.me)}${'○'.repeat(s.bt.meMax - s.bt.me)} · 👾 ${s.bt.bots.filter((b) => b.hp > 0 && b.team !== 0).length} left · ⏱ ${Math.ceil(s.bt.t)} s`; if (s.ice > 1) return `🧊 Ice ${Math.round(s.ice)}%`; return ''; },
  skyGoal() { const s = this.sky; if (!s || !s.on) return null; if (s.bt) return `Arena: pop the bots! ${this.skyStatus()}`; if (s.ice > 40) return `${this.skyStatus()} · thaw out somewhere warm`; return null; },
};
export { GEMS, HIGHWAY, LEVELS };
