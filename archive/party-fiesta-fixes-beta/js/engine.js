/* Grok Land Party - engine: utils, audio, renderer, shared models (art style from Grok Land) */
(function () {
'use strict';
const GP = window.GP = window.GP || {};
const $ = GP.$ = (id) => document.getElementById(id);
const clamp = GP.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = GP.lerp = (a, b, t) => a + (b - a) * t;
const TAU = GP.TAU = Math.PI * 2;
GP.damp = (rate, dt) => 1 - Math.exp(-rate * dt);
GP.angLerp = (a, b, t) => { const d = ((((b - a + Math.PI) % TAU) + TAU) % TAU) - Math.PI; return a + d * t; };
GP.rng = function (seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
GP.rand = (a, b) => a + Math.random() * (b - a);
GP.randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
GP.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
GP.shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
GP.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
GP.colorNum = (c) => parseInt(String(c || '#ffffff').slice(1), 16);
const IS_TOUCH = GP.IS_TOUCH = matchMedia('(pointer: coarse)').matches || (('ontouchstart' in window) && navigator.maxTouchPoints > 0);
GP.Q = new URLSearchParams(location.search);
GP.FAST = GP.Q.get('fast') === '1';

/* ---------------- save ---------------- */
const SAVE_KEY = 'grokparty_v1';
GP.save = { muted: false, name: '', color: '#ff4fd8', turns: 10, diff: 'easy', seats: 3, board: 'random', wins: 0 };
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s) Object.assign(GP.save, s); } catch (e) { /* ignore */ }
GP.persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(GP.save)); } catch (e) { /* ignore */ } };

