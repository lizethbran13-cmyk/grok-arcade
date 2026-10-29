/* Grok Land Party - mini games. Host runs init/step/act/bot; every peer runs view(). */
(function () {
'use strict';
const GP = window.GP, G = GP.G, M = GP.M, mat = GP.mat, TAU = GP.TAU, clamp = GP.clamp, rand = GP.rand;
const hyp = Math.hypot;

/* ---------- shared movement (host for bots/host seat, client for its own avatar) ---------- */
GP.moveAvatar = function (p, inp, dt, A) {
  if (p.out || p.fall > 0) return;
  let jx = inp.jx || 0, jz = inp.jz || 0; const m = hyp(jx, jz); if (m > 1) { jx /= m; jz /= m; }
  const stun = p.st > 0;
  if (stun) { jx = 0; jz = 0; }
  const sp = (A.speed || 6) * (p.spd || 1);
  p.dc = Math.max(0, (p.dc || 0) - dt); p.d = Math.max(0, (p.d || 0) - dt);
  if (inp.a && A.aMove === 'dash' && p.dc <= 0 && !stun) {
    let dx = jx, dz = jz; if (hyp(dx, dz) < 0.2) { dx = Math.sin(p.f || 0); dz = Math.cos(p.f || 0); } const l = hyp(dx, dz) || 1;
    p.vx = (dx / l) * (A.dash || 14); p.vz = (dz / l) * (A.dash || 14); p.d = 0.25; p.dc = 1.1;
  }
  if (inp.a && A.aMove === 'jump' && (p.y || 0) <= 0.001 && !stun) p.vy = 8;
  const acc = A.ice ? 2.4 : 18;
  if (p.d <= 0) { p.vx += (jx * sp - p.vx) * Math.min(1, acc * dt); p.vz += (jz * sp - p.vz) * Math.min(1, acc * dt); }
  p.x += p.vx * dt; p.z += p.vz * dt;
  if (A.aMove === 'jump' || (p.y || 0) > 0 || (p.vy || 0) > 0) { p.vy = (p.vy || 0) - 24 * dt; p.y = (p.y || 0) + p.vy * dt; if (p.y <= 0) { p.y = 0; p.vy = 0; } }
  if (A.r) { const d = hyp(p.x, p.z); if (!A.fall && d > A.r - 0.4) { p.x *= (A.r - 0.4) / d; p.z *= (A.r - 0.4) / d; } }
  else if (A.w) { p.x = clamp(p.x, -A.w / 2 + 0.4, A.w / 2 - 0.4); p.z = clamp(p.z, -A.h / 2 + 0.4, A.h / 2 - 0.4); }
  if (hyp(p.vx, p.vz) > 0.6) p.f = Math.atan2(p.vx, p.vz);
};
function steer(p, tx, tz, k) { const dx = tx - p.x, dz = tz - p.z, d = hyp(dx, dz); if (d < 0.15) return { jx: 0, jz: 0 }; const s = (k || 1) * Math.min(1, d / 0.6); return { jx: dx / d * s, jz: dz / d * s }; }
function spread(n, r, a0) { const out = []; for (let i = 0; i < n; i++) { const a = (a0 || 0) + (i / n) * TAU + Math.PI / 2; out.push({ x: Math.cos(a) * r, z: Math.sin(a) * r }); } return out; }
function baseP(x, z) { return { x, z, y: 0, vx: 0, vz: 0, vy: 0, f: 0, st: 0, sc: 0, out: false, kk: 0, d: 0, dc: 0, inv: 0, spd: 1 }; }
function randIn(A, m) { if (A.r) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * (A.r - (m || 1)); return { x: Math.cos(a) * r, z: Math.sin(a) * r }; } return { x: rand(-A.w / 2 + (m || 1), A.w / 2 - (m || 1)), z: rand(-A.h / 2 + (m || 1), A.h / 2 - (m || 1)) }; }
const bspd = (d) => (d === 'easy' ? 0.72 : 0.92);
let EID = 1;

const DEFS = [];
const def = (o) => { DEFS.push(o); return o; };

/* 1. COIN DASH */
def({ id: 'coins', name: 'Coin Dash', type: 'ffa', ctrl: 'move', dur: 30, arena: { w: 16, h: 11, speed: 6.5 }, floor: 0x7ad35a, color: '#ffd23f',
  howto: 'Grab as many coins as you can! Big coins are worth 3.',
  init(mg, n) { const s = spread(n, 2.2); mg.p = s.map((q) => baseP(q.x, q.z)); mg.e = []; for (let i = 0; i < 9; i++) mg.e.push(this.coin(mg)); },
  coin(mg) { const q = randIn(this.arena, 0.9); return { id: EID++, x: q.x, z: q.z, v: Math.random() < 0.15 ? 3 : 1 }; },
  step(mg, dt, H) {
    mg.p.forEach((p, i) => { for (let k = 0; k < mg.e.length; k++) { const c = mg.e[k]; if (hyp(c.x - p.x, c.z - p.z) < 0.9) { p.sc += c.v; H.fx(c.v > 1 ? 'coins' : 'coin', i, c.x, c.z); mg.e[k] = this.coin(mg); } } });
  },
  bot(mg, i, diff, dt, B) {
    const p = mg.p[i];
    if (!B.tgt || !mg.e.find((c) => c.id === B.tgt) || (B.rt -= dt) < 0) {
      B.rt = diff === 'easy' ? 1.2 : 0.4; let best = null, bs = 1e9;
      mg.e.forEach((c) => { const s = hyp(c.x - p.x, c.z - p.z) / (diff === 'easy' ? 1 : c.v * 0.8) + (diff === 'easy' ? Math.random() * 5 : 0); if (s < bs) { bs = s; best = c; } });
      B.tgt = best && best.id;
    }
    const c = mg.e.find((q) => q.id === B.tgt); return c ? steer(p, c.x, c.z, bspd(diff)) : { jx: 0, jz: 0 };
  },
  score: (mg) => mg.p.map((p) => p.sc), label: (mg, i) => '' + mg.p[i].sc,
  view(V, mg) { V.sync('c', mg.e, (c) => { const o = GP.buildCoin(); if (c.v > 1) { o.scale.setScalar(1.7); o.add(GP.glowSprite(0xffe680, 2.2)); } return o; }, (o, c) => { o.position.set(c.x, 0.55 + Math.sin(V.t * 3 + c.id) * 0.12, c.z); o.rotation.y = V.t * 3 + c.id; }); },
});

/* 2. KING OF THE HILL */
def({ id: 'hill', name: 'King of the Hill', type: 'ffa', ctrl: 'move', aLabel: 'BUMP', dur: 30, arena: { r: 7.5, speed: 6, aMove: 'dash', dash: 14 }, floor: 0x9a7ad3, color: '#a78bfa',
  howto: 'Stand inside the glowing ring to score. Tap BUMP to dash and knock rivals out!',
  init(mg, n) { mg.p = spread(n, 4.5).map((q) => baseP(q.x, q.z)); mg.zone = { x: 0, z: 0, tx: 0, tz: 0, r: 2.1, nt: 6.5 }; },
  step(mg, dt, H) {
    const Z = mg.zone; Z.nt -= dt;
    if (Z.nt <= 0) { Z.nt = 6.5; let q; do { q = randIn({ r: 5.4 }, 0); } while (hyp(q.x - Z.tx, q.z - Z.tz) < 3.5); Z.tx = q.x; Z.tz = q.z; H.fx('select'); }
    Z.x += (Z.tx - Z.x) * Math.min(1, dt * 2.2); Z.z += (Z.tz - Z.z) * Math.min(1, dt * 2.2);
    const inside = mg.p.map((p) => !p.out && p.st <= 0 && hyp(p.x - Z.x, p.z - Z.z) < Z.r);
    const cnt = inside.filter(Boolean).length;
    mg.p.forEach((p, i) => { if (inside[i]) p.sc += dt * (cnt === 1 ? 1 : 0.45); });
    for (let i = 0; i < mg.p.length; i++) for (let j = 0; j < mg.p.length; j++) {
      if (i === j) continue; const a = mg.p[i], b = mg.p[j];
      if (a.d > 0 && b.st <= 0 && hyp(a.x - b.x, a.z - b.z) < 1.05) {
        const dx = b.x - a.x, dz = b.z - a.z, l = hyp(dx, dz) || 1;
        b.st = 0.55; H.kick(j, { x: b.x, z: b.z, vx: dx / l * 13, vz: dz / l * 13, d: 0.3 }); H.fx('bump', j, b.x, b.z);
      }
    }
  },
  bot(mg, i, diff, dt, B) {
    const p = mg.p[i], Z = mg.zone; B.ox = B.ox === undefined ? rand(-0.8, 0.8) : B.ox; B.oz = B.oz === undefined ? rand(-0.8, 0.8) : B.oz;
    const r = steer(p, Z.x + B.ox, Z.z + B.oz, bspd(diff));
    if (p.dc <= 0 && hyp(p.x - Z.x, p.z - Z.z) < 3.2 && Math.random() < (diff === 'easy' ? 0.006 : 0.04)) {
      for (let j = 0; j < mg.p.length; j++) { const o = mg.p[j]; if (j !== i && hyp(o.x - p.x, o.z - p.z) < 2.4) { const s = steer(p, o.x, o.z, 1); return { jx: s.jx, jz: s.jz, a: true }; } }
    }
    return r;
  },
  score: (mg) => mg.p.map((p) => Math.floor(p.sc * 10) / 10), label: (mg, i) => '' + Math.floor(mg.p[i].sc),
  build(V) { const ring = new THREE.Mesh(G.ring, new THREE.MeshBasicMaterial({ color: 0xfff27a, transparent: true, opacity: 0.9 })); ring.position.y = 0.06; V.grp.add(ring); const fill = new THREE.Mesh(G.circle, new THREE.MeshBasicMaterial({ color: 0xfff27a, transparent: true, opacity: 0.25, depthWrite: false })); fill.position.y = 0.05; V.grp.add(fill); const crown = GP.buildStar(0.6); V.grp.add(crown); V.k = { ring, fill, crown }; },
  view(V, mg) { const Z = mg.zone; V.k.ring.position.x = V.k.fill.position.x = Z.x; V.k.ring.position.z = V.k.fill.position.z = Z.z; V.k.ring.scale.setScalar(Z.r); V.k.fill.scale.setScalar(Z.r); V.k.fill.material.opacity = 0.2 + Math.sin(V.t * 5) * 0.08; V.k.crown.position.set(Z.x, 3 + Math.sin(V.t * 2) * 0.2, Z.z); V.k.crown.rotation.y = V.t * 2; },
});

/* 3. BLOCK DROP */
def({ id: 'drop', name: 'Block Drop', type: 'ffa', ctrl: 'move', dur: 35, arena: { w: 12, h: 12, speed: 6 }, floor: 0xd8c08a, color: '#ff9a3d',
  howto: 'Red shadows mean a block is falling there. Move away! 3 hits and you are out. Survive!',
  init(mg, n) { mg.p = spread(n, 2.5).map((q) => Object.assign(baseP(q.x, q.z), { lv: 3, ot: 0 })); mg.e = []; mg.wv = 2.0; mg.el = 0; },
  cell(c) { return -5 + c * 2; },
  step(mg, dt, H) {
    mg.el += dt; mg.wv -= dt;
    if (mg.wv <= 0) {
      const k = Math.min(14, 4 + Math.floor(mg.el / 3.2)); mg.wv = Math.max(1.25, 2.3 - mg.el * 0.035);
      const cells = GP.shuffle([...Array(36).keys()]).filter((c) => !mg.e.some((b) => b.c === c)).slice(0, k);
      cells.forEach((c) => mg.e.push({ id: EID++, c, x: this.cell(c % 6), z: this.cell(Math.floor(c / 6)), ph: 0, t: 1.25 }));
    }
    for (let k = mg.e.length - 1; k >= 0; k--) {
      const b = mg.e[k]; b.t -= dt;
      if (b.t <= 0) {
        if (b.ph === 0) { b.ph = 1; b.t = 0.3; }
        else if (b.ph === 1) {
          b.ph = 2; b.t = 0.7;
          mg.p.forEach((p, i) => { if (!p.out && p.inv <= 0 && Math.abs(p.x - b.x) < 1.15 && Math.abs(p.z - b.z) < 1.15) { p.lv--; p.inv = 1.6; p.st = 0.5; H.fx('hurt', i, p.x, p.z); if (p.lv <= 0) { p.out = true; p.ot = mg.el; H.fx('lose', i); } } });
          H.fx('thud');
        } else mg.e.splice(k, 1);
      }
    }
    mg.p.forEach((p) => { p.inv = Math.max(0, p.inv - dt); });
    const alive = mg.p.filter((p) => !p.out).length; if (mg.p.length > 1 && alive <= 1) H.end();
  },
  bot(mg, i, diff, dt, B) {
    const p = mg.p[i]; B.react = (B.react || 0) - dt;
    const danger = (x, z) => mg.e.some((b) => b.ph < 2 && !(B.ign && B.ign[b.id]) && Math.abs(x - b.x) < 1.35 && Math.abs(z - b.z) < 1.35);
    B.ign = B.ign || {}; mg.e.forEach((b) => { if (B.ign[b.id] === undefined) B.ign[b.id] = Math.random() < (diff === 'easy' ? 0.22 : 0.04); });
    if (B.react <= 0) {
      B.react = diff === 'easy' ? 0.55 : 0.18;
      if (!B.t || danger(B.t.x, B.t.z) || danger(p.x, p.z)) {
        let best = null, bd = 1e9;
        for (let c = 0; c < 36; c++) { const x = this.cell(c % 6), z = this.cell(Math.floor(c / 6)); if (danger(x, z)) continue; const d = hyp(x - p.x, z - p.z) + Math.random() * 0.5; if (d < bd) { bd = d; best = { x, z }; } }
        B.t = best || { x: p.x, z: p.z };
      }
    }
    return B.t ? steer(p, B.t.x, B.t.z, bspd(diff) + 0.08) : { jx: 0, jz: 0 };
  },
  score: (mg) => mg.p.map((p) => (p.out ? p.ot : 1000 + p.lv * 10)), label: (mg, i) => (mg.p[i].out ? 'OUT' : '\u2665'.repeat(mg.p[i].lv)),
  view(V, mg) {
    V.sync('b', mg.e, () => { const o = new THREE.Group(); const sh = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.5, depthWrite: false })); sh.scale.set(1.9, 1, 1.9); sh.position.y = 0.04; o.add(sh); const bl = M(G.box, mat(0x8a6a4a), 1.9, 1.2, 1.9); GP.shadowy(bl, true, false); o.add(bl); const top = M(G.box, mat(0xffd23f), 1.95, 0.25, 1.95); bl.add(top); top.position.y = 0.5; top.scale.set(1.02, 0.2, 1.02); o.userData = { sh, bl }; return o; },
      (o, b) => { o.position.set(b.x, 0, b.z); const u = o.userData; const k = b.ph === 0 ? 1 : b.ph === 1 ? b.t / 0.3 : 0; u.bl.position.y = 0.6 + k * 10; u.bl.visible = b.ph > 0 || b.t < 0.35; u.sh.material.opacity = b.ph === 2 ? 0 : 0.35 + Math.sin(V.t * 18) * 0.15; });
  },
});

