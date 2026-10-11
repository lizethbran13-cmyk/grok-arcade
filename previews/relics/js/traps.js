// Booby traps runtime: every client animates them from the shared clock; hits only ever hurt your own explorer.
import * as THREE from 'three';
import { boulderGeo, makeDart } from './creatures.js';
import { toGroup } from './models.js';
import { sfx } from './audio.js';
import { inView } from './perf.js';
const PI = Math.PI;
export function initTraps(g) { const w = g.world;
  for (const b of w.boulders) { const m = toGroup(boulderGeo()); m.scale.setScalar(b.r); g.scene.add(m); g.extra.push(m); b.obj = m; resetBoulder(b); }
  g.dartPool = []; g.dartsLive = [];
  for (const d of w.darts) d.last = Math.floor(g.T / d.period + d.phase); }
function resetBoulder(b) { b.st = 'wait'; b.t = 0; b.i = 0; b.x = b.path[0][0]; b.y = b.path[0][1] + b.r; b.z = b.path[0][2]; if (b.obj) { b.obj.position.set(b.x, b.y, b.z); b.obj.visible = true; } }
export function triggerBoulder(g, b, remote) { if (b.st !== 'wait') return; b.st = 'rumble'; b.t = 0; sfx('rumble'); g.cam.shake = 0.35; g.toastMsg('🪨 RUMBLE... RUN!!'); if (!remote) g.net.online && (g.host ? g.net.bc({ t: 'trap', k: 'b', i: b.id }) : g.net.send({ t: 'trap', k: 'b', i: b.id })); }
export function dropPlank(g, p, remote) { if (p.st !== 'ok') { if (remote && p.st === 'ok') {} } if (p.st === 'ok') { p.st = 'shake'; p.t = 0; } if (!remote && g.net.online) (g.host ? g.net.bc({ t: 'trap', k: 'p', i: p.id }) : g.net.send({ t: 'trap', k: 'p', i: p.id })); }
export function stepTraps(dt, g) { const w = g.world, me = g.me, T = g.T; const alive = me.respawnT <= 0 && me.caughtT <= 0;
  // ---- boulders ----
  for (const b of w.boulders) { const tz = b.trig;
    if (b.st === 'wait') { if (alive && me.x > tz[0] && me.x < tz[2] && me.z > tz[1] && me.z < tz[3] && Math.abs(me.y - b.path[0][1]) < 6) triggerBoulder(g, b); }
    else if (b.st === 'rumble') { b.t += dt; b.obj.position.x = b.x + Math.sin(b.t * 60) * 0.06; if (b.t > b.delay) { b.st = 'roll'; b.t = 0; } }
    else if (b.st === 'roll') { const q = b.path[b.i + 1]; if (!q) { b.st = 'crash'; b.t = 0; sfx('boom'); g.fx.puff(b.x, b.y - b.r + 0.3, b.z, 22, 0xd6d3d1); g.cam.shake = 0.5; }
      else { const dx = q[0] - b.x, dy = q[1] + b.r - b.y, dz = q[2] - b.z, d = Math.hypot(dx, dy, dz); const st = b.sp * dt; if (d <= st) { b.x = q[0]; b.y = q[1] + b.r; b.z = q[2]; b.i++; } else { b.x += dx / d * st; b.y += dy / d * st; b.z += dz / d * st; }
        b.obj.position.set(b.x, b.y, b.z); const ax = new THREE.Vector3(dz, 0, -dx).normalize(); b.obj.rotateOnWorldAxis(ax, st / b.r); if (Math.random() < 0.4) g.fx.puff(b.x, b.y - b.r, b.z, 2, 0xd6d3d1); g.cam.shake = Math.max(g.cam.shake, Math.max(0, 0.25 - Math.hypot(me.x - b.x, me.z - b.z) * 0.012));
        if (alive && Math.hypot(me.x - b.x, me.z - b.z) < b.r + 0.3 && me.y < b.y + b.r && me.y + 1.7 > b.y - b.r) { if (me.hurt(g, { x: b.x - dx, z: b.z - dz }, 'boulder')) { me.knock({ x: b.x - dx / d, z: b.z - dz / d }, 11); g.toastMsg('SQUISH! (cartoon-style, you\u2019re fine) 🪨'); } } } }
    else if (b.st === 'crash') { b.t += dt; if (b.t > 0.4) b.obj.visible = false; if (b.t > 4) resetBoulder(b); } }
  // ---- spikes ----
  for (const s of w.spikeList) { const ph = ((T / s.period + s.phase) % 1 + 1) % 1, upAt = 1 - s.upFrac; let k = 0; if (ph > upAt) k = Math.min(1, (ph - upAt) / 0.06) * Math.min(1, (1 - ph) / 0.06); const warn = ph > upAt - 0.18 && ph <= upAt;
    s.obj.position.y = s.y + k * 0.75 + (warn ? 0.06 + Math.sin(T * 50) * 0.03 : 0); if (warn && !s.warned && inView((s.x0 + s.x1) / 2, s.y, (s.z0 + s.z1) / 2, 4) && Math.hypot(me.x - (s.x0 + s.x1) / 2, me.z - (s.z0 + s.z1) / 2) < 14) { s.warned = true; sfx('click'); } if (!warn) s.warned = false;
    if (alive && k > 0.5 && me.x > s.x0 && me.x < s.x1 && me.z > s.z0 && me.z < s.z1 && me.y < s.y + 0.7) { if (me.hurt(g, null, 'spike')) { me.vy = 11; me.onGround = false; g.toastMsg('OUCH, pointy! Watch the floor shake first 👀'); } } }
  // ---- darts ----
  for (const d of w.darts) { const n = Math.floor(T / d.period + d.phase); if (n !== d.last) { d.last = n; if (Math.hypot(me.x - d.x, me.z - d.z) < 40) { const along = [d.dir[1], -d.dir[0]]; for (let i = 0; i < d.n; i++) { const o = (d.n === 1 ? 0 : (i / (d.n - 1) - 0.5)) * d.span; fireDart(g, d.x + along[0] * o + d.dir[0] * 0.4, d.y + 1.2, d.z + along[1] * o + d.dir[1] * 0.4, d.dir, d.len); } if (Math.hypot(me.x - d.x, me.z - d.z) < 16) sfx('dart'); } } }
  for (const a of g.dartsLive) { a.t += dt; const st = 12 * dt; a.x += a.dir[0] * st; a.z += a.dir[1] * st; a.L -= st; a.m.position.set(a.x, a.y, a.z); if (a.L <= 0) a.dead = true;
    if (!a.dead && alive && Math.abs(me.x - a.x) < 0.45 && Math.abs(me.z - a.z) < 0.45 && a.y > me.y && a.y < me.y + 1.75) { a.dead = true; me.hurt(g, { x: a.x - a.dir[0], z: a.z - a.dir[1] }, 'dart'); }
    if (a.dead) { a.m.visible = false; g.dartPool.push(a.m); } }
  g.dartsLive = g.dartsLive.filter((a) => !a.dead);
  // ---- collapsing planks ----
  for (const p of w.planks) { if (p.st === 'shake') { p.t += dt; p.obj.position.y = p.y + Math.sin(p.t * 60) * 0.03; p.obj.rotation.z = Math.sin(p.t * 40) * 0.04; if (p.t > 0.55) { p.st = 'fall'; p.t = 0; p.s.off = true; sfx('creak'); } }
    else if (p.st === 'fall') { p.t += dt; p.obj.position.y = p.y - p.t * p.t * 9; p.obj.rotation.x = p.t * 2; if (p.t > 3.6) { p.st = 'ok'; p.s.off = false; p.obj.position.y = p.y; p.obj.rotation.set(0, 0, 0); g.fx.sparkle(p.x, p.y, p.z, 0xfde68a); } } }
  // ---- swinging logs ----
  for (const L of w.logs) { const a = Math.sin((T / L.period + L.phase) * PI * 2) * 1.05; L.a = a; L.obj.rotation.x = a; const off = -L.len * Math.sin(a), ly = L.y - (L.len + 0.2) * Math.cos(a); const lx = L.axis === 'x' ? L.x : L.x + off * 1, lz = L.axis === 'x' ? L.z + off : L.z;
    if (alive) { const along = L.axis === 'x' ? Math.abs(me.x - (lx - 0.03)) : Math.abs(me.z - lz), across = L.axis === 'x' ? Math.abs(me.z - lz) : Math.abs(me.x - lx); if (along < 1.6 && across < 0.85 && me.y < ly + 0.6 && me.y + 1.7 > ly - 0.6) { const v = Math.cos((T / L.period + L.phase) * PI * 2); if (me.hurt(g, null, 'log')) { const f = (v > 0 ? -1 : 1) * 10; if (L.axis === 'x') { me.vz = f; me.vx = 0; } else { me.vx = f; me.vz = 0; } me.vy = 7; g.toastMsg('BONK! Swinging log 🪵'); } } } }
  // ---- fire / steam jets ----
  for (const j of w.jets) { const ph = ((T / j.period + j.phase) % 1 + 1) % 1; const on = ph < 0.35, warn = ph > 0.85; j.obj.visible = on; if (on) { const s = Math.min(1, ph / 0.05) * (1 + Math.sin(T * 30) * 0.06); j.obj.scale.set(s, s, s); }
    if (warn && Math.random() < 0.3) g.fx.emit(j.x + (Math.random() - 0.5) * 0.3, j.y + 0.2, j.z + (Math.random() - 0.5) * 0.3, 0, 2, 0, 0.08, 0x9ca3af, 0.5, 0, 1);
    if (on && alive && Math.hypot(me.x - j.x, me.z - j.z) < 0.75 && me.y < j.y + 2.6 && me.y > j.y - 0.5) me.hurt(g, { x: j.x, z: j.z }, 'hot'); } }
function fireDart(g, x, y, z, dir, len) { let m = g.dartPool.pop(); if (!m) { m = makeDart(); g.scene.add(m); g.extra.push(m); } m.visible = true; m.position.set(x, y, z); m.rotation.set(0, Math.atan2(dir[0], dir[1]), 0); g.dartsLive.push({ m, x, y, z, dir, L: len, t: 0 }); }
