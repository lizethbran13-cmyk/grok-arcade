// Torty's Harvest Feast: Thanksgiving hub on the Turbo engine (LIVE). Live events follow the real America/Los_Angeles date.
import * as THREE from 'three';
import { E, initEngine, setEnvironment, followShadow, render, trackFps } from './engine.js';
import { IN, initInput, readMove, edge, held } from './input.js';
import { FollowCam } from './cam.js';
import { collide, ray, PI, sign, COL, Batch, solid, solidC } from './kit.js';
import { initMats, MATS } from './mats.js';
import { makePet, animPet } from './pets.js';
import { makeChefMimo } from './mimo.js';
import { initAudio, sfx, setSound } from './audio.js';
import { $, clamp, toast, rng } from './util.js';
import { buildWorld, makeTurkey, SP } from './world.js';
import { initRooms } from './rooms.js';
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
function fresh() { return { coins: 40, mood: 50, bag: { pumpkin: 0, corn: 0, potato: 0, cranberry: 0 }, dishes: [], medals: [], float: { bal: 'pirat', col: 0xf97316, hp: 100 }, cabBest: 0, raked: 0, pieWins: 0, feasts: 0, tut: 0, acorns: [], tools: {}, ribbons: 0, quests: {} }; }
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
  p.pid = FOLK[i % FOLK.length]; folk.push(p); }
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
function nearest() { if (!(RM && RM.inside()) && P.mode === 'walk') for (const s of step4Spots()) if (Math.hypot(P.x - s.x, P.z - s.z) < s.r) return s; let best = null, bd = 1e9; for (const s of (RM && RM.inside() ? RM.spots() : spots().concat(RM ? RM.spots().concat(step4Spots()) : []))) { const d0 = Math.hypot(P.x - s.x, P.z - s.z), d = d0 - (s.pri || 0); if (d0 < s.r && d < bd) { bd = d; best = s; } }
  for (const c of SP.crops) if (c.ready && Math.hypot(P.x - c.x, P.z - c.z) < 1.4) return { label: ICON[c.kind] + ' Pick ' + c.kind, f: () => { c.ready = false; c.t = 30; c.m.visible = false; S.bag[c.kind] += S.tools && S.tools.basket ? 2 : 1; sfx('pop'); } };
  for (const l of leafM) if (l.amt > 0.05 && Math.hypot(P.x - l.x, P.z - l.z) < 1.8) return { label: '🍂 Rake leaves', f: () => { l.amt = Math.max(0, l.amt - (S.tools && S.tools.rake ? 1 : 0.5)); if (l.amt <= 0.05) { bagUp(l); S.coins += 2; S.raked++; toast('Leaf pile cleaned up! +2 🪙'); sfx('coin'); } else sfx('whoosh'); } };
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
function drawMenu() { $('menuStats').innerHTML = `📅 ${DATE} (America/Los_Angeles${qd ? ', <b>test override</b>' : ''}) · ${PH.badge}<br>${EVS.map((e) => e.n).join(' · ')}<br>🪙 ${S.coins} · 😊 mood ${S.mood} · 🥧 pie wins ${S.pieWins} · 🍽️ feasts ${S.feasts} · 🍂 leaf piles raked ${S.raked} · 🕹️ #51 best ${S.cabBest}` + (S.medals.includes('gobble') ? ' · 🏅 Gobble Medal' : '');
  const opts = [['', '📡 Live date'], [`${Y}-11-10`, '🍂 Pre (Nov 10)'], [`${Y}-11-${TG}`, '🦃 Thanksgiving'], [`${Y}-11-${TG + 2}`, '🥪 After'], [`${Y}-12-12`, '❄️ Off-season']]; $('dateChips').innerHTML = opts.map(([d, n]) => `<button data-d="${d}" class="${(qd || '') === d ? 'sel' : ''}">${n}</button>`).join(''); }
$('dateChips').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; save(); const u = new URL(location.href); if (b.dataset.d) u.searchParams.set('date', b.dataset.d); else u.searchParams.delete('date'); location.href = u.toString(); };
$('bMenu').onclick = () => { drawMenu(); open('menuUI'); };
$('uUnstuck').onclick = () => { if (RM && RM.inside()) { RM.leave(); close('menuUI'); return; } P.x = 0; P.z = 16; cam.snap = true; close('menuUI'); };
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
  if (P.mode === 'cook') stepCook(dt); else if (P.mode === 'parade') stepParade(dt); else if (P.mode === 'cab') stepCab(dt); else if (P.mode === 'hay') { if (!anyModal()) stepHay(dt); }
  else if (!anyModal()) { stepWalk(dt); if (P.mode === 'chase') stepChase(dt); else if (P.mode === 'maze') stepMaze(dt); }
  stepFlyers(dt); if (RM) { RM.step(dt); const ci = RM.inside(); luna.root.visible = !(ci && ci.npcs.some((p) => p.pid === 'luna')); snowie.root.visible = !(ci && ci.npcs.some((p) => p.pid === 'snowie')); candy.root.visible = !(ci && ci.npcs.some((p) => p.pid === 'candy')); } pickTick(dt); if (RM) step4Tick(dt);
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
  { const th = PG ? null : sneaks.find((s) => s.st === 'sneak'); const tx = th ? th.x + 0.8 : candy.home.x, tz = th ? th.z + 0.6 : candy.home.z; const dx = tx - candy.x, dz = tz - candy.z, d = Math.hypot(dx, dz); const v = th ? 1.3 : 2;
    if (d > 0.4) { candy.x += dx / d * v * dt; candy.z += dz / d * v * dt; candy.yaw = Math.atan2(dx, dz); candy.speed = v; candy.mode = 'walk'; } else { candy.speed = 0; candy.mode = 'idle'; } candy.noTurn = !!th || d > 0.4; animPet(candy, dt, P); }
  if (pieEv) { pieEv.t -= dt; const s = sneaks[0]; if (s.st === 'flee') pieEv.shoo = true; if (pieEv.t <= 0) judgePie(); }
  // crazy turkeys
  for (const t of turkeys) { t.t -= dt; if (t.t <= 0) { t.t = 0.6 + R() * 1.8; t.yaw += (R() - 0.5) * 2.6; t.sp = R() < 0.3 ? 5 : 1.6 + R() * 1.5; } const pd = Math.hypot(P.x - t.x, P.z - t.z); if (pd < 3 && !t.zone) { t.yaw = Math.atan2(t.x - P.x, t.z - P.z); t.sp = 5.5; }
    t.x += Math.sin(t.yaw) * t.sp * dt; t.z += Math.cos(t.yaw) * t.sp * dt; const lim = t.zone; if (lim) { t.x = clamp(t.x, lim[0] + 1, lim[2] - 1); t.z = clamp(t.z, lim[1] + 1, lim[3] - 1); } else { if (Math.hypot(t.x, t.z) > 40) t.yaw = Math.atan2(-t.x, -t.z); }
    if (collide(t, 0.4)) t.yaw += PI * 0.6; t.g.position.set(t.x, Math.abs(Math.sin(performance.now() / 90 + t.x)) * 0.12, t.z); t.g.rotation.y = t.yaw; }
  gob.g.position.set(gob.x, gob.y || 0, gob.z); gob.g.rotation.y = gob.yaw;
  // interact
  near = ['walk', 'chase', 'maze', 'hay'].includes(P.mode) && !anyModal() ? (P.mode === 'walk' ? nearest() : P.mode === 'hay' && HR ? HR.btn : null) : null; const ab = $('actBtn'); ab.classList.toggle('on', !!near); if (near) ab.textContent = near.label;
  if (edge('act') && near) near.f();
  if (P.mode === 'walk') { const tip = PHASE === 'pre' ? '🍂 Rake leaf piles, gather crops, practice your parade float' : PHASE === 'day' ? '🦃 The BIG FEAST is on! The parade is LIVE all day at the Float Workshop' : PHASE === 'off' ? '❄️ Quiet season: grow crops, cook cozy suppers, practice floats, beat the maze' : '🥪 Leftovers week: help clean up and enjoy the leftovers'; $('hObj').textContent = gpsT ? `➤ ${gpsT.name}` : (RM && evTip()) || tip; }
  // gps
  const gp = $('gps'); if (gpsT && P.mode === 'walk') { const dx = gpsT.x - P.x, dz = gpsT.z - P.z, d = Math.hypot(dx, dz); gp.classList.add('on'); const rel = Math.atan2(dx, dz) - cam.moveYaw; $('gpsArrow').style.transform = `rotate(${-rel * 180 / PI - 90}deg)`; $('gpsTxt').textContent = `${gpsT.name} · ${Math.round(d)} m`; if (d < 4) gpsT = null; } else gp.classList.remove('on');
  if (talkT > 0) { talkT -= dt; if (talkT <= 0) $('talk').style.display = 'none'; } if (bigT > 0) { bigT -= dt; if (bigT <= 0) $('bigMsg').style.display = 'none'; }
  if (selfie && (P.speed > 0.1 || P.mode !== 'walk')) selfie = false; if (selfie) { cam.yaw += (Math.atan2(Math.sin(P.yaw - cam.yaw), Math.cos(P.yaw - cam.yaw))) * Math.min(1, dt * 4); }
  if (P.mode !== 'cook' && P.mode !== 'parade') { const ins = Math.abs(P.x - SP.kcenter.x) < 8 && Math.abs(P.z - SP.kcenter.z) < 6; cam.update(dt, { x: P.x, y: P.y, z: P.z, yaw: P.yaw, speed: P.speed }, world, selfie ? { dist: 3.2, noAuto: true } : (ins || (RM && RM.inside())) ? { dist: 4.2 } : {}); }
  followShadow(P.mode === 'parade' && PA ? PA.x : P.x, 0, P.mode === 'parade' && PA ? PA.z : P.z);
  hud(); saveT += dt; if (saveT > 5) { saveT = 0; save(); } }
