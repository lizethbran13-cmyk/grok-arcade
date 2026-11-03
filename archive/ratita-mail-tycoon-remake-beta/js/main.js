// Ratita Mail Tycoon - Turbo remake: play as Pi-rat, run the post office, drive the truck, grow the empire.
import * as THREE from 'three';
import { E, initEngine, setEnvironment, followShadow, render, trackFps } from './engine.js';
import { IN, initInput, readMove, edge } from './input.js';
import { FollowCam } from './cam.js';
import { initAudio, sfx } from './audio.js';
import { $, clamp, toast } from './util.js';
import { makePet, animPet } from './pets.js';
import { makeRat, animRat, setOutfit } from './models.js';
import { buildTown, T, BRANCHES, ROADS } from './town.js';
import { initMats } from './mats.js';
import { COL, collide, ray, Batch, G, PI, sign } from './kit.js';
import { makeTruck, TRUCKS, makeCar, makeGuineaPig, animPig, makeGangVan, makeBeltParcels } from './actors.js';

const KEY = 'ratitaMailRemake.save.v1';
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window; if (isTouch) document.body.classList.add('touch');
const canvas = $('c'); initEngine(canvas, 'high'); initInput();
const scene = E.scene;
setEnvironment({ skyTop: 0x2f7fd8, skyMid: 0x8cc4f0, skyBot: 0xdcefff, sunDir: [0.55, 0.75, 0.35], sunColor: 0xfff1d6, sunI: 2.6, hemiSky: 0xcfe6ff, hemiGround: 0x6a7f4a, hemiI: 0.9, exposure: 0.88, fog: 0xbfdcf2, fogD: 0.0042, envI: 0.7, bloomT: 1.05, bloomS: 0.22 });
initMats(); buildTown(scene);
const BR = Object.fromEntries(BRANCHES.map((b) => [b.id, b]));

// ---------------- state ----------------
const fresh = (mode) => ({ v: 1, mode, money: mode === 'empire' ? 2500 : 150, rep: mode === 'empire' ? 70 : 50, ready: mode === 'empire' ? 6 : 0, truck: mode === 'empire' ? 'big' : 'van', trucks: mode === 'empire' ? ['van', 'big'] : ['van'], upg: {}, decor: {}, broken: {}, dmg: 0,
  br: Object.fromEntries(BRANCHES.map((b) => [b.id, { owned: mode === 'empire', rep: 70, stolen: false }])), stats: { sorted: 0, delivered: 0, mix: 0, late: 0, crashes: 0, gang: 0 }, time: 0, tut: mode === 'scratch' ? 0 : 9 });
let S = null;
const save = () => { if (!S) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const load = () => { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s && s.v === 1 ? s : null; } catch (e) { return null; } };

