// Grok North Pole Village - boot, app state, main loop.
import * as THREE from 'three';
import { E, initEngine, render, trackFps } from './engine.js?v=np5';
import { initMats } from './mats.js?v=np5';
import { initInput, clearEdges, edge, IN } from './input.js?v=np5';
import { initAudio, setSound, sfx } from './audio.js?v=np5';
import { S, persist } from './save.js?v=np5';
import { HUD } from './hud.js?v=np5';
import { UI, closePanel } from './ui.js?v=np5';
import { Net } from './net.js?v=np5';
import { Game } from './game.js?v=np5';
import { $ } from './util.js?v=np5';
import { loadFont } from './text3d.js?v=np5';
const app = window.__pt = window.__hq = { state: 'boot', paused: true, game: null, ready: false, busy: false, simSpeed: 1 };
function setLoad(p, t) { const b = $('loadBar'); if (b) b.style.width = p + '%'; if (t) $('loadTxt').textContent = t; }
async function boot() {
  setLoad(15, 'Fluffing the pillows…');
  initEngine($('c'), 'high'); E.autoQ = true;
  await loadFont(); initMats(); initInput(); setSound(S.opts.sound, S.opts.music);
  app.hud = new HUD(); app.net = new Net(app); app.ui = new UI(app);
  const unlock = () => { initAudio(); }; window.addEventListener('touchstart', unlock, { passive: true }); window.addEventListener('mousedown', unlock); window.addEventListener('keydown', unlock);
  { const pb = $('hPause'); let tT = 0; const hit = (e) => { e.preventDefault(); e.stopPropagation(); if (performance.now() - tT < 350) return; tT = performance.now(); sfx('click'); if (app.paused && app.state === 'play') app.resume(); else app.pause(); };
    pb.addEventListener('touchstart', hit, { passive: false }); pb.addEventListener('click', hit); }
  { const gb = $('hGoal'); gb.addEventListener('click', () => { if (app.state === 'play' && !app.busy) { app.paused = true; app.ui.journal(() => app.resume()); } }); }
  await new Promise((r) => setTimeout(r, 30)); setLoad(45, 'Building North Pole Village…');
  await new Promise((r) => setTimeout(r, 30));
  app.game = new Game(app, {}); setLoad(90, 'Wrapping presents…');
  // upload every static batch to the GPU once (tiny offscreen target), so each batch's CPU copy is freed right away: low, flat memory from the start
  { const wg = app.game.world.group, vis = wg.children.map((m) => [m, m.visible, m.frustumCulled]); wg.children.forEach((m) => { m.visible = true; m.frustumCulled = false; }); const R = E.renderer, rt = new THREE.WebGLRenderTarget(4, 4), sm = R.shadowMap.enabled; R.shadowMap.enabled = false; const prev = R.getRenderTarget(); R.setRenderTarget(rt); R.render(E.scene, E.camera); R.setRenderTarget(prev); R.shadowMap.enabled = sm; rt.dispose(); vis.forEach(([m, v, f]) => { m.visible = v; m.frustumCulled = f; }); }
  try { E.renderer.compile(E.scene, E.camera); } catch (e) {}
  setLoad(100, 'Ready!'); app.state = 'title'; app.paused = true; showTouch(false); app.ui.title(); setTimeout(() => $('loading').classList.add('gone'), 250);
  setTimeout(() => $('loading').classList.add('gone'), 200);
  last = performance.now(); requestAnimationFrame(frame); app.ready = true;
  const prm = window.GrokNet && GrokNet.params && GrokNet.params(); if (prm) app.net.fromParams(prm);
}
function showTouch(on) { $('touch').classList.toggle('hidden', !on); $('hud').classList.toggle('hidden', !on); }
app.play = () => { closePanel(); app.state = 'play'; app.paused = false; app.busy = false; showTouch(true); clearEdges(); S.stats.plays++; persist(); if (!S.seenHow) { app.paused = true; app.ui.how(() => app.resume()); } };
app.resume = () => { closePanel(); app.paused = false; app.busy = false; clearEdges(); };
app.pause = () => { if (app.state !== 'play') return; if (app.busy) return; app.paused = true; app.ui.pause(); };
app.toTitle = () => { app.state = 'title'; app.paused = true; app.busy = false; showTouch(false); app.ui.title(); };
let last = 0, titleT = 0;
function frame(now) {
  requestAnimationFrame(frame); let dt = Math.min(0.05, (now - last) / 1000); last = now; trackFps(dt, now); dt *= app.simSpeed;
  const g = app.game;
  if (g) {
    if (edge('pause') && app.state === 'play' && !app.busy) { if (app.paused) app.resume(); else app.pause(); }
    if (app.state === 'title' || app.preview) { titleT += dt; g.T += dt; g.setVis('out'); g.updateNPCs(dt); g.anim(dt); g.me.onGround = true; g.me.speed = 0; g.me.anim(dt); g.light(dt); const c = E.camera;
      if (app.preview) { const m = g.me, a = m.yaw + Math.sin(titleT * 0.5) * 0.5; c.position.set(m.x + Math.sin(a) * 4.2, m.y + 1.5, m.z + Math.cos(a) * 4.2); c.lookAt(m.x, m.y + 0.15, m.z); }
      else { const a = titleT * 0.06; c.position.set(Math.sin(a) * 22, 9.5, Math.cos(a) * 22); c.lookAt(0, 2.6, 0); } g.fx.update(dt); }
    else if (!app.paused || app.net.online) g.update(dt);
    else g.render(dt);
  }
  render(dt);
}
app.sim = (sec) => { const g = app.game; const n = Math.round(sec * 60); for (let i = 0; i < n; i++) g.update(1 / 60); };
window.__E = E;
// the arcade's WORK IN PROGRESS banner (preview builds only) sits top-left: push the HUD below it instead of under it
setInterval(() => { const b = document.getElementById('ratitaWip'); const h = b ? Math.ceil(b.getBoundingClientRect().bottom) + 2 : 0; const v = h ? h + 'px' : '0px'; if (document.documentElement.style.getPropertyValue('--wip') !== v) document.documentElement.style.setProperty('--wip', v); }, 500);
app.S = S; app.E = E; app.IN = IN;
boot().catch((e) => { console.error(e); $('loadTxt').textContent = 'Oops: ' + e.message; });
// WebGL context loss (iOS can drop the GPU context under memory pressure): save, show a friendly card, reload cleanly instead of a blank/looping tab
{ const cv = E.renderer && E.renderer.domElement; if (cv) { cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); try { persist(); } catch (_) {} if (document.getElementById('ctxLost')) return; const d = document.createElement('div'); d.id = 'ctxLost'; d.setAttribute('style', 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(20,10,0,.75);color:#fff;font:bold 18px system-ui;text-align:center;padding:24px'); d.innerHTML = '🎄 North Pole Village is napping like a sleepy elf.<br>Your progress is saved.<br><br><button style="font:bold 18px system-ui;padding:12px 22px;border-radius:14px;border:0;background:#ffb020">Wake it up</button>'; d.querySelector('button').onclick = () => location.reload(); document.body.appendChild(d); }, false); cv.addEventListener('webglcontextrestored', () => location.reload(), false); } }
