/* Grok Land Party - game flow, host-authoritative netcode, input, rendering and UI */
(function () {
'use strict';
const GP = window.GP, GN = window.GrokNet, $ = GP.$, Snd = GP.Snd, MG = GP.MG, TAU = GP.TAU, clamp = GP.clamp;
const FAST = GP.FAST, STAR_COST = 20;
const BOT_NAMES = ['Grokbot', 'Robo Rex', 'Pixel Pip', 'Sprocket'];
const PALETTE = GN.COLORS;
const T = (t) => (FAST ? t * 0.3 : t);
const BOARD_PHASES = { intro: 1, frenzy: 1, turn: 1, roll: 1, rolled: 1, move: 1, choose: 1, starmsg: 1, stargot: 1, land: 1, evwait: 1, after: 1, mgpick: 1, bonus: 1 };

const GS = window.__GS = { role: null, room: null, pid: GN.pid(), S: null, me: -1, ui: 'title', fxSeen: -1, lastSend: 0, lastBeat: 0, dirty: false, botMem: [], LP: null, lastIn: 0, auto: GP.Q.get('autoplay') === '1', map: false, menu: false, connecting: false };
const prof = { name: GP.save.name || '', color: GP.save.color || PALETTE[0] };

/* ======================================================================
   Host-side state machine
   ====================================================================== */
function newSession(mode) {
  return { v: 0, phase: 'lobby', pt: 0, set: { mode: mode || 'board', board: GP.save.board || 'random', turns: GP.save.turns || 10, seats: GP.save.seats || 3, diff: GP.save.diff || 'easy' },
    lobby: [], pl: [], fits: {}, fx: [], fxId: GS.fxSeen > 0 ? GS.fxSeen : 0, msg: null, choice: null, mg: null, mgq: null, mgr: null, ready: [], turn: 0, turns: 0, cur: 0, dice: 0, steps: 0, star: -1, board: null, uid: 1, lastMgs: [], frenzy: false, forced: false, path: null, mode: mode || 'board', bonus: null, final: null, gid: 0 };
}
const S_ = () => GS.S;
const touch = () => { GS.dirty = true; };
function setPhase(p, t) { const S = S_(); S.phase = p; S.pt = t || 0; touch(); }
function msg(t, s, c) { S_().msg = { t, s: s || '', c: c || '#ffffff', id: ++S_().uid }; touch(); }
function fx(k, i, extra) { const S = S_(); const e = Object.assign({ id: ++S.fxId, k, i: i == null ? -1 : i }, extra || {}); S.fx.push(e); if (S.fx.length > 24) S.fx.shift(); touch(); }
function graph() { return GP.boardGraph(S_().board); }
function isBot(i) { const p = S_().pl[i]; return !!p && (p.bot || (GS.auto && p.pid === GS.pid)); }
function seatOf(pid) { const S = S_(); return S ? S.pl.findIndex((p) => p.pid === pid && !p.bot) : -1; }
function addCoins(i, n) { const p = S_().pl[i]; const b = p.coins; p.coins = Math.max(0, p.coins + n); p.mx = Math.max(p.mx, p.coins); const d = p.coins - b; if (d) fx('coin', i, { n: d }); return d; }
function nm(i) { return S_().pl[i].name; }

function startGame() {
  const S = S_(), set = S.set;
  GP.save.board = set.board; GP.save.turns = set.turns; GP.save.seats = set.seats; GP.save.diff = set.diff; GP.persist();
  const humans = S.lobby.slice(0, 3), used = [];
  S.pl = humans.map((h) => { let c = h.color; if (used.includes(c)) c = PALETTE.find((q) => !used.includes(q)); used.push(c); return seat(h.pid, h.name, c, false); });
  const seats = Math.max(humans.length, set.seats); let bi = 0;
  while (S.pl.length < seats) { const c = PALETTE.find((q) => !used.includes(q)); used.push(c); S.pl.push(seat(null, BOT_NAMES[bi++], c, true)); }
  S.mode = set.mode; S.msg = null; S.choice = null; S.mg = null; S.mgr = null; S.final = null; S.bonus = null; S.lastMgs = []; S.frenzy = false; S.forced = false; S.path = null; S.gid++;
  GS.botMem = S.pl.map(() => ({}));
  if (S.mode === 'board') {
    S.board = set.board === 'random' ? GP.pick(GP.BOARDS.filter((b) => !b.dlc || (GP.FZ && GP.FZ.can()))).id : set.board; S.turns = set.turns; S.turn = 1; S.cur = 0;
    S.star = GP.pick(graph().starSpots); S.pl.forEach((p) => { p.sp = 0; p.coins = 10; p.mx = 10; });
    const B = GP.boardById(S.board); msg(B.name, 'Buy stars for ' + STAR_COST + ' coins. Most stars after ' + S.turns + ' turns wins!', B.color);
    setPhase('intro', T(3.6)); fx('fanfare');
  } else if (S.mode === 'fiesta' && GP.FZ) { S.board = null; GP.FZ.start(); }
  else { S.board = null; setPhase('fpick', 0); }
}
function seat(pid, name, color, bot) { return { pid, name, color, bot, diff: S_().set.diff, coins: 0, stars: 0, sp: 0, mgw: 0, mx: 0, solo: 0 }; }

function beginTurn() {
  const S = S_();
  if (S.cur === 0 && !S.frenzy && S.turns >= 5 && S.turn > S.turns - 3) { S.frenzy = true; msg('FINAL FRENZY!', 'Last 3 turns: blue and red spaces are worth double!', '#ff4d4d'); setPhase('frenzy', T(2.8)); fx('event'); return; }
  const p = S.pl[S.cur]; msg(p.name + '\u2019s turn', 'Turn ' + S.turn + ' of ' + S.turns, p.color); setPhase('turn', T(1.3));
}
function doRoll() { const S = S_(); S.dice = GP.randi(1, 10); S.steps = S.dice; fx('dice', S.cur, { n: S.dice }); setPhase('rolled', T(0.9)); }
function doHop() {
  const S = S_(), g = graph(), p = S.pl[S.cur], s = g.spaces[p.sp];
  if (S.steps <= 0) { arrive(); return; }
  let nx;
  if (s.next.length > 1 && !S.forced) { if (S.path == null) { openJunction(s); return; } nx = S.path; S.path = null; }
  else nx = s.next[0];
  p.sp = nx; S.steps--; fx('hop', S.cur); S.stepT = T(0.34); touch();
  if (nx === S.star) starPrompt();
}
function openJunction(s) {
  const S = S_(), g = graph(), p = S.pl[S.cur], j = g.junctions.find((q) => q.at === s.i);
  const opts = [{ id: s.next[0], label: 'Main Road', sub: 'the long way' }, { id: s.next[1], label: j.name, sub: (j.toll ? 'Costs ' + j.toll + ' coins \u00b7 ' : 'Free \u00b7 ') + 'shortcut', dis: p.coins < j.toll, toll: j.toll }];
  S.choice = { who: S.cur, kind: 'junction', opts, at: s.i }; msg('Which way?', 'A fork in the road!', '#ffffff');
  setPhase('choose', isBot(S.cur) ? T(1.2) : 20);
}
function starPrompt() {
  const S = S_(), p = S.pl[S.cur];
  if (p.coins >= STAR_COST) { S.choice = { who: S.cur, kind: 'star', opts: [{ id: 'buy', label: 'BUY STAR', sub: STAR_COST + ' coins' }, { id: 'pass', label: 'No thanks', sub: 'keep moving' }] }; msg('\u2605 The Star! \u2605', 'Buy it for ' + STAR_COST + ' coins?', '#ffd23f'); setPhase('choose', isBot(S.cur) ? T(1.2) : 20); }
  else { msg('\u2605 The Star! \u2605', p.name + ' needs ' + STAR_COST + ' coins to buy it', '#ffd23f'); setPhase('starmsg', T(1.7)); }
}
function botChoice() {
  const S = S_(), c = S.choice; if (!c) return null;
  if (c.kind === 'star') return 'buy';
  const g = graph(); let best = c.opts[0].id, bd = 1e9;
  c.opts.forEach((o) => { if (o.dis) return; const d = GP.boardDist(g, o.id, S.star) + (o.toll ? 1.5 : 0) + Math.random() * 0.5; if (d < bd) { bd = d; best = o.id; } });
  return best;
}
function resolveChoice(v) {
  const S = S_(), c = S.choice; if (!c) return; const i = c.who;
  if (c.kind === 'junction') {
    const o = c.opts.find((q) => q.id === v && !q.dis); if (!o) return;
    if (o.toll) { addCoins(i, -o.toll); fx('pay', i); }
    S.path = o.id; S.choice = null; S.msg = null; setPhase('move', 0); S.stepT = 0.05;
  } else {
    S.choice = null;
    if (v === 'buy' && S.pl[i].coins >= STAR_COST) {
      addCoins(i, -STAR_COST); S.pl[i].stars++; fx('star', i); msg('\u2605 STAR GET! \u2605', nm(i) + ' got a star!', '#ffd23f');
      const c2 = graph().starSpots.filter((q) => q !== S.star); S.star = GP.pick(c2); fx('starmove');
      setPhase('stargot', T(2.6));
    } else { S.msg = null; setPhase('move', 0); S.stepT = 0.1; }
  }
}
function arrive() { const S = S_(); if (S.forced) { S.forced = false; setPhase('after', T(0.9)); return; } land(); }
function land() {
  const S = S_(), g = graph(), i = S.cur, p = S.pl[i], s = g.spaces[p.sp], mult = S.frenzy ? 2 : 1;
  if (s.type === 'B' || s.type === 'S') { addCoins(i, 3 * mult); msg('+' + 3 * mult + ' coins', 'Blue space', '#3a8dff'); fx('blue', i); }
  else if (s.type === 'R') { const d = addCoins(i, -3 * mult); msg((d || '-0') + ' coins', 'Red space', '#ff4455'); fx('red', i); }
  else if (s.type === 'L') { lucky(i); }
  else if (s.type === 'E') { boardEvent(i); return; }
  setPhase('after', T(1.9));
}
function lucky(i) {
  const S = S_(), g = graph(), r = Math.random(); fx('lucky', i);
  if (r < 0.45) { const n = GP.randi(5, 8); addCoins(i, n); msg('Lucky!', nm(i) + ' found ' + n + ' coins!', '#3fd36a'); return; }
  if (r < 0.72) { let tot = 0; S.pl.forEach((q, j) => { if (j !== i) tot -= addCoins(j, -2); }); addCoins(i, tot); msg('Lucky!', 'Everyone gives ' + nm(i) + ' 2 coins!', '#3fd36a'); return; }
  let t = S.star; for (let k = 0; k < 3; k++) { const pr = g.spaces[t].prev; const m = pr.find((q) => g.spaces[q].cut < 0); t = m !== undefined ? m : pr[0]; }
  if (GP.boardDist(g, S.pl[i].sp, S.star) <= 4) { addCoins(i, 6); msg('Lucky!', nm(i) + ' found 6 coins!', '#3fd36a'); return; }
  S.pl[i].sp = t; fx('warp', i); msg('Lucky Warp!', nm(i) + ' zooms close to the star!', '#3fd36a');
}
function boardEvent(i) {
  const S = S_(), r = Math.random(), B = GP.boardById(S.board), rivals = S.pl.map((_, j) => j).filter((j) => j !== i);
  fx('event', i);
  const forced = (n, t, s) => { S.forced = true; S.steps = n; msg(t, s, '#ff9a1f'); setPhase('evwait', T(1.8)); };
  const done = (t, s) => { msg(t, s, '#ff9a1f'); setPhase('after', T(2.3)); };
  if (B.event && B.event.run) { B.event.run({ i, S, r, rivals, forced, done, addCoins, nm, fx, standings }); return; }
  if (B.id === 'candy') {
    if (r < 0.55) { const n = GP.randi(3, 6); forced(n, 'Sugar Rush!', 'A candy cannon blasts ' + nm(i) + ' ' + n + ' spaces ahead!'); }
    else { S.pl.forEach((_, j) => addCoins(j, 3)); done('Cotton Candy Shower!', 'Sweet! Everyone gets 3 coins.'); }
  } else if (B.id === 'lava') {
    if (r < 0.5) forced(4, 'Eruption Geyser!', 'WHOOSH! ' + nm(i) + ' is launched 4 spaces ahead!');
    else { const lost = -addCoins(i, -5); rivals.forEach((j) => addCoins(j, Math.min(2, Math.floor(lost / Math.max(1, rivals.length))))); done('Hot Rocks!', nm(i) + ' drops ' + lost + ' coins and they bounce to rivals!'); }
  } else if (B.id === 'frozen') {
    if (r < 0.55) { const n = GP.randi(3, 5); forced(n, 'Ice Slide!', 'Wheee! ' + nm(i) + ' slides ' + n + ' spaces!'); }
    else { const vs = rivals.filter((j) => S.pl[j].coins > 0); if (!vs.length) { addCoins(i, 3); done('Snowball Fight!', 'Nobody has coins... ' + nm(i) + ' finds 3 in the snow.'); } else { const j = GP.pick(vs), n = -addCoins(j, -4); addCoins(i, n); done('Snowball Fight!', nm(i) + ' hits ' + nm(j) + ' and steals ' + n + ' coins!'); } }
  } else {
    if (r < 0.5 && rivals.length) { const j = GP.pick(rivals), a = S.pl[i].sp; S.pl[i].sp = S.pl[j].sp; S.pl[j].sp = a; fx('ghost', i); fx('warp', j); done('Ghost Trick!', 'Boo! ' + nm(i) + ' swaps places with ' + nm(j) + '!'); }
    else {
      const order = standings(); const leader = order.find((q) => q !== i); const meLead = order[0] === i;
      fx('ghost', i);
      if (meLead) { const lastP = order[order.length - 1]; const n = -addCoins(i, -5); addCoins(lastP, n); done('Ghost Trick!', 'The ghost takes ' + n + ' coins from leader ' + nm(i) + ' for ' + nm(lastP) + '!'); }
      else { const n = -addCoins(leader, -5); addCoins(i, n); done('Ghost Trick!', 'The ghost swipes ' + n + ' coins from ' + nm(leader) + ' for ' + nm(i) + '!'); }
    }
  }
}
function standings() { const S = S_(); return S.pl.map((_, j) => j).sort((a, b) => S.pl[b].stars - S.pl[a].stars || S.pl[b].coins - S.pl[a].coins); }
function placeOf(i) { const S = S_(), p = S.pl[i]; return 1 + S.pl.filter((q) => q.stars > p.stars || (q.stars === p.stars && q.coins > p.coins)).length; }
function endTurn() { const S = S_(); S.msg = null; S.cur++; if (S.cur >= S.pl.length) { S.cur = 0; startMgPick(); } else beginTurn(); }

/* ---- mini game flow ---- */
function eligible() { const S = S_(), n = S.pl.length; return GP.MG_LIST.filter((id) => !((S.mode === 'board' || S.mode === 'fiesta') && MG[id].type === '1v2' && n < 3)); }
function chooseSolo(id) {
  const S = S_(); if (MG[id].type !== '1v2') return -1;
  const mn = Math.min(...S.pl.map((p) => p.solo)); const c = S.pl.map((_, i) => i).filter((i) => S.pl[i].solo === mn); const s = GP.pick(c); S.pl[s].solo++; return s;
}
function startMgPick() {
  const S = S_(), el = eligible(), fresh = el.filter((id) => !S.lastMgs.includes(id)), id = GP.pick(fresh.length ? fresh : el);
  S.lastMgs.push(id); if (S.lastMgs.length > 6) S.lastMgs.shift();
  S.mgq = { id, solo: chooseSolo(id) }; msg('MINI GAME!', '', '#ff4fd8'); setPhase('mgpick', T(2.6)); fx('event');
}
function toIntro() { const S = S_(); S.msg = null; S.ready = S.pl.map((_, i) => isBot(i)); setPhase('mgintro', FAST ? 1.5 : 15); }
function startMg() {
  const S = S_(), D = MG[S.mgq.id], n = S.pl.length;
  const mg = { id: D.id, uid: ++S.uid, t: FAST ? Math.min(8, D.dur) : D.dur, cd: FAST ? 1 : 3, ended: false };
  D.init.call(D, mg, n, S.mgq.solo); mg.T = mg.t; S.mg = mg; GS.botMem = S.pl.map(() => ({})); setPhase('mgplay', 0); fx('beep');
}
function helpers(mg) {
  const D = MG[mg.id];
  const H = { fx: (k, i, x, z) => fx(k, i, x != null ? { x: +x.toFixed(2), z: +z.toFixed(2) } : null), kick: (i, pr) => { const p = mg.p[i]; Object.assign(p, pr); p.kk = (p.kk || 0) + 1; }, end: () => { mg.ended = true; }, act: (i, v) => { if (D.act) D.act.call(D, mg, i, v, H); } };
  return H;
}
function hostMg(dt) {
  const S = S_(), mg = S.mg; if (!mg) return; const D = MG[mg.id];
  if (mg.cd > 0) { const b = Math.ceil(mg.cd); mg.cd -= dt; if (Math.ceil(mg.cd) !== b) fx(mg.cd > 0 ? 'beep' : 'go'); touch(); return; }
  const H = helpers(mg);
  mg.p.forEach((p, i) => {
    let inp = null;
    if (isBot(i)) inp = D.bot ? D.bot.call(D, mg, i, S.pl[i].diff, dt, GS.botMem[i] || (GS.botMem[i] = {}), H) : null;
    else if (S.pl[i].pid === GS.pid) { inp = localInput(); if (inp.a && D.act && !D.noMove) D.act.call(D, mg, i, 'a', H); }
    if (inp && D.arena && !D.noMove) GP.moveAvatar(p, inp, dt, D.arena);
    if (p.st > 0) p.st = Math.max(0, p.st - dt);
  });
  D.step.call(D, mg, dt, H);
  mg.t -= dt;
  if (!mg.ended && mg.t <= 0) { mg.t = 0; if (D.timeUp) D.timeUp.call(D, mg, H); mg.ended = true; }
  if (mg.ended) { mg.t = Math.max(0, mg.t); fx('whistle'); setPhase('mgend', T(1.8)); }
  touch();
}
function finishMg() {
  const S = S_(), mg = S.mg, D = MG[mg.id], sc = D.score(mg), n = sc.length;
  let rows;
  if (D.type === '1v2') rows = sc.map((w, i) => ({ i, place: w ? 1 : 2, win: !!w }));
  else rows = sc.map((v, i) => { const place = 1 + sc.filter((q) => q > v).length; return { i, place, win: place === 1 && !(n > 1 && sc.every((q) => q === v) && v <= 0) }; });
  rows.forEach((r) => {
    r.label = D.label(mg, r.i); r.coins = 0;
    if (S.mode === 'board' || S.mode === 'fiesta') { r.coins = D.type === '1v2' ? (r.win ? (r.i === mg.solo ? 15 : 10) : 0) : ([10, n === 2 ? 3 : 5, 2][r.place - 1] || 0); if (r.coins) addCoins(r.i, r.coins); }
    if (r.win) S.pl[r.i].mgw++;
  });
  rows.sort((a, b) => a.place - b.place);
  S.mgr = { id: mg.id, rows, solo: mg.solo, type: D.type };
  S.mg = null; S.ready = S.pl.map((_, i) => isBot(i)); setPhase('mgres', FAST ? 1.5 : 7); fx(rows.some((r) => r.win) ? 'win' : 'select');
}
function afterMgRes() {
  const S = S_();
  if (S.mode === 'fiesta' && GP.FZ) { GP.FZ.afterMg(S.mgr); S.mgr = null; return; }
  S.mgr = null;
  if (S.mode === 'free') { setPhase('fpick', 0); return; }
  if (S.turn >= S.turns) { bonusPhase(); return; }
  S.turn++; S.cur = 0; beginTurn();
}
function bonusPhase() {
  const S = S_(), awards = [];
  const mw = Math.max(...S.pl.map((p) => p.mgw)); if (mw > 0) awards.push({ t: 'Mini-Game Star', d: 'most mini game wins (' + mw + ')', w: S.pl.map((_, i) => i).filter((i) => S.pl[i].mgw === mw) });
  const mc = Math.max(...S.pl.map((p) => p.mx)); awards.push({ t: 'Coin Star', d: 'most coins at one time (' + mc + ')', w: S.pl.map((_, i) => i).filter((i) => S.pl[i].mx === mc) });
  awards.forEach((a) => a.w.forEach((i) => { S.pl[i].stars++; }));
  S.bonus = awards;
  msg('BONUS STARS!', awards.map((a) => a.t + ': ' + a.w.map(nm).join(' & ')).join('  \u00b7  '), '#ffd23f'); fx('star', -1);
  setPhase('bonus', T(6));
}
function finalPhase() {
  const S = S_(); S.msg = null;
  S.final = { rows: standings().map((i) => ({ i, place: placeOf(i) })) };
  setPhase('final', 0); fx('fanfare');
}

const HANDLERS = {
  lobby() {}, final() {}, fpick() {},
  intro() { if (S_().pt <= 0) { S_().msg = null; beginTurn(); } },
  frenzy() { if (S_().pt <= 0) beginTurn(); },
  turn() { const S = S_(); if (S.pt <= 0) { S.msg = null; S.dice = 0; setPhase('roll', isBot(S.cur) ? T(0.9) : 25); } },
  roll() { const S = S_(); if (isBot(S.cur) && S.pt > T(0.9)) S.pt = T(0.9); if (S.pt <= 0) doRoll(); },
  rolled() { if (S_().pt <= 0) { S_().stepT = 0.1; S_().path = null; setPhase('move', 0); } },
  move(dt) { const S = S_(); S.stepT -= dt; if (S.stepT <= 0) doHop(); },
  choose() { const S = S_(); if (isBot(S.choice.who) && S.pt > T(1.2)) S.pt = T(1.2); if (S.pt <= 0) { const v = isBot(S.choice.who) ? botChoice() : (S.choice.kind === 'star' ? 'buy' : S.choice.opts[0].id); resolveChoice(v); } },
  starmsg() { if (S_().pt <= 0) { S_().msg = null; S_().stepT = 0.1; setPhase('move', 0); } },
  stargot() { if (S_().pt <= 0) { S_().msg = null; S_().stepT = 0.1; setPhase('move', 0); } },
  evwait() { if (S_().pt <= 0) { S_().msg = null; S_().stepT = 0.1; setPhase('move', 0); } },
  after() { if (S_().pt <= 0) endTurn(); },
  mgpick() { if (S_().pt <= 0) toIntro(); },
  mgintro() { const S = S_(); S.pl.forEach((_, i) => { if (isBot(i)) S.ready[i] = true; }); if (S.pt <= 0 || S.ready.every(Boolean)) startMg(); },
  mgplay(dt) { hostMg(dt); },
  mgend() { if (S_().pt <= 0) finishMg(); },
  mgres() { const S = S_(); S.pl.forEach((_, i) => { if (isBot(i)) S.ready[i] = true; }); if (S.pt <= 0 || (S.ready.every(Boolean) && S.pt < (FAST ? 1.5 : 7) - 1.2)) afterMgRes(); },
  bonus() { if (S_().pt <= 0) finalPhase(); },
  roam(dt) { if (GP.FZ) GP.FZ.hostStep(dt); },
};
function hostStep(dt) { const S = S_(); if (!S) return; if (S.pt > 0) S.pt -= dt; const h = HANDLERS[S.phase]; if (h) h(dt); }

/* actions coming from any player (pid). Host / solo only. */
function hostAct(pid, m) {
  const S = S_(); if (!S || !m) return; const i = seatOf(pid), isHostMe = pid === GS.pid;
  switch (m.k) {
    case 'fit': { if (!S.fits) S.fits = {}; const f = GP.FF ? GP.FF.clean(m.v) : null; if (f) S.fits[pid] = f; else delete S.fits[pid]; touch(); break; }
    case 'party': { // Fiesta Fits dances / confetti cannon / party horn
      const ok = i >= 0 && GP.FF && GP.FF.MOVES.some((x) => x.id === m.v) && ((S.mode === 'board' && BOARD_PHASES[S.phase]) || S.phase === 'final' || (S.mode === 'fiesta' && S.phase === 'roam'));
      const now = performance.now(); GS.ffT = GS.ffT || {};
      if (ok && !(now - (GS.ffT[i] || -9e9) < 1200)) { GS.ffT[i] = now; fx('party', i, { a: m.v }); }
      break; }
    case 'roll': if (S.phase === 'roll' && i === S.cur && i >= 0) doRoll(); break;
    case 'choose': if (S.phase === 'choose' && S.choice && i === S.choice.who) resolveChoice(m.v); break;
    case 'ready': if ((S.phase === 'mgintro' || S.phase === 'mgres') && i >= 0) { S.ready[i] = true; touch(); } break;
    case 'mg': if (S.phase === 'mgplay' && S.mg && S.mg.cd <= 0 && i >= 0) { const D = MG[S.mg.id]; if (D.act) D.act.call(D, S.mg, i, m.v, helpers(S.mg)); } break;
    case 'fpick': if (isHostMe && S.phase === 'fpick') { const id = m.v === 'random' ? GP.pick(eligible()) : m.v; if (MG[id]) { S.mgq = { id, solo: chooseSolo(id) }; toIntro(); } } break;
    case 'set': if (isHostMe && S.phase === 'lobby' && m.key in S.set && !(GP.FZ && GP.FZ.blockSet(m))) { S.set[m.key] = m.val; touch(); } break;
    case 'start': if (isHostMe && S.phase === 'lobby') startGame(); break;
    case 'rematch': if (isHostMe && (S.phase === 'final' || S.phase === 'fpick')) startGame(); break;
    case 'tolobby': if (isHostMe) { S.phase = 'lobby'; S.mg = null; S.msg = null; touch(); } break;
    default: if (GP.FZ && typeof m.k === 'string' && m.k.slice(0, 2) === 'fz') GP.FZ.hostAct(i, m, pid);
  }
}
function onInput(pid, m) {
  const S = S_(); if (!S || S.phase !== 'mgplay' || !S.mg) return; const i = seatOf(pid); if (i < 0) return;
  const p = S.mg.p[i], D = MG[S.mg.id]; if (!p || D.noMove || p.out || p.fall > 0 || (m.kk | 0) !== (p.kk | 0)) return;
  const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
  p.x = num(m.x, p.x); p.z = num(m.z, p.z); p.y = Math.max(0, num(m.y, 0)); p.vx = num(m.vx, 0); p.vz = num(m.vz, 0); p.vy = num(m.vy, 0); p.f = num(m.f, p.f); p.d = num(m.d, 0);
  const A = D.arena; if (A.w) { p.x = clamp(p.x, -A.w / 2, A.w / 2); p.z = clamp(p.z, -A.h / 2, A.h / 2); } else if (!A.fall) { const r = Math.hypot(p.x, p.z); if (r > A.r) { p.x *= A.r / r; p.z *= A.r / r; } } else { const r = Math.hypot(p.x, p.z); if (r > A.r + 3) { p.x *= (A.r + 3) / r; p.z *= (A.r + 3) / r; } }
}

/* local action entry point (all roles) */
function doAct(m) {
  Snd.init();
  if (!GS.S) return;
  if (GS.role === 'client') { if (GS.room) GS.room.send({ t: 'act', k: m.k, v: m.v, key: m.key, val: m.val }); }
  else hostAct(GS.pid, m);
}

/* ======================================================================
   Sessions & networking
   ====================================================================== */
function pushFit() {
  const S = S_(); if (!S || !GP.FF) return; const f = GP.FF.mine();
  if (GS.role === 'client') { if (GS.room) GS.room.send({ t: 'act', k: 'fit', v: f }); }
  else { if (!S.fits) S.fits = {}; if (f) S.fits[GS.pid] = f; else delete S.fits[GS.pid]; touch(); }
}
GP.pushFit = pushFit;
function myLobbyEntry() { return { pid: GS.pid, name: GN.cleanName(prof.name || 'Player'), color: prof.color, host: true }; }
function startSolo(mode) {
  leaveSession(true);
  GS.role = 'solo'; GS.S = newSession(mode); GS.S.lobby = [myLobbyEntry()]; GS.S.set.mode = mode; GS.ui = 'game'; GS.fxSeen = GS.S.fxId; pushFit();
}
function lobbyFromRoom() {
  const r = GS.room, S = S_(); if (!r || !S) return;
  S.lobby = r.players().map((p) => ({ pid: p.pid, name: p.name, color: p.color, host: p.host })); touch();
}
function hostOnline(code) {
  leaveSession(true);
  GS.role = 'host'; GS.connecting = true; GS.ui = 'online'; setOnlineMsg('Opening a room\u2026', true);
  const room = GS.room = GN.createRoom({ role: 'host', code: code || undefined, name: prof.name || 'Player', color: prof.color, autoCode: !code, rejoin: !!code, max: 3, pid: GS.pid });
  room.on('status', (t) => { if (GS.connecting) setOnlineMsg(t, true); });
  room.on('open', () => { GS.connecting = false; GS.S = newSession('board'); GS.fxSeen = GS.S.fxId; pushFit(); lobbyFromRoom(); GS.ui = 'game'; Snd.fx('join'); });
  room.on('players', () => { lobbyFromRoom(); });
  room.on('join', (p) => {
    const S = S_(); if (!S) return; Snd.fx('join');
    if (S.phase === 'lobby') { toast(p.name + ' joined!'); return; }
    let i = S.pl.findIndex((q) => q.pid === p.pid);
    if (i >= 0) { S.pl[i].bot = false; toast(p.name + ' is back!'); }
    else { i = S.pl.findIndex((q) => q.bot); if (i >= 0) { const old = S.pl[i].name; Object.assign(S.pl[i], { pid: p.pid, name: p.name, bot: false }); toast(p.name + ' joined and takes over ' + old + '!'); } else toast(p.name + ' is watching'); }
    touch();
  });
  room.on('leave', (p) => {
    const S = S_(); if (!S) return; Snd.fx('leave');
    const i = S.pl.findIndex((q) => q.pid === p.pid);
    if (S.phase !== 'lobby' && i >= 0 && !S.pl[i].bot) {
      S.pl[i].bot = true; toast(p.name + ' left \u2014 AI takes over', true);
      if (S.ready[i] === false) S.ready[i] = true;
      if ((S.phase === 'roll' && S.cur === i) || (S.phase === 'choose' && S.choice && S.choice.who === i)) S.pt = Math.min(S.pt, 1);
    } else toast(p.name + ' left', true);
    touch();
  });
  room.on('message', (d, from) => { if (!d || typeof d !== 'object') return; if (d.t === 'act') hostAct(from, d); else if (d.t === 'in') onInput(from, d); else if (d.t === 'fz' && GP.FZ) GP.FZ.onPos(from, d); });
  room.on('error', (e) => { GS.connecting = false; if (!GS.S) { GS.ui = 'online'; setOnlineMsg(e.title + ': ' + e.message); GS.role = null; GS.room = null; } else toast(e.title, true); });
  room.start();
}
function joinOnline(code) {
  code = GN.normalizeCode(code);
  if (!GN.validCode(code)) { GS.ui = 'online'; setOnlineMsg('Enter the 5-letter room code.'); return; }
  leaveSession(true);
  GS.role = 'client'; GS.connecting = true; GS.ui = 'online'; setOnlineMsg('Joining room ' + code + '\u2026', true);
  const room = GS.room = GN.createRoom({ role: 'join', code, name: prof.name || 'Player', color: prof.color, pid: GS.pid });
  room.on('status', (t) => { if (GS.connecting) setOnlineMsg(t, true); });
  room.on('open', () => { setOnlineMsg('Connected! Waiting for the host\u2026', true); Snd.fx('join'); });
  room.on('message', (d) => { if (d && d.t === 'st' && d.s && GS.room === room) applyState(d.s); });
  room.on('join', (p) => { if (GS.S) { toast(p.name + ' joined!'); Snd.fx('join'); } });
  room.on('leave', (p) => { if (GS.S && !p.host) { toast(p.name + ' left' + (GS.S.phase !== 'lobby' ? ' \u2014 AI takes over' : ''), true); Snd.fx('leave'); } });
  room.on('reconnecting', () => toast('Lost the host \u2014 reconnecting\u2026', true));
  room.on('reconnected', () => toast('Reconnected!'));
  room.on('error', (e) => {
    if (GS.room !== room) return;
    GS.connecting = false;
    const S = S_();
    if (e.code === 'hostleft' && S && S.phase !== 'lobby' && S.pl.length) { takeOver(); return; }
    if (GP.FZ && S && S.mode === 'fiesta') GP.FZ.hostGone(S);
    leaveSession(true); GS.ui = 'online'; setOnlineMsg(e.title + ': ' + e.message);
  });
  room.start();
}
function applyState(s) {
  const first = !GS.S;
  GS.S = s; GS.connecting = false; GS.ui = 'game';
  if (first) { GS.fxSeen = s.fxId; pushFit(); }
}
// host vanished: keep the party going locally, everyone else becomes AI
function takeOver() {
  const S = S_(); if (GP.FZ && GP.FZ.hostGone && GP.FZ.hostGone(S)) { leaveSession(); return; }
  const r = GS.room; GS.room = null; GS.role = 'solo'; try { if (r) r.leave(); } catch (e) { /* ignore */ }
  S.pl.forEach((p) => { if (p.pid !== GS.pid) p.bot = true; });
  GS.botMem = S.pl.map(() => ({})); GS.LP = null;
  S.lobby = [myLobbyEntry()];
  if (S.phase === 'mgplay' || S.phase === 'mgend') { S.mg = null; toIntro(); }
  if (S.phase === 'mgintro' || S.phase === 'mgres') S.ready = S.pl.map((_, i) => isBot(i) || !!S.ready[i]);
  if (S.phase === 'choose' || S.phase === 'roll') S.pt = Math.min(S.pt, 2);
  toast('Host left \u2014 continuing with AI', true); Snd.fx('leave');
}
function leaveSession(silent) {
  const r = GS.room; GS.room = null;
  if (r) { try { r.leave(); } catch (e) { /* ignore */ } }
  GS.S = null; GS.role = null; GS.LP = null; GS.menu = false; GS.map = false; GS.connecting = false;
  MV.stop(); GS.mvUid = 0;
  if (!silent) GS.ui = 'title';
}
function netTick(now) {
  const S = S_(); if (!S || GS.role !== 'host' || !GS.room) return;
  const playing = S.phase === 'mgplay';
  if ((GS.dirty && now - GS.lastSend > (playing ? 66 : 50)) || now - GS.lastSend > 600) { GS.room.broadcast({ t: 'st', s: S }); GS.lastSend = now; GS.dirty = false; }
}

/* ======================================================================
   Input
   ====================================================================== */
const keys = Object.create(null);
const joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
let pendingA = false;
addEventListener('keydown', (e) => {
  if (e.target && e.target.tagName === 'INPUT') return;
  keys[e.code] = true; Snd.init();
  if (e.code === 'KeyM') toggleMute();
  const S = S_(); if (!S) return;
  const me = GS.me;
  if (e.code === 'Escape' || e.code === 'KeyP') { GS.menu = !GS.menu; return; }
  if (e.code === 'Space' || e.code === 'KeyJ' || e.code === 'KeyK' || e.code === 'Enter') {
    if (e.code === 'Space') e.preventDefault();
    if (e.repeat) return;
    if (S.phase === 'mgplay') { pressA(); return; }
    if (S.phase === 'roll' && S.cur === me && !GS.auto) { doAct({ k: 'roll' }); return; }
    if ((S.phase === 'mgintro' || S.phase === 'mgres') && me >= 0) { doAct({ k: 'ready' }); return; }
  }
  if (/^Digit[1-6]$/.test(e.code) && !e.repeat) {
    const n = +e.code.slice(5) - 1;
    if (S.phase === 'choose' && S.choice && S.choice.who === me && S.choice.opts[n] && !S.choice.opts[n].dis) doAct({ k: 'choose', v: S.choice.opts[n].id });
    if (S.phase === 'mgplay' && S.mg) { const D = MG[S.mg.id]; if ((D.ctrl === 'simon' && n < 4) || D.ctrl === 'pick') mgTap(n); }
  }
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
function pressA() {
  Snd.init();
  const S = S_(); if (!S || S.phase !== 'mgplay' || !S.mg || S.mg.cd > 0 || GS.me < 0) return;
  const D = MG[S.mg.id];
  if (D.ctrl === 'mash' || D.ctrl === 'tap') { mgTap(1); return; }
  if (D.ctrl === 'move') pendingA = true;
}
function mgTap(v) {
  const S = S_(); if (!S || S.phase !== 'mgplay' || !S.mg || S.mg.cd > 0 || GS.me < 0) return;
  const D = MG[S.mg.id], mg = S.mg;
  if (D.ctrl === 'tap') { if (mg.ph2 === 'go' && GS.goSeen) v = Math.round(performance.now() - GS.goSeen); else if (mg.ph2 === 'wait') v = 'early'; else return; }
  if (D.ctrl === 'mash') Snd.fx('mash');
  if (D.ctrl === 'simon') { const p = mg.p[GS.me]; if (mg.ph2 !== 'input' || !p || p.out || p.dn) return; Snd.fx('pad', v); }
  if (D.ctrl === 'pick') { if (mg.ph2 !== 'ask' || (mg.p[GS.me] && mg.p[GS.me].pk >= 0) || (GS.myPick && GS.myPick.uid === mg.uid && GS.myPick.r === mg.r)) return; GS.myPick = { uid: mg.uid, r: mg.r, v }; Snd.fx('click'); }
  doAct({ k: 'mg', v });
}
function camYaw() { return MV.yaw || 0; }
function localInput() {
  let sx = 0, sy = 0;
  if (keys.KeyA || keys.ArrowLeft) sx -= 1; if (keys.KeyD || keys.ArrowRight) sx += 1; if (keys.KeyW || keys.ArrowUp) sy -= 1; if (keys.KeyS || keys.ArrowDown) sy += 1;
  if (joy.id !== null) { sx += joy.x; sy += joy.y; }
  const m = Math.hypot(sx, sy); if (m > 1) { sx /= m; sy /= m; }
  const th = camYaw(), c = Math.cos(th), s = Math.sin(th);
  const a = pendingA; pendingA = false;
  return { jx: sx * c + sy * s, jz: -sx * s + sy * c, a };
}
(function joystick() {
  if (!GP.IS_TOUCH) { document.body.classList.add('kbd'); const h = document.getElementById('joyhint'); if (h) h.textContent = 'WASD / ARROWS TO MOVE'; }
  const zone = $('joyzone'), base = $('joybase'), knob = $('joyknob'), R = 52;
  const home = () => { base.style.left = ''; base.style.top = ''; knob.style.transform = ''; };
  zone.addEventListener('pointerdown', (e) => {
    Snd.init(); if (joy.id !== null) return; joy.id = e.pointerId; try { zone.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
    const r = zone.getBoundingClientRect(); joy.ox = e.clientX; joy.oy = e.clientY; base.style.left = (e.clientX - r.left) + 'px'; base.style.top = (e.clientY - r.top) + 'px'; joy.x = joy.y = 0; $('joyhint').classList.add('hidden'); e.preventDefault();
  });
  zone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== joy.id) return; let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
    joy.x = dx / R; joy.y = dy / R; if (Math.hypot(joy.x, joy.y) < 0.12) { joy.x = joy.y = 0; } knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
  });
  const up = (e) => { if (e.pointerId !== joy.id) return; joy.id = null; joy.x = joy.y = 0; home(); };
  zone.addEventListener('pointerup', up); zone.addEventListener('pointercancel', up); zone.addEventListener('lostpointercapture', up);
  GS.joyReset = () => { joy.id = null; joy.x = joy.y = 0; home(); };
})();
function holdBtn(el, fn) { el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.classList.add('down'); fn(); }); const off = () => el.classList.remove('down'); el.addEventListener('pointerup', off); el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off); }
holdBtn($('abtn'), pressA); holdBtn($('mashbtn'), pressA);
$('mgpanel').addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-tap]'); if (!b || b.disabled) return; e.preventDefault(); Snd.init(); b.classList.add('down'); setTimeout(() => b.classList.remove('down'), 120); mgTap(+b.dataset.tap); });

