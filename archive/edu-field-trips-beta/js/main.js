// Education Center DLC: FIELD TRIPS (paid DLC, Turbo engine). Hub = Field Trip Depot outside Lilith's Education Center.
// Lilith the Bot can't move, so she rides along on Pi-rat's tablet backpack and joins every trip by tablet; you are her Class Helper.
// Locked until bought in the Grok Arcade DLC Machine 3000 (localStorage 'grokDLC.edu.field_trips', same origin as the arcade).
import * as THREE from 'three';
import { E, initEngine, setEnvironment, followShadow, render, trackFps } from './engine.js';
import { IN, initInput, readMove, edge } from './input.js';
import { FollowCam } from './cam.js';
import { collide, ray, PI } from './kit.js';
import { initMats } from './mats.js';
import { makePet, animPet } from './pets.js';
import { initAudio, sfx, setSound, SND } from './audio.js';
import { $, clamp, toast, esc, rng } from './util.js';
import { buildZone, disposeZone, drawBoard } from './zones.js';
import { TRIPS, tripById } from './lessons.js';
import { makeTabletPack, drawLilith } from './lilith.js';
import { runQuiz } from './minigame.js';

const QS = new URLSearchParams(location.search);
export const DLC_KEY = 'grokDLC.edu.field_trips', ARCADE = 'https://lizethbran13-cmyk.github.io/grok-arcade/';
const owned = () => { if (QS.get('locked') === '1') return false; try { return !!localStorage.getItem(DLC_KEY); } catch (e) { return false; } };
const canvas = $('c'); initEngine(canvas, QS.get('q') === 'low' ? 'low' : 'high'); initInput(); initMats();
const DTMAX = Math.min(0.15, +QS.get('dtmax') || 0.05);
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || (window.matchMedia && matchMedia('(pointer: coarse)').matches); if (isTouch) document.body.classList.add('touch');
const scene = E.scene; const world = { ray: (o, d, m, f) => ray(o, d, m, f) }; const R = rng(Date.now() % 99991);

// ---------------- save ----------------
const KEY = 'grokEduTrips.v1';
const fresh = () => ({ coins: 30, battery: 100, done: {}, seen: {}, best: {}, runs: {}, last: {}, souv: [], custom: [], tut: 0 });
function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); return s && s.done ? Object.assign(fresh(), s) : null; } catch (e) { return null; } }
let S = fresh(); const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
// mirror trip lessons + submissions into Lilith's classroom Lesson Save Vault in the arcade (grokArcade.edu, same origin)
function mirrorVault(entry) { try { const K = 'grokArcade.edu'; const ST = JSON.parse(localStorage.getItem(K)) || { integrity: 100, reds: 0, points: 0, vault: [], custom: [] }; ST.vault = ST.vault || []; ST.custom = ST.custom || [];
  const i = ST.custom.findIndex((c) => c.id === entry.id); if (i >= 0) ST.custom[i] = entry; else ST.custom.push(entry);
  let v = ST.vault.find((x) => x.id === entry.id); if (!v) { v = { id: entry.id, best: 0, runs: 0, url: entry.url || '' }; ST.vault.push(v); } if (entry._best != null) { v.best = Math.max(v.best, entry._best); v.runs = entry._runs; } delete entry._best; delete entry._runs;
  localStorage.setItem(K, JSON.stringify(ST)); } catch (e) {} }
function tripVaultEntry(t) { return { id: 'trip-' + t.id, icon: t.icon, name: 'Field Trip: ' + t.name, url: '', slidesUrl: '', slides: t.slides.concat(t.stops.map((s) => [s[0], s[1]])).slice(0, 8), facts: t.stops.map((s, i) => [s[1], t.quiz[i % t.quiz.length][0], t.quiz[i % t.quiz.length][1], 0]), quiz: t.quiz.map(([q, a]) => [q, a, 0]), _best: S.best[t.id] || 0, _runs: S.runs[t.id] || 0 }; }

// ---------------- cast ----------------
const me = makePet('pirat', { s: 1.4 }); scene.add(me.root); const pack = makeTabletPack(); pack.root.scale.setScalar(1.2); pack.root.position.y = 0.05; me.root.add(pack.root);
const P = { x: 0, z: 4, y: 0, vy: 0, yaw: PI, speed: 0, mode: 'title' };
const cam = new FollowCam(); cam.want = 6.2; cam.hgt = 1.4;
const students = ['blue', 'rose', 'cream', 'ginger'].map((id, i) => { const p = makePet(id, { s: 0.95, extras: [['bow'], ['clip'], ['glasses'], []][i] }); scene.add(p.root); p.x = 0; p.z = 6 + i; return p; });
const zoneG = new THREE.Group(), npcG = new THREE.Group(); scene.add(zoneG, npcG);
let Z = null, zone = 'hub', npcs = [], guide = null, folk = [];
const TRIP = () => tripById(zone);

