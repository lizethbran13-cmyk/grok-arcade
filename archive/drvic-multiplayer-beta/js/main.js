// Grok Dr. Vic: The Lost Lab - boot, app state, main loop (Shadowlight engine on the Turbo core).
import { E, initEngine, render, trackFps } from './engine.js?v=vic3mp';
import { initMats } from './mats.js?v=vic3mp';
import { initInput, clearEdges, edge } from './input.js?v=vic3mp';
import { initAudio, setSound, sfx } from './audio.js?v=vic3mp';
import { S, persist } from './save.js?v=vic3mp';
import { UI, HUD } from './ui.js?v=vic3mp';
import { closePanel, talk } from './uikit.js?v=vic3mp';
import { Game } from './game.js?v=vic3mp';
import { loadFont } from './text3d.js?v=vic3mp';
import { MP, mpBadge } from './mp.js?v=vic3mp';
const PAL = [{ skin: 1, hair: 4, hairC: 1, shirt: 7, pants: 0 }, { skin: 3, hair: 1, hairC: 3, shirt: 1, pants: 1 }, { skin: 0, hair: 3, hairC: 4, shirt: 2, pants: 3 }];
const $ = (i) => document.getElementById(i);
const app = window.__vic = { state: 'boot', paused: true, game: null, ready: false, busy: false };
function setLoad(p, t) { const b = $('loadBar'); if (b) b.style.width = p + '%'; if (t) $('loadTxt').textContent = t; }
async function boot() { setLoad(15, 'Warming up the Shadowlight engine…');
  initEngine($('c'), 'high'); E.autoQ = true; E.renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); try { persist(); } catch (_) {} setTimeout(() => location.reload(), 300); });
  await loadFont(); initMats(); initInput(); setSound(S.opts.sound, S.opts.music); app.hud = new HUD(); app.ui = new UI(app);
  app.mp = new MP(app, { game: 'drvic', title: 'SOLVE IT WITH FRIENDS', sub: 'Explore the Lost Lab together! Clues one of you finds go on everyone\'s Case Board.', how: 'Friends show up as your lab crew with name tags. Anyone can find clues for the team. Your followers and save stay on your own phone.', defName: 'Vic', save: S, persist, scene: E.scene,
    snap: () => { const m = app.game.me; return { x: +m.x.toFixed(2), y: +m.y.toFixed(2), z: +m.z.toFixed(2), yaw: +m.yaw.toFixed(2), sp: +m.speed.toFixed(1), air: !m.onGround }; },
    here: () => (app.game.zone ? app.game.zone.id : ''), look: () => PAL[app.mp.room ? Math.max(0, app.mp.slotOf(app.mp.room.pid)) % 3 : 0],
    onEvent: (e, who) => { if (e.c === 'clue' && app.game) app.game.friendClue(e.id, who); } });
  const unlock = () => initAudio(); window.addEventListener('touchstart', unlock, { passive: true }); window.addEventListener('mousedown', unlock); window.addEventListener('keydown', unlock);
  { const pb = $('hPause'); let tT = 0; const hit = (e) => { e.preventDefault(); e.stopPropagation(); if (performance.now() - tT < 350) return; tT = performance.now(); sfx('click'); if (app.paused && app.state === 'play') app.resume(); else app.pause(); }; pb.addEventListener('touchstart', hit, { passive: false }); pb.addEventListener('click', hit); }
  setLoad(45, 'Sweeping goo off the floor…'); await new Promise((r) => setTimeout(r, 30)); app.game = new Game(app); app.game.load(S.zone || 'home'); setLoad(95, 'Flickering the lights…');
  setLoad(100, 'Ready!'); app.state = 'title'; showTouch(false); app.ui.title(); setTimeout(() => $('loading').classList.add('gone'), 250); last = performance.now(); requestAnimationFrame(frame); app.ready = true; const prm = window.GrokNet && GrokNet.params && GrokNet.params(); if (prm) app.mp.fromParams(prm); }