/* ---------------- audio ---------------- */
GP.Snd = (() => {
  let ctx = null, master = null, sfx = null, mus = null, noiseBuf = null, muted = !!GP.save.muted;
  const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ctx = new AC(); } catch (e) { ctx = null; return; }
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ctx.destination);
    sfx = ctx.createGain(); sfx.gain.value = 0.9; sfx.connect(master);
    mus = ctx.createGain(); mus.gain.value = 0.26; mus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (pending !== null) play(pending);
  }
  function tone(f, dur, type, vol, f2, delay, bus) {
    if (!ctx) return;
    const t = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || sfx); o.start(t); o.stop(t + dur + 0.03);
  }
  function noise(dur, vol, freq, delay, bus, ft) {
    if (!ctx) return;
    const t = ctx.currentTime + (delay || 0), src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = ft || 'lowpass'; f.frequency.value = freq || 1000;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol || 0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(bus || sfx); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }
  const arp = (n, st, ty, v, len) => n.forEach((m, i) => tone(mf(m), len || st * 1.6, ty || 'square', v || 0.08, null, i * st));
  const S = {
    click() { tone(900, 0.05, 'square', 0.06); },
    select() { tone(660, 0.07, 'square', 0.07); tone(990, 0.1, 'square', 0.07, null, 0.06); },
    tick() { tone(1200 + Math.random() * 300, 0.03, 'square', 0.04); },
    dice() { tone(300, 0.12, 'square', 0.12, 900); noise(0.08, 0.12, 2400); arp([84, 88, 91], 0.05, 'triangle', 0.1); },
    hop() { tone(420, 0.09, 'triangle', 0.08, 700); },
    coin() { tone(1319, 0.06, 'square', 0.07); tone(1976, 0.22, 'square', 0.07, null, 0.06); },
    coins() { for (let i = 0; i < 3; i++) { tone(1319, 0.05, 'square', 0.06, null, i * 0.09); tone(1976, 0.12, 'square', 0.06, null, i * 0.09 + 0.05); } },
    lose() { tone(500, 0.3, 'sawtooth', 0.09, 160); tone(380, 0.35, 'square', 0.05, 120, 0.12); },
    star() { arp([72, 76, 79, 84, 88, 91, 96], 0.07, 'square', 0.08); arp([60, 64, 67, 72], 0.12, 'triangle', 0.12); },
    event() { arp([67, 71, 74, 79, 83], 0.06, 'triangle', 0.12); noise(0.2, 0.06, 3000, 0, null, 'highpass'); },
    lucky() { arp([76, 79, 84, 88], 0.07, 'square', 0.07); },
    whistle() { tone(2200, 0.18, 'square', 0.07, 2600); tone(2400, 0.3, 'square', 0.07, 2000, 0.2); },
    beep() { tone(880, 0.12, 'square', 0.1); },
    go() { tone(1320, 0.35, 'square', 0.1); tone(660, 0.35, 'triangle', 0.12); },
    pop() { noise(0.12, 0.25, 3000, 0, null, 'highpass'); tone(900, 0.08, 'square', 0.06, 300); },
    boom() { noise(0.6, 0.45, 500); tone(110, 0.5, 'sine', 0.35, 35); },
    stomp() { tone(320, 0.14, 'square', 0.13, 80); noise(0.08, 0.15, 1400); },
    bump() { tone(200, 0.1, 'square', 0.12, 110); noise(0.06, 0.12, 900); },
    splash() { noise(0.5, 0.3, 1200); tone(400, 0.3, 'sine', 0.1, 100); },
    jump() { tone(380, 0.14, 'square', 0.08, 760); },
    hurt() { tone(560, 0.3, 'sawtooth', 0.11, 110); noise(0.12, 0.1, 900); },
    pad(i) { const f = [330, 440, 554, 659][i] || 500; tone(f, 0.35, 'triangle', 0.2); tone(f * 2, 0.25, 'sine', 0.05); },
    wrong() { tone(170, 0.45, 'sawtooth', 0.13, 100); },
    right() { arp([79, 84], 0.06, 'square', 0.07); },
    mash() { tone(500 + Math.random() * 200, 0.04, 'square', 0.05); },
    win() { arp([67, 72, 76, 79, 84, 88], 0.1, 'square', 0.08, 0.2); arp([79, 84, 88, 91], 0.14, 'square', 0.08, 0.5); arp([48, 52, 55, 60, 64, 67], 0.12, 'triangle', 0.14); },
    fanfare() { arp([72, 72, 72, 76, 79, 0, 76, 79, 84], 0.12, 'square', 0.08); arp([48, 55, 60, 64, 67, 72], 0.18, 'triangle', 0.12); },
    join() { arp([72, 79, 84], 0.07, 'triangle', 0.12); },
    leave() { arp([79, 72, 67], 0.08, 'triangle', 0.1); },
    ghost() { tone(520, 0.6, 'sine', 0.07, 380); tone(530, 0.6, 'sine', 0.05, 370, 0.05); },
  };
  const SONGS = {
    title: { bpm: 150, mel: [72, 0, 74, 76, 79, 0, 76, 0, 77, 76, 74, 0, 72, 0, 67, 0, 69, 0, 72, 74, 76, 0, 74, 72, 74, 0, 0, 0, 67, 0, 71, 0, 72, 0, 74, 76, 79, 0, 81, 79, 77, 0, 76, 74, 72, 0, 76, 0, 74, 0, 72, 71, 72, 0, 67, 0, 72, 0, 0, 0, 0, 0, 0, 0], chords: [48, 53, 55, 48, 45, 53, 55, 48], minor: [0, 0, 0, 0, 1, 0, 0, 0] },
    candy: { bpm: 128, mel: [77, 0, 81, 0, 84, 0, 81, 0, 79, 0, 76, 0, 72, 0, 74, 76, 77, 0, 74, 0, 81, 0, 79, 77, 76, 0, 0, 0, 72, 0, 0, 0, 77, 0, 81, 0, 84, 0, 86, 84, 82, 0, 81, 0, 79, 0, 76, 0, 74, 0, 77, 0, 76, 0, 72, 0, 77, 0, 0, 0, 0, 0, 0, 0], chords: [53, 50, 46, 48, 53, 50, 46, 48], minor: [0, 1, 0, 0, 0, 1, 0, 0] },
    lava: { bpm: 150, mel: [69, 0, 72, 69, 76, 0, 74, 72, 71, 0, 74, 71, 76, 0, 74, 71, 69, 0, 72, 69, 77, 0, 76, 74, 76, 0, 0, 0, 68, 0, 71, 0, 69, 0, 72, 76, 81, 0, 79, 77, 76, 0, 74, 72, 74, 0, 71, 0, 72, 0, 69, 72, 77, 76, 74, 71, 69, 0, 0, 0, 64, 0, 68, 0], chords: [45, 45, 43, 43, 41, 41, 40, 40], minor: [1, 1, 0, 0, 0, 0, 0, 0] },
    frozen: { bpm: 132, mel: [74, 0, 78, 81, 86, 0, 85, 83, 81, 0, 78, 0, 76, 0, 78, 0, 79, 0, 83, 0, 81, 79, 78, 0, 76, 0, 0, 0, 73, 0, 76, 0, 74, 0, 78, 81, 86, 0, 88, 86, 85, 0, 83, 81, 79, 0, 78, 0, 76, 0, 79, 78, 76, 0, 73, 0, 74, 0, 0, 0, 0, 0, 0, 0], chords: [50, 55, 47, 45, 50, 43, 45, 50], minor: [0, 0, 1, 0, 0, 0, 0, 0] },
    haunted: { bpm: 118, mel: [64, 0, 67, 0, 71, 0, 70, 0, 69, 0, 67, 0, 66, 0, 0, 0, 64, 0, 67, 71, 76, 0, 75, 0, 72, 0, 71, 0, 0, 0, 0, 0, 71, 0, 72, 71, 69, 0, 67, 0, 66, 0, 67, 69, 71, 0, 63, 0, 64, 0, 67, 0, 66, 0, 63, 0, 64, 0, 0, 0, 0, 0, 0, 0], chords: [40, 40, 48, 47, 40, 45, 47, 40], minor: [1, 1, 0, 0, 1, 1, 0, 1] },
    mini: { bpm: 160, mel: [67, 67, 0, 74, 0, 72, 71, 0, 69, 0, 71, 72, 74, 0, 77, 0, 76, 76, 0, 72, 0, 74, 72, 0, 71, 0, 69, 0, 67, 0, 0, 0, 67, 67, 0, 74, 0, 77, 76, 0, 74, 0, 72, 74, 76, 0, 79, 0, 77, 0, 76, 74, 72, 0, 71, 0, 67, 0, 69, 0, 71, 0, 0, 0], chords: [43, 43, 41, 41, 48, 48, 43, 50], minor: [0, 0, 0, 0, 0, 0, 0, 0] },
  };
  let timer = null, song = null, step = 0, next = 0, pending = null, cur = null;
  function playStep(s, t) {
    const m = song.mel[s % song.mel.length], e = 60 / song.bpm / 2, d = t - ctx.currentTime;
    if (m) { tone(mf(m), e * 1.7, 'square', 0.045, null, d, mus); tone(mf(m + 12), e * 0.9, 'triangle', 0.016, null, d, mus); }
    const bar = Math.floor(s / 8) % song.chords.length, root = song.chords[bar], w = s % 8, third = song.minor[bar] ? 3 : 4;
    tone(mf(root - 12 + [0, 12, 7, 12, 0, 12, 7, third + 12][w]), e * 0.9, 'triangle', 0.1, null, d, mus);
    if (w % 2 === 1) noise(0.04, 0.04, 7000, d, mus, 'highpass');
    if (w === 0 || w === 4) tone(120, 0.12, 'sine', 0.14, 45, d, mus);
  }
  function sched() { if (!ctx || !song) return; const e = 60 / song.bpm / 2; while (next < ctx.currentTime + 0.2) { playStep(step, next); next += e; step++; } }
  function play(name) {
    pending = name; if (!ctx) return;
    if (cur === name && timer) return;
    stop(); pending = name; cur = name;
    song = SONGS[name] || SONGS.title; step = 0; next = ctx.currentTime + 0.1; timer = setInterval(sched, 50);
  }
  function stop() { pending = null; cur = null; if (timer) clearInterval(timer); timer = null; song = null; }
  function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.8; }
  function fx(name, a) { if (S[name]) try { S[name](a); } catch (e) { /* ignore */ } }
  return { init, fx, play, stop, setMuted, isMuted: () => muted, addSong(name, s) { SONGS[name] = s; }, addFx(name, f) { S[name] = f; }, tone: (...a) => tone(...a), noise: (...a) => noise(...a), mf, cur: () => cur };
})();

