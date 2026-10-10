/* Grok Arcade - Food Court / Rooftop / Secret Basement: prompts, overlays (snack bar, cooking, DJ, emotes, fireworks, party schedule,
   basement door + lockpick, fuse box, code safe, rare prize vault, jukebox, Gus's desk), the music sequencer, minimap + boost HUD. */
(function () {
  'use strict';
  var UI = GA.AreasUI = {}, AR = null, openKind = null, cur = null, built = false;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function snd(n) { if (GA.Audio) GA.Audio.play(n); }
  function toast(m, ms) { if (GA.Fix && GA.Fix.toast) GA.Fix.toast(m, ms || 3200); }
  function tix() { return GA.getTickets(); }
  function setT() { if (GA.onTickets) GA.onTickets(tix()); }
  var TIX = '\uD83C\uDF9F\uFE0F', COIN = '\uD83E\uDE99';

  /* ---------- DOM ---------- */
  function build() {
    if (built) return; built = true; AR = GA.Areas;
    var d = document.createElement('div'); d.id = 'arOv'; d.className = 'arOv hidden'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    d.innerHTML = '<div class="arPanel" id="arPanel"><div class="arHead"><div><div class="arTitle" id="arTitle"></div><div class="arSub" id="arSub"></div></div><button class="arX" id="arX" aria-label="Close">\u2715</button></div><div class="arBody" id="arBody"></div><div class="arFoot" id="arFoot"></div></div>';
    document.body.appendChild(d);
    $('arX').addEventListener('click', function () { UI.close(); });
    d.addEventListener('click', function (e) { if (e.target === d && openKind !== 'fireworks') UI.close(); });
    var em = document.createElement('div'); em.id = 'arEmotes'; em.className = 'arBar hidden';
    em.innerHTML = '<div class="arBarT">\uD83D\uDC83 DANCE FLOOR <span id="arDanceInfo"></span></div><div class="arBarRow">' + EMOTES.map(function (e) { return '<button class="arEmo" data-emo="' + e[0] + '"><span>' + e[1] + '</span>' + e[2] + '</button>'; }).join('') + '</div><button class="arBarX" id="arEmoX">\u2715</button>';
    document.body.appendChild(em);
    Array.prototype.forEach.call(em.querySelectorAll('[data-emo]'), function (b) { b.addEventListener('click', function () { var n = b.getAttribute('data-emo'); GA.Hub.setEmote(GA.Hub.emote() === n ? null : n); snd('click'); if (GA.Prog) GA.Prog.event('rfDance'); markEmo(); }); });
    $('arEmoX').addEventListener('click', function () { closeEmotes(); });
    var mp = document.createElement('canvas'); mp.id = 'arMap'; mp.width = 240; mp.height = 184; mp.setAttribute('aria-label', 'Minimap: tap to make it bigger'); document.getElementById('hud').appendChild(mp);
    mp.addEventListener('click', function () { mp.classList.toggle('big'); snd('click'); drawMap(true); });
    var bc = document.createElement('div'); bc.id = 'arBoost'; bc.className = 'hidden'; document.getElementById('hud').appendChild(bc);
    AR.onArea = onArea;
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (openKind) { e.preventDefault(); UI.close(); } else if (UI.emotesOpen()) closeEmotes(); } else if (openKind === 'pick' && (e.key === ' ' || e.key === 'Enter') && pick.tap) { e.preventDefault(); pick.tap(); } }, true);
    wrapGus();
  }
  function show(kind, title, sub, body, foot, cls) {
    openKind = kind; $('arTitle').innerHTML = title; $('arSub').innerHTML = sub || ''; $('arBody').innerHTML = body; $('arFoot').innerHTML = foot || '';
    $('arPanel').className = 'arPanel ' + (cls || ''); $('arOv').className = 'arOv' + (kind === 'fireworks' ? ' clear' : '');
    document.body.classList.add('arOn'); GA.Hub.setLock(true); GA.Hub.clearInput(); hidePromptNow();
  }
  function hidePromptNow() { var p = $('prompt'), b = $('playBtn'); if (p) p.classList.add('hidden'); if (b) b.classList.add('hidden'); document.body.classList.remove('near'); }
  UI.isOpen = function () { return !!openKind; };
  UI.kind = function () { return openKind; };
  UI.close = function (silent) {
    if (!openKind) return; var k = openKind; openKind = null; $('arOv').className = 'arOv hidden'; document.body.classList.remove('arOn'); GA.Hub.setLock(false);
    if (k === 'fireworks') GA.Hub.setCamOverride(null); if (cook.raf) { cancelAnimationFrame(cook.raf); cook.raf = 0; } if (pick.raf) { cancelAnimationFrame(pick.raf); pick.raf = 0; }
    if (!silent) snd('menu'); setTimeout(function () { if (GA.UI && GA.UI.refreshPrompt && !openKind) GA.UI.refreshPrompt(); }, 30);
  };
  function wire(sel, fn) { Array.prototype.forEach.call($('arOv').querySelectorAll(sel), function (b) { b.addEventListener('click', function (e) { fn(b, e); }); }); }

  /* ---------- walk-up prompts ---------- */
  UI.prompt = function (cab) {
    build(); var k = cab.kind, P = AR.party();
    switch (k) {
      case 'ar_snack': return { tag: 'FOOD COURT', name: 'Snack Bar', desc: 'Snacks give fun boosts: x2 tickets, run faster, lucky games! Pay with tickets or ' + COIN + ' coins (you have ' + AR.coins() + '). ' + (P.dow === 0 ? 'SNACK ATTACK MONDAY: half price!' : ''), btn: 'MENU', key: 'order a snack', cls: 'prize', pb: 'pzPlay' };
      case 'ar_chef': return { tag: 'FOOD COURT', name: 'Chef Gio', desc: 'The pizza chef! Help him cook at the brick oven to earn ' + COIN + ' coins and a Chef\u2019s Special boost.', btn: 'TALK', key: 'talk to Chef Gio', cls: 'npc' };
      case 'ar_oven': var w = AR.cookReady(); return { tag: 'BRICK PIZZA OVEN', name: 'Cook a Pizza', desc: w ? 'The oven is heating back up... ' + w + ' s' : 'Make Gio\u2019s order, bake it and pull it out when it\u2019s GOLDEN. Perfect = 3 coins + x3 tickets on your next bonus game!', btn: 'COOK', key: 'cook', cls: 'prize', pb: 'pzPlay' };
      case 'ar_slushie': return { tag: 'FOOD COURT', name: 'Turbo Slushie Machine', desc: 'Run 50% faster for 2 minutes! (' + TIX + ' 10 or ' + COIN + ' 2)', btn: 'BUY', key: 'get a slushie', cls: 'gallery', pb: 'galPlay' };
      case 'ar_icecream': return { tag: 'FOOD COURT', name: 'Sugar Rush Cone', desc: '+5 bonus tickets on each of your next 3 bonus games! (' + TIX + ' 12 or ' + COIN + ' 2)', btn: 'BUY', key: 'get ice cream', cls: 'gallery', pb: 'galPlay' };
      case 'ar_elevator': return { tag: 'ELEVATOR', name: cab.data.target === 'roof' ? 'Up to the Rooftop' : 'Down to the Food Court', desc: cab.data.target === 'roof' ? 'The Rooftop Party Deck: DJ booth, dance floor, fireworks and the city at night!' : 'Back down to the Food Court.', btn: cab.data.target === 'roof' ? '\u25B2 UP' : '\u25BC DOWN', key: 'ride the elevator', cls: 'gallery', pb: 'galPlay' };
      case 'ar_stairs': return { tag: 'STAIRS', name: cab.name, desc: cab.data.target === 'roof' ? 'Climb up to the Rooftop Party Deck.' : 'Head back down to the Food Court.', btn: 'GO', key: 'take the stairs', cls: 'gallery', pb: 'galPlay' };
      case 'ar_bdoor': return AR.unlocked() ? { tag: 'STAFF ONLY', name: 'Secret Basement', desc: 'Unlocked for you this week! Go down to the hidden retro arcade.', btn: '\u25BC GO', key: 'go down', cls: 'prize', pb: 'pzPlay' }
        : { tag: 'LOCKED \uD83D\uDD12', name: 'Basement Door', desc: 'Gus lost the key again! Find his key somewhere in the arcade (it moves every week), or pick the lock.', btn: 'OPEN', key: 'try the door', cls: 'broken' };
      case 'ar_key': return { tag: '\uD83D\uDD11 FOUND IT!', name: 'Gus\u2019s Key', desc: 'A shiny brass key with a pink tag that says BASEMENT. Gus will never know.', btn: 'TAKE', key: 'pick it up', cls: 'prize', pb: 'pzPlay' };
      case 'ar_dj': return { tag: 'ROOFTOP', name: 'DJ Byte\u2019s Booth', desc: 'Pick the music! The LED floor, lights and DJ Byte dance to the beat.' + (UI.music().on ? ' Now playing: ' + UI.music().name : ''), btn: 'PICK<br>MUSIC', key: 'pick the music', cls: 'gallery', pb: 'galPlay' };
      case 'ar_dance': return { tag: 'ROOFTOP', name: 'Dance Floor', desc: 'Bust a move! Wave, dance, spin, robot, jump or floss.' + (P.dow === 2 ? ' DANCE-OFF WEDNESDAY: dance 20 s for 15 tickets!' : ''), btn: 'DANCE', key: 'dance', cls: 'gallery', pb: 'galPlay' };
      case 'ar_fireworks': return { tag: 'ROOFTOP', name: 'Fireworks Console', desc: 'Launch real fireworks over the city: peony, ring, heart, golden willow, smiley and a GROK sign!', btn: 'LAUNCH', key: 'launch fireworks', cls: 'broken' };
      case 'ar_schedule': return { tag: 'ROOFTOP', name: 'Party Schedule', desc: 'Today: ' + P.today.name + ' \u2014 ' + P.today.what + '.' + (P.night ? (P.claimed ? ' (party bonus claimed)' : ' Claim your Party Night bonus!') : ' Next Party Night: ' + P.nextText), btn: 'VIEW', key: 'read the schedule', cls: 'prize', pb: 'pzPlay' };
      case 'ar_fuse': var f = AR.fuseState(); return { tag: 'SECRET BASEMENT', name: 'Fuse Box', desc: f.solved ? 'All green! The lights and the blacklight are on.' : 'Half the lights are out. Flip the breakers until ALL of them are green (each one flips its neighbours too!).', btn: 'FIX', key: 'open the fuse box', cls: 'prize', pb: 'pzPlay' };
      case 'ar_safe': return { tag: 'SECRET BASEMENT', name: 'Gus\u2019s Code Safe', desc: 'A 4-digit code: \uD83C\uDF55 \uD83D\uDD79\uFE0F \uD83C\uDF86 \u2B50. The posters on the walls have clues. The last one only glows in the dark...', btn: 'ENTER<br>CODE', key: 'try the code', cls: 'gallery', pb: 'galPlay' };
      case 'ar_vault': return { tag: 'SECRET BASEMENT', name: 'Rare Prize Vault', desc: 'Prizes you can\u2019t get anywhere else: Gus\u2019s Golden Key and the Mini Retro Cabinet.', btn: 'OPEN', key: 'open the vault', cls: 'prize', pb: 'pzPlay' };
      case 'ar_jukebox': return { tag: 'SECRET BASEMENT', name: 'Jukebox', desc: 'Old records from 1958 to 1983. Drop a (free) coin!' + (UI.music().on ? ' Now playing: ' + UI.music().name : ''), btn: 'PLAY', key: 'pick a record', cls: 'gallery', pb: 'galPlay' };
      case 'ar_gusdesk': return { tag: 'SECRET BASEMENT', name: 'Gus\u2019s Old Desk', desc: 'Gus worked down here in 1983. His notes are still on the desk...', btn: 'READ', key: 'read Gus\u2019s notes', cls: 'npc' };
      case 'ar_retro': var gid = cab.id === 'rt_lock' ? 'lockpick' : cab.id; return { tag: 'RARE RETRO CABINET', name: cab.game.name, desc: cab.game.desc + ' Best: ' + GA.getBest(gid) + (P.dow === 3 && gid !== 'lockpick' ? ' \u00b7 THROWBACK THURSDAY x2 tickets!' : ''), btn: '&#9654; PLAY', key: 'play', cls: 'gallery', pb: 'galPlay' };
    }
    return { tag: 'AREA', name: cab.game.name, desc: '', btn: 'GO', key: 'use', cls: 'gallery' };
  };

  /* ---------- open (E / PLAY) ---------- */
  UI.open = function (cab) {
    build(); var k = cab.kind; cur = cab;
    if (k === 'ar_snack') return openSnacks();
    if (k === 'ar_slushie') return quickBuy('slushie');
    if (k === 'ar_icecream') return quickBuy('icecream');
    if (k === 'ar_chef') { var L = chefLine(); AR.chefSay(L, 5); toast('Chef Gio: \u201C' + L + '\u201D', 4200); snd('talk'); return; }
    if (k === 'ar_oven') return openCook();
    if (k === 'ar_elevator' || k === 'ar_stairs') { var to = cab.data.target === 'roof' ? 'roof' : (k === 'ar_elevator' ? 'food_elev' : 'food_stairs'); if (k === 'ar_elevator') snd('ding'); AR.travel(to); return; }
    if (k === 'ar_bdoor') { if (AR.unlocked()) { snd('open'); AR.travel('basement'); return; } return openDoor(); }
    if (k === 'ar_key') { if (AR.takeKey()) { snd('unlock'); toast('\uD83D\uDD11 You found Gus\u2019s key! The Secret Basement (STAFF ONLY door in the Food Court) is unlocked for you this week.', 5200); if (GA.Hall3D && GA.Hall3D.say) GA.Hall3D.say('Hey! Has anyone seen my... never mind.', 4); } return; }
    if (k === 'ar_dj') return openMusic('dj');
    if (k === 'ar_jukebox') return openMusic('juke');
    if (k === 'ar_dance') return openEmotes();
    if (k === 'ar_fireworks') return openFireworks();
    if (k === 'ar_schedule') return openSchedule();
    if (k === 'ar_fuse') return openFuse();
    if (k === 'ar_safe') return openSafe();
    if (k === 'ar_vault') return openVault();
    if (k === 'ar_gusdesk') return openDesk();
    if (k === 'ar_retro') { var gid = cab.id === 'rt_lock' ? 'lockpick' : cab.id; GA.openBonus(gid); return; }
  };

  /* ---------- Food Court ---------- */
  var CHEF = ['Mamma mia! You look hungry. A slice gives you DOUBLE tickets!', 'Help me at the oven! Pull the pizza out when it\u2019s golden, not black!', 'The Turbo Slushie? Fast legs! Very fast! Don\u2019t run into my tables.', 'Gus? He eats here every day. Always the same: plain cheese. Boring!', 'Psst... Gus loses his basement key every week. Every. Week.', 'On Party Night they set off fireworks on the roof. The elevator is by the stairs!', 'My secret? Love. And extra cheese.'];
  function chefLine() { var P = AR.party(); if (!AR.unlocked() && Math.random() < 0.35) return 'Gus came by grumbling about his key. He said something about... ' + AR.keySpot().name + '?'; if (P.dow === 0 && Math.random() < 0.5) return 'Snack Attack Monday! Everything is half price today!'; return CHEF[Math.floor(Math.random() * CHEF.length)]; }
  function boostList() { var b = AR.boosts(), out = b.next.map(function (x) { return x.icon + ' ' + x.name + (x.kind === 'mult' ? ' x' + x.v : x.kind === 'add' ? ' +' + x.v : ' ' + x.v + '+') + (x.games > 1 ? ' (' + x.games + ' games)' : ''); }); if (b.speedLeft) out.unshift('\uD83E\uDD64 Turbo legs ' + Math.floor(b.speedLeft / 60) + ':' + ('0' + b.speedLeft % 60).slice(-2)); return out; }
  function openSnacks(focus) {
    var P = AR.party(), h = '<div class="arWallet">' + TIX + ' <b>' + tix() + '</b> tickets \u00b7 ' + COIN + ' <b>' + AR.coins() + '</b> coins' + (P.dow === 0 ? ' \u00b7 <span class="arHot">SNACK ATTACK: half price!</span>' : '') + '</div><div class="arList">';
    GA.SNACKS.forEach(function (s) { var pr = AR.snackPrice(s); h += '<div class="arItem' + (focus === s.id ? ' focus' : '') + '" data-snack="' + s.id + '"><div class="arIco">' + s.icon + '</div><div class="arTxt"><b>' + esc(s.name) + '</b><span>' + esc(s.boostShort) + '</span></div><div class="arBtns">' +
      '<button class="arBuy" data-buy="' + s.id + '" data-pay="tix"' + (tix() < pr.tix ? ' disabled' : '') + '>' + (pr.tix ? TIX + ' ' + pr.tix : 'FREE') + '</button><button class="arBuy coin" data-buy="' + s.id + '" data-pay="coins"' + (AR.coins() < pr.coins || !pr.coins ? ' disabled' : '') + '>' + COIN + ' ' + pr.coins + '</button></div></div>'; });
    var bl = boostList(); h += '</div><div class="arNote">' + (bl.length ? '<b>Active boosts:</b> ' + bl.map(esc).join(' \u00b7 ') : 'No boosts yet. Boosts kick in on your next bonus game.') + '</div><div class="arNote dim">Earn ' + COIN + ' coins by cooking with Chef Gio at the brick oven.</div>';
    show('snacks', '\uD83C\uDF54 SNACK BAR', 'Chef Gio\u2019s menu', h, '', 'food');
    wire('[data-buy]', function (b) { var r = AR.buySnack(b.getAttribute('data-buy'), b.getAttribute('data-pay')); if (!r.ok) { snd('bad'); toast(r.why === 'coins' ? 'Not enough coins! Cook with Gio to earn some.' : 'Not enough tickets! Win some in the Bonus Zone.'); return; }
      setT(); snd('eat'); var s = r.snack; AR.chefSay(s.kind === 'fun' ? 'BUUURP! Ha ha! Excuse YOU!' : 'One ' + s.name + ', coming up! Enjoy!', 3.5);
      if (s.kind === 'fun') { snd('burp'); confetti(); } toast(s.icon + ' ' + s.name + '! ' + s.boostShort, 3200); openSnacks(s.id); });
  }
  function quickBuy(id) { openSnacks(id); }
  function confetti() { var c = document.createElement('div'); c.className = 'arConfetti'; for (var i = 0; i < 40; i++) { var p = document.createElement('i'); p.style.left = (Math.random() * 100) + '%'; p.style.background = ['#ff4fd8', '#3ff0ff', '#ffe14d', '#4ade80'][i % 4]; p.style.animationDelay = (Math.random() * 0.4) + 's'; c.appendChild(p); } document.body.appendChild(c); setTimeout(function () { c.remove(); }, 2200); }
  /* cooking: make the order, then pull the pizza out when it's golden */
  var TOPS = [['mush', '\uD83C\uDF44', 'Mushroom'], ['pep', '\uD83E\uDED1', 'Pepper'], ['pine', '\uD83C\uDF4D', 'Pineapple'], ['olive', '\uD83E\uDED2', 'Olive'], ['onion', '\uD83E\uDDC5', 'Onion'], ['pepperoni', '\uD83C\uDF56', 'Pepperoni']];
  var cook = { raf: 0 };
  function openCook() {
    var w = AR.cookReady(); if (w > 0) { toast('The oven is heating back up. Try again in ' + w + ' s!'); snd('bad'); return; }
    var pool = TOPS.slice().sort(function () { return Math.random() - 0.5; }); cook.order = pool.slice(0, 3).map(function (x) { return x[0]; }); cook.on = []; cook.miss = 0; cook.phase = 'top'; cook.heat = 0; cook.res = null; cook.spd = 0.3 + Math.random() * 0.06;
    var h = '<div class="arCook"><div class="arOrder">Gio\u2019s order: ' + cook.order.map(function (id) { var t = TOPS.find(function (x) { return x[0] === id; }); return '<span>' + t[1] + ' ' + t[2] + '</span>'; }).join('') + '</div><canvas id="arCookCv" width="320" height="250"></canvas><div class="arTops" id="arTops">' +
      TOPS.map(function (t) { return '<button class="arTop" data-top="' + t[0] + '">' + t[1] + '<small>' + t[2] + '</small></button>'; }).join('') + '</div><div class="arCookMsg" id="arCookMsg">Tap the 3 toppings Gio wants!</div><button class="bigBtn arBig hidden" id="arBake">\uD83D\uDD25 BAKE IT</button><button class="bigBtn arBig hidden" id="arTake">\uD83C\uDF55 TAKE IT OUT!</button></div>';
    show('cook', '\uD83C\uDF55 COOK WITH CHEF GIO', 'Brick pizza oven', h, '', 'food');
    wire('[data-top]', function (b) { if (cook.phase !== 'top') return; var id = b.getAttribute('data-top'); if (cook.on.indexOf(id) >= 0) return; cook.on.push(id); b.classList.add('on');
      if (cook.order.indexOf(id) < 0) { cook.miss++; b.classList.add('bad'); snd('bad'); $('arCookMsg').textContent = 'No no no! That\u2019s not on the order!'; AR.chefSay('No no no! Not that one!', 2); } else { snd('point'); $('arCookMsg').textContent = 'Bellissimo!'; }
      var good = cook.order.filter(function (o) { return cook.on.indexOf(o) >= 0; }).length; if (good >= 3 || cook.on.length >= 4) { cook.phase = 'ready'; $('arBake').classList.remove('hidden'); $('arCookMsg').textContent = 'Now bake it! Pull it out when the bar hits GOLDEN.'; } });
    $('arBake').addEventListener('click', function () { if (cook.phase !== 'ready') return; cook.phase = 'bake'; cook.heat = 0; $('arBake').classList.add('hidden'); $('arTake').classList.remove('hidden'); $('arTops').classList.add('dim'); AR.chefCook(4); snd('launch'); });
    $('arTake').addEventListener('click', function () { if (cook.phase === 'bake') finishCook(); });
    var last = performance.now(); (function loop(t) { cook.raf = requestAnimationFrame(loop); var dt = Math.min(0.05, (t - last) / 1000); last = t; if (cook.phase === 'bake') { cook.heat += dt * cook.spd; if (cook.heat >= 1.0) finishCook(); } drawCook(); })(last);
  }
  UI._cook = cook;
  function cookQuality(h, miss) { var q = h >= 0.66 && h <= 0.74 ? 'perfect' : h >= 0.55 && h <= 0.85 ? 'good' : 'burnt'; if (miss && q === 'perfect') q = 'good'; if (h < 0.55) q = 'burnt'; return q; }
  UI._cookQuality = cookQuality;
  function finishCook() { cook.phase = 'done'; var q = cookQuality(cook.heat, cook.miss); cook.res = AR.cookResult(q); $('arTake').classList.add('hidden');
    var msg = q === 'perfect' ? '\uD83C\uDF1F PERFETTO! +3 coins + Chef\u2019s Special (x3 tickets next game)!' : q === 'good' ? 'Molto bene! +2 coins + Chef\u2019s Special (x2 tickets next game).' : (cook.heat < 0.55 ? 'Too early, it\u2019s still raw! +1 coin.' : 'BURNT! Ha ha! +1 coin for trying.');
    $('arCookMsg').innerHTML = '<b>' + msg + '</b>'; snd(q === 'burnt' ? 'lose' : 'win'); AR.chefSay(q === 'perfect' ? 'PERFETTO! You are a real chef!' : q === 'good' ? 'Molto bene! Very good!' : 'Mamma mia... we try again later!', 4);
    $('arFoot').innerHTML = '<button class="bigBtn" id="arCookDone">DONE</button>'; $('arCookDone').addEventListener('click', function () { UI.close(); }); }
  function drawCook() { var cv = $('arCookCv'); if (!cv) return; var c = cv.getContext('2d'), W = cv.width, H = cv.height, h = cook.heat;
    c.fillStyle = '#2a1410'; c.fillRect(0, 0, W, H); var gr = c.createRadialGradient(W / 2, 110, 10, W / 2, 110, 150); gr.addColorStop(0, cook.phase === 'bake' ? '#ff9a3a' : '#5a2a14'); gr.addColorStop(1, '#2a1410'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    var crust = h < 0.55 ? '#f0d9a0' : h < 0.66 ? '#e8b862' : h <= 0.74 ? '#d9962e' : h <= 0.85 ? '#a8641e' : '#3a2412';
    c.fillStyle = crust; c.beginPath(); c.arc(W / 2, 105, 82, 0, 7); c.fill(); c.fillStyle = h > 0.85 ? '#5a1a0a' : '#c0392b'; c.beginPath(); c.arc(W / 2, 105, 70, 0, 7); c.fill();
    c.fillStyle = h > 0.85 ? '#6a5a2a' : h > 0.66 ? '#ffd166' : '#fff3c4'; for (var i = 0; i < 16; i++) { var a = i * 2.4, r = 10 + (i * 37 % 55); c.beginPath(); c.arc(W / 2 + Math.cos(a) * r, 105 + Math.sin(a) * r, 13, 0, 7); c.fill(); }
    c.font = '22px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    (cook.on || []).forEach(function (id, k) { var t = TOPS.find(function (x) { return x[0] === id; }); for (var j = 0; j < 4; j++) { var a = k * 1.7 + j * 1.57, r = 22 + j * 9; c.fillText(t[1], W / 2 + Math.cos(a) * r, 105 + Math.sin(a) * r); } });
    if (h > 0.85) { c.fillStyle = 'rgba(40,40,40,.5)'; for (i = 0; i < 5; i++) { c.beginPath(); c.arc(W / 2 - 40 + i * 20, 40 - ((performance.now() / 20 + i * 30) % 40), 10, 0, 7); c.fill(); } }
    // heat bar
    var bx0 = 20, by = 210, bw = W - 40; c.fillStyle = '#111'; c.fillRect(bx0, by, bw, 18); c.fillStyle = 'rgba(255,209,102,.45)'; c.fillRect(bx0 + bw * 0.55, by, bw * 0.3, 18); c.fillStyle = 'rgba(74,222,128,.8)'; c.fillRect(bx0 + bw * 0.66, by, bw * 0.08, 18);
    c.fillStyle = '#fff'; c.fillRect(bx0 + bw * Math.min(1, h) - 2, by - 5, 4, 28); c.font = 'bold 12px sans-serif'; c.fillStyle = '#ffe14d'; c.fillText('GOLDEN', bx0 + bw * 0.7, by - 10); c.fillStyle = '#bbb'; c.fillText('RAW', bx0 + 20, by + 32); c.fillText('BURNT', bx0 + bw - 24, by + 32); }

  /* ---------- basement door + lockpick ---------- */
  var pick = { raf: 0 };
  function openDoor() {
    var cd = AR.pickCooldown(), h = '<div class="arDoor"><div class="arBig2">\uD83D\uDD12</div><p><b>STAFF ONLY.</b> Two ways in:</p><div class="arWay"><b>\uD83D\uDD11 Find Gus\u2019s key</b><span>It\u2019s hidden somewhere in the arcade and moves to a new spot every week. Gus grumbles hints if you talk to him. Chef Gio gossips too.</span></div>' +
      '<div class="arWay"><b>\uD83D\uDD13 Pick the lock</b><span>Set 4 pins before time runs out. 3 misses and your pick snaps (wait 20 s to try again).</span></div></div>';
    show('door', 'BASEMENT DOOR', 'Locked tight', h, '<button class="bigBtn" id="arPick"' + (cd ? ' disabled' : '') + '>' + (cd ? 'NEW PICK IN ' + cd + ' s' : '\uD83D\uDD13 PICK THE LOCK') + '</button><button class="pill" id="arHint">\uD83E\uDDD3 GUS\u2019S HINT</button>', 'base');
    $('arPick').addEventListener('click', function () { if (!AR.pickCooldown()) openPick(); });
    $('arHint').addEventListener('click', function () { snd('talk'); $('arBody').insertAdjacentHTML('beforeend', '<div class="arNote gus">Gus (grumbling): \u201C' + esc(AR.keyHint()) + '\u201D</div>'); $('arHint').disabled = true; });
    if (cd) { var iv = setInterval(function () { var b = $('arPick'); if (!b || openKind !== 'door') { clearInterval(iv); return; } var c2 = AR.pickCooldown(); b.disabled = !!c2; b.textContent = c2 ? 'NEW PICK IN ' + c2 + ' s' : '\uD83D\uDD13 PICK THE LOCK'; if (!c2) clearInterval(iv); }, 500); }
  }
  function openPick() {
    var L = GA.LockCore.make(); L.reset(4, 1.55, 0.11, false); pick.L = L; pick.t = 15; pick.done = false;
    show('pick', '\uD83D\uDD13 PICK THE LOCK', 'Tap when the glowing pin\u2019s gap hits the green line', '<canvas id="arPickCv" width="340" height="280"></canvas><div class="arPickHud"><span id="arPickT">15.0 s</span><span id="arPickMsg">Pin 1 of 4</span></div>', '<button class="bigBtn arBig" id="arPickTap">TAP!</button>', 'base');
    function tap() { if (pick.done) return; var r = L.tap(); if (!r) return; if (r.hit) { snd(r.perfect ? 'perfect' : 'tick'); if (r.open) win(); else $('arPickMsg').textContent = 'Pin ' + (L.cur + 1) + ' of 4'; } else { snd('bad'); $('arPickMsg').textContent = L.msg[0] + ' (' + (L.maxStrain - L.strain) + ' left)'; if (r.snapped) fail('SNAP! Your pick broke.'); } }
    $('arPickTap').addEventListener('click', tap); $('arPickCv').addEventListener('pointerdown', function (e) { e.preventDefault(); tap(); });
    function win() { pick.done = true; AR.unlock('pick'); snd('unlock'); $('arPickMsg').textContent = 'CLICK! It\u2019s open!'; $('arFoot').innerHTML = '<button class="bigBtn" id="arGoDown">\u25BC GO DOWNSTAIRS</button>'; $('arGoDown').addEventListener('click', function () { UI.close(true); AR.travel('basement'); }); toast('\uD83D\uDD13 Lock picked! The Secret Basement is open for you this week.', 4200); }
    function fail(why) { pick.done = true; AR.pickFailed(); snd('lose'); $('arPickMsg').textContent = why; $('arFoot').innerHTML = '<button class="bigBtn" id="arPickBack">TRY AGAIN IN 20 s</button>'; $('arPickBack').addEventListener('click', function () { openDoor(); }); }
    pick.tap = tap; pick.fail = fail;
    var last = performance.now(); (function loop(t) { pick.raf = requestAnimationFrame(loop); var dt = Math.min(0.05, (t - last) / 1000); last = t; L.update(dt); if (!pick.done) { pick.t -= dt; if (pick.t <= 0) { pick.t = 0; fail('Out of time! The pick slipped.'); } } var tt = $('arPickT'); if (tt) tt.textContent = pick.t.toFixed(1) + ' s';
      var cv = $('arPickCv'); if (cv) { var c = cv.getContext('2d'); c.fillStyle = '#140a20'; c.fillRect(0, 0, cv.width, cv.height); L.draw(c, 14, 14, cv.width - 28, cv.height - 28); } })(last);
  }
  UI._pick = pick;

  /* ---------- rooftop: music, emotes, fireworks, schedule ---------- */
  var TRACKS = {
    dj: [{ id: 'neon', name: 'Neon Nights', bpm: 112, root: 45, prog: [0, -4, 3, -2], style: 'synth' }, { id: 'pizza', name: 'Pizza Party Polka', bpm: 138, root: 48, prog: [0, 7, 0, 5], style: 'polka' },
      { id: 'chip', name: '8-Bit Hero', bpm: 150, root: 52, prog: [0, 5, 7, 5], style: 'chip' }, { id: 'lofi', name: 'Rooftop Lo-Fi', bpm: 84, root: 43, prog: [0, 5, 3, 7], style: 'lofi' },
      { id: 'anthem', name: 'PARTY NIGHT ANTHEM', bpm: 128, root: 50, prog: [0, -3, 5, 3], style: 'house', secret: true }],
    juke: [{ id: 'boogie', name: 'Basement Boogie \u201958', bpm: 132, root: 43, prog: [0, 5, 0, 7], style: 'rock' }, { id: 'coin', name: 'Insert Coin \u201983', bpm: 144, root: 48, prog: [0, 3, 5, 3], style: 'chip' },
      { id: 'slow', name: 'Gus\u2019s Slow Dance', bpm: 74, root: 41, prog: [0, 5, 7, 5], style: 'lofi' }]
  };
  var MUS = { on: false, tr: null, where: null, t0: 0, step: 0, next: 0, iv: 0, gain: null };
  UI.TRACKS = TRACKS;
  UI.music = function () { if (!MUS.on) return { on: false, bpm: 110, beat: performance.now() / 1000 * 2, name: '' }; var a = GA.Audio.raw().ctx, now = a ? a.currentTime : performance.now() / 1000; return { on: true, bpm: MUS.tr.bpm, beat: (now - MUS.t0) * MUS.tr.bpm / 60, name: MUS.tr.name, id: MUS.tr.id, where: MUS.where }; };
  function secretOk() { var P = AR.party(); return P.dow === 1 || P.night; }
  function openMusic(which) {
    var list = TRACKS[which], m = UI.music(), h = '<div class="arList">' + list.map(function (t) { var lock = t.secret && !secretOk(); return '<div class="arItem' + (m.on && m.id === t.id ? ' focus' : '') + '"><div class="arIco">' + (t.secret ? '\uD83C\uDF89' : which === 'juke' ? '\uD83D\uDCBF' : '\uD83C\uDFB5') + '</div><div class="arTxt"><b>' + esc(t.name) + '</b><span>' + t.bpm + ' BPM \u00b7 ' + t.style + (lock ? ' \u00b7 unlocks on Tune Tuesday + Party Night' : '') + '</span></div><div class="arBtns"><button class="arBuy" data-track="' + t.id + '"' + (lock ? ' disabled' : '') + '>' + (m.on && m.id === t.id ? '\u266B ON' : '\u25B6 PLAY') + '</button></div></div>'; }).join('') + '</div>';
    show('music', which === 'dj' ? '\uD83C\uDFA7 DJ BYTE\u2019S BOOTH' : '\uD83D\uDCBF JUKEBOX', which === 'dj' ? 'Pick the music for the party' : 'Old records from the basement', h, '<button class="pill" id="arStop">\u25A0 STOP MUSIC</button>', which === 'dj' ? 'roof' : 'base');
    wire('[data-track]', function (b) { var t = list.find(function (x) { return x.id === b.getAttribute('data-track'); }); playTrack(t, which === 'dj' ? 'roof' : 'basement'); if (which === 'dj') AR.djSay('Now spinning: ' + t.name + '! Let\u2019s gooo!'); openMusic(which); });
    $('arStop').addEventListener('click', function () { stopMusic(); openMusic(which); });
  }
  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  function playTrack(t, where) {
    stopMusic(); var R = GA.Audio.raw(), a = R.ctx; GA.Audio.unlock(); MUS.on = true; MUS.tr = t; MUS.where = where; MUS.step = 0;
    if (!a) { MUS.t0 = performance.now() / 1000; return; }
    MUS.gain = a.createGain(); MUS.gain.gain.value = 0.32; MUS.gain.connect(R.master); MUS.t0 = a.currentTime + 0.08; MUS.next = MUS.t0;
    MUS.iv = setInterval(sched, 25); sched();
  }
  function stopMusic() { if (MUS.iv) clearInterval(MUS.iv); MUS.iv = 0; if (MUS.gain) { try { var a = GA.Audio.raw().ctx; MUS.gain.gain.setTargetAtTime(0, a.currentTime, 0.05); var g = MUS.gain; setTimeout(function () { try { g.disconnect(); } catch (e) {} }, 400); } catch (e) {} } MUS.gain = null; MUS.on = false; MUS.tr = null; MUS.where = null; }
  UI.stopMusic = stopMusic; UI.playTrack = function (id, where) { var t = TRACKS.dj.concat(TRACKS.juke).find(function (x) { return x.id === id; }); if (t) playTrack(t, where || 'roof'); return !!t; };
  function sched() { var a = GA.Audio.raw().ctx; if (!a || !MUS.on) return; var spb = 60 / MUS.tr.bpm / 4; while (MUS.next < a.currentTime + 0.15) { if (!GA.Audio.isMuted()) playStep(MUS.step, MUS.next, spb); MUS.step++; MUS.next += spb; } }
  function osc(type, f, t, dur, vol, f2) { var a = GA.Audio.raw().ctx, o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(MUS.gain); o.start(t); o.stop(t + dur + 0.02); }
  var NB = null; function noiseBuf() { if (NB) return NB; var a = GA.Audio.raw().ctx, len = a.sampleRate * 0.3; NB = a.createBuffer(1, len, a.sampleRate); var d = NB.getChannelData(0); for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; return NB; }
  function nz(t, dur, vol, hp) { var a = GA.Audio.raw().ctx, s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter(); s.buffer = noiseBuf(); f.type = hp ? 'highpass' : 'bandpass'; f.frequency.value = hp ? 7000 : 1800; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(MUS.gain); s.start(t); s.stop(t + dur + 0.02); }
  function playStep(st, t, spb) {
    var tr = MUS.tr, s16 = st % 16, bar = Math.floor(st / 16), root = tr.root + tr.prog[bar % tr.prog.length], sty = tr.style, minor = sty === 'synth' || sty === 'lofi' || sty === 'house';
    var chord = [0, minor ? 3 : 4, 7, 12];
    // drums
    var four = sty === 'house' || sty === 'synth' || sty === 'chip';
    if ((four && s16 % 4 === 0) || (!four && (s16 === 0 || s16 === 8 || (sty === 'rock' && s16 === 10)))) osc('sine', 150, t, 0.18, 0.5, 45);
    if (s16 === 4 || s16 === 12) nz(t, sty === 'lofi' ? 0.12 : 0.16, 0.25);
    if (sty === 'polka' ? s16 % 4 === 2 : s16 % 2 === 0) nz(t, 0.04, sty === 'lofi' ? 0.05 : 0.08, true);
    if (sty === 'house' && s16 % 4 === 2) nz(t, 0.08, 0.1, true);
    // bass
    if (sty === 'polka') { if (s16 % 4 === 0) osc('triangle', midi(root), t, spb * 1.6, 0.3); if (s16 % 4 === 2) osc('square', midi(root + 12 + chord[1]), t, spb * 0.9, 0.06); }
    else if (sty === 'rock') { if (s16 % 2 === 0) osc('sawtooth', midi(root + [0, 0, 7, 9, 12, 9, 7, 4][(s16 / 2) % 8]), t, spb * 1.6, 0.12); }
    else if (s16 % (sty === 'lofi' ? 8 : 2) === 0) osc(sty === 'chip' ? 'square' : 'sawtooth', midi(root + (sty === 'house' && s16 % 4 === 2 ? 12 : 0)), t, spb * (sty === 'lofi' ? 6 : 1.7), sty === 'chip' ? 0.08 : 0.14);
    // lead / arp (a seeded melody per track so each one sounds different but repeats like a song)
    var seed = (tr.id.charCodeAt(0) * 31 + tr.id.length * 7 + s16 * 13 + (bar % 2) * 5) % 17;
    if (sty === 'chip' || sty === 'synth') { if (s16 % 2 === 0) osc('square', midi(root + 24 + chord[(s16 / 2 + seed) % 4]), t, spb * 1.4, sty === 'chip' ? 0.05 : 0.035); }
    else if (sty === 'house') { if (s16 % 4 === 2) chord.slice(0, 3).forEach(function (n) { osc('sawtooth', midi(root + 24 + n), t, spb * 1.6, 0.025); }); if (seed % 5 === 0) osc('square', midi(root + 36 + chord[seed % 3]), t, spb * 2, 0.03); }
    else if (sty === 'lofi') { if (s16 === 0) chord.forEach(function (n) { osc('triangle', midi(root + 24 + n), t, spb * 14, 0.04); }); if (seed % 4 === 0) osc('sine', midi(root + 36 + chord[seed % 4]), t, spb * 3, 0.05); }
    else if (sty === 'polka' || sty === 'rock') { if (seed % 3 === 0) osc('square', midi(root + 24 + chord[seed % 4]), t, spb * 1.8, 0.04); }
  }
  var EMOTES = [['wave', '\uD83D\uDC4B', 'Wave'], ['dance', '\uD83D\uDD7A', 'Dance'], ['spin', '\uD83C\uDF00', 'Spin'], ['robot', '\uD83E\uDD16', 'Robot'], ['jump', '\u2B06\uFE0F', 'Jump'], ['floss', '\uD83E\uDDB5', 'Floss']];
  var danceT = 0;
  function openEmotes() { $('arEmotes').classList.remove('hidden'); document.body.classList.add('arEmo'); hidePromptNow(); markEmo(); snd('menu'); if (!UI.music().on) { playTrack(TRACKS.dj[0], 'roof'); AR.djSay('Dance floor\u2019s open! Hit it!'); } }
  function closeEmotes() { $('arEmotes').classList.add('hidden'); document.body.classList.remove('arEmo'); GA.Hub.setEmote(null); setTimeout(function () { if (GA.UI && GA.UI.refreshPrompt) GA.UI.refreshPrompt(); }, 30); }
  function markEmo() { var n = GA.Hub.emote(); Array.prototype.forEach.call(document.querySelectorAll('.arEmo'), function (b) { b.classList.toggle('on', b.getAttribute('data-emo') === n); }); }
  UI.emotesOpen = function () { return !$('arEmotes').classList.contains('hidden'); };
  function openFireworks() {
    var h = '<div class="arFwRow">' + Object.keys(AR.FW_TYPES).map(function (k) { var d = AR.FW_TYPES[k]; return '<button class="arFw" data-fw="' + k + '" style="--c:' + d.cols[0] + '">' + ({ peony: '\uD83C\uDF38', ring: '\u2B55', heart: '\u2764\uFE0F', willow: '\u2728', smile: '\uD83D\uDE00', grok: '\uD83C\uDD76' }[k]) + '<small>' + esc(d.name) + '</small></button>'; }).join('') + '</div>';
    show('fireworks', '\uD83C\uDF86 FIREWORKS', 'Tap to launch \u00b7 they burst over the city', h, '<button class="bigBtn" id="arFinale">\uD83C\uDF87 FINALE (all 6!)</button>', 'roof fw');
    GA.Hub.setCamOverride(function () { var c = AR.cab('rf_fireworks'); return [c.x - 1.2, 2.0, c.z + 0.2, c.x + 18, 15, c.z]; });
    var lastL = 0; function go(k, o) { var n = performance.now(); if (!o && n - lastL < 350) return; lastL = n; AR.launch(k, o); if (GA.Prog) GA.Prog.event('rfFirework'); }
    wire('[data-fw]', function (b) { go(b.getAttribute('data-fw')); });
    $('arFinale').addEventListener('click', function () { var ks = Object.keys(AR.FW_TYPES); ks.forEach(function (k, i) { setTimeout(function () { go(k, { x: 20 + i * 2.5, y: 14 + (i % 3) * 4, z: -118 + i * 2.6 }); }, i * 260); }); snd('launch'); });
  }
  function openSchedule() {
    var P = AR.party(), h = '<div class="arList">' + AR.SCHEDULE.map(function (d, i) { return '<div class="arItem' + (i === P.dow ? ' focus' : '') + '"><div class="arIco">' + d.icon + '</div><div class="arTxt"><b>' + d.day + ' \u00b7 ' + esc(d.name) + (i === P.dow ? ' (TODAY)' : '') + '</b><span>' + esc(d.what) + '</span></div></div>'; }).join('') + '</div>';
    var foot = P.night ? (P.claimed ? '<span class="arNote">Party bonus claimed this week. See you next Party Night!</span>' : '<button class="bigBtn" id="arClaim">\uD83C\uDF89 CLAIM PARTY BONUS (30 tickets' + (GA.Prog && !GA.Prog.owns('party_hat') ? ' + Party Hat' : '') + ')</button>') : '<span class="arNote">Party Night is every Friday + Saturday. Next: ' + esc(P.nextText) + '</span>';
    show('schedule', '\uD83C\uDF89 PARTY SCHEDULE', 'Something every day of the week', h, foot, 'roof');
    if ($('arClaim')) $('arClaim').addEventListener('click', function () { var r = AR.claimParty(); if (r.ok) { setT(); snd('win'); confetti(); toast('\uD83C\uDF89 +30 tickets' + (r.hat ? ' and the Rooftop Party Hat! Wear it from your gallery.' : '!'), 4500); for (var i = 0; i < 3; i++) setTimeout(function () { AR.launch(['heart', 'ring', 'peony'][Math.floor(Math.random() * 3)]); }, i * 300); } openSchedule(); });
  }

  /* ---------- basement puzzles + vault + desk ---------- */
  function openFuse() {
    var f = AR.fuseState(), h = '<div class="arFuse">' + f.grid.map(function (on, i) { return '<button class="arBrk' + (on ? ' on' : '') + '" data-brk="' + i + '" aria-label="Breaker ' + (i + 1) + (on ? ' on' : ' off') + '"><i></i></button>'; }).join('') + '</div><div class="arNote">' + (f.solved ? '\u26A1 POWER ON! The lights are back and the blacklight is glowing on the west wall...' + (f.reward ? ' (+25 tickets)' : '') : 'Tap a breaker to flip it AND the ones next to it (up, down, left, right). Get all 16 green!') + '</div>';
    show('fuse', '\u26A1 FUSE BOX', f.solved ? 'Fixed!' : 'Moves: ' + f.moves, h, '', 'base');
    if (!f.solved) wire('[data-brk]', function (b) { var r = AR.fusePress(+b.getAttribute('data-brk')); snd('tick'); if (r.solved) { snd('powerup'); toast('\u26A1 Lights on! +25 tickets. Something is glowing on the wall now...', 4200); setT(); } openFuse(); });
  }
  var safeIn = '';
  function openSafe() {
    var opened = AR.get('safeWk', '') === AR.week().key;
    var h = '<div class="arSafe"><div class="arSyms">' + AR.SAFE_SYMS.map(function (s, i) { return '<div class="arSym"><span>' + s + '</span><b>' + (safeIn[i] != null ? safeIn[i] : '_') + '</b></div>'; }).join('') + '</div><div class="arPad">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].map(function (k) { return '<button class="arKey' + (k === 'OK' ? ' ok' : k === 'C' ? ' clr' : '') + '" data-k="' + k + '">' + (k === 'C' ? 'CLR' : k === 'OK' ? 'OPEN' : k) + '</button>'; }).join('') + '</div>' +
      '<div class="arNote">' + (opened ? '\u2705 You already cracked it this week. The code changes every week!' : 'Clues: the 3 old posters on the walls, and something that only glows when the lights are fixed.') + '</div></div>';
    show('safe', '\uD83D\uDD10 GUS\u2019S CODE SAFE', 'Enter the 4-digit code', h, '', 'base');
    wire('[data-k]', function (b) { var k = b.getAttribute('data-k'); if (k === 'C') safeIn = ''; else if (k === 'OK') { var r = AR.trySafe(safeIn); if (r.ok) { snd('unlock'); if (r.again) toast('The safe is already open. It\u2019s empty until next week!'); else { setT(); confetti(); toast('\uD83D\uDD13 CRACKED IT! +' + r.tix + ' tickets' + (r.prize ? ' and GUS\u2019S GOLDEN KEY (rare prize)!' : '!'), 5000); } } else { snd('bad'); toast('\u274C Wrong code. Look closer at the posters!'); } safeIn = ''; }
      else if (safeIn.length < 4) { safeIn += k; snd('tick'); } openSafe(); });
  }
  function openVault() {
    var ids = ['gold_key', 'retro_cab'], h = '<div class="arList">' + ids.map(function (id) { var p = GA.findPrize(id), own = GA.Prog.owns(id); return '<div class="arItem vault"><div class="arIco img"><img alt="" src="' + GA.PrizeArt.url(id, 96, !own) + '"></div><div class="arTxt"><b>' + esc(p.name) + '</b><span>' + esc(p.desc) + '</span></div><div class="arBtns">' +
      (own ? '<button class="arBuy" data-view="' + id + '">\u2714 VIEW 3D</button>' : id === 'gold_key' ? '<button class="arBuy" disabled>CRACK THE SAFE</button>' : '<button class="arBuy" data-vbuy="' + id + '"' + (tix() < p.price ? ' disabled' : '') + '>' + TIX + ' ' + p.price + '</button>') + '</div></div>'; }).join('') + '</div><div class="arNote">Basement Rares never show up at the Prize Counter. You have ' + TIX + ' ' + tix() + '.</div>';
    show('vault', '\uD83D\uDC8E RARE PRIZE VAULT', 'Only in the Secret Basement', h, '', 'base');
    wire('[data-vbuy]', function (b) { var r = GA.Prog.vaultBuy(b.getAttribute('data-vbuy')); if (r.ok) { setT(); snd('win'); confetti(); toast('\uD83D\uDC8E You got the Mini Retro Cabinet! It\u2019s on your gallery shelf.', 4000); } else { snd('bad'); toast('Not enough tickets!'); } openVault(); });
    wire('[data-view]', function (b) { if (GA.PV) { UI.close(true); GA.PV.open(b.getAttribute('data-view'), GA.Prog.ownedIds()); } });
  }
  function openDesk() {
    var f = AR.fuseState().solved, h = '<div class="arNotes"><div class="arPaper">\uD83D\uDCDD <b>Gus, 1983:</b> \u201CStarted my new job at the arcade. They gave me a key to the basement. I will NEVER lose it.\u201D</div>' +
      '<div class="arPaper">\uD83D\uDCDD <b>Gus, last week:</b> \u201CLost the key. Again. It\u2019s ' + esc(AR.keySpot().name) + ', I think? Or was that last week...\u201D</div>' +
      '<div class="arPaper">\uD83D\uDCDD <b>Safe reminder:</b> \u201C\uD83C\uDF55 = Gio\u2019s lucky slice. \uD83D\uDD79\uFE0F = my best level. \uD83C\uDF86 = fireworks in \u201984. \u2B50 = painted with glow paint by the old cabinets. Only shows with the lights ON.\u201D</div>' +
      '<div class="arPaper">\uD83D\uDCDD <b>To do:</b> fix the MYSTERY cabinet (since 1987). Fix the fuse box' + (f ? ' \u2714 (someone did it!)' : '') + '. Do NOT let kids in the basement.</div></div>';
    show('desk', '\uD83E\uDDD3 GUS\u2019S OLD DESK', 'Dusty notes from 1983', h, '', 'base'); if (GA.Prog) GA.Prog.event('gusDesk');
  }

  /* ---------- Gus grumbles hints about his key ---------- */
  function wrapGus() { if (!GA.Hall || GA.Hall._arWrapped) return; var t0 = GA.Hall.talk; GA.Hall._arWrapped = true;
    GA.Hall.talk = function () { t0.apply(GA.Hall, arguments); if (!AR.unlocked()) setTimeout(function () { var line = 'Grumble... ' + AR.keyHint(); if (GA.Hall3D && GA.Hall3D.say) GA.Hall3D.say(line, 7); toast('\uD83E\uDDD3 Gus: \u201C' + line + '\u201D', 6000); }, 900); }; }

  /* ---------- per-frame: dance-off, boost chip, minimap ---------- */
  var mapK = -1, chipK = -1, lastWall = 0;
  UI.frame = function (t, dt, area) {
    var nowW = performance.now() / 1000, wdt = lastWall ? Math.min(0.5, nowW - lastWall) : 0; lastWall = nowW; // dance-off counts real seconds, even on a slow phone
    if (!built) build();
    if (UI.emotesOpen()) { var c = GA.Hub.near(); if (area !== 'roof' || !c || c.kind !== 'ar_dance') { if (!c || c.kind !== 'ar_dance') closeEmotes(); } }
    var P = AR.party(); if (P.dow === 2 && area === 'roof' && GA.Hub.emote() && GA.Hub.near() && GA.Hub.near().kind === 'ar_dance') { danceT += wdt; var info = $('arDanceInfo'); if (info) info.textContent = AR.get('danceDay', '') === new Date().toDateString() ? '\u2714 dance-off done today' : 'DANCE-OFF ' + Math.min(20, Math.floor(danceT)) + '/20 s';
      if (danceT >= 20 && AR.get('danceDay', '') !== new Date().toDateString()) { AR.set('danceDay', new Date().toDateString()); GA.addTickets(15); setT(); snd('win'); toast('\uD83D\uDC83 DANCE-OFF WINNER! +15 tickets', 3500); } }
    var k = Math.floor(t * 6); if (k !== mapK) { mapK = k; drawMap(); }
    var k2 = Math.floor(t); if (k2 !== chipK) { chipK = k2; var bl = boostList(), ch = $('arBoost'); if (ch) { ch.classList.toggle('hidden', !bl.length); ch.textContent = bl.join('  \u00b7  '); } }
  };
  function onArea(area) { if (MUS.on && MUS.where && area !== MUS.where) stopMusic(); if (area !== 'roof') { if (UI.emotesOpen()) closeEmotes(); } drawMap(true); }
  var MAPS = {
    arcade: { minX: -19, maxX: 19, minZ: -13, maxZ: 27, rooms: [['MAIN GAMES', -18, 6, -12, 12, '#3ff0ff'], ['BONUS', 6, 18, -12, 12, '#ff4fd8'], ['HALL', 2, 18, 12.4, 26, '#ffe14d'], ['FOOD COURT', -18, 1.6, 12.4, 26, '#ff9a3a']],
      marks: function () { return [['\uD83C\uDF55', -11.6, 12], ['\uD83C\uDFDB\uFE0F', 10, 12], ['\uD83D\uDED7', -17, 18.8], [AR.unlocked() ? '\uD83D\uDD13' : '\uD83D\uDD12', 1.2, 15], ['\uD83C\uDF9F\uFE0F', -6, 10.4]]; } },
    roof: { minX: -15, maxX: 15, minZ: -125, maxZ: -94, rooms: [['ROOFTOP PARTY DECK', -14, 14, -124, -95, '#ff4fd8']], marks: function () { return [['\uD83C\uDFA7', 0, -120.5], ['\uD83D\uDC83', 0, -113], ['\uD83C\uDF86', 10.3, -112], ['\uD83D\uDCC5', -12.9, -108], ['\uD83D\uDED7', 0, -96]]; } },
    basement: { minX: -12, maxX: 12, minZ: 99, maxZ: 119, rooms: [['SECRET BASEMENT', -11, 11, 100, 118, '#4ade80']], marks: function () { return [['\uD83D\uDD79\uFE0F', -10.5, 109], ['\u26A1', 10.8, 104.6], ['\uD83D\uDD10', 5.6, 117.4], ['\uD83D\uDC8E', -0.6, 117.3], ['\uD83D\uDCBF', 7.6, 100.6], ['\u2B06\uFE0F', 0, 100.4]]; } }
  };
  function drawMap(force) {
    var cv = $('arMap'); if (!cv || !AR || !AR.built) return; var started = !$('hud').classList.contains('hidden'); if (!started && !force) return;
    var big = cv.classList.contains('big'), area = GA.Hub.area(), M = area === 'roof' ? MAPS.roof : area === 'basement' ? MAPS.basement : MAPS.arcade, c = cv.getContext('2d'), W = cv.width, H = cv.height;
    var sx = W / (M.maxX - M.minX), sz = H / (M.maxZ - M.minZ), s = Math.min(sx, sz), ox = (W - (M.maxX - M.minX) * s) / 2, oz = (H - (M.maxZ - M.minZ) * s) / 2;
    function X(x) { return ox + (x - M.minX) * s; } function Z(z) { return oz + (z - M.minZ) * s; }
    c.clearRect(0, 0, W, H); c.fillStyle = 'rgba(14,6,34,.82)'; c.fillRect(0, 0, W, H);
    M.rooms.forEach(function (r) { c.fillStyle = r[5] + '22'; c.strokeStyle = r[5]; c.lineWidth = 3; c.fillRect(X(r[1]), Z(r[3]), (r[2] - r[1]) * s, (r[4] - r[3]) * s); c.strokeRect(X(r[1]), Z(r[3]), (r[2] - r[1]) * s, (r[4] - r[3]) * s);
      c.fillStyle = r[5]; c.font = 'bold ' + (big ? 15 : 13) + 'px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(r[0], X((r[1] + r[2]) / 2), Z(r[3]) + 14); });
    c.font = (big ? 22 : 20) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; M.marks().forEach(function (m) { c.fillText(m[0], X(m[1]), Z(m[2])); });
    var p = GA.Hub.pose(), px = X(p.x), pz = Z(p.z), f = p.face; c.save(); c.translate(px, pz); c.rotate(-f + Math.PI); c.fillStyle = '#ffffff'; c.strokeStyle = '#ff4fd8'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -11); c.lineTo(8, 8); c.lineTo(0, 4); c.lineTo(-8, 8); c.closePath(); c.fill(); c.stroke(); c.restore();
  }
  UI.drawMap = drawMap; UI.build = build;
})();
