// Grok Snowie Sky Tours - flying, landing, walking into buildings, tour stops, rescues, ring courses, crash + tow-drone.
import * as THREE from 'three';
import { E, setEnvironment, followShadow } from './engine.js?v=st4';
import { World } from './world.js?v=st4';
import { buildMap, SPOTS, ENV, Hf, TOWNS, PADS, TOURS, RESCUES, ZONES, STAMPS, WATER_Y, LAKE } from './map.js?v=st4';
import { BUILDINGS, buildingAt } from './bld.js?v=st4';
import { Walker } from './walker.js?v=st4';
import { FollowCam } from './cam.js?v=st4';
import { makePet, animPet } from './pets.js?v=st4';
import { makeKitten } from './dogs.js?v=st4';
import { makeHuman, animHuman } from './humans.js?v=st4';
import { readMove, edge, held } from './input.js?v=st4';
import { updateFrustum, inView, LightPool } from './perf.js?v=st4';
import { FX } from './fx.js?v=st4';
import { S, persist } from './save.js?v=st4';
import { sfx } from './audio.js?v=st4';
import { talk, talking, toast } from './uikit.js?v=st4';
import { textGeo } from './text3d.js?v=st4';
import { makeCopter, makeTowDrone, PAINTS } from './copter.js?v=st4';
import { FACTS, LINES, RESCUE_LINES, PET_NAMES, COURSES, goal, LETTERS } from './story.js?v=st4';
import { ROOMS, COTTAGE_IDS } from './rooms.js?v=st4';
import { MG_NAMES } from './mg.js?v=st4';
const PI = Math.PI, wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const _r = new THREE.Ray(), _v = new THREE.Vector3(), _b = new THREE.Box3(), _s = new THREE.Vector3();
const near = [];
function colGeo(g, c, k = 1) { const q = g.clone(); const col = new THREE.Color(c); const n = q.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = col.r * k; a[i * 3 + 1] = col.g * k; a[i * 3 + 2] = col.b * k; } q.setAttribute('color', new THREE.BufferAttribute(a, 3)); return q; }
export class Game {
  constructor(app) {
    this.app = app; this.scene = E.scene; this.T = 0; this.mode = 'fly'; this.race = null; this.detT = 0;
    const w = this.world = new World(); { const R = E.renderer, rt = new THREE.WebGLRenderTarget(4, 4), sc = new THREE.Scene(); w.uploader = (m) => { const fc = m.frustumCulled; m.frustumCulled = false; const par = m.parent; sc.add(m); const prev = R.getRenderTarget(), sm = R.shadowMap.autoUpdate; R.shadowMap.autoUpdate = false; R.setRenderTarget(rt); R.render(sc, E.camera); R.setRenderTarget(prev); R.shadowMap.autoUpdate = sm; sc.remove(m); if (par) par.add(m); m.frustumCulled = fc; }; w._upRT = rt; }
    buildMap(w); w.finalize(this.scene); w.uploader = null; w._upRT.dispose();
    { const wm = new THREE.Mesh(new THREE.PlaneGeometry(1100, 1100, 1, 1).rotateX(-PI / 2), new THREE.MeshStandardMaterial({ color: 0x1e90e8, roughness: 0.12, metalness: 0.05, transparent: true, opacity: 0.88 })); wm.position.y = WATER_Y; wm.receiveShadow = true; wm.renderOrder = 1; this.scene.add(wm); this.water = wm; }
    setEnvironment(ENV); this.lightPool = new LightPool(this.scene, w.lights, 4); this.fx = new FX(this.scene);
    // the copter (starts parked on Pad A), the tow-drone, and you
    const c = this.cop = makeCopter(S.paint, S.look); this.scene.add(c.root); const p0 = PADS[0]; c.x = p0.x; c.z = p0.z; c.y = p0.y; c.yaw = PI; c.mode = 'ground'; c.onPad = p0;
    this.drone = makeTowDrone(); this.drone.root.visible = false; this.scene.add(this.drone.root); this.tow = null;
    this.me = new Walker(S.look); this.me.addTo(this.scene); this.me.setVisible(false); this.me.place([p0.x + 4, p0.y, p0.z], PI);
    this.cam = new FollowCam(); this.cam.yaw = 0; this.cam.pitch = 0.3; this.cam.snap = true;
    this.inB = null; this.acts = []; this.act = null; this.npcs = [];
    this.buildNpcs(); this.buildRescues(); this.buildMarkers(); this.buildRings(); this.buildArrow(); this.buildPostcards(); this.buildStamps(); this.buildActs(); this.syncCopter(0); this.setVis(true);
  }
  add(o) { this.scene.add(o); return o; }
  // ---------------- characters ----------------
  npc(id, o) { const p = o.human ? { id, kind: 'human', rig: makeHuman(o.look), root: new THREE.Group(), t: 0, speed: 0, mode: 'idle' } : makePet(id, o); if (o.human) p.root.add(p.rig.root);
    p.x = o.at[0]; p.z = o.at[1]; p.y = o.y != null ? o.y : 0.02; p.yaw = o.yaw || 0; p.walk = o.walk || null; p.wi = 0; p.wait = 0; p.talk = o.talk; p.label = o.label; p.mode = o.mode || p.mode; if (o.noTurn) p.noTurn = true; this.add(p.root); this.npcs.push(p); return p; }
  buildNpcs() { const hub = TOWNS.hub, pup = TOWNS.pup, tt = TOWNS.tort, np = TOWNS.np;
    this.snowieN = this.npc('snowie', { at: SPOTS.snowie, y: 1.2, yaw: 0, s: 1.25, label: '💬 Talk to Snowie', talk: () => this.talkSnowie() });
    this.npc('pat', { human: true, look: { skin: 3, hair: 1, hairC: 0, shirt: 6, pants: 1 }, at: [12, 20], walk: [[12, 20], [-12, 20], [-12, 30], [12, 30]], label: '💬 Say hi', talk: () => talk([['Pilot Pat', 'I fly the morning cloud tours. Pro tip: if you fly through a cloud, you come out fluffier.']]) });
    this.npc('cream', { at: [24, -22], yaw: PI, s: 1.2, label: '💬 Say hi', talk: () => talk([['Mechanic Brie', 'The tow-drone docks right here. It has towed 1,204 copters and dropped zero! Well... one. It was a rubber duck delivery.']]) });
    this.candyN = this.npc('candy', { at: SPOTS.candy, y: 0.1, yaw: -0.4, mode: 'sleep', noTurn: true, label: '💤 Candy (napping)', talk: () => { const a = !!S.talks.candy; S.talks.candy = 1; persist(); talk(a ? LINES.candyAwake : LINES.candy); } });
    { const x = SPOTS.candy[0], z = SPOTS.candy[1]; this.candyMat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 1.05), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.9 })); this.candyMat.position.set(x, 0.06, z); this.add(this.candyMat); }
    this.npc('mayor', { breed: 'golden', collar: 0xdc2626, s: 0.85, at: SPOTS.mayor, yaw: 0, label: '💬 Talk to Mayor Goldie', talk: () => talk(LINES.mayor) });
    this.npc('baker', { breed: 'dalmatian', collar: 0xf472b6, s: 0.85, at: SPOTS.baker, yaw: -PI / 2, label: '💬 Talk to Baker Dot', talk: () => talk(LINES.baker) });
    [['corgi', [[pup.x - 14, pup.z + 10], [pup.x + 14, pup.z + 10], [pup.x + 14, pup.z - 10]]], ['beagle', [[pup.x - 20, pup.z - 6], [pup.x - 8, pup.z - 16], [pup.x - 20, pup.z - 16]]], ['shiba', [[pup.x - 40, pup.z + 36], [pup.x - 34, pup.z + 44], [pup.x - 46, pup.z + 44]]], ['pomeranian', [[pup.x + 6, pup.z + 30], [pup.x + 6, pup.z + 50], [pup.x - 6, pup.z + 40]]]].forEach(([br, walk], i) => this.npc('pdog' + i, { breed: br, s: 0.75, seed: i * 3 + 2, at: walk[0], walk, label: '💬 Say hi', talk: () => talk([[['Rusty', 'Bean', 'Kiko', 'Puff'][i], ['Did you see the copter? I barked at it. It did not bark back. Rude.', 'The Barkery\'s Pup-Tarts are the best thing in the whole world. After naps.', 'I fetched a stick from the lake once. Pi-rat says it was his oar.', 'Snowie gave me a ride once! I was very brave. I only howled a little.'][i]]]) }));
    this.npc('torty', { at: SPOTS.torty, yaw: 0, s: 1.0, label: '💬 Talk to Torty', talk: () => talk(LINES.torty) });
    this.npc('luna', { at: SPOTS.luna, y: 1.1, yaw: 0, s: 1.25, label: '💬 Talk to Luna', talk: () => talk(LINES.luna) });
    [[[tt.x - 10, tt.z + 10], [tt.x + 10, tt.z + 10], [tt.x + 10, tt.z - 10], [tt.x - 10, tt.z - 10]], [[tt.x + 18, tt.z + 30], [tt.x + 30, tt.z + 30]]].forEach((walk, i) => this.npc('tt' + i, { s: 0.6, at: walk[0], walk, label: '💬 Say hi', talk: () => talk([[['Shelly', 'Old Mossback'][i], ['Torty is my hero. Torty once fell off the museum roof and just kept walking.', 'Back in my day, copters were slower. Like me. Good times.'][i]]]) }));
    this.tts = this.npcs.slice(-2); this.tts.forEach((p) => { p.root.remove(p.rig.root); const r = makePet('torty', { s: 0.6 }); p.rig = r.rig; p.kind = 'tort'; p.root.add(r.rig.root); });
    this.npc('ginger', { at: [tt.x - 6, tt.z + 18], walk: [[tt.x - 6, tt.z + 18], [tt.x - 30, tt.z + 18]], s: 1.1, label: '💬 Say hi', talk: () => talk([['Cheddar', 'I\'m on lunch break from Luna\'s shop. Did you know the Torty statue has a hidden cheese inside? I made that up. But imagine.']]) });
    this.npc('elf', { at: SPOTS.elf, s: 1.2, yaw: 0, label: '💬 Talk to Tinsel', talk: () => talk(LINES.elf, null, [{ t: '🎁 Wrap a toy', f: () => this.wrapToy() }, { t: 'Later!', f: () => {} }]) }); this.npcs[this.npcs.length - 1].root.remove(this.npcs[this.npcs.length - 1].rig.root);
    { const p = this.npcs[this.npcs.length - 1]; const r = makePet('ginger', { s: 1.2, extras: ['glasses', 'bow'] }); p.rig = r.rig; p.kind = 'rat'; p.root.add(r.rig.root); }
    this.npc('marsh', { at: SPOTS.marsh, y: 1.05, s: 1.2, yaw: -PI / 2, label: '💬 Talk to Marsh', talk: () => talk(LINES.marsh, null, [{ t: '☕ Hot cocoa please!', f: () => this.cocoa() }, { t: 'Just warming up', f: () => {} }]) });
    [['husky', [[np.x - 12, np.z + 6], [np.x + 12, np.z + 6], [np.x, np.z - 14]]], ['sheepdog', [[np.x + 12, np.z - 10], [np.x + 20, np.z - 20], [np.x + 6, np.z - 22]]]].forEach(([br, walk], i) => this.npc('ndog' + i, { breed: br, s: 0.8, at: walk[0], walk, label: '💬 Say hi', talk: () => talk([[['Blizzard', 'Mop'][i], ['Snow is just cold sand you can eat! Best village ever.', 'I can\'t see the copter through my fur but I can HEAR it. Whup whup whup!'][i]]]) }));
    this.piratN = this.npc('pirat', { at: [SPOTS.pirat[0], SPOTS.pirat[1]], y: SPOTS.pirat[2] + 0.02, yaw: PI, s: 1.3, label: '💬 Talk to Pi-rat', talk: () => talk(LINES.pirat) });
    // building residents, staff and visitors (only drawn while you're in their building)
    for (const o of ROOMS.npcs) { const ch = o.mg ? [{ t: `${MG_NAMES[o.mg][0]} Play ${MG_NAMES[o.mg][1]}`, f: () => this.mg(o.mg) }, { t: 'Later!', f: () => {} }] : null;
      const p = this.npc(o.pet || o.id, Object.assign({}, o, { label: `💬 ${o.name}`, talk: () => talk(o.lines, null, ch || undefined) })); p.room = o.room; }
    // every NPC gets a cached home position for visibility checks
    for (const p of this.npcs) p.home = [p.x, p.z];
  }
  talkSnowie() { if (!S.talks.snowie) { S.talks.snowie = 1; persist(); talk(LINES.snowie0); return; } talk(LINES.snowie, null, [{ t: '🗺️ Open map', f: () => this.app.ui.map() }, { t: '📮 My postcards', f: () => this.app.ui.postcards() }, { t: 'Thanks!', f: () => {} }]); }
  wrapToy() { S.stats.wraps = (S.stats.wraps || 0) + 1; persist(); sfx('win'); this.fx.confetti(this.me.x, this.me.y + 1.5, this.me.z, 40); toast(`🎁 Toy wrapped! (${S.stats.wraps} so far)`); }
  cocoa() { sfx('ding'); toast('☕ Cocoa with tiny marshmallow rats. Warm and toasty!'); this.fx.burst(this.me.x, this.me.y + 1.6, this.me.z, 0xffffff, 10, 2); }
  // ---------------- rescues ----------------
  buildRescues() { this.rpets = {}; const hg = textGeo('HELP!', 0.5, 0.12);
    for (const r of RESCUES) { let p; if (r.kind === 'kitten') { const k = makeKitten(); p = { root: new THREE.Group(), rig: k, kind: 'kitten', t: 0, speed: 0, mode: 'idle', x: 0, y: 0, z: 0, yaw: 0 }; k.root.scale.setScalar(2.2); p.root.add(k.root); }
      else if (r.kind === 'hatch') { p = makePet('torty', { s: 0.42 }); } else if (r.kind === 'husky' || r.kind === 'beagle') { p = makePet(r.id, { breed: r.kind, s: 0.6 }); } else { p = makePet(r.kind, { s: 0.95 }); }
      p.x = r.x; p.z = r.z; p.y = r.y + 0.02; p.yaw = 0; p.r = r; this.add(p.root); this.rpets[r.id] = p;
      if (hg) { const m = new THREE.Mesh(colGeo(hg, 0xff3b6b, 1.6), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); m.position.set(r.x, r.y + 2.4, r.z); this.add(m); p.help = m; }
      // rescued pets live in their home town afterwards
      if (S.rescues.includes(r.id)) this.homePet(p); }
    if (S.carry) { const p = this.rpets[S.carry]; if (p) this.seatPet(p); } }
  homePet(p) { const pad = PADS.find((q) => q.town === p.r.home); const a = (Object.keys(this.rpets).indexOf(p.r.id) + 1) * 1.1; p.x = pad.x + Math.cos(a) * 8; p.z = pad.z + Math.sin(a) * 8; p.y = 0.02; if (p.root.parent !== this.scene) { p.root.parent && p.root.parent.remove(p.root); this.scene.add(p.root); } p.root.scale.setScalar(1); p.home = true; if (p.help) p.help.visible = false; }
  seatPet(p) { if (p.help) p.help.visible = false; this.scene.remove(p.root); this.cop.tilt.add(p.root); p.root.position.set(0, 1.2, -0.7); p.root.rotation.set(0, 0, 0); p.root.scale.setScalar(0.8); p.seated = true; }
  // ---------------- tour markers, rings, arrow, postcards ----------------
  buildMarkers() { this.marks = {}; const mat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    const g = new THREE.Group(); const body = new THREE.Mesh(colGeo(new THREE.BoxGeometry(3.2, 2.2, 1.4), 0xff4fa0, 1.4), mat); const lens = new THREE.Mesh(colGeo(new THREE.CylinderGeometry(0.75, 0.75, 1, 24).rotateX(PI / 2), 0xffffff, 1.6), mat); lens.position.z = 0.9; const fl = new THREE.Mesh(colGeo(new THREE.BoxGeometry(0.8, 0.5, 0.6), 0xffd23f, 1.8), mat); fl.position.set(-0.9, 1.3, 0); g.add(body, lens, fl);
    for (const t of TOURS) { const m = g.clone(); m.position.set(t.x, t.y + 7, t.z); this.add(m); this.marks[t.id] = m; m.visible = !S.tours.includes(t.id); } }
  buildRings() { this.ringG = new THREE.TorusGeometry(6, 0.5, 12, 48); this.rM = { dim: new THREE.MeshBasicMaterial({ color: 0xff4fa0, toneMapped: false, transparent: true, opacity: 0.55 }), next: new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd23f).multiplyScalar(1.8), toneMapped: false }), start: new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3ff0ff).multiplyScalar(1.6), toneMapped: false }) };
    const sg = textGeo('START', 1.2, 0.3);
    for (const c of COURSES) { c.rings = c.pts.map((p, i) => { const m = new THREE.Mesh(this.ringG, this.rM.dim); m.position.set(p[0], p[1], p[2]); const q = c.pts[Math.min(i + 1, c.pts.length - 1)], pr = c.pts[Math.max(0, i - 1)]; const t = i < c.pts.length - 1 ? q : p, f = i < c.pts.length - 1 ? p : pr; m.lookAt(t[0] + (p[0] - f[0]) * 0, t[1], t[2]); if (i === c.pts.length - 1) m.lookAt(2 * p[0] - pr[0], 2 * p[1] - pr[1], 2 * p[2] - pr[2]); this.add(m); return m; });
      if (sg) { const t = new THREE.Mesh(colGeo(sg, 0x3ff0ff, 1.5), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); t.position.set(c.pts[0][0], c.pts[0][1] + 7.5, c.pts[0][2]); t.quaternion.copy(c.rings[0].quaternion); t.rotateY(PI); this.add(t); c.label = t; } }
    this.showRings(); }
  showRings() { for (const c of COURSES) c.rings.forEach((m, i) => { if (this.race) { m.visible = this.race.c === c && i >= this.race.i; m.material = i === this.race.i ? this.rM.next : this.rM.dim; } else { m.visible = i === 0; m.material = this.rM.start; } if (c.label) c.label.visible = !this.race; }); }
  buildArrow() { const g = new THREE.Group(); const mat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }); const a = new THREE.Mesh(colGeo(new THREE.ConeGeometry(0.7, 1.8, 20).rotateX(PI / 2).translate(0, 0, 1.2), 0xff4fa0, 1.5), mat); const s = new THREE.Mesh(colGeo(new THREE.CylinderGeometry(0.25, 0.25, 1.6, 12).rotateX(PI / 2), 0xff4fa0, 1.3), mat); g.add(a, s); this.arrow = g; this.add(g); }
  buildPostcards() { this.cards = []; const cols = [0xff4fa0, 0x3ff0ff, 0xffd23f, 0x4ade80, 0xa78bfa, 0xff7a3d, 0xf472b6, 0x60a5fa, 0xfacc15, 0x34d399]; TOURS.forEach((t, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.75, 0.04), new THREE.MeshStandardMaterial({ color: cols[i], roughness: 0.5 })); m.position.set(-28.5 + (i % 5) * 1.5, 1.6 + (i / 5 | 0) * 1.3, -31.62); m.visible = S.tours.includes(t.id); this.add(m); this.cards.push(m); }); }
  buildStamps() { this.stampM = {}; const mk = (top) => { const g = new THREE.Group(); const m1 = new THREE.MeshStandardMaterial({ color: 0x7c3f2c, roughness: 0.6 }), m2 = new THREE.MeshStandardMaterial({ color: top, roughness: 0.35, metalness: 0.2 }), m3 = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
      const a = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 1.0, 20), m1); a.position.y = 0.5; const b = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 24), m2); b.position.y = 1.04; const h = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.22, 16), m3); h.position.y = 1.2; const k = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 8), m3); k.position.y = 1.42; const n = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), m3); n.position.y = 1.58; g.add(a, b, h, k, n); g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
    for (const s of STAMPS) { const g = mk(S.stamps.includes(s.id) ? 0xffd23f : 0xe5e7eb); g.position.set(s.at[0], s.at[2] || 0, s.at[1]); this.add(g); this.stampM[s.id] = g; this.world.solid(s.at[0] - 0.4, (s.at[2] || 0), s.at[1] - 0.4, s.at[0] + 0.4, (s.at[2] || 0) + 1.1, s.at[1] + 0.4); } }
  // ---------------- interactions ----------------
  buildActs() { this.acts = []; for (const p of this.npcs) if (p.talk) this.acts.push({ npc: p, r: 2.6, label: p.label, f: p.talk, walk: true });
    const push = (x, z, r, label, f, ok, y) => this.acts.push({ x, z, y, r, label, f, ok, walk: true });
    for (const s of STAMPS) push(s.at[0], s.at[1], 2.4, '🛂 Stamp your Sky Passport', () => this.stamp(s), () => !S.stamps.includes(s.id), s.at[2]);
    push(SPOTS.paint[0], SPOTS.paint[1], 3, '🎨 Paint shop', () => this.app.ui.paint());
    push(SPOTS.maptable[0], SPOTS.maptable[1], 2.6, '🗺️ Map table', () => this.app.ui.map());
    push(SPOTS.postcards[0], SPOTS.postcards[1], 2.6, '📮 Postcard wall', () => this.app.ui.postcards());
    push(SPOTS.treat[0], SPOTS.treat[1], 2.4, '🦴 Grab a Pup-Tart', () => { sfx('crumb'); S.stats.treats = (S.stats.treats || 0) + 1; persist(); toast('🦴 Pup-Tart! Peanut-buttery. You feel zoomy.'); this.me.zoom = 8; });
    push(SPOTS.wrap[0], SPOTS.wrap[1], 2.4, '🎁 Wrap a toy', () => this.wrapToy());
    push(SPOTS.cocoa[0], SPOTS.cocoa[1], 2.4, '☕ Hot cocoa', () => this.cocoa());
    push(SPOTS.log[0], SPOTS.log[1], 2.6, '📒 Pilot\'s log', () => this.app.pause());
    push(SPOTS.dogpark[0], SPOTS.dogpark[1], 4, '🎾 Throw a ball', () => { sfx('bark'); toast('🎾 Fetch! Every dog in the park went zooming.'); this.fx.burst(this.me.x, this.me.y + 1, this.me.z, 0xfacc15, 8, 3); });
    for (const a of ROOMS.acts) push(a.x, a.z, a.r, a.label, () => { if (a.mg) this.mg(a.mg); else if (a.chore) this.chore(a.chore); else if (a.talk) talk(a.talk); else if (a.letter) this.letter(); });
    this.acts.push({ board: true, r: 3.6, label: '🚁 Board the copter', f: () => this.board(), walk: true }); }
  mg(id) { const app = this.app; app.paused = true; app.busy = true; app.ui.minigame(id, () => app.resume()); }
  chore(c) { const first = c.helped && !S.helped.includes(c.id); if (first) { S.helped.push(c.id); persist(); } sfx(first ? 'win' : 'ding'); this.fx.burst(this.me.x, this.me.y + 1.4, this.me.z, c.fx || 0xffd23f, first ? 18 : 8, 2.5); if (c.zoom) this.me.zoom = c.zoom;
    toast(c.msg + (first ? ` (Neighbors helped ${S.helped.length}/${COTTAGE_IDS.length})` : '')); if (first && S.helped.length >= COTTAGE_IDS.length && !S.badges.neighbor) { S.badges.neighbor = 1; persist(); setTimeout(() => toast('🏅 Badge: Good Neighbor (helped every home in the valley)'), 1200); } }
  letter() { this.li = ((this.li == null ? Math.random() * LETTERS.length : this.li) + 1) | 0; talk([LETTERS[this.li % LETTERS.length]]); sfx('click'); }
  stamp(s) { if (!S.stamps.includes(s.id)) { S.stamps.push(s.id); persist(); sfx('check'); const sm = this.stampM[s.id]; if (sm) sm.children[1].material.color.set(0xffd23f); this.fx.burst(s.at[0], (s.at[2] || 0) + 1.3, s.at[1], 0xffd23f, 12, 3); toast(`🛂 Passport stamped: ${s.name} (${S.stamps.length}/${STAMPS.length})`); if (S.stamps.length >= STAMPS.length && !S.badges.globe) { S.badges.globe = 1; persist(); setTimeout(() => toast('🏅 Badge: Globetrotter'), 900); } } }
  board() { this.mode = 'fly'; this.me.setVisible(false); this.cam.snap = true; this.cam.yaw = this.cop.yaw + PI; this.cam.pitch = 0.3; sfx('door'); this.inB = null; this.setVis(true); }
  hopOut() { const c = this.cop, pad = c.onPad; this.mode = 'walk'; const sx = Math.cos(c.yaw), sz = -Math.sin(c.yaw); const off = pad && pad.small ? 2.2 : 3.6; this.me.place([c.x - sx * off, c.y + 0.1, c.z - sz * off], c.yaw); this.me.setVisible(true); this.zone = this.zoneFor(this.me.x, this.me.z); this.cam.snap = true; this.cam.yaw = c.yaw + PI; this.cam.pitch = 0.32; sfx('door');
    if (pad && pad.town === 'hub' && !S.talks.hop) { S.talks.hop = 1; persist(); toast('🚪 Walk into any building! Snowie\'s office is just north.'); } }
  zoneFor(x, z) { let best = null, bd = 1e9; for (const q of ZONES) { const d = q.rect ? Math.max(q.rect[0] - x, x - q.rect[2], q.rect[1] - z, z - q.rect[3], 0) : Math.max(0, Math.hypot(x - q.x, z - q.z) - q.r); if (d < bd) { bd = d; best = q; } } return best; }
  // ---------------- flying ----------------
  groundAt(x, z, y) { const t = Hf(x, z); const g = this.world.ground(x, z, y + 0.7, 1.1); let gy = t, water = false; if (t < WATER_Y) { gy = WATER_Y; water = true; } if (g.s && g.y >= gy - 0.01) { gy = g.y; water = false; } return { y: gy, water }; }
  flyUpdate(dt, busy) { const c = this.cop; c.t += dt;
    if (c.mode === 'crash') return this.crashUpdate(dt); if (c.mode === 'tow') return this.towUpdate(dt);
    const mv = busy ? { x: 0, y: 0 } : readMove(), up = !busy && held('jump'), down = !busy && held('spin'); const cy = this.cam.moveYaw;
    const dx = Math.sin(cy) * mv.y - Math.cos(cy) * mv.x, dz = Math.cos(cy) * mv.y + Math.sin(cy) * mv.x;
    if (c.mode === 'ground') { c.vx = c.vz = 0; c.vy = 0; c.spin = Math.max(0, c.spin - dt * 0.6); if (up || (Math.hypot(mv.x, mv.y) > 0.5 && c.spin > 0.2)) { c.mode = 'fly'; c.onPad = null; c.vy = 3; S.stats.flights++; persist(); sfx('glide'); if (!S.talks.snowie) { S.talks.snowie = 1; persist(); toast('🐁 Snowie: Wheee! Follow the pink arrow to our first tour stop!'); } } else if (Math.hypot(mv.x, mv.y) > 0.5) c.spin = Math.min(1, c.spin + dt); }
    else { c.spin = Math.min(1, c.spin + dt * 1.5); const MAX = 30, k = 1 - Math.exp(-1.4 * dt); c.vx += (dx * MAX - c.vx) * k; c.vz += (dz * MAX - c.vz) * k; const tvy = up ? 11 : down ? -10 : 0; c.vy += (tvy - c.vy) * (1 - Math.exp(-3 * dt)); if (c.y > 175 && c.vy > 0) c.vy = 0;
      const ox = c.x, oz = c.z; c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt; const lim = 500; c.x = Math.max(-lim, Math.min(lim, c.x)); c.z = Math.max(-lim, Math.min(lim, c.z));
      const hs = Math.hypot(c.vx, c.vz); if (hs > 2) { const want = Math.atan2(c.vx, c.vz); c.turn = wrap(want - c.yaw); c.yaw += c.turn * Math.min(1, dt * 2.2); } else c.turn = 0;
      // walls / big props
      const L = this.world.near(c.x - 2, c.z - 2, c.x + 2, c.z + 2, near); for (const s of L) { if (s.nofloor && s.floor) continue; const y0 = c.y + 0.4, y1 = c.y + 3.0; if (c.x + 1.5 < s.min[0] || c.x - 1.5 > s.max[0] || c.z + 1.5 < s.min[2] || c.z - 1.5 > s.max[2] || y1 < s.min[1] || y0 > s.max[1]) continue; if (s.max[1] - c.y < 0.9) continue;
        if (hs > 13) return this.crash('bonk'); const pen = [[c.x + 1.5 - s.min[0], -1, 0], [s.max[0] - (c.x - 1.5), 1, 0], [c.z + 1.5 - s.min[2], -1, 2], [s.max[2] - (c.z - 1.5), 1, 2]].sort((a, b) => a[0] - b[0])[0]; if (pen[2] === 0) { c.x += pen[1] * pen[0]; c.vx = 0; } else { c.z += pen[1] * pen[0]; c.vz = 0; } }
      // ground / water contact
      const G = this.groundAt(c.x, c.z, c.y); if (c.y <= G.y) { const imp = -c.vy; if (G.water) return this.crash('splash'); if (imp > 11 || hs > 18) return this.crash('bonk'); c.y = G.y; if (c.vy < 0) c.vy = 0; c.vx *= Math.exp(-6 * dt); c.vz *= Math.exp(-6 * dt);
        if (!up && hs < 7) { c.mode = 'ground'; c.vx = c.vz = 0; S.stats.landings++; persist(); sfx('land'); this.fx.puff(c.x, c.y, c.z, 10, 0xf5f0e6); c.onPad = PADS.find((p) => Math.hypot(p.x - c.x, p.z - c.z) < (p.small ? 3.5 : 6.2) && Math.abs(p.y - c.y) < 0.8) || null; this.onLand(); } }
      S.stats.km += Math.hypot(c.x - ox, c.z - oz) / 1000; }
    this.syncCopter(dt); }
  onLand() { const c = this.cop; if (this.race) { this.race = null; this.showRings(); toast('🏁 Course cancelled (you landed)'); }
    if (c.onPad && S.carry) { const r = RESCUES.find((q) => q.id === S.carry); if (r && c.onPad.town === r.home) this.dropOff(r); }
    if (c.onPad) toast(`🛬 Landed: ${c.onPad.name}${c.onPad.walk ? '. Tap 🚪 to hop out!' : ''}`); }
  syncCopter(dt) { const c = this.cop; const hs = Math.hypot(c.vx, c.vz); const fwd = (c.vx * Math.sin(c.yaw) + c.vz * Math.cos(c.yaw)) / 30;
    if (c.mode !== 'crash') { c.pitchV += ((c.mode === 'fly' ? fwd * 0.32 : 0) - c.pitchV) * Math.min(1, dt * 4); c.rollV += ((c.mode === 'fly' ? -(c.turn || 0) * 0.35 * Math.min(1, hs / 10) : 0) - c.rollV) * Math.min(1, dt * 4); }
    c.root.position.set(c.x, c.y + (c.mode === 'fly' ? Math.sin(c.t * 2.2) * 0.06 : 0), c.z); c.root.rotation.y = c.yaw; c.tilt.rotation.set(c.pitchV, 0, c.rollV);
    c.rotor.rotation.y += dt * (4 + c.spin * 40); c.tail.rotation.x += dt * (6 + c.spin * 50); c.disc.material.opacity = c.spin * 0.16; c.disc.visible = c.spin > 0.05;
    if (c.snowie && inView(c.x, c.y + 1, c.z, 4)) animPet(c.snowie, dt, null); }
  crash(kind) { const c = this.cop; c.mode = 'crash'; c.ct = 0; c.kind = kind; S.crashes++; persist(); if (this.race) { this.race = null; this.showRings(); }
    if (kind === 'splash') { sfx('splash'); this.fx.splash(c.x, WATER_Y, c.z); toast('💦 SPLASH! Floaties deployed. Everyone\'s okay!'); c.vy = 0; c.y = WATER_Y - 0.2; } else { sfx('bosshit'); this.fx.burst(c.x, c.y + 1.5, c.z, 0xffd23f, 22, 7); this.fx.puff(c.x, c.y + 1, c.z, 14, 0x9ca3af); toast('💥 BONK! Airbags out. Everyone\'s okay!'); c.vy = 6; } c.vx *= 0.3; c.vz *= 0.3; }
  crashUpdate(dt) { const c = this.cop; c.ct += dt; c.spin = Math.max(0, c.spin - dt * 0.8);
    if (c.kind === 'splash') { c.y = WATER_Y - 0.25 + Math.sin(c.ct * 3) * 0.12; c.pitchV = Math.sin(c.ct * 2) * 0.08; c.rollV = 0.15 + Math.sin(c.ct * 2.6) * 0.1; c.vx *= Math.exp(-2 * dt); c.vz *= Math.exp(-2 * dt); c.x += c.vx * dt; c.z += c.vz * dt; if (c.ct % 0.3 < dt) this.fx.puff(c.x, WATER_Y, c.z, 3, 0xdff6ff); }
    else { c.vy -= 25 * dt; c.x += c.vx * dt; c.z += c.vz * dt; c.y += c.vy * dt; const G = this.groundAt(c.x, c.z, c.y + 1); if (c.y <= G.y) { c.y = G.y; if (c.vy < -3) { c.vy = -c.vy * 0.3; sfx('bounce'); this.fx.puff(c.x, c.y, c.z, 8, 0xd6d3d1); } else c.vy = 0; c.vx *= Math.exp(-4 * dt); c.vz *= Math.exp(-4 * dt); }
      const k = Math.max(0, 1 - c.ct / 1.4); c.yaw += dt * 7 * k; c.rollV = Math.min(0.5, c.rollV + dt * 0.8) * (c.ct > 1.4 ? 1 : 1); c.pitchV = Math.sin(c.ct * 9) * 0.25 * k; if (c.ct % 0.25 < dt) this.fx.puff(c.x, c.y + 2.5, c.z, 2, 0x9ca3af); }
    if (c.ct > 1.8 && !this.tow) this.startTow(); this.syncCopter(dt); }
  startTow() { const c = this.cop, d = this.drone; let best = null, bd = 1e9; for (const p of PADS) { if (p.town === 'ship') continue; const dd = Math.hypot(p.x - c.x, p.z - c.z); if (dd < bd) { bd = dd; best = p; } }
    this.tow = { ph: 'in', t: 0, pad: best, from: [c.x, c.y, c.z] }; d.root.visible = true; d.root.position.set(c.x + 30, c.y + 40, c.z + 20); c.mode = 'tow'; toast('🛸 Tow-drone on the way!'); sfx('hook');
    let mx = c.y; for (let i = 0; i <= 12; i++) { const k = i / 12; mx = Math.max(mx, Hf(c.x + (best.x - c.x) * k, c.z + (best.z - c.z) * k)); } this.tow.cruise = Math.max(c.y + 14, mx + 30, best.y + 20); }
  towUpdate(dt) { const c = this.cop, d = this.drone, T = this.tow; T.t += dt; d.props.forEach((p, i) => p.rotation.y += dt * 30 * (i % 2 ? 1 : -1)); const dp = d.root.position; const HANG = 7.2;
    const go = (x, y, z, sp) => { _v.set(x - dp.x, y - dp.y, z - dp.z); const L = _v.length(); if (L < 0.2) return true; _v.multiplyScalar(Math.min(1, sp * dt / L)); dp.add(_v); return false; };
    if (T.ph === 'in') { if (go(c.x, c.y + HANG + 1.5, c.z, 26)) { T.ph = 'hook'; T.t = 0; sfx('hook'); } }
    else if (T.ph === 'hook') { if (T.t > 0.7) { T.ph = 'up'; T.t = 0; } }
    else if (T.ph === 'up') { if (go(c.x, T.cruise + HANG, c.z, 9)) T.ph = 'carry'; }
    else if (T.ph === 'carry') { if (go(T.pad.x, T.cruise + HANG, T.pad.z, 24)) T.ph = 'down'; }
    else if (T.ph === 'down') { if (go(T.pad.x, T.pad.y + HANG, T.pad.z, 8)) { T.ph = 'drop'; T.t = 0; } }
    else if (T.ph === 'drop') { if (T.t > 0.5) { T.ph = 'away'; T.t = 0; c.mode = 'ground'; c.x = T.pad.x; c.z = T.pad.z; c.y = T.pad.y; c.pitchV = c.rollV = 0; c.vx = c.vy = c.vz = 0; c.onPad = T.pad; S.stats.tows++; persist(); sfx('land'); this.afterTow(); } }
    else if (T.ph === 'away') { go(dp.x + 20, dp.y + 60, dp.z - 10, 22); if (T.t > 3) { d.root.visible = false; this.tow = null; } }
    const hooked = T.ph === 'up' || T.ph === 'carry' || T.ph === 'down' || T.ph === 'drop' || T.ph === 'hook';
    if (hooked && T.ph !== 'hook') { c.x = dp.x; c.z = dp.z; c.y = dp.y - HANG; c.rollV = Math.sin(T.t * 2) * 0.08; c.pitchV = Math.sin(T.t * 1.6) * 0.06; c.yaw += wrap(c.yaw) * 0; }
    if (c.mode !== 'ground') { c.rollV *= 0.98; }
    d.cable.visible = d.hook.visible = hooked; if (hooked) { const len = Math.max(0.5, dp.y - (c.y + 3.2)); d.cable.scale.set(1, len, 1); d.hook.position.set(0, -len, 0); }
    if (T.ph === 'away' || T.ph === 'in') this.syncCopter(dt); else this.syncCopter(dt); }
  afterTow() { const first = !S.badges.survivor; if (first) { S.badges.survivor = 1; persist(); } talk([['Snowie', first ? 'We\'re okay! The tow-drone brought us home. That was SO exciting. Let\'s never do it again. Unless you want to.' : 'Tow-drone to the rescue again! It\'s getting pretty good at this.'], ...(first ? [['Snowie', 'You earned the Survival Badge! 🛟 Official Bounce-Back Pilot.']] : [])], () => { if (first) toast('🏅 Badge: Survival Badge (Bounce-Back Pilot)'); }); }
  dropOff(r) { const p = this.rpets[r.id]; S.rescues.push(r.id); S.carry = null; persist(); this.cop.tilt.remove(p.root); p.seated = false; this.homePet(p); this.fx.confetti(this.cop.x, this.cop.y + 3, this.cop.z, 60); sfx('win');
    setTimeout(() => talk([[r.name, `Home! Thank you, pilot! Thank you, Snowie!`], ['Snowie', `Pet rescued: ${S.rescues.length}/${RESCUES.length}!`]], () => { if (S.rescues.length >= RESCUES.length && !S.badges.hero) { S.badges.hero = 1; persist(); toast('🏅 Badge: Pet Rescue Hero'); } }), 400); }
  pickUp(r) { const p = this.rpets[r.id]; S.carry = r.id; persist(); this.seatPet(p); sfx('heart'); talk([RESCUE_LINES[r.id], ['Snowie', `Hop in, ${r.name}! Next stop: ${PET_NAMES[r.home]}. Land on the pad there.`]]); }
  photo(t) { S.tours.push(t.id); persist(); this.marks[t.id].visible = false; this.cards[TOURS.indexOf(t)].visible = true; sfx('check'); const f = document.getElementById('flash'); if (f) { f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
    talk([FACTS[t.id], ['Snowie', `📸 Postcard collected: ${t.name} (${S.tours.length}/${TOURS.length})`]], () => { if (S.tours.length >= TOURS.length && !S.badges.tourist) { S.badges.tourist = 1; persist(); toast('🏅 Badge: Master Tour Guide'); } }); }
  raceUpdate(dt) { const c = this.cop; if (c.mode !== 'fly') return; const R = this.race;
    if (!R) { for (const co of COURSES) { const p = co.pts[0]; if (Math.hypot(c.x - p[0], c.y + 1.5 - p[1], c.z - p[2]) < 6.5) { this.race = { c: co, i: 1, t: 0 }; sfx('bell'); toast(`🏁 ${co.name}! GO GO GO!`); this.showRings(); break; } } return; }
    R.t += dt; const p = R.c.pts[R.i]; if (Math.hypot(c.x - p[0], c.y + 1.5 - p[1], c.z - p[2]) < 7) { sfx('ding'); this.fx.ring(p[0], p[1], p[2], 0xffd23f, 6); R.i++; if (R.i >= R.c.pts.length) return this.finishRace(); this.showRings(); }
    if (R.t > R.c.par * 3) { toast('⏱️ Out of time! Fly through the START ring to try again.'); this.race = null; this.showRings(); } }
  finishRace() { const R = this.race, t = R.t, c = R.c; this.race = null; this.showRings(); const medal = t <= c.par ? 'gold' : t <= c.par * 1.35 ? 'silver' : 'bronze'; const prev = S.rings[c.id]; if (!prev || t < prev.t) S.rings[c.id] = { t: +t.toFixed(2), medal: !prev ? medal : (['gold', 'silver', 'bronze'].indexOf(medal) < ['gold', 'silver', 'bronze'].indexOf(prev.medal) ? medal : prev.medal) }; persist(); sfx('win'); this.fx.confetti(this.cop.x, this.cop.y + 2, this.cop.z, 70);
    toast(`${medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : '🥉'} ${c.name}: ${t.toFixed(2)} s${prev && t < prev.t ? ' NEW BEST!' : ''}`); if (COURSES.every((q) => S.rings[q.id] && S.rings[q.id].medal === 'gold') && !S.badges.ace) { S.badges.ace = 1; persist(); setTimeout(() => toast('🏅 Badge: Sky Ace (all gold)'), 1200); } }
  target() { const c = this.cop; if (this.race) { const p = this.race.c.pts[this.race.i]; return { x: p[0], y: p[1], z: p[2], n: 'Next ring' }; }
    if (S.carry) { const r = RESCUES.find((q) => q.id === S.carry); const p = PADS.find((q) => q.town === r.home); return { x: p.x, y: p.y + 4, z: p.z, n: PET_NAMES[r.home] + ' pad' }; }
    if (S.wp) { if (Math.hypot(c.x - S.wp.x, c.z - S.wp.z) < 30) { S.wp = null; persist(); } else return { x: S.wp.x, y: S.wp.y || 20, z: S.wp.z, n: S.wp.n }; }
    let best = null, bd = 1e9; for (const t of TOURS) { if (S.tours.includes(t.id)) continue; const d = Math.hypot(c.x - t.x, c.z - t.z); if (d < bd) { bd = d; best = { x: t.x, y: t.y + 7, z: t.z, n: t.name }; } } if (best) return best;
    for (const r of RESCUES) { if (S.rescues.includes(r.id)) continue; const d = Math.hypot(c.x - r.x, c.z - r.z); if (d < bd) { bd = d; best = { x: r.x, y: r.y + 3, z: r.z, n: r.name }; } } if (best) return best;
    for (const co of COURSES) if (!S.rings[co.id]) return { x: co.pts[0][0], y: co.pts[0][1], z: co.pts[0][2], n: co.name }; return null; }
  // ---------------- smart rendering ----------------
  setVis(force) { const me = this.me, walking = this.mode === 'walk'; const b = walking ? buildingAt(me.x, me.z) : null; const cp = E.camera.position;
    if (b !== this.inB || force) { this.inB = b; } const RM = this.world.regionMeshes;
    for (const B of BUILDINGS) { const inIt = B === b; (RM['roof_' + B.id] || []).forEach((m) => m.visible = !inIt); const cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2; const d = Math.hypot(cp.x - cx, cp.z - cz); const show = inIt || d < 75; (RM['in_' + B.id] || []).forEach((m) => m.visible = show); }
    this.detT -= 1; if (this.detT <= 0 || force) { this.detT = 15; for (const m of this.world.detailMeshes) { const ws = m.userData.ws; if (!ws) continue; m.visible = cp.distanceTo(ws.center) - ws.radius < 230; } } }
  fades() { const b = this.inB, c = E.camera.position, me = this.me; _v.set(me.x, me.y + 1.2, me.z).sub(c); const L = _v.length(); _r.set(c, _v.normalize());
    for (const B of BUILDINGS) for (const f of B.fades) { let hide = false; if (B === b) { _b.copy(f.box).expandByScalar(0.05); const p = _r.intersectBox(_b, _s); hide = !!p && c.distanceTo(p) < L - 0.3; } if (f._h !== hide) { f._h = hide; f.meshes.forEach((m) => m.visible = !hide); } } }
  areaName() { const c = this.mode === 'walk' ? this.me : this.cop; if (this.inB) return this.inB.name; let best = null, bd = 1e9; for (const k in TOWNS) { const t = TOWNS[k], d = Math.hypot(c.x - t.x, c.z - t.z) - t.r; if (d < bd) { bd = d; best = t; } } if (Math.hypot(c.x - LAKE.x, c.z - LAKE.z) < LAKE.r + 10) return '🌊 Lake Shimmer'; if (bd < 20) return best.name; return c.z > 200 ? '🏔️ Snowcap Mountains' : '🌄 Over the valley'; }
  update(dt) { this.T += dt; const app = this.app, me = this.me, c = this.cop; const busy = app.busy || talking();
    if (this.mode === 'walk') { const mv = busy ? { x: 0, y: 0 } : readMove(); const j = !busy && edge('jump'); if (me.zoom > 0) me.zoom -= dt;
      me.update(dt, { mx: mv.x, my: mv.y, jump: j }, this.world, this.cam.moveYaw);
      const Z = this.zone; if (Z) { if (Z.rect) { me.x = Math.max(Z.rect[0], Math.min(Z.rect[2], me.x)); me.z = Math.max(Z.rect[1], Math.min(Z.rect[3], me.z)); } else { const dx = me.x - Z.x, dz = me.z - Z.z, d = Math.hypot(dx, dz); if (d > Z.r) { me.x = Z.x + dx / d * Z.r; me.z = Z.z + dz / d * Z.r; } } if (me.y < (Z.y || 0) - 3) me.place([c.x + 3, c.y + 0.2, c.z], me.yaw); }
      this.setVis(); const inside = !!this.inB; this.cam.hgt = 1.45; this.cam.update(dt, me, inside ? null : this.world, inside ? { dist: 7.6 } : {}); if (inside) this.cam.pitch = Math.max(this.cam.pitch, 0.66); else if (this.cam.pitch > 0.75) this.cam.pitch -= dt * 0.5;
      this.fades(); this.syncCopter(dt); }
    else { this.flyUpdate(dt, busy); this.raceUpdate(dt); this.setVis(); const hs = Math.hypot(c.vx, c.vz); this.cam.hgt = 2.4; this.cam.update(dt, { x: c.x, y: c.y, z: c.z, yaw: c.yaw, speed: c.mode === 'fly' ? hs : 0 }, this.world, { dist: 14 + Math.min(8, hs * 0.25) + (c.mode === 'tow' ? 8 : 0) });
      const cp = E.camera.position, gh = Math.max(Hf(cp.x, cp.z), WATER_Y) + 1.5; if (cp.y < gh) { cp.y = gh; E.camera.lookAt(c.x, c.y + 2.2, c.z); } if (this.cam.pitch > 0.9) this.cam.pitch -= dt * 0.5; }
    updateFrustum(E.camera); this.fx.update(dt);
    // NPCs: stroll + animate only when on screen and near
    const cp = E.camera.position, inId = this.inB && this.inB.id; for (const p of this.npcs) { const dd = Math.hypot(cp.x - p.x, cp.z - p.z); const vis = p.room ? (inId === p.room || (this.mode === 'walk' && Math.hypot(me.x - p.x, me.z - p.z) < 9)) : dd < 110; p.root.visible = vis; if (!vis) continue;
      if (p.walk) { const t = p.walk[p.wi]; const dx = t[0] - p.x, dz = t[1] - p.z, d = Math.hypot(dx, dz); const nearMe = this.mode === 'walk' && Math.hypot(me.x - p.x, me.z - p.z) < 2.6;
        if (nearMe) p.speed = 0; else if (p.wait > 0) { p.wait -= dt; p.speed = 0; } else if (d < 0.3) { p.wi = (p.wi + 1) % p.walk.length; p.wait = 1.5 + Math.random() * 2; } else { const sp = p.kind === 'tort' ? 0.7 : 1.6; p.x += dx / d * sp * dt; p.z += dz / d * sp * dt; p.yaw = Math.atan2(dx, dz); p.speed = sp; } p.noTurn = !nearMe; }
      if (inView(p.x, p.y + 0.5, p.z, 1.5)) { if (p.kind === 'human') { p.root.position.set(p.x, p.y, p.z); p.root.rotation.y = p.yaw; animHuman(p.rig, dt, { speed: p.speed, ground: true }); } else animPet(p, dt, this.mode === 'walk' ? me : null); } }
    // rescue pets: bob + wave; HELP! sign bobs
    for (const id in this.rpets) { const p = this.rpets[id]; if (p.seated) { if (p.rig && p.kind !== 'kitten') { p.t += dt; } continue; } const dd = Math.hypot(cp.x - p.x, cp.z - p.z); p.root.visible = dd < 260; if (!p.root.visible) continue; if (p.kind === 'kitten') { p.root.position.set(p.x, p.y + Math.abs(Math.sin(this.T * 3)) * 0.15, p.z); p.root.rotation.y = this.T * 0.5; } else { p.mode = p.home ? 'idle' : 'idle'; animPet(p, dt, this.mode === 'walk' ? me : null); if (!p.home) p.root.rotation.y = Math.sin(this.T) * 0.6; } if (p.help && p.help.visible) { p.help.position.y = p.r.y + 2.4 + Math.sin(this.T * 3) * 0.2; p.help.lookAt(cp.x, p.help.position.y, cp.z); } }
    for (const id in this.marks) { const m = this.marks[id]; if (m.visible) { m.rotation.y = this.T * 1.2; m.position.y = TOURS.find((t) => t.id === id).y + 7 + Math.sin(this.T * 2 + m.position.x) * 0.6; } }
    // arrow
    const tg = this.mode === 'fly' && c.mode !== 'crash' && c.mode !== 'tow' ? this.target() : null; this.tgt = tg; this.arrow.visible = !!tg; if (tg) { this.arrow.position.set(c.x, c.y + 5.6, c.z); this.arrow.lookAt(tg.x, c.y + 5.6 + Math.max(-0.6, Math.min(0.6, (tg.y - c.y) / 80)) * 3, tg.z); this.arrow.scale.setScalar(0.75 + Math.sin(this.T * 5) * 0.06); }
    // nearest interaction
    let best = null, bd = 1e9;
    if (!busy) { if (this.mode === 'walk') { for (const a of this.acts) { if (a.ok && !a.ok()) continue; let x = a.x, z = a.z, y = a.y; if (a.npc) { x = a.npc.x; z = a.npc.z; y = a.npc.y; if (!a.npc.root.visible) continue; } if (a.board) { x = c.x; z = c.z; y = c.y; } if (y != null && Math.abs(y - me.y) > 2.5) continue; const d = Math.hypot(me.x - x, me.z - z); if (d < a.r && d < bd) { bd = d; best = a; } } }
      else if (c.mode === 'ground') { if (c.onPad && c.onPad.walk) best = { label: '🚪 Hop out & explore', f: () => this.hopOut() }; if (!S.carry) for (const r of RESCUES) { if (S.rescues.includes(r.id)) continue; if (Math.hypot(c.x - r.x, c.z - r.z) < 16) { best = { label: `🐾 Rescue ${r.name}`, f: () => this.pickUp(r) }; break; } } }
      else if (c.mode === 'fly') { for (const t of TOURS) { if (S.tours.includes(t.id)) continue; const d = Math.hypot(c.x - t.x, c.y - t.y, c.z - t.z); if (d < 48 && d < bd) { bd = d; best = { label: `📸 Tour photo: ${t.name}`, f: () => this.photo(t) }; } } } }
    this.act = best; app.hud.setAct(best); if (best && edge('act')) { sfx('click'); best.f(); }
    const lx = this.mode === 'walk' ? me.x : c.x, ly = this.mode === 'walk' ? me.y : c.y, lz = this.mode === 'walk' ? me.z : c.z; this.lightPool.update(dt, lx, ly, lz); this.shadow(); app.hud.update(this);
  }
  shadow() { if (this.mode === 'walk') return followShadow(this.me.x, this.me.y, this.me.z); const c = this.cop, d = E.sunDir; const gy = Math.max(Hf(c.x, c.z), WATER_Y); const h = Math.max(0, c.y - gy); followShadow(c.x - d.x / d.y * h, gy, c.z - d.z / d.y * h); }
  render(dt) { this.shadow(); }
  refreshMe() { const p = [this.me.x, this.me.y, this.me.z], y = this.me.yaw, v = this.me.root.visible; this.me.removeFrom(this.scene); this.me = new Walker(S.look); this.me.addTo(this.scene); this.me.place(p, y); this.me.setVisible(v); this.cop.setPilot(S.look); }
  repaint(i) { S.paint = i; persist(); this.cop.setPaint(i); }
}
