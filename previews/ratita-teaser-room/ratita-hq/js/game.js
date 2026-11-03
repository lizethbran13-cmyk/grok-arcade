// Ratita Industries HQ runtime: the campus, players, NPCs, live tests, mysteries, collectibles, co-op hooks.
import * as THREE from 'three';
import { E, setEnvironment, followShadow } from './engine.js';
import { World } from './world.js';
import { buildCampus, regionAt, REGIONS, NEAR } from './campus.js';
import { Player } from './player.js';
import { FX } from './fx.js';
import { makeRat, animRat, makeCandy, animCandy, makeMartina, animMartina, MB, toGroup, RAT_COL } from './models.js';
import { makeDog, animDog, makeMimi, makeLily, makeLili, animBot, makeSweepy, animSweepy, makeBitsy, makeWalker, makeRocket, makeCatapult, cheeseWheel, gooBall, makeCannon, makeFizz } from './models2.js';
import { MATS } from './mats.js';
import { P } from './geo.js';
import { gear, rcyl, capsule, torus, lathe, wedge } from './shapes.js';
import { updateFrustum, inView, LightPool } from './perf.js';
import { sfx, playMusic } from './audio.js';
import { S, persist, ensureTT } from './save.js';
import { buildTortugaDyn, CROSSOVER_GADGETS, CHAMBER_INFO, tortugaOwned } from './tortuga-wing.js';
import { NPCS, talk, clueText, GOUDA_CLUES, GARDEN_CLUES, HATS, BADGES } from './story.js';
import { readMove, edge, held, IN } from './input.js';
const PI = Math.PI;
export const TESTS = [
  { id: 'rocket', n: '🚀 Rocket Launch', dur: 21 }, { id: 'robot', n: '🤖 Robot Trials', dur: 23 }, { id: 'catapult', n: '🧀 Cheese Catapult', dur: 13 },
  { id: 'goo', n: '🟢 Goo Cannon', dur: 14 }, { id: 'fizz', n: '🎉 FIZZ BOMB', dur: 15 },
];
const COUNT = 5, GAP = 40;
const TOYS = [[35.5, 0, 7.6], [10, 0, -56.5], [-30.6, 0, -3.6]], MUG = [6.5, 1.35, -32.2];
export class Game {
  constructor(app, opts = {}) {
    this.app = app; this.scene = E.scene; this.net = app.net; this.hud = app.hud; this.T = 0; this.levelId = 'hq';
    const w = this.world = new World(); w.game = this; buildCampus(w); w.finalize(this.scene);
    setEnvironment(w.env); if (this.scene.fog) { this.scene.fog.color.set(w.env.fog); this.scene.fog.density = w.env.fogD; }
    this.fx = new FX(this.scene); this.extra = []; this.lightPool = new LightPool(this.scene, w.lights, 4);
    this.players = new Map();
    this.me = new Player({ rat: 'human', look: S.look, outfit: S.outfit, name: S.name || 'You', local: true, gadgets: new Set(['blaster']), pid: opts.pid || 'me' });
    this.me.addTo(this.scene); this.me.place(w.start, w.startYaw); this.me.cp = w.start.slice(); this.me.cpYaw = w.startYaw; this.players.set(this.me.pid, this.me);
    this.cam = { yaw: w.startYaw, pitch: 0.42, dist: w.camDist, pos: new THREE.Vector3(), tgt: new THREE.Vector3(), snap: true, shake: 0 };
    this.region = 'atrium'; this.vis = null; this.shots = []; this.act = null; this.chat = null;
    this.test = null; this.nextTest = 20; this.testIdx = 0; this.watchedThis = false; this.range = null;
    this.buildNPCs(); this.buildDyn(); this.buildRigs(); if (tortugaOwned()) buildTortugaDyn(this); this.setVis('atrium', true); this.light(10);
    playMusic('hq');
  }
  add(o) { this.scene.add(o); this.extra.push(o); return o; }
  toastMsg(m) { this.hud.toast(m); }
  sfx(n) { sfx(n); }
  // ------------------------------------------------ NPCs
  buildNPCs() { this.npcs = NPCS.map((d) => { const L = d.look; let rig, kind = 'rat';
      if (L.rat === 'candy' || L.rat === 'dog') { rig = makeDog(L.breed || 'schnauzer'); kind = 'dog'; rig.root.scale.setScalar(L.s || 1); }
      else if (L.rat === 'sweepy') { rig = makeSweepy(); kind = 'sweepy'; } else if (L.rat === 'bitsy') { rig = makeBitsy(); kind = 'bitsy'; }
      else if (L.rat === 'martina') { rig = makeMartina(); kind = 'martina'; rig.root.scale.multiplyScalar(1.15); }
      else { rig = makeRat(L.rat, L.hat || 'none', { pack: false, extras: L.extras || [], tie: L.tie, vest: L.vest, glass: L.glass, noBlaster: true }); this.critter(rig, L); }
      let rise = 0; if (d.riser) { rise = d.riser; const b = MB(); b.x.add(rcyl(0.55, rise, 0.06, 28), 0x64748b, 0, 0, 0); b.l.add(rcyl(0.5, 0.03, 0.01, 28), 0xff4fa0, 0, rise, 0, 0, 0, 0, 1, 1, 1, 0.5); const m = toGroup(b); m.position.set(d.at[0], d.at[1], d.at[2]); this.add(m); m.userData.region = d.region; (this.risers = this.risers || []).push(m); this.world.solid(d.at[0] - 0.5, d.at[1], d.at[2] - 0.5, d.at[0] + 0.5, d.at[1] + rise, d.at[2] + 0.5); }
      const n = { d, id: d.id, rig, kind, x: d.at[0], y: d.at[1] + rise, z: d.at[2], yaw: d.at[3], yaw0: d.at[3], region: d.region, wp: 0, speed: 0, talkT: 0 };
      rig.root.position.set(n.x, n.y, n.z); rig.root.rotation.y = n.yaw; this.add(rig.root);
      const mk = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.38, 16).rotateX(PI), new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffb000, emissiveIntensity: 0.8 }));
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), mk.material); dot.position.y = 0.34; mk.add(dot); mk.visible = false; this.add(mk); n.mark = mk;
      n.markY = kind === 'dog' ? 1.6 * (L.s || 1) : kind === 'martina' ? 2.4 : kind === 'sweepy' || kind === 'bitsy' ? 1.2 : 1.55 * rig.root.scale.y + (L.sp === 'bunny' ? 0.4 : 0);
      return n; });
    // golden founder statues on the atrium fountain
    const st = this.world.spots.statues; ['luna', 'pirat', 'snowie'].forEach((id, i) => { const r = makeRat('gold', ['crown', 'pirate', 'flower'][i], { pack: false, noBlaster: true, extras: i === 1 ? ['patch'] : [] });
      r.root.position.set(...st[i]); r.root.scale.setScalar(1.25); r.root.rotation.y = (i - 1) * 0.25; animRat(r, 0.01, { speed: 0, air: false, vy: 0 }); r.root.userData.region = 'atrium'; this.add(r.root); (this.statics = this.statics || []).push(r.root); });
    // old prototype bodies in the charging pods (faces asleep)
    this.pods = [makeMimi(), makeLily(), makeLili()].map((b, i) => { b.root.position.set([20.8, 23.9, 27][i], 0.3, -26.6); b.root.scale.setScalar(0.8); this.add(b.root); return b; }); }
  // rat-model variants: rats are big friendly coworkers (~half human height); mice get round ears, hamsters are chubby
  // with no tail, bunnies get long ears and a cotton tail. All extra parts batch into the rig's existing head/body groups.
  critter(rig, L) { const sp = L.sp || 'rat', C = RAT_COL[L.rat] || RAT_COL.luna; const S0 = { rat: 1.35, mouse: 1.05, hamster: 1.2, bunny: 1.25 }[sp] || 1.35; rig.root.scale.setScalar(S0);
    if (sp === 'mouse') { const b = MB(); [-1, 1].forEach((s) => { b.f.add(P.sphere, C.fur, s * 0.24, 0.3, -0.06, 0, 0, s * 0.3, 0.19, 0.19, 0.05); b.g.add(P.sphere, 0xffb3c8, s * 0.24, 0.3, -0.03, 0, 0, s * 0.3, 0.13, 0.13, 0.03); }); rig.head.add(toGroup(b)); }
    if (sp === 'bunny') { const b = MB(); [-1, 1].forEach((s) => { b.f.add(P.capsule, C.fur, s * 0.1, 0.5, -0.08, -0.2, 0, s * 0.15, 0.13, 0.26, 0.07); b.g.add(P.capsule, 0xffb3c8, s * 0.1, 0.5, -0.045, -0.2, 0, s * 0.15, 0.08, 0.2, 0.03); }); rig.head.add(toGroup(b)); if (rig.tail) rig.tail.visible = false; const t = MB(); t.f.add(P.sphere, 0xffffff, 0, 0.35, -0.5, 0, 0, 0, 0.14); rig.body.add(toGroup(t)); }
    if (sp === 'hamster') { rig.body.scale.set(1.18, 1.02, 1.0); if (rig.tail) rig.tail.visible = false; const b = MB(); [-1, 1].forEach((s) => b.f.add(P.sphere, C.belly, s * 0.17, -0.06, 0.18, 0, 0, 0, 0.13, 0.11, 0.1)); rig.head.add(toGroup(b)); } }
  wants(n) { const id = n.id, g = S.q.gouda | 0, q = S.q.garden | 0;
    if (id === 'brie') return g === 0 || g === 3; if (id === 'snowie') return q === 0; if (id === 'sweepy') return g === 2 && S.flags.pantryOpen; if (id === 'martina') return q < 4;
    if (id === 'rocco') return q === 2 && !S.keys.red && g >= 4; if (id === 'fizz') return !S.flags.goo; if (id === 'candy') return !S.flags.toys && (S.toys.length >= 3 || !S.talks.candy);
    if (id === 'luna') return (S.watched | 0) >= 3 && !S.hats.hardhat; if (id === 'pirat') return S.flags.range && !S.hats.pirate; if (id === 'gary') return !S.flags.mug && (S.flags.mugGot || !S.talks.gary); if (id === 'torty_ceo') return (S.q.tortuga | 0) < 4; if (id === 'plato_tt') return ensureTT().damaged; return false; }
  updateNPCs(dt) { const me = this.me;
    for (const n of this.npcs) { const vis = this.vis.has(n.region); n.rig.root.visible = vis; n.mark.visible = false; if (!vis) continue;
      const near = Math.hypot(me.x - n.x, me.z - n.z) < 4.5 && Math.abs(me.y - n.y) < 3; let sp = 0;
      if (n.d.walk && !(this.chat && this.chat.npc === n) && !near) { const p = n.d.walk[n.wp]; const dx = p[0] - n.x, dz = p[1] - n.z, d = Math.hypot(dx, dz); const v = n.kind === 'bitsy' ? 1.6 : 3.2;
        if (d < 0.3) n.wp = (n.wp + 1) % n.d.walk.length; else { n.x += dx / d * v * dt; n.z += dz / d * v * dt; n.yaw = Math.atan2(dx, dz); sp = v; } }
      else if (near && !n.d.sit && n.kind !== 'sweepy') { let t = Math.atan2(me.x - n.x, me.z - n.z) - n.yaw; while (t > PI) t -= PI * 2; while (t < -PI) t += PI * 2; n.yaw += t * Math.min(1, dt * 4); }
      const R = n.rig.root; R.position.set(n.x, n.y, n.z); R.rotation.y = n.yaw;
      if (this.wants(n)) { n.mark.visible = true; n.mark.position.set(n.x, n.y + n.markY + Math.sin(this.T * 3) * 0.08, n.z); n.mark.rotation.y = this.T * 2; }
      if (!inView(n.x, n.y + 1, n.z, 3)) continue; // offscreen: skip the animation work
      const talking = this.chat && this.chat.npc === n;
      if (n.kind === 'rat') { animRat(n.rig, dt, { speed: sp, air: false, vy: 0, glide: false }); const a = n.d.act, T = this.T + n.x;
        if (talking) n.rig.head.rotation.z = Math.sin(this.T * 9) * 0.08; else if (a === 'chat') { n.rig.head.rotation.z = Math.sin(T * 5) * 0.07 * (Math.sin(T * 0.7) > 0 ? 1 : 0.2); n.rig.body.position.y += Math.abs(Math.sin(T * 3)) * 0.02; }
        else if (a === 'work' && !near) { n.rig.head.rotation.x = 0.25 + Math.sin(T * 6) * 0.06; n.rig.body.rotation.y = Math.sin(T * 0.8) * 0.15; }
        if (n.d.sit) { n.rig.body.rotation.x = -0.25; } }
      else if (n.kind === 'dog') animDog(n.rig, dt, sp, talking ? 'happy' : 'idle'); else if (n.kind === 'sweepy') animSweepy(n.rig, dt, sp, false);
      else if (n.kind === 'martina') animMartina(n.rig, dt, sp); else { n.rig.t = (n.rig.t || 0) + dt; n.rig.body.position.y = Math.abs(Math.sin(n.rig.t * 8)) * 0.05; } }
    if (this.vis.has('robo')) this.pods.forEach((b, i) => { if (inView(b.root.position.x, 1.5, b.root.position.z, 2)) animBot(b, dt, false, 'idle'); }); }
  // ------------------------------------------------ dynamic bits: keycard doors, gears, LEDs, pickups, arms, belt
  buildDyn() { const w = this.world;
    this.kdoors = w.kdoors.map((k) => { const L = k.b - k.a, m = new THREE.Group(); const b = MB(); b.g.add(new THREE.BoxGeometry(1, 1, 1), 0xe5e7eb, 0, 0, 0, 0, 0, 0, 0.22, k.h, L); b.l.add(new THREE.BoxGeometry(1, 1, 1), k.col, 0.12, 0.2, 0, 0, 0, 0, 0.02, 0.25, L * 0.9, 0.7);
        b.l.add(new THREE.BoxGeometry(1, 1, 1), k.col, -0.12, 0.2, 0, 0, 0, 0, 0.02, 0.25, L * 0.9, 0.7); b.x.add(P.sphere, 0x334155, 0.13, -0.2, L * 0.35, 0, 0, 0, 0.06); m.add(toGroup(b)); m.position.set(k.at, k.h / 2, (k.a + k.b) / 2); this.add(m);
        const s = w.solid(k.at - 0.25, 0, k.a, k.at + 0.25, k.h, k.b, { wall: true }); return Object.assign(k, { m, s, k: 0, open: false }); });
    // golden gears (instanced, spinning)
    const gg = gear(10).clone(); gg.center(); this.gearIM = new THREE.InstancedMesh(gg, new THREE.MeshStandardMaterial({ color: 0xffc928, metalness: 0.85, roughness: 0.25, emissive: 0x6b4a00, emissiveIntensity: 0.35 }), w.gears.length); this.gearIM.castShadow = true; this.gearIM.frustumCulled = false; this.add(this.gearIM);
    this.gearGot = new Set(S.gears); this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3(0.3, 0.3, 0.3); this._p = new THREE.Vector3();
    // server LEDs (one instanced mesh, colours flicker)
    const L = w.leds; this.ledIM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), L.length); L.forEach((p, i) => { this._m.makeTranslation(p[0], p[1], p[2]); this.ledIM.setMatrixAt(i, this._m); this.ledIM.setColorAt(i, new THREE.Color(0x4ade80)); }); this.add(this.ledIM);
    // pickups: Candy's squeaky toys, Gary's mug, the Golden Gouda
    const bone = () => { const b = MB(); b.g.add(P.capsule, 0xff6fb5, 0, 0, 0, 0, 0, PI / 2, 0.16, 0.5, 0.16); [-1, 1].forEach((s) => [-1, 1].forEach((t) => b.g.add(P.sphere, 0xff6fb5, s * 0.3, t * 0.08, 0, 0, 0, 0, 0.13))); return toGroup(b); };
    this.toys = TOYS.map((p, i) => { const m = this.add(bone()); m.position.set(p[0], p[1] + 0.35, p[2]); m.visible = !S.toys.includes(i); return { i, p, m }; });
    { const b = MB(); b.g.add(lathe([[0, 0], [0.13, 0], [0.14, 0.26], [0, 0.26]], 20, 'mugH'), 0xfacc15, 0, 0, 0); b.g.add(torus(0.3, 16), 0xfacc15, 0.15, 0.13, 0, 0, 0, 0, 0.07, 0.07, 0.07); this.mug = this.add(toGroup(b)); this.mug.position.set(...MUG); this.mug.visible = !S.flags.mugGot; }
    { const b = MB(); b.x.add(rcyl(0.36, 0.26, 0.08, 32), 0xffc928, 0, 0, 0); b.l.add(P.sphere, 0xfff3a0, 0.12, 0.26, 0.1, 0, 0, 0, 0.05, 0.02, 0.05, 0.6); this.gouda = this.add(toGroup(b)); this.goudaPos(); }
    // robot arms (animated) + conveyor parcels
    this.arms = w.spots.arms.map(([x, z]) => { const g = new THREE.Group(); g.position.set(x, 0.3, z); const b = MB(); b.g.add(P.capsule, 0xff8a3d, 0, 0.5, 0, 0, 0, 0, 0.22, 0.9, 0.22); const up = new THREE.Group(); up.position.y = 1.0; const c = MB(); c.g.add(P.capsule, 0xffd23f, 0, 0.45, 0, 0, 0, 0, 0.16, 0.8, 0.16); c.x.add(P.sphere, 0x475569, 0, 0.9, 0, 0, 0, 0, 0.14);
      up.add(toGroup(c)); g.add(toGroup(b), up); this.add(g); return { g, up }; });
    const bs = w.spots.belt; this.belt = []; for (let i = 0; i < 4; i++) { const b = MB(); b.g.add(P.rbox, [0xff4fa0, 0x4f9dff, 0x4ade80, 0xffd23f][i], 0, 0.15, 0, 0, 0, 0, 0.5, 0.3, 0.5); b.x.add(P.sphere, 0xcbd5e1, 0, 0.38, 0, 0, 0, 0, 0.14); const m = this.add(toGroup(b)); m.position.set(bs[0], bs[1], bs[2]); this.belt.push({ m, o: i / 4 }); }
    // disco ball spin + fondue drip handled in anim()
    this.disco = new THREE.PointLight(0xff4fa0, 0, 6, 1.5); this.disco.position.set(...w.spots.disco); this.add(this.disco);
  }
  goudaPos() { const q = S.q.gouda | 0; const g = this.gouda; if (q >= 4) { g.visible = true; g.position.set(...this.world.spots.gouda); g.scale.setScalar(1); g.userData.carry = false; } else if (q === 3) { g.visible = true; g.userData.carry = true; g.scale.setScalar(0.7); } else g.visible = false; }
  // ------------------------------------------------ test yard rigs
  buildRigs() { const s = this.world.spots;
    this.rocket = makeRocket(); this.rocket.root.position.set(...s.rocket); this.add(this.rocket.root); this.rocket.chute.visible = false; this.rocket.flame.visible = false;
    this.walker = makeWalker(); this.walker.root.position.set(s.course[0], s.course[1], s.course[2]); this.walker.root.rotation.y = PI; this.add(this.walker.root);
    this.cat = makeCatapult(); this.cat.root.position.set(...s.catapult); this.add(this.cat.root); this.wheel = this.add(cheeseWheel()); this.wheel.visible = false;
    this.cannon = makeCannon(); this.cannon.root.position.set(...s.cannon); this.add(this.cannon.root); this.goo = [0x4ade80, 0xff4fa0, 0x60a5fa].map((c) => { const m = this.add(gooBall(c)); m.visible = false; return m; });
    this.splats = [0x4ade80, 0xff4fa0, 0x60a5fa].map((c) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), new THREE.MeshStandardMaterial({ color: c, roughness: 0.3 })); m.scale.set(1, 1, 0.12); m.visible = false; return this.add(m); });
    this.fizz = makeFizz(); this.fizz.root.position.set(...s.fizz); this.add(this.fizz.root);
    this.clanky = makeWalker(); this.clanky.root.position.set(...s.clanky); this.clanky.root.scale.setScalar(0.8); this.clanky.root.rotation.y = 0.6; this.add(this.clanky.root);
    this.yard = new THREE.Group(); this.add(this.yard); [this.rocket.root, this.walker.root, this.cat.root, this.wheel, this.cannon.root, ...this.goo, ...this.splats, this.fizz.root].forEach((o) => this.yard.add(o)); }
  // host starts a test (or a client asks the host)
  startTest(id, t0) { const T = TESTS.find((q) => q.id === id) || TESTS[0]; this.test = { id: T.id, n: T.n, dur: T.dur, t0: t0 != null ? t0 : this.T, last: -1, fl: {} }; this.watchedThis = false; this.robotTrip = ((this.T * 13) | 0) % 2 === 0;
    const r = this.region; const yard = r === 'out' || r === 'obs' || r === 'pent'; this.toastMsg(yard ? `📢 ${T.n} in ${COUNT}…` : `📢 PA: "${T.n} starting in the Test Yard!"`); sfx('check');
    if (this.net.online && this.net.isHost) this.net.bc({ t: 'test', id: T.id, t0: this.test.t0 }); }
  requestTest() { if (this.test) { this.toastMsg('⏳ A test is already running. Watch the yard!'); return; } if (this.net.online && !this.net.isHost) { this.net.send({ t: 'testReq' }); this.toastMsg('📡 Asking the host to start a test…'); return; }
    this.startTest(TESTS[this.testIdx++ % TESTS.length].id); }
  updateTests(dt) { if (!this.test && (!this.net.online || this.net.isHost)) { this.nextTest -= dt; if (this.nextTest <= 0) this.startTest(TESTS[this.testIdx++ % TESTS.length].id); }
    const R = this.test; const s = this.world.spots; if (!R) return; const t = this.T - R.t0 - COUNT; const near = (x, z, d) => Math.hypot(this.me.x - x, this.me.z - z) < d; const once = (k) => R.fl[k] ? false : (R.fl[k] = true);
    const yard = this.region === 'out' || this.region === 'obs' || this.region === 'pent';
    if (t < 0) { const c = Math.ceil(-t); if (c !== R.last) { R.last = c; if (yard && c < COUNT) { this.toastMsg(`⏱️ ${c}…`); sfx('click'); } } return; }
    if (!this.watchedThis && yard && this.me.z < -26) { this.watchedThis = true; S.watched = (S.watched | 0) + 1; persist(); if (S.watched <= 3) this.toastMsg(`👀 Test watched! (${Math.min(3, S.watched)}/3)`); if (S.watched >= 5) this.badge('tests'); }
    const fx = this.fx;
    if (R.id === 'rocket') { const r = this.rocket, [x, y0, z] = s.rocket; let y = y0, sw = 0;
      if (t < 2.5) { r.flame.visible = true; r.flame.scale.setScalar(0.5 + Math.random() * 0.3); r.root.position.x = x + (Math.random() - 0.5) * 0.06; if (Math.random() < dt * 20) fx.puff(x + (Math.random() - 0.5) * 3, y0, z + (Math.random() - 0.5) * 3, 2, 0xe5e7eb); }
      else if (t < 7) { const k = t - 2.5; y = y0 + k * k * 3; r.flame.visible = true; r.flame.scale.setScalar(1 + Math.random() * 0.4); if (Math.random() < dt * 30) fx.puff(x, y - 0.5, z, 2, 0xf5f0e6); if (once('lift')) { sfx('blast'); if (near(x, z, 60)) this.cam.shake = 0.25; } }
      else { r.flame.visible = false; const k = Math.min(1, (t - 7) / (R.dur - COUNT - 8)); y = y0 + 60.75 * (1 - k); sw = Math.sin(t * 1.4) * 2 * (1 - k); r.chute.visible = k < 0.99; if (once('apex')) { fx.confetti(x, y + 3, z, 90); fx.burst(x, y + 2, z, 0xff4fa0, 20, 8); sfx('pop'); } }
      r.root.position.set(x + sw, y, z); r.root.rotation.z = sw * 0.04; }
    else if (R.id === 'robot') { const W = this.walker, [x, y0, z0, z1] = s.course; const k = Math.min(1, t / 14); let z = z0 + (z1 - z0) * k, y = y0, rx = 0, ry = PI;
      for (const bz of [-88, -80, -72]) { const d = Math.abs(z - bz); if (d < 1.2) y = y0 + 0.5 + Math.cos(d / 1.2 * PI / 2) * 0.6; }
      if (this.robotTrip && t > 6.2 && t < 9.2) { z = z0 + (z1 - z0) * (6.2 / 14); rx = Math.min(1.4, (t - 6.2) * 4) * (t < 8.4 ? 1 : Math.max(0, (9.2 - t) / 0.8)); if (once('trip')) { fx.puff(x, 0.3, z, 10); sfx('bounce'); } }
      else if (this.robotTrip && t >= 9.2) z = z0 + (z1 - z0) * Math.min(1, (t - 3) / 14);
      if (t > 15) { ry = PI + (t - 15) * 6; y = y0 + Math.abs(Math.sin(t * 6)) * 0.4; if (once('win')) { fx.confetti(x, 3, z, 50); sfx('win'); } }
      W.root.position.set(x, y, z); W.root.rotation.set(rx, ry, 0); if (W.legs) W.legs.forEach((l, i) => l.rotation.x = t < 15 ? Math.sin(t * 9 + i * PI) * 0.5 : 0); if (W.arms) W.arms.forEach((a, i) => a.rotation.x = t > 15 ? -2.6 : Math.sin(t * 9 + i * PI) * 0.4); }
    else if (R.id === 'catapult') { const a = this.cat.arm, [cx, , cz] = s.catapult, [tx, , tz] = s.target; if (t < 1.4) a.rotation.x = -t * 0.4; else if (t < 1.7) a.rotation.x = -0.56 + (t - 1.4) / 0.3 * 2.2; else a.rotation.x = Math.max(0, 1.64 - (t - 1.7) * 0.8);
      const fl = (t - 1.6) / 2.4; if (fl > 0 && fl < 1) { this.wheel.visible = true; this.wheel.position.set(cx + (tx - cx) * fl, 3 + Math.sin(fl * PI) * 14 - fl * 2.6, cz + (tz - cz) * fl); this.wheel.rotation.x = fl * 20; if (once('fire')) sfx('hook'); }
      else if (fl >= 1) { const k = Math.min(1, (fl - 1) * 2); this.wheel.position.set(tx, 0.45, tz - k * 1.5); this.wheel.rotation.x = 20 + k * 3; if (once('land')) { fx.ring(tx, 0.2, tz, 0xffd23f, 4, 0.6); fx.burst(tx, 0.6, tz, 0xffd23f, 26, 7); this.toastMsg('🎯 BULLSEYE! (Cheese is fine.)'); sfx('win'); } } }
    else if (R.id === 'goo') { const [cx, , cz] = s.cannon, [wx, wy, wz] = s.splatWall; this.cannon.barrel.rotation.x = -0.35;
      [1, 3.5, 6].forEach((ts, i) => { const k = (t - ts) / 1.1, b = this.goo[i], off = (i - 1) * 3; if (k > 0 && k < 1) { b.visible = true; b.position.set(cx + off * k, 1.8 + Math.sin(k * PI) * 5 + (wy - 1.8) * k, cz + (wz - cz) * k); if (once('f' + i)) { sfx('splat'); fx.puff(cx, 2, cz - 1, 6, 0xbef264); } }
        else { b.visible = false; if (k >= 1 && once('s' + i)) { const sp = this.splats[i]; sp.visible = true; sp.position.set(wx + off, wy + (i - 1) * 0.4, wz); sp.scale.set(1.3, 1.1, 0.12); fx.burst(wx + off, wy, wz + 0.3, [0x4ade80, 0xff4fa0, 0x60a5fa][i], 22, 6); sfx('splat'); } } }); }
    else if (R.id === 'fizz') { const f = this.fizz.root, [x, , z] = s.fizz; if (t < 4) { const k = t / 4; f.rotation.z = Math.sin(t * 30 * k) * 0.12 * k; f.position.y = Math.abs(Math.sin(t * 25)) * 0.15 * k; if (Math.random() < dt * 6 * k) fx.sparkle(x, 2.8, z, 0xa7f3d0); }
      else { f.rotation.z = 0; f.position.y = 0; if (once('pop')) { fx.confetti(x, 4, z, 160); fx.burst(x, 3, z, 0xff4fa0, 30, 10); fx.burst(x, 3, z, 0xffd23f, 30, 9); fx.ring(x, 1, z, 0xffffff, 6, 0.7); fx.puff(x, 0.5, z, 14, 0xf5f0e6); sfx('pop'); sfx('blast'); if (near(x, z, 70)) this.cam.shake = 0.4; this.toastMsg('🎉 FIZZ BOMB! (100% confetti, 0% danger)'); }
        if (t < 9 && Math.random() < dt * 40) fx.emit(x, 3, z, (Math.random() - 0.5) * 3, 8 + Math.random() * 4, (Math.random() - 0.5) * 3, 0.35, [0xffffff, 0xa7f3d0, 0xff6fcf][(Math.random() * 3) | 0], 1.6, 9, 0.6); } }
    if (t > R.dur - COUNT) this.endTest(); }
  endTest() { const s = this.world.spots; this.test = null; this.nextTest = GAP;
    this.rocket.root.position.set(...s.rocket); this.rocket.root.rotation.set(0, 0, 0); this.rocket.chute.visible = false; this.rocket.flame.visible = false; this.wheel.visible = false; this.cat.arm.rotation.x = 0;
    this.walker.root.position.set(s.course[0], s.course[1], s.course[2]); this.walker.root.rotation.set(0, PI, 0); this.goo.forEach((b) => b.visible = false); this.splats.forEach((b) => b.visible = false); this.fizz.root.rotation.set(0, 0, 0); this.cannon.barrel.rotation.x = 0; }
  // ------------------------------------------------ region culling (rooms you can't see are not drawn)
  setVis(r, force) { if (r === this.region && !force) return; this.region = r; const v = new Set([r, ...(NEAR[r] || [])]); if (r !== 'dome') v.add('shell'); this.vis = v;
    for (const k in this.world.regionMeshes) { const on = v.has(k); for (const m of this.world.regionMeshes[k]) m.visible = on; }
    for (const o of this.statics || []) o.visible = v.has('atrium'); for (const o of this.risers || []) o.visible = v.has(o.userData.region); this.yard.visible = v.has('out');
    this.pods.forEach((b) => b.root.visible = v.has('robo')); this.clanky.root.visible = v.has('robo'); this.ledIM.visible = v.has('robo'); this.arms.forEach((a) => a.g.visible = v.has('robo')); this.belt.forEach((b) => b.m.visible = v.has('robo'));
    this.kdoors.forEach((k) => k.m.visible = v.has(k.id === 'pantry' ? 'cafe' : 'robo')); this.disco.visible = v.has('offices');
    if (this.tortugaDyn) { const vt = v.has('tortuga'); if (this.tortugaDyn.crushRam) this.tortugaDyn.crushRam.visible = vt; if (this.tortugaDyn.centrifugeArm) this.tortugaDyn.centrifugeArm.visible = vt; if (this.tortugaDyn.chewJaw) this.tortugaDyn.chewJaw.visible = vt; (this.tortugaDyn.plasmaRings || []).forEach(x => x.visible = vt); (this.tortugaDyn.conveyorShells || []).forEach(x => x.visible = vt); }
    const R = REGIONS.find((q) => q.id === r); this.hud.region(r === 'dome' ? '🌵 Secret Desert Dome' : R ? R.name : '🌳 Campus Grounds');
  }
  // ------------------------------------------------ frame
  update(dt) { this.T += dt; const w = this.world, me = this.me;
    const mv = this.app.paused || this.chat ? { x: 0, y: 0 } : readMove();
    const free = !this.app.paused && !this.chat && !this.app.busy;
    const inp = free ? { mx: mv.x, my: mv.y, jumpP: edge('jump'), jumpH: held('jump'), spinP: edge('spin'), blastP: edge('blast'), hookP: false, actP: edge('act') } : { mx: 0, my: 0 };
    me.update(dt, inp, this); me.updateBlob(w);
    this.setVis(regionAt(me.x, me.y + 0.3, me.z));
    for (const p of this.players.values()) if (!p.local) { p.remoteUpdate(dt); p.updateBlob(w); const v = this.vis.has(regionAt(p.x, p.y + 0.3, p.z)); p.root.visible = v; p.blob.visible = p.blob.visible && v; }
    updateFrustum(E.camera);
    this.updateNPCs(dt); this.updateTortuga(dt); this.anim(dt); this.updateTests(dt); this.updateShots(dt); this.updateRange(dt); this.updateDoors(dt); this.collect(); this.secretsCheck();
    this.updateAct(inp); if (inp.actP && this.act) this.doAct(this.act);
    this.net.tick && this.net.tick(dt, this);
    this.updateCam(dt); this.render(dt); this.hud.update(dt, this); this.lightPool.update(dt, me.x, me.y + 2, me.z); }
  render(dt) { this.fx.update(dt); followShadow(this.me.x, this.me.y, this.me.z); this.light(dt); }
  // indoor rooms get a softer exposure so the pastel floors and lamps don't wash out (pure tone tweak, no quality change)
  // [exposure, hemi, env, bloom threshold, bloom strength, fog density]: punchy Turbo look, no white haze indoors
  light(dt) { const r = this.region, L = r === 'out' ? [0.98, 0.6, 0.85, 1.05, 0.38, 0.0035] : r === 'dome' ? [0.92, 0.5, 0.7, 1.15, 0.32, 0.002] : r === 'pent' || r === 'atrium' || r === 'obs' ? [0.9, 0.42, 0.55, 1.3, 0.26, 0.0008] : [0.9, 0.38, 0.5, 1.35, 0.24, 0.0006];
    const k = Math.min(1, dt * 4), R = E.renderer, f = this.scene.fog; R.toneMappingExposure += (L[0] - R.toneMappingExposure) * k; E.hemi.intensity += (L[1] - E.hemi.intensity) * k; this.scene.environmentIntensity += (L[2] - this.scene.environmentIntensity) * k;
    if (E.bloom) { E.bloom.threshold += (L[3] - E.bloom.threshold) * k; E.bloom.strength += (L[4] - E.bloom.strength) * k; } if (f && f.density != null) f.density += (L[5] - f.density) * k; }
  anim(dt) { const T = this.T, v = this.vis;
    // gears
    const G = this.world.gears; for (let i = 0; i < G.length; i++) { const p = G[i]; const got = this.gearGot.has(i); this._q.setFromEuler(new THREE.Euler(0, T * 2 + i, 0)); this._p.set(p[0], p[1] + Math.sin(T * 2 + i) * 0.08, p[2]); this._s.setScalar(got ? 0 : 0.3); this._m.compose(this._p, this._q, this._s); this.gearIM.setMatrixAt(i, this._m); }
    this.gearIM.instanceMatrix.needsUpdate = true;
    if (v.has('gadget') && this.world.spots.sparks) { this._spk = (this._spk || 0) - 1 / 60; if (this._spk <= 0) { this._spk = 0.18 + Math.random() * 0.4; const q = this.world.spots.sparks; this.fx.burst(q[0], q[1], q[2], 0xffd23f, 6, 2.5); } }
    if (v.has('robo')) { if (((T * 8) | 0) !== this._ledT) { this._ledT = (T * 8) | 0; const c = new THREE.Color(); for (let i = 0; i < this.world.leds.length; i++) { const k = (i * 7 + this._ledT) % 11; this.ledIM.setColorAt(i, c.set(k < 2 ? 0xef4444 : k < 6 ? 0x4ade80 : k < 8 ? 0x38bdf8 : 0x14532d)); } this.ledIM.instanceColor.needsUpdate = true; }
      this.arms.forEach((a, i) => { a.g.rotation.y = Math.sin(T * 0.9 + i * 2) * 1.2; a.up.rotation.x = 0.6 + Math.sin(T * 1.7 + i) * 0.5; }); const bs = this.world.spots.belt; this.belt.forEach((b) => { const k = (T * 0.12 + b.o) % 1; b.m.position.x = bs[0] + (bs[3] - bs[0]) * k; });
      this.clanky.root.rotation.y = 0.6 + Math.sin(T * 0.7) * 0.4; }
    this.toys.forEach((t) => { if (t.m.visible) { t.m.rotation.y = T * 2; t.m.position.y = t.p[1] + 0.35 + Math.sin(T * 3) * 0.08; } }); if (this.mug.visible) this.mug.rotation.y = T;
    if (this.gouda.userData.carry) { const me = this.me; this.gouda.position.set(me.x, me.y + 1.25 + Math.sin(T * 4) * 0.04, me.z); this.gouda.rotation.y = T; } else if (this.gouda.visible) this.gouda.rotation.y = T * 0.5;
    if (v.has('offices')) { const inC = Math.hypot(this.me.x + 23, this.me.z - 8) < 2.2; this.disco.intensity = inC ? 6 : 0; if (inC) this.disco.color.setHSL((T * 0.5) % 1, 1, 0.55); }
    if (!this.test) { this.rocket.flame.visible = false; } }
  // ------------------------------------------------ collecting
  collect() { const me = this.me, G = this.world.gears;
    for (let i = 0; i < G.length; i++) { if (this.gearGot.has(i)) continue; const p = G[i]; if (Math.abs(me.x - p[0]) < 0.8 && Math.abs(me.z - p[2]) < 0.8 && me.y + me.hgt + 0.25 > p[1] && me.y < p[1] + 0.6) { this.gearGot.add(i); S.gears = [...this.gearGot]; persist(); sfx('part'); this.fx.sparkle(p[0], p[1], p[2], 0xffd23f); this.fx.burst(p[0], p[1], p[2], 0xffd23f, 10, 4);
        const n = this.gearGot.size; this.toastMsg(`⚙️ Golden gear ${n}/${G.length}`); if (n >= 12) this.giveHat('party'); if (n >= G.length) { this.giveHat('astro'); this.badge('gears'); } this.hud.dirty = true; } }
    this.toys.forEach((t) => { if (!t.m.visible) return; if (Math.hypot(me.x - t.p[0], me.z - t.p[2]) < 0.9 && Math.abs(me.y - t.p[1]) < 1.6) { t.m.visible = false; S.toys.push(t.i); persist(); sfx('squeak'); this.fx.burst(t.p[0], t.p[1] + 0.4, t.p[2], 0xff6fb5, 12); this.toastMsg(`🦴 *SQUEAK!* Candy's toy ${S.toys.length}/3`); } });
    if (this.mug.visible && Math.hypot(me.x - MUG[0], me.z - MUG[2]) < 0.9 && Math.abs(me.y + 1 - MUG[1]) < 1.4) { this.mug.visible = false; S.flags.mugGot = 1; persist(); sfx('cheese'); this.toastMsg('☕ Found a yellow coffee mug! Gary (Offices) lost one…'); } }
  secretsCheck() { const me = this.me; for (const s of this.world.secrets) { if (S.secrets.includes(s.id)) continue; if (Math.hypot(me.x - s.x, me.z - s.z) < s.r && Math.abs(me.y - s.y) < 2.5) { S.secrets.push(s.id); persist(); sfx('win'); this.fx.confetti(me.x, me.y + 1.5, me.z, 40); this.toastMsg(s.msg + ` (${S.secrets.length}/${this.world.secrets.length})`); if (S.secrets.length >= 5) { this.giveHat('wizard'); this.badge('secrets'); } } } }
  // ------------------------------------------------ rewards
  giveHat(id) { if (S.hats[id]) return; S.hats[id] = 1; persist(); const h = HATS.find((q) => q.id === id); this.toastMsg(`🎩 New hat: ${h ? h.n : id}! (Dress-up locker in the Break Lounge)`); sfx('win'); this.checkCrown(); }
  badge(id) { if (S.badges[id]) return; S.badges[id] = 1; persist(); this.toastMsg('🏅 Badge: ' + BADGES[id]); this.checkCrown(); }
  giveKey(k) { S.keys[k] = 1; persist(); sfx('win'); this.toastMsg(k === 'blue' ? '🔵 Got the BLUE keycard!' : '🔴 Got the RED keycard!'); this.fx.confetti(this.me.x, this.me.y + 1.5, this.me.z, 30); }
  checkCrown() { if (S.hats.crown) return; if ((S.q.gouda | 0) >= 4 && (S.q.garden | 0) >= 4 && S.flags.toys && Object.keys(S.calls).length >= 3) { S.hats.crown = 1; persist(); setTimeout(() => { this.toastMsg('👑 You earned the GOLD CROWN! Ratita Industries\' finest!'); sfx('win'); }, 1500); } }
  gotGouda() { this.goudaPos(); this.fx.confetti(this.me.x, this.me.y + 1.5, this.me.z, 50); sfx('cheese'); this.toastMsg('🧀 You have the Golden Gouda! Bring it to Dr. Brie!'); }
  solveGouda() { this.goudaPos(); this.giveHat('chef'); this.badge('gouda'); this.fx.confetti(this.me.x, this.me.y + 1.5, this.me.z, 120); this.app.ui.finale('gouda'); }
  solveGarden() { this.giveHat('flower'); this.badge('garden'); this.fx.confetti(this.me.x, this.me.y + 1.5, this.me.z, 120); this.app.ui.finale('garden'); }
  updateTortuga(dt) {
    const d = this.tortugaDyn; if (!d) return;
    if (!this.tortugaAnim) this.tortugaAnim = { crush: 0, plasma: 0, crash: 0, hazCd: 0 };
    const A = this.tortugaAnim;
    A.hazCd = Math.max(0, A.hazCd - dt);
    ['crush', 'plasma', 'crash'].forEach((k) => { if (A[k] > 0) A[k] = Math.max(0, A[k] - dt); });
    if (d.crushRam) {
      const fast = A.crush > 0 ? 11.0 : 2.2;
      const s = Math.sin(this.T * fast);
      const y = A.crush > 0 ? 1.85 + Math.abs(s) * 1.65 : 2.4 + (s * 0.5 + 0.5) * 1.1;
      d.crushRam.position.y = y;
      if (A.crush > 0 && y < 2.05 && Math.random() < 0.35) this.fx.burst(-71.0, 1.05, -18.5, 0xfbbf24, 4);
    }
    if (d.plasmaRings) {
      const sp = A.plasma > 0 ? 8.5 : 1.8;
      d.plasmaRings.forEach((r, i) => {
        r.rotation.z += dt * sp * (i % 2 ? -1 : 1);
        const sc = A.plasma > 0 ? 1 + Math.sin(this.T * 16 + i) * 0.12 : 1;
        r.scale.setScalar(sc);
      });
      if (A.plasma > 0 && Math.random() < 0.45) this.fx.burst(-71.0 + (Math.random() - 0.5) * 2.2, 1.35, -7.8, 0xf97316, 3);
    }
    if (d.centrifugeArm) {
      const sp = A.crash > 0 ? 9.5 : 2.1;
      d.centrifugeArm.rotation.y += dt * sp;
      if (A.crash > 0 && Math.random() < 0.35) this.fx.burst(-70.5, 1.1, 1.5, 0x2dd4bf, 3);
    }
    if (d.chewJaw) {
      const chomp = A.crash > 0 ? 12.0 : 3.2;
      d.chewJaw.position.y = 1.28 + Math.abs(Math.sin(this.T * chomp)) * 0.22;
    }
    if (d.conveyorShells) {
      d.conveyorShells.forEach((sh, i) => {
        const span = 8.4;
        sh.position.x = -55.4 + ((this.T * 1.3 + i * 2.8) % span);
        sh.rotation.y = this.T * 1.5 + i;
      });
    }
    if (d.roofBeacon) d.roofBeacon.rotation.y += dt * 1.4;
    if (this.me && this.region === 'tortuga' && A.hazCd <= 0 && !this.app.paused) {
      const mx = this.me.x, mz = this.me.z;
      if (Math.hypot(mx - (-71.0), mz - (-18.5)) < 1.35 && d.crushRam && d.crushRam.position.y < 2.25) {
        A.hazCd = 2.5; this.me.knock({ x: -71.0, z: -18.5 });
        this.damageShellRig('crush', '50-Ton Crush Press Impact');
      } else if (Math.hypot(mx - (-71.0), mz - (-7.8)) < 1.35 && A.plasma > 0) {
        A.hazCd = 2.5; this.me.knock({ x: -71.0, z: -7.8 });
        this.damageShellRig('plasma', '900°C Solar Plasma Arc');
      } else if (Math.hypot(mx - (-70.5), mz - 1.5) < 1.65 && A.crash > 0) {
        A.hazCd = 2.5; this.me.knock({ x: -70.5, z: 1.5 });
        this.damageShellRig('crash', '88 MPH Centrifuge Collision');
      }
    }
  }
  damageShellRig(chamberKey, reason = 'Chamber Overload') {
    const tt = ensureTT();
    const gInfo = CROSSOVER_GADGETS.find((x) => x.id === tt.activeGadget) || CROSSOVER_GADGETS[0];
    tt.integrity = Math.max(15, (tt.integrity | 0) - 40);
    tt.damaged = true;
    tt.brokenGadget = gInfo.name;
    tt.crashes = (tt.crashes | 0) + 1;
    persist();
    sfx('hurt');
    if (this.me) this.fx.burst(this.me.x, this.me.y + 0.6, this.me.z, 0xf97316, 22);
    this.hud.dirty = true;
    this.toastMsg(`💥 ${reason}! ${gInfo.name} cracked (${tt.integrity}%) — repair at Plato's Weld Bench!`);
  }
  runChamberTest(chamberKey, overcharge = false) {
    const tt = ensureTT();
    const info = CHAMBER_INFO[chamberKey] || CHAMBER_INFO.crush;
    if (!this.tortugaAnim) this.tortugaAnim = { crush: 0, plasma: 0, crash: 0, hazCd: 0 };
    this.tortugaAnim[chamberKey] = 3.2;
    if (tt.damaged) {
      sfx('hurt');
      this.toastMsg('⚠️ Shell Rig is cracked! Weld & repair at Plato\'s Bench before running chamber tests!');
      return { ok: false, reason: 'damaged', msg: `⚠️ Your ${tt.brokenGadget || 'Shell Rig'} is cracked (${tt.integrity}% integrity)! Repair it at Plato's Shell-Armor Weld Bench first (or use Free Warranty Weld).` };
    }
    const pos = chamberKey === 'crush' ? [-71.0, 1.3, -18.5] : chamberKey === 'plasma' ? [-71.0, 1.3, -7.8] : [-70.5, 1.3, 1.5];
    if (overcharge) {
      this.fx.burst(pos[0], pos[1], pos[2], 0xef4444, 28);
      this.damageShellRig(chamberKey, `${info.title} OVER-CHARGE`);
      return {
        ok: false,
        reason: 'overcharge_crash',
        msg: `💥 OVER-CHARGE CRASH in ${info.title}! Peak load exceeded safe limits — your ${tt.brokenGadget} carapace cracked (${tt.integrity}% integrity, -24% move speed & sparks). Repair at Plato's Shell-Armor Weld Bench!`
      };
    }
    const first = !tt.tests[chamberKey];
    tt.tests[chamberKey] = (tt.tests[chamberKey] | 0) + 1;
    const reward = first ? 30 : 15;
    tt.scrap = (tt.scrap | 0) + reward;
    tt.integrity = Math.max(55, (tt.integrity | 0) - 10);
    if ((S.q.tortuga | 0) === 0) S.q.tortuga = 1;
    const done = (tt.tests.crush ? 1 : 0) + (tt.tests.plasma ? 1 : 0) + (tt.tests.crash ? 1 : 0);
    if (done >= 3 && (S.q.tortuga | 0) < 3) S.q.tortuga = 3;
    persist();
    sfx('check');
    this.fx.burst(pos[0], pos[1], pos[2], 0x2dd4bf, 26);
    this.hud.dirty = true;
    this.toastMsg(`✅ ${info.title} Certified! +${reward} Scrap Bolts (${done}/3 Chambers)`);
    return {
      ok: true,
      msg: `✅ ${info.title} PASSED! Shell held firm under ${info.hazard}. Earned +${reward} Scrap Bolts (${done}/3 chambers certified)!`
    };
  }
  repairShellRig(mode = 'bolts') {
    const tt = ensureTT();
    if (mode === 'bolts') {
      if ((tt.scrap | 0) < 20) {
        sfx('deny');
        this.toastMsg('🔩 Need 20 Scrap Bolts! Grab Free Bolts from the bin next to Plato or use Warranty Weld!');
        return { ok: false, msg: 'Need 20 Scrap Bolts! Click "Grab Free Scrap Bolts (+30)" or use the Free Emergency Warranty Weld so you are never stuck.' };
      }
      tt.scrap -= 20;
    }
    tt.integrity = 100;
    tt.damaged = false;
    tt.brokenGadget = '';
    tt.repairs = (tt.repairs | 0) + 1;
    persist();
    sfx('win');
    if (this.me) this.fx.burst(this.me.x, this.me.y + 0.6, this.me.z, 0x2dd4bf, 24);
    this.fx.burst(-60.5, 1.2, -16.8, 0xfbbf24, 22);
    this.hud.dirty = true;
    this.toastMsg('🔧 Shell Rig 100% Welded & Repaired! Full speed restored!');
    return { ok: true, msg: '🔧 Plato welded new hexagonal tortoise scutes onto your rig! Shell Integrity restored to 100% and speed penalty cleared!' };
  }
  claimScrapBin() {
    const tt = ensureTT();
    tt.scrap = (tt.scrap | 0) + 30;
    persist();
    sfx('part');
    this.fx.burst(-57.6, 1.0, -16.8, 0xfbbf24, 18);
    this.hud.dirty = true;
    this.toastMsg('🔩 +30 Free Scrap Bolts collected from the Recycling Bin!');
    return tt.scrap;
  }
  solveTortuga() {
    this.giveHat('tortuga');
    this.badge('tortuga');
    S.outfit = 'tortuga';
    persist();
    this.me.setOutfit(S.outfit);
    this.fx.confetti(this.me.x, this.me.y + 1.5, this.me.z, 120);
    this.hud.dirty = true;
    this.app.ui.finale('tortuga');
  }
  goToTortuga(spot = 'hub') {
    const pts = {
      hub: [-55.0, 0, -5.5, 0],
      door: [-43.5, 0, -9.5, -Math.PI / 2],
      courtyard: [-59.0, 0, 14.5, Math.PI],
      chambers: [-65.0, 0, -9.5, -Math.PI / 2],
      repair: [-59.5, 0, -14.5, Math.PI]
    };
    const p = pts[spot] || pts.hub;
    this.me.place([p[0], p[1], p[2]], p[3]);
    this.cam.yaw = p[3];
    this.cam.snap = true;
    this.setVis(regionAt(p[0], p[1] + 0.3, p[2]), true);
  }

  addClue(id) { const nw = !S.clues[id]; S.clues[id] = 1; persist(); this.app.ui.clue(id, clueText(id), nw);
    const g = S.q.gouda | 0, q = S.q.garden | 0; if (g === 1 && GOUDA_CLUES.every((c) => S.clues[c])) { S.q.gouda = 2; persist(); setTimeout(() => this.toastMsg('💡 All Gouda clues found! The trail leads to the café PANTRY.'), 400); }
    if (q === 1 && GARDEN_CLUES.every((c) => S.clues[c])) { S.q.garden = 2; persist(); setTimeout(() => this.toastMsg('💡 All garden clues found! Ask Rocco in Security about a RED keycard.'), 400); } }
  recheckQuests() { if (S.q.gouda === 1 && GOUDA_CLUES.every((c) => S.clues[c])) { S.q.gouda = 2; this.toastMsg('💡 You already have all the Gouda clues! The trail leads to the café PANTRY.'); } if (S.q.garden === 1 && GARDEN_CLUES.every((c) => S.clues[c])) { S.q.garden = 2; this.toastMsg('💡 You already have all the garden clues! Ask Rocco in Security.'); } persist(); this.hud.dirty = true; }
  // ------------------------------------------------ keycard doors
  updateDoors(dt) { const me = this.me; for (const k of this.kdoors) { const d = Math.hypot(me.x - k.at, me.z - (k.a + k.b) / 2); const want = !!S.keys[k.key] && d < 3.2; if (want && !k.open) { sfx('door'); if (k.id === 'pantry') { S.flags.pantryOpen = 1; persist(); } } k.open = want;
      k.k += ((k.open ? 1 : 0) - k.k) * Math.min(1, dt * 5); k.m.position.y = k.h / 2 + k.k * (k.h - 0.1); k.s.off = k.k > 0.7; } }
  // ------------------------------------------------ interaction prompt
  updateAct() { const me = this.me; let best = null, bd = 1e9;
    for (const o of this.world.inter) { const d = Math.hypot(me.x - o.x, me.z - o.z); if (d < o.r && Math.abs(me.y - o.y) < 2 && d < bd) { bd = d; best = o; } }
    for (const n of this.npcs) { if (!n.rig.root.visible) continue; const r = n.id === 'candy' ? 3.8 : n.kind === 'dog' ? 2.6 : n.kind === 'martina' ? 2.8 : 2.1; const d = Math.hypot(me.x - n.x, me.z - n.z); if (d < r && Math.abs(me.y - n.y) < 2 && d - 0.2 < bd) { bd = d; best = { kind: 'npc', npc: n, label: '💬 Talk to ' + n.d.n.split(' (')[0] }; } }
    for (const k of this.kdoors) { if (S.keys[k.key]) continue; const d = Math.hypot(me.x - k.at, me.z - (k.a + k.b) / 2); if (d < 2.2 && d < bd) { bd = d; best = { kind: 'locked', k, label: `🔒 Needs the ${k.key.toUpperCase()} keycard` }; } }
    this.act = best; this.hud.setAct(this.chat ? null : best); }
  doAct(o) { const ui = this.app.ui; sfx('click');
    if (o.kind === 'npc') { const r = talk(o.npc.id, this); this.chat = { npc: o.npc }; ui.dialog(o.npc.d.n, r.lines, () => { this.chat = null; if (r.fx) r.fx(); this.recheckQuests(); }); }
    else if (o.kind === 'clue') this.addClue(o.id.replace('clue_', ''));
    else if (o.kind === 'elev') { if (o.need && !S.keys[o.need]) return this.toastMsg('🔒 The lift needs the RED keycard'); ui.fade(() => { this.me.place(o.to, o.yaw); this.cam.snap = true; this.cam.yaw = o.yaw; this.setVis(regionAt(o.to[0], o.to[1] + 0.3, o.to[2])); }); sfx('door'); }
    else if (o.kind === 'console') this.requestTest();
    else if (o.kind === 'call') ui.call();
    else if (o.kind === 'map') ui.map(this);
    else if (o.kind === 'wardrobe') ui.wardrobe();
    else if (o.id === 'goo') ui.goo(this);
    else if (o.id === 'taste') ui.taste(this);
    else if (o.id === 'range') this.startRange();
    else if (o.id === 'copier') { const p = ['a photocopy of Pi-rat\'s face (again)', 'a memo: "PLEASE STOP PHOTOCOPYING PI-RAT"', 'a coupon for one (1) free cheese', 'a drawing of Candy wearing a tie']; this.toastMsg('🖨️ *whirr* It printed ' + p[(this.T * 3 | 0) % p.length] + '!'); sfx('pop'); }
    else if (o.id === 'arcade') { const sc = 1000 + ((this.T * 977) | 0) % 9000; this.toastMsg(`🕹️ Cheese Invaders: you scored ${sc}! Nibbles still has the high score.`); sfx('blast'); }
    else if (o.kind === 'fun') { this._fun = ((this._fun | 0) + 1) % o.msgs.length; this.toastMsg(o.msgs[this._fun]); sfx(o.sfx || 'squeak'); if (o.fx) o.fx(this); }
    else if (o.kind === 'tt_chamber') ui.tortugaLab(this, 'chambers', o.chamber);
    else if (o.kind === 'tt_repair') ui.tortugaLab(this, 'repair');
    else if (o.kind === 'tt_gadget') ui.tortugaLab(this, 'gadgets');
    else if (o.kind === 'tt_scrap') this.claimScrapBin();
    else if (o.kind === 'tt_snack') { this.me.hearts = this.me.maxHearts; sfx('cheese'); this.fx.burst(o.x, o.y + 1, o.z, 0x22c55e, 14); this.toastMsg('🥬 Crispy Tortuga Lettuce & Gouda! Hearts full!'); }
    else if (o.kind === 'locked') { sfx('deny'); this.toastMsg(o.label); } }
  // ------------------------------------------------ cheese blaster + target test
  onSpin(p) { if (Math.hypot(p.x + 23, p.z - 8) < 2.2) this.fx.confetti(p.x, p.y + 1, p.z, 12); }
  hookTarget() { return null; }
  fireBlast(p) { const g = new THREE.Mesh(this._shotG || (this._shotG = new THREE.SphereGeometry(0.16, 14, 10)), MATS.l); g.position.set(p.x + Math.sin(p.yaw) * 0.4, p.y + 0.45, p.z + Math.cos(p.yaw) * 0.4); this.scene.add(g); this.shots.push({ m: g, vx: Math.sin(p.yaw) * 22, vz: Math.cos(p.yaw) * 22, t: 0.9 }); sfx('blast'); }
  updateShots(dt) { for (let i = this.shots.length - 1; i >= 0; i--) { const s = this.shots[i]; s.t -= dt; s.m.position.x += s.vx * dt; s.m.position.z += s.vz * dt; let dead = s.t <= 0;
      if (this.range) for (const tg of this.range.tg) { if (!tg.up) continue; if (s.m.position.distanceTo(tg.m.position) < 0.75) { tg.up = false; tg.m.visible = false; this.range.hits++; dead = true; this.fx.burst(tg.m.position.x, tg.m.position.y, tg.m.position.z, 0xffd23f, 14); sfx('pop'); } }
      if (dead) { this.scene.remove(s.m); this.shots.splice(i, 1); } } }
  startRange() { if (this.range) return; const mk = () => { const b = MB(); [0xef4444, 0xffffff, 0xef4444, 0xffffff].forEach((c, i) => b.g.add(rcyl(0.5 - i * 0.12, 0.06 + i * 0.015, 0.02, 28), c, 0, 0, 0, 0, 0, PI / 2)); return toGroup(b); };
    this.range = { t: 20, hits: 0, tg: this.world.spots.targets.map((p) => { const m = this.add(mk()); m.position.set(...p); return { m, up: true }; }) }; this.toastMsg('🎯 Blast all 5 targets! Press BLAST (or F)'); sfx('check'); }
  updateRange(dt) { const R = this.range; if (!R) return; R.t -= dt; R.tg.forEach((t, i) => { if (t.up) t.m.position.y = this.world.spots.targets[i][1] + Math.sin(this.T * 2 + i) * 0.3; }); this.hud.timer(R.t > 0 ? `🎯 ${R.hits}/5 · ${Math.ceil(R.t)}s` : '');
    if (R.hits >= 5 || R.t <= 0) { const ok = R.hits >= 5; R.tg.forEach((t) => { this.scene.remove(t.m); }); this.range = null; this.hud.timer('');
      if (ok) { this.fx.confetti(this.me.x, this.me.y + 1.5, this.me.z, 60); sfx('win'); this.badge('range'); if (!S.flags.range) { S.flags.range = 1; persist(); this.toastMsg('🎯 Perfect! Tell Pi-rat (Executive Suite) for your prize!'); } }
      else { sfx('deny'); this.toastMsg(`🎯 ${R.hits}/5. So close! Try again.`); } } }
  // ------------------------------------------------ camera (same feel as Ratita Rescue)
  updateCam(dt) { const c = this.cam, me = this.me, cam = E.camera, sens = (S.opts.camSens || 1);
    if (IN.camDX || IN.camDY) { c.yaw -= IN.camDX * 0.0085 * sens * (S.opts.invertX ? -1 : 1); c.pitch = Math.max(-0.15, Math.min(1.15, c.pitch + IN.camDY * 0.005 * sens)); IN.camDX = IN.camDY = 0; }
    const manual = performance.now() - IN.lastCam < 1500;
    if (!manual && me.speed > 1) { let d = me.yaw - c.yaw; while (d > PI) d -= PI * 2; while (d < -PI) d += PI * 2; if (Math.abs(d) < 2.2) c.yaw += d * Math.min(1, dt * 0.9 * (me.speed / 7)); }
    const indoor = this.region !== 'out'; const want = this.chat ? 5.6 : indoor ? 7.2 : 9.6; c.dist += (want - c.dist) * Math.min(1, dt * 2);
    // talking: frame you AND the NPC (camera swings to a 3/4 over-the-shoulder view, aimed between both faces)
    const cn = this.chat && this.chat.npc; let tx = me.x, tz = me.z, ty = me.y + me.hgt * 0.86;
    if (cn) { const a = Math.atan2(me.x - cn.x, me.z - cn.z); let dy = a + 1.15 + PI - c.yaw; while (dy > PI) dy -= PI * 2; while (dy < -PI) dy += PI * 2; c.yaw += dy * Math.min(1, dt * 3); c.pitch += (0.3 - c.pitch) * Math.min(1, dt * 3);
      tx = me.x * 0.42 + cn.x * 0.58; tz = me.z * 0.42 + cn.z * 0.58; ty = Math.max(ty - 0.2, cn.y + (cn.markY || 1.5) * 0.75); }
    const k6 = c.snap ? 1 : 1 - Math.exp(-dt * 6); c.tgt.set(c.tgt.x + (tx - c.tgt.x) * (cn || c.chatT > 0 ? k6 : 1), c.snap ? ty : c.tgt.y + (ty - c.tgt.y) * (1 - Math.exp(-dt * (me.onGround ? 6 : 3))), c.tgt.z + (tz - c.tgt.z) * (cn || c.chatT > 0 ? k6 : 1)); c.chatT = cn ? 0.8 : Math.max(0, (c.chatT || 0) - dt);
    const pp = Math.min(1.15, c.pitch + (c.boost || 0)); const dir = new THREE.Vector3(-Math.sin(c.yaw) * Math.cos(pp), Math.sin(pp), -Math.cos(c.yaw) * Math.cos(pp));
    // smooth camera collision (Ratita Rescue patch): only big things pull the camera in, 3 rays so the lens never grazes an edge,
    // and indoors the camera also stays inside the room box (never behind a wall, above the ceiling or inside furniture)
    const indoorR = REGIONS.find((q) => q.id === this.region);
    const big = (q) => q.cam !== false && !q.off && !q.nocam && !q.floor && !q.glass && (q.max[1] - q.min[1]) > (indoorR ? 0.9 : 1.2) && Math.max(q.max[0] - q.min[0], q.max[2] - q.min[2]) > (indoorR ? 0.9 : 1.6);
    const sx = Math.cos(c.yaw) * 0.32, sz = -Math.sin(c.yaw) * 0.32; let d = c.dist + 0.5; const o2 = this._co || (this._co = new THREE.Vector3());
    for (const k of [0, -1, 1]) { o2.set(c.tgt.x + sx * k, c.tgt.y, c.tgt.z + sz * k); d = Math.min(d, this.world.ray(o2, dir, c.dist + 0.5, big)); }
    if (indoorR) { const m = 0.45, lo = [indoorR.x0 + m, indoorR.y0, indoorR.z0 + m], hi = [indoorR.x1 - m, ({ atrium: 7.5, dcr: 9.3, tortuga: 8.6, pent: 25.6, dome: -19, obs: 4.6 })[indoorR.id] || 4.65, indoorR.z1 - m], O = [c.tgt.x, c.tgt.y, c.tgt.z], Dd = [dir.x, dir.y, dir.z];
      for (let i = 0; i < 3; i++) { if (Math.abs(Dd[i]) < 1e-6) continue; const t = ((Dd[i] > 0 ? hi[i] : lo[i]) - O[i]) / Dd[i]; if (t >= 0) d = Math.min(d, t + 0.45); } }
    d = Math.max(1.0, Math.min(c.dist, d - 0.45)); // tight spot indoors: tilt up for a higher over-the-head view instead of zooming into the player's back
    c.boost = (c.boost || 0) + (((indoorR && d < c.dist * 0.7 && !this.chat) ? 0.4 : 0) - (c.boost || 0)) * Math.min(1, dt * 1.5);
    if (c.cd == null || c.snap) c.cd = d; else if (d < c.cd - 0.05) c.cd += (d - c.cd) * Math.min(1, dt * 9); else if (d > c.cd + 0.35) c.cd += (d - c.cd) * Math.min(1, dt * 2.2);
    const w3 = c.tgt.clone().addScaledVector(dir, c.cd); const gy = this.world.ground(w3.x, w3.z, w3.y + 0.5, 0.3).y; const minY = (gy > -1e8 ? gy : me.y) + 0.6; if (w3.y < minY) w3.y = minY;
    if (c.snap) { c.pos.copy(w3); c.snap = false; } else { const kx = 1 - Math.exp(-dt * 14), ky = 1 - Math.exp(-dt * 8); c.pos.x += (w3.x - c.pos.x) * kx; c.pos.z += (w3.z - c.pos.z) * kx; c.pos.y += (w3.y - c.pos.y) * ky; }
    cam.position.copy(c.pos); if (c.shake > 0) { c.shake -= dt; cam.position.x += (Math.random() - 0.5) * c.shake; cam.position.y += (Math.random() - 0.5) * c.shake; }
    cam.lookAt(c.tgt.x, c.tgt.y + 0.2, c.tgt.z); const fov = E.baseFov; if (Math.abs(cam.fov - fov) > 0.1) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 3); cam.updateProjectionMatrix(); } }
  // ------------------------------------------------ co-op
  addRemote(pid, info, slot) { if (this.players.has(pid)) return this.players.get(pid); const p = new Player({ rat: 'human', look: info.look, outfit: info.outfit, name: info.name, pid, slot }); p.addTo(this.scene); p.place(this.world.start); this.players.set(pid, p); this.hud.dirty = true; return p; }
  removeRemote(pid) { const p = this.players.get(pid); if (!p || p.local) return; p.removeFrom(this.scene); this.players.delete(pid); this.hud.dirty = true; }
  refreshMe() { const old = this.me; const p = new Player({ rat: 'human', look: S.look, outfit: S.outfit, name: S.name || 'You', local: true, gadgets: old.gadgets, pid: old.pid }); p.addTo(this.scene); p.place([old.x, old.y, old.z], old.yaw); p.cp = old.cp; p.cpYaw = old.cpYaw; old.removeFrom(this.scene); this.players.delete(old.pid); this.players.set(p.pid, p); this.me = p; }
}