/* 4. MASH RACE */
def({ id: 'mash', name: 'Mash Race', type: 'ffa', ctrl: 'mash', dur: 30, floor: 0x7ad35a, color: '#4ade80', aLabel: 'MASH!', noMove: true,
  howto: 'Tap MASH as fast as you can to run to the finish line!', bounds: { w: 20, h: 10 },
  init(mg, n) { mg.p = []; for (let i = 0; i < n; i++) mg.p.push(Object.assign(baseP(-8.5, (i - (n - 1) / 2) * 2.6), { pr: 0, fin: 0, lt: 0, f: Math.PI / 2 })); mg.el = 0; mg.goal = 95; },
  step(mg, dt, H) { mg.el += dt; mg.p.forEach((p) => { p.x = -8.5 + (p.pr / mg.goal) * 17; }); if (mg.p.every((p) => p.fin)) H.end(); },
  act(mg, i, v, H) { const p = mg.p[i]; if (p.fin || mg.el - p.lt < 0.055) return; p.lt = mg.el; p.pr++; if (p.pr >= mg.goal) { p.fin = mg.el; H.fx('right', i); } },
  bot(mg, i, diff, dt, B, H) { B.acc = (B.acc || 0) + dt * (diff === 'easy' ? rand(4, 6.5) : rand(6.2, 8.4)); while (B.acc >= 1) { B.acc--; this.act(mg, i, 1, H); } return null; },
  score: (mg) => mg.p.map((p) => (p.fin ? 1000 - p.fin : p.pr)), label: (mg, i) => (mg.p[i].fin ? 'DONE' : Math.floor(mg.p[i].pr / mg.goal * 100) + '%'),
  pose: (mg, i, V) => (mg.p[i].fin ? 'win' : mg.el - mg.p[i].lt < 0.25 ? 'run' : 'idle'),
  build(V, mg) {
    mg.p.forEach((p, i) => { const lane = M(G.box, mat(i % 2 ? 0xd88a5a : 0xe89a6a), 19, 0.1, 2.2); lane.position.set(0, 0.06, p.z); V.grp.add(lane); });
    const fin = new THREE.Mesh(G.box, new THREE.MeshBasicMaterial({ map: GP.canvasTex(64, 64, (g) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#111' : '#fff'; g.fillRect(x * 8, y * 8, 8, 8); } }) }));
    fin.scale.set(0.8, 0.12, mg.p.length * 2.6); fin.position.set(8.6, 0.08, 0); V.grp.add(fin);
    const arch = M(G.box, 0xff4fd8, 0.3, 0.3, mg.p.length * 2.6 + 1); arch.position.set(8.6, 3, 0); V.grp.add(arch);
    [-1, 1].forEach((s) => { const post = M(G.cyl8, 0xffffff, 0.15, 3, 0.15); post.position.set(8.6, 1.5, s * (mg.p.length * 1.3 + 0.5)); V.grp.add(post); });
  },
});

/* 5. MEMORY SWITCH */
const ICONS = ['star', 'heart', 'coin', 'shroom', 'moon', 'gem'];
GP.ICONS = ICONS;
def({ id: 'memory', name: 'Memory Switch', type: 'ffa', ctrl: 'pick', dur: 40, noMove: true, floor: 0x5a8ad3, color: '#3ff0ff', bounds: { w: 12, h: 8 },
  howto: 'Remember where each picture is. When the tiles flip, tap the tile hiding the picture asked for!',
  init(mg, n) { mg.p = []; for (let i = 0; i < n; i++) mg.p.push(Object.assign(baseP((i - (n - 1) / 2) * 2.4, 2.5), { pk: -1, pt: 0, ok: 0 })); mg.r = 0; mg.rounds = 4; this.round(mg); },
  round(mg) { mg.tiles = GP.shuffle(ICONS.slice()); mg.q = Math.floor(Math.random() * 6); mg.ph2 = 'show'; mg.tt = mg.r < 2 ? 3.2 : 2.6; mg.p.forEach((p) => { p.pk = -1; p.pt = 0; p.ok = 0; }); },
  step(mg, dt, H) {
    mg.tt -= dt;
    if (mg.ph2 === 'ask') mg.el = (mg.el || 0) + dt;
    if (mg.ph2 === 'show' && mg.tt <= 0) { mg.ph2 = 'ask'; mg.tt = 5.5; mg.el = 0; H.fx('select'); }
    else if (mg.ph2 === 'ask' && (mg.tt <= 0 || mg.p.every((p) => p.pk >= 0))) {
      mg.ph2 = 'reveal'; mg.tt = 1.9; let first = -1, ft = 1e9;
      mg.p.forEach((p, i) => { p.ok = p.pk === mg.q ? 1 : 0; if (p.ok) { p.sc += 1; if (p.pt < ft) { ft = p.pt; first = i; } } });
      if (first >= 0 && mg.p.filter((p) => p.ok).length > 1) mg.p[first].sc += 0.5;
      H.fx(first >= 0 ? 'right' : 'wrong');
    } else if (mg.ph2 === 'reveal' && mg.tt <= 0) { mg.r++; if (mg.r >= mg.rounds) H.end(); else this.round(mg); }
  },
  act(mg, i, v) { const p = mg.p[i]; if (mg.ph2 !== 'ask' || p.pk >= 0) return; v = v | 0; if (v < 0 || v > 5) return; p.pk = v; p.pt = mg.el || 0; },
  bot(mg, i, diff, dt, B) {
    if (mg.ph2 !== 'ask') { B.at = rand(1.0, 3.2); return null; }
    if ((mg.el || 0) > B.at && mg.p[i].pk < 0) { const ok = Math.random() < (diff === 'easy' ? 0.5 : 0.75); let v = mg.q; if (!ok) { do { v = Math.floor(Math.random() * 6); } while (v === mg.q); } this.act(mg, i, v); }
    return null;
  },
  score: (mg) => mg.p.map((p) => p.sc), label: (mg, i) => '' + mg.p[i].sc,
  pose: (mg, i) => (mg.ph2 === 'reveal' ? (mg.p[i].ok ? 'win' : 'sad') : 'idle'),
  build(V) { const board = M(G.box, 0x2a1a5a, 9, 5.5, 0.4); board.position.set(0, 3, -1.5); V.grp.add(board); },
});

/* 6. HOT POTATO */
def({ id: 'potato', name: 'Hot Potato', type: 'ffa', ctrl: 'move', dur: 35, arena: { r: 6.8, speed: 6 }, floor: 0xe0705a, color: '#ff4d6d',
  howto: 'If you have the bomb, touch a rival to pass it! Do not hold it when it explodes.',
  init(mg, n) { mg.p = spread(n, 4).map((q) => Object.assign(baseP(q.x, q.z), { bm: 0, ht: 0 })); mg.hold = Math.floor(Math.random() * n); mg.cool = 1; mg.pause = 0; mg.left = mg.t || this.dur; this.fuse(mg); },
  timeUp(mg, H) { if (mg.hold >= 0) { const b = mg.p[mg.hold]; b.bm++; b.st = 1.3; mg.boomed = mg.hold; mg.hold = -1; mg.pause = 99; H.fx('boom', mg.boomed, b.x, b.z); } },
  fuse(mg) { mg.fuse = Math.min(rand(8, 12), mg.left); mg.p.forEach((p, i) => { p.spd = i === mg.hold ? 1.12 : 1; }); },
  step(mg, dt, H) {
    mg.left -= dt;
    if (mg.pause > 0) { mg.pause -= dt; if (mg.pause <= 0) { const c = mg.p.map((_, i) => i).filter((i) => i !== mg.boomed); mg.hold = GP.pick(c); mg.cool = 1; this.fuse(mg); H.fx('select'); } return; }
    mg.fuse -= dt; mg.cool -= dt; const h = mg.p[mg.hold]; h.ht += dt;
    if (mg.cool <= 0) for (let j = 0; j < mg.p.length; j++) { const o = mg.p[j]; if (j !== mg.hold && o.st <= 0 && hyp(o.x - h.x, o.z - h.z) < 1.05) { mg.hold = j; mg.cool = 0.8; mg.p.forEach((p, k) => { p.spd = k === j ? 1.12 : 1; }); H.fx('bump', j, o.x, o.z); break; } }
    if (mg.fuse <= 0) { const b = mg.p[mg.hold]; b.bm++; b.st = 1.3; mg.boomed = mg.hold; mg.hold = -1; mg.pause = mg.left > 2.5 ? 1.6 : 99; H.fx('boom', mg.boomed, b.x, b.z); mg.p.forEach((p) => { p.spd = 1; }); if (mg.left <= 0.05) H.end(); }
  },
  bot(mg, i, diff, dt, B) {
    const p = mg.p[i];
    if (mg.hold === i) { let t = null, bd = 1e9; mg.p.forEach((o, j) => { if (j !== i && o.st <= 0) { const d = hyp(o.x - p.x, o.z - p.z); if (d < bd) { bd = d; t = o; } } }); return t ? steer(p, t.x, t.z, bspd(diff) + 0.05) : null; }
    if (mg.hold < 0) return { jx: 0, jz: 0 };
    const h = mg.p[mg.hold]; let dx = p.x - h.x, dz = p.z - h.z; const d = hyp(dx, dz) || 1; dx /= d; dz /= d;
    const r = hyp(p.x, p.z); if (r > 4.2) { dx -= p.x / r * 1.3; dz -= p.z / r * 1.3; dx += -dz * 0.8; dz += dx * 0.8; }
    B.w = (B.w || 0) + dt; const wob = diff === 'easy' ? 0.9 : 0.3; dx += Math.sin(B.w * 1.7 + i) * wob; dz += Math.cos(B.w * 1.3 + i) * wob;
    const l = hyp(dx, dz) || 1; const k = d > 4.5 ? 0.45 : bspd(diff); return { jx: dx / l * k, jz: dz / l * k };
  },
  score: (mg) => mg.p.map((p) => -p.bm * 100 - p.ht), label: (mg, i) => 'BOOM x' + mg.p[i].bm,
  build(V) { V.k = { bomb: GP.buildBomb(), flash: GP.glowSprite(0xffb020, 0.1) }; V.grp.add(V.k.bomb); V.grp.add(V.k.flash); V.k.fl = 0; },
  view(V, mg) {
    const b = V.k.bomb; if (mg.hold >= 0) { const h = V.pos(mg.hold); b.visible = true; b.position.set(h.x, h.y + 2.0, h.z); const rate = mg.fuse < 2.5 ? 16 : mg.fuse < 5 ? 9 : 5; b.userData.ball.material = mat(Math.sin(V.t * rate) > 0.3 ? 0xff4040 : 0x22223a); b.rotation.y = V.t * 2; } else b.visible = false;
    if (mg.hold < 0 && mg.boomed !== undefined && V.k.lb !== mg.left) { if (V.k.fl <= 0 && mg.pause > 1.4) { V.k.fl = 0.6; const h = V.pos(mg.boomed); V.k.flash.position.set(h.x, 1.5, h.z); } }
    V.k.fl -= V.dt; V.k.flash.scale.setScalar(V.k.fl > 0 ? 9 * (1 - V.k.fl / 0.6) + 2 : 0.01); V.k.flash.material.opacity = Math.max(0, V.k.fl / 0.6);
  },
});

/* 7. STOMP PARTY */
def({ id: 'stomp', name: 'Stomp Party', type: 'ffa', ctrl: 'move', aLabel: 'JUMP', dur: 30, arena: { w: 15, h: 11, speed: 6, aMove: 'jump' }, floor: 0x6ac35a, color: '#ff7a3d',
  howto: 'Tap JUMP and land on the mushroom walkers to stomp them. Gold ones are worth 3! Don\u2019t bump into them.',
  init(mg, n) { mg.p = spread(n, 2).map((q) => baseP(q.x, q.z)); mg.e = []; for (let i = 0; i < 6; i++) mg.e.push(this.walker()); },
  walker() { const q = randIn(this.arena, 1); const a = Math.random() * TAU, s = rand(1.4, 2.2); return { id: EID++, x: q.x, z: q.z, vx: Math.cos(a) * s, vz: Math.sin(a) * s, g: Math.random() < 0.15 ? 1 : 0, sq: 0, t: rand(1, 3) }; },
  step(mg, dt, H) {
    const A = this.arena;
    for (let k = mg.e.length - 1; k >= 0; k--) {
      const w = mg.e[k];
      if (w.sq > 0) { w.sq -= dt; if (w.sq <= 0) mg.e[k] = this.walker(); continue; }
      w.t -= dt; if (w.t <= 0) { w.t = rand(1, 3); const a = Math.random() * TAU, s = rand(1.4, 2.2); w.vx = Math.cos(a) * s; w.vz = Math.sin(a) * s; }
      w.x += w.vx * dt; w.z += w.vz * dt;
      if (Math.abs(w.x) > A.w / 2 - 0.6) { w.vx = -w.vx; w.x = clamp(w.x, -A.w / 2 + 0.6, A.w / 2 - 0.6); }
      if (Math.abs(w.z) > A.h / 2 - 0.6) { w.vz = -w.vz; w.z = clamp(w.z, -A.h / 2 + 0.6, A.h / 2 - 0.6); }
      mg.p.forEach((p, i) => {
        if (w.sq > 0 || p.out) return; const d = hyp(p.x - w.x, p.z - w.z);
        if (p.y > 0.12 && p.vy < 0 && d < 1.05) { w.sq = 0.6; p.sc += w.g ? 3 : 1; H.fx('stomp', i, w.x, w.z); }
        else if (p.y < 0.3 && d < 0.75 && p.inv <= 0 && p.st <= 0) { p.st = 0.7; p.inv = 1.6; H.fx('hurt', i, p.x, p.z); w.vx = -w.vx; w.vz = -w.vz; }
      });
    }
    mg.p.forEach((p) => { p.inv = Math.max(0, p.inv - dt); });
  },
  bot(mg, i, diff, dt, B) {
    const p = mg.p[i]; let t = null, bd = 1e9;
    mg.e.forEach((w) => { if (w.sq > 0) return; const d = hyp(w.x - p.x, w.z - p.z) - (diff === 'normal' && w.g ? 3 : 0); if (d < bd) { bd = d; t = w; } });
    if (!t) return { jx: 0, jz: 0 };
    const d = hyp(t.x - p.x, t.z - p.z), lead = 0.35;
    const r = steer(p, t.x + t.vx * lead, t.z + t.vz * lead, bspd(diff));
    if (p.y <= 0 && p.st <= 0 && d < (diff === 'easy' ? rand(1.0, 2.6) : 1.9) && d > 0.6) r.a = true;
    return r;
  },
  score: (mg) => mg.p.map((p) => p.sc), label: (mg, i) => '' + mg.p[i].sc,
  view(V, mg) { V.sync('w', mg.e, (w) => GP.buildWalker(w.g ? 0xffc21a : 0xa0522d).root, (o, w) => { o.position.set(w.x, 0, w.z); o.rotation.y = Math.atan2(w.vx, w.vz); const s = w.sq > 0 ? 0.25 : 1; o.scale.set(1.1, 1.1 * s, 1.1); o.children[0].position.y = w.sq > 0 ? 0 : Math.abs(Math.sin(V.t * 8 + w.id)) * 0.1; }); },
});

/* 8. ICE SUMO */
def({ id: 'ice', name: 'Ice Sumo', type: 'ffa', ctrl: 'move', aLabel: 'DASH', dur: 30, arena: { r: 6.6, speed: 7, ice: true, fall: true, aMove: 'dash', dash: 11 }, floor: 0xbfeaff, below: 0x2a6ab0, color: '#9fe6ff',
  howto: 'Slippery ice! Bump rivals off the edge with DASH and try not to fall in yourself.',
  init(mg, n) { mg.p = spread(n, 3.2).map((q) => Object.assign(baseP(q.x, q.z), { fl: 0, ko: 0, lt: -1, ltt: 0, fall: 0 })); },
  step(mg, dt, H) {
    const A = this.arena;
    mg.p.forEach((p, i) => {
      p.inv = Math.max(0, p.inv - dt); p.ltt -= dt;
      if (p.fall > 0) { p.fall -= dt; if (p.fall <= 0) { const q = randIn({ r: 2.5 }, 0); p.inv = 1.2; H.kick(i, { x: q.x, z: q.z, vx: 0, vz: 0, y: 0, vy: 0 }); } return; }
      if (hyp(p.x, p.z) > A.r + 0.25) { p.fall = 1.5; p.fl++; if (p.lt >= 0 && p.ltt > 0) mg.p[p.lt].ko++; p.lt = -1; H.fx('splash', i, p.x, p.z); }
    });
    for (let i = 0; i < mg.p.length; i++) for (let j = i + 1; j < mg.p.length; j++) {
      const a = mg.p[i], b = mg.p[j]; if (a.fall > 0 || b.fall > 0 || a.inv > 0 || b.inv > 0) continue;
      const dx = b.x - a.x, dz = b.z - a.z, d = hyp(dx, dz); if (d > 1.0 || d < 0.001) continue;
      const nx = dx / d, nz = dz / d, va = a.vx * nx + a.vz * nz, vb = b.vx * nx + b.vz * nz, rel = va - vb;
      if (rel <= 0) continue; const k = 1.25 + (a.d > 0 || b.d > 0 ? 0.6 : 0), imp = rel * k + 1.5;
      a.lt = j; a.ltt = 3; b.lt = i; b.ltt = 3;
      H.kick(i, { x: a.x - nx * (1 - d) / 2, z: a.z - nz * (1 - d) / 2, vx: a.vx - nx * imp * (vb > va ? 1 : 0.55), vz: a.vz - nz * imp * (vb > va ? 1 : 0.55), d: 0 });
      H.kick(j, { x: b.x + nx * (1 - d) / 2, z: b.z + nz * (1 - d) / 2, vx: b.vx + nx * imp, vz: b.vz + nz * imp, d: 0 });
      H.fx('bump', i, (a.x + b.x) / 2, (a.z + b.z) / 2);
    }
  },
  bot(mg, i, diff, dt, B) {
    const p = mg.p[i], A = this.arena, r = hyp(p.x, p.z);
    if (r > A.r * (diff === 'easy' ? 0.62 : 0.55)) return steer(p, 0, 0, 1);
    let t = null, bd = 1e9; mg.p.forEach((o, j) => { if (j !== i && o.fall <= 0) { const d = hyp(o.x - p.x, o.z - p.z); if (d < bd) { bd = d; t = o; } } });
    if (!t) return steer(p, 0, 0, 0.5);
    const s = steer(p, t.x, t.z, diff === 'easy' ? 0.55 : 0.85);
    if (bd < 2.6 && p.dc <= 0 && hyp(t.x, t.z) > 2 && Math.random() < (diff === 'easy' ? 0.01 : 0.05)) s.a = true;
    return s;
  },
  score: (mg) => mg.p.map((p) => -p.fl * 100 + p.ko * 10), label: (mg, i) => 'FALLS ' + mg.p[i].fl,
});

/* 9. SIMON SAYS */
const SIMON_C = ['#ff4455', '#3a8dff', '#3fd36a', '#ffd23f'];
GP.SIMON_C = SIMON_C;
def({ id: 'simon', name: 'Simon Says', type: 'ffa', ctrl: 'simon', dur: 45, noMove: true, floor: 0x3a3a6a, color: '#ffe14d', bounds: { w: 12, h: 9 },
  howto: 'Watch the colors light up, then tap them in the same order. One mistake and you are out!',
  init(mg, n) { mg.p = []; for (let i = 0; i < n; i++) mg.p.push(Object.assign(baseP((i - (n - 1) / 2) * 2.4, 3), { pg: 0, dn: 0 })); mg.seq = []; for (let i = 0; i < 3; i++) mg.seq.push(Math.floor(Math.random() * 4)); mg.ph2 = 'gap'; mg.tt = 1.0; mg.si = -1; mg.el = 0; mg.rd = 0; },
  step(mg, dt, H) {
    mg.tt -= dt; mg.el += dt;
    const on = 0.55 - Math.min(0.2, mg.seq.length * 0.02), off = 0.18;
    if (mg.ph2 === 'gap' && mg.tt <= 0) { mg.ph2 = 'show'; mg.si = 0; mg.tt = on + off; mg.lit = 1; }
    else if (mg.ph2 === 'show') {
      mg.lit = mg.tt > off ? 1 : 0;
      if (mg.tt <= 0) { mg.si++; mg.tt = on + off; mg.lit = 1; if (mg.si >= mg.seq.length) { mg.ph2 = 'input'; mg.si = -1; mg.lit = 0; mg.tt = 2.2 + mg.seq.length * 1.0; mg.it = 0; mg.p.forEach((p) => { p.pg = 0; p.dn = 0; }); } }
    } else if (mg.ph2 === 'input') {
      mg.it += dt;
      const live = mg.p.filter((p) => !p.out);
      if (mg.tt <= 0 || live.every((p) => p.dn)) {
        mg.p.forEach((p, i) => { if (!p.out && !p.dn) { p.out = true; H.fx('wrong', i); } else if (!p.out) p.sc++; });
        mg.rd++;
        if (mg.p.every((p) => p.out) || (mg.p.length > 1 && mg.p.filter((p) => !p.out).length === 0)) { H.end(); return; }
        mg.seq.push(Math.floor(Math.random() * 4)); mg.ph2 = 'gap'; mg.tt = 1.1;
      }
    }
  },
  act(mg, i, v, H) {
    const p = mg.p[i]; if (mg.ph2 !== 'input' || p.out || p.dn) return; v = v | 0;
    if (v === mg.seq[p.pg]) { p.pg++; if (p.pg >= mg.seq.length) { p.dn = mg.it; } }
    else { p.out = true; H.fx('wrong', i); }
  },
  bot(mg, i, diff, dt, B, H) {
    const p = mg.p[i]; if (mg.ph2 !== 'input' || p.out || p.dn) { B.nt = rand(0.5, 0.9); return null; }
    B.nt -= dt; if (B.nt > 0) return null; B.nt = rand(0.38, 0.7);
    const fail = (diff === 'easy' ? 0.05 : 0.025) + mg.seq.length * (diff === 'easy' ? 0.014 : 0.006);
    this.act(mg, i, Math.random() < fail ? (mg.seq[p.pg] + 1) % 4 : mg.seq[p.pg], H); return null;
  },
  score: (mg) => mg.p.map((p) => p.sc * 100 - (p.dn || 0)), label: (mg, i) => (mg.p[i].out ? 'OUT ' : '') + mg.p[i].sc,
  pose: (mg, i) => (mg.p[i].out ? 'sad' : mg.ph2 === 'input' && mg.p[i].dn ? 'win' : 'idle'),
  build(V) { V.k = []; for (let c = 0; c < 4; c++) { const pad = M(G.cyl, mat(GP.colorNum(SIMON_C[c]), { emissive: 0x000000 }), 1.6, 0.3, 1.6); pad.material = pad.material.clone(); pad.position.set(-4.5 + c * 3, 0.15, -1); V.grp.add(pad); V.k.push(pad); } },
  view(V, mg) {
    const cur = mg.ph2 === 'show' && mg.lit ? mg.seq[mg.si] : -1;
    V.k.forEach((pad, c) => { const lit = c === cur; pad.position.y = lit ? 0.45 : 0.15; if (pad.material.emissive) pad.material.emissive.setHex(lit ? 0x777777 : 0x000000); });
    const key = mg.ph2 + mg.si + ':' + mg.lit; if (cur >= 0 && V.k.last !== key) GP.Snd.fx('pad', cur); V.k.last = key;
  },
});

/* 10. BALLOON POP */
def({ id: 'balloon', name: 'Balloon Pop', type: 'ffa', ctrl: 'move', aLabel: 'JUMP', dur: 30, arena: { w: 14, h: 10, speed: 6, aMove: 'jump' }, floor: 0x8ad3ff, color: '#ff6ae0',
  howto: 'Stand under a balloon and tap JUMP to pop it. Gold = 3 points. Avoid the black bomb balloons!',
  init(mg, n) { mg.p = spread(n, 2).map((q) => baseP(q.x, q.z)); mg.e = []; for (let i = 0; i < 7; i++) mg.e.push(this.balloon()); },
  balloon() { const q = randIn(this.arena, 1.2), r = Math.random(); return { id: EID++, x: q.x, z: q.z, k: r < 0.14 ? 'g' : r < 0.32 ? 'b' : 'n', c: Math.floor(Math.random() * 4), vx: rand(-0.6, 0.6), vz: rand(-0.6, 0.6), life: rand(7, 10), up: 0 }; },
  step(mg, dt, H) {
    const A = this.arena;
    for (let k = mg.e.length - 1; k >= 0; k--) {
      const b = mg.e[k]; b.life -= dt; b.x = clamp(b.x + b.vx * dt, -A.w / 2 + 0.8, A.w / 2 - 0.8); b.z = clamp(b.z + b.vz * dt, -A.h / 2 + 0.8, A.h / 2 - 0.8);
      if (b.life < 0) { b.up += dt * 2; if (b.up > 4) { mg.e[k] = this.balloon(); } continue; }
      for (let i = 0; i < mg.p.length; i++) {
        const p = mg.p[i]; if (p.st > 0 || p.y < 0.55 || hyp(p.x - b.x, p.z - b.z) > 1.05) continue;
        if (b.k === 'b') { p.st = 1.2; p.sc = Math.max(0, p.sc - 2); H.fx('boom', i, b.x, b.z); } else { p.sc += b.k === 'g' ? 3 : 1; H.fx('pop', i, b.x, b.z); }
        mg.e[k] = this.balloon(); break;
      }
    }
  },
  bot(mg, i, diff, dt, B) {
    const p = mg.p[i]; let t = null, bd = 1e9;
    mg.e.forEach((b) => { if (b.k === 'b' || b.life < 0.5) return; const d = hyp(b.x - p.x, b.z - p.z) - (diff === 'normal' && b.k === 'g' ? 3 : 0) + (diff === 'easy' ? Math.random() * 2 : 0); if (d < bd) { bd = d; t = b; } });
    if (!t) return { jx: 0, jz: 0 };
    const r = steer(p, t.x, t.z, bspd(diff)); const d = hyp(t.x - p.x, t.z - p.z);
    const bomb = mg.e.find((b) => b.k === 'b' && hyp(b.x - p.x, b.z - p.z) < 1.3);
    if (d < (diff === 'easy' ? 0.55 : 0.75) && p.y <= 0 && !bomb && Math.random() < (diff === 'easy' ? 0.15 : 0.6)) r.a = true;
    return r;
  },
  score: (mg) => mg.p.map((p) => p.sc), label: (mg, i) => '' + mg.p[i].sc,
  view(V, mg) {
    const cols = [0xff4fd8, 0x3ff0ff, 0x4ade80, 0xff7a3d];
    V.sync('bl', mg.e, (b) => { const o = new THREE.Group(); const ball = M(G.sphere, mat(b.k === 'g' ? 0xffd23f : b.k === 'b' ? 0x222233 : cols[b.c], { emissive: b.k === 'g' ? 0x6a4a00 : 0x111111 }), 0.48, 0.58, 0.48); o.add(ball); const str = M(G.cyl8, 0xffffff, 0.015, 0.9, 0.015); str.position.y = -1.0; o.add(str); if (b.k === 'b') { const sk = M(G.box, 0xffffff, 0.3, 0.06, 0.06); sk.position.z = 0.45; sk.rotation.z = 0.7; o.add(sk); const sk2 = sk.clone(); sk2.rotation.z = -0.7; o.add(sk2); } const sh = GP.blob(0.4, 0.25); o.add(sh); o.userData.sh = sh; return o; },
      (o, b) => { o.position.set(b.x, 2.15 + Math.sin(V.t * 2 + b.id) * 0.12 + b.up, b.z); o.userData.sh.position.y = -o.position.y + 0.03; });
  },
});

/* 11. QUICK DRAW */
def({ id: 'quick', name: 'Quick Draw', type: 'ffa', ctrl: 'tap', dur: 40, noMove: true, floor: 0xd8b07a, color: '#ffe14d', aLabel: 'TAP!', bounds: { w: 12, h: 8 },
  howto: 'Wait for the big "!" then tap as fast as you can. Tap too early and you sit out that round!',
  init(mg, n) { mg.p = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU + Math.PI / 2; mg.p.push(Object.assign(baseP(Math.cos(a) * 3, Math.sin(a) * 2.2), { rt: 0, fs: 0, w: 0, f: Math.atan2(-Math.cos(a), -Math.sin(a)) })); } mg.r = 0; mg.rounds = 5; mg.go = 0; this.round(mg); },
  round(mg) { mg.ph2 = 'wait'; mg.tt = rand(1.8, 3.8); mg.win = -1; mg.p.forEach((p) => { p.rt = 0; p.fs = 0; }); },
  step(mg, dt, H) {
    mg.tt -= dt;
    if (mg.ph2 === 'wait' && mg.tt <= 0) { mg.ph2 = 'go'; mg.go++; mg.tt = 2.2; mg.gt = 0; }
    else if (mg.ph2 === 'go') {
      mg.gt += dt;
      if (mg.tt <= 0 || mg.p.every((p) => p.fs || p.rt)) {
        let best = -1, bt = 1e9; mg.p.forEach((p, i) => { if (!p.fs && p.rt && p.rt < bt) { bt = p.rt; best = i; } });
        mg.win = best; if (best >= 0) { mg.p[best].w++; H.fx('right', best); }
        mg.ph2 = 'res'; mg.tt = 1.7;
      }
    } else if (mg.ph2 === 'res' && mg.tt <= 0) { mg.r++; if (mg.r >= mg.rounds) H.end(); else this.round(mg); }
  },
  act(mg, i, v, H) {
    const p = mg.p[i]; if (p.fs || p.rt) return;
    if (mg.ph2 === 'wait' || v === 'early') { if (mg.ph2 !== 'res') { p.fs = 1; H.fx('wrong', i); } return; }
    if (mg.ph2 === 'go') p.rt = clamp(+v || 999, 120, 5000);
  },
  bot(mg, i, diff, dt, B, H) {
    if (mg.ph2 !== 'go') { B.rt = diff === 'easy' ? rand(430, 680) : rand(290, 430); if (mg.ph2 === 'wait' && Math.random() < (diff === 'easy' ? 0.0015 : 0.0006)) this.act(mg, i, 'early', H); return null; }
    if (mg.gt * 1000 >= B.rt && !mg.p[i].rt) this.act(mg, i, Math.round(B.rt), H); return null;
  },
  score: (mg) => mg.p.map((p) => p.w), label: (mg, i) => 'WINS ' + mg.p[i].w,
  pose: (mg, i) => (mg.ph2 === 'res' ? (mg.win === i ? 'win' : mg.p[i].fs ? 'sad' : 'idle') : mg.p[i].fs ? 'sad' : 'idle'),
  build(V) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GP.textTex('!', null, '#ff3b5c', 120), transparent: true, depthTest: false })); sp.scale.setScalar(4); sp.position.set(0, 3.5, 0); sp.renderOrder = 998; V.grp.add(sp); V.k = { sp }; },
  view(V, mg) { V.k.sp.visible = mg.ph2 === 'go'; V.k.sp.scale.setScalar(4 + Math.sin(V.t * 20) * 0.3); if (mg.ph2 === 'go' && V.k.go !== mg.go) { V.k.go = mg.go; GP.Snd.fx('whistle'); } },
});

