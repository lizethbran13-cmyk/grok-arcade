// Torty's Harvest Feast: Thanksgiving hub on the Turbo engine (PREVIEW). Live events follow the real America/Los_Angeles date.
import * as THREE from 'three';
import { E, initEngine, setEnvironment, followShadow, render, trackFps } from './engine.js';
import { IN, initInput, readMove, edge, held } from './input.js';
import { FollowCam } from './cam.js';
import { collide, ray, PI, sign } from './kit.js';
import { initMats, MATS } from './mats.js';
import { makePet, animPet } from './pets.js';
import { makeChefMimo } from './mimo.js';
import { initAudio, sfx, setSound } from './audio.js';
import { $, clamp, toast, rng } from './util.js';
import { buildWorld, makeTurkey, SP } from './world.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------------- live event date (America/Los_Angeles) ----------------
const qd = new URLSearchParams(location.search).get('date');
function laDate() { const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); return p; }
const DATE = /^\d{4}-\d{2}-\d{2}$/.test(qd || '') ? qd : laDate();
const [Y, Mo, D] = DATE.split('-').map(Number);
const TG = { 2025: 27, 2026: 26, 2027: 25, 2028: 23 }[Y] || 26; // Thanksgiving day of November
const md = Mo * 100 + D, tg = 1100 + TG;
const PHASE = md === tg ? 'day' : (md > tg && md <= 1207) ? 'post' : (md >= 1101 && md < tg) ? 'pre' : 'off'; // off-season: Dec 8 - Oct 31
const daysTo = Math.max(0, Math.round((Date.UTC(Mo > 11 || md > tg ? Y + 1 : Y, 10, TG) - Date.UTC(Y, Mo - 1, D)) / 864e5));
const PH = { pre: { badge: `🍂 Parade prep · ${daysTo} day${daysTo === 1 ? '' : 's'} to Thanksgiving`, crowd: 22, guests: 4, live: false },
  day: { badge: '🦃 THANKSGIVING DAY · BIG FEAST + LIVE PARADE', crowd: 44, guests: 12, live: true },
  post: { badge: '🥪 Leftovers week · cleanup crews out', crowd: 24, guests: 6, live: false },
  off: { badge: `❄️ Off-season · Harvest Hollow is resting · ${daysTo} days to next Thanksgiving`, crowd: 14, guests: 3, live: false } }[PHASE];

const canvas = $('c'); initEngine(canvas, new URLSearchParams(location.search).get('q') === 'low' ? 'low' : 'high'); initInput();
const DTMAX = Math.min(0.15, +(new URLSearchParams(location.search).get('dtmax')) || 0.05); // headless test harness only: lets slow software-GL frames keep real time
const scene = E.scene; const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || (window.matchMedia && matchMedia('(pointer: coarse)').matches); const TT = (k, t) => isTouch ? t : k; /* keyboard vs touch hint wording */ if (isTouch) document.body.classList.add('touch');
setEnvironment(PHASE === 'off' ? { skyTop: 0x6d86a8, skyMid: 0xc9d3dc, skyBot: 0xe6ebef, sunDir: [0.4, 0.45, 0.5], sunColor: 0xe8eef5, sunI: 2.0, hemiSky: 0xdfe8f0, hemiGround: 0x6b6f66, hemiI: 1.0, exposure: 0.85, fog: 0xd8dee4, fogD: 0.006, envI: 0.6, bloomT: 1.0, bloomS: 0.2 } : PHASE === 'day' ? { skyTop: 0x3b78c9, skyMid: 0xf4c28a, skyBot: 0xffe0b0, sunDir: [0.5, 0.62, 0.4], sunColor: 0xffd9a0, sunI: 2.7, hemiSky: 0xffe6c4, hemiGround: 0x7a5a2a, hemiI: 0.95, exposure: 0.9, fog: 0xf3cf9e, fogD: 0.004, envI: 0.7, bloomT: 1.0, bloomS: 0.28 }
  : { skyTop: 0x4a7fbf, skyMid: 0xbcd3e6, skyBot: 0xeadfca, sunDir: [0.4, 0.55, 0.45], sunColor: 0xffe8c4, sunI: 2.3, hemiSky: 0xdfe8f2, hemiGround: 0x6a5a3a, hemiI: 0.9, exposure: 0.86, fog: 0xd9d2c2, fogD: 0.0048, envI: 0.65, bloomT: 1.05, bloomS: 0.2 });
initMats(); buildWorld(scene, PHASE);
const world = { ray: (o, d, m, f) => ray(o, d, m, f) };
const R = rng(Date.now() % 100000);

// ---------------- save ----------------
const KEY = 'harvestFeast.v1';
function fresh() { return { coins: 40, mood: 50, bag: { pumpkin: 0, corn: 0, potato: 0, cranberry: 0 }, dishes: [], medals: [], float: { bal: 'pirat', col: 0xf97316, hp: 100 }, cabBest: 0, raked: 0, pieWins: 0, feasts: 0, tut: 0 }; }
function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); return s && s.bag ? Object.assign(fresh(), s) : null; } catch (e) { return null; } }
let S = null; const save = () => { if (S) try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

// ---------------- cast ----------------
const me = makePet('pirat', { s: 1.4, outfit: 'none' }); scene.add(me.root);
const P = { x: 0, z: 16, y: 0, vy: 0, yaw: PI, speed: 0, mode: 'title', stun: 0 };
const cam = new FollowCam(); cam.want = 6.4; cam.hgt = 1.5;
const npc = []; const put = (p, x, z, yaw = 0) => { p.x = x; p.z = z; p.yaw = yaw; scene.add(p.root); npc.push(p); return p; };
const torty = put(makePet('torty', { s: 1.7 }), SP.torty.x, SP.torty.z, PI / 2);
const candy = put(makePet('candy', { s: 2.1 }), SP.pieTable.x + 2.5, SP.pieTable.z + 1.2, 0); candy.home = { x: candy.x, z: candy.z };
const luna = put(makePet('luna', { s: 1.3, extras: ['glasses'] }), 1.5, 11.6, PI);
const snowie = put(makePet('snowie', { s: 1.25 }), -1.6, 11.6, PI);
const pirat2 = null;
const mimo = (() => { const m = makeChefMimo(); m.root.scale.setScalar(1.6); m.root.position.set(SP.kcenter.x + 2.8, 0, SP.kcenter.z + 1.6); m.root.rotation.y = PI * 0.9; scene.add(m.root); return m; })();
[-4.5, 0, 4.5].forEach((dx) => { const L = new THREE.PointLight(0xfff7ec, 14, 13, 1); L.position.set(SP.kcenter.x + dx, 4.2, SP.kcenter.z); scene.add(L); });
// sneaky snack rats
const sneaks = ['ginger', 'cocoa'].map((id, i) => { const p = put(makePet(id, { s: 1.15 }), SP.pie.x + (i ? 9 : -9), SP.pie.z + 6, PI); p.st = 'hide'; p.t2 = 4 + i * 5; p.hx = p.x; p.hz = p.z; return p; });
// townsfolk: count + jobs depend on the live event
const FOLK = ['blue', 'rose', 'black', 'cream', 'brownie', 'ash', 'gold', 'brie'];
const folk = []; const leafM = [];
const leafGeo = (() => { const parts = [], r = rng(77), cols = [[0.85, 0.36, 0.13], [0.93, 0.62, 0.2], [0.7, 0.22, 0.12], [0.62, 0.4, 0.16], [0.95, 0.75, 0.3]];
  const add = (x, y, z, rx, ry, rz, sc) => { const g = new THREE.PlaneGeometry(0.26 * sc, 0.17 * sc); g.rotateX(-PI / 2 + rx); g.rotateY(ry); g.rotateZ(rz); g.translate(x, y, z); const c = cols[Math.floor(r() * 5)], n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set(c, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); parts.push(g); };
  for (let i = 0; i < 150; i++) { const a = r() * PI * 2, d = Math.sqrt(r()) * 0.95, h = Math.cos(d / 0.95 * PI / 2) * 0.55; add(Math.cos(a) * d, 0.03 + h * (0.6 + r() * 0.4), Math.sin(a) * d * 0.85, (r() - 0.5) * 1.6, r() * 6, (r() - 0.5) * 1.2, 0.9 + r() * 0.6); }
  for (let i = 0; i < 26; i++) { const a = r() * PI * 2, d = 1 + r() * 0.9; add(Math.cos(a) * d, 0.02, Math.sin(a) * d, (r() - 0.5) * 0.3, r() * 6, 0, 0.9 + r() * 0.4); }
  const m = mergeGeometries(parts); parts.forEach((g) => g.dispose()); return m; })();
const leafMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
const bagGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.8, 10); bagGeo.translate(0, 0.4, 0); const bagMat = new THREE.MeshLambertMaterial({ color: 0xb08850 });
for (const l of SP.leaves) { const q = { x: l.x, z: l.z }; if (collide(q, 1.1)) continue; const m = new THREE.Mesh(leafGeo, leafMat); m.position.set(l.x, 0, l.z); m.rotation.y = (l.x * 13 + l.z) % 6; m.receiveShadow = true; scene.add(m); l.m = m; l.amt = 1; leafM.push(l); }
if (PHASE === 'off') { const sg = sign('SEE YOU NEXT THANKSGIVING!', 4.2, 0.6, { bg: '#1e3a5f', border: '#bfdbfe' }); sg.position.set(0, 1.9, 8.5); scene.add(sg); }
function bagUp(l) { if (l.bag) return; const g = new THREE.Mesh(bagGeo, bagMat); g.position.set(l.x + 0.9, 0, l.z + 0.5); g.castShadow = true; scene.add(g); l.bag = g; }
function makeRake() { const g = new THREE.Group(), wm = new THREE.MeshLambertMaterial({ color: 0x9a6b3f }), mm = new THREE.MeshLambertMaterial({ color: 0x55606a }); const h = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), wm); h.position.y = 0.75; g.add(h); const bar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.05), mm); bar.position.y = 1.5; g.add(bar); for (let i = 0; i < 7; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.16, 0.025), mm); t.position.set(-0.25 + i * 0.083, 1.56, 0.04); t.rotation.x = 0.5; g.add(t); } return g; }
const ANCH = [[-8, 4, 16], [8, -6, 16], [0, -25, 3], [0, 23, 3], [-8, -8, 12], [30, 0, 4], [-28, 0, 4], [8, 10, 10]];
for (let i = 0; i < PH.crowd; i++) { const p = put(makePet(FOLK[i % FOLK.length], { s: 1.15, outfit: PHASE === 'day' && i % 3 === 0 ? 'party' : 'none' }), 0, 0);
  if (PHASE === 'day' && i >= 8) { const bx = -55 + (i - 8) * 6.2; p.x = bx; p.z = 34 + 7.2 + (i % 3) * 0.8; p.y = 0.45 + (i % 3) * 0.45; p.job = 'watch'; p.yaw = PI; }
  else if (PHASE === 'pre' && i < 7 && leafM.length) { p.job = 'rake'; const l = leafM[(i * 5) % leafM.length]; p.x = l.x + 1.3; p.z = l.z + 0.4; p.tgt = l; }
  else if (PHASE === 'post' && i < 6) { p.job = 'clean'; p.x = -30 + i * 10; p.z = 29.6; }
  else if (i % 3 === 1 && SP.stalls[(i / 3 | 0) % SP.stalls.length]) { const [sx, sz, sr] = SP.stalls[(i / 3 | 0) % SP.stalls.length]; p.job = 'shop'; p.x = sx + Math.sin(sr) * 1.5 + (R() - 0.5) * 0.8; p.z = sz + Math.cos(sr) * 1.5; p.yaw = sr + PI; }
  else { p.job = 'walk'; const an = ANCH[i % ANCH.length]; p.ax = an[0]; p.az = an[1]; p.ar = an[2]; p.x = an[0] + (R() - 0.5) * an[2]; p.z = an[1] + (R() - 0.5) * an[2]; p.wx = p.x; p.wz = p.z; }
  if (p.job === 'rake' || p.job === 'clean') { const rk = makeRake(); rk.position.set(0.22, 0.15, 0.35); rk.rotation.x = 1.05; rk.scale.setScalar(0.8); p.root.add(rk); p.rake = rk; }
  folk.push(p); }