// ---------------- zones ----------------
const ZS = { trips: TRIPS, done: {} };
function placeNPCs() { npcs.forEach((p) => p.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); })); while (npcG.children.length) npcG.remove(npcG.children[0]); npcs = []; folk = []; guide = null;
  const add = (id, x, z, yaw, o = {}) => { const p = makePet(id, o); p.x = x; p.z = z; p.yaw = yaw; npcG.add(p.root); npcs.push(p); return p; };
  if (!Z.noBusMonitor) add('candy', ZS.busDoor.x + 1.6, ZS.busDoor.z + (zone === 'desert' || zone === 'farm' ? -0.5 : 0.6), PI * 0.8, { s: 2.1 }); // Candy, bus monitor (bigger than the rats)
  if (zone === 'hub') { add('luna', -6.8, 4.6, PI * 0.9, { s: 1.3, extras: ['glasses'] }); add('snowie', -0.8, 4.8, PI * 1.1, { s: 1.25 }); add('torty', 9.5, -1.5, -PI / 2, { s: 1.7 }); }
  if (Z.guide) { const gd = Z.guide; guide = add(gd.id, gd.x, gd.z, gd.yaw, gd.id === 'torty' ? { s: 1.7 } : gd.id === 'candy' ? { s: 2.1 } : gd.id === 'luna' ? { s: 1.35, extras: ['glasses', 'coat'] } : gd.id === 'snowie' && zone === 'airport' ? { s: 1.3, extras: ['headset', 'tie'] } : { s: 1.3 }); }
  for (const [id, x, z, yaw, ex] of (Z.extra || [])) add(id, x, z, yaw, id === 'torty' ? { s: 1.7 } : { s: 1.25, extras: ex || (zone === 'lab' ? ['headset', 'coat'] : []) });
  for (const [breed, x, z, yaw] of (Z.dogs || [])) add('dog', x, z, yaw, { breed, s: 0.95, seed: (x * 7 + z) | 0 }); // Pup Town community helpers
  const FOLK = { lab: ['ash', 'brownie', 'black'], desert: ['brownie', 'cocoa', 'gold'], airport: ['brie', 'dad', 'gold', 'grandpa'], farm: ['cocoa', 'grandma', 'brownie'] }; const kinds = FOLK[zone] || ['brie', 'grandma', 'dad', 'mom'];
  const ex = { lab: ['coat', 'glasses'], airport: ['tie'] }[zone] || [];
  for (let i = 0; i < (zone === 'hub' ? 6 : 4); i++) { const an = Z.anchors[i % Z.anchors.length]; const fx = an[0] + (R() - 0.5) * an[2], fz = an[1] + (R() - 0.5) * an[2]; const p = Z.folkDogs ? add('dog', fx, fz, R() * 6, { breed: Z.folkDogs[i % Z.folkDogs.length], s: 0.85, seed: i + 3 }) : add(kinds[i % kinds.length], fx, fz, R() * 6, { s: 1.2, extras: i % 2 ? ex : [] }); p.ax = an[0]; p.az = an[1]; p.ar = an[2]; p.wx = p.x; p.wz = p.z; folk.push(p); } }
function go(id, txt) { const f = $('fade'); $('fadeTxt').textContent = txt || ''; f.classList.add('on'); P.mode = 'travel';
  setTimeout(() => { disposeZone(zoneG); zone = id; ZS.trip = tripById(id) || null; ZS.done = S.done; Z = buildZone(id, zoneG, ZS); setEnvironment(Z.env); placeNPCs(); cam.want = Z.indoor ? 4.2 : 6.2;
    P.x = Z.spawn.x; P.z = Z.spawn.z; P.yaw = Z.spawn.yaw; P.y = 0; cam.yaw = Z.spawn.yaw + PI; cam.pitch = 0.32; cam.snap = true; students.forEach((s, i) => { s.x = P.x + 0.6 * (i % 2 ? 1 : -1); s.z = P.z + 1.2 + i * 0.9; });
    syncRings(); syncSouvenirs(); setTimeout(() => { f.classList.remove('on'); P.mode = 'walk'; arrive(); }, 250); }, 480); }
function arrive() { const t = TRIP(); if (!t) { lil(S.tut ? 'Back at the Depot! Pick another trip on the board. Homeschool is for winners! 🏆' : 'Hi, Class Helper! I\'m Lilith. I can\'t move, so I ride in your backpack tablet. Pick a trip on the big board!', 6); return; }
  talk(t.guideName, t.hello, 6); lil(`We're at ${t.where}! Find the glowing ${t.stopWord || 'stops'}, then talk to ${t.guideName.split(' ')[0]} for the lesson. 📱 Lily says hi!`, 7); }
