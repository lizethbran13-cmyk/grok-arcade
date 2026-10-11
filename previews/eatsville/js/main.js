// Grok Eatsville Tycoon - main loop: town <-> interiors, player, cars, live restaurant sim, day cycle, HUD.
import * as THREE from 'three';
import { E, initEngine, setEnvironment, followShadow, render, trackFps } from './engine.js';
import { initMats, initMats2, MATS } from './mats.js';
import { loadFont } from './text3d.js';
import { $, toast as toast0, clamp, damp, wrapAng, rng } from './util.js';
import { initInput, readMove, edge, IN, clearEdges } from './input.js';
import { initAudio, sfx as sfx0, playMusic, setSound } from './audio.js';
import { buildTown, collideTown, animTown, T, makeLotSign, makeGrade } from './town.js';
import { buildInterior, collideRoom, IX, REST, NPCLOOK, ratNPC } from './interiors.js';
import { makePerson, animPerson, randomLook } from './people.js';
import { makeCar, newCarState, stepCar, poseCar } from './cars.js';
import { dishModel, DISH, STATIONS } from './food.js';
import { animRat, makeMartina, animMartina, makeCandy, animCandy } from './ratmodels.js';
import { initDecorCull, decorCull, makeVisTest, warmShaders } from './perf.js';
import { initFx, burst, stepFx, clearFx, floatText, stepFloats, clearFloats } from './fx.js';
import { S, setS, persist, loadSave, newGame, newDay, ensureToday, autopilotHour, offsiteInspection, branchFor, branchKey, EV, isOpen, fmtTime, MIN_PER_SEC, BEDTIME, DAY_START, rankUp, news } from './empire.js';
import { RestSim } from './sim.js';
import { ROADS as ROADS_ } from './data.js';
import { BLD, BUILDINGS, OUTFITS, CAR, CAREER, LOTS, RIVALS } from './data.js';
import * as U from './ui.js';
import { Net } from './net.js';
import { MB, toGroup, XB } from './kit.js';
import { P as GP } from './geo.js';
const PI = Math.PI;
export const G = { state: 'boot', where: 'town', room: null, sim: null, bid: null, yaw: 0, camT: 0, t: 0, lastHour: -1, carState: null, carModel: null, driving: false, deliv: null, remote: {}, paused: false };
const ENV = {
  day: { sunDir: [0.5, 0.85, 0.35], skyTop: 0x1f74d8, skyMid: 0x7cc2ff, skyBot: 0xbfe4ff, fog: 0xa8d4ff, fogD: 0.0026, sunI: 3.0, sunColor: 0xfff2dc, hemiSky: 0xcfe6ff, hemiGround: 0x5f7f3e, hemiI: 0.5, exposure: 0.95, envI: 0.75, sunDisc: 1, bloomT: 1.2, bloomS: 0.3 },
  dusk: { sunDir: [0.85, 0.28, 0.25], skyTop: 0x433a8f, skyMid: 0xff9e6e, skyBot: 0xffd2a0, fog: 0xffb890, fogD: 0.003, sunI: 2.1, sunColor: 0xffb070, hemiSky: 0xffc8a8, hemiGround: 0x5a4a6a, hemiI: 0.55, exposure: 1.0, envI: 0.75, sunDisc: 1, bloomT: 0.95, bloomS: 0.55 },
  night: { sunDir: [-0.35, 0.75, 0.4], skyTop: 0x0a1030, skyMid: 0x1b2a5c, skyBot: 0x2c3c70, fog: 0x1e2c50, fogD: 0.0032, sunI: 0.7, sunColor: 0xa8bcff, hemiSky: 0x5a6aa8, hemiGround: 0x2a2a40, hemiI: 0.45, exposure: 1.05, envI: 0.45, stars: 1, moon: 1, bloomT: 0.8, bloomS: 0.65 },
  room: { sunDir: [0.3, 1, 0.55], skyTop: 0x3b2f4a, skyMid: 0x5a4660, skyBot: 0x6b5468, fog: 0x4a3c55, fogD: 0.0012, sunI: 1.9, sunColor: 0xfff1dc, hemiSky: 0xfff6ea, hemiGround: 0x8a7a6a, hemiI: 0.6, exposure: 0.95, envI: 0.6, envLight: 0xffffff, bloomT: 1.1, bloomS: 0.35 },
};
let curEnv = null; function env(k) { if (curEnv === k) return; curEnv = k; setEnvironment(ENV[k]); }
function phase() { const t = S ? S.time % 1440 : 600; return t >= 1230 || t < 375 ? 'night' : t >= 1110 || t < 450 ? 'dusk' : 'day'; }
const toast = (m, bad) => toast0(m, bad); const sfx = (n) => sfx0(n);
// ---------------- boot ----------------
async function boot() {
  const bar = $('loadBar'), txt = $('loadTxt'); const step = (p, t) => { bar.style.width = p + '%'; if (t) txt.textContent = t; };
  initEngine($('c'), 'high'); initMats(); initMats2(); initInput(); initFx(E.scene); step(20, 'Preheating the ovens…');
  await loadFont(); step(40, 'Painting Eatsville…'); await new Promise((r) => setTimeout(r, 30));
  buildTown(E.scene); initDecorCull(T); step(75, 'Hiring a grumpy inspector…');
  G.pModel = new THREE.Group(); E.scene.add(G.pModel);
  G.arrow = makeArrow(); E.scene.add(G.arrow); G.arrow.visible = false;
  G.signGrp = new THREE.Group(); E.scene.add(G.signGrp); G.trafficInit = false;
  buildSpatulas();
  env('day'); E.camera.position.set(-30, 40, -10); E.camera.lookAt(0, 0, 0);
  warmShaders(E.renderer, E.scene, E.camera); step(100, 'Open for business!');
  setTimeout(() => $('loading').classList.add('gone'), 200);
  Net.init(G, C, { myLook: () => (S && S.look ? lookFromSave() : { skin: 0xf2c29b, hair: 0x5a3820, hairStyle: 'short', shirt: 0x3b82f6, pants: 0x334155, shoes: 0x222222, brows: 'happy' }), afterSim: (r) => afterSim(r, null) }); U.UI.C = C; G.state = 'title'; titleCam(); U.title(C);
  document.addEventListener('pointerdown', () => { initAudio(); applySound(); }, { once: false });
  let last = performance.now(); const loop = (now) => { requestAnimationFrame(loop); const dt = Math.min(0.05, (now - last) / 1000); last = now; frame(dt); }; requestAnimationFrame(loop);
  const p = new URLSearchParams(location.search); if (p.get('mp') && window.GrokNet) Net.fromUrl(C);
}
function titleCam() { G.where = 'town'; showTown(true); }
function applySound() { const m = S && S.opts && S.opts.mute; setSound(!m, !m); }
// ---------------- the game API used by menus + net ----------------
export const C = {
  sfx, toast, banner,
  start(isNew) { G.state = 'play'; ensureToday(); G.lastHour = Math.floor(S.time / 60); restyle(); respawnCar(false); rebuildTownSigns(); setupTraffic(); U.close();
    const sp = BLD.home; placeOutside('home'); $('hud').classList.remove('hidden'); $('touch').classList.remove('hidden'); playMusic('kitchen'); applySound();
    if (isNew) setTimeout(() => S.mode === 'worker' ? banner('👋 Welcome to Eatsville!', 'Your new job: head to MEGA MUNCH (west) and clock in with Manager Mo') : S.mode === 'explore' ? banner('🗺️ Explore mode', 'Go anywhere, buy anything. Every door opens!') : banner('👋 Welcome to Eatsville!', 'Your diner is on Main St (east). Hop in your car and go cook!'), 600);
    if (!S.seen.ctl) { S.seen.ctl = 1; setTimeout(() => toast('👈 Drag on the left side to walk · swipe the right side to look around · tap the big orange button to do things'), 4200); }
    G.navTarget = S.mode === 'worker' && !S.branches.A ? 'mega' : 'lotA'; },
  coop() { Net.lobby(C); }, net: () => Net.code(), quit() { Net.leave(); U.close(); G.state = 'title'; leaveRoom(true); $('hud').classList.add('hidden'); $('touch').classList.add('hidden'); U.title(C); },
  changed(key, rebuild) { persist(); if (G.sim && branchKey(G.bid) === key) { G.sim.br = S.branches[key]; if (rebuild) rebuildRoom(); } rebuildTownSigns(); Net.pushState && Net.pushState(); },
  rebuildRoom, rebuildTownSigns, respawnCar, restyle, sound: applySound,
  clockIn() { S.career.shift = true; S.career.tips = 0; S.career.served = 0; S.career.shiftStart = S.time; G.sim.career = true; G.sim.staff = G.sim.staff.filter((f) => f.role !== 'cook').concat(G.sim.staff.filter((f) => f.role === 'cook').slice(0, 1)); banner('⏱️ Clocked in!', 'Cook what customers order. Manager Mo is watching…'); },
  clockOut() { const c = S.career; const hrs = Math.max(1, (S.time - c.shiftStart) / 60); const pay = Math.round(CAREER[c.rank].wage * Math.min(1, hrs / 4)) + c.tips; S.money += pay; c.shift = false; if (G.sim) G.sim.career = false; persist(); banner('💵 Shift done! +$' + pay, c.served + ' customers served · ' + c.tips + ' in tips'); sfx('buy'); },
  delivery: () => G.deliv, title: () => U.title(C),
  hostStart() { if (G.state === 'play') return; const had = loadSave(); if (!had) newGame('own'); C.start(!had); },
  changedRemote() { rebuildTownSigns(); if (G.sim && G.sim.clientOf) { const k = branchKey(G.bid); if (k && S.branches[k]) G.sim.br = S.branches[k]; } },
  newDelivery(key) { const hs = ['h1', 'h2', 'h3', 'h4']; const br = S.branches[key]; const d = br.menu[(Math.random() * br.menu.length) | 0]; G.deliv = { dish: d, house: hs[(Math.random() * hs.length) | 0], key, bag: false, t0: S.time }; toast('📱 New delivery: ' + DISH[d].e + ' for ' + BLD[G.deliv.house].name); },
};
// ---------------- player ----------------
const P = { x: 0, z: 0, ry: 0, sp: 0, carry: null, model: null };
G.P = P;
function lookFromSave() { const L = S.look, o = OUTFITS.find((x) => x.id === L.outfit) || OUTFITS[0]; return { skin: L.skin, hair: L.hair, hairStyle: o.hat === 'helmet' || o.hat === 'dino' ? 'short' : L.hairStyle, shirt: L.shirt ? parseInt(L.shirt.slice(1), 16) : o.shirt, pants: o.pants, shoes: 0x222222, hat: o.hat, hatCol: o.hatCol, apron: o.apron, coat: o.coat, glasses: o.glasses, brows: 'happy' }; }
function restyle() { if (P.model) G.pModel.remove(P.model); P.model = makePerson(lookFromSave()); G.pModel.add(P.model); P.carryKey = null; Net.sendLook && Net.sendLook(); }
function setCarryModel() { const R = P.model && P.model.userData.rig; if (!R) return; const want = P.carry || null; if (P.carryKey === want) return; P.carryKey = want; R.hold.clear(); if (want) { const m = dishModel(want === 'dirty' ? 'dirty' : want, want === 'bag' ? 1.2 : 1.6); R.hold.add(m); } }
function placeOutside(bid) { const d = T.doors.find((x) => x.bid === bid); P.x = d.x + Math.sin(d.ry) * 1.2; P.z = d.z + Math.cos(d.ry) * 1.2; P.ry = d.ry; G.yaw = d.ry + PI; G.camD = null; G.snapCam = true; }
// ---------------- car ----------------
function respawnCar(near, atHome) { const def = CAR[S.car] || CAR.hatch; const old = G.carState; G.carState = newCarState(def);
  if (old && !atHome) { G.carState.x = old.x; G.carState.z = old.z; G.carState.ry = old.ry; } else { G.carState.x = -63; G.carState.z = -86.8; G.carState.ry = PI / 2; }
  if (near && G.where === 'town' && !atHome && !old) { G.carState.x = P.x + 3; G.carState.z = P.z; }
  if (near && G.bid === 'cars') { const d = T.doors.find((x) => x.bid === 'cars'); G.carState.x = d.x + 6; G.carState.z = d.z + 4.5; G.carState.ry = PI / 2; }
  if (G.carModel) E.scene.remove(G.carModel); G.carModel = makeCar(def.kind, def.col); E.scene.add(G.carModel); poseCar(G.carModel, G.carState, 0); G.carModel.visible = G.where === 'town'; }
