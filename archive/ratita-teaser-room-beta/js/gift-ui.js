/* Grok Arcade - CARRIE'S GIFT BOOTH UI (issue #64):
   Operated by Gary's daughter Carrie, featuring the Ratita Industries x Tortuga Tech Gift-O-Matic 3000,
   Grand Opening Gift Box, Daily Capsule Spin, Milestone Gift Boxes, and all 5 Pet Crew cameos
   (Luna, Pi-rat, Snowie, Candy, Torty). All rewards are saved in js/progress.js (grokArcade.prog)
   so they sync with Bob's Account Desk and cannot be exploited. */
(function () {
  'use strict';
  var UI = GA.GiftUI = {}, curTab = 'machine';
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function snd(n) { try { if (GA.Audio) GA.Audio.play(n); } catch (e) {} }
  function toast(m, ms) { if (GA.Fix && GA.Fix.toast) GA.Fix.toast(m, ms || 3800); }
  function setT() { if (GA.onTickets) GA.onTickets(GA.getTickets()); if (GA.Gift3D && GA.Gift3D.refresh) GA.Gift3D.refresh(); }

  var CARRIE_LINES = [
    'Hi!! I\u2019m Carrie\u2014Gary from IT\u2019s daughter! Dad gave me my very own pocket protector for Opening Day. Look, three pens AND a mini ribbon scissors!',
    'Luna from Ratita Industries and Torty from Tortuga Tech built our Gift-O-Matic 3000 together! Dad tried to wire it to his coffee maker first, so Luna had to re-solder it.',
    'Every gift you open here is saved to your Arcade progress, so Bob\u2019s Account Desk syncs it right across your devices\u2014no lost tickets and no sneaky double-dipping!',
    'Pi-rat hid a treasure chest on my counter, Snowie flew the ribbons in from Sky Tours, and Candy personally sparkle-tested every capsule!',
    'Uncle Larry came up from the Secret Basement to admire the Tortuga Tech brass gears, and Great-Great-Grandma Mrs sent over hard candies from the East Wing!'
  ];
  function pickLine() { return CARRIE_LINES[Math.floor(Math.random() * CARRIE_LINES.length)]; }

  var CARRIE_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true">' +
    '<rect width="64" height="64" rx="14" fill="#3b0764"/>' +
    '<path d="M14 58 C14 44 50 44 50 58" fill="#14b8a6"/>' +
    '<rect x="20" y="45" width="24" height="15" rx="4" fill="#db2777"/>' +
    '<rect x="21" y="48" width="8" height="7" rx="1.5" fill="#fff"/>' +
    '<line x1="23" y1="45" x2="23" y2="49" stroke="#ef4444" stroke-width="2"/>' +
    '<line x1="25" y1="45" x2="25" y2="49" stroke="#facc15" stroke-width="2"/>' +
    '<line x1="27" y1="45" x2="27" y2="49" stroke="#38bdf8" stroke-width="2"/>' +
    '<circle cx="32" cy="30" r="14" fill="#f5cfa0"/>' +
    '<path d="M17 28 C17 14 47 14 47 28 L45 22 L19 22 Z" fill="#2a1b10"/>' +
    '<path d="M22 14 L32 19 L22 21 Z" fill="#ec4899"/><path d="M42 14 L32 19 L42 21 Z" fill="#ec4899"/><circle cx="32" cy="18" r="3" fill="#fbbf24"/>' +
    '<rect x="21" y="26" width="9" height="7" rx="2" fill="none" stroke="#fde68a" stroke-width="2.2"/>' +
    '<rect x="34" y="26" width="9" height="7" rx="2" fill="none" stroke="#fde68a" stroke-width="2.2"/>' +
    '<line x1="30" y1="29" x2="34" y2="29" stroke="#fde68a" stroke-width="2"/>' +
    '<circle cx="25.5" cy="29.5" r="1.8" fill="#0f172a"/><circle cx="38.5" cy="29.5" r="1.8" fill="#0f172a"/>' +
    '<path d="M27 36 Q32 40 37 36" fill="none" stroke="#be123c" stroke-width="2.2" stroke-linecap="round"/>' +
    '</svg>';

  UI.prompt = function () {
    var st = GA.Prog && GA.Prog.giftBoothState ? GA.Prog.giftBoothState() : { readyCount: 1 };
    var badge = st.readyCount > 0 ? ' \u00b7 \uD83C\uDF81 ' + st.readyCount + (st.readyCount === 1 ? ' GIFT READY!' : ' GIFTS READY!') : ' \u00b7 All caught up today!';
    return {
      tag: 'RATITA \u00d7 TORTUGA \u00b7 CARRIE\u2019S GIFT BOOTH',
      name: 'Carrie\u2019s Gift Booth (Gary\u2019s Daughter)',
      desc: 'Spin the Ratita Industries \u00d7 Tortuga Tech Gift-O-Matic 3000 for daily bonus tickets, snack boosts, milestone boxes, and pet gifts from Luna, Pi-rat, Snowie, Candy & Torty!' + badge,
      btn: 'GIFTS',
      key: 'open Gift Booth',
      cls: 'prize',
      pb: 'pzPlay'
    };
  };

  UI.open = function (cab, tab) {
    curTab = tab || 'machine';
    if (GA.Gift3D && GA.Gift3D.wave) GA.Gift3D.wave(2.6);
    snd('talk');
    render();
  };

  function render(customLine) {
    if (!GA.AreasUI || !GA.Prog || !GA.Prog.giftBoothState) return;
    if (GA.AreasUI.build) GA.AreasUI.build();
    var st = GA.Prog.giftBoothState();
    var tixNow = GA.getTickets();
    var coinsNow = (GA.Areas && GA.Areas.coins) ? GA.Areas.coins() : 0;
    var readyMs = st.milestones.filter(function (m) { return m.ready; }).length;
    var readyPets = st.pets.filter(function (p) { return !p.claimed; }).length;

    var headerHtml =
      '<div class="gbSay">' +
        '<div class="gbFace">' + CARRIE_SVG + '</div>' +
        '<div class="gbBubble">' +
          '<div class="gbWho"><b>CARRIE</b> <span>Gary\u2019s Daughter \u00b7 Gift Booth Operator</span></div>' +
          '<div class="gbQuote">\u201C' + esc(customLine || pickLine()) + '\u201D</div>' +
        '</div>' +
      '</div>' +
      '<div class="gbBar">' +
        '<div class="gbWallet"><span>\uD83C\uDF9F\uFE0F <b>' + tixNow.toLocaleString() + '</b> tickets</span><span>\uD83E\uDE99 <b>' + coinsNow + '</b> coins</span><span class="gbSync">\uD83D\uDD04 Synced with Bob\u2019s Desk</span></div>' +
        '<div class="gbTabs">' +
          '<button class="gbTab' + (curTab === 'machine' ? ' on' : '') + '" data-gbtab="machine">\uD83C\uDFB0 Gift-O-Matic' + ((!st.welcomeClaimed || st.canSpin) ? ' <i class="gbDot">!</i>' : '') + '</button>' +
          '<button class="gbTab' + (curTab === 'milestones' ? ' on' : '') + '" data-gbtab="milestones">\uD83C\uDF81 Milestone Boxes' + (readyMs ? ' <i class="gbDot">' + readyMs + '</i>' : '') + '</button>' +
          '<button class="gbTab' + (curTab === 'pets' ? ' on' : '') + '" data-gbtab="pets">\uD83D\uDC3E Pet Crew (' + (5 - readyPets) + '/5)' + (readyPets ? ' <i class="gbDot">' + readyPets + '</i>' : '') + '</button>' +
        '</div>' +
      '</div>';

    var bodyHtml = '';
    if (curTab === 'machine') {
      bodyHtml = renderMachineTab(st);
    } else if (curTab === 'milestones') {
      bodyHtml = renderMilestonesTab(st);
    } else {
      bodyHtml = renderPetsTab(st);
    }

    var footHtml = '<button class="pill" id="gbDadBtn">\uD83D\uDC68\u200D\uD83D\uDCBB Wave to Dad (Gary)</button><button class="pill" id="gbCloseBtn">Done</button>';
    GA.AreasUI.show('gift_booth', '\uD83C\uDF81 CARRIE\u2019S GIFT BOOTH', 'Ratita Industries \u00d7 Tortuga Tech \u00b7 Gift-O-Matic 3000', headerHtml + bodyHtml, footHtml, 'gbPanel');

    // Wire tab buttons
    GA.AreasUI.wire('[data-gbtab]', function (b) {
      curTab = b.getAttribute('data-gbtab');
      snd('click');
      render();
    });

    // Wire actions
    var wBtn = $('gbClaimWelcome');
    if (wBtn) {
      wBtn.onclick = function () {
        var r = GA.Prog.claimGiftWelcome();
        if (r.ok) {
          snd('win');
          if (GA.Gift3D) GA.Gift3D.spinAnim();
          setT();
          toast('\uD83C\uDF89 GRAND OPENING GIFT! +150 Tickets & +3 Food Court Coins from Carrie!', 4800);
          render('Yay!! Enjoy your 150 Grand Opening tickets and 3 Food Court coins! Dad double-checked the ticket counter himself!');
        }
      };
    }

    var sBtn = $('gbSpinBtn');
    if (sBtn) {
      sBtn.onclick = function () {
        var r = GA.Prog.spinGiftMachine();
        if (r.ok) {
          snd('powerup');
          if (GA.Gift3D) GA.Gift3D.spinAnim();
          setT();
          var c = r.capsule;
          toast('\uD83C\uDFB0 ' + c.name + '! +' + c.tix + ' Tickets, +' + c.coins + ' Coins & ' + c.snackLabel + '!', 5200);
          render('CLUNK-WHIRRR-DING! The Ratita \u00d7 Tortuga Gift-O-Matic 3000 dropped ' + c.name + '! (' + c.note + ')');
        } else {
          snd('bad');
          toast('You already cranked today\u2019s capsule! Come back tomorrow for a fresh spin.', 3600);
        }
      };
    }

    GA.AreasUI.wire('[data-gbms]', function (b) {
      var id = b.getAttribute('data-gbms');
      var r = GA.Prog.claimGiftMilestone(id);
      if (r.ok) {
        snd('win');
        if (GA.Gift3D) GA.Gift3D.spinAnim();
        setT();
        toast('\uD83C\uDF81 Opened ' + r.milestone.name + '! +' + r.milestone.tix + ' Tickets & +' + r.milestone.coins + ' Coins!', 4500);
        render('Woohoo! You unlocked the ' + r.milestone.name + '! Torty stamped it with the official Tortuga Tech seal!');
      }
    });

    GA.AreasUI.wire('[data-gbpet]', function (b) {
      var pid = b.getAttribute('data-gbpet');
      var r = GA.Prog.claimPetGift(pid);
      if (r.ok) {
        snd('win');
        if (GA.Gift3D) GA.Gift3D.wave(2.5);
        setT();
        toast(r.pet.icon + ' ' + r.pet.name + ' gave you +' + r.pet.tix + ' bonus tickets!', 4200);
        render(r.pet.name + ' says: \u201C' + r.pet.quote + '\u201D (+' + r.pet.tix + ' tickets!)');
      }
    });

    var dadBtn = $('gbDadBtn');
    if (dadBtn) {
      dadBtn.onclick = function () {
        snd('talk');
        if (GA.Gift3D) GA.Gift3D.wave(3);
        toast('\uD83D\uDC68\u200D\uD83D\uDCBB Gary shouts from the IT Desk: \u201CHAVE YOU TRIED TURNING THE GIFT MACHINE OFF AND ON AGAIN? Love you, kiddo!\u201D', 4800);
        render('Haha! Dad just yelled across the arcade from the IT Help Desk: \u201CDon\u2019t forget to keep your pens in your pocket protector!\u201D');
      };
    }
    var clBtn = $('gbCloseBtn');
    if (clBtn) clBtn.onclick = function () { GA.AreasUI.close(); };
  }

  function renderMachineTab(st) {
    var welHtml = !st.welcomeClaimed
      ? '<div class="gbCard gbWelcome">' +
          '<div class="gbCardLeft">' +
            '<div class="gbBigIco">\uD83C\uDF81</div>' +
            '<div>' +
              '<div class="gbBadge">ONE-TIME GRAND OPENING GIFT</div>' +
              '<b>Carrie\u2019s Grand Opening Ribbon Box</b>' +
              '<span>Welcome to the new Gift Booth! Includes <b>+150 Tickets</b> and <b>+3 Food Court Coins \uD83E\uDE99</b> (once per save, synced by Bob\u2019s Desk).</span>' +
            '</div>' +
          '</div>' +
          '<button class="bigBtn gbGoldBtn" id="gbClaimWelcome">\uD83C\uDF81 OPEN (+150 \uD83C\uDF9F\uFE0F + 3 \uD83E\uDE99)</button>' +
        '</div>'
      : '<div class="gbCard gbDone">' +
          '<div class="gbCardLeft"><div class="gbBigIco">\u2705</div><div><b>Grand Opening Ribbon Box Claimed</b><span>+150 Tickets & +3 Coins added to your synced Arcade save!</span></div></div>' +
        '</div>';

    var capHtml = '';
    if (st.lastCapsule && st.lastCapsule.day === st.today) {
      var c = st.lastCapsule;
      capHtml =
        '<div class="gbCapResult" style="--capCol:' + esc(c.color || '#fbbf24') + '">' +
          '<div class="gbCapTop">' + esc(c.petIcon) + ' <b>' + esc(c.name) + '</b> <span>(' + esc(c.maker) + ')</span></div>' +
          '<div class="gbCapPrizes">' +
            '<span>\uD83C\uDF9F\uFE0F +' + c.tix + ' Tickets' + (c.streakBonus ? ' <i>(includes +' + c.streakBonus + ' 3-Spin Streak!)</i>' : '') + '</span>' +
            '<span>\uD83E\uDE99 +' + c.coins + ' Coins</span>' +
            '<span>' + esc(c.snackLabel) + '</span>' +
          '</div>' +
          '<div class="gbCapNote">\u201C' + esc(c.note) + '\u201D \u2014 <b>' + esc(c.pet) + '</b></div>' +
        '</div>';
    }

    var machHtml =
      '<div class="gbCard gbMachine">' +
        '<div class="gbMakerRow">' +
          '<span class="gbMaker ratita">\uD83E\uDDC0 RATITA INDUSTRIES</span>' +
          '<span class="gbMakerX">\u00d7</span>' +
          '<span class="gbMaker tortuga">\uD83D\uDC22 TORTUGA TECH</span>' +
          '<span class="gbModel">MODEL GM-3000 \u00b7 SPINS: ' + st.spins + '</span>' +
        '</div>' +
        '<div class="gbMachBody">' +
          '<div class="gbDomeArt">' +
            '<div class="gbDomeGlobe">' +
              '<span style="background:#fbbf24">\u2699\uFE0F</span>' +
              '<span style="background:#34d399">\uD83D\uDEE1\uFE0F</span>' +
              '<span style="background:#f59e0b">\uD83E\uDE99</span>' +
              '<span style="background:#38bdf8">\u2744\uFE0F</span>' +
              '<span style="background:#f472b6">\uD83C\uDF80</span>' +
            '</div>' +
            '<div class="gbDomeBase">GIFT-O-MATIC 3000</div>' +
          '</div>' +
          '<div class="gbMachInfo">' +
            '<b>Daily Gift-O-Matic Capsule</b>' +
            '<p>Crank the brass handle once per day! Every capsule drops <b>45\u201375 Tickets</b>, <b>2\u20133 Food Court Coins \uD83E\uDE99</b>, and an instant <b>Snack Boost Voucher</b>! Every 3rd spin adds a <b>+25 Ticket Tortuga Overclock Bonus</b>.</p>' +
            (st.canSpin
              ? '<button class="bigBtn gbSpinBtn" id="gbSpinBtn">\uD83C\uDFB0 CRANK DAILY CAPSULE' + (st.streakNext ? ' (+25 STREAK BONUS!)' : '') + '</button>'
              : '<button class="bigBtn" disabled>\u2705 TODAY\u2019S CAPSULE OPENED (COME BACK TOMORROW)</button>') +
          '</div>' +
        '</div>' +
        capHtml +
      '</div>';

    return '<div class="gbWrap">' + welHtml + machHtml + '</div>';
  }

  function renderMilestonesTab(st) {
    var rows = st.milestones.map(function (m) {
      var pct = Math.min(100, Math.round((m.cur / m.goal) * 100));
      var btn = m.claimed
        ? '<button class="pill gbClaimedBtn" disabled>\u2714 OPENED</button>'
        : m.ready
          ? '<button class="bigBtn gbGoldBtn" data-gbms="' + esc(m.id) + '">\uD83C\uDF81 OPEN (+' + m.tix + ' \uD83C\uDF9F\uFE0F +' + m.coins + ' \uD83E\uDE99)</button>'
          : '<button class="pill" disabled>' + m.cur + ' / ' + m.goal + '</button>';
      return '<div class="gbCard gbMsRow' + (m.ready ? ' ready' : m.claimed ? ' claimed' : '') + '">' +
        '<div class="gbCardLeft">' +
          '<div class="gbBigIco">' + m.icon + '</div>' +
          '<div class="gbMsTxt">' +
            '<b>' + esc(m.name) + '</b>' +
            '<span>' + esc(m.desc) + ' \u00b7 Reward: <b>+' + m.tix + ' \uD83C\uDF9F\uFE0F</b> & <b>+' + m.coins + ' \uD83E\uDE99</b></span>' +
            '<div class="gbBarTrack"><div class="gbBarFill" style="width:' + pct + '%"></div></div>' +
          '</div>' +
        '</div>' +
        '<div class="gbMsAct">' + btn + '</div>' +
      '</div>';
    }).join('');
    return '<div class="gbWrap"><div class="gbSubNote">Play games, earn Arcade badges, and collect prizes to unlock Ratita \u00d7 Tortuga Milestone Gift Boxes! Each box can be opened once per save.</div>' + rows + '</div>';
  }

  function renderPetsTab(st) {
    var cards = st.pets.map(function (p) {
      var btn = p.claimed
        ? '<button class="pill gbClaimedBtn" disabled>\u2714 +' + p.tix + ' \uD83C\uDF9F\uFE0F</button>'
        : '<button class="bigBtn gbPetBtn" data-gbpet="' + esc(p.id) + '">\uD83D\uDC3E SAY HI (+' + p.tix + ' \uD83C\uDF9F\uFE0F)</button>';
      return '<div class="gbCard gbPetCard' + (p.claimed ? ' claimed' : ' ready') + '">' +
        '<div class="gbCardLeft">' +
          '<div class="gbBigIco">' + p.icon + '</div>' +
          '<div>' +
            '<b>' + esc(p.name) + ' <small>\u00b7 ' + esc(p.role) + '</small></b>' +
            '<span>\u201C' + esc(p.quote) + '\u201D</span>' +
          '</div>' +
        '</div>' +
        '<div class="gbMsAct">' + btn + '</div>' +
      '</div>';
    }).join('');
    return '<div class="gbWrap"><div class="gbSubNote">All five pets helped build and decorate Carrie\u2019s Gift Booth! Say hi to Luna, Pi-rat, Snowie, Candy, and Torty for a one-time +15 Ticket Pet Crew gift each.</div>' + cards + '</div>';
  }
})();
