/* Grok Arcade - BOB'S ACCOUNT DESK: accounts + save transfer (issue #49).
   GitHub Pages is static, so there is NO save server yet. What works today ("code transfer now, live sync later"):
   - ACCOUNT: a 6-digit account ID + display name (grokArcade.account). The ID is the account's name tag for later; on its own it
     can't move a save, because nothing online knows what's behind it yet.
   - TRANSFER SAVE: every Grok game on lizethbran13-cmyk.github.io shares ONE localStorage (same origin), so one snapshot holds the
     Arcade (tickets, prizes, badges, DLC keys grokDLC.*) AND every game's progress. It's packed into a TRANSFER CODE:
        GAS1.<base64url(deflate-raw(JSON))>.<crc32>     (GAS0. = same thing without compression, for old browsers)
     JSON = { f:'GAS', v:1, acct:{id,name}, dev:{id,name}, t:<ms>, rev:<n>, keys:{ <localStorage key>: <string value>, ... } }
   - LOAD SAVE: checks the code, backs up the current save (grokArcade.account.backup), replaces the save, reloads. RESTORE BACKUP
     swaps the backup back in (and keeps the other one as the new backup, so it's always undoable).
   LIVE SYNC: js/account-sync.js (GA.Sync) syncs the SAME key set through Firebase Firestore with the 6-digit ID, max 3 devices,
   friend cards. Its own keys (grokArcade.sync*) are never put in a transfer code. */