// ---------------- hidden Golden Spatulas (10 collectibles, great in Explore mode) ----------------
function buildSpatulas() { G.spats = []; const b = MB(); const x = new XB(b); x.p('g', GP.cyl, 0x8b5a2b, 0, -0.45, 0, 0, 0, 0, 0.07, 0.7, 0.07); x.p('x', GP.cyl, 0xffd23f, 0, -0.08, 0, 0, 0, 0, 0.05, 0.12, 0.05);
  x.p('x', GP.rboxS, 0xffd23f, 0, 0.25, 0, 0, 0, 0, 0.5, 0.5, 0.06); for (let i = 0; i < 3; i++) x.p('x', GP.rboxS, 0xb8860b, -0.14 + i * 0.14, 0.3, 0.035, 0, 0, 0, 0.05, 0.32, 0.02); const proto = toGroup(b);
  proto.traverse((o) => { if (o.isMesh) { o.userData.shared = 1; if (o.material && o.material.emissive) { o.material = o.material.clone(); o.material.emissive.setHex(0xffb000); o.material.emissiveIntensity = 0.55; } } });
  const cand = []; for (const a of ROADS_) for (const c of ROADS_) for (const [sx, sz] of [[1, 1], [-1, -1], [1, -1], [-1, 1]]) cand.push([a + sx * 7.6, c + sz * 7.6]);
  let seed = 7; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; for (let i = cand.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [cand[i], cand[j]] = [cand[j], cand[i]]; }
  for (const [px, pz] of cand) { if (G.spats.length >= 10) break; if (collideTown(px, pz, 0.8).hit || G.spats.some((q) => Math.hypot(q.x - px, q.z - pz) < 25)) continue; const m = proto.clone(); m.scale.setScalar(1.7); m.position.set(px, 1.2, pz); E.scene.add(m); G.spats.push({ id: G.spats.length, x: px, z: pz, m }); } }
function stepSpatulas(dt) { if (!G.spats || !S) return; const got = S.spatulas || (S.spatulas = []); for (const sp of G.spats) { const have = got.includes(sp.id); sp.m.visible = !have && G.where === 'town'; if (have) continue;
    sp.m.rotation.y = G.t * 2; sp.m.position.y = 1.6 + Math.sin(G.t * 3 + sp.id) * 0.2; if (G.where === 'town' && Math.hypot(P.x - sp.x, P.z - sp.z) < (G.driving ? 2.6 : 1.6)) { got.push(sp.id); sfx('win'); burst('sparkle', sp.x, 1.4, sp.z, 18); burst('confetti', sp.x, 1.6, sp.z, 12);
      const bonus = S.mode === 'explore' ? 0 : 50; S.money += bonus; banner('✨ Golden Spatula ' + got.length + '/10!', got.length === 10 ? 'You found them ALL! Trophy unlocked 🏆' : (bonus ? '+$' + bonus + ' · ' : '') + 'They are hidden on street corners all over Eatsville'); if (got.length === 10) S.trophies++; persist(); } } }
