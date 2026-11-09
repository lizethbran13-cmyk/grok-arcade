// Candy's Snow Day: a Turbo-engine winter town. Play as Candy (miniature schnauzer), pull your sled, run cocoa deliveries, race the rats down Sled Hill.
import * as THREE from 'three';
import { E, initEngine, setEnvironment, followShadow, render, trackFps } from './engine.js';
import { IN, initInput, readMove, edge } from './input.js';
import { FollowCam } from './cam.js';
import { collide, ray, PI, sign, Batch } from './kit.js';
import { initMats, MATS } from './mats.js';
import { makePet, animPet } from './pets.js';
import { initAudio, sfx, setSound, SND } from './audio.js';
import { $, clamp, toast, rng, fmtTime } from './util.js';
import { buildWorld, SP, H, cx, onCourse, COURSE_Z0, liftTick } from './world.js';

const QS = new URLSearchParams(location.search);
const canvas = $('c'); initEngine(canvas, QS.get('q') === 'low' ? 'low' : 'high'); initInput();
const DTMAX = Math.min(0.15, +QS.get('dtmax') || 0.05);
const scene = E.scene; const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || (window.matchMedia && matchMedia('(pointer: coarse)').matches); const TT = (k, t) => isTouch ? t : k; if (isTouch) document.body.classList.add('touch');
setEnvironment({ skyTop: 0x2c4a86, skyMid: 0xd9b8cf, skyBot: 0xf3e3dc, sunDir: [0.5, 0.42, 0.35], sunColor: 0xffe2c8, sunI: 2.1, sunDisc: 0.6, hemiSky: 0xdbe8ff, hemiGround: 0x9aa7bd, hemiI: 1.05, exposure: 0.84, fog: 0xd7dceb, fogD: 0.0075, envI: 0.65, bloomT: 0.95, bloomS: 0.32, stars: 0.15 });
initMats(); buildWorld(scene);
const world = { ray: (o, d, m, f) => ray(o, d, m, f) };
const R = rng(Date.now() % 100000);

// ---------------- save ----------------
const KEY = 'candySnowDay.v1';
function fresh() { return { coins: 20, mood: 60, sledHp: 100, deliveries: 0, spills: 0, wins: 0, races: 0, crashes: 0, best: null, medals: [], tut: 0 }; }
function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); return s && s.coins != null ? Object.assign(fresh(), s) : null; } catch (e) { return null; } }
let S = fresh(); const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

// ---------------- snowfall (one Points cloud that follows the camera) ----------------
const SNOWN = 1400; const snowG = new THREE.BufferGeometry(); const snowA = new Float32Array(SNOWN * 3); for (let i = 0; i < SNOWN; i++) { snowA[i * 3] = (R() - 0.5) * 60; snowA[i * 3 + 1] = R() * 26; snowA[i * 3 + 2] = (R() - 0.5) * 60; } snowG.setAttribute('position', new THREE.BufferAttribute(snowA, 3));
const flakeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); const t = new THREE.CanvasTexture(c); return t; })();
const snow = new THREE.Points(snowG, new THREE.PointsMaterial({ size: 0.16, map: flakeTex, transparent: true, depthWrite: false, color: 0xffffff })); snow.frustumCulled = false; scene.add(snow);
function stepSnow(dt) { const c = E.camera.position, t = performance.now() / 1000; for (let i = 0; i < SNOWN; i++) { let y = snowA[i * 3 + 1] - dt * (1.1 + (i % 7) * 0.12); if (y < 0) y += 26; snowA[i * 3 + 1] = y; snowA[i * 3] += Math.sin(t * 0.7 + i) * dt * 0.25; }
  snow.position.set(Math.floor(c.x / 60) * 60, c.y - 13, Math.floor(c.z / 60) * 60); // wrap: shift particles by cell so the cloud surrounds the camera
  for (let i = 0; i < SNOWN; i++) { const wx = snowA[i * 3] + snow.position.x, wz = snowA[i * 3 + 2] + snow.position.z; if (wx < c.x - 30) snowA[i * 3] += 60; else if (wx > c.x + 30) snowA[i * 3] -= 60; if (wz < c.z - 30) snowA[i * 3 + 2] += 60; else if (wz > c.z + 30) snowA[i * 3 + 2] -= 60; }
  snowG.attributes.position.needsUpdate = true; }

// ---------------- cast ----------------
const me = makePet('candy', { s: 2.1, neck: 'scarf', neckC: 0xdc2626 }); scene.add(me.root);
const P = { x: -6, z: -16, y: 0, vy: 0, yaw: PI, speed: 0, mode: 'title', stun: 0 };
const cam = new FollowCam(); cam.want = 9.6; cam.hgt = 2.2; cam.pitch = 0.46;
// the sled Candy pulls (cargo rack with cocoa thermoses)
function grp(build) { const g = new THREE.Group(), b = new Batch(); build(b); b.finish(g, true); return g; }
function makeSled(s = 1, col = 0xdc2626) { return grp((b) => { for (const k of [-1, 1]) { b.box('x', 0x9ca3af, k * 0.55 * s, 0, 0, 0.07 * s, 0.07 * s, 2.3 * s); b.add('x', THREE.TorusGeometry ? new THREE.TorusGeometry(0.22 * s, 0.035 * s, 6, 12, PI) : null, 0x9ca3af, k * 0.55 * s, 0.22 * s, 1.15 * s, 0, PI / 2, 0, 1, 1, 1); for (const z of [-0.8, 0, 0.8]) b.box('x', 0x9ca3af, k * 0.55 * s, 0.05 * s, z * s, 0.06 * s, 0.24 * s, 0.06 * s); }
  for (let i = 0; i < 6; i++) b.box('m', i % 2 ? 0xb07a45 : 0x9a6b3f, 0, 0.27 * s, (-1.0 + i * 0.4) * s, 1.3 * s, 0.07 * s, 0.34 * s); b.box('g', col, 0, 0.32 * s, 0, 1.36 * s, 0.05 * s, 0.06 * s); for (const k of [-1, 1]) b.box('g', col, k * 0.66 * s, 0.32 * s, 0, 0.06 * s, 0.22 * s, 2.3 * s); }); }
