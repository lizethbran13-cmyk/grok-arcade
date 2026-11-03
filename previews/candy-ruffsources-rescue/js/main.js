// Candy's RuffSources Rescue - Turbo: play as Candy (miniature schnauzer), rescue pups around Pawsville, run the RuffSources shelter.
import * as THREE from 'three';
import { E, initEngine, setEnvironment, followShadow, render, trackFps } from './engine.js';
import { IN, initInput, readMove, edge } from './input.js';
import { FollowCam } from './cam.js';
import { initAudio, sfx } from './audio.js';
import { $, clamp, toast } from './util.js';
import { makePet, animPet } from './pets.js';
import { animPup } from './dogs.js';
import { setOutfit } from './models.js';
import { buildTown, T, ROADS } from './town.js';
import { initMats } from './mats.js';
import { COL, collide, ray, Batch, G, PI } from './kit.js';
import { makeTruck, TRUCKS, makeCar } from './actors.js';
import { makeSweepy, animSweepy } from './models2.js';

const KEY = 'candyRescue.save.v1';
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window; if (isTouch) document.body.classList.add('touch');
const canvas = $('c'); initEngine(canvas, 'high'); initInput();
const scene = E.scene;
setEnvironment({ skyTop: 0x2f7fd8, skyMid: 0x8cc4f0, skyBot: 0xdcefff, sunDir: [0.55, 0.75, 0.35], sunColor: 0xfff1d6, sunI: 2.6, hemiSky: 0xcfe6ff, hemiGround: 0x6a7f4a, hemiI: 0.9, exposure: 0.88, fog: 0xbfdcf2, fogD: 0.0042, envI: 0.7, bloomT: 1.05, bloomS: 0.22 });
initMats(); buildTown(scene);

// ---------------- data ----------------
const PUP_BREEDS = ['corgi', 'poodle', 'dalmatian', 'pug', 'dachshund', 'golden', 'beagle', 'pomeranian', 'bulldog', 'shiba', 'chihuahua', 'sheepdog', 'collie', 'basset', 'lab', 'pupcorgi', 'husky'];
const BREED_NAME = { corgi: 'corgi', poodle: 'poodle', dalmatian: 'dalmatian', pug: 'pug', dachshund: 'dachshund', golden: 'golden retriever', beagle: 'beagle', pomeranian: 'pomeranian', bulldog: 'bulldog', shiba: 'shiba inu', chihuahua: 'chihuahua', sheepdog: 'sheepdog', collie: 'border collie', basset: 'basset hound', lab: 'labrador', pupcorgi: 'corgi puppy', husky: 'husky' };
const PUP_NAMES = ['Biscuit', 'Waffles', 'Pepper', 'Noodle', 'Mochi', 'Ziggy', 'Pickles', 'Bean', 'Rosie', 'Tater', 'Olive', 'Scout', 'Peanut', 'Gizmo', 'Maple', 'Nugget', 'Pip', 'Sprout', 'Daisy', 'Banjo', 'Cookie', 'Fudge', 'Lulu', 'Rocket'];
const MTYPES = {
  tree: { ic: '🌳', name: 'Pup stuck up a tree', d: 'Prop the ladder and climb carefully (timing).', limit: 150, pay: 30 },
  lost: { ic: '🔍', name: 'Lost pup', d: 'Sniff around the search zone, then coax the pup out.', limit: 170, pay: 34 },
  gadget: { ic: '⚙️', name: 'Ratita gadget gone haywire', d: 'A Robo-Sweeper is circling a scared pup. Catch it and hit OFF!', limit: 140, pay: 40 },
  stuck: { ic: '🕳️', name: 'Pup stuck in a fence', d: 'Wiggle the pup free before it panics (tap fast).', limit: 150, pay: 32 },
};
const fresh = (mode) => ({ v: 1, mode, money: mode === 'empire' ? 400 : 40, rep: mode === 'empire' ? 70 : 50, truck: 'rescue', trucks: ['rescue'], tools: {}, decor: mode === 'empire' ? { beds2: 1, beds3: 1, bonetable: 1, treat: 1 } : {}, dmg: 0, pups: [], offers: null, treatBank: 0, partyT: 0,
  stats: { rescued: 0, failed: 0, adopted: 0, party: 0, crashes: 0 }, time: 0, tut: mode === 'scratch' ? 0 : 9, nameI: 0 });
let S = null;
const save = () => { if (!S) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const load = () => { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s && s.v === 1 ? s : null; } catch (e) { return null; } };
const bedsMax = () => 4 + (S.decor.beds2 ? 4 : 0) + (S.decor.beds3 ? 4 : 0);

// ---------------- mission sites (computed from the built town: clear, reachable spots by the sidewalks + in the park) ----------------
const _roadD = (x, z) => Math.min(...ROADS.xs.map((rx) => Math.abs(x - rx)), ...ROADS.zs.map((rz) => Math.abs(z - rz)));
const onGrass = (x, z, r = 0.7) => { if (_roadD(x, z) < 6.6 || (Math.abs(x) < 26 && Math.abs(z) < 19)) return false; for (const b of COL.boxes) { if (b.y1 < 0.35 || b.g) continue; if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) return false; } return true; };
const SITES = []; {
  const clear = (x, z, r) => { for (const b of COL.boxes) { if (b.y1 < 0.35 || b.g) continue; if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) return false; } return true; };
  const roadD = (x, z) => Math.min(...ROADS.xs.map((rx) => Math.abs(x - rx)), ...ROADS.zs.map((rz) => Math.abs(z - rz)));
  for (let x = -96; x <= 96; x += 3) for (let z = -86; z <= 86; z += 3) { if (Math.abs(x) < 26 && Math.abs(z) < 19) continue; const rd = roadD(x, z); const inPark = x > 48 && x < 76 && Math.abs(z) < 16;
    if (!((rd > 6.4 && rd < 8.6) || inPark)) continue; if (!clear(x, z, 3.2)) continue; SITES.push({ x, z, zone: x < -34 && Math.abs(z) < 30 ? 'factory' : inPark ? 'park' : 'town' }); }
}
const streetOf = (x, z) => { const N = { '-22': 'Biscuit Ave', '22': 'Wag Blvd', '-80': 'North Bark Rd', '80': 'South Bark Rd', '-90': 'West Fetch St', '-30': 'Puppy Lane', '30': 'Paw Lane', '90': 'East Fetch St' };
  if (x > 48 && x < 76 && Math.abs(z) < 18) return 'Tortuga Park'; if (x < -34 && Math.abs(z) < 30) return 'by Ratita Gadget Works'; let best = '', bd = 1e9; for (const r of ROADS.xs) if (Math.abs(x - r) < bd) { bd = Math.abs(x - r); best = N[r]; } for (const r of ROADS.zs) if (Math.abs(z - r) < bd) { bd = Math.abs(z - r); best = N[r]; } return best; };

