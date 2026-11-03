// Grok Sky: Airport Tycoon — build & run Torty's Airport.
import * as THREE from 'three';
import { part, grp, sign, mat, G, tortoise, schnauzer, fancyRat, person, plane } from './models.js?v=at1';
const SAVE = 'grokAirportTycoon.v1';
const $ = (q) => document.querySelector(q);
const R = Math.random, PI = Math.PI;
const lerp = (a, b, t) => a + (b - a) * t;

// ---------------- data ----------------
const KINDS = {
  gate: { n: 'Gate', icon: '🛫', cost: 250, help: 'Planes park here. More gates = more flights.' },
  booth: { n: 'Customs Booth', icon: '🛂', cost: 120, help: 'Checks passports. Short lines = happy flyers.' },
  shop: { n: 'Shop', icon: '🛍️', cost: 150, help: 'Earns money from passengers.' },
  belt: { n: 'Baggage Belt', icon: '🧳', cost: 140, help: 'Gets bags back fast.' },
  runway: { n: 'Runway', icon: '🛬', cost: 400, help: 'Planes land and take off. Storms close them.' },
};
const SLOTS = {
  gate: [-40, -20, 0, 20, 40].map((x) => [x, -38]),
  booth: [-24, -12, 0, 12, 24].map((x) => [x, -8]),
  shop: [-38, -24, -10, 10, 24, 38].map((x) => [x, 3.5]),
  belt: [-30, 0, 30].map((x) => [x, 13]),
  runway: [-64, -80, -96].map((z) => [0, z]),
};
const SHOPS = [['☕ Torty Café', 0x92400e], ['🧀 Luna Snacks', 0xf59e0b], ['🏴‍☠️ Pi-rat Gifts', 0x7c3aed], ['❄️ Snowie Treats', 0x0ea5e9], ['📚 Sky Books', 0x16a34a], ['🧸 Candy Toys', 0xdb2777]];
const AIRLINES = [['Tortuga Air', 0x16a34a], ['Ratita Jet', 0xec4899], ['Grok Sky', 0x0ea5e9], ['Candy Wings', 0xf59e0b]];
const GRUMPS = ['Karen', 'Kevin', 'Brenda', 'Chad', 'Linda', 'Gary', 'Doris', 'Todd'];
const LINES = {
  queue: ['This line is moving SLOWER than a tortoise!', 'I have been waiting FOREVER!', 'Why is only ONE booth open?!'],
  delay: ['My flight is LATE! I want to speak to the MANAGER!', 'I will be late for my cousin\'s birthday!', 'Who is in charge of this sky?!'],
  bags: ['WHERE is my suitcase?!', 'My bag has my lucky socks in it!', 'This belt is a MESS!'],
  shop: ['My latte is way too foamy!', 'These snacks cost too much!', 'There is no ketchup on this pretzel!'],
  storm: ['Rain?! I did NOT order rain!', 'Fix the weather RIGHT NOW!'],
  power: ['The lights are OFF! Unacceptable!', 'My phone is at 2 percent!'],
};
function fresh() { return { money: 600, stars: 3, day: 1, t: 0, built: { gate: [0], booth: [2], shop: [], belt: [1], runway: [0] }, flights: 0, reviews: 0, bad: 0, grant: 0, openHouse: 0, best: 3 }; }
let S = fresh();
try { const j = JSON.parse(localStorage.getItem(SAVE)); if (j && j.built) S = Object.assign(fresh(), j); } catch (e) { /* new airport */ }
const save = () => { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) { /* storage full */ } };

// ---------------- renderer ----------------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace = THREE.SRGBColorSpace;
$('#app').appendChild(renderer.domElement);
const scene = new THREE.Scene(); const SKY = new THREE.Color(0x7dd3fc), STORM = new THREE.Color(0x475569); scene.background = SKY.clone(); scene.fog = new THREE.Fog(0x7dd3fc, 160, 320);
const cam = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.5, 600);
const hemi = new THREE.HemisphereLight(0xffffff, 0x64748b, 1.5), sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(40, 80, 30); scene.add(hemi, sun);
const camT = new THREE.Vector3(0, 0, -20); let camD = 95;
function placeCam() { const p = Math.min(camD, 160); cam.position.set(camT.x, camT.y + p * 0.78, camT.z + p * 0.62); cam.lookAt(camT); }
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); });

