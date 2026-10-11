// localStorage save (getItem/setItem only, so the Time Jumper preview shim can sandbox it)
const KEY = 'grokRelics.v1';
const DEF = () => ({ coins: 0, coinsEver: 0, name: '', hero: 'max', outfit: 'classic', done: {}, best: {}, relics: {}, treasures: {}, evidence: {}, up: {}, seenStory: false, seenHow: false, busted: 0, animals: {},
  opts: { sound: true, music: true, camSens: 1, invertX: false }, stats: { plays: 0 } });
export let S = load();
function load() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') { const d = DEF(); return Object.assign(d, s, { opts: Object.assign(d.opts, s.opts || {}), up: Object.assign({}, s.up || {}), done: s.done || {}, relics: s.relics || {}, treasures: s.treasures || {}, evidence: s.evidence || {}, animals: s.animals || {} }); } } catch (e) {} return DEF(); }
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
export function resetSave() { const d = DEF(); for (const k of Object.keys(S)) delete S[k]; Object.assign(S, d); persist(); return S; }
export const up = (id) => S.up[id] || 0;