// ---------------- actors ----------------
const me = makePet('candy', { s: 1.25 }); scene.add(me.root);
const P = { x: 0, z: 10, yaw: PI, speed: 0, mode: 'walk' };
const cam = new FollowCam(); cam.want = 5.2; cam.hgt = 1.1;
const world = { ray: (o, d, m, f) => ray(o, d, m, f) };
let truck = null; const TK = { x: 0, z: 0, yaw: 0, v: 0, steer: 0 };
function spawnTruck(kind) { if (truck) scene.remove(truck.root); truck = makeTruck(kind); scene.add(truck.root); }
function parkTruck() { const s = T.spots.truck; TK.x = s.x; TK.z = s.z; TK.yaw = s.yaw; TK.v = 0; }
// cameos (correct species: Luna grey fancy rat, Pi-rat brown one-eyed rat with patch, Snowie white fancy rat, Torty desert tortoise)
const luna = makePet('luna', { s: 1.3, extras: ['glasses'] }), snowie = makePet('snowie', { s: 1.25 }), pirat = makePet('pirat', { s: 1.3, extras: ['vest'] }), torty = makePet('torty', { s: 1.0 });
for (const [p, s] of [[luna, T.spots.luna], [snowie, T.spots.snowie], [pirat, T.spots.pirat], [torty, T.spots.torty]]) { p.x = s.x; p.z = s.z; p.y = 0.16; p.yaw = s.yaw || 0; p.home = { ...s }; scene.add(p.root); }
try { setOutfit(snowie.rig, 'flower'); } catch (e) {}
const CAMEOS = [[luna, 'luna'], [snowie, 'snowie'], [pirat, 'pirat'], [torty, 'torty']];
const LINES = {
  luna: ['Candy! Ratita Industries owes you one. Those Robo-Sweepers were NOT supposed to leave the lab.', 'I\'m just visiting HR to sign the "gadget safety" memo. Again.', 'If you catch a haywire Sweeper, hit the OFF switch on its back. The red light, you can\'t miss it.', 'A cozy shelter means happy pups. Happy pups means fewer forms. You love fewer forms.'],
  snowie: ['Hi Candy! I run reception and the Grok Pet Party guest list. Rescued pups make the BEST guests!', 'Tortuga TV called, they want another pup on Grok Pet Party. Book one at my desk!', 'Pick a rescue from the Mission Board, it\'s right next to my desk.'],
  pirat: ['Arr, Candy! Best rescue gear on the seven sidewalks. One eye on the stock, one on the till.', 'Sniffer Goggles point straight at lost pups. Worth every treat, says I.', 'The Turbo Rescue Van be fast as a cannonball. Just mind the lamp posts.'],
  torty: ['...slow and steady... ...every pup finds a home...', '...bring me rested pups... ...I find them families...', '...if a rescue goes wrong... ...my shuttle brings the pup home... ...for free... ...eventually...'],
};
// rescue mission props
const markGeo = new THREE.TorusGeometry(2.4, 0.16, 8, 36), markMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0xf472b6, emissiveIntensity: 1.5 });
const pinGeo = new THREE.OctahedronGeometry(0.55), pinMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 1.2 });
const zoneMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
const arrow = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0xdb2777, emissiveIntensity: 1.2 }); const c = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.9, 16), m); c.rotation.x = PI / 2; c.position.z = 0.45; const s = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.8), m); s.position.z = -0.25; arrow.add(c, s); } scene.add(arrow); arrow.visible = false;
function helpBubble(txt) { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.roundRect(8, 8, 240, 92, 30); g.fill(); g.beginPath(); g.moveTo(110, 98); g.lineTo(128, 124); g.lineTo(146, 98); g.fill(); g.fillStyle = '#be185d'; g.font = '900 54px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 128, 56);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true })); s.scale.set(1.4, 0.7, 1); return s; }
const leashGeo = new THREE.BufferGeometry(); leashGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3)); const leash = new THREE.Line(leashGeo, new THREE.LineBasicMaterial({ color: 0xdb2777 })); leash.frustumCulled = false; scene.add(leash); leash.visible = false;
// traffic (quiet residential loops)
const cars = []; { const cols = [0x0ea5e9, 0x16a34a, 0xf97316, 0xa855f7, 0xe11d48, 0x64748b];
  const loops = [{ hx: 30 - 2.5, hz: 22 - 2.5, dir: -1 }, { hx: 30 + 2.5, hz: 22 + 2.5, dir: 1 }, { hx: 90 - 2.5, hz: 80 - 2.5, dir: -1 }, { hx: 90 + 2.5, hz: 80 + 2.5, dir: 1 }];
  loops.forEach((L, li) => { const per = 2 * (L.hx + L.hz) * 2; const n = li < 2 ? 2 : 3; for (let k = 0; k < n; k++) { const c = makeCar(cols[(li * 3 + k) % cols.length]); c.L = L; c.s = per * k / n + li * 13; c.v = 9; scene.add(c.root); cars.push(c); } }); }
function loopPos(L, s, out) { const W = 2 * L.hx, H = 2 * L.hz, per = 2 * (W + H); s = ((s % per) + per) % per; if (L.dir < 0) s = per - s; let x, z, dx, dz;
  if (s < W) { x = -L.hx + s; z = -L.hz; dx = 1; dz = 0; } else if (s < W + H) { x = L.hx; z = -L.hz + (s - W); dx = 0; dz = 1; } else if (s < 2 * W + H) { x = L.hx - (s - W - H); z = L.hz; dx = -1; dz = 0; } else { x = -L.hx; z = L.hz - (s - 2 * W - H); dx = 0; dz = -1; }
  if (L.dir < 0) { dx = -dx; dz = -dz; } out.x = x; out.z = z; out.yaw = Math.atan2(dx, dz); return out; }

// ---------------- helpers ----------------
const money = (d) => { S.money = Math.max(0, Math.round(S.money + d)); if (d > 0) sfx('coin'); };
const rep = (d) => { S.rep = clamp(S.rep + d, 0, 100); };
const inHQ = (x, z) => Math.abs(x) < 16.8 && Math.abs(z) < 12.8;
const groundY = (x, z) => { if (Math.abs(x) < 17 && Math.abs(z) < 13) return 0.16; for (const bx of [-60, 0, 60]) for (const bz of [-51, 0, 51]) if (Math.abs(x - bx) < 25 && Math.abs(z - bz) < 24) return 0.15; return 0.04; };
let talkT = 0; function talk(who, txt) { $('talkWho').textContent = who + ': '; $('talkTxt').textContent = txt; $('talk').classList.add('on'); talkT = 5; }
let modal = null; function openModal(id) { closeModals(); modal = id; $(id).classList.add('on'); }
function closeModals() { for (const id of ['fixUI', 'mashUI', 'shopUI', 'boardUI', 'mapUI', 'menuUI', 'msgUI']) $(id).classList.remove('on'); modal = null; }
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => closeModals()));
function msg(title, body, btns) { $('msgT').textContent = title; $('msgB').textContent = body; const box = $('msgBtns'); box.innerHTML = ''; for (const [label, fn, cls] of btns) { const b = document.createElement('button'); b.className = cls || 'primary'; b.textContent = label; b.onclick = () => { closeModals(); fn && fn(); }; box.appendChild(b); } openModal('msgUI'); }
const rnd = (a) => a[Math.floor(Math.random() * a.length)];

// ---------------- shelter pups (in beds) ----------------
const bedPups = []; // rigs matching S.pups
function syncShelter() {
  while (bedPups.length) scene.remove(bedPups.pop().root);
  S.pups.forEach((p, i) => { const b = T.beds[i]; if (!b) return; const d = makePet('pup', { breed: p.breed, s: 0.9, collar: p.col, seed: p.seed }); d.x = b.x; d.z = b.z; d.y = 0.33; d.yaw = (i * 1.7) % 6; d.mode = i % 3 === 0 ? 'sit' : 'sleep'; d.noTurn = true; scene.add(d.root); bedPups.push(d); });
}
function applyWorld() {
  for (const id in T.decor) T.decor[id].visible = !!S.decor[id];
  T.decor.eotm0.visible = !S.decor.eotm;
  if (!truck || truck.kind !== S.truck) spawnTruck(S.truck);
  syncShelter();
}

// ---------------- missions ----------------
let M = null; // active mission
function newPup() { const breed = rnd(PUP_BREEDS); const name = PUP_NAMES[(S.nameI++) % PUP_NAMES.length]; return { breed, name, seed: Math.floor(Math.random() * 999), col: rnd([0xff4fa0, 0x3b82f6, 0x22c55e, 0xfacc15, 0xa855f7, 0xf97316]) }; }
function makeOffers() { const types = Object.keys(MTYPES).sort(() => Math.random() - 0.5).slice(0, 3); S.offers = types.map((type) => { const pool = SITES.filter((s) => type === 'gadget' ? s.zone === 'factory' || Math.random() < 0.15 : s.zone !== 'factory');
  const site = rnd(pool.length ? pool : SITES); const pup = newPup(); const dist = Math.hypot(site.x, site.z); return { type, x: site.x, z: site.z, pup, where: streetOf(site.x, site.z), limit: Math.round(MTYPES[type].limit + dist * 0.5 + (S.tools.leash ? 25 : 0)), pay: Math.round(MTYPES[type].pay + dist / 6) }; }); }