// ---------------- static world ----------------
const W = new THREE.Group(); scene.add(W);
const add = (m) => (W.add(m), m);
add(part('box', 0x65a30d, 0, -0.6, -20, 300, 1, 260)); // grass
add(part('box', 0x94a3b8, 0, -0.08, -60, 130, 0.1, 30)); // apron + taxiway
add(part('box', 0x475569, 0, -0.05, -50, 124, 0.06, 3.5)); for (let x = -60; x <= 60; x += 4) add(part('box', 0xfacc15, x, 0, -50, 1.6, 0.04, 0.25));
add(part('box', 0x334155, 0, -0.05, 27, 140, 0.06, 9)); for (let x = -66; x <= 66; x += 6) add(part('box', 0xffffff, x, 0, 27, 2.4, 0.04, 0.25)); // landside road
add(part('box', 0xd1d5db, 0, 0.05, 21.5, 120, 0.3, 3)); // curb
// terminal floor + walls (low walls so we can see inside, dollhouse style)
add(part('box', 0xf1f5f9, 0, 0.02, -3, 108, 0.2, 46));
for (let x = -52; x <= 52; x += 6) for (let z = -25; z <= 19; z += 6) add(part('box', (x / 6 + z / 6) & 1 ? 0xe2e8f0 : 0xf8fafc, x + 3, 0.13, z + 3, 5.96, 0.02, 5.96));
const wallM = 0x0f766e; add(part('box', wallM, 0, 1, -26, 108, 2, 0.6)); add(part('box', wallM, -54, 1, -3, 0.6, 2, 46)); add(part('box', wallM, 54, 1, -3, 0.6, 2, 46));
for (let x = -50; x <= 50; x += 12.5) { add(part('box', wallM, x - 3.5, 1, 20, 5.5, 2, 0.6)); }
add(part('box', 0x99f6e4, 0, 2.3, -26, 108, 0.6, 0.4, { transparent: true, opacity: 0.6 })); // glass band
const tSign = sign("🐢 TORTY'S INTERNATIONAL AIRPORT", 3.2, '#0f766e', '#fde047'); tSign.position.set(0, 5.2, 21); add(tSign);
add(part('box', 0x0f766e, -18, 2.6, 21, 0.4, 5.2, 0.4)); add(part('box', 0x0f766e, 18, 2.6, 21, 0.4, 5.2, 0.4));
// hall zone floor paint + signs
add(part('box', 0xbae6fd, 0, 0.15, -15, 70, 0.02, 9)); const cSign = sign('🛂 CUSTOMS & PASSPORTS', 1.4, '#1e3a8a', '#ffffff'); cSign.position.set(0, 3, -12.5); add(cSign);
const lSign = sign('🛫 GATES', 1.4, '#0f172a', '#fde047'); lSign.position.set(-46, 3, -24.5); add(lSign);
const bSign = sign('🧳 BAGGAGE CLAIM', 1.4, '#7c2d12', '#ffffff'); bSign.position.set(0, 3.6, 9); add(bSign);
// gate lounge seat rows (tidy, aligned)
for (let i = 0; i < 5; i++) { const gx = SLOTS.gate[i][0]; for (let r = 0; r < 2; r++) for (let s = -2; s <= 2; s++) { add(part('box', 0x1d4ed8, gx + s * 1.2 - 4.5, 0.55, -21.5 + r * 1.6, 1, 0.12, 0.9)); add(part('box', 0x1d4ed8, gx + s * 1.2 - 4.5, 0.95, -21.9 + r * 1.6, 1, 0.7, 0.12)); } }
// plants, bins & info desk = density without clutter
for (const x of [-50, -27, 27, 50]) { add(part('cyl', 0x78350f, x, 0.45, -1, 0.9, 0.7, 0.9)); add(part('sph', 0x16a34a, x, 1.4, -1, 1.6)); }
for (const x of [-46, -16, 16, 46]) add(part('cyl', 0x64748b, x, 0.5, 17, 0.6, 0.9, 0.6));
add(part('box', 0x0f766e, 0, 0.6, 18, 5, 1.1, 1.4)); const iSign = sign('ℹ️ INFO', 0.7, '#0f766e', '#fff'); iSign.position.set(0, 1.6, 18.75); add(iSign);
// control tower + hangar + fuel truck + windsock
add(part('cyl', 0xe2e8f0, 66, 9, -40, 3, 18, 3)); add(part('cyl', 0x1e293b, 66, 19.5, -40, 6, 3, 6)); add(part('cyl', 0x67e8f9, 66, 19.5, -40, 6.2, 2, 6.2, { transparent: true, opacity: 0.7 })); add(part('cone', 0xdc2626, 66, 22, -40, 6.5, 2, 6.5));
const towSign = sign('TOWER', 1, '#1e293b', '#fde047'); towSign.position.set(66, 16, -38.4); add(towSign);
add(part('box', 0x9ca3af, -72, 5, -42, 22, 10, 16)); add(part('box', 0x6b7280, -72, 10.5, -42, 22.4, 1, 16.4)); const hSign = sign('TORTUGA AIR HANGAR', 1.2, '#16a34a', '#fff'); hSign.position.set(-72, 7.5, -33.9); add(hSign);
add(part('box', 0x111827, -72, 3.5, -33.95, 14, 7, 0.1));
add(part('cyl', 0x64748b, 62, 4, -56, 0.15, 8, 0.15)); const sock = part('cone', 0xf97316, 63.2, 7.6, -56, 0.8, 2.4, 0.8); sock.rotation.z = PI / 2; add(sock);
// parked cars landside
for (let i = 0; i < 9; i++) { const x = -56 + i * 14; add(part('box', [0xef4444, 0xfacc15, 0x3b82f6, 0xf8fafc][i % 4], x, 0.7, 29.5, 4, 1.1, 2)); add(part('box', 0x93c5fd, x - 0.2, 1.45, 29.5, 2.2, 0.6, 1.8)); }
// rain
const rainG = new THREE.BufferGeometry(); { const a = new Float32Array(1200 * 6); for (let i = 0; i < 1200; i++) { const x = (R() - 0.5) * 200, y = R() * 60, z = -40 + (R() - 0.5) * 160; a.set([x, y, z, x - 0.3, y - 2, z], i * 6); } rainG.setAttribute('position', new THREE.BufferAttribute(a, 3)); }
const rain = new THREE.LineSegments(rainG, new THREE.LineBasicMaterial({ color: 0xbfdbfe, transparent: true, opacity: 0.6 })); rain.visible = false; scene.add(rain);