// delegated clicks for everything with data-act
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return; Snd.init(); Snd.fx('click');
  const a = b.dataset.act, v = b.dataset.v;
  if (a === 'set') { let val = v; if (/^\d+$/.test(val)) val = +val; doAct({ k: 'set', key: b.dataset.key, val }); return; }
  if (a === 'choose') { const S = S_(); const o = S && S.choice && S.choice.opts.find((q) => String(q.id) === v); doAct({ k: 'choose', v: o ? o.id : v }); return; }
  if (a === 'leave' || a === 'title') { leaveSession(); return; }
  doAct({ k: a, v });
});

/* title / online screen controls */
function setOnlineMsg(t, ok) { const el = $('onlineMsg'); el.textContent = t || ''; el.classList.toggle('ok', !!ok); }
(function titleUI() {
  const ni = $('nameIn'); ni.value = prof.name;
  ni.addEventListener('input', () => { prof.name = ni.value.trim() ? GN.cleanName(ni.value) : ''; GP.save.name = prof.name; GP.save.color = prof.color; GP.persist(); });
  const row = $('colorRow');
  const draw = () => { row.innerHTML = PALETTE.map((c) => '<button type="button" data-c="' + c + '" style="background:' + c + '" class="' + (c === prof.color ? 'on' : '') + '" aria-label="color"></button>').join(''); };
  draw(); row.addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (!b) return; prof.color = b.dataset.c; GP.save.color = prof.color; GP.persist(); draw(); Snd.init(); Snd.fx('select'); });
  const need = () => { if (!prof.name) { prof.name = 'Player'; ni.value = 'Player'; GP.save.name = 'Player'; GP.persist(); } };
  $('bParty').onclick = () => { Snd.init(); need(); startSolo('board'); };
  $('bFree').onclick = () => { Snd.init(); need(); startSolo('free'); };
  $('bOnline').onclick = () => { Snd.init(); need(); GS.ui = 'online'; setOnlineMsg(''); };
  $('bOnlineBack').onclick = () => { leaveSession(); GS.ui = 'title'; };
  $('bHost').onclick = () => { Snd.init(); need(); hostOnline(); };
  const ci = $('codeIn'); ci.addEventListener('input', () => { ci.value = GN.normalizeCode(ci.value); });
  ci.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('bJoin').click(); });
  $('bJoin').onclick = () => { Snd.init(); need(); joinOnline(ci.value); };
  $('bLobbyBack').onclick = () => { leaveSession(); };
  $('bStart').onclick = () => { Snd.init(); doAct({ k: 'start' }); };
  $('menubtn').onclick = () => { GS.menu = !GS.menu; Snd.init(); };
  $('bResume').onclick = () => { GS.menu = false; };
  $('bHelp').onclick = () => $('helpText').classList.toggle('hidden');
  $('bQuit').onclick = () => { leaveSession(); };
  $('mutebtn').onclick = () => { Snd.init(); toggleMute(); };
  $('mapbtn').onclick = () => { GS.map = !GS.map; };
})();
function toggleMute() { const m = !Snd.isMuted(); Snd.setMuted(m); GP.save.muted = m; GP.persist(); $('mutebtn').style.opacity = m ? 0.45 : 1; }
$('mutebtn').style.opacity = Snd.isMuted() ? 0.45 : 1;