// ---------------- town signs (owned lots, for-sale, grades) ----------------
function rebuildTownSigns() { G.signGrp.clear(); if (!S) return;
  for (const b of BUILDINGS) { if (b.lot) { const br = S.branches[b.lot]; G.signGrp.add(makeLotSign(b, br ? br.name.toUpperCase() : null, br ? b.col2 : 0, br ? 0 : (b.lot === 'A' && S.mode === 'worker' ? 800 : LOTS[b.lot].price)));
      if (br && br.grade) { const g = makeGrade(b, br.grade); if (g) G.signGrp.add(g); } }
    if (b.owner && S.rivals[b.owner].owned) { const br = S.branches[b.id]; if (br) { G.signGrp.add(makeLotSign(b, br.name.toUpperCase(), 0x14b8a6, 0)); } } } }
// ---------------- traffic + pedestrians ----------------
const LANES = [[[-90, -90], [90, -90], [90, 90], [-90, 90]], [[-30, -30], [-30, 30], [30, 30], [30, -30]], [[-90, -30], [90, -30], [90, 30], [-90, 30]]];
function lanePath(L, off) { // offset to the right-hand lane
  const pts = []; for (let i = 0; i < L.length; i++) { const a = L[i], b = L[(i + 1) % L.length]; const dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz); const nx = -dz / d, nz = dx / d; pts.push([a[0] - nx * off, a[1] - nz * off], [b[0] - nx * off, b[1] - nz * off]); } return pts; }
function setupTraffic() { if (G.trafficInit) return; G.trafficInit = true; G.traffic = []; const cols = [0x3fa7ff, 0x4ade80, 0xffc93c, 0xf472b6, 0xffffff, 0xff7a3d, 0x94a3b8, 0x22d3ee]; const kinds = ['hatch', 'hatch', 'pickup', 'van', 'sport', 'hatch', 'pickup', 'hatch'];
  for (let i = 0; i < 8; i++) { const path = lanePath(LANES[i % 3], 3); const m = makeCar(kinds[i], cols[i]); E.scene.add(m); G.traffic.push({ m, path, seg: (i * 3) % path.length, u: (i * 0.37) % 1, v: 9, st: { x: 0, z: 0, ry: 0, v: 9, steer: 0, spin: 0 } }); }
  G.peds = []; const r = rng(42); for (let i = 0; i < 14; i++) { const bx = [-60, 0, 60][i % 3], bz = [-60, 0, 60][((i / 3) | 0) % 3]; const h = 30 - 6 - 1.6; const ring = [[bx - h, bz - h], [bx + h, bz - h], [bx + h, bz + h], [bx - h, bz + h]]; if (bx === 0 && bz === 0) ring.forEach((p) => { p[0] *= 0.55; p[1] *= 0.55; });
    const m = makePerson(randomLook(r)); E.scene.add(m); G.peds.push({ m, ring, seg: i % 4, u: r(), dir: r() < 0.5 ? 1 : -1, sp: 1.2 + r() * 0.5 }); } }
function stepTraffic(dt, vis) {
  if (!G.traffic) return; const pc = G.driving ? G.carState : P;
  for (const c of G.traffic) { const a = c.path[c.seg], b = c.path[(c.seg + 1) % c.path.length]; const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
    // brake for the player
    const fx = c.st.x + Math.sin(c.st.ry) * 5, fz = c.st.z + Math.cos(c.st.ry) * 5; const block = Math.hypot(fx - pc.x, fz - pc.z) < 4.5 || G.traffic.some((o) => o !== c && Math.hypot(fx - o.st.x, fz - o.st.z) < 3.5);
    c.v = damp(c.v, block ? 0 : 10, block ? 6 : 1.5, dt); c.u += c.v * dt / L; if (c.u >= 1) { c.u -= 1; c.seg = (c.seg + 1) % c.path.length; }
    const x = a[0] + dx * c.u, z = a[1] + dz * c.u; const want = Math.atan2(dx, dz); c.st.ry += wrapAng(want - c.st.ry) * Math.min(1, dt * 5); c.st.x = x; c.st.z = z; c.st.v = c.v; c.st.spin += c.v * dt / 0.42;
    if (vis(x, 1, z, 3)) { poseCar(c.m, c.st, G.t); c.m.visible = true; } else c.m.visible = false;
    if (G.driving) { const d = Math.hypot(G.carState.x - x, G.carState.z - z); if (d < 2.6) { const nx = (G.carState.x - x) / d, nz = (G.carState.z - z) / d; G.carState.x = x + nx * 2.6; G.carState.z = z + nz * 2.6; if (Math.abs(G.carState.v) > 4) { sfx('bump'); } G.carState.v *= 0.4; } } }
  for (const p of G.peds) { const a = p.ring[p.seg], b = p.ring[(p.seg + p.dir + 4) % 4]; const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    const x0 = a[0] + dx * p.u, z0 = a[1] + dz * p.u; const near = G.driving && Math.hypot(G.carState.x - x0, G.carState.z - z0) < 3; const sp = near ? 0 : p.sp;
    p.u += sp * dt / L; if (p.u >= 1) { p.u = 0; p.seg = (p.seg + p.dir + 4) % 4; } p.m.position.set(x0, 0.18, z0); p.m.rotation.y = Math.atan2(dx, dz);
    if (vis(x0, 1, z0, 1.5)) { p.m.visible = true; animPerson(p.m, dt, { speed: sp, wave: near }); } else p.m.visible = false; } }
function showTown(on) { T.grp.visible = on; G.signGrp.visible = on; if (G.carModel) G.carModel.visible = on; if (G.traffic) { G.traffic.forEach((c) => c.m.visible = on); G.peds.forEach((p) => p.m.visible = on); } }
// ---------------- delivery arrow ----------------
function makeArrow() { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: 0xff4fa0, emissive: 0xff2f90, emissiveIntensity: 0.6, roughness: 0.3 }); const c = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.4, 24), m); c.rotation.x = PI; c.position.y = 0; const s = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.2, 20), m); s.position.y = 1.2; g.add(c, s); return g; }
// ---------------- rooms ----------------
function enterBuilding(bid) {
  const b = BLD[bid]; sfx('door'); leaveRoom(false); G.where = 'room'; G.bid = bid; showTown(false);
  G.room = buildInterior(bid, { branch: branchFor, state: S }); E.scene.add(G.room.grp); env('room');
  P.x = IX + G.room.door.x; P.z = G.room.door.z - 0.6; P.ry = PI; G.yaw = PI;
  if (b.kind === 'rest') { const br = branchFor(bid); if (!br.vacant) { G.sim = Net.isClient() ? null : new RestSim(bid, br, G.room, { career: br.rival && S.career.shift });
      if (br.rival && G.sim) { G.sim.staff = [{ id: 'r1', role: 'cook', name: 'Crew', skill: 3, x: -3, z: -5 }, { id: 'r2', role: 'cook', name: 'Crew', skill: 2, x: 2, z: -5 }, { id: 'r3', role: 'waiter', name: 'Crew', skill: 3, x: 3, z: 6 }]; if (S.career.shift) C.clockIn(); }
      if (Net.isClient()) G.sim = Net.clientSim(bid, br, G.room); } }
  G.vis = { cust: new Map(), staff: new Map(), mess: new Map(), st: {} };
  playMusic(b.kind === 'rest' ? 'kitchen' : b.kind === 'home' ? 'living' : b.kind === 'ratita' ? 'hq' : 'garden');
  if (b.kind === 'rest' && !S.seen['tip_' + (branchFor(bid).rival ? 'r' : 'o')]) { S.seen['tip_' + (branchFor(bid).rival ? 'r' : 'o')] = 1; const br = branchFor(bid); setTimeout(() => br.rival ? banner('🍔 ' + br.name, S.mode === 'worker' ? 'Talk to Manager Mo (right side) to clock in' : 'This is the competition. Look around!') : br.vacant ? null : banner('🏪 Your restaurant!', 'Customers show what they want. Cook it at the machine, take it, serve it!'), 400); }
  Net.where && Net.where();
}
function leaveRoom(toTown) {
  if (G.room) { E.scene.remove(G.room.grp); disposeRoom(G.room); }
  if (G.vis) { for (const v of G.vis.cust.values()) { E.scene.remove(v.m); disposeModel(v.m); if (v.eat) E.scene.remove(v.eat); } for (const g of G.vis.mess.values()) { E.scene.remove(g); disposeModel(g); } for (const v of G.vis.staff.values()) E.scene.remove(v.m); if (G.vis.insp) E.scene.remove(G.vis.insp); if (G.vis.snow) E.scene.remove(G.vis.snow); }
  if (G.sim && G.sim.career && S.career.shift) { /* keep shift */ }
  G.room = null; G.sim = null; G.vis = null; clearFx(); clearFloats();
  if (toTown) { G.where = 'town'; showTown(true); env(phase()); }
}
function disposeRoom(R) { R.grp.traverse((o) => { if (o.isMesh && o.geometry && !o.userData.shared) o.geometry.dispose(); }); }
function disposeModel(m) { m.traverse((o) => { if (o.isMesh && o.geometry && !o.userData.shared) o.geometry.dispose(); }); }
function exitBuilding() { const bid = G.bid; sfx('door'); leaveRoom(true); G.bid = null; placeOutside(bid); playMusic('kitchen'); Net.where && Net.where(); }
function rebuildRoom() { if (G.where !== 'room') return; const bid = G.bid, px = P.x, pz = P.z; const sim = G.sim; E.scene.remove(G.room.grp); disposeRoom(G.room);
  G.room = buildInterior(bid, { branch: branchFor, state: S }); E.scene.add(G.room.grp);
  if (sim) { const br = branchFor(bid); const ns = new RestSim(bid, br, G.room, { career: sim.career }); ns.cust = sim.cust.filter((c) => ns.seats[c.seat]); for (const c of ns.cust) ns.seats[c.seat].cust = c.id; for (const k in sim.st) if (ns.st[k]) Object.assign(ns.st[k], { cook: sim.st[k].cook, ready: sim.st[k].ready, broken: sim.st[k].broken }); ns.mess = sim.mess; ns.carry = sim.carry; ns.clean = sim.clean; ns.insp = sim.insp; ns.t = sim.t; if (br.rival) ns.staff = sim.staff; G.sim = ns;
    for (const v of G.vis.staff.values()) E.scene.remove(v.m); G.vis.staff.clear(); }
  P.x = px; P.z = pz; }
