/* Grok Land Party - SUPER FIESTA EXPANSION (MEGA DLC from the Grok Arcade DLC Machine 3000, idea #15)
   3D models for the Fiesta Isles world, its three towns and the new Fiesta Isles party board.
   Everything here is real geometry (no flat billboards): townsfolk, food, pinatas, stalls, boats... */
(function () {
'use strict';
const GP = window.GP, THREE = window.THREE, TAU = Math.PI * 2;
const M = GP.M, G = GP.G, mat = GP.mat, basic = GP.basic;
const W = GP.FZW = {};
const FIESTA = [0xff4fd8, 0xffd23f, 0x3ff0ff, 0x4ade80, 0xff7a3d, 0xa78bfa, 0xff4d6d];
W.COLORS = FIESTA;
const pick = (r, a) => a[Math.floor(r() * a.length)];
const half = new THREE.SphereGeometry(1, 14, 7, 0, TAU, 0, Math.PI / 2);
const shell = new THREE.CylinderGeometry(1, 1, 1, 14, 1, true, 0, Math.PI);
const torusHalf = new THREE.TorusGeometry(1, 0.16, 8, 20, Math.PI);
const ridged = new THREE.CylinderGeometry(1, 1, 1, 6);

/* ---------- small helpers ---------- */
function signBox(txt, w, h, bg, fg, d) {
  const tex = GP.canvasTex(512, Math.round(512 * h / w), (g, cw, ch) => {
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch); g.lineWidth = 14; g.strokeStyle = 'rgba(255,255,255,.85)'; g.strokeRect(10, 10, cw - 20, ch - 20);
    g.font = 'bold ' + Math.round(ch * 0.5) + 'px "Trebuchet MS", Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,.4)'; g.strokeText(txt, cw / 2, ch / 2 + 4, cw - 40); g.fillStyle = fg; g.fillText(txt, cw / 2, ch / 2 + 4, cw - 40);
  });
  const side = mat(GP.colorNum(bg)), face = new THREE.MeshLambertMaterial({ map: tex, emissive: 0x222222 });
  const m = new THREE.Mesh(G.box, [side, side, side, side, face, face]); m.scale.set(w, h, d || 0.18); return m;
}
W.signBox = signBox;
function hang(grp, ax, ay, az, bx, by, bz, sag, n, make) {
  // a sagging line between two points with n things hanging off it (papel picado, light bulbs)
  const items = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = ay + (by - ay) * t - Math.sin(t * Math.PI) * sag;
    if (k < n) {
      const t2 = (k + 1) / n, x2 = ax + (bx - ax) * t2, z2 = az + (bz - az) * t2, y2 = ay + (by - ay) * t2 - Math.sin(t2 * Math.PI) * sag;
      const len = Math.hypot(x2 - x, y2 - y, z2 - z), seg = M(G.cyl8, 0x3a2a4a, 0.02, len, 0.02);
      seg.position.set((x + x2) / 2, (y + y2) / 2, (z + z2) / 2); seg.lookAt(x2, y2, z2); seg.rotateX(Math.PI / 2); grp.add(seg);
    }
    if (k > 0 && k < n) { const it = make(k); it.position.set(x, y, z); it.rotation.y = Math.atan2(bx - ax, bz - az) + Math.PI / 2; grp.add(it); items.push(it); }
  }
  return items;
}
W.papel = function (grp, ax, ay, az, bx, by, bz, r) {
  return hang(grp, ax, ay, az, bx, by, bz, 0.7, 11, (k) => {
    const f = new THREE.Group(); const c = FIESTA[(k + Math.floor((r ? r() : 0) * 7)) % FIESTA.length];
    const flag = M(G.box, mat(c, { emissive: 0x222222, side: THREE.DoubleSide }), 0.62, 0.55, 0.03); flag.position.y = -0.3; f.add(flag);
    const cut = M(G.box, basic(0xffffff), 0.16, 0.16, 0.035); cut.position.y = -0.3; cut.rotation.z = Math.PI / 4; f.add(cut);
    f.userData.sway = k; return f;
  });
};
W.lights = function (grp, ax, ay, az, bx, by, bz) {
  return hang(grp, ax, ay, az, bx, by, bz, 0.5, 14, (k) => { const b = new THREE.Mesh(G.sphereLo, basic(FIESTA[k % FIESTA.length])); b.scale.setScalar(0.11); return b; });
};

/* ---------- plants / nature ---------- */
W.palm = function (s, lean) {
  const g = new THREE.Group(); lean = lean || 0.25; let x = 0, y = 0;
  for (let i = 0; i < 6; i++) { const seg = M(G.cyl8, i % 2 ? 0x9a6a3a : 0x8a5a2a, 0.2 * s * (1 - i * 0.06), 0.75 * s, 0.2 * s * (1 - i * 0.06)); x += lean * i * 0.05 * s; seg.position.set(x, y + 0.37 * s, 0); seg.rotation.z = -lean * 0.4; g.add(seg); y += 0.7 * s; }
  const top = new THREE.Group(); top.position.set(x, y, 0); g.add(top);
  for (let k = 0; k < 7; k++) {
    const leaf = new THREE.Group(); leaf.rotation.y = k * TAU / 7;
    const l1 = M(G.box, k % 2 ? 0x2fae4a : 0x3fc85a, 0.5 * s, 0.05 * s, 1.5 * s); l1.position.set(0, 0.1 * s, 0.7 * s); l1.rotation.x = 0.35; leaf.add(l1);
    const l2 = M(G.box, k % 2 ? 0x27983f : 0x34b04e, 0.36 * s, 0.05 * s, 1.0 * s); l2.position.set(0, -0.32 * s, 1.75 * s); l2.rotation.x = 0.85; leaf.add(l2);
    top.add(leaf);
  }
  for (let k = 0; k < 3; k++) { const c = M(G.sphereLo, 0x6a4a1a, 0.16 * s); c.position.set(Math.cos(k * 2.1) * 0.2 * s, -0.12 * s, Math.sin(k * 2.1) * 0.2 * s); top.add(c); }
  g.userData.top = top; GP.shadowy(g, true, false); return g;
};
W.cactus = function (s, flower) {
  const g = new THREE.Group(), c = 0x3f9a4a;
  const body = M(G.cyl8, c, 0.38 * s, 2.2 * s, 0.38 * s); body.position.y = 1.1 * s; g.add(body);
  const cap = M(G.sphereLo, c, 0.38 * s); cap.position.y = 2.2 * s; g.add(cap);
  [[-1, 1.0, 0.9], [1, 1.4, 0.7]].forEach((a) => {
    const el = M(G.cyl8, c, 0.22 * s, 0.6 * s, 0.22 * s); el.rotation.z = Math.PI / 2; el.position.set(a[0] * 0.55 * s, a[1] * s, 0); g.add(el);
    const up = M(G.cyl8, c, 0.22 * s, a[2] * s, 0.22 * s); up.position.set(a[0] * 0.82 * s, (a[1] + a[2] / 2) * s, 0); g.add(up);
    const t = M(G.sphereLo, c, 0.22 * s); t.position.set(a[0] * 0.82 * s, (a[1] + a[2]) * s, 0); g.add(t);
  });
  if (flower) { const f = M(G.sphereLo, mat(flower, { emissive: 0x331122 }), 0.16 * s); f.position.y = 2.55 * s; g.add(f); }
  GP.shadowy(g, true, false); return g;
};
W.agave = function (s) {
  const g = new THREE.Group();
  for (let k = 0; k < 9; k++) { const l = M(G.cone6, k % 2 ? 0x5aa88a : 0x4a9a7a, 0.14 * s, 1.1 * s, 0.14 * s); l.position.y = 0.45 * s; l.rotation.set(0.7 + (k % 3) * 0.15, k * TAU / 9, 0, 'YXZ'); g.add(l); }
  GP.shadowy(g, true, false); return g;
};
W.flowerPot = function (s, col) {
  const g = new THREE.Group(); const pot = M(G.cyl8, 0xd8743a, 0.32 * s, 0.4 * s, 0.26 * s); pot.position.y = 0.2 * s; g.add(pot);
  const soil = M(G.cyl8, 0x5a3a1a, 0.28 * s, 0.04 * s, 0.28 * s); soil.position.y = 0.4 * s; g.add(soil);
  for (let k = 0; k < 4; k++) { const st = M(G.cyl8, 0x3f9a4a, 0.03 * s, 0.35 * s, 0.03 * s); st.position.set(Math.cos(k * 1.6) * 0.12 * s, 0.55 * s, Math.sin(k * 1.6) * 0.12 * s); g.add(st); const fl = M(G.sphereLo, mat(col || FIESTA[k], { emissive: 0x221122 }), 0.1 * s); fl.position.set(st.position.x, 0.75 * s, st.position.z); g.add(fl); }
  return g;
};
W.hill = function (r, col) { const h = M(half, col || 0x59c25a, r, r * 0.5, r); return h; };
W.rock = function (s, col) { const r = M(G.dodeca, col || 0x9a8a7a, s, s * 0.7, s); r.position.y = s * 0.25; return r; };