/* 12. CANNON CHAOS (1 vs 2) */
def({ id: 'cannon', name: 'Cannon Chaos', type: '1v2', ctrl: 'move', aLabel: 'FIRE', dur: 25, arena: { w: 14, h: 10, speed: 6 }, floor: 0x9ac36a, color: '#ff4d4d',
  howto: 'SOLO: steer the target and FIRE cannonballs. TEAM: run from the shadows! Team wins if anyone survives.',
  howtoSolo: 'You are the CANNON! Move the target and tap FIRE. Hit both runners before time is up!', howtoTeam: 'Run! Dodge the red target and the falling cannonballs. Survive until time is up!',
  init(mg, n, solo) {
    mg.solo = solo; mg.p = []; const team = []; for (let i = 0; i < n; i++) if (i !== solo) team.push(i);
    for (let i = 0; i < n; i++) { const isS = i === solo, k = team.indexOf(i); mg.p.push(Object.assign(baseP(isS ? 0 : (k - (team.length - 1) / 2) * 3, isS ? -2 : 2.5), { hp: team.length === 1 ? 3 : 2, cd: 0, spd: isS ? 1.25 : 1 })); }
    mg.e = [];
  },
  step(mg, dt, H) {
    const s = mg.p[mg.solo]; s.cd = Math.max(0, s.cd - dt);
    for (let k = mg.e.length - 1; k >= 0; k--) {
      const b = mg.e[k]; b.t -= dt;
      if (b.t <= 0) { mg.e.splice(k, 1); H.fx('boom', -1, b.x, b.z); mg.p.forEach((p, i) => { if (i === mg.solo || p.out || p.inv > 0) return; if (hyp(p.x - b.x, p.z - b.z) < 1.35) { p.hp--; p.inv = 1.5; p.st = 0.5; H.fx('hurt', i, p.x, p.z); if (p.hp <= 0) p.out = true; } }); }
    }
    mg.p.forEach((p) => { p.inv = Math.max(0, p.inv - dt); });
    if (mg.p.every((p, i) => i === mg.solo || p.out)) H.end();
  },
  act(mg, i, v, H) { if (i !== mg.solo) return; const s = mg.p[i]; if (s.cd > 0) return; s.cd = 0.9; mg.e.push({ id: EID++, x: s.x, z: s.z, t: 1.0 }); H.fx('shoot', i); },
  bot(mg, i, diff, dt, B, H) {
    const p = mg.p[i];
    if (i === mg.solo) {
      let t = null, bd = 1e9; mg.p.forEach((o, j) => { if (j !== i && !o.out) { const d = hyp(o.x - p.x, o.z - p.z) + (o.inv > 0 ? 6 : 0); if (d < bd) { bd = d; t = o; } } });
      if (!t) return null; B.err = B.err || { x: 0, z: 0 }; B.et = (B.et || 0) - dt;
      if (B.et <= 0) { B.et = 0.8; const e = diff === 'easy' ? 1.9 : 0.9; B.err = { x: rand(-e, e), z: rand(-e, e) }; }
      const lead = diff === 'easy' ? 0.3 : 0.8, ax = t.x + t.vx * lead + B.err.x, az = t.z + t.vz * lead + B.err.z;
      const r = steer(p, ax, az, diff === 'easy' ? 0.62 : 0.85); if (hyp(ax - p.x, az - p.z) < 0.9 && p.cd <= 0 && Math.random() < (diff === 'easy' ? 0.06 : 0.25)) this.act(mg, i, 1, H);
      return r;
    }
    const s = mg.p[mg.solo]; let dx = p.x - s.x, dz = p.z - s.z;
    mg.e.forEach((b) => { const d = hyp(p.x - b.x, p.z - b.z); if (d < 2.4) { dx += (p.x - b.x) / (d + 0.1) * 3; dz += (p.z - b.z) / (d + 0.1) * 3; } });
    if (Math.abs(p.x) > 5.5) dx -= Math.sign(p.x) * 2; if (Math.abs(p.z) > 3.6) dz -= Math.sign(p.z) * 2;
    B.w = (B.w || 0) + dt; dx += Math.sin(B.w * 1.3 + i * 2) * 0.8; dz += Math.cos(B.w * 1.1 + i) * 0.8;
    const l = hyp(dx, dz) || 1, k = hyp(p.x - s.x, p.z - s.z) > 4.5 ? 0.4 : bspd(diff); return { jx: dx / l * k, jz: dz / l * k };
  },
  score: (mg) => { const teamWin = mg.p.some((p, i) => i !== mg.solo && !p.out); return mg.p.map((p, i) => ((i === mg.solo) !== teamWin ? 1 : 0)); },
  label: (mg, i) => (i === mg.solo ? 'CANNON' : mg.p[i].out ? 'OUT' : '\u2665'.repeat(mg.p[i].hp)),
  hideAvatar: (mg, i) => i === mg.solo,
  build(V, mg) {
    const tw = new THREE.Group(); const base = M(G.cyl8, 0x7a6a8a, 1.3, 2.6, 1.3); base.position.y = 1.3; tw.add(base); const can = M(G.cyl8, 0x2a2344, 0.45, 2, 0.45); can.rotation.x = Math.PI / 2 - 0.6; can.position.set(0, 3, 0.6); tw.add(can);
    const hero = GP.buildHero(GP.colorNum(V.color(mg.solo)), GP.FF && GP.FF.fitSeat(mg.solo)); hero.root.position.set(0, 2.6, -0.6); tw.add(hero.root); tw.position.set(0, 0, -7); V.grp.add(GP.shadowy(tw, true, false));
    const tag = GP.nameTag(V.name(mg.solo), V.color(mg.solo)); tag.position.set(0, 5.4, -7); V.grp.add(tag);
    const ret = new THREE.Group(); const ring = new THREE.Mesh(G.ring, new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.95, depthWrite: false })); ring.scale.setScalar(1.35); ret.add(ring);
    const dot = new THREE.Mesh(G.circle, new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.35, depthWrite: false })); dot.scale.setScalar(1.35); ret.add(dot); ret.position.y = 0.07; V.grp.add(ret);
    V.k = { ret, can, hero };
  },
  view(V, mg) {
    const s = V.pos(mg.solo); V.k.ret.position.x = s.x; V.k.ret.position.z = s.z; V.k.ret.rotation.y = V.t * 2; GP.poseHero(V.k.hero, 'idle', V.dt);
    V.k.can.rotation.y = Math.atan2(s.x, s.z + 7) * 0.5;
    V.sync('sh', mg.e, () => { const o = new THREE.Group(); const sh = GP.blob(1.35, 0.5); o.add(sh); const ball = M(G.sphere, 0x1b1440, 0.45); GP.shadowy(ball, true, false); o.add(ball); o.userData = { sh, ball }; return o; },
      (o, b) => { o.position.set(b.x, 0, b.z); o.userData.ball.position.y = b.t * 14; o.userData.sh.material.opacity = 0.25 + (1 - b.t) * 0.45; o.userData.sh.material.color.setHex(0x880000); });
  },
});