function renderBoard() { const L = $('boardList'); L.innerHTML = ''; if (!S.offers) makeOffers();
  if (M) { const d = document.createElement('div'); d.className = 'note'; d.textContent = `You're on a rescue: ${M.pup.name} the ${BREED_NAME[M.pup.breed]}. Finish it first!`; L.appendChild(d); }
  const full = S.pups.length >= bedsMax();
  if (full) { const d = document.createElement('div'); d.className = 'note'; d.textContent = `🛏️ The shelter is full (${S.pups.length}/${bedsMax()}). Adopt pups out at Torty's desk or buy more beds from Pi-rat.`; L.appendChild(d); }
  S.offers.forEach((o, i) => { const t = MTYPES[o.type]; const row = document.createElement('div'); row.className = 'mis';
    row.innerHTML = `<div class="ic">${t.ic}</div><div class="tx"><b>${t.name}: ${o.pup.name} the ${BREED_NAME[o.pup.breed]}</b><small>📍 ${o.where} · ⏱ ${o.limit}s · 🦴 ${o.pay} · ${t.d}</small></div>`;
    const b = document.createElement('button'); b.className = 'ghost'; b.textContent = 'Accept'; b.disabled = !!M || full; b.onclick = () => { closeModals(); startMission(i); }; row.appendChild(b); L.appendChild(row); }); }
function addCol(x0, z0, x1, z1, y1) { const b = { x0, x1, z0, z1, y0: 0, y1, g: null, tag: 'mis' }; COL.boxes.push(b); return b; }
function startMission(i) {
  const o = S.offers[i]; S.offers.splice(i, 1); if (S.offers.length < 3) { const keep = S.offers; makeOffers(); S.offers = keep.concat(S.offers).slice(0, 3); }
  const g = new THREE.Group(); scene.add(g); const B = new Batch(); const cols = [];
  const pup = makePet('pup', { breed: o.pup.breed, s: 0.95, collar: o.pup.col, seed: o.pup.seed }); scene.add(pup.root); pup.mode = 'sit';
  M = { ...o, g, cols, pupR: pup, stage: 'go', t: 0, tries: 0, bubble: helpBubble('HELP!') };
  const ring = new THREE.Mesh(markGeo, markMat); ring.rotation.x = PI / 2; ring.position.set(o.x, 0.25, o.z); g.add(ring); M.ring = ring;
  const pin = new THREE.Mesh(pinGeo, pinMat); pin.position.set(o.x, 6, o.z); g.add(pin); M.pin = pin;
  pup.x = o.x; pup.z = o.z; pup.y = 0.05; pup.yaw = Math.random() * 6;
  if (o.type === 'tree') { // big climbable oak with the pup out on a long, clear branch (canopy kept above + behind it)
    const BK = 0x6b4628, BD = 0x4a2f1a; B.cyl('m', BK, o.x, 0, o.z, 0.5, 4.6, 0, 0, 0, true);
    for (let k = 0; k < 10; k++) { const a = k * 0.63; B.box('m', k % 2 ? BD : 0x5a3a20, o.x + Math.cos(a) * 0.47, 0.2 + (k % 3) * 0.35, o.z + Math.sin(a) * 0.47, 0.09, 3.4 - (k % 3) * 0.6, 0.09, -a); } // bark ridges
    for (const [dy, a] of [[1.4, 0.4], [2.6, 2.6], [3.6, 4.4]]) B.add('m', G.ico, BD, o.x + Math.cos(a) * 0.47, dy, o.z + Math.sin(a) * 0.47, 0, a, 0, 0.16, 0.2, 0.12); // knots
    for (let k = 0; k < 4; k++) { const a = k * 1.57 + 0.4; B.box('m', BK, o.x + Math.cos(a) * 0.7, 0.12, o.z + Math.sin(a) * 0.7, 0.7, 0.24, 0.26, -a); } // roots
    B.cyl('m', BK, o.x + 1.25, 3.05, o.z, 0.17, 2.6, 0, PI / 2 - 0.12); B.box('m', BK, o.x + 2.3, 3.22, o.z, 1.2, 0.2, 0.8);
    for (const [dx, dy, dz, s] of [[-0.3, 5.6, -0.2, 2.4], [-1.4, 4.9, -0.8, 1.6], [0.6, 6.3, -0.9, 1.6], [-0.6, 6.6, 0.8, 1.4]]) B.add('m', G.ico, 0x3f8f3a, o.x + dx, dy, o.z + dz, 0, dx, 0, s, s * 0.8, s);
    cols.push(addCol(o.x - 0.55, o.z - 0.55, o.x + 0.55, o.z + 0.55, 6)); pup.x = o.x + 2.3; pup.y = 3.34; pin.position.y = 7.8; pup.root.scale.multiplyScalar(1.3); pup.yaw = PI / 2;
    M.ladder = new THREE.Group(); const LB = new Batch(); for (const s of [-1, 1]) LB.box('x', 0xcbd5e1, s * 0.28, 0, 0, 0.07, 3.6, 0.07); for (let k = 0; k < 9; k++) LB.box('x', 0x94a3b8, 0, 0.3 + k * 0.38, 0, 0.56, 0.05, 0.05); LB.finish(M.ladder); M.ladder.position.set(o.x + 2.3, 0, o.z + 0.9); M.ladder.rotation.x = -0.25; M.ladder.visible = false; g.add(M.ladder);
  } else if (o.type === 'lost') { // hidden in a bush somewhere inside a big search zone
    const ang = Math.random() * 6.28, off = 4 + Math.random() * 5; M.zx = o.x + Math.cos(ang) * off; M.zz = o.z + Math.sin(ang) * off; M.zr = 12;
    { const N = 90, pos = []; M.scentBase = []; for (let k = 0; k < 600 && M.scentBase.length < N; k++) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * M.zr, x = M.zx + Math.cos(a) * r, z = M.zz + Math.sin(a) * r; if (!onGrass(x, z, 0.4) && Math.hypot(x - o.x, z - o.z) > 2.5) continue; M.scentBase.push([x, z, Math.random() * 6]); pos.push(x, 0.3, z); }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); M.scent = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xff8cc6, size: 0.3, map: (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'); const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, '#fff'); g.addColorStop(0.5, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })(), alphaTest: 0.02, transparent: true, opacity: 0.9, depthWrite: false })); g.add(M.scent); }
    ring.visible = false; pin.position.set(M.zx, 7, M.zz);
    for (const [dx, dz, s] of [[0, 0, 1.25], [0.9, 0.4, 0.9], [-0.8, 0.5, 0.95]]) B.add('m', G.ico, 0x4fa045, o.x + dx, 0.55 * s, o.z + dz, 0, dx * 3, 0, 0.95 * s, 0.75 * s, 0.95 * s);
    for (let k = 0, n = 0; k < 12 && n < 3; k++) { const a = k * 2.1 + 0.6, bx = M.zx + Math.cos(a) * (7 - (k >> 2)), bz = M.zz + Math.sin(a) * (7 - (k >> 2)); if (!onGrass(bx, bz, 1.2)) continue; n++; B.add('m', G.ico, 0x3f8f3a, bx, 0.5, bz, 0, a, 0, 1.0, 0.75, 1.0); } // decoy bushes
    pup.root.visible = false; M.pawG = new THREE.Group(); g.add(M.pawG);
  } else if (o.type === 'gadget') { // Ratita Robo-Sweeper spinning circles around the pup, sparks flying
    M.bot = makeSweepy(); M.bot.root.scale.setScalar(1.2); g.add(M.bot.root); M.ba = 0; M.br = 3.4; M.sparks = []; const sg = new THREE.SphereGeometry(0.06, 6, 4), sm = new THREE.MeshBasicMaterial({ color: 0xfde047 }); for (let k = 0; k < 10; k++) { const s = new THREE.Mesh(sg, sm); g.add(s); M.sparks.push(s); }
    B.cyl('g', 0xf97316, o.x - 4.2, 0.04, o.z + 3, 0.25, 0.8); B.cyl('g', 0xf97316, o.x + 4.4, 0.04, o.z - 2.5, 0.25, 0.8); // cones
  } else if (o.type === 'stuck') { // a picket fence with the pup wedged between the slats
    for (let k = -4; k <= 4; k++) if (k !== 0) B.box('m', 0xffffff, o.x + k * 0.42, 0, o.z, 0.16, 1.2, 0.08); B.box('m', 0xf5f5f4, o.x, 0.35, o.z, 3.8, 0.12, 0.06); B.box('m', 0xf5f5f4, o.x, 0.95, o.z, 3.8, 0.12, 0.06);
    cols.push(addCol(o.x - 1.9, o.z - 0.12, o.x + 1.9, o.z + 0.12, 1.3)); pup.z = o.z + 0.15; pup.yaw = 0; pup.mode = 'idle';
  }
  B.finish(g); g.add(M.bubble); M.bubble.position.set(pup.x, pup.y + 1.6, pup.z);
  sfx('whoosh'); toast(`${MTYPES[o.type].ic} Rescue accepted: ${o.pup.name} ${o.where}! Follow the pink arrow.`); if (S.tut < 2) S.tut = 2; save();
}
function clearMission() { if (!M) return; scene.remove(M.g); scene.remove(M.pupR.root); for (const b of M.cols) { const i = COL.boxes.indexOf(b); if (i >= 0) COL.boxes.splice(i, 1); } leash.visible = false; M = null; }
function freePup() { M.stage = 'follow'; M.bubble.visible = false; M.ring.visible = false; M.pin.visible = false; M.pupR.root.visible = true; M.pupR.y = 0.05; M.pupR.mode = 'happy'; sfx('cheer');
  if (M.ladder) M.ladder.visible = true; if (M.type === 'tree') { M.pupR.x = M.x + 1.6; M.pupR.z = M.z + 2.2; }
  if (M.type === 'stuck') M.pupR.z = M.z + 1.2;
  talk(M.pup.name, `Yip yip! (${M.pup.name} wags and clips onto your leash. Head back to RuffSources HQ!)`); }