/* ---------- buildings / props ---------- */
W.house = function (w, h, d, col, roof, r) {
  const g = new THREE.Group();
  const b = M(G.box, col, w, h, d); b.position.y = h / 2; g.add(b);
  const trim = M(G.box, 0xffffff, w + 0.2, 0.2, d + 0.2); trim.position.y = h; g.add(trim);
  if (roof) { const rf = M(G.cone6 === undefined ? G.cone : new THREE.ConeGeometry(1, 1, 4), roof, w * 0.78, 1.4, d * 0.78); rf.position.y = h + 0.8; rf.rotation.y = Math.PI / 4; g.add(rf); }
  const door = M(G.box, 0x7a4a2a, 0.9, 1.5, 0.08); door.position.set(0, 0.75, d / 2 + 0.03); g.add(door);
  const knob = M(G.sphereLo, 0xffd23f, 0.06); knob.position.set(0.3, 0.75, d / 2 + 0.09); g.add(knob);
  [-1, 1].forEach((sx) => {
    if (w < 2.6) return;
    const wi = M(G.box, basic(0x9fe6ff), 0.7, 0.7, 0.06); wi.position.set(sx * w * 0.3, h * 0.6, d / 2 + 0.03); g.add(wi);
    const sh = M(G.box, pick(r || Math.random, FIESTA), 0.2, 0.8, 0.07); sh.position.set(sx * w * 0.3 + 0.48, h * 0.6, d / 2 + 0.04); g.add(sh);
    const sh2 = sh.clone(); sh2.position.x = sx * w * 0.3 - 0.48; g.add(sh2);
    const box = M(G.box, 0x8a5a2a, 0.8, 0.18, 0.25); box.position.set(sx * w * 0.3, h * 0.6 - 0.45, d / 2 + 0.12); g.add(box);
    for (let k = 0; k < 3; k++) { const f = M(G.sphereLo, mat(FIESTA[(k + (sx > 0 ? 2 : 0)) % 7], { emissive: 0x221122 }), 0.1); f.position.set(sx * w * 0.3 - 0.25 + k * 0.25, h * 0.6 - 0.3, d / 2 + 0.15); g.add(f); }
  });
  GP.shadowy(g, true, true); return g;
};
W.arch = function (txt, col, w) {
  w = w || 5; const g = new THREE.Group();
  [-1, 1].forEach((s) => { const p = M(G.cyl8, 0xf2e2c4, 0.38, 3.6, 0.38); p.position.set(s * w / 2, 1.8, 0); g.add(p); const cap = M(G.sphereLo, col, 0.42); cap.position.set(s * w / 2, 3.7, 0); g.add(cap); });
  const top = M(torusHalf, col, w / 2, w / 2, 1.6); top.position.y = 3.5; g.add(top);
  const sign = signBox(txt, w * 0.95, 0.9, '#2a1a4a', '#ffe14d', 0.22); sign.position.y = 3.95; g.add(sign);
  GP.shadowy(g, true, false); return g;
};
W.exitGate = function (txt) {
  // low gate (no top arch) so it never blocks the follow camera: balloon posts, an arrow mat and a sign post
  const g = new THREE.Group();
  [-2.6, 2.6].forEach((x, k) => { const p = M(G.cyl8, 0xf2e2c4, 0.3, 1.3, 0.3); p.position.set(x, 0.65, 0); g.add(p); const cap = M(G.sphereLo, 0xffd23f, 0.34); cap.position.set(x, 1.4, 0); g.add(cap); for (let j = 0; j < 3; j++) { const b = M(G.sphereLo, mat(FIESTA[(j + k * 3) % 7], { emissive: 0x222222 }), 0.26, 0.32, 0.26); b.position.set(x + (j - 1) * 0.3, 2.4 + (j % 2) * 0.3, 0); g.add(b); const st = M(G.cyl8, 0xffffff, 0.01, 0.9, 0.01); st.position.set(x + (j - 1) * 0.15, 1.85, 0); st.rotation.z = (j - 1) * 0.3; g.add(st); } });
  const mat_ = M(G.box, 0xff4fd8, 4.6, 0.05, 1.6); mat_.position.y = 0.03; g.add(mat_);
  const ar = M(new THREE.ConeGeometry(0.6, 1, 3), basic(0xffe14d)); ar.rotation.x = Math.PI / 2; ar.position.set(0, 0.08, 0.2); ar.scale.set(1, 1, 0.1); g.add(ar);
  const post = M(G.cyl8, 0x8a5a2a, 0.07, 2.2, 0.07); post.position.set(4, 1.1, -0.6); g.add(post);
  const sg = signBox(txt, 2.6, 0.6, '#2a1a4a', '#ffe14d', 0.12); sg.position.set(4, 2.0, -0.6); sg.rotation.y = 0.35; g.add(sg);
  GP.shadowy(g, true, false); return g;
};
W.bench = function () { const g = new THREE.Group(); const s = M(G.box, 0xb0703a, 1.8, 0.12, 0.55); s.position.y = 0.45; g.add(s); const bk = M(G.box, 0xb0703a, 1.8, 0.5, 0.1); bk.position.set(0, 0.75, -0.25); g.add(bk); [-0.75, 0.75].forEach((x) => { const l = M(G.box, 0x5a3a2a, 0.1, 0.45, 0.5); l.position.set(x, 0.22, 0); g.add(l); }); GP.shadowy(g, true, false); return g; };
W.busStop = function () {
  const g = new THREE.Group();
  const post = M(G.cyl8, 0xdddddd, 0.07, 2.6, 0.07); post.position.set(-1.2, 1.3, 0); g.add(post);
  const sign = M(G.cyl, mat(0xffd23f, { emissive: 0x332200 }), 0.42, 0.08, 0.42); sign.rotation.x = Math.PI / 2; sign.position.set(-1.2, 2.6, 0); g.add(sign);
  const bus = M(G.box, 0x2a6ae8, 0.38, 0.22, 0.1); bus.position.set(-1.2, 2.6, 0.05); g.add(bus);
  const roof = M(G.box, 0xff4fd8, 2.6, 0.12, 1.3); roof.position.set(0.2, 2.2, -0.1); g.add(roof);
  [-0.9, 1.3].forEach((x) => { const p = M(G.cyl8, 0xeeeeee, 0.06, 2.2, 0.06); p.position.set(x, 1.1, -0.6); g.add(p); });
  const b = W.bench(); b.position.set(0.2, 0, -0.35); b.scale.setScalar(0.85); g.add(b);
  GP.shadowy(g, true, false); return g;
};
W.fiestaBus = function () {
  const g = new THREE.Group();
  const body = M(G.box, 0xff7a3d, 4.2, 1.5, 1.8); body.position.y = 1.15; g.add(body);
  const top = M(G.box, 0xffd23f, 4.0, 0.6, 1.7); top.position.y = 2.2; g.add(top);
  const stripe = M(G.box, 0xff4fd8, 4.25, 0.25, 1.85); stripe.position.y = 0.95; g.add(stripe);
  for (let k = 0; k < 4; k++) { [-1, 1].forEach((s) => { const w = M(G.box, basic(0x9fe6ff), 0.7, 0.45, 0.04); w.position.set(-1.4 + k * 0.9, 2.2, s * 0.86); g.add(w); }); }
  const ws = M(G.box, basic(0x9fe6ff), 0.05, 0.7, 1.4); ws.position.set(2.11, 1.8, 0); g.add(ws);
  [[-1.3, 1], [-1.3, -1], [1.3, 1], [1.3, -1]].forEach((p) => { const wh = M(G.cyl, 0x22223a, 0.42, 0.3, 0.42); wh.rotation.x = Math.PI / 2; wh.position.set(p[0], 0.42, p[1] * 0.9); g.add(wh); const hub = M(G.cyl, 0xdddddd, 0.18, 0.32, 0.18); hub.rotation.x = Math.PI / 2; hub.position.copy(wh.position); g.add(hub); });
  const hl = M(G.sphereLo, basic(0xfff3b0), 0.14); hl.position.set(2.12, 0.9, 0.6); g.add(hl); const hr = hl.clone(); hr.position.z = -0.6; g.add(hr);
  for (let k = 0; k < 5; k++) { const bal = M(G.sphereLo, FIESTA[k], 0.22); bal.position.set(-1.8 + k * 0.9, 2.75 + (k % 2) * 0.1, 0); g.add(bal); }
  GP.shadowy(g, true, false); return g;
};
W.fountain = function () {
  const g = new THREE.Group();
  const b1 = M(G.cyl20, 0xe8d8b8, 2.2, 0.6, 2.2); b1.position.y = 0.3; g.add(b1);
  const water = new THREE.Mesh(G.cyl20, mat(0x5ad0ff, { emissive: 0x115577, transparent: true, opacity: 0.85 })); water.scale.set(1.95, 0.1, 1.95); water.position.y = 0.58; g.add(water);
  const col = M(G.cyl8, 0xe8d8b8, 0.3, 1.6, 0.3); col.position.y = 1.2; g.add(col);
  const b2 = M(G.cyl20, 0xe8d8b8, 0.9, 0.3, 0.9); b2.position.y = 2.0; g.add(b2);
  const w2 = new THREE.Mesh(G.cyl20, water.material); w2.scale.set(0.75, 0.08, 0.75); w2.position.y = 2.17; g.add(w2);
  const drops = []; for (let k = 0; k < 14; k++) { const d = new THREE.Mesh(G.sphereLo, mat(0x9fe8ff, { emissive: 0x2288aa, transparent: true, opacity: 0.8 })); d.scale.setScalar(0.08); g.add(d); drops.push(d); }
  g.userData.anim = (t) => drops.forEach((d, k) => { const p = (t * 0.8 + k / 14) % 1, a = k * 2.4; d.position.set(Math.cos(a) * p * 1.2, 2.3 + Math.sin(p * Math.PI) * 1.3 - p * 1.4, Math.sin(a) * p * 1.2); });
  GP.shadowy(g, true, true); return g;
};
W.stall = function (col, title) {
  const g = new THREE.Group();
  const counter = M(G.box, 0xb0703a, 3.2, 1.1, 1.2); counter.position.y = 0.55; g.add(counter);
  const front = M(G.box, col, 3.25, 0.5, 0.06); front.position.set(0, 0.7, 0.62); g.add(front);
  const top = M(G.box, 0xe8d0a0, 3.3, 0.08, 1.3); top.position.y = 1.14; g.add(top);
  [[-1.5, 0.5], [1.5, 0.5], [-1.5, -0.5], [1.5, -0.5]].forEach((p) => { const pl = M(G.cyl8, 0x7a4a2a, 0.06, 2.8, 0.06); pl.position.set(p[0], 1.4, p[1]); g.add(pl); });
  for (let k = 0; k < 8; k++) { const st = M(G.box, k % 2 ? 0xffffff : col, 0.42, 0.06, 1.7); st.position.set(-1.47 + k * 0.42, 2.85, 0.15); st.rotation.x = 0.28; g.add(st); }
  const val = []; for (let k = 0; k < 8; k++) { const v = M(G.cone, k % 2 ? 0xffffff : col, 0.21, 0.3, 0.06); v.rotation.x = Math.PI; v.position.set(-1.47 + k * 0.42, 2.48, 1.0); g.add(v); val.push(v); }
  const sign = signBox(title, 2.6, 0.6, '#2a1a4a', '#ffe14d', 0.12); sign.position.set(0, 3.35, -0.2); g.add(sign);
  GP.shadowy(g, true, true); return g;
};
W.picnic = function (umb) {
  const g = new THREE.Group();
  const t = M(G.box, 0xc0803a, 2.2, 0.12, 1.1); t.position.y = 0.8; g.add(t);
  [-0.9, 0.9].forEach((x) => { const l = M(G.box, 0x7a4a2a, 0.12, 0.8, 0.9); l.position.set(x, 0.4, 0); g.add(l); });
  [-0.85, 0.85].forEach((z) => { const s = M(G.box, 0xc0803a, 2.2, 0.1, 0.35); s.position.set(0, 0.45, z); g.add(s); });
  const pole = M(G.cyl8, 0xeeeeee, 0.05, 2.6, 0.05); pole.position.y = 1.5; g.add(pole);
  for (let k = 0; k < 8; k++) { const seg = M(new THREE.ConeGeometry(1.5, 0.6, 8, 1, true, k * TAU / 8, TAU / 8), mat(k % 2 ? 0xffffff : umb, { side: THREE.DoubleSide })); seg.position.y = 2.75; g.add(seg); }
  GP.shadowy(g, true, false); return g;
};
W.pinata = function () {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const core = M(G.sphere, mat(0xff4fd8, { emissive: 0x330022 }), 0.55); body.add(core);
  for (let k = 0; k < 6; k++) {
    const a = k * TAU / 6, sp = M(G.cone, FIESTA[k % 7], 0.24, 0.85, 0.24); sp.position.set(Math.cos(a) * 0.7, Math.sin(a) * 0.7, 0); sp.rotation.z = a - Math.PI / 2; body.add(sp);
    const tas = M(G.cyl8, FIESTA[(k + 3) % 7], 0.03, 0.5, 0.03); tas.position.set(Math.cos(a) * 1.15, Math.sin(a) * 1.15 - 0.25, 0); body.add(tas);
  }
  const fz = M(G.cyl8, 0xffd23f, 0.3, 0.2, 0.3); fz.rotation.x = Math.PI / 2; fz.position.z = 0.5; body.add(fz);
  GP.eyesOn(body, 0.12, 0.52, 0.17, 0.11, false);
  const rope = M(G.cyl8, 0xd8c08a, 0.025, 1, 0.025); rope.position.y = 1.4; g.add(rope);
  g.userData.body = body; GP.shadowy(g, true, false); return g;
};
W.pinataFrame = function () {
  const g = new THREE.Group();
  [-1.8, 1.8].forEach((x) => { const p = M(G.cyl8, 0x8a5a2a, 0.12, 4.6, 0.12); p.position.set(x, 2.3, 0); g.add(p); });
  const bar = M(G.cyl8, 0x8a5a2a, 0.1, 3.8, 0.1); bar.rotation.z = Math.PI / 2; bar.position.y = 4.55; g.add(bar);
  GP.shadowy(g, true, false); return g;
};
W.discoBall = function () {
  const g = new THREE.Group(); const b = M(new THREE.IcosahedronGeometry(1, 1), mat(0xe8e8ff, { metalness: 0.9, roughness: 0.15, emissive: 0x333344 }), 0.75); g.add(b);
  const ch = M(G.cyl8, 0x444444, 0.02, 3, 0.02); ch.position.y = 1.9; g.add(ch); g.add(GP.glowSprite(0xffffff, 2.2)); return g;
};
W.instrument = function (k) {
  const g = new THREE.Group();
  if (k === 'guitar') { const b = M(G.sphereLo, 0xc0782a, 0.28, 0.32, 0.12); g.add(b); const b2 = M(G.sphereLo, 0xc0782a, 0.2, 0.22, 0.12); b2.position.y = 0.3; g.add(b2); const n = M(G.box, 0x5a3a1a, 0.07, 0.7, 0.04); n.position.y = 0.75; g.add(n); const h = M(G.sphereLo, 0x1b1440, 0.08, 0.08, 0.02); h.position.set(0, 0.05, 0.12); g.add(h); }
  else if (k === 'trumpet') { const t = M(G.cyl8, mat(0xffd23f, { metalness: 0.7, roughness: 0.3 }), 0.04, 0.7, 0.04); t.rotation.x = Math.PI / 2; g.add(t); const bell = M(G.cone, mat(0xffd23f, { metalness: 0.7, roughness: 0.3 }), 0.16, 0.25, 0.16); bell.rotation.x = -Math.PI / 2; bell.position.z = 0.45; g.add(bell); }
  else if (k === 'violin') { const b = M(G.sphereLo, 0x9a4a1a, 0.15, 0.24, 0.06); g.add(b); const n = M(G.box, 0x2a1a1a, 0.04, 0.32, 0.03); n.position.y = 0.3; g.add(n); }
  else if (k === 'maracas') { [-1, 1].forEach((s) => { const m = M(G.sphereLo, FIESTA[s > 0 ? 0 : 1], 0.13, 0.16, 0.13); m.position.set(s * 0.05, 0.15, 0); g.add(m); }); }
  return g;
};
/* --- food (eaten for real in your hero's hand) --- */
W.food = function (k) {
  const g = new THREE.Group();
  if (k === 0) { // taco
    const s = M(shell, mat(0xf2c04a, { side: THREE.DoubleSide }), 0.28, 0.42, 0.28); s.rotation.set(0, 0, Math.PI / 2); g.add(s);
    const fill = M(G.box, 0x8a4a2a, 0.3, 0.08, 0.16); fill.position.y = 0.06; g.add(fill);
    const let_ = M(G.box, 0x4ade80, 0.36, 0.06, 0.2); let_.position.y = 0.12; g.add(let_);
    for (let j = 0; j < 3; j++) { const tm = M(G.sphereLo, 0xff4d4d, 0.05); tm.position.set(-0.1 + j * 0.1, 0.17, 0); g.add(tm); }
  } else if (k === 1) { // elote
    const c = M(G.cyl8, 0xffd23f, 0.09, 0.42, 0.09); c.position.y = 0.2; g.add(c); const tip = M(G.sphereLo, 0xffd23f, 0.09); tip.position.y = 0.41; g.add(tip);
    for (let j = 0; j < 6; j++) { const k2 = M(G.sphereLo, 0xffe680, 0.035); k2.position.set(Math.cos(j) * 0.09, 0.08 + j * 0.06, Math.sin(j) * 0.09); g.add(k2); }
    const st = M(G.cyl8, 0xd8b07a, 0.02, 0.3, 0.02); st.position.y = -0.1; g.add(st);
  } else if (k === 2) { // churro
    const c = M(ridged, 0xc0782a, 0.06, 0.6, 0.06); c.position.y = 0.2; c.rotation.z = 0.2; g.add(c);
    const sug = M(G.ico, 0xfff3d6, 0.02); sug.position.set(0.03, 0.3, 0.05); g.add(sug);
  } else if (k === 3) { // paleta
    const p = M(G.box, 0xff6ad5, 0.18, 0.28, 0.08); p.position.y = 0.24; g.add(p); const tp = M(G.cyl, 0xff6ad5, 0.09, 0.08, 0.04); tp.rotation.x = Math.PI / 2; tp.position.y = 0.38; tp.scale.set(0.09, 0.08, 0.04); g.add(tp);
    const st = M(G.box, 0xe8c890, 0.04, 0.18, 0.02); st.position.y = 0.04; g.add(st);
  } else { // agua fresca
    const cup = new THREE.Mesh(G.cyl, mat(0xffffff, { transparent: true, opacity: 0.5 })); cup.scale.set(0.12, 0.3, 0.12); cup.position.y = 0.15; g.add(cup);
    const liq = M(G.cyl, mat(0xff7a9a, { emissive: 0x441122 }), 0.105, 0.24, 0.105); liq.position.y = 0.13; g.add(liq);
    const straw = M(G.cyl8, 0x3ff0ff, 0.015, 0.4, 0.015); straw.position.set(0.04, 0.35, 0); straw.rotation.z = -0.2; g.add(straw);
  }
  return g;
};
W.sombrero = function (col, gold) {
  const g = new THREE.Group(), c = gold ? mat(0xffd23f, { metalness: 0.6, roughness: 0.3, emissive: 0x553300 }) : mat(col || 0xe8c070);
  const brim = M(G.cyl20, c, 0.75, 0.05, 0.75); g.add(brim);
  const rim = M(G.torus, c, 0.75, 0.75, 0.6); rim.rotation.x = Math.PI / 2; rim.position.y = 0.04; g.add(rim);
  const crown = M(G.cone, c, 0.34, 0.6, 0.34); crown.position.y = 0.3; g.add(crown);
  const band = M(G.cyl20, gold ? 0xff4fd8 : 0xff4d4d, 0.29, 0.08, 0.29); band.position.y = 0.12; g.add(band);
  for (let k = 0; k < 8; k++) { const d = M(G.sphereLo, FIESTA[k % 7], 0.04); d.position.set(Math.cos(k * TAU / 8) * 0.62, 0.05, Math.sin(k * TAU / 8) * 0.62); g.add(d); }
  return g;
};