// ---------------- actors ----------------
const me = makePet('pirat', { s: 1.4, outfit: 'none', extras: ['vest'] }); scene.add(me.root);
const P = { x: 0, z: 10, yaw: PI, speed: 0, mode: 'walk' };
const cam = new FollowCam(); cam.want = 6.2; cam.hgt = 1.5;
const world = { ray: (o, d, m, f) => ray(o, d, m, f) };
// truck
let truck = null; const TK = { x: 0, z: 0, yaw: 0, v: 0, steer: 0 };
function spawnTruck(kind) { if (truck) scene.remove(truck.root); truck = makeTruck(kind); scene.add(truck.root); }
function parkTruck() { const s = T.spots.truck; TK.x = s.x; TK.z = s.z; TK.yaw = s.yaw; TK.v = 0; }
// cameo pets
const luna = makePet('luna', { s: 1.3, extras: ['glasses'] }); const snowie = makePet('snowie', { s: 1.25 }); const candy = makePet('candy', { s: 1.1 }); const torty = makePet('torty', { s: 1.1 });
for (const [p, s] of [[luna, T.spots.luna], [snowie, T.spots.snowie], [candy, T.spots.candy], [torty, T.spots.torty]]) { p.x = s.x; p.z = s.z; p.y = 0.16; p.yaw = s.yaw || 0; p.home = { ...s }; scene.add(p.root); }
try { setOutfit(snowie.rig, 'flower'); } catch (e) {}
const LINES = {
  luna: ['Pi-rat! Ratita Industries runs on on-time mail. Keep that reputation up!', 'Sticker colour = bin colour. Red Same-Day, blue 2-Day, yellow Letters, green Big Parcels.', 'Open branches in the corner blocks, then drive over and check in so they stay happy.', 'Those Guinea Pig Gang hooligans only go after branches with low reputation. Visit often!'],
  snowie: ['Hi Pi-rat! I keep the front counter busy. Customers pay a little every few seconds.', 'Buy plants and a snack machine in the Supply Shop, customers love a nice lobby!', 'If a belt motor breaks, the belt stops. Walk to it and press E to fix it.'],
  candy: ['Woof! (Candy guards the loading dock. Sorted mail gets loaded into the truck here.)', 'Woof woof! (Drive carefully! Crashes cost money, but the tow truck is always free.)'],
  torty: ['...slow and steady... ...mail should still be fast though...', '...welcome to Tortuga Park... ...my Shell Cottage has a mailbox too...'],
};
// workers at the belts
const workers = T.belts.slice(1).map((b, i) => { const w = makePet(['ginger', 'cocoa'][i], { s: 1.2, outfit: 'hardhat' }); w.x = b.x0 + 3; w.z = b.z + 1.4; w.y = 0.16; w.yaw = PI; scene.add(w.root); return w; });
const customers = T.spots.customers.map((s, i) => { const c = makePet(['blue', 'rose', 'black'][i], { s: 1.15 }); c.x = s.x; c.z = s.z; c.y = 0.16; c.yaw = s.yaw; scene.add(c.root); return c; });
// branch workers
const brWork = {}; for (const b of BRANCHES) { const w = makePet(b.worker, { s: 1.15, outfit: 'none', extras: ['vest'] }); w.x = b.spots.worker.x; w.z = b.spots.worker.z; w.y = 0.16; w.yaw = b.spots.worker.yaw; brWork[b.id] = w; scene.add(w.root); }
// belt parcels
const parcels = makeBeltParcels(T.belts, scene);
// machine beacons (red light + smoke) shown when broken
const beacons = {}; const beaconGeo = new THREE.SphereGeometry(0.22, 12, 8), beaconMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 2.5 });
const smokeGeo = new THREE.SphereGeometry(0.35, 8, 6), smokeMat = new THREE.MeshStandardMaterial({ color: 0x555555, transparent: true, opacity: 0.55, roughness: 1 });
for (const m of T.machines) { const g = new THREE.Group(); const b = new THREE.Mesh(beaconGeo, beaconMat); b.position.y = 0.6; g.add(b); const puffs = []; for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(smokeGeo, smokeMat); g.add(s); puffs.push(s); } g.position.set(m.x, m.y, m.z); g.visible = false; scene.add(g); beacons[m.id] = { g, b, puffs }; }
// GPS arrow over the player
const arrow = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xf59e0b, emissiveIntensity: 1.2 }); const c = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.0, 16), m); c.rotation.x = PI / 2; c.position.z = 0.5; const s = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.9), m); s.position.z = -0.3; arrow.add(c, s); } scene.add(arrow); arrow.visible = false;
// delivery markers
const markGeo = new THREE.TorusGeometry(2.2, 0.16, 8, 36), markMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 1.5 });
const markers = []; const pinGeo = new THREE.OctahedronGeometry(0.55), pinMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 1.2 });
function makeMarker() { const g = new THREE.Group(); const r = new THREE.Mesh(markGeo, markMat); r.rotation.x = PI / 2; r.position.y = 0.2; const p = new THREE.Mesh(pinGeo, pinMat); p.position.y = 3.2; g.add(r, p); g.pin = p; scene.add(g); return g; }
// decor (bought in the shop)
const decor = {}; {
  const mk = (id) => { const g = new THREE.Group(); scene.add(g); g.visible = false; decor[id] = g; return g; };
  let g = mk('plants'), B = new Batch(); for (const [x, z] of [[8.4, 6.2], [8.4, 12.2], [-13.8, 9.6], [0.6, -11.6], [-3.6, -11.6]]) { B.cyl('g', 0xb45309, x, 0.16, z, 0.4, 0.6); B.add('m', G.ico, 0x2f9e44, x, 1.2, z, 0, 0, 0, 0.65, 0.85, 0.65); B.sph('l', 0xf472b6, x + 0.2, 1.7, z, 0.12, 0.12, 0.12, 0.4); }
  B.box('w', 0xb91c1c, 0, 0.19, 10, 4, 0.01, 5); B.finish(g); for (const [x, z] of [[8.4, 6.2], [8.4, 12.2], [-13.8, 9.6], [0.6, -11.6], [-3.6, -11.6]]) { const c = COL.boxes; const b = { x0: x - 0.4, x1: x + 0.4, z0: z - 0.4, z1: z + 0.4, y0: 0, y1: 1.6, g }; c.push(b); }
  g = mk('snack'); B = new Batch(); B.rbox('g', 0xdc2626, 0.9, 0.16, 6.2, 1.1, 2.1, 0.8); B.box('e', 0xbfe3ff, 0.9, 0.7, 6.62, 0.8, 1.2, 0.04); for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) B.box('g', [0xfacc15, 0x22c55e, 0x3b82f6][c], 0.65 + c * 0.25, 0.8 + r * 0.28, 6.5, 0.18, 0.18, 0.1); B.finish(g); COL.boxes.push({ x0: 0.35, x1: 1.45, z0: 5.8, z1: 6.6, y0: 0, y1: 2.3, g });
  g = mk('neon'); const n = sign('★ RATITA POST ★', 9, 1.6, { bg: '#1e1b4b', fg: '#ff6bd6', border: '#22d3ee', glow: 1.6 }); n.position.set(0, 7.6, 13.3); g.add(n); const p = new THREE.PointLight(0xff6bd6, 6, 14, 2); p.position.set(0, 7, 15); g.add(p);
  g = mk('statue'); B = new Batch(); const st = T.spots.statue; B.rbox('x', 0xe2e8f0, st.x, 0.14, st.z, 2.2, 1.0, 2.2); B.rbox('x', 0xcbd5e1, st.x, 1.1, st.z, 1.8, 0.3, 1.8); B.finish(g); COL.boxes.push({ x0: st.x - 1.1, x1: st.x + 1.1, z0: st.z - 1.1, z1: st.z + 1.1, y0: 0, y1: 3, g });
  const gold = makeRat('gold', 'crown', { pack: false, noBlaster: true }); gold.root.scale.setScalar(2.2); gold.root.position.set(st.x, 1.4, st.z); gold.root.rotation.y = 0.5; g.add(gold.root);
}
// guinea pig gang (one squad, moved to whichever branch is being raided)
const gang = { root: new THREE.Group(), pigs: [], van: makeGangVan(), br: null, t: 0, run: 0 }; scene.add(gang.root); gang.root.visible = false; gang.root.add(gang.van);
for (let i = 0; i < 4; i++) { const p = makeGuineaPig([0xd97706, 0x78350f, 0xf5f5f4, 0x111827][i], i === 0); gang.pigs.push(p); gang.root.add(p.root); }
// traffic
const cars = []; { const cols = [0x0ea5e9, 0x16a34a, 0xf97316, 0xa855f7, 0xe11d48, 0x64748b];
  const loops = [{ hx: 30 - 2.5, hz: 22 - 2.5, dir: -1 }, { hx: 30 + 2.5, hz: 22 + 2.5, dir: 1 }, { hx: 90 - 2.5, hz: 80 - 2.5, dir: -1 }, { hx: 90 + 2.5, hz: 80 + 2.5, dir: 1 }];
  loops.forEach((L, li) => { const per = 2 * (L.hx + L.hz) * 2; for (let k = 0; k < (li < 2 ? 2 : 3); k++) { const c = makeCar(cols[(li * 3 + k) % cols.length]); c.L = L; c.s = per * k / (li < 2 ? 2 : 3) + li * 13; c.per = per; c.v = 9; scene.add(c.root); cars.push(c); } }); }
function loopPos(L, s, out) { const W = 2 * L.hx, H = 2 * L.hz, per = 2 * (W + H); s = ((s % per) + per) % per; if (L.dir < 0) s = per - s; let x, z, dx, dz;
  if (s < W) { x = -L.hx + s; z = -L.hz; dx = 1; dz = 0; } else if (s < W + H) { x = L.hx; z = -L.hz + (s - W); dx = 0; dz = 1; } else if (s < 2 * W + H) { x = L.hx - (s - W - H); z = L.hz; dx = -1; dz = 0; } else { x = -L.hx; z = L.hz - (s - 2 * W - H); dx = 0; dz = -1; }
  if (L.dir < 0) { dx = -dx; dz = -dz; } out.x = x; out.z = z; out.yaw = Math.atan2(dx, dz); return out; }

// ---------------- helpers ----------------
const money = (d, why) => { S.money = Math.max(0, Math.round(S.money + d)); if (d > 0) sfx('coin'); };
const rep = (d) => { S.rep = clamp(S.rep + d, 0, 100); };
const groundY = (x, z) => { if (Math.abs(x) < 17 && Math.abs(z) < 13) return 0.16; for (const bx of [-60, 0, 60]) for (const bz of [-51, 0, 51]) if (Math.abs(x - bx) < 25 && Math.abs(z - bz) < 24) return 0.15; return 0.04; };
let talkT = 0; function talk(who, txt) { $('talkWho').textContent = who; $('talkTxt').textContent = txt; $('talk').classList.add('on'); talkT = 5; }
let modal = null; function openModal(id) { closeModals(); modal = id; $(id).classList.add('on'); }
function closeModals() { for (const id of ['sortUI', 'fixUI', 'shopUI', 'mapUI', 'menuUI', 'msgUI']) $(id).classList.remove('on'); modal = null; }
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => closeModals()));
function msg(title, body, btns) { $('msgT').textContent = title; $('msgB').textContent = body; const box = $('msgBtns'); box.innerHTML = ''; for (const [label, fn, cls] of btns) { const b = document.createElement('button'); b.className = cls || 'primary'; b.textContent = label; b.onclick = () => { closeModals(); fn && fn(); }; box.appendChild(b); } openModal('msgUI'); }

