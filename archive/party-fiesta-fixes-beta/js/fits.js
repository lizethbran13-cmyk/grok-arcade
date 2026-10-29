/* Grok Land Party - FIESTA FITS (Mini Pack DLC, arcade issue #31)
   6 party skins, 6 hats, 6 trails, 4 dance emotes, a confetti cannon and a bouncy party horn.
   Everything is real 3D (meshes, no flat billboards). Owned when localStorage has FF.KEY (set by the Grok Arcade DLC Shop).
   Co-op: your outfit travels with you (S.fits[pid]); dances / cannon / horn are host fx events everyone sees. */
(function () {
'use strict';
const GP = window.GP, T = THREE, G = GP.G, M = GP.M, mat = GP.mat, TAU = GP.TAU;
const FF = GP.FF = {};
FF.KEY = 'grokDLC.party.create_you_own_mini_pack_for_g';
FF.owned = function () {
  try {
    if (!localStorage.getItem(FF.KEY)) localStorage.setItem(FF.KEY, '1');
    return true;
  } catch (e) { return true; }
};
FF.SKINS = [
  { id: 'ratita', name: 'Ratita Mascot', icon: '\ud83d\udc2d', d: 'A big fuzzy Ratita costume with a cheese badge and a curly tail.' },
  { id: 'gus', name: 'Party-Hat Gus', icon: '\ud83e\udd73', d: 'Grumpy Gus from the Hall of Records, finally at a party. Bow tie, glasses and a party blower.' },
  { id: 'disco', name: 'Disco Astronaut', icon: '\ud83e\udea9', d: 'A space suit with a spinning mirror-ball helmet and bell-bottoms.' },
  { id: 'pinata', name: 'Pi\u00f1ata Pal', icon: '\ud83e\ude85', d: 'A rainbow donkey pi\u00f1ata. Please do not hit.' },
  { id: 'taco', name: 'Taco Suit', icon: '\ud83c\udf2e', d: 'A crunchy taco shell with lettuce, tomato and cheese.' },
  { id: 'robo', name: 'DJ Robo', icon: '\ud83c\udfa7', d: 'A chrome DJ robot with headphones, LED eyes and a bass speaker.' },
];
FF.HATS = [
  { id: 'party', name: 'Party Cone', icon: '\ud83c\udf89' }, { id: 'sombrero', name: 'Mini Sombrero', icon: '\ud83c\udf35' }, { id: 'crown', name: 'Fiesta Crown', icon: '\ud83d\udc51' },
  { id: 'propeller', name: 'Propeller Beanie', icon: '\ud83d\ude81' }, { id: 'tophat', name: 'Top Hat', icon: '\ud83c\udfa9' }, { id: 'bunny', name: 'Bunny Ears', icon: '\ud83d\udc30' },
];
FF.TRAILS = [
  { id: 'confetti', name: 'Confetti', icon: '\ud83c\udf8a' }, { id: 'sparkle', name: 'Sparkles', icon: '\u2728' }, { id: 'bubbles', name: 'Bubbles', icon: '\ud83e\udee7' },
  { id: 'hearts', name: 'Hearts', icon: '\ud83d\udc96' }, { id: 'notes', name: 'Music Notes', icon: '\ud83c\udfb5' }, { id: 'rainbow', name: 'Rainbow', icon: '\ud83c\udf08' },
];
FF.MOVES = [
  { id: 'disco', name: 'Disco Fever', icon: '\ud83d\udd7a', dur: 3.2 }, { id: 'robot', name: 'The Robot', icon: '\ud83e\udd16', dur: 3.2 }, { id: 'floss', name: 'The Floss', icon: '\ud83d\udc83', dur: 3.2 },
  { id: 'spin', name: 'Spin Cheer', icon: '\ud83c\udf00', dur: 2.6 }, { id: 'cannon', name: 'Confetti Cannon', icon: '\ud83c\udf8a', dur: 1.9, toy: true }, { id: 'horn', name: 'Party Horn', icon: '\ud83d\udcef', dur: 1.6, toy: true },
];
const byId = (L, id) => L.find((x) => x.id === id);
FF.clean = function (f) {
  if (!f || typeof f !== 'object') return null;
  const o = { s: byId(FF.SKINS, f.s) ? f.s : '', h: byId(FF.HATS, f.h) ? f.h : '', t: byId(FF.TRAILS, f.t) ? f.t : '' };
  return o.s || o.h || o.t ? o : null;
};
FF.mine = function () { return FF.owned() ? FF.clean(GP.save.fit) : null; };
FF.sig = (f) => (f ? f.s + '.' + f.h + '.' + f.t : '');
FF.fitOf = function (p) { const S = window.__GS && window.__GS.S; if (!p || p.bot || !p.pid || !S || !S.fits) return null; return FF.clean(S.fits[p.pid]); };
FF.fitSeat = function (i) { const S = window.__GS && window.__GS.S; return S && S.pl ? FF.fitOf(S.pl[i]) : null; };

/* ---------------- materials / textures ---------------- */
const IS_TOUCH = GP.IS_TOUCH;
function tm(o) { return IS_TOUCH ? new T.MeshLambertMaterial(o) : new T.MeshStandardMaterial(Object.assign({ roughness: 0.6, metalness: 0 }, o)); }
const shiny = (c, mtl) => mat(c, { metalness: mtl == null ? 0.3 : mtl, roughness: 0.3, emissive: 0x1a1200 });
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
const TX = {};
function tex(k) {
  if (TX[k]) return TX[k];
  if (k === 'stripes') TX[k] = canvasTex(128, 128, (g) => { const C = ['#ff4fd8', '#ffe14d', '#3ff0ff', '#7cf05a']; for (let i = -4; i < 8; i++) { g.fillStyle = C[(i + 8) % 4]; g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + 32, 0); g.lineTo(i * 32 + 32 + 64, 128); g.lineTo(i * 32 + 64, 128); g.fill(); } g.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc((i * 37) % 128, (i * 53) % 128, 4, 0, 7); g.fill(); } });
  else if (k === 'disco') TX[k] = canvasTex(256, 128, (g, w, h) => { const n = 24, m = 12; for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const v = 150 + Math.floor(Math.random() * 105), tint = Math.random(); g.fillStyle = tint < 0.08 ? '#ff9ff0' : tint < 0.16 ? '#9ff6ff' : tint < 0.2 ? '#fff3a0' : 'rgb(' + v + ',' + v + ',' + (v + 10 > 255 ? 255 : v + 10) + ')'; g.fillRect(i * w / n + 1, j * h / m + 1, w / n - 2, h / m - 2); } g.fillStyle = '#ffffff'; for (let i = 0; i < 10; i++) { const x = Math.random() * w, y = Math.random() * h; g.fillRect(x - 6, y - 1, 12, 2); g.fillRect(x - 1, y - 6, 2, 12); } });
  else if (k === 'fringe') TX[k] = canvasTex(64, 128, (g, w, h) => { const C = ['#ff4fa3', '#ffd23f', '#3fd0ff', '#7ce05a', '#ff8a3d', '#b07cff']; const band = h / 6; for (let b = 0; b < 6; b++) { g.fillStyle = C[b]; g.fillRect(0, b * band, w, band); g.fillStyle = 'rgba(0,0,0,.18)'; for (let x = 0; x < w; x += 4) { g.fillRect(x, b * band + band * 0.55, 1, band * 0.45); } g.fillStyle = 'rgba(255,255,255,.25)'; for (let x = 2; x < w; x += 4) g.fillRect(x, b * band + 2, 1, band * 0.4); } });
  else if (k === 'shell') TX[k] = canvasTex(128, 64, (g, w, h) => { g.fillStyle = '#f2b84a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 70; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(190,120,30,.45)' : 'rgba(255,225,140,.6)'; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 0, 7); g.fill(); } });
  return TX[k];
}
const TMAT = {};
function texMat(k, o) { const key = k + JSON.stringify(o || {}); return TMAT[key] || (TMAT[key] = tm(Object.assign({ map: tex(k) }, o || {}))); }
const BMAT = {};
const glow = (c, o) => { const k = c + JSON.stringify(o || {}); return BMAT[k] || (BMAT[k] = new T.MeshBasicMaterial(Object.assign({ color: c }, o || {}))); };
function put(par, geo, m, sx, sy, sz, x, y, z) { const o = M(geo, m, sx, sy, sz); o.position.set(x || 0, y || 0, z || 0); par.add(o); return o; }
const GX = {
  halfSph: new T.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI / 2), sph16: new T.SphereGeometry(1, 18, 12), disc: new T.CylinderGeometry(1, 1, 1, 22), tor: new T.TorusGeometry(1, 0.22, 8, 22), torThin: new T.TorusGeometry(1, 0.09, 8, 26),
  halfTor: new T.TorusGeometry(1, 0.1, 6, 18, Math.PI), cone16: new T.ConeGeometry(1, 1, 18), bell: new T.CylinderGeometry(0.1, 0.17, 1, 12), shellG: new T.CylinderGeometry(1, 1, 1, 22, 1, true, 0, Math.PI),
};