/* ---------- townsfolk (real 3D villagers, same rig as the heroes so they share poses) ---------- */
W.folk = function (o) {
  o = o || {};
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const SK = o.skin || 0xd8a070, CL = o.shirt || 0xff4d4d, PN = o.pants || 0x3a3a7a;
  const torso = M(G.sphereLo, CL, 0.4, 0.46, 0.34); torso.position.y = 0.78; body.add(torso);
  if (o.dress) { const sk = M(G.cone, o.dress, 0.55, 0.75, 0.5); sk.position.y = 0.48; body.add(sk); const fr = M(G.torus, 0xffffff, 0.52, 0.52, 0.45); fr.rotation.x = Math.PI / 2; fr.position.y = 0.13; body.add(fr); }
  if (o.poncho) { const p = M(G.cone, o.poncho, 0.55, 0.55, 0.45); p.position.y = 0.95; body.add(p); for (let k = 0; k < 3; k++) { const st = M(G.torus, FIESTA[k + 1], 0.42 - k * 0.07, 0.42 - k * 0.07, 0.4); st.rotation.x = Math.PI / 2; st.position.y = 0.78 + k * 0.12; body.add(st); } }
  if (o.apron) { const ap = M(G.box, 0xffffff, 0.48, 0.55, 0.05); ap.position.set(0, 0.7, 0.32); body.add(ap); }
  const headG = new THREE.Group(); headG.position.y = 1.36; body.add(headG);
  headG.add(M(G.sphere, SK, 0.34, 0.34, 0.32));
  GP.eyesOn(headG, 0.03, 0.27, 0.11, 0.075, false);
  const nose = M(G.sphereLo, SK, 0.07); nose.position.set(0, -0.06, 0.32); headG.add(nose);
  const smile = M(G.torus, 0x7a1030, 0.08, 0.08, 0.1); smile.rotation.z = Math.PI; smile.position.set(0, -0.14, 0.29); smile.scale.set(0.09, 0.06, 0.1); headG.add(smile);
  if (o.stache) { const st = M(G.box, o.hair || 0x2a1a0a, 0.28, 0.06, 0.06); st.position.set(0, -0.1, 0.33); headG.add(st); [-1, 1].forEach((s) => { const e = M(G.sphereLo, o.hair || 0x2a1a0a, 0.05); e.position.set(s * 0.15, -0.13, 0.32); headG.add(e); }); }
  const hairC = o.hair || 0x3a2210;
  if (o.long) { const hl = M(G.sphereLo, hairC, 0.36, 0.4, 0.3); hl.position.set(0, -0.05, -0.12); headG.add(hl); }
  const top = M(half, hairC, 0.36, 0.26, 0.34); top.position.y = 0.04; headG.add(top);
  if (o.bun) { const b = M(G.sphereLo, hairC, 0.15); b.position.set(0, 0.32, -0.1); headG.add(b); }
  if (o.flower) { const f = M(G.sphereLo, mat(o.flower, { emissive: 0x331122 }), 0.1); f.position.set(0.25, 0.2, 0.08); headG.add(f); }
  if (o.hat === 'sombrero') { const s = W.sombrero(o.hatCol, false); s.position.y = 0.26; s.scale.setScalar(0.85); headG.add(s); }
  else if (o.hat === 'chef') { const c = M(G.cyl, 0xffffff, 0.26, 0.3, 0.26); c.position.y = 0.36; headG.add(c); const p = M(G.sphereLo, 0xffffff, 0.3, 0.18, 0.3); p.position.y = 0.55; headG.add(p); }
  else if (o.hat === 'cap') { const c = M(half, o.hatCol || 0x3ff0ff, 0.37, 0.3, 0.36); c.position.y = 0.05; headG.add(c); const v = M(G.cyl, o.hatCol || 0x3ff0ff, 0.28, 0.04, 0.2); v.position.set(0, 0.07, 0.3); headG.add(v); }
  else if (o.hat === 'captain') { const c = M(G.cyl, 0xffffff, 0.34, 0.18, 0.34); c.position.y = 0.3; headG.add(c); const v = M(G.cyl, 0x1b1440, 0.3, 0.04, 0.22); v.position.set(0, 0.22, 0.24); headG.add(v); const a = M(G.sphereLo, 0xffd23f, 0.06); a.position.set(0, 0.32, 0.34); headG.add(a); }
  else if (o.hat === 'shades') { const s = M(G.box, 0x1b1440, 0.4, 0.09, 0.05); s.position.set(0, 0.04, 0.33); headG.add(s); }
  const mkArm = (side) => { const g = new THREE.Group(); g.position.set(0.42 * side, 1.0, 0); const a = M(G.cyl8, o.sleeve || CL, 0.085, 0.42, 0.085); a.position.y = -0.19; g.add(a); const hand = M(G.sphereLo, SK, 0.11); hand.position.y = -0.42; g.add(hand); body.add(g); return g; };
  const mkLeg = (side) => { const g = new THREE.Group(); g.position.set(0.16 * side, 0.42, 0); const l = M(G.cyl8, PN, 0.1, 0.32, 0.1); l.position.y = -0.14; g.add(l); const sh = M(G.sphereLo, o.shoes || 0x4a2a1a, 0.13, 0.09, 0.19); sh.position.set(0, -0.32, 0.05); g.add(sh); body.add(g); return g; };
  const h = { root, body, headG, armL: mkArm(-1), armR: mkArm(1), legL: mkLeg(-1), legR: mkLeg(1), t: Math.random() * 10 };
  if (o.prop) { const p = W.instrument(o.prop); h.prop = p; if (o.prop === 'trumpet') { p.position.set(0, -0.45, 0.25); p.rotation.x = -1.2; } else if (o.prop === 'guitar') { p.position.set(-0.42, 0.75, 0.38); p.rotation.z = 0.9; body.add(p); } else p.position.set(0, -0.48, 0.05); if (o.prop !== 'guitar') h.armR.add(p); }
  GP.shadowy(root, true, false); return h;
};
/* extra poses for heroes + folk: dance, wave, flip, laugh, sit, nap, eat, hit, play */
W.pose = function (h, pose, dt, t0) {
  if (pose === 'run' || pose === 'idle' || pose === 'win' || pose === 'sad') { GP.poseHero(h, pose, dt, 5); return; }
  GP.poseHero(h, 'idle', dt);
  const t = h.t, b = h.body, s = Math.sin(t * 4);
  if (pose === 'dance') { b.position.y = Math.abs(Math.sin(t * 3)) * 0.18; b.rotation.y = Math.sin(t * 1.5) * 0.6; h.armL.rotation.z = -1.8 + s * 0.8; h.armR.rotation.z = 1.8 + s * 0.8; h.legL.rotation.x = Math.max(0, s) * 0.7; h.legR.rotation.x = Math.max(0, -s) * 0.7; h.headG.rotation.z = s * 0.2; }
  else if (pose === 'wave') { h.armR.rotation.z = 2.6 + Math.sin(t * 7) * 0.4; b.rotation.z = Math.sin(t * 3.5) * 0.05; }
  else if (pose === 'flip') { const k = ((t0 || 0) % 1); b.position.y = Math.sin(k * Math.PI) * 1.4; b.rotation.x = -k * TAU; h.armL.rotation.z = -2.6; h.armR.rotation.z = 2.6; h.legL.rotation.x = -0.8; h.legR.rotation.x = -0.8; }
  else if (pose === 'laugh') { b.rotation.x = -0.25 + Math.sin(t * 14) * 0.08; h.armL.rotation.set(-0.6, 0, -0.5); h.armR.rotation.set(-0.6, 0, 0.5); b.position.y = Math.abs(Math.sin(t * 14)) * 0.05; }
  else if (pose === 'sit') { b.position.y = -0.3; h.legL.rotation.x = -1.5; h.legR.rotation.x = -1.5; }
  else if (pose === 'nap') { b.rotation.z = Math.PI / 2; b.position.set(0.6, 0.45, 0); h.armL.rotation.z = -2.9; h.armR.rotation.z = 0.3; h.headG.rotation.z = Math.sin(t) * 0.05; }
  else if (pose === 'eat') { h.armR.rotation.x = -2.1 + Math.abs(Math.sin(t * 5)) * 0.4; h.armR.rotation.z = 0.5; h.headG.rotation.x = Math.sin(t * 10) * 0.06; }
  else if (pose === 'hit') { const k = Math.sin(t * 9); h.armR.rotation.x = -2.6 + Math.max(0, k) * 2.2; h.armL.rotation.x = h.armR.rotation.x; b.rotation.y = -0.3 + k * 0.3; }
  else if (pose === 'build') { b.rotation.x = 0.5; b.position.y = -0.15; h.armL.rotation.x = -1.2 + s * 0.4; h.armR.rotation.x = -1.2 - s * 0.4; }
  else if (pose === 'play') { b.rotation.y = Math.sin(t * 2) * 0.2; b.position.y = Math.abs(Math.sin(t * 4)) * 0.06; h.armR.rotation.x = -1.2 + Math.sin(t * 8) * 0.2; h.armL.rotation.x = -1.0; h.headG.rotation.z = Math.sin(t * 4) * 0.12; }
};

/* ---------- sky dome (smooth sunset gradient, real geometry) ---------- */
W.sky = function () {
  const geo = new THREE.SphereGeometry(260, 24, 12), col = [], top = new THREE.Color(0x6a7aff), mid = new THREE.Color(0xff8ac8), low = new THREE.Color(0xffd27a), c = new THREE.Color();
  const pos = geo.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 260; if (y > 0.25) c.copy(mid).lerp(top, Math.min(1, (y - 0.25) / 0.6)); else c.copy(low).lerp(mid, Math.max(0, (y + 0.05) / 0.3)); col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })); m.renderOrder = -10;
  const sunB = new THREE.Mesh(G.sphere, new THREE.MeshBasicMaterial({ color: 0xfff0b0, fog: false })); sunB.scale.setScalar(12); sunB.position.set(-90, 40, -200); m.add(sunB);
  const glow = GP.glowSprite(0xffd090, 70); glow.material.fog = false; glow.position.copy(sunB.position); m.add(glow);
  return m;
};

/* ---------- Issue #82: Cobblestone streets, Grand Stone Shops, Pets & Hazards ---------- */
W.stoneRoad = function (grp, x0, z0, x1, z1, width, r) {
  const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz), ang = Math.atan2(dx, dz);
  const g = new THREE.Group();
  const base = M(G.box, 0x8d8276, width, 0.05, len);
  base.position.set(0, 0.02, len / 2);
  g.add(GP.shadowy(base, false, true));
  const curbL = M(G.box, 0x6e6459, 0.22, 0.12, len); curbL.position.set(-width / 2 - 0.1, 0.06, len / 2); g.add(curbL);
  const curbR = M(G.box, 0x6e6459, 0.22, 0.12, len); curbR.position.set(width / 2 + 0.1, 0.06, len / 2); g.add(curbR);
  const stones = [0xa89b8c, 0x948778, 0xb8aa9a, 0x7c7166];
  const n = Math.floor(len * width * 0.95);
  for (let i = 0; i < n; i++) {
    const s = M(G.cyl8, stones[i % 4], 0.26 + (r ? r() * 0.16 : 0.08), 0.06, 0.26 + (r ? r() * 0.16 : 0.08));
    s.position.set(((r ? r() : (i * 0.37) % 1) - 0.5) * (width - 0.5), 0.035, ((r ? r() : (i * 0.61) % 1)) * (len - 0.4) + 0.2);
    g.add(s);
  }
  g.position.set(x0, 0, z0);
  g.rotation.y = ang;
  grp.add(g);
  return g;
};