// crazy turkeys
const turkeys = []; const tProto = makeTurkey(false); for (let i = 0; i < (PHASE === 'day' ? 24 : 16); i++) { const g = tProto.clone(); g.scale.setScalar(1.1); scene.add(g); const a = R() * PI * 2; turkeys.push({ g, x: Math.cos(a) * (14 + R() * 20), z: Math.sin(a) * (14 + R() * 16), yaw: a, sp: 0, t: R() * 5, zone: null }); }
const mazeT = [0, 1].map((i) => { const g = makeTurkey(false); scene.add(g); return { g, x: SP.mazeCorn[i].x, z: SP.mazeCorn[i].z, yaw: 0, sp: 0, t: i, zone: SP.mazeBox }; }); turkeys.push(...mazeT);
const gob = { g: makeTurkey(true), x: SP.chase.x, z: SP.chase.z, yaw: PI, i: 0 }; gob.g.scale.setScalar(1.25); scene.add(gob.g);
// crops on Torty's farm
const cropMesh = { pumpkin: [new THREE.SphereGeometry(0.42, 14, 10), [0.94, 0.48, 0.12]], corn: [new THREE.CylinderGeometry(0.12, 0.16, 1.6, 8), [0.95, 0.76, 0.3]], potato: [new THREE.SphereGeometry(0.28, 10, 8), [0.62, 0.45, 0.28]], cranberry: [new THREE.SphereGeometry(0.3, 10, 8), [0.72, 0.1, 0.2]] };
for (const k in cropMesh) { const [g, c] = cropMesh[k]; const n = g.attributes.position.count; g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).map((_, j) => c[j % 3]), 3)); }
for (const c of SP.crops) { const m = new THREE.Mesh(cropMesh[c.kind][0], MATS.g); m.position.set(c.x, c.kind === 'corn' ? 0.8 : 0.35, c.z); m.castShadow = true; scene.add(m); c.m = m; c.ready = true; c.t = 0; }
// golden maze corn
const gcGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.7, 10); gcGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(gcGeo.attributes.position.count * 3).map((_, j) => [1.6, 1.2, 0.3][j % 3]), 3));
const gold = SP.mazeCorn.map((p) => { const m = new THREE.Mesh(gcGeo, MATS.l); m.position.set(p.x, 1, p.z); scene.add(m); return { ...p, m, got: false }; });
// fx pool: fire + flying food
const fireGeo = new THREE.ConeGeometry(0.25, 0.8, 10); fireGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(fireGeo.attributes.position.count * 3).map((_, j) => [2.2, 0.9, 0.2][j % 3]), 3));
const fires = {}; for (const k in SP.app) { const g = new THREE.Group(); for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(fireGeo, MATS.l); m.position.set((i - 2) * 0.22, 0, (i % 2) * 0.2); g.add(m); } const L = new THREE.PointLight(0xff7a1a, 0, 6); L.position.y = 0.5; g.add(L); g.L = L; g.position.set(...SP.app[k]); g.visible = false; scene.add(g); fires[k] = g; }
const flyers = []; const foodGeo = new THREE.SphereGeometry(0.22, 12, 8); foodGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(foodGeo.attributes.position.count * 3).map((_, j) => [0.95, 0.6, 0.25][j % 3]), 3));
function fling(from) { const m = new THREE.Mesh(foodGeo, MATS.g); m.position.set(...from); scene.add(m); flyers.push({ m, vx: (R() - 0.5) * 4, vy: 6 + R() * 2, vz: 3 + R() * 3, t: 0 }); }

// ---------------- UI helpers ----------------
const open = (id) => { $(id).classList.add('on'); }, close = (id) => $(id).classList.remove('on');
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => close(b.dataset.close)));
let talkT = 0; function talk(who, txt, t = 4) { $('talkWho').textContent = who + ': '; $('talkTxt').textContent = txt; $('talk').style.display = 'block'; talkT = t; }
let bigT = 0; function big(t, s = 2.2) { $('bigMsg').innerHTML = t; $('bigMsg').style.display = 'block'; bigT = s; }
function msg(t, b, btns = [['OK', null]]) { $('msgT').textContent = t; $('msgB').innerHTML = b; const w = $('msgBtns'); w.innerHTML = ''; for (const [l, f, cls] of btns) { const e = document.createElement('button'); e.className = cls || 'primary'; e.textContent = l; e.onclick = () => { close('msgUI'); f && f(); }; w.appendChild(e); } open('msgUI'); }
const anyModal = () => document.querySelector('.modal.on');
const ICON = { pumpkin: '🎃', corn: '🌽', potato: '🥔', cranberry: '🍒' };
const DISH = { pie: '🥧 Pumpkin Pie', mash: '🥔 Mashed Potatoes', bread: '🌽 Cornbread', sauce: '🍒 Cranberry Sauce' };
const QN = ['burnt', 'undercooked', 'good', 'PERFECT'];
function hud() { $('hMoney').textContent = '🪙 ' + S.coins; $('hMood').textContent = (S.mood >= 60 ? '😊 ' : S.mood >= 35 ? '😐 ' : '😟 ') + S.mood; $('hBag').textContent = '🧺 ' + Object.keys(ICON).map((k) => ICON[k] + S.bag[k]).join(' '); $('hDish').textContent = '🍽️ ' + S.dishes.length; $('hPhase').textContent = PH.badge; }