// ---------------- branches / decor visibility ----------------
function applyWorld() {
  for (const b of BRANCHES) { const st = S.br[b.id]; T.branchG[b.id].visible = st.owned; T.lotG[b.id].visible = !st.owned; brWork[b.id].root.visible = st.owned && !st.stolen; }
  for (const id in decor) decor[id].visible = !!S.decor[id];
  if (!truck || truck.kind !== S.truck) spawnTruck(S.truck);
}

// ---------------- route (deliveries) ----------------
let route = null; // {stops:[mailbox], t, limit, pay, done}
function startRoute() {
  const cap = TRUCKS[S.truck].cap; const n = Math.min(S.ready, cap); if (n <= 0) return false;
  const pool = T.mailboxes.slice().sort(() => Math.random() - 0.5); const stops = pool.slice(0, n);
  S.ready -= n; route = { stops: stops.map((m) => ({ ...m, mk: makeMarker() })), t: 0, limit: 50 + n * 22, n, earned: 0, late: 0 };
  route.stops.forEach((s) => s.mk.position.set(s.x, 0, s.z)); toast(`🚚 Route started: ${n} stop${n > 1 ? 's' : ''}! Follow the yellow arrow.`); sfx('whoosh'); return true;
}
function endRoute(lost) { if (!route) return; for (const s of route.stops) scene.remove(s.mk); if (lost) { rep(-4); toast(`📭 ${route.stops.length} deliveries lost! −4 ⭐`, true); } else { const bonus = route.late ? 0 : 10 * route.n; if (bonus) money(bonus); toast(route.late ? `Route done, ${route.late} late. No bonus.` : `🏁 Route complete! +$${bonus} on-time bonus`); if (!route.late) rep(2); } route = null; }
function deliverCheck() { if (!route) return; const late = route.t > route.limit; for (let i = route.stops.length - 1; i >= 0; i--) { const s = route.stops[i]; if (Math.hypot(TK.x - s.x, TK.z - s.z) < 6.5 && Math.abs(TK.v) < 9) {
  const pay = Math.round((16 + S.rep / 5) * (s.special ? 1.5 : 1) * (late ? 0.5 : 1)); money(pay); S.stats.delivered++; if (late) { route.late++; S.stats.late++; rep(-2); toast(`⏰ Late delivery to ${s.name}: +$${pay}, −2 ⭐`, true); } else { rep(0.5); toast(`📬 Delivered to ${s.name}! +$${pay}`); }
  scene.remove(s.mk); route.stops.splice(i, 1); sfx('point'); } } if (!route.stops.length) endRoute(false); }

// ---------------- machines ----------------
let breakT = 60, techT = {};
function breakSomething() { const ok = T.machines.filter((m) => !S.broken[m.id]); if (!ok.length) return; const m = ok[Math.floor(Math.random() * ok.length)]; S.broken[m.id] = true; sfx('lose'); toast(`⚠️ ${m.name} broke down! Go fix it.`, true); }
// ---------------- gang ----------------
let gangT = 90; function gangStart(id) { const b = BR[id]; gang.br = id; gang.t = 75; gang.run = 0; gang.root.visible = true; T.branchG[id].visible = true;
  gang.van.position.set(b.spots.van.x, 0.04, b.spots.van.z); gang.van.rotation.y = PI / 2; gang.pigs.forEach((p, i) => { p.x = b.spots.gang.x + (i % 2) * 1.2 - 0.6; p.z = b.spots.gang.z + Math.floor(i / 2) * 1.2 - 0.6; p.root.position.set(p.x, 0.16, p.z); });
  toast(`🐹 The Guinea Pig Gang is raiding ${b.name}! Get there fast!`, true); sfx('lose'); }
function gangChase() { const b = BR[gang.br]; const st = S.br[gang.br]; gang.run = 3; const was = st.stolen; st.stolen = false; st.rep = was ? 45 : Math.max(st.rep, 60) + 10; if (!was) money(40); S.stats.gang++; sfx('cheer');
  toast(was ? `🏤 ${b.name} is yours again!` : `💨 You chased the Gang out of ${b.name}! +$40`); }
function gangSteal() { const b = BR[gang.br]; S.br[gang.br].stolen = true; S.br[gang.br].rep = 0; rep(-6); sfx('lose'); msg('🐹 Branch stolen!', `The Guinea Pig Gang took over ${b.name}. It earns nothing until you take it back: drive there and chase them out (free).`, [['OK']]); gang.t = 0; }

// ---------------- sorting mini-game ----------------
const KINDS = [{ bin: 0, tag: 'SAME-DAY', col: '#dc2626', icons: ['📦', '✉️', '🎁'] }, { bin: 1, tag: '2-DAY', col: '#2563eb', icons: ['📦', '🎁', '✉️'] }, { bin: 2, tag: 'LETTER', col: '#ca8a04', icons: ['✉️', '📰', '💌', '📚'] }, { bin: 3, tag: 'BIG PARCEL', col: '#16a34a', icons: ['📦', '🛋️', '🚲', '🧸'] }];
const STREETS = ['12 Cheese St', '4 Whisker Way', '88 Burrow Bay Rd', '7 Squeak Ave', '31 Cheddar Hts', '2 Tortuga Park', 'Ratita Industries', '19 Gouda Ln'];
let SG = null;
function openSort(belt) { if (S.broken['motor' + belt]) { toast('⚠️ Belt ' + (belt + 1) + ' motor is broken. Fix it first (left wall).', true); return; } SG = { belt, i: 0, n: 8, ok: 0, bad: 0, t: 0, lim: S.upg.turbo ? 4.2 : 5, cur: null }; $('sBelt').textContent = belt + 1; nextItem(); openModal('sortUI'); }
function nextItem() { if (SG.i >= SG.n) return finishSort(); const k = KINDS[Math.floor(Math.random() * 4)]; SG.cur = k; SG.t = 0; $('sIcon').textContent = k.icons[Math.floor(Math.random() * k.icons.length)]; const tg = $('sTag'); tg.textContent = k.tag; tg.style.background = k.col; $('sAddr').textContent = STREETS[Math.floor(Math.random() * STREETS.length)]; $('sCount').textContent = `${SG.i + 1}/${SG.n} · ✅${SG.ok} ❌${SG.bad}`; $('sItem').className = ''; }
function pickBin(b) { if (!SG || !SG.cur) return; const ok = b === SG.cur.bin; SG.cur = null; const it = $('sItem'); it.className = ok ? 'ok' : 'bad';
  if (ok) { SG.ok++; const pay = (S.upg.turbo ? 5 : 3) * (S.broken.stamp ? 0.5 : 1); money(pay); S.stats.sorted++; sfx('point'); } else { SG.bad++; S.stats.mix++; rep(-2); sfx('miss'); toast('❌ Mix-up! −2 ⭐', true); }
  SG.i++; setTimeout(() => SG && nextItem(), 260); }
