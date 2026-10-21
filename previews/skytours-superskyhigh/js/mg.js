// Grok Snowie Sky Tours - building mini-games (overlay canvases with a fixed 480x400 aspect, never stretched).
// Ticket Rush (Tour Office), Rotor Tune-up (Hangar), Sky Ace (Pilot Lounge arcade), Stamp the Forms (Pup Town Hall),
// Frost the Pup-Tarts (Barkery), Shell Match (Shell Museum), Wire It Up (Ratita Gadget Shop), Gift Wrap Rush (Toy Workshop),
// Marshmallow Catch (Cocoa Cabin).
import { S, persist } from './save.js?v=st8';
import { sfx } from './audio.js?v=st8';
import { panel, loop, rr, ptr } from './uikit.js?v=st8';
const $q = (c, s) => c.querySelector(s);
const W = 480, H = 400;
export const MG_NAMES = { tickets: ['🎟️', 'Ticket Rush'], tune: ['🔧', 'Rotor Tune-up'], skyace: ['🕹️', 'Sky Ace'], forms: ['📝', 'Stamp the Forms'], frost: ['🦴', 'Frost the Pup-Tarts'], shells: ['🐚', 'Shell Match'], wires: ['🔌', 'Wire It Up'], wrap: ['🎁', 'Gift Wrap Rush'], marsh: ['☕', 'Marshmallow Catch'] };
function shell(title, sub) { return `<h2>${title}</h2><p class="sub" id="mS">${sub}</p><canvas id="mC" width="${W}" height="${H}" style="touch-action:none"></canvas><div class="btnRow"><button class="mbtn2" id="mX">QUIT</button></div>`; }
function finish(key, score, title, msg, done) { S.best = S.best || {}; const best = S.best[key] || 0, nb = score > best; if (nb) { S.best[key] = score; } S.played = S.played || {}; S.played[key] = 1; persist();
  if (Object.keys(MG_NAMES).every((k) => S.played[k]) && !S.badges.arcade) { S.badges.arcade = 1; persist(); msg += ' 🏅 Badge: Town Helper (played every building game)!'; }
  panel(`<h2>${title}</h2><div class="gold">${score >= 1 ? '🏆' : '🐾'}</div><p class="clueTx">${msg}</p><p class="sub">Score ${score}${nb ? ' · NEW BEST!' : ' · best ' + best}</p><button class="go" id="fx">OK</button>`, (c) => { $q(c, '#fx').onclick = () => { sfx('click'); done(); }; }, 'mgP'); }