let selfie = false; $('bPhoto').onclick = () => { selfie = !selfie; if (selfie) toast('📸 Selfie view: say cheese! (move to exit)'); };
let started = false, wipT = 0;
function loop(now) { requestAnimationFrame(loop); if (now - wipT > 500) { wipT = now; const wb = document.getElementById('ratitaWip'); document.body.classList.toggle('wip', !!wb); if (wb) document.body.style.setProperty('--wip', (wb.getBoundingClientRect().bottom + 6) + 'px'); }
  const dt = Math.min(DTMAX, (now - last) / 1000); last = now; if (started) step(dt); else { cam.yaw += dt * 0.08; cam.update(dt, { x: 0, y: 0, z: 4, yaw: 0, speed: 0 }, null, { dist: 34 }); } trackFps(dt, now); if (!(started && P.mode === 'cab')) render(dt); }
function start(s) { S = s; if (typeof syncAcorns === 'function') syncAcorns(); setTimeout(() => toast('📅 ' + EVS.map((e) => e.n).join(' · ')), 2500); P.x = 0; P.z = 16; P.yaw = PI; P.mode = 'walk'; cam.yaw = 0; cam.pitch = 0.35; cam.snap = true; close('title'); document.body.classList.add('playing'); started = true; initAudio(); save();
  if (!S.tut) { S.tut = 1; talk('Luna', PHASE === 'day' ? "Happy Thanksgiving, Pi-rat! The BIG FEAST starts now and the parade is LIVE all day!" : PHASE === 'post' ? "Thanksgiving's over, but there are leftovers! Help the cleanup crews." : PHASE === 'off' ? `It's the quiet season in Harvest Hollow. ${daysTo} days until the next Thanksgiving!` : 'Welcome to Harvest Hollow, Pi-rat! Thanksgiving is coming. Gather crops at Torty\'s farm, then cook at Chef Mimo\'s.', 6); }
  else talk('Luna', PH.badge, 3); }
$('tPhase').innerHTML = `📅 Live event: <b>${PH.badge}</b>${qd ? ' (test date ' + DATE + ')' : ''}`;
const old = load(); $('mContinue').style.display = old ? '' : 'none';
$('mContinue').onclick = () => start(load()); $('mNew').onclick = () => start(fresh());
window.addEventListener('beforeunload', save); document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
S = fresh(); hud();
requestAnimationFrame(loop);

// ---------------- Open House interiors (rooms.js) ----------------
var RM = null; const Q = () => S.quests || (S.quests = {}); const addMood = (n) => { S.mood = clamp(S.mood + n, 0, 100); };
// generic timing bar (Bake-Off, apple bobbing, balloon pump)
let BK = null;
function timing(title, steps, done, sp = 1.1) { BK = { steps, done, step: 0, hits: [], x: 0, dir: 1, sp }; $('bkTitle').textContent = title; drawBake(); open('bakeUI'); }
function drawBake() { const st = BK.steps[Math.min(BK.steps.length - 1, BK.step)]; $('bkStep').textContent = `Step ${Math.min(BK.step + 1, BK.steps.length)}/${BK.steps.length}: ${st[0]}`; $('bkTip').textContent = st[1]; $('bkHits').textContent = BK.hits.map((h) => h >= 2 ? '⭐' : h ? '👍' : '💥').join(' '); }
function bakeTick() { requestAnimationFrame(bakeTick); if (!BK || BK.fin) return; BK.x += BK.dir * BK.sp * 0.016 * (1 + BK.step * 0.35); if (BK.x > 1) { BK.x = 1; BK.dir = -1; } if (BK.x < 0) { BK.x = 0; BK.dir = 1; } $('bkMark').style.left = (BK.x * 100) + '%'; }
requestAnimationFrame(bakeTick);
function bakeHit() { if (!BK || BK.fin) return; const d = Math.abs(BK.x - 0.5); const h = d < 0.06 ? 2 : d < 0.16 ? 1 : 0; BK.hits.push(h); sfx(h ? 'coin' : 'whoosh'); BK.step++; drawBake();
  if (BK.step < BK.steps.length) return; BK.fin = true; const k = BK; setTimeout(() => { close('bakeUI'); BK = null; k.done(k.hits.reduce((a, b) => a + b, 0), k.hits); save(); }, 900); }
$('bkGo').onclick = bakeHit; addEventListener('keydown', (e) => { if (BK && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); bakeHit(); } });
// generic quick-pick game (sorting belt, diner orders)
let PK = null;
function pickGame(title, rounds, per, done) { PK = { rounds, per, done, i: 0, score: 0, t: per }; $('pkTitle').textContent = title; drawPick(); open('pickUI'); }
function drawPick() { const r = PK.rounds[PK.i]; $('pkShow').textContent = r.show; $('pkPrompt').textContent = r.prompt; $('pkScore').textContent = `${PK.i + 1}/${PK.rounds.length} · ✅ ${PK.score}`;
  const w = $('pkOpts'); w.innerHTML = ''; r.opts.forEach((o, j) => { const e = document.createElement('button'); e.className = 'primary'; e.textContent = o; e.onclick = () => pickAns(j); w.appendChild(e); }); PK.t = PK.per; }
function pickAns(j) { if (!PK) return; const ok = j === PK.rounds[PK.i].ans; if (ok) { PK.score++; sfx('coin'); } else sfx('whoosh'); PK.i++; if (PK.i < PK.rounds.length) { drawPick(); return; }
  const k = PK; PK = null; close('pickUI'); k.done(k.score, k.rounds.length); save(); }
function pickTick(dt) { if (!PK) return; if (!$('pickUI').classList.contains('on')) { PK = null; return; } PK.t -= dt; $('pkBar').style.width = Math.max(0, PK.t / PK.per * 100) + '%'; if (PK.t <= 0) pickAns(-1); }
// --- Bakery
function bakeStart() { if (S.bag.pumpkin < 1 && !Q().freeDough) { msg('🥧 Bake-Off', 'Baker Cream needs <b>1 🎃 pumpkin</b> for your pie. Pick one in Torty\'s field (they regrow).'); return; }
  if (S.bag.pumpkin < 1) Q().freeDough = 0; else S.bag.pumpkin--;
  timing('🥧 Hollow Bake-Off', [['🥣 Roll the crust', 'Stop when the pin is in the gold zone'], ['🎃 Pour the filling', 'Stop right at the fill line'], ['🔥 Bake it', 'Pull it out when it is golden, not burnt']], (sc) => {
    const rib = sc >= 5 ? ['🥇 BLUE RIBBON', 25] : sc >= 3 ? ['🥈 Red ribbon', 12] : sc >= 2 ? ['🥉 White ribbon', 5] : null;
    if (rib) { S.ribbons = (S.ribbons || 0) + 1; S.coins += rib[1]; S.dishes.push('pie'); addMood(5); sfx('cheer'); msg('🥧 Bake-Off result', `${rib[0]}! +${rib[1]} 🪙 and your pie goes in your feast basket 🍽️. Ribbons won: <b>${S.ribbons}</b>`); talk('Baker Cream', sc >= 5 ? 'Squeak! That crust is flaky perfection!' : sc >= 3 ? 'Lovely pie! A touch more gold next time.' : 'It held together! Practice makes perfect.'); RM.refresh(); }
    else { Q().freeDough = 1; addMood(-5); msg('💥 Pie flop!', 'The pie burned and the pumpkin is gone (−5 😊). Baker Cream gives you <b>one free practice dough</b>, so your next try costs no pumpkin.'); } }); }
// --- Barn
function toolShop() { const it = [['rake', '🪮 Golden Rake', 30, 'Clears any leaf pile in one swipe'], ['basket', '🧺 Big Basket', 25, 'Every crop you pick counts double']];
  msg("🛠️ Torty's Tools", it.map(([k, n, c, d]) => `<b>${n}</b> ${S.tools[k] ? '✅ owned' : c + ' 🪙'}<br><small>${d}</small>`).join('<br><br>') + `<br><br>You have ${S.coins} 🪙`,
    it.filter(([k]) => !S.tools[k]).map(([k, n, c]) => [`Buy ${n.split(' ').slice(1).join(' ')} (${c})`, () => { if (S.coins < c) { toast('Not enough 🪙. Rake leaves or win the Bake-Off!'); return; } S.coins -= c; S.tools[k] = 1; sfx('coin'); save(); toast(n + ' is yours!'); }]).concat([['Close', null, 'ghost']])); }