const sled = makeSled(1.0); scene.add(sled);
const cups = []; { const cg = new THREE.CylinderGeometry(0.17, 0.17, 0.5, 12); const lid = new THREE.CylinderGeometry(0.12, 0.12, 0.12, 10); for (let i = 0; i < 4; i++) { const g = new THREE.Group(); const m = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: [0xdc2626, 0x16a34a, 0xdc2626, 0x16a34a][i], roughness: 0.4 })); m.position.y = 0.25; m.castShadow = true; g.add(m); const l = new THREE.Mesh(lid, new THREE.MeshStandardMaterial({ color: 0xf8fafc })); l.position.y = 0.55; g.add(l); g.position.set((i % 2 - 0.5) * 0.55, 0.36, (i < 2 ? 0.35 : -0.35)); g.visible = false; sled.add(g); cups.push(g); } }
const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 6), new THREE.MeshStandardMaterial({ color: 0x92400e })); scene.add(rope);
const SL = { x: P.x, z: P.z + 2.6, yaw: PI };
const npc = []; const put = (p, x, z, yaw = 0) => { p.x = x; p.z = z; p.yaw = yaw; p.y = H(x, z); scene.add(p.root); npc.push(p); return p; };
const luna = put(makePet('luna', { s: 1.3, extras: ['glasses'] }), -7.8, -21.5, -PI / 2); // runs the cocoa hatch
const snowie = put(makePet('snowie', { s: 1.3 }), -7.2, -46.2, -PI / 2); // at the Hill Shack
const pirat = put(makePet('pirat', { s: 1.3 }), -6.8, -48.4, -PI / 2);
const torty = put(makePet('torty', { s: 1.6 }), 8.6, -23.6, -PI / 2); // warming up by the lodge fire
{ const f = grp((b) => { b.cyl('m', 0x57534e, 0, 0, 0, 0.7, 0.35); for (let i = 0; i < 5; i++) b.box('m', 0x5b3a24, Math.cos(i * 1.3) * 0.25, 0.35, Math.sin(i * 1.3) * 0.25, 0.9, 0.12, 0.12, i * 1.3); b.add('l', new THREE.ConeGeometry(0.35, 0.9, 8), 0xff8a2a, 0, 0.8, 0, 0, 0, 0, 1, 1, 1, 1.4); b.add('l', new THREE.ConeGeometry(0.2, 0.6, 8), 0xffd36b, 0, 0.75, 0, 0, 0, 0, 1, 1, 1, 1.6); }); f.position.set(8.4, 0, -21); scene.add(f); const L = new THREE.PointLight(0xff9a40, 8, 9, 1.4); L.position.set(8.4, 1.4, -21); scene.add(L); }
const FOLK = ['blue', 'rose', 'black', 'cream', 'brownie', 'ash', 'gold', 'brie', 'ginger', 'cocoa'];
const HATC = [0x22c1c3, 0xdc2626, 0x7c3aed, 0x16a34a, 0xf59e0b];
function beanie(p, c) { const g = new THREE.Group(); const m1 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8, 0, PI * 2, 0, PI / 2), new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 })); g.add(m1); const pom = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 })); pom.position.y = 0.15; g.add(pom); g.position.y = 0.04; if (p.rig.hat) p.rig.hat.add(g); }
const ANCH = [[-8, 0, 13], [8, -4, 12], [0, 30, 4], [0, -30, 4], [36, 0, 12], [-36, 0, 12], [32, 20, 8], [-30, -15, 6], [0, 46, 4]];
const folk = []; for (let i = 0; i < 20; i++) { const an = ANCH[i % ANCH.length]; const p = put(makePet(FOLK[i % FOLK.length], { s: 1.15 }), an[0] + (R() - 0.5) * an[2], an[1] + (R() - 0.5) * an[2]); if (i % 4 !== 3) beanie(p, HATC[i % 5]); p.ax = an[0]; p.az = an[1]; p.ar = an[2]; p.wx = p.x; p.wz = p.z; p.skate = an[0] === 32 && an[1] === 20; folk.push(p); }
// kids building a snowman / snowball fight near the plaza
const kids = [['gold', -18, 9], ['ginger', -16.6, 10.4], ['blue', 18, -7], ['rose', 19.5, -8]].map(([id, x, z], i) => { const p = put(makePet(id, { s: 0.95 }), x, z, i); beanie(p, HATC[(i + 2) % 5]); return p; });

// ---------------- UI helpers ----------------
const open = (id) => $(id).classList.add('on'), close = (id) => $(id).classList.remove('on');
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => close(b.dataset.close)));
let talkT = 0; function talk(who, txt, t = 4) { $('talkWho').textContent = who + ': '; $('talkTxt').textContent = txt; $('talk').style.display = 'block'; talkT = t; }
let bigT = 0; function big(t, s = 2.2) { $('bigMsg').innerHTML = t; $('bigMsg').style.display = 'block'; bigT = s; }
function msg(t, b, btns = [['OK', null]]) { $('msgT').textContent = t; $('msgB').innerHTML = b; const w = $('msgBtns'); w.innerHTML = ''; for (const [l, f, cls] of btns) { const e = document.createElement('button'); e.className = cls || 'primary'; e.textContent = l; e.onclick = () => { close('msgUI'); f && f(); }; w.appendChild(e); } open('msgUI'); }
const anyModal = () => document.querySelector('.modal.on');
const addMood = (n) => { S.mood = clamp(S.mood + n, 0, 100); };
function hud() { $('hMoney').textContent = '🪙 ' + S.coins; $('hMood').textContent = (S.mood >= 60 ? '😊 ' : S.mood >= 35 ? '😐 ' : '😟 ') + S.mood; $('hSled').textContent = '🛷 ' + S.sledHp + '%'; $('hCup').textContent = DL ? '☕ ' + DL.cups.filter((c) => c.st === 'load').length : '☕ 0';
  const sl = $('slosh'); if (DL && DL.cups.some((c) => c.st === 'load') && P.mode === 'walk') { sl.classList.add('on'); $('sloshBar').style.width = Math.min(100, DL.slosh) + '%'; $('sloshBar').style.background = DL.slosh > 70 ? '#dc2626' : DL.slosh > 40 ? '#f59e0b' : '#22c55e'; } else sl.classList.remove('on'); }

