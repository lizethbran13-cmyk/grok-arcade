// Grok Lost Relics - boot, app state, main loop.
import * as THREE from 'three';
import { E, initEngine, render, trackFps } from './engine.js';
import { initMats } from './mats.js';
import { initInput, clearEdges, edge, IN } from './input.js';
import { initAudio, setSound, sfx } from './audio.js';
import { S, persist } from './save.js';
import { LEVELS, OUTFITS, HEADLINES, outfitUnlocked } from './data.js';
import { HUD } from './hud.js';
import { UI, closePanel } from './ui.js';
import { Net } from './net.js';
import { Game } from './game.js';
import { Player } from './player.js';
import { $ } from './util.js';
import { loadFont } from './text3d.js';
const app = window.__lr = { IN, state: 'boot', paused: true, game: null, ready: false, simSpeed: 1 };
function setLoad(p, t) { const b = $('loadBar'); if (b) b.style.width = p + '%'; if (t) $('loadTxt').textContent = t; }
async function boot() {
  setLoad(15, 'Dusting off the map…');
  initEngine($('c'), 'high'); E.autoQ = true;
  await loadFont(); initMats(); initInput(); setSound(S.opts.sound, S.opts.music);
  app.hud = new HUD(); app.net = new Net(app);
  const unlock = () => { initAudio(); }; window.addEventListener('touchstart', unlock, { passive: true }); window.addEventListener('mousedown', unlock); window.addEventListener('keydown', unlock);
  { const pb = $('hPause'); let tT = 0; const hit = (e) => { e.preventDefault(); e.stopPropagation(); if (performance.now() - tT < 350) return; tT = performance.now(); sfx('click'); if (app.paused && app.state === 'play') app.resume(); else app.pause(); };
    pb.addEventListener('touchstart', hit, { passive: false }); pb.addEventListener('click', hit); }
  await new Promise((r) => setTimeout(r, 30)); setLoad(55, 'Polishing the museum…');
  app.game = new Game(app, 'hub', {}); app.game.world.title = '🏛️ Grok Relic Museum'; setLoad(100, 'Ready!');
  app.state = 'title'; app.paused = true; showTouch(false); UI.title(app);
  setTimeout(() => $('loading').classList.add('gone'), 200);
  last = performance.now(); requestAnimationFrame(frame); app.ready = true;
  const prm = window.GrokNet && GrokNet.params && GrokNet.params(); if (prm) app.net.fromParams(prm);
}
function showTouch(on) { $('touch').classList.toggle('hidden', !on); $('hud').classList.toggle('hidden', !on); }
app.play = () => { closePanel(); app.state = 'play'; app.paused = false; showTouch(true); clearEdges(); app.game.hud.startLevel(app.game);
  const how = () => { if (!S.seenHow) { app.paused = true; UI.how(app, () => app.resume()); } else app.resume(); };
  if (!S.seenStory) { app.paused = true; UI.story(app, how); } else how(); };
app.resume = () => { closePanel(); app.paused = false; clearEdges(); };
app.pause = () => { if (app.state !== 'play') return; app.paused = true; UI.pause(app); };
app.toTitle = () => { app.state = 'title'; if (!app.game || app.game.levelId !== 'hub') app.loadLevel('hub', false, { title: true }); app.paused = true; showTouch(false); UI.title(app); };
app.refreshMe = () => { const g = app.game; if (!g) return; const old = g.me; const p = new Player({ hero: S.hero, outfit: S.outfit, name: S.name || 'You', local: true, pid: old.pid }); p.addTo(g.scene); p.place([old.x, old.y, old.z], old.yaw); p.cp = old.cp; p.cpYaw = old.cpYaw; old.removeFrom(g.scene); g.players.delete(old.pid); g.players.set(p.pid, p); g.me = p; g.hud.dirty = true; if (app.net.online) app.net.sendLook(); };
app.loadLevel = (id, broadcast, o = {}) => {
  const net = app.net, online = net.online, host = !online || net.room.isHost; const seed = o.seed || ((Math.random() * 1e9) | 0);
  if (online && host && broadcast !== false) net.room.broadcast({ t: 'load', level: id, seed });
  $('loading').classList.remove('gone'); const L = LEVELS.find((l) => l.id === id); setLoad(30, L ? `${L.icon} Driving to ${L.place}…` : '🏛️ Back to the museum…');
  setTimeout(() => { if (app.game) app.game.dispose(); app.game = null;
    const g = new Game(app, id, { online, host, seed, pid: online ? net.room.pid : 'me', slot: online ? (net.room.me() || {}).slot || 0 : 0 }); g.world.title = L ? `${L.icon} ${L.n}` : '🏛️ Grok Relic Museum';
    app.game = g; try { E.renderer.compile(E.scene, E.camera); } catch (e) {} g.hud.startLevel(g);
    if (o.title) { app.state = 'title'; app.paused = true; showTouch(false); } else { app.state = 'play'; app.paused = false; showTouch(true); closePanel(); }
    clearEdges(); setLoad(100); setTimeout(() => $('loading').classList.add('gone'), 120); S.stats.plays++; persist(); }, 60);
};
app.enterLevelDoor = (id) => { app.openKiosk('map'); };
app.openKiosk = (id, arg) => { app.paused = true; (UI[id] || UI.map)(app, arg); };
app.levelDone = (res) => { const L = LEVELS.find((l) => l.id === res.level); if (!L) return app.loadLevel('hub');
  const before = OUTFITS.filter((o) => outfitUnlocked(o, S)).map((o) => o.id); const first = !S.done[L.id] && res.relic;
  S.coins += res.coins; S.coinsEver = (S.coinsEver || 0) + res.coins; const u = (a, b) => [...new Set([...(a || []), ...b])]; S.treasures[L.id] = u(S.treasures[L.id], res.treasures); S.evidence[L.id] = u(S.evidence[L.id], res.evidence);
  if (res.relic) { S.done[L.id] = true; S.relics[L.relic] = true; if (!S.best[L.id] || res.time < S.best[L.id]) S.best[L.id] = res.time; } persist();
  const newOutfits = OUTFITS.filter((o) => outfitUnlocked(o, S) && !before.includes(o.id)); const headline = first ? HEADLINES.find((h) => h.after === L.id) : null;
  app.paused = true; UI.results(app, res, { newOutfits, headline }); };
// ------------------------------------------------ loop
let last = 0, titleT = 0;
function frame(now) {
  requestAnimationFrame(frame); let dt = Math.min(0.05, (now - last) / 1000); last = now; trackFps(dt, now); dt *= app.simSpeed;
  const g = app.game;
  if (g) {
    if (edge('pause') && app.state === 'play') { if (app.paused) app.resume(); else app.pause(); }
    if (app.state === 'title') { titleT += dt; g.T += dt; g.actors.render(dt); g.animPickups(dt); for (const a of g.world.anims) a(dt, g.T); g.me.anim(dt); const c = E.camera; const a = titleT * 0.07; c.position.set(Math.sin(a) * 12, 5.2, 4 + Math.cos(a) * 8); c.lookAt(0, 2.4, -6); g.render(dt); }
    else if (!app.paused || g.online) { g.update(dt); }
    else { g.render(dt); }
  }
  render(dt);
}
app.sim = (sec) => { const g = app.game; const n = Math.round(sec * 60); for (let i = 0; i < n; i++) g.update(1 / 60); };
app.S = S; app.E = E; app.IN = IN;
boot().catch((e) => { console.error(e); $('loadTxt').textContent = 'Oops: ' + e.message; });