/* ---------------- skins (same joints as GP.buildHero so every pose works) ---------------- */
function rig(build) {
  const root = new T.Group(), body = new T.Group(); root.add(body);
  const headG = new T.Group(); headG.position.y = 1.28; body.add(headG);
  const arm = (sd) => { const g = new T.Group(); g.position.set(0.44 * sd, 0.98, 0); body.add(g); return g; };
  const leg = (sd) => { const g = new T.Group(); g.position.set(0.18 * sd, 0.42, 0); body.add(g); return g; };
  const h = { root, body, headG, armL: arm(-1), armR: arm(1), legL: leg(-1), legR: leg(1), t: Math.random() * 10, hatY: 0.4, hatS: 1, spin: [], blink: [] };
  build(h);
  return h;
}
const SKIN = {};
SKIN.ratita = (col) => rig((h) => {
  const GREY = 0x9aa0ab, LIGHT = 0xdfe2e8, PINK = 0xff9fc0, DARK = 0x1b1440, b = h.body, hd = h.headG;
  put(b, G.sphereLo, GREY, 0.44, 0.5, 0.4, 0, 0.74, 0); put(b, G.sphereLo, LIGHT, 0.3, 0.34, 0.16, 0, 0.7, 0.28);
  const band = put(b, GX.torThin, col, 0.3, 0.3, 0.6, 0, 1.04, 0); band.rotation.x = Math.PI / 2;
  const knot = put(b, G.cone6, col, 0.09, 0.16, 0.05, 0.08, 0.92, 0.32); knot.rotation.z = 0.5;
  const badge = put(b, GX.disc, 0xffd23f, 0.1, 0.03, 0.1, 0, 0.78, 0.43); badge.rotation.x = Math.PI / 2;
  const wedge = put(b, G.cone6, 0xffb000, 0.05, 0.07, 0.03, 0, 0.785, 0.455); wedge.rotation.x = Math.PI / 2; wedge.rotation.z = Math.PI / 2;
  for (let k = 0; k < 7; k++) { const a = k / 6; put(b, G.sphereLo, PINK, 0.05 - a * 0.015, 0.05 - a * 0.015, 0.05 - a * 0.015, Math.sin(a * 5) * 0.12, 0.45 + a * a * 0.5, -0.38 - a * 0.32); }
  put(hd, G.sphere, GREY, 0.47, 0.44, 0.44, 0, 0.06, 0);
  put(hd, G.sphere, LIGHT, 0.22, 0.17, 0.26, 0, -0.1, 0.34); put(hd, G.sphere, PINK, 0.075, 0.065, 0.065, 0, -0.04, 0.6);
  [-1, 1].forEach((sd) => {
    const e = put(hd, GX.disc, GREY, 0.22, 0.06, 0.22, sd * 0.34, 0.38, -0.04); e.rotation.x = Math.PI / 2; e.rotation.z = sd * 0.25;
    const ei = put(hd, GX.disc, PINK, 0.15, 0.03, 0.15, sd * 0.34, 0.38, -0.003); ei.rotation.x = Math.PI / 2; ei.rotation.z = sd * 0.25;
    put(hd, G.sphere, DARK, 0.09, 0.11, 0.06, sd * 0.17, 0.12, 0.38); put(hd, G.sphere, 0xffffff, 0.03, 0.03, 0.02, sd * 0.17 + 0.03, 0.16, 0.43);
    for (let w = 0; w < 2; w++) { const wh = put(hd, G.box, 0x3a3550, 0.26, 0.012, 0.012, sd * 0.3, -0.09 - w * 0.05, 0.47); wh.rotation.z = sd * (0.12 - w * 0.24); wh.rotation.y = -sd * 0.35; }
    put(hd, G.box, 0xffffff, 0.05, 0.075, 0.02, sd * 0.03, -0.25, 0.54);
    put(sd < 0 ? h.armL : h.armR, G.cyl8, GREY, 0.11, 0.4, 0.11, 0, -0.18, 0); put(sd < 0 ? h.armL : h.armR, G.sphereLo, PINK, 0.13, 0.13, 0.13, 0, -0.42, 0);
    const lg = sd < 0 ? h.legL : h.legR; put(lg, G.cyl8, GREY, 0.13, 0.3, 0.13, 0, -0.14, 0); put(lg, G.sphereLo, PINK, 0.16, 0.1, 0.25, 0, -0.32, 0.07);
  });
  h.hatY = 0.48; h.hatS = 1.15;
});
function partyCone(s) { const g = new T.Group(); const c = put(g, GX.cone16, texMat('stripes'), 0.2 * s, 0.48 * s, 0.2 * s, 0, 0.24 * s, 0); void c; put(g, G.sphereLo, 0xffffff, 0.075 * s, 0.075 * s, 0.075 * s, 0, 0.5 * s, 0); const rim = put(g, GX.tor, 0xffe14d, 0.2 * s, 0.2 * s, 0.25 * s, 0, 0.01, 0); rim.rotation.x = Math.PI / 2; return g; }
SKIN.gus = () => rig((h) => {
  const SK = 0xf1c7a5, CARD = 0x7a4b2a, GREY = 0xd6d6d6, SHIRT = 0xdfe9f5, RED = 0xb3123a, b = h.body, hd = h.headG;
  put(b, G.sphereLo, CARD, 0.42, 0.52, 0.36, 0, 0.78, 0); put(b, G.sphereLo, SHIRT, 0.2, 0.3, 0.12, 0, 0.92, 0.26);
  [0.72, 0.84, 0.96].forEach((y) => put(b, G.sphereLo, 0xe8d5b0, 0.025, 0.025, 0.025, 0, y, 0.35));
  [-1, 1].forEach((sd) => { const bw = put(b, G.cone, RED, 0.07, 0.13, 0.07, sd * 0.065, 1.12, 0.3); bw.rotation.z = sd * Math.PI / 2; });
  put(b, G.sphereLo, RED, 0.035, 0.035, 0.035, 0, 1.12, 0.31);
  const bd = put(b, G.box, shiny(0xffd23f), 0.12, 0.06, 0.012, -0.22, 0.96, 0.3); bd.rotation.y = -0.4;
  put(hd, G.sphere, SK, 0.34, 0.36, 0.33, 0, 0, 0);
  [-1, 1].forEach((sd) => {
    put(hd, G.sphereLo, SK, 0.05, 0.09, 0.07, sd * 0.34, -0.02, 0); put(hd, G.sphereLo, GREY, 0.09, 0.13, 0.14, sd * 0.29, 0.06, -0.08);
    const br = put(hd, G.box, GREY, 0.14, 0.05, 0.05, sd * 0.11, 0.16, 0.29); br.rotation.z = sd * 0.3;
    put(hd, G.sphereLo, 0x111827, 0.035, 0.035, 0.03, sd * 0.11, 0.04, 0.31); const gl = put(hd, G.torus, 0x2b2b2b, 0.075, 0.075, 0.075, sd * 0.11, 0.04, 0.33); void gl;
    const mu = put(hd, G.sphereLo, GREY, 0.1, 0.05, 0.05, sd * 0.07, -0.12, 0.31); mu.rotation.z = sd * 0.3;
    put(sd < 0 ? h.armL : h.armR, G.cyl8, CARD, 0.1, 0.42, 0.1, 0, -0.18, 0); put(sd < 0 ? h.armL : h.armR, G.sphereLo, SK, 0.11, 0.11, 0.11, 0, -0.42, 0);
    const lg = sd < 0 ? h.legL : h.legR; put(lg, G.cyl8, 0x3b3b4a, 0.12, 0.3, 0.12, 0, -0.14, 0); put(lg, G.sphereLo, 0x4a2c16, 0.14, 0.09, 0.22, 0, -0.32, 0.05);
  });
  put(hd, G.box, 0x2b2b2b, 0.05, 0.012, 0.012, 0, 0.045, 0.34); put(hd, G.sphereLo, 0xe8a98a, 0.065, 0.07, 0.065, 0, -0.04, 0.34);
  put(hd, G.sphereLo, GREY, 0.18, 0.08, 0.1, 0, 0.0, -0.31);
  // party blower in his mouth (unrolls in tick)
  const bl = new T.Group(); bl.position.set(0, -0.17, 0.33); hd.add(bl);
  put(bl, G.cyl8, 0xffffff, 0.025, 0.08, 0.025, 0, 0, 0.03).rotation.x = Math.PI / 2;
  const tube = new T.Group(); tube.position.z = 0.07; bl.add(tube); const tb = put(tube, G.cyl8, texMat('stripes'), 0.035, 0.3, 0.02, 0, 0, 0.15); tb.rotation.x = Math.PI / 2;
  h.blower = tube;
  const hat = partyCone(1.05); hat.position.set(0.04, 0.3, -0.02); hat.rotation.z = -0.18; hd.add(hat); h.skinHat = hat;
  h.hatY = 0.34; h.hatS = 1;
});
SKIN.disco = (col) => rig((h) => {
  const SUIT = 0xf4f6fb, b = h.body, hd = h.headG;
  put(b, G.sphereLo, SUIT, 0.42, 0.52, 0.38, 0, 0.74, 0);
  put(b, G.box, 0x2b2f45, 0.3, 0.18, 0.06, 0, 0.86, 0.36); [0xff4d6d, 0x4ade80, 0x3ff0ff].forEach((c, k) => { const bt = put(b, G.sphereLo, glow(c), 0.03, 0.03, 0.02, -0.09 + k * 0.09, 0.88, 0.395); h.blink.push(bt); });
  const belt = put(b, GX.torThin, col, 0.4, 0.4, 0.5, 0, 0.5, 0); belt.rotation.x = Math.PI / 2;
  put(b, G.box, SUIT, 0.48, 0.5, 0.24, 0, 0.86, -0.38); put(b, G.box, col, 0.5, 0.06, 0.26, 0, 1.02, -0.38);
  [-1, 1].forEach((sd) => { put(b, G.cyl8, 0x9aa3b5, 0.08, 0.16, 0.08, sd * 0.14, 0.56, -0.42); put(b, G.cone, glow(0xffb02e, { transparent: true, opacity: 0.8 }), 0.06, 0.14, 0.06, sd * 0.14, 0.43, -0.42).rotation.x = Math.PI; });
  const ballG = new T.Group(); hd.add(ballG); put(ballG, GX.sph16, texMat('disco', { emissive: 0x2a2a38 }), 0.42, 0.42, 0.42, 0, 0.02, 0); h.spin.push(ballG);
  const vis = put(hd, G.sphere, shiny(0x241650, 0.4), 0.29, 0.21, 0.14, 0, 0.0, 0.33); void vis; put(hd, G.sphereLo, glow(0xffffff), 0.05, 0.03, 0.02, -0.1, 0.07, 0.45);
  const ring = put(hd, GX.torThin, col, 0.36, 0.36, 0.5, 0, -0.33, 0); ring.rotation.x = Math.PI / 2;
  put(hd, G.cyl8, 0xcfd6e6, 0.015, 0.22, 0.015, 0.2, 0.46, 0); const ab = put(hd, G.sphereLo, glow(0xff4fd8), 0.05, 0.05, 0.05, 0.2, 0.58, 0); h.blink.push(ab);
  [-1, 1].forEach((sd) => {
    const a = sd < 0 ? h.armL : h.armR; put(a, G.cyl8, SUIT, 0.11, 0.4, 0.11, 0, -0.18, 0); put(a, G.sphereLo, col, 0.13, 0.13, 0.13, 0, -0.42, 0);
    const lg = sd < 0 ? h.legL : h.legR; put(lg, GX.bell, SUIT, 1.0, 0.32, 1.0, 0, -0.14, 0); put(lg, G.cyl8, col, 0.18, 0.05, 0.18, 0, -0.29, 0); put(lg, G.sphereLo, 0xd8dde8, 0.15, 0.09, 0.2, 0, -0.34, 0.04);
  });
  h.hatY = 0.42; h.hatS = 1.1;
});
SKIN.pinata = () => rig((h) => {
  const F = texMat('fringe'), b = h.body, hd = h.headG;
  put(b, G.cyl20, F, 0.4, 0.66, 0.36, 0, 0.74, 0); put(b, G.sphereLo, F, 0.4, 0.14, 0.36, 0, 1.07, 0); put(b, G.sphereLo, F, 0.4, 0.14, 0.36, 0, 0.41, 0);
  for (let k = 0; k < 5; k++) put(b, G.box, glow([0xff4fa3, 0xffd23f, 0x3fd0ff, 0x7ce05a, 0xff8a3d][k]), 0.03, 0.34, 0.01, (k - 2) * 0.035, 0.42, -0.46).rotation.x = 0.35;
  put(b, G.cyl8, 0xffd23f, 0.05, 0.12, 0.05, 0, 0.62, -0.38).rotation.x = 1.2;
  put(hd, G.sphere, F, 0.3, 0.32, 0.3, 0, 0.02, 0); put(hd, G.sphere, F, 0.22, 0.2, 0.26, 0, -0.06, 0.3);
  put(hd, G.sphereLo, 0x2b1f3a, 0.035, 0.035, 0.02, -0.08, -0.04, 0.55); put(hd, G.sphereLo, 0x2b1f3a, 0.035, 0.035, 0.02, 0.08, -0.04, 0.55);
  [-1, 1].forEach((sd) => {
    const e = put(hd, G.cone, F, 0.08, 0.36, 0.06, sd * 0.15, 0.4, -0.02); e.rotation.z = -sd * 0.25;
    put(hd, G.sphere, 0xffffff, 0.09, 0.1, 0.06, sd * 0.13, 0.12, 0.27); const pu = put(hd, G.sphere, 0x111111, 0.045, 0.05, 0.03, sd * 0.13 + 0.02, 0.1, 0.32); h.blink.push(pu);
    const a = sd < 0 ? h.armL : h.armR; put(a, G.cyl8, F, 0.11, 0.38, 0.11, 0, -0.17, 0); put(a, G.cyl8, 0x4a2c16, 0.12, 0.08, 0.12, 0, -0.4, 0);
    const lg = sd < 0 ? h.legL : h.legR; put(lg, G.cyl8, F, 0.13, 0.3, 0.13, 0, -0.14, 0); put(lg, G.cyl8, 0x4a2c16, 0.14, 0.1, 0.14, 0, -0.33, 0.02);
  });
  for (let k = 0; k < 5; k++) put(hd, G.cone6, glow([0xff4fa3, 0xffd23f, 0x3fd0ff, 0x7ce05a, 0xb07cff][k]), 0.05, 0.14, 0.05, 0, 0.3 - k * 0.06, -0.08 - k * 0.07).rotation.x = -0.4 - k * 0.25;
  h.hatY = 0.3; h.hatS = 0.95;
});
SKIN.taco = (col) => rig((h) => {
  const SK = 0xffc996, b = h.body, hd = h.headG, SH = texMat('shell');
  put(b, G.cyl8, col, 0.32, 0.5, 0.28, 0, 0.74, 0);
  const shell = put(b, GX.shellG, SH, 0.6, 0.72, 0.6, 0, 1.0, 0); shell.rotation.z = -Math.PI / 2; shell.material.side = T.DoubleSide;
  [-1, 1].forEach((sd) => { const cap = put(b, new T.CircleGeometry(1, 22, Math.PI, Math.PI), SH, 0.6, 0.6, 1, sd * 0.36, 1.0, 0); cap.rotation.y = sd * Math.PI / 2; cap.material.side = T.DoubleSide; });
  for (let k = 0; k < 10; k++) { const x = -0.32 + k * 0.071; [-1, 1].forEach((sd) => { put(b, G.sphereLo, k % 3 === 1 ? 0xff4d3d : 0x4fcf3a, 0.08, 0.065, 0.06, x, 1.02 + Math.sin(k * 1.7) * 0.025, sd * 0.56); }); }
  for (let k = 0; k < 8; k++) put(b, G.box, 0xffd84a, 0.035, 0.035, 0.14, -0.28 + k * 0.08, 1.05, (k % 2 ? 1 : -1) * 0.5).rotation.y = k;
  put(hd, G.sphere, SK, 0.34, 0.34, 0.33, 0, 0, 0);
  const bn = put(hd, GX.halfSph, col, 0.355, 0.3, 0.35, 0, 0.04, 0); void bn; put(hd, G.cone6, col, 0.07, 0.14, 0.04, -0.06, -0.02, -0.36).rotation.x = 2.2;
  [-1, 1].forEach((sd) => { put(hd, G.sphere, 0xffffff, 0.075, 0.1, 0.05, sd * 0.11, 0.02, 0.29); put(hd, G.sphere, 0x1b1440, 0.04, 0.06, 0.03, sd * 0.11, 0.02, 0.33); });
  const sm = put(hd, GX.halfTor, 0x8a2a2a, 0.09, 0.09, 0.09, 0, -0.13, 0.31); sm.rotation.z = Math.PI; put(hd, G.sphereLo, 0xffae7a, 0.08, 0.08, 0.08, 0, -0.06, 0.34);
  [-1, 1].forEach((sd) => {
    const a = sd < 0 ? h.armL : h.armR; put(a, G.cyl8, col, 0.1, 0.4, 0.1, 0, -0.18, 0); put(a, G.sphereLo, SK, 0.11, 0.11, 0.11, 0, -0.42, 0);
    const lg = sd < 0 ? h.legL : h.legR; put(lg, G.cyl8, 0x2f6fe8, 0.11, 0.3, 0.11, 0, -0.14, 0); put(lg, G.sphereLo, 0xffffff, 0.15, 0.1, 0.22, 0, -0.32, 0.05);
  });
  h.hatY = 0.3;
});
SKIN.robo = (col) => rig((h) => {
  const CH = shiny(0xc8cfdc, 0.25), DK = 0x1a1d2b, b = h.body, hd = h.headG;
  put(b, G.box, CH, 0.62, 0.62, 0.46, 0, 0.76, 0); put(b, G.box, mat(DK), 0.5, 0.06, 0.48, 0, 0.47, 0);
  const sp = put(b, GX.disc, mat(DK), 0.16, 0.05, 0.16, 0, 0.8, 0.23); sp.rotation.x = Math.PI / 2; const cone = put(b, G.cone16, mat(0x3b3f52), 0.11, 0.06, 0.11, 0, 0.8, 0.26); cone.rotation.x = -Math.PI / 2;
  const sr = put(b, GX.tor, glow(col), 0.16, 0.16, 0.16, 0, 0.8, 0.255); h.pulse = sr;
  put(b, G.box, mat(DK), 0.1, 0.1, 0.04, 0.18, 1.0, 0.23); put(b, G.box, glow(0x4ade80), 0.05, 0.03, 0.02, 0.18, 1.0, 0.255);
  put(b, G.cyl8, CH, 0.1, 0.12, 0.1, 0, 1.1, 0);
  put(hd, G.box, CH, 0.62, 0.48, 0.5, 0, 0.02, 0); put(hd, G.box, mat(DK), 0.52, 0.34, 0.03, 0, 0.0, 0.25);
  h.eq = []; for (let k = 0; k < 5; k++) { const q = put(hd, G.box, glow(col), 0.06, 0.1, 0.01, -0.16 + k * 0.08, -0.1, 0.27); h.eq.push(q); }
  [-1, 1].forEach((sd) => { const e = put(hd, G.box, glow(0x3ff0ff), 0.11, 0.09, 0.01, sd * 0.12, 0.07, 0.27); h.blink.push(e); });
  const band = put(hd, GX.halfTor, glow(0x2b2f45), 0.36, 0.36, 0.5, 0, 0.12, 0); band.rotation.y = Math.PI / 2;
  [-1, 1].forEach((sd) => {
    const cup = put(hd, GX.disc, mat(col), 0.13, 0.09, 0.13, sd * 0.35, 0.04, 0); cup.rotation.z = Math.PI / 2; put(hd, GX.disc, mat(DK), 0.09, 0.02, 0.09, sd * 0.4, 0.04, 0).rotation.z = Math.PI / 2;
    const a = sd < 0 ? h.armL : h.armR; put(a, G.sphereLo, CH, 0.1, 0.1, 0.1, 0, 0, 0); put(a, G.cyl8, CH, 0.07, 0.36, 0.07, 0, -0.2, 0); put(a, G.sphereLo, mat(col), 0.12, 0.12, 0.12, 0, -0.42, 0);
    const lg = sd < 0 ? h.legL : h.legR; put(lg, G.cyl8, CH, 0.09, 0.3, 0.09, 0, -0.14, 0); put(lg, G.box, mat(DK), 0.2, 0.1, 0.3, 0, -0.33, 0.05);
  });
  put(hd, G.cyl8, CH, 0.015, 0.18, 0.015, 0, 0.34, 0); const ab = put(hd, G.sphereLo, glow(0xff4d6d), 0.05, 0.05, 0.05, 0, 0.45, 0); h.blink.push(ab);
  h.hatY = 0.28; h.hatS = 1.15;
});

