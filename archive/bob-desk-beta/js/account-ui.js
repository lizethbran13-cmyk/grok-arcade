/* Grok Arcade - BOB'S ACCOUNT DESK screens (issue #49): account card, TRANSFER SAVE (code / QR / link / file),
   LOAD SAVE (paste or open a file -> check -> confirm -> backup + load), RESTORE BACKUP, DEVICES (max 3) and the honest
   LIVE SYNC: COMING SOON sign. Opened from the 3D desk (kind ac_desk) through GA.AreasUI. */
(function () {
  'use strict';
  var UI = GA.AccountUI = {}, AC = GA.Account, AR = function () { return GA.AreasUI; };
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function snd(n) { try { GA.Audio.play(n); } catch (e) {} }
  function toast(m, ms) { if (GA.Fix && GA.Fix.toast) GA.Fix.toast(m, ms || 3200); }
  function mood(m, s) { if (GA.Account3D && GA.Account3D.mood) GA.Account3D.mood(m, s); }
  function wave(s) { if (GA.Account3D && GA.Account3D.wave) GA.Account3D.wave(s); }
  function fmtId(id) { return id ? id.slice(0, 3) + '&nbsp;' + id.slice(3) : '--- ---'; }
  function ago(t) { var s = Math.max(0, (Date.now() - t) / 1000); return s < 90 ? 'just now' : s < 5400 ? Math.round(s / 60) + ' min ago' : s < 129600 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' days ago'; }
  function when(t) { try { return new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } }

  /* ---------- Bob's lines: long, pushy, nice ---------- */
  var HELLO = [
    'Welcome to Bob\u2019s Account Desk! Have you heard about PREMIUM PLATINUM PLUS? It doesn\u2019t exist yet, but you could be FIRST in line!',
    'Hi hi hi! I\u2019m Bob, Lili\u2019s big brother. She says I talk too much. I say she listens too little. Anyway! Accounts!',
    'Your save is safe with me! It would be SAFER with Premium Platinum Plus Ultra. Which is also not real. Yet. Probably.',
    'Transfer fee: zero tickets! Tips are welcome. No? Okay. Fine. Totally fine. I\u2019m fine.',
    'Did you know accounts with a name are 400% more fun? I made that number up, but it FEELS true.',
    'Live Sync needs a save server. I asked Luna for one. She gave me a cheese. I\u2019m still waiting. The cheese is gone.',
    'Psst. Gold Membership. It comes with a gold sticker. The sticker is imaginary. Interested? ...Interested now?',
    'Max 3 devices per account! Unless you buy Premium. Which you can\u2019t. Because I haven\u2019t invented it. YET.',
    'Lili does Quality. I do Accounts. Mom says we\u2019re both her favorite. I\u2019m a LITTLE more favorite.'
  ];
  var line = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var BOB_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="20" cy="9" r="6" fill="#9ca3af"/><circle cx="32" cy="6" r="6.5" fill="#d6a26b"/><circle cx="44" cy="9" r="6" fill="#fff"/><ellipse cx="32" cy="34" rx="22" ry="23" fill="#fbbf24"/><rect x="11" y="27" width="42" height="15" rx="7" fill="#1c0f02"/><rect x="18" y="31" width="9" height="8" rx="2" fill="#fbbf24"/><rect x="37" y="31" width="9" height="8" rx="2" fill="#fbbf24"/><path d="M16 25 L28 21 M36 21 L48 25" stroke="#7c2d12" stroke-width="3" stroke-linecap="round"/><path d="M10 24 Q32 -2 54 24" stroke="#0f172a" stroke-width="3.5" fill="none"/><rect x="5" y="28" width="7" height="12" rx="3" fill="#0f172a"/><rect x="52" y="28" width="7" height="12" rx="3" fill="#0f172a"/><path d="M9 40 Q12 50 24 49" stroke="#0f172a" stroke-width="2.5" fill="none"/><circle cx="25" cy="49" r="2.5" fill="#dc2626"/></svg>';
  function say(text) { return '<div class="acBob"><div class="acFace">' + BOB_SVG + '</div><div class="acSay"><b>BOB</b> ' + text + '</div></div>'; }
  var SYNC_SIGN = '<div class="acSync"><b>\uD83D\uDD04 LIVE SYNC: coming soon</b><span>Needs a save server (the arcade lives on GitHub Pages, which can\u2019t store saves). When it\u2019s ready, your account ID links up to <b>3 devices</b> and you can <b>share with friends</b>. For now: Transfer Save.</span></div>';

  /* ---------- prompt ---------- */
  UI.prompt = function () {
    var a = AC.get();
    return { tag: 'RATITA INDUSTRIES \u00b7 ACCOUNTS', name: 'Bob\u2019s Account Desk', desc: a ? 'Account #' + a.id + ' (' + a.name + '). Move your whole Grok save to another device!' : 'Bob, Lili\u2019s big brother, sets up your account and moves your WHOLE Grok save to another device. (He will mention Premium.)', btn: 'TALK', key: 'talk to Bob', cls: 'npc' };
  };
  UI.open = function () { home(); };

  function show(sub, body, foot) { if (AR().build) AR().build(); AR().show('account', 'BOB\u2019S ACCOUNT DESK', sub, body, foot, 'acPanel'); }

  /* ---------- home ---------- */
  function home(greet) {
    var a = AC.get(); snd('talk'); mood('happy', 2); wave(2.5);
    if (!a) {
      show('Ratita Industries \u00b7 Accounts',
        say(greet || 'A NEW customer! Let\u2019s make you an account. It\u2019s free! (Premium is also free, because it doesn\u2019t exist.)') +
        '<div class="acCard"><div class="acLbl">YOUR NAME</div><input id="acName" class="acIn" maxlength="16" placeholder="Player" value="' + esc(guess()) + '"><div class="acNote">Bob gives you a 6-digit account ID. Your saves stay on this device until you transfer them.</div></div>' + SYNC_SIGN,
        (AC.backup() ? '<button class="pill" id="acBak">\u21A9\uFE0F Backup</button>' : '') + '<button class="pill" id="acHave">\uD83D\uDCE5 Load a save</button><button class="bigBtn" id="acMake">\u270D\uFE0F SIGN ME UP</button>');
      $('acHave').onclick = function () { load(); }; if ($('acBak')) $('acBak').onclick = restore;
      $('acMake').onclick = function () { var n = AC.clean($('acName').value) || 'Player'; AC.create(n); snd('win'); refresh3d(); toast('\uD83C\uDF89 Account made! Bob says: \u201cWelcome, ' + n + '! Ask me about Premium!\u201d'); home('Done! You\u2019re official! Here\u2019s your account ID. Frame it. Or don\u2019t. (Frame it.)'); };
      return;
    }
    var bak = AC.backup(), n = AC.devices().length, sm = AC.summary();
    show('Ratita Industries \u00b7 Accounts',
      say(greet || line(HELLO)) +
      '<div class="acCard acAcct"><div class="acLbl">ACCOUNT ID</div><div class="acId">' + fmtId(a.id) + '</div>' +
      '<div class="acNameRow"><span id="acNm">' + esc(a.name) + '</span><button class="pill acSm" id="acRen">\u270F\uFE0F Rename</button></div>' +
      '<div class="acStats"><span>\uD83C\uDF9F\uFE0F ' + sm.tickets.toLocaleString() + '</span><span>\uD83C\uDF81 ' + sm.prizes + (sm.prizes === 1 ? ' prize' : ' prizes') + '</span><span>\uD83C\uDFC5 ' + sm.badges + ' badges</span><span>\uD83E\uDDE9 ' + sm.dlc + ' DLC</span><span>\uD83C\uDFAE ' + sm.games.length + (sm.games.length === 1 ? ' game' : ' games') + '</span></div>' +
      '<div class="acNote">This ID is your account\u2019s name tag for Live Sync later. On its own it can\u2019t move a save (no save server yet), so <b>Transfer Save</b> gives you a code that carries the whole save.</div></div>' +
      '<div class="acGrid"><button class="acBig" id="acOut"><b>\uD83D\uDCE4 TRANSFER SAVE</b><span>make a code / QR for your other device</span></button><button class="acBig" id="acIn"><b>\uD83D\uDCE5 LOAD SAVE</b><span>paste a code from another device</span></button>' +
      '<button class="acBig sm" id="acBak"' + (bak ? '' : ' disabled') + '><b>\u21A9\uFE0F RESTORE BACKUP</b><span>' + (bak ? 'from ' + when(bak.t) : 'no backup yet') + '</span></button><button class="acBig sm" id="acDev"><b>\uD83D\uDCF1 DEVICES ' + n + '/' + AC.MAX_DEVICES + '</b><span>linked by transfer</span></button></div>' +
      SYNC_SIGN + '<button class="acPrem" id="acPrem">\u2B50 Upgrade to PREMIUM PLATINUM PLUS</button>',
      '');
    $('acOut').onclick = transfer; $('acIn').onclick = function () { load(); }; $('acDev').onclick = devices; if (bak) $('acBak').onclick = restore;
    $('acRen').onclick = function () { var nm = prompt('New name (max 16):', a.name); if (nm == null) return; AC.rename(nm); refresh3d(); home('Ooh, ' + esc(AC.get().name) + '! Classy. Very Premium-sounding. Just saying.'); };
    $('acPrem').onclick = function () { snd('bad'); mood('shock', 1.6); wave(3); var b = document.querySelector('#arBody .acSay'); if (b) b.innerHTML = '<b>BOB</b> ' + line(['WOW, you clicked it! Nobody clicks it! ...It doesn\u2019t exist yet. But I\u2019ll remember this. Forever.', 'Premium Platinum Plus is SOLD OUT. It was never in stock. That\u2019s how exclusive it is.', 'Great news: Premium is FREE today! Bad news: it doesn\u2019t exist. Neutral news: I like your shoes.']); };
  }
  function guess() { try { var n = localStorage.getItem('grokNet.name'); if (n) return AC.clean(n.replace(/^"|"$/g, '')); } catch (e) {} return ''; }
  function refresh3d() { if (GA.Account3D && GA.Account3D.refresh) GA.Account3D.refresh(); }
  function back(id) { var b = $(id); if (b) b.onclick = function () { home(); }; }
  function statsHtml(sm) {
    return '<div class="acStats"><span>\uD83C\uDF9F\uFE0F ' + sm.tickets.toLocaleString() + ' tickets</span><span>\uD83C\uDF81 ' + sm.prizes + (sm.prizes === 1 ? ' prize' : ' prizes') + '</span><span>\uD83C\uDFC5 ' + sm.badges + ' badges</span><span>\uD83E\uDDE9 ' + sm.dlc + (sm.dlc === 1 ? ' DLC key' : ' DLC keys') + '</span></div>' +
      '<div class="acGames">' + (sm.games.length ? sm.games.map(function (g) { return '<span>' + esc(g) + '</span>'; }).join('') : '<i>no game saves yet</i>') + '</div>';
  }

  /* ---------- TRANSFER SAVE ---------- */
  function transfer() {
    snd('click'); mood('happy', 2);
    var sbx = AC.sandboxed();
    show('Transfer Save', say('Packing up your WHOLE save: the Arcade and every Grok game! I\u2019m folding it very small. Like a tiny origami cheese.') + '<div class="acCard"><div class="acNote">Making your code\u2026</div></div>', '');
    AC.exportCode().then(function (r) {
      var sm = AC.summary(r.snap.keys), kb = (r.code.length / 1024).toFixed(1);
      show('Transfer Save',
        say(line(['Here\u2019s your transfer code! Paste it at my desk on your other device. Do NOT show it to strangers. It\u2019s your WHOLE save!', 'Done! One code, every game. Premium members get the SAME code but it feels shinier. (Premium doesn\u2019t exist.)'])) +
        (sbx ? '<div class="acWarn">\uD83E\uDDEA Time Jumper preview: this code holds your <b>real</b> save (read only, nothing was changed).</div>' : '') +
        '<div class="acCard"><div class="acLbl">WHAT\u2019S IN IT \u00b7 account #' + esc(r.snap.acct.id) + ' \u00b7 ' + sm.keys + ' save entries</div>' + statsHtml(sm) + '</div>' +
        '<div class="acCard"><div class="acLbl">TRANSFER CODE \u00b7 ' + kb + ' KB</div><textarea id="acCode" class="acCode" readonly rows="4">' + esc(r.code) + '</textarea>' +
        '<div class="acRow"><button class="pill" id="acCopy">\uD83D\uDCCB Copy code</button><button class="pill" id="acLink">\uD83D\uDD17 Copy link</button>' + (navigator.share ? '<button class="pill" id="acShare">\uD83D\uDCE8 Share</button>' : '') + '<button class="pill" id="acFile">\uD83D\uDCBE Save file</button></div>' +
        '<div id="acQR" class="acQR"></div>' +
        '<div class="acNote">On the other device: Grok Arcade \u2192 Bob\u2019s Account Desk \u2192 <b>Load Save</b> \u2192 paste (or open the file / the link). Your 6-digit ID alone can\u2019t do this yet: that needs Live Sync and a save server.</div></div>',
        '<button class="pill" id="acBack">\u2190 Back</button>');
      back('acBack');
      var ta = $('acCode'); ta.onclick = function () { ta.select(); };
      $('acCopy').onclick = function () { copy(r.code, 'Code copied! Paste it at Bob\u2019s desk on your other device.'); };
      $('acLink').onclick = function () { copy(r.link, 'Link copied! Open it on your other device to load this save.'); };
      if ($('acShare')) $('acShare').onclick = function () { navigator.share({ title: 'My Grok save', text: 'My Grok Arcade save (open on my other device):', url: r.link }).catch(function () {}); };
      $('acFile').onclick = function () { var b = new Blob([r.code], { type: 'text/plain' }), u = URL.createObjectURL(b), aEl = document.createElement('a'); aEl.href = u; aEl.download = 'grok-save-' + r.snap.acct.id + '-' + new Date().toISOString().slice(0, 10) + '.grok-save.txt'; document.body.appendChild(aEl); aEl.click(); setTimeout(function () { URL.revokeObjectURL(u); aEl.remove(); }, 800); toast('\uD83D\uDCBE Save file downloaded.'); };
      qr(r);
      snd('win');
    }).catch(function (e) { show('Transfer Save', say('Uh oh. My folding machine jammed. (' + esc(e && e.message) + ') Try again?') , '<button class="pill" id="acBack">\u2190 Back</button>'); back('acBack'); });
  }
  function qr(r) {
    var box = $('acQR'); if (!box) return;
    if (!r.qr || typeof qrcode !== 'function') { box.innerHTML = '<div class="acNote">\uD83D\uDCF7 Your save is too big for one QR code (' + r.code.length.toLocaleString() + ' characters; a phone camera reads about ' + AC.QR_MAX.toLocaleString() + '). Use Copy, Share, Link or Save file instead. <i>Bob: \u201cBig save = big gamer. Respect.\u201d</i></div>'; return; }
    try {
      var q = qrcode(0, 'L'); q.addData(r.link, 'Byte'); q.make();
      var n = q.getModuleCount(), px = Math.max(2, Math.floor(260 / (n + 8))), c = document.createElement('canvas'), S = (n + 8) * px; c.width = c.height = S; var g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, S, S); g.fillStyle = '#000'; for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (q.isDark(y, x)) g.fillRect((x + 4) * px, (y + 4) * px, px, px);
      c.className = 'acQRc'; box.innerHTML = '<div class="acLbl">SCAN WITH YOUR OTHER DEVICE\u2019S CAMERA</div>'; box.appendChild(c);
    } catch (e) { box.innerHTML = '<div class="acNote">QR didn\u2019t fit. Use Copy, Share, Link or Save file.</div>'; }
  }
  function copy(s, msg) {
    var done = function () { toast('\uD83D\uDCCB ' + msg); snd('click'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(done, fallback); else fallback();
    function fallback() { var t = document.createElement('textarea'); t.value = s; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Select the code and copy it by hand.'); } t.remove(); }
  }

  /* ---------- LOAD SAVE ---------- */
  var ERR = { six: 'That\u2019s a 6-digit account ID! Those can\u2019t move saves until Live Sync has a save server. Paste the long TRANSFER CODE (it starts with GAS1.).', format: 'That doesn\u2019t look like a transfer code. It should start with GAS1. (or be a transfer link).', damaged: 'This code got cut off or changed somewhere. Copy the WHOLE code again (it\u2019s long!).', browser: 'This browser is too old to unpack the code. Try an up-to-date Chrome, Safari, Edge or Firefox.', newer: 'This code comes from a newer arcade. Refresh this page to update, then try again.', space: 'This device is out of save space, so I can\u2019t make a backup. Nothing was changed.' };
  function load(prefill) {
    snd('click'); var sbx = AC.sandboxed();
    show('Load Save', say('Ooh, a save from another device! I\u2019ll back up your current save first. I\u2019m very thorough. Lili says \u201cannoying.\u201d Same thing!') +
      (sbx ? '<div class="acWarn">\uD83E\uDDEA Time Jumper preview: a loaded save goes into this preview\u2019s sandbox only. Your real save is never changed here.</div>' : '') +
      '<div class="acCard"><div class="acLbl">PASTE A TRANSFER CODE OR LINK</div><textarea id="acPaste" class="acCode" rows="4" placeholder="GAS1.\u2026" autocomplete="off" autocapitalize="off" spellcheck="false">' + esc(prefill || '') + '</textarea>' +
      '<div class="acRow"><button class="pill" id="acPasteBtn">\uD83D\uDCCB Paste</button><label class="pill acFileBtn">\uD83D\uDCC2 Open save file<input type="file" id="acFileIn" accept=".txt,.grok-save,text/plain" hidden></label></div><div id="acErr" class="acErr"></div></div>' +
      '<div id="acPrev"></div>',
      '<button class="pill" id="acBack">\u2190 Back</button><button class="bigBtn" id="acCheck">\uD83D\uDD0D CHECK CODE</button>');
    back('acBack');
    $('acCheck').onclick = check;
    $('acPasteBtn').onclick = function () { if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) { $('acPaste').value = t; check(); }, function () { toast('Long-press the box and choose Paste.'); }); else toast('Long-press the box and choose Paste.'); };
    $('acFileIn').onchange = function (e) { var f = e.target.files && e.target.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { $('acPaste').value = String(rd.result || ''); check(); }; rd.readAsText(f); };
    if (prefill) check();
  }
  function check() {
    var code = $('acPaste').value; $('acErr').textContent = ''; $('acPrev').innerHTML = '';
    if (!code.trim()) { $('acErr').textContent = 'Paste a code first!'; return; }
    AC.decode(code).then(function (snap) {
      var inc = AC.summary(snap.keys), cur = AC.summary(AC.keys(false)), same = snap.dev && snap.dev.id === AC.device().id;
      mood('happy', 3); snd('click');
      $('acPrev').innerHTML = '<div class="acCard acIncoming"><div class="acLbl">FOUND A SAVE \u00b7 account #' + esc(snap.acct && snap.acct.id) + ' (' + esc(snap.acct && snap.acct.name) + ')</div>' +
        '<div class="acNote">From <b>' + esc(snap.dev && snap.dev.name || 'another device') + '</b>, made ' + esc(when(snap.t)) + ' (' + ago(snap.t) + ')' + (same ? ' \u00b7 <b>this same device</b>' : '') + '</div>' + statsHtml(inc) + '</div>' +
        '<div class="acCard acCurrent"><div class="acLbl">YOUR SAVE ON THIS DEVICE NOW (gets backed up)</div><div class="acStats"><span>\uD83C\uDF9F\uFE0F ' + cur.tickets.toLocaleString() + '</span><span>\uD83C\uDF81 ' + cur.prizes + '</span><span>\uD83C\uDFC5 ' + cur.badges + '</span><span>\uD83E\uDDE9 ' + cur.dlc + '</span><span>\uD83C\uDFAE ' + cur.games.length + (cur.games.length === 1 ? ' game' : ' games') + '</span></div></div>';
      var f = $('arFoot'); f.innerHTML = '<button class="pill" id="acBack">\u2190 Back</button><button class="bigBtn" id="acLoad">\uD83D\uDCE5 LOAD THIS SAVE</button>'; back('acBack');
      $('acLoad').onclick = function () { confirmLoad(snap, inc); };
      var p = $('acPrev'); if (p && p.scrollIntoView) p.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch(function (e) { mood('shock', 1.6); snd('bad'); $('acErr').textContent = ERR[e && e.message] || ERR.format; });
  }
  function confirmLoad(snap, inc) {
    var a = AC.get(), extra = '';
    try { var acc = JSON.parse(snap.keys['grokArcade.account'] || 'null'); var devs = (acc && acc.sync && acc.sync.devices) || []; var mine = AC.device().id; if (devs.length >= AC.MAX_DEVICES && !devs.some(function (d) { return d.id === mine; })) extra = '<div class="acWarn">\uD83D\uDCF1 That account already lists ' + devs.length + ' devices (max ' + AC.MAX_DEVICES + '). It still loads; unlink an old device at my desk afterwards. (Premium would allow 4. Premium does not exist.)</div>'; } catch (e) {}
    show('Load Save', say('Big moment! I\u2019ll put your current save in the backup drawer, then load the new one and restart the arcade. If you change your mind, come back and press RESTORE BACKUP.') + extra +
      '<div class="acCard"><div class="acLbl">REPLACE THIS DEVICE\u2019S SAVE?</div><div class="acNote">This replaces the save for the Arcade <b>and every Grok game</b> on this device with the one from <b>' + esc(snap.dev && snap.dev.name || 'the other device') + '</b> (' + inc.tickets.toLocaleString() + ' tickets, ' + inc.prizes + ' prizes, ' + inc.games.length + (inc.games.length === 1 ? ' game).' : ' games).') + (a ? ' Your current save (account #' + esc(a.id) + ') goes into the backup.' : ' Your current save goes into the backup.') + '</div></div>',
      '<button class="pill" id="acNo">Cancel</button><button class="bigBtn" id="acYes">\u2705 YES, LOAD IT</button>');
    $('acNo').onclick = function () { home('No problem! I\u2019ll be here. Always. Watching. In a friendly way!'); };
    $('acYes').onclick = function () {
      try { sessionStorage.setItem('grokArcade.acDone', JSON.stringify({ w: 'load', from: snap.dev && snap.dev.name || '' })); } catch (e) {}
      try { AC.importSnap(snap); } catch (e) { $('acYes').disabled = true; toast(ERR[e && e.message] || 'Couldn\u2019t load: ' + (e && e.message)); return; }
      $('acYes').disabled = true; $('acNo').disabled = true; mood('happy', 4); wave(4); snd('win');
      $('arBody').insertAdjacentHTML('afterbegin', '<div class="acOk">\u2705 Loaded! Restarting the arcade\u2026</div>');
    };
  }

  /* ---------- RESTORE BACKUP ---------- */
  function restore() {
    var bak = AC.backup(); if (!bak) return home(); var sm = AC.summary(bak.keys); snd('click');
    show('Restore Backup', say('The backup drawer! I keep EVERYTHING. Restoring swaps it with your current save, so you can always swap back.') +
      '<div class="acCard"><div class="acLbl">BACKUP FROM ' + esc(when(bak.t)).toUpperCase() + '</div><div class="acNote">' + esc(bak.why || '') + '</div>' + statsHtml(sm) + '</div>',
      '<button class="pill" id="acBack">\u2190 Back</button><button class="bigBtn" id="acRes">\u21A9\uFE0F RESTORE IT</button>');
    back('acBack');
    $('acRes').onclick = function () { try { sessionStorage.setItem('grokArcade.acDone', JSON.stringify({ w: 'restore' })); } catch (e) {} try { AC.restore(); } catch (e) { toast('Couldn\u2019t restore: ' + (e && e.message)); return; } $('acRes').disabled = true; snd('win'); $('arBody').insertAdjacentHTML('afterbegin', '<div class="acOk">\u2705 Backup restored! Restarting the arcade\u2026</div>'); };
  }

  /* ---------- DEVICES ---------- */
  function devices() {
    var L = AC.devices(), me = AC.device().id; snd('click');
    show('Devices', say('Devices on your account! Max ' + AC.MAX_DEVICES + '. A device joins when it loads your transfer code. Live Sync will keep them in step later. (Premium: unlimited devices. Premium: imaginary.)') +
      '<div class="acCard">' + (L.length ? L.map(function (d) { return '<div class="acDev"><span>\uD83D\uDCF1 <b>' + esc(d.name) + '</b>' + (d.id === me ? ' <em>this device</em>' : '') + '<small>seen ' + esc(ago(d.seen || 0)) + '</small></span>' + (d.id === me ? '' : '<button class="pill acSm" data-un="' + esc(d.id) + '">Unlink</button>') + '</div>'; }).join('') : '<div class="acNote">Just this one so far.</div>') +
      '<div class="acNote">' + L.length + ' of ' + AC.MAX_DEVICES + ' used. Friends sharing comes with Live Sync.</div></div>' + SYNC_SIGN,
      '<button class="pill" id="acBack">\u2190 Back</button>');
    back('acBack');
    Array.prototype.forEach.call(document.querySelectorAll('#arBody [data-un]'), function (b) { b.onclick = function () { AC.unlink(b.getAttribute('data-un')); devices(); }; });
  }

  /* ---------- after a reload: say so; a transfer LINK opens Load Save ---------- */
  function whenStarted(fn) { var n = 0, iv = setInterval(function () { var t = $('title'); if ((t && t.classList.contains('hidden') && GA.AreasUI && GA.Hub && GA.Hub.state) || ++n > 600) { clearInterval(iv); if (n <= 600) setTimeout(fn, 600); } }, 250); }
  try {
    var done = JSON.parse(sessionStorage.getItem('grokArcade.acDone') || 'null');
    if (done) { sessionStorage.removeItem('grokArcade.acDone'); whenStarted(function () { toast(done.w === 'restore' ? '\u21A9\uFE0F Backup restored! Bob kept the other save in the backup drawer.' : '\uD83D\uDCE5 Save loaded' + (done.from ? ' from ' + done.from : '') + '! Your old save is in Bob\u2019s backup drawer.', 6000); }); }
  } catch (e) {}
  if (AC && AC.pendingLink) whenStarted(function () { load(AC.pendingLink); });
  UI.home = home; UI.transfer = transfer; UI.load = load; UI.restore = restore; UI.devices = devices;
})();
