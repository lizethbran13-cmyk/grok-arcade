import * as THREE from 'three';
import { Arena, CS } from './arena.js';
import { G, mat, part, makeChar, animChar, makeHuman } from './models.js';
import { Batch, arenaRing, sign, plant, crate, sky, balloons, speaker } from './props.js';
import { logoTex, textTex, canvasTex } from './tex.js';
import { rng, clamp, damp, shuffle } from './util.js';
import { E } from './engine.js';

/* ================= PICKLEBALL SMASH: quick 2v2 (blue = slots 1+3 near side, pink = slots 2+4 far side) ================= */
export class PickleSmash extends Arena {
  constructor(ctx) {
    super(ctx); this.dur = this.time = 75; this.hw = 3.1; this.hd = 6.7; this.pts = [0, 0]; this.WIN = 5; this.wait = 1.5; this.server = 0; this.R = rng(this.seed);
    this.team = this.players.map((p, i) => i % 2); // 0 near (z>0), 1 far
    this.ball = { x: 0, y: 1, z: 3, vx: 0, vy: 0, vz: 0, b: 0, side: 0, last: -1, live: 0 };
    this.spawn(this.players.map((p, i) => [(i < 2 ? -1.4 : 1.4), (this.team[i] ? -4.5 : 4.5), this.team[i] ? 0 : Math.PI]));
    this.cam = { mode: 'fit', W: this.hw * 2 + 2.2, H: this.hd * 2 + 1.5, pitch: 1.0, tx: 0, tz: 0.4, ty: 0 };
    this.build(); this.serve();
  }
  serve() { const sv = this.av.map((a, i) => i).filter((i) => this.team[i] === this.server), i = sv[(this.R() * sv.length) | 0], a = this.av[i];
    Object.assign(this.ball, { x: a.x, y: 1.3, z: a.z + (this.server ? 0.6 : -0.6), vx: 0, vy: 0, vz: 0, b: 0, last: -1, live: 0, srv: i }); this.wait = 1.2; }
  build() { const g = this.grp, b = new Batch(), hw = this.hw, hd = this.hd; sky(E.scene, '#4aa3ff', '#ffd0f0');
    const ct = canvasTex('court', 256, 512, (c, w, h) => { c.fillStyle = '#2f9e6a'; c.fillRect(0, 0, w, h); c.fillStyle = '#3c7fe0'; c.fillRect(14, 14, w - 28, h - 28); c.fillStyle = '#ff8fcf'; c.fillRect(14, h / 2 - h * 0.1, w - 28, h * 0.2); c.strokeStyle = '#fff'; c.lineWidth = 5; c.strokeRect(14, 14, w - 28, h - 28); c.beginPath(); c.moveTo(w / 2, 14); c.lineTo(w / 2, h / 2 - h * 0.1); c.moveTo(w / 2, h / 2 + h * 0.1); c.lineTo(w / 2, h - 14); c.moveTo(14, h / 2 - h * 0.1); c.lineTo(w - 14, h / 2 - h * 0.1); c.moveTo(14, h / 2 + h * 0.1); c.lineTo(w - 14, h / 2 + h * 0.1); c.stroke(); });
    const fl = new THREE.Mesh(G.plane(), new THREE.MeshStandardMaterial({ map: ct, roughness: 0.6 })); fl.rotation.x = -Math.PI / 2; fl.scale.set((hw + 0.25) * 2, (hd + 0.25) * 2, 1); fl.position.y = 0.006; fl.receiveShadow = true; g.add(fl);
    b.add(G.box(), mat('#1a1a22'), 0, 0.46, 0, hw * 2 + 0.6, 0.9, 0.03); b.add(G.box(), mat('#ffffff'), 0, 0.92, 0, hw * 2 + 0.6, 0.06, 0.05); for (const s of [-1, 1]) b.add(G.cyl(), mat('#d0d0dc', { metalness: 0.7 }), s * (hw + 0.35), 0.48, 0, 0.05, 0.96, 0.05);
    // benches, ball hoppers, umpire chair with Pi-rat, scoreboard, towels, water coolers
    for (const s of [-1, 1]) { b.add(G.box(), mat('#2a62c9'), s * (hw + 1.3), 0.4, 3, 0.45, 0.08, 2.6); b.add(G.box(), mat('#ff3fb4'), s * (hw + 1.3), 0.4, -3, 0.45, 0.08, 2.6); for (const z of [-3, 3]) { b.add(G.cyl(), mat('#2fd0ff', { roughness: 0.2 }), s * (hw + 1.3), 0.75, z + 1.6, 0.18, 0.5, 0.18); b.add(G.box(), mat('#ffffff'), s * (hw + 1.3), 0.47, z - 0.6, 0.4, 0.06, 0.35); } }
    const uc = new THREE.Group(); uc.position.set(hw + 1.5, 0, 0); g.add(uc); part(G.box(), mat('#ffffff'), 0, 1.0, 0, 0.7, 0.1, 0.7, uc); for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) part(G.cylLo(), mat('#ffffff'), x, 0.5, z, 0.04, 1, 0.04, uc);
    const ump = makeChar('pirat', '#ffd23f'); ump.scale.setScalar(1.3); ump.position.y = 1.05; ump.rotation.y = -Math.PI / 2; uc.add(ump); this.ump = ump;
    this.sb = canvasTex('sb_' + this.seed, 512, 160, () => {}); this.sbC = this.sb.image; sign(g, this.sb, 4.2, 0, 2.6, -hd - 1.3, 0, 512 / 160, '#111');
    b.build(g); arenaRing(g, hw + 1.8, hd + 0.4, { led: '#ff8fcf', floor: '#222a55' });
    this.ballM = part(G.sph(), mat('#d8f53a', { roughness: 0.4, emissive: '#7a9a00', emissiveIntensity: 0.3 }), 0, 1, 0, 0.17, 0.17, 0.17, g); this.shadowM = part(G.cyl(), mat('#000', { transparent: true, opacity: 0.35 }), 0, 0.012, 0, 0.2, 0.01, 0.2, g, false);
    this.meshes.forEach((m, i) => { const pd = part(G.box(), mat(this.team[i] ? '#ff3fb4' : '#2a62c9', { roughness: 0.3 }), 0.42, 0.55, 0.15, 0.06, 0.32, 0.26, m.userData.body); m.userData.pad = pd; });
    this.drawSB(); }
  drawSB() { const c = this.sbC.getContext('2d'), w = 512, h = 160; c.fillStyle = '#0d0d18'; c.fillRect(0, 0, w, h); c.font = '900 34px system-ui'; c.textAlign = 'center'; c.fillStyle = '#7ab8ff'; c.fillText('BLUE', w * 0.25, 46); c.fillStyle = '#ff8fcf'; c.fillText('PINK', w * 0.75, 46);
    c.font = '900 86px system-ui'; c.fillStyle = '#fff'; c.fillText(this.pts[0], w * 0.25, 136); c.fillText(this.pts[1], w * 0.75, 136); c.fillStyle = '#ffd23f'; c.font = '800 24px system-ui'; c.fillText('FIRST TO 5', w / 2, 100); this.sb.needsUpdate = true; this._sbk = this.pts.join(); }
  landing() { const b = this.ball, g = 12; const t = (b.vy + Math.sqrt(Math.max(0, b.vy * b.vy + 2 * g * b.y))) / g; return [b.x + b.vx * t, b.z + b.vz * t, t]; }
  ai(i) { const a = this.av[i], b = this.ball, side = this.team[i] ? -1 : 1, mate = this.av.findIndex((x, k) => k !== i && this.team[k] === this.team[i]);
    const home = [i < 2 ? -1.4 : 1.4, side * 4.2]; let goal = home;
    if (b.live && b.last !== this.team[i]) { const [lx, lz] = this.landing(), tx = clamp(lx, -this.hw, this.hw), tz = clamp(lz, -this.hd - 1, this.hd + 1);
      if (Math.sign(tz) === side) { const md = mate >= 0 ? Math.hypot(this.av[mate].x - tx, this.av[mate].z - tz) : 1e9, me = Math.hypot(a.x - tx, a.z - tz); if (me <= md + 0.2) goal = [tx, tz + side * 0.5]; } }
    const s = this.steer(a, goal[0], goal[1], 0.2); return { mx: s.mx, mz: s.mz, a: Math.random() < 0.3 ? 1 : 0 }; }
  hit(i, smash) { const b = this.ball, side = this.team[i] ? 1 : -1, tx = (this.R() - 0.5) * (this.hw * 2 - 0.8), tz = side * (1.8 + this.R() * (this.hd - 2.6)), T = smash ? 0.62 : 1.05 + this.R() * 0.2, g = 12;
    b.vx = (tx - b.x) / T; b.vz = (tz - b.z) / T; b.vy = (0 - b.y + 0.5 * g * T * T) / T; if (!smash) b.vy = Math.max(b.vy, 4.2); b.b = 0; b.last = this.team[i]; b.live = 1; this.sfx(smash ? 'smash' : 'hit', i); this.av[i].swing = 0.3; if (smash) this.say('SMASH! 💥', i); }
  point(team, why) { this.pts[team]++; this.server = team; this.sfx('point'); this.say(`${team ? 'PINK' : 'BLUE'} point! ${why}`); this.ball.live = 0; this.av.forEach((a, i) => a.score = this.pts[this.team[i]]);
    if (this.pts[team] >= this.WIN) { this.done = true; return; } this.serve(); }
  update(dt) { const hw = this.hw, hd = this.hd; this.move(dt, { speed: 5.2 }); this.av.forEach((a, i) => { const s = this.team[i] ? -1 : 1; a.z = s > 0 ? clamp(a.z, 0.6, hd + 1.2) : clamp(a.z, -hd - 1.2, -0.6); a.x = clamp(a.x, -hw - 1, hw + 1); if (a.swing > 0) a.swing -= dt; });
    const b = this.ball; this.time -= dt; if (this.time <= 0) { this.done = true; return; }
    if (!b.live) { this.wait -= dt; const a = this.av[b.srv]; b.x = a.x; b.z = a.z + (this.server ? 0.6 : -0.6); b.y = 1.3; if (this.wait <= 0) this.hit(b.srv, false); return; }
    b.vy -= 12 * dt; const pz = b.z; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    if (Math.sign(pz) !== Math.sign(b.z) && b.y < 0.92) return this.point(b.last === 0 ? 1 : 0, 'Into the net!');
    if (b.y <= 0) { b.y = 0; b.vy = -b.vy * 0.62; b.vx *= 0.8; b.vz *= 0.8; b.b++; this.sfx('bounce');
      const inb = Math.abs(b.x) <= hw + 0.05 && Math.abs(b.z) <= hd + 0.05; if (b.b === 1 && !inb) return this.point(b.last === 0 ? 1 : 0, 'Out!'); if (b.b >= 2) return this.point(b.last, 'Two bounces!'); }
    // auto-hit when in reach (A = smash)
    this.av.forEach((a, i) => { if (!b.live || b.last === this.team[i] || a.stun > 0) return; const side = this.team[i] ? -1 : 1; if (Math.sign(b.z) !== side) return;
      if (Math.hypot(a.x - b.x, a.z - b.z) < 1.25 && b.y < 2.3 && b.y > 0.1) this.hit(i, a.inp.a && b.y > 0.9); });
  }
  snapG() { const b = this.ball; return [+b.x.toFixed(2), +b.y.toFixed(2), +b.z.toFixed(2), this.pts[0], this.pts[1], b.live]; }
  applyG(g) { Object.assign(this.ball, { x: g[0], y: g[1], z: g[2], live: g[5] }); this.pts = [g[3], g[4]]; }
  viewG(dt) { const b = this.ball; this.ballM.position.set(b.x, b.y + 0.17, b.z); this.shadowM.position.set(b.x, 0.012, b.z); if (this._sbk !== this.pts.join()) this.drawSB();
    this.meshes.forEach((m, i) => { m.userData.pad.rotation.x = (this.av[i].swing || 0) > 0 ? -1.2 : 0; }); this.ump.rotation.y = -Math.PI / 2 + Math.sin(E.t) * 0.3 + (b.z > 0 ? 0.3 : -0.3); }
  hud() { return `🔵 ${this.pts[0]}  –  ${this.pts[1]} 🩷 · first to 5`; }
}

