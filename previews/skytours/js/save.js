// localStorage save for Grok Snowie Sky Tours (its own key; never touches other games or the arcade)
const KEY = 'grokSkyTours.v1';
const DEF = () => ({ name: '', look: { skin: 1, hair: 0, hairC: 1, shirt: 1, pants: 0 }, made: false, tours: [], rescues: [], carry: null, rings: {}, stamps: [], badges: {}, crashes: 0, talks: {}, paint: 0, wp: null, opts: { sound: true, music: true }, seenHow: false, stats: { plays: 0, flights: 0, km: 0, landings: 0, tows: 0 } });
export let S = load();
function load() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') { const d = DEF(); const o = Object.assign(d, s); for (const k of ['look', 'rings', 'badges', 'talks', 'opts', 'stats']) o[k] = Object.assign(DEF()[k], s[k] || {}); for (const k of ['tours', 'rescues', 'stamps']) if (!Array.isArray(o[k])) o[k] = []; return o; } } catch (e) {} return DEF(); }
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
export function resetSave() { const d = DEF(); for (const k in S) delete S[k]; Object.assign(S, d); persist(); return S; }