// ---------------- interactions ----------------
function nearestDoor() { let best = null, bd = 2.4; for (const d of T.doors) { const dd = Math.hypot(d.x - P.x, d.z - P.z); if (dd < bd) { bd = dd; best = d; } } return best; }
function roomSpot() { if (!G.room) return null; const lx = P.x - IX, lz = P.z; let best = null, bd = 9; for (const s of G.room.spots) { const d = Math.hypot(s.x - lx, s.z - lz); if (d < s.r && d < bd) { bd = d; best = s; } } return best; }
function currentAction() {
  if (G.where === 'town') { if (G.driving) return null; const d = nearestDoor(); if (d) return { label: 'Enter ' + titleCase(d.name), a: 'enter', d }; return null; }
  const lx = P.x - IX, lz = P.z;
  if (G.sim || (Net.isClient() && G.room.kind === 'rest')) { const br = branchFor(G.bid); const canWork = !br.rival || (S.career.shift);
    if (canWork && G.sim) { if (G.deliv && P.carry === G.deliv.dish && !G.deliv.bag && branchKey(G.bid) === G.deliv.key && Math.hypot(lx - 5, lz - (REST.counterZ + 0.9)) < 1.5) return { label: 'Bag delivery 🛍️', a: 'bag' };
      const q = Net.isClient() ? Net.query(lx, lz) : G.sim.query(Net.pid(), lx, lz); if (q && q.a !== 'none') return { label: q.label, a: 'sim', q }; if (q && q.a === 'none') { const s = roomSpot(); if (!s) return { label: q.label, a: 'noop' }; } } }
  const s = roomSpot(); if (s) { if (s.kind === 'family' && P.carry === 'bag' && G.deliv && G.deliv.house === G.bid) return { label: 'Deliver food 🛍️', a: 'deliver' }; return { label: s.label, a: 'spot', s }; }
  return null;
}
const titleCase = (s) => s.split(' ').map((w) => w[0] + w.slice(1).toLowerCase()).join(' ');
function doAction(A) {
  if (!A) return; const lx = P.x - IX, lz = P.z;
  if (A.a === 'enter') { if (G.driving) return; enterBuilding(A.d.bid); return; }
  if (A.a === 'exitCar') { exitCar(); return; }
  if (A.a === 'bag') { P.carry = 'bag'; G.deliv.bag = true; sfx('pop'); toast('🛍️ Bagged! Drive it to ' + BLD[G.deliv.house].name); return; }
  if (A.a === 'deliver') { const mins = S.time - G.deliv.t0; const tip = Math.round((15 + Math.max(0, 60 - mins * 0.5)) * ((CAR[S.car] || {}).deliv || 1)); const base = DISH[G.deliv.dish].price; if (!Net.earn(base + tip, 'deliv')) { S.money += base + tip; S.stats.earned += base + tip; S.deliveries++; } P.carry = null; G.deliv = null; sfx('buy'); burst('confetti', P.x, 1.5, P.z); floatText('+$' + (base + tip), P.x, 2.2, P.z, 'cash'); toast('🛵 Delivered! +$' + (base + tip) + ' (tip $' + tip + ')'); persist(); return; }
  if (A.a === 'sim') { const r = Net.isClient() ? Net.act(lx, lz) : G.sim.act(Net.pid(), lx, lz); afterSim(r, A.q); return; }
  if (A.a === 'spot') spotAction(A.s);
}
function afterSim(r, q) { if (!r) return; if (r === 'fix' && !q) { sfx('hit'); burst('sparkle', P.x, 1.2, P.z, 4); return; } const s = { serve: 'heart', cook: 'click', take: 'pop', fix: 'hit', clean: 'splat', toss: 'land', wash: 'splash', hands: 'splash', deny: 'deny' }[r]; if (s) sfx(s);
  if (r === 'serve') burst('heart', P.x, 1.6, P.z); if (r === 'clean' || r === 'wash' || r === 'hands') burst('clean', P.x, 0.6, P.z); if (r === 'fix') burst('sparkle', IX + q.s.x, 1.2, q.s.z, 4); }
