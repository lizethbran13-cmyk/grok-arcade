/* Grok Arcade - MYSTERIOUS ATTIC: prompts, quest dialogs, puzzles, keypad, journal + quest tracker chip, minimaps.
   Uses the Areas overlay (GA.AreasUI.show). Player-visible text never names where the hatch is, and never prints codes
   you haven't earned. */
(function () {
  'use strict';
  var UI = GA.AtticUI = {}, AT = GA.Attic;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function snd(n) { if (GA.Audio) GA.Audio.play(n); }
  function toast(m, ms) { if (GA.Fix && GA.Fix.toast) GA.Fix.toast(m, ms || 3600); }
  function S() { return AT.S(); }
  function save() { AT.save(); AT.refresh(); upd(); }
  function show(kind, title, sub, body, foot, cls) { GA.AreasUI.show(kind, title, sub, body, foot, 'attic ' + (cls || '')); }
  function close(silent) { GA.AreasUI.close(silent); }
  function on(id, f) { var e = $(id); if (e) e.addEventListener('click', f); }
  function shuffle(a, r) { r = r || Math.random; for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function tix(n, why) { GA.addTickets(n); if (GA.onTickets) GA.onTickets(GA.getTickets ? GA.getTickets() : 0); toast('\uD83C\uDF9F\uFE0F +' + n + ' tickets \u00b7 ' + why, 3200); }
  function carryNow() { return GA.Carry && GA.Carry.get ? GA.Carry.get() : {}; }
  function applyCarry() { if (GA.Hub && GA.Hub.setCarry) GA.Hub.setCarry(carryNow()); }
  UI.applyCarry = applyCarry;
  var CLUE_TXT = function () { var o = AT.bookOrder(), C = AT.BOOK_COLS; return { portrait: 'Clue 1 of 3 \u2014 \u201CThe library\u2019s FIRST secret wears ' + C[o[0]][0] + '.\u201D', music: 'Clue 2 of 3 \u2014 \u201CSECOND, the book of ' + C[o[1]][0] + ' sings.\u201D', toys: 'Clue 3 of 3 \u2014 \u201CLAST of all, pull ' + C[o[2]][0] + ' and the shelf will swing.\u201D' }; };
  UI.clueText = function (k) { return CLUE_TXT()[k]; };

  /* ---------- walk-up prompts ---------- */
  UI.prompt = function (cab) { var s = S(), k = cab.kind; if (GA.Mimi && GA.Mimi.handles(k)) return GA.Mimi.prompt(cab);
    switch (k) {
      case 'at_hatch': if (!s.found) return { tag: '???', name: 'A cold draft from above\u2026', desc: 'Dust is drifting down from the ceiling, and something up there just creaked.', btn: 'LOOK UP', key: 'look up', cls: 'npc' };
        if (s.opened) return { tag: 'THE ATTIC', name: 'The attic hatch', desc: 'Gary\u2019s ladder leads up into the Mysterious Attic.', btn: 'CLIMB UP', key: 'climb up', cls: 'npc' };
        if (s.ladder === 'carry') return { tag: 'ATTIC HATCH', name: 'The attic hatch', desc: 'Set Gary\u2019s ladder up under the hatch.', btn: 'PLACE LADDER', key: 'place the ladder', cls: 'npc' };
        if (s.ladder === 'placed') return { tag: 'ATTIC HATCH', name: 'The hatch keypad', desc: s.fuse === 'installed' ? 'The keypad is powered. It wants a 4-digit code.' : 'There\u2019s a keypad on the hatch. It looks dead.', btn: 'CLIMB', key: 'climb the ladder', cls: 'npc' };
        return { tag: 'ATTIC HATCH', name: 'The attic hatch', desc: 'Way too high to reach. You\u2019ll need a ladder.', btn: 'LOOK UP', key: 'look up', cls: 'npc' };
      case 'at_down': return { tag: 'HATCH', name: 'Back down to the arcade', desc: 'Climb down Gary\u2019s ladder.', btn: 'CLIMB DOWN', key: 'climb down', cls: 'npc' };
      case 'at_mdoor': return { tag: 'STAFF ONLY', name: 'Maintenance', desc: s.maintTold ? 'Gary says his brother Larry is in here!' : 'A heavy door. \u201CKnock first. Or don\u2019t.\u201D', btn: s.maintTold ? 'ENTER' : 'KNOCK', key: s.maintTold ? 'go in' : 'knock', cls: 'npc' };
      case 'at_mexit': return { tag: 'EXIT', name: 'Back to the basement', desc: '', btn: 'GO', key: 'go back', cls: 'npc' };
      case 'at_larry': return { tag: 'MAINTENANCE', name: 'Larry from Maintenance', desc: 'Big beard, bigger toolbelt. Talks to his mop.', btn: 'TALK', key: 'talk to Larry', cls: 'npc' };
      case 'at_fuserack': return { tag: 'FIX-IT', name: 'The fuse rack', desc: s.fuse === 'none' ? 'A total mess of fuses. Larry wants it sorted.' : 'Neatly sorted. Larry is very proud of you.', btn: s.fuse === 'none' ? 'SORT' : 'LOOK', key: 'sort the fuses', cls: 'npc' };
      case 'at_ghostcab': return { tag: 'VINTAGE 1983', name: 'Ghost Lantern \u201983', desc: 'Catch the friendly ghosts before they blow out your candle! Best: ' + GA.getBest('ghost') + ' \u00b7 Target: ' + GA.GHOST_TARGET, btn: 'PLAY', key: 'play', cls: '' };
      case 'at_trunk': return { tag: 'DUSTY', name: 'Old trunk', desc: 'It\u2019s not locked\u2026', btn: 'OPEN', key: 'open it', cls: 'npc' };
      case 'at_boo': return { tag: 'FRIENDLY GHOST', name: 'Boo-ford the Butler Ghost', desc: 'He keeps the attic tidy. Mostly.', btn: 'TALK', key: 'talk', cls: 'npc' };
      case 'at_portrait': return { tag: 'PORTRAIT', name: cab.game.name, desc: 'Its eyes seem to follow you around the room\u2026', btn: 'LOOK CLOSER', key: 'look closer', cls: 'npc' };
      case 'at_musicbox': return { tag: 'MUSIC BOX ROOM', name: 'The haunted music box', desc: s.clues.music ? 'It hums the attic lullaby.' : 'Wind it up and copy its tune.', btn: 'WIND UP', key: 'wind it up', cls: 'npc' };
      case 'at_jack': return { tag: 'TOY ROOM', name: 'Jack-in-the-box', desc: 'Turn the crank\u2026 if you dare (it\u2019s very friendly).', btn: 'CRANK', key: 'crank', cls: 'npc' };
      case 'at_toybox': return { tag: 'TOY ROOM', name: 'Toy chest', desc: s.clues.toys ? 'All the toys are paired up.' : 'Full of jumbled toys. Match them up!', btn: 'OPEN', key: 'open it', cls: 'npc' };
      case 'at_wisps': return { tag: 'TEA PARTY', name: 'Wisp & Willa', desc: 'Two little ghosts having a very long tea party.', btn: 'TALK', key: 'talk', cls: 'npc' };
      case 'at_door1': return { tag: s.door1 ? 'CORRIDOR' : 'LOCKED', name: 'The long corridor', desc: s.door1 ? 'Leads to the Cobweb Library.' : 'Chained shut. Three lights: ' + AT.clueCount() + ' of 3 glowing.', btn: s.door1 || AT.clueCount() >= 3 ? 'OPEN' : 'LOCKED', key: 'open', cls: 'npc' };
      case 'at_weekly': var th = AT.theme(); return { tag: 'THIS WEEK', name: th.icon + ' ' + th.name, desc: AT.weeklyDone() ? 'Solved! A new room appears next week.' : 'A new puzzle room every week. Solve it for a reward!', btn: AT.weeklyDone() ? 'PLAY AGAIN' : 'PLAY', key: 'play', cls: '' };
      case 'at_orb': return { tag: 'SECRET', name: 'A spirit marble!', desc: 'It glows softly. ' + AT.orbCount() + '/' + AT.ORB_N + ' found.', btn: 'GRAB', key: 'grab it', cls: 'prize' };
      case 'at_opus': return { tag: 'MYSTERY', name: 'A floating sheet of music', desc: 'It wasn\u2019t here last week\u2026', btn: 'GRAB', key: 'grab it', cls: 'prize' };
      case 'at_back2': return { tag: 'EXIT', name: 'Back to the attic', desc: '', btn: 'GO', key: 'go back', cls: 'npc' };
      case 'at_back3': return { tag: 'EXIT', name: 'Back to the library', desc: '', btn: 'GO', key: 'go back', cls: 'npc' };
      case 'at_hush': return { tag: 'LIBRARIAN', name: 'Madame Hush', desc: 'Shhh.', btn: 'TALK', key: 'talk', cls: 'npc' };
      case 'at_books': return { tag: s.books ? 'SECRET DOOR' : 'BOOKSHELF', name: s.books ? 'The secret bookcase' : 'A suspicious bookshelf', desc: s.books ? 'It swung open! Something foggy is beyond.' : 'Six glowing books\u2026 they look like they could be pulled.', btn: s.books ? 'GO IN' : 'EXAMINE', key: 'examine', cls: 'npc' };
      case 'at_scope': return { tag: 'OBSERVATORY', name: 'The great telescope', desc: 'Pointed at a sky full of ghost constellations.', btn: 'LOOK', key: 'look through it', cls: '' };
      case 'at_twinkle': return { tag: 'ASTRONOMER', name: 'Sir Twinkle', desc: 'A ghost who names every star after himself.', btn: 'TALK', key: 'talk', cls: 'npc' };
    }
    return { tag: 'ATTIC', name: cab.game.name, desc: '', btn: 'LOOK', key: 'look', cls: 'npc' };
  };

  /* ---------- interactions ---------- */
  UI.open = function (cab) { var s = S(), k = cab.kind; if (GA.Mimi && GA.Mimi.handles(k)) return GA.Mimi.open(cab);
    if (k === 'at_hatch') return hatch();
    if (k === 'at_down') { snd('creak'); AT.travel('hatch'); return; }
    if (k === 'at_mdoor') { if (!s.maintTold) { snd('tick'); toast('\uD83D\uDEAA *knock knock* \u2026 a muffled voice: \u201CNot today! I\u2019m busy talking to Dennis!\u201D', 4200); return; } AT.travel('maint'); return; }
    if (k === 'at_mexit') { AT.travel('maint_back'); return; }
    if (k === 'at_larry') return larry();
    if (k === 'at_fuserack') return fuseTask();
    if (k === 'at_ghostcab') { GA.openBonus('ghost'); return; }
    if (k === 'at_trunk') return trunk();
    if (k === 'at_boo') return boo();
    if (k === 'at_portrait') return portrait(cab.data.i, cab.game.name);
    if (k === 'at_musicbox') return musicBox();
    if (k === 'at_jack') return jack();
    if (k === 'at_toybox') return toyBox();
    if (k === 'at_wisps') return wisps();
    if (k === 'at_door1') return door1();
    if (k === 'at_weekly') return weekly();
    if (k === 'at_orb') return grabOrb(cab);
    if (k === 'at_opus') return opus();
    if (k === 'at_back2') { AT.travel('attic_door1'); return; }
    if (k === 'at_back3') { AT.travel('attic2_back'); return; }
    if (k === 'at_hush') return hush();
    if (k === 'at_books') { if (s.books) { AT.travel('attic3'); return; } return books(); }
    if (k === 'at_scope') return scope();
    if (k === 'at_twinkle') return twinkle();
  };

  /* ---------- 1-3: hatch, ladder, keypad ---------- */
  function hatch() { var s = S();
    if (!s.found) { s.found = true; save(); AT.ev('atFound'); snd('creak');
      show('athatch', '\uD83D\uDD78\uFE0F A HIDDEN HATCH!', 'Gus wasn\u2019t making it up\u2026', '<div class="atBig">\uD83E\uDEA4</div><div class="arNote">There\u2019s a square hatch in the ceiling, outlined in dust, with a pull-cord dangling just out of reach. Something above it creaks.</div><div class="arNote gus">It\u2019s WAY too high. Somebody handy around here must have a ladder\u2026</div><div class="arNote dim">\uD83D\uDCDC Your quest journal has been updated. Heads up: the hatch doesn\u2019t like to stay in one place.</div>', '<button class="bigBtn" id="atOk">OK</button>'); on('atOk', function () { close(); }); return; }
    if (s.opened) { snd('creak'); AT.travel('attic'); return; }
    if (s.ladder === 'carry') { s.ladder = 'placed'; save(); applyCarry(); AT.ev('atLadder'); snd('drop'); toast('\uD83E\uDE9C You set Gary\u2019s ladder up under the hatch. Climb up!', 3600); return; }
    if (s.ladder === 'placed') return keypad();
    snd('creak'); toast('\uD83E\uDEA4 The hatch is way too high. You\u2019ll need a ladder from someone handy.', 3600);
  }
  var KP = { code: '' };
  function keypad() { var s = S(); if (!s.keypadSeen) { s.keypadSeen = true; save(); }
    var dead = s.fuse !== 'installed', screen = dead ? 'NO POWER' : (KP.msg || (KP.code + '____'.slice(KP.code.length)).split('').join(' '));
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].map(function (q) { return '<button class="atKey" data-k="' + q + '"' + (dead ? ' disabled' : '') + '>' + q + '</button>'; }).join('');
    var note = dead ? (s.fuse === 'have' ? '<div class="arNote gus">You have Larry\u2019s fuse! Pop it in the empty slot.</div>' : '<div class="arNote gus">The fuse slot is empty and sparking. This keypad needs a FUSE. Maybe Gary knows where to get one?</div>')
      : (s.codeSeen ? '<div class="arNote">\uD83D\uDCDD Your note says: <b class="atCode">' + AT.code() + '</b></div>' : '<div class="arNote gus">A scratched note: \u201CCode\u2019s in the old ghost game. Beat the high score. \u2014 L.\u201D</div>');
    show('atkeypad', '\uD83D\uDD22 ATTIC KEYPAD', 'Hatch control panel \u00b7 1983 model', '<div class="atPad' + (dead ? ' dead' : '') + (KP.bad ? ' bad' : '') + '"><div class="atScr">' + esc(screen) + '</div><div class="atKeys">' + keys + '</div><div class="atFuse ' + (s.fuse === 'installed' ? 'in' : 'out') + '"><span>FUSE</span><i></i></div></div>' + note,
      (s.fuse === 'have' ? '<button class="bigBtn" id="atInstall">INSTALL FUSE</button>' : '') + '<button class="pill" id="atKpClose">CLIMB DOWN</button>');
    KP.bad = false;
    on('atKpClose', function () { KP.code = ''; KP.msg = null; close(); });
    on('atInstall', function () { s.fuse = 'installed'; save(); AT.ev('atFuseIn'); snd('powerup'); toast('\u26A1 Fuse installed! The keypad lights up.', 3000); keypad(); });
    Array.prototype.forEach.call(document.querySelectorAll('.atKey'), function (b) { b.addEventListener('click', function () { press(b.getAttribute('data-k')); }); });
  }
  function press(k) { var s = S(); KP.msg = null; if (s.fuse !== 'installed') return;
    if (k === 'C') { KP.code = ''; snd('click'); return keypad(); }
    if (k === 'OK') { if (KP.code === AT.code()) { KP.msg = 'OPEN!'; s.opened = true; save(); AT.ev('atOpen'); snd('unlock'); keypad(); setTimeout(function () { KP.code = ''; KP.msg = null; close(true); AT.travel('attic', function () { toast('\uD83D\uDC7B Welcome to the MYSTERIOUS ATTIC! Mind the cobwebs.', 4200); }); }, AT.fast ? 30 : 900); return; }
      KP.code = ''; KP.msg = 'WRONG'; KP.bad = true; snd('buzz'); return keypad(); }
    if (KP.code.length < 4) { KP.code += k; snd('tick'); } keypad(); }
  UI.press = press;

  /* ---------- Gary: lends the ladder, remembers Larry, the family reunion ---------- */
  function garyHook() {
    if (!GA.Fix || GA.Fix._atWrapped) return; var t0 = GA.Fix.talk; GA.Fix._atWrapped = true;
    GA.Fix.talk = function () { var st = GA.Hub.gary(), s = S(); if (st.state === 'desk') { var line = garyLine(s, GA.Fix.blocksHost()); if (line) { GA.Fix.say(line, 6500); return; } } t0.apply(GA.Fix, arguments); };
  }
  function garyLine(s, busy) {
    if (s.postcard === 'carry') { s.postcard = 'delivered'; save(); AT.ev('atReunion'); tix(15, 'family reunion'); snd('win');
      return 'Is that\u2026 LARRY\u2019s handwriting? \u201CLil Gary, fixed the boiler. Also I live down here now. Bring snacks.\u201D (sniff) Fourteen years! Tell him I\u2019m coming down for Taco Tuesday!'; }
    if (s.found && s.ladder === 'gary' && !s.opened) { s.ladder = 'carry'; save(); applyCarry(); AT.ev('atLadderGet'); snd('ding');
      return 'A hatch in the CEILING? Huh. I never look up, it\u2019s bad for the neck. Here, borrow my ladder. Bring it back in one piece! (Psst, it\u2019s in your hands now.)'; }
    if (s.ladder === 'carry' && !busy) return 'The ladder won\u2019t carry itself. Well\u2026 technically you\u2019re carrying it. Go find that hatch!';
    if (s.keypadSeen && s.fuse === 'none' && !s.maintTold) { s.maintTold = true; save(); snd('ding');
      return 'A FUSE? That\u2019s a maintenance thing. Maintenance\u2026 maintenance\u2026 LARRY! My big brother Larry! He went down to fix the boiler in 2009 and never came back up! Check the secret basement for a door marked MAINTENANCE!'; }
    if (s.fuse === 'none' && s.maintTold && !s.larryMet) return 'Did you find Larry yet? Big beard? Talks to a mop? Secret basement, door marked MAINTENANCE!';
    if (busy) return null; // the antenna is broken: let Gary's normal repair talk run (quest lines above still work)
    if (!s.found && Math.random() < 0.35) return 'Gus keeps going on about an attic. I\u2019ve never seen it. Then again, I never look up. If you hear creaking, it\u2019s NOT the wiring. Probably.';
    return null;
  }
  UI.garyLine = function () { return garyLine(S()); };

  /* ---------- the Maintenance Room: Larry + the fuse rack ---------- */
  var LARRY_IDLE = ['This is Dennis. He\u2019s a mop. He\u2019s a great listener.', 'The boiler and I have an understanding. It doesn\u2019t explode, I don\u2019t kick it.', 'I\u2019ve been down here so long the rats elected me mayor.', 'Grandpa built that ghost cabinet in \u201983. He wired the attic code into it. Classic Grandpa.', 'Gary still wears the pocket protector? Ha! I gave him that!', 'If something\u2019s broken, I can fix it. Unless it\u2019s the WiFi. That\u2019s Gary\u2019s department.'];
  function larry() { var s = S(), h, foot = '<button class="pill" id="atLClose">BYE</button>', act = null;
    if (!s.larryMet) { s.larryMet = true; save(); AT.ev('atLarry');
      h = '<div class="arNote gus">\u201CA VISITOR! Nobody comes down here except Dennis. (That\u2019s my mop. Say hi, Dennis.) \u2026Wait. GARY sent you? Little Gary with the pocket protector?! I haven\u2019t seen him since the Great Boiler Incident of 2009!\u201D</div><div class="arNote">Larry wipes a tear on his sleeve, then on Dennis.</div><div class="arNote gus">\u201CA fuse for the attic hatch? Sure! I\u2019ve got hundreds. Problem is, my fuse rack is a total mess. Sort it for me, smallest amps first, and the good one\u2019s yours.\u201D</div>';
      foot = '<button class="bigBtn" id="atLAct">SORT THE FUSES</button>' + foot; act = fuseTask; NPCsay('larry', 'GARY sent you?!'); }
    else if (s.fuse === 'none') { h = '<div class="arNote gus">\u201CThat fuse rack won\u2019t sort itself. Smallest amps on the left, biggest on the right!\u201D</div>'; foot = '<button class="bigBtn" id="atLAct">SORT THE FUSES</button>' + foot; act = fuseTask; }
    else if (s.postcard === 'none') { s.postcard = 'carry'; save(); snd('ding'); h = '<div class="arNote gus">\u201CYou got the fuse, you got the rack sorted, you got my eternal gratitude. One more favor? Take this postcard up to Gary. Tell him his big brother says hi.\u201D</div><div class="arNote">\uD83D\uDCEE You got <b>Larry\u2019s postcard</b>. Bring it to Gary!</div>'; }
    else if (s.postcard === 'carry') h = '<div class="arNote gus">\u201CDid you give Gary my postcard yet? He\u2019s at the IT Help Desk. Probably saying \u2018have you tried turning it off and on again\u2019.\u201D</div>';
    else if (s.fuse === 'installed' && !s.codeSeen && !s.opened) h = '<div class="arNote gus">\u201CThe hatch code? Grandpa wired it into that old Ghost Lantern cabinet over there. Beat ' + GA.GHOST_TARGET + ' points and it prints it right on the screen.\u201D</div>';
    else if (s.postcard === 'delivered') h = '<div class="arNote gus">\u201CGary\u2019s coming down for Taco Tuesday! I\u2019m making my famous wrench-grilled cheese. Don\u2019t ask how.\u201D</div><div class="arNote">' + esc(LARRY_IDLE[Math.floor(Math.random() * LARRY_IDLE.length)]) + '</div>';
    else h = '<div class="arNote gus">\u201C' + esc(LARRY_IDLE[Math.floor(Math.random() * LARRY_IDLE.length)]) + '\u201D</div>';
    snd('talk'); show('larry', '\uD83E\uDDF0 LARRY FROM MAINTENANCE', 'Gary\u2019s long-lost big brother \u00b7 and Dennis the mop', h, foot, 'maint');
    on('atLClose', function () { close(); }); on('atLAct', function () { if (act) act(); });
  }
  function NPCsay(who, s) { if (AT.say) AT.say(who, s, 4.5); }
  var FT = null;
  function fuseTask() { var s = S();
    if (s.fuse !== 'none') { show('fuses', '\u26A1 THE FUSE RACK', 'Sorted. Larry framed a photo of it.', '<div class="atFuses done">' + [5, 10, 15, 20, 25, 30].map(function (a) { return '<span class="atFz ok">' + a + 'A</span>'; }).join('') + '</div>', '<button class="pill" id="atFtClose">CLOSE</button>', 'maint'); on('atFtClose', function () { close(); }); return; }
    FT = { amps: shuffle([5, 10, 15, 20, 25, 30]), next: 0, miss: 0 }; drawFuse();
  }
  function drawFuse(msg) { var sorted = [5, 10, 15, 20, 25, 30];
    var slots = sorted.map(function (a, i) { return '<span class="atSlot' + (i < FT.next ? ' ok' : '') + '">' + (i < FT.next ? a + 'A' : '') + '</span>'; }).join('');
    var pile = FT.amps.map(function (a) { var used = sorted.indexOf(a) < FT.next; return '<button class="atFz" data-a="' + a + '"' + (used ? ' disabled style="visibility:hidden"' : '') + '>' + a + 'A</button>'; }).join('');
    show('fuses', '\u26A1 SORT LARRY\u2019S FUSES', 'Tap the fuses from SMALLEST to BIGGEST amps', '<div class="atRack">' + slots + '</div><div class="atFuses">' + pile + '</div><div class="arNote' + (msg ? ' gus' : ' dim') + '">' + (msg || 'Larry: \u201CLeft to right, small to big. Dennis believes in you.\u201D') + '</div>', '<button class="pill" id="atFtClose">LATER</button>', 'maint');
    on('atFtClose', function () { close(); });
    Array.prototype.forEach.call(document.querySelectorAll('.atFz[data-a]'), function (b) { b.addEventListener('click', function () { fusePick(+b.getAttribute('data-a')); }); });
  }
  function fusePick(a) { var want = [5, 10, 15, 20, 25, 30][FT.next];
    if (a !== want) { FT.miss++; snd('bad'); return drawFuse('Nope! That\u2019s a ' + a + '-amp. Look for the smallest one left.'); }
    FT.next++; snd('point'); if (FT.next < 6) return drawFuse();
    var s = S(); s.fuse = 'have'; save(); AT.ev('atFuse'); AT.grant('golden_fuse'); snd('win'); NPCsay('larry', 'BEAUTIFUL! Like a rainbow of electricity!');
    show('fuses', '\u26A1 RACK SORTED!', 'Larry is beaming', '<div class="atBig">\uD83D\uDD0C\u2728</div><div class="arNote gus">\u201CLook at that! Lights don\u2019t even flicker anymore. Here, take the good one: a 10-amp, perfect for that old hatch keypad. And keep this golden spare as a souvenir!\u201D</div><div class="arNote">\u26A1 You got a <b>FUSE</b>. \uD83C\uDF81 Rare prize: <b>Golden Fuse Keychain</b>!</div>', '<button class="bigBtn" id="atFtOk">THANKS, LARRY!</button>', 'maint');
    on('atFtOk', function () { larry(); });
  }
  UI._fuseSolve = function () { if (!FT) fuseTask(); [5, 10, 15, 20, 25, 30].forEach(function (a) { if (S().fuse === 'none') fusePick(a); }); };

  /* ---------- 4: Ghost Lantern '83 reveals the code ---------- */
  function ghostHook() { if (!GA.MG || !GA.MG.hooks || UI._gh) return; UI._gh = true;
    GA.MG.hooks.over.push(function (id, score) { if (id !== 'ghost') return; if (score >= GA.GHOST_TARGET) AT.ev('atGhost'); var s = S(); if (score < GA.GHOST_TARGET || s.opened) return;
      var first = !s.codeSeen; s.codeSeen = true; save();
      setTimeout(function () { var card = document.querySelector('#mgOver .mgCard'); if (!card) return; var old = $('atCodeBox'); if (old) old.remove(); var d = document.createElement('div'); d.id = 'atCodeBox'; d.className = 'atCodeBox';
        d.innerHTML = '\uD83D\uDC7B The screen flickers\u2026 <b>ATTIC CODE: <span class="atCode">' + AT.code().split('').join(' ') + '</span></b>' + (first ? '<small>Written in your quest journal.</small>' : ''); card.insertBefore(d, card.querySelector('.mgBtns')); snd('unlock'); }, 800); });
    GA.MG.hooks.open.push(function () { var o = $('atCodeBox'); if (o) o.remove(); });
  }

  /* ---------- 5: inside the attic ---------- */
  function clue(k, title) { var s = S(); if (s.clues[k]) return false; s.clues[k] = Date.now(); save(); AT.ev('atClues', AT.clueCount()); snd('unlock');
    toast('\uD83D\uDD0D CLUE FOUND (' + AT.clueCount() + '/3)! ' + (AT.clueCount() >= 3 ? 'The long corridor\u2019s chains are rattling\u2026' : 'Check your journal.'), 4200); return true; }
  var BOO = ['Welcome, welcome! Do wipe your feet. Oh, you don\u2019t have ghost feet. Never mind.', 'The portraits gossip terribly. One of them never looks at anyone. Very rude.', 'The music box only opens up to those who can carry a tune.', 'Little ones in the toy room never put anything back in pairs.', 'There are spirit marbles all over the attic. I keep losing them. Ghost butler problems.', 'The weekly puzzle room redecorates itself every week. I\u2019ve stopped asking.', 'Some weeks a sheet of music floats around up here. Nobody knows who writes them. Spooky!'];
  function boo() { var s = S(), n = AT.clueCount(), line = n < 3 ? BOO[Math.floor(Math.random() * BOO.length)] : (!s.door1 ? 'All three clues! The long corridor in the parlor should open for you now.' : !s.books ? 'The library? Madame Hush is lovely. Don\u2019t breathe loudly.' : BOO[Math.floor(Math.random() * BOO.length)]);
    NPCsay('boo', line); snd('whoo'); AT.ev('atBoo');
    if (!s.booTea) { s.booTea = true; save(); tix(5, 'Boo-ford\u2019s welcome tea'); } }
  var PORTRAIT_LINES = ['stares at you. You stare back. Nobody blinks.', 'seems to wink. Or maybe that\u2019s a crack in the paint.', 'has painted eyebrows that wiggle when you aren\u2019t looking.', 'follows you with its eyes. Every. Single. Step.', 'looks like it smells something funny.'];
  function portrait(i, name) { var s = S();
    if (i === AT.oddPortrait()) { if (clue('portrait')) { show('atclue', '\uD83D\uDDBC\uFE0F THE ODD PORTRAIT', name + ' never looks at you\u2026 because there\u2019s a note behind the frame!', '<div class="atClue">' + esc(UI.clueText('portrait')) + '</div>', '<button class="bigBtn" id="atOk">GOT IT</button>'); on('atOk', function () { close(); }); return; }
      toast('\uD83D\uDDBC\uFE0F ' + name + ' is still looking the other way. You already found the note.', 3000); return; }
    s.portraitTries = (s.portraitTries || 0) + 1; save(); snd('whoo'); toast('\uD83D\uDDBC\uFE0F ' + name + ' ' + PORTRAIT_LINES[s.portraitTries % PORTRAIT_LINES.length] + ' (Hmm. One portrait in here never looks at you\u2026)', 4200); }
  function trunk() { var s = S(); if (!s.trunk) { s.trunk = true; save(); tix(10, 'old trunk'); show('attrunk', '\uD83E\uDDF3 THE OLD TRUNK', 'Creeeeak\u2026', '<div class="atBig">\uD83C\uDFA9\uD83E\uDDE6\uD83D\uDCDC</div><div class="arNote">A top hat, one sock, and a yellowed flyer: <b>\u201CGRAND OPENING! Grok Arcade, 1983. Attic tours every hour!\u201D</b> Gus is in the photo. He looks exactly the same. And exactly as grumpy.</div>', '<button class="bigBtn" id="atOk">CLOSE THE LID</button>'); on('atOk', function () { close(); }); return; }
    snd('creak'); toast('\uD83E\uDDF3 Still just a top hat and one sock.', 2600); }
  function jack() { var s = S(); snd('tick'); setTimeout(function () { snd('boop'); }, 300);
    if (!s.jack) { s.jack = true; save(); AT.ev('atJack'); setTimeout(function () { toast('\uD83E\uDD21 POP! The jester bonks you with a squeaky hammer. Then apologizes. (+5 tickets)', 3800); GA.addTickets(5); if (GA.onTickets) GA.onTickets(GA.getTickets ? GA.getTickets() : 0); }, 600); }
    else { s.jack = false; save(); toast('\uD83C\uDFB5 You crank it back down. Pop goes the weasel\u2026', 2600); } }
  function wisps() { var L = ['Wisp: \u201CWant some tea? It\u2019s invisible tea.\u201D', 'Willa: \u201CWe\u2019ve been having this tea party since 1952. It\u2019s going GREAT.\u201D', 'Wisp: \u201CThe long corridor needs three clues. The odd portrait, the music box tune, and the toy chest!\u201D', 'Willa: \u201CThe library ghost goes SHHH a lot. Like, a LOT.\u201D', 'Wisp: \u201CBoo-ford says there\u2019s a mystery song floating around. A new one every week!\u201D'];
    var l = L[Math.floor(Math.random() * L.length)]; NPCsay(Math.random() < 0.5 ? 'wisp' : 'willa', l.replace(/^\w+: /, '')); snd('whoo'); toast('\uD83D\uDC7B ' + l, 4200); AT.ev('atWisps'); }
  function door1() { var s = S(); if (s.door1) { snd('creak'); AT.travel('attic2'); return; }
    if (AT.clueCount() < 3) { snd('buzz'); toast('\u26D3\uFE0F Chained shut. ' + AT.clueCount() + ' of 3 clue lights are glowing. Find all the clues in the attic!', 3800); return; }
    s.door1 = true; save(); AT.ev('atDoor1'); snd('unlock'); toast('\u26D3\uFE0F The chains clatter to the floor! The long corridor is open.', 3600); setTimeout(function () { AT.travel('attic2'); }, AT.fast ? 30 : 700); }
  function grabOrb(cab) { var s = S(), i = cab.data.i; if (s.orbs[i]) return; s.orbs[i] = Date.now(); save(); var n = AT.orbCount(); AT.ev('atOrbs', n); snd('ding');
    if (n >= AT.ORB_N) { AT.grant('pl_booford'); snd('win'); toast('\uD83D\uDD2E ALL ' + AT.ORB_N + ' SPIRIT MARBLES! Boo-ford is so grateful he gave you a plush of himself! \uD83C\uDF81', 5200); } else toast('\uD83D\uDD2E Spirit marble ' + n + '/' + AT.ORB_N + '!', 2600); GA.UI && GA.UI.refreshPrompt && GA.UI.refreshPrompt(); }
  var OPUS_TUNES = [[0, 4, 7, 12, 7, 4, 0], [0, 3, 7, 10, 12, 10, 7], [7, 5, 4, 2, 0, 2, 4], [0, 7, 5, 4, 2, 4, 0], [12, 11, 7, 4, 7, 11, 12]];
  function playTune(notes, base) { var r = GA.Audio && GA.Audio.raw ? GA.Audio.raw() : null; if (!r || !r.ctx) { snd('win'); return; } var c = r.ctx, t0 = c.currentTime + 0.05;
    notes.forEach(function (n, i) { var o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = (base || 392) * Math.pow(2, n / 12); g.gain.setValueAtTime(0.0001, t0 + i * 0.28); g.gain.exponentialRampToValueAtTime(0.12, t0 + i * 0.28 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.28 + 0.5); o.connect(g); g.connect(r.out || c.destination); o.start(t0 + i * 0.28); o.stop(t0 + i * 0.28 + 0.55); }); }
  UI.playTune = playTune;
  function opus() { var s = S(), wk = AT.weekKey(); if (s.opus[wk]) return; s.opus[wk] = Date.now(); save(); var n = Object.keys(s.opus).length; AT.ev('atOpus', n); var tune = OPUS_TUNES[AT.weekSeed() % OPUS_TUNES.length]; playTune(tune, 330); GA.addTickets(20); if (GA.onTickets) GA.onTickets(GA.getTickets ? GA.getTickets() : 0); AT.refresh();
    show('atopus', '\uD83C\uDFBC MYSTERY OPUS No. ' + (AT.week().w || n), 'A new one floats around the attic every week', '<div class="atBig">\uD83C\uDFBC</div><div class="arNote">The sheet hums its tune all by itself, then signs it: <b>\u201C\u2014 The Phantom of the Arcade.\u201D</b> Who is that?!</div><div class="arNote">+20 tickets \u00b7 Opuses collected: <b>' + n + '</b></div>', '<button class="bigBtn" id="atAgain">\uD83C\uDFB5 PLAY IT AGAIN</button><button class="pill" id="atOk">CLOSE</button>');
    on('atAgain', function () { playTune(tune, 330); }); on('atOk', function () { close(); }); }
  function hush() { var s = S(), L = ['Shhhhhh.', 'SHHHH. This is a LIBRARY.', 'Books go back where you found them. In alphabetical order. By smell.', s.books ? 'You found the secret shelf. Shhh, don\u2019t tell the portraits.' : 'Three clues, three books. In order, dear. Shhh.']; var l = L[Math.floor(Math.random() * L.length)]; NPCsay('hush', l); snd('whoo'); toast('\uD83D\uDC7B Madame Hush: \u201C' + l + '\u201D', 3600); AT.ev('atHush'); }
  var BK = null;
  function books() { BK = BK || { pulled: [] }; AT.IN.pulled = BK.pulled; var s = S(), C = AT.BOOK_COLS, clues = AT.CLUE_IDS.filter(function (k) { return s.clues[k]; }).map(function (k) { return '<div class="atClue sm">' + esc(UI.clueText(k)) + '</div>'; }).join('') || '<div class="arNote dim">You don\u2019t remember any clues\u2026</div>';
    show('atbooks', '\uD83D\uDCDA THE SUSPICIOUS BOOKSHELF', 'Pull three books in the right order', '<div class="atShelf">' + C.map(function (c, i) { var p = BK.pulled.indexOf(i); return '<button class="atBook' + (p >= 0 ? ' out' : '') + '" data-i="' + i + '" style="--c:' + c[1] + '"><span>' + c[0] + '</span>' + (p >= 0 ? '<b>' + (p + 1) + '</b>' : '') + '</button>'; }).join('') + '</div>' + clues, '<button class="pill" id="atBkReset">PUSH BACK</button><button class="pill" id="atOk">CLOSE</button>');
    on('atOk', function () { close(); }); on('atBkReset', function () { BK.pulled = []; AT.IN.pulled = BK.pulled; snd('click'); books(); });
    Array.prototype.forEach.call(document.querySelectorAll('.atBook'), function (b) { b.addEventListener('click', function () { pull(+b.getAttribute('data-i')); }); }); }
  function pull(i) { if (BK.pulled.indexOf(i) >= 0) return; BK.pulled.push(i); AT.IN.pulled = BK.pulled; snd('tick'); var want = AT.bookOrder();
    if (BK.pulled.length < 3) return books();
    if (BK.pulled.join() === want.join()) { var s = S(); s.books = true; save(); AT.ev('atBooks'); AT.grant('haunted_box'); snd('unlock'); BK = null; AT.IN.pulled = [];
      show('atbooks', '\uD83D\uDCDA CLICK\u2026 CREEEAK!', 'The bookshelf swings open!', '<div class="atBig">\uD83D\uDEAA\uD83C\uDF2B\uFE0F</div><div class="arNote">Cold fog rolls out from a hidden passage. Behind the books, a dusty <b>Haunted Music Box</b> starts to play. \uD83C\uDF81 Rare prize!</div>', '<button class="bigBtn" id="atGo">GO THROUGH</button><button class="pill" id="atOk">LATER</button>');
      on('atGo', function () { close(true); AT.travel('attic3'); }); on('atOk', function () { close(); }); return; }
    snd('buzz'); setTimeout(function () { if (BK) { BK.pulled = []; AT.IN.pulled = []; } books(); toast('\uD83D\uDCDA Thunk. The books slide back. Wrong order! Check your clues.', 3000); }, 350); }
  UI._pull = function (i) { if (!BK) books(); pull(i); };
  function twinkle() { var L = ['I named that star after myself. And that one. And that one.', 'On a clear night you can see Gus Major. It looks grumpy.', 'The constellations up here change every week! Have a look.', 'The fog? Oh that\u2019s just me breathing. Ghosts breathe fog. Everyone knows that.']; var l = L[Math.floor(Math.random() * L.length)]; NPCsay('twinkle', l); snd('whoo'); toast('\uD83D\uDD2D Sir Twinkle: \u201C' + l + '\u201D', 3800); }

  /* ---------- mini puzzles ---------- */
  // Music box: copy the tune (Simon), 2 rounds
  var MB = null, MB_COL = ['#f472b6', '#facc15', '#60a5fa', '#4ade80'], MB_N = [0, 4, 7, 12];
  function musicBox() { var s = S(); MB = { seq: [], got: [], round: 0, busy: false }; var r = AT.rng(Date.now() & 0xffff); for (var i = 0; i < 6; i++) MB.seq.push(Math.floor(r() * 4)); drawMB(s.clues.music ? 'Play the tune again for fun!' : 'Listen to the tune, then copy it!'); setTimeout(playMB, 500); }
  function mbLen() { return MB.round ? 6 : 4; }
  function drawMB(msg) { show('atmusic', '\uD83C\uDFB6 THE HAUNTED MUSIC BOX', 'Round ' + (MB.round + 1) + ' of 2 \u00b7 copy ' + mbLen() + ' notes', '<div class="atSimon">' + MB_COL.map(function (c, i) { return '<button class="atSi" id="atSi' + i + '" data-i="' + i + '" style="--c:' + c + '"></button>'; }).join('') + '</div><div class="arNote" id="atMbMsg">' + esc(msg || '') + '</div>', '<button class="pill" id="atMbRe">\uD83D\uDD01 HEAR AGAIN</button><button class="pill" id="atOk">CLOSE</button>');
    on('atOk', function () { MB = null; close(); }); on('atMbRe', function () { if (MB && !MB.busy) { MB.got = []; playMB(); } });
    Array.prototype.forEach.call(document.querySelectorAll('.atSi'), function (b) { b.addEventListener('click', function () { mbTap(+b.getAttribute('data-i')); }); }); }
  function flashSi(i) { var b = $('atSi' + i); if (!b) return; b.classList.add('lit'); setTimeout(function () { b.classList.remove('lit'); }, 260); playTune([MB_N[i]], 440); }
  function playMB() { if (!MB) return; MB.busy = true; var n = mbLen(), k = 0; (function nx() { if (!MB) return; if (k >= n) { MB.busy = false; var m = $('atMbMsg'); if (m) m.textContent = 'Your turn!'; return; } flashSi(MB.seq[k]); k++; setTimeout(nx, AT.fast ? 5 : 480); })(); }
  function mbTap(i) { if (!MB || MB.busy) return; flashSi(i); var k = MB.got.length; if (MB.seq[k] !== i) { MB.got = []; snd('bad'); var m = $('atMbMsg'); if (m) m.textContent = 'Off key! Listen again\u2026'; setTimeout(playMB, AT.fast ? 5 : 700); return; }
    MB.got.push(i); if (MB.got.length < mbLen()) return;
    if (MB.round === 0) { MB.round = 1; MB.got = []; snd('ding'); drawMB('Lovely! Now a longer one\u2026'); setTimeout(playMB, AT.fast ? 5 : 700); return; }
    MB = null; var got = clue('music'); show('atclue', '\uD83C\uDFB6 THE MUSIC BOX OPENS', 'A tiny drawer pops out', got ? '<div class="atClue">' + esc(UI.clueText('music')) + '</div>' : '<div class="arNote">The ballerina takes a bow. You already have this clue.</div>', '<button class="bigBtn" id="atOk">NICE</button>'); on('atOk', function () { close(); }); }
  UI._mbSolve = function () { musicBox(); MB.busy = false; MB.seq.slice(0, 4).forEach(function (i) { mbTap(i); }); MB.busy = false; MB.seq.slice(0, 6).forEach(function (i) { if (MB) mbTap(i); }); };
  // Toy chest: memory pairs (4 pairs)
  var TP = null, TOYS = ['\uD83E\uDDF8', '\uD83E\uDE80', '\uD83D\uDE82', '\uD83E\uDE86'];
  function toyBox() { TP = { cards: shuffle(TOYS.concat(TOYS)), up: [], done: [], lock: false, flips: 0 }; drawTP(); }
  function drawTP(msg) { show('attoys', '\uD83E\uDDF8 THE TOY CHEST', 'Match the pairs of toys', '<div class="atCards">' + TP.cards.map(function (c, i) { var open = TP.up.indexOf(i) >= 0 || TP.done.indexOf(i) >= 0; return '<button class="atCard' + (open ? ' up' : '') + (TP.done.indexOf(i) >= 0 ? ' done' : '') + '" data-i="' + i + '">' + (open ? c : '\u2753') + '</button>'; }).join('') + '</div><div class="arNote dim">' + esc(msg || 'Flips: ' + TP.flips) + '</div>', '<button class="pill" id="atOk">CLOSE</button>');
    on('atOk', function () { TP = null; close(); }); Array.prototype.forEach.call(document.querySelectorAll('.atCard'), function (b) { b.addEventListener('click', function () { tpTap(+b.getAttribute('data-i')); }); }); }
  function tpTap(i) { if (!TP || TP.lock || TP.up.indexOf(i) >= 0 || TP.done.indexOf(i) >= 0) return; TP.up.push(i); TP.flips++; snd('tick');
    if (TP.up.length === 2) { var a = TP.up[0], b = TP.up[1]; if (TP.cards[a] === TP.cards[b]) { TP.done.push(a, b); TP.up = []; snd('point'); if (TP.done.length === 8) { TP = null; var got = clue('toys'); show('atclue', '\uD83E\uDDF8 ALL PAIRED UP!', 'A note was stuck to the bottom of the chest', got ? '<div class="atClue">' + esc(UI.clueText('toys')) + '</div>' : '<div class="arNote">The toys look very pleased with themselves.</div>', '<button class="bigBtn" id="atOk">NICE</button>'); on('atOk', function () { close(); }); return; } }
      else { TP.lock = true; drawTP(); setTimeout(function () { if (!TP) return; TP.up = []; TP.lock = false; drawTP(); }, AT.fast ? 5 : 650); return; } }
    drawTP(); }
  UI._tpSolve = function () { toyBox(); TOYS.forEach(function (t) { var ix = []; TP.cards.forEach(function (c, i) { if (c === t) ix.push(i); }); tpTap(ix[0]); if (TP) tpTap(ix[1]); }); };
  // Telescope: connect the stars 1..N (this week's ghost constellation)
  var CONS = [['Boo-ford Major', [[50, 15], [70, 25], [78, 50], [70, 80], [50, 72], [30, 80], [22, 50], [30, 25]]], ['Gus Major', [[30, 30], [70, 30], [80, 55], [65, 80], [35, 80], [20, 55]]], ['The Big Ladder', [[35, 15], [65, 15], [65, 50], [35, 50], [35, 85], [65, 85]]], ['The Lantern', [[50, 10], [70, 30], [70, 75], [30, 75], [30, 30]]], ['Dennis the Mop', [[50, 10], [50, 55], [30, 85], [50, 70], [70, 85]]]];
  var SC = null;
  function scope() { var c = CONS[AT.weekSeed() % CONS.length]; SC = { c: c, next: 0, order: shuffle(c[1].map(function (_, i) { return i; }), AT.rng(AT.weekSeed())) }; drawSC(); }
  function drawSC(msg) { var pts = SC.c[1], lines = ''; for (var k = 1; k < SC.next; k++) { var a = pts[k - 1], b = pts[k]; lines += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"/>'; } if (SC.next === pts.length && pts.length) { var l0 = pts[pts.length - 1], f0 = pts[0]; lines += '<line x1="' + l0[0] + '" y1="' + l0[1] + '" x2="' + f0[0] + '" y2="' + f0[1] + '"/>'; }
    var stars = pts.map(function (p, i) { return '<g class="atStar' + (i < SC.next ? ' on' : '') + '" data-i="' + i + '"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="5"/><text x="' + p[0] + '" y="' + (p[1] - 7) + '">' + (i + 1) + '</text></g>'; }).join('');
    show('atscope', '\uD83D\uDD2D THE GREAT TELESCOPE', 'Connect the stars 1, 2, 3\u2026 to find this week\u2019s ghost constellation', '<svg class="atSky" viewBox="0 0 100 100">' + lines + stars + '</svg><div class="arNote dim">' + esc(msg || 'Tap star ' + (SC.next + 1) + '.') + '</div>', '<button class="pill" id="atOk">CLOSE</button>', 'obs');
    on('atOk', function () { SC = null; close(); }); Array.prototype.forEach.call(document.querySelectorAll('.atStar'), function (g) { g.addEventListener('click', function () { star(+g.getAttribute('data-i')); }); }); }
  function star(i) { if (!SC) return; if (i !== SC.next) { snd('bad'); return drawSC('That\u2019s star ' + (i + 1) + '. Look for star ' + (SC.next + 1) + '!'); } SC.next++; snd('tick'); if (SC.next < SC.c[1].length) return drawSC();
    var s = S(), wk = AT.weekKey(), first = !s.stars[wk]; s.stars[wk] = true; s.stars.ever = true; save(); AT.ev('atStars'); var pr = AT.grant('brass_scope'); if (first) tix(15, 'stargazing'); snd('win'); drawSC('\u2728 It\u2019s ' + SC.c[0].toUpperCase() + '! ' + (pr ? 'Sir Twinkle gives you his little Brass Telescope! \uD83C\uDF81' : first ? 'A new constellation every week!' : 'Come back next week for a new one.')); }
  UI._scopeSolve = function () { scope(); SC.c[1].forEach(function (_, i) { star(i); }); };
  // Weekly puzzle room (theme from the ISO week)
  var WK = null;
  function weekly() { var th = AT.theme(), r = AT.rng(AT.weekSeed() + (WK && WK.retry || 0)); WK = { th: th.id, r: r, step: 0 };
    if (th.id === 'clock') { WK.g = [0, 0, 0, 0].map(function () { return Math.floor(r() * 4); }); if (WK.g.every(function (v) { return v === 0; })) WK.g[1] = 2; }
    if (th.id === 'candle') { WK.h = shuffle([1, 2, 3, 4, 5, 6], r); WK.lit = []; }
    if (th.id === 'mirror') { WK.round = 0; WK.pos = Math.floor(r() * 3); WK.shuffling = false; }
    if (th.id === 'kitchen') { WK.recipe = shuffle(['\uD83D\uDC38', '\uD83C\uDF44', '\uD83E\uDDB4', '\uD83C\uDF36\uFE0F', '\uD83E\uDD5A', '\uD83C\uDF6C'], r).slice(0, 4); WK.added = []; WK.peek = true; setTimeout(function () { if (WK && WK.th === 'kitchen') { WK.peek = false; drawWK(); } }, AT.fast ? 5 : 2600); }
    drawWK(); }
  function drawWK(msg) { var th = AT.theme(), h = '';
    if (WK.th === 'clock') h = '<div class="arNote">Turn the gears until every arrow points UP. Each gear turns its neighbours too!</div><div class="atGears">' + WK.g.map(function (v, i) { return '<button class="atGear" data-i="' + i + '" style="transform:rotate(' + v * 90 + 'deg)">\u2B06\uFE0F</button>'; }).join('') + '</div>';
    if (WK.th === 'candle') h = '<div class="arNote">Light the candles from SHORTEST to TALLEST.</div><div class="atCandles">' + WK.h.map(function (v, i) { return '<button class="atCandle' + (WK.lit.indexOf(i) >= 0 ? ' lit' : '') + '" data-i="' + i + '" style="--h:' + (24 + v * 12) + 'px"><i></i></button>'; }).join('') + '</div>';
    if (WK.th === 'mirror') h = '<div class="arNote">A ghost hides behind a mirror, then the mirrors shuffle! Round ' + (WK.round + 1) + ' of 3.</div><div class="atMirrors">' + [0, 1, 2].map(function (i) { return '<button class="atMirror" data-i="' + i + '">' + (WK.show && i === WK.pos ? '\uD83D\uDC7B' : '\uD83E\uDE9E') + '</button>'; }).join('') + '</div>' + (WK.show == null ? '<button class="pill" id="atWkGo">SHOW ME THE GHOST</button>' : '');
    if (WK.th === 'kitchen') h = '<div class="arNote">' + (WK.peek ? 'Memorize the potion recipe!' : 'Add the ingredients in the same order!') + '</div><div class="atRecipe">' + (WK.peek ? WK.recipe.join(' ') : WK.added.join(' ') + ' <span class="dim">' + '\u25A2 '.repeat(4 - WK.added.length) + '</span>') + '</div>' + (WK.peek ? '' : '<div class="atIngr">' + ['\uD83D\uDC38', '\uD83C\uDF44', '\uD83E\uDDB4', '\uD83C\uDF36\uFE0F', '\uD83E\uDD5A', '\uD83C\uDF6C'].map(function (x) { return '<button class="atIn" data-x="' + x + '">' + x + '</button>'; }).join('') + '</div>');
    show('atweekly', th.icon + ' ' + th.name.toUpperCase(), 'Weekly puzzle room \u00b7 week ' + AT.week().w + (AT.weeklyDone() ? ' \u00b7 \u2714 solved' : ''), h + (msg ? '<div class="arNote gus">' + esc(msg) + '</div>' : ''), '<button class="pill" id="atOk">CLOSE</button>');
    on('atOk', function () { WK = null; close(); }); on('atWkGo', function () { mirrorRound(); });
    Array.prototype.forEach.call(document.querySelectorAll('.atGear'), function (b) { b.addEventListener('click', function () { gear(+b.getAttribute('data-i')); }); });
    Array.prototype.forEach.call(document.querySelectorAll('.atCandle'), function (b) { b.addEventListener('click', function () { candle(+b.getAttribute('data-i')); }); });
    Array.prototype.forEach.call(document.querySelectorAll('.atMirror'), function (b) { b.addEventListener('click', function () { mirror(+b.getAttribute('data-i')); }); });
    Array.prototype.forEach.call(document.querySelectorAll('.atIn'), function (b) { b.addEventListener('click', function () { ingr(b.getAttribute('data-x')); }); }); }
  function gear(i) { [i - 1, i, i + 1].forEach(function (j) { if (j >= 0 && j < 4) WK.g[j] = (WK.g[j] + 1) % 4; }); snd('tick'); if (WK.g.every(function (v) { return v === 0; })) return weeklyWin(); drawWK(); }
  function candle(i) { var want = WK.h.indexOf(WK.lit.length + 1); if (i !== want) { WK.lit = []; snd('bad'); return drawWK('Whoosh! A draft blew them all out. Shortest first!'); } WK.lit.push(i); snd('ding'); if (WK.lit.length === 6) return weeklyWin(); drawWK(); }
  function mirrorRound() { WK.show = true; drawWK(); setTimeout(function () { if (!WK) return; WK.show = false; WK.pos = Math.floor(WK.r() * 3); drawWK('The mirrors spin\u2026 where did the ghost go?'); }, AT.fast ? 5 : 1100); }
  UI._mirrorPos = function () { return WK ? WK.pos : -1; };
  function mirror(i) { if (WK.show !== false) return; WK.show = true; if (i === WK.pos) { snd('ding'); WK.round++; if (WK.round >= 3) return weeklyWin(); drawWK('Found it! Again\u2026'); setTimeout(function () { if (WK) mirrorRound(); }, AT.fast ? 5 : 900); return; }
    snd('whoo'); WK.round = 0; drawWK('Boo! Wrong mirror. Back to round 1.'); setTimeout(function () { if (WK) mirrorRound(); }, AT.fast ? 5 : 1100); }
  function ingr(x) { if (WK.peek) return; if (WK.recipe[WK.added.length] !== x) { WK.added = []; WK.peek = true; snd('bad'); drawWK('BLORP. Wrong ingredient! Here\u2019s the recipe again.'); setTimeout(function () { if (WK) { WK.peek = false; drawWK(); } }, AT.fast ? 5 : 2200); return; } WK.added.push(x); snd('point'); if (WK.added.length === 4) return weeklyWin(); drawWK(); }
  function weeklyWin() { var s = S(), wk = AT.weekKey(), first = !s.weekly[wk]; s.weekly[wk] = Date.now(); save(); AT.ev('atWeekly', Object.keys(s.weekly).length); snd('win'); var pr = AT.grant('spooky_lantern'); if (first) tix(25, 'weekly puzzle room');
    var th = AT.theme(); show('atweekly', '\u2728 ' + th.name.toUpperCase() + ' SOLVED!', first ? 'A brand-new room appears next week' : 'Already solved this week', '<div class="atBig">' + th.icon + '\u2728</div>' + (pr ? '<div class="arNote">\uD83C\uDF81 Rare prize: <b>Spooky Lantern</b>! A tiny friendly ghost lives in it.</div>' : '') + '<div class="arNote dim">Come back next week: the puzzle room redecorates itself!</div>', '<button class="bigBtn" id="atOk">SPOOKTACULAR</button>'); WK = null; on('atOk', function () { close(); }); }
  UI._weeklySolve = function () { weekly(); if (WK.th === 'clock') { var g0 = WK.g.slice(), sol = null; for (var m = 0; m < 256 && !sol; m++) { var pr = [m & 3, (m >> 2) & 3, (m >> 4) & 3, (m >> 6) & 3], g = g0.slice(); pr.forEach(function (c, i) { [i - 1, i, i + 1].forEach(function (j) { if (j >= 0 && j < 4) g[j] = (g[j] + c) % 4; }); }); if (g.every(function (v) { return v === 0; })) sol = pr; } if (sol) sol.forEach(function (c, i) { for (var q = 0; q < c && WK; q++) gear(i); }); }
    else if (WK.th === 'candle') { for (var n = 1; n <= 6 && WK; n++) candle(WK.h.indexOf(n)); }
    else if (WK.th === 'mirror') { for (var k = 0; k < 3 && WK; k++) { WK.show = false; mirror(WK.pos); } }
    else if (WK.th === 'kitchen') { WK.peek = false; WK.recipe.slice().forEach(function (x) { if (WK) ingr(x); }); } return AT.weeklyDone(); };

  /* ---------- quest journal + tracker chip ---------- */
  function steps() { var s = S(); return [
    ['Find the hidden attic hatch', s.found], ['Borrow a ladder', s.ladder !== 'gary' || s.opened], ['Put the ladder under the hatch', s.ladder === 'placed' || s.opened], ['Check the hatch keypad', s.keypadSeen || s.opened],
    ['Find Gary\u2019s long-lost brother', s.larryMet], ['Get a fuse', s.fuse !== 'none'], ['Install the fuse', s.fuse === 'installed' || s.opened], ['Learn the attic code', s.codeSeen || s.opened], ['Open the attic', s.opened],
    ['Find 3 clues in the attic (' + AT.clueCount() + '/3)', AT.clueCount() >= 3], ['Open the long corridor', s.door1], ['Solve the library bookshelf', s.books], ['Look through the great telescope', !!s.stars.ever]]; }
  UI.steps = steps;
  function journal() { var s = S(), st = steps(), cl = CLUE_TXT(), firstOpen = st.findIndex(function (q) { return !q[1]; }), shown = st.filter(function (q, i) { return q[1] || i === firstOpen; });
    var h = '<div class="atObj">\uD83C\uDFAF ' + esc(AT.objective().t) + '</div><ol class="atSteps">' + shown.map(function (q) { return '<li class="' + (q[1] ? 'ok' : 'now') + '">' + (q[1] ? '\u2714 ' : '\u25B6 ') + esc(q[0]) + '</li>'; }).join('') + (firstOpen >= 0 && firstOpen < st.length - 1 ? '<li class="dim">\u2026 ' + (st.length - shown.length) + ' more steps</li>' : '') + '</ol>';
    if (s.codeSeen && !s.opened) h += '<div class="arNote">\uD83D\uDCDD Attic code (from the ghost cabinet): <b class="atCode">' + AT.code() + '</b></div>';
    if (s.postcard === 'carry') h += '<div class="arNote">\uD83D\uDCEE You\u2019re carrying Larry\u2019s postcard for Gary.</div>';
    if (s.ladder === 'carry') h += '<div class="arNote">\uD83E\uDE9C You\u2019re carrying Gary\u2019s ladder.</div>';
    var clues = AT.CLUE_IDS.filter(function (k) { return s.clues[k]; }); if (clues.length) h += '<div class="atSec">\uD83D\uDD0D CLUES</div>' + clues.map(function (k) { return '<div class="atClue sm">' + esc(cl[k]) + '</div>'; }).join('');
    if (s.opened) { var th = AT.theme(); h += '<div class="atSec">\uD83D\uDC7B THE ATTIC</div><div class="atGrid"><span>\uD83D\uDD2E Spirit marbles <b>' + AT.orbCount() + '/' + AT.ORB_N + '</b></span><span>' + th.icon + ' This week: ' + esc(th.name) + ' <b>' + (AT.weeklyDone() ? '\u2714' : '\u2026') + '</b></span><span>\uD83C\uDFBC Mystery opus <b>' + (AT.opusDone() ? '\u2714 found' : 'somewhere\u2026') + '</b></span><span>\uD83D\uDD2D Constellation <b>' + (s.stars[AT.weekKey()] ? '\u2714' : '\u2026') + '</b></span></div>';
      var rooms = [['attic', 'The Attic'], ['attic2', 'Cobweb Library'], ['attic3', 'Foggy Observatory'], ['maint', 'Maintenance']]; h += '<div class="arNote dim">Discovered: ' + rooms.filter(function (r) { return s.visited[r[0]]; }).map(function (r) { return r[1]; }).join(' \u00b7 ') + '</div>'; }
    var pz = ['golden_fuse', 'haunted_box', 'brass_scope', 'spooky_lantern', 'pl_booford']; h += '<div class="atSec">\uD83C\uDF81 ATTIC RARES ' + pz.filter(function (id) { return GA.Prog && GA.Prog.owns(id); }).length + '/5</div><div class="atPz">' + pz.map(function (id) { var own = GA.Prog && GA.Prog.owns(id), p = GA.findPrize(id); return '<span class="' + (own ? 'own' : '') + '">' + (own && GA.PrizeArt ? '<img alt="" src="' + GA.PrizeArt.url(id) + '">' : '\u2753') + '<small>' + (own ? esc(p.name) : '???') + '</small></span>'; }).join('') + '</div>';
    if (s.found && !s.opened) h += '<div class="arNote dim">\u23F3 Rumor has it the hatch creeps somewhere new every 3 days (next move in ' + AT.daysLeft() + ' day' + (AT.daysLeft() === 1 ? '' : 's') + ').</div>';
    show('atjournal', '\uD83D\uDCDC QUEST JOURNAL', 'The Mysterious Attic', h, '<button class="bigBtn" id="atOk">CLOSE</button>'); on('atOk', function () { close(); }); }
  UI.journal = journal;
  var chipKey = '';
  function upd() { var c = $('atChip'); if (!c) return; var started = !$('hud').classList.contains('hidden'), o = AT.objective(), k = o.t + started; if (k === chipKey) return; chipKey = k; c.classList.toggle('hidden', !started); $('atChipT').textContent = o.t; }
  UI.upd = function () { chipKey = ''; upd(); };

  /* ---------- minimaps for the new rooms (no hatch marker, ever) ---------- */
  var MAPS = {
    attic: { minX: -113, maxX: -71, minZ: -15, maxZ: 15, rooms: [['MUSIC', -112, -99, -14, 0, '#f9a8d4'], ['PORTRAITS', -99, -85, -14, 0, '#c4b5fd'], ['WEEKLY', -85, -72, -14, 0, '#7dffe0'], ['TOYS', -112, -99, 0, 14, '#fde047'], ['STORAGE', -99, -85, 0, 14, '#e7dcc0'], ['PARLOR', -85, -72, 0, 14, '#93c5fd']],
      marks: function () { return [['\uD83E\uDE9C', -92, 12.4], ['\uD83C\uDFB6', -107, -10.6], ['\uD83E\uDDF8', -102.4, 12.6], ['\uD83D\uDC7B', -90.2, 6.4], [S().door1 ? '\uD83D\uDEAA' : '\u26D3\uFE0F', -73, 4], [AT.theme().icon, -78.5, -12]]; } },
    attic2: { minX: -113, maxX: -91, minZ: 29, maxZ: 47, rooms: [['COBWEB LIBRARY', -112, -92, 30, 46, '#c4b5fd']], marks: function () { return [['\uD83D\uDCDA', -110.8, 38], ['\uD83D\uDC7B', -101, 40.4], ['\uD83D\uDEAA', -92.8, 38]]; } },
    attic3: { minX: -113, maxX: -91, minZ: 59, maxZ: 77, rooms: [['FOGGY OBSERVATORY', -112, -92, 60, 76, '#a5b4fc']], marks: function () { return [['\uD83D\uDD2D', -102, 67.4], ['\uD83D\uDC7B', -106.6, 71.6], ['\uD83D\uDEAA', -92.8, 68]]; } },
    maint: { minX: 19, maxX: 35, minZ: 99, maxZ: 113, rooms: [['MAINTENANCE', 20, 34, 100, 112, '#e8742a']], marks: function () { return [['\uD83E\uDDF0', 27, 111.4], ['\u26A1', 24.6, 100.8], ['\uD83D\uDC7B', 30.4, 101], ['\uD83D\uDEAA', 20.8, 106]]; } }
  };
  UI.map = function (area) { return MAPS[area] || null; };

  /* ---------- hints from Gus + Gus Jr. ---------- */
  var GUS_ATTIC = ['I SWEAR there was an attic above the Suggestion Booth once. Now it\u2019s just ceiling. I\u2019m not crazy. Don\u2019t look at me like that.', 'Back in \u201983 we had attic tours. Then the attic\u2026 wandered off. Attics don\u2019t DO that. And yet.', 'If you hear the ceiling creak, it\u2019s not the building settling. Buildings don\u2019t settle. They SCHEME.'];
  function gusHook() { if (!GA.Hall || GA.Hall._atWrapped) return; var t0 = GA.Hall.talk; GA.Hall._atWrapped = true;
    GA.Hall.talk = function () { t0.apply(GA.Hall, arguments); var s = S(); if (s.opened || Math.random() < 0.5) return; setTimeout(function () { var line = GUS_ATTIC[Math.floor(Math.random() * GUS_ATTIC.length)]; if (GA.Hall3D && GA.Hall3D.say) GA.Hall3D.say(line, 7); toast('\uD83E\uDDD3 Gus: \u201C' + line + '\u201D', 6000); }, 2600); }; }
  if (GA.Areas && GA.Areas.GJ_LINES) ['Dad says there\u2019s an attic. Dad also says the 8-track is coming back.', 'An attic? If it existed, I\u2019d have catalogued it. Twice. Grumble.', 'Dad says the attic moves around. I say Dad needs a nap.', 'That new robot, Mimi? Too cheerful. Suspiciously cheerful. Dad agrees.', 'Mimi said I have \u201Cgreat customer energy\u201D. I have never been so insulted.', 'When the power goes out, Mimi gets grumpy. Finally, a coworker who gets me.'].forEach(function (l) { GA.Areas.GJ_LINES.push(l); });

  /* ---------- per-frame + init ---------- */
  var upT = 0;
  AT.UIframe = function (t, dt) { upT += dt; if (upT > 0.5) { upT = 0; upd(); } };
  AT.onEnter = function (k) { if (k === 'attic' && !S().welcomed) { S().welcomed = true; AT.save(); setTimeout(function () { NPCsay('boo', 'A visitor! Welcome to the attic. Do mind the cobwebs, they\u2019re load-bearing.'); }, 600); }
    if (k === 'attic3') NPCsay('twinkle', 'Ah, a fellow stargazer! Have a look through my telescope.'); if (k === 'maint' && S().postcard === 'delivered') NPCsay('larry', 'Gary\u2019s coming for Taco Tuesday!'); };
  UI.init = function () {
    garyHook(); ghostHook(); gusHook();
    if (GA.Hub && GA.Hub.setCarry && !GA.Hub._atCarry) { var sc = GA.Hub.setCarry; GA.Hub._atCarry = true; GA.Hub.setCarry = function (c) { c = Object.assign({}, c || {}); if (S().ladder === 'carry') c.hand = 'attic_ladder'; sc(c); }; }
    applyCarry();
    if (!$('atChip')) { var d = document.createElement('button'); d.id = 'atChip'; d.className = 'atChip hidden'; d.innerHTML = '<b>\uD83D\uDCDC</b><span id="atChipT"></span>'; d.addEventListener('click', function (e) { e.stopPropagation(); if (GA.AreasUI.isOpen() || (GA.MG && GA.MG.isOpen())) return; snd('menu'); journal(); }); document.body.appendChild(d); }
    upd();
  };
})();