function bg(g, a, b) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
function emoji(g, e, x, y, s) { g.font = `${s}px system-ui, Apple Color Emoji, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, x, y); }
function label(g, t, x, y, s, c = '#fff', al = 'center') { g.font = `900 ${s}px Nunito, Trebuchet MS, sans-serif`; g.textAlign = al; g.textBaseline = 'middle'; g.fillStyle = c; g.fillText(t, x, y); }
function setup(title, sub, body) { return (done) => panel(shell(title, sub), (c) => { const cv = $q(c, '#mC'), g = cv.getContext('2d'), pt = ptr(cv, W, H), st = $q(c, '#mS'); let kill = () => {}; $q(c, '#mX').onclick = () => { kill(); sfx('click'); done(); }; kill = body({ cv, g, pt, st, done, end: (...a) => { kill(); setTimeout(() => finish(...a, done), 350); } }); }, 'mgP'); }
const pops = (g, fx, dt) => { for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.l -= dt; if (f.l <= 0) { fx.splice(i, 1); continue; } label(g, f.t, f.x, f.y - (0.8 - f.l) * 60, 26, f.c); } };
// ---------------- TICKET RUSH: give each tourist the ticket for the place they want to visit ----------------
const tickets = setup('🎟️ TICKET RUSH', 'Each tourist wants a tour. Tap the matching ticket before they get bored!', ({ cv, g, pt, st, end }) => {
  const DEST = [['🐶', '#facc15', 'Pup Town'], ['🐢', '#14b8a6', 'Torty Town'], ['🎄', '#ef4444', 'N. Pole'], ['🏔️', '#60a5fa', 'Snowcap']], WHO = ['🐕', '🐈', '🐇', '🐹', '🦊', '🐻', '🐼', '🐨', '🐷', '🐥'];
  let t = 40, sc = 0, q = [], fx = [], over = false; const add = () => q.push({ d: (Math.random() * 4) | 0, w: WHO[(Math.random() * WHO.length) | 0], p: 1, x: W + 60 }); add(); add(); add();
  cv.onpointerdown = (e) => { if (over) return; e.preventDefault(); const [x, y] = pt(e); if (y < 290) return; const k = Math.floor(x / (W / 4)), f = q[0]; if (!f) return;
    if (f.d === k) { sc++; sfx('ding'); fx.push({ x: 90, y: 120, t: '+1 ✈️', c: '#16a34a', l: 0.8 }); } else { sfx('deny'); fx.push({ x: 90, y: 120, t: 'oops!', c: '#dc2626', l: 0.8 }); } q.shift(); add(); };
  return loop(cv, (dt) => { if (!over) { t -= dt; const pace = 0.16 + (40 - t) * 0.006; if (q[0]) { q[0].p -= dt * pace; if (q[0].p <= 0) { sfx('squeak'); fx.push({ x: 90, y: 120, t: 'yawn…', c: '#64748b', l: 0.8 }); q.shift(); add(); } } if (t <= 0) { over = true; end('tickets', sc, '🎟️ Tours booked!', `You sold ${sc} tour tickets. Snowie is already packing snacks for all of them.`); } }
    bg(g, '#fdf2f8', '#fbcfe8'); g.fillStyle = '#ff4fa0'; rr(g, 0, 230, W, 40, 8); g.fill(); label(g, 'SNOWIE SKY TOURS · TICKETS', W / 2, 250, 16);
    q.forEach((f, i) => { const tx = 90 + i * 140; f.x += (tx - f.x) * Math.min(1, dt * 8); emoji(g, f.w, f.x, 175, i ? 48 : 64); if (!i) { g.fillStyle = '#fff'; rr(g, f.x - 45, 40, 90, 70, 18); g.fill(); emoji(g, DEST[f.d][0], f.x, 72, 40); g.fillStyle = '#e5e7eb'; rr(g, f.x - 45, 116, 90, 10, 5); g.fill(); g.fillStyle = f.p > 0.35 ? '#22c55e' : '#f97316'; rr(g, f.x - 45, 116, 90 * Math.max(0, f.p), 10, 5); g.fill(); } });
    DEST.forEach(([e, col, n], k) => { const x = k * W / 4; g.fillStyle = col; rr(g, x + 8, 292, W / 4 - 16, 100, 16); g.fill(); emoji(g, e, x + W / 8, 328, 36); label(g, n, x + W / 8, 372, 15); });
    pops(g, fx, dt); st.textContent = `Booked ${sc} · ${Math.ceil(Math.max(0, t))} s`; }); });
// ---------------- ROTOR TUNE-UP: stop the needle in the green zone (it shrinks every time) ----------------
const tune = setup('🔧 ROTOR TUNE-UP', 'Tap when the needle is in the GREEN zone. 8 rotor blades to tune!', ({ cv, g, pt, st, end }) => {
  let a = 0, dir = 1, sp = 1.6, n = 0, sc = 0, zc = 0.5, zw = 0.22, fx = [], over = false, msg = '', mt = 0; const nz = () => { zc = 0.15 + Math.random() * 0.7; zw = Math.max(0.06, 0.22 - n * 0.02); sp = 1.4 + n * 0.22; };
  cv.onpointerdown = (e) => { if (over) return; e.preventDefault(); const ok = Math.abs(a - zc) < zw / 2; if (ok) { sc++; sfx('ding'); msg = 'PURRFECT!'; } else { sfx('deny'); msg = 'wobbly…'; } mt = 0.7; n++; if (n >= 8) { over = true; end('tune', sc, '🔧 Rotors tuned!', `${sc}/8 blades tuned. Mechanic Brie says the copter now hums in the key of cheese.`); } else nz(); };
  return loop(cv, (dt) => { if (!over) { a += dir * sp * dt; if (a > 1) { a = 1; dir = -1; } if (a < 0) { a = 0; dir = 1; } }
    bg(g, '#e2e8f0', '#94a3b8'); const cx = W / 2, cy = 300, R = 190; g.lineWidth = 34; g.strokeStyle = '#475569'; g.beginPath(); g.arc(cx, cy, R, Math.PI, 0); g.stroke();
    g.strokeStyle = '#22c55e'; g.beginPath(); g.arc(cx, cy, R, Math.PI + (zc - zw / 2) * Math.PI, Math.PI + (zc + zw / 2) * Math.PI); g.stroke();
    const an = Math.PI + a * Math.PI; g.lineWidth = 8; g.strokeStyle = '#ef4444'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(an) * (R + 10), cy + Math.sin(an) * (R + 10)); g.stroke(); g.fillStyle = '#1f2937'; g.beginPath(); g.arc(cx, cy, 18, 0, 7); g.fill();
    for (let i = 0; i < 8; i++) emoji(g, i < n ? '✅' : '⚙️', 40 + i * 57, 360, 26); if (mt > 0) { mt -= dt; label(g, msg, cx, 200, 34, msg[0] === 'P' ? '#15803d' : '#b91c1c'); }
    st.textContent = `Blade ${Math.min(n + 1, 8)}/8 · tuned ${sc}`; }); });
// ---------------- SKY ACE: tap to climb, glide through the gaps, grab stars ----------------
const skyace = setup('🕹️ SKY ACE', 'Tap (or hold) to climb. Fly through the cloud gaps and grab ⭐!', ({ cv, g, pt, st, end }) => {
  let y = 200, vy = 0, hold = false, sc = 0, cols = [], spawn = 0.6, over = false, T = 0, stars = []; cv.onpointerdown = (e) => { e.preventDefault(); hold = true; vy = Math.min(vy, -140); sfx('jump'); }; cv.onpointerup = cv.onpointerleave = () => hold = false;
  return loop(cv, (dt) => { if (!over) { T += dt; vy += (hold ? -520 : 520) * dt; vy = Math.max(-260, Math.min(300, vy)); y += vy * dt; spawn -= dt; const sp = 150 + T * 4;
      if (spawn <= 0) { spawn = 1.7; const gap = Math.max(120, 170 - T * 2), gy = 70 + Math.random() * (H - 140 - gap); cols.push({ x: W + 40, gy, gap, p: false }); stars.push({ x: W + 40, y: gy + gap / 2, got: false }); }
      cols.forEach((c) => { c.x -= sp * dt; if (!c.p && c.x < 110) { c.p = true; sc++; sfx('crumb'); } }); stars.forEach((s) => { s.x -= sp * dt; if (!s.got && Math.hypot(s.x - 110, s.y - y) < 30) { s.got = true; sc += 2; sfx('ding'); } }); cols = cols.filter((c) => c.x > -60); stars = stars.filter((s) => s.x > -40);
      const hit = y < 10 || y > H - 10 || cols.some((c) => Math.abs(c.x - 110) < 40 && (y < c.gy + 14 || y > c.gy + c.gap - 14)); if (hit) { over = true; sfx('bosshit'); end('skyace', sc, '🕹️ Game over, ace!', `You scored ${sc}. Pilot Pat's high score is taped to the machine. It says "29 (probably)".`); } }
    bg(g, '#7dd3fc', '#e0f2fe'); cols.forEach((c) => { g.fillStyle = '#ffffff'; rr(g, c.x - 34, -20, 68, c.gy + 20, 30); g.fill(); rr(g, c.x - 34, c.gy + c.gap, 68, H, 30); g.fill(); g.fillStyle = '#e2e8f0'; rr(g, c.x - 34, c.gy - 18, 68, 18, 9); g.fill(); });
    stars.forEach((s) => { if (!s.got) emoji(g, '⭐', s.x, s.y, 26); }); g.save(); g.translate(110, y); g.rotate(Math.max(-0.4, Math.min(0.5, vy / 600))); emoji(g, '🚁', 0, 0, 44); g.restore();
    label(g, String(sc), W / 2, 40, 36, '#ff4fa0'); st.textContent = `Score ${sc}`; }); });
