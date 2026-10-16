// Grok Snowie Sky Tours - menus: title, look editor, how to fly, journal (pause), map, paint shop, postcards.
import { $, esc } from './util.js?v=st3';
import { S, persist, resetSave } from './save.js?v=st3';
import { sfx, setSound } from './audio.js?v=st3';
import { panel, closePanel, on } from './uikit.js?v=st3';
import { SKINS, HAIRS, HAIR_COLS, SHIRTS, PANTS, cleanLook } from './humans.js?v=st3';
import { COURSES, goal, PET_NAMES } from './story.js?v=st3';
import { TOURS, RESCUES, STAMPS, TOWNS, PADS, Hf, WATER_Y, LAKE } from './map.js?v=st3';
import { PAINTS } from './copter.js?v=st3';
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
  how(done) { panel(`<h2>🚁 FLIGHT SCHOOL</h2><div class="how"><p>🕹️ Left thumb: fly that way. Drag anywhere else to look around.</p><p>▲ / ▼ buttons: climb and descend. Let go and the copter hovers by itself.</p><p>🛬 Come down gently on a landing pad, then tap 🚪 to hop out. Every building in town is walk-in!</p><p>📸 Fly close to a pink camera to snap a tour postcard. 🐾 Land near a HELP! sign to rescue a pet.</p><p>💥 Crashed? It's harmless. The tow-drone carries you to the nearest pad.</p></div><button class="go" id="hOk">LET'S FLY!</button>`, (c) => on(c, '#hOk', () => { S.seenHow = true; persist(); done(); })); }
  pause() { const app = this.app; app.busy = true; const md = (c) => { const r = S.rings[c.id]; return r ? `${r.medal === 'gold' ? '🥇' : r.medal === 'silver' ? '🥈' : '🥉'} ${r.t.toFixed(2)} s` : 'not flown yet'; };
    panel(`<h2>📒 PILOT'S LOG</h2><p class="sub">⭐ ${esc(goal(this.g))}</p>
      <div class="statGrid"><div><b>${S.tours.length}/${TOURS.length}</b><small>📸 Tour stops</small></div><div><b>${S.rescues.length}/${RESCUES.length}</b><small>🐾 Pets rescued</small></div><div><b>${S.stamps.length}/${STAMPS.length}</b><small>🛂 Passport</small></div><div><b>${S.crashes}</b><small>💥 Crashes (all harmless)</small></div></div>
      <h3>RING COURSES</h3>${COURSES.map((c) => `<div class="upRow"><span class="ic">🏁</span><div><b>${esc(c.name)}</b><br><small>${md(c)} · gold under ${c.par} s</small></div></div>`).join('')}
      <h3>RESCUES</h3><p class="sub">${RESCUES.map((r) => `<span class="badge ${S.rescues.includes(r.id) ? 'on' : ''}">${S.rescues.includes(r.id) ? '✅' : '❔'} ${esc(r.name)}</span>`).join(' ')}</p>
      <h3>BADGES</h3><p class="sub">${[['survivor', '🛟 Survival Badge'], ['tourist', '📸 Tour Guide'], ['hero', '🐾 Rescue Hero'], ['ace', '🥇 Sky Ace'], ['globe', '🛂 Globetrotter']].map(([k, n]) => `<span class="badge ${S.badges[k] ? 'on' : ''}">${n}</span>`).join(' ')}</p>
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
  postcards() { const app = this.app; app.busy = true; panel(`<h2>📮 POSTCARDS</h2><p class="sub">${S.tours.length}/${TOURS.length} collected</p>${TOURS.map((t) => `<div class="upRow"><span class="ic">${S.tours.includes(t.id) ? '🖼️' : '❔'}</span><div><b>${S.tours.includes(t.id) ? esc(t.name) : '???'}</b><br><small>${esc(t.town === 'lake' ? 'Lake Shimmer' : (TOWNS[t.town] || { name: '' }).name)}</small></div></div>`).join('')}<button class="go" id="pB">CLOSE</button>`, (c) => on(c, '#pB', () => app.resume())); }
}
