// DLC #43 Merry Tracking Expansion + DLC #44 Merry Events Expansion (Grok North Pole Village). Pure data + date + unlock logic.
// Facts about the Regional Tracking Centers and the event schedule come from santaupdate.com (Regional Tracking Centers page,
// North Pole Events page, Annual Reindeer Games page, North Pole Halloween Party page). Everything else is original game writing.
const PI = Math.PI;
export const KEY_TRACK = 'grokDLC.northpole.merry_tracking_expansion';
export const KEY_EVENTS = 'grokDLC.northpole.merry_events_expansion';
const QS = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(''); } })();
export function owned(k) { try { if (QS.get('locked') === '1') return false;
    const pp = location.pathname; if (/\/previews\/np-merry-tracking/.test(pp)) return k === KEY_TRACK; if (/\/previews\/np-merry-events/.test(pp)) return k === KEY_EVENTS; if (/\/previews\//.test(pp)) return true; // Time Jumper test builds: that DLC is unlocked for testing
    if (localStorage.getItem(k)) return true; const l = JSON.parse(localStorage.getItem('grokDLC.owned') || '[]'); return Array.isArray(l) && l.indexOf(k) >= 0; } catch (e) { return false; } }
export const OWN_T = owned(KEY_TRACK), OWN_E = owned(KEY_EVENTS);
// ------------------------------------------------------------------ the real date in America/Los_Angeles (debug: ?npdate=YYYY-MM-DD)
export function today() { const q = QS.get('npdate'); if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return q;
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); } catch (e) { const d = new Date(); return d.toISOString().slice(0, 10); } }
export const TODAY = today(); export const YEAR = +TODAY.slice(0, 4); export const DATE_OVERRIDE = !!QS.get('npdate');
const dnum = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 864e5;
export const daysUntil = (s) => Math.round(dnum(s) - dnum(TODAY));
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const nice = (s) => `${MON[+s.slice(5, 7) - 1]} ${+s.slice(8, 10)}`;
// ================================================================== #43 Regional Tracking Centers
// "fully online" only on Christmas Eve and Christmas Day; otherwise they are preparing.
export const ONLINE = TODAY.slice(5) === '12-24' || TODAY.slice(5) === '12-25';
export const EVE = `${YEAR}-12-24`; export const EVE_DAYS = TODAY.slice(5) > '12-25' ? daysUntil(`${YEAR + 1}-12-24`) : daysUntil(EVE);
// [id, sector, place, country, serves, supervisor, site facts, look, pet cameo]
export const CENTERS = [
  { id: 'k1', sector: 1, place: 'Kiribati', country: 'Kiribati', serves: 'Australia, New Zealand, the South Pacific, Japan and Island Nations of the Sea', boss: 'Elf Randi Hume', bossId: 'randi',
    facts: ['Kiribati is a small, isolated and sparsely populated Pacific island.', 'This is the second time Kiribati has housed the Regional Tracking Center for Sector 1.', 'It has fantastic summer weather, great food and warm hospitality.', 'It is a strategic spot for serving the island nations of the sea.'],
    look: 'island', col: 0x0891b2, trim: 0xfde68a, pet: ['m_torty', 'Torty (Martina) · visiting', { t: { shell: 'torty', flower: true }, s: 0.27 }] },
  { id: 'k2', sector: 2, place: 'Taipei', country: 'Taiwan', serves: 'Asia and the Middle East', boss: 'Elf Clif Moyer', bossId: 'clif',
    facts: ['Taiwan is a high-tech choice for the geographically largest sector on the map.', 'It took many years to put this location together.', 'Sector 2 gets outstanding Internet connectivity here.', 'It gives great centralized tracking for the huge populations of China, India and South East Asia.', 'There is fantastic seafood and a growing base of tracker elves.'],
    look: 'tower', col: 0x4f46e5, trim: 0xe0e7ff, pet: ['m_luna', 'Luna (Ratita Industries CEO) · visiting', { rat: 'luna', hat: 'crown' }] },
  { id: 'k3', sector: 3, place: 'Sint-Niklaas', country: 'Belgium', serves: 'Europe and Africa', boss: 'Elf Rolf Jannsen', bossId: 'rolf',
    facts: ['Sint-Niklaas is named for Santa himself.', 'The Sector 3 center is back in Europe this year.', 'It is a very traditional location: snowy and filled with Christmas culture.', 'It is central to Europe, one of Santa\'s legendary haunts.', 'This sector squeezes into just a few time zones, so Santa\'s ride here goes by very fast.'],
    look: 'gable', col: 0xb91c1c, trim: 0xfef3c7, pet: ['m_snowie', 'Snowie (Head of Fun) · visiting', { rat: 'snowie', hat: 'flower', extras: ['bow'] }] },
  { id: 'k4', sector: 4, place: 'Belen', country: 'Costa Rica', serves: 'Greenland, the Atlantic and South America', boss: 'Elf Tubby Ryder', bossId: 'tubby',
    facts: ['The Costa Rica center is beach-side, a far cry from the frozen tundra of Greenland.', 'Sector 4 runs from the Antarctic in the south to the Arctic Circle in the north.', 'The center has to manage many different kinds of flight situations.', 'Santa is very popular in South America, and has many believers on the seas to deliver to.'],
    look: 'beach', col: 0x16a34a, trim: 0xfef9c3, pet: ['m_pirat', 'Pi-rat (Chief Inventor) · visiting', { rat: 'pirat', hat: 'pirate', extras: ['patch'] }] },
  { id: 'k5', sector: 5, place: 'Barra de Navidad', country: 'Mexico', serves: 'Central and North America', boss: 'Elf Pinky Yates', bossId: 'pinky',
    facts: ['For the first time in history, Mexico hosts the Regional Tracking Center for Sector 5.', 'Mexico wanted a Regional Tracking Center for decades.', 'It is perfectly central to all of North and Central America.', 'The warm December forecast is good for round-the-clock work.', 'Santa has to move faster here than in any other sector.', 'The center keeps in touch with North Pole Flight Command and the North Pole Navy on two oceans.'],
    look: 'fiesta', col: 0xea580c, trim: 0xfde68a, pet: ['m_candy', 'Candy (Mini Schnauzer) · visiting', { dog: 'schnauzer', s: 1.05 }] },
];
export const GENERAL = ['Every Regional Tracking Center is a local, smaller version of North Pole Flight Command.', 'Right after Christmas each year, the search begins for the next location of each center.', 'A center needs room for hundreds of elves, thousands of computers, big wall screens and lots of communications gear.', 'Tracker elves report through these centers, so the information is organized before it goes to Flight Command and Santa.'];
// geometry (world coords; fresh land south of Flight Command HQ, outside the district islands)
export const PORT = { id: 'sleighport', x0: 6, x1: 32, z0: -178, z1: -159, ceil: 7.0, name: '🛷 North Pole Sleigh Port' };
const CX = [-150, -124, -98, -72, -46];
CENTERS.forEach((c, i) => { c.x0 = CX[i]; c.x1 = CX[i] + 20; c.z0 = -178; c.z1 = -160; c.cx = CX[i] + 10; c.ceil = 6.0; c.rid = 'rtc' + c.sector; });
// ================================================================== #44 North Pole Event Center (santaupdate.com North Pole Events countdowns)
// Reindeer Games: countdown target Oct 13 (games "typically run about five days"). Halloween Party: Oct 31. Thanksgiving Day Elf Parade: Nov 26.
// Christmas Day party: from the DLC idea (Dec 25).
const EV0 = [
  { id: 'games', name: 'Annual Reindeer Games', icon: '🦌', start: '10-13', end: '10-17', where: 'the arena track', blurb: 'Speed races, flying obstacle courses, sleigh pulls, high jump contests and landing accuracy drills. Santa and Mrs. Claus attend as many events as they can.' },
  { id: 'halloween', name: 'North Pole Halloween Party', icon: '🎃', start: '10-31', end: '10-31', where: 'the Event Center', blurb: 'Home of the World\'s Craziest Costume Contest and the annual food fight. Music, dancing, food and candy for everyone.' },
  { id: 'parade', name: 'Thanksgiving Day Elf Parade', icon: '🎈', start: '11-26', end: '11-26', where: 'around the arena', blurb: 'Tracker elves march in the Elf Parade with floats and bands.' },
  { id: 'xmas', name: 'Christmas Day Party', icon: '🎄', start: '12-25', end: '12-25', where: 'the Event Center', blurb: 'Santa is home from the big night! Cocoa, carols and presents for every elf.' },
];
export const ONGOING = [['🎨 North Pole Art Contest', '09-15', '11-25', '"Making Christmas Merry". Show Santa how you see the North Pole getting ready.'], ['🧝 Visiting Elf sign-up', '08-13', '11-22', 'Sign up to get your Visiting Elf this year.']];
export const EVENTS = EV0.map((e) => ({ ...e, s: `${YEAR}-${e.start}`, e: `${YEAR}-${e.end}` }));
export function eventState() { const live = EVENTS.find((e) => TODAY >= e.s && TODAY <= e.e); const nxt = EVENTS.filter((e) => e.s > TODAY);
  const feat = live || nxt[0] || { ...EVENTS[0], s: `${YEAR + 1}-${EV0[0].start}`, e: `${YEAR + 1}-${EV0[0].end}`, tba: true };
  const after = EVENTS.filter((e) => e.s > feat.e); return { live: !!live, feat, day: live ? daysUntil(live.s) * -1 + 1 : 0, len: daysUntil(feat.e) - daysUntil(feat.s) + 1, inDays: daysUntil(feat.s), next: after, past: EVENTS.filter((e) => e.e < TODAY) }; }
