// Great Rodentia 2: Escape from National Ratita Prison — Holiday Special. Shadow Light engine.
import * as THREE from 'three';
import { E, initEngine, setEnvironment, followShadow, render, trackFps } from './engine.js?v=gr3';
import { World } from './world.js?v=gr3';
import { ENV, buildPrison } from './prison.js?v=gr3';
import { BUILDINGS, buildingAt } from './bld.js?v=gr3';
import { RatHero } from './walker.js?v=gr3';
import { FollowCam } from './cam.js?v=gr3';
import { FX } from './fx.js?v=gr3';
import { initInput, edge, clearEdges, held, IN } from './input.js?v=gr3';
import { sfx, initAudio, setSound, SND, playMusic } from './audio.js?v=gr3';
import { makeRat, animRat } from './models.js?v=gr3';
import { makePet, animPet } from './pets.js?v=gr3';
import { initMats } from './mats.js?v=gr3';
import { initShadowlight, useSurfaceSet, setSpots, updateShadowlight, SL } from './shadowlight/index.js?v=gr3';
import { $, clamp } from './util.js?v=gr3';
import { toast, isTalking, startDialogue, stepDialogue, setPrompt } from './ui2.js?v=gr3';

const SAVE_KEY = 'grok_great_rodentia_2_v1';
const PI = Math.PI;
const _v = new THREE.Vector3(), _s = new THREE.Vector3(), _b = new THREE.Box3(), _r = new THREE.Ray(), _o = new THREE.Vector3(), _d = new THREE.Vector3();

// ---------- save ----------
const DEF = () => ({ v: 1, started: false, char: 'luna', items: [], wearing: false, knowCode: false, digs: 0, tortyFreed: false, wardenOpen: false, staffOpen: false, fenceCut: false, caught: 0, endings: [], lastItem: null, sneak: false });
export let S = DEF();
function load() { try { const j = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (j && j.v === 1) S = Object.assign(DEF(), j); } catch (e) {} }
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }

const ITEMS = {
  spoon: { e: '🥄', n: 'Kitchen Spoon', at: 'spoon', d: 'Perfect for digging behind the festival poster.' },
  cutters: { e: '✂️', n: 'Wire Cutters', at: 'cabinet3d', d: 'Cuts the chain-link fence at the blind spot.' },
  uniform: { e: '👮', n: 'Guard Uniform', at: 'uniform', d: 'Tap it to wear. Guards only notice you up close.' },
  keycard: { e: '💳', n: "Warden's Keycard", at: 'safe', d: 'Opens staff doors and the gate terminal.' },
  lights: { e: '💡', n: 'Holiday Light Strand', at: 'lights', d: 'A long, strong strand. Climbing rope, anyone?' },
  map: { e: '🗺️', n: 'Sewer Map', at: 'map', d: 'Shows where the tunnel meets the sewer.' },
  ledger: { e: '📒', n: 'Ratita Now➡️ Ledger', at: 'ledger', d: 'Proof of who caused the Great Cheese Shortage.' },
};
const CHARS = {
  luna: { n: 'Luna', e: '🐭', skill: 'Codes & keypads' },
  pirat: { n: 'Pi-rat', e: '🏴‍☠️', skill: 'Lockpicking' },
  snowie: { n: 'Snowie', e: '🐁', skill: 'Vents & climbing' },
};
const ENDINGS = {
  tunnel: { t: 'The Holiday Tunnel', e: '🕳️', b: 'Spoonful by spoonful, the trio tunnel under Cell Block A and follow the sewer map out beneath the Winter Gouda Festival.' },
  disguise: { t: 'Season\'s Greetings, Officer', e: '👮', b: 'In a borrowed uniform with the Warden\'s keycard, the trio stroll right out the front gate. The gate guard even wishes them a happy holiday.' },
  wall: { t: 'Over the Wall', e: '🧗', b: 'A cut fence, a dash past the searchlights and a strand of holiday lights tied into a rope. Snowie leads the climb over the weak wall.' },
  miracle: { t: 'A Holiday Miracle', e: '🎄', b: 'With Torty free and the Ratita Now➡️ ledger in paw, Brie and Candy take the proof straight to the USM Senate. The frame cracks: Shadow Luna, Dread Pi-rat and Frostbite Snowie are exposed, Torty is cleared, and cheese trucks roll into Great Rodentia in time for the festival.' },
};

// ---------- small helpers ----------
const inBox = (x, z, b) => b && x >= b[0] && x <= b[2] && z >= b[1] && z <= b[3];
const has = (k) => S.items.includes(k);
function emojiSprite(e, size = 0.7) {
  const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d');
  g.font = '72px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, 48, 54);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(size, size, size); return s;
}
const MAT = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o));
function santaHat(rig) {
  if (!rig || !rig.hat) return; const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 12), MAT(0xdc2626)); cone.position.y = 0.16; cone.rotation.z = -0.35; g.add(cone);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.04, 6, 14), MAT(0xffffff)); rim.rotation.x = PI / 2; rim.position.y = 0.02; g.add(rim);
  const pom = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), MAT(0xffffff)); pom.position.set(0.1, 0.29, 0); g.add(pom);
  g.position.y = 0.02; rig.hat.add(g);
}
function guardCap(rig) {
  if (!rig || !rig.hat) return; const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.1, 12), MAT(0x1e3a8a)); top.position.y = 0.06; g.add(top);
  const bill = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.12), MAT(0x0f172a)); bill.position.set(0, 0.02, 0.14); g.add(bill);
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.01), MAT(0xfacc15, { emissive: 0x6b4d00 })); badge.position.set(0, 0.07, 0.15); g.add(badge);
  rig.hat.add(g);
}

// ---------- doors (dynamic) ----------
function makeDoor(scene, world, axis, at, c, w, kind) {
  const g = new THREE.Group(); const H = kind === 'wood' ? 2.6 : 3.2;
  if (kind === 'bars') {
    const m = MAT(0x334155, { metalness: 0.6, roughness: 0.4 }); const geo = new THREE.CylinderGeometry(0.035, 0.035, H, 6);
    for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(geo, m); const o = -w / 2 + 0.15 + i * (w - 0.3) / 5; b.position.set(axis === 'z' ? 0 : o, H / 2, axis === 'z' ? o : 0); g.add(b); }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(axis === 'z' ? 0.06 : w, 0.08, axis === 'z' ? w : 0.06), m); rail.position.y = H * 0.55; g.add(rail);
  } else {
    const col = kind === 'staff' ? 0x1e40af : 0x7c2d12;
    const p = new THREE.Mesh(new THREE.BoxGeometry(axis === 'z' ? 0.12 : w, H, axis === 'z' ? w : 0.12), MAT(col)); p.position.y = H / 2; g.add(p);
    const kn = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), MAT(0xfacc15, { metalness: 0.7 })); kn.position.set(axis === 'z' ? 0.1 : w * 0.35, 1.1, axis === 'z' ? w * 0.35 : 0.1); g.add(kn);
    const wr = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 6, 16), MAT(0x15803d)); wr.position.set(0, 1.9, axis === 'z' ? 0 : 0.1); if (axis === 'z') { wr.rotation.y = PI / 2; wr.position.x = 0.1; } g.add(wr);
    const bow = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), MAT(0xdc2626)); bow.position.copy(wr.position); bow.position.y -= 0.26; g.add(bow);
  }
  if (axis === 'z') g.position.set(at, 0, c); else g.position.set(c, 0, at);
  scene.add(g);
  const s = axis === 'z' ? world.solid(at - 0.15, 0, c - w / 2, at + 0.15, H, c + w / 2, { dyn: true, see: kind === 'bars' }) : world.solid(c - w / 2, 0, at - 0.15, c + w / 2, H, at + 0.15, { dyn: true, see: kind === 'bars' });
  const d = { g, s, open: false, axis, w, set(o) { this.open = o; s.off = o; g.visible = !o; } };
  return d;
}