// ---------------- STAMP THE FORMS: stamp forms before Candy naps on them ----------------
const forms = setup('📝 STAMP THE FORMS', 'Tap forms 📄 to stamp them. Don\'t wake Candy 💤 (she naps on forms)!', ({ cv, g, pt, st, end }) => {
  const cells = Array.from({ length: 9 }, (_, i) => ({ i, k: 0, t: 0, s: 0 })); let t = 35, sc = 0, spawn = 0, fx = [], over = false;
  const cxy = (i) => [80 + (i % 3) * 160, 90 + ((i / 3) | 0) * 110];
  cv.onpointerdown = (e) => { if (over) return; e.preventDefault(); const [x, y] = pt(e); const c = cells.find((q) => { const [a, b] = cxy(q.i); return Math.abs(x - a) < 70 && Math.abs(y - b) < 50; }); if (!c || !c.k) return; const [a, b] = cxy(c.i);
    if (c.k === 1) { sc++; sfx('check'); c.k = 0; c.s = 0.5; fx.push({ x: a, y: b, t: 'APPROVED', c: '#16a34a', l: 0.8 }); } else { sc = Math.max(0, sc - 1); sfx('bark'); c.k = 0; fx.push({ x: a, y: b, t: 'ARF!', c: '#dc2626', l: 0.8 }); } };
  return loop(cv, (dt) => { if (!over) { t -= dt; spawn -= dt; if (spawn <= 0) { spawn = Math.max(0.35, 0.9 - (35 - t) * 0.015); const free = cells.filter((c) => !c.k); if (free.length) { const c = free[(Math.random() * free.length) | 0]; c.k = Math.random() < 0.25 ? 2 : 1; c.t = 1.6; } }
      cells.forEach((c) => { if (c.s > 0) c.s -= dt; if (c.k) { c.t -= dt; if (c.t <= 0) { if (c.k === 1) { const [a, b] = cxy(c.i); fx.push({ x: a, y: b, t: 'zzz', c: '#7c3aed', l: 0.8 }); } c.k = 0; } } });
      if (t <= 0) { over = true; end('forms', sc, '📝 Paperwork done!', `${sc} forms stamped. Mayor Goldie says that's a Pup Town record. Candy slept through all of it.`); } }
    bg(g, '#fef3c7', '#fde68a'); cells.forEach((c) => { const [a, b] = cxy(c.i); g.fillStyle = '#b45309'; rr(g, a - 70, b - 40, 140, 86, 12); g.fill(); g.fillStyle = '#92400e'; rr(g, a - 70, b + 34, 140, 12, 6); g.fill();
      if (c.k === 1) { g.fillStyle = '#fff'; rr(g, a - 30, b - 34, 60, 70, 6); g.fill(); g.fillStyle = '#cbd5e1'; for (let l = 0; l < 4; l++) g.fillRect(a - 22, b - 22 + l * 12, 44, 4); }
      else if (c.k === 2) emoji(g, '🐶', a, b - 2, 52), label(g, '💤', a + 36, b - 30, 22); if (c.s > 0) label(g, '✔', a, b, 50, '#16a34a'); });
    pops(g, fx, dt); st.textContent = `Stamped ${sc} · ${Math.ceil(Math.max(0, t))} s`; }); });
