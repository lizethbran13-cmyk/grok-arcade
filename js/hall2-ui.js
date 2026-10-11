/* Grok Arcade - Records Annex (booth #32): walk-up prompts + overlays. Uncle Barnaby (chat, Sort-a-Thon, lost files),
   the Exhibit of the Week, the Game History Library, the Stamp-O-Matic 5000 quiz, the photo booth, and sitting down
   (Gus yells "No loitering!" over the intercom, Barnaby tells him to hush). */
(function () {
  'use strict';
  var UI = GA.Hall2UI = {}, H2 = GA.Hall2;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function snd(n) { try { GA.Audio.play(n); } catch (e) {} }
  function toast(m, ms) { if (GA.Fix && GA.Fix.toast) GA.Fix.toast(m, ms || 3400); }
  function show(kind, title, sub, body, foot, cls) { GA.AreasUI.show(kind, title, sub, body, foot, 'h2Panel ' + (cls || '')); }
  function close(silent) { GA.AreasUI.close(silent); }
  function on(id, f) { var e = $(id); if (e) e.addEventListener('click', f); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pay(n) { if (n > 0) GA.addTickets(n); if (GA.onTickets) GA.onTickets(GA.getTickets()); }
  function ev(k, v) { if (GA.Prog) GA.Prog.event(k, v); }
  function grant(id) { return GA.Prog && GA.Prog.grant ? GA.Prog.grant(id) : false; }
  function barn(s) { return '<div class="arNote h2Barn"><b>Barnaby:</b> \u201C' + esc(s) + '\u201D</div>'; }
  function gusN(s) { return '<div class="arNote gus"><b>Gus:</b> \u201C' + esc(s) + '\u201D</div>'; }
  function short(n) { return String(n).replace(/^Grok\s+/, ''); }
  function gusDist() { var p = GA.Hub.pose(), w = GA.Hub.WING; return Math.hypot(p.x - w.doorX, p.z - (w.minZ + 5.6)); }
  // Gus talks: speech bubble at his desk, and over the intercom when you're too far away to see it
  function gusSay(s, secs) { if (GA.Hall3D && GA.Hall3D.say) GA.Hall3D.say(s, secs || 4.5); if (gusDist() > 9) toast('\uD83D\uDCE2 GUS (intercom): \u201C' + s + '\u201D', 3600); UI.lastGus = s; return s; }
  function barnSay(s, secs) { H2.say(s, secs || 4.5); var p = GA.Hub.pose(); if (Math.hypot(p.x - 16.3, p.z - 39.3) > 11 && !(GA.AreasUI.kind && GA.AreasUI.kind())) toast('\uD83E\uDDD3 BARNABY: \u201C' + s + '\u201D', 3400); UI.lastBarn = s; return s; }
  UI.gusSay = gusSay; UI.barnSay = barnSay;

  /* ---------- lines ---------- */
  var L = UI.LINES = {
    hi: ['Well hello there, friend! Welcome to the Annex! I\u2019m Barnaby, Gus\u2019s uncle. The FUN one.', 'Oh! A visitor! Come in, come in! Mind the folders. Actually, don\u2019t mind them, I\u2019ll pick them up.', 'Hiya, kiddo! Gussy said no visitors back here. So naturally I put out extra chairs.', 'Welcome, welcome! Have a seat! Any seat! Gus will yell, but he yells at clouds too.'],
    chat: ['I taught Gus how to file when he was four. He filed his birthday cake under C for Can\u2019t Have Fun.', 'Gus thinks I\u2019m annoying. I think Gus is wonderful. One of us is right, and it\u2019s me!', 'Little Gus Jr. the 2nd runs the Game Gallery now. He frowns just like his dad. I\u2019m working on both of them.', 'Every morning I hide one smiley face sticker in Gus\u2019s paperwork. He hasn\u2019t found the first one yet. It\u2019s been six years.', 'The secret to sorting is singing! A-F, G-L, M-R, S-Z! ...Gus says I can\u2019t sing. Gus is not the boss of my voice.', 'I sent Gus a hug through the GUS MAIL tube. He sent back a folder labeled NO.', 'When Gus was a baby he frowned at the doctor. The doctor frowned back. Gus respected that.', 'I\u2019m the nicest guy in the family! It\u2019s not a hard contest. Have you MET my nephew?'],
    gusAtB: ['BARNABY. Stop putting stickers in my folders.', 'Barnaby, the Annex closes at nine. It\u2019s ALWAYS nine back there.', 'Uncle Barnaby, if you hum ONE more song I\u2019m filing you under G for GONE.', 'Who put a smiley face on my stamp pad? ...BARNABY.', 'Barnaby, the sofa is NOT a bed. I saw you. I see everything.'],
    bAtG: ['Love you too, Gussy-bear!', 'Gussy, you sound tired. Have you tried SITTING? We have chairs now!', 'He means \u201Cgood morning, Uncle Barnaby, you\u2019re my favorite.\u201D', 'That\u2019s my nephew! Loud as a foghorn, soft as a marshmallow.', 'Don\u2019t mind him, kiddo. He\u2019s been grumpy since the day he was born. Literally. I was there.'],
    sit: ['NO LOITERING! This is a museum, not a nap room!', 'Feet OFF the furniture! ...Are your feet on the furniture? I can FEEL it.', 'Those seats are ANTIQUES. From 2026. Very old.', 'Sitting?! In MY Hall? Five minutes. I\u2019m counting. One... two...', 'Barnaby, did you put out chairs AGAIN?!', 'No sitting! No lounging! No resting your little legs!', 'I hear sitting. Stop sitting. Stand like a proper museum visitor.'],
    sitReply: ['Oh hush, Gussy! Chairs are for sitting. That\u2019s why they\u2019re called chairs!', 'Sit as long as you like, kiddo. I\u2019ll handle him.', 'Ignore him! He\u2019s just jealous he doesn\u2019t have a comfy chair.', 'Gus, they\u2019re RESTING. It\u2019s good for the legs! Doctor\u2019s orders! (I\u2019m not a doctor.)', 'Take a load off! I\u2019ll bring you a mint.'],
    standGus: ['Finally. Thank you. The chair thanks you too.', 'Good. Keep it that way.', 'That chair is now going to be dusted. Twice.'],
    sortGo: ['Okay! Folders come out, you pop them in the right cubby! First letter after \u201CGrok\u201D!', 'Sort-a-Thon time! Don\u2019t worry, there\u2019s no wrong... oh wait, there is. But it\u2019s fine!'],
    sortOk: ['Perfect!', 'Wonderful!', 'You\u2019re a natural!', 'Gus could NEVER.', 'Ooh, snappy!', 'Into the cubby!'],
    sortNo: ['Oopsie! Wrong cubby, but I love the energy!', 'Close! Well, not close. But brave!', 'Ha! That\u2019s where Gus would put it.'],
    file: ['You found one of my lost files! Thank you, kiddo!', 'Ooh, there it is! I must have set it down while humming.', 'A lost file! Gus would\u2019ve blamed me. He\u2019d be right!']
  };
  // Gus gets new things to say about his uncle (front desk + directory)
  if (GA.HallUI && GA.HallUI.LINES) {
    var GL = GA.HallUI.LINES;
    ['My Uncle Barnaby is in the back. \u201CHelping.\u201D He alphabetized my sandwich.', 'There\u2019s an Annex now. With CHAIRS. People SIT in it. I hate it here.', 'If you see my uncle back there, tell him the GUS MAIL tube is for MAIL. Not hugs.', 'Barnaby says I need to \u201Csmile more\u201D. I smiled in 2019. Once was enough.'].forEach(function (l) { GL.talk.push(l); });
    GL.hello.push('Welcome to the Hall. It\u2019s bigger now. Twice the records, twice the... Barnaby.');
  }

  /* ---------- walk-up prompts ---------- */
  UI.prompt = function (cab) {
    var k = cab.kind;
    if (k === 'h2_seat') { var s = H2.SEATS[cab.data.seat], sitting = H2.sitting() === cab.data.seat; return { tag: sitting ? 'TAKING A BREAK' : 'HAVE A SEAT', name: s.name, desc: sitting ? 'Comfy! Move the joystick (or walk) to stand up. Gus is watching.' : 'Sit down and enjoy the Hall. (Gus will not enjoy it.)', btn: sitting ? 'STAND<br>UP' : 'SIT', key: sitting ? 'stand up' : 'sit down', cls: 'gallery', pb: 'galPlay' }; }
    if (k === 'h2_uncle') { var h = H2.hunt(); return { tag: 'SORTING STATION', name: 'Uncle Barnaby', desc: 'Gus\u2019s uncle and the nicest guy in the family. Chat, play his Sort-a-Thon for tickets, or help find his lost files (' + (6 - h.left) + '/6 today).', btn: 'TALK', key: 'talk to Barnaby', cls: 'npc' }; }
    if (k === 'h2_eotw') { var g = GA.findGame(cab.data.gid); return { tag: 'EXHIBIT OF THE WEEK', name: g ? g.name : 'Exhibit', desc: 'This week\u2019s featured game, on a spinning turntable under glass. A new pick every Monday! Visit for a weekly ticket bonus.', btn: 'VIEW', key: 'view the exhibit', cls: 'gallery', pb: 'galPlay' }; }
    if (k === 'h2_books') return { tag: 'READING NOOK', name: 'Game History Library', desc: 'A book for every Grok game, plus the Arcade\u2019s own story and one Barnaby wrote about Gus (Gus did NOT approve it).', btn: 'READ', key: 'pick a book', cls: 'gallery', pb: 'galPlay' };
    if (k === 'h2_quiz') return { tag: 'STAMP-O-MATIC 5000', name: 'Grok Games Quiz', desc: '5 questions about Grok games. Every right answer gets stamped APPROVED and pays tickets. Get all 5 for a rare prize!', btn: 'PLAY', key: 'start the quiz', cls: 'prize', pb: 'pzPlay' };
    if (k === 'h2_photo') return { tag: 'PHOTO BOOTH', name: 'Snap 4 Poses', desc: 'Sit on the stool and the booth takes a 4-picture photo strip of YOU. Free! Save it to your phone.', btn: 'PHOTO', key: 'take photos', cls: 'prize', pb: 'pzPlay' };
    if (k === 'h2_file') { var hh = H2.hunt(); return { tag: 'LOST FILE', name: 'One of Barnaby\u2019s files!', desc: 'He lost 6 files around the Hall today. You have found ' + (6 - hh.left) + '. Pick it up!', btn: 'PICK<br>UP', key: 'pick it up', cls: 'prize', pb: 'pzPlay' }; }
    return null;
  };
  UI.open = function (cab) {
    var k = cab.kind;
    if (k === 'h2_seat') return toggleSit(cab.data.seat);
    if (k === 'h2_uncle') return openUncle();
    if (k === 'h2_eotw') return openEotw(cab);
    if (k === 'h2_books') return openLibrary();
    if (k === 'h2_quiz') return openQuiz();
    if (k === 'h2_photo') return openPhoto();
    if (k === 'h2_file') return pickFile(cab);
  };
  function refresh() { setTimeout(function () { if (GA.UI && GA.UI.refreshPrompt) GA.UI.refreshPrompt(); }, 40); }

  /* ---------- sitting ---------- */
  function toggleSit(id) {
    if (H2.sitting() === id) { H2.stand(); refresh(); return; }
    if (H2.sitting()) H2.stand();
    H2.sit(id); snd('click'); refresh();
    var tNow = performance.now(); if (tNow - (UI._sitT || -1e9) > 9000) { UI._sitT = tNow; gusSay(pick(L.sit), 4.2); setTimeout(function () { if (H2.sitting()) barnSay(pick(L.sitReply), 4.2); }, 2600); }
    return true;
  }
  H2.onStand = function () { refresh(); if (Math.random() < 0.4) gusSay(pick(L.standGus), 3); };

  /* ---------- Uncle Barnaby ---------- */
  function openUncle(msg) {
    var h = H2.hunt(), done = 6 - h.left, best = GA.store.get('h2SortBest', 0);
    var huntBtn = h.paid ? '<button class="pill" disabled>\uD83D\uDCC1 Files: all found today \u2713</button>' : done >= 6 ? '<button class="bigBtn" id="h2Turn">\uD83D\uDCC1 HAND IN 6 FILES</button>' : '<button class="pill" id="h2Hunt">\uD83D\uDCC1 Lost files: ' + done + '/6</button>';
    show('h2uncle', '\uD83E\uDDD3 UNCLE BARNABY', 'Assistant Archivist \u00b7 Gus\u2019s uncle \u00b7 professional nice guy',
      '<div class="h2Face" aria-hidden="true"><i class="hair"></i><i class="e1"></i><i class="e2"></i><i class="sm"></i><i class="bt"></i></div>' + barn(msg || (UI._hiDone ? pick(L.chat) : pick(L.hi))) +
      '<div class="arNote dim">Sort-a-Thon best: <b>' + best + '</b> folders \u00b7 pays up to 15 tickets a round.</div>',
      '<button class="bigBtn" id="h2Sort">\uD83D\uDDC2\uFE0F SORT-A-THON</button>' + huntBtn + '<button class="pill" id="h2Chat">\uD83D\uDCAC CHAT</button><button class="pill" id="h2Bye">BYE</button>');
    if (!UI._hiDone) { UI._hiDone = true; ev('h2Barnaby'); }
    H2.say(msg || pick(L.chat), 4);
    on('h2Sort', function () { snd('click'); startSort(); });
    on('h2Chat', function () { snd('click'); var l = pick(L.chat); openUncle(l); if (Math.random() < 0.45) setTimeout(function () { gusSay(pick(L.gusAtB), 4); }, 2200); });
    on('h2Hunt', function () { snd('click'); openUncle('I lost 6 files somewhere in the Hall today! Front room, back room, behind things... they glow a little. Bring them back and I\u2019ll pay you 20 tickets!'); });
    on('h2Turn', function () { snd('powerup'); turnIn(); });
    on('h2Bye', function () { close(); H2.say('Bye bye! Come back soon! Bring snacks!', 3); });
    return true;
  }
  function turnIn() {
    if (!H2.payHunt()) return openUncle();
    pay(20); ev('h2Hunt'); var gift = grant('pl_barnaby');
    openUncle('ALL SIX! You\u2019re a hero! Here are 20 tickets' + (gift ? ', and my very own BOBBLEHEAD. It nods at everything Gus says. Gus hates it.' : '! Same time tomorrow? I\u2019ll lose them again. I promise.'));
    toast('\uD83D\uDCC1 All 6 lost files returned! +20 tickets' + (gift ? ' \u00b7 RARE prize: Barnaby Bobblehead!' : ''), 4200);
    setTimeout(function () { gusSay('Barnaby lost files AGAIN? ...Thanks for finding them. Don\u2019t tell him I said thanks.', 4.5); }, 2500);
  }
  function pickFile(cab) {
    var r = H2.pickFile(cab.data.spot); if (!r) return true; snd('coin');
    var left = r.total - r.found;
    toast('\uD83D\uDCC1 Lost file ' + r.found + '/' + r.total + (left ? ' \u00b7 ' + left + ' more hiding in the Hall!' : ' \u00b7 that\u2019s all of them! Take them to Barnaby.'), 3400);
    barnSay(left ? pick(L.file) : 'You found ALL of them?! Bring them over, bring them over!', 3.6);
    refresh(); return true;
  }
  UI.turnIn = turnIn;

  /* ---------- Sort-a-Thon ---------- */
  var BINS = [['A\u2013F', 'A', 'F'], ['G\u2013L', 'G', 'L'], ['M\u2013R', 'M', 'R'], ['S\u2013Z', 'S', 'Z']];
  function binOf(name) { var c = short(name).charAt(0).toUpperCase(); for (var i = 0; i < BINS.length; i++) if (c >= BINS[i][1] && c <= BINS[i][2]) return i; return 3; }
  UI.binOf = binOf;
  var SR = UI.sort = { on: false };
  function startSort() {
    var gs = H2.games();
    SR.on = true; SR.score = 0; SR.miss = 0; SR.streak = 0; SR.end = performance.now() + 40000; SR.deck = []; SR.game = null; SR.over = false;
    show('h2sort', '\uD83D\uDDC2\uFE0F BARNABY\u2019S SORT-A-THON', 'Pop each folder in its cubby: first letter after \u201CGrok\u201D',
      '<div class="h2SortHud"><span id="h2SortT">40.0 s</span><span id="h2SortS">0 filed</span></div><div class="h2Bar"><i id="h2SortBar"></i></div>' +
      '<div class="h2Folder" id="h2Folder"><small>FILE THIS:</small><b id="h2FName"></b><span id="h2FLetter"></span></div><div class="h2Msg" id="h2SortMsg">' + esc(pick(L.sortGo)) + '</div>' +
      '<div class="h2Bins">' + BINS.map(function (b, i) { return '<button class="h2Bin" data-bin="' + i + '"><i></i>' + b[0] + '</button>'; }).join('') + '</div>', '<button class="pill" id="h2SortQuit">STOP</button>');
    Array.prototype.forEach.call(document.querySelectorAll('.h2Bin'), function (b) { b.addEventListener('click', function () { UI.sortAnswer(+b.getAttribute('data-bin')); }); });
    on('h2SortQuit', function () { finishSort(); });
    function next() { if (!SR.deck.length) SR.deck = shuffle(gs); SR.game = SR.deck.pop(); var f = $('h2Folder'); if (!f) return; $('h2FName').textContent = short(SR.game.name); $('h2FLetter').textContent = short(SR.game.name).charAt(0).toUpperCase(); f.style.setProperty('--c', SR.game.color || '#e8b85a'); f.classList.remove('pop'); void f.offsetWidth; f.classList.add('pop'); }
    SR.next = next; next();
    clearInterval(SR.iv); SR.iv = setInterval(function () {
      if (!SR.on) { clearInterval(SR.iv); return; } if (GA.AreasUI.kind() !== 'h2sort') { SR.on = false; clearInterval(SR.iv); return; }
      var left = Math.max(0, SR.end - performance.now()); $('h2SortT').textContent = (left / 1000).toFixed(1) + ' s'; $('h2SortBar').style.width = (left / 400) + '%';
      if (left <= 0) finishSort();
    }, 100);
    H2.say(pick(L.sortGo), 3.5);
  }
  UI.sortAnswer = function (bin) {
    if (!SR.on || !SR.game) return null; var right = binOf(SR.game.name) === bin, msg = $('h2SortMsg');
    if (right) { SR.score++; SR.streak++; snd('coin'); if (SR.streak % 5 === 0) { SR.end += 2000; if (msg) msg.textContent = '\uD83D\uDD25 ' + SR.streak + ' in a row! +2 seconds!'; } else if (msg) msg.textContent = pick(L.sortOk); }
    else { SR.miss++; SR.streak = 0; SR.end -= 1000; snd('buzz'); if (msg) msg.textContent = pick(L.sortNo) + ' (' + short(SR.game.name) + ' goes in ' + BINS[binOf(SR.game.name)][0] + ')'; var f = $('h2Folder'); if (f) { f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); } }
    if ($('h2SortS')) $('h2SortS').textContent = SR.score + ' filed'; SR.next(); return right;
  };
  function finishSort() {
    if (!SR.on) return; SR.on = false; SR.over = true; clearInterval(SR.iv);
    var tix = Math.min(15, SR.score), best = GA.store.get('h2SortBest', 0), nb = SR.score > best; if (nb) GA.store.set('h2SortBest', SR.score);
    pay(tix); ev('h2Sort', SR.score); SR.last = { score: SR.score, miss: SR.miss, tix: tix };
    var line = SR.score >= 12 ? 'TWELVE OR MORE?! I\u2019m putting your name on the Employee of the Month board. It\u2019s just my name right now.' : SR.score >= 6 ? 'Lovely sorting! Gus took three weeks to learn that.' : 'Every folder counts! Want another go?';
    show('h2sortdone', '\uD83D\uDDC2\uFE0F SORT-A-THON DONE', SR.score + ' folders filed' + (nb ? ' \u00b7 NEW BEST!' : ''), '<div class="h2Big">+' + tix + ' \uD83C\uDF9F\uFE0F</div>' + barn(line), '<button class="bigBtn" id="h2SortAgain">AGAIN</button><button class="pill" id="h2SortBack">BACK</button>');
    on('h2SortAgain', function () { snd('click'); startSort(); }); on('h2SortBack', function () { snd('click'); openUncle(); });
    H2.say(line, 4.5);
  }
  UI.finishSort = finishSort;

  /* ---------- Exhibit of the Week ---------- */
  function openEotw(cab) {
    var gid = cab.data.gid, wk = 'w' + H2.weekNo(), seen = GA.store.get('h2Eotw', ''), bonus = seen !== wk;
    if (bonus) { GA.store.set('h2Eotw', wk); pay(3); toast('\u2B50 Exhibit of the Week visit: +3 tickets! Come back next Monday for a new one.', 3600); ev('h2Eotw'); }
    GA.Hall.open(gid); return true;
  }

  /* ---------- Game History Library ---------- */
  var BOOKS = null, LB = { book: null, page: 0 };
  function books() {
    if (BOOKS) return BOOKS;
    BOOKS = [];
    var AH = GA.ARCADE_HISTORY || [];
    if (AH.length) BOOKS.push({ id: 'arcade', title: 'The Grok Arcade Story', by: 'by Gus (with his good pen)', col: '#ff4fd8', pages: AH.map(function (e) { return { h: 'v' + e.ver + ' \u00b7 ' + e.date, t: e.title, p: e.text }; }) });
    BOOKS.push({ id: 'gus', title: 'Gus: The Unauthorized Biography', by: 'by Uncle Barnaby', col: '#7df9a0', pages: [
      { h: 'Chapter 1', t: 'A Frowny Baby', p: 'Gus was born frowning. The nurse said he was the grumpiest baby she had ever seen. Gus frowned harder. It was a proud day for the family.' },
      { h: 'Chapter 2', t: 'The Filing Years', p: 'At age four, Gus filed his toys alphabetically. At age five he filed his family. I was under B for Barnaby, and also under N for Nope.' },
      { h: 'Chapter 3', t: 'The Arcade', p: 'Gus worked the token booth in the OLD Grok Arcade back in 1983. Rumour says a kid in a funny jacket visited once and said hi. Gus still talks about it. Grumpily.' },
      { h: 'Chapter 4', t: 'Gus Jr. the 2nd', p: 'Gus named his son Gus Jr. the 2nd \u201Cjust to confuse everyone.\u201D It worked. Now little Gus runs the Game Gallery and frowns at people with love.' },
      { h: 'Chapter 5', t: 'The Hall of Records', p: 'Gus became the Archivist and said NO CHAIRS. I became the Assistant Archivist and bought eleven chairs. We are both very happy. One of us shows it.' },
      { h: 'Epilogue', t: 'Secretly Soft', p: 'Don\u2019t tell him I told you: Gus keeps every drawing a visitor ever gave him in his top drawer. Under S for Special. Shh!' }] });
    H2.games().forEach(function (g) { var d = GA.HALL_DATA[g.id]; BOOKS.push({ id: g.id, gid: g.id, title: 'The History of ' + g.name, by: d.history.length + ' updates \u00b7 ' + d.repo, col: g.color || '#ffe14d', pages: d.history.map(function (e) { return { h: 'v' + e.ver + ' \u00b7 ' + e.date, t: e.title, p: e.text }; }) }); });
    return BOOKS;
  }
  function openLibrary() {
    var bs = books(), read = GA.store.get('h2Read', {});
    show('h2lib', '\uD83D\uDCDA GAME HISTORY LIBRARY', bs.length + ' books \u00b7 ' + Object.keys(read).length + ' read \u00b7 the nook is very cozy',
      '<div class="h2Shelf">' + bs.map(function (b) { return '<button class="h2Book" data-b="' + b.id + '" style="--c:' + b.col + '"><b>' + esc(b.title) + '</b><small>' + esc(b.by) + (read[b.id] ? ' \u00b7 \u2713 read' : '') + '</small></button>'; }).join('') + '</div>' + barn('Pick any book! The comfy armchairs are right there. Gus says they\u2019re \u201Cnot for sitting.\u201D They are SO for sitting.'),
      '<button class="pill" id="h2LibX">CLOSE</button>');
    Array.prototype.forEach.call(document.querySelectorAll('.h2Book'), function (b) { b.addEventListener('click', function () { snd('click'); openBook(b.getAttribute('data-b'), 0); }); });
    on('h2LibX', function () { close(); });
    return true;
  }
  function openBook(id, page) {
    var b = books().find(function (x) { return x.id === id; }); if (!b) return false;
    var per = 3, n = Math.ceil(b.pages.length / per); page = Math.max(0, Math.min(n - 1, page)); LB.book = id; LB.page = page;
    var items = b.id === 'arcade' || b.gid ? b.pages.slice().reverse() : b.pages; // newest first for update logs
    var cur = items.slice(page * per, page * per + per);
    if (page === n - 1) { var read = GA.store.get('h2Read', {}); if (!read[id]) { read[id] = 1; GA.store.set('h2Read', read); ev('h2Read', Object.keys(read).length); } }
    show('h2book', '\uD83D\uDCD6 ' + esc(b.title.toUpperCase()), esc(b.by) + ' \u00b7 page ' + (page + 1) + ' of ' + n,
      '<div class="h2Page" style="--c:' + b.col + '">' + cur.map(function (e) { return '<div class="h2Ch"><small>' + esc(e.h) + '</small><b>' + esc(e.t) + '</b><p>' + esc(e.p) + '</p></div>'; }).join('') + '</div>' + (b.gid ? '<div class="arNote dim">Want pictures and old versions? Visit the ' + esc(GA.findGame(b.gid).name) + ' exhibit, or ask Gus at the Records Desk.</div>' : ''),
      '<button class="pill" id="h2Pg0"' + (page ? '' : ' disabled') + '>\u25C0</button><button class="pill" id="h2PgL">\uD83D\uDCDA BOOKS</button><button class="pill" id="h2Pg1"' + (page < n - 1 ? '' : ' disabled') + '>\u25B6</button>');
    on('h2Pg0', function () { snd('click'); openBook(id, page - 1); }); on('h2Pg1', function () { snd('click'); openBook(id, page + 1); }); on('h2PgL', function () { snd('click'); openLibrary(); });
    return true;
  }
  UI.openBook = openBook; UI.books = books;

  /* ---------- Stamp-O-Matic quiz ---------- */
  var QZ = UI.quiz = { on: false };
  // a game's catalog blurb with its own name blanked out (the cover pictures all have the title on them, too easy!)
  function clue(g) { var t = String(g.desc || ''), cut = t.search(/[.!?](\s|$)/); if (cut > 30 && cut < 150) t = t.slice(0, cut + 1); else if (t.length > 150) t = t.slice(0, 147).replace(/\s+\S*$/, '') + '\u2026';
    String(g.name).split(/\s+/).filter(function (w) { return w.length > 2 && !/^grok$/i.test(w); }).forEach(function (w) { t = t.replace(new RegExp('\\b' + w.replace(/[^\w]/g, '') + '\\w*', 'gi'), '???'); }); return t; }
  UI.clue = clue;
  function makeQuestions() {
    var gs = H2.games().filter(function (g) { var d = GA.HALL_DATA[g.id]; return d && d.history.length; }), qs = [], used = {};
    function others(g, n) { return shuffle(gs.filter(function (x) { return x.id !== g.id; })).slice(0, n); }
    var kinds = shuffle(['pic', 'upd', 'ver', 'pic', 'upd', 'count']).slice(0, 5);
    kinds.forEach(function (k) {
      var g; var tries = 0; do { g = pick(gs); tries++; } while (used[g.id] && tries < 20); used[g.id] = 1; var d = GA.HALL_DATA[g.id];
      if (k === 'pic') { var ch = shuffle([g].concat(others(g, 2))); qs.push({ q: 'Which game is this? \u201C' + clue(g) + '\u201D', opts: ch.map(function (x) { return x.name; }), a: ch.indexOf(g) }); }
      else if (k === 'upd') { var e = pick(d.history), ch2 = shuffle([g].concat(others(g, 2).filter(function (o) { return !GA.HALL_DATA[o.id].history.some(function (h) { return h.title === e.title; }); }))); if (ch2.length < 3) ch2 = shuffle([g].concat(others(g, 2))); qs.push({ q: 'Which game had the update \u201C' + e.title + '\u201D?', opts: ch2.map(function (x) { return x.name; }), a: ch2.indexOf(g) }); }
      else if (k === 'ver') { var v = 'v' + d.history[d.history.length - 1].ver, pool = {}; gs.forEach(function (x) { var hv = GA.HALL_DATA[x.id].history; pool['v' + hv[hv.length - 1].ver] = 1; }); ['v1.0', 'v2.0', 'v3.0', 'v1.5', 'v2.5', 'v4.0'].forEach(function (z) { pool[z] = 1; }); delete pool[v]; var wr = shuffle(Object.keys(pool)).slice(0, 2), ch3 = shuffle([v].concat(wr)); qs.push({ q: 'What version is ' + g.name + ' on right now?', opts: ch3, a: ch3.indexOf(v) }); }
      else { var n = d.history.length, ws = shuffle([n + 1, n + 2, Math.max(1, n - 1), n + 3].filter(function (x) { return x !== n; })).slice(0, 2), ch4 = shuffle([n].concat(ws)); qs.push({ q: 'How many updates does ' + g.name + ' have in its history?', opts: ch4.map(String), a: ch4.indexOf(n) }); }
    });
    return qs;
  }
  UI.makeQuestions = makeQuestions;
  function openQuiz() { QZ.on = true; QZ.qs = makeQuestions(); QZ.i = 0; QZ.right = 0; QZ.lock = false; askQ(); gusSay('A QUIZ? In my Hall? ...Fine. I wrote the answers. With my good pen.', 4); return true; }
  function askQ() {
    var q = QZ.qs[QZ.i];
    show('h2quiz', '\uD83D\uDCEE STAMP-O-MATIC 5000', 'Question ' + (QZ.i + 1) + ' of 5 \u00b7 ' + QZ.right + ' approved',
      '<div class="h2Q">' + (q.img ? '<img class="h2QImg" alt="" src="' + q.img + '">' : '') + '<b>' + esc(q.q) + '</b></div><div class="h2Opts">' + q.opts.map(function (o, i) { return '<button class="h2Opt" data-o="' + i + '">' + esc(o) + '</button>'; }).join('') + '</div><div class="h2StampMark" id="h2Mark"></div>',
      '<button class="pill" id="h2QuizX">QUIT</button>');
    Array.prototype.forEach.call(document.querySelectorAll('.h2Opt'), function (b) { b.addEventListener('click', function () { UI.quizAnswer(+b.getAttribute('data-o')); }); });
    on('h2QuizX', function () { QZ.on = false; close(); });
  }
  UI.quizAnswer = function (i) {
    if (!QZ.on || QZ.lock) return null; var q = QZ.qs[QZ.i], ok = i === q.a; QZ.lock = true; if (ok) QZ.right++;
    H2.stamp(ok); snd(ok ? 'coin' : 'buzz');
    var mk = $('h2Mark'); if (mk) { mk.textContent = ok ? 'APPROVED' : 'DENIED'; mk.className = 'h2StampMark on ' + (ok ? 'ok' : 'no'); }
    Array.prototype.forEach.call(document.querySelectorAll('.h2Opt'), function (b, k) { b.disabled = true; if (k === q.a) b.classList.add('right'); else if (k === i) b.classList.add('wrong'); });
    setTimeout(function () { QZ.lock = false; if (!QZ.on) return; QZ.i++; if (QZ.i >= QZ.qs.length) endQuiz(); else askQ(); }, UI.quizDelay || 1200);
    return ok;
  };
  function endQuiz() {
    QZ.on = false; var r = QZ.right, today = H2.dayKey(), qd = GA.store.get('h2QuizDay', null), first = !qd || qd !== today; GA.store.set('h2QuizDay', today);
    var tix = first ? r * 2 + (r === 5 ? 5 : 0) : r; pay(tix); ev('h2Quiz'); var gift = false;
    if (r === 5) { ev('h2QuizPerfect'); gift = grant('gold_stamp'); }
    QZ.last = { right: r, tix: tix, first: first, gift: gift };
    var line = r === 5 ? 'Five out of five. ...Hmph. APPROVED. Don\u2019t let it go to your head.' : r >= 3 ? 'Not bad. Not GREAT. Not bad.' : 'DENIED. Go read a book in the nook. Quietly. Standing up.';
    show('h2quizdone', '\uD83D\uDCEE QUIZ COMPLETE', r + ' of 5 approved' + (first ? '' : ' \u00b7 replay pays 1 ticket per answer today'), '<div class="h2Big">' + r + '/5 \u00b7 +' + tix + ' \uD83C\uDF9F\uFE0F</div>' + gusN(line) + (gift ? '<div class="arNote h2Barn"><b>RARE PRIZE:</b> the <b>Golden Rubber Stamp</b> is on your Achievement Gallery shelf!</div>' : ''),
      '<button class="bigBtn" id="h2QAgain">AGAIN</button><button class="pill" id="h2QDone">DONE</button>');
    on('h2QAgain', function () { snd('click'); openQuiz(); }); on('h2QDone', function () { close(); });
    gusSay(line, 4.5);
  }

  /* ---------- Photo booth: sit on the stool, the booth camera takes 4 real pictures of you ---------- */
  var PB = UI.photo = { busy: false, url: null };
  var FRAMES = [['classic', 'Classic', '#ffffff', '#1a0a33'], ['neon', 'Neon', '#1a0a33', '#ff4fd8'], ['gold', 'Hall Gold', '#3a2216', '#e8b84a'], ['spooky', 'Spooky', '#0d1f14', '#7df9a0']];
  function openPhoto() {
    if (H2.sitting() !== 'booth_stool') H2.sit('booth_stool');
    var last = GA.store.get('h2Photo', null);
    show('h2photo', '\uD83D\uDCF8 PHOTO BOOTH', 'Pick a frame, then strike 4 poses!',
      (last ? '<div class="h2Strip"><img alt="Your last photo strip" src="' + last + '"></div>' : '<div class="arNote">You\u2019re on the stool! The camera is the round lens in front of you.</div>') +
      '<div class="h2Frames">' + FRAMES.map(function (f, i) { return '<button class="h2Fr' + (i === (PB.fr || 0) ? ' on' : '') + '" data-f="' + i + '" style="--a:' + f[2] + ';--b:' + f[3] + '">' + f[1] + '</button>'; }).join('') + '</div>',
      '<button class="bigBtn" id="h2Snap">\uD83D\uDCF8 TAKE PHOTOS</button>' + (last ? '<a class="pill h2Save" id="h2Save" download="grok-arcade-photo.jpg" href="' + last + '">\uD83D\uDCBE SAVE</a>' : '') + '<button class="pill" id="h2PhX">DONE</button>');
    Array.prototype.forEach.call(document.querySelectorAll('.h2Fr'), function (b) { b.addEventListener('click', function () { PB.fr = +b.getAttribute('data-f'); snd('click'); Array.prototype.forEach.call(document.querySelectorAll('.h2Fr'), function (x) { x.classList.toggle('on', x === b); }); }); });
    on('h2Snap', function () { snd('click'); UI.takePhotos(); });
    on('h2PhX', function () { close(); });
    return true;
  }
  UI.takePhotos = function (cb) {
    if (PB.busy) return false; PB.busy = true; H2.posing = true; close(true); GA.Hub.setLock(true); var bz = (H2.SEATS.booth_stool || { z: 44.4 }).z; GA.Hub.setPlayer(3.72, bz); GA.Hub.setFace(-Math.PI / 2); // step to the tape mark so the whole you fits in the picture
    if (H2.sitting() !== 'booth_stool') H2.sit('booth_stool');
    var poses = ['wave', 'robot', 'dance', 'floss'], shots = [], k = 0, R = GA.Hub.renderer(), cd = document.createElement('div'); cd.className = 'h2Count'; document.body.appendChild(cd);
    gusSay(pick(['No flash photography! ...Fine. ONE strip.', 'Photos? In the archive? I suppose I\u2019ll allow it. Smile. Or don\u2019t. I never do.']), 3.5);
    function shot() {
      var n = 3; GA.Hub.setEmote('sit'); cd.textContent = n; cd.className = 'h2Count on';
      var iv = setInterval(function () { n--; if (n > 0) { cd.textContent = n; snd('tick'); return; } clearInterval(iv); cd.textContent = poses[k].toUpperCase() + '!'; GA.Hub.setEmote(poses[k]);
        setTimeout(function () {
          try { var c = grab(); if (c) shots.push(c); } catch (e) { }
          H2.flash(); snd('coin'); var fl = document.createElement('div'); fl.className = 'h2Flash'; document.body.appendChild(fl); setTimeout(function () { fl.remove(); }, 380);
          k++; if (k < poses.length) setTimeout(shot, 500); else done();
        }, 650);
      }, UI.photoTick || 600);
    }
    function grab() { // copy the 3D view right after a fresh frame (same task, so the picture is still there)
      if (!R) return null; var cm = H2.camera(), f0 = cm.fov; cm.fov = 112; cm.updateProjectionMatrix(); H2.renderNow(); cm.fov = f0; cm.updateProjectionMatrix(); /* a wide booth lens: the booth is small */ var src = R.domElement, w = src.width, h = src.height, s = Math.min(w, h / 1.25), c = document.createElement('canvas'); c.width = 240; c.height = 300;
      c.getContext('2d').drawImage(src, (w - s) / 2, (h - s * 1.25) / 2, s, s * 1.25, 0, 0, 240, 300); return c;
    }
    function done() {
      cd.remove(); H2.sit('booth_stool'); H2.posing = false; GA.Hub.setLock(false); PB.busy = false;
      var f = FRAMES[PB.fr || 0], st = document.createElement('canvas'); st.width = 280; st.height = 1356; var g = st.getContext('2d');
      g.fillStyle = f[2]; g.fillRect(0, 0, 280, 1356); g.strokeStyle = f[3]; g.lineWidth = 8; g.strokeRect(4, 4, 272, 1348);
      shots.forEach(function (c, i) { g.drawImage(c, 20, 20 + i * 314, 240, 300); g.strokeStyle = f[3]; g.lineWidth = 3; g.strokeRect(20, 20 + i * 314, 240, 300); });
      g.fillStyle = f[3]; g.textAlign = 'center'; g.font = 'bold 26px "Trebuchet MS",sans-serif'; g.fillText('GROK ARCADE', 140, 1306); g.font = 'bold 16px "Trebuchet MS",sans-serif'; g.fillText('HALL OF RECORDS \u00b7 ' + new Date().toLocaleDateString(), 140, 1334);
      if (f[0] === 'spooky') { g.font = '40px serif'; g.fillText('\uD83D\uDC7B', 236, 66); } else if (f[0] === 'neon') { g.font = '34px serif'; g.fillText('\u2728', 236, 60); } else if (f[0] === 'gold') { g.font = '34px serif'; g.fillText('\uD83C\uDFC6', 236, 60); }
      var url = null; try { url = st.toDataURL('image/jpeg', 0.82); } catch (e) { }
      PB.url = url; PB.shots = shots.length; if (url) GA.store.set('h2Photo', url); ev('h2Photo');
      barnSay('Ooh, let me see! ...Beautiful! I\u2019m putting it on my fridge. I don\u2019t have a fridge. I\u2019ll get one!', 4);
      openPhoto(); if (cb) cb(shots.length);
    }
    setTimeout(shot, 700); return true;
  };

  /* ---------- annex ambience: Barnaby says hi, and he and Gus bicker now and then ---------- */
  var amb = { inside: false, hiT: -1e9, banter: 30 };
  H2.onFrame = function (t, dt, inA) {
    if (inA && !amb.inside && performance.now() - amb.hiT > 40000 && !GA.AreasUI.isOpen()) { amb.hiT = performance.now(); H2.say(pick(L.hi), 5); }
    amb.inside = inA;
    if (!inA || GA.AreasUI.isOpen() || (GA.Hall && GA.Hall.isOpen())) return;
    amb.banter -= dt; if (amb.banter <= 0) { amb.banter = 45 + Math.random() * 30; if (Math.random() < 0.5) { gusSay(pick(L.gusAtB), 4); setTimeout(function () { H2.say(pick(L.bAtG), 4); }, 2600); } else { H2.say(pick(L.chat), 5); } }
  };
})();