W.stonePlaza = function (grp, x, z, rad, r) {
  const base = M(G.cyl20, 0x96897b, rad, 0.06, rad); base.position.set(x, 0.02, z); grp.add(GP.shadowy(base, false, true));
  const ring = M(G.torus, 0x6e6459, rad, rad, 0.3); ring.rotation.x = Math.PI / 2; ring.position.set(x, 0.05, z); grp.add(ring);
  const inner = M(G.cyl20, 0xb8a48c, rad * 0.55, 0.07, rad * 0.55); inner.position.set(x, 0.03, z); grp.add(inner);
  const stones = [0xa89b8c, 0x8a7d70, 0xc2b29f, 0x7a6e62];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * TAU + (r ? r() * 0.1 : 0), d = (0.25 + ((i * 0.29) % 0.68)) * rad;
    const s = M(G.cyl8, stones[i % 4], 0.35, 0.065, 0.35);
    s.position.set(x + Math.cos(a) * d, 0.035, z + Math.sin(a) * d);
    grp.add(s);
  }
};

W.stoneShop = function (label, awningCol, wallCol, w, h, d) {
  w = w || 4.8; h = h || 3.8; d = d || 3.4;
  const g = new THREE.Group();
  // Carved stone base + masonry walls
  const plinth = M(G.box, 0x6e655c, w + 0.3, 0.45, d + 0.3); plinth.position.y = 0.22; g.add(plinth);
  const body = M(G.box, wallCol || 0xd8ccb8, w, h, d); body.position.y = h / 2 + 0.3; g.add(body);
  // Stone corner quoins
  const qM = mat(0x7c7267);
  [-w / 2, w / 2].forEach((qx) => [-d / 2, d / 2].forEach((qz) => {
    for (let y = 0.5; y < h; y += 0.65) {
      const qb = M(G.box, qM, 0.36, 0.38, 0.36); qb.position.set(qx, y, qz); g.add(qb);
    }
  }));
  // Stone cornice + terracotta parapet roof
  const corn = M(G.box, 0x7a7066, w + 0.35, 0.26, d + 0.35); corn.position.y = h + 0.35; g.add(corn);
  const roof = M(G.box, 0xb85236, w + 0.15, 0.32, d + 0.15); roof.position.y = h + 0.62; g.add(roof);
  // Arched stone doorway + display window + wooden counter
  const arch = M(G.cyl, 0x3b2618, 0.72, 0.12, 0.72); arch.rotation.x = Math.PI / 2; arch.position.set(-0.85, 1.55, d / 2 + 0.02); g.add(arch);
  const door = M(G.box, 0x4d311e, 1.44, 1.55, 0.1); door.position.set(-0.85, 0.78, d / 2 + 0.02); g.add(door);
  const win = M(G.box, basic(0xfff2b2), 1.6, 1.1, 0.1); win.position.set(1.05, 1.65, d / 2 + 0.02); g.add(win);
  const counter = M(G.box, 0x7c4e29, 1.8, 0.85, 0.75); counter.position.set(1.05, 0.55, d / 2 + 0.38); g.add(counter);
  // Striped fiesta awning
  for (let i = 0; i < 6; i++) {
    const st = M(G.box, i % 2 ? 0xffffff : awningCol, (w - 0.2) / 6, 0.14, 1.25);
    st.position.set(-w / 2 + 0.1 + (i + 0.5) * ((w - 0.2) / 6), 2.55, d / 2 + 0.55);
    st.rotation.x = 0.24; g.add(st);
  }
  // Overhead shop signboard
  const sb = signBox(label, w * 0.88, 0.72, '#231738', '#ffe478', 0.16);
  sb.position.set(0, h + 1.05, d / 2 + 0.1); g.add(sb);
  const lantern = M(G.sphereLo, basic(0xffe999), 0.18); lantern.position.set(0, 2.35, d / 2 + 0.9); g.add(lantern);
  GP.shadowy(g, true, true);
  return g;
};

W.clockTower = function () {
  const g = new THREE.Group();
  const base = M(G.box, 0x8a7f72, 4.6, 1.2, 4.6); base.position.y = 0.6; g.add(base);
  const shaft = M(G.box, 0xd8c8b0, 3.6, 6.5, 3.6); shaft.position.y = 4.4; g.add(shaft);
  const belfry = M(G.box, 0xc8b49a, 3.9, 2.2, 3.9); belfry.position.y = 8.6; g.add(belfry);
  const dome = M(G.sphere, 0xd85a3a, 1.9, 1.6, 1.9); dome.position.y = 9.8; g.add(dome);
  const spire = M(G.cone, 0xffd23f, 0.35, 1.4, 0.35); spire.position.y = 11.4; g.add(spire);
  // Clock faces
  [[0, 1.85, 0], [0, -1.85, Math.PI], [1.85, 0, Math.PI / 2], [-1.85, 0, -Math.PI / 2]].forEach((p) => {
    const face = M(G.cyl, basic(0xfff8dc), 0.85, 0.08, 0.85);
    face.rotation.x = Math.PI / 2; face.rotation.z = p[2];
    face.position.set(p[0], 6.4, p[1]); g.add(face);
  });
  const sb = signBox('GRAN PUEBLO VIEJO', 4.2, 0.7, '#2a1548', '#ffd23f', 0.16);
  sb.position.set(0, 2.8, 1.9); g.add(sb);
  GP.shadowy(g, true, true);
  return g;
};

/* ---------- All 5 Pets in 3D: Luna, Pi-rat, Snowie, Candy, Torty (Martina) ---------- */
W.pet = function (id) {
  const g = new THREE.Group(), root = new THREE.Group(); g.add(root);
  const pillow = M(G.cyl20, 0x9b5de5, 0.85, 0.16, 0.85); pillow.position.y = 0.08; g.add(pillow);
  const rim = M(G.torus, 0xffd23f, 0.85, 0.85, 0.08); rim.rotation.x = Math.PI / 2; rim.position.y = 0.14; g.add(rim);
  if (id === 'luna') {
    // Luna: Grey Fancy Rat with round pink ears, tapered snout, pink nose & long rat tail
    const body = M(G.sphere, 0x7a8090, 0.34, 0.29, 0.44); body.position.set(0, 0.36, -0.02); root.add(body);
    const head = M(G.sphere, 0x868d9e, 0.25, 0.23, 0.31); head.position.set(0, 0.62, 0.24); root.add(head);
    const snout = M(G.cone, 0x868d9e, 0.14, 0.2, 0.14); snout.rotation.x = Math.PI / 2; snout.position.set(0, 0.59, 0.5); root.add(snout);
    const nose = M(G.sphereLo, 0xff9ab8, 0.048); nose.position.set(0, 0.6, 0.6); root.add(nose);
    [-0.19, 0.19].forEach((x) => {
      const ear = M(G.cyl, 0x868d9e, 0.14, 0.035, 0.14); ear.rotation.x = Math.PI / 2; ear.position.set(x, 0.79, 0.16); root.add(ear);
      const inner = M(G.cyl, 0xffb3c8, 0.095, 0.04, 0.095); inner.rotation.x = Math.PI / 2; inner.position.set(x, 0.79, 0.17); root.add(inner);
    });
    [-0.09, 0.09].forEach((x) => { const eye = M(G.sphereLo, 0x181824, 0.044); eye.position.set(x, 0.65, 0.45); root.add(eye); });
    const collar = M(G.torus, 0x9b5de5, 0.21, 0.21, 0.04); collar.rotation.x = Math.PI / 2; collar.position.set(0, 0.48, 0.18); root.add(collar);
    const moon = M(G.sphereLo, basic(0xffd23f), 0.065); moon.position.set(0, 0.44, 0.38); root.add(moon);
    const tail = M(G.cyl8, 0xe8a5b8, 0.042, 0.52, 0.03); tail.position.set(0, 0.36, -0.46); tail.rotation.x = -1.1; root.add(tail);
  } else if (id === 'pirat') {
    // Pi-rat: One-Eyed Brown Fancy Rat with pirate eye patch, round ears, pirate hat & rat tail
    const body = M(G.sphere, 0x7c5236, 0.34, 0.3, 0.44); body.position.set(0, 0.37, -0.02); root.add(body);
    const head = M(G.sphere, 0x8d5f40, 0.25, 0.23, 0.31); head.position.set(0, 0.63, 0.24); root.add(head);
    const snout = M(G.cone, 0x8d5f40, 0.14, 0.2, 0.14); snout.rotation.x = Math.PI / 2; snout.position.set(0, 0.6, 0.5); root.add(snout);
    const nose = M(G.sphereLo, 0xff9ab8, 0.048); nose.position.set(0, 0.61, 0.6); root.add(nose);
    [-0.19, 0.19].forEach((x) => {
      const ear = M(G.cyl, 0x7c5236, 0.14, 0.035, 0.14); ear.rotation.x = Math.PI / 2; ear.position.set(x, 0.79, 0.16); root.add(ear);
      const inner = M(G.cyl, 0xffb3c8, 0.095, 0.04, 0.095); inner.rotation.x = Math.PI / 2; inner.position.set(x, 0.79, 0.17); root.add(inner);
    });
    const eye = M(G.sphereLo, 0x111111, 0.045); eye.position.set(-0.09, 0.66, 0.46); root.add(eye);
    const patch = M(G.sphereLo, 0x111111, 0.068); patch.position.set(0.09, 0.66, 0.46); root.add(patch);
    const strap = M(G.torus, 0x111111, 0.25, 0.25, 0.025); strap.rotation.y = 0.35; strap.position.set(0, 0.66, 0.24); root.add(strap);
    const hat = M(G.cone, 0x23192d, 0.32, 0.22, 0.32); hat.position.set(0, 0.9, 0.2); root.add(hat);
    const trim = M(G.torus, 0xffd23f, 0.28, 0.28, 0.04); trim.rotation.x = Math.PI / 2; trim.position.set(0, 0.8, 0.2); root.add(trim);
    const tail = M(G.cyl8, 0xd89aa8, 0.042, 0.52, 0.03); tail.position.set(0, 0.36, -0.46); tail.rotation.x = -1.1; root.add(tail);
  } else if (id === 'snowie') {
    // Snowie: Pure White Fancy Rat with pink inner ears, pink nose, long tail & frosty cyan scarf
    const body = M(G.sphere, 0xfafcff, 0.34, 0.29, 0.44); body.position.set(0, 0.36, -0.02); root.add(body);
    const head = M(G.sphere, 0xffffff, 0.25, 0.23, 0.31); head.position.set(0, 0.62, 0.24); root.add(head);
    const snout = M(G.cone, 0xffffff, 0.14, 0.2, 0.14); snout.rotation.x = Math.PI / 2; snout.position.set(0, 0.59, 0.5); root.add(snout);
    const nose = M(G.sphereLo, 0xff9ab8, 0.048); nose.position.set(0, 0.6, 0.6); root.add(nose);
    [-0.19, 0.19].forEach((x) => {
      const ear = M(G.cyl, 0xffffff, 0.14, 0.035, 0.14); ear.rotation.x = Math.PI / 2; ear.position.set(x, 0.79, 0.16); root.add(ear);
      const inner = M(G.cyl, 0xffbfd4, 0.095, 0.04, 0.095); inner.rotation.x = Math.PI / 2; inner.position.set(x, 0.79, 0.17); root.add(inner);
    });
    [-0.09, 0.09].forEach((x) => { const eye = M(G.sphereLo, 0xc92a52, 0.044); eye.position.set(x, 0.65, 0.45); root.add(eye); });
    const scarf = M(G.torus, 0x3ff0ff, 0.22, 0.22, 0.05); scarf.rotation.x = Math.PI / 2; scarf.position.set(0, 0.49, 0.18); root.add(scarf);
    const tail = M(G.cyl8, 0xffccd8, 0.042, 0.52, 0.03); tail.position.set(0, 0.36, -0.46); tail.rotation.x = -1.1; root.add(tail);
  } else if (id === 'candy') {
    // Candy: Miniature Schnauzer (salt-and-pepper grey dog with white bushy schnauzer beard & eyebrows, folded ears)
    const body = M(G.sphere, 0x767c86, 0.36, 0.31, 0.46); body.position.set(0, 0.4, -0.02); root.add(body);
    [[-0.18, 0.2], [0.18, 0.2], [-0.18, -0.2], [0.18, -0.2]].forEach((p) => {
      const leg = M(G.cyl8, 0xd8dee8, 0.075, 0.26, 0.075); leg.position.set(p[0], 0.22, p[1]); root.add(leg);
    });
    const head = M(G.box, 0x828894, 0.36, 0.32, 0.36); head.position.set(0, 0.68, 0.24); root.add(head);
    // Bushy white schnauzer beard & muzzle
    const muzzle = M(G.box, 0xf2f5fa, 0.28, 0.22, 0.24); muzzle.position.set(0, 0.58, 0.44); root.add(muzzle);
    const beard = M(G.box, 0xffffff, 0.26, 0.18, 0.16); beard.position.set(0, 0.44, 0.45); root.add(beard);
    // Bushy white schnauzer eyebrows
    [-0.1, 0.1].forEach((x) => {
      const brow = M(G.box, 0xffffff, 0.12, 0.05, 0.08); brow.position.set(x, 0.78, 0.42); brow.rotation.z = x < 0 ? 0.2 : -0.2; root.add(brow);
      const eye = M(G.sphereLo, 0x1a1412, 0.044); eye.position.set(x, 0.71, 0.43); root.add(eye);
    });
    const nose = M(G.sphereLo, 0x18181c, 0.055); nose.position.set(0, 0.66, 0.56); root.add(nose);
    // Folded V-shaped schnauzer ears
    [-0.19, 0.19].forEach((x) => {
      const ear = M(G.box, 0x565b64, 0.1, 0.2, 0.14); ear.position.set(x, 0.78, 0.2); ear.rotation.z = x < 0 ? 0.35 : -0.35; root.add(ear);
    });
    const collar = M(G.torus, 0xff4fd8, 0.23, 0.23, 0.045); collar.rotation.x = Math.PI / 2; collar.position.set(0, 0.51, 0.2); root.add(collar);
    const tail = M(G.cyl8, 0x767c86, 0.05, 0.22, 0.05); tail.position.set(0, 0.58, -0.38); tail.rotation.x = -0.45; root.add(tail);
  } else {
    // Torty (Martina): Desert Tortoise with domed tan/olive desert scute carapace & sturdy tortoise legs
    const shell = M(G.sphere, 0x8c6d46, 0.44, 0.32, 0.48); shell.position.set(0, 0.39, -0.02); root.add(shell);
    const scute = M(G.cyl8, 0x6e5332, 0.3, 0.18, 0.34); scute.position.set(0, 0.54, -0.02); root.add(scute);
    const rimS = M(G.torus, 0xb59264, 0.42, 0.42, 0.055); rimS.rotation.x = Math.PI / 2; rimS.position.set(0, 0.27, -0.02); root.add(rimS);
    [[-0.26, 0.22], [0.26, 0.22], [-0.26, -0.22], [0.26, -0.22]].forEach((p) => {
      const leg = M(G.cyl8, 0x788254, 0.085, 0.2, 0.085); leg.position.set(p[0], 0.2, p[1]); root.add(leg);
    });
    const head = M(G.sphere, 0x788254, 0.2, 0.18, 0.24); head.position.set(0, 0.46, 0.42); root.add(head);
    [-0.08, 0.08].forEach((x) => { const eye = M(G.sphereLo, 0x1a1812, 0.038); eye.position.set(x, 0.5, 0.6); root.add(eye); });
    const badge = M(G.sphereLo, basic(0xffd23f), 0.07); badge.position.set(0, 0.62, 0.18); root.add(badge);
  }
  const petLabels = {
    luna: '🐀 Luna · Grey Fancy Rat',
    pirat: '🏴‍☠️ Pi-rat · One-Eyed Pirate Rat',
    snowie: '🐁 Snowie · White Fancy Rat',
    candy: '🐶 Candy · Mini Schnauzer',
    torty: '🐢 Torty · Desert Tortoise'
  };
  if (GP.nameTag && petLabels[id]) {
    const tag = GP.nameTag(petLabels[id], '#ffe14d');
    tag.position.y = 1.45;
    tag.scale.multiplyScalar(0.82);
    g.add(tag);
  }
  GP.shadowy(g, true, false);
  g.userData.root = root;
  return g;
};

