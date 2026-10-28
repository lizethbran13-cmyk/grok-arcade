// Main entry & game loop for Grok Great Rodentia (#69, #70, #71, #72)
import * as THREE from 'three';
import { E, initEngine, setEnvironment, followShadow, render, trackFps } from './engine.js?v=gr2';
import { World } from './world.js?v=gr2';
import { ENV, buildRodentiaWorld } from './interiors.js?v=gr2';
import { BUILDINGS, buildingAt } from './bld.js?v=gr2';
import { RatHero } from './walker.js?v=gr2';
import { FollowCam } from './cam.js?v=gr2';
import { FX } from './fx.js?v=gr2';
import { initInput, edge, clearEdges } from './input.js?v=gr2';
import { sfx, initAudio, setSound, SND } from './audio.js?v=gr2';
import { S, load, save, resetSave, hasClue, addClue, isDistrictUnlocked, unlockDistrict } from './save.js?v=gr2';
import { LORE_INTRO, DISTRICTS, CLUES, TWIN_PROFILES } from './story.js?v=gr2';
import { makeRat, animRat, setOutfit, makeEnemy, animEnemy } from './models.js?v=gr2';
import { makePet, animPet } from './pets.js?v=gr2';
import { rbox } from './world.js?v=gr2';
import { MATS, initMats } from './mats.js?v=gr2';
const mat = (k, col) => new THREE.MeshBasicMaterial({ color: col, toneMapped: false });
function makeCheeseWedge() { const g = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 3, 1, false, 0, Math.PI * 2 / 3 * 1.5), new THREE.MeshStandardMaterial({ color: 0xffc400, emissive: 0x6b4a00, roughness: 0.4 })); return g; }
import { initShadowlight, useSurfaceSet, setSpots, updateShadowlight, SL } from './shadowlight/index.js?v=gr2';
import { $, clamp } from './util.js?v=gr2';
import {
  toast, isTalking, startDialogue, stepDialogue,
  updateHud, setPrompt, openConspiracyBoard, openDistrictModal, showEndingModal
} from './ui.js?v=gr2';

const _v = new THREE.Vector3(), _s = new THREE.Vector3(), _b = new THREE.Box3(), _r = new THREE.Ray();

// Clue world coordinates inside the 8 walk-in buildings
const CLUE_POS = {
  c01_calendar:           { x: -18.0, y: 1.05, z: -39.2, reg: 'in_grandma' },
  c02_parents_badge:      { x: -13.5, y: 1.05, z: -31.0, reg: 'in_grandma' },
  c03_torty_toxin:        { x: 13.0,  y: 1.10, z: -39.5, reg: 'in_bank' },
  c04_house_raid:         { x: 23.0,  y: 1.05, z: -38.8, reg: 'in_bank' },
  c05_marryweather:       { x: -13.0, y: 1.05, z: -9.2,  reg: 'in_dinner' },
  c06_civil_dogs:         { x: -23.0, y: 1.05, z: 3.2,   reg: 'in_dinner' },
  c07_ruffsources_tunnel: { x: 18.0,  y: 1.05, z: -8.8,  reg: 'in_ruff' },
  c08_unsecure_vault:     { x: -13.5, y: 1.05, z: 29.5,  reg: 'in_vault' },
  c09_parents_log:        { x: -20.2, y: 0.85, z: 29.5,  reg: 'in_vault' },
  c10_evilest_clones:     { x: 18.5,  y: 1.10, z: 32.5,  reg: 'in_clone' },
  c11_secret_charge:      { x: -13.0, y: 1.05, z: 50.5,  reg: 'in_prison' },
  c12_golden_gouda_truth: { x: 21.5,  y: 1.65, z: 53.5,  reg: 'in_capitol' },
};

// Building entry teleport positions (right inside each building facing the interior)
export const BUILDING_ENTRIES = {
  grandma: { x: -17.0, y: 0.1, z: -34.5, yaw: Math.PI },
  bank:    { x: 13.0,  y: 0.1, z: -34.0, yaw: Math.PI },
  dinner:  { x: -16.0, y: 0.1, z: -4.0,  yaw: Math.PI },
  ruff:    { x: 18.0,  y: 0.1, z: -2.5,  yaw: Math.PI / 2 },
  vault:   { x: -16.0, y: 0.1, z: 26.0,  yaw: Math.PI },
  clone:   { x: 18.5,  y: 0.1, z: 25.5,  yaw: Math.PI },
  prison:  { x: -16.0, y: 0.1, z: 54.0,  yaw: -1.1 },
  capitol: { x: 15.5,  y: 0.1, z: 56.0,  yaw: Math.PI / 2 },
};

export class RodentiaGame {
  constructor() {
    load();
    this.T = 0;
    this.paused = false;
    this.inB = null;
    this.curDistrict = 1;
    this.npcs = [];
    this.pets = [];
    this.bots = [];
    this.wedges = [];
    this.clueMeshes = [];
    this.gateBeams = {};
    this.acts = [];
    this.activeAct = null;

    const canvas = $('c');
    initEngine(canvas, 'high'); initMats();
    setEnvironment(ENV);
    initShadowlight();
    useSurfaceSet('street');
    SL.flashlight = true;

    this.scene = E.scene;
    this.world = new World();
    const { spots } = buildRodentiaWorld(this.world);
    this.world.finalize(this.scene);
    setSpots(spots, { flash: true });

    this.fx = new FX(this.scene);
    this.cam = new FollowCam(); this.cam.yaw = 0;
    this.me = new RatHero(this.scene, this.world); this.me.hp = 3;
    this.applyModeCharacter();
    this.me.place([0, 0.1, -33], 0);
    this.cam.snap = true;

    this.spawnGates();
    this.spawnCastAndClues();
    this.spawnStreetCollectiblesAndBots();
    this.syncGateVisuals();
    this.setVis(true);
    updateHud(this);
  }

