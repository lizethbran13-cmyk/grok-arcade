// Grok Grocery Tycoon - world, characters, store simulation hookup, jobs, interactions, first-person mode and smart rendering.
import * as THREE from 'three';
import { E, setEnvironment, followShadow } from './engine.js?v=ggt19';
import { World } from './world.js?v=ggt19';
import { buildMap, SPOTS, GEOM, ENV } from './map.js?v=ggt19';
import { BUILDINGS, buildingAt } from './bld.js?v=ggt19';
import { Walker } from './walker.js?v=ggt19';
import { FollowCam } from './cam.js?v=ggt19';
import { makePet, animPet } from './pets.js?v=ggt19';
import { readMove, edge, IN } from './input.js?v=ggt19';
import { updateFrustum, inView, LightPool } from './perf.js?v=ggt19';
import { S, persist, capOf, news, newStore, staffName } from './save.js?v=ggt19';
import { sfx } from './audio.js?v=ggt19';
import { talk, talking, toast } from './uikit.js?v=ggt19';
import { MATS } from './mats.js?v=ggt19';
import { Builder, P } from './geo.js?v=ggt19';
import { compact } from './compact.js?v=ggt19';
import { Fixtures, FIXSOLID } from './fixtures.js?v=ggt19';
import { Crowd } from './crowd.js?v=ggt19';
import { Sim, EV, mine, shelfFrac, storeIds, OPEN, CLOSE, fmtClock } from './sim.js?v=ggt19';
import { STORE, STORES, FIX, DEPTS, DEPT_IDS, RANKS, ROLES, CAMEOS, GOALS, EMPIRE, TYPES, typeOf, DEPT_ITEMS, autoLayout } from './data.js?v=ggt19';
import { Decor } from './decor.js?v=ggt19';
import { MG_NAMES } from './mg.js?v=ggt19';
import { LINES, QUIZ, TASKS, dailyFor } from './story.js?v=ggt19';
import { Online } from './onlinesim.js?v=ggt19';
import { bonusTick } from './patch52.js?v=ggt19';
import { OWN as OP_OWN } from './online.js?v=ggt19';
const PI = Math.PI;
const _r = new THREE.Ray(), _v = new THREE.Vector3(), _b = new THREE.Box3(), _s = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _c = new THREE.Color();
function meshFrom(parts) { const g = new THREE.Group(); for (const k in parts) { const b = parts[k]; if (!b.parts.length) continue; const m = new THREE.Mesh(compact(b.build(), k), MATS[k]); m.castShadow = k !== 'l' && k !== 'e'; m.receiveShadow = true; g.add(m); } return g; }
const MB = () => ({ f: new Builder(), g: new Builder(), m: new Builder(), l: new Builder(), x: new Builder(), e: new Builder() });
function emojiTex(e) { const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.arc(48, 44, 40, 0, 7); g.fill(); g.beginPath(); g.moveTo(36, 78); g.lineTo(60, 78); g.lineTo(48, 94); g.fill(); g.font = '52px system-ui, Apple Color Emoji, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, 48, 47); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
export class Game {
  constructor(app) {
    this.app = app; this.scene = E.scene; this.T = 0; this.fp = false; this.fpPitch = 0; this.carry = null; this.cartsHeld = 0; this.cool = {}; this.bubT = 0;
    const w = this.world = new World(); { const R = E.renderer, rt = new THREE.WebGLRenderTarget(4, 4), sc = new THREE.Scene(); w.uploader = (m) => { const fc = m.frustumCulled; m.frustumCulled = false; const par = m.parent; sc.add(m); const prev = R.getRenderTarget(), sm = R.shadowMap.autoUpdate; R.shadowMap.autoUpdate = false; R.setRenderTarget(rt); R.render(sc, E.camera); R.setRenderTarget(prev); R.shadowMap.autoUpdate = sm; sc.remove(m); if (par) par.add(m); m.frustumCulled = fc; }; w._upRT = rt; }
    buildMap(w); w.finalize(this.scene); this.upload = w.uploader; w.uploader = null;
    setEnvironment(ENV); this.lightPool = new LightPool(this.scene, w.lights, 4);
    // store fixtures + their colliders
    this.fixtures = new Fixtures(); this.fixtures.upload = this.upload; this.slotSol = {}; this.fxSig = {};
    for (const d of STORES) { const G = GEOM[d.id]; this.fixtures.attach(this.scene, d.id, G.slots); this.slotSol[d.id] = G.slots.map((sl) => { const o = {}; const mk = (k) => FIXSOLID[k].map(([a, b, c, e, h]) => w.solid(sl.x + a, 0, sl.z + b, sl.x + c, h, sl.z + e, { dyn: true, off: true }));
      if (sl.kind === 'floor') { o.floor = mk('floor'); o.promo = mk('promo'); } else { o.register = mk('register'); o.selfck = mk('selfck'); } return o; }); }
    this.dcSol = w.dyn.filter((s) => s.tag === 'dc'); this.decor = new Decor(this.scene, w, GEOM); this.decor.upload = this.upload;
    this.crowd = new Crowd(this.scene, OP_OWN ? 96 : 72); this.sim = new Sim();
    this.me = new Walker(S.look); this.me.addTo(this.scene); this.me.place([0, 0.1, 2], PI);
    this.cam = new FollowCam(); this.cam.yaw = 0; this.cam.snap = true;
    this.inB = null; this.acts = []; this.act = null; this.npcs = []; this.people = []; this.staffAg = {}; this.cameoPets = {};
    this.buildPets(); this.buildPeople(); this.buildTrucks(); this.buildSpills(); this.buildBubbles(); this.buildCarry();
    this.refreshStores(true); this.online = new Online(this); this.setVis(true);
  }
  add(o) { this.scene.add(o); return o; }
  // ---------------- characters ----------------
  npc(id, o) { const p = makePet(id, o); p.x = o.at[0]; p.z = o.at[1]; p.y = o.y || 0.06; p.yaw = o.yaw || 0; p.talk = o.talk; p.label = o.label; p.region = o.region; p.root.position.set(p.x, p.y, p.z); p.root.rotation.y = p.yaw; this.add(p.root); this.npcs.push(p); return p; }
  buildPets() { const G1 = GEOM.s1;
    this.luna = this.npc('luna', { at: SPOTS.luna, y: 0.06, yaw: PI, s: 1.25, label: '💬 Talk to Luna', region: 'in_ratita', talk: () => talk(LINES.luna, null, [{ t: S.unlock.selfck ? '🤖 Already licensed!' : `🤖 Robo-Checkout license ($${EMPIRE.selfck})`, f: () => this.buySelfck() }, ...(S.unlock.selfck && !S.cameos.luna ? [{ t: '🐭 Hire Luna as a cashier', f: () => this.hireCameo('luna') }] : []), { t: 'Bye!', f: () => {} }]) });
    this.torty = this.npc('torty', { at: SPOTS.torty, yaw: PI, s: 1.0, label: '💬 Talk to Torty', region: 'in_tortuga', talk: () => talk(LINES.torty, null, [{ t: S.unlock.cold ? '❄️ Cold Chain installed' : `❄️ Cold Chain upgrade ($${EMPIRE.cold})`, f: () => this.buyCold() }, ...(S.unlock.cold && !S.cameos.torty ? [{ t: '🐢 Hire Torty as asst. manager', f: () => this.hireCameo('torty') }] : []), { t: 'Bye!', f: () => {} }]) });
    this.candy = this.npc('candy', { at: SPOTS.candy, yaw: PI, label: '💬 Pet Candy', region: 'in_ruff', talk: () => talk(LINES.candy, null, [{ t: '🤝 Hire staff', f: () => this.app.ui.hire() }, ...(S.day >= 3 && !S.cameos.candy ? [{ t: '🐶 Hire Candy as greeter', f: () => this.hireCameo('candy') }] : []), { t: 'Good girl!', f: () => {} }]) });
    this.pirat = this.npc('pirat', { at: [G1.doorX - 2.8, G1.front - 2.6], yaw: PI, s: 1.25, label: '💬 Talk to Pi-rat', region: 'in_s1', talk: () => talk(LINES.pirat, null, [...(S.day >= 2 && !S.cameos.pirat ? [{ t: '🏴‍☠️ Make Pi-rat official security greeter', f: () => this.hireCameo('pirat') }] : []), { t: 'Arr!', f: () => {} }]) });
    this.snowie = this.npc('snowie', { at: [SPOTS.farmStand[0] + 3, SPOTS.farmStand[1] + 1], yaw: PI, s: 1.25, label: '💬 Talk to Snowie', region: 'in_farm', talk: () => talk(LINES.snowie, null, [...(S.dc && !S.cameos.snowie ? [{ t: '🐁 Hire Snowie as speed stocker', f: () => this.hireCameo('snowie') }] : []), { t: '🧺 Order stock', f: () => this.app.ui.orders('farm') }, { t: 'Hi Snowie!', f: () => {} }]) });
    [['corgi', [[-6, 16.2], [24, 16.2], [24, 11.8], [-6, 11.8]], 0x2563eb], ['golden', [[-90, 52.2], [-34, 52.2]], 0xff4fa0], ['beagle', [[36, 16.4], [86, 16.4]], 0x16a34a]].forEach(([br, walk, col], i) => { const p = this.npc('dog' + i, { breed: br, collar: col, s: 0.8, seed: i * 5 + 1, at: walk[0], region: 'out', label: '💬 Say hi', talk: () => talk([[['Biscuit', 'Goldie', 'Barnaby'][i], ['Woof! I shop at Grok Grocery for the free dog treats at register 3.', 'I came for kibble and left with a cake. Every time.', 'Bargain Bonanza is cheap, but YOUR store smells like fresh bread.'][i]]]) }); p.walk = walk; p.wi = 0; p.wait = 0; });
  }
  buildPeople() { const G1 = GEOM.s1, Gr = GEOM.rival, Gq = GEOM.rival2; const P0 = (name, at, ry, region, lines, opt = {}) => { const a = { name, x: at[0], z: at[1], ry, region, look: this.crowd.look(name.length * 977 + name.charCodeAt(0), !!opt.staff), vis: true, talk: lines, label: '💬 ' + name, opt }; if (opt.shirt) a.look.shirt = opt.shirt; if (opt.cap) a.cap = true; this.people.push(a); return a; };
    this.gus = P0('Grandpa Gus', [G1.doorX + 3.2, G1.front - 3.4], PI, 'in_s1', () => this.talkGus(), { shirt: 0x7c4a1e, ok: () => S.mode === 'career' && S.rank < 5 });
    this.penny = P0('Penny Parsnip', [GEOM.s1.office[0] - 1.8, GEOM.s1.office[1] - 1.4], 0.3, 'in_s1', () => this.talkPenny(), { staff: true });
    P0('Farmer Fern', SPOTS.fern, PI, 'in_farm', () => talk(LINES.fern, null, [{ t: '🧺 Order fresh stock', f: () => this.app.ui.orders('farm') }, { t: 'Thanks!', f: () => {} }]), { shirt: 0x65a30d, cap: true });
    P0('Inspector Prue', SPOTS.inspector, PI, 'in_hall', () => talk(LINES.prue, null, [{ t: '📋 Inspection records', f: () => this.app.ui.records() }, { t: 'I\'ll keep it clean!', f: () => {} }]), { shirt: 0x0f766e });
    P0('Banker Bo', SPOTS.banker, PI, 'in_hall', () => talk(LINES.banker, null, [{ t: '🏦 Loans', f: () => this.app.ui.bank() }, { t: 'No thanks', f: () => {} }]), { shirt: 0x1e3a8a });
    P0('Max Markdown', [Gr.office[0] - 1.8, Gr.office[1] - 1.4], 0.3, 'in_rival', () => talk(LINES.max, null, [{ t: '📰 Compare prices', f: () => this.app.ui.spy('rival') }, { t: 'See ya!', f: () => {} }]), { shirt: 0xdc2626 });
    P0('Ms. Quinn', [Gq.office[0] - 1.8, Gq.office[1] - 1.4], 0.3, 'in_rival2', () => talk(LINES.quinn, null, [{ t: '📰 Compare prices', f: () => this.app.ui.spy('rival2') }, { t: 'Bye!', f: () => {} }]), { shirt: 0x4f46e5 });
    for (const d of STORES) if (d.strip) { const Gx = GEOM[d.id]; P0(d.boss, [Gx.office[0] - 1.6, Gx.office[1] - 1.3], 0.3, 'in_' + d.id, () => talk([[d.boss, `Welcome to ${d.name}! ${({ supercenter: 'Groceries, TVs, socks, sofas... we sell EVERYTHING. Good luck competing.', toy: 'Every kid in Shopsville wants our plushies. Try to keep up!', shoe: 'We measure every foot twice. Our prices? Step right up.', tech: 'Newest gadgets first. Big screens, bigger margins.', pet: 'Candy shops here, you know. Well... sometimes.', clothing: 'Fashion moves fast. Our racks move faster.', pharmacy: 'Healthy town, happy town. And our vitamins are on sale.' })[d.type]}`]], null, [{ t: '📰 Compare prices', f: () => this.app.ui.spy(d.id) }, ...(S.mode === 'boss' ? [{ t: `💰 Make an offer ($${d.price.toLocaleString('en-US')})`, f: () => this.buyout(d.id) }] : []), { t: 'Just browsing', f: () => {} }]), { shirt: d.trim, ok: () => !mine(d.id) }); }
    P0('Ruffsources Clerk', [SPOTS.ruffDesk[0] + 0.6, SPOTS.ruffDesk[1] - 2.7], 0, 'in_ruff', () => this.app.ui.hire(), { shirt: 0xc8634a });
    P0('Grok Goods Chef', [SPOTS.labKitchen[0] - 2, SPOTS.labKitchen[1] + 5.5], PI, 'in_lab', () => this.app.ui.brand(), { shirt: 0xffffff, staff: true });
    P0('Dispatcher Dee', [SPOTS.dcBoard[0] + 1.6, SPOTS.dcBoard[1] - 1.5], PI, 'in_dc', () => S.dc ? this.app.ui.orders() : talk([['Dispatcher Dee', 'This warehouse is for sale! Buy it and I\'ll run your trucks: cheaper stock, faster deliveries to every store.']]), { shirt: 0xf97316, cap: true });
    // townsfolk strolling the sidewalks
    this.walkers = []; const loops = [[[-96, 7.6], [96, 7.6]], [[96, 20.4], [-96, 20.4]], [[-96, 43.6], [96, 43.6]], [[90, 56.4], [-90, 56.4]], [[-24, 7.4], [70, 7.4]], [[-60, 20.6], [60, 20.6]], [[-23.6, 0], [-23.6, 46]], [[36.4, 46], [36.4, 0]]];
    loops.forEach((pts, i) => { const a = { x: pts[0][0] + i * 7, z: pts[0][1], ry: 0, look: this.crowd.look(4000 + i * 31, false), vis: true, path: pts, wi: 1, region: 'out', cart: false, sp: 0 }; this.walkers.push(a); }); }
  talkGus() { if (!S.talks.gus) { S.talks.gus = 1; persist(); talk(LINES.gus0); return; } if (S.rank >= 4 && S.xp >= RANKS[5].xp) { talk(LINES.gusSell, null, [{ t: S.money >= 1500 ? '👑 Buy the store ($1,500)' : `Need $1,500 (you have $${S.money})`, f: () => this.becomeOwner() }, { t: 'Not yet', f: () => {} }]); return; } talk(LINES.gus); }
  talkPenny() { if (S.mode === 'boss') { if (!S.talks.boss0) { S.talks.boss0 = 1; persist(); talk(LINES.boss0, () => this.app.ui.desk()); return; } talk([['Penny Parsnip', 'Need the Manager\'s Desk, boss?']], null, [{ t: '💼 Open the desk', f: () => this.app.ui.desk() }, { t: 'Later', f: () => {} }]); return; }
    talk(LINES.penny, null, [{ t: '⏰ Today\'s tasks', f: () => this.app.ui.clock() }, ...(S.rank >= 2 ? [{ t: '💼 Manager\'s Desk', f: () => this.app.ui.desk() }] : []), { t: 'Thanks!', f: () => {} }]); }
  becomeOwner() { if (S.money < 1500) { toast('💸 Save up $1,500 from your wages first'); return; } S.money -= 1500; S.rank = 5; S.mode = 'boss'; const s1 = S.stores.s1; s1.owned = true; S.talks.boss0 = 1; news('Former courtesy clerk buys Grok Grocery Main St from Grandpa Gus!'); persist(); sfx('win'); this.app.ui.banner('👑 YOU OWN THE STORE!', 'Career complete: now build your grocery empire (Boss mode).'); this.refreshStores(); }
  // ---------------- trucks, spills, bubbles, carried case ----------------
  buildTrucks() { const b = MB(); b.g.add(P.rbox, 0xffffff, 0, 1.75, -1.0, 0, 0, 0, 2.4, 2.6, 5.2); b.g.add(P.rbox, 0x16a34a, 0, 1.3, 2.4, 0, 0, 0, 2.3, 1.9, 1.6); b.e.add(P.rboxS, 0xbfe9ff, 0, 1.8, 3.2, 0, 0, 0, 2.1, 0.8, 0.1); b.g.add(P.rboxS, 0x16a34a, 1.21, 1.8, -1.0, 0, 0, 0, 0.02, 1.0, 4.2); b.g.add(P.rboxS, 0x16a34a, -1.21, 1.8, -1.0, 0, 0, 0, 0.02, 1.0, 4.2);
    [-1, 1].forEach((s) => [-2.6, -1.5, 2.3].forEach((z) => b.m.add(P.torus, 0x111827, s * 1.05, 0.45, z, 0, PI / 2, 0, 0.36, 0.36, 0.5))); b.l.add(P.sphereLo, 0xfff7c2, 0.8, 0.9, 3.25, 0, 0, 0, 0.15, 0.12, 0.05, 0.5); b.l.add(P.sphereLo, 0xfff7c2, -0.8, 0.9, 3.25, 0, 0, 0, 0.15, 0.12, 0.05, 0.5); b.l.add(P.sphereLo, 0xfacc15, 1.22, 2.2, -1, 0, 0, 0, 0.02, 0.4, 0.4, 0.4);
    this.truckProto = meshFrom(b); this.truckM = []; }
  buildSpills() { const g = compact(new THREE.CylinderGeometry(1, 1, 0.02, 14), 'g'); g.setAttribute('color', new THREE.BufferAttribute(new Uint8Array(g.attributes.position.count * 3).fill(255), 3, true)); this.spillM = new THREE.InstancedMesh(g, MATS.g, 40); this.spillM.count = 0; this.spillM.frustumCulled = false; this.add(this.spillM);
    const sg = new THREE.ConeGeometry(0.25, 0.7, 4); const sc = new Float32Array(sg.attributes.position.count * 3); for (let i = 0; i < sc.length; i += 3) { sc[i] = 1.6; sc[i + 1] = 1.3; sc[i + 2] = 0.1; } sg.setAttribute('color', new THREE.BufferAttribute(sc, 3)); this.signM = new THREE.InstancedMesh(sg, MATS.l, 40); this.signM.count = 0; this.signM.frustumCulled = false; this.add(this.signM); }
  buildBubbles() { this.bubTex = { help: emojiTex('❓'), angry: emojiTex('😤'), cash: emojiTex('💵'), oos: emojiTex('📭'), you: emojiTex('🧾') }; this.bubbles = []; for (let i = 0; i < 14; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.bubTex.help, depthTest: true, transparent: true })); s.scale.set(0.6, 0.6, 1); s.visible = false; s.renderOrder = 3; this.add(s); this.bubbles.push(s); } this.cashFx = []; }
  buildCarry() { const b = MB(); b.m.add(P.rboxS, 0xc9a06a, 0, 0, 0, 0, 0, 0, 0.55, 0.4, 0.42); b.g.add(P.rboxS, 0x16a34a, 0, 0, 0.215, 0, 0, 0, 0.22, 0.15, 0.01); this.caseProto = meshFrom(b); this.caseM = this.caseProto.clone(); this.attachCarry(); }
  attachCarry() { this.me.rig.body.add(this.caseM); this.caseM.position.set(0, 1.05, 0.42); this.caseM.visible = !!this.carry; }
  // ---------------- store state -> visuals ----------------
  // per-shelf stock: st.ss[i] = items on the fixture in slot i. Department totals (st.shelf) stay the truth for the sim; this keeps a
  // sticky per-fixture split so the shelf you stocked stays full until shoppers actually take items from it.
  slotStock(st) { const L = st.layout; if (!st.ss || st.ss.length !== L.length) { const o = st.ss || []; st.ss = L.map((f, i) => o[i] || 0); }
    for (let i = 0; i < L.length; i++) { const f = L[i]; if (!f || !FIX[f].dept) st.ss[i] = 0; else st.ss[i] = Math.max(0, Math.min(FIX[f].cap, st.ss[i] | 0)); }
    for (const d of DEPT_IDS) { const idx = []; let sum = 0; L.forEach((f, i) => { if (f && FIX[f].dept === d) { idx.push(i); sum += st.ss[i]; } }); if (!idx.length) continue; let diff = Math.round(st.shelf[d] || 0) - sum, g = 0;
      while (diff !== 0 && g++ < 4000) { let b = -1, bf = diff > 0 ? 9 : -1; for (const i of idx) { const c = FIX[L[i]].cap, fr = st.ss[i] / c; if (diff > 0 ? st.ss[i] < c && fr < bf : st.ss[i] > 0 && fr > bf) { bf = fr; b = i; } } if (b < 0) break; st.ss[b] += diff > 0 ? 1 : -1; diff += diff > 0 ? -1 : 1; } }
    return st.ss; }
  variantOf(st) { const ss = this.slotStock(st); return (f, i) => { if (i === undefined) { const fr = shelfFrac(st, FIX[f].dept); return fr >= 0.5 ? 0 : fr > 0 ? 1 : 2; } const n = ss[i] || 0, fr = n / FIX[f].cap; return fr >= 0.5 ? 0 : n > 0 ? 1 : 2; }; }
  refreshStores(force) { for (const d of STORES) { const st = S.stores[d.id]; const show = st && (st.owned || d.id === 's1' || d.rival); const layout = show ? st.layout : [];
      const stype = (st && st.type) || d.type || 'grocery', vo = show ? this.variantOf(st) : null, sig = stype + '|' + layout.map((f, i) => f ? f + (FIX[f].dept && vo ? vo(f, i) : '') : '').join(','); if (force || sig !== this.fxSig[d.id]) { this.fxSig[d.id] = sig; this.fixtures.sync(d.id, layout, vo || (() => 0), stype);
        this.slotSol[d.id].forEach((o, i) => { const f = layout[i] || ''; for (const k in o) o[k].forEach((s) => { s.off = !(k === 'floor' ? f && FIX[f].kind === 'floor' : k === 'promo' ? !!show && !f : f === k); }); }); } }
    this.refreshDecor(); for (const s of this.dcSol) s.off = !S.dc; const RM = this.world.regionMeshes; const set = (k, v) => (RM[k] || []).forEach((m) => m.visible = v);
    for (const id of ['s2', 's3']) { const own = S.stores[id] && S.stores[id].owned; set('own_' + id, own); set('sale_' + id, !own); } set('own_dc', S.dc); set('sale_dc', !S.dc);
    this.snowie.x = S.dc ? SPOTS.dcBoard[0] + 3 : SPOTS.farmStand[0] + 3; this.snowie.z = S.dc ? SPOTS.dcBoard[1] - 3 : SPOTS.farmStand[1] + 1; this.snowie.region = S.dc ? 'in_dc' : 'in_farm';
    this.rebuildStaff(); this.checkGoals(); }
  refreshDecor() { for (const d of STORES) { const st = S.stores[d.id]; if (d.rival && !(st && st.owned)) this.decor.set(d.id, d.type, d.brandName, true);
      else if (d.id === 's1' || (st && st.owned)) { const t = (st && st.type) || 'grocery'; this.decor.set(d.id, t, TYPES[t].brand, false); } else this.decor.drop(d.id); } this._decorVis = null; }
  storeTitle(sid) { const d = STORE[sid], st = S.stores[sid]; if (!d) return ''; if (d.rival && !(st && st.owned)) return d.name; if (sid === 's1' || (st && st.owned)) return 'Grok ' + typeOf(st).n + ' · ' + d.short; return d.short + ' (lot for sale)'; }
  // each pet exists exactly once: hired cameo pets are reused (never rebuilt on refresh), duplicates in old saves are dropped,
  // and the pet's home NPC steps away while it works a store or visits as the VIP shopper
  rebuildStaff() { const pool = {}; for (const sid in this.cameoPets) for (const p of this.cameoPets[sid]) pool[p.id] = p; this.cameoPets = {}; const seen = {};
    for (const sid of storeIds()) { const st = S.stores[sid]; if (!st || !st.staff) continue; st.staff = st.staff.filter((s) => { if (!s.cameo) return true; if (seen[s.cameo] || (S.cameos[s.cameo] && S.cameos[s.cameo] !== sid)) return false; seen[s.cameo] = sid; return true; }); }
    for (const id in S.cameos) if (S.cameos[id] && !seen[id]) delete S.cameos[id];
    for (const sid of storeIds()) { const st = S.stores[sid]; const old = this.staffAg[sid] || []; this.staffAg[sid] = st.staff.map((s, i) => { const prev = old[i]; const G = GEOM[sid]; const a = prev && prev.role === s.role && prev.name === s.name ? prev : { role: s.role, name: s.name, x: G.stock[0], z: G.back + 1.3, ry: 0, look: this.crowd.look(i * 131 + sid.length * 17 + s.name.length * 7, true), vis: true, path: [], wait: Math.random() * 3, sp: 0 }; a.cameo = s.cameo;
        if (sid === 'rival') a.look.shirt = 0xfde047; else if (sid === 'rival2') a.look.shirt = 0xc7d2fe; else if (STORE[sid].boss || STORE[sid].strip) a.look.shirt = STORE[sid].trim;
        if (s.cameo) { let p = pool[s.cameo]; if (p) delete pool[s.cameo]; else { p = makePet(s.cameo, { s: s.cameo === 'torty' ? 0.9 : 1.2 }); p.x = a.x; p.z = a.z; p.y = 0.06; p.root.position.set(a.x, 0.06, a.z); this.add(p.root); } (this.cameoPets[sid] || (this.cameoPets[sid] = [])).push(p); a.pet = p; } return a; }); } for (const id in pool) this.scene.remove(pool[id].root); }
  petAway(id) { return !!S.cameos[id] || !!(this.vipPet && this.vipPet.id === id); }
  // ---------------- per-frame helpers ----------------
  storeVisible(sid) { const RM = this.world.regionMeshes['in_' + sid]; return !!(RM && RM[0] && RM[0].visible); }
  setVis(force) { const me = this.me; const b = buildingAt(me.x, me.z); if (b !== this.inB || force) { this.inB = b; this.app.hud.region(b ? (STORE[b.id] ? typeOf(S.stores[b.id]).e + ' ' + this.storeTitle(b.id) : b.name) : '🌳 Shopsville'); }
    const RM = this.world.regionMeshes; for (const B of BUILDINGS) { const inIt = B === b; (RM['roof_' + B.id] || []).forEach((m) => m.visible = !inIt || this.fp);
      const d = Math.max(0, B.x0 - me.x, me.x - B.x1, B.z0 - me.z, me.z - B.z1); const show = inIt || (d < 26 && !this.fp) || (this.fp && d < 6); (RM['in_' + B.id] || []).forEach((m) => m.visible = show); if (STORE[B.id]) { this.fixtures.show(B.id, show); this.decor.vis(B.id, !(inIt && !this.fp), show); } if (B.id === 'dc') (RM.ownin_dc || []).forEach((m) => m.visible = show && S.dc); }
    for (const p of this.npcs) { p._rv = !p.region || p.region === 'out' || (RM[p.region] && RM[p.region][0] ? RM[p.region][0].visible : true); p.root.visible = p._rv && !this.petAway(p.id); }
    for (const sid in this.cameoPets) for (const p of this.cameoPets[sid]) p.root.visible = this.storeVisible(sid); }
  fades() { const b = this.inB, c = E.camera.position, me = this.me; _v.set(me.x, me.y + 1.2, me.z).sub(c); const L = _v.length(); _r.set(c, _v.normalize());
    for (const B of BUILDINGS) for (const f of B.fades) { let hide = false; if (B === b && !this.fp) { _b.copy(f.box).expandByScalar(0.05); const p = _r.intersectBox(_b, _s); hide = !!p && c.distanceTo(p) < L - 0.3; } if (f._h !== hide) { f._h = hide; f.meshes.forEach((m) => m.visible = !hide); } } }
  curStore() { const b = this.inB; return b && STORE[b.id] ? b.id : null; }
  canWork(sid) { return sid && (mine(sid)); }
  // ---------------- jobs + rewards ----------------
  reward(kind, frac, extra = '') { frac = Math.max(0, Math.min(1, frac)); const career = S.mode === 'career'; const base = { bag: 6, carts: 2, clean: 6, help: 5, stock: 7, scan: 8, special: 10 }[kind] || 4; const xp = Math.round(base * (0.4 + frac));
    if (career) { S.xp += xp; S.worked = 1; const tip = Math.round(frac * base * 0.6); S.money += tip; const t = S.daily.t; if (t && t[kind] !== undefined && t[kind] >= 0) { t[kind]++; const need = TASKS[kind][2]; if (t[kind] >= need) { t[kind] = -1; S.xp += 15; S.money += 20; toast(`✅ Daily task done: ${TASKS[kind][1]}! +15 XP, +$20`); sfx('win'); } } toast(`+${xp} XP${tip ? ' · +$' + tip + ' tips' : ''}${extra}`); this.checkPromo(); }
    else { const st = S.stores[this.curStore()] || S.stores.s1; st.rep = Math.min(100, st.rep + frac * 0.8); if (extra) toast(extra.trim()); }
    S.stats[{ bag: 'bags', carts: 'carts', clean: 'cleans', help: 'helps', stock: 'stocks' }[kind] || 'x'] = (S.stats[{ bag: 'bags', carts: 'carts', clean: 'cleans', help: 'helps', stock: 'stocks' }[kind] || 'x'] || 0) + 1; persist(); }
  checkPromo() { const nx = RANKS[S.rank + 1]; if (S.mode !== 'career' || !nx || S.rank >= 4 && true && S.rank + 1 === 5) return; if (S.xp >= nx.xp) { S.rank++; persist(); sfx('win'); this.app.ui.banner(`${nx.e} PROMOTED: ${nx.n.toUpperCase()}!`, nx.can); news(`${S.name || 'Our clerk'} promoted to ${nx.n}!`); } }
  mg(id, opt, done) { this.app.paused = true; this.app.busy = true; this.app.ui.minigame(id, (sc) => { this.app.resume(); done && done(sc); }, opt); }
  grabCase(sid) { const st = S.stores[sid]; let best = null, bf = 9; for (const k of DEPT_IDS) { const c = capOf(st, k); if (!c || st.back[k] <= 0) continue; const f = st.shelf[k] / c; if (f < bf) { bf = f; best = k; } } if (!best) { toast('📭 No backstock! ' + (S.mode === 'boss' || S.rank >= 2 ? 'Order more at the Manager\'s Desk.' : 'Penny has ordered more.')); return; } if (bf > 0.95) { toast('👍 Every shelf is already full!'); return; } this.carry = { sid, dept: best }; this.caseM.visible = true; sfx('pop'); toast(`📦 Got a case of ${DEPTS[best].n}. Find a ${DEPTS[best].n} shelf!`); }
  stockShelf(sid, dept, slot) { const st = S.stores[sid]; this.mg('stock', { dept }, (sc) => { const ss = this.slotStock(st); const f = st.layout[slot]; const room = f && FIX[f].dept === dept ? FIX[f].cap - ss[slot] : 0; const n = Math.max(0, Math.min(st.back[dept], capOf(st, dept) - st.shelf[dept], Math.max(Math.round(6 + sc * 18), room))); st.back[dept] -= n; st.shelf[dept] += n; if (room > 0) ss[slot] += Math.min(n, room); this.carry = null; this.caseM.visible = false; this.reward('stock', sc, ` · +${n} on the shelf`); this.refreshStores(); }); }
  help(a) { const st = S.stores[a.sid] || S.stores.s1; const have = [...new Set(st.layout.filter((f) => f && FIX[f].dept).map((f) => FIX[f].dept))]; const pool = have.length >= 2 ? have : DEPT_IDS; const ans = pool[(a.seed >> 3) % pool.length], items = DEPT_ITEMS[ans], item = items[(a.seed >> 5) % items.length];
    const opts = [ans]; let g = 0; while (opts.length < 3 && g++ < 50) { const src = have.length >= 3 ? have : DEPT_IDS; const d = src[(Math.random() * src.length) | 0]; if (!opts.includes(d)) opts.push(d); } opts.sort(() => Math.random() - 0.5); const q = [`Excuse me! Where would I find ${item}?`, ans];
    talk([['Shopper', q[0]]], null, opts.map((d) => ({ t: DEPTS[d].e + ' ' + DEPTS[d].n, f: () => { a.help = false; a.wait = 0; if (d === q[1]) { sfx('ding'); talk([['Shopper', 'Oh, perfect! Thank you so much!']]); this.reward('help', 1); a.mood = 1.2; } else { sfx('squeak'); talk([['Shopper', 'Hmm, I don\'t think it\'s there... I\'ll keep looking.']]); this.reward('help', 0.2); } } }))); }
  // purchases
  spend(n) { if (S.money < n) { toast(`💸 You need $${n.toLocaleString('en-US')}`); sfx('deny'); return false; } S.money -= n; sfx('buy'); return true; }
  bossOnly() { if (S.mode !== 'boss') { toast('👑 Only the owner can buy that. Keep climbing the ranks!'); return false; } return true; }
  buySelfck() { if (S.unlock.selfck) return; if (!this.bossOnly() || !this.spend(EMPIRE.selfck)) return; S.unlock.selfck = true; persist(); this.app.ui.banner('🤖 ROBO-CHECKOUT UNLOCKED', 'Build Ratita self-checkouts in any checkout slot from the Manager\'s Desk.'); }
  buyCold() { if (S.unlock.cold) return; if (!this.bossOnly() || !this.spend(EMPIRE.cold)) return; S.unlock.cold = true; for (const sid of storeIds()) if (mine(sid)) S.stores[sid].rep += 2; persist(); this.app.ui.banner('❄️ COLD CHAIN INSTALLED', 'Freezers survive power blips. Torty can now join your team.'); }
  hireCameo(id) { if (!this.bossOnly()) return; const c = CAMEOS[id]; const sid = this.curStore() && mine(this.curStore()) ? this.curStore() : 's1'; S.cameos[id] = sid; S.stores[sid].staff.push({ role: c.role, name: c.n, skill: 5, cameo: id }); persist(); sfx('win'); this.app.ui.banner(`${c.e} ${c.n.toUpperCase()} JOINS THE TEAM!`, c.perk); this.refreshStores(); }
  buyStore(id, type) { if (!this.bossOnly()) return; const d = STORE[id]; if (S.stores[id] && S.stores[id].owned) return; if (!type) { this.app.ui.pickType((t) => this.buyStore(id, t), { big: GEOM[id].W >= 44, title: `🏷️ ${d.short}: what kind of store?`, price: d.price }); return; } if (!this.spend(d.price)) return; { const st = S.stores[id] = newStore(id, type === 'grocery' ? 'starter' : 0.8, type, 3); st.owned = true; st.staff = [{ role: 'cashier', name: staffName(2), skill: 2 }, { role: 'stocker', name: staffName(3), skill: 2 }]; news(`Grok opens a new ${TYPES[type].n.toLowerCase()} on ${d.short}!`); persist(); this.sim.seedCarts(); this.refreshStores(); this.app.ui.banner(`${TYPES[type].e} NEW ${TYPES[type].n.toUpperCase()}: ${d.short.toUpperCase()}`, 'Walk in to see it. Customize it from any Manager\'s Desk.'); } }
  // remodel one of your stores into another type (new floor plan, new decor, new staff tasks)
  remodel(sid, type) { const st = S.stores[sid], G = GEOM[sid]; if (!st || st.type === type) return; if (TYPES[type].big && G.W < 44) { toast('🏬 A supercenter needs a big lot (Main St or MegaMart)'); return; } const cost = S.mode === 'boss' ? 1500 : 0; if (cost && !this.spend(cost)) return;
    const nReg = st.layout.filter((f) => f === 'register').length || 2; st.type = type; st.layout = autoLayout(type, G, 0.75, nReg);
    for (const k of DEPT_IDS) { const c = capOf(st, k); st.shelf[k] = Math.round(c * 0.7); st.back[k] = Math.round(c * 0.5); } this.carry = null; this.caseM.visible = false; this.sim.ag[sid].length = 0; news(`${STORE[sid].short} reopens as a ${TYPES[type].n.toLowerCase()}!`); persist(); sfx('win'); this.refreshStores(true); this.setVis(true);
    this.app.ui.banner(`${TYPES[type].e} REMODELED: ${TYPES[type].brand}`, TYPES[type].blurb); }
  buyout(id) { if (!this.bossOnly()) return; const st = S.stores[id], d = STORE[id]; const best = Math.max(...storeIds().filter(mine).map((k) => S.stores[k].rep)); const n = storeIds().filter(mine).length; if (!d.easy && (n < 2 || best <= st.rep)) { toast(`📉 You need 2+ stores and a store with better reputation than ${d.name} (${Math.round(st.rep)})`); return; } if (!this.spend(d.price)) return; st.owned = true; for (const k in st.price) st.price[k] = 1; st.staff = st.staff.filter((s) => s.name !== d.boss && s.name !== 'Max Markdown' && s.name !== 'Ms. Quinn'); st.staff.forEach((s) => s.name = s.name.replace(/Bonanza|Quick|Mega|ToyTopia|Sole Patrol|ZapZone|PawPals|Fit & Fab|PillBox/g, 'Grok')); news(`SHOCK BUYOUT! ${d.name} now belongs to Grok Grocery.`); if (id === 'rival') S.goals.buyout = 1; persist(); this.refreshStores(); this.app.ui.banner('💰 BUYOUT COMPLETE!', `${d.name} is now part of your empire.`); }
  buyDC() { if (S.dc || !this.bossOnly() || !this.spend(EMPIRE.dc)) return; S.dc = true; S.trucks = Math.max(S.trucks, 2); news('Grok Grocery opens a distribution center! Stock now ships cheaper and faster.'); persist(); this.refreshStores(); this.app.ui.banner('🏭 DISTRIBUTION CENTER OPEN', 'All stock now ships from your DC: 18% cheaper. Snowie can join as a speed stocker.'); }
  checkGoals() { if (S.mode !== 'boss') return; const M = storeIds().filter(mine); const depts = new Set(); M.forEach((k) => S.stores[k].layout.forEach((f) => f && FIX[f].dept && depts.add(FIX[f].dept))); const staff = M.reduce((a, k) => a + S.stores[k].staff.length, 0);
    const G = S.goals, before = Object.keys(G).length; if (depts.size >= 6) G.dept6 = 1; if (staff >= 4 + (S.mode === 'boss' ? 0 : 0)) G.staff4 = 1; if (M.length >= 2) G.store2 = 1; if (M.length >= 3) G.store3 = 1; if (S.dc) G.dc = 1; if (S.brand.on) G.brand = 1; if (S.trucks >= 3) G.fleet = 1; if (S.stores.rival && S.stores.rival.owned) G.buyout = 1; if (new Set(M.map((k) => S.stores[k].type || 'grocery')).size >= 3) G.mix3 = 1; if (M.length >= 5 && S.dc && S.brand.on) G.tycoon = 1;
    if (Object.keys(G).length > before) { const g = GOALS.filter(([k]) => G[k]).pop(); sfx('win'); toast('🏆 Empire goal: ' + (g ? g[1] : '')); if (G.tycoon && !S.badges.tycoon) { S.badges.tycoon = 1; this.app.ui.banner('👑 RETAIL TYCOON!', 'Five stores, a DC and your own brand. Shopsville bows to your carts.'); } persist(); } }
  // ---------------- interactions ----------------
  gather() { if (this.online && this.online.p52 && this.online.p52.d) return this.online.p52.act(); const me = this.me, out = [], sid = this.curStore(), st = sid && S.stores[sid], G = sid && GEOM[sid]; const push = (x, z, r, label, f) => { const d = Math.hypot(me.x - x, me.z - z); if (d < r) out.push({ d, label, f }); };
    for (const p of this.npcs) if (p.talk && p.root.visible) push(p.x, p.z, 2.3, p.label, p.talk); else if (p.talk && p._rv && p.id !== 'pirat' && this.petAway(p.id)) push(p.x, p.z, 2.3, p.label.replace('Talk to', 'Leave a note for').replace('Pet ', 'Leave a note for ') + ' (away)', p.talk);
    for (const a of this.people) { if (a.opt.ok && !a.opt.ok()) continue; if (a.region !== 'out' && !(this.world.regionMeshes[a.region] || [{ visible: true }])[0].visible) continue; push(a.x, a.z, 2.2, a.label, a.talk); }
    if (sid && STORE[sid].rival && !mine(sid)) { st.layout.forEach((f, i) => { if (!f || !FIX[f].dept) return; const sl = G.slots[i]; push(sl.x + (me.x > sl.x ? 1.6 : -1.6), me.z > sl.z - 2.5 && me.z < sl.z + 2.5 ? me.z : sl.z, 1.4, `🏷️ Check ${DEPTS[FIX[f].dept].n} prices`, () => this.spyDept(sid, FIX[f].dept)); }); push(G.doorX + 4.5, G.front - 1.5, 2.2, '📰 Read their deals flyer', () => this.app.ui.spy(sid)); }
    if (sid && this.canWork(sid)) {
      if (!this.carry) push(G.stock[0], G.stock[1] + 0.8, 2.2, '📦 Grab a case', () => this.grabCase(sid));
      st.layout.forEach((f, i) => { if (!f) return; const sl = G.slots[i], fx = FIX[f];
        if (fx.dept) { const dz = Math.max(0, Math.abs(me.z - sl.z) - 2.6), dx = Math.max(0, Math.abs(me.x - sl.x) - 1.0), d = Math.hypot(dx, dz); if (d < 1.2) { if (this.carry && this.carry.dept === fx.dept && this.carry.sid === sid) out.push({ d, label: `📦 Stock ${DEPTS[fx.dept].n}`, f: () => this.stockShelf(sid, fx.dept, i) });
          else if (!this.carry) { const mgk = typeOf(st).sp[f]; const sp = mgk && [mgk, MG_NAMES[mgk][0] + ' ' + MG_NAMES[mgk][1]]; if (sp && (S.mode === 'boss' || S.rank >= 2) && !(this.cool[sid + i] > this.T)) out.push({ d: d + 0.3, label: sp[1], f: () => this.mg(sp[0], {}, (sc) => { this.cool[sid + i] = this.T + 90; st.rep = Math.min(100, st.rep + sc * 2); this.reward('special', sc, ` · ${DEPTS[fx.dept].n} looks amazing`); }) }); } } }
        else if (f === 'register') { const staffed = this.sim.staffed(sid)[i]; const x = sl.x - 1.3, z = sl.z; const mineLane = this.sim.playerReg && this.sim.playerReg.sid === sid && this.sim.playerReg.i === i;
          if (mineLane) { const head = this.sim.ag[sid].find((a) => a.lane === i && a.atYou); if (head) push(x, z, 2.4, '🧾 Scan their order', () => this.mg('scan', { items: head.items }, (sc) => { this.sim.pay(sid, st, G, head, Math.round(sc * 4)); this.reward('scan', sc); })); else push(x, z, 2.4, '🚪 Close my lane', () => { this.sim.playerReg = null; toast('Lane closed. Back to the floor!'); }); }
          else if (!staffed && (S.mode === 'boss' || S.rank >= 1)) push(x, z, 2.0, '🧾 Open this lane (be the cashier)', () => { this.sim.playerReg = { sid, i }; toast('🧾 You\'re on register! Scan shoppers as they arrive.'); });
          else if (staffed === 'staff') { const head = this.sim.ag[sid].find((a) => a.lane === i && a.st === 'q' && a.serve > 0 && !a.bagged); if (head) push(sl.x - 0.2, sl.z + 1.6, 2.0, '🛍️ Bag their groceries', () => this.mg('bag', {}, (sc) => { head.bagged = true; this.reward('bag', sc); })); } }
        else if (f === 'selfck' && this.sim.jam[sid + i]) push(sl.x, sl.z - 0.8, 2.2, '🔧 Unjam the self-checkout', () => { delete this.sim.jam[sid + i]; sfx('tune'); this.reward('clean', 1, ' · Beep boop, fixed!'); }); });
      for (const s of this.sim.spills[sid]) push(s.x, s.z, 1.7, '🧽 Mop the spill', () => this.mg('mop', {}, (sc) => { const k = this.sim.spills[sid].indexOf(s); if (k >= 0 && sc > 0.3) this.sim.spills[sid].splice(k, 1); st.clean = Math.min(100, st.clean + 8); this.reward('clean', sc); }));
      for (const a of this.sim.ag[sid]) if (a.help && a.st !== 'out') push(a.x, a.z, 2.0, '💬 Help this shopper', () => this.help(a));
      if (S.mode === 'boss' || S.rank >= 2) push(G.office[0], G.office[1] - 1.3, 2.0, '💼 Manager\'s Desk', () => this.app.ui.desk(sid));
      push(G.clock[0], G.clock[1], 2.0, '⏰ Time clock', () => this.app.ui.clock());
    }
    // parking lots: carts + for-sale signs
    for (const id of ['s1', 's2', 's3']) { const d = STORE[id], Gx = GEOM[id]; if (Math.abs(me.z - d.z1 - 7) > 12 || me.x < d.x0 - 4 || me.x > d.x1 + 4) continue;
      if (mine(id)) { if (this.cartsHeld < 6) for (const c of this.sim.carts[id]) push(c.x, c.z, 1.6, '🛒 Grab this cart', () => { const k = this.sim.carts[id].indexOf(c); if (k >= 0) { this.sim.carts[id].splice(k, 1); this.cartsHeld++; sfx('pop'); toast(`🛒 Carts: ${this.cartsHeld}/6 · push them to the corral`); } });
        if (this.cartsHeld) push(Gx.corral[0], Gx.corral[1], 2.6, `🛒 Return ${this.cartsHeld} cart${this.cartsHeld > 1 ? 's' : ''}`, () => { const n = this.cartsHeld; this.cartsHeld = 0; sfx('ding'); for (let i = 0; i < n; i++) this.reward('carts', 1); }); }
      else if (!S.stores[id] || !S.stores[id].owned) push(Gx.cx + 7, d.z1 + 8, 2.6, `🏷️ Buy this lot ($${d.price.toLocaleString('en-US')})`, () => this.buyStore(id)); }
    // shopping row: buy a rival shop from the sidewalk
    if (me.z < -55 && me.z > -66) for (const d of STORES) if (d.strip && !mine(d.id) && Math.abs(me.x - (GEOM[d.id].cx + 5.2)) < 3) push(GEOM[d.id].cx + 5.2, d.z1 + 1.4, 2.4, `🏷️ Buy ${d.short} ($${d.price.toLocaleString('en-US')})`, () => this.buyout(d.id));
    // buildings
    const SP = SPOTS;
    if (!S.dc) push(SP.dcDoor[0], SP.dcDoor[1], 2.6, `🏷️ Buy the warehouse ($${EMPIRE.dc.toLocaleString('en-US')})`, () => this.buyDC());
    push(SP.dcBoard[0], SP.dcBoard[1], 1.8, '🗺️ Dispatch board', () => S.dc ? this.app.ui.orders() : toast('🏭 Buy the warehouse first!'));
    if (S.dc) push(SP.dcLoad[0], SP.dcLoad[1], 2.4, '🚚 Pack the truck', () => this.mg('load', {}, (sc) => { this.reward('stock', sc, ' · Truck packed'); }));
    push(SP.ratKiosk[0], SP.ratKiosk[1], 2.2, S.unlock.selfck ? '🤖 Robo-Checkout (licensed!)' : `🤖 Robo-Checkout license $${EMPIRE.selfck}`, () => this.buySelfck());
    push(SP.ratLine[0], SP.ratLine[1], 2.0, '🧀 Taste-test the snack line', () => { sfx('crumb'); toast(['🧀 Luna\'s Cheesy Bites: 10/10, squeak.', '🍪 Crunchy! Ratita\'s new Grok-O\'s are on the line.', '🥫 Ratita Soup of the Day: Pi-rat\'s Pirate Chowder.'][(Math.random() * 3) | 0]); });
    push(SP.tortFreezer[0], SP.tortFreezer[1], 2.2, S.unlock.cold ? '❄️ Cold Chain (installed)' : `❄️ Cold Chain upgrade $${EMPIRE.cold}`, () => this.buyCold());
    push(SP.ruffDesk[0], SP.ruffDesk[1], 2.2, '🤝 Hire staff', () => this.app.ui.hire());
    push(SP.hallPermit[0], SP.hallPermit[1], 2.2, '🏪 Store permits + empire', () => this.app.ui.empire());
    push(SP.hallHealth[0], SP.hallHealth[1], 2.0, '📋 Inspection records', () => this.app.ui.records());
    push(SP.hallBank[0], SP.hallBank[1], 2.0, '🏦 Bank', () => this.app.ui.bank());
    push(SP.farmStand[0], SP.farmStand[1], 2.2, '🧺 Order fresh stock', () => this.app.ui.orders('farm'));
    push(SP.labKitchen[0], SP.labKitchen[1], 2.2, '⭐ Grok Goods brand lab', () => this.app.ui.brand());
    push(SP.labMachine[0], SP.labMachine[1], 2.0, '📦 Run the packing machine', () => this.mg('load', {}, (sc) => this.reward('stock', sc)));
    push(SP.fountain[0], SP.fountain[1], 2.2, '🪙 Toss a coin in the fountain', () => { if (S.money >= 1) S.money -= 1; sfx('splash'); toast(['🍎 You wished for a five-star inspection.', '✨ The fountain says: "Clean up on aisle 5."', '💧 Splash! A shopping-cart-shaped ripple.'][(Math.random() * 3) | 0]); });
    push(SP.foodtruck[0], SP.foodtruck[1], 2.2, '🌮 Buy a taco ($3)', () => { if (this.spend(3)) toast('🌮 Delicious. Grok Tacos uses Fernhill tomatoes.'); });
    this.online.gather(push);
    let best = null; for (const a of out) if (!best || a.d < best.d) best = a; return best; }
  spyDept(sid, dept) { const st = S.stores[sid], myId = storeIds().find((k) => mine(k) && capOf(S.stores[k], dept)) || 's1', my = S.stores[myId]; S.spy = S.spy || {}; S.spy[sid + dept] = S.day; const theirs = Math.round(DEPTS[dept].val * st.price[dept] * 100) / 100, mineP = Math.round(DEPTS[dept].val * my.price[dept] * 100) / 100;
    sfx('check'); talk([['Price tag', `${STORE[sid].name} ${DEPTS[dept].e} ${DEPTS[dept].n}: about $${theirs.toFixed(2)} an item. Yours: $${mineP.toFixed(2)}. ${theirs < mineP ? 'They\'re cheaper here!' : theirs > mineP ? 'You\'re cheaper. Nice!' : 'Same price.'}`]]); if (!S.spyXp || S.spyXp !== S.day + dept) { S.spyXp = S.day + dept; if (S.mode === 'career') this.reward('help', 0.5, ' · market research'); } }
  // ---------------- per-frame ----------------
  update(dt) { this.T += dt; const app = this.app, me = this.me;
    const busy = app.busy || talking(); const mv = busy ? { x: 0, y: 0 } : readMove(); const j = !busy && edge('jump');
    let inside = false; const P52 = this.online && this.online.p52; bonusTick(app);
    if (P52 && P52.d) { P52.tick(dt, mv); this.setVis(); inside = false; } else {
    if (edge('view')) this.toggleFP();
    if (this.fp) { if (IN.camDX || IN.camDY) { this.cam.yaw -= IN.camDX * 0.0065; this.fpPitch = Math.max(-1.1, Math.min(1.1, this.fpPitch - IN.camDY * 0.0045)); IN.camDX = IN.camDY = 0; } }
    me.update(dt, { mx: mv.x, my: mv.y, jump: j }, this.world, this.cam.moveYaw); if (this.fp) me.yaw = this.cam.moveYaw;
    this.setVis(); inside = !!this.inB;
    if (this.fp) { const c = E.camera, yw = this.cam.moveYaw, cp = Math.cos(this.fpPitch); c.position.set(me.x + Math.sin(yw) * 0.12, me.y + 1.62, me.z + Math.cos(yw) * 0.12); c.lookAt(c.position.x + Math.sin(yw) * cp, c.position.y + Math.sin(this.fpPitch), c.position.z + Math.cos(yw) * cp); if (c.fov !== 72) { c.fov = 72; c.updateProjectionMatrix(); } }
    else { this.cam.update(dt, me, inside ? null : this.world, inside ? { dist: 7.4 } : {}); if (inside) { this.cam.pitch = Math.max(this.cam.pitch, 0.62); const b = this.inB, c = E.camera.position, m = 0.7; const tx = me.x, ty = me.y + 1.4, tz = me.z; let k = 1; const lim = (v, t, lo, hi) => { if (v > hi && v !== t) k = Math.min(k, (hi - t) / (v - t)); if (v < lo && v !== t) k = Math.min(k, (lo - t) / (v - t)); }; lim(c.x, tx, b.x0 + m, b.x1 - m); lim(c.z, tz, b.z0 + m, b.z1 - m); if (k < 1) { k = Math.max(0.15, k); c.set(tx + (c.x - tx) * k, ty + (c.y - ty) * Math.max(k, 0.6), tz + (c.z - tz) * k); E.camera.lookAt(tx, me.y + 1.0, tz); } } else if (this.cam.pitch > 0.75) this.cam.pitch -= dt * 0.5; }
    }
    this.fades(); updateFrustum(E.camera); { if (this.sunBase == null) { this.sunBase = E.sun.intensity; this.hemiBase = E.hemi.intensity; } const ind = inside && !this.fp ? 1 : 0; this.indK = (this.indK || 0) + (ind - (this.indK || 0)) * Math.min(1, dt * 5); E.sun.intensity = this.sunBase * (1 - 0.62 * this.indK); E.hemi.intensity = this.hemiBase * (1 + 0.5 * this.indK); }
    // simulation + events
    this.sim.step(dt, this); this.events();
    this.fxT = (this.fxT || 0) - dt; if (this.fxT <= 0) { this.fxT = 0.6; this.refreshStores(); }
    // npcs
    for (const p of this.npcs) { if (p.walk) { const t = p.walk[p.wi]; const dx = t[0] - p.x, dz = t[1] - p.z, d = Math.hypot(dx, dz); const near = Math.hypot(me.x - p.x, me.z - p.z) < 2.6; if (near) p.speed = 0; else if (p.wait > 0) { p.wait -= dt; p.speed = 0; } else if (d < 0.3) { p.wi = (p.wi + 1) % p.walk.length; p.wait = 1 + Math.random() * 2; } else { const sp = 1.6; p.x += dx / d * sp * dt; p.z += dz / d * sp * dt; p.yaw = Math.atan2(dx, dz); p.speed = sp; } p.noTurn = !near; } if (p.root.visible && inView(p.x, p.y + 0.5, p.z, 1.5)) animPet(p, dt, me); }
    this.stepStaff(dt); this.stepWalkers(dt); this.online.update(dt); this.draw(dt);
    // nearest interaction
    this.actT = (this.actT || 0) - dt; if (this.actT <= 0) { this.actT = 0.15; this.act = busy ? null : this.gather(); app.hud.setAct(this.act); }
    if (this.act && !busy && edge('act')) { sfx('click'); const a = this.act; this.act = null; app.hud.setAct(null); a.f(); }
    this.lightPool.update(dt, me.x, me.y, me.z); followShadow(me.x, me.y, me.z); app.hud.update(this); }
  toggleFP() { this.fp = !this.fp; this.fixtures.setFP(this.fp); this.me.setVisible(!this.fp); if (!this.fp) { this.cam.snap = true; E.camera.fov = E.baseFov; E.camera.updateProjectionMatrix(); } else this.fpPitch = -0.08; toast(this.fp ? '👁️ First-person view: drag to look, stick to walk' : '🎥 Third-person view'); this.setVis(true); }
  events() { while (EV.length) { const e = EV.shift(); if (e.t === 'toast') { if (!e.quiet || (e.sid && this.curStore() === e.sid)) toast(e.m); } else if (e.t === 'banner') this.app.ui.banner(e.m, e.s || ''); else if (e.t === 'cash') { if (this.storeVisible(e.sid)) this.cashFx.push({ x: e.x, z: e.z, t: 1.2 }); } } }
  stepStaff(dt) { for (const sid in this.staffAg) { if (!this.storeVisible(sid)) continue; const G = GEOM[sid], st = S.stores[sid], staffed = this.sim.staffed(sid); const regs = Object.keys(staffed).filter((i) => staffed[i] === 'staff').map(Number); let ri = 0;
      const lanesB = this.sim.lanes(sid).filter((l) => l.f === 'register');
      for (const a of this.staffAg[sid]) { a.sp = 0; let tx = null, tz = null, face = null;
        if (a.role === 'cashier' && ri < regs.length) { const sl = G.slots[regs[ri++]]; tx = sl.x - 1.4; tz = sl.z; face = PI / 2; }
        else if (a.role === 'greeter') { tx = G.doorX + 2.6; tz = G.front - 2.4; face = PI; }
        else if (a.role === 'bagger' && lanesB.length) { const sl = lanesB[0].sl; tx = sl.x - 0.55; tz = sl.z + 1.8; face = PI; }
        else if (a.role === 'manager') { tx = G.office[0] + 1.6; tz = G.office[1] - 1.2; face = -0.4; }
        if (tx !== null) { a.path = [[tx, tz]]; this.sim.move(a, dt, 1.6); if (!a.path.length || Math.hypot(a.x - tx, a.z - tz) < 0.12) { a.x = tx; a.z = tz; let dy = face - a.ry; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); a.ry += dy * Math.min(1, dt * 6); a.sp = 0; } }
        else { // stockers / janitors / spare cashiers roam the aisles
          if (!a.path.length) { a.wait -= dt; if (a.wait <= 0) { const sp = this.sim.spills[sid][0]; const goStock = a.role === 'stocker' && !a.carry; if (a.role === 'janitor' && sp) { a.path = this.sim.route(G, a, sp.x, sp.z); } else if (goStock) { a.path = this.sim.route(G, a, G.lanes[0], G.back + 1.4); a.path.push([G.stock[0] + 2, G.back + 1.3]); a.next = 'carry'; } else { const L = G.lanes[(Math.random() * G.lanes.length) | 0]; a.path = this.sim.route(G, a, L, G.cross[0] + Math.random() * (G.cross[G.cross.length - 1] - G.cross[0])); if (a.carry) a.next = 'drop'; } a.wait = 1.5 + Math.random() * 2; } }
          else if (this.sim.move(a, dt, 1.4)) { if (a.next === 'carry') a.carry = true; else if (a.next === 'drop') a.carry = false; a.next = null; } }
        if (a.pet) { const p = a.pet; p.x = a.x; p.z = a.z; p.yaw = a.ry; p.speed = a.sp; p.noTurn = a.sp > 0; if (inView(p.x, 0.5, p.z, 1.5)) animPet(p, dt, a.sp ? null : this.me); } } } }
  stepWalkers(dt) { for (const a of this.walkers) { const t = a.path[a.wi]; a.path2 = [[t[0], t[1]]]; const dx = t[0] - a.x, dz = t[1] - a.z, d = Math.hypot(dx, dz); if (d < 0.3) { a.wi = (a.wi + 1) % a.path.length; continue; } const sp = 1.3; a.x += dx / d * sp * dt; a.z += dz / d * sp * dt; a.ry = Math.atan2(dx, dz); a.sp = sp; a.wt = (a.wt || 0) + dt * sp * 4.2; } }
  draw(dt) { const me = this.me, list = [], loose = [];
    for (const sid of storeIds()) { const vis = this.storeVisible(sid); for (const a of this.sim.ag[sid]) { if (!a.look) a.look = this.crowd.look(a.seed || a.id, false); a.vis = vis && !a.pet; list.push(a); } for (const a of this.staffAg[sid] || []) { a.vis = vis && !a.pet; list.push(a); } }
    const out = !this.inB || this.fp; for (const a of this.walkers) { a.vis = (out || !this.inB) && Math.hypot(a.x - me.x, a.z - me.z) < 70; list.push(a); }
    for (const a of this.people) { a.vis = a.region === 'out' || (this.world.regionMeshes[a.region] && this.world.regionMeshes[a.region][0].visible); if (a.opt.ok && !a.opt.ok()) a.vis = false; if (a === this.penny) a.vis = a.vis && true; list.push(a); }
    if (this.sim.insp) { const I = this.sim.insp; if (!I.look) I.look = Object.assign(this.crowd.look(77, false), { shirt: 0x0f766e }); I.vis = this.storeVisible(I.sid); list.push(I); }
    for (const id of ['s1', 's2', 's3']) for (const c of this.sim.carts[id]) { c.vis = mine(id) && Math.hypot(c.x - me.x, c.z - me.z) < 60; loose.push(c); }
    for (let i = 0; i < this.cartsHeld; i++) { const yw = me.yaw, k = 1.0 + i * 0.55; loose.push({ x: me.x + Math.sin(yw) * k, z: me.z + Math.cos(yw) * k, ry: yw + PI, vis: true }); }
    this.online.agents(list);
    // only animate what's on screen
    for (const a of list) if (a.vis && !inView(a.x, 1, a.z, 1.4)) a.vis = false;
    this.crowd.draw(list, loose, this.T);
    // VIP pet shoppers
    let vipA = null; for (const sid of storeIds()) for (const a of this.sim.ag[sid]) if (a.pet) { if (vipA || (S.cameos[a.pet])) { a.pet = null; continue; } vipA = a; if (!this.vipPet || this.vipPet.id !== a.pet) { if (this.vipPet) this.scene.remove(this.vipPet.root); this.vipPet = makePet(a.pet, { s: a.pet === 'torty' ? 0.8 : 1.15 }); this.add(this.vipPet.root); } const p = this.vipPet; p.x = a.x; p.z = a.z; p.y = 0.06; p.yaw = a.ry; p.speed = a.sp; p.noTurn = true; p.root.visible = this.storeVisible(sid); if (p.root.visible) animPet(p, dt, null); p._a = a; }
    if (this.vipPet && this.vipPet._a && this.vipPet._a.gone) { this.scene.remove(this.vipPet.root); this.vipPet = null; S.vip = null; }
    // trucks
    const T = this.sim.trucks; while (this.truckM.length < Math.min(T.length, 10)) { const m = this.truckProto.clone(); this.add(m); this.truckM.push(m); }
    this.truckM.forEach((m, i) => { const t = T[i]; m.visible = !!t && t.wait <= 0 && inView(t.x, 1.5, t.z, 5); if (t) { m.position.set(t.x, 0, t.z); m.rotation.y = t.ry; } });
    // spills + wet-floor signs
    let n = 0; for (const sid of storeIds()) { if (!this.storeVisible(sid)) continue; for (const s of this.sim.spills[sid]) { if (n >= 40) break; _m.compose(_v.set(s.x, 0.075, s.z), _q.identity(), _s.set(0.55 + s.k * 0.12, 1, 0.42)); this.spillM.setMatrixAt(n, _m); this.spillM.setColorAt(n, _c.setHex([0xfde047, 0x93c5fd, 0xfca5a5][s.k])); _m.compose(_v.set(s.x + 0.7, 0.35, s.z), _q.identity(), _s.set(1, 1, 1)); this.signM.setMatrixAt(n, _m); n++; } }
    this.spillM.count = this.signM.count = n; this.spillM.instanceMatrix.needsUpdate = this.signM.instanceMatrix.needsUpdate = true; if (this.spillM.instanceColor) this.spillM.instanceColor.needsUpdate = true;
    // bubbles over shoppers (help / angry / your lane) + cash pops
    let bi = 0; const B = this.bubbles; const bub = (x, y, z, k) => { if (bi >= B.length) return; const s = B[bi++]; s.visible = true; s.position.set(x, y, z); if (s.material.map !== this.bubTex[k]) { s.material.map = this.bubTex[k]; s.material.needsUpdate = true; } };
    const sid = this.curStore(); if (sid) for (const a of this.sim.ag[sid]) { if (!a.vis) continue; if (Math.hypot(a.x - me.x, a.z - me.z) > 22) continue; if (a.help && a.st !== 'out' && mine(sid)) bub(a.x, 2.35, a.z, 'help'); else if (a.atYou && a.st === 'q') bub(a.x, 2.35, a.z, 'you'); else if (a.st === 'out' && a.mood < 0.5) bub(a.x, 2.35, a.z, a.oos ? 'oos' : 'angry'); }
    for (let i = this.cashFx.length - 1; i >= 0; i--) { const c = this.cashFx[i]; c.t -= dt; if (c.t <= 0) { this.cashFx.splice(i, 1); continue; } bub(c.x, 2.0 + (1.2 - c.t) * 0.9, c.z, 'cash'); }
    for (; bi < B.length; bi++) B[bi].visible = false; this.online.draw(dt); }
  // ---------------- day cycle ----------------
  dayEnd() { const rep = { day: S.day, stores: [], wages: 0, rent: 0, career: S.mode === 'career' }; for (const sid of storeIds()) { if (!mine(sid)) continue; const st = S.stores[sid]; const wages = st.staff.reduce((a, s) => a + (s.cameo ? 40 : (ROLES[s.role] || { wage: 50 }).wage), 0); const rent = sid === 's1' ? 120 : 160; rep.stores.push({ n: STORE[sid].short, rev: st.rev, cust: st.cust, angry: st.angry, rep: Math.round(st.rep), grade: st.grade }); if (S.mode === 'boss' || st.owned) { rep.wages += wages; rep.rent += rent; } }
    if (S.mode === 'boss') { S.money -= rep.wages + rep.rent; if (S.loan) { const i = Math.round(S.loan * 0.05); S.money -= i; rep.interest = i; } }
    if (S.mode === 'career') { rep.pay = S.worked ? RANKS[S.rank].wage : 0; S.money += rep.pay; }
    S.stats.days++; this.app.paused = true; this.app.busy = true; this.sim.clearDay(); this.app.ui.daySummary(rep, () => { this.newDay(); this.app.resume(); }); }
  newDay() { S.day++; S.time = OPEN; S.worked = 0; for (const sid in S.stores) { const st = S.stores[sid]; st.rev = 0; st.cust = 0; st.angry = 0; } S.event = null; S.war = null; S.vip = null;
    const r = Math.random(); if (S.day % 5 === 0) { S.event = { k: 'rush' }; this.app.ui.banner('🦃 FEAST WEEK RUSH!', 'Shoppers everywhere today. Stock up and open every lane!'); }
    else if (S.day >= 3 && r < 0.22) { S.war = { day: S.day }; S.event = { k: 'war' }; this.app.ui.banner('🏷️ PRICE WAR!', 'Bargain Bonanza slashed prices today. Match them (90% or less) or run an ad!'); }
    else if (r < 0.36) { S.event = { k: 'freeze' }; } else if (r < 0.48) { S.event = { k: 'jam' }; }
    else if (r < 0.62) { const k = DEPT_IDS[(Math.random() * 7) | 0]; const st = S.stores.s1; st.back[k] += 18; this.app.ui.banner('🐁 SNOWIE AIR-DROP!', `Snowie Sky Express dropped 18 free cases of ${DEPTS[k].n} at Main St.`); }
    else if (r < 0.8) { const free = ['luna', 'torty', 'pirat', 'snowie', 'candy'].filter((k) => !S.cameos[k]), id = free[(Math.random() * free.length) | 0]; if (id) S.vip = { sid: 's1', id }; if (id) toast(`⭐ VIP shopper today: ${({ luna: 'Luna', torty: 'Torty', pirat: 'Pi-rat', snowie: 'Snowie', candy: 'Candy' })[id]} is coming to Main St!`); }
    if (S.day >= S.insp.next) { const M = storeIds().filter(mine); S.insp = { next: S.day + 3 + ((Math.random() * 2) | 0), day: S.day, sid: M[(Math.random() * M.length) | 0] || 's1', done: 0 }; toast('📋 Rumor: a health inspector visits ' + STORE[S.insp.sid].short + ' this morning!'); }
    if (S.mode === 'career') S.daily = { day: S.day, t: dailyFor(S.rank, S.day, !typeOf(S.stores.s1).carts) };
    this.sim.seedCarts(); persist(); this.refreshStores(true); }
  onInspected(g) { if (S.mode === 'career' && g === 'A') { S.xp += 20; toast('+20 XP for a spotless store!'); this.checkPromo(); } }
  render(dt) { followShadow(this.me.x, this.me.y, this.me.z); }
  refreshMe() { const p = [this.me.x, this.me.y, this.me.z], y = this.me.yaw; this.me.removeFrom(this.scene); this.me = new Walker(S.look); this.me.addTo(this.scene); this.me.place(p, y); this.me.setVisible(!this.fp); this.attachCarry(); }
  ensureStores() { for (const d of STORES) if (d.rival && !S.stores[d.id]) { const st = S.stores[d.id] = newStore(d.id, d.id === 'rival' ? 'rival' : d.id === 'rival2' ? 'rival2' : 1, d.type, d.id === 'mega' ? 6 : 2); st.staff = [{ role: 'cashier', name: d.short + ' Cashier', skill: 2 }, { role: 'stocker', name: d.short + ' Stocker', skill: 2 }, { role: 'manager', name: d.boss || 'Max Markdown', skill: 3 }]; } }
  startMode() { this.ensureStores(); const G = GEOM.s1; this.me.place([G.doorX, 0.1, G.front + 6], PI); this.cam.yaw = 0; this.cam.snap = true; this.sim = new Sim(); this.carry = null; this.cartsHeld = 0; this.caseM.visible = false; if (this.online) this.online.reset(); if (S.mode === 'career' && (!S.daily || S.daily.day !== S.day)) S.daily = { day: S.day, t: dailyFor(S.rank, S.day, !typeOf(S.stores.s1).carts) }; this.refreshStores(true); }
}
