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
    'LIVE SYNC IS HERE! I asked Luna for a save server and she actually found one. It came with a cheese. I ate the cheese.',
    'Psst. Gold Membership. It comes with a gold sticker. The sticker is imaginary. Interested? ...Interested now?',
    'Max 3 devices per account! Unless you buy Premium. Which you can\u2019t. Because I haven\u2019t invented it. YET.',
    'Lili does Quality. I do Accounts. Mom says we\u2019re both her favorite. I\u2019m a LITTLE more favorite.'
  ];
  var line = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var BOB_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="20" cy="9" r="6" fill="#9ca3af"/><circle cx="32" cy="6" r="6.5" fill="#d6a26b"/><circle cx="44" cy="9" r="6" fill="#fff"/><ellipse cx="32" cy="34" rx="22" ry="23" fill="#fbbf24"/><rect x="11" y="27" width="42" height="15" rx="7" fill="#1c0f02"/><rect x="18" y="31" width="9" height="8" rx="2" fill="#fbbf24"/><rect x="37" y="31" width="9" height="8" rx="2" fill="#fbbf24"/><path d="M16 25 L28 21 M36 21 L48 25" stroke="#7c2d12" stroke-width="3" stroke-linecap="round"/><path d="M10 24 Q32 -2 54 24" stroke="#0f172a" stroke-width="3.5" fill="none"/><rect x="5" y="28" width="7" height="12" rx="3" fill="#0f172a"/><rect x="52" y="28" width="7" height="12" rx="3" fill="#0f172a"/><path d="M9 40 Q12 50 24 49" stroke="#0f172a" stroke-width="2.5" fill="none"/><circle cx="25" cy="49" r="2.5" fill="#dc2626"/></svg>';
  function say(text) { return '<div class="acBob"><div class="acFace">' + BOB_SVG + '</div><div class="acSay"><b>BOB</b> ' + text + '</div></div>'; }
  var SY = function () { return GA.Sync; };
  function syncSign() {
    var y = SY(); if (!y) return '';
    if (!y.on()) return '<div class="acSync"><b>\uD83D\uDD04 LIVE SYNC IS HERE!</b><span>One 6-digit ID keeps up to <b>3 devices</b> in step by itself, and friends can peek at your stats. Tap <b>LIVE SYNC</b>.</span></div>';
    var st = y.status(); return '<div class="acSync on"><b>\uD83D\uDD04 LIVE SYNC: ON \u00b7 ' + statusWord(st) + '</b><span>ID <b>' + fmtId(st.id) + '</b> \u00b7 ' + (st.devices.length || 1) + '/' + AC.MAX_DEVICES + ' devices' + (st.share ? ' \u00b7 friends can peek' : '') + '</span></div>';
  }
  function statusWord(st) { return { ok: '\u2705 synced ' + (st.last ? ago(st.last) : ''), syncing: '\u23F3 syncing\u2026', starting: '\u23F3 connecting\u2026', offline: '\uD83D\uDCF4 offline (saved here)', rules: '\u26A0\uFE0F server locked', load: '\uD83D\uDCF4 can\u2019t reach server', error: '\u26A0\uFE0F hiccup', big: '\u26A0\uFE0F save too big', space: '\u26A0\uFE0F device full', unlinked: 'unlinked', off: 'off' }[st.mode] || st.mode; }

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
        '<div class="acCard"><div class="acLbl">YOUR NAME</div><input id="acName" class="acIn" maxlength="16" placeholder="Player" value="' + esc(guess()) + '"><div class="acNote">Bob gives you a 6-digit account ID. Your saves stay on this device until you transfer them.</div></div>' + syncSign(),
        (AC.backup() ? '<button class="pill" id="acBak">\u21A9\uFE0F Backup</button>' : '') + '<button class="pill" id="acHave">\uD83D\uDCE5 Load a save</button><button class="pill" id="acHaveId">\uD83D\uDD17 I have an ID</button><button class="bigBtn" id="acMake">\u270D\uFE0F SIGN ME UP</button>');
      $('acHave').onclick = function () { load(); }; $('acHaveId').onclick = function () { AC.create(AC.clean($('acName').value) || 'Player'); refresh3d(); link(); }; if ($('acBak')) $('acBak').onclick = restore;
      $('acMake').onclick = function () { var n = AC.clean($('acName').value) || 'Player'; AC.create(n); snd('win'); refresh3d(); toast('\uD83C\uDF89 Account made! Bob says: \u201cWelcome, ' + n + '! Ask me about Premium!\u201d'); home('Done! You\u2019re official! Here\u2019s your account ID. Frame it. Or don\u2019t. (Frame it.)'); };
      return;
    }
    var bak = AC.backup(), n = SY() && SY().on() ? Math.max(1, SY().devices().length) : AC.devices().length, sm = AC.summary();
    show('Ratita Industries \u00b7 Accounts',
      say(greet || line(HELLO)) +
      '<div class="acCard acAcct"><div class="acLbl">ACCOUNT ID</div><div class="acId">' + fmtId(a.id) + '</div>' +
      '<div class="acNameRow"><span id="acNm">' + esc(a.name) + '</span><button class="pill acSm" id="acRen">\u270F\uFE0F Rename</button></div>' +
      '<div class="acStats"><span>\uD83C\uDF9F\uFE0F ' + sm.tickets.toLocaleString() + '</span><span>\uD83C\uDF81 ' + sm.prizes + (sm.prizes === 1 ? ' prize' : ' prizes') + '</span><span>\uD83C\uDFC5 ' + sm.badges + ' badges</span><span>\uD83E\uDDE9 ' + sm.dlc + ' DLC</span><span>\uD83C\uDFAE ' + sm.games.length + (sm.games.length === 1 ? ' game' : ' games') + '</span></div>' +
      '<div class="acNote">' + (SY() && SY().on() ? 'Live Sync is <b>ON</b>: this ID keeps up to 3 devices in step by itself.' : 'Turn on <b>Live Sync</b> to use this ID on up to 3 devices. No internet on the other device? <b>Transfer Save</b> gives you a code that carries the whole save.') + '</div></div>' +
      '<button class="acBig acLive" id="acLive"><b>\uD83D\uDD04 LIVE SYNC' + (SY() && SY().on() ? ': ON' : '') + '</b><span>' + (SY() && SY().on() ? 'devices, friends, sync now' : 'one ID \u00b7 up to 3 devices \u00b7 share with friends') + '</span></button>' +
      '<div class="acGrid"><button class="acBig" id="acOut"><b>\uD83D\uDCE4 TRANSFER SAVE</b><span>make a code / QR for your other device</span></button><button class="acBig" id="acIn"><b>\uD83D\uDCE5 LOAD SAVE</b><span>paste a code from another device</span></button>' +
      '<button class="acBig sm" id="acBak"' + (bak ? '' : ' disabled') + '><b>\u21A9\uFE0F RESTORE BACKUP</b><span>' + (bak ? 'from ' + when(bak.t) : 'no backup yet') + '</span></button><button class="acBig sm" id="acDev"><b>\uD83D\uDCF1 DEVICES ' + n + '/' + AC.MAX_DEVICES + '</b><span>' + (SY() && SY().on() ? 'linked by Live Sync' : 'linked by transfer') + '</span></button></div>' +
      syncSign() + '<button class="acPrem" id="acPrem">\u2B50 Upgrade to PREMIUM PLATINUM PLUS</button>',
      '');
    $('acLive').onclick = function () { live(); };
    $('acOut').onclick = transfer; $('acIn').onclick = function () { load(); }; $('acDev').onclick = devices; if (bak) $('acBak').onclick = restore;
    $('acRen').onclick = function () { var nm = prompt('New name (max 16):', a.name); if (nm == null) return; AC.rename(nm); refresh3d(); if (SY() && SY().on()) SY().updateCard(true); home('Ooh, ' + esc(AC.get().name) + '! Classy. Very Premium-sounding. Just saying.'); };
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
        '<div class="acNote">On the other device: Grok Arcade \u2192 Bob\u2019s Account Desk \u2192 <b>Load Save</b> \u2192 paste (or open the file / the link). Want it automatic? Use <b>Live Sync</b> with your 6-digit ID instead.</div></div>',
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
  var ERR = { six: 'That\u2019s a 6-digit Live Sync ID! Go Back \u2192 LIVE SYNC \u2192 LINK TO MY ACCOUNT and type it there. This box wants the long TRANSFER CODE (it starts with GAS1.).', format: 'That doesn\u2019t look like a transfer code. It should start with GAS1. (or be a transfer link).', damaged: 'This code got cut off or changed somewhere. Copy the WHOLE code again (it\u2019s long!).', browser: 'This browser is too old to unpack the code. Try an up-to-date Chrome, Safari, Edge or Firefox.', newer: 'This code comes from a newer arcade. Refresh this page to update, then try again.', space: 'This device is out of save space, so I can\u2019t make a backup. Nothing was changed.' };
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
    if (SY() && SY().on()) return syncDevices();
    var L = AC.devices(), me = AC.device().id; snd('click');
    show('Devices', say('Devices on your account! Max ' + AC.MAX_DEVICES + '. A device joins when it loads your transfer code. Turn on Live Sync to keep them in step by themselves. (Premium: unlimited devices. Premium: imaginary.)') +
      '<div class="acCard">' + (L.length ? L.map(function (d) { return '<div class="acDev"><span>\uD83D\uDCF1 <b>' + esc(d.name) + '</b>' + (d.id === me ? ' <em>this device</em>' : '') + '<small>seen ' + esc(ago(d.seen || 0)) + '</small></span>' + (d.id === me ? '' : '<button class="pill acSm" data-un="' + esc(d.id) + '">Unlink</button>') + '</div>'; }).join('') : '<div class="acNote">Just this one so far.</div>') +
      '<div class="acNote">' + L.length + ' of ' + AC.MAX_DEVICES + ' used.</div></div>' + syncSign(),
      '<button class="pill" id="acBack">\u2190 Back</button>');
    back('acBack');
    Array.prototype.forEach.call(document.querySelectorAll('#arBody [data-un]'), function (b) { b.onclick = function () { AC.unlink(b.getAttribute('data-un')); devices(); }; });
  }

  /* ---------- LIVE SYNC screens ---------- */
  var SYNC_ERR = {
    rules: 'The save server\u2019s door is LOCKED (its security rules said no). Your save is safe right here on this device. A grown-up needs to paste the Live Sync rules in Firebase.',
    offline: 'No internet! Your save is safe on this device and syncs by itself when you\u2019re back online. I\u2019ll keep an eye out. I\u2019m great at waiting. (I\u2019m terrible at waiting.)',
    load: 'I can\u2019t reach the save server right now. Your save is safe here. Try again in a bit!',
    big: 'Whoa, your save is too BIG for Live Sync (over 1 MB). Use Transfer Save instead. Big save = big gamer. Respect.',
    space: 'This device is out of save space, so I can\u2019t make a backup first. I changed NOTHING. Free up some space and try again.',
    noid: 'Hmm, nobody has that ID. Check the 6 digits on your other device (Bob\u2019s desk \u2192 Live Sync).',
    full: 'That account already has 3 devices! That\u2019s the max. Unlink an old one on a linked device first. (Premium would allow 4. Premium does not exist.)',
    denied: 'The other device said NO. Rude! ...Or careful. Careful is good. Ask them to tap YES.',
    timeout: 'Nobody answered for 5 minutes. Open Bob\u2019s desk on your other device and try again!',
    bad: 'Something got scrambled in the link. Let\u2019s try that again.',
    already: 'This device is already on Live Sync. Leave Live Sync first to join a different ID.',
    error: 'The save server hiccuped. Your save is safe here. Try again!'
  };
  var unsubLive = null;
  function liveSub(fn) { if (unsubLive) unsubLive(); unsubLive = SY().subscribe(function (st) { if (!AR().isOpen() || AR().kind() !== 'account') { if (unsubLive) { unsubLive(); unsubLive = null; } return; } fn(st); }); }
  function busy(btn, on) { var b = $(btn); if (b) { b.disabled = on; if (on) b.dataset.t = b.innerHTML, b.innerHTML = '\u23F3 one sec\u2026'; else if (b.dataset.t) b.innerHTML = b.dataset.t; } }
  function live(greet) {
    var y = SY(); if (!y) return home(); snd('click');
    if (!AC.get()) AC.create(guess() || 'Player');
    if (!y.on()) {
      var st0 = y.state(), unl = st0.why === 'unlinked';
      show('Live Sync', say(greet || (unl ? 'Your other device UNLINKED this one. Don\u2019t worry, your save stayed right here. Want to link again or start a new ID?' : 'LIVE SYNC! Your saves hop between your devices BY THEMSELVES. Like magic. It\u2019s not magic, it\u2019s a save server. Luna finally gave me one. (It smells like cheese.)')) +
        '<div class="acCard"><div class="acLbl">HOW IT WORKS</div><div class="acSteps"><div><i>1</i><span>Turn it on here: you get a <b>6-digit ID</b>.</span></div><div><i>2</i><span>On your other device: Bob\u2019s desk \u2192 Live Sync \u2192 <b>Link</b> \u2192 type the ID.</span></div><div><i>3</i><span>Tap <b>YES</b> on this device. Done! Up to <b>3 devices</b>.</span></div></div>' +
        '<div class="acNote">Your tickets, prizes, DLC and every Grok game\u2019s progress sync both ways. The newest change wins, an empty save never wipes progress, and I keep a backup before every update.</div></div>' +
        (y.COLL !== 'grokSync' ? '<div class="acWarn">\uD83E\uDDEA Time Jumper preview: Live Sync here uses the test server and this preview\u2019s own save. Your real save is never touched.</div>' : '') +
        '<div id="acErr" class="acErr"></div>' +
        '<div class="acGrid"><button class="acBig" id="acOnBtn"><b>\u2728 TURN ON</b><span>get my 6-digit ID</span></button><button class="acBig" id="acLinkBtn"><b>\uD83D\uDD17 LINK</b><span>I already have an ID</span></button></div>' +
        '<button class="acBig sm acWide" id="acPeek"><b>\uD83D\uDC40 PEEK AT A FRIEND</b><span>see a friend\u2019s stats with their ID (look, don\u2019t touch)</span></button>',
        '<button class="pill" id="acBack">\u2190 Back</button>');
      back('acBack');
      $('acLinkBtn').onclick = function () { link(); };
      $('acPeek').onclick = function () { peek(); };
      $('acOnBtn').onclick = function () {
        busy('acOnBtn', true); $('acErr').textContent = ''; mood('happy', 3);
        y.turnOn().then(function (id) { snd('win'); refresh3d(); live('DING DING! You\u2019re on Live Sync! Your ID is ' + id.slice(0, 3) + ' ' + id.slice(3) + '. Type it on your other device. I\u2019ll ask you here before ANY device gets in.'); })
          .catch(function (e) { busy('acOnBtn', false); mood('shock', 1.6); snd('bad'); $('acErr').textContent = SYNC_ERR[y.errKind(e)] || SYNC_ERR.error; });
      };
      return;
    }
    var st = y.status(), devs = st.devices.length ? st.devices : [{ id: AC.device().id, name: AC.device().name, seen: Date.now() }], meId = AC.device().id;
    var bad = { rules: 1, offline: 1, load: 1, big: 1, space: 1, error: 1 }[st.mode];
    show('Live Sync', say(greet || line(['Live Sync is humming along! Every ticket you win hops to your other devices. I watch it all day. It\u2019s my favorite show.', 'Synced and sparkly! Premium members get the SAME sync, but with a little trumpet sound. (Premium doesn\u2019t exist.)', 'Your saves are in step! Lili checks quality, I check SYNC. We\u2019re basically a team. Don\u2019t tell her I said that.'])) +
      reqHtml(st.pending) +
      '<div class="acCard acAcct"><div class="acLbl">LIVE SYNC ID</div><div class="acId">' + fmtId(st.id) + '</div>' +
      '<div class="acStatus s-' + esc(st.mode) + '">' + statusWord(st) + '</div>' + (bad ? '<div class="acNote">' + (SYNC_ERR[st.mode] || '') + '</div>' : '') +
      '<div class="acNote">Type this ID at Bob\u2019s desk on your other device \u2192 Live Sync \u2192 <b>Link</b>. You\u2019ll get a YES / NO question here.</div></div>' +
      '<div class="acCard"><div class="acLbl">LINKED DEVICES \u00b7 ' + devs.length + ' OF ' + AC.MAX_DEVICES + '</div>' + devs.map(function (d) { return '<div class="acDev"><span>\uD83D\uDCF1 <b>' + esc(d.name) + '</b>' + (d.id === meId ? ' <em>this device</em>' : '') + '<small>seen ' + esc(ago(d.seen || 0)) + '</small></span>' + (d.id === meId ? '' : '<button class="pill acSm" data-un="' + esc(d.id) + '">Unlink</button>') + '</div>'; }).join('') +
      (devs.length < AC.MAX_DEVICES ? '<div class="acNote">' + (AC.MAX_DEVICES - devs.length) + ' free ' + (AC.MAX_DEVICES - devs.length === 1 ? 'spot' : 'spots') + '.</div>' : '<div class="acNote">Full! Unlink one to add another.</div>') + '</div>' +
      '<div class="acCard"><label class="acToggle"><input type="checkbox" id="acShareT"' + (st.share ? ' checked' : '') + '><span class="acSw"></span><span><b>\uD83E\uDD1D Share with friends</b><small>Friends who know your ID can SEE your tickets, prizes, badges and games. They can\u2019t change anything.</small></span></label></div>' +
      '<div class="acGrid"><button class="acBig sm" id="acNow"><b>\uD83D\uDD04 SYNC NOW</b><span>' + (st.last ? 'last ' + ago(st.last) : 'not yet') + '</span></button><button class="acBig sm" id="acPeek"><b>\uD83D\uDC40 PEEK AT A FRIEND</b><span>compare with their ID</span></button>' +
      '<button class="acBig sm" id="acUndo"' + (y.backup() ? '' : ' disabled') + '><b>\u21A9\uFE0F UNDO LAST SYNC</b><span>' + (y.backup() ? 'backup from ' + esc(when(y.backup().t)) : 'no sync backup yet') + '</span></button><button class="acBig sm acLeave" id="acLeave"><b>\uD83D\uDEAA LEAVE LIVE SYNC</b><span>this device only, save stays</span></button></div>',
      '<button class="pill" id="acBack">\u2190 Back</button>');
    back('acBack'); wireReq();
    $('acNow').onclick = function () { busy('acNow', true); y.syncNow().then(function (ok) { snd(ok ? 'win' : 'bad'); live(ok ? 'Synced! Fresh as a cheese. A fresh one. Not Luna\u2019s.' : (SYNC_ERR[y.status().mode] || SYNC_ERR.error)); }); };
    $('acPeek').onclick = function () { peek(); };
    $('acShareT').onchange = function () { var on = this.checked; y.setShare(on).then(function () { toast(on ? '\uD83E\uDD1D Friends can peek at your stats with your ID.' : '\uD83D\uDD12 Your stats are private now.'); }).catch(function () { toast('Couldn\u2019t reach the server. Try again!'); }); };
    $('acLeave').onclick = function () { leave(); };
    if (y.backup()) $('acUndo').onclick = undoSync;
    Array.prototype.forEach.call(document.querySelectorAll('#arBody [data-un]'), function (b) { b.onclick = function () { var id = b.getAttribute('data-un'), nm = (devs.filter(function (d) { return d.id === id; })[0] || {}).name; if (!confirm('Unlink ' + nm + '? It keeps its save but stops syncing.')) return; b.disabled = true; y.unlink(id).then(function () { snd('click'); live('Unlinked ' + esc(nm) + '! It keeps its save, it just stops syncing. Bye bye, ' + esc(nm) + '!'); }).catch(function (e) { b.disabled = false; toast(SYNC_ERR[y.errKind(e)] || SYNC_ERR.error); }); }; });
    liveSub(function (s2) { var el = document.querySelector('#arBody .acStatus'); if (el) { el.className = 'acStatus s-' + s2.mode; el.innerHTML = statusWord(s2); } if (s2.pending.length && !document.querySelector('#arBody .acReqCard')) live(); if (s2.mode === 'unlinked') live(); });
  }
  function syncDevices() { live(); }
  function reqHtml(L) {
    if (!L || !L.length) return '';
    return L.map(function (r) { return '<div class="acCard acReqCard"><div class="acLbl">\uD83D\uDD14 A DEVICE WANTS TO JOIN</div><div class="acReqName">\uD83D\uDCF1 ' + esc(r.name) + '</div><div class="acNote">Only say YES if it\u2019s YOUR device and it shows this match code:</div><div class="acMatch">' + esc(r.match || '') + '</div><div class="acRow"><button class="pill" data-rno="' + esc(r.rid) + '">\u274C No</button><button class="bigBtn" data-ryes="' + esc(r.rid) + '">\u2705 YES, LET IT IN</button></div></div>'; }).join('');
  }
  function wireReq(after) {
    var y = SY();
    function find(id) { return y.status().pending.filter(function (r) { return r.rid === id; })[0]; }
    Array.prototype.forEach.call(document.querySelectorAll('[data-ryes],[data-rno]'), function (b) {
      b.onclick = function () {
        var yes = b.hasAttribute('data-ryes'), r = find(b.getAttribute(yes ? 'data-ryes' : 'data-rno')); if (!r) return; b.disabled = true;
        y.answer(r, yes).then(function (res) { snd(res === 'ok' ? 'win' : 'click'); var m = res === 'ok' ? 'Welcome aboard, ' + esc(r.name) + '! It\u2019s syncing now.' : res === 'full' ? 'We\u2019re FULL! 3 devices max. Unlink one first.' : 'Door closed! Nobody gets in without your YES.'; if (after) after(m); else live(m); })
          .catch(function (e) { toast(SYNC_ERR[y.errKind(e)] || SYNC_ERR.error); if (after) after(); else live(); });
      };
    });
  }
  /* request pop-up while walking around the arcade (never during a bonus game) */
  function popReq(L) {
    if (AR().isOpen && AR().isOpen() && AR().kind() === 'account') { if (!document.querySelector('#arBody .acReqCard')) live(); return; }
    if (GA.MG && GA.MG.isOpen && GA.MG.isOpen()) return; // never during a bonus game (Live Sync asks again every few seconds)
    if (AR().isOpen && AR().isOpen()) return;
    var old = $('acReqPop'); if (old && old.getAttribute('data-rid') === L[0].rid) return; if (old) old.remove(); if (!L.length) return;
    var d = document.createElement('div'); d.id = 'acReqPop'; d.className = 'acReqPop'; d.setAttribute('data-rid', L[0].rid);
    d.innerHTML = say('Psst! A device wants to join your Live Sync account!') + reqHtml(L.slice(0, 1));
    document.body.appendChild(d); snd('talk');
    wireReq(function (m) { d.remove(); if (m) toast(m.replace(/<[^>]+>/g, ''), 4000); });
  }
  function link() {
    var y = SY(); snd('click');
    show('Link to my account', say('Ooh, you have an ID already? Type it in! Then your OTHER device has to say YES. Security! I take it VERY seriously. I have a badge. I made the badge.') +
      '<div class="acCard"><div class="acLbl">LIVE SYNC ID (6 DIGITS)</div><input id="acLinkId" class="acIn acIdIn" inputmode="numeric" pattern="[0-9]*" maxlength="7" placeholder="123 456" autocomplete="off"><div id="acErr" class="acErr"></div>' +
      '<div class="acNote">This device\u2019s save gets <b>backed up</b> first, then it gets the account\u2019s save. Anything only this device has gets added, not deleted.</div></div>',
      '<button class="pill" id="acBack">\u2190 Back</button><button class="bigBtn" id="acGo">\uD83D\uDD17 LINK</button>');
    $('acBack').onclick = function () { live(); };
    var inp = $('acLinkId'); setTimeout(function () { try { inp.focus(); } catch (e) {} }, 100);
    inp.onkeydown = function (e) { if (e.key === 'Enter') $('acGo').click(); };
    $('acGo').onclick = function () {
      var id = inp.value.replace(/\D/g, ''); $('acErr').textContent = '';
      if (!/^[1-9]\d{5}$/.test(id)) { $('acErr').textContent = 'That needs to be 6 digits, like 482 913.'; snd('bad'); return; }
      busy('acGo', true);
      var ctl = y.link(id, function (o) {
        if (o.phase === 'wait') waitScreen(id, o, ctl);
        else if (o.phase === 'linked') { snd('win'); mood('happy', 4); wave(4); show('Linked!', say('YOU\u2019RE IN! Getting the account\u2019s save now. If the arcade restarts, that\u2019s me moving in your stuff. Carefully. Mostly.') + '<div class="acOk">\u2705 Linked to ' + fmtId(id) + '! Syncing\u2026</div>', ''); setTimeout(function () { if (AR().isOpen() && AR().kind() === 'account') live('Linked and synced! Welcome to the family. The account family. I\u2019m the fun uncle.'); }, 3500); }
        else if (o.phase === 'error') { if (!$('acLinkId')) link(); busy('acGo', false); var e2 = $('acErr'); if (e2) e2.textContent = SYNC_ERR[o.why] || SYNC_ERR.error; mood('shock', 1.6); snd('bad'); }
      });
    };
  }
  function waitScreen(id, o, ctl) {
    show('Link to my account', say('Knock knock! I asked your other device. Now go to Bob\u2019s desk over THERE and tap YES. I\u2019ll wait. Patiently. Tapping my foot. Patiently.') +
      '<div class="acCard acAcct"><div class="acLbl">ASKING ACCOUNT ' + fmtId(id) + (o.card && o.card.name ? ' (' + esc(o.card.name) + ')' : '') + '</div><div class="acNote">Your other device shows a pop-up. Check that it shows the SAME match code:</div><div class="acMatch big">' + esc(o.match) + '</div><div class="acWaitDots"><span></span><span></span><span></span></div></div>',
      '<button class="pill" id="acCancel">Cancel</button>');
    $('acCancel').onclick = function () { ctl.cancel(); live('Cancelled! No harm done. I deleted the knock.'); };
  }
  function peek() {
    var y = SY(); snd('click');
    show('Peek at a friend', say('Spy mode! Type a friend\u2019s ID to see their stats. Look, don\u2019t touch: nobody can change anyone else\u2019s save. Only if THEY turned on sharing, though. Manners!') +
      '<div class="acCard"><div class="acLbl">FRIEND\u2019S ID</div><input id="acPeekId" class="acIn acIdIn" inputmode="numeric" pattern="[0-9]*" maxlength="7" placeholder="123 456" autocomplete="off"><div id="acErr" class="acErr"></div></div><div id="acPeekOut"></div>',
      '<button class="pill" id="acBack">\u2190 Back</button><button class="bigBtn" id="acGo">\uD83D\uDC40 PEEK</button>');
    $('acBack').onclick = function () { live(); };
    $('acPeekId').onkeydown = function (e) { if (e.key === 'Enter') $('acGo').click(); };
    $('acGo').onclick = function () {
      var id = $('acPeekId').value.replace(/\D/g, ''); $('acErr').textContent = ''; $('acPeekOut').innerHTML = '';
      if (!/^[1-9]\d{5}$/.test(id)) { $('acErr').textContent = 'That needs to be 6 digits, like 482 913.'; return; }
      busy('acGo', true);
      y.peekCard(id).then(function (c) {
        busy('acGo', false);
        if (!c) { $('acErr').textContent = SYNC_ERR.noid; snd('bad'); return; }
        if (!c.share || !c.stats) { $('acPeekOut').innerHTML = '<div class="acCard"><div class="acLbl">' + fmtId(id) + ' \u00b7 ' + esc(c.name) + '</div><div class="acNote">\uD83D\uDD12 ' + esc(c.name) + ' keeps their stats private. Ask them to turn on <b>Share with friends</b> at my desk!</div></div>'; return; }
        var me = AC.summary(AC.keys(false)), f = c.stats, row = function (lbl, a, b) { var w = a > b ? 'me' : b > a ? 'fr' : ''; return '<tr><td>' + lbl + '</td><td class="' + (w === 'me' ? 'win' : '') + '">' + a.toLocaleString() + '</td><td class="' + (w === 'fr' ? 'win' : '') + '">' + (+b || 0).toLocaleString() + '</td></tr>'; };
        $('acPeekOut').innerHTML = '<div class="acCard acIncoming"><div class="acLbl">\uD83D\uDC40 ' + esc(c.name) + ' \u00b7 ' + fmtId(id) + ' \u00b7 updated ' + esc(ago(c.t)) + '</div>' +
          '<table class="acCmp"><tr><th></th><th>You</th><th>' + esc(c.name) + '</th></tr>' + row('\uD83C\uDF9F\uFE0F Tickets', me.tickets, f.tickets) + row('\uD83C\uDF81 Prizes', me.prizes, f.prizes) + row('\uD83C\uDFC5 Badges', me.badges, f.badges) + row('\uD83E\uDDE9 DLC', me.dlc, f.dlc) + row('\uD83C\uDFAE Games', me.games.length, (f.games || []).length) + '</table>' +
          '<div class="acGames">' + (f.games || []).map(function (g) { return '<span>' + esc(g) + '</span>'; }).join('') + '</div><div class="acNote">Read only. ' + esc(c.name) + '\u2019s save can only change on their own linked devices.</div></div>';
        snd('click'); var o2 = $('acPeekOut'); if (o2.scrollIntoView) o2.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }).catch(function (e) { busy('acGo', false); $('acErr').textContent = SYNC_ERR[y.errKind(e)] || SYNC_ERR.error; });
    };
  }
  function leave() {
    var y = SY(), devs = y.devices();
    show('Leave Live Sync', say('Leaving?! But we were having so much fun! ...Okay. Your save STAYS on this device. It just stops syncing. You can always link again.') +
      '<div class="acCard"><div class="acNote">' + (devs.length <= 1 ? 'This is the <b>last</b> device on ID ' + fmtId(y.state().id) + ', so the online copy gets deleted. Your save on this device stays.' : 'The other ' + (devs.length - 1 === 1 ? 'device keeps' : (devs.length - 1) + ' devices keep') + ' syncing without this one.') + '</div><div id="acErr" class="acErr"></div></div>',
      '<button class="pill" id="acBack">\u2190 Stay</button><button class="bigBtn" id="acGo">\uD83D\uDEAA LEAVE</button>');
    $('acBack').onclick = function () { live(); };
    $('acGo').onclick = function () { busy('acGo', true); y.leave().then(function () { snd('click'); live('You left Live Sync. Your save is still right here. Come back anytime! I\u2019ll be here. I\u2019m ALWAYS here.'); }).catch(function (e) { busy('acGo', false); $('acErr').textContent = SYNC_ERR[y.errKind(e)] || SYNC_ERR.error; }); };
  }
  function undoSync() {
    var y = SY(), b = y.backup(); if (!b) return live(); var sm = AC.summary(b.keys);
    show('Undo last sync', say('The sync backup drawer! This puts back your save from right before the last sync update. Then it syncs THAT to your other devices.') +
      '<div class="acCard"><div class="acLbl">SYNC BACKUP FROM ' + esc(when(b.t)).toUpperCase() + '</div><div class="acNote">' + esc(b.why || '') + '</div>' + statsHtml(sm) + '</div>',
      '<button class="pill" id="acBack">\u2190 Back</button><button class="bigBtn" id="acRes">\u21A9\uFE0F PUT IT BACK</button>');
    $('acBack').onclick = function () { live(); };
    $('acRes').onclick = function () { try { localStorage.setItem('grokArcade.account.backup', JSON.stringify(b)); sessionStorage.setItem('grokArcade.acDone', JSON.stringify({ w: 'restore' })); AC.restore(); } catch (e) { toast('Couldn\u2019t undo: ' + (e && e.message)); return; } $('acRes').disabled = true; snd('win'); $('arBody').insertAdjacentHTML('afterbegin', '<div class="acOk">\u2705 Put back! Restarting the arcade\u2026</div>'); };
  }

  /* ---------- after a reload: say so; a transfer LINK opens Load Save ---------- */
  function whenStarted(fn) { var n = 0, iv = setInterval(function () { var t = $('title'); if ((t && t.classList.contains('hidden') && GA.AreasUI && GA.Hub && GA.Hub.state) || ++n > 600) { clearInterval(iv); if (n <= 600) setTimeout(fn, 600); } }, 250); }
  try {
    var done = JSON.parse(sessionStorage.getItem('grokArcade.acDone') || 'null');
    if (done) { sessionStorage.removeItem('grokArcade.acDone'); whenStarted(function () { toast(done.w === 'sync' ? '\uD83D\uDD04 Live Sync: you have the newest save' + (done.from ? ' from ' + done.from : '') + '! Your old one is in Bob\u2019s sync backup.' : done.w === 'restore' ? '\u21A9\uFE0F Backup restored! Bob kept the other save in the backup drawer.' : '\uD83D\uDCE5 Save loaded' + (done.from ? ' from ' + done.from : '') + '! Your old save is in Bob\u2019s backup drawer.', 6000); }); }
  } catch (e) {}
  if (AC && AC.pendingLink) whenStarted(function () { load(AC.pendingLink); });
  try { if (sessionStorage.getItem('grokArcade.syncReopen')) { sessionStorage.removeItem('grokArcade.syncReopen'); whenStarted(function () { live('Synced! You\u2019ve got the newest save now. I moved everything in myself. You\u2019re welcome!'); }); } } catch (e) {}
  if (GA.Sync) GA.Sync.onRequest = popReq;
  UI.live = live; UI.link = link; UI.peek = peek;
  UI.home = home; UI.transfer = transfer; UI.load = load; UI.restore = restore; UI.devices = devices;
})();