// ---------------- cocoa deliveries ----------------
let DL = null; const marks = [];
const markGeo = new THREE.TorusGeometry(1.1, 0.09, 8, 28), markMat = new THREE.MeshBasicMaterial({ color: 0xffd36b, toneMapped: false }); const arrGeo = new THREE.ConeGeometry(0.35, 0.8, 10);
function setMarks() { marks.forEach((m) => scene.remove(m)); marks.length = 0; if (!DL) return; for (const c of DL.cups) if (c.st !== 'done') { const h = c.house; const g = new THREE.Group(); const t = new THREE.Mesh(markGeo, markMat); t.rotation.x = PI / 2; t.position.y = 0.08; g.add(t); const a = new THREE.Mesh(arrGeo, markMat); a.rotation.x = PI; a.position.y = 3.6; g.add(a); g.position.set(h.x, 0, h.z); g.userData.a = a; scene.add(g); marks.push(g); } }
function cocoaRun() { if (DL && DL.cups.some((c) => c.st === 'load')) { talk('Luna', 'You still have cocoa on the sled! Follow the gold arrows.'); return; }
  if (DL && DL.cups.some((c) => c.st === 'spilled')) { // free recovery: refill spilled cups (the warmth clock keeps running)
    DL.cups.forEach((c) => { if (c.st === 'spilled') c.st = 'load'; }); DL.slosh = 0; setCups(); setMarks(); sfx('pop'); talk('Luna', 'Free refill! Spills happen. Go easy on the turns this time.'); return; }
  const n = S.deliveries >= 6 ? 4 : 3; const pool = SP.houses.slice(); const L = []; while (L.length < n) L.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
  DL = { cups: L.map((h) => ({ house: h, st: 'load' })), warm: 100, slosh: 0, pay: 0, t: 0 }; setCups(); setMarks(); sfx('ding');
  talk('Luna', `${n} hot cocoas for ${L.map((h) => '#' + h.no).join(', ')}! Pull steady. Sharp turns and bumps slosh the cups.`, 5); gpsNext(); }
function setCups() { const k = DL ? DL.cups.filter((c) => c.st === 'load').length : 0; cups.forEach((c, i) => c.visible = i < k); }
function spill(why) { const c = DL.cups.find((q) => q.st === 'load'); if (!c) return; c.st = 'spilled'; S.spills++; const cost = Math.min(S.coins, 2); S.coins -= cost; addMood(-3); setCups(); setMarks(); sfx('splat'); DL.slosh = 30;
  puff(SL.x, H(SL.x, SL.z) + 0.6, SL.z, 0x7c4a32); toast(`☕ Spilled a cocoa ${why}! -${cost} 🪙. Luna refills for free at the hatch.`, true); gpsNext(); }
function deliver(c) { c.st = 'done'; const tip = Math.round(DL.warm / 20); const pay = 5 + tip; S.coins += pay; S.deliveries++; DL.pay += pay; addMood(4); setCups(); setMarks(); sfx('coin');
  talk(c.house.who, DL.warm > 70 ? 'Still piping hot! Thank you, Candy! 🐾' : DL.warm > 35 ? 'Mmm, nice and warm. Thanks, Candy!' : 'A bit lukewarm… but thank you for coming out in the snow!', 3.5); toast(`☕ Delivered to #${c.house.no} ${c.house.name}! +${pay} 🪙 (${tip} tip)`);
  if (!DL.cups.some((q) => q.st !== 'done')) { const all = DL.cups.length; S.medals.includes('cocoa1') || S.medals.push('cocoa1'); big(`☕ COCOA RUN DONE!<br><small>+${DL.pay} 🪙</small>`, 2.6); sfx('cheer'); DL = null; setMarks(); gpsT = null; save(); } else gpsNext(); }
function gpsNext() { if (!DL) return; const L = DL.cups.filter((c) => c.st === 'load'); if (!L.length) { gpsT = DL.cups.some((c) => c.st === 'spilled') ? { ...SP.hatch, name: 'Cocoa hatch (free refill)' } : null; return; } L.sort((a, b) => Math.hypot(a.house.x - P.x, a.house.z - P.z) - Math.hypot(b.house.x - P.x, b.house.z - P.z)); gpsT = { x: L[0].house.x, z: L[0].house.z, name: `#${L[0].house.no} ${L[0].house.name}` }; }

// ---------------- snow puffs (crashes / spills) ----------------
const puffs = []; const puffGeo = new THREE.IcosahedronGeometry(0.22, 0);
function puff(x, y, z, col = 0xffffff) { for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(puffGeo, new THREE.MeshStandardMaterial({ color: col, roughness: 1, transparent: true })); m.position.set(x, y, z); scene.add(m); puffs.push({ m, vx: (R() - 0.5) * 5, vy: 2 + R() * 4, vz: (R() - 0.5) * 5, t: 0 }); } }
function stepPuffs(dt) { for (let i = puffs.length - 1; i >= 0; i--) { const p = puffs[i]; p.t += dt; p.vy -= 12 * dt; p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt; p.m.material.opacity = 1 - p.t; if (p.t > 1) { scene.remove(p.m); p.m.material.dispose(); puffs.splice(i, 1); } } }

