import * as THREE from 'three';
import { Arena, CS } from './arena.js';
import { G, mat, part, makeChar, animChar, makeHuman } from './models.js';
import { Batch, arenaRing, sign, plant, crate, sky } from './props.js';
import { logoTex, textTex, checkerTex, noiseTex, canvasTex } from './tex.js';
import { rng, clamp, damp, shuffle } from './util.js';
import { E } from './engine.js';

/* ================= CHEESE DASH: maze race for cheese (Luna, Pi-rat & Snowie are cheese thieves) ================= */
export class CheeseDash extends Arena {
  constructor(ctx) {
    super(ctx); this.dur = this.time = 45; const N = this.N = 9, C = this.C = 2.4, R = rng(this.seed);
    const wallE = [], wallS = []; for (let i = 0; i < N; i++) { wallE.push(Array(N).fill(1)); wallS.push(Array(N).fill(1)); }
    const vis = Array.from({ length: N }, () => Array(N).fill(0)), st = [[4, 4]]; vis[4][4] = 1;
    while (st.length) { const [i, j] = st.at(-1), nb = shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]], R).filter(([di, dj]) => { const a = i + di, b = j + dj; return a >= 0 && b >= 0 && a < N && b < N && !vis[a][b]; });
      if (!nb.length) { st.pop(); continue; } const [di, dj] = nb[0], a = i + di, b = j + dj; if (di === 1) wallE[i][j] = 0; if (di === -1) wallE[a][b] = 0; if (dj === 1) wallS[i][j] = 0; if (dj === -1) wallS[a][b] = 0; vis[a][b] = 1; st.push([a, b]); }
    for (let k = 0; k < 16; k++) { const i = (R() * (N - 1)) | 0, j = (R() * (N - 1)) | 0; if (R() < 0.5) wallE[i][j] = 0; else wallS[i][j] = 0; }
    this.wallE = wallE; this.wallS = wallS; const H = (N * C) / 2; this.H = H;
    this.boxes = []; const T = 0.5;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x = -H + i * C, z = -H + j * C;
      if (i < N - 1 && wallE[i][j]) this.boxes.push([x + C - T / 2, z - 0.02, x + C + T / 2, z + C + 0.02]);
      if (j < N - 1 && wallS[i][j]) this.boxes.push([x - 0.02, z + C - T / 2, x + C + 0.02, z + C + T / 2]); }
    this.boxes.push([-H - T, -H - T, H + T, -H], [-H - T, H, H + T, H + T], [-H - T, -H, -H, H], [H, -H, H + T, H]);
    this.cheese = []; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { if ((i === 0 || i === N - 1) && (j === 0 || j === N - 1)) continue; this.cheese.push([i, j, 1]); }
    shuffle(this.cheese, R).slice(0, 4).forEach((c) => c[2] = 5); // golden cheese
    this.traps = shuffle(this.cheese.filter((c) => c[2] === 1).map((c) => [c[0], c[1]]), R).slice(0, 6).map((c) => ({ i: c[0], j: c[1], t: 0 }));
    const corners = [[0, 0], [N - 1, N - 1], [N - 1, 0], [0, N - 1]];
    this.spawn(corners.map(([i, j]) => [this.cx(i), this.cz(j), 0]));
    this.cam = { mode: 'follow', cx: H - 2.5, cz: H - 1.5, d: 16, pitch: 1.1, ty: 0 };
    // thieves: the rats nobody picked
    this.thieves = ['luna', 'pirat', 'snowie'].filter((id) => !this.players.some((p) => p.char === id)).map((id, k) => ({ id, x: this.cx(k * 4 % N), z: this.cz(4), i: (k * 4) % N, j: 4, path: [], eat: 0 }));
    this.build();
  }
  cx(i) { return -this.H + this.C * (i + 0.5); } cz(j) { return -this.H + this.C * (j + 0.5); }
  cell(x, z) { return [clamp(Math.floor((x + this.H) / this.C), 0, this.N - 1), clamp(Math.floor((z + this.H) / this.C), 0, this.N - 1)]; }
  open(i, j, di, dj) { const N = this.N, a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= N || b >= N) return false;
    if (di === 1) return !this.wallE[i][j]; if (di === -1) return !this.wallE[a][b]; if (dj === 1) return !this.wallS[i][j]; return !this.wallS[a][b]; }
  bfs(i, j, goal) { const N = this.N, prev = new Map(), q = [[i, j]], k = (a, b) => a * N + b; prev.set(k(i, j), null);
    while (q.length) { const [a, b] = q.shift(); if (goal(a, b) && !(a === i && b === j)) { const path = []; let c = [a, b]; while (c && !(c[0] === i && c[1] === j)) { path.unshift(c); c = prev.get(k(c[0], c[1])); } return path; }
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (this.open(a, b, di, dj) && !prev.has(k(a + di, b + dj))) { prev.set(k(a + di, b + dj), [a, b]); q.push([a + di, b + dj]); } }
    return []; }
  walls = (x, z, r) => { for (const b of this.boxes) { const px = clamp(x, b[0], b[2]), pz = clamp(z, b[1], b[3]), dx = x - px, dz = z - pz, d = Math.hypot(dx, dz);
    if (d < r) { if (d < 1e-4) return [x, b[1] - r]; return [px + dx / d * r, pz + dz / d * r]; } } return null; };
  build() {
    const g = this.grp, b = new Batch(), H = this.H; sky(E.scene, '#ffcf5a', '#ff8a3d');
    const fl = new THREE.Mesh(G.plane(), new THREE.MeshStandardMaterial({ map: checkerTex('chk_cheese', '#ffe9a8', '#ffd770', 8), roughness: 0.6 })); fl.material.map.wrapS = fl.material.map.wrapT = THREE.RepeatWrapping; fl.material.map.repeat.set(this.N / 2, this.N / 2);
    fl.rotation.x = -Math.PI / 2; fl.scale.set(H * 2, H * 2, 1); fl.position.y = 0.01; fl.receiveShadow = true; g.add(fl);
    for (const w of this.boxes) { const cx = (w[0] + w[2]) / 2, cz = (w[1] + w[3]) / 2, sx = w[2] - w[0], sz = w[3] - w[1];
      b.add(G.box(), mat('#f5b82e', { roughness: 0.5 }), cx, 0.55, cz, sx, 1.1, sz); b.add(G.box(), mat('#ffd75e'), cx, 1.12, cz, sx + 0.04, 0.06, sz + 0.04);
      const n = Math.max(1, Math.round(Math.max(sx, sz) / 1.2)); for (let k = 0; k < n; k++) { const f = (k + 0.5) / n, hx = sx > sz ? w[0] + sx * f : cx, hz = sx > sz ? cz : w[1] + sz * f; // cheese holes
        b.add(G.sphLo(), mat('#d8921c'), hx + (sx > sz ? 0 : (k % 2 ? 0.26 : -0.26)), 0.4 + (k % 3) * 0.22, hz + (sx > sz ? (k % 2 ? 0.26 : -0.26) : 0), 0.12, 0.12, 0.12); } }
    this.cheeseMesh = new THREE.InstancedMesh(geoWedge(), mat('#ffc928', { roughness: 0.35, emissive: '#ff9d00', emissiveIntensity: 0.15 }), this.cheese.length); this.cheeseMesh.castShadow = true; g.add(this.cheeseMesh);
    this.trapM = this.traps.map((t) => { const m = new THREE.Group(); m.position.set(this.cx(t.i), 0.02, this.cz(t.j)); part(G.box(), mat('#b07a45'), 0, 0.05, 0, 0.9, 0.08, 0.55, m); const bar = part(G.box(), mat('#c0c4cc', { metalness: 0.8, roughness: 0.25 }), 0, 0.12, -0.22, 0.85, 0.04, 0.04, m); m.userData.bar = bar;
      part(G.box(), mat('#ff3b3b', { emissive: '#ff0000', emissiveIntensity: 0.6 }), 0, 0.1, 0.1, 0.2, 0.03, 0.2, m); g.add(m); return m; });
    this.thiefM = this.thieves.map((t) => { const m = makeChar(t.id, '#ff9d00'); m.scale.setScalar(CS * 0.9); m.position.set(t.x, 0, t.z); g.add(m); return m; });
    b.build(g); arenaRing(g, H, H, { led: '#ffb000', floor: '#5a2f12', rail: '#fff3c4' });
    sign(g, textTex('cd_t', ['CHEESE DASH', 'by Ratita Industries'], 720, 200, { bg1: '#ffb000', bg2: '#d86a00' }), 6, 0, 2.6, -H - 0.35, 0);
  }
  ai(i) { const a = this.av[i], [ci, cj] = this.cell(a.x, a.z); a.re = (a.re || 0) - 1 / 30;
    if (!a.path || !a.path.length || a.re < 0) { a.re = 0.4 + Math.random() * 0.4; a.path = this.bfs(ci, cj, (p, q) => this.cheese.some((c) => c[0] === p && c[1] === q && c[2] > 0)); }
    if (!a.path.length) return this.steer(a, this.cx(ci), this.cz(cj)); let [ni, nj] = a.path[0]; if (ni === ci && nj === cj) { a.path.shift(); if (!a.path.length) return this.steer(a, this.cx(ci), this.cz(cj)); [ni, nj] = a.path[0]; }
    const tx = this.cx(ni), tz = this.cz(nj); // stay centred in the corridor
    const s = this.steer(a, ni !== ci ? tx : this.cx(ci) * 0.5 + tx * 0.5, nj !== cj ? tz : this.cz(cj) * 0.5 + tz * 0.5); return { mx: s.mx * 0.92, mz: s.mz * 0.92, a: 0 }; }
  update(dt) {
    this.move(dt, { walls: this.walls });
    const eat = (x, z, who) => { for (const c of this.cheese) if (c[2] > 0 && Math.hypot(this.cx(c[0]) - x, this.cz(c[1]) - z) < 0.7) { const v = c[2]; c[2] = 0; return v; } return 0; };
    this.av.forEach((a, i) => { if (a.stun > 0) return; const v = eat(a.x, a.z); if (v) { a.score += v; this.sfx(v > 1 ? 'gold' : 'coin', i); if (v > 1) this.say('GOLDEN CHEESE! +5', i); }
      for (const t of this.traps) if (t.t <= 0 && Math.hypot(this.cx(t.i) - a.x, this.cz(t.j) - a.z) < 0.55) { t.t = 4; a.stun = 1.6; const lost = Math.min(2, a.score); a.score -= lost; this.sfx('snap', i); this.say(`SNAP! Mousetrap! -${lost} 🧀`, i);
        // dropped cheese goes back into the maze
        let k = lost; for (const c of this.cheese) if (k > 0 && !c[2]) { c[2] = 1; k--; } } });
    this.traps.forEach((t) => t.t -= dt);
    for (const t of this.thieves) { if (t.eat > 0) { t.eat -= dt; continue; } const [ci, cj] = this.cell(t.x, t.z);
      if (!t.path.length) { t.path = this.bfs(ci, cj, (p, q) => this.cheese.some((c) => c[0] === p && c[1] === q && c[2] === 1)); if (!t.path.length) continue; }
      const [ni, nj] = t.path[0], tx = this.cx(ni), tz = this.cz(nj), dx = tx - t.x, dz = tz - t.z, d = Math.hypot(dx, dz);
      if (d < 0.1) { t.path.shift(); if (eat(t.x, t.z)) t.eat = 1.4; } else { const s = Math.min(d, 2.4 * dt); t.x += dx / d * s; t.z += dz / d * s; t.ry = Math.atan2(dx, dz); } }
    this.time -= dt; if (this.time <= 0 || !this.cheese.some((c) => c[2])) this.done = true;
  }
  snapG() { return { c: this.cheese.map((c) => c[2]).join(','), tr: this.traps.map((t) => t.t > 0 ? 1 : 0), th: this.thieves.map((t) => [+t.x.toFixed(2), +t.z.toFixed(2), +(t.ry || 0).toFixed(2)]) }; }
  applyG(g) { g.c.split(',').forEach((v, k) => this.cheese[k][2] = +v); g.tr.forEach((v, k) => this.traps[k].t = v ? 1 : 0); g.th.forEach((v, k) => { const t = this.thieves[k]; if (t) { t.x = v[0]; t.z = v[1]; t.ry = v[2]; } }); }
  viewG(dt) {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    this.cheese.forEach((c, k) => { const v = c[2], sc = v === 0 ? 0.0001 : v > 1 ? 0.75 : 0.4; q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), E.t * 1.5 + k); p.set(this.cx(c[0]), 0.35 + Math.sin(E.t * 3 + k) * 0.06, this.cz(c[1])); this.cheeseMesh.setMatrixAt(k, m4.compose(p, q, s.set(sc, sc, sc))); this.cheeseMesh.setColorAt(k, new THREE.Color(v > 1 ? '#ffe066' : '#ffc928')); });
    this.cheeseMesh.instanceMatrix.needsUpdate = true; if (this.cheeseMesh.instanceColor) this.cheeseMesh.instanceColor.needsUpdate = true;
    this.traps.forEach((t, k) => this.trapM[k].userData.bar.position.z = t.t > 0 ? 0.2 : -0.22);
    this.thieves.forEach((t, k) => { const m = this.thiefM[k], px = m.position.x, pz = m.position.z; m.position.x = damp(px, t.x, 12, dt); m.position.z = damp(pz, t.z, 12, dt); m.rotation.y = t.ry || 0; animChar(m, E.t, t.eat > 0 ? 0 : 2.4, false); });
  }
}
function geoWedge() { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(1, 0); s.lineTo(0, 0.7); s.lineTo(0, 0); const g = new THREE.ExtrudeGeometry(s, { depth: 0.6, bevelEnabled: false }); g.translate(-0.33, -0.1, -0.3); return g; }

