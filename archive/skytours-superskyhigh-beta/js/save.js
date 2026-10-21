// localStorage save for Grok Snowie Sky Tours (its own key; never touches other games or the arcade)
const KEY = 'grokSkyTours.v1';
const DEF = () => ({ name: '', look: { skin: 1, hair: 0, hairC: 1, shirt: 1, pants: 0 }, made: false, tours: [], rescues: [], carry: null, rings: {}, stamps: [], badges: {}, crashes: 0, talks: {}, best: {}, played: {}, helped: [], paint: 0, wp: null, opts: { sound: true, music: true }, seenHow: false, stats: { plays: 0, flights: 0, km: 0, landings: 0, tows: 0, repairs: 0, earned: 0 }, coins: 150, rating: 4.5, plane: 'classic', owned: ['classic'], hp: {}, up: {}, ins: 0, view: 'chase' });
export let S = load();
function load() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') { const d = DEF(); const o = Object.assign(d, s); for (const k of ['look', 'rings', 'badges', 'talks', 'opts', 'stats', 'best', 'played', 'hp', 'up']) o[k] = Object.assign(DEF()[k], s[k] || {}); for (const k of ['tours', 'rescues', 'stamps', 'helped', 'owned']) if (!Array.isArray(o[k])) o[k] = []; if (!o.owned.includes('classic')) o.owned.unshift('classic');
      // patch migration: pilots from before the coin economy get a welcome-back purse for what they already did
      if (s.coins == null) o.coins = 150 + 30 * o.tours.length + 60 * o.rescues.length + 15 * o.stamps.length; if (!o.owned.includes(o.plane)) o.plane = 'classic'; return o; } } catch (e) {} return DEF(); }
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
export function resetSave() { const d = DEF(); for (const k in S) delete S[k]; Object.assign(S, d); persist(); return S; }