// ---------- the game ----------
class PrisonGame {
  constructor() {
    initEngine($('c'), 'high'); initMats(); setEnvironment(ENV); initShadowlight(); useSurfaceSet('street'); SL.flashlight = true;
    this.scene = E.scene; this.world = new World();
    const { spots, marks } = buildPrison(this.world); this.M = marks;
    this.world.finalize(this.scene); setSpots(spots, { flash: true });
    this.fx = new FX(this.scene); this.cam = new FollowCam(); this.cam.yaw = PI / 2;
    this.me = new RatHero(this.scene, this.world); this.me.hp = 3; this.me.bounds = [-35.4, -43.4, 35.4, 71.4];
    this.T = 0; this.sus = 0; this.mode = 'title'; this.lockdown = 0; this.trail = []; this.npcs = []; this.pickups = {}; this.guards = []; this.lightsS = []; this.busy = false; this.hold = null; this.inB = null;
    // doors
    const M = marks;
    this.doors = {
      cell: makeDoor(this.scene, this.world, 'z', -27, M.myCell.z, 1.8, 'bars'),
      torty: makeDoor(this.scene, this.world, 'x', M.tortyDoor.z, M.tortyDoor.x, 1.8, 'bars'),
      warden: makeDoor(this.scene, this.world, 'x', M.wardenDoor.z, 0, 2.6, 'wood'),
      staff: makeDoor(this.scene, this.world, 'x', M.staffDoor.z, M.staffDoor.x, 1.8, 'staff'),
      fence: makeDoor(this.scene, this.world, 'z', 24, 10, 2.8, 'bars'),
    };
    // fence patch looks like chain-link, not prison bars
    this.doors.fence.g.children.forEach((m) => { if (m.material) m.material = MAT(0x9ca3af, { metalness: 0.5 }); });
    const tag = emojiSprite('🚧', 0.6); tag.position.set(0, 1.4, 0); this.doors.fence.g.add(tag);
    this.spawnCast(); this.spawnPickups(); this.spawnGuards(); this.spawnSearchlights(); this.spawnSnow();
    this.pets = {}; for (const id of ['luna', 'pirat', 'snowie', 'torty']) { const p = makePet(id); p.noTurn = true; santaHat(p.rig); this.scene.add(p.root); this.pets[id] = p; }
    this.buildActs();
    this.applyState(true);
  }

  // ----- state -> world -----
  applyState(first) {
    const D = this.doors;
    D.cell.set(this.lockdown <= 0 && S.started); D.torty.set(S.tortyFreed); D.warden.set(S.wardenOpen); D.staff.set(S.staffOpen); D.fence.set(S.fenceCut);
    for (const k in this.pickups) this.pickups[k].visible = !has(k) && !(k === 'keycard' && S.keycardUsedUp);
    this.setChar(S.char, true);
    if (first) { this.me.place([this.M.myCell.x, 0.1, this.M.myCell.z], PI / 2); this.resetTrail(); }
    this.syncHud();
  }
  setChar(id, force) {
    if (!force && id === S.char) return; S.char = id;
    this.me.setCharacter(id, 'none');
    if (S.wearing && has('uniform')) guardCap(this.me.rig); else santaHat(this.me.rig);
    this.syncHud(); save();
  }
  followers() { const f = ['luna', 'pirat', 'snowie'].filter((c) => c !== S.char); if (S.tortyFreed) f.push('torty'); return f; }
  resetTrail() { this.trail = []; for (let i = 0; i < 40; i++) this.trail.push([this.me.x, this.me.z]); for (const id in this.pets) { const p = this.pets[id]; p.x = this.me.x - 0.5; p.z = this.me.z; } }
  teleport(x, z, yaw = 0) { this.me.place([x, 0.1, z], yaw); this.cam.yaw = yaw + PI; this.cam.snap = true; this.resetTrail(); this.setVis(true); }

