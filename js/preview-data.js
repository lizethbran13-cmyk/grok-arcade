/* Grok Arcade - RATITA PREVIEW CENTER data (booth: Preview Center). See PREVIEW.md.
   preview.json (in this repo) lists upcoming builds/DLC ("items") and playable work-in-progress snapshots ("previews").
   It is merged with the LIVE GitHub issues on grok-arcade (labels dlc / suggestion), the same way the DLC Board reads them:
     open + "in-progress" -> BUILDING NOW, open -> UP NEXT, closed + "shipped" -> JUST SHIPPED (closed as not planned/wontfix -> hidden).
   New booth ideas show up on their own (no code change), and preview.json fills in nicer names/descriptions.
   Offline: the last good copy from localStorage, then the bundled fallback below. */
(function () {
  'use strict';
  var PV = GA.PVD = {}, REPO = 'lizethbran13-cmyk/grok-arcade', ORIGIN = 'https://lizethbran13-cmyk.github.io/';
  var API = 'https://api.github.com/repos/' + REPO + '/issues?state=all&per_page=60&sort=updated';
  var K_ISS = 'grokArcade.pvIssues', K_JSON = 'grokArcade.pvJson';
  PV.REPO = REPO; PV.ORIGIN = ORIGIN;
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  // bundled fallback (a copy of preview.json at ship time) so a first offline visit still has a schedule
  PV.FALLBACK = { updated: '2026-10-16', archive: [{ id: 'skytours', game: 'skytours', name: 'Grok Snowie Sky Tours', label: 'Final Beta (Time Jumper)', url: 'archive/skytours-beta/', built: '2026-10-16', archived: '2026-10-16', notes: 'The last Time Jumper build of Grok Snowie Sky Tours before release.', playable: true }, { id: 'ruffsources', game: 'ruffsources', name: 'Grok Ruffsources HQ', label: 'Final Beta (Time Jumper)', url: 'archive/ruffsources-beta/', built: '2026-10-16', archived: '2026-10-16', notes: 'The last Time Jumper build of Grok Ruffsources HQ before release.', playable: true }, { id: 'pumpkinhollow', game: 'pumpkinhollow', name: 'Grok Pumpkin Hollow', label: 'Final Beta (Time Jumper)', url: 'archive/pumpkinhollow-beta/', built: '2026-10-12', archived: '2026-10-12', notes: 'The last Time Jumper build of Grok Pumpkin Hollow before release.', playable: true }, { id: 'relics', game: 'relics', name: 'Grok Lost Relics', label: 'Final Beta (Time Jumper)', url: 'archive/relics-beta/', built: '2026-10-11', archived: '2026-10-11', notes: 'The last Time Jumper build before launch: all 5 expeditions, the Relic Museum hub and 3-player co-op.', playable: true }, { id: 'puptown', game: 'puptown', name: 'Grok Pup Town', label: 'Final Beta (Time Jumper)', url: 'archive/puptown-beta/', built: '2026-10-11', archived: '2026-10-11', notes: 'Early look! The whole town is walkable: square + fountain, 8 buildings to explore, Paw Park, the Golden Bone mystery and mini-games. Still being polished.', playable: true }, { id: 'pirate-pack', game: 'ratita', issue: 29, name: 'Pi-rat the Pirate Pack', label: 'Final Beta (Time Jumper)', url: 'archive/pirate-pack-beta/', built: '2026-10-11', archived: '2026-10-11', notes: 'Full campaign is playable: sail the Salty Cheddar, 5 islands, 5 bosses, Dresser Shop. Still polishing.', playable: true }, { id: 'rides-remastered', game: 'rides', name: 'Grok Rides Remastered', label: 'Final Beta (Time Jumper)', url: 'archive/rides-remastered-beta/', built: '2026-10-11', archived: '2026-10-11', notes: 'Early build on the Tempest engine: drive the whole map, 31 vehicles, traffic, jobs, races, homes. Still being polished.', playable: true }, { id: 'eatsville', game: 'eatsville', name: 'Grok Eatsville Tycoon', label: 'Final Beta (Time Jumper)', url: 'archive/eatsville-beta/', built: '2026-10-11', archived: '2026-10-11', notes: 'Co-op for 3 is in! Plus delivery orders, house decorating (paint, floors, furniture), the food critic, 10 hidden Golden Spatulas, cozier diners and a smoother phone feel.', playable: true }, { id: 'torty', game: 'torty', name: 'Grok Torty Town', label: 'Final Beta (Time Jumper)', url: 'archive/torty-beta/', built: '2026-10-12', archived: '2026-10-12', notes: 'WIP build: oasis square, Market Street, the Burrows, Hot Spring Hill, Slow-Mo Derby, lettuce farm, dunes, Tortuga Tech Inc. campus, NEW Old Adobe Quarter (bakery, music hall, toy shop) and Fiesta Plaza (cinema, ice cream, taco truck). Lighter on memory: loads with about half the peak memory, flat while exploring.', playable: true }, { id: 'northpole', game: 'northpole', name: 'Grok North Pole Village', label: 'Final Beta (Time Jumper)', url: 'archive/northpole-beta/', built: '2026-10-12', archived: '2026-10-12', notes: 'The last Time Jumper build of Grok North Pole Village before release.', playable: true }, { id: 'np-merry-tracking', game: 'northpole', issue: 43, name: 'Merry Tracking Expansion', label: 'Final Beta (Time Jumper)', url: 'archive/np-merry-tracking-beta/', built: '2026-10-12', archived: '2026-10-12', notes: 'North Pole Sleigh Port + all 5 walk-in Regional Tracking Centers (preparing until Dec 24; add ?npdate=2026-12-24 to see them fully online)', playable: true }, { id: 'np-merry-events', game: 'northpole', issue: 44, name: 'Merry Events Expansion', label: 'Final Beta (Time Jumper)', url: 'archive/np-merry-events-beta/', built: '2026-10-12', archived: '2026-10-12', notes: 'North Pole Event Center on the real calendar. Test dates: ?npdate=2026-10-14 (Reindeer Games live), 2026-10-31 (Halloween Party), 2026-11-26 (Elf Parade), 2026-12-25 (Christmas Day Party)', playable: true }], items: [{ game: 'ruffsources', name: 'Grok Ruffsources HQ (live)', stage: 'shipped', when: 'Oct 16', shippedAt: '2026-10-16T21:30:00Z' }, { game: 'skytours', name: 'Grok Snowie Sky Tours (live)', stage: 'shipped', when: 'Oct 16', shippedAt: '2026-10-16T21:30:00Z' }, { game: 'pumpkinhollow', name: 'Grok Pumpkin Hollow (live)', stage: 'shipped', when: 'Oct 12', shippedAt: '2026-10-12T21:50:00Z' }, { game: 'northpole', name: 'Grok North Pole Village (live)', stage: 'shipped', when: 'Oct 12', shippedAt: '2026-10-12T21:00:00Z' }, { game: 'torty', name: 'Grok Torty Town (live)', stage: 'shipped', when: 'Oct 11', shippedAt: '2026-10-12T05:50:00Z' }, { game: 'rides', name: 'Grok Rides Remastered (live)', stage: 'shipped', when: 'Oct 11', shippedAt: '2026-10-11T20:55:00Z' }, { game: 'eatsville', name: 'Grok Eatsville Tycoon (live)', stage: 'shipped', when: 'Oct 11', shippedAt: '2026-10-11T22:05:00Z' }, { game: 'relics', name: 'Grok Lost Relics (live)', stage: 'shipped', when: 'Oct 11', shippedAt: '2026-10-11T23:55:00Z' }, { game: 'puptown', name: 'Grok Pup Town (live)', stage: 'shipped', when: 'Oct 11', shippedAt: '2026-10-11T09:10:00Z' }, { game: 'arcade', name: 'Ratita Preview Center (live)', stage: 'shipped', when: 'Oct 11', shippedAt: '2026-10-11T06:20:00Z' }, { issue: 38, game: 'puptown', name: 'Ratita Super Expansion (live)', stage: 'shipped', when: 'Oct 11', shippedAt: '2026-10-11T22:55:00Z' }, { issue: 40, game: 'grid', name: 'Super Grid Expansion (live)', stage: 'shipped', when: 'Oct 11', shippedAt: '2026-10-11T22:45:00Z' }, { issue: 39, game: 'sports', name: 'Ratita Stadium Night (live)', stage: 'shipped', when: 'Oct 11', shippedAt: '2026-10-12T00:10:00Z' }, { issue: 41, game: 'fc', name: 'Fiesta Kits (live)', stage: 'shipped', when: 'Oct 12', shippedAt: '2026-10-12T16:30:00Z' }, { issue: 27, game: 'life', name: 'Good Life Pack (live)', stage: 'shipped', when: 'Oct 11', shippedAt: '2026-10-11T16:40:00Z' }, { issue: 28, game: 'kart', name: 'Super Kart Expansion (live)', stage: 'shipped', when: 'Oct 11', shippedAt: '2026-10-11T17:55:00Z' }, { issue: 29, game: 'ratita', name: 'Pi-rat the Pirate Pack (live)', stage: 'shipped', when: 'Oct 11', shippedAt: '2026-10-11T17:20:00Z' }, { issue: 30, game: 'detective', name: 'Midnight Express (live)', stage: 'shipped', when: 'Oct 11', shippedAt: '2026-10-11T16:30:00Z' }, { issue: 31, game: 'party', name: 'Fiesta Fits (live)', stage: 'shipped', when: 'Oct 11', shippedAt: '2026-10-11T17:45:00Z' }, { game: 'ratitahq', name: 'Ratita HQ (live)', stage: 'shipped', when: 'Oct 11', shippedAt: '2026-10-11T05:00:00Z' }, { issue: 32, game: 'arcade', name: 'Records Annex', stage: 'shipped', when: 'Oct 10' }, { issue: 26, game: 'disaster', name: 'Super Thunder Expansion', stage: 'shipped', when: 'Oct 10' }, { issue: 24, game: 'pickle', name: 'Pickle Smash Expansion', stage: 'shipped', when: 'Oct 10' }, { issue: 23, game: 'spooks', name: 'Ratita Industries Super Pack', stage: 'shipped', when: 'Oct 10' }, { issue: 25, game: 'sports', name: 'Stuck camera fix', stage: 'shipped', when: 'Oct 10' }], previews: [] };
  PV.state = { json: null, issues: null, src: 'fallback', issuesAt: 0, err: null, loading: false };
  PV.listeners = [];
  PV.onChange = function (f) { PV.listeners.push(f); };
  function changed() { PV._model = null; PV.listeners.forEach(function (f) { try { f(); } catch (e) { if (window.console) console.warn('preview listener', e); } }); }

  /* ---------- helpers ---------- */
  function gameFromTitle(t) { // "[Grok Kart Party] DLC: Super kart expansion" -> {gid, name}
    var m = /^\s*\[([^\]]{1,40})\]\s*(.*)$/.exec(t || ''), gname = m ? m[1].trim() : '', rest = (m ? m[2] : t || '').replace(/^\s*DLC\s*:\s*/i, '').trim();
    var g = GA.MAIN_GAMES.find(function (x) { return x.name.toLowerCase() === gname.toLowerCase(); });
    return { gid: g ? g.id : /arcade/i.test(gname) ? 'arcade' : 'other', gname: g ? g.name : gname || 'Grok Arcade', name: rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : 'Mystery build' };
  }
  PV.gameFromTitle = gameFromTitle;
  function labs(it) { return (it.labels || []).map(function (l) { return String(l.name || l).toLowerCase(); }); }
  PV.stageOf = function (it) {
    var l = labs(it); if (l.indexOf('dlc') < 0 && l.indexOf('suggestion') < 0) return null;
    if (l.indexOf('shipped') >= 0) return 'shipped';
    if (it.state === 'closed') return l.indexOf('wontfix') >= 0 || it.state_reason === 'not_planned' ? null : 'shipped';
    return l.indexOf('in-progress') >= 0 ? 'building' : 'queued';
  };
  PV.gameName = function (gid) { if (gid === 'arcade') return 'Grok Arcade'; var g = GA.findGame && GA.findGame(gid); return g ? g.name : 'Grok Arcade'; };
  PV.cover = function (gid) { var d = GA.HALL_DATA && GA.HALL_DATA[gid]; return d && d.cover ? d.cover : null; };
  PV.safeUrl = function (u) { // previews must live on the arcade's own GitHub Pages site (like versions/)
    if (typeof u !== 'string' || !u) return null; try { var a = new URL(u, location.href); if (a.href.indexOf(ORIGIN) === 0 || a.origin === location.origin) return a.href; } catch (e) {} return null; };

  /* ---------- the merged model: { building:[], queued:[], shipped:[], posters:[], previews:[] } ---------- */
  PV.model = function () {
    if (PV._model) return PV._model;
    var J = PV.state.json || PV.FALLBACK, items = (J.items || []).map(function (x) { return Object.assign({}, x); }), byIssue = {}, out = [];
    items.forEach(function (x) { if (x.issue) byIssue[x.issue] = x; });
    var iss = PV.state.issues;
    (iss || []).forEach(function (it) {
      if (it.pull_request) return; var stg = PV.stageOf(it), j = byIssue[it.number], tg = gameFromTitle(it.title);
      if (!stg) { if (j) j._hide = true; return; }
      var o = j || { issue: it.number, game: tg.gid, name: tg.name, auto: true }; o.stage = stg; o.live = true; o.url = it.html_url; o.upd = Date.parse(it.updated_at) || 0; o.closed = Date.parse(it.closed_at) || 0; o.title = it.title;
      o.kind = labs(it).indexOf('dlc') >= 0 ? 'dlc' : 'build';
      if (!j) { o.gname = tg.gname; items.push(o); }
    });
    items.forEach(function (x) { if (x._hide) return; x.gname = x.gname || PV.gameName(x.game); x.kind = x.kind || (x.size ? 'dlc' : 'build'); if (!x.url && x.issue) x.url = 'https://github.com/' + REPO + '/issues/' + x.issue; out.push(x); });
    var order = {}; (J.items || []).forEach(function (x, i) { order[x.issue || x.key] = i; });
    function ord(x) { var k = x.issue || x.key; return k in order ? order[k] : 1000 + (x.issue || 0); }
    var M = { building: out.filter(function (x) { return x.stage === 'building'; }).sort(function (a, b) { return ord(a) - ord(b); }),
      queued: out.filter(function (x) { return x.stage === 'queued'; }).sort(function (a, b) { return ord(a) - ord(b); }),
      shipped: out.filter(function (x) { if (x.stage === 'shipped' && !x.closed && x.shippedAt) x.closed = Date.parse(x.shippedAt) || 0; return x.stage === 'shipped'; }).sort(function (a, b) { return (b.closed || 0) - (a.closed || 0) || ord(a) - ord(b); }).slice(0, 6) };
    M.posters = M.building.concat(M.queued);
    // Time Jumper: only entries that say playable, point at this site, and whose build hasn't shipped for real yet
    var shippedIssue = {}; out.forEach(function (x) { if (x.stage === 'shipped' && x.issue) shippedIssue[x.issue] = 1; });
    M.previews = (J.previews || []).filter(function (p) { return p && p.playable === true && p.id && PV.safeUrl(p.url) && !(p.issue && shippedIssue[p.issue]); })
      .map(function (p) { return Object.assign({}, p, { url: PV.safeUrl(p.url), gname: PV.gameName(p.game) }); });
    // Save Booth: the LAST preview of every game that shipped, archived forever (archive/<id>-beta/, own grokBeta.<id>. saves)
    M.archive = (J.archive || []).filter(function (p) { return p && p.id && PV.safeUrl(p.url); })
      .map(function (p) { return Object.assign({}, p, { url: PV.safeUrl(p.url), gname: PV.gameName(p.game), label: p.label || PV.BETA_LABEL }); });
    var arch = {}; M.archive.forEach(function (p) { arch[p.id] = 1; });
    M.previews = M.previews.filter(function (p) { return !arch[p.id]; });
    M.pending = M.previews.map(function (p) { return Object.assign({}, p, { vault: 'In the Jumper now (will be archived at release)' }); });
    M.updated = J.updated || ''; M.src = PV.state.src; M.live = !!iss;
    PV._model = M; return M;
  };

  /* ---------- Save Booth betas -> the game's Hall of Records 'Old Versions' ---------- */
  PV.BETA_LABEL = 'Final Beta (Time Jumper)';
  PV.betasFor = function (gid) { var m = PV.model(); return (m.archive || []).filter(function (p) { return p.game === gid; }).map(function (p) {
    return { label: 'beta-' + p.id, ver: 'Final Beta', title: p.label + (p.archived ? ' \u00b7 archived ' + p.archived : ''), url: p.url, thumb: PV.cover(gid) || 'icon.svg', beta: true, notes: p.notes || '' }; }); };
  PV.mergeBetas = function (gid, d) { if (!d || !Array.isArray(d.versions)) return d; var b = PV.betasFor(gid), sig = b.map(function (v) { return v.label + v.url; }).join('|');
    if (d._betaSig === sig) return d; d.versions = b.concat(d.versions.filter(function (v) { return !v.beta; })); d._betaSig = sig; return d; }; // the beta came before the real release, so it sits first (oldest)
  function mergeAll() { var H = GA.HALL_DATA; if (H) Object.keys(H).forEach(function (k) { PV.mergeBetas(k, H[k]); }); }
  PV.listeners.push(mergeAll);

  /* ---------- loading ---------- */
  PV.setJson = function (j, src) { if (j && Array.isArray(j.items)) { PV.state.json = j; PV.state.jsonSrc = src || 'file'; if (src !== 'cache') store(K_JSON, { t: Date.now(), j: j }); changed(); } };
  PV.setIssues = function (a, src) { if (Array.isArray(a)) { PV.state.issues = a; PV.state.src = src || 'live'; if (src !== 'cache') { PV.state.issuesAt = Date.now(); store(K_ISS, { t: Date.now(), items: a.map(function (i) { return { number: i.number, title: i.title, state: i.state, state_reason: i.state_reason, labels: labs(i), html_url: i.html_url, updated_at: i.updated_at, closed_at: i.closed_at, pull_request: i.pull_request ? 1 : undefined }; }) }); } changed(); } };
  PV.loadCached = function () { var c = load(K_JSON, null); if (c && c.j) PV.setJson(c.j, 'cache'); var ci = load(K_ISS, null); if (ci && ci.items) { PV.setIssues(ci.items, 'cache'); PV.state.issuesAt = ci.t || 0; } };
  PV.refresh = function (force) {
    if (PV.state.loading) return Promise.resolve(false);
    var fresh = Date.now() - (PV.state.issuesAt || 0) < 5 * 60000; PV.state.loading = true; PV.state.err = null;
    var pj = fetch('preview.json?t=' + Math.floor(Date.now() / 60000), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('json ' + r.status); return r.json(); }).then(function (j) { PV.setJson(j, 'file'); }).catch(function () {});
    var pi = (fresh && !force) ? Promise.resolve() : fetch(API, { headers: { Accept: 'application/vnd.github+json' } }).then(function (r) { if (!r.ok) { var e = new Error('http ' + r.status); e.status = r.status; throw e; } return r.json(); })
      .then(function (a) { PV.setIssues(a, 'live'); }).catch(function (e) { PV.state.err = !navigator.onLine || !e.status ? 'offline' : (e.status === 403 || e.status === 429) ? 'ratelimit' : 'http'; changed(); });
    return Promise.all([pj, pi]).then(function () { PV.state.loading = false; return true; });
  };
  // a preview is only offered once its page really answers (no fake entries)
  var ping = {};
  PV.check = function (p) {
    if (!p || !p.url) return Promise.resolve(false); if (ping[p.url] && Date.now() - ping[p.url].t < 120000) return Promise.resolve(ping[p.url].ok);
    return fetch(p.url, { method: 'GET', cache: 'no-store' }).then(function (r) { var ok = r.ok; ping[p.url] = { t: Date.now(), ok: ok }; return ok; }).catch(function () { ping[p.url] = { t: Date.now(), ok: false }; return false; });
  };
  PV.loadCached();
})();