// ---------------- buildables ----------------
const built = { gate: [], booth: [], shop: [], belt: [], runway: [] }; // slot -> object info
function buildObj(kind, i) {
  const [x, z] = SLOTS[kind][i], g = new THREE.Group(); g.position.set(x, 0, z);
  if (kind === 'runway') { g.add(part('box', 0x1f2937, 0, 0, 0, 124, 0.12, 10)); for (let k = -56; k <= 56; k += 8) g.add(part('box', 0xffffff, k, 0.08, 0, 4, 0.02, 0.4)); for (const s of [-1, 1]) { g.add(part('box', 0xffffff, s * 60, 0.08, 0, 1.2, 0.02, 8)); for (let k = 0; k < 6; k++) g.add(part('sph', 0xfde047, s * 63, 0.2, -4.5 + k * 1.8, 0.35, 0.2, 0.35)); }
    const n = sign('RWY ' + (i + 1) * 9, 1, '#111827', '#fde047'); n.rotation.x = -PI / 2; n.position.set(-52, 0.1, 0); g.add(n);
    const x2 = part('box', 0xdc2626, 0, 0.2, 0, 30, 0.2, 1.5); x2.rotation.y = 0.32; const x3 = x2.clone(); x3.rotation.y = -0.32; const cl = grp(x2, x3); cl.visible = false; g.add(cl); g.userData.closed = cl; }
  if (kind === 'gate') { g.add(part('box', 0x334155, 0, 0.06, 0, 10, 0.06, 14)); g.add(part('box', 0xfacc15, 0, 0.1, 0, 0.3, 0.02, 13));
    g.add(part('box', 0xcbd5e1, 3.4, 3, 8.5, 2.2, 2.2, 7)); g.add(part('cyl', 0x64748b, 3.4, 1, 6, 0.5, 2, 0.5)); // jet bridge
    const s = sign('GATE ' + String.fromCharCode(65 + i), 1, '#0f172a', '#fde047'); s.position.set(-3.5, 3.2, 11.7); g.add(s);
    const tug = grp(part('box', 0xf59e0b, 0, 0.5, 0, 1.6, 0.8, 2.4), part('box', 0x111827, 0, 1.1, -0.4, 1.4, 0.5, 1)); tug.position.set(-4, 0, -3); g.add(tug); }
  if (kind === 'booth') { g.add(part('box', 0x1e40af, 0, 0.6, 0, 3, 1.2, 1.6)); g.add(part('box', 0xe0f2fe, 0, 1.8, 0, 3, 1.2, 0.08, { transparent: true, opacity: 0.6 })); g.add(part('box', 0x1e3a8a, 0, 2.5, 0, 3.2, 0.2, 1.8));
    const o = person(3); o.position.set(0, 0, 1.2); o.rotation.y = PI; g.add(o); g.add(part('box', 0x1e3a8a, 0, 1.5, 1.2, 0.4, 0.12, 0.4));
    for (const s of [-1, 1]) for (let k = 0; k < 5; k++) g.add(part('cyl', 0xcbd5e1, s * 1, 0.5, -2 - k * 1.6, 0.12, 1, 0.12));
    for (const s of [-1, 1]) g.add(part('box', 0x1e3a8a, s * 1, 0.9, -5.2, 0.05, 0.12, 6.4)); // queue ropes
    const l = part('box', 0x22c55e, 0, 2.75, 0, 0.6, 0.3, 0.3); g.add(l); g.userData.lamp = l; }
  if (kind === 'shop') { const [nm, col] = SHOPS[i]; g.add(part('box', col, 0, 1.2, 3.3, 11, 2.4, 0.4)); for (const sx of [-5.3, 5.3]) g.add(part('box', col, sx, 1.2, 1.4, 0.4, 2.4, 4)); g.add(part('box', 0xfef3c7, 0, 0.08, 1.4, 10.4, 0.06, 3.6));
    g.add(part('box', 0xffffff, 0, 0.55, -0.6, 9, 1.1, 0.8)); for (let k = -3; k <= 3; k += 2) g.add(part('box', [0xef4444, 0xfde047, 0x22c55e, 0x60a5fa][(k + 3) / 2], k, 1.3, -0.6, 0.9, 0.5, 0.5));
    for (const sx of [-3, 3]) { g.add(part('box', 0x78350f, sx, 0.9, 2.6, 3, 1.8, 0.8)); for (let k = 0; k < 3; k++) g.add(part('box', [0xfde047, 0xf472b6, 0x60a5fa][k], sx - 1 + k, 1.95, 2.6, 0.6, 0.3, 0.5)); }
    const s = sign(nm, 0.9, '#ffffff', '#0f172a'); s.position.set(0, 2.9, 3.55); g.add(s); const s2 = sign(nm, 0.9, '#ffffff', '#0f172a'); s2.position.set(0, 2.9, 3.05); s2.rotation.y = PI; g.add(s2); }
  if (kind === 'belt') { const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.7, 6, 24), mat(0x334155)); ring.rotation.x = PI / 2; ring.scale.z = 0.5; ring.position.y = 0.5; g.add(ring); g.add(part('cyl', 0x64748b, 0, 0.5, 0, 4.6, 0.6, 4.6));
    const bags = new THREE.Group(); for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; const b = part('box', [0x1d4ed8, 0xb91c1c, 0x15803d, 0x7c3aed][k % 4], Math.cos(a) * 3.4, 1.1, Math.sin(a) * 3.4, 0.9, 0.6, 0.6); b.rotation.y = -a; bags.add(b); } g.add(bags); g.userData.bags = bags;
    const pile = new THREE.Group(); for (let k = 0; k < 14; k++) { const b = part('box', [0x1d4ed8, 0xb91c1c, 0x15803d, 0x7c3aed, 0xf59e0b][k % 5], (R() - 0.5) * 5, 0.4 + R() * 1.6, -4 + (R() - 0.5) * 2, 0.9, 0.6, 0.6); b.rotation.set(R(), R() * 3, R()); pile.add(b); } pile.visible = false; g.add(pile); g.userData.pile = pile; }
  W.add(g); return g;
}
for (const k in S.built) for (const i of S.built[k]) built[k][i] = buildObj(k, i);
// pads for build mode
const pads = new THREE.Group(); scene.add(pads); let buildKind = null;
function showPads(kind) { pads.clear(); buildKind = kind; if (!kind) return; SLOTS[kind].forEach(([x, z], i) => { if (built[kind][i]) return; const big = kind === 'runway'; const m = new THREE.Mesh(G.box, new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.55 })); m.scale.set(big ? 120 : kind === 'shop' ? 10 : kind === 'gate' ? 9 : kind === 'belt' ? 7 : 3.4, 0.3, big ? 9 : kind === 'gate' ? 13 : kind === 'belt' ? 7 : kind === 'shop' ? 4 : 2); m.position.set(x, 0.35, z); m.userData = { kind, i }; pads.add(m);
  const s = sign('+ ' + KINDS[kind].icon + ' $' + KINDS[kind].cost, big ? 2.2 : 1.1, '#f59e0b', '#111'); s.position.set(x, big ? 3 : 2.2, z); s.userData = { kind, i }; pads.add(s); }); }

