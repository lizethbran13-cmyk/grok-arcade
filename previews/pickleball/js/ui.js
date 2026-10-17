// Grok Pickleball Park - menus: title, look, how-to, journal, Pro Shop, ladder, tournaments, match setup, drills, snacks, results.
import { $, esc } from './util.js?v=ppk2';
import { S, persist, resetSave } from './save.js?v=ppk2';
import { sfx, setSound } from './audio.js?v=ppk2';
import { panel, closePanel, on, toast } from './uikit.js?v=ppk2';
import { SKINS, HAIRS, HAIR_COLS, SHIRTS, PANTS, cleanLook } from './humans.js?v=ppk2';
import { goal } from './story.js?v=ppk2';
import { PADDLES, BALLS, HATS, SHOES, RANKS, rankOf, LADDER, NAMES, TOURNEYS, DRILLS, COURTS, PARTNERS } from './data.js?v=ppk2';
import { SPOTS } from './map.js?v=ppk2';
const hex = (c) => '#' + c.toString(16).padStart(6, '0');
const R = () => Math.random(), pick = (a) => a[(R() * a.length) | 0];
const rndLook = () => ({ skin: (R() * 6) | 0, hair: (R() * 6) | 0, hairC: (R() * 6) | 0, shirt: (R() * 8) | 0, pants: (R() * 6) | 0 });
const DIFFS = [['easy', '🙂 Easy'], ['medium', '😎 Medium'], ['hard', '🔥 Hard'], ['pro', '👑 Pro']];
const bar = (v, c) => `<span class="sbar"><i style="width:${Math.round(v * 100)}%;background:${c}"></i></span>`;
export class UI {
  constructor(app) { this.app = app; this.setup = { diff: 'easy', doubles: false, to: S.opts.to || 11, partner: S.partner || 'kai' }; }
  get g() { return this.app.game; }
  open() { this.app.busy = true; }
  back() { this.app.resume(); }
  // ---------------- title / look / options / how ----------------
  title() { const app = this.app; const ui = $('ui'); ui.classList.add('open'); app.preview = false; ui.innerHTML = `<div class="title">
      <div class="logo"><span class="l0">GROK</span><span class="l1">PICKLEBALL</span><span class="l2">PARK</span></div>
      <p class="tag">A giant sports park full of courts, players and pets. Real pickleball rules, a Pro Shop with the MaxGrit paddle, drills with Luna, the Park Ladder, tournaments... and the Night Lights Court.</p>
      <div class="tBtns"><button class="go" id="tPlay">▶ ${S.made ? 'BACK TO THE PARK' : 'ENTER THE PARK'}</button><button class="mbtn2" id="tLook">👤 YOUR LOOK</button><button class="mbtn2" id="tOpts">⚙️ OPTIONS</button></div>
      <p class="foot">A Grok game · Torty, Luna, Pi-rat, Snowie & Candy</p></div>`;
    on(ui, '#tPlay', () => { if (!S.made) return this.custom(() => app.play(), true); app.play(); }); on(ui, '#tLook', () => this.custom(() => this.title())); on(ui, '#tOpts', () => this.options(() => this.title())); }
  custom(done, first) { const app = this.app; app.preview = true; const L = S.look = cleanLook(S.look);
    const row = (k, arr, txt) => `<div class="swRow">${arr.map((c, i) => txt ? `<button data-k="${k}" data-i="${i}" class="txt ${L[k] === i ? 'on' : ''}">${c}</button>` : `<button data-k="${k}" data-i="${i}" class="${L[k] === i ? 'on' : ''}" style="background:${hex(c)}"></button>`).join('')}</div>`;
    panel(`<h2>👤 ${first ? 'PLAYER CARD' : 'YOUR LOOK'}</h2><h3>NAME</h3><input id="cName" maxlength="12" value="${esc(S.name || '')}" placeholder="Your name">
      <h3>SKIN</h3>${row('skin', SKINS)}<h3>HAIR</h3>${row('hair', HAIRS, true)}${row('hairC', HAIR_COLS)}<h3>SHIRT</h3>${row('shirt', SHIRTS)}<h3>SHORTS</h3>${row('pants', PANTS)}
      <button class="go" id="cOk">${first ? '🏓 LET\'S PLAY!' : 'DONE'}</button>`, (c) => {
      c.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => { sfx('click'); const nm = c.querySelector('#cName').value; L[b.dataset.k] = +b.dataset.i; S.look = L; S.name = String(nm || '').slice(0, 12); persist(); app.game.refreshMe(); this.custom(done, first); });
      on(c, '#cOk', () => { S.name = String(c.querySelector('#cName').value || '').slice(0, 12) || 'Player'; S.made = true; persist(); app.game.refreshMe(); app.preview = false; done(); }); }, 'custP'); }
  options(back) { const o = S.opts; const t = (id, k, n) => `<button id="${id}" class="${o[k] !== false ? 'on' : ''}">${n}</button>`;
    panel(`<h2>⚙️ OPTIONS</h2><div class="seg">${t('oS', 'sound', '🔊 Sound')}${t('oM', 'music', '🎵 Music')}</div>
      <h3>PLAYING HELP</h3><div class="seg">${t('oA', 'assist', '🧭 Auto-move + aim help')}${t('oW', 'autoswing', '🏓 Auto-swing')}</div>
      <p class="sub">Auto-move runs you to the ball and stops you at the kitchen line. Auto-swing times the hit for you, so you just pick the shot (DINK, DROP, DRIVE, LOB, SMASH, SPIN). Turn both off to play like a pro.</p>
      <h3>GAME LENGTH (quick matches)</h3><div class="seg"><button id="o7" class="${o.to === 7 ? 'on' : ''}">⚡ To 7</button><button id="o11" class="${o.to !== 7 ? 'on' : ''}">🏆 To 11 (official)</button></div>
      <p class="sub">Graphics are always on full: Turbo engine with soft shadows, ambient occlusion and bloom. The game only ever sharpens itself when your phone has speed to spare.</p>
      <button class="mbtn2 sm danger" id="oR">Reset save</button><button class="go" id="oB">BACK</button>`, (c) => {
      const tg = (k) => { o[k] = o[k] === false; persist(); setSound(o.sound, o.music); this.options(back); };
      on(c, '#oS', () => tg('sound')); on(c, '#oM', () => tg('music')); on(c, '#oA', () => tg('assist')); on(c, '#oW', () => tg('autoswing'));
      on(c, '#o7', () => { o.to = 7; this.setup.to = 7; persist(); this.options(back); }); on(c, '#o11', () => { o.to = 11; this.setup.to = 11; persist(); this.options(back); });
      on(c, '#oR', () => { if (confirm('Reset your Pickleball Park save?')) { resetSave(); location.reload(); } }); on(c, '#oB', back); }); }
  how(done) { panel(`<h2>🏓 WELCOME TO THE PARK!</h2><div class="how"><p>🕹️ Left thumb: walk. Drag anywhere else to look. 👁️ switches first / third person.</p><p>🏟️ Walk onto any court's yellow spot and tap the button to play.</p>
      <p>📏 <b>Real rules:</b> serve underhand and diagonal. The serve must bounce, and the return must bounce (two-bounce rule). No volleys in the 7-foot kitchen. Only the serving side scores, to 11, win by 2.</p>
      <p>👉 In a match: tap = hit, swipe up = soft/drive (longer = harder), swipe way up = lob, swipe down = smash. Sideways aims. Or tap the shot buttons. 🌀 adds MaxGrit spin.</p>
      <p>🛒 Torty's Pro Shop, 🏛️ Clubhouse (ladder + tournaments), 🎯 Training Center, 🌭 Snack Shack, 🌙 Night Lights Court and 🤫 the Quiet Court are all walk-in.</p></div><button class="go" id="hOk">LET'S PLAY!</button>`, (c) => on(c, '#hOk', () => { S.seenHow = true; persist(); done(); })); }
  // ---------------- journal / pause ----------------
  pause(inMatch) { const app = this.app; app.busy = true; app.paused = true; const mv = this.g.mv;
    if (mv) { panel(`<h2>⏸ ${mv.drill ? 'DRILL' : 'MATCH'} PAUSED</h2><p class="sub">${esc(COURTS[mv.cid].n)}</p>
        <div class="btnRow"><button class="go" id="pR">▶ RESUME</button></div>
        <div class="seg"><button id="pA" class="${S.opts.assist !== false ? 'on' : ''}">🧭 Auto-move</button><button id="pW" class="${S.opts.autoswing !== false ? 'on' : ''}">🏓 Auto-swing</button><button id="pV">👁️ View</button></div>
        <div class="how"><p>Two-bounce rule: let the serve AND the return bounce. Kitchen: no volleys inside the 7-foot zone (the court glows red to warn you).</p></div>
        <div class="btnRow"><button class="mbtn2 sm danger" id="pQ">🏳️ ${mv.drill ? 'End drill' : 'Leave match'}</button><button class="mbtn2 sm" id="pO">⚙️ Options</button></div>`, (c) => {
        on(c, '#pR', () => app.resume()); on(c, '#pA', () => { S.opts.assist = S.opts.assist === false; mv.m.players[0].assist = S.opts.assist; persist(); this.pause(true); }); on(c, '#pW', () => { S.opts.autoswing = S.opts.autoswing === false; persist(); this.pause(true); });
        on(c, '#pV', () => { mv.toggleFP(); app.resume(); }); on(c, '#pO', () => this.options(() => this.pause(true)));
        on(c, '#pQ', () => { if (S.tourRun && mv.cfg.mode === 'tourney') { S.tourRun = null; persist(); toast('🏳️ You withdrew from the tournament'); } this.g.endMatch(); app.resume(); }); }); return; }
    panel(`<h2>📒 PARK JOURNAL</h2><p class="sub">⭐ ${esc(goal())}</p>${this.cardHtml()}
      <div class="btnRow"><button class="go" id="pR">▶ RESUME</button></div><div class="btnRow"><button class="mbtn2 sm" id="pM">🗺️ Map</button><button class="mbtn2 sm" id="pD">🎯 Drills</button><button class="mbtn2 sm" id="pB">🎒 Bag</button></div>
      <div class="btnRow"><button class="mbtn2 sm" id="pL">👤 Look</button><button class="mbtn2 sm" id="pO">⚙️ Options</button><button class="mbtn2 sm" id="pH">❓ Rules</button><button class="mbtn2 sm" id="pT">🏠 Title</button></div>`, (c) => {
      on(c, '#pR', () => app.resume()); on(c, '#pM', () => this.map()); on(c, '#pD', () => this.drills('train', true)); on(c, '#pB', () => this.bag()); on(c, '#pL', () => this.custom(() => this.pause())); on(c, '#pO', () => this.options(() => this.pause())); on(c, '#pH', () => this.how(() => this.pause())); on(c, '#pT', () => app.toTitle()); }); }
  cardHtml() { const st = S.stats, rk = rankOf(S.rating), pd = PADDLES.find((p) => p.id === S.eq.paddle);
    return `<div class="pcard"><div class="pcTop"><b>${esc(S.name || 'Player')}</b><span>${rk.n}</span></div><div class="statGrid"><div><b>${S.rating.toFixed(1)}</b><small>⭐ Rating</small></div><div><b>${S.coins}</b><small>🪙 Coins</small></div><div><b>${S.ladder >= 1 ? '#' + (S.ladder + 1 > 10 ? '—' : S.ladder + 1) : '👑 #1'}</b><small>🪜 Ladder</small></div><div><b>${st.wins}-${st.losses}</b><small>🏓 Record</small></div></div>
      <p class="sub">🏓 ${esc(pd.n)} · 🎾 ${esc(BALLS.find((b) => b.id === S.eq.ball).n)} · 🏆 ${TOURNEYS.filter((t) => S.tour[t.id]).map((t) => t.icon).join(' ') || 'no trophies yet'}</p>
      <p class="sub">${[['candy', '🐶 Met Candy'], ['firstwin', '🏓 First Win'], ['ladder', '🪜 Ladder Climber'], ['king', '👑 Beat the King'], ['drill', '🎯 Drill Star'], ['spin', '🌀 Spin Doctor']].map(([k, n]) => `<span class="badge ${S.badges[k] ? 'on' : ''}">${n}</span>`).join(' ')}</p></div>`; }
  card() { this.open(); panel(`<h2>📇 MY PLAYER CARD</h2>${this.cardHtml()}<p class="sub">Ranks: ${RANKS.map((r) => r.r.toFixed(1) + ' ' + r.n).join(' · ')}</p><button class="go" id="b">CLOSE</button>`, (c) => on(c, '#b', () => this.back())); }
  bag() { this.open(); const row = (cat, list) => list.filter((x) => S.own[cat].includes(x.id)).map((x) => `<button class="hat ${S.eq[cat] === x.id ? 'on' : ''}" data-c="${cat}" data-i="${x.id}">${esc(x.n)}</button>`).join('');
    panel(`<h2>🎒 MY BAG</h2><h3>PADDLE</h3><div class="hats">${row('paddle', PADDLES)}</div><h3>BALL</h3><div class="hats">${row('ball', BALLS)}</div><h3>HAT</h3><div class="hats">${row('hat', HATS)}</div><h3>SHOES</h3><div class="hats">${row('shoe', SHOES)}</div><button class="go" id="b">DONE</button>`, (c) => {
      c.querySelectorAll('[data-c]').forEach((b) => b.onclick = () => { sfx('click'); S.eq[b.dataset.c] = b.dataset.i; persist(); this.g.refreshMe(); this.bag(); }); on(c, '#b', () => this.back()); }); }
  map() { this.open(); const P = [['🎟️ Park Entrance', 0, 108, Math.PI], ['⛲ Fountain Plaza', 0, 72, Math.PI], ['🏟️ Stadium Court', 0, 9, Math.PI], ['🏓 West Courts', -54, 16, Math.PI], ['🏓 East Courts', 54, 16, Math.PI], ['🏛️ Clubhouse', -14, 57, -Math.PI / 2], ['🛒 Torty\'s Pro Shop', 14, 57, Math.PI / 2], ['🌭 Snack Shack', -24, 99, Math.PI], ['🎯 Training Center', 12, 94, Math.PI / 2], ['🌙 Night Lights Court', 54, -34, Math.PI], ['🤫 Quiet Court', -54, -34, Math.PI], ['🐶 Candy\'s Dog Run', 0, -60, Math.PI]];
    panel(`<h2>🗺️ PARK MAP</h2><p class="sub">Tap to fast-travel.</p><div class="hats">${P.map((p, i) => `<button class="hat" data-i="${i}">${p[0]}</button>`).join('')}</div><button class="mbtn2" id="b">CLOSE</button>`, (c) => {
      c.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { sfx('whoosh'); const p = P[+b.dataset.i]; this.g.tp(p[1], p[2], p[3]); this.back(); }); on(c, '#b', () => this.back()); }); }
  // ---------------- Torty's Pro Shop ----------------
  shop(cat = 'paddle', focus) { this.open(); const lists = { paddle: PADDLES, ball: BALLS, gear: [...HATS.filter((h) => h.id !== 'none').map((h) => Object.assign({ cat: 'hat' }, h)), ...SHOES.filter((s) => s.id !== 'court').map((s) => Object.assign({ cat: 'shoe' }, s))] };
    const item = (x) => { const c = x.cat || cat, own = S.own[c].includes(x.id), eq = S.eq[c] === x.id;
      const vis = cat === 'paddle' ? `<span class="pdl" style="--a:${hex(x.a)};--b:${hex(x.b)}">${x.face === 'grit' ? '<em></em>' : ''}</span>` : cat === 'ball' ? `<span class="bal" style="--a:${hex(x.col)}">${x.quiet ? '' : '<em></em>'}</span>` : `<span class="ic">${c === 'hat' ? '🧢' : '👟'}</span>`;
      const stats = cat === 'paddle' ? `<div class="stats"><small>POWER</small>${bar(x.pow, '#f97316')}<small>CONTROL</small>${bar(x.ctl, '#38bdf8')}<small>SPIN</small>${bar(x.spin, '#a855f7')}</div>` : cat === 'ball' ? `<div class="stats"><small>SPEED</small>${bar(1 - (x.drag - 0.04) * 10, '#f97316')}<small>BOUNCE</small>${bar((x.bounce - 0.5) * 3.5, '#38bdf8')}<small>${x.quiet ? '🤫 QUIET' : x.legal ? '✅ TOURNEY LEGAL' : ''}</small></div>` : '';
      return `<div class="shopIt ${focus === x.id ? 'focus' : ''} ${x.star ? 'star' : ''}">${vis}<div class="si"><b>${esc(x.n)}</b>${x.by ? `<small>${esc(x.by)}</small>` : ''}<p>${esc(x.d || '')}</p>${stats}</div>
        <button class="buy ${eq ? 'eq' : own ? 'own' : ''}" data-id="${x.id}" data-c="${c}">${eq ? '✔ USING' : own ? 'USE' : '🪙 ' + x.price}</button></div>`; };
    panel(`<h2>🛒 TORTY'S PRO SHOP</h2><p class="sub">🐢 "Slow and steady wins the rally!" · You have <b>🪙 ${S.coins}</b></p>
      <div class="seg"><button data-t="paddle" class="${cat === 'paddle' ? 'on' : ''}">🏓 Paddles</button><button data-t="ball" class="${cat === 'ball' ? 'on' : ''}">🎾 Balls</button><button data-t="gear" class="${cat === 'gear' ? 'on' : ''}">🧢 Gear</button></div>
      <div class="shopList">${lists[cat].map(item).join('')}</div><button class="go" id="b">THANKS, TORTY!</button>`, (c) => {
      c.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => { sfx('click'); this.shop(b.dataset.t); });
      c.querySelectorAll('.buy').forEach((b) => b.onclick = () => { const id = b.dataset.id, k = b.dataset.c, x = [...PADDLES, ...BALLS, ...HATS, ...SHOES].find((q) => q.id === id && (k !== 'hat' || HATS.includes(q)) && (k !== 'shoe' || SHOES.includes(q)));
        if (!S.own[k].includes(id)) { if (S.coins < x.price) { sfx('deny'); toast('🪙 Need ' + (x.price - S.coins) + ' more coins. Win matches or do drills!'); return; } S.coins -= x.price; S.own[k].push(id); sfx('buy'); toast('🐢 Torty: "Great pick! The ' + x.n + ' is yours."'); if (id === 'maxgrit') S.badges.spin = 1; }
        else sfx('click'); S.eq[k] = id; persist(); this.g.refreshMe(); this.shop(cat, id); });
      on(c, '#b', () => this.back()); if (focus) { const f = c.querySelector('.focus'); if (f) f.scrollIntoView({ block: 'center' }); } }, 'shopP'); }
  // ---------------- snacks ----------------
  snacks() { this.open(); const M = [['🥒', 'Pickle Juice', 4, 'Electrolytes! +10% reach next match'], ['🌭', 'Dill Dog', 8, 'A hot dog with a pickle spear. +10% reach next match'], ['🧀', 'Kitchen Nachos', 10, 'Named after the non-volley zone. +10% reach next match'], ['🍧', 'Snowie Cone', 6, 'Snowie\'s favorite. Blue raspberry. +10% reach next match']];
    panel(`<h2>🌭 DILL-ICIOUS SNACK SHACK</h2><p class="sub">🐁 Snowie: "Order up!" · 🪙 ${S.coins}</p><div class="shopList">${M.map((m, i) => `<div class="shopIt"><span class="ic big">${m[0]}</span><div class="si"><b>${m[1]}</b><p>${m[3]}</p></div><button class="buy" data-i="${i}">🪙 ${m[2]}</button></div>`).join('')}</div><button class="go" id="b">BACK</button>`, (c) => {
      c.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { const m = M[+b.dataset.i]; if (S.coins < m[2]) { sfx('deny'); toast('🪙 Not enough coins'); return; } S.coins -= m[2]; S.snacks = (S.snacks || 0) + 1; S.buff = 'pop'; persist(); sfx('buy'); toast(m[0] + ' Yum! You feel speedy.'); this.snacks(); }); on(c, '#b', () => this.back()); }); }
  // ---------------- quick match on any court ----------------
  oppDef(diff, k = 0) { return { n: NAMES[(Math.random() * NAMES.length + k) % NAMES.length | 0], diff, look: rndLook(), hat: pick(['none', 'visor', 'cap', 'headband']), style: {} }; }
  partnerDef(id) { const p = PARTNERS.find((q) => q.id === id) || PARTNERS[0]; return Object.assign({}, p); }
  matchSetup(court) { this.open(); const C = COURTS[court], s = this.setup; const quiet = C.kind === 'quiet';
    panel(`<h2>🏓 ${esc(C.n)}</h2><p class="sub">${quiet ? '🤫 Silent Serve foam balls only on this court. Shh!' : C.kind === 'night' ? '🌙 Under the light towers' : C.kind === 'stadium' ? '🏟️ The big one. Pi-rat is the umpire.' : 'Open play: grab a game!'}</p>
      <h3>FORMAT</h3><div class="seg"><button data-f="0" class="${!s.doubles ? 'on' : ''}">🧍 Singles</button><button data-f="1" class="${s.doubles ? 'on' : ''}">👥 Doubles</button></div>
      ${s.doubles ? `<h3>YOUR PARTNER</h3><div class="hats">${PARTNERS.map((p) => `<button class="hat ${s.partner === p.id ? 'on' : ''}" data-p="${p.id}">${p.pet ? (p.id === 'luna' ? '🐭 ' : '🐁 ') : '🧑 '}${esc(p.n)}<small>${p.diff}</small></button>`).join('')}</div>` : ''}
      <h3>OPPONENTS</h3><div class="seg">${DIFFS.map(([k, n]) => `<button data-d="${k}" class="${s.diff === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <h3>PLAY TO</h3><div class="seg"><button data-t="7" class="${s.to === 7 ? 'on' : ''}">⚡ 7</button><button data-t="11" class="${s.to !== 7 ? 'on' : ''}">🏆 11 (official)</button></div>
      <p class="sub">Win: 🪙 ${{ easy: 20, medium: 30, hard: 45, pro: 60 }[s.diff]} · rating up</p>
      <div class="btnRow"><button class="go" id="go">▶ PLAY</button><button class="mbtn2" id="b">NOT NOW</button></div>`, (c) => {
      c.querySelectorAll('[data-f]').forEach((b) => b.onclick = () => { sfx('click'); s.doubles = b.dataset.f === '1'; this.matchSetup(court); });
      c.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { sfx('click'); s.partner = S.partner = b.dataset.p; persist(); this.matchSetup(court); });
      c.querySelectorAll('[data-d]').forEach((b) => b.onclick = () => { sfx('click'); s.diff = b.dataset.d; this.matchSetup(court); });
      c.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => { sfx('click'); s.to = +b.dataset.t; this.matchSetup(court); });
      on(c, '#go', () => { const opps = [this.oppDef(s.diff)]; if (s.doubles) opps.push(this.oppDef(s.diff, 3)); this.start({ court, mode: 'quick', doubles: s.doubles, partner: s.doubles ? this.partnerDef(s.partner) : null, opps, to: s.to, diff: s.diff, diffK: DIFFS.findIndex((d) => d[0] === s.diff) }); });
      on(c, '#b', () => this.back()); }); }
  start(cfg) { closePanel(); this.app.busy = false; this.app.paused = false; this.g.startMatch(cfg); }
  // ---------------- Park Ladder ----------------
  ladder() { this.open(); const cur = S.ladder; const next = cur >= 1 ? LADDER[10 - cur] : null;
    panel(`<h2>🪜 PARK LADDER</h2><p class="sub">Beat the player one rung above you to take their spot. Singles, to 11, side-out scoring.</p>
      <div class="ladder">${LADDER.slice().reverse().map((r, k) => { const rank = k + 1, idx = 9 - k, beaten = S.beat[r.id], isNext = next && next.id === r.id; return `<div class="lr ${beaten ? 'beat' : ''} ${isNext ? 'next' : ''}"><span class="rk">#${rank}</span><b>${r.pet ? '🏴‍☠️ ' : ''}${esc(r.n)}</b><small>${r.diff}${beaten ? ' · beaten ✔' : ''}</small><span class="pay">🪙 ${r.pay}</span></div>`; }).join('')}
      <div class="lr you"><span class="rk">${cur >= 1 ? 'You' : '👑'}</span><b>${esc(S.name || 'You')}</b><small>${cur >= 1 ? 'climbing!' : 'PARK CHAMPION'}</small></div></div>
      ${next ? `<p class="sub">Next: <b>${esc(next.n)}</b> — "${esc(next.hi)}"</p>` : '<p class="sub">You beat the Pickle King! Re-challenge anyone for practice.</p>'}
      <div class="btnRow">${next ? '<button class="go" id="go">⚔️ CHALLENGE</button>' : '<button class="go" id="go2">👑 REMATCH THE KING</button>'}<button class="mbtn2" id="b">BACK</button></div>`, (c) => {
      const go = (r) => this.start({ court: r.boss ? 'center' : r.pet ? 'center' : 'w1', mode: 'ladder', rival: r.id, doubles: false, opps: [Object.assign({}, r)], to: 11, diffK: 2, title: '🪜 Ladder: ' + r.n, ump: true });
      on(c, '#go', () => go(next)); on(c, '#go2', () => go(LADDER[9])); on(c, '#b', () => this.back()); }); }
  // ---------------- tournaments ----------------
  tourneys() { this.open(); if (S.tourRun) return this.bracket();
    panel(`<h2>🏆 TOURNAMENTS</h2><p class="sub">Early rounds to 7, the final to 11. Win them all for the trophy!</p><div class="shopList">${TOURNEYS.map((t) => { const lock = S.rating < t.need - 1e-6; return `<div class="shopIt ${lock ? 'lock' : ''}"><span class="ic big">${t.icon}</span><div class="si"><b>${esc(t.n)}</b><small>${t.fmt} · ${t.size} players · ${esc(COURTS[t.court].n)}</small><p>${esc(t.d)}</p></div>
      <button class="buy ${S.tour[t.id] ? 'own' : ''}" data-t="${t.id}" ${lock ? 'disabled' : ''}>${lock ? '🔒 ' + t.need.toFixed(1) : S.tour[t.id] ? '🏆 Again' : '🪙 ' + t.prize}</button></div>`; }).join('')}</div><button class="mbtn2" id="b">BACK</button>`, (c) => {
      c.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => { if (b.disabled) return; const t = TOURNEYS.find((x) => x.id === b.dataset.t); const rounds = Math.log2(t.size); const opps = []; for (let i = 0; i < rounds; i++) { const d = t.diffs[Math.min(i, t.diffs.length - 1)]; opps.push([this.oppDef(d, i), this.oppDef(d, i + 5)]); }
        S.tourRun = { id: t.id, round: 0, rounds, opps }; persist(); sfx('click'); this.bracket(); }); on(c, '#b', () => this.back()); }); }
  bracket() { this.open(); const r = S.tourRun, t = TOURNEYS.find((x) => x.id === r.id); const names = ['Final', 'Semifinal', 'Quarterfinal']; const rn = (i) => names[r.rounds - 1 - i];
    panel(`<h2>${t.icon} ${esc(t.n)}</h2><div class="ladder">${r.opps.map((o, i) => `<div class="lr ${i < r.round ? 'beat' : i === r.round ? 'next' : ''}"><span class="rk">${rn(i)}</span><b>vs ${esc(t.fmt === 'doubles' ? o[0].n + ' & ' + o[1].n : o[0].n)}</b><small>${o[0].diff} · to ${i === r.rounds - 1 ? 11 : 7}${i < r.round ? ' · won ✔' : ''}</small></div>`).join('')}</div>
      ${t.fmt === 'doubles' ? `<h3>PARTNER</h3><div class="hats">${PARTNERS.map((p) => `<button class="hat ${S.partner === p.id ? 'on' : ''}" data-p="${p.id}">${esc(p.n)}</button>`).join('')}</div>` : ''}
      <div class="btnRow"><button class="go" id="go">▶ PLAY ${rn(r.round).toUpperCase()}</button><button class="mbtn2" id="b">LATER</button></div><button class="mbtn2 sm danger" id="q">Withdraw</button>`, (c) => {
      c.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { S.partner = b.dataset.p; persist(); sfx('click'); this.bracket(); });
      on(c, '#go', () => { const o = r.opps[r.round], last = r.round === r.rounds - 1; this.start({ court: t.court, mode: 'tourney', doubles: t.fmt === 'doubles', partner: t.fmt === 'doubles' ? this.partnerDef(S.partner) : null, opps: t.fmt === 'doubles' ? o : [o[0]], to: last ? 11 : 7, diffK: 2, title: t.icon + ' ' + rn(r.round), ump: t.court === 'center' }); });
      on(c, '#b', () => this.back()); on(c, '#q', () => { S.tourRun = null; persist(); this.back(); }); }); }
  // ---------------- drills ----------------
  drills(court = 'train', fromJournal) { this.open(); const q = court === 'quiet';
    panel(`<h2>${q ? '🤫 QUIET PRACTICE' : '🎯 TRAINING CENTER'}</h2><p class="sub">${q ? 'Silent Serve foam balls on the Quiet Court. Candy keeps watch.' : '🐭 Luna: "60 seconds. Beat your best!"'}</p>
      <div class="shopList">${DRILLS.map((d) => `<div class="shopIt"><span class="ic big">${d.icon}</span><div class="si"><b>${esc(d.n)}</b><p>${esc(d.d)}</p><small>Best: ${S.drills[d.id] || 0} ${d.best}</small></div><button class="buy" data-d="${d.id}">▶</button></div>`).join('')}</div><button class="mbtn2" id="b">BACK</button>`, (c) => {
      c.querySelectorAll('[data-d]').forEach((b) => b.onclick = () => this.startDrill(b.dataset.d, court)); on(c, '#b', () => fromJournal ? this.pause() : this.back()); }); }
  startDrill(id, court = 'train') { this.start({ court, mode: 'drill', drill: id, ball: court === 'quiet' ? 'silent' : null }); }
  drillOver(r) { const app = this.app; app.busy = true; app.paused = true; const coins = Math.min(40, r.reps * 2); S.coins += coins; S.xp += r.reps; if (r.reps >= 10) S.badges.drill = 1; persist();
    panel(`<h2>${r.drill.icon} ${esc(r.drill.n)}</h2><div class="big">${r.reps} <small>${r.drill.best}</small></div><p class="sub">${r.best ? '🎉 NEW BEST! (old: ' + r.prev + ')' : 'Best: ' + Math.max(r.prev, r.reps)} · ${r.tries} balls</p><p class="sub">+🪙 ${coins}</p>
      <div class="btnRow"><button class="go" id="a">🔁 AGAIN</button><button class="mbtn2" id="o">🎯 Other drill</button><button class="mbtn2" id="b">🚶 Done</button></div>`, (c) => {
      const end = () => this.g.endMatch(); on(c, '#a', () => { end(); this.startDrill(r.drill.id, r.cfg.court); }); on(c, '#o', () => { end(); this.drills(r.cfg.court); }); on(c, '#b', () => { end(); app.resume(); }); }); }
  // ---------------- results + career ----------------
  matchOver(res) { const app = this.app; app.busy = true; app.paused = true; const cfg = res.cfg, st = S.stats; let coins = 0, dr = 0, title = res.win ? '🏆 YOU WIN!' : '😅 GOOD GAME!', extra = '', next = null;
    st.matches++; if (res.win) st.wins++; else st.losses++; st.longest = Math.max(st.longest || 0, res.stats.longest); S.seenMatch = true; if (res.win) S.badges.firstwin = 1; if (res.stats.spins >= 5) S.badges.spin = 1;
    const K = [0.04, 0.06, 0.09, 0.12][cfg.diffK || 0];
    if (cfg.mode === 'quick') { coins = res.win ? { easy: 20, medium: 30, hard: 45, pro: 60 }[cfg.diff] || 20 : 6; dr = res.win ? K : -0.02; }
    else if (cfg.mode === 'ladder') { const r = LADDER.find((x) => x.id === cfg.rival); if (res.win) { coins = r.pay; dr = 0.12; if (!S.beat[r.id]) { S.beat[r.id] = 1; if (S.ladder === 10 - LADDER.indexOf(r)) S.ladder--; } S.badges.ladder = 1; if (r.boss) S.badges.king = 1; extra = `${esc(r.n)}: "${esc(r.lose)}"`; } else { coins = 8; extra = `${esc(r.n)}: "${esc(r.win)}"`; } }
    else if (cfg.mode === 'tourney') { const tr = S.tourRun, t = tr && TOURNEYS.find((x) => x.id === tr.id); if (t) { if (res.win) { tr.round++; dr = 0.06; coins = 15; if (tr.round >= tr.rounds) { coins += t.prize; dr = 0.2; S.tour[t.id] = 1; S.tourRun = null; title = t.icon + ' CHAMPION!'; extra = 'You won the ' + esc(t.n) + '!'; } else { next = true; extra = 'On to the next round!'; } } else { S.tourRun = null; coins = 10; extra = 'Knocked out... the next one is yours.'; } } }
    if (res.buffed) extra += ' 🌭 Snack power used.';
    const before = rankOf(S.rating).n; S.rating = Math.max(2.0, Math.min(5.5, +(S.rating + dr).toFixed(2))); const after = rankOf(S.rating).n; S.coins += coins; S.xp += res.stats.hits; persist();
    const sh = res.stats.shots, shots = Object.keys(sh).map((k) => k + ' ' + sh[k]).join(' · ');
    panel(`<h2>${title}</h2><div class="big">${res.score[0]} – ${res.score[1]}</div>${extra ? `<p class="sub">${extra}</p>` : ''}
      <div class="statGrid"><div><b>+${coins}</b><small>🪙 Coins</small></div><div><b>${S.rating.toFixed(2)}</b><small>⭐ Rating ${dr >= 0 ? '+' : ''}${dr.toFixed(2)}</small></div><div><b>${res.stats.longest}</b><small>🏓 Longest rally</small></div><div><b>${res.stats.spins}</b><small>🌀 Spin shots</small></div></div>
      <p class="sub">${shots || ''}${before !== after ? '<br>🎉 New rank: <b>' + after + '</b>!' : ''}</p>
      <div class="btnRow">${next ? '<button class="go" id="n">▶ NEXT ROUND</button>' : cfg.mode === 'quick' ? '<button class="go" id="r">🔁 REMATCH</button>' : cfg.mode === 'ladder' && S.ladder >= 1 && res.win ? '<button class="go" id="l">🪜 NEXT RUNG</button>' : ''}<button class="mbtn2" id="b">🚶 Back to the park</button></div>`, (c) => {
      const end = () => this.g.endMatch(); on(c, '#n', () => { end(); this.bracket(); }); on(c, '#r', () => { end(); this.start(Object.assign({}, cfg, { opps: cfg.opps.map((o) => this.oppDef(o.diff)) })); }); on(c, '#l', () => { end(); this.ladder(); }); on(c, '#b', () => { end(); app.resume(); }); }); }
}