// ---------------- interactables ----------------
const spots = () => [
  { ...SP.kitchen, r: 3, label: '👨‍🍳 Cook with Chef Mimo', f: openCook },
  { ...SP.feast, r: 3.2, label: PHASE === 'day' ? '🦃 Serve the BIG FEAST' : PHASE === 'post' ? '🥪 Leftover lunch' : PHASE === 'off' ? '🍲 Cozy supper' : '🍽️ Serve a small feast', f: serveFeast },
  { ...SP.pie, r: 3, label: '🥧 Enter the pie contest', f: pieContest },
  { ...SP.chase, r: 3, label: '🦃 Chase Gobbles!', f: startChase },
  { ...SP.workshop, r: 3.5, label: '🎈 Parade Builder', f: openDesign },
  { ...SP.maze, r: 3.5, label: '🌽 Enter the corn maze', f: startMaze },
  { ...SP.cab, r: 2.2, label: '🕹️ Play #51 Pie Plate Catch', f: openCab },
  { ...SP.torty, r: 3, label: '🐢 Talk to Torty', f: () => { if (!Object.values(S.bag).some((v) => v) && S.coins < 5) { for (const k in S.bag) S.bag[k] += 2; talk('Torty', "Here's a free basket from my pantry. Nobody goes hungry at Harvest Hollow!"); } else talk('Torty', PHASE === 'pre' ? 'Pick anything glowing in my field. It all regrows. The big feast is on Thanksgiving Day!' : PHASE === 'day' ? 'Happy Thanksgiving! The parade is LIVE on Tortuga TV all day. Go join it!' : 'Leftovers for everyone! The field is regrowing for next year.'); } },
];
let near = null;
function nearest() { let best = null, bd = 1e9; for (const s of spots()) { const d = Math.hypot(P.x - s.x, P.z - s.z); if (d < s.r && d < bd) { bd = d; best = s; } }
  for (const c of SP.crops) if (c.ready && Math.hypot(P.x - c.x, P.z - c.z) < 1.4) return { label: ICON[c.kind] + ' Pick ' + c.kind, f: () => { c.ready = false; c.t = 30; c.m.visible = false; S.bag[c.kind]++; sfx('pop'); } };
  for (const l of leafM) if (l.amt > 0.05 && Math.hypot(P.x - l.x, P.z - l.z) < 1.8) return { label: '🍂 Rake leaves', f: () => { l.amt = Math.max(0, l.amt - 0.5); if (l.amt <= 0.05) { bagUp(l); S.coins += 2; S.raked++; toast('Leaf pile cleaned up! +2 🪙'); sfx('coin'); } else sfx('whoosh'); } };
  for (const s of sneaks) if (s.st === 'sneak' && Math.hypot(P.x - s.x, P.z - s.z) < 2.2) return { label: '🐀 Shoo the snack thief!', f: () => { s.st = 'flee'; S.coins += 3; talk('Candy', 'Ruff! Thanks for the backup!'); sfx('cheer'); } };
  return best; }

// ---------------- cooking (Chef Mimo + haywire Ratita appliances) ----------------
const APPS = { oven: { name: 'OVEN-9000', dish: 'pie', need: 'pumpkin', T: 12, w: [9, 12] }, blender: { name: 'Blendo', dish: 'mash', need: 'potato', T: 7, w: [5, 7] }, toaster: { name: 'Toasty', dish: 'bread', need: 'corn', T: 9, w: [7, 9] }, stove: { name: 'Sizzla', dish: 'sauce', need: 'cranberry', T: 8, w: [6, 8] } };
const SASS = ["I'm not a toaster. I'm a TOAST ARTIST.", "Ugh. Fine. But I want a raise.", "Did you just call me a blender? It's BLENDO.", "Error 418: I'm a teapot today.", "I'll cook when I feel APPRECIATED.", "Beep. Boop. No."];
const AS = {}; for (const k in APPS) AS[k] = { st: 'idle', t: 0, ev: 0, free: 0 };
let hayN = 0, cookT = 0, hayT = 6, kitchenGuests = 0;
function openCook() { P.mode = 'cook'; document.body.classList.add('cooking'); $('cookUI').classList.add('on'); kitchenGuests = PH.guests; drawCook(); talk('Chef Mimo', S.metMimo ? 'Back again! My brother Gio says hi from the Grok Arcade food court. Let\'s cook!' : (S.metMimo = 1, 'Ciao! I\'m Chef Mimo, Chef Gio\'s big brother. He runs the Grok Arcade food court; I run the Harvest Hollow kitchen. Ratita Industries made my appliances SMART. Too smart.')); }
function leaveCook() { document.body.classList.remove('cooking'); P.mode = 'walk'; $('cookUI').classList.remove('on'); P.x = SP.kitchen.x; P.z = SP.kitchen.z + 2; cam.snap = true; for (const k in AS) if (['cooking', 'fire', 'launch', 'sulk'].includes(AS[k].st)) { AS[k].st = 'idle'; fires[k].visible = false; } }
$('ckLeave').onclick = leaveCook;
function finishDish(k, q) { const a = APPS[k]; if (q === 0) { S.mood = clamp(S.mood - 4, 0, 100); toast(`${DISH[a.dish]} BURNT! Guests are grumbling (😟 -4)`, true); sfx('lose'); } else { S.dishes.push({ k: a.dish, q }); toast(`${DISH[a.dish]}: ${QN[q]}!`); sfx(q === 3 ? 'cheer' : 'coin'); } AS[k].st = 'idle'; AS[k].t = 0; fires[k].visible = false; }
function drawCook() { const w = $('ckApps'); let h = '';
  for (const k in APPS) { const a = APPS[k], s = AS[k]; const pct = clamp(s.t / (a.T + 3), 0, 1) * 100, w0 = a.w[0] / (a.T + 3) * 100, w1 = (a.w[1] - a.w[0]) / (a.T + 3) * 100; let btn = '', say = s.say || '';
    if (s.st === 'idle') btn = S.bag[a.need] >= 2 ? `<button data-k="${k}" data-a="cook">Cook ${DISH[a.dish]} (2${ICON[a.need]})</button>` : `<span>Needs 2 ${ICON[a.need]} from Torty's farm</span>`;
    else if (s.st === 'cooking') btn = `<button class="g" data-k="${k}" data-a="out">Take out!</button>`;
    else if (s.st === 'fire') btn = `<button class="r" data-k="${k}" data-a="spray">🧯 SPRAY! ${s.ev.toFixed(1)}s</button>`;
    else if (s.st === 'launch') btn = `<button class="y" data-k="${k}" data-a="catch">🫴 CATCH! ${s.ev.toFixed(1)}s</button>`;
    else if (s.st === 'sulk') btn = `<button class="y" data-k="${k}" data-a="please">🙏 Say please</button>`;
    else if (s.st === 'broken') btn = `<button data-k="${k}" data-a="repair">🔧 Repair 15🪙</button>` + (s.free > 0 ? `<span> Free Ratita Tech: ${Math.ceil(s.free)}s</span>` : `<button class="g" data-k="${k}" data-a="free">📞 Free repair (20s)</button>`);
    h += `<div class="app ${s.st}"><b>${s.st === 'fire' ? '🔥 ' : ''}${a.name}</b><span>${s.st === 'broken' ? 'BROKEN' : s.st}</span><div class="bar"><i style="left:${w0}%;width:${w1}%"></i><u style="width:${s.st === 'idle' || s.st === 'broken' ? 0 : pct}%"></u></div><div class="say">${say}</div>${btn}</div>`; }
  w.innerHTML = h; $('ckGuests').textContent = `🧑‍🤝‍🧑 ${kitchenGuests} guests waiting · 🍽️ ${S.dishes.length} dishes ready · 🪙 ${S.coins}`; }
$('ckApps').addEventListener('pointerdown', (e) => { const b = e.target.closest('button'); if (!b) return; const k = b.dataset.k, a = APPS[k], s = AS[k];
  if (b.dataset.a === 'cook' && S.bag[a.need] >= 2) { S.bag[a.need] -= 2; s.st = 'cooking'; s.t = 0; s.say = ''; sfx('whoosh'); }
  else if (b.dataset.a === 'out') { finishDish(k, s.t < a.w[0] ? 1 : s.t <= a.w[1] ? 3 : 2); }
  else if (b.dataset.a === 'spray') { s.st = 'cooking'; s.t = Math.max(0, s.t - 2); fires[k].visible = false; s.say = '*cough* ...thanks.'; sfx('whoosh'); }
  else if (b.dataset.a === 'catch') { s.st = 'cooking'; s.say = 'Nice catch!'; sfx('point'); }
  else if (b.dataset.a === 'please') { s.st = 'cooking'; s.say = 'Well... since you asked nicely.'; sfx('point'); }
  else if (b.dataset.a === 'repair') { if (S.coins >= 15) { S.coins -= 15; s.st = 'idle'; s.say = 'Good as new!'; sfx('coin'); } else toast('Not enough coins. Use the free Ratita Tech repair!', true); }
  else if (b.dataset.a === 'free') { s.free = 20; s.say = 'Ratita Tech is on the way...'; }
  drawCook(); });