/* ---------------- renderer ---------------- */
const canvas = $('c');
const renderer = GP.renderer = new THREE.WebGLRenderer({ canvas, antialias: !IS_TOUCH, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, IS_TOUCH ? 1.6 : 2));
const SHADOWS = GP.SHADOWS = !IS_TOUCH;
renderer.shadowMap.enabled = SHADOWS; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = GP.scene = new THREE.Scene();
const camera = GP.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 600);
const hemi = GP.hemi = new THREE.HemisphereLight(0xffffff, 0x88aa66, 0.72); scene.add(hemi);
const sun = GP.sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(20, 40, 15);
if (SHADOWS) { sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 140; sun.shadow.bias = -0.0008; }
scene.add(sun); scene.add(sun.target);
scene.add(new THREE.AmbientLight(0xffffff, 0.2));
GP.onResize = function () {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h); camera.aspect = w / h; camera.fov = w < h ? 62 : 50; camera.updateProjectionMatrix();
};
window.addEventListener('resize', GP.onResize); GP.onResize();
GP.setTheme = function (t) {
  scene.background = new THREE.Color(t.sky); scene.fog = new THREE.Fog(t.fog || t.sky, t.fogNear || 45, t.fogFar || 120);
  hemi.color.set(t.hemiSky || 0xffffff); hemi.groundColor.set(t.hemiGround || 0x88aa66); hemi.intensity = t.hemiI || 0.72; sun.intensity = t.sunI || 0.9; sun.color.set(t.sunC || 0xffffff);
};