/* ================= SHELL SLIDE: slide Torty down the ice onto the target ================= */
export class ShellSlide extends Arena {
  constructor(ctx) {
    super(ctx); this.dur = this.time = 60; this.throws = 3; this.throwN = 0; this.ph = 'aim'; this.phT = 7;
    this.lanes = this.players.map((p, i) => (i - (this.players.length - 1) / 2) * 3.4); this.L0 = 9; this.TZ = -10;
    this.shell = this.players.map(() => ({ x: 0, z: 0, v: 0, ang: 0, st: 'ready', pw: 0, pts: -1 }));
    this.spawn(this.lanes.map((x) => [x, this.L0 + 1.4, Math.PI]));
    this.cam = { mode: 'fit', W: this.players.length * 3.4 + 2, H: 26, pitch: 0.9, tx: 0, tz: -0.5, ty: 0 };
    this.build(); this.reset();
  }
  reset() { this.shell.forEach((s, i) => Object.assign(s, { x: this.lanes[i], z: this.L0, v: 0, ang: 0, st: 'ready', pts: -1, aim: 0 })); this.ph = 'aim'; this.phT = 7; }
  build() {
    const g = this.grp, b = new Batch(), n = this.players.length, W = n * 3.4 / 2; sky(E.scene, '#7fd0ff', '#e8f7ff');
    const ice = mat('#cdefff', { roughness: 0.08, metalness: 0.1 });
    this.lanes.forEach((x, i) => { b.add(G.box(), ice, x, -0.05, -1.5, 3.0, 0.1, 25); b.add(G.box(), mat('#ffffff', { emissive: '#bff', emissiveIntensity: 0.3 }), x, 0.01, this.L0 - 0.4, 3.0, 0.02, 0.12);
      for (const [r, c] of [[2.4, '#2f7dff'], [1.6, '#ffffff'], [0.8, '#ff3b5c']]) { const m = part(G.cyl(), mat(c, { roughness: 0.15 }), x, 0.005 + (3 - r) * 0.004, this.TZ, r, 0.01, r, g, false); m.receiveShadow = true; }
      for (let z = -12; z < 10; z += 2.5) { b.add(G.box(), mat('#e9f6ff', { roughness: 0.3 }), x - 1.55, 0.15, z, 0.1, 0.3, 2.3); b.add(G.box(), mat('#e9f6ff', { roughness: 0.3 }), x + 1.55, 0.15, z, 0.1, 0.3, 2.3); }
      sign(g, textTex('ss_lane' + i, [`LANE ${i + 1}`], 360, 100, { bg1: this.players[i].color, bg2: '#1a1430', size: 0.7 }), 1.8, x, 1.4, this.L0 + 3.2, Math.PI); });
    // icy water beyond the end + floes
    const w = new THREE.Mesh(G.plane(), mat('#1d6fb8', { roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.92 })); w.rotation.x = -Math.PI / 2; w.scale.set(60, 40, 1); w.position.set(0, -0.35, -12); g.add(w);
    for (let k = 0; k < 14; k++) b.add(G.cyl(), mat('#f2fbff'), -W - 3 + (k * 37 % 100) / 100 * (W * 2 + 6), -0.3, -14.5 - (k * 13 % 7), 0.6 + (k % 3) * 0.3, 0.2, 0.5 + (k % 2) * 0.3);
    // Tortuga Tech judge booth + snow piles + penguins of Tortuga TV
    for (const s of [-1, 1]) { for (let z = -8; z < 10; z += 3) { b.add(G.sphLo(), mat('#ffffff', { roughness: 0.9 }), s * (W + 0.6), 0.1, z, 0.7, 0.45, 0.9); plant(b, s * (W + 1.6), z + 1.5, 0.7); } }
    for (let k = 0; k < 6; k++) crate(b, -W - 1.2 + (k % 2) * 0.1, (k >> 1) * 0.55, 11 + (k & 1) * 0.6, 0.55);
    b.build(g); arenaRing(g, W + 1.0, 13, { led: '#3ff0ff', floor: '#2b4a7a', rail: '#e8f7ff' });
    sign(g, textTex('ss_t', ['SHELL SLIDE', 'Tortuga Tech tested · shell-tough'], 720, 200, { bg1: '#16c79a', bg2: '#0b6e5a' }), 6, 0, 2.4, -13.9, 0);
    this.tortys = this.players.map((p, i) => { const m = makeChar('torty', p.color); m.scale.setScalar(CS * 0.95); g.add(m); return m; });
    // aim arrows
    this.arrows = this.players.map((p) => { const a = new THREE.Group(); part(G.box(), mat(p.color, { emissive: p.color, emissiveIntensity: 1 }), 0, 0.05, -1.3, 0.12, 0.04, 2.0, a, false); const h = part(G.cone(), mat(p.color, { emissive: p.color, emissiveIntensity: 1 }), 0, 0.05, -2.4, 0.25, 0.5, 0.25, a, false); h.rotation.x = -Math.PI / 2; g.add(a); return a; });
  }
  ai(i) { const s = this.shell[i], a = this.av[i]; if (this.ph !== 'aim' || s.st !== 'ready') return { mx: 0, mz: 0, a: 0 };
    if (a.want == null) { const d = this.L0 - this.TZ, v = Math.sqrt(2 * 2.2 * d), want = (v - 6) / 12; a.want = clamp(want + (Math.random() - 0.5) * 0.14, 0, 1); a.aimN = (Math.random() - 0.5) * 0.18; }
    return { mx: a.aimN * 4, mz: 0, a: Math.abs(this.power() - a.want) < 0.03 ? 1 : 0 }; }
  power() { const p = (this.t * 0.62) % 2; return p > 1 ? 2 - p : p; }
  update(dt) {
    this.t += dt; this.av.forEach((a) => { a.ap = a.inp.a && !a.pa; a.pa = a.inp.a; });
    if (this.ph === 'aim') { this.phT -= dt;
      this.shell.forEach((s, i) => { const a = this.av[i]; if (s.st !== 'ready') return; s.aim = clamp(a.inp.mx * 0.25, -0.25, 0.25);
        if (a.ap || this.phT <= 0) { s.pw = this.power(); s.v = 6 + s.pw * 12; s.ang = s.aim; s.st = 'slide'; this.sfx('whoosh', i); a.want = null; } });
      if (this.shell.every((s) => s.st !== 'ready')) this.ph = 'slide'; }
    else if (this.ph === 'slide') {
      this.shell.forEach((s, i) => { if (s.st !== 'slide') return; s.x += Math.sin(s.ang) * s.v * dt; s.z -= Math.cos(s.ang) * s.v * dt; s.v = Math.max(0, s.v - 2.2 * dt);
        const off = Math.abs(s.x - this.lanes[i]) > 1.45 || s.z < -13.2;
        if (off) { s.st = 'splash'; s.pts = 0; this.sfx('splash', i); this.say('SPLASH! Torty fell in the icy water! 0 pts 🥶', i); }
        else if (s.v <= 0) { s.st = 'stop'; const d = Math.hypot(s.x - this.lanes[i], s.z - this.TZ); s.pts = d < 0.8 ? 5 : d < 1.6 ? 3 : d < 2.4 ? 1 : 0; this.av[i].score += s.pts; this.sfx(s.pts >= 5 ? 'gold' : s.pts ? 'coin' : 'buzz', i); if (s.pts >= 5) this.say('BULLSEYE! +5', i); } });
      if (this.shell.every((s) => s.st === 'stop' || s.st === 'splash')) { this.ph = 'wait'; this.phT = 1.8; } }
    else if (this.ph === 'wait') { this.phT -= dt; if (this.phT <= 0) { this.throwN++; if (this.throwN >= this.throws) this.done = true; else this.reset(); } }
    this.time = this.ph === 'aim' ? this.phT : this.time;
  }
  snapG() { return { s: this.shell.map((s) => [+s.x.toFixed(2), +s.z.toFixed(2), s.st, s.pts, +(s.aim || 0).toFixed(2)]), ph: this.ph, n: this.throwN, t: +this.t.toFixed(2) }; }
  applyG(g) { g.s.forEach((v, i) => Object.assign(this.shell[i], { x: v[0], z: v[1], st: v[2], pts: v[3], aim: v[4] })); this.ph = g.ph; this.throwN = g.n; this.t = g.t; }
  viewG(dt) { this.shell.forEach((s, i) => { const m = this.tortys[i]; m.position.set(s.x, s.st === 'splash' ? Math.max(-1.5, m.position.y - dt * 2) : 0, s.z); if (s.st === 'slide') m.rotation.y += dt * 6; animChar(m, E.t, 0, true);
      const ar = this.arrows[i]; ar.visible = s.st === 'ready'; ar.position.set(s.x, 0, s.z - 0.5); ar.rotation.y = -s.aim; ar.scale.z = 0.5 + this.power() * 1.0; }); }
  hud(local) { const s = this.shell[local]; return `Throw ${Math.min(this.throwN + 1, 3)}/3 · ${s && s.st === 'ready' ? `POWER ${Math.round(this.power() * 100)}%` : 'Sliding…'}`; }
}

