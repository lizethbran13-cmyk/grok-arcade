// Themed quiz mini-games: every lesson topic gets its own. Desert = Torty's Shade Dash (right answer: Torty crawls into the shade and a
// flower blooms; wrong: sunburn, lose a 💧). Lab = Beaker Blast (right: the mix launches a rocket; wrong: GOO EXPLOSION, lose a 🧪).
// 3 lives. 15 s per question (timeout counts as wrong). Pi-rat drawn in 2D uses her taupe hood #6b5e52.
import { $, esc } from './util.js';
const PI = Math.PI;
function shuffle(a, r = Math.random) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function runQuiz(trip, opts) { // opts: { sfx, done(res) }
  const cv = $('qzCv'), g = cv.getContext('2d'), W = cv.width, H = cv.height; const Q = trip.quiz.map(([q, a]) => { const order = shuffle([0, 1, 2]); return { q, ans: order.map((k) => a[k]), right: order.indexOf(0) }; });
  const st = { i: 0, lives: 3, score: 0, right: 0, t: 15, anim: null, at: 0, pick: -1, over: false, fx: [] }; let raf = 0, last = performance.now();
  $('qzTitle').textContent = `${trip.icon} ${trip.game.name}`; $('qzUI').classList.add('on');
  function ask() { const q = Q[st.i]; st.t = 15; st.pick = -1; st.anim = null; $('qzQ').textContent = `Q${st.i + 1}/${Q.length}: ${q.q}`;
    $('qzA').innerHTML = q.ans.map((a, k) => `<button data-k="${k}" class="qa q${k}">${['🅰', '🅱', '🅲'][k]} ${esc(a)}</button>`).join(''); $('qzA').querySelectorAll('button').forEach((b) => b.onclick = () => choose(+b.dataset.k)); hudLine(); }
  function hudLine() { $('qzS').textContent = `${trip.game.life.repeat(st.lives)}${'▫️'.repeat(3 - st.lives)} · ⭐ ${st.score}`; }
  function choose(k) { if (st.anim || st.over) return; const q = Q[st.i]; st.pick = k; const ok = k === q.right; st.anim = ok ? 'good' : 'bad'; st.at = 0; $('qzA').querySelectorAll('button').forEach((b, j) => { b.disabled = true; if (j === q.right) b.classList.add('right'); else if (j === k) b.classList.add('wrong'); });
    if (ok) { st.score += 3 + Math.ceil(st.t / 5); st.right++; opts.sfx && opts.sfx('check'); $('qzMsg').textContent = trip.game.good; } else { st.lives--; opts.sfx && opts.sfx(trip.id === 'lab' ? 'splat' : 'hurt'); $('qzMsg').textContent = (k < 0 ? '⏰ Too slow! ' : '') + trip.game.bad + ` (Answer: ${q.ans[q.right]})`; } hudLine(); }
  function next() { $('qzMsg').textContent = ''; if (st.lives <= 0) return end(false); st.i++; if (st.i >= Q.length) return end(true); ask(); }
  function end(pass) { st.over = true; cancelAnimationFrame(raf); $('qzUI').classList.remove('on'); opts.done({ pass, score: st.score, right: st.right, total: Q.length }); }
  $('qzQuit').onclick = () => { if (st.over) return; st.lives = 0; end(false); };
  // ---------- drawing ----------
  function desert(t) { const q = Q[st.i]; const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, st.anim === 'bad' ? '#fb923c' : '#60a5fa'); sky.addColorStop(1, '#fde68a'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.fillStyle = st.anim === 'bad' ? '#ef4444' : '#fde047'; g.beginPath(); g.arc(W * 0.85, H * 0.15, 26 + (st.anim === 'bad' ? Math.sin(t * 20) * 6 : 0), 0, 7); g.fill();
    g.fillStyle = '#e6c690'; g.fillRect(0, H * 0.55, W, H * 0.45); g.fillStyle = '#c0703f'; g.beginPath(); g.moveTo(0, H * 0.55); g.lineTo(W * 0.15, H * 0.4); g.lineTo(W * 0.3, H * 0.55); g.fill();
    const lanes = [W * 0.2, W * 0.5, W * 0.8]; lanes.forEach((x, k) => { // three shade spots: cactus, rock, burrow
      g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x, H * 0.66, 42, 12, 0, 0, 7); g.fill();
      if (k === 0) { g.fillStyle = '#3f7d3a'; g.fillRect(x - 8, H * 0.38, 16, H * 0.28); g.fillRect(x - 26, H * 0.46, 12, 24); g.fillRect(x + 14, H * 0.43, 12, 22); } else if (k === 1) { g.fillStyle = '#a0623a'; g.beginPath(); g.ellipse(x, H * 0.62, 38, 24, 0, PI, 0); g.fill(); } else { g.fillStyle = '#c9a26b'; g.beginPath(); g.ellipse(x, H * 0.66, 40, 22, 0, PI, 0); g.fill(); g.fillStyle = '#2a1a10'; g.beginPath(); g.ellipse(x, H * 0.66, 18, 12, 0, PI, 0); g.fill(); }
      g.fillStyle = '#1f2937'; g.font = '900 22px system-ui'; g.textAlign = 'center'; g.fillText(['🅰', '🅱', '🅲'][k], x, H * 0.78);
      if (st.anim === 'good' && k === q.right) for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2, rr = Math.min(1, st.at * 2) * 22; g.fillStyle = '#f472b6'; g.beginPath(); g.arc(x + Math.cos(a) * rr, H * 0.5 + Math.sin(a) * rr * 0.6, 7, 0, 7); g.fill(); } });
    // Torty (desert tortoise) crawling to the picked spot
    const tx = st.pick < 0 ? W * 0.5 : W * 0.5 + (lanes[st.pick] - W * 0.5) * Math.min(1, st.at * 1.4), ty = H * 0.88 - (st.pick < 0 ? 0 : Math.min(1, st.at * 1.4) * H * 0.2);
    g.fillStyle = '#a8956a'; g.beginPath(); g.ellipse(tx + 30, ty - 4, 12, 9, 0, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(tx + 34, ty - 7, 2, 0, 7); g.fill();
    g.fillStyle = '#a8956a'; [-18, 16].forEach((lx) => { g.fillRect(tx + lx, ty + 4, 8, 8 + Math.sin(t * 8 + lx) * 2); });
    g.fillStyle = '#8a6a3b'; g.beginPath(); g.ellipse(tx, ty - 6, 30, 18, 0, PI, 0); g.fill(); g.fillStyle = '#5c4424'; for (let i = -1; i <= 1; i++) { g.beginPath(); g.arc(tx + i * 12, ty - 14, 5, 0, 7); g.fill(); }
    if (st.anim === 'bad') { g.fillStyle = 'rgba(239,68,68,' + (0.25 + Math.sin(t * 16) * 0.1) + ')'; g.fillRect(0, 0, W, H); g.font = '900 30px system-ui'; g.fillStyle = '#7f1d1d'; g.textAlign = 'center'; g.fillText('☀️ SUNBURN!', W / 2, H * 0.3); }
    if (st.anim === 'good') { g.font = '900 30px system-ui'; g.fillStyle = '#166534'; g.textAlign = 'center'; g.fillText('🌸 SHADE!', W / 2, H * 0.3); } }
  function lab(t) { const q = Q[st.i]; g.fillStyle = '#e0f2fe'; g.fillRect(0, 0, W, H); g.fillStyle = '#1f2937'; g.fillRect(0, H * 0.7, W, H * 0.3); g.fillStyle = '#cbd5e1'; for (let x = 0; x < W; x += 40) g.fillRect(x, 0, 2, H * 0.7);
    const cols = ['#22c55e', '#3b82f6', '#f472b6'], lanes = [W * 0.2, W * 0.5, W * 0.8];
    lanes.forEach((x, k) => { const pour = st.pick === k && st.anim; const lift = pour ? Math.min(1, st.at * 2) : 0; const bx = x + (W * 0.5 - x) * lift * 0.6, by = H * 0.62 - lift * 40;
      g.save(); g.translate(bx, by); g.rotate(pour ? -lift * 0.9 * Math.sign(x - W * 0.5 || 1) : 0); g.fillStyle = 'rgba(255,255,255,.7)'; g.strokeStyle = '#334155'; g.lineWidth = 3; g.beginPath(); g.rect(-22, -50, 44, 56); g.fill(); g.stroke(); g.fillStyle = cols[k]; g.fillRect(-20, -22, 40, 26); g.restore();
      g.fillStyle = '#f8fafc'; g.font = '900 22px system-ui'; g.textAlign = 'center'; g.fillText(['🅰', '🅱', '🅲'][k], x, H * 0.82); });
    // big flask in the middle-top + rocket / goo
    const fx = W * 0.5, fy = H * 0.3; g.fillStyle = 'rgba(255,255,255,.75)'; g.strokeStyle = '#334155'; g.lineWidth = 3; g.beginPath(); g.moveTo(fx - 10, fy - 50); g.lineTo(fx - 10, fy - 15); g.lineTo(fx - 40, fy + 30); g.lineTo(fx + 40, fy + 30); g.lineTo(fx + 10, fy - 15); g.lineTo(fx + 10, fy - 50); g.closePath(); g.fill(); g.stroke();
    if (st.anim === 'good') { const up = Math.max(0, st.at - 0.4) * 260; g.fillStyle = '#f8fafc'; g.fillRect(fx - 9, fy - 90 - up, 18, 40); g.fillStyle = '#dc2626'; g.beginPath(); g.moveTo(fx - 9, fy - 90 - up); g.lineTo(fx, fy - 108 - up); g.lineTo(fx + 9, fy - 90 - up); g.fill(); g.fillStyle = '#f97316'; g.beginPath(); g.moveTo(fx - 7, fy - 50 - up); g.lineTo(fx, fy - 30 - up + Math.sin(t * 40) * 5); g.lineTo(fx + 7, fy - 50 - up); g.fill();
      g.font = '900 28px system-ui'; g.fillStyle = '#166534'; g.fillText('🚀 LIFT-OFF!', W / 2, H * 0.12 + 40); }
    if (st.anim === 'bad') { const r = Math.min(1, st.at * 2.2); g.fillStyle = 'rgba(34,197,94,.85)'; for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; g.beginPath(); g.arc(fx + Math.cos(a) * r * 120, fy + Math.sin(a) * r * 80, 16 + (i % 3) * 8, 0, 7); g.fill(); } g.font = '900 30px system-ui'; g.fillStyle = '#14532d'; g.fillText('💥 GOO EXPLOSION!', W / 2, H * 0.12); } }
  function frame(now) { raf = requestAnimationFrame(frame); const dt = Math.min(0.25, (now - last) / 1000); last = now; const t = now / 1000;
    if (!st.anim) { st.t -= dt; if (st.t <= 0) { choose(-1); } } else { st.at += dt; if (st.at > 1.9) { next(); if (st.over) return; } }
    $('qzBar').style.width = Math.max(0, st.t / 15 * 100) + '%'; (trip.id === 'lab' ? lab : desert)(t); }
  ask(); raf = requestAnimationFrame(frame);
}