  applyModeCharacter() {
    if (S.mode === 'evil') {
      const twinId = S.twin || 'evil_luna';
      this.me.setCharacter(twinId, 'evilvisor');
    } else {
      this.me.setCharacter('brie', 'detective');
    }
  }

  setMode(mode, twinId = null) {
    S.mode = mode === 'evil' ? 'evil' : 'good';
    if (twinId && TWIN_PROFILES[twinId]) S.twin = twinId;
    save();
    this.applyModeCharacter();
    this.me.hp = 3;
    updateHud(this);
    const label = S.mode === 'evil'
      ? `😈 Switched to ${TWIN_PROFILES[S.twin].name} (Non-Canon Evil Twin Mode)`
      : '🕵️‍♀️ Switched to Brie (Canon Good Detective Mode)';
    toast(label);
  }

  spawnGates() {
    // Laser barrier beams across the avenue at z = -15 (D2), z = 13 (D3), z = 41 (D4)
    const gateZ = { 2: -15, 3: 13, 4: 41 };
    for (const [dStr, gz] of Object.entries(gateZ)) {
      const d = Number(dStr);
      const grp = new THREE.Group();
      for (const y of [0.8, 1.6, 2.4]) {
        const beam = new THREE.Mesh(rbox(11.4, 0.1, 0.1, 0.02), mat('l', 0xff1e42, 0.85));
        beam.position.set(0, y, gz);
        grp.add(beam);
      }
      this.scene.add(grp);
      this.gateBeams[d] = grp;

      // Gate terminal interaction right in front of each checkpoint
      this.acts.push({
        x: -5.2, z: gz - 1.2, r: 3.2,
        label: `🔓 District ${d} Checkpoint Terminal`,
        f: () => {
          if (isDistrictUnlocked(d)) {
            toast(`✅ District ${d} Checkpoint is already open!`);
          } else {
            unlockDistrict(d);
            this.syncGateVisuals();
            sfx('win');
            toast(`🔓 District ${d} Laser Checkpoint Deactivated!`);
            updateHud(this);
          }
        },
      });
    }
  }

  syncGateVisuals() {
    this.me.districtGates = [[2, -15], [3, 13], [4, 41]].map(([d, z]) => ({ district: d, z, unlocked: isDistrictUnlocked(d) }));
    this.me.gateBlockedCb = (d) => toast(`🔒 District ${d} checkpoint locked — find more clues or use the checkpoint terminal`);
    for (const d of [2, 3, 4]) {
      if (this.gateBeams[d]) {
        this.gateBeams[d].visible = !isDistrictUnlocked(d);
      }
    }
  }

  checkDistrictUnlocks() {
    const n = (S.clues || []).length;
    if (n >= 2 && !isDistrictUnlocked(2)) {
      unlockDistrict(2);
      toast('🔓 District 2 (Dog Sub-City & RuffSources) Unlocked!');
    }
    if (n >= 5 && !isDistrictUnlocked(3)) {
      unlockDistrict(3);
      toast('🔓 District 3 (Unsecure Gov Vaults & Clone Lab) Unlocked!');
    }
    if (n >= 8 && !isDistrictUnlocked(4)) {
      unlockDistrict(4);
      toast('🔓 District 4 (National Ratita Prison & Capitol) Unlocked!');
    }
    this.syncGateVisuals();
  }

  addRatNpc(id, outfit, name, x, z, yaw, reg, linesGood, linesEvil, onTalk = null) {
    const rig = makeRat(id); if (rig.blaster) rig.blaster.visible = false; setOutfit(rig, outfit);
    rig.root.position.set(x, 0, z);
    rig.root.rotation.y = yaw;
    this.scene.add(rig.root);
    const npc = { id, name, rig, root: rig.root, x, z, yaw, region: reg, t: Math.random() * 10 };
    this.npcs.push(npc);
    this.acts.push({
      x, z, r: 2.7,
      label: `💬 Talk to ${name}`,
      f: () => {
        const lines = S.mode === 'evil' ? (linesEvil || linesGood) : linesGood;
        startDialogue(lines, onTalk);
      },
    });
    return npc;
  }

  addPetNpc(id, opts, name, x, z, yaw, reg, linesGood, linesEvil, onTalk = null) {
    const p = makePet(id, opts);
    p.x = x; p.y = 0; p.z = z; p.yaw = yaw; p.region = reg;
    p.root.position.set(x, 0, z);
    p.root.rotation.y = yaw;
    this.scene.add(p.root);
    this.pets.push(p);
    this.acts.push({
      x, z, r: 2.7, pet: p,
      label: `🐾 Talk to ${name}`,
      f: () => {
        const lines = S.mode === 'evil' ? (linesEvil || linesGood) : linesGood;
        startDialogue(lines, onTalk);
      },
    });
    return p;
  }