export const EV = eventState();
export const EVC = { id: 'eventcenter', x0: 42, x1: 96, z0: -180, z1: -157, ceil: 9.0, name: '🎪 North Pole Event Center' };
export const TRACK = { cx: 69, cz: -170.5, rx: 17, rz: 5.2 };
export const DEER = ['Blitzen', 'Donner', 'The Mighty Mick', 'Comet', 'Maximus', 'Vixen', 'Dasher', 'Cupid', 'Dancer', 'Thor'];
// ================================================================== regions, doors, NPCs, talk
export const REG = [], DOORS = {}, NPCS = [], TALK = {}, AREAS = [], EXTRA = [], STOPS = [];
const elf = (id, n, at, region, mode) => ({ id, n, look: { t: { shell: 'olive' }, s: 0.3 }, at, region, ...(mode ? { mode } : {}) });
if (OWN_T) {
  REG.push({ ...PORT, y0: -1, y1: 10, tag: 'SLEIGH PORT' }); DOORS.sleighport = [19, -159];
  NPCS.push(elf('dispatch', 'Elf Dasha Runner (Sleigh Port Dispatcher)', [14, -163.5, 0], 'sleighport'), elf('porter', 'Elf Hitch (Sleigh Porter)', [27, -168, -PI / 2], 'sleighport', 'work'));
  TALK.dispatch = { hi: ['Welcome to the North Pole Sleigh Port, right next door to Flight Command HQ!', 'From here, sleighs fly you to the five Regional Tracking Centers, one in every delivery sector. Pick a sleigh pad and hop in!'],
    more: [ONLINE ? 'All five centers are FULLY ONLINE right now. Santa is in the air!' : `The centers are preparing. They go fully online on Christmas Eve and Christmas Day. ${EVE_DAYS} days to go!`, ...GENERAL, 'The departures board shows each center and its Elf Supervisor.'] };
  TALK.porter = { hi: ['Sleigh porter, at your service. Seat belts on, mittens in!'], more: ['Each sleigh knows the way. The reindeer have flown these routes in test flights all year.', 'Kiribati is the warm one. Sint-Niklaas is the snowy one. Pack for both!'] };
  STOPS.push([2, -152, PI / 2, '🛷 Sleigh Port (Regional Tracking Centers)']);
  AREAS.push({ x0: 4, x1: 34, z0: -180, z1: -157, name: '🛷 North Pole Sleigh Port', blk: 1, m: { x0: 6, z0: -178, x1: 32, z1: -159 } }); EXTRA.push([2, -186, 36, -152]);
  for (const c of CENTERS) { REG.push({ id: c.rid, x0: c.x0, x1: c.x1, z0: c.z0, z1: c.z1, y0: -1, y1: 9, ceil: c.ceil, name: `📡 Sector ${c.sector} Tracking Center · ${c.place}` }); DOORS[c.rid] = [c.cx, c.z1];
    AREAS.push({ x0: c.x0 - 2, x1: c.x1 + 2, z0: -182, z1: -156, name: `📡 ${c.place} (Sector ${c.sector})`, blk: 1, m: { x0: c.x0, z0: c.z0, x1: c.x1, z1: c.z1 } }); EXTRA.push([c.x0 - 3, -186, c.x1 + 3, -150]);
    NPCS.push(elf(c.bossId, `${c.boss} (Elf Supervisor, Sector ${c.sector})`, [c.cx + 3.5, -166, 0], c.rid));
    NPCS.push(elf(c.id + 'a', `Tracker Elf (${c.place})`, [c.x0 + 4, -171.5, PI], c.rid, 'work'), elf(c.id + 'b', `Tracker Elf (${c.place})`, [c.x1 - 4, -171.5, PI], c.rid, 'work'));
    NPCS.push({ id: c.pet[0], n: c.pet[1], look: c.pet[2], at: [c.cx - 1.5, -165.2, 0.3], region: c.rid });
    const lines = ONLINE ? [`We're FULLY ONLINE! Santa is flying, and every tracker elf in Sector ${c.sector} reports through this room.`, 'Grab a seat at the Live Tracking Desk and help us log Santa\'s sightings!'] : [`We're preparing for Christmas Eve. ${EVE_DAYS} days to go, and there's still a lot to set up!`, 'Want to help? The Setup Desk has today\'s checklist.'];
    TALK[c.bossId] = { hi: [`Hi, I'm ${c.boss}, Elf Supervisor of the Regional Tracking Center for Sector ${c.sector} in ${c.place}, ${c.country}.`, `We serve ${c.serves}.`, ...lines], more: [...c.facts, ...lines.slice(0, 1)] };
    TALK[c.id + 'a'] = TALK[c.id + 'b'] = { hi: [ONLINE ? 'Report coming in! Santa spotted over my sector!' : 'Testing, testing… link to Flight Command: GOOD.'], more: [ONLINE ? 'Every report goes to Flight Command, then to Santa.' : 'These screens light up for real on Christmas Eve.', c.facts[0]] };
    const pn = { m_torty: ['Torty', 'I came to test the new tracking screens. Shell-proof, tap-proof, coconut-proof!'], m_luna: ['Luna', 'Ratita Industries helped with the network here. So fast!'], m_snowie: ['Snowie', 'It\'s SNOWY and full of Christmas! Best center ever!'], m_pirat: ['Pi-rat', 'A beach-side tracking center! I brought my radar telescope. And sunscreen.'], m_candy: ['Candy', 'Woof! It\'s WARM here! The elves gave me a tiny sombrero!'] }[c.pet[0]];
    TALK[c.pet[0]] = { hi: [pn], more: [pn, [pn[0], c.facts[c.facts.length - 1]]] }; }
}
if (OWN_E) {
  REG.push({ ...EVC, y0: -1, y1: 12, tag: 'EVENT CENTER' }); DOORS.eventcenter = [42, -168];
  AREAS.push({ x0: 33, x1: 98, z0: -182, z1: -152, name: '🎪 North Pole Event Center', blk: 1, m: { x0: 42, z0: -180, x1: 96, z1: -157 } }); EXTRA.push([31, -186, 100, -148]);
  STOPS.push([37, -153, PI, '🎪 North Pole Event Center']);
  const f = EV.feat, L = EV.live;
  NPCS.push(elf('evboss', 'Elf Confetta Jr. (Event Center Host)', [62, -160.5, 0], 'eventcenter'), elf('victor', 'Elf Victor (Head Elf, Reindeer Operations)', [80, -161, 0], 'eventcenter'));
  const pets = [['m2_torty', 'Torty (cheering)', { t: { shell: 'torty', flower: true }, s: 0.27 }], ['m2_candy', 'Candy (cheering)', { dog: 'schnauzer', s: 1.05 }], ['m2_luna', 'Luna (cheering)', { rat: 'luna', hat: 'crown' }], ['m2_pirat', 'Pi-rat (cheering)', { rat: 'pirat', hat: 'pirate', extras: ['patch'] }], ['m2_snowie', 'Snowie (cheering)', { rat: 'snowie', hat: 'flower', extras: ['bow'] }]];
  pets.forEach(([id, n, look], i) => NPCS.push({ id, n, look, at: [52 + i * 3.4, -177.2, 0], y: 0.95, region: 'eventcenter' }));
  for (let i = 0; i < 6; i++) NPCS.push(elf('evfan' + i, 'Elf Fan', [74 + i * 2.6, -177.2, 0], 'eventcenter', 'work'));
  const st = L ? `TODAY: ${f.name}! ${f.id === 'games' ? `Day ${EV.day} of ${EV.len}.` : ''}` : f.tba ? `Next up: ${f.name}. Dates get posted on santaupdate.com.` : `Next up: ${f.name}, ${nice(f.s)}. ${EV.inDays} day${EV.inDays === 1 ? '' : 's'} to go, so we're preparing!`;
  TALK.evboss = { hi: ['Welcome to the North Pole Event Center! Every big North Pole event happens right here.', st, 'The events bulletin by the door shows what\'s on and what\'s next.'], more: [st, ...EVENTS.map((e) => `${e.icon} ${e.name}: ${nice(e.s)}${e.s !== e.e ? '–' + nice(e.e) : ''}.`)] };
  TALK.victor = { hi: ['Elf Victor, Head Elf of the Reindeer Operations Department. We run the Reindeer Games.', L && f.id === 'games' ? 'The games are ON! Step up to the starting line and race!' : 'The games give Santa a chance to see every reindeer and what they can do.'],
    more: ['The Reindeer Games can be held any time between Labor Day and Thanksgiving, so the reindeer can rest before Christmas Eve.', 'It takes thousands of reindeer in many roles to help Santa every Christmas.', 'The Mighty Mick trained for years just to compete. When he won, it changed his life.', 'The winner usually gets a choice assignment on Christmas Eve.'] };
  pets.forEach(([id]) => { const nm = id.slice(3); const P = { torty: 'Torty', candy: 'Candy', luna: 'Luna', pirat: 'Pi-rat', snowie: 'Snowie' }[nm]; TALK[id] = { hi: [[P, L ? `GO GO GO! This is the best ${f.name} ever!` : `I can't wait for the ${f.name}! I'm saving my seat.`]], more: [[P, nm === 'pirat' ? 'I bet three sugar cookies on Maximus.' : nm === 'candy' ? 'Woof! The reindeer smell like snow and carrots!' : 'These are the best seats in the North Pole.']] }; });
  for (let i = 0; i < 6; i++) TALK['evfan' + i] = { hi: [L ? 'Wooo! Go, go, GO!' : 'Saving seats for the big day!'], more: ['Elves bet sugar cookies on every event. I bet two on Blitzen.', 'The games are on North Pole TV, but nothing beats the grandstand.'] };
}
export const BADGES = { rtc5: '📡 Five-Sector Tracker', rtcon: '🛰️ Christmas Eve Tracker', games: '🦌 Reindeer Games Star', partyfun: '🎉 Event Center Regular' };
export const TASKS = (S) => [...(OWN_T ? [[CENTERS.every((c) => S.flags['mx_' + c.id]), `Help all 5 Regional Tracking Centers (${CENTERS.filter((c) => S.flags['mx_' + c.id]).length}/5)`]] : []),
  ...(OWN_E ? [[!!S.flags.mx_bulletin, 'Read the events bulletin (Event Center)'], [!!S.flags['mx_ev_' + EV.feat.id], EV.live ? `Join today's ${EV.feat.name}` : `Help prepare for the ${EV.feat.name}`]] : [])];