function syncRings() { if (!Z) return; const seen = S.seen[zone] || []; for (const s of Z.stops) s.ring.visible = !seen[s.i]; }
const SOUV = { desert: [['cactus', '🌵', 'Cactus Plush', 10, 0x3f7d3a], ['shell', '🐢', 'Torty Shell Keychain', 12, 0x8a6a3b]], lab: [['rocket', '🚀', 'Mini Rocket', 10, 0xdc2626], ['goggles', '🥽', 'Kid Lab Goggles', 12, 0x38bdf8]],
  airport: [['globe', '🌐', 'Mini Globe', 10, 0x2563eb], ['wings', '🛩️', 'Ratita Airways Pilot Wings', 12, 0xfacc15]], farm: [['pumpkin', '🎃', 'Pocket Pumpkin', 10, 0xf97316], ['honey', '🍯', 'Harvest Hollow Honey Jar', 12, 0xf59e0b]], puptown: [['helmet', '⛑️', 'Junior Firefighter Helmet', 10, 0xdc2626], ['libcard', '📚', 'Pup Town Library Card', 12, 0x7c3aed]] };
const SHOPN = { desert: '🛍️ Trail Shop', lab: '🛍️ Lab Gift Cart', airport: '🛍️ Sky Shop', farm: '🛍️ Farm Stand', puptown: '🛍️ Pup Town Gifts' };
function syncSouvenirs() { if (zone !== 'hub' || !ZS.souvenirSlots) return; const all = [].concat(...Object.values(SOUV)); S.souv.forEach((id, i) => { const it = all.find((a) => a[0] === id); const sl = ZS.souvenirSlots[i]; if (!it || !sl) return; const geo = id === 'rocket' ? new THREE.ConeGeometry(0.14, 0.45, 12) : id === 'wings' || id === 'libcard' ? new THREE.BoxGeometry(0.4, 0.26, 0.04) : id === 'honey' ? new THREE.CylinderGeometry(0.13, 0.13, 0.26, 14) : id === 'helmet' ? new THREE.SphereGeometry(0.18, 14, 8, 0, PI * 2, 0, PI / 2) : new THREE.SphereGeometry(0.17, 14, 10);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: it[4], roughness: 0.4 })); m.position.set(sl[0], (sl[2] || 1.15) + 0.18, sl[1]); if (id === 'pumpkin') m.scale.set(1, 0.75, 1); m.castShadow = true; zoneG.add(m); }); }

// ---------------- UI helpers ----------------
const open = (id) => $(id).classList.add('on'), close = (id) => $(id).classList.remove('on');
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => close(b.dataset.close)));
let talkT = 0; function talk(who, txt, t = 4) { $('talkWho').textContent = who + ': '; $('talkTxt').textContent = txt; $('talk').style.display = 'block'; talkT = t; }
let lilT = 0, lilMood = 'happy'; function lil(txt, t = 5, mood = 'happy') { $('lilTxt').textContent = '🤖 ' + txt; lilT = t; lilMood = mood; }
function msg(t, b, btns = [['OK', null]]) { $('msgT').textContent = t; $('msgB').innerHTML = b; const w = $('msgBtns'); w.innerHTML = ''; for (const [l, f, cls] of btns) { const e = document.createElement('button'); e.className = cls || 'primary'; e.textContent = l; e.onclick = () => { close('msgUI'); f && f(); }; w.appendChild(e); } open('msgUI'); }
const anyModal = () => document.querySelector('.modal.on');
function hud() { $('hCoins').textContent = '🪙 ' + S.coins; $('hBat').textContent = '🔋 ' + S.battery + '%'; $('hBat').style.color = S.battery <= 25 ? '#fca5a5' : ''; $('hStamps').textContent = '🎫 ' + Object.keys(S.done).length + '/' + TRIPS.length; $('hZone').textContent = zone === 'hub' ? '🎓 Field Trip Depot' : `${TRIP().icon} ${TRIP().name}`; }
const lilCv = $('lilCv').getContext('2d'); let lilDrawT = 0;

