// Grok Pup Town runtime: the town, players, townsfolk, the Dog-Bus, birds & ducks, day/evening, collectibles, the
// Golden Bone mystery, fetch + agility (3D mini-games), co-op hooks.
import * as THREE from 'three';
import { E, setEnvironment, followShadow, skyUniforms } from './engine.js';
import { World } from './world.js';
import { buildTown, regionAt, areaName, REGIONS, DOORS } from './town.js';
import { Player } from './player.js';
import { FX } from './fx.js';
import { makeRat, animRat, makeMartina, animMartina, MB, toGroup } from './models.js';
import { makePup, animPup, makeKitten, birdGeo, makeDogBus } from './dogs.js';
import { MATS } from './mats.js';
import { P } from './geo.js';
import { rcyl, capsule, torus, sph, cone, heart, star } from './shapes.js';
import { updateFrustum, inView, LightPool } from './perf.js';
import { sfx, playMusic } from './audio.js';
import { S, persist } from './save.js';
import { NPCS, talk, clueText, BONE_CLUES, HATS, BADGES } from './story.js';
import { readMove, edge, held, IN } from './input.js';
const PI = Math.PI;
const TOYS = [[18.4, 0.0, 41.6], [22.9, 0.17, -29.4], [7.5, 0.0, -44.6]];
const DAY = 420; // seconds per day/evening cycle
// ---- Dog-Bus route: rounded rectangle on the ring road centre line
const BR = 19.5, BC = 4; const BUS_V = 7.5, STOP_T = 6;
const busPath = (() => { const pts = []; const seg = (ax, az, bx, bz) => pts.push([ax, az, bx, bz]); const a = BR - BC;
  // clockwise from south-west straight (driving +x along z = +BR)
  const P = []; const arc = (cx, cz, a0) => { for (let i = 0; i <= 8; i++) { const t = a0 + i / 8 * PI / 2; P.push([cx + Math.cos(t) * BC, cz + Math.sin(t) * BC]); } };
  P.push([-a, BR]); P.push([a, BR]); arc(a, a, PI / 2); P.length -= 0; // to east side going -z
  const out = []; const add = (x, z) => { const l = out[out.length - 1]; if (!l || Math.hypot(l[0] - x, l[1] - z) > 0.01) out.push([x, z]); };
  add(-a, BR); add(a, BR); for (let i = 1; i <= 8; i++) { const t = PI / 2 - i / 8 * PI / 2; add(a + Math.cos(t) * BC, a + Math.sin(t) * BC); }
  add(BR, -a); for (let i = 1; i <= 8; i++) { const t = -i / 8 * PI / 2; add(a + Math.cos(t) * BC, -a + Math.sin(t) * BC); }
  add(-a, -BR); for (let i = 1; i <= 8; i++) { const t = -PI / 2 - i / 8 * PI / 2; add(-a + Math.cos(t) * BC, -a + Math.sin(t) * BC); }
  add(-BR, a); for (let i = 1; i <= 8; i++) { const t = PI - i / 8 * PI / 2; add(-a + Math.cos(t) * BC, a + Math.sin(t) * BC); }
  add(-a, BR); const cum = [0]; for (let i = 1; i < out.length; i++) cum.push(cum[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1])); return { pts: out, cum, L: cum[cum.length - 1] }; })();
function busAt(s) { const { pts, cum, L } = busPath; s = ((s % L) + L) % L; let i = 1; while (cum[i] < s) i++; const a = pts[i - 1], b = pts[i], t = (s - cum[i - 1]) / (cum[i] - cum[i - 1]); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(b[0] - a[0], b[1] - a[1])]; }
function nearestS(x, z) { let best = 0, bd = 1e9; for (let s = 0; s < busPath.L; s += 0.25) { const p = busAt(s); const d = (p[0] - x) ** 2 + (p[1] - z) ** 2; if (d < bd) { bd = d; best = s; } } return best; }
const STOPS = [nearestS(8, 19.5), nearestS(-12, -19.5)].sort((a, b) => a - b);
const BUS_PERIOD = busPath.L / BUS_V + STOP_T * 2;
// bus state at time t: { s, stop: index or -1, wait }
function busState(t) { let k = ((t % BUS_PERIOD) + BUS_PERIOD) % BUS_PERIOD; const d1 = STOPS[0] / BUS_V, d2 = (STOPS[1] - STOPS[0]) / BUS_V;
  if (k < d1) return { s: k * BUS_V, stop: -1, next: 0, eta: d1 - k }; k -= d1; if (k < STOP_T) return { s: STOPS[0], stop: 0, wait: STOP_T - k }; k -= STOP_T;
  if (k < d2) return { s: STOPS[0] + k * BUS_V, stop: -1, next: 1, eta: d2 - k }; k -= d2; if (k < STOP_T) return { s: STOPS[1], stop: 1, wait: STOP_T - k }; k -= STOP_T; return { s: STOPS[1] + k * BUS_V, stop: -1, next: 0, eta: (busPath.L - STOPS[1]) / BUS_V - k + d1 }; }