function jamQuest() { const q = Q(); if (q.jam === 2) { talk('Farmhand Brownie', "Torty's cranberry jam is bubbling away. Thank you, neighbour!"); return; }
  if (!q.jam) { q.jam = 1; save(); talk('Farmhand Brownie', "Torty wants to make cranberry jam for the feast. Can you bring 5 🍒 cranberries? Cranberry Co. and the field have them.", 6); return; }
  if (S.bag.cranberry >= 5) { S.bag.cranberry -= 5; q.jam = 2; S.coins += 20; addMood(8); S.dishes.push('sauce'); sfx('cheer'); save(); msg('🍒 Quest complete!', "Torty's jam is done! +20 🪙, +8 😊, and a jar of 🍒 cranberry sauce for your feast."); }
  else talk('Farmhand Brownie', `Still need ${5 - S.bag.cranberry} more 🍒. They regrow in the field!`); }
// --- Pumpkin shop
function sellCrops() { const mk = EV('mkt') ? 1 : 0; const PR = { pumpkin: 3 + mk, corn: 2 + mk, potato: 2 + mk, cranberry: 1 + mk }; const tot = Object.keys(PR).reduce((a, k) => a + S.bag[k] * PR[k], 0);
  msg('🧺 Sell crops to Rose', Object.keys(PR).map((k) => `${ICON[k]} ${k}: ${S.bag[k]} × ${PR[k]} 🪙`).join('<br>') + '<br><br><small>Keep what you need for cooking! Crops regrow in the field.</small>',
    Object.keys(PR).filter((k) => S.bag[k] > 0).map((k) => [`Sell 1 ${ICON[k]} (+${PR[k]})`, () => { S.bag[k]--; S.coins += PR[k]; sfx('coin'); save(); sellCrops(); }]).concat(tot ? [] : []).concat([['Done', null, 'ghost']])); }
function carve() { if (S.bag.pumpkin < 1) { talk('Shopkeeper Rose', 'You need a 🎃 pumpkin to carve. Torty\'s field always has some!'); return; }
  const EY = ['▲ ▲ triangle eyes', '● ● round eyes', '✦ ✦ star eyes'], MO = ['😁 big grin', '〰️ zig-zag', '😮 spooky O'];
  msg('🔪 Carve: pick the eyes', 'Rose holds the pumpkin steady…', EY.map((e, i) => [e, () => msg('🔪 Carve: pick the mouth', 'Almost done!', MO.map((m, j) => [m, () => {
    S.bag.pumpkin--; S.lantern = EY[i].split(' ')[0] + MO[j].split(' ')[0]; S.coins += 6; addMood(4); sfx('cheer'); save(); msg('🎃 Jack-o’-lantern!', `You carved ${EY[i]} with a ${MO[j]}! +6 🪙 +4 😊<br>It now glows on the toy chest in <b>Pi-rat's Home</b>.`); }]))])); }
// --- Cranberry Co.
function sortBelt() { const bad = ['🍂', '🪨', '🐛', '🟤']; const rounds = Array.from({ length: 12 }, () => { const good = R() < 0.6; return { show: good ? '🍒' : bad[(R() * 4) | 0], prompt: good ? 'A berry rolls by…' : 'Something rolls by…', opts: ['✅ Keep', '🗑️ Toss'], ans: good ? 0 : 1 }; });
  pickGame('🍒 Sorting Belt', rounds, 1.8, (sc, n) => { if (sc >= 10) { S.bag.cranberry += 4; S.coins += 8; Q().sort = 2; sfx('cheer'); msg('🍒 Great sorting!', `${sc}/${n} right! Foreman Blue pays you <b>4 🍒 + 8 🪙</b>.`); }
    else if (sc >= 7) { S.bag.cranberry += 2; S.coins += 3; Q().sort = Q().sort || 1; msg('🍒 Not bad!', `${sc}/${n} right. You get 2 🍒 + 3 🪙. Hit 10 for the full bonus.`); }
    else { addMood(-3); S.bag.cranberry += 1; msg('💥 Belt jam!', `Only ${sc}/${n}. The belt jammed (−3 😊). Foreman Blue still hands you 1 🍒 for trying. Have another go any time!`); } }); }
// --- Cider barn
function bobApples() { timing('🍎 Apple Bobbing', [['🍎 Dunk 1', 'Dive when the apple floats into the gold zone'], ['🍏 Dunk 2', 'Faster now!'], ['🍎 Dunk 3', 'Last one, it is slippery!']], (sc, hits) => { const ap = hits.filter((h) => h).length;
    if (ap) { S.coins += ap * 4; addMood(ap * 2); Q().bob = Math.max(Q().bob || 0, ap); sfx('cheer'); msg('🍎 Apple Bobbing', `You caught <b>${ap}</b> apple${ap > 1 ? 's' : ''}! +${ap * 4} 🪙 +${ap * 2} 😊`); }
    else { addMood(-4); Q().towel = 1; msg('💦 Soaked!', 'No apples, just a very wet face (−4 😊). Cider Brie hands you a towel and a <b>free mug of hot cider</b>.'); } }, 1.3); }
function buyCider() { const free = Q().towel; if (!free && S.coins < 3) { toast('Need 3 🪙'); return; } if (free) Q().towel = 0; else S.coins -= 3; addMood(5); sfx('pop'); toast(free ? '☕ Free hot cider! +5 😊' : '☕ Warm spiced cider! +5 😊'); }
// --- Diner
function serveDiner() { const D2 = [['🥧', 'pumpkin pie'], ['🥔', 'mashed potatoes'], ['🌽', 'cornbread'], ['🍒', 'cranberry sauce']]; const who = ['Snowie', 'Mrs. Rose', 'Old Ash', 'Little Brie', 'Mayor Gold'];
  const rounds = Array.from({ length: 3 }, (_, i) => { const a = (R() * 4) | 0; return { show: '🐀💬', prompt: `${who[(i + ((R() * 5) | 0)) % 5]}: "One ${D2[a][1]}, please!"`, opts: D2.map((d) => d[0]), ans: a }; });
  pickGame('🍽️ Lunch Rush', rounds, 4, (sc) => { if (sc === 3) { S.coins += 15; addMood(4); Q().diner = 2; sfx('cheer'); msg('🍽️ Perfect service!', 'All 3 orders right! +15 🪙 in tips.'); }
    else if (sc === 2) { S.coins += 8; Q().diner = Q().diner || 1; msg('🍽️ Good shift', '2 of 3 orders right. +8 🪙 in tips.'); }
    else { addMood(-5); msg('😤 Grumpy customers', `Only ${sc}/3 right and they left without tipping (−5 😊). Cook Ash gives you a <b>free staff meal</b> (+3 😊). Try the next rush!`, [['Thanks, Ash', () => addMood(3)]]); } }); }
// --- Town Hall
function questBoard() { const q = Q(); const L = [['🍒 Torty\'s jam (Barn)', q.jam === 2], ['🥇 Win a Bake-Off ribbon', (S.ribbons || 0) > 0], ['🍒 Sort 10 berries (Cranberry Co.)', q.sort === 2], ['🍎 Bob 3 apples (Cider Barn)', (q.bob || 0) >= 3], ['🍽️ Perfect lunch rush (Diner)', q.diner === 2], ['📜 Luna\'s lost recipe', q.recipe === 2], ['🎃 Carve a jack-o\'-lantern', !!S.lantern], [`🌰 Golden acorns ${(S.acorns || []).length}/20`, (S.acorns || []).length >= 20], [`🛂 Open House stamps ${(S.stamps || []).length}/10`, (S.stamps || []).length >= 10]];
  L.push(['🎃 Win the scarecrow contest', S.medals.includes('scarecrow')], ["🐷 Bring all of Candy's piglets home", S.medals.includes('piglets')]);
  msg('📋 Quest Board', L.map(([t, d]) => `${d ? '✅' : '⬜'} ${t}`).join('<br>') + `<br><br><b>📅 Today</b>: ${EVS.map((e) => e.n).join(' · ')}<br><b>📦 Requests</b><br>${reqText()}`); }
function mayor() { const st = (S.stamps || []).length; if (st >= 10 && !S.medals.includes('openhouse')) { S.medals.push('openhouse'); S.coins += 30; addMood(10); sfx('cheer'); save(); RM.refresh(); msg('🏅 Open House Medal!', 'You visited every building in Harvest Hollow! Mayor Gold pins the <b>Open House Medal</b> on you. +30 🪙 +10 😊'); }
  else talk('Mayor Gold', S.medals.includes('openhouse') ? 'Our most neighbourly visitor! Your medal is in the case.' : `Welcome to the Open House! Get a stamp in every building: ${st}/10 so far. Bring me all 10 for a medal.`, 5); }
