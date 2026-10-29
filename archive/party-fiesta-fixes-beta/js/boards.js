/* Grok Land Party - the four party boards (graph + 3D scenery) */
(function () {
'use strict';
const GP = window.GP, G = GP.G, M = GP.M, mat = GP.mat, TAU = GP.TAU;
const SPACING = 2.7;

GP.SPACE_INFO = {
  S: { name: 'Start', color: 0xffffff, txt: 'GO', fg: '#ff4fd8', css: '#ffffff' },
  B: { name: 'Blue space', color: 0x3a8dff, txt: '+', fg: '#fff', css: '#3a8dff' },
  R: { name: 'Red space', color: 0xff4455, txt: '\u2212', fg: '#fff', css: '#ff4455' },
  E: { name: 'Event space', color: 0xff9a1f, txt: '!', fg: '#fff', css: '#ff9a1f' },
  L: { name: 'Lucky space', color: 0x3fd36a, txt: '?', fg: '#fff', css: '#3fd36a' },
};

GP.BOARDS = [
  { id: 'candy', name: 'Candy Clouds', sub: 'Sweet skies over Grok Land', song: 'candy', n: 34,
    theme: { sky: 0xff9fdc, fog: 0xffb8e6, fogNear: 60, fogFar: 160, hemiSky: 0xffffff, hemiGround: 0xff9ad0, hemiI: 0.95, sunI: 1.0 },
    ground: 0xffb3e0, rim: 0xff5fc8, sea: 0x9fe4ff, seaY: -3,
    loop: [[-15, -5], [-9, -11], [0, -8], [9, -12], [16, -5], [17, 4], [10, 10], [1, 7], [-8, 11], [-16, 6]],
    cuts: [{ f: 6 / 34, t: 23 / 34, name: 'Rainbow Bridge', toll: 3, types: 'EBRLE', bridge: 0xff7ad9 }],
    event: { name: 'Sugar Rush!', desc: 'A candy cannon blasts you 3-6 spaces ahead!' },
    color: '#ff7ad9', icon: '#ffb3e6' },
  { id: 'lava', name: 'Lava Volcano', sub: 'Hot coins, hotter rocks', song: 'lava', n: 34,
    theme: { sky: 0x5a1e1a, fog: 0x7a2e1a, fogNear: 40, fogFar: 120, hemiSky: 0xffc0a0, hemiGround: 0x602010, hemiI: 0.75, sunI: 0.95, sunC: 0xffd8b0 },
    ground: 0x5b4644, rim: 0x3a2a2a, sea: 0xff5a14, seaY: -1.4, seaGlow: true,
    loop: [[-16, 0], [-12, -10], [-2, -13], [8, -12], [16, -6], [16, 5], [8, 12], [-3, 13], [-12, 9]],
    cuts: [{ f: 25 / 34, t: 9 / 34, name: 'Toll Bridge', toll: 3, types: 'BLBBLB', bridge: 0x8a6a40 }],
    event: { name: 'Eruption!', desc: 'The volcano rumbles: a geyser launches you ahead, or hot rocks scatter your coins!' },
    color: '#ff7a3d', icon: '#ffb37a' },
  { id: 'frozen', name: 'Frozen Peaks', sub: 'Slip, slide and snowball', song: 'frozen', n: 36,
    theme: { sky: 0xbfe6ff, fog: 0xdff2ff, fogNear: 50, fogFar: 140, hemiSky: 0xffffff, hemiGround: 0x9fc8e8, hemiI: 0.8, sunI: 0.9 },
    ground: 0xf4fbff, rim: 0xbfe0f5, sea: 0x5aa8e0, seaY: -1.6,
    loop: [[-17, -8], [-6, -12], [4, -8], [14, -12], [18, -2], [12, 4], [16, 11], [4, 12], [-6, 8], [-16, 11], [-19, 2]],
    cuts: [{ f: 7 / 36, t: 23 / 36, name: 'Ice Tunnel', toll: 0, types: 'BEB', bridge: 0x9fe6ff }, { f: 26 / 36, t: 5 / 36, name: 'Snow Slope', toll: 0, types: 'LRBE', bridge: 0xdfefff }],
    event: { name: 'Ice Slide!', desc: 'Whee! Slide ahead on the ice, or start a snowball fight and steal coins!' },
    color: '#3fb6ff', icon: '#a8e0ff' },
  { id: 'haunted', name: 'Haunted Forest', sub: 'Spooky trees and sneaky ghosts', song: 'haunted', n: 34,
    theme: { sky: 0x1a1430, fog: 0x2a2048, fogNear: 34, fogFar: 100, hemiSky: 0xb0a0ff, hemiGround: 0x203020, hemiI: 0.7, sunI: 0.6, sunC: 0xc8c0ff },
    ground: 0x34452e, rim: 0x232f20, sea: 0x3a2a5a, seaY: -2.2,
    loop: [[-16, -10], [-4, -12], [8, -10], [16, -12], [17, 0], [16, 11], [4, 9], [-6, 12], [-17, 10], [-14, 0]],
    cuts: [{ f: 6 / 34, t: 21 / 34, name: 'Spooky Path', toll: 3, types: 'EBEBLE', bridge: 0x6a4a8a }],
    event: { name: 'Ghost Trick!', desc: 'A ghost swaps you with a rival, or swipes coins from the leader for you!' },
    color: '#a78bfa', icon: '#cdb8ff' },
];
GP.BOARD_DECOR = {};
GP.boardById = (id) => GP.BOARDS.find((b) => b.id === id) || GP.BOARDS[0];

/* ---------------- graph ---------------- */
function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return [0, 1].map((k) => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3));
}
function sampleLoop(pts, n) {
  const dense = []; const L = pts.length;
  for (let i = 0; i < L; i++) for (let s = 0; s < 40; s++) dense.push(catmull(pts[(i - 1 + L) % L], pts[i], pts[(i + 1) % L], pts[(i + 2) % L], s / 40));
  const cum = [0]; for (let i = 1; i <= dense.length; i++) { const a = dense[i - 1], b = dense[i % dense.length]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const total = cum[cum.length - 1], out = []; let j = 0;
  for (let k = 0; k < n; k++) { const d = (k / n) * total; while (cum[j + 1] < d) j++; const a = dense[j], b = dense[(j + 1) % dense.length], f = (d - cum[j]) / ((cum[j + 1] - cum[j]) || 1); out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); }
  return out;
}
const cache = {};
GP.boardGraphClear = () => { for (const k in cache) delete cache[k]; };
GP.boardGraph = function (id) {
  if (cache[id]) return cache[id];
  const B = GP.boardById(id), rnd = GP.rng(id.length * 7919 + id.charCodeAt(0) * 31);
  const pos = sampleLoop(B.loop, B.n), sp = [];
  // main loop types: deterministic pattern with no two reds in a row
  for (let i = 0; i < B.n; i++) {
    let t = 'B';
    if (i === 0) t = 'S';
    else { const r = rnd(); t = r < 0.17 ? 'R' : r < 0.33 ? 'E' : r < 0.43 ? 'L' : 'B'; if (t === 'R' && sp[i - 1].type === 'R') t = 'B'; if (i < 3 && t === 'R') t = 'B'; }
    sp.push({ i, x: pos[i][0], z: pos[i][1], type: t, next: [(i + 1) % B.n], cut: -1 });
  }
  const near = (p) => { let bi = 0, bd = 1e9; for (let i = 0; i < B.n; i++) { const d = Math.hypot(sp[i].x - p[0], sp[i].z - p[1]); if (d < bd) { bd = d; bi = i; } } return bi; };
  const junctions = [];
  B.cuts.forEach((c, ci) => {
    const a = c.f != null ? Math.round(c.f * B.n) % B.n : near(c.a), b = c.t != null ? Math.round(c.t * B.n) % B.n : near(c.b), A = sp[a], Bq = sp[b];
    const dist = Math.hypot(Bq.x - A.x, Bq.z - A.z), k = Math.max(2, Math.round(dist / SPACING) - 1);
    const mx = (A.x + Bq.x) / 2, mz = (A.z + Bq.z) / 2, nx = -(Bq.z - A.z) / dist, nz = (Bq.x - A.x) / dist, bulge = (ci % 2 ? -1 : 1) * 1.5;
    const first = sp.length;
    for (let j = 1; j <= k; j++) {
      const t = j / (k + 1), w = 4 * t * (1 - t) * bulge;
      const x = (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * (mx + nx * bulge) + t * t * Bq.x + nx * w * 0.2;
      const z = (1 - t) * (1 - t) * A.z + 2 * (1 - t) * t * (mz + nz * bulge) + t * t * Bq.z + nz * w * 0.2;
      const idx = sp.length;
      sp.push({ i: idx, x, z, type: c.types[(j - 1) % c.types.length], next: [j === k ? b : idx + 1], cut: ci });
    }
    A.next = [(a + 1) % B.n, first];
    if (A.type === 'R' || A.type === 'E') A.type = 'B';
    junctions.push({ at: a, to: b, first, k, toll: c.toll, name: c.name, mainSteps: (b - a + B.n) % B.n });
  });
  // star spots: blue main spaces spread around the loop (never junctions / start)
  const starSpots = [];
  for (let i = 4; i < B.n; i += Math.round(B.n / 6)) {
    let j = i; while (j < B.n && (sp[j].type !== 'B' || sp[j].next.length > 1)) j++;
    if (j < B.n) { sp[j].type = 'B'; starSpots.push(j); }
  }
  sp.forEach((s) => { s.prev = []; }); sp.forEach((s) => s.next.forEach((n) => sp[n].prev.push(s.i)));
  return (cache[id] = { id, B, spaces: sp, n: B.n, junctions, starSpots });
};
// distance in steps from space a to b following the shortest branch
GP.boardDist = function (g, a, b) {
  const seen = new Map([[a, 0]]), q = [a];
  while (q.length) { const c = q.shift(), d = seen.get(c); if (c === b) return d; for (const n of g.spaces[c].next) if (!seen.has(n)) { seen.set(n, d + 1); q.push(n); } }
  return 99;
};

/* ---------------- scenery ---------------- */
const spaceTex = {};
function spaceTopMat(type) {
  if (spaceTex[type]) return spaceTex[type];
  const I = GP.SPACE_INFO[type];
  const tex = GP.canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = I.css; g.fillRect(0, 0, w, h);
    g.beginPath(); g.arc(w / 2, h / 2, 52, 0, TAU); g.lineWidth = 8; g.strokeStyle = 'rgba(255,255,255,.75)'; g.stroke();
    g.font = 'bold ' + (I.txt.length > 1 ? 50 : 86) + 'px "Trebuchet MS", Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,.35)'; g.strokeText(I.txt, w / 2, h / 2 + 5); g.fillStyle = I.fg; g.fillText(I.txt, w / 2, h / 2 + 5);
  });
  return (spaceTex[type] = new THREE.MeshLambertMaterial({ map: tex, emissive: 0x222222 }));
}
function far(g, x, z, d) { for (const s of g.spaces) if (Math.hypot(s.x - x, s.z - z) < d) return false; if (g.land && Math.hypot(g.land.x - x, g.land.z - z) < g.land.r + 0.5) return false; return true; }
function openSpot(g) {
  let best = { x: 0, z: 0, r: 0 };
  for (let x = -12; x <= 12; x += 0.5) for (let z = -9; z <= 9; z += 0.5) {
    let d = 1e9; for (const s of g.spaces) d = Math.min(d, Math.hypot(s.x - x, s.z - z));
    const r = d - 1.4 - Math.hypot(x, z) * 0.04; if (r > best.r) best = { x, z, r };
  }
  return best;
}
function place(g, obj, radius) { const L = g.land; obj.position.set(L.x, 0, L.z); obj.scale.setScalar(GP.clamp(L.r / radius, 0.45, 1.2)); }