/* ---------------- materials / geometry ---------------- */
const matCache = new Map();
const mat = GP.mat = function (color, o) {
  o = o || {}; const key = color + '|' + JSON.stringify(o);
  let m = matCache.get(key); if (m) return m;
  if (IS_TOUCH) { const p = Object.assign({ color }, o); delete p.roughness; delete p.metalness; delete p.flatShading; m = new THREE.MeshLambertMaterial(p); }
  else m = new THREE.MeshStandardMaterial(Object.assign({ color, flatShading: true, roughness: 0.8, metalness: 0 }, o));
  matCache.set(key, m); return m;
};
const basic = GP.basic = function (color, o) { const key = 'B' + color + '|' + JSON.stringify(o || {}); let m = matCache.get(key); if (!m) { m = new THREE.MeshBasicMaterial(Object.assign({ color }, o || {})); matCache.set(key, m); } return m; };
const G = GP.G = {
  box: new THREE.BoxGeometry(1, 1, 1), sphere: new THREE.SphereGeometry(1, 12, 9), sphereLo: new THREE.IcosahedronGeometry(1, 1), ico: new THREE.IcosahedronGeometry(1, 0),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 14), cyl8: new THREE.CylinderGeometry(1, 1, 1, 8), cyl20: new THREE.CylinderGeometry(1, 1, 1, 24), cone: new THREE.ConeGeometry(1, 1, 8), cone6: new THREE.ConeGeometry(1, 1, 6),
  coin: new THREE.CylinderGeometry(0.42, 0.42, 0.12, 14), circle: new THREE.CircleGeometry(1, 24), ring: new THREE.RingGeometry(0.82, 1, 32), octa: new THREE.OctahedronGeometry(1, 0), dodeca: new THREE.DodecahedronGeometry(1, 0), torus: new THREE.TorusGeometry(1, 0.12, 6, 24),
  plane: new THREE.PlaneGeometry(1, 1),
};
G.circle.rotateX(-Math.PI / 2); G.ring.rotateX(-Math.PI / 2); G.plane.rotateX(-Math.PI / 2);
function starGeometry(outer, inner, depth) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 === 0 ? outer : inner; if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r); else s.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.5, bevelSize: outer * 0.12, bevelSegments: 1 }); g.center(); return g;
}
G.star = starGeometry(0.62, 0.28, 0.24);
const M = GP.M = function (geo, material, sx, sy, sz) { const m = new THREE.Mesh(geo, typeof material === 'number' ? mat(material) : material); if (sx !== undefined) m.scale.set(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz); return m; };
const shadowy = GP.shadowy = function (obj, cast, receive) { if (!SHADOWS) return obj; obj.traverse((o) => { if (o.isMesh) { o.castShadow = !!cast; o.receiveShadow = !!receive; } }); return obj; };
const canvasTex = GP.canvasTex = function (w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; };
GP.TEX = {
  glow: canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
};
GP.blob = function (r, op) { const m = new THREE.Mesh(G.circle, new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: op || 0.35, depthWrite: false })); m.scale.setScalar(r || 0.5); m.renderOrder = 2; return m; };
GP.glowSprite = function (color, s) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GP.TEX.glow, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(s || 2); return sp; };