// --- Workshop
function balloonPump() { const f = S.float; if (f.hp >= 100) { talk('Mechanic Black', 'Your balloon is full and the float is shiny. Go practice the parade!'); return; }
  timing('🎈 Balloon Pump', [['💨 Pump 1', 'Pump in the gold zone, not too hard'], ['💨 Pump 2', 'Keep the rhythm'], ['💨 Pump 3', 'Careful, do not pop it!']], (sc) => { if (sc >= 3) { f.hp = 100; S.coins += 4; sfx('cheer'); msg('🎈 Fully inflated!', 'Float fixed up to 100% for free, plus +4 🪙 from Mechanic Black.'); }
    else if (sc >= 1) { f.hp = Math.min(100, f.hp + 25); msg('🎈 Half pumped', `Float patched +25% (now ${f.hp}%). Try again for the rest.`); } else { f.hp = Math.max(10, f.hp - 10); addMood(-3); msg('💥 POP!', 'The balloon popped (−10% float, −3 😊). Mechanic Black has a spare, so you can pump again right away.'); } }); }
// --- Luna's home: lost recipe
function lunaRecipe() { const q = Q(), n = (S.pages || []).length; if (q.recipe === 2) { talk('Luna', 'My Harvest Cornbread recipe is safe again, thanks to you!'); return; }
  if (!q.recipe) { q.recipe = 1; S.pages = []; save(); RM.refresh(); talk('Luna', 'Oh no, the wind blew my grandma\'s cornbread recipe away! 3 pages landed in the Town Hall, the Diner and the Cider Barn. Could you find them?', 7); return; }
  if (n >= 3) { q.recipe = 2; S.coins += 20; addMood(8); S.dishes.push('bread'); sfx('cheer'); save(); msg('📜 Recipe found!', 'Luna bakes her grandma\'s <b>Harvest Cornbread</b> and gives you a loaf for the feast 🌽. +20 🪙 +8 😊'); }
  else talk('Luna', `${n}/3 pages so far. Try the Town Hall, the Diner and the Cider Barn.`); }
// --- Pi-rat's home
function decorShop() { const it = [['garland', '🍂 Leaf garland', 8], ['quilt', '🧶 Harvest quilt', 10], ['lights', '✨ Fairy lights', 12], ['wreath', '🌾 Door wreath', 6]]; const dc = S.decor || (S.decor = {});
  msg('🏠 Decorate your home', it.map(([k, n, c]) => `${dc[k] ? '✅' : '⬜'} ${n} ${dc[k] ? '' : c + ' 🪙'}`).join('<br>') + (S.lantern ? '<br>✅ 🎃 Your jack-o\'-lantern' : '<br>⬜ 🎃 Carve one at the Pumpkin Patch Shop') + `<br><br>You have ${S.coins} 🪙`,
    it.filter(([k]) => !dc[k]).map(([k, n, c]) => [`${n.split(' ')[0]} ${c}`, () => { if (S.coins < c) { toast('Not enough 🪙'); return; } S.coins -= c; dc[k] = 1; addMood(3); sfx('cheer'); save(); RM.refresh(); toast(n + ' put up! +3 😊'); }]).concat([['Done', null, 'ghost']])); }
let napT = 0; function nap() { const now = performance.now(); if (now - napT < 60000) { talk('Pi-rat', 'Not sleepy yet… maybe later.'); return; } napT = now; addMood(10); sfx('pop'); big('💤 Cozy nap… +10 😊'); }
RM = initRooms({ scene: E.scene, P, cam, S: new Proxy({}, { get: (_, k) => S[k], set: (_, k, v) => { S[k] = v; return true; } }), sfx, toast, talk, msg, makePet, animPet,
  onAcorn: (n) => acornDone(n),
  onEnter: (id) => { S.stamps = S.stamps || []; if (!S.stamps.includes(id)) { S.stamps.push(id); S.coins += 2; save(); setTimeout(() => toast(`🛂 Open House stamp ${S.stamps.length}/10! +2 🪙`), 900); } },
  roomSpots: (c) => { const o = reqSpots(c); const at = (x, z, r, label, f) => o.push({ x: c.ox + x, z: c.oz + z, r, label, f });
    if (c.id === 'barn') { at(4, -3.0, 1.6, "🛠️ Torty's Tools shop", toolShop); at(3.8, -2.4, 1.0, Q().jam === 1 ? '🍒 Give cranberries to Brownie' : '🐀 Talk to Farmhand Brownie', jamQuest);
      at(-5.8, 3.6, 1.5, '🌽 Feed the barn goats (1 corn)', () => { if (S.bag.corn < 1) { talk('Luna', 'The goats want corn. There is plenty growing in the field!'); return; } S.bag.corn--; S.coins += 3; addMood(2); sfx('pop'); toast('🐐 Munch munch! +3 🪙 +2 😊'); });
      at(-3.2, 1.2, 1.4, '🐀 Talk to Luna', () => talk('Luna', (S.acorns || []).length ? `You've found ${S.acorns.length}/20 golden acorns! Every building hides one.` : 'Psst… golden acorns are hidden all over Harvest Hollow. Try the hay bales!')); }
    if (c.id === 'bakery') { at(0.2, -1.4, 1.5, '🥧 Bake-Off with Baker Cream', bakeStart);
      at(3.2, -0.5, 1.4, '🍰 Buy a pie slice (4 🪙)', () => { if (S.coins < 4) { toast('Need 4 🪙'); return; } S.coins -= 4; addMood(6); sfx('pop'); toast('🍰 Yum! +6 😊'); });
      at(-2.6, 3.0, 1.3, '🐀 Talk to Snowie', () => talk('Snowie', S.ribbons ? `Ooh, ${S.ribbons} ribbon${S.ribbons > 1 ? 's' : ''}! Your pies are the talk of the Hollow.` : 'I come here every morning for the crumbs. Win a ribbon at the Bake-Off!')); }
    if (c.id === 'pumpkin') { at(3.6, -2.6, 1.6, '🧺 Sell crops to Rose', sellCrops); at(-1.2, -2.3, 1.6, '🔪 Carve a jack-o\'-lantern (1 🎃)', carve); }
    if (c.id === 'cranberry') { at(-1, -2.2, 1.8, '🍒 Work the sorting belt', sortBelt); at(4.2, -1.2, 1.2, '🐀 Talk to Foreman Blue', () => talk('Foreman Blue', 'Keep the berries, toss the leaves and bugs. Ten right earns the bonus!')); }
    if (c.id === 'cider') { at(-0.4, 0.3, 1.6, '🍎 Bob for apples', bobApples); at(2.6, 1.4, 1.3, Q().towel ? '☕ Free hot cider' : '☕ Buy hot cider (3 🪙)', buyCider); }
    if (c.id === 'hall') { at(-5.8, -0.5, 1.6, '📋 Read the quest board', questBoard); at(0, -2.4, 1.4, '🐀 Talk to Mayor Gold', mayor); at(-4.2, 3.4, 1.5, '🐶 Pet Candy', () => { addMood(1); sfx('pop'); talk('Candy', 'Ruff! *happy schnauzer wiggle*'); }); }
    if (c.id === 'diner') { at(-1, -1.6, 1.6, '🍽️ Serve the lunch rush', serveDiner); at(4.4, 1.4, 1.3, '🐀 Talk to Snowie', () => talk('Snowie', 'Same booth every day! The cranberry sauce here is the best in town.')); }
    if (c.id === 'workshop') { at(4.6, -3.0, 1.6, '🎨 Parade Builder bench', openDesign); at(4.0, 1.5, 1.4, '🎈 Pump up the balloon', balloonPump); }
    if (c.id === 'luna') { at(-0.2, 1.2, 1.5, Q().recipe === 1 && (S.pages || []).length >= 3 ? '📜 Give Luna the recipe pages' : '🐀 Talk to Luna', lunaRecipe); }
    if (c.id === 'pirat') { at(2.0, -3.4, 1.6, '🏠 Decorate your home', decorShop); at(-5.4, -1.3, 1.5, '💤 Take a cozy nap', nap); }
    return o; } });
window.__oh = { RM, P, cam, E, COL, SP, get S() { return S; }, get near() { return near; }, bakeHit, pickAns, get PK() { return PK; } };

