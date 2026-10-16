// Grok Ruffsources HQ - boot, app state, main loop.
import * as THREE from 'three';
import { E, initEngine, render, trackFps } from './engine.js?v=rs6';
import { initMats } from './mats.js?v=rs6';
import { initInput, clearEdges, edge } from './input.js?v=rs6';
import { initAudio, setSound, sfx } from './audio.js?v=rs6';
import { S, persist } from './save.js?v=rs6';
import { HUD } from './hud.js?v=rs6';
import { UI } from './ui.js?v=rs6';
import { closePanel } from './uikit.js?v=rs6';
import { Game, BONES } from './game.js?v=rs6';
import { $ } from './util.js?v=rs6';
import { loadFont } from './text3d.js?v=rs6';
const app = window.__pt = { state: 'boot', paused: true, game: null, ready: false, busy: false };
Game.BN = BONES.length;
function setLoad(p, t) { const b = $('loadBar'); if (b) b.style.width = p + '%'; if (t) $('loadTxt').textContent = t; }
async function boot() {
  setLoad(15, 'Fluffing Candy\'s doormat…');
  initEngine($('c'), 'high'); E.autoQ = true; E.renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); try { persist(); } catch (_) {} setTimeout(() => location.reload(), 300); });
  await loadFont(); initMats(); initInput(); setSound(S.opts.sound, S.opts.music);
  app.hud = new HUD(); app.ui = new UI(app);
  const unlock = () => { initAudio(); }; window.addEventListener('touchstart', unlock, { passive: true }); window.addEventListener('mousedown', unlock); window.addEventListener('keydown', unlock);
  { const pb = $('hPause'); let tT = 0; const hit = (e) => { e.preventDefault(); e.stopPropagation(); if (performance.now() - tT < 350) return; tT = performance.now(); sfx('click'); if (app.paused && app.state === 'play') app.resume(); else app.pause(); }; pb.addEventListener('touchstart', hit, { passive: false }); pb.addEventListener('click', hit); }
  await new Promise((r) => setTimeout(r, 30)); setLoad(45, 'Building Ruffsources HQ…'); await new Promise((r) => setTimeout(r, 30));
  app.game = new Game(app); setLoad(90, 'Stacking the paperwork…');
  try { E.renderer.compile(E.scene, E.camera); } catch (e) {}
  setLoad(100, 'Ready!'); app.state = 'title'; app.paused = true; showTouch(false); app.ui.title(); setTimeout(() => $('loading').classList.add('gone'), 250);
  last = performance.now(); requestAnimationFrame(frame); app.ready = true;
}
function showTouch(on) { $('touch').classList.toggle('hidden', !on); $('hud').classList.toggle('hidden', !on); }
app.play = () => { closePanel(); app.state = 'play'; app.paused = false; app.busy = false; showTouch(true); clearEdges(); S.stats.plays++; persist(); app.game.cam.snap = true; if (!S.seenHow) { app.paused = true; app.busy = true; app.ui.how(() => app.resume()); } };
app.resume = () => { closePanel(); app.paused = false; app.busy = false; clearEdges(); };
app.pause = () => { if (app.state !== 'play' || app.busy) return; app.paused = true; app.ui.pause(); };
app.toTitle = () => { app.state = 'title'; app.paused = true; app.busy = false; showTouch(false); app.ui.title(); };
let last = 0, titleT = 0;
function frame(now) {
  requestAnimationFrame(frame); const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; trackFps(dt, now);
  const g = app.game;
  if (g) {
    if (edge('pause') && app.state === 'play' && !app.busy) { if (app.paused) app.resume(); else app.pause(); }
    if (app.state === 'title' || app.preview) { titleT += dt; g.T += dt; const c = E.camera; g.setVis(); g.me.update(dt, { mx: 0, my: 0, jump: false }, g.world, 0);
      if (app.preview) { const m = g.me, a = m.yaw + Math.sin(titleT * 0.5) * 0.5; c.position.set(m.x + Math.sin(a) * 4.2, m.y + 1.6, m.z + Math.cos(a) * 4.2); c.lookAt(m.x, m.y + 1.0, m.z); }
      else { const a = titleT * 0.05; c.position.set(Math.sin(a) * 30, 13, 4 + Math.cos(a) * 30); c.lookAt(0, 2.5, -6); } g.render(dt); }
    else if (!app.paused) g.update(dt);
    else g.render(dt);
  }
  render(dt);
}
app.sim = (sec) => { const g = app.game; const n = Math.round(sec * 60); for (let i = 0; i < n; i++) g.update(1 / 60); };
window.__E = E; app.S = S; app.E = E;
boot().catch((e) => { console.error(e); $('loadTxt').textContent = 'Oops: ' + e.message; });
setInterval(() => { const b = document.getElementById('ratitaWip'); const h = b ? Math.ceil(b.getBoundingClientRect().bottom) + 2 : 0; const v = h ? h + 'px' : '0px'; if (document.documentElement.style.getPropertyValue('--wip') !== v) document.documentElement.style.setProperty('--wip', v); }, 500);