// ---------------- pets ----------------
const torty = tortoise(); torty.scale.setScalar(1.6); torty.position.set(-6, 0.15, 16); scene.add(torty);
const candy = schnauzer(); candy.scale.setScalar(1.5); scene.add(candy);
const rats = ['luna', 'pirat', 'snowie'].map((k) => { const r = fancyRat(k); r.scale.setScalar(1.7); scene.add(r); return r; });
const petTag = (txt, obj, y) => { const s = sign(txt, 0.55, '#ffffff', '#0f172a'); s.position.y = y; obj.add(s); return s; };
petTag('Torty (Manager)', torty, 1.0); petTag('Candy (K9)', candy, 0.95); rats.forEach((r, i) => petTag(['Luna', 'Pi-rat', 'Snowie'][i], r, 0.48));
let tortyGoal = null, piratRun = 0;
function placePets() { const b = built.booth.findIndex(Boolean); const bx = b >= 0 ? SLOTS.booth[b][0] : 0; candy.position.set(bx - 2, 0.15, -6.6); candy.rotation.y = PI;
  rats.forEach((r, i) => { const sh = built.shop.map((o, k) => o ? k : -1).filter((k) => k >= 0)[i]; if (sh != null) { r.position.set(SLOTS.shop[sh][0] + 4, 0.15, 2.2); } else r.position.set(-8 + i * 2.2, 0.15, 18.8); r.rotation.y = PI; }); }
placePets();

// ---------------- simulation ----------------
const flights = [], pax = []; let disaster = null, nextDis = 55, nextFlight = 3, paused = true, ff = 1, saveT = 0, grumpN = 0;
const cards = new Map(); let tortyCool = 0;
const DAY = 150;
const nBuilt = (k) => built[k].filter(Boolean).length;
function rate() { const per = 3 + nBuilt('gate') * 3 + Math.floor(S.day / 2); const starMul = 0.45 + S.stars / 5 * 0.8; return DAY / Math.max(2, per * starMul); }
function spawnFlight() { const al = AIRLINES[(R() * AIRLINES.length) | 0], m = plane(al[1]); m.position.set(-140, 26, -80); scene.add(m);
  const lbl = sign(al[0] + ' ' + (100 + (R() * 900 | 0)), 1.2, '#0f172a', '#fff'); lbl.position.set(0, 7, 0); m.add(lbl);
  flights.push({ m, al: al[0], st: 'hold', t: 0, wait: 0, n: 6 + (R() * 8 | 0), gate: -1, rw: -1, delayed: false, a: R() * 6 }); S.flights++; }
const rwBusy = new Map(); // runway -> flight
function freeRunway() { for (let i = 0; i < 3; i++) if (built.runway[i] && !rwBusy.has(i) && !(disaster && (disaster.k === 'storm' || (disaster.k === 'runway' && disaster.rw === i)))) return i; return -1; }
const gateBusy = new Map();
function freeGate() { for (let i = 0; i < 5; i++) if (built.gate[i] && !gateBusy.has(i)) return i; return -1; }
function money(d, why) { S.money = Math.round(S.money + d); if (why && d) feed((d > 0 ? '+$' : '-$') + Math.abs(Math.round(d)) + ' ' + why, d < 0); }
function feed(t, bad) { const e = document.createElement('div'); e.className = 'rv' + (bad ? ' bad' : ''); e.textContent = t; $('#feed').prepend(e); while ($('#feed').children.length > 5) $('#feed').lastChild.remove(); }
function toast(t, ms = 2200) { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => e.classList.remove('on'), ms); }
function stars(d, why) { S.stars = Math.max(0.5, Math.min(5, S.stars + d)); if (why) feed((d >= 0 ? '⭐ +' : '⭐ ') + d.toFixed(2) + ' ' + why, d < 0); }

function flightStep(f, dt) {
  const m = f.m; f.t += dt;
  if (f.st === 'hold') { f.wait += dt; f.a += dt * 0.35; m.position.set(Math.cos(f.a) * 70, 26 + Math.sin(f.a * 2), -120 + Math.sin(f.a) * 25); m.rotation.y = -f.a; m.rotation.z = 0.25;
    if (f.wait > 10 && !f.delayed) { f.delayed = true; feed('⏰ ' + f.al + ' is DELAYED (waiting to land)', true); }
    if (f.delayed) money(-2.5 * dt);
    const rw = freeRunway(), g = freeGate(); if (rw >= 0 && g >= 0) { f.st = 'land'; f.t = 0; f.rw = rw; f.gate = g; rwBusy.set(rw, f); gateBusy.set(g, f); m.rotation.set(0, PI / 2, 0); } return; }
  const rz = SLOTS.runway[Math.max(0, f.rw)][1];
  if (f.st === 'land') { const k = Math.min(1, f.t / 4); m.position.set(lerp(-90, 40, k), lerp(14, 0, Math.min(1, k * 1.6)), rz); if (k >= 1) { rwBusy.delete(f.rw); f.st = 'taxi'; f.t = 0; money(40, 'landing fee'); if (f.delayed) { const pen = Math.min(0.35, f.wait / 120); stars(-pen, 'late flight'); if (R() < 0.85) makeGrumpy(null, 'delay'); } } return; }
  const [gx, gz] = SLOTS.gate[f.gate];
  if (f.st === 'taxi') { const k = Math.min(1, f.t / 4); if (k < 0.5) { m.position.set(lerp(40, gx, k * 2), 0, lerp(rz, -50, k * 2)); m.rotation.y = Math.atan2(gx - 40, -50 - rz) ; } else { m.position.set(gx, 0, lerp(-50, gz - 2, (k - 0.5) * 2)); m.rotation.y = 0; } if (k >= 1) { f.st = 'deplane'; f.t = 0; } return; }
  if (f.st === 'deplane') { if (f.n > 0 && f.t > 0.7) { f.t = 0; f.n--; spawnPax(f.gate); } if (f.n <= 0) { f.st = 'turn'; f.t = 0; } return; }
  if (f.st === 'turn') { if (f.t > 6) { const rw = freeRunway(); if (rw >= 0) { f.st = 'leave'; f.t = 0; f.rw = rw; rwBusy.set(rw, f); gateBusy.delete(f.gate); money(30, 'departure fee'); } else { f.wait += dt; if (f.t > 14) money(-1.5 * dt); } } return; }
  if (f.st === 'leave') { const k = Math.min(1, f.t / 5); if (k < 0.3) { m.position.set(gx, 0, lerp(gz - 2, -50, k / 0.3)); m.rotation.y = PI; } else { const q = (k - 0.3) / 0.7; m.position.set(lerp(-50, 140, q), Math.max(0, (q - 0.4) * 40), rz); m.rotation.y = PI / 2; } if (k >= 1) { rwBusy.delete(f.rw); f.done = true; scene.remove(m); } }
}