// ================= Step 4: outdoor fun (date events, golden acorns, scarecrow contest, hayride, neighbour requests, Candy's piglets) =================
// --- date events (America/Los_Angeles date, ?date= for tests)
const DOW = new Date(Date.UTC(Y, Mo - 1, D)).getUTCDay();
const EVS = [];
if (Mo === 11 && D <= 10) EVS.push({ k: 'scare', n: '🎃 Scarecrow Week: contest prizes ×2' });
if (DOW === 5) EVS.push({ k: 'hay', n: '🌙 Lantern Hayride Friday: waves pay double' });
if (DOW === 3) EVS.push({ k: 'pig', n: '🐷 Piglet Wednesday: piglet reward +50%' });
if (DOW === 0 || DOW === 6) EVS.push({ k: 'mkt', n: '🧺 Weekend Market: crops sell for +1 🪙' });
if (!EVS.length) EVS.push({ k: 'req', n: '📦 Neighbour Day: requests pay +2 🪙' });
const EV = (k) => EVS.some((e) => e.k === k);
function evTip() { if (PG) return `🐷 Piglets home ${PG.home}/${PG.pigs.length} · ${Math.ceil(PG.t)}s · walk near a piglet, lead it into the pen`; if ((performance.now() / 6000 | 0) % 2) return '📅 Today: ' + EVS.map((e) => e.n).join(' · '); return null; }
// --- golden acorns: 9 outdoors (11 are inside buildings) = 20
function freeSpot(x, z, r = 0.8) { for (let k = 0; k < 40; k++) { const a = k * 2.4, rr = k * 0.35, o = { x: x + Math.cos(a) * rr, z: z + Math.sin(a) * rr }; const t = { ...o }; if (!collide(t, r) && !SP.crops.some((c) => Math.hypot(c.x - o.x, c.z - o.z) < 1.2)) return o; } return { x, z }; }
const OUTA = [[-61, 14, 'by the scarecrow contest'], [-37, 14.5, "by Candy's piglet pen"], [SP.maze.x + 3, SP.maze.z - 2, 'at the corn maze gate'], [SP.cab.x + 2.4, SP.cab.z, 'next to the arcade cabinet'], [SP.workshop.x, SP.workshop.z + 4, 'outside the Float Workshop'], [SP.kitchen.x + 4, SP.kitchen.z + 2, "near Chef Mimo's kitchen"], [16, -17, 'by the Town Hall steps'], [49, -9, 'behind the pie tent'], [-28, 9, "in Luna's front garden"]];
const outAcorns = OUTA.map(([x, z, where], i) => { const p = freeSpot(x, z), m = RM.acornMesh(); m.position.set(p.x, 0, p.z); scene.add(m); const key = 'out' + i; const got = (S.acorns || []).includes(key); m.visible = !got; return { key, m, x: p.x, z: p.z, where, got }; });
function syncAcorns() { for (const a of outAcorns) { a.got = (S.acorns || []).includes(a.key); a.m.visible = !a.got; } }
function acornDone(n) { if (n >= 20 && !S.medals.includes('acorns')) { S.medals.push('acorns'); S.coins += 25; save(); setTimeout(() => { sfx('cheer'); big('🌰 ALL 20 GOLDEN ACORNS! +25 🪙 and the Acorn medal'); }, 600); } }
// --- tiny model helpers
function grp(build) { const g = new THREE.Group(), b = new Batch(); build(b); b.finish(g, true); return g; }
// --- scarecrow contest (west meadow, south of Torty's field)
const SC = { x: -55, z: 10 }; const AUTC = [0xf97316, 0xb91c1c, 0xfacc15, 0x92400e, 0x16a34a];
const HATS = { straw: '👒 Straw hat', witch: '🧙 Witch hat', top: '🎩 Top hat' }, SHIRTS = { plaid: '🟥 Red plaid', denim: '🟦 Denim', moss: '🟩 Moss green' }, FACES = { happy: '😊 Happy', spooky: '👻 Spooky', silly: '🤪 Silly' };
const SHC = { plaid: 0xb91c1c, denim: 0x2563eb, moss: 0x4d7c0f };
function scarecrow(hat, shirt, face) { return grp((b) => { b.cyl('m', 0x6b4a2e, 0, 0, 0, 0.08, 2.3); b.box('m', 0x6b4a2e, 0, 1.55, 0, 1.9, 0.1, 0.1);
  b.box('m', SHC[shirt], 0, 0.95, 0, 0.75, 0.75, 0.38); b.box('m', SHC[shirt], 0, 1.4, 0, 1.6, 0.26, 0.3); if (shirt === 'plaid') for (const y of [1.1, 1.35]) b.box('m', 0xfacc15, 0, y, 0.2, 0.77, 0.04, 0.01); if (shirt === 'denim') b.box('m', 0x1e3a8a, 0, 0.95, 0.2, 0.5, 0.5, 0.01);
  for (const sx of [-0.85, 0.85]) b.sph('m', 0xe3c062, sx, 1.45, 0, 0.12, 0.16, 0.12); b.box('m', 0x8a6a45, 0, 0.45, 0, 0.6, 0.5, 0.3);
  b.sph('m', 0xd6b88a, 0, 2.0, 0, 0.32, 0.34, 0.3); const ez = 0.27;
  if (face === 'happy') { for (const sx of [-0.11, 0.11]) b.sph('m', 0x111827, sx, 2.07, ez, 0.045); for (let i = 0; i < 5; i++) b.sph('m', 0x7c2d12, -0.12 + i * 0.06, 1.9 - Math.sin(i / 4 * PI) * 0.04, ez, 0.025); }
  if (face === 'spooky') { for (const sx of [-0.11, 0.11]) b.box('l', 0xff7a1a, sx, 2.02, ez, 0.09, 0.09, 0.02, 0.6, 1); b.box('m', 0x111827, 0, 1.86, ez, 0.22, 0.05, 0.02); }
  if (face === 'silly') { b.sph('m', 0x111827, -0.11, 2.07, ez, 0.06); b.sph('m', 0x111827, 0.11, 2.05, ez, 0.035); b.sph('m', 0xf472b6, 0.04, 1.86, ez, 0.07, 0.05, 0.03); }
  b.sph('m', 0xf97316, 0, 1.96, ez + 0.02, 0.035);
  if (hat === 'straw') { b.cyl('m', 0xe3c062, 0, 2.22, 0, 0.5, 0.04); b.cyl('m', 0xd4a84a, 0, 2.24, 0, 0.24, 0.22); b.cyl('m', 0xb91c1c, 0, 2.26, 0, 0.245, 0.05); }
  if (hat === 'witch') { b.cyl('m', 0x1f1b2e, 0, 2.22, 0, 0.45, 0.04); for (let i = 0; i < 5; i++) b.cyl('m', 0x1f1b2e, 0.02 * i, 2.26 + i * 0.13, 0, 0.24 - i * 0.045, 0.14); b.cyl('m', 0x7c3aed, 0, 2.26, 0, 0.25, 0.05); }
  if (hat === 'top') { b.cyl('m', 0x111827, 0, 2.22, 0, 0.36, 0.04); b.cyl('m', 0x111827, 0, 2.24, 0, 0.22, 0.42); b.cyl('m', 0xf97316, 0, 2.28, 0, 0.225, 0.07); } }); }
{ const g = grp((b) => { for (const x of [-4.4, 4.4]) b.box('m', 0x6b4a2e, SC.x + x, 0, SC.z - 0.6, 0.16, 3.4, 0.16); b.box('m', 0x7c2d12, SC.x, 3.0, SC.z - 0.6, 9, 0.12, 0.14);
    for (let i = 0; i < 9; i++) b.box('m', AUTC[i % 5], SC.x - 4 + i, 2.65 - Math.sin(i / 8 * PI) * 0.25, SC.z - 0.6, 0.4, 0.3, 0.03);
    for (const x of [-3, 0, 3]) { b.rbox('m', 0xe3c062, SC.x + x, 0, SC.z + 0.9, 1.1, 0.4, 0.6); } for (const x of [-4.6, 4.6]) { b.rbox('m', 0xe3c062, SC.x + x, 0, SC.z + 1.2, 1.1, 0.6, 0.7); b.sph('g', 0xf97316, SC.x + x, 0.8, SC.z + 1.2, 0.28, 0.22, 0.28); }
    b.box('m', 0x8a5a33, SC.x + 6.2, 0, SC.z + 1.6, 1.4, 0.9, 0.7); b.box('m', 0xfef3c7, SC.x + 6.2, 0.9, SC.z + 1.6, 1.5, 0.05, 0.8); for (let i = 0; i < 3; i++) b.cyl('l', [0xfacc15, 0xd1d5db, 0xb45309][i], SC.x + 5.8 + i * 0.4, 0.95, SC.z + 1.6, 0.12, 0.03, PI / 2, 0, 0.5); });
  scene.add(g); const s = sign('SCARECROW CONTEST', 4, 0.7, { bg: '#7c2d12', border: '#fbbf24' }); s.position.set(SC.x, 3.55, SC.z - 0.55); s.rotation.y = 0; scene.add(s);
  for (const x of [-4.4, 4.4]) solidC(SC.x + x, SC.z - 0.6, 0.3, 0.3, 3.4); solidC(SC.x + 6.2, SC.z + 1.6, 1.5, 0.8, 1); for (const x of [-4.6, 4.6]) solidC(SC.x + x, SC.z + 1.2, 1.2, 0.8, 1); }