/* ---------------- hats ---------------- */
const HAT = {
  party: () => partyCone(1),
  sombrero: () => { const g = new T.Group(); put(g, GX.disc, 0xf2c14e, 0.62, 0.04, 0.62, 0, 0.02, 0); put(g, G.cone16, 0xf2c14e, 0.22, 0.34, 0.22, 0, 0.2, 0); const r = put(g, GX.tor, 0xe8344a, 0.2, 0.2, 0.3, 0, 0.08, 0); r.rotation.x = Math.PI / 2; const r2 = put(g, GX.tor, 0x2fbf71, 0.6, 0.6, 0.15, 0, 0.04, 0); r2.rotation.x = Math.PI / 2; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; put(g, G.sphereLo, k % 2 ? 0xe8344a : 0x2fbf71, 0.04, 0.04, 0.04, Math.cos(a) * 0.62, 0.0, Math.sin(a) * 0.62); } return g; },
  crown: () => { const g = new T.Group(); const G1 = shiny(0xffd23f, 0.25); put(g, new T.CylinderGeometry(0.27, 0.25, 0.14, 18, 1, true), G1, 1, 1, 1, 0, 0.07, 0).material.side = T.DoubleSide; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; put(g, G.cone6, G1, 0.06, 0.16, 0.06, Math.cos(a) * 0.25, 0.21, Math.sin(a) * 0.25); put(g, G.sphereLo, [glow(0xff4d6d), glow(0x3ff0ff), glow(0x4ade80)][k % 3], 0.035, 0.035, 0.035, Math.cos(a) * 0.27, 0.07, Math.sin(a) * 0.27); } return g; },
  propeller: (h) => { const g = new T.Group(); put(g, GX.halfSph, 0xff4d6d, 0.33, 0.24, 0.33, 0, -0.04, 0); for (let k = 0; k < 4; k++) put(g, GX.halfSph, [0xffd23f, 0x3fa0ff, 0x4ade80, 0xff4d6d][k], 0.335, 0.245, 0.12, 0, -0.04, 0).rotation.y = k * Math.PI / 4; put(g, G.cyl8, 0x444444, 0.02, 0.14, 0.02, 0, 0.26, 0); const p = new T.Group(); p.position.y = 0.33; g.add(p); put(p, G.sphereLo, 0xffd23f, 0.04, 0.04, 0.04); [0, Math.PI].forEach((r) => { const bl = put(p, G.box, 0x3fa0ff, 0.34, 0.015, 0.07, Math.cos(r) * 0.17, 0, 0); bl.rotation.x = 0.3; }); h.spin.push(p); p.userData.fast = true; return g; },
  tophat: (h, col) => { const g = new T.Group(); put(g, GX.disc, 0x1b1b24, 0.4, 0.03, 0.4, 0, 0.015, 0); put(g, G.cyl20, 0x1b1b24, 0.24, 0.42, 0.24, 0, 0.23, 0); put(g, G.cyl20, col, 0.245, 0.07, 0.245, 0, 0.08, 0); return g; },
  bunny: () => { const g = new T.Group(); [-1, 1].forEach((sd) => { const e = new T.Group(); e.position.set(sd * 0.13, 0, 0); e.rotation.z = -sd * 0.18; g.add(e); put(e, G.sphereLo, 0xffffff, 0.08, 0.3, 0.05, 0, 0.26, 0); put(e, G.sphereLo, 0xffa3c4, 0.045, 0.22, 0.02, 0, 0.26, 0.035); }); const bandM = put(g, GX.halfTor, 0xff7ad9, 0.34, 0.34, 0.4, 0, -0.1, 0); bandM.rotation.y = Math.PI / 2; return g; },
};