/* ======================================================================
   Rendering
   ====================================================================== */
const scene = GP.scene, camera = GP.camera;
const MV = GP.MGView(scene);
const camPos = new THREE.Vector3(0, 30, 30), camLook = new THREE.Vector3(), tmpV = new THREE.Vector3();
const BV = { id: null, grp: null, cache: {}, toks: [], sig: '', dice: null, diceTex: null, diceCtx: null, diceN: -1, arrows: [] };
function clearToks() { BV.toks.forEach((t) => { scene.remove(t.hero.root); scene.remove(t.tag); scene.remove(t.blob); }); BV.toks = []; BV.sig = ''; }
function ensureBoard(id) {
  if (BV.id === id) return;
  if (BV.grp) scene.remove(BV.grp);
  BV.grp = BV.cache[id] || (BV.cache[id] = GP.buildBoardScene(id)); scene.add(BV.grp); BV.id = id;
  GP.setTheme(GP.boardById(id).theme); clearToks();
}
function hideBoard() { if (BV.grp) scene.remove(BV.grp); BV.id = null; clearToks(); if (BV.dice) BV.dice.visible = false; BV.arrows.forEach((a) => { a.visible = false; }); }
function tokTarget(S, g, i) {
  const sp = S.pl[i].sp, same = S.pl.map((_, j) => j).filter((j) => S.pl[j].sp === sp), k = same.indexOf(i), m = same.length, s = g.spaces[sp];
  if (m < 2) return { x: s.x, z: s.z }; const a = (k / m) * TAU + 0.6; return { x: s.x + Math.cos(a) * 0.55, z: s.z + Math.sin(a) * 0.55 };
}
function syncTokens(S, g, dt) {
  const sig = S.pl.map((p) => p.name + p.color + (GP.FF ? GP.FF.sig(GP.FF.fitOf(p)) : '')).join('|') + S.gid + S.board;
  if (sig !== BV.sig) {
    clearToks();
    BV.toks = S.pl.map((p, i) => { const hero = GP.buildHero(GP.colorNum(p.color), GP.FF && GP.FF.fitOf(p)); if (GP.FF) GP.FF.tag(hero, i, GP.colorNum(p.color)); hero.root.scale.setScalar(0.85); const tag = GP.nameTag(p.name, p.color); const blob = GP.blob(0.45); scene.add(hero.root); scene.add(tag); scene.add(blob); const t0 = tokTarget(S, g, i); return { hero, tag, blob, sp: p.sp, x: t0.x, z: t0.z, y: 0, fx: t0.x, fz: t0.z, t: 1, dur: 0.3, arc: 0.9, f: 0 }; });
    BV.sig = sig;
  }
  BV.toks.forEach((t, i) => {
    const p = S.pl[i]; if (!p) return; const tg = tokTarget(S, g, i);
    if (p.sp !== t.sp) { const adj = g.spaces[t.sp] && g.spaces[t.sp].next.includes(p.sp); t.fx = t.x; t.fz = t.z; t.t = 0; t.dur = adj ? 0.3 : 0.75; t.arc = adj ? 0.9 : 3.5; t.sp = p.sp; t.f = Math.atan2(tg.x - t.x, tg.z - t.z); }
    if (t.t < 1) { t.t = Math.min(1, t.t + dt / t.dur); t.x = GP.lerp(t.fx, tg.x, t.t); t.z = GP.lerp(t.fz, tg.z, t.t); t.y = Math.sin(t.t * Math.PI) * t.arc; }
    else { t.x += (tg.x - t.x) * GP.damp(8, dt); t.z += (tg.z - t.z) * GP.damp(8, dt); t.y = 0; }
    const cur = S.cur === i && BOARD_PHASES[S.phase];
    const faceCam = Math.atan2(camPos.x - t.x, camPos.z - t.z);
    t.hero.root.position.set(t.x, 0.24 + t.y, t.z); t.hero.root.rotation.y = GP.angLerp(t.hero.root.rotation.y, t.t < 1 ? t.f : faceCam, GP.damp(t.t < 1 ? 20 : 4, dt));
    const pose = t.t < 1 ? 'air' : (S.phase === 'stargot' && cur) ? 'win' : (S.phase === 'bonus' && S.bonus && S.bonus.some((a) => a.w.includes(i))) ? 'win' : 'idle';
    GP.poseHero(t.hero, pose, dt);
    t.tag.position.set(t.x, 2.5 + t.y, t.z); t.tag.material.opacity = cur || S.phase === 'bonus' ? 1 : 0.75;
    t.blob.position.set(t.x, 0.27, t.z);
  });
}
function drawDice(n) {
  if (!BV.dice) {
    const c = document.createElement('canvas'); c.width = c.height = 128; BV.diceCtx = c.getContext('2d'); BV.diceTex = new THREE.CanvasTexture(c);
    BV.dice = new THREE.Mesh(GP.G.box, new THREE.MeshBasicMaterial({ map: BV.diceTex })); BV.dice.scale.setScalar(1.1); scene.add(BV.dice);
  }
  if (n === BV.diceN) return; BV.diceN = n; const g = BV.diceCtx;
  g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#ff4fd8'; g.lineWidth = 14; g.strokeRect(7, 7, 114, 114);
  g.fillStyle = '#1b1440'; g.font = 'bold 80px "Trebuchet MS", Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 64, 70); BV.diceTex.needsUpdate = true;
}
function renderBoard(S, dt, t) {
  MV.stop(); GS.mvUid = 0; hidePodium();
  ensureBoard(S.board); const g = GP.boardGraph(S.board);
  syncTokens(S, g, dt);
  const ud = BV.grp.userData; if (ud.anim) ud.anim(t);
  const st = g.spaces[S.star]; if (st) { ud.star.position.set(st.x, 2.0 + Math.sin(t * 2) * 0.2, st.z); ud.star.rotation.y = t * 1.6; ud.beam.position.set(st.x, 14, st.z); }
  const tok = BV.toks[S.cur];
  let dn = -1; if (S.phase === 'roll') dn = 1 + Math.floor((t * 14) % 10); else if (S.phase === 'rolled') dn = S.dice; else if ((S.phase === 'move' || S.phase === 'choose' || S.phase === 'starmsg' || S.phase === 'evwait') && S.steps > 0) dn = S.steps;
  if (dn > 0 && tok) { drawDice(dn); BV.dice.visible = true; BV.dice.position.set(tok.x, tok.y + 3.6 + Math.sin(t * 5) * 0.12, tok.z); BV.dice.rotation.y = S.phase === 'roll' ? t * 5 : Math.atan2(camPos.x - tok.x, camPos.z - tok.z); BV.dice.rotation.x = S.phase === 'roll' ? Math.sin(t * 7) * 0.4 : 0; }
  else if (BV.dice) BV.dice.visible = false;
  const showA = S.phase === 'choose' && S.choice && S.choice.kind === 'junction';
  if (showA && !BV.arrows.length) for (let k = 0; k < 2; k++) { const a = GP.M(GP.G.cone, GP.basic(0xffffff), 0.45, 0.9, 0.45); a.rotation.x = Math.PI; scene.add(a); BV.arrows.push(a); }
  BV.arrows.forEach((a, k) => { a.visible = !!showA && !!S.choice.opts[k]; if (a.visible) { const s = g.spaces[S.choice.opts[k].id]; a.position.set(s.x, 1.6 + Math.sin(t * 6 + k) * 0.25, s.z); a.material = GP.basic(S.choice.opts[k].dis ? 0x777777 : k ? 0xffd23f : 0xffffff); } });
  const asp = innerWidth / innerHeight, ext = ud.extent;
  if (GS.map || S.phase === 'intro') { const h = ext * (asp < 1 ? 2.3 / Math.max(asp, 0.45) : 1.45); camLook.lerp(tmpV.set(0, 0, 0), GP.damp(3, dt)); camPos.lerp(tmpV.set(0, h, h * 0.42), GP.damp(3, dt)); }
  else if (S.phase === 'mgpick' || S.phase === 'mgintro' || S.phase === 'mgres' || S.phase === 'bonus') { const a = t * 0.12, d = ext * (asp < 1 ? 1.5 : 1.05); camLook.lerp(tmpV.set(0, 0, 0), GP.damp(2, dt)); camPos.lerp(tmpV.set(Math.sin(a) * d, ext * 0.75, Math.cos(a) * d), GP.damp(2, dt)); }
  else if (tok) {
    // Fiesta Fits: a dance / cannon / horn gets a quick close-up while nobody is moving
    let ft = tok, near = false; if (GP.FF && (S.phase === 'roll' || S.phase === 'turn')) { const k = GP.FF.spot(); if (k != null && BV.toks[k]) { ft = BV.toks[k]; near = true; } }
    const d = near ? (asp < 1 ? 7.5 : 5.6) : asp < 1 ? 11.5 : 9, h = near ? (asp < 1 ? 6.5 : 4.2) : asp < 1 ? 12.5 : 8.5;
    camLook.lerp(tmpV.set(ft.x, near ? 1.2 : 0.8, ft.z), GP.damp(4, dt)); camPos.lerp(tmpV.set(ft.x * (near ? 0.95 : 0.85), h, ft.z * (near ? 0.95 : 0.85) + d), GP.damp(2.5, dt));
  }
  camera.position.copy(camPos); camera.lookAt(camLook);
}
function renderMg(S, dt) {
  const mg = S.mg; if (!mg) return;
  if (GS.mvUid !== mg.uid) { hideBoard(); hidePodium(); MV.start(mg, S.pl); GS.mvUid = mg.uid; GP.setTheme({ sky: 0x8fd4ff, fog: 0xbfe6ff, fogNear: 60, fogFar: 160 }); GS.LP = null; if (GS.joyReset) GS.joyReset(); }
  const D = MG[mg.id];
  if (D.ctrl === 'tap') { if (mg.ph2 === 'go' && GS.goId !== mg.go) { GS.goId = mg.go; GS.goSeen = performance.now(); } if (mg.ph2 !== 'go') GS.goSeen = 0; }
  MV.update(mg, dt, GS.me, GS.role === 'client' ? GS.LP : null);
  const b = MV.bounds(), asp = innerWidth / innerHeight, fov = camera.fov * Math.PI / 180, tn = Math.tan(fov / 2);
  const yaw = (asp < 1 && b.w > b.h * 1.2) ? Math.PI / 2 : 0; MV.yaw = yaw;
  const W = (yaw ? b.h : b.w) / 2 + 1.2, Hh = (yaw ? b.w : b.h) / 2 + 1.2, pitch = D.noMove ? 0.72 : 0.95;
  const top = asp < 1 ? 1.4 : 1.1;
  const dist = Math.max(W / (tn * asp), (Hh * Math.sin(pitch) + 1.5) * top / tn) * (asp < 1 ? 1.05 : 1);
  const off = asp < 1 ? -0.8 : -0.4;
  camLook.set(Math.sin(yaw) * off, 0, Math.cos(yaw) * off);
  camPos.set(Math.sin(yaw) * Math.cos(pitch) * dist + camLook.x, Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist + camLook.z);
  camera.position.copy(camPos); camera.lookAt(camLook);
}
const PD = { grp: null, sig: '' };
function hidePodium() { if (PD.grp) scene.remove(PD.grp); PD.grp = null; PD.sig = ''; }
function renderPodium(S, dt, t) {
  hideBoard(); MV.stop(); GS.mvUid = 0;
  const sig = JSON.stringify(S.final) + S.gid + (GP.FF ? S.pl.map((p) => GP.FF.sig(GP.FF.fitOf(p))).join(',') : '');
  if (PD.sig !== sig) {
    hidePodium(); PD.sig = sig; PD.grp = new THREE.Group(); scene.add(PD.grp); PD.heroes = []; PD.star = null;
    GP.setTheme({ sky: 0xffc6ea, fog: 0xffd9f0, fogNear: 30, fogFar: 90 });
    const fl = GP.M(GP.G.cyl20, 0xfff0f8, 9, 1, 9); fl.position.y = -0.5; PD.grp.add(fl);
    const xs = { 1: 0, 2: -2.4, 3: 2.4 }, hs = { 1: 2.2, 2: 1.4, 3: 0.8 }, cols = { 1: 0xffd23f, 2: 0xd0d8e8, 3: 0xe0a060 }, used = {};
    S.final.rows.forEach((r) => {
      const pl = Math.min(3, r.place); used[pl] = (used[pl] || 0) + 1; const x = xs[pl] + (used[pl] - 1) * (pl === 1 ? 2.4 : 1.2) * (pl === 2 ? -1 : 1);
      const blk = GP.M(GP.G.box, cols[pl], 2.2, hs[pl], 2); blk.position.set(x, hs[pl] / 2, 0); PD.grp.add(GP.shadowy(blk, true, true));
      const num = new THREE.Sprite(new THREE.SpriteMaterial({ map: GP.textTex(String(r.place), null, '#1b1440', 90), transparent: true })); num.scale.setScalar(1.1); num.position.set(x, hs[pl] * 0.5, 1.2); PD.grp.add(num);
      const h = GP.buildHero(GP.colorNum(S.pl[r.i].color), GP.FF && GP.FF.fitOf(S.pl[r.i])); if (GP.FF) GP.FF.tag(h, r.i, GP.colorNum(S.pl[r.i].color)); h.root.position.set(x, hs[pl], 0); PD.grp.add(h.root);
      const tag = GP.nameTag(S.pl[r.i].name, S.pl[r.i].color); tag.position.set(x, hs[pl] + 2.3, 0); PD.grp.add(tag);
      PD.heroes.push({ h, place: r.place });
      if (r.place === 1 && !PD.star) { const st = GP.buildStar(0.8); st.position.set(x, hs[pl] + 3.3, 0); PD.grp.add(st); PD.star = st; }
    });
    PD.conf = []; for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(GP.G.box, GP.basic(GP.pick([0xff4fd8, 0x3ff0ff, 0xffe14d, 0x4ade80, 0xff7a3d]))); m.scale.set(0.15, 0.15, 0.03); m.position.set(GP.rand(-7, 7), GP.rand(0, 12), GP.rand(-4, 3)); PD.grp.add(m); PD.conf.push(m); }
  }
  PD.heroes.forEach((q) => GP.poseHero(q.h, q.place === 1 ? 'win' : q.place === 2 ? 'idle' : 'sad', dt));
  if (PD.star) PD.star.rotation.y = t * 2;
  PD.conf.forEach((m, i) => { m.position.y -= dt * (1.5 + (i % 5) * 0.3); m.rotation.x += dt * 3; m.rotation.y += dt * 2; if (m.position.y < 0) m.position.y = 12; });
  const asp = innerWidth / innerHeight, pc = GP.podCam || { d: 13.5, ly: -0.4, cy: 3.4 }, d = asp < 1 ? pc.d : 9.5;
  camLook.set(0, asp < 1 ? pc.ly : 1.0, 0); camPos.set(0, asp < 1 ? pc.cy : 4.2, d); camera.position.copy(camPos); camera.lookAt(camLook); // portrait: podium sits above the results card
}
function renderBackdrop(dt, t, boardId) {
  MV.stop(); GS.mvUid = 0; hidePodium();
  ensureBoard(boardId); clearToks();
  if (BV.dice) BV.dice.visible = false; BV.arrows.forEach((a) => { a.visible = false; });
  const ud = BV.grp.userData; if (ud.anim) ud.anim(t); ud.star.position.set(0, -50, 0); ud.beam.position.set(0, -80, 0);
  const a = t * 0.08, ext = ud.extent, asp = innerWidth / innerHeight, d = ext * (asp < 1 ? 1.6 : 1.1);
  camLook.set(0, 0, 0); camPos.set(Math.sin(a) * d, ext * 0.7, Math.cos(a) * d); camera.position.copy(camPos); camera.lookAt(camLook);
}