/* ================= PI-RAT'S TREASURE DIG (new): hold A on an X to dig — coins, gems, cheese chests… or a goo bomb ================= */
export class TreasureDig extends Arena {
  constructor(ctx) {
    super(ctx); this.dur = this.time = 45; this.hw = 5.8; this.hd = 8; this.R = rng(this.seed); this.pops = [];
    this.spots = []; for (let k = 0; k < 9; k++) this.spots.push(this.newSpot());
    this.spawn(this.players.map((p, i) => [(i - 1.5) * 2, 3, Math.PI]));
    this.cam = { mode: 'fit', W: this.hw * 2 + 1.5, H: this.hd * 2 + 1, pitch: 0.95, tx: 0, tz: 0.6, ty: 0 }; this.build();
  }
  newSpot() { const R = this.R; let x, z, ok, n = 0; do { x = (R() - 0.5) * (this.hw * 2 - 1.5); z = (R() - 0.5) * (this.hd * 2 - 2); ok = !this.spots.some((s) => Math.hypot(s.x - x, s.z - z) < 1.8); } while (!ok && n++ < 20);
    const r = R(); return { x, z, p: 0, by: -1, loot: r < 0.48 ? 1 : r < 0.74 ? 3 : r < 0.83 ? 5 : 0 }; }
  build() { const g = this.grp, b = new Batch(), hw = this.hw, hd = this.hd; sky(E.scene, '#38b6ff', '#fff2c4');
    const sand = canvasTex('sand', 256, 256, (c, w, h) => { c.fillStyle = '#f2d595'; c.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(${Math.random() < 0.5 ? '160,120,60' : '255,250,230'},${Math.random() * 0.25})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
    const fl = new THREE.Mesh(G.plane(), new THREE.MeshStandardMaterial({ map: sand, roughness: 0.95 })); fl.rotation.x = -Math.PI / 2; fl.scale.set(hw * 2 + 2, hd * 2 + 2, 1); fl.position.y = 0.004; fl.receiveShadow = true; g.add(fl);
    const sea = new THREE.Mesh(G.plane(), mat('#1aa7d8', { roughness: 0.08, metalness: 0.2 })); sea.rotation.x = -Math.PI / 2; sea.scale.set(80, 80, 1); sea.position.y = -0.05; g.add(sea);
    // palms, Pi-rat's ship "Salty Cheddar", treasure piles, barrels, flags, rope posts, crabs
    const palm = (x, z, s) => { for (let k = 0; k < 5; k++) b.add(G.cyl(), mat('#9b6b3a'), x + k * 0.06, 0.3 + k * 0.55, z, 0.14 - k * 0.012, 0.6, 0.14 - k * 0.012, 0, 0, -0.06); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; b.add(G.sphLo(), mat('#2fa84a'), x + 0.3 + Math.cos(a) * 0.7 * s, 2.9, z + Math.sin(a) * 0.7 * s, 0.75 * s, 0.1, 0.28 * s, -a, 0, 0.3); } b.add(G.sphLo(), mat('#6b4a2a'), x + 0.3, 2.75, z, 0.14); };
    for (const s of [-1, 1]) for (let z = -hd + 1; z < hd; z += 3.4) palm(s * (hw + 0.9), z, 1);
    const ship = new THREE.Group(); ship.position.set(0, 0, -hd - 3.4); g.add(ship); part(G.box(), mat('#7a4a28'), 0, 0.7, 0, 7, 1.4, 2.2, ship); part(G.box(), mat('#5a3418'), 0, 1.5, 0, 7.2, 0.2, 2.4, ship); part(G.cyl(), mat('#5a3418'), 0, 3.6, 0, 0.12, 4.2, 0.12, ship);
    part(G.box(), mat('#f4ead2', { side: THREE.DoubleSide }), 0, 3.8, 0.1, 2.6, 2.2, 0.04, ship); part(G.box(), mat('#1a1a1a'), 0, 5.8, 0, 0.9, 0.5, 0.03, ship); sign(ship, textTex('ship', ['SALTY CHEDDAR'], 512, 96, { bg1: '#5a3418', bg2: '#3a2010', border: '#ffd23f' }), 3, 0, 0.8, 1.13, 0);
    const pr = makeChar('pirat', '#ffd23f'); pr.scale.setScalar(1.8); pr.position.set(1.8, 1.6, 0.4); ship.add(pr); this.pirat = pr;
    for (let k = 0; k < 6; k++) { const x = (k % 2 ? 1 : -1) * (hw - 0.4 - (k >> 1) * 0.1), z = -hd + 0.6 + (k >> 1) * 0.7; b.add(G.cyl(), mat('#8b5a2b'), x, 0.35, z, 0.3, 0.7, 0.3); b.add(G.tor(), mat('#444', { metalness: 0.6 }), x, 0.5, z, 0.31, 0.31, 0.6, 0, Math.PI / 2); }
    for (let k = 0; k < 18; k++) b.add(G.cylLo(), mat('#ffd23f', { metalness: 0.8, roughness: 0.25, emissive: '#aa7700', emissiveIntensity: 0.3 }), -hw + 0.6 + (k % 3) * 0.25, 0.04 + Math.floor(k / 3) * 0.03, hd - 0.6, 0.12, 0.03, 0.12);
    for (let k = 0; k < 4; k++) { b.add(G.sphLo(), mat('#ff5a3a'), hw - 0.7 - k * 0.5, 0.1, hd - 0.5 - (k % 2) * 0.6, 0.16, 0.09, 0.12); }
    b.build(g); arenaRing(g, hw + 1.8, hd + 1, { led: '#ffd23f', floor: '#0f6a9a', rail: '#d9b77a' });
    sign(g, textTex('td_t', ["PI-RAT'S TREASURE DIG", 'Arr! Mind the goo bombs!'], 720, 200, { bg1: '#7a4a28', bg2: '#3a2010' }), 5.4, 3.8, 2.4, -hd - 2.0, 0);
    this.xM = this.spots.map(() => { const m = new THREE.Group(); part(G.box(), mat('#c0392b', { emissive: '#801010', emissiveIntensity: 0.4 }), 0, 0.02, 0, 1.0, 0.03, 0.18, m, false).rotation.y = Math.PI / 4; part(G.box(), mat('#c0392b', { emissive: '#801010', emissiveIntensity: 0.4 }), 0, 0.02, 0, 1.0, 0.03, 0.18, m, false).rotation.y = -Math.PI / 4;
      const mound = part(G.dome(), mat('#e2bf74', { roughness: 1 }), 0, 0, 0, 0.55, 0.22, 0.55, m); m.userData.mound = mound; const bar = part(G.box(), mat('#ffd23f', { emissive: '#ffb000', emissiveIntensity: 1 }), 0, 0.9, 0, 1, 0.1, 0.1, m, false); m.userData.bar = bar; g.add(m); return m; });
    this.popM = []; }
  ai(i) { const a = this.av[i]; if (!a.goal || !this.spots.includes(a.goal) || (a.goal.by >= 0 && a.goal.by !== i)) { let best = null, bd = 1e9; for (const s of this.spots) { if (s.by >= 0 && s.by !== i) continue; const d = Math.hypot(s.x - a.x, s.z - a.z) + Math.random(); if (d < bd) { bd = d; best = s; } } a.goal = best; }
    if (!a.goal) return { mx: 0, mz: 0, a: 0 }; const d = Math.hypot(a.goal.x - a.x, a.goal.z - a.z); if (d < 0.5) return { mx: 0, mz: 0, a: 1 }; return this.steer(a, a.goal.x, a.goal.z); }
  update(dt) { this.move(dt, { bounds: [this.hw, this.hd] });
    this.spots.forEach((s, k) => { const near = this.av.map((a, i) => ({ a, i, d: Math.hypot(a.x - s.x, a.z - s.z) })).filter((o) => o.d < 0.75 && o.a.inp.a && o.a.stun <= 0).sort((x, y) => x.d - y.d)[0];
      if (near && (s.by < 0 || s.by === near.i)) { s.by = near.i; s.p += dt / 1.0; near.a.hold = 1; if (s.p >= 1) { const a = near.a, i = near.i;
          if (s.loot) { a.score += s.loot; this.sfx(s.loot >= 3 ? 'gold' : 'coin', i); if (s.loot === 5) this.say('CHEESE CHEST! +5 🧀', i); else if (s.loot === 3) this.say('A gem! +3 💎', i); }
          else { a.stun = 2; a.score = Math.max(0, a.score - 2); this.sfx('boom', i); this.say('GOO BOMB! Splat! -2 💥', i); }
          this.pops.push([s.x, s.z, s.loot, 0]); this.spots[k] = this.newSpot(); a.hold = 0; } }
      else { if (s.by >= 0) this.av[s.by].hold = 0; s.by = -1; s.p = Math.max(0, s.p - dt * 0.5); } });
    this.pops.forEach((p) => p[3] += dt); this.pops = this.pops.filter((p) => p[3] < 1.2);
    this.time -= dt; if (this.time <= 0) this.done = true; }
  snapG() { return { s: this.spots.map((s) => [+s.x.toFixed(2), +s.z.toFixed(2), +s.p.toFixed(2)]), p: this.pops.map((p) => [p[0], p[1], p[2], +p[3].toFixed(2)]) }; }
  applyG(g) { g.s.forEach((v, k) => { const s = this.spots[k]; s.x = v[0]; s.z = v[1]; s.p = v[2]; }); this.pops = g.p; }
  viewG(dt) { this.spots.forEach((s, k) => { const m = this.xM[k]; m.position.set(s.x, 0, s.z); m.userData.mound.scale.y = 0.22 * (1 - s.p * 0.8); m.userData.bar.visible = s.p > 0.02; m.userData.bar.scale.x = Math.max(0.01, s.p); m.userData.bar.position.x = -(1 - s.p) / 2; m.userData.bar.lookAt(E.camera.position.x, 0.9, E.camera.position.z); });
    while (this.popM.length < this.pops.length) { const m = part(G.sph(), mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 1 }), 0, 0, 0, 0.25, 0.25, 0.25, this.grp, false); this.popM.push(m); }
    this.popM.forEach((m, k) => { const p = this.pops[k]; m.visible = !!p; if (!p) return; m.position.set(p[0], 0.4 + p[3] * 2.2, p[1]); m.material = mat(p[2] === 0 ? '#5cff3b' : p[2] === 3 ? '#3ff0ff' : p[2] === 5 ? '#ffb000' : '#ffd23f', { emissive: p[2] === 0 ? '#2fd00f' : '#ffb000', emissiveIntensity: 1.2 }); m.scale.setScalar(0.25 + p[3] * 0.2); });
    animChar(this.pirat, E.t, 0, false); this.pirat.rotation.y = Math.sin(E.t * 0.7) * 0.6; }
}