(function () {
  'use strict';
  var AC = GA.Account = {};
  var K_ACC = 'grokArcade.account', K_BAK = 'grokArcade.account.backup', K_DEV = 'grokArcade.deviceId', K_REV = 'grokArcade.account.rev', K_LOG = 'grokArcade.account.log';
  AC.MAX_DEVICES = 3; AC.QR_MAX = 2300; // a phone camera can still read a QR this dense; bigger saves use copy / share / file / link
  AC.HOME = (function () { try { return location.origin + location.pathname; } catch (e) { return 'https://lizethbran13-cmyk.github.io/grok-arcade/'; } })(); // this page (the live arcade, or the Time Jumper preview while it's a beta)
  // never transferred: this device's own id + backups, multiplayer peer ids, data the arcade just re-downloads, dev/test switches
  var SKIP = [K_BAK, K_DEV, K_LOG, K_REV, 'grokArcade.pvIssues', 'grokArcade.pvJson', 'grokArcade.devUrls', 'grokNet.pid', 'grokNet.peer', 'grokNet.turn', 'grokArcade.sync', 'grokArcade.sync.meta', 'grokArcade.sync.backup', 'grokArcade.syncReopen'];
  var SKIP_PFX = ['grokPreview.']; // Time Jumper sandboxes (work-in-progress builds, not real saves)

  /* ---------- storage: in a Time Jumper preview the page's localStorage is sandboxed (grokPreview.<id>.*). Exports read the REAL
     save through a blank same-origin frame (read only); imports only ever write into this page's own storage. ---------- */
  var realLS = null;
  function sandboxed() { try { return /\/previews\//.test(location.pathname) && !/\[native code\]/.test(String(Storage.prototype.getItem)); } catch (e) { return false; } }
  AC.sandboxed = sandboxed;
  function real() {
    if (!sandboxed()) return localStorage;
    if (realLS) return realLS;
    try { var f = document.createElement('iframe'); f.style.display = 'none'; f.src = 'about:blank'; document.body.appendChild(f); realLS = f.contentWindow.localStorage; } catch (e) { realLS = null; }
    return realLS || localStorage;
  }
  function skip(k) { if (SKIP.indexOf(k) >= 0) return true; for (var i = 0; i < SKIP_PFX.length; i++) if (k.indexOf(SKIP_PFX[i]) === 0) return true; return false; }
  function snapshotFrom(st) { var o = {}, n = st.length; for (var i = 0; i < n; i++) { var k = st.key(i); if (k == null || skip(k)) continue; var v = st.getItem(k); if (v != null) o[k] = v; } return o; }
  AC.keys = function (fromReal) { return snapshotFrom(fromReal === false ? localStorage : real()); };

  /* ---------- account ---------- */
  function rnd(n) { var a = new Uint32Array(1); try { crypto.getRandomValues(a); return a[0] % n; } catch (e) { return Math.floor(Math.random() * n); } }
  function devName() { var u = navigator.userAgent || ''; var os = /iPhone/.test(u) ? 'iPhone' : /iPad/.test(u) ? 'iPad' : /Android/.test(u) ? (/Mobile/.test(u) ? 'Android phone' : 'Android tablet') : /Mac/.test(u) ? (navigator.maxTouchPoints > 1 ? 'iPad' : 'Mac') : /CrOS/.test(u) ? 'Chromebook' : /Win/.test(u) ? 'Windows PC' : /Linux/.test(u) ? 'Linux PC' : 'Device'; var br = /Edg\//.test(u) ? 'Edge' : /CriOS|Chrome\//.test(u) ? 'Chrome' : /FxiOS|Firefox\//.test(u) ? 'Firefox' : /Safari\//.test(u) ? 'Safari' : ''; return os + (br ? ' \u00b7 ' + br : ''); }
  function getJ(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function setJ(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  AC.device = function () { var d = getJ(K_DEV, null); if (!d || !d.id) { d = { id: 'd' + Date.now().toString(36) + rnd(1e6).toString(36), name: devName(), first: Date.now() }; setJ(K_DEV, d); } return d; };
  AC.get = function () { return getJ(K_ACC, null); };
  AC.has = function () { var a = AC.get(); return !!(a && a.id); };
  function guessName() { try { var n = localStorage.getItem('grokNet.name'); if (n && n.length < 24) return n.replace(/^"|"$/g, ''); } catch (e) {} return 'Player'; }
  AC.create = function (name) {
    var a = { v: 1, id: String(100000 + rnd(900000)), name: clean(name) || guessName(), created: Date.now(), plan: 'free',
      sync: { server: null, maxDevices: AC.MAX_DEVICES, devices: [], friends: [] } };
    a.sync.devices.push(devRec()); setJ(K_ACC, a); return a;
  };
  function clean(s) { return String(s || '').replace(/[<>&"]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16); }
  AC.clean = clean;
  AC.rename = function (name) { var a = AC.get() || AC.create(); var n = clean(name); if (!n) return a; a.name = n; setJ(K_ACC, a); return a; };
  function devRec() { var d = AC.device(); return { id: d.id, name: d.name, seen: Date.now() }; }
  function touchDevice(a) { a.sync = a.sync || { server: null, maxDevices: AC.MAX_DEVICES, devices: [], friends: [] }; var r = devRec(), L = a.sync.devices || (a.sync.devices = []), f = L.filter(function (x) { return x.id === r.id; })[0]; if (f) { f.seen = r.seen; f.name = r.name; } else L.push(r); return a; }
  AC.devices = function () { var a = AC.get(); return a && a.sync ? a.sync.devices || [] : []; };
  AC.unlink = function (id) { var a = AC.get(); if (!a || !a.sync) return; a.sync.devices = a.sync.devices.filter(function (x) { return x.id !== id; }); setJ(K_ACC, a); };

  /* ---------- encoding ---------- */
  var CRC = null;
  function crc32(s) { if (!CRC) { CRC = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } } var x = -1; for (var i = 0; i < s.length; i++) x = (x >>> 8) ^ CRC[(x ^ s.charCodeAt(i)) & 255]; return ((x ^ -1) >>> 0).toString(16); }
  function b64u(bytes) { var s = '', CH = 0x8000; for (var i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function pipe(bytes, Stream, fmt) { var cs = new Stream(fmt), w = cs.writable.getWriter(); w.write(bytes); w.close(); return new Response(cs.readable).arrayBuffer().then(function (ab) { return new Uint8Array(ab); }); }
  var canZip = typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
  AC.encode = function (obj) {
    var bytes = new TextEncoder().encode(JSON.stringify(obj));
    var p = canZip ? pipe(bytes, CompressionStream, 'deflate-raw').then(function (z) { return 'GAS1.' + b64u(z); }).catch(function () { return 'GAS0.' + b64u(bytes); }) : Promise.resolve('GAS0.' + b64u(bytes));
    return p.then(function (body) { return body + '.' + crc32(body); });
  };
  AC.decode = function (code) {
    return Promise.resolve().then(function () {
      code = String(code || '').trim();
      var m = /#gas=([^&\s]+)/.exec(code); if (m) code = decodeURIComponent(m[1]); // a pasted transfer LINK works too
      code = code.replace(/\s+/g, '');
      var p = /^(GAS[01])\.([A-Za-z0-9_-]+)\.([0-9a-f]{1,8})$/.exec(code);
      if (!p) throw new Error(/^\d{6}$/.test(code) ? 'six' : 'format');
      if (crc32(p[1] + '.' + p[2]) !== p[3]) throw new Error('damaged');
      var raw = unb64u(p[2]);
      if (p[1] === 'GAS1') { if (!canZip) throw new Error('browser'); return pipe(raw, DecompressionStream, 'deflate-raw'); }
      return raw;
    }).then(function (bytes) {
      var o = JSON.parse(new TextDecoder().decode(bytes));
      if (!o || o.f !== 'GAS' || typeof o.keys !== 'object') throw new Error('format');
      if (o.v > 1) throw new Error('newer');
      return o;
    });
  };

  /* ---------- snapshot / summary ---------- */
  AC.snapshot = function () {
    var a = AC.get() || AC.create(); touchDevice(a); setJ(K_ACC, a);
    var rev = (+getJ(K_REV, 0) || 0) + 1; setJ(K_REV, rev);
    var keys = AC.keys(); keys[K_ACC] = JSON.stringify(a);
    var d = AC.device();
    return { f: 'GAS', v: 1, acct: { id: a.id, name: a.name }, dev: { id: d.id, name: d.name }, t: Date.now(), rev: rev, keys: keys };
  };
  AC.exportCode = function () { var s = AC.snapshot(); return AC.encode(s).then(function (code) { log('export', s); return { code: code, snap: s, link: AC.HOME + '#gas=' + code, qr: code.length + AC.HOME.length + 5 <= AC.QR_MAX }; }); };
  // what's inside a save, in kid words: tickets, prizes, DLC, badges and which games have progress
  var GAMES = [['grokArcade.', 'Grok Arcade'], ['grokDLC.', null], ['grokBlocks', 'Grok Blocks'], ['grokBrawl', 'Grok Brawl'], ['grokDash', 'Grok Dash'], ['grokDetective', 'Grok Detective'], ['grokDisaster', 'Grok Disaster'], ['grokEatsville', 'Grok Eatsville'], ['grokFC', 'Grok FC'], ['grokGrid', 'Grok Grid'], ['grokGroceryTycoon', 'Grok Grocery Tycoon'], ['grokHeist', 'Grok Heist'], ['grokHunters', 'Grok Hunters'], ['grokKart', 'Grok Kart'], ['grokparty', 'Grok Land Party'], ['grokLife', 'Grok Life'], ['grokRelics', 'Grok Lost Relics'], ['grokNorthPole', 'Grok North Pole'], ['grokPets', 'Grok Pets'], ['grokPickleball', 'Grok Pickleball'], ['grokPoke', 'Grok Poke'], ['grokPumpkinHollow', 'Grok Pumpkin Hollow'], ['grokPupTown', 'Grok Pup Town'], ['grokRatitaHQ', 'Ratita HQ'], ['grokRatita', 'Grok Ratita'], ['grokRides2', 'Grok Rides Remastered'], ['grokRides', 'Grok Rides'], ['grokRuffsources', 'Grok Ruffsources'], ['grokSkyTours', 'Grok Sky Tours'], ['grokSky', 'Grok Sky'], ['grokSpooks', 'Grok Spooks'], ['grokSports', 'Grok Sports'], ['grokSurfers', 'Grok Surfers'], ['grokTortyTown', 'Grok Torty Town'], ['grokNet.', 'Multiplayer name'], ['grokBeta.', 'Old-version betas'], ['grokOldVer', null]];
  AC.summary = function (keys) {
    keys = keys || AC.keys(); var out = { tickets: 0, prizes: 0, badges: 0, dlc: 0, games: [], other: 0, keys: 0, bytes: 0 }, seen = {};
    function J(k) { try { return JSON.parse(keys[k]); } catch (e) { return null; } }
    out.tickets = +J('grokArcade.tickets') || 0;
    var pr = J('grokArcade.prog'); if (pr) { out.prizes = pr.owned ? Object.keys(pr.owned).filter(function (k) { return pr.owned[k]; }).length : 0; out.badges = pr.unlocked ? Object.keys(pr.unlocked).filter(function (k) { return pr.unlocked[k]; }).length : 0; }
    Object.keys(keys).forEach(function (k) {
      out.keys++; out.bytes += k.length + String(keys[k]).length;
      if (k.indexOf('grokDLC.') === 0) { out.dlc++; return; }
      for (var i = 0; i < GAMES.length; i++) { var g = GAMES[i]; if (k.toLowerCase().indexOf(g[0].toLowerCase()) === 0) { if (g[1] && !seen[g[1]]) { seen[g[1]] = 1; out.games.push(g[1]); } return; } }
      out.other++;
    });
    return out;
  };

  /* ---------- import / backup ---------- */
  function writeAll(keys, opt) {
    // replace: drop this device's transferable keys, then write the new ones. Device id, backups and caches stay.
    var st = localStorage, cur = snapshotFrom(st), k;
    for (k in cur) if (!(k in keys)) st.removeItem(k);
    for (k in keys) st.setItem(k, keys[k]);
    if (!opt || opt.reload !== false) freezeAndReload();
  }
  function freezeAndReload() {
    // nothing else may save over the new save before the page reloads
    try { var SP = Storage.prototype, oS = SP.setItem; SP.setItem = function () {}; void oS; } catch (e) {}
    setTimeout(function () { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} location.reload(); }, 450);
  }
  AC.backup = function () { return getJ(K_BAK, null); };
  AC.importSnap = function (snap, opt) {
    var now = AC.keys(false), d = AC.device();
    var bak = { f: 'GAS', v: 1, t: Date.now(), why: 'before loading save from ' + ((snap.dev && snap.dev.name) || 'another device'), keys: now };
    if (!setJ(K_BAK, bak)) throw new Error('space');
    var keys = {}; Object.keys(snap.keys).forEach(function (k) { if (!skip(k)) keys[k] = String(snap.keys[k]); });
    try { var a = JSON.parse(keys[K_ACC] || 'null'); if (a && a.id) { touchDevice(a); keys[K_ACC] = JSON.stringify(a); } } catch (e) {}
    log('import', snap); void d;
    writeAll(keys, opt); return bak;
  };
  AC.restore = function (opt) {
    var bak = AC.backup(); if (!bak || !bak.keys) throw new Error('nobackup');
    var now = AC.keys(false), swap = { f: 'GAS', v: 1, t: Date.now(), why: 'save you had before restoring the backup', keys: now };
    setJ(K_BAK, swap); log('restore', bak); writeAll(bak.keys, opt); return swap;
  };
  function log(what, s) { var L = getJ(K_LOG, []); L.unshift({ w: what, t: Date.now(), from: s && s.dev ? s.dev.name : '', acct: s && s.acct ? s.acct.id : '', rev: s && s.rev }); setJ(K_LOG, L.slice(0, 12)); }
  AC.log = function () { return getJ(K_LOG, []); };

  /* ---------- LIVE SYNC lives in js/account-sync.js (GA.Sync) ---------- */
  AC.sync = { available: true, server: 'firebase', get engine() { return GA.Sync; } };

  /* ---------- a transfer LINK (#gas=...) opens Bob's Load Save screen ---------- */
  AC.pendingLink = null;
  try { var hm = /[#&]gas=([^&]+)/.exec(location.hash); if (hm) AC.pendingLink = decodeURIComponent(hm[1]); } catch (e) {}
})();