/* ---------- fx playback (every peer) ---------- */
const SND_MAP = { coin: 'coin', coins: 'coins', hop: 'hop', dice: 'dice', star: 'star', starmove: 'lucky', beep: 'beep', go: 'go', whistle: 'whistle', bump: 'bump', hurt: 'hurt', stomp: 'stomp', pop: 'pop', boom: 'boom', splash: 'splash', select: 'select', right: 'right', wrong: 'wrong', thud: 'stomp', lose: 'lose', shoot: 'jump', pay: 'lose', warp: 'lucky', ghost: 'ghost', event: 'event', lucky: 'lucky', fanfare: 'fanfare', win: 'win', red: 'lose', blue: 'coin' };
function playFx(S) {
  if (S.fxId < GS.fxSeen) GS.fxSeen = S.fxId;
  S.fx.forEach((e) => {
    if (e.id <= GS.fxSeen) return; GS.fxSeen = e.id;
    if (e.k === 'party') { if (GP.FF) GP.FF.start(e.i, e.a); return; }
    if (e.k === 'coin') { if (S.mode === 'board' && BOARD_PHASES[S.phase]) { floatOver(e.i, (e.n > 0 ? '+' : '') + e.n, e.n > 0 ? '#ffe14d' : '#ff6b86'); } return; }
    if (e.k === 'star' && e.i >= 0) floatOver(e.i, '+1 \u2605', '#ffd23f');
    if ((e.k === 'wrong' || e.k === 'right') && e.i >= 0 && e.i !== GS.me) return;
    Snd.fx(SND_MAP[e.k] || e.k);
    if (e.x != null && MV.grp) { const col = { coin: 0xffd23f, coins: 0xffd23f, pop: 0xff6ae0, boom: 0xff8a20, stomp: 0xffffff, bump: 0xffffff, hurt: 0xff4d4d, splash: 0x9fe6ff }[e.k] || 0xffffff; MV.burst(e.x, 0.8, e.z, col, e.k === 'boom' ? 18 : 10); }
  });
}
const v3 = new THREE.Vector3();
function floatOver(i, text, color) {
  const tok = BV.toks[i]; let x = innerWidth / 2, y = innerHeight / 2;
  if (tok && BV.id) { v3.set(tok.x, tok.y + 2.9, tok.z).project(camera); x = (v3.x * 0.5 + 0.5) * innerWidth; y = (-v3.y * 0.5 + 0.5) * innerHeight; }
  const d = document.createElement('div'); d.className = 'fl'; d.textContent = text; d.style.color = color; d.style.left = clamp(x, 30, innerWidth - 30) + 'px'; d.style.top = clamp(y, 60, innerHeight - 60) + 'px';
  $('floaters').appendChild(d); setTimeout(() => d.remove(), 1400);
}
function toast(text, warn) { const box = $('toasts'); const d = document.createElement('div'); d.className = 'toast' + (warn ? ' warn' : ''); d.textContent = text; box.appendChild(d); setTimeout(() => d.remove(), 3800); while (box.children.length > 3) box.firstChild.remove(); }