  // ----- cast -----
  spawnCast() {
    const M = this.M; const add = (rig, x, z, yaw, region, name) => { rig.root.position.set(x, 0, z); rig.root.rotation.y = yaw; this.scene.add(rig.root); const n = { rig, root: rig.root, x, z, region, name }; this.npcs.push(n); return n; };
    for (const im of M.inmates) { const r = makeRat(im.id, 'none', { pack: false }); santaHat(r); add(r, im.x, im.z, PI / 2, 'in_cells', im.id); }
    this.candy = makePet('candy'); this.candy.x = M.candy.x; this.candy.z = M.candy.z; this.candy.yaw = 0; this.scene.add(this.candy.root); this.candy.region = 'in_vis';
    const brie = makeRat('brie', 'detective', { pack: false }); add(brie, M.brie.x, M.brie.z, 0, 'in_vis', 'Brie');
    this.tortyIn = makePet('torty'); this.tortyIn.x = M.torty.x; this.tortyIn.z = M.torty.z; this.tortyIn.yaw = 0; this.scene.add(this.tortyIn.root); this.tortyIn.region = 'in_cells';
  }
  spawnPickups() {
    const M = this.M;
    for (const k in ITEMS) {
      const p = M[ITEMS[k].at]; const g = new THREE.Group(); const sp = emojiSprite(ITEMS[k].e, 0.62); sp.position.y = 0; g.add(sp);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 6, 20), new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.7 })); ring.rotation.x = PI / 2; ring.position.y = -0.45; g.add(ring);
      const off = { spoon: [0, 0.6, 0], cutters: [0, 1.4, 0], uniform: [0, 1.3, 0], keycard: [0.5, 1.5, 0], lights: [0, 1.0, 0.6], map: [0, 1.6, 0], ledger: [0, 1.5, 0] }[k];
      g.position.set(p.x + off[0], (p.y || 0) + off[1], p.z + off[2]); g.userData.base = g.position.y; g.userData.reg = this.regionAt(p.x, p.z);
      this.scene.add(g); this.pickups[k] = g;
    }
  }
  regionAt(x, z) { const b = buildingAt(x, z); return b ? 'in_' + b.id : 'out'; }
  spawnGuards() {
    const P = [
      ['Officer Muenster', [[-21, -38.5], [-21, -20]], 'in_cells'],
      ['Sgt. Havarti', [[14.5, -39.2], [30.5, -39.2]], 'in_caf'],
      ['Cpl. Feta', [[-9, -12], [9, -12], [9, 31], [-9, 31]], 'out'],
      ['Lt. Cheddarton', [[27.5, -14], [27.5, 35]], 'out'],
      ['Warden\'s Aide Edam', [[-6, 48.5], [6, 48.5], [6, 61.4], [-6, 61.4]], 'in_warden'],
      ['Officer Ricotta', [[29.6, 39.5], [29.6, 55.5]], 'in_laundry'],
      ['Officer Gruyère', [[-7, -39.3], [6, -39.3]], 'in_vis'],
      ['Sgt. Colby', [[-29.5, 44.6], [-19.2, 44.6], [-19.2, 50.6], [-29.5, 50.6]], 'in_work'],
      ['Gate Guard Brie-anna', [[-14, -42.5], [-1, -42.5]], 'out'],
    ];
    const coneGeo = new THREE.CircleGeometry(1, 20, -0.6, 1.2); coneGeo.rotateX(-PI / 2);
    for (const [name, path, reg] of P) {
      const rig = makeRat('ash', 'none', { pack: false }); guardCap(rig); rig.root.scale.setScalar(1.12); this.scene.add(rig.root);
      const cm = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.16, depthWrite: false })); cm.position.y = 0.06; rig.root.add(cm);
      const mark = emojiSprite('❗', 0.55); mark.position.y = 1.55; mark.visible = false; rig.root.add(mark);
      this.guards.push({ name, path, reg, rig, cone: cm, mark, i: 1, x: path[0][0], z: path[0][1], yaw: 0, wait: 0, look: 0, speed: 0, home: path[0] });
    }
  }
  spawnSearchlights() {
    this.lightsS = [];
    const T = this.M.towers;
    T.forEach(([tx, tz], i) => {
      const disc = new THREE.Mesh(new THREE.CircleGeometry(2.6, 24), new THREE.MeshBasicMaterial({ color: 0xfff7c2, transparent: true, opacity: 0.32, depthWrite: false })); disc.rotation.x = -PI / 2; disc.position.y = 0.07; this.scene.add(disc);
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 2.4, 1, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff7c2, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide })); this.scene.add(beam);
      const side = tx > 0 ? 1 : -1; const z0 = tz < 10 ? -15 : 11, z1 = tz < 10 ? 9 : 35;
      this.lightsS.push({ tx, tz, disc, beam, side, z0, z1, ph: i * 1.7, x: tx, z: tz });
    });
  }
  spawnSnow() {
    const N = 900, g = new THREE.BufferGeometry(), a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { a[i * 3] = (Math.random() - 0.5) * 60; a[i * 3 + 1] = Math.random() * 18; a[i * 3 + 2] = (Math.random() - 0.5) * 60; }
    g.setAttribute('position', new THREE.BufferAttribute(a, 3));
    this.snow = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.85, depthWrite: false })); this.snow.frustumCulled = false; this.scene.add(this.snow);
  }

  // ----- acts -----
  buildActs() {
    const M = this.M, G = this; const A = (x, z, r, label, f, when) => ({ x, z, r, label, f, when: when || (() => true) });
    const need = () => (S.tortyFreed ? 1 : 3);
    const swapHint = (who, why) => G.say([[CHARS[S.char].n, why], ['Tip', `Switch to ${CHARS[who].n} with the ${CHARS[who].e} button (or key ${['luna', 'pirat', 'snowie'].indexOf(who) + 1}).`]]);
    this.acts = [
      A(M.dig.x, M.dig.z, 1.5, () => (has('spoon') ? (S.digs >= need() ? '🕳️ Enter the tunnel' : `🥄 Dig (${S.digs}/${need()})`) : '🖼️ Look behind poster'), () => {
        if (!has('spoon')) return G.say([['Snowie', 'The plaster behind this Winter Gouda Fest poster is soft and crumbly…'], ['Luna', 'We need something to dig with. The cafeteria kitchen has spoons. Kitchen is off-limits, so sneak!']]);
        if (S.digs >= need()) {
          if (!has('map')) return G.say([['Pi-rat', 'The tunnel\'s open, but it drops into a maze of sewers. One eye can\'t read pipes in the dark.'], ['Luna', 'The workshop has a Municipal Sewer Map on the wall. Grab it first.']]);
          return G.escape('tunnel');
        }
        const w = G.watcherOf(M.dig.x, M.dig.z, 9); if (w) return toast(`👀 ${w.name} is looking this way. Wait for him to pass.`);
        G.mini.dig(() => { S.digs++; save(); sfx('crumb'); G.fx.puff(M.dig.x, 0.5, M.dig.z, 10, 0x8b5e34); toast(S.digs >= need() ? '🕳️ The tunnel is through! Press E to go in.' : `🥄 Dig progress ${S.digs}/${need()}${S.tortyFreed ? '' : ' · Tip: Torty digs fast'}`); G.syncHud(); });
      }),
      A(M.spoon.x, M.spoon.z, 1.6, () => '🥄 Grab spoon', () => G.take('spoon'), () => !has('spoon')),
      A(M.lights.x, M.lights.z, 2.0, () => '💡 Take the light strand', () => { if (S.char !== 'snowie') return swapHint('snowie', 'Those lights are way up at the top of the tree. Too high for me!'); sfx('jump'); G.take('lights'); }, () => !has('lights')),
      A(M.card.x, M.card.z, 1.6, () => '💌 Read holiday card', () => { S.knowCode = true; save(); G.say([['Holiday Card', '“Dear staff, happy holidays! Remember, the safe code is my birthday: November 15th. Never write it down! — Warden Gorgonzola”'], ['Luna', '1-1-1-5. Got it. I never forget a number.']]); G.syncHud(); }),
      A(M.cabinet.x, M.cabinet.z, 1.6, () => '🕹️ Play Searchlight Sneak', () => window.GR2_CAB && window.GR2_CAB.open()),
      A(M.candyTalk.x, M.candyTalk.z, 1.5, () => '🐶 Talk to Candy', () => { sfx('bark'); G.say(G.candyHint()); }),
      A(M.brieTalk.x, M.brieTalk.z, 1.5, () => '🕵️‍♀️ Talk to Brie', () => G.say(G.brieHint())),
      A(M.cabinet3d.x, M.cabinet3d.z, 1.6, () => '🧰 Pick tool cabinet', () => { if (S.char !== 'pirat') return swapHint('pirat', 'Padlocked tool cabinet. I can see wire cutters inside.'); G.mini.pick(3, 1.0, () => G.take('cutters')); }, () => !has('cutters')),
      A(M.map.x, M.map.z, 1.6, () => '🗺️ Take sewer map', () => G.take('map'), () => !has('map')),
      A(M.uniform.x, M.uniform.z, 1.6, () => '👮 Take guard uniform', () => G.take('uniform'), () => !has('uniform')),
      A(M.ventLaundry.x, M.ventLaundry.z, 1.4, () => '🌀 Crawl into vent', () => { if (S.char !== 'snowie') return swapHint('snowie', 'This vent is tiny. Only the smallest, bravest rat fits.'); G.mini.vent(() => { G.teleport(M.ventWarden.x - 1.2, M.ventWarden.z - 0.8, PI); toast('🌀 You pop out in the Warden\'s office!'); }); }),
      A(M.ventWarden.x, M.ventWarden.z, 1.3, () => '🌀 Vent back to laundry', () => { if (S.char !== 'snowie') return swapHint('snowie', 'Only Snowie fits in the vents.'); G.teleport(M.ventLaundry.x - 1.2, M.ventLaundry.z, -PI / 2); }),
      A(M.wardenDoor.x, M.wardenDoor.z - 0.6, 1.8, () => (has('keycard') ? '💳 Unlock with keycard' : '🔐 Pick the Warden\'s lock'), () => {
        if (has('keycard')) { S.wardenOpen = true; save(); sfx('check'); G.applyState(); return; }
        if (S.char !== 'pirat') return swapHint('pirat', 'The Warden\'s office is locked tight. A lockpick, or a tiny vent from the laundry room, might work.');
        G.mini.pick(4, 1.25, () => { S.wardenOpen = true; save(); G.applyState(); toast('🔓 The Warden\'s office is open'); });
      }, () => !S.wardenOpen),
      A(M.safe.x, M.safe.z, 1.5, () => '🔢 Open the safe', () => {
        if (S.char !== 'luna') return swapHint('luna', 'A holiday-themed safe with a 4-digit keypad.');
        if (!S.knowCode) G.say([['Luna', 'Four digits… I don\'t know the code. Someone may have written it in a holiday card. Want to guess anyway?']], () => G.mini.keypad('1115', () => G.take('keycard')));
        else G.mini.keypad('1115', () => G.take('keycard'));
      }, () => !has('keycard')),
      A(M.ledger.x, M.ledger.z, 1.6, () => '📒 Take the secret ledger', () => { G.take('ledger'); G.say([['Luna', '“Ratita Now➡️: cheese diverted, 40,000 wheels.” This is it, proof of who caused the Great Cheese Shortage!'], ['Pi-rat', 'And a note: “Frame the tortoise.” Torty\'s innocent!']]); }, () => !has('ledger')),
      A(M.tortyDoor.x, M.tortyDoor.z + 0.9, 1.6, () => (has('keycard') ? '💳 Free Torty' : '🔐 Pick Torty\'s lock'), () => {
        const free = () => { S.tortyFreed = true; save(); G.applyState(); sfx('part'); G.say([['Torty', 'Slow and steady wins the escape! Thank you, friends. I\'m an excellent digger, by the way.'], ['Snowie', 'Torty joins the crew! Tunnel digging is now one dig.']]); };
        if (has('keycard')) return free();
        if (S.char !== 'pirat') return swapHint('pirat', 'Torty\'s in the Tortoise Wing behind heavy bars. Pi-rat could pick it.');
        G.mini.pick(4, 1.35, free);
      }, () => !S.tortyFreed),
      A(M.torty.x, M.torty.z + 2.2, 1.4, () => '🐢 Talk to Torty', () => G.say([['Torty', 'They say I caused the Great Cheese Shortage. I run Tortuga Tech, I\'ve never hoarded a crumb!'], ['Torty', 'Someone in the Warden\'s office keeps a ledger. Find it and you\'ll clear my name.']]), () => !S.tortyFreed),
      A(M.staffDoor.x, M.staffDoor.z - 0.7, 1.4, () => '🚪 Staff door', () => {
        if (has('keycard') || (S.wearing && has('uniform'))) { S.staffOpen = true; save(); G.applyState(); sfx('check'); toast(has('keycard') ? '💳 Beep! Staff door unlocked' : '👮 “Evening, officer.” The door buzzes open.'); }
        else G.say([['Staff Door', 'STAFF ONLY. Keycard or uniform required.']]);
      }, () => !S.staffOpen),
      A(M.gate.x, M.gate.z, 1.6, () => '🎫 Gate terminal', () => {
        if (has('keycard') && S.wearing && has('uniform')) return G.escape('disguise');
        G.say([['Gate Terminal', 'Swipe card. Staff in uniform only.'], ['Luna', `We need ${[!has('keycard') && 'the Warden\'s keycard', !(S.wearing && has('uniform')) && 'to wear a guard uniform'].filter(Boolean).join(' and ')}.`]]);
      }),
      A(M.fenceCut.x, M.fenceCut.z, 1.7, () => (has('cutters') ? '✂️ Cut the fence (hold)' : '🚧 Blind spot'), () => {
        if (!has('cutters')) return G.say([['Pi-rat', 'This bit of fence is behind the shed, a blind spot for the yard guard. With wire cutters we could slip through.']]);
        G.startHold('✂️ Cutting…', 2.0, () => { S.fenceCut = true; save(); G.applyState(); sfx('pop'); toast('✂️ Fence cut! Watch the searchlights.'); });
      }, () => !S.fenceCut),
      A(M.weakWall.x, M.weakWall.z, 1.8, () => (has('lights') ? '🧗 Climb with the lights' : '🧱 Crumbly wall'), () => {
        if (!has('lights')) return G.say([['Snowie', 'This wall is under repair and full of cracks. Too tall to jump, but with a long strand of something tied into a rope…'], ['Luna', 'Like the holiday lights on the cafeteria tree?']]);
        G.startHold('🧗 Climbing…', 1.6, () => G.escape('wall'));
      }),
    ];
    // inmate chatter
    const lines = { brownie: 'Cell talk: the kitchen guard naps by the ovens. Sneak (🤫) past him.', ginger: 'Psst, the Warden\'s birthday is on the holiday card in the cafeteria. He uses it for EVERYTHING.', cocoa: 'Searchlights sweep in slow loops. Hide behind the junk crates on the east lawn.', cream: 'Laundry has spare uniforms in the back room. Wear one and the guards barely blink.' };
    for (const im of M.inmates) this.acts.push(A(-26.2, im.z + 0.4, 1.2, () => '💬 Chat with cellmate', () => G.say([['Inmate', lines[im.id] || 'Happy holidays, neighbor.']]), () => !(im.z > -30 && im.z < -28)));
  }
  candyHint() {
    const L = [['Candy', 'Woof! RuffSources Rescue is working on your case, and I brought holiday biscuits!']];
    if (!S.knowCode) L.push(['Candy', 'Brie says the Warden posted a holiday card in the cafeteria. Read it, Luna remembers numbers.']);
    else if (!has('cutters')) L.push(['Candy', 'Pi-rat can pick the tool cabinet in the workshop. Wire cutters!']);
    else if (!S.tortyFreed) L.push(['Candy', 'Free Torty from the Tortoise Wing. Tortoises dig like champions.']);
    else L.push(['Candy', 'There are three ways out: tunnel, disguise or over the wall. Try them all!']);
    return L;
  }
  brieHint() {
    return [['Brie', 'I freed you once, and I\'ll clear you again. Shadow Luna, Dread Pi-rat and Frostbite Snowie wore your faces at the Golden Gouda vault.'],
      ['Brie', has('ledger') ? 'You found the ledger! Escape with it AND Torty and I can blow this case wide open.' : 'Ratita Now➡️ runs this prison through Warden Gorgonzola. His office ledger could prove the Great Cheese Shortage was a scheme.']];
  }
  say(lines, done) { startDialogue(lines, done || null); }
  take(k) {
    if (has(k)) return; S.items.push(k); S.lastItem = k; save(); sfx('cheese'); const p = this.pickups[k]; if (p) { this.fx.burst(p.position.x, p.position.y, p.position.z, 0xfde047, 14); p.visible = false; }
    toast(`${ITEMS[k].e} Got the ${ITEMS[k].n}! ${ITEMS[k].d}`, 3600); this.syncHud();
  }
  startHold(label, dur, done) { this.hold = { label, dur, t: 0, done, x: this.me.x, z: this.me.z }; }

  // ----- detection -----
  restricted() {
    const x = this.me.x, z = this.me.z, Z = this.M.zones;
    if (inBox(x, z, Z.kitchen)) return 'Kitchen';
    if (inBox(x, z, Z.tools)) return 'Tool Room';
    if (inBox(x, z, Z.backRoom)) return 'Laundry Back Room';
    if (inBox(x, z, Z.warden)) return 'Warden\'s Office';
    if (inBox(x, z, Z.visitor) && z < -34.2) return 'Visitor Side';
    if (inBox(x, z, Z.gateStrip)) return 'Front Gate';
    if (inBox(x, z, Z.eastLawn) || inBox(x, z, Z.westLawn)) return 'Dead Zone';
    if (inBox(x, z, [-16.6, -41, -11, -34.6])) return 'Tortoise Wing';
    if (inBox(x, z, [22.2, 7.6, 24, 12.4]) && !S.fenceCut) return 'Fence Line';
    return null;
  }
  los(g, x, z, maxD) {
    _o.set(g.x, 1.0, g.z); _d.set(x - g.x, 0, z - g.z); const d = _d.length(); if (d > maxD) return false; _d.normalize();
    const hit = this.world.ray(_o, _d, d, (s) => !s.see && !s.Trigger);
    return !(typeof hit === 'number' && hit < d - 0.35);
  }
  watcherOf(x, z, range) { for (const g of this.guards) if (this.los(g, x, z, range) && this.inCone(g, x, z, 1.0)) return g; return null; }
  inCone(g, x, z, half) { let a = Math.atan2(x - g.x, z - g.z) - g.yaw; a = Math.atan2(Math.sin(a), Math.cos(a)); return Math.abs(a) < half; }

  // ----- caught -----
  caught(by) {
    if (this.mode !== 'play') return; this.mode = 'caught'; sfx('hurt'); this.sus = 0;
    let lost = null; const pool = S.items.filter((k) => k !== 'map');
    if (pool.length) { lost = (S.lastItem && pool.includes(S.lastItem)) ? S.lastItem : pool[pool.length - 1]; S.items = S.items.filter((k) => k !== lost); if (lost === 'uniform') S.wearing = false; }
    S.lastItem = S.items[S.items.length - 1] || null; S.caught++; save();
    $('caughtWho').textContent = `${by} spotted you!`;
    $('caughtBody').textContent = lost ? `Confiscated: ${ITEMS[lost].e} ${ITEMS[lost].n}. It's back where you found it, so you can grab it again.` : 'Nothing confiscated. Cell doors open again shortly.';
    $('caughtModal').classList.add('on');
  }
  afterCaught() {
    $('caughtModal').classList.remove('on'); this.lockdown = 5; this.applyState(); this.teleport(this.M.myCell.x, this.M.myCell.z, PI / 2);
    for (const g of this.guards) { g.x = g.home[0]; g.z = g.home[1]; g.i = 1; }
    this.mode = 'play'; toast('🔒 Lockdown! Cell doors reopen in 5 seconds…');
  }

  // ----- endings -----
  escape(kind) {
    const miracle = S.tortyFreed && has('ledger'); this.mode = 'end'; this.me.locked = true;
    const got = [kind]; if (miracle) got.push('miracle');
    for (const k of got) if (!S.endings.includes(k)) S.endings.push(k); save();
    sfx('cheer'); this.fx.confetti(this.me.x, this.me.y + 1, this.me.z, 90);
    const E1 = ENDINGS[kind];
    $('endBadge').textContent = `${E1.e} ENDING ${S.endings.length}/4 FOUND`;
    $('endTitle').textContent = miracle ? `${ENDINGS.miracle.e} ${ENDINGS.miracle.t}` : `${E1.e} ${E1.t}`;
    $('endBody').innerHTML = `<p>${E1.b}</p>` + (miracle && E1 !== ENDINGS.miracle ? `<p><b>True ending!</b> ${ENDINGS.miracle.b}</p>` : miracle ? "" : `<p style="color:#fbbf24">Escape with <b>Torty</b> and the <b>Ratita Now➡️ ledger</b> for the true ending.</p>`);
    $('endStats').innerHTML = Object.entries(ENDINGS).map(([k, v]) => `<span class="endchip ${S.endings.includes(k) ? 'on' : ''}">${S.endings.includes(k) ? v.e : '❔'} ${S.endings.includes(k) ? v.t : '???'}</span>`).join('') + `<div style="margin-top:6px">Times caught: ${S.caught}</div>`;
    setTimeout(() => $('endModal').classList.add('on'), 900);
  }
  newRun() {
    const keep = S.endings.slice(); S = DEF(); S.endings = keep; S.started = true; save();
    $('endModal').classList.remove('on'); this.me.locked = false; this.lockdown = 0; this.sus = 0; this.applyState(true); this.cam.yaw = PI / 2 + PI; this.mode = 'play';
  }

  // ----- visibility -----
  setVis(force) {
    const me = this.me, b = buildingAt(me.x, me.z);
    if (b !== this.inB || force) { this.inB = b; useSurfaceSet(b ? (b.id === 'warden' ? 'home' : 'lab') : 'street'); this.syncHud(); playMusic(this.mode === 'title' ? null : (b ? (b.id === 'caf' ? 'kitchen' : 'vents') : 'jingle')); }
    const RM = this.world.regionMeshes;
    for (const B of BUILDINGS) {
      const inIt = B === b; (RM['roof_' + B.id] || []).forEach((m) => { m.visible = !inIt; });
      const dist = Math.max(0, B.x0 - me.x, me.x - B.x1, B.z0 - me.z, me.z - B.z1); const show = inIt || dist < 34;
      (RM['in_' + B.id] || []).forEach((m) => { m.visible = show; });
    }
    const vis = (r) => !r || r === 'out' || (RM[r] && RM[r][0] ? RM[r][0].visible : true);
    for (const n of this.npcs) n.root.visible = vis(n.region);
    this.candy.root.visible = vis('in_vis'); this.tortyIn.root.visible = vis('in_cells') && !S.tortyFreed;
    for (const g of this.guards) g.rig.root.visible = vis(g.reg);
    for (const k in this.pickups) { const p = this.pickups[k]; p.visible = !has(k) && vis(p.userData.reg); }
  }
  fades() {
    const b = this.inB, c = E.camera.position, me = this.me; _v.set(me.x, me.y + 1.2, me.z).sub(c); const L = _v.length(); _r.set(c, _v.normalize());
    for (const B of BUILDINGS) for (const f of B.fades) { let hide = false; if (B === b) { _b.copy(f.box).expandByScalar(0.08); const p = _r.intersectBox(_b, _s); hide = !!p && c.distanceTo(p) < L - 0.3; } if (f._h !== hide) { f._h = hide; f.meshes.forEach((m) => { m.visible = !hide; }); } }
  }

  // ----- HUD -----
  syncHud() {
    const b = this.inB; const loc = this.restricted();
    $('hudLoc').textContent = (b ? b.name : '❄️ Prison Yard') + (loc ? ' · ⛔ ' + loc : '');
    $('hudLoc').classList.toggle('bad', !!loc);
    document.querySelectorAll('.char-btn').forEach((el) => el.classList.toggle('on', el.dataset.c === S.char));
    $('btnSneak').classList.toggle('on', !!S.sneak);
    const inv = $('inv'); inv.innerHTML = '';
    for (const k of S.items) { const d = document.createElement('button'); d.className = 'inv-chip' + (k === 'uniform' && S.wearing ? ' on' : ''); d.innerHTML = `<span>${ITEMS[k].e}</span>${ITEMS[k].n}${k === 'uniform' ? (S.wearing ? ' · worn' : ' · tap to wear') : ''}`; d.onclick = () => { if (k === 'uniform') { S.wearing = !S.wearing; save(); this.setChar(S.char, true); toast(S.wearing ? '👮 Uniform on. Guards only notice you up close.' : 'Uniform off.'); } else toast(`${ITEMS[k].e} ${ITEMS[k].d}`); }; inv.appendChild(d); }
    if (S.tortyFreed) { const d = document.createElement('span'); d.className = 'inv-chip ally'; d.innerHTML = '<span>🐢</span>Torty'; inv.appendChild(d); }
    $('hudObj').textContent = this.objective();
  }
  objective() {
    if (this.lockdown > 0) return `🔒 Lockdown: ${Math.ceil(this.lockdown)}s`;
    if (!has('spoon') && !has('cutters') && !has('uniform')) return '🎯 Explore. Visit Candy & Brie in Visitation, read the Plan (📋)';
    if (S.digs > 0 && S.digs < (S.tortyFreed ? 1 : 3)) return '🎯 Keep digging behind the poster in cell A-3';
    if (has('cutters') && !S.fenceCut) return '🎯 Cut the fence at the east blind spot';
    if (has('uniform') && !has('keycard')) return '🎯 Find the Warden\'s keycard (safe in his office)';
    return '🎯 Pick an escape route. Check the Plan (📋)';
  }
  openPlan() {
    const ck = (b, t) => `<li class="${b ? 'done' : ''}">${b ? '✅' : '⬜'} ${t}</li>`;
    $('planBody').innerHTML = `
      <div class="route"><h3>🕳️ Route 1 · The Tunnel</h3><ul>${ck(has('spoon'), 'Sneak a spoon out of the cafeteria kitchen')}${ck(S.digs >= (S.tortyFreed ? 1 : 3), `Dig behind the poster in cell A-3 when no guard is looking (${S.digs}/${S.tortyFreed ? 1 : 3})`)}${ck(has('map'), 'Take the sewer map from the workshop')}</ul></div>
      <div class="route"><h3>👮 Route 2 · The Disguise</h3><ul>${ck(has('uniform'), 'Swipe a uniform from the laundry back room')}${ck(S.knowCode, 'Learn the safe code (holiday card, cafeteria)')}${ck(has('keycard'), 'Luna cracks the Warden\'s safe for the keycard')}${ck(S.wearing, 'Wear the uniform')}${ck(false, 'Walk through Visitation\'s staff door to the gate terminal')}</ul></div>
      <div class="route"><h3>🧗 Route 3 · Over the Wall</h3><ul>${ck(has('cutters'), 'Pi-rat picks the workshop tool cabinet for wire cutters')}${ck(has('lights'), 'Snowie climbs the cafeteria tree for the light strand')}${ck(S.fenceCut, 'Cut the east fence at the blind spot')}${ck(false, 'Dodge the searchlights and climb the weak wall')}</ul></div>
      <div class="route gold"><h3>🎄 True Ending · A Holiday Miracle</h3><ul>${ck(S.tortyFreed, 'Free Torty from the Tortoise Wing')}${ck(has('ledger'), 'Steal the Ratita Now➡️ ledger from the Warden\'s desk')}${ck(false, 'Escape by any route with both')}</ul></div>
      <div class="crew">${Object.entries(CHARS).map(([k, c]) => `<span>${c.e} <b>${c.n}</b> · ${c.skill}</span>`).join('')}</div>
      <div class="crew">Endings found: ${S.endings.length}/4 · Times caught: ${S.caught}</div>`;
    $('planModal').classList.add('on');
  }

  // ----- main step -----
  step(dt) {
    this.T += dt; const me = this.me;
    if (this.snow) { const p = this.snow.geometry.attributes.position, a = p.array; for (let i = 0; i < a.length; i += 3) { a[i + 1] -= dt * 1.4; a[i] += Math.sin(this.T + i) * dt * 0.2; if (a[i + 1] < 0) a[i + 1] = 18; } p.needsUpdate = true; this.snow.position.set(me.x, 0, me.z); this.snow.visible = !this.inB; }
    for (const k in this.pickups) { const p = this.pickups[k]; if (p.visible) { p.position.y = p.userData.base + Math.sin(this.T * 2.5 + p.position.x) * 0.08; p.children[1].rotation.z += dt; } }
    this.updateSearchlights(dt);
    if (this.mode !== 'play' || this.busy) { this.animIdle(dt); this.cam.update(dt, me, this.inB ? null : this.world, { dist: this.inB ? 6.8 : 8.2 }); followShadow(me.x, me.y, me.z); updateShadowlight(dt, me, E.camera, {}); clearEdges(); return; }
    if (edge('pause') || edge('board')) this.openPlan();
    if (isTalking()) { if (edge('act') || edge('jump')) stepDialogue(); clearEdges(); this.animIdle(dt); followShadow(me.x, me.y, me.z); updateShadowlight(dt, me, E.camera, {}); return; }
    if (this.lockdown > 0) { this.lockdown -= dt; if (this.lockdown <= 0) { this.doors.cell.set(true); toast('🔔 Cell doors open. Back to holiday free time!'); sfx('check'); } if (((this.lockdown * 4) | 0) % 4 === 0) this.syncHud(); }
    // sneak
    me.spdMul = S.sneak ? 0.55 : 1; if (S.sneak) IN.held.sprint = false;
    if (this.hold) { me.locked = true; } else if (me.locked && this.mode === 'play') me.locked = false;
    me.step(dt, this.world, this.cam.moveYaw, this.fx);
    this.setVis(false);
    const inside = !!this.inB;
    this.cam.update(dt, me, inside ? null : this.world, inside ? { dist: 6.8 } : { dist: 8.2 });
    if (inside) this.cam.pitch = Math.max(this.cam.pitch, 0.56);
    this.fades();
    // trail + followers
    const t0 = this.trail[0]; if (Math.hypot(me.x - t0[0], me.z - t0[1]) > 0.25) { this.trail.unshift([me.x, me.z]); if (this.trail.length > 60) this.trail.pop(); }
    const F = this.followers();
    for (const id in this.pets) { const p = this.pets[id]; const idx = F.indexOf(id); p.root.visible = idx >= 0; if (idx < 0) continue;
      const tp = this.trail[Math.min(this.trail.length - 1, 5 + idx * 5)]; const dx = tp[0] - p.x, dz = tp[1] - p.z, d = Math.hypot(dx, dz);
      if (d > 8) { p.x = tp[0]; p.z = tp[1]; } const k = Math.min(1, dt * 6); p.x += dx * k; p.z += dz * k; p.speed = d > 0.05 ? Math.min(7, d * 6) : 0;
      if (d > 0.05) { const want = Math.atan2(dx, dz); let dy = want - p.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); p.yaw += dy * Math.min(1, dt * 10); }
      p.root.visible = !this.inB || buildingAt(p.x, p.z) === this.inB || true; animPet(p, dt, me); }
    this.animIdle(dt, true);
    // hold actions
    if (this.hold) { const h = this.hold; h.t += dt; $('holdBar').classList.add('on'); $('holdLbl').textContent = h.label; $('holdFill').style.width = (100 * h.t / h.dur) + '%';
      if (h.t >= h.dur) { this.hold = null; $('holdBar').classList.remove('on'); me.locked = false; h.done(); } }
    else $('holdBar').classList.remove('on');
    // guards + detection
    this.updateGuards(dt);
    // acts
    let best = null, bd = 1e9;
    for (const a of this.acts) { if (!a.when()) continue; const d = Math.hypot(me.x - a.x, me.z - a.z); if (d < a.r && d < bd) { bd = d; best = a; } }
    if (this.hold) best = null;
    this.activeAct = best; setPrompt(best ? { label: best.label() } : null);
    if (best && edge('act')) best.f();
    // char switching via keys
    for (const [k, c] of [['Digit1', 'luna'], ['Digit2', 'pirat'], ['Digit3', 'snowie']]) if (IN.keys[k] && S.char !== c) { this.swapTo(c); }
    if (IN.keys.KeyC && !this._cDown) { S.sneak = !S.sneak; save(); this.syncHud(); } this._cDown = IN.keys.KeyC;
    this.fx.update(dt);
    followShadow(me.x, me.y, me.z);
    updateShadowlight(dt, me, E.camera, { hurt: this.sus > 0.6 ? (this.sus - 0.6) : 0 });
    $('susFill').style.width = (this.sus * 100) + '%'; $('sus').classList.toggle('hot', this.sus > 0.5); $('sus').classList.toggle('on', this.sus > 0.01);
    if (((this.T * 4) | 0) !== this._hudTick) { this._hudTick = (this.T * 4) | 0; $('hudLoc').textContent = (this.inB ? this.inB.name : '❄️ Prison Yard') + (this.restricted() ? ' · ⛔ ' + this.restricted() : ''); $('hudLoc').classList.toggle('bad', !!this.restricted()); }
  }
  swapTo(c) { if (this.mode !== 'play' || c === S.char) return; const p = this.pets[c]; const ox = p.x, oz = p.z; this.setChar(c); this.pets[c].x = this.me.x; sfx('squeak'); this.fx.ring(this.me.x, 0.2, this.me.z, 0x38bdf8); toast(`${CHARS[c].e} Now playing ${CHARS[c].n} · ${CHARS[c].skill}`); }
  animIdle(dt, playing) {
    for (const n of this.npcs) if (n.root.visible) animRat(n.rig, dt, { speed: 0 });
    if (this.candy.root.visible) animPet(this.candy, dt, this.me);
    if (this.tortyIn.root.visible) animPet(this.tortyIn, dt, this.me);
    if (!playing) for (const id in this.pets) { const p = this.pets[id]; if (p.root.visible) { p.speed = 0; animPet(p, dt, this.me); } }
  }
  updateSearchlights(dt) {
    const me = this.me; let lit = false;
    for (const L of this.lightsS) {
      const cx = L.side * 30, mz = (L.z0 + L.z1) / 2, hz = (L.z1 - L.z0) / 2 - 1.5;
      L.x = cx + Math.sin(this.T * 0.55 + L.ph) * 4.2; L.z = mz + Math.sin(this.T * 0.31 + L.ph * 1.3) * hz;
      L.disc.position.x = L.x; L.disc.position.z = L.z;
      const top = new THREE.Vector3(L.tx, 7.2, L.tz), bot = new THREE.Vector3(L.x, 0, L.z), mid = top.clone().add(bot).multiplyScalar(0.5);
      L.beam.position.copy(mid); L.beam.scale.set(1, top.distanceTo(bot), 1); L.beam.lookAt(bot); L.beam.rotateX(PI / 2);
      if (this.mode === 'play' && !this.inB && Math.hypot(me.x - L.x, me.z - L.z) < 2.6) lit = true;
    }
    this.lit = lit;
  }
  updateGuards(dt) {
    const me = this.me, zone = this.restricted(); let seer = null, rate = 0;
    const disguised = S.wearing && has('uniform');
    for (const g of this.guards) {
      const tgt = g.path[g.i]; const dx = tgt[0] - g.x, dz = tgt[1] - g.z, d = Math.hypot(dx, dz);
      if (g.alert > 0) { g.alert -= dt; g.speed = 0; const want = Math.atan2(me.x - g.x, me.z - g.z); let dy = want - g.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); g.yaw += dy * Math.min(1, dt * 5); }
      else if (g.wait > 0) { g.wait -= dt; g.speed = 0; g.yaw += Math.sin(this.T * 1.6 + g.x) * dt * 1.2; }
      else if (d < 0.2) { g.i = (g.i + 1) % g.path.length; g.wait = 1.4; }
      else { const sp = 2.4; g.x += dx / d * Math.min(d, sp * dt); g.z += dz / d * Math.min(d, sp * dt); g.speed = sp; const want = Math.atan2(dx, dz); let dy = want - g.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); g.yaw += dy * Math.min(1, dt * 6); }
      g.rig.root.position.set(g.x, 0, g.z); g.rig.root.rotation.y = g.yaw; if (g.rig.root.visible) animRat(g.rig, dt, { speed: g.speed });
      const range = disguised ? 2.4 : 7.5 * (S.sneak ? 0.62 : 1); g.cone.scale.setScalar(range);
      g.cone.material.color.setHex(g.alert > 0 ? 0xef4444 : 0xfde047);
      g.mark.visible = g.alert > 0;
      if (!zone || this.hold && false) continue;
      const pd = Math.hypot(me.x - g.x, me.z - g.z);
      const close = pd < (S.sneak ? 0.9 : 1.6);
      if ((pd < range && this.inCone(g, me.x, me.z, 0.62) || close) && this.los(g, me.x, me.z, range + 0.5)) { const r = (zone === 'Dead Zone' ? 1.4 : 1.0) * (1.6 - pd / range) * (disguised ? 0.6 : 1); if (r > rate) { rate = r; seer = g; } }
    }
    if (this.lit && zone === 'Dead Zone') { rate = Math.max(rate, 2.2); seer = seer || { name: 'The searchlight tower' }; }
    if (this.noDetect) seer = null;
    if (seer) { this.sus = Math.min(1, this.sus + rate * dt * 0.9); if (seer.alert !== undefined || seer.path) seer.alert = 0.6; if (!this._seenT || this.T - this._seenT > 1.2) { sfx('miss'); this._seenT = this.T; } }
    else this.sus = Math.max(0, this.sus - dt * 0.35);
    if (this.sus >= 1) this.caught(seer ? seer.name : 'A guard');
  }
}