let paxId = 0;
function spawnPax(gi) { const m = person(paxId++); const [gx] = SLOTS.gate[gi]; m.position.set(gx + 3.4, 0.15, -24.5); scene.add(m); pax.push({ m, st: 'toCustoms', wait: 0, sat: 100, path: [[gx + 3.4, -19]], booth: -1, grumpy: null }); }
const queues = [[], [], [], [], []], tempQ = [];
function boothOn(i) { return built.booth[i] && !(disaster && disaster.k === 'power'); }
function joinQueue(p) { let best = -1; for (let i = 0; i < 5; i++) if (built.booth[i] && (best < 0 || queues[i].length < queues[best].length)) best = i; p.booth = best; (best >= 0 ? queues[best] : tempQ).push(p); }
const boothT = [0, 0, 0, 0, 0]; let tempT = 0;
function qSpot(i, k) { if (i < 0) return [-46 + (k % 4) * 1.1, -10 - Math.floor(k / 4) * 1.1]; const [bx] = SLOTS.booth[i]; return [bx + (k >= 8 ? (k % 2 ? 0.6 : -0.6) : 0), -9.4 - Math.min(k, 7) * 0.95 - (k >= 8 ? (k - 8) * 0.25 : 0)]; }
function moveTo(p, x, z, dt, sp = 5) { const P = p.m.position, dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz); if (d < 0.05) return true; const s = Math.min(d, sp * dt); P.x += dx / d * s; P.z += dz / d * s; p.m.rotation.y = Math.atan2(dx, dz); p.m.position.y = 0.15 + Math.abs(Math.sin(performance.now() / 120 + p.m.id)) * 0.06; return d < 0.3; }
function paxStep(p, dt) {
  if (p.path.length) { if (moveTo(p, p.path[0][0], p.path[0][1], dt)) p.path.shift(); return; }
  if (p.st === 'toCustoms') { joinQueue(p); p.st = 'queue'; return; }
  if (p.st === 'queue') { const q = p.booth >= 0 ? queues[p.booth] : tempQ, k = q.indexOf(p), [x, z] = qSpot(p.booth, k); moveTo(p, x, z, dt); p.wait += dt; if (p.wait > 9) p.sat -= dt * 2.2; if (p.wait > 16 && !p.grumpy && R() < dt * 0.25) makeGrumpy(p, 'queue'); return; }
  if (p.st === 'shopping') { p.wait += dt; if (p.wait > 2.5) { p.st = 'toBelt'; const bi = pickBelt(); p.belt = bi; const [bx, bz] = bi >= 0 ? SLOTS.belt[bi] : [-46, 14]; p.path.push([bx + (R() - 0.5) * 8, bz - 4.6 + R() * 0.6]); p.wait = 0; } return; }
  if (p.st === 'toBelt') { p.st = 'claim'; p.wait = 0; return; }
  if (p.st === 'claim') { p.wait += dt; const jam = disaster && disaster.k === 'bags', need = p.belt >= 0 ? 3 : 8; if (jam) { p.sat -= dt * 3; if (!p.grumpy && p.wait > 6 && R() < dt * 0.3) makeGrumpy(p, 'bags'); } else if (p.wait > need) { p.st = 'exit'; p.path.push([p.m.position.x, 21], [p.m.position.x + (R() - 0.5) * 6, 25]); } if (p.wait > 7) p.sat -= dt * 1.5; return; }
  if (p.st === 'exit') { p.done = true; scene.remove(p.m); review(p); }
}
function pickBelt() { const b = built.belt.map((o, i) => o ? i : -1).filter((i) => i >= 0); return b.length ? b[(R() * b.length) | 0] : -1; }
function release(p) { // finished customs
  p.st = 'shopping'; p.wait = 0; const shops = built.shop.map((o, i) => o ? i : -1).filter((i) => i >= 0);
  if (shops.length && R() < 0.75 && !(disaster && disaster.k === 'power')) { const s = shops[(R() * shops.length) | 0], [sx, sz] = SLOTS.shop[s]; p.path.push([sx + (R() - 0.5) * 6, sz - 1.8]); const spend = 6 + (R() * 12 | 0); money(spend); p.sat += 6; if (R() < 0.05 && !p.grumpy) makeGrumpy(p, 'shop'); }
  else p.wait = 2.5;
}
function review(p) { if (p.grumpy) return; const s = Math.max(1, Math.min(5, 1 + p.sat / 25)); S.stars = Math.max(0.5, Math.min(5, S.stars + (s - S.stars) * 0.03)); S.reviews++; if (R() < 0.12) feed((s >= 4 ? '😀 ' : s >= 3 ? '🙂 ' : '😕 ') + s.toFixed(1) + '⭐ review: ' + (s >= 4 ? '"Smooth trip, thanks Torty!"' : s >= 3 ? '"Not bad."' : '"Lines were long..."'), s < 3); }

// ---------------- grumpy customers ----------------
function makeGrumpy(p, why) {
  if (cards.size >= 3) return; if (!p) { const cand = pax.filter((q) => !q.grumpy && !q.done); p = cand.length ? cand[(R() * cand.length) | 0] : null; if (!p) return; }
  const nm = GRUMPS[(grumpN++) % GRUMPS.length], line = LINES[why][(R() * LINES[why].length) | 0];
  const id = 'g' + grumpN; p.grumpy = id; const bub = sign('😤 ' + nm + ': I want the MANAGER!', 0.5, '#b91c1c', '#ffffff'); bub.position.y = 2.2; bub.scale.multiplyScalar(0.8); p.m.add(bub); p.bub = bub; p.m.scale.setScalar(1.08);
  const c = { id, p, nm, why, line, t: 0, max: 22, el: null }; cards.set(id, c); renderCard(c); feed('😤 ' + nm + ' is complaining loudly!', true);
}
function renderCard(c) { const e = document.createElement('div'); e.className = 'card'; e.innerHTML = `<h4>😤 ${c.nm} wants the manager!</h4><div class="q">"${c.line}"</div><div class="bar"><i style="width:100%"></i></div>
  <button data-a="sorry">🙏 Say sorry (free)</button><button class="y" data-a="voucher">🎟️ Snack voucher $25</button><button class="o" data-a="torty">🐢 Get Manager Torty</button>`;
  e.addEventListener('click', (ev) => { const a = ev.target.dataset && ev.target.dataset.a; if (a) handle(c, a); }); $('#cards').appendChild(e); c.el = e; }
