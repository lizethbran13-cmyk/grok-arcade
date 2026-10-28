// Grok Pickleball Park - Drive Dillers Expansion (DLC #65, 75 tickets)
// Unlock key: grokDLC.pickleballpark.drive_dillers_expansion
export const DLC_KEY = 'grokDLC.pickleballpark.drive_dillers_expansion';
export const DLC_PRICE = 75;
const QS = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(''); } })();
export function dillersOwned() {
  try {
    if (QS.get('locked') === '1') return false;
    if (QS.get('dlc') === '1' || QS.get('preview') === '1') return true;
    if (/\/(previews|archive)\//.test(location.pathname)) return true;
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return true;
    if (localStorage.getItem(DLC_KEY)) return true;
    const l = JSON.parse(localStorage.getItem('grokDLC.owned') || '[]');
    return Array.isArray(l) && l.indexOf(DLC_KEY) >= 0;
  } catch (e) { return false; }
}