function spotAction(s) {
  if (Net.isClient() && ['office', 'buyLot', 'bank', 'mayor', 'hire', 'stock', 'ratitaShop', 'carShop', 'homeDecor', 'fines', 'quiz', 'bed', 'garage'].includes(s.kind)) { toast('🌐 Your host runs the company. Ask them to do that!'); return; }
  const br = G.room.kind === 'rest' ? branchFor(G.bid) : null; const key = br && branchKey(G.bid);
  switch (s.kind) {
    case 'exit': exitBuilding(); break;
    case 'office': if (br.rival) { U.bossTalk(C, br); } else U.office(C, key); break;
    case 'boss': U.bossTalk(C, br); break;
    case 'buyLot': U.buyLotPanel(C, BLD[G.bid].lot); break;
    case 'bed': if (S.time < 18 * 60 && S.time >= DAY_START + 30) { U.panel('🛏️ NAP?', '<p class="sub">It\'s still daytime! Sleep until tomorrow morning anyway?</p><button class="go" data-a="y">😴 Sleep till morning</button><button class="mbtn2" data-a="n">Not yet</button>', (a) => { if (a === 'y') sleep(); else U.close(); }); } else sleep(); break;
    case 'wardrobe': U.outfits(C, true); break;
    case 'tv': U.tv(C); break;
    case 'fridge': sfx('pop'); toast('🧀 Yum! A midnight-snack-at-any-hour.'); burst('heart', P.x, 1.6, P.z); break;
    case 'empire': U.empire(C); break;
    case 'trophies': U.trophies(C); break;
    case 'garage': U.garage(C); break;
    case 'homeDecor': U.homeDecor(C); break;
    case 'pet': sfx('bark'); burst('heart', IX + s.x, 1, s.z, 8); toast('🐶 Candy wags so hard she spins!'); break;
    case 'family': { const lines = ['"Your food smells AMAZING from here!"', '"We heard Mega Munch\'s mascot got stuck again."', '"Have you tried the Gazette? They print EVERYTHING."', '"Inspector Grumbleton once frowned at a salad for an hour."', '"Delivery! Do you do delivery?"']; toast('🏠 ' + lines[(Math.random() * lines.length) | 0]); sfx('squeak'); } break;
    case 'bank': U.bank(C); break; case 'mayor': U.mayor(C); break; case 'hire': U.hire(C); break;
    case 'news': U.gazette(C, 'news'); break; case 'ads': U.gazette(C, 'ads'); break;
    case 'stock': U.market(C); break; case 'fines': U.health(C); break; case 'quiz': U.health(C); break;
    case 'ratitaShop': U.ratitaShop(C, G.lastKey); break; case 'carShop': U.carShop(C); break; case 'outfits': U.outfits(C, false); break;
    default: break;
  }
}
function enterCar() { G.driving = true; P.carry && P.carry !== 'bag' && (P.carry = P.carry); sfx('door'); toast('🚗 Steer with the stick · the 🚗 button gets you out'); }
function exitCar() { G.driving = false; const c = G.carState; let x = c.x - Math.cos(c.ry) * 2.2, z = c.z + Math.sin(c.ry) * 2.2; const r = collideTown(x, z, 0.4); P.x = r.x; P.z = r.z; P.ry = c.ry; sfx('door'); }
// ---------------- day cycle ----------------
function sleep() { U.close(); const rep = newDay(); fadeTo(() => { U.dayReport(C, rep, () => { banner('☀️ Day ' + S.day, S.today && S.today.insp ? 'Psst: the Health Dept is out inspecting today…' : 'A brand new day in Eatsville!'); }); }); G.lastHour = Math.floor(S.time / 60); rebuildTownSigns(); }
function fadeTo(cb) { const f = $('fade'); f.classList.add('on'); setTimeout(() => { cb(); setTimeout(() => f.classList.remove('on'), 300); }, 450); }
function clock(dt) {
  if (U.UI.open && !Net.active()) return; S.time += dt * MIN_PER_SEC;
  const h = Math.floor(S.time / 60); if (h !== G.lastHour) { G.lastHour = h; hourly(); }
  if (S.time >= BEDTIME && !G.warnedBed) { G.warnedBed = true; banner('🌙 It\'s getting late!', 'Head home and sleep in your bed (or you\'ll doze off at 1 AM)'); }
  if (S.time >= 25 * 60) { G.warnedBed = false; const rep = newDay(); leaveRoom(false); G.where = 'town'; enterBuilding('home'); P.x = IX - (G.room.W / 2) + 1.6; P.z = -2.6; fadeTo(() => U.dayReport(C, rep, () => banner('😴 You dozed off…', 'and woke up at home. Day ' + S.day))); G.lastHour = Math.floor(S.time / 60); }
  if (S.time < BEDTIME) G.warnedBed = false;
}
function hourly() {
  if (Net.isClient()) return; const liveKey = G.sim && branchKey(G.bid);
  for (const [k, br] of Object.entries(S.branches)) if (k !== liveKey && isOpen()) autopilotHour(k, br);
  const td = S.today; if (td && td.insp && !td.insp.done && S.time >= td.insp.at) { td.insp.done = true; const br = S.branches[td.insp.key]; if (br) { if (liveKey === td.insp.key && G.sim) G.sim.startInspection(); else offsiteInspection(td.insp.key, br); } }
  if (td && td.critic && !td.critic.done && S.time >= td.critic.at) { if (liveKey === td.critic.key && G.sim) { if (G.sim.spawnSpecial('critic')) td.critic.done = true; } else if (S.time > td.critic.at + 120) { td.critic.done = true; const br = S.branches[td.critic.key]; if (br) { const stars = Math.max(1, Math.min(5, Math.round(br.rep / 22 + (br.sanitation > 75 ? 1 : 0)))); S.reviews.unshift({ day: S.day, name: br.name, stars, text: stars >= 4 ? 'Ate here while the owner was out. Still lovely!' : 'The owner was away and it showed.' }); br.rep += (stars - 3) * 2; EV.push({ t: 'review', stars, text: 'Gourmet Gustavo visited ' + br.name + ' while you were out.', name: br.name }); } } }
  if (!G.deliv && isOpen() && S.today && G.sim && !G.sim.rival && branchKey(G.bid) && Math.random() < (S.today.deliv ? 0.3 : 0.6)) { S.today.deliv = (S.today.deliv || 0) + 1; C.newDelivery(branchKey(G.bid)); banner('📱 RING RING! Delivery order', 'Cook ' + DISH[G.deliv.dish].e + ', bag it at the register, then drive it over. Fast = big tips!'); sfx('ding'); }
  rebuildTownSigns(); persist(); Net.pushState && Net.pushState();
}
// ---------------- events -> UI ----------------
function banner(m, s, bad) { const b = $('banner'); b.innerHTML = `<b>${m}</b>${s ? '<small>' + s + '</small>' : ''}`; b.className = 'show' + (bad ? ' bad' : ''); clearTimeout(G.bannerT); G.bannerT = setTimeout(() => b.className = '', 3800); }
C.banner = banner;
function drainEvents() { while (EV.length) { const e = EV.shift(); Net.relayEvent && Net.relayEvent(e); showEvent(e); } }
export function showEvent(e) {
  if (e.t === 'toast') toast(e.m, e.bad); if (e.t === 'quip') toast(e.m); if (e.t === 'banner') { banner(e.m, e.s, e.bad); sfx(e.bad ? 'boss' : 'check'); }
  if (e.t === 'grade') { banner('🕵️ GRADE ' + e.g + (e.fine ? ' · $' + e.fine + ' fine' : ''), (e.offsite ? e.name + ': ' : '') + e.line, e.g === 'C' || e.g === 'F'); sfx(e.g === 'A' ? 'win' : e.g === 'F' ? 'hurt' : 'check'); rebuildTownSigns(); }
  if (e.t === 'review') { banner('📰 ' + '⭐'.repeat(e.stars) + ' review!', '"' + e.text + '"'); sfx(e.stars >= 4 ? 'win' : 'deny'); }
  if (e.t === 'promo') { banner('🎉 PROMOTED to ' + e.rank + '!', 'Bigger wages per shift'); sfx('win'); burst('confetti', P.x, 2, P.z); }
  if (e.t === 'emperor') { banner('👑 FOOD EMPEROR OF EATSVILLE!', 'Every restaurant in town is yours. The crown outfit is in your wardrobe!'); sfx('win'); burst('confetti', P.x, 2, P.z, 60); }
}
// ---------------- live sim visuals ----------------
function syncSim(dt) {
  const sim = G.sim, V = G.vis; if (!sim || !V) return; const vis = makeVisTest(E.camera, E.sun.position);
  // customers
  const seen = new Set();
  for (const c of sim.cust) { seen.add(c.id); let v = V.cust.get(c.id);
    if (!v) { const look = c.critic ? NPCLOOK.critic : randomLook(rng(c.seed)); const m = makePerson(look); const bub = makeBubble(); m.add(bub.g); E.scene.add(m); v = { m, bub, dish: null, eat: null }; V.cust.set(c.id, v); }
    v.m.position.set(IX + c.x, 0, c.z); v.m.rotation.y = c.ry; const seated = c.st === 'wait' || c.st === 'eat';
    if (vis(IX + c.x, 1, c.z, 1.2)) animPerson(v.m, dt, { speed: c.sp || 0, sit: seated, eat: c.st === 'eat', angry: c.angry && c.st === 'leave' });
    v.bub.g.visible = c.st === 'wait' || c.st === 'walk'; if (v.bub.g.visible) { if (v.bub.dishId !== c.dish) { v.bub.holder.clear(); v.bub.holder.add(dishModel(c.dish, 1.4)); v.bub.dishId = c.dish; } const mood = c.mood ?? 1; v.bub.ring.material.color.setHSL(mood * 0.33, 0.9, 0.5); v.bub.bar.scale.x = Math.max(0.02, mood); v.bub.bar.position.x = -0.32 * (1 - mood); v.bub.g.position.y = (seated ? 1.95 : 2.35) + Math.sin(G.t * 3 + c.id) * 0.04; v.bub.g.rotation.y = -c.ry + (G.where === 'room' ? 0 : 0); v.bub.crit.visible = !!c.critic; }
    if (c.st === 'eat') { if (!v.eat) { v.eat = dishModel(c.dish, 1.3); E.scene.add(v.eat); } const tx = c.x + Math.sin(c.ry) * 0.55, tz = c.z + Math.cos(c.ry) * 0.55; v.eat.position.set(IX + tx, 0.83, tz); } else if (v.eat) { E.scene.remove(v.eat); v.eat = null; } }
  for (const [id, v] of V.cust) if (!seen.has(id)) { E.scene.remove(v.m); disposeModel(v.m); if (v.eat) E.scene.remove(v.eat); V.cust.delete(id); }
  // staff
  const fs = new Set(); for (const f of sim.staff) { fs.add(f.id); let v = V.staff.get(f.id); if (!v) { v = { m: staffModel(f) }; E.scene.add(v.m); V.staff.set(f.id, v); }
    v.m.position.set(IX + f.x, 0, f.z); v.m.rotation.y = f.ry || 0; animAny(v.m, dt, f.sp || 0, { work: (f.work = Math.max(0, (f.work || 0) - dt)) > 0, carry: !!f.carry }); const R = v.m.userData.rig; if (R && v.ck !== f.carry) { v.ck = f.carry; R.hold.clear(); if (f.carry) R.hold.add(dishModel(f.carry, 1.6)); } }
  for (const [id, v] of V.staff) if (!fs.has(id)) { E.scene.remove(v.m); V.staff.delete(id); }
  // inspector + snowie
  if (sim.insp) { if (!V.insp) { V.insp = makePerson(NPCLOOK.inspector); E.scene.add(V.insp); } V.insp.position.set(IX + sim.insp.x, 0, sim.insp.z); V.insp.rotation.y = sim.insp.ry; animPerson(V.insp, dt, { speed: sim.insp.sp || (sim.insp.wait > 0 ? 0 : 1.1), angry: true }); } else if (V.insp) { E.scene.remove(V.insp); V.insp = null; }
  if (sim.snowie) { if (!V.snow) { V.snow = ratNPC('snowie'); V.snow.scale.setScalar(1.6); E.scene.add(V.snow); } V.snow.position.set(IX + sim.snowie.x, 0, sim.snowie.z); V.snow.rotation.y = sim.snowie.ry || 0; animRat(V.snow.userData.ratRig, dt, { speed: sim.snowie.phase === 'fix' ? 0 : 4 }); if (sim.snowie.phase === 'fix' && Math.random() < 0.2) burst('sparkle', V.snow.position.x, 1, V.snow.position.z, 2); } else if (V.snow) { E.scene.remove(V.snow); V.snow = null; }
  // messes
  const ms = new Set(); for (const m of sim.mess) { ms.add(m.id); if (!V.mess.has(m.id)) { const g = messModel(m); g.position.set(IX + m.x, 0, m.z); E.scene.add(g); V.mess.set(m.id, g); } }
  for (const [id, g] of V.mess) if (!ms.has(id)) { E.scene.remove(g); V.mess.delete(id); }
  // stations: dish on top, progress bar, malfunction gags
  for (const s of Object.values(sim.st)) { let v = V.st[s.id]; if (!v) { v = V.st[s.id] = { g: new THREE.Group(), key: null, bar: makeBar() }; v.g.position.set(IX + s.x, 1.0, s.z - 1.0); v.bar.position.set(IX + s.x, 2.25, s.z - 0.6); E.scene.add(v.g, v.bar); G.room.grp.add(v.g, v.bar); }
    const want = s.ready || (s.cook ? s.cook.dish : null); if (v.key !== want) { v.key = want; v.g.clear(); if (want) v.g.add(dishModel(want, 1.5)); }
    v.g.position.y = 1.0 + (s.ready ? Math.sin(G.t * 5) * 0.03 + 0.05 : 0); v.g.rotation.y = s.ready ? G.t : 0;
    v.bar.visible = !!s.cook || !!s.broken; if (s.cook) { const k = Math.min(1, s.cook.t / s.cook.T); v.bar.userData.fill.scale.x = Math.max(0.02, k); v.bar.userData.fill.position.x = -0.5 * (1 - k); v.bar.userData.fill.material.color.set(0x4ade80); if (Math.random() < dt * 4) burst('steam', IX + s.x, 1.3, s.z - 1); }
    if (s.broken) { const k = s.fixN / 5; v.bar.userData.fill.scale.x = Math.max(0.02, k); v.bar.userData.fill.position.x = -0.5 * (1 - k); v.bar.userData.fill.material.color.set(0xfacc15); gag(s, dt); }
    if (s.ready === 'burnt' && Math.random() < dt * 3) burst('smoke', IX + s.x, 1.3, s.z - 1);
    // station shake while broken (the merged room mesh can't move, so the "gag" is all particles + the dish hopping)
    if (s.broken) v.g.position.y = 1.1 + Math.abs(Math.sin(G.t * 12)) * 0.3; }
  if (!Net.isClient()) for (const f of sim.fx.splice(0)) { const x = IX + f.x; if (f.k === 'cash') { burst('cash', x, 1.4, f.z); floatText('+$' + f.v, x, 2.2, f.z, 'cash'); sfx('coin'); } if (f.k === 'ding') { sfx('ding'); burst('sparkle', x, 1.3, f.z - 1, 5); } if (f.k === 'smoke') burst('smoke', x, 1.3, f.z - 1, 8); if (f.k === 'heart') burst('heart', x, 1.8, f.z); if (f.k === 'angry') burst('angry', x, 2, f.z); if (f.k === 'fixed') burst('sparkle', x, 1.4, f.z - 1, 14); Net.relayFx && Net.relayFx(f); }
}
function gag(s, dt) { const x = IX + s.x, z = s.z - 1; const k = { grill: 'disco', fryer: 'fries', drinks: 'soda', oven: 'notes', prep: 'chop', freezer: 'snow', stove: 'bubble' }[s.id]; if (Math.random() < dt * 8) burst(k, x, 1.4, z); }
function makeBubble() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), MATS.g); b.scale.set(0.42, 0.36, 0.2); b.material = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, clearcoat: 0.6 }); g.add(b);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 12), b.material); tail.rotation.x = PI; tail.position.set(0, -0.38, 0); g.add(tail);
  const holder = new THREE.Group(); holder.position.set(0, -0.08, 0.12); g.add(holder);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.035, 10, 40), new THREE.MeshBasicMaterial({ color: 0x4ade80, toneMapped: false })); ring.scale.set(1, 0.86, 1); g.add(ring);
  const bg = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.07, 0.04), new THREE.MeshStandardMaterial({ color: 0x1f2937 })); bg.position.set(0, -0.52, 0); g.add(bg);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.08, 0.05), ring.material); bar.position.set(0, -0.52, 0.01); g.add(bar);
  const crit = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.03, 8, 40), new THREE.MeshBasicMaterial({ color: 0xfacc15, toneMapped: false })); g.add(crit);
  return { g, holder, ring, bar, crit }; }