function calm(c, msg, good = 0.05) { cards.delete(c.id); c.el.remove(); if (c.p.bub) { c.p.m.remove(c.p.bub); c.p.bub = null; } c.p.m.scale.setScalar(1); c.p.grumpy = null; c.p.sat = Math.max(c.p.sat, 60); stars(good, msg); }
function handle(c, a) {
  if (a === 'sorry') { if (R() < 0.55) { calm(c, c.nm + ' accepted your apology'); toast('🙏 "Hmph... fine. Thank you."'); } else { c.t += 5; c.line = 'Sorry is NOT enough! I want a MANAGER!'; c.el.querySelector('.q').textContent = '"' + c.line + '"'; c.el.querySelector('[data-a=sorry]').disabled = true; toast('😤 That made it worse! Try a voucher or Torty.'); } }
  if (a === 'voucher') { money(-25, 'voucher for ' + c.nm); calm(c, c.nm + ' loved the snack voucher', 0.08); toast('🎟️ ' + c.nm + ' is munching a free pretzel. Calm!'); }
  if (a === 'torty') { if (tortyCool > 0) { toast('🐢 Torty is busy for ' + Math.ceil(tortyCool) + 's. Try sorry or a voucher!'); return; } tortyCool = 25; tortyGoal = c.p.m.position.clone(); calm(c, 'Manager Torty calmed ' + c.nm, 0.1); toast('🐢 Torty: "Hello! I\'m the manager. Let\'s fix this together." ' + c.nm + ' smiles!'); }
}
function cardsStep(dt) { for (const c of [...cards.values()]) { c.t += dt; const w = Math.max(0, 1 - c.t / c.max); c.el.querySelector('.bar i').style.width = (w * 100) + '%';
  const tb = c.el.querySelector('[data-a=torty]'); tb.disabled = tortyCool > 0; tb.textContent = tortyCool > 0 ? '🐢 Torty busy ' + Math.ceil(tortyCool) + 's' : '🐢 Get Manager Torty';
  if (c.t >= c.max) { cards.delete(c.id); c.el.remove(); if (c.p.bub) c.p.m.remove(c.p.bub); c.p.m.scale.setScalar(1); c.p.grumpy = null; c.p.sat = 10; S.bad++; stars(-0.3, '1-star review from ' + c.nm + ': "' + c.line + '"'); money(-30, 'refund to ' + c.nm); } } }

// ---------------- disasters ----------------
const DIS = {
  storm: { n: '⛈️ THUNDERSTORM', d: 25, help: 'All runways closed! Planes are circling.', acts: [['📢 Calm announcement (free)', 'y', () => { for (const c of [...cards.values()]) calm(c, 'storm announcement', 0.02); toast('📢 "Folks, Torty here. Safety first! We\'ll land as soon as the storm passes."'); return 'used'; }]] },
  power: { n: '🔌 POWER OUTAGE', d: 40, help: 'Customs, shops and lights are off!', acts: [['🏴‍☠️ Send Pi-rat to the breaker (free)', 'y', () => { piratRun = 5; toast('🏴‍☠️ Pi-rat scurries to the breaker box...'); return 'used'; }]] },
  runway: { n: '🚧 RUNWAY CLOSED', d: 45, help: 'A runway has a pothole!', acts: [['🚧 Repair crew $60 (fast)', 'o', () => { money(-60, 'runway repair'); disaster.left = Math.min(disaster.left, 4); toast('🚧 Repair crew is on it!'); return 'used'; }], ['⏳ Wait (free, slow)', '', () => 'noop']] },
  bags: { n: '🧳 LOST-BAGGAGE PILEUP', d: 999, help: 'The belts jammed! Bags are piling up.', acts: [['🧳 Sort the pile (tap 4x, free)', 'y', () => { disaster.taps = (disaster.taps || 0) + 1; if (disaster.taps >= 4) { disaster.left = 0; return 'used'; } toast('🧳 Sorting... ' + disaster.taps + '/4'); return 'keep'; }], ['🐭 Rat sorting team $40', 'o', () => { money(-40, 'rat sorting team'); disaster.left = 0; toast('🐭🐁 Luna & Snowie sorted every bag!'); return 'used'; }]] },
};
function startDisaster(k) {
  if (disaster) return; if (k === 'runway' && !nBuilt('runway')) k = 'storm'; if (k === 'bags' && !nBuilt('belt')) k = 'power';
  disaster = { k, left: DIS[k].d, t: 0 }; if (k === 'runway') { const rs = built.runway.map((o, i) => o ? i : -1).filter((i) => i >= 0); disaster.rw = rs[(R() * rs.length) | 0]; built.runway[disaster.rw].userData.closed.visible = true; }
  if (k === 'bags') { disaster.left = 60; built.belt.forEach((b) => b && (b.userData.pile.visible = true)); }
  renderAlert(); toast(DIS[k].n + '! ' + DIS[k].help, 3200); }