/* ---------- Fiesta Hazards (Spicy Chili Carts & Pinching Beach Crabs) ---------- */
W.chiliCart = function () {
  const g = new THREE.Group();
  const body = M(G.box, 0xff2a2a, 1.3, 0.55, 0.85); body.position.y = 0.55; g.add(body);
  const stripe = M(G.box, 0xffd23f, 1.34, 0.14, 0.88); stripe.position.y = 0.58; g.add(stripe);
  const chili = M(G.cone, 0xff4d00, 0.28, 0.9, 0.28); chili.rotation.z = Math.PI / 2; chili.position.set(0, 1.0, 0); g.add(chili);
  const glow = GP.glowSprite(0xff4d00, 2.2); glow.position.y = 0.9; g.add(glow);
  [-0.45, 0.45].forEach((x) => [-0.42, 0.42].forEach((z) => {
    const wh = M(G.cyl, 0x222222, 0.24, 0.1, 0.24); wh.rotation.x = Math.PI / 2; wh.position.set(x, 0.24, z); g.add(wh);
  }));
  GP.shadowy(g, true, false);
  return g;
};

W.crab = function () {
  const g = new THREE.Group();
  const body = M(G.sphere, 0xff3b30, 0.45, 0.24, 0.36); body.position.y = 0.26; g.add(body);
  [-0.16, 0.16].forEach((x) => {
    const stalk = M(G.cyl8, 0xff3b30, 0.04, 0.18, 0.04); stalk.position.set(x, 0.45, 0.18); g.add(stalk);
    const eye = M(G.sphereLo, 0x111111, 0.055); eye.position.set(x, 0.55, 0.2); g.add(eye);
    const claw = M(G.sphere, 0xff5e3a, 0.18, 0.12, 0.24); claw.position.set(x * 2.4, 0.3, 0.28); g.add(claw);
  });
  GP.shadowy(g, true, false);
  return g;
};

/* ======================================================================
   THE AREAS. Each returns { grp, col:[{x,z,r}], anims:[], ...named parts }
   ====================================================================== */
function ground(grp, w, d, col, edge) {
  const g = M(G.box, col, w, 1, d); g.position.y = -0.5; grp.add(GP.shadowy(g, false, true));
  if (edge) { const e = M(G.box, edge, w + 1, 0.9, d + 1); e.position.y = -0.95; grp.add(e); }
}
function treeRing(A, r, n, xs, zs, make, keepOut) {
  for (let k = 0; k < n; k++) {
    const x = (r() - 0.5) * xs, z = (r() - 0.5) * zs; if (keepOut(x, z)) continue;
    if (A.col.some((c) => Math.hypot(c.x - x, c.z - z) < c.r + 1.4)) continue;
    const o = make(k); o.position.set(x, 0, z); o.rotation.y = r() * TAU; A.grp.add(o); A.col.push({ x, z, r: 0.6 });
  }
}
const AREAS = W.AREAS = [
  { id: 'isle', name: 'Fiesta Isles', icon: '\uD83C\uDFDD\uFE0F', spawn: [0, 11], ell: [30, 25], theme: { fog: 0xffc8a8, fogNear: 45, fogFar: 145, hemiSky: 0xfff4e0, hemiGround: 0x8ab06a, hemiI: 0.92, sunI: 1.05, sunC: 0xffe6c0 } },
  { id: 'plaza', name: 'Pi\u00f1ata Plaza', icon: '\uD83E\uDE85', spawn: [0, 10], box: [17, 13.5], theme: { fog: 0xff9ac8, fogNear: 40, fogFar: 115, hemiSky: 0xffe0f0, hemiGround: 0x9a6a8a, hemiI: 0.88, sunI: 0.98, sunC: 0xffd0b0 } },
  { id: 'taco', name: 'Taco Pueblo', icon: '\uD83C\uDF2E', spawn: [0, 10], box: [17, 13.5], theme: { fog: 0xffc890, fogNear: 40, fogFar: 115, hemiSky: 0xfff0d0, hemiGround: 0xb08a5a, hemiI: 0.9, sunI: 1.0, sunC: 0xffe0b0 } },
  { id: 'bay', name: 'Maraca Bay', icon: '\uD83C\uDFD6\uFE0F', spawn: [0, 10], box: [17, 13.5], theme: { fog: 0xb8e8ff, fogNear: 45, fogFar: 130, hemiSky: 0xfff4e8, hemiGround: 0xb89a6a, hemiI: 0.78, sunI: 0.9, sunC: 0xffe8c8 } },
  { id: 'viejo', name: 'Gran Pueblo Viejo', icon: '\uD83C\uDFDB\uFE0F', spawn: [0, 10], box: [18, 14], theme: { fog: 0xffcfa0, fogNear: 42, fogFar: 125, hemiSky: 0xfff4dc, hemiGround: 0x8a7968, hemiI: 0.92, sunI: 1.04, sunC: 0xffe4b5 } },
];
// gates on the isle (town idx -> position) and the exit gate in every town
W.GATES = { 1: [0, -20], 2: [-23, 2], 3: [23, 2], 4: [0, 19.5] };
W.EXIT = [0, 13.2];