function rescued() { const left = Math.max(0, M.limit - M.t); let pay = M.pay + Math.round(left / 8); if (S.decor.bonetable) pay = Math.round(pay * 1.2); if (S.decor.eotm) pay = Math.round(pay * 1.1);
  money(pay); rep(3); S.stats.rescued++; S.pups.push(M.pup); const n = M.pup.name; clearMission(); syncShelter(); sfx('cheer'); toast(`🏡 ${n} is safe at the shelter! +${pay} 🦴 · +3 ⭐`); if (S.tut < 4) { S.tut = 4; talk('Snowie', `${n} is all tucked in! Pups in beds can be adopted out at Torty's desk, or booked as guests on Grok Pet Party at mine.`); } save(); }
let shuttle = null; // Torty's free recovery shuttle
function failMission(why) { if (!M) return; const p = M.pup; rep(-6); S.stats.failed++; clearMission(); sfx('lose');
  msg('😢 ' + p.name + ' got scared and ran off', `${why} −6 ⭐ reputation. Don't worry: Torty's Slow & Steady Shuttle will find ${p.name} and bring them to the shelter for free (no treat reward).`, [['🐢 Send Torty\'s shuttle (free)', () => { shuttle = { pup: p, t: 18 }; toast(`🐢 Torty's shuttle is on its way for ${p.name} (18 s)...`); }]]); save(); }

// ---------------- climb (timing bar) ----------------
let FX = null;
function openClimb() { FX = { hits: 0, miss: 0, p: 0, dir: 1, w: S.tools.ladder ? 0.24 : 0.15, kind: 'climb' }; $('fName').textContent = `🪜 Climb to ${M.pup.name}`; $('fBtn').textContent = '🪜 STEP!'; $('fNote').textContent = 'Tap when the needle is in the green. Each miss shakes the ladder and scares the pup (−8 s).'; placeZone(); updFix(); M.ladder.visible = true; openModal('fixUI'); }
function openSwitch() { FX = { hits: 0, miss: 0, p: 0, dir: 1, w: S.tools.remote ? 0.26 : 0.16, kind: 'switch', need: 2 }; $('fName').textContent = '🔌 Hit the Robo-Sweeper OFF switch'; $('fBtn').textContent = '🔌 PRESS!'; $('fNote').textContent = 'It\'s squirming! Hit OFF in the green twice. A miss and it zips away.'; placeZone(); updFix(); openModal('fixUI'); }
function placeZone() { FX.zone = 0.1 + Math.random() * (0.8 - FX.w); const z = $('fZone'); z.style.left = FX.zone * 100 + '%'; z.style.width = FX.w * 100 + '%'; }
function updFix() { $('fHits').textContent = FX.kind === 'climb' ? `🪜 ${FX.hits}/3` : `🔌 ${FX.hits}/${FX.need}`; }
function fixTap() { if (!FX || !M) return; const need = FX.need || 3;
  if (FX.p >= FX.zone && FX.p <= FX.zone + FX.w) { FX.hits++; sfx('point'); if (FX.hits >= need) { const k = FX.kind; FX = null; closeModals(); if (k === 'switch') { M.botOff = true; toast('🔌 Robo-Sweeper switched OFF!'); } freePup(); return; } placeZone(); }
  else { FX.miss++; sfx('miss'); M.t += 8; $('fBar').animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], 200); if (FX.kind === 'switch') { FX = null; closeModals(); M.ba += 1.5; toast('⚡ It zipped away! Catch it again.', true); return; } }
  updFix(); }
$('fBtn').addEventListener('click', fixTap); $('fClose').addEventListener('click', () => { FX = null; closeModals(); });
// ---------------- wiggle (mash) ----------------
let MS = null;
function openMash() { MS = { v: 0, t: S.tools.grabber ? 8 : 6 }; $('mName').textContent = `💪 Wiggle ${M.pup.name} free!`; openModal('mashUI'); }
function mashTap() { if (!MS) return; MS.v = Math.min(100, MS.v + (S.tools.grabber ? 9 : 7)); sfx('jump'); if (MS.v >= 100) { MS = null; closeModals(); freePup(); } }
$('mBtn').addEventListener('click', mashTap);

// ---------------- shop ----------------
const SHOP = [
  { sect: 'Shelter upgrades' }, { id: 'beds2', ic: '🛏️', name: '4 more dog beds', d: 'Shelter holds 8 pups.', cost: 60, kind: 'decor' }, { id: 'beds3', ic: '🛏️', name: '4 deluxe dog beds', d: 'Shelter holds 12 pups.', cost: 140, kind: 'decor', req: 'beds2' },
  { id: 'bonetable', ic: '🦴', name: 'Bone table', d: 'Well-fed pups: +20% treats per rescue.', cost: 90, kind: 'decor' }, { id: 'treat', ic: '🍪', name: 'Treat-O-Matic machine', d: 'Makes 1 🦴 every 6 s. Collect it in the kennel.', cost: 120, kind: 'decor' },
  { id: 'toys', ic: '🎾', name: 'Toy pit', d: 'Playful pups: adoptions pay +10 🦴 and +1 ⭐.', cost: 80, kind: 'decor' }, { id: 'eotm', ic: '⭐', name: '"Employee of the Month: Candy" sign', d: 'Gold frame in the kennel. +10% rescue treats, +8 ⭐.', cost: 70, kind: 'decor', rep: 8 },
  { sect: 'Rescue tools' }, { id: 'ladder', ic: '🪜', name: 'Extendable Ladder', d: 'Bigger green zone when climbing trees.', cost: 50, kind: 'tool' }, { id: 'goggles', ic: '🥽', name: 'Sniffer Goggles', d: 'The arrow points straight at lost pups.', cost: 70, kind: 'tool' },
  { id: 'remote', ic: '📡', name: 'Gadget Remote', d: 'Haywire gadgets move slower and the OFF switch is easier.', cost: 80, kind: 'tool' }, { id: 'grabber', ic: '🦾', name: 'Gentle Grabber', d: 'Wiggling stuck pups free is much easier.', cost: 60, kind: 'tool' },
  { id: 'leash', ic: '🎀', name: 'Pro Leash', d: '+25 s on every rescue and pups keep up better.', cost: 90, kind: 'tool' },
  { sect: 'Vehicles' }, { id: 'rescue', ic: '🚐', name: 'RuffSources Rescue Van', d: 'Your trusty starter van.', cost: 0, kind: 'truck' }, { id: 'turbo', ic: '⚡', name: 'Turbo Rescue Van', d: 'Much faster and tougher.', cost: 220, kind: 'truck' },
];
function renderShop() { const L = $('shopList'); L.innerHTML = ''; for (const it of SHOP) { if (it.sect) { const d = document.createElement('div'); d.className = 'sect'; d.textContent = it.sect; L.appendChild(d); continue; }
  const own = it.kind === 'truck' ? S.trucks.includes(it.id) : it.kind === 'tool' ? S.tools[it.id] : S.decor[it.id]; const row = document.createElement('div'); row.className = 'shopItem';
  row.innerHTML = `<div class="ic">${it.ic}</div><div class="tx"><b>${it.name}</b><small>${it.d}</small></div>`; const b = document.createElement('button'); b.className = 'ghost';
  if (it.kind === 'truck' && own) { b.textContent = S.truck === it.id ? '✔ Driving' : 'Use'; b.disabled = S.truck === it.id || P.mode === 'drive'; b.onclick = () => { S.truck = it.id; applyWorld(); parkTruck(); toast(`${it.ic} Now using the ${it.name}`); renderShop(); save(); }; }
  else if (own) { b.textContent = '✔ Owned'; b.disabled = true; }
  else if (it.req && !S.decor[it.req]) { b.textContent = '🔒'; b.disabled = true; }
  else { b.textContent = it.cost + ' 🦴'; b.disabled = S.money < it.cost; b.onclick = () => { if (S.money < it.cost) return; money(-it.cost); if (it.kind === 'truck') { S.trucks.push(it.id); if (P.mode !== 'drive') { S.truck = it.id; parkTruck(); } } else if (it.kind === 'tool') S.tools[it.id] = 1; else { S.decor[it.id] = 1; if (it.rep) rep(it.rep); } sfx('cheer'); toast(`${it.ic} Bought ${it.name}!`); applyWorld(); renderShop(); save(); }; }
  row.appendChild(b); L.appendChild(row); } }