const rivals = [['straw', 'plaid', 'happy', -3], ['witch', 'moss', 'spooky', 3]].map(([h, s2, f, x]) => { const g = scarecrow(h, s2, f); g.position.set(SC.x + x, 0, SC.z); scene.add(g); solidC(SC.x + x, SC.z, 0.5, 0.5, 2.3); return g; });
let myScare = null; solidC(SC.x, SC.z, 0.5, 0.5, 2.3);
function setMyScare(h, s2, f) { if (myScare) { scene.remove(myScare); myScare.traverse((o) => o.geometry && o.geometry.dispose()); } myScare = h ? scarecrow(h, s2, f) : grp((b) => { b.cyl('m', 0x6b4a2e, 0, 0, 0, 0.08, 2.3); b.box('m', 0x6b4a2e, 0, 1.55, 0, 1.9, 0.1, 0.1); }); myScare.position.set(SC.x, 0, SC.z); scene.add(myScare); }
function scareTheme() { const k = (a) => Object.keys(a); const h = k(HATS)[(D * 7 + Mo) % 3], s2 = k(SHIRTS)[(D * 5 + 1) % 3], f = k(FACES)[(D * 3 + 2) % 3]; return { h, s: s2, f }; }
function scareContest() { const q = Q(); S.scare = S.scare && S.scare.d === DATE ? S.scare : { d: DATE, best: 0 }; const th = scareTheme();
  if (S.scare.best === 1) { talk('Judge Torty', "You already won today's 🥇! Come back tomorrow for a brand-new theme."); return; }
  const free = q.straw === 1; if (!free && S.bag.corn < 1) { talk('Judge Torty', 'Every scarecrow needs stuffing: bring <b>1 🌽 corn</b> (my field always has some).'.replace(/<\/?b>/g, '')); return; }
  const pick = {}; const ask = (title, set, key, hint, next) => msg('🎃 Scarecrow Contest · ' + title, `Judge Torty's hint: <b>${hint}</b><br><small>Entry: ${free ? 'free straw from Torty' : '1 🌽 for stuffing'}. Match the judge's taste: 3/3 🥇 +${EV('scare') ? 40 : 20} 🪙, 2/3 🥈, 1/3 🥉. 0/3 and the crows knock it over (−3 😊).</small>`,
    Object.keys(set).map((k) => [set[k], () => { pick[key] = k; setMyScare(pick.h || 'straw', pick.s || 'plaid', pick.f || 'happy'); next(); }, 'ghost']));
  const hint = { h: { straw: 'old-fashioned farm hats', witch: 'pointy hats', top: 'fancy tall hats' }[th.h], f: { happy: 'cheerful faces', spooky: 'glowing spooky eyes', silly: 'goofy faces' }[th.f] };
  ask('1/3 Hat', HATS, 'h', `I love ${hint.h}.`, () => ask('2/3 Shirt', SHIRTS, 's', 'The shirt colour is my secret… pick your favourite!', () => ask('3/3 Face', FACES, 'f', `My heart melts for ${hint.f}.`, judge)));
  function judge() { if (free) q.straw = 0; else S.bag.corn--; const m = (pick.h === th.h) + (pick.s === th.s) + (pick.f === th.f); const mul = EV('scare') ? 2 : 1;
    const place = m === 3 ? 1 : m === 2 ? 2 : m === 1 ? 3 : 0, prize = [0, 20, 8, 3][place] * mul;
    if (place) { S.coins += prize; addMood(4); S.ribbons = (S.ribbons || 0) + (place === 1 ? 1 : 0); if (place === 1) { S.scare.best = 1; if (!S.medals.includes('scarecrow')) S.medals.push('scarecrow'); } sfx('cheer'); }
    else { addMood(-3); q.straw = 1; sfx('whoosh'); myScare.rotation.z = 1.2; myScare.position.y = 0.3; }
    save(); msg('🎃 Scarecrow Contest Results', (place ? `Judge Torty awards you <b>${['', '🥇 1st', '🥈 2nd', '🥉 3rd'][place]} place</b>! (${m}/3 matched) +${prize} 🪙${mul > 1 ? ' (Scarecrow Week ×2)' : ''}` : `0/3 matched… a gust of wind and three crows knock your scarecrow flat. −3 😊`) + `<br><small>Today's theme was ${HATS[th.h]} · ${SHIRTS[th.s]} · ${FACES[th.f]}.${place ? '' : ' Torty gives you free straw: your next entry costs nothing.'}</small>`, [['OK', null]]); } }
setMyScare(null);
// --- Candy's piglets (pen east of the contest)
const PEN = { x: -43, z: 10, w: 6, d: 5 };
function makePig() { const g = grp((b) => { b.sph('m', 0xf9a8d4, 0, 0.32, 0, 0.3, 0.24, 0.38); b.sph('m', 0xfbcfe8, 0, 0.42, 0.34, 0.2, 0.18, 0.18); b.cyl('m', 0xf472b6, 0, 0.4, 0.5, 0.08, 0.06, PI / 2); for (const sx of [-0.03, 0.03]) b.sph('m', 0x9d174d, sx, 0.4, 0.535, 0.015);
  for (const sx of [-0.08, 0.08]) { b.sph('m', 0x111827, sx, 0.5, 0.48, 0.025); b.sph('m', 0xf472b6, sx * 1.6, 0.6, 0.3, 0.07, 0.09, 0.03); } for (const sx of [-0.15, 0.15]) for (const sz of [-0.2, 0.2]) b.cyl('m', 0xf9a8d4, sx, 0, sz, 0.055, 0.14);
  for (let i = 0; i < 4; i++) b.sph('m', 0xf472b6, Math.sin(i * 1.7) * 0.05, 0.4 + i * 0.025, -0.38 - i * 0.025, 0.03); }); return g; }
{ const g = grp((b) => { const { x, z, w, d } = PEN; b.box('m', 0x6b4a2e, x, 0.03, z, w, 0.02, d); b.sph('m', 0x5b3a24, x - 1, 0.04, z - 0.6, 1.2, 0.02, 0.9);
    for (let i = 0; i <= 6; i++) for (const sz of [-1, 1]) b.box('m', 0x8a5a33, x - w / 2 + i * w / 6, 0, z + sz * d / 2, 0.12, 0.9, 0.12);
    for (let i = 0; i <= 5; i++) { b.box('m', 0x8a5a33, x - w / 2, 0, z - d / 2 + i * d / 5, 0.12, 0.9, 0.12); if (i <= 1 || i >= 4) b.box('m', 0x8a5a33, x + w / 2, 0, z - d / 2 + i * d / 5, 0.12, 0.9, 0.12); }
    for (const y of [0.35, 0.75]) { for (const sz of [-1, 1]) b.box('m', 0xa0703f, x, y, z + sz * d / 2, w, 0.1, 0.06); b.box('m', 0xa0703f, x - w / 2, y, z, 0.06, 0.1, d); for (const sz of [-1, 1]) b.box('m', 0xa0703f, x + w / 2, y, z + sz * (d / 2 - 0.75), 0.06, 0.1, 1.5); }
    b.box('m', 0x7c4a1e, x + 1.4, 0, z - 1.8, 1.6, 0.35, 0.5); b.box('m', 0x93c5fd, x + 1.4, 0.3, z - 1.8, 1.4, 0.04, 0.35); b.box('m', 0xb45309, x - 2.2, 0, z + 1.6, 1.0, 1.0, 0.8); b.box('m', 0x7c2d12, x - 2.2, 1.0, z + 1.6, 1.2, 0.1, 1.0); });
  scene.add(g); const s = sign("CANDY'S PIGLETS", 2.6, 0.5, { bg: '#db2777', border: '#fde68a' }); s.position.set(PEN.x + PEN.w / 2 + 0.1, 1.5, PEN.z - 1.9); s.rotation.y = PI / 2; scene.add(s);
  const { x, z, w, d } = PEN; solid(x - w / 2 - 0.1, z - d / 2 - 0.1, x + w / 2 + 0.1, z - d / 2 + 0.1, 0, 1); solid(x - w / 2 - 0.1, z + d / 2 - 0.1, x + w / 2 + 0.1, z + d / 2 + 0.1, 0, 1); solid(x - w / 2 - 0.1, z - d / 2, x - w / 2 + 0.1, z + d / 2, 0, 1);
  solid(x + w / 2 - 0.1, z - d / 2, x + w / 2 + 0.1, z - 1, 0, 1); solid(x + w / 2 - 0.1, z + 1, x + w / 2 + 0.1, z + d / 2, 0, 1); }
const pigs = Array.from({ length: 5 }, (_, i) => { const m = makePig(); scene.add(m); return { m, x: PEN.x - 2 + (i % 3) * 1.2, z: PEN.z - 0.8 + (i >> 1) * 0.9, yaw: i, st: 'pen', wt: 0, t: i }; });
const inPen = (x, z) => Math.abs(x - PEN.x) < PEN.w / 2 - 0.3 && Math.abs(z - PEN.z) < PEN.d / 2 - 0.3;
let PG = null;
function pigStart() { if (PG) return; const pen = { x: PEN.x, z: PEN.z }; PG = { t: 90, home: 0, pigs, trail: [], helpT: 18, oldHome: candy.home };
  pigs.forEach((p, i) => { const a = i / 5 * PI * 2 + 0.4, r = 9 + (i % 3) * 5; const o = freeSpot(pen.x + Math.cos(a) * r, pen.z + Math.sin(a) * r * 0.8, 0.5); p.st = 'loose'; p.tx = o.x; p.tz = o.z; p.x = PEN.x + PEN.w / 2 + 0.5; p.z = PEN.z; p.wt = 0; });
  candy.x = PEN.x + PEN.w / 2 + 2; candy.z = PEN.z + 1.5; candy.home = { x: candy.x, z: candy.z }; sfx('whoosh'); talk('Candy', "RUFF! The gate was open and my 5 piglets ran off! Walk up to each one and lead it back into the pen. I'll help!", 5); }
