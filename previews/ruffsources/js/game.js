// Grok Ruffsources HQ - world, characters, interactions, the missing-toy mystery and smart rendering.
import * as THREE from 'three';
import { E, setEnvironment, followShadow } from './engine.js?v=rs5';
import { World } from './world.js?v=rs5';
import { buildMap, SPOTS, ENV } from './map.js?v=rs5';
import { BUILDINGS, buildingAt } from './bld.js?v=rs5';
import { Walker } from './walker.js?v=rs5';
import { FollowCam } from './cam.js?v=rs5';
import { makePet, animPet } from './pets.js?v=rs5';
import { makeRat, animRat } from './models.js?v=rs5';
import { makeKitten } from './dogs.js?v=rs5';
import { readMove, edge, held } from './input.js?v=rs5';
import { updateFrustum, inView, LightPool } from './perf.js?v=rs5';
import { S, persist } from './save.js?v=rs5';
import { sfx } from './audio.js?v=rs5';
import { talk, talking, toast } from './uikit.js?v=rs5';
import { MATS } from './mats.js?v=rs5';
import { Builder, P } from './geo.js?v=rs5';
import { compact } from './compact.js?v=rs5';
import { textGeo } from './text3d.js?v=rs5';
import { CLUES, CANDIDATES, LINES, goal } from './story.js?v=rs5';
const PI = Math.PI;
export const BONES = [[-20, 10], [20, 10], [0, 16.5], [-12, -2], [12, -2], [-40, 18], [40, 18], [0, 22], [46, -18], [-50, 34], [-28, 40], [30, 40], [0, -40], [-60, -10], [60, -12], [0, 50],
  [-4, -10], [-16, -16], [16, -9.5], [-14, -27.2], [3.5, -32], [16, -20], [-42, 12], [44.5, 8], [-3, 37], [5, 28]];