function finishSort() { const g = SG; SG = null; closeModals(); S.ready += g.ok; if (g.bad === 0) { rep(2); money(10); toast(`🌟 Perfect sort! +$10, +2 ⭐ · ${g.ok} bundles ready for the truck`); sfx('cheer'); } else toast(`📬 ${g.ok} bundles ready for the truck (${g.bad} mix-ups)`); if (S.tut < 2) S.tut = 2; save(); }
document.querySelectorAll('#sBins .bin').forEach((b) => b.addEventListener('click', () => pickBin(+b.dataset.bin)));

// ---------------- repair mini-game ----------------
let FX = null;
function openFix(m) { FX = { m, hits: 0, miss: 0, p: 0, dir: 1, zone: 0.4 + Math.random() * 0.35, w: 0.16 }; $('fName').textContent = m.name; placeZone(); updFix(); $('fCall').style.display = 'none'; openModal('fixUI'); }
function placeZone() { FX.zone = 0.12 + Math.random() * 0.62; const z = $('fZone'); z.style.left = FX.zone * 100 + '%'; z.style.width = FX.w * 100 + '%'; }
function updFix() { $('fHits').textContent = `🔩 ${FX.hits}/3`; }
function fixTap() { if (!FX) return; if (FX.p >= FX.zone && FX.p <= FX.zone + FX.w) { FX.hits++; sfx('point'); if (FX.hits >= 3) { delete S.broken[FX.m.id]; sfx('cheer'); toast(`✅ ${FX.m.name} fixed!`); rep(1); FX = null; closeModals(); save(); return; } placeZone(); }
  else { FX.miss++; sfx('miss'); if (S.money >= 3) money(-3); $('fBar').animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], 200); if (FX.miss >= 3) $('fCall').style.display = ''; } updFix(); }
$('fBtn').addEventListener('click', fixTap); $('fClose').addEventListener('click', () => { FX = null; closeModals(); });
$('fCall').addEventListener('click', () => { const m = FX.m; techT[m.id] = 25; FX = null; closeModals(); toast(`📞 Ratita Tech is coming to fix the ${m.name} (25 s).`); });

// ---------------- shop ----------------
const SHOP = [
  { sect: 'Upgrades' }, { id: 'turbo', ic: '⚡', name: 'Turbo Belts', d: 'Sorting pays $5 a piece instead of $3.', cost: 180, kind: 'upg' }, { id: 'oiler', ic: '🛢️', name: 'Auto-Oiler', d: 'Machines break down less than half as often.', cost: 220, kind: 'upg' },
  { sect: 'Trucks' }, { id: 'van', ic: '🚐', name: 'Ratita Mail Van', d: '4 stops per trip. Your trusty starter.', cost: 0, kind: 'truck' }, { id: 'speedy', ic: '🏎️', name: 'Speedy Van', d: 'Much faster, 5 stops per trip.', cost: 300, kind: 'truck' }, { id: 'big', ic: '🚛', name: 'Big Mail Truck', d: '8 stops per trip and tougher in crashes.', cost: 450, kind: 'truck' },
  { sect: 'Decor (raises reputation)' }, { id: 'plants', ic: '🪴', name: 'Plants & red carpet', d: '+5 ⭐ and the lobby looks lovely.', cost: 80, kind: 'decor', rep: 5 }, { id: 'snack', ic: '🍫', name: 'Snack machine', d: '+5 ⭐, customers stay happy in the queue.', cost: 120, kind: 'decor', rep: 5 },
  { id: 'neon', ic: '💡', name: 'Neon RATITA POST sign', d: '+8 ⭐, glows on the HQ roof.', cost: 150, kind: 'decor', rep: 8 }, { id: 'statue', ic: '🏆', name: 'Golden rat statue', d: '+10 ⭐, on the plaza by HQ.', cost: 260, kind: 'decor', rep: 10 },
];
function renderShop() { const L = $('shopList'); L.innerHTML = ''; for (const it of SHOP) { if (it.sect) { const d = document.createElement('div'); d.className = 'sect'; d.textContent = it.sect; L.appendChild(d); continue; }
  const own = it.kind === 'truck' ? S.trucks.includes(it.id) : it.kind === 'upg' ? S.upg[it.id] : S.decor[it.id]; const row = document.createElement('div'); row.className = 'shopItem';
  row.innerHTML = `<div class="ic">${it.ic}</div><div class="tx"><b>${it.name}</b><small>${it.d}</small></div>`; const b = document.createElement('button'); b.className = 'ghost';
  if (it.kind === 'truck' && own) { b.textContent = S.truck === it.id ? '✔ Driving' : 'Use'; b.disabled = S.truck === it.id; b.onclick = () => { S.truck = it.id; applyWorld(); parkTruck(); toast(`${it.ic} Now using the ${it.name}`); renderShop(); save(); }; }
  else if (own) { b.textContent = '✔ Owned'; b.disabled = true; }
  else { b.textContent = '$' + it.cost; b.disabled = S.money < it.cost; b.onclick = () => { if (S.money < it.cost) return; money(-it.cost); if (it.kind === 'truck') { S.trucks.push(it.id); S.truck = it.id; parkTruck(); } else if (it.kind === 'upg') S.upg[it.id] = 1; else { S.decor[it.id] = 1; rep(it.rep); } sfx('cheer'); toast(`${it.ic} Bought ${it.name}!`); applyWorld(); renderShop(); save(); }; }
  row.appendChild(b); L.appendChild(row); } }

