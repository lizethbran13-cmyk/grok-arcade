/* Grok Arcade (#50) - Grandma Mrs, head attendant of the Bonus Zone (East Wing). Gary's great-great-grandmother.
   Very nice. Sometimes TOO nice (cookies! more cookies!). Gets sidetracked into drama mid-sentence. Her phone is always broken:
   help her fix it (3 problems per visit, pick the right setting) for tickets. */
(function () {
  'use strict';
  var UI = GA.GrandmaUI = {}, WG = GA.Wing50;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function snd(n) { try { GA.Audio.play(n); } catch (e) {} }
  function toast(m, ms) { if (GA.Fix && GA.Fix.toast) GA.Fix.toast(m, ms || 3600); }
  function show(kind, title, sub, body, foot) { GA.AreasUI.show(kind, title, sub, body, foot, 'h2Panel gmPanel'); }
  function close(silent) { GA.AreasUI.close(silent); }
  function on(id, f) { var e = $(id); if (e) e.addEventListener('click', f); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pay(n) { if (n > 0) GA.addTickets(n); if (GA.onTickets) GA.onTickets(GA.getTickets()); }
  function ev(k, v) { if (GA.Prog) GA.Prog.event(k, v); }
  function day() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function today() { var s = GA.store.get('gmDay', null); if (!s || s.day !== day()) { s = { day: day(), fixes: 0, cookies: 0 }; GA.store.set('gmDay', s); } return s; }
  function saveDay(s) { GA.store.set('gmDay', s); }
  function say(s, secs) { if (WG && WG.say) WG.say(s, secs || 4.5); UI.last = s; return s; }
  function note(s) { return '<div class="arNote gmNote"><b>Grandma Mrs:</b> \u201C' + esc(s) + '\u201D</div>'; }
  UI.FIX_PAY = 5; UI.FIX_BONUS = 10; UI.FIX_DAILY = 3; UI.COOKIE_DAILY = 5;

  var L = UI.LINES = {
    hi: ['Oh! Hello, sweetie! I\u2019m Grandma Mrs, head attendant of the Bonus Zone. Gary\u2019s my great-great-grandson, you know. Such a good boy. Terrible at visiting.', 'Come in, come in, dear! Mind the yarn. Do you want a cookie? You look like you want a cookie.', 'Welcome to the East Wing, honey! More games, more room, more ME. Isn\u2019t that nice?'],
    enter: ['Yoo-hoo! Over here, dear! Grandma Mrs is IN!', 'Oh, a visitor! Wipe your feet, sweetie. Kidding! Come in! Have a cookie!', 'Hello, dear! Have you eaten? You look thin. Have you eaten?'],
    nice: ['You\u2019re my favorite, you know. Don\u2019t tell the others. I tell all of them that too.', 'Take TWO cookies, dear. Take five. Take the jar. No, I insist!', 'You played so well, sweetie! I wasn\u2019t watching, but I just KNOW.', 'Do you need a sweater? It\u2019s chilly. It\u2019s 74 degrees, but it\u2019s chilly.', 'Gus is a sweet boy under all that grump. Very far under. Like, basement-level under.'],
    start: ['Now, the Bonus Zone rules are very simple, dear. Rule one:', 'Let me tell you how the ticket machine works. So first you', 'Back in my day, arcades cost a nickel, and', 'The secret to Skee-Ball is in the wrist, sweetie. You take the ball and', 'Did I ever tell you how Gary got his first job here? Well, it was a Tuesday and'],
    side: ['ooh, is that Gus? Did you hear what he said to Barnaby? I heard it from Mimi who heard it from Lili who heard it from the Time Jumper!', 'oh! Speaking of which, Chef Gio and the slushie machine are NOT talking right now. Long story. Very dramatic. Somebody said "brain freeze" on purpose.', 'wait, did Luna the rat take my reading glasses again? She did that in 1983 too. That rat never ages. It\u2019s a whole thing.', 'oh, that reminds me, Barnaby told me Gus SMILED last week. Smiled! I\u2019ve been on the phone about it all morning. Well, trying to be. My phone is broken.', 'hold on, my phone buzzed. It\u2019s Bob from Account Desk. He says the save sync is "fine." FINE. You know what fine means. Drama.', 'oh my, is that the claw machine winking at me? It\u2019s been winking at me since Tuesday. I haven\u2019t told the Prize Counter. They\u2019d be SO jealous.'],
    lost: ['...anyway, where was I? Oh well! Have a cookie.', '...what were we talking about, sweetie? It\u2019ll come to me. Probably in the middle of the night.', '...and THAT\u2019S why I don\u2019t go to the Food Court on Thursdays. Wait, that\u2019s not what I was saying at all.', '...oh, never mind, dear. The rules are: have fun and eat a cookie. That\u2019s it.'],
    phone: ['Sweetie, my phone is doing the thing again. Could you look at it? You young people are so good with these.', 'Honey, can you fix my phone? Gary set it up and now it only shows me pictures of my own thumb.', 'My phone stopped working, dear. It was working this morning. Then I touched it.', 'Oh, could you fix my phone, sweetie? I need to call Barnaby. There\u2019s DRAMA.'],
    cookie: ['Here you go, dear! Fresh from the oven. Well, fresh from the jar. Well, fresh from 1997.', 'One cookie for you! And one for later. And one for your pocket. Shh.', 'Cookie! Chocolate chip. Or raisin. You\u2019ll find out. Grandma\u2019s surprise!'],
    cookieMax: ['No more cookies today, sweetie. Gary says I give away too many. Gary says that about EVERYTHING.', 'Out of cookies, dear! I gave the last ones to a very polite raccoon. Or a Ratita. Hard to tell without my glasses.'],
    thanks: ['You FIXED it! You\u2019re a genius! I\u2019m telling EVERYONE. I\u2019m telling them right now. On my working phone!', 'Oh, it works! Thank you, sweetie! Now I can text Barnaby about Gus. Hee hee.', 'My hero! Here, take some tickets. And a cookie. And a hug. Take two hugs.'],
    capped: ['You already fixed it three times today, dear! I\u2019ll break it again tomorrow. I mean... it\u2019ll break. By itself. Probably.'],
    bye: ['Bye bye, sweetie! Call me! Oh wait, that never works.', 'Come back soon! Bring friends! Bring drama!', 'Bye, dear! Wear a sweater!']
  };
  // the phone problems: what Grandma says, the screen it shows, and the right fix (the other buttons are decoys)
  var PROB = UI.PROBLEMS = [
    { id: 'flip', say: 'Everything is upside down, dear! Even the cat videos!', scr: 'flip', fix: 'rotate' },
    { id: 'mute', say: 'Nobody calls me anymore. Well, they call, but I can\u2019t HEAR it.', scr: 'mute', fix: 'volume' },
    { id: 'dark', say: 'The screen is all black! Is it nighttime in the phone?', scr: 'dark', fix: 'bright' },
    { id: 'plane', say: 'It says I\u2019m on an airplane! I\u2019m not on an airplane! I\u2019m in the Bonus Zone!', scr: 'plane', fix: 'airplane' },
    { id: 'huge', say: 'The letters are SO big, sweetie. One word per screen. Like a billboard.', scr: 'huge', fix: 'text' },
    { id: 'tabs', say: 'It\u2019s so SLOW, dear. Gary says I have "too many tabs." What\u2019s a tab?', scr: 'tabs', fix: 'close' },
    { id: 'batt', say: 'It keeps saying one percent! One percent of WHAT?', scr: 'batt', fix: 'charge' },
    { id: 'zoom', say: 'Now I can only see one giant eyeball. It\u2019s mine. I don\u2019t like it.', scr: 'zoom', fix: 'camera' }
  ];
  var FIXES = UI.FIXES = { rotate: '\uD83D\uDD04 Rotate screen', volume: '\uD83D\uDD0A Turn volume up', bright: '\uD83D\uDD06 Brightness up', airplane: '\u2708\uFE0F Airplane mode OFF', text: '\uD83D\uDD24 Smaller text', close: '\u274C Close all 412 tabs', charge: '\uD83D\uDD0C Plug in charger', camera: '\uD83D\uDCF7 Switch off selfie cam' };
  function screenHtml(k) {
    var c = { flip: '<div class="gmApps flip">\uD83D\uDCF7 \uD83D\uDCDE \uD83D\uDC31 \u2709\uFE0F<br>\uD83C\uDFAE \uD83C\uDF6A \u2600\uFE0F \uD83D\uDCF0</div>', mute: '<div class="gmBig">\uD83D\uDD07<br><small>Volume 0</small></div>', dark: '<div class="gmBig dim">&nbsp;<br><small>brightness 0%</small></div>', plane: '<div class="gmBig">\u2708\uFE0F<br><small>Airplane mode: ON</small></div>',
      huge: '<div class="gmHuge">HELLO</div>', tabs: '<div class="gmBig">\uD83D\uDCD1 412<br><small>tabs open \u00b7 so slow\u2026</small></div>', batt: '<div class="gmBig">\uD83E\uDEAB 1%<br><small>please charge</small></div>', zoom: '<div class="gmBig">\uD83D\uDC41\uFE0F<br><small>selfie cam \u00b7 zoom 400%</small></div>' }[k];
    return '<div class="gmPhone"><div class="gmNotch"></div><div class="gmScr">' + c + '</div><div class="gmCrack" aria-hidden="true"></div></div>';
  }
  UI.prompt = function (cab) {
    if (cab.kind !== 'gm_mrs') return null; var s = today(), left = Math.max(0, UI.FIX_DAILY - s.fixes);
    return { tag: 'HEAD ATTENDANT \u00b7 BONUS ZONE', name: 'Grandma Mrs', desc: 'Gary\u2019s great-great-grandma. Very nice. Sometimes too nice. Her phone is broken again' + (left ? ' (fix it for tickets, ' + left + ' left today).' : ' (you already fixed it 3 times today).'), btn: 'TALK', key: 'talk to Grandma Mrs', cls: 'npc' };
  };
  UI.open = function (cab) { if (cab.kind === 'gm_mrs') return openMain(); };
  function chatLine() { return pick(L.start) + ' ' + pick(L.side) + ' ' + pick(L.lost); }
  function openMain(msg) {
    var s = today(), left = Math.max(0, UI.FIX_DAILY - s.fixes), ck = Math.max(0, UI.COOKIE_DAILY - s.cookies);
    var line = msg || (UI._hi ? pick(L.nice.concat([pick(L.phone)])) : pick(L.hi));
    show('gmmrs', '\uD83D\uDC75 GRANDMA MRS', 'Head Attendant of the Bonus Zone \u00b7 Gary\u2019s great-great-grandma \u00b7 professional sweetheart',
      '<div class="gmFace" aria-hidden="true"><i class="bun"></i><i class="hair"></i><i class="g1"></i><i class="g2"></i><i class="sm"></i><i class="ck1"></i><i class="ck2"></i></div>' + note(line) +
      '<div class="arNote dim">Phone fixes today: <b>' + s.fixes + '/' + UI.FIX_DAILY + '</b> \u00b7 each fix pays up to ' + (UI.FIX_PAY * 3 + UI.FIX_BONUS) + ' tickets \u00b7 cookies left: <b>' + ck + '</b></div>',
      (left ? '<button class="bigBtn" id="gmFix">\uD83D\uDCF1 FIX HER PHONE</button>' : '<button class="pill" disabled>\uD83D\uDCF1 Phone: fixed 3x today \u2713</button>') + '<button class="pill" id="gmCookie">\uD83C\uDF6A COOKIE</button><button class="pill" id="gmChat">\uD83D\uDCAC CHAT</button><button class="pill" id="gmBye">BYE</button>');
    if (!UI._hi) { UI._hi = true; ev('gmHello'); }
    say(line.length > 120 ? line.slice(0, 117) + '\u2026' : line, 4.5);
    on('gmFix', function () { snd('click'); startFix(); });
    on('gmChat', function () { snd('click'); openMain(chatLine()); });
    on('gmCookie', function () {
      snd('click'); var d = today();
      if (d.cookies >= UI.COOKIE_DAILY) return openMain(pick(L.cookieMax));
      d.cookies++; saveDay(d); pay(2); ev('gmCookie'); toast('\uD83C\uDF6A Grandma Mrs gave you a cookie (+2 tickets). She is already holding another one.', 3000);
      openMain(pick(L.cookie));
    });
    on('gmBye', function () { close(); say(pick(L.bye), 3); });
    return true;
  }
  /* ---------- Fix Grandma's phone: 3 problems, pick the right setting ---------- */
  var FX = null;
  UI.current = function () { return FX ? FX.list[FX.i] : null; };
  function startFix() {
    var s = today(); if (s.fixes >= UI.FIX_DAILY) return openMain(pick(L.capped));
    FX = { list: shuffle(PROB).slice(0, 3), i: 0, ok: 0, miss: 0 }; if (WG && WG.phoneUp) WG.phoneUp(true); step();
  }
  function step(msg) {
    var p = FX.list[FX.i], opts = shuffle([p.fix].concat(shuffle(Object.keys(FIXES).filter(function (k) { return k !== p.fix; })).slice(0, 3)));
    show('gmfix', '\uD83D\uDCF1 GRANDMA\u2019S PHONE', 'Problem ' + (FX.i + 1) + ' of 3 \u00b7 pick the setting that fixes it',
      note(msg || p.say) + screenHtml(p.scr), opts.map(function (k) { return '<button class="pill gmOpt" data-k="' + k + '">' + FIXES[k] + '</button>'; }).join('') + '<button class="pill" id="gmQuit">GIVE UP</button>');
    say(p.say, 4);
    Array.prototype.forEach.call(document.querySelectorAll('.gmOpt'), function (b) { b.addEventListener('click', function () { answer(b.getAttribute('data-k')); }); });
    on('gmQuit', function () { snd('click'); if (WG && WG.phoneUp) WG.phoneUp(false); FX = null; openMain('That\u2019s okay, dear. I\u2019ll just yell really loud instead. Works on Gus.'); });
  }
  function answer(k) {
    if (!FX) return; var p = FX.list[FX.i];
    if (k !== p.fix) { FX.miss++; snd('buzz'); return step(pick(['Hmm, no, dear, now it\u2019s playing polka music.', 'Oh dear. Now it\u2019s in Spanish. \u00A1Ay, no!', 'That made it worse, sweetie! But I love that you tried. Try another one!', 'Now it\u2019s calling Gus. HANG UP. HANG UP.'])); }
    FX.ok++; snd('coin'); pay(UI.FIX_PAY); FX.i++;
    if (FX.i < 3) {
      var aside = Math.random() < 0.5 ? ' Ooh, while you\u2019re in there... ' + pick(L.side) : '';
      return step('That fixed it! Oh, but now there\u2019s another thing.' + aside);
    }
    var d = today(); d.fixes++; saveDay(d); var bonus = FX.miss === 0 ? UI.FIX_BONUS : Math.round(UI.FIX_BONUS / 2); pay(bonus); ev('gmFix'); if (WG && WG.phoneUp) WG.phoneUp(false);
    var total = UI.FIX_PAY * 3 + bonus; FX = null; snd('powerup');
    toast('\uD83D\uDCF1 Phone fixed! Grandma Mrs paid you ' + total + ' tickets' + (bonus === UI.FIX_BONUS ? ' (perfect fix bonus!)' : '') + '.', 4200);
    openMain(pick(L.thanks));
  }
  // Wing hooks: hello when you walk in, idle chatter while you're near her desk
  if (WG) {
    WG.onEnter = function () { say(pick(L.enter), 4); };
    WG.onIdle = function () { var r = Math.random(); say(r < 0.4 ? pick(L.side).replace(/^./, function (c) { return c.toUpperCase(); }) : r < 0.7 ? pick(L.phone) : pick(L.nice), 5); };
  }
  // the family chimes in: Gary (IT) and Gus get a line about her
  if (GA.HallUI && GA.HallUI.LINES && GA.HallUI.LINES.talk) GA.HallUI.LINES.talk.push('Grandma Mrs runs the Bonus Zone now. She gave me a cookie. I filed it. Under C. For Cookie. I\u2019m not made of stone.');
})();
