// North Pole Village remake: boot, phone profile, title, main loop.
import * as THREE from 'three';
import { E, initEngine, render, resize } from '../engine.js?v=np11';
import { initMats } from '../mats.js?v=np11';
import { initInput, clearEdges, edge, IN } from '../input.js?v=np11';
import { initAudio, setSound, sfx } from '../audio.js?v=np11';
import { S, persist } from '../save.js?v=np11';
import { Game2 } from './game2.js';
import { panel, closePanel } from './panel.js';
const $ = (id) => document.getElementById(id);
const app = window.__pt = { state: 'boot', paused: true, game: null, ready: false, busy: false };
// phones (and small touch screens): no post-processing composer, capped pixel ratio, 1024 shadows. Keeps the whole game well under the iPhone tab limit.
const PHONE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (matchMedia('(pointer:coarse)').matches && Math.min(innerWidth, innerHeight) < 900) || /[?&]phone=1/.test(location.search);
app.phone = PHONE;
function setLoad(p, t) { const b = $('loadBar'); if (b) b.style.width = p + '%'; if (t) $('loadTxt').textContent = t; }
async function boot() {
  setLoad(15, 'Warming up the cocoa…');
  initEngine($('c'), PHONE ? 'low' : 'high'); E.autoQ = false;
  if (PHONE) { E.pixelRatio = E.basePR = Math.min(window.devicePixelRatio || 1, 1.5); E.renderer.setPixelRatio(E.pixelRatio); E.sun.shadow.mapSize.set(1024, 1024); resize(); }
  initMats(); initInput(); setSound(S.opts.sound, S.opts.music);
  const unlock = () => initAudio(); addEventListener('touchstart', unlock, { passive: true }); addEventListener('mousedown', unlock); addEventListener('keydown', unlock);
  { const pb = $('hPause'); let tT = 0; const hit = (e) => { e.preventDefault(); e.stopPropagation(); if (performance.now() - tT < 350) return; tT = performance.now(); sfx('click'); if (app.state === 'play' && !app.busy) app.pause(); }; pb.addEventListener('touchstart', hit, { passive: false }); pb.addEventListener('click', hit); }
  const openFind = (e) => { e && e.stopPropagation(); if (app.state === 'play' && !app.busy && app.game) app.game.findPanel(); };
  $('hSanta').addEventListener('click', openFind); $('hGoal').addEventListener('click', openFind);
  await new Promise((r) => setTimeout(r, 30)); setLoad(40, 'Building North Pole Village…'); await new Promise((r) => setTimeout(r, 30));
  app.game = new Game2(app, { phone: PHONE }); setLoad(92, 'Hanging the lights…');
  try { E.renderer.compile(E.scene, E.camera); } catch (e) {}
  setLoad(100, 'Ready!'); app.state = 'title'; showTouch(false); title(); setTimeout(() => $('loading').classList.add('gone'), 250);
  last = performance.now(); requestAnimationFrame(frame); app.ready = true;
}
function showTouch(on) { $('touch').classList.toggle('hidden', !on); $('hud').classList.toggle('hidden', !on); }
function title() { const ui = $('ui'); ui.classList.add('open'); ui.innerHTML = `<div class="title"><div class="logo"><span class="l0">GROK</span><span class="l1">NORTH POLE</span><span class="l2">VILLAGE</span></div>
  <p class="tag">The real North Pole Village: Main Street, Kringle Park, Santa’s Workshop, Kringle Ranch, the Claus home, and the Hall of Records cave on Polar Bear Mountain.</p>
  <div class="tBtns"><button class="go" id="tPlay">▶ VISIT THE NORTH POLE</button><button class="mbtn2" id="tSnd">🔊 SOUND: ${S.opts.sound ? 'ON' : 'OFF'}</button></div><p class="foot">Remake preview · find Santa, ride the Sleigh Bus, explore every building</p></div>`;
  ui.querySelector('#tPlay').onclick = () => { sfx('click'); app.play(); }; ui.querySelector('#tSnd').onclick = () => { S.opts.sound = !S.opts.sound; S.opts.music = S.opts.sound; persist(); setSound(S.opts.sound, S.opts.music); title(); }; }