/* ================= BUMPER SHELLS (new): Tortuga Tech shell-tough bumper shells, knock rivals into the water ================= */
export class BumperShells extends Arena {
  constructor(ctx) { super(ctx); this.dur = this.time = 45; this.r = 6.4; this.spawn(this.players.map((p, i) => { const a = i / this.players.length * Math.PI * 2 + 0.6; return [Math.cos(a) * 3.5, Math.sin(a) * 3.5, 0]; }));
    this.cam = { mode: 'fit', W: this.r * 2 + 2, H: this.r * 2 + 2, pitch: 1.0, tx: 0, tz: 0.6, ty: 0 }; this.keepOut = true; this.build(); }
  get speed() { return 5.4; }
  build() { const g = this.grp, b = new Batch(), r = this.r; sky(E.scene, '#ff9a5c', '#ffe1a8');
    const ptx = canvasTex('bumpfl', 512, 512, (c, w, h) => { const cx = w / 2; for (let k = 8; k > 0; k--) { c.fillStyle = k % 2 ? '#16c79a' : '#e8fff6'; c.beginPath(); c.arc(cx, cx, cx * k / 8, 0, 7); c.fill(); } c.fillStyle = '#0b6e5a'; c.font = '900 44px system-ui'; c.textAlign = 'center'; c.fillText('TORTUGA TECH', cx, cx + 16); });
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.85, 0.8, 48), [mat('#0b6e5a'), new THREE.MeshStandardMaterial({ map: ptx, roughness: 0.3 }), mat('#0b6e5a')]); pl.position.y = -0.4; pl.receiveShadow = true; pl.castShadow = true; g.add(pl);
    for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; b.add(G.sph(), mat(k % 2 ? '#ffd23f' : '#ff3fb4', { emissive: k % 2 ? '#ffb000' : '#ff3fb4', emissiveIntensity: 1.4 }), Math.cos(a) * (r - 0.05), 0.02, Math.sin(a) * (r - 0.05), 0.12, 0.06, 0.12); }
    const sea = new THREE.Mesh(G.plane(), mat('#1a9ad8', { roughness: 0.05, metalness: 0.25 })); sea.rotation.x = -Math.PI / 2; sea.scale.set(90, 90, 1); sea.position.y = -0.9; g.add(sea);
    // buoys, a Tortuga Tech rescue boat, inflatable ring floats, lifeguard tower with Torty
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 + 0.3, R = r + 2.3; b.add(G.sph(), mat(k % 2 ? '#ff3b3b' : '#ffffff'), Math.cos(a) * R, -0.75, Math.sin(a) * R, 0.35, 0.3, 0.35); b.add(G.tor(), mat(k % 2 ? '#ffd23f' : '#16c79a'), Math.cos(a + 0.3) * (R + 1.5), -0.82, Math.sin(a + 0.3) * (R + 1.5), 0.5, 0.5, 0.5, 0, Math.PI / 2); }
    const boat = new THREE.Group(); boat.position.set(r + 3.2, -0.8, -2); g.add(boat); part(G.cap(), mat('#16c79a'), 0, 0.3, 0, 1.4, 1.8, 1.4, boat).rotation.x = Math.PI / 2; part(G.box(), mat('#ffffff'), 0, 0.9, -0.2, 1, 0.6, 0.9, boat); const tt = makeChar('torty', '#ffd23f'); tt.scale.setScalar(1.5); tt.position.set(0, 0.85, 0.9); boat.add(tt); this.torty = tt;
    b.build(g); arenaRing(g, r + 4.5, r + 4.5, { led: '#16c79a', floor: '#145a8a', pad: 0 });
    sign(g, textTex('bs_t', ['BUMPER SHELLS', 'Tortuga Tech · shell-tough tested'], 720, 200, { bg1: '#16c79a', bg2: '#0b6e5a' }), 6, 0, 2.6, -r - 5.4, 0);
    this.shellM = this.meshes.map((m, i) => { const s = new THREE.Group(); part(G.dome(), mat(this.players[i].color, { roughness: 0.3, metalness: 0.1 }), 0, 0.02, 0, 0.62, 0.3, 0.62, s); part(G.tor(), mat('#1a1430'), 0, 0.05, 0, 0.62, 0.62, 0.62, s).rotation.x = Math.PI / 2; this.grp.add(s); return s; }); }
  groundY(i) { return 0.32 + (this.av[i].fallY || 0); }
  ai(i) { const a = this.av[i], d = Math.hypot(a.x, a.z); if (d > this.r - 1.6) { const s = this.steer(a, 0, 0); return { mx: s.mx, mz: s.mz, a: 0 }; }
    let best = -1, bd = 1e9; this.av.forEach((o, k) => { if (k === i || o.out) return; const dd = Math.hypot(o.x - a.x, o.z - a.z) - Math.hypot(o.x, o.z) * 0.4; if (dd < bd) { bd = dd; best = k; } });
    if (best < 0) return { mx: 0, mz: 0, a: 0 }; const o = this.av[best], s = this.steer(a, o.x, o.z); return { mx: s.mx, mz: s.mz, a: Math.hypot(o.x - a.x, o.z - a.z) < 2.6 && Math.random() < 0.2 ? 1 : 0 }; }
  onBump = (i, j, nx, nz) => { const a = this.av[i], b = this.av[j], rv = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz; if (rv > 0) return; const imp = -rv * 1.25 + 2.2;
    const ka = a.dash > 0 ? 0.5 : 1, kb = b.dash > 0 ? 0.5 : 1; a.vx -= nx * imp * ka; a.vz -= nz * imp * ka; b.vx += nx * imp * kb; b.vz += nz * imp * kb; a.hit = j; b.hit = i; a.hitT = b.hitT = 2.5; this.sfx('bump', i); };
  update(dt) { this.av.forEach((a) => { a.cd = Math.max(0, (a.cd || 0) - dt); a.dash = Math.max(0, (a.dash || 0) - dt); a.hitT = Math.max(0, (a.hitT || 0) - dt); });
    this.move(dt, { momentum: 2.2 }); this.av.forEach((a, i) => {
      if (a.out) { a.outT += dt; a.fallY = Math.max(-1.6, (a.fallY || 0) - dt * 3); if (a.outT > 2.2) { a.out = 0; a.fallY = 0; const ang = Math.random() * 6.28; a.x = Math.cos(ang) * 1.5; a.z = Math.sin(ang) * 1.5; a.vx = a.vz = 0; a.stun = 0.6; this.say(this.players[i].local ? 'Tortuga Tech rescue boat fished you out! Back in! 🐢' : '', -2); } return; }
      if (a.ap && a.cd <= 0 && a.stun <= 0) { const l = Math.hypot(a.inp.mx, a.inp.mz) || 1, fx = a.inp.mx / l || Math.sin(a.ry), fz = a.inp.mz / l || Math.cos(a.ry); a.vx += fx * 9; a.vz += fz * 9; a.cd = 1.5; a.dash = 0.35; this.sfx('dash', i); }
      if (Math.hypot(a.x, a.z) > this.r + 0.2) { a.out = 1; a.outT = 0; a.score -= 1; this.sfx('splash', i); const k = a.hitT > 0 ? a.hit : -1; if (k >= 0 && this.av[k]) { this.av[k].score += 2; this.say(`${this.players[k].name} bumped ${this.players[i].name} into the water! +2`, k); } else this.say(`${this.players[i].name} slid into the water! -1`, i); } });
    this.time -= dt; if (this.time <= 0) this.done = true; }
  snapG() { return this.av.map((a) => [+(a.fallY || 0).toFixed(2), a.dash > 0 ? 1 : 0]); }
  applyG(g) { g.forEach((v, i) => { this.av[i].fallY = v[0]; this.av[i].dashV = v[1]; }); }
  viewG(dt) { this.meshes.forEach((m, i) => { const s = this.shellM[i]; s.position.set(m.position.x, m.position.y - 0.34, m.position.z); s.rotation.y += dt * 3; s.visible = m.visible = (this.av[i].fallY || 0) > -1.5; }); animChar(this.torty, E.t, 0, false); }
}