// ---------------- map ----------------
function renderMap() { const cv = $('mapCv'), g = cv.getContext('2d'); const W = cv.width, H = cv.height, sc = Math.min(W / 210, H / 190); const mx = (x) => W / 2 + x * sc, mz = (z) => H / 2 + z * sc;
  g.fillStyle = '#3f7f34'; g.fillRect(0, 0, W, H); g.fillStyle = '#4b5563'; for (const x of ROADS.xs) g.fillRect(mx(x - 5), mz(-90), 10 * sc, 180 * sc); for (const z of ROADS.zs) g.fillRect(mx(-100), mz(z - 5), 200 * sc, 10 * sc);
  g.fillStyle = 'rgba(253,230,138,.35)'; for (const bx of [-60, 0, 60]) for (const bz of [-51, 51]) g.fillRect(mx(bx - 22), mz(bz - 21), 44 * sc, 42 * sc);
  g.fillStyle = '#475569'; g.fillRect(mx(-77), mz(-18), 30 * sc, 36 * sc); g.fillStyle = '#16a34a'; g.fillRect(mx(47), mz(-18), 30 * sc, 36 * sc);
  g.font = 'bold 11px system-ui'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('Ratita Gadget Works', mx(-62), mz(0)); g.fillText('Tortuga Park', mx(62), mz(0));
  g.fillStyle = '#be185d'; g.fillRect(mx(-17), mz(-13), 34 * sc, 26 * sc); g.fillStyle = '#fde047'; g.font = 'bold 12px system-ui'; g.fillText('🐾 RuffSources HQ', mx(0), mz(4));
  if (M) { const x = M.stage === 'go' ? (M.type === 'lost' ? M.zx : M.x) : 0, z = M.stage === 'go' ? (M.type === 'lost' ? M.zz : M.z) : 0; g.fillStyle = '#f472b6'; g.beginPath(); g.arc(mx(x), mz(z), M.type === 'lost' && M.stage === 'go' ? M.zr * sc : 7, 0, 7); g.globalAlpha = 0.7; g.fill(); g.globalAlpha = 1; g.fillStyle = '#fff'; g.fillText(MTYPES[M.type].ic + ' ' + M.pup.name, mx(x), mz(z) - 10); }
  const px = P.mode === 'drive' ? TK.x : P.x, pz = P.mode === 'drive' ? TK.z : P.z; g.fillStyle = '#facc15'; g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.arc(mx(px), mz(pz), 7, 0, 7); g.fill(); g.stroke();
  $('brList').innerHTML = M ? `<div class="note">${MTYPES[M.type].ic} ${M.pup.name} the ${BREED_NAME[M.pup.breed]} · ${M.where}</div>` : '<div class="note">No active rescue. Pick one at the Mission Board in the HQ lobby.</div>'; }

// ---------------- interactions ----------------
let near = null;
function findNear() {
  const x = P.x, z = P.z; let best = null, bd = 1e9; const consider = (o, d) => { if (d < bd) { bd = d; best = o; } };
  if (P.mode === 'drive') { if (Math.abs(TK.v) < 2.5) return { label: '🚪 Hop out', kind: 'exit' }; return null; }
  for (const it of T.interact) { if (it.need && !S.decor[it.need]) continue; const d = Math.hypot(it.x - x, it.z - z); if (d < it.r) consider(it, d); }
  { const d = Math.hypot(TK.x - x, TK.z - z); if (d < 4.6) consider({ label: M && M.stage === 'follow' ? `🚐 Drive (${M.pup.name} hops in)` : '🚐 Drive the rescue van', kind: 'truck' }, d - 0.8); }
  if (S.dmg > 0 && Math.hypot(T.spots.dockIn.x - x, T.spots.dockIn.z - z) < 2.5) consider({ label: `🔧 Repair van (${Math.ceil(S.dmg / 4)} 🦴)`, kind: 'truckfix' }, 1.5);
  for (const [p, id] of CAMEOS) { const d = Math.hypot(p.x - x, p.z - z); if (d < 2.4) consider({ label: '💬 Talk to ' + p.name, kind: 'talk', id, p }, d + 0.3); }
  if (M && M.stage === 'go') {
    if (M.type === 'tree') { const d = Math.hypot(M.x + 1.6 - x, M.z + 1.2 - z); if (d < 3.2) consider({ label: `🪜 Prop the ladder & climb to ${M.pup.name}`, kind: 'climb' }, d - 1); }
    if (M.type === 'stuck') { const d = Math.hypot(M.x - x, M.z + 0.9 - z); if (d < 2.8) consider({ label: `💪 Wiggle ${M.pup.name} out of the fence`, kind: 'mash' }, d - 1); }
    if (M.type === 'gadget' && !M.botOff) { const d = Math.hypot(M.bot.root.position.x - x, M.bot.root.position.z - z); if (d < 2.6) consider({ label: '🔌 Grab the Robo-Sweeper OFF switch!', kind: 'switch' }, d - 2); }
    if (M.type === 'lost') { const dz = Math.hypot(M.zx - x, M.zz - z), dp = Math.hypot(M.x - x, M.z - z); if (dp < 2.8) consider({ label: `🦴 Coax ${M.pup.name} out with a treat`, kind: 'coax' }, -1); else if (dz < M.zr + 1) consider({ label: '👃 Sniff for a scent', kind: 'sniff' }, 0.5); }
  }
  return best;
}
function doAct(it) {
  if (!it) return; initAudio();
  switch (it.kind) {
    case 'shop': renderShop(); openModal('shopUI'); break;
    case 'board': renderBoard(); openModal('boardUI'); break;
    case 'map': renderMap(); openModal('mapUI'); break;
    case 'talk': { const L = LINES[it.id]; talk(it.p.name, L[Math.floor(Math.random() * L.length)]); sfx('point'); break; }
    case 'luna': talk('Luna', rnd(LINES.luna)); sfx('point'); break;
    case 'climb': openClimb(); break;
    case 'mash': openMash(); break;
    case 'switch': openSwitch(); break;
    case 'coax': freePup(); break;
    case 'sniff': { const dx = M.x - P.x, dz = M.z - P.z, d = Math.hypot(dx, dz); sfx('point'); const word = d < 5 ? 'SO close! 🔥' : d < 9 ? 'Warmer... ♨️' : 'Faint scent... ❄️'; toast(`👃 ${word} (${M.pup.name}'s scent)`);
      while (M.pawG.children.length) M.pawG.remove(M.pawG.children[0]); const pm = new THREE.MeshBasicMaterial({ color: 0x7c2d12, transparent: true, opacity: 0.75, depthWrite: false }); const pg = new THREE.CircleGeometry(0.18, 10);
      for (let k = 1; k <= 4; k++) { const f = Math.min(d - 1, k * 1.3) / d; const m = new THREE.Mesh(pg, pm); m.rotation.x = -PI / 2; m.position.set(P.x + dx * f + (k % 2 ? 0.25 : -0.25) * dz / d, 0.24, P.z + dz * f - (k % 2 ? 0.25 : -0.25) * dx / d); M.pawG.add(m); } break; }
    case 'truck': P.mode = 'drive'; me.root.visible = false; if (M && M.stage === 'follow') { M.inVan = true; M.pupR.root.visible = false; leash.visible = false; } cam.want = 11; cam.hgt = 2.4; if (S.tut < 3) S.tut = 3; break;
    case 'exit': { P.mode = 'walk'; me.root.visible = true; const sx = Math.cos(TK.yaw), sz = -Math.sin(TK.yaw); P.x = TK.x + sx * (TRUCKS[S.truck].wid / 2 + 1.1); P.z = TK.z + sz * (TRUCKS[S.truck].wid / 2 + 1.1); collide(P, 0.5); cam.want = 5.2; cam.hgt = 1.1;
      if (M && M.inVan) { M.inVan = false; M.pupR.root.visible = true; M.pupR.x = P.x - Math.sin(P.yaw) * 1.4; M.pupR.z = P.z - Math.cos(P.yaw) * 1.4; } break; }
    case 'truckfix': { const c = Math.ceil(S.dmg / 4); if (S.money >= c) { money(-c); S.dmg = 0; toast('🔧 Van repaired!'); } else { S.dmg = 0; toast('🔧 Pi-rat fixed it for free (you were out of treats).'); } break; }
    case 'adopt': { if (!S.pups.length) { talk('Torty', '...no pups resting yet... ...rescue some first...'); break; } const p = S.pups.shift(); const pay = 25 + (S.decor.toys ? 10 : 0); money(pay); rep(S.decor.toys ? 3 : 2); S.stats.adopted++; syncShelter(); sfx('cheer');
      const fam = rnd(['the Barkleys', 'a family on Wag Blvd', 'the Pawsons', 'a retired mail carrier', 'twin sisters on Puppy Lane', 'the Tortuga TV weather crew']); toast(`🏡 ${p.name} was adopted by ${fam}! +${pay} 🦴`); talk('Torty', `...${p.name} has a forever home now... ...slow and steady...`); save(); break; }
    case 'party': { if (!S.pups.length) { talk('Snowie', 'Grok Pet Party needs a guest! Rescue a pup first, then I can book them on Tortuga TV.'); break; } if (S.partyT > 0) { talk('Snowie', `The next Grok Pet Party taping is in ${Math.ceil(S.partyT)} s. I'll call you!`); break; }
      const p = rnd(S.pups); money(18); rep(1); S.stats.party++; S.partyT = 45; sfx('cheer'); toast(`📺 ${p.name} is booked on Grok Pet Party (Tortuga TV Network)! +18 🦴`); talk('Snowie', `Booked! ${p.name} the ${BREED_NAME[p.breed]} will be on the next Grok Pet Party.`); save(); break; }
    case 'treat': { const n = Math.floor(S.treatBank); if (n <= 0) { toast('🍪 Treat-O-Matic is still filling up...'); break; } S.treatBank -= n; money(n); toast(`🍪 Collected ${n} 🦴 from the Treat-O-Matic`); break; }
  }
}
$('actBtn').addEventListener('click', () => doAct(near));