/* ======================================================================
   UI (DOM) - re-rendered only when its HTML changes
   ====================================================================== */
const esc = GP.esc, htmlCache = {};
function setHTML(id, html) { if (htmlCache[id] !== html) { htmlCache[id] = html; $(id).innerHTML = html; } }
function show(id, on) { $(id).classList.toggle('hidden', !on); }
const ICON_SVG = {
  star: '<svg viewBox="0 0 64 64"><path d="M32 4l8 17 18 2-13 12 4 18-17-9-17 9 4-18L6 23l18-2z" fill="#ffd23f" stroke="#b06d00" stroke-width="3"/></svg>',
  heart: '<svg viewBox="0 0 64 64"><path d="M32 56S6 40 6 22c0-9 7-15 14-15 6 0 10 4 12 8 2-4 6-8 12-8 7 0 14 6 14 15 0 18-26 34-26 34z" fill="#ff4d6d" stroke="#9b1030" stroke-width="3"/></svg>',
  coin: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#ffd23f" stroke="#9a6200" stroke-width="4"/><rect x="27" y="18" width="10" height="28" rx="4" fill="#e09a00"/></svg>',
  shroom: '<svg viewBox="0 0 64 64"><rect x="22" y="32" width="20" height="22" rx="6" fill="#fff3d6" stroke="#8a6a4a" stroke-width="3"/><path d="M6 34C6 16 18 8 32 8s26 8 26 26z" fill="#3fd34a" stroke="#1a7a2a" stroke-width="3"/><circle cx="22" cy="22" r="5" fill="#fff"/><circle cx="42" cy="22" r="5" fill="#fff"/></svg>',
  moon: '<svg viewBox="0 0 64 64"><path d="M40 6a26 26 0 1 0 18 40A22 22 0 0 1 40 6z" fill="#7aa8ff" stroke="#2a4aa0" stroke-width="3"/></svg>',
  gem: '<svg viewBox="0 0 64 64"><path d="M14 10h36l10 14-28 32L4 24z" fill="#c070ff" stroke="#5a1a9a" stroke-width="3"/><path d="M4 24h56M22 10l10 46 10-46" fill="none" stroke="#5a1a9a" stroke-width="2"/></svg>',
};
const ord = (n) => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');
function cardsHTML(S) {
  return S.pl.map((p, i) => '<div class="pc' + (i === S.cur && BOARD_PHASES[S.phase] && S.phase !== 'mgpick' && S.phase !== 'bonus' ? ' cur' : '') + '" style="--c:' + p.color + '"><div class="nm">' + esc(p.name) + (p.bot ? '<span class="ai">AI</span>' : '') + (i === GS.me ? '<span class="ai">YOU</span>' : '') + '</div><div class="st"><span><b>\u2605</b>' + p.stars + '</span><span><i class="ci"></i> ' + p.coins + '</span></div><span class="rk">' + ord(placeOf(i)) + '</span></div>').join('');
}
function actHTML(S) {
  const me = GS.me, cur = S.pl[S.cur];
  if (S.phase === 'roll') return S.cur === me && !GS.auto ? '<button class="btn primary roll" data-act="roll">ROLL!</button>' : '<div class="wait">' + esc(cur.name) + ' is rolling\u2026</div>';
  if (S.phase === 'choose' && S.choice) {
    const c = S.choice, who = S.pl[c.who];
    if (c.who === me && !GS.auto) return c.opts.map((o, k) => '<button class="btn ' + (k ? 'gold' : 'blue') + '" data-act="choose" data-v="' + esc(o.id) + '"' + (o.dis ? ' disabled' : '') + '>' + esc(o.label) + '<small>' + esc(o.dis ? 'Not enough coins' : o.sub) + '</small></button>').join('');
    return '<div class="wait">' + esc(who.name) + ' is choosing\u2026</div>';
  }
  return '';
}
function lobbyHTML(S) {
  const ed = GS.role !== 'client', set = S.set, dis = ed ? '' : ' disabled';
  const seg = (key, vals, labels) => '<div class="seg">' + vals.map((v, k) => '<button type="button" data-act="set" data-key="' + key + '" data-v="' + v + '" class="' + (set[key] === v ? 'on' : '') + '"' + dis + '>' + labels[k] + '</button>').join('') + '</div>';
  let h = '<div class="set"><div class="lab">MODE</div>' + seg('mode', ['board', 'free', 'fiesta'], ['Party Board', 'Mini Game Free Play', GP.FZ ? GP.FZ.modeLabel() : 'Fiesta']) + '</div>';
  if (set.mode === 'fiesta' && GP.FZ) h += GP.FZ.lobbyInfo();
  if (set.mode === 'board') {
    h += '<div class="set"><div class="lab">BOARD</div><div class="boards">' + GP.BOARDS.map((b) => '<button type="button" data-act="set" data-key="board" data-v="' + b.id + '" style="--bg:' + b.color + '" class="' + (set.board === b.id ? 'on' : '') + (b.dlc ? ' dlc' + (GP.FZ && GP.FZ.can() ? '' : ' locked') : '') + '"' + dis + '>' + esc(b.name) + (b.dlc ? (GP.FZ && GP.FZ.can() ? ' <em class="dlcTag">DLC</em>' : ' \uD83D\uDD12') : '') + '</button>').join('') + '<button type="button" data-act="set" data-key="board" data-v="random" style="--bg:#5a3ad0" class="' + (set.board === 'random' ? 'on' : '') + '"' + dis + '>Random</button></div></div>';
    h += '<div class="set"><div class="lab">TURNS</div>' + seg('turns', [5, 10, 15], ['5 (quick)', '10', '15']) + '</div>';
  }
  h += '<div class="set"><div class="lab">PLAYERS (AI fills empty seats)</div>' + seg('seats', [2, 3], ['2', '3']) + '</div>';
  h += '<div class="set"><div class="lab">AI LEVEL</div>' + seg('diff', ['easy', 'normal'], ['Easy', 'Normal']) + '</div>';
  return h;
}
function lobbyPlayersHTML(S) {
  const L = S.lobby.slice(0, 3), seats = Math.max(L.length, S.set.seats);
  let h = L.map((p) => '<div class="pchip" style="--c:' + p.color + '"><i></i>' + (GP.FF ? GP.FF.chip(S.fits && S.fits[p.pid]) : '') + esc(p.name) + (p.host && GS.role !== 'solo' ? ' (host)' : '') + (p.pid === GS.pid ? ' \u2022 you' : '') + '</div>').join('');
  for (let k = L.length; k < seats; k++) h += '<div class="pchip ai" style="--c:#9a8ac0"><i></i>AI ' + esc(BOT_NAMES[k - L.length]) + '</div>';
  return h;
}
function introHTML(S) {
  const q = S.mgq; if (!q) return ''; const D = MG[q.id], me = GS.me, n = S.pl.length;
  const tag = D.type === '1v2' ? (n >= 3 ? '1 vs 2' : '1 vs 1') : 'FREE-FOR-ALL';
  let role = '';
  if (D.type === '1v2' && me >= 0) role = '<div class="role">' + (me === q.solo ? 'You are SOLO!' : 'You are on the TEAM' + (n >= 3 ? ' with ' + esc(S.pl.filter((_, i) => i !== q.solo && i !== me).map((p) => p.name).join(', ')) : '') + '!') + '</div>';
  const how = D.type === '1v2' && me >= 0 ? (me === q.solo ? D.howtoSolo : D.howtoTeam) : D.howto;
  const tch = GP.IS_TOUCH;
  const ctl = ({ move: tch ? 'Drag on the left side to move' : 'Move: WASD / arrow keys', mash: tch ? 'Tap the big button fast!' : 'Mash SPACE (or click the button)', tap: tch ? 'Tap the big button' : 'Press SPACE', pick: tch ? 'Tap a tile' : 'Click a tile (or keys 1-6)', simon: tch ? 'Tap the colors' : 'Click the colors (or keys 1-4)' })[D.ctrl] + (D.aLabel && D.ctrl === 'move' && (D.id !== 'cannon' || me === q.solo) ? (tch ? ' \u00b7 tap ' + D.aLabel : ' \u00b7 SPACE = ' + D.aLabel) : '');
  const solo = D.type === '1v2' ? '<div class="ctl">Solo: <b style="color:' + S.pl[q.solo].color + '">' + esc(S.pl[q.solo].name) + '</b></div>' : '';
  const rd = '<div class="ready">' + S.pl.map((p, i) => '<span class="' + (S.ready[i] ? 'on' : '') + '" style="--c:' + p.color + '">' + esc(p.name) + (S.ready[i] ? ' \u2713' : '') + '</span>').join('') + '</div>';
  const btn = me >= 0 && !S.ready[me] ? '<button class="btn primary" data-act="ready">READY!</button>' : '<div class="ctl">Starting in ' + Math.max(0, Math.ceil(S.pt)) + '\u2026</div>';
  return '<div class="tag" style="background:' + D.color + '">' + tag + '</div><h2>' + esc(D.name) + '</h2>' + role + '<div class="how">' + esc(how) + '</div><div class="ctl">' + esc(ctl) + '</div>' + solo + rd + btn;
}
function resHTML(S) {
  const R = S.mgr; if (!R) return ''; const D = MG[R.id], me = GS.me;
  let title = D.name + ' results';
  if (R.type === '1v2') title = R.rows.some((r) => r.win && r.i === R.solo) ? 'SOLO WINS!' : 'TEAM WINS!';
  const rows = R.rows.map((r) => { const p = S.pl[r.i]; return '<div class="rrow' + (r.win ? ' win' : '') + '" style="--c:' + p.color + '"><span class="pl">' + (r.win ? '\u2605' : r.place) + '</span><span class="nm">' + esc(p.name) + (r.i === me ? ' (you)' : '') + '</span><span>' + esc(r.label) + '</span><span class="gain">' + (S.mode === 'board' ? (r.coins ? '+' + r.coins + ' <i class="ci"></i>' : '') : p.mgw + ' wins') + '</span></div>'; }).join('');
  const btn = me >= 0 && !S.ready[me] ? '<button class="btn primary" data-act="ready">OK!</button>' : '<div class="ctl" style="color:#6a5a8a">Next up in ' + Math.max(0, Math.ceil(S.pt)) + '\u2026</div>';
  return '<h2>' + esc(title) + '</h2><div class="rlist">' + rows + '</div>' + btn;
}
function freeHTML(S) {
  const host = GS.role !== 'client', n = S.pl.length;
  let h = '<h2>MINI GAME FREE PLAY</h2><p class="sub">' + (host ? 'Pick any mini game!' : 'The host is picking a mini game\u2026') + '<br>Wins: ' + S.pl.map((p) => '<b style="color:' + p.color + '">' + esc(p.name) + ' ' + p.mgw + '</b>').join(' \u00b7 ') + '</p><div class="grid">';
  h += GP.MG_LIST.map((id) => { const D = MG[id]; return '<button type="button" data-act="fpick" data-v="' + id + '" style="--c:' + D.color + '"' + (host ? '' : ' disabled') + '>' + esc(D.name) + '<small>' + (D.type === '1v2' ? (n >= 3 ? '1 vs 2' : '1 vs 1') : 'free-for-all') + '</small></button>'; }).join('');
  h += '</div><div class="btnrow">' + (host ? '<button class="btn gold" data-act="fpick" data-v="random">RANDOM</button>' : '') + (GS.role === 'host' ? '<button class="btn alt" data-act="tolobby">LOBBY</button>' : GS.role === 'solo' ? '<button class="btn alt" data-act="title">TITLE</button>' : '<button class="btn alt" data-act="leave">LEAVE</button>') + '</div>';
  return h;
}
function finalHTML(S) {
  const F = S.final; if (!F) return ''; const top = F.rows.filter((r) => r.place === 1), me = GS.me;
  const title = top.length > 1 ? 'IT\u2019S A TIE!' : esc(S.pl[top[0].i].name) + ' WINS!';
  const bonus = (S.bonus || []).map((a) => '<div class="bonus">\u2605 ' + esc(a.t) + ': ' + a.w.map((i) => esc(S.pl[i].name)).join(' & ') + ' <small>(' + esc(a.d) + ')</small></div>').join('');
  const rows = F.rows.map((r) => { const p = S.pl[r.i]; return '<div class="rrow' + (r.place === 1 ? ' win' : '') + '" style="--c:' + p.color + '"><span class="pl">' + r.place + '</span><span class="nm">' + esc(p.name) + (r.i === me ? ' (you)' : '') + '</span><span>\u2605 ' + p.stars + '</span><span><i class="ci"></i> ' + p.coins + '</span></div>'; }).join('');
  const btns = GS.role === 'client' ? '<div class="ctl" style="color:#6a5a8a">Waiting for the host to start a rematch\u2026</div><div class="btnrow"><button class="btn alt" data-act="leave">LEAVE</button></div>' : '<div class="btnrow"><button class="btn primary" data-act="rematch">REMATCH</button>' + (GS.role === 'host' ? '<button class="btn alt" data-act="tolobby">LOBBY</button>' : '<button class="btn alt" data-act="title">TITLE</button>') + '</div>';
  return '<h2>' + title + '</h2>' + bonus + '<div class="rlist">' + rows + '</div>' + btns;
}
function mgPanelHTML(S) {
  const mg = S.mg, D = MG[mg.id], me = GS.me; if (me < 0 || !mg.p[me]) return '';
  if (D.ctrl === 'pick') {
    const local = GS.myPick && GS.myPick.uid === mg.uid && GS.myPick.r === mg.r ? GS.myPick.v : -1, pickMine = mg.p[me].pk >= 0 ? mg.p[me].pk : local;
    const ask = mg.ph2 === 'show' ? '<div class="ask">Remember the pictures!</div>' : mg.ph2 === 'ask' ? '<div class="ask">Where is ' + ICON_SVG[GP.ICONS[mg.q]] + ' ?</div>' : '<div class="ask">' + (mg.p[me].ok ? 'Correct!' : 'Oops!') + ' ' + ICON_SVG[GP.ICONS[mg.q]] + '</div>';
    return ask + '<div class="tiles">' + mg.tiles.map((ic, k) => {
      const showIc = mg.ph2 !== 'ask', good = mg.ph2 === 'reveal' && k === mg.q, mine = pickMine === k && mg.ph2 !== 'show';
      const dots = mg.ph2 === 'reveal' ? '<div class="dots">' + mg.p.map((p, i) => (p.pk === k ? '<i style="--c:' + S.pl[i].color + '"></i>' : '')).join('') + '</div>' : '';
      return '<div class="tile' + (showIc ? '' : ' hide') + (good ? ' good' : '') + (mine ? ' mine' : '') + '" data-tap="' + k + '">' + (showIc ? ICON_SVG[ic] : '') + dots + '</div>';
    }).join('') + '</div>';
  }
  if (D.ctrl === 'simon') {
    const p = mg.p[me], lit = mg.ph2 === 'show' && mg.lit ? mg.seq[mg.si] : -1;
    const txt = p.out ? 'You are out! Watch the others.' : mg.ph2 === 'show' ? 'Watch\u2026 (' + mg.seq.length + ' colors)' : mg.ph2 === 'input' ? (p.dn ? 'Done! Waiting\u2026' : 'Your turn! ' + p.pg + ' / ' + mg.seq.length) : 'Get ready\u2026';
    return '<div class="prog">' + txt + '</div><div class="simon">' + GP.SIMON_C.map((c, k) => '<button type="button" data-tap="' + k + '" style="--c:' + c + '" class="' + (lit === k ? 'lit' : '') + '"' + (p.out ? ' disabled' : '') + '></button>').join('') + '</div>';
  }
  return '';
}
function mgCenter(S) {
  const mg = S.mg, D = MG[mg.id];
  if (S.phase === 'mgend') return 'FINISH!';
  if (mg.cd > 0) return String(Math.ceil(mg.cd));
  if (mg.T - mg.t < 0.7 && mg.t > 0) return 'GO!';
  if (D.ctrl === 'tap') { const p = mg.p[GS.me]; if (mg.ph2 === 'wait') return p && p.fs ? '<small>False start! Sit out\u2026</small>' : '<small>Wait for it\u2026</small>'; if (mg.ph2 === 'go') return '!'; if (mg.ph2 === 'res') return '<small>' + (mg.win >= 0 ? esc(S.pl[mg.win].name) + ' wins the round!' : 'Nobody!') + '</small>'; }
  return '';
}
function uiSync() {
  const S = S_(), ph = S ? S.phase : '';
  let scr = '';
  if (!S) scr = GS.ui === 'online' ? 'scrOnline' : 'scrTitle';
  else if (ph === 'lobby') scr = 'scrLobby';
  else if (ph === 'mgintro') scr = 'scrIntro';
  else if (ph === 'mgres') scr = 'scrRes';
  else if (ph === 'fpick') scr = 'scrFree';
  else if (ph === 'final') scr = 'scrFinal';
  ['scrTitle', 'scrOnline', 'scrLobby', 'scrIntro', 'scrRes', 'scrFree', 'scrFinal'].forEach((id) => show(id, id === scr));
  show('scrMenu', !!S && GS.menu);
  show('menubtn', !!S && ph !== 'lobby');
  const board = !!S && S.mode === 'board' && !!BOARD_PHASES[ph];
  show('mapbtn', board && ph !== 'intro');
  $('mapbtn').textContent = GS.map ? 'BACK' : 'MAP';
  show('hud', board);
  const inMg = !!S && (ph === 'mgplay' || ph === 'mgend') && !!S.mg;
  show('mghud', inMg);
  if (GP.FZ) GP.FZ.ui(S, ph, inMg);
  if (!S) { show('bHost', !GS.connecting); return; }
  if (ph === 'lobby') {
    const code = GS.room && GS.role !== 'solo' ? GS.room.code : '';
    setHTML('lobbyCode', code ? 'ROOM CODE<b>' + esc(code) + '</b>Friends tap PLAY ONLINE \u2192 enter this code' : ''); show('lobbyCode', !!code);
    $('lobbyTitle').textContent = GS.role === 'solo' ? (S.set.mode === 'free' ? 'FREE PLAY SETUP' : S.set.mode === 'fiesta' ? 'FIESTA SETUP' : 'PARTY SETUP') : 'ONLINE LOBBY';
    setHTML('lobbyPlayers', lobbyPlayersHTML(S)); setHTML('lobbySettings', lobbyHTML(S));
    $('lobbyWait').textContent = GS.role === 'client' ? 'Waiting for the host to start\u2026' : (GS.role === 'host' && S.lobby.length < 2 ? 'Share the code! Or start now and play with AI.' : '');
    $('lobbyWait').classList.add('ok');
    show('bStart', GS.role !== 'client'); $('bLobbyBack').textContent = GS.role === 'solo' ? 'BACK' : 'LEAVE';
  }
  if (board) {
    setHTML('cards', cardsHTML(S));
    setHTML('turnpill', 'Turn <b>' + S.turn + '</b>/' + S.turns + (S.frenzy ? ' \u00b7 x2 FRENZY' : ''));
    $('turnpill').classList.toggle('frenzy', !!S.frenzy);
    const m = S.msg, bn = $('banner');
    if (m && !GS.map) {
      let sub = m.s; if (ph === 'mgpick' && S.mgq) sub = S.pt > T(0.9) ? MG[GP.MG_LIST[Math.floor(performance.now() / 90) % GP.MG_LIST.length]].name : '\u2192 ' + MG[S.mgq.id].name + ' \u2190';
      setHTML('bannerT', esc(m.t)); setHTML('bannerS', esc(sub)); bn.style.setProperty('--bc', m.c); bn.classList.add('show');
    } else bn.classList.remove('show');
    setHTML('actbar', actHTML(S));
  }
  if (ph === 'mgintro') setHTML('introCard', introHTML(S));
  if (ph === 'mgres') setHTML('resCard', resHTML(S));
  if (ph === 'fpick') setHTML('freeCard', freeHTML(S));
  if (ph === 'final') setHTML('finalCard', finalHTML(S));
  if (inMg) {
    const mg = S.mg, D = MG[mg.id], me = GS.me;
    $('mgtimer').textContent = Math.ceil(Math.max(0, mg.t)); $('mgtimer').classList.toggle('low', mg.t <= 5);
    setHTML('mgscores', mg.p.map((p, i) => '<div class="sc' + (i === me ? ' me' : '') + '" style="--c:' + S.pl[i].color + '">' + esc(S.pl[i].name) + '<b>' + esc(D.label(mg, i)) + '</b></div>').join(''));
    setHTML('mgcenter', mgCenter(S));
    const playing = me >= 0 && ph === 'mgplay';
    const canA = D.ctrl === 'move' && D.aLabel && (D.id !== 'cannon' || me === mg.solo);
    show('joyzone', playing && D.ctrl === 'move'); show('abtn', playing && !!canA); $('abtn').textContent = D.aLabel || '';
    show('mashbtn', playing && (D.ctrl === 'mash' || D.ctrl === 'tap')); $('mashbtn').textContent = D.aLabel || 'MASH!';
    $('mashbtn').disabled = mg.cd > 0;
    setHTML('mgpanel', playing ? mgPanelHTML(S) : ''); show('mgpanel', playing && (D.ctrl === 'pick' || D.ctrl === 'simon'));
  }
}

