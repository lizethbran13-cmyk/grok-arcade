// Grok Snowie Sky Tours - menus: title, look editor, how to fly, journal (pause), map, paint shop, postcards.
import { GAMES, MG_NAMES } from './mg.js?v=st9';
import { $, esc } from './util.js?v=st9';
import { S, persist, resetSave } from './save.js?v=st9';
import { sfx, setSound } from './audio.js?v=st9';
import { panel, closePanel, on, loop, ptr, rr } from './uikit.js?v=st9';
import { SKINS, HAIRS, HAIR_COLS, SHIRTS, PANTS, cleanLook } from './humans.js?v=st9';
import { COURSES, goal, PET_NAMES } from './story.js?v=st9';
import { TOURS, RESCUES, STAMPS, TOWNS, PADS, Hf, WATER_Y, LAKE } from './map.js?v=st9';
import { PAINTS } from './copter.js?v=st9';
import { PLANES, PLANE } from './planes.js?v=st9';
import { hpOf, repairCost, UPGRADES, INSURANCE } from './care.js?v=st9';
import { COTTAGE_IDS } from './rooms.js?v=st9';
const hex = (c) => '#' + c.toString(16).padStart(6, '0');
let mapImg = null;
export class UI {
  constructor(app) { this.app = app; }
  get g() { return this.app.game; }
  title() { const app = this.app; const ui = $('ui'); ui.classList.add('open'); app.preview = false; ui.innerHTML = `<div class="title">
      <div class="logo"><span class="l0">GROK</span><span class="l1">SNOWIE</span><span class="l2">SKY TOURS</span></div>
      <p class="tag">Fly Snowie's tour copter over Pup Town, Torty Town and North Pole Village. Snap tour postcards, rescue stranded pets, race the ring courses... and if you crash, the tow-drone has your back!</p>
      <div class="tBtns"><button class="go" id="tPlay">🚁 ${S.made ? 'BACK TO THE SKIES' : 'BECOME A PILOT'}</button><button class="mbtn2" id="tLook">👤 YOUR LOOK</button><button class="mbtn2" id="tOpts">⚙️ OPTIONS</button></div>
      <p class="foot">A Grok game · Snowie, Candy, Torty, Luna & Pi-rat</p></div>`;
    on(ui, '#tPlay', () => { if (!S.made) return this.custom(() => app.play(), true); app.play(); }); on(ui, '#tLook', () => this.custom(() => this.title())); on(ui, '#tOpts', () => this.options(() => this.title())); }
  custom(done, first) { const app = this.app; app.preview = true; const L = S.look = cleanLook(S.look);
    const row = (k, arr, txt) => `<div class="swRow">${arr.map((c, i) => txt ? `<button data-k="${k}" data-i="${i}" class="txt ${L[k] === i ? 'on' : ''}">${c}</button>` : `<button data-k="${k}" data-i="${i}" class="${L[k] === i ? 'on' : ''}" style="background:${hex(c)}"></button>`).join('')}</div>`;
    panel(`<h2>👤 ${first ? 'PILOT LICENCE' : 'YOUR LOOK'}</h2><h3>NAME</h3><input id="cName" maxlength="12" value="${esc(S.name || '')}" placeholder="Pilot name">
      <h3>SKIN</h3>${row('skin', SKINS)}<h3>HAIR</h3>${row('hair', HAIRS, true)}${row('hairC', HAIR_COLS)}<h3>JACKET</h3>${row('shirt', SHIRTS)}<h3>PANTS</h3>${row('pants', PANTS)}
      <button class="go" id="cOk">${first ? '🚁 READY FOR TAKE-OFF!' : 'DONE'}</button>`, (c) => {
      c.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => { sfx('click'); L[b.dataset.k] = +b.dataset.i; S.look = L; persist(); app.game.refreshMe(); this.custom(done, first); });
      on(c, '#cOk', () => { S.name = String(c.querySelector('#cName').value || '').slice(0, 12); S.made = true; persist(); app.game.refreshMe(); app.preview = false; done(); }); }, 'custP'); }
  options(back) { panel(`<h2>⚙️ OPTIONS</h2><div class="seg"><button id="oS" class="${S.opts.sound ? 'on' : ''}">🔊 Sound</button><button id="oM" class="${S.opts.music ? 'on' : ''}">🎵 Music</button></div>
      <p class="sub">Graphics are always on full: Turbo engine with soft shadows, ambient occlusion and bloom. The game sharpens itself automatically when your phone has speed to spare.</p>
      <button class="mbtn2 sm danger" id="oR">Reset save</button><button class="go" id="oB">BACK</button>`, (c) => {
      on(c, '#oS', () => { S.opts.sound = !S.opts.sound; persist(); setSound(S.opts.sound, S.opts.music); this.options(back); }); on(c, '#oM', () => { S.opts.music = !S.opts.music; persist(); setSound(S.opts.sound, S.opts.music); this.options(back); });
      on(c, '#oR', () => { if (confirm('Reset your Sky Tours save?')) { resetSave(); location.reload(); } }); on(c, '#oB', back); }); }
  how(done) { panel(`<h2>🚁 FLIGHT SCHOOL</h2><div class="how"><p>🕹️ Left thumb: fly that way. Drag anywhere else to look around.</p><p>▲ / ▼ buttons: climb and descend. Let go and the copter hovers by itself.</p><p>🛬 Come down gently on a landing pad, then tap 🚪 to hop out. Every building in town is walk-in!</p><p>📸 Fly close to a pink camera to snap a tour postcard. 🐾 Land near a HELP! sign to rescue a pet.</p><p>💥 Crashed? Nobody gets hurt and the tow-drone always comes (or tap 🛸 TOW any time). But your plane gets dented, passengers lose their fare and your ⭐ rating dips. Fix it at the 🔧 Repair Hangar!</p><p>✈️ Earn 🪙 coins from fares, tour photos and rescues, then buy new planes at the Plane Lineup by the runway.</p></div><button class="go" id="hOk">LET'S FLY!</button>`, (c) => on(c, '#hOk', () => { S.seenHow = true; persist(); done(); })); }
  pause() { const app = this.app; app.busy = true; const md = (c) => { const r = S.rings[c.id]; return r ? `${r.medal === 'gold' ? '🥇' : r.medal === 'silver' ? '🥈' : '🥉'} ${r.t.toFixed(2)} s` : 'not flown yet'; };
    panel(`<h2>📒 PILOT'S LOG</h2><p class="sub">⭐ ${esc(goal(this.g))}</p>
      <div class="statGrid"><div><b>${S.tours.length}/${TOURS.length}</b><small>📸 Tour stops</small></div><div><b>${S.rescues.length}/${RESCUES.length}</b><small>🐾 Pets rescued</small></div><div><b>${S.stamps.length}/${STAMPS.length}</b><small>🛂 Passport</small></div><div><b>${S.crashes}</b><small>💥 Crashes (all harmless)</small></div><div><b>🪙 ${S.coins}</b><small>Coins</small></div><div><b>⭐ ${S.rating.toFixed(1)}</b><small>Passenger rating</small></div></div><p class="sub">${PLANE(S.plane).emoji} Flying the ${esc(PLANE(S.plane).name)} (🔧 ${hpOf(S.plane)}%) · Hangar: ${S.owned.length}/${PLANES.length} aircraft${S.ins ? ` · 🛡️ ${S.ins} insurance claims` : ''}</p>
      <h3>RING COURSES</h3>${COURSES.map((c) => `<div class="upRow"><span class="ic">🏁</span><div><b>${esc(c.name)}</b><br><small>${md(c)} · gold under ${c.par} s</small></div></div>`).join('')}
      <h3>RESCUES</h3><p class="sub">${RESCUES.map((r) => `<span class="badge ${S.rescues.includes(r.id) ? 'on' : ''}">${S.rescues.includes(r.id) ? '✅' : '❔'} ${esc(r.name)}</span>`).join(' ')}</p>
      <h3>BADGES</h3><p class="sub">${[['survivor', '🛟 Survival Badge'], ['tourist', '📸 Tour Guide'], ['hero', '🐾 Rescue Hero'], ['ace', '🥇 Sky Ace'], ['globe', '🛂 Globetrotter'], ['neighbor', '🏡 Good Neighbor'], ['arcade', '🎮 Town Helper']].map(([k, n]) => `<span class="badge ${S.badges[k] ? 'on' : ''}">${n}</span>`).join(' ')}</p>
      <h3>IN TOWN</h3><div class="statGrid"><div><b>${S.helped.length}/${COTTAGE_IDS.length}</b><small>🏡 Neighbors helped</small></div><div><b>${Object.keys(S.played || {}).length}/${Object.keys(MG_NAMES).length}</b><small>🎮 Building games</small></div></div>
      <p class="sub">${Object.entries(MG_NAMES).map(([k, [e, n]]) => `<span class="badge ${S.played && S.played[k] ? 'on' : ''}">${e} ${esc(n)}${S.best && S.best[k] ? ' · ' + S.best[k] : ''}</span>`).join(' ')}</p>
      <p class="sub">Flown ${S.stats.km.toFixed(1)} km · ${S.stats.landings} landings · ${S.stats.tows} tows</p>
      <div class="btnRow"><button class="go" id="pR">▶ RESUME</button></div><div class="btnRow"><button class="mbtn2 sm" id="pM">🗺️ Map</button><button class="mbtn2 sm" id="pL">👤 Look</button><button class="mbtn2 sm" id="pO">⚙️</button><button class="mbtn2 sm" id="pT">🏠</button></div>`, (c) => {
      on(c, '#pR', () => app.resume()); on(c, '#pM', () => this.map(() => this.pause())); on(c, '#pL', () => this.custom(() => this.pause())); on(c, '#pO', () => this.options(() => this.pause())); on(c, '#pT', () => app.toTitle()); }); }
  map(back) { const app = this.app; app.busy = true; const g = this.g; const W = 480, sc = W / 1000, P = (x, z) => [(x + 500) * sc, (z + 500) * sc];
    panel(`<h2>🗺️ VALLEY MAP</h2><p class="sub">Tap a marker to set a waypoint. The pink arrow will point the way.</p><canvas id="mapC" width="${W}" height="${W}" class="sq"></canvas><div class="btnRow"><button class="go" id="mB">CLOSE</button></div>`, (c) => {
      const cv = c.querySelector('#mapC'), x2 = cv.getContext('2d');
      if (!mapImg) { const N = 160; mapImg = document.createElement('canvas'); mapImg.width = mapImg.height = N; const m = mapImg.getContext('2d'), id = m.createImageData(N, N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = i / N * 1000 - 500, z = j / N * 1000 - 500, h = Hf(x, z), k = (j * N + i) * 4; let col = h < WATER_Y ? [56, 189, 248] : h > 45 || (z > 200 && h > 18) ? [241, 245, 249] : h > 28 ? [148, 140, 130] : [74 + h * 2, 190 - h, 90]; for (const t in TOWNS) { const T = TOWNS[t]; if (Math.hypot(x - T.x, z - T.z) < T.r) col = t === 'np' ? [226, 232, 240] : [235, 215, 180]; } id.data[k] = col[0]; id.data[k + 1] = col[1]; id.data[k + 2] = col[2]; id.data[k + 3] = 255; } m.putImageData(id, 0, 0); }
      const marks = []; const draw = () => { x2.imageSmoothingEnabled = true; x2.drawImage(mapImg, 0, 0, W, W); x2.font = 'bold 15px system-ui'; x2.textAlign = 'center'; x2.textBaseline = 'middle';
        for (const k in TOWNS) { const t = TOWNS[k], [x, y] = P(t.x, t.z); x2.fillStyle = 'rgba(15,23,42,.75)'; x2.fillText(t.name.replace(/^\S+ /, ''), x, y - 26); }
        const mk = (x, z, e, n, y) => { const [px, py] = P(x, z); x2.font = '20px system-ui'; x2.fillText(e, px, py); marks.push({ px, py, x, z, n, y }); };
        PADS.forEach((p) => mk(p.x, p.z, '🅷', p.name, p.y + 10)); TOURS.forEach((t) => mk(t.x, t.z, S.tours.includes(t.id) ? '✅' : '📸', t.name, t.y + 7)); RESCUES.forEach((r) => { if (!S.rescues.includes(r.id) && S.carry !== r.id) mk(r.x, r.z, '🐾', r.name, r.y + 6); }); COURSES.forEach((co) => mk(co.pts[0][0], co.pts[0][2], '🏁', co.name, co.pts[0][1]));
        if (S.wp) { const [px, py] = P(S.wp.x, S.wp.z); x2.strokeStyle = '#ff4fa0'; x2.lineWidth = 4; x2.beginPath(); x2.arc(px, py, 16, 0, 7); x2.stroke(); }
        const o = g.mode === 'walk' ? g.me : g.cop, [px, py] = P(o.x, o.z); x2.save(); x2.translate(px, py); x2.rotate(-(g.mode === 'walk' ? g.me.yaw : g.cop.yaw) + Math.PI); x2.fillStyle = '#ff4fa0'; x2.strokeStyle = '#fff'; x2.lineWidth = 3; x2.beginPath(); x2.moveTo(0, -14); x2.lineTo(10, 10); x2.lineTo(-10, 10); x2.closePath(); x2.fill(); x2.stroke(); x2.restore(); };
      draw();
      cv.onclick = (e) => { const r = cv.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width * W, my = (e.clientY - r.top) / r.height * W; let best = null, bd = 30; for (const m of marks) { const d = Math.hypot(m.px - mx, m.py - my); if (d < bd) { bd = d; best = m; } } if (best) { S.wp = { x: best.x, z: best.z, y: best.y, n: best.n }; persist(); sfx('ding'); marks.length = 0; draw(); x2.fillStyle = '#0f172a'; x2.font = 'bold 18px system-ui'; x2.fillText('Waypoint: ' + best.n, W / 2, W - 18); } };
      on(c, '#mB', () => back ? back() : app.resume()); }); }
  paint() { const app = this.app; app.busy = true; panel(`<h2>🎨 PAINT SHOP</h2><p class="sub">Give Snowie's copter a fresh coat. Free, forever!</p><div class="hats">${PAINTS.map((p, i) => `<button class="hat ${S.paint === i ? 'on' : ''}" data-p="${i}"><span class="sw2" style="background:linear-gradient(90deg,${hex(p.a)} 60%,${hex(p.b)} 60%)"></span>${esc(p.n)}</button>`).join('')}</div><button class="go" id="pB">DONE</button>`, (c) => {
      c.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { sfx('buy'); this.g.repaint(+b.dataset.p); this.paint(); }); on(c, '#pB', () => app.resume()); }); }
  coinBar() { return `<div class="coinBar"><span>🪙 ${S.coins}</span><span>⭐ ${S.rating.toFixed(1)}</span><span>🛡️ ${S.ins} claim${S.ins === 1 ? '' : 's'}</span></div>`; }
  // ---------------- Plane Lineup (buy / choose) ----------------
  lineup(focus) { const app = this.app; app.busy = true; const g = this.g; const mx = { spd: 60, acc: 2, arm: 1.2, fare: 1.8 };
    const bar = (n, v) => `<span>${n}</span><em><i style="width:${Math.round(Math.max(8, Math.min(100, v * 100)))}%"></i></em>`;
    panel(`<h2>✈️ PLANE LINEUP</h2>${this.coinBar()}<p class="sub">Copters hover and land anywhere. Planes are faster but always fly forward: land on a runway 🛬 and roll to a stop.</p>
      ${PLANES.map((P, i) => { const own = S.owned.includes(P.id), sel = S.plane === P.id, hp = hpOf(P.id);
        return `<div class="pCard ${sel ? 'sel' : ''} ${focus === i ? 'focus' : ''}" id="pc${i}"><span class="pe">${P.emoji}</span><div><b>${esc(P.name)}</b> <small>${P.kind === 'heli' ? '🚁 Copter' : P.water ? '🌊 Seaplane' : '✈️ Plane'}${own ? ` · 🔧 ${hp}%` : ''}</small><small>${esc(P.desc)}</small>
          <div class="bars">${bar('Speed', P.spd / mx.spd)}${bar('Handling', (P.kind === 'heli' ? P.turn / 2.6 : P.turn / 1.8) * 0.9)}${bar('Toughness', (1.25 - P.arm) / 0.7)}${bar('Fares', P.fare / mx.fare)}</div></div>
          ${sel ? '<button class="pink" disabled>FLYING</button>' : own ? `<button data-sel="${P.id}">FLY THIS</button>` : `<button data-buy="${P.id}" class="${S.coins >= P.price ? '' : 'off'}">🪙 ${P.price}</button>`}</div>`; }).join('')}
      <button class="go" id="lB">DONE</button>`, (c) => {
      c.querySelectorAll('[data-sel]').forEach((b) => b.onclick = () => { g.choosePlane(b.dataset.sel); this.lineup(PLANES.findIndex((p) => p.id === b.dataset.sel)); });
      c.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => { const P = PLANE(b.dataset.buy); if (S.coins < P.price) { sfx('deny'); b.textContent = `need ${P.price - S.coins} more`; return; } S.coins -= P.price; S.owned.push(P.id); persist(); sfx('win'); g.choosePlane(P.id); this.lineup(PLANES.indexOf(P)); });
      on(c, '#lB', () => app.resume()); if (focus != null) { const e = c.querySelector('#pc' + focus); if (e) e.scrollIntoView({ block: 'center' }); } }); }
  // ---------------- Repair Hangar: fix, insurance, upgrades ----------------
  repair(tab) { const app = this.app; app.busy = true; const g = this.g, c = g.cop, P = PLANE(c.id), cost = repairCost(c.id);
    panel(`<h2>🔧 REPAIR HANGAR</h2>${this.coinBar()}
      <div class="pCard"><span class="pe">${P.emoji}</span><div><b>${esc(P.name)}</b><div class="hpBar"><i style="width:${c.hp}%"></i></div><small>${c.hp >= 100 ? 'Shiny and perfect!' : c.hp <= 0 ? '🚫 Out of service until repaired' : c.hp < 30 ? 'Smoking, sparking and a bit wobbly' : c.hp < 60 ? 'Dented and smoky' : 'A few scuffs'} · ${c.hp}%</small></div></div>
      ${c.hp < 100 ? `<div class="btnRow"><button class="go" id="rQ" ${S.coins >= cost ? '' : 'disabled style="opacity:.5"'}>🔧 QUICK FIX · 🪙 ${cost}</button></div><div class="btnRow"><button class="mbtn2" id="rH">🧰 HELP BRIE FIX IT (FREE, MORE BOLTS)</button></div>` : ''}
      <h3>🛡️ SNOWIE SHIELD INSURANCE</h3><p class="sub">${INSURANCE.claims} claims: after a crash your passengers still pay their fare, and repairs are half price while you have claims left.</p>
      <div class="btnRow"><button class="mbtn2 sm" id="rI">🛡️ BUY · 🪙 ${INSURANCE.price}</button></div>
      <h3 id="upH">⬆️ UPGRADES</h3>${UPGRADES.map((u) => `<div class="pCard"><span class="pe">${{ armor: '🐢', skids: '🦘', float: '🦆', turbo: '⚡' }[u.id]}</span><div><b>${esc(u.name)}</b><small>${esc(u.by)}</small><small>${esc(u.desc)}</small></div>${S.up[u.id] ? '<button class="pink" disabled>INSTALLED</button>' : `<button data-up="${u.id}" class="${S.coins >= u.price ? '' : 'off'}">🪙 ${u.price}</button>`}</div>`).join('')}
      <button class="go" id="rB">DONE</button>`, (c2) => {
      on(c2, '#rQ', () => { if (S.coins < cost) return; S.coins -= cost; persist(); this.fixGame(4, () => { g.repairNow(); this.repair(); }); });
      on(c2, '#rH', () => this.fixGame(12, () => { g.repairNow(); this.repair(); }));
      on(c2, '#rI', () => { if (S.coins < INSURANCE.price) { sfx('deny'); return; } S.coins -= INSURANCE.price; S.ins += INSURANCE.claims; persist(); sfx('buy'); this.repair(); });
      c2.querySelectorAll('[data-up]').forEach((b) => b.onclick = () => { const u = UPGRADES.find((q) => q.id === b.dataset.up); if (S.coins < u.price) { sfx('deny'); b.textContent = `need ${u.price - S.coins}`; return; } S.coins -= u.price; S.up[u.id] = 1; persist(); sfx('win'); this.repair('up'); });
      on(c2, '#rB', () => app.resume()); if (tab === 'up') { const h = c2.querySelector('#upH'); if (h) h.scrollIntoView({ block: 'start' }); } }); }
  // the repair mini-interaction: tap every glowing dent/bolt on the plane before the wrench timer runs out (no fail state)
  fixGame(n, done) { const g = this.g, P = PLANE(g.cop.id), pt = PAINTS[S.paint % PAINTS.length];
    panel(`<h2>🧰 FIX-IT TIME!</h2><p class="sub" id="fgT">Tap every dent and loose bolt on the ${esc(P.name)}! ${n} to go</p><canvas id="fgC" class="rmg" width="360" height="240"></canvas><p class="sub">Brie hands you wrenches. Torty supervises. 🐢</p>`, (c) => {
      const cv = c.querySelector('#fgC'), x = cv.getContext('2d'), W = 360, H = 240, at = ptr(cv, W, H); const spots = []; let left = n, t = 0, fx = [];
      const hex = (v) => '#' + v.toString(16).padStart(6, '0');
      const spawn = () => { if (spots.filter((s) => !s.done).length >= Math.min(3, left)) return; const k = Math.random(); spots.push({ x: 60 + Math.random() * 240, y: 85 + Math.random() * 70, r: 15, k: k < 0.5 ? 'dent' : 'bolt', t: 0, done: false }); };
      const tap = (e) => { e.preventDefault(); const [mx, my] = at(e); for (const s of spots) if (!s.done && Math.hypot(s.x - mx, s.y - my) < s.r + 12) { s.done = true; left--; sfx(s.k === 'bolt' ? 'crumb' : 'hit'); for (let i = 0; i < 10; i++) fx.push({ x: s.x, y: s.y, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 160, t: 0.6 }); c.querySelector('#fgT').textContent = left > 0 ? `Nice! ${left} to go` : 'All fixed! ✨'; if (left <= 0) { stop(); setTimeout(done, 700); } break; } };
      cv.addEventListener('touchstart', tap, { passive: false }); cv.addEventListener('mousedown', tap);
      const stop = loop(cv, (dt) => { t += dt; if (Math.random() < dt * 2.5) spawn(); x.clearRect(0, 0, W, H); const gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#334155'); gr.addColorStop(1, '#0f172a'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
        x.fillStyle = '#475569'; x.fillRect(0, 190, W, 50); for (let i = 0; i < 9; i++) { x.fillStyle = i % 2 ? '#111827' : '#facc15'; x.fillRect(i * 40, 186, 40, 6); }
        // side view of your aircraft (simple cartoon), in your paint
        x.fillStyle = hex(pt.a); x.strokeStyle = '#0f172a'; x.lineWidth = 3; rr(x, 50, 80, 230, 80, 40); x.fill(); x.stroke(); x.fillStyle = hex(pt.b); rr(x, 52, 128, 226, 28, 14); x.fill();
        x.fillStyle = hex(pt.a); x.beginPath(); x.moveTo(60, 110); x.lineTo(10, 95); x.lineTo(10, 70); x.lineTo(30, 70); x.lineTo(70, 95); x.closePath(); x.fill(); x.stroke();
        x.fillStyle = '#bfe9ff'; rr(x, 210, 88, 56, 34, 14); x.fill(); x.stroke(); x.fillStyle = '#0f172a';
        if (P.kind === 'heli') { x.fillRect(160, 52, 8, 30); x.fillRect(70 + Math.sin(t * 30) * 30, 46, 200 - Math.sin(t * 30) * 60, 7); x.fillRect(110, 170, 140, 6); x.fillRect(130, 160, 6, 12); x.fillRect(230, 160, 6, 12); }
        else { x.fillStyle = hex(pt.a); rr(x, 120, 112, 120, 16, 8); x.fill(); x.stroke(); x.fillStyle = '#0f172a'; x.fillRect(284, 100 + Math.sin(t * 40) * 26, 6, 40 - Math.sin(t * 40) * 52 + 26); x.beginPath(); x.arc(150, 172, 12, 0, 7); x.arc(240, 172, 12, 0, 7); x.fill(); }
        for (const s of spots) { if (s.done) continue; s.t += dt; const p = 1 + Math.sin(s.t * 8) * 0.12; x.save(); x.translate(s.x, s.y); x.scale(p, p);
          if (s.k === 'dent') { x.fillStyle = '#3f3f46'; x.beginPath(); x.ellipse(0, 0, s.r, s.r * 0.75, 0.4, 0, 7); x.fill(); x.strokeStyle = '#facc15'; x.lineWidth = 3; x.stroke(); x.fillStyle = '#18181b'; x.beginPath(); x.ellipse(2, 1, s.r * 0.5, s.r * 0.35, 0.4, 0, 7); x.fill(); }
          else { x.fillStyle = '#e5e7eb'; x.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + s.t; x.lineTo(Math.cos(a) * s.r, Math.sin(a) * s.r); } x.closePath(); x.fill(); x.strokeStyle = '#facc15'; x.lineWidth = 3; x.stroke(); x.fillStyle = '#64748b'; x.beginPath(); x.arc(0, 0, 5, 0, 7); x.fill(); }
          x.restore(); }
        fx = fx.filter((f) => (f.t -= dt) > 0); for (const f of fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 300 * dt; x.fillStyle = '#ffe14d'; x.fillRect(f.x, f.y, 4, 4); }
        x.font = 'bold 15px system-ui'; x.fillStyle = '#fff'; x.textAlign = 'left'; x.fillText(`🔧 ${n - left}/${n}`, 10, 22); });
      spawn(); spawn(); }); }
  minigame(id, done) { this.app.busy = true; GAMES[id](done); }
  postcards() { const app = this.app; app.busy = true; panel(`<h2>📮 POSTCARDS</h2><p class="sub">${S.tours.length}/${TOURS.length} collected</p>${TOURS.map((t) => `<div class="upRow"><span class="ic">${S.tours.includes(t.id) ? '🖼️' : '❔'}</span><div><b>${S.tours.includes(t.id) ? esc(t.name) : '???'}</b><br><small>${esc(t.town === 'lake' ? 'Lake Shimmer' : (TOWNS[t.town] || { name: '' }).name)}</small></div></div>`).join('')}<button class="go" id="pB">CLOSE</button>`, (c) => on(c, '#pB', () => app.resume())); }
}
