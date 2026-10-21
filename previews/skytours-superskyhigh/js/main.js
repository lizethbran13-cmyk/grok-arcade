// Grok Snowie Sky Tours - boot, app state, main loop.
import * as THREE from 'three';
import { E, initEngine, render, trackFps } from './engine.js?v=st10';
import { initMats } from './mats.js?v=st10';
import { initInput, clearEdges, edge } from './input.js?v=st10';
import { initAudio, setSound, sfx } from './audio.js?v=st10';
import { S, persist } from './save.js?v=st10';
import { HUD } from './hud.js?v=st10';
import { UI } from './ui.js?v=st10';
import { closePanel } from './uikit.js?v=st10';
import { Game } from './game.js?v=st10';
import { $ } from './util.js?v=st10';
import { loadFont } from './text3d.js?v=st10';
const app = window.__pt = { state: 'boot', paused: true, game: null, ready: false, busy: false };
function setLoad(p, t) { const b = $('loadBar'); if (b) b.style.width = p + '%'; if (t) $('loadTxt').textContent = t; }
async function boot() {
  setLoad(15, 'Fluffing Snowie\'s seat cushion…');
  initEngine($('c'), 'high'); E.autoQ = true; E.renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); try { persist(); } catch (_) {} setTimeout(() => location.reload(), 300); });
  await loadFont(); initMats(); initInput(); setSound(S.opts.sound, S.opts.music);
  app.hud = new HUD(); app.ui = new UI(app);
  const unlock = () => { initAudio(); }; window.addEventListener('touchstart', unlock, { passive: true }); window.addEventListener('mousedown', unlock); window.addEventListener('keydown', unlock);
  { const pb = $('hPause'); let tT = 0; const hit = (e) => { e.preventDefault(); e.stopPropagation(); if (performance.now() - tT < 350) return; tT = performance.now(); sfx('click'); if (app.paused && app.state === 'play') app.resume(); else app.pause(); }; pb.addEventListener('touchstart', hit, { passive: false }); pb.addEventListener('click', hit); }
  { const mb = $('hMap'); let tT = 0; const hit = (e) => { e.preventDefault(); e.stopPropagation(); if (performance.now() - tT < 350) return; tT = performance.now(); sfx('click'); if (app.state === 'play' && !app.busy) { app.paused = true; app.ui.map(); } }; mb.addEventListener('touchstart', hit, { passive: false }); mb.addEventListener('click', hit); }
  for (const [id, fn] of [['hTow', () => app.game.callTow()], ['hView', () => app.game.toggleView()]]) { const b = $(id); let tT = 0; const hit = (e) => { e.preventDefault(); e.stopPropagation(); if (performance.now() - tT < 350) return; tT = performance.now(); if (app.state === 'play' && !app.paused && !app.busy) fn(); }; b.addEventListener('touchstart', hit, { passive: false }); b.addEventListener('click', hit); }
  await new Promise((r) => setTimeout(r, 30)); setLoad(45, 'Building the valley…'); await new Promise((r) => setTimeout(r, 30));
  app.game = new Game(app); setLoad(90, 'Fuelling the copter…');
  try { E.renderer.compile(E.scene, E.camera); } catch (e) {}
  setLoad(100, 'Ready!'); app.state = 'title'; app.paused = true; showTouch(false); app.ui.title(); setTimeout(() => $('loading').classList.add('gone'), 250);
  last = performance.now(); requestAnimationFrame(frame); app.ready = true;
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
  render(dt);
}
app.sim = (sec) => { const g = app.game; const n = Math.round(sec * 60); for (let i = 0; i < n; i++) g.update(1 / 60); };
window.__E = E; app.S = S; app.E = E;
boot().catch((e) => { console.error(e); $('loadTxt').textContent = 'Oops: ' + e.message; });
setInterval(() => { const b = document.getElementById('ratitaWip'); const h = b ? Math.ceil(b.getBoundingClientRect().bottom) + 2 : 0; const v = h ? h + 'px' : '0px'; if (document.documentElement.style.getPropertyValue('--wip') !== v) document.documentElement.style.setProperty('--wip', v); }, 500);
