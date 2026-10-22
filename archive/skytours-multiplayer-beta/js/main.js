// Grok Snowie Sky Tours - boot, app state, main loop.
import * as THREE from 'three';
import { E, initEngine, render, trackFps } from './engine.js?v=st11mp';
import { initMats } from './mats.js?v=st11mp';
import { initInput, clearEdges, edge } from './input.js?v=st11mp';
import { initAudio, setSound, sfx } from './audio.js?v=st11mp';
import { S, persist } from './save.js?v=st11mp';
import { HUD } from './hud.js?v=st11mp';
import { UI } from './ui.js?v=st11mp';
import { closePanel } from './uikit.js?v=st11mp';
import { Game } from './game.js?v=st11mp';
import { $ } from './util.js?v=st11mp';
import { loadFont } from './text3d.js?v=st11mp';
import { MP, mpBadge } from './mp.js?v=st11mp';
import { buildPlane } from './planes.js?v=st11mp';
import { toast } from './uikit.js?v=st11mp';
const app = window.__pt = { state: 'boot', paused: true, game: null, ready: false, busy: false };
function setLoad(p, t) { const b = $('loadBar'); if (b) b.style.width = p + '%'; if (t) $('loadTxt').textContent = t; }
async function boot() {
  setLoad(15, 'Fluffing Snowie\'s seat cushion…');
  initEngine($('c'), 'high'); E.autoQ = true; E.renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); try { persist(); } catch (_) {} setTimeout(() => location.reload(), 300); });
  await loadFont(); initMats(); initInput(); setSound(S.opts.sound, S.opts.music);
  app.hud = new HUD(); app.ui = new UI(app);
  app.mp = new MP(app, { game: 'skytours', title: 'FLY WITH FRIENDS', sub: 'Fly your own aircraft side by side, or hop in a friend\'s aircraft and ride along while they fly!', how: 'Walk up to a friend\'s parked aircraft and tap 🪑 Ride along. Tap 🚪 Hop out anytime: your own aircraft gets parked on the nearest pad. Coins, planes and postcards stay on your own phone.', defName: 'Pilot', save: S, persist, scene: E.scene,
    snap: () => { const g = app.game, m = g.me, c = g.cop; if (g.mode === 'walk') return { x: +m.x.toFixed(2), y: +m.y.toFixed(2), z: +m.z.toFixed(2), yaw: +m.yaw.toFixed(2), sp: +m.speed.toFixed(1), air: !m.onGround };
      if (g.mode === 'ride') { const p = g.ride && g.ride.p || c; return { x: p.x, y: p.y, z: p.z, yaw: 0, hide: 1, ride: g.ride && g.ride.pid }; }
      return { x: +c.x.toFixed(2), y: +c.y.toFixed(2), z: +c.z.toFixed(2), yaw: +c.yaw.toFixed(3), hide: 1, pl: c.id, pt: c.paint, pv: +c.pitchV.toFixed(3), rv: +c.rollV.toFixed(3), m: c.mode, hs: +Math.hypot(c.vx, c.vz).toFixed(1) }; },
    here: () => { const g = app.game; return g.mode === 'walk' && g.inB ? g.inB.id : 'out'; }, look: () => S.look,
    remoteHook: (r, s, dt, same) => { const e = r.ext, want = s.pl && same ? s.pl + ':' + s.pt : null;
      if (e.key !== want) { if (e.M) { E.scene.remove(e.M.root); e.M.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); e.M = null; } e.key = want;
        if (want) { e.M = buildPlane(s.pl, s.pt | 0, { hp: 100, display: true }); E.scene.add(e.M.root); e.M.root.add(r.tag); r.tag.position.set(0, 4.6 + (e.M.len || 6) * 0.08, 0); e.x = s.x; e.y = s.y; e.z = s.z; e.yaw = s.yaw; e.p = 0; e.r = 0; } else { r.rig.root.add(r.tag); r.tag.position.set(0, 2.25, 0); } }
      if (e.M) { const k = Math.min(1, dt * 10); if (Math.hypot(s.x - e.x, s.z - e.z) > 60) { e.x = s.x; e.y = s.y; e.z = s.z; } e.x += (s.x - e.x) * k; e.y += (s.y - e.y) * k; e.z += (s.z - e.z) * k; let d = s.yaw - e.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; e.yaw += d * k; e.p += ((s.pv || 0) - e.p) * k; e.r += ((s.rv || 0) - e.r) * k;
        e.M.root.position.set(e.x, e.y, e.z); e.M.root.rotation.set(e.p, e.yaw, e.r, 'YXZ'); const on = s.m !== 'ground' && s.m !== 'crash'; for (const q of e.M.spin) q.o.rotation[q.ax] += dt * (on ? 16 : 3) * Math.sign(q.k || 1); for (const q of e.M.discs) { q.material.opacity = on ? 0.16 : 0; q.visible = on; } } },
    remoteGone: (r) => { if (r.ext.M) E.scene.remove(r.ext.M.root); },
    play: () => { app.play(); const g = app.game, c = g.cop, P = g.PADS || window.__pads; if (app.mp.isHost || !P) return; const p0 = P[0]; if (c.onPad !== p0 || c.mode !== 'ground' || g.mode !== 'fly') return; const sl = Math.max(1, app.mp.slotOf(app.mp.room.pid)); const alt = P.filter((q) => q !== p0 && q.town === p0.town && !q.small); const pad = alt[(sl - 1) % Math.max(1, alt.length)]; if (pad) { c.x = pad.x; c.z = pad.z; c.y = pad.y; c.onPad = pad; g.cam.snap = true; toast(`🛩️ Your aircraft is parked on ${pad.name}, next to your friend's.`); } },
    onEvent: (e, who, pid) => { if (e.c === 'ride' && app.mp.room && e.to === app.mp.room.pid) { toast(`🪑 ${who} hopped in your aircraft! Give them a good tour.`); sfx('ding'); } } });
  const unlock = () => { initAudio(); }; window.addEventListener('touchstart', unlock, { passive: true }); window.addEventListener('mousedown', unlock); window.addEventListener('keydown', unlock);
  { const pb = $('hPause'); let tT = 0; const hit = (e) => { e.preventDefault(); e.stopPropagation(); if (performance.now() - tT < 350) return; tT = performance.now(); sfx('click'); if (app.paused && app.state === 'play') app.resume(); else app.pause(); }; pb.addEventListener('touchstart', hit, { passive: false }); pb.addEventListener('click', hit); }
  { const mb = $('hMap'); let tT = 0; const hit = (e) => { e.preventDefault(); e.stopPropagation(); if (performance.now() - tT < 350) return; tT = performance.now(); sfx('click'); if (app.state === 'play' && !app.busy) { app.paused = true; app.ui.map(); } }; mb.addEventListener('touchstart', hit, { passive: false }); mb.addEventListener('click', hit); }
  for (const [id, fn] of [['hTow', () => app.game.callTow()], ['hView', () => app.game.toggleView()]]) { const b = $(id); let tT = 0; const hit = (e) => { e.preventDefault(); e.stopPropagation(); if (performance.now() - tT < 350) return; tT = performance.now(); if (app.state === 'play' && !app.paused && !app.busy) fn(); }; b.addEventListener('touchstart', hit, { passive: false }); b.addEventListener('click', hit); }
  await new Promise((r) => setTimeout(r, 30)); setLoad(45, 'Building the valley…'); await new Promise((r) => setTimeout(r, 30));
  app.game = new Game(app); setLoad(90, 'Fuelling the copter…');
  try { E.renderer.compile(E.scene, E.camera); } catch (e) {}
  setLoad(100, 'Ready!'); app.state = 'title'; app.paused = true; showTouch(false); app.ui.title(); setTimeout(() => $('loading').classList.add('gone'), 250);
  last = performance.now(); requestAnimationFrame(frame); app.ready = true; { const prm = window.GrokNet && GrokNet.params && GrokNet.params(); if (prm) app.mp.fromParams(prm); }
}
function showTouch(on) { $('touch').classList.toggle('hidden', !on); $('hud').classList.toggle('hidden', !on); }
app.play = () => { closePanel(); app.state = 'play'; app.paused = false; app.busy = false; showTouch(true); clearEdges(); S.stats.plays++; persist(); app.game.cam.snap = true; app.game.cam.yaw = app.game.cop.yaw + Math.PI; if (!S.seenHow) { app.paused = true; app.busy = true; app.ui.how(() => app.resume()); } };
app.resume = () => { closePanel(); app.paused = false; app.busy = false; clearEdges(); };
app.pause = () => { if (app.state !== 'play' || app.busy) return; app.paused = true; app.ui.pause(); };
app.toTitle = () => { app.state = 'title'; app.paused = true; app.busy = false; showTouch(false); app.ui.title(); };
let last = 0, titleT = 0;
function frame(now) {
  requestAnimationFrame(frame); const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; trackFps(dt, now);
  const g = app.game;
  if (g) {
    if (edge('pause') && app.state === 'play' && !app.busy) { if (app.paused) app.resume(); else app.pause(); }
    if (app.state === 'title' || app.preview) { titleT += dt; g.T += dt; const c = E.camera; g.setVis(); g.syncCopter(dt); g.fx.update(dt);
      const k = g.cop; if (app.preview) { const p = k.pilot.root, a = k.yaw + 0.9 + Math.sin(titleT * 0.5) * 0.3; c.position.set(k.x + Math.sin(a) * 6.5, k.y + 2.6, k.z + Math.cos(a) * 6.5); c.lookAt(k.x, k.y + 1.6, k.z); }
      else { const a = titleT * 0.06; c.position.set(k.x + Math.sin(a) * 26, k.y + 11, k.z + Math.cos(a) * 26); c.lookAt(k.x, k.y + 3, k.z); } g.render(dt); }
    else if (!app.paused) g.update(dt);
    else g.render(dt);
  }
  app.mp && (app.mp.tick(dt), mpBadge(app.mp), rideBtn());
  render(dt);
}
app.sim = (sec) => { const g = app.game; const n = Math.round(sec * 60); for (let i = 0; i < n; i++) g.update(1 / 60); };
window.__E = E; app.S = S; app.E = E;
boot().catch((e) => { console.error(e); $('loadTxt').textContent = 'Oops: ' + e.message; });
setInterval(() => { const b = document.getElementById('ratitaWip'); const h = b ? Math.ceil(b.getBoundingClientRect().bottom) + 2 : 0; const v = h ? h + 'px' : '0px'; if (document.documentElement.style.getPropertyValue('--wip') !== v) document.documentElement.style.setProperty('--wip', v); }, 500);