export const NAPS = [['nap_lobby', 'Lobby'], ['nap_mail', 'Mail Room'], ['nap_break', 'Break Room couch'], ['nap_interview', 'Interview Room'], ['nap_office', 'Her office'], ['nap_cafe', 'Bark & Brew']];
const _r = new THREE.Ray(), _v = new THREE.Vector3(), _b = new THREE.Box3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
function boneGeo(s = 1) { const b = new Builder(); b.add(P.capsule, 0xffffff, 0, 0, 0, 0, 0, PI / 2, 0.32 * s, 1.1 * s, 0.32 * s); [-1, 1].forEach((a) => [-1, 1].forEach((c) => b.add(P.sphere, 0xffffff, a * 0.78 * s, c * 0.2 * s, 0, 0, 0, 0, 0.3 * s))); return compact(b.build(), 'g'); }
function meshFrom(parts) { const g = new THREE.Group(); for (const k in parts) { const b = parts[k]; if (!b.parts.length) continue; const m = new THREE.Mesh(compact(b.build(), k), MATS[k]); m.castShadow = k !== 'l'; m.receiveShadow = true; g.add(m); } return g; }
const MB = () => ({ f: new Builder(), g: new Builder(), m: new Builder(), l: new Builder(), x: new Builder() });
export class Game {
  constructor(app) {
    this.app = app; this.scene = E.scene; this.T = 0;
    const w = this.world = new World(); { const R = E.renderer, rt = new THREE.WebGLRenderTarget(4, 4), sc = new THREE.Scene(); w.uploader = (m) => { const fc = m.frustumCulled; m.frustumCulled = false; const par = m.parent; sc.add(m); const prev = R.getRenderTarget(), sm = R.shadowMap.autoUpdate; R.shadowMap.autoUpdate = false; R.setRenderTarget(rt); R.render(sc, E.camera); R.setRenderTarget(prev); R.shadowMap.autoUpdate = sm; sc.remove(m); if (par) par.add(m); m.frustumCulled = fc; }; w._upRT = rt; }
    buildMap(w); w.finalize(this.scene); w.uploader = null; w._upRT.dispose();
    setEnvironment(ENV); this.lightPool = new LightPool(this.scene, w.lights, 4);
    this.me = new Walker(S.look); this.me.addTo(this.scene); this.me.place([0, 0.1, 13], PI);
    this.cam = new FollowCam(); this.cam.yaw = 0; this.cam.snap = true;
    this.inB = null; this.acts = []; this.act = null; this.npcs = [];
    this.buildPets(); this.buildCandy(); this.buildBones(); this.buildClues(); this.buildActs(); this.setVis(true);
  }
  add(o) { this.scene.add(o); return o; }
  // ---------------- characters ----------------
  npc(id, o) { const p = makePet(id, o); p.x = o.at[0]; p.z = o.at[1]; p.y = o.y || 0.14; p.yaw = o.yaw || 0; p.home = [p.x, p.z]; p.walk = o.walk || null; p.wi = 0; p.wait = 0; p.talk = o.talk; p.label = o.label; p.region = o.region; this.add(p.root); this.npcs.push(p); return p; }
  buildPets() {
    this.biscuit = this.npc('biscuit', { breed: 'corgi', collar: 0x2563eb, s: 0.9, at: [-3.0, -14.5], yaw: 0.3, label: '💬 Talk to Biscuit', region: 'in_hq', talk: () => this.talkBiscuit() });
    this.luna = this.npc('luna', { at: SPOTS.luna, y: 1.14, yaw: PI / 2, s: 1.25, label: '💬 Talk to Luna', region: 'in_rat', talk: () => talk(LINES.luna, null, [{ t: '🔧 Calibrate gadgets', f: () => this.mg('gadget') }, { t: 'Later!', f: () => {} }]) });
    this.torty = this.npc('torty', { at: [SPOTS.tort[0], SPOTS.tort[1] - 1.5], yaw: PI / 2, s: 1.0, label: '💬 Talk to Torty', region: 'in_tort', talk: () => this.talkTorty() });
    this.pirat = this.npc('pirat', { at: [-9, -9.6], yaw: PI, s: 1.25, label: '💬 Talk to Pi-rat', region: 'in_hq', walk: [[-8.5, -9.8], [-8.5, -13.4], [-15, -13.4], [-12, -9.8]], talk: () => talk(LINES.pirat) });
    this.snowie = this.npc('snowie', { at: [0.8, 36.2], yaw: PI, s: 1.25, y: 1.14, label: '💬 Talk to Snowie', region: 'in_cafe', talk: () => talk(LINES.snowie, null, [{ t: '☕ Pupuccino pour', f: () => this.mg('pour') }, { t: 'Just looking', f: () => {} }]) });
    // office staff + visitors (dogs from Pup Town, rats from Ratita Industries)
    [['golden', [[-10, 12], [10, 12], [10, 0], [-10, 0]]], ['dalmatian', [[22, 7], [28, 7.2], [22, 14]]], ['beagle', [[-22, 7], [-28, 7.2], [-22, 0]]], ['shiba', [[0, 18.5], [0, 24], [4, 20]]], ['husky', [[40, -10], [50, -16], [44, -20]]]].forEach(([br, walk], i) => this.npc('dog' + i, { breed: br, s: 0.8, seed: i * 5 + 1, at: walk[0], walk, region: 'out', label: '💬 Say hi', talk: () => talk([[['Golden Gabe', 'Dottie', 'Barnaby', 'Mochi', 'Blizzard'][i], ['I work in Ruffsources accounting. I count bones.', 'Ratita Industries sent me to pick up a payroll form!', 'Did you see Candy? She napped through the fire drill again.', 'I\'m here for my interview! ...Or is it Tuesday?', 'The dog park is the best perk at this job.'][i]]]) }));
    [['ginger', [-40, 4.2]], ['cream', [-44, 10.5]]].forEach(([id, at], i) => { const p = this.npc(id, { at, yaw: i ? PI : 0, s: 1.15, region: 'in_rat', label: '💬 Say hi', talk: () => talk([[i ? 'Lab Rat Brie' : 'Lab Rat Cheddar', i ? 'Every gadget we build gets drop-tested by Torty. Every form gets stamped by Candy. Teamwork!' : 'Ruffsources found me this job. Best HR in town, even if the boss is always asleep.']]) }); });
  }
  talkBiscuit() { if (!S.talks.biscuit) { S.talks.biscuit = 1; persist(); talk(LINES.biscuit0); return; } talk(LINES.biscuit, null, [{ t: '📬 Mail sort', f: () => this.mg('mail') }, { t: '☕ Snack orders', f: () => this.mg('snack') }, { t: '🗂️ File it!', f: () => this.mg('file') }, { t: 'Thanks!', f: () => {} }]); }
  talkTorty() { if (S.mys === 2) { talk(LINES.tortyToy, () => { S.mys = 3; persist(); sfx('win'); toast('🧸 Got the squeaky toy!'); this.toyHeld(true); }); return; } talk(LINES.torty, null, [{ t: '🐢 Run the drop tower', f: () => this.mg('drop') }, { t: 'Later!', f: () => {} }]); }
  // Candy + her doormat + paperwork + squeaky toy (one rig that moves between nap spots while you're not looking)
  buildCandy() { const g = new THREE.Group(); const b = MB();
    b.f.add(P.rboxS, 0xb45309, 0, 0.025, 0, 0, 0, 0, 1.6, 0.05, 1.05); b.f.add(P.rboxS, 0xf59e0b, 0, 0.05, 0, 0, 0, 0, 1.4, 0.04, 0.85); for (let i = 0; i < 7; i++) b.m.add(P.rboxS, i % 3 ? 0xffffff : 0xfef3c7, -0.35 + (i % 3) * 0.32, 0.08 + i * 0.012, (i % 2) * 0.2 - 0.1, 0, i * 0.3, 0, 0.42, 0.012, 0.3);
    b.l.add(P.rboxS, 0xdc2626, 0.5, 0.12, 0.3, 0, 0.4, 0, 0.3, 0.012, 0.12, 0.3); g.add(meshFrom(b));
    const tb = MB(); tb.g.add(P.capsule, 0xff6fb5, 0, 0, 0, 0, 0, PI / 2, 0.16, 0.42, 0.16); [-1, 1].forEach((a) => [-1, 1].forEach((c) => tb.g.add(P.sphere, 0xff6fb5, a * 0.3, c * 0.08, 0, 0, 0, 0, 0.12))); [-1, 1].forEach((a) => tb.g.add(P.sphere, 0x111827, a * 0.06, 0.05, 0.13, 0, 0, 0, 0.03)); tb.l.add(P.sphere, 0xffffff, 0, -0.02, 0.15, 0, 0, 0, 0.02, 0.01, 0.01, 0.3);
    this.toy = meshFrom(tb); this.toy.position.set(0.35, 0.22, 0.42); this.toy.rotation.y = 0.5; g.add(this.toy);
    this.candy = makePet('candy', { mode: 'sleep' }); this.candy.noTurn = true; this.candy.mode = 'sleep'; g.add(this.candy.root); this.candy.root.position.y = 0.06;
    const zg0 = textGeo('Z', 0.22, 0.05), zg = zg0 && zg0.clone(); if (zg) zg.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(zg.attributes.position.count * 3).fill(1.5), 3)); this.zz = []; if (zg) for (let i = 0; i < 3; i++) { const z = new THREE.Mesh(zg, MATS.l); z.material = MATS.l; this.zz.push(z); g.add(z); }
    // the zzz letters use the glow material (vertex colours): give them a colour attribute
    if (zg && !zg.attributes.color) { const n = zg.attributes.position.count, c = new Float32Array(n * 3).fill(1.2); zg.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
    this.candyG = this.add(g); this.napAt(this.nextNap(true)); this.toyHeld(false);
    // the toy you carry back to Candy
    this.carry = this.toy.clone(); this.carry.scale.setScalar(1.2); this.me.rig.body.add(this.carry); this.carry.position.set(0.32, 1.0, 0.25); this.carry.visible = S.mys === 3; }
  toyHeld(you) { this.toy.visible = S.mys === 0 || S.mys >= 4; if (this.carry) this.carry.visible = S.mys === 3; }
  nextNap(first) { if (first && !S.talks.candy) return 'nap_lobby'; const left = NAPS.filter(([k]) => !S.naps.includes(k) && k !== this.napK); const pool = left.length ? left : NAPS.filter(([k]) => k !== this.napK); return pool[(Math.random() * pool.length) | 0][0]; }
  napAt(k) { const s = SPOTS[k]; this.napK = k; this.candyG.position.set(s[0], 0.14, s[1]); this.candyG.rotation.y = s[2] || 0; this.candy.x = 0; this.candy.z = 0; this.napMoved = false; }
  // ---------------- collectibles + clue markers ----------------
  buildBones() { const g = boneGeo(0.3); const m = new THREE.MeshPhysicalMaterial({ color: 0xffc83d, metalness: 0.9, roughness: 0.22, emissive: 0x7a4a00, emissiveIntensity: 0.35, clearcoat: 0.6 });
    this.boneMesh = new THREE.InstancedMesh(g, m, BONES.length); this.boneMesh.castShadow = true; this.bonesY = BONES.map(([x, z]) => { const gr = this.world.ground(x, z, 3, 0.1); return (gr.y > -50 ? gr.y : 0) + 0.9; }); this.add(this.boneMesh); this.updBones(0); }
  updBones(t) { BONES.forEach(([x, z], i) => { const got = S.bones.includes(i); _q.setFromAxisAngle(_v.set(0, 1, 0), t * 2 + i); _s.setScalar(got ? 0 : 1); _m.compose(_v.set(x, this.bonesY[i] + Math.sin(t * 2.5 + i) * 0.12, z), _q, _s); this.boneMesh.setMatrixAt(i, _m); }); this.boneMesh.instanceMatrix.needsUpdate = true; }
  buildClues() { const b = MB(); b.l.add(P.torus, 0xffd23f, 0, 0, 0, PI / 2, 0, 0, 0.45, 0.45, 0.45, 0.6); b.l.add(P.sphere, 0xffffff, 0, 0.9, 0, 0, 0, 0, 0.12, 0.12, 0.12, 0.8); b.g.add(P.cone, 0xffd23f, 0, 0.45, 0, PI, 0, 0, 0.14, 0.3, 0.14); const proto = meshFrom(b);
    this.clueM = CLUES.map((c) => { const m = proto.clone(); const gr = this.world.ground(c.at[0], c.at[1], 3, 0.1); m.position.set(c.at[0], (gr.y > -50 ? gr.y : 0) + 0.15, c.at[1]); this.add(m); return m; }); }
  // ---------------- interactions ----------------
  buildActs() { const S_ = SPOTS; this.acts = []; for (const p of this.npcs) if (p.talk) this.acts.push({ npc: p, r: p === this.biscuit ? 2.8 : 2.2, label: p.label, f: p.talk });
    const push = (x, z, r, label, f, ok) => this.acts.push({ x, z, r, label, f, ok });
    push(S_.mail[0], S_.mail[1], 2.6, '📬 Sort the mail', () => this.mg('mail'));
    push(S_.break[0], S_.break[1], 2.4, '☕ Snack orders', () => this.mg('snack'));
    push(S_.filing[0], S_.filing[1], 2.8, '🗂️ File it!', () => this.mg('file'));
    push(S_.interview[0], S_.interview[1], 2.4, '🤝 Interview a new hire', () => this.interview());
    push(S_.clueboard[0], S_.clueboard[1], 2.4, '📌 Clue board', () => this.app.ui.clueBoard(), () => S.mys >= 1);
    push(S_.ratita[0], S_.ratita[1], 2.2, '🔧 Gadget Returns', () => this.mg('gadget'));
    push(S_.drop[0], S_.drop[1], 2.4, '🐢 Drop tower', () => this.mg('drop'));
    push(S_.cafe[0], S_.cafe[1], 2.4, '☕ Pupuccino pour', () => this.mg('pour'));
    push(S_.fountain[0], S_.fountain[1] + 5.4, 2.2, '🪙 Toss a coin in Bone Fountain', () => { sfx('splash'); toast(['🦴 You wished for more naps for Candy.', '✨ The fountain says: "Good dog."', '💧 Splash! A Golden-Bone-shaped ripple.'][(Math.random() * 3) | 0]); });
    CLUES.forEach((c, i) => push(c.at[0], c.at[1], 1.8, '🔍 Look closer', () => this.clue(i), () => S.mys === 1 && !S.clues[c.id]));
    this.acts.push({ candy: true, r: 2.3, label: '💤 Candy (napping)', f: () => this.talkCandy() }); }
  talkCandy() { const first = !S.talks.candy; if (first) { S.talks.candy = 1; persist(); talk(LINES.candy0, () => { toast('✅ Hire form APPROVED'); this.logNap(); setTimeout(() => { S.mys = 1; persist(); this.toyHeld(); talk(LINES.missing); }, 600); }); return; }
    if (S.mys === 3) { talk(LINES.returned, () => { S.mys = 4; S.badges.detective = 1; persist(); this.toyHeld(); sfx('win'); toast('🏅 Badge: Senior Squeak Detective'); this.candy.mode = 'happy'; setTimeout(() => { this.candy.mode = 'sleep'; }, 2500); }); return; }
    talk(S.mys >= 4 ? LINES.candyHappy : S.mys >= 1 ? LINES.candySad : LINES.candyNap, () => this.logNap()); }
  logNap() { if (!S.naps.includes(this.napK)) { S.naps.push(this.napK); persist(); const n = S.naps.length; toast(`💤 Nap spotted: ${NAPS.find((q) => q[0] === this.napK)[1]} (${n}/6)`); sfx('ding'); if (n >= 6) { S.badges.naps = 1; persist(); toast('🏅 Badge: Official Nap Spotter'); } } this.napMoved = true; }
  clue(i) { const c = CLUES[i]; S.clues[c.id] = 1; persist(); sfx('check'); this.app.ui.clueCard(c, Object.keys(S.clues).length); }
  accuse(id) { if (id === 'pirat') { talk(LINES.piratConfess, () => { S.mys = 2; persist(); toast('🐢 Head to Tortuga Tech!'); }); } else { const n = { luna: 'Luna', snowie: 'Snowie', torty: 'Torty' }[id]; talk([[n, id === 'snowie' ? 'Me?! I only did the whoopee cushion! Hee hee. Check that visitor log again.' : id === 'torty' ? 'Torty tests things, but Torty didn\'t take anything! Someone SENT it to me. Who signs with an X?' : 'Not me! I was calibrating gadgets all morning. Ask whoever borrowed my bubble wrap.']]); } }
  mg(id) { this.app.paused = true; this.app.busy = true; this.app.ui.minigame(id, () => { this.app.resume(); }); }
  interview() { const c = CANDIDATES[S.cand % CANDIDATES.length]; this.showCandidate(c); talk([['Candidate', `${c.name} is here for the ${c.job} job!`], [c.name, c.lines[0]], [c.name, c.lines[1]]], null, [{ t: '✅ HIRE', f: () => this.decide(c, true) }, { t: '❌ PASS', f: () => this.decide(c, false) }]); }
  decide(c, hire) { const good = hire === c.fit; S.interviewed++; if (hire) S.hired++; S.cand++; persist(); sfx(good ? 'win' : 'squeak'); toast(good ? (hire ? `🎉 Great hire! ${c.name.split(' ')[0]} starts Monday.` : '👍 Good call. Not the right fit.') : (hire ? `😅 Hmm... ${c.name.split(' ')[0]} is napping on the job already.` : `🤔 Oops, ${c.name.split(' ')[0]} was perfect for it!`)); if (good) { S.best.hire = (S.best.hire || 0) + 1; if (S.best.hire >= 4) S.badges.hr = 1; persist(); } setTimeout(() => this.showCandidate(null), 1200); }
  showCandidate(c) { if (this.candM) { this.scene.remove(this.candM.root); this.candM = null; } if (!c) return; let p; if (c.model.breed) p = makePet('cand', { breed: c.model.breed, s: 0.75 }); else { p = { root: new THREE.Group(), kind: 'rat', rig: makeRat(c.model.rat, 'none', { pack: false, noBlaster: true }), t: 0, mode: 'sit', speed: 0 }; p.rig.root.scale.setScalar(1.1); p.root.add(p.rig.root); }
    p.x = SPOTS.candidate[0]; p.z = SPOTS.candidate[1]; p.y = 0.6; p.yaw = 0; p.mode = 'sit'; p.noTurn = true; this.add(p.root); this.candM = p; }
  // ---------------- per-frame ----------------
  setVis(force) { const me = this.me; const b = buildingAt(me.x, me.z); if (b !== this.inB || force) { this.inB = b; this.app.hud.region(b ? b.name : '🦴 Bone Fountain Plaza'); }
    const RM = this.world.regionMeshes; for (const B of BUILDINGS) { const inIt = B === b; (RM['roof_' + B.id] || []).forEach((m) => m.visible = !inIt);
      const d = Math.max(0, B.x0 - me.x, me.x - B.x1, B.z0 - me.z, me.z - B.z1); const show = inIt || d < 30; (RM['in_' + B.id] || []).forEach((m) => m.visible = show); }
    for (const p of this.npcs) p.root.visible = !p.region || p.region === 'out' || (RM[p.region] && RM[p.region][0] ? RM[p.region][0].visible : true); }
  fades() { const b = this.inB, c = E.camera.position, me = this.me; _v.set(me.x, me.y + 1.2, me.z).sub(c); const L = _v.length(); _r.set(c, _v.normalize());
    for (const B of BUILDINGS) for (const f of B.fades) { let hide = false; if (B === b) { _b.copy(f.box).expandByScalar(0.05); const p = _r.intersectBox(_b, _s); hide = !!p && c.distanceTo(p) < L - 0.3; } if (f._h !== hide) { f._h = hide; f.meshes.forEach((m) => m.visible = !hide); } } }
  update(dt) { this.T += dt; const app = this.app, me = this.me;
    const busy = app.busy || talking(); const mv = busy ? { x: 0, y: 0 } : readMove(); const j = !busy && edge('jump');
    me.update(dt, { mx: mv.x, my: mv.y, jump: j }, this.world, this.cam.moveYaw);
    this.setVis(); const inside = !!this.inB;
    this.cam.update(dt, me, inside ? null : this.world, inside ? { dist: 7.6 } : {}); if (inside) this.cam.pitch = Math.max(this.cam.pitch, 0.66); else if (this.cam.pitch > 0.75) this.cam.pitch -= dt * 0.5;
    this.fades(); updateFrustum(E.camera);
    // NPCs: stroll their routes (only animated while on screen)
    for (const p of this.npcs) { if (p.walk) { const t = p.walk[p.wi]; const dx = t[0] - p.x, dz = t[1] - p.z, d = Math.hypot(dx, dz); const near = Math.hypot(me.x - p.x, me.z - p.z) < 2.6;
        if (near) p.speed = 0; else if (p.wait > 0) { p.wait -= dt; p.speed = 0; } else if (d < 0.3) { p.wi = (p.wi + 1) % p.walk.length; p.wait = 1.5 + Math.random() * 2; } else { const sp = p.kind === 'tort' ? 0.7 : 1.6; p.x += dx / d * sp * dt; p.z += dz / d * sp * dt; p.yaw = Math.atan2(dx, dz); p.speed = sp; } p.noTurn = !near; }
      if (p.root.visible && inView(p.x, p.y + 0.5, p.z, 1.5)) animPet(p, dt, me); }
    if (this.candM) animPet(this.candM, dt, null);
    // Candy: snoring, and hopping to another nap spot once you've logged this one and she's out of sight
    const cg = this.candyG; animPet(this.candy, dt, null); this.candy.root.position.set(0, 0.08, 0); this.candy.root.rotation.y = 0; this.zz.forEach((z, i) => { const k = (this.T * 0.45 + i / 3) % 1; z.position.set(0.3 + k * 0.4, 0.9 + k * 0.9, 0.3); z.scale.setScalar(0.6 + k); z.visible = this.candy.mode === 'sleep'; });
    if (this.napMoved) { const dC = Math.hypot(me.x - cg.position.x, me.z - cg.position.z); if (dC > 14 && !inView(cg.position.x, 0.5, cg.position.z, 1.5)) this.napAt(this.nextNap()); }
    // bones
    this.updBones(this.T); BONES.forEach(([x, z], i) => { if (!S.bones.includes(i) && Math.hypot(me.x - x, me.z - z) < 1.0 && Math.abs(me.y + 0.9 - this.bonesY[i]) < 1.6) { S.bones.push(i); persist(); sfx('ding'); toast(`🦴 Golden Bone ${S.bones.length}/${BONES.length}`); if (S.bones.length === BONES.length) { S.badges.bones = 1; persist(); toast('🏅 Badge: Golden Bone Collector'); } } });
    this.clueM.forEach((m, i) => { m.visible = S.mys === 1 && !S.clues[CLUES[i].id]; if (m.visible) m.rotation.y = this.T * 1.5; });
    // nearest interaction
    let best = null, bd = 1e9; if (!busy) for (const a of this.acts) { if (a.ok && !a.ok()) continue; let x = a.x, z = a.z; if (a.npc) { x = a.npc.x; z = a.npc.z; if (!a.npc.root.visible) continue; } if (a.candy) { x = cg.position.x; z = cg.position.z; } const d = Math.hypot(me.x - x, me.z - z); if (d < a.r && d < bd) { bd = d; best = a; } }
    if (best && best.candy) best.label = S.mys === 3 ? '🧸 Give Candy her toy' : '💤 Candy (napping)';
    this.act = best; app.hud.setAct(best); if (best && edge('act')) { sfx('click'); best.f(); }
    this.lightPool.update(dt, me.x, me.y, me.z); followShadow(me.x, me.y, me.z); app.hud.update(this);
  }
  render(dt) { followShadow(this.me.x, this.me.y, this.me.z); }
  refreshMe() { const p = [this.me.x, this.me.y, this.me.z], y = this.me.yaw; this.me.removeFrom(this.scene); this.me = new Walker(S.look); this.me.addTo(this.scene); this.me.place(p, y); if (this.carry) { this.me.rig.body.add(this.carry); } }
}