/* ---------------- models (Grok Land style) ---------------- */
GP.buildHero = function (color, fit) {
  if (fit && GP.FF && GP.FF.ready) { const ff = GP.FF.build(color, fit); if (ff) return ff; }
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const RED = color || 0xff3b3b, BLUE = 0x2f6fe8, SKIN = 0xffc996, WHITE = 0xffffff, BOOT = 0x6b3b1f, DARK = 0x1b1440;
  const torso = M(G.cyl8, BLUE, 0.4, 0.55, 0.36); torso.position.y = 0.72; body.add(torso);
  const belly = M(G.sphereLo, BLUE, 0.42, 0.3, 0.38); belly.position.y = 0.48; body.add(belly);
  const shirt = M(G.sphereLo, RED, 0.36, 0.22, 0.32); shirt.position.y = 0.98; body.add(shirt);
  const b1 = M(G.sphereLo, 0xffd23f, 0.06); b1.position.set(-0.17, 0.86, 0.33); body.add(b1); const b2 = b1.clone(); b2.position.x = 0.17; body.add(b2);
  const headG = new THREE.Group(); headG.position.y = 1.28; body.add(headG);
  headG.add(M(G.sphere, SKIN, 0.36));
  const cap = M(new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2), RED, 0.385); cap.position.y = 0.04; headG.add(cap);
  const visor = M(G.cyl, RED, 0.3, 0.05, 0.22); visor.position.set(0, 0.05, 0.3); headG.add(visor);
  const emblem = M(G.cyl, WHITE, 0.11, 0.03, 0.11); emblem.rotation.x = Math.PI / 2 - 0.5; emblem.position.set(0, 0.2, 0.31); headG.add(emblem);
  const eyeL = M(G.sphere, WHITE, 0.08, 0.11, 0.05); eyeL.position.set(-0.12, -0.02, 0.32); headG.add(eyeL); const eyeR = eyeL.clone(); eyeR.position.x = 0.12; headG.add(eyeR);
  const pupL = M(G.sphere, DARK, 0.045, 0.065, 0.03); pupL.position.set(-0.12, -0.02, 0.36); headG.add(pupL); const pupR = pupL.clone(); pupR.position.x = 0.12; headG.add(pupR);
  const nose = M(G.sphereLo, 0xffae7a, 0.09); nose.position.set(0, -0.1, 0.36); headG.add(nose);
  const hair = M(G.sphereLo, 0x5a3212, 0.2, 0.12, 0.2); hair.position.set(0, -0.02, -0.28); headG.add(hair);
  const mkArm = (side) => { const g = new THREE.Group(); g.position.set(0.44 * side, 0.98, 0); const a = M(G.cyl8, RED, 0.09, 0.4, 0.09); a.position.y = -0.18; g.add(a); const hand = M(G.sphereLo, WHITE, 0.13); hand.position.y = -0.42; g.add(hand); body.add(g); return g; };
  const mkLeg = (side) => { const g = new THREE.Group(); g.position.set(0.18 * side, 0.42, 0); const l = M(G.cyl8, BLUE, 0.11, 0.3, 0.11); l.position.y = -0.14; g.add(l); const boot = M(G.sphereLo, BOOT, 0.15, 0.11, 0.21); boot.position.set(0, -0.32, 0.05); g.add(boot); body.add(g); return g; };
  const h = { root, body, headG, armL: mkArm(-1), armR: mkArm(1), legL: mkLeg(-1), legR: mkLeg(1), t: Math.random() * 10, cap: [cap, visor, emblem] };
  shadowy(root, true, false);
  return h;
};
// pose: 'idle' | 'run' | 'air' | 'win' | 'sad' | 'stun' | 'out'
GP.poseHero = function (h, pose, dt, speed) {
  h.t += dt * (pose === 'run' ? 6 + (speed || 4) * 1.4 : 3);
  const t = h.t, b = h.body;
  b.rotation.set(0, 0, 0); b.position.set(0, 0, 0); b.scale.set(1, 1, 1);
  h.armL.rotation.set(0, 0, -0.15); h.armR.rotation.set(0, 0, 0.15); h.legL.rotation.set(0, 0, 0); h.legR.rotation.set(0, 0, 0); h.headG.rotation.set(0, 0, 0);
  if (pose === 'run') { const s = Math.sin(t); h.legL.rotation.x = s * 0.9; h.legR.rotation.x = -s * 0.9; h.armL.rotation.x = -s * 0.8; h.armR.rotation.x = s * 0.8; b.position.y = Math.abs(Math.cos(t)) * 0.08; }
  else if (pose === 'air') { h.armL.rotation.z = -2.4; h.armR.rotation.z = 2.4; h.legL.rotation.x = -0.6; h.legR.rotation.x = 0.4; }
  else if (pose === 'win') { h.armL.rotation.z = -2.7 + Math.sin(t * 4) * 0.25; h.armR.rotation.z = 2.7 - Math.sin(t * 4) * 0.25; b.position.y = Math.abs(Math.sin(t * 2.5)) * 0.35; }
  else if (pose === 'sad') { h.headG.rotation.x = 0.45; h.armL.rotation.z = -0.05; h.armR.rotation.z = 0.05; b.rotation.x = 0.15; }
  else if (pose === 'stun') { b.rotation.y = t * 9; h.armL.rotation.z = -1.6; h.armR.rotation.z = 1.6; }
  else if (pose === 'out') { b.rotation.x = -1.45; b.position.y = 0.25; h.armL.rotation.z = -2.6; h.armR.rotation.z = 2.6; }
  else if (pose === 'mash') { const s = Math.sin(t * 6); h.armL.rotation.x = -1.4 + s * 0.6; h.armR.rotation.x = -1.4 - s * 0.6; b.rotation.x = 0.25; }
  else { b.scale.y = 1 + Math.sin(t * 2) * 0.025; h.armL.rotation.z = -0.15 - Math.sin(t * 2) * 0.05; h.armR.rotation.z = 0.15 + Math.sin(t * 2) * 0.05; }
};
function eyesOn(group, y, z, sep, size, angry) {
  const eL = M(G.sphere, 0xffffff, size * 0.8, size, size * 0.5); eL.position.set(-sep, y, z); group.add(eL); const eR = eL.clone(); eR.position.x = sep; group.add(eR);
  const pL = M(G.sphere, 0x1b1440, size * 0.45, size * 0.6, size * 0.3); pL.position.set(-sep, y, z + size * 0.35); group.add(pL); const pR = pL.clone(); pR.position.x = sep; group.add(pR);
  if (angry) { const bL = M(G.box, 0x1b1440, size * 1.4, size * 0.35, size * 0.3); bL.position.set(-sep, y + size * 1.05, z + size * 0.2); bL.rotation.z = -0.45; group.add(bL); const bR = bL.clone(); bR.position.x = sep; bR.rotation.z = 0.45; group.add(bR); }
}
GP.eyesOn = eyesOn;
GP.buildWalker = function (capColor) {
  const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
  const body = M(G.sphereLo, 0xf2c48a, 0.5, 0.42, 0.48); body.position.y = 0.5; b.add(body);
  const cap = M(new THREE.SphereGeometry(1, 10, 6, 0, TAU, 0, Math.PI / 2), capColor || 0xa0522d, 0.66, 0.55, 0.64); cap.position.y = 0.62; b.add(cap);
  eyesOn(b, 0.52, 0.4, 0.15, 0.11, true);
  const fL = M(G.sphereLo, 0x3a1d00, 0.2, 0.12, 0.26); fL.position.set(-0.22, 0.1, 0.05); b.add(fL); const fR = fL.clone(); fR.position.x = 0.22; b.add(fR);
  shadowy(g, true, false); return { root: g, body: b };
};
GP.buildGhost = function () {
  const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
  const gm = new THREE.MeshLambertMaterial({ color: 0xf4f0ff, emissive: 0x6a5a9a, transparent: true, opacity: 0.88 });
  const head = new THREE.Mesh(G.sphere, gm); head.scale.set(0.62, 0.6, 0.6); head.position.y = 0.85; b.add(head);
  const tail = new THREE.Mesh(G.cone, gm); tail.scale.set(0.5, 0.7, 0.5); tail.rotation.x = Math.PI; tail.position.y = 0.3; b.add(tail);
  const eL = new THREE.Mesh(G.sphere, basic(0x1b1440)); eL.scale.set(0.09, 0.15, 0.05); eL.position.set(-0.18, 0.95, 0.54); b.add(eL); const eR = eL.clone(); eR.position.x = 0.18; b.add(eR);
  const mouth = new THREE.Mesh(G.sphere, basic(0x7a1030)); mouth.scale.set(0.16, 0.12, 0.05); mouth.position.set(0, 0.68, 0.56); b.add(mouth);
  return { root: g, body: b };
};
GP.buildSnowman = function () {
  const g = new THREE.Group(), snowM = mat(0xffffff, { emissive: 0x334455 });
  const s1 = new THREE.Mesh(G.sphereLo, snowM); s1.scale.setScalar(0.72); s1.position.y = 0.66; g.add(s1);
  const s2 = new THREE.Mesh(G.sphereLo, snowM); s2.scale.setScalar(0.52); s2.position.y = 1.55; g.add(s2);
  const s3 = new THREE.Mesh(G.sphereLo, snowM); s3.scale.setScalar(0.4); s3.position.y = 2.2; g.add(s3);
  const nose = M(G.cone6, 0xff8a1c, 0.08, 0.4, 0.08); nose.rotation.x = Math.PI / 2; nose.position.set(0, 2.2, 0.5); g.add(nose);
  const hat = M(G.cyl8, 0x2a2344, 0.3, 0.38, 0.3); hat.position.y = 2.65; g.add(hat);
  const scarf = M(G.cyl8, 0xff3b5c, 0.42, 0.14, 0.42); scarf.position.y = 1.92; g.add(scarf);
  shadowy(g, true, false); return g;
};
GP.buildCoin = function () { const m = new THREE.Mesh(G.coin, mat(0xffd23f, { emissive: 0x6a4a00, metalness: 0.3, roughness: 0.4 })); m.rotation.x = Math.PI / 2; const g = new THREE.Group(); g.add(m); shadowy(g, true, false); return g; };
GP.buildStar = function (scale, color) {
  const g = new THREE.Group();
  const s = new THREE.Mesh(G.star, mat(color || 0xffd23f, { emissive: 0x7a5200, roughness: 0.35, metalness: 0.2 })); g.add(s);
  const e1 = M(G.sphere, 0x1b1440, 0.05, 0.1, 0.04); e1.position.set(-0.12, 0.05, 0.2); g.add(e1); const e2 = e1.clone(); e2.position.x = 0.12; g.add(e2);
  g.add(GP.glowSprite(0xfff1a0, 2.4)); g.scale.setScalar(scale || 1); shadowy(s, true, false); return g;
};
GP.buildTree = function (s, leaf, trunk) {
  const g = new THREE.Group();
  const tr = M(G.cyl8, trunk || 0x8a5a2b, 0.22 * s, 1.6 * s, 0.22 * s); tr.position.y = 0.8 * s; g.add(tr);
  const l1 = M(G.ico, leaf || 0x3fbf4a, 1.2 * s); l1.position.y = 2.1 * s; g.add(l1);
  const l2 = M(G.ico, leaf || 0x59d65a, 0.85 * s); l2.position.set(0.4 * s, 2.8 * s, 0.2 * s); g.add(l2);
  shadowy(g, true, false); return g;
};
GP.buildPine = function (s, leaf, snow) {
  const g = new THREE.Group();
  const tr = M(G.cyl8, 0x6b4423, 0.18 * s, 0.8 * s, 0.18 * s); tr.position.y = 0.4 * s; g.add(tr);
  for (let i = 0; i < 3; i++) { const c = M(G.cone, leaf || 0x2f8a4a, (1.2 - i * 0.3) * s, 1.3 * s, (1.2 - i * 0.3) * s); c.position.y = (1.2 + i * 0.75) * s; g.add(c); if (snow) { const sn = M(G.cone, 0xffffff, (0.7 - i * 0.18) * s, 0.5 * s, (0.7 - i * 0.18) * s); sn.position.y = (1.55 + i * 0.75) * s; g.add(sn); } }
  shadowy(g, true, false); return g;
};
GP.buildCloud = function (s, color) {
  const g = new THREE.Group(), m = mat(color || 0xffffff, { emissive: 0x333333 });
  [[0, 0, 0, 1.4], [1.3, -0.2, 0.2, 1.0], [-1.3, -0.25, -0.1, 1.05], [0.5, 0.6, -0.2, 0.9], [-0.6, 0.45, 0.3, 0.8]].forEach((p) => { const b = new THREE.Mesh(G.ico, m); b.position.set(p[0], p[1], p[2]); b.scale.setScalar(p[3]); g.add(b); });
  g.scale.setScalar(s); return g;
};
GP.buildBomb = function () {
  const g = new THREE.Group();
  const b = M(G.sphere, 0x22223a, 0.5); b.position.y = 0.5; g.add(b);
  const cap = M(G.cyl8, 0x888899, 0.16, 0.14, 0.16); cap.position.y = 1.0; g.add(cap);
  const fuse = M(G.cyl8, 0x7a5a2a, 0.04, 0.3, 0.04); fuse.position.set(0.06, 1.18, 0); fuse.rotation.z = -0.4; g.add(fuse);
  const spark = GP.glowSprite(0xffaa33, 0.9); spark.position.set(0.14, 1.36, 0); g.add(spark);
  eyesOn(g, 0.6, 0.42, 0.14, 0.1, true);
  g.userData.spark = spark; g.userData.ball = b;
  shadowy(g, true, false); return g;
};