/* ================= CANDY'S CATCH: catch flying pickleballs as Candy ================= */
export class CandyCatch extends Arena {
  constructor(ctx) {
    super(ctx); this.dur = this.time = 45; this.hw = 5.5; this.hd = 8; this.balls = []; this.spawnT = 1; this.R = rng(this.seed); this.bid = 0;
    this.cannons = [[-this.hw - 1, -this.hd + 2], [this.hw + 1, -this.hd + 2], [-this.hw - 1, this.hd - 3], [this.hw + 1, this.hd - 3], [0, -this.hd - 1]];
    this.spawn(this.players.map((p, i) => [(i - 1.5) * 2, 2, Math.PI]), () => 'candy');
    this.cam = { mode: 'fit', W: this.hw * 2 + 1.5, H: this.hd * 2 + 1, pitch: 0.95, tx: 0, tz: 0.6, ty: 0 };
    this.build();
  }
  build() { const g = this.grp, b = new Batch(), hw = this.hw, hd = this.hd; sky(E.scene, '#5ab8ff', '#c7f0ff');
    const gr = new THREE.Mesh(G.plane(), new THREE.MeshStandardMaterial({ map: stripesGrass(), roughness: 0.85 })); gr.rotation.x = -Math.PI / 2; gr.scale.set(hw * 2, hd * 2, 1); gr.receiveShadow = true; gr.position.y = 0.005; g.add(gr);
    for (const [x, z] of this.cannons) { const c = new THREE.Group(); c.position.set(x, 0, z); c.lookAt(0, 0, 0); g.add(c); part(G.cyl(), mat('#ff3fb4', { metalness: 0.3, roughness: 0.3 }), 0, 0.5, 0, 0.55, 1, 0.55, c); const br = part(G.cyl(), mat('#2a2a35', { metalness: 0.7, roughness: 0.25 }), 0, 1.25, 0.25, 0.28, 1.1, 0.28, c); br.rotation.x = 0.9; part(G.sph(), mat('#ffd23f', { emissive: '#ffb000', emissiveIntensity: 1 }), 0, 1.05, -0.3, 0.12, 0.12, 0.12, c);
      for (let k = 0; k < 6; k++) b.add(G.sph(), mat('#c6f432', { roughness: 0.5 }), x + (k % 3 - 1) * 0.3, 0.12 + (k > 2 ? 0.2 : 0), z + 0.9, 0.11, 0.11, 0.11); }
    // park dressing: bushes, benches, Ruffsources doghouse, fire hydrant, flower beds, bone treats
    for (let k = 0; k < 16; k++) { const s = k % 2 ? 1 : -1, z = -hd + 1 + (k >> 1) * 2.1; b.add(G.sphLo(), mat(k % 3 ? '#3fae54' : '#58c96a'), s * (hw + 0.3), 0.35, z, 0.45, 0.4, 0.55); b.add(G.sphLo(), mat(['#ff7ab8', '#ffd46b', '#ffffff'][k % 3]), s * (hw + 0.3), 0.72, z + 0.2, 0.09); }
    const dh = new THREE.Group(); dh.position.set(-hw + 1.1, 0, -hd + 1.2); g.add(dh); part(G.box(), mat('#d9534f'), 0, 0.55, 0, 1.3, 1.1, 1.2, dh); const roof = part(G.box(), mat('#5b3a8a'), 0, 1.25, 0, 1.5, 0.12, 1.4, dh); part(G.box(), mat('#1a1020'), 0, 0.4, 0.61, 0.55, 0.65, 0.02, dh, false);
    sign(dh, logoTex('ruff'), 1.3, 0, 1.55, 0.2, 0, 3.6, '#22285a');
    b.add(G.cyl(), mat('#ff3b3b', { roughness: 0.4 }), hw - 0.8, 0.35, -hd + 0.9, 0.2, 0.7, 0.2); b.add(G.sph(), mat('#ff3b3b'), hw - 0.8, 0.72, -hd + 0.9, 0.2);
    for (const s of [-1, 1]) { b.add(G.box(), mat('#8b5a2b'), s * (hw - 0.6), 0.45, hd - 1.0, 1.4, 0.08, 0.45); b.add(G.box(), mat('#8b5a2b'), s * (hw - 0.6), 0.75, hd - 0.8, 1.4, 0.5, 0.08); b.add(G.box(), mat('#333'), s * (hw - 0.6), 0.22, hd - 1.0, 1.3, 0.44, 0.06); }
    b.build(g); arenaRing(g, hw + 0.6, hd, { led: '#c6f432', floor: '#2f6b3a' });
    sign(g, textTex('cc_t', ["CANDY'S CATCH", 'Pickleballs by Ratita Pitch-o-Matic'], 720, 200, { bg1: '#ff4f8b', bg2: '#8a1550' }), 6, 0, 2.6, -hd - 0.95, 0);
    this.ballM = new THREE.InstancedMesh(G.sph(), mat('#ffffff', { roughness: 0.35 }), 24); this.ballM.castShadow = true; g.add(this.ballM);
    this.ringM = new THREE.InstancedMesh(G.tor(), mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.6, transparent: true, opacity: 0.8 }), 24); g.add(this.ringM);
  }
  spawnBall() { const R = this.R, c = this.cannons[(R() * this.cannons.length) | 0], r = R(), type = r < 0.14 ? 2 : r < 0.33 ? 3 : 1, T = 1.7 + R() * 0.8;
    this.balls.push({ id: this.bid++, sx: c[0], sz: c[1], tx: (R() - 0.5) * (this.hw * 2 - 1), tz: (R() - 0.5) * (this.hd * 2 - 1.5), T, t: 0, type, st: 0 }); this.sfx('pop'); }
  bp(b) { const f = Math.min(1, b.t / b.T); return [b.sx + (b.tx - b.sx) * f, 1.5 + (0 - 1.5) * f + 4 * 5.2 * f * (1 - f) * 0.5 + 0.3, b.sz + (b.tz - b.sz) * f, f]; }
  ai(i) { const a = this.av[i]; let best = null, bt = 1e9; for (const b of this.balls) { if (b.st || b.type === 3) continue; const left = b.T - b.t, d = Math.hypot(b.tx - a.x, b.tz - a.z); if (d / 4.6 < left + 0.25 && left < bt) { bt = left; best = b; } }
    // dodge goo balls landing on us
    for (const b of this.balls) if (!b.st && b.type === 3 && Math.hypot(b.tx - a.x, b.tz - a.z) < 1 && b.T - b.t < 0.6) return { mx: Math.sign(a.x - b.tx || 1), mz: 0, a: 0 };
    return best ? this.steer(a, best.tx, best.tz, 0.1) : this.steer(a, 0, 1, 1.5); }
  update(dt) { this.move(dt, { bounds: [this.hw - 0.3, this.hd - 0.3] }); this.spawnT -= dt; if (this.spawnT <= 0) { this.spawnBall(); this.spawnT = 0.45 + this.R() * 0.4 - Math.min(0.25, (45 - this.time) * 0.006); if (this.R() < 0.25) this.spawnBall(); }
    for (const b of this.balls) { if (b.st) { b.st += dt; continue; } b.t += dt; const [x, y, z, f] = this.bp(b);
      if (f > 0.6 && y < 1.7) { let bi = -1, bd = 0.85; this.av.forEach((a, i) => { if (a.stun > 0 || a.out) return; const d = Math.hypot(a.x - x, a.z - z); if (d < bd) { bd = d; bi = i; } });
        if (bi >= 0) { const a = this.av[bi]; b.st = 0.001; b.by = bi; if (b.type === 3) { a.stun = 1.5; a.score = Math.max(0, a.score - 1); this.sfx('goo', bi); this.say('Ew, Goo Ball! -1 🧪', bi); } else { a.score += b.type === 2 ? 3 : 1; this.sfx(b.type === 2 ? 'gold' : 'coin', bi); if (b.type === 2) this.say('GOLDEN BALL! +3', bi); } } }
      if (f >= 1 && !b.st) { b.st = 0.001; b.by = -1; } }
    this.balls = this.balls.filter((b) => !b.st || b.st < 0.3); this.time -= dt; if (this.time <= 0) this.done = true; }
  snapG() { return this.balls.map((b) => [b.id, b.sx, b.sz, +b.tx.toFixed(2), +b.tz.toFixed(2), +b.T.toFixed(2), +b.t.toFixed(2), b.type, b.st ? 1 : 0]); }
  applyG(g) { this.balls = g.map((v) => ({ id: v[0], sx: v[1], sz: v[2], tx: v[3], tz: v[4], T: v[5], t: v[6], type: v[7], st: v[8] })); }
  viewG(dt, host) { const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), C = new THREE.Color(); let k = 0;
    if (!host) for (const b of this.balls) if (!b.st) b.t = Math.min(b.T, b.t + dt);
    for (const b of this.balls) { if (k >= 24) break; const [x, y, z] = this.bp(b), sc = b.st ? 0.0001 : b.type === 2 ? 0.26 : 0.2;
      this.ballM.setMatrixAt(k, m4.compose(p.set(x, y, z), q, s.set(sc, sc, sc))); this.ballM.setColorAt(k, C.set(b.type === 2 ? '#ffd23f' : b.type === 3 ? '#5cff3b' : '#d8f53a'));
      q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2); const rs = b.st ? 0.0001 : 0.55 - (b.t / b.T) * 0.25; this.ringM.setMatrixAt(k, m4.compose(p.set(b.tx, 0.04, b.tz), q, s.set(rs, rs, rs))); this.ringM.setColorAt(k, C.set(b.type === 3 ? '#5cff3b' : b.type === 2 ? '#ffd23f' : '#ffffff')); q.identity(); k++; }
    this.ballM.count = this.ringM.count = k; for (const m of [this.ballM, this.ringM]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; } }
}
function stripesGrass() { return canvasStripe(); }
function canvasStripe() { return canvasTex('grass_str', 256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#5fc85a' : '#52b84f'; g.fillRect(0, i * h / 8, w, h / 8); } for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(20,80,20,${Math.random() * 0.15})`; g.fillRect(Math.random() * w, Math.random() * h, 1, 3); } g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.strokeRect(4, 4, w - 8, h - 8); g.beginPath(); g.arc(w / 2, h / 2, 30, 0, 7); g.stroke(); }); }

/* ================= GOO FLOOR: Dr. Vic's goo rises, jump to safe tiles ================= */
export class GooFloor extends Arena {
  constructor(ctx) {
    super(ctx); this.dur = this.time = 50; this.NX = 5; this.NZ = 7; this.S = 1.9; this.R = rng(this.seed); this.tick = 2.4; this.tT = 2; this.outOrder = []; this.goo = -1.2;
    this.tiles = []; for (let j = 0; j < this.NZ; j++) for (let i = 0; i < this.NX; i++) this.tiles.push({ i, j, st: 0, t: 0 });
    shuffle(this.tiles.slice(), this.R).slice(0, 3).forEach((t) => t.st = 3); // Tortuga Tech shell-tough tiles never sink
    this.spawn(this.players.map((p, k) => [this.tx(k % 2 ? 3 : 1), this.tz(k < 2 ? 2 : 4), Math.PI]));
    this.cam = { mode: 'fit', W: this.NX * this.S + 2.5, H: this.NZ * this.S + 2, pitch: 0.95, tx: 0, tz: 0.6, ty: 0 }; this.keepOut = true;
    this.build();
  }
  tx(i) { return (i - (this.NX - 1) / 2) * this.S; } tz(j) { return (j - (this.NZ - 1) / 2) * this.S; }
  tileAt(x, z) { const i = Math.round(x / this.S + (this.NX - 1) / 2), j = Math.round(z / this.S + (this.NZ - 1) / 2); if (i < 0 || j < 0 || i >= this.NX || j >= this.NZ) return null; return this.tiles[j * this.NX + i]; }
  build() { const g = this.grp, b = new Batch(), W = this.NX * this.S / 2, D = this.NZ * this.S / 2; sky(E.scene, '#1b0f3a', '#3c1a6a');
    this.gooM = new THREE.Mesh(G.plane(), mat('#5cff3b', { emissive: '#2fd00f', emissiveIntensity: 0.9, roughness: 0.15 })); this.gooM.rotation.x = -Math.PI / 2; this.gooM.scale.set(W * 2 + 2, D * 2 + 2, 1); g.add(this.gooM);
    // goo tank walls (glass + Ratita bolts)
    for (const [x, z, sx, sz] of [[0, -D - 1, W * 2 + 2.2, 0.2], [0, D + 1, W * 2 + 2.2, 0.2], [-W - 1, 0, 0.2, D * 2 + 2.2], [W + 1, 0, 0.2, D * 2 + 2.2]]) { b.add(G.box(), mat('#6a6f86', { metalness: 0.7, roughness: 0.3 }), x, -0.6, z, sx, 1.4, sz); b.add(G.box(), mat('#9cf07a', { emissive: '#5cff3b', emissiveIntensity: 1.2 }), x, 0.12, z, sx + 0.02, 0.06, sz + 0.02); }
    this.tileM = this.tiles.map((t) => { const m = new THREE.Mesh(G.box(), new THREE.MeshStandardMaterial({ color: t.st === 3 ? '#8a6a3a' : ((t.i + t.j) % 2 ? '#ff7ad1' : '#7ad7ff'), roughness: 0.35, emissive: '#000' })); m.scale.set(this.S - 0.12, 0.35, this.S - 0.12); m.position.set(this.tx(t.i), -0.175, this.tz(t.j)); m.castShadow = m.receiveShadow = true; g.add(m);
      if (t.st === 3) { const s = part(G.dome(), mat('#3f8f3a'), 0, 0.5, 0, 0.18, 0.4, 0.18, m, false); s.scale.set(0.2, 0.6, 0.2); } return m; });
    // Dr. Vic at his goo control console + bubbling vats + pipes
    const vic = new THREE.Group(); vic.position.set(W + 2.2, 0, -D + 1); vic.rotation.y = -Math.PI / 2 - 0.4; g.add(vic);
    { const h = makeHuman({ suit: '#f4f4f8', hair: '#b8bcc8', tie: '#5cff3b', pants: '#4a4a5a' }); h.scale.setScalar(0.9); vic.add(h); this.vic = h; }
    part(G.box(), mat('#3a3f55', { metalness: 0.5 }), 0, 0.5, 0.8, 1.2, 1, 0.5, vic); part(G.box(), mat('#5cff3b', { emissive: '#5cff3b', emissiveIntensity: 1.6 }), 0, 1.02, 0.75, 0.9, 0.04, 0.3, vic, false);
    for (let k = 0; k < 4; k++) { const x = -W - 2.2, z = -D + 1.2 + k * 3.2; b.add(G.cyl(), mat('#c9d2ff', { transparent: true, opacity: 0.45, roughness: 0.05 }), x, 1.1, z, 0.7, 2.2, 0.7); b.add(G.cyl(), mat('#5cff3b', { emissive: '#3fd01f', emissiveIntensity: 1 }), x, 0.75, z, 0.62, 1.5, 0.62); b.add(G.cyl(), mat('#6a6f86', { metalness: 0.7 }), x, 2.25, z, 0.75, 0.12, 0.75); b.add(G.cylLo(), mat('#6a6f86', { metalness: 0.7 }), x + 0.9, 2.1, z, 0.08, 0.08, 1.8, 0, 0, Math.PI / 2); }
    for (let k = 0; k < 4; k++) { crate(b, W + 2.0, 0, D - 0.5 - k * 1.1, 0.6); if (k % 2) crate(b, W + 2.0, 0.6, D - 0.5 - k * 1.1, 0.45, 0.5); }
    b.build(g); arenaRing(g, W + 1.8, D + 1.2, { led: '#5cff3b', floor: '#1a1030', rail: '#3a3f55' });
    sign(g, textTex('gf_t', ['GOO FLOOR', "Dr. Vic's Ratita Goo Lab"], 720, 200, { bg1: '#3fd01f', bg2: '#145a0a' }), 6, 0, 2.6, -D - 2.15, 0);
  }
  groundY(i) { return this.av[i].sink || 0; }
  ai(i) { const a = this.av[i], t = this.tileAt(a.x, a.z), safe = (q) => q && (q.st === 0 || q.st === 3);
    if (!a.goal || !safe(a.goal) || Math.random() < 0.01) { let best = null, bd = 1e9; for (const q of this.tiles) if (q.st === 3 || q.st === 0) { const d = Math.hypot(this.tx(q.i) - a.x, this.tz(q.j) - a.z) + (q.st === 3 ? -0.6 : 0) + Math.random() * 1.2; if (d < bd) { bd = d; best = q; } } a.goal = best; }
    if (!a.goal) return { mx: 0, mz: 0, a: 0 }; const s = this.steer(a, this.tx(a.goal.i), this.tz(a.goal.j), 0.2);
    // jump if the tile ahead is gone
    const ah = this.tileAt(a.x + s.mx * 0.9, a.z + s.mz * 0.9); return { mx: s.mx, mz: s.mz, a: (!ah || ah.st === 2) && t && t.st !== 2 ? 1 : 0 }; }
  update(dt) { this.move(dt, { jump: 6.5, bounds: [this.NX * this.S / 2 + 0.6, this.NZ * this.S / 2 + 0.6] });
    this.tT -= dt; if (this.tT <= 0) { this.tick = Math.max(0.75, this.tick * 0.93); this.tT = this.tick; const sol = this.tiles.filter((t) => t.st === 0); shuffle(sol, this.R).slice(0, 1 + ((this.R() * 2.2) | 0)).forEach((t) => { t.st = 1; t.t = 1.3; }); this.sfx('warn'); }
    for (const t of this.tiles) { if (t.st === 1) { t.t -= dt; if (t.t <= 0) { t.st = 2; t.t = 7; this.sfx('sink'); } } else if (t.st === 2) { t.t -= dt; if (t.t <= 0 && this.R() < 0.5) t.st = 0; else if (t.t <= 0) t.t = 3; } }
    this.av.forEach((a, i) => { if (a.out) { a.outT = (a.outT || 0) + dt; a.sink = Math.max(-1.6, (a.sink || 0) - dt * 1.2); return; } if (a.y > 0.02) return; const t = this.tileAt(a.x, a.z);
      if (!t || t.st === 2) { a.out = 1; a.outT = 0; a.vx = a.vz = 0; this.outOrder.push(i); this.sfx('splash', i); this.say(this.players[i].local ? 'GLOOP! You fell in the goo! 🧪 Watch & cheer!' : `${this.players[i].name} fell in the goo!`, i); } });
    this.goo = -1.2 + (1 - this.time / this.dur) * 0.9;
    this.time -= dt; const alive = this.av.filter((a) => !a.out).length; if (this.time <= 0 || alive <= (this.av.length > 1 ? 1 : 0)) this.done = true;
    this.av.forEach((a) => { if (!a.out) a.score = Math.round(this.dur - Math.max(0, this.time)); }); }
  rankScore(i) { const k = this.outOrder.indexOf(i); return k < 0 ? 100 : k; }
  snapG() { return { t: this.tiles.map((t) => t.st).join(''), o: this.outOrder, g: +this.goo.toFixed(2) }; }
  applyG(g) { [...g.t].forEach((v, k) => this.tiles[k].st = +v); this.outOrder = g.o; this.goo = g.g; this.av.forEach((a) => { if (a.out) { a.sink = Math.max(-1.6, (a.sink || 0) - 0.03); } }); }
  viewG(dt) { this.gooM.position.y = this.goo + Math.sin(E.t * 2) * 0.03; this.tiles.forEach((t, k) => { const m = this.tileM[k], ty = t.st === 2 ? -2.6 : -0.175 + (t.st === 1 ? Math.sin(E.t * 40) * 0.03 : 0); m.position.y = damp(m.position.y, ty, 6, dt);
      m.material.emissive.set(t.st === 1 ? (Math.sin(E.t * 18) > 0 ? '#ff2222' : '#550000') : '#000000'); m.material.emissiveIntensity = 0.8; });
    if (this.vic) { this.vic.userData.arms[0].rotation.x = Math.sin(E.t * 3) * 0.5 - 0.8; } }
}