function endDisaster() { const k = disaster.k; if (k === 'runway' && built.runway[disaster.rw]) built.runway[disaster.rw].userData.closed.visible = false; if (k === 'bags') built.belt.forEach((b) => b && (b.userData.pile.visible = false)); disaster = null; nextDis = 55 + R() * 35; renderAlert(); toast('✅ Back to normal! Nice work.'); }
function renderAlert() { const A = $('#alerts'); A.innerHTML = '';
  if (disaster) { const D = DIS[disaster.k], e = document.createElement('div'); e.className = 'alert'; e.innerHTML = `${D.n}<br><small>${D.help}${disaster.k === 'runway' ? ' (RWY ' + (disaster.rw + 1) * 9 + ')' : ''}</small><br>`; D.acts.forEach(([t, cl, fn], i) => { const b = document.createElement('button'); b.className = cl; b.textContent = t; b.onclick = () => { const r = fn(); if (r === 'used') { b.disabled = true; } if (disaster && disaster.left <= 0) endDisaster(); }; e.appendChild(b); }); A.appendChild(e); }
  // free recovery: never stuck
  if (S.money < 100 && S.grant < S.day) { const e = document.createElement('div'); e.className = 'alert'; e.style.background = '#14532d'; e.innerHTML = '🐢 Money is low!<br>'; const b = document.createElement('button'); b.className = 'y'; b.textContent = "🐢 Torty's Rescue Fund +$250 (free, 1 per day)"; b.onclick = () => { S.grant = S.day; money(250, "Torty's Rescue Fund"); renderAlert(); }; e.appendChild(b); A.appendChild(e); }
  if (S.stars < 1.6 && S.openHouse < S.day) { const e = document.createElement('div'); e.className = 'alert'; e.style.background = '#1e3a8a'; e.innerHTML = '⭐ Stars are low!<br>'; const b = document.createElement('button'); b.className = 'y'; b.textContent = '🎉 Free Open House +1⭐ (1 per day)'; b.onclick = () => { S.openHouse = S.day; stars(1, 'Open House with all 5 pets!'); renderAlert(); }; e.appendChild(b); A.appendChild(e); }
}
function disasterStep(dt) {
  if (!disaster) { nextDis -= dt; if (nextDis <= 0) startDisaster(['storm', 'power', 'runway', 'bags'][(R() * 4) | 0]); return; }
  disaster.t += dt; disaster.left -= dt; const k = disaster.k;
  if (k === 'storm' || k === 'power') { if (R() < dt * 0.06) makeGrumpy(null, k); }
  if (k === 'bags' && disaster.left <= 0) { /* auto-cleared after 60s by night crew */ }
  if (disaster.left <= 0) endDisaster();
}

// ---------------- day cycle ----------------
let dayRep = { money: S.money, bad: S.bad };
function endDay() { const earned = S.money - dayRep.money, upkeep = 8 * (nBuilt('gate') + nBuilt('booth') + nBuilt('shop') + nBuilt('belt')) + 15 * nBuilt('runway'); money(-upkeep, 'staff & upkeep');
  S.day++; S.t = 0; S.best = Math.max(S.best, S.stars); save(); paused = true;
  const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<div class="tbox"><h1>🌙 Day ${S.day - 1} done!</h1><p>💰 Earned: <b>${earned >= 0 ? '+' : ''}$${earned}</b> · Upkeep: <b>-$${upkeep}</b><br>⭐ Rating: <b>${S.stars.toFixed(1)}</b> · 😤 Bad reviews today: <b>${S.bad - dayRep.bad}</b></p><p class="small">More stars = more airlines book flights at Torty's Airport. Late flights and unhappy grumpy customers cost stars and money.</p><button class="go" id="dNext">☀️ Start Day ${S.day}</button></div>`;
  document.body.appendChild(m); m.querySelector('#dNext').onclick = () => { m.remove(); paused = false; dayRep = { money: S.money, bad: S.bad }; renderAlert(); }; }

// ---------------- UI ----------------
function renderBuild() { const B = $('#build'); B.innerHTML = ''; for (const k in KINDS) { const K = KINDS[k], n = nBuilt(k), b = document.createElement('button'); b.innerHTML = `${K.icon} ${K.n}<small>$${K.cost} · ${n}/${SLOTS[k].length}</small>`; b.disabled = n >= SLOTS[k].length; if (buildKind === k) b.classList.add('on'); b.onclick = () => { showPads(buildKind === k ? null : k); renderBuild(); if (buildKind) toast(K.icon + ' ' + K.help + ' Tap a yellow spot to build.'); }; B.appendChild(b); }
  const sp = document.createElement('button'); sp.innerHTML = (ff > 1 ? '⏩ 2x' : '▶ 1x') + '<small>speed</small>'; sp.onclick = () => { ff = ff > 1 ? 1 : 2; renderBuild(); }; B.appendChild(sp); }
function tryBuild(kind, i) { const K = KINDS[kind]; if (S.money < K.cost) { toast('💰 Not enough money! Run flights or use Torty\'s Rescue Fund.'); return; } money(-K.cost, K.n + ' built'); S.built[kind].push(i); built[kind][i] = buildObj(kind, i); showPads(null); renderBuild(); placePets(); save(); toast('✅ ' + K.icon + ' ' + K.n + ' built!'); }
function hud() { $('#hMoney').textContent = '💰 $' + S.money; $('#hStars').textContent = '⭐ ' + S.stars.toFixed(1); $('#hStars').classList.toggle('bad', S.stars < 2); $('#hDay').textContent = (disaster && disaster.k === 'storm' ? '⛈️' : '☀️') + ' Day ' + S.day + ' · ' + Math.round(S.t / DAY * 100) + '%'; const hold = flights.filter((f) => f.st === 'hold').length; $('#hFlights').textContent = '✈️ ' + flights.length + (hold ? ' (' + hold + ' circling)' : ''); }
$('#hPause').onclick = () => { paused = !paused; $('#hPause').textContent = paused ? '▶' : '⏸'; };
// input: drag to pan, tap to build, wheel/pinch zoom
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let drag = null; const touches = new Map();
renderer.domElement.addEventListener('pointerdown', (e) => { touches.set(e.pointerId, [e.clientX, e.clientY]); drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, pd: touches.size === 2 ? pinchD() : 0 }; });
function pinchD() { const a = [...touches.values()]; return Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); }
addEventListener('pointermove', (e) => { if (!drag || !touches.has(e.pointerId)) return; touches.set(e.pointerId, [e.clientX, e.clientY]); if (touches.size === 2) { const d = pinchD(); if (drag.pd) camD = Math.max(35, Math.min(150, camD * drag.pd / d)); drag.pd = d; return; } const k = camD / 600; camT.x = Math.max(-70, Math.min(70, camT.x - (e.clientX - drag.x) * k)); camT.z = Math.max(-100, Math.min(30, camT.z - (e.clientY - drag.y) * k * 1.3)); drag.x = e.clientX; drag.y = e.clientY; });
addEventListener('pointerup', (e) => { touches.delete(e.pointerId); if (drag && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 8 && e.target === renderer.domElement) tap(e); if (!touches.size) drag = null; });
renderer.domElement.addEventListener('wheel', (e) => { camD = Math.max(35, Math.min(150, camD * (1 + Math.sign(e.deltaY) * 0.1))); }, { passive: true });
function tap(e) { ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, cam); if (buildKind) { const h = ray.intersectObjects(pads.children, false)[0]; if (h) return tryBuild(h.object.userData.kind, h.object.userData.i); }
  if (disaster && disaster.k === 'bags') { const piles = built.belt.filter(Boolean).map((b) => b.userData.pile); if (ray.intersectObjects(piles, true).length) { DIS.bags.acts[0][2](); if (disaster && disaster.left <= 0) endDisaster(); } } }