/* ---------------- text sprites ---------------- */
GP.nameTag = function (name, color) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 72; const g = c.getContext('2d');
  g.font = 'bold 34px "Trebuchet MS", Arial, sans-serif';
  const w = Math.min(248, g.measureText(name).width + 40), x0 = (256 - w) / 2, y0 = 8, h = 56, rr = 22;
  g.beginPath(); g.moveTo(x0 + rr, y0); g.lineTo(x0 + w - rr, y0); g.arcTo(x0 + w, y0, x0 + w, y0 + rr, rr); g.lineTo(x0 + w, y0 + h - rr);
  g.arcTo(x0 + w, y0 + h, x0 + w - rr, y0 + h, rr); g.lineTo(x0 + rr, y0 + h); g.arcTo(x0, y0 + h, x0, y0 + h - rr, rr); g.lineTo(x0, y0 + rr); g.arcTo(x0, y0, x0 + rr, y0, rr); g.closePath();
  g.fillStyle = 'rgba(20,12,48,0.85)'; g.fill(); g.lineWidth = 6; g.strokeStyle = color; g.stroke();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name, 128, 37, 220);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false, depthWrite: false }));
  sp.scale.set(2.3, 0.65, 1); sp.renderOrder = 999; return sp;
};
GP.textTex = function (txt, bg, fg, size) {
  return canvasTex(128, 128, (g, w, h) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    g.font = 'bold ' + (size || 84) + 'px "Trebuchet MS", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,.45)'; g.strokeText(txt, w / 2, h / 2 + 6); g.fillStyle = fg || '#fff'; g.fillText(txt, w / 2, h / 2 + 6);
  });
};
})();