let ckDraw = 0;
function stepCook(dt) {
  cookT += dt; hayT -= dt; const cooking = Object.keys(AS).filter((k) => AS[k].st === 'cooking');
  if (hayT <= 0 && cooking.length) { hayT = 4 + R() * 4; hayN++; const k = cooking[Math.floor(R() * cooking.length)], s = AS[k], ev = R();
    if (ev < 0.38) { s.st = 'fire'; s.ev = 3.5; fires[k].visible = true; s.say = 'AAAH I AM ON FIRE. THIS IS FINE.'; sfx('hurt'); talk('Chef Mimo', `${APPS[k].name} is on fire! Spray it!`, 2.5); }
    else if (ev < 0.7) { s.st = 'launch'; s.ev = 2.6; fling(SP.app[k]); fling(SP.app[k]); s.say = 'WHEEEE! Food goes UP!'; sfx('jump'); }
    else { s.st = 'sulk'; s.say = SASS[Math.floor(R() * SASS.length)]; sfx('pop'); } }
  for (const k in AS) { const s = AS[k], a = APPS[k];
    if (s.st === 'cooking') { s.t += dt; if (s.t > a.T + 3) { finishDish(k, 0); s.st = 'fire'; s.ev = 3; fires[k].visible = true; s.say = 'You left it in! Now I am a bonfire!'; } }
    else if (s.st === 'fire') { s.ev -= dt; if (s.ev <= 0) { s.st = 'broken'; fires[k].visible = false; S.mood = clamp(S.mood - 5, 0, 100); s.say = 'Kaput. Repair me?'; toast(`${a.name} burned out! Dish lost, guests unhappy (😟 -5). Repair costs 15🪙 or wait for free Ratita Tech.`, true); sfx('lose'); } }
    else if (s.st === 'launch') { s.ev -= dt; if (s.ev <= 0) { s.st = 'idle'; s.t = 0; S.mood = clamp(S.mood - 2, 0, 100); s.say = 'Oops. It is on the ceiling now.'; toast(`${a.name} launched your food across the kitchen! Ingredients lost.`, true); sfx('splat'); } }
    if (s.st === 'broken' && s.free > 0) { s.free -= dt; if (s.free <= 0) { s.st = 'idle'; s.say = 'Ratita Tech fixed me for free!'; } } }
  for (const k in fires) if (fires[k].visible) { fires[k].children.forEach((m, i) => { if (m.isMesh) m.scale.set(1, 0.7 + Math.sin(performance.now() / 70 + i * 2) * 0.35, 1); }); fires[k].L.intensity = 6 + Math.sin(performance.now() / 50) * 3; }
  ckDraw -= dt; if (ckDraw <= 0) { ckDraw = 0.12; drawCook(); }
  const c = SP.kitchenCam; E.camera.position.set(c.x + Math.sin(performance.now() / 3000) * 0.4, c.y, c.z); E.camera.lookAt(c.tx, c.ty, c.tz);
  mimo.root.rotation.y = PI + Math.sin(performance.now() / 400) * 0.6; mimo.body.position.y = Math.abs(Math.sin(performance.now() / 150)) * 0.03; mimo.aR.rotation.x = -0.9 + Math.sin(performance.now() / 120) * 0.35; }
function stepFlyers(dt) { for (let i = flyers.length - 1; i >= 0; i--) { const f = flyers[i]; f.t += dt; f.vy -= 12 * dt; f.m.position.x += f.vx * dt; f.m.position.y += f.vy * dt; f.m.position.z += f.vz * dt; if (f.m.position.y < 0.1) { f.m.position.y = 0.1; f.vx = f.vy = f.vz = 0; } if (f.t > 4) { scene.remove(f.m); flyers.splice(i, 1); } } }

// ---------------- feast + pie contest ----------------
function serveFeast() { if (!S.dishes.length) { if (PHASE === 'post') { S.mood = clamp(S.mood + 3, 0, 100); talk('Luna', 'Leftover sandwiches for everyone! Free and delicious.'); return; } talk('Luna', 'The table is empty! Cook something in Chef Mimo\'s kitchen first.'); return; }
  const n = PH.guests, served = S.dishes.splice(0, 6), pts = served.reduce((a, d) => a + d.q, 0), kinds = new Set(served.map((d) => d.k)).size; const need = PHASE === 'day' ? 10 : 5;
  const happy = clamp(Math.round((pts + kinds) / (need + 2) * n), 0, n); const coins = happy * (PHASE === 'day' ? 6 : 4); S.coins += coins; S.mood = clamp(S.mood + (happy >= n * 0.7 ? 12 : happy >= n / 2 ? 4 : -8), 0, 100); S.feasts++;
  msg(PHASE === 'day' ? '🦃 THE BIG FEAST!' : PHASE === 'post' ? '🥪 Leftover Lunch' : PHASE === 'off' ? '🍲 Cozy Supper' : '🍽️ A Small Feast', `You served ${served.map((d) => DISH[d.k] + ' (' + QN[d.q] + ')').join(', ')}.<br><b>${happy} of ${n}</b> guests are happy. +${coins} 🪙${happy < n / 2 ? '<br>Some guests left hungry. Cook more kinds of dishes, and take them out in the green!' : ''}`);
  sfx(happy >= n / 2 ? 'cheer' : 'lose'); }
let pieEv = null;
function pieContest() { const i = S.dishes.findIndex((d) => d.k === 'pie'); if (i < 0) { talk('Candy', 'Woof! You need a Pumpkin Pie to enter. The OVEN-9000 bakes them (2 🎃).'); return; }
  const pie = S.dishes.splice(i, 1)[0]; pieEv = { q: pie.q, t: 5, shoo: false }; const s = sneaks[0]; s.st = 'sneak'; s.x = SP.pieTable.x + 5; s.z = SP.pieTable.z + 2;
  talk('Candy', 'Your pie is on the judging table. Watch out, a rat is sneaking for a slice! Shoo it!', 4); }
function judgePie() { const q = pieEv.q - (pieEv.shoo ? 0 : 1); pieEv = null; const place = q >= 3 ? 1 : q === 2 ? 2 : q === 1 ? 3 : 0; const prize = [0, 40, 20, 8][place];
  S.coins += prize; if (place === 1) { S.pieWins++; S.mood = clamp(S.mood + 6, 0, 100); }
  msg('🥧 Pie Contest Results', place ? `The judges give you <b>${['', '🥇 1st', '🥈 2nd', '🥉 3rd'][place]} place</b>! +${prize} 🪙` : 'The judges took one bite of the burnt crust... no ribbon this time. Bake another pie and try again (entry is free).', [['OK', null]]); sfx(place ? 'cheer' : 'lose'); }

// ---------------- turkey chase ----------------
let CH = null; const pumps = [];
const pumpGeo = new THREE.SphereGeometry(0.5, 14, 10); pumpGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pumpGeo.attributes.position.count * 3).map((_, j) => [0.94, 0.48, 0.12][j % 3]), 3));
function startChase() { if (P.mode === 'cook') leaveCook(); CH = { t: 70, stunT: 0, pT: 3, dir: 1, flipT: 0, peckT: 7 }; { const cp = SP.chasePath, k = Math.min(3, cp.length - 1); gob.x = cp[k][0]; gob.z = cp[k][1]; gob.i = (k + 1) % cp.length; } P.mode = 'chase'; talk('Torty', 'Gobbles escaped my Tortuga Tech float! Catch him! Jump the hay bales (' + TT('Space', 'tap ⤒') + ') and dodge rolling pumpkins!'); big('🦃 CATCH GOBBLES!'); sfx('whoosh'); }
function endChase(win) { P.mode = 'walk'; for (const p of pumps) scene.remove(p.m); pumps.length = 0; gob.x = SP.chase.x; gob.z = SP.chase.z; gob.yaw = PI;
  if (win) { S.coins += 35; if (!S.medals.includes('gobble')) S.medals.push('gobble'); S.mood = clamp(S.mood + 5, 0, 100); msg('🦃 Gotcha, Gobbles!', 'You caught Gobbles and walked him back to the Tortuga Tech float. Torty pays you <b>35 🪙</b> and the Gobble Medal!'); sfx('cheer'); }
  else { const fee = Math.min(S.coins, 10); S.coins -= fee; S.mood = clamp(S.mood - 3, 0, 100); msg('💨 Gobbles got away!', `Gobbles knocked over the town's pumpkin display on his way out. Cleanup cost <b>${fee} 🪙</b>.<br>Torty brought him back with a snack. Try again, it's free!`, [['Try again', startChase], ['Later', null, 'ghost']]); sfx('lose'); } }