/* ======================================================================
   Main loop
   ====================================================================== */
let last = performance.now(), clock = 0;
function clientPredict(S, dt, now) {
  if (GS.role !== 'client' || !GS.room) return;
  const mg = S.mg; if (S.phase !== 'mgplay' || !mg || GS.me < 0) { GS.LP = null; return; }
  const D = MG[mg.id]; if (!D.arena || D.noMove) return;
  const sp = mg.p[GS.me]; if (!sp) return;
  if (!GS.LP || GS.LP.uid !== mg.uid) GS.LP = Object.assign({ uid: mg.uid }, sp);
  const LP = GS.LP;
  if ((sp.kk | 0) !== (LP.kk | 0)) { ['x', 'z', 'y', 'vx', 'vz', 'vy', 'd'].forEach((k) => { LP[k] = sp[k] || 0; }); LP.kk = sp.kk; }
  LP.st = sp.st; LP.out = sp.out; LP.fall = sp.fall; LP.spd = sp.spd;
  if (mg.cd > 0) { pendingA = false; return; }
  const inp = localInput(); if (inp.a && D.act) doAct({ k: 'mg', v: 'a' });
  GP.moveAvatar(LP, inp, dt, D.arena);
  if (now - GS.lastIn > 50) { GS.lastIn = now; GS.room.send({ t: 'in', x: +LP.x.toFixed(3), z: +LP.z.toFixed(3), y: +(LP.y || 0).toFixed(3), vx: +LP.vx.toFixed(2), vz: +LP.vz.toFixed(2), vy: +(LP.vy || 0).toFixed(2), f: +(LP.f || 0).toFixed(2), d: +(LP.d || 0).toFixed(2), kk: LP.kk | 0 }); }
}
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now; clock += dt;
  try {
    if (GS.role === 'host' || GS.role === 'solo') hostStep(dt);
    netTick(now);
    const S = S_();
    if (S) {
      GS.me = S.pl.findIndex((p) => p.pid === GS.pid);
      clientPredict(S, dt, now);
      playFx(S);
      if ((S.phase === 'mgplay' || S.phase === 'mgend') && S.mg) { renderMg(S, dt); Snd.play('mini'); }
      else if (S.phase === 'final' && S.final) { renderPodium(S, dt, clock); Snd.play('title'); }
      else if (S.mode === 'fiesta' && GP.FZ && S.phase !== 'lobby' && S.fz) { hideBoard(); hidePodium(); MV.stop(); GS.mvUid = 0; GP.FZ.render(S, dt, clock); Snd.play(GP.FZ.song()); }
      else if (S.mode === 'board' && S.board && S.phase !== 'lobby' && S.phase !== 'fpick') { renderBoard(S, dt, clock); Snd.play(GP.boardById(S.board).song); }
      else { renderBackdrop(dt, clock, S.set.mode === 'board' && S.set.board !== 'random' ? S.set.board : 'candy'); Snd.play('title'); }
    } else { renderBackdrop(dt, clock, 'candy'); Snd.play('title'); }
    if (GP.FF) GP.FF.tick(dt);
    uiSync();
  } catch (e) { console.error(e); }
  GP.renderer.render(scene, camera);
}

