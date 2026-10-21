// Grok Snowie Sky Tours - the Plane Lineup on the airfield apron (all seven aircraft parked as real 3D models), the plane on
// the Repair Hangar lift, the hangar crew (Mechanic Brie + Torty's Tortuga Tech) and their interactions.
import * as THREE from 'three';
import { SPOTS, PADS } from './map.js?v=st9';
import { S, persist } from './save.js?v=st9';
import { sfx } from './audio.js?v=st9';
import { talk, toast } from './uikit.js?v=st9';
import { textGeo } from './text3d.js?v=st9';
import { PLANES, PLANE, buildPlane } from './planes.js?v=st9';
import { hpOf, repairCost, UPGRADES } from './care.js?v=st9';
const PI = Math.PI;
const DISPLAY_PAINT = { classic: 0, rescue: 5, twin: 3, biplane: 2, seaplane: 1, cargo: 4, jet: 0 };
export function installFleet(Game) { Object.assign(Game.prototype, FLEET); }
const tagMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
function colGeo(g, c, k = 1.4) { const q = g.clone(); const col = new THREE.Color(c); const n = q.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = col.r * k; a[i * 3 + 1] = col.g * k; a[i * 3 + 2] = col.b * k; } q.setAttribute('color', new THREE.BufferAttribute(a, 3)); return q; }
const FLEET = {
  buildFleet() { this.lineup = []; const L = SPOTS.lineup || [];
    PLANES.forEach((P, i) => { const sp = L[i]; if (!sp) return; const M = buildPlane(P.id, DISPLAY_PAINT[P.id] || 0, { hp: 100, display: true }); M.root.position.set(sp.x, 0.06, sp.z); M.root.rotation.y = sp.ry; this.scene.add(M.root); M.root.updateMatrixWorld(true); M.root.traverse((o) => { o.matrixAutoUpdate = false; });
      const ln = M.len / 2, hw = 1.3; this.world.solid(sp.x - hw, 0, sp.z - ln * 0.8, sp.x + hw, 3.2, sp.z + ln * 0.8);
      const name = textGeo(P.name.toUpperCase(), 0.3, 0.06); let nm = null; if (name) { nm = new THREE.Mesh(colGeo(name, 0xffffff), tagMat); nm.position.set(sp.x, 1.62, -42.47); this.scene.add(nm); }
      const slot = { P, M, sp, nm, tag: null }; this.lineup.push(slot); });
    this.refreshLineup();
    // the plane on the Repair Hangar lift mirrors your current aircraft (paint + damage)
    this.hangarShow = () => { if (!SPOTS.lift) return; const id = this.cop.id, k = id + ':' + S.paint + ':' + this.cop.hp; if (this._hk === k) return; this._hk = k; if (this.liftM) { this.scene.remove(this.liftM.root); this.liftM.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
      const M = this.liftM = buildPlane(id, S.paint, { hp: this.cop.hp, display: true }); const sc = Math.min(1, 11 / Math.max(M.span, M.len)); M.root.scale.setScalar(sc); M.root.position.set(SPOTS.lift[0], SPOTS.lift[1], SPOTS.lift[2]); M.root.rotation.y = -PI / 2 + 0.5; this.scene.add(M.root); };
    this.hangarShow(); },
  refreshLineup() { for (const s of this.lineup || []) { const own = S.owned.includes(s.P.id), sel = S.plane === s.P.id; const k = (own ? 'o' : 'l') + (sel ? 's' : '') + (own ? hpOf(s.P.id) : ''); if (s.k === k) continue; s.k = k; if (s.tag) { this.scene.remove(s.tag); s.tag.geometry.dispose(); }
      const t = sel ? '★ FLYING THIS' : own ? (hpOf(s.P.id) <= 0 ? 'NEEDS REPAIR' : 'OWNED') : `${s.P.price} COINS`; const g = textGeo(t, 0.26, 0.05); if (!g) continue; s.tag = new THREE.Mesh(colGeo(g, sel ? 0xff4fa0 : own ? (hpOf(s.P.id) <= 0 ? 0xf97316 : 0x4ade80) : 0xffd23f), tagMat); s.tag.position.set(s.sp.x, 1.22, -42.47); this.scene.add(s.tag); } },
  fleetActs() { const push = (x, z, r, label, f) => this.acts.push({ x, z, r, label, f, walk: true });
    (this.lineup || []).forEach((s, i) => push(s.sp.x, -41.2, 4.6, `${s.P.emoji} ${s.P.name}`, () => this.app.ui.lineup(i)));
    if (SPOTS.liftAct) push(SPOTS.liftAct[0], SPOTS.liftAct[1], 3.4, '🔧 Repairs & upgrades', () => this.app.ui.repair()); },
  // swap the aircraft you fly (it appears right where your current one is parked)
  choosePlane(id) { const c = this.cop; if (!S.owned.includes(id)) return; S.plane = id; persist(); c.setModel(id, S.paint); c.setHp(hpOf(id)); this.hangarShow(); this.refreshLineup(); sfx('buy');
    const pad = c.onPad ? c.onPad.name : 'where you parked'; toast(`${PLANE(id).emoji} ${PLANE(id).name} is fuelled up and waiting at ${pad}!`); },
  repairNow(full) { const c = this.cop; S.hp[c.id] = 100; S.stats.repairs = (S.stats.repairs || 0) + 1; persist(); c.setHp(100); this.hangarShow(); this.refreshLineup(); sfx('win'); this.fx.confetti(this.me.x, this.me.y + 2, this.me.z, 50); },
  buildCrew() { // Mechanic Brie runs the repair counter; a Tortuga Tech engineer shows off Torty's shell-tough armour
    const brie = SPOTS.brie, tt = SPOTS.tortuga; if (!brie) return;
    this.npc('cream', { at: brie, yaw: 0, s: 1.2, label: '💬 Talk to Mechanic Brie', room: 'repair', talk: () => this.brieTalk() }).room = 'repair';
    const t = this.npc('torty', { at: tt, yaw: -PI * 0.25, s: 1.05, label: '💬 Shellby (Tortuga Tech)', talk: () => this.tortugaTalk() }); t.room = 'repair';
    // the hangar crew at work (3 walk their rounds, Cocoa welds) + pet cameos dropping by
    const L = (who, lines) => () => talk(lines.map((l) => [who, l]));
    const crew = [
      ['ash', { extras: ['glasses'], at: [40.8, -12.3], walk: [[40.8, -12.3], [42.7, -12.3], [42.6, -9.0]], label: '💬 Mechanic Ash', talk: L('Mechanic Ash', ['This radial engine has seven cylinders. I named them all. The grumpy one is Gary.', 'Tools go back on the pegboard outline. Brie checks. Brie ALWAYS checks.']) }],
      ['ginger', { extras: ['headset'], at: [42.4, 5.2], walk: [[42.4, 5.2], [55.6, 5.2], [55.6, 4.4], [42.4, 4.4]], label: '💬 Mechanic Ginger', talk: L('Mechanic Ginger', ['Lift check, rotor check, wiggle check. If it wiggles and it should not, we fix it!']) }],
      ['cocoa', { extras: ['glasses'], at: [52.0, -12.1], yaw: PI, label: '💬 Welder Cocoa', talk: L('Welder Cocoa', ['Sparks! Don\'t look straight at them, use the mask. I\'m patching a skid that met a fence.']) }],
      ['max', { human: true, look: { skin: 2, hair: 3, hairC: 2, shirt: 4, pants: 1 }, at: [38.5, 7.4], walk: [[38.5, 7.4], [44.5, 7.5], [47.0, 7.3]], label: '💬 Parts Runner Max', talk: L('Parts Runner Max', ['Need a propeller? Rotor blade? Tiny bolt that rolled under the lift? I know where EVERYTHING is.']) }],
      ['luna', { at: [57.4, 4.4], yaw: -PI / 2, label: '💬 Luna (Ratita Gadgets)', talk: L('Luna', ['My Turbo Tune-Up makes every plane 15% zoomier. Zoom responsibly!']) }],
      ['candy', { at: [52.6, 6.9], walk: [[52.6, 6.9], [54.4, 6.4], [53.4, 5.9]], label: '💬 Candy', talk: L('Candy', ['Woof! I\'m on bolt patrol. Found three bolts and one very old cheese cracker.']) }],
      ['pirat', { at: [37.8, 4.4], yaw: PI / 2, label: '💬 Pi-rat (Salvage)', talk: L('Pi-rat', ['Arr! Every crate here be salvaged from a crash. Ye bonk it, I keep the bits. Fair trade!']) }],
      ['snowie', { at: [45.2, -12.4], y: 1.14, yaw: 0, s: 1.0, label: '💬 Snowie', talk: L('Snowie', ['I\'m keeping Brie company while the planes get fixed. Ooh, did you see the sparks?!']) }],
      ['torty', { at: [58.3, -7.6], yaw: -PI * 0.6, label: '💬 Torty (Tortuga Tech CEO)', talk: L('Torty', ['Welcome to my crash-test lab! Dummy 07 has been bonked 1,000 times and still smiles.', 'Shell-Tough Armor: tested on my own shell first. Very scientific.']) }],
    ];
    for (const [id, o] of crew) { const p = this.npc(id, Object.assign({ room: 'repair' }, o)); p.room = 'repair'; } },
  brieTalk() { const c = this.cop, P = PLANE(c.id), cost = repairCost(c.id);
    talk([['Mechanic Brie', c.hp >= 100 ? `Your ${P.name} is purring like a happy kitten. Not a scratch!` : `Ooh, your ${P.name} is at ${c.hp}%. ${c.hp <= 0 ? 'It can\'t fly until we fix it.' : 'Dents, smoke... I love a challenge!'} A quick fix is ${cost} coins${S.ins > 0 ? ' (half price with your Snowie Shield!)' : ''}, or grab a wrench and help me for free.`]], null,
      [{ t: '🔧 Repairs & upgrades', f: () => this.app.ui.repair() }, { t: '✈️ Tell me about planes', f: () => talk([['Mechanic Brie', 'Copters hover and land anywhere. Planes are faster but always fly forward: land on a runway and roll to a stop. The seaplane can land on the lake! Visit the Plane Lineup by the runway.']]) }, { t: 'Bye, Brie!', f: () => {} }]); },
  tortugaTalk() { const has = !!S.up.armor; talk([['Shellby (Tortuga Tech)', 'Welcome to Tortuga Tech! Torty invented Shell-Tough Armor after falling off the museum roof. Twice. On purpose.'], ['Shellby (Tortuga Tech)', has ? 'Your plane already wears Shell-Tough plating. Crashes do half damage. Torty is very proud of you.' : 'One coat of Shell-Tough and crashes do HALF damage. We drop a one-ton weight on it every morning. Then we have a snack.']], null,
      has ? undefined : [{ t: '🐢 See the armor', f: () => this.app.ui.repair('up') }, { t: 'Maybe later', f: () => {} }]); },
};