function stepChase(dt) { CH.t -= dt; const path = SP.chasePath; const [tx, tz] = path[gob.i]; const dx = tx - gob.x, dz = tz - gob.z, d = Math.hypot(dx, dz);
  const pd = Math.hypot(P.x - gob.x, P.z - gob.z); const sp = (pd < 4 ? 5.6 : pd > 14 ? 3.2 : 5.2) * ((gob.y || 0) > 0.2 ? 0.6 : 1); CH.dir = CH.dir || 1; CH.flipT = (CH.flipT || 0) - dt; CH.peckT = (CH.peckT == null ? 7 : CH.peckT) - dt; const pw = Math.hypot(P.x - tx, P.z - tz); if (CH.flipT <= 0 && pw < 4 && pd > 2.2 && pd < 9) { CH.dir = -CH.dir; gob.i = (gob.i - CH.dir + path.length) % path.length; CH.flipT = 6; toast('🦃 Gobbles spotted you ahead and doubled back!'); } if (CH.peckT < 0) { if (CH.peckT < -1.4) CH.peckT = 6 + R() * 4; else if (CH.peckT > -dt * 1.5) toast('🦃 Gobbles stopped to peck a corn kernel. Now!'); } else if (d < 0.6) gob.i = (gob.i + CH.dir + path.length) % path.length; else { gob.x += dx / d * sp * dt; gob.z += dz / d * sp * dt; gob.yaw = Math.atan2(dx, dz); }
  let hy = 0; for (const [hx, hz] of SP.hurdles) if (Math.hypot(gob.x - hx, gob.z - hz) < 1.4) hy = 0.9; gob.y = (gob.y || 0) + (hy - (gob.y || 0)) * Math.min(1, dt * 10);
  CH.pT -= dt; if (CH.pT <= 0) { CH.pT = 2.2 + R() * 1.5; const m = new THREE.Mesh(pumpGeo, MATS.g); m.castShadow = true; const a = Math.atan2(P.x - gob.x, P.z - gob.z); m.position.set(gob.x, 0.5, gob.z); scene.add(m); pumps.push({ m, vx: Math.sin(a) * 7, vz: Math.cos(a) * 7, t: 0 }); }
  for (let i = pumps.length - 1; i >= 0; i--) { const p = pumps[i]; p.t += dt; p.m.position.x += p.vx * dt; p.m.position.z += p.vz * dt; p.m.rotation.x += dt * 8;
    if (Math.hypot(p.m.position.x - P.x, p.m.position.z - P.z) < 0.9 && P.y < 0.5) { P.stun = 1.1; scene.remove(p.m); pumps.splice(i, 1); const lose = Math.min(S.coins, 2); S.coins -= lose; toast(`Bonk! A rolling pumpkin flattened you. Dropped ${lose} 🪙`, true); sfx('hurt'); continue; }
    if (p.t > 4) { scene.remove(p.m); pumps.splice(i, 1); } }
  if (pd < 1.6) return endChase(true); if (CH.t <= 0) return endChase(false);
  $('hObj').textContent = `🦃 Catch Gobbles! ⏱ ${Math.ceil(CH.t)}s · ${Math.round(pd)} m away`; }

// ---------------- parade builder + drive ----------------
const BAL = [['pirat', '🏴‍☠️ Pi-rat'], ['luna', '🐭 Luna'], ['snowie', '🐁 Snowie'], ['candy', '🐶 Candy'], ['torty', '🐢 Torty'], ['gobbles', '🦃 Gobbles'], ['elf', '🧝 Elf (Nov 26 Elf Parade)']];
const FCOL = [[0xf97316, '🟧'], [0xdc2626, '🟥'], [0x16a34a, '🟩'], [0x2563eb, '🟦'], [0x9333ea, '🟪'], [0xfacc15, '🟨']];
function drawDesign() { const f = S.float; $('dBal').innerHTML = BAL.map(([k, n]) => `<button data-b="${k}" class="${f.bal === k ? 'sel' : ''}">${n}</button>`).join(''); $('dCol').innerHTML = FCOL.map(([c, n]) => `<button data-c="${c}" class="${f.col === c ? 'sel' : ''}">${n}</button>`).join('');
  const cost = Math.ceil((100 - f.hp) * 0.4);
  $('dInfo').innerHTML = (PH.live ? '📺 <b>The Thanksgiving Day Parade is LIVE on Tortuga TV Network all day!</b> Every arch you clear wins crowd cheers and coins.' : PHASE === 'pre' ? `🛠️ Parade PREP: practice runs only. The real parade goes live on Thanksgiving Day (in ${daysTo} days).` : PHASE === 'off' ? `❄️ Off-season: the floats are in storage, but practice runs are open. Next parade in ${daysTo} days.` : '📦 The parade is over. Floats are being packed away; practice runs are still open.') + `<br>Float health: <b>${f.hp}%</b>. Crashing into the arch banners damages the balloon. Repairs cost coins.`;
  $('dRepair').textContent = `🔧 Repair (${cost} 🪙)`; $('dRepair').disabled = f.hp >= 100; $('dTape').style.display = f.hp < 60 && S.coins < cost ? '' : 'none'; $('dGo').disabled = f.hp < 25; }
function openDesign() { if (P.mode === 'cook') leaveCook(); drawDesign(); open('designUI'); }
$('dBal').onclick = (e) => { const b = e.target.closest('button'); if (b) { S.float.bal = b.dataset.b; drawDesign(); } };
$('dCol').onclick = (e) => { const b = e.target.closest('button'); if (b) { S.float.col = +b.dataset.c; drawDesign(); } };
$('dRepair').onclick = () => { const c = Math.ceil((100 - S.float.hp) * 0.4); if (S.coins >= c) { S.coins -= c; S.float.hp = 100; sfx('coin'); } else toast('Not enough coins. Take the free duct-tape patch!', true); drawDesign(); };
$('dTape').onclick = () => { S.float.hp = Math.max(S.float.hp, 60); toast('Free Ratita duct tape! Float patched to 60%.'); drawDesign(); };
let PA = null; const floatG = new THREE.Group(); scene.add(floatG); floatG.visible = false;
function buildFloat() { while (floatG.children.length) floatG.remove(floatG.children[0]); const f = S.float;
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.9, 2.4), new THREE.MeshStandardMaterial({ color: f.col, roughness: 0.6 })); base.position.y = 0.7; base.castShadow = true; floatG.add(base);
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 2.6), new THREE.MeshStandardMaterial({ color: 0xfde047 })); skirt.position.y = 0.3; floatG.add(skirt);
  let bal; if (f.bal === 'gobbles') { bal = makeTurkey(true); bal.scale.setScalar(3.2); } else if (f.bal === 'elf') { bal = new THREE.Group(); const m = (g, c, y, s) => { const x = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 })); x.position.y = y; x.scale.setScalar(s); bal.add(x); return x; }; m(new THREE.SphereGeometry(1, 20, 14), 0x16a34a, 1.2, 1.1); m(new THREE.SphereGeometry(0.7, 20, 14), 0xfcd9b6, 2.8, 1); m(new THREE.ConeGeometry(0.7, 1.6, 20), 0xdc2626, 3.9, 1); m(new THREE.SphereGeometry(0.2, 10, 8), 0xffffff, 4.7, 1); }
  else { const p = makePet(f.bal, { s: f.bal === 'torty' ? 4.5 : 4.2, extras: f.bal === 'luna' ? ['glasses'] : [] }); bal = p.root; }
  const holder = new THREE.Group(); holder.add(bal); bal.position.y = f.bal === 'gobbles' || f.bal === 'elf' ? -1.6 : -1.2; holder.position.y = 6.4; floatG.add(holder); floatG.bal = holder;
  const lineM = new THREE.LineBasicMaterial({ color: 0x111111 }); const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1.1, 0), new THREE.Vector3(0, 6, 0)]); floatG.line = new THREE.Line(lg, lineM); floatG.add(floatG.line); }
function startParade() { if (S.float.hp < 25) return; close('designUI'); buildFloat(); floatG.visible = true; PA = { x: SP.parade0.x, z: SP.parade0.z, v: 3, bz: 0, next: 0, cleared: 0, hits: 0, cheer: 0 }; P.mode = 'parade'; me.root.visible = false;
  PA.arches = SP.arches.slice().sort((a, b) => b.x - a.x).filter((a) => a.x < PA.x); big(PH.live ? '📺 LIVE ON TORTUGA TV!' : '🛠️ PRACTICE RUN'); if (PH.live) talk('Snowie', "Welcome back to Tortuga TV's Thanksgiving Day Parade! Here comes a brand new float!", 4); }