/* ================= GRAND FINAL: CROWN CHASE on the golden stage — hold the crown to earn points, bump the holder to steal it ================= */
export class CrownChase extends Arena {
  constructor(ctx) { super(ctx); this.dur = this.time = 50; this.r = 6.2; this.crown = { x: 0, z: 0, by: -1, imm: 0 }; this.stars = []; this.sT = 3; this.R = rng(this.seed); this.acc = this.players.map(() => 0);
    this.spawn(this.players.map((p, i) => { const a = i / this.players.length * Math.PI * 2 + 0.8; return [Math.cos(a) * 4.5, Math.sin(a) * 4.5, 0]; }));
    this.cam = { mode: 'fit', W: this.r * 2 + 1.5, H: this.r * 2 + 1.5, pitch: 0.95, tx: 0, tz: 0.6, ty: 0 }; this.build(); }
  build() { const g = this.grp, b = new Batch(), r = this.r; sky(E.scene, '#2a0a4a', '#8a2a9a');
    const ftx = canvasTex('goldfl', 512, 512, (c, w, h) => { const cx = w / 2; const gr = c.createRadialGradient(cx, cx, 10, cx, cx, cx); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(1, '#e0a000'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = '#b87800'; c.lineWidth = 6; for (let k = 1; k < 6; k++) { c.beginPath(); c.arc(cx, cx, cx * k / 6, 0, 7); c.stroke(); } for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; c.beginPath(); c.moveTo(cx, cx); c.lineTo(cx + Math.cos(a) * cx, cx + Math.sin(a) * cx); c.stroke(); } });
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.3, r + 0.6, 0.6, 48), [mat('#7a2a9a', { metalness: 0.4 }), new THREE.MeshStandardMaterial({ map: ftx, roughness: 0.25, metalness: 0.5 }), mat('#7a2a9a')]); pl.position.y = -0.3; pl.receiveShadow = true; g.add(pl);
    for (let k = 0; k < 32; k++) { const a = k / 32 * Math.PI * 2; b.add(G.sph(), mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 2 }), Math.cos(a) * (r + 0.42), 0.01, Math.sin(a) * (r + 0.42), 0.1, 0.06, 0.1); }
    // trophy pedestals, confetti cannons, sponsor columns, Ruffsources VIP couch
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.26, R = r + 2.0, x = Math.cos(a) * R, z = Math.sin(a) * R; b.add(G.cyl(), mat('#2a1a40', { metalness: 0.5 }), x, 0.6, z, 0.4, 1.2, 0.4); b.add(G.cyl(), mat('#ffd23f', { metalness: 0.9, roughness: 0.2 }), x, 1.45, z, 0.22, 0.5, 0.22); b.add(G.sph(), mat('#ffd23f', { metalness: 0.9, roughness: 0.2 }), x, 1.8, z, 0.28, 0.2, 0.28); }
    b.build(g); arenaRing(g, r + 3.2, r + 3.2, { led: '#ffd23f', floor: '#2a0a3a', rail: '#ffd23f', pad: 0 });
    sign(g, textTex('cc2_t', ['GRAND FINAL · CROWN CHASE', 'Ratita Industries × Tortuga Tech'], 720, 200, { bg1: '#ffb000', bg2: '#7a2a9a' }), 6.5, 0, 2.7, -r - 4.0, 0);
    this.crownM = new THREE.Group(); part(G.cyl(), mat('#ffd23f', { metalness: 0.9, roughness: 0.2, emissive: '#aa6600', emissiveIntensity: 0.4 }), 0, 0.12, 0, 0.32, 0.24, 0.32, this.crownM);
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; part(G.cone(), mat('#ffd23f', { metalness: 0.9, roughness: 0.2 }), Math.cos(a) * 0.27, 0.34, Math.sin(a) * 0.27, 0.08, 0.22, 0.08, this.crownM); part(G.sph(), mat(['#ff3fb4', '#3ff0ff', '#5cff3b', '#ff3b3b', '#a78bfa'][k], { emissive: '#fff', emissiveIntensity: 0.3 }), Math.cos(a) * 0.32, 0.12, Math.sin(a) * 0.32, 0.05, 0.05, 0.05, this.crownM, false); }
    g.add(this.crownM); this.starM = new THREE.InstancedMesh(starGeo(), mat('#ffe066', { emissive: '#ffb000', emissiveIntensity: 1.4, metalness: 0.4 }), 8); g.add(this.starM); }
  ai(i) { const a = this.av[i], c = this.crown; if (c.by === i) { // run away from the closest chaser, stay on stage
      let fx = -a.x * 0.35, fz = -a.z * 0.35; this.av.forEach((o, k) => { if (k === i) return; const dx = a.x - o.x, dz = a.z - o.z, d = Math.hypot(dx, dz) + 0.1; fx += dx / d / d * 3; fz += dz / d / d * 3; }); const l = Math.hypot(fx, fz) || 1; return { mx: fx / l, mz: fz / l, a: 0 }; }
    const st = this.stars.find((s) => Math.hypot(s[0] - a.x, s[1] - a.z) < 2.2); if (st) return this.steer(a, st[0], st[1]);
    const tx = c.by >= 0 ? this.av[c.by].x : c.x, tz = c.by >= 0 ? this.av[c.by].z : c.z, s = this.steer(a, tx, tz); return { mx: s.mx, mz: s.mz, a: Math.hypot(tx - a.x, tz - a.z) < 2.2 && Math.random() < 0.25 ? 1 : 0 }; }
  update(dt) { const c = this.crown; c.imm = Math.max(0, c.imm - dt);
    this.av.forEach((a, i) => { a.cd = Math.max(0, (a.cd || 0) - dt); a.slow = c.by === i ? 0.86 : 1; a.dash = Math.max(0, (a.dash || 0) - dt); });
    this.move(dt, { push: true }); this.av.forEach((a, i) => { const d = Math.hypot(a.x, a.z); if (d > this.r) { a.x *= this.r / d; a.z *= this.r / d; }
      if (a.ap && a.cd <= 0 && a.stun <= 0) { const fx = Math.sin(a.ry), fz = Math.cos(a.ry); a.vx += fx * 10; a.vz += fz * 10; a.cd = 1.3; a.dash = 0.35; this.sfx('dash', i); } });
    if (c.by < 0) { this.av.forEach((a, i) => { if (c.by < 0 && a.stun <= 0 && Math.hypot(a.x - c.x, a.z - c.z) < 0.8) { c.by = i; c.imm = 1; this.sfx('gold', i); this.say(`${this.players[i].name} grabbed the CROWN! 👑`, i); } }); }
    else { const h = this.av[c.by]; c.x = h.x; c.z = h.z; this.acc[c.by] += dt; if (this.acc[c.by] >= 0.5) { this.acc[c.by] -= 0.5; h.score += 1; }
      if (c.imm <= 0) this.av.forEach((a, i) => { if (i === c.by || a.stun > 0) return; if (Math.hypot(a.x - h.x, a.z - h.z) < 0.95 && (a.dash > 0 || Math.hypot(a.vx, a.vz) > 3)) { h.stun = 0.9; this.say(`${this.players[i].name} stole the crown from ${this.players[c.by].name}!`, i); c.by = i; c.imm = 1.2; this.sfx('steal', i); } }); }
    this.sT -= dt; if (this.sT <= 0 && this.stars.length < 6) { this.sT = 2.5; const a = this.R() * 6.28, rr = 1 + this.R() * (this.r - 1.6); this.stars.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    this.stars = this.stars.filter((s) => { const k = this.av.findIndex((a) => !a.stun && Math.hypot(a.x - s[0], a.z - s[1]) < 0.75); if (k >= 0) { this.av[k].score += 3; this.sfx('coin', k); return false; } return true; });
    this.time -= dt; if (this.time <= 0) this.done = true; }
  snapG() { const c = this.crown; return [+c.x.toFixed(2), +c.z.toFixed(2), c.by, this.stars.map((s) => [+s[0].toFixed(2), +s[1].toFixed(2)])]; }
  applyG(g) { Object.assign(this.crown, { x: g[0], z: g[1], by: g[2] }); this.stars = g[3]; }
  viewG() { const c = this.crown; if (c.by >= 0 && this.meshes[c.by]) { const p = this.meshes[c.by].position; this.crownM.position.set(p.x, p.y + 1.55 * CS * 0.9 + 0.1, p.z); this.crownM.rotation.y = E.t * 2; } else { this.crownM.position.set(c.x, 0.4 + Math.sin(E.t * 3) * 0.15, c.z); this.crownM.rotation.y = E.t; }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(0.35, 0.35, 0.35), p = new THREE.Vector3(); this.stars.forEach((st, k) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), E.t * 2 + k); this.starM.setMatrixAt(k, m4.compose(p.set(st[0], 0.5 + Math.sin(E.t * 4 + k) * 0.1, st[1]), q, s)); }); this.starM.count = this.stars.length; this.starM.instanceMatrix.needsUpdate = true;
    this.meshes.forEach((m, i) => { if (m.userData.mark) m.userData.mark.visible = c.by !== i; }); }
}
function starGeo() { const s = new THREE.Shape(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 0.45 : 1; k ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false }); g.translate(0, 0, -0.15); return g; }
