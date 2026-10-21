// Grok Snowie Sky Tours - flight models for the whole fleet, crashes with real consequences (damage, lost fares, passenger
// ratings, out-of-service planes) and a tow-drone that ALWAYS comes: it runs every frame, every phase has a timeout that
// snaps it to its goal, there's a NaN/out-of-bounds guard, a self-heal watchdog, and a manual 🛸 Call Tow button.
import * as THREE from 'three';
import { E } from './engine.js?v=st9';
import { Hf, PADS, WATER_Y, SPOTS } from './map.js?v=st9';
import { readMove, edge, held } from './input.js?v=st9';
import { S, persist } from './save.js?v=st9';
import { sfx } from './audio.js?v=st9';
import { talk, toast } from './uikit.js?v=st9';
import { PLANE, PLANES } from './planes.js?v=st9';
const PI = Math.PI, wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a)), clamp = (v, a, b) => Math.max(a, Math.min(b, v)), LIM = 490;
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), near = [];
export const UPGRADES = [
  { id: 'armor', name: 'Shell-Tough Armor', by: '🐢 Torty\'s Tortuga Tech', price: 220, desc: 'Turtle-shell plating, drop-tested by Torty herself. Crashes do HALF damage.' },
  { id: 'skids', name: 'Boing-Boing Bounce Skids', by: '🔧 Mechanic Brie', price: 120, desc: 'Springy landing gear: you can land much harder without a bonk.' },
  { id: 'float', name: 'Floaty Duck Kit', by: '🔧 Mechanic Brie', price: 140, desc: 'Pop-out floaties: splashdowns do zero damage.' },
  { id: 'turbo', name: 'Turbo Tune-Up', by: '🐀 Luna\'s Ratita Gadgets', price: 200, desc: '+15% top speed on every plane in your hangar.' },
];
export const INSURANCE = { price: 90, claims: 3 };
export const hpOf = (id) => (S.hp[id] == null ? 100 : S.hp[id]);
export const repairCost = (id) => { const hp = hpOf(id); if (hp >= 100) return 0; const k = S.ins > 0 ? 0.5 : 1; return Math.max(5, Math.ceil((100 - hp) * 1.2 * PLANE(id).rep * k)); };
export function installCare(Game) { Object.assign(Game.prototype, CARE); }
const CARE = {
  // ---------------- money + passengers ----------------
  earn(n, why) { n = Math.round(n); if (n <= 0) return; S.coins += n; S.stats.earned = (S.stats.earned || 0) + n; persist(); sfx('buy'); toast(`🪙 +${n} coins${why ? ' · ' + why : ''}`); },
  rate(d) { S.rating = clamp(+(S.rating + d).toFixed(2), 1, 5); persist(); },
  fareStart() { const c = this.cop; this.fare = { km0: S.stats.km, photos: 0, from: c.onPad ? c.onPad.id : null }; },
  fareNow() { const F = this.fare; if (!F) return 0; const km = S.stats.km - F.km0; return Math.round((8 + km * 25 + F.photos * 15) * PLANE(this.cop.id).fare * (0.5 + S.rating / 10)); },
  farePay() { const F = this.fare, c = this.cop; if (!F || !c.onPad) return; const km = S.stats.km - F.km0; this.fare = null;
    if (c.onPad.id === F.from && km < 0.25 && !F.photos) return; const n = this.fareNow.call({ fare: F, cop: c }); this.rate(0.15); this.earn(n, `fare paid! Passengers rate you ⭐${S.rating.toFixed(1)}`); },
  setHp(hp) { const c = this.cop; hp = clamp(Math.round(hp), 0, 100); S.hp[c.id] = hp; persist(); c.setHp(hp); if (this.hangarShow) this.hangarShow(); },
  // ---------------- flying ----------------
  guard() { const c = this.cop; const bad = !isFinite(c.x) || !isFinite(c.y) || !isFinite(c.z) || !isFinite(c.vx) || !isFinite(c.vy) || !isFinite(c.vz);
    if (bad) { const s = this.safe || { x: PADS[0].x, y: PADS[0].y + 6, z: PADS[0].z }; c.x = s.x; c.y = s.y + 4; c.z = s.z; c.vx = c.vy = c.vz = 0; c.sp = 0; if (c.mode !== 'tow') { c.mode = 'crash'; c.ct = 2; } }
    if (Math.abs(c.x) > LIM || Math.abs(c.z) > LIM) { c.x = clamp(c.x, -LIM, LIM); c.z = clamp(c.z, -LIM, LIM); }
    if (c.mode !== 'tow') { const t = Math.max(Hf(c.x, c.z), WATER_Y - 0.3); if (c.y < t - 1.2) c.y = t; if (c.y > this.skyCeil() + 65) c.y = this.skyCeil() + 65; }
    if ((c.mode === 'ground' || c.mode === 'fly') && !bad) { const s = this.safe || (this.safe = {}); s.x = c.x; s.y = c.y; s.z = c.z; } },
  flyUpdate(dt, busy) { const c = this.cop; c.t += dt; this.guard();
    if (c.mode === 'crash') return this.crashUpdate(dt); if (c.mode === 'tow') return this.syncCopter(dt);
    const PL = PLANE(c.id), mv = busy ? { x: 0, y: 0 } : readMove(), up = !busy && held('jump'), down = !busy && held('spin'), cy = this.cam.moveYaw, m = Math.hypot(mv.x, mv.y);
    const dx = Math.sin(cy) * mv.y - Math.cos(cy) * mv.x, dz = Math.cos(cy) * mv.y + Math.sin(cy) * mv.x, want = Math.atan2(dx, dz);
    const MAX = PL.spd * (c.hp < 30 ? 0.8 : 1) * (S.up.turbo ? 1.15 : 1), ox = c.x, oz = c.z, wing = PL.kind === 'wing';
    const broken = c.hp <= 0, tryGo = (up || (m > 0.5 && !wing && c.spin > 0.2));
    if (broken && c.mode === 'ground' && tryGo) { if (!this._oosT || this.T - this._oosT > 3) { this._oosT = this.T; sfx('deny'); toast(`🚫 ${PL.name} is out of service! Hop out and visit the 🔧 Repair Hangar (or tap 🛸 for a tow there).`); } }
    if (!wing) { // ---- copters: stick = fly that way, auto-hover ----
      if (c.mode === 'ground' || c.mode === 'roll') { c.mode = 'ground'; c.vx = c.vz = 0; c.vy = 0; c.spin = Math.max(0, c.spin - dt * 0.6); if (!broken && tryGo) this.takeOff(3); else if (m > 0.5) c.spin = Math.min(1, c.spin + dt); }
      else { c.spin = Math.min(1, c.spin + dt * 1.5); const k = 1 - Math.exp(-PL.acc * dt); c.vx += (dx * MAX - c.vx) * k; c.vz += (dz * MAX - c.vz) * k; const tvy = up ? PL.climb : down ? -10 : 0; c.vy += (tvy - c.vy) * (1 - Math.exp(-3 * dt)); if (c.y > this.skyCeil() && c.vy > 0) c.vy = 0;
        const hs = Math.hypot(c.vx, c.vz); if (hs > 2) { c.turn = wrap(Math.atan2(c.vx, c.vz) - c.yaw); c.yaw += c.turn * Math.min(1, dt * PL.turn); } else c.turn = 0; c.x += c.vx * dt; c.z += c.vz * dt; } }
    else { // ---- fixed-wing: always flying forward, stick steers, ▲/▼ climb/descend, ▼ also slows; land on runways, roll out ----
      if (c.mode === 'ground' || c.mode === 'roll') { c.vy = 0;
        if (c.mode === 'roll') { c.sp = Math.max(0, (c.sp || 0) - 13 * dt); c.spin = Math.max(0.3, c.spin - dt * 0.4); if (m > 0.3) c.yaw += clamp(wrap(want - c.yaw), -0.6 * dt, 0.6 * dt); if (c.sp <= 0.05) { c.sp = 0; this.landed(); } }
        else { c.spin = Math.max(0, c.spin - dt * 0.5); if (m > 0.3) { c.yaw += clamp(wrap(want - c.yaw), -1.7 * dt, 1.7 * dt); c.sp = (c.sp || 0) + (5 * m - (c.sp || 0)) * Math.min(1, 3 * dt); c.spin = Math.min(0.6, c.spin + dt); } else c.sp = (c.sp || 0) * Math.exp(-5 * dt);
          if (c.sp < 0.3 && this._taxied && !c.onPad) { const p = this.padAt(c.x, c.z, c.y); if (p) { c.onPad = p; this._taxied = false; this.onLand(); } } if (c.sp > 1) { this._taxied = true; if (c.onPad && !this.padAt(c.x, c.z, c.y)) c.onPad = null; } }
        if (!broken && up) { this.takeOff(5); c.sp = Math.max(c.sp || 0, PL.min * 0.9); }
        c.vx = Math.sin(c.yaw) * (c.sp || 0); c.vz = Math.cos(c.yaw) * (c.sp || 0); c.x += c.vx * dt; c.z += c.vz * dt;
        if (c.mode !== 'fly') { const G = this.groundAt(c.x, c.z, c.y + 0.8); if (G.water && !PL.water) { c.x = ox; c.z = oz; c.sp = 0; if (!this._wT || this.T - this._wT > 2) { this._wT = this.T; toast('🌊 Wheels don\'t float! Only the Lake Skipper seaplane can taxi on water.'); } } else c.y = G.water ? WATER_Y + Math.sin(c.t * 2) * 0.05 : G.y; } }
      else { c.spin = Math.min(1, c.spin + dt * 1.5); const cruise = PL.min + (MAX - PL.min) * 0.45; let tsp = cruise, ts = 0;
        if (m > 0.2) { const d = wrap(want - c.yaw); ts = clamp(d * 2, -1, 1) * m; c.yaw += clamp(d, -PL.turn * dt * m, PL.turn * dt * m); tsp = cruise + (MAX - cruise) * Math.max(0, Math.cos(d)) * m; }
        if (down) tsp = PL.min; c.sp = Math.max(PL.min, (c.sp || PL.min) + (tsp - (c.sp || PL.min)) * (1 - Math.exp(-PL.acc * 0.9 * dt))); c.turn = ts;
        const tvy = up ? PL.climb : down ? -PL.climb : 0; c.vy += (tvy - c.vy) * (1 - Math.exp(-2.5 * dt)); if (c.y > this.skyCeil() && c.vy > 0) c.vy = 0;
        const G0 = this.groundAt(c.x, c.z, c.y + 0.5), alt = c.y - G0.y; if (alt < 7 && c.vy < -3.5 && c.sp <= this.touchMax(PL) && (!G0.water || PL.water)) c.vy = Math.max(c.vy, -3.5); // auto-flare: wheels down, nice and gentle
        c.vx = Math.sin(c.yaw) * c.sp; c.vz = Math.cos(c.yaw) * c.sp; c.x += c.vx * dt; c.z += c.vz * dt; } }
    if (c.mode === 'fly') c.y += c.vy * dt;
    c.x = clamp(c.x, -LIM, LIM); c.z = clamp(c.z, -LIM, LIM);
    const hs = Math.hypot(c.vx, c.vz);
    // walls / big props: gentle bumps push you back (and scrape the paint), fast hits are crashes
    if (c.mode !== 'ground' || hs > 0.2 || wing) { const L = this.world.near(c.x - 2, c.z - 2, c.x + 2, c.z + 2, near); for (const s of L) { if (s.nofloor && s.floor) continue; const y0 = c.y + 0.4, y1 = c.y + 3.0; if (c.x + 1.5 < s.min[0] || c.x - 1.5 > s.max[0] || c.z + 1.5 < s.min[2] || c.z - 1.5 > s.max[2] || y1 < s.min[1] || y0 > s.max[1]) continue; if (s.max[1] - c.y < 0.9) continue;
        if (hs > 13 && c.mode === 'fly') return this.crash('bonk', hs / 30);
        if (hs > 6 && c.mode === 'fly' && (!this._scT || this.T - this._scT > 1.2)) { this._scT = this.T; this.setHp(c.hp - 3); sfx('hit'); this.fx.burst(c.x, c.y + 1.5, c.z, 0xffd23f, 8, 3); toast('🔩 Scrape! −3% (gentle, pilot!)'); }
        const pen = [[c.x + 1.5 - s.min[0], -1, 0], [s.max[0] - (c.x - 1.5), 1, 0], [c.z + 1.5 - s.min[2], -1, 2], [s.max[2] - (c.z - 1.5), 1, 2]].sort((a, b) => a[0] - b[0])[0]; if (pen[2] === 0) { c.x += pen[1] * pen[0]; c.vx = 0; } else { c.z += pen[1] * pen[0]; c.vz = 0; } if (wing) c.sp = Math.min(c.sp || 0, c.mode === 'fly' ? PL.min : 0); } }
    // ground / water contact while flying
    if (c.mode === 'fly') { const G = this.groundAt(c.x, c.z, c.y); if (c.y <= G.y) { const imp = -c.vy, tol = (wing ? 8 : 11) + (S.up.skids ? 5 : 0);
        if (G.water && !PL.water) return this.crash('splash', 0.5);
        if (imp > tol || (wing ? c.sp > this.touchMax(PL) : hs > 18)) { if (G.water) return this.crash('splash', 0.8); return this.crash('bonk', Math.max(imp / 20, hs / 40)); }
        c.y = G.y; if (c.vy < 0) c.vy = 0;
        if (wing) { if (!up) { c.mode = 'roll'; sfx('land'); this.fx.puff(c.x, c.y, c.z, 10, G.water ? 0xdff6ff : 0xf5f0e6); if (G.water) this.fx.splash(c.x, WATER_Y, c.z); } }
        else { c.vx *= Math.exp(-6 * dt); c.vz *= Math.exp(-6 * dt); if (!up && hs < 7) { this.fx.puff(c.x, c.y, c.z, 10, 0xf5f0e6); this.landed(); } } } }
    if (c.mode === 'fly' || c.mode === 'roll' || hs > 0.5) S.stats.km += Math.hypot(c.x - ox, c.z - oz) / 1000;
    this.syncCopter(dt); },
  touchMax(PL) { return Math.max(24, PL.min * 1.45); },
  takeOff(vy) { const c = this.cop; c.mode = 'fly'; c.onPad = null; c.vy = vy; this._taxied = false; S.stats.flights++; persist(); sfx('glide'); if (!this.fare) this.fareStart();
    if (!S.talks.snowie) { S.talks.snowie = 1; persist(); toast('🐁 Snowie: Wheee! Follow the pink arrow to our first tour stop!'); }
    if (PLANE(c.id).kind === 'wing' && !S.talks.wing) { S.talks.wing = 1; persist(); setTimeout(() => toast('✈️ Planes always fly forward! Steer with the stick, ▼ slows you down. Land on a runway 🛬 and roll to a stop.'), 600); } },
  padAt(x, z, y) { return PADS.find((p) => (p.strip ? (x > p.strip[0] && x < p.strip[2] && z > p.strip[1] && z < p.strip[3]) : Math.hypot(p.x - x, p.z - z) < (p.small ? 3.5 : 6.4)) && Math.abs(p.y - y) < 0.9) || null; },
  landed() { const c = this.cop; c.mode = 'ground'; c.vx = c.vz = 0; c.vy = 0; c.sp = 0; S.stats.landings++; persist(); sfx('land'); c.onPad = this.padAt(c.x, c.z, c.y); this.onLand(); },
  // ---------------- crashes ----------------
  crash(kind, sev = 1) { const c = this.cop, PL = PLANE(c.id); c.mode = 'crash'; c.ct = 0; c.kind = kind; S.crashes++; c.sp = 0; if (this.race) { this.race = null; this.showRings(); }
    if (kind === 'splash') { sfx('splash'); this.fx.splash(c.x, WATER_Y, c.z); toast('💦 SPLASH! Floaties deployed. Everyone\'s okay!'); c.vy = 0; c.y = WATER_Y - 0.2; } else { sfx('bosshit'); this.fx.burst(c.x, c.y + 1.5, c.z, 0xffd23f, 22, 7); this.fx.puff(c.x, c.y + 1, c.z, 14, 0x9ca3af); toast('💥 BONK! Airbags out. Everyone\'s okay!'); c.vy = 6; } c.vx *= 0.3; c.vz *= 0.3;
    // consequences (kid-sized): damage, the fare, the passengers' mood
    let dmg = kind === 'splash' ? (S.up.float ? 0 : 20) : 16 + 22 * clamp(sev, 0, 1); dmg = Math.round(dmg * PL.arm * (S.up.armor ? 0.5 : 1));
    this.setHp(c.hp - dmg); this.rate(-0.6); const pend = this.fareNow(), ins = S.ins > 0; if (ins) { S.ins--; persist(); } this.fare = null; this.lastCrash = { dmg, pend, ins, hp: c.hp };
    setTimeout(() => { toast(`🔧 ${PL.name}: −${dmg}% (now ${c.hp}%)${S.up.armor && kind !== 'splash' ? ' · 🐢 shell-tough!' : ''}`); }, 900);
    setTimeout(() => { toast(ins ? `🛡️ Snowie Shield covered the fare: +${pend}🪙 (${S.ins} claims left)` : `⭐ Passengers: ${S.rating.toFixed(1)}${pend ? ` · 🧳 fare lost: ${pend}🪙` : ''}`); if (ins && pend) { S.coins += pend; persist(); } }, 1900);
    if (c.hp <= 0) setTimeout(() => toast('🚫 Out of service! The tow-drone is taking it to the 🔧 Repair Hangar.'), 2900); },
  crashUpdate(dt) { const c = this.cop; c.ct += dt; c.spin = Math.max(0, c.spin - dt * 0.8);
    if (c.kind === 'splash') { c.y = WATER_Y - 0.25 + Math.sin(c.ct * 3) * 0.12; c.pitchV = Math.sin(c.ct * 2) * 0.08; c.rollV = 0.15 + Math.sin(c.ct * 2.6) * 0.1; c.vx *= Math.exp(-2 * dt); c.vz *= Math.exp(-2 * dt); c.x += c.vx * dt; c.z += c.vz * dt; if (c.ct % 0.3 < dt) this.fx.puff(c.x, WATER_Y, c.z, 3, 0xdff6ff); }
    else { c.vy -= 25 * dt; c.x += c.vx * dt; c.z += c.vz * dt; c.y += c.vy * dt; const G = this.groundAt(c.x, c.z, c.y + 1); if (c.y <= G.y) { c.y = G.y; if (c.vy < -3) { c.vy = -c.vy * 0.3; sfx('bounce'); this.fx.puff(c.x, c.y, c.z, 8, 0xd6d3d1); } else c.vy = 0; c.vx *= Math.exp(-4 * dt); c.vz *= Math.exp(-4 * dt); if (G.water && c.ct > 0.3) { c.kind = 'splash'; } }
      const k = Math.max(0, 1 - c.ct / 1.4); c.yaw += dt * 7 * k; c.rollV = Math.min(0.5, c.rollV + dt * 0.8); c.pitchV = Math.sin(c.ct * 9) * 0.25 * k; if (c.ct % 0.25 < dt) this.fx.puff(c.x, c.y + 2.5, c.z, 2, 0x9ca3af); }
    c.x = clamp(c.x, -LIM, LIM); c.z = clamp(c.z, -LIM, LIM); if (!isFinite(c.y) || c.y < WATER_Y - 3) c.y = Math.max(Hf(c.x, c.z), WATER_Y);
    // the old bug: a leftover tow from last time blocked every later rescue. Now: any stale tow is replaced, and there's a hard failsafe.
    if (c.ct > 1.8 && (!this.tow || this.tow.ph === 'away')) this.startTow(); else if (c.ct > 5) { this.tow = null; this.startTow(); }
    this.syncCopter(dt); },
  // ---------------- tow-drone ----------------
  towDest() { const c = this.cop; if (c.hp <= 0) { const r = PADS.find((p) => p.id === 'repair'); if (r) return r; } let best = PADS[0], bd = 1e9; for (const p of PADS) { if (p.town === 'ship' || p.water || p.sky || p.y > 100) continue; const d = Math.hypot(p.x - c.x, p.z - c.z); if (d < bd) { bd = d; best = p; } } return best; },
  callTow() { const c = this.cop; if (this.mode !== 'fly') return; if (this.tow && this.tow.ph !== 'away') { toast('🛸 The tow-drone is already on its way!'); return; }
    if (c.mode === 'crash') { this.startTow(); return; } this.startTow(true); },
  startTow(manual) { const c = this.cop, d = this.drone; this.guard(); if (this.race && manual) { this.race = null; this.showRings(); }
    const pad = this.towDest(); const dp = d.root.position; const sx = clamp(c.x + 30, -LIM, LIM), sz = clamp(c.z + 20, -LIM, LIM); dp.set(sx, Math.max(c.y + 40, Hf(sx, sz) + 30), sz); d.root.visible = true;
    const px = pad.strip ? (pad.strip[0] + pad.strip[2]) / 2 : pad.x, pz = pad.strip ? (pad.strip[1] + pad.strip[3]) / 2 : pad.z;
    let mx = c.y; for (let i = 0; i <= 16; i++) { const k = i / 16; mx = Math.max(mx, Hf(c.x + (px - c.x) * k, c.z + (pz - c.z) * k)); }
    this.tow = { ph: 'in', t: 0, tt: 0, pad, px, pz, manual: !!manual, cruise: Math.min(340, Math.max(c.y + 14, mx + 30, pad.y + 20)) }; c.mode = 'tow'; c.vx = c.vy = c.vz = 0; c.sp = 0; c.onPad = null; if (manual) { this.fare = null; this.rate(-0.1); }
    toast(manual ? '🛸 Tow-drone called! Hang tight, it\'s a free ride home.' : '🛸 Tow-drone on the way!'); sfx('hook'); },
  towTick(dt) { const T = this.tow; if (!T) return; const c = this.cop, d = this.drone, dp = d.root.position, HANG = 7.2 + (c.M ? Math.max(0, c.M.len - 10) * 0.25 : 0); T.t += dt; T.tt += dt;
    d.props.forEach((p, i) => p.rotation.y += dt * 30 * (i % 2 ? 1 : -1)); d.root.rotation.y += dt * 0.3;
    // move toward a goal; past the phase time limit, just snap there (the drone never gets lost)
    const go = (x, y, z, sp, lim) => { _v.set(x - dp.x, y - dp.y, z - dp.z); const L = _v.length(); if (L < 0.2 || T.t > lim) { dp.set(x, y, z); return true; } _v.multiplyScalar(Math.min(1, sp * dt / L)); dp.add(_v); return false; };
    if (T.ph !== 'away' && c.mode !== 'tow') { c.mode = 'tow'; } // nothing may pull the plane out of a tow halfway
    const dist = Math.hypot(T.px - c.x, T.pz - c.z), next = (ph) => { T.ph = ph; T.t = 0; };
    if (T.ph === 'in') { if (go(c.x, c.y + HANG + 1.5, c.z, 30, 2.5 + 60 / 30)) { next('hook'); sfx('hook'); } }
    else if (T.ph === 'hook') { if (T.t > 0.7) next('up'); }
    else if (T.ph === 'up') { if (go(c.x, T.cruise + HANG, c.z, 10, 5)) next('carry'); }
    else if (T.ph === 'carry') { if (go(T.px, T.cruise + HANG, T.pz, 26, 2 + dist / 26 * 1.3)) next('down'); }
    else if (T.ph === 'down') { if (go(T.px, T.pad.y + HANG, T.pz, 9, 6)) next('drop'); }
    else if (T.ph === 'drop') { if (T.t > 0.5) { next('away'); this.towDone(); } }
    else if (T.ph === 'away') { go(dp.x + 20, dp.y + 60, dp.z - 10, 24, 99); if (T.t > 3) { d.root.visible = false; this.tow = null; } }
    if (T.tt > 45 && T.ph !== 'away' && T.ph !== 'drop') { dp.set(T.px, T.pad.y + HANG, T.pz); next('drop'); } // absolute failsafe
    const hooked = T.ph === 'up' || T.ph === 'carry' || T.ph === 'down' || T.ph === 'drop';
    if (hooked) { c.x = dp.x; c.z = dp.z; c.y = dp.y - HANG; c.rollV = Math.sin(T.tt * 2) * 0.08; c.pitchV = Math.sin(T.tt * 1.6) * 0.06; }
    else if (T.ph === 'in' || T.ph === 'hook') { c.rollV *= 0.98; }
    d.cable.visible = d.hook.visible = hooked || T.ph === 'hook'; if (d.cable.visible) { const len = Math.max(0.5, dp.y - (c.y + (c.M ? c.M.rad + 0.9 : 3.2))); d.cable.scale.set(1, len, 1); d.hook.position.set(0, -len, 0); } },
  towDone() { const c = this.cop, T = this.tow, p = T.pad; c.mode = 'ground'; c.x = T.px; c.z = T.pz; c.y = p.y; c.pitchV = c.rollV = 0; c.vx = c.vy = c.vz = 0; c.sp = 0; c.onPad = p; c.yaw = p.strip ? -PI / 2 : c.yaw; S.stats.tows++; persist(); sfx('land'); this.fx.puff(c.x, c.y, c.z, 12, 0xf5f0e6); this.afterTow(T.manual); },
  afterTow(manual) { const c = this.cop, PL = PLANE(c.id), oos = c.hp <= 0, first = !manual && !S.badges.survivor; if (first) { S.badges.survivor = 1; persist(); }
    const L = []; if (manual) L.push(['Snowie', 'Special delivery by tow-drone! No fare this trip, but nobody got bonked. Smart flying!']);
    else { L.push(['Snowie', first ? 'We\'re okay! The tow-drone brought us home. That was SO exciting. Let\'s never do it again. Unless you want to.' : 'Tow-drone to the rescue again! It\'s getting pretty good at this.']); if (first) L.push(['Snowie', 'You earned the Survival Badge! 🛟 Official Bounce-Back Pilot.']);
      L.push(['Snowie', oos ? `Uh-oh, the ${PL.name} is out of service until it's fixed. We're parked right outside the 🔧 Repair Hangar. Brie and the Tortuga Tech crew can patch it up!` : c.hp < 60 ? `The ${PL.name} is at ${c.hp}% and a bit smoky. We can still fly, but a visit to the 🔧 Repair Hangar at the Heliport would be smart.` : `Only a few scuffs: ${c.hp}%. Onward!`]); }
    talk(L, () => { if (first) toast('🏅 Badge: Survival Badge (Bounce-Back Pilot)'); }); },
  // ---------------- per-frame extras: smoke, sparks, wobble, cockpit camera ----------------
  careFx(dt) { const c = this.cop, M = c.M;
    // welding sparks in the Repair Hangar's welding bay (only while you're inside)
    if (this.mode === 'walk' && this.inB && this.inB.id === 'repair' && SPOTS.weld) { this._wdT = (this._wdT || 0) - dt; if (this._wdT <= 0) { this._wdT = 0.06 + Math.random() * 0.18; const [x, y, z] = SPOTS.weld; for (let i = 0; i < 7; i++) { const a = Math.random() * 6.28, v = 1.2 + Math.random() * 2.4; this.fx.emit(x, y + 0.05, z, Math.cos(a) * v, 0.6 + Math.random() * 2.2, Math.sin(a) * v, 0.022 + Math.random() * 0.022, Math.random() < 0.5 ? 0xffd23f : 0xfff3c4, 0.25 + Math.random() * 0.3, 9, 0.6); } } }
    if (!M) return; this._smT = (this._smT || 0) - dt;
    if (c.hp < 60 && this._smT <= 0 && c.root.visible) { this._smT = c.hp < 30 ? 0.07 : 0.14; _v.set(...M.smoke); c.tilt.localToWorld(_v); this.fx.emit(_v.x, _v.y, _v.z, (Math.random() - 0.5) * 0.8, 1.6 + Math.random(), (Math.random() - 0.5) * 0.8, 0.22 + Math.random() * 0.2, c.hp < 30 ? 0x52525b : 0xa1a1aa, 1.3, -0.6, 1.2);
      if (c.hp < 25 && Math.random() < 0.25) this.fx.emit(_v.x, _v.y, _v.z, (Math.random() - 0.5) * 4, 3, (Math.random() - 0.5) * 4, 0.06, 0xffd23f, 0.4, 9, 1); }
    if (M.jet && c.mode === 'fly' && c.root.visible) { this._jT = (this._jT || 0) - dt; if (this._jT <= 0) { this._jT = 0.05; for (const j of M.jet) { _v.set(...j); c.tilt.localToWorld(_v); this.fx.emit(_v.x, _v.y, _v.z, -c.vx * 0.2, 0, -c.vz * 0.2, 0.12, 0xffa53d, 0.18, 0, 4); } } }
    if (c.hp < 30) for (const s of M.spin) { if (s.ax === 'y') s.o.rotation.z = Math.sin(c.t * 13) * 0.05; } },
  toggleView() { if (this.mode !== 'fly') return; S.view = S.view === 'cockpit' ? 'chase' : 'cockpit'; persist(); sfx('click'); toast(S.view === 'cockpit' ? '👁️ Cockpit view! Snowie waves hi.' : '🎥 Chase camera'); this.cam.snap = true; this.ck = { yaw: 0, pitch: 0 }; },
  cockpitCam(dt, IN) { const c = this.cop, M = c.M, cam = E.camera; const ck = this.ck || (this.ck = { yaw: 0, pitch: 0 }); if (IN.camDX || IN.camDY) { ck.yaw -= IN.camDX * 0.006; ck.pitch = clamp(ck.pitch - IN.camDY * 0.004, -0.9, 0.7); IN.camDX = IN.camDY = 0; }
    if (performance.now() - IN.lastCam > 1200) { ck.yaw *= Math.exp(-2 * dt); ck.pitch *= Math.exp(-2 * dt); } ck.yaw = clamp(ck.yaw, -2.2, 2.2);
    c.root.updateMatrixWorld(true); _v.set(...M.seat.eye); c.tilt.localToWorld(_v); cam.position.copy(_v); c.tilt.getWorldQuaternion(_q); _e.set(ck.pitch + (M.seat.pitch ?? -0.08), PI + ck.yaw, 0, 'YXZ'); cam.quaternion.copy(_q).multiply(new THREE.Quaternion().setFromEuler(_e));
    if (cam.near !== 0.08) { cam.near = 0.08; cam.updateProjectionMatrix(); } this.cam.yaw = c.yaw + PI; },
  chaseNear() { const cam = E.camera; if (cam.near !== 0.3) { cam.near = 0.3; cam.updateProjectionMatrix(); } },
};