$('dGo').onclick = startParade;
function stepParade(dt) { const mv = readMove(); PA.v = clamp(PA.v + mv.y * dt * 3, 2, 7); PA.x -= PA.v * dt; PA.z = clamp(PA.z - mv.x * dt * 4 * (cam.moveYaw > 0 ? 1 : 1), 34 - 3.4, 34 + 3.4);
  PA.bz += (PA.z - 34 - PA.bz) * Math.min(1, dt * 1.6); floatG.position.set(PA.x, 0, PA.z); floatG.rotation.y = -PI / 2; const b = floatG.bal; b.position.z = 0; b.position.x = (PA.bz - (PA.z - 34)); b.rotation.z = Math.sin(performance.now() / 700) * 0.06; b.position.y = 6.4 + Math.sin(performance.now() / 500) * 0.15;
  const a = PA.arches[PA.next]; if (a && PA.x < a.x) { PA.next++; const bz = 34 + PA.bz; if (Math.abs(bz - (34 + a.gap)) < 1.5) { PA.cleared++; const c = PH.live ? 6 : 1; S.coins += c; toast(`Arch cleared! ${PH.live ? '📣 The crowd roars!' : ''} +${c} 🪙`); sfx('cheer'); PA.cheer = 1.5; }
    else { PA.hits++; S.float.hp = Math.max(0, S.float.hp - 25); toast(`💥 The balloon hit the arch banner! Float ${S.float.hp}%`, true); sfx('splat'); if (S.float.hp <= 0) return endParade(true); } }
  if (PA.x < SP.paradeEnd) return endParade(false);
  for (const f of folk) if (f.job === 'watch') f.rig.body.position.y = PA.cheer > 0 ? Math.abs(Math.sin(performance.now() / 120 + f.x)) * 0.25 : 0; PA.cheer -= dt;
  const nx = PA.arches[PA.next]; $('hObj').textContent = `🎈 ${PH.live ? 'LIVE' : 'Practice'} · ${TT('steer A/D so the balloon fits the banner GAP · W faster / S slower', 'drag the thumb-stick left/right to fit the banner GAP · push up faster / down slower')} · float ${S.float.hp}%` + (nx ? ` · next arch ${Math.round(PA.x - nx.x)} m` : '');
  cam.update(dt, { x: PA.x, y: 3.5, z: PA.z, yaw: PI / 2, speed: 0 }, null, { dist: 15, noAuto: true }); }
function endParade(burst) { P.mode = 'walk'; floatG.visible = false; me.root.visible = true; P.x = SP.workshop.x - 2; P.z = SP.workshop.z; cam.snap = true;
  const tv = PA.cleared * (PH.live ? 12 : 0); if (!burst && PH.live) { S.coins += 15; S.mood = clamp(S.mood + 6, 0, 100); }
  msg(burst ? '🎈💥 POP!' : PH.live ? '📺 Parade complete!' : '🛠️ Practice run done', burst ? 'Your balloon popped on an arch! The float needs repairs at the Float Workshop (or a free duct-tape patch if you are broke).' : `Arches cleared: <b>${PA.cleared}</b> · crashes: <b>${PA.hits}</b>.` + (PH.live ? `<br>Tortuga TV ratings: <b>${tv}k viewers</b>! Finish bonus +15 🪙. The parade runs all day, so go again anytime!` : `<br>The real parade goes live on Thanksgiving Day.`)); sfx(burst ? 'lose' : 'cheer'); PA = null; }

// ---------------- corn maze ----------------
let MZ = null;
function startMaze() { if (P.mode === 'cook') leaveCook(); MZ = { t: 120 }; for (const g of gold) { g.got = false; g.m.visible = true; } P.x = SP.mazeIn.x; P.z = SP.mazeIn.z; cam.snap = true; P.mode = 'maze'; big('🌽 Find 3 golden corn, then the exit!' + TT('', ' (thumb-stick to move)')); }
function stepMaze(dt) { MZ.t -= dt; for (const g of gold) { g.m.rotation.y += dt * 2; if (!g.got && Math.hypot(P.x - g.x, P.z - g.z) < 1.2) { g.got = true; g.m.visible = false; sfx('coin'); toast('🌽 Golden corn!'); } }
  for (const t of mazeT) if (Math.hypot(P.x - t.x, P.z - t.z) < 1 && P.stun <= 0) { P.stun = 0.8; const g = gold.find((q) => q.got); if (g) { g.got = false; g.m.visible = true; toast('A crazy turkey bumped you! You dropped a golden corn back where you found it.', true); } sfx('hurt'); }
  const n = gold.filter((g) => g.got).length; $('hObj').textContent = `🌽 Golden corn ${n}/3 · ⏱ ${Math.ceil(MZ.t)}s`;
  if (n === 3 && Math.hypot(P.x - SP.mazeExit.x, P.z - SP.mazeExit.z) < 2.5) { P.mode = 'walk'; S.coins += 30; S.mood = clamp(S.mood + 4, 0, 100); msg('🌽 You beat the maze!', 'All three golden corn, and you found the way out! +30 🪙'); sfx('cheer'); MZ = null; return; }
  if (MZ.t <= 0) { P.mode = 'walk'; P.x = SP.maze.x; P.z = SP.maze.z - 2; cam.snap = true; S.mood = clamp(S.mood - 2, 0, 100); msg('🚜 Lost in the corn!', "Time's up! Torty's tractor towed you out for free. Try again whenever you like."); sfx('lose'); MZ = null; } }

// ---------------- bonus cabinet #51 Pie Plate Catch ----------------
let CB = null; const cv = $('cabCv'), cx = cv.getContext('2d');
function openCab() { if (P.mode === 'cook') leaveCook(); open('cabUI'); CB = { t: 30, end: performance.now() + 30000, last: performance.now(), x: 180, items: [], score: 0, lives: 3, sp: 0.6 }; P.mode = 'cab'; }
function closeCab(done) { close('cabUI'); P.mode = 'walk'; if (CB && done) { const c = Math.floor(CB.score / 2); S.coins += c; S.cabBest = Math.max(S.cabBest, CB.score); msg('🕹️ #51 Pie Plate Catch', `Score <b>${CB.score}</b> (best ${S.cabBest}). +${c} 🪙`); } CB = null; }
$('cabX').onclick = () => closeCab(false);
cv.addEventListener('pointermove', (e) => { if (!CB) return; const r = cv.getBoundingClientRect(); CB.x = (e.clientX - r.left) / r.width * 360; });
function stepCab(dt) { { const now = performance.now(); dt = Math.min(0.1, (now - CB.last) / 1000); CB.last = now; } const K = IN.keys; if (K.ArrowLeft || K.KeyA) CB.x -= 320 * dt; if (K.ArrowRight || K.KeyD) CB.x += 320 * dt; CB.x = clamp(CB.x, 30, 330); CB.t = Math.max(0, (CB.end - performance.now()) / 1000); CB.sp -= dt;
  if (CB.sp <= 0) { CB.sp = 0.45 + R() * 0.35; const k = R(); CB.items.push({ x: 20 + R() * 320, y: -20, v: 120 + R() * 90 + (30 - CB.t) * 4, k: k < 0.22 ? 'toast' : k < 0.6 ? 'pie' : 'corn' }); }
  for (let i = CB.items.length - 1; i >= 0; i--) { const it = CB.items[i]; it.y += it.v * dt; if (it.y > 352 && it.y < 376 && Math.abs(it.x - CB.x) < 40) { if (it.k === 'toast') { CB.lives--; sfx('hurt'); } else { CB.score += it.k === 'pie' ? 2 : 1; sfx('point'); } CB.items.splice(i, 1); } else if (it.y > 420) CB.items.splice(i, 1); }
  const g = cx; g.fillStyle = '#1e1b4b'; g.fillRect(0, 0, 360, 400); g.fillStyle = '#312e81'; for (let i = 0; i < 9; i++) g.fillRect(i * 40, 0, 2, 400);
  g.font = '30px system-ui'; g.textAlign = 'center'; for (const it of CB.items) g.fillText(it.k === 'toast' ? '🔥' : it.k === 'pie' ? '🥧' : '🌽', it.x, it.y);
  g.fillStyle = '#f8fafc'; g.beginPath(); g.ellipse(CB.x, 370, 42, 9, 0, 0, PI * 2); g.fill(); g.fillStyle = '#fde047'; g.font = '900 18px system-ui'; g.textAlign = 'left'; g.fillText(`Score ${CB.score}   ⏱ ${Math.ceil(CB.t)}   ${'❤️'.repeat(Math.max(0, CB.lives))}`, 10, 24);
  if (CB.t <= 0 || CB.lives <= 0) closeCab(true); }

