/* Grok Arcade - RETRO ARCADE / TIME MACHINE: walk-up prompts, Lily, the Chrono-Gate (trips, breakdowns, repairs), Dale the
   technician, the 1983 crowd (young Gary, Larry, young Gus), the payphone (hints + Lily's emergency recall), the time-warp effect,
   the quest chip and minimaps. Player-visible text never says exactly where parts or supplies are (only which area / a riddle). */
(function () {
  'use strict';
  var UI = GA.RetroUI = {}, RT = GA.Retro;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function snd(n) { if (GA.Audio) GA.Audio.play(n); }
  function toast(m, ms) { if (GA.Fix && GA.Fix.toast) GA.Fix.toast(String(m).replace(/<[^>]+>/g, ''), ms || 3600); }
  RT.toast = toast;
  function S() { return RT.S(); }
  function save() { RT.save(); RT.refresh(); upd(); }
  function show(kind, title, sub, body, foot, cls) { GA.AreasUI.show(kind, title, sub, body, foot, 'attic tmPanel ' + (cls || '')); }
  function close(silent) { GA.AreasUI.close(silent); }
  function on(id, f) { var e = $(id); if (e) e.addEventListener('click', f); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function say(who, s, secs) { RT.say(who, s, secs || 4.5); }
  function note(who, s) { return '<div class="arNote gus"><b>' + esc(who) + ':</b> \u201C' + esc(s) + '\u201D</div>'; }
  function info(s) { return '<div class="arNote">' + s + '</div>'; }
  function clock() { var d = new Date(RT.now()); function p(n) { return (n < 10 ? '0' : '') + n; } return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()); }
  var AREA_NAME = { tunnel: 'the SECRET TUNNEL', basement: 'the SECRET BASEMENT', food: 'the FOOD COURT', main: 'the ARCADE FLOOR', bonus: 'the BONUS ZONE', gallery: 'the GAME GALLERY' };

  /* ---------- lines ---------- */
  var LILY_HI = ['It is ' + '{T}' + '. You are exactly on time. Statistically, that never happens.', 'Greetings. I am Lily. I already knew you would say hi. I said hi back yesterday.', 'Welcome to the Time Lab. Please do not touch anything that hums. Everything hums.', 'Oh. A visitor. Mimi will be insufferable about this. She LOVES visitors.'];
  var LILY_IDLE = ['Mimi is my sister. Same factory, same rats, very different settings. She got \u201Cbubbly\u201D. I got \u201Cpunctual\u201D.', 'Ratita Industries built me to run the Chrono-Gate. Luna did the wiring, Pi-rat did the math, Snowie did the snacks.', 'Time travel tip: do not high-five yourself. The paperwork is unbelievable.', 'I calibrate the gate to October 1983. The year the arcade opened. Also the year of very big hair.', 'Mimi calls me every day. I let it ring. I already know what she\u2019ll say. (\u201CHI HI HI!\u201D)', 'Fun fact: the Chrono-Gate runs on Tele Juice. Unfun fact: so does Dale, apparently.', 'If you meet young Gus, do not mention Gus Jr. He will not believe you. Nobody believes the future.', 'My clipboard has a list of everything that goes wrong. It is a long clipboard.'];
  var DALE = ['I\u2019m a certified Ratita Industries technician! Certified by who? \u2026Don\u2019t worry about it.', 'You know, the trick with time machines is to hit them really hard. That\u2019s the whole trick. Mostly.', 'My cousin fixes toasters. Same thing, really. Bread goes in, bread comes out\u2026 in 1983.', 'I didn\u2019t BREAK it more. I made it\u2026 differently fixed.', 'Fuses are the little glowy tubes. Tele Juice is the green can. Please don\u2019t drink the green can.', 'Lily says I\u2019m \u201Ca liability\u201D. I think that\u2019s like a lieutenant. Pretty cool.'];
  var GARY_Y = ['Whoa, cool jacket! Is that from the future? Ha! Just kidding. \u2026Unless?', 'I\u2019m Gary! I work the prize counter on weekends. Someday I\u2019m gonna run the computers here. Computers are the FUTURE, man.', 'My big brother Larry fixes all the machines. He\u2019s the coolest. Don\u2019t tell him I said that.', 'Wanna know a secret? Every cabinet has a high score board. I\u2019m on, like, three of them. Okay, one.', 'Have you tried turning it off and on again? I just made that up. I think it\u2019s gonna catch on.', 'Mr. Gus says no running, no yelling and no fun after 9. I\u2019m pretty sure the last one is a joke.', 'I\u2019m saving my tickets for the giant plush up top. 4,000 more tickets. I can do it. Probably by 2009.'];
  var LARRY_Y = ['Hand me that wrench, would ya? Not that one. The OTHER one. Thanks, kid.', 'This pinball machine tilts if you look at it funny. I\u2019m teaching it some manners.', 'My little brother Gary? Good kid. Asks a lot of questions about \u201Ccomputers\u201D. Whatever those are.', 'Someday I\u2019m gonna get a mop and name it Dennis. Every great handyman needs a Dennis.', 'Missing? Me? HA! Where would I go? I\u2019ll be right here at the Grok Arcade forever. \u2026Probably.', 'The boiler in the basement? Never touch it. Never ever. Something tells me it\u2019s got a grudge.', 'That weird phone booth by the wall showed up yesterday. Gus thinks it\u2019s a prank. I think it\u2019s got good bolts.'];
  var GUS_Y = ['What do you want, kid? Tokens are four for a dollar. Complaints are free, and also ignored.', 'No running. No yelling. No roller skates. I don\u2019t care if it\u2019s 1983, rules are rules.', 'A son? ME? Ha! If I ever have a kid I\u2019ll name him Gus Jr. the 2nd just to confuse everybody.', 'Gus Jr.? Never heard of him. And if he existed, he\u2019d be grumpy. And right about everything.', 'That phone booth thing by the wall? Not mine. If it\u2019s yours, it\u2019s blocking my fire exit.', 'This arcade is gonna be around for a LONG time. You know how I know? Because I said so.', 'Someday I\u2019ll run a Hall of Records. With a big desk. And a stamp. I\u2019ve always wanted a stamp.', 'You smile too much. Kids these days. Wait. What year are YOU from?'];
  var GUS_FIRST = 'Hmph. A new kid. You\u2019re not from around here, are you? Nobody dresses like that. Not even Larry.';
  var GARY_FIRST = 'Hi! I\u2019m Gary! You look kinda familiar\u2026 Like, from a dream about a help desk. Weird, right?';
  var LARRY_FIRST = 'Howdy! Larry, maintenance. Not missing, not lost, just under this pinball machine. Why would I be missing?';
  UI.lines = { LILY_IDLE: LILY_IDLE, DALE: DALE, GARY_Y: GARY_Y, LARRY_Y: LARRY_Y, GUS_Y: GUS_Y };

  /* ---------- walk-up prompts ---------- */
  UI.prompt = function (cab) { var s = S(), k = cab.kind;
    switch (k) {
      case 'tm_secret': return s.found ? { tag: 'SECRET TUNNEL', name: 'Behind the old cabinet', desc: 'A narrow brick tunnel leads deep under the arcade. A purple glow at the far end\u2026', btn: 'ENTER', key: 'go in', cls: 'npc' }
        : { tag: 'OUT OF ORDER', name: 'Mystery cabinet \u201981', desc: 'Dead screen, no coin slot light\u2026 but a cold draft is blowing out from behind it.', btn: 'PEEK<br>BEHIND', key: 'peek behind it', cls: 'npc' };
      case 'tm_tback': return { tag: 'EXIT', name: 'Back to the basement', desc: '', btn: 'GO', key: 'go back', cls: 'npc' };
      case 'tm_labdoor': return { tag: 'RATITA INDUSTRIES', name: 'The Time Lab', desc: 'A round vault door with a purple window. Something inside goes \u201Cvworp\u201D.', btn: 'OPEN', key: 'open the vault door', cls: 'npc' };
      case 'tm_labexit': return { tag: 'EXIT', name: 'Back to the tunnel', desc: '', btn: 'GO', key: 'go back', cls: 'npc' };
      case 'tm_lily': return { tag: 'TIME LAB', name: 'Lily the Bot', desc: 'Mimi\u2019s not-so-biological sister. Runs the Chrono-Gate. Very punctual.', btn: 'TALK', key: 'talk to Lily', cls: 'npc' };
      case 'tm_gate': return s.broken ? { tag: 'BROKEN \u26A0\uFE0F', name: 'The Chrono-Gate', desc: s.tech === 'done' ? 'Fuses ' + s.fuses + '/3 \u00b7 Tele Juice ' + s.juice + '/1. Bring Dale\u2019s supplies back here.' : 'Smoking, sparking and very much not working.', btn: 'CHECK', key: 'check the gate', cls: 'broken' }
        : { tag: 'TIME MACHINE', name: 'The Chrono-Gate', desc: 'Destination: OCTOBER 1983, the Grok Arcade\u2019s opening year.', btn: '\u23F3 TRAVEL', key: 'step into the gate', cls: 'prize', pb: 'pzPlay' };
      case 'tm_phone': return { tag: 'HOTLINE', name: 'Ratita Industries hotline', desc: s.broken ? (s.tech === 'none' ? 'For when stuff goes BOOM. Stuff went BOOM.' : 'Dale is already on the job. \u2026Unfortunately.') : 'For when stuff goes BOOM. Nothing is BOOMing right now.', btn: 'CALL', key: 'pick up the phone', cls: 'broken' };
      case 'tm_tech': return { tag: 'RATITA INDUSTRIES', name: 'Dale the technician', desc: 'Certified. Allegedly.', btn: 'TALK', key: 'talk to Dale', cls: 'npc' };
      case 'tm_sup': return { tag: 'DALE DROPPED IT', name: cab.data.kind === 'juice' ? 'A can of TELE JUICE!' : 'A glowing FUSE!', desc: 'Dale\u2019s supplies for the Chrono-Gate. Fuses ' + s.fuses + '/3 \u00b7 juice ' + s.juice + '/1', btn: 'GRAB', key: 'grab it', cls: 'prize' };
      case 'tm_oldtm': var n = RT.partCount(); return { tag: '1983', name: 'Chrono-Booth Mk.0', desc: n >= 3 ? 'All 3 parts are in! It\u2019s humming. Ready to go home?' : 'Lily\u2019s first time machine. It needs 3 parts to work: ' + n + '/3 found.', btn: n >= 3 ? '\u23F3 GO<br>HOME' : 'LOOK', key: n >= 3 ? 'go home' : 'look', cls: n >= 3 ? 'prize' : 'npc', pb: n >= 3 ? 'pzPlay' : null };
      case 'tm_part': var p = RT.PARTS.find(function (q) { return q.id === cab.data.part; }); return { tag: 'A PART!', name: p ? p.icon + ' ' + p.name : 'Something shiny', desc: 'This must be one of the Chrono-Booth\u2019s missing parts!', btn: 'GRAB', key: 'grab it', cls: 'prize' };
      case 'tm_cab': var g = GA.MG.list && GA.MG.list().find ? null : null; void g; return { tag: '1983 CABINET \u00b7 BONUS', name: cab.game.name, desc: 'Best: ' + GA.getBest(cab.data.game) + ' \u00b7 pays tickets like every bonus game', btn: '&#9654; PLAY', key: 'play', cls: '' };
      case 'tm_gary': return { tag: '1983', name: 'Young Gary', desc: 'Prize counter kid. Big hair, bigger dreams.', btn: 'TALK', key: 'talk to Gary', cls: 'npc' };
      case 'tm_larry': return { tag: '1983', name: 'Larry', desc: 'Maintenance. Definitely not missing.', btn: 'TALK', key: 'talk to Larry', cls: 'npc' };
      case 'tm_gus': return { tag: '1983', name: 'Gus (younger, still grumpy)', desc: 'Runs the change booth. Brown mustache, same frown.', btn: 'TALK', key: 'talk to Gus', cls: 'npc' };
      case 'tm_payphone': return { tag: '1983', name: 'Payphone', desc: RT.recallReady() ? 'Call Lily: hints, or an EMERGENCY RECALL home.' : 'Call Lily for a hint. (Her emergency recall needs a few minutes to charge.)', btn: 'CALL', key: 'make a call', cls: 'npc' };
      case 'tm_odoor': return { tag: '1983', name: 'The front doors', desc: 'Sunny 1983 outside. Probably better not to wander off.', btn: 'PEEK', key: 'peek outside', cls: 'npc' };
    }
    return { tag: 'TIME LAB', name: cab.game.name, desc: '', btn: 'LOOK', key: 'look', cls: 'npc' };
  };

  /* ---------- interactions ---------- */
  UI.open = function (cab) { var s = S(), k = cab.kind;
    if (k === 'tm_secret') { if (!s.found) return discover(); snd('creak'); RT.travel('tunnel'); return; }
    if (k === 'tm_tback') { snd('creak'); RT.travel('base_secret'); return; }
    if (k === 'tm_labdoor') { snd('unlock'); RT.travel('tlab'); return; }
    if (k === 'tm_labexit') { snd('open'); RT.travel('tunnel_back'); return; }
    if (k === 'tm_lily') return lily();
    if (k === 'tm_gate') return gate();
    if (k === 'tm_phone') return hotline();
    if (k === 'tm_tech') return dale();
    if (k === 'tm_sup') return grabSupply(cab);
    if (k === 'tm_oldtm') return oldBooth();
    if (k === 'tm_part') return grabPart(cab);
    if (k === 'tm_cab') { s.played = s.played || {}; GA.openBonus(cab.data.game); return; }
    if (k === 'tm_gary') return talk1983('ygary', 'gary', '\uD83C\uDF9F\uFE0F YOUNG GARY', 'Prize counter \u00b7 October 1983', GARY_FIRST, GARY_Y, 'tmGary');
    if (k === 'tm_larry') return talk1983('ylarry', 'larry', '\uD83E\uDDF0 LARRY', 'Maintenance \u00b7 October 1983 \u00b7 not missing (yet)', LARRY_FIRST, LARRY_Y, 'tmLarry');
    if (k === 'tm_gus') return talk1983('ygus', 'gus', '\uD83D\uDE20 GUS', 'Change booth \u00b7 October 1983 \u00b7 no son (yet)', GUS_FIRST, GUS_Y, 'tmGus');
    if (k === 'tm_payphone') return payphone();
    if (k === 'tm_odoor') { snd('tick'); toast(pick(['\uD83C\uDF05 Outside: a sunny 1983 street, a red hatchback, and a kid with a boombox. Better stay in. You might step on a butterfly.', '\uD83D\uDEAA Gus (from the booth): \u201CDoors are for CUSTOMERS. You\u2019re a\u2026 what are you, exactly?\u201D', '\uD83D\uDCFB Somewhere outside, a radio is playing a song that won\u2019t be popular for another 2 years.']), 4800); return; }
  };
  RT.travel = function (where, cb) { if (GA.Areas && GA.Areas.travel) GA.Areas.travel(where, cb); };
  function discover() { var s = S(); s.found = true; save(); RT.ev('tmFound'); snd('creak'); show('tmfound', '\uD83D\uDD73\uFE0F A SECRET TUNNEL!', 'behind the out-of-order cabinet',
    info('You squeeze behind the old MYSTERY \u201981 cabinet\u2026 it slides aside with a <i>screeeech</i>. Behind it: a hole in the brick wall and a long tunnel glowing purple at the far end.') + info('A tiny sign says <b>RATITA INDUSTRIES \u00b7 TEMPORAL RESEARCH</b>.'), '<button class="bigBtn" id="tmGo">GO IN</button><button class="pill" id="tmNo">LATER</button>');
    on('tmGo', function () { close(true); RT.travel('tunnel'); }); on('tmNo', function () { close(); }); }

  /* ---------- Lily ---------- */
  function lily() { var s = S(), h = '', foot = '<button class="pill" id="tmClose">BYE</button>', acts = {};
    RT.setLilyFace(s.broken ? 'worried' : 'cool');
    if (!s.lilyMet) { s.lilyMet = true; save(); RT.ev('tmLily'); RT.setLilyFace('happy');
      h = note('Lily', 'It is ' + clock() + '. You found my lab. Mimi owes me a cheese wedge; I said someone would come before Tuesday.') + note('Lily', 'I am Lily. Temporal Operations Unit, Ratita Industries. Mimi\u2019s sister. Not biologically. Robotically. It\u2019s complicated.') + note('Lily', 'This is the CHRONO-GATE. It goes to one place: the Grok Arcade in October 1983, the year it opened. Old cabinets, big hair, a very young Gary.') + info('\u26A0\uFE0F Lily: \u201CRules. One: the gate only goes there; to come back you must fix my OLD time machine, the Chrono-Booth Mk.0, which lives in 1983 and is always missing parts. Two: if you get stuck, find a payphone and call me. I will pull you home. Eventually.\u201D');
      foot = '<button class="bigBtn" id="tmGoGate">TAKE ME TO 1983!</button>' + foot; acts.tmGoGate = function () { close(true); gate(); }; }
    else if (s.broken) { h = note('Lily', s.tech === 'none' ? 'The gate broke. Again. Please call the Ratita Industries hotline on the red phone. A technician will come. That is the part I worry about.' : s.tech === 'coming' ? 'Dale is coming. I have prepared a fire extinguisher. And a second one.' : 'Dale dropped our supplies all over the arcade on his way in. I need 3 FUSES and 1 TELE JUICE. Bring them to the gate.');
      if (s.tech === 'done') { var left = remainingSup(); h += info('\uD83D\uDCE1 <b>Lily\u2019s sensors:</b> ' + (left.length ? 'still missing ' + left.map(function (x) { return (x.kind === 'juice' ? 'Tele Juice' : 'a fuse') + ' in ' + AREA_NAME[x.a]; }).join(', ') + '.' : 'everything found! Go to the gate.') + '</small>'); }
      var m = Math.ceil(RT.selfFixLeft() / 60); h += info('\uD83D\uDEE0\uFE0F Or wait for Lily\u2019s self-repair: about <b>' + m + ' min</b> left.'); }
    else { h = note('Lily', pick(LILY_IDLE)); if (s.trips) h += info('Trips through time: <b>' + s.trips + '</b> \u00b7 times home with the old booth: <b>' + s.backs + '</b>'); foot = '<button class="bigBtn" id="tmGoGate">\u23F3 SEND ME TO 1983</button>' + foot; acts.tmGoGate = function () { close(true); gate(); }; }
    snd('talk'); say('lily', s.broken ? 'Everything is fine. Nothing is fine.' : pick(['Precisely on time.', 'Hello. Again. Or for the first time, from your side.', 'Mind the gate. It bites.']));
    show('lily', '\uD83E\uDD16 LILY THE BOT', 'Time Lab \u00b7 Ratita Industries \u00b7 Mimi\u2019s sister', h, foot); on('tmClose', function () { close(); }); Object.keys(acts).forEach(function (id) { on(id, acts[id]); }); }
  function remainingSup() { var s = S(), act = RT.supPick(), out = []; act.forEach(function (n, slot) { if (!s.got[n]) out.push({ a: RT.SUP[n].a, kind: RT.supKind(slot) }); }); return out; }

  /* ---------- the Chrono-Gate ---------- */
  function gate() { var s = S();
    if (s.broken) { if (s.tech !== 'done') { RT.setLilyFace('worried'); say('lily', 'Please do not touch it. Call the hotline.'); toast('\u26A0\uFE0F The Chrono-Gate is broken! Call the Ratita Industries hotline (red phone on the wall).', 4200); snd('buzz'); RT.spark(6); return; }
      if (s.fuses >= 3 && s.juice >= 1) { show('tmfix', '\uD83D\uDEE0\uFE0F REPAIR THE CHRONO-GATE', 'you have everything!', info('\u26A1 3 fuses and \uD83E\uDDEA 1 Tele Juice. Slot them in and flip the big lever.'), '<button class="bigBtn" id="tmRep">INSTALL &amp; FLIP THE LEVER</button>'); on('tmRep', function () { close(true); RT.repair('you'); }); return; }
      show('tmfix', '\u26A0\uFE0F THE CHRONO-GATE', 'broken \u00b7 needs Dale\u2019s supplies', info('Fuses: <b>' + s.fuses + '/3</b> \u00b7 Tele Juice: <b>' + s.juice + '/1</b>') + info('Dale dropped them somewhere around the arcade on his way in. Lily\u2019s sensors can tell you which areas.'), '<button class="pill" id="tmOk">OK</button>'); on('tmOk', function () { close(); }); return; }
    if (!s.lilyMet) return lily();
    // sometimes it BREAKS (never on your first trip; your second trip always shows you what happens)
    var breaks = s.trips >= 1 && (s.breaks === 0 || Math.random() < 0.25);
    if (RT._forceBreak != null) { breaks = RT._forceBreak; RT._forceBreak = null; }
    if (breaks) return breakNow();
    RT._lever = true; snd('powerup'); say('lily', pick(['Destination locked: October 1983. Try not to change history. Small changes only.', 'Engaging. Hold still. Think about nice things. Not dinosaurs.', 'Three\u2026 two\u2026 I don\u2019t do one. Goodbye.']));
    warp(function () { s.trips++; s.past = true; s.pastAt = RT.now(); s.parts = {}; var first = !s.reached; s.reached = true; save(); RT.ev('tmTrip'); RT.travel('oldarc', function () { RT._lever = false; if (first) { RT.ev('tm1983'); if (RT.grant('pl_lily')) setTimeout(function () { toast('\uD83C\uDF81 Rare prize: <b>Lily Plush</b>! (Your first trip through time.)', 4600); }, 2600); } setTimeout(function () { toast('\uD83D\uDCFC OCTOBER 1983. The old Chrono-Booth needs <b>3 parts</b> to take you home. They\u2019re hidden around this arcade (different spots every week).', 6200); }, 900); }); }); }
  function breakNow() { var s = S(); RT._lever = true; snd('powerup'); say('lily', 'Engaging\u2026 wait. That noise is new.');
    setTimeout(function () { snd('crash'); RT.spark(14); s.broken = true; s.brokenAt = RT.now(); s.breaks++; s.tech = 'none'; s.got = {}; s.fuses = 0; s.juice = 0; save(); RT._lever = false; RT.setLilyFace('worried'); RT.ev('tmBreak');
      setTimeout(function () { say('lily', 'It broke. Please call the Ratita Industries hotline. The red phone.', 6); toast('\uD83D\uDCA5 KA-BLOOEY! The Chrono-Gate broke down! Lily says: call the Ratita Industries hotline (red phone).', 5200); }, 600); }, 1100); }
  RT.breakNow = breakNow;
  RT.repair = function (who) { var s = S(); if (!s.broken) return; s.broken = false; s.tech = 'none'; s.got = {}; s.fuses = 0; s.juice = 0; save(); RT.techLeave(); RT.setLilyFace('happy');
    if (who === 'self') { say('lily', 'Self-repair complete. I fixed it myself. As usual.', 5); toast('\uD83D\uDEE0\uFE0F Lily\u2019s self-repair finished: the Chrono-Gate works again!', 4200); snd('fixed'); return; }
    s.fixes++; save(); RT._lever = true; snd('fixed'); RT.ev('tmFix'); setTimeout(function () { RT._lever = false; }, 900); say('lily', 'You fixed it. Without hitting it. Dale, take notes.', 5); say('dale', 'Notes taken! \u2026What\u2019s a note?', 4);
    toast('\u2728 The Chrono-Gate is fixed! Better than the technician!', 4200); if (RT.grant('tele_juice')) setTimeout(function () { toast('\uD83C\uDF81 Rare prize: <b>Tele Juice Bottle</b>! (You fixed the Chrono-Gate.)', 4600); }, 2000); };

  /* ---------- hotline + Dale ---------- */
  function hotline() { var s = S();
    if (!s.broken) { snd('tick'); toast(pick(['\u260E\uFE0F \u201CRatita Industries! If something went BOOM, press 1. If nothing went BOOM, why are you calling? Squeak.\u201D', '\u260E\uFE0F Hold music: an 8-bit version of a song about cheese.', '\u260E\uFE0F \u201CThis is Dale! I\u2019m out fixing a time machine. Or a toaster. Leave a message!\u201D']), 4600); return; }
    if (s.tech !== 'none') { toast('\u260E\uFE0F \u201CDale is already there, sir or ma\u2019am. We\u2019re very sorry.\u201D', 3600); return; }
    show('tmcall', '\u260E\uFE0F RATITA INDUSTRIES HOTLINE', 'for when stuff goes BOOM', note('Phone', 'Squeak! Ratita Industries, this is Luna. The Chrono-Gate went BOOM? Again? Okay, okay. Sending our best technician!') + note('Phone', '\u2026Well, our ONLY technician. His name is Dale. He\u2019s very enthusiastic.'), '<button class="bigBtn" id="tmSend">SEND DALE!</button>');
    on('tmSend', function () { close(true); s.tech = 'coming'; save(); snd('ding'); RT.techArrive(); RT.ev('tmCall'); setTimeout(function () { say('lily', 'Here he comes. Hide the good tools.', 3); }, 400); }); }
  RT.onTechDone = function () { var s = S(); s.tech = 'done'; save(); RT.ev('tmTech'); say('dale', 'Welp! That\u2019s above my pay grade.', 4);
    setTimeout(function () { if (GA.AreasUI.isOpen()) return; show('tmdale', '\uD83E\uDDF0 DALE THE TECHNICIAN', 'Ratita Industries \u00b7 \u201Ccertified\u201D', note('Dale', 'Okay, good news and bad news. Bad news: I made it worse. Good news: I know EXACTLY what it needs! Three FUSES and one can of TELE JUICE.') + note('Dale', 'Even better news: I brought all of them! Worse news: they fell out of my toolbox on the way in. They\u2019re, uh\u2026 somewhere around the arcade.') + info('\uD83D\uDD0D Find <b>3 fuses</b> and <b>1 Tele Juice</b> around the arcade and bring them to the gate. Lily\u2019s sensors can tell you which areas to search.'), '<button class="bigBtn" id="tmOk">I\u2019LL FIND THEM</button>'); on('tmOk', function () { close(); }); if (RT.grant('dale_wrench')) setTimeout(function () { toast('\uD83C\uDF81 Rare prize: <b>Dale\u2019s Lucky Wrench</b>! (He has a spare. He has nine spares.)', 4600); }, 1500); }, 900); };
  function dale() { snd('talk'); var s = S(), h = note('Dale', pick(DALE)); if (s.broken && s.tech === 'done') h += info('Still needed: fuses <b>' + (3 - s.fuses) + '</b> \u00b7 Tele Juice <b>' + (1 - s.juice) + '</b>');
    say('dale', pick(['I\u2019m on break.', 'Professional!', 'Don\u2019t tell Luna.'])); show('tmdale', '\uD83E\uDDF0 DALE THE TECHNICIAN', 'Ratita Industries \u00b7 \u201Ccertified\u201D', h, '<button class="pill" id="tmOk">OK</button>'); on('tmOk', function () { close(); }); }
  function grabSupply(cab) { var s = S(), n = cab.data.spot, kind = cab.data.kind; if (!kind || s.got[n]) return; s.got[n] = true; if (kind === 'juice') s.juice = 1; else s.fuses = Math.min(3, s.fuses + 1); save(); snd('unlock'); RT.ev(kind === 'juice' ? 'tmJuice' : 'tmFuse');
    toast((kind === 'juice' ? '\uD83E\uDDEA Got the <b>Tele Juice</b>!' : '\u26A1 Got a <b>fuse</b>!') + ' Fuses ' + s.fuses + '/3 \u00b7 juice ' + s.juice + '/1' + (s.fuses >= 3 && s.juice >= 1 ? ' \u2014 back to the Chrono-Gate!' : ''), 4200); }

  /* ---------- 1983 ---------- */
  function oldBooth() { var s = S(), n = RT.partCount();
    if (n < 3) { var h = info('A wood-and-brass booth covered in dials, with a crackling coil on top. A brass plate: <b>CHRONO-BOOTH Mk.0 \u00b7 PROPERTY OF LILY (PROTOTYPE)</b>.') + info('Three empty slots: ' + RT.PARTS.map(function (p) { return (s.parts[p.id] ? '\u2705 ' : '\u2B1C ') + p.icon + ' ' + p.name; }).join(' &nbsp; ')) + info('The parts are hidden around this 1983 arcade. Ask around, or use the payphone to call Lily for a hint.');
      show('tmbooth', '\u23F3 CHRONO-BOOTH Mk.0', 'Lily\u2019s first time machine', h, '<button class="pill" id="tmOk">OK</button>'); on('tmOk', function () { close(); }); snd('tick'); return; }
    goHome('booth'); }
  function goHome(how) { var s = S(); snd('powerup'); RT._traveling = true;
    warp(function () { var first = how === 'booth' && !s.backs; if (how === 'booth') { s.backs++; RT.ev('tmBack'); } else { s.recalls++; RT.ev('tmRecall'); } s.past = false; s.parts = {}; save(); RT.travel('tlab_gate', function () { RT._traveling = false;
      if (how === 'booth') { say('lily', 'You fixed my old booth? I built that when I was version 0.3. Thank you. I think.', 6); if (first && RT.grant('chrono_booth')) setTimeout(function () { toast('\uD83C\uDF81 Rare prize: <b>Chrono-Booth Mk.0 Replica</b>! (You fixed Lily\u2019s first time machine.)', 4800); }, 1600); }
      else say('lily', 'Emergency recall complete. You are welcome. Please wipe your feet; you are tracking 1983 everywhere.', 6); }); }); }
  RT.goHome = goHome;
  function grabPart(cab) { var s = S(), id = cab.data.part; if (!id || s.parts[id]) return; s.parts[id] = true; save(); snd('unlock'); RT.ev('tmPart'); var p = RT.PARTS.find(function (q) { return q.id === id; }), n = RT.partCount();
    toast(p.icon + ' Found the <b>' + p.name + '</b>! (' + n + '/3)' + (n >= 3 ? ' Back to the Chrono-Booth!' : ''), 4000); }
  function talk1983(npc, key, title, sub, first, lines, ev) { var s = S(), h; if (!s.met[key]) { s.met[key] = true; save(); RT.ev(ev); h = note(title.replace(/^\S+\s/, ''), first); } else h = note(title.replace(/^\S+\s/, ''), pick(lines));
    if (key === 'gary' && s.past && RT.partCount() < 3) h += info('\uD83D\uDCA1 Gary: \u201CLooking for weird old machine bits? I saw something shiny over on the <b>' + nextPart().near + '</b> side of the arcade. Probably. I wasn\u2019t really looking.\u201D');
    snd('talk'); say(npc, pick(lines).split('. ')[0] + '.', 4); show('tm1983', title, sub, h, '<button class="pill" id="tmOk">BYE</button>'); on('tmOk', function () { close(); }); }
  function nextPart() { var s = S(), sp = RT.partSpots(); for (var i = 0; i < 3; i++) if (!s.parts[RT.PARTS[i].id]) return RT.PSPOT[sp[i]]; return RT.PSPOT[sp[0]]; }
  function payphone() { var s = S(), ready = RT.recallReady(), left = Math.max(0, Math.ceil(RT.RECALL_SECS - RT.pastSecs())), k = 'p' + RT.weekKey() + RT.partCount(), tier = s.hints[k] || 0, sp = nextPart();
    var hintTxt = RT.partCount() >= 3 ? 'You have all 3 parts. Go to the booth. It is the thing that looks like a time machine.' : tier === 0 ? 'One of the parts is on the ' + sp.near + ' side of the arcade.' : 'Riddle mode: \u201C' + sp.hint + '\u201D';
    var h = note('Lily (crackly line)', 'Lily here. You are calling me from 1983. Which means I have been waiting forty-three years for this call. No pressure.') + info('\uD83D\uDCA1 <b>Hint:</b> ' + esc(hintTxt)) + info(ready ? '\uD83D\uDEA8 <b>Emergency recall is charged.</b> Lily can pull you straight home (the booth keeps its parts for next time).' : '\uD83D\uDD0B Emergency recall charging\u2026 about <b>' + Math.ceil(left / 60) + ' min</b> (' + left + ' s).');
    s.hints[k] = Math.min(1, tier + 1); save(); snd('ding');
    show('tmpay', '\u260E\uFE0F PAYPHONE \u00b7 1983', 'one call to the future, 25\u00a2 (Lily pays)', h, (ready ? '<button class="bigBtn" id="tmRecall">\uD83D\uDEA8 EMERGENCY RECALL</button>' : '') + '<button class="pill" id="tmOk">HANG UP</button>');
    on('tmOk', function () { close(); }); on('tmRecall', function () { close(true); goHome('recall'); }); }

  /* ---------- the time warp effect ---------- */
  function warp(mid) { var w = $('tmWarp'); if (!w) { w = document.createElement('div'); w.id = 'tmWarp'; w.className = 'tmWarp'; w.innerHTML = '<i></i><i></i><i></i><i></i><b>\u23F3</b>'; document.body.appendChild(w); }
    RT._traveling = true; GA.Hub.setLock(true); w.classList.remove('on'); void w.offsetWidth; w.classList.add('on'); snd('whoo'); setTimeout(function () { snd('powerup'); }, 500);
    setTimeout(function () { GA.Hub.setLock(false); if (mid) mid(); }, GA.Areas && GA.Areas.fast ? 40 : 1300); setTimeout(function () { w.classList.remove('on'); RT._traveling = false; }, GA.Areas && GA.Areas.fast ? 80 : 2300); }
  UI.warp = warp;

  /* ---------- quest chip + minimaps ---------- */
  function upd() { var c = $('tmChip'); if (!c) return; var o = RT.objective(); c.classList.toggle('hidden', !o); if (o) $('tmChipT').textContent = o; }
  UI.upd = upd;
  var MAPS = {
    tunnel: { minX: -47, maxX: -13, minZ: 101, maxZ: 111, rooms: [['SECRET TUNNEL', -46, -14, 103, 109, '#a78bfa']], marks: function () { return [['\uD83D\uDEAA', -15, 106], ['\uD83D\uDD2E', -45, 106]]; } },
    tlab: { minX: -75, maxX: -49, minZ: 95, maxZ: 117, rooms: [['TIME LAB', -74, -50, 96, 116, '#c4b5fd']], marks: function () { return [['\u23F3', -64.5, 104], ['\uD83E\uDD16', -58.5, 99.6], ['\u260E\uFE0F', -56, 115.5], ['\uD83D\uDEAA', -50.6, 106]]; } },
    oldarc: { minX: 39, maxX: 69, minZ: -85, maxZ: -55, rooms: [['GROK ARCADE 1983', 40, 68, -84, -56, '#ff4fd8']], marks: function () { return [['\u23F3', 41.4, -70], ['\uD83C\uDF9F\uFE0F', 66.8, -72], ['\uD83E\uDDF0', 60, -82], ['\uD83D\uDE20', 61.5, -57], ['\u260E\uFE0F', 40.4, -60.6], ['\uD83D\uDD79\uFE0F', 49.4, -83.4]]; } } };
  UI.map = function (area) { return MAPS[area] || null; };
  UI.frame = function (t, dt, area) { if (!UI._u || (UI._u += dt) > 1) { UI._u = dt; upd(); var s = S(); if (!s.prizes.token_83 && GA.TM_GAMES && GA.TM_GAMES.every(function (id) { return GA.getBest(id) > 0; })) { if (RT.grant('token_83')) toast('\uD83C\uDF81 Rare prize: <b>Golden 1983 Token</b>! (You played all 6 retro cabinets.)', 4800); } } };
  UI.init = function () {
    if (!$('tmChip')) { var d = document.createElement('button'); d.id = 'tmChip'; d.className = 'atChip tmChip hidden'; d.innerHTML = '<b>\u23F3</b><span id="tmChipT"></span>'; d.addEventListener('click', function (e) { e.stopPropagation(); var o = RT.objective(); if (o) toast('\u23F3 ' + o, 3600); }); document.body.appendChild(d); }
    RT.UIframe = UI.frame; upd();
    // the Areas overlay routes tm_* prompts/opens here; the minimap asks us for our rooms
    if (GA.AtticUI) { var m0 = GA.AtticUI.map; GA.AtticUI.map = function (a) { return UI.map(a) || (m0 ? m0(a) : null); }; }
    // Mimi: her sister now gets a mention in hints + tips (never says where the tunnel is)
    if (GA.Mimi) { if (GA.Mimi.lines && GA.Mimi.lines.TIPS) GA.Mimi.lines.TIPS.push('Tip! My sister Lily works somewhere DEEP under the arcade. She never calls. She says she \u201Calready called tomorrow\u201D.', 'Tip! Old things in old places sometimes aren\u2019t as broken as they look. That\u2019s not a hint. (It\u2019s a hint!)');
      var h0 = GA.Mimi.hint; if (h0) GA.Mimi.hint = function () { var s = S(), a = GA.Attic && GA.Attic.atticHints ? null : null; void a; var att = GA.Mimi.atticHints ? GA.Mimi.atticHints()[0] : 'k_done'; if (s.found && s.reached && att !== 'k_done') return h0.apply(this, arguments); if (att !== 'k_done' && Math.random() < 0.5) return h0.apply(this, arguments); return tmHint(); }; }
    // Gus (Hall of Records) + Gus Jr. remember 1983
    if (GA.Hall && !GA.Hall._tmWrapped && GA.Hall.talk) { var t0 = GA.Hall.talk; GA.Hall._tmWrapped = true; GA.Hall.talk = function () { t0.apply(GA.Hall, arguments); if (Math.random() < 0.6) return; setTimeout(function () { var line = pick(['Back in \u201983 a kid in a funny jacket told me I\u2019d have a son. HA. \u2026Hmph.', 'There was a weird phone booth in the arcade in 1983. One day it just\u2026 left. Nobody believes me.', 'Larry used to fix everything around here. Then he fixed the boiler. Then nobody saw him for years.', 'Gary had the BIGGEST hair in 1983. Ask him about it. Actually, don\u2019t.']); if (GA.Hall3D && GA.Hall3D.say) GA.Hall3D.say(line, 5); }, 2600); }; }
    if (GA.Areas && GA.Areas.GJ_LINES) GA.Areas.GJ_LINES.push('Dad says he met a time traveler in 1983. Dad also says he invented the high five.', 'A robot named Lily? Mimi has a SISTER? Great. Twice the cheerfulness. Wait, Lily is grumpy? I like her.');
    if (GA.ARCADE_HISTORY && !GA.ARCADE_HISTORY.some(function (e) { return e.ver === '5.0'; })) GA.ARCADE_HISTORY.push({ date: 'Oct 10', ver: '5.0', title: 'Retro Arcade & Time Machine', text: 'A secret tunnel somewhere under the arcade leads to Lily the Bot (Mimi\u2019s sister, by Ratita Industries) and her Chrono-Gate: visit the OLD Grok Arcade of 1983 with young Gary, Larry and a younger (still grumpy) Gus. Six new retro bonus games (#26-#31), a time machine that sometimes breaks (thanks, Dale), weekly hidden parts to get home, and 5 rare Time Machine prizes.' });
  };
  function tmHint() { var s = S(), k, L;
    if (!s.found) { k = 't_find'; L = ['Psst! I heard a RUMOR! There\u2019s a secret tunnel under the arcade! Gus says it\u2019s nonsense. Gus says everything is nonsense!', 'The Secret Basement is full of old, dusty, BROKEN things\u2026 or are they?! Mimi loves a mystery!', 'If you feel a cold draft somewhere down in the basement, follow it! Drafts come from somewhere!']; }
    else if (!s.reached) { k = 't_lily'; L = ['You met my sister Lily?! She\u2019s so cool and calm! I\u2019m cool and calm too! (I am vibrating with excitement.)', 'Lily\u2019s gate goes to 1983! Say hi to tiny Gary for me!']; }
    else if (s.broken) { k = 't_fix'; L = ['Uh oh, the Chrono-Gate broke? Call the Ratita hotline! Dale is\u2026 enthusiastic!', 'Lily\u2019s sensors know which AREAS Dale\u2019s stuff fell in. Ask her!']; }
    else { k = 't_done'; L = ['The old booth in 1983 needs new parts every trip, and they hide in new spots every WEEK! Like a treasure hunt!', 'Stuck in 1983? Find a payphone! Lily ALWAYS picks up. Eventually!', 'The 1983 high score board is waiting for YOUR initials!']; }
    var M = GA.Mimi.S ? GA.Mimi.S() : { hints: {} }; M.hints = M.hints || {}; var t = M.hints[k] || 0, line = L[Math.min(t, L.length - 1)]; M.hints[k] = Math.min(t + 1, L.length); GA.store.set('mimi', M); if (GA.Prog) GA.Prog.event('mimiHint'); return { key: k, line: '⏳ ' + line, tier: Math.min(t + 1, 3) }; }
  UI.tmHint = tmHint;
})();