  spawnCastAndClues() {
    // --- PET CAMEOS: Luna, Pi-rat, Snowie, Candy & Torty are framed/captive at story start: real trio + Torty in prison, Candy at RuffSources; rally cameos appear only after the prison break ---
    const cameo = (id, opts, name, x, z, yaw, reg, line) => this.addPetNpc(id, opts, name, x, z, yaw, reg, [[name, line]], [[name, 'Hey! You only LOOK like us, clone. We know the real story.']]);
    { const r = cameo('luna', { outfit: 'goggles' }, 'Luna (Capitol rally)', -3.0, 51.5, Math.PI, 'out', 'The Capitol is right there. Expose the Evil Twins and the Golden Gouda truth!'); r.needFreed = true; }
    { const r = cameo('pirat', { outfit: 'pirate' }, 'Pi-rat (Capitol rally)', -1.2, 52.2, Math.PI, 'out', 'Prison break first, treasure second. Arr!'); r.needFreed = true; }
    { const r = cameo('snowie', { outfit: 'flower' }, 'Snowie (Capitol rally)', 1.2, 52.2, Math.PI, 'out', 'From up in the sky, the Capitol glows crimson. Something is wrong in there.'); r.needFreed = true; }
    { const r = cameo('candy', { s: 0.95 }, 'Candy (Capitol rally)', 3.0, 51.5, Math.PI, 'out', 'The Civil Task Force of Dogs has your back, Brie!'); r.needFreed = true; }
    cameo('luna', { outfit: 'goggles' }, 'Luna (Vat hologram)', 14.0, 22.0, 0, 'in_clone', 'Dr. Evilest scanned our memories into these three vats to grow the Evil Twins!');
    cameo('pirat', { outfit: 'pirate' }, 'Pi-rat (Vat hologram)', 18.5, 22.0, 0, 'in_clone', 'Yarr! That middle vat cooked up Dread Pi-rat—crimson visor and all!');
    cameo('snowie', { outfit: 'flower' }, 'Snowie (Vat hologram)', 23.0, 22.0, 0, 'in_clone', 'Smash the manifest terminal behind you so everyone knows we were cloned!');
    this.addRatNpc('bram', 'taskforce', 'Clone Lab Tech', 15.0, 30.5, 0.4, 'in_clone', [['Clone Lab Tech', 'I only work the night shift! Dr. Evilest keeps the real sisters in District 4 Prison!']]);
    for (const [id, out, nm, x, z] of [['bram', 'taskforce', 'Bank Teller', 11.0, -37.6], ['grandpa', 'taskforce', 'Vault Guard', 15.4, -40.2]]) this.addRatNpc(id, out, nm, x, z, 0, 'in_bank', [[nm, 'The vault was sealed the night the poison rumour started. Nobody had the code but Torty.']]);
    for (const [x, z, yaw] of [[-5.2, -22, 1.5], [5.4, 3, -1.5], [-5.0, 28, 1.5], [5.2, 60, -1.5]]) this.addRatNpc('grandpa', 'none', 'Rodentia Citizen', x, z, yaw, 'out', [['Rodentia Citizen', 'Psst... the crimson-visor sisters walked right past here last night.']]);
    // --- DISTRICT 1 CAST ---
    this.addRatNpc(
      'grandma', 'sunhat', 'Grandma Nana Gouda', -15.8, -37.2, 0.3, 'in_grandma',
      [
        ['Grandma Nana Gouda', 'Brie, darling! Look at my Year 000 1 Conspiracy Board on the wall! Every "0" is a century since the humans sailed to Australia—301 years ago!'],
        ['Grandma Nana Gouda', 'Your Mom & Dad vanished guarding the Gov Cheese Vaults, Torty\'s Emergency Cheese Bank across the street was seized on a fake poison charge, and Candy was ambushed at dinner under the name "Claudia Marry Weather"!'],
        ['Grandma Nana Gouda', 'Inspect the 2 clues here in my house, then cross the avenue to Torty\'s Seized Cheese Bank to talk to Grandpa Cheddar and Brother Bram!'],
      ],
      [
        ['Grandma Nana Gouda', 'Wait a second... those glowing crimson visors! You\'re not Luna, Pi-rat, or Snowie—you\'re Dr. Evilest\'s Shadowlight Clones!'],
        ['Evil Twin Sister', 'Clever old rat! Once Ratita Now➡️ locks down all 4 districts, your precious Conspiracy Board won\'t save the Golden Gouda!'],
      ]
    );

    this.addRatNpc(
      'grandpa', 'taskforce', 'Grandpa Commander Cheddar', 21.5, -36.5, 0, 'in_bank',
      [
        ['Grandpa Commander Cheddar', 'Report, Detective Brie! Brother Bram and I led the Gov Task Force raid on the sisters\' mansion, and we found zero Golden Gouda crumbs!'],
        ['Grandpa Commander Cheddar', 'Even stranger: in the lab next door, Torty\'s Emergency Cheese Bank tested 100% pure! Someone planted a poisoned decoy vial to shut down Tortuga Tech!'],
      ],
      [
        ['Grandpa Commander Cheddar', 'Halt! The USM Gov Task Force knows Ratita Now➡️ framed the real sisters!'],
        ['Evil Twin Sister', 'Too late, Commander! We\'re overriding your Task Force Outpost terminal right now!'],
      ],
      () => {
        if (S.mode === 'evil' && !S.sabotaged.bank) {
          S.sabotaged.bank = true; save();
          unlockDistrict(2); this.syncGateVisuals();
          toast('⚡ Evil Objective: Torty\'s Cheese Bank & Task Force Outpost Locked Down!');
          updateHud(this);
        }
      }
    );

    this.addRatNpc(
      'brother', 'goggles', 'Brother Bram (Junior Cadet)', 24.5, -36.5, -0.3, 'in_bank',
      [
        ['Brother Bram', 'Sis! I decoded the Ratita Now➡️ radio frequency! They ambushed Candy at the Golden Bone Dinner Hall in District 2 because she signed in as "Claudia Marry Weather"!'],
        ['Brother Bram', 'Grab the lab report and my Task Force Raid Dossier on the desk—that\'ll unlock the District 2 Checkpoint Gate!'],
      ],
      [
        ['Brother Bram', 'Hey! Stay back from our Task Force servers, you clone impostors!'],
      ]
    );

    // --- DISTRICT 2 CAST ---
    this.addPetNpc(
      'dog1', { breed: 'shepherd', s: 0.8 }, 'Officer Paws (Dog Civil Task Force)', -5.4, -3.5, Math.PI / 2, 'out',
      [
        ['Officer Paws', 'Thank goodness you\'re here, Brie! Ratita Now➡️ pushed us dogs into this lower Sub-City, and Candy built the Civil Task Force of Dogs at RuffSources to fight back!'],
        ['Officer Paws', 'Check the Golden Bone Dinner Hall on the west side—Candy tried to dine incognito as "Claudia Marry Weather", and the clerk turned her in!'],
      ],
      [
        ['Officer Paws', 'Grrr! Ratita Now➡️ clones! You won\'t keep Candy locked up in RuffSources forever!'],
      ]
    );

    this.addPetNpc(
      'dog2', { breed: 'corgi', s: 0.76 }, 'Barnaby (RuffSources HR)', 5.4, -3.5, -Math.PI / 2, 'out',
      [
        ['Barnaby', 'Woof! They seized RuffSources HQ right behind me and locked Candy in a laser cage in the east wing! Please override her cell, Brie!'],
      ],
      [
        ['Barnaby', 'Yikes! It\'s the Evil Twin Sisters! Don\'t touch our HR filing cabinets!'],
      ]
    );

    this.candyPet = this.addPetNpc(
      'candy', { s: 1.0 }, 'Candy (RuffSources CEO)', 23.5, -2.5, -Math.PI / 2, 'in_ruff',
      [
        ['Candy', 'Brie!! *tail wag* I knew Grandma Gouda\'s grandkid would find me! Okay, maybe "Claudia Marry Weather" wasn\'t my best disguise name at the Dinner Hall...'],
        ['Candy', 'While they held me here, I overheard the guards: they moved Tortuga Tech\'s emergency cheese to the Unsecure Gov Vaults in District 3—and your Mom & Dad are held there too!'],
      ],
      [
        ['Candy', 'Grrr! You Evil Twin clones may look like Luna, Pi-rat, and Snowie, but my nose never lies—you smell like Dr. Evilest\'s cloning vats!'],
        ['Evil Twin Sister', 'Stay in your laser cage, "Claudia Marry Weather"! RuffSources belongs to Ratita Now➡️!'],
      ],
      () => {
        if (S.mode === 'good' && !S.rescued.candy) {
          S.rescued.candy = true; save();
          unlockDistrict(3); this.syncGateVisuals();
          sfx('win');
          toast('🐾 Rescued Candy! Dog Civil Task Force joins Brie & District 3 Unlocked!');
          updateHud(this);
        } else if (S.mode === 'evil' && !S.sabotaged.ruff) {
          S.sabotaged.ruff = true; save();
          unlockDistrict(3); this.syncGateVisuals();
          sfx('win');
          toast('⚡ Evil Objective: RuffSources & Dog Sub-City Locked Down!');
          updateHud(this);
        }
      }
    );

    // --- DISTRICT 3 CAST ---
    this.addRatNpc(
      'mom', 'flower', 'Mom Camembert (Vault Guard)', -24.2, 29.5, 0.4, 'in_vault',
      [
        ['Mom Camembert', 'Brie, sweetheart! Look how brave you\'ve become! Your Dad and I caught the Evil Twin clones siphoning 3 billion pounds of cheese through the underground pipes!'],
        ['Mom Camembert', 'Across the street in District 3 is Dr. Evilest\'s hidden Clone Lab—inspect his blueprints so the whole United States of Mammalia sees the truth!'],
      ],
      [
        ['Mom Camembert', 'Our daughter Brie will expose your clone serial numbers, impostor!'],
      ],
      () => {
        if (S.mode === 'good' && !S.rescued.parents) {
          S.rescued.parents = true; save();
          unlockDistrict(4); this.syncGateVisuals();
          sfx('win');
          toast('🔓 Rescued Mom & Dad! District 4 (Prison & Capitol) Unlocked!');
          updateHud(this);
        } else if (S.mode === 'evil' && !S.sabotaged.vault) {
          S.sabotaged.vault = true; save();
          unlockDistrict(4); this.syncGateVisuals();
          sfx('win');
          toast('⚡ Evil Objective: Unsecure Gov Cheese Vaults Drained!');
          updateHud(this);
        }
      }
    );

    this.addRatNpc(
      'dad', 'guard', 'Dad Roquefort (Vault Guard)', -22.8, 29.5, -0.2, 'in_vault',
      [
        ['Dad Roquefort', 'That\'s my detective! The real Luna, Pi-rat, Snowie, and Torty are locked in the National Ratita Prison up north in District 4! Go free them before the Capitol falls!'],
      ],
      [
        ['Dad Roquefort', 'You\'ll never get away with framing the Ratita Sisters!'],
      ]
    );

    // --- DISTRICT 4 CAST (NATIONAL RATITA PRISON & USM CAPITOL) ---
    this.addRatNpc(
      'luna', 'goggles', 'Real Luna (Imprisoned Founder)', -23.8, 50.5, 0.5, 'in_prison',
      [
        ['Real Luna', 'Brie! You traced the whole conspiracy! Nobody in the public knew what we were charged with because Warrant #0001-GG was classified TOP SECRET!'],
        ['Real Luna', 'Dr. Evilest cloned us to steal the Golden Gouda Relic across the street in the USM Capitol—because sealed inside its wax is the USM Emergency Supreme Authority Key!'],
      ],
      [
        ['Real Luna', 'Look at yourself—Dr. Evilest programmed you clones to starve Great Rodentia, not rule it!'],
      ],
      () => {
        if (S.mode === 'good') {
          S.rescued.sisters = true;
          S.rescued.torty = true;
          save();
          sfx('win');
          toast('🔓 Freed Real Luna, Pi-rat, Snowie & Torty! Head to the USM Capitol Rotunda!');
          updateHud(this);
        } else {
          S.sabotaged.prison = true;
          save();
          toast('⚡ Evil Objective: National Ratita Prison Lockdown Reinforced!');
          updateHud(this);
        }
      }
    );

    this.addRatNpc(
      'pirat', 'pirate', 'Real Pi-rat (Imprisoned Founder)', -22.5, 50.5, 0.5, 'in_prison',
      [
        ['Real Pi-rat', 'Yarr! Those crimson-visor clones stole me pirate swagger AND framed Torty\'s cheese bank! Let\'s storm the USM Capitol Rotunda across the street!'],
      ],
      [
        ['Real Pi-rat', 'Yarr, there\'s only room for ONE real Pi-rat in Great Rodentia!'],
      ]
    );

    this.addRatNpc(
      'snowie', 'flower', 'Real Snowie (Imprisoned Founder)', -21.2, 50.5, 0.5, 'in_prison',
      [
        ['Real Snowie', 'Thank you, Brie! And look in Cell Block B right next to us—Torty (Martina) has been guarding the pure cheese sample this whole time!'],
      ],
      [
        ['Real Snowie', 'My Evil Twin even has frosty pink ears?! That\'s so rude!'],
      ]
    );

    this.addPetNpc(
      'torty', { s: 1.15 }, 'Torty / Martina (Tortuga Tech Founder)', -22.5, 62.0, 0.6, 'in_prison',
      [
        ['Torty (Martina)', 'Slow and steady wins the truth, Brie! Tortuga Isles produces pure emergency cheese for all Mammalia. Override the prison console and let\'s clear our names at the Capitol!'],
      ],
      [
        ['Torty (Martina)', 'Torty knows your poison lab report was forged, Evil Twin!'],
      ],
      () => {
        if (S.mode === 'good' && !S.rescued.torty) {
          S.rescued.torty = true; save();
          sfx('win');
          toast('🐢 Freed Torty (Martina)! Tortuga Tech stands with Brie!');
          updateHud(this);
        }
      }
    );

    // USM Capitol Rotunda Showdown Cast (Evil Twins + Final Golden Gouda Relic Trigger)
    this.addRatNpc(
      'evil_luna', 'evilvisor', 'Shadow Luna (Evil Twin Boss)', 18.2, 53.5, -Math.PI / 2, 'in_capitol',
      [
        ['Shadow Luna (Evil Twin)', 'So, little Brie made it all the way to the USM Capitol Rotunda! Too bad—with Torty\'s Cheese Bank paused and the Gov Vaults drained, Great Rodentia is on its knees!'],
        ['Brie', 'It\'s over, Shadow Luna! I have the spectral lab report, the "Claudia Marry Weather" ledger, Dr. Evilest\'s cloning blueprints, and the real Ratita Sisters right behind me!'],
      ],
      [
        ['Shadow Luna (Evil Twin)', 'Sisters! The Golden Gouda Relic is right in front of us! Let\'s crack the wax seal and claim the USM Emergency Supreme Authority Key!'],
      ],
      () => this.openCapitolShowdownChoice()
    );

    this.addRatNpc(
      'evil_pirat', 'evilvisor', 'Dread Pi-rat (Evil Twin Boss)', 18.2, 56.0, -Math.PI / 2, 'in_capitol',
      [
        ['Dread Pi-rat (Evil Twin)', 'Har har! Touch the Golden Gouda pedestal if ye dare, detective—either you expose us or end up in National Ratita Prison!'],
      ],
      [
        ['Dread Pi-rat (Evil Twin)', 'All 3 billion pounds of Mammalia\'s cheese belong to Ratita Now➡️!'],
      ],
      () => this.openCapitolShowdownChoice()
    );

    this.addRatNpc(
      'evil_snowie', 'evilvisor', 'Frostbite Snowie (Evil Twin Boss)', 18.2, 58.5, -Math.PI / 2, 'in_capitol',
      [
        ['Frostbite Snowie (Evil Twin)', 'Dr. Evilest made us faster, colder, and twice as ambitious! Ready for the final showdown, Brie?'],
      ],
      [
        ['Frostbite Snowie (Evil Twin)', 'Activate the Golden Gouda pedestal to complete our Evil Twin takeover!'],
      ],
      () => this.openCapitolShowdownChoice()
    );

    // Golden Gouda Relic Pedestal Interaction (x = 21.5, z = 56.0)
    this.acts.push({
      x: 21.5, z: 56.0, r: 3.4,
      label: '🧀 Golden Gouda Relic Pedestal (Final Showdown)',
      f: () => this.openCapitolShowdownChoice(),
    });

    // Spawn all 12 Clue Dossier Meshes + Interactions
    for (const c of CLUES) {
      const pos = CLUE_POS[c.id];
      if (!pos) continue;
      const g = new THREE.Group();
      const folder = new THREE.Mesh(rbox(0.52, 0.08, 0.38, 0.02), mat('l', 0xfacc15, 0.65));
      const seal = new THREE.Mesh(rbox(0.18, 0.1, 0.18, 0.02), mat('l', 0xff1e42, 0.85));
      seal.position.y = 0.04;
      g.add(folder, seal);
      g.position.set(pos.x, pos.y, pos.z);
      this.scene.add(g);
      this.clueMeshes.push({ id: c.id, mesh: g, baseY: pos.y, region: pos.reg });

      this.acts.push({
        x: pos.x, z: pos.z, r: 2.6,
        label: `🔎 Clue: ${c.title}`,
        f: () => {
          addClue(c.id);
          sfx('check');
          this.checkDistrictUnlocks();
          updateHud(this);
          startDialogue([
            [`📌 CLUE PINNED (${(S.clues || []).length}/${CLUES.length}): ${c.title}`, c.summary],
          ], () => {
            toast(`📌 Pinned to Conspiracy Board: ${c.title}`);
          });
        },
      });
    }
  }

