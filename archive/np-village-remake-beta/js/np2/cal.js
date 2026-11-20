// Date-aware North Pole calendar (America/Los_Angeles; debug with ?npdate=YYYY-MM-DD).
// Event dates and the 5 Regional Tracking Centers come from merrydata.js (santaupdate.com).
// Santa's whereabouts: David said Santa is visiting Chile until Thanksgiving (Nov 26, 2026).
// santaupdate.com does not currently say he is in Chile (latest public notes are about Thanksgiving
// being his favourite holiday, the Elf Parade, and earlier travel in Canada), so the game follows David.
import { TODAY, YEAR, daysUntil, eventState, EVENTS as CAL_EVENTS, ONGOING, CENTERS, ONLINE, EVE_DAYS, nice, GENERAL } from '../merrydata.js?v=np11';
export { TODAY, YEAR, daysUntil, CAL_EVENTS, ONGOING, CENTERS, ONLINE, EVE_DAYS, nice, GENERAL };
export const EV = eventState();
export const THANKS = `${YEAR}-11-26`;
export const SANTA_AWAY = TODAY < THANKS;
export const THANKS_DAYS = daysUntil(THANKS);
export const RTC = [0, 4000]; // one Regional Tracking Center is streamed here at a time
export const RTC_AREA = { x0: RTC[0] - 200, x1: RTC[0] + 200, z0: RTC[1] - 200, z1: RTC[1] + 200, name: '📡 Regional Tracking Center' };
export function setRtcAreaName(s) { RTC_AREA.name = s; }
const md = () => TODAY.slice(5);
export function ongoingNow() { return ONGOING.filter(([, a, b]) => md() >= a && md() <= b); }
export function artOpen() { return md() >= '09-15' && md() <= '12-20'; }
export function paradeSoon() { return EV.feat && EV.feat.id === 'parade'; }
export function bannerText() {
  const parts = [];
  if (artOpen()) parts.push('ART CONTEST OPEN THROUGH DEC 20');
  if (EV.live) parts.push(EV.feat.name.toUpperCase() + ' TODAY');
  else if (EV.feat && EV.inDays >= 0 && EV.inDays <= 30) parts.push(EV.feat.name.toUpperCase() + ' · ' + nice(EV.feat.s).toUpperCase());
  const vis = ONGOING.find((r) => r[0].includes('Visiting') && md() >= r[1] && md() <= r[2]);
  if (vis) parts.push('VISITING ELF SIGN-UP OPEN');
  return parts.slice(0, 2).join('  ·  ') || 'NORTH POLE EVENTS';
}
export function santaWhere() { return SANTA_AWAY ? 'Chile (South America) · back Thanksgiving ' + nice(THANKS) : (ONLINE ? 'in flight on Christmas Eve!' : 'at the North Pole'); }
export function chileCenter() { return CENTERS.find((c) => c.sector === 4) || CENTERS[3]; }
export function eventBlurb() {
  const live = EV.live ? `${EV.feat.icon} TODAY: ${EV.feat.name}. ${EV.feat.blurb}` : '';
  const next = !EV.live && EV.feat ? `${EV.feat.icon} Coming ${nice(EV.feat.s)} (${EV.inDays} day${EV.inDays === 1 ? '' : 's'}): ${EV.feat.name}. ${EV.feat.blurb}` : '';
  const on = ongoingNow().map((r) => `${r[0]} — ${r[3]} (through ${nice(YEAR + '-' + r[2])}).`);
  const past = EV.past && EV.past.length ? 'Already happened: ' + EV.past.map((e) => e.name + ' (' + nice(e.s) + ')').join(', ') + '.' : '';
  return { live, next, on, past, feat: EV.feat, inDays: EV.inDays };
}
