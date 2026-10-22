// Grok Dr. Vic save (localStorage 'grokDrVic.v1', a grok* key so Bob's Live Sync carries it across devices).
const KEY = 'grokDrVic.v1';
const DEF = () => ({ v: 1, zone: 'home', followers: 37, battery: 100, clues: {}, filmed: {}, items: {}, flags: {}, talks: {}, posts: [], won: false, seenIntro: false,
  stats: { snaps: 0, blurry: 0, spooks: 0, slips: 0, plays: 0 }, opts: { sound: true, music: true } });
export let S = load();
function load() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') { const d = DEF(), o = Object.assign(d, s); for (const k of ['clues', 'filmed', 'items', 'flags', 'talks', 'stats', 'opts']) o[k] = Object.assign(DEF()[k], s[k] || {}); if (!Array.isArray(o.posts)) o.posts = []; return o; } } catch (e) {} return DEF(); }
export function persist() { try { S.t = Date.now(); localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
export function resetSave() { const d = DEF(); for (const k in S) delete S[k]; Object.assign(S, d); persist(); return S; }
