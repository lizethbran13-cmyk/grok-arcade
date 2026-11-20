// localStorage save for Grok North Pole Village (its own key; never touches the HQ or arcade saves)
const KEY = 'grokNorthPole.v1';
const DEF = () => ({ name: '', rat: 'human', look: { skin: 1, hair: 0, hairC: 1, shirt: 0, pants: 0 }, made: false, outfit: 'none', hats: { none: 1 }, gears: [], secrets: [], q: { sun: 0 }, dials: [0, 0, 0], clues: {}, sus: {}, flags: {}, talks: {}, toys: [], plants: [], rats: {}, badges: {},
  best: { race: 0, farm: 0, polish: 0, catch: 0, bubbles: 0 }, opts: { sound: true, music: true, camSens: 1, invertX: false, tod: 'auto' }, seenHow: false, stats: { plays: 0 } });
export let S = load();
function load() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') { const d = DEF(); const o = Object.assign(d, s); o.rat = 'human'; for (const k of ['look', 'hats', 'q', 'clues', 'sus', 'flags', 'talks', 'rats', 'badges', 'best', 'opts']) o[k] = Object.assign(DEF()[k], s[k] || {}); for (const k of ['gears', 'secrets', 'toys', 'plants']) if (!Array.isArray(o[k])) o[k] = []; return o; } } catch (e) {} return DEF(); }
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
export function resetSave() { const d = DEF(); for (const k in S) delete S[k]; Object.assign(S, d); persist(); return S; }
export const up = () => 0;
