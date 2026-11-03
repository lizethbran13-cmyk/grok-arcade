// Persistent save state for Grok Great Rodentia (Year 000 1).
const KEY = 'grok_great_rodentia_v1';

export const DEF = () => ({
  mode: 'good',             // 'good' (Brie) | 'evil' (Evil Twin Sisters: non-canon)
  twin: 'evil_luna',        // active Evil Twin in 'evil' mode: 'evil_luna' | 'evil_pirat' | 'evil_snowie'
  district: 1,              // current district (1..4)
  unlockedDistricts: [1],   // Good mode unlocked districts
  evilDistricts: [1],       // Evil mode unlocked districts
  rations: 120,             // Emergency Cheese Rations / USM Credits (used for bail, gadget repairs, bribes)
  hearts: 5,
  maxHearts: 5,
  clues: [],                // discovered clue IDs (12 clues across 4 districts)
  wedges: [],               // collected Golden Gouda Wedges (15 across 4 districts)
  flyers: [],               // collected/torn Evil Twin Flyers (8 across 4 districts)
  upgrades: { boots: false, scanner: false, cloak: false, pass: false },
  goodMissions: {
    d1_conspiracy: false,   // Decoded Grandma's Rat Conspiracy Board & parents' badge
    d1_bank_scan: false,    // Scanned Torty's Emergency Cheese Bank sample (proved Evil Twins spiked it)
    d2_marryweather: false, // Found rejected 'Claudia Marry Weather' alias complaint at Dinner Hall
    d2_rescue_candy: false, // Freed Candy & Civil Task Force of Dogs at Seized RuffSources HQ
    d3_rescue_parents: false,// Freed Brie's Mom & Dad from Unsecure Gov Cheese Vaults
    d3_clone_vats: false,   // Hacked Dr. Evilest's Clone Lab manifest in Ratita Now➡️ Underground
    d4_free_gang: false,    // Freed real Luna, Pi-rat, Snowie & Torty from National Ratita Prison
    d4_golden_gouda: false, // Solved the Golden Gouda Relic Vault mystery & defeated the Evil Twins
  },
  evilMissions: {
    e1_spike_bank: false,   // Framed Torty's Emergency Cheese Bank under a fake alias
    e1_raid_outpost: false, // Sabotaged Grandpa & Brother's Task Force scanner in District 1
    e2_ambush_dinner: false,// Filed fake complaint & seized RuffSources HQ for Ratita Now➡️
    e3_drain_vaults: false, // Drained the Unsecure Government Cheese Vaults (300,000 lbs)
    e3_boost_clones: false, // Overclocked Dr. Evilest's Shadowlight Clone Vats
    e4_lock_prison: false,  // Locked down National Ratita Prison security grid
    e4_claim_gouda: false,  // Seized the Golden Gouda Relics & forced USM to surrender (Non-Canon Win!)
  },
  timesCaptured: 0,
  goodWon: false,
  evilWon: false,
  outfit: 'detective',
  flashlightOn: true,
  cheese: 0,
  rescued: {},
  sabotaged: {},
});

export let S = load();

export function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    const d = DEF();
    if (!raw) return d;
    return {
      ...d,
      ...raw,
      goodMissions: { ...d.goodMissions, ...(raw.goodMissions || {}) },
      evilMissions: { ...d.evilMissions, ...(raw.evilMissions || {}) },
      unlockedDistricts: Array.isArray(raw.unlockedDistricts) && raw.unlockedDistricts.length ? raw.unlockedDistricts : [1],
      evilDistricts: Array.isArray(raw.evilDistricts) && raw.evilDistricts.length ? raw.evilDistricts : [1],
      clues: Array.isArray(raw.clues) ? raw.clues : [],
      wedges: Array.isArray(raw.wedges) ? raw.wedges : [],
      flyers: Array.isArray(raw.flyers) ? raw.flyers : [],
      upgrades: { ...d.upgrades, ...(raw.upgrades || {}) },
      rescued: raw.rescued || {},
      sabotaged: raw.sabotaged || {},
    };
  } catch (e) {
    return DEF();
  }
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
}

export function resetSave() {
  S = DEF();
  save();
  return S;
}

export function hasClue(id) {
  return S.clues.includes(id);
}

export function addClue(id) {
  if (!S.clues.includes(id)) {
    S.clues.push(id);
    S.rations += 25;
    save();
    return true;
  }
  return false;
}

export function isDistrictUnlocked(d) {
  const arr = S.mode === 'good' ? S.unlockedDistricts : S.evilDistricts;
  return arr.includes(d);
}

export function unlockDistrict(d) {
  const arr = S.mode === 'good' ? S.unlockedDistricts : S.evilDistricts;
  if (!arr.includes(d)) {
    arr.push(d);
    save();
    return true;
  }
  return false;
}

export function addWedge(id) {
  if (!S.wedges.includes(id)) { S.wedges.push(id); S.rations += 15; save(); return true; }
  return false;
}
export function addFlyer(id) {
  if (!S.flyers.includes(id)) { S.flyers.push(id); S.rations += 20; save(); return true; }
  return false;
}