const decor = {
  candy(grp, rnd, g) {
    const cols = [0xff6ad5, 0x7ad7ff, 0xffe14d, 0x8dff9a, 0xc79bff];
    const lolli = (x, z, s) => { const o = new THREE.Group(); const st = M(G.cyl8, 0xffffff, 0.08 * s, 2.4 * s, 0.08 * s); st.position.y = 1.2 * s; o.add(st); const c = GP.pick(cols); const d = M(G.cyl, c, 0.8 * s, 0.22 * s, 0.8 * s); d.rotation.x = Math.PI / 2; d.position.y = 2.6 * s; o.add(d); const d2 = M(G.cyl, 0xffffff, 0.45 * s, 0.24 * s, 0.45 * s); d2.rotation.x = Math.PI / 2; d2.position.y = 2.6 * s; o.add(d2); o.position.set(x, 0, z); o.rotation.y = rnd() * TAU; return o; };
    const cup = (x, z, s) => { const o = new THREE.Group(); const b = M(G.cyl8, 0xd98a4a, 0.6 * s, 0.6 * s, 0.6 * s); b.position.y = 0.3 * s; o.add(b); const f = M(G.cone, GP.pick(cols), 0.75 * s, 0.9 * s, 0.75 * s); f.position.y = 1.0 * s; o.add(f); const ch = M(G.sphereLo, 0xff2a4a, 0.16 * s); ch.position.y = 1.5 * s; o.add(ch); o.position.set(x, 0, z); return o; };
    const gum = (x, z) => { const o = M(new THREE.SphereGeometry(1, 10, 6, 0, TAU, 0, Math.PI / 2), mat(GP.pick(cols), { emissive: 0x222222 }), 0.6); o.position.set(x, 0, z); return o; };
    for (let i = 0; i < 150; i++) {
      const x = (rnd() - 0.5) * 50, z = (rnd() - 0.5) * 38; if (!far(g, x, z, 2.2) || Math.hypot(x / 25, z / 19) > 1) continue;
      const r = rnd(); grp.add(GP.shadowy(r < 0.4 ? lolli(x, z, 0.9 + rnd() * 0.7) : r < 0.7 ? cup(x, z, 1.0 + rnd() * 0.6) : gum(x, z), true, false));
    }
    // bright candy-sprinkle dots on the frosting ground (cheap, no shadows)
    for (let i = 0; i < 90; i++) {
      const x = (rnd() - 0.5) * 52, z = (rnd() - 0.5) * 40; if (!far(g, x, z, 1.4) || Math.hypot(x / 26, z / 20) > 1) continue;
      const sp = new THREE.Mesh(G.circle, GP.basic(GP.pick(cols))); sp.scale.setScalar(0.18 + rnd() * 0.22); sp.position.set(x, 0.02, z); grp.add(sp);
    }
    // giant cake in the middle
    const cake = new THREE.Group(); [[3.2, 1.4, 0xffd0e8], [2.3, 1.2, 0xffffff], [1.4, 1.0, 0xff9ad5]].reduce((y, l) => { const t = M(G.cyl20, l[2], l[0], l[1], l[0]); t.position.y = y + l[1] / 2; cake.add(t); return y + l[1]; }, 0);
    const cs = GP.buildStar(1.1); cs.position.y = 4.6; cake.add(cs); place(g, cake, 3.3); grp.add(GP.shadowy(cake, true, true));
    for (let i = 0; i < 14; i++) { const c = GP.buildCloud(1 + rnd() * 1.5); c.position.set((rnd() - 0.5) * 120, -2 - rnd() * 6, (rnd() - 0.5) * 100); if (Math.hypot(c.position.x, c.position.z) > 30) grp.add(c); }
  },
  lava(grp, rnd, g) {
    const rock = (x, z, s) => { const o = M(G.dodeca, mat(0x3b2f2f), s, s * 0.7, s); o.position.set(x, s * 0.3, z); o.rotation.y = rnd() * TAU; return o; };
    const pool = (x, z, s) => { const o = new THREE.Mesh(G.circle, GP.basic(0xff6a1a)); o.scale.setScalar(s); o.position.set(x, 0.03, z); return o; };
    const torch = (x, z) => { const o = new THREE.Group(); const p = M(G.cyl8, 0x2a2020, 0.15, 1.6, 0.15); p.position.y = 0.8; o.add(p); const f = new THREE.Mesh(G.ico, GP.basic(0xffa020)); f.scale.setScalar(0.28); f.position.y = 1.75; o.add(f); const gl = GP.glowSprite(0xff8a30, 2); gl.position.y = 1.8; o.add(gl); o.position.set(x, 0, z); return o; };
    for (let i = 0; i < 60; i++) {
      const x = (rnd() - 0.5) * 50, z = (rnd() - 0.5) * 40; if (!far(g, x, z, 2.4) || Math.hypot(x / 25, z / 20) > 1) continue;
      const r = rnd(); grp.add(GP.shadowy(r < 0.45 ? rock(x, z, 0.5 + rnd() * 1.1) : r < 0.75 ? pool(x, z, 0.8 + rnd()) : torch(x, z), true, false));
    }
    const vol = new THREE.Group();
    const cone = M(new THREE.CylinderGeometry(1.6, 6.5, 6.5, 10, 1, true), mat(0x4a3433, { side: THREE.DoubleSide })); cone.position.y = 3.25; vol.add(cone);
    const crater = new THREE.Mesh(G.circle, GP.basic(0xff7a1a)); crater.scale.setScalar(1.6); crater.position.y = 6.3; vol.add(crater);
    const glow = GP.glowSprite(0xff7020, 9); glow.position.y = 7; vol.add(glow);
    for (let i = 0; i < 4; i++) { const st = M(G.box, 0xff5a10, 0.5, 4.5, 0.12); st.material = GP.basic(0xff6a14); st.position.set(Math.cos(i * 1.6) * 3.6, 3, Math.sin(i * 1.6) * 3.6); st.lookAt(0, 9, 0); vol.add(st); }
    vol.userData.smoke = []; for (let i = 0; i < 5; i++) { const s = M(G.ico, mat(0x777070, { transparent: true, opacity: 0.6 }), 0.8); s.position.y = 7 + i * 1.2; vol.add(s); vol.userData.smoke.push(s); }
    place(g, vol, 6.6); grp.add(GP.shadowy(vol, true, true)); grp.userData.anim = (t) => vol.userData.smoke.forEach((s, i) => { const k = (t * 0.4 + i / 5) % 1; s.position.set(Math.sin(i * 2 + t) * 0.6, 6.8 + k * 6, Math.cos(i * 3) * 0.6); s.scale.setScalar(0.5 + k * 1.4); s.material.opacity = 0.6 * (1 - k); });
  },
  frozen(grp, rnd, g) {
    const crystal = (x, z, s) => { const o = M(G.octa, mat(0x9fe8ff, { emissive: 0x2a6a8a, transparent: true, opacity: 0.85 }), 0.5 * s, 1.2 * s, 0.5 * s); o.position.set(x, 1.1 * s, z); o.rotation.y = rnd() * TAU; return o; };
    for (let i = 0; i < 70; i++) {
      const x = (rnd() - 0.5) * 54, z = (rnd() - 0.5) * 42; if (!far(g, x, z, 2.4) || Math.hypot(x / 27, z / 21) > 1) continue;
      const r = rnd(); const o = r < 0.55 ? GP.buildPine(0.7 + rnd() * 0.6, 0x2f7a52, true) : r < 0.85 ? crystal(x, z, 0.7 + rnd()) : GP.buildSnowman();
      if (r < 0.55 || r >= 0.85) { o.position.set(x, 0, z); o.rotation.y = rnd() * TAU; if (r >= 0.85) o.scale.setScalar(0.7); }
      grp.add(GP.shadowy(o, true, false));
    }
    const peak = new THREE.Group(); [[0, 0, 4, 8], [3.5, 1.5, 2.6, 5.5], [-3, -1.5, 2.8, 6]].forEach((p) => { const c = M(G.cone6, 0xe8f4ff, p[2], p[3], p[2]); c.position.set(p[0], p[3] / 2, p[1]); peak.add(c); const sn = M(G.cone6, 0xffffff, p[2] * 0.42, p[3] * 0.32, p[2] * 0.42); sn.position.set(p[0], p[3] * 0.86, p[1]); peak.add(sn); });
    place(g, peak, 5.5); grp.add(GP.shadowy(peak, true, true));
    const ice = new THREE.Mesh(G.circle, mat(0xbfeaff, { emissive: 0x204060 })); ice.scale.setScalar(g.land.r * 1.1 + 1); ice.position.set(g.land.x, 0.02, g.land.z); grp.add(ice);
  },
  haunted(grp, rnd, g) {
    const dead = (x, z, s) => { const o = new THREE.Group(); const t = M(G.cyl8, 0x3a2a3a, 0.25 * s, 3 * s, 0.25 * s); t.position.y = 1.5 * s; o.add(t); for (let k = 0; k < 3; k++) { const br = M(G.cyl8, 0x3a2a3a, 0.09 * s, 1.4 * s, 0.09 * s); br.position.set(0, (1.8 + k * 0.5) * s, 0); br.rotation.z = (k % 2 ? 1 : -1) * 0.9; br.rotation.y = k * 2; br.translateY(0.6 * s); o.add(br); } o.position.set(x, 0, z); return o; };
    const tomb = (x, z) => { const o = new THREE.Group(); const s = M(G.box, 0x8a8a9a, 0.8, 1.1, 0.25); s.position.y = 0.55; o.add(s); const top = M(G.cyl, 0x8a8a9a, 0.4, 0.25, 0.4); top.rotation.x = Math.PI / 2; top.position.y = 1.1; o.add(top); o.position.set(x, 0, z); o.rotation.y = (rnd() - 0.5) * 0.8; o.rotation.z = (rnd() - 0.5) * 0.2; return o; };
    const pumpkin = (x, z) => { const o = new THREE.Group(); const p = M(G.sphereLo, mat(0xff8a1a, { emissive: 0x6a2a00 }), 0.55, 0.42, 0.55); p.position.y = 0.4; o.add(p); const st = M(G.cyl8, 0x3a6a2a, 0.07, 0.25, 0.07); st.position.y = 0.88; o.add(st); const gl = GP.glowSprite(0xffa040, 1.6); gl.position.y = 0.5; o.add(gl); o.position.set(x, 0, z); return o; };
    for (let i = 0; i < 70; i++) {
      const x = (rnd() - 0.5) * 52, z = (rnd() - 0.5) * 42; if (!far(g, x, z, 2.4) || Math.hypot(x / 26, z / 21) > 1) continue;
      const r = rnd(); grp.add(GP.shadowy(r < 0.45 ? dead(x, z, 0.7 + rnd() * 0.6) : r < 0.75 ? tomb(x, z) : pumpkin(x, z), true, false));
    }
    const house = new THREE.Group();
    const hb = M(G.box, 0x7a6a9a, 5, 4, 4); hb.position.y = 2; house.add(hb);
    const roof = M(G.cone6, 0x3a2a5a, 3.7, 2.4, 3.7); roof.position.y = 5.2; roof.rotation.y = Math.PI / 4; house.add(roof);
    const tw = M(G.cyl8, 0x7a6a9a, 1, 6, 1); tw.position.set(2.4, 3, 1.6); house.add(tw); const tr = M(G.cone, 0x2a1a3a, 1.3, 2, 1.3); tr.position.set(2.4, 7, 1.6); house.add(tr);
    for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(G.box, GP.basic(0xffe07a)); w.scale.set(0.7, 0.8, 0.05); w.position.set(-1.4 + (i % 2) * 2.8, 1.4 + Math.floor(i / 2) * 1.6, 2.03); house.add(w); }
    place(g, house, 3.8); grp.add(GP.shadowy(house, true, true));
    const ghosts = []; for (let i = 0; i < 4; i++) { const gh = GP.buildGhost(); gh.root.scale.setScalar(0.9); grp.add(gh.root); ghosts.push(gh.root); }
    const moon = new THREE.Mesh(G.sphere, GP.basic(0xfff6d0)); moon.scale.setScalar(4); moon.position.set(-40, 30, -60); grp.add(moon); const mg = GP.glowSprite(0xfff0b0, 22); mg.position.copy(moon.position); grp.add(mg);
    grp.userData.anim = (t) => ghosts.forEach((gh, i) => { const a = t * 0.25 + i * 1.57; gh.position.set(Math.cos(a) * 9, 2 + Math.sin(t * 1.5 + i) * 0.5, Math.sin(a) * 7); gh.rotation.y = -a; });
  },
};