  openCapitolShowdownChoice() {
    addClue('c12_golden_gouda_truth');
    updateHud(this);
    if (S.mode === 'good') {
      startDialogue(
        [
          ['USM Capitol Rotunda Showdown', 'The priceless Golden Gouda Relic gleams on the Capitol pedestal! Sealed inside its golden wax is the USM Emergency Supreme Authority Key!'],
          ['Brie', 'Shadow Luna, Dread Pi-rat, Frostbite Snowie—your Ratita Now➡️ conspiracy ends tonight in Year 000 1!'],
        ],
        null,
        [
          {
            t: '🏆 Expose Clones & Save Great Rodentia (Canon WIN)',
            f: () => showEndingModal('good_win', this),
          },
          {
            t: '🚨 Trigger Capitol Laser Trap (Test Captured/LOSE)',
            f: () => showEndingModal('good_lose', this),
          },
        ]
      );
    } else {
      const twin = TWIN_PROFILES[S.twin] || TWIN_PROFILES.evil_luna;
      startDialogue(
        [
          ['USM Capitol Rotunda Showdown (Non-Canon)', `${twin.name} steps up to the Golden Gouda Relic as Grandpa Cheddar's Task Force and Brie burst through the Capitol doors!`],
          [twin.name, 'The USM Emergency Supreme Authority Key is within our grasp! What happens next?'],
        ],
        null,
        [
          {
            t: '😈 Seize the Golden Gouda Key (Evil Twin WIN)',
            f: () => showEndingModal('evil_win', this),
          },
          {
            t: '⚖️ Brie & Task Force Expose Clones (Evil Twin LOSE)',
            f: () => showEndingModal('evil_lose', this),
          },
        ]
      );
    }
  }