// ---------------- Sled Hill races (vs Luna, Snowie and Pi-rat) + time trial ----------------
const RIVALS = [['luna', 'Luna', 0x7c3aed, 13.2], ['snowie', 'Snowie', 0x0ea5e9, 13.6], ['pirat', 'Pi-rat', 0xf59e0b, 13.9]];
const racers = RIVALS.map(([id, name, col, vmax], i) => { const p = makePet(id, { s: 1.3, extras: id === 'luna' ? ['glasses'] : [] }); const sl = makeSled(0.62, col); const g = new THREE.Group(); g.add(sl); p.root.position.set(0, 0.25, -0.1); g.add(p.root); g.visible = false; scene.add(g); return { id, name, pet: p, g, vmax, lane: [-2.4, 0, 2.4][i], z: 0, v: 0, fin: null, spin: 0 }; });
let RC = null; const fmt = (t) => fmtTime(t).replace(/^0:/, '');
function raceMenu() { const best = S.best ? fmt(S.best) : '—';
  if (S.sledHp <= 0) { msg('🛷 Sled is cracked!', 'Your sled is too broken to race. Fix it at the Hill Shack.', [['🔧 Repair (8 🪙)', repairPaid, 'primary'], ['🩹 Free duct-tape patch', repairFree, 'ghost'], ['Later', null, 'ghost']]); return; }
  msg('🏁 Sled Hill', `Ride the chairlift up and race down Sled Hill.<br>• <b>Race the rats</b>: beat Luna, Snowie and Pi-rat. 1st place pays 25 🪙.<br>• <b>Time trial</b>: just you vs the clock. Your best: <b>${best}</b>.<br>Pass between the flags (a missed gate is +2 s). Trees and rocks mean a wipeout that costs time and dents your sled (🛷 ${S.sledHp}%).`,
    [['🐀 Race the rats', () => startRace('race')], ['⏱️ Time trial', () => startRace('trial'), 'ghost'], ...(S.sledHp < 100 ? [['🔧 Repair', repairMenu, 'ghost']] : []), ['Not now', null, 'ghost']]); }
function repairMenu() { msg('🔧 Hill Shack repairs', `Sled health: <b>${S.sledHp}%</b>. Snowie can fix it all the way for 8 🪙, or Pi-rat slaps on a free duct-tape patch (up to 50%).`, [['🔧 Repair (8 🪙)', repairPaid], ...(S.sledHp < 50 ? [['🩹 Free patch', repairFree, 'ghost']] : []), ['Close', null, 'ghost']]); }
function repairPaid() { if (S.coins < 8) { toast('Need 8 🪙. Pi-rat can do a free patch instead.', true); if (S.sledHp < 50) repairFree(); return; } S.coins -= 8; S.sledHp = 100; sfx('buy'); talk('Snowie', 'Good as new! Shiny runners and everything.'); save(); }
function repairFree() { S.sledHp = Math.max(S.sledHp, 50); sfx('pop'); talk('Pi-rat', 'Duct tape fixes everything. Mostly. It\'ll hold!'); save(); }
function startRace(kind) { if (DL && DL.cups.some((c) => c.st === 'load')) { toast('Deliver your cocoa first! (or it goes cold)', true); return; }
  RC = { kind, st: 'lift', t: 0, clock: 0, pen: 0, gate: 0, missed: 0, x: cx(COURSE_Z0 + 6), z: COURSE_Z0 + 6, y: 0, vy: 0, h: 0, v: 0, stun: 0, air: false, fin: null, prevZ: COURSE_Z0 + 6 };
  P.mode = 'race'; $('fade').classList.add('on'); $('fadeTxt').textContent = '🚡 Riding the chairlift up Sled Hill…'; sfx('whoosh');
  racers.forEach((r, i) => { r.g.visible = kind === 'race'; r.z = COURSE_Z0 + 6; r.v = 0; r.fin = null; r.spin = 0; r.wob = R() * 9; });
  setTimeout(() => { $('fade').classList.remove('on'); toast(TT('🛷 ← → steer · ↓ brake · Space hop · pass between the flags', '🛷 Thumb-stick left/right to steer · pull down to brake · ⤒ hop')); RC.st = 'count'; RC.t = 3.2; cam.yaw = PI; cam.pitch = 0.32; cam.snap = true; }, 1300); }