function makeBar() { const g = new THREE.Group(); const bg = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.14, 0.06), new THREE.MeshStandardMaterial({ color: 0x1f2937 })); const f = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.08), new THREE.MeshBasicMaterial({ color: 0x4ade80, toneMapped: false })); g.add(bg, f); g.userData.fill = f; return g; }
const messGeo = {};
function messModel(m) { if (m.kind === 'plate') { const g = dishModel('dirty', 1.3); g.position.y = 0.82; const w = new THREE.Group(); w.add(g); return w; }
  const g = new THREE.Group(); if (m.kind === 'spill') { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.03, 28), new THREE.MeshPhysicalMaterial({ color: [0x7dd3fc, 0xc2853f, 0xff7ab8][m.id % 3], roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85 })); s.scale.set(1, 1, 0.7 + (m.id % 5) * 0.08); s.position.y = 0.025; g.add(s); for (let i = 0; i < 3; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), s.material); d.scale.y = 0.2; d.position.set(Math.cos(i * 2) * 0.6, 0.02, Math.sin(i * 2) * 0.5); g.add(d); } }
  else { for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 1), MATS.m); b.position.set((i - 1) * 0.22, 0.1, (i % 2) * 0.15); b.castShadow = true; g.add(b); } const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.18, 16), new THREE.MeshStandardMaterial({ color: 0xef4444 })); c.rotation.z = PI / 2; c.position.set(0.1, 0.07, -0.2); g.add(c); }
  return g; }