// ---------------- FROST THE PUP-TARTS: hold to squeeze frosting, let go at the line ----------------
const frost = setup('🦴 FROST THE PUP-TARTS', 'HOLD to squeeze frosting, let go right on the dashed line. 5 treats!', ({ cv, g, pt, st, end }) => {
  let n = 0, sc = 0, lvl = 0, holding = false, line = 0.6, msg = '', mt = 0, over = false; const COL = ['#f472b6', '#fde68a', '#a78bfa', '#4ade80', '#60a5fa'];
  const next = () => { lvl = 0; line = 0.4 + Math.random() * 0.45; n++; if (n >= 5) { over = true; end('frost', sc, '🦴 Pup-Tarts frosted!', `${sc} points of frosting perfection. Baker Dot put your best one in the window.`); } };
  cv.onpointerdown = (e) => { e.preventDefault(); if (!over && !mt) holding = true; }; cv.onpointerup = cv.onpointerleave = () => { if (!holding) return; holding = false; const d = Math.abs(lvl - line); const p = d < 0.03 ? 3 : d < 0.08 ? 2 : d < 0.15 ? 1 : 0; sc += p; msg = ['MESSY!', 'OK!', 'YUM!', 'PERFECT!'][p]; sfx(p ? 'ding' : 'squeak'); mt = 0.9; };
  return loop(cv, (dt) => { if (holding) lvl = Math.min(1, lvl + dt * 0.5); if (mt > 0) { mt -= dt; if (mt <= 0) { mt = 0; next(); } }
    bg(g, '#fdf2f8', '#fbcfe8'); const cx = W / 2; g.fillStyle = '#ffffff'; rr(g, cx - 40, 20, 80, 46, 12); g.fill(); label(g, '🧁', cx, 44, 26); if (holding) { g.fillStyle = COL[n % 5]; g.fillRect(cx - 7, 66, 14, 120); }
    // bone-shaped tart: frosting fills from the bottom
    const top = 190, bot = 340; g.save(); g.beginPath(); g.roundRect(cx - 130, top + 30, 260, bot - top - 60, 30); [[-130, top + 30], [130, top + 30], [-130, bot - 30], [130, bot - 30]].forEach(([dx, dy]) => { g.moveTo(cx + dx + 38, dy); g.arc(cx + dx, dy, 38, 0, 7); }); g.fillStyle = '#d9a066'; g.fill(); g.clip();
    const ly = bot + 10 - (bot - top + 20) * lvl; g.fillStyle = COL[n % 5]; g.fillRect(0, ly, W, H); g.restore();
    const ln = bot + 10 - (bot - top + 20) * line; g.strokeStyle = '#be185d'; g.setLineDash([10, 8]); g.lineWidth = 4; g.beginPath(); g.moveTo(cx - 190, ln); g.lineTo(cx + 190, ln); g.stroke(); g.setLineDash([]);
    if (mt > 0) label(g, msg, cx, 120, 34, '#be185d'); st.textContent = `Treat ${Math.min(n + 1, 5)}/5 · ${sc} pts`; }); });
