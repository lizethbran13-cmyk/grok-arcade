// Grok Ratita Rescue - boot, app state, main loop.
import * as THREE from 'three';
import { E, initEngine, render, trackFps, setQuality } from './engine.js';
import { initMats } from './mats.js';
import { initInput, clearEdges, edge, IN } from './input.js';
import { initAudio, setSound, sfx, playMusic } from './audio.js';
import { S, persist } from './save.js';
import { LEVELS, OUTFITS } from './data.js';
import { HUD } from './hud.js';
import { UI, closePanel } from './ui.js';
import { Net } from './net.js';
import { Game } from './game.js';
import { Player } from './player.js';
import { $ } from './util.js';
import { loadFont } from './text3d.js';
import { isleOf, isPirateLevel, myDress } from './pirate.js';
import { PUI } from './pui.js';
import { otOf, otLevelDone } from './oldtown.js';
const app = window.__rr = { state: 'boot', paused: true, game: null, ready: false, simSpeed: 1 };
function setLoad(p, t) { const b = $('loadBar'); if (b) b.style.width = p + '%'; if (t) $('loadTxt').textContent = t; }
async function boot() {
  setLoad(15, 'Waking up the rats…');
  initEngine($('c'), S.opts.quality); E.autoQ = S.opts.autoQ;
  await loadFont(); initMats(); initInput(); setSound(S.opts.sound, S.opts.music);
  app.hud = new HUD(); app.net = new Net(app);
  const unlock = () => { initAudio(); }; window.addEventListener('touchstart', unlock, { passive: true }); window.addEventListener('mousedown', unlock); window.addEventListener('keydown', unlock);
  { const pb = $('hPause'); let tT = 0; const hit = (e) => { e.preventDefault(); e.stopPropagation(); if (performance.now() - tT < 350) return; tT = performance.now(); sfx('click'); if (app.paused && app.state === 'play') app.resume(); else app.pause(); };
    pb.addEventListener('touchstart', hit, { passive: false }); pb.addEventListener('click', hit); }
  await new Promise((r) => setTimeout(r, 30)); setLoad(55, 'Building Ratita HQ…');
  app.game = new Game(app, 'hq', {}); setLoad(100, 'Ready!');
  app.state = 'title'; app.paused = true; showTouch(false); UI.title(app);
  setTimeout(() => $('loading').classList.add('gone'), 200);
  last = performance.now(); requestAnimationFrame(frame); app.ready = true;
  const prm = window.GrokNet && GrokNet.params && GrokNet.params(); if (prm) app.net.fromParams(prm);
}
function showTouch(on) { $('touch').classList.toggle('hidden', !on); $('hud').classList.toggle('hidden', !on); }
app.play = () => { closePanel(); app.state = 'play'; app.paused = false; showTouch(true); clearEdges(); if (!S.seenHow) { app.paused = true; UI.how(app, () => app.resume()); } };
app.resume = () => { closePanel(); app.paused = false; clearEdges(); };
app.pause = () => { if (app.state !== 'play') return; app.paused = true; UI.pause(app); };
app.toTitle = () => { app.state = 'title'; if (!app.game || app.game.levelId !== 'hq') app.loadLevel('hq'); app.paused = true; showTouch(false); UI.title(app); };
app.refreshMe = () => { const g = app.game; if (!g) return; const old = g.me; const p = new Player({ rat: g.world.forceRat || S.rat, outfit: S.outfit, dress: myDress(), name: S.name || 'You', local: true, gadgets: old.gadgets, pid: old.pid }); p.addTo(g.scene); p.place([old.x, old.y, old.z], old.yaw); p.cp = old.cp; p.cpYaw = old.cpYaw; old.removeFrom(g.scene); g.players.delete(old.pid); g.players.set(p.pid, p); g.me = p; g.hud.dirty = true; if (app.net.online) app.net.sendLook(); };
app.loadLevel = (id, broadcast, o = {}) => {
  const net = app.net, online = net.online, host = !online || net.room.isHost; const seed = o.seed || ((Math.random() * 1e9) | 0);
  if (online && host && broadcast !== false) net.room.broadcast({ t: 'load', level: id, seed });
  $('loading').classList.remove('gone'); const L = LEVELS.find((l) => l.id === id), PI_ = isleOf(id), OT = otOf(id); setLoad(30, OT ? `${OT.icon} Creeping into ${OT.n}…` : L ? `${L.icon} Sneaking into the ${L.room}…` : PI_ ? `${PI_.icon} Rowing ashore to ${PI_.n}…` : id === 'pship' ? '⛵ Climbing aboard the Salty Cheddar…' : '🏠 Back to Ratita HQ…');
  setTimeout(() => { if (app.game) app.game.dispose(); app.game = null;
    const g = new Game(app, id, { online, host, seed, pid: online ? net.room.pid : 'me', slot: online ? (net.room.me() || {}).slot || 0 : 0 }); g.world.title = OT ? `${OT.icon} ${OT.n}` : L ? `${L.icon} ${L.room}` : PI_ ? `${PI_.icon} ${PI_.n}` : id === 'pship' ? '⛵ The Salty Cheddar' : '🏠 Ratita HQ';
    app.game = g; try { E.renderer.compile(E.scene, E.camera); } catch (e) {} g.hud.startLevel(g); app.state = 'play'; app.paused = false; showTouch(true); closePanel(); clearEdges(); setLoad(100); setTimeout(() => $('loading').classList.add('gone'), 120); S.stats.plays++; persist(); }, 60);
};
app.enterLevelDoor = (id) => { const L = LEVELS.find((l) => l.id === id); const i = LEVELS.indexOf(L); const un = i === 0 || S.done[LEVELS[i - 1].id] || S.cheat; if (!un) { sfx('deny'); app.hud.toast(`🔒 Beat the ${LEVELS[i - 1].room} first!`); return; }
  if (app.net.online && !app.net.room.isHost) { app.hud.toast('The host picks the room 🐀'); return; } app.paused = true; UI.confirmDoor(app, L); };
