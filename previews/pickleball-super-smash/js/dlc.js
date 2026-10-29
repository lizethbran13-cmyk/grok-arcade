// Grok Pickleball Park - DLC Expansions:
// 1. Drive Dillers Expansion (DLC #65, 75 tickets) -> grokDLC.pickleballpark.drive_dillers_expansion
// 2. Super Smash Expansion (DLC #84, 75 tickets)   -> grokDLC.pickleballpark.super_smash_expansion
export const DLC_KEY = 'grokDLC.pickleballpark.drive_dillers_expansion';
export const DLC_PRICE = 75;
export const SMASH_DLC_KEY = 'grokDLC.pickleballpark.super_smash_expansion';
export const SMASH_DLC_PRICE = 75;

const QS = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(''); } })();

function checkKey(key) {
  try {
    if (QS.get('locked') === '1') return false;
    if (QS.get('dlc') === '1' || QS.get('preview') === '1') return true;
    if (/\/(previews|archive)\//.test(location.pathname)) return true;
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return true;
    if (localStorage.getItem(key)) return true;
    const l = JSON.parse(localStorage.getItem('grokDLC.owned') || '[]');
    return Array.isArray(l) && l.indexOf(key) >= 0;
  } catch (e) { return false; }
}

export function dillersOwned() {
  return checkKey(DLC_KEY);
}

export function smashOwned() {
  return checkKey(SMASH_DLC_KEY);
}