function pigEnd() { const n = PG.home, all = n === pigs.length, mul = EV('pig') ? 1.5 : 1; let txt;
  if (all) { const c = Math.round(15 * mul); S.coins += c; addMood(4); if (!S.medals.includes('piglets')) S.medals.push('piglets'); sfx('cheer'); txt = `All 5 piglets are home safe! Candy gives you a big schnauzer hug. +${c} 🪙 +4 😊${mul > 1 ? ' (Piglet Wednesday)' : ''}`; }
  else { S.coins += n * 2; addMood(-3); sfx('whoosh'); txt = `Time's up: only ${n}/5 piglets made it home. The farm stays noisy and muddy (−3 😊${n ? `, +${n * 2} 🪙 for the ones you saved` : ''}). Don't worry: Candy rounds up the rest for free. Try again any time!`; }
  for (const p of pigs) { p.st = 'pen'; p.x = PEN.x - 2 + Math.random() * 4; p.z = PEN.z - 1.2 + Math.random() * 2.4; } candy.home = PG.oldHome; candy.x = candy.home.x; candy.z = candy.home.z; PG = null; save(); msg("🐷 Candy's Piglets", txt, [['OK', null]]); }
function stepPigs(dt) { const t = performance.now() / 1000;
  if (PG) { PG.t -= dt; PG.trail.unshift([P.x, P.z]); if (PG.trail.length > 120) PG.trail.length = 120; PG.helpT -= dt;
    if (PG.helpT <= 0) { PG.helpT = 22; const l = pigs.find((p) => p.st === 'loose'); if (l) { l.st = 'home'; l.x = PEN.x - 1 + Math.random() * 2; l.z = PEN.z; PG.home++; talk('Candy', 'Woof! I herded one home!', 2.5); sfx('pop'); } } }
  let fi = 0; for (const p of pigs) { let sp = 0;
    if (p.st === 'pen' || p.st === 'home') { p.wt -= dt; if (p.wt <= 0) { p.wt = 1 + Math.random() * 2.5; p.tx = PEN.x + (Math.random() - 0.5) * (PEN.w - 1.4); p.tz = PEN.z + (Math.random() - 0.5) * (PEN.d - 1.4); } }
    else if (p.st === 'loose') { if (Math.hypot(p.tx - p.x, p.tz - p.z) < 0.3) { p.wt -= dt; if (p.wt <= 0) { p.wt = 1.5 + Math.random() * 2; const o = freeSpot(p.x + (Math.random() - 0.5) * 6, p.z + (Math.random() - 0.5) * 6, 0.4); p.tx = o.x; p.tz = o.z; } }
      if (Math.hypot(P.x - p.x, P.z - p.z) < 1.9 && P.mode === 'walk') { p.st = 'follow'; sfx('pop'); toast('🐷 Oink! A piglet is following you'); } }
    if (p.st === 'follow') { fi++; const tr = PG.trail[Math.min(PG.trail.length - 1, 14 * fi)] || [P.x, P.z]; p.tx = tr[0]; p.tz = tr[1]; if (inPen(p.x, p.z) || (inPen(P.x, P.z) && Math.hypot(p.x - P.x, p.z - P.z) < 9)) { p.st = 'home'; PG.home++; sfx('coin'); toast(`🐷 Piglet home! ${PG.home}/5`); } }
    const dx = p.tx - p.x, dz = p.tz - p.z, d = Math.hypot(dx, dz); const v = p.st === 'follow' ? Math.min(7, d * 3) : p.st === 'loose' ? 2.6 : 0.8;
    if (d > 0.15) { const s2 = Math.min(d, v * dt); p.x += dx / d * s2; p.z += dz / d * s2; p.yaw = Math.atan2(dx, dz); sp = v; if (p.st === 'loose') collide(p, 0.35); }
    if (p.st === 'pen' || p.st === 'home') { p.x = clamp(p.x, PEN.x - PEN.w / 2 + 0.5, PEN.x + PEN.w / 2 - 0.5); p.z = clamp(p.z, PEN.z - PEN.d / 2 + 0.5, PEN.z + PEN.d / 2 - 0.5); }
    p.m.position.set(p.x, sp > 0.2 ? Math.abs(Math.sin(t * 14 + p.t)) * 0.08 : 0, p.z); p.m.rotation.y = p.yaw; }
  if (PG && (PG.home >= pigs.length || PG.t <= 0)) pigEnd(); }
// --- hayride (tractor + hay wagon loop round the whole town)
const HAYR = [[-8, 18], [-18, 24], [-36, 18], [-38, -2], [-30, -18], [-6, -18], [6, -16], [16, -16], [30, -18], [37, -17.5], [37, -8], [37, 4], [40, 10], [30, 18], [-8, 18]];
const HL = [0]; for (let i = 1; i < HAYR.length; i++) HL.push(HL[i - 1] + Math.hypot(HAYR[i][0] - HAYR[i - 1][0], HAYR[i][1] - HAYR[i - 1][1]));
function hayAt(s) { s = ((s % HL.at(-1)) + HL.at(-1)) % HL.at(-1); let i = 1; while (HL[i] < s) i++; const a = HAYR[i - 1], b2 = HAYR[i], f = (s - HL[i - 1]) / (HL[i] - HL[i - 1]); return [a[0] + (b2[0] - a[0]) * f, a[1] + (b2[1] - a[1]) * f, Math.atan2(b2[0] - a[0], b2[1] - a[1])]; }
const tractor = grp((b) => { b.box('m', 0x16a34a, 0, 0.55, 0.3, 1.2, 0.7, 2.0); b.box('m', 0x15803d, 0, 1.25, -0.4, 1.1, 1.0, 0.9); b.box('l', 0xbfe3ff, 0, 1.45, 0.06, 0.9, 0.6, 0.02, 0, 0.3); b.box('m', 0xfacc15, 0, 2.25, -0.4, 1.3, 0.08, 1.1);
  for (const sx of [-0.7, 0.7]) { b.cyl('m', 0x111827, sx, 0.65, -0.5, 0.65, 0.35, 0, PI / 2); b.cyl('m', 0xfacc15, sx * 1.02, 0.65, -0.5, 0.3, 0.37, 0, PI / 2); b.cyl('m', 0x111827, sx * 0.85, 0.35, 1.0, 0.35, 0.25, 0, PI / 2); }
  b.cyl('x', 0x374151, 0.35, 1.25, 0.9, 0.06, 0.9); b.box('l', 0xfff1b0, 0, 0.8, 1.31, 0.8, 0.2, 0.02, 0, 1); });
const wagon = grp((b) => { b.box('m', 0x8a5a33, 0, 0.55, 0, 1.8, 0.2, 3.2); for (const sx of [-0.9, 0.9]) b.box('m', 0x6b4a2e, sx, 0.75, 0, 0.08, 0.45, 3.2); b.box('m', 0x6b4a2e, 0, 0.75, -1.6, 1.8, 0.45, 0.08); b.box('m', 0x5b3a24, 0, 0.5, 2.0, 0.15, 0.12, 1.0);
  for (const sx of [-0.95, 0.95]) for (const sz of [-1.1, 1.1]) b.cyl('m', 0x111827, sx, 0.4, sz, 0.4, 0.2, 0, PI / 2);
  for (const [x, z] of [[-0.45, -1.0], [0.45, -1.0], [-0.45, 0.9]]) b.rbox('m', 0xe3c062, x, 0.75, z, 0.8, 0.5, 1.0);
  for (const sz of [-1.5, 1.5]) { b.cyl('x', 0x374151, 0.85, 0.75, sz, 0.02, 1.1); b.sph('l', 0xffc35a, 0.85, 1.95, sz, 0.12, 0.15, 0.12, 1.2); } b.sph('g', 0xf97316, -0.5, 1.45, -1.0, 0.25, 0.2, 0.25); });
scene.add(tractor, wagon);
const wavers = [['grandma', 'Grandma Gouda'], ['grandpa', 'Grandpa Cheddar'], ['mom', 'Mom Camembert'], ['dad', 'Dad Roquefort'], ['brother', 'Bram']].map(([id, who], i) => { const s = HL.at(-1) * (0.1 + i * 0.18); const [x, z, h] = hayAt(s); const side = i % 2 ? 1 : -1; const o = freeSpot(x + Math.cos(h) * 3.2 * side, z - Math.sin(h) * 3.2 * side, 0.5);
  const p = put(makePet(id, { s: 1.15 }), o.x, o.z, 0); p.who = who; p.s = s; p.root.visible = false; return p; });
let HR = null; function parkHay() { place(0); function place(s) { const [x, z, h] = hayAt(s), [wx, wz, wh] = hayAt(s - 4.4); tractor.position.set(x, 0, z); tractor.rotation.y = h; wagon.position.set(wx, 0, wz); wagon.rotation.y = wh; } }
parkHay(); solidC(-8, 18, 0.1, 0.1, 0.1);
const HSTOP = { x: hayAt(-2.2)[0] + 2.2, z: hayAt(-2.2)[1] + 1.8 };
function hayStart() { const q = Q(); const free = q.hayFree === 1; if (!free && S.coins < 2) { toast('Need 2 🪙 for a hayride ticket'); return; } if (free) q.hayFree = 0; else S.coins -= 2;
  HR = { s: 0, v: 0, waved: 0, missed: 0, oops: 0 }; for (const w of wavers) { w.root.visible = true; w.done = false; w.miss = false; } P.mode = 'hay'; cam.snap = true; sfx('pop');
  talk('Farmer Torty', `All aboard! ${free ? 'This ride is on me.' : ''} Wave 👋 at the neighbours as we pass (+${EV('hay') ? 4 : 2} 🪙 each). Don't wave at fence posts!`, 5); }
