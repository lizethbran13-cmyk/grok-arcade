// localStorage save for Grok Ruffsources HQ (its own key; never touches other games or the arcade)
const KEY = 'grokRuffsources.v1';
const DEF = () => ({ name: '', look: { skin: 1, hair: 0, hairC: 1, shirt: 0, pants: 0 }, made: false, bones: [], naps: [], clues: {}, mys: 0, hired: 0, interviewed: 0, cand: 0, best: { mail: 0, snack: 0, file: 0, gadget: 0, drop: 0, pour: 0 }, badges: {}, talks: {}, opts: { sound: true, music: true }, seenHow: false, stats: { plays: 0 } });
export let S = load();
function load() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') { const d = DEF(); const o = Object.assign(d, s); for (const k of ['look', 'clues', 'best', 'badges', 'talks', 'opts', 'stats']) o[k] = Object.assign(DEF()[k], s[k] || {}); for (const k of ['bones', 'naps']) if (!Array.isArray(o[k])) o[k] = []; return o; } } catch (e) {} return DEF(); }
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
export function resetSave() { const d = DEF(); for (const k in S) delete S[k]; Object.assign(S, d); persist(); return S; }