/* 13. TUG O' WAR (1 vs 2) */
def({ id: 'tug', name: 'Tug o\u2019 War', type: '1v2', ctrl: 'mash', dur: 25, noMove: true, floor: 0x7ad35a, color: '#3fb6ff', aLabel: 'PULL!', bounds: { w: 18, h: 8 },
  howto: 'Mash PULL to drag the rope to your side! The solo player is extra strong.',
  howtoSolo: 'You are SOLO and extra strong! Mash PULL to drag the team into the goo!', howtoTeam: 'Team up! Mash PULL together to drag the solo player into the goo!',
  init(mg, n, solo) {
    mg.solo = solo; mg.rope = 0; mg.el = 0; mg.p = []; const team = []; for (let i = 0; i < n; i++) if (i !== solo) team.push(i);
    mg.mult = team.length >= 2 ? 1.85 : 1;
    for (let i = 0; i < n; i++) { const k = team.indexOf(i); mg.p.push(Object.assign(baseP(i === solo ? -3.2 : 3.2 + k * 1.6, 0), { lt: 0, f: i === solo ? Math.PI / 2 : -Math.PI / 2, n: 0 })); }
  },
  step(mg, dt, H) { mg.el += dt; const off = mg.rope * 6; mg.p.forEach((p, i) => { const k = i === mg.solo ? 0 : mg.p.slice(0, i).filter((q, j) => j !== mg.solo).length; p.x = (i === mg.solo ? -3.2 : 3.2 + k * 1.6) + off; }); if (Math.abs(mg.rope) >= 1) H.end(); },
  act(mg, i, v, H) { const p = mg.p[i]; if (mg.el - p.lt < 0.055) return; p.lt = mg.el; p.n++; mg.rope = clamp(mg.rope + (i === mg.solo ? -0.0105 * mg.mult : 0.0105), -1, 1); },
  bot(mg, i, diff, dt, B, H) { B.acc = (B.acc || 0) + dt * (diff === 'easy' ? rand(4.2, 6.4) : rand(6.2, 8.2)); while (B.acc >= 1) { B.acc--; this.act(mg, i, 1, H); } return null; },
  score: (mg) => { const teamWin = mg.rope > 0; return mg.p.map((p, i) => ((i === mg.solo) !== teamWin ? 1 : 0)); },
  label: (mg, i) => (i === mg.solo ? 'SOLO' : 'TEAM'),
  pose: (mg, i) => (mg.el - mg.p[i].lt < 0.3 ? 'mash' : 'idle'),
  build(V) {
    const pit = new THREE.Mesh(G.plane, GP.basic(0x9a3aff)); pit.scale.set(3.6, 1, 8); pit.position.y = 0.07; V.grp.add(pit);
    const rope = M(G.cyl8, 0xd8b07a, 0.07, 14, 0.07); rope.rotation.z = Math.PI / 2; rope.position.y = 0.95; V.grp.add(rope);
    const flag = M(G.box, 0xff3b5c, 0.12, 0.7, 0.5); flag.position.y = 0.55; V.grp.add(flag); V.k = { rope, flag };
  },
  view(V, mg) { const o = mg.rope * 6; V.k.rope.position.x = o; V.k.flag.position.x = o; },
});

