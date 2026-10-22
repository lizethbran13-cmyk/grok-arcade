// localStorage save
const KEY = 'grokRatita.v1';
const DEF = () => ({ cheese: 0, name: '', rat: 'luna', outfit: 'none', done: {}, best: {}, babies: {}, parts: {}, up: {}, opts: { quality: 'high', autoQ: true, sound: true, music: true, camSens: 1, invertX: false }, seenHow: false, stats: { plays: 0 } });
export let S = load();
function load() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') { const d = DEF(); return Object.assign(d, s, { opts: Object.assign(d.opts, s.opts || {}), up: Object.assign({}, s.up || {}), done: s.done || {}, babies: s.babies || {}, parts: s.parts || {} }); } } catch (e) {} return DEF(); }
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
export function resetSave() { S = DEF(); persist(); return S; }
export const countParts = () => Object.values(S.parts).reduce((a, l) => a + (l ? l.length : 0), 0);
export const countBabies = () => Object.values(S.babies).reduce((a, l) => a + (l ? l.length : 0), 0);
export const up = (id) => S.up[id] || 0;