// ---------------- map ----------------
let gpsTarget = null;
function renderMap() { const cv = $('mapCv'), g = cv.getContext('2d'); const W = cv.width, H = cv.height, sc = Math.min(W / 210, H / 190); const mx = (x) => W / 2 + x * sc, mz = (z) => H / 2 + z * sc;
  g.fillStyle = '#3f7f34'; g.fillRect(0, 0, W, H); g.fillStyle = '#4b5563'; for (const x of ROADS.xs) g.fillRect(mx(x - 5), mz(-90), 10 * sc, 180 * sc); for (const z of ROADS.zs) g.fillRect(mx(-100), mz(z - 5), 200 * sc, 10 * sc);
  g.fillStyle = 'rgba(253,230,138,.35)'; for (const bx of [-60, 0, 60]) for (const bz of [-51, 51]) g.fillRect(mx(bx - 22), mz(bz - 21), 44 * sc, 42 * sc);
  g.fillStyle = '#475569'; g.fillRect(mx(-77), mz(-18), 30 * sc, 36 * sc); g.fillStyle = '#16a34a'; g.fillRect(mx(47), mz(-18), 30 * sc, 36 * sc);
  g.font = 'bold 11px system-ui'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('Ratita Industries', mx(-62), mz(0)); g.fillText('Tortuga Park', mx(62), mz(0));
  g.fillStyle = '#1e3a8a'; g.fillRect(mx(-17), mz(-13), 34 * sc, 26 * sc); g.fillStyle = '#fde047'; g.font = 'bold 12px system-ui'; g.fillText('📮 HQ', mx(0), mz(4));
  for (const b of BRANCHES) { const st = S.br[b.id]; const threat = gang.br === b.id && gang.t > 0; g.fillStyle = st.stolen ? '#7f1d1d' : st.owned ? '#2563eb' : '#94a3b8'; g.fillRect(mx(b.cx - 8), mz(b.cz - 6), 16 * sc, 12 * sc); g.fillStyle = '#fff'; g.font = 'bold 11px system-ui';
    g.fillText((threat ? '🐹 ' : st.stolen ? '🐹 ' : st.owned ? '🏤 ' : '🏗️ ') + b.name, mx(b.cx), mz(b.cz + (b.fz > 0 ? -9 : 11))); }
  if (route) for (const s of route.stops) { g.fillStyle = '#22d3ee'; g.beginPath(); g.arc(mx(s.x), mz(s.z), 5, 0, 7); g.fill(); }
  const px = P.mode === 'drive' ? TK.x : P.x, pz = P.mode === 'drive' ? TK.z : P.z; g.fillStyle = '#facc15'; g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.arc(mx(px), mz(pz), 7, 0, 7); g.fill(); g.stroke();
  const L = $('brList'); L.innerHTML = ''; for (const b of BRANCHES) { const st = S.br[b.id]; const row = document.createElement('div'); row.className = 'brRow'; const status = st.stolen ? '🐹 Stolen by the Gang' : st.owned ? `⭐ ${Math.round(st.rep)} · +$${brIncome(b.id)}/10s` : `For sale $${b.cost}`;
    row.innerHTML = `<span><b>${b.name}</b> · ${status}</span>`; const gb = document.createElement('button'); gb.className = 'ghost'; gb.textContent = '📍 GPS'; gb.onclick = () => { gpsTarget = { x: b.spots.door.x, z: b.spots.door.z, name: b.name }; closeModals(); toast('📍 GPS set to ' + b.name); }; row.appendChild(gb); L.appendChild(row); }
}
const brIncome = (id) => Math.round(6 + S.br[id].rep / 8);

// ---------------- interactions ----------------
let near = null;
function findNear() {
  const x = P.x, z = P.z; let best = null, bd = 1e9; const consider = (o, d) => { if (d < bd) { bd = d; best = o; } };
  if (P.mode === 'drive') { if (Math.abs(TK.v) < 2.5) return { label: '🚪 Get out', kind: 'exit' }; return null; }
  for (const it of T.interact) { if (it.g && !it.g.visible) continue; const d = Math.hypot(it.x - x, it.z - z); if (d < it.r) consider(it, d); }
  for (const m of T.machines) if (S.broken[m.id]) { const d = Math.hypot(m.ix - x, m.iz - z); if (d < 2.2) consider({ label: '🔧 Fix the ' + m.name, kind: 'fix', m }, d - 0.5); }
  { const d = Math.hypot(TK.x - x, TK.z - z); if (d < 4.6) consider({ label: S.broken.lift ? '⚠️ Dock lift broken (fix it to load)' : route ? '🚚 Drive (route in progress)' : S.ready > 0 ? `🚚 Load ${Math.min(S.ready, TRUCKS[S.truck].cap)} bundles & drive` : '🚚 Drive the truck', kind: 'truck' }, d - 0.8); }
  if (S.dmg > 0 && Math.hypot(T.spots.dockIn.x - x, T.spots.dockIn.z - z) < 2.5) consider({ label: `🔧 Repair truck ($${Math.ceil(S.dmg / 2)})`, kind: 'truckfix' }, 1.5);
  for (const [p, id] of [[luna, 'luna'], [snowie, 'snowie'], [candy, 'candy'], [torty, 'torty']]) { const d = Math.hypot(p.x - x, p.z - z); if (d < 2.4) consider({ label: '💬 Talk to ' + p.name, kind: 'talk', id, p }, d + 0.3); }
  if (gang.br && (gang.t > 0 || S.br[gang.br].stolen)) { const p = gang.pigs[0]; const d = Math.hypot(p.x - x, p.z - z); if (d < 3.2) consider({ label: S.br[gang.br].stolen ? '🐹 Take the branch back!' : '🐹 Chase out the Guinea Pig Gang!', kind: 'gang' }, d - 1); }
  return best;
}
function doAct(it) {
  if (!it) return; initAudio();
  switch (it.kind) {
    case 'shop': renderShop(); openModal('shopUI'); break;
    case 'map': renderMap(); openModal('mapUI'); break;
    case 'sort': openSort(it.belt); break;
    case 'fix': openFix(it.m); break;
    case 'talk': { const L = LINES[it.id]; talk(it.p.name, L[Math.floor(Math.random() * L.length)]); sfx('point'); break; }
    case 'truck': if (!route && S.ready > 0 && !S.broken.lift) startRoute(); else if (!route && S.ready > 0 && S.broken.lift) toast('⚠️ Fix the Dock Lift first to load mail.', true); else if (!route && S.ready === 0 && S.tut < 3) toast('📬 Truck is empty. Sort mail at a belt first!'); P.mode = 'drive'; me.root.visible = false; cam.want = 11; cam.hgt = 2.4; if (S.tut < 3) S.tut = 3; break;
    case 'exit': { P.mode = 'walk'; me.root.visible = true; const sx = Math.cos(TK.yaw), sz = -Math.sin(TK.yaw); P.x = TK.x + sx * (TRUCKS[S.truck].wid / 2 + 1.1); P.z = TK.z + sz * (TRUCKS[S.truck].wid / 2 + 1.1); collide(P, 0.5); cam.want = 6.2; cam.hgt = 1.5; break; }
    case 'truckfix': { const c = Math.ceil(S.dmg / 2); if (S.money >= c) { money(-c); S.dmg = 0; toast('🔧 Truck repaired!'); } else { S.dmg = 0; toast('🔧 Candy\'s pals fixed it for free (you were broke).'); } break; }
    case 'checkin': { const st = S.br[it.br]; if (st.stolen) { toast('🐹 The Gang holds this branch. Chase them out first!', true); break; } st.rep = clamp(st.rep + 30, 0, 100); const cash = Math.round(brIncome(it.br) * 2); money(cash); sfx('cheer'); toast(`🏤 Checked in at ${BR[it.br].name}: ⭐ ${Math.round(st.rep)}, collected $${cash}`); break; }
    case 'buy': { const b = BR[it.br]; if (S.money < b.cost) { toast(`Need $${b.cost} to open ${b.name} (you have $${S.money}).`, true); break; } money(-b.cost); S.br[it.br].owned = true; S.br[it.br].rep = 65; applyWorld(); sfx('cheer'); toast(`🎉 ${b.name} branch is open! Walk inside.`); save(); break; }
    case 'gang': gangChase(); break;
  }
}
$('actBtn').addEventListener('click', () => doAct(near));