// ---------- DOM mini-games ----------
function makeMini(game) {
  const box = $('mg'), title = $('mgTitle'), body = $('mgBody'), hint = $('mgHint');
  let keyH = null, rafId = 0;
  const open = (t, h) => { game.busy = true; title.textContent = t; hint.textContent = h; body.innerHTML = ''; box.classList.add('on'); clearEdges(); };
  const close = () => { box.classList.remove('on'); game.busy = false; if (keyH) window.removeEventListener('keydown', keyH, true); keyH = null; cancelAnimationFrame(rafId); clearEdges(); body.innerHTML = ''; };
  $('mgClose').onclick = () => { sfx('click'); close(); };
  function bar(t, h, n, speed, zoneW, onWin, failNoise) {
    open(t, h); const c = document.createElement('canvas'); c.width = 520; c.height = 120; c.className = 'mg-bar'; body.appendChild(c);
    const btn = document.createElement('button'); btn.className = 'primary-btn big'; btn.textContent = 'TAP / SPACE'; body.appendChild(btn);
    const g = c.getContext('2d'); let pos = 0, dir = 1, got = 0, fails = 0, zc = 0.3 + Math.random() * 0.4, flash = 0, fcol = '#22c55e', last = performance.now();
    const hit = () => { if (Math.abs(pos - zc) < zoneW / 2) { got++; sfx('pock'); flash = 1; fcol = '#22c55e'; zc = 0.15 + Math.random() * 0.7; if (got >= n) { sfx('check'); setTimeout(() => { close(); onWin(); }, 250); } } else { fails++; sfx('miss'); flash = 1; fcol = '#ef4444'; got = Math.max(0, got - 1); if (failNoise) failNoise(); if (fails >= 4) { toast('😮‍💨 Too noisy, take a breath and try again.'); close(); } } };
    btn.onclick = (e) => { e.preventDefault(); hit(); };
    keyH = (e) => { if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') { e.preventDefault(); e.stopPropagation(); if (!e.repeat) hit(); } if (e.code === 'Escape') { e.preventDefault(); close(); } }; window.addEventListener('keydown', keyH, true);
    const draw = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; pos += dir * speed * dt * 0.9; if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; }
      g.clearRect(0, 0, 520, 120); g.fillStyle = '#0f172a'; g.fillRect(10, 40, 500, 40); g.fillStyle = '#16a34a'; g.fillRect(10 + (zc - zoneW / 2) * 500, 40, zoneW * 500, 40);
      g.fillStyle = '#fde047'; g.fillRect(6 + pos * 500, 30, 8, 60);
      for (let i = 0; i < n; i++) { g.fillStyle = i < got ? '#fde047' : '#334155'; g.beginPath(); g.arc(260 - (n - 1) * 18 + i * 36, 15, 10, 0, 7); g.fill(); }
      if (flash > 0) { flash -= dt * 3; g.strokeStyle = fcol; g.lineWidth = 4; g.globalAlpha = Math.max(0, flash); g.strokeRect(8, 38, 504, 44); g.globalAlpha = 1; }
      g.fillStyle = '#cbd5e1'; g.font = '14px system-ui'; g.textAlign = 'center'; g.fillText(`${got}/${n}`, 260, 108);
      if (box.classList.contains('on')) rafId = requestAnimationFrame(draw); };
    rafId = requestAnimationFrame(draw);
  }
  const noise = () => { game.sus = Math.min(0.95, game.sus + (game.restricted() ? 0.18 : 0)); };
  return {
    pick(n, speed, onWin) { bar('🔐 Pi-rat\'s Lockpick', 'Tap when the pick is in the green to set each pin. Misses make noise!', n, speed, 0.16, onWin, noise); },
    dig(onWin) { bar('🥄 Quiet Digging', 'Tap in the soft dirt (green). Three good scoops per dig.', 3, 0.85, 0.22, onWin, null); },
    keypad(code, onWin) {
      open('🔢 Warden\'s Safe', 'Luna enters the 4-digit code.'); let v = '';
      const disp = document.createElement('div'); disp.className = 'kp-disp'; disp.textContent = '----'; body.appendChild(disp);
      const grid = document.createElement('div'); grid.className = 'kp-grid'; body.appendChild(grid);
      const press = (k) => { sfx('click'); if (k === '⌫') v = v.slice(0, -1); else if (k === '✓') { if (v === code) { sfx('check'); disp.textContent = 'OPEN'; disp.classList.add('ok'); setTimeout(() => { close(); onWin(); }, 350); return; } sfx('lose'); disp.classList.add('bad'); setTimeout(() => disp.classList.remove('bad'), 400); v = ''; } else if (v.length < 4) v += k; disp.textContent = (v + '----').slice(0, 4); };
      for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓']) { const b = document.createElement('button'); b.textContent = k; b.onclick = () => press(k); grid.appendChild(b); }
      keyH = (e) => { if (/^Digit\d$/.test(e.code)) { e.preventDefault(); e.stopPropagation(); press(e.code.slice(5)); } else if (e.code === 'Backspace') { e.preventDefault(); press('⌫'); } else if (e.code === 'Enter') { e.preventDefault(); e.stopPropagation(); press('✓'); } else if (e.code === 'Escape') close(); }; window.addEventListener('keydown', keyH, true);
    },
    vent(onWin) {
      open('🌀 Vent Crawl', 'Guide Snowie to the Warden\'s office grate (🎁). Avoid the fans 🌀.');
      const MZ = ['#########', '#S..#...#', '#.#.#.#.#', '#.#...#.#', '#.###F#.#', '#...#..G#', '#########'];
      let px = 1, py = 1; const fans = [];
      const c = document.createElement('canvas'); c.width = 360; c.height = 280; c.className = 'mg-vent'; body.appendChild(c); const g = c.getContext('2d');
      const pad = document.createElement('div'); pad.className = 'vent-pad'; body.appendChild(pad);
      const draw = () => { g.fillStyle = '#0b1220'; g.fillRect(0, 0, 360, 280); for (let y = 0; y < 7; y++) for (let x = 0; x < 9; x++) { const ch = MZ[y][x]; g.fillStyle = ch === '#' ? '#475569' : '#1e293b'; g.fillRect(x * 40, y * 40, 39, 39); g.font = '26px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; if (ch === 'F') g.fillText('🌀', x * 40 + 20, y * 40 + 22); if (ch === 'G') g.fillText('🎁', x * 40 + 20, y * 40 + 22); } g.font = '26px sans-serif'; g.fillText('🐁', px * 40 + 20, py * 40 + 22); };
      const mv = (dx, dy) => { const nx = px + dx, ny = py + dy, ch = MZ[ny][nx]; if (ch === '#') { sfx('bnc'); return; } if (ch === 'F') { sfx('whoosh'); px = 1; py = 1; toast('🌀 Whoosh! Blown back to the start.'); draw(); return; } px = nx; py = ny; sfx('crumb'); draw(); if (ch === 'G') { sfx('check'); setTimeout(() => { close(); onWin(); }, 250); } };
      for (const [l, dx, dy] of [['▲', 0, -1], ['◀', -1, 0], ['▼', 0, 1], ['▶', 1, 0]]) { const b = document.createElement('button'); b.textContent = l; b.onclick = () => mv(dx, dy); pad.appendChild(b); }
      keyH = (e) => { const m = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] }[e.code]; if (m) { e.preventDefault(); e.stopPropagation(); mv(m[0], m[1]); } if (e.code === 'Escape') close(); }; window.addEventListener('keydown', keyH, true);
      draw();
    },
  };
}