// ---------------- map + menu ----------------
function drawMap() { const g = $('mapCv').getContext('2d'), W = 520, H = 440, s = 2.6, ox = W / 2, oz = H / 2 - 20, X = (x) => ox + x * s, Z = (z) => oz + z * s * 0.9;
  g.fillStyle = '#7f9a45'; g.fillRect(0, 0, W, H); g.fillStyle = '#4b4b52'; g.fillRect(X(-75), Z(30), 150 * s, 8 * s * 0.9); g.fillStyle = '#8c7a66'; g.fillRect(X(-15), Z(-15), 30 * s, 30 * s * 0.9);
  g.fillStyle = '#6b8a2a'; const mb = SP.mazeBox; g.fillRect(X(mb[0]), Z(mb[1]), (mb[2] - mb[0]) * s, (mb[3] - mb[1]) * s * 0.9); g.fillStyle = '#6b4a2e'; g.fillRect(X(-52), Z(-15), 14 * s, 18 * s * 0.9);
  g.font = '800 13px system-ui'; g.textAlign = 'center';
  for (const p of [SP.kitchen, SP.feast, SP.pie, SP.chase, SP.workshop, SP.maze, SP.cab, SP.torty]) { g.fillStyle = '#fde047'; g.beginPath(); g.arc(X(p.x), Z(p.z), 5, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillText(p.name, X(p.x), Z(p.z) - 8); }
  g.fillStyle = '#ef4444'; g.beginPath(); g.arc(X(P.x), Z(P.z), 6, 0, 7); g.fill();
  $('mapList').innerHTML = [SP.kitchen, SP.feast, SP.pie, SP.chase, SP.workshop, SP.maze, SP.cab, SP.torty].map((p, i) => `<button data-i="${i}">${p.name}</button>`).join(''); }
let gpsT = null; $('mapList').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; gpsT = [SP.kitchen, SP.feast, SP.pie, SP.chase, SP.workshop, SP.maze, SP.cab, SP.torty][+b.dataset.i]; close('mapUI'); };
$('bMap').onclick = () => { drawMap(); open('mapUI'); };
function drawMenu() { $('menuStats').innerHTML = `📅 ${DATE} (America/Los_Angeles${qd ? ', <b>test override</b>' : ''}) · ${PH.badge}<br>🪙 ${S.coins} · 😊 mood ${S.mood} · 🥧 pie wins ${S.pieWins} · 🍽️ feasts ${S.feasts} · 🍂 leaf piles raked ${S.raked} · 🕹️ #51 best ${S.cabBest}` + (S.medals.includes('gobble') ? ' · 🏅 Gobble Medal' : '');
  const opts = [['', '📡 Live date'], [`${Y}-11-10`, '🍂 Pre (Nov 10)'], [`${Y}-11-${TG}`, '🦃 Thanksgiving'], [`${Y}-11-${TG + 2}`, '🥪 After'], [`${Y}-12-12`, '❄️ Off-season']]; $('dateChips').innerHTML = opts.map(([d, n]) => `<button data-d="${d}" class="${(qd || '') === d ? 'sel' : ''}">${n}</button>`).join(''); }
$('dateChips').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; save(); const u = new URL(location.href); if (b.dataset.d) u.searchParams.set('date', b.dataset.d); else u.searchParams.delete('date'); location.href = u.toString(); };
$('bMenu').onclick = () => { drawMenu(); open('menuUI'); };
$('uUnstuck').onclick = () => { P.x = 0; P.z = 16; cam.snap = true; close('menuUI'); };
let sOn = true; $('uSound').onclick = () => { sOn = !sOn; setSound(sOn, sOn); };
$('uNew').onclick = () => { S = fresh(); save(); close('menuUI'); };

// ---------------- main step ----------------
function stepWalk(dt) { const mv = readMove(); P.stun -= dt; let sp = 0;
  if (P.stun <= 0 && (mv.x || mv.y)) { const yaw = cam.moveYaw, fx = Math.sin(yaw), fz = Math.cos(yaw); const dx = fx * mv.y - fz * mv.x, dz = fz * mv.y + fx * mv.x; const want = Math.atan2(dx, dz);
    sp = 6.2 * Math.hypot(mv.x, mv.y); P.x += Math.sin(want) * sp * dt; P.z += Math.cos(want) * sp * dt; let d = want - P.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); P.yaw += d * Math.min(1, dt * 12); }
  if ((edge('jump')) && P.y <= 0.001) { P.vy = 6.5; sfx('jump'); } P.vy -= 18 * dt; P.y = Math.max(0, P.y + P.vy * dt); if (P.y === 0) P.vy = 0;
  collide(P, 0.45, P.y + 0.1); P.speed = sp; }
let last = performance.now(), saveT = 0, cropT = 0;
function step(dt) {
  if (P.mode === 'cook') stepCook(dt); else if (P.mode === 'parade') stepParade(dt); else if (P.mode === 'cab') stepCab(dt);
  else if (!anyModal()) { stepWalk(dt); if (P.mode === 'chase') stepChase(dt); else if (P.mode === 'maze') stepMaze(dt); }
  stepFlyers(dt);
  me.x = P.x; me.z = P.z; me.y = P.y; me.yaw = P.yaw; me.speed = P.speed; me.noTurn = true; animPet(me, dt, null); if (P.stun > 0) me.root.rotation.y += Math.sin(performance.now() / 40) * 0.3;
  // crops regrow (free recovery)
  cropT += dt; if (cropT > 0.5) { for (const c of SP.crops) if (!c.ready) { c.t -= cropT; if (c.t <= 0) { c.ready = true; c.m.visible = true; } } cropT = 0; }
  for (const c of SP.crops) if (c.ready) c.m.scale.setScalar(1 + Math.sin(performance.now() / 400 + c.x + c.z) * 0.04);
  // npcs
  for (const p of folk) { if (p.job === 'walk') { if (Math.hypot(p.wx - p.x, p.wz - p.z) < 0.5) { p.wx = p.ax + (R() - 0.5) * p.ar * 2; p.wz = p.az + (R() - 0.5) * p.ar * 2; if (collide({ x: p.wx, z: p.wz }, 0.5)) { p.wx = p.x; p.wz = p.z + 0.6; } } const dx = p.wx - p.x, dz = p.wz - p.z, d = Math.hypot(dx, dz) || 1; p.x += dx / d * 1.4 * dt; p.z += dz / d * 1.4 * dt; p.yaw = Math.atan2(dx, dz); p.speed = 1.4; collide(p, 0.4); }
    else if (p.job === 'rake' || p.job === 'clean') { const tg2 = p.tgt; if (tg2 && tg2.amt <= 0.05) { bagUp(tg2); p.tgt = leafM.filter((l) => l.amt > 0.05 && !folk.some((o) => o !== p && o.tgt === l)).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0] || null; }
      const t3 = p.tgt; const dx = t3 ? t3.x + 1.3 - p.x : 0, dz = t3 ? t3.z + 0.4 - p.z : 0, d = Math.hypot(dx, dz);
      if (t3 && d > 0.3) { p.x += dx / d * 1.6 * dt; p.z += dz / d * 1.6 * dt; p.yaw = Math.atan2(dx, dz); p.speed = 1.6; if (p.rake) p.rake.position.z = 0.35; }
      else { p.speed = 0; const ph = performance.now() / 300 + p.x; if (p.rake) { p.rake.position.z = 0.45 + Math.sin(ph) * 0.22; p.rake.rotation.x = 1.05 + Math.sin(ph) * 0.12; } p.root.rotation.z = Math.sin(ph) * 0.05; if (t3) { p.yaw = Math.atan2(t3.x - p.x, t3.z - p.z); t3.amt = Math.max(0, t3.amt - dt * 0.025); } } }
    p.noTurn = true; animPet(p, dt, null); }
  for (const l of leafM) { const a = Math.max(0.05, l.amt); l.m.scale.set(0.55 + 0.45 * a, a, 0.55 + 0.45 * a); l.m.visible = l.amt > 0.05; }
  animPet(torty, dt, P); animPet(luna, dt, P); animPet(snowie, dt, P);
  // Candy guards the pie table, rats sneak snacks
  for (const s of sneaks) { s.t2 -= dt; if (s.st === 'hide' && s.t2 <= 0 && !pieEv) { s.st = 'sneak'; } const tx = s.st === 'sneak' ? SP.pieTable.x + (s === sneaks[0] ? 1.5 : -1.5) : s.hx, tz = s.st === 'sneak' ? SP.pieTable.z + 0.9 : s.hz;
    const dx = tx - s.x, dz = tz - s.z, d = Math.hypot(dx, dz); const v = s.st === 'flee' ? 6 : 1.6; if (d > 0.3) { s.x += dx / d * v * dt; s.z += dz / d * v * dt; s.yaw = Math.atan2(dx, dz); s.speed = v; } else { s.speed = 0; if (s.st === 'flee') { s.st = 'hide'; s.t2 = 8 + R() * 8; } else if (s.st === 'sneak' && !pieEv && Math.hypot(candy.x - s.x, candy.z - s.z) < 2) { s.st = 'flee'; } }
    s.noTurn = true; animPet(s, dt, null); }
  { const th = sneaks.find((s) => s.st === 'sneak'); const tx = th ? th.x + 0.8 : candy.home.x, tz = th ? th.z + 0.6 : candy.home.z; const dx = tx - candy.x, dz = tz - candy.z, d = Math.hypot(dx, dz); const v = th ? 1.3 : 2;
    if (d > 0.4) { candy.x += dx / d * v * dt; candy.z += dz / d * v * dt; candy.yaw = Math.atan2(dx, dz); candy.speed = v; candy.mode = 'walk'; } else { candy.speed = 0; candy.mode = 'idle'; } candy.noTurn = !!th || d > 0.4; animPet(candy, dt, P); }
  if (pieEv) { pieEv.t -= dt; const s = sneaks[0]; if (s.st === 'flee') pieEv.shoo = true; if (pieEv.t <= 0) judgePie(); }
  // crazy turkeys
  for (const t of turkeys) { t.t -= dt; if (t.t <= 0) { t.t = 0.6 + R() * 1.8; t.yaw += (R() - 0.5) * 2.6; t.sp = R() < 0.3 ? 5 : 1.6 + R() * 1.5; } const pd = Math.hypot(P.x - t.x, P.z - t.z); if (pd < 3 && !t.zone) { t.yaw = Math.atan2(t.x - P.x, t.z - P.z); t.sp = 5.5; }
    t.x += Math.sin(t.yaw) * t.sp * dt; t.z += Math.cos(t.yaw) * t.sp * dt; const lim = t.zone; if (lim) { t.x = clamp(t.x, lim[0] + 1, lim[2] - 1); t.z = clamp(t.z, lim[1] + 1, lim[3] - 1); } else { if (Math.hypot(t.x, t.z) > 40) t.yaw = Math.atan2(-t.x, -t.z); }
    if (collide(t, 0.4)) t.yaw += PI * 0.6; t.g.position.set(t.x, Math.abs(Math.sin(performance.now() / 90 + t.x)) * 0.12, t.z); t.g.rotation.y = t.yaw; }
  gob.g.position.set(gob.x, gob.y || 0, gob.z); gob.g.rotation.y = gob.yaw;
  // interact
  near = ['walk', 'chase', 'maze'].includes(P.mode) && !anyModal() ? (P.mode === 'walk' ? nearest() : null) : null; const ab = $('actBtn'); ab.classList.toggle('on', !!near); if (near) ab.textContent = near.label;
  if (edge('act') && near) near.f();
  if (P.mode === 'walk') { const tip = PHASE === 'pre' ? '🍂 Rake leaf piles, gather crops, practice your parade float' : PHASE === 'day' ? '🦃 The BIG FEAST is on! The parade is LIVE all day at the Float Workshop' : PHASE === 'off' ? '❄️ Quiet season: grow crops, cook cozy suppers, practice floats, beat the maze' : '🥪 Leftovers week: help clean up and enjoy the leftovers'; $('hObj').textContent = gpsT ? `➤ ${gpsT.name}` : tip; }
  // gps
  const gp = $('gps'); if (gpsT && P.mode === 'walk') { const dx = gpsT.x - P.x, dz = gpsT.z - P.z, d = Math.hypot(dx, dz); gp.classList.add('on'); const rel = Math.atan2(dx, dz) - cam.moveYaw; $('gpsArrow').style.transform = `rotate(${-rel * 180 / PI - 90}deg)`; $('gpsTxt').textContent = `${gpsT.name} · ${Math.round(d)} m`; if (d < 4) gpsT = null; } else gp.classList.remove('on');
  if (talkT > 0) { talkT -= dt; if (talkT <= 0) $('talk').style.display = 'none'; } if (bigT > 0) { bigT -= dt; if (bigT <= 0) $('bigMsg').style.display = 'none'; }
  if (selfie && (P.speed > 0.1 || P.mode !== 'walk')) selfie = false; if (selfie) { cam.yaw += (Math.atan2(Math.sin(P.yaw - cam.yaw), Math.cos(P.yaw - cam.yaw))) * Math.min(1, dt * 4); }
  if (P.mode !== 'cook' && P.mode !== 'parade') { const ins = Math.abs(P.x - SP.kcenter.x) < 8 && Math.abs(P.z - SP.kcenter.z) < 6; cam.update(dt, { x: P.x, y: P.y, z: P.z, yaw: P.yaw, speed: P.speed }, world, selfie ? { dist: 3.2, noAuto: true } : ins ? { dist: 4.2 } : {}); }
  followShadow(P.mode === 'parade' && PA ? PA.x : P.x, 0, P.mode === 'parade' && PA ? PA.z : P.z);
  hud(); saveT += dt; if (saveT > 5) { saveT = 0; save(); } }
