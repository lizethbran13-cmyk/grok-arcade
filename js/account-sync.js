/* Grok Arcade - BOB'S ACCOUNT DESK: LIVE SYNC (issue #49, "live sync later" part).
   Save server = Firebase Firestore (project grok-arcade-1). The Firebase SDK is NOT loaded with the arcade: it is imported from
   gstatic only when Live Sync is ON on this device (a few seconds after the arcade starts) or when you use Live Sync at Bob's desk.
   Firestore layout (rules: firebase/firestore.rules):
     <coll>/<6-digit id>              public FRIEND CARD { v, name, devs, share, stats|null, t, n, wh, w }  (writes need the hash-chain
                                      secret: w_n = HMAC(vaultKey, 'card'+n), wh = sha256(w_n); only linked devices know vaultKey)
     <coll>/<id>/req/<random>         LINK REQUEST from a new device { name, dev, pub (ECDH P-256), t } -> a linked device answers
                                      { ans: 'no' | 'full' | 'E1.<ephemeral pub>.<iv>.<AES-GCM(vaultKey,...)>' } (only the asker can open it)
     <coll>/<id>/vault/<vaultKey>     THE SAVE { v, devices[<=3], blob, rev, t, by }  (can't be listed: you need the 43-char key)
   blob = 'Z1.' + base64url(deflate-raw(JSON { f:'GLS', v:1, keys: { <localStorage key>: [value, changedAt ms, deviceId] } }))
   Same key set as Transfer Save (GA.Account.keys), minus this device's account record.
   Merge: per key, the NEWEST change wins; an empty value never replaces real progress; deletions never sync (nothing gets wiped);
   before writing anything from the server, the current save goes into grokArcade.sync.backup. Arcade keys the running arcade keeps in
   memory are applied with a quick restart, never in the middle of a bonus game. Offline / locked rules: the save just stays here. */