// ---------- boot ----------
let game = null;
function boot() {
  load(); initInput(); const unlock = () => initAudio(); window.addEventListener('mousedown', unlock); window.addEventListener('keydown', unlock); window.addEventListener('touchstart', unlock, { passive: true });
  game = new PrisonGame(); game.mini = makeMini(game);
  document.querySelectorAll('.char-btn').forEach((el) => { el.onclick = () => game.swapTo(el.dataset.c); });
  $('btnSneak').onclick = () => { S.sneak = !S.sneak; save(); game.syncHud(); sfx('click'); toast(S.sneak ? '🤫 Sneaking: slower, much harder to spot' : 'Walking normally'); };
  $('btnPlan').onclick = () => { sfx('click'); game.openPlan(); };
  $('btnFlash').onclick = () => { SL.flashlight = !SL.flashlight; sfx('click'); toast(SL.flashlight ? '🔦 Flashlight ON' : '🔦 Flashlight OFF'); };
  $('btnMute').onclick = () => { const on = !SND.on; setSound(on, on); $('btnMute').textContent = on ? '🔊' : '🔇'; };
  document.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => $(b.dataset.close).classList.remove('on'); });
  $('btnCaught').onclick = () => game.afterCaught();
  $('btnEndAgain').onclick = () => game.newRun();
  $('btnEndTitle').onclick = () => { $('endModal').classList.remove('on'); showTitle(); };
  $('dlgNextBtn').onclick = (e) => { e.stopPropagation(); stepDialogue(); };
  $('actBtn').onclick = () => { if (game.activeAct) game.activeAct.f(); };
  const showTitle = () => { game.mode = 'title'; $('titleScreen').classList.remove('off'); $('btnContinue').style.display = S.started ? '' : 'none'; $('titleEnds').textContent = S.endings.length ? `Endings found: ${S.endings.length}/4` : ''; };
  const start = (fresh) => {
    $('titleScreen').classList.add('off'); sfx('click');
    if (fresh) { const keep = S.endings.slice(); S = DEF(); S.endings = keep; save(); game.lockdown = 0; game.applyState(true); game.cam.yaw = PI / 2 + PI; game.cam.snap = true; game.mode = 'intro';
      startDialogue([
        ['Year 000 1 · Great Rodentia', 'Winter in the capital of the USM. The Golden Gouda vanished from the festival vault, and the cameras showed Luna, Pi-rat and Snowie.'],
        ['Luna', 'It was Dr. Evilest\'s Evil Twins. Shadow Luna, Dread Pi-rat and Frostbite Snowie wore our faces again!'],
        ['Pi-rat', 'And they\'ve locked us in National Ratita Prison for the holidays. Brie got us out last time. This time we break out ourselves.'],
        ['Snowie', 'Torty\'s here too. They blamed him for the Great Cheese Shortage, but Ratita Now➡️ did it!'],
        ['Guard', '🔔 HOLIDAY FREE TIME! Cell doors open. No funny business, inmates!'],
        ['Tip', 'Swap rats with 🐭 🏴‍☠️ 🐁 (keys 1-3). Each has a skill. 🤫 Sneak (C) in ⛔ restricted areas. If you get caught you only lose one item. Open the 📋 Plan (Tab) any time.'],
      ], () => { S.started = true; save(); game.doors.cell.set(true); game.mode = 'play'; sfx('check'); game.setVis(true); });
    } else { game.lockdown = 0; game.applyState(true); game.mode = 'play'; game.setVis(true); }
  };
  $('btnNew').onclick = () => start(true); $('btnContinue').onclick = () => start(false);
  showTitle();
  window.__gr2 = { game: () => game, S: () => S, start, teleport: (x, z, y) => game.teleport(x, z, y || 0), give: (k) => game.take(k), marks: () => game.M, escape: (k) => game.escape(k), caught: () => game.caught('Test Guard'), swap: (c) => game.swapTo(c), plan: () => game.openPlan(), setCam: (yaw, pitch) => { game.cam.yaw = yaw; if (pitch !== undefined) game.cam.pitch = pitch; game.cam.snap = true; } };
  let last = performance.now();
  function frame(now) { if (window.__pauseRaf) { setTimeout(() => requestAnimationFrame(frame), 250); return; }
    const dt = clamp((now - last) / 1000, 0.001, 0.05); last = now; trackFps(dt, now);
    // intro dialogue runs through the same talking path
    if (game.mode === 'intro') { if (isTalking() && (edge('act') || edge('jump'))) stepDialogue(); clearEdges(); }
    game.step(dt); render(dt); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot); else boot();
