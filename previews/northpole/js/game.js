// Grok North Pole Village runtime: the town, players, townsfolk, the shuttle cart, ambient desert life, day -> sunset, collectibles,
// the Sleigh Bells mystery, the Reindeer Derby + Cookie Rush (3D mini-games), a hidden puzzle, co-op hooks.
import * as THREE from 'three';
import { RP, setP, relayNPC, freeSpot } from './layout.js?v=np9';
import { makeFolk, animFolk } from './folk.js?v=np9';
import { holAct } from './holiday.js?v=np9';
import { tick as opsTick } from './opsrow.js?v=np9';
import { GLYPH_TXT } from './story_theme.js?v=np9';
import { LIGHT as THL, TH as THM } from './theme.js?v=np9';
import { panel } from './ui.js?v=np9';
import { E, setEnvironment, followShadow, skyUniforms } from './engine.js?v=np9';
import { World } from './world.js?v=np9';
import { buildTown, regionAt, areaName, REGIONS, DOORS, NEAR, STOPS, TRACK } from './town.js?v=np9';
import { UY } from './under.js?v=np9';
import { Player } from './player.js?v=np9';
import { FX } from './fx.js?v=np9';
import { makeRat, animRat, MB, toGroup } from './models.js?v=np9';
import { makePup, animPup, birdGeo } from './dogs.js?v=np9';
import { makeTortoise, animTortoise, makeRoadrunner, animRoadrunner, makeLizard, animLizard, makeSunstone } from './critters.js?v=np9';
import { P } from './geo.js?v=np9';
import { rcyl, capsule, torus, sph, cone, heart, star, blobGeo } from './shapes.js?v=np9';
import { updateFrustum, inView, LightPool } from './perf.js?v=np9';
import { sfx, playMusic } from './audio.js?v=np9';
import { S, persist } from './save.js?v=np9';
import { NPCS, talk, clueText, SUN_CLUES, HATS, BADGES, GLYPH } from './story.js?v=np9';
import { readMove, edge, held, IN } from './input.js?v=np9';
const PI = Math.PI;
const TOYS = [[60, 0, 76], [-70, 0, 61], [108, 0, -4]].map((p) => RP(...p));
const DAY = 420; // seconds per day -> sunset cycle
export class Game {
  constructor(app, opts = {}) {
    this.app = app; this.scene = E.scene; this.net = app.net; this.hud = app.hud; this.T = 0; this.levelId = 'tortytown';
    const w = this.world = new World(); w.game = this; w._tick = (dt, G) => opsTick(w, dt, G); { const R = E.renderer, rt = new THREE.WebGLRenderTarget(4, 4), sc = new THREE.Scene(); w.uploader = (m) => { const fc = m.frustumCulled; m.frustumCulled = false; const par = m.parent; sc.add(m); const prev = R.getRenderTarget(), sm = R.shadowMap.autoUpdate; R.shadowMap.autoUpdate = false; R.setRenderTarget(rt); R.render(sc, E.camera); R.setRenderTarget(prev); R.shadowMap.autoUpdate = sm; sc.remove(m); if (par) par.add(m); m.frustumCulled = fc; }; w._upRT = rt; } buildTown(w); w.finalize(this.scene); w.uploader = null; w._upRT.dispose();
    setEnvironment(w.env); this.fx = new FX(this.scene); { const N = 900, pa = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) pa[i] = (Math.random() - 0.5) * 60; const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(pa, 3)); this.wx = new THREE.Points(gg, new THREE.PointsMaterial({ color: THM.snow ? 0xffffff : 0xffa94d, size: THM.snow ? 0.16 : 0.07, transparent: true, opacity: THM.snow ? 0.9 : 0.7, depthWrite: false })); this.wx.frustumCulled = false; this.scene.add(this.wx); } this.extra = []; this.lightPool = new LightPool(this.scene, w.lights, 4);
    this.players = new Map();
    this.me = new Player({ rat: 'human', look: S.look, outfit: S.outfit, name: S.name || 'You', local: true, gadgets: new Set(), pid: opts.pid || 'me' });
    this.me.addTo(this.scene); this.me.place(w.start, w.startYaw); this.me.cp = w.start.slice(); this.me.cpYaw = w.startYaw; this.players.set(this.me.pid, this.me);
    this.cam = { yaw: w.startYaw, pitch: 0.42, dist: w.camDist, pos: new THREE.Vector3(), tgt: new THREE.Vector3(), snap: true, shake: 0 };
    this.region = 'out'; this.vis = null; this.act = null; this.chat = null; this.race = null; this.rush = null; this._vt = 0; this._lod = 0;
    this.buildNPCs(); this.buildDyn(); this.setVis('out', true); this.light(10);
    playMusic('town');
  }
  add(o) { this.scene.add(o); this.extra.push(o); return o; }
  // the opened secret door: walking (or falling) into the doorway takes you down, never to a checkpoint
  tryDescend(force) { const sd = this.world.spots.sdoor; if (!sd || !S.flags.door || this.under || this._desc) return false; const me = this.me;
    if (!force && !(me.x > sd[0] - 1.0 && Math.abs(me.z - sd[1]) < 1.7)) return false; if (force && Math.hypot(me.x - sd[0], me.z - sd[1]) > 9) return false;
    this._desc = true; setTimeout(() => { this._desc = false; }, 1500); me.vx = me.vy = me.vz = 0; this.doAct({ kind: 'descend' }); return true; }
  toastMsg(m) { this.hud.toast(m); }
  sfx(n) { sfx(n); }
  // ------------------------------------------------ townsfolk
  buildNPCs() { const w = this.world; this.npcs = NPCS.map((d) => { relayNPC(d); const L = d.look; let rig, kind, markY;
      if (!['torty','candy','luna','pirat','snowie'].includes(d.id) && !L.rat && !L.dog) { const v = [...d.id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 8; rig = makeFolk(THM.id, d.id === 'mayor' && THM.snow ? 99 : v); rig.root.scale.setScalar(d.id === 'pebble' || (L.s && L.s < 0.2) ? 0.62 : d.id === 'mayor' ? 1.2 : 1.0); kind = 'folk'; markY = 2.0; }
      else if (L.rat) { rig = makeRat(L.rat, L.hat || 'none', { pack: false, extras: L.extras || [], noBlaster: true }); rig.root.scale.setScalar(1.35); kind = 'rat'; markY = 1.6; }
      else if (L.dog) { rig = makePup(L.dog, { seed: 7 }); rig.root.scale.setScalar(L.s || 1); kind = 'dog'; markY = 1.2; }
      else if (L.bird) { rig = makeRoadrunner(L.bird); rig.root.scale.setScalar(L.s || 0.6); kind = 'bird'; markY = 1.6 * (L.s || 0.6); }
      else if (L.liz) { rig = makeLizard(L.liz); rig.root.scale.setScalar(L.s || 1); kind = 'lizard'; markY = 0.5 * (L.s || 1); }
      else { rig = makeTortoise(L.t); rig.root.scale.setScalar(L.s || 0.28); kind = 'tort'; markY = 2.7 * (L.s || 0.28); }
      const RG = REGIONS.find((q) => q.id === d.region); const g = w.ground(d.at[0], d.at[1], RG ? RG.ceil - 0.4 : 20, 0.1).y; const y = d.y != null ? d.y + (d.region !== 'out' ? 0.12 : 0) : (g > -50 ? g : 0);
      if (!d.cart) { const f_ = freeSpot(w, d.at[0], d.at[1], y); d.at[0] = f_[0]; d.at[1] = f_[1]; } const n = { d, id: d.id, rig, kind, x: d.at[0], y, z: d.at[1], yaw: d.at[2] || 0, x0: d.at[0], z0: d.at[1], y0: y, yaw0: d.at[2] || 0, region: d.region, wp: 0, markY };
      rig.root.position.set(n.x, n.y, n.z); rig.root.rotation.y = n.yaw; this.add(rig.root);
      if (d.cart) { n.cart = this.add(this.makeCart()); }
      const mk = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.38, 16).rotateX(PI), new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffb000, emissiveIntensity: 0.8 }));
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), mk.material); dot.position.y = 0.34; mk.add(dot); mk.visible = false; this.add(mk); n.mark = mk; return n; });
    this.npc = Object.fromEntries(this.npcs.map((n) => [n.id, n])); this.placeStory(); }
  makeCart() { const b = MB(); b.m.add(P.rbox, 0xc58b52, 0, 0.75, 0, 0, 0, 0, 1.6, 0.35, 2.4); b.m.add(P.rbox, 0x9a6a3e, 0, 1.05, -0.9, 0, 0, 0, 1.6, 0.5, 0.12); for (let i = 0; i < 2; i++) { b.f.add(P.rbox, [0x2dd4bf, 0xff5d8f][i], 0, 1.0, -0.4 + i * 0.9, 0, 0, 0, 1.4, 0.18, 0.6); b.f.add(P.rbox, [0x2dd4bf, 0xff5d8f][i], 0, 1.35, -0.62 + i * 0.9, 0, 0, 0, 1.4, 0.5, 0.12); }
    [-1, 1].forEach((s) => [-0.8, 0.8].forEach((z) => { b.m.add(P.torus, 0x7c4a1e, s * 0.86, 0.45, z, 0, PI / 2, 0, 0.42, 0.42, 0.5); b.x.add(P.cyl, 0xd4a017, s * 0.86, 0.45, z, 0, 0, PI / 2, 0.1, 0.1, 0.1); }));
    [-0.7, 0.7].forEach((x) => [-1.1, 1.1].forEach((z) => b.m.add(P.cyl, 0x7c4a1e, x, 1.6, z, 0, 0, 0, 0.04, 1.6, 0.04))); for (let i = 0; i < 6; i++) b.f.add(P.rbox, i % 2 ? 0xffffff : 0xffb020, -0.62 + i * 0.25, 2.42, 0, 0, 0, 0, 0.25, 0.08, 2.5);
    b.m.add(P.cyl, 0x7c4a1e, 0, 0.6, 1.6, PI / 2, 0, 0, 0.05, 1.0, 0.05); return toGroup(b); }
  // story-driven positions (Pebble on the hill, everyone at the festival)
  placeStory() { const q = S.q.sun | 0, N = this.npc, set = (id, x, z, yaw, y, region) => { [x, z, yaw] = setP(x, z, yaw); const n = N[id]; n.x = n.x0 = x; n.z = n.z0 = z; n.yaw = n.yaw0 = yaw; n.y = n.y0 = y; n.region = region; n.d.walk = null; n.d.mode = 'cheer'; };
    N.pebble.hidden = !(q === 2 || q >= 4);
    if (q >= 4) { set('torty', 2.0, -12.6, 0.2, 0, 'out'); set('pebble', 0.6, -12.2, 0, 0, 'out'); set('mama', -1.2, -12.6, -0.3, 0, 'out'); set('papa', 3.4, -11.6, 0.5, 0, 'out'); set('gramps', -2.6, -11.4, -0.6, 0, 'out'); set('mayor', 0.6, -19.6, PI, 0, 'out'); N.gramps.d.mode = 'idle'; } }
  wants(n) { const id = n.id, q = S.q.sun | 0; if (n.hidden) return false;
    if (id === 'mayor') return q === 0 || q === 3; if (id === 'pebble') return q === 2; if (id === 'candy') return !S.flags.toys && (S.toys.length >= 3 || !S.talks.candy) || (q === 1 && !S.clues.sniff);
    if (id === 'torty') return !S.talks.torty || (!!S.flags.tough && !S.badges.intern) || (q === 1 && (S.talks.torty | 0) < 2); if (id === 'plato') return !S.flags.tough; if (id === 'mama') return !S.flags.garden && (S.plants.length >= 4 || !S.talks.mama); if (id === 'gramps') return !S.flags.legend;
    if (id === 'luna') return !S.rats.luna || (S.clues.chart && !S.flags.luna); if (id === 'pirat') return !S.rats.pirat || !S.flags.race; if (id === 'snowie') return !S.rats.snowie || (q >= 1 && !(S.sus.snowie | 0)) || !S.flags.snowie;
    if (id === 'rocky' || id === 'glimmer') return q >= 1 && !(S.sus[id] | 0); if (id === 'penny') return (S.sus.rocky | 0) === 1; if (id === 'coral') return (S.sus.glimmer | 0) === 1; if (id === 'taffy') return (S.sus.snowie | 0) === 1; if (id === 'fern') return !S.flags.farm; return false; }
  updateNPCs(dt) { const me = this.me, T = this.T;
    for (const n of this.npcs) { const d2 = (me.x - n.x) ** 2 + (me.z - n.z) ** 2; const vis = !n.hidden && this.vis.has(n.region) && !(n.region === 'out' && this.region !== 'out' && d2 > 625) && !(n.region === 'out' && d2 > 70 * 70); n.rig.root.visible = vis; if (n.cart) n.cart.visible = vis; n.mark.visible = false; if (!vis && !n.d.walk) continue;
      const near = Math.hypot(me.x - n.x, me.z - n.z) < (n.kind === 'tort' ? 3.2 : 4) && Math.abs(me.y - n.y) < 3; let sp = 0; const talking = this.chat && this.chat.npc === n;
      if (n.d.walk && !talking && !(near && !n.cart)) { const p = n.d.walk[n.wp]; const dx = p[0] - n.x, dz = p[1] - n.z, d = Math.hypot(dx, dz); const v = n.d.v || 0.8;
        if (d < 0.3) n.wp = (n.wp + 1) % n.d.walk.length; else { n.x += dx / d * v * dt; n.z += dz / d * v * dt; let t = Math.atan2(dx, dz) - n.yaw; while (t > PI) t -= PI * 2; while (t < -PI) t += PI * 2; n.yaw += t * Math.min(1, dt * 6); sp = v; }
        if (vis) { const g = this.world.ground(n.x, n.z, n.y + 1, 0.1).y; if (g > -50) n.y = g; } }
      else if (n.d.run && !talking && !near) { const [cx, cz, r] = n.d.run, a = T * 0.5 + (n.d.phase || 0); const nx = cx + Math.cos(a) * r, nz = cz + Math.sin(a) * r * 0.6; n.yaw = Math.atan2(nx - n.x, nz - n.z); sp = Math.hypot(nx - n.x, nz - n.z) / Math.max(dt, 1e-3); n.x = nx; n.z = nz; }
      else if (talking || (near && n.d.mode !== 'sleep' && n.d.mode !== 'soak')) { let t = Math.atan2(me.x - n.x, me.z - n.z) - n.yaw; while (t > PI) t -= PI * 2; while (t < -PI) t += PI * 2; n.yaw += t * Math.min(1, dt * 3); }
      if (n.override) { n.override(n, dt); sp = n.sp || 0; }
      const R = n.rig.root; R.position.set(n.x, n.y, n.z); R.rotation.y = n.yaw;
      if (n.cart) { n.cart.position.set(n.x - Math.sin(n.yaw) * 2.2, n.y, n.z - Math.cos(n.yaw) * 2.2); n.cart.rotation.y = n.yaw; }
      if (!vis) continue;
      if (this.wants(n)) { n.mark.visible = true; n.mark.position.set(n.x, n.y + n.markY + 0.35 + Math.sin(T * 3) * 0.08, n.z); n.mark.rotation.y = T * 2; }
      if (!inView(n.x, n.y + 0.6, n.z, 2)) continue;
      const mode = talking ? 'chat' : near && n.d.mode === 'sleep' ? 'idle' : (n.d.mode || 'idle');
      if (n.kind === 'folk') animFolk(n.rig, dt, sp); else if (n.kind === 'tort') animTortoise(n.rig, dt, sp, mode);
      else if (n.kind === 'dog') animPup(n.rig, dt, Math.min(sp, 8), talking || near ? 'happy' : 'idle');
      else if (n.kind === 'rat') { animRat(n.rig, dt, { speed: sp, air: false, vy: 0, glide: false }); if (talking) n.rig.head.rotation.z = Math.sin(T * 9) * 0.08; }
      else if (n.kind === 'bird') animRoadrunner(n.rig, dt, sp); else animLizard(n.rig, dt, sp); } }
  // ------------------------------------------------ dynamic bits
  buildDyn() { const w = this.world, s = w.spots;
    // Snowflakes (instanced, spinning golden scallop shells)
    { const SL = new THREE.SphereGeometry(1, 18, 10), CL = new THREE.CapsuleGeometry(0.5, 1, 3, 10); const b = MB(); b.g.add(SL, 0xffc928, 0, 0, 0, 0, 0, 0, 0.9, 0.9, 0.28); for (let i = 0; i < 7; i++) { const a = -PI / 2 + (i - 3) * 0.32; b.g.add(CL, 0xffe066, Math.cos(a + PI) * 0.0 + Math.sin(a) * 0.4, -Math.cos(a) * 0.4 * -1 + 0.0, 0.2, 0, 0, a, 0.16, 0.85, 0.08); } b.g.add(P.rbox, 0xffc928, 0, -0.85, 0, 0, 0, 0, 0.5, 0.3, 0.2); const geo = toGroup(b).children[0].geometry;
      this.shellIM = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffd23f, metalness: 0.8, roughness: 0.25, emissive: 0x7a5200, emissiveIntensity: 0.5 }), w.gears.length); this.shellIM.castShadow = true; this.shellIM.frustumCulled = false; this.add(this.shellIM); }
    this.biscGot = new Set(S.gears); this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._s = new THREE.Vector3(); this._p = new THREE.Vector3();
    // Candy's squeaky snowball toys
    const toy = () => { const b = MB(); b.g.add(P.capsule, 0x4ade80, 0, 0.25, 0, 0, 0, 0, 0.24, 0.32, 0.24); [-1, 1].forEach((s2) => b.g.add(P.capsule, 0x4ade80, s2 * 0.22, 0.32, 0, 0, 0, s2 * 0.6, 0.12, 0.2, 0.12)); b.g.add(P.sphere, 0xff5d8f, 0, 0.62, 0, 0, 0, 0, 0.1); [-1, 1].forEach((s2) => b.g.add(P.sphere, 0x111111, s2 * 0.07, 0.32, 0.12, 0, 0, 0, 0.03)); return toGroup(b); };
    this.toys = TOYS.map((p, i) => { const m = this.add(toy()); m.position.set(p[0], p[1] + 0.3, p[2]); m.scale.setScalar(1.3); m.visible = !S.toys.includes(i); return { i, p, m }; });
    // THE SLEIGH BELLS
    this.sun = this.add(makeSunstone()); this.sunLight = new THREE.PointLight(0xffb020, 0, 7, 2); this.sun.add(this.sunLight); this.sunPos();
    // marigolds (Mama Rosa's beds)
    this.flowers = w.plants.map((p, i) => { const b = MB(); for (let k = 0; k < 3; k++) { const ox = (k - 1) * 0.6; b.g.add(P.cyl, 0x2e9e45, ox, 0.3, 0, 0, 0, 0, 0.03, 0.6, 0.03); for (let j = 0; j < 10; j++) { const a = j / 10 * PI * 2; b.g.add(P.sphere, 0xff9a1f, ox + Math.cos(a) * 0.12, 0.66 + Math.sin(a) * 0.12, 0, 0, 0, 0, 0.08, 0.08, 0.03); } b.g.add(P.sphere, 0xb45309, ox, 0.66, 0.02, 0, 0, 0, 0.07); }
      const g = toGroup(b); g.position.set(p[0], p[1], p[2]); g.scale.setScalar(S.plants.includes(i) ? 1 : 0.001); this.add(g); return g; });
    // lettuce field (one InstancedMesh: hundreds of heads, a single draw call, low-poly heads)
    { const LO = new THREE.SphereGeometry(1, 10, 7); const b = MB(); for (let i = 0; i < 7; i++) { const a = i * 2.4, r = i < 2 ? 0.05 : 0.2; b.g.add(LO, i < 2 ? 0x2f7d32 : i % 2 ? 0x1f6b2a : 0x3c9a3f, Math.cos(a) * r, 0.2, Math.sin(a) * r, Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5, 0.26, 0.2, 0.26); } const geo = toGroup(b).children[0].geometry; const F = s.field || [];
      this.field = new THREE.InstancedMesh(geo, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.4, clearcoat: 0.4 }), F.length); F.forEach((p, i) => { this._m.compose(this._p.set(p[0], p[1], p[2]), this._q.setFromEuler(this._e.set(0, i, 0)), this._s.setScalar(0.85 + p[3] * 0.12)); this.field.setMatrixAt(i, this._m); }); this.field.castShadow = true; this.field.userData.lod = RP(-100, 0.2, 95); this.add(this.field); }
    // windmill blades
    if (s.mill) { const b = MB(); for (let i = 0; i < 6; i++) b.m.add(P.rbox, i % 2 ? 0xffffff : 0xef4444, Math.cos(i / 6 * PI * 2) * 1.5, Math.sin(i / 6 * PI * 2) * 1.5, 0, 0, 0, i / 6 * PI * 2, 2.6, 0.5, 0.05); b.x.add(P.sphere, 0xd4a017, 0, 0, 0.05, 0, 0, 0, 0.3); this.mill = this.add(toGroup(b)); this.mill.position.set(...s.mill); if (s.millR) this.mill.rotation.y = s.millR; }
    // farm plots for Cookie Rush
    this.plots = w.plots.map((p, i) => { const g = new THREE.Group(); g.position.set(...p); const sb = MB(); sb.g.add(P.capsule, 0x86efac, 0, 0.12, 0, 0, 0, 0, 0.08, 0.15, 0.08); [-1, 1].forEach((k) => sb.g.add(P.sphere, 0x4ade80, k * 0.1, 0.22, 0, 0, 0, k * 0.6, 0.12, 0.05, 0.08)); const sprout = toGroup(sb);
      const lb = MB(); for (let k = 0; k < 7; k++) { const a = k * 2.4, r = k < 2 ? 0.05 : 0.2; lb.g.add(P.sphere, k < 2 ? 0xd9a066 : k % 2 ? 0xc68642 : 0xb87333, Math.cos(a) * r, 0.2, Math.sin(a) * r, Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5, 0.26, 0.2, 0.26); } const head = toGroup(lb); head.scale.setScalar(0.001);
      const db = MB(); for (let k = 0; k < 5; k++) db.m.add(P.sphere, 0x3b2410, Math.cos(k) * 0.25, 0.03, Math.sin(k * 1.3) * 0.25, 0, 0, 0, 0.06, 0.03, 0.06); const seeds = toGroup(db); seeds.visible = false; g.add(sprout, head, seeds); sprout.visible = false; this.add(g);
      const o = { kind: 'plot', i, x: p[0], y: 0, z: p[2], r: 1.5, label: '' }; w.inter.push(o); return { g, sprout, head, seeds, st: 0, t: 0 }; });
    // the hidden dials (rotating stone drums) + the carved door slab
    this.dials = (s.dials || []).map((p, i) => { const g = new THREE.Group(); g.position.set(...p); const b = MB(); b.m.add(P.cyl, 0xc97a44, 0, 0, 0, 0, 0, PI / 2, 0.55, 0.62, 0.55); const sy = [(bb) => { bb.l.add(P.sphere, 0xffb020, 0, 0, 0, 0, 0, 0, 0.06, 0.18, 0.18, 0.4); for (let k = 0; k < 8; k++) bb.l.add(P.cone, 0xffd23f, 0, Math.cos(k / 8 * PI * 2) * 0.3, Math.sin(k / 8 * PI * 2) * 0.3, k / 8 * PI * 2, 0, 0, 0.05, 0.12, 0.05, 0.3); }, (bb) => bb.l.add(torus(0.3, 20, PI * 1.3), 0xc4b5fd, 0, 0, 0, 0, PI / 2, 0.6, 0.25, 0.25, 0.25, 0.4), (bb) => bb.l.add(star(), 0xfde68a, 0, 0, 0, 0, PI / 2, 0, 0.25, 0.25, 0.1, 0.4), (bb) => { bb.l.add(P.sphere, 0x4ade80, 0, 0, 0, 0, 0, 0, 0.08, 0.2, 0.25, 0.3); bb.l.add(P.sphere, 0x4ade80, 0, 0.05, 0.28, 0, 0, 0, 0.06, 0.09, 0.09, 0.3); }];
      b.m.add(P.cyl, 0xfff1d6, -0.32, 0, 0, 0, 0, PI / 2, 0.47, 0.04, 0.47); for (let k = 0; k < 4; k++) { const sb = MB(); sy[k](sb); const m = toGroup(sb, false); m.position.set(-0.4, 0, 0); m.scale.setScalar(1.45); m.userData.k = k; g.add(m); }
      g.add(toGroup(b)); this.add(g); return g; });
    S.dials = Array.isArray(S.dials) ? S.dials : [0, 0, 0]; this.dialA = S.dials.map((v) => v);
    if (s.sdoor) { const b = MB(); b.m.add(P.rbox, 0xb86a3a, 0, 1.6, 0, 0, 0, 0, 0.35, 3.2, 2.6); for (let k = 0; k < 3; k++) b.m.add(P.sphere, 0xd9925a, -0.18, 1.0 + k * 0.8, 0, 0, 0, 0, 0.05, 0.25, 0.6); this.door = this.add(toGroup(b)); this.door.position.set(s.sdoor[0] - 0.25, S.flags.door ? -3.3 : 0, s.sdoor[1]);
      const hb = MB(); hb.l.add(P.rbox, 0x1e1b4b, 0, 1.6, 0, 0, 0, 0, 0.1, 3.1, 2.4, 0.05); this.doorHole = this.add(toGroup(hb, false)); this.doorHole.position.set(s.sdoor[0] - 0.08, 0, s.sdoor[1]); }
    // the Moonstone (in the hidden hall)
    if (s.moonstone) { const g = new THREE.Group(), b = MB(); b.l.add(new THREE.OctahedronGeometry(1, 1), 0xc4b5fd, 0, 0, 0, 0, 0, 0, 0.3, 0.42, 0.3, 0.9); b.e.add(P.sphere, 0xede9fe, 0, 0, 0, 0, 0, 0, 0.4, 0.52, 0.4); g.add(toGroup(b, false)); g.position.set(...s.moonstone); this.moon = this.add(g); }
    // songbirds over the oasis (instanced)
    { const N = 22; this.birds = new THREE.InstancedMesh(birdGeo(), new THREE.MeshStandardMaterial({ roughness: 0.6 }), N); this.birds.frustumCulled = false; const c = new THREE.Color(); this.birdD = [];
      for (let i = 0; i < N; i++) { this.birds.setColorAt(i, c.set([0x60a5fa, 0xfacc15, 0xf87171, 0xffffff, 0xa78bfa][i % 5])); this.birdD.push({ cx: [0, 70, -70, 0, 36, -90][i % 6] + (i * 7 % 9), cz: [0, 0, 0, -100, 94, 80][i % 6], r: 5 + (i % 4) * 2.5, y: 10 + (i % 5) * 1.6, sp: 0.35 + (i % 3) * 0.12, ph: i * 1.7 }); } this.add(this.birds); }
    // little turtles swimming in the oasis pond + rolling tumbleweeds on the dunes
    this.swim = []; for (let i = 0; i < 4; i++) { const r = makeTortoise({ shell: ['moss', 'sky', 'olive', 'coral'][i], flat: 0.6 }); r.root.scale.setScalar(0.12 + (i % 2) * 0.03); this.add(r.root); this.swim.push(r); }
    this.weeds = []; for (let i = 0; i < 4; i++) { const b = MB(); for (let k = 0; k < 3; k++) b.m.add(torus(0.08, 16), 0xb08a52, 0, 0, 0, k * 1.05, k * 0.7, 0, 0.55, 0.55, 0.55); b.m.add(blobGeo(i, 0.4, 1), 0xc9a26a, 0, 0, 0, 0, 0, 0, 0.35); const g = toGroup(b); this.add(g); this.weeds.push({ g, z: 40 + i * 22, o: i * 9 }); }
    // festival decorations (after the mystery): giant lettuce cake, sun balloon arch, presents
    { const g = new THREE.Group(), b = MB(); const x = 0, z = -21.6; for (let i = 0; i < 3; i++) b.g.add(rcyl(1.3 - i * 0.36, 0.6, 0.12, 40), [0x86efac, 0xfef3c7, 0x4ade80][i], x, i * 0.6, z); for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; b.g.add(P.sphere, [0x4ade80, 0x86efac][i % 2], x + Math.cos(a) * 1.3, 0.6, z + Math.sin(a) * 1.3, 0, 0, 0, 0.18, 0.12, 0.18); } b.l.add(P.sphere, 0xffb020, x, 2.1, z, 0, 0, 0, 0.25, 0.25, 0.25, 0.8);
      for (let i = 0; i <= 18; i++) { const a = i / 18 * PI; b.g.add(P.sphere, [0xff6b35, 0xffb020, 0xffd23f, 0xff5d8f][i % 4], -4.5 * Math.cos(a), Math.sin(a) * 4.5, -24.5, 0, 0, 0, 0.4, 0.46, 0.4); }
      [[-3, -22.4, 0xff5d8f], [3, -22.2, 0x2dd4bf], [2.4, -20.8, 0xffd23f], [-2.6, -20.6, 0xa66bff]].forEach(([px, pz, c]) => { b.g.add(P.rbox, c, px, 0.35, pz, 0, 0.5, 0, 0.7, 0.7, 0.7); b.g.add(P.rbox, 0xffffff, px, 0.35, pz, 0, 0.5, 0, 0.72, 0.72, 0.14); });
      g.add(toGroup(b)); this.party = this.add(g); this.party.visible = (S.q.sun | 0) >= 4; }
    // Santa’s Workshop live tests: drop carriages, crush press heads, a rolling foam boulder (cartoony + kid-friendly)
    { const t = s.tt || {}; const mk = (f) => { const b = MB(); f(b); return this.add(toGroup(b)); }; const armored = (b, c) => { b.m.add(P.rbox, c, 0, 0.5, 0, 0, 0, 0, 1, 1, 1); for (let k = 0; k < 4; k++) b.g.add(new THREE.CylinderGeometry(0.22, 0.2, 0.06, 6), [0xb98545, 0x0f9d8a, 0xd1a05e, 0xffb020][k], -0.22 + (k % 2) * 0.44, 0.3 + Math.floor(k / 2) * 0.42, 0.52, PI / 2, 0, 0); };
      this.tt = { t };
      if (t.drop) this.tt.drop = mk((b) => { b.x.add(P.rbox, 0xfacc15, 0, 0.1, 0, 0, 0, 0, 2.7, 0.2, 2.7); b.x.add(P.cyl, 0x94a3b8, 0, 0.1, 0, 0, 0, 0, 0.04, 6, 0.04); armored(b, 0x60a5fa); });
      if (t.press) this.tt.press = mk((b) => { b.x.add(P.rbox, 0xa855f7, 0, 0, 0, 0, 0, 0, 3.4, 0.5, 2.2); b.g.add(P.rbox, 0xfacc15, 0, -0.27, 0, 0, 0, 0, 3.2, 0.06, 2.0); });
      if (t.press) { this.tt.pressItem = mk((b) => armored(b, 0xff5d8f)); this.tt.pressItem.position.set(t.press[0], 0.62, t.press[2]); this.tt.pressItem.scale.setScalar(0.7); }
      if (t.yardDrop) this.tt.ydrop = mk((b) => { armored(b, 0xffb020); b.l.add(P.sphere, 0xffffff, 0, 1.2, 0, 0, 0, 0, 0.1); });
      if (t.yardPress) this.tt.ypress = mk((b) => { b.g.add(rcyl(1.15, 0.45, 0.18, 32), 0x7c3aed, 0, -0.22, 0); b.g.add(rcyl(1.0, 0.08, 0.04, 32), 0xfacc15, 0, -0.3, 0); b.x.add(rcyl(0.22, 2.6, 0.06, 20), 0xe2e8f0, 0, 0.2, 0); b.x.add(rcyl(0.4, 0.3, 0.1, 20), 0x64748b, 0, 0.2, 0); });
      if (t.yardPress) { this.tt.ypItem = mk((b) => { b.g.add(P.sphere, 0x22c55e, 0, 0.5, 0, 0, 0, 0, 0.6, 0.5, 0.6); for (let k = 0; k < 6; k++) b.g.add(new THREE.CylinderGeometry(0.2, 0.18, 0.06, 6), 0xb98545, Math.cos(k) * 0.42, 0.75, Math.sin(k) * 0.42, Math.sin(k) * 0.6, 0, -Math.cos(k) * 0.6); }); this.tt.ypItem.position.set(t.yardPress[0], 0.4, t.yardPress[1]); }
      if (t.ramp) this.tt.boulder = mk((b) => { b.m.add(blobGeo(9, 0.15, 2), 0xb07a4a, 0, 0, 0, 0, 0, 0, 0.9); for (let k = 0; k < 5; k++) b.m.add(P.sphere, 0x8a5a32, Math.cos(k * 1.3) * 0.75, Math.sin(k * 2.1) * 0.5, Math.sin(k * 1.3) * 0.6, 0, 0, 0, 0.18, 0.12, 0.18); });
      this.tt.ph = 0; }
    // race: 4 numbered racers (Speedy is #3) + a cheer ring over Speedy
    this.racers = [0, 1, 2, 3].map((i) => { const r = makeTortoise({ shell: ['coral', 'sky', 'gold', 'plum'][i], num: i + 1, numC: [0xef4444, 0x2563eb, 0x16a34a, 0xa855f7][i], hat: 'helmet', hatC: [0xef4444, 0x2563eb, 0x16a34a, 0xa855f7][i] }); r.root.scale.setScalar(0.24); this.add(r.root); return r; }); this.placeRacers(0);
    this.cheerRing = this.add(new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 10, 32).rotateX(PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }))); this.cheerRing.visible = false;
  }
  laneP(i, a) { a += TRACK.flip || 0; const { cx, cz, rx, rz } = TRACK, r = [16.3, 17.5, 18.7, 19.9][i]; return [cx + Math.cos(a) * r * rx / 18, cz + Math.sin(a) * r * rz / 18, Math.atan2(-Math.sin(a) * r * rx / 18, Math.cos(a) * r * rz / 18)]; }
  placeRacers(dt, A) { this.racers.forEach((r, i) => { const a = A ? A[i] : PI / 2 - 0.02; const [x, z, yaw] = this.laneP(i, a); r.root.position.set(x, 0.02, z); r.root.rotation.y = yaw; animTortoise(r, dt, A ? 1.2 : 0, A ? 'idle' : 'idle'); }); }
  sunPos() { const q = S.q.sun | 0, s = this.sun, sp = this.world.spots; s.userData.carry = q === 3; if (q >= 4) { s.visible = true; s.position.set(...sp.pedestal); s.position.y += 0.35; } else if (q === 2) { s.visible = true; s.position.set(sp.pebbleSpot[0] + 0.8, sp.pebbleSpot[1] + 0.5, sp.pebbleSpot[2] - 0.6); } else s.visible = q === 3; this.sunLight.intensity = s.visible ? 3 : 0; s.scale.setScalar(q === 3 ? 0.7 : 1); }
  // ------------------------------------------------ region culling: interiors only draw when you're inside or near their door; far tiny decor is culled (only far away)
  setVis(r, force) { this._vt -= 1; if (r === this.region && !force && this._vt > 0) return; this._vt = 15; const me = this.me;
    const v = r.startsWith('u_') ? new Set([r, ...(NEAR[r] || [])]) : new Set(['shell', 'out', r]);
    if (!r.startsWith('u_')) for (const k in DOORS) { const [dx, dz] = DOORS[k]; if (Math.hypot(me.x - dx, me.z - dz) < 15) v.add(k); }
    const key = [...v].sort().join(','); if (key === this._vk && r === this.region) return; this._vk = key; this.region = r; this.vis = v; this.under = r.startsWith('u_');
    for (const k in this.world.regionMeshes) { const on = v.has(k); for (const m of this.world.regionMeshes[k]) m.visible = on; } this._lod = 0; }
  farCull(dt) { this._lod -= dt; if (this._lod > 0) return; this._lod = 0.4; const c = E.camera.position, D2 = 95 * 95;
    for (const m of this.world.detailMeshes) { const reg = m.userData.region; if (!this.vis.has(reg)) { m.visible = false; continue; } const bs = m.userData.ws || m.geometry.boundingSphere; m.visible = !bs || (bs.center.x - c.x) ** 2 + (bs.center.z - c.z) ** 2 < D2 + bs.radius * bs.radius * 4; }
    if (this.field) this.field.visible = !this.under && Math.hypot(c.x + 100, c.z - 94) < 85; }
  areaLabel() { const r = REGIONS.find((q) => q.id === this.region); return r ? r.name : areaName(this.me.x, this.me.z); }
  // ------------------------------------------------ frame
  update(dt) { this.T += dt; const w = this.world, me = this.me; if (w._tick) w._tick(dt, this); if (this._fly) { const t = this._flyT += dt, f = this._fly; f.position.set(22 - t * 2.5, 0.6 + Math.max(0, t - 1) ** 1.6 * 2.2, -80 - t * 9); f.rotation.x = -Math.min(0.5, t * 0.12); if (Math.random() < dt * 30) this.fx.sparkle(f.position.x, f.position.y, f.position.z + 1.5, 0xffd23f); if (t > 16) { this.scene.remove(f); this._fly = null; } } if (this.wx) { const p = this.wx.geometry.attributes.position, a = p.array, sp = THM.snow ? 1.6 : 0.25; for (let i = 0; i < a.length; i += 3) { a[i + 1] -= sp * dt * (0.7 + (i % 7) * 0.08); a[i] += Math.sin(this.T + i) * dt * 0.3; if (a[i + 1] < -6) a[i + 1] += 30; } p.needsUpdate = true; this.wx.position.set(me.x, me.y + 8, me.z); this.wx.visible = this.region === 'out' && !this.under; }
    const mv = this.app.paused || this.chat ? { x: 0, y: 0 } : readMove();
    const free = !this.app.paused && !this.chat && !this.app.busy;
    const inp = free ? { mx: mv.x, my: mv.y, jumpP: edge('jump'), jumpH: held('jump'), spinP: edge('spin'), blastP: edge('blast'), hookP: false, actP: edge('act') } : { mx: 0, my: 0 };
    me.update(dt, inp, this); me.updateBlob(w); this.pond(me);
    this.setVis(regionAt(me.x, me.y + 0.3, me.z)); this.hud.region(this.areaLabel());
    for (const p of this.players.values()) if (!p.local) { p.remoteUpdate(dt); p.updateBlob(w); }
    updateFrustum(E.camera);
    this.updateNPCs(dt); this.anim(dt); this.updateRace(dt); this.updateRush(dt); this.collect(); this.secretsCheck(); this.farCull(dt);
    this.updateAct(); if (inp.actP && this.act) this.doAct(this.act);
    this.net.tick && this.net.tick(dt, this);
    this.updateCam(dt); this.render(dt); this.hud.update(dt, this); this.lightPool.update(dt, me.x, me.y + 2, me.z); }
  render(dt) { this.fx.update(dt); followShadow(this.me.x, this.me.y, this.me.z); this.light(dt); }
  pond(me) { const [cx, cz, rx, rz] = this.world.spots.pond; const dx = (me.x - cx) / (rx - 0.6), dz = (me.z - cz) / (rz - 0.6); if (dx * dx + dz * dz < 1 && me.y < 0.05 && me.onGround) { if (!this._wet) { this._wet = true; sfx('splat'); this.fx.burst(me.x, 0.1, me.z, 0x7dd3fc, 18, 5); this.toastMsg('🎄 Splash! The pond elves politely nudge you back to shore.'); const a = Math.atan2(dz, dx); me.place([cx + Math.cos(a) * (rx + 1.4), 0.1, cz + Math.sin(a) * (rz + 1.4)], me.yaw); } } else this._wet = false;
    for (const p of this.world.spots.pools || []) { const ex = (me.x - p[0]) / p[3], ez = (me.z - p[2]) / p[4]; if (ex * ex + ez * ez < 1 && Math.abs(me.y - p[1]) < 0.4) { if (!this._warm) { this._warm = true; this.toastMsg('♨️ Ahhh… warm and fizzy!'); sfx('splat'); } return; } } this._warm = false; }
  // day -> golden desert sunset cycle (host time, so co-op players share the sky). Pure tone, never a quality change.
  dayK() { const o = (this.net.online && this.hostTod) || S.opts.tod || 'auto'; if ((S.q.sun | 0) >= 4 && o === 'auto') return 1; if (o === 'day') return 0; if (o === 'evening') return 1; const p = (this.T / DAY) % 1; return p < 0.5 ? 0 : p < 0.6 ? (p - 0.5) / 0.1 : p < 0.9 ? 1 : 1 - (p - 0.9) / 0.1; }
  light(dt) { const k0 = this.dayK(); this.ev = this.ev == null ? k0 : this.ev + (k0 - this.ev) * Math.min(1, dt * 2); const ev = this.ev, inside = this.region !== 'out', under = this.under;
    const L = under ? [1.05, 0.22, 0.25, 1.0, 0.7] : inside ? [1.0, 0.62, 0.8, 1.25, 0.26] : [1.0 - ev * 0.06, 0.6 - ev * 0.14, 0.85 - ev * 0.28, 1.0 - ev * 0.14, 0.38 + ev * 0.16];
    { const RX = inside && !under && REGIONS.find((q) => q.id === this.region), tm = (RX && RX.tone) || 1; if (tm !== 1) { L[0] *= tm; L[1] *= tm * 0.9; L[2] *= tm * 0.85; } }
    const k = Math.min(1, dt * 4), R = E.renderer; R.toneMappingExposure += (L[0] - R.toneMappingExposure) * k; E.hemi.intensity += (L[1] - E.hemi.intensity) * k; this.scene.environmentIntensity += (L[2] - this.scene.environmentIntensity) * k;
    if (E.bloom) { E.bloom.threshold += (L[3] - E.bloom.threshold) * k; E.bloom.strength += (L[4] - E.bloom.strength) * k; }
    const c = this._c || (this._c = { a: new THREE.Color(), b: new THREE.Color() }); E.sun.color.copy(c.a.set(THL.sunA).lerp(c.b.set(THL.sunB), ev)); E.sun.intensity = under ? 0.2 : THL.sunI[0] + (THL.sunI[1] - THL.sunI[0]) * ev; E.hemi.color.copy(c.a.set(THL.hemiA).lerp(c.b.set(THL.hemiB), ev));
    const u = skyUniforms(); if (u) { u.top.value.copy(c.a.set(THL.top[0]).lerp(c.b.set(THL.top[1]), ev)); u.mid.value.copy(c.a.set(THL.mid[0]).lerp(c.b.set(THL.mid[1]), ev)); u.bot.value.copy(c.a.set(THL.bot[0]).lerp(c.b.set(THL.bot[1]), ev)); u.sunCol.value.copy(E.sun.color); }
    if (this.scene.fog) { this.scene.fog.color.copy(under ? c.a.set(0x1e1b3a) : c.a.set(THL.fog[0]).lerp(c.b.set(THL.fog[1]), ev)); this.scene.fog.density = under ? 0.02 : inside ? 0.001 : THL.dens; }
    for (const s of this.world.lights) if (s.out) { if (s.i0 == null) s.i0 = s.i; s.i = s.i0 * (0.15 + ev * 1.4); } }
  anim(dt) { const T = this.T, w = this.world, me = this.me, s = w.spots;
    const G = w.gears; for (let i = 0; i < G.length; i++) { const p = G[i]; const got = this.biscGot.has(i) || (p[1] > UY + 10) !== !this.under || (p[0] - me.x) ** 2 + (p[2] - me.z) ** 2 > 6400; this._q.setFromEuler(this._e.set(0, T * 2 + i, 0)); this._p.set(p[0], p[1] + Math.sin(T * 2 + i) * 0.08, p[2]); this._s.setScalar(got ? 0 : 0.3); this._m.compose(this._p, this._q, this._s); this.shellIM.setMatrixAt(i, this._m); }
    this.shellIM.instanceMatrix.needsUpdate = true;
    this.toys.forEach((t) => { if (t.m.visible) { t.m.rotation.y = T * 2; t.m.position.y = t.p[1] + 0.3 + Math.sin(T * 3) * 0.08; } });
    if (this.sun.userData.carry) { this.sun.position.set(me.x, me.y + me.hgt + 0.5 + Math.sin(T * 4) * 0.05, me.z); if (Math.random() < dt * 6) this.fx.sparkle(me.x, me.y + me.hgt + 0.5, me.z, 0xffd23f); } if (this.sun.visible) { this.sun.rotation.y = T * 0.8; if (Math.random() < dt * 3) this.fx.sparkle(this.sun.position.x, this.sun.position.y, this.sun.position.z, 0xffd23f); }
    this.flowers.forEach((g, i) => { const want = S.plants.includes(i) ? 1 : 0.001; g.scale.setScalar(g.scale.x + (want - g.scale.x) * Math.min(1, dt * 3)); if (want === 1) g.rotation.z = Math.sin(T * 1.3 + i) * 0.05; });
    if (this.mill) this.mill.rotation.z = T * 0.8;
    const out = !this.under && this.region === 'out';
    if (out) { this.birds.visible = true; for (let i = 0; i < this.birdD.length; i++) { const b = this.birdD[i], a = T * b.sp + b.ph; this._p.set(b.cx + Math.cos(a) * b.r, b.y + Math.sin(T * 0.7 + i) * 0.6, b.cz + Math.sin(a) * b.r); this._q.setFromEuler(this._e.set(0, -a, Math.sin(a) * 0.15));
        const f = 0.55 + Math.abs(Math.sin(T * 12 + i)) * 0.7; this._s.set(f * 1.4, 1.4, 1.4); this._m.compose(this._p, this._q, this._s); this.birds.setMatrixAt(i, this._m); } this.birds.instanceMatrix.needsUpdate = true; } else this.birds.visible = false;
    const nearSq = Math.hypot(me.x, me.z) < 60; this.swim.forEach((r, i) => { const a = T * 0.15 + i * 1.6, rr = 3 + (i % 2) * 2.2; r.root.visible = false; if (!r.root.visible) return; r.root.position.set(Math.cos(a) * rr * 1.25, -0.3, Math.sin(a) * rr * 0.85); r.root.rotation.y = -a; animTortoise(r, dt, 0.6, 'idle'); });
    this.weeds.forEach((q) => { const x = 80 + ((T * 2.2 + q.o * 5) % 50); q.g.visible = false; q.g.position.set(x, 0.55 + Math.abs(Math.sin(T * 3 + q.o)) * 0.4, q.z + Math.sin(T * 0.5 + q.o) * 3); q.g.rotation.z = -T * 3; });
    if (out && Math.random() < dt * 6) { const p = (s.pools || [])[(Math.random() * 4) | 0]; if (p) this.fx.emit(p[0] + (Math.random() - 0.5) * p[3], p[1] + 0.3, p[2] + (Math.random() - 0.5) * p[4], 0, 0.8, 0, 0.18, 0xffffff, 1.6, -0.4, 0.6); }
    if (this.region === 'spa' && Math.random() < dt * 8) { const p = s.spaPool; this.fx.emit(p[0] + (Math.random() - 0.5) * 6, p[1], p[2] + (Math.random() - 0.5) * 4, 0, 0.7, 0, 0.2, 0xffffff, 1.6, -0.4, 0.6); }
    if (out && s.fall && Math.random() < dt * 6) this.fx.emit(s.fall[0], s.fall[1], s.fall[2], (Math.random() - 0.5) * 0.4, -0.5, 0.8, 0.09, 0xbfe9ff, 0.8, 9, 0.5);
    if (this.region === 'market' && Math.random() < dt * 6) { const f = s.mktFountain; const a = Math.random() * PI * 2; this.fx.emit(f[0], f[1], f[2], Math.cos(a) * 1.2, 1.8, Math.sin(a) * 1.2, 0.07, 0xbfe9ff, 0.9, 9, 0.5); }
    if (this.under && Math.random() < dt * 5) this.fx.emit(me.x + (Math.random() - 0.5) * 14, UY + 0.3 + Math.random() * 4, me.z + (Math.random() - 0.5) * 14, 0, 0.3, 0, 0.06, [0x5eead4, 0xa78bfa, 0xf472b6][(Math.random() * 3) | 0], 2.0, -0.1, 0.2);
    if (this.party.visible && out && Math.random() < dt * 3) this.fx.confetti((Math.random() - 0.5) * 10, 5, -20 + (Math.random() - 0.5) * 6, 6);
    if (this.moon) { this.moon.rotation.y = T * 0.6; this.moon.position.y = s.moonstone[1] + Math.sin(T * 1.5) * 0.08; this.moon.visible = this.under; }
    if (this.tt) { const t = this.tt.t, nearTT = !this.under && Math.hypot(me.x - RP(95, 0, -56)[0], me.z - RP(95, 0, -56)[2]) < 80, inTT = !!this.vis && this.vis.has('tortuga'); const cyc = (per, off = 0) => ((T + off) % per) / per;
      const dropY = (k, top, bot) => k < 0.7 ? bot + (top - bot) * (k / 0.7) : k < 0.76 ? top - (top - bot) * ((k - 0.7) / 0.06) ** 2 : bot + Math.abs(Math.sin((k - 0.76) * 26)) * 0.5 * (1 - (k - 0.76) / 0.24);
      const impact = (k, kp, x, y, z) => { if (kp < 0.76 && k >= 0.76) { this.fx.puff(x, y, z, 10, 0xf5f0e6); if (Math.hypot(me.x - x, me.z - z) < 14) sfx('splat'); } };
      if (this.tt.drop) { this.tt.drop.visible = inTT; if (inTT) { const k = cyc(7), [x, y, z] = t.drop; this.tt.drop.position.set(x, y + dropY(k, 4.6, 0.45), z); impact(k, this._kd || 0, x, y + 0.5, z); this._kd = k; } }
      if (this.tt.press) { this.tt.press.visible = this.tt.pressItem.visible = inTT; if (inTT) { const k = cyc(6, 2), [x, , z] = t.press; const y = k < 0.45 ? 5.2 - k / 0.45 * 3.9 : k < 0.6 ? 1.3 : 1.3 + (k - 0.6) / 0.4 * 3.9; this.tt.press.position.set(x, y + 0.25, z); this.tt.pressItem.scale.set(0.7, k > 0.43 && k < 0.62 ? 0.62 : 0.7, 0.7); } }
      if (inTT && t.blast && Math.random() < dt * 14) { const [x, y, z] = t.blast; this.fx.emit(x - 0.9, y + 0.6, z, 2.2 + Math.random(), -0.6, (Math.random() - 0.5) * 0.8, 0.07, Math.random() < 0.5 ? 0xf0cf98 : 0xffd38a, 0.6, 2, 0.8); }
      const yard = nearTT && this.region === 'out'; ['ydrop', 'ypress', 'ypItem', 'boulder'].forEach((k) => this.tt[k] && (this.tt[k].visible = yard));
      if (yard && this.tt.ydrop) { const k = cyc(8, 1), [x, , z] = t.yardDrop; this.tt.ydrop.position.set(x, 0.3 + dropY(k, 7.8, 0), z); this.tt.ydrop.rotation.y = k * 2; impact(k, this._ky || 0, x, 0.4, z); this._ky = k; }
      if (yard && this.tt.ypress) { const k = cyc(7, 3), [x, z] = t.yardPress; const y = k < 0.45 ? 5.0 - k / 0.45 * 3.6 : k < 0.6 ? 1.4 : 1.4 + (k - 0.6) / 0.4 * 3.6; this.tt.ypress.position.set(x, y, z); this.tt.ypItem.scale.set(1, k > 0.43 && k < 0.62 ? 0.8 : 1, 1); }
      if (yard && this.tt.boulder) { const k = cyc(9), [x, z] = t.ramp; const zz = k < 0.8 ? z + 6.6 - k / 0.8 * 6.0 : z + 0.6, yy = k < 0.8 ? 2.95 - k / 0.8 * 1.9 + 0.0 : 1.05 + Math.abs(Math.sin((k - 0.8) * 30)) * 0.3 * (1 - (k - 0.8) / 0.2); this.tt.boulder.position.set(x, yy, zz); this.tt.boulder.rotation.x = -k * 9; this.tt.boulder.scale.setScalar(k > 0.96 ? Math.max(0.01, (1 - k) / 0.04) : k < 0.04 ? Math.max(0.01, k / 0.04) : 1); if ((this._kb || 0) < 0.8 && k >= 0.8) { this.fx.burst(x, 1.6, z - 0.4, 0xffd23f, 12, 4); } this._kb = k; } }
    // dials + door
    this.dials.forEach((g, i) => { const a = this.dialA[i]; g.children.forEach((m) => { if (m.userData.k !== undefined) m.visible = m.userData.k === a; }); if (g.userData.a !== a) { g.userData.a = a; g.userData.pop = 1; } g.userData.pop = Math.max(0, (g.userData.pop || 0) - dt * 3); g.rotation.x = Math.sin(g.userData.pop * PI) * 0.6; });
    if (this.door && S.flags.door && !this.under) this.tryDescend(false);
    if (this.door) { const want = S.flags.door ? -3.3 : 0; this.door.position.y += (want - this.door.position.y) * Math.min(1, dt * 1.5); }
    const nearT = !this.under && Math.hypot(me.x - TRACK.cx, me.z - TRACK.cz) < 75; this.racers.forEach((r) => r.root.visible = nearT); if (!this.race && nearT) this.placeRacers(dt); }
  // ------------------------------------------------ REINDEER DERBY (3D): 1 lap, cheer on the beat to boost Speedy (#3)
  offerRace() { if (this.race) return; this.race = { t: -3.5, A: [PI / 2 - 0.02, PI / 2 - 0.02, PI / 2 - 0.02, PI / 2 - 0.02], v: [0, 0, 0, 0], boost: 0, beat: 0, last: 4, combo: 0, done: false }; this.toastMsg('🏁 Reindeer Derby! Tap 📣 CHEER when the ring over Speedy #3 turns GREEN.'); sfx('check'); }
  updateRace(dt) { const R = this.race; if (!R) { this.cheerRing.visible = false; return; } R.t += dt; const end = PI / 2 + PI * 2;
    if (R.t < 0) { const c = Math.ceil(-R.t); if (c !== R.last && c <= 3) { R.last = c; this.toastMsg(c + '…'); sfx('click'); } this.hud.timer('🏁 ' + Math.max(1, c)); this.placeRacers(dt); return; }
    if (R.last > 0) { R.last = 0; this.toastMsg('🏁 GO! (cozily)'); sfx('win'); }
    R.beat = (R.t % 0.9) / 0.9; const inWin = R.beat > 0.72 || R.beat < 0.06; R.boost = Math.max(0, R.boost - dt * 0.012);
    for (let i = 0; i < 4; i++) { if (R.A[i] >= end) continue; const base = i === 2 ? 0.098 + R.boost : [0.122, 0.116, 0, 0.119][i] + Math.sin(R.t * (0.7 + i * 0.3) + i) * 0.012; R.A[i] = Math.min(end, R.A[i] + base * dt); if (R.A[i] >= end && R.place == null && i === 2) R.place = R.A.filter((a, j) => j !== 2 && a >= end).length + 1; }
    this.placeRacers(dt, R.A); const sp = this.racers[2].root.position; this.cheerRing.visible = true; this.cheerRing.position.set(sp.x, 1.4 + Math.sin(R.t * 7) * 0.05, sp.z); this.cheerRing.material.color.set(inWin ? 0x4ade80 : 0xffffff); this.cheerRing.scale.setScalar(inWin ? 1.25 : 0.9 + R.beat * 0.25);
    const ahead = R.A.filter((a, j) => j !== 2 && a > R.A[2]).length + 1; this.hud.timer(`🏁 Speedy #3 · ${['1st', '2nd', '3rd', '4th'][ahead - 1]} · ${inWin ? '🟢 CHEER NOW!' : '⚪ wait…'} · 🔥${R.combo}`);
    if (R.A[2] >= end || R.t > 120) this.endRace(); }
  cheer() { const R = this.race; if (!R || R.t < 0) return; const inWin = R.beat > 0.72 || R.beat < 0.06; if (inWin && R.lastBeat !== Math.floor((R.t + 0.1) / 0.9)) { R.lastBeat = Math.floor((R.t + 0.1) / 0.9); R.combo++; R.boost = Math.min(0.07, R.boost + 0.012 + Math.min(R.combo, 6) * 0.0015); sfx('part'); const p = this.racers[2].root.position; this.fx.burst(p.x, 1.0, p.z, 0x4ade80, 8, 3); } else { R.combo = 0; R.boost = Math.max(0, R.boost - 0.012); sfx('deny'); } }
  endRace() { const R = this.race; this.race = null; this.hud.timer(''); this.cheerRing.visible = false; const place = R.place || 4; this.fx.confetti(this.me.x, this.me.y + 1.5, this.me.z, place === 1 ? 80 : 20); sfx(place === 1 ? 'win' : 'check');
    this.toastMsg(place === 1 ? '🏆 SPEEDY WINS THE REINDEER DERBY!' : `🏁 Speedy finished ${['1st', '2nd', '3rd', '4th'][place - 1]}! Talk to Pi-rat to race again.`); S.best.race = Math.max(S.best.race | 0, 5 - place); persist();
    if (place === 1 && !S.flags.race) { S.flags.race = 1; persist(); this.giveHat('racer'); this.badge('race'); } }
  // ------------------------------------------------ COOKIE RUSH (3D): plant, water and pick lettuce in 60 s
  offerFarm() { if (this.rush) return; this.rush = { t: 60, n: 0 }; this.plots.forEach((p) => { p.st = 0; p.t = 0; }); this.toastMsg('🍪 Cookie Rush! Plant 🌱 → water 💧 → wait → pick 🥬. 60 seconds!'); sfx('check'); }
  updateRush(dt) { const R = this.rush; this.plots.forEach((p) => { if (p.st === 2) { p.t += dt; if (p.t >= (R ? 6 : 12)) p.st = 3; } const gk = p.st === 2 ? 0.25 + p.t / 6 * 0.75 : p.st === 3 ? 1.05 + Math.sin(this.T * 4) * 0.04 : 0.001; p.head.scale.setScalar(p.head.scale.x + (gk - p.head.scale.x) * Math.min(1, dt * 5)); p.sprout.visible = p.st === 2 && p.t < 1.2; p.seeds.visible = p.st === 1; });
    if (!R) return; R.t -= dt; this.hud.timer(`🍪 ${Math.ceil(Math.max(0, R.t))} s · ${R.n} picked`); if (R.t <= 0) { this.rush = null; this.hud.timer(''); const nb = R.n > (S.best.farm | 0); S.best.farm = Math.max(S.best.farm | 0, R.n); persist(); this.toastMsg(`🍪 Time! ${R.n} cookies${nb ? ' · NEW BEST!' : ''}`); sfx('win'); this.fx.confetti(this.me.x, this.me.y + 1.5, this.me.z, 30); if (R.n >= 8 && !S.flags.farm) { S.flags.farm = 1; persist(); this.giveHat('chef'); this.badge('farm'); } } }
  plotAct(o) { const p = this.plots[o.i]; if (!this.rush) { this.toastMsg('🍪 Talk to Farmer Fern to start Cookie Rush!'); return; } if (p.st === 0) { p.st = 1; sfx('click'); this.fx.puff(o.x, 0.4, o.z, 5, 0x8a5a32); } else if (p.st === 1) { p.st = 2; p.t = 0; sfx('splat'); this.fx.burst(o.x, 0.8, o.z, 0x7dd3fc, 12, 3); } else if (p.st === 3) { p.st = 0; p.t = 0; this.rush.n++; sfx('part'); this.fx.burst(o.x, 0.6, o.z, 0x4ade80, 12, 4); } }
  // ------------------------------------------------ collecting
  collect() { const me = this.me, G = this.world.gears;
    for (let i = 0; i < G.length; i++) { if (this.biscGot.has(i)) continue; const p = G[i]; if (Math.abs(me.x - p[0]) < 0.8 && Math.abs(me.z - p[2]) < 0.8 && me.y + me.hgt + 0.25 > p[1] && me.y < p[1] + 0.6) { this.biscGot.add(i); S.gears = [...this.biscGot]; persist(); sfx('part'); this.fx.sparkle(p[0], p[1], p[2], 0xffd23f); this.fx.burst(p[0], p[1], p[2], 0xffd23f, 10, 4);
        const n = this.biscGot.size; this.toastMsg(`🔔 Snowflake ${n}/${G.length}`); if (n >= 20) this.giveHat('party'); if (n >= G.length) { this.badge('shells'); this.checkCrown(); } this.hud.dirty = true; } }
    this.toys.forEach((t) => { if (!t.m.visible) return; if (Math.hypot(me.x - t.p[0], me.z - t.p[2]) < 0.9 && Math.abs(me.y - t.p[1]) < 1.6) { t.m.visible = false; S.toys.push(t.i); persist(); sfx('squeak'); this.fx.burst(t.p[0], t.p[1] + 0.4, t.p[2], 0x4ade80, 12); this.toastMsg(`🎁 *SQUEAK!* Candy's toy ${S.toys.length}/3`); this.hud.dirty = true; } }); }
  secretsCheck() { const me = this.me; for (const s of this.world.secrets) { if (S.secrets.includes(s.id)) continue; if (Math.hypot(me.x - s.x, me.z - s.z) < s.r && Math.abs(me.y - s.y) < 2.5) { S.secrets.push(s.id); persist(); sfx('win'); this.fx.confetti(me.x, me.y + 1.5, me.z, 40); this.toastMsg(s.msg + ` (${S.secrets.length}/${this.world.secrets.length})`); if (S.secrets.length >= 5) { this.giveHat('wizard'); this.badge('secrets'); } } } }
  // ------------------------------------------------ rewards + story
  giveHat(id) { if (S.hats[id]) return; S.hats[id] = 1; persist(); const h = HATS.find((q) => q.id === id); this.toastMsg(`🎩 New hat: ${h ? h.n : id}! (Wear it from the pause menu)`); sfx('win'); }
  badge(id) { if (S.badges[id]) return; S.badges[id] = 1; persist(); this.toastMsg('🏅 Badge: ' + BADGES[id]); }
  checkCrown() { if (S.hats.crown) return; if ((S.q.sun | 0) >= 4 && this.biscGot.size >= this.world.gears.length) { S.hats.crown = 1; persist(); setTimeout(() => { this.toastMsg('👑 GOLD CROWN! North Pole Village\'s greatest hero!'); sfx('win'); }, 1500); } }
  addClue(id) { const nw = !S.clues[id]; S.clues[id] = 1; persist(); this.app.ui.clue(id, clueText(id), nw); if ((S.q.sun | 0) === 0 && nw) setTimeout(() => this.toastMsg('🤔 Hmm… Santa Claus at Town Hall might know what this is about.'), 600); this.recheck(); }
  recheck() { if ((S.q.sun | 0) === 1 && SUN_CLUES.every((c) => S.clues[c])) { S.q.sun = 2; persist(); this.placeStory(); this.sunPos(); setTimeout(() => this.toastMsg('💡 All 5 clues! Tiny footprints, a "P", warm rocks, a picnic… up The North Pole!'), 500); } this.hud.dirty = true; }
  gotSun() { S.q.sun = 3; persist(); this.sunPos(); this.fx.confetti(this.me.x, this.me.y + 1.5, this.me.z, 50); sfx('win'); this.toastMsg('☀️ You have the SLEIGH BELLS! Carry it back to Santa Claus.'); this.npc.pebble.hidden = true; this.hud.dirty = true; }
  solveSun() { S.q.sun = 4; persist(); this.sunPos(); this.placeStory(); this.party.visible = true; this.giveHat('detective'); this.badge('sun'); this.fx.confetti(this.me.x, this.me.y + 1.5, this.me.z, 120); this.app.ui.finale(); this.checkCrown(); this.hud.dirty = true; }
  // ------------------------------------------------ interaction prompt
  updateAct() { const me = this.me; let best = null, bd = 1e9;
    for (const o of this.world.inter) { const d = Math.hypot(me.x - o.x, me.z - o.z); if (d < o.r && Math.abs(me.y - o.y) < 2 && d < bd) { bd = d; best = o; } }
    if (best && best.kind === 'plant' && S.plants.includes(best.i)) best = null;
    if (best && best.kind === 'plot') { const p = this.plots[best.i]; best = Object.assign({}, best, { label: !this.rush ? '🍪 Cookie plot (ask Farmer Fern)' : ['🌱 Plant a seed', '💧 Water it', '⏳ Growing…', '🍪 PICK IT!'][p.st] }); }
    if (best && best.kind === 'dial') best = Object.assign({}, best, { label: `🪨 Turn dial ${best.i + 1} (now ${GLYPH.syms[this.dialA[best.i]]})` });
    if (S.flags.door && this.world.spots.sdoor && !this.under) { const [dx, dz] = this.world.spots.sdoor; const d = Math.hypot(me.x - (dx - 1.2), me.z - dz); if (d < 1.8 && d < bd) { bd = d; best = { kind: 'descend', label: '🕳️ Step through the old door' }; } }
    if (best && best.kind === 'moonstone' && S.flags.moon) best = Object.assign({}, best, { label: '🌙 The Ice Star hums softly' });
    for (const n of this.npcs) { if (!n.rig.root.visible || n.override) continue; const r = n.kind === 'tort' ? 2.6 : n.kind === 'bird' ? 2.4 : 2.3; const d = Math.hypot(me.x - n.x, me.z - n.z); if (d < r && Math.abs(me.y - n.y) < 2.2 && d - 0.2 < bd) { bd = d; best = { kind: 'npc', npc: n, label: '💬 Talk to ' + n.d.n.split(' (')[0] }; } }
    if (this.race && this.race.t >= 0) best = { kind: 'cheer', label: '📣 CHEER!' };
    this.act = best; this.hud.setAct(this.chat ? null : best); }
  holOffer(id) { setTimeout(() => holAct(id, this), 50); }
  holLaunch() { S.flags.launch = 1; persist(); this.badge('launch'); const s = this._fly = new THREE.Group(); const red = new THREE.MeshStandardMaterial({ color: 0xc81e1e }), gold = new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0x806000 }), brown = new THREE.MeshStandardMaterial({ color: 0x8a5a32 }); const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 3), red); s.add(body); const run = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 3.4), gold); run.position.y = -0.55; s.add(run); for (let i = 0; i < 9; i++) { const d = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.8, 4, 10), brown); d.rotation.x = Math.PI / 2; d.position.set(i === 8 ? 0 : (i % 2 ? 0.6 : -0.6), 0.2, 3 + (i >> 1) * 1.6 + (i === 8 ? 1.6 : 0)); s.add(d); if (i === 8) { const n = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff2020, emissiveIntensity: 2 })); n.position.set(0, 0.3, d.position.z + 0.7); s.add(n); } } s.position.set(...RP(22, 0.6, -80)); this.scene.add(s); this._flyT = 0; this.cam.shake = 0.5; sfx('win'); this.toastMsg('🛷 3… 2… 1… LIFT-OFF! Santa\'s sleigh is flying!'); setTimeout(() => { this.app.ui.open(); panel(`<div class="fin"><h2>🛷 LAUNCH NIGHT!</h2><h3>Santa\'s sleigh is in the sky</h3><p>The letters are sorted, the reindeer are fed, the Sleigh Bells are back and Flight Command is tracking every chimney. You did it, elf!</p><button class="go" id="fx">MERRY CHRISTMAS!</button></div>`, (c) => { c.querySelector('#fx').onclick = () => { this.app.ui.done(); }; }); }, 7000); }
  doAct(o) { const ui = this.app.ui; if (o.kind !== 'cheer') sfx('click'); if (o.kind === 'hol') { holAct(o.id, this); return; }
    if (o.kind === 'cheer') this.cheer();
    else if (o.kind === 'npc') { const r = talk(o.npc.id, this); this.chat = { npc: o.npc }; ui.dialog(o.npc.d.n, r.lines, () => { this.chat = null; if (r.fx) r.fx(); this.recheck(); }); }
    else if (o.kind === 'clue') { if (o.id === 'lemon') { const t = talk('taffy', this); this.toastMsg(t.lines[0][1]); if (t.fx) t.fx(); return; } if ((S.q.sun | 0) === 0) { this.toastMsg('🤔 Something\'s odd here. Maybe talk to Santa Claus first.'); } this.addClue(o.id); }
    else if (o.kind === 'glyph') { const t = { g1: GLYPH_TXT.g1, g2: '', g3: GLYPH_TXT.g3 }[o.id]; if (o.id === 'g2') { const n = this.npc.gramps; const r = talk('gramps', this); this.chat = { npc: n }; ui.dialog(n.d.n, r.lines, () => { this.chat = null; }); } else this.toastMsg(t); S.flags[o.id] = 1; persist(); }
    else if (o.kind === 'dial') { this.dialA[o.i] = (this.dialA[o.i] + 1) % 4; S.dials = this.dialA.slice(); persist(); sfx('door'); if (!S.flags.door && GLYPH.answer.every((a, i) => this.dialA[i] === a)) { S.flags.door = 1; persist(); this.cam.shake = 0.6; setTimeout(() => { sfx('win'); this.toastMsg('🪨 RUMBLE… the carved stone sinks into the snow!'); }, 400); } }
    else if (o.kind === 'descend') { sfx('door'); ui.fade(() => { this.me.place([154, UY + 0.1, 0], PI / 2); this.cam.yaw = PI / 2; this.cam.snap = true; }); if (!S.flags.under) { S.flags.under = 1; persist(); setTimeout(() => this.toastMsg('🕳️ The old ice tunnels… no elf has walked here in a very, very long time.'), 900); } }
    else if (o.kind === 'climb') { ui.fade(() => { const [dx, dz] = this.world.spots.sdoor; this.me.place([dx - 2.6, 0.1, dz], -PI / 2); this.cam.yaw = -PI / 2; this.cam.snap = true; }); }
    else if (o.kind === 'relic') { if (S.badges.grotto) { this.toastMsg('🔔 The golden ornament glows warmly. Cozy and steady!'); return; } if (!S.secrets.includes('grotto')) S.secrets.push('grotto'); persist(); this.fx.confetti(this.me.x, this.me.y + 1.5, this.me.z, 60); this.badge('grotto'); this.toastMsg('🔔 The Golden Ornament of the first Chief Tester! Badge: Grotto Explorer'); return; }
    else if (o.kind === 'moonstone') { if (S.flags.moon) { this.toastMsg('🌙 The Ice Star glows. Somewhere above, the Sleigh Bells jingle back.'); return; } S.flags.moon = 1; if (!S.secrets.includes('hall')) S.secrets.push('hall'); persist(); this.fx.confetti(this.me.x, this.me.y + 1.5, this.me.z, 100); sfx('win'); this.toastMsg('🌙 The Ice Star! The Hall of the First Elves remembers you.'); this.giveHat('shellcrown'); this.badge('ancient'); if (S.secrets.length >= 5) { this.giveHat('wizard'); this.badge('secrets'); } }
    else if (o.kind === 'plant') { if (S.plants.includes(o.i)) return; S.plants.push(o.i); persist(); sfx('part'); this.fx.burst(o.x, 1, o.z - 1, 0xff9a1f, 14, 4); this.toastMsg(`🌼 Winter Rose planted! (${S.plants.length}/4)` + (S.plants.length >= 4 ? ' Tell Mama Rosa!' : '')); }
    else if (o.kind === 'plot') this.plotAct(o);
    else if (o.kind === 'express') ui.express(this, o.i);
    else if (o.kind === 'mg') ui.minigame(o.game, this);
    else if (o.kind === 'fun') { this._fun = ((this._fun | 0) + 1) % o.msgs.length; this.toastMsg(o.msgs[this._fun]); sfx(o.sfx || 'squeak'); } }
  travel(i) { const [x, z, yaw] = STOPS[i]; this.app.ui.fade(() => { this.me.place([x + Math.sin(yaw) * 2.2, 0.1, z + Math.cos(yaw) * 2.2], yaw); this.cam.yaw = yaw; this.cam.snap = true; }); sfx('honk'); if (!S.flags.express) { S.flags.express = 1; persist(); this.badge('express'); } }
  onSpin(p) { if (Math.random() < 0.5) this.fx.burst(p.x, p.y + 1, p.z, 0xffb020, 8, 3); }
  fireBlast() {} hookTarget() { return null; }
  // ------------------------------------------------ camera (pulled back; never clips through walls; indoor rooms clamp the lens inside, doorways allowed)
  updateCam(dt) { const c = this.cam, me = this.me, cam = E.camera, sens = (S.opts.camSens || 1);
    if (this.camRide) { IN.camDX = IN.camDY = 0; this.camRide(dt, c, cam); return; } // scripted rides (Sky Tours) fly their own smooth camera
    if (c.reg !== this.region) { if (c.reg !== undefined) c.snap = true; c.reg = this.region; } // walking through a door: clean cut instead of sliding through the wall
    if (IN.camDX || IN.camDY) { c.yaw -= IN.camDX * 0.0085 * sens * (S.opts.invertX ? -1 : 1); c.pitch = Math.max(-0.1, Math.min(1.15, c.pitch + IN.camDY * 0.005 * sens)); IN.camDX = IN.camDY = 0; }
    const manual = performance.now() - IN.lastCam < 1500;
    if (!manual && me.speed > 1) { let d = me.yaw - c.yaw; while (d > PI) d -= PI * 2; while (d < -PI) d += PI * 2; if (Math.abs(d) < 2.2) c.yaw += d * Math.min(1, dt * 0.9 * (me.speed / 7)); }
    const indoor = this.region !== 'out'; const want = this.chat ? (this.chat.npc && (this.chat.npc.kind === 'tort' || this.chat.npc.kind === 'lizard') ? 4.6 : 5.6) + (this.chat.npc ? Math.max(0, Math.hypot(me.x - this.chat.npc.x, me.z - this.chat.npc.z) - 2.2) * 1.6 : 0) : indoor ? (this.under ? 7.4 : 6.6) : 10.8; const sd = this.world.spots.sdoor, nearDial = !indoor && !this.chat && sd && Math.hypot(me.x - (sd[0] - 2.6), me.z - sd[1]) < 4.2;
    if (nearDial) { if (!S.flags.dialTip) { S.flags.dialTip = 1; persist(); this.toastMsg('🪨 Tap each dial to change its symbol, match the old legend'); } if (!manual) { let dy = PI / 2 + 0.38 - c.yaw; while (dy > PI) dy -= PI * 2; while (dy < -PI) dy += PI * 2; c.yaw += dy * Math.min(1, dt * 3); c.pitch += (0.36 - c.pitch) * Math.min(1, dt * 3); } }
    c.dist += ((nearDial ? 5.4 : want) - c.dist) * Math.min(1, dt * 2);
    const cn = this.chat && this.chat.npc; let tx = me.x, tz = me.z, ty = me.y + me.hgt * 0.8;
    if (cn) { const a = Math.atan2(me.x - cn.x, me.z - cn.z); let dy = a + 1.15 + PI - c.yaw; while (dy > PI) dy -= PI * 2; while (dy < -PI) dy += PI * 2; c.yaw += dy * Math.min(1, dt * 3); c.pitch += (0.32 - c.pitch) * Math.min(1, dt * 3); tx = me.x * 0.45 + cn.x * 0.55; tz = me.z * 0.45 + cn.z * 0.55; ty = Math.max(ty - 0.35, cn.y + (cn.markY || 1.2) * 0.7); }
    const k6 = c.snap ? 1 : 1 - Math.exp(-dt * 6); c.tgt.set(c.tgt.x + (tx - c.tgt.x) * (cn || c.chatT > 0 ? k6 : 1), c.snap ? ty : c.tgt.y + (ty - c.tgt.y) * (1 - Math.exp(-dt * (me.onGround ? 6 : 3))), c.tgt.z + (tz - c.tgt.z) * (cn || c.chatT > 0 ? k6 : 1)); c.chatT = cn ? 0.8 : Math.max(0, (c.chatT || 0) - dt);
    // camera distance along a pitch: walls/props stop it smoothly; indoors it also stays inside the room box, except it may slip out through the doorway
    const R0 = REGIONS.find((q) => q.id === this.region), drp = R0 && DOORS[R0.id], nearDoor = drp && Math.hypot(me.x - drp[0], me.z - drp[1]) < 4.5;
    const big = (q) => q.cam !== false && !q.off && !q.nocam && !q.floor && !q.glass && !q.dyn && (q.max[1] - q.min[1]) > (R0 ? 0.9 : 1.2) && Math.max(q.max[0] - q.min[0], q.max[2] - q.min[2]) > (R0 ? 0.9 : (q.max[1] - q.min[1]) > 2.5 ? 0.6 : 1.6); // tall posts/pillars count too (lamp posts stay see-through)
    const o2 = this._co || (this._co = new THREE.Vector3()), dv = this._cdv || (this._cdv = new THREE.Vector3());
    const RR = !!R0 && !this.chat; // every interior: over-the-shoulder framing (low, pulled back, looking into the room; may back out through the doorway)
    const distAt = (pit, yw = c.yaw) => { dv.set(-Math.sin(yw) * Math.cos(pit), Math.sin(pit), -Math.cos(yw) * Math.cos(pit)); const sx = Math.cos(yw) * 0.32, sz = -Math.sin(yw) * 0.32; let dr = c.dist + 0.5;
      for (const k of [0, -1, 1]) { o2.set(c.tgt.x + sx * k, c.tgt.y, c.tgt.z + sz * k); dr = Math.min(dr, this.world.ray(o2, dv, c.dist + 0.5, big)); }
      let d = dr; if (R0) { const m = 0.45, lo = [R0.x0 + m, R0.y0, R0.z0 + m], hi = [R0.x1 - m, R0.ceil - 0.35, R0.z1 - m], O = [c.tgt.x, c.tgt.y, c.tgt.z], Dd = [dv.x, dv.y, dv.z]; let db = 1e9;
        for (let i = 0; i < 3; i++) { if (Math.abs(Dd[i]) < 1e-6) continue; const t = ((Dd[i] > 0 ? hi[i] : lo[i]) - O[i]) / Dd[i]; if (t >= 0) db = Math.min(db, t + 0.45); }
        d = Math.min(dr, db); }
      return Math.max(RR ? 1.1 : R0 ? 0.8 : 1.4, Math.min(c.dist, d - 0.45)); }; // indoors it may come close (never out through a wall)
    const base = RR ? Math.max(0.12, Math.min(0.62, 0.3 + (c.pitch - 0.42) * 0.7)) : c.pitch + (R0 && !this.chat ? 0.12 : 0);
    if (RR && !manual && (c.snap || me.speed < 0.8)) { const d0 = distAt(base); if (d0 < 3.2) { let bo = 0, bs = d0; for (const o of [0.45, -0.45, 0.9, -0.9, 1.4, -1.4]) { const sc = distAt(base, c.yaw + o) - Math.abs(o) * 1.2; if (sc > bs + 0.6) { bs = sc; bo = o; } } if (bo) c.yaw += c.snap ? bo : bo * Math.min(1, dt * 1.6); } } // backed against a wall: swing round to see the room
    const dBase = this.chat ? c.dist : distAt(base);
    const bT = this.chat ? 0 : Math.max(0, Math.min(RR ? 0.16 : R0 ? 0.78 : 0.3, (1 - dBase / c.dist) * (RR ? 0.35 : R0 ? 1.1 : 0.5)));
    c.boost = (c.boost || 0) + (bT - (c.boost || 0)) * Math.min(1, dt * (bT > (c.boost || 0) ? 2.5 : 1.2));
    const pp = Math.min(RR ? 0.72 : 1.2, base + c.boost); const d = distAt(pp); const dir = new THREE.Vector3().copy(dv);
    if (c.cd == null || c.snap) c.cd = d; else if (d < c.cd - 0.05) c.cd += (d - c.cd) * Math.min(1, dt * 9); else if (d > c.cd + 0.35) c.cd += (d - c.cd) * Math.min(1, dt * 2.2);
    const w3 = c.tgt.clone().addScaledVector(dir, c.cd); const gy = this.world.ground(w3.x, w3.z, w3.y + 0.5, 0.3).y; const minY = (gy > -1e8 ? gy : me.y) + 0.6; if (w3.y < minY) w3.y = minY;
    if (RR) { const sh = Math.max(0, Math.min(0.75, (4.8 - c.cd) * 0.3)); c.sh = (c.sh || 0) + (sh - (c.sh || 0)) * Math.min(1, dt * 4); w3.x -= Math.cos(c.yaw) * c.sh; w3.z += Math.sin(c.yaw) * c.sh; } else c.sh = 0; // close to a wall: slide over the shoulder so the hero never fills the screen
    if (c.snap) { c.pos.copy(w3); c.snap = false; } else { const kx = 1 - Math.exp(-dt * 14), ky = 1 - Math.exp(-dt * 8); c.pos.x += (w3.x - c.pos.x) * kx; c.pos.z += (w3.z - c.pos.z) * kx; c.pos.y += (w3.y - c.pos.y) * ky; }
    if (R0 && c.tgt.x > R0.x0 + 0.3 && c.tgt.x < R0.x1 - 0.3 && c.tgt.z > R0.z0 + 0.3 && c.tgt.z < R0.z1 - 0.3) { const m = 0.3; c.pos.x = Math.max(R0.x0 + m, Math.min(R0.x1 - m, c.pos.x)); c.pos.z = Math.max(R0.z0 + m, Math.min(R0.z1 - m, c.pos.z)); c.pos.y = Math.min(R0.ceil - 0.2, c.pos.y); } // indoors the lens never leaves the room, even mid-glide
        cam.position.copy(c.pos); if (c.shake > 0) { c.shake -= dt; cam.position.x += (Math.random() - 0.5) * c.shake; cam.position.y += (Math.random() - 0.5) * c.shake; }
    cam.lookAt(c.tgt.x - Math.cos(c.yaw) * (c.sh || 0) * 0.25, c.tgt.y + (RR ? 0.35 : 0.2), c.tgt.z + Math.sin(c.yaw) * (c.sh || 0) * 0.25); if (this._camOv) { cam.position.set(...this._camOv[0]); cam.lookAt(...this._camOv[1]); } const fov = E.baseFov + (R0 && !this.chat ? (E.baseFov > 65 ? 10 : 8) : 0); /* small rooms: a slightly wider lens instead of a cramped close-up */ if (Math.abs(cam.fov - fov) > 0.1) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 3); cam.updateProjectionMatrix(); } }
  // ------------------------------------------------ co-op
  addRemote(pid, info, slot) { if (this.players.has(pid)) return this.players.get(pid); const p = new Player({ rat: 'human', look: info.look, outfit: info.outfit, name: info.name, pid, slot }); p.addTo(this.scene); p.place(this.world.start); this.players.set(pid, p); this.hud.dirty = true; return p; }
  removeRemote(pid) { const p = this.players.get(pid); if (!p || p.local) return; p.removeFrom(this.scene); this.players.delete(pid); this.hud.dirty = true; }
  refreshMe() { const old = this.me; const p = new Player({ rat: 'human', look: S.look, outfit: S.outfit, name: S.name || 'You', local: true, gadgets: old.gadgets, pid: old.pid }); p.addTo(this.scene); p.place([old.x, old.y, old.z], old.yaw); p.cp = old.cp; p.cpYaw = old.cpYaw; old.removeFrom(this.scene); this.players.delete(old.pid); this.players.set(p.pid, p); this.me = p; }
}