const stopIdx = (worldStop) => { const sAt = nearestS(...(worldStop === 0 ? [8, 19.5] : [-12, -19.5])); return STOPS.indexOf(STOPS.reduce((b, s) => Math.abs(s - sAt) < Math.abs(b - sAt) ? s : b, STOPS[0])); };
export class Game {
  constructor(app, opts = {}) {
    this.app = app; this.scene = E.scene; this.net = app.net; this.hud = app.hud; this.T = 0; this.levelId = 'puptown';
    const w = this.world = new World(); w.game = this; buildTown(w); w.finalize(this.scene);
    setEnvironment(w.env); this.fx = new FX(this.scene); this.extra = []; this.lightPool = new LightPool(this.scene, w.lights, 4);
    this.players = new Map();
    this.me = new Player({ rat: 'human', look: S.look, outfit: S.outfit, name: S.name || 'You', local: true, gadgets: new Set(['blaster']), pid: opts.pid || 'me' });
    this.me.addTo(this.scene); this.me.place(w.start, w.startYaw); this.me.cp = w.start.slice(); this.me.cpYaw = w.startYaw; this.players.set(this.me.pid, this.me);
    this.cam = { yaw: w.startYaw, pitch: 0.42, dist: w.camDist, pos: new THREE.Vector3(), tgt: new THREE.Vector3(), snap: true, shake: 0 };
    this.region = 'out'; this.vis = null; this.act = null; this.chat = null; this.balls = []; this.fetch = null; this.agil = null; this._vt = 0;
    this.stopMap = [stopIdx(0), stopIdx(1)];
    this.buildNPCs(); this.buildDyn(); this.setVis('out', true); this.light(10);
    playMusic('town');
  }
  add(o) { this.scene.add(o); this.extra.push(o); return o; }
  toastMsg(m) { this.hud.toast(m); }
  sfx(n) { sfx(n); }
  // ------------------------------------------------ townsfolk
  buildNPCs() { const w = this.world; this.npcs = NPCS.map((d) => { const L = d.look; let rig, kind = 'dog', markY = 1.4;
      if (L.rat) { rig = makeRat(L.rat, L.hat || 'none', { pack: false, extras: L.extras || [], noBlaster: true }); rig.root.scale.setScalar(1.35); kind = 'rat'; markY = 1.6; }
      else if (L.martina) { rig = makeMartina(); kind = 'martina'; rig.root.scale.multiplyScalar(1.15); markY = 2.3; }
      else if (L.kitten) { rig = makeKitten(); kind = 'kitten'; rig.root.scale.setScalar(1.4); markY = 1.3; }
      else { rig = makePup(L.b, { hat: L.hat, hatC: L.hatC, neck: L.neck, neckC: L.neckC, glasses: L.glasses, tint: L.tint, seed: d.id.length * 13 + d.id.charCodeAt(0) }); rig.root.scale.setScalar(L.s || 1); markY = (1.15 + (L.b === 'greatdane' ? 0.5 : 0)) * (L.s || 1); }
      const g = w.ground(d.at[0], d.at[1], 20, 0.1).y; const y = d.y != null ? d.y + (d.y < 1 && d.region !== 'out' ? 0.12 : 0) : (g > -50 ? g : 0);
      const n = { d, id: d.id, rig, kind, x: d.at[0], y, z: d.at[1], yaw: d.at[2], x0: d.at[0], z0: d.at[1], y0: y, yaw0: d.at[2], region: d.region, wp: 0, markY };
      if (d.id === 'rascal') n.y = 0.55; if (d.id === 'mittens') n.y = 7.8;
      rig.root.position.set(n.x, n.y, n.z); rig.root.rotation.y = n.yaw; this.add(rig.root);
      const mk = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.38, 16).rotateX(PI), new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffb000, emissiveIntensity: 0.8 }));
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), mk.material); dot.position.y = 0.34; mk.add(dot); mk.visible = false; this.add(mk); n.mark = mk; return n; });
    this.npc = Object.fromEntries(this.npcs.map((n) => [n.id, n])); this.placeStory(); }
  // story-driven positions (kitten rescued, Nugget appears, party in the square)
  placeStory() { const q = S.q.bone | 0, N = this.npc, set = (id, x, z, yaw, y, region) => { const n = N[id]; n.x = n.x0 = x; n.z = n.z0 = z; n.yaw = n.yaw0 = yaw; n.y = n.y0 = y; n.region = region; };
    if (S.flags.kittenDown) { const k = this.world.spots.kittenDown; set('mittens', k[0], k[2], PI, 0, 'out'); }
    N.nugget.hidden = !(q === 2 || q === 3 || q >= 4);
    if (q >= 4) { set('candy', 0.6, -10.4, 0, 0.0, 'out'); set('nugget', 1.9, -10.9, -0.4, 0.0, 'out'); set('mayor', -1.4, -11.2, 0.4, 0.0, 'out'); N.candy.d.mode = 'happy'; N.nugget.d.mode = 'play'; } }
  wants(n) { const id = n.id, q = S.q.bone | 0; if (n.hidden) return false;
    if (id === 'mayor') return q === 0 || q === 3; if (id === 'nugget') return q === 2; if (id === 'candy') return !S.flags.toys && (S.toys.length >= 3 || !S.talks.candy);
    if (id === 'sparky') return !S.flags.kitten && (S.flags.kittenDown || !S.talks.sparky) || (q === 1 && !S.clues.log && !S.talks.sparky); if (id === 'mittens') return !S.flags.kittenDown;
    if (id === 'martina') return !S.flags.garden && (S.plants.length >= 4 || !S.talks.martina); if (id === 'croissant') return (S.best.bake | 0) >= 3 && !S.hats.chef || (q === 1 && !S.clues.flour && !S.talks.croissant);
    if (id === 'rex') return !S.talks.rex; if (id === 'dash') return !S.talks.dash; if (['luna', 'pirat', 'snowie'].includes(id)) return !S.rats[id];
    if (['pepper', 'rascal', 'fifi'].includes(id)) return q >= 1 && q < 3 && !(S.sus[id] | 0); if (id === 'suds') return (S.sus.rascal | 0) === 1; if (id === 'ace') return (S.sus.fifi | 0) === 1; return false; }
  updateNPCs(dt) { const me = this.me, T = this.T;
    for (const n of this.npcs) { const vis = !n.hidden && this.vis.has(n.region === 'out' ? 'out' : n.region); n.rig.root.visible = vis; n.mark.visible = false; if (!vis) continue;
      const near = Math.hypot(me.x - n.x, me.z - n.z) < 4 && Math.abs(me.y - n.y) < 3; let sp = 0; const talking = this.chat && this.chat.npc === n;
      if (n.d.walk && !talking && !near) { const p = n.d.walk[n.wp]; const dx = p[0] - n.x, dz = p[1] - n.z, d = Math.hypot(dx, dz); const v = n.id === 'lola' ? 4.5 : n.kind === 'martina' ? 0.8 : 2.4;
        if (d < 0.3) n.wp = (n.wp + 1) % n.d.walk.length; else { n.x += dx / d * v * dt; n.z += dz / d * v * dt; let t = Math.atan2(dx, dz) - n.yaw; while (t > PI) t -= PI * 2; while (t < -PI) t += PI * 2; n.yaw += t * Math.min(1, dt * 8); sp = v; }
        const g = this.world.ground(n.x, n.z, n.y + 1, 0.1).y; if (g > -50) n.y = g; }
      else if (n.d.run && !talking && !near) { const [cx, cz, r] = n.d.run, a = T * 0.9 + (n.d.phase || 0); const nx = cx + Math.cos(a) * r, nz = cz + Math.sin(a) * r * 0.6; n.yaw = Math.atan2(nx - n.x, nz - n.z); sp = Math.hypot(nx - n.x, nz - n.z) / Math.max(dt, 1e-3); n.x = nx; n.z = nz; }
      else if (near && n.d.mode !== 'sit' && n.kind !== 'kitten') { let t = Math.atan2(me.x - n.x, me.z - n.z) - n.yaw; while (t > PI) t -= PI * 2; while (t < -PI) t += PI * 2; n.yaw += t * Math.min(1, dt * 4); }
      else if (n.fetchT) { /* rex handled by fetch */ }
      if (n.override) { n.override(n, dt); sp = n.sp || 0; }
      const R = n.rig.root; R.position.set(n.x, n.y, n.z); R.rotation.y = n.yaw;
      if (this.wants(n)) { n.mark.visible = true; n.mark.position.set(n.x, n.y + n.markY + 0.35 + Math.sin(T * 3) * 0.08, n.z); n.mark.rotation.y = T * 2; }
      if (!inView(n.x, n.y + 0.6, n.z, 2)) continue; // offscreen: skip the animation work
      if (n.kind === 'dog') animPup(n.rig, dt, Math.min(sp, 8), talking || near ? (n.d.mode === 'sit' ? 'sit' : 'happy') : (n.d.mode || 'idle'));
      else if (n.kind === 'rat') { animRat(n.rig, dt, { speed: sp, air: false, vy: 0, glide: false }); if (talking) n.rig.head.rotation.z = Math.sin(T * 9) * 0.08; }
      else if (n.kind === 'martina') animMartina(n.rig, dt, sp);
      else { n.rig.t += dt; n.rig.tail.rotation.z = Math.sin(n.rig.t * 3) * 0.4; n.rig.body.position.y = n.id === 'mittens' && !S.flags.kittenDown ? Math.abs(Math.sin(n.rig.t * 7)) * 0.03 : 0; } } }
  // ------------------------------------------------ dynamic bits
  buildDyn() { const w = this.world, s = w.spots;
    // golden biscuits (instanced, spinning bone-shaped cookies)
    { const b = MB(); b.g.add(P.capsule, 0xffc928, 0, 0, 0, 0, 0, PI / 2, 0.5, 0.9, 0.5); [-1, 1].forEach((x) => [-1, 1].forEach((y) => b.g.add(P.sphere, 0xffc928, x * 0.62, y * 0.28, 0, 0, 0, 0, 0.36))); const geo = toGroup(b).children[0].geometry;
      this.biscIM = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffd23f, metalness: 0.8, roughness: 0.25, emissive: 0x7a5200, emissiveIntensity: 0.45 }), w.gears.length); this.biscIM.castShadow = true; this.biscIM.frustumCulled = false; this.add(this.biscIM); }
    this.biscGot = new Set(S.gears); this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._s = new THREE.Vector3(); this._p = new THREE.Vector3();
    // Candy's squeaky toys (pink bones)
    const bone = (c = 0xff6fb5, k = 1) => { const b = MB(); b.g.add(P.capsule, c, 0, 0, 0, 0, 0, PI / 2, 0.16 * k, 0.5 * k, 0.16 * k); [-1, 1].forEach((s2) => [-1, 1].forEach((t) => b.g.add(P.sphere, c, s2 * 0.3 * k, t * 0.08 * k, 0, 0, 0, 0, 0.13 * k))); return toGroup(b); };
    this.toys = TOYS.map((p, i) => { const m = this.add(bone()); m.position.set(p[0], p[1] + 0.35, p[2]); m.visible = !S.toys.includes(i); return { i, p, m }; });
    // THE GOLDEN BONE (shiny + sparkly; in the case once returned, carried when found)
    { const b = MB(); b.x.add(P.capsule, 0xffc83d, 0, 0, 0, 0, 0, PI / 2, 0.2, 0.75, 0.2); [-1, 1].forEach((s2) => [-1, 1].forEach((t) => b.x.add(P.sphere, 0xffc83d, s2 * 0.45, t * 0.11, 0, 0, 0, 0, 0.17))); b.g.add(P.torus, 0xff4fa0, 0, 0, 0, 0, PI / 2, 0, 0.12, 0.12, 0.3); this.bone = this.add(toGroup(b)); this.bonePos(); }
    // the sliding bookcase (secret nook)
    { const [x, y, z] = s.bookcase; const b = MB(); b.m.add(P.rbox, 0x7c4a1e, 0, 1.4, 0, 0, 0, 0, 1.8, 2.8, 0.3); for (let k = 0; k < 4; k++) { b.m.add(P.rbox, 0x9a6a42, 0, 0.35 + k * 0.68, 0.05, 0, 0, 0, 1.7, 0.05, 0.25); for (let i = 0; i < 9; i++) b.m.add(P.rbox, i === 4 && k === 2 ? 0xdc2626 : [0x2563eb, 0x16a34a, 0xf59e0b, 0x7c3aed, 0x0ea5e9][(i + k) % 5], -0.72 + i * 0.18, 0.62 + k * 0.68, 0.08, i === 4 && k === 2 ? -0.25 : 0, 0, 0, 0.14, 0.5, 0.2); }
      this.bookcase = this.add(toGroup(b)); this.bookcase.position.set(x, y, z); this.bookS = w.solid(x - 0.9, y, z - 0.2, x + 0.9, y + 2.8, z + 0.2, { dyn: true }); this.bookK = S.flags.book ? 1 : 0; }
    // sunflowers in the community beds
    this.flowers = w.plants.map((p, i) => { const b = MB(); b.g.add(P.cyl, 0x2e9e45, 0, 0.9, 0, 0, 0, 0, 0.05, 1.8, 0.05); [-1, 1].forEach((s2) => b.g.add(P.sphere, 0x3fae5a, s2 * 0.18, 0.8, 0, 0, 0, s2 * 0.5, 0.2, 0.06, 0.1)); for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; b.g.add(P.sphere, 0xffc928, Math.cos(a) * 0.3, 1.85 + Math.sin(a) * 0.3, 0.05, 0, 0, a, 0.16, 0.07, 0.03); }
      b.m.add(P.sphere, 0x7c4a1e, 0, 1.85, 0.08, 0, 0, 0, 0.18, 0.18, 0.08); const g = toGroup(b); g.position.set(p[0], p[1], p[2]); g.scale.setScalar(S.plants.includes(i) ? 1 : 0.001); this.add(g); return g; });
    // the Dog-Bus
    this.bus = makeDogBus(); this.bus.root.scale.setScalar(0.85); this.add(this.bus.root); this.busS = w.solid(0, -10, 0, 1, -9, 1, { dyn: true });
    // golden founder statue on the fountain (Sir Woofington, a great dane, in polished gold)
    { const r = makePup('greatdane', { collar: false, hat: 'crown', seed: 3 }); const gold = new THREE.MeshStandardMaterial({ color: 0xffc83d, metalness: 0.95, roughness: 0.22 }); r.root.traverse((o) => { if (o.isMesh) o.material = gold; }); animPup(r, 0.01, 0, 'sit');
      r.root.position.set(...s.statue); r.root.rotation.y = PI; r.root.scale.setScalar(1.25); this.add(r.root); this.statue = r.root; }
    // songbirds (one instanced flock: wings "flap" by squashing the span)
    { const N = 26; this.birds = new THREE.InstancedMesh(birdGeo(), new THREE.MeshStandardMaterial({ roughness: 0.6 }), N); this.birds.frustumCulled = false; const c = new THREE.Color(); this.birdD = [];
      for (let i = 0; i < N; i++) { this.birds.setColorAt(i, c.set([0x60a5fa, 0xfacc15, 0xf87171, 0xffffff, 0xa78bfa][i % 5])); this.birdD.push({ cx: (i % 3 - 1) * 26 + (i * 7 % 9), cz: ((i / 3 | 0) % 3 - 1) * 26 + 10, r: 5 + (i % 4) * 2.5, y: 9 + (i % 5) * 1.6, sp: 0.35 + (i % 3) * 0.12, ph: i * 1.7 }); } this.add(this.birds); }
    // ducks on the pond
    { const [cx, cz] = s.pond; this.ducks = []; for (let i = 0; i < 5; i++) { const b = MB(), c = i === 0 ? 0xffffff : 0xffd23f, k = i === 0 ? 1.0 : 0.55; b.g.add(P.sphere, c, 0, 0.18 * k, 0, 0, 0, 0, 0.3 * k, 0.22 * k, 0.4 * k); b.g.add(P.sphere, i === 0 ? 0x16a34a : c, 0, 0.42 * k, 0.28 * k, 0, 0, 0, 0.18 * k); b.g.add(P.cone, 0xff8a3d, 0, 0.4 * k, 0.48 * k, PI / 2, 0, 0, 0.07 * k, 0.15 * k, 0.04 * k);
        [-1, 1].forEach((s2) => b.g.add(P.sphere, 0x111111, s2 * 0.08 * k, 0.48 * k, 0.4 * k, 0, 0, 0, 0.03 * k)); const g = this.add(toGroup(b)); this.ducks.push({ g, i }); } }
    // party decorations (after the mystery): giant birthday cake, balloon arch, banner, presents
    { const g = new THREE.Group(), b = MB(); const x = 0, z = -12.6; for (let i = 0; i < 3; i++) b.g.add(rcyl(1.4 - i * 0.38, 0.7, 0.12, 40), [0xffffff, 0xff8fc8, 0xfef3c7][i], x, i * 0.7, z); for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; b.g.add(P.sphere, [0xff4fa0, 0x60a5fa, 0xffd23f][i % 3], x + Math.cos(a) * 1.4, 0.68, z + Math.sin(a) * 1.4, 0, 0, 0, 0.12); }
      for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; b.g.add(rcyl(0.04, 0.45, 0.01, 10), 0xffffff, x + Math.cos(a) * 0.3, 2.1, z + Math.sin(a) * 0.3); b.l.add(P.sphere, 0xffb020, x + Math.cos(a) * 0.3, 2.62, z + Math.sin(a) * 0.3, 0, 0, 0, 0.05, 0.09, 0.05, 1.2); } b.g.add(heart(), 0xff4fa0, x, 2.3, z, 0, 0, 0, 0.18, 0.18, 0.08);
      for (let i = 0; i <= 20; i++) { const a = i / 20 * PI; b.g.add(P.sphere, [0xff4fa0, 0xffd23f, 0x60a5fa, 0x3ddc84, 0xa66bff][i % 5], -5 * Math.cos(a), Math.sin(a) * 5, -15.2, 0, 0, 0, 0.42, 0.48, 0.42); }
      [[-3, -13.4, 0xff4fa0], [3, -13.2, 0x60a5fa], [2.4, -11.8, 0x3ddc84], [-2.6, -11.6, 0xffd23f]].forEach(([px, pz, c]) => { b.g.add(P.rbox, c, px, 0.35, pz, 0, 0.5, 0, 0.7, 0.7, 0.7); b.g.add(P.rbox, 0xffffff, px, 0.35, pz, 0, 0.5, 0, 0.72, 0.72, 0.14); b.g.add(P.rbox, 0xffffff, px, 0.35, pz, 0, 0.5 + PI / 2, 0, 0.72, 0.72, 0.14); });
      g.add(toGroup(b)); this.party = this.add(g); this.party.visible = (S.q.bone | 0) >= 4; }
    this.ballM = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 12), new THREE.MeshStandardMaterial({ color: 0xc6f432, roughness: 0.7 }));
    // agility marker ring
    this.agRing = this.add(new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.09, 12, 40), new THREE.MeshBasicMaterial({ color: 0x3ff0ff, toneMapped: false }))); this.agRing.visible = false;
  }
  bonePos() { const q = S.q.bone | 0, b = this.bone; b.userData.carry = q === 3; if (q >= 4) { b.visible = true; b.position.set(...this.world.spots.bonePed); b.scale.setScalar(0.9); } else if (q === 3) { b.visible = true; b.scale.setScalar(0.7); } else b.visible = false; }
  // ------------------------------------------------ region culling: interiors only draw when you're inside or near their door
  setVis(r, force) { this._vt -= 1; if (r === this.region && !force && this._vt > 0) return; this._vt = 15; const me = this.me; const v = new Set(['shell', 'out', r]);
    for (const k in DOORS) { const [dx, dz] = DOORS[k]; if (Math.hypot(me.x - dx, me.z - dz) < 15) v.add(k); }
    const key = [...v].sort().join(','); if (key === this._vk && r === this.region) return; this._vk = key; this.region = r; this.vis = v;
    for (const k in this.world.regionMeshes) { const on = v.has(k); for (const m of this.world.regionMeshes[k]) m.visible = on; }
    this.bookcase.visible = v.has('library'); }
  areaLabel() { const r = REGIONS.find((q) => q.id === this.region); return r ? r.name : areaName(this.me.x, this.me.z); }
  // ------------------------------------------------ frame
  update(dt) { this.T += dt; const w = this.world, me = this.me;
    const mv = this.app.paused || this.chat ? { x: 0, y: 0 } : readMove();
    const free = !this.app.paused && !this.chat && !this.app.busy;
    const inp = free ? { mx: mv.x, my: mv.y, jumpP: edge('jump'), jumpH: held('jump'), spinP: edge('spin'), blastP: edge('blast'), hookP: false, actP: edge('act') } : { mx: 0, my: 0 };
    this.updateBus(dt); me.update(dt, inp, this); me.updateBlob(w); this.pond(me);
    this.setVis(regionAt(me.x, me.y + 0.3, me.z)); this.hud.region(this.areaLabel());
    for (const p of this.players.values()) if (!p.local) { p.remoteUpdate(dt); p.updateBlob(w); }
    updateFrustum(E.camera);
    this.updateNPCs(dt); this.anim(dt); this.updateBalls(dt); this.updateFetch(dt); this.updateAgility(dt); this.updateBook(dt); this.collect(); this.secretsCheck();
    this.updateAct(); if (inp.actP && this.act) this.doAct(this.act);
    this.net.tick && this.net.tick(dt, this);
    this.updateCam(dt); this.render(dt); this.hud.update(dt, this); this.lightPool.update(dt, me.x, me.y + 2, me.z); }
  render(dt) { this.fx.update(dt); followShadow(this.me.x, this.me.y, this.me.z); this.light(dt); }
  pond(me) { const [cx, cz] = this.world.spots.pond; const dx = (me.x - cx) / 6.3, dz = (me.z - cz) / 4.2; if (dx * dx + dz * dz < 1 && me.y < 0.05 && me.onGround) { if (!this._wet) { this._wet = true; sfx('splat'); this.fx.burst(me.x, 0.1, me.z, 0x7dd3fc, 18, 5); this.toastMsg('🦆 Splash! The ducks escort you back to shore.'); const a = Math.atan2(dz, dx); me.place([cx + Math.cos(a) * 7.4, 0.1, cz + Math.sin(a) * 5.2], me.yaw); } } else this._wet = false; }
  // day <-> golden evening cycle (host time, so co-op players share the sky). Pure tone, no quality change.
  dayK() { const o = (this.net.online && this.hostTod) || S.opts.tod || 'auto'; if (o === 'day') return 0; if (o === 'evening') return 1; const p = (this.T / DAY) % 1; return p < 0.45 ? 0 : p < 0.55 ? (p - 0.45) / 0.1 : p < 0.9 ? 1 : 1 - (p - 0.9) / 0.1; }
  light(dt) { const k0 = this.dayK(); this.ev = this.ev == null ? k0 : this.ev + (k0 - this.ev) * Math.min(1, dt * 2); const ev = this.ev, inside = this.region !== 'out';
    const L = inside ? [0.95, 0.42, 0.55, 1.25, 0.26] : [1.0 - ev * 0.08, 0.6 - ev * 0.12, 0.85 - ev * 0.3, 1.0 - ev * 0.12, 0.38 + ev * 0.14];
    const k = Math.min(1, dt * 4), R = E.renderer; R.toneMappingExposure += (L[0] - R.toneMappingExposure) * k; E.hemi.intensity += (L[1] - E.hemi.intensity) * k; this.scene.environmentIntensity += (L[2] - this.scene.environmentIntensity) * k;
    if (E.bloom) { E.bloom.threshold += (L[3] - E.bloom.threshold) * k; E.bloom.strength += (L[4] - E.bloom.strength) * k; }
    const c = this._c || (this._c = { a: new THREE.Color(), b: new THREE.Color() }); E.sun.color.copy(c.a.set(0xfff1d6).lerp(c.b.set(0xffa463), ev)); E.sun.intensity = 2.6 - ev * 0.9; E.hemi.color.copy(c.a.set(0xd6ecff).lerp(c.b.set(0xffc2a8), ev));
    const u = skyUniforms(); if (u) { u.top.value.copy(c.a.set(0x3b9cff).lerp(c.b.set(0x5b4bb7), ev)); u.mid.value.copy(c.a.set(0xa8dcff).lerp(c.b.set(0xff9f7a), ev)); u.bot.value.copy(c.a.set(0xe8f7ff).lerp(c.b.set(0xffd6a0), ev)); u.sunCol.value.copy(E.sun.color); }
    if (this.scene.fog) { this.scene.fog.color.copy(c.a.set(0xcfe9ff).lerp(c.b.set(0xffc9a8), ev)); this.scene.fog.density = inside ? 0.001 : 0.004; }
    for (const s of this.world.lights) if (s.out) { if (s.i0 == null) s.i0 = s.i; s.i = s.i0 * (0.15 + ev * 1.4); } }
  anim(dt) { const T = this.T, w = this.world, me = this.me;
    const G = w.gears; for (let i = 0; i < G.length; i++) { const p = G[i]; const got = this.biscGot.has(i); this._q.setFromEuler(this._e.set(0, T * 2 + i, 0)); this._p.set(p[0], p[1] + Math.sin(T * 2 + i) * 0.08, p[2]); this._s.setScalar(got ? 0 : 0.28); this._m.compose(this._p, this._q, this._s); this.biscIM.setMatrixAt(i, this._m); }
    this.biscIM.instanceMatrix.needsUpdate = true;
    this.toys.forEach((t) => { if (t.m.visible) { t.m.rotation.y = T * 2; t.m.position.y = t.p[1] + 0.35 + Math.sin(T * 3) * 0.08; } });
    if (this.bone.userData.carry) { this.bone.position.set(me.x, me.y + me.hgt + 0.35 + Math.sin(T * 4) * 0.05, me.z); this.bone.rotation.y = T * 1.5; if (Math.random() < dt * 6) this.fx.sparkle(me.x, me.y + me.hgt + 0.4, me.z, 0xffd23f); } else if (this.bone.visible) this.bone.rotation.y = T * 0.6;
    this.flowers.forEach((g, i) => { const want = S.plants.includes(i) ? 1 : 0.001; g.scale.setScalar(g.scale.x + (want - g.scale.x) * Math.min(1, dt * 3)); if (want === 1) g.rotation.z = Math.sin(T * 1.3 + i) * 0.05; });
    // birds
    if (this.region === 'out') { this.birds.visible = true; for (let i = 0; i < this.birdD.length; i++) { const b = this.birdD[i], a = T * b.sp + b.ph; this._p.set(b.cx + Math.cos(a) * b.r, b.y + Math.sin(T * 0.7 + i) * 0.6, b.cz + Math.sin(a) * b.r); this._q.setFromEuler(this._e.set(0, -a, Math.sin(a) * 0.15));
        const f = 0.55 + Math.abs(Math.sin(T * 12 + i)) * 0.7; this._s.set(f * 1.4, 1.4, 1.4); this._m.compose(this._p, this._q, this._s); this.birds.setMatrixAt(i, this._m); } this.birds.instanceMatrix.needsUpdate = true; } else this.birds.visible = false;
    { const [cx, cz] = w.spots.pond; this.ducks.forEach((d) => { const a = T * 0.25 + d.i * 0.35 + (d.i ? 0.3 : 0), rr = d.i ? 2.6 : 2.9; d.g.position.set(cx + Math.cos(a) * rr * 1.5, -0.06 + Math.sin(T * 3 + d.i) * 0.02, cz + Math.sin(a) * rr); d.g.rotation.y = -a; d.g.visible = this.region === 'out'; }); }
    if (this.region === 'out' && Math.random() < dt * 8) { const a = Math.random() * PI * 2; this.fx.emit(Math.cos(a) * 0.6, 4.2, Math.sin(a) * 0.6, Math.cos(a) * 1.8, 2.5, Math.sin(a) * 1.8, 0.09, 0xbfe9ff, 1.0, 9, 0.5); }
    if (this.party.visible && this.region === 'out' && Math.random() < dt * 3) this.fx.confetti((Math.random() - 0.5) * 10, 5, -12 + (Math.random() - 0.5) * 6, 6);
    const cl = w.spots.clocks; if (cl && !this._clockHands) { this._clockHands = cl.map(([x, y, z, ry]) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; const b = MB(); b.g.add(P.rbox, 0x1f2937, 0, 0.45, 0.06, 0, 0, 0, 0.08, 0.9, 0.04); const h = toGroup(b); const b2 = MB(); b2.g.add(P.rbox, 0x1f2937, 0, 0.3, 0.08, 0, 0, 0, 0.1, 0.6, 0.04); const m = toGroup(b2); g.add(h, m); this.add(g); return { h, m }; }); }
    if (this._clockHands) this._clockHands.forEach((c) => { c.h.rotation.z = -T * 0.5; c.m.rotation.z = -T * 0.04; }); }
  // ------------------------------------------------ Dog-Bus
  updateBus(dt) { const st = busState(this.T); this.busSt = st; const [x, z, yaw] = busAt(st.s); const B = this.bus; B.root.position.set(x, 0.0, z); B.root.rotation.y = yaw; B.t += dt;
    B.tail.rotation.y = Math.sin(B.t * (st.stop >= 0 ? 10 : 5)) * 0.5; B.ears.forEach((e, i) => e.rotation.x = Math.sin(B.t * 8 + i) * 0.15 * (st.stop >= 0 ? 0.3 : 1)); B.body.position.y = st.stop >= 0 ? 0 : Math.abs(Math.sin(B.t * 6)) * 0.06; B.body.rotation.z = st.stop >= 0 ? 0 : Math.sin(B.t * 3) * 0.02;
    const s = this.busS, hx = Math.abs(Math.sin(yaw)) * 5.4 + Math.abs(Math.cos(yaw)) * 1.0, hz = Math.abs(Math.cos(yaw)) * 5.4 + Math.abs(Math.sin(yaw)) * 1.0; const px = (s.min[0] + s.max[0]) / 2, pz = (s.min[2] + s.max[2]) / 2;
    s.dx = x - px; s.dz = z - pz; s.dy = 0; s.min = [x - hx, 0, z - hz]; s.max = [x + hx, 3.2, z + hz];
    const me = this.me; if (me.x > s.min[0] - 0.3 && me.x < s.max[0] + 0.3 && me.z > s.min[2] - 0.3 && me.z < s.max[2] + 0.3 && me.y < 3.0) { const dxp = me.x - x, dzp = me.z - z; const side = Math.abs(dxp) / hx > Math.abs(dzp) / hz; if (side) me.x = x + Math.sign(dxp || 1) * (hx + 0.35); else me.z = z + Math.sign(dzp || 1) * (hz + 0.35); if (!this._beep || this.T - this._beep > 2.5) { this._beep = this.T; sfx('honk'); this.toastMsg('🚌 Beep beep! (The Dog-Bus gives you a friendly nudge.)'); } } }
  // ------------------------------------------------ throwing balls (BLAST button = 🎾 THROW). Nearby dogs chase them!
  fireBlast(p) { if (this.fetch && this.fetch.phase !== 'aim') return; const m = this.ballM.clone(); const pw = this.fetch ? 4 + this.fetch.pow * 12 : 7; const a = p.yaw; m.position.set(p.x + Math.sin(a) * 0.5, p.y + 1.4, p.z + Math.cos(a) * 0.5); this.scene.add(m);
    const t = 0.55 + pw * 0.06; const vy = 4.5 + pw * 0.25; const ball = { m, vx: Math.sin(a) * pw / (t * 1.2), vz: Math.cos(a) * pw / (t * 1.2), vy, t: 0, land: false, fetch: !!this.fetch, x0: p.x, z0: p.z };
    this.balls.push(ball); sfx('jump'); if (this.fetch) { this.fetch.phase = 'fly'; this.fetch.ball = ball; } else this.chaseBall(ball); }
  chaseBall(ball) { let best = null, bd = 14; for (const n of this.npcs) { if (n.kind !== 'dog' || n.hidden || n.d.walk || n.override || n.region !== 'out' || n.id === 'rex' && this.fetch) continue; const d = Math.hypot(n.x - ball.m.position.x, n.z - ball.m.position.z); if (d < bd) { bd = d; best = n; } }
    if (best) this.dogFetch(best, ball, () => { this.toastMsg(`🐶 ${best.d.n.split(' (')[0]} brought your ball back!`); }); }
  dogFetch(n, ball, done) { const me = this.me; n.state = 'chase'; n.override = (n, dt) => { const v = 6.5; let tx, tz; if (n.state === 'chase') { if (!ball.land) { n.sp = 0; return; } tx = ball.m.position.x; tz = ball.m.position.z; } else if (n.state === 'back') { tx = me.x + Math.sin(me.yaw) * 1.2; tz = me.z + Math.cos(me.yaw) * 1.2; } else { tx = n.x0; tz = n.z0; }
      const dx = tx - n.x, dz = tz - n.z, d = Math.hypot(dx, dz); n.sp = v; if (d > 0.4) { n.x += dx / d * v * dt; n.z += dz / d * v * dt; n.yaw = Math.atan2(dx, dz); } const g = this.world.ground(n.x, n.z, n.y + 1, 0.1).y; if (g > -50) n.y = g;
      if (n.state === 'chase' && d < 0.6) { n.state = 'back'; ball.held = n; sfx('squeak'); } else if (n.state === 'back') { if (ball.held === n) ball.m.position.set(n.x + Math.sin(n.yaw) * 0.45 * n.rig.root.scale.x, n.y + 0.75 * n.rig.root.scale.x, n.z + Math.cos(n.yaw) * 0.45 * n.rig.root.scale.x); if (d < 0.8) { n.state = 'home'; this.dropBall(ball); done && done(); } }
      else if (n.state === 'home' && d < 0.4) { n.override = null; n.sp = 0; n.x = n.x0; n.z = n.z0; n.yaw = n.yaw0; } }; }
  dropBall(ball) { this.scene.remove(ball.m); const i = this.balls.indexOf(ball); if (i >= 0) this.balls.splice(i, 1); }
  updateBalls(dt) { for (const b of [...this.balls]) { if (b.held) continue; b.t += dt; if (!b.land) { b.vy -= 18 * dt; b.m.position.x += b.vx * dt; b.m.position.y += b.vy * dt; b.m.position.z += b.vz * dt; const g = this.world.ground(b.m.position.x, b.m.position.z, b.m.position.y + 0.2, 0.05).y;
        if (b.m.position.y < g + 0.13 && b.vy < 0) { b.m.position.y = g + 0.13; if (Math.abs(b.vy) > 3) { b.vy = -b.vy * 0.35; b.vx *= 0.6; b.vz *= 0.6; sfx('bounce'); } else { b.land = true; b.vy = 0; } } }
      if (b.t > 14 && !b.held) this.dropBall(b); } }
  // ------------------------------------------------ FETCH with Rex: 5 throws, power meter, score by distance ring
  startFetch() { if (this.fetch) return; const s = this.world.spots.fetch; this.me.place([s.tee[0], 0.1, s.tee[2]], 0); this.cam.yaw = 0; this.cam.snap = true; const rex = this.npc.rex; rex.x = s.tee[0] + 1.4; rex.z = s.tee[2] + 0.6; rex.yaw = 0;
    this.fetch = { n: 0, score: 0, phase: 'aim', pow: 0, pt: 0, last: '' }; this.toastMsg('🎾 Tap 🎾 THROW when the power bar is high! 5 throws.'); sfx('check'); this.hud.throwMode(true); }
  updateFetch(dt) { const F = this.fetch; if (!F) return; const me = this.me, s = this.world.spots.fetch, rex = this.npc.rex;
    if (Math.hypot(me.x - s.tee[0], me.z - s.tee[2]) > 3 && F.phase === 'aim') { this.endFetch(true); return; }
    if (F.phase === 'aim') { F.pt += dt; F.pow = 0.5 - Math.cos(F.pt * 2.6) * 0.5; const n = Math.round(F.pow * 10); this.hud.timer(`🎾 ${F.n + 1}/5 · ${'▮'.repeat(n)}${'▯'.repeat(10 - n)} · ${F.score} pts`); }
    else if (F.phase === 'fly') { this.hud.timer(`🎾 ${F.n + 1}/5 · ${F.score} pts`); const b = F.ball; if (b.land) { const dx = b.m.position.x - s.tee[0], dz = b.m.position.z - s.tee[2], d = Math.hypot(dx, dz), ang = Math.atan2(dx, dz); const inArc = Math.abs(ang) < 0.8 && dz > 0;
        const pts = !inArc ? 0 : d >= 13 ? 30 : d >= 9 ? 20 : d >= 5 ? 10 : 5; F.score += pts; F.n++; this.toastMsg(pts ? `🎾 ${d.toFixed(1)} m · +${pts}!` : '🎾 Out of the field! +0'); sfx(pts >= 20 ? 'win' : pts ? 'check' : 'deny'); if (pts >= 20) this.fx.burst(b.m.position.x, 0.4, b.m.position.z, 0xffd23f, 16, 5);
        F.phase = 'rex'; this.dogFetch(rex, b, () => { if (!this.fetch) return; if (F.n >= 5) this.endFetch(); else { F.phase = 'aim'; F.pt = 0; } }); } }
    else if (F.phase === 'rex') this.hud.timer(`🐕 Rex is fetching… · ${F.score} pts`); }
  endFetch(quit) { const F = this.fetch; if (!F) return; this.fetch = null; this.hud.timer(''); this.hud.throwMode(false); const rex = this.npc.rex; if (rex.override && quit) { rex.override = null; rex.x = rex.x0; rex.z = rex.z0; } for (const b of [...this.balls]) if (b.fetch) this.dropBall(b);
    if (quit) { this.toastMsg('🎾 Fetch cancelled'); return; } const best = Math.max(S.best.fetch | 0, F.score); const nb = F.score > (S.best.fetch | 0); S.best.fetch = best; persist();
    this.toastMsg(`🎾 Fetch over: ${F.score} points${nb ? ' · NEW BEST!' : ''}`); this.fx.confetti(this.me.x, this.me.y + 1.5, this.me.z, F.score >= 60 ? 60 : 15); sfx('win');
    if (F.score >= 60 && !S.flags.fetch) { S.flags.fetch = 1; persist(); this.giveHat('visor'); this.badge('fetch'); this.toastMsg('🐕 Rex: "BEST THROWER EVER! Take my lucky visor!"'); } }
  // ------------------------------------------------ AGILITY: run the gates in order, beat Coach Dash's ghost
  startAgility() { if (this.agil) return; const A = this.world.spots.agility; this.me.place([A.start[0], 0.1, A.start[2] - 1.2], 0); this.cam.yaw = 0; this.cam.snap = true; this.agil = { t: -3, i: 0, last: 4 }; this.agRing.visible = true; sfx('check'); this.toastMsg('🏁 Ready… follow the glowing rings!'); }
  updateAgility(dt) { const A = this.agil; if (!A) return; const G = this.world.spots.agility.gates, me = this.me; A.t += dt;
    if (A.t < 0) { const c = Math.ceil(-A.t); if (c !== A.last) { A.last = c; this.toastMsg(c + '…'); sfx('click'); } this.hud.timer('🏁 ' + c); me.x = this.world.spots.agility.start[0]; me.z = this.world.spots.agility.start[2] - 1.2; return; }
    if (A.last > 0) { A.last = 0; this.toastMsg('🏁 GO GO GO!'); sfx('win'); }
    const target = A.i < G.length ? G[A.i] : [this.world.spots.agility.start[0], 1.2, 30.5, 0, 'finish']; const [gx, gy, gz, gry, kind] = target; this.agRing.position.set(gx, (kind === 'hurdle' ? 1.2 : kind === 'tire' ? 1.25 : kind === 'aframe' ? gy + 0.9 : 1.2), gz); this.agRing.rotation.set(0, gry, 0); this.agRing.scale.setScalar(kind === 'tire' ? 0.55 : 1 + Math.sin(this.T * 6) * 0.05);
    const d = Math.hypot(me.x - gx, me.z - gz); let pass = d < (kind === 'weave' ? 1.2 : kind === 'tire' ? 0.9 : 1.5); if (kind === 'tire') pass = pass && me.y > 0.35; if (kind === 'hurdle') pass = pass && (me.y > 0.25 || Math.abs(me.z - gz) < 0.4); if (kind === 'aframe') pass = pass && me.y > 1.0;
    if (pass) { A.i++; sfx(A.i > G.length ? 'win' : 'part'); this.fx.burst(gx, me.y + 1, gz, 0x3ff0ff, 10, 4); if (A.i > G.length) return this.endAgility(); }
    this.hud.timer(`🏁 ${A.t.toFixed(1)} s · ${Math.min(A.i, G.length)}/${G.length}`); if (A.t > 90) { this.toastMsg('🏁 Time\'s up! Talk to Coach Dash to try again.'); this.endAgility(true); } }
  endAgility(fail) { const A = this.agil; this.agil = null; this.agRing.visible = false; this.hud.timer(''); if (fail || !A) return; const t = A.t; const nb = !S.best.agility || t < S.best.agility; if (nb) S.best.agility = t; persist();
    this.fx.confetti(this.me.x, this.me.y + 1.5, this.me.z, 60); this.toastMsg(`🏁 Finished in ${t.toFixed(1)} s${t < 28 ? ' · 🥇 GOLD!' : t < 34 ? ' · 🥈 SILVER!' : t < 40 ? ' · 🥉 BRONZE!' : ''}${nb ? ' · NEW BEST' : ''}`);
    if (t < 40 && !S.flags.agility) { S.flags.agility = 1; persist(); this.badge('agility'); } }
  // ------------------------------------------------ bookcase (secret nook)
  updateBook(dt) { const want = S.flags.book ? 1 : 0; this.bookK += (want - this.bookK) * Math.min(1, dt * 3); const [x, y, z] = this.world.spots.bookcase; const nx = x + this.bookK * 1.75; this.bookcase.position.x = nx; const s = this.bookS; s.dx = nx - (s.min[0] + 0.9); s.min = [nx - 0.9, y, z - 0.2]; s.max = [nx + 0.9, y + 2.8, z + 0.2]; s.dz = s.dy = 0; }
  // ------------------------------------------------ collecting
  collect() { const me = this.me, G = this.world.gears;
    for (let i = 0; i < G.length; i++) { if (this.biscGot.has(i)) continue; const p = G[i]; if (Math.abs(me.x - p[0]) < 0.8 && Math.abs(me.z - p[2]) < 0.8 && me.y + me.hgt + 0.25 > p[1] && me.y < p[1] + 0.6) { this.biscGot.add(i); S.gears = [...this.biscGot]; persist(); sfx('part'); this.fx.sparkle(p[0], p[1], p[2], 0xffd23f); this.fx.burst(p[0], p[1], p[2], 0xffd23f, 10, 4);
        const n = this.biscGot.size; this.toastMsg(`🍪 Golden biscuit ${n}/${G.length}`); if (n >= 12) this.giveHat('party'); if (n >= G.length) { this.badge('bisc'); this.checkCrown(); } this.hud.dirty = true; } }
    this.toys.forEach((t) => { if (!t.m.visible) return; if (Math.hypot(me.x - t.p[0], me.z - t.p[2]) < 0.9 && Math.abs(me.y - t.p[1]) < 1.6) { t.m.visible = false; S.toys.push(t.i); persist(); sfx('squeak'); this.fx.burst(t.p[0], t.p[1] + 0.4, t.p[2], 0xff6fb5, 12); this.toastMsg(`🦴 *SQUEAK!* Candy's toy ${S.toys.length}/3`); this.hud.dirty = true; } }); }
  secretsCheck() { const me = this.me; for (const s of this.world.secrets) { if (S.secrets.includes(s.id)) continue; if (Math.hypot(me.x - s.x, me.z - s.z) < s.r && Math.abs(me.y - s.y) < 2.5) { S.secrets.push(s.id); persist(); sfx('win'); this.fx.confetti(me.x, me.y + 1.5, me.z, 40); this.toastMsg(s.msg + ` (${S.secrets.length}/${this.world.secrets.length})`); if (S.secrets.length >= 5) { this.giveHat('wizard'); this.badge('secrets'); } } } }
  // ------------------------------------------------ rewards + story
  giveHat(id) { if (S.hats[id]) return; S.hats[id] = 1; persist(); const h = HATS.find((q) => q.id === id); this.toastMsg(`🎩 New hat: ${h ? h.n : id}! (Style Station at Fluff & Puff, or the pause menu)`); sfx('win'); }
  badge(id) { if (S.badges[id]) return; S.badges[id] = 1; persist(); this.toastMsg('🏅 Badge: ' + BADGES[id]); }
  checkCrown() { if (S.hats.crown) return; if ((S.q.bone | 0) >= 4 && this.biscGot.size >= this.world.gears.length) { S.hats.crown = 1; persist(); setTimeout(() => { this.toastMsg('👑 GOLD CROWN! Pup Town\'s greatest hero!'); sfx('win'); }, 1500); } }
  addClue(id) { const nw = !S.clues[id]; S.clues[id] = 1; persist(); this.app.ui.clue(id, clueText(id), nw); if ((S.q.bone | 0) === 0 && nw) setTimeout(() => this.toastMsg('🤔 Hmm… Mayor Biscuit at Town Hall might know what this is about.'), 600); this.recheck(); }
  recheck() { if ((S.q.bone | 0) === 1 && BONE_CLUES.every((c) => S.clues[c])) { S.q.bone = 2; persist(); this.placeStory(); setTimeout(() => this.toastMsg('💡 All 5 clues! Tiny paws, the letter N, a party hat… Candy\'s backyard on Maple Lane!'), 500); } this.hud.dirty = true; }
  gotBone() { S.q.bone = 3; persist(); this.bonePos(); this.fx.confetti(this.me.x, this.me.y + 1.5, this.me.z, 50); sfx('win'); this.toastMsg('🦴 You have the GOLDEN BONE! Bring it back to Mayor Biscuit.'); this.hud.dirty = true; }
  solveBone() { S.q.bone = 4; persist(); this.bonePos(); this.placeStory(); this.party.visible = true; this.giveHat('detective'); this.badge('bone'); this.fx.confetti(this.me.x, this.me.y + 1.5, this.me.z, 120); this.app.ui.finale(); this.checkCrown(); this.hud.dirty = true; }
  rescueKitten() { S.flags.kittenDown = 1; persist(); this.app.ui.fade(() => { const k = this.world.spots.kittenDown; this.me.place([k[0] - 1.2, 0.1, k[2] - 1], 0); this.cam.snap = true; this.placeStory(); }); setTimeout(() => { this.toastMsg('🐱 Mittens is safe on the ground! Tell Chief Sparky at the fire station.'); sfx('win'); }, 700); }
  // ------------------------------------------------ interaction prompt
  updateAct() { const me = this.me; let best = null, bd = 1e9;
    for (const o of this.world.inter) { const d = Math.hypot(me.x - o.x, me.z - o.z); if (d < o.r && Math.abs(me.y - o.y) < 2 && d < bd) { bd = d; best = o; } }
    if (best && best.kind === 'bus') { const st = this.busSt, idx = this.stopMap[best.stop]; best = Object.assign({}, best, { label: st.stop === idx ? '🚌 Hop on the Dog-Bus!' : `🚌 Dog-Bus in ${Math.ceil(st.stop >= 0 ? st.wait + ((STOPS[1] - STOPS[0]) / BUS_V) : st.next === idx ? st.eta : st.eta + STOP_T + Math.abs(STOPS[1] - STOPS[0]) / BUS_V)} s` }); }
    if (best && best.kind === 'book' && S.flags.book) best = Object.assign({}, best, { label: '📕 Push the red book back' });
    if (best && best.kind === 'plant' && S.plants.includes(best.i)) best = null;
    if (this.fetch || this.agil) best = best && (best.id === 'fetch' || best.id === 'agility') ? Object.assign({}, best, { label: '✖ Stop' }) : null;
    for (const n of this.npcs) { if (!n.rig.root.visible || n.override) continue; const r = n.kind === 'martina' ? 2.8 : n.d.look.b === 'greatdane' ? 2.8 : n.kind === 'kitten' ? 2.2 : 2.3; const d = Math.hypot(me.x - n.x, me.z - n.z); if (d < r && Math.abs(me.y - n.y) < 2 && d - 0.2 < bd) { bd = d; best = { kind: 'npc', npc: n, label: '💬 Talk to ' + n.d.n.split(' (')[0] }; } }
    this.act = best; this.hud.setAct(this.chat ? null : best); }
  doAct(o) { const ui = this.app.ui; sfx('click');
    if (o.kind === 'npc') { const r = talk(o.npc.id, this); this.chat = { npc: o.npc }; ui.dialog(o.npc.d.n, r.lines, () => { this.chat = null; if (r.fx) r.fx(); this.recheck(); }); }
    else if (o.kind === 'clue') this.addClue(o.id.replace('clue_', ''));
    else if (o.kind === 'map') ui.map(this);
    else if (o.kind === 'wardrobe') ui.wardrobe();
    else if (o.kind === 'bus') { if (this.busSt.stop !== this.stopMap[o.stop]) { this.toastMsg('🚌 Not here yet! Watch for the wiggly yellow bus.'); return; } const to = this.world.spots.stops[1 - o.stop]; sfx('honk'); ui.fade(() => { this.me.place([to[0], 0.1, to[1] + (o.stop ? 1.6 : -1.6)], o.stop ? 0 : PI); this.cam.snap = true; this.cam.yaw = this.me.yaw; }); if (!S.flags.bus) { S.flags.bus = 1; persist(); this.badge('bus'); } this.toastMsg('🚌 Wheee! Next stop: ' + (o.stop ? 'Paw Park!' : 'Town Hall!')); }
    else if (o.kind === 'book') { S.flags.book = S.flags.book ? 0 : 1; persist(); sfx('door'); if (S.flags.book) this.toastMsg('📕 *click* The bookcase slides open!'); }
    else if (o.kind === 'plant') { if (S.plants.includes(o.i)) return; S.plants.push(o.i); persist(); sfx('part'); this.fx.burst(o.x, 1, o.z + 1, 0xffc928, 14, 4); this.toastMsg(`🌻 Sunflower planted! (${S.plants.length}/4)` + (S.plants.length >= 4 ? ' Tell Martina!' : '')); }
    else if (o.kind === 'mg') { if (o.id === 'fetch') { if (this.fetch) this.endFetch(true); else this.startFetch(); } else if (o.id === 'agility') { if (this.agil) { this.endAgility(true); this.toastMsg('🏁 Run cancelled'); } else this.startAgility(); } else ui.minigame(o.id, this); }
    else if (o.kind === 'fun') { this._fun = ((this._fun | 0) + 1) % o.msgs.length; this.toastMsg(o.msgs[this._fun]); sfx(o.sfx || 'squeak'); } }
  onSpin(p) { if (Math.random() < 0.5) this.fx.burst(p.x, p.y + 1, p.z, 0xff6fcf, 8, 3); }
  hookTarget() { return null; }
  // ------------------------------------------------ camera (pulled back; never clips through walls; indoor rooms clamp the lens inside)
  updateCam(dt) { const c = this.cam, me = this.me, cam = E.camera, sens = (S.opts.camSens || 1);
    if (IN.camDX || IN.camDY) { c.yaw -= IN.camDX * 0.0085 * sens * (S.opts.invertX ? -1 : 1); c.pitch = Math.max(-0.1, Math.min(1.15, c.pitch + IN.camDY * 0.005 * sens)); IN.camDX = IN.camDY = 0; }
    const manual = performance.now() - IN.lastCam < 1500;
    if (!manual && me.speed > 1) { let d = me.yaw - c.yaw; while (d > PI) d -= PI * 2; while (d < -PI) d += PI * 2; if (Math.abs(d) < 2.2) c.yaw += d * Math.min(1, dt * 0.9 * (me.speed / 7)); }
    const indoor = this.region !== 'out'; const want = this.chat ? 6.2 : indoor ? 8.0 : 10.8; c.dist += (want - c.dist) * Math.min(1, dt * 2);
    const cn = this.chat && this.chat.npc; let tx = me.x, tz = me.z, ty = me.y + me.hgt * 0.8;
    if (cn) { const a = Math.atan2(me.x - cn.x, me.z - cn.z); let dy = a + 1.15 + PI - c.yaw; while (dy > PI) dy -= PI * 2; while (dy < -PI) dy += PI * 2; c.yaw += dy * Math.min(1, dt * 3); c.pitch += (0.32 - c.pitch) * Math.min(1, dt * 3); tx = me.x * 0.45 + cn.x * 0.55; tz = me.z * 0.45 + cn.z * 0.55; ty = Math.max(ty - 0.35, cn.y + (cn.markY || 1.2) * 0.7); }
    const k6 = c.snap ? 1 : 1 - Math.exp(-dt * 6); c.tgt.set(c.tgt.x + (tx - c.tgt.x) * (cn || c.chatT > 0 ? k6 : 1), c.snap ? ty : c.tgt.y + (ty - c.tgt.y) * (1 - Math.exp(-dt * (me.onGround ? 6 : 3))), c.tgt.z + (tz - c.tgt.z) * (cn || c.chatT > 0 ? k6 : 1)); c.chatT = cn ? 0.8 : Math.max(0, (c.chatT || 0) - dt);
    const pp = Math.min(1.15, c.pitch + (c.boost || 0)); const dir = new THREE.Vector3(-Math.sin(c.yaw) * Math.cos(pp), Math.sin(pp), -Math.cos(c.yaw) * Math.cos(pp));
    const indoorR0 = REGIONS.find((q) => q.id === this.region); const dr = indoorR0 && DOORS[indoorR0.id]; const indoorR = indoorR0 && !(dr && Math.hypot(me.x - dr[0], me.z - dr[1]) < 3.2) ? indoorR0 : null;
    const big = (q) => q.cam !== false && !q.off && !q.nocam && !q.floor && !q.glass && !q.dyn && (q.max[1] - q.min[1]) > (indoorR ? 0.9 : 1.2) && Math.max(q.max[0] - q.min[0], q.max[2] - q.min[2]) > (indoorR ? 0.9 : 1.6);
    const sx = Math.cos(c.yaw) * 0.32, sz = -Math.sin(c.yaw) * 0.32; let d = c.dist + 0.5; const o2 = this._co || (this._co = new THREE.Vector3());
    for (const k of [0, -1, 1]) { o2.set(c.tgt.x + sx * k, c.tgt.y, c.tgt.z + sz * k); d = Math.min(d, this.world.ray(o2, dir, c.dist + 0.5, big)); }
    if (indoorR) { const m = 0.5, lo = [indoorR.x0 + m, indoorR.y0, indoorR.z0 + m], hi = [indoorR.x1 - m, indoorR.ceil - 0.3, indoorR.z1 - m], O = [c.tgt.x, c.tgt.y, c.tgt.z], Dd = [dir.x, dir.y, dir.z];
      for (let i = 0; i < 3; i++) { if (Math.abs(Dd[i]) < 1e-6) continue; const t = ((Dd[i] > 0 ? hi[i] : lo[i]) - O[i]) / Dd[i]; if (t >= 0) d = Math.min(d, t + 0.45); } }
    d = Math.max(1.0, Math.min(c.dist, d - 0.45));
    c.boost = (c.boost || 0) + (((indoorR && d < c.dist * 0.7 && !this.chat) ? 0.35 : 0) - (c.boost || 0)) * Math.min(1, dt * 1.5);
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