function staffModel(f) { if (f.cameo === 'torty') { const r = makeMartina(); r.root.scale.setScalar(0.38); r.root.userData.mart = r; return r.root; } if (f.cameo === 'pirat') { const m = ratNPC('pirat'); m.scale.setScalar(1.6); return m; } if (f.cameo === 'candy') { const r = makeCandy(); r.root.scale.setScalar(0.55); r.root.userData.candyRig = r; return r.root; }
  const L = { cook: { shirt: 0xffffff, hat: 'chef', apron: 0xf1f5f9 }, waiter: { shirt: 0xffffff, coat: 0x111827, bowtie: 0xdc2626 }, janitor: { shirt: 0x3b82f6, hat: 'cap', hatCol: 0x3b82f6 }, manager: { shirt: 0xffffff, coat: 0x334155, tie: 0x14b8a6 } }[f.role] || {};
  const r = rng(f.name.length * 31 + f.id.length); return makePerson(Object.assign(randomLook(r), { kid: false, glasses: false }, L, f.role === 'cook' && G.sim && G.sim.rival ? { apron: G.sim.br.brand.trim, hat: 'cap', hatCol: G.sim.br.brand.seat } : {})); }
function animAny(m, dt, sp, st) { if (m.userData.rig) animPerson(m, dt, Object.assign({ speed: sp }, st)); else if (m.userData.ratRig) animRat(m.userData.ratRig, dt, { speed: sp * 2 }); else if (m.userData.mart) animMartina(m.userData.mart, dt, sp); else if (m.userData.candyRig) animCandy(m.userData.candyRig, dt, sp * 2, 'happy'); }
// ---------------- frame ----------------
const _fwd = new THREE.Vector3();
function frame(dt) {
  G.t += dt; trackFps(dt);
  if (G.state === 'title') { const a = G.t * 0.05; E.camera.position.set(Math.cos(a) * 70, 34, Math.sin(a) * 70 + 10); E.camera.lookAt(0, 4, 10); followShadow(0, 0, 0); animTown(G.t); render(dt); return; }
  if (G.state !== 'play') { render(dt); return; }
  if (!Net.isClient()) clock(dt); else if (Net.stateTime != null) S.time = Net.stateTime;
  // input
  if (edge('menu')) U.UI.open ? U.close() : U.pauseMenu(C);
  const mv = U.UI.open ? { x: 0, y: 0 } : readMove(); const A = U.UI.open ? null : currentAction();
  { // target ring under whatever the action button will use
    if (!G.ring) { G.ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.07, 10, 40), new THREE.MeshBasicMaterial({ color: 0xffe14d, transparent: true, opacity: 0.85, depthWrite: false })); G.ring.rotation.x = -PI / 2; E.scene.add(G.ring); }
    const q = A && A.q; const tg = q && (q.s || q.c || q.m); const sp = A && A.a === 'spot' && A.s; const t = tg || sp; G.ring.visible = !!t && G.where === 'room';
    if (G.ring.visible) { G.ring.position.set(IX + t.x, 0.06, t.z + (q && q.s ? 0.35 : 0)); const k = 1 + Math.sin(G.t * 6) * 0.08; G.ring.scale.set(k, k, k); G.ring.material.color.setHex(q && q.a === 'fix' ? 0xff4f6d : 0xffe14d); } }
  const ab = $('bAct'); ab.classList.toggle('hidden', !!G.driving); if (A) { ab.classList.remove('dim'); if (ab.dataset.l !== A.label) { ab.dataset.l = A.label; ab.innerHTML = '<span>' + A.label + '</span>'; } } else { ab.classList.add('dim'); if (ab.dataset.l !== '') { ab.dataset.l = ''; ab.innerHTML = '<span>✋</span>'; } }
  if (edge('act') && !U.UI.open) doAction(A);
  // car button
  const carNear = G.where === 'town' && !G.driving && G.carState && Math.hypot(G.carState.x - P.x, G.carState.z - P.z) < 3.4;
  $('bCar').classList.toggle('hidden', !(carNear || G.driving)); $('bCar').innerHTML = G.driving ? '🚶' : '🚗';
  if (edge('car')) { if (G.driving) exitCar(); else if (carNear) enterCar(); }
  const broken = G.sim && Object.values(G.sim.st).some((s) => s.broken) && !G.sim.snowie && !G.sim.rival; $('bCall').classList.toggle('hidden', !broken);
  if (edge('call') && broken) { if (S.money >= 25 || S.mode === 'explore') { if (Net.isClient() ? Net.callSnowie() : G.sim.callSnowie()) { if (S.mode !== 'explore') S.money -= 25; sfx('click'); toast('📞 Snowie is zooming over on her hover-scooter! (-$25)'); } } else toast('Not enough money to call Snowie', true); }
  if (IN.camDX) { G.yaw -= IN.camDX * 0.006; G.camT = 2.5; IN.camDX = 0; } G.camT -= dt;
  // movement
  if (G.where === 'town') stepTown(dt, mv); else stepRoom(dt, mv);
  // sim
  if (G.sim) { if (!Net.isClient()) { G.sim.step(dt); if (G.sim.br && !G.sim.rival && G.sim.br.owned) { const target = clamp(100 - G.sim.mess.length * 6 - Object.values(G.sim.st).filter((s) => s.broken).length * 8, 0, 100); G.sim.br.sanitation += (target - G.sim.br.sanitation) * Math.min(1, dt * 0.05); } } else G.sim.smooth(dt); syncSim(dt); P.carry = G.sim.carry[Net.pid()] || (P.carry === 'bag' ? 'bag' : null); }
  setCarryModel(); drainEvents(); Net.tick && Net.tick(dt);
  // visuals
  stepFx(dt); stepFloats(dt, E.camera, E.w, E.h); hud(); MATS.n.emissiveIntensity = G.where === 'town' && phase() !== 'day' ? (phase() === 'night' ? 1.4 : 0.6) : 0.15;
  if (G.where === 'town') { env(phase()); animTown(G.t); }
  render(dt);
}
function stepTown(dt, mv) {
  const vis = makeVisTest(E.camera, E.sun.position);
  if (G.driving) { const c = G.carState; stepCar(c, mv, dt, G.yaw, collideTown); if (c.bump > 6) { sfx('bump'); } poseCar(G.carModel, c, G.t); P.x = c.x; P.z = c.z; P.model.visible = false;
    if (G.camT <= 0 && Math.abs(c.v) > 2) G.yaw += wrapAng(c.ry + (c.v < 0 ? PI : 0) - G.yaw) * Math.min(1, dt * 2.2); }
  else { P.model.visible = true; movePlayer(dt, mv, (x, z, r) => collideTown(x, z, r)); }
  P.model.position.set(P.x, G.driving ? 0 : 0.18 * onWalk(P.x, P.z), P.z); P.model.rotation.y = P.ry; animPerson(P.model, dt, { speed: P.sp, carry: !!P.carry });
  stepSpatulas(dt); stepTraffic(dt, vis); decorCull(T, E.camera, E.sun.position, E.scene.fog ? E.scene.fog.density : 0);
  // camera
  const dist = G.driving ? 12 : 8, h = G.driving ? 5.5 : 4.2; _fwd.set(Math.sin(G.yaw), 0, Math.cos(G.yaw)); const tx = P.x, tz = P.z;
  let cd = dist; for (let i = 1; i <= 16; i++) { const f = dist * i / 16, sx = tx - _fwd.x * f, sz = tz - _fwd.z * f; if (T.colliders.some((c) => c.h !== 0 && sx > c.x0 - 0.4 && sx < c.x1 + 0.4 && sz > c.z0 - 0.4 && sz < c.z1 + 0.4)) { cd = Math.max(1.6, f - dist / 16); break; } }
  G.camD = G.camD == null ? cd : (cd < G.camD ? cd : damp(G.camD, cd, 3, dt)); const cx = tx - _fwd.x * G.camD, cz = tz - _fwd.z * G.camD; const cam = E.camera; cam.position.x = damp(cam.position.x, cx, 8, dt); cam.position.z = damp(cam.position.z, cz, 8, dt); cam.position.y = damp(cam.position.y, h + 1.2, 6, dt);
  if (G.snapCam) { cam.position.set(cx, h + 1.2, cz); G.snapCam = false; } cam.lookAt(tx, 1.6, tz); cam.fov = E.baseFov; cam.updateProjectionMatrix();
  followShadow(tx, 0, tz);
  // delivery / nav arrow
  const tgt = G.deliv && G.deliv.bag ? G.deliv.house : null; G.arrow.visible = !!tgt; if (tgt) { const d = T.doors.find((x) => x.bid === tgt); G.arrow.position.set(d.x, 5 + Math.sin(G.t * 3) * 0.4, d.z); G.arrow.rotation.y = G.t * 2; }
}
const onWalk = (x, z) => { // standing on a raised sidewalk / plaza?
  for (const c of [-90, -30, 30, 90]) { if (Math.abs(x - c) < 6 || Math.abs(z - c) < 6) return 0; } return Math.abs(x) < 96 && Math.abs(z) < 96 ? 1 : 0; };