// ---------------- HUD / menus ----------------
$('bMap').addEventListener('click', () => { if (!S) return; renderMap(); openModal('mapUI'); });
$('bMenu').addEventListener('click', () => { if (!S) return; renderMenu(); openModal('menuUI'); });
function renderMenu() { const st = S.stats; $('menuStats').innerHTML = `<b>🐾 Candy · Head of Canine RuffSources</b> · 🦴 ${S.money} · ⭐ ${Math.round(S.rep)}<br>🏡 rescued ${st.rescued} · 😢 ran off ${st.failed} · 💝 adopted ${st.adopted} · 📺 Pet Party guests ${st.party} · 💥 crashes ${st.crashes}<br>🛏️ Shelter ${S.pups.length}/${bedsMax()} · Van: ${TRUCKS[S.truck].name} (${Math.round(100 - S.dmg)}%)`; }
$('uUnstuck').addEventListener('click', () => { closeModals(); if (P.mode === 'drive') { P.mode = 'walk'; me.root.visible = true; cam.want = 5.2; cam.hgt = 1.1; if (M && M.inVan) { M.inVan = false; M.pupR.root.visible = true; } } P.x = T.spots.hqIn.x; P.z = T.spots.hqIn.z; cam.snap = true; if (M && M.stage === 'follow') { M.pupR.x = P.x; M.pupR.z = P.z - 1.4; } toast('⛑️ Back at HQ!'); });
$('uTow').addEventListener('click', () => { closeModals(); tow(false); });
$('uSound').addEventListener('click', () => { import('./audio.js').then((a) => { a.setSound(!a.SND.on, a.SND.music); toast(a.SND.on ? '🔊 Sound on' : '🔇 Sound off'); }); });
$('uHelp').addEventListener('click', () => { $('helpTxt').innerHTML = '1) Pick a rescue at the 🚨 Mission Board (HQ lobby).<br>2) Walk or drive the 🚐 van (out the back door) to the pink marker and free the pup: climb 🌳, sniff 🔍, switch off ⚙️, or wiggle 🕳️.<br>3) Bring the pup back inside HQ before ⏱ runs out. If it runs out the pup runs off (−⭐), but Torty\'s free shuttle brings it home.<br>4) Adopt pups out at Torty\'s desk, book them on Grok Pet Party at Snowie\'s, and buy upgrades from Pi-rat.'; });
$('uNew').addEventListener('click', () => { msg('Start over?', 'This erases your current game.', [['Yes, new game', () => { localStorage.removeItem(KEY); location.reload(); }, 'primary'], ['Cancel', null, 'ghost']]); });
function tow(crash) { parkTruck(); S.dmg = 0; P.mode = 'walk'; me.root.visible = true; P.x = T.spots.dockIn.x; P.z = T.spots.dockIn.z; cam.want = 5.2; cam.hgt = 1.1; cam.snap = true;
  if (M && M.inVan) { M.inVan = false; M.pupR.root.visible = true; M.pupR.x = P.x + 1; M.pupR.z = P.z + 1; M.t += 10; }
  toast(crash ? '🛻 Free tow: the van is back at the HQ bay, all fixed.' : '🛻 Van towed back to the HQ bay (free).'); }
function hud() {
  $('hMoney').textContent = '🦴 ' + S.money; $('hRep').textContent = '⭐ ' + Math.round(S.rep); $('hReady').textContent = '🐶 ' + S.pups.length + '/' + bedsMax(); $('hTruck').textContent = '🚐 ' + Math.round(100 - S.dmg) + '%';
  let obj = ''; if (M) { const left = Math.max(0, Math.ceil(M.limit - M.t)); obj = M.stage === 'go' ? `${MTYPES[M.type].ic} Rescue ${M.pup.name} · ${M.where} · ⏱ ${left}s` : `🏡 Bring ${M.pup.name} home to RuffSources HQ · ⏱ ${left}s`; }
  else if (shuttle) obj = `🐢 Torty's shuttle is bringing ${shuttle.pup.name} home... ${Math.ceil(shuttle.t)}s`; else if (S.tut < 2) obj = '🚨 Walk to the Mission Board in the lobby (next to Snowie) and pick a rescue'; else obj = '🚨 Pick another rescue at the Mission Board, or upgrade the shelter at Pi-rat\'s';
  $('hObj').textContent = obj;
  let al = ''; if (M && M.limit - M.t < 30) al = `⏱ ${M.pup.name} is getting scared! Hurry!`; else if (S.dmg > 60) al = '🚐 Van badly damaged, drive gently or repair at the HQ bay'; const A = $('hAlert'); A.textContent = al; A.classList.toggle('on', !!al);
}

// ---------------- main loop ----------------
let last = performance.now(), saveT = 0, started = false; const lp = new Float32Array(6);
function tgt() { if (!M) return null; if (M.stage === 'go') { if (M.type === 'lost') { if (S.tools.goggles && Math.hypot(M.zx - P.x, M.zz - P.z) < M.zr + 2) return { x: M.x, z: M.z, name: '🥽 ' + M.pup.name }; return { x: M.zx, z: M.zz, name: 'Search zone' }; } return { x: M.x, z: M.z, name: M.pup.name }; }
  return { x: T.spots.hqDoorOut.x, z: P.mode === 'drive' ? T.spots.hqDoorOut.z + 3 : T.spots.hqDoorOut.z, name: 'RuffSources HQ' }; }