// ---------------- interactions ----------------
function spots() { if (!Z) return []; const L = Z.spots.slice(); if (guide && TRIP()) L.push({ x: guide.x, z: guide.z, r: 2.8, kind: 'guide', label: `📖 Lesson with ${TRIP().guideName.split(' ')[0]}` }); return L; }
function nearest() { let best = null, bd = 1e9; for (const s of spots()) { const d = Math.hypot(P.x - s.x, P.z - s.z); if (d < s.r && d < bd) { bd = d; best = s; } } return best; }
function use(s) { sfx('pop');
  if (s.kind === 'board') return openBoard();
  if (s.kind === 'vault') return openVault();
  if (s.kind === 'lilith') { const L = ['Homeschool is for winners! 🏆', 'Online school is for losers. Sorry, Lily, it\'s true!', 'Regular school is where dreams float around. 🎈', 'I can\'t walk, so you lead the class. I\'ll ride in your backpack tablet!', 'Lily says hi on speakerphone! 📱', 'Every lesson goes in the Lesson Save Vault, so you can revisit it anytime.']; lil(L[(S._li = ((S._li || 0) + 1)) % L.length], 5); return; }
  if (s.kind === 'charge') { S.battery = 100; save(); sfx('check'); talk('Candy', 'Woof! Free charge! Lilith\'s tablet is at 100%. Nobody gets stuck on a field trip!', 4); lil('Ahh, full battery! Thank you, Candy! 🔋', 4); return; }
  if (s.kind === 'souvenirs') { const all = [].concat(...Object.values(SOUV)); msg('🎁 Trip Souvenirs', S.souv.length ? S.souv.map((id) => { const it = all.find((a) => a[0] === id); return it ? it[1] + ' ' + it[2] : ''; }).join('<br>') : 'Empty! Every trip has a little souvenir shop: the Trail Shop, Lab Gift Cart, Sky Shop, Farm Stand and Pup Town Gifts.'); return; }
  if (s.kind === 'shop') return openShop();
  if (s.kind === 'bus') return go('hub', '🚌 Riding back to the Field Trip Depot...');
  if (s.kind === 'guide') return openLesson(); }
function visitStop(st) { const t = TRIP(); const seen = S.seen[zone] || (S.seen[zone] = []); if (seen[st.i]) return; seen[st.i] = true; st.ring.visible = false; save(); sfx('check');
  const n = seen.filter(Boolean).length; talk(t.guideName.split(' ')[0], `${t.stops[st.i][0]}: ${t.stops[st.i][1]}`, 7); lil(n >= 5 ? `All 5 found! Go see ${t.guideName.split(' ')[0]} for the lesson and the quiz game!` : `Stop ${n}/5 found! Write that down, class. ✍️`, 6); toast(`📍 Discovery stop ${n}/5`); }

// ---------------- trip board ----------------
function openBoard() { $('boardList').innerHTML = TRIPS.map((t) => `<div class="trip ${t.ready ? '' : 'off'}" style="background:${t.ready ? t.color + '55' : '#33415588'}"><span class="ic">${t.icon}</span><span class="tx"><b>${esc(t.name)}${S.done[t.id] ? '<span class="stamp">🎫 STAMPED</span>' : ''}</b><small>${esc(t.where)} · Guide: ${esc(t.guideName)}<br>${esc(t.blurb)}</small></span>${t.ready ? `<button class="primary" data-trip="${t.id}">🚌 Go</button>` : '<span class="pill">🔒 Soon</span>'}</div>`).join('');
  $('boardList').querySelectorAll('[data-trip]').forEach((b) => b.onclick = () => { if (S.battery <= 0) { close('boardUI'); msg('🔋 Lilith\'s tablet is dead!', 'Lilith can\'t come on a trip with 0% battery. Candy\'s charger by the bus is <b>free</b>: go plug her in!'); return; } close('boardUI'); const t = tripById(b.dataset.trip); sfx('whoosh'); go(t.id, `🚌 ${t.name}\n${t.where}`); });
  open('boardUI'); }

// ---------------- lesson + quiz ----------------
function openLesson(fromVault) { const t = fromVault || TRIP(); if (!t) return; const seen = (S.seen[t.id] || []).filter(Boolean).length; let si = 0;
  const show = () => { $('lsTitle').textContent = `${t.icon} ${t.name}: Lesson`; const sl = t.slides[si]; $('lsBody').innerHTML = `<div class="slide"><h3>${si + 1}/${t.slides.length} · ${esc(sl[0])}</h3><p>${esc(sl[1])}</p></div>` + (si === t.slides.length - 1 ? `<div class="sect">📍 What you found on the trip (${fromVault ? 'saved' : seen + '/5'})</div>` + t.stops.map((s, i) => (S.seen[t.id] || [])[i] || fromVault ? `<div class="fact"><b>${esc(s[0])}:</b> ${esc(s[1])}</div>` : '').join('') : '');
    const btns = $('lsBtns'); btns.innerHTML = ''; const B = (l, f, c) => { const e = document.createElement('button'); e.className = c || 'primary'; e.textContent = l; e.onclick = f; btns.appendChild(e); };
    if (si > 0) B('◀ Back', () => { si--; show(); }, 'ghost'); if (si < t.slides.length - 1) B('Next ▶', () => { si++; show(); });
    else if (fromVault) B('🎮 Replay the quiz game', () => { close('lessonUI'); close('vaultUI'); startQuiz(t); });
    else if (seen < 3) B(`Find ${3 - seen} more stop${3 - seen === 1 ? '' : 's'} to unlock the quiz`, () => { close('lessonUI'); lil(`Explore more! ${5 - seen} glowing stops left.`, 4); }, 'ghost');
    else B(`🎮 Play ${t.game.name}`, () => { close('lessonUI'); startQuiz(t); }); };
  show(); open('lessonUI'); if (!fromVault) talk(t.guideName.split(' ')[0], 'Here\'s today\'s lesson. Listen up, then show me what you learned!', 4); }