app.openKiosk = (id) => { app.paused = true; (UI[id] || UI.map)(app); };
app.levelDone = (res) => { if (isPirateLevel(res.level)) return PUI.levelDone(app, res); if (otOf(res.level)) return otLevelDone(app, res); const L = LEVELS.find((l) => l.id === res.level); const earned = res.crumbs + res.cheese * 10; S.cheese += earned; const before = Object.values(S.parts).reduce((a, l) => a + l.length, 0);
  const newGadget = !S.done[L.id]; S.done[L.id] = true; const u = (a, b) => [...new Set([...(a || []), ...b])]; S.parts[L.id] = u(S.parts[L.id], res.parts); S.babies[L.id] = u(S.babies[L.id], res.babies);
  if (!S.best[L.id] || res.time < S.best[L.id]) S.best[L.id] = res.time; persist(); const after = Object.values(S.parts).reduce((a, l) => a + l.length, 0);
  const newHats = OUTFITS.filter((o) => o.parts > before && o.parts <= after); app.paused = true; UI.results(app, res, { earned, newGadget, newHats }); };
// ------------------------------------------------ loop
let last = 0, titleT = 0;
function frame(now) {
  requestAnimationFrame(frame); let dt = Math.min(0.05, (now - last) / 1000); last = now; trackFps(dt, now); dt *= app.simSpeed;
  const g = app.game;
  if (g) {
    if (edge('pause') && app.state === 'play') { if (app.paused) app.resume(); else app.pause(); }
    if (app.state === 'title') { titleT += dt; g.T += dt; g.actors.render(dt); g.animPickups(dt); for (const a of g.world.animsList || g.world.anims) a(dt, g.T); g.me.anim(dt); const c = E.camera; const a = titleT * 0.08; c.position.set(Math.sin(a) * 13, 6.5, 2 + Math.cos(a) * 9); c.lookAt(0, 1.5, -4); g.fx.update(dt); }
    else if (!app.paused || g.online) { g.update(dt); }
    else { g.render(dt); }
  }
  render(dt);
}
// test hooks
app.sim = (sec) => { const g = app.game; const n = Math.round(sec * 60); for (let i = 0; i < n; i++) g.update(1 / 60); };
app.S = S; app.E = E; app.IN = IN;
boot().catch((e) => { console.error(e); $('loadTxt').textContent = 'Oops: ' + e.message; });