  spawnStreetCollectiblesAndBots() {
    // 20 Golden Cheese Wedges along Grand Mammalia Avenue & inside buildings
    const pts = [
      [-3.5, -36], [3.5, -36], [-3.5, -26], [3.5, -26], [0, -19],
      [-3.5, -9],  [3.5, -9],  [-3.5, 1],   [3.5, 1],   [0, 8],
      [-3.5, 19],  [3.5, 19],  [-3.5, 29],  [3.5, 29],  [0, 36],
      [-3.5, 48],  [3.5, 48],  [-3.5, 58],  [3.5, 58],  [0, 64],
    ];
    pts.forEach(([x, z], i) => {
      const m = makeCheeseWedge();
      m.position.set(x, 0.55, z);
      this.scene.add(m);
      this.wedges.push({ id: i, x, z, mesh: m, got: false });
    });

    // 4 Patrol Bots on the avenues (1 per district)
    const botRoutes = [
      { x0: -3.2, x1: 3.2, z: -23.0 },
      { x0: -3.2, x1: 3.2, z: 4.5 },
      { x0: -3.2, x1: 3.2, z: 33.0 },
      { x0: -3.2, x1: 3.2, z: 61.0 },
    ];
    for (const br of botRoutes) {
      const bot = makeEnemy('bot');
      bot.root.position.set(br.x0, 0, br.z);
      this.scene.add(bot.root);
      this.bots.push({
        rig: bot, root: bot.root,
        x: br.x0, z: br.z, x0: br.x0, x1: br.x1,
        dir: 1, t: Math.random() * 6, stunned: 0,
      });
    }
  }