// ---------------- HUD / menus ----------------
$('bMap').addEventListener('click', () => { if (!S) return; renderMap(); openModal('mapUI'); });
$('bMenu').addEventListener('click', () => { if (!S) return; renderMenu(); openModal('menuUI'); });
function renderMenu() { const st = S.stats; $('menuStats').innerHTML = `<b>${S.mode === 'empire' ? '🏙️ Built Empire' : '🌱 From Scratch'}</b> · 💰 $${S.money} · ⭐ ${Math.round(S.rep)}<br>📬 sorted ${st.sorted} · 🚚 delivered ${st.delivered} · ❌ mix-ups ${st.mix} · ⏰ late ${st.late} · 💥 crashes ${st.crashes} · 🐹 gang chased ${st.gang}<br>🏤 Branches: ${BRANCHES.filter((b) => S.br[b.id].owned).length}/4 · Truck: ${TRUCKS[S.truck].name} (${Math.round(100 - S.dmg)}%)`; }
$('uUnstuck').addEventListener('click', () => { closeModals(); if (P.mode === 'drive') { P.mode = 'walk'; me.root.visible = true; cam.want = 6.2; cam.hgt = 1.5; } P.x = T.spots.hqIn.x; P.z = T.spots.hqIn.z; cam.snap = true; toast('⛑️ Back at HQ!'); });
$('uTow').addEventListener('click', () => { closeModals(); tow(false); });
$('uSound').addEventListener('click', () => { import('./audio.js').then((a) => { a.setSound(!a.SND.on, a.SND.music); toast(a.SND.on ? '🔊 Sound on' : '🔇 Sound off'); }); });
$('uHelp').addEventListener('click', () => { $('helpTxt').innerHTML = '1) Walk to a belt 📬 and sort mail: sticker colour = bin colour.<br>2) Walk out the back dock, hop in the truck, and drive to the glowing rings to deliver. Late = half pay, crashes cost $.<br>3) Fix broken machines 🔧 (red beacon). 4) Buy upgrades in the Supply Shop. 5) Open branches in the corner blocks and check in on them, or the Guinea Pig Gang will try to steal them!'; });
$('uNew').addEventListener('click', () => { msg('Start over?', 'This erases your current game.', [['Yes, new game', () => { localStorage.removeItem(KEY); location.reload(); }, 'primary'], ['Cancel', null, 'ghost']]); });
function tow(crash) { const was = P.mode === 'drive'; if (route) endRoute(true); parkTruck(); S.dmg = 0; P.mode = 'walk'; me.root.visible = true; P.x = T.spots.dockIn.x; P.z = T.spots.dockIn.z; cam.want = 6.2; cam.hgt = 1.5; cam.snap = true;
  toast(crash ? '🛻 Free tow: the truck is back at the HQ dock, all fixed.' : '🛻 Truck towed back to the HQ dock (free).'); }
let blink = 0;
function hud(dt) {
  $('hMoney').textContent = '💰 $' + S.money; $('hRep').textContent = '⭐ ' + Math.round(S.rep); $('hReady').textContent = '📬 ' + S.ready + ' ready'; $('hTruck').textContent = '🚚 ' + Math.round(100 - S.dmg) + '%';
  let obj = ''; if (route) obj = `🚚 Deliver to ${route.stops.length} stop${route.stops.length > 1 ? 's' : ''} · ⏱ ${Math.max(0, Math.ceil(route.limit - route.t))}s`; else if (S.ready > 0 && P.mode === 'walk') obj = `📬 ${S.ready} bundles ready: walk out the back dock to the truck`; else if (S.tut < 2) obj = '📬 Walk to a sorting belt (behind the counter) and press ' + (isTouch ? 'the button' : 'E'); else if (P.mode === 'drive') obj = 'Free driving · drive back to the HQ dock to load more mail'; else obj = '📬 Sort more mail at a belt, or open a new branch 🏗️';
  $('hObj').textContent = obj;
  const broken = Object.keys(S.broken); let al = ''; if (gang.br && gang.t > 0) al = `🐹 GANG RAID at ${BR[gang.br].name}! ${Math.ceil(gang.t)}s left`; else if (broken.length) al = '⚠️ Broken: ' + broken.map((id) => T.machines.find((m) => m.id === id).name).join(', '); else if (S.dmg > 60) al = '🚚 Truck badly damaged, drive gently or repair at the dock'; const A = $('hAlert'); A.textContent = al; A.classList.toggle('on', !!al);
}