W.build = function (idx) {
  const A = { grp: new THREE.Group(), col: [], anims: [] }, r = GP.rng(4242 + idx * 77);
  const add = (o, x, z, cr, ry) => { o.position.x = x; o.position.z = z; if (ry) o.rotation.y = ry; A.grp.add(o); if (cr) A.col.push({ x, z, r: cr }); return o; };
  if (idx === 0) {
    const isl = M(G.cyl20, 0x6ad06a, 31, 2, 26); isl.position.y = -1; A.grp.add(GP.shadowy(isl, false, true));
    const sand = M(G.cyl20, 0xf2dca0, 33, 1.6, 28); sand.position.y = -1.3; A.grp.add(sand);
    const sea = new THREE.Mesh(G.plane, mat(0x3ab8e8, { emissive: 0x0a4a6a })); sea.scale.set(500, 1, 500); sea.position.y = -1.0; A.grp.add(sea); A.sea = sea;
    // dirt paths to the three town gates + welcome
    const path = mat(0xe8c890);
    [[0, 4, 0, -19], [0, 4, -22, 2], [0, 4, 22, 2], [0, 4, 0, 18]].forEach((p) => { const n = Math.round(Math.hypot(p[2] - p[0], p[3] - p[1]) / 1.4); for (let k = 0; k <= n; k++) { const d = new THREE.Mesh(G.cyl20, path); d.scale.set(1.1, 0.05, 1.1); d.position.set(p[0] + (p[2] - p[0]) * k / n, 0.02, p[1] + (p[3] - p[1]) * k / n); A.grp.add(d); } });
    const plaza = new THREE.Mesh(G.cyl20, mat(0xf2d6a8)); plaza.scale.set(4.2, 0.06, 4.2); plaza.position.set(0, 0.03, 4); A.grp.add(plaza);
    // Cobblestone grand avenues & central stone plaza on Fiesta Isles
    W.stonePlaza(A.grp, 0, 4, 6.2, r);
    W.stoneRoad(A.grp, 0, 4, 0, -19.5, 3.2, r);
    W.stoneRoad(A.grp, 0, 4, -22.5, 2, 3.0, r);
    W.stoneRoad(A.grp, 0, 4, 22.5, 2, 3.0, r);
    W.stoneRoad(A.grp, 0, 4, 0, 19, 3.2, r);
    // Stone merchant shops right on Fiesta Isles Hub so the hub feels like a bustling stone village
    const hubShopL = add(W.stoneShop('RATITA BAZAAR', 0xff4fd8, 0xdfd3c3, 4.6, 3.6, 3.2), -10.5, -4.5, 2.2, 0.35);
    const hubShopR = add(W.stoneShop('TORTUGA GEAR', 0x3ad88a, 0xd5c9b8, 4.6, 3.6, 3.2), 10.5, -4.5, 2.2, -0.35);
    A.hubShops = [{ id: 'bazaar', x: -10.5, z: -2.3 }, { id: 'tortuga_hub', x: 10.5, z: -2.3 }];
    // gates to the 4 towns (including Gran Pueblo Viejo to the south)
    [[1, 'PI\u00d1ATA PLAZA', 0xff4fd8, 0], [2, 'TACO PUEBLO', 0xff7a3d, Math.PI / 2], [3, 'MARACA BAY', 0x3ff0ff, -Math.PI / 2], [4, 'GRAN PUEBLO VIEJO', 0xffb703, Math.PI]].forEach((q) => { const p = W.GATES[q[0]], a = W.arch(q[1], q[2], 5.2); a.position.set(p[0], 0, p[1]); a.rotation.y = q[3]; A.grp.add(a); const dx = Math.sin(q[3]), dz = Math.cos(q[3]); [-1, 1].forEach((s) => A.col.push({ x: p[0] + dz * s * 2.5, z: p[1] - dx * s * 2.5, r: 0.5 })); });
    const wel = W.arch('\u00a1BIENVENIDOS!', 0xffd23f, 6); wel.position.set(0, 0, -7.5); A.grp.add(wel); A.col.push({ x: -3, z: -7.5, r: 0.5 }, { x: 3, z: -7.5, r: 0.5 });
    // bus stop + the Fiesta Bus
    add(W.busStop(), 5.5, 3, 0.9, -Math.PI / 2); const bus = add(W.fiestaBus(), 8.6, 5.4, 0, Math.PI / 2); A.col.push({ x: 8.6, z: 4, r: 1.2 }, { x: 8.6, z: 6.8, r: 1.2 }); A.bus = bus;
    // centre: big sombrero statue on a plinth
    const pl = M(G.cyl20, 0xe8d8b8, 1.4, 0.8, 1.4); pl.position.set(0, 0.4, 4); A.grp.add(pl); const som = W.sombrero(0xff4fd8, true); som.scale.setScalar(2.2); som.position.set(0, 1.3, 4); A.grp.add(GP.shadowy(som, true, false)); A.col.push({ x: 0, z: 4, r: 1.7 }); A.statue = som;
    // hills + nature
    for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + 0.3, h = W.hill(4 + r() * 3, k % 2 ? 0x59c25a : 0x4ab04e); h.position.set(Math.cos(a) * 27, -0.2, Math.sin(a) * 22); if (Math.abs(Math.sin(a)) > 0.92 || Math.abs(Math.cos(a)) > 0.95) continue; A.grp.add(h); A.col.push({ x: h.position.x, z: h.position.z, r: h.scale.x * 0.9 }); }
    treeRing(A, r, 85, 54, 46, (k) => { const q = k % 5; return q < 2 ? W.palm(0.9 + r() * 0.5, 0.3) : q === 2 ? W.cactus(0.8 + r() * 0.4, FIESTA[k % 7]) : q === 3 ? W.agave(1 + r() * 0.5) : W.flowerPot(1.2); }, (x, z) => Math.hypot(x / 27, z / 22) > 1 || Math.abs(x) < 3.2 || Math.abs(z - 3) < 2.6 || Math.hypot(x, z - 4) < 7.5 || Math.hypot(x - 8, z - 5) < 4.5 || (z > 6 && Math.abs(x) < 9));
    for (let k = 0; k < 14; k++) { const c = GP.buildCloud(1 + r() * 1.6); c.position.set((r() - 0.5) * 220, 20 + r() * 18, -60 - r() * 80); A.grp.add(c); }
    // boats on the sea
    A.boats = []; for (let k = 0; k < 4; k++) { const b = boat(FIESTA[k]); const a = k * 1.6 + 0.4; b.position.set(Math.cos(a) * 44, -0.9, Math.sin(a) * 38); b.rotation.y = -a; A.grp.add(b); A.boats.push(b); }
    A.anims.push((t) => { A.boats.forEach((b, k) => { b.position.y = -0.85 + Math.sin(t * 1.4 + k) * 0.12; b.rotation.z = Math.sin(t + k) * 0.06; }); som.rotation.y = t * 0.4; });
  } else {
    const th = [null, [0xf2c6a0, 0xd8946a], [0xe8c890, 0xb08a5a], [0xf2dca0, 0xd8c08a], [0xd8c8b4, 0x8e8070]][idx];
    ground(A.grp, 38, 32, th[0], th[1]);
    // exit gate (south) + bus stop
    const ex = W.exitGate('\u2193 FIESTA ISLES'); ex.position.set(W.EXIT[0], 0, W.EXIT[1] + 0.4); A.grp.add(ex); A.col.push({ x: -2.6, z: W.EXIT[1] + 0.4, r: 0.4 }, { x: 2.6, z: W.EXIT[1] + 0.4, r: 0.4 });
    add(W.busStop(), 8.5, 11.4, 0.9, Math.PI);
    if (idx === 1) buildPlaza(A, r, add); else if (idx === 2) buildTaco(A, r, add); else if (idx === 3) buildBay(A, r, add); else buildViejo(A, r, add);
    for (let k = 0; k < 8; k++) { const c = GP.buildCloud(1 + r() * 1.4); c.position.set((r() - 0.5) * 160, 18 + r() * 14, -50 - r() * 60); A.grp.add(c); }
  }
  // Attach 3D Pets & Patrolling Fiesta Hazards in every area
  A.pets = [];
  const petPlacements = [
    [{ id: 'luna', x: -4.2, z: 5.2 }, { id: 'torty', x: 4.5, z: 5.2 }],
    [{ id: 'candy', x: -6.2, z: 4.5 }],
    [{ id: 'pirat', x: -5.5, z: 2.2 }],
    [{ id: 'snowie', x: 4.2, z: 3.2 }],
    [{ id: 'luna', x: -5.2, z: 3.5 }, { id: 'pirat', x: 5.2, z: 3.5 }, { id: 'snowie', x: -5.2, z: -3.5 }, { id: 'candy', x: 5.2, z: -3.5 }, { id: 'torty', x: 0, z: 5.8 }]
  ][idx] || [];
  petPlacements.forEach((pp) => {
    const pm = W.pet(pp.id);
    pm.position.set(pp.x, 0, pp.z);
    A.grp.add(pm);
    A.pets.push({ id: pp.id, x: pp.x, z: pp.z, mesh: pm });
  });
  A.hazards = [];
  const hazDefs = [
    [{ type: 'chili', x0: -6, z0: -4, dx: 6, dz: 0, spd: 1.5, name: 'Runaway Chili Cart' }],
    [{ type: 'chili', x0: 0, z0: 6.2, dx: 7.5, dz: 0, spd: 1.7, name: 'Disco Jalape\u00f1o Cart' }],
    [{ type: 'chili', x0: 0, z0: -1.5, dx: 9.5, dz: 0, spd: 1.9, name: 'Spicy Salsa Cart' }],
    [{ type: 'crab', x0: -4, z0: -4.8, dx: 6.5, dz: 0, spd: 1.8, name: 'Pinching Fiesta Crab' }],
    [{ type: 'chili', x0: 0, z0: -3.5, dx: 8.5, dz: 0, spd: 1.75, name: 'Cobblestone Pepper Cart' }]
  ][idx] || [];
  hazDefs.forEach((hd, hk) => {
    const hm = hd.type === 'crab' ? W.crab() : W.chiliCart();
    hm.position.set(hd.x0, 0, hd.z0);
    A.grp.add(hm);
    A.hazards.push({ type: hd.type, name: hd.name, x: hd.x0, z: hd.z0, x0: hd.x0, z0: hd.z0, dx: hd.dx, dz: hd.dz, spd: hd.spd, mesh: hm, phase: hk * 1.7 });
  });
  A.anims.push((t) => {
    A.pets.forEach((p, pk) => {
      if (p.mesh.userData.root) {
        p.mesh.userData.root.position.y = Math.abs(Math.sin(t * 2.8 + pk)) * 0.12;
        p.mesh.userData.root.rotation.y = Math.sin(t * 1.4 + pk) * 0.35;
      }
    });
    A.hazards.forEach((h) => {
      const s = Math.sin(t * h.spd + h.phase), c = Math.cos(t * h.spd + h.phase);
      h.x = h.x0 + s * h.dx;
      h.z = h.z0 + s * h.dz;
      h.mesh.position.set(h.x, 0, h.z);
      h.mesh.rotation.y = c >= 0 ? 0 : Math.PI;
    });
  });
  return A;
};
function boat(col) {
  const g = new THREE.Group(); const hull = M(G.box, col, 2.6, 0.6, 1.1); hull.position.y = 0.3; g.add(hull);
  const bow = M(new THREE.ConeGeometry(0.78, 1.2, 4), col); bow.rotation.z = -Math.PI / 2; bow.rotation.x = Math.PI / 4; bow.position.set(1.85, 0.3, 0); bow.scale.set(1, 1, 0.72); g.add(bow);
  const rim = M(G.box, 0xffffff, 2.7, 0.12, 1.15); rim.position.y = 0.62; g.add(rim);
  const mast = M(G.cyl8, 0x8a5a2a, 0.05, 2.2, 0.05); mast.position.y = 1.7; g.add(mast);
  const sail = M(new THREE.ConeGeometry(0.8, 1.8, 3), mat(0xffffff, { side: THREE.DoubleSide })); sail.position.set(0.35, 1.8, 0); sail.scale.set(0.6, 1, 0.05); g.add(sail);
  GP.shadowy(g, true, false); return g;
}
W.boat = boat;
function buildPlaza(A, r, add) {
  // painted tile ring around the dance floor
  const tiles = new THREE.Mesh(G.cyl20, mat(0xe8b090)); tiles.scale.set(9, 0.05, 9); tiles.position.set(0, 0.02, -1); A.grp.add(tiles);
  // glowing dance floor 6x6
  const floor = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const tl = new THREE.Mesh(G.box, new THREE.MeshBasicMaterial({ color: FIESTA[(i + j) % 7] })); tl.scale.set(1.25, 0.12, 1.25); tl.position.set(-3.2 + i * 1.28, 0.06, -4.2 + j * 1.28); A.grp.add(tl); floor.push(tl); }
  const disco = W.discoBall(); disco.position.set(0, 6.2, -1); A.grp.add(disco);
  const beams = []; for (let k = 0; k < 4; k++) { const bm = new THREE.Mesh(new THREE.ConeGeometry(1.2, 6, 12, 1, true), new THREE.MeshBasicMaterial({ color: FIESTA[k], transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); bm.position.set(0, 3.1, -1); A.grp.add(bm); beams.push(bm); }
  A.dance = { x: 0, z: -1, r: 4.2 };
  // stage + arch
  const st = M(G.box, 0x8a4a8a, 11, 0.8, 4); st.position.set(0, 0.4, -10.6); A.grp.add(GP.shadowy(st, true, true)); A.col.push({ x: -4, z: -10.6, r: 2.1 }, { x: 0, z: -10.6, r: 2.1 }, { x: 4, z: -10.6, r: 2.1 });
  const stArch = W.arch('MARIACHI STAGE', 0xff4fd8, 10); stArch.position.set(0, 0.8, -12.3); A.grp.add(stArch);
  const spk = (x) => { const s = M(G.box, 0x2a2a3a, 0.9, 1.4, 0.8); s.position.set(x, 1.5, -11.4); A.grp.add(s); const c = M(G.cyl, 0x666677, 0.28, 0.06, 0.28); c.rotation.x = Math.PI / 2; c.position.set(x, 1.6, -11.0); A.grp.add(c); };
  spk(-4.6); spk(4.6);
  A.band = { x: 0, z: -10 };
  // pinata frame (east) + fountain (west)
  add(W.pinataFrame(), 10.5, 3, 0); A.col.push({ x: 8.7, z: 3, r: 0.3 }, { x: 12.3, z: 3, r: 0.3 });
  const pin = W.pinata(); pin.position.set(10.5, 2.6, 3); A.grp.add(pin); A.pin = pin; A.pinSpot = { x: 10.5, z: 4.6 };
  const fo = add(W.fountain(), -10.5, 3, 2.3); A.anims.push(fo.userData.anim); A.fount = { x: -10.5, z: 3 };
  // Cobblestone perimeter promenade + interactive Stone Shops around Piñata Plaza
  W.stonePlaza(A.grp, 0, -1, 10.6, r);
  W.stoneRoad(A.grp, -13, 8.5, 13, 8.5, 3.0, r);
  const sPin = add(W.stoneShop('PI\u00d1ATA WORKSHOP', 0xff4fd8, 0xe6d6c3, 4.6, 3.8, 3.2), -14.2, -4.5, 2.3, Math.PI / 2);
  const sCandy = add(W.stoneShop('CANDY EMPORIUM', 0xffbe0b, 0xeadbc8, 4.6, 3.8, 3.2), 14.2, -4.5, 2.3, -Math.PI / 2);
  A.plazaShops = [{ id: 'pinata_shop', x: -11.6, z: -4.5 }, { id: 'candy_shop', x: 11.6, z: -4.5 }];
  const hc = [0xffb3c8, 0xffe08a, 0x9ad8ff, 0xc8a8ff];
  [[-14, -11.5, 0.6], [14, -11.5, -0.6], [-14.2, 9, Math.PI / 2], [14.2, 9, -Math.PI / 2]].forEach((p, k) => { const h = W.house(4, 3 + (k % 3) * 0.8, 3.2, hc[k], k % 2 ? 0xd8643a : null, r); h.position.set(p[0], 0, p[1]); h.rotation.y = p[2]; A.grp.add(h); A.col.push({ x: p[0], z: p[1], r: 2.4 }); });
  // banners + lights criss-crossing the square
  A.flags = [];
  [[-14, 4.5, -11, 14, 4.5, -11], [-13, 4.2, -5, 13, 4.2, 5], [-13, 4.2, 5, 13, 4.2, -5], [-14, 4.4, 9, 14, 4.4, 9]].forEach((q) => A.flags.push(...W.papel(A.grp, q[0], q[1], q[2], q[3], q[4], q[5], r)));
  [[-14, 5, -2, 14, 5, -2], [-6, 5.2, -12, -6, 5.2, 10], [6, 5.2, -12, 6, 5.2, 10]].forEach((q) => W.lights(A.grp, q[0], q[1], q[2], q[3], q[4], q[5]));
  [[-14, -2], [14, -2], [-6, -12], [-6, 10], [6, -12], [6, 10], [-14, 4.5], [14, 4.5]].forEach((p) => { const pole = M(G.cyl8, 0x8a5a2a, 0.08, 5.2, 0.08); pole.position.set(p[0], 2.6, p[1]); A.grp.add(pole); });
  [[-7, 7], [7, 7], [-12, -1], [12, -1]].forEach((p, k) => { add(W.bench(), p[0], p[1], 0.9, k < 2 ? Math.PI : (k === 2 ? Math.PI / 2 : -Math.PI / 2)); });
  [[-11, 11], [11, 11], [-3.5, 11.5], [3.5, 11.5], [-8, -8], [8, -8]].forEach((p, k) => add(k < 4 ? W.flowerPot(1.4, FIESTA[k]) : W.palm(0.8, 0.2), p[0], p[1], 0.5));
  A.anims.push((t) => {
    floor.forEach((tl, k) => tl.material.color.setHex(FIESTA[(k + Math.floor(t * 3)) % 7]));
    disco.rotation.y = t * 1.2; beams.forEach((b, k) => { b.rotation.set(Math.sin(t * 0.9 + k * 1.6) * 0.5, 0, Math.cos(t * 0.7 + k * 1.6) * 0.5); });
    A.flags.forEach((f) => { f.rotation.x = Math.sin(t * 2 + f.userData.sway) * 0.18; });
  });
}
function buildTaco(A, r, add) {
  // cobbled street
  const road = new THREE.Mesh(G.box, mat(0xc8a070)); road.scale.set(34, 0.04, 6); road.position.set(0, 0.02, -1.5); A.grp.add(road);
  for (let k = 0; k < 40; k++) { const c = new THREE.Mesh(G.cyl8, mat(k % 2 ? 0xb89060 : 0xd8b080)); c.scale.set(0.35, 0.05, 0.35); c.position.set((r() - 0.5) * 32, 0.04, -1.5 + (r() - 0.5) * 5); A.grp.add(c); }
  const STALLS = [['TACOS', 0xff4d4d], ['ELOTES', 0xffd23f], ['CHURROS', 0xc0782a], ['PALETAS', 0xff6ad5], ['AGUAS', 0x3ff0ff]];
  A.stalls = [];
  STALLS.forEach((s, k) => { const x = -12 + k * 6, st = W.stall(s[1], s[0]); st.position.set(x, 0, -7); A.grp.add(st); A.col.push({ x: x - 1, z: -7, r: 1.0 }, { x: x + 1, z: -7, r: 1.0 }); for (let j = 0; j < 3; j++) { const f = W.food(k); f.position.set(x - 0.8 + j * 0.8, 1.2, -6.8); f.scale.setScalar(1.6); if (k === 1 || k === 2) f.rotation.z = 1.3; A.grp.add(f); } A.stalls.push({ x, z: -5.2, k }); });
  // houses behind the stalls + sides
  const hc = [0xffc090, 0xffb3c8, 0xfff0a0, 0xa8e0ff, 0xc8f0a8];
  for (let k = 0; k < 5; k++) { const h = W.house(4.6, 3.4, 3, hc[k], 0xc8543a, r); h.position.set(-12 + k * 6, 0, -11.6); A.grp.add(h); }
  W.stoneRoad(A.grp, -16, -1.5, 16, -1.5, 5.2, r);
  W.stoneRoad(A.grp, 0, -1.5, 0, 12, 3.2, r);
  add(W.stoneShop('SALSA & SPICE SHOP', 0xff5400, 0xdfd0be, 4.6, 3.6, 3.2), -13.2, 7.8, 2.3, Math.PI / 2);
  add(W.stoneShop('SOMBRERO SASTRE', 0x8338ec, 0xe5d6c4, 4.6, 3.6, 3.2), 13.2, 7.8, 2.3, -Math.PI / 2);
  A.tacoShops = [{ id: 'salsa_shop', x: -10.6, z: 7.8 }, { id: 'sombrero_shop', x: 10.6, z: 7.8 }];
  // picnic tables
  A.tables = []; [-8, 0, 8].forEach((x, k) => { add(W.picnic(FIESTA[k * 2]), x, 4, 1.3); A.tables.push({ x, z: 5.4 }); });
  // chili garlands + papel picado + cacti
  A.flags = [];
  [[-15, 4.2, -4, 15, 4.2, -4], [-15, 4.2, 1, 15, 4.2, 1]].forEach((q) => A.flags.push(...W.papel(A.grp, q[0], q[1], q[2], q[3], q[4], q[5], r)));
  [-15, 15].forEach((x) => [-4, 1].forEach((z) => { const p = M(G.cyl8, 0x8a5a2a, 0.08, 4.2, 0.08); p.position.set(x, 2.1, z); A.grp.add(p); }));
  [[-15, -8], [15, -8], [-10, 10], [10, 10], [-4, 10.5], [4, 10.5]].forEach((p, k) => add(k < 2 ? W.cactus(1.1, FIESTA[k]) : k < 4 ? W.agave(1.3) : W.flowerPot(1.4, FIESTA[k]), p[0], p[1], 0.6));
  // a donkey cart of watermelons, for flavour
  const cart = new THREE.Group(); const cb = M(G.box, 0xb0703a, 2, 0.6, 1.2); cb.position.y = 0.8; cart.add(cb); [-0.8, 0.8].forEach((z) => { const wh = M(G.cyl, 0x5a3a2a, 0.45, 0.12, 0.45); wh.rotation.x = Math.PI / 2; wh.position.set(0, 0.45, z * 0.8); cart.add(wh); }); for (let k = 0; k < 4; k++) { const wm = M(G.sphereLo, 0x2f9a3a, 0.3, 0.26, 0.26); wm.position.set(-0.5 + (k % 2) * 0.6, 1.25, -0.25 + Math.floor(k / 2) * 0.5); cart.add(wm); }
  add(GP.shadowy(cart, true, false), 12, 4, 1.2, 0.4);
  A.anims.push((t) => A.flags.forEach((f) => { f.rotation.x = Math.sin(t * 2 + f.userData.sway) * 0.18; }));
}
function buildBay(A, r, add) {
  // sand + sea + gentle waves
  const sea = new THREE.Mesh(G.plane, mat(0x2ab0e8, { emissive: 0x0a4a6a, transparent: true, opacity: 0.92 })); sea.scale.set(300, 1, 200); sea.position.set(0, 0.05, -108); A.grp.add(sea);
  const foam = []; for (let k = 0; k < 3; k++) { const f = new THREE.Mesh(G.box, mat(0xffffff, { transparent: true, opacity: 0.6 })); f.scale.set(34, 0.04, 0.4); f.position.set(0, 0.08, -8 - k * 0.8); A.grp.add(f); foam.push(f); }
  const wet = new THREE.Mesh(G.box, mat(0xd8c08a)); wet.scale.set(34, 0.03, 2.5); wet.position.set(0, 0.02, -7); A.grp.add(wet);
  // boardwalk
  for (let k = 0; k < 17; k++) { const pl = M(G.box, k % 2 ? 0xb07a4a : 0xa06a3a, 1.9, 0.12, 2.2); pl.position.set(-16 + k * 2, 0.06, 8.5); A.grp.add(GP.shadowy(pl, false, true)); }
  // lighthouse on rocks (west)
  const lh = new THREE.Group(); for (let k = 0; k < 5; k++) { const s = M(G.cyl8, k % 2 ? 0xffffff : 0xff4d4d, 1.1 - k * 0.12, 1.2, 1.1 - k * 0.12); s.position.y = 0.6 + k * 1.2; lh.add(s); }
  const room = M(G.cyl8, basic(0xfff3a0), 0.6, 0.9, 0.6); room.position.y = 6.5; lh.add(room); const cap = M(G.cone, 0xff4d4d, 0.8, 0.8, 0.8); cap.position.y = 7.35; lh.add(cap); const lg = GP.glowSprite(0xfff0a0, 5); lg.position.y = 6.5; lh.add(lg);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.2, 14, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0a0, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); beam.rotation.z = Math.PI / 2; beam.position.set(7, 0, 0); const bp = new THREE.Group(); bp.position.y = 6.5; bp.add(beam); lh.add(bp);
  add(GP.shadowy(lh, true, false), -12.5, -10.5, 1.4); for (let k = 0; k < 6; k++) add(W.rock(0.7 + r() * 0.6, 0x8a8a9a), -12.5 + Math.cos(k) * 2, -10.5 + Math.sin(k) * 1.8, 0);
  A.lighthouse = { x: -12.5, z: -8.6 };
  // hammocks between palms
  A.hammocks = [];
  [[7, -2], [12, 1.5]].forEach((p) => {
    add(W.palm(1, 0.15), p[0] - 1.6, p[1], 0.5); add(W.palm(1, -0.15), p[0] + 1.6, p[1], 0.5);
    const hm = M(new THREE.SphereGeometry(1, 14, 6, 0, TAU, Math.PI * 0.62, Math.PI * 0.38), mat(FIESTA[A.hammocks.length * 2], { side: THREE.DoubleSide }), 1.5, 0.9, 0.45); hm.position.set(p[0], 1.85, p[1]); A.grp.add(hm);
    const st = M(G.box, 0xffffff, 3, 0.04, 0.5); st.position.set(p[0], 1.02, p[1]); st.scale.set(2.6, 0.04, 0.05); A.grp.add(st);
    A.hammocks.push({ x: p[0], z: p[1] + 1.4, hx: p[0], hz: p[1], hy: 0.95 });
  });
  // umbrellas + towels
  [[-6, 0], [-2, 3], [3, -1.5], [-9, 4]].forEach((p, k) => { const u = new THREE.Group(); const pole = M(G.cyl8, 0xeeeeee, 0.05, 2.4, 0.05); pole.position.y = 1.2; u.add(pole); for (let j = 0; j < 8; j++) { const seg = M(new THREE.ConeGeometry(1.4, 0.5, 8, 1, true, j * TAU / 8, TAU / 8), mat(j % 2 ? 0xffffff : FIESTA[k + 1], { side: THREE.DoubleSide })); seg.position.y = 2.45; u.add(seg); } const tw = M(G.box, FIESTA[(k + 4) % 7], 0.9, 0.03, 1.8); tw.position.set(0.9, 0.02, 0); u.add(tw); add(GP.shadowy(u, true, false), p[0], p[1], 0.3); });
  // sandcastle (grows when people help build it)
  const castle = new THREE.Group(); const sandM = mat(0xe8c880);
  const base = M(G.box, sandM, 2.4, 0.5, 2.4); base.position.y = 0.25; castle.add(base); const parts = [];
  [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].forEach((p) => { const tw = M(G.cyl8, sandM, 0.38, 1.1, 0.38); tw.position.set(p[0], 0.95, p[1]); castle.add(tw); const tp = M(G.cone, sandM, 0.45, 0.5, 0.45); tp.position.set(p[0], 1.75, p[1]); castle.add(tp); parts.push(tw, tp); });
  const keep = M(G.box, sandM, 1, 1.4, 1); keep.position.y = 1.2; castle.add(keep); const kt = M(G.cone, sandM, 0.75, 0.8, 0.75); kt.position.y = 2.3; castle.add(kt); parts.push(keep, kt);
  const flag = M(G.box, 0xff4fd8, 0.4, 0.25, 0.03); flag.position.set(0.2, 3.0, 0); castle.add(flag); const fp = M(G.cyl8, 0xffffff, 0.02, 0.6, 0.02); fp.position.y = 2.85; castle.add(fp); parts.push(flag, fp);
  const bucket = M(G.cyl8, 0xff4d4d, 0.25, 0.4, 0.2); bucket.position.set(1.7, 0.2, 0.6); castle.add(bucket);
  add(GP.shadowy(castle, true, true), -2, -4, 1.6); A.castle = { x: -2, z: -2.2, parts };
  // lifeguard tower
  const tower = new THREE.Group(); [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].forEach((p) => { const l = M(G.cyl8, 0xffffff, 0.06, 2, 0.06); l.position.set(p[0], 1, p[1]); tower.add(l); }); const pf = M(G.box, 0xff4d4d, 1.6, 0.15, 1.6); pf.position.y = 2; tower.add(pf); const hut = M(G.box, 0xffffff, 1.4, 1, 1.2); hut.position.y = 2.6; tower.add(hut); const rf = M(G.box, 0xff4d4d, 1.7, 0.12, 1.5); rf.position.y = 3.15; tower.add(rf);
  add(GP.shadowy(tower, true, false), 14, -5, 1.1);
  // boats + buoys
  A.boats = []; [[-4, -16], [6, -20], [13, -14]].forEach((p, k) => { const b = boat(FIESTA[k + 2]); b.position.set(p[0], 0.05, p[1]); b.rotation.y = k * 1.3; A.grp.add(b); A.boats.push(b); });
  const buoys = []; for (let k = 0; k < 5; k++) { const b = M(G.sphereLo, k % 2 ? 0xff4d4d : 0xffffff, 0.3); b.position.set(-14 + k * 7, 0.15, -11); A.grp.add(b); buoys.push(b); }
  W.stoneRoad(A.grp, -16, 8.5, 16, 8.5, 3.0, r);
  add(W.stoneShop('MARACA SURF SHOP', 0x00bbf9, 0xe2d6c5, 4.4, 3.5, 3.0), -13.5, 6.2, 2.2, Math.PI / 2);
  add(W.stoneShop('PERLA SHELL BOUTIQUE', 0xff6ad5, 0xe8dcd0, 4.4, 3.5, 3.0), 13.5, 6.2, 2.2, -Math.PI / 2);
  A.bayShops = [{ id: 'surf_shop', x: -11.0, z: 6.2 }, { id: 'pearl_shop', x: 11.0, z: 6.2 }];
  [[-15, 11], [15, 11], [-15, 2], [15, 10]].forEach((p) => add(W.palm(1.1, 0.25), p[0], p[1], 0.6));
  A.anims.push((t) => { bp.rotation.y = t * 0.8; foam.forEach((f, k) => { f.position.z = -8 - ((t * 0.4 + k / 3) % 1) * 2.4; f.material.opacity = 0.6 * (1 - ((t * 0.4 + k / 3) % 1)); }); A.boats.forEach((b, k) => { b.position.y = 0.05 + Math.sin(t * 1.3 + k) * 0.12; b.rotation.z = Math.sin(t + k) * 0.07; }); buoys.forEach((b, k) => { b.position.y = 0.15 + Math.sin(t * 2 + k) * 0.1; }); });
}