GP.buildBoardScene = function (id) {
  const g = GP.boardGraph(id), B = g.B, grp = new THREE.Group(), rnd = GP.rng(1234 + B.n);
  // island + sea
  let minx = 1e9, maxx = -1e9, minz = 1e9, maxz = -1e9;
  g.spaces.forEach((s) => { minx = Math.min(minx, s.x); maxx = Math.max(maxx, s.x); minz = Math.min(minz, s.z); maxz = Math.max(maxz, s.z); });
  const rx = (maxx - minx) / 2 + 7, rz = (maxz - minz) / 2 + 7;
  const island = M(G.cyl20, B.ground, rx, 2, rz); island.position.y = -1; grp.add(island);
  const rim = M(G.cyl20, B.rim, rx + 0.6, 1.2, rz + 0.6); rim.position.y = -1.9; grp.add(rim);
  const sea = new THREE.Mesh(G.plane, B.seaGlow ? GP.basic(B.sea) : mat(B.sea, { emissive: B.id === 'candy' ? 0x3a6a80 : 0x111111 })); sea.scale.set(400, 1, 400); sea.position.y = B.seaY; grp.add(sea);
  GP.shadowy(island, false, true);
  // path pebbles
  const pebM = mat(0xffffff, { transparent: true, opacity: 0.6 });
  g.spaces.forEach((s) => s.next.forEach((n) => {
    const t = g.spaces[n], d = Math.hypot(t.x - s.x, t.z - s.z), k = Math.max(1, Math.round(d / 0.9) - 1);
    const isCut = s.cut >= 0 || t.cut >= 0 || (s.next.length > 1 && n !== s.next[0]);
    for (let j = 1; j <= k; j++) { const f = j / (k + 1); const p = M(G.cyl8, isCut ? mat(B.cuts[Math.max(s.cut, t.cut, 0)].bridge) : pebM, 0.18, 0.06, 0.18); p.position.set(s.x + (t.x - s.x) * f, 0.04, s.z + (t.z - s.z) * f); grp.add(p); }
  }));
  // spaces
  const side = mat(0xf0f0f0);
  g.spaces.forEach((s) => {
    const m = new THREE.Mesh(G.cyl, [side, spaceTopMat(s.type), side]); m.scale.set(0.95, 0.24, 0.95); m.position.set(s.x, 0.12, s.z); m.rotation.y = Math.PI / 2;
    GP.shadowy(m, false, true); grp.add(m); s.mesh = m;
  });
  // toll signs + shortcut arch
  g.junctions.forEach((j, ci) => {
    const f = g.spaces[j.first], a = g.spaces[j.at], dx = f.x - a.x, dz = f.z - a.z, ang = Math.atan2(dx, dz);
    const arch = new THREE.Group(); const c = B.cuts[ci].bridge;
    const pl = M(G.cyl8, c, 0.12, 2.2, 0.12); pl.position.set(-1, 1.1, 0); arch.add(pl); const pr = pl.clone(); pr.position.x = 1; arch.add(pr);
    const top = new THREE.Mesh(G.box, [mat(c), mat(c), mat(c), mat(c), new THREE.MeshBasicMaterial({ map: GP.textTex(j.toll ? j.toll + 'c' : 'GO', '#2a1a4a', '#ffe14d', j.toll ? 64 : 60) }), new THREE.MeshBasicMaterial({ map: GP.textTex(j.toll ? j.toll + 'c' : 'GO', '#2a1a4a', '#ffe14d', j.toll ? 64 : 60) })]);
    top.scale.set(2.4, 0.7, 0.15); top.position.y = 2.3; arch.add(top);
    arch.position.set(a.x + dx * 0.5, 0, a.z + dz * 0.5); arch.rotation.y = ang; grp.add(GP.shadowy(arch, true, false));
  });
  g.land = g.land || openSpot(g);
  (decor[B.id] || GP.BOARD_DECOR[B.id])(grp, rnd, g);
  // star marker
  const star = GP.buildStar(1.2); grp.add(star); grp.userData.star = star;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 30, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide })); grp.add(beam); grp.userData.beam = beam;
  grp.userData.extent = Math.max(rx, rz);
  return grp;
};
})();
