// Grok Pickleball Park - the walk-in park: world, people, the 5 pet cameos, ambient matches on the courts,
// interactions, first-person mode and smart rendering. Live matches are run by MatchView (match3d.js).
import * as THREE from 'three';
import { E, setEnvironment, followShadow } from './engine.js?v=ppk2';
import { World } from './world.js?v=ppk2';
import { buildMap, SPOTS, ENV, SEATS, SITS, STANDS } from './map.js?v=ppk2';
import { BUILDINGS, buildingAt } from './bld.js?v=ppk2';
import { Walker } from './walker.js?v=ppk2';
import { makeHuman, animHuman } from './humans.js?v=ppk2';
import { FollowCam } from './cam.js?v=ppk2';
import { makePet, animPet } from './pets.js?v=ppk2';
import { Crowd } from './crowd.js?v=ppk2';
import { readMove, edge, IN } from './input.js?v=ppk2';
import { updateFrustum, inView, LightPool } from './perf.js?v=ppk2';
import { S, persist } from './save.js?v=ppk2';
import { sfx, playMusic } from './audio.js?v=ppk2';
import { talk, talking, toast } from './uikit.js?v=ppk2';
import { MATS } from './mats.js?v=ppk2';
import { Builder, P } from './geo.js?v=ppk2';
import { compact } from './compact.js?v=ppk2';
import { COURTS, PADDLES, BALLS } from './data.js?v=ppk2';
import { LINES, goal } from './story.js?v=ppk2';
import { MatchView } from './match3d.js?v=ppk2';
import { dillersOwned, smashOwned } from './dlc.js?v=ppk2';
const PI = Math.PI, PB = window.PB;
const _r = new THREE.Ray(), _v = new THREE.Vector3(), _b = new THREE.Box3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler();
// shared instanced paddle + ball geometry for the ambient players
function paddleGeo() { const b = new Builder(); b.add(P.rbox, 0xffffff, 0, 0.12, 0, 0, 0, 0, 0.2, 0.26, 0.016); b.add(P.capsule, 0x1f2937, 0, -0.08, 0, 0, 0, 0, 0.05, 0.12, 0.045); return compact(b.build(), 'g'); }
const AMBIENT = [['w1', true], ['w3', false], ['e2', true], ['e4', false], ['center', true], ['night', false], ['dill1', false], ['dill2', true], ['smash_lava', false], ['smash_moon', true]];
export class Game {
  constructor(app) {
    this.app = app; app.SPOTS = SPOTS; this.scene = E.scene; this.T = 0; this.fp = false; this.fpPitch = 0; this.mv = null;
    const w = this.world = new World(); { const R = E.renderer, rt = new THREE.WebGLRenderTarget(4, 4), sc = new THREE.Scene(); w.uploader = (m) => { const fc = m.frustumCulled; m.frustumCulled = false; const par = m.parent; sc.add(m); const prev = R.getRenderTarget(), sm = R.shadowMap.autoUpdate; R.shadowMap.autoUpdate = false; R.setRenderTarget(rt); R.render(sc, E.camera); R.setRenderTarget(prev); R.shadowMap.autoUpdate = sm; sc.remove(m); if (par) par.add(m); m.frustumCulled = fc; }; w._upRT = rt; }
    buildMap(w); w.finalize(this.scene); w.uploader = null; w._upRT.dispose();
    setEnvironment(ENV); this.lightPool = new LightPool(this.scene, w.lights.filter((l) => l.i > 0), 4);
    this.me = new Walker(S.look); this.me.addTo(this.scene); this.me.place([0, 0.1, 108], PI);
    this.cam = new FollowCam(); this.cam.yaw = 0; this.cam.snap = true;
    this.inB = null; this.acts = []; this.act = null; this.npcs = [];
    this.crowd = new Crowd(this.scene, 230); this.buildPeople(); this.buildAmbient(); this.buildPets(); this.buildActs(); this.setVis(true);
    const hc = document.getElementById('hPadChip'); if (hc) hc.onclick = () => this.app.ui.smashForge();
  }
  add(o) { this.scene.add(o); return o; }
  // ---------------- people: fans in the bleachers, folks on benches, shoppers, staff, walkers on the paths ----------------
  buildPeople() { const c = this.crowd; this.people = []; let k = 0;
    const regionAt = (x, z) => { const b = buildingAt(x, z); return b ? 'in_' + b.id : 'out'; };
    // stadium + night court + training center fans: about 60% of seats filled
    SEATS.forEach((q, i) => { if ((i * 7919) % 10 > 5) return; this.people.push({ x: q.x, z: q.z, y: q.y - 0.79, ry: q.ry, sit: true, look: c.look(100 + i * 13, false), region: regionAt(q.x, q.z), fan: true, base: q.y - 0.79 }); });
    SITS.forEach((q, i) => { this.people.push({ x: q.x, z: q.z, y: q.y - 0.79, ry: q.ry, sit: true, look: c.look(900 + i * 31, false), region: regionAt(q.x, q.z), name: q.name }); });
    STANDS.forEach((q, i) => { const a = { x: q.x, z: q.z, y: 0.06, ry: q.ry, look: c.look(1500 + i * 17, !!q.staff), region: regionAt(q.x, q.z), name: q.name || (q.staff ? 'Staff' : 'Visitor') }; if (q.staff) a.cap = true; this.people.push(a); k++; });
    // strollers on loops (paths + plaza)
    const loops = [[[3, 104], [3, 80], [10, 62], [0, 46], [-10, 62], [3, 80]], [[-80, 19], [80, 19]], [[80, 19.6], [-80, 19.6]], [[0, 44], [0, 10]], [[-54, 19.4], [-89, 19.4], [-89, -30], [-30, -30], [30, -30], [89, -30], [89, 19.4], [54, 19.4]],
      [[-14, 55], [-14, 65], [14, 65], [14, 55]], [[-40, 120], [-12, 118], [-12, 108], [-40, 108]], [[2, 86], [14, 92], [2, 98]], [[-50, -30], [50, -30]], [[-12, 47], [12, 73]], [[12, 47], [-12, 73]], [[-3, 30], [-30, 19], [-3, 30], [30, 19]]];
    this.walkers = loops.map((pts, i) => ({ x: pts[0][0], z: pts[0][1], y: 0.04, ry: 0, look: c.look(4000 + i * 31, false), path: pts, wi: 1, region: 'out', sp: 0, wt: i }));
    loops.slice(0, 6).forEach((pts, i) => this.walkers.push({ x: pts[pts.length - 1][0], z: pts[pts.length - 1][1], y: 0.04, ry: 0, look: c.look(5000 + i * 37, false), path: pts.slice().reverse(), wi: 1, region: 'out', sp: 0, wt: i * 2 }));
    // talkable folks (Marge at the front desk, members)
    this.marge = this.people.find((p) => p.name === 'Marge'); }
  // ---------------- ambient matches: real AI-vs-AI pickleball on the courts (cheap instanced people) ----------------
  buildAmbient() { this.amb = []; const look = (s) => this.crowd.look(s, false);
    AMBIENT.forEach(([id, dbl], k) => { const C = COURTS[id]; if (!C || (C.dlc && !dillersOwned()) || (C.smashDlc && !smashOwned())) return; const n = dbl ? 4 : 2; const ps = []; for (let i = 0; i < n; i++) ps.push({ ctrl: 'ai', diff: ['easy', 'medium', 'hard', 'medium'][(i + k) % 4] });
      const reg = C.bld ? 'in_' + C.bld : 'out';
      const m = new PB.Match({ doubles: dbl, seed: 77 + k, players: ps }); const figs = m.players.map((p, i) => ({ x: C.x, z: C.z, y: 0.07, ry: 0, look: look(7000 + k * 10 + i), region: reg, sp: 0, wt: i, pick: 0, ambP: p }));
      this.amb.push({ id, C, m, figs, dbl, k, hidden: false, region: reg }); });
    this.padMesh = new THREE.InstancedMesh(paddleGeo(), MATS.g, 32); this.padMesh.castShadow = true; this.padMesh.frustumCulled = false; this.add(this.padMesh);
    this.ballMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.037 * 1.6, 14, 10), new THREE.MeshStandardMaterial({ color: 0xe6ff3b, roughness: 0.45, emissive: 0x3a4a00, emissiveIntensity: 0.4 }), 10); this.ballMesh.castShadow = true; this.ballMesh.frustumCulled = false; this.add(this.ballMesh);
    const pc = [0xef4444, 0x2563eb, 0x22c55e, 0xf97316, 0xa855f7, 0x111827]; const col = new THREE.Color(); for (let i = 0; i < 32; i++) { col.setHex(pc[i % pc.length]); this.padMesh.setColorAt(i, col); } }
  stepAmbient(dt) { const me = this.me, RM = this.world.regionMeshes; let np = 0, nb = 0;
    for (const A of this.amb) { const C = A.C, regVis = A.region === 'out' ? true : !!(RM[A.region] && RM[A.region][0] && RM[A.region][0].visible); const near = regVis && Math.hypot(me.x - C.x, me.z - C.z) < 75 && !A.hidden; A.near = near; if (!near) { A.figs.forEach((f) => f.vis = false); continue; }
      const m = A.m; m.update(dt); if (m.phase === 'over') { A.m = new PB.Match({ doubles: A.dbl, seed: (Math.random() * 1e6) | 0, players: m.players.map((p) => ({ ctrl: 'ai', diff: p.diff })) }); A.figs.forEach((f, i) => f.ambP = A.m.players[i]); }
      A.figs.forEach((f) => { const p = f.ambP; f.x = C.x + p.x; f.z = C.z + p.z; f.ry = p.face; f.sp = p.spd || 0; f.wt = (f.wt || 0) + dt * (2 + f.sp * 4.2); f.pick = p.swingT < 0.35 ? 0.8 - p.swingT * 2 : 0; f.vis = true;
        if (np < 32) { const sw = p.swingT < 0.35 ? Math.sin(p.swingT / 0.35 * PI) : 0, side = -0.34; _e.set(-0.4 - sw * 1.2, p.face + 0.3 - sw * 0.8, 0); _q.setFromEuler(_e); _v.set(f.x + Math.cos(p.face) * -side + Math.sin(p.face) * 0.3, 0.98 + sw * 0.25, f.z - Math.sin(p.face) * -side + Math.cos(p.face) * 0.3); _m.compose(_v, _q, _s.set(1, 1, 1)); this.padMesh.setMatrixAt(np++, _m); } });
      const b = m.ball; if (nb < 10 && (b.live || m.phase === 'serve' || m.phase === 'pre')) { _m.compose(_v.set(C.x + b.x, b.y, C.z + b.z), _q.identity(), _s.set(1, 1, 1)); this.ballMesh.setMatrixAt(nb++, _m); } }
    this.padMesh.count = np; this.padMesh.instanceMatrix.needsUpdate = true; this.ballMesh.count = nb; this.ballMesh.instanceMatrix.needsUpdate = true; }
  // ---------------- the 5 pets + Drive Dillers + Super Smash cameos ----------------
  npc(id, o) { const p = makePet(id, o); p.x = o.at[0]; p.z = o.at[1]; p.y = o.y || 0.07; p.yaw = o.yaw || 0; p.home = [p.x, p.z]; p.walk = o.walk || null; p.wi = 0; p.wait = 0; p.talk = o.talk; p.label = o.label; p.region = o.region; p.root.position.set(p.x, p.y, p.z); p.root.rotation.y = p.yaw; this.add(p.root); this.npcs.push(p); return p; }
  humanNpc(look, o) {
    const rig = makeHuman(look), holder = new THREE.Group(); holder.add(rig.root);
    const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.21, 0.06, 16, 1, false, -PI * 0.55, PI * 1.1), new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 }));
    visor.position.set(0, 1.56, 0.06); holder.add(visor);
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.02), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.5, roughness: 0.3 }));
    badge.position.set(0.12, 1.12, 0.16); holder.add(badge);
    const p = { id: 'lola', kind: 'human', rig, root: holder, x: o.at[0], y: o.y || 0.06, z: o.at[1], yaw: o.yaw || 0, t: 0, speed: 0, home: [o.at[0], o.at[1]], talk: o.talk, label: o.label, region: o.region, name: 'Courts Manager Lola' };
    p.root.position.set(p.x, p.y, p.z); p.root.rotation.y = p.yaw; this.add(p.root); this.npcs.push(p); return p;
  }
  buildPets() { const SP = SPOTS;
    this.torty = this.npc('torty', { at: SP.torty, y: 1.13, yaw: 0, s: 1.15, label: '🐢 Torty\'s shop', region: 'in_shop', talk: () => this.talkTorty() });
    this.luna = this.npc('luna', { at: SP.luna, y: 1.13, yaw: 0, s: 1.25, label: '🐭 Coach Luna: drills', region: 'in_train', talk: () => this.talkLuna() });
    this.snowie = this.npc('snowie', { at: SP.snowie, y: 1.13, yaw: PI / 2, s: 1.25, label: '🐁 Snowie\'s snacks', region: 'in_snack', talk: () => this.talkSnowie() });
    this.pirat = this.npc('pirat', { at: [SP.ump[0], SP.ump[2]], y: SP.ump[1] + 0.06, yaw: PI / 2, s: 1.25, label: '🏴‍☠️ Umpire Pi-rat', region: 'out', talk: () => talk(LINES.pirat) });
    const q = SP.candyPatrol; this.candy = this.npc('candy', { at: q, yaw: 0, s: 1.0, label: '🐶 Candy (ball patrol)', region: 'out', walk: [[q[0], q[1]], [q[0] - 6, q[1] - 2], [q[0] - 5, q[1] + 3.5], [q[0] + 2, q[1] + 3.6], [q[0] + 4, q[1] - 4], [-30, -45], [-24, -50], [-28, -45]], talk: () => this.talkCandy() }); this.candy.carry = true;
    // Drive Dillers Indoor Center cameos
    if (dillersOwned() && SP.snowieDillers) {
      this.snowieDill = this.npc('snowie', { at: SP.snowieDillers, y: 0.56, yaw: -PI / 2, s: 1.32, label: '🐁 Director Snowie (Indoor Tournament)', region: 'in_dillers', talk: () => this.talkSnowieDill() });
      const sVisor = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.21, 0.05, 16, 1, false, -PI * 0.6, PI * 1.2), new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.35 }));
      sVisor.position.set(0, 0.56, 0.06); this.snowieDill.root.add(sVisor);
      const sBow = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 1), new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }));
      sBow.scale.set(1.5, 0.75, 0.6); sBow.position.set(0, 0.63, 0.05); this.snowieDill.root.add(sBow);
      const sPad = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.025), new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.35 }));
      sPad.position.set(0.24, 0.36, 0.14); sPad.rotation.set(0.2, 0, -0.35); this.snowieDill.root.add(sPad);

      this.lola = this.humanNpc({ skin: 1, hair: 1, hairC: 0, shirt: 2, pants: 3 }, { at: SP.lolaDillers, y: 0.08, yaw: PI / 2, label: '👩‍⚖️ Courts Manager Lola', region: 'in_dillers', talk: () => this.talkLola() });
      this.candyDill = this.npc('candy', { at: SP.candyDillers, y: 0.08, yaw: PI / 2, s: 1.15, label: '🐶 Candy (Indoor Ball Inspector)', region: 'in_dillers', talk: () => this.talkCandyDill() });
      this.candyDill.carry = true;
      this.candyStolenBall = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), new THREE.MeshStandardMaterial({ color: 0xe6ff3b, roughness: 0.35, emissive: 0x3a4a00, emissiveIntensity: 0.35 }));
      this.candyStolenBall.position.set(0, 0.44, 0.38); this.candyDill.root.add(this.candyStolenBall);

      this.lunaDill = this.npc('luna', { at: SP.lunaDillers, y: 0.08, yaw: 0, s: 1.22, label: '🐭 Luna (Silent Serve Foam Lab)', region: 'in_dillers', talk: () => this.talkLunaDill() });
      this.tortyDill = this.npc('torty', { at: SP.tortyDillers, y: 0.08, yaw: PI / 2, s: 1.12, label: '🐢 Torty (Drive Diller Pro Gear)', region: 'in_dillers', talk: () => this.talkTortyDill() });
      this.piratDill = this.npc('pirat', { at: SP.piratDillers, y: 1.92, yaw: PI / 2, s: 1.22, label: '🏴‍☠️ Umpire Pi-rat (Center Stage)', region: 'in_dillers', talk: () => talk(LINES.piratDill) });
    }
    // Super Smash Arena cameos (all 5 family pets: Luna, Snowie, Torty, Candy, Pi-rat!)
    if (smashOwned() && SP.lunaSmash) {
      this.lunaSmash = this.npc('luna', { at: SP.lunaSmash, y: 1.14, yaw: -PI / 2, s: 1.28, label: '🐭 Luna (Chief Smash Engineer)', region: 'out', talk: () => this.talkLunaSmash() });
      // Add glowing orange Super Smash goggles + mini Rocket Blaster paddle on Luna!
      const lVisor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.07, 0.08), new THREE.MeshStandardMaterial({ color: 0xff5a1f, emissive: 0xff5a1f, emissiveIntensity: 0.35, roughness: 0.3 }));
      lVisor.position.set(0, 0.54, 0.14); this.lunaSmash.root.add(lVisor);
      const lPad = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.025), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 }));
      lPad.position.set(0.24, 0.36, 0.14); lPad.rotation.set(0.2, 0, -0.35); this.lunaSmash.root.add(lPad);

      this.snowieSmash = this.npc('snowie', { at: SP.snowieSmash, y: 1.14, yaw: -PI / 2, s: 1.26, label: '🐁 Snowie (Smash Cup Host)', region: 'out', talk: () => this.talkSnowieSmash() });
      const snCrown = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.16, 6), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.4, roughness: 0.3 }));
      snCrown.position.set(0, 0.66, 0.04); this.snowieSmash.root.add(snCrown);

      this.tortySmash = this.npc('torty', { at: SP.tortySmash, y: 1.10, yaw: PI, s: 1.18, label: '🐢 Torty (MaxGrit Repair Forge)', region: 'out', talk: () => this.talkTortySmash() });
      this.candySmash = this.npc('candy', { at: SP.candySmash, y: 0.08, yaw: -PI / 2, s: 1.12, label: '🐶 Candy (Smash Ball Hound)', region: 'out', talk: () => this.talkCandySmash() });
      this.candySmash.carry = true;
      const cBall = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshStandardMaterial({ color: 0xff6b2b, roughness: 0.35, emissive: 0xff4500, emissiveIntensity: 0.45 }));
      cBall.position.set(0, 0.44, 0.38); this.candySmash.root.add(cBall);

      this.piratSmash = this.npc('pirat', { at: SP.piratSmash, y: 1.92, yaw: PI / 2, s: 1.25, label: '🏴‍☠️ Umpire Pi-rat (Candy Stadium)', region: 'out', talk: () => talk(LINES.piratSmash) });
    }
  }
  petBusy(id, busy) { for (const k of [id, id + 'Dill', id + 'Smash']) { const p = this[k]; if (p) { p.busy = busy; p.root.visible = !busy; } } }
  talkTorty() { const first = !S.talks.torty; S.talks.torty = 1; persist(); talk(first ? LINES.torty0 : LINES.torty, null, [{ t: '🛠️ Re-Grit & Paddle Repair (' + Math.round(S.padCond ?? 100) + '%)', f: () => this.app.ui.smashForge() }, { t: '🏓 Shop paddles', f: () => this.app.ui.shop('paddle') }, { t: '🟡 Shop balls', f: () => this.app.ui.shop('ball') }, { t: '🧢 Gear', f: () => this.app.ui.shop('gear') }, { t: 'Just looking!', f: () => {} }]); }
  talkLuna() { const first = !S.talks.luna; S.talks.luna = 1; persist(); talk(first ? LINES.luna0 : LINES.luna, null, [{ t: '🎯 Pick a drill', f: () => this.app.ui.drills('train') }, { t: '💥 Super Smash Hub', f: () => this.app.ui.smashHub() }, { t: 'Later, Coach!', f: () => {} }]); }
  talkSnowie() { talk(LINES.snowie, null, [{ t: '🌭 Order a snack', f: () => this.app.ui.snacks() }, { t: 'Just saying hi!', f: () => {} }]); }
  talkCandy() { talk(LINES.candy, () => { sfx('bark'); S.badges.candy = 1; persist(); }); }
  talkSnowieDill() { S.talks.snowieDill = 1; persist(); talk(LINES.snowieDill, null, [{ t: '🏟️ Enter Drive Dillers Tournament', f: () => this.app.ui.dillersTourney() }, { t: '🟠 Indoor Ball Bar (Free Balls)', f: () => this.app.ui.dillersBallBar() }, { t: '🏓 Shop Drive Diller Gear', f: () => this.app.ui.shop('paddle', 'diller') }, { t: 'Squeak on, Snowie!', f: () => {} }]); }
  talkLola() { talk(LINES.lolaDill, null, [{ t: '🧽 Equip Silent Serve Foam Ball', f: () => this.equipIndoorBall('silent') }, { t: '🟠 Equip 26-Hole Indoor Ball', f: () => this.equipIndoorBall('indoor') }, { t: '🏟️ Enter Indoor Tournament', f: () => this.app.ui.dillersTourney() }, { t: 'Got it, Lola!', f: () => {} }]); }
  talkCandyDill() { sfx('bark'); S.badges.candy = 1; persist(); talk(LINES.candyDill, null, [{ t: '🧽 Show Candy a Silent Serve Foam Ball', f: () => this.equipIndoorBall('silent') }, { t: '🟠 Show Candy a 26-Hole Indoor Ball', f: () => this.equipIndoorBall('indoor') }, { t: '🐾 Pet Candy', f: () => toast('🐶 Candy wags her tail happily!') }]); }
  talkLunaDill() { talk(LINES.lunaDill, null, [{ t: '🧽 Grab Silent Serve Foam Ball', f: () => this.equipIndoorBall('silent') }, { t: '🎯 Indoor Drill on Dill Court 1', f: () => this.app.ui.drills('dill1') }, { t: 'Thanks, Luna!', f: () => {} }]); }
  talkTortyDill() { talk(LINES.tortyDill, null, [{ t: '🏓 Drive Diller Pro Paddle', f: () => this.app.ui.shop('paddle', 'diller') }, { t: '🟡 Indoor & Silent Serve Balls', f: () => this.app.ui.dillersBallBar() }, { t: 'Thanks, Torty!', f: () => {} }]); }
  talkLunaSmash() { S.talks.lunaSmash = 1; persist(); talk(LINES.lunaSmash, null, [{ t: '💥 Open Super Smash Hub & Cup', f: () => this.app.ui.smashHub() }, { t: '🌋 Play on Lava Island Court', f: () => this.app.ui.matchSetup('smash_lava') }, { t: '🚀 Play on Moon Base Court', f: () => this.app.ui.matchSetup('smash_moon') }, { t: '🍭 Play on Candy Stadium Court', f: () => this.app.ui.matchSetup('smash_candy') }, { t: 'Thanks, Luna!', f: () => {} }]); }
  talkSnowieSmash() { S.talks.snowieSmash = 1; persist(); talk(LINES.snowieSmash, null, [{ t: '🏆 Enter 3-Round Super Smash Cup', f: () => this.app.ui.smashHub() }, { t: '🎁 Claim Free Starter Smash Gear', f: () => this.claimFreeSmashGear() }, { t: '🏓 Power Paddles Shop', f: () => this.app.ui.shop('paddle', 'maxgrit_smash') }, { t: 'Squeak on, Snowie!', f: () => {} }]); }
  talkTortySmash() { S.talks.tortySmash = 1; persist(); talk(LINES.tortySmash, null, [{ t: '🛠️ MaxGrit Re-Grit & Edge-Guard Forge (' + Math.round(S.padCond ?? 100) + '%)', f: () => this.app.ui.smashForge() }, { t: '🏓 Specialty Power Paddles', f: () => this.app.ui.shop('paddle', 'maxgrit_smash') }, { t: 'Thanks, Torty!', f: () => {} }]); }
  talkCandySmash() { sfx('bark'); S.badges.candy = 1; persist(); talk(LINES.candySmash, null, [{ t: '🟠 Equip Silent Serve Super Foam Ball', f: () => this.claimFreeSmashGear() }, { t: '🍀 Ask Candy for Lucky Golden Ball (+15 🪙 if broke)', f: () => { if (S.coins < 15) { S.coins += 15; persist(); sfx('win'); toast('🐶🍀 Candy dug up a Lucky Golden Pickleball! +15 🪙!'); } else toast('🐶 Candy wags her tail! You have plenty of coins (' + S.coins + ' 🪙)!'); } }, { t: '🐾 Pet Candy', f: () => toast('🐶 Candy bounces a Super Foam ball for you to SMASH!') }]); }
  claimFreeSmashGear() {
    if (!S.own.paddle.includes('rocket')) S.own.paddle.push('rocket');
    if (!S.own.ball.includes('silent_smash')) S.own.ball.push('silent_smash');
    S.eq.paddle = 'rocket';
    S.eq.ball = 'silent_smash';
    S.padCond = 100;
    if (S.smash) S.smash.freebies = true;
    persist(); sfx('buy');
    toast('🚀 Claimed FREE Rocket Blaster Paddle + Silent Serve Super Foam Ball + 100% MaxGrit Tune-Up!');
  }
  equipIndoorBall(id) {
    if (!S.own.ball.includes(id)) S.own.ball.push(id);
    if (!S.own.ball.includes('indoor')) S.own.ball.push('indoor');
    if (!S.own.ball.includes('silent')) S.own.ball.push('silent');
    S.eq.ball = id; if (S.dillers) S.dillers.ball = id; persist(); sfx('buy');
    const b = BALLS.find((x) => x.id === id) || BALLS[1];
    toast('✅ Equipped ' + b.n + '! Courts Manager Lola & Candy approve!');
  }
  // ---------------- Lola + Candy Kick-Out Sequence when you try to use an Outdoor Ball in Drive Dillers! ----------------
  kickOutByLolaAndCandy(ballDef, cfg) {
    sfx('bark'); setTimeout(() => sfx('fault'), 180);
    S.badges.candy = 1; persist();
    this.me.place([46.6, 0.1, 38.0], PI / 2);
    this.cam.yaw = -PI / 2; this.cam.pitch = 0.32; this.cam.snap = true;
    if (this.lola && this.candyDill) {
      this.lola.x = 50.1; this.lola.z = 36.9; this.lola.yaw = -PI / 2; this.lola.region = 'out';
      this.candyDill.x = 49.5; this.candyDill.z = 38.8; this.candyDill.yaw = -PI / 2; this.candyDill.region = 'out';
      if (this.candyStolenBall) {
        this.candyStolenBall.material.color.setHex(ballDef.col || 0xe6ff3b);
        this.candyStolenBall.visible = true;
      }
      this.kickedOutGuard = true;
    }
    this.setVis(true);
    toast('🐶💢 WOOF! WOOF! Candy stole your ' + ballDef.n + ' & Lola kicked you out of Drive Dillers!');
    this.app.ui.lolaKickOut(ballDef, cfg);
  }
  restoreLolaAndCandyInside() {
    if (!this.kickedOutGuard || !this.lola || !this.candyDill) return;
    this.kickedOutGuard = false;
    this.lola.x = SPOTS.lolaDillers[0]; this.lola.z = SPOTS.lolaDillers[1]; this.lola.yaw = PI / 2; this.lola.region = 'in_dillers';
    this.candyDill.x = SPOTS.candyDillers[0]; this.candyDill.z = SPOTS.candyDillers[1]; this.candyDill.yaw = PI / 2; this.candyDill.region = 'in_dillers';
    this.setVis(true);
  }
  // ---------------- interactions ----------------
  buildActs() { const SP = SPOTS, ui = this.app.ui; this.acts = [];
    for (const p of this.npcs) if (p.talk) this.acts.push({ npc: p, r: 2.7, label: p.label, f: p.talk });
    const push = (at, r, label, f, ok) => { if (at) this.acts.push({ x: at[0], z: at[1], r, label, f, ok }); };
    for (const id in COURTS) {
      if (COURTS[id].dlc && !dillersOwned()) continue;
      if (COURTS[id].smashDlc && !smashOwned()) continue;
      const s = SP['court_' + id] || (id === 'center' ? SP.stadium : null);
      if (s) push(s, 2.6, (COURTS[id].kind === 'smash' ? '💥 Smash on ' : '🏓 Play on ') + COURTS[id].n, () => ui.matchSetup(id));
    }
    push(SP.stadiumSign, 2.4, '🏆 Stadium Court', () => ui.matchSetup('center'));
    push(SP.desk, 2.6, '📋 Front desk (Marge)', () => talk(LINES.marge, null, [{ t: '🪜 Park Ladder', f: () => ui.ladder() }, { t: '🏆 Tournaments', f: () => ui.tourneys() }, { t: '💥 Super Smash Cup', f: () => ui.smashHub() }, { t: '📇 My player card', f: () => ui.card() }, { t: 'Thanks!', f: () => {} }]));
    push(SP.ladder, 2.2, '🪜 Park Ladder board', () => ui.ladder()); push(SP.tourney, 2.2, '🏆 Tournament board', () => ui.tourneys());
    push(SP.counter, 2.2, '🛒 Checkout counter', () => this.talkTorty()); push(SP.maxgrit, 2.2, '✨ MaxGrit display', () => ui.shop('paddle', 'maxgrit'));
    push(SP.demo, 2.0, '🎯 Test swing (serve targets)', () => ui.startDrill('serve', 'train'));
    push(SP.drills, 2.2, '🎯 Drill desk', () => ui.drills('train')); push(SP.quietSign, 2.4, '🤫 Quiet practice (foam ball)', () => ui.drills('quiet'));
    push(SP.snack, 2.2, '🌭 Snack counter', () => ui.snacks()); push(SP.pops, 2.0, '🍭 Pickle Pop (3 🪙)', () => this.buyPop());
    push(SP.map, 2.2, '🗺️ Park map (fast travel)', () => ui.map()); push(SP.tickets, 2.0, '🎟️ Ticket booth', () => talk(LINES.tickets));
    push(SP.fountain, 2.4, '🪙 Toss a coin in the Pickle Fountain', () => { if (S.coins < 1) { toast('🪙 You need a coin!'); return; } S.coins -= 1; persist(); sfx('splash'); toast(['🏓 You wished for a perfect third-shot drop.', '✨ The fountain whispers: "Dink responsibly."', '💧 Splash! A pickleball-shaped ripple.', '🍀 Lucky! Next serve will be an ace. (Maybe.)'][(Math.random() * 4) | 0]); });
    push(SP.playground, 2.4, '🛝 Playground', () => toast('🛝 Wheee! The slide is pickle-green.'));
    push(SP.dogrun, 2.6, '🐶 Candy\'s Dog Run', () => toast('🐶 The dogs keep "stealing" pickleballs. Candy approves.'));
    // Drive Dillers Indoor Center interactions
    if (dillersOwned()) {
      push(SP.dillersDesk, 2.6, '🏟️ Drive Dillers Check-In & Tournament', () => ui.dillersTourney());
      push(SP.dillersBracket, 2.5, '🏆 Drive Dillers Tournament Bracket', () => ui.dillersTourney());
      push(SP.dillersBalls, 2.5, '🟠 Indoor Ball Bar (Silent Serve & 26-Hole)', () => ui.dillersBallBar());
      push(SP.dillersJuice, 2.4, '🥤 Dill-ight Smoothie Bar', () => ui.dillersSmoothies());
    } else if (SP.dillersGate) {
      push(SP.dillersGate, 3.0, '🔒 Drive Dillers DLC (75 🎟️ in Arcade)', () => toast('🏟️ Unlock Drive Dillers Expansion (75 tickets) in the Grok Arcade DLC Machine!'));
    }
    // Super Smash Arena interactions
    if (smashOwned()) {
      push(SP.smashDesk, 2.6, '💥 Super Smash Hub & Smash Cup', () => ui.smashHub());
      push(SP.smashBracket, 2.5, '🏆 Super Smash Cup Bracket', () => ui.smashHub());
      push(SP.smashForge, 2.6, '🛠️ Torty\'s MaxGrit Re-Grit & Repair Forge', () => ui.smashForge());
      push(SP.smashPaddles, 2.5, '🏓 Specialty Power Paddles Rack', () => ui.shop('paddle', 'maxgrit_smash'));
    } else if (SP.smashGate) {
      push(SP.smashGate, 3.0, '🔒 Super Smash DLC (75 🎟️ in Arcade)', () => toast('💥 Unlock Super Smash Expansion (75 tickets) in the Grok Arcade DLC Machine!'));
    }
    if (this.marge) this.acts.push({ x: this.marge.x, z: this.marge.z + 2.4, r: 0.1, label: '', f: () => {} }); }
  buyPop() { if (S.coins < 3) { toast('🪙 Pickle Pops cost 3 coins'); sfx('deny'); return; } S.coins -= 3; S.snacks = (S.snacks || 0) + 1; S.buff = 'pop'; persist(); sfx('buy'); toast('🍭 Pickle Pop! +10% hustle next match'); }
  // ---------------- visibility, fades ----------------
  setVis(force) { const me = this.me; const b = this.mv ? null : buildingAt(me.x, me.z);
    if (b && b.id === 'dillers' && this.kickedOutGuard) this.restoreLolaAndCandyInside();
    if (b !== this.inB || force) { this.inB = b; this.app.hud.region(b ? b.name : this.areaName()); this.musicFor(b); }
    const RM = this.world.regionMeshes; const mvB = this.mv ? this.mv.building : null;
    for (const B of BUILDINGS) { const inIt = B === b || B === mvB; (RM['roof_' + B.id] || []).forEach((m) => m.visible = !inIt || this.fp);
      const d = Math.max(0, B.x0 - me.x, me.x - B.x1, B.z0 - me.z, me.z - B.z1); const show = inIt || (d < 26 && !this.fp) || (this.fp && d < 6); (RM['in_' + B.id] || []).forEach((m) => m.visible = show); }
    for (const p of this.npcs) p.root.visible = !p.busy && (!p.region || p.region === 'out' || (RM[p.region] && RM[p.region][0] ? RM[p.region][0].visible : true)); }
  areaName() { const me = this.me; if (me.x < -54 && me.z > 22 && me.z < 80) return '💥 Super Smash Arena'; if (me.x > 34 && me.z > 24 && me.z < 76) return '🏟️ Drive Dillers Avenue'; if (me.z > 100) return '🎟️ Park Entrance'; if (me.z > 42) return '⛲ Pickle Fountain Plaza'; if (me.z > 14 && Math.abs(me.x) < 30) return '🏟️ Stadium Walk'; if (me.z > -12) return me.x < -30 ? '🏓 West Courts' : me.x > 30 ? '🏓 East Courts' : '🏟️ Stadium Court'; if (me.x < -40) return '🤫 Quiet Practice Court'; if (me.x > 40) return '🌙 Night Lights Court'; return '🌳 North Lawn'; }
  musicFor(b) { if (this.mv) return; playMusic(b ? (b.id === 'snack' ? 'kitchen' : b.id === 'shop' ? 'toyroom' : b.id === 'train' || b.id === 'dillers' ? 'garage' : 'living') : 'garden'); }
  fades() { const b = this.inB, c = E.camera.position, me = this.me; _v.set(me.x, me.y + 1.2, me.z).sub(c); const L = _v.length(); _r.set(c, _v.normalize());
    for (const B of BUILDINGS) for (const f of B.fades) { let hide = false; if (B === b && !this.fp && !this.mv) { _b.copy(f.box).expandByScalar(0.05); const p = _r.intersectBox(_b, _s); hide = !!p && c.distanceTo(p) < L - 0.3; } if (hide) { f._h = true; f.meshes.forEach((m) => m.visible = false); } else if (f._h) { f._h = false; f.meshes.forEach((m) => m.visible = true); } } }
  toggleFP() { if (this.mv) { this.mv.toggleFP(); return; } this.fp = !this.fp; S.opts.fp = this.fp; persist(); this.me.setVisible(!this.fp); if (!this.fp) { this.cam.snap = true; E.camera.fov = E.baseFov; E.camera.updateProjectionMatrix(); } else this.fpPitch = -0.08; toast(this.fp ? '👁️ First-person view: drag to look, stick to walk' : '🎥 Third-person view'); this.setVis(true); }
  // ---------------- matches ----------------
  startMatch(cfg) {
    if (this.mv) return;
    const C = COURTS[cfg.court];
    // In Drive Dillers indoor center, ONLY indoor pickleball balls (26-hole / Pro 26) or Silent Serve foam balls are allowed!
    if (C && C.bld === 'dillers') {
      const ballId = cfg.ball || S.eq.ball;
      const ballDef = BALLS.find((b) => b.id === ballId) || BALLS[0];
      if (!ballDef.indoor) {
        this.kickOutByLolaAndCandy(ballDef, cfg);
        return;
      }
    }
    const A = this.amb.find((a) => a.id === cfg.court); if (A) { A.hidden = true; A.figs.forEach((f) => f.vis = false); } this.hiddenAmb = A;
    this.mv = new MatchView(this, cfg); this.me.setVisible(false); this.setVis(true); this.app.hud.region((C.kind === 'smash' || cfg.smashMode ? '💥 ' : '🏓 ') + COURTS[cfg.court].n);
  }
  endMatch() { const mv = this.mv; if (!mv) return; mv.dispose(); this.mv = null; if (this.hiddenAmb) { this.hiddenAmb.hidden = false; this.hiddenAmb = null; } this.me.setVisible(!this.fp); const s = mv.exitSpot; if (s) { this.me.place([s[0], 0.1, s[1]], 0); this.cam.yaw = PI; } this.cam.snap = true; E.camera.fov = E.baseFov; E.camera.updateProjectionMatrix(); this.setVis(true); this.musicFor(this.inB); }
  // ---------------- per-frame ----------------
  update(dt) { this.T += dt; const app = this.app;
    if (this.mv) { this.mv.update(dt); this.common(dt, this.mv.focus()); return; }
    const me = this.me, busy = app.busy || talking(); const mv = busy ? { x: 0, y: 0 } : readMove(); const j = !busy && edge('jump');
    if (edge('view')) this.toggleFP();
    if (this.fp) { if (IN.camDX || IN.camDY) { this.cam.yaw -= IN.camDX * 0.0065; this.fpPitch = Math.max(-1.1, Math.min(1.1, this.fpPitch - IN.camDY * 0.0045)); IN.camDX = IN.camDY = 0; } }
    me.update(dt, { mx: mv.x, my: mv.y, jump: j }, this.world, this.cam.moveYaw); if (this.fp) me.yaw = this.cam.moveYaw;
    this.setVis(); const inside = !!this.inB;
    if (this.fp) { const c = E.camera, yw = this.cam.moveYaw, cp = Math.cos(this.fpPitch); c.position.set(me.x + Math.sin(yw) * 0.12, me.y + 1.62, me.z + Math.cos(yw) * 0.12); c.lookAt(c.position.x + Math.sin(yw) * cp, c.position.y + Math.sin(this.fpPitch), c.position.z + Math.cos(yw) * cp); if (c.fov !== 72) { c.fov = 72; c.updateProjectionMatrix(); } }
    else { this.cam.update(dt, me, inside ? null : this.world, inside ? { dist: 7.6 } : {}); if (inside) this.cam.pitch = Math.max(this.cam.pitch, 0.62); else if (this.cam.pitch > 0.75) this.cam.pitch -= dt * 0.5; }
    this.fades();
    // nearest interaction
    let best = null, bd = 1e9; if (!busy) for (const a of this.acts) { if (!a.label) continue; if (a.ok && !a.ok()) continue; let x = a.x, z = a.z; if (a.npc) { x = a.npc.x; z = a.npc.z; if (!a.npc.root.visible) continue; } const d = Math.hypot(me.x - x, me.z - z); if (d < a.r && d < bd) { bd = d; best = a; } }
    this.act = best; app.hud.setAct(best); if (best && edge('act')) { sfx('click'); best.f(); }
    this.common(dt, me);
  }
  common(dt, focus) { const me = this.me; updateFrustum(E.camera);
    { if (this.sunBase == null) { this.sunBase = E.sun.intensity; this.hemiBase = E.hemi.intensity; } const ind = (this.inB && !this.fp) || (this.mv && this.mv.building) ? 1 : 0; this.indK = (this.indK || 0) + (ind - (this.indK || 0)) * Math.min(1, dt * 5); if (!this.mv || !this.mv.night) { E.sun.intensity = this.sunBase * (1 - 0.55 * this.indK); E.hemi.intensity = this.hemiBase * (1 + 0.45 * this.indK); } }
    // pets + Lola NPC: stroll routes, face you, only animated on screen
    for (const p of this.npcs) { if (p.busy) continue; if (p.walk) { const t = p.walk[p.wi]; const dx = t[0] - p.x, dz = t[1] - p.z, d = Math.hypot(dx, dz); const near = Math.hypot(me.x - p.x, me.z - p.z) < 2.6;
        if (near) p.speed = 0; else if (p.wait > 0) { p.wait -= dt; p.speed = 0; } else if (d < 0.3) { p.wi = (p.wi + 1) % p.walk.length; p.wait = 1.2 + Math.random() * 2; } else { const sp = p.kind === 'tort' ? 0.7 : 1.7; p.x += dx / d * sp * dt; p.z += dz / d * sp * dt; p.yaw = Math.atan2(dx, dz); p.speed = sp; } p.noTurn = !near; }
      if (p.root.visible && inView(p.x, p.y + 0.5, p.z, 1.5)) {
        if (p.kind === 'human') {
          if (focus) { const dx = focus.x - p.x, dz = focus.z - p.z; if (Math.hypot(dx, dz) < 7) { let dy = Math.atan2(dx, dz) - p.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); p.yaw += dy * Math.min(1, dt * 5); } }
          p.root.position.set(p.x, p.y, p.z); p.root.rotation.y = p.yaw;
          animHuman(p.rig, dt, { speed: p.speed || 0, air: false, squash: 0 });
        } else animPet(p, dt, focus);
      } else { p.root.position.set(p.x, p.y, p.z); p.root.rotation.y = p.yaw; } }
    this.stepAmbient(dt); this.drawCrowd(dt);
    this.lightPool.update(dt, focus.x, focus.y || 0, focus.z); followShadow(focus.x, focus.y || 0, focus.z); this.app.hud.update(this); }
  drawCrowd(dt) { const me = this.mv ? this.mv.focus() : this.me, list = [], RM = this.world.regionMeshes; const cheer = this.mv ? this.mv.cheerT > 0 : false;
    for (const A of this.amb) for (const f of A.figs) list.push(f);
    for (const a of this.walkers) { const t = a.path[a.wi]; const dx = t[0] - a.x, dz = t[1] - a.z, d = Math.hypot(dx, dz); if (d < 0.3) a.wi = (a.wi + 1) % a.path.length; else { const sp = 1.3; a.x += dx / d * sp * dt; a.z += dz / d * sp * dt; a.ry = Math.atan2(dx, dz); a.sp = sp; a.wt = (a.wt || 0) + dt * sp * 4.2; } a.vis = (!this.inB || this.fp || !!this.mv) && Math.hypot(a.x - me.x, a.z - me.z) < 80; list.push(a); }
    for (const a of this.people) { a.vis = a.region === 'out' ? Math.hypot(a.x - me.x, a.z - me.z) < 85 : !!(RM[a.region] && RM[a.region][0] && RM[a.region][0].visible); if (a.fan) { const near = this.mv && Math.hypot(a.x - this.mv.C.x, a.z - this.mv.C.z) < 26; a.cheer = cheer && near ? 1 : 0; a.sit = !a.cheer; a.y = a.cheer ? a.base + 0.42 : a.base; } list.push(a); }
    if (this.mv) { const C = this.mv.C; for (const a of this.walkers) if (a.vis && Math.abs(a.x - C.x) < 5.5 && Math.abs(a.z - C.z) < 9.5) a.vis = false; }
    for (const a of list) if (a.vis && !inView(a.x, 1, a.z, 1.4)) a.vis = false;
    { let n = 0; const f = this.mv ? this.mv.focus() : me; for (const a of list) if (a.vis) n++; if (n > 230) { const far = list.filter((a) => a.vis && !a.ambP).sort((a, b) => Math.hypot(b.x - f.x, b.z - f.z) - Math.hypot(a.x - f.x, a.z - f.z)); for (let i = 0; i < n - 230 && i < far.length; i++) far[i].vis = false; } }
    this.crowd.draw(list, [], this.T); }
  // screenshot/debug helper: park the camera somewhere and redraw the crowd for that view
  peek(px, py, pz, tx, ty, tz) { E.camera.position.set(px, py, pz); E.camera.lookAt(tx, ty, tz); updateFrustum(E.camera); this.drawCrowd(0); }
  render(dt) { followShadow(this.me.x, this.me.y, this.me.z); }
  refreshMe() { const p = [this.me.x, this.me.y, this.me.z], y = this.me.yaw; this.me.removeFrom(this.scene); this.me = new Walker(S.look); this.me.addTo(this.scene); this.me.place(p, y); this.me.setVisible(!this.fp && !this.mv); }
  tp(x, z, yaw = PI) { this.me.place([x, 0.1, z], yaw); this.cam.yaw = yaw + PI; this.cam.snap = true; this.setVis(true); }
}