// 🪑 Ride along / 🚪 Hop out button (co-op)
function rideBtn() { let b = $('mpRide'); const g = app.game, mp = app.mp; if (!g) return; if (!b) { b = document.createElement('button'); b.id = 'mpRide'; b.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom) + 150px);z-index:25;font:800 16px system-ui;padding:12px 18px;border-radius:999px;border:3px solid #fff;background:#7c3aed;color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.35);display:none';
    const hit = (ev) => { ev.preventDefault(); ev.stopPropagation(); sfx('click'); if (g.mode === 'ride') g.endRide(false); else if (b._pid) g.startRide(b._pid); }; b.addEventListener('touchstart', hit, { passive: false }); b.addEventListener('click', hit); document.body.appendChild(b); }
  let show = false; if (mp.online && app.state === 'play' && !app.busy && !app.paused) { if (g.mode === 'ride') { show = true; b.textContent = '🚪 Hop out'; }
    else if (g.mode === 'walk' && !g.inB) { let best = null, bd = 1e9; for (const [pid, r] of mp.remotes) { const s = r.s; if (!s || !s.pl || s.m !== 'ground' || !r.ext.M) continue; const d = Math.hypot(r.ext.x - g.me.x, r.ext.z - g.me.z); if (d < (r.ext.M.rad || 3) + 4 && d < bd && Math.abs(r.ext.y - g.me.y) < 4) { bd = d; best = pid; } }
      if (best) { show = true; b._pid = best; b.textContent = '🪑 Ride along with ' + (mp.names[best] || 'friend'); } } }
  b.style.display = show ? 'block' : 'none'; }
