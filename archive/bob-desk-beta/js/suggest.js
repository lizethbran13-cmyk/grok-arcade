/* Grok Arcade - Suggestion Booth: send patch suggestions (prefilled GitHub issue or COPY for your assistant),
   keep a local "My suggestions" list and read the public Suggestion Board (GitHub issues labelled "suggestion"). */
(function () {
  'use strict';
  var REPO = 'lizethbran13-cmyk/grok-arcade';
  var API = 'https://api.github.com/repos/' + REPO + '/issues?labels=suggestion&state=all&per_page=50&sort=updated';
  var API_C = 'https://api.github.com/repos/' + REPO + '/issues/comments?sort=created&direction=desc&per_page=60';
  var K_MINE = 'grokArcade.suggestions', K_BOARD = 'grokArcade.sbBoard', K_DRAFT = 'grokArcade.sbDraft';
  var SB = GA.SB = {};
  var openNow = false, tab = 'new', loading = false, type = 'Idea';
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function snd(n) { try { GA.Audio.play(n); } catch (e) {} }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function toast(m, ms) { if (GA.Fix && GA.Fix.toast) GA.Fix.toast(m, ms || 3200); }
  function ago(ts) { var s = Math.max(0, (Date.now() - ts) / 1000); if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + ' h ago'; return Math.floor(s / 86400) + ' d ago'; }

  SB.games = function () { return GA.MAIN_GAMES.map(function (g) { return g.name; }).concat(GA.BONUS_GAMES.map(function (g) { return g.name; })).concat(['Grok Arcade', 'Other']); };
  /* ---------- building the suggestion ---------- */
  SB.compose = function (game, kind, title, text) {
    title = String(title || '').trim(); text = String(text || '').trim();
    var short = title || text.split('\n')[0];
    if (short.length > 70) short = short.slice(0, 67).trim() + '\u2026';
    var t = '[' + game + '] ' + short;
    var body = '**Game:** ' + game + '\n**Type:** ' + kind + '\n\n### Details\n' + (text || title) +
      '\n\n---\n_Sent from the Grok Arcade Suggestion Booth \u00b7 ' + new Date().toISOString().slice(0, 10) + ' \u00b7 ' + (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'phone' : 'desktop') + '_';
    var url = 'https://github.com/' + REPO + '/issues/new?title=' + encodeURIComponent(t) + '&body=' + encodeURIComponent(body) + '&labels=suggestion';
    var copy = 'Grok Arcade patch suggestion\nGame: ' + game + '\nType: ' + kind + '\nTitle: ' + short + '\nDetails: ' + (text || title);
    return { title: t, short: short, body: body, url: url, copy: copy };
  };
  function remember(s, via) {
    var mine = load(K_MINE, []);
    mine.unshift({ id: Date.now(), t: Date.now(), game: s.game, type: s.type, title: s.title, text: s.text, via: via });
    store(K_MINE, mine.slice(0, 100));
    if (GA.Prog) GA.Prog.event("suggest");
    var got = load('grokArcade.sbReward', 0);
    if (!got) { store('grokArcade.sbReward', 1); GA.addTickets(25); toast('\uD83D\uDCA1 Game Designer! +25 tickets for your first suggestion.', 3800); if (GA.onTickets) GA.onTickets(GA.getTickets()); }
  }
  function form() {
    var game = $('sbGame').value, title = $('sbTitle').value, text = $('sbText').value;
    return { game: game, type: type, title: title, text: text };
  }
  function valid(f) { if ((f.title + f.text).trim().length < 4) { $('sbMsg').textContent = 'Write a few words about your idea or bug first.'; $('sbMsg').className = 'sbMsg bad'; snd('buzz'); return false; } return true; }
  function saveDraft() { store(K_DRAFT, form()); }
  function clearForm() { $('sbTitle').value = ''; $('sbText').value = ''; store(K_DRAFT, null); }
  function submit() {
    var f = form(); if (!valid(f)) return;
    var s = SB.compose(f.game, f.type, f.title, f.text); SB.lastUrl = s.url;
    var w = null; try { w = window.open(s.url, '_blank', 'noopener'); } catch (e) {}
    remember({ game: f.game, type: f.type, title: s.title, text: f.text || f.title }, 'GitHub');
    clearForm();
    $('sbMsg').innerHTML = 'GitHub opened in a new tab \u2014 tap <b>Create</b> there to send it. Saved under <b>My suggestions</b>.' + (w ? '' : ' <a href="' + esc(s.url) + '" target="_blank" rel="noopener">Open GitHub</a>');
    $('sbMsg').className = 'sbMsg ok'; snd('win');
  }
  function copyText(txt) {
    SB.lastCopy = txt;
    function fallback() { var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta); return ok; }
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt).then(function () { return true; }, function () { return fallback(); });
    return Promise.resolve(fallback());
  }
  function copy() {
    var f = form(); if (!valid(f)) return;
    var s = SB.compose(f.game, f.type, f.title, f.text);
    copyText(s.copy).then(function (ok) {
      remember({ game: f.game, type: f.type, title: s.title, text: f.text || f.title }, 'Copied');
      clearForm();
      $('sbMsg').innerHTML = ok ? '\uD83D\uDCCB Copied! Paste it to your assistant. Saved under <b>My suggestions</b>.' : 'Couldn\u2019t reach the clipboard \u2014 here it is to copy by hand:<br><textarea class="sbCopyBox" readonly>' + esc(s.copy) + '</textarea>';
      $('sbMsg').className = 'sbMsg ok'; snd('coin');
    });
  }

  /* ---------- the board ---------- */
  function statusOf(it) {
    var labs = (it.labels || []).map(function (l) { return String(l.name || l).toLowerCase(); });
    if (it.state === 'closed') return labs.indexOf('wontfix') >= 0 || it.state_reason === 'not_planned' ? 'wont' : 'done';
    return labs.indexOf('in-progress') >= 0 ? 'work' : 'new';
  }
  var ST = { new: ['New', '\uD83C\uDD95'], work: ['Working on it', '\uD83D\uDEE0\uFE0F'], done: ['Done', '\u2705'], wont: ['Won\u2019t do', '\uD83D\uDEAB'] };
  SB.statusOf = statusOf;
  function parse(issues, comments) {
    var last = {};
    (comments || []).forEach(function (c) { var n = +String(c.issue_url || '').split('/').pop(); if (n && !last[n]) last[n] = String(c.body || '').replace(/\s+/g, ' ').trim().slice(0, 140); });
    return (issues || []).filter(function (it) { return !it.pull_request; }).map(function (it) {
      var m = /^\s*\[([^\]]{1,40})\]\s*(.*)$/.exec(it.title || ''), body = String(it.body || '');
      var tm = /\*\*Type:\*\*\s*(Bug|Idea|Balance)/i.exec(body);
      return { n: it.number, title: m ? m[2] : it.title, game: m ? m[1] : 'General', type: tm ? tm[1] : '', st: statusOf(it), url: it.html_url, upd: Date.parse(it.updated_at) || 0, nc: it.comments || 0, last: last[it.number] || '' };
    });
  }
  SB.parse = parse;
  function fetchBoard() {
    if (loading) return; loading = true; renderBoard('Loading the board\u2026');
    var rl = null;
    function getJ(u) {
      return fetch(u, { headers: { Accept: 'application/vnd.github+json' } }).then(function (r) {
        if (!r.ok) { var e = new Error('http ' + r.status); e.status = r.status; e.reset = +r.headers.get('x-ratelimit-reset') || 0; e.left = r.headers.get('x-ratelimit-remaining'); throw e; }
        rl = r.headers.get('x-ratelimit-remaining'); return r.json();
      });
    }
    getJ(API).then(function (issues) {
      var needC = issues.some(function (i) { return i.comments > 0; });
      return (needC ? getJ(API_C).catch(function () { return []; }) : Promise.resolve([])).then(function (cm) {
        var items = parse(issues, cm); store(K_BOARD, { t: Date.now(), items: items }); loading = false; renderBoard(null, rl);
      });
    }).catch(function (e) {
      loading = false; var msg;
      if (!navigator.onLine || !e.status) msg = '\uD83D\uDCE1 Looks like you\u2019re offline. Showing the last board we saved.';
      else if (e.status === 403 || e.status === 429) { var mins = e.reset ? Math.max(1, Math.ceil((e.reset * 1000 - Date.now()) / 60000)) : 0; msg = '\u23F3 GitHub needs a little break (too many checks this hour).' + (mins ? ' Try again in about ' + mins + ' min.' : '') + ' Showing the last saved board.'; }
      else if (e.status === 404 || e.status === 410) msg = 'The suggestion board isn\u2019t switched on yet.';
      else msg = 'Couldn\u2019t load the board right now (' + e.status + '). Showing the last saved one.';
      renderBoard(msg);
    });
  }
  SB.refresh = fetchBoard;
  function renderBoard(msg, rl) {
    if (tab !== 'board') return;
    var c = load(K_BOARD, null), h = '<div class="sbBar"><button id="sbRefresh" class="pzTab on" type="button">\uD83D\uDD04 Refresh</button><span class="sbWhen">' + (c ? 'Updated ' + ago(c.t) : 'Not loaded yet') + '</span></div>';
    if (msg) h += '<div class="sbMsg' + (loading ? '' : ' warn') + '" id="sbBoardMsg">' + esc(msg) + '</div>';
    if (c && c.items) {
      if (!c.items.length) h += '<div class="sbEmpty">No suggestions on the board yet. Be the first!</div>';
      var cnt = { new: 0, work: 0, done: 0, wont: 0 }; c.items.forEach(function (i) { cnt[i.st]++; });
      if (c.items.length) h += '<div class="sbCounts">' + Object.keys(ST).map(function (k) { return '<span class="sbSt ' + k + '">' + ST[k][1] + ' ' + ST[k][0] + ' ' + cnt[k] + '</span>'; }).join('') + '</div>';
      h += c.items.map(function (i) {
        return '<div class="sbItem" data-n="' + i.n + '"><div class="sbTop"><span class="sbSt ' + i.st + '">' + ST[i.st][1] + ' ' + ST[i.st][0] + '</span><span class="sbGameTag">' + esc(i.game) + '</span>' + (i.type ? '<span class="sbType">' + esc(i.type) + '</span>' : '') + '</div>' +
          '<div class="sbTitle">' + esc(i.title) + '</div>' + (i.last ? '<div class="sbLast">\uD83D\uDCAC ' + esc(i.last) + '</div>' : '') +
          '<div class="sbMeta">#' + i.n + ' \u00b7 ' + ago(i.upd) + (i.nc ? ' \u00b7 ' + i.nc + ' comment' + (i.nc > 1 ? 's' : '') : '') + ' \u00b7 <a href="' + esc(i.url) + '" target="_blank" rel="noopener">open</a></div></div>';
      }).join('');
    }
    $('sbBody').innerHTML = h;
    $('sbRefresh').addEventListener('click', function () { snd('click'); fetchBoard(); });
  }

  /* ---------- tabs ---------- */
  function renderNew() {
    var d = load(K_DRAFT, null) || {};
    var games = SB.games(), sel = d.game && games.indexOf(d.game) >= 0 ? d.game : games[0]; type = d.type || type;
    $('sbBody').innerHTML = '<label class="sbL">Which game?<select id="sbGame">' + games.map(function (g) { return '<option' + (g === sel ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join('') + '</select></label>' +
      '<div class="sbL">What kind?<div class="sbTypes">' + [['Bug', '\uD83D\uDC1E'], ['Idea', '\uD83D\uDCA1'], ['Balance', '\u2696\uFE0F']].map(function (t) { return '<button type="button" class="sbTypeBtn' + (t[0] === type ? ' on' : '') + '" data-t="' + t[0] + '">' + t[1] + ' ' + t[0] + '</button>'; }).join('') + '</div></div>' +
      '<label class="sbL">Short title<input id="sbTitle" maxlength="70" placeholder="e.g. Add a ghost dog boss" value="' + esc(d.title || '') + '"></label>' +
      '<label class="sbL">Details<textarea id="sbText" maxlength="1500" rows="4" placeholder="What happened, or what would make it more fun?">' + esc(d.text || '') + '</textarea></label>' +
      '<div class="sbBtns"><button id="sbSubmit" class="bigBtn" type="button">\uD83D\uDE80 SUBMIT</button><button id="sbCopy" class="bigBtn alt" type="button">\uD83D\uDCCB COPY</button></div>' +
      '<div id="sbMsg" class="sbMsg">SUBMIT opens GitHub with everything filled in. COPY lets you paste it to your assistant.</div>';
    Array.prototype.forEach.call(document.querySelectorAll('.sbTypeBtn'), function (b) { b.addEventListener('click', function () { type = b.getAttribute('data-t'); Array.prototype.forEach.call(document.querySelectorAll('.sbTypeBtn'), function (x) { x.classList.toggle('on', x === b); }); saveDraft(); snd('click'); }); });
    ['sbGame', 'sbTitle', 'sbText'].forEach(function (id) { $(id).addEventListener('input', saveDraft); $(id).addEventListener('keydown', function (e) { e.stopPropagation(); }); });
    $('sbSubmit').addEventListener('click', submit); $('sbCopy').addEventListener('click', copy);
  }
  function renderMine() {
    var mine = load(K_MINE, []), board = (load(K_BOARD, null) || {}).items || [];
    if (!mine.length) { $('sbBody').innerHTML = '<div class="sbEmpty">You haven\u2019t sent any suggestions yet. Tap <b>Suggest</b> to make one!</div>'; return; }
    $('sbBody').innerHTML = mine.map(function (m, i) {
      var short = String(m.title).replace(/^\[[^\]]*\]\s*/, ''), hit = board.find(function (b) { return b.title === short && b.game === m.game; });
      return '<div class="sbItem mine"><div class="sbTop">' + (hit ? '<span class="sbSt ' + hit.st + '">' + ST[hit.st][1] + ' ' + ST[hit.st][0] + '</span>' : '<span class="sbSt sent">' + (m.via === 'Copied' ? '\uD83D\uDCCB Copied' : '\uD83D\uDCE8 Sent') + '</span>') +
        '<span class="sbGameTag">' + esc(m.game) + '</span><span class="sbType">' + esc(m.type) + '</span><button class="sbDel" data-i="' + i + '" aria-label="Remove">\u2715</button></div>' +
        '<div class="sbTitle">' + esc(short) + '</div>' + (m.text && m.text !== short ? '<div class="sbLast">' + esc(String(m.text).slice(0, 160)) + '</div>' : '') +
        '<div class="sbMeta">' + ago(m.t) + ' \u00b7 <button class="sbCopyAgain" data-i="' + i + '">copy again</button></div></div>';
    }).join('') + '<div class="sbMeta center">Status shows once your suggestion is on the Board.</div>';
    Array.prototype.forEach.call(document.querySelectorAll('.sbDel'), function (b) { b.addEventListener('click', function () { var l = load(K_MINE, []); l.splice(+b.getAttribute('data-i'), 1); store(K_MINE, l); renderMine(); snd('click'); }); });
    Array.prototype.forEach.call(document.querySelectorAll('.sbCopyAgain'), function (b) { b.addEventListener('click', function () { var m = load(K_MINE, [])[+b.getAttribute('data-i')]; if (!m) return; var s = SB.compose(m.game, m.type, String(m.title).replace(/^\[[^\]]*\]\s*/, ''), m.text); copyText(s.copy).then(function () { toast('\uD83D\uDCCB Copied!'); }); }); });
  }
  function setTab(t) {
    tab = t; Array.prototype.forEach.call(document.querySelectorAll('#sbTabs .pzTab'), function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === t); });
    if (t === 'new') renderNew(); else if (t === 'mine') renderMine(); else { renderBoard(); var c = load(K_BOARD, null); if (!c || Date.now() - c.t > 60000) fetchBoard(); }
    $('sbBody').scrollTop = 0;
  }
  SB.tab = setTab;
  function build() {
    var d = document.createElement('div'); d.id = 'sb'; d.className = 'pzOv hidden'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    d.innerHTML = '<div class="pzPanel sbPanel"><div class="pzHead"><div class="pzTitle"><b>\uD83D\uDCA1 SUGGESTION BOOTH</b><span>Patch ideas, bug reports &amp; balance tweaks</span></div><button id="sbClose" class="xBtn" aria-label="Close">&#10005;</button></div>' +
      '<div class="pzTabs" id="sbTabs"><button class="pzTab on" data-tab="new">\u270F\uFE0F Suggest</button><button class="pzTab" data-tab="mine">\uD83D\uDCC2 My suggestions</button><button class="pzTab" data-tab="board">\uD83D\uDCCB Suggestion Board</button></div>' +
      '<div class="pzScroll" id="sbBody"></div></div>';
    document.body.appendChild(d);
    $('sbClose').addEventListener('click', close);
    d.addEventListener('click', function (e) { if (e.target === d) close(); });
    Array.prototype.forEach.call(d.querySelectorAll('#sbTabs .pzTab'), function (b) { b.addEventListener('click', function () { snd('click'); setTab(b.getAttribute('data-tab')); }); });
    window.addEventListener('keydown', function (e) { if (openNow && e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } }, true);
  }
  SB.open = function (which) {
    if (!$('sb')) build();
    if (GA.UI && GA.UI.closeMenu) GA.UI.closeMenu(true);
    openNow = true; $('sb').classList.remove('hidden'); document.body.classList.add('pzOn');
    if (GA.Hub) { GA.Hub.setPaused(true); if (GA.Hub.clearInput) GA.Hub.clearInput(); } snd('open'); setTab(which || 'new');
  };
  function close() {
    if (!openNow) return; openNow = false; $('sb').classList.add('hidden'); document.body.classList.remove('pzOn'); snd('menu');
    if (GA.Hub) GA.Hub.setPaused(false);
    if (SB.onClose) SB.onClose();
  }
  SB.close = close;
  SB.isOpen = function () { return openNow; };
})();