function showTouch(on) { $('touch').classList.toggle('hidden', !on); $('hud').classList.toggle('hidden', !on); }
app.play = () => { closePanel(); S.stats.plays++; const go = () => { app.state = 'play'; app.paused = false; app.busy = false; showTouch(true); clearEdges(); if (app.game.zone.id !== S.zone) app.game.load(S.zone); app.game.cam.snap = true; persist();
    if (S.zone === 'home' && !S.flags.gooTest && !S.flags.introTalk) { S.flags.introTalk = 1; app.talk([['Dr. Vic', 'Okay, Vic. Invention #47. Ratita Goo. It cleans up rat messes in one squirt. This is THE one.'], ['Dr. Vic', 'Walk over to the goo machine and test it! (Use the stick to move, drag to look around.)']]); } };
  if (!S.seenIntro) { S.seenIntro = true; app.game.load('home'); app.ui.story(go); } else go(); };
app.resume = () => { closePanel(); app.paused = false; app.busy = false; clearEdges(); };
app.pause = () => { if (app.state !== 'play' || app.busy) return; app.paused = true; app.ui.pause(); };
app.toTitle = () => { app.state = 'title'; app.paused = true; app.busy = false; showTouch(false); app.game.fpv && app.game.toggleFilm(false); app.ui.title(); };
app.talk = (lines, done) => talk(lines, done);
app.clue = (c, done) => app.ui.clue(c, done); app.shot = (a, f) => app.ui.shot(a, f); app.ending = (d) => app.ui.ending(d);
app.fade = (f) => { const el = $('fader'); el.classList.add('on'); app.busy = true; setTimeout(() => { try { f(); } finally { setTimeout(() => { el.classList.remove('on'); app.busy = false; }, 120); } }, 380); };
app.splat = () => { const el = $('splat'); el.innerHTML = Array.from({ length: 9 }, () => `<i style="left:${Math.random() * 90}%;top:${Math.random() * 85}%;width:${60 + Math.random() * 120}px;height:${50 + Math.random() * 110}px"></i>`).join(''); el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); };
let last = 0, titleT = 0;
function frame(now) { requestAnimationFrame(frame); const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; trackFps(dt, now); const g = app.game;
  if (g && g.zone) { if (edge('pause') && app.state === 'play' && !app.busy) { if (app.paused) app.resume(); else app.pause(); }
    if (app.state === 'title') { titleT += dt; const c = E.camera, m = g.me, a = titleT * 0.15; c.position.set(m.x + Math.sin(a) * 5.5, m.y + 2.4, m.z + Math.cos(a) * 5.5); c.lookAt(m.x, m.y + 1.2, m.z); g.render(dt); }
    else if (!app.paused) g.update(dt); else g.render(dt); }
  app.mp && (app.mp.tick(dt), mpBadge(app.mp)); render(dt); }
app.sim = (sec) => { const n = Math.round(sec * 60); for (let i = 0; i < n; i++) app.game.update(1 / 60); };
app.tp = (x, z, yaw) => app.game.tp(x, z, yaw); app.go = (id, from) => app.game.load(id, from); app.S = S; app.E = E;
boot().catch((e) => { console.error(e); $('loadTxt').textContent = 'Oops: ' + e.message; });
// screenshot helper: Shadowlight surface detail + flashlight on/off (before/after comparison)
import { SL as _SL } from './shadowlight/index.js?v=vic3mp';
app.slCompare = async (on) => { const m = await import('./shadowlight/index.js?v=vic3mp'); m.useSurfaceSet(on ? (app.game.zone.Z.kind === 'lab' ? 'lab' : app.game.zone.Z.kind) : '__none'); if (!on) m.setAmt(0); _SL.flashOn = on; _SL.hero.visible = on; _SL.dust.visible = on; _SL.shafts.forEach((s) => s.visible = on); };