  teleport(x, y, z, yaw = 0) {
    this.me.place([x, y, z], yaw); this.cam.yaw = yaw + Math.PI;
    this.setVis(true);
    this.cam.snap = true;
    updateHud(this);
  }

  teleportToDistrict(dId) {
    const d = DISTRICTS.find((x) => x.id === Number(dId)) || DISTRICTS[0];
    unlockDistrict(d.id);
    this.syncGateVisuals();
    this.teleport(d.spawn[0], 0.1, d.spawn[1], 0);
    toast(`🚀 Arrived at ${d.name}`);
  }

  teleportToBuilding(bId) {
    const e = BUILDING_ENTRIES[bId];
    if (!e) return;
    unlockDistrict(2); unlockDistrict(3); unlockDistrict(4);
    this.syncGateVisuals();
    this.teleport(e.x, e.y, e.z, e.yaw);
  }

  setVis(force = false) {
    const me = this.me;
    const b = buildingAt(me.x, me.z);
    // Determine district from Z coordinate
    const dId = me.z < -15 ? 1 : me.z < 13 ? 2 : me.z < 41 ? 3 : 4;
    if (b !== this.inB || dId !== this.curDistrict || force) {
      this.inB = b;
      this.curDistrict = dId;
      if (!b) useSurfaceSet('street');
      else if (b.id === 'grandma' || b.id === 'dinner' || b.id === 'ruff') useSurfaceSet('home');
      else useSurfaceSet('lab');
      updateHud(this);
    }
    const RM = this.world.regionMeshes;
    for (const B of BUILDINGS) {
      const inIt = B === b;
      (RM['roof_' + B.id] || []).forEach((m) => { m.visible = !inIt; });
      const dist = Math.max(0, B.x0 - me.x, me.x - B.x1, B.z0 - me.z, me.z - B.z1);
      const show = inIt || dist < 34;
      (RM['in_' + B.id] || []).forEach((m) => { m.visible = show; });
    }
    for (const n of this.npcs) {
      n.root.visible = !n.region || n.region === 'out' || (RM[n.region] && RM[n.region][0] ? RM[n.region][0].visible : true);
    }
    for (const p of this.pets) {
      if (p.needFreed && !(S.rescued && S.rescued.sisters)) { p.root.visible = false; continue; }
      p.root.visible = !p.region || p.region === 'out' || (RM[p.region] && RM[p.region][0] ? RM[p.region][0].visible : true);
    }
    for (const cm of this.clueMeshes) {
      const regVis = !cm.region || (RM[cm.region] && RM[cm.region][0] ? RM[cm.region][0].visible : true);
      cm.mesh.visible = regVis;
    }
  }