app.play = () => { closePanel(); app.state = 'play'; app.paused = false; app.busy = false; showTouch(true); clearEdges(); S.stats.plays = (S.stats.plays | 0) + 1; persist(); if (!S.flags.np2how) { S.flags.np2how = 1; persist(); setTimeout(() => app.game.toastMsg('🎅 Santa is somewhere in the village. Tap the 🎅 chip to find him!'), 900); setTimeout(() => app.game.toastMsg('🚪 Walk into any door to go inside.'), 4200); } };
app.resume = () => { closePanel(); app.paused = false; app.busy = false; clearEdges(); };
app.pause = () => { if (app.state !== 'play' || app.busy) return; app.paused = true; app.busy = true; panel(`<h2>⏸ PAUSED</h2><button class="go" id="pR">▶ RESUME</button><button class="mbtn2" id="pF">🔎 Find Santa & friends</button><button class="mbtn2" id="pB">🚌 Sleigh Bus / teleport</button><button class="mbtn2" id="pS">🔊 Sound: ${S.opts.sound ? 'ON' : 'OFF'}</button>`, (c) => {
  c.querySelector('#pR').onclick = () => { sfx('click'); app.resume(); }; c.querySelector('#pF').onclick = () => { sfx('click'); app.paused = false; app.game.findPanel(); }; c.querySelector('#pB').onclick = () => { sfx('click'); app.paused = false; app.game.busPanel(); };
  c.querySelector('#pS').onclick = () => { S.opts.sound = !S.opts.sound; S.opts.music = S.opts.sound; persist(); setSound(S.opts.sound, S.opts.music); app.busy = false; app.pause(); }; }); };
let last = 0, titleT = 0;
function frame(now) { requestAnimationFrame(frame); const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; const g = app.game;
  if (g) { if (edge('pause') && app.state === 'play') { if (app.paused) app.resume(); else app.pause(); }
    if (app.state === 'title') { titleT += dt; g.idle(dt); const c = E.camera, a = titleT * 0.05; c.position.set(40 + Math.sin(a) * 34, 15, 40 + Math.cos(a) * 34); c.lookAt(40, 3, 30); }
    else if (!app.paused) g.update(dt); else g.idle(dt); }
  render(dt); }
app.sim = (sec) => { const g = app.game; const n = Math.round(sec * 60); for (let i = 0; i < n; i++) g.update(1 / 60); };
window.__E = E; app.S = S; app.E = E; app.IN = IN;
setInterval(() => { const b = document.getElementById('ratitaWip'); const h = b ? Math.ceil(b.getBoundingClientRect().bottom) + 2 : 0; const v = h ? h + 'px' : '0px'; if (document.documentElement.style.getPropertyValue('--wip') !== v) document.documentElement.style.setProperty('--wip', v); }, 500);
boot().catch((e) => { console.error(e); $('loadTxt').textContent = 'Oops: ' + e.message; });
{ const cv = E.renderer && E.renderer.domElement; if (cv) { cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); try { persist(); } catch (_) {} if ($('ctxLost')) return; const d = document.createElement('div'); d.id = 'ctxLost'; d.setAttribute('style', 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(20,10,0,.75);color:#fff;font:bold 18px system-ui;text-align:center;padding:24px'); d.innerHTML = '🎄 North Pole Village is napping.<br>Your progress is saved.<br><br><button style="font:bold 18px system-ui;padding:12px 22px;border-radius:14px;border:0;background:#ffb020">Wake it up</button>'; d.querySelector('button').onclick = () => location.reload(); document.body.appendChild(d); }, false); } }
