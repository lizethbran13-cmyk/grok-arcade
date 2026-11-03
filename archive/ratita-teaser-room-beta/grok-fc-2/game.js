/* Grok FC 2 - game: modes, leagues, cups, dream team + transfer market, live HD match, Man of the Match */
(function () {
  'use strict';
  const D = window.FC2D, H = window.FC2H, T = THREE, $ = (id) => document.getElementById(id);
  const KEY = 'grokFC2.save';
  let save; try { save = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { save = null; }
  save = Object.assign({ coins: 600, league: null, cup: null, dream: null, wx: 'sun' }, save || {});
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* private mode */ } };
  const G = window.FC2 = { save, D, H };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const crest = (t) => { const k = t.kit[0], bg = k === 'checker' ? 'repeating-conic-gradient(#dc2626 0 25%,#fff 0 50%) 0 0/10px 10px' : k === 'stripe' ? 'repeating-linear-gradient(90deg,#7dd3fc 0 5px,#fff 5px 10px)' : k; return '<span class="crest" style="background:' + bg + ';border-color:' + t.kit[1] + '"></span>'; };
  const sc = (v) => '<span class="stat s' + Math.max(5, Math.min(9, Math.floor(v / 10))) + '">' + v + '</span>';
  const toast = (m) => { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.k); toast.k = setTimeout(() => t.classList.remove('on'), 2200); };
  // dream team restore
  function restoreDream() { if (save.dream && save.dream.players && save.dream.players.length) { D.custom = { id: 'dream', n: save.dream.name, short: 'DRM', kit: save.dream.kit, lg: 'dream', nat: save.dream.type === 'nat', players: save.dream.players.map((p, i) => Object.assign({}, p, { num: [1, 4, 5, 8, 10, 9, 11][i] })), stars: [] }; } }
  restoreDream();
  /* ---------------- screens ---------------- */
  const SCR = ['sTitle', 'sTeams', 'sDream', 'sLeague', 'sCup', 'sMatch', 'sMotm'];
  function show(id) { SCR.forEach((s) => $(s).classList.toggle('hidden', s !== id)); G.scr = id; }
  G.show = show;
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (!b) return; const go = b.dataset.go; if (go === 'title') toTitle(); else if (go === 'quick') teamSelect('quick'); else if (go === 'leagues') teamSelect('league'); else if (go === 'wtc') startCup('wtc'); else if (go === 'cwc') startCup('cwc'); else if (go === 'dream') dreamHome(); });
  function toTitle() { if (match) endMatchCleanup(); show('sTitle'); showcase(); }
  $('petbar').innerHTML = D.PETS.map((p) => '<span class="pet">' + p.icon + ' <b>' + p.n + '</b> · ' + p.role + '</span>').join('');
  /* ---------------- team select ---------------- */
  let selTab = 'pcl', selTeam = null, selMode = 'quick', oppId = null;
  function teamSelect(mode) { selMode = mode; show('sTeams'); $('tTitle').textContent = mode === 'league' ? '🏆 Bootleg Leagues · pick your club' : '⚡ Quick Match · pick your team'; if (mode === 'league' && selTab === 'nat') selTab = 'pcl'; renderTeams(); }
  G.teamSelect = teamSelect;
  function renderTeams() {
    const tabs = D.LEAGUES.map((l) => [l.id, l.flag + ' ' + l.n]); if (selMode === 'quick') { tabs.push(['nat', '🌍 National Teams']); if (D.custom) tabs.push(['dream', '⭐ My Dream Team']); }
    $('lgTabs').innerHTML = tabs.map(([id, n]) => '<button data-tab="' + id + '" class="' + (id === selTab ? 'on' : '') + '">' + esc(n) + '</button>').join('');
    const teams = selTab === 'nat' ? D.NATIONS : selTab === 'dream' ? [D.custom] : D.LEAGUES.find((l) => l.id === selTab).teams;
    if (!selTeam || teams.indexOf(selTeam) < 0) selTeam = teams[0];
    $('teamList').innerHTML = teams.map((t) => '<button class="team ' + (t === selTeam ? 'on' : '') + '" data-team="' + t.id + '">' + crest(t) + '<div><b>' + esc(t.n) + '</b><br><small>OVR ' + D.strength(t) + (t.stars.length ? ' · ⭐ ' + t.stars.map((s) => esc(s.n)).join(', ') : '') + '</small></div></button>').join('');
    const t = selTeam, pool = (selTab === 'nat' ? D.NATIONS : D.ALL.filter((x) => x.lg !== 'nat')).filter((x) => x !== t);
    if (!oppId || !pool.some((x) => x.id === oppId)) oppId = pool[(Math.random() * pool.length) | 0].id;
    $('teamDetail').innerHTML = '<h3 style="margin:0 0 6px">' + crest(t) + ' ' + esc(t.n) + ' <small>OVR ' + D.strength(t) + '</small></h3>' + rosterTable(t.players) +
      (selMode === 'league' ? '<p><button class="btn" id="bStartLg">🏆 Start ' + esc(D.LEAGUES.find((l) => l.id === selTab).n) + ' season</button>' + (save.league ? ' <button class="btn ghost" id="bResumeLg">Resume saved season</button>' : '') + '</p>'
        : '<p>Opponent: <select id="oppSel">' + pool.map((x) => '<option value="' + x.id + '"' + (x.id === oppId ? ' selected' : '') + '>' + esc(x.n) + '</option>').join('') + '</select> <button class="btn" id="bKick">⚽ Kick off</button></p>');
  }
  function rosterTable(ps) { return '<table><tr><th>#</th><th>Player</th><th>POS</th><th>OVR</th><th>PAC</th><th>SHO</th><th>PAS</th><th>DRI</th><th>DEF</th><th>PHY</th></tr>' + ps.map((p) => '<tr><td>' + (p.num || '') + '</td><td>' + (p.star ? '<span class="star">⭐ ' + esc(p.n) + '</span>' : p.pet ? '<span class="star">' + p.icon + ' ' + esc(p.n) + '</span>' : esc(p.n)) + '</td><td>' + p.pos + '</td><td><b>' + D.ovr(p.s) + '</b></td>' + ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'].map((k) => '<td>' + sc(p.s[k]) + '</td>').join('') + '</tr>').join('') + '</table>'; }
  $('sTeams').addEventListener('click', (e) => {
    const tb = e.target.closest('[data-tab]'); if (tb) { selTab = tb.dataset.tab; selTeam = null; renderTeams(); return; }
    const tm = e.target.closest('[data-team]'); if (tm) { selTeam = D.team(tm.dataset.team); renderTeams(); return; }
    if (e.target.id === 'bKick') startMatch(selTeam, D.team($('oppSel').value), { mode: 'quick' });
    if (e.target.id === 'bStartLg') { newLeague(selTab, selTeam.id); leagueHub(); }
    if (e.target.id === 'bResumeLg') leagueHub();
  });
  $('sTeams').addEventListener('change', (e) => { if (e.target.id === 'oppSel') oppId = e.target.value; });
  /* ---------------- sim engine ---------------- */
  function poisson(l) { let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; }
  function pickW(ps, f) { const w = ps.map(f), tot = w.reduce((a, b) => a + b, 0); let r = Math.random() * tot; for (let i = 0; i < ps.length; i++) { r -= w[i]; if (r <= 0) return ps[i]; } return ps[ps.length - 1]; }
  function simEvents(t, n, ev, frac) {
    for (let i = 0; i < n; i++) { const sc2 = pickW(t.players, (p) => p.pos === 'GK' ? 0.05 : Math.pow(p.s.SHO / 50, 4) * (p.pos === 'FW' ? 2.5 : p.pos === 'MF' ? 1.2 : 0.4)); const as = Math.random() < 0.75 ? pickW(t.players.filter((p) => p !== sc2), (p) => Math.pow(p.s.PAS / 50, 4) * (p.pos === 'GK' ? 0.1 : 1)) : null; ev.push({ k: 'goal', t: t.id, p: sc2.n, a: as && as.n, min: (90 - 90 * frac + Math.random() * 90 * frac) | 0 }); }
    const cards = poisson(1.6 * frac); for (let i = 0; i < cards; i++) { const p = pickW(t.players, (x) => x.s.DEF / 40 + (x.pos === 'DF' ? 1 : 0.3)); ev.push({ k: Math.random() < 0.1 ? 'red' : 'yellow', t: t.id, p: p.n, min: (Math.random() * 90) | 0 }); }
  }
  function simMatch(h, a, frac, base) {
    frac = frac == null ? 1 : frac; const sh = D.strength(h), sa = D.strength(a), dif = (sh - sa) / 10;
    const hg = poisson(Math.max(0.2, (1.45 + dif * 0.55 + 0.15) * frac)), ag = poisson(Math.max(0.2, (1.25 - dif * 0.55) * frac));
    const ev = base ? base.ev : []; simEvents(h, hg, ev, frac); simEvents(a, ag, ev, frac);
    return { h: h.id, a: a.id, hg: (base ? base.hg : 0) + hg, ag: (base ? base.ag : 0) + ag, ev };
  }
  G.simMatch = simMatch;
  function motmOf(res, h, a) {
    const score = {}; const add = (tid, n, v) => { const k = tid + '|' + n; score[k] = (score[k] || 0) + v; };
    [h, a].forEach((t) => t.players.forEach((p) => add(t.id, p.n, Math.random() * 1.5 + D.ovr(p.s) / 40 + ((t.id === res.h ? res.hg > res.ag : res.ag > res.hg) ? 1 : 0))));
    res.ev.forEach((e) => { if (e.k === 'goal') { add(e.t, e.p, 3); if (e.a) add(e.t, e.a, 2); } if (e.k === 'red') add(e.t, e.p, -5); if (e.k === 'yellow') add(e.t, e.p, -0.6); });
    const best = Object.keys(score).sort((x, y) => score[y] - score[x])[0].split('|'); const t = D.team(best[0]); return { team: t, p: t.players.find((p) => p.n === best[1]), rating: Math.min(10, 6 + score[best.join('|')] / 3).toFixed(1) };
  }
  /* ---------------- leagues ---------------- */
  function newLeague(lgId, me) {
    const lg = D.LEAGUES.find((l) => l.id === lgId), ids = lg.teams.map((t) => t.id), n = ids.length, arr = ids.slice(); if (n % 2) arr.push(null);
    const rounds = []; for (let r = 0; r < arr.length - 1; r++) { const pr = []; for (let i = 0; i < arr.length / 2; i++) { const x = arr[i], y = arr[arr.length - 1 - i]; if (x && y) pr.push(r % 2 ? [y, x] : [x, y]); } rounds.push(pr); arr.splice(1, 0, arr.pop()); }
    const all = rounds.concat(rounds.map((r) => r.map(([x, y]) => [y, x])));
    const table = {}; ids.forEach((id) => { table[id] = { P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 }; });
    save.league = { lg: lgId, me, rounds: all, round: 0, table, stats: {}, results: [] }; persist();
  }
  G.newLeague = newLeague;
  function applyResult(L, r) {
    const th = L.table[r.h], ta = L.table[r.a]; if (!th || !ta) return;
    th.P++; ta.P++; th.GF += r.hg; th.GA += r.ag; ta.GF += r.ag; ta.GA += r.hg;
    if (r.hg > r.ag) { th.W++; ta.L++; th.Pts += 3; } else if (r.hg < r.ag) { ta.W++; th.L++; ta.Pts += 3; } else { th.D++; ta.D++; th.Pts++; ta.Pts++; }
    r.ev.forEach((e) => { const k = e.t + '|' + e.p, s = L.stats[k] = L.stats[k] || { n: e.p, t: e.t, g: 0, a: 0, y: 0, r: 0 }; if (e.k === 'goal') { s.g++; if (e.a) { const ka = e.t + '|' + e.a, sa = L.stats[ka] = L.stats[ka] || { n: e.a, t: e.t, g: 0, a: 0, y: 0, r: 0 }; sa.a++; } } if (e.k === 'yellow') s.y++; if (e.k === 'red') s.r++; });
    L.results.push({ h: r.h, a: r.a, hg: r.hg, ag: r.ag, rd: L.round });
  }
  function simRound(L, skipMine) { (L.rounds[L.round] || []).forEach(([h, a]) => { if (skipMine && (h === L.me || a === L.me)) return; applyResult(L, simMatch(D.team(h), D.team(a))); }); }
  G.simSeason = function (rounds) { const L = save.league; for (let i = 0; i < rounds && L.round < L.rounds.length; i++) { simRound(L, false); L.round++; } persist(); };
  const sorted = (L) => Object.keys(L.table).sort((x, y) => { const a = L.table[x], b = L.table[y]; return b.Pts - a.Pts || (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF; });
  let statTab = 'table';
  function leagueHub(tab) {
    const L = save.league; if (!L) return teamSelect('league'); if (tab) statTab = tab; show('sLeague'); const lg = D.LEAGUES.find((l) => l.id === L.lg);
    $('lgTitle').textContent = lg.flag + ' ' + lg.n + ' · Matchday ' + Math.min(L.round + 1, L.rounds.length) + '/' + L.rounds.length;
    const done = L.round >= L.rounds.length; $('lgPlay').classList.toggle('hidden', done); $('lgSim').classList.toggle('hidden', done);
    $('statTabs').innerHTML = [['table', '📊 Table'], ['scorers', '⚽ Top Scorers'], ['assists', '🎯 Top Assists'], ['cards', '🟨 Cards'], ['fixtures', '📅 Results']].map(([id, n]) => '<button data-st="' + id + '" class="' + (id === statTab ? 'on' : '') + '">' + n + '</button>').join('');
    const st = Object.values(L.stats), tn = (id) => { const t = D.team(id); return t ? crest(t) + ' ' + esc(t.n) : id; }; let h = '';
    if (statTab === 'table') { h = '<table><tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr>' + sorted(L).map((id, i) => { const r = L.table[id]; return '<tr class="' + (id === L.me ? 'me ' : '') + (i < 2 ? 'q' : '') + '"><td>' + (i + 1) + '</td><td>' + tn(id) + '</td><td>' + r.P + '</td><td>' + r.W + '</td><td>' + r.D + '</td><td>' + r.L + '</td><td>' + r.GF + '</td><td>' + r.GA + '</td><td>' + (r.GF - r.GA) + '</td><td><b>' + r.Pts + '</b></td></tr>'; }).join('') + '</table><p><small>🔷 Top 2 qualify for the Grok Club World Cup.</small>' + (done ? ' <b>Season over! Champions: ' + esc(D.team(sorted(L)[0]).n) + '</b> <button class="btn gold" data-go="cwc">🏟️ Enter Club World Cup</button>' : '') + '</p>'; }
    else if (statTab === 'scorers' || statTab === 'assists') { const k = statTab === 'scorers' ? 'g' : 'a'; h = '<table><tr><th>#</th><th>Player</th><th>Club</th><th>' + (k === 'g' ? 'Goals' : 'Assists') + '</th></tr>' + st.filter((s) => s[k] > 0).sort((a, b) => b[k] - a[k]).slice(0, 15).map((s, i) => '<tr class="' + (s.t === L.me ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + (i === 0 ? '🥇 ' : '') + esc(s.n) + '</td><td>' + tn(s.t) + '</td><td><b>' + s[k] + '</b></td></tr>').join('') + '</table>'; }
    else if (statTab === 'cards') { h = '<table><tr><th>#</th><th>Player</th><th>Club</th><th>🟨</th><th>🟥</th></tr>' + st.filter((s) => s.y + s.r > 0).sort((a, b) => (b.r * 3 + b.y) - (a.r * 3 + a.y)).slice(0, 15).map((s, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(s.n) + '</td><td>' + tn(s.t) + '</td><td>' + s.y + '</td><td>' + s.r + '</td></tr>').join('') + '</table>'; }
    else { h = '<table>' + L.results.slice().reverse().slice(0, 30).map((r) => '<tr class="' + (r.h === L.me || r.a === L.me ? 'me' : '') + '"><td>MD' + (r.rd + 1) + '</td><td>' + tn(r.h) + '</td><td><b>' + r.hg + ' - ' + r.ag + '</b></td><td>' + tn(r.a) + '</td></tr>').join('') + '</table>'; }
    $('lgBody').innerHTML = h;
  }
  G.leagueHub = leagueHub;
  $('statTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-st]'); if (b) leagueHub(b.dataset.st); });
  function myFixture(L) { return (L.rounds[L.round] || []).find(([h, a]) => h === L.me || a === L.me); }
  $('lgPlay').onclick = () => { const L = save.league, f = myFixture(L); if (!f) { simRound(L); L.round++; persist(); return leagueHub(); } startMatch(D.team(f[0]), D.team(f[1]), { mode: 'league', onEnd: (r) => { applyResult(L, r); simRound(L, true); L.round++; persist(); } }); };
  $('lgSim').onclick = () => { const L = save.league; simRound(L); L.round++; persist(); leagueHub(); };
  /* ---------------- cups ---------------- */
  function qualifyCWC() {
    const q = []; D.LEAGUES.forEach((lg) => { let tab; if (save.league && save.league.lg === lg.id && save.league.round > 0) tab = save.league; else { const keep = save.league; newLeague(lg.id, lg.teams[0].id); G.simSeason(99); tab = save.league; save.league = keep; } sorted(tab).slice(0, 2).forEach((id, i) => q.push({ id, why: (i ? '2nd' : '1st') + ' in ' + lg.n, pts: tab.table[id].Pts, rank: i })); });
    persist(); const firsts = q.filter((x) => x.rank === 0), ups = q.filter((x) => x.rank === 1).sort((a, b) => b.pts - a.pts).slice(0, 2); return firsts.concat(ups);
  }
  function startCup(kind, mine) {
    let teams, why = {};
    if (kind === 'wtc') { teams = D.NATIONS.map((t) => t.id); if (D.custom && D.custom.nat) teams[7] = 'dream'; }
    else { const q = qualifyCWC(); teams = q.map((x) => x.id); q.forEach((x) => { why[x.id] = x.why; }); if (D.custom && !D.custom.nat) { teams[7] = 'dream'; why.dream = 'Dream Team wildcard'; } }
    teams.sort(() => Math.random() - 0.5);
    const me = mine || (teams.indexOf('dream') >= 0 ? 'dream' : (save.league && teams.indexOf(save.league.me) >= 0 ? save.league.me : teams.indexOf('mnsu') >= 0 ? 'mnsu' : teams.indexOf('cro') >= 0 ? 'cro' : teams[0]));
    const r0 = []; for (let i = 0; i < 8; i += 2) r0.push({ h: teams[i], a: teams[i + 1] });
    save.cup = { kind, me, why, rounds: [r0], out: false }; persist(); cupHub();
  }
  G.startCup = startCup;
  function cupHub() {
    const C = save.cup; show('sCup'); const nm = C.kind === 'wtc' ? '🌍 World Tour Cup' : '🏟️ Grok Club World Cup', last = C.rounds[C.rounds.length - 1], champ = last.length === 1 && last[0].w;
    $('cupTitle').textContent = nm + ' · playing as ' + D.team(C.me).n; $('cupPlay').classList.toggle('hidden', !!champ || C.out && !champ);
    $('cupPlay').textContent = C.out ? '⏩ Sim the rest' : '▶ Play next round';
    if (C.out && !champ) $('cupPlay').classList.remove('hidden');
    const RN = ['Quarter-finals', 'Semi-finals', 'Final'];
    $('cupBody').innerHTML = (champ ? '<h2>🏆 Champions: ' + esc(D.team(champ).n) + '</h2>' : '') + '<div class="bracket">' + C.rounds.map((r, i) => '<div class="round"><b>' + RN[i] + '</b>' + r.map((t) => '<div class="tie">' + [t.h, t.a].map((id) => '<div class="' + (t.w === id ? 'w' : '') + '">' + crest(D.team(id)) + ' ' + esc(D.team(id).n) + (t.w ? ' <b>' + (id === t.h ? t.hg : t.ag) + '</b>' : '') + (C.why[id] && i === 0 ? '<br><small>' + esc(C.why[id]) + '</small>' : '') + '</div>').join('') + '</div>').join('') + '</div>').join('') + '</div>';
  }
  G.cupHub = cupHub;
  function finishTie(t, r) { t.hg = r.hg; t.ag = r.ag; if (r.hg === r.ag) { if (Math.random() < 0.5) t.hg++; else t.ag++; t.pens = true; } t.w = t.hg > t.ag ? t.h : t.a; }
  function advanceCup() { const C = save.cup, r = C.rounds[C.rounds.length - 1]; r.forEach((t) => { if (!t.w) finishTie(t, simMatch(D.team(t.h), D.team(t.a))); }); if (r.some((t) => (t.h === C.me || t.a === C.me) && t.w !== C.me)) C.out = true; if (r.length > 1) { const nx = []; for (let i = 0; i < r.length; i += 2) nx.push({ h: r[i].w, a: r[i + 1].w }); C.rounds.push(nx); } persist(); }
  $('cupPlay').onclick = () => { const C = save.cup; if (C.out) { while (C.rounds[C.rounds.length - 1].length > 1 || !C.rounds[C.rounds.length - 1][0].w) advanceCup(); return cupHub(); }
    const t = C.rounds[C.rounds.length - 1].find((x) => x.h === C.me || x.a === C.me); startMatch(D.team(t.h), D.team(t.a), { mode: 'cup', onEnd: (r) => { finishTie(t, r); advanceCup(); } }); };
  /* ---------------- dream team ---------------- */
  let dreamDraft = null;
  function dreamHome() {
    show('sDream'); const b = $('dreamBody');
    b.innerHTML = '<div class="bigchoice">' +
      '<button class="mode" data-dr="preclub"><b>🏟️ Pre-Customized Club Route</b><i>Take over "Grok Galácticos" (Holland, Messy, M-Bop, Lamine &amp; Candy) and chase the Club World Cup</i></button>' +
      '<button class="mode" data-dr="prenat"><b>🌍 Pre-Customized National Route</b><i>Lead the "Grok World XI" (Kidman, Holland, Messy, Cane, Torty) into the World Tour Cup</i></button>' +
      '<button class="mode hot" data-dr="custclub"><b>🛠️ Build Your Own Club Dream Team</b><i>Name, kit &amp; Transfer Market signings</i></button>' +
      '<button class="mode hot" data-dr="custnat"><b>🛠️ Build Your Own National Dream Team</b><i>Sign stars and pet legends for your own nation</i></button></div>' +
      (D.custom ? '<p>Current Dream Team: <b>' + esc(D.custom.n) + '</b> (OVR ' + D.strength(D.custom) + ') <button class="btn" data-dr="market">🔁 Transfer Market</button> <button class="btn ghost" data-dr="play">⚽ Friendly</button> <button class="btn gold" data-dr="cup">🏆 Enter ' + (D.custom.nat ? 'World Tour Cup' : 'Club World Cup') + '</button></p>' : '');
  }
  G.dreamHome = dreamHome;
  const PRE = { preclub: ['Grok Galácticos', ['#7c3aed', '#ffffff', '#7c3aed'], ['Memo Ochoa-Wall', 'Candy', 'Jude Bellingjam', 'Lamine Yappal', 'Leo Messy', 'Erling Holland', 'Kylian M-Bop']], prenat: ['Grok World XI', ['#0f766e', '#ffffff', '#facc15'], ['Torty (Martina)', 'Candy', 'Luka Kidman', 'Snowie', 'Leo Messy', 'Erling Holland', 'Harry Cane']] };
  function buildDream(name, kit, type, names) { const mk = D.market(), ps = names.map((n) => mk.find((p) => p.n === n)).filter(Boolean); save.dream = { name, kit, type, players: ps.map(clean), budget: 900 - ps.reduce((a, p) => a + p.price, 0) }; persist(); restoreDream(); }
  const clean = (p) => ({ n: p.n, pos: p.pos, s: p.s, look: p.look, star: !!p.star, pet: !!p.pet, icon: p.icon, price: p.price });
  $('dreamBody').addEventListener('click', (e) => {
    const b = e.target.closest('[data-dr]'); if (!b) return; const k = b.dataset.dr;
    if (PRE[k]) { buildDream(PRE[k][0], PRE[k][1], k === 'prenat' ? 'nat' : 'club', PRE[k][2]); toast('⭐ ' + PRE[k][0] + ' ready!'); return dreamHome(); }
    if (k === 'custclub' || k === 'custnat') { dreamDraft = { name: k === 'custnat' ? 'Lizeth United Nation' : 'Ratita Royals FC', kit: ['#f472b6', '#111827', '#f472b6'], type: k === 'custnat' ? 'nat' : 'club', players: [], budget: 900 }; return market(); }
    if (k === 'market') { dreamDraft = JSON.parse(JSON.stringify(save.dream)); return market(); }
    if (k === 'play') { const pool = D.ALL.filter((t) => (t.lg === 'nat') === !!D.custom.nat); return startMatch(D.custom, pool[(Math.random() * pool.length) | 0], { mode: 'quick' }); }
    if (k === 'cup') return startCup(D.custom.nat ? 'wtc' : 'cwc', 'dream');
  });
  let mkFilter = 'ALL';
  function market() {
    show('sDream'); const dd = dreamDraft, mk = D.market().filter((p) => mkFilter === 'ALL' || (mkFilter === 'PETS' ? p.pet : p.pos === mkFilter)), has = (n) => dd.players.some((p) => p.n === n);
    const need = { GK: 1, DF: 2, MF: 2, FW: 2 }, cnt = (pos) => dd.players.filter((p) => p.pos === pos).length;
    $('dreamBody').innerHTML = '<div class="panel"><b>' + (dd.type === 'nat' ? '🌍 National' : '🏟️ Club') + ' Dream Team</b> · Name <input id="dName" value="' + esc(dd.name) + '" maxlength="22"> Kit <input type="color" id="dKit" value="' + dd.kit[0] + '"> · 💰 Budget <b id="dBud">' + dd.budget + '</b> coins · Squad ' + dd.players.length + '/7 (GK ' + cnt('GK') + '/1 · DF ' + cnt('DF') + '/2 · MF ' + cnt('MF') + '/2 · FW ' + cnt('FW') + '/2) ' +
      '<button class="btn" id="dSave"' + (dd.players.length === 7 ? '' : ' disabled') + '>✅ Confirm squad</button></div>' +
      '<h3>📝 My Squad</h3><div class="cards">' + (dd.players.map((p) => card(p, true)).join('') || '<i>No signings yet — sign 7 players below.</i>') + '</div>' +
      '<h3>💱 Transfer Market &amp; Player Signing</h3><div class="tabs">' + ['ALL', 'GK', 'DF', 'MF', 'FW', 'PETS'].map((f) => '<button data-mf="' + f + '" class="' + (f === mkFilter ? 'on' : '') + '">' + (f === 'PETS' ? '🐾 Pet Legends' : f) + '</button>').join('') + '</div>' +
      '<div class="cards">' + mk.filter((p) => !has(p.n)).map((p) => card(p, false, cnt(p.pos) >= need[p.pos] || p.price > dd.budget)).join('') + '</div>';
    function card(p, mine, dis) { if (p.pet) p = Object.assign({}, D.PETS.find((x) => x.n === p.n) || {}, p); return '<div class="card ' + (p.pet ? 'leg ' : '') + (mine ? 'own' : '') + '"><span class="ovr">' + D.ovr(p.s) + '</span><h4>' + (p.pet ? p.icon + ' ' : p.star ? '⭐ ' : '') + esc(p.n) + '</h4><small>' + p.pos + ' · ' + esc(p.from || (p.pet ? 'Family Pet Legend' : '')) + (p.pet ? ' · ' + esc(p.kind) : '') + '</small><div class="sts">' + ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'].map((k) => '<span>' + k + ' ' + sc(p.s[k]) + '</span>').join('') + '</div>' + (mine ? '<button class="btn small ghost" data-rel="' + esc(p.n) + '">Release (+' + p.price + ')</button>' : '<button class="btn small" data-sign="' + esc(p.n) + '"' + (dis ? ' disabled' : '') + '>Sign · 💰' + p.price + '</button>') + '</div>'; }
  }
  G.market = function (type) { dreamDraft = dreamDraft || { name: 'Ratita Royals FC', kit: ['#f472b6', '#111827', '#f472b6'], type: type || 'club', players: [], budget: 900 }; market(); };
  G.sign = function (n) { const p = D.market().find((x) => x.n === n); if (!p || dreamDraft.budget < p.price) return; dreamDraft.players.push(clean(p)); dreamDraft.budget -= p.price; market(); };
  $('dreamBody').addEventListener('click', (e) => {
    if (!dreamDraft) return; const s = e.target.closest('[data-sign]'), r = e.target.closest('[data-rel]'), f = e.target.closest('[data-mf]');
    if (s) { G.sign(s.dataset.sign); toast('✍️ Signed ' + s.dataset.sign + '!'); }
    if (r) { const i = dreamDraft.players.findIndex((p) => p.n === r.dataset.rel); dreamDraft.budget += dreamDraft.players[i].price; dreamDraft.players.splice(i, 1); market(); }
    if (f) { mkFilter = f.dataset.mf; market(); }
    if (e.target.id === 'dSave') { dreamDraft.name = $('dName').value || dreamDraft.name; const c = $('dKit').value; dreamDraft.kit = [c, '#111827', c]; const ord = ['GK', 'DF', 'MF', 'FW']; dreamDraft.players.sort((a, b) => ord.indexOf(a.pos) - ord.indexOf(b.pos)); save.dream = dreamDraft; persist(); restoreDream(); dreamDraft = null; toast('⭐ Dream Team saved!'); dreamHome(); }
  });
  /* ---------------- live HD match ---------------- */
  let match = null; const keys = {}; const stick = { x: 0, y: 0 };
  addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; if (match && (e.key === ' ' || e.key.toLowerCase() === 'k')) act('shoot'); if (match && e.key.toLowerCase() === 'j') act('pass'); });
  addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
  (function () { const s = $('stick'), k = $('knob'); let id = null; const mv = (e) => { const r = s.getBoundingClientRect(), x = (e.clientX - r.left - 60) / 60, y = (e.clientY - r.top - 60) / 60, m = Math.min(1, Math.hypot(x, y)) / (Math.hypot(x, y) || 1); stick.x = x * m; stick.y = y * m; k.style.left = 38 + stick.x * 40 + 'px'; k.style.top = 38 + stick.y * 40 + 'px'; };
    s.addEventListener('pointerdown', (e) => { id = e.pointerId; s.setPointerCapture(id); mv(e); }); s.addEventListener('pointermove', (e) => { if (e.pointerId === id) mv(e); });
    const up = () => { id = null; stick.x = stick.y = 0; k.style.left = k.style.top = '38px'; }; s.addEventListener('pointerup', up); s.addEventListener('pointercancel', up); })();
  function setFP(on) { save.fp = !!on; persist(); $('bFP').textContent = save.fp ? '📺 TV CAM' : '👁 1ST PERSON'; $('bFP').classList.toggle('on', save.fp); const t = $('tFP'); if (t) t.textContent = '👁 First-Person Mode: ' + (save.fp ? 'ON' : 'OFF'); if (match) { match.fpYaw = null; if (!save.fp) match.ps.forEach((pl) => { pl.g.visible = true; }); } H.fp(save.fp && !!match); if (match) comm(save.fp ? '👁 First-person! You see through your player\'s eyes.' : '📺 Back to the TV camera.'); }
  G.setFP = setFP; $('bFP').onclick = () => setFP(!save.fp); $('tFP').onclick = () => setFP(!save.fp);
  addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'v' && !e.repeat) setFP(!save.fp); });
  $('bPass').onclick = () => act('pass'); $('bShoot').onclick = () => act('shoot'); $('bSim').onclick = () => simRest();
  $('wx').addEventListener('click', (e) => { const b = e.target.closest('[data-w]'); if (b) setWx(b.dataset.w); });
  function setWx(w) { save.wx = w; persist(); H.weather(w); [].forEach.call($('wx').children, (b) => b.classList.toggle('on', b.dataset.w === w)); if (match) comm({ sun: '☀️ Glorious sunshine over the pitch!', night: '🌙 The floodlights blaze on!', rain: '🌧️ It\'s bucketing down — slick pitch, quick passing!', snow: '❄️ Snow is falling — the orange ball comes out!' }[w]); }
  G.setWx = setWx;
  const FORM = [[-0.46, 0], [-0.3, -0.25], [-0.3, 0.25], [-0.1, -0.3], [-0.1, 0.3], [0.12, -0.15], [0.12, 0.15]];
  function comm(m) { $('comm').textContent = m; clearTimeout(comm.k); comm.k = setTimeout(() => { $('comm').textContent = ''; }, 3200); }
  function startMatch(home, away, opt) {
    if (match) endMatchCleanup(); show('sMatch'); H.buildStadium(home.kit[0] === 'checker' ? '#dc2626' : home.kit[0] === 'stripe' ? '#7dd3fc' : home.kit[0]);
    const awayKit = clash(home.kit, away.kit) ? ['#f8fafc', '#111827', '#f8fafc'] : away.kit;
    const m = match = { home, away, opt: opt || {}, t: 0, len: 150, hg: 0, ag: 0, ev: [], ps: [], over: false, kick: 0, last: [], pets: [] };
    [home, away].forEach((tm, side) => tm.players.forEach((p, i) => { const g = H.makePlayer(p, side ? awayKit : tm.kit, i === 0); H.world.add(g);
      const pl = { g, p, side, i, pos: new T.Vector3(), vel: new T.Vector3(), cd: 0, home: FORM[i] }; m.ps.push(pl); }));
    m.ball = H.makeBall(); H.world.add(m.ball); m.bp = new T.Vector3(); m.bv = new T.Vector3(); m.owner = null;
    // family pet cameos on the touchline + commentary booth
    D.PETS.forEach((pt, i) => { const g = H.makePet(pt.id, pt.id === 'torty' ? 1.3 : pt.id === 'candy' ? 1.2 : 1.1); g.position.set(-10 + i * 5, 0, -H.PH / 2 - 2.4); g.rotation.y = 0; g.userData.baseY = 0; g.userData.ph = i; H.world.add(g); m.pets.push(g); });
    const booth = H.text('🎙 TORTY & PI-RAT LIVE', 7, 1.4, '#7c2d12', '#fde68a'); booth.position.set(0, 2.2, -H.PH / 2 - 5); H.world.add(booth);
    $('hN').textContent = home.short; $('aN').textContent = away.short; setWx(save.wx || 'sun'); kickoff(0); score();
    comm('🐢 Torty: "Welcome to Grok FC 2! ' + home.n + ' vs ' + away.n + '." 🏴‍☠️ Pi-rat: "Arr, let\'s go!"');
    return m;
  }
  G.startMatch = startMatch;
  function clash(a, b) { const c = (k) => (k === 'checker' ? '#dc2626' : k === 'stripe' ? '#7dd3fc' : k); const x = new T.Color(c(a[0])), y = new T.Color(c(b[0])); return Math.abs(x.r - y.r) + Math.abs(x.g - y.g) + Math.abs(x.b - y.b) < 0.5; }
  function kickoff(side) { const m = match; m.ps.forEach((pl) => { const dir = pl.side ? -1 : 1; pl.pos.set(pl.home[0] * H.PW * dir * (pl.i ? 0.9 : 1), 0, pl.home[1] * H.PH * dir); if (pl.i === 6 && pl.side === side) pl.pos.set(-0.6 * (side ? -1 : 1), 0, 0); pl.vel.set(0, 0, 0); });
    m.bp.set(0, 0.22, 0); m.bv.set(0, 0, 0); m.owner = null; m.kick = 0.6; }
  function score() { $('hS').textContent = match.hg; $('aS').textContent = match.ag; $('clock').textContent = Math.min(90, Math.floor(match.t / match.len * 90)) + "'"; }
  const goalX = (side) => (side ? -1 : 1) * H.PW / 2; // goal a side attacks
  function speedOf(pl) { return 5.2 + pl.p.s.PAC / 22 * (H.wx === 'snow' ? 0.85 : 1); }
  function touch(pl) { const m = match; if (m.last[0] !== pl) m.last.unshift(pl); m.last.length = 3; }
  function kick(pl, target, power, lift) { const m = match, d = new T.Vector3().subVectors(target, m.bp); d.y = 0; const dist = d.length(); d.normalize(); m.bv.set(d.x * power, lift, d.z * power); m.owner = null; pl.cd = 0.45; touch(pl); m.bp.y = 0.25; return dist; }
  function act(kind) {
    const m = match; if (!m || m.over) return; const me = m.ctrl; if (!me || m.owner !== me) { if (kind === 'shoot' && me) { const own = m.owner; if (own && own.side !== me.side && me.pos.distanceTo(own.pos) < 1.6) tackle(me, own, 1.3); } return; }
    if (kind === 'shoot') shoot(me); else pass(me);
  }
  function shoot(pl) { const err = (100 - pl.p.s.SHO) / 100 * 5, tz = (Math.random() - 0.5) * (6 + err * 2), d = Math.abs(goalX(pl.side) - pl.pos.x); kick(pl, new T.Vector3(goalX(pl.side) + (pl.side ? -1 : 1), 0, tz), 20 + pl.p.s.SHO / 10, Math.min(5, 1.2 + d * 0.1 + Math.random() * 2)); if (Math.random() < 0.3) comm('💥 ' + pl.p.n + ' lets fly!'); }
  function pass(pl) { const m = match, dir = pl.side ? -1 : 1; let best = null, bs = -1e9; m.ps.forEach((o) => { if (o.side !== pl.side || o === pl || o.i === 0) return; const fwd = (o.pos.x - pl.pos.x) * dir, d = o.pos.distanceTo(pl.pos); let open = 99; m.ps.forEach((x) => { if (x.side !== pl.side) open = Math.min(open, x.pos.distanceTo(o.pos)); }); const s = fwd * 0.6 + Math.min(open, 6) * 1.5 - Math.abs(d - 12) * 0.3 + (Math.random() * 2); if (s > bs) { bs = s; best = o; } });
    if (!best) return shoot(pl); const lead = best.vel.clone().multiplyScalar(0.4), tgt = best.pos.clone().add(lead), dist = tgt.distanceTo(pl.pos); kick(pl, tgt, Math.min(24, 8 + dist * 0.9) * (0.85 + pl.p.s.PAS / 600), dist > 18 ? 3 : 0.4); }
  function tackle(by, own, k) { const m = match, ch = (0.35 + (by.p.s.DEF - own.p.s.DRI) / 120) * k; if (Math.random() < ch) { m.owner = by; touch(by); by.cd = 0; own.cd = 0.8; if (Math.random() < 0.25) comm('🛡️ Great tackle by ' + by.p.n + '!'); }
    else if (Math.random() < 0.18) { const red = Math.random() < 0.08, tm = by.side ? m.away : m.home; m.ev.push({ k: red ? 'red' : 'yellow', t: tm.id, p: by.p.n, min: Math.floor(m.t / m.len * 90) }); comm((red ? '🟥 RED CARD for ' : '🟨 Yellow card for ') + by.p.n + '! Candy: "Grrr-woof!"'); m.owner = own; own.cd = 0; by.cd = 1.5; } else by.cd = 0.6; }
  function goal(side) { const m = match, sc2 = m.last.find((x) => x.side === side), tm = side ? m.away : m.home; if (side) m.ag++; else m.hg++;
    const scorer = sc2 || m.ps.find((x) => x.side === side && x.i === 6), as = m.last.find((x) => x !== scorer && x.side === side);
    m.ev.push({ k: 'goal', t: tm.id, p: scorer.p.n, a: as && as.p.n, min: Math.floor(m.t / m.len * 90) }); score();
    comm('⚽ GOOOAL! ' + scorer.p.n + (as ? ' (assist ' + as.p.n + ')' : '') + ' for ' + tm.n + '! 🐕 Candy: "Woof! Woof!" 🐢 Torty: "Unbelievable!"'); m.cheer = 3; kickoff(side ? 0 : 1); }
  function frame(dt) {
    const m = match; if (!m || m.over) return; m.t += dt; if (m.kick > 0) m.kick -= dt; if (m.cheer > 0) m.cheer -= dt; score();
    if (m.t >= m.len) return finish();
    // pick controlled home player
    const homeOwn = m.owner && m.owner.side === 0; let best = null, bd = 1e9; if (homeOwn) best = m.owner; else m.ps.forEach((pl) => { if (pl.side || pl.i === 0) return; const d = pl.pos.distanceTo(m.bp); if (d < bd) { bd = d; best = pl; } }); m.ctrl = best;
    const ix = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0) + stick.x, iz = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0) + stick.y, human = Math.hypot(ix, iz) > 0.15;
    let mx = ix, mz = iz; if (save.fp && m.fpYaw != null) { const fx = Math.sin(m.fpYaw), fz = Math.cos(m.fpYaw); mx = fx * -iz + -fz * ix; mz = fz * -iz + fx * ix; }
    m.ps.forEach((pl) => {
      pl.cd = Math.max(0, pl.cd - dt); const dir = pl.side ? -1 : 1, mine = m.owner && m.owner.side === pl.side; let tgt;
      if (pl === m.ctrl && human) tgt = pl.pos.clone().add(new T.Vector3(mx, 0, mz).normalize().multiplyScalar(5));
      else if (pl.i === 0) { tgt = new T.Vector3(-dir * (H.PW / 2 - 1.2), 0, Math.max(-3, Math.min(3, m.bp.z * 0.4)));
        if (m.owner === pl && m.kick <= 0) { pl.hold = (pl.hold || 0) + dt; if (pl.hold > (pl.side === 1 || pl !== m.ctrl ? 1.1 : 2.6)) { pl.hold = 0; pass(pl); if (Math.random() < 0.3) comm('🧤 ' + pl.p.n + ' rolls it out!'); } } else pl.hold = 0; }
      else if (m.owner === pl) { tgt = new T.Vector3(goalX(pl.side), 0, pl.pos.z * 0.6 + Math.sin(m.t + pl.i) * 3); const dg = Math.abs(goalX(pl.side) - pl.pos.x);
        if (pl.side === 1 || pl !== m.ctrl) { let press = 99; m.ps.forEach((o) => { if (o.side !== pl.side) press = Math.min(press, o.pos.distanceTo(pl.pos)); }); if (dg < 17 && Math.random() < dt * 1.8) shoot(pl); else if (press < 2.2 && Math.random() < dt * (1 + pl.p.s.PAS / 40)) pass(pl); else if (Math.random() < dt * 0.25) pass(pl); } }
      else { const chaser = !mine && nearest(pl.side) === pl; if (chaser) tgt = m.bp.clone(); else { const sh = Math.max(-0.25, Math.min(0.25, m.bp.x / H.PW)); tgt = new T.Vector3((pl.home[0] * dir + sh + (mine ? 0.12 * dir : 0)) * H.PW, 0, pl.home[1] * dir * H.PH + m.bp.z * 0.3); } }
      if (m.kick > 0) tgt = pl.pos.clone();
      const d = tgt.sub(pl.pos); d.y = 0; const len = d.length(), sp = speedOf(pl) * (m.owner === pl ? 0.86 : 1) * (pl === m.ctrl || len > 2 ? 1 : 0.5);
      const want = len > 0.2 ? d.multiplyScalar(sp / len) : new T.Vector3(); const grip = H.wx === 'rain' ? 4 : H.wx === 'snow' ? 3 : 8; pl.vel.lerp(want, Math.min(1, dt * grip)); pl.pos.addScaledVector(pl.vel, dt);
      pl.pos.x = Math.max(-H.PW / 2 - 1, Math.min(H.PW / 2 + 1, pl.pos.x)); pl.pos.z = Math.max(-H.PH / 2 - 1, Math.min(H.PH / 2 + 1, pl.pos.z));
      pl.g.position.copy(pl.pos); const v = pl.vel.length(); if (v > 0.3) pl.g.rotation.y = Math.atan2(pl.vel.x, pl.vel.z); else if (m.owner !== pl) pl.g.rotation.y = Math.atan2(m.bp.x - pl.pos.x, m.bp.z - pl.pos.z); H.animPlayer(pl.g, v, m.t);
      // possession
      if (!m.owner && pl.cd <= 0 && m.bp.y < 1.2 && pl.pos.distanceTo(m.bp) < (pl.i === 0 ? 1.4 : 0.8)) { if (pl.i === 0 && m.bv.length() > 8 && Math.random() > 0.35 + pl.p.s.DEF / 300) { pl.cd = 0.4; } else { if (pl.i === 0 && m.bv.length() > 8) comm('🧤 Big save by ' + pl.p.n + '!'); m.owner = pl; touch(pl); } }
      if (m.owner && m.owner.side !== pl.side && pl.cd <= 0 && pl.i !== 0 && pl.pos.distanceTo(m.owner.pos) < 0.9 && (pl.side === 1 || pl !== m.ctrl || !human)) tackle(pl, m.owner, dt * 3);
    });
    // ball
    if (m.owner) { const o = m.owner, f = new T.Vector3(Math.sin(o.g.rotation.y), 0, Math.cos(o.g.rotation.y)); m.bp.set(o.pos.x + f.x * 0.55, 0.22, o.pos.z + f.z * 0.55); m.bv.copy(o.vel); m.ball.rotation.x += o.vel.length() * dt * 2; }
    else { m.bv.y -= 9.8 * dt; m.bp.addScaledVector(m.bv, dt); if (m.bp.y < 0.22) { m.bp.y = 0.22; m.bv.y = -m.bv.y * (H.wx === 'snow' ? 0.25 : 0.45); const fr = H.wx === 'rain' ? 0.6 : H.wx === 'snow' ? 1.6 : 1.0; m.bv.x *= Math.max(0, 1 - fr * dt); m.bv.z *= Math.max(0, 1 - fr * dt); } m.ball.rotation.x += m.bv.length() * dt * 3; }
    if (Math.abs(m.bp.x) > H.PW / 2) { if (Math.abs(m.bp.z) < 3.6 && m.bp.y < 2.44) return goal(m.bp.x > 0 ? 0 : 1); const def = m.bp.x > 0 ? 1 : 0, gk = m.ps.find((x) => x.side === def && x.i === 0); m.bp.set(gk.pos.x, 0.22, gk.pos.z); m.bv.set(0, 0, 0); m.owner = gk; touch(gk); }
    if (Math.abs(m.bp.z) > H.PH / 2 + 0.5) { const last = m.last[0], side = last ? 1 - last.side : 0, near = nearestTo(side, m.bp); m.bp.z = Math.sign(m.bp.z) * H.PH / 2; m.bv.set(0, 0, 0); near.pos.set(m.bp.x, 0, m.bp.z); m.owner = near; touch(near); }
    // anti-stuck watchdog: a dead ball nobody reaches, or someone hogging it, gets moving again
    if (!m.owner && m.bv.length() < 0.15) { m.dead = (m.dead || 0) + dt; if (m.dead > 3) { m.dead = 0; const n0 = nearestTo(0, m.bp, true), n1 = nearestTo(1, m.bp, true), nn = n0.pos.distanceTo(m.bp) < n1.pos.distanceTo(m.bp) ? n0 : n1; nn.cd = 0; nn.pos.set(m.bp.x - 0.3, 0, m.bp.z); m.owner = nn; touch(nn); } } else m.dead = 0;
    if (m.owner) { if (m.hogBy === m.owner) m.hog += dt; else { m.hogBy = m.owner; m.hog = 0; } if (m.hog > (m.owner === m.ctrl ? 12 : 6)) { m.hog = 0; pass(m.owner); } } else m.hogBy = null;
    if (!isFinite(m.bp.x) || !isFinite(m.bp.z) || !isFinite(m.bp.y)) kickoff(0);
    m.ball.position.copy(m.bp);
    m.pets.forEach((g, i) => { g.rotation.y = Math.atan2(m.bp.x - g.position.x, m.bp.z - g.position.z) * 0.5; g.userData.bob(m.t, m.cheer > 0 ? 3 : 0); });
    H.cheer(m.t, m.cheer > 0 ? 1 : 0.15);
    // first-person camera: at the controlled player's eyes
    m.ps.forEach((pl) => { pl.g.visible = !(save.fp && (pl === m.ctrl || Math.hypot(pl.pos.x - H.cam.position.x, pl.pos.z - H.cam.position.z) < 1.1)); });
    if (save.fp && m.ctrl) { const c = m.ctrl, owns = m.owner === c, toB = Math.atan2(m.bp.x - c.pos.x, m.bp.z - c.pos.z), v = c.vel.length();
      let want = owns ? (v > 1 ? Math.atan2(c.vel.x, c.vel.z) : (m.fpYaw != null ? m.fpYaw : toB)) : toB; if (m.fpYaw == null || m.fpCtl !== c) { m.fpYaw = owns ? (c.side ? -Math.PI / 2 : Math.PI / 2) : toB; m.fpCtl = c; }
      let dy = want - m.fpYaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); m.fpYaw += dy * Math.min(1, dt * (owns ? 2.2 : 5));
      const fx = Math.sin(m.fpYaw), fz = Math.cos(m.fpYaw), bob = Math.sin(m.t * 11) * 0.035 * Math.min(1, v / 6);
      const eye = new T.Vector3(c.pos.x - fx * 1.2, 1.68 + bob, c.pos.z - fz * 1.2); H.cam.position.lerp(eye, Math.min(1, dt * 14));
      const bd = Math.hypot(m.bp.x - eye.x, m.bp.z - eye.z), look = owns || bd < 2.5 ? new T.Vector3(eye.x + fx * 4.4, 0, eye.z + fz * 4.4) : new T.Vector3(m.bp.x, Math.min(m.bp.y, 3), m.bp.z);
      H.cam.lookAt(look); H.fp(true); return; }
    H.fp(false);
    // broadcast camera
    const port = innerWidth < innerHeight, cx = m.bp.x * (port ? 0.95 : 0.8), cz = port ? m.bp.z + 30 : 34 + m.bp.z * 0.25;
    H.cam.position.lerp(new T.Vector3(cx, port ? 30 : 24, cz), Math.min(1, dt * 3)); H.cam.lookAt(m.bp.x * 0.9, 0, m.bp.z * 0.55);
  }
  G.frame = frame; G.cur = () => match;
  function nearest(side) { return nearestTo(side, match.bp, true); }
  function nearestTo(side, p, noGk) { let b = null, bd = 1e9; match.ps.forEach((pl) => { if (pl.side !== side || (noGk && pl.i === 0)) return; const d = pl.pos.distanceTo(p); if (d < bd) { bd = d; b = pl; } }); return b; }
  function simRest() { const m = match; if (!m || m.over) return; const frac = Math.max(0, 1 - m.t / m.len); const r = simMatch(m.home, m.away, frac, { hg: m.hg, ag: m.ag, ev: m.ev }); m.hg = r.hg; m.ag = r.ag; m.t = m.len; score(); finish(); }
  G.simRest = simRest;
  function finish() { const m = match; m.over = true; const res = { h: m.home.id, a: m.away.id, hg: m.hg, ag: m.ag, ev: m.ev }; m.res = res; comm('🏁 Full time! ' + m.home.short + ' ' + m.hg + ' - ' + m.ag + ' ' + m.away.short); setTimeout(() => { if (match !== m) return; try { ceremony(res); } catch (e) { console.error(e); endMatchCleanup(); if (m.opt.onEnd) m.opt.onEnd(res); toTitle(); } }, 900); }
  /* ---------------- HD Man of the Match ---------------- */
  function ceremony(res) {
    const m = match, mm = motmOf(res, m.home, m.away); m.motm = mm;
    m.ps.forEach((x) => { x.g.visible = false; }); m.ball.visible = false; m.pets.forEach((g) => { g.visible = false; }); H.buildCeremony(); const pg = H.makePlayer(mm.p, mm.team.kit[0] ? mm.team.kit : ['#fff', '#111', '#fff'], mm.p.pos === 'GK'); pg.position.set(0, 1.3, 0); pg.rotation.y = 0.2; H.world.add(pg);
    if (pg.userData.arms) { pg.userData.arms[0].rotation.z = -2.6; pg.userData.arms[1].rotation.z = 2.6; }
    const ring = [[-3.2, 0.5, 1.2, 0.6], [-1.8, 0.5, 3, 0.3], [2.2, 0.5, 3, -0.3], [3.4, 0.5, 1, -0.6], [0, 0.5, 3.6, 0]];
    m.cpets = D.PETS.map((pt, i) => { const g = H.makePet(pt.id, pt.id === 'torty' ? 1.6 : 1.5); const r = ring[i]; g.position.set(r[0], r[1], r[2]); g.userData.baseY = r[1]; g.userData.ph = i; g.rotation.y = r[3] + Math.PI; g.lookAt(0, 0.5, 9); H.world.add(g); return g; });
    m.ceremonyT = 0; show('sMotm');
    $('mName').textContent = '🏅 ' + mm.p.n; const g = res.ev.filter((e) => e.k === 'goal' && e.p === mm.p.n).length, a = res.ev.filter((e) => e.k === 'goal' && e.a === mm.p.n).length;
    $('mLine').textContent = mm.team.n + ' · Rating ' + mm.rating + ' · ' + g + ' goal' + (g === 1 ? '' : 's') + ', ' + a + ' assist' + (a === 1 ? '' : 's') + ' · Final: ' + m.home.short + ' ' + res.hg + '-' + res.ag + ' ' + m.away.short;
    $('mPets').innerHTML = '🐀 Luna presents the trophy · 🏴‍☠️ Pi-rat: "Arr, man of the match!" · ❄️ Snowie throws confetti · 🐕 Candy: "Woof!" · 🐢 Torty (Martina): "A masterclass."';
    save.coins += 25 + g * 10; persist();
  }
  G.ceremony = ceremony;
  $('mDone').onclick = () => { const m = match, res = m.res, opt = m.opt; endMatchCleanup(); if (opt.onEnd) opt.onEnd(res); if (opt.mode === 'league') leagueHub('table'); else if (opt.mode === 'cup') cupHub(); else toTitle(); };
  function endMatchCleanup() { match = null; H.fp(false); H.clear(); }
  /* ---------------- title showcase (3D backdrop) ---------------- */
  function showcase() {
    H.buildStadium('#7dd3fc'); H.weather('night'); const holl = D.team('mnsu').players.find((p) => p.n === 'Erling Holland'), kid = D.team('cro').players.find((p) => p.n === 'Luka Kidman');
    const a = H.makePlayer(holl, D.team('mnsu').kit), b = H.makePlayer(kid, D.team('cro').kit); a.position.set(-1.2, 0, 0); b.position.set(1.2, 0, 0); a.rotation.y = 0.5; b.rotation.y = -0.5; H.world.add(a); H.world.add(b);
    D.PETS.forEach((pt, i) => { const g = H.makePet(pt.id, 1.2); g.position.set(-4 + i * 2, 0, 2.6); g.userData.ph = i; g.userData.baseY = 0; H.world.add(g); H.anims.push((dt, t) => g.userData.bob(t, 0.5)); });
    const ball = H.makeBall(); ball.position.set(0, 0.22, 0.8); H.world.add(ball); H.anims.push((dt, t) => { ball.rotation.y = t; H.cam.position.set(Math.sin(t * 0.15) * 9, 3.2, 9 + Math.cos(t * 0.15) * 1.5); H.cam.lookAt(0, 1.3, 0); });
  }
  /* ---------------- loop ---------------- */
  H.init($('c')); setFP(save.fp); let lt = performance.now(), tt = 0;
  function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.05, Math.max(0, (now - lt) / 1000)); lt = now; tt += dt;
    try { if (match && !match.over) frame(dt);
      if (match && match.over && match.cpets) { match.ceremonyT += dt; const k = match.ceremonyT; H.cam.position.set(Math.sin(k * 0.25) * 6.5, 6.2, 12); H.cam.lookAt(0, 0.2, 0); match.cpets.forEach((g) => g.userData.bob(tt, 2)); }
      H.tick(dt, tt); if (!H.lost) H.R.render(H.scene, H.cam); } catch (e) { console.error('FC2 frame', e); if (match && !match.over) { try { kickoff(0); } catch (e2) { /* ignore */ } } } }
  // iPhone can drop the WebGL context under memory pressure: recover instead of freezing on a black screen
  $('c').addEventListener('webglcontextlost', (e) => { e.preventDefault(); H.lost = true; });
  $('c').addEventListener('webglcontextrestored', () => { H.lost = false; if (match) { const mm = match; endMatchCleanup(); toast('Graphics reset - restarting match'); startMatch(mm.home, mm.away, mm.opt); } else toTitle(); });
  document.addEventListener('visibilitychange', () => { lt = performance.now(); });
  toTitle(); requestAnimationFrame(loop);
})();