  fades() {
    const b = this.inB, c = E.camera.position, me = this.me;
    _v.set(me.x, me.y + 1.2, me.z).sub(c);
    const L = _v.length();
    _r.set(c, _v.normalize());
    for (const B of BUILDINGS) {
      for (const f of B.fades) {
        let hide = false;
        if (B === b) {
          _b.copy(f.box).expandByScalar(0.08);
          const p = _r.intersectBox(_b, _s);
          hide = !!p && c.distanceTo(p) < L - 0.3;
        }
        if (f._h !== hide) {
          f._h = hide;
          f.meshes.forEach((m) => { m.visible = !hide; });
        }
      }
    }
  }

  step(dt) {
    this.T += dt;
    if (edge('pause')) {
      const m = $('boardModal');
      if (m && m.classList.contains('on')) m.classList.remove('on');
      else openConspiracyBoard(this);
    }
    if (isTalking()) {
      if (edge('act') || edge('jump')) stepDialogue();
      clearEdges();
      return;
    }

    const me = this.me;
    me.step(dt, this.world, this.cam.moveYaw, this.fx);
    this.setVis(false);
    const inside = !!this.inB;
    this.cam.update(dt, me, inside ? null : this.world, inside ? { dist: 6.8 } : { dist: 8.2 });
    if (inside) this.cam.pitch = Math.max(this.cam.pitch, 0.56);
    this.fades();

    // Animate NPC rats & pets
    for (const n of this.npcs) {
      if (!n.root.visible) continue;
      n.t += dt;
      animRat(n.rig, dt, { speed: 0 });
    }
    for (const p of this.pets) {
      if (!p.root.visible) continue;
      animPet(p, dt, me);
    }

    // Animate spinning Clue Dossiers
    for (const cm of this.clueMeshes) {
      if (!cm.mesh.visible) continue;
      cm.mesh.rotation.y = this.T * 1.8;
      cm.mesh.position.y = cm.baseY + Math.sin(this.T * 3 + cm.baseY) * 0.06;
    }

    // Collect Golden Cheese Wedges
    for (const w of this.wedges) {
      if (w.got) continue;
      w.mesh.rotation.y = this.T * 2.2 + w.id;
      if (Math.hypot(me.x - w.x, me.z - w.z) < 1.35) {
        w.got = true;
        w.mesh.visible = false;
        S.cheese = (S.cheese || 0) + 1;
        save();
        sfx('coin');
        this.fx.burst(w.x, 0.7, w.z, 0xfacc15, 10);
        updateHud(this);
      }
    }

    // Patrol Security Bots
    for (const b of this.bots) {
      b.t += dt;
      if (b.stunned > 0) {
        b.stunned -= dt;
        b.root.rotation.y += dt * 10;
        continue;
      }
      b.x += b.dir * 2.1 * dt;
      if (b.x > b.x1) { b.x = b.x1; b.dir = -1; }
      if (b.x < b.x0) { b.x = b.x0; b.dir = 1; }
      b.root.position.set(b.x, 0, b.z);
      b.root.rotation.y = b.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      animEnemy(b.rig, dt, 1);

      const d = Math.hypot(me.x - b.x, me.z - b.z);
      if (d < 1.75 && me.spinT > 0) {
        b.stunned = 4.0;
        sfx('boom');
        this.fx.burst(b.x, 0.8, b.z, 0x38bdf8, 16);
        toast('💥 Security Bot Stunned!');
      } else if (d < 1.15 && me.hurtT <= 0 && !inside) {
        { me.hp -= 1; me.hurtT = 1.4; this.fx.burst(me.x, me.y + 0.8, me.z, 0xff1e42, 12);
          sfx('hit');
          updateHud(this);
          if (me.hp <= 0) {
            me.hp = 3;
            updateHud(this);
            showEndingModal(S.mode === 'evil' ? 'evil_lose' : 'good_lose', this);
          }
        }
      }
    }

    // Find nearest interactive object/NPC
    let best = null, bestD = 1e9;
    for (const a of this.acts) {
      if (a.pet && !a.pet.root.visible) continue;
      const d = Math.hypot(me.x - a.x, me.z - a.z);
      if (d < a.r && d < bestD) {
        bestD = d;
        best = a;
      }
    }
    this.activeAct = best;
    setPrompt(best);
    if (best && edge('act')) {
      best.f();
    }

    this.fx.update(dt);
    followShadow(me.x, me.y, me.z);
    updateShadowlight(dt, me, E.camera, { hurt: me.hurtT > 0.5 ? 0.5 : 0 });
  }
}