// ---------------- main loop ----------------
const v3 = new THREE.Vector3(); let last = performance.now(), saveT = 0, incT = 0, brT = 0, started = false;
function tgt() { if (gang.br && gang.t > 0) { const b = BR[gang.br]; return { x: b.spots.door.x, z: b.spots.door.z, name: 'Gang raid' }; } if (route && route.stops.length) { const px = P.mode === 'drive' ? TK.x : P.x, pz = P.mode === 'drive' ? TK.z : P.z; let best = null, bd = 1e9; for (const s of route.stops) { const d = Math.hypot(s.x - px, s.z - pz); if (d < bd) { bd = d; best = s; } } if (P.mode === 'walk') return { ...T.spots.truck, name: 'Truck' }; return best; } if (P.mode === 'drive' && S.ready > 0) return { ...T.spots.truck, name: 'HQ dock' }; return gpsTarget; }
function step(dt, now) {
  S.time += dt; const mv = readMove();
  if (talkT > 0) { talkT -= dt; if (talkT <= 0) $('talk').classList.remove('on'); }
  // ---- player ----
  if (P.mode === 'walk' && !modal) {
    const yaw = cam.moveYaw, fx = Math.sin(yaw), fz = Math.cos(yaw); const dx = fx * mv.y - fz * mv.x * -1 * -1, dz = fz * mv.y + fx * mv.x * -1 * -1;
    const rx = -fz, rz = fx; const wx = fx * mv.y + rx * mv.x, wz = fz * mv.y + rz * mv.x; const sp = 6.2 * Math.min(1, Math.hypot(mv.x, mv.y));
    P.x += wx * sp * dt; P.z += wz * sp * dt; P.speed = sp; if (sp > 0.1) { let want = Math.atan2(wx, wz), d = want - P.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); P.yaw += d * Math.min(1, dt * 12); }
    if (sp > 0.1) P.idle = 0; else { P.idle = (P.idle || 0) + dt; if (P.idle > 1.0) { let d = (cam.yaw + 0.75) - P.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); P.yaw += d * Math.min(1, dt * 3); } }
    collide(P, 0.55); P.x = clamp(P.x, -99, 99); P.z = clamp(P.z, -89, 89);
  } else if (P.mode === 'walk') P.speed = 0;
  me.x = P.x; me.z = P.z; me.y = groundY(P.x, P.z); me.yaw = P.yaw; me.root.position.set(me.x, me.y, me.z); me.root.rotation.y = me.yaw; animRat(me.rig, dt, { speed: P.speed, air: false, lean: 0 });
  // ---- truck ----
  const spec = TRUCKS[S.truck];
  if (P.mode === 'drive' && !modal) {
    const thr = mv.y, steer = -mv.x, brake = IN.keys.Space || IN.held.brake; const top = spec.speed * (S.dmg > 70 ? 0.6 : 1);
    if (brake) TK.v *= Math.exp(-4 * dt); else if (thr > 0) TK.v += thr * 9 * dt; else if (thr < 0) TK.v += thr * (TK.v > 0 ? 18 : 6) * dt; else TK.v *= Math.exp(-0.8 * dt);
    TK.v = clamp(TK.v, -6, top); TK.steer += (steer - TK.steer) * Math.min(1, dt * 8);
    TK.yaw += TK.steer * clamp(TK.v / 6, -1, 1) * 1.7 * dt * (Math.abs(TK.v) > 0.3 ? 1 : 0);
    TK.x += Math.sin(TK.yaw) * TK.v * dt; TK.z += Math.cos(TK.yaw) * TK.v * dt;
    // collisions: front + back circles
    const half = spec.len / 2 - spec.wid / 2, r = spec.wid / 2 + 0.15; let hit = 0; const ox = TK.x, oz = TK.z;
    for (const s of [1, -1]) { const p = { x: TK.x + Math.sin(TK.yaw) * half * s, z: TK.z + Math.cos(TK.yaw) * half * s }; const px = p.x, pz = p.z; const h = collide(p, r, 0.3); if (h) { TK.x += p.x - px; TK.z += p.z - pz; hit = Math.max(hit, h.pen); } }
    for (const c of cars) { const d = Math.hypot(c.root.position.x - TK.x, c.root.position.z - TK.z); if (d < 3.2) { const nx = (TK.x - c.root.position.x) / (d || 1), nz = (TK.z - c.root.position.z) / (d || 1); TK.x += nx * (3.2 - d); TK.z += nz * (3.2 - d); hit = Math.max(hit, 0.3); } }
    TK.x = clamp(TK.x, -97, 97); TK.z = clamp(TK.z, -87, 87);
    if (hit > 0.02) { const sp = Math.abs(TK.v); if (sp > 7) { const dmg = (sp - 5) * 3.2 / spec.armor; S.dmg = Math.min(100, S.dmg + dmg); const cost = Math.round(sp); money(-cost); S.stats.crashes++; sfx('lose'); toast(`💥 Crash! −$${cost} · truck ${Math.round(100 - S.dmg)}%`, true); E.camera && (cam.cur *= 0.9); } TK.v *= -0.25; }
    if (S.dmg >= 100) { TK.v = 0; msg('🛻 Truck broke down!', 'Too many crashes. The Ratita tow truck will bring it back to the HQ dock for free, but any mail still on board is lost (−4 ⭐).', [['Free tow to HQ', () => tow(true)]]); }
    deliverCheck(); if (route) { route.t += dt; }
  } else if (P.mode !== 'drive') { TK.v = 0; if (route) route.t += dt; }
  if (truck) { truck.root.position.set(TK.x, 0.04, TK.z); truck.root.rotation.y = TK.yaw; for (const w of truck.wheels) w.children[0].rotation.x += TK.v * dt / 0.48; truck.wheels[0].rotation.y = truck.wheels[1].rotation.y = TK.steer * 0.45; }
  // ---- traffic ----
  for (const c of cars) { const pos = loopPos(c.L, c.s, {}); const ax = Math.sin(pos.yaw), az = Math.cos(pos.yaw); let blocked = false; const chk = (x, z) => { const dx = x - pos.x, dz = z - pos.z; const f = dx * ax + dz * az, s = Math.abs(dx * az - dz * ax); if (f > 0 && f < 9 && s < 2.4) blocked = true; };
    chk(TK.x, TK.z); if (P.mode === 'walk') chk(P.x, P.z); for (const o of cars) if (o !== c && o.L === c.L) chk(o.root.position.x, o.root.position.z);
    c.v += ((blocked ? 0 : 10) - c.v) * Math.min(1, dt * (blocked ? 6 : 1.5)); c.s += c.v * dt * (c.L.dir < 0 ? 1 : 1); const p2 = loopPos(c.L, c.s, {}); c.root.position.set(p2.x, 0.04, p2.z); let d = p2.yaw - c.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); c.root.rotation.y += d * Math.min(1, dt * 8); }
  // ---- economy timers ----
  incT += dt; if (incT > 6) { incT = 0; const c = Math.round((2 + S.rep / 20) * (S.decor.snack ? 1.3 : 1)); S.money += c; }
  brT += dt; if (brT > 10) { brT = 0; let tot = 0; for (const b of BRANCHES) { const st = S.br[b.id]; if (st.owned && !st.stolen) { tot += brIncome(b.id); st.rep = Math.max(0, st.rep - 1.2); } } if (tot) S.money += tot; for (const id of Object.keys(S.broken)) rep(-0.6); }
  // breakdowns
  breakT -= dt; if (breakT <= 0) { breakT = (S.upg.oiler ? 150 : 75) + Math.random() * 45; if (!modal) breakSomething(); }
  for (const id in techT) { techT[id] -= dt; if (techT[id] <= 0) { delete techT[id]; if (S.broken[id]) { delete S.broken[id]; toast('📞 Ratita Tech fixed the ' + T.machines.find((m) => m.id === id).name); } } }
  // gang
  if (gang.br && gang.t > 0) { gang.t -= dt; if (gang.t <= 0) gangSteal(); }
  else if (!gang.br || (!S.br[gang.br].stolen && gang.run <= 0)) { gangT -= dt; if (gangT <= 0) { gangT = 100 + Math.random() * 60; const pool = BRANCHES.filter((b) => S.br[b.id].owned && !S.br[b.id].stolen && S.br[b.id].rep < 55); if (pool.length) gangStart(pool[Math.floor(Math.random() * pool.length)].id); } }
  if (gang.run > 0) { gang.run -= dt; const b = BR[gang.br]; for (const p of gang.pigs) { const dx = b.spots.van.x - p.x, dz = b.spots.van.z - p.z, d = Math.hypot(dx, dz); if (d > 0.5) { p.x += dx / d * 7 * dt; p.z += dz / d * 7 * dt; p.root.rotation.y = Math.atan2(dx, dz); } p.root.position.set(p.x, 0.16, p.z); animPig(p, dt, true); } if (gang.run <= 0) { gang.root.visible = false; gang.br = null; } }
  else if (gang.root.visible) { gang.pigs.forEach((p, i) => { p.root.rotation.y = Math.atan2(P.x - p.x, P.z - p.z) + Math.sin(S.time * 3 + i) * 0.3; animPig(p, dt, false); }); }
  // ---- machines visuals ----
  const running = T.belts.map((b) => !S.broken['motor' + b.i]); parcels.update(dt * (S.upg.turbo ? 1.8 : 1), running);
  for (const m of T.machines) { const bc = beacons[m.id]; bc.g.visible = !!S.broken[m.id]; if (bc.g.visible) { bc.b.material.emissiveIntensity = 1.5 + Math.sin(S.time * 10) * 1.2; bc.puffs.forEach((s, i) => { const k = (S.time * 0.6 + i / 4) % 1; s.position.set(Math.sin(i * 2) * 0.3, 0.8 + k * 2.4, Math.cos(i * 3) * 0.3); s.scale.setScalar(0.5 + k * 1.3); }); } }
  // ---- NPCs ----
  for (const p of [luna, snowie, candy, torty]) { animPet(p, dt, P.mode === 'walk' ? P : null); p.root.position.y = groundY(p.x, p.z); }
  for (const w of workers) { const brk = S.broken['motor' + T.belts[workers.indexOf(w) + 1].i]; animPet(w, dt, null); w.root.position.y = 0.16; w.rig.root.rotation.z = brk ? Math.sin(S.time * 3) * 0.08 : 0; }
  customers.forEach((c, i) => { animPet(c, dt, null); c.root.position.y = 0.16 + Math.abs(Math.sin(S.time * 2 + i)) * 0.02; });
  for (const b of BRANCHES) { const w = brWork[b.id]; if (w.root.visible) animPet(w, dt, P); }
  for (const s of route ? route.stops : []) { s.mk.pin.position.y = 3.2 + Math.sin(S.time * 3) * 0.3; s.mk.pin.rotation.y += dt * 2; }
  // ---- interaction ----
  near = modal ? null : findNear(); const ab = $('actBtn'); if (near) { ab.textContent = near.label + (isTouch ? '' : '  [E]'); ab.classList.add('on'); } else ab.classList.remove('on');
  if (edge('act')) { if (modal === 'sortUI') {} else if (modal === 'fixUI') fixTap(); else if (!modal) doAct(near); }
  if (IN.keys.KeyM && !modal && !IN._m) { renderMap(); openModal('mapUI'); } IN._m = IN.keys.KeyM;
  if (modal === 'sortUI' && SG) { for (let k = 0; k < 4; k++) if (IN.keys['Digit' + (k + 1)] && !IN['_d' + k]) pickBin(k); for (let k = 0; k < 4; k++) IN['_d' + k] = IN.keys['Digit' + (k + 1)];
    if (SG && SG.cur) { SG.t += dt; $('sTimer').firstElementChild.style.width = Math.max(0, 100 - SG.t / SG.lim * 100) + '%'; if (SG.t > SG.lim) { SG.cur = null; SG.bad++; S.stats.mix++; rep(-1); sfx('miss'); $('sItem').className = 'bad'; SG.i++; setTimeout(() => SG && nextItem(), 260); } } }
  if (modal === 'fixUI' && FX) { FX.p += FX.dir * dt * 0.85; if (FX.p > 1) { FX.p = 1; FX.dir = -1; } if (FX.p < 0) { FX.p = 0; FX.dir = 1; } $('fNeedle').style.left = `calc(${FX.p * 100}% - 3px)`; if (IN.keys.Space && !IN._sp) fixTap(); IN._sp = IN.keys.Space; }
  if (modal && IN.keys.Escape && modal !== 'msgUI') { if (modal === 'sortUI' && SG) { SG = null; } closeModals(); }
  // ---- GPS arrow ----
  const tg = tgt(); const ax = P.mode === 'drive' ? TK.x : P.x, az = P.mode === 'drive' ? TK.z : P.z; const gp = $('gps');
  if (tg) { const dx = tg.x - ax, dz = tg.z - az, d = Math.hypot(dx, dz); arrow.visible = d > 6; arrow.position.set(ax, (P.mode === 'drive' ? spec.hgt + 1.6 : 3.4) + Math.sin(S.time * 4) * 0.12, az); arrow.rotation.y = Math.atan2(dx, dz);
    gp.classList.add('on'); const rel = Math.atan2(dx, dz) - (cam.moveYaw); $('gpsArrow').style.transform = `rotate(${-rel * 180 / PI - 90}deg)`; $('gpsTxt').textContent = `${tg.name || 'Target'} · ${Math.round(d)} m`; if (gpsTarget && tg === gpsTarget && d < 6) gpsTarget = null; }
  else { arrow.visible = false; gp.classList.remove('on'); }
  $('drive').classList.toggle('on', P.mode === 'drive' && isTouch);
  // ---- camera ----
  const f = P.mode === 'drive' ? { x: TK.x, y: 0.5, z: TK.z, yaw: TK.yaw, speed: Math.abs(TK.v) } : { x: P.x, y: me.y, z: P.z, yaw: P.yaw, speed: P.speed };
  { const ins = P.mode === 'walk' && Math.abs(P.x) < 17 && Math.abs(P.z) < 13; E.renderer.toneMappingExposure += ((ins ? 0.74 : 0.88) - E.renderer.toneMappingExposure) * Math.min(1, dt * 3); E.bloom && (E.bloom.strength = ins ? 0.12 : 0.22); }
  cam.driving = P.mode === 'drive'; cam.update(dt, f, world); followShadow(f.x, 0, f.z);
  hud(dt);
  saveT += dt; if (saveT > 5) { saveT = 0; save(); }
}
let wipT = 0; function loop(now) { requestAnimationFrame(loop); if (now - wipT > 500) { wipT = now; const wb = document.getElementById('ratitaWip'); document.body.classList.toggle('wip', !!wb); if (wb) document.body.style.setProperty('--wip', (wb.getBoundingClientRect().bottom + 6) + 'px'); } const dt = Math.min(0.05, (now - last) / 1000); last = now; if (started) step(dt, now); else { cam.yaw += dt * 0.08; cam.update(dt, { x: 0, y: 0, z: 4, yaw: 0, speed: 0 }, null, { dist: 34 }); } trackFps(dt, now); render(dt); }
// brake button
{ const b = $('dBrake'); const on = (e) => { e.preventDefault(); IN.held.brake = true; }, off = (e) => { e.preventDefault(); IN.held.brake = false; }; b.addEventListener('touchstart', on, { passive: false }); b.addEventListener('touchend', off); b.addEventListener('mousedown', on); b.addEventListener('mouseup', off); }
// ---------------- title ----------------
function start(s) { S = s; for (const b of BRANCHES) S.br[b.id] = S.br[b.id] || { owned: false, rep: 70, stolen: false }; applyWorld(); parkTruck(); P.x = T.spots.hqIn.x; P.z = T.spots.hqIn.z - 7.5; P.yaw = 0.75; cam.yaw = 0; cam.pitch = 0.42; cam.snap = true; closeModals(); $('title').classList.remove('on'); document.body.classList.add('playing'); started = true; initAudio(); save();
  if (S.tut === 0) { talk('Luna', 'Welcome to Ratita Post, Pi-rat! Sort the mail at the belts behind the counter, then deliver it with the truck out back.'); S.tut = 1; } }
const old = load(); $('mContinue').style.display = old ? '' : 'none';
$('mContinue').addEventListener('click', () => start(load())); $('mScratch').addEventListener('click', () => start(fresh('scratch'))); $('mEmpire').addEventListener('click', () => start(fresh('empire')));
window.addEventListener('beforeunload', save); document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
S = old || fresh('scratch'); applyWorld(); parkTruck(); S = null; applyWorld2();
function applyWorld2() {}
window.__mail = { get S() { return S; }, P, TK, T, start, fresh, doAct, openSort, openFix, gangStart, startRoute, renderMap, openModal, closeModals, E };
requestAnimationFrame(loop);