// ---------------- SHELL MATCH: memory pairs ----------------
const shells = setup('🐚 SHELL MATCH', 'Flip two cards at a time and find all 6 pairs of shells!', ({ cv, g, pt, st, end }) => {
  const E = ['🐚', '🐢', '🦀', '⭐', '🐠', '🦐']; const cards = E.concat(E).map((e) => ({ e, r: Math.random(), up: false, done: false })).sort((a, b) => a.r - b.r); let open = [], wait = 0, T = 0, moves = 0, over = false;
  const cxy = (i) => [70 + (i % 4) * 113, 75 + ((i / 4) | 0) * 125];
  cv.onpointerdown = (e) => { if (over || wait > 0) return; e.preventDefault(); const [x, y] = pt(e); const i = cards.findIndex((c, k) => { const [a, b] = cxy(k); return Math.abs(x - a) < 50 && Math.abs(y - b) < 56; }); const c = cards[i]; if (!c || c.up || c.done) return; c.up = true; sfx('click'); open.push(c);
    if (open.length === 2) { moves++; if (open[0].e === open[1].e) { open.forEach((q) => q.done = true); open = []; sfx('ding'); if (cards.every((q) => q.done)) { over = true; const sc = Math.max(1, 20 - Math.max(0, moves - 6) - Math.floor(T / 10)); end('shells', sc, '🐚 All pairs found!', `Matched in ${moves} tries and ${T.toFixed(0)} s. Torty slowly but proudly approves.`); } } else wait = 0.8; } };
  return loop(cv, (dt) => { if (!over) T += dt; if (wait > 0) { wait -= dt; if (wait <= 0) { open.forEach((q) => q.up = false); open = []; } }
    bg(g, '#ccfbf1', '#5eead4'); cards.forEach((c, k) => { const [a, b] = cxy(k); g.fillStyle = c.done ? '#fef3c7' : c.up ? '#ffffff' : '#0f766e'; rr(g, a - 48, b - 54, 96, 108, 14); g.fill(); if (c.up || c.done) emoji(g, c.e, a, b, 48); else label(g, '?', a, b, 40, '#99f6e4'); });
    st.textContent = `Tries ${moves} · ${T.toFixed(0)} s`; }); });