function movePlayer(dt, mv, col) { const m = Math.hypot(mv.x, mv.y); const run = IN.held.run ? 1.4 : 1; const spd = 5.2 * run;
  if (m > 0.05) { const dx = Math.sin(G.yaw) * mv.y - Math.cos(G.yaw) * mv.x, dz = Math.cos(G.yaw) * mv.y + Math.sin(G.yaw) * mv.x; const want = Math.atan2(dx, dz); P.ry += wrapAng(want - P.ry) * Math.min(1, dt * 14); const s = spd * Math.min(1, m);
    const r = col(P.x + dx / Math.max(1, Math.hypot(dx, dz)) * s * dt, P.z + dz / Math.max(1, Math.hypot(dx, dz)) * s * dt, 0.38); P.x = r.x; P.z = r.z; P.sp = s; } else P.sp = 0; }
function stepRoom(dt, mv) {
  const R = G.room; G.yaw = PI; movePlayer(dt, mv, (x, z, r) => { const q = collideRoom(R, x - IX, z, r); return { x: q.x + IX, z: q.z, hit: q.hit }; });
  P.model.visible = true; P.model.position.set(P.x, 0, P.z); P.model.rotation.y = P.ry; animPerson(P.model, dt, { speed: P.sp, carry: !!P.carry });
  for (const n of R.npcs) { if (n.m.userData.rig) animPerson(n.m, dt, { speed: 0, wave: n.anim === 'wave' && Math.sin(G.t * 0.7 + n.x) > 0.6, work: n.anim === 'work', angry: n.anim === 'angry' }); else animAny(n.m, dt, 0, {}); }
  // camera: dollhouse view from the open front
  const lx = P.x - IX; const tx = IX + clamp(lx, -R.W / 2 + 4.5, R.W / 2 - 4.5), tz = clamp(P.z, -R.D / 2 + 2.6, R.D / 2 - 2.4);
  const cam = E.camera; const cx = tx, cy = 7.4, cz = tz + 7.2; if (G.snapRoom !== R) { cam.position.set(cx, cy, cz); G.snapRoom = R; } cam.position.x = damp(cam.position.x, cx, 6, dt); cam.position.y = damp(cam.position.y, cy, 6, dt); cam.position.z = damp(cam.position.z, cz, 6, dt);
  cam.lookAt(tx, 1.0, tz - 1.3); cam.fov = E.baseFov - 2; cam.updateProjectionMatrix(); followShadow(tx, 0, tz);
  if (G.deliv && G.deliv.bag && R.bid === G.deliv.house) {} }
// ---------------- HUD ----------------
let hudT = 0;
function hud() { hudT -= 1; if (hudT > 0) return; hudT = 6;
  $('hMoney').textContent = '$' + Math.round(S.money).toLocaleString(); $('hClock').textContent = 'Day ' + S.day + ' · ' + fmtTime(S.time);
  const bk = G.sim && !G.sim.rival && branchKey(G.bid); const hb = $('hBranch');
  if (bk) { const br = S.branches[bk]; hb.classList.remove('hidden'); hb.innerHTML = `<span>⭐${Math.round(br.rep)}</span><span>🧼${Math.round(br.sanitation)}%</span><span>📦${br.stock}</span>${br.grade ? `<span class="grade g${br.grade}">${br.grade}</span>` : ''}${G.sim.insp ? '<span class="blink">🕵️</span>' : ''}`; }
  else if (G.sim && G.sim.rival && S.career.shift) { hb.classList.remove('hidden'); hb.innerHTML = `<span>🧑‍🍳 ${CAREER[S.career.rank].n}</span><span>💵 tips $${S.career.tips}</span><span>XP ${S.career.xp}</span>`; }
  else hb.classList.add('hidden');
  const dv = $('hDeliv'); if (G.deliv) { dv.classList.remove('hidden'); dv.textContent = (G.deliv.bag ? '🛍️ Deliver to ' : '🛵 Cook for delivery: ') + (G.deliv.bag ? BLD[G.deliv.house].name : DISH[G.deliv.dish].e + ' ' + DISH[G.deliv.dish].n); } else dv.classList.add('hidden');
  const nav = $('hNav'); if (G.where === 'town' && !G.deliv && G.navTarget && !G.navDone) { const d = T.doors.find((x) => x.bid === G.navTarget); const dist = Math.hypot(d.x - P.x, d.z - P.z); if (dist < 4) G.navDone = true; nav.classList.remove('hidden'); const ang = Math.atan2(d.x - P.x, d.z - P.z) - G.yaw; nav.innerHTML = `<i style="transform:rotate(${-ang}rad)">⬆</i> ${titleCase(BLD[G.navTarget].name)} · ${Math.round(dist)}m`; }
  else if (G.where === 'town' && G.deliv && G.deliv.bag) { const d = T.doors.find((x) => x.bid === G.deliv.house); const ang = Math.atan2(d.x - P.x, d.z - P.z) - G.yaw; nav.classList.remove('hidden'); nav.innerHTML = `<i style="transform:rotate(${-ang}rad)">⬆</i> ${titleCase(BLD[G.deliv.house].name)} · ${Math.round(Math.hypot(d.x - P.x, d.z - P.z))}m`; } else nav.classList.add('hidden');
}
// test hooks
window.__G = { G, C, P, Net, get S() { return S; }, E, T, enterBuilding, exitBuilding, sleep, U, currentAction, doAction };
boot();