/* auto-join from URL (?mp=host|join&code=..&name=..&color=..) */
(function autoStart() {
  const prm = GN.params(); if (!prm) return;
  prof.name = prm.name; prof.color = prm.color; $('nameIn').value = prm.name;
  if (prm.mode === 'host') hostOnline(prm.code); else { $('codeIn').value = prm.code; joinOnline(prm.code); }
})();
requestAnimationFrame(frame);

/* hand the fiesta module what it needs from this closure */
if (GP.FZ) GP.FZ.bind({ GS, S_, setPhase, msg, fx, addCoins, isBot, seatOf, nm, touch, chooseSolo, eligible, toIntro, localInput, toast, doAct, show, setHTML, leaveSession, startSolo, MV, camera, scene, prof, keys, isClient: () => GS.role === 'client', pressA: () => { pendingA = true; } });

/* test / debug hooks */
GP.FFbind = { GS, S_, doAct, toast, BOARD_PHASES };
window.__party = {
  get S() { return GS.S; }, GS, act: doAct, me: () => GS.me,
  setAuto(on) { GS.auto = !!on; },
  forceMg(id) { const S = S_(); if (!S || GS.role === 'client') return; S.mgq = { id, solo: chooseSolo(id) }; toIntro(); },
  boards: () => GP.BOARDS.map((b) => { const g = GP.boardGraph(b.id); return { id: b.id, n: g.spaces.length, junctions: g.junctions.map((j) => ({ at: j.at, k: j.k, main: j.mainSteps, toll: j.toll })), stars: g.starSpots }; }),
};
})();