FF.build = function (color, fit) {
  fit = FF.clean(fit); if (!fit || !FF.ready) return null;
  const h = fit.s && SKIN[fit.s] ? SKIN[fit.s](color) : GP.buildHero(color);
  if (!h.spin) { h.spin = []; h.blink = []; h.hatY = 0.3; h.hatS = 1; }
  if (fit.h && HAT[fit.h]) {
    if (h.cap) h.cap.forEach((o) => { o.visible = false; });
    if (h.skinHat) h.skinHat.visible = false;
    const hat = HAT[fit.h](h, color); hat.position.y = h.hatY; hat.scale.setScalar(h.hatS); if (fit.h === 'sombrero') hat.rotation.z = 0.12; h.headG.add(hat); h.hat = hat;
  }
  h.fit = fit; h.ff = true;
  GP.shadowy(h.root, true, false);
  return h;
};

/* ---------------- particles (trails, cannon confetti) - small 3D meshes ---------------- */
const PG = {
  conf: new T.PlaneGeometry(0.18, 0.11), spark: new T.OctahedronGeometry(0.1, 0), bub: new T.SphereGeometry(0.13, 12, 9), rain: new T.BoxGeometry(0.2, 0.08, 0.09),
};
(function () {
  const s = new T.Shape(); s.moveTo(0, -0.35); s.bezierCurveTo(-0.6, 0.05, -0.35, 0.55, 0, 0.25); s.bezierCurveTo(0.35, 0.55, 0.6, 0.05, 0, -0.35);
  PG.heart = new T.ExtrudeGeometry(s, { depth: 0.15, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 1, curveSegments: 6 }); PG.heart.center(); PG.heart.scale(0.34, 0.34, 0.34);
  const hd = new T.Shape(); hd.absellipse(0, 0, 0.16, 0.12, 0, TAU, false, 0.4);
  const st = new T.Shape(); st.moveTo(0.11, 0.02); st.lineTo(0.16, 0.02); st.lineTo(0.16, 0.6); st.lineTo(0.11, 0.6); st.closePath();
  const fl = new T.Shape(); fl.moveTo(0.16, 0.6); fl.quadraticCurveTo(0.42, 0.45, 0.3, 0.22); fl.quadraticCurveTo(0.34, 0.42, 0.16, 0.45); fl.closePath();
  PG.note = new T.ExtrudeGeometry([hd, st, fl], { depth: 0.06, bevelEnabled: false, curveSegments: 6 }); PG.note.center(); PG.note.scale(0.42, 0.42, 0.42);
})();
const CONF_C = [0xff4fd8, 0x3ff0ff, 0xffe14d, 0x4ade80, 0xff7a3d, 0xb07cff];
const RAIN_C = [0xff4d4d, 0xff9f2e, 0xffe14d, 0x4ade80, 0x3fa0ff, 0x9b6bff];
const parts = []; FF.parts = parts; let rainK = 0;
function spawn(par, kind, x, y, z, vx, vy, vz, life, o) {
  if (!par) return;
  if (parts.length > 170) { const old = parts.shift(); if (old.m.parent) old.m.parent.remove(old.m); }
  let m;
  if (kind === 'conf') m = new T.Mesh(PG.conf, glow(GP.pick(CONF_C), { side: T.DoubleSide }));
  else if (kind === 'spark') m = new T.Mesh(PG.spark, glow(GP.pick([0xffe14d, 0xffffff, 0xfff3a0])));
  else if (kind === 'bub') m = new T.Mesh(PG.bub, glow(GP.pick([0xbfefff, 0xffd6f6, 0xd8ffe0]), { transparent: true, opacity: 0.5, depthWrite: false }));
  else if (kind === 'heart') m = new T.Mesh(PG.heart, glow(GP.pick([0xff4f9a, 0xff7ad9, 0xff3b6b])));
  else if (kind === 'note') m = new T.Mesh(PG.note, glow(GP.pick([0x2b2050, 0x7c3aed, 0xff4fd8]), { side: T.DoubleSide }));
  else { m = new T.Mesh(PG.rain, glow(RAIN_C[rainK++ % 6])); }
  m.position.set(x, y, z); m.rotation.set(Math.random() * TAU, Math.random() * TAU, 0);
  const s0 = (o && o.s) || 1; m.scale.setScalar(s0); par.add(m);
  parts.push(Object.assign({ m, kind, vx, vy, vz, life, max: life, s0, spin: GP.rand(-6, 6), g: kind === 'conf' ? 2.2 : kind === 'bub' ? -0.6 : kind === 'rain' ? 0 : -0.2, drag: kind === 'conf' ? 1.6 : 0.6 }, o || {}));
}
FF.tick = function (dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i], m = p.m; p.life -= dt;
    if (p.life <= 0 || !m.parent) { if (m.parent) m.parent.remove(m); parts.splice(i, 1); continue; }
    const k = Math.exp(-p.drag * dt); p.vx *= k; p.vz *= k; p.vy = p.vy * (p.kind === 'conf' ? k : 1) - p.g * dt;
    m.position.x += p.vx * dt; m.position.y += p.vy * dt; m.position.z += p.vz * dt;
    if (p.kind === 'conf') { m.rotation.x += p.spin * dt; m.rotation.y += p.spin * 0.7 * dt; if (m.position.y < (p.floor || 0) + 0.05) { m.position.y = (p.floor || 0) + 0.05; p.vx = p.vz = p.vy = 0; p.spin = 0; } }
    else if (p.kind === 'bub') { m.position.x += Math.sin(p.life * 6 + p.spin) * dt * 0.3; }
    else if (p.kind !== 'rain') { m.rotation.y += p.spin * dt; }
    const a = p.life / p.max, sc = p.kind === 'bub' ? p.s0 * (a < 0.12 ? 1.4 - a : 1) : p.s0 * Math.min(1, a * 3);
    m.scale.setScalar(Math.max(0.001, sc));
  }
};
const TRAIL = {
  confetti: (par, x, y, z) => { for (let k = 0; k < 2; k++) spawn(par, 'conf', x + GP.rand(-0.2, 0.2), y + GP.rand(0.4, 1.0), z + GP.rand(-0.2, 0.2), GP.rand(-0.6, 0.6), GP.rand(0.6, 1.6), GP.rand(-0.6, 0.6), 1.6, { floor: y }); },
  sparkle: (par, x, y, z) => { spawn(par, 'spark', x + GP.rand(-0.25, 0.25), y + GP.rand(0.3, 1.3), z + GP.rand(-0.25, 0.25), 0, GP.rand(0.2, 0.6), 0, 0.9, { s: GP.rand(0.7, 1.3) }); },
  bubbles: (par, x, y, z) => { spawn(par, 'bub', x + GP.rand(-0.2, 0.2), y + GP.rand(0.3, 0.9), z + GP.rand(-0.2, 0.2), 0, 0.3, 0, 1.8, { s: GP.rand(0.6, 1.4) }); },
  hearts: (par, x, y, z) => { spawn(par, 'heart', x + GP.rand(-0.2, 0.2), y + GP.rand(0.6, 1.2), z + GP.rand(-0.2, 0.2), 0, 0.7, 0, 1.3, { s: GP.rand(0.8, 1.2) }); },
  notes: (par, x, y, z) => { spawn(par, 'note', x + GP.rand(-0.25, 0.25), y + GP.rand(0.7, 1.4), z + GP.rand(-0.25, 0.25), GP.rand(-0.2, 0.2), 0.8, GP.rand(-0.2, 0.2), 1.3, { s: GP.rand(0.8, 1.2) }); },
  rainbow: (par, x, y, z) => { for (let k = 0; k < 6; k++) spawn(par, 'rain', x, y + 0.3 + k * 0.085, z, 0, 0, 0, 1.1, { s: 1 }); },
};
function trail(h, dt, moving) {
  const f = h.fit; if (!f || !f.t || !h.root.parent) return;
  const p = h.root.position, sc = h.root.scale.x || 1;
  if (!h.lp) { h.lp = p.clone(); h.acc = 0; return; }
  const d = Math.hypot(p.x - h.lp.x, p.z - h.lp.z) + Math.abs(p.y - h.lp.y) * 0.5; h.lp.copy(p);
  if (d > 3) return; // teleport
  h.acc += d; const step = f.t === 'rainbow' ? 0.13 * sc : 0.32 * sc;
  if (!moving && h.acc < step) return;
  while (h.acc >= step) { h.acc -= step; TRAIL[f.t](h.root.parent, p.x, p.y, p.z); }
}
FF.trailNow = (h) => { if (h.fit && h.fit.t && h.root.parent) TRAIL[h.fit.t](h.root.parent, h.root.position.x, h.root.position.y, h.root.position.z); };