// ---------------- loop ----------------
let last = performance.now();
function tick(now) { requestAnimationFrame(tick); const rdt = Math.min(0.05, (now - last) / 1000); last = now; if (!paused) step(rdt * ff); render(rdt); }
function step(dt) {
  S.t += dt; nextFlight -= dt; if (nextFlight <= 0) { spawnFlight(); nextFlight = rate() * (0.7 + R() * 0.6); }
  for (const f of flights) flightStep(f, dt); for (let i = flights.length - 1; i >= 0; i--) if (flights[i].done) flights.splice(i, 1);
  for (let i = 0; i < 5; i++) { if (!boothOn(i) || !queues[i].length) continue; boothT[i] += dt; const speed = (candy.position.x === SLOTS.booth[i][0] - 2) ? 2.0 : 2.6; const head = queues[i][0]; const [hx, hz] = qSpot(i, 0); if (Math.hypot(head.m.position.x - hx, head.m.position.z - hz) < 0.4 && boothT[i] > speed) { boothT[i] = 0; queues[i].shift(); head.path.push([SLOTS.booth[i][0] + 1.6, -6.5], [SLOTS.booth[i][0] + 1.6, -3]); release(head); } }
  if (tempQ.length && !(disaster && disaster.k === 'power')) { tempT += dt; if (tempT > 6) { tempT = 0; const h = tempQ.shift(); h.path.push([-44, -3]); release(h); } } // slow free desk so nobody is ever stuck
  // re-route temp queue if a booth is built
  if (tempQ.length && nBuilt('booth')) while (tempQ.length) { const p = tempQ.shift(); joinQueue(p); }
  for (const p of pax) paxStep(p, dt); for (let i = pax.length - 1; i >= 0; i--) if (pax[i].done) pax.splice(i, 1);
  cardsStep(dt); disasterStep(dt); tortyCool = Math.max(0, tortyCool - dt);
  if (piratRun > 0) { piratRun -= dt; const r = rats[1]; r.position.x = lerp(r.position.x, 52, dt * 1.5); r.position.z = lerp(r.position.z, -24, dt * 1.5); if (piratRun <= 0) { if (disaster && disaster.k === 'power') { disaster.left = 0; endDisaster(); toast('🏴‍☠️ Pi-rat flipped the breaker! Lights on!'); } placePets(); } }
  saveT += dt; if (saveT > 8) { saveT = 0; save(); renderAlert(); }
  if (S.t >= DAY) endDay();
}
const tmp = new THREE.Vector3();
function render(dt) {
  // torty walks to complaints then back to the info desk
  const home = tmp.set(-6, 0.15, 16), goal = tortyGoal || home; const dx = goal.x - torty.position.x, dz = goal.z - torty.position.z, d = Math.hypot(dx, dz); if (d > 0.6) { const s = Math.min(d, 9 * dt); torty.position.x += dx / d * s; torty.position.z += dz / d * s; torty.rotation.y = Math.atan2(dx, dz); } else if (tortyGoal && tortyCool < 18) tortyGoal = null;
  for (const b of built.belt) if (b && !(disaster && (disaster.k === 'power' || disaster.k === 'bags'))) b.userData.bags.rotation.y += dt * 0.5;
  const dark = disaster && (disaster.k === 'storm' || disaster.k === 'power'); scene.background.lerp(dark ? STORM : SKY, Math.min(1, dt * 2)); scene.fog.color.copy(scene.background); hemi.intensity = lerp(hemi.intensity, dark ? 0.7 : 1.5, Math.min(1, dt * 2));
  rain.visible = !!(disaster && disaster.k === 'storm'); if (rain.visible) { rain.position.y = -((performance.now() / 20) % 30); }
  for (const b of built.booth) if (b) b.userData.lamp.material = mat(boothOn(built.booth.indexOf(b)) ? 0x22c55e : 0x7f1d1d);
  placeCam(); renderer.render(scene, cam); hud();
}

// ---------------- start ----------------
function start() { $('#title').classList.add('off'); paused = false; renderBuild(); renderAlert(); toast("🐢 Welcome to Torty's Airport! Build gates, booths and shops. Keep flights on time!", 3500); }
$('#tPlay').onclick = start; $('#tNew').onclick = () => { localStorage.removeItem(SAVE); location.reload(); };
renderBuild(); placeCam(); requestAnimationFrame(tick);
// test hooks
window.__pt = { S, get paused() { return paused; }, play: start, ff: (sec) => { for (let i = 0; i < sec * 20; i++) step(0.05); }, disaster: startDisaster, grumpy: (w = 'queue') => makeGrumpy(null, w), flights, pax, cards, peek: (px, py, pz, tx, ty, tz) => { placeCam = () => { cam.position.set(px, py, pz); cam.lookAt(tx, ty, tz); }; }, build: tryBuild, cam: (x, z, d) => { camT.set(x, 0, z); camD = d; } };