function step(dt) {
  S.time += dt; const mv = readMove();
  if (talkT > 0) { talkT -= dt; if (talkT <= 0) $('talk').classList.remove('on'); }
  // ---- Candy ----
  if (P.mode === 'walk' && !modal) {
    const yaw = cam.moveYaw, fx = Math.sin(yaw), fz = Math.cos(yaw); const rx = -fz, rz = fx; const wx = fx * mv.y + rx * mv.x, wz = fz * mv.y + rz * mv.x; const sp = 6.4 * Math.min(1, Math.hypot(mv.x, mv.y));
    P.x += wx * sp * dt; P.z += wz * sp * dt; P.speed = sp; if (sp > 0.1) { let want = Math.atan2(wx, wz), d = want - P.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); P.yaw += d * Math.min(1, dt * 12); }
    collide(P, 0.5); P.x = clamp(P.x, -99, 99); P.z = clamp(P.z, -89, 89);
  } else if (P.mode === 'walk') P.speed = 0;
  me.x = P.x; me.z = P.z; me.y = groundY(P.x, P.z); me.yaw = P.yaw; me.root.position.set(me.x, me.y, me.z); me.root.rotation.y = me.yaw; animPup(me.rig, dt, P.speed, P.speed > 0.1 ? 'run' : M && M.stage === 'follow' ? 'happy' : 'idle');
  // ---- van ----
  const spec = TRUCKS[S.truck];
  if (P.mode === 'drive' && !modal) {
    const thr = mv.y, steer = -mv.x, brake = IN.keys.Space || IN.held.brake; const top = spec.speed * (S.dmg > 70 ? 0.6 : 1);
    if (brake) TK.v *= Math.exp(-4 * dt); else if (thr > 0) TK.v += thr * 9 * dt; else if (thr < 0) TK.v += thr * (TK.v > 0 ? 18 : 6) * dt; else TK.v *= Math.exp(-0.8 * dt);
    TK.v = clamp(TK.v, -6, top); TK.steer += (steer - TK.steer) * Math.min(1, dt * 8);
    TK.yaw += TK.steer * clamp(TK.v / 6, -1, 1) * 1.7 * dt * (Math.abs(TK.v) > 0.3 ? 1 : 0);
    TK.x += Math.sin(TK.yaw) * TK.v * dt; TK.z += Math.cos(TK.yaw) * TK.v * dt;
    const half = spec.len / 2 - spec.wid / 2, r = spec.wid / 2 + 0.15; let hit = 0;
    for (const s of [1, -1]) { const p = { x: TK.x + Math.sin(TK.yaw) * half * s, z: TK.z + Math.cos(TK.yaw) * half * s }; const px = p.x, pz = p.z; const h = collide(p, r, 0.3); if (h) { TK.x += p.x - px; TK.z += p.z - pz; hit = Math.max(hit, h.pen); } }
    for (const c of cars) { const d = Math.hypot(c.root.position.x - TK.x, c.root.position.z - TK.z); if (d < 3.2) { const nx = (TK.x - c.root.position.x) / (d || 1), nz = (TK.z - c.root.position.z) / (d || 1); TK.x += nx * (3.2 - d); TK.z += nz * (3.2 - d); hit = Math.max(hit, 0.3); } }
    TK.x = clamp(TK.x, -97, 97); TK.z = clamp(TK.z, -87, 87);
    if (hit > 0.02) { const sp = Math.abs(TK.v); if (sp > 7) { const dmg = (sp - 5) * 3.2 / spec.armor; S.dmg = Math.min(100, S.dmg + dmg); S.stats.crashes++; sfx('lose'); toast(`💥 Bonk! Van ${Math.round(100 - S.dmg)}%${M && M.inVan ? ' · ' + M.pup.name + ' is scared (−5 s)' : ''}`, true); if (M && M.inVan) M.t += 5; } TK.v *= -0.25; }
    if (S.dmg >= 100) { TK.v = 0; msg('🛻 Van broke down!', 'Too many bonks. Pi-rat\'s tow truck brings the van back to the HQ bay for free.' + (M && M.inVan ? ` ${M.pup.name} rides along (−10 s).` : ''), [['Free tow to HQ', () => tow(true)]]); }
  } else TK.v = 0;
  if (truck) { truck.root.position.set(TK.x, 0.04, TK.z); truck.root.rotation.y = TK.yaw; for (const w of truck.wheels) w.children[0].rotation.x += TK.v * dt / 0.48; truck.wheels[0].rotation.y = truck.wheels[1].rotation.y = TK.steer * 0.45; }
  // ---- traffic ----
  for (const c of cars) { const pos = loopPos(c.L, c.s, {}); const ax = Math.sin(pos.yaw), az = Math.cos(pos.yaw); let blocked = false; const chk = (x, z) => { const dx = x - pos.x, dz = z - pos.z; const f = dx * ax + dz * az, s = Math.abs(dx * az - dz * ax); if (f > 0 && f < 9 && s < 2.4) blocked = true; };
    chk(TK.x, TK.z); if (P.mode === 'walk') chk(P.x, P.z); if (M && M.stage === 'follow' && !M.inVan) chk(M.pupR.x, M.pupR.z); for (const o of cars) if (o !== c && o.L === c.L) chk(o.root.position.x, o.root.position.z);
    c.v += ((blocked ? 0 : 10) - c.v) * Math.min(1, dt * (blocked ? 6 : 1.5)); c.s += c.v * dt; const p2 = loopPos(c.L, c.s, {}); c.root.position.set(p2.x, 0.04, p2.z); let d = p2.yaw - c.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); c.root.rotation.y += d * Math.min(1, dt * 8); }
  // ---- mission ----
  if (M) { M.t += dt; const p = M.pupR;
    M.pin.position.y += Math.sin(S.time * 3) * 0.01; M.pin.rotation.y += dt * 2; M.bubble.position.set(p.x, p.y + 1.5 + Math.sin(S.time * 5) * 0.08, p.z);
    if (M.stage === 'go') { p.mode = M.type === 'stuck' ? 'idle' : 'sit'; p.rig.root.rotation.z = Math.sin(S.time * 18) * 0.04; // trembling
      if (M.type === 'gadget' && !M.botOff) { M.ba += dt * (S.tools.remote ? 1.0 : 1.5); const bx = M.x + Math.cos(M.ba) * M.br, bz = M.z + Math.sin(M.ba) * M.br; M.bot.root.position.set(bx, 0.05, bz); M.bot.root.rotation.y = -M.ba; animSweepy(M.bot, dt, 2, false);
        M.sparks.forEach((s, k) => { const a = S.time * 9 + k * 0.63, h = (S.time * 2 + k * 0.1) % 1; s.position.set(bx + Math.cos(a) * 0.9 * h, 0.6 + h * 1.2, bz + Math.sin(a) * 0.9 * h); });
        const d = Math.hypot(bx - P.x, bz - P.z); if (d < 1.15 && P.mode === 'walk' && !modal) { P.x += (P.x - bx) / (d || 1) * 1.6; P.z += (P.z - bz) / (d || 1) * 1.6; M.t += 4; sfx('miss'); toast('⚡ Zap! The Robo-Sweeper bumped you (−4 s). Grab it from the side!', true); } }
      if (M.scent) { const a = M.scent.geometry.attributes.position; M.scentBase.forEach(([x, z, ph], k) => { const h = (S.time * 0.35 + ph) % 1; a.setXYZ(k, x + Math.sin(S.time + ph) * 0.15, 0.15 + h * 1.1, z); }); a.needsUpdate = true; M.scent.material.opacity = 0.6 + Math.sin(S.time * 2) * 0.2; }
      if (M.type === 'lost') { const d = Math.hypot(M.x - P.x, M.z - P.z); if (d < 4) M.bubble.visible = Math.sin(S.time * 8) > 0; else M.bubble.visible = false; } }
    if (M.botOff && M.bot) { animSweepy(M.bot, dt, 0, true); M.sparks.forEach((s) => s.visible = false); }
    if (M.stage === 'follow') { p.rig.root.rotation.z = 0;
      if (!M.inVan) { const dx = P.x - p.x, dz = P.z - p.z, d = Math.hypot(dx, dz); const want = 1.5; if (d > want) { const sp = Math.min(d - want, 1) * (S.tools.leash ? 8 : 7); p.x += dx / d * sp * dt * (d > 4 ? 2 : 1); p.z += dz / d * sp * dt * (d > 4 ? 2 : 1); p.speed = sp; p.yaw = Math.atan2(dx, dz); } else p.speed = 0;
        if (d > 9) { p.x = P.x - dx / d * 2; p.z = P.z - dz / d * 2; } const pp = { x: p.x, z: p.z }; collide(pp, 0.3); p.x = pp.x; p.z = pp.z; p.y = groundY(p.x, p.z); p.mode = p.speed > 0.2 ? 'run' : 'happy';
        leash.visible = P.mode === 'walk'; lp[0] = P.x + Math.sin(P.yaw) * 0.5; lp[1] = me.y + 0.62; lp[2] = P.z + Math.cos(P.yaw) * 0.5; lp[3] = p.x + Math.sin(p.yaw) * 0.35; lp[4] = p.y + 0.5; lp[5] = p.z + Math.cos(p.yaw) * 0.35; leashGeo.attributes.position.array.set(lp); leashGeo.attributes.position.needsUpdate = true;
        if (inHQ(p.x, p.z) && inHQ(P.x, P.z) && P.mode === 'walk') { rescued(); } } }
    if (M) { p.root.position.set(p.x, p.y, p.z); p.root.rotation.y = p.yaw; animPup(p.rig, dt, p.speed || 0, p.mode); if (M.t > M.limit) failMission(M.stage === 'go' ? 'You didn\'t reach the pup in time.' : 'The trip home took too long.'); } }
  if (shuttle) { shuttle.t -= dt; if (shuttle.t <= 0) { S.pups.push(shuttle.pup); if (S.pups.length > bedsMax()) S.pups.length = bedsMax(); toast(`🐢 Torty's shuttle brought ${shuttle.pup.name} to the shelter. Safe and sound!`); shuttle = null; syncShelter(); save(); } }
  // ---- economy timers ----
  if (S.decor.treat) S.treatBank = Math.min(40, S.treatBank + dt / 6); if (S.partyT > 0) S.partyT -= dt;
  // ---- NPCs + shelter pups ----
  for (const [p] of CAMEOS) { animPet(p, dt, P.mode === 'walk' ? P : null); p.root.position.y = groundY(p.x, p.z); }
  bedPups.forEach((d, i) => { if (Math.hypot(d.x - P.x, d.z - P.z) < 2.6 && P.mode === 'walk') d.mode = 'happy'; else if (d.mode === 'happy') d.mode = i % 3 === 0 ? 'sit' : 'sleep'; d.root.position.set(d.x, d.y, d.z); d.root.rotation.y = d.yaw; animPup(d.rig, dt, 0, d.mode); });
  // ---- interaction ----
  near = modal ? null : findNear(); const ab = $('actBtn'); if (near) { ab.textContent = near.label + (isTouch ? '' : '  [E]'); ab.classList.add('on'); } else ab.classList.remove('on');
  if (edge('act')) { if (modal === 'fixUI') fixTap(); else if (modal === 'mashUI') mashTap(); else if (!modal) doAct(near); }
  if (IN.keys.KeyM && !modal && !IN._m) { renderMap(); openModal('mapUI'); } IN._m = IN.keys.KeyM;
  if (modal === 'fixUI' && FX) { FX.p += FX.dir * dt * (FX.kind === 'switch' ? 1.1 : 0.85); if (FX.p > 1) { FX.p = 1; FX.dir = -1; } if (FX.p < 0) { FX.p = 0; FX.dir = 1; } $('fNeedle').style.left = `calc(${FX.p * 100}% - 3px)`; if (IN.keys.Space && !IN._sp) fixTap(); IN._sp = IN.keys.Space; }
  if (modal === 'mashUI' && MS) { MS.t -= dt; MS.v = Math.max(0, MS.v - dt * 16); $('mBar').firstElementChild.style.width = MS.v + '%'; $('mTime').textContent = '⏱ ' + Math.max(0, MS.t).toFixed(1) + 's'; if (IN.keys.Space && !IN._sp) mashTap(); IN._sp = IN.keys.Space;
    if (MS && MS.t <= 0) { MS = null; closeModals(); M.t += 10; sfx('miss'); toast(`😟 ${M.pup.name} is still stuck and getting scared (−10 s). Try again!`, true); } }
  if (modal && IN.keys.Escape && modal !== 'msgUI') { FX = null; MS = null; closeModals(); }
  // ---- GPS arrow ----
  const tg = tgt(); const ax = P.mode === 'drive' ? TK.x : P.x, az = P.mode === 'drive' ? TK.z : P.z; const gp = $('gps');
  if (tg) { const dx = tg.x - ax, dz = tg.z - az, d = Math.hypot(dx, dz); arrow.visible = d > 5 && !(M && M.stage === 'follow' && inHQ(P.x, P.z)); arrow.position.set(ax, (P.mode === 'drive' ? spec.hgt + 1.6 : 2.2) + Math.sin(S.time * 4) * 0.12, az); arrow.rotation.y = Math.atan2(dx, dz);
    gp.classList.add('on'); const rel = Math.atan2(dx, dz) - (cam.moveYaw); $('gpsArrow').style.transform = `rotate(${-rel * 180 / PI - 90}deg)`; $('gpsTxt').textContent = `${tg.name} · ${Math.round(d)} m`; }
  else { arrow.visible = false; gp.classList.remove('on'); }
  $('drive').classList.toggle('on', P.mode === 'drive' && isTouch);
  // ---- camera ----
  const f = P.mode === 'drive' ? { x: TK.x, y: 0.5, z: TK.z, yaw: TK.yaw, speed: Math.abs(TK.v) } : { x: P.x, y: me.y, z: P.z, yaw: P.yaw, speed: P.speed };
  { const ins = P.mode === 'walk' && inHQ(P.x, P.z); E.renderer.toneMappingExposure += ((ins ? 0.76 : 0.88) - E.renderer.toneMappingExposure) * Math.min(1, dt * 3); E.bloom && (E.bloom.strength = ins ? 0.12 : 0.22); }
  cam.driving = P.mode === 'drive'; cam.update(dt, f, world); followShadow(f.x, 0, f.z);
  hud();
  saveT += dt; if (saveT > 5) { saveT = 0; save(); }
}
let wipT = 0; function loop(now) { requestAnimationFrame(loop); if (now - wipT > 500) { wipT = now; const wb = document.getElementById('ratitaWip'); document.body.classList.toggle('wip', !!wb); if (wb) document.body.style.setProperty('--wip', (wb.getBoundingClientRect().bottom + 6) + 'px'); } const dt = Math.min(0.05, (now - last) / 1000); last = now; if (started) step(dt); else { cam.yaw += dt * 0.08; cam.update(dt, { x: 0, y: 0, z: 4, yaw: 0, speed: 0 }, null, { dist: 34 }); } trackFps(dt, now); render(dt); }
{ const b = $('dBrake'); const on = (e) => { e.preventDefault(); IN.held.brake = true; }, off = (e) => { e.preventDefault(); IN.held.brake = false; }; b.addEventListener('touchstart', on, { passive: false }); b.addEventListener('touchend', off); b.addEventListener('mousedown', on); b.addEventListener('mouseup', off); }
// ---------------- title ----------------
function start(s) { S = s; S.tools = S.tools || {}; S.pups = S.pups || []; applyWorld(); parkTruck(); P.x = T.spots.hqIn.x; P.z = T.spots.hqIn.z - 3; P.yaw = PI; cam.yaw = PI; cam.pitch = 0.36; cam.snap = true; closeModals(); $('title').classList.remove('on'); document.body.classList.add('playing'); started = true; initAudio(); save();
  if (S.tut === 0) { talk('Snowie', 'Morning, Candy! Pups need rescuing all over Pawsville. Pick one at the 🚨 Mission Board right by my desk!'); S.tut = 1; } }
const old = load(); $('mContinue').style.display = old ? '' : 'none';
$('mContinue').addEventListener('click', () => start(load())); $('mScratch').addEventListener('click', () => start(fresh('scratch'))); $('mEmpire').addEventListener('click', () => start(fresh('empire')));
window.addEventListener('beforeunload', save); document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
S = old || fresh('scratch'); applyWorld(); parkTruck(); S = null;
window.__candy = { get S() { return S; }, get M() { return M; }, P, TK, T, SITES, start, fresh, doAct, startMission, renderBoard, makeOffers, freePup, rescued, failMission, openModal, closeModals, E, cam, get shuttle() { return shuttle; } };
requestAnimationFrame(loop);