let selfie = false; $('bPhoto').onclick = () => { selfie = !selfie; if (selfie) toast('📸 Selfie view: say cheese! (move to exit)'); };
let started = false, wipT = 0;
function loop(now) { requestAnimationFrame(loop); if (now - wipT > 500) { wipT = now; const wb = document.getElementById('ratitaWip'); document.body.classList.toggle('wip', !!wb); if (wb) document.body.style.setProperty('--wip', (wb.getBoundingClientRect().bottom + 6) + 'px'); }
  const dt = Math.min(DTMAX, (now - last) / 1000); last = now; if (started) step(dt); else { cam.yaw += dt * 0.08; cam.update(dt, { x: 0, y: 0, z: 4, yaw: 0, speed: 0 }, null, { dist: 34 }); } trackFps(dt, now); if (!(started && P.mode === 'cab')) render(dt); }
function start(s) { S = s; P.x = 0; P.z = 16; P.yaw = PI; P.mode = 'walk'; cam.yaw = 0; cam.pitch = 0.35; cam.snap = true; close('title'); document.body.classList.add('playing'); started = true; initAudio(); save();
  if (!S.tut) { S.tut = 1; talk('Luna', PHASE === 'day' ? "Happy Thanksgiving, Pi-rat! The BIG FEAST starts now and the parade is LIVE all day!" : PHASE === 'post' ? "Thanksgiving's over, but there are leftovers! Help the cleanup crews." : PHASE === 'off' ? `It's the quiet season in Harvest Hollow. ${daysTo} days until the next Thanksgiving!` : 'Welcome to Harvest Hollow, Pi-rat! Thanksgiving is coming. Gather crops at Torty\'s farm, then cook at Chef Mimo\'s.', 6); }
  else talk('Luna', PH.badge, 3); }
$('tPhase').innerHTML = `📅 Live event: <b>${PH.badge}</b>${qd ? ' (test date ' + DATE + ')' : ''}`;
const old = load(); $('mContinue').style.display = old ? '' : 'none';
$('mContinue').onclick = () => start(load()); $('mNew').onclick = () => start(fresh());
window.addEventListener('beforeunload', save); document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
S = fresh(); hud();
window.__feast = { sizes() { const h = (o) => { const b = new THREE.Box3().setFromObject(o); return [+(b.max.y - b.min.y).toFixed(2), +(b.max.x - b.min.x).toFixed(2), +(b.max.z - b.min.z).toFixed(2)]; }; return { pirat: h(me.root), mimo: h(mimo.root), candy: h(candy.root), snowie: h(snowie.root), luna: h(luna.root), torty: h(torty.root), folk: h(folk[0].root), turkey: h(turkeys[0].g || turkeys[0]) }; }, mimo, get cb() { return CB && +CB.t.toFixed(1); }, get as() { return JSON.parse(JSON.stringify(AS)); }, get sneak() { const s = sneaks.find(q => q.st === 'sneak'); return s ? [s.x, s.z] : null; }, get pieEv() { return pieEv; }, get gold() { return gold.map(g => ({ got: g.got })); }, get pa() { return PA && { bz: PA.bz, z: PA.z, x: PA.x, gap: PA.arches[PA.next] && PA.arches[PA.next].gap, next: PA.next, n: PA.arches.length, cleared: PA.cleared, hits: PA.hits }; }, get ch() { return CH && [+CH.t.toFixed(1), CH.dir, +(CH.peckT || 0).toFixed(1)]; }, tris() { const cnt = (o) => { let n = 0; o.traverse(m => { if (m.isMesh && m.geometry) n += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3 * (m.isInstancedMesh ? m.count : 1); }); return n; }; const agg = {}; for (const c of E.scene.children) { const n = cnt(c), k = c.type + ':' + (c.children.length) + ':' + (c.material && c.material.color ? c.material.color.getHexString() : ''); agg[k] = (agg[k] || [0, 0]); agg[k][0] += n; agg[k][1]++; } return Object.entries(agg).sort((a, b) => b[1][0] - a[1][0]).slice(0, 14); }, get rinfo() { return [E.renderer.info.render.calls, E.renderer.info.render.triangles, E.renderer.info.memory.geometries]; }, blocked(x, z, r = 0.5) { return collide({ x, z }, r); }, get mode() { return P.mode; }, get near() { return near && near.label; }, get hay() { return [hayN, +cookT.toFixed(1)]; }, get S() { return S; }, P, SP, PHASE, DATE, start, fresh, openCook, startChase, openDesign, startParade, startMaze, openCab, serveFeast, pieContest, AS, cam, gob, E, get PA() { return PA; } };
requestAnimationFrame(loop);