/* ---------------- emotes: dances + toys (keyed by seat) ---------------- */
const EM = FF.em = {};
FF.start = function (seat, a) {
  const mv = byId(FF.MOVES, a); if (!mv || seat == null || seat < 0) return;
  const old = EM[seat]; if (old && old.prop && old.prop.parent) old.prop.parent.remove(old.prop);
  EM[seat] = { a, t: 0, dur: mv.dur, fired: false };
  if (typeof seat === 'number') FF.lastSeat = seat;
  const S = GP.Snd; if (!S) return;
  if (a === 'disco') S.fx('ffDisco'); else if (a === 'robot') S.fx('ffRobot'); else if (a === 'floss' || a === 'spin') S.fx('ffDance');
};
FF.busy = (seat) => !!EM[seat];
FF.spot = () => (FF.lastSeat != null && EM[FF.lastSeat] ? FF.lastSeat : null);
function cannonProp(col) {
  const g = new T.Group();
  put(g, G.cyl20, mat(col), 0.12, 0.6, 0.12, 0, -0.3, 0);
  [-0.05, -0.32, -0.56].forEach((y) => put(g, G.cyl20, shiny(0xffd23f), 0.135, 0.05, 0.135, 0, y, 0));
  put(g, G.cyl20, mat(0x1b1440), 0.1, 0.02, 0.1, 0, -0.61, 0);
  const st = put(g, GX.cone16, texMat('stripes'), 0.16, 0.2, 0.16, 0, 0.02, 0); st.rotation.x = Math.PI;
  return g;
}
function hornProp() {
  const g = new T.Group();
  put(g, G.cone16, texMat('stripes'), 0.07, 0.3, 0.07, 0, 0, 0.15).rotation.x = -Math.PI / 2;
  const bell = put(g, G.cone16, shiny(0xffd23f), 0.13, 0.12, 0.13, 0, 0, 0.33); bell.rotation.x = -Math.PI / 2;
  const curl = new T.Group(); curl.position.z = 0.36; g.add(curl);
  const tube = put(curl, G.cyl8, texMat('stripes'), 0.045, 1, 0.03, 0, 0, 0.5); tube.rotation.x = Math.PI / 2;
  const tip = put(curl, GX.tor, mat(0xff4fd8), 0.07, 0.07, 0.07, 0, 0.06, 1.0); tip.rotation.y = Math.PI / 2;
  g.userData.curl = curl; return g;
}
function burst(h, n) {
  const par = h.root.parent; if (!par) return;
  const r = h.root.rotation.y, sc = h.root.scale.x || 1, p = h.root.position;
  const fx = Math.sin(r), fz = Math.cos(r), x = p.x + fx * 0.6 * sc + Math.cos(r) * 0.45 * sc, z = p.z + fz * 0.6 * sc - Math.sin(r) * 0.45 * sc, y = p.y + 2.0 * sc;
  for (let k = 0; k < n; k++) { const sp = GP.rand(1.5, 4.5) * sc; spawn(par, 'conf', x, y, z, fx * sp + GP.rand(-2.2, 2.2) * sc, GP.rand(1.8, 4.8) * sc, fz * sp + GP.rand(-2.2, 2.2) * sc, GP.rand(2.4, 3.4), { s: sc * GP.rand(1, 1.5), floor: p.y }); }
  for (let k = 0; k < 10; k++) spawn(par, 'spark', x, y, z, GP.rand(-2, 2) * sc, GP.rand(1, 4) * sc, GP.rand(-2, 2) * sc, 0.8, { s: sc });
}
function applyEmote(h, e, dt) {
  const b = h.body, t = e.t, a = e.a, s4 = Math.sin(t * 9);
  if (a === 'disco') { // point up / down, hips sway
    const up = Math.floor(t * 2.6) % 2 === 0; b.position.y = Math.abs(Math.sin(t * 5.2)) * 0.1; b.rotation.z = Math.sin(t * 5.2) * 0.12; b.rotation.y = Math.sin(t * 2.6) * 0.35;
    h.armR.rotation.set(0, 0, up ? 2.7 : 0.6); h.armL.rotation.set(0, 0, -0.5); h.armL.rotation.x = -0.6; h.legL.rotation.x = Math.max(0, Math.sin(t * 5.2)) * 0.5; h.legR.rotation.x = Math.max(0, -Math.sin(t * 5.2)) * 0.5; h.headG.rotation.z = Math.sin(t * 5.2) * 0.15;
  } else if (a === 'robot') { // stiff stepped moves
    const q = Math.floor(t * 4) % 4, ang = [0.4, -0.4, 0.4, -0.4][q];
    b.rotation.y = ang * 0.8; h.armL.rotation.set(-1.57, 0, q % 2 ? -0.1 : -0.6); h.armR.rotation.set(q % 2 ? -1.57 : 0, 0, q % 2 ? 0.6 : 1.57); h.headG.rotation.y = -ang; b.position.y = q === 2 ? 0.05 : 0; h.legL.rotation.x = q === 1 ? -0.35 : 0; h.legR.rotation.x = q === 3 ? -0.35 : 0;
  } else if (a === 'floss') {
    const s = Math.sin(t * 9); b.rotation.z = -s * 0.15; b.rotation.y = 0.2 * Math.sin(t * 4.5);
    h.armL.rotation.set(0, 0, -0.35 + s * 0.2); h.armR.rotation.set(0, 0, 0.35 + s * 0.2); h.armL.rotation.x = s > 0 ? 0.6 : -0.6; h.armR.rotation.x = s > 0 ? 0.6 : -0.6; h.headG.rotation.z = s * 0.1; b.position.y = Math.abs(s) * 0.04;
  } else if (a === 'spin') {
    const k = Math.min(1, t / 1.6); b.rotation.y = k * TAU * 2; b.position.y = Math.sin(Math.min(1, t / 1.6) * Math.PI) * 0.7; h.armL.rotation.z = -2.6; h.armR.rotation.z = 2.6;
    if (t > 1.6) { b.rotation.y = 0; b.position.y = 0; h.armL.rotation.z = -2.7 + s4 * 0.2; h.armR.rotation.z = 2.7 - s4 * 0.2; }
    if (t > 1.6 && !e.fired) { e.fired = true; for (let k2 = 0; k2 < 8; k2++) { const p = h.root.position, ang = k2 / 8 * TAU; spawn(h.root.parent, 'spark', p.x + Math.cos(ang) * 0.5, p.y + 1.2, p.z + Math.sin(ang) * 0.5, Math.cos(ang) * 1.5, 1.6, Math.sin(ang) * 1.5, 0.8); } if (GP.Snd) GP.Snd.fx('ffCheer'); }
  } else if (a === 'cannon') {
    if (!e.prop) { e.prop = cannonProp(h.fitCol || 0xff4fd8); e.prop.position.set(0, -0.42, 0.05); h.armR.add(e.prop); }
    const aim = Math.min(1, t / 0.45); h.armR.rotation.set(0, 0, 0.15 + aim * 2.75); h.armL.rotation.set(-1.2 * aim, 0, -0.3 - aim * 0.5);
    const kick = t > 0.55 ? Math.max(0, 1 - (t - 0.55) * 4) : 0; b.rotation.x = -kick * 0.25; b.position.z = -kick * 0.12;
    if (t >= 0.55 && !e.fired) { e.fired = true; burst(h, 44); if (GP.Snd) GP.Snd.fx('ffCannon'); }
  } else if (a === 'horn') {
    if (!e.prop) { e.prop = hornProp(); e.prop.position.set(0, -0.12, 0.34); h.headG.add(e.prop); }
    const c = e.prop.userData.curl, bl = Math.max(0, Math.sin(Math.min(1, t / 1.4) * Math.PI));
    c.scale.set(1, 1, 0.05 + bl * (1 + Math.sin(t * 22) * 0.08)); c.rotation.x = -0.2 * (1 - bl);
    b.position.y = Math.abs(Math.sin(t * 7)) * 0.45 * (1 - t / e.dur); b.scale.set(1 + Math.sin(t * 14) * 0.06, 1 - Math.sin(t * 14) * 0.06, 1 + Math.sin(t * 14) * 0.06);
    h.armL.rotation.set(-1.4, 0, -0.2); h.armR.rotation.set(-1.4, 0, 0.2); h.headG.rotation.x = -0.15;
    if (!e.fired) { e.fired = true; if (GP.Snd) GP.Snd.fx('ffHorn'); }
  }
}
/* per-hero extras after every pose: animated skin parts, trails, emotes */
FF.after = function (h, pose, dt) {
  const t = h.t;
  if (h.spin) h.spin.forEach((g) => { g.rotation.y += dt * (g.userData.fast ? 14 : 0.9); });
  if (h.blink) h.blink.forEach((o, k) => { o.visible = Math.sin(t * 2.2 + k * 1.7) > -0.92; });
  if (h.eq) h.eq.forEach((q, k) => { q.scale.y = 0.04 + Math.abs(Math.sin(t * (5 + k * 1.3) + k)) * 0.14; });
  if (h.pulse) h.pulse.scale.setScalar(0.16 + Math.abs(Math.sin(t * 6)) * 0.03);
  if (h.blower) h.blower.scale.z = 0.25 + Math.max(0, Math.sin(t * 1.3)) * 0.75;
  const moving = pose === 'run' || pose === 'air';
  if (h.seat != null) {
    const e = EM[h.seat];
    if (e) {
      e.t += dt;
      if (e.t >= e.dur || (moving && e.a !== 'cannon' && e.a !== 'horn')) { if (e.prop && e.prop.parent) e.prop.parent.remove(e.prop); delete EM[h.seat]; }
      else { if (e.hero && e.hero !== h && e.prop && e.prop.parent) { e.prop.parent.remove(e.prop); e.prop = null; } e.hero = h; applyEmote(h, e, dt); }
    }
  }
  trail(h, dt, moving);
};
FF.tag = function (h, seat, col) { h.seat = seat; h.fitCol = col; if (!h.ff) { h.ff = true; if (!h.spin) { h.spin = []; h.blink = []; } } return h; };