GP.MG = {}; DEFS.forEach((d) => { GP.MG[d.id] = d; });
GP.MG_LIST = DEFS.map((d) => d.id);

/* ---------------- view framework ---------------- */
GP.MGView = function (scene) {
  const V = { grp: null, ents: {}, heroes: [], t: 0, dt: 0, k: null };
  V.sync = function (key, list, build, upd) {
    const map = V.ents[key] || (V.ents[key] = new Map()), seen = new Set();
    (list || []).forEach((e) => { let o = map.get(e.id); if (!o) { o = build(e); map.set(e.id, o); V.grp.add(o); } seen.add(e.id); upd(o, e); });
    map.forEach((o, id) => { if (!seen.has(id)) { V.grp.remove(o); map.delete(id); } });
  };
  V.pos = (i) => { const h = V.heroes[i]; return h ? { x: h.rx, y: h.ry, z: h.rz } : { x: 0, y: 0, z: 0 }; };
  V.start = function (mg, seats) {
    V.stop(); const D = GP.MG[mg.id]; V.def = D; V.seats = seats; V.grp = new THREE.Group(); scene.add(V.grp); V.ents = {}; V.k = null; V.t = 0; V.fxl = [];
    V.color = (i) => (seats[i] ? seats[i].color : '#ffffff'); V.name = (i) => (seats[i] ? seats[i].name : '?');
    const A = D.arena, fc = D.floor || 0x7ad35a;
    if (A && A.r) { const f = M(G.cyl20, fc, A.r, 1, A.r); f.position.y = -0.5; V.grp.add(GP.shadowy(f, false, true)); const e = M(G.cyl20, 0xffffff, A.r + 0.25, 0.9, A.r + 0.25); e.position.y = -0.56; V.grp.add(e); }
    else { const b = A || D.bounds; const f = M(G.box, fc, b.w + (A ? 0 : 4), 1, b.h + (A ? 0 : 4)); f.position.y = -0.5; V.grp.add(GP.shadowy(f, false, true)); if (A) { [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach((q) => { const w = M(G.box, 0xffffff, q[0] ? 0.4 : b.w + 0.4, 0.5, q[0] ? b.h + 0.4 : 0.4); w.position.set(q[0] * (b.w / 2 + 0.2), 0.25, q[1] * (b.h / 2 + 0.2)); V.grp.add(w); }); } }
    const below = new THREE.Mesh(G.plane, mat(D.below || 0x3a8ad8, { emissive: 0x112244 })); below.scale.set(300, 1, 300); below.position.y = A && A.fall ? -1.2 : -1.6; V.grp.add(below);
    for (let i = 0; i < 10; i++) { const c = GP.buildCloud(1 + Math.random()); const a = (i / 10) * TAU; c.position.set(Math.cos(a) * 30, -1 + Math.random() * 4, Math.sin(a) * 26); V.grp.add(c); }
    V.heroes = mg.p.map((p, i) => {
      const h = GP.buildHero(GP.colorNum(V.color(i)), GP.FF && GP.FF.fitSeat(i)); V.grp.add(h.root); const tag = GP.nameTag(V.name(i), V.color(i)); V.grp.add(tag); const bl = GP.blob(0.5); V.grp.add(bl);
      const ring = new THREE.Mesh(G.ring, new THREE.MeshBasicMaterial({ color: GP.colorNum(V.color(i)), transparent: true, opacity: 0.9, depthWrite: false })); ring.scale.setScalar(0.62); V.grp.add(ring);
      return Object.assign(h, { tag, bl, ring, rx: p.x, ry: p.y || 0, rz: p.z, rf: p.f || 0, lx: p.x, lz: p.z });
    });
    if (D.build) D.build(V, mg);
    // particles
    V.parts = []; V.partGrp = new THREE.Group(); V.grp.add(V.partGrp);
  };
  V.burst = function (x, y, z, color, n) { for (let i = 0; i < (n || 10); i++) { const m = new THREE.Mesh(G.ico, GP.basic(color)); m.scale.setScalar(0.12); m.position.set(x, y, z); V.partGrp.add(m); V.parts.push({ m, vx: rand(-4, 4), vy: rand(3, 7), vz: rand(-4, 4), t: 0.7 }); } };
  V.update = function (mg, dt, me, LP) {
    if (!V.grp || !mg) return; V.t += dt; V.dt = dt; const D = V.def;
    mg.p.forEach((p, i) => {
      const h = V.heroes[i]; if (!h) return;
      const src = (i === me && LP) ? LP : p;
      let ty = src.y || 0; if (p.fall > 0) ty = -(1.5 - p.fall) * 5;
      if (i === me && LP) { h.rx = src.x; h.rz = src.z; h.ry = ty; h.rf = GP.angLerp(h.rf, src.f || 0, GP.damp(16, dt)); }
      else { if (hyp(src.x - h.rx, src.z - h.rz) > 3.5) { h.rx = src.x; h.rz = src.z; } const k = GP.damp(14, dt); h.rx += (src.x - h.rx) * k; h.rz += (src.z - h.rz) * k; h.ry += (ty - h.ry) * GP.damp(20, dt); h.rf = GP.angLerp(h.rf, src.f || 0, GP.damp(10, dt)); }
      const spd = hyp(h.rx - h.lx, h.rz - h.lz) / Math.max(dt, 1e-3); h.lx = h.rx; h.lz = h.rz;
      const hide = D.hideAvatar && D.hideAvatar(mg, i);
      h.root.visible = h.tag.visible = h.bl.visible = h.ring.visible = !hide;
      h.root.position.set(h.rx, h.ry, h.rz); h.root.rotation.y = h.rf;
      let pose = D.pose ? D.pose(mg, i, V) : null;
      if (!pose) pose = p.out ? 'out' : p.st > 0 ? 'stun' : h.ry > 0.05 ? 'air' : spd > 0.8 ? 'run' : 'idle';
      GP.poseHero(h, pose, dt, spd);
      const blink = p.inv > 0 && Math.sin(V.t * 30) > 0; h.root.visible = !hide && !blink;
      h.tag.position.set(h.rx, h.ry + 2.35, h.rz); h.bl.position.set(h.rx, 0.03, h.rz); h.bl.visible = !hide && h.ry > -0.5; h.ring.position.set(h.rx, 0.05, h.rz); h.ring.visible = !hide && i === me && h.ry > -0.5;
      h.root.traverse((o) => { if (o.material && o.material.transparent === false && p.out && pose === 'out') { /* keep */ } });
    });
    if (D.view) D.view(V, mg, dt);
    for (let i = V.parts.length - 1; i >= 0; i--) { const q = V.parts[i]; q.t -= dt; q.vy -= 18 * dt; q.m.position.x += q.vx * dt; q.m.position.y += q.vy * dt; q.m.position.z += q.vz * dt; if (q.t <= 0) { V.partGrp.remove(q.m); V.parts.splice(i, 1); } }
  };
  V.stop = function () { if (V.grp) scene.remove(V.grp); V.grp = null; V.heroes = []; V.ents = {}; };
  V.bounds = function () { const D = V.def, A = D.arena; if (A && A.r) return { w: A.r * 2, h: A.r * 2 }; return A || D.bounds; };
  return V;
};
})();
