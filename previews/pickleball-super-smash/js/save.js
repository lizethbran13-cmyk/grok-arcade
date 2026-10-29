// localStorage save for Grok Pickleball Park (its own key; never touches other games or the arcade)
const KEY = 'grokPickleballPark.v1';
const DEF = () => ({ name: '', look: { skin: 1, hair: 0, hairC: 1, shirt: 1, pants: 0 }, made: false, coins: 100, rating: 2.0, xp: 0, ladder: 10, beat: {},
  own: { paddle: ['starter'], ball: ['outdoor'], hat: ['none'], shoe: ['court'] }, eq: { paddle: 'starter', ball: 'outdoor', hat: 'none', shoe: 'court' },
  padCond: 100,
  tour: {}, tourRun: null,
  dillers: { wins: 0, run: null, ball: 'indoor', doubles: false, freebies: false },
  smash: { wins: 0, run: null, smasher: 'rita', oppSmasher: 'bo', doubles: false, freebies: false },
  drills: {}, badges: {}, talks: {}, snacks: 0, partner: 'kai',
  stats: { plays: 0, matches: 0, wins: 0, losses: 0, aces: 0, winners: 0, longest: 0, kitchenFaults: 0, smashes: 0, superSmashes: 0, repairs: 0 },
  opts: { sound: true, music: true, assist: true, fp: false, to: 11 }, seenHow: false, seenMatch: false });
export let S = load();
function load() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') { const d = DEF(); const o = Object.assign(d, s);
  for (const k of ['look', 'beat', 'own', 'eq', 'tour', 'dillers', 'smash', 'drills', 'badges', 'talks', 'stats', 'opts']) o[k] = Object.assign(DEF()[k], s[k] || {});
  for (const k of ['paddle', 'ball', 'hat', 'shoe']) if (!Array.isArray(o.own[k])) o.own[k] = DEF().own[k];
  if (typeof o.padCond !== 'number' || isNaN(o.padCond)) o.padCond = 100;
  return o; } } catch (e) {} return DEF(); }
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
export function resetSave() { const d = DEF(); for (const k in S) delete S[k]; Object.assign(S, d); persist(); return S; }