// ---------------- WIRE IT UP: repeat the light pattern (Ratita gadget testing) ----------------
const wires = setup('🔌 WIRE IT UP', 'Watch the lights, then tap the wires in the same order. Luna is timing you!', ({ cv, g, pt, st, end }) => {
  const C = ['#ef4444', '#3ff0ff', '#ffd23f', '#4ade80'], seq = [], my = []; let ph = 'show', tm = 0.8, si = 0, lit = -1, litT = 0, over = false, msg = 'WATCH…';
  const pads = [[130, 130], [350, 130], [130, 290], [350, 290]]; const nextRound = () => { seq.push((Math.random() * 4) | 0); my.length = 0; ph = 'show'; tm = 0.7; si = 0; msg = 'WATCH…'; }; nextRound();
  cv.onpointerdown = (e) => { if (over || ph !== 'input') return; e.preventDefault(); const [x, y] = pt(e); const k = pads.findIndex(([a, b]) => Math.abs(x - a) < 100 && Math.abs(y - b) < 70); if (k < 0) return; lit = k; litT = 0.25; my.push(k); sfx('tune');
    if (seq[my.length - 1] !== k) { over = true; sfx('deny'); end('wires', seq.length - 1, '🔌 Zap! (a tiny, friendly zap)', `You wired ${seq.length - 1} gadgets in a row. Luna says that's "suspiciously good for a pilot".`); return; }
    if (my.length === seq.length) { sfx('ding'); msg = 'NICE!'; ph = 'pause'; tm = 0.9; } };
  return loop(cv, (dt) => { if (litT > 0) { litT -= dt; if (litT <= 0) lit = -1; } tm -= dt;
    if (ph === 'show' && tm <= 0) { if (si < seq.length) { lit = seq[si++]; litT = 0.42; sfx('tune'); tm = 0.62; } else { ph = 'input'; msg = 'YOUR TURN'; } }
    else if (ph === 'pause' && tm <= 0 && !over) nextRound();
    bg(g, '#1f2937', '#111827'); pads.forEach(([a, b], k) => { g.fillStyle = C[k]; g.globalAlpha = lit === k ? 1 : 0.35; rr(g, a - 95, b - 65, 190, 130, 22); g.fill(); g.globalAlpha = 1; });
    label(g, msg, W / 2, 210, 22, '#fff'); st.textContent = `Gadget ${seq.length} · ${ph === 'input' ? my.length + '/' + seq.length : 'watch'}`; }); });
// ---------------- GIFT WRAP RUSH: tap the paper colour each toy asks for ----------------
const wrap = setup('🎁 GIFT WRAP RUSH', 'Tap the wrapping paper that matches the bow on the toy at the front of the belt!', ({ cv, g, pt, st, end }) => {
  const P = [['#ef4444', 'Red'], ['#22c55e', 'Green'], ['#60a5fa', 'Blue'], ['#facc15', 'Gold']], TOY = ['🧸', '🚂', '🪀', '🎈', '🦆', '🪁', '🎨', '⚽']; let t = 40, sc = 0, items = [], spawn = 0, over = false, fx = [];
  cv.onpointerdown = (e) => { if (over) return; e.preventDefault(); const [x, y] = pt(e); if (y < 290) return; const k = Math.floor(x / (W / 4)); const f = items.filter((i) => !i.done).sort((a, b) => b.x - a.x)[0]; if (!f) return; f.done = true; f.got = k;
    if (f.k === k) { sc++; sfx('ding'); fx.push({ x: f.x, y: 140, t: '+1 🎁', c: '#16a34a', l: 0.8 }); } else { sfx('deny'); fx.push({ x: f.x, y: 140, t: 'oops', c: '#dc2626', l: 0.8 }); } };
  return loop(cv, (dt) => { if (!over) { t -= dt; spawn -= dt; if (spawn <= 0) { spawn = Math.max(0.8, 1.6 - (40 - t) * 0.02); items.push({ x: -40, k: (Math.random() * 4) | 0, toy: TOY[(Math.random() * TOY.length) | 0], done: false }); } const sp = 90 + (40 - t) * 2;
      items.forEach((i) => { if (!i.done) { i.x += sp * dt; if (i.x > W + 30) { i.done = true; i.got = -1; sfx('squeak'); } } else i.y = (i.y || 180) - dt * 160; }); items = items.filter((i) => !(i.done && (i.y || 180) < -40)); if (t <= 0) { over = true; end('wrap', sc, '🎁 Wrapped and ready!', `${sc} toys wrapped. Tinsel says every pet in the valley will get one. Even Pi-rat (he asked for a parrot).`); } }
    bg(g, '#fef2f2', '#fecaca'); g.fillStyle = '#7c2d12'; rr(g, 0, 200, W, 30, 8); g.fill(); g.fillStyle = '#9a3412'; for (let x = -((performance.now() / 6) % 30); x < W; x += 30) g.fillRect(x, 204, 14, 22);
    items.forEach((i) => { const y = i.y || 170; if (i.done && i.got >= 0) { g.fillStyle = P[i.got][0]; rr(g, i.x - 26, y - 26, 52, 52, 8); g.fill(); emoji(g, '🎀', i.x, y - 26, 26); } else { emoji(g, i.toy, i.x, y, 44); g.fillStyle = P[i.k][0]; g.beginPath(); g.arc(i.x + 20, y - 24, 11, 0, 7); g.fill(); } });
    P.forEach(([col, n], k) => { const x = k * W / 4; g.fillStyle = col; rr(g, x + 8, 292, W / 4 - 16, 100, 16); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.moveTo(x + W / 8, 296); g.lineTo(x + W / 8, 388); g.stroke(); label(g, n, x + W / 8, 372, 15); });
    pops(g, fx, dt); st.textContent = `Wrapped ${sc} · ${Math.ceil(Math.max(0, t))} s`; }); });