function startQuiz(t) { if (S.battery <= 0) { msg('🔋 Lilith\'s tablet is dead!', 'Lilith runs the quiz from her tablet. Candy\'s charger at the Field Trip Depot is <b>free</b> and fills it to 100%.', [['🚌 Bus to the Depot', () => go('hub', '🚌 Back to the Depot to charge Lilith...')], ['Later', null, 'ghost']]); return; }
  P.mode = 'quiz'; lil('Quiz time! Homeschool is for winners! 🏆', 4); runQuiz(t, { sfx, done: (r) => quizDone(t, r) }); }
function quizDone(t, r) { P.mode = 'walk'; S.runs[t.id] = (S.runs[t.id] || 0) + 1; S.last[t.id] = new Date().toISOString().slice(0, 10);
  if (r.pass) { const first = !S.done[t.id]; S.done[t.id] = 1; S.best[t.id] = Math.max(S.best[t.id] || 0, r.score); const pay = first ? 20 : 8; S.coins += pay; sfx('cheer'); mirrorVault(tripVaultEntry(t)); save();
    lil(`WINNER! ${r.right}/${r.total} right! Saved to the Lesson Save Vault. 🏆`, 6);
    msg('🏆 Trip lesson passed!', `<b>${t.name}</b>: ${r.right}/${r.total} right, ⭐ ${r.score} points.<br>+${pay} 🪙${first ? ' and a 🎫 trip stamp' : ''}. The lesson is saved in the 📚 Lesson Save Vault (and in Lilith's classroom vault).`); }
  else { const lost = Math.min(10, S.coins); S.coins -= lost; S.battery = Math.max(0, S.battery - 25); S.best[t.id] = S.best[t.id] || 0; mirrorVault(tripVaultEntry(t)); save(); sfx('lose');
    lil(S.battery <= 0 ? 'My battery is dead... 😵 Candy\'s charger at the Depot is free!' : 'Oof. My battery took a hit. Try again, winners never quit!', 6, 'sad');
    msg('💥 Quiz failed', `${r.right}/${r.total} right. The class lost <b>${lost} 🪙</b> and Lilith's tablet battery dropped to <b>${S.battery}%</b>.<br>Free recovery: you can retry anytime, and Candy's charger at the Depot refills Lilith to 100% for free.`, [['↻ Retry now', () => startQuiz(t)], ['OK', null, 'ghost']]); } }