/* ---------- Area 4: Gran Pueblo Viejo (Grand Cobblestone Town & Stone Shop District) ---------- */
function buildViejo(A, r, add) {
  // Full cobblestone town square & grand stone streets
  W.stonePlaza(A.grp, 0, -0.5, 11.5, r);
  W.stoneRoad(A.grp, -17, -0.5, 17, -0.5, 4.4, r);
  W.stoneRoad(A.grp, 0, -13, 0, 12.5, 4.4, r);
  W.stoneRoad(A.grp, -15, -8.5, 15, -8.5, 3.4, r);
  W.stoneRoad(A.grp, -15, 6.5, 15, 6.5, 3.4, r);

  // Grand Clocktower Cathedral at the north end of the square
  const tower = add(W.clockTower(), 0, -11.8, 2.6, 0);
  A.bellTower = { x: 0, z: -9.0 };

  // Central Royal Fountain in the cobblestone plaza
  const fo = add(W.fountain(), 0, -0.5, 2.3); A.anims.push(fo.userData.anim); A.viejoFount = { x: 0, z: 1.8 };

  // 6 Grand Carved-Stone Shops lining the cobblestone avenues
  const shopDefs = [
    { id: 'joyeria', label: 'LA JOYER\u00cdA GEMS', col: 0xffbe0b, wall: 0xe6d8c5, x: -13.5, z: -6.5, ry: Math.PI / 2, sx: -10.8, sz: -6.5 },
    { id: 'artesanias', label: 'ARTESAN\u00cdAS DE PIEDRA', col: 0xff4fd8, wall: 0xddd0be, x: -13.5, z: 2.5, ry: Math.PI / 2, sx: -10.8, sz: 2.5 },
    { id: 'botica', label: 'BOTICA RATITA', col: 0x3ff0ff, wall: 0xe4d6c4, x: 13.5, z: -6.5, ry: -Math.PI / 2, sx: 10.8, sz: -6.5 },
    { id: 'armory', label: 'TORTUGA TECH FORGE', col: 0x3ad88a, wall: 0xd6cab8, x: 13.5, z: 2.5, ry: -Math.PI / 2, sx: 10.8, sz: 2.5 },
    { id: 'panaderia', label: 'PANADER\u00cdA DULCE', col: 0xff7a3d, wall: 0xeadbc8, x: -7.5, z: -11.2, ry: 0, sx: -7.5, sz: -8.6 },
    { id: 'musica', label: 'CASA DE LA M\u00daSICA', col: 0x9b5de5, wall: 0xe2d4c2, x: 7.5, z: -11.2, ry: 0, sx: 7.5, sz: -8.6 },
  ];
  A.viejoShops = [];
  shopDefs.forEach((sd) => {
    add(W.stoneShop(sd.label, sd.col, sd.wall, 5.0, 4.0, 3.4), sd.x, sd.z, 2.4, sd.ry);
    A.viejoShops.push({ id: sd.id, label: sd.label, x: sd.sx, z: sd.sz });
  });

  // Stone colonnade benches, lanterns & flower pots
  [[-5.5, 4.2], [5.5, 4.2], [-5.5, -4.8], [5.5, -4.8]].forEach((p, k) => {
    add(W.bench(), p[0], p[1], 0.9, k < 2 ? Math.PI : 0);
  });
  [[-8.5, 4.5], [8.5, 4.5], [-8.5, -4.5], [8.5, -4.5], [-3.8, 8.8], [3.8, 8.8]].forEach((p, k) => {
    add(W.flowerPot(1.45, FIESTA[k % 7]), p[0], p[1], 0.55);
  });

  // Criss-crossing papel picado & warm fiesta lights overhead
  A.flags = [];
  [[-13, 4.8, -6.5, 13, 4.8, -6.5], [-13, 4.8, 2.5, 13, 4.8, 2.5], [-12, 5.0, -6, 12, 5.0, 3], [-12, 5.0, 3, 12, 5.0, -6]].forEach((q) => A.flags.push(...W.papel(A.grp, q[0], q[1], q[2], q[3], q[4], q[5], r)));
  [[-13, 5.2, -2, 13, 5.2, -2], [-6, 5.2, -10, -6, 5.2, 8], [6, 5.2, -10, 6, 5.2, 8]].forEach((q) => W.lights(A.grp, q[0], q[1], q[2], q[3], q[4], q[5]));
  A.anims.push((t) => {
    A.flags.forEach((f) => { f.rotation.x = Math.sin(t * 2 + f.userData.sway) * 0.18; });
  });
}