// ---------------- MARSHMALLOW CATCH: slide the mug, catch marshmallows, dodge snowballs ----------------
const marsh = setup('☕ MARSHMALLOW CATCH', 'Drag the mug left and right. Catch marshmallows, dodge the snowballs ❄️!', ({ cv, g, pt, st, end }) => {
  let mx = W / 2, t = 30, sc = 0, drops = [], spawn = 0, over = false, fx = []; const mv = (e) => { e.preventDefault(); const [x] = pt(e); mx = Math.max(40, Math.min(W - 40, x)); }; cv.onpointerdown = mv; cv.onpointermove = (e) => { if (e.buttons || e.pointerType === 'touch') mv(e); };
  return loop(cv, (dt) => { if (!over) { t -= dt; spawn -= dt; if (spawn <= 0) { spawn = Math.max(0.28, 0.7 - (30 - t) * 0.012); drops.push({ x: 30 + Math.random() * (W - 60), y: -20, v: 120 + Math.random() * 80 + (30 - t) * 4, bad: Math.random() < 0.22 }); }
      drops.forEach((d) => { d.y += d.v * dt; if (!d.hit && d.y > 318 && d.y < 350 && Math.abs(d.x - mx) < 44) { d.hit = true; if (d.bad) { sc = Math.max(0, sc - 2); sfx('splat'); fx.push({ x: mx, y: 290, t: 'brrr! -2', c: '#2563eb', l: 0.8 }); } else { sc++; sfx('crumb'); fx.push({ x: mx, y: 290, t: '+1', c: '#16a34a', l: 0.6 }); } } }); drops = drops.filter((d) => !d.hit && d.y < H + 20);
      if (t <= 0) { over = true; end('marsh', sc, '☕ Cocoa complete!', `${sc} marshmallows caught. Marsh says your mug is now "more marshmallow than cocoa", which is correct.`); } }
    bg(g, '#7c2d12', '#451a03'); for (let i = 0; i < 20; i++) { g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc((i * 97) % W, (i * 53 + performance.now() / 30) % H, 2, 0, 7); g.fill(); }
    drops.forEach((d) => { if (d.bad) emoji(g, '❄️', d.x, d.y, 30); else { g.fillStyle = '#fff7ed'; rr(g, d.x - 12, d.y - 10, 24, 20, 7); g.fill(); } });
    g.fillStyle = '#ef4444'; rr(g, mx - 42, 320, 84, 66, 14); g.fill(); g.strokeStyle = '#ef4444'; g.lineWidth = 9; g.beginPath(); g.arc(mx + 46, 350, 16, -1.4, 1.4); g.stroke(); g.fillStyle = '#92400e'; rr(g, mx - 36, 326, 72, 12, 6); g.fill();
    pops(g, fx, dt); st.textContent = `Marshmallows ${sc} · ${Math.ceil(Math.max(0, t))} s`; }); });
export const GAMES = { tickets, tune, skyace, forms, frost, shells, wires, wrap, marsh };
