/* Grok Arcade - RATITA PREVIEW CENTER: walk-up prompts + overlays. Lili (chat + QA checklist), the poster wall, the Scheduled
   Additions board, the TIME JUMPER (real work-in-progress previews from preview.json, a calibration jump when nothing is playable)
   and its MALFUNCTIONS: never on your first jump, about 1 in 4 after that. Malfunctions are silly and harmless: sparks + glitch
   static, a detour to the GL1TCH R00M (exit portal right there + a JUMP BACK button), a short reboot, or a quick fix job (whack the
   panel, rewire 4 plugs, find the cheese-cog that popped out). Every fix job has a "let Lili handle it" button. Nothing here touches
   saves (only its own grokArcade.pv* keys), and it doesn't use the Chrono-Gate fuses / tele-juice at all. */
(function () {
  'use strict';
  var UI = GA.PreviewUI = {}, PR = GA.Preview;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function snd(n) { try { GA.Audio.play(n); } catch (e) {} }
  function toast(m, ms) { if (GA.Fix && GA.Fix.toast) GA.Fix.toast(m, ms || 3400); }
  function show(kind, title, sub, body, foot, cls) { GA.AreasUI.show(kind, title, sub, body, foot, 'pvPanel ' + (cls || '')); }
  function close(silent) { GA.AreasUI.close(silent); }
  function on(id, f) { var e = $(id); if (e) e.addEventListener('click', f); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pay(n) { if (n > 0) GA.addTickets(n); if (GA.onTickets) GA.onTickets(GA.getTickets()); }
  function ev(k, v) { if (GA.Prog) GA.Prog.event(k, v); }
  function grant(id) { return GA.Prog && GA.Prog.grant ? GA.Prog.grant(id) : false; }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function M() { return GA.PVD ? GA.PVD.model() : { building: [], queued: [], shipped: [], posters: [], previews: [] }; }
  var K_QA = 'grokArcade.pvQA', K_J = 'grokArcade.pvJumps', K_DAY = 'grokArcade.pvDay';
  function qa() { var q = load(K_QA, null); if (!q || typeof q !== 'object') q = {}; q.posters = q.posters || {}; return q; }
  function saveQA(q) { store(K_QA, q); }
  function day() { var d = load(K_DAY, null); if (!d || d.d !== today()) d = { d: today() }; return d; }
  function liliNote(s) { return '<div class="arNote pvLili"><b>Lili:</b> \u201C' + esc(s) + '\u201D</div>'; }
  function lili(s, secs) { if (PR.say) PR.say(s, secs || 4.5); var p = GA.Hub.pose(), c = PR.cab('pv_lili'); if (c && Math.hypot(p.x - c.x, p.z - c.z) > 10 && !(GA.AreasUI.kind && GA.AreasUI.kind())) toast('\uD83D\uDC2D LILI: \u201C' + s + '\u201D', 3600); UI.lastLili = s; return s; }
  UI.lili = lili;

  /* ---------- Lili's lines: precise, deadpan QA inspector who secretly loves her job ---------- */
  var L = UI.LINES = {
    hi: ['Welcome to the Ratita Preview Center. I am Lili, Quality Assurance. Please keep hands, paws and tails inside the building.', 'Visitor logged. Your mood: curious. My mood: cautiously optimistic. For me that is a party.', 'Hello. Mimi is the cheerful one. Lily is the clock one. I am the one who reads the manual.', 'Ah. A guest. Do not lick the posters. Someone did. I will not say who. (It was Pi-rat.)'],
    who: ['I am Lili, Ratita Industries QA unit number one. Luna, Pi-rat and Snowie built me to test things. Mostly I test my patience.', 'My job: I make sure nothing goes in the Time Jumper until it actually works. I have said NO four hundred times. I enjoyed every one.'],
    cousins: ['Mimi is my cousin. She wired this room. I found four cables labeled \u201Cprobably fine.\u201D', 'Lily, my other cousin, calibrated the Jumper\u2019s clock. It is now accurate to within one Tuesday.', 'We are distant cousins. Mimi says \u201Cdistant\u201D means \u201Cfun.\u201D I say it means \u201Cin a different building, on purpose.\u201D', 'Mimi sends me hug emojis. I send back bug reports. It is our love language.'],
    gus: ['Gus visited once. He said the posters were \u201Ctoo exciting.\u201D I logged it as a compliment.', 'Gus asked if the Time Jumper could jump him back to before visitors existed. I said no. He sighed for eleven seconds. I timed it.'],
    barnaby: ['Barnaby sends me cookies through the air vent. That is against protocol. They are also delicious. I am conflicted.', 'Uncle Barnaby calls me \u201Clittle robot cousin.\u201D We are not related. I have stopped correcting him. He is too nice.'],
    jumper: ['The Time Jumper plays builds that are still being made, but ONLY once they really work. Half-baked builds stay on the posters.', 'If a build is not playable yet, it goes on the wall and the schedule. Not in my Jumper. My Jumper has standards.', 'Your real saves stay safe. A preview gets its own separate save, like a sandbox. I insisted. Loudly.'],
    empty: ['The Jumper is empty right now. Nothing is playable yet, so nothing goes in. You may still do a calibration jump. It is mostly harmless.', 'Nothing in the Jumper today. The builders are still building. I am still waiting. Professionally.'],
    next: ['Check the board on the east wall. Red is in the lab right now, teal is up next, green just shipped.', 'Everything on that board comes straight from the Suggestion Booth and the DLC Machine. Live. I do not make things up. I am QA.'],
    grumble: ['Ugh. That is Mimi\u2019s wiring again. She uses GLITTER as insulation.', 'Lily set the timer to \u201Cwhenever.\u201D WHENEVER, Lily.', 'Ratita Industries tech: 98 percent amazing, 2 percent sparks. Today you got the 2.', 'Pi-rat \u201Cimproved\u201D the core with a tiny pirate flag. It did not need a pirate flag.', 'Snowie said it was \u201Cfixed-ish.\u201D I am filing \u201C-ish\u201D as a bug.', 'This is fine. Everything is fine. Please ignore the smoke. It is decorative smoke.', 'Mimi! Your cousin tech is doing the thing again! ...She cannot hear me. She is in a different building. On purpose.'],
    fixed: ['Fixed. You are an excellent intern. Unpaid. Well. Paid in tickets.', 'Repair logged. Your name goes in the report. Spelled correctly, even.', 'Good work. I will tell Mimi it was me.'],
    selfFix: ['Fine, I will do it. Stand back. Further. Further. Okay.', 'Leave it to me. I have fixed this exact thing 41 times this week.'],
    calib: ['Calibration complete. You traveled three seconds into the future. Welcome. It is basically the same.', 'Calibration jump successful. All your atoms came back. I counted. Mostly.', 'Jump logged. You are now 0.0001 percent more futuristic.'],
    vault: ['That is the Save Vault. When a game ships, its last Time Jumper preview goes in a cartridge and stays playable forever. I do not throw things away. I archive them.', 'Every beta in the Vault keeps its own save, separate from the real game. Your real progress stays safe. I checked. Then I checked my checking.', 'The Vault is the Time Jumper Save Booth. Mimi wanted to call it the Beta Bin. I said no. Firmly.', 'A Final Beta is history. Slightly buggy history. That is the best kind.'],
    vaultEmpty: ['The Save Vault is empty. Nothing has shipped out of the Jumper yet. Ten slots, zero cartridges. Very tidy. I hate it.', 'Nothing archived yet. When a preview game really ships, its last beta goes in a slot. Until then, I polish the slots.'],
    vaultPend: ['That blinking amber cartridge? A game that is in the Jumper right now. The day it ships, its final beta clicks into the Vault. Click.'],
    glitchBack: ['You are back. You were in the GL1TCH R00M. Do not tell Mimi it exists. She will want to decorate it.', 'Welcome back. That room is not on the map. Officially, it does not exist. Unofficially, it has cheese.']
  };
  UI.lastLili = null;

  /* ---------- QA checklist ---------- */
  var TASKS = [['hi', 'Say hi to Lili'], ['posters', 'Inspect 3 posters on the wall'], ['board', 'Read the Scheduled Additions board'], ['jump', 'Take one Time Jumper jump'], ['chrono', 'Play Chrono Courier (bonus #32)']];
  UI.TASKS = TASKS;
  function taskDone(q, k) { return k === 'posters' ? Object.keys(q.posters).length >= 3 : !!q[k]; }
  function mark(k, val) { var q = qa(); if (q.done) { if (k === 'posters') { q.posters[val] = 1; saveQA(q); } return; } if (k === 'posters') q.posters[val] = 1; else q[k] = 1; saveQA(q); checkQA(); }
  UI.mark = mark;
  function checkQA() { var q = qa(); if (q.done) return; if (TASKS.every(function (t) { return taskDone(q, t[0]); })) { q.done = Date.now(); saveQA(q); ev('pvQA'); pay(15); var got = grant('pl_lili'); snd('perfect'); lili('Checklist complete. Every box ticked. This is the best day of my life. Please take this plush. Do not tell anyone I smiled.', 6); toast('\uD83D\uDCCB QA checklist done! +15 tickets' + (got ? ' and the RARE Lili Plush!' : ''), 4600); } }
  function qaHtml() { var q = qa(), n = TASKS.filter(function (t) { return taskDone(q, t[0]); }).length;
    return '<div class="pvQA"><div class="pvQAh">\uD83D\uDCCB LILI\u2019S QA CHECKLIST <span>' + n + '/' + TASKS.length + '</span></div>' + TASKS.map(function (t) { var d = taskDone(q, t[0]); return '<div class="pvTask' + (d ? ' done' : '') + '">' + (d ? '\u2611' : '\u2610') + ' ' + esc(t[1]) + (t[0] === 'posters' && !d ? ' (' + Object.keys(q.posters).length + '/3)' : '') + '</div>'; }).join('') +
      '<div class="pvQAf">' + (q.done ? '\u2705 Done! You earned the Lili Plush.' : 'Reward: 15 tickets + the RARE Lili Plush') + '</div></div>'; }

  /* ---------- Time Jumper state ---------- */
  var J = UI.J = { busy: false, coolUntil: 0, mal: null, pend: null, part: null, glitch: false };
  UI.forceMal = null; // tests: 'none' | 'sparks' | 'glitch' | 'wrong' | 'reboot' | 'whack' | 'rewire' | 'part'
  UI.MALS = ['sparks', 'glitch', 'reboot', 'whack', 'rewire', 'part'];
  UI.CHANCE = 0.25;
  UI._nav = function (url) { location.href = url; };
  function jumps() { return load(K_J, 0) | 0; }
  UI.jumps = jumps;
  function cooling() { return Math.max(0, Math.ceil((J.coolUntil - Date.now()) / 1000)); }
  UI.cooling = cooling;
  PR.jumperInfo = function () {
    var m = M(), c = cooling(), n = m.previews.length, nx = (m.building[0] || m.queued[0] || {}).name;
    if (J.part) return { holo: 'MISSING: 1 CHEESE-COG', lines: ['! PART MISSING !', 'a cheese-cog popped', 'out. find it + bring', 'it back here', '(or ask Lili)'] };
    if (c > 0) return { holo: 'REBOOTING\u2026 ' + c + 's', lines: ['REBOOTING...', 'T-' + c + 's', 'cause: ' + (J.cause || 'Mimi\u2019s wiring'), 'do not touch.', 'especially that.'] };
    if (n) return { holo: n + ' PREVIEW' + (n > 1 ? 'S' : '') + ' READY', lines: ['JUMPER: READY'].concat(m.previews.slice(0, 3).map(function (p) { return '> ' + p.name; })).concat(['WIP: may be buggy']) };
    return { holo: 'NO PREVIEWS (YET)', lines: ['JUMPER: IDLE', 'PLAYABLE: 0', 'CALIBRATION: OK', nx ? 'NEXT: ' + nx : 'NEXT: ???', 'jumps logged: ' + jumps()] };
  };
  function refreshJumper() { if (PR.drawHolo) PR.drawHolo(); if (PR.drawConsole) PR.drawConsole(); }
  UI.refreshJumper = refreshJumper;
  function pickMal(n, p) {
    if (UI.forceMal) { var f = UI.forceMal; return f === 'none' ? null : f; }
    if (J.grace) { J.grace = false; return null; } // the jump right after a malfunction always works
    if (n <= 1 || Math.random() >= UI.CHANCE) return null; // never on your very first jump
    var m = pick(UI.MALS); if (m === 'glitch' && p && M().previews.length > 1 && Math.random() < 0.5) m = 'wrong'; return m;
  }
  UI.pickMal = pickMal;

  /* ---------- prompts ---------- */
  UI.prompt = function (cab) {
    var k = cab.kind, m = M();
    if (k === 'pv_lili') { var q = qa(), n = TASKS.filter(function (t) { return taskDone(q, t[0]); }).length; return { tag: 'RATITA INDUSTRIES \u00b7 QA', name: 'Lili', desc: 'Mimi\u2019s and Lily\u2019s distant cousin. Ask her anything, or do her QA checklist (' + n + '/' + TASKS.length + ') for a rare prize.', btn: 'TALK', key: 'talk to Lili', cls: 'prize', pb: 'pzPlay' }; }
    if (k === 'pv_jumper') { var c = cooling(), n2 = m.previews.length;
      if (J.part && J.part.got) return { tag: 'TIME JUMPER', name: 'Put the cheese-cog back', desc: 'You found it! Pop it back in and the Jumper is fixed.', btn: 'FIX', key: 'fix the Jumper', cls: 'prize', pb: 'pzPlay' };
      return { tag: 'TIME JUMPER', name: c ? 'Rebooting\u2026 ' + c + 's' : n2 ? n2 + ' playable preview' + (n2 > 1 ? 's' : '') : 'Nothing in the Jumper right now', desc: c ? 'Lili is rebooting it. You can help speed it up!' : n2 ? 'Jump into a WORK-IN-PROGRESS build. It may be buggy! Your real saves are never touched.' : 'No build is playable yet (they\u2019re on the posters + board). You can still do a calibration jump!', btn: 'USE', key: 'use the Time Jumper', cls: 'prize', pb: 'pzPlay' }; }
    if (k === 'pv_poster') { var s = PR.posters()[cab.data.slot], it = s && s.it; return { tag: it ? (PR.STC[it.stage] || PR.STC.queued)[0] : 'POSTER WALL', name: it ? it.name : 'Empty poster spot', desc: it ? it.gname + (it.when ? ' \u00b7 ' + it.when : '') + '. Take a closer look!' : 'This spot is waiting for YOUR idea. Here\u2019s how to get a poster up.', btn: 'LOOK', key: 'look at the poster', cls: 'gallery', pb: 'galPlay' }; }
    if (k === 'pv_board') return { tag: 'SCHEDULED ADDITIONS', name: 'What\u2019s coming', desc: m.building.length + ' in the lab, ' + m.queued.length + ' up next, ' + m.shipped.length + ' just shipped.' + (m.live ? ' Live!' : ''), btn: 'READ', key: 'read the board', cls: 'gallery', pb: 'galPlay' };
    if (k === 'pv_chrono') return { tag: 'BONUS #32', name: 'Chrono Courier', desc: 'Send Ratita Industries parcels through the right time portal. Leave the glitchy ones alone!', btn: 'PLAY', key: 'play Chrono Courier', cls: 'prize', pb: 'pzPlay' };
    if (k === 'pv_gexit') return { tag: 'GL1TCH R00M', name: 'Exit portal', desc: 'Jump back to the Ratita Preview Center. No harm done!', btn: 'JUMP<br>BACK', key: 'jump back', cls: 'prize', pb: 'pzPlay' };
    if (k === 'pv_gcheese') return { tag: 'GL1TCH R00M', name: 'Glitch cheese', desc: 'A cheese wedge that exists in three timelines at once. Grab it!', btn: 'GRAB', key: 'grab the cheese', cls: 'prize', pb: 'pzPlay' };
    if (k === 'pv_vault') { var na = (m.archive || []).length, np = (m.pending || []).length; return { tag: 'TIME JUMPER SAVE BOOTH', name: 'Save Vault', desc: na ? na + ' final beta' + (na > 1 ? 's' : '') + ' archived, playable forever (own save).' + (np ? ' ' + np + ' more waiting in the Jumper.' : '') : 'Nothing archived yet.' + (np ? ' ' + m.pending[0].name + ' is in the Jumper now (will be archived at release).' : ''), btn: 'OPEN', key: 'open the Save Vault', cls: 'gallery', pb: 'galPlay' }; }
    if (k === 'pv_part') return { tag: 'LOOSE PART', name: 'The missing cheese-cog!', desc: 'It popped out of the Time Jumper. Grab it and bring it back to the console.', btn: 'GRAB', key: 'grab the cog', cls: 'prize', pb: 'pzPlay' };
    return null;
  };
  UI.open = function (cab) {
    var k = cab.kind;
    if (k === 'pv_lili') return openLili();
    if (k === 'pv_jumper') { if (J.part && J.part.got) return fixPart(); return openJumper(); }
    if (k === 'pv_poster') return openPoster(cab.data.slot);
    if (k === 'pv_board') return openBoard();
    if (k === 'pv_chrono') { close(true); mark('chrono'); GA.openBonus('chrono'); return; }
    if (k === 'pv_gexit') { close(true); return glitchBack(); }
    if (k === 'pv_gcheese') { close(true); return grabCheese(); }
    if (k === 'pv_part') { close(true); return grabPart(); }
    if (k === 'pv_vault') return openVault();
  };

  /* ---------- Lili ---------- */
  /* ---------- the Save Vault (Time Jumper Save Booth) ---------- */
  function vaultLine() { var m = M(); return !(m.archive || []).length ? pick((m.pending || []).length ? L.vaultEmpty.concat(L.vaultPend) : L.vaultEmpty) : pick(L.vault); }
  function openVault() {
    var m = M(), Ar = m.archive || [], Pn = m.pending || [], s = vaultLine(); lili(s); ev('pvVault');
    var html = liliNote(s) + '<div class="pvWip pvVaultWip">\uD83D\uDCBE Final betas keep their <b>own separate save</b> (not the real game\u2019s). Your real saves are safe. Betas may be buggy: they are history!</div>';
    if (Ar.length) html += Ar.map(function (p, i) { return '<div class="pvPrev pvBetaRow"><div><b>\uD83D\uDCBE ' + esc(p.name) + '</b><span>' + esc(p.label) + ' \u00b7 ' + esc(p.gname) + (p.archived ? ' \u00b7 archived ' + esc(p.archived) : '') + '</span>' + (p.notes ? '<i>' + esc(p.notes) + '</i>' : '') + '</div><button class="bigBtn" id="pvBeta' + i + '" disabled>CHECKING\u2026</button></div>'; }).join('');
    else html += '<div class="pvEmpty"><div class="pvBig">\uD83D\uDDC4\uFE0F</div><b>Nothing archived yet.</b><p>When a game that was in the Time Jumper really ships, its last preview is archived here as its <b>Final Beta (Time Jumper)</b>, playable forever. It also shows up in that game\u2019s Old Versions in the Hall of Records.</p></div>';
    if (Pn.length) html += '<h4 class="pvVaultH">\u23F3 Waiting in the Time Jumper</h4>' + Pn.map(function (p) { return '<div class="pvPrev pvPendRow"><div><b>' + esc(p.name) + '</b><span>' + esc(p.vault) + '</span></div><span class="pvTag">IN THE JUMPER</span></div>'; }).join('');
    show('pv_vault', 'SAVE VAULT', 'Time Jumper Save Booth \u00b7 ' + Ar.length + ' archived \u00b7 ' + Pn.length + ' waiting', html, '<button class="bigBtn" id="pvOk">BACK</button>');
    on('pvOk', function () { close(); });
    Ar.forEach(function (p, i) { GA.PVD.check(p).then(function (ok) { var b = $('pvBeta' + i); if (!b) return; b.disabled = !ok; b.textContent = ok ? '\u25B6 PLAY BETA' : 'OFFLINE'; if (ok) b.onclick = function () { playBeta(p); }; }); });
  }
  UI.openVault = openVault;
  function playBeta(p) { ev('pvBeta'); lili('Final Beta loading. Separate save. Mind the bugs. They are vintage.'); toast('\uD83D\uDCBE Loading the ' + p.name + ' Final Beta (its own save)', 2400); close(true); GA.Hub.savePos(); var f = $('fade'); if (f) f.classList.add('on'); setTimeout(function () { UI._nav(p.url); }, 380); setTimeout(function () { if (f) f.classList.remove('on'); }, 4000); }
  UI.playBeta = playBeta;
  function openLili(line) {
    var q = qa(); if (!q.hi) mark('hi');
    var s = line || pick(L.hi); lili(s);
    show('pv_lili', 'LILI', 'Ratita Industries \u00b7 Quality Assurance \u00b7 Mimi\u2019s & Lily\u2019s distant cousin', liliNote(s) +
      '<div class="pvAsk"><button id="pvA_who">\uD83E\uDD16 Who are you?</button><button id="pvA_cousins">\uD83D\uDC2D Your cousins?</button><button id="pvA_jumper">\u23F3 The Time Jumper?</button><button id="pvA_next">\uD83D\uDCC5 What\u2019s next?</button><button id="pvA_gus">\uD83D\uDDC4\uFE0F Gus?</button><button id="pvA_barnaby">\uD83C\uDF6A Barnaby?</button><button id="pvA_vault">\uD83D\uDCBE The Save Vault?</button></div>' + qaHtml(),
      '<button class="bigBtn" id="pvBye">BYE, LILI</button>');
    ['who', 'cousins', 'jumper', 'next', 'gus', 'barnaby', 'vault'].forEach(function (k) { on('pvA_' + k, function () { snd('point'); openLili(k === 'jumper' && !M().previews.length ? pick(L.jumper.concat(L.empty)) : k === 'vault' ? vaultLine() : pick(L[k])); }); });
    on('pvBye', function () { lili(pick(['Goodbye. Touch nothing on the way out.', 'Farewell. Come back when there is something new. I will know first.', 'Bye. Tell Mimi I said... hello. Normally. Not with emojis.'])); close(); });
  }
  UI.openLili = openLili;

  /* ---------- posters ---------- */
  function openPoster(slot) {
    var s = PR.posters()[slot], it = s && s.it; mark('posters', slot);
    if (!it) { show('pv_poster', 'YOUR IDEA HERE', 'An empty spot on the poster wall', liliNote('Every poster on this wall started as somebody\u2019s idea. Go to the DLC Machine in the Hall of Records, or the Suggestion Booth on the arcade floor. When the builders pick it up, it shows up here. Automatically. I checked.'), '<button class="bigBtn" id="pvOk">OKAY!</button>'); on('pvOk', function () { close(); }); return; }
    var st = PR.STC[it.stage] || PR.STC.queued, url = GA.PVD.cover(it.game);
    var img = url ? '<div class="pvPosterImg"><img src="' + esc(url) + '" alt=""></div>' : '<div class="pvPosterImg arcade"><span>GROK</span><span>ARCADE</span></div>';
    show('pv_poster', it.name, it.gname + (it.size ? ' \u00b7 ' + it.size : '') + (it.issue ? ' \u00b7 #' + it.issue : ''),
      img + '<div class="pvPill" style="background:' + st[1] + '">' + esc(st[0]) + (it.when && it.when.toLowerCase() !== st[0].toLowerCase() ? ' \u00b7 ' + esc(it.when) : '') + '</div>' +
      (it.what ? '<p class="pvWhat">' + esc(it.what) + '</p>' : '<p class="pvWhat">' + esc(it.title || 'A new build for ' + it.gname + '.') + '</p>') +
      liliNote(it.stage === 'building' ? 'This one is in the lab right now. When it really works, a preview might show up in my Jumper. Might. I have standards.' : it.stage === 'queued' ? 'Queued. The builders get to it after the ones above it. No, you cannot bribe them. I tried. With cheese.' : 'Shipped! It is in the real game now. Go play it.'),
      (it.url ? '<a class="pill" href="' + esc(it.url) + '" target="_blank" rel="noopener">SEE IT ON GITHUB</a> ' : '') + '<button class="bigBtn" id="pvOk">COOL!</button>');
    on('pvOk', function () { close(); });
  }
  UI.openPoster = openPoster;

  /* ---------- board ---------- */
  function openBoard() {
    mark('board'); var m = M(), st = GA.PVD.state;
    function col(title, color, L2) { return '<div class="pvCol"><h4 style="color:' + color + '">' + title + '</h4>' + (L2.length ? L2.map(function (it) { return '<div class="pvRow"><b>' + esc(GA.PVD.boardName(it)) + '</b><span>' + esc(it.gname || '') + (it.size ? ' \u00b7 ' + esc(it.size) : '') + (it.when ? ' \u00b7 ' + esc(it.when) : '') + '</span>' + (it.what ? '<i>' + esc(it.what) + '</i>' : '') + '</div>'; }).join('') : '<div class="pvRow dim">nothing here right now</div>') + '</div>'; }
    var src = m.live ? (st.src === 'live' ? 'Live from GitHub just now' : 'Live data from earlier (saved)') : 'Saved schedule (could not reach GitHub' + (st.err === 'ratelimit' ? ': too many checks, try in a bit' : '') + ')';
    show('pv_board', 'SCHEDULED ADDITIONS', 'What\u2019s being built, what\u2019s next, what just shipped', '<div class="pvCols">' + col('\uD83D\uDD34 BUILDING NOW', '#fb7185', m.building) + col('\uD83D\uDFE2 UP NEXT', '#5eead4', m.queued) + col('\u2705 JUST SHIPPED', '#4ade80', m.shipped) + '</div><div class="pvSrc">' + esc(src) + (m.updated ? ' \u00b7 preview.json ' + esc(m.updated) : '') + '</div>',
      '<button class="pill" id="pvRef">\u21BB REFRESH</button> <button class="bigBtn" id="pvOk">DONE</button>');
    on('pvOk', function () { close(); }); on('pvRef', function () { var b = $('pvRef'); if (b) { b.disabled = true; b.textContent = 'CHECKING\u2026'; } GA.PVD.refresh(true).then(function () { if (GA.AreasUI.kind && GA.AreasUI.kind() === 'pv_board') openBoard(); }); });
  }
  UI.openBoard = openBoard;

  /* ---------- the Time Jumper panel ---------- */
  function openJumper() {
    var m = M(), c = cooling();
    if (c > 0) {
      show('pv_jumper', 'TIME JUMPER', 'Rebooting\u2026', '<div class="pvBig">\u23F3 ' + c + 's</div>' + liliNote(pick(L.grumble)) + '<p class="pvWhat">Lili is rebooting the Jumper. Wait a few seconds, or help: smack the big REBOOT button 5 times!</p><div class="pvRebootWrap"><button id="pvReboot" class="pvReboot">REBOOT</button><div id="pvRebootN">0 / 5</div></div>',
        '<button class="bigBtn" id="pvOk">I\u2019LL WAIT</button>');
      var n = 0; on('pvReboot', function () { n++; snd('point'); var e = $('pvRebootN'); if (e) e.textContent = n + ' / 5'; var b = $('pvReboot'); if (b) { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); } if (n >= 5) { endReboot(true); openJumper(); } });
      on('pvOk', function () { close(); }); return;
    }
    var html = '', P = m.previews;
    if (P.length) {
      html = '<div class="pvWip">\u26A0 WORK IN PROGRESS \u00b7 previews may be buggy \u00b7 they use their OWN save, your real saves are safe</div>' + P.map(function (p, i) { return '<div class="pvPrev"><div><b>' + esc(p.name) + '</b><span>' + esc(p.gname) + (p.built ? ' \u00b7 snapshot ' + esc(p.built) : '') + '</span>' + (p.notes ? '<i>' + esc(p.notes) + '</i>' : '') + '</div><button class="bigBtn" id="pvGo' + i + '" disabled>CHECKING\u2026</button></div>'; }).join('');
    } else {
      var nx = m.building.concat(m.queued).slice(0, 3);
      html = '<div class="pvEmpty"><div class="pvBig">\uD83D\uDCA4</div><b>Nothing in the Jumper right now.</b><p>No build is playable yet. Builds still being made live on the poster wall and the Scheduled Additions board until they really work.</p>' + (nx.length ? '<div class="pvNext">Coming up: ' + nx.map(function (x) { return esc(x.name); }).join(' \u00b7 ') + '</div>' : '') + '</div>' + liliNote(pick(L.empty));
    }
    show('pv_jumper', 'TIME JUMPER', 'Ratita Industries Model TJ-3 \u00b7 jumps logged: ' + jumps(), html, (P.length ? '' : '<button class="pill" id="pvCal">\u26A1 CALIBRATION JUMP</button> ') + '<button class="bigBtn" id="pvOk">BACK</button>');
    on('pvOk', function () { close(); }); on('pvCal', function () { doJump(null); });
    P.forEach(function (p, i) { GA.PVD.check(p).then(function (ok) { var b = $('pvGo' + i); if (!b) return; b.disabled = !ok; b.textContent = ok ? 'JUMP IN!' : 'NOT READY'; if (ok) b.onclick = function () { doJump(p); }; }); });
  }
  UI.openJumper = openJumper;

  /* ---------- jump sequence ---------- */
  function camJump() { var x = PR.JUMPER.x, z = PR.JUMPER.z; GA.Hub.setCamOverride(function () { return [x + 3.4, 3.4, z - 8.6, x, 2.2, z]; }); }
  function flash(col, ms) { var f = $('pvFlash'); if (!f) { f = document.createElement('div'); f.id = 'pvFlash'; document.body.appendChild(f); } f.style.background = col || '#e0fffb'; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); setTimeout(function () { f.classList.remove('on'); }, ms || 500); }
  function glitchScreen(ms) { var g = $('pvGlitch'); if (!g) { g = document.createElement('div'); g.id = 'pvGlitch'; g.innerHTML = '<i></i><i></i><i></i><b>ERR0R</b>'; document.body.appendChild(g); } g.classList.add('on'); if (PR.glitchFx) PR.glitchFx((ms || 1200) / 1000); setTimeout(function () { g.classList.remove('on'); }, ms || 1200); }
  UI.glitchScreen = glitchScreen;
  function hideP() { ['prompt', 'playBtn'].forEach(function (id) { var e = $(id); if (e) e.classList.add('hidden'); }); document.body.classList.remove('near'); }
  function release() { GA.Hub.setCamOverride(null); GA.Hub.setLock(false); J.busy = false; refreshJumper(); var n = GA.Hub.near && GA.Hub.near(); if (n && GA.Hub.onNear && !(GA.AreasUI.kind && GA.AreasUI.kind())) GA.Hub.onNear(n); }
  function survived(how) { J.grace = true; ev('pvGlitch'); var s = load('grokArcade.pvMal', { n: 0 }); s.n = (s.n || 0) + 1; s.last = J.mal; s.how = how; store('grokArcade.pvMal', s); J.mal = null; }
  function doJump(p, opts) {
    opts = opts || {}; if (J.busy) return false; if (cooling() > 0) { toast('\u23F3 The Time Jumper is rebooting. ' + cooling() + 's to go!'); return false; }
    var n = jumps() + 1; store(K_J, n); mark('jump');
    var mal = opts.noMal ? null : pickMal(n, p); J.busy = true; J.mal = mal; J.pend = p; UI.lastMal = mal;
    close(true); GA.Hub.setLock(true); hideP(); camJump(); if (PR.jumpFx) PR.jumpFx(2.2); if (PR.drawHolo) PR.drawHolo(mal === 'sparks' || mal === 'glitch' || mal === 'wrong' ? 'JUMPING\u2026?!' : 'JUMPING\u2026'); snd('open');
    if (mal === 'sparks') setTimeout(function () { if (PR.spark) PR.spark(40); glitchScreen(1100); GA.Hub.shake(0.4); snd('lifelost'); lili(pick(L.grumble)); if (PR.liliMood) PR.liliMood('squint', 2.5); }, 700);
    if (mal && mal !== 'sparks') setTimeout(function () { if (PR.spark) PR.spark(26); GA.Hub.shake(0.5); if (PR.glitchFx) PR.glitchFx(1.2); if (PR.liliMood) PR.liliMood('glitch', 2.5); }, 900);
    setTimeout(function () { flash(mal && mal !== 'sparks' ? '#ff00ff' : '#e0fffb', 520); }, 1500);
    setTimeout(function () { land(p, mal); }, 1750);
    return true;
  }
  UI.doJump = doJump;
  function land(p, mal) {
    if (!mal || mal === 'sparks') { if (mal === 'sparks') survived('sparks'); return finish(p, mal === 'sparks'); }
    if (mal === 'wrong') { var others = M().previews.filter(function (q) { return !p || q.id !== p.id; }); if (others.length) { var w = pick(others); survived('wrong'); toast('\u26A1 JUMP DRIFT! The Jumper landed you in ' + w.name + ' instead. Lili: \u201CClose enough. Ugh.\u201D', 4200); lili(pick(L.grumble)); return setTimeout(function () { finish(w); }, 900); } mal = J.mal = 'glitch'; }
    if (mal === 'glitch') return toGlitch();
    release(); lili(pick(L.grumble), 5); snd('lifelost');
    if (mal === 'reboot') return startReboot(15);
    if (mal === 'whack') return whackTask();
    if (mal === 'rewire') return rewireTask();
    if (mal === 'part') return partTask();
    finish(p);
  }
  function finish(p, quiet) {
    if (p) { ev('pvPreview'); toast('\u23F3 Jumping into ' + p.name + ' (work in progress!)', 2400); GA.Hub.savePos(); var f = $('fade'); if (f) f.classList.add('on'); setTimeout(function () { UI._nav(p.url); }, 380); setTimeout(function () { if (f) f.classList.remove('on'); release(); }, 4000); return; }
    release(); snd('perfect'); var d = day(), bonus = !d.cal; if (bonus) { d.cal = 1; store(K_DAY, d); pay(3); }
    if (!quiet) lili(pick(L.calib), 5); toast('\u26A1 Calibration jump complete!' + (quiet ? ' (with bonus sparks)' : '') + (bonus ? ' +3 tickets (once a day)' : ''), 3200); if (PR.liliMood) PR.liliMood('happy', 2);
  }

  /* ---------- malfunction: GL1TCH R00M ---------- */
  function toGlitch() {
    var G = PR.GLITCH; GA.Hub.setCamOverride(null); GA.Hub.setPlayer(G.spawn.x, G.spawn.z); GA.Hub.setFace(0); GA.Hub.cameraYaw(Math.PI); GA.Hub.setLock(false); J.busy = false; J.glitch = true;
    glitchScreen(900); snd('lifelost'); toast('\u26A1 MALFUNCTION! You landed in the GL1TCH R00M. Walk into the portal (or tap JUMP BACK) to go back.', 5200); backBtn(true);
  }
  function glitchBack() { backBtn(false); flash('#e0fffb', 500); GA.Hub.teleport('pv_jumper'); J.glitch = false; if (J.mal === 'glitch' || J.mal == null) survived('glitchroom'); setTimeout(function () { lili(pick(L.glitchBack), 5); }, 400); refreshJumper(); }
  UI.glitchBack = glitchBack;
  function backBtn(b) { var e = $('pvBack'); if (!e && b) { e = document.createElement('button'); e.id = 'pvBack'; e.textContent = '\u23EA JUMP BACK'; e.addEventListener('click', function () { if (GA.Hub.area() === 'glitch') glitchBack(); else backBtn(false); }); document.body.appendChild(e); } if (e) e.classList.toggle('on', !!b); }
  function grabCheese() { var d = day(); if (d.cheese) { toast('\uD83E\uDDC0 You already grabbed today\u2019s glitch cheese. It will glitch back tomorrow.'); return; } d.cheese = 1; store(K_DAY, d); pay(5); snd('perfect'); toast('\uD83E\uDDC0 GLITCH CHEESE! +5 tickets (it tastes like three Tuesdays)', 3600); }

  /* ---------- malfunction: reboot cooldown ---------- */
  var rbT = null;
  function startReboot(secs, cause) { J.cause = cause || pick(['Mimi\u2019s wiring', 'Lily\u2019s timer', 'Pi-rat\u2019s flag', 'Snowie\u2019s -ish']); J.coolUntil = Date.now() + secs * 1000; refreshJumper(); toast('\u23F3 The Time Jumper is rebooting (' + secs + 's). Lili is on it. Tap the Jumper to help speed it up!', 4200);
    clearInterval(rbT); rbT = setInterval(function () { if (cooling() <= 0) endReboot(false); else refreshJumper(); }, 1000); }
  UI.startReboot = startReboot;
  function endReboot(helped) { clearInterval(rbT); rbT = null; var was = J.coolUntil > 0; J.coolUntil = 0; refreshJumper(); if (!was) return; if (J.mal === 'reboot' || helped) survived(helped ? 'helped' : 'waited'); else J.mal = null; snd('perfect'); lili(helped ? pick(L.fixed) : 'Reboot complete. Jumper online. No thanks to my cousins.'); toast('\u2705 The Time Jumper is back online!', 2600); }
  UI.endReboot = endReboot;
  function letLili(secs) { close(true); lili(pick(L.selfFix)); J.part = null; if (PR.hidePart) PR.hidePart(); startReboot(secs || 6, 'Lili fixing it herself'); J.mal = 'reboot'; }

  /* ---------- malfunction: whack the panel ---------- */
  function whackTask() {
    var need = 6, n = 0;
    show('pv_fix', 'MALFUNCTION!', 'The side panel is rattling loose', liliNote('The side panel is loose again. Give it a few good whacks. Firmly. Lovingly. Firmly.') + '<div class="pvWhackWrap"><button id="pvWhack" class="pvWhack"><span>RATITA</span><small>panel 7-B</small></button><div class="pvMeter"><i id="pvWhackM"></i></div></div>',
      '<button class="pill" id="pvLili">LET LILI HANDLE IT</button>');
    on('pvWhack', function () { n++; snd('point'); GA.Hub.shake(0.15); var b = $('pvWhack'); if (b) { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); } var m = $('pvWhackM'); if (m) m.style.width = Math.min(100, n / need * 100) + '%'; if (n >= need) fixedJob('whack'); });
    on('pvLili', function () { letLili(6); });
  }
  /* ---------- malfunction: rewire 4 plugs ---------- */
  var WIRES = [['#fb7185', 'cheese'], ['#5eead4', 'time'], ['#fbbf24', 'zap'], ['#a78bfa', 'nap']];
  function rewireTask() {
    var right = shuffle([0, 1, 2, 3]), sel = null, done = {};
    function render() { var w = $('pvWires'); if (!w) return; w.innerHTML = '<div class="pvWcol">' + [0, 1, 2, 3].map(function (i) { return '<button class="pvPlug' + (done[i] ? ' ok' : '') + (sel === i ? ' sel' : '') + '" data-l="' + i + '" style="--c:' + WIRES[i][0] + '">' + (done[i] ? '\u2714' : '') + ' ' + WIRES[i][1] + '</button>'; }).join('') + '</div><div class="pvWmid">' + Object.keys(done).map(function (i) { return '<i style="background:' + WIRES[i][0] + '"></i>'; }).join('') + '</div><div class="pvWcol">' + right.map(function (i) { return '<button class="pvSock' + (done[i] ? ' ok' : '') + '" data-r="' + i + '" style="--c:' + WIRES[i][0] + '">' + WIRES[i][1] + ' ' + (done[i] ? '\u2714' : '\u25CF') + '</button>'; }).join('') + '</div>';
      w.querySelectorAll('[data-l]').forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-l'); if (done[i]) return; sel = i; snd('point'); render(); }; });
      w.querySelectorAll('[data-r]').forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-r'); if (done[i] || sel == null) return; if (i === sel) { done[i] = 1; snd('point'); } else { snd('lifelost'); if (PR.spark) PR.spark(10); var h = $('pvWireHint'); if (h) h.textContent = 'Bzzt! Wrong socket. Match the colors!'; } sel = null; render(); if (Object.keys(done).length === 4) fixedJob('rewire'); }; }); }
    UI._wires = { right: right, done: done };
    show('pv_fix', 'MALFUNCTION!', 'The wires came unplugged', liliNote('Someone plugged CHEESE into NAP. I wonder who. (Mimi.) Tap a plug on the left, then the socket with the same color.') + '<div id="pvWires" class="pvWires"></div><div class="pvHint" id="pvWireHint">Plug all 4 back in.</div>', '<button class="pill" id="pvLili">LET LILI HANDLE IT</button>');
    render(); on('pvLili', function () { letLili(6); });
  }
  /* ---------- malfunction: the cheese-cog popped out ---------- */
  function partTask() {
    var i = Math.floor(Math.random() * (PR.PART_SPOTS ? PR.PART_SPOTS.length : 1)); if (UI.forcePartSpot != null) i = UI.forcePartSpot;
    J.part = { spot: i, got: false }; if (PR.showPart) PR.showPart(i); refreshJumper();
    toast('\u2699\uFE0F A CHEESE-COG popped out of the Time Jumper and rolled away! Find it (look for the sparkles) and bring it back.', 5200);
    show('pv_fix', 'MALFUNCTION!', 'A part rolled away', liliNote('A cheese-cog popped out. It is round. It rolls. Of course it rolled. Find it somewhere in this room and bring it back to the console.') + '<p class="pvWhat">\u2728 Look for a sparkly yellow cog on the floor somewhere in the Preview Center.</p>', '<button class="pill" id="pvLili">LET LILI FIND IT</button> <button class="bigBtn" id="pvOk">I\u2019LL FIND IT!</button>');
    on('pvOk', function () { close(); }); on('pvLili', function () { letLili(8); });
  }
  function grabPart() { if (!J.part) return; J.part.got = true; if (PR.hidePart) PR.hidePart(); snd('point'); toast('\u2699\uFE0F Got the cheese-cog! Bring it back to the Time Jumper console.', 3400); refreshJumper(); }
  function fixPart() { J.part = null; refreshJumper(); fixedJob('part'); }
  function fixedJob(how) {
    close(true); survived(how); pay(2); snd('perfect'); var s = pick(L.fixed); lili(s, 5); if (PR.liliMood) PR.liliMood('happy', 2.5); toast('\uD83D\uDD27 Fixed it! +2 tickets. The Time Jumper is ready again.', 3200); refreshJumper();
    var p = J.pend; J.pend = null; if (p) setTimeout(function () { doJump(p, { noMal: true }); }, 900);
  }

  /* ---------- per-frame: greeting, data refresh, glitch room HUD ---------- */
  var lastArea = null, greeted = false;
  PR.onFrame = function (t, dt, area) {
    if (area !== lastArea) { var was = lastArea; lastArea = area;
      if ((area === 'food' || area === 'preview') && GA.PVD) GA.PVD.refresh();
      if (area === 'preview' && was === 'food' && !greeted) { greeted = true; setTimeout(function () { lili(pick(L.hi), 5); }, 500); }
      if (area !== 'preview' && area !== 'glitch' && area !== 'food') greeted = false;
      backBtn(area === 'glitch'); }
  };
  PR.onData = function () { refreshJumper(); };
  function chronoHook() { if (!GA.MG || !GA.MG.hooks || UI._ch) return; UI._ch = true;
    GA.MG.hooks.start.push(function (id) { if (id === 'chrono') mark('chrono'); });
    GA.MG.hooks.over.push(function (id, score) { if (id !== 'chrono' || score < GA.CHRONO_TARGET) return; if (grant('mini_jumper')) setTimeout(function () { toast('\u23F3 ' + score + ' in Chrono Courier! You won the RARE Mini Time Jumper!', 4600); }, 600); }); }
  chronoHook();
  UI.state = function () { return { J: { busy: J.busy, cooling: cooling(), mal: J.mal, part: J.part, glitch: J.glitch }, jumps: jumps(), qa: qa(), lastLili: UI.lastLili, lastMal: UI.lastMal }; };
})();