/* ---------- Fiesta Isles party board (Party Board mode, DLC) ---------- */
GP.BOARDS.push({ id: 'fiesta', dlc: 'fiesta', name: 'Fiesta Isles', sub: 'Pi\u00f1atas, tacos and a mariachi parade', song: 'fiesta', n: 36,
  theme: { sky: 0xffa8a0, fog: 0xffc0a0, fogNear: 55, fogFar: 150, hemiSky: 0xfff0e0, hemiGround: 0xa08a5a, hemiI: 0.95, sunI: 1.05, sunC: 0xffe0b8 },
  ground: 0xf2d6a0, rim: 0xd8a868, sea: 0x3ab8e8, seaY: -1.8,
  loop: [[-17, -6], [-10, -12], [0, -9], [9, -13], [17, -7], [16, 4], [9, 11], [0, 8], [-9, 12], [-17, 5]],
  cuts: [{ f: 3 / 36, t: 21 / 36, name: 'Fiesta Street', toll: 3, types: 'BEBLB', bridge: 0xff4fd8 }],
  event: { name: 'Pi\u00f1ata Party!', desc: 'Whack a pi\u00f1ata for a shower of coins, or join the mariachi parade and dance ahead!' },
  color: '#ff4fd8', icon: '#ffb3e6',
  event_run: null });
const FB = GP.BOARDS[GP.BOARDS.length - 1];
FB.event.run = function (c) {
  const name = c.nm(c.i);
  if (c.r < 0.5) { const n = GP.randi(4, 8); c.addCoins(c.i, n); c.rivals.forEach((j) => c.addCoins(j, 1)); c.fx('boom', c.i); c.done('Pi\u00f1ata Party!', name + ' whacks the pi\u00f1ata: ' + n + ' coins! Everyone grabs 1 candy-coin.'); }
  else { const n = GP.randi(3, 5); c.forced(n, 'Mariachi Parade!', 'The band marches ' + name + ' ' + n + ' spaces ahead! \uD83C\uDFBA'); }
};
GP.BOARD_DECOR.fiesta = function (grp, rnd, g) {
  const ok = (x, z, d) => { for (const s of g.spaces) if (Math.hypot(s.x - x, s.z - z) < d) return false; return !(g.land && Math.hypot(g.land.x - x, g.land.z - z) < g.land.r + 0.5); };
  for (let i = 0; i < 110; i++) {
    const x = (rnd() - 0.5) * 50, z = (rnd() - 0.5) * 38; if (!ok(x, z, 2.2) || Math.hypot(x / 25, z / 19) > 1) continue;
    const q = rnd(), o = q < 0.35 ? W.palm(0.7 + rnd() * 0.4, 0.3) : q < 0.6 ? W.cactus(0.6 + rnd() * 0.4, FIESTA[i % 7]) : q < 0.8 ? W.agave(0.9 + rnd() * 0.4) : W.flowerPot(1.1);
    o.position.set(x, 0, z); o.rotation.y = rnd() * TAU; grp.add(o);
  }
  // centre: mini plaza with a pinata on its frame and a little band stand
  const c = new THREE.Group(); const fl = new THREE.Mesh(G.cyl20, mat(0xe8b090)); fl.scale.set(3, 0.08, 3); fl.position.y = 0.04; c.add(fl);
  const fr = W.pinataFrame(); fr.scale.setScalar(0.8); c.add(fr); const pin = W.pinata(); pin.scale.setScalar(0.8); pin.position.y = 2.1; c.add(pin);
  const folk = [W.folk({ shirt: 0x1b1440, pants: 0x1b1440, hat: 'sombrero', stache: true, prop: 'guitar' }), W.folk({ shirt: 0xffffff, pants: 0x1b1440, hat: 'sombrero', hatCol: 0x1b1440, prop: 'trumpet' })];
  folk.forEach((f, k) => { f.root.position.set(k ? 1.6 : -1.6, 0, 1.2); f.root.scale.setScalar(0.85); c.add(f.root); });
  const L = g.land; c.position.set(L.x, 0, L.z); c.scale.setScalar(GP.clamp(L.r / 3.2, 0.5, 1.2)); grp.add(GP.shadowy(c, true, true));
  const items = []; [[-20, 4, -14, 20, 4, -14], [-20, 4, 14, 20, 4, 14]].forEach((q) => items.push(...W.papel(grp, q[0], q[1], q[2], q[3], q[4], q[5], rnd)));
  [[-20, -14], [20, -14], [-20, 14], [20, 14]].forEach((p) => { const pole = M(G.cyl8, 0x8a5a2a, 0.1, 4, 0.1); pole.position.set(p[0], 2, p[1]); grp.add(pole); });
  for (let i = 0; i < 4; i++) { const b = boat(FIESTA[i]); const a = i * 1.7; b.position.set(Math.cos(a) * 36, -1.7, Math.sin(a) * 30); b.rotation.y = -a; grp.add(b); }
  for (let i = 0; i < 12; i++) { const cl = GP.buildCloud(1 + rnd() * 1.5, 0xfff0f0); cl.position.set((rnd() - 0.5) * 120, 14 + rnd() * 10, (rnd() - 0.5) * 100); if (Math.hypot(cl.position.x, cl.position.z) > 30) grp.add(cl); }
  grp.userData.anim = (t) => { pin.rotation.z = Math.sin(t * 1.4) * 0.15; pin.userData.body.rotation.y = t * 0.6; folk.forEach((f, k) => W.pose(f, 'play', 0.016)); items.forEach((f) => { f.rotation.x = Math.sin(t * 2 + f.userData.sway) * 0.18; }); };
};

/* ---------- music: a bouncy fiesta tune + the mariachi band ---------- */
GP.Snd.addSong('fiesta', { bpm: 128, mel: [72, 0, 76, 79, 0, 76, 79, 81, 79, 0, 76, 0, 72, 0, 74, 76, 77, 0, 81, 84, 0, 81, 84, 86, 84, 0, 81, 0, 77, 0, 79, 0, 76, 0, 79, 84, 0, 79, 76, 72, 74, 0, 77, 81, 0, 77, 74, 71, 72, 0, 76, 79, 84, 0, 83, 81, 79, 0, 77, 0, 76, 0, 0, 0], chords: [48, 53, 55, 48, 48, 53, 55, 48], minor: [0, 0, 0, 0, 0, 0, 0, 0] });
GP.Snd.addSong('mariachi', { bpm: 150, mel: [67, 72, 76, 0, 76, 74, 72, 0, 74, 77, 81, 0, 81, 79, 77, 0, 76, 79, 84, 0, 84, 83, 81, 79, 77, 76, 74, 0, 72, 0, 0, 0, 67, 72, 76, 0, 76, 77, 79, 0, 81, 79, 77, 0, 76, 74, 72, 0, 74, 76, 77, 0, 79, 77, 76, 74, 72, 0, 67, 0, 72, 0, 0, 0], chords: [48, 48, 53, 53, 48, 48, 55, 48], minor: [0, 0, 0, 0, 0, 0, 0, 0] });
GP.Snd.addSong('dance', { bpm: 120, mel: [72, 0, 72, 0, 79, 0, 76, 0, 77, 0, 77, 0, 81, 0, 79, 0, 76, 0, 76, 0, 84, 0, 81, 0, 79, 0, 77, 0, 76, 0, 74, 0, 72, 0, 72, 0, 79, 0, 76, 0, 77, 0, 81, 0, 84, 0, 83, 0, 81, 0, 79, 0, 77, 0, 76, 0, 74, 0, 76, 0, 72, 0, 0, 0], chords: [48, 53, 55, 48, 45, 53, 55, 48], minor: [0, 0, 0, 0, 1, 0, 0, 0] });
GP.Snd.addFx('fzhit', () => { GP.Snd.noise(0.12, 0.3, 900); GP.Snd.tone(220, 0.1, 'square', 0.08, 120); });
GP.Snd.addFx('fzboom', () => { GP.Snd.noise(0.5, 0.35, 1600); [72, 76, 79, 84, 88].forEach((m, i) => GP.Snd.tone(GP.Snd.mf(m), 0.18, 'square', 0.07, null, 0.08 + i * 0.06)); });
GP.Snd.addFx('fzeat', () => { [0, 0.12, 0.24].forEach((d) => GP.Snd.noise(0.06, 0.2, 2400, d)); GP.Snd.tone(660, 0.12, 'triangle', 0.08, 880, 0.36); });
GP.Snd.addFx('fzstamp', () => { GP.Snd.tone(180, 0.12, 'sine', 0.2, 60); [79, 84, 88].forEach((m, i) => GP.Snd.tone(GP.Snd.mf(m), 0.2, 'triangle', 0.08, null, 0.12 + i * 0.08)); });
GP.Snd.addFx('fzbus', () => { GP.Snd.tone(392, 0.18, 'square', 0.09); GP.Snd.tone(392, 0.25, 'square', 0.09, null, 0.25); });
GP.Snd.addFx('fztalk', () => { for (let i = 0; i < 4; i++) GP.Snd.tone(500 + Math.random() * 300, 0.05, 'triangle', 0.05, null, i * 0.06); });
})();