function placeNow() { let ahead = 0; for (const r of racers) if (r.fin != null ? true : r.z > RC.z) ahead++; return ahead + 1; }
const ORD = ['1st', '2nd', '3rd', '4th'];
function crash(why) { RC.v = 0; RC.stun = 1.3; const dmg = 20; S.sledHp = Math.max(0, S.sledHp - dmg); S.crashes++; sfx('hurt'); puff(RC.x, RC.y + 0.6, RC.z); big('💥 WIPEOUT!', 1.2); toast(`💥 Hit a ${why}! Sled -${dmg}% (now ${S.sledHp}%)`, true); if (S.sledHp <= 0) toast('🛷 Sled cracked! Top speed is lower until you fix it.', true); }
function stepRace(dt) { const mv = readMove();
  if (RC.st === 'lift') { cam.update(dt, { x: RC.x, y: H(RC.x, RC.z), z: RC.z, yaw: 0, speed: 0 }, world, { dist: 9 }); return; }
  if (RC.st === 'count') { RC.t -= dt; const n = Math.ceil(RC.t - 0.2); $('bigMsg').style.display = 'block'; $('bigMsg').innerHTML = n > 0 ? String(n) : 'GO!'; if (n !== RC.lastN) { RC.lastN = n; sfx(n > 0 ? 'click' : 'ding'); } if (RC.t <= 0) { RC.st = 'go'; bigT = 0.6; } }
  const go = RC.st === 'go';
  if (go) { RC.clock += dt; RC.stun -= dt;
    if (RC.stun <= 0) { RC.h -= mv.x * 2.0 * dt; RC.h = clamp(RC.h, -1.35, 1.35); }
    const hx = H(RC.x + 0.5, RC.z) - H(RC.x - 0.5, RC.z), hz = H(RC.x, RC.z + 0.5) - H(RC.x, RC.z - 0.5); const dx = Math.sin(RC.h), dz = Math.cos(RC.h);
    let a = -9.8 * 0.8 * (hx * dx + hz * dz) - 0.3 - 0.0072 * RC.v * RC.v; const on = onCourse(RC.x, RC.z); if (!on) a -= 0.45 * RC.v; if (mv.y < -0.2) a -= 7 * -mv.y; if (mv.y > 0.2 && RC.v < 7) a += 2.2;
    if (RC.stun > 0) a = Math.min(a, 0); RC.v = clamp(RC.v + a * dt, 0, S.sledHp > 0 ? 19 : 10); RC.prevZ = RC.z; RC.x += dx * RC.v * dt; RC.z += dz * RC.v * dt;
    // ramps launch you, the jump button gives a little hop
    const gy = H(RC.x, RC.z); if (!RC.air) { for (const rp of SP.ramps) if (Math.abs(RC.x - rp.x) < 1.8 && Math.abs(RC.z - rp.z) < 1.3 && RC.v > 5) { RC.air = true; RC.vy = 4.5 + RC.v * 0.22; RC.y = gy + 0.9; sfx('whoosh'); toast('🛷 Big air!'); } if (!RC.air && edge('jump')) { RC.air = true; RC.vy = 4.2; RC.y = gy; sfx('jump'); } }
    if (RC.air) { RC.vy -= 16 * dt; RC.y += RC.vy * dt; if (RC.y <= gy) { RC.y = gy; RC.air = false; sfx('land'); } } else RC.y = gy;
    const q = { x: RC.x, z: RC.z }; const hit = collide(q, 0.75, RC.y + 0.2); if (hit) { if (RC.v > 4.5 && RC.stun <= 0) crash(hit.b.rock ? 'rock' : hit.b.tree ? 'tree' : 'snowbank'); else RC.v *= 0.9; RC.x = q.x; RC.z = q.z; }
    // gates
    const gt = SP.gates[RC.gate]; if (gt && RC.z >= gt.z && RC.prevZ < gt.z) { if (Math.abs(RC.x - gt.x) < 4.3) { sfx('check'); } else { RC.pen += 2; RC.missed++; toast('🚩 Missed a gate! +2 s', true); sfx('deny'); } RC.gate++; }
    while (SP.gates[RC.gate] && RC.z > SP.gates[RC.gate].z + 3) { RC.gate++; RC.pen += 2; RC.missed++; }
    if (RC.z >= SP.finish.z && !RC.fin) finishRace(); }
  // rivals
  for (const r of racers) { if (!r.g.visible) continue; if (go && r.fin == null) { let vm = r.vmax; const gap = r.z - RC.z; if (gap > 25) vm -= 1.4; else if (gap < -25) vm += 1.6; if (r.spin > 0) { r.spin -= dt; vm = 2; } else if (R() < dt * 0.025) { r.spin = 1.2; if (Math.abs(gap) < 30) toast(`🌀 ${r.name} spun out!`); }
      r.v += (vm - r.v) * Math.min(1, dt * 0.7); r.z += r.v * dt * 0.95; if (r.z >= SP.finish.z) r.fin = RC.clock; }
    const x = cx(r.z) + r.lane * (0.6 + 0.4 * Math.sin(r.z * 0.07 + r.wob)), y = H(x, r.z); const ahead = cx(r.z + 2) + r.lane * (0.6 + 0.4 * Math.sin((r.z + 2) * 0.07 + r.wob)); r.g.position.set(x, y + 0.05, r.z); r.g.rotation.y = Math.atan2(ahead - x, 2) + (r.spin > 0 ? r.spin * 9 : 0);
    r.pet.t += dt; animPet(Object.assign(r.pet, { x: 0, y: 0.25, z: -0.1, yaw: 0, speed: 0, noTurn: true }), dt, null); }
  // place Candy on her sled
  sled.position.set(RC.x, RC.y + 0.02, RC.z); sled.rotation.set(0, RC.h + (RC.stun > 0 ? Math.sin(RC.stun * 12) * 0.5 : 0), 0); rope.visible = false;
  P.x = RC.x; P.z = RC.z; P.y = RC.y + 0.34; P.yaw = RC.h; me.mode = 'sit';
  if (RC.st !== 'fin') { const want = RC.h + PI; let d = want - cam.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); if (performance.now() - IN.lastCam > 900) cam.yaw += d * Math.min(1, dt * 4); }
  cam.update(dt, { x: RC.x, y: RC.y + 0.4, z: RC.z, yaw: RC.h, speed: 0 }, world, { dist: 8.5, noAuto: true });
  const pl = RC.kind === 'race' ? ORD[placeNow() - 1] + ' · ' : ''; $('hObj').textContent = RC.st === 'fin' ? '🏁 Finished!' : `🏁 ${pl}${fmt(RC.clock + RC.pen)} · gate ${Math.min(RC.gate, SP.gates.length)}/${SP.gates.length}${RC.missed ? ' · missed ' + RC.missed : ''} · ${Math.round(RC.v * 3.6)} km/h`; }
