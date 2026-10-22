// DLC ownership for Grok Snowie Sky Tours (set by the Grok Arcade DLC Shop; previews and the archived beta are always unlocked)
export const DLC_KEY = 'grokDLC.skytours.super_sky_high_expansion';
export function skyOwned() { try { if (/\/(previews|archive)\//.test(location.pathname) || /[?&]dlc=1/.test(location.search)) return true; if (localStorage.getItem(DLC_KEY)) return true; const L = JSON.parse(localStorage.getItem('grokDLC.owned') || '[]'); return Array.isArray(L) && L.some((k) => k === DLC_KEY || k === 'skytours.super_sky_high_expansion'); } catch (e) { return false; } }
export const SKY_ON = skyOwned();