(function () {
  'use strict';
  var AC = GA.Account; if (!AC) return;
  var SY = GA.Sync = {};
  var CFG = { apiKey: 'AIzaSyB4lXfbBPE3j3VxGrntZbgbtEXvJI--Xk0', authDomain: 'grok-arcade-1.firebaseapp.com', projectId: 'grok-arcade-1', storageBucket: 'grok-arcade-1.firebasestorage.app', messagingSenderId: '208243542693', appId: '1:208243542693:web:92c304d4dfcb4e2440db4c' };
  var SDK = 'https://www.gstatic.com/firebasejs/12.4.0/';
  var K_S = 'grokArcade.sync', K_META = 'grokArcade.sync.meta', K_SBAK = 'grokArcade.sync.backup', K_ACC = 'grokArcade.account';
  // the live arcade syncs in grokSync; the Time Jumper preview, old betas and test servers use grokSyncBeta (never mixes with real saves)
  var LIVE = (function () { try { return location.hostname === 'lizethbran13-cmyk.github.io' && !/\/(previews|archive)\//.test(location.pathname) && !/[?&]syncbeta/.test(location.search); } catch (e) { return false; } })();
  SY.COLL = LIVE ? 'grokSync' : 'grokSyncBeta';
  SY.MAX = AC.MAX_DEVICES || 3;

  function getJ(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function setJ(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  SY.state = function () { return getJ(K_S, null) || { on: false }; };
  function saveState(s) { setJ(K_S, s); }
  SY.on = function () { var s = SY.state(); return !!(s.on && s.id && s.k); };
  SY.backup = function () { return getJ(K_SBAK, null); };

  /* ---------- status (what Bob's desk shows) ---------- */
  var status = { mode: 'off', msg: '', last: 0 }, subs = [];
  SY.status = function () { var s = SY.state(); return { mode: SY.on() ? status.mode : (s.why === 'unlinked' ? 'unlinked' : 'off'), msg: status.msg, last: s.last || 0, devices: vaultDevs.slice(), pending: pendingReqs.slice(), id: s.id, share: !!s.share }; };
  SY.subscribe = function (fn) { subs.push(fn); return function () { subs = subs.filter(function (f) { return f !== fn; }); }; };
  function setStatus(mode, msg) { status.mode = mode; status.msg = msg || ''; subs.forEach(function (f) { try { f(SY.status()); } catch (e) {} }); }
  function errKind(e) {
    var c = (e && (e.code || e.message)) || '';
    if (/permission/.test(c)) return 'rules';
    if (/load/.test(c)) return 'load';
    if (!navigator.onLine || /unavailable|timeout|offline|network|deadline/i.test(c)) return 'offline';
    if (/big/.test(c)) return 'big';
    if (/space|quota/i.test(c)) return 'space';
    return 'error';
  }
  SY.errKind = errKind;
  SY._status = function (m, msg) { setStatus(m, msg); }; // test hook (screenshots of the offline / locked states)
  function tmo(p, ms, what) { return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { var e = new Error('timeout ' + (what || '')); e.code = 'timeout'; rej(e); }, ms); })]); }

  /* ---------- lazy Firebase ---------- */
  var FB = null, fbP = null;
  SY.loaded = function () { return !!FB; };
  function load() {
    if (FB) return Promise.resolve(FB);
    if (fbP) return fbP;
    fbP = tmo(Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-firestore.js')]), 20000, 'load').then(function (m) {
      var app = m[0].initializeApp(CFG, 'grokSync'), f = m[1];
      FB = { f: f, db: f.getFirestore(app) };
      return FB;
    }).catch(function (e) { fbP = null; var x = new Error('load: ' + (e && e.message)); x.code = navigator.onLine ? 'load' : 'offline'; throw x; });
    return fbP;
  }
  SY.load = load;
  function ref() { var a = Array.prototype.slice.call(arguments); return FB.f.doc.apply(null, [FB.db].concat(a)); }

  /* ---------- crypto helpers ---------- */
  var enc = new TextEncoder(), dec = new TextDecoder();
  function b64u(bytes) { var s = ''; bytes = new Uint8Array(bytes); for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64u(s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function randBytes(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return a; }
  function randAlnum(n) { var C = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789', a = randBytes(n), s = ''; for (var i = 0; i < n; i++) s += C[a[i] % C.length]; return s; }
  function sha(s) { return crypto.subtle.digest('SHA-256', enc.encode(s)).then(hex); }
  function hmac(key, msg) { return crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']).then(function (k) { return crypto.subtle.sign('HMAC', k, enc.encode(msg)); }).then(hex); }
  function chain(K, n) { return hmac(K, 'card' + n); }
  var ECDH = { name: 'ECDH', namedCurve: 'P-256' };
  function aesFrom(priv, pubRaw) { return crypto.subtle.importKey('raw', pubRaw, ECDH, false, []).then(function (pub) { return crypto.subtle.deriveKey({ name: 'ECDH', public: pub }, priv, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); }); }
  var MATCH = ['\uD83D\uDC00', '\uD83D\uDC22', '\uD83C\uDF55', '\uD83D\uDE80', '\u2B50', '\uD83C\uDF88', '\uD83C\uDF69', '\uD83C\uDFAE', '\uD83E\uDDC0', '\uD83C\uDF08'];
  function matchCode(pub) { return sha(pub).then(function (h) { return MATCH[parseInt(h.slice(0, 2), 16) % MATCH.length] + ' ' + String(parseInt(h.slice(2, 8), 16) % 1000).padStart(3, '0'); }); }
  SY.matchCode = matchCode;

  /* ---------- blob ---------- */
  var canZip = typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
  function pipe(bytes, Stream, fmt) { var cs = new Stream(fmt), w = cs.writable.getWriter(); w.write(bytes); w.close(); return new Response(cs.readable).arrayBuffer().then(function (ab) { return new Uint8Array(ab); }); }
  function packBlob(keys) {
    var bytes = enc.encode(JSON.stringify({ f: 'GLS', v: 1, keys: keys }));
    return (canZip ? pipe(bytes, CompressionStream, 'deflate-raw').then(function (z) { return 'Z1.' + b64u(z); }) : Promise.reject()).catch(function () { return 'J0.' + b64u(bytes); });
  }
  function unpackBlob(blob) {
    return Promise.resolve().then(function () {
      if (!blob) return {};
      var m = /^(Z1|J0)\.(.*)$/.exec(blob); if (!m) throw new Error('blob');
      var raw = unb64u(m[2]);
      return (m[1] === 'Z1' ? pipe(raw, DecompressionStream, 'deflate-raw') : Promise.resolve(raw)).then(function (b) { var o = JSON.parse(dec.decode(b)); if (!o || o.f !== 'GLS' || typeof o.keys !== 'object') throw new Error('blob'); return o.keys; });
    });
  }

  /* ---------- local change tracking: per key [crc, changedAt] ---------- */
  var CRC = null;
  function crc32(s) { if (!CRC) { CRC = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } } var x = -1; for (var i = 0; i < s.length; i++) x = (x >>> 8) ^ CRC[(x ^ s.charCodeAt(i)) & 255]; return ((x ^ -1) >>> 0).toString(36) + '.' + s.length.toString(36); }
  // this device's own settings never sync (graphics level, sound, the multiplayer antenna)
  var LOCAL = [K_ACC, 'grokArcade.gfx', 'grokArcade.muted', 'grokArcade.antenna.last'];
  function localKeys() { var o = AC.keys(false); LOCAL.forEach(function (k) { delete o[k]; }); Object.keys(o).forEach(function (k) { if (/^grokArcade\.pv/.test(k)) delete o[k]; }); return o; }
  function scan() {
    var first = getJ(K_META, null) == null, cur = localKeys(), meta = getJ(K_META, {}) || {}, now = Date.now(), changed = 0, k;
    // very first scan on this device: we don't know how old these values are, so they count as old (t=1), never as "newest"
    for (k in cur) { var c = crc32(cur[k]); if (!meta[k] || meta[k][0] !== c) { meta[k] = [c, first && !meta[k] ? 1 : now]; changed++; } }
    for (k in meta) if (!(k in cur)) delete meta[k];
    setJ(K_META, meta); return { cur: cur, meta: meta, changed: changed };
  }
  SY._scan = scan;
  function empty(v) { return v == null || v === '' || v === 'null' || v === '{}' || v === '[]' || v === '""' || v === 'undefined'; }
  SY._empty = empty;
  /* the merge (pure): R = server keys, L = local scan */
  function merge(R, L, me, joining) {
    var out = {}, apply = {}, newMeta = {}, push = false, k, all = {};
    for (k in R) all[k] = 1; for (k in L.cur) all[k] = 1;
    for (k in all) {
      var r = R[k], lv = L.cur[k], lt = L.meta[k] ? L.meta[k][1] : 0;
      if (r && !Array.isArray(r)) r = null;
      if (!r && lv === undefined) continue;
      if (LOCAL.indexOf(k) >= 0) continue;
      if (lv === undefined) { // only on the server
        out[k] = r; if (!empty(r[0])) { apply[k] = r[0]; newMeta[k] = [crc32(String(r[0])), r[1]]; }
        continue;
      }
      if (!r) { out[k] = [lv, lt, me]; push = true; continue; } // only here
      if (r[0] === lv) { out[k] = r; if (lt < r[1]) newMeta[k] = [crc32(lv), r[1]]; continue; }
      var remoteWins = joining ? true : (r[1] > lt || (r[1] === lt && String(r[2]) > String(me)));
      if (remoteWins && empty(r[0]) && !empty(lv)) remoteWins = false; // never wipe progress with an empty value
      if (!remoteWins && empty(lv) && !empty(r[0])) remoteWins = true;
      if (remoteWins) { out[k] = r; apply[k] = String(r[0]); newMeta[k] = [crc32(String(r[0])), r[1]]; }
      else { out[k] = [lv, Math.max(lt, (r[1] || 0) + (joining ? 0 : 0)), me]; push = true; }
    }
    return { out: out, apply: apply, meta: newMeta, push: push };
  }
  SY._merge = merge;

  /* ---------- applying server data ---------- */
  // keys the running arcade keeps in memory: these two reload in place, any other grokArcade.* key needs a quick restart
  var RELOAD = { 'grokArcade.prog': function () { return GA.Prog && GA.Prog._reload && GA.Prog._reload(); }, 'grokArcade.attic': function () { return GA.Attic && GA.Attic._reload && (GA.Attic._reload(), true); } };
  function hot(k) { return /^grokArcade\./.test(k) && k !== 'grokArcade.tickets' && !RELOAD[k]; }
  // restart only when it can't interrupt anything: at Bob's desk, or the tab is hidden, or nobody touched anything for 20 s (never mid-game)
  var lastInput = Date.now();
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, function () { lastInput = Date.now(); }, { passive: true, capture: true }); });
  function safeToRestart() {
    try {
      if (GA.MG && GA.MG.isOpen && GA.MG.isOpen()) return false;
      var desk = GA.AreasUI && GA.AreasUI.isOpen && GA.AreasUI.isOpen() && GA.AreasUI.kind() === 'account';
      if (desk) return true;
      if (GA.AreasUI && GA.AreasUI.isOpen && GA.AreasUI.isOpen()) return false;
      var t = document.getElementById('title'); if (t && !t.classList.contains('hidden')) return true; // still on the title screen
      return document.visibilityState === 'hidden' || Date.now() - lastInput > 20000;
    } catch (e) { return true; }
  }
  var restarting = false, waitingRestart = false;
  function willDefer(res) { return Object.keys(res.apply).some(hot) && !safeToRestart(); }
  function applyChanges(res, from) {
    var keys = Object.keys(res.apply), cold = [], hotK = [];
    keys.forEach(function (k) { (hot(k) ? hotK : cold).push(k); });
    var meta = getJ(K_META, {}) || {};
    Object.keys(res.meta).forEach(function (k) { if (!(k in res.apply)) meta[k] = res.meta[k]; });
    if (hotK.length && !safeToRestart()) { waitingRestart = true; hotK = []; } // later, never mid-game (meta untouched: retried next round)
    var doK = cold.concat(hotK);
    if (doK.length) {
      var bak = { f: 'GAS', v: 1, t: Date.now(), why: 'before Live Sync brought changes from ' + (from || 'your other device'), keys: AC.keys(false) };
      if (!setJ(K_SBAK, bak)) { setJ(K_META, meta); var e = new Error('space'); e.code = 'space'; throw e; } // no backup = no changes
      doK.forEach(function (k) { try { localStorage.setItem(k, res.apply[k]); meta[k] = res.meta[k]; } catch (er) {} });
    }
    setJ(K_META, meta);
    if (!hotK.length) doK.forEach(function (k) { if (RELOAD[k]) { var okR = false; try { okR = RELOAD[k](); } catch (e) {} if (!okR) hotK.push(k); } });
    if (doK.indexOf('grokArcade.tickets') >= 0) { try { if (GA.onTickets) GA.onTickets(GA.getTickets()); } catch (e) {} }
    if (doK.length) dbg('applied ' + doK.join(',') + ' from ' + from);
    if (hotK.length) restart(from, hotK);
    else if (cold.length) toastSoon('\uD83D\uDD04 Live Sync: got ' + cold.length + (cold.length === 1 ? ' update' : ' updates') + ' from ' + (from || 'your other device') + '!');
    return doK.length;
  }
  function dbg(m) { try { var L = JSON.parse(sessionStorage.getItem('grokArcade.syncLog') || '[]'); L.push(new Date().toTimeString().slice(0, 8) + ' ' + m); sessionStorage.setItem('grokArcade.syncLog', JSON.stringify(L.slice(-40))); } catch (e) {} }
  SY.dbg = function () { try { return JSON.parse(sessionStorage.getItem('grokArcade.syncLog') || '[]'); } catch (e) { return []; } };
  function restart(from, keys) {
    if (restarting) return; restarting = true; dbg('restart for ' + (keys || []).join(','));
    try { sessionStorage.setItem('grokArcade.acDone', JSON.stringify({ w: 'sync', from: from || '' })); if (GA.AreasUI && GA.AreasUI.isOpen && GA.AreasUI.isOpen() && GA.AreasUI.kind() === 'account') sessionStorage.setItem('grokArcade.syncReopen', '1'); } catch (e) {}
    try { var SP = Storage.prototype; SP.setItem = function () {}; } catch (e) {} // nothing may save over the fresh save before the restart
    toastSoon('\uD83D\uDD04 Live Sync: new save from ' + (from || 'your other device') + '! Restarting the arcade\u2026');
    setTimeout(function () { location.reload(); }, 900);
  }
  var lastToast = 0;
  function toastSoon(m) { var now = Date.now(); if (now - lastToast < 2500) return; lastToast = now; try { if (GA.Fix && GA.Fix.toast) GA.Fix.toast(m, 3500); } catch (e) {} }

  /* ---------- the engine ---------- */
  var unsubV = null, unsubR = null, iv = 0, vaultDevs = [], pendingReqs = [], pushing = false, again = false, pushTimer = 0, backoff = 0, lastCard = 0, lastStats = '';
  function me() { return AC.device(); }
  function devName(id) { var d = vaultDevs.filter(function (x) { return x.id === id; })[0]; return d ? d.name : ''; }
  SY.start = function () {
    if (!SY.on() || unsubV) return Promise.resolve();
    setStatus('starting');
    return load().then(function () {
      var s = SY.state(), f = FB.f; scan();
      unsubV = f.onSnapshot(ref(s.coll, s.id, 'vault', s.k), onVault, function (e) { setStatus(errKind(e), e.code || e.message); });
      unsubR = f.onSnapshot(f.query(f.collection(FB.db, s.coll, s.id, 'req'), f.limit(10)), onReqs, function () {});
      clearInterval(iv); iv = setInterval(tick, 5000);
      window.addEventListener('online', onOnline); window.addEventListener('offline', onOffline);
      document.addEventListener('visibilitychange', onVis);
      if (!navigator.onLine) setStatus('offline');
    }).catch(function (e) { setStatus(errKind(e), e.message); unsubV = null; });
  };
  SY.stop = function () { if (unsubV) unsubV(); if (unsubR) unsubR(); unsubV = unsubR = null; clearInterval(iv); clearTimeout(pushTimer); vaultDevs = []; pendingReqs = []; window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); document.removeEventListener('visibilitychange', onVis); };
  function onOnline() { setStatus('syncing'); SY.syncNow(); }
  function onOffline() { setStatus('offline'); }
  function onVis() { if (document.visibilityState === 'hidden') SY.syncNow(); }
  function tick() {
    if (!SY.on()) return;
    if (waitingRestart && safeToRestart()) { waitingRestart = false; SY.syncNow(); return; }
    var sc = scan(); if (sc.changed) schedulePush(2500);
    var now = Date.now(); pendingReqs = pendingReqs.filter(function (r) { return now - (r.t || 0) < 10 * 60000 && !answered[r.rid]; });
    if (pendingReqs.length && SY.onRequest) SY.onRequest(pendingReqs.slice()); // reminds (e.g. after closing Bob's desk)
    if (status.mode === 'offline' && navigator.onLine && Date.now() > backoff) SY.syncNow();
  }
  function schedulePush(ms) { clearTimeout(pushTimer); pushTimer = setTimeout(function () { SY.syncNow(); }, ms); }
  function gone(why) {
    var s = SY.state(); s.on = false; s.why = why; s.wasId = s.id; saveState(s); SY.stop(); setStatus(why);
  }
  function onVault(snap) {
    if (snap.metadata.hasPendingWrites) return;
    if (!snap.exists()) return gone('unlinked');
    var d = snap.data(), my = me().id; vaultDevs = d.devices || [];
    if (!vaultDevs.some(function (x) { return x.id === my; })) return gone('unlinked');
    var s = SY.state();
    unpackBlob(d.blob).then(function (R) {
      var L = scan(), res = merge(R, L, my, !!s.joining);
      if (!willDefer(res)) delete s.joining; // a joining device stays "joining" until it really has the account's save
      s.last = Date.now(); saveState(s); // before applying: a restart freezes storage
      var n = applyChanges(res, devName(d.by) || 'your other device');
      if (res.push || waitingRestart) schedulePush(res.push ? 800 : 4000);
      setStatus(navigator.onLine ? 'ok' : 'offline'); void n;
    }).catch(function (e) { setStatus(errKind(e), e.message); });
  }
  SY.syncNow = function () {
    if (!SY.on()) return Promise.resolve(false);
    if (pushing) { again = true; return Promise.resolve(false); }
    if (!navigator.onLine) { setStatus('offline'); return Promise.resolve(false); }
    pushing = true; setStatus('syncing');
    var s = SY.state(), my = me(), res = null, from = '';
    return load().then(function () {
      var f = FB.f, vref = ref(s.coll, s.id, 'vault', s.k), L = scan();
      return tmo(f.runTransaction(FB.db, function (tx) {
        return tx.get(vref).then(function (snap) {
          if (!snap.exists()) { var e = new Error('unlinked'); e.code = 'unlinked'; throw e; }
          var d = snap.data(), devs = (d.devices || []).slice();
          var mine = devs.filter(function (x) { return x.id === my.id; })[0];
          if (!mine) { var e2 = new Error('unlinked'); e2.code = 'unlinked'; throw e2; }
          from = (devs.filter(function (x) { return x.id === d.by; })[0] || {}).name || '';
          return unpackBlob(d.blob).then(function (R) {
            res = merge(R, L, my.id, !!s.joining);
            var seenOld = Date.now() - (mine.seen || 0) > 10 * 60000;
            if (!res.push && !seenOld) return null;
            mine.seen = Date.now(); mine.name = my.name; vaultDevs = devs;
            return packBlob(res.out).then(function (blob) {
              if (blob.length > 1000000) { var e3 = new Error('big'); e3.code = 'big'; throw e3; }
              tx.set(vref, { v: 1, devices: devs, blob: blob, rev: (d.rev || 0) + 1, t: Date.now(), by: my.id });
            });
          });
        });
      }), 20000, 'sync');
    }).then(function () {
      s = SY.state(); if (s.joining && !(res && willDefer(res))) delete s.joining; s.last = Date.now(); saveState(s);
      if (res) applyChanges(res, from || 'your other device');
      backoff = 0; setStatus('ok'); updateCard();
      return true;
    }).catch(function (e) {
      if (e && e.code === 'unlinked') { gone('unlinked'); return false; }
      var k = errKind(e); backoff = Date.now() + 30000; setStatus(k, e && (e.code || e.message)); return false;
    }).then(function (r) { pushing = false; if (again) { again = false; schedulePush(1500); } return r; });
  };

  /* ---------- friend card ---------- */
  function stats() { var sm = AC.summary(AC.keys(false)); return { tickets: sm.tickets, prizes: sm.prizes, badges: sm.badges, dlc: sm.dlc, games: sm.games.slice(0, 40) }; }
  function cardTx(coll, id, K, mut) {
    var f = FB.f, cref = ref(coll, id);
    return tmo(f.runTransaction(FB.db, function (tx) {
      return tx.get(cref).then(function (snap) {
        if (!snap.exists()) throw new Error('nocard');
        var c = snap.data();
        return chain(K, c.n).then(function (w) {
          return sha(w).then(function (h) {
            if (h !== c.wh) throw new Error('cardlock');
            return chain(K, c.n + 1).then(sha).then(function (wh) {
              var nx = { v: 1, name: c.name, devs: c.devs, share: !!c.share, stats: c.stats || null, t: Date.now(), n: c.n + 1, wh: wh, w: w };
              var m = mut(c) || {}; Object.keys(m).forEach(function (k) { nx[k] = m[k]; });
              tx.set(cref, nx); return nx;
            });
          });
        });
      });
    }), 15000, 'card');
  }
  function updateCard(force) {
    var s = SY.state(); if (!SY.on()) return Promise.resolve();
    var st = s.share ? stats() : null, sig = JSON.stringify([st, vaultDevs.length, (AC.get() || {}).name]);
    if (!force && (sig === lastStats || Date.now() - lastCard < 60000)) return Promise.resolve();
    lastCard = Date.now();
    return cardTx(s.coll, s.id, s.k, function () { var o = { share: !!s.share, stats: st, devs: Math.max(1, Math.min(SY.MAX, vaultDevs.length || 1)) }; var nm = AC.clean((AC.get() || {}).name || ''); if (nm) o.name = nm; return o; }).then(function () { lastStats = sig; }).catch(function () {});
  }
  SY.updateCard = updateCard;

  /* ---------- TURN ON (claim an ID) ---------- */
  function setAccount(id, name) { var a = AC.get() || AC.create(name); a.id = id; if (name) a.name = name; a.sync = a.sync || {}; a.sync.server = 'firebase:' + SY.COLL; setJ(K_ACC, a); try { if (GA.Account3D && GA.Account3D.refresh) GA.Account3D.refresh(); } catch (e) {} return a; }
  SY.turnOn = function () {
    var a = AC.get() || AC.create(), K = b64u(randBytes(32)), d = me(), coll = SY.COLL, id = a.id, tries = 0;
    setStatus('starting');
    return load().then(function claim() {
      var f = FB.f, cref = ref(coll, id);
      return chain(K, 0).then(sha).then(function (wh) {
        return tmo(f.runTransaction(FB.db, function (tx) {
          return tx.get(cref).then(function (snap) {
            if (snap.exists()) { var e = new Error('taken'); e.code = 'taken'; throw e; }
            tx.set(cref, { v: 1, name: AC.clean(a.name) || 'Player', devs: 1, share: false, stats: null, t: Date.now(), n: 0, wh: wh });
          });
        }), 15000, 'claim');
      }).catch(function (e) {
        if (e && e.code === 'taken' && ++tries < 8) { id = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000)); return claim(); }
        throw e;
      });
    }).then(function () {
      var L = scan(), keys = {}; Object.keys(L.cur).forEach(function (k) { keys[k] = [L.cur[k], L.meta[k] ? L.meta[k][1] : Date.now(), d.id]; });
      return packBlob(keys).then(function (blob) {
        if (blob.length > 1000000) { var e = new Error('big'); e.code = 'big'; throw e; }
        return tmo(FB.f.setDoc(ref(coll, id, 'vault', K), { v: 1, devices: [{ id: d.id, name: d.name, seen: Date.now() }], blob: blob, rev: 1, t: Date.now(), by: d.id }), 15000, 'vault');
      });
    }).then(function () {
      setAccount(id, a.name);
      saveState({ on: true, coll: coll, id: id, k: K, since: Date.now(), last: Date.now(), share: false });
      vaultDevs = [{ id: d.id, name: d.name, seen: Date.now() }];
      return SY.start().then(function () { setStatus('ok'); return id; });
    }).catch(function (e) { setStatus('off', ''); throw e; });
  };

  /* ---------- LINK this device to an ID (asks a linked device) ---------- */
  SY.peekCard = function (id) { return load().then(function () { return tmo(FB.f.getDoc(ref(SY.COLL, id)), 12000, 'peek'); }).then(function (s) { return s.exists() ? s.data() : null; }); };
  SY.link = function (id, onStep) {
    var cancelled = false, unsub = null, rref = null, timer = 0, d = me(), kp = null;
    function step(o) { if (!cancelled && onStep) onStep(o); }
    function cleanup() { if (unsub) unsub(); unsub = null; clearTimeout(timer); if (rref) FB.f.deleteDoc(rref).catch(function () {}); }
    var ctl = { cancel: function () { cancelled = true; cleanup(); } };
    if (SY.on()) { step({ phase: 'error', why: 'already' }); return ctl; }
    load().then(function () { return SY.peekCard(id); }).then(function (card) {
      if (cancelled) return;
      if (!card) return step({ phase: 'error', why: 'noid' });
      if (card.devs >= SY.MAX) return step({ phase: 'error', why: 'full', card: card });
      return crypto.subtle.generateKey(ECDH, false, ['deriveKey']).then(function (k) { kp = k; return crypto.subtle.exportKey('raw', k.publicKey); }).then(function (raw) {
        var pub = b64u(raw), rid = randAlnum(24); rref = ref(SY.COLL, id, 'req', rid);
        return tmo(FB.f.setDoc(rref, { name: d.name.slice(0, 40), dev: d.id, pub: pub, t: Date.now() }), 12000, 'req').then(function () { return matchCode(pub); });
      }).then(function (mc) {
        if (cancelled) return cleanup();
        step({ phase: 'wait', match: mc, card: card });
        timer = setTimeout(function () { step({ phase: 'error', why: 'timeout' }); ctl.cancel(); }, 5 * 60000);
        unsub = FB.f.onSnapshot(rref, function (snap) {
          var x = snap.exists() ? snap.data() : null; if (!x || !x.ans || cancelled) return;
          if (x.ans === 'no' || x.ans === 'full') { step({ phase: 'error', why: x.ans === 'no' ? 'denied' : 'full', card: card }); return ctl.cancel(); }
          var p = /^E1\.([^.]+)\.([^.]+)\.([^.]+)$/.exec(x.ans); if (!p) { step({ phase: 'error', why: 'bad' }); return ctl.cancel(); }
          aesFrom(kp.privateKey, unb64u(p[1])).then(function (aes) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64u(p[2]) }, aes, unb64u(p[3])); }).then(function (pt) {
            var o = JSON.parse(dec.decode(pt));
            return tmo(FB.f.getDoc(ref(SY.COLL, id, 'vault', o.k)), 12000, 'vault').then(function (v) {
              if (!v.exists() || !(v.data().devices || []).some(function (z) { return z.id === d.id; })) throw new Error('bad');
              cleanup(); if (cancelled) return;
              setAccount(id, o.name || card.name);
              saveState({ on: true, coll: SY.COLL, id: id, k: o.k, since: Date.now(), joining: true, share: !!card.share });
              vaultDevs = v.data().devices || [];
              step({ phase: 'linked', card: card });
              return SY.start();
            });
          }).catch(function () { step({ phase: 'error', why: 'bad' }); ctl.cancel(); });
        }, function (e) { step({ phase: 'error', why: errKind(e) }); ctl.cancel(); });
      });
    }).catch(function (e) { step({ phase: 'error', why: errKind(e) }); cleanup(); });
    return ctl;
  };

  /* ---------- requests from new devices (on a linked device) ---------- */
  var answered = {};
  function onReqs(qs) {
    var now = Date.now();
    pendingReqs = [];
    qs.forEach(function (doc) { var x = doc.data(); if (!x.ans && !answered[doc.id] && now - (x.t || 0) < 10 * 60000 && x.dev !== me().id) pendingReqs.push({ rid: doc.id, name: x.name, dev: x.dev, pub: x.pub, t: x.t }); });
    Promise.all(pendingReqs.map(function (r) { return matchCode(r.pub).then(function (m) { r.match = m; }); })).then(function () { setStatus(status.mode, status.msg); if (pendingReqs.length && SY.onRequest) SY.onRequest(pendingReqs.slice()); });
  }
  SY.answer = function (req, yes) {
    var s = SY.state(), f = FB.f, rref = ref(s.coll, s.id, 'req', req.rid), vref = ref(s.coll, s.id, 'vault', s.k), result = 'no';
    answered[req.rid] = 1; pendingReqs = pendingReqs.filter(function (r) { return r.rid !== req.rid; });
    if (!yes) return tmo(f.updateDoc(rref, { ans: 'no' }), 12000).then(function () { setStatus(status.mode); return 'no'; });
    return tmo(f.runTransaction(FB.db, function (tx) {
      return tx.get(vref).then(function (snap) {
        var d = snap.data(), devs = (d.devices || []).slice();
        if (devs.some(function (x) { return x.id === req.dev; })) { result = 'ok'; return; }
        if (devs.length >= SY.MAX) { result = 'full'; return; }
        devs.push({ id: req.dev, name: String(req.name).slice(0, 40), seen: Date.now() }); result = 'ok'; vaultDevs = devs;
        tx.update(vref, { devices: devs, t: Date.now() });
      });
    }), 15000, 'approve').then(function () {
      if (result === 'full') return f.updateDoc(rref, { ans: 'full' }).then(function () { return 'full'; });
      return crypto.subtle.generateKey(ECDH, true, ['deriveKey']).then(function (eph) {
        return Promise.all([crypto.subtle.exportKey('raw', eph.publicKey), aesFrom(eph.privateKey, unb64u(req.pub))]);
      }).then(function (r) {
        var iv = randBytes(12);
        return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, r[1], enc.encode(JSON.stringify({ k: s.k, name: (AC.get() || {}).name || '' }))).then(function (ct) { return 'E1.' + b64u(r[0]) + '.' + b64u(iv) + '.' + b64u(ct); });
      }).then(function (ans) { return tmo(f.updateDoc(rref, { ans: ans }), 12000); }).then(function () { lastCard = 0; return updateCard(true); }).then(function () { setStatus(status.mode); return 'ok'; });
    });
  };

  /* ---------- devices / share / leave ---------- */
  SY.devices = function () { return vaultDevs.slice(); };
  SY.unlink = function (devId) {
    var s = SY.state(), vref = ref(s.coll, s.id, 'vault', s.k);
    return tmo(FB.f.runTransaction(FB.db, function (tx) { return tx.get(vref).then(function (snap) { var devs = (snap.data().devices || []).filter(function (x) { return x.id !== devId; }); vaultDevs = devs; tx.update(vref, { devices: devs, t: Date.now() }); }); }), 15000, 'unlink').then(function () { return updateCard(true); }).then(function () { setStatus(status.mode); });
  };
  SY.setShare = function (on) {
    var s = SY.state(); s.share = !!on; saveState(s);
    return load().then(function () { return updateCard(true); }).then(function () { setStatus(status.mode); });
  };
  SY.leave = function () {
    var s = SY.state(), my = me().id, vref = ref(s.coll, s.id, 'vault', s.k), last = false;
    return tmo(FB.f.runTransaction(FB.db, function (tx) {
      return tx.get(vref).then(function (snap) {
        if (!snap.exists()) return;
        var devs = (snap.data().devices || []).filter(function (x) { return x.id !== my; });
        if (!devs.length) { last = true; tx.delete(vref); } else tx.update(vref, { devices: devs, t: Date.now() });
        vaultDevs = devs;
      });
    }), 15000, 'leave').then(function () {
      return cardTx(s.coll, s.id, s.k, function () { return last ? { devs: 0, share: false, stats: null } : { devs: Math.max(1, vaultDevs.length) }; }).catch(function () {});
    }).then(function () { SY.stop(); var st = SY.state(); st.on = false; st.why = 'left'; st.wasId = st.id; delete st.k; saveState(st); setStatus('off'); try { if (GA.Account3D && GA.Account3D.refresh) GA.Account3D.refresh(); } catch (e) {} });
  };
  SY.forget = function () { var s = SY.state(); saveState({ on: false, wasId: s.wasId || s.id }); setStatus('off'); };

  /* ---------- boot: only when Live Sync is ON on this device ---------- */
  // a few seconds after the page has loaded (also on the title screen, so a device that just restarted keeps syncing)
  if (SY.on()) { var go = function () { setTimeout(function () { SY.start(); }, 4000); }; if (document.readyState === 'complete') go(); else window.addEventListener('load', go); }
})();