function finishRace() { RC.fin = RC.clock + RC.pen; RC.st = 'fin'; S.races++; sfx('cheer'); let body, title;
  if (RC.kind === 'race') { const times = racers.map((r) => r.fin != null ? r.fin : RC.clock + (SP.finish.z - r.z) / Math.max(6, r.v)); const place = 1 + times.filter((t) => t < RC.fin).length; const pay = [25, 12, 6, 2][place - 1]; S.coins += pay; if (place === 1) { S.wins++; addMood(8); } else addMood(2);
    title = place === 1 ? '🥇 YOU WON!' : `🏁 ${ORD[place - 1]} place`; body = `Time <b>${fmt(RC.fin)}</b>${RC.pen ? ` (incl. +${RC.pen} s missed gates)` : ''}. Prize: <b>+${pay} 🪙</b><br>` + racers.map((r, i) => `${r.name}: ${fmt(times[i])}`).join(' · ') + (place === 1 ? '<br>Pi-rat: "Rematch! My one eye was full of snow."' : '<br>Luna: "Good race, Candy! Steer tighter through the flags."'); }
  else { const pb = !S.best || RC.fin < S.best; if (pb) { S.best = RC.fin; S.coins += 10; } title = pb ? '⏱️ NEW BEST TIME!' : '⏱️ Time trial'; body = `Time <b>${fmt(RC.fin)}</b>${RC.pen ? ` (incl. +${RC.pen} s)` : ''}. Best: <b>${fmt(S.best)}</b>${pb ? '<br>+10 🪙 for a personal best!' : ''}`; }
  body += `<br>Sled health: ${S.sledHp}%`; save();
  setTimeout(() => msg(title, body, [['🔁 Again', () => startRace(RC.kind)], ['🏘️ Back to town', endRace, 'ghost']]), 900); }
function endRace() { racers.forEach((r) => r.g.visible = false); RC = null; P.mode = 'walk'; P.x = SP.raceSpot.x + 1.5; P.z = SP.raceSpot.z + 2; P.y = H(P.x, P.z); P.yaw = 0; me.mode = 'idle'; rope.visible = true; SL.x = P.x; SL.z = P.z - 2.6; cam.snap = true; cam.yaw = PI; cam.pitch = 0.46; }

// ---------------- interactables ----------------
const spots = () => [
  { ...SP.hatch, r: 2.8, label: DL && DL.cups.some((c) => c.st === 'spilled') && !DL.cups.some((c) => c.st === 'load') ? '☕ Free refill' : '☕ Start a cocoa run', f: cocoaRun },
  { ...SP.raceSpot, r: 3.2, label: '🏁 Sled Hill races', f: raceMenu },
  { x: luna.x, z: luna.z, r: 2.5, label: '🐀 Talk to Luna', f: () => talk('Luna', S.deliveries ? `${S.deliveries} cocoas delivered! Frostpaw Falls loves you, Candy.` : 'Welcome to Candy\'s Cocoa Co.! Grab a cocoa run at the hatch.') },
  { x: torty.x, z: torty.z, r: 3, label: '🐢 Talk to Torty', f: () => { if (S.coins < 3 && S.mood < 40) { S.coins += 5; addMood(10); talk('Torty', 'You look chilly. Warm up by my fire, and here are 5 coins for cocoa money.'); } else talk('Torty', 'Brrr! I\'m staying by the fire. Tortoises and snow are not friends.'); } },
  { x: pirat.x, z: pirat.z, r: 2.5, label: '🏴‍☠️ Talk to Pi-rat', f: () => talk('Pi-rat', S.wins ? `You beat me ${S.wins} time${S.wins > 1 ? 's' : ''}. I'm practising, you'll see!` : 'Race me down Sled Hill! I am the fastest rat on runners.') },
  { x: snowie.x, z: snowie.z, r: 2.5, label: '🐁 Talk to Snowie', f: () => S.sledHp < 100 ? repairMenu() : talk('Snowie', 'Your sled looks great. Wax on, wax off!') },
  ...SP.doors.filter((d) => d.id !== 'shack' || true).map((d) => ({ x: d.x, z: d.z, r: 1.8, label: '🚪 ' + d.name, f: () => talk('Sign', `${d.name} opens its doors in the next preview update!`) })),
  ...(DL ? DL.cups.filter((c) => c.st === 'load').map((c) => ({ x: c.house.x, z: c.house.z, r: 2.6, pri: 2, label: `☕ Deliver to #${c.house.no}`, f: () => deliver(c) })) : []),
];
let near = null;
function nearest() { let best = null, bd = 1e9; for (const s of spots()) { const d0 = Math.hypot(P.x - s.x, P.z - s.z), d = d0 - (s.pri || 0); if (d0 < s.r && d < bd) { bd = d; best = s; } } return best; }

// ---------------- walking + sled trailer ----------------
let gpsT = null, gpsY = 0;
function stepWalk(dt) { const mv = readMove(); P.stun -= dt; let sp = 0; const py = P.yaw; const loaded = DL && DL.cups.some((c) => c.st === 'load');
  if (P.stun <= 0 && (mv.x || mv.y)) { const yaw = cam.moveYaw, fx = Math.sin(yaw), fz = Math.cos(yaw); const dx = fx * mv.y - fz * mv.x, dz = fz * mv.y + fx * mv.x; const want = Math.atan2(dx, dz);
    sp = 6.8 * Math.hypot(mv.x, mv.y); const hx = H(P.x + Math.sin(want), P.z + Math.cos(want)) - H(P.x, P.z); if (hx > 0) sp *= clamp(1 - hx * 1.2, 0.45, 1); // uphill is slower
    P.x += Math.sin(want) * sp * dt; P.z += Math.cos(want) * sp * dt; let d = want - P.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); P.yaw += d * Math.min(1, dt * 10); }
  const gy = H(P.x, P.z); if (edge('jump') && P.y <= gy + 0.01) { P.vy = 6.5; sfx('jump'); if (loaded) DL.slosh += 22; } P.vy -= 18 * dt; P.y = Math.max(gy, P.y + P.vy * dt); if (P.y === gy) P.vy = 0;
  const hit = collide(P, 0.75, P.y - gy + 0.1); P.speed = sp;
  // trailer: sled follows the harness point at a fixed rope length
  const hxp = P.x - Math.sin(P.yaw) * 0.9, hzp = P.z - Math.cos(P.yaw) * 0.9; let vx = SL.x - hxp, vz = SL.z - hzp; const dl = Math.hypot(vx, vz) || 1; if (dl > 2.3) { SL.x = hxp + vx / dl * 2.3; SL.z = hzp + vz / dl * 2.3; }
  const sq = { x: SL.x, z: SL.z }; const sh = collide(sq, 0.6, 0.3); SL.x = sq.x; SL.z = sq.z; SL.yaw = Math.atan2(hxp - SL.x, hzp - SL.z);
  const sy = H(SL.x, SL.z); sled.position.set(SL.x, sy + 0.02, SL.z); sled.rotation.set(0, SL.yaw, 0); const hy = (H(SL.x + Math.sin(SL.yaw), SL.z + Math.cos(SL.yaw)) - H(SL.x - Math.sin(SL.yaw), SL.z - Math.cos(SL.yaw))) / 2; sled.rotation.x = -Math.atan(hy);
  { const a = new THREE.Vector3(SL.x + Math.sin(SL.yaw) * 1.3, sy + 0.4, SL.z + Math.cos(SL.yaw) * 1.3), b = new THREE.Vector3(hxp, P.y + 0.75, hzp); rope.position.copy(a).add(b).multiplyScalar(0.5); rope.scale.set(1, a.distanceTo(b), 1); rope.lookAt(b); rope.rotateX(PI / 2); }
  // cargo slosh: fast sharp turns, jumps and bumps spill cocoa
  if (loaded) { let dy = P.yaw - py; dy = Math.abs(Math.atan2(Math.sin(dy), Math.cos(dy))); DL.slosh += dy * sp * 2.4 + (sp > 6 ? 6 * dt : 0); DL.bump = (DL.bump || 0) - dt; if (((hit && hit.pen > 0.02) || (sh && sh.pen > 0.05)) && sp > 4.5 && DL.bump <= 0) { DL.bump = 0.8; DL.slosh += 38; sfx('bounce'); } DL.slosh = Math.max(0, DL.slosh - 22 * dt); if (DL.slosh >= 100) spill(hit || sh ? 'on a bump' : 'on a sharp turn'); }
  if (DL) { DL.t += dt; DL.warm = Math.max(0, 100 - DL.t * 0.6); if ((DL.g = (DL.g || 0) + dt) > 1) { DL.g = 0; gpsNext(); } } }