// Boot & wire UI controls
let game = null;
function boot() {
  initInput(); const unlock = () => initAudio(); window.addEventListener('mousedown', unlock); window.addEventListener('keydown', unlock); window.addEventListener('touchstart', unlock, { passive: true });
  game = new RodentiaGame();

  // Wire top-bar & modal buttons
  $('btnBoard').onclick = () => { sfx('click'); openConspiracyBoard(game); };
  $('btnMap').onclick = () => { sfx('click'); openDistrictModal(game); };
  $('btnMode').onclick = () => {
    sfx('win');
    game.setMode(S.mode === 'evil' ? 'good' : 'evil');
  };
  $('btnFlash').onclick = () => {
    SL.flashlight = !SL.flashlight;
    sfx('click');
    toast(SL.flashlight ? '🔦 Shadowlight Flashlight ON' : '🔦 Shadowlight Flashlight OFF');
  };
  $('btnMute').onclick = () => {
    const on = !SND.on; setSound(on, on);
    $('btnMute').textContent = on ? '🔊' : '🔇';
  };
  $('actBtn').onclick = () => {
    if (isTalking()) stepDialogue();
    else if (game.activeAct) game.activeAct.f();
  };
  $('dlgNextBtn').onclick = () => stepDialogue();
  $('dlgBox').onclick = () => stepDialogue();

  // Twin switcher buttons (Evil Luna / Evil Pi-rat / Evil Snowie)
  document.querySelectorAll('[data-twin]').forEach((btn) => {
    btn.onclick = () => {
      sfx('click');
      game.setMode('evil', btn.dataset.twin);
    };
  });

  // Close buttons on modals
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.onclick = () => {
      sfx('click');
      $(btn.dataset.close).classList.remove('on');
    };
  });

  // Ending modal buttons
  $('btnEndRetry').onclick = () => {
    $('endingModal').classList.remove('on');
    game.me.hp = 3;
    game.teleportToDistrict(game.curDistrict);
  };
  $('btnEndSwitch').onclick = () => {
    $('endingModal').classList.remove('on');
    game.setMode(S.mode === 'evil' ? 'good' : 'evil');
  };

  // Expose deterministic automation & verification API on window.__rodentia
  window.__rodentia = {
    game,
    S,
    CLUES,
    DISTRICTS,
    BUILDING_ENTRIES,
    teleport: (x, y, z, yaw = 0) => game.teleport(x, y, z, yaw),
    toDistrict: (d) => game.teleportToDistrict(d),
    toBuilding: (id) => game.teleportToBuilding(id),
    setMode: (m, twin) => game.setMode(m, twin),
    collectAllClues: () => {
      for (const c of CLUES) addClue(c.id);
      game.checkDistrictUnlocks();
      updateHud(game);
    },
    triggerEnding: (key) => showEndingModal(key, game),
    closeModals: () => {
      document.querySelectorAll('.modal.on, #dlgBox.on').forEach((el) => el.classList.remove('on'));
    },
    getState: () => ({
      mode: S.mode,
      twin: S.twin,
      district: game.curDistrict,
      building: game.inB ? game.inB.id : null,
      pos: [Number(game.me.x.toFixed(2)), Number(game.me.y.toFixed(2)), Number(game.me.z.toFixed(2))],
      clues: (S.clues || []).length,
      cheese: S.cheese || 0,
      hp: game.me.hp,
    }),
  };

  const pick = (mode) => { $('titleScreen').classList.add('off'); sfx('win'); game.setMode(mode); };
  $('pickGood').onclick = () => pick('good');
  $('pickEvil').onclick = () => pick('evil');
  window.__rodentia.start = pick;
  window.__rodentia.showTitle = () => $('titleScreen').classList.remove('off');
  window.GR_TEST = window.PT_TEST = window.__rodentia;

  // Start render loop
  let last = performance.now();
  function frame(now) { if (window.__pauseRaf) { setTimeout(() => requestAnimationFrame(frame), 250); return; }
    const dt = clamp((now - last) / 1000, 0.001, 0.05);
    last = now;
    trackFps(dt, now);
    game.step(dt);
    render(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", boot); else boot();