function hayWave() { if (!HR) return; const w = wavers.find((p) => !p.done && !p.miss && Math.hypot(p.x - P.x, p.z - P.z) < 7.5); if (w) { w.done = true; HR.waved++; const c = EV('hay') ? 4 : 2; S.coins += c; sfx('coin'); toast(`👋 ${w.who} waves back! +${c} 🪙`); w.hop = 0.6; } else { HR.oops++; addMood(-1); sfx('whoosh'); toast('👋 …you waved at a fence post. −1 😊'); } }
function stepHay(dt) { HR.v = Math.min(6.5, HR.v + dt * 2.5); if (HR.s > HL.at(-1) - 12) HR.v = Math.max(1.2, HR.v - dt * 5); HR.s += HR.v * dt;
  const [x, z, h] = hayAt(HR.s), [wx, wz, wh] = hayAt(HR.s - 4.4); tractor.position.set(x, 0, z); tractor.rotation.y = h; wagon.position.set(wx, 0, wz); wagon.rotation.y = wh;
  P.x = wx - Math.sin(wh) * 0.2; P.z = wz - Math.cos(wh) * 0.2; P.y = 0.65; P.yaw = wh; P.speed = 0;
  for (const w of wavers) { const d = Math.hypot(w.x - P.x, w.z - P.z); if (!w.done && !w.miss && w.near && d > 9) { w.miss = true; HR.missed++; } w.near = d < 7.5; if (w.hop > 0) { w.hop -= dt; w.y = Math.abs(Math.sin(w.hop * 10)) * 0.4; } else w.y = 0; w.yaw = Math.atan2(P.x - w.x, P.z - w.z); w.noTurn = true; w.speed = 0; animPet(w, dt, null); }
  HR.btn = { label: wavers.some((p) => !p.done && !p.miss && p.near) ? '👋 Wave at ' + wavers.find((p) => !p.done && !p.miss && p.near).who + '!' : '👋 Wave', f: hayWave };
  if (HR.s >= HL.at(-1)) { const w = HR.waved; P.mode = 'walk'; P.y = 0; P.x = HSTOP.x; P.z = HSTOP.z; cam.snap = true; for (const p of wavers) p.root.visible = false; parkHay(); let txt;
    if (w >= 3) { addMood(5); txt = `What a ride! You waved at ${w}/5 neighbours. +5 😊`; sfx('cheer'); } else { addMood(-2); Q().hayFree = 1; txt = `You only waved at ${w}/5 neighbours and they felt ignored. −2 😊<br><small>Farmer Torty gives you a free ticket so you can make it up to them.</small>`; sfx('whoosh'); }
    HR = null; save(); msg('🚜 Hayride', txt, [['OK', null]]); } }
// --- neighbour requests (3 a day, from the date; deliver inside their building before midnight PST)
const REQP = [['Cook Ash', 'diner', 'potato', 2, 8, -4.6, -1.4], ['Baker Cream', 'bakery', 'pumpkin', 2, 9, 1.8, -1.6], ['Cider Brie', 'cider', 'cranberry', 2, 6, 3.6, 0.6], ['Shopkeeper Rose', 'pumpkin', 'corn', 3, 8, 3.6, -1.2], ['Foreman Blue', 'cranberry', 'cranberry', 3, 8, 4.2, -0.2],
  ['Mechanic Black', 'workshop', 'corn', 2, 7, 2.8, -2.4], ['Luna', 'luna', 'pumpkin', 1, 6, 1.4, 1.6], ['Mayor Gold', 'hall', 'potato', 1, 5, 1.2, -1.6], ['Farmhand Brownie', 'barn', 'corn', 2, 6, 2.2, -2.2]];
function reqs() { if (!S.req || S.req.d !== DATE) { const r = rng(Y * 400 + Mo * 31 + D), pool = REQP.slice(), l = []; while (l.length < 3) l.push(pool.splice(Math.floor(r() * pool.length), 1)[0]); S.req = { d: DATE, done: [], l: l.map((x) => x[0]) }; } return S.req.l.map((w) => REQP.find((x) => x[0] === w)); }
const ROOMN = Object.fromEntries(RM.DOORS.map((d) => [d.id, d.name]));
function reqText() { return reqs().map(([who, room, item, n, pay]) => `${S.req.done.includes(who) ? '✅' : '⬜'} <b>${who}</b> (${ROOMN[room]}) needs ${n} ${ICON[item]} · +${pay + (EV('req') ? 2 : 0)} 🪙`).join('<br>'); }
function reqBoard() { msg('📦 Neighbour Requests · ' + DATE, reqText() + '<br><br><small>Bring the crops to them inside their building. New requests every day at midnight PST; unfinished ones expire.</small>', [['OK', null]]); }
function reqSpots(c) { const o = []; for (const [who, room, item, n, pay, x, z] of reqs()) if (room === c.id && !S.req.done.includes(who)) o.push({ x: c.ox + x, z: c.oz + z, r: 1.3, label: `📦 Give ${who} ${n} ${ICON[item]} (+${pay + (EV('req') ? 2 : 0)} 🪙)`, f: () => {
  if (S.bag[item] < n) { talk(who, `I need ${n} ${ICON[item]} ${item}${n > 1 ? 's' : ''} and you have ${S.bag[item]}. Torty's field has plenty!`); return; } S.bag[item] -= n; const p = pay + (EV('req') ? 2 : 0); S.coins += p; addMood(3); S.req.done.push(who); sfx('cheer'); save(); talk(who, `Thank you, neighbour! +${p} 🪙 +3 😊`); if (S.req.done.length === 3) setTimeout(() => toast('📦 All 3 requests done today! +5 🪙 bonus'), 700), S.coins += 5; } }); return o; }
const RQB = freeSpot(4.5, 13.5, 1.0); { const g = grp((b) => { for (const sx of [-0.9, 0.9]) b.box('m', 0x6b4a2e, RQB.x + sx, 0, RQB.z, 0.14, 2.2, 0.14); b.box('m', 0x8a5a33, RQB.x, 1.0, RQB.z, 2.0, 1.1, 0.1); for (let i = 0; i < 3; i++) b.box('m', 0xfef3c7, RQB.x - 0.6 + i * 0.6, 1.15, RQB.z + 0.06, 0.45, 0.6, 0.02, (i - 1) * 0.08); });
  scene.add(g); const s = sign('REQUESTS', 1.6, 0.36, { bg: '#7c2d12', border: '#fbbf24' }); s.position.set(RQB.x, 2.35, RQB.z + 0.08); scene.add(s); solidC(RQB.x, RQB.z, 2.0, 0.3, 2.2); }
// --- outdoor spot list + hooks
function step4Spots() { const o = [{ x: SC.x, z: SC.z + 2.6, r: 2.2, pri: 1, label: Q().straw === 1 ? '🎃 Scarecrow contest (free straw)' : '🎃 Enter the scarecrow contest (1 🌽)', f: scareContest },
  { x: HSTOP.x, z: HSTOP.z, r: 2.4, pri: 1, label: Q().hayFree === 1 ? '🚜 Hayride (free ticket)' : '🚜 Hayride round town (2 🪙)', f: hayStart }, { x: RQB.x, z: RQB.z + 1.0, r: 1.8, label: '📦 Read the neighbour requests', f: reqBoard }];
  if (!PG) o.push({ x: PEN.x + PEN.w / 2 + 1.4, z: PEN.z, r: 2.0, label: "🐷 Help Candy with her piglets", f: pigStart });
  for (const a of outAcorns) if (!a.got) o.push({ x: a.x, z: a.z, r: 1.3, label: '🌰 Grab the golden acorn!', f: () => { a.got = true; a.m.visible = false; S.acorns = S.acorns || []; S.acorns.push(a.key); S.coins += 5; sfx('cheer'); toast(`🌰 Golden acorn ${S.acorns.length}/20! +5 🪙`); acornDone(S.acorns.length); save(); } });
  return o; }
function step4Tick(dt) { const t = performance.now() / 1000; for (const a of outAcorns) if (!a.got) { a.m.rotation.y = t * 2; a.m.position.y = Math.sin(t * 3) * 0.08; } stepPigs(dt);
  const ci = RM.inside(); if (ci) { const ids = new Set(ci.npcs.map((p) => p.pid)); for (const p of folk) p.root.visible = !ids.has(p.pid); } else for (const p of folk) p.root.visible = true; }
window.__oh.S4 = { EVS, outAcorns, pigs, get PG() { return PG; }, get HR() { return HR; }, HL, HSTOP, SC, PEN, RQB, wavers, reqs, scareTheme, syncAcorns, hayAt, tractor };