let last = performance.now(), saveT = 0;
function step(dt) {
  if (P.mode === 'race' && RC) stepRace(dt); else if (!anyModal()) stepWalk(dt);
  stepPuffs(dt); stepSnow(dt); liftTick(performance.now() / 1000);
  me.x = P.x; me.z = P.z; me.y = P.y; me.yaw = P.yaw; me.speed = P.speed; me.noTurn = true; if (P.mode !== 'race') me.mode = P.speed > 0.1 ? 'walk' : 'idle'; animPet(me, dt, null);
  for (const p of folk) { if (Math.hypot(p.wx - p.x, p.wz - p.z) < 0.5) { p.wx = p.ax + (R() - 0.5) * p.ar * 2; p.wz = p.az + (R() - 0.5) * p.ar * 2; if (collide({ x: p.wx, z: p.wz }, 0.5)) { p.wx = p.x; p.wz = p.z + 0.6; } } const dx = p.wx - p.x, dz = p.wz - p.z, d = Math.hypot(dx, dz) || 1, v = p.skate ? 2.6 : 1.4; p.x += dx / d * v * dt; p.z += dz / d * v * dt; p.yaw = Math.atan2(dx, dz); p.speed = p.skate ? 0.4 : v; if (!p.skate) collide(p, 0.4); for (const o of [[P.x, P.z, 1.3], [SL.x, SL.z, 1.4]]) { const ex = p.x - o[0], ez = p.z - o[1], ed = Math.hypot(ex, ez); if (ed < o[2] && ed > 0.01) { p.x = o[0] + ex / ed * o[2]; p.z = o[1] + ez / ed * o[2]; p.wx = p.x + ex / ed * 3; p.wz = p.z + ez / ed * 3; } } p.y = H(p.x, p.z); p.noTurn = true; animPet(p, dt, null); }
  const t = performance.now() / 1000; kids.forEach((k, i) => { k.y = Math.abs(Math.sin(t * 3 + i)) * 0.25; k.yaw = (i % 2 ? -1 : 1) * 0.6 + (i < 2 ? 1.2 : -1.9); animPet(k, dt, null); });
  for (const p of [luna, snowie, pirat, torty]) animPet(p, dt, P);
  for (const m of marks) { m.userData.a.position.y = 3.4 + Math.sin(t * 3) * 0.3; m.rotation.y = t; }
  // interact
  near = P.mode === 'walk' && !anyModal() ? nearest() : null; const ab = $('actBtn'); ab.classList.toggle('on', !!near); if (near) ab.textContent = near.label;
  if (edge('act') && near) near.f();
  if (P.mode === 'walk') { const loaded = DL && DL.cups.some((c) => c.st === 'load'); $('hObj').textContent = gpsT ? `➤ ${gpsT.name}` + (DL ? ` · cocoa warmth ${Math.round(DL.warm)}%` : '') : loaded ? '☕ Deliver the cocoa' : '☕ Cocoa runs at Candy\'s Cocoa Co. · 🏁 races at the Hill Shack'; }
  const gp = $('gps'); if (gpsT && P.mode === 'walk') { const dx = gpsT.x - P.x, dz = gpsT.z - P.z, d = Math.hypot(dx, dz); gp.classList.add('on'); const rel = Math.atan2(dx, dz) - cam.moveYaw; $('gpsArrow').style.transform = `rotate(${-rel * 180 / PI - 90}deg)`; $('gpsTxt').textContent = `${gpsT.name} · ${Math.round(d)} m`; if (d < 2.5 && !DL) gpsT = null; } else gp.classList.remove('on');
  if (talkT > 0) { talkT -= dt; if (talkT <= 0) $('talk').style.display = 'none'; } if (bigT > 0) { bigT -= dt; if (bigT <= 0) $('bigMsg').style.display = 'none'; }
  if (P.mode === 'walk') cam.update(dt, { x: P.x, y: P.y, z: P.z, yaw: P.yaw, speed: P.speed }, world, {});
  followShadow(P.x, P.y, P.z); hud(); if ((gpsY -= dt) < 0) { gpsY = 0.5; const h = $('hud').getBoundingClientRect(); $('gps').style.top = (h.bottom + 8) + 'px'; } saveT += dt; if (saveT > 5) { saveT = 0; save(); } }