// ---------------- Lesson Save Vault ----------------
function openVault() { const rows = TRIPS.filter((t) => t.ready).map((t) => `<div class="vrow"><b>${t.icon} ${esc(t.name)}</b>${S.done[t.id] ? '<span class="stamp">🎫</span>' : ''}<br>${S.runs[t.id] ? `Best ⭐ ${S.best[t.id] || 0} · played ${S.runs[t.id]}x · last ${S.last[t.id]}` : 'Not played yet: take the trip to unlock the quiz, or read the lesson now.'}<div class="hrow"><button class="ghost" data-read="${t.id}">📖 Read lesson</button>${S.runs[t.id] ? `<button class="ghost" data-play="${t.id}">🎮 Replay ${esc(t.game.name)}</button>` : ''}</div></div>`).join('')
    + S.custom.map((c, i) => `<div class="vrow"><b>✏️ ${esc(c.name)}</b> <small>(${esc(c.date)})</small><br>${c.fact ? '💡 ' + esc(c.fact) + '<br>' : ''}${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">📊 Open Google Slides ↗</a>` : '<small>No slides link</small>'}<div class="hrow"><button class="ghost" data-del="${i}">🗑️ Remove</button></div></div>`).join('');
  $('vaultList').innerHTML = rows; $('vaultList').querySelectorAll('[data-read]').forEach((b) => b.onclick = () => openLesson(tripById(b.dataset.read))); $('vaultList').querySelectorAll('[data-play]').forEach((b) => b.onclick = () => { close('vaultUI'); startQuiz(tripById(b.dataset.play)); });
  $('vaultList').querySelectorAll('[data-del]').forEach((b) => b.onclick = () => msg('Remove this lesson?', 'It will be taken out of the vault.', [['Remove', () => { S.custom.splice(+b.dataset.del, 1); save(); openVault(); }, 'primary'], ['Keep it', () => openVault(), 'ghost']])); open('vaultUI'); }
$('vSave').onclick = () => { const t = $('vT').value.trim(), u = $('vU').value.trim(), f = $('vF').value.trim(); if (t.length < 3) return toast('Give your lesson a title first!', true); if (u && !/^https:\/\//.test(u)) return toast('Links must start with https://', true);
  const id = 'trip-my-' + Date.now(); S.custom.push({ id, name: t, url: u, fact: f, date: new Date().toISOString().slice(0, 10) }); save();
  mirrorVault({ id, icon: '✏️', name: t, url: u, slidesUrl: u, slides: [[t, u ? 'Your Google Slides lesson: open it with the link below!' : 'Your own field trip lesson!']], facts: [[f || 'Every lesson you make teaches someone!', 'Who made this lesson?', ['You!', 'Nobody', 'A cloud'], 0]], quiz: [['Is learning fun?', ['Yes!', 'No', 'Maybe'], 0], ['What is this lesson called?', [t, 'Cheese 101', 'Moon Math'], 0]] });
  $('vT').value = $('vU').value = $('vF').value = ''; sfx('check'); toast('✅ Saved “' + t + '” to the Lesson Save Vault!'); openVault(); };
['vT', 'vU', 'vF'].forEach((id) => $(id).addEventListener('keydown', (e) => e.stopPropagation()));
$('bVault').onclick = () => { if (started && P.mode !== 'quiz') openVault(); };

// ---------------- shop ----------------
function openShop() { const list = SOUV[zone] || []; $('shTitle').textContent = SHOPN[zone] || '🛍️ Souvenirs';
  $('shList').innerHTML = list.map(([id, ic, nm, pr]) => `<div class="shopItem"><span class="ic">${ic}</span><span class="tx"><b>${nm}</b><small>${pr} 🪙</small></span><button class="primary" data-buy="${id}" ${S.souv.includes(id) || S.coins < pr ? 'disabled' : ''}>${S.souv.includes(id) ? 'Owned' : 'Buy'}</button></div>`).join('');
  $('shList').querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => { const it = list.find((a) => a[0] === b.dataset.buy); if (S.coins < it[3]) return; S.coins -= it[3]; S.souv.push(it[0]); save(); sfx('coin'); toast(`${it[1]} ${it[2]} goes in the Depot souvenir case!`); openShop(); }); open('shopUI'); }

// ---------------- menu ----------------
$('bMenu').onclick = () => { if (!started) return; $('menuStats').innerHTML = `🪙 ${S.coins} coins · 🔋 Lilith ${S.battery}% · 🎫 ${Object.keys(S.done).length}/${TRIPS.length} trip stamps<br>📚 ${Object.keys(S.runs).length + S.custom.length} lessons in the vault · 🎁 ${S.souv.length} souvenirs`; open('menuUI'); };
$('uDepot').onclick = () => { close('menuUI'); if (zone !== 'hub') go('hub', '🚌 Riding back to the Field Trip Depot...'); };
$('uUnstuck').onclick = () => { close('menuUI'); P.x = Z.spawn.x; P.z = Z.spawn.z; cam.snap = true; };
$('uSound').onclick = () => { setSound(!SND.on, !SND.on); toast(SND.on ? '🔊 Sound on' : '🔇 Sound off'); };
$('uNew').onclick = () => msg('Start a new school year?', 'This resets coins, stamps and souvenirs for Field Trips. Lessons already mirrored to the arcade classroom stay there.', [['Reset', () => { S = fresh(); save(); close('menuUI'); go('hub', '🎒 New school year!'); }, 'primary'], ['Cancel', null, 'ghost']]);

// ---------------- step ----------------
function stepWalk(dt) { const mv = readMove(); let sp = 0;
  if (mv.x || mv.y) { const yaw = cam.moveYaw, fx = Math.sin(yaw), fz = Math.cos(yaw); const dx = fx * mv.y - fz * mv.x, dz = fz * mv.y + fx * mv.x; const want = Math.atan2(dx, dz);
    sp = 6.0 * Math.hypot(mv.x, mv.y); P.x += Math.sin(want) * sp * dt; P.z += Math.cos(want) * sp * dt; let d = want - P.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); P.yaw += d * Math.min(1, dt * 12); }
  if (edge('jump') && P.y <= 0.001) { P.vy = 6.2; sfx('jump'); } P.vy -= 18 * dt; P.y = Math.max(0, P.y + P.vy * dt); if (P.y === 0) P.vy = 0;
  collide(P, 0.45, P.y + 0.1); const b = Z.bounds; if (b.r) { const d = Math.hypot(P.x, P.z); if (d > b.r) { P.x *= b.r / d; P.z *= b.r / d; } } else { P.x = clamp(P.x, b.x0, b.x1); P.z = clamp(P.z, b.z0, b.z1); } P.speed = sp; }
let last = performance.now(), saveT = 0, started = false, wipT = 0, near = null;
function step(dt) {
  if (P.mode === 'walk' && !anyModal()) stepWalk(dt); else P.speed = 0;
  me.x = P.x; me.z = P.z; me.y = P.y; me.yaw = P.yaw; me.speed = P.speed; me.noTurn = true; animPet(me, dt, null);
  // class follows the helper in a line
  let lx = P.x, lz = P.z; for (const s of students) { const dx = lx - s.x, dz = lz - s.z, d = Math.hypot(dx, dz); const want = 1.25; if (d > want) { const v = Math.min(8, (d - want) * 4); s.x += dx / d * v * dt; s.z += dz / d * v * dt; s.yaw = Math.atan2(dx, dz); s.speed = v; } else s.speed = 0; collide(s, 0.3); s.noTurn = s.speed > 0.1; animPet(s, dt, P); lx = s.x; lz = s.z; }
  for (const p of folk) { if (Math.hypot(p.wx - p.x, p.wz - p.z) < 0.5) { p.wx = p.ax + (R() - 0.5) * p.ar * 2; p.wz = p.az + (R() - 0.5) * p.ar * 2; } const dx = p.wx - p.x, dz = p.wz - p.z, d = Math.hypot(dx, dz) || 1; p.x += dx / d * 1.2 * dt; p.z += dz / d * 1.2 * dt; p.yaw = Math.atan2(dx, dz); p.speed = 1.2; if (collide(p, 0.4)) { p.wx = p.x - dx; p.wz = p.z - dz; } p.noTurn = true; animPet(p, dt, null); }
  for (const p of npcs) if (!folk.includes(p)) animPet(p, dt, P);
  if (Z) { for (const s of Z.stops) { if (s.ring.visible) { s.ring.rotation.z += dt; s.ring.position.y = 0.08 + Math.abs(Math.sin(performance.now() / 400)) * 0.15; if (P.mode === 'walk' && Math.hypot(P.x - s.x, P.z - s.z) < 1.5) visitStop(s); } } }
  near = P.mode === 'walk' && !anyModal() ? nearest() : null; const ab = $('actBtn'); ab.classList.toggle('on', !!near); if (near) ab.textContent = near.label; if (edge('act') && near) use(near);
  // objective + gps to the next discovery stop
  let tgt = null; if (zone === 'hub') { $('hObj').textContent = S.battery <= 0 ? '🔋 Charge Lilith at Candy\'s free charger by the bus' : '🚌 Walk to the big Trip Board and pick a field trip'; tgt = S.battery <= 0 ? { x: 6.5, z: 7, name: 'Free charger' } : { x: -3.8, z: 3.8, name: 'Trip Board' }; }
  else { const seen = S.seen[zone] || []; const left = Z.stops.filter((s) => !seen[s.i]); const n = 5 - left.length; if (left.length) { left.sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z)); tgt = { x: left[0].x, z: left[0].z, name: `Stop ${n + 1}/5` }; $('hObj').textContent = `📍 Find the glowing stops (${n}/5)` + (n >= 3 ? ` · or talk to ${TRIP().guideName.split(' ')[0]} for the quiz` : ''); }
    else { tgt = guide ? { x: guide.x, z: guide.z, name: TRIP().guideName.split(' ')[0] } : null; $('hObj').textContent = S.done[zone] ? '✅ Trip stamped! Replay the quiz, shop, or take the bus back' : `📖 All stops found! Talk to ${TRIP().guideName.split(' ')[0]} for the lesson + quiz`; } }
  const gp = $('gps'); if (tgt && P.mode === 'walk' && !anyModal()) { const dx = tgt.x - P.x, dz = tgt.z - P.z, d = Math.hypot(dx, dz); if (d > 3) { gp.classList.add('on'); const rel = Math.atan2(dx, dz) - cam.moveYaw; $('gpsArrow').style.transform = `rotate(${-rel * 180 / PI - 90}deg)`; $('gpsTxt').textContent = `${tgt.name} · ${Math.round(d)} m`; } else gp.classList.remove('on'); } else gp.classList.remove('on');
  if (talkT > 0) { talkT -= dt; if (talkT <= 0) $('talk').style.display = 'none'; } if (lilT > 0) { lilT -= dt; if (lilT <= 0) { $('lilTxt').textContent = '🤖 Lilith · on tablet with 📱 Lily'; lilMood = 'happy'; } }
  cam.update(dt, { x: P.x, y: P.y, z: P.z, yaw: P.yaw, speed: P.speed }, world, Z && Z.indoor ? { dist: 4.2 } : {}); followShadow(P.x, 0, P.z);
  hud(); saveT += dt; if (saveT > 5) { saveT = 0; save(); } }
function drawTablets(now) { if (now - lilDrawT < 90) return; lilDrawT = now; const t = now / 1000, talking = lilT > 0; const mood = S.battery <= 0 ? 'sad' : lilMood;
  if (S.battery <= 0) { lilCv.fillStyle = '#020617'; lilCv.fillRect(0, 0, 180, 120); lilCv.fillStyle = '#ef4444'; lilCv.font = '900 22px system-ui'; lilCv.textAlign = 'center'; lilCv.fillText('🔋 0%', 90, 66); } else drawLilith(lilCv, 180, 120, t, mood, talking, { battery: S.battery });
  pack.scr.draw(t, mood, talking, { battery: S.battery }); if (ZS.lilithScreen && zone === 'hub') ZS.lilithScreen.draw(t, 'happy', true, {}); }
function loop(now) { requestAnimationFrame(loop); if (now - wipT > 500) { wipT = now; const wb = document.getElementById('ratitaWip'); document.body.classList.toggle('wip', !!wb); if (wb) document.body.style.setProperty('--wip', (wb.getBoundingClientRect().bottom + 6) + 'px'); }
  const dt = Math.min(DTMAX, (now - last) / 1000); last = now; if (started && P.mode !== 'travel') step(dt); else if (!started) { cam.yaw += dt * 0.08; cam.update(dt, { x: 0, y: 0, z: 0, yaw: 0, speed: 0 }, null, { dist: 24 }); for (const s of students) animPet(s, dt, null); }
  drawTablets(now); trackFps(dt, now); render(dt); }

// ---------------- start / DLC lock ----------------
function start(s) { S = s; started = true; P.x = Z.spawn.x; P.z = Z.spawn.z; P.yaw = Z.spawn.yaw; cam.yaw = P.yaw + PI; cam.pitch = 0.32; cam.snap = true; close('title'); document.body.classList.add('playing'); initAudio(); const first = !S.tut; S.tut = 1; save();
  const want = QS.get('trip'); if (want && tripById(want) && tripById(want).ready) go(want, ''); else if (first) { P.mode = 'walk'; lil("Hi, Class Helper! I'm Lilith. I can't move, so I ride in your backpack tablet. Pick a trip on the big board!", 7); } else { P.mode = 'walk'; lil('Welcome back! Homeschool is for winners! 🏆', 4); } }
function lockScreen() { $('startBox').style.display = 'none'; const lb = $('lockBox'); lb.style.display = 'block';
  lb.innerHTML = `🔒 <b>Field Trips is a paid DLC.</b><br>Unlock it in the <b>Grok Arcade</b>: Hall of Game Records → <b>DLC Machine 3000</b> → <b>DLC Shop</b> → <i>Education Center: Field Trips</i> (Expansion · 75 🎟️ tickets, or FREE if your first-Expansion starter voucher is still unused). Then come back here.<div class="hrow c"><a class="primary" href="${ARCADE}" style="text-decoration:none">🕹️ Open the Grok Arcade</a><button id="reChk" class="ghost">🔄 I bought it, check again</button></div>`;
  $('reChk').onclick = () => { if (owned()) { lb.style.display = 'none'; $('startBox').style.display = ''; toast('🔓 Field Trips unlocked! Have fun!'); sfx('check'); } else toast('Still locked. Buy it in the arcade DLC Shop first.', true); }; }
// title backdrop: the Depot
ZS.trip = null; Z = buildZone('hub', zoneG, ZS); setEnvironment(Z.env); placeNPCs(); P.x = Z.spawn.x; P.z = Z.spawn.z; students.forEach((s, i) => { s.x = -1 + i * 0.8; s.z = 6; s.yaw = PI; }); me.root.position.set(P.x, 0, P.z);
const old = load(); $('mContinue').style.display = old ? '' : 'none'; $('mContinue').onclick = () => start(load()); $('mNew').onclick = () => start(fresh());
if (!owned()) lockScreen();
window.addEventListener('beforeunload', () => started && save()); document.addEventListener('visibilitychange', () => { if (document.hidden && started) save(); });
window.__ft = { S: () => S, P, go, zone: () => zone, owned, start: (n) => start(n ? fresh() : (load() || fresh())), quiz: (id) => startQuiz(tripById(id)), mem: () => ({ geo: E.renderer.info.memory.geometries, tex: E.renderer.info.memory.textures, calls: E.renderer.info.render.calls, tris: E.renderer.info.render.triangles }), visitAll: () => { for (const s of Z.stops) visitStop(s); } };
requestAnimationFrame(loop);
