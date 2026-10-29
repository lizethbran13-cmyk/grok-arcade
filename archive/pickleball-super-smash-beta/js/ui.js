// Grok Pickleball Park - menus: title, look, how-to, journal, Pro Shop, ladder, tournaments, match setup, drills, snacks, results.
import { $, esc } from './util.js?v=ppk2';
import { S, persist, resetSave } from './save.js?v=ppk2';
import { sfx, setSound } from './audio.js?v=ppk2';
import { panel, closePanel, on, toast } from './uikit.js?v=ppk2';
import { SKINS, HAIRS, HAIR_COLS, SHIRTS, PANTS, cleanLook } from './humans.js?v=ppk2';
import { goal } from './story.js?v=ppk2';
import { PADDLES, BALLS, HATS, SHOES, RANKS, rankOf, LADDER, NAMES, TOURNEYS, DILLERS_ROUNDS, SMASHERS, SMASH_CUP_ROUNDS, DRILLS, COURTS, PARTNERS } from './data.js?v=ppk2';
import { SPOTS } from './map.js?v=ppk2';
import { dillersOwned, smashOwned } from './dlc.js?v=ppk2';
const hex = (c) => '#' + c.toString(16).padStart(6, '0');
const R = () => Math.random(), pick = (a) => a[(R() * a.length) | 0];
const rndLook = () => ({ skin: (R() * 6) | 0, hair: (R() * 6) | 0, hairC: (R() * 6) | 0, shirt: (R() * 8) | 0, pants: (R() * 6) | 0 });
const DIFFS = [['easy', '🙂 Easy'], ['medium', '😎 Medium'], ['hard', '🔥 Hard'], ['pro', '👑 Pro']];
const bar = (v, c) => `<span class="sbar"><i style="width:${Math.round(v * 100)}%;background:${c}"></i></span>`;
export class UI {
  constructor(app) { this.app = app; this.setup = { diff: 'easy', doubles: false, to: S.opts.to || 11, partner: S.partner || 'kai', smashMode: false }; }
  get g() { return this.app.game; }
  open() { this.app.busy = true; }
  back() { this.app.resume(); }
  // ---------------- title / look / options / how ----------------
  title() { const app = this.app; const ui = $('ui'); ui.classList.add('open'); app.preview = false; ui.innerHTML = `<div class="title">
      <div class="logo"><span class="l0">GROK</span><span class="l1">PICKLEBALL</span><span class="l2">PARK</span></div>
      <p class="tag">A giant sports park full of courts, players and pets. Real pickleball rules, a Pro Shop with the MaxGrit paddle, drills with Luna, the Park Ladder, tournaments${dillersOwned() ? ', Drive Dillers Indoor Center with Director Snowie, Lola & Candy' : ''}${smashOwned() ? ', the Super Smash Expansion (Lava Island, Moon Base & Candy Stadium + 6 Super Smashers + Torty\'s MaxGrit Repair Forge)' : ''}... and the Night Lights Court.</p>
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
      <p>🛒 Torty's Pro Shop, 🏛️ Clubhouse (ladder + tournaments), 🎯 Training Center, 🌭 Snack Shack, 🌙 Night Lights Court, 🤫 the Quiet Court${dillersOwned() ? ' and 🏟️ Drive Dillers Indoor Center (Indoor & Silent Serve balls only!)' : ''} ${smashOwned() ? ', and 💥 Super Smash Arena (west avenue — 2pt smashes, 3pt Super Smashes & Torty\'s MaxGrit Repair Forge)' : ''} are all walk-in.</p></div><button class="go" id="hOk">LET'S PLAY!</button>`, (c) => on(c, '#hOk', () => { S.seenHow = true; persist(); done(); })); }
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
      <div class="btnRow"><button class="go" id="pR">▶ RESUME</button></div><div class="btnRow"><button class="mbtn2 sm" id="pM">🗺️ Map</button><button class="mbtn2 sm" id="pD">🎯 Drills</button><button class="mbtn2 sm" id="pB">🎒 Bag</button>${dillersOwned() ? '<button class="mbtn2 sm" id="pDD">🏟️ Drive Dillers</button>' : ''}${smashOwned() ? '<button class="mbtn2 sm" id="pSM">💥 Super Smash</button><button class="mbtn2 sm" id="pFG">🛠️ Repair Forge</button>' : ''}</div>
      <div class="btnRow"><button class="mbtn2 sm" id="pL">👤 Look</button><button class="mbtn2 sm" id="pO">⚙️ Options</button><button class="mbtn2 sm" id="pH">❓ Rules</button><button class="mbtn2 sm" id="pT">🏠 Title</button></div>`, (c) => {
      on(c, '#pR', () => app.resume()); on(c, '#pM', () => this.map()); on(c, '#pD', () => this.drills('train', true)); on(c, '#pB', () => this.bag()); on(c, '#pDD', () => this.dillersTourney()); on(c, '#pSM', () => this.smashHub()); on(c, '#pFG', () => this.smashForge()); on(c, '#pL', () => this.custom(() => this.pause())); on(c, '#pO', () => this.options(() => this.pause())); on(c, '#pH', () => this.how(() => this.pause())); on(c, '#pT', () => app.toTitle()); }); }
  cardHtml() { const st = S.stats, rk = rankOf(S.rating), pd = PADDLES.find((p) => p.id === S.eq.paddle) || PADDLES[0], bl = BALLS.find((b) => b.id === S.eq.ball) || BALLS[0];
    const badges = [['candy', '🐶 Met Candy'], ['firstwin', '🏓 First Win'], ['ladder', '🪜 Ladder Climber'], ['king', '👑 Beat the King'], ['drill', '🎯 Drill Star'], ['spin', '🌀 Spin Doctor'], ['dillchamp', '🏟️ Drive Dillers Champ'], ['smashchamp', '💥 Super Smash Champ']];
    return `<div class="pcard"><div class="pcTop"><b>${esc(S.name || 'Player')}</b><span>${rk.n}</span></div><div class="statGrid"><div><b>${S.rating.toFixed(1)}</b><small>⭐ Rating</small></div><div><b>${S.coins}</b><small>🪙 Coins</small></div><div><b>${S.ladder >= 1 ? '#' + (S.ladder + 1 > 10 ? '—' : S.ladder + 1) : '👑 #1'}</b><small>🪜 Ladder</small></div><div><b>${st.wins}-${st.losses}</b><small>🏓 Record</small></div></div>
      <p class="sub">🏓 ${esc(pd.n)} (${Math.round(S.padCond == null ? 100 : S.padCond)}% grit) · 🎾 ${esc(bl.n)} · 🏆 ${TOURNEYS.filter((t) => S.tour[t.id]).map((t) => t.icon).join(' ') || (S.dillers && S.dillers.wins ? '🏟️' : 'no trophies yet')}</p>
      <p class="sub">${badges.map(([k, n]) => `<span class="badge ${S.badges[k] ? 'on' : ''}">${n}</span>`).join(' ')}</p></div>`; }
  card() { this.open(); panel(`<h2>📇 MY PLAYER CARD</h2>${this.cardHtml()}<p class="sub">Ranks: ${RANKS.map((r) => r.r.toFixed(1) + ' ' + r.n).join(' · ')}</p><button class="go" id="b">CLOSE</button>`, (c) => on(c, '#b', () => this.back())); }
  bag() { this.open(); const row = (cat, list) => list.filter((x) => S.own[cat].includes(x.id)).map((x) => `<button class="hat ${S.eq[cat] === x.id ? 'on' : ''}" data-c="${cat}" data-i="${x.id}">${esc(x.n)}</button>`).join('');
    panel(`<h2>🎒 MY BAG</h2><h3>PADDLE</h3><div class="hats">${row('paddle', PADDLES)}</div><h3>BALL</h3><div class="hats">${row('ball', BALLS)}</div><h3>HAT</h3><div class="hats">${row('hat', HATS)}</div><h3>SHOES</h3><div class="hats">${row('shoe', SHOES)}</div><button class="go" id="b">DONE</button>`, (c) => {
      c.querySelectorAll('[data-c]').forEach((b) => b.onclick = () => { sfx('click'); S.eq[b.dataset.c] = b.dataset.i; persist(); this.g.refreshMe(); this.bag(); }); on(c, '#b', () => this.back()); }); }
  map() { this.open(); const P = [['🎟️ Park Entrance', 0, 108, Math.PI], ['⛲ Fountain Plaza', 0, 72, Math.PI], ['🏟️ Stadium Court', 0, 9, Math.PI], ['🏓 West Courts', -54, 16, Math.PI], ['🏓 East Courts', 54, 16, Math.PI], ['🏛️ Clubhouse', -14, 57, -Math.PI / 2], ['🛒 Torty\'s Pro Shop', 14, 57, Math.PI / 2], ['🌭 Snack Shack', -24, 99, Math.PI], ['🎯 Training Center', 12, 94, Math.PI / 2], ['🌙 Night Lights Court', 54, -34, Math.PI], ['🤫 Quiet Court', -54, -34, Math.PI], ['🐶 Candy\'s Dog Run', 0, -60, Math.PI]];
    if (dillersOwned()) P.splice(3, 0, ['🏟️ Drive Dillers Indoor', 48, 38, Math.PI / 2]);
    if (smashOwned()) P.splice(4, 0, ['💥 Super Smash Arena', -63.5, 50.0, Math.PI], ['🌋 Lava Island Court', -72, 48, Math.PI], ['🚀 Moon Base Court', -90, 48, Math.PI], ['🍭 Candy Stadium', -81, 74, Math.PI]);
    panel(`<h2>🗺️ PARK MAP</h2><p class="sub">Tap to fast-travel.</p><div class="hats">${P.map((p, i) => `<button class="hat" data-i="${i}">${p[0]}</button>`).join('')}</div><button class="mbtn2" id="b">CLOSE</button>`, (c) => {
      c.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { sfx('whoosh'); const p = P[+b.dataset.i]; this.g.tp(p[1], p[2], p[3]); this.back(); }); on(c, '#b', () => this.back()); }); }
  // ---------------- Torty's Pro Shop ----------------
  shop(cat = 'paddle', focus) { this.open(); const lists = { paddle: PADDLES, ball: BALLS, gear: [...HATS.filter((h) => h.id !== 'none').map((h) => Object.assign({ cat: 'hat' }, h)), ...SHOES.filter((s) => s.id !== 'court').map((s) => Object.assign({ cat: 'shoe' }, s))] };
    const item = (x) => { const c = x.cat || cat, own = S.own[c].includes(x.id), eq = S.eq[c] === x.id;
      const vis = cat === 'paddle' ? `<span class="pdl" style="--a:${hex(x.a)};--b:${hex(x.b)}">${x.face === 'grit' ? '<em></em>' : ''}</span>` : cat === 'ball' ? `<span class="bal" style="--a:${hex(x.col)}">${x.quiet ? '' : '<em></em>'}</span>` : `<span class="ic">${c === 'hat' ? '🧢' : '👟'}</span>`;
      const stats = cat === 'paddle' ? `<div class="stats"><small>POWER</small>${bar(x.pow, '#f97316')}<small>CONTROL</small>${bar(x.ctl, '#38bdf8')}<small>SPIN</small>${bar(x.spin, '#a855f7')}</div>` : cat === 'ball' ? `<div class="stats"><small>SPEED</small>${bar(1 - (x.drag - 0.04) * 10, '#f97316')}<small>BOUNCE</small>${bar((x.bounce - 0.5) * 3.5, '#38bdf8')}<small>${x.quiet ? '🤫 SILENT FOAM (INDOOR OK)' : x.indoor ? '🏟️ INDOOR 26-HOLE' : x.legal ? '☀️ OUTDOOR ONLY' : ''}</small></div>` : '';
      return `<div class="shopIt ${focus === x.id ? 'focus' : ''} ${x.star ? 'star' : ''}">${vis}<div class="si"><b>${esc(x.n)}</b>${x.by ? `<small>${esc(x.by)}</small>` : ''}<p>${esc(x.d || '')}</p>${stats}</div>
        <button class="buy ${eq ? 'eq' : own ? 'own' : ''}" data-id="${x.id}" data-c="${c}">${eq ? '✔ USING' : own ? 'USE' : '🪙 ' + x.price}</button></div>`; };
    panel(`<h2>🛒 TORTY'S PRO SHOP</h2><p class="sub">🐢 "Slow and steady wins the rally!" · You have <b>🪙 ${S.coins}</b></p>
      <div class="seg"><button data-t="paddle" class="${cat === 'paddle' ? 'on' : ''}">🏓 Paddles</button><button data-t="ball" class="${cat === 'ball' ? 'on' : ''}">🎾 Balls</button><button data-t="gear" class="${cat === 'gear' ? 'on' : ''}">🧢 Gear</button>${smashOwned() ? '<button id="goForge">🛠️ Grit Forge (' + Math.round(S.padCond == null ? 100 : S.padCond) + '%)</button>' : ''}</div>
      <div class="shopList">${lists[cat].map(item).join('')}</div><button class="go" id="b">THANKS, TORTY!</button>`, (c) => {
      c.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => { sfx('click'); this.shop(b.dataset.t); });
      on(c, '#goForge', () => this.smashForge());
      c.querySelectorAll('.buy').forEach((b) => b.onclick = () => { const id = b.dataset.id, k = b.dataset.c, x = [...PADDLES, ...BALLS, ...HATS, ...SHOES].find((q) => q.id === id && (k !== 'hat' || HATS.includes(q)) && (k !== 'shoe' || SHOES.includes(q)));
        if (!S.own[k].includes(id)) { if (S.coins < x.price) { sfx('deny'); toast('🪙 Need ' + (x.price - S.coins) + ' more coins. Win matches or do drills!'); return; } S.coins -= x.price; S.own[k].push(id); sfx('buy'); toast('🐢 Torty: "Great pick! The ' + x.n + ' is yours."'); if (id === 'maxgrit') S.badges.spin = 1; }
        else sfx('click'); S.eq[k] = id; persist(); this.g.refreshMe(); this.shop(cat, id); });
      on(c, '#b', () => this.back()); if (focus) { const f = c.querySelector('.focus'); if (f) f.scrollIntoView({ block: 'center' }); } }, 'shopP'); }
  // ---------------- snacks ----------------
  snacks() { this.open(); const M = [['🥒', 'Pickle Juice', 4, 'Electrolytes! +10% reach next match'], ['🌭', 'Dill Dog', 8, 'A hot dog with a pickle spear. +10% reach next match'], ['🧀', 'Kitchen Nachos', 10, 'Named after the non-volley zone. +10% reach next match'], ['🍧', 'Snowie Cone', 6, 'Snowie\'s favorite. Blue raspberry. +10% reach next match']];
    panel(`<h2>🌭 DILL-ICIOUS SNACK SHACK</h2><p class="sub">🐁 Snowie: "Order up!" · 🪙 ${S.coins}</p><div class="shopList">${M.map((m, i) => `<div class="shopIt"><span class="ic big">${m[0]}</span><div class="si"><b>${m[1]}</b><p>${m[3]}</p></div><button class="buy" data-i="${i}">🪙 ${m[2]}</button></div>`).join('')}</div><button class="go" id="b">BACK</button>`, (c) => {
      c.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { const m = M[+b.dataset.i]; if (S.coins < m[2]) { sfx('deny'); toast('🪙 Not enough coins'); return; } S.coins -= m[2]; S.snacks = (S.snacks || 0) + 1; S.buff = 'pop'; persist(); sfx('buy'); toast(m[0] + ' Yum! You feel speedy.'); this.snacks(); }); on(c, '#b', () => this.back()); }); }
  // ---------------- Drive Dillers Indoor Ball Bar, Smoothies, Kick-Out & Indoor Tournament ----------------
  ensureDillersStarterBalls() {
    if (!S.own.ball.includes('indoor')) S.own.ball.push('indoor');
    if (!S.own.ball.includes('silent')) S.own.ball.push('silent');
    persist();
  }
  dillersBallBar() {
    this.open(); this.ensureDillersStarterBalls();
    const cur = BALLS.find((b) => b.id === S.eq.ball) || BALLS[0];
    const items = BALLS.filter((b) => ['silent', 'indoor', 'dillball', 'outdoor'].includes(b.id));
    panel(`<h2>🟠 DRIVE DILLERS INDOOR BALL BAR</h2>
      <p class="sub">👩‍⚖️🐶 <b>Courts Manager Lola & Candy Rule:</b> Inside Drive Dillers, you can ONLY play with <b>Indoor 26-Hole balls</b> or the <b>Silent Serve Foam ball</b>! Starter indoor & foam balls are free right here.</p>
      <div class="shopList">${items.map((x) => {
        const own = S.own.ball.includes(x.id), eq = S.eq.ball === x.id;
        const badge = x.id === 'silent' ? '🧽 SILENT SERVE FOAM · ✅ APPROVED' : x.indoor ? '🏟️ 26-HOLE INDOOR · ✅ APPROVED' : '⚠️ 40-HOLE OUTDOOR · 🐶 CANDY WILL STEAL!';
        return `<div class="shopIt ${eq ? 'focus' : ''}"><span class="bal" style="--a:${hex(x.col)}">${x.quiet ? '' : '<em></em>'}</span>
          <div class="si"><b>${esc(x.n)}</b><small>${badge}</small><p>${esc(x.d)}</p></div>
          <button class="buy ${eq ? 'eq' : own ? 'own' : ''}" data-b="${x.id}">${eq ? '✔ EQUIPPED' : own ? 'EQUIP' : '🪙 ' + x.price}</button></div>`;
      }).join('')}</div>
      <div class="btnRow"><button class="go" id="t">🏟️ INDOOR TOURNAMENT</button><button class="mbtn2" id="b">DONE</button></div>`, (c) => {
      c.querySelectorAll('[data-b]').forEach((b) => b.onclick = () => {
        const id = b.dataset.b, x = BALLS.find((q) => q.id === id);
        if (!S.own.ball.includes(id)) {
          if (S.coins < x.price) { sfx('deny'); toast('🪙 Need ' + (x.price - S.coins) + ' more coins!'); return; }
          S.coins -= x.price; S.own.ball.push(id); sfx('buy');
        } else sfx('click');
        S.eq.ball = id; if (S.dillers) S.dillers.ball = id; persist();
        toast(x.indoor ? '✅ Equipped ' + x.n + ' — Lola & Candy approve!' : '⚠️ Equipped ' + x.n + ' — Watch out for Candy & Lola inside Drive Dillers!');
        this.dillersBallBar();
      });
      on(c, '#t', () => this.dillersTourney()); on(c, '#b', () => this.back());
    });
  }
  dillersSmoothies() {
    this.open();
    const M = [
      ['🥤', 'Dill-ight Lime Electrolyte', 5, 'Fresh lime + sea salt + dill sprig! +10% reach next match'],
      ['🍵', 'Silent Serve Foam Matcha', 7, 'Whipped green foam cold brew! +10% reach next match'],
      ['🏆', 'Golden Dill Protein Shake', 9, 'Director Snowie\'s championship blend! +10% reach next match'],
    ];
    panel(`<h2>🥤 DILL-IGHT SMOOTHIE BAR</h2><p class="sub">🏟️ Drive Dillers Courtside Refuel · 🪙 ${S.coins}</p>
      <div class="shopList">${M.map((m, i) => `<div class="shopIt"><span class="ic big">${m[0]}</span><div class="si"><b>${m[1]}</b><p>${m[3]}</p></div><button class="buy" data-i="${i}">🪙 ${m[2]}</button></div>`).join('')}</div>
      <button class="go" id="b">BACK</button>`, (c) => {
      c.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { const m = M[+b.dataset.i]; if (S.coins < m[2]) { sfx('deny'); toast('🪙 Not enough coins'); return; } S.coins -= m[2]; S.snacks = (S.snacks || 0) + 1; S.buff = 'pop'; persist(); sfx('buy'); toast(m[0] + ' Refueled for Drive Dillers!'); this.dillersSmoothies(); });
      on(c, '#b', () => this.back());
    });
  }
  lolaKickOut(ballDef, cfg) {
    this.open(); this.ensureDillersStarterBalls();
    panel(`<h2>🐶💢 BUSTED BY CANDY & LOLA!</h2>
      <div class="pcard" style="border:2px solid #ef4444;background:rgba(127,29,29,0.35)">
        <div class="pcTop"><b>🐶 Candy (Indoor Ball Inspector)</b><span style="color:#facc15">WOOF! WOOF! GRRR!</span></div>
        <p class="sub" style="color:#fef08a;margin:6px 0">Candy bolted onto <b>${esc(COURTS[cfg.court].n)}</b>, barked her head off, and <b>stole your ${esc(ballDef.n)}</b> right out of the air!</p>
        <div class="pcTop" style="margin-top:8px"><b>👩‍⚖️ Courts Manager Lola</b><span style="color:#fca5a5">WHISTLE!! 📢</span></div>
        <p class="sub" style="color:#fff;margin:6px 0">"HEY!! <b>Indoor pickleball balls or Silent Serve foam balls ONLY</b> in Drive Dillers! No ${esc(ballDef.n)} allowed on my hardwood! <b>OUT YOU GO!</b>"</p>
      </div>
      <p class="sub">🚪 Lola and Candy escorted you outside the Drive Dillers front entrance! Equip an approved <b>Silent Serve Foam Ball</b> or <b>26-Hole Indoor Ball</b> below to head back inside and play:</p>
      <div class="btnRow">
        <button class="go" id="eqSilent">🧽 Equip Silent Serve Foam & Re-Enter</button>
        <button class="go" id="eqIndoor">🟠 Equip 26-Hole Indoor & Re-Enter</button>
      </div>
      <div class="btnRow"><button class="mbtn2" id="stayOut">🚶 Stay Outside (Look at Lola & Candy)</button></div>`, (c) => {
      const reenter = (bId) => {
        this.g.equipIndoorBall(bId);
        this.g.restoreLolaAndCandyInside();
        const spot = SPOTS['court_' + cfg.court] || SPOTS.dillersDesk;
        this.g.tp(spot[0], spot[1], Math.PI);
        if (cfg.mode === 'dillers') this.dillersTourney();
        else this.matchSetup(cfg.court);
      };
      on(c, '#eqSilent', () => reenter('silent'));
      on(c, '#eqIndoor', () => reenter('indoor'));
      on(c, '#stayOut', () => this.back());
    });
  }
  dillersTourney() {
    this.open(); this.ensureDillersStarterBalls();
    if (!S.dillers) S.dillers = { wins: 0, run: null, ball: 'indoor', doubles: false };
    const run = S.dillers.run || { round: 0 };
    const curRound = Math.min(2, run.round || 0);
    const rd = DILLERS_ROUNDS[curRound];
    const eqBall = BALLS.find((b) => b.id === S.eq.ball) || BALLS[0];
    const bChoices = BALLS.filter((b) => S.own.ball.includes(b.id) || ['silent', 'indoor', 'outdoor'].includes(b.id));
    panel(`<h2>🏟️ DRIVE DILLERS INDOOR TOURNAMENT</h2>
      <p class="sub">🐁 <b>Director Snowie:</b> "Travel across all 3 indoor courts — each match gets harder! Win Round 3 on Center Stage for the <b>Golden Dill Cup (🪙 260)</b>!" · Titles won: <b>🏆 ${S.dillers.wins || 0}</b></p>
      <div class="ladder">${DILLERS_ROUNDS.map((r, i) => {
        const C = COURTS[r.court], done = i < curRound, cur = i === curRound;
        return `<div class="lr ${done ? 'beat' : cur ? 'next' : ''}">
          <span class="rk">${["🥉","🥈","👑"][i] || "🏟️"} R${i + 1}</span>
          <b>${esc(C.n)} — vs ${esc(S.dillers.doubles ? r.opp.n + ' & ' + r.opp2.n : r.opp.n)}</b>
          <small>${r.diff.toUpperCase()} · to ${r.to} · ${done ? 'WON ✔' : cur ? 'UP NEXT' : 'LOCKED'}</small>
        </div>`;
      }).join('')}</div>
      <h3>FORMAT</h3>
      <div class="seg">
        <button data-df="0" class="${!S.dillers.doubles ? 'on' : ''}">🧍 Singles (1v1)</button>
        <button data-df="1" class="${S.dillers.doubles ? 'on' : ''}">👥 Doubles (2v2 w/ ${esc((PARTNERS.find((p) => p.id === S.partner) || PARTNERS[0]).n)})</button>
      </div>
      <h3>BALL (👩‍⚖️🐶 LOLA & CANDY CHECK: INDOOR OR SILENT SERVE ONLY!)</h3>
      <div class="hats">${bChoices.map((b) => `<button class="hat ${S.eq.ball === b.id ? 'on' : ''}" data-db="${b.id}">${b.id === 'silent' ? '🧽 ' : b.indoor ? '🟠 ' : '⚠️ '}${esc(b.n)}</button>`).join('')}</div>
      <p class="sub">${eqBall.indoor ? `✅ <b>${esc(eqBall.n)}</b> is approved for Drive Dillers indoor play!` : `⚠️ <b>${esc(eqBall.n)}</b> is an OUTDOOR ball — if you press Play, <b>Candy will bark & steal it and Lola will kick you out!</b>`}</p>
      <div class="btnRow">
        <button class="go" id="goDill">▶ PLAY ROUND ${curRound + 1} (${esc(COURTS[rd.court].n)})</button>
        <button class="mbtn2" id="ballBar">🟠 Ball Bar</button>
        <button class="mbtn2" id="b">BACK</button>
      </div>
      ${curRound > 0 ? '<button class="mbtn2 sm danger" id="rstDill">↺ Restart Tournament Bracket</button>' : ''}`, (c) => {
      c.querySelectorAll('[data-df]').forEach((b) => b.onclick = () => { sfx('click'); S.dillers.doubles = b.dataset.df === '1'; persist(); this.dillersTourney(); });
      c.querySelectorAll('[data-db]').forEach((b) => b.onclick = () => { sfx('click'); const id = b.dataset.db; if (!S.own.ball.includes(id)) S.own.ball.push(id); S.eq.ball = id; S.dillers.ball = id; persist(); this.dillersTourney(); });
      on(c, '#ballBar', () => this.dillersBallBar());
      on(c, '#rstDill', () => { S.dillers.run = null; persist(); toast('↺ Drive Dillers bracket reset to Round 1'); this.dillersTourney(); });
      on(c, '#goDill', () => this.startDillersRound(curRound));
      on(c, '#b', () => this.back());
    });
  }
  startDillersRound(roundIdx) {
    const rd = DILLERS_ROUNDS[roundIdx] || DILLERS_ROUNDS[0];
    if (!S.dillers.run) { S.dillers.run = { round: roundIdx }; persist(); }
    const dbl = !!S.dillers.doubles;
    const opps = (dbl ? [rd.opp, rd.opp2] : [rd.opp]).map((o, i) => Object.assign({ look: rndLook(), hat: i === 0 ? 'visor' : 'headband', style: {} }, o));
    let partner = null;
    if (dbl) {
      let pid = S.partner || 'kai';
      if (opps.some((o) => o.pet === pid)) pid = 'kai';
      partner = this.partnerDef(pid);
    }
    this.start({
      court: rd.court,
      mode: 'dillers',
      dillersRound: roundIdx,
      doubles: dbl,
      partner,
      opps,
      to: rd.to,
      diff: rd.diff,
      diffK: DIFFS.findIndex((d) => d[0] === rd.diff),
      ball: S.eq.ball,
      title: '🏟️ ' + (rd.stage || rd.n) + ' (' + COURTS[rd.court].n + ')',
      ump: rd.court === 'dill3',
    });
  }

  // ---------------- Super Smash Expansion (DLC #84): Hub, Cup & Torty's MaxGrit Repair Forge ----------------
  ensureSmashStarterGear() {
    if (!S.smash) S.smash = { wins: 0, run: null, smasher: 'rita', oppSmasher: 'bo', doubles: false, freebies: false };
    if (!S.own.paddle.includes('rocket')) S.own.paddle.push('rocket');
    if (!S.own.ball.includes('silent_smash')) S.own.ball.push('silent_smash');
    persist();
  }
  smasherPickerHtml(sel) {
    const cur = SMASHERS.find((s) => s.id === sel) || SMASHERS[0];
    return `<div class="smChars" id="smChars">${SMASHERS.map((s) => `<button type="button" data-sm="${s.id}" class="${s.id === cur.id ? 'on' : ''}" style="--c:${s.col}"><i>${s.icon}</i><b>${esc(s.n)}</b><small>${esc(s.sn)}</small></button>`).join('')}</div><p class="smDesc" id="smDesc">${cur.icon} <b>${esc(cur.sn)}:</b> ${esc(cur.desc)}</p>`;
  }
  smashHub() {
    this.open(); this.ensureSmashStarterGear();
    const sm = S.smash;
    const sel = sm.smasher || 'rita';
    const run = sm.run || { round: 0 };
    const curRound = Math.min(2, run.round || 0);
    const rd = SMASH_CUP_ROUNDS[curRound];
    const cond = Math.round(S.padCond == null ? 100 : S.padCond);
    const condCol = cond <= 25 ? '#ef4444' : cond <= 55 ? '#facc15' : '#4ade80';
    panel(`<h2>💥 SUPER SMASH EXPANSION HUB</h2>
      <p class="sub">🐭 <b>Smash Coach Luna & 🐁 Director Snowie:</b> "Pop-ups fly high! Overhead Smash winners = <b>2 pts</b>, Super Smash winners = <b>3 pts</b>! Fill your Super Bar to 100% and press <b>⚡ SUPER</b>!" · Cup Titles: <b>🏆 ${sm.wins || 0}</b></p>
      <div class="gritBar">
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:900">
          <span>🏓 Paddle Grit & Edge Guard: <b style="color:${condCol}">${cond}%</b>${cond <= 30 ? ' ⚠️ WORN (Spin/Power reduced!)' : ' ✨ CRISP'}</span>
          <button class="buy" id="openForge" style="min-height:32px;padding:4px 10px;font-size:12px">🛠️ ${cond <= 25 || S.coins < 15 ? 'FREE REBUILD!' : 'Repair Forge'}</button>
        </div>
        <div class="gritTrack"><i style="width:${cond}%;background:${condCol}"></i></div>
      </div>
      <h3>1. PICK YOUR SMASHER & SUPER ABILITY</h3>
      ${this.smasherPickerHtml(sel)}
      <h3>2. SUPER SMASH CUP (3-ARENA PROGRESSIVE BRACKET · 🪙 300 PRIZE)</h3>
      <div class="ladder">${SMASH_CUP_ROUNDS.map((r, i) => {
        const C = COURTS[r.court], sp = SMASHERS.find((s) => s.id === r.smasher) || SMASHERS[0];
        const done = i < curRound, cur = i === curRound;
        return `<div class="lr ${done ? 'beat' : cur ? 'next' : ''}">
          <span class="rk">${['🌋','🚀','🍭'][i] || '💥'} R${i + 1}</span>
          <b>${esc(C.n)} — vs ${sp.icon} ${esc(sm.doubles ? r.opp.n + ' & ' + r.opp2.n : r.opp.n)}</b>
          <small>${r.diff.toUpperCase()} · to ${r.to} · ${done ? 'WON ✔' : cur ? 'UP NEXT' : 'LOCKED'}</small>
        </div>`;
      }).join('')}</div>
      <div class="seg">
        <button data-sf="0" class="${!sm.doubles ? 'on' : ''}">🧍 Singles (1v1)</button>
        <button data-sf="1" class="${sm.doubles ? 'on' : ''}">👥 Doubles (2v2 w/ ${esc((PARTNERS.find((p) => p.id === S.partner) || PARTNERS[0]).n)})</button>
      </div>
      <div class="btnRow">
        <button class="go" id="goCup">💥 PLAY CUP ROUND ${curRound + 1} (${esc(COURTS[rd.court].n)})</button>
      </div>
      <h3>3. QUICK SMASH ON ANY SMASH ARENA</h3>
      <div class="seg">
        <button class="hat" data-qc="smash_lava">🌋 Lava Island</button>
        <button class="hat" data-qc="smash_moon">🚀 Moon Base</button>
        <button class="hat" data-qc="smash_candy">🍭 Candy Stadium</button>
      </div>
      <div class="btnRow">
        <button class="mbtn2 sm" id="eqStarter">🎁 Equip Rocket Blaster + Silent Super Foam</button>
        <button class="mbtn2 sm" id="openShop">🏓 Power Paddles Shop</button>
        ${curRound > 0 ? '<button class="mbtn2 sm danger" id="rstCup">↺ Reset Cup</button>' : ''}
        <button class="mbtn2 sm" id="b">CLOSE</button>
      </div>`, (c) => {
      c.querySelectorAll('[data-sm]').forEach((b) => b.onclick = () => {
        sfx('click'); sm.smasher = b.dataset.sm; persist(); this.smashHub();
      });
      c.querySelectorAll('[data-sf]').forEach((b) => b.onclick = () => {
        sfx('click'); sm.doubles = b.dataset.sf === '1'; persist(); this.smashHub();
      });
      on(c, '#openForge', () => this.smashForge());
      on(c, '#openShop', () => this.shop('paddle', 'maxgrit_smash'));
      on(c, '#eqStarter', () => {
        this.ensureSmashStarterGear();
        S.eq.paddle = 'rocket'; S.eq.ball = 'silent_smash'; persist(); this.g.refreshMe();
        sfx('buy'); toast('🚀 Equipped Rocket Blaster Paddle & Silent Serve Super Foam Ball!');
        this.smashHub();
      });
      on(c, '#rstCup', () => { sm.run = null; persist(); toast('↺ Super Smash Cup reset to Round 1'); this.smashHub(); });
      on(c, '#goCup', () => this.startSmashCupRound(curRound));
      c.querySelectorAll('[data-qc]').forEach((b) => b.onclick = () => {
        sfx('click'); this.setup.smashMode = true; this.matchSetup(b.dataset.qc);
      });
      on(c, '#b', () => this.back());
    }, 'shopP');
  }
  startSmashCupRound(roundIdx) {
    this.ensureSmashStarterGear();
    const sm = S.smash;
    const rd = SMASH_CUP_ROUNDS[roundIdx] || SMASH_CUP_ROUNDS[0];
    if (!sm.run) { sm.run = { round: roundIdx }; persist(); }
    const dbl = !!sm.doubles;
    const opps = (dbl ? [rd.opp, rd.opp2] : [rd.opp]).map((o, i) => Object.assign({ look: rndLook(), hat: i === 0 ? 'visor' : 'headband', style: { smash: 2.2, drive: 1.3, lob: 0.9, dink: 0.7 } }, o));
    let partner = null;
    if (dbl) {
      let pid = S.partner || 'luna';
      if (opps.some((o) => o.pet === pid)) pid = 'kai';
      partner = this.partnerDef(pid);
    }
    this.start({
      court: rd.court,
      mode: 'smash_cup',
      smashMode: true,
      smashRound: roundIdx,
      smasher: sm.smasher || 'rita',
      oppSmasher: rd.smasher || 'bo',
      doubles: dbl,
      partner,
      opps,
      to: rd.to || 15,
      diff: rd.diff,
      diffK: DIFFS.findIndex((d) => d[0] === rd.diff),
      ball: S.eq.ball,
      title: '💥 ' + rd.stage + ' (' + COURTS[rd.court].n + ')',
      ump: true,
    });
  }
  smashForge() {
    this.open(); this.ensureSmashStarterGear();
    const cond = Math.round(S.padCond == null ? 100 : S.padCond);
    const pd = PADDLES.find((p) => p.id === S.eq.paddle) || PADDLES[0];
    const condCol = cond <= 25 ? '#ef4444' : cond <= 55 ? '#facc15' : '#4ade80';
    const needEmergency = cond <= 25 || S.coins < 15;
    const repairCost = Math.max(5, Math.min(15, Math.ceil((100 - cond) * 0.2)));
    panel(`<h2>🛠️ TORTY'S MAXGRIT REPAIR FORGE</h2>
      <p class="sub">🐢 <b>Master Paddle-Smith Torty & 🐶 Candy:</b> "Over-smashes, Rocket Balls, and net crashes wear down your paddle's MaxGrit surface and crack the edge guard! Below 30% grit, spin & smash power drop by 18%."</p>
      <div class="gritBar">
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:15px;font-weight:900">
          <span>🏓 ${esc(pd.n)} Condition</span>
          <b style="color:${condCol};font-size:20px">${cond}%</b>
        </div>
        <div class="gritTrack"><i style="width:${cond}%;background:${condCol}"></i></div>
        <p class="sub" style="margin:6px 0 0">${cond >= 95 ? '✨ Factory-fresh MaxGrit texture & carbon edge guard! Full 100% power & spin.' : cond <= 25 ? '⚠️ CRITICAL WEAR! Cracked edge guard & smoothed grit — use Tortuga/Ratita Emergency Rebuild below for FREE!' : '🔧 Slight surface wear from heavy smashes. Re-grit anytime to restore 100% crispness.'}</p>
      </div>
      <div class="shopList">
        <div class="shopIt ${cond < 100 && !needEmergency ? 'focus' : ''}">
          <span class="ic big">🔧</span>
          <div class="si">
            <b>Pro MaxGrit Re-Grit & Edge-Guard Weld</b>
            <small>Restores paddle durability to 100% · +5% bonus Super charge next match</small>
            <p>Torty buffs fresh diamond-carbon MaxGrit onto your paddle face and seals the edge guard.</p>
          </div>
          <button class="buy ${cond >= 100 ? 'eq' : ''}" id="proFix" ${cond >= 100 ? 'disabled' : ''}>${cond >= 100 ? '100% OK' : '🪙 ' + repairCost}</button>
        </div>
        <div class="shopIt star">
          <span class="ic big">🐢🐭</span>
          <div class="si">
            <b>Tortuga & Ratita Never-Stuck Emergency Rebuild</b>
            <small>100% FREE whenever Grit ≤ 25% OR Coins &lt; 15 · Never soft-locked!</small>
            <p>Torty, Luna & Candy never let a player get stuck with broken gear or 0 coins! Restores 100% grit + gifts a free Silent Serve Super Foam ball.</p>
          </div>
          <button class="buy ${needEmergency && cond < 100 ? 'own' : ''}" id="freeFix">${cond >= 100 && S.coins >= 15 ? 'READY IF NEEDED' : 'FREE REBUILD'}</button>
        </div>
      </div>
      <div class="btnRow">
        <button class="go" id="toHub">💥 Super Smash Hub</button>
        <button class="mbtn2" id="toShop">🏓 Power Paddles</button>
        <button class="mbtn2" id="b">DONE</button>
      </div>`, (c) => {
      on(c, '#proFix', () => {
        if (cond >= 100) return;
        if (S.coins < repairCost) { sfx('deny'); toast('🪙 Low on coins — use the FREE Tortuga & Ratita Emergency Rebuild right below!'); return; }
        S.coins -= repairCost; S.padCond = 100; S.stats.repairs = (S.stats.repairs || 0) + 1; S.buff = 'pop'; persist();
        sfx('buy'); toast('🛠️ Torty re-gritted your ' + pd.n + ' to 100%!');
        this.smashForge();
      });
      on(c, '#freeFix', () => {
        if (cond >= 100 && S.coins >= 15) {
          toast('🐢 Torty: "Your paddle is already at 100%! Come back anytime it drops to 25% or if you run low on coins."');
          return;
        }
        S.padCond = 100;
        if (S.coins < 15) S.coins = Math.max(S.coins, 15);
        S.stats.repairs = (S.stats.repairs || 0) + 1;
        this.ensureSmashStarterGear();
        persist(); sfx('win');
        toast('🐢🐭 Tortuga & Ratita Emergency Rebuild complete! Paddle 100% + 15🪙 stipend ready!');
        this.smashForge();
      });
      on(c, '#toHub', () => this.smashHub());
      on(c, '#toShop', () => this.shop('paddle', 'maxgrit_smash'));
      on(c, '#b', () => this.back());
    }, 'shopP');
  }

  // ---------------- quick match on any court ----------------
  oppDef(diff, k = 0) { return { n: NAMES[(Math.random() * NAMES.length + k) % NAMES.length | 0], diff, look: rndLook(), hat: pick(['none', 'visor', 'cap', 'headband']), style: {} }; }
  partnerDef(id) { const p = PARTNERS.find((q) => q.id === id) || PARTNERS[0]; return Object.assign({}, p); }
  matchSetup(court) { this.open(); const C = COURTS[court], s = this.setup; const quiet = C.kind === 'quiet', inDillers = C.bld === 'dillers', isSmashCourt = C.kind === 'smash';
    if (inDillers) this.ensureDillersStarterBalls();
    if (isSmashCourt) { this.ensureSmashStarterGear(); s.smashMode = true; if (s.to < 11) s.to = 15; }
    const smOn = smashOwned() && !!s.smashMode;
    const eqBall = BALLS.find((b) => b.id === S.eq.ball) || BALLS[0];
    const bChoices = inDillers ? BALLS.filter((b) => S.own.ball.includes(b.id) || ['silent', 'indoor', 'outdoor'].includes(b.id)) : [];
    const selSmasher = (S.smash && S.smash.smasher) || 'rita';
    panel(`<h2>${isSmashCourt ? '💥 ' : '🏓 '}${esc(C.n)}</h2><p class="sub">${quiet ? '🤫 Silent Serve foam balls only on this court. Shh!' : inDillers ? '🏟️ Drive Dillers Indoor Court · 👩‍⚖️🐶 Lola & Candy Rule: Indoor 26-Hole or Silent Serve Foam balls ONLY!' : isSmashCourt ? '💥 Super Smash Arena! Smash winners = 2 pts, Super Smash winners = 3 pts!' : C.kind === 'night' ? '🌙 Under the light towers' : C.kind === 'stadium' ? '🏟️ The big one. Pi-rat is the umpire.' : 'Open play: grab a game!'}</p>
      ${smashOwned() ? `<h3>RULES MODE</h3><div class="seg"><button data-smm="0" class="${!smOn ? 'on' : ''}">📏 Official Rules</button><button data-smm="1" class="${smOn ? 'on' : ''}">💥 Super Smash Mode (2pt/3pt + Supers!)</button></div>` : ''}
      ${smOn ? `<h3>YOUR SMASHER</h3>${this.smasherPickerHtml(selSmasher)}` : ''}
      <h3>FORMAT</h3><div class="seg"><button data-f="0" class="${!s.doubles ? 'on' : ''}">🧍 Singles</button><button data-f="1" class="${s.doubles ? 'on' : ''}">👥 Doubles</button></div>
      ${s.doubles ? `<h3>YOUR PARTNER</h3><div class="hats">${PARTNERS.map((p) => `<button class="hat ${s.partner === p.id ? 'on' : ''}" data-p="${p.id}">${p.pet ? (p.id === 'luna' ? '🐭 ' : '🐁 ') : '🧑 '}${esc(p.n)}<small>${p.diff}</small></button>`).join('')}</div>` : ''}
      <h3>OPPONENTS</h3><div class="seg">${DIFFS.map(([k, n]) => `<button data-d="${k}" class="${s.diff === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <h3>PLAY TO</h3><div class="seg"><button data-t="7" class="${s.to === 7 ? 'on' : ''}">⚡ 7</button><button data-t="11" class="${s.to === 11 ? 'on' : ''}">🏆 11</button>${smOn ? `<button data-t="15" class="${s.to === 15 ? 'on' : ''}">💥 15 (Smash)</button>` : ''}</div>
      ${inDillers ? `<h3>BALL (INDOOR & SILENT SERVE ONLY!)</h3><div class="hats">${bChoices.map((b) => `<button class="hat ${S.eq.ball === b.id ? 'on' : ''}" data-mb="${b.id}">${b.id === 'silent' || b.id === 'silent_smash' ? '🧽 ' : b.indoor ? '🟠 ' : '⚠️ '}${esc(b.n)}</button>`).join('')}</div>
      <p class="sub">${eqBall.indoor ? '✅ Approved by Courts Manager Lola & Candy!' : '⚠️ Outdoor ball selected — Candy will bark & steal it and Lola will kick you out!'}</p>` : ''}
      <p class="sub">Win: 🪙 ${{ easy: 20, medium: 30, hard: 45, pro: 60 }[s.diff] + (smOn ? 10 : 0)} · rating up</p>
      <div class="btnRow"><button class="go" id="go">${smOn ? '💥 SMASH!' : '▶ PLAY'}</button>${inDillers ? '<button class="mbtn2" id="ddT">🏟️ INDOOR TOURNEY</button>' : ''}${isSmashCourt ? '<button class="mbtn2" id="smT">🏆 SMASH CUP</button>' : ''}<button class="mbtn2" id="b">NOT NOW</button></div>`, (c) => {
      c.querySelectorAll('[data-smm]').forEach((b) => b.onclick = () => { sfx('click'); s.smashMode = b.dataset.smm === '1'; if (s.smashMode && s.to < 11) s.to = 15; this.matchSetup(court); });
      c.querySelectorAll('[data-sm]').forEach((b) => b.onclick = () => { sfx('click'); if (!S.smash) S.smash = { wins: 0, run: null, smasher: 'rita', oppSmasher: 'bo', doubles: false }; S.smash.smasher = b.dataset.sm; persist(); this.matchSetup(court); });
      c.querySelectorAll('[data-f]').forEach((b) => b.onclick = () => { sfx('click'); s.doubles = b.dataset.f === '1'; this.matchSetup(court); });
      c.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { sfx('click'); s.partner = S.partner = b.dataset.p; persist(); this.matchSetup(court); });
      c.querySelectorAll('[data-d]').forEach((b) => b.onclick = () => { sfx('click'); s.diff = b.dataset.d; this.matchSetup(court); });
      c.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => { sfx('click'); s.to = +b.dataset.t; this.matchSetup(court); });
      c.querySelectorAll('[data-mb]').forEach((b) => b.onclick = () => { sfx('click'); S.eq.ball = b.dataset.mb; persist(); this.matchSetup(court); });
      on(c, '#ddT', () => this.dillersTourney());
      on(c, '#smT', () => this.smashHub());
      on(c, '#go', () => {
        const others = SMASHERS.filter((x) => x.id !== selSmasher);
        const oppSm = others[(Math.random() * others.length) | 0] || SMASHERS[1];
        const opps = [smOn ? { n: oppSm.n, diff: s.diff, look: rndLook(), hat: 'visor', style: { smash: 2.2, drive: 1.3, lob: 0.8, dink: 0.7 } } : this.oppDef(s.diff)];
        if (s.doubles) opps.push(this.oppDef(s.diff, 3));
        this.start({ court, mode: 'quick', smashMode: smOn, smasher: selSmasher, oppSmasher: oppSm.id, doubles: s.doubles, partner: s.doubles ? this.partnerDef(s.partner) : null, opps, to: s.to, diff: s.diff, diffK: DIFFS.findIndex((d) => d[0] === s.diff), ball: S.eq.ball, ump: isSmashCourt });
      });
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
    const dillCard = dillersOwned() ? `<div class="shopIt star"><span class="ic big">🏟️</span><div class="si"><b>Drive Dillers Indoor Cup</b><small>Progressive 3-Court Indoor Tourney · Easy → Hard → Pro</small><p>Director Snowie's indoor championship! Travel across Dill Court 1, Silent Serve Court 2 & Center Stage.</p></div><button class="buy ${S.dillers && S.dillers.wins ? 'own' : ''}" id="goDillCup">${S.dillers && S.dillers.wins ? '🏆 Again' : '🪙 260'}</button></div>` : '';
    const smashCard = smashOwned() ? `<div class="shopIt star"><span class="ic big">💥</span><div class="si"><b>Super Smash Cup</b><small>3-Arena Smash Tourney · Lava Island → Moon Base → Candy Stadium</small><p>Smash winners = 2 pts, Super Smashes = 3 pts! Battle Bolt Bo, Frosty Fran & Rocket Rita & Pi-rat for the Smash Crown.</p></div><button class="buy ${S.smash && S.smash.wins ? 'own' : ''}" id="goSmashCup">${S.smash && S.smash.wins ? '🏆 Again' : '🪙 300'}</button></div>` : '';
    panel(`<h2>🏆 TOURNAMENTS</h2><p class="sub">Early rounds to 7, the final to 11. Win them all for the trophy!</p><div class="shopList">${smashCard}${dillCard}${TOURNEYS.map((t) => { const lock = S.rating < t.need - 1e-6; return `<div class="shopIt ${lock ? 'lock' : ''}"><span class="ic big">${t.icon}</span><div class="si"><b>${esc(t.n)}</b><small>${t.fmt} · ${t.size} players · ${esc(COURTS[t.court].n)}</small><p>${esc(t.d)}</p></div>
      <button class="buy ${S.tour[t.id] ? 'own' : ''}" data-t="${t.id}" ${lock ? 'disabled' : ''}>${lock ? '🔒 ' + t.need.toFixed(1) : S.tour[t.id] ? '🏆 Again' : '🪙 ' + t.prize}</button></div>`; }).join('')}</div><button class="mbtn2" id="b">BACK</button>`, (c) => {
      on(c, '#goDillCup', () => this.dillersTourney());
      on(c, '#goSmashCup', () => this.smashHub());
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
  matchOver(res) { const app = this.app; app.busy = true; app.paused = true; const cfg = res.cfg, st = S.stats; let coins = 0, dr = 0, title = res.win ? '🏆 YOU WIN!' : '😅 GOOD GAME!', extra = '', next = null, dillNext = null, smashNext = null;
    st.matches++; if (res.win) st.wins++; else st.losses++; st.longest = Math.max(st.longest || 0, res.stats.longest); S.seenMatch = true; if (res.win) S.badges.firstwin = 1; if (res.stats.spins >= 5) S.badges.spin = 1;
    const K = [0.04, 0.06, 0.09, 0.12][cfg.diffK || 0];
    if (cfg.mode === 'quick') { coins = res.win ? { easy: 20, medium: 30, hard: 45, pro: 60 }[cfg.diff] || 20 : 6; dr = res.win ? K : -0.02; }
    else if (cfg.mode === 'ladder') { const r = LADDER.find((x) => x.id === cfg.rival); if (res.win) { coins = r.pay; dr = 0.12; if (!S.beat[r.id]) { S.beat[r.id] = 1; if (S.ladder === 10 - LADDER.indexOf(r)) S.ladder--; } S.badges.ladder = 1; if (r.boss) S.badges.king = 1; extra = `${esc(r.n)}: "${esc(r.lose)}"`; } else { coins = 8; extra = `${esc(r.n)}: "${esc(r.win)}"`; } }
    else if (cfg.mode === 'tourney') { const tr = S.tourRun, t = tr && TOURNEYS.find((x) => x.id === tr.id); if (t) { if (res.win) { tr.round++; dr = 0.06; coins = 15; if (tr.round >= tr.rounds) { coins += t.prize; dr = 0.2; S.tour[t.id] = 1; S.tourRun = null; title = t.icon + ' CHAMPION!'; extra = 'You won the ' + esc(t.n) + '!'; } else { next = true; extra = 'On to the next round!'; } } else { S.tourRun = null; coins = 10; extra = 'Knocked out... the next one is yours.'; } } }
    else if (cfg.mode === 'dillers') {
      const rIdx = cfg.dillersRound || 0;
      if (res.win) {
        if (rIdx < DILLERS_ROUNDS.length - 1) {
          const nxt = DILLERS_ROUNDS[rIdx + 1];
          S.dillers.run = { round: rIdx + 1 };
          coins = 35 + rIdx * 25; dr = 0.08; dillNext = rIdx + 1;
          if (this.g.mv) this.g.mv.exitSpot = SPOTS['court_' + nxt.court] || this.g.mv.exitSpot;
          title = `🏟️ ROUND ${rIdx + 1} WON!`;
          extra = `🐁 Director Snowie: "Squeak!! Next stop: ${esc(COURTS[nxt.court].n)} (${nxt.diff.toUpperCase()})!"`;
        } else {
          S.dillers.wins = (S.dillers.wins || 0) + 1; S.dillers.run = null;
          S.badges.dillchamp = 1; S.tour.dillers = (S.tour.dillers || 0) + 1;
          coins = 260; dr = 0.24;
          title = '🏟️👑 DRIVE DILLERS CHAMPION!';
          extra = '🐁🏆 Director Snowie & Courts Manager Lola award you the GOLDEN DILL CUP!';
        }
      } else {
        coins = 12; dr = -0.01;
        extra = '🐁 Director Snowie: "So close! You can retry this round anytime at the bracket board!"';
      }
    }
    else if (cfg.mode === 'smash_cup') {
      if (!S.smash) S.smash = { wins: 0, run: null, smasher: 'rita', oppSmasher: 'bo', doubles: false };
      const rIdx = cfg.smashRound || 0;
      if (res.win) {
        if (rIdx < SMASH_CUP_ROUNDS.length - 1) {
          const nxt = SMASH_CUP_ROUNDS[rIdx + 1];
          S.smash.run = { round: rIdx + 1 };
          coins = 45 + rIdx * 30; dr = 0.09; smashNext = rIdx + 1;
          if (this.g.mv) this.g.mv.exitSpot = SPOTS['court_' + nxt.court] || this.g.mv.exitSpot;
          title = `💥 SMASH ROUND ${rIdx + 1} WON!`;
          extra = `🐭 Smash Coach Luna: "BOOM!! Next arena: ${esc(COURTS[nxt.court].n)} (${nxt.diff.toUpperCase()})!"`;
        } else {
          S.smash.wins = (S.smash.wins || 0) + 1; S.smash.run = null;
          S.badges.smashchamp = 1; S.tour.smash = (S.tour.smash || 0) + 1;
          coins = 300; dr = 0.25;
          title = '💥👑 SUPER SMASH CUP CHAMPION!';
          extra = '🐭🏴‍☠️🐢 Luna, Umpire Pi-rat, Snowie, Candy & Torty crown you the SUPER SMASH GRAND CHAMPION!';
        }
      } else {
        coins = 15; dr = -0.01;
        extra = '🐭 Luna & 🐢 Torty: "Tough battle! Check your Paddle Grit at Torty\'s Forge and retry this round anytime!"';
      }
    }
    if (res.buffed) extra += ' 🌭 Snack power used.';
    if (S.padCond != null && S.padCond <= 30) extra += ` 🛠️ Paddle Grit at ${Math.round(S.padCond)}% — visit Torty's Repair Forge for a FREE Emergency Rebuild!`;
    const before = rankOf(S.rating).n; S.rating = Math.max(2.0, Math.min(5.5, +(S.rating + dr).toFixed(2))); const after = rankOf(S.rating).n; S.coins += coins; S.xp += res.stats.hits; persist();
    const sh = res.stats.shots, shots = Object.keys(sh).map((k) => k + ' ' + sh[k]).join(' · ');
    panel(`<h2>${title}</h2><div class="big">${res.score[0]} – ${res.score[1]}</div>${extra ? `<p class="sub">${extra}</p>` : ''}
      <div class="statGrid"><div><b>+${coins}</b><small>🪙 Coins</small></div><div><b>${S.rating.toFixed(2)}</b><small>⭐ Rating ${dr >= 0 ? '+' : ''}${dr.toFixed(2)}</small></div><div><b>${res.stats.longest}</b><small>🏓 Longest rally</small></div><div><b>${res.stats.spins}</b><small>🌀 Spin shots</small></div></div>
      <p class="sub">${shots || ''}${before !== after ? '<br>🎉 New rank: <b>' + after + '</b>!' : ''}</p>
      <div class="btnRow">${smashNext != null ? `<button class="go" id="sn">💥 NEXT ARENA: ${esc(COURTS[SMASH_CUP_ROUNDS[smashNext].court].n)}</button>` : cfg.mode === 'smash_cup' && !res.win ? '<button class="go" id="sr">🔁 RETRY SMASH ROUND</button>' : dillNext != null ? `<button class="go" id="dn">🏟️ NEXT COURT: ${esc(COURTS[DILLERS_ROUNDS[dillNext].court].n)}</button>` : cfg.mode === 'dillers' && !res.win ? '<button class="go" id="dr">🔁 RETRY ROUND</button>' : next ? '<button class="go" id="n">▶ NEXT ROUND</button>' : cfg.mode === 'quick' ? '<button class="go" id="r">🔁 REMATCH</button>' : cfg.mode === 'ladder' && S.ladder >= 1 && res.win ? '<button class="go" id="l">🪜 NEXT RUNG</button>' : ''}<button class="mbtn2" id="b">🚶 Back to the park</button></div>`, (c) => {
      const end = () => this.g.endMatch();
      on(c, '#sn', () => { end(); this.smashHub(); });
      on(c, '#sr', () => { end(); this.smashHub(); });
      on(c, '#dn', () => { end(); this.dillersTourney(); });
      on(c, '#dr', () => { end(); this.dillersTourney(); });
      on(c, '#n', () => { end(); this.bracket(); });
      on(c, '#r', () => { end(); this.start(Object.assign({}, cfg, { opps: cfg.opps.map((o) => this.oppDef(o.diff)) })); });
      on(c, '#l', () => { end(); this.ladder(); });
      on(c, '#b', () => { end(); app.resume(); }); }); }
}