let started = false, wipT = 0;
function loop(now) { requestAnimationFrame(loop); if (now - wipT > 500) { wipT = now; const wb = document.getElementById('ratitaWip'); document.body.classList.toggle('wip', !!wb); if (wb) document.body.style.setProperty('--wip', (wb.getBoundingClientRect().bottom + 6) + 'px'); }
  const dt = Math.min(DTMAX, (now - last) / 1000); last = now; if (started) step(dt); else { stepSnow(dt); cam.yaw += dt * 0.06; cam.update(dt, { x: 0, y: 4, z: -6, yaw: 0, speed: 0 }, null, { dist: 30 }); } trackFps(dt, now); render(dt); }
function start(s) { S = s; P.x = -6; P.z = -16; P.y = 0; P.yaw = PI; SL.x = P.x; SL.z = P.z + 2.6; P.mode = 'walk'; cam.yaw = 0; cam.pitch = 0.46; cam.snap = true; close('title'); document.body.classList.add('playing'); started = true; initAudio(); save();
  if (!S.tut) { S.tut = 1; talk('Luna', 'Snow day! 🎉 Candy, grab a cocoa run at the hatch, then race us down Sled Hill. Your sled is hitched and ready!', 7); } else talk('Luna', 'Welcome back to Frostpaw Falls, Candy!', 3); }
// ---------------- map + menu ----------------
const PLACES = () => [[SP.hatch, "☕ Candy's Cocoa Co."], [SP.raceSpot, '🏁 Hill Shack'], [SP.lodge, '🏔️ Snowpine Lodge'], [SP.lot, '🎄 Tree Lot'], [SP.rink, '⛸️ Skating Rink'], [{ x: 0, z: 9, name: 'Plaza' }, '🌟 Town Tree']];
function drawMap() { const c = $('mapCv'), g = c.getContext('2d'), W = c.width, Hh = c.height; g.fillStyle = '#e8f0fb'; g.fillRect(0, 0, W, Hh); const sx = (x) => W / 2 + x * 3.4, sz = (z) => Hh * 0.62 + z * 3.4 * 0.62 / 0.62 * 0.9;
  g.fillStyle = '#c7d2e3'; g.fillRect(sx(-4), sz(-46), 8 * 3.4, 102 * 3.06); g.fillRect(sx(-63), sz(-3.5), 126 * 3.4, 7 * 3.06); g.fillStyle = '#b8c3d6'; g.fillRect(sx(-15), sz(-15), 30 * 3.4, 30 * 3.06);
  g.fillStyle = '#dbeafe'; g.fillRect(0, 0, W, sz(-46)); g.fillStyle = '#64748b'; g.font = '800 12px system-ui'; g.fillText('▲ Sled Hill', sx(-10), 14);
  for (const h of SP.houses) { g.fillStyle = '#475569'; g.fillRect(sx(h.x) - 4, sz(h.z) - 4, 8, 8); g.fillStyle = '#fff'; g.font = '700 8px system-ui'; g.fillText(h.no, sx(h.x) - 3, sz(h.z) + 3); }
  if (DL) for (const q of DL.cups) if (q.st === 'load') { g.strokeStyle = '#f59e0b'; g.lineWidth = 3; g.beginPath(); g.arc(sx(q.house.x), sz(q.house.z), 8, 0, 7); g.stroke(); }
  g.font = '800 11px system-ui'; for (const [p, n] of PLACES()) { g.fillStyle = '#0f172a'; g.fillText(n, sx(p.x) - 20, sz(p.z) - 6); }
  g.fillStyle = '#dc2626'; g.beginPath(); g.arc(sx(P.x), sz(clamp(P.z, -48, 60)), 6, 0, 7); g.fill();
  const L = $('mapList'); L.innerHTML = ''; for (const [p, n] of PLACES()) { const b = document.createElement('button'); b.textContent = n; b.onclick = () => { gpsT = { x: p.x, z: p.z, name: n }; close('mapUI'); }; L.appendChild(b); } }
$('bMap').onclick = () => { drawMap(); open('mapUI'); };
$('bMenu').onclick = () => { $('menuStats').innerHTML = `☕ Cocoas delivered: <b>${S.deliveries}</b> · spilled: ${S.spills}<br>🏁 Races: ${S.races} · wins: <b>${S.wins}</b> · best trial: ${S.best ? fmt(S.best) : '—'}<br>🛷 Sled: ${S.sledHp}% · wipeouts: ${S.crashes}`; open('menuUI'); };
$('uUnstuck').onclick = () => { if (RC) endRace(); P.x = -6; P.z = -16; P.y = 0; SL.x = P.x; SL.z = P.z + 2.6; cam.snap = true; close('menuUI'); };
$('uSound').onclick = () => { setSound(!SND.on, SND.music); toast(SND.on ? '🔊 Sound on' : '🔇 Sound off'); };
$('uNew').onclick = () => msg('Start over?', 'This wipes your Snow Day save.', [['Yes, new game', () => { DL = null; setMarks(); setCups(); start(fresh()); close('menuUI'); }, 'primary'], ['Cancel', null, 'ghost']]);
const old = load(); $('mContinue').style.display = old ? '' : 'none';
$('mContinue').onclick = () => start(load()); $('mNew').onclick = () => start(fresh());
window.addEventListener('beforeunload', () => started && save()); document.addEventListener('visibilitychange', () => { if (document.hidden && started) save(); });
hud(); requestAnimationFrame(loop);
window.__snow = { cx, H, cam, P, get RC() { return RC; }, get DL() { return DL; }, S: () => S, dropRun: () => { DL = null; setMarks(); setCups(); gpsT = null; }, startRace, cocoaRun, SP };