/* sounds */
(function () {
  const S = GP.Snd; if (!S || !S.addFx) return;
  S.addFx('ffCannon', () => { S.noise(0.35, 0.35, 900, 0, null, 'lowpass'); S.tone(90, 0.3, 'sine', 0.3, 40); [0, 1, 2, 3, 4].forEach((k) => S.noise(0.04, 0.12, 4000 + k * 600, 0.15 + k * 0.05, null, 'highpass')); });
  S.addFx('ffHorn', () => { [0, 0.18, 0.36].forEach((d, k) => S.tone(S.mf(67 + k * 5), 0.16, 'sawtooth', 0.09, S.mf(69 + k * 5), d)); S.tone(S.mf(79), 0.5, 'square', 0.07, S.mf(84), 0.55); });
  S.addFx('ffDisco', () => { [72, 76, 79, 84].forEach((m, k) => S.tone(S.mf(m), 0.12, 'square', 0.06, null, k * 0.09)); });
  S.addFx('ffRobot', () => { [0, 0.25, 0.5, 0.75].forEach((d) => S.tone(220, 0.08, 'square', 0.07, 110, d)); });
  S.addFx('ffDance', () => { [67, 71, 74, 79, 74].forEach((m, k) => S.tone(S.mf(m), 0.1, 'triangle', 0.08, null, k * 0.08)); });
  S.addFx('ffCheer', () => { [76, 79, 84, 88].forEach((m, k) => S.tone(S.mf(m), 0.18, 'square', 0.06, null, k * 0.06)); S.noise(0.3, 0.08, 6000, 0, null, 'highpass'); });
  S.addFx('ffEquip', () => { S.tone(S.mf(84), 0.08, 'square', 0.06); S.tone(S.mf(91), 0.12, 'square', 0.06, null, 0.07); });
})();
FF.ready = true;

/* wrap poseHero so every renderer (board, mini games, fiesta, podium) gets skin animation, trails and emotes */
const basePose = GP.poseHero;
GP.poseHero = function (h, pose, dt, speed) { basePose(h, pose, dt, speed); if (h.ff) FF.after(h, pose, dt); };
FF.basePose = basePose;
})();
