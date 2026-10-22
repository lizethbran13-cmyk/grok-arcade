/* GROK LAND 2 — the sequel: new worlds, Boost Mode, online co-op, remastered classics. Built on GROK LAND, Static, dependency-free (vendored three.js r128). */
(function () {
'use strict';

// =====================================================================
// Utilities
// =====================================================================
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;
const angDiff = (a, b) => ((((b - a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
const angleLerp = (a, b, t) => a + angDiff(a, b) * t;
const damp = (rate, dt) => 1 - Math.exp(-rate * dt);
function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let IS_TOUCH = matchMedia('(pointer: coarse)').matches || (('ontouchstart' in window) && navigator.maxTouchPoints > 0);

// =====================================================================
// Save data
// =====================================================================
const SAVE_KEY = 'grokland2_v1';
const NUM_LEVELS = 40;
const save = { stars: [], cleared: [], bestCoins: [], bestTime: [], muted: false, easy: false, seen2: false };
try {
  const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  if (s && Array.isArray(s.stars)) Object.assign(save, s);
} catch (e) { /* ignore */ }
// 2.0: v1 saves only had 3 worlds; pad every per-world array so old progress carries over.
for (const k of ['stars', 'cleared', 'bestCoins', 'bestTime']) { if (!Array.isArray(save[k])) save[k] = []; }
for (let i = 0; i < NUM_LEVELS; i++) {
  if (!Array.isArray(save.stars[i])) save.stars[i] = [0, 0, 0];
  save.cleared[i] = save.cleared[i] || 0; save.bestCoins[i] = save.bestCoins[i] || 0; save.bestTime[i] = save.bestTime[i] || 0;
}
function persist() {
  try {
    // co-op: the host's EASY setting is borrowed for the session; never overwrite my own preference with it
    const out = (NET.on && NET.myEasy !== undefined) ? Object.assign({}, save, { easy: NET.myEasy }) : save;
    localStorage.setItem(SAVE_KEY, JSON.stringify(out));
  } catch (e) { /* ignore */ }
}

// =====================================================================
// Audio — tiny WebAudio synth for SFX + chiptune music
// =====================================================================
const Snd = (() => {
  let ctx = null, master = null, sfxBus = null, musBus = null, noiseBuf = null;
  let muted = !!save.muted;
  const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { ctx = null; return; }
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
    musBus = ctx.createGain(); musBus.gain.value = 0.32; musBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (pendingSong !== null) playMusic(pendingSong);
  }
  function tone(f, dur, type, vol, f2, delay, bus) {
    if (!ctx) return;
    const t = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || sfxBus);
    o.start(t); o.stop(t + dur + 0.03);
  }
  function noise(dur, vol, freq, delay, bus, ftype) {
    if (!ctx) return;
    const t = ctx.currentTime + (delay || 0);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = ftype || 'lowpass'; f.frequency.value = freq || 1000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(bus || sfxBus);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }
  const arp = (notes, step, type, vol, len) => notes.forEach((m, i) => tone(mf(m), len || step * 1.6, type || 'square', vol || 0.08, null, i * step));
  const S = {
    jump() { tone(380, 0.15, 'square', 0.09, 760); },
    djump() { tone(520, 0.2, 'square', 0.09, 1250); tone(780, 0.12, 'triangle', 0.06, 1500, 0.05); },
    longjump() { tone(300, 0.28, 'square', 0.09, 700); noise(0.15, 0.08, 2500); },
    coin() { tone(1319, 0.06, 'square', 0.07); tone(1976, 0.24, 'square', 0.07, null, 0.06); },
    stomp() { tone(320, 0.14, 'square', 0.13, 80); noise(0.08, 0.15, 1400); },
    hurt() { tone(560, 0.35, 'sawtooth', 0.12, 110); noise(0.15, 0.1, 900); },
    spin() { tone(300, 0.22, 'triangle', 0.12, 900); noise(0.2, 0.05, 3000, 0, null, 'highpass'); },
    poundStart() { tone(900, 0.18, 'square', 0.07, 1500); },
    pound() { noise(0.3, 0.35, 380); tone(150, 0.25, 'sine', 0.3, 45); },
    spring() { tone(260, 0.35, 'triangle', 0.18, 1300); tone(520, 0.3, 'square', 0.05, 2000, 0.04); },
    star() { arp([72, 76, 79, 84, 88, 91, 96], 0.07, 'square', 0.08); arp([60, 64, 67, 72], 0.12, 'triangle', 0.12); },
    oneup() { arp([76, 79, 88, 84, 86, 91], 0.09, 'square', 0.08); },
    key() { arp([84, 88, 91, 96, 100], 0.06, 'triangle', 0.12); },
    bump() { tone(200, 0.08, 'square', 0.1, 120); },
    toggle() { tone(620, 0.08, 'square', 0.09); tone(930, 0.14, 'square', 0.09, null, 0.07); },
    pad(i) { const f = [330, 440, 554, 659, 784][i] || 500; tone(f, 0.42, 'triangle', 0.2); tone(f * 2, 0.3, 'sine', 0.05); },
    wrong() { tone(170, 0.45, 'sawtooth', 0.13, 100); tone(160, 0.45, 'square', 0.06, 95, 0.02); },
    solve() { arp([67, 72, 76, 79, 84, 88, 91], 0.08, 'square', 0.08); arp([48, 55, 60, 64], 0.16, 'triangle', 0.14, 0.4); },
    click() { tone(900, 0.05, 'square', 0.06); },
    press() { tone(240, 0.1, 'square', 0.1, 160); noise(0.1, 0.12, 700); },
    door() { noise(0.7, 0.2, 260); tone(95, 0.6, 'sawtooth', 0.08, 55); },
    checkpoint() { arp([72, 79, 84, 91], 0.08, 'triangle', 0.14); },
    splash() { noise(0.5, 0.3, 1200); tone(400, 0.3, 'sine', 0.1, 100); },
    lava() { noise(0.4, 0.3, 700); tone(180, 0.4, 'sawtooth', 0.12, 700); },
    shoot() { tone(240, 0.14, 'square', 0.08, 90); noise(0.12, 0.12, 900); },
    thud() { noise(0.35, 0.4, 220); tone(75, 0.3, 'sine', 0.35, 38); },
    fall() { tone(900, 0.7, 'square', 0.07, 120); },
    reset() { tone(700, 0.12, 'triangle', 0.1, 350); tone(500, 0.18, 'triangle', 0.1, 250, 0.1); },
    bridge() { arp([60, 64, 67, 72, 76, 79, 84], 0.09, 'triangle', 0.13); },
    die() { arp([71, 77, 77, 77, 76, 74, 72], 0.14, 'square', 0.08); },
    clear() { arp([67, 72, 76, 79, 84, 88], 0.1, 'square', 0.08, 0.2); arp([79, 84, 88, 91], 0.14, 'square', 0.08, 0.5); arp([48, 52, 55, 60, 64, 67], 0.12, 'triangle', 0.14); },
    gameover() { arp([72, 67, 64, 69, 71, 69, 68, 70, 68, 67], 0.16, 'triangle', 0.14); },
    pause() { tone(988, 0.06, 'square', 0.06); tone(740, 0.08, 'square', 0.06, null, 0.07); },
    throwSnow() { noise(0.12, 0.12, 1800); tone(420, 0.12, 'triangle', 0.07, 220); },
    crack() { noise(0.18, 0.2, 3800, 0, null, 'highpass'); tone(1600, 0.1, 'square', 0.04, 900); },
    shatter() { noise(0.35, 0.25, 4200, 0, null, 'highpass'); arp([96, 91, 88], 0.04, 'triangle', 0.06); },
    ghost() { tone(520, 0.6, 'sine', 0.07, 380); tone(530, 0.6, 'sine', 0.05, 370, 0.05); },
    boo() { tone(300, 0.3, 'triangle', 0.12, 900); noise(0.25, 0.08, 2600, 0, null, 'highpass'); },
    candle() { noise(0.25, 0.15, 900); arp([76, 83], 0.07, 'triangle', 0.12); },
    candleOut() { noise(0.4, 0.12, 500); tone(300, 0.3, 'sine', 0.06, 150); },
    spark() { noise(0.2, 0.12, 5000, 0, null, 'highpass'); tone(1800, 0.08, 'square', 0.03, 2400); },
    lever() { tone(180, 0.08, 'square', 0.12, 120); noise(0.12, 0.15, 600); tone(660, 0.1, 'triangle', 0.08, null, 0.08); },
    slide() { noise(0.3, 0.1, 2400, 0, null, 'bandpass'); },
    secret() { arp([79, 83, 86, 91], 0.06, 'triangle', 0.09); },
    warp() { tone(300, 0.35, 'sine', 0.12, 1800); tone(900, 0.25, 'triangle', 0.06, 2400, 0.08); noise(0.2, 0.06, 4000, 0, null, 'highpass'); },
    boost() { tone(220, 0.4, 'square', 0.1, 1100); noise(0.3, 0.12, 1500); },
  };

  // ---- music ----
  const SONGS = [
    { // GROK MEADOWS — bouncy C major
      bpm: 150,
      mel: [72, 0, 74, 76, 79, 0, 76, 0, 77, 76, 74, 0, 72, 0, 67, 0, 69, 0, 72, 74, 76, 0, 74, 72, 74, 0, 0, 0, 67, 0, 71, 0,
        72, 0, 74, 76, 79, 0, 81, 79, 77, 0, 76, 74, 72, 0, 76, 0, 74, 0, 72, 71, 72, 0, 67, 0, 72, 0, 0, 0, 0, 0, 0, 0],
      chords: [48, 53, 55, 48, 45, 53, 55, 48], minor: [0, 0, 0, 0, 1, 0, 0, 0],
    },
    { // SKY ISLANDS — dreamy F major
      bpm: 124,
      mel: [77, 0, 81, 0, 84, 0, 81, 0, 79, 0, 76, 0, 72, 0, 74, 76, 77, 0, 74, 0, 81, 0, 79, 77, 76, 0, 0, 0, 72, 0, 0, 0,
        77, 0, 81, 0, 84, 0, 86, 84, 82, 0, 81, 0, 79, 0, 76, 0, 74, 0, 77, 0, 76, 0, 72, 0, 77, 0, 0, 0, 0, 0, 0, 0],
      chords: [53, 50, 46, 48, 53, 50, 46, 48], minor: [0, 1, 0, 0, 0, 1, 0, 0],
    },
    { // LAVA CASTLE — driving A minor
      bpm: 164,
      mel: [69, 0, 72, 69, 76, 0, 74, 72, 71, 0, 74, 71, 76, 0, 74, 71, 69, 0, 72, 69, 77, 0, 76, 74, 76, 0, 0, 0, 68, 0, 71, 0,
        69, 0, 72, 76, 81, 0, 79, 77, 76, 0, 74, 72, 74, 0, 71, 0, 72, 0, 69, 72, 77, 76, 74, 71, 69, 0, 0, 0, 64, 0, 68, 0],
      chords: [45, 45, 43, 43, 41, 41, 40, 40], minor: [1, 1, 0, 0, 0, 0, 0, 0],
    },
    { // FROSTBITE PEAKS — twinkly D major
      bpm: 132,
      mel: [74, 0, 78, 81, 86, 0, 85, 83, 81, 0, 78, 0, 76, 0, 78, 0, 79, 0, 83, 0, 81, 79, 78, 0, 76, 0, 0, 0, 73, 0, 76, 0,
        74, 0, 78, 81, 86, 0, 88, 86, 85, 0, 83, 81, 79, 0, 78, 0, 76, 0, 79, 78, 76, 0, 73, 0, 74, 0, 0, 0, 0, 0, 0, 0],
      chords: [50, 55, 47, 45, 50, 43, 45, 50], minor: [0, 0, 1, 0, 0, 0, 0, 0],
    },
    { // GHOST MANOR — spooky E minor waltz-ish
      bpm: 118,
      mel: [64, 0, 67, 0, 71, 0, 70, 0, 69, 0, 67, 0, 66, 0, 0, 0, 64, 0, 67, 71, 76, 0, 75, 0, 72, 0, 71, 0, 0, 0, 0, 0,
        71, 0, 72, 71, 69, 0, 67, 0, 66, 0, 67, 69, 71, 0, 63, 0, 64, 0, 67, 0, 66, 0, 63, 0, 64, 0, 0, 0, 0, 0, 0, 0],
      chords: [40, 40, 48, 47, 40, 45, 47, 40], minor: [1, 1, 0, 0, 1, 1, 0, 1],
    },
    { // CLOCKWORK FACTORY — busy G mixolydian
      bpm: 156,
      mel: [67, 67, 0, 74, 0, 72, 71, 0, 69, 0, 71, 72, 74, 0, 77, 0, 76, 76, 0, 72, 0, 74, 72, 0, 71, 0, 69, 0, 67, 0, 0, 0,
        67, 67, 0, 74, 0, 77, 76, 0, 74, 0, 72, 74, 76, 0, 79, 0, 77, 0, 76, 74, 72, 0, 71, 0, 67, 0, 69, 0, 71, 0, 0, 0],
      chords: [43, 43, 41, 41, 48, 48, 43, 50], minor: [0, 0, 0, 0, 0, 0, 0, 0],
    },
    { // CORAL COAST — breezy calypso Bb
      bpm: 140,
      mel: [70, 0, 74, 77, 0, 74, 77, 0, 79, 77, 74, 0, 72, 0, 70, 0, 72, 0, 75, 79, 0, 75, 79, 0, 81, 79, 77, 0, 75, 0, 72, 0,
        70, 0, 74, 77, 0, 74, 77, 0, 82, 81, 79, 0, 77, 0, 74, 0, 75, 0, 74, 72, 0, 70, 72, 0, 70, 0, 0, 0, 0, 0, 0, 0],
      chords: [46, 46, 51, 51, 53, 53, 46, 46], minor: [0, 0, 0, 0, 0, 0, 0, 0],
    },
    { // STARLIGHT STATION — spacey C minor
      bpm: 128,
      mel: [72, 0, 75, 0, 79, 0, 84, 0, 82, 0, 79, 0, 75, 0, 77, 0, 79, 0, 0, 77, 75, 0, 74, 0, 72, 0, 0, 0, 67, 0, 70, 0,
        72, 0, 75, 0, 79, 0, 84, 0, 87, 0, 86, 84, 82, 0, 79, 0, 80, 0, 79, 0, 77, 0, 75, 0, 74, 0, 72, 0, 0, 0, 0, 0],
      chords: [48, 48, 44, 44, 51, 51, 43, 43], minor: [1, 1, 0, 0, 0, 0, 0, 0],
    },
    { // CANDY'S CANYON — desert swing in E
      bpm: 146,
      mel: [64, 0, 67, 69, 71, 0, 69, 67, 64, 0, 62, 0, 64, 0, 0, 0, 71, 0, 74, 72, 71, 0, 69, 0, 67, 0, 69, 71, 64, 0, 0, 0,
        64, 0, 67, 69, 71, 0, 74, 76, 79, 0, 76, 74, 71, 0, 69, 0, 67, 0, 69, 67, 64, 0, 62, 0, 64, 0, 0, 0, 0, 0, 0, 0],
      chords: [40, 40, 45, 45, 43, 43, 47, 40], minor: [1, 1, 1, 1, 0, 0, 0, 1],
    },
    { // RATITA WORKS — sneaky lab funk in D minor
      bpm: 152,
      mel: [62, 0, 65, 0, 69, 0, 68, 69, 72, 0, 69, 0, 65, 0, 62, 0, 64, 0, 65, 67, 69, 0, 67, 65, 64, 0, 61, 0, 62, 0, 0, 0,
        62, 0, 65, 0, 69, 0, 74, 72, 70, 0, 69, 67, 65, 0, 64, 0, 62, 64, 65, 0, 67, 0, 61, 0, 62, 0, 0, 0, 0, 0, 0, 0],
      chords: [50, 50, 46, 46, 43, 43, 45, 45], minor: [1, 1, 0, 0, 1, 1, 0, 0],
    },
    { // BOOST ZONE — fast and bright, full speed ahead
      bpm: 178,
      mel: [76, 0, 79, 81, 83, 0, 81, 79, 76, 0, 74, 76, 79, 0, 0, 0, 81, 0, 83, 84, 86, 0, 84, 83, 81, 0, 79, 81, 83, 0, 0, 0,
        88, 0, 86, 84, 83, 0, 81, 79, 81, 0, 83, 84, 86, 0, 88, 0, 91, 0, 88, 86, 84, 0, 83, 81, 79, 0, 0, 0, 76, 0, 79, 0],
      chords: [52, 52, 48, 48, 50, 50, 55, 55], minor: [1, 1, 0, 0, 0, 0, 0, 0],
    },
    { // TORTUGA TECH — steady testing-lab groove in G
      bpm: 136,
      mel: [67, 0, 71, 0, 74, 0, 71, 0, 72, 0, 76, 0, 74, 0, 0, 0, 67, 0, 71, 74, 79, 0, 78, 76, 74, 0, 72, 0, 71, 0, 0, 0,
        67, 0, 71, 0, 74, 0, 79, 0, 81, 0, 79, 78, 76, 0, 74, 0, 72, 0, 71, 69, 67, 0, 66, 0, 67, 0, 0, 0, 0, 0, 0, 0],
      chords: [43, 43, 48, 48, 50, 50, 43, 43], minor: [0, 0, 0, 0, 0, 0, 0, 0],
    },
  ];
  let musicTimer = null, song = null, step = 0, nextTime = 0, pendingSong = null;
  function playStep(s, t) {
    const m = song.mel[s % song.mel.length];
    const eighth = 60 / song.bpm / 2;
    if (m) { tone(mf(m), eighth * 1.7, 'square', 0.05, null, t - ctx.currentTime, musBus); tone(mf(m + 12), eighth * 0.9, 'triangle', 0.018, null, t - ctx.currentTime, musBus); }
    const bar = Math.floor(s / 8) % song.chords.length;
    const root = song.chords[bar];
    const within = s % 8;
    const third = song.minor[bar] ? 3 : 4;
    const bassPat = [0, 12, 7, 12, 0, 12, 7, third + 12];
    tone(mf(root - 12 + bassPat[within]), eighth * 0.9, 'triangle', 0.11, null, t - ctx.currentTime, musBus);
    if (within % 2 === 1) noise(0.04, 0.05, 7000, t - ctx.currentTime, musBus, 'highpass');
    if (within === 0 || within === 4) tone(120, 0.12, 'sine', 0.16, 45, t - ctx.currentTime, musBus);
    if (within === 2 || within === 6) noise(0.09, 0.07, 1800, t - ctx.currentTime, musBus, 'bandpass');
  }
  function schedule() {
    if (!ctx || !song) return;
    const eighth = 60 / song.bpm / 2;
    while (nextTime < ctx.currentTime + 0.2) { playStep(step, nextTime); nextTime += eighth; step++; }
  }
  function playMusic(i) {
    pendingSong = i;
    if (!ctx) return;
    stopMusic(); pendingSong = i;
    song = SONGS[songOf(i) % SONGS.length]; step = 0; nextTime = ctx.currentTime + 0.1;
    musicTimer = setInterval(schedule, 50);
  }
  function stopMusic() { pendingSong = null; if (musicTimer) clearInterval(musicTimer); musicTimer = null; song = null; }
  function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.8; }
  S.pet = (k) => { if (k === 'candy') { tone(520, 0.08, 'square', 0.08, 380); tone(560, 0.1, 'square', 0.08, 400, 0.14); } else if (k === 'torty') { tone(180, 0.3, 'triangle', 0.12, 260); } else { tone(1800, 0.06, 'sine', 0.06, 2400); tone(2000, 0.06, 'sine', 0.06, 2600, 0.09); } };
  S.grind = () => noise(0.12, 0.04, 5200, 0, null, 'highpass');
  S.land = () => tone(700, 0.08, 'triangle', 0.08, 1100);
  return { init, S, playMusic, stopMusic, setMuted, isMuted: () => muted };
})();

// =====================================================================
// Input
// =====================================================================
const input = { mx: 0, my: 0, jump: false, action: false, jumpPressed: false, actionPressed: false };
const keys = Object.create(null);
const ACTION_KEYS = new Set(['ShiftLeft', 'ShiftRight', 'KeyX', 'KeyF', 'KeyK']);
const JUMP_KEYS = new Set(['Space', 'KeyJ', 'KeyZ']);
const touchState = { jx: 0, jy: 0, jump: false, action: false, boost: false, joyId: null };
// Online co-op state. Filled in by the ONLINE CO-OP section near the end; completely inert in single-player.
const NET = { on: false, host: true, applying: false, credit: null, menu: false, remotes: new Map(), gen: 0 };

// =====================================================================
// Renderer / scene
// =====================================================================
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !IS_TOUCH, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, IS_TOUCH ? 1.6 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
const SHADOWS = true;
renderer.shadowMap.enabled = SHADOWS;
renderer.shadowMap.type = IS_TOUCH ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.32;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 900);
const hemi = new THREE.HemisphereLight(0xffffff, 0x88aa66, 0.7);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.95);
sun.position.set(20, 40, 15);
if (SHADOWS) {
  sun.castShadow = true;
  sun.shadow.mapSize.set(IS_TOUCH ? 1024 : 2048, IS_TOUCH ? 1024 : 2048);
  const SR = IS_TOUCH ? 24 : 30;
  const sc = sun.shadow.camera; sc.left = -SR; sc.right = SR; sc.top = SR; sc.bottom = -SR; sc.near = 1; sc.far = 120;
  sun.shadow.bias = -0.0008;
}
scene.add(sun); scene.add(sun.target);
const ambient = new THREE.AmbientLight(0xffffff, 0.18);
scene.add(ambient);

function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.fov = w < h ? 72 : 60;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

// =====================================================================
// Materials & geometry caches
// =====================================================================
const matCache = new Map();
function mat(color, o) {
  o = o || {};
  const key = color + '|' + JSON.stringify(o);
  let m = matCache.get(key);
  if (m) return m;
  if (IS_TOUCH) {
    const p = Object.assign({ color }, o); delete p.roughness; delete p.metalness; delete p.flatShading;
    m = new THREE.MeshLambertMaterial(p);
  } else {
    m = new THREE.MeshStandardMaterial(Object.assign({ color, flatShading: true, roughness: 0.8, metalness: 0 }, o));
  }
  matCache.set(key, m);
  return m;
}
function basic(color, o) {
  const key = 'B' + color + '|' + JSON.stringify(o || {});
  let m = matCache.get(key);
  if (!m) { m = new THREE.MeshBasicMaterial(Object.assign({ color }, o || {})); matCache.set(key, m); }
  return m;
}
const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 12, 9),
  sphereLo: new THREE.IcosahedronGeometry(1, 1),
  ico: new THREE.IcosahedronGeometry(1, 0),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
  cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
  cone: new THREE.ConeGeometry(1, 1, 8),
  cone6: new THREE.ConeGeometry(1, 1, 6),
  coin: new THREE.CylinderGeometry(0.42, 0.42, 0.12, 14),
  torus: new THREE.TorusGeometry(1, 0.08, 6, 28),
  circle: new THREE.CircleGeometry(1, 20),
  part: new THREE.IcosahedronGeometry(0.13, 0),
  octa: new THREE.OctahedronGeometry(1, 0),
  dodeca: new THREE.DodecahedronGeometry(1, 0),
};
G.circle.rotateX(-Math.PI / 2);
G.boxEdges = new THREE.EdgesGeometry(G.box);
function starGeometry(outer, inner, depth) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outer : inner;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r); else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.5, bevelSize: outer * 0.12, bevelSegments: 1 });
  g.center();
  return g;
}
G.star = starGeometry(0.62, 0.28, 0.24);

function M(geo, material, sx, sy, sz) {
  const m = new THREE.Mesh(geo, typeof material === 'number' ? mat(material) : material);
  if (sx !== undefined) m.scale.set(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz);
  return m;
}
function shadowy(obj, cast, receive) {
  if (!SHADOWS) return obj;
  obj.traverse((o) => { if (o.isMesh) { o.castShadow = !!cast; o.receiveShadow = !!receive; } });
  return obj;
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  return t;
}
const TEX = {
  glow: canvasTex(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }),
  sign: canvasTex(128, 96, (g, w, h) => {
    g.fillStyle = '#c98a4b'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#a86c33'; for (let y = 0; y < h; y += 24) g.fillRect(0, y, w, 3);
    g.font = 'bold 76px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#3a1d00'; g.fillText('!', w / 2 + 3, h / 2 + 5); g.fillStyle = '#fff6d0'; g.fillText('!', w / 2, h / 2 + 2);
  }),
  flag: canvasTex(128, 96, (g, w, h) => {
    g.fillStyle = '#ff4d4d'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? 14 : 32; g.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); }
    g.fill();
  }),
};

// =====================================================================
// GROK LAND 2 graphics: world-space textures (never stretched), baked
// ambient-occlusion gradients, and static batching for dense worlds.
// =====================================================================
function noiseCanvas(size, draw) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); draw(g, size, mulberry(size * 7 + draw.length));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = IS_TOUCH ? 1 : 4;
  return t;
}
// grayscale patterns; the material colour tints them
const PAT = {
  grass: noiseCanvas(128, (g, s, r) => {
    g.fillStyle = '#e6e6e6'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 520; i++) { const v = 200 + (r() * 55) | 0; g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; const x = r() * s, y = r() * s; g.fillRect(x, y, 1.5, 3 + r() * 4); }
    for (let i = 0; i < 160; i++) { const v = 255; g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',.55)'; g.fillRect(r() * s, r() * s, 1, 2); }
    for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(120,120,120,.25)'; g.beginPath(); g.arc(r() * s, r() * s, 2 + r() * 5, 0, TAU); g.fill(); }
  }),
  speck: noiseCanvas(128, (g, s, r) => {
    g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) { const v = 185 + (r() * 70) | 0; g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(r() * s, r() * s, 1 + r() * 2, 1 + r() * 2); }
  }),
  strata: noiseCanvas(128, (g, s, r) => {
    g.fillStyle = '#e4e4e4'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 6 + (r() * 10 | 0)) { const v = 190 + (r() * 60) | 0; g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(0, y, s, 2 + r() * 4); }
    for (let i = 0; i < 260; i++) { const v = 170 + (r() * 80) | 0; g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.beginPath(); g.arc(r() * s, r() * s, 0.8 + r() * 2.2, 0, TAU); g.fill(); }
  }),
  brick: noiseCanvas(128, (g, s, r) => {
    g.fillStyle = '#b8b8b8'; g.fillRect(0, 0, s, s);
    const bh = 16, bw = 32;
    for (let row = 0; row < s / bh; row++) for (let col = -1; col < s / bw + 1; col++) {
      const x = col * bw + (row % 2 ? bw / 2 : 0), v = 215 + (r() * 40) | 0;
      g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(x + 1.5, row * bh + 1.5, bw - 3, bh - 3);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 2, row * bh + 2, bw - 4, 2);
    }
  }),
  plank: noiseCanvas(128, (g, s, r) => {
    g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 32) {
      const v = 210 + (r() * 40) | 0; g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(x + 1, 0, 30, s);
      g.fillStyle = 'rgba(90,90,90,.35)'; for (let k = 0; k < 7; k++) g.fillRect(x + 3 + r() * 24, r() * s, 1, 10 + r() * 30);
      g.fillStyle = '#8a8a8a'; g.fillRect(x, 0, 1.5, s);
      g.fillStyle = '#9a9a9a'; g.fillRect(x + 6, (r() * s) | 0, 3, 3); g.fillRect(x + 22, (r() * s) | 0, 3, 3);
    }
  }),
  panel: noiseCanvas(128, (g, s, r) => {
    g.fillStyle = '#d4d4d4'; g.fillRect(0, 0, s, s);
    g.strokeStyle = '#8c8c8c'; g.lineWidth = 2; g.strokeRect(2, 2, s / 2 - 4, s / 2 - 4); g.strokeRect(s / 2 + 2, 2, s / 2 - 4, s / 2 - 4); g.strokeRect(2, s / 2 + 2, s - 4, s / 2 - 4);
    g.fillStyle = '#a0a0a0'; for (const [x, y] of [[8, 8], [s / 2 - 8, 8], [s / 2 + 8, 8], [s - 8, 8], [8, s / 2 + 8], [s - 8, s / 2 + 8], [8, s - 8], [s - 8, s - 8]]) { g.beginPath(); g.arc(x, y, 2.5, 0, TAU); g.fill(); }
    for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(r() * s, r() * s, 2, 1); }
  }),
  snow: noiseCanvas(128, (g, s, r) => {
    g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 400; i++) { const v = 215 + (r() * 40) | 0; g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.beginPath(); g.arc(r() * s, r() * s, 1 + r() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 60; i++) { g.fillStyle = '#ffffff'; g.fillRect(r() * s, r() * s, 1.5, 1.5); }
  }),
  tile: noiseCanvas(128, (g, s, r) => {
    g.fillStyle = '#a8a8a8'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const v = 222 + (r() * 30) | 0; g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(x * 32 + 1.5, y * 32 + 1.5, 29, 29); }
  }),
};
// which pattern each block style wears on its top cap and its sides (tile size in world units)
const STYLE_PAT = {
  grass: ['grass', 'strata', 5], meadow: ['grass', 'strata', 5], stone: ['brick', 'brick', 3], castle: ['brick', 'brick', 3], brick: ['brick', 'brick', 3],
  wood: ['plank', 'plank', 3], fall: ['plank', 'plank', 3], block: ['speck', 'speck', 2], hedge: ['grass', 'grass', 3], dark: ['brick', 'brick', 3],
  snow: ['snow', 'strata', 5], ice: ['speck', 'speck', 4], rock: ['snow', 'strata', 5], grave: ['grass', 'strata', 5], manor: ['plank', 'brick', 3],
  metal: ['panel', 'panel', 3], brass: ['panel', 'panel', 3], sand: ['speck', 'strata', 5], reef: ['speck', 'strata', 5], coral: ['speck', 'speck', 3],
  moon: ['speck', 'strata', 5], hull: ['panel', 'panel', 3], neon: ['panel', 'panel', 3], tide: ['speck', 'speck', 3],
  mesa: ['speck', 'strata', 6], redrock: ['strata', 'strata', 5], desert: ['speck', 'strata', 6], mine: ['plank', 'strata', 4], lab: ['tile', 'panel', 3],
  cheese: ['speck', 'speck', 3], shell: ['tile', 'panel', 3], path: ['speck', 'speck', 3], tech: ['tile', 'panel', 3], park: ['grass', 'strata', 6],
};
const texMatCache = new Map();
function texMat(color, pat, o) {
  const key = color + '|' + pat + '|' + JSON.stringify(o || {});
  let m = texMatCache.get(key);
  if (m) return m;
  const p = Object.assign({ color, map: PAT[pat] || null, vertexColors: true }, o || {});
  if (IS_TOUCH) { delete p.roughness; delete p.metalness; m = new THREE.MeshLambertMaterial(p); }
  else m = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85, metalness: 0 }, p));
  texMatCache.set(key, m);
  return m;
}
// A box geometry in real units with UVs in world units (tile = metres per texture repeat),
// so textures keep their aspect ratio on every face, plus a baked bottom-dark AO gradient.
const boxGeoCache = new Map();
function boxGeoUV(w, h, d, tile, aoLo) {
  const key = w.toFixed(2) + ',' + h.toFixed(2) + ',' + d.toFixed(2) + ',' + tile + ',' + (aoLo || 0);
  let g = boxGeoCache.get(key);
  if (g) return g;
  g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv, pos = g.attributes.position, n = pos.count;
  const col = new Float32Array(n * 3);
  const lo = aoLo === undefined || aoLo === 0 ? 0.6 : aoLo;
  for (let i = 0; i < n; i++) {
    const face = Math.floor(i / 4); // +x,-x,+y,-y,+z,-z
    const fw = face < 2 ? d : w, fh = face === 2 || face === 3 ? d : h;
    uv.setXY(i, uv.getX(i) * fw / tile, uv.getY(i) * fh / tile);
    const k = h > 0 ? Math.min(1, Math.max(0, (pos.getY(i) + h / 2) / h)) : 1;
    const v = face === 2 ? 1 : face === 3 ? lo : lo + (1 - lo) * Math.pow(k, 0.7);
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = v;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  boxGeoCache.set(key, g);
  return g;
}
// Static batching: everything put in W.deco is merged per material after the level is built.
function mergeStatic(group) {
  group.updateMatrixWorld(true);
  const buckets = new Map();
  const leftovers = [];
  group.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material) || o.userData.noMerge) return;
    const m = o.material;
    if (m.transparent || m.isSpriteMaterial) { leftovers.push(o); return; }
    let b = buckets.get(m); if (!b) { b = []; buckets.set(m, b); } b.push(o);
  });
  const out = new THREE.Group();
  let verts = 0;
  for (const [m, list] of buckets) {
    if (list.length < 2) { for (const o of list) leftovers.push(o); continue; }
    const needUV = !!m.map, needCol = !!m.vertexColors;
    let total = 0;
    const geos = list.map((o) => { let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld); total += g.attributes.position.count; return g; });
    const P3 = new Float32Array(total * 3), N3 = new Float32Array(total * 3), C3 = needCol ? new Float32Array(total * 3) : null, U2 = needUV ? new Float32Array(total * 2) : null;
    let off = 0;
    for (const g of geos) {
      const c = g.attributes.position.count;
      P3.set(g.attributes.position.array, off * 3);
      if (g.attributes.normal) N3.set(g.attributes.normal.array, off * 3);
      if (C3) { if (g.attributes.color) C3.set(g.attributes.color.array, off * 3); else C3.fill(1, off * 3, (off + c) * 3); }
      if (U2 && g.attributes.uv) U2.set(g.attributes.uv.array, off * 2);
      off += c; g.dispose();
    }
    const mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.BufferAttribute(P3, 3));
    mg.setAttribute('normal', new THREE.BufferAttribute(N3, 3));
    if (C3) mg.setAttribute('color', new THREE.BufferAttribute(C3, 3));
    if (U2) mg.setAttribute('uv', new THREE.BufferAttribute(U2, 2));
    mg.computeBoundingSphere();
    const mesh = new THREE.Mesh(mg, m);
    if (SHADOWS) { mesh.castShadow = true; mesh.receiveShadow = true; }
    out.add(mesh); verts += total;
  }
  for (const o of leftovers) { o.updateMatrixWorld(true); const c = o.clone(); o.matrixWorld.decompose(c.position, c.quaternion, c.scale); out.add(c); }
  W.mergedGeos = (W.mergedGeos || []);
  out.traverse((o) => { if (o.isMesh && o.geometry && !o.geometry.parameters) W.mergedGeos.push(o.geometry); });
  return { group: out, verts, buckets: buckets.size };
}
// put a static prop into the batch group
function deco(obj, x, y, z, ry, s) { obj.position.set(x, y, z); if (ry) obj.rotation.y = ry; if (s) obj.scale.setScalar(s); (W.deco || W.root).add(obj); return obj; }

// =====================================================================
// Character / object models
// =====================================================================
function buildHero(color) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const RED = color || 0xff3b3b, BLUE = 0x2f6fe8, SKIN = 0xffc996, WHITE = 0xffffff, BOOT = 0x6b3b1f, DARK = 0x1b1440;
  const torso = M(G.cyl8, BLUE, 0.4, 0.55, 0.36); torso.position.y = 0.72; body.add(torso);
  const belly = M(G.sphereLo, BLUE, 0.42, 0.3, 0.38); belly.position.y = 0.48; body.add(belly);
  const shirt = M(G.sphereLo, RED, 0.36, 0.22, 0.32); shirt.position.y = 0.98; body.add(shirt);
  const b1 = M(G.sphereLo, 0xffd23f, 0.06); b1.position.set(-0.17, 0.86, 0.33); body.add(b1);
  const b2 = b1.clone(); b2.position.x = 0.17; body.add(b2);
  const headG = new THREE.Group(); headG.position.y = 1.28; body.add(headG);
  const head = M(G.sphere, SKIN, 0.36); headG.add(head);
  const cap = M(new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2), RED, 0.385); cap.position.y = 0.04; headG.add(cap);
  const visor = M(G.cyl, RED, 0.3, 0.05, 0.22); visor.position.set(0, 0.05, 0.3); headG.add(visor);
  const emblem = M(G.cyl, WHITE, 0.11, 0.03, 0.11); emblem.rotation.x = Math.PI / 2 - 0.5; emblem.position.set(0, 0.2, 0.31); headG.add(emblem);
  const emblemG = M(G.cyl, 0xff3b3b, 0.05, 0.035, 0.05); emblemG.rotation.x = Math.PI / 2 - 0.5; emblemG.position.set(0, 0.2, 0.32); headG.add(emblemG);
  const eyeL = M(G.sphere, WHITE, 0.08, 0.11, 0.05); eyeL.position.set(-0.12, -0.02, 0.32); headG.add(eyeL);
  const eyeR = eyeL.clone(); eyeR.position.x = 0.12; headG.add(eyeR);
  const pupL = M(G.sphere, DARK, 0.045, 0.065, 0.03); pupL.position.set(-0.12, -0.02, 0.36); headG.add(pupL);
  const pupR = pupL.clone(); pupR.position.x = 0.12; headG.add(pupR);
  const nose = M(G.sphereLo, 0xffae7a, 0.09); nose.position.set(0, -0.1, 0.36); headG.add(nose);
  const hair = M(G.sphereLo, 0x5a3212, 0.2, 0.12, 0.2); hair.position.set(0, -0.02, -0.28); headG.add(hair);
  const mkArm = (side) => {
    const g = new THREE.Group(); g.position.set(0.44 * side, 0.98, 0);
    const a = M(G.cyl8, RED, 0.09, 0.4, 0.09); a.position.y = -0.18; g.add(a);
    const hand = M(G.sphereLo, WHITE, 0.13); hand.position.y = -0.42; g.add(hand);
    body.add(g); return g;
  };
  const mkLeg = (side) => {
    const g = new THREE.Group(); g.position.set(0.18 * side, 0.42, 0);
    const l = M(G.cyl8, BLUE, 0.11, 0.3, 0.11); l.position.y = -0.14; g.add(l);
    const boot = M(G.sphereLo, BOOT, 0.15, 0.11, 0.21); boot.position.set(0, -0.32, 0.05); g.add(boot);
    body.add(g); return g;
  };
  const armL = mkArm(-1), armR = mkArm(1), legL = mkLeg(-1), legR = mkLeg(1);
  shadowy(root, true, false);
  return { root, body, headG, armL, armR, legL, legR };
}

function eyesOn(group, y, z, sep, size, angry) {
  const eL = M(G.sphere, 0xffffff, size * 0.8, size, size * 0.5); eL.position.set(-sep, y, z); group.add(eL);
  const eR = eL.clone(); eR.position.x = sep; group.add(eR);
  const pL = M(G.sphere, 0x1b1440, size * 0.45, size * 0.6, size * 0.3); pL.position.set(-sep, y, z + size * 0.35); group.add(pL);
  const pR = pL.clone(); pR.position.x = sep; group.add(pR);
  if (angry) {
    const bL = M(G.box, 0x1b1440, size * 1.4, size * 0.35, size * 0.3); bL.position.set(-sep, y + size * 1.05, z + size * 0.2); bL.rotation.z = -0.45; group.add(bL);
    const bR = bL.clone(); bR.position.x = sep; bR.rotation.z = 0.45; group.add(bR);
  }
}
function buildWalker() {
  const g = new THREE.Group(); const b = new THREE.Group(); g.add(b);
  const body = M(G.sphereLo, 0xf2c48a, 0.5, 0.42, 0.48); body.position.y = 0.5; b.add(body);
  const cap = M(new THREE.SphereGeometry(1, 10, 6, 0, TAU, 0, Math.PI / 2), 0xa0522d, 0.66, 0.55, 0.64); cap.position.y = 0.62; b.add(cap);
  const rim = M(G.cyl, 0x7c3a18, 0.66, 0.08, 0.64); rim.position.y = 0.62; b.add(rim);
  eyesOn(b, 0.52, 0.4, 0.15, 0.11, true);
  const fL = M(G.sphereLo, 0x3a1d00, 0.2, 0.12, 0.26); fL.position.set(-0.22, 0.1, 0.05); b.add(fL);
  const fR = fL.clone(); fR.position.x = 0.22; b.add(fR);
  shadowy(g, true, false);
  return { root: g, body: b, fL, fR };
}
function buildSpiky() {
  const g = new THREE.Group(); const b = new THREE.Group(); g.add(b);
  const shell = M(G.sphereLo, 0xe8303a, 0.62, 0.55, 0.62); shell.position.y = 0.6; b.add(shell);
  const belly = M(G.sphereLo, 0xffe08a, 0.5, 0.3, 0.5); belly.position.set(0, 0.35, 0.12); b.add(belly);
  const spikeMat = mat(0xffffff);
  const dirs = [];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; dirs.push([Math.cos(a), 0.35, Math.sin(a)]); }
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4; dirs.push([Math.cos(a) * 0.6, 0.9, Math.sin(a) * 0.6]); }
  dirs.push([0, 1, 0]);
  for (const d of dirs) {
    const v = new THREE.Vector3(d[0], d[1], d[2]).normalize();
    const s = new THREE.Mesh(G.cone6, spikeMat); s.scale.set(0.12, 0.38, 0.12);
    s.position.set(v.x * 0.58, 0.6 + v.y * 0.5, v.z * 0.58);
    s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
    b.add(s);
  }
  eyesOn(b, 0.5, 0.5, 0.16, 0.11, true);
  shadowy(g, true, false);
  return { root: g, body: b };
}
function buildBee() {
  const g = new THREE.Group(); const b = new THREE.Group(); g.add(b);
  const body = M(G.sphereLo, 0xffd23f, 0.42, 0.4, 0.5); body.position.y = 0.45; b.add(body);
  for (let i = -1; i <= 1; i += 2) { const s = M(G.cyl, 0x1b1440, 0.41, 0.08, 0.41); s.rotation.x = Math.PI / 2; s.position.set(0, 0.45, i * 0.14 - 0.06); s.scale.set(0.41, 0.08, 0.39); b.add(s); }
  const sting = M(G.cone6, 0x1b1440, 0.1, 0.3, 0.1); sting.rotation.x = -Math.PI / 2; sting.position.set(0, 0.45, -0.58); b.add(sting);
  eyesOn(b, 0.55, 0.4, 0.14, 0.1, true);
  const wm = mat(0xdff6ff, { transparent: true, opacity: 0.7 });
  const wL = new THREE.Mesh(G.sphere, wm); wL.scale.set(0.34, 0.05, 0.18); wL.position.set(-0.36, 0.85, -0.05); b.add(wL);
  const wR = wL.clone(); wR.position.x = 0.36; b.add(wR);
  shadowy(g, true, false);
  return { root: g, body: b, wL, wR };
}
function buildTurret() {
  const g = new THREE.Group();
  const base = M(G.cyl8, 0x5a4f7a, 0.6, 0.5, 0.6); base.position.y = 0.25; g.add(base);
  const ring = M(G.cyl8, 0xffd23f, 0.64, 0.1, 0.64); ring.position.y = 0.5; g.add(ring);
  const head = new THREE.Group(); head.position.y = 0.9; g.add(head);
  const dome = M(G.sphereLo, 0x3d335e, 0.5); head.add(dome);
  const barrel = M(G.cyl8, 0x2a2344, 0.2, 0.7, 0.2); barrel.rotation.x = Math.PI / 2; barrel.position.z = 0.5; head.add(barrel);
  const muzzle = M(G.cyl8, 0xff4d4d, 0.24, 0.1, 0.24); muzzle.rotation.x = Math.PI / 2; muzzle.position.z = 0.86; head.add(muzzle);
  const eye = new THREE.Mesh(G.sphereLo, basic(0xff3355)); eye.scale.setScalar(0.12); eye.position.set(0, 0.25, 0.4); head.add(eye);
  shadowy(g, true, false);
  return { root: g, head, eye };
}
function buildCoinMesh() { if (W.boost) return buildRingMesh(); const m = new THREE.Mesh(G.coin, mat(0xffd23f, { emissive: 0x6a4a00, metalness: 0.3, roughness: 0.4 })); m.rotation.x = Math.PI / 2; const g = new THREE.Group(); g.add(m); shadowy(g, true, false); return g; }
function buildStarMesh(scale, color) {
  const g = new THREE.Group();
  const s = new THREE.Mesh(G.star, mat(color || 0xffd23f, { emissive: 0x7a5200, roughness: 0.35, metalness: 0.2 }));
  g.add(s);
  const e1 = M(G.sphere, 0x1b1440, 0.05, 0.1, 0.04); e1.position.set(-0.12, 0.05, 0.2); g.add(e1);
  const e2 = e1.clone(); e2.position.x = 0.12; g.add(e2);
  const e3 = e1.clone(); e3.position.z = -0.2; g.add(e3); const e4 = e2.clone(); e4.position.z = -0.2; g.add(e4);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xfff1a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(2.4); g.add(halo);
  g.scale.setScalar(scale || 1);
  shadowy(s, true, false);
  return g;
}
function buildOneUp() {
  const g = new THREE.Group();
  const stem = M(G.cyl8, 0xfff3d6, 0.24, 0.35, 0.24); stem.position.y = 0.2; g.add(stem);
  const cap = M(new THREE.SphereGeometry(1, 12, 7, 0, TAU, 0, Math.PI / 2), 0x3fd34a, 0.46, 0.4, 0.46); cap.position.y = 0.34; g.add(cap);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU; const s = M(G.sphereLo, 0xffffff, 0.1, 0.06, 0.1); s.position.set(Math.cos(a) * 0.3, 0.55, Math.sin(a) * 0.3); g.add(s); }
  const t = M(G.sphereLo, 0xffffff, 0.12, 0.06, 0.12); t.position.y = 0.74; g.add(t);
  eyesOn(g, 0.22, 0.2, 0.08, 0.05, false);
  shadowy(g, true, false);
  return g;
}
function buildKey() {
  const g = new THREE.Group();
  const km = mat(0xffd23f, { emissive: 0x6a4a00, metalness: 0.5, roughness: 0.3 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.09, 6, 16), km); ring.position.y = 0.3; g.add(ring);
  const shaft = new THREE.Mesh(G.box, km); shaft.scale.set(0.12, 0.7, 0.12); shaft.position.y = -0.25; g.add(shaft);
  const t1 = new THREE.Mesh(G.box, km); t1.scale.set(0.22, 0.1, 0.12); t1.position.set(0.14, -0.5, 0); g.add(t1);
  const t2 = t1.clone(); t2.position.y = -0.33; t2.scale.x = 0.16; t2.position.x = 0.11; g.add(t2);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffe680, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(2); g.add(halo);
  shadowy(g, true, false);
  return g;
}
function buildTree(s, leafColor) {
  const g = new THREE.Group();
  const trunk = M(G.cyl8, 0x8a5a2b, 0.22 * s, 1.6 * s, 0.22 * s); trunk.position.y = 0.8 * s; g.add(trunk);
  const c = leafColor || 0x3fbf4a;
  const l1 = M(G.ico, c, 1.2 * s); l1.position.y = 2.1 * s; g.add(l1);
  const l2 = M(G.ico, 0x59d65a, 0.85 * s); l2.position.set(0.4 * s, 2.8 * s, 0.2 * s); g.add(l2);
  const l3 = M(G.ico, 0x2fa84a, 0.7 * s); l3.position.set(-0.5 * s, 2.5 * s, -0.3 * s); g.add(l3);
  shadowy(g, true, false);
  return g;
}
function buildCloud(s) {
  const g = new THREE.Group();
  const m = mat(0xffffff, { emissive: 0x333333 });
  const parts = [[0, 0, 0, 1.4], [1.3, -0.2, 0.2, 1.0], [-1.3, -0.25, -0.1, 1.05], [0.5, 0.6, -0.2, 0.9], [-0.6, 0.45, 0.3, 0.8]];
  for (const p of parts) { const b = new THREE.Mesh(G.ico, m); b.position.set(p[0], p[1], p[2]); b.scale.setScalar(p[3]); g.add(b); }
  g.scale.setScalar(s);
  return g;
}
function buildFlower(color) {
  const g = new THREE.Group();
  const st = M(G.cyl8, 0x2fa84a, 0.04, 0.4, 0.04); st.position.y = 0.2; g.add(st);
  const f = M(G.ico, color, 0.14); f.position.y = 0.45; g.add(f);
  const c = M(G.ico, 0xffe14a, 0.07); c.position.set(0, 0.47, 0.09); g.add(c);
  return g;
}
function buildTorch() {
  const g = new THREE.Group();
  const post = M(G.cyl8, 0x4a3b52, 0.14, 1.4, 0.14); post.position.y = 0.7; g.add(post);
  const bowl = M(G.cyl8, 0x2a2344, 0.3, 0.2, 0.22); bowl.position.y = 1.45; g.add(bowl);
  const fl = new THREE.Mesh(G.cone6, basic(0xffa020)); fl.scale.set(0.24, 0.6, 0.24); fl.position.y = 1.8; g.add(fl);
  const fl2 = new THREE.Mesh(G.cone6, basic(0xffee66)); fl2.scale.set(0.12, 0.35, 0.12); fl2.position.y = 1.72; g.add(fl2);
  g.userData.flame = fl;
  return g;
}

// =====================================================================
// World state
// =====================================================================
const V3 = THREE.Vector3;
const W = {
  root: null, solids: [], things: [], enemies: [], items: [], projectiles: [], pushBlocks: [], colorBlocks: [], toggles: [],
  checkpoints: [], anim: [], time: 0, colorState: 'red', killY: -10, lavaY: null, lavaMesh: null, lavaBase: null,
  levelIdx: 0, checkpoint: { pos: new V3(), yaw: 0 }, clouds: [], goalDone: false, zones: [],
};
const particles = [];
const rings = [];
let shakeAmt = 0;

// Player state (defined early; entities read it)
const RUN = 9.5, G_UP = 40, G_DOWN = 52, JUMP_V = 14.8, DJUMP_V = 13.4, SPRING_V = 24, MAX_FALL = 32,
  PUSH_SPEED = 3.2, LONG_H = 17, LONG_V = 11.5, STEP_H = 0.36, G_LAVA = 38;
// 2.0 fairness: longer coyote time + jump buffer, ledge assist (landing tolerance), stronger air control
const COYOTE = 0.17, JUMP_BUF = 0.17, AIR_ACCEL = 40, AIR_ACCEL_LONG = 15, HURT_INVULN = 2.0;
const ledgeAssist = () => (save.easy ? 0.75 : 0.5);
const P = {
  pos: new V3(), vel: new V3(), r: 0.4, h: 1.5, facing: 0, grounded: false, ground: null, wasGrounded: false,
  coyote: 0, jumpBuf: 0, canDouble: false, jumping: false, springing: false, state: 'normal', stateT: 0,
  health: 3, maxHealth: 3, invuln: 0, hasKey: false, spinCd: 0, flip: 0, squash: 1, pushing: false, pushT: 0,
  lastSafe: new V3(), landVy: 0, bounceV: 0, animT: 0, model: null, blob: null, frozen: false,
};

function disposeTree(root) {
  const seen = new Set();
  root.traverse((o) => {
    if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); }
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of ms) if (m.map && !seen.has(m.map)) { seen.add(m.map); m.map.dispose(); }
  });
}
function clearWorld() {
  if (W.root) { scene.remove(W.root); disposeTree(W.root); }
  W.root = new THREE.Group();
  scene.add(W.root);
  W.deco = new THREE.Group(); W.root.add(W.deco); W.pets = []; W.mergedGeos = [];
  if (W.boost) boostOff();
  for (const k of ['solids', 'things', 'enemies', 'items', 'projectiles', 'pushBlocks', 'colorBlocks', 'toggles', 'checkpoints', 'anim', 'clouds', 'zones']) W[k].length = 0;
  for (const p of particles) scene.remove(p.m);
  particles.length = 0;
  for (const r of rings) scene.remove(r.m);
  rings.length = 0;
  W.time = 0; W.colorState = 'red'; W.lavaY = null; W.lavaMesh = null; W.goalDone = false;
  W.itemSeq = 0; W.enemySeq = 0; W.icicles = []; W.netSw = []; W.simon = null; W.candles = null; W.levers = null;
}

// =====================================================================
// Physics helpers (everything solid is an axis-aligned box)
// =====================================================================
function addSolid(x, cy, z, hx, hy, hz, kind, mesh) {
  const s = { x, y: cy, z, hx, hy, hz, kind: kind || 'static', mesh: mesh || null, active: true, dx: 0, dy: 0, dz: 0 };
  W.solids.push(s);
  return s;
}
function setSolidPos(s, x, y, z) {
  s.dx += x - s.x; s.dy += y - s.y; s.dz += z - s.z;
  s.x = x; s.y = y; s.z = z;
  if (s.mesh) s.mesh.position.set(x, y, z);
}
function overlapsBody(px, py, pz, r, h, s) {
  return px + r > s.x - s.hx && px - r < s.x + s.hx && pz + r > s.z - s.hz && pz - r < s.z + s.hz && py + h > s.y - s.hy && py < s.y + s.hy;
}
function boxFree(x, y, z, hx, hy, hz, except) {
  for (const s of W.solids) {
    if (!s.active || s === except) continue;
    if (x + hx > s.x - s.hx && x - hx < s.x + s.hx && z + hz > s.z - s.hz && z - hz < s.z + s.hz && y + hy > s.y - s.hy && y - hy < s.y + s.hy) return false;
  }
  return true;
}
function groundTopAt(x, z, maxY) {
  let best = -Infinity;
  for (const s of W.solids) {
    if (!s.active) continue;
    if (x < s.x - s.hx || x > s.x + s.hx || z < s.z - s.hz || z > s.z + s.hz) continue;
    const top = s.y + s.hy;
    if (top <= maxY + 0.01 && top > best) best = top;
  }
  return best;
}
function rayDist(o, d, maxD) {
  let best = maxD;
  for (const s of W.solids) {
    if (!s.active || s.noCam || (s.hx < 0.7 && s.hz < 0.7) || s.hy < 0.35) continue;
    let tmin = 0, tmax = best, hit = true;
    for (const ax of ['x', 'y', 'z']) {
      const h = ax === 'x' ? s.hx : ax === 'y' ? s.hy : s.hz;
      const mn = s[ax] - h, mx = s[ax] + h;
      if (Math.abs(d[ax]) < 1e-6) { if (o[ax] < mn || o[ax] > mx) { hit = false; break; } }
      else {
        let t1 = (mn - o[ax]) / d[ax], t2 = (mx - o[ax]) / d[ax];
        if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
        tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
        if (tmin > tmax) { hit = false; break; }
      }
    }
    if (hit && tmin > 0.05 && tmin < best) best = tmin;
  }
  return best;
}

// =====================================================================
// Effects
// =====================================================================
function burst(x, y, z, color, n, speed, life, grav, size) {
  if (particles.length > 260) return;
  const m0 = basic(color);
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(G.part, m0);
    const s = (size || 1) * (0.6 + Math.random() * 0.8);
    m.scale.setScalar(s); m.position.set(x, y, z);
    scene.add(m);
    const a = Math.random() * TAU, u = Math.random() * 2 - 1, sp = speed * (0.4 + Math.random() * 0.6);
    const c = Math.sqrt(1 - u * u);
    particles.push({ m, vx: Math.cos(a) * c * sp, vy: Math.abs(u) * sp + speed * 0.3, vz: Math.sin(a) * c * sp, life: life * (0.6 + Math.random() * 0.5), max: life, grav: grav === undefined ? 18 : grav, s });
  }
}
function dust(x, y, z, n) { burst(x, y + 0.1, z, 0xf4ecd8, n || 6, 3, 0.45, 4, 1.4); }
function ringFx(x, y, z, color, maxR) {
  const m = new THREE.Mesh(G.torus, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false }));
  m.rotation.x = Math.PI / 2; m.position.set(x, y + 0.1, z); m.scale.setScalar(0.3);
  scene.add(m);
  rings.push({ m, t: 0, maxR: maxR || 3 });
}
function updateFx(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { scene.remove(p.m); particles.splice(i, 1); continue; }
    p.vy -= p.grav * dt;
    p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
    p.m.scale.setScalar(p.s * Math.min(1, p.life / (p.max * 0.5)));
  }
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    r.t += dt;
    const k = r.t / 0.45;
    if (k >= 1) { scene.remove(r.m); r.m.material.dispose(); rings.splice(i, 1); continue; }
    r.m.scale.setScalar(0.3 + k * r.maxR);
    r.m.material.opacity = 0.9 * (1 - k);
  }
}

// =====================================================================
// Level-building API
// =====================================================================
const STYLE = {
  grass: { side: 0xb87840, top: 0x6ad64f, cap: 0.45 },
  meadow: { side: 0xa86b3c, top: 0x86e05a, cap: 0.45 },
  stone: { side: 0xa9a39a, top: 0xdad4c8, cap: 0.3 },
  castle: { side: 0x77708f, top: 0x9d98b8, cap: 0.3 },
  brick: { side: 0xb5563b, top: 0xe3a26a, cap: 0.3 },
  wood: { side: 0xc07f3f, top: 0xe8ae66, cap: 0.18 },
  fall: { side: 0xff9a3c, top: 0xffd08a, cap: 0.18 },
  cloud: { side: 0xffffff, top: 0xffffff, cap: 0, emissive: 0x2a2a2a },
  block: { side: 0xffb627, top: 0xffd35a, cap: 0.14 },
  hedge: { side: 0x2f9a45, top: 0x4fc85e, cap: 0 },
  crystal: { side: 0x8ef0ff, top: 0xd6fbff, cap: 0, emissive: 0x1f7f99 },
  dark: { side: 0x4a3b52, top: 0x6a5872, cap: 0.25 },
  gold: { side: 0xffc93c, top: 0xffe38a, cap: 0.2, emissive: 0x4a3200 },
  snow: { side: 0xb9c9de, top: 0xffffff, cap: 0.42, emissive: 0x1a2230 },
  ice: { side: 0x7fc8f0, top: 0xcff2ff, cap: 0.12, emissive: 0x1a4a66 },
  rock: { side: 0x6f7a90, top: 0xe8f0ff, cap: 0.25 },
  grave: { side: 0x463c5a, top: 0x4f6a48, cap: 0.3 },
  manor: { side: 0x5a4a6e, top: 0x7c6a92, cap: 0.22 },
  metal: { side: 0x4a525e, top: 0x7a8592, cap: 0.16 },
  brass: { side: 0xb07a25, top: 0xe2b453, cap: 0.16, emissive: 0x2a1800 },
};
function styledMesh(w, h, d, style) {
  const st = STYLE[style] || STYLE.stone;
  const sp = STYLE_PAT[style] || ['speck', 'speck', 3];
  const g = new THREE.Group();
  const o = st.emissive ? { emissive: st.emissive } : undefined;
  const body = new THREE.Mesh(boxGeoUV(w, h, d, sp[2], st.ao || 0.58), texMat(st.side, sp[1], o)); g.add(body);
  if (st.cap) {
    const ch = Math.min(st.cap, h * 0.6);
    const cap = new THREE.Mesh(boxGeoUV(w + 0.14, ch, d + 0.14, sp[2], 0.82), texMat(st.top, sp[0], o)); cap.position.y = h / 2 - ch / 2 + 0.002; g.add(cap);
  } else if (sp[0] !== sp[1]) {
    const top = new THREE.Mesh(boxGeoUV(w + 0.02, 0.04, d + 0.02, sp[2], 1), texMat(st.top, sp[0], o)); top.position.y = h / 2 - 0.018; g.add(top);
  }
  if (style === 'cloud') {
    const n = Math.max(2, Math.round((w + d) / 2.2));
    for (let i = 0; i < n; i++) {
      const b = new THREE.Mesh(G.ico, mat(0xffffff, o));
      const sz = Math.min(w, d) * (0.3 + Math.random() * 0.12);
      b.scale.set(sz, sz * 0.7, sz);
      b.position.set((Math.random() - 0.5) * (w - sz), -h * 0.2 - Math.random() * 0.2, (Math.random() - 0.5) * (d - sz));
      g.add(b);
    }
  }
  if (style === 'fall') {
    const stripe = M(G.box, 0x6b3b1f); stripe.scale.set(w + 0.02, 0.1, d + 0.02); stripe.position.y = -h * 0.15; g.add(stripe);
  }
  return g;
}
function addBox(x, top, z, w, d, h, style, kind, opts) {
  h = h || 1;
  const mesh = styledMesh(w, h, d, style);
  mesh.position.set(x, top - h / 2, z);
  shadowy(mesh, !(opts && opts.noCast) && (w * d < 60), true);
  W.root.add(mesh);
  const s = addSolid(x, top - h / 2, z, w / 2, h / 2, d / 2, kind || 'static', mesh);
  s.style = style;
  return s;
}
function addIsland(x, top, z, w, d, style, h, opts) {
  h = h || 3;
  const s = addBox(x, top, z, w, d, h, style, 'static', { noCast: true });
  const depth = Math.min(w, d) * 0.7 + 2;
  const rockColor = (opts && opts.rock) || ({ cloud: 0xf4f0ff, snow: 0x8090a8, ice: 0x6aa8d0, grave: 0x3a3048, manor: 0x3a3048, metal: 0x3d4450, brass: 0x5a4020, sand: 0xb08850, reef: 0x1f6a70, coral: 0xc05060, moon: 0x55556a, hull: 0x3a4058, neon: 0x1a1440, gold: 0x8a6420 })[style] || 0x9a6a44;
  const cone = new THREE.Mesh(G.cone6, mat(rockColor));
  cone.rotation.x = Math.PI;
  cone.scale.set(w * 0.55, depth, d * 0.55);
  cone.position.set(x, top - h - depth / 2 + 0.01, z);
  W.root.add(cone);
  if (style === 'grass' || style === 'meadow') {
    const r2 = new THREE.Mesh(G.dodeca, mat(0x8a5a36)); r2.scale.set(w * 0.2, depth * 0.3, d * 0.2);
    r2.position.set(x + w * 0.15, top - h - depth * 0.35, z - d * 0.1); W.root.add(r2);
  }
  if (!(opts && opts.bare)) decorate(s);
  return s;
}
let decoRand = mulberry(7);
const FLOWER_COLORS = [0xff5a8a, 0xffffff, 0xff9d2e, 0xb06bff, 0xff4d4d];
function decorate(s) {
  if (s.style !== 'grass' && s.style !== 'meadow') return;
  const area = s.hx * s.hz * 4;
  const n = Math.min(14, Math.floor(area / 14));
  for (let i = 0; i < n; i++) {
    const x = s.x + (decoRand() * 2 - 1) * (s.hx - 0.4), z = s.z + (decoRand() * 2 - 1) * (s.hz - 0.4);
    const f = decoRand() < 0.6 ? buildFlower(FLOWER_COLORS[(decoRand() * FLOWER_COLORS.length) | 0]) : grassTuft();
    f.position.set(x, s.y + s.hy, z);
    f.rotation.y = decoRand() * TAU;
    (W.deco || W.root).add(f);
  }
}
function grassTuft() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) { const c = M(G.cone6, 0x3fbf4a, 0.08, 0.35 + i * 0.08, 0.08); c.position.set((i - 1) * 0.1, 0.18, (i % 2) * 0.08); c.rotation.z = (i - 1) * 0.3; g.add(c); }
  return g;
}
function addTree(x, top, z, s, leaf) {
  s = s || 1;
  const t = buildTree(s, leaf); t.position.set(x, top, z); t.rotation.y = Math.random() * TAU; (W.deco || W.root).add(t);
  addSolid(x, top + 1.2 * s, z, 0.3 * s, 1.2 * s, 0.3 * s, 'static', null).noCam = true;
}
function addDecor(obj, x, y, z, ry) { obj.position.set(x, y, z); if (ry) obj.rotation.y = ry; W.root.add(obj); return obj; }

// ---------- moving / falling / springs / ? blocks ----------
function addMover(x, top, z, w, d, to, period, phase, style) {
  const s = addBox(x, top, z, w, d, 0.6, style || 'wood', 'mover');
  const ax = s.x, ay = s.y, az = s.z;
  const arrows = new THREE.Mesh(G.box, mat(0x6b3b1f)); arrows.scale.set(w * 0.6, 0.02, 0.18); arrows.position.y = 0.31;
  if (Math.abs(to[2]) > Math.abs(to[0])) arrows.rotation.y = Math.PI / 2;
  s.mesh.add(arrows);
  W.things.push({ update() {
    const t = (1 - Math.cos((W.time / period + (phase || 0)) * TAU)) / 2;
    setSolidPos(s, ax + to[0] * t, ay + to[1] * t, az + to[2] * t);
  } });
  return s;
}
function addFalling(x, top, z, w, d) {
  const s = addBox(x, top, z, w, d, 0.6, 'fall', 'falling');
  const hx = s.x, hy = s.y, hz = s.z;
  s.state = 'idle'; s.t = 0; s.vy = 0;
  s.onLand = () => { if (s.state === 'idle') { s.state = 'shake'; s.t = 0; Snd.S.bump(); if (NET.on && !NET.applying) netEvent({ t: 'fall', k: W.solids.indexOf(s) }); } };
  W.things.push({ update(dt) {
    s.t += dt;
    if (s.state === 'shake') {
      s.mesh.position.x = s.x + Math.sin(s.t * 70) * 0.07;
      if (s.t > 0.75) { s.state = 'fall'; s.t = 0; s.vy = 0; s.mesh.position.x = s.x; }
    } else if (s.state === 'fall') {
      s.vy = Math.max(s.vy - 30 * dt, -25);
      setSolidPos(s, s.x, s.y + s.vy * dt, s.z);
      if (s.t > 2.0) { s.state = 'gone'; s.active = false; s.mesh.visible = false; s.t = 0; }
    } else if (s.state === 'gone' && s.t > 1.8) {
      if (!overlapsBody(P.pos.x, P.pos.y, P.pos.z, P.r, P.h, { x: hx, y: hy, z: hz, hx: s.hx, hy: s.hy, hz: s.hz })) {
        s.x = hx; s.y = hy; s.z = hz; s.mesh.position.set(hx, hy, hz);
        s.active = true; s.mesh.visible = true; s.state = 'idle'; s.mesh.scale.setScalar(0.01); s.t = 0;
        W.anim.push({ t: 0, f(dt, a) { a.t += dt; const k = Math.min(1, a.t / 0.3); s.mesh.scale.setScalar(k); return k >= 1; } });
      }
    }
  } });
  return s;
}
function addSpring(x, top, z) {
  const g = new THREE.Group();
  const base = M(G.cyl, 0xe8303a, 0.7, 0.18, 0.7); base.position.y = 0.09; g.add(base);
  const coil = new THREE.Group(); g.add(coil);
  for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(G.torus, mat(0xcfd6e6, { metalness: 0.5, roughness: 0.3 })); t.rotation.x = Math.PI / 2; t.scale.set(0.42, 0.42, 1.5); t.position.y = 0.22 + i * 0.1; coil.add(t); }
  const pad = M(G.cyl, 0xffd23f, 0.66, 0.14, 0.66); pad.position.y = 0.5; g.add(pad);
  const dot = M(G.cyl, 0xff4d4d, 0.3, 0.15, 0.3); dot.position.y = 0.5; g.add(dot);
  shadowy(g, true, true);
  g.scale.y = 0.62;
  g.position.set(x, top, z); W.root.add(g);
  const s = addSolid(x, top + 0.17, z, 0.66, 0.17, 0.66, 'spring', null);
  s.anim = 0; s.group = g;
  W.things.push({ update(dt) {
    s.anim = Math.max(0, s.anim - dt);
    const k = s.anim > 0 ? Math.sin((1 - s.anim / 0.4) * Math.PI * 3) * (s.anim / 0.4) : 0;
    pad.position.y = dot.position.y = 0.5 + k * 0.35;
    coil.scale.y = 1 + k * 0.9;
  } });
  return s;
}
const qTex = canvasTex(64, 64, (g, w, h) => {
  g.fillStyle = '#ffb627'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#c77700'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = '#8a4b00'; [[9, 9], [55, 9], [9, 55], [55, 55]].forEach(([a, b]) => { g.beginPath(); g.arc(a, b, 3, 0, TAU); g.fill(); });
  g.font = 'bold 44px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#8a4b00'; g.fillText('?', w / 2 + 2, h / 2 + 4); g.fillStyle = '#fff'; g.fillText('?', w / 2, h / 2 + 2);
});
function addQBlock(x, cy, z, contents) {
  const m = new THREE.Mesh(G.box, mat(0xffffff, { map: qTex, emissive: 0x332200 }));
  m.scale.setScalar(1.1);
  const g = new THREE.Group(); g.add(m); shadowy(g, true, true);
  g.position.set(x, cy, z); W.root.add(g);
  const s = addSolid(x, cy, z, 0.55, 0.55, 0.55, 'qblock', g);
  s.used = false; s.contents = contents || 'coins';
  s.onBump = () => {
    if (s.used) { Snd.S.bump(); return; }
    // co-op: the host owns ? blocks (so coins are only counted once); a joiner asks the host to bump it
    if (NET.on && !NET.host && !NET.applying) { netSend({ t: 'bump', k: W.solids.indexOf(s) }); Snd.S.bump(); return; }
    s.used = true;
    const by = NET.credit;
    if (NET.on && NET.host) netBroadcast({ t: 'qb', k: W.solids.indexOf(s), id: W.itemSeq });
    m.material = mat(0xa0673a);
    W.anim.push({ t: 0, f(dt, a) { a.t += dt; g.position.y = cy + Math.sin(Math.min(1, a.t / 0.2) * Math.PI) * 0.35; return a.t >= 0.2; } });
    if (s.contents === '1up') { Snd.S.bump(); addItem('oneup', x, cy + 1.2, z); }
    else {
      const n = s.contents === 'coins' ? 5 : 1;
      for (let i = 0; i < n; i++) setTimeout(() => { NET.credit = by; collectCoin(x, cy + 1.2, z); NET.credit = null; popCoinFx(x, cy + 0.6, z); }, i * 110);
    }
  };
  return s;
}
function popCoinFx(x, y, z) {
  const c = buildCoinMesh(); c.position.set(x, y, z); W.root.add(c);
  W.anim.push({ t: 0, f(dt, a) { a.t += dt; c.position.y = y + a.t * 7 - a.t * a.t * 10; c.rotation.y += dt * 20; if (a.t > 0.55) { W.root.remove(c); return true; } return false; } });
}

// ---------- items ----------
function addItem(type, x, y, z, extra) {
  let mesh, r = 0.9;
  if (type === 'coin') mesh = buildCoinMesh();
  else if (type === 'star') { mesh = buildStarMesh(1.25); r = 1.25; }
  else if (type === 'oneup') { mesh = buildOneUp(); r = 0.9; }
  else if (type === 'key') { mesh = buildKey(); r = 1.1; }
  else if (type === 'tstar') { mesh = buildStarMesh(1.25, 0x3ff0ff); r = 1.25; }
  mesh.position.set(x, y, z);
  W.root.add(mesh);
  const it = Object.assign({ type, mesh, x, y, z, r, alive: true, phase: Math.random() * TAU, id: W.itemSeq++ }, extra || {});
  if (type === 'star' && save.stars[W.levelIdx][it.idx]) { mesh.children[0].material = mat(0x9fd8ff, { emissive: 0x1f4a7a, transparent: true, opacity: 0.8 }); }
  W.items.push(it);
  return it;
}
function coinLine(x1, y1, z1, x2, y2, z2, n) { for (let i = 0; i < n; i++) { const t = n === 1 ? 0 : i / (n - 1); addItem('coin', lerp(x1, x2, t), lerp(y1, y2, t), lerp(z1, z2, t)); } }
function coinRing(x, y, z, r, n) { for (let i = 0; i < n; i++) { const a = (i / n) * TAU; addItem('coin', x + Math.cos(a) * r, y, z + Math.sin(a) * r); } }

// ---------- checkpoints / hints / goal ----------
function addCheckpoint(x, top, z, yaw) {
  const g = new THREE.Group();
  const base = M(G.cyl8, 0x7a7394, 0.45, 0.25, 0.45); base.position.y = 0.12; g.add(base);
  const pole = M(G.cyl8, 0xffffff, 0.07, 3, 0.07); pole.position.y = 1.6; g.add(pole);
  const ball = M(G.sphereLo, 0xffd23f, 0.16); ball.position.y = 3.15; g.add(ball);
  const flag = M(G.box, 0xff4d4d, 1.0, 0.65, 0.05); flag.position.set(0.55, 2.7, 0); g.add(flag);
  shadowy(g, true, false);
  g.position.set(x, top, z); W.root.add(g);
  const cp = { x, y: top, z, yaw: yaw || 0, active: false, flag };
  W.checkpoints.push(cp);
  W.things.push({ update() {
    flag.rotation.y = Math.sin(W.time * 3 + x) * 0.25;
    if (cp.active) return;
    const dx = P.pos.x - x, dz = P.pos.z - z;
    if (dx * dx + dz * dz < 4 && Math.abs(P.pos.y - top) < 2.5 && P.state !== 'dead') {
      for (const c of W.checkpoints) { c.active = false; c.flag.material = mat(0xff4d4d); }
      cp.active = true; flag.material = mat(0x59d65a, { emissive: 0x114411 });
      W.checkpoint.pos.set(x, top + 0.05, z + 0.01); W.checkpoint.yaw = cp.yaw;
      if (P.health < P.maxHealth) { P.health = P.maxHealth; updateHUD(true); }
      Snd.S.checkpoint(); burst(x, top + 2.8, z, 0x59d65a, 16, 5, 0.7);
      showToast('<b>CHECKPOINT!</b> Health restored.', 2);
    }
  } });
  return cp;
}
function addHint(x, top, z, text, touchText, radius) {
  const g = new THREE.Group();
  const post = M(G.box, 0x8a5a2b, 0.15, 1.2, 0.15); post.position.y = 0.6; g.add(post);
  const board = new THREE.Mesh(G.box, [mat(0xc98a4b), mat(0xc98a4b), mat(0xc98a4b), mat(0xc98a4b), mat(0xffffff, { map: TEX.sign }), mat(0xffffff, { map: TEX.sign })]);
  board.scale.set(1.1, 0.8, 0.1); board.position.y = 1.35; g.add(board);
  shadowy(g, true, false);
  g.position.set(x, top, z); W.root.add(g);
  const h = { inside: false };
  radius = radius || 3.2;
  W.things.push({ update() {
    const dx = P.pos.x - x, dz = P.pos.z - z;
    const inside = dx * dx + dz * dz < radius * radius && Math.abs(P.pos.y - top) < 3;
    if (inside && !h.inside) showToast(IS_TOUCH && touchText ? touchText : text, 6);
    h.inside = inside;
  } });
}
function addGoal(x, top, z, type) {
  const g = new THREE.Group();
  let center;
  if (type === 'flag') {
    const pole = M(G.cyl8, 0xf4f4f4, 0.1, 7, 0.1); pole.position.y = 3.5; g.add(pole);
    const ball = M(G.sphereLo, 0xffd23f, 0.3); ball.position.y = 7.1; g.add(ball);
    const flag = new THREE.Mesh(G.box, [mat(0xff4d4d), mat(0xff4d4d), mat(0xff4d4d), mat(0xff4d4d), mat(0xffffff, { map: TEX.flag }), mat(0xffffff, { map: TEX.flag })]);
    flag.scale.set(2.2, 1.5, 0.06); flag.position.set(1.15, 6.1, 0); g.add(flag);
    g.userData.flag = flag;
    center = new V3(x, top + 2, z);
  } else {
    const st = buildStarMesh(2.2); st.position.y = 1.6; g.add(st);
    g.userData.star = st;
    const beam = new THREE.Mesh(G.cyl, new THREE.MeshBasicMaterial({ color: 0xfff1a0, transparent: true, opacity: 0.18, depthWrite: false }));
    beam.scale.set(1.2, 30, 1.2); beam.position.y = 15; g.add(beam);
    center = new V3(x, top + 1.6, z);
  }
  shadowy(g, true, false);
  g.position.set(x, top, z); W.root.add(g); W.goalPos = center || new V3(x, top, z); W.goalType = type;
  W.things.push({ update() {
    if (g.userData.star) { g.userData.star.rotation.y = W.time * 2; g.userData.star.position.y = 1.6 + Math.sin(W.time * 2.5) * 0.25; }
    if (g.userData.flag) g.userData.flag.rotation.y = Math.sin(W.time * 4) * 0.15;
    if (W.goalDone || P.state === 'dead') return;
    const dx = P.pos.x - center.x, dz = P.pos.z - center.z, dy = P.pos.y + 0.75 - center.y;
    if (type === 'flag' ? (dx * dx + dz * dz < 1.3 && P.pos.y > top - 0.5 && P.pos.y < top + 7.5) : (dx * dx + dy * dy + dz * dz < 3.2)) {
      W.goalDone = true;
      if (NET.on) netReachGoal(g); else winLevel(g);
    }
  } });
}

// ---------- puzzle pieces ----------
const crateTex = canvasTex(64, 64, (g, w, h) => {
  g.fillStyle = '#c98a4b'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#7a4a1f'; g.lineWidth = 7; g.strokeRect(4, 4, w - 8, h - 8);
  g.lineWidth = 6; g.beginPath(); g.moveTo(8, 8); g.lineTo(w - 8, h - 8); g.moveTo(w - 8, 8); g.lineTo(8, h - 8); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(8, 8, w - 16, 6);
});
function addPushBlock(x, top, z) {
  const size = 1.8;
  const m = new THREE.Mesh(G.box, mat(0xffffff, { map: crateTex })); m.scale.setScalar(size);
  const g = new THREE.Group(); g.add(m); shadowy(g, true, true);
  g.position.set(x, top + size / 2, z); W.root.add(g);
  const s = addSolid(x, top + size / 2, z, size / 2, size / 2, size / 2, 'push', g);
  s.home = new V3(x, top + size / 2, z); s.vy = 0; s.seated = false; s.seatX = 0; s.seatZ = 0;
  W.pushBlocks.push(s);
  return s;
}
function resetBlock(b) {
  burst(b.x, b.y, b.z, 0xc98a4b, 10, 4, 0.5);
  b.x = b.home.x; b.y = b.home.y; b.z = b.home.z; b.vy = 0; b.slide = null; b.mesh.position.copy(b.home);
  burst(b.x, b.y, b.z, 0xffffff, 10, 4, 0.5);
}
function tryMoveBlock(b, axis, amt) {
  const nx = b.x + (axis === 'x' ? amt : 0), nz = b.z + (axis === 'z' ? amt : 0);
  if (!boxFree(nx, b.y + 0.02, nz, b.hx - 0.02, b.hy - 0.02, b.hz - 0.02, b)) return false;
  setSolidPos(b, nx, b.y, nz);
  return true;
}
function updatePushBlocks(dt) {
  for (const b of W.pushBlocks) {
    if (b.seated) {
      const dx = b.seatX - b.x, dz = b.seatZ - b.z;
      if (Math.abs(dx) + Math.abs(dz) > 0.001) {
        const k = Math.min(1, dt * 8);
        setSolidPos(b, b.x + dx * k, b.y, b.z + dz * k);
      }
      continue;
    }
    if (b.slide) slideBlock(b, dt);
    // gravity
    b.vy = Math.max(b.vy - 40 * dt, -30);
    const ny = b.y + b.vy * dt;
    if (boxFree(b.x, ny, b.z, b.hx - 0.02, b.hy, b.hz - 0.02, b)) setSolidPos(b, b.x, ny, b.z);
    else {
      if (b.vy < -8) { Snd.S.thud(); dust(b.x, b.y - b.hy, b.z, 8); }
      const top = groundTopAt(b.x, b.z, b.y - b.hy + 0.05);
      if (top > -Infinity && top > b.y - b.hy - 0.5) setSolidPos(b, b.x, top + b.hy, b.z);
      b.vy = 0;
    }
    if (b.y < W.killY || (W.lavaY !== null && b.y - b.hy < W.lavaY - 0.5)) { resetBlock(b); Snd.S.reset(); showToast('The crate fell&hellip; it\'s back at the start.', 2.5); }
  }
}
function addPressureSwitch(x, top, z) {
  const g = new THREE.Group();
  const frame = M(G.box, 0x3d335e, 2.5, 0.12, 2.5); frame.position.y = 0.06; g.add(frame);
  const plate = M(G.box, 0xffd23f, 2.0, 0.14, 2.0); plate.position.y = 0.12; g.add(plate);
  const mark = M(G.box, 0xff9d00, 1.0, 0.16, 1.0); mark.position.y = 0.12; g.add(mark);
  shadowy(g, false, true);
  g.position.set(x, top, z); W.root.add(g);
  const sw = { x, y: top, z, pressed: false };
  sw.press = (b) => {
    if (sw.pressed || !b) return;
    b.seated = true; b.seatX = x; b.seatZ = z; b.slide = null; sw.pressed = true;
    plate.material = mat(0x59d65a, { emissive: 0x115511 }); mark.material = mat(0x2fa84a); plate.position.y = mark.position.y = 0.05;
    Snd.S.press(); Snd.S.toggle(); burst(x, top + 0.4, z, 0x59d65a, 18, 5, 0.6);
    if (NET.on && NET.host) netBroadcast({ t: 'press', k: W.netSw.indexOf(sw), b: W.pushBlocks.indexOf(b) });
    if (sw.onPress) sw.onPress();
  };
  W.netSw.push(sw);
  W.things.push({ update() {
    if (sw.pressed || (NET.on && !NET.host)) return; // co-op: the host decides when a crate seats
    for (const b of W.pushBlocks) {
      if (b.seated || b.slide) continue;
      if (Math.abs(b.x - x) < 1.05 && Math.abs(b.z - z) < 1.05 && Math.abs(b.y - b.hy - top) < 0.3) { sw.press(b); break; }
    }
  } });
  return sw;
}
function addResetPad(x, top, z, blocks) {
  const g = new THREE.Group();
  const d = M(G.cyl, 0x38b6ff, 0.9, 0.12, 0.9); d.position.y = 0.06; g.add(d);
  const r = new THREE.Mesh(G.torus, mat(0xffffff)); r.rotation.x = Math.PI / 2; r.scale.set(0.55, 0.55, 1.5); r.position.y = 0.14; g.add(r);
  const ar = M(G.cone6, 0xffffff, 0.14, 0.25, 0.14); ar.rotation.z = -Math.PI / 2; ar.position.set(0, 0.15, 0.55); g.add(ar);
  g.position.set(x, top, z); W.root.add(g);
  const pad = { was: false };
  W.things.push({ update() {
    r.rotation.z = W.time;
    const on = onPad(x, top, z, 0.9);
    if (on && !pad.was) {
      let any = false;
      for (const b of blocks) if (!b.seated) { resetBlock(b); any = true; }
      Snd.S.reset();
      showToast(any ? 'Crates reset!' : 'All crates are already in place.', 2);
    }
    pad.was = on;
  } });
}
function onPad(x, top, z, half) {
  const local = P.grounded && P.state !== 'dead' && Math.abs(P.pos.x - x) < half && Math.abs(P.pos.z - z) < half && Math.abs(P.pos.y - top) < 0.3;
  return NET.on ? netPad(x, top, z, half, local) : local; // co-op: any player counts, and the host decides
}
function addGate(x, top, z, w, d, h) {
  const g = new THREE.Group();
  const n = Math.max(3, Math.round(w / 0.7));
  const barM = mat(0x5a4f7a, { metalness: 0.4, roughness: 0.4 });
  for (let i = 0; i < n; i++) { const b = new THREE.Mesh(G.cyl8, barM); b.scale.set(0.12, h, 0.12); b.position.x = -w / 2 + (i + 0.5) * (w / n); g.add(b); const tip = new THREE.Mesh(G.cone6, mat(0xffd23f)); tip.scale.set(0.16, 0.35, 0.16); tip.position.set(b.position.x, h / 2 + 0.17, 0); g.add(tip); }
  for (const yy of [-h * 0.3, h * 0.25]) { const c = new THREE.Mesh(G.box, barM); c.scale.set(w, 0.2, 0.2); c.position.y = yy; g.add(c); }
  const lock = M(G.box, 0xffd23f, 0.7, 0.7, 0.3); lock.position.y = 0; g.add(lock);
  shadowy(g, true, false);
  g.position.set(x, top - h / 2, z); W.root.add(g);
  const s = addSolid(x, top - h / 2, z, w / 2, h / 2, d / 2, 'gate', g);
  s.open = () => {
    if (s.opening) return;
    s.opening = true;
    Snd.S.door(); shakeAmt = Math.max(shakeAmt, 0.25);
    const y0 = s.y;
    W.anim.push({ t: 0, f(dt, a) {
      a.t += dt; const k = Math.min(1, a.t / 1.4);
      setSolidPos(s, s.x, y0 - k * (h + 0.3), s.z);
      if (k >= 1) { s.active = false; g.visible = false; return true; }
      return false;
    } });
  };
  return s;
}
function addLockedDoor(x, top, z, w, d, h, kind) {
  const g = new THREE.Group();
  if (kind === 'cage') {
    const barM = mat(0xcfd6e6, { metalness: 0.5, roughness: 0.3 });
    const per = 5;
    for (let side = 0; side < 4; side++) for (let i = 0; i < per; i++) {
      const b = new THREE.Mesh(G.cyl8, barM); b.scale.set(0.07, h, 0.07);
      const t = -0.5 + (i + 0.5) / per;
      if (side < 2) b.position.set(t * w, 0, (side ? 0.5 : -0.5) * d); else b.position.set((side === 2 ? 0.5 : -0.5) * w, 0, t * d);
      g.add(b);
    }
    const topP = M(G.box, 0x5a4f7a, w + 0.2, 0.25, d + 0.2); topP.position.y = h / 2; g.add(topP);
    const botP = M(G.box, 0x5a4f7a, w + 0.2, 0.2, d + 0.2); botP.position.y = -h / 2 + 0.1; g.add(botP);
  } else {
    const door = M(G.box, 0x8a4b20, w, h, d); g.add(door);
    for (const yy of [-h * 0.3, h * 0.3]) { const band = M(G.box, 0x3d335e, w + 0.04, 0.25, d + 0.06); band.position.y = yy; g.add(band); }
    const arch = M(G.box, 0x6b3b1f, 0.12, h, d + 0.08); g.add(arch);
  }
  for (const side of [1, -1]) {
    const lock = M(G.box, 0xffd23f, 0.6, 0.7, 0.2); lock.position.set(0, kind === 'cage' ? 0 : -h * 0.05, side * (d / 2 + 0.12)); g.add(lock);
    const kh = M(G.cyl8, 0x1b1440, 0.09, 0.22, 0.09); kh.rotation.x = Math.PI / 2; kh.position.set(0, lock.position.y, side * (d / 2 + 0.2)); g.add(kh);
    const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 6, 12, Math.PI), mat(0xcfd6e6)); shackle.position.set(0, lock.position.y + 0.35, side * (d / 2 + 0.12)); g.add(shackle);
  }
  shadowy(g, true, true);
  g.position.set(x, top - h / 2, z); W.root.add(g);
  const s = addSolid(x, top - h / 2, z, w / 2, h / 2, d / 2, 'door', g);
  s.lastMsg = -99;
  s.tryOpen = () => {
    if (s.opening) return;
    if (P.hasKey) {
      if (NET.on && !NET.host) { if (W.time - s.lastMsg > 1) { s.lastMsg = W.time; netSend({ t: 'door', k: W.solids.indexOf(s) }); } return; }
      if (NET.on) netBroadcast({ t: 'door', k: W.solids.indexOf(s) });
      s.doOpen();
    } else if (W.time - s.lastMsg > 3) {
      s.lastMsg = W.time;
      Snd.S.bump();
      showToast('<b>LOCKED!</b> Find the golden KEY.', 2.5);
    }
  };
  s.doOpen = () => {
    if (s.opening) return;
    {
      P.hasKey = false; updateHUD(true);
      s.opening = true;
      Snd.S.key(); Snd.S.door();
      showToast('<b>UNLOCKED!</b>', 2);
      burst(x, top - h / 2, z, 0xffd23f, 24, 6, 0.8);
      const y0 = s.y;
      W.anim.push({ t: 0, f(dt, a) {
        a.t += dt; const k = Math.min(1, a.t / 1.2);
        if (kind === 'cage') { setSolidPos(s, s.x, y0 + k * (h + 2), s.z); g.scale.setScalar(1 - k * 0.6); }
        else setSolidPos(s, s.x, y0 - k * (h + 0.2), s.z);
        if (k >= 1) { s.active = false; g.visible = false; return true; }
        return false;
      } });
    }
  };
  W.things.push({ update() {
    if (s.opening || !s.active) return;
    // proximity check so touching it from any side works
    if (Math.abs(P.pos.x - x) < s.hx + P.r + 0.15 && Math.abs(P.pos.z - z) < s.hz + P.r + 0.15 && P.pos.y < s.y + s.hy && P.pos.y + P.h > s.y - s.hy) s.tryOpen();
  } });
  return s;
}
const COLOR_HEX = { red: 0xff3b5c, blue: 0x3b8bff };
function addColorBlock(x, top, z, w, d, color, h) {
  h = h || 0.8;
  const g = new THREE.Group();
  const body = new THREE.Mesh(G.box, mat(COLOR_HEX[color])); body.scale.set(w, h, d); g.add(body);
  const edges = new THREE.LineSegments(G.boxEdges, new THREE.LineBasicMaterial({ color: 0xffffff })); edges.scale.set(w, h, d); g.add(edges);
  g.position.set(x, top - h / 2, z); W.root.add(g);
  const s = addSolid(x, top - h / 2, z, w / 2, h / 2, d / 2, 'color', g);
  s.color = color; s.body = body;
  if (SHADOWS) { body.receiveShadow = true; }
  W.colorBlocks.push(s);
  applyColor(s);
  return s;
}
function applyColor(s) {
  const on = s.color === W.colorState;
  s.active = on;
  s.body.material = on ? mat(COLOR_HEX[s.color]) : mat(COLOR_HEX[s.color], { transparent: true, opacity: 0.22, depthWrite: false });
  if (SHADOWS) s.body.castShadow = on;
  if (on && overlapsBody(P.pos.x, P.pos.y, P.pos.z, P.r, P.h, s)) { P.pos.y = s.y + s.hy; P.vel.y = Math.max(0, P.vel.y); }
}
function addToggleSwitch(x, top, z) {
  const g = new THREE.Group();
  const base = M(G.cyl8, 0x3d335e, 1.0, 0.2, 1.0); base.position.y = 0.1; g.add(base);
  const cap = new THREE.Mesh(G.cyl, mat(COLOR_HEX[W.colorState])); cap.scale.set(0.8, 0.22, 0.8); cap.position.y = 0.28; g.add(cap);
  const ex = M(G.box, 0xffffff, 0.16, 0.05, 0.5); ex.position.set(0, 0.4, -0.08); g.add(ex);
  const dotm = M(G.box, 0xffffff, 0.16, 0.05, 0.14); dotm.position.set(0, 0.4, 0.3); g.add(dotm);
  shadowy(g, true, true);
  g.position.set(x, top, z); W.root.add(g);
  const t = { was: false, cap, press: 0 };
  W.toggles.push(t);
  W.things.push({ update(dt) {
    t.press = Math.max(0, t.press - dt);
    cap.position.y = 0.28 - (t.press > 0 ? 0.12 : 0);
    ex.position.y = dotm.position.y = cap.position.y + 0.12;
    const on = onPad(x, top, z, 1.0);
    if (on && !t.was) { t.press = 0.3; toggleColors(); ringFx(x, top, z, COLOR_HEX[W.colorState], 3); }
    t.was = on;
  } });
  return t;
}
function toggleColors() {
  W.colorState = W.colorState === 'red' ? 'blue' : 'red';
  for (const s of W.colorBlocks) applyColor(s);
  for (const t of W.toggles) t.cap.material = mat(COLOR_HEX[W.colorState]);
  Snd.S.toggle();
  shakeAmt = Math.max(shakeAmt, 0.08);
}

// ---------- Simon memory puzzle ----------
const SIMON_COLORS = [0xff3b5c, 0x3b8bff, 0x59d65a, 0xffd23f];
function addSimon(cfg) {
  const top = cfg.top;
  const pads = cfg.pads.map((p, i) => {
    const g = new THREE.Group();
    const frame = M(G.box, 0x3d335e, 2.7, 0.12, 2.7); frame.position.y = 0.06; g.add(frame);
    const c = new THREE.Color(SIMON_COLORS[i]);
    const dim = mat(c.clone().multiplyScalar(0.55).getHex());
    const lit = mat(SIMON_COLORS[i], { emissive: SIMON_COLORS[i], emissiveIntensity: 0.9 });
    const plate = new THREE.Mesh(G.box, dim); plate.scale.set(2.2, 0.14, 2.2); plate.position.y = 0.12; g.add(plate);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: SIMON_COLORS[i], transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.setScalar(4); glow.position.y = 0.8; g.add(glow);
    shadowy(g, false, true);
    g.position.set(p[0], top, p[1]); W.root.add(g);
    return { x: p[0], z: p[1], plate, dim, lit, glow, was: false, flash: 0 };
  });
  // start pad
  const sg = new THREE.Group();
  const sf = M(G.cyl, 0x3d335e, 1.25, 0.12, 1.25); sf.position.y = 0.06; sg.add(sf);
  const sp = M(G.cyl, 0xffffff, 1.0, 0.16, 1.0); sp.position.y = 0.1; sg.add(sp);
  const tri = M(G.cone, 0x1b1440, 0.35, 0.5, 0.35); tri.rotation.x = Math.PI / 2; tri.position.set(0, 0.22, -0.05); tri.scale.set(0.35, 0.5, 0.06); sg.add(tri);
  sg.position.set(cfg.start[0], top, cfg.start[1]); W.root.add(sg);
  // crystal
  const cx = cfg.crystal[0], cz = cfg.crystal[1];
  addBox(cx, top + 2.4, cz, 1.6, 1.6, 2.4, 'castle');
  const crystal = new THREE.Mesh(G.octa, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x88ccff, emissiveIntensity: 0.6, flatShading: true, roughness: 0.2 }));
  crystal.scale.set(0.8, 1.2, 0.8); crystal.position.set(cx, top + 4.2, cz); W.root.add(crystal);
  const cglow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
  cglow.scale.setScalar(5); cglow.position.copy(crystal.position); W.root.add(cglow);

  const sim = { state: 'idle', seq: [], idx: 0, t: 0, lastStep: -1, startWas: false };
  const rnd = mulberry(NET.on ? NET.seed + 3 : (Date.now() & 0xffff) + 3); // co-op: same sequence on every screen
  do {
    sim.seq = [];
    while (sim.seq.length < (cfg.length || 4)) {
      const n = Math.floor(rnd() * 4);
      if (n !== sim.seq[sim.seq.length - 1]) sim.seq.push(n);
    }
  } while (new Set(sim.seq).size < 3);
  const setCrystal = (hex, k) => { crystal.material.emissive.setHex(hex); crystal.material.emissiveIntensity = k; cglow.material.color.setHex(hex); };
  sim.solve = () => {
    if (sim.state === 'done') return;
    sim.state = 'done';
    Snd.S.solve();
    showToast('<b>PUZZLE SOLVED!</b> A rainbow bridge appears!', 3.5);
    burst(cx, top + 4.2, cz, 0xffffff, 30, 8, 1);
    if (NET.on && NET.host) netBroadcast({ t: 'solve', k: 'simon' });
    if (cfg.onSolve) cfg.onSolve();
  };
  W.things.push({ update(dt) {
    crystal.rotation.y += dt * 1.5;
    crystal.position.y = top + 4.2 + Math.sin(W.time * 2) * 0.15;
    cglow.position.y = crystal.position.y;
    for (const p of pads) {
      p.flash = Math.max(0, p.flash - dt);
      const on = p.flash > 0;
      p.plate.material = on ? p.lit : p.dim;
      p.glow.material.opacity = on ? 0.9 : 0;
    }
    // start pad
    const onStart = onPad(cfg.start[0], top, cfg.start[1], 1.1);
    if (onStart && !sim.startWas && sim.state !== 'done' && sim.state !== 'showing') {
      sim.state = 'showing'; sim.t = -0.5; sim.lastStep = -1;
      Snd.S.click();
      showToast('Watch the crystal&hellip;', 2.5);
    }
    sim.startWas = onStart;
    if (sim.state === 'showing') {
      sim.t += dt;
      const STEP = 0.85;
      const step = Math.floor(sim.t / STEP);
      if (sim.t < 0) setCrystal(0xffffff, 0.3);
      else if (step >= sim.seq.length) {
        sim.state = 'input'; sim.idx = 0;
        showToast('Your turn! Step on the pads in the <b>same order</b>.', 3.5);
      } else {
        const within = sim.t - step * STEP;
        const ci = sim.seq[step];
        if (within < 0.6) {
          setCrystal(SIMON_COLORS[ci], 1.4);
          if (step !== sim.lastStep) { sim.lastStep = step; pads[ci].flash = 0.6; Snd.S.pad(ci); }
        } else setCrystal(0x222244, 0.2);
      }
    } else if (sim.state === 'input') {
      setCrystal(0xffffff, 0.5 + Math.sin(W.time * 6) * 0.3);
    } else if (sim.state === 'done') {
      const h = (W.time * 0.3) % 1;
      const c = new THREE.Color().setHSL(h, 1, 0.6);
      setCrystal(c.getHex(), 1.2);
    } else setCrystal(0x88ccff, 0.6);
    // colored pads
    pads.forEach((p, i) => {
      const on = onPad(p.x, top, p.z, 1.2);
      if (on && !p.was && sim.state === 'input') {
        if (sim.seq[sim.idx] === i) {
          p.flash = 0.45; Snd.S.pad(i); sim.idx++;
          burst(p.x, top + 0.4, p.z, SIMON_COLORS[i], 10, 4, 0.5);
          if (sim.idx >= sim.seq.length) {
            if (NET.on && !NET.host) sim.state = 'wait'; // the host confirms the solve
            else sim.solve();
          }
        } else {
          sim.state = 'idle';
          Snd.S.wrong();
          setCrystal(0xff0000, 2);
          shakeAmt = Math.max(shakeAmt, 0.15);
          showToast('Wrong order! Step on the <b>white pad</b> to watch again.', 3.5);
        }
      }
      p.was = on;
    });
  } });
  return sim;
}
function addAppearBlock(x, top, z, w, d, color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(G.box, mat(color, { transparent: true, opacity: 0.12, depthWrite: false })); body.scale.set(w, 0.7, d); g.add(body);
  const edges = new THREE.LineSegments(G.boxEdges, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 })); edges.scale.set(w, 0.7, d); g.add(edges);
  g.position.set(x, top - 0.35, z); W.root.add(g);
  const s = addSolid(x, top - 0.35, z, w / 2, 0.35, d / 2, 'static', g);
  s.active = false;
  s.appear = (delay) => {
    W.anim.push({ t: -delay, f(dt, a) {
      a.t += dt;
      if (a.t < 0) return false;
      if (!s.active) {
        s.active = true; body.material = mat(color, { emissive: color, emissiveIntensity: 0.25 });
        if (SHADOWS) { body.castShadow = true; body.receiveShadow = true; }
        edges.material.opacity = 1; Snd.S.pad(Math.floor(Math.random() * 5));
        burst(x, top, z, color, 8, 4, 0.5);
      }
      const k = Math.min(1, a.t / 0.25);
      g.scale.setScalar(0.5 + 0.5 * k + Math.sin(k * Math.PI) * 0.2);
      return k >= 1;
    } });
  };
  return s;
}
function addRiser(x, top, z, w, d, h, style, drop) {
  const s = addBox(x, top - drop, z, w, d, h, style, 'riser');
  s.active = false;
  const y0 = s.y;
  s.rise = (delay) => {
    W.anim.push({ t: -delay, f(dt, a) {
      a.t += dt;
      if (a.t < 0) return false;
      if (!s.active) { s.active = true; Snd.S.lava(); }
      const k = Math.min(1, a.t / 1.3);
      const e = 1 - Math.pow(1 - k, 3);
      setSolidPos(s, s.x, y0 + drop * e, s.z);
      if (Math.random() < 0.3) burst(x + (Math.random() - 0.5) * w, W.lavaY || 0, z + (Math.random() - 0.5) * d, 0xff7a1c, 1, 4, 0.6);
      return k >= 1;
    } });
  };
  return s;
}

// ---------- 2.0 puzzle pieces & hazards ----------
STYLE.phantom = { side: 0x9a7aff, top: 0xd6c8ff, cap: 0.1, emissive: 0x3a2a88 };
function letterTex(ch, bg) {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1b1440'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    g.font = 'bold 42px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#1b1440'; g.fillText(ch, w / 2 + 2, h / 2 + 4); g.fillStyle = '#fff'; g.fillText(ch, w / 2, h / 2 + 2);
  });
}
function fadeableMesh(obj) {
  const mats = [];
  obj.traverse((o) => {
    if (!o.isMesh) return;
    o.material = o.material.clone(); o.material.transparent = true; o.material.depthWrite = false;
    mats.push(o.material);
    if (SHADOWS) o.castShadow = false;
  });
  return (a) => { for (const m of mats) m.opacity = a; };
}
// Invisible until you get close: hidden paths to secret stars.
function addSecretBlock(x, top, z, w, d, style) {
  const s = addBox(x, top, z, w, d, 0.6, style || 'crystal');
  s.noCam = true;
  const setA = fadeableMesh(s.mesh);
  let a = 0, seen = false, sparkT = Math.random() * 2;
  setA(0);
  W.things.push({ update(dt) {
    const dx = P.pos.x - x, dz = P.pos.z - z, dy = P.pos.y - top;
    const d2 = dx * dx + dz * dz + dy * dy * 0.5;
    const want = d2 < 4.8 * 4.8 ? 0.9 : 0;
    a = lerp(a, want, damp(6, dt));
    setA(a);
    s.mesh.visible = a > 0.02;
    if (want && !seen) { seen = true; Snd.S.secret(); }
    sparkT -= dt;
    if (sparkT <= 0) { sparkT = 1.6 + Math.random(); if (d2 < 400 && a < 0.1) burst(x + (Math.random() - 0.5) * w, top + 0.2, z + (Math.random() - 0.5) * d, 0xe8f6ff, 1, 1.2, 0.8, -0.5, 1.1); }
  } });
  return s;
}
// Ice crate: one shove and it slides until it hits something.
function addIcePushBlock(x, top, z) {
  const b = addPushBlock(x, top, z);
  b.ice = true; b.slide = null; b.pushT = 0; b.lastPush = -1;
  b.mesh.children[0].material = mat(0xbfefff, { emissive: 0x2a6a8a, transparent: true, opacity: 0.92 });
  const e = new THREE.LineSegments(G.boxEdges, new THREE.LineBasicMaterial({ color: 0xffffff })); e.scale.setScalar(1.82); b.mesh.add(e);
  return b;
}
function slideBlock(b, dt) {
  const ax = b.slide.axis, dir = b.slide.dir, step = 10 * dt;
  if (tryMoveBlock(b, ax, dir * step)) return;
  let moved = 0;
  while (moved < step && tryMoveBlock(b, ax, dir * 0.005)) moved += 0.005;
  b.slide = null;
  Snd.S.thud(); dust(b.x, b.y - b.hy, b.z, 6);
  shakeAmt = Math.max(shakeAmt, 0.08);
}
// Icicles drop when you walk underneath, then grow back.
function addIcicle(x, ceilY, z, groundY) {
  const g = new THREE.Group();
  const c1 = M(G.cone6, mat(0xcff2ff, { emissive: 0x2a6a8a, transparent: true, opacity: 0.9 }), 0.32, 1.5, 0.32); c1.rotation.x = Math.PI; g.add(c1);
  const c2 = M(G.cone6, mat(0xffffff, { emissive: 0x446688 }), 0.16, 0.8, 0.16); c2.rotation.x = Math.PI; c2.position.y = 0.3; g.add(c2);
  const y0 = ceilY - 0.75;
  g.position.set(x, y0, z); W.root.add(g);
  const ic = { state: 'idle', t: 0, y: y0, vy: 0 };
  ic.trigger = () => { if (ic.state === 'idle') { ic.state = 'shake'; ic.t = 0; Snd.S.crack(); } };
  W.icicles.push(ic);
  W.things.push({ update(dt) {
    ic.t += dt;
    if (ic.state === 'idle') {
      if (P.state !== 'dead' && Math.abs(P.pos.x - x) < 1.5 && Math.abs(P.pos.z - z) < 1.5 && P.pos.y < ceilY - 1 && P.pos.y > groundY - 1.5) { ic.trigger(); if (NET.on) netEvent({ t: 'ici', k: W.icicles.indexOf(ic) }); }
    } else if (ic.state === 'shake') {
      g.position.x = x + Math.sin(ic.t * 80) * 0.06;
      if (ic.t > 0.55) { ic.state = 'fall'; ic.t = 0; ic.vy = 0; g.position.x = x; }
    } else if (ic.state === 'fall') {
      ic.vy -= 42 * dt; ic.y += ic.vy * dt; g.position.y = ic.y;
      const tip = ic.y - 0.75;
      if (P.invuln <= 0 && Math.hypot(P.pos.x - x, P.pos.z - z) < 0.3 + P.r && tip < P.pos.y + P.h && ic.y > P.pos.y) hurtPlayer(new V3(x, P.pos.y, z), 'icicle');
      if (tip <= groundY) {
        ic.state = 'gone'; ic.t = 0; g.visible = false;
        Snd.S.shatter(); burst(x, groundY + 0.2, z, 0xcff2ff, 12, 5, 0.5);
      }
    } else if (ic.state === 'gone' && ic.t > 2.6) {
      ic.state = 'grow'; ic.t = 0; ic.y = y0; g.position.set(x, y0, z); g.visible = true; g.scale.setScalar(0.01);
    } else if (ic.state === 'grow') {
      const k = Math.min(1, ic.t / 0.8); g.scale.setScalar(k);
      if (k >= 1) { ic.state = 'idle'; ic.t = 0; }
    }
  } });
  return ic;
}
// Phantom platforms fade in and out on a timer (flicker = about to vanish).
function addPhantom(x, top, z, w, d, on, off, phase) {
  const s = addBox(x, top, z, w, d, 0.5, 'phantom', 'phantom');
  s.noCam = true;
  const setA = fadeableMesh(s.mesh);
  const T = on + off;
  s.on = on; s.T = T; s.ph = phase || 0;
  W.things.push({ update() {
    const t = (((W.time + (phase || 0)) % T) + T) % T;
    const solid = t < on;
    const warn = solid && t > on - 0.75;
    if (solid !== s.active) {
      s.active = solid;
      if (!solid && P.ground === s) { P.ground = null; }
      if (solid && overlapsBody(P.pos.x, P.pos.y, P.pos.z, P.r, P.h, s)) { P.pos.y = s.y + s.hy; P.vel.y = Math.max(0, P.vel.y); }
    }
    setA(!solid ? 0.13 : warn ? (Math.floor(W.time * 14) % 2 ? 0.25 : 0.85) : 0.88);
  } });
  return s;
}
// Ground-pound candles: light them all before they burn out.
function addCandles(cfg) {
  const dur = save.easy ? cfg.duration * 1.6 : cfg.duration;
  const fireM = basic(0xffb030), coreM = basic(0xfff2a0);
  const st = { lit: 0, solved: false, candles: [] };
  for (const sp of cfg.spots) {
    const [x, top, z] = sp;
    const ped = addBox(x, top + 0.6, z, 1.6, 1.6, 0.6, 'manor');
    const g = new THREE.Group();
    const wax = M(G.cyl8, 0xf4ecd8, 0.22, 0.7, 0.22); wax.position.y = 0.35; g.add(wax);
    const drip = M(G.cyl8, 0xffffff, 0.25, 0.08, 0.25); drip.position.y = 0.68; g.add(drip);
    const wick = M(G.cyl8, 0x222222, 0.03, 0.12, 0.03); wick.position.y = 0.76; g.add(wick);
    const flame = new THREE.Group(); flame.position.y = 0.95; g.add(flame);
    const f1 = new THREE.Mesh(G.cone6, fireM); f1.scale.set(0.16, 0.42, 0.16); flame.add(f1);
    const f2 = new THREE.Mesh(G.cone6, coreM); f2.scale.set(0.08, 0.22, 0.08); f2.position.y = -0.05; flame.add(f2);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffa040, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.setScalar(3.2); flame.add(glow);
    flame.visible = false;
    // ring marker so it reads as "pound here"
    const ring = new THREE.Mesh(G.torus, basic(0xffd23f)); ring.rotation.x = Math.PI / 2; ring.scale.set(0.62, 0.62, 1.2); ring.position.y = 0.03; g.add(ring);
    g.position.set(x - 0.45, top + 0.6, z - 0.45); W.root.add(g);
    st.candles.push({ x, z, top: top + 0.6, ped, flame, ring, t: 0 });
  }
  // co-op joiner: the host lights candles; mirror its timers
  st.netApply = (arr) => {
    st.candles.forEach((c, i) => {
      const v = (arr[i] || 0) / 10;
      if (v > 0 && c.t <= 0 && !st.solved) { c.flame.visible = true; Snd.S.candle(); burst(c.x - 0.45, c.top + 1, c.z - 0.45, 0xffb030, 14, 4, 0.6); }
      c.t = v; if (!st.solved) c.flame.visible = v > 0;
    });
  };
  W.things.push({ update(dt) {
    let lit = 0;
    for (const c of st.candles) {
      if (!st.solved && ((P.state === 'poundLand' && P.stateT < 0.02 && P.ground === c.ped && !(NET.on && !NET.host)) || (NET.on && netPounded(c.ped)))) {
        const was = c.t > 0;
        c.t = dur;
        c.flame.visible = true; Snd.S.candle();
        burst(c.x - 0.45, c.top + 1, c.z - 0.45, 0xffb030, 14, 4, 0.6);
        const n = st.candles.filter((k) => k.t > 0).length;
        if (!was && n < st.candles.length) showToast('<b>CANDLE LIT!</b> ' + n + ' / ' + st.candles.length + ' &mdash; light them all before they burn out!', 3);
      }
      if (c.t > 0 && !st.solved) {
        c.t -= dt;
        if (c.t <= 0) { c.t = 0; c.flame.visible = false; Snd.S.candleOut(); burst(c.x - 0.45, c.top + 1, c.z - 0.45, 0x888899, 8, 2, 0.6, -2); showToast('A candle <b>burned out</b>&hellip; be quicker!', 2.5); }
      }
      if (c.t > 0 || st.solved) {
        lit++;
        const k = st.solved ? 1 : 0.45 + 0.55 * (c.t / dur);
        c.flame.scale.setScalar(k * (0.9 + Math.sin(W.time * 18 + c.x) * 0.1));
      }
      c.ring.material = c.t > 0 || st.solved ? basic(0x59d65a) : basic(0xffd23f);
      c.ring.rotation.z = W.time;
    }
    st.lit = lit;
    if (!st.solved && lit === st.candles.length) {
      st.solved = true;
      Snd.S.solve();
      showToast('<b>ALL CANDLES LIT!</b> The manor door creaks open&hellip;', 3.5);
      if (cfg.onAll) cfg.onAll();
    }
  } });
  return st;
}
// Conveyor belts carry whatever stands on them.
const beltCanvas = (() => {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#2b2f38'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#3a404c'; for (let y = 0; y < 64; y += 8) g.fillRect(0, y, 64, 3);
  g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(32, 8); g.lineTo(52, 30); g.lineTo(40, 30); g.lineTo(40, 54); g.lineTo(24, 54); g.lineTo(24, 30); g.lineTo(12, 30); g.closePath(); g.fill();
  return c;
})();
function addConveyor(x, top, z, w, d, vx, vz) {
  const s = addBox(x, top, z, w, d, 0.8, 'metal', 'conveyor');
  s.conv = [vx, vz];
  const sp = Math.hypot(vx, vz);
  const alongX = Math.abs(vx) > Math.abs(vz);
  const along = alongX ? w : d, across = alongX ? d : w;
  const tex = new THREE.CanvasTexture(beltCanvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(Math.max(1, Math.round(across / 2)), Math.max(1, Math.round(along / 2)));
  const belt = new THREE.Mesh(new THREE.PlaneGeometry(across - 0.1, along - 0.1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex }));
  belt.rotation.y = Math.atan2(-vx, -vz);
  belt.position.set(x, top + 0.02, z); W.root.add(belt);
  for (const side of [-1, 1]) { // rollers at both ends
    const r = M(G.cyl8, 0xffd23f, 0.42, alongX ? d + 0.2 : w + 0.2, 0.42);
    if (alongX) { r.rotation.x = Math.PI / 2; r.position.set(x + side * w / 2, top - 0.35, z); } else { r.rotation.z = Math.PI / 2; r.position.set(x, top - 0.35, z + side * d / 2); }
    W.root.add(r);
  }
  W.things.push({ update(dt) { tex.offset.y -= (sp * dt) / (along / tex.repeat.y); } });
  return s;
}
// Spinning gear platforms (the collision square stays put, the gear turns and carries you round).
function addGear(x, top, z, r, speed) {
  const g = new THREE.Group();
  const disk = M(G.cyl, mat(0xc9973a, { emissive: 0x2a1800 }), r, 0.6, r); g.add(disk);
  const face = M(G.cyl, 0xe2b453, r * 0.82, 0.62, r * 0.82); g.add(face);
  const hub = M(G.cyl8, 0x5d6673, r * 0.28, 0.75, r * 0.28); g.add(hub);
  const nT = Math.round(r * 5);
  for (let i = 0; i < nT; i++) {
    const a = (i / nT) * TAU;
    const t = M(G.box, 0xc9973a, 0.5, 0.56, 0.55); t.position.set(Math.cos(a) * (r + 0.2), 0, Math.sin(a) * (r + 0.2)); t.rotation.y = -a; g.add(t);
  }
  for (let i = 0; i < 3; i++) { const sp = M(G.box, 0x9a6a2a, r * 1.5, 0.64, 0.25); sp.rotation.y = (i / 3) * Math.PI; g.add(sp); }
  shadowy(g, true, true);
  g.position.set(x, top - 0.3, z); W.root.add(g);
  const half = r * 0.85;
  const s = addSolid(x, top - 0.3, z, half, 0.3, half, 'gear', null);
  s.spinD = 0;
  W.things.push({ update(dt) { s.spinD = speed * dt; g.rotation.y += speed * dt; } });
  return s;
}
// Pistons punch out on a rhythm (red light = about to fire) and shove you.
function addPiston(x, top, z, w, d, h, axis, dist, period, phase) {
  const housing = addBox(x, top, z, w, d, h, 'metal');
  const dir = Math.sign(dist), ad = Math.abs(dist);
  const hx = axis === 'x' ? 0.3 : w / 2 - 0.05, hz = axis === 'z' ? 0.3 : d / 2 - 0.05;
  const g = new THREE.Group();
  const plate = M(G.box, 0xffd23f, hx * 2, h - 0.2, hz * 2); g.add(plate);
  const stripe = M(G.box, 0x1b1440, axis === 'x' ? hx * 2 + 0.02 : hx * 1.2, 0.25, axis === 'z' ? hz * 2 + 0.02 : hz * 1.2); g.add(stripe);
  const rod = M(G.cyl8, 0xcfd6e6, 0.18, 1, 0.18); if (axis === 'x') rod.rotation.z = Math.PI / 2; else rod.rotation.x = Math.PI / 2; g.add(rod);
  W.root.add(g);
  const lamp = new THREE.Mesh(G.sphereLo, basic(0x441111)); lamp.scale.setScalar(0.22); lamp.position.set(x, top + 0.25, z); W.root.add(lamp);
  const bx = axis === 'x' ? x + dir * (w / 2 + hx) : x, bz = axis === 'z' ? z + dir * (d / 2 + hz) : z;
  const s = addSolid(bx, top - h / 2 + 0.1, bz, hx, (h - 0.2) / 2, hz, 'mover', g);
  g.position.set(bx, s.y, bz);
  let last = 0;
  W.things.push({ update() {
    const u = (((W.time / period + (phase || 0)) % 1) + 1) % 1;
    const ext = u < 0.1 ? u / 0.1 : u < 0.45 ? 1 : u < 0.8 ? 1 - (u - 0.45) / 0.35 : 0;
    lamp.material = u > 0.82 || u < 0.1 ? basic(Math.floor(W.time * 12) % 2 ? 0xff2222 : 0x661111) : basic(0x441111);
    const off = ext * ad * dir;
    const nx = axis === 'x' ? bx + off : bx, nz = axis === 'z' ? bz + off : bz;
    setSolidPos(s, nx, s.y, nz);
    const L = ext * ad + 0.01;
    rod.scale.y = L; rod.position.set(axis === 'x' ? -dir * L / 2 : 0, 0, axis === 'z' ? -dir * L / 2 : 0);
    // shove: extending into the player knocks them along the axis
    if (ext > last + 1e-4 && P.state !== 'dead' && !P.frozen) {
      const ox = Math.abs(P.pos.x - s.x) < s.hx + P.r + 0.05, oz = Math.abs(P.pos.z - s.z) < s.hz + P.r + 0.05, oy = P.pos.y < s.y + s.hy && P.pos.y + P.h > s.y - s.hy;
      if (ox && oz && oy) {
        P.vel[axis] = dir * 7.5; P.vel.y = Math.max(P.vel.y, 5); P.grounded = false; P.ground = null;
        if (P.state === 'normal' || P.state === 'spin') { P.state = 'hurt'; P.stateT = 0.5; }
        Snd.S.bump(); shakeAmt = Math.max(shakeAmt, 0.15);
      }
    }
    last = ext;
  } });
  void housing;
  return s;
}
// Lever puzzle: each lever flips some of the lamps. Light all of them to open the way.
function addLeverPuzzle(cfg) {
  const top = cfg.top;
  const state = cfg.init.slice();
  const lamps = cfg.lamps.map((lp) => {
    const g = new THREE.Group();
    const post = M(G.cyl8, 0x5d6673, 0.16, lp[3] || 3, 0.16); post.position.y = (lp[3] || 3) / 2; g.add(post);
    const cage = M(G.cyl8, 0x2b2f38, 0.5, 0.2, 0.5); cage.position.y = (lp[3] || 3); g.add(cage);
    const bulb = new THREE.Mesh(G.sphereLo, basic(0x333344)); bulb.scale.setScalar(0.55); bulb.position.y = (lp[3] || 3) + 0.55; g.add(bulb);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffe14a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.setScalar(4); glow.position.copy(bulb.position); g.add(glow);
    g.position.set(lp[0], lp[1], lp[2]); W.root.add(g);
    return { bulb, glow };
  });
  const paint = () => lamps.forEach((l, i) => { l.bulb.material = state[i] ? basic(0xffe14a) : basic(0x333344); l.glow.material.opacity = state[i] ? 0.9 : 0; });
  paint();
  const pz = { solved: false, state, presses: 0 };
  pz.netSet = (arr, solved) => { // co-op joiner: host's lamp state wins
    let ch = false;
    for (let i = 0; i < state.length; i++) if (state[i] !== arr[i]) { state[i] = arr[i]; ch = true; }
    if (ch) paint();
    if (solved && !pz.solved) {
      pz.solved = true; Snd.S.solve();
      showToast(cfg.msg || '<b>ALL LIGHTS ON!</b> The factory gate rumbles open!', 3.5);
      if (cfg.onSolve) cfg.onSolve();
    }
  };
  cfg.levers.forEach((lv, li) => {
    const [x, z, flips, label] = lv;
    const g = new THREE.Group();
    const base = M(G.box, 0x2b2f38, 2.2, 0.2, 2.2); base.position.y = 0.1; g.add(base);
    const plate = new THREE.Mesh(G.box, [mat(0x5d6673), mat(0x5d6673), mat(0xffffff, { map: letterTex(label, '#ff9d2e') }), mat(0x5d6673), mat(0x5d6673), mat(0x5d6673)]);
    plate.scale.set(1.8, 0.14, 1.8); plate.position.y = 0.22; g.add(plate);
    const arm = new THREE.Group(); arm.position.set(0, 0.25, -0.8); g.add(arm);
    const stick = M(G.cyl8, 0xcfd6e6, 0.07, 1.1, 0.07); stick.position.y = 0.55; arm.add(stick);
    const knob = M(G.sphereLo, 0xff3b3b, 0.18); knob.position.y = 1.1; arm.add(knob);
    arm.rotation.x = 0.5;
    shadowy(g, true, true);
    g.position.set(x, top, z); W.root.add(g);
    const L = { was: false, up: false };
    W.things.push({ update() {
      const on = onPad(x, top, z, 1.05);
      if (on && !L.was && !pz.solved) {
        L.up = !L.up; arm.rotation.x = L.up ? -0.5 : 0.5;
        for (const f of flips) state[f] = state[f] ? 0 : 1;
        pz.presses++;
        paint(); Snd.S.lever(); ringFx(x, top, z, 0xffd23f, 2.5);
        if (state.every(Boolean)) {
          pz.solved = true; Snd.S.solve();
          showToast(cfg.msg || '<b>ALL LIGHTS ON!</b> The factory gate rumbles open!', 3.5);
          if (cfg.onSolve) cfg.onSolve();
        } else showToast('Lights on: <b>' + state.filter(Boolean).length + ' / ' + state.length + '</b>', 1.6);
      }
      L.was = on;
    } });
  });
  return pz;
}

// ---------- 2.0 enemy models ----------
function buildSnowman() {
  const g = new THREE.Group(); const b = new THREE.Group(); g.add(b);
  const snowM = mat(0xffffff, { emissive: 0x334455 });
  const s1 = new THREE.Mesh(G.sphereLo, snowM); s1.scale.setScalar(0.72); s1.position.y = 0.66; b.add(s1);
  const s2 = new THREE.Mesh(G.sphereLo, snowM); s2.scale.setScalar(0.52); s2.position.y = 1.55; b.add(s2);
  const head = new THREE.Group(); head.position.y = 2.2; b.add(head);
  const s3 = new THREE.Mesh(G.sphereLo, snowM); s3.scale.setScalar(0.4); head.add(s3);
  const nose = M(G.cone6, 0xff8a1c, 0.08, 0.4, 0.08); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0, 0.5); head.add(nose);
  const eL = M(G.sphereLo, 0x1b1440, 0.06); eL.position.set(-0.14, 0.1, 0.35); head.add(eL);
  const eR = eL.clone(); eR.position.x = 0.14; head.add(eR);
  const brow = M(G.box, 0x1b1440, 0.42, 0.06, 0.05); brow.position.set(0, 0.24, 0.36); brow.rotation.z = 0.12; head.add(brow);
  const hat = M(G.cyl8, 0x2a2344, 0.3, 0.38, 0.3); hat.position.y = 0.45; head.add(hat);
  const brim = M(G.cyl8, 0x2a2344, 0.45, 0.06, 0.45); brim.position.y = 0.27; head.add(brim);
  const band = M(G.cyl8, 0xff3b5c, 0.31, 0.08, 0.31); band.position.y = 0.33; head.add(band);
  const scarf = M(G.cyl8, 0xff3b5c, 0.42, 0.14, 0.42); scarf.position.y = 1.92; b.add(scarf);
  for (let i = 0; i < 3; i++) { const btn = M(G.sphereLo, 0x1b1440, 0.05); btn.position.set(0, 1.4 + i * 0.16, 0.5 - Math.abs(i - 1) * 0.02); b.add(btn); }
  const mkArm = (side) => { const a = new THREE.Group(); a.position.set(side * 0.45, 1.6, 0); const st = M(G.cyl8, 0x6b3b1f, 0.04, 0.8, 0.04); st.position.y = 0.4; a.add(st); a.rotation.z = -side * 1.0; b.add(a); return a; };
  const armL = mkArm(-1), armR = mkArm(1);
  const ball = new THREE.Mesh(G.sphereLo, snowM); ball.scale.setScalar(0.25); ball.position.y = 0.85; armR.add(ball);
  shadowy(g, true, false);
  return { root: g, body: b, head, armL, armR, ball };
}
function buildPenguin() {
  const g = new THREE.Group(); const b = new THREE.Group(); g.add(b);
  const body = M(G.sphereLo, 0x22263a, 0.5, 0.62, 0.46); body.position.y = 0.62; b.add(body);
  const belly = M(G.sphereLo, 0xffffff, 0.38, 0.5, 0.3); belly.position.set(0, 0.56, 0.2); b.add(belly);
  const beak = M(G.cone6, 0xffa020, 0.1, 0.26, 0.1); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.9, 0.48); b.add(beak);
  eyesOn(b, 1.02, 0.36, 0.13, 0.08, true);
  const fL = M(G.sphereLo, 0x22263a, 0.1, 0.35, 0.18); fL.position.set(-0.5, 0.62, 0); fL.rotation.z = 0.4; b.add(fL);
  const fR = fL.clone(); fR.position.x = 0.5; fR.rotation.z = -0.4; b.add(fR);
  const ftL = M(G.sphereLo, 0xffa020, 0.14, 0.06, 0.2); ftL.position.set(-0.18, 0.04, 0.12); b.add(ftL);
  const ftR = ftL.clone(); ftR.position.x = 0.18; b.add(ftR);
  const hat = M(G.cone6, 0x38b6ff, 0.22, 0.4, 0.22); hat.position.y = 1.32; b.add(hat);
  const pom = M(G.sphereLo, 0xffffff, 0.09); pom.position.y = 1.55; b.add(pom);
  shadowy(g, true, false);
  return { root: g, body: b, fL, fR };
}
function buildGhost() {
  const g = new THREE.Group(); const b = new THREE.Group(); g.add(b);
  const gm = new THREE.MeshLambertMaterial({ color: 0xf4f0ff, emissive: 0x6a5a9a, transparent: true, opacity: 0.88 });
  const head = new THREE.Mesh(G.sphere, gm); head.scale.set(0.62, 0.6, 0.6); head.position.y = 0.85; b.add(head);
  const tail = new THREE.Mesh(G.cone, gm); tail.scale.set(0.5, 0.7, 0.5); tail.rotation.x = Math.PI; tail.position.y = 0.3; b.add(tail);
  const eyeM = basic(0x1b1440);
  const eL = new THREE.Mesh(G.sphere, eyeM); eL.scale.set(0.09, 0.15, 0.05); eL.position.set(-0.18, 0.95, 0.54); b.add(eL);
  const eR = eL.clone(); eR.position.x = 0.18; b.add(eR);
  const mouth = new THREE.Mesh(G.sphere, basic(0x7a1030)); mouth.scale.set(0.16, 0.12, 0.05); mouth.position.set(0, 0.68, 0.56); b.add(mouth);
  const tongue = new THREE.Mesh(G.sphere, basic(0xff6b9a)); tongue.scale.set(0.08, 0.06, 0.04); tongue.position.set(0.03, 0.63, 0.6); b.add(tongue);
  const armL = new THREE.Mesh(G.sphereLo, gm); armL.scale.set(0.16, 0.22, 0.16); armL.position.set(-0.6, 0.75, 0.15); b.add(armL);
  const armR = armL.clone(); armR.position.x = 0.6; b.add(armR);
  return { root: g, body: b, armL, armR, mat: gm, mouth, tongue };
}
function buildRobot() {
  const g = new THREE.Group(); const b = new THREE.Group(); g.add(b);
  const body = M(G.box, 0x8a94a3, 0.95, 0.75, 0.8); body.position.y = 0.6; b.add(body);
  const stripe = M(G.box, 0xffd23f, 0.97, 0.16, 0.82); stripe.position.y = 0.45; b.add(stripe);
  const head = M(G.box, 0x5d6673, 0.7, 0.42, 0.6); head.position.y = 1.18; b.add(head);
  const visor = new THREE.Mesh(G.box, basic(0x38e0ff)); visor.scale.set(0.55, 0.14, 0.05); visor.position.set(0, 1.2, 0.31); b.add(visor);
  const ant = M(G.cyl8, 0xcfd6e6, 0.03, 0.4, 0.03); ant.position.y = 1.58; b.add(ant);
  const bulb = new THREE.Mesh(G.sphereLo, basic(0xff3355)); bulb.scale.setScalar(0.1); bulb.position.y = 1.8; b.add(bulb);
  const wheelL = M(G.cyl8, 0x2b2f38, 0.24, 0.16, 0.24); wheelL.rotation.z = Math.PI / 2; wheelL.position.set(-0.5, 0.24, 0); b.add(wheelL);
  const wheelR = wheelL.clone(); wheelR.position.x = 0.5; b.add(wheelR);
  const spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0x55ddff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  spark.scale.setScalar(2.6); spark.position.y = 0.9; b.add(spark);
  shadowy(g, true, false);
  return { root: g, body: b, bulb, spark, wheelL, wheelR, visor };
}
function addSnowman(x, top, z) { return makeEnemy('snowman', x, top, z, buildSnowman(), { r: 0.7, h: 2.3, cool: 2 + Math.random() * 1.5 }); }
function addPenguin(x, top, z) { return makeEnemy('penguin', x, top, z, buildPenguin(), { r: 0.55, h: 1.15, pmode: 'walk', pt: 0, cd: 1 }); }
function addGhost(x, y, z) {
  const e = makeEnemy('ghost', x, y, z, buildGhost(), { r: 0.6, h: 1.3, stompable: false, alpha: 0.88 });
  const blob = new THREE.Mesh(G.circle, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
  blob.scale.setScalar(0.5); W.root.add(blob); e.blob = blob;
  return e;
}
function addRobot(x, top, z, x2, z2, ph) { return makeEnemy('robot', x, top, z, buildRobot(), { r: 0.6, h: 1.4, a: new V3(x, top, z), b: new V3(x2, top, z2), toB: true, ph: ph || 0, sparking: false }); }

// ---------- hazards ----------
function playerSegDist(px, py, pz) {
  const cy = clamp(py, P.pos.y + 0.35, P.pos.y + 1.15);
  const dx = px - P.pos.x, dy = py - cy, dz = pz - P.pos.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
function addFirebar(x, y, z, n, speed, phase) {
  const balls = [];
  const fm = basic(0xff7a1c), fm2 = basic(0xffe14a);
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group();
    const b = new THREE.Mesh(G.ico, fm); b.scale.setScalar(0.34); g.add(b);
    const c = new THREE.Mesh(G.ico, fm2); c.scale.setScalar(0.2); g.add(c);
    W.root.add(g); balls.push(g);
  }
  W.things.push({ update() {
    const a = (phase || 0) + W.time * speed;
    const ca = Math.cos(a), sa = Math.sin(a);
    for (let i = 0; i < n; i++) {
      const d = 0.9 + i * 0.78;
      const bx = x + ca * d, bz = z + sa * d;
      balls[i].position.set(bx, y, bz);
      balls[i].rotation.y = W.time * 8 + i;
      if (P.invuln <= 0 && playerSegDist(bx, y, bz) < 0.34 + P.r + 0.05) hurtPlayer(new V3(x, y, z), 'fire');
    }
  } });
}
function addLog(x, top, z, len, speed) {
  addBox(x, top + 1.1, z, 1.1, 1.1, 1.1, 'stone');
  const g = new THREE.Group();
  const log = M(G.cyl8, 0x8a5a2b, 0.3, len, 0.3); log.rotation.z = Math.PI / 2; g.add(log);
  for (const s of [-1, 1]) { const cap = M(G.cyl8, 0xe0b27a, 0.31, 0.06, 0.31); cap.rotation.z = Math.PI / 2; cap.position.x = s * len / 2; g.add(cap); }
  const bandM = mat(0xff4d4d);
  for (let i = -2; i <= 2; i++) { if (!i) continue; const band = new THREE.Mesh(G.cyl8, bandM); band.scale.set(0.32, 0.18, 0.32); band.rotation.z = Math.PI / 2; band.position.x = i * len / 6; g.add(band); }
  shadowy(g, true, false);
  const ly = top + 0.55;
  g.position.set(x, ly, z); W.root.add(g);
  W.things.push({ update() {
    const a = W.time * speed;
    g.rotation.y = -a;
    const ux = Math.cos(a), uz = Math.sin(a);
    const px = P.pos.x - x, pz = P.pos.z - z;
    const t = clamp(px * ux + pz * uz, -len / 2, len / 2);
    const cx = ux * t - px, cz = uz * t - pz;
    const d = Math.sqrt(cx * cx + cz * cz);
    if (P.invuln <= 0 && d < 0.3 + P.r && P.pos.y < ly + 0.3 && P.pos.y + P.h > ly - 0.3) hurtPlayer(new V3(x + ux * t, ly, z + uz * t), 'log');
  } });
}
function addThwomp(x, groundTop, z, restH) {
  const w = 2.4, h = 2.2;
  const g = new THREE.Group();
  const body = M(G.box, 0x8f8aa8, w, h, w); g.add(body);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const sp = M(G.cone6, 0xdad4c8, 0.22, 0.4, 0.22); sp.position.set(sx * w / 2, -h / 2 + 0.2, sz * w / 2); sp.rotation.x = Math.PI; g.add(sp); }
  const face = new THREE.Group(); face.position.z = w / 2 + 0.01; g.add(face);
  const eL = M(G.box, 0xffffff, 0.5, 0.42, 0.05); eL.position.set(-0.5, 0.25, 0); face.add(eL);
  const eR = eL.clone(); eR.position.x = 0.5; face.add(eR);
  const pL = M(G.box, 0x1b1440, 0.2, 0.22, 0.07); pL.position.set(-0.45, 0.2, 0.01); face.add(pL);
  const pR = pL.clone(); pR.position.x = 0.45; face.add(pR);
  const bL = M(G.box, 0x1b1440, 0.6, 0.12, 0.08); bL.position.set(-0.5, 0.55, 0.01); bL.rotation.z = -0.4; face.add(bL);
  const bR = bL.clone(); bR.position.x = 0.5; bR.rotation.z = 0.4; face.add(bR);
  const mouth = M(G.box, 0x1b1440, 1.2, 0.3, 0.06); mouth.position.set(0, -0.45, 0); face.add(mouth);
  for (let i = 0; i < 4; i++) { const tt = M(G.box, 0xffffff, 0.2, 0.14, 0.07); tt.position.set(-0.45 + i * 0.3, -0.37, 0.01); face.add(tt); }
  shadowy(g, true, true);
  const downY = groundTop + h / 2, upY = groundTop + restH + h / 2;
  g.position.set(x, upY, z); W.root.add(g);
  const s = addSolid(x, upY, z, w / 2, h / 2, w / 2, 'crusher', g);
  s.state = 'up'; s.t = 0; s.vy = 0;
  s.trigger = () => { if (s.state === 'up') { s.state = 'fall'; s.vy = 0; s.t = 0; } };
  W.things.push({ update(dt) {
    s.t += dt;
    if (s.state === 'up') {
      pL.position.x = -0.45 + clamp(P.pos.x - x, -1, 1) * 0.06;
      pR.position.x = 0.45 + clamp(P.pos.x - x, -1, 1) * 0.06;
      if (s.t > 0.4 && Math.abs(P.pos.x - x) < w / 2 + 0.6 && Math.abs(P.pos.z - z) < w / 2 + 0.6 && P.pos.y + P.h < s.y - s.hy + 0.2 && P.pos.y > groundTop - 3) {
        s.state = 'fall'; s.vy = 0; s.t = 0;
        if (NET.on) netEvent({ t: 'thw', k: W.solids.indexOf(s) });
      }
    } else if (s.state === 'fall') {
      s.vy -= 80 * dt;
      let ny = s.y + s.vy * dt;
      if (ny <= downY) {
        ny = downY; s.state = 'down'; s.t = 0;
        Snd.S.thud();
        const d = Math.hypot(P.pos.x - x, P.pos.z - z);
        shakeAmt = Math.max(shakeAmt, d < 12 ? 0.35 : 0.1);
        dust(x - w / 2, groundTop, z, 5); dust(x + w / 2, groundTop, z, 5); dust(x, groundTop, z + w / 2, 5); dust(x, groundTop, z - w / 2, 5);
      }
      setSolidPos(s, x, ny, z);
    } else if (s.state === 'down') {
      if (s.t > 1.1) { s.state = 'rise'; s.t = 0; }
    } else if (s.state === 'rise') {
      let ny = s.y + 3.2 * dt;
      if (ny >= upY) { ny = upY; s.state = 'up'; s.t = 0; }
      setSolidPos(s, x, ny, z);
    }
  } });
  return s;
}

// ---------- enemies ----------
function makeEnemy(type, x, y, z, model, opts) {
  const e = Object.assign({ type, pos: new V3(x, y, z), vy: 0, r: 0.55, h: 1.0, alive: true, dying: -1, model, dir: Math.random() * TAU, t: Math.random() * 3,
    grounded: false, ground: null, stompable: true, spinnable: true, home: new V3(x, y, z), nextTurn: 2, alert: 0, id: W.enemySeq++ }, opts || {});
  model.root.position.copy(e.pos);
  W.root.add(model.root);
  W.enemies.push(e);
  return e;
}
function addWalker(x, top, z) { return makeEnemy('walker', x, top, z, buildWalker(), { r: 0.55, h: 1.05 }); }
function addSpiky(x, top, z, x2, z2) { return makeEnemy('spiky', x, top, z, buildSpiky(), { r: 0.62, h: 1.1, stompable: false, spinnable: false, a: new V3(x, top, z), b: new V3(x2, top, z2), toB: true }); }
function addBee(x, y, z) {
  const e = makeEnemy('bee', x, y, z, buildBee(), { r: 0.5, h: 0.95 });
  const blob = new THREE.Mesh(G.circle, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }));
  blob.scale.setScalar(0.45); W.root.add(blob); e.blob = blob;
  return e;
}
function addTurret(x, top, z) { return makeEnemy('turret', x, top, z, buildTurret(), { r: 0.65, h: 1.35, cool: 2 + Math.random() }); }

function enemyMove(e, dx, dz, dt) {
  let blocked = false;
  if (e.ground && e.ground.active && (e.ground.dx || e.ground.dy || e.ground.dz)) { e.pos.x += e.ground.dx; e.pos.y += e.ground.dy; e.pos.z += e.ground.dz; }
  const moves = [['x', dx], ['z', dz]];
  for (const mv of moves) {
    const axis = mv[0], amt = mv[1];
    if (!amt) continue;
    e.pos[axis] += amt;
    for (const s of W.solids) {
      if (!s.active || !overlapsBody(e.pos.x, e.pos.y + 0.05, e.pos.z, e.r, e.h, s)) continue;
      e.pos[axis] -= amt; blocked = true; break;
    }
  }
  e.vy = Math.max(e.vy - 40 * dt, -30);
  e.pos.y += e.vy * dt;
  e.grounded = false; e.ground = null;
  for (const s of W.solids) {
    if (!s.active || !overlapsBody(e.pos.x, e.pos.y, e.pos.z, e.r, e.h, s)) continue;
    const prevY = e.pos.y - e.vy * dt;
    if (e.vy <= 0) { if (prevY < s.y + s.hy - 0.05) continue; e.pos.y = s.y + s.hy; e.vy = 0; e.grounded = true; e.ground = s; }
    else { e.pos.y = s.y - s.hy - e.h; e.vy = 0; }
  }
  return blocked;
}
function groundAhead(e, dx, dz) {
  const ax = e.pos.x + dx * (e.r + 0.3), az = e.pos.z + dz * (e.r + 0.3);
  const top = groundTopAt(ax, az, e.pos.y + 0.4);
  return top > e.pos.y - 1.1;
}
function updateEnemies(dt) {
  if (NET.on && !NET.host) { netPuppetEnemies(dt); return; } // co-op joiner: enemies are driven by the host
  for (let i = W.enemies.length - 1; i >= 0; i--) {
    const e = W.enemies[i];
    const m = e.model;
    if (!e.alive) {
      e.dying -= dt;
      if (e.deathKind === 'spin') { e.vy -= 30 * dt; e.pos.y += e.vy * dt; e.pos.x += e.kx * dt; e.pos.z += e.kz * dt; m.root.rotation.x += dt * 14; }
      m.root.position.copy(e.pos);
      if (e.dying <= 0) { W.root.remove(m.root); if (e.blob) W.root.remove(e.blob); W.enemies.splice(i, 1); }
      continue;
    }
    e.t += dt;
    const TG = NET.on ? netTarget(e) : P; // co-op: chase / shoot at the nearest player
    const dxp = TG.pos.x - e.pos.x, dzp = TG.pos.z - e.pos.z, dyp = TG.pos.y - e.pos.y;
    const distP = Math.hypot(dxp, dzp);
    const playerOk = TG.state !== 'dead' && TG.state !== 'win' && !TG.frozen;
    if (e.type === 'walker') {
      const chase = playerOk && distP < 8 && Math.abs(dyp) < 2.2 && e.pos.distanceTo(e.home) < 14;
      let speed;
      if (chase) {
        if (!e.alert) { e.alert = 1; e.vy = 5; Snd.S.bump(); }
        e.dir = angleLerp(e.dir, Math.atan2(dxp, dzp), Math.min(1, dt * 5));
        speed = 3.0;
      } else {
        e.alert = 0; speed = 1.5;
        if (e.t > e.nextTurn) { e.dir += (Math.random() - 0.5) * 2.6; e.nextTurn = e.t + 1.5 + Math.random() * 2.5; }
        const hx = e.home.x - e.pos.x, hz = e.home.z - e.pos.z;
        if (hx * hx + hz * hz > 36) e.dir = angleLerp(e.dir, Math.atan2(hx, hz), Math.min(1, dt * 3));
      }
      const ux = Math.sin(e.dir), uz = Math.cos(e.dir);
      if (e.grounded && !groundAhead(e, ux, uz)) {
        if (!chase) e.dir += Math.PI;
        enemyMove(e, 0, 0, dt);
      } else if (enemyMove(e, ux * speed * dt, uz * speed * dt, dt) && !chase) e.dir += Math.PI * (0.6 + Math.random() * 0.8);
      m.root.rotation.y = e.dir;
      m.body.rotation.z = Math.sin(e.t * (chase ? 16 : 9)) * 0.12;
      m.fL.position.z = 0.05 + Math.sin(e.t * (chase ? 16 : 9)) * 0.15;
      m.fR.position.z = 0.05 - Math.sin(e.t * (chase ? 16 : 9)) * 0.15;
    } else if (e.type === 'spiky') {
      const tgt = e.toB ? e.b : e.a;
      const tx = tgt.x - e.pos.x, tz = tgt.z - e.pos.z;
      const td = Math.hypot(tx, tz);
      if (td < 0.3) e.toB = !e.toB;
      else {
        const ux = tx / td, uz = tz / td;
        e.dir = angleLerp(e.dir, Math.atan2(ux, uz), Math.min(1, dt * 6));
        if (e.grounded && !groundAhead(e, ux, uz)) { e.toB = !e.toB; enemyMove(e, 0, 0, dt); }
        else if (enemyMove(e, ux * 2.3 * dt, uz * 2.3 * dt, dt)) e.toB = !e.toB;
      }
      m.root.rotation.y = e.dir;
      m.body.position.y = Math.abs(Math.sin(e.t * 8)) * 0.1;
      m.body.rotation.z = Math.sin(e.t * 8) * 0.08;
    } else if (e.type === 'bee') {
      const hx = TG.pos.x - e.home.x, hz = TG.pos.z - e.home.z;
      const chase = playerOk && Math.hypot(hx, hz) < 11 && distP < 13 && Math.abs(dyp) < 8;
      const tx = chase ? TG.pos.x : e.home.x + Math.sin(e.t * 0.8) * 2;
      const ty = chase ? TG.pos.y + 0.35 : e.home.y + Math.sin(e.t * 2) * 0.4;
      const tz = chase ? TG.pos.z : e.home.z + Math.cos(e.t * 0.8) * 2;
      const vx = tx - e.pos.x, vy = ty - e.pos.y, vz = tz - e.pos.z;
      const vd = Math.hypot(vx, vy, vz) || 1;
      const sp = Math.min(chase ? 3.4 : 3, vd * 3);
      e.pos.x += (vx / vd) * sp * dt; e.pos.y += (vy / vd) * sp * dt; e.pos.z += (vz / vd) * sp * dt;
      if (Math.hypot(vx, vz) > 0.1) e.dir = angleLerp(e.dir, Math.atan2(vx, vz), Math.min(1, dt * 6));
      m.root.rotation.y = e.dir;
      m.wL.rotation.z = Math.sin(e.t * 50) * 0.6; m.wR.rotation.z = -Math.sin(e.t * 50) * 0.6;
      m.body.position.y = Math.sin(e.t * 5) * 0.08;
      const gt = groundTopAt(e.pos.x, e.pos.z, e.pos.y);
      if (gt > -Infinity) { e.blob.visible = true; e.blob.position.set(e.pos.x, gt + 0.03, e.pos.z); } else e.blob.visible = false;
    } else if (e.type === 'turret') {
      m.head.rotation.y = angleLerp(m.head.rotation.y, Math.atan2(dxp, dzp), Math.min(1, dt * 4));
      const inRange = playerOk && distP < 17 && Math.abs(dyp) < 9;
      if (inRange) {
        e.cool -= dt;
        const tele = e.cool < 0.55;
        m.eye.scale.setScalar(tele ? 0.16 + Math.sin(e.t * 40) * 0.05 : 0.12);
        m.head.scale.setScalar(tele ? 1.1 : 1);
        if (e.cool <= 0) {
          e.cool = 3.3;
          const a = m.head.rotation.y;
          const mx = e.pos.x + Math.sin(a) * 0.95, my = e.pos.y + 0.9, mz = e.pos.z + Math.cos(a) * 0.95;
          const d = new V3(TG.pos.x - mx, TG.pos.y + 0.8 - my, TG.pos.z - mz).normalize();
          fireProjectile(mx, my, mz, d, save.easy ? 6 : 7.2);
          m.head.position.z = -0.15;
        }
      } else { m.head.scale.setScalar(1); m.eye.scale.setScalar(0.12); }
      m.head.position.z = lerp(m.head.position.z, 0, dt * 6);
    } else if (e.type === 'snowman') {
      enemyMove(e, 0, 0, dt);
      e.dir = angleLerp(e.dir, Math.atan2(dxp, dzp), Math.min(1, dt * 3));
      m.root.rotation.y = e.dir;
      m.body.rotation.z = Math.sin(e.t * 2) * 0.04;
      const inRange = playerOk && distP < 15 && Math.abs(dyp) < 8;
      if (inRange) {
        e.cool -= dt;
        const tele = e.cool < 0.65;
        m.armR.rotation.x = tele ? -2.4 : 0; m.ball.visible = true;
        if (e.cool <= 0) {
          e.cool = save.easy ? 4.4 : 3.5;
          const mx = e.pos.x + Math.sin(e.dir) * 0.5, my = e.pos.y + 2.3, mz = e.pos.z + Math.cos(e.dir) * 0.5;
          const tx = TG.pos.x + TG.vel.x * 0.3 - mx, tz = TG.pos.z + TG.vel.z * 0.3 - mz, ty = TG.pos.y + 0.8 - my;
          const hd = Math.hypot(tx, tz), T = clamp(hd / 8, 0.45, 2.0), GR = 14;
          const v = new V3(tx / T, (ty + 0.5 * GR * T * T) / T, tz / T);
          const sp = v.length();
          fireProjectile(mx, my, mz, v.normalize(), sp, { kind: 'snow', grav: GR });
          m.armR.rotation.x = 0.8;
        }
      } else { m.armR.rotation.x = lerp(m.armR.rotation.x, 0, dt * 4); }
    } else if (e.type === 'penguin') {
      e.pt += dt; e.cd -= dt;
      if (e.pmode === 'walk') {
        if (e.t > e.nextTurn) { e.dir += (Math.random() - 0.5) * 2.6; e.nextTurn = e.t + 1.5 + Math.random() * 2; }
        const hx = e.home.x - e.pos.x, hz = e.home.z - e.pos.z;
        if (hx * hx + hz * hz > 16) e.dir = angleLerp(e.dir, Math.atan2(hx, hz), Math.min(1, dt * 3));
        const ux = Math.sin(e.dir), uz = Math.cos(e.dir);
        if (e.grounded && !groundAhead(e, ux, uz)) { e.dir += Math.PI; enemyMove(e, 0, 0, dt); }
        else if (enemyMove(e, ux * 1.3 * dt, uz * 1.3 * dt, dt)) e.dir += Math.PI * 0.8;
        m.body.rotation.set(0, 0, Math.sin(e.t * 10) * 0.15); m.body.position.y = 0;
        m.fL.rotation.z = 0.4 + Math.sin(e.t * 10) * 0.3; m.fR.rotation.z = -0.4 - Math.sin(e.t * 10) * 0.3;
        if (playerOk && e.cd <= 0 && distP < 9 && Math.abs(dyp) < 1.3) { e.pmode = 'aim'; e.pt = 0; e.dir = Math.atan2(dxp, dzp); Snd.S.bump(); e.vy = 4; }
      } else if (e.pmode === 'aim') {
        enemyMove(e, 0, 0, dt);
        e.dir = angleLerp(e.dir, Math.atan2(dxp, dzp), Math.min(1, dt * 8));
        m.body.rotation.set(-0.3, 0, 0);
        if (e.pt > 0.45) { e.pmode = 'slide'; e.pt = 0; Snd.S.slide(); }
      } else if (e.pmode === 'slide') {
        const ux = Math.sin(e.dir), uz = Math.cos(e.dir), sp = save.easy ? 6 : 7.5;
        let stop = e.pt > 1.4;
        if (e.grounded && !groundAhead(e, ux, uz)) stop = true;
        else if (enemyMove(e, ux * sp * dt, uz * sp * dt, dt)) stop = true;
        m.body.rotation.set(1.35, 0, 0); m.body.position.y = -0.25;
        m.fL.rotation.z = 1.4; m.fR.rotation.z = -1.4;
        if (Math.random() < 0.3) burst(e.pos.x, e.pos.y + 0.1, e.pos.z, 0xffffff, 1, 2, 0.4, 3, 1);
        if (stop) { e.pmode = 'recover'; e.pt = 0; }
      } else {
        enemyMove(e, 0, 0, dt);
        m.body.rotation.set(lerp(m.body.rotation.x, 0, dt * 6), 0, Math.sin(e.t * 20) * 0.1); m.body.position.y = 0;
        if (e.pt > 1.0) { e.pmode = 'walk'; e.cd = 1.6; }
      }
      m.root.rotation.y = e.dir;
    } else if (e.type === 'ghost') {
      const toG = Math.atan2(e.pos.x - TG.pos.x, e.pos.z - TG.pos.z);
      const looking = Math.abs(angDiff(TG.facing, toG)) < 1.25;
      const hx = TG.pos.x - e.home.x, hz = TG.pos.z - e.home.z;
      const hunt = playerOk && Math.hypot(hx, hz) < 15 && distP < 16 && Math.abs(dyp) < 6;
      const shy = hunt && looking;
      let tx, ty, tz, sp;
      if (hunt && !shy) { tx = TG.pos.x; ty = TG.pos.y + 0.25; tz = TG.pos.z; sp = save.easy ? 1.8 : 2.4; if (!e.alert) { e.alert = 1; Snd.S.ghost(); } }
      else if (shy) { tx = e.pos.x; ty = e.pos.y; tz = e.pos.z; sp = 0; }
      else { e.alert = 0; tx = e.home.x + Math.sin(e.t * 0.6) * 1.5; ty = e.home.y + Math.sin(e.t * 1.7) * 0.3; tz = e.home.z + Math.cos(e.t * 0.6) * 1.5; sp = 1.6; }
      const vx = tx - e.pos.x, vy = ty - e.pos.y, vz = tz - e.pos.z, vd = Math.hypot(vx, vy, vz) || 1;
      const step = Math.min(sp, vd * 3) * dt;
      e.pos.x += (vx / vd) * step; e.pos.y += (vy / vd) * step; e.pos.z += (vz / vd) * step;
      if (!shy && Math.hypot(vx, vz) > 0.1) e.dir = angleLerp(e.dir, Math.atan2(vx, vz), Math.min(1, dt * 5));
      else if (shy) e.dir = angleLerp(e.dir, Math.atan2(dxp, dzp), Math.min(1, dt * 5));
      m.root.rotation.y = e.dir;
      e.alpha = lerp(e.alpha, shy ? 0.4 : 0.88, damp(6, dt));
      m.mat.opacity = e.alpha;
      // shy = hands over the eyes; chasing = arms out, tongue out
      m.armL.position.set(shy ? -0.2 : -0.62, shy ? 0.95 : 0.75 + Math.sin(e.t * 6) * 0.08, shy ? 0.55 : 0.15);
      m.armR.position.set(shy ? 0.2 : 0.62, shy ? 0.95 : 0.75 - Math.sin(e.t * 6) * 0.08, shy ? 0.55 : 0.15);
      m.tongue.visible = !shy && hunt;
      m.body.position.y = Math.sin(e.t * 2.2) * 0.12;
      m.body.rotation.z = Math.sin(e.t * 1.4) * 0.1;
      const gt = groundTopAt(e.pos.x, e.pos.z, e.pos.y);
      if (gt > -Infinity) { e.blob.visible = true; e.blob.position.set(e.pos.x, gt + 0.03, e.pos.z); } else e.blob.visible = false;
    } else if (e.type === 'robot') {
      const tgt = e.toB ? e.b : e.a;
      const tx = tgt.x - e.pos.x, tz = tgt.z - e.pos.z, td = Math.hypot(tx, tz);
      const cyc = ((e.t + e.ph) % 4.6);
      const sparking = cyc > 3.2, tele = cyc > 2.5 && !sparking;
      if (sparking && !e.sparking && distP < 16) Snd.S.spark();
      e.sparking = sparking;
      e.stompable = e.spinnable = !sparking;
      if (td < 0.3) e.toB = !e.toB;
      else if (!sparking) {
        const ux = tx / td, uz = tz / td;
        e.dir = angleLerp(e.dir, Math.atan2(ux, uz), Math.min(1, dt * 6));
        if (e.grounded && !groundAhead(e, ux, uz)) { e.toB = !e.toB; enemyMove(e, 0, 0, dt); }
        else if (enemyMove(e, ux * 1.9 * dt, uz * 1.9 * dt, dt)) e.toB = !e.toB;
        m.wheelL.rotation.x += dt * 8; m.wheelR.rotation.x += dt * 8;
      } else enemyMove(e, 0, 0, dt);
      m.root.rotation.y = e.dir;
      m.bulb.material = basic(sparking ? 0x55ddff : tele ? (Math.floor(e.t * 12) % 2 ? 0xffffff : 0xff3355) : 0xff3355);
      m.spark.material.opacity = sparking ? 0.55 + Math.random() * 0.45 : 0;
      m.body.position.y = sparking ? (Math.random() - 0.5) * 0.06 : 0;
      if (sparking && Math.random() < 0.25) burst(e.pos.x + (Math.random() - 0.5), e.pos.y + 0.6 + Math.random(), e.pos.z + (Math.random() - 0.5), 0x9ff0ff, 1, 4, 0.25, 0, 0.8);
    }
    if (e.type !== 'bee' && e.type !== 'turret' && e.type !== 'ghost' && (e.pos.y < W.killY || (W.lavaY !== null && e.pos.y < W.lavaY))) {
      if (W.lavaY !== null) burst(e.pos.x, W.lavaY, e.pos.z, 0xff7a1c, 8, 4, 0.5);
      e.alive = false; e.dying = 0; continue;
    }
    m.root.position.copy(e.pos);
    enemyContact(e);
  }
}
function enemyContact(e) {
  if (!e.alive || P.state === 'dead' || P.state === 'win' || P.frozen) return;
  const dx = P.pos.x - e.pos.x, dz = P.pos.z - e.pos.z;
  const reach = P.r + e.r;
  if (dx * dx + dz * dz > reach * reach) return;
  if (P.pos.y > e.pos.y + e.h || P.pos.y + P.h < e.pos.y) return;
  const fromAbove = P.vel.y <= 0.5 && P.pos.y > e.pos.y + e.h * 0.4;
  if (fromAbove) {
    if (e.stompable) {
      killEnemy(e, 'stomp');
      P.vel.y = input.jump ? 16 : 11;
      P.canDouble = true; P.jumping = false;
      if (P.state === 'pound') { P.state = 'normal'; P.stateT = 0; }
      P.pos.y = Math.max(P.pos.y, e.pos.y + e.h * 0.5);
      return;
    }
    // spiky from above: hurts, but pops you up
    hurtPlayer(e.pos, 'spike');
    P.vel.y = 12;
    return;
  }
  hurtPlayer(e.pos, 'enemy');
}
function killEnemy(e, kind) {
  if (!e.alive) return;
  let killer = null;
  if (NET.on) {
    killer = NET.applying ? NET.applyBy : (NET.credit || NET.pid);
    if (!NET.applying) { if (NET.host) netBroadcast({ t: 'ekill', id: e.id, k: kind, by: killer }); else netSend({ t: 'kill', id: e.id, k: kind }); }
  }
  e.alive = false;
  e.deathKind = kind;
  if (!NET.on || killer === NET.pid) run.enemies++;
  if (kind === 'stomp') {
    e.model.root.scale.set(1.3, 0.25, 1.3); e.dying = 0.45;
    Snd.S.stomp(); burst(e.pos.x, e.pos.y + 0.4, e.pos.z, 0xffffff, 10, 5, 0.4);
  } else {
    e.dying = 1.0; e.vy = 10;
    const a = Math.atan2(e.pos.x - P.pos.x, e.pos.z - P.pos.z);
    e.kx = Math.sin(a) * 6; e.kz = Math.cos(a) * 6;
    Snd.S.stomp(); burst(e.pos.x, e.pos.y + 0.5, e.pos.z, 0xffd23f, 12, 6, 0.5);
  }
  if (e.blob) e.blob.visible = false;
  collectCoin(e.pos.x, e.pos.y + 1, e.pos.z, true);
  popCoinFx(e.pos.x, e.pos.y + 0.8, e.pos.z);
}
function fireProjectile(x, y, z, dir, speed, opts) {
  const g = new THREE.Group();
  const snow = opts && opts.kind === 'snow';
  if (snow) {
    const ball = new THREE.Mesh(G.sphereLo, mat(0xffffff, { emissive: 0x556677 })); ball.scale.setScalar(0.32); g.add(ball);
  } else {
    const core = new THREE.Mesh(G.ico, basic(0xff4dd2)); core.scale.setScalar(0.3); g.add(core);
    const inner = new THREE.Mesh(G.ico, basic(0xffffff)); inner.scale.setScalar(0.16); g.add(inner);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xff66dd, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.setScalar(1.4); g.add(glow);
  }
  g.position.set(x, y, z); W.root.add(g);
  W.projectiles.push({ pos: g.position, vel: dir.clone().multiplyScalar(speed), life: 4.5, mesh: g, grav: (opts && opts.grav) || 0, color: snow ? 0xffffff : 0xff66dd });
  if (NET.on && NET.host && !NET.applying) netBroadcast({ t: 'proj', p: [r3(x), r3(y), r3(z)], d: [r3(dir.x), r3(dir.y), r3(dir.z)], s: r3(speed), k: snow ? 1 : 0, gr: (opts && opts.grav) || 0 });
  if (snow) Snd.S.throwSnow(); else Snd.S.shoot();
}
function updateProjectiles(dt) {
  for (let i = W.projectiles.length - 1; i >= 0; i--) {
    const p = W.projectiles[i];
    p.life -= dt;
    if (p.grav) p.vel.y -= p.grav * dt;
    p.pos.addScaledVector(p.vel, dt);
    p.mesh.rotation.y += dt * 10;
    let dead = p.life <= 0;
    if (!dead) {
      for (const s of W.solids) {
        if (!s.active) continue;
        if (Math.abs(p.pos.x - s.x) < s.hx && Math.abs(p.pos.y - s.y) < s.hy && Math.abs(p.pos.z - s.z) < s.hz) { dead = true; break; }
      }
    }
    if (!dead && P.state !== 'dead' && !P.frozen) {
      const d = playerSegDist(p.pos.x, p.pos.y, p.pos.z);
      if (P.state === 'spin' && d < 1.8) { dead = true; Snd.S.bump(); }
      else if (p.pos.y < W.killY) dead = true;
      else if (d < 0.3 + P.r) { dead = true; hurtPlayer(p.pos.clone().sub(p.vel), 'shot'); }
    }
    if (dead) {
      burst(p.pos.x, p.pos.y, p.pos.z, p.color, 6, 3, 0.35);
      W.root.remove(p.mesh);
      W.projectiles.splice(i, 1);
    }
  }
}

// =====================================================================
// Player controller
// =====================================================================
const run = { lives: 5, coins: 0, stars: [false, false, false], time: 0, enemies: 0 };
const FIXED = 1 / 120;
let mode = 'loading'; // loading | title | playing | paused | complete | gameover

function resetPlayerAt(pos, yaw) {
  P.pos.copy(pos); P.vel.set(0, 0, 0);
  P.facing = yaw + Math.PI;
  P.state = 'normal'; P.stateT = 0; P.grounded = false; P.ground = null; P.jumping = false;
  P.coyote = 0; P.jumpBuf = 0; P.canDouble = false; P.flip = 0; P.squash = 1; P.frozen = false;
  P.lastSafe.copy(pos);
  if (P.model) { P.model.root.visible = true; P.model.body.rotation.set(0, 0, 0); P.model.root.rotation.set(0, P.facing, 0); }
  cam.yaw = yaw; cam.pitch = 0.36;
  cam.target.set(pos.x, pos.y + 1.4, pos.z);
  cam.curDist = cam.dist;
}
function pMove(axis, amt) {
  if (!amt) return;
  const p = P.pos, r = P.r, h = P.h;
  p[axis] += amt;
  for (let i = 0; i < W.solids.length; i++) {
    const s = W.solids[i];
    if (!s.active) continue;
    if (p.x + r <= s.x - s.hx || p.x - r >= s.x + s.hx || p.z + r <= s.z - s.hz || p.z - r >= s.z + s.hz || p.y + h <= s.y - s.hy || p.y >= s.y + s.hy) continue;
    if (axis === 'y') {
      const prevY = p.y - amt;
      if (amt < 0) {
        if (prevY < s.y + s.hy - 0.02) continue; // side contact, not a landing
        p.y = s.y + s.hy;
        P.landVy = Math.min(P.landVy, P.vel.y);
        if (P.vel.y < 0) P.vel.y = 0;
        P.grounded = true; P.ground = s;
        landOn(s);
      } else {
        if (prevY + h > s.y - s.hy + 0.02) continue;
        p.y = s.y - s.hy - h;
        if (P.vel.y > 0) P.vel.y = 0;
        if (s.onBump) s.onBump(); else if (s.kind !== 'push') Snd.S.bump();
      }
    } else {
      const top = s.y + s.hy;
      const rise = top - p.y;
      if (P.wasGrounded && rise > 0 && rise <= STEP_H && s.kind !== 'push' && s.kind !== 'door' &&
          boxFree(p.x, top + h / 2 + 0.01, p.z, r - 0.02, h / 2, r - 0.02, null)) {
        p.y = top;
        continue;
      }
      // 2.0 ledge assist: a jump that clips the lip of a platform pops you up onto it instead of sliding off
      if (!P.wasGrounded && P.vel.y <= 3 && rise > 0 && rise <= ledgeAssist() && s.kind !== 'door' && s.kind !== 'gate' && s.kind !== 'crusher' &&
          P.state !== 'hurt' && P.state !== 'lava' && P.state !== 'dead' &&
          boxFree(p.x, top + h / 2 + 0.02, p.z, r - 0.02, h / 2, r - 0.02, null)) {
        p.y = top + 0.001;
        if (P.vel.y > 0) P.vel.y = 0;
        continue;
      }
      let pushed = false;
      if (s.kind === 'push' && P.wasGrounded && !s.seated && P.state !== 'spin') {
        const comp = axis === 'x' ? P.inX : P.inZ;
        if (Math.sign(comp) === Math.sign(amt) && Math.abs(comp) > 0.35) {
          if (s.ice) {
            if (!s.slide) {
              if (W.time - s.lastPush > 0.05) s.pushT = 0;
              s.lastPush = W.time; s.pushT += FIXED; P.pushing = true;
              if (s.pushT > 0.12) { s.slide = { axis, dir: Math.sign(amt) }; s.pushT = 0; Snd.S.slide(); s.netPush = W.time; s.netSlideSent = false; }
            }
          } else {
            pushed = tryMoveBlock(s, axis, Math.sign(amt) * PUSH_SPEED * FIXED);
            if (pushed) { P.pushing = true; s.netPush = W.time; }
          }
        }
      }
      if (s.kind === 'door' && s.tryOpen) s.tryOpen();
      const half = axis === 'x' ? s.hx : s.hz;
      p[axis] = amt > 0 ? s[axis] - half - r - 1e-4 : s[axis] + half + r + 1e-4;
      if (W.boost && !pushed) P.crashV = Math.max(P.crashV || 0, Math.abs(P.vel[axis]));
      if (pushed) P.vel[axis] = Math.sign(amt) * Math.min(Math.abs(P.vel[axis]), PUSH_SPEED);
      else P.vel[axis] = 0;
    }
  }
  if (axis === 'y' && amt < 0 && NET.on) netHeadLand(p, amt); // co-op: stand / bounce on your partner's head
}
function landOn(s) {
  if (s.kind === 'spring') {
    P.bounceV = P.state === 'pound' ? SPRING_V * 1.15 : SPRING_V;
    s.anim = 0.4;
  } else if (s.kind === 'falling' && s.onLand) s.onLand();
  else if (s.kind === 'launch' && P.state !== 'launch') P.launchPad = s;
  if (s.kind === 'static') {
    P.lastSafe.set(s.hx > 0.8 ? clamp(P.pos.x, s.x - s.hx + 0.8, s.x + s.hx - 0.8) : s.x, s.y + s.hy, s.hz > 0.8 ? clamp(P.pos.z, s.z - s.hz + 0.8, s.z + s.hz - 0.8) : s.z);
  }
}
function resolveOverlaps() {
  for (const s of W.solids) {
    if (!s.active) continue;
    if (!overlapsBody(P.pos.x, P.pos.y, P.pos.z, P.r, P.h, s)) continue;
    const up = s.y + s.hy - P.pos.y;
    if (up <= 0.6 && s.dy > -0.0001) {
      P.pos.y = s.y + s.hy; if (P.vel.y < 0) P.vel.y = 0; P.ground = s; P.grounded = true;
      continue;
    }
    if (s.dy < -0.0001 && P.pos.y < s.y) hurtPlayer(new V3(s.x, P.pos.y, s.z), 'crush');
    const ox1 = P.pos.x + P.r - (s.x - s.hx), ox2 = s.x + s.hx - (P.pos.x - P.r);
    const oz1 = P.pos.z + P.r - (s.z - s.hz), oz2 = s.z + s.hz - (P.pos.z - P.r);
    const m = Math.min(ox1, ox2, oz1, oz2);
    if (m === ox1) P.pos.x -= ox1 + 0.001; else if (m === ox2) P.pos.x += ox2 + 0.001;
    else if (m === oz1) P.pos.z -= oz1 + 0.001; else P.pos.z += oz2 + 0.001;
  }
}
function playerTick(dt) {
  P.stateT += dt;
  if (P.state === 'dead') {
    P.vel.y -= 30 * dt; P.pos.y += P.vel.y * dt;
    if (P.stateT > 1.9 && !P.deathHandled) { P.deathHandled = true; loseLife(); }
    return;
  }
  if (P.frozen) return;
  if (P.state === 'win') {
    P.vel.x = 0; P.vel.z = 0;
    if (P.grounded && P.stateT > 0.4 && P.stateT < 2) { P.vel.y = 8; }
    P.vel.y -= G_DOWN * dt;
    P.grounded = false; P.ground = null;
    pMove('y', P.vel.y * dt);
    return;
  }
  P.invuln = Math.max(0, P.invuln - dt);
  P.spinCd -= dt;
  P.wasGrounded = P.grounded;
  P.pushing = false;
  if (W.boost && boostPre(dt)) return;

  // camera-relative input
  const ix = input.mx, iy = input.my;
  const mag = Math.min(1, Math.hypot(ix, iy));
  const sy = Math.sin(cam.yaw), cy = Math.cos(cam.yaw);
  let wx = -sy * iy + cy * ix, wz = -cy * iy - sy * ix;
  const wl = Math.hypot(wx, wz);
  if (wl > 1e-4) { wx = (wx / wl) * mag; wz = (wz / wl) * mag; } else { wx = 0; wz = 0; }
  P.inX = wx; P.inZ = wz;

  if (input.jumpPressed) P.jumpBuf = JUMP_BUF; else P.jumpBuf -= dt;
  const locked = P.state === 'poundStart' || P.state === 'pound' || P.state === 'poundLand' || P.state === 'hurt' || P.state === 'lava';

  // ---- action button ----
  if (input.actionPressed && !locked) {
    const hs = Math.hypot(P.vel.x, P.vel.z);
    if (P.grounded) {
      if (hs > 5.5 && mag > 0.3) {
        const a = Math.atan2(wx, wz);
        P.facing = a;
        P.vel.x = Math.sin(a) * LONG_H; P.vel.z = Math.cos(a) * LONG_H; P.vel.y = LONG_V;
        P.state = 'longjump'; P.stateT = 0; P.grounded = false; P.coyote = 0; P.canDouble = true; P.jumping = false;
        P.squash = 0.7; Snd.S.longjump(); dust(P.pos.x, P.pos.y, P.pos.z, 8);
      } else if (P.spinCd <= 0) {
        P.state = 'spin'; P.stateT = 0; P.spinCd = 0.55; P.spinHit = new Set();
        Snd.S.spin();
      }
    } else if (W.boost && boostAirAction()) {
      // homing attack / air dash
    } else if (P.state !== 'pound') {
      P.state = 'poundStart'; P.stateT = 0; P.vel.set(0, 0, 0); P.jumping = false;
      Snd.S.poundStart();
    }
  }

  // ---- horizontal ----
  if (P.state === 'poundStart') {
    P.vel.set(0, 0, 0);
    if (P.stateT > 0.2) { P.state = 'pound'; P.stateT = 0; P.vel.y = -34; }
  } else if (P.state === 'pound') {
    P.vel.x = 0; P.vel.z = 0; P.vel.y = -34;
  } else if (P.state === 'poundLand') {
    P.vel.x *= 0.6; P.vel.z *= 0.6;
    if (P.stateT > 0.2) { P.state = 'normal'; P.stateT = 0; }
  } else if (P.state === 'hurt') {
    if ((P.grounded && P.stateT > 0.25) || P.stateT > 0.9) { P.state = 'normal'; P.stateT = 0; }
  } else if (P.state === 'launch') {
    if (P.stateT > 5) { P.state = 'normal'; P.stateT = 0; } // boost-pad flight keeps its arc
  } else if (P.state === 'lava') {
    if ((P.grounded && P.stateT > 0.2) || P.stateT > 2.5) { P.state = 'normal'; P.stateT = 0; }
  } else {
    const spinning = P.state === 'spin';
    const topSpeed = (W.boost ? boostTop() : RUN) * (spinning ? 0.75 : 1);
    const tx = wx * topSpeed, tz = wz * topSpeed;
    let accel;
    // ice: ground.ice is a slipperiness amount (1 = glassy bridge, ~0.5 = rink)
    const ice = (P.grounded && P.ground && P.ground.ice) || 0;
    if (P.grounded) {
      accel = mag > 0.05 ? (P.vel.x * tx + P.vel.z * tz < 0 ? 90 : 60) : 48;
      if (ice) accel = lerp(accel, mag > 0.05 ? 15 : 4.5, ice);
      if (W.boost) accel *= P.speedHold > 0 ? 0.45 : P.boosting ? 1.5 : 1.25;
    } else accel = P.state === 'longjump' ? AIR_ACCEL_LONG : AIR_ACCEL;
    const oldSp = Math.hypot(P.vel.x, P.vel.z);
    let dx = tx - P.vel.x, dz = tz - P.vel.z;
    const dl = Math.hypot(dx, dz), maxd = accel * dt;
    if (dl > maxd) { dx *= maxd / dl; dz *= maxd / dl; }
    P.vel.x += dx; P.vel.z += dz;
    if (!P.grounded && oldSp > RUN) {
      const ns = Math.hypot(P.vel.x, P.vel.z);
      const keep = Math.max(ns, oldSp - 5 * dt);
      if (ns > 1e-3) { P.vel.x *= keep / ns; P.vel.z *= keep / ns; }
    }
    if (mag > 0.1) P.facing = angleLerp(P.facing, Math.atan2(wx, wz), Math.min(1, dt * (P.grounded ? 18 : 9)));
    if (spinning) {
      for (const e of W.enemies) {
        if (!e.alive || P.spinHit.has(e)) continue;
        const ex = e.pos.x - P.pos.x, ez = e.pos.z - P.pos.z;
        if (ex * ex + ez * ez < 1.8 * 1.8 && Math.abs(e.pos.y - P.pos.y) < 1.4) {
          P.spinHit.add(e);
          if (e.spinnable) killEnemy(e, 'spin');
          else { const d = Math.hypot(ex, ez) || 1; P.vel.x = (-ex / d) * 9; P.vel.z = (-ez / d) * 9; P.vel.y = 6; Snd.S.bump(); }
        }
      }
      if (P.stateT > 0.42) { P.state = 'normal'; P.stateT = 0; }
    }
  }

  // ---- jumping ----
  if (P.grounded) { P.coyote = COYOTE; P.canDouble = true; } else P.coyote -= dt;
  if (!locked) {
    if (P.jumpBuf > 0 && P.coyote > 0) {
      const hs = Math.hypot(P.vel.x, P.vel.z);
      P.vel.y = JUMP_V + Math.min(1.2, hs * 0.08);
      P.jumping = true; P.coyote = 0; P.jumpBuf = 0; P.grounded = false;
      if (P.state === 'spin' || P.state === 'longjump') { P.state = 'normal'; P.stateT = 0; }
      P.squash = 1.3; Snd.S.jump(); dust(P.pos.x, P.pos.y, P.pos.z, 4);
    } else if (input.jumpPressed && !P.grounded && P.coyote <= 0 && P.canDouble) {
      P.vel.y = DJUMP_V; P.canDouble = false; P.jumping = true; P.jumpBuf = 0; P.flip = 1;
      if (P.state === 'spin') { P.state = 'normal'; P.stateT = 0; }
      Snd.S.djump(); ringFx(P.pos.x, P.pos.y, P.pos.z, 0xffffff, 1.5);
    }
  }

  // ---- gravity ----
  let g = P.vel.y > 0 ? G_UP : G_DOWN;
  if (P.vel.y > 0 && P.jumping && !input.jump) g *= 2.7;
  if (P.state === 'poundStart') g = 0;
  if (P.state === 'lava') g = G_LAVA;
  const zn = W.zones.length ? zoneAt(P.pos.x, P.pos.y + 0.5, P.pos.z) : null; // 3.0: low gravity / water spouts
  if (zn && zn.grav) g *= zn.grav;
  if (P.state !== 'pound') P.vel.y = Math.max(P.vel.y - g * dt, -MAX_FALL * (zn && zn.grav ? 0.55 : 1));
  if (zn && zn.lift && P.state !== 'pound' && P.state !== 'poundStart' && P.state !== 'dead') {
    P.vel.y = Math.min(P.vel.y + zn.lift * dt, zn.maxUp); P.canDouble = true; P.jumping = false;
    if (P.state === 'launch') { P.state = 'normal'; P.stateT = 0; }
  }

  // ---- integrate with collision ----
  P.grounded = false; P.ground = null; P.landVy = 0; P.bounceV = 0; P.launchPad = null;
  pMove('x', P.vel.x * dt);
  pMove('z', P.vel.z * dt);
  pMove('y', P.vel.y * dt);

  if (P.launchPad) { launchFrom(P.launchPad); P.launchPad = null; }
  else if (P.bounceV) {
    P.vel.y = P.bounceV; P.grounded = false; P.jumping = false; P.canDouble = true;
    if (P.state !== 'normal' && P.state !== 'spin') { P.state = 'normal'; P.stateT = 0; }
    P.squash = 1.4; Snd.S.spring(); P.bounceV = 0;
  } else if (P.grounded && !P.wasGrounded) {
    onPlayerLand();
  }
  if (P.grounded) P.jumping = false;

  // pushing dust
  if (P.pushing) { P.pushT += dt; if (P.pushT > 0.25) { P.pushT = 0; dust(P.pos.x - Math.sin(P.facing) * 0.3, P.pos.y, P.pos.z - Math.cos(P.facing) * 0.3, 2); } }

  if (W.boost) boostPost(dt);
  // hazards: water / lava / void
  if (W.lavaY !== null && P.pos.y < W.lavaY && P.state !== 'lava') lavaHit();
  else if (P.pos.y < W.killY) fallOut();
}
function onPlayerLand() {
  const impact = -P.landVy;
  if (P.state === 'pound') {
    P.state = 'poundLand'; P.stateT = 0;
    if (NET.on && !NET.host && P.ground) netSend({ t: 'pound', k: W.solids.indexOf(P.ground) });
    Snd.S.pound(); shakeAmt = Math.max(shakeAmt, 0.3);
    ringFx(P.pos.x, P.pos.y, P.pos.z, 0xffffff, 3.5); dust(P.pos.x, P.pos.y, P.pos.z, 14);
    for (const e of W.enemies) {
      if (!e.alive || !e.spinnable) continue;
      const ex = e.pos.x - P.pos.x, ez = e.pos.z - P.pos.z;
      if (ex * ex + ez * ez < 3 * 3 && Math.abs(e.pos.y - P.pos.y) < 1.3) killEnemy(e, 'spin');
    }
    P.squash = 0.55;
  } else {
    if (P.state === 'launch') { P.vel.x *= 0.2; P.vel.z *= 0.2; } // boost pads: stick the landing
    if (P.state === 'longjump' || P.state === 'hurt' || P.state === 'launch') { P.state = 'normal'; P.stateT = 0; }
    if (impact > 10) { P.squash = 0.72; dust(P.pos.x, P.pos.y, P.pos.z, 5); }
  }
}
function hurtPlayer(from, kind) {
  if (P.invuln > 0 || P.state === 'dead' || P.state === 'win' || P.frozen || mode !== 'playing') return;
  if (W.boost && boostHurt(from)) return;
  P.health--;
  updateHUD(true);
  Snd.S.hurt(); shakeAmt = Math.max(shakeAmt, 0.25);
  burst(P.pos.x, P.pos.y + 1, P.pos.z, 0xff3b5c, 10, 5, 0.5);
  if (P.health <= 0) { killPlayer(); return; }
  P.invuln = HURT_INVULN; P.state = 'hurt'; P.stateT = 0; P.jumping = false;
  let dx = P.pos.x - from.x, dz = P.pos.z - from.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.01) { dx = -Math.sin(P.facing); dz = -Math.cos(P.facing); } else { dx /= d; dz /= d; }
  P.vel.x = dx * 8; P.vel.z = dz * 8; P.vel.y = 8;
  void kind;
}
function killPlayer() {
  if (P.state === 'dead') return;
  P.state = 'dead'; P.stateT = 0; P.deathHandled = false;
  P.vel.set(0, 13, 0); P.health = 0; updateHUD(true);
  Snd.stopMusic(); Snd.S.die();
}
function lavaHit() {
  Snd.S.lava(); shakeAmt = Math.max(shakeAmt, 0.3);
  burst(P.pos.x, W.lavaY + 0.2, P.pos.z, 0xff7a1c, 18, 7, 0.7);
  P.health--; updateHUD(true);
  if (P.health <= 0) { killPlayer(); return; }
  P.state = 'lava'; P.stateT = 0; P.invuln = 1.6; P.jumping = false; P.canDouble = false;
  const T = 1.15, t = P.lastSafe;
  P.vel.x = (t.x - P.pos.x) / T; P.vel.z = (t.z - P.pos.z) / T;
  P.vel.y = (t.y + 0.4 - P.pos.y + 0.5 * G_LAVA * T * T) / T;
  showToast('HOT HOT HOT!', 1.2);
}
function fallOut() {
  if (P.frozen) return;
  P.frozen = true;
  if (W.water) { Snd.S.splash(); burst(P.pos.x, W.water.position.y, P.pos.z, 0xbfe8ff, 16, 6, 0.7); } else Snd.S.fall();
  P.health--; updateHUD(true);
  setTimeout(() => {
    if (mode !== 'playing') return;
    if (P.health <= 0) loseLife(); else respawn(false, (NET.on && netPartnerSpot()) || P.lastSafe);
  }, 450);
}
function loseLife() {
  if (NET.on) { respawn(true, netPartnerSpot()); return; } // co-op: no game over, pop back in next to your partner
  if (!save.easy) run.lives--;
  updateHUD(true);
  if (run.lives <= 0) { gameOver(); return; }
  respawn(true);
}
function respawn(full, at) {
  P.frozen = true;
  const pos = at ? at.clone().setY(at.y + 0.05) : null, yaw = cam.yaw;
  fadeThen(() => {
    if (full) P.health = P.maxHealth;
    if (pos) resetPlayerAt(pos, yaw); else resetPlayerAt(W.checkpoint.pos, W.checkpoint.yaw);
    P.invuln = 1.5;
    updateHUD(true);
    if (full) Snd.playMusic(W.levelIdx);
  });
}
function fadeThen(fn) {
  const f = $('fade');
  f.classList.add('on');
  setTimeout(() => { fn(); setTimeout(() => f.classList.remove('on'), 60); }, 330);
}

// ---------- items ----------
function collectCoin(x, y, z, quiet) {
  if (NET.on) { netCoin(x, y, z); return; } // co-op: the host counts every coin once
  run.coins++; run.levelCoins++;
  Snd.S.coin(); void quiet;
  burst(x, y, z, 0xffe14a, 5, 3, 0.35, 4);
  if (run.levelCoins % 10 === 0 && P.health < P.maxHealth && P.state !== 'dead') { P.health++; heartPop(); }
  if (run.coins % 50 === 0) { run.lives++; Snd.S.oneup(); showToast('<b>50 COINS — 1-UP!</b>', 2); }
  updateHUD(false, 'coins');
}
function updateItems(dt) {
  const cx = P.pos.x, cy = P.pos.y + 0.75, cz = P.pos.z;
  for (let i = W.items.length - 1; i >= 0; i--) {
    const it = W.items[i];
    const mm = it.mesh;
    if (it.spill) {
      const sp = it.spill; sp.life -= dt; sp.vy -= 26 * dt;
      it.x += sp.vx * dt; it.z += sp.vz * dt; let ny = mm.position.y + sp.vy * dt;
      const gtop = groundTopAt(it.x, it.z, mm.position.y + 0.5);
      if (ny < gtop + 0.6) { ny = gtop + 0.6; sp.vy = Math.abs(sp.vy) * 0.5; sp.vx *= 0.8; sp.vz *= 0.8; }
      mm.position.set(it.x, ny, it.z); mm.visible = sp.life > 1.2 || Math.floor(sp.life * 10) % 2 === 0;
      if (sp.life <= 0) { W.root.remove(mm); W.items.splice(i, 1); continue; }
      if (sp.life > 3.4 || P.state === 'dead' || P.frozen) continue;
      const ddx = it.x - P.pos.x, ddy = ny - (P.pos.y + 0.75), ddz = it.z - P.pos.z;
      if (ddx * ddx + ddy * ddy + ddz * ddz < 1.9) { W.root.remove(mm); W.items.splice(i, 1); boostRing(); Snd.S.coin(); burst(it.x, ny, it.z, 0xffe14a, 4, 3, 0.3, 4); }
      continue;
    }
    if (it.type === 'coin') mm.rotation.y = W.time * 3.2 + it.phase;
    else { mm.rotation.y = W.time * 1.8; mm.position.y = it.y + Math.sin(W.time * 2.5 + it.phase) * 0.18; }
    if (P.state === 'dead' || P.frozen || mode !== 'playing') continue;
    if (it.locked && it.locked.active) continue;
    const dx = it.x - cx, dy = mm.position.y - cy, dz = it.z - cz;
    const rr = it.r + 0.45;
    if (dx * dx + dy * dy + dz * dz > rr * rr) continue;
    if (W.boost && it.type === 'coin' && !(it.netPending !== undefined && W.time - it.netPending < 1.5)) boostRing();
    if (NET.on) { netTouchItem(it, i); continue; }
    W.root.remove(mm);
    W.items.splice(i, 1);
    if (it.type === 'coin') collectCoin(it.x, mm.position.y, it.z);
    else if (it.type === 'star') {
      run.stars[it.idx] = true;
      const n = run.stars.filter(Boolean).length;
      Snd.S.star(); shakeAmt = Math.max(shakeAmt, 0.1);
      burst(it.x, mm.position.y, it.z, 0xffe14a, 30, 8, 0.9); ringFx(it.x, mm.position.y - 0.5, it.z, 0xffe14a, 4);
      showToast('<b>&#9733; GROK STAR!</b> ' + n + ' / 3 found', 3);
      updateHUD(false, 'stars');
    } else if (it.type === 'oneup') {
      run.lives++; Snd.S.oneup(); burst(it.x, mm.position.y, it.z, 0x3fd34a, 16, 5, 0.6);
      showToast('<b>1-UP!</b> Extra life', 2);
      updateHUD(false, 'lives');
    } else if (it.type === 'key') {
      P.hasKey = true; Snd.S.key(); burst(it.x, mm.position.y, it.z, 0xffd23f, 24, 6, 0.8);
      showToast('You got the <b>KEY</b>! Find the locked door.', 3);
      updateHUD(true);
    } else if (it.type === 'tstar') { // co-op team star (only reachable here after the host left)
      run.team[it.idx] = true; Snd.S.star(); burst(it.x, mm.position.y, it.z, 0x3ff0ff, 30, 8, 0.9);
      showToast('<b>&#9733; TEAM STAR!</b>', 3);
    }
  }
  void dt;
}

// =====================================================================
// Camera
// =====================================================================
const cam = { yaw: 0, pitch: 0.36, dist: 10.5, curDist: 10.5, target: new V3(), manualT: 99 };
const _dir = new V3(), _camPos = new V3();
function updateCamera(dt) {
  if (mode === 'title') {
    const t = performance.now() / 1000;
    const tgt = W.titleFocus || new V3(0, 2, 0);
    camera.position.set(tgt.x + Math.sin(t * 0.12) * 17, tgt.y + 7 + Math.sin(t * 0.2) * 1.5, tgt.z + Math.cos(t * 0.12) * 17);
    camera.lookAt(tgt.x, tgt.y, tgt.z);
    return;
  }
  let rot = 0;
  if (keys.KeyQ) rot += 1;
  if (keys.KeyE) rot -= 1;
  if (rot && mode === 'playing') { cam.yaw += rot * 2.4 * dt; cam.manualT = 0; }
  cam.manualT += dt;
  const hs = Math.hypot(P.vel.x, P.vel.z);
  if (mode === 'playing' && cam.manualT > (W.boost ? 0.8 : 1.4) && hs > 3 && P.state !== 'dead' && P.state !== 'lava' && (Math.hypot(input.mx, input.my) > 0.2 || P.grind || P.state === 'homing' || P.speedHold > 0)) {
    const behind = P.facing + Math.PI;
    const d = angDiff(cam.yaw, behind);
    if (Math.abs(d) < (W.boost ? 2.6 : 1.9)) cam.yaw += d * Math.min(1, dt * (W.boost ? 2.6 : 0.9)) * Math.min(1, hs / RUN);
  }
  if (P.state !== 'dead') {
    cam.target.x = lerp(cam.target.x, P.pos.x, damp(12, dt));
    cam.target.z = lerp(cam.target.z, P.pos.z, damp(12, dt));
    const ty = P.pos.y + 1.4;
    const rate = P.grounded || ty < cam.target.y - 1.2 || P.state === 'lava' ? 7 : 2.2;
    cam.target.y = lerp(cam.target.y, ty, damp(rate, dt));
  }
  const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  _dir.set(Math.sin(cam.yaw) * cp, sp, Math.cos(cam.yaw) * cp);
  const cdist = cam.dist + speedFx * 3.5;
  const hit = rayDist(cam.target, _dir, cdist);
  const want = hit < cdist ? Math.max(1.6, hit - 0.35) : cdist;
  cam.curDist = want < cam.curDist ? want : lerp(cam.curDist, want, damp(3, dt));
  _camPos.copy(cam.target).addScaledVector(_dir, cam.curDist);
  if (shakeAmt > 0.001) {
    _camPos.x += (Math.random() - 0.5) * shakeAmt; _camPos.y += (Math.random() - 0.5) * shakeAmt; _camPos.z += (Math.random() - 0.5) * shakeAmt;
    shakeAmt *= Math.exp(-8 * dt);
  }
  camera.position.copy(_camPos);
  camera.lookAt(cam.target);
}

// =====================================================================
// Player visuals
// =====================================================================
function animatePlayer(dt) { animateHero(P, dt); }
// shared by the local hero and co-op partners (P is the hero state being drawn)
function animateHero(P, dt) {
  const m = P.model;
  if (!m) return;
  m.root.position.copy(P.pos);
  m.root.rotation.y = P.facing;
  const hs = Math.hypot(P.vel.x, P.vel.z);
  P.animT += dt * (5 + hs * 1.25);
  P.squash = lerp(P.squash, 1, damp(10, dt));
  const sq = P.squash;
  m.body.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
  m.body.rotation.set(0, 0, 0);
  m.body.position.set(0, 0, 0);
  m.armL.rotation.set(0, 0, -0.15); m.armR.rotation.set(0, 0, 0.15);
  m.legL.rotation.set(0, 0, 0); m.legR.rotation.set(0, 0, 0);
  m.headG.rotation.set(0, 0, 0);
  const st = P.state;
  if (st === 'dead') {
    m.body.rotation.z = P.stateT * 6;
    m.armL.rotation.z = -2.6; m.armR.rotation.z = 2.6;
  } else if (st === 'win') {
    m.root.rotation.y = P.remote ? P.facing : cam.yaw;
    m.armL.rotation.z = -2.7 + Math.sin(P.stateT * 12) * 0.2; m.armR.rotation.z = 2.7 - Math.sin(P.stateT * 12) * 0.2;
    if (!P.grounded) m.body.rotation.y = P.stateT * 10;
  } else if (st === 'spin') {
    m.body.rotation.y = (P.stateT / 0.42) * TAU * 2;
    m.armL.rotation.z = -1.5; m.armR.rotation.z = 1.5;
  } else if (st === 'poundStart') {
    m.body.rotation.x = (P.stateT / 0.2) * TAU;
    m.body.position.y = 0.4;
    m.legL.rotation.x = -1.2; m.legR.rotation.x = -1.2;
  } else if (st === 'pound') {
    m.legL.rotation.x = -0.4; m.legR.rotation.x = -0.4; m.armL.rotation.z = -2.2; m.armR.rotation.z = 2.2;
    m.body.scale.set(0.85, 1.2, 0.85);
  } else if (st === 'longjump' || st === 'launch') {
    m.body.rotation.x = 0.9;
    m.armL.rotation.x = -2.6; m.armR.rotation.x = -2.6;
    m.legL.rotation.x = 0.6; m.legR.rotation.x = 0.6;
  } else if (st === 'hurt' || st === 'lava') {
    m.body.rotation.x = -0.4;
    m.armL.rotation.z = -2.2; m.armR.rotation.z = 2.2;
    if (st === 'lava') { m.legL.rotation.x = Math.sin(P.animT * 3) * 1.2; m.legR.rotation.x = -Math.sin(P.animT * 3) * 1.2; }
  } else if (!P.grounded) {
    if (P.flip > 0) {
      P.flip = Math.max(0, P.flip - dt / 0.42);
      m.body.rotation.x = (1 - P.flip) * TAU;
      m.body.position.y = Math.sin((1 - P.flip) * Math.PI) * 0.3;
    }
    if (P.vel.y > 0) { m.armR.rotation.z = 2.5; m.armL.rotation.z = -0.5; m.armL.rotation.x = 0.6; m.legL.rotation.x = -0.9; m.legR.rotation.x = 0.4; }
    else { m.armL.rotation.z = -1.3; m.armR.rotation.z = 1.3; m.legL.rotation.x = -0.3; m.legR.rotation.x = 0.3; }
  } else if (P.pushing) {
    m.body.rotation.x = 0.35;
    m.armL.rotation.x = -1.45; m.armR.rotation.x = -1.45;
    const sw = Math.sin(P.animT * 1.5) * 0.5;
    m.legL.rotation.x = sw; m.legR.rotation.x = -sw;
  } else if (hs > 0.4) {
    const k = Math.min(1, hs / 6);
    const sw = Math.sin(P.animT) * 0.95 * k;
    m.legL.rotation.x = sw; m.legR.rotation.x = -sw;
    m.armL.rotation.x = -sw * 0.8; m.armR.rotation.x = sw * 0.8;
    m.body.position.y = Math.abs(Math.cos(P.animT)) * 0.08 * k;
    m.body.rotation.x = 0.12 * k;
  } else {
    m.body.position.y = Math.sin(performance.now() / 400) * 0.02;
    m.headG.rotation.y = Math.sin(performance.now() / 1300) * 0.3;
  }
  // blink when invulnerable
  m.root.visible = !(P.invuln > 0 && st !== 'dead' && Math.floor(P.invuln * 14) % 2 === 0) && !(P.frozen && mode === 'playing' && P.pos.y < W.killY + 1);
  // blob shadow
  const b = P.blob;
  const gt = groundTopAt(P.pos.x, P.pos.z, P.pos.y + 0.05);
  if (gt > -Infinity && st !== 'dead') {
    const hgt = P.pos.y - gt;
    b.visible = true;
    b.position.set(P.pos.x, gt + 0.04, P.pos.z);
    b.scale.setScalar(clamp(0.62 - hgt * 0.018, 0.34, 0.62));
    b.material.opacity = clamp(0.6 - hgt * 0.015, 0.35, 0.6);
    const rg = P.ring;
    if (rg) {
      rg.visible = !P.grounded && hgt > 0.25;
      rg.position.set(P.pos.x, gt + 0.05, P.pos.z);
      rg.scale.setScalar(clamp(0.62 - hgt * 0.018, 0.34, 0.62));
    }
  } else { b.visible = false; if (P.ring) P.ring.visible = false; }
}

// =====================================================================
// Environment helpers
// =====================================================================
function setupEnv(c) {
  const geo = new THREE.SphereGeometry(500, 24, 14);
  const pos = geo.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const top = new THREE.Color(c.top), hor = new THREE.Color(c.horizon), bot = new THREE.Color(c.bottom), tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 500;
    if (y >= 0) tmp.copy(hor).lerp(top, Math.pow(y, 0.6)); else tmp.copy(hor).lerp(bot, Math.min(1, -y * 3));
    cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const sky = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -10;
  W.root.add(sky); W.sky = sky;
  scene.fog = new THREE.Fog(c.fog, c.fogNear, c.fogFar);
  scene.background = new THREE.Color(c.horizon);
  hemi.color.setHex(c.hemiSky); hemi.groundColor.setHex(c.hemiGround); hemi.intensity = c.hemiI;
  sun.color.setHex(c.sunColor); sun.intensity = c.sunI;
  ambient.intensity = c.amb || 0.18;
  W.water = null; W.torches = []; W.scenery = null;
  if (c.sunSprite) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: c.sunSprite, transparent: true, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.scale.setScalar(160); s.position.set(200, 180, -300); sky.add(s);
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffffff, transparent: true, fog: false, depthWrite: false }));
    core.scale.setScalar(50); core.position.copy(s.position); sky.add(core);
  }
}
function skyClouds(n, yMin, yMax, rMin, rMax, seed) {
  const r = mulberry(seed || 11);
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, d = rMin + r() * (rMax - rMin);
    const c = buildCloud(2 + r() * 3.5);
    c.position.set(Math.cos(a) * d, yMin + r() * (yMax - yMin), Math.sin(a) * d - 50);
    W.root.add(c);
    W.clouds.push({ m: c, speed: 0.5 + r() * 1.2 });
  }
}
function addTorchDecor(x, top, z) { const t = buildTorch(); t.position.set(x, top, z); W.root.add(t); W.torches.push(t.userData.flame); }
function addTower(x, z, r, h, baseY) {
  const c = M(G.cyl8, 0x6d6685, r, h, r); c.position.set(x, baseY + h / 2, z); W.root.add(c);
  const roof = M(G.cone, 0xc9302c, r * 1.25, r * 1.6, r * 1.25); roof.position.set(x, baseY + h + r * 0.8, z); W.root.add(roof);
  const flag = M(G.box, 0xffd23f, 1.2, 0.7, 0.05); flag.position.set(x + 0.6, baseY + h + r * 1.6 + 0.6, z); W.root.add(flag);
  const pole = M(G.cyl8, 0xffffff, 0.05, 1.6, 0.05); pole.position.set(x, baseY + h + r * 1.6 + 0.3, z); W.root.add(pole);
  shadowy(c, true, true);
}
function crenels(x1, x2, z1, z2, top) {
  // decorative merlons along a wall top
  const n = Math.max(2, Math.round(Math.hypot(x2 - x1, z2 - z1) / 2));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const m = M(G.box, 0x9d98b8, 0.9, 0.9, 0.9); m.position.set(lerp(x1, x2, t), top + 0.45, lerp(z1, z2, t)); W.root.add(m);
  }
}

// =====================================================================
// LEVEL 1 — GROK MEADOWS
// =====================================================================
function buildMeadows() {
  setupEnv({ top: 0x2f7fff, horizon: 0xc4ebff, bottom: 0x7cc6ff, fog: 0xc4ebff, fogNear: 80, fogFar: 280, hemiSky: 0xffffff, hemiGround: 0x6a9a50, hemiI: 0.75, sunColor: 0xfff2d8, sunI: 0.95, amb: 0.2, sunSprite: 0xfff3b0 });
  W.killY = -6;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), mat(0x3aa8f0, { transparent: true, opacity: 0.9, roughness: 0.25, metalness: 0.1 }));
  water.rotation.x = -Math.PI / 2; water.position.y = -3.2; W.root.add(water); W.water = water;
  if (SHADOWS) water.receiveShadow = true;
  const hr = mulberry(5);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU + hr() * 0.3, d = 170 + hr() * 70, s = 30 + hr() * 35;
    const hill = M(G.sphereLo, [0x59d65a, 0x3fbf4a, 0x86e05a][i % 3], s, s * (0.6 + hr() * 0.4), s);
    hill.position.set(Math.cos(a) * d, -12, Math.sin(a) * d - 40); W.root.add(hill);
  }
  skyClouds(22, 30, 70, 60, 220, 3);

  // ---- Start island ----
  const A = addBox(0, 0, 0, 20, 24, 8, 'grass'); decorate(A);
  addHint(-2.5, 0, 5.5, 'Move with <b>WASD</b> / arrows. <b>SPACE</b> jumps &mdash; press it again in mid-air to <b>DOUBLE JUMP</b>! Drag the mouse or use <b>Q</b>/<b>E</b> to turn the camera.',
    'Use the <b>stick</b> to move. Tap <b>JUMP</b> &mdash; tap again in mid-air to <b>DOUBLE JUMP</b>! Drag on the right side to turn the camera.');
  coinLine(0, 0.9, 4, 0, 0.9, -8, 6);
  addBox(-4.5, 1.2, 9, 2, 2, 1.2, 'block');
  addItem('coin', -4.5, 2.1, 9);
  addBox(-8, 4.4, 9, 2.2, 2.2, 4.4, 'stone');
  addItem('star', -8, 5.7, 9, { idx: 0 });
  addSpring(7, 0, 7.5);
  addHint(9.2, 0, 9.8, 'Bounce on the <b>SPRING</b> to reach the floating island!', null, 2.4);
  addIsland(7, 6, 1.5, 4, 4, 'grass', 1.5, { bare: true });
  addItem('oneup', 7.9, 6.6, 0.6);
  coinLine(5.8, 6.9, 2.9, 8.2, 6.9, 2.9, 3);
  addBox(2.5, 9.3, 1.5, 3, 3, 0.8, 'cloud');
  addItem('star', 2.5, 10.6, 1.5, { idx: 1 });
  addQBlock(-2.2, 3.4, -2, 'coins'); addQBlock(-1.1, 3.4, -2, 'coin'); addQBlock(0, 3.4, -2, 'coins');
  addWalker(3, 0, -5);
  addTree(-8.2, 0, -9, 1.1); addTree(8.5, 0, -10, 1); addTree(-8.5, 0, 1.5, 0.9);
  addHint(3, 0, -10, 'Stomp enemies by <b>jumping on them</b>! Hop on the <b>moving platform</b> to cross the water.', null, 2.8);

  // ---- River crossing ----
  addMover(0, 0, -14.5, 3, 3, [0, 0, -5], 5, 0);
  coinLine(0, 1.3, -14.5, 0, 1.3, -19.5, 3);

  // ---- Island B: crate puzzle ----
  const B = addBox(0, 0, -36, 24, 28, 8, 'meadow'); decorate(B);
  addCheckpoint(1.4, 0, -23.0, 0);
  addHint(-2, 0, -24, '<b>PUZZLE:</b> Push the <b>crates</b> onto <b>BOTH</b> yellow switches to open the gate. (Blue button = reset crates.)', null, 3);
  addBox(-7.25, 8, -49, 9.5, 2, 9, 'stone'); addBox(7.25, 8, -49, 9.5, 2, 9, 'stone');
  crenels(-11.5, -3, -49, -49, 8); crenels(3, 11.5, -49, -49, 8);
  const gate = addGate(0, 8, -49, 5, 1, 8);
  const bA = addPushBlock(-6, 0, -30), bB = addPushBlock(8, 0, -28);
  addBox(8, 1.5, -35, 6, 1.2, 1.5, 'hedge');
  const swA = addPressureSwitch(-6, 0, -42), swB = addPressureSwitch(8, 0, -40);
  addResetPad(2, 0, -25.5, [bA, bB]);
  const onSw = () => { const n = (swA.pressed ? 1 : 0) + (swB.pressed ? 1 : 0); if (n < 2) showToast('Switch pressed! <b>' + n + ' / 2</b>', 2.5); };
  swA.onPress = onSw; swB.onPress = onSw;
  W.things.push({ update() { if (!gate.opening && swA.pressed && swB.pressed) { gate.open(); showToast('<b>THE GATE IS OPEN!</b>', 3); Snd.S.solve(); } } });
  addBox(-10.5, 1.4, -24, 2, 2, 1.4, 'block');
  addBox(-10.5, 2.8, -26.8, 2, 2, 1, 'block');
  addBox(-8, 4.2, -28.5, 2, 2, 1, 'block');
  addItem('key', -8, 5.3, -28.5);
  addWalker(-1, 0, -38); addWalker(4, 0, -46);
  addSpiky(-10, 0, -31, -10, -46);
  coinLine(-3, 0.9, -28.5, 3, 0.9, -28.5, 4);
  coinRing(0, 0.9, -44, 2, 6);
  addTree(10.6, 0, -23.4, 0.9); addTree(10.8, 0, -46, 0.9);

  // ---- Falling platforms ----
  addCheckpoint(-1.6, 0, -46.2, 0);
  addHint(2.2, 0, -46.3, 'Wobbly orange platforms <b>fall</b> &mdash; keep moving!', null, 2.4);
  addFalling(0, 0, -52.5, 3.2, 3.2); addFalling(1.5, 0, -56, 3.2, 3.2); addFalling(-0.5, 0, -59.5, 3.2, 3.2);
  coinLine(0, 1.2, -52.5, -0.5, 1.2, -59.5, 3);

  // ---- Island C: log, cage, goal ----
  const C = addBox(0, 0, -76, 22, 28, 8, 'grass'); decorate(C);
  addCheckpoint(-1.6, 0, -63.4, 0);
  addHint(3.5, 0, -63.5, 'Jump over the spinning log! In mid-air, press <b>SHIFT</b> to <b>GROUND POUND</b>.', 'Jump over the spinning log! In mid-air, tap <b>ACTION</b> to <b>GROUND POUND</b>.', 2.8);
  addLog(0, 0, -72, 9, 1.15);
  coinRing(0, 2, -72, 3, 8);
  addTurret(-8, 0, -84);
  addWalker(-5, 0, -67); addWalker(6, 0, -78);
  const cage = addLockedDoor(8, 3, -84, 2.6, 2.6, 3, 'cage');
  addItem('star', 8, 1.4, -84, { idx: 2, locked: cage });
  addHint(4.6, 0, -80.5, 'A caged star! Its <b>KEY</b> is hidden somewhere in the meadow&hellip;', null, 2.6);
  addQBlock(-6, 3.4, -75, 'coins');
  addBox(0, 1, -87, 4, 4, 1, 'stone');
  addGoal(0, 1, -87, 'flag');
  addTree(-9.5, 0, -88, 1.1); addTree(9.5, 0, -64, 0.9);

  W.titleFocus = new V3(0, 1, 0);
  W.scenery = (dt, t) => { water.position.y = -3.2 + Math.sin(t * 0.8) * 0.08; };
}

// =====================================================================
// LEVEL 2 — SKY ISLANDS
// =====================================================================
function buildSky() {
  setupEnv({ top: 0x5a3fd0, horizon: 0xffb3c6, bottom: 0xffe0b0, fog: 0xffc6d2, fogNear: 90, fogFar: 320, hemiSky: 0xfff0f5, hemiGround: 0x9a7ad8, hemiI: 0.8, sunColor: 0xffd6a8, sunI: 0.9, amb: 0.22, sunSprite: 0xffc070 });
  W.killY = -16;
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), mat(0xfff2fa, { emissive: 0x6a4a6a }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -26; W.root.add(sea);
  const r = mulberry(9);
  for (let i = 0; i < 40; i++) {
    const a = r() * TAU, d = 20 + r() * 200;
    const c = buildCloud(3 + r() * 5); c.position.set(Math.cos(a) * d, -22 + r() * 5, Math.sin(a) * d - 50); W.root.add(c);
  }
  for (let i = 0; i < 9; i++) {
    const a = r() * TAU, d = 110 + r() * 90;
    const isl = new THREE.Group();
    const top = M(G.cyl8, 0x6ad64f, 6 + r() * 6, 2, 6 + r() * 6); isl.add(top);
    const bot = M(G.cone6, 0x9a6a44, 7, 12, 7); bot.rotation.x = Math.PI; bot.position.y = -7; isl.add(bot);
    const tr = buildTree(2); tr.position.y = 1; isl.add(tr);
    isl.position.set(Math.cos(a) * d, -5 + r() * 30, Math.sin(a) * d - 50); W.root.add(isl);
    W.clouds.push({ m: isl, speed: 0, bob: r() * TAU });
  }
  skyClouds(18, 20, 60, 50, 200, 13);

  // ---- Start island + blue side trip ----
  addIsland(0, 0, 0, 14, 14, 'grass', 3);
  addHint(-3, 0, 3.2, 'Step on the <b>!</b> switch to swap <b>RED</b> and <b>BLUE</b> blocks. A GROK STAR waits to the east&hellip;', null, 3);
  addToggleSwitch(0, 0, -3.5);
  for (let i = 0; i < 7; i++) addColorBlock(0, 0, -8 - 2 * i, 2, 2, 'red');
  for (const x of [8, 10, 12, 14]) addColorBlock(x, 0, 0, 2, 2, 'blue');
  addIsland(18, 0, 0, 6, 6, 'grass', 2);
  addItem('star', 18.8, 1.4, 0, { idx: 0 });
  addWalker(17, 0, 1.6);
  coinLine(8, 1, 0, 14, 1, 0, 4);
  coinLine(0, 0.9, -8, 0, 0.9, -20, 5);
  addTree(-5, 0, -5, 0.9); addTree(4.5, 0, 5, 0.8);

  // ---- Island 2 ----
  addIsland(0, 0, -26, 10, 10, 'grass', 3);
  addCheckpoint(-1.6, 0, -22.6, 0);
  addToggleSwitch(2.5, 0, -24);
  addHint(-3.6, 0, -22.6, 'Swap the colors again to cross the <b>BLUE</b> bridge!', null, 2.5);
  addSpiky(-3.5, 0, -29, 3.5, -29);
  const bz = [-32, -34.2, -36.4, -38.6, -40.8, -43], bt = [0.15, 0.3, 0.45, 0.6, 0.8, 1.0];
  for (let i = 0; i < bz.length; i++) addColorBlock(0, bt[i], bz[i], 2.2, 2.2, 'blue');
  coinLine(0, 1.2, -32, 0, 2, -43, 5);
  // secret ledge under island 2
  addBox(-8, -4, -26, 4, 3, 1, 'cloud');
  addSpring(-7, -4, -26);
  addItem('star', -9, -2.8, -26, { idx: 2 });
  addItem('coin', -5.8, -0.5, -26); addItem('coin', -6.8, -2.0, -26);

  // ---- Island 3 (fire bar) ----
  addIsland(0, 1, -50, 12, 12, 'grass', 3);
  addBox(0, 2, -50, 1, 1, 1, 'stone');
  addFirebar(0, 1.55, -50, 4, 1.35, 0);
  addCheckpoint(4.2, 1, -45.4, 0);
  addHint(-4.2, 1, -45.2, 'Careful: <b>fire bar</b>! Jump over it or go around.', null, 2.4);
  addBee(4, 4, -47); addWalker(-3, 1, -53.5);
  coinRing(0, 2.2, -50, 5, 8);
  addQBlock(4, 4.4, -53.5, 'coins');

  // ---- Mover to plaza ----
  addMover(0, 1, -58.5, 3, 3, [0, 0, -7.9], 5, 0);

  // ---- Island 4: Simon plaza ----
  addIsland(0, 2, -76, 16, 16, 'grass', 3, { bare: true });
  addCheckpoint(2.2, 2, -69.4, 0);
  addHint(-2.4, 2, -69.4, '<b>MEMORY PUZZLE!</b> Step on the <b>white pad</b>, watch the crystal, then step on the colored pads in the <b>same order</b>.', null, 2.6);
  addSpring(6, 2, -70);
  addBox(6, 8.5, -64.5, 4, 4, 0.8, 'cloud');
  addItem('star', 6, 9.8, -64.5, { idx: 1 });
  addBox(-11, 3, -77, 2, 2, 6, 'stone');
  addTurret(-11, 3, -77);
  addBee(5, 5.5, -80);
  const rainbow = [0xff3b5c, 0xff9d2e, 0xffe14a, 0x59d65a, 0x3b8bff];
  const rz = [-85.2, -87.4, -89.6, -91.8, -94];
  const bridge = rz.map((z, i) => addAppearBlock(0, 2.34 + i * 0.34, z, 2.4, 2.2, rainbow[i]));
  W.simon = addSimon({ top: 2, start: [0, -71], pads: [[-4.5, -74.5], [4.5, -74.5], [-4.5, -81], [4.5, -81]], crystal: [0, -77.75], length: 4,
    onSolve: () => bridge.forEach((b, i) => b.appear(0.4 + i * 0.28)) });
  coinLine(0, 3.4, -85.2, 0, 4.7, -94, 5);
  addFalling(0, 3.7, -97.6, 2.6, 2.6); addFalling(1.2, 3.7, -101, 2.6, 2.6);

  // ---- Goal island ----
  addIsland(0, 3.7, -108, 8, 8, 'grass', 3);
  addCheckpoint(2.5, 3.7, -105.2, 0);
  addWalker(-2.5, 3.7, -110.5);
  addGoal(0, 3.7, -109, 'star');

  W.titleFocus = new V3(0, 1, -10);
  W.scenery = (dt, t) => { for (const c of W.clouds) if (c.bob !== undefined) c.m.position.y += Math.sin(t * 0.5 + c.bob) * 0.01; };
}

// =====================================================================
// LEVEL 3 — LAVA CASTLE
// =====================================================================
function buildLava() {
  setupEnv({ top: 0x1a0620, horizon: 0xff6a3a, bottom: 0xff3a1a, fog: 0x6a2028, fogNear: 55, fogFar: 210, hemiSky: 0xffb090, hemiGround: 0x802010, hemiI: 0.55, sunColor: 0xffb880, sunI: 0.8, amb: 0.12 });
  W.killY = -20; W.lavaY = -1.4;
  const lgeo = new THREE.PlaneGeometry(700, 700, 70, 70); lgeo.rotateX(-Math.PI / 2);
  const lava = new THREE.Mesh(lgeo, mat(0xff4a10, { emissive: 0xff2a00, emissiveIntensity: 0.7 }));
  lava.position.set(0, -1.6, -50); W.root.add(lava); W.lavaMesh = lava;
  W.lavaBase = Float32Array.from(lgeo.attributes.position.array);
  const r = mulberry(21);
  for (let i = 0; i < 10; i++) {
    const a = r() * TAU, d = 120 + r() * 100, s = 20 + r() * 25;
    const v = M(G.cone6, 0x3a2030, s, s * 1.3, s); v.position.set(Math.cos(a) * d, -2 + s * 0.6, Math.sin(a) * d - 50); W.root.add(v);
    const top = new THREE.Mesh(G.cyl8, basic(0xff7a1c)); top.scale.set(s * 0.18, 1, s * 0.18); top.position.set(v.position.x, -2 + s * 1.25, v.position.z); W.root.add(top);
  }

  // ---- Entry ----
  addBox(0, 0, 0, 14, 16, 6, 'castle');
  addTorchDecor(-6.2, 0, 7.2); addTorchDecor(6.2, 0, 7.2); addTorchDecor(-6.2, 0, -7.2); addTorchDecor(6.2, 0, -7.2);
  addHint(-3, 0, 4, '<b>Lava burns!</b> While running, press <b>SHIFT</b> to <b>LONG JUMP</b>. Standing still, press it to <b>SPIN ATTACK</b>.',
    '<b>Lava burns!</b> While running, tap <b>ACTION</b> to <b>LONG JUMP</b>. Standing still, tap it to <b>SPIN ATTACK</b>.', 3);
  addWalker(3, 0, -3);
  coinLine(0, 0.9, 2, 0, 0.9, -5, 4);
  addHint(3.4, 0, -6.4, 'Time your run under the <b>CRUSHER</b>!', null, 2.4);

  // ---- Crusher bridge ----
  addBox(0, 0, -11, 3, 3, 6, 'castle');
  addCheckpoint(1.0, 0, -10.6, 0);
  addBox(0, 0, -19, 2.6, 10, 6, 'castle');
  addThwomp(0, 0, -19, 3.4);
  addItem('coin', 0, 6.7, -19); addItem('coin', 1.8, 8.4, -19);
  addBox(3.6, 7.6, -19, 2.2, 2.2, 0.6, 'castle');
  addItem('star', 3.6, 8.9, -19, { idx: 0 });
  addFalling(0, 0, -26.2, 2.6, 2.6); addFalling(0, 0, -29.8, 2.6, 2.6);

  // ---- Courtyard puzzle ----
  addBox(0, 0, -44, 24, 24, 6, 'stone');
  addCheckpoint(-1.6, 0, -34.2, 0);
  addHint(-4.4, 0, -34.4, '<b>PUZZLE:</b> Push the <b>crate</b> onto the switch to raise a bridge out of the lava! (Blue button = reset crate.)', null, 3);
  addBox(0, 1, -44, 4, 4, 1, 'stone');
  addTorchDecor(0, 1, -44);
  addBox(4, 2.5, -38, 2, 2, 2.5, 'castle');
  addBox(0, 2.5, -50, 2, 2, 2.5, 'castle');
  const cb = addPushBlock(-7, 0, -40);
  const sw = addPressureSwitch(8, 0, -51);
  addResetPad(-9.5, 0, -36, [cb]);
  const risers = [15.5, 20, 24.5].map((x) => addRiser(x, 0, -44, 3, 3, 4, 'castle', 3.8));
  sw.onPress = () => { risers.forEach((rr, i) => rr.rise(0.3 + i * 0.5)); showToast('<b>A bridge rises from the lava!</b>', 3); shakeAmt = 0.3; Snd.S.bridge(); };
  addBox(29, 0, -44, 6, 6, 6, 'castle');
  addBox(29, 1, -44, 1, 1, 1, 'stone');
  addFirebar(29, 0.55, -44, 4, 1.3, 0);
  addItem('key', 29, 2.1, -44);
  addWalker(5, 0, -34); addWalker(-6, 0, -52); addBee(-2, 4, -47);
  coinLine(14, 1.5, -44, 25, 1.5, -44, 4);
  addBox(-19, 0, -44, 2.6, 2.6, 6, 'castle');
  addItem('star', -19, 1.4, -44, { idx: 1 });
  coinLine(-13.5, 2, -44, -17, 2.4, -44, 3);
  addQBlock(-6, 3.4, -46, '1up');

  // ---- Castle wall + locked door ----
  addBox(-9.25, 10, -57, 13.5, 2, 16, 'castle'); addBox(9.25, 10, -57, 13.5, 2, 16, 'castle');
  addBox(0, 10, -57, 5, 2, 5, 'castle');
  crenels(-15.5, 15.5, -57, -57, 10);
  addTower(-17, -57, 2.6, 17, -2); addTower(17, -57, 2.6, 17, -2);
  addBox(0, 0, -57, 5, 2, 6, 'castle');
  addLockedDoor(0, 5, -57, 5, 1, 5, 'door');
  addTorchDecor(-3.4, 0, -55); addTorchDecor(3.4, 0, -55);
  addHint(-5, 0, -53.5, 'The castle door is <b>locked</b>. The <b>KEY</b> is across the lava!', null, 2.6);

  // ---- Castle keep ----
  addBox(0, 0, -62, 8, 8, 6, 'castle');
  addCheckpoint(-1.5, 0, -60.4, 0);
  addWalker(2, 0, -63.5);
  addMover(0, 0, -68, 3, 3, [0, 0, -8.5], 4.5, 0);
  coinLine(0, 1.4, -68, 0, 1.4, -76, 3);
  addBox(0, 1, -84, 8, 10, 6, 'castle');
  addCheckpoint(2.8, 1, -80.2, 0);
  addHint(-2.8, 1, -79.6, 'Hop over the <b>fire bars</b>, then use the spring to climb the tower!', null, 2.2);
  addBox(-2, 2, -82, 1, 1, 1, 'stone'); addFirebar(-2, 1.55, -82, 4, 1.35, 0);
  addBox(2, 2, -86.5, 1, 1, 1, 'stone'); addFirebar(2, 1.55, -86.5, 4, -1.35, Math.PI);
  addBox(6.5, 2.5, -88, 2, 2, 8, 'castle'); addTurret(6.5, 2.5, -88);
  addBee(0, 4.5, -84);
  addFalling(-6.2, 2.4, -82, 2.6, 2.6);
  addBox(-9.2, 4, -85, 2.4, 2.4, 1, 'castle');
  addItem('star', -9.2, 5.3, -85, { idx: 2 });
  addBox(0, 3, -92.5, 3, 3, 1, 'castle');
  addSpring(0, 3, -92.5);
  addBox(0, 9, -100, 7, 7, 16, 'castle');
  for (const x of [-3, -1, 1, 3]) addBox(x, 10, -103, 1, 1, 1, 'castle');
  for (const z of [-101, -99]) { addBox(-3, 10, z, 1, 1, 1, 'castle'); addBox(3, 10, z, 1, 1, 1, 'castle'); }
  addTorchDecor(-2.5, 9, -97.2); addTorchDecor(2.5, 9, -97.2);
  addGoal(0, 9, -100.5, 'star');
  // enclosing walls (scenery)
  addBox(-15, 14, -82, 2, 50, 20, 'castle', 'static', { noCast: true });
  addBox(15, 14, -82, 2, 50, 20, 'castle', 'static', { noCast: true });
  addBox(0, 18, -112, 32, 2, 24, 'castle', 'static', { noCast: true });
  for (const z of [-64, -76, -88, -100]) { addTorchDecor(-13.6, 3, z); addTorchDecor(13.6, 3, z); }

  W.titleFocus = new V3(0, 1, -8);
  let emberT = 0;
  W.scenery = (dt, t) => {
    const pos = lgeo.attributes.position, base = W.lavaBase;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], z = base[i * 3 + 2];
      pos.array[i * 3 + 1] = Math.sin(x * 0.15 + t * 1.3) * 0.18 + Math.cos(z * 0.12 + t * 0.9) * 0.18;
    }
    pos.needsUpdate = true;
    emberT += dt;
    if (emberT > 0.08 && mode === 'playing') {
      emberT = 0;
      burst(P.pos.x + (Math.random() - 0.5) * 30, W.lavaY, P.pos.z + (Math.random() - 0.5) * 30, Math.random() < 0.5 ? 0xff7a1c : 0xffd23f, 1, 2, 2.2, -1.5, 1.2);
    }
  };
}

// =====================================================================
// LEVEL 4 — FROSTBITE PEAKS (2.0)
// =====================================================================
function snowfall(n, area) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * area; pos[i * 3 + 1] = Math.random() * 30; pos[i * 3 + 2] = (Math.random() - 0.5) * area; }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.22, transparent: true, opacity: 0.85, depthWrite: false }));
  pts.frustumCulled = false;
  W.root.add(pts);
  return (dt, t) => {
    const a = geo.attributes.position.array;
    for (let i = 0; i < n; i++) {
      a[i * 3 + 1] -= dt * (1.6 + (i % 5) * 0.25);
      a[i * 3] += Math.sin(t * 0.7 + i) * dt * 0.4;
      if (a[i * 3 + 1] < -6) a[i * 3 + 1] += 34;
    }
    geo.attributes.position.needsUpdate = true;
    pts.position.set(Math.round(P.pos.x / 10) * 10, P.pos.y - 6, Math.round(P.pos.z / 10) * 10);
  };
}
function addPine(x, top, z, s) {
  s = s || 1;
  const g = new THREE.Group();
  const trunk = M(G.cyl8, 0x6b3b1f, 0.2 * s, 0.8 * s, 0.2 * s); trunk.position.y = 0.4 * s; g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const c = M(G.cone6, 0x2f7a5a, (1.3 - i * 0.3) * s, 1.3 * s, (1.3 - i * 0.3) * s); c.position.y = (1.2 + i * 0.8) * s; g.add(c);
    const sn = M(G.cone6, 0xffffff, (0.75 - i * 0.18) * s, 0.5 * s, (0.75 - i * 0.18) * s); sn.position.y = (1.65 + i * 0.8) * s; g.add(sn);
  }
  shadowy(g, true, false);
  g.position.set(x, top, z); g.rotation.y = Math.random() * TAU; W.root.add(g);
  addSolid(x, top + 1.2 * s, z, 0.35 * s, 1.2 * s, 0.35 * s, 'static', null).noCam = true;
}
function iceArch(z, top, w, h) {
  addBox(-w / 2, top + h, z, 1.4, 1.4, h, 'rock');
  addBox(w / 2, top + h, z, 1.4, 1.4, h, 'rock');
  const lintel = addBox(0, top + h + 1.2, z, w + 2.4, 1.6, 1.2, 'rock');
  for (let i = -2; i <= 2; i++) { const ic = M(G.cone6, mat(0xcff2ff, { emissive: 0x2a6a8a }), 0.18, 0.6, 0.18); ic.rotation.x = Math.PI; ic.position.set(i * w / 5, top + h - 0.3, z + 0.7); W.root.add(ic); }
  return lintel;
}
function buildFrost() {
  setupEnv({ top: 0x4a7fd8, horizon: 0xe4f2ff, bottom: 0xcfe6ff, fog: 0xe4f2ff, fogNear: 60, fogFar: 240, hemiSky: 0xf2f8ff, hemiGround: 0x8aa0c0, hemiI: 0.85, sunColor: 0xfff6ea, sunI: 0.85, amb: 0.24, sunSprite: 0xfff8e0 });
  W.killY = -14;
  const r = mulberry(41);
  // distant snowy peaks
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU + r() * 0.3, d = 150 + r() * 80, s = 25 + r() * 30;
    const mtn = M(G.cone6, 0x8a9cba, s, s * 1.6, s); mtn.position.set(Math.cos(a) * d, -20 + s * 0.8, Math.sin(a) * d - 50); W.root.add(mtn);
    const cap = M(G.cone6, 0xffffff, s * 0.45, s * 0.72, s * 0.45); cap.position.set(mtn.position.x, -20 + s * 1.6 - s * 0.36 + 0.5, mtn.position.z); W.root.add(cap);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), mat(0xdfeaf6, { emissive: 0x334455 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -22; W.root.add(floor);
  skyClouds(14, 25, 60, 60, 200, 17);

  // ---- Start plateau ----
  addIsland(0, 0, 0, 16, 16, 'snow', 3);
  addHint(-3, 0, 4.5, '<b>FROSTBITE PEAKS!</b> Shiny blue <b>ICE</b> is slippery &mdash; ease off early to stop. Watch for <b>icicles</b> overhead!', null, 3);
  addPine(-6, 0, -5, 1.1); addPine(6.2, 0, 5.5, 0.9); addPine(-6.5, 0, 5, 0.8);
  addPenguin(3.5, 0, -4);
  coinLine(0, 0.9, 3, 0, 0.9, -6, 5);
  addQBlock(3, 3.4, 1, 'coins');
  // hidden star 1: invisible ice steps off the east edge
  addHint(6.6, 0, -1.2, 'Something <b>sparkles</b> out over the edge&hellip;', null, 1.8);
  addSecretBlock(10.5, -0.4, -1, 2.4, 2.4, 'ice');
  addSecretBlock(13.8, -0.9, -3.4, 2.4, 2.4, 'ice');
  addIsland(17, -1.2, -6.5, 3.2, 3.2, 'snow', 1.2, { bare: true });
  addItem('star', 17, 0.2, -6.5, { idx: 0 });

  // ---- Ice bridge with icicle arches ----
  const bridge = addBox(0, 0, -14, 5, 12, 2, 'ice'); bridge.ice = 1;
  iceArch(-11.5, 0, 6, 4.4);
  const lintel2 = iceArch(-17, 0, 6, 4.4);
  addIcicle(-1, 4.4, -11.5, 0); addIcicle(1, 4.4, -17, 0);
  coinLine(0, 0.9, -9.5, 0, 0.9, -19, 5);

  // ---- Island 2 ----
  addIsland(0, 0, -26, 12, 12, 'snow', 3);
  addCheckpoint(-1.3, 0, -22.4, 0);
  addSnowman(3.5, 0, -29.5);
  addHint(-3.5, 0, -28.5, '<b>Snowmen</b> lob snowballs &mdash; keep moving, then stomp them!', null, 2.2);
  addPine(-4.6, 0, -30.5, 0.9);
  // star 2: spring up to the high ledge, then onto the second arch
  addSpring(5, 0, -23.2);
  addBox(5, 5.6, -19, 3, 3, 1, 'rock');
  addItem('star', 0, 6.9, -17, { idx: 1 });
  addItem('coin', 5, 6.6, -19);
  void lintel2;
  // stepping mounds to the rink
  addIsland(0, 0, -35, 2.6, 2.6, 'snow', 1.5, { bare: true });

  // ---- Ice rink puzzle ----
  const RZ = -50; // rink center
  const rink = addBox(0, 0, RZ, 16, 16, 3, 'ice', 'static', { noCast: true }); rink.ice = 0.5;
  addBox(0, 0, -40, 24, 4, 3, 'snow', 'static', { noCast: true });   // north strip  z -38..-42
  addBox(0, 0, -62, 24, 8, 3, 'snow', 'static', { noCast: true });   // south strip  z -58..-66
  addBox(-10, 0, RZ, 4, 16, 3, 'snow', 'static', { noCast: true });  // west strip
  addBox(10, 0, RZ, 4, 16, 3, 'snow', 'static', { noCast: true });   // east strip
  // low rink curbs: they stop the crate, but you can just step over them
  addBox(0, 0.3, -41.75, 16, 0.5, 0.3, 'rock'); addBox(0, 0.3, -58.25, 16, 0.5, 0.3, 'rock');
  addBox(-8.25, 0.3, RZ, 0.5, 17, 0.3, 'rock'); addBox(8.25, 0.3, RZ, 0.5, 17, 0.3, 'rock');
  addCheckpoint(-1.2, 0, -39.3, 0);
  addHint(3.6, 0, -39.2, '<b>ICE PUZZLE:</b> One shove sends the <b>ice crate</b> sliding until it hits something. Stop it right on the <b>yellow switch</b>! (Blue button = reset)', null, 3.2);
  const cr = addIcePushBlock(1, 0, -45);
  const pill = (x, z, h, style) => addBox(x, h, z, 2, 2, h, style || 'rock');
  pill(-5, -45, 1.6); pill(-3, -57, 1.6); pill(3, -49, 1.6); pill(-7, -51, 1.6);
  pill(7, -55, 6.5, 'ice');
  const sw = addPressureSwitch(5, 0, -55);
  addResetPad(-5, 0, -40, [cr]);
  addItem('star', 7, 7.8, -55, { idx: 2 });
  coinLine(-3, 0.9, -47, -3, 0.9, -53, 3);
  coinLine(-1, 0.9, -55, 3, 0.9, -55, 3);
  addPenguin(-9.5, 0, -50);
  // gate wall at the south end of the rink area
  addBox(-7.25, 8, -66, 9.5, 2, 8, 'rock'); addBox(7.25, 8, -66, 9.5, 2, 8, 'rock');
  const gate = addGate(0, 8, -66, 5, 1, 8);
  sw.onPress = () => { gate.open(); Snd.S.solve(); showToast('<b>PERFECT STOP!</b> The ice gate opens!', 3); };
  addPine(-10, 0, -60, 1.1); addPine(10.4, 0, -61, 1); addPine(10, 0, -40, 0.9);

  // ---- Summit climb ----
  addIsland(0, 0, -71, 4, 4, 'snow', 2, { bare: true });
  addIsland(0, 1.5, -76.5, 3, 3, 'snow', 1.5, { bare: true });
  addFalling(3.5, 3, -81, 3, 3);
  addIsland(0, 4.5, -85.5, 3, 3, 'snow', 1.5, { bare: true });
  coinLine(0, 2.6, -76.5, 0, 5.6, -85.5, 4);
  // ---- Summit ----
  addIsland(0, 6, -95, 12, 14, 'snow', 3);
  addCheckpoint(-1.3, 6, -89.6, 0);
  addSnowman(-4, 6, -98);
  addPenguin(3, 6, -94);
  iceArch(-93, 6, 6, 4.4);
  addIcicle(0, 10.4, -93, 6);
  addPine(4.5, 6, -100, 1.1); addPine(-4.8, 6, -91.5, 0.8);
  addBox(0, 7, -99.5, 4, 4, 1, 'ice');
  addGoal(0, 7, -99.5, 'star');

  W.titleFocus = new V3(0, 1, -8);
  const snow = snowfall(IS_TOUCH ? 220 : 500, 60);
  W.scenery = (dt, t) => snow(dt, t);
}
// =====================================================================
// LEVEL 5 — GHOST MANOR (2.0)
// =====================================================================
function addTombstone(x, top, z, ry) {
  const g = new THREE.Group();
  const slab = M(G.box, 0x8a87a0, 0.9, 1.1, 0.25); slab.position.y = 0.55; g.add(slab);
  const cap = M(G.cyl8, 0x8a87a0, 0.45, 0.25, 0.45); cap.rotation.x = Math.PI / 2; cap.position.y = 1.1; g.add(cap);
  const crossV = M(G.box, 0x5a5770, 0.12, 0.45, 0.04); crossV.position.set(0, 0.75, 0.14); g.add(crossV);
  const crossH = M(G.box, 0x5a5770, 0.3, 0.1, 0.04); crossH.position.set(0, 0.82, 0.14); g.add(crossH);
  shadowy(g, true, false);
  g.position.set(x, top, z); g.rotation.set(0, ry || 0, (Math.random() - 0.5) * 0.15); W.root.add(g);
  addSolid(x, top + 0.6, z, 0.45, 0.6, 0.2, 'static', null).noCam = true;
}
function addDeadTree(x, top, z, s) {
  s = s || 1;
  const g = new THREE.Group();
  const tm = mat(0x3a2e40);
  const trunk = new THREE.Mesh(G.cyl8, tm); trunk.scale.set(0.25 * s, 3 * s, 0.25 * s); trunk.position.y = 1.5 * s; g.add(trunk);
  for (let i = 0; i < 4; i++) {
    const br = new THREE.Mesh(G.cyl8, tm); br.scale.set(0.09 * s, 1.4 * s, 0.09 * s);
    const a = (i / 4) * TAU + 0.5;
    br.position.set(Math.cos(a) * 0.5 * s, (2 + i * 0.3) * s, Math.sin(a) * 0.5 * s);
    br.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); g.add(br);
  }
  g.position.set(x, top, z); W.root.add(g);
  addSolid(x, top + 1.5 * s, z, 0.3 * s, 1.5 * s, 0.3 * s, 'static', null).noCam = true;
}
function addLantern(x, top, z, color) {
  const g = new THREE.Group();
  const post = M(G.cyl8, 0x2a2344, 0.08, 2.2, 0.08); post.position.y = 1.1; g.add(post);
  const box = new THREE.Mesh(G.box, basic(color || 0xffc070)); box.scale.set(0.32, 0.4, 0.32); box.position.y = 2.35; g.add(box);
  const roof = M(G.cone, 0x2a2344, 0.3, 0.25, 0.3); roof.position.y = 2.68; g.add(roof);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: color || 0xffa040, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.scale.setScalar(3.5); glow.position.y = 2.35; g.add(glow);
  g.position.set(x, top, z); W.root.add(g);
}
function buildManor() {
  setupEnv({ top: 0x0c0820, horizon: 0x4a2a6a, bottom: 0x2a1a40, fog: 0x2a1c44, fogNear: 40, fogFar: 170, hemiSky: 0xb8a8ff, hemiGround: 0x2a2040, hemiI: 0.75, sunColor: 0xc8d0ff, sunI: 0.75, amb: 0.22 });
  W.killY = -14;
  // moon
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xfff6d0, transparent: true, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  moon.scale.setScalar(120); moon.position.set(-150, 160, -320); W.sky.add(moon);
  const moonCore = new THREE.Mesh(new THREE.CircleGeometry(16, 24), new THREE.MeshBasicMaterial({ color: 0xfff8e0, fog: false }));
  moonCore.position.copy(moon.position); moonCore.lookAt(0, 0, 0); W.sky.add(moonCore);
  // stars in the sky
  const sg = new THREE.BufferGeometry(), sp = new Float32Array(300 * 3), rr = mulberry(77);
  for (let i = 0; i < 300; i++) { const a = rr() * TAU, el = 0.15 + rr() * 1.2; sp[i * 3] = Math.cos(a) * Math.cos(el) * 450; sp[i * 3 + 1] = Math.sin(el) * 450; sp[i * 3 + 2] = Math.sin(a) * Math.cos(el) * 450; }
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  W.sky.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false })));
  // misty floor far below
  const mist = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), basic(0x3a2a5a, { transparent: true, opacity: 0.9 }));
  mist.rotation.x = -Math.PI / 2; mist.position.y = -16; W.root.add(mist);
  const r = mulberry(55);
  for (let i = 0; i < 12; i++) {
    const a = r() * TAU, d = 120 + r() * 90;
    const sil = M(G.box, 0x1a1030, 10 + r() * 20, 30 + r() * 40, 10 + r() * 20); sil.position.set(Math.cos(a) * d, -10, Math.sin(a) * d - 50); W.root.add(sil);
  }

  // ---- Graveyard start ----
  addIsland(0, 0, 0, 16, 16, 'grave', 3, { bare: true });
  addHint(-3, 0, 4.5, '<b>GHOST MANOR!</b> Ghosts creep closer when you <b>turn your back</b>. Face them to freeze them, then <b>SPIN</b> to bust them!',
    '<b>GHOST MANOR!</b> Ghosts creep closer when you <b>turn your back</b>. Face them to freeze them, then tap <b>ACTION</b> to spin!', 3);
  for (const [x, z, ry] of [[-5, -3, 0.2], [-3, -5, -0.1], [5, -2, 0.1], [4.5, 3, -0.2], [-6, 2, 0.3]]) addTombstone(x, 0, z, ry);
  addDeadTree(6, 0, -6, 1); addDeadTree(-6.5, 0, -6.2, 0.8);
  addLantern(-2.5, 0, -7.2); addLantern(2.5, 0, -7.2, 0xa0ffc0);
  addGhost(2, 1.2, -5);
  coinLine(0, 0.9, 3, 0, 0.9, -5, 5);
  addHint(2.8, 0, -6.6, '<b>Phantom platforms</b> fade in and out. When they <b>flicker</b>, jump!', null, 2.2);

  // ---- Phantom path (two alternating groups: one is always solid) ----
  const ph = [[0, -11.5, 0], [0, -15, 2], [0, -18.5, 0], [0, -22, 2]];
  for (const [x, z, p] of ph) addPhantom(x, 0, z, 2.8, 2.8, 2.8, 1.2, p);
  coinLine(0, 1.2, -11.5, 0, 1.2, -22, 4);
  addIsland(0, 0, -25.7, 2.4, 2.4, 'grave', 1.5, { bare: true });
  // hidden star 3: secret steps off the phantom path to a floating crypt
  addSecretBlock(3.6, 0.4, -18.5, 2.2, 2.2, 'phantom');
  addSecretBlock(6.8, 0.9, -20.5, 2.2, 2.2, 'phantom');
  addIsland(10, 1.2, -22.5, 3.4, 3.4, 'grave', 1.5, { bare: true });
  addTombstone(10.8, 1.2, -23.4, 0);
  addItem('star', 9.8, 2.6, -22, { idx: 2 });

  // ---- Courtyard with the candle puzzle ----
  addIsland(0, 0, -40, 24, 24, 'grave', 3, { bare: true });
  addCheckpoint(-1.3, 0, -29.6, 0);
  addHint(3, 0, -29.6, '<b>CANDLE PUZZLE:</b> <b>GROUND POUND</b> each of the 4 candles to light it (jump, then press <b>SHIFT</b>). Light them all before any burns out!',
    '<b>CANDLE PUZZLE:</b> <b>GROUND POUND</b> each of the 4 candles to light it (jump, then tap <b>ACTION</b>). Light them all before any burns out!', 3);
  // ledges
  addBox(6.2, 1.2, -33.5, 1.8, 1.8, 1.2, 'manor');          // crate step
  addBox(9, 2.6, -37, 4, 4, 2.6, 'manor');                   // C2 ledge  top 2.6
  addBox(8.5, 3.7, -42, 2.4, 2.4, 0.8, 'manor');             // floating step top 3.7
  addBox(8, 4.8, -47, 4, 3, 1, 'manor');                     // C4 balcony top 4.8
  addBox(-8, 3.4, -46, 4, 4, 3.4, 'manor');                  // mausoleum top 3.4
  addBox(-5.2, 1.2, -46, 1.6, 1.6, 1.2, 'manor');            // tomb step
  const candles = [[-8, 0, -34], [9.5, 2.6, -37.5], [8.5, 4.8, -47.2], [-8.3, 3.4, -46.3]];
  const doorGate = { g: null };
  W.candles = addCandles({ spots: candles, duration: 40, onAll: () => doorGate.g.open() });
  addLantern(-10.5, 0, -29.5); addLantern(10.5, 0, -29.5, 0xa0ffc0); addLantern(-10.5, 0, -51); addLantern(10.5, 0, -51);
  addGhost(-4, 1.2, -42); addGhost(5, 1.5, -46);
  addTombstone(-2, 0, -36, 0.1); addTombstone(3, 0, -38, -0.2); addTombstone(-3, 0, -48, 0);
  addDeadTree(-10, 0, -40, 1.1);
  coinRing(0, 0.9, -41, 3, 8);
  addQBlock(0, 3.4, -44, '1up');
  // hidden star 1: invisible steps off the west side
  addSecretBlock(-14, 0.5, -38, 2.2, 2.2, 'phantom');
  addSecretBlock(-17.2, 1.2, -40.5, 2.2, 2.2, 'phantom');
  addIsland(-20.5, 2, -43, 3, 3, 'grave', 1.2, { bare: true });
  addItem('star', -20.5, 3.4, -43, { idx: 0 });

  // ---- Manor facade + gate ----
  addBox(-7.25, 10, -52, 9.5, 1.5, 10, 'manor'); addBox(7.25, 10, -52, 9.5, 1.5, 10, 'manor');
  addBox(0, 10, -52, 5, 1.5, 4, 'manor');
  doorGate.g = addGate(0, 6, -52, 5, 1, 6);
  for (const x of [-9, -5, 5, 9]) { const w = new THREE.Mesh(G.box, basic(0xffd27a)); w.scale.set(1.4, 1.8, 0.1); w.position.set(x, 6.5, -51.2); W.root.add(w); }
  const roofL = M(G.cone, 0x2a1c3c, 8, 5, 3); roofL.scale.set(13, 5, 2); roofL.position.set(0, 12.5, -52.6); roofL.rotation.y = Math.PI / 4; W.root.add(roofL);

  // ---- Haunted hall ----
  addBox(0, 0, -56, 14, 8, 4, 'manor');          // floor A  z -52..-60
  addCheckpoint(-1.3, 0, -54.2, 0);
  addHint(4.2, 0, -54.6, 'More phantom floor ahead &mdash; and the ghosts are <b>hungry</b>. Keep an eye behind you!', null, 2.2);
  addPhantom(-2.2, 0, -61.7, 2.8, 2.8, 2.6, 1.4, 0); addPhantom(2.2, 0, -61.7, 2.8, 2.8, 2.6, 1.4, 2);
  addPhantom(-2.2, 0, -64.3, 2.8, 2.8, 2.6, 1.4, 2); addPhantom(2.2, 0, -64.3, 2.8, 2.8, 2.6, 1.4, 0);
  addBox(0, 0, -70, 14, 8, 4, 'manor');          // floor B  z -66..-74
  addCheckpoint(1.4, 0, -67.4, 0);
  addGhost(-3, 1.3, -69); addGhost(3.5, 1.3, -72);
  // walls (scenery)
  addBox(-7.5, 9, -63, 1, 22, 13, 'manor', 'static', { noCast: true }); addBox(7.5, 9, -63, 1, 22, 13, 'manor', 'static', { noCast: true });
  for (const z of [-56, -62, -68, -74]) { addTorchDecor(-6.4, 0, z); addTorchDecor(6.4, 0, z); }
  // star 2: spring to the chandelier
  addSpring(-4.5, 0, -69.3);
  addBox(-4.5, 6.5, -65.5, 3, 3, 0.5, 'gold');
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; const cnd = new THREE.Mesh(G.cyl8, mat(0xf4ecd8)); cnd.scale.set(0.08, 0.35, 0.08); cnd.position.set(-4.5 + Math.cos(a) * 1.3, 6.7, -65.5 + Math.sin(a) * 1.3); W.root.add(cnd); const fl = new THREE.Mesh(G.cone6, basic(0xffb030)); fl.scale.set(0.07, 0.18, 0.07); fl.position.set(cnd.position.x, 7, cnd.position.z); W.root.add(fl); }
  const chain = M(G.cyl8, 0x2a2344, 0.05, 8, 0.05); chain.position.set(-4.5, 10.5, -65.5); W.root.add(chain);
  addItem('star', -4.5, 7.9, -65.5, { idx: 1 });
  // stairs up to the roof
  addBox(0, 1.4, -75.5, 6, 3, 1.4, 'manor');
  addBox(0, 2.8, -78, 6, 2, 2.8, 'manor');
  addBox(0, 4.2, -80, 6, 2, 4.2, 'manor');
  addBox(0, 5.6, -84, 8, 6, 5.6, 'manor');
  addLantern(-3.3, 5.6, -82); addLantern(3.3, 5.6, -82, 0xa0ffc0);
  addGoal(0, 5.6, -85.2, 'star');

  W.titleFocus = new V3(0, 1, -8);
  W.scenery = (dt, t) => { mist.position.y = -16 + Math.sin(t * 0.4) * 0.3; };
}
// =====================================================================
// LEVEL 6 — CLOCKWORK FACTORY (2.0)
// =====================================================================
function addSmokestack(x, z, h) {
  const c = M(G.cyl8, 0x5a4a44, 3, h, 3); c.position.set(x, -20 + h / 2, z); W.root.add(c);
  const band = M(G.cyl8, 0xb07a25, 3.2, 1.2, 3.2); band.position.set(x, -20 + h - 3, z); W.root.add(band);
  return new V3(x, -20 + h + 1, z);
}
function buildFactory() {
  setupEnv({ top: 0x3a2a4a, horizon: 0xffa66a, bottom: 0xc0704a, fog: 0xd8906a, fogNear: 60, fogFar: 220, hemiSky: 0xffe0c0, hemiGround: 0x6a4a3a, hemiI: 0.8, sunColor: 0xffd0a0, sunI: 0.9, amb: 0.22, sunSprite: 0xffb070 });
  W.killY = -14;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), mat(0x4a3a36));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -22; W.root.add(floor);
  const r = mulberry(91);
  const stacks = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + r() * 0.4, d = 90 + r() * 80;
    stacks.push(addSmokestack(Math.cos(a) * d, Math.sin(a) * d - 50, 40 + r() * 40));
    const bld = M(G.box, 0x5a4a50, 20 + r() * 20, 20 + r() * 30, 20 + r() * 20); bld.position.set(Math.cos(a + 0.3) * (d + 20), -15, Math.sin(a + 0.3) * (d + 20) - 50); W.root.add(bld);
  }
  // big background gears
  const bgGears = [];
  for (let i = 0; i < 4; i++) {
    const gg = M(G.cyl, 0x6a5040, 14 + i * 3, 2, 14 + i * 3); gg.rotation.x = Math.PI / 2; gg.position.set(-70 + i * 45, 10 + (i % 2) * 15, -170); W.root.add(gg); bgGears.push(gg);
  }

  // ---- Start platform ----
  addIsland(0, 0, 0, 14, 14, 'metal', 3, { bare: true });
  addHint(-3, 0, 4, '<b>CLOCKWORK FACTORY!</b> Robots <b>spark</b> every few seconds &mdash; only stomp them when they are <b>NOT glowing blue</b>.', null, 3);
  addRobot(2.5, 0, -2, 2.5, -5.5, 0);
  coinLine(0, 0.9, 3, 0, 0.9, -5, 5);
  addBox(-5, 1, -5, 2, 2, 1, 'brass'); addBox(5.2, 0.8, 4.6, 1.6, 1.6, 0.8, 'brass');
  addHint(3, 0, -6, '<b>Conveyor belts</b> carry you along. Ride the arrows!', null, 2);

  // ---- Conveyor A (forward) ----
  addConveyor(0, 0, -13, 4, 12, 0, -4);
  coinLine(0, 1, -9, 0, 1, -17, 4);
  addBox(0, 0, -23, 6, 8, 3, 'metal');
  addCheckpoint(-1.6, 0, -21.2, 0);
  // ---- Conveyor B (sideways) + piston ----
  addConveyor(0, 0, -32, 5, 10, 2.6, 0);
  addPiston(4.4, 1.3, -32, 2, 2, 1.3, 'x', -2.2, 3.6, 0.2);
  addHint(-2.6, 0, -21.4, 'This belt drags you <b>sideways</b> and the <b>piston</b> shoves! Wait for the red light to stop.', null, 2);
  // star 1: hop onto the piston housing, then up to the ledge
  addBox(7.9, 3.2, -32, 2.6, 2.6, 0.6, 'brass');
  addItem('star', 7.9, 4.5, -32, { idx: 0 });

  // ---- Island C ----
  addIsland(0, 0, -44, 12, 10, 'metal', 3, { bare: true });
  addCheckpoint(-1.3, 0, -40.4, 0);
  addHint(3, 0, -40.2, '<b>Spinning gears</b> turn you around &mdash; keep your eyes on the next one.', null, 2.4);
  addRobot(-3, 0, -46.5, 3, -46.5, 1.7);
  addQBlock(3.5, 3.4, -44, 'coins');

  // ---- Gears ----
  addGear(0, 0, -54, 3, 0.65);
  addGear(3, 0.8, -61, 3, -0.75);
  coinRing(0, 1.2, -54, 1.6, 6);
  // hidden star 2: invisible steps east of the second gear
  addSecretBlock(7.6, 1.2, -61, 2.2, 2.2, 'brass');
  addSecretBlock(10.8, 1.8, -62.5, 2.2, 2.2, 'brass');
  addBox(14, 2.4, -64, 3, 3, 1, 'metal');
  addItem('star', 14, 3.8, -64, { idx: 1 });

  // ---- Island D: lever puzzle ----
  addIsland(0, 1.6, -72, 16, 14, 'metal', 3, { bare: true });
  addCheckpoint(-1.3, 1.6, -66.2, 0);
  addHint(2.8, 1.6, -66.2, '<b>LEVER PUZZLE:</b> Each lever flips some of the three <b>lights</b> over the gate. Light <b>all three</b> to open it!', null, 2.6);
  addBox(-6.25, 9.6, -79, 9.5, 1, 8, 'metal'); addBox(6.25, 9.6, -79, 9.5, 1, 8, 'metal');
  const gate = addGate(0, 7.6, -79, 3, 1, 6);
  addBox(0, 9.6, -79, 3, 1, 2, 'metal');
  W.levers = addLeverPuzzle({
    top: 1.6, init: [0, 1, 0],
    lamps: [[-3.2, 9.6, -78.6, 1.4], [0, 9.6, -78.6, 1.4], [3.2, 9.6, -78.6, 1.4]],
    levers: [[-4.5, -73, [0], 'A'], [0, -71.5, [0, 1], 'B'], [4.5, -73, [1, 2], 'C']],
    onSolve: () => gate.open(),
  });
  addRobot(-6, 1.6, -76, 6, -76, 0.9);
  // star 3: spring to the crane
  addSpring(6.2, 1.6, -67.5);
  addBox(6.2, 8.8, -71.8, 3, 3, 0.6, 'brass');
  const mast = M(G.box, 0xb07a25, 0.5, 9, 0.5); mast.position.set(7.9, 6, -73.4); W.root.add(mast);
  const jib = M(G.box, 0xb07a25, 10, 0.4, 0.4); jib.position.set(3, 10.6, -73.4); W.root.add(jib);
  addItem('star', 6.2, 10.1, -71.8, { idx: 2 });

  // ---- Final run: conveyor to the goal ----
  addConveyor(0, 1.6, -83.75, 4, 9.5, 0, -3);
  addPiston(4.1, 2.9, -85, 2, 2, 1.3, 'x', -2.2, 3.2, 0.6);
  addIsland(0, 1.6, -94, 10, 10, 'metal', 3, { bare: true });
  addRobot(-3, 1.6, -92, 3, -92, 2.4);
  addBox(0, 2.6, -96.5, 4, 4, 1, 'brass');
  addGoal(0, 2.6, -96.5, 'star');

  W.titleFocus = new V3(0, 1, -10);
  let puffT = 0;
  W.scenery = (dt, t) => {
    for (let i = 0; i < bgGears.length; i++) bgGears[i].rotation.y += dt * (i % 2 ? -0.2 : 0.25);
    puffT += dt;
    if (puffT > 0.5) { puffT = 0; const s = stacks[(Math.random() * stacks.length) | 0]; burst(s.x, s.y, s.z, 0x8a7a80, 2, 3, 3, -1.5, 6); }
    void t;
  };
}

// =====================================================================
// 3.0 — new mechanics for worlds 7 & 8 (all either local to each player or driven by W.time, so co-op stays in sync)
// =====================================================================
STYLE.sand = { side: 0xd9a35c, top: 0xf2cf84, cap: 0.35 };
STYLE.coral = { side: 0xf0607a, top: 0xffa8b6, cap: 0.2 };
STYLE.reef = { side: 0x24958e, top: 0x5fe0c8, cap: 0.22 };
STYLE.tide = { side: 0xc89050, top: 0xeac27a, cap: 0.2 };
STYLE.moon = { side: 0x7d7d96, top: 0xd6d6e6, cap: 0.3 };
STYLE.hull = { side: 0x4f5878, top: 0xa6b2d8, cap: 0.16 };
STYLE.neon = { side: 0x2a2060, top: 0x56f0ff, cap: 0.12, emissive: 0x10305a };
// Zones change the local player's gravity (low-gravity fields) or lift them (water spouts).
function zoneAt(x, y, z) {
  for (let i = 0; i < W.zones.length; i++) {
    const zn = W.zones[i];
    if (zn.active === false) continue;
    if (Math.abs(x - zn.x) < zn.hx && Math.abs(z - zn.z) < zn.hz && y > zn.y0 && y < zn.y1) return zn;
  }
  return null;
}
function addLowGrav(x, z, hx, hz, y0, y1, grav) {
  const zn = { x, z, hx, hz, y0, y1, grav: grav || 0.42, active: true };
  W.zones.push(zn);
  const g = new THREE.Group();
  const box = new THREE.Mesh(G.box, new THREE.MeshBasicMaterial({ color: 0xb070ff, transparent: true, opacity: 0.06, depthWrite: false }));
  box.scale.set(hx * 2, y1 - y0, hz * 2); g.add(box);
  const edges = new THREE.LineSegments(G.boxEdges, new THREE.LineBasicMaterial({ color: 0xc89aff, transparent: true, opacity: 0.35 }));
  edges.scale.copy(box.scale); g.add(edges);
  g.position.set(x, (y0 + y1) / 2, z); W.root.add(g);
  const motes = [], r = mulberry(Math.round(x * 7 + z * 13) + 99);
  const n = Math.min(26, Math.round(hx * hz / 3));
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(G.octa, basic(i % 2 ? 0xe0c0ff : 0x9a7aff)); m.scale.setScalar(0.09 + r() * 0.08);
    m.userData.b = [x + (r() * 2 - 1) * hx, y0 + r() * (y1 - y0), z + (r() * 2 - 1) * hz, r() * TAU];
    W.root.add(m); motes.push(m);
  }
  W.things.push({ update() {
    for (const m of motes) { const b = m.userData.b; m.position.set(b[0] + Math.sin(W.time * 0.7 + b[3]) * 0.4, y0 + (((b[1] - y0 + W.time * 0.8) % (y1 - y0)) + (y1 - y0)) % (y1 - y0), b[2]); m.rotation.y = W.time + b[3]; }
  } });
  return zn;
}
// Water spout: when it is up it lifts you (ride it, then steer off at the top). Bubbles = about to erupt.
function addGeyser(x, top, z, height, period, onT, phase) {
  const zn = { x, z, hx: 1.05, hz: 1.05, y0: top - 0.6, y1: top + height, lift: 82, maxUp: 10, active: true, period, onT, ph: phase || 0, geyser: true };
  W.zones.push(zn);
  const vent = new THREE.Group();
  const ring = M(G.cyl, 0x7a5a3a, 1.15, 0.25, 1.15); ring.position.y = 0.12; vent.add(ring);
  const hole = new THREE.Mesh(G.cyl, basic(0x1b4a6a)); hole.scale.set(0.85, 0.27, 0.85); hole.position.y = 0.13; vent.add(hole);
  vent.position.set(x, top, z); W.root.add(vent);
  const col = new THREE.Mesh(G.cyl, new THREE.MeshBasicMaterial({ color: 0xcff6ff, transparent: true, opacity: 0.45, depthWrite: false }));
  col.position.set(x, top, z); W.root.add(col);
  const cap = new THREE.Mesh(G.sphereLo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false }));
  W.root.add(cap);
  let h = 0, bub = 0;
  W.things.push({ update(dt) {
    const u = ((((W.time + zn.ph) % period) + period) % period);
    const on = onT >= period || u < onT;
    zn.active = on;
    const want = on ? height : 0;
    h = lerp(h, want, damp(on ? 9 : 6, dt));
    col.visible = h > 0.15; cap.visible = col.visible;
    const wob = 1 + Math.sin(W.time * 20) * 0.05;
    col.scale.set(0.8 * wob, Math.max(0.01, h), 0.8 * wob); col.position.y = top + h / 2;
    cap.scale.set(1.25 * wob, 0.6, 1.25 * wob); cap.position.set(x, top + h, z);
    bub -= dt;
    if (bub <= 0) {
      const warn = !on && u > period - 1.0;
      if (on || warn) { bub = on ? 0.12 : 0.18; burst(x + (Math.random() - 0.5) * 1.2, top + (on ? h : 0.3), z + (Math.random() - 0.5) * 1.2, 0xe8fbff, on ? 2 : 3, on ? 4 : 2, 0.5, on ? 10 : -2, 1.2); }
      else bub = 0.3;
    }
  } });
  return zn;
}
// Tide sandbar: up for onT seconds, shakes, then sinks under the water and comes back up.
function addTide(x, top, z, w, d, period, onT, phase) {
  const s = addBox(x, top, z, w, d, 0.7, 'tide', 'tide');
  s.T = period; s.on = onT; s.ph = phase || 0; s.noCam = true;
  const y0 = s.y, drop = 2.6, waterY = W.water ? W.water.position.y : top - 1;
  for (let i = 0; i < 3; i++) { const sh = M(G.sphereLo, [0xffffff, 0xff9ab0, 0xffd27a][i], 0.16, 0.09, 0.16); sh.position.set((i - 1) * w * 0.28, 0.36, (i % 2 ? 0.25 : -0.2) * d); s.mesh.add(sh); }
  W.things.push({ update() {
    const u = ((((W.time + s.ph) % period) + period) % period);
    let k; // 0 = up, 1 = fully sunk
    if (u < onT) k = 0; else if (u < onT + 0.5) k = (u - onT) / 0.5; else if (u < period - 0.5) k = 1; else k = 1 - (u - (period - 0.5)) / 0.5;
    const warn = u > onT - 0.8 && u < onT;
    const ny = y0 - drop * k;
    setSolidPos(s, s.x, ny, s.z);
    s.mesh.position.x = s.x + (warn ? Math.sin(W.time * 60) * 0.06 : 0);
    const act = ny + s.hy > waterY + 0.08;
    if (act !== s.active) { s.active = act; if (!act && P.ground === s) P.ground = null; }
  } });
  return s;
}
// Jellyfish: a bouncy spring that can float and bob on the water.
function addJelly(x, top, z, bob, period, phase, color) {
  const g = new THREE.Group();
  const c = color || 0xff7ad8;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI / 2), mat(c, { emissive: 0x401040, transparent: true, opacity: 0.85 }));
  dome.scale.set(0.85, 0.6, 0.85); dome.position.y = 0.05; g.add(dome);
  const rim = M(G.cyl, 0xffd0f0, 0.88, 0.1, 0.88); rim.position.y = 0.05; g.add(rim);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; const t = M(G.cyl8, c, 0.05, 0.7, 0.05); t.position.set(Math.cos(a) * 0.5, -0.3, Math.sin(a) * 0.5); g.add(t); }
  eyesOn(g, 0.32, 0.62, 0.18, 0.09, false);
  shadowy(g, true, false);
  W.root.add(g);
  const s = addSolid(x, top + 0.3, z, 0.8, 0.3, 0.8, 'spring', null);
  s.anim = 0; s.jelly = true;
  W.things.push({ update(dt) {
    const y = top + (bob ? bob * Math.sin((W.time / (period || 3) + (phase || 0)) * TAU) : 0);
    setSolidPos(s, x, y + 0.3, z);
    s.anim = Math.max(0, s.anim - dt);
    const k = s.anim > 0 ? Math.sin((1 - s.anim / 0.4) * Math.PI * 3) * (s.anim / 0.4) : 0;
    g.position.set(x, y + 0.2, z);
    g.scale.set(1 + k * 0.25, 1 - k * 0.35 + Math.sin(W.time * 3 + x) * 0.04, 1 + k * 0.25);
  } });
  return s;
}
// Laser fence: three beams that blink on and off (they flicker just before switching on).
function addLaser(x, top, z, len, axis, onT, offT, phase) {
  const T = onT + offT;
  const g = new THREE.Group();
  const beams = [];
  const bm = new THREE.MeshBasicMaterial({ color: 0xff2a5a, transparent: true, opacity: 0.9 });
  for (const hy of [0.35, 1.0, 1.65]) { const b = new THREE.Mesh(G.cyl8, bm); b.scale.set(0.07, len, 0.07); b.rotation.z = Math.PI / 2; b.position.y = hy; g.add(b); beams.push(b); }
  for (const sd of [-1, 1]) {
    const post = M(G.box, 0x2b2f48, 0.45, 2.2, 0.45); post.position.set(sd * (len / 2 + 0.2), 1.1, 0); g.add(post);
    const lamp = new THREE.Mesh(G.sphereLo, basic(0xff2a5a)); lamp.scale.setScalar(0.16); lamp.position.set(sd * (len / 2 + 0.2), 2.3, 0); g.add(lamp);
  }
  if (axis === 'z') g.rotation.y = Math.PI / 2;
  g.position.set(x, top, z); W.root.add(g);
  const L = { onT, offT, T, ph: phase || 0, x, z, axis, len, on: false };
  if (!W.lasers || W.lasers.root !== W.root) { W.lasers = []; W.lasers.root = W.root; }
  W.lasers.push(L);
  W.things.push({ update() {
    const u = ((((W.time + L.ph) % T) + T) % T);
    const on = u < onT, warn = !on && u > T - 0.6;
    L.on = on;
    for (const b of beams) { b.visible = on || (warn && Math.floor(W.time * 16) % 2 === 0); b.scale.x = b.scale.z = on ? 0.07 + Math.sin(W.time * 40) * 0.015 : 0.03; }
    if (!on || P.invuln > 0 || P.state === 'dead') return;
    const along = axis === 'x' ? P.pos.x - x : P.pos.z - z, across = axis === 'x' ? P.pos.z - z : P.pos.x - x;
    if (Math.abs(along) < len / 2 && Math.abs(across) < 0.12 + P.r && P.pos.y < top + 1.75 && P.pos.y + P.h > top + 0.25) {
      hurtPlayer(axis === 'x' ? new V3(P.pos.x, P.pos.y, z) : new V3(x, P.pos.y, P.pos.z), 'laser');
    }
  } });
  return L;
}
// Teleporter pair: step on one pad and you warp to the other (step off before it works again).
function addTeleporter(ax, atop, az, bx, btop, bz, color) {
  const c = color || 0x56f0ff;
  const mk = (x, top, z) => {
    const g = new THREE.Group();
    const base = M(G.cyl, 0x2b2f48, 1.0, 0.16, 1.0); base.position.y = 0.08; g.add(base);
    const disc = new THREE.Mesh(G.cyl, basic(c)); disc.scale.set(0.75, 0.18, 0.75); disc.position.y = 0.09; g.add(disc);
    const ring = new THREE.Mesh(G.torus, basic(0xffffff)); ring.rotation.x = Math.PI / 2; ring.scale.set(0.8, 0.8, 1.6); ring.position.y = 0.6; g.add(ring);
    const beam = new THREE.Mesh(G.cyl, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.18, depthWrite: false })); beam.scale.set(0.8, 3, 0.8); beam.position.y = 1.6; g.add(beam);
    g.position.set(x, top, z); W.root.add(g);
    return { x, top, z, ring };
  };
  const A = mk(ax, atop, az), B = mk(bx, btop, bz);
  const tp = { A, B, armed: true, cd: 0, uses: 0 };
  const on = (q) => P.grounded && Math.abs(P.pos.x - q.x) < 0.85 && Math.abs(P.pos.z - q.z) < 0.85 && Math.abs(P.pos.y - q.top) < 0.35;
  W.things.push({ update(dt) {
    A.ring.position.y = 0.6 + Math.sin(W.time * 3) * 0.4; B.ring.position.y = 0.6 + Math.sin(W.time * 3 + 1.5) * 0.4;
    tp.cd -= dt;
    if (P.state === 'dead' || P.frozen) return;
    const oa = on(A), ob = on(B);
    if (!oa && !ob) tp.armed = true;
    if (tp.armed && tp.cd <= 0 && (oa || ob)) {
      const from = oa ? A : B, to = oa ? B : A;
      burst(from.x, from.top + 1, from.z, c, 16, 5, 0.6);
      P.pos.set(to.x, to.top + 0.02, to.z); P.vel.set(0, 0, 0);
      cam.target.set(to.x, to.top + 1.4, to.z);
      tp.armed = false; tp.cd = 0.5; tp.uses++;
      Snd.S.warp(); ringFx(to.x, to.top, to.z, c, 3); burst(to.x, to.top + 1, to.z, 0xffffff, 16, 5, 0.6);
    }
  } });
  return tp;
}
// Boost pad: land on it and it flings you on a fixed arc onto the target platform.
function addLaunchPad(x, top, z, tx, ttop, tz, arc) {
  const g = new THREE.Group();
  const base = M(G.cyl8, 0x2b2f48, 0.95, 0.3, 0.95); base.position.y = 0.15; g.add(base);
  const pad = new THREE.Mesh(G.cyl8, basic(0xffa020)); pad.scale.set(0.75, 0.32, 0.75); pad.position.y = 0.16; g.add(pad);
  const arrow = new THREE.Mesh(G.cone6, basic(0xffffff)); arrow.scale.set(0.3, 0.5, 0.3); arrow.rotation.x = Math.PI / 2; arrow.position.set(0, 0.36, -0.2); g.add(arrow);
  g.rotation.y = Math.atan2(-(tx - x), -(tz - z)) + Math.PI;
  shadowy(g, true, true);
  g.position.set(x, top, z); W.root.add(g);
  const s = addSolid(x, top + 0.15, z, 0.9, 0.15, 0.9, 'launch', null);
  s.launch = { x: tx, top: ttop, z: tz, arc: arc || 4 };
  W.things.push({ update() { pad.material = basic(Math.floor(W.time * 4) % 2 ? 0xffa020 : 0xffd23f); } });
  // dotted trail so you can see where it goes
  for (let i = 1; i < 8; i++) {
    const t = i / 8, d = new THREE.Mesh(G.sphereLo, basic(0xffd23f)); d.scale.setScalar(0.09);
    const apexY = Math.max(ttop - top, 0) + (arc || 4);
    d.position.set(lerp(x, tx, t), top + 0.6 + 4 * apexY * t * (1 - t) + (ttop - top) * t * t * 0.4, lerp(z, tz, t)); W.root.add(d);
  }
  return s;
}
function launchFrom(s) {
  const L = s.launch;
  const dx = L.x - P.pos.x, dz = L.z - P.pos.z, dy = L.top - P.pos.y;
  const apex = Math.max(dy, 0) + L.arc;
  const vy = Math.sqrt(2 * G_UP * apex);
  const T = vy / G_UP + Math.sqrt(2 * (apex - dy) / G_DOWN);
  P.vel.set(dx / T, vy, dz / T);
  P.state = 'launch'; P.stateT = 0; P.grounded = false; P.ground = null; P.jumping = false; P.canDouble = false; P.coyote = 0; P.jumpBuf = 0;
  P.facing = Math.atan2(dx, dz); P.squash = 1.4;
  Snd.S.boost(); ringFx(P.pos.x, P.pos.y, P.pos.z, 0xffa020, 2.5); dust(P.pos.x, P.pos.y, P.pos.z, 8);
}
// ---------- 3.0 decor ----------
function addPalm(x, top, z, s) {
  s = s || 1;
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) { const seg = M(G.cyl8, i % 2 ? 0xa0703a : 0x8a5a2b, 0.2 * s - i * 0.015, 0.75 * s, 0.2 * s - i * 0.015); seg.position.set(i * i * 0.03 * s, (0.37 + i * 0.72) * s, 0); seg.rotation.z = -i * 0.06; g.add(seg); }
  const crown = new THREE.Group(); crown.position.set(0.5 * s, 3.7 * s, 0); g.add(crown);
  for (let i = 0; i < 7; i++) { const lf = M(G.cone6, i % 2 ? 0x3fbf4a : 0x2fa84a, 0.28 * s, 2.1 * s, 0.1 * s); lf.rotation.set(0, (i / 7) * TAU, 1.9); lf.position.set(Math.cos((i / 7) * TAU) * 0.9 * s, -0.2 * s, -Math.sin((i / 7) * TAU) * 0.9 * s); lf.rotation.order = 'YXZ'; crown.add(lf); }
  for (let i = 0; i < 3; i++) { const cn = M(G.sphereLo, 0x6b3b1f, 0.17 * s); cn.position.set(Math.cos(i * 2.1) * 0.25 * s, -0.3 * s, Math.sin(i * 2.1) * 0.25 * s); crown.add(cn); }
  shadowy(g, true, false);
  g.position.set(x, top, z); g.rotation.y = (x * 7 + z * 3) % TAU; W.root.add(g);
  addSolid(x, top + 1.5 * s, z, 0.25 * s, 1.5 * s, 0.25 * s, 'static', null).noCam = true;
}
function addStarfield(n) {
  const r = mulberry(1234), pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, a = r() * TAU, c = Math.sqrt(1 - u * u);
    pos[i * 3] = Math.cos(a) * c * 420; pos[i * 3 + 1] = Math.abs(u) * 420 * (r() < 0.8 ? 1 : -0.4); pos[i * 3 + 2] = Math.sin(a) * c * 420;
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false, depthWrite: false }));
  W.sky.add(pts);
}
function addPlanet(x, y, z, r, color, ringColor) {
  const p = new THREE.Mesh(G.sphere, new THREE.MeshBasicMaterial({ color, fog: false })); p.scale.setScalar(r); p.position.set(x, y, z); W.sky.add(p);
  if (ringColor) { const rg = new THREE.Mesh(G.torus, new THREE.MeshBasicMaterial({ color: ringColor, fog: false })); rg.scale.set(r * 1.7, r * 1.7, r * 2.2); rg.rotation.set(1.2, 0.3, 0); rg.position.copy(p.position); W.sky.add(rg); }
  return p;
}
// ---------- 3.0 enemies (re-skins of existing behaviours so co-op puppets work unchanged) ----------
function buildCrab() {
  const g = new THREE.Group(); const b = new THREE.Group(); g.add(b);
  const body = M(G.sphereLo, 0xff5a3a, 0.62, 0.34, 0.5); body.position.y = 0.42; b.add(body);
  for (const sd of [-1, 1]) {
    const st = M(G.cyl8, 0xff5a3a, 0.04, 0.3, 0.04); st.position.set(sd * 0.16, 0.8, 0.22); b.add(st);
    const e = M(G.sphere, 0xffffff, 0.09); e.position.set(sd * 0.16, 0.98, 0.24); b.add(e);
    const p = M(G.sphere, 0x1b1440, 0.05); p.position.set(sd * 0.16, 0.99, 0.31); b.add(p);
    for (let i = 0; i < 3; i++) { const lg = M(G.cyl8, 0xd8402a, 0.04, 0.4, 0.04); lg.position.set(sd * 0.58, 0.2, -0.2 + i * 0.2); lg.rotation.z = sd * 0.9; b.add(lg); }
  }
  const mkClaw = (sd) => { const c = new THREE.Group(); c.position.set(sd * 0.55, 0.45, 0.25); const k = M(G.sphereLo, 0xff7a4a, 0.22, 0.17, 0.2); c.add(k); const k2 = M(G.cone6, 0xff7a4a, 0.08, 0.25, 0.08); k2.rotation.x = Math.PI / 2; k2.position.set(0, 0.08, 0.2); c.add(k2); b.add(c); return c; };
  const fL = mkClaw(-1), fR = mkClaw(1);
  shadowy(g, true, false);
  return { root: g, body: b, fL, fR };
}
function buildAlien() {
  const g = new THREE.Group(); const b = new THREE.Group(); g.add(b);
  const body = M(G.sphereLo, 0x7dff6a, 0.5, 0.55, 0.5); body.position.y = 0.55; b.add(body);
  const eye = M(G.sphere, 0xffffff, 0.22, 0.24, 0.12); eye.position.set(0, 0.7, 0.42); b.add(eye);
  const pup = M(G.sphere, 0x1b1440, 0.1, 0.12, 0.06); pup.position.set(0, 0.7, 0.52); b.add(pup);
  const ant = M(G.cyl8, 0x3fbf4a, 0.03, 0.4, 0.03); ant.position.y = 1.25; b.add(ant);
  const tip = new THREE.Mesh(G.sphereLo, basic(0xff5ad8)); tip.scale.setScalar(0.09); tip.position.y = 1.47; b.add(tip);
  const fL = M(G.sphereLo, 0x3fbf4a, 0.18, 0.1, 0.24); fL.position.set(-0.22, 0.08, 0.05); b.add(fL);
  const fR = fL.clone(); fR.position.x = 0.22; b.add(fR);
  shadowy(g, true, false);
  return { root: g, body: b, fL, fR };
}
function buildUrchin(color, spikeColor) {
  const g = new THREE.Group(); const b = new THREE.Group(); g.add(b);
  const core = M(G.sphereLo, color || 0x6a2a9a, 0.5); core.position.y = 0.55; b.add(core);
  const sm = mat(spikeColor || 0x2a0a4a);
  for (let i = 0; i < 16; i++) {
    const u = (i / 16) * 2 - 0.9, a = i * 2.4, c = Math.sqrt(Math.max(0, 1 - u * u));
    const v = new THREE.Vector3(Math.cos(a) * c, u * 0.9 + 0.2, Math.sin(a) * c).normalize();
    const s = new THREE.Mesh(G.cone6, sm); s.scale.set(0.08, 0.55, 0.08); s.position.set(v.x * 0.55, 0.55 + v.y * 0.55, v.z * 0.55);
    s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v); b.add(s);
  }
  eyesOn(b, 0.62, 0.45, 0.14, 0.1, true);
  shadowy(g, true, false);
  return { root: g, body: b };
}
function buildFlyer(kind) {
  const g = new THREE.Group(); const b = new THREE.Group(); g.add(b);
  let wL, wR;
  if (kind === 'gull') {
    const body = M(G.sphereLo, 0xffffff, 0.36, 0.34, 0.55); body.position.y = 0.45; b.add(body);
    const beak = M(G.cone6, 0xffa020, 0.09, 0.3, 0.09); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.5, 0.6); b.add(beak);
    eyesOn(b, 0.6, 0.42, 0.13, 0.08, true);
    const wm = mat(0xdde4ee);
    wL = new THREE.Mesh(G.box, wm); wL.scale.set(0.8, 0.05, 0.34); wL.position.set(-0.6, 0.6, 0); b.add(wL);
    wR = wL.clone(); wR.position.x = 0.6; b.add(wR);
  } else {
    const saucer = M(G.sphereLo, 0x9aa4c8, 0.62, 0.18, 0.62); saucer.position.y = 0.45; b.add(saucer);
    const dome = new THREE.Mesh(G.sphereLo, mat(0x56f0ff, { emissive: 0x104050, transparent: true, opacity: 0.85 })); dome.scale.set(0.3, 0.28, 0.3); dome.position.y = 0.62; b.add(dome);
    eyesOn(b, 0.66, 0.24, 0.09, 0.06, true);
    wL = new THREE.Mesh(G.sphereLo, basic(0xffd23f)); wL.scale.setScalar(0.08); wL.position.set(-0.55, 0.42, 0); b.add(wL);
    wR = wL.clone(); wR.position.x = 0.55; b.add(wR);
  }
  shadowy(g, true, false);
  return { root: g, body: b, wL, wR };
}
function addCrab(x, top, z) { return makeEnemy('walker', x, top, z, buildCrab(), { r: 0.6, h: 1.0 }); }
function addAlien(x, top, z) { return makeEnemy('walker', x, top, z, buildAlien(), { r: 0.55, h: 1.2 }); }
function addUrchin(x, top, z, x2, z2) { return makeEnemy('spiky', x, top, z, buildUrchin(), { r: 0.62, h: 1.1, stompable: false, spinnable: false, a: new V3(x, top, z), b: new V3(x2, top, z2), toB: true }); }
function addMine(x, top, z, x2, z2) { return makeEnemy('spiky', x, top, z, buildUrchin(0x3a3f58, 0xff3b5c), { r: 0.62, h: 1.1, stompable: false, spinnable: false, a: new V3(x, top, z), b: new V3(x2, top, z2), toB: true }); }
function addFlyer(kind, x, y, z) {
  const e = makeEnemy('bee', x, y, z, buildFlyer(kind), { r: 0.5, h: 0.95 });
  const blob = new THREE.Mesh(G.circle, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }));
  blob.scale.setScalar(0.45); W.root.add(blob); e.blob = blob;
  return e;
}
function coastEnv(c) {
  setupEnv(Object.assign({ top: 0x1e8fff, horizon: 0xbff4ff, bottom: 0x7fe0ff, fog: 0xbff4ff, fogNear: 90, fogFar: 300, hemiSky: 0xffffff, hemiGround: 0x5aa0a0, hemiI: 0.8, sunColor: 0xfff2d0, sunI: 0.95, amb: 0.22, sunSprite: 0xfff3b0 }, c || {}));
  W.killY = -4.5;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), mat(c && c.sea || 0x2fd0e0, { transparent: true, opacity: 0.88, roughness: 0.2, metalness: 0.1 }));
  water.rotation.x = -Math.PI / 2; water.position.y = -1.2; W.root.add(water); W.water = water;
  if (SHADOWS) water.receiveShadow = true;
  const r = mulberry(17);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + r() * 0.3, d = 150 + r() * 80;
    const isl = M(G.sphereLo, 0xffe3a6, 18 + r() * 14, 5 + r() * 4, 18 + r() * 14); isl.position.set(Math.cos(a) * d, -3, Math.sin(a) * d - 40); W.root.add(isl);
    const pt = M(G.cone6, 0x2fa84a, 6, 14, 6); pt.position.set(isl.position.x, 6, isl.position.z); W.root.add(pt);
  }
  skyClouds(16, 35, 70, 70, 220, 21);
  W.scenery = (dt, t) => { water.position.y = -1.2 + Math.sin(t * 0.9) * 0.06; };
}
function spaceEnv(c) {
  setupEnv(Object.assign({ top: 0x05031a, horizon: 0x2a1a5a, bottom: 0x0a0820, fog: 0x1c1244, fogNear: 100, fogFar: 340, hemiSky: 0xd0d8ff, hemiGround: 0x403060, hemiI: 0.8, sunColor: 0xffffff, sunI: 0.95, amb: 0.26 }, c || {}));
  W.killY = -16;
  addStarfield(700);
  addPlanet(-160, 120, -320, 60, 0xff8a5a, 0xffd0a0);
  addPlanet(220, 60, -260, 22, 0x6ad0ff);
  const r = mulberry(31);
  const rocks = [];
  for (let i = 0; i < 26; i++) {
    const a = r() * TAU, d = 60 + r() * 140;
    const m = M(G.dodeca, 0x6a6a80, 2 + r() * 5); m.position.set(Math.cos(a) * d, -30 + r() * 70, Math.sin(a) * d - 50); W.root.add(m); rocks.push(m);
  }
  W.scenery = (dt) => { for (let i = 0; i < rocks.length; i++) { rocks[i].rotation.x += dt * 0.1 * ((i % 3) + 1); rocks[i].rotation.y += dt * 0.07; } };
}

// =====================================================================
// WORLD 7-1 — SUNNY SHORE
// =====================================================================
function buildShore() {
  coastEnv();
  addIsland(0, 0, 0, 14, 14, 'sand', 3, { bare: true });
  addHint(-3, 0, 4, '<b>CORAL COAST!</b> Bounce on <b>jellyfish</b>, cross <b>sandbars</b> before the tide takes them, and ride <b>water spouts</b> up cliffs.', null, 3);
  addPalm(5.6, 0, 5.6, 1); addPalm(5.4, 0, -5.4, 0.9); addPalm(-5.8, 0, 5.8, 1.1);
  coinLine(0, 0.9, 3, 0, 0.9, -5, 5);
  addCrab(3, 0, -2);
  // star 1: jellyfish bounce to the floating sand ledge
  addJelly(-4, 0, -3.5, 0, 3, 0);
  addHint(-1.5, 0, -1.5, 'Jump on the <b>JELLYFISH</b> to bounce way up!', null, 2);
  addIsland(-4, 6, -8.6, 3, 3, 'sand', 1, { bare: true });
  addItem('star', -4, 7.3, -8.6, { idx: 0 });
  coinLine(-4, 3, -4.8, -4, 6, -7, 3);
  // sandbars
  addHint(2.5, 0, -5.6, '<b>SANDBARS</b> sink with the tide &mdash; they <b>shake</b> first. Cross while they are up!', null, 2.2);
  addTide(0, 0, -10.5, 3, 3, 5, 3.2, 0);
  addTide(0, 0, -14.5, 3, 3, 5, 3.2, -0.8);
  coinLine(0, 1, -10.5, 0, 1, -14.5, 2);
  // island B
  addIsland(0, 0, -24, 14, 14, 'sand', 3, { bare: true });
  addCheckpoint(-1.6, 0, -18.6, 0);
  addCrab(-3, 0, -26); addCrab(3, 0, -28);
  addQBlock(2.5, 3.4, -21.5, 'coins');
  addPalm(-5.5, 0, -29.5, 1); addPalm(5.5, 0, -18.5, 0.9);
  // star 2: islet + jellyfish to the coral perch
  addIsland(10.5, 0, -24, 3, 3, 'sand', 2, { bare: true });
  addJelly(10.5, 0, -24, 0, 3, 0, 0x7ad8ff);
  addBox(10.5, 5.4, -28.6, 3, 3, 0.8, 'coral');
  addItem('star', 10.5, 6.7, -28.6, { idx: 1 });
  // water spout up the cliff
  addIsland(0, 0, -33.5, 4, 4, 'sand', 2, { bare: true });
  addGeyser(0, 0, -33.5, 6.6, 4, 4, 0);
  addHint(-2.6, 0, -30, 'Stand in the <b>WATER SPOUT</b> to ride it up, then steer onto the cliff!', null, 2.2);
  coinLine(0, 2.5, -33.5, 0, 6.5, -33.5, 3);
  // island C
  addIsland(0, 5, -43, 12, 10, 'sand', 3, { bare: true });
  addCheckpoint(-1.6, 5, -39.2, 0);
  addUrchin(-4, 5, -45.5, 4, -45.5);
  addHint(2.4, 5, -39.4, 'Spiny <b>sea urchins</b> can\'t be stomped &mdash; jump over them!', null, 2);
  addCrab(3, 5, -41.5);
  coinRing(0, 5.9, -43, 2, 6);
  // star 3: hidden sand steps to the west
  addSecretBlock(-8.4, 5.4, -44, 2.2, 2.2, 'coral');
  addSecretBlock(-11.4, 5.8, -45.5, 2.2, 2.2, 'coral');
  addBox(-14.6, 6.2, -46, 3, 3, 1, 'coral');
  addItem('star', -14.6, 7.5, -46, { idx: 2 });
  // turtle ferry to the goal island
  const turtle = addMover(0, 5, -51, 3, 3, [0, 0, -4], 5, 0, 'reef');
  const shell = M(new THREE.SphereGeometry(1, 10, 6, 0, TAU, 0, Math.PI / 2), 0x3a8a4a, 1.3, 0.5, 1.3); shell.position.y = 0.3; turtle.mesh.add(shell);
  const head = M(G.sphereLo, 0x7ad070, 0.35); head.position.set(0, 0.2, -1.6); turtle.mesh.add(head);
  addHint(2, 5, -46.5, 'Hop on the <b>turtle</b> to ferry across!', null, 2);
  addIsland(0, 5, -62, 10, 8, 'sand', 3, { bare: true });
  addFlyer('gull', 3.5, 7.6, -60);
  addBox(0, 5.8, -64, 4, 4, 0.8, 'sand');
  addGoal(0, 5.8, -64, 'flag');
  addPalm(-3.8, 5, -64.5, 1);
  W.titleFocus = new V3(0, 1, -10);
}
// =====================================================================
// WORLD 7-2 — TIDE POOLS
// =====================================================================
function buildTidePools() {
  coastEnv({ top: 0x2a7aff, horizon: 0xffe0c0, bottom: 0x8ad8ff, fog: 0xffe6cc, sunColor: 0xffe0b0, sea: 0x27c4d8 });
  addIsland(0, 0, 0, 14, 14, 'sand', 3, { bare: true });
  addHint(-3, 0, 4, '<b>TIDE POOLS:</b> Spouts here come and go. <b>Bubbles</b> mean one is about to erupt!', null, 3);
  addPalm(5.6, 0, 5.4, 1); addPalm(-5.6, 0, -5.4, 0.9);
  addCrab(2.5, 0, -3);
  coinLine(0, 0.9, 3, 0, 0.9, -5, 5);
  addTide(0, 0, -10, 3, 3, 4.5, 2.6, 0);
  addTide(0, 0, -14.5, 3, 3, 4.5, 2.6, -1.0);
  addIsland(0, 0, -19, 4, 4, 'sand', 2, { bare: true });
  addCheckpoint(-1.2, 0, -17.8, 0);
  addGeyser(0, 0, -19.6, 7, 4.5, 2.6, 0);
  addHint(1.4, 0, -17.6, 'Wait for the spout to erupt, then ride it up!', null, 1.6);
  // island B: crate puzzle
  addIsland(0, 4, -30, 16, 14, 'sand', 3, { bare: true });
  addCheckpoint(-2, 4, -24.4, 0);
  addHint(2.5, 4, -24.4, '<b>PUZZLE:</b> Push both <b>crates</b> onto the yellow switches to open the coral gate. (Blue pad = reset.)', null, 2.6);
  addBox(-4.75, 8, -36.5, 6.5, 1, 4, 'coral'); addBox(4.75, 8, -36.5, 6.5, 1, 4, 'coral');
  const gate = addGate(0, 8, -36.5, 3, 1, 4);
  const cA = addPushBlock(-4.5, 4, -27), cB = addPushBlock(5, 4, -27);
  const sA = addPressureSwitch(-4.5, 4, -33), sB = addPressureSwitch(2, 4, -33);
  addResetPad(0, 4, -25.2, [cA, cB]);
  const onSw = () => { const n = (sA.pressed ? 1 : 0) + (sB.pressed ? 1 : 0); if (n < 2) showToast('Switch pressed! <b>' + n + ' / 2</b>', 2.5); };
  sA.onPress = onSw; sB.onPress = onSw;
  W.things.push({ update() { if (!gate.opening && sA.pressed && sB.pressed) { gate.open(); showToast('<b>THE CORAL GATE IS OPEN!</b>', 3); Snd.S.solve(); } } });
  addCrab(-1, 4, -30);
  // star 1: jelly to the coral pillar
  addJelly(-6.8, 4, -25, 0, 3, 0);
  addBox(-6.8, 9.2, -29.6, 2, 2.6, 5.2, 'coral');
  addItem('star', -6.8, 10.5, -29.6, { idx: 0 });
  // sandbars over the pools
  addTide(0, 0.5, -40, 3, 3, 4.5, 2.8, 0);
  addTide(0, 0.5, -44, 3, 3, 4.5, 2.8, -0.9);
  addTide(0, 0.5, -48, 3, 3, 4.5, 2.8, -1.8);
  coinLine(0, 1.5, -40, 0, 1.5, -48, 3);
  // star 2: coral rock beside the middle sandbar
  addBox(5.5, 1.5, -44, 2.6, 2.6, 2, 'coral');
  addItem('star', 5.5, 2.8, -44, { idx: 1 });
  // island C
  addIsland(0, 1, -56, 14, 10, 'sand', 3, { bare: true });
  addCheckpoint(-2, 1, -52.4, 0);
  addFlyer('gull', -4, 3.6, -57); addFlyer('gull', 4.5, 3.6, -55);
  addHint(2.3, 1, -52.2, '<b>Seagulls</b> swoop at you &mdash; stomp them or spin them away!', null, 2);
  // star 3: hidden steps up to a high perch
  addSecretBlock(-4.5, 3.2, -59.5, 2.2, 2.2, 'coral');
  addSecretBlock(-7.5, 5.4, -61.5, 2.2, 2.2, 'coral');
  addBox(-10.5, 7.6, -63, 3, 3, 1, 'coral');
  addItem('star', -10.5, 8.9, -63, { idx: 2 });
  // two timed spouts up to the goal cliff
  addGeyser(3, 1, -59.5, 6, 4, 2.4, 1);
  addBox(3, 6, -64, 3, 3, 1, 'coral');
  addGeyser(3, 6, -64, 6.5, 4, 2.4, 3);
  addIsland(0, 10, -73, 10, 10, 'sand', 3, { bare: true });
  addUrchin(-3, 10, -70.5, 3, -70.5);
  addBox(0, 10.8, -75.5, 4, 4, 0.8, 'sand');
  addGoal(0, 10.8, -75.5, 'flag');
  addPalm(3.5, 10, -76.5, 1);
  W.titleFocus = new V3(0, 1, -10);
}
// =====================================================================
// WORLD 7-3 — SUNKEN REEF
// =====================================================================
function buildReef() {
  coastEnv({ top: 0x3a2a8a, horizon: 0xff9a7a, bottom: 0x40a0c0, fog: 0xffb090, sunColor: 0xffc890, sunI: 0.85, sunSprite: 0xff9050, sea: 0x1aa8b8, hemiGround: 0x406a80 });
  addIsland(0, 0, 0, 14, 14, 'reef', 3, { bare: true });
  addHint(-3, 0, 4, '<b>SUNKEN REEF:</b> The jellyfish here <b>bob up and down</b>. Bounce from one to the next!', null, 3);
  coinLine(0, 0.9, 3, 0, 0.9, -5, 5);
  addCrab(3, 0, -2.5);
  addJelly(0, 0, -10.5, 0.5, 3, 0);
  addJelly(0, 0, -16, 0.5, 3, 0.33, 0x7ad8ff);
  addJelly(0, 0, -21.5, 0.5, 3, 0.66);
  addItem('star', 0, 6.6, -16, { idx: 0 });
  // island B: coral lamp lever puzzle
  addIsland(0, 0, -30, 12, 10, 'reef', 3, { bare: true });
  addCheckpoint(-1.6, 0, -26, 0);
  addHint(1.6, 0, -26, '<b>CORAL LAMPS:</b> each pad flips some lamps. Light <b>all three</b> to open the gate!', null, 2.2);
  addBox(-3.75, 6, -34.5, 4.5, 1, 6, 'coral'); addBox(3.75, 6, -34.5, 4.5, 1, 6, 'coral');
  addBox(0, 6, -34.5, 3, 1, 1, 'coral');
  const gate = addGate(0, 5, -34.5, 3, 1, 5);
  W.levers = addLeverPuzzle({
    top: 0, init: [0, 0, 0], msg: '<b>ALL LAMPS LIT!</b> The reef gate opens!',
    lamps: [[-3.5, 6, -34.6, 1.2], [0, 6, -34.6, 1.2], [3.5, 6, -34.6, 1.2]],
    levers: [[-3.5, -30.5, [0, 1], 'A'], [0, -29, [1, 2], 'B'], [3.5, -30.5, [0], 'C']],
    onSolve: () => gate.open(),
  });
  // sideways turtles
  const t1 = addMover(-2, 0, -38.5, 3, 3, [4, 0, 0], 4.5, 0, 'reef');
  const t2 = addMover(2, 0, -43, 3, 3, [-4, 0, 0], 4.5, 0, 'reef');
  for (const t of [t1, t2]) { const sh = M(new THREE.SphereGeometry(1, 10, 6, 0, TAU, 0, Math.PI / 2), 0x3a8a4a, 1.3, 0.5, 1.3); sh.position.y = 0.3; t.mesh.add(sh); }
  // island C
  addIsland(0, 0, -51, 12, 8, 'reef', 3, { bare: true });
  addCheckpoint(-1.6, 0, -47.8, 0);
  addUrchin(-4, 0, -53, 4, -53);
  addFlyer('gull', 0, 3, -50);
  // star 2: ride the offshore spout
  addBox(9, 0.5, -51, 2.4, 2.4, 1, 'coral');
  addGeyser(9, 0.5, -51, 7, 5, 2.5, 0);
  addItem('star', 9, 6.6, -51, { idx: 1 });
  // final tide + spout
  addTide(0, 0, -58.5, 3, 3, 4, 2.3, 0);
  addTide(0, 0, -62.5, 3, 3, 4, 2.3, -0.8);
  addIsland(0, 0, -67.5, 4, 4, 'reef', 2, { bare: true });
  addCheckpoint(-1.3, 0, -66.3, 0);
  addGeyser(0.3, 0, -68.3, 7.5, 4, 2.2, 0);
  addIsland(0, 5, -78, 12, 12, 'reef', 3, { bare: true });
  addCrab(-3, 5, -75); addUrchin(4.5, 5, -76, 4.5, -82);
  // star 3: jelly to the coral tower
  addJelly(-4, 5, -75.5, 0, 3, 0);
  addBox(-4, 11, -79.6, 2.6, 2.6, 6, 'coral');
  addItem('star', -4, 12.3, -79.6, { idx: 2 });
  addBox(1, 6, -80.5, 4, 4, 1, 'gold');
  addGoal(1, 6, -80.5, 'star');
  W.titleFocus = new V3(0, 1, -10);
}
// =====================================================================
// WORLD 8-1 — MOON BASE
// =====================================================================
function buildMoon() {
  spaceEnv();
  addIsland(0, 0, 0, 14, 14, 'moon', 3, { bare: true });
  addHint(-3, 0, 4, '<b>STARLIGHT STATION!</b> Inside the purple fields gravity is <b>LOW</b> &mdash; you jump much higher and farther.', null, 3);
  coinLine(0, 0.9, 3, 0, 0.9, -5, 5);
  addAlien(3, 0, -3);
  addLowGrav(1.5, -14, 5.5, 8, -12, 16, 0.42);
  addBox(0, 1, -14, 3, 3, 1, 'moon');
  addBox(5, 7, -14, 2.5, 2.5, 0.8, 'neon');
  addItem('star', 5, 8.3, -14, { idx: 0 });
  coinLine(0, 3.5, -9, 0, 3.5, -19, 4);
  // island B: boost pads
  addIsland(0, 0, -27, 12, 12, 'moon', 3, { bare: true });
  addCheckpoint(-1.6, 0, -22.4, 0);
  addHint(1.6, 0, -22.4, '<b>BOOST PADS</b> fling you along the dotted path. Just step on!', null, 2.2);
  addAlien(3.5, 0, -24); addAlien(-3.5, 0, -31);
  addLaunchPad(0, 0, -30.5, 0, 3, -47.5, 4);
  // star 2: side pad to a far platform and back
  addLaunchPad(4.5, 0, -31.5, 16, 4, -32.5, 3);
  addBox(16, 4, -31, 4, 5, 1, 'neon');
  addItem('star', 16, 5.3, -32.5, { idx: 1 });
  addLaunchPad(16, 4, -29.5, 2.5, 0, -26, 3);
  // island C
  addIsland(0, 3, -48, 12, 8, 'moon', 3, { bare: true });
  addCheckpoint(-1.6, 3, -45, 0);
  addMine(-4, 3, -50.5, 4, -50.5);
  addFlyer('ufo', 3.5, 5.6, -46);
  addHint(2.4, 3, -44.8, 'Red-spiked <b>mines</b> hurt to touch. <b>UFOs</b> can be stomped!', null, 2);
  // low gravity up to the goal
  addLowGrav(-1, -57, 6.5, 5.5, 0, 22, 0.42);
  addBox(0, 6, -56.5, 3, 3, 1, 'moon');
  addBox(-4, 12, -58.5, 2.5, 2.5, 0.8, 'neon');
  addItem('star', -4, 13.3, -58.5, { idx: 2 });
  addIsland(0, 9, -66, 10, 10, 'moon', 3, { bare: true });
  addAlien(2.5, 9, -64);
  addBox(0, 9.8, -68.5, 4, 4, 0.8, 'hull');
  addGoal(0, 9.8, -68.5, 'flag');
  W.titleFocus = new V3(0, 1, -10);
}
// =====================================================================
// WORLD 8-2 — LASER LABS
// =====================================================================
function buildLabs() {
  spaceEnv({ horizon: 0x1a2a5a, fog: 0x14204a });
  addIsland(0, 0, 0, 14, 14, 'hull', 3, { bare: true });
  addHint(-3, 0, 4, '<b>LASER LABS:</b> Laser fences blink. They <b>flicker</b> just before switching on &mdash; dash through while they are off!', null, 3);
  addRobot(3, 0, -2, 3, -5.5, 0);
  coinLine(0, 0.9, 3, 0, 0.9, -5, 5);
  addBox(0, 0, -15, 5, 16, 1, 'hull');
  addLaser(0, 0, -11, 5, 'x', 1.4, 2.2, 0);
  addLaser(0, 0, -17, 5, 'x', 1.4, 2.2, -1.2);
  coinLine(0, 0.9, -8.5, 0, 0.9, -21, 5);
  // island B: teleporters
  addIsland(0, 0, -29, 14, 12, 'hull', 3, { bare: true });
  addCheckpoint(-1.6, 0, -24.4, 0);
  addHint(1.8, 0, -24.4, '<b>TELEPORTERS:</b> step on a glowing pad to warp. Step off and back on to return.', null, 2.2);
  addTeleporter(3.5, 0, -32, 0, 6, -43.5, 0x56f0ff);
  // star 1: secret teleporter vault
  addTeleporter(-4.5, 0, -27, -17, 4, -29, 0xff7ad8);
  addBox(-17, 4, -29.5, 5, 5, 1, 'neon');
  addItem('star', -17, 5.3, -31, { idx: 0 });
  // island C: 4-light lever puzzle
  addIsland(0, 6, -46, 14, 10, 'hull', 3, { bare: true });
  addCheckpoint(-4.5, 6, -42.6, 0);
  addHint(4.5, 6, -42.6, '<b>POWER CELLS:</b> light all <b>four</b>. One pad is a decoy &mdash; experiment!', null, 2.2);
  addBox(-4.25, 11, -50.5, 5.5, 1, 5, 'hull'); addBox(4.25, 11, -50.5, 5.5, 1, 5, 'hull');
  addBox(0, 11, -50.5, 3, 1, 1, 'hull');
  const gate = addGate(0, 10, -50.5, 3, 1, 4);
  W.levers = addLeverPuzzle({
    top: 6, init: [0, 0, 0, 0], msg: '<b>POWER RESTORED!</b> The lab door slides open!',
    lamps: [[-5.5, 11, -50.6, 1.2], [-2.6, 11, -50.6, 1.2], [2.6, 11, -50.6, 1.2], [5.5, 11, -50.6, 1.2]],
    levers: [[-4, -46.5, [0, 1], 'A'], [0, -47, [1, 2], 'B'], [4, -46.5, [2, 3], 'C']],
    onSolve: () => gate.open(),
  });
  // laser bridge
  addBox(0, 6, -58, 4, 14, 1, 'neon');
  addLaser(0, 6, -54.5, 4, 'x', 1.3, 2.3, 0);
  addLaser(0, 6, -58.5, 4, 'x', 1.3, 2.3, -0.9);
  addLaser(0, 6, -62.5, 4, 'x', 1.3, 2.3, -1.8);
  // star 2: ledge beside the bridge
  addBox(5, 7, -58.5, 2, 2, 0.8, 'neon');
  addItem('star', 5, 8.3, -58.5, { idx: 1 });
  // island D
  addIsland(0, 6, -71, 12, 10, 'hull', 3, { bare: true });
  addCheckpoint(-1.6, 6, -66.8, 0);
  addTurret(-4, 6, -74.5);
  addFlyer('ufo', 3, 8.6, -69);
  // star 3: hidden steps
  addSecretBlock(4.2, 8.2, -73.5, 2.2, 2.2, 'neon');
  addSecretBlock(7.4, 10.4, -75, 2.2, 2.2, 'neon');
  addBox(10.6, 12.6, -76.5, 3, 3, 1, 'neon');
  addItem('star', 10.6, 13.9, -76.5, { idx: 2 });
  addBox(0, 6.8, -74.5, 3, 3, 0.8, 'hull');
  addGoal(0, 6.8, -74.5, 'flag');
  W.titleFocus = new V3(0, 1, -10);
}
// =====================================================================
// WORLD 8-3 — STAR CORE
// =====================================================================
function buildCore() {
  spaceEnv({ horizon: 0x4a1a5a, fog: 0x2a1040, top: 0x0a0220 });
  addIsland(0, 0, 0, 14, 14, 'hull', 3, { bare: true });
  addHint(-3, 0, 4, '<b>STAR CORE:</b> the final stretch! Low gravity, crates, boost pads and lasers &mdash; take it one checkpoint at a time.', null, 3);
  coinLine(0, 0.9, 3, 0, 0.9, -5, 5);
  // low-gravity asteroid hop
  addLowGrav(-1, -16, 8, 10, -12, 22, 0.42);
  addBox(-2, 1.5, -12, 3, 3, 1, 'moon');
  addBox(2, 3, -18, 3, 3, 1, 'moon');
  addBox(-6, 10, -19, 2.5, 2.5, 0.8, 'neon');
  addItem('star', -6, 11.3, -19, { idx: 0 });
  coinLine(-2, 2.5, -12, 2, 4, -18, 3);
  // island B: crates
  addIsland(0, 2, -29, 12, 10, 'hull', 3, { bare: true });
  addCheckpoint(-1.6, 2, -25, 0);
  addHint(1.6, 2, -25, '<b>PUZZLE:</b> both crates onto both switches. (Blue pad = reset.)', null, 2);
  addBox(-3.75, 6, -33.5, 4.5, 1, 4, 'hull'); addBox(3.75, 6, -33.5, 4.5, 1, 4, 'hull');
  const gate = addGate(0, 6, -33.5, 3, 1, 4);
  const cA = addPushBlock(-3.5, 2, -27.5), cB = addPushBlock(3.5, 2, -27.5);
  const sA = addPressureSwitch(-3.5, 2, -31.4), sB = addPressureSwitch(3.5, 2, -31.4);
  addResetPad(0, 2, -26.8, [cA, cB]);
  const onSw = () => { const n = (sA.pressed ? 1 : 0) + (sB.pressed ? 1 : 0); if (n < 2) showToast('Switch pressed! <b>' + n + ' / 2</b>', 2.5); };
  sA.onPress = onSw; sB.onPress = onSw;
  W.things.push({ update() { if (!gate.opening && sA.pressed && sB.pressed) { gate.open(); showToast('<b>THE CORE DOOR IS OPEN!</b>', 3); Snd.S.solve(); } } });
  // boost to island C
  addBox(0, 2, -36, 4, 4, 1, 'hull');
  addLaunchPad(0, 2, -36.5, 0, 5, -51, 4);
  // island C: laser sweep + vault teleporter
  addIsland(0, 5, -54, 12, 10, 'hull', 3, { bare: true });
  addCheckpoint(-1.6, 5, -50.4, 0);
  addLaser(0, 5, -54.5, 12, 'x', 1.5, 2.2, 0);
  addFlyer('ufo', 3, 7.5, -57);
  addTeleporter(-4.5, 5, -51.5, -17, 8, -54, 0xff7ad8);
  addBox(-17, 8, -54.5, 5, 5, 1, 'neon');
  addItem('star', -17, 9.3, -56, { idx: 1 });
  // final low-gravity climb
  addLowGrav(0, -66, 7, 7, 2, 26, 0.42);
  addMover(0, 5, -62.5, 3, 3, [0, 4, 0], 4, 0, 'neon');
  addBox(0, 10, -68, 3, 3, 1, 'moon');
  addBox(5, 16, -70, 2.5, 2.5, 0.8, 'neon');
  addItem('star', 5, 17.3, -70, { idx: 2 });
  addIsland(0, 12, -78, 12, 9, 'gold', 3, { bare: true });
  addCheckpoint(-1.6, 12, -74.6, 0);
  addRobot(-3.5, 12, -79, 3.5, -79, 0.8);
  addFirebar(3.5, 12.8, -77, 3, 1.4, 0);
  addBox(0, 13, -81, 4, 3, 1, 'gold');
  addGoal(0, 13, -81, 'star');
  W.titleFocus = new V3(0, 1, -10);
}

// =====================================================================
// BOOST ZONE 1 — MEADOW RUSH (open zone: farm, orchard, lake rails, loop)
// =====================================================================
// =====================================================================
// FAMILY PET CAMEOS: Luna, Pi-rat (one eye), Snowie, Candy and Torty
// =====================================================================
const RAT_COL = {
  luna: { fur: 0xa9afbd, dark: 0x7d8394, belly: 0xeceef3, eye: 0x1b1b24, name: 'Luna' },
  pirat: { fur: 0xc99a6b, dark: 0x9c7148, belly: 0xf6e7d4, eye: 0x1b1b24, name: 'Pi-rat' },
  snowie: { fur: 0xfbfbff, dark: 0xe3e1ee, belly: 0xffffff, eye: 0xd0315a, name: 'Snowie' },
};
const S16 = new THREE.SphereGeometry(1, 16, 12);
function buildRat(id) {
  const C = RAT_COL[id] || RAT_COL.luna;
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const torso = M(S16, C.fur, 0.42, 0.36, 0.62); torso.position.set(0, 0.38, 0); body.add(torso);
  const belly = M(S16, C.belly, 0.34, 0.26, 0.5); belly.position.set(0, 0.3, 0.06); body.add(belly);
  if (id === 'luna') { const saddle = M(S16, C.dark, 0.3, 0.14, 0.42); saddle.position.set(0, 0.66, -0.1); body.add(saddle); }
  const head = new THREE.Group(); head.position.set(0, 0.52, 0.55); body.add(head);
  const skull = M(S16, C.fur, 0.3, 0.27, 0.32); head.add(skull);
  const snout = M(S16, C.belly, 0.17, 0.15, 0.22); snout.position.set(0, -0.06, 0.26); head.add(snout);
  const nose = M(G.sphere, 0xff8fb1, 0.06); nose.position.set(0, -0.02, 0.47); head.add(nose);
  for (const s of [-1, 1]) {
    const ear = M(S16, 0xffb6c8, 0.15, 0.17, 0.04); ear.position.set(s * 0.22, 0.24, -0.02); ear.rotation.z = s * -0.3; head.add(ear);
    const earB = M(S16, C.fur, 0.17, 0.19, 0.03); earB.position.set(s * 0.22, 0.24, -0.045); earB.rotation.z = s * -0.3; head.add(earB);
    const closed = id === 'pirat' && s > 0;
    if (closed) { // Pi-rat's one-eye wink: a closed lid line
      const lid = M(G.box, 0x3a2414, 0.11, 0.025, 0.03); lid.position.set(s * 0.14, 0.06, 0.27); lid.rotation.z = 0.2; head.add(lid);
    } else {
      const eye = M(G.sphere, C.eye, 0.065); eye.position.set(s * 0.14, 0.06, 0.25); head.add(eye);
      const glint = M(G.sphere, 0xffffff, 0.02); glint.position.set(s * 0.14 + 0.02, 0.09, 0.31); head.add(glint);
    }
    for (let k = 0; k < 2; k++) { const wh = M(G.box, 0xe5e5e5, 0.24, 0.008, 0.008); wh.position.set(s * 0.2, -0.05 - k * 0.04, 0.36); wh.rotation.z = s * (0.15 - k * 0.2); head.add(wh); }
  }
  if (id === 'pirat') { // pirate bandana + patch, from the Pi-rat the Pirate pack
    const band = M(S16, 0xdc2626, 0.31, 0.12, 0.33); band.position.set(0, 0.16, -0.02); head.add(band);
    const knot = M(G.cone6, 0xdc2626, 0.07, 0.2, 0.07); knot.position.set(0.05, 0.16, -0.32); knot.rotation.x = -1.2; head.add(knot);
  }
  const tail = new THREE.Group(); tail.position.set(0, 0.32, -0.58); body.add(tail);
  for (let i = 0; i < 6; i++) { const seg = M(G.cyl8, 0xffb6c8, 0.05 - i * 0.006, 0.22, 0.05 - i * 0.006); seg.rotation.x = Math.PI / 2 + 0.2; seg.position.set(0, -i * 0.035, -i * 0.2); tail.add(seg); }
  const legs = [];
  for (const [x, z] of [[-0.24, 0.32], [0.24, 0.32], [-0.26, -0.3], [0.26, -0.3]]) { const l = M(S16, 0xffc4d2, 0.08, 0.1, 0.12); l.position.set(x, 0.06, z); body.add(l); legs.push(l); }
  shadowy(root, true, false);
  return { root, body, head, tail, legs };
}
function buildCandy() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const gray = 0x7b8088, light = 0xa3a8b0, dark = 0x5d6168, white = 0xeceef2;
  const torso = M(S16, gray, 0.5, 0.45, 0.82); torso.position.set(0, 0.95, 0); body.add(torso);
  const under = M(S16, light, 0.4, 0.3, 0.66); under.position.set(0, 0.76, 0.1); body.add(under);
  const collar = M(new THREE.TorusGeometry(0.33, 0.07, 8, 20), 0xff6fb5); collar.position.set(0, 1.18, 0.62); collar.rotation.x = Math.PI / 2 + 0.5; body.add(collar);
  const tag = M(G.cyl, 0xffd23f, 0.09, 0.02, 0.09); tag.rotation.x = Math.PI / 2; tag.position.set(0, 0.98, 0.86); body.add(tag);
  const head = new THREE.Group(); head.position.set(0, 1.48, 0.85); body.add(head);
  const skull = M(S16, gray, 0.38, 0.37, 0.37); head.add(skull);
  const muzzle = M(G.box, light, 0.36, 0.28, 0.44); muzzle.position.set(0, -0.12, 0.34); head.add(muzzle);
  const beard = M(S16, white, 0.24, 0.26, 0.26); beard.position.set(0, -0.32, 0.4); head.add(beard);
  const nose = M(S16, 0x111111, 0.1, 0.08, 0.08); nose.position.set(0, -0.03, 0.58); head.add(nose);
  for (const s of [-1, 1]) {
    const brow = M(S16, white, 0.12, 0.08, 0.14); brow.position.set(s * 0.14, 0.17, 0.3); head.add(brow);
    const eye = M(G.sphere, 0x2b1d14, 0.065); eye.position.set(s * 0.14, 0.08, 0.32); head.add(eye);
    const ear = M(S16, dark, 0.2, 0.08, 0.17); ear.position.set(s * 0.3, 0.24, -0.02); ear.rotation.z = s * 0.9; head.add(ear);
    const stache = M(S16, white, 0.15, 0.08, 0.11); stache.position.set(s * 0.13, -0.12, 0.54); stache.rotation.z = s * 0.4; head.add(stache);
  }
  const tongue = M(S16, 0xff6f91, 0.08, 0.03, 0.12); tongue.position.set(0.04, -0.3, 0.55); head.add(tongue);
  const legs = [];
  for (const [x, z] of [[-0.27, 0.52], [0.27, 0.52], [-0.27, -0.52], [0.27, -0.52]]) {
    const l = new THREE.Group(); l.position.set(x, 0.7, z);
    const lg = M(G.cyl8, dark, 0.13, 0.6, 0.13); lg.position.y = -0.3; l.add(lg);
    const paw = M(S16, white, 0.15, 0.1, 0.18); paw.position.set(0, -0.62, 0.04); l.add(paw);
    body.add(l); legs.push(l);
  }
  const tail = new THREE.Group(); tail.position.set(0, 1.2, -0.78); body.add(tail);
  const tl = M(G.cyl8, dark, 0.08, 0.36, 0.08); tl.position.y = 0.16; tail.add(tl);
  shadowy(root, true, false);
  root.scale.setScalar(0.85);
  return { root, body, head, tail, legs };
}
function buildTorty() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const shellC = 0x8a6a3a, plate = 0xb08a4e, skin = 0x9c8b6a;
  const shell = M(new THREE.SphereGeometry(1, 16, 10, 0, TAU, 0, Math.PI / 2), shellC, 0.95, 0.62, 1.1); shell.position.y = 0.38; body.add(shell);
  const rim = M(G.cyl, 0x6e5230, 0.98, 0.12, 1.12); rim.position.y = 0.38; body.add(rim);
  const plates = [[0, 0.95, 0.05, 0.3], [0, 0.82, 0.55, 0.24], [0, 0.82, -0.5, 0.24], [0.5, 0.7, 0.2, 0.22], [-0.5, 0.7, 0.2, 0.22], [0.5, 0.7, -0.3, 0.22], [-0.5, 0.7, -0.3, 0.22]];
  for (const p of plates) { const h = M(new THREE.CylinderGeometry(1, 1, 1, 6), plate, p[3], 0.06, p[3]); h.position.set(p[0], p[1], p[2]); h.lookAt(p[0] * 2, p[1] * 2 + 0.2, p[2] * 2); h.rotateX(Math.PI / 2); body.add(h); }
  const head = new THREE.Group(); head.position.set(0, 0.45, 1.15); body.add(head);
  const neck = M(G.cyl8, skin, 0.16, 0.4, 0.16); neck.rotation.x = Math.PI / 2 - 0.4; neck.position.set(0, -0.05, -0.12); head.add(neck);
  const skull = M(S16, skin, 0.24, 0.2, 0.3); skull.position.set(0, 0.08, 0.08); head.add(skull);
  for (const s of [-1, 1]) { const eye = M(G.sphere, 0x1a1a1a, 0.045); eye.position.set(s * 0.15, 0.14, 0.24); head.add(eye); }
  const smile = M(G.box, 0x4a3a28, 0.14, 0.015, 0.02); smile.position.set(0, 0.0, 0.36); head.add(smile);
  const legs = [];
  for (const [x, z] of [[-0.62, 0.55], [0.62, 0.55], [-0.62, -0.55], [0.62, -0.55]]) { const l = M(S16, skin, 0.2, 0.22, 0.22); l.position.set(x, 0.2, z); body.add(l); legs.push(l); }
  const badge = M(G.cyl, 0x4ade80, 0.16, 0.02, 0.16); badge.position.set(0, 0.62, 0.9); badge.rotation.x = 1.1; body.add(badge); // Tortuga Tech badge
  shadowy(root, true, false);
  return { root, body, head, tail: null, legs };
}
const PET_NAMES = { luna: 'Luna', pirat: 'Pi-rat', snowie: 'Snowie', candy: 'Candy', torty: 'Torty' };
// A pet standing in the level. Walk up to it and it says its line. It turns to face you.
function addPet(kind, x, top, z, ry, line, touchLine) {
  const m = kind === 'candy' ? buildCandy() : kind === 'torty' ? buildTorty() : buildRat(kind);
  m.root.position.set(x, top, z); m.root.rotation.y = ry || 0; W.root.add(m.root);
  const tag = makePetTag(PET_NAMES[kind] || kind); tag.position.set(0, kind === 'candy' ? 2.5 : kind === 'torty' ? 1.6 : 1.25, 0); tag.scale.multiplyScalar(kind === 'candy' ? 1.2 : 1); m.root.add(tag);
  if (kind !== 'torty') addSolid(x, top + 0.5, z, kind === 'candy' ? 0.45 : 0.3, 0.5, kind === 'candy' ? 0.45 : 0.3, 'static', null).noCam = true;
  else addSolid(x, top + 0.45, z, 0.85, 0.45, 0.95, 'static', null).noCam = true;
  const pet = { kind, m, near: false, t: Math.random() * 5, yaw: ry || 0 };
  W.pets = W.pets || []; W.pets.push(pet);
  W.things.push({ update(dt) {
    pet.t += dt;
    const dx = P.pos.x - x, dz = P.pos.z - z, d2 = dx * dx + dz * dz;
    const near = d2 < 14 && Math.abs(P.pos.y - top) < 3;
    if (d2 < 120) pet.yaw = angleLerp(pet.yaw, Math.atan2(dx, dz), damp(4, dt));
    m.root.rotation.y = pet.yaw;
    const hop = kind === 'torty' ? 0 : Math.max(0, Math.sin(pet.t * (near ? 9 : 3))) * (near ? 0.12 : 0.03);
    m.body.position.y = hop;
    if (m.tail) m.tail.rotation.y = Math.sin(pet.t * (kind === 'candy' ? (near ? 18 : 6) : 3)) * (kind === 'candy' ? 0.7 : 0.35);
    if (m.head) m.head.rotation.z = Math.sin(pet.t * 1.3) * 0.12;
    if (near && !pet.near && line) { showToast('<b>' + PET_NAMES[kind] + ':</b> ' + (IS_TOUCH && touchLine ? touchLine : line), 5); if (Snd.S.pet) Snd.S.pet(kind); }
    pet.near = near;
  } });
  return pet;
}
function makePetTag(name) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(20,10,50,.82)'; const r = 26; g.beginPath(); g.moveTo(r, 4); g.arcTo(252, 4, 252, 60, r); g.arcTo(252, 60, 4, 60, r); g.arcTo(4, 60, 4, 4, r); g.arcTo(4, 4, 252, 4, r); g.fill();
  g.font = 'bold 36px "Trebuchet MS",Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffe14d'; g.fillText(name, 128, 34);
  const t = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(1.6, 0.4, 1); // 256x64 canvas = 4:1, sprite kept at 4:1 so the name tag is never stretched
  return s;
}

// =====================================================================
// BOOST MODE: high-speed open zones (boost meter, grind rails, homing
// attack, air dash, dash panels / dash rings, rings, Boost Medals)
// =====================================================================
const BOOST = { BASE: 15.5, MAX: 31, DRAIN: 15, HOMING_R: 15, HOMING_V: 44, RAIL_MIN: 14, RAIL_MAX: 36 };
const RING_GEO = new THREE.TorusGeometry(0.42, 0.1, 8, 22);
function buildRingMesh() {
  const g = new THREE.Group();
  const m = new THREE.Mesh(RING_GEO, mat(0xffd23f, { emissive: 0x7a5200, metalness: 0.4, roughness: 0.35 }));
  g.add(m); shadowy(g, true, false);
  return g;
}
function boostSetup(opts) {
  W.boost = Object.assign({ rails: [], pods: [], panels: [], hoops: [], rings: 0, ringsMax: 0, rank: [70, 95, 130] }, opts || {});
  P.meter = 60; P.boosting = false; P.grind = null; P.railCd = 0; P.speedHold = 0; P.airDashed = false; P.crashV = 0;
  $('boost-hud').classList.remove('hidden'); document.body.classList.add('boostzone');
}
function boostOff() { W.boost = null; P.boosting = false; P.grind = null; const h = $('boost-hud'); if (h) h.classList.add('hidden'); document.body.classList.remove('boostzone'); }
// ---- rails ----
const _q = new THREE.Quaternion(), _up = new V3(0, 1, 0), _t1 = new V3(), _t2 = new V3();
function addRail(ctrl, opts) {
  opts = opts || {};
  const curve = new THREE.CatmullRomCurve3(ctrl.map((p) => new V3(p[0], p[1], p[2])), !!opts.closed, 'catmullrom', 0.5);
  const len0 = curve.getLength();
  const n = Math.max(4, Math.round(len0 / 1.1));
  const pts = curve.getSpacedPoints(n);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const R = { pts, cum, len: cum[cum.length - 1], min: new V3(Infinity, Infinity, Infinity), max: new V3(-Infinity, -Infinity, -Infinity) };
  for (const p of pts) { R.min.min(p); R.max.max(p); }
  R.min.subScalar(2); R.max.addScalar(2);
  W.boost.rails.push(R);
  // visuals: a shiny rail tube, glowing guide strip, and supports down to the ground
  const railM = mat(0xd8dee9, { metalness: 0.75, roughness: 0.25 }), glowM = basic(opts.glow || 0x3ff0ff);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    _t1.subVectors(b, a); const L = _t1.length(); _t1.normalize();
    _q.setFromUnitVectors(_up, _t1);
    const tube = new THREE.Mesh(G.cyl8, railM); tube.scale.set(0.13, L + 0.04, 0.13); tube.quaternion.copy(_q); tube.position.copy(a).add(b).multiplyScalar(0.5);
    (W.deco || W.root).add(tube);
    const strip = new THREE.Mesh(G.box, glowM); strip.scale.set(0.06, L + 0.02, 0.06); strip.quaternion.copy(_q); strip.position.copy(tube.position); strip.position.y -= 0.16;
    (W.deco || W.root).add(strip);
  }
  const every = opts.posts === false ? 0 : 7;
  if (every) for (let i = 0; i < pts.length; i += every) {
    const p = pts[i];
    const gy = groundTopAt(p.x, p.z, p.y - 0.5);
    if (gy === -Infinity || p.y - gy > 26) continue;
    const h = p.y - gy - 0.15;
    if (h < 0.4) continue;
    const post = M(G.cyl8, 0x5d6673, 0.12, h, 0.12); post.position.set(p.x, gy + h / 2, p.z); (W.deco || W.root).add(post);
    const foot = M(G.cyl8, 0x3a3f4a, 0.35, 0.2, 0.35); foot.position.set(p.x, gy + 0.1, p.z); (W.deco || W.root).add(foot);
  }
  return R;
}
function railPoint(R, s, out) {
  s = clamp(s, 0, R.len);
  let lo = 0, hi = R.cum.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (R.cum[mid] <= s) lo = mid; else hi = mid; }
  const a = R.pts[lo], b = R.pts[hi], seg = R.cum[hi] - R.cum[lo] || 1, k = (s - R.cum[lo]) / seg;
  out.set(lerp(a.x, b.x, k), lerp(a.y, b.y, k), lerp(a.z, b.z, k));
  return _t2.subVectors(b, a).normalize();
}
function nearestOnRail(R, p) {
  if (p.x < R.min.x || p.x > R.max.x || p.z < R.min.z || p.z > R.max.z || p.y < R.min.y - 1 || p.y > R.max.y + 2) return null;
  let best = null, bd = Infinity;
  for (let i = 1; i < R.pts.length; i++) {
    const a = R.pts[i - 1], b = R.pts[i];
    const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
    const l2 = abx * abx + aby * aby + abz * abz || 1;
    let k = ((p.x - a.x) * abx + (p.y + 0.2 - a.y) * aby + (p.z - a.z) * abz) / l2; k = clamp(k, 0, 1);
    const cx = a.x + abx * k, cy = a.y + aby * k, cz = a.z + abz * k;
    const dh = (p.x - cx) * (p.x - cx) + (p.z - cz) * (p.z - cz);
    const dy = p.y - (cy + 0.12);
    if (dh > 2.9 || dy < -0.7 || dy > 1.1) continue;
    const d = dh + dy * dy * 0.3;
    if (d < bd) { bd = d; best = { s: R.cum[i - 1] + Math.sqrt(l2) * k, y: cy }; }
  }
  return best;
}
// ---- homing pods (floating targets for chaining homing attacks) ----
function addPod(x, y, z) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(G.sphere, mat(0x3fa0ff, { emissive: 0x0a3a88, metalness: 0.3, roughness: 0.3 })); core.scale.setScalar(0.55); g.add(core);
  const ring = new THREE.Mesh(G.torus, basic(0xffffff)); ring.scale.setScalar(0.85); g.add(ring);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0x56c8ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(2.6); g.add(glow);
  g.position.set(x, y, z); W.root.add(g);
  const pod = { pos: new V3(x, y, z), g, active: true, t: 0, isPod: true };
  W.boost.pods.push(pod);
  W.things.push({ update(dt) {
    ring.rotation.y += dt * 2; ring.rotation.x = 0.6; g.position.y = y + Math.sin(W.time * 2 + x) * 0.15;
    if (!pod.active) { pod.t -= dt; if (pod.t <= 0) { pod.active = true; g.visible = true; } }
  } });
  return pod;
}
// ---- dash panels (ground) and dash rings (air) ----
function addDashPanel(x, top, z, yaw, speed) {
  const g = new THREE.Group();
  const base = M(G.box, 0x2b2f48, 2.6, 0.12, 3.2); base.position.y = 0.06; g.add(base);
  const glow = new THREE.Mesh(G.box, basic(0x3ff0ff)); glow.scale.set(2.2, 0.13, 2.8); glow.position.y = 0.07; g.add(glow);
  const arrows = [];
  for (let i = 0; i < 3; i++) { const a = new THREE.Mesh(G.cone6, basic(0xffffff)); a.scale.set(0.5, 0.7, 0.18); a.rotation.x = -Math.PI / 2; a.position.set(0, 0.16, 0.9 - i * 0.9); g.add(a); arrows.push(a); }
  g.rotation.y = yaw; g.position.set(x, top, z); W.root.add(g);
  const pnl = { x, top, z, yaw, speed: speed || 34, cd: 0 };
  W.boost.panels.push(pnl);
  W.things.push({ update(dt) { pnl.cd -= dt; for (let i = 0; i < 3; i++) arrows[i].material = basic(((W.time * 6 - i) | 0) % 3 === 0 ? 0xffe14d : 0xffffff); } });
  return pnl;
}
function addHoop(x, y, z, dir, speed) {
  const d = new V3(dir[0], dir[1], dir[2]).normalize();
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.16, 8, 26), mat(0xff4fd8, { emissive: 0x5a0a48 })); g.add(ring);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.05, 6, 26), basic(0xffffff)); g.add(inner);
  g.position.set(x, y, z); g.lookAt(x + d.x, y + d.y, z + d.z); W.root.add(g);
  const h = { pos: new V3(x, y, z), dir: d, speed: speed || 30, cd: 0 };
  W.boost.hoops.push(h);
  W.things.push({ update(dt) { h.cd -= dt; inner.rotation.z += dt * 3; } });
  return h;
}
function addGoalRing(x, top, z) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.35, 10, 32), mat(0xffd23f, { emissive: 0x7a5200, metalness: 0.5, roughness: 0.3 }));
  ring.position.y = 3.4; g.add(ring);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xfff1a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(9); glow.position.y = 3.4; g.add(glow);
  for (const s of [-1, 1]) { const post = M(G.cyl8, 0x2b2f48, 0.25, 1.2, 0.25); post.position.set(s * 2.2, 0.6, 0); g.add(post); }
  g.position.set(x, top, z); W.root.add(g);
  W.things.push({ update() {
    ring.rotation.y = W.time * 1.5;
    if (W.goalDone || P.state === 'dead') return;
    const dx = P.pos.x - x, dz = P.pos.z - z, dy = P.pos.y + 0.75 - (top + 3.4);
    if (dx * dx + dz * dz < 7 && Math.abs(dy) < 3.5) { W.goalDone = true; P.grind = null; if (NET.on) netReachGoal(g); else winLevel(g); }
  } });
}
// ---- per-tick hooks called from playerTick ----
function boostTop() {
  const hs = Math.hypot(P.vel.x, P.vel.z);
  let top = P.boosting ? BOOST.MAX : BOOST.BASE;
  if (P.speedHold > 0) top = Math.max(top, hs);
  return top / RUN * RUN;
}
function boostInput(dt) {
  const want = input.boost && P.meter > 0 && P.state !== 'hurt' && P.state !== 'dead' && !P.frozen;
  if (want && !P.boosting) { Snd.S.boost(); ringFx(P.pos.x, P.pos.y + 0.6, P.pos.z, 0x3ff0ff, 2.2); }
  P.boosting = want;
  if (P.boosting) P.meter = Math.max(0, P.meter - BOOST.DRAIN * dt);
  P.speedHold = Math.max(0, P.speedHold - dt);
  P.railCd = Math.max(0, P.railCd - dt);
}
// returns true if it handled the whole tick (grinding / homing)
function boostPre(dt) {
  boostInput(dt);
  if (P.grind) { grindTick(dt); return true; }
  if (P.state === 'homing') { homingTick(dt); return true; }
  return false;
}
function grindTick(dt) {
  const g = P.grind, R = g.rail;
  const tan = railPoint(R, g.s, _t1).clone();
  if (P.boosting) g.v = Math.min(BOOST.RAIL_MAX, g.v + 34 * dt); else g.v = lerp(g.v, 22, damp(0.6, dt));
  g.v -= tan.y * g.dir * 22 * dt;
  g.v = clamp(g.v, BOOST.RAIL_MIN * 0.7, BOOST.RAIL_MAX);
  g.s += g.dir * g.v * dt;
  P.grounded = false; P.ground = null; P.canDouble = true; P.airDashed = false;
  if (input.jumpPressed) {
    P.vel.set(tan.x * g.dir * g.v * 0.85, JUMP_V * 0.95 + Math.max(0, tan.y * g.dir * g.v * 0.5), tan.z * g.dir * g.v * 0.85);
    P.grind = null; P.railCd = 0.35; P.state = 'normal'; P.stateT = 0; P.jumping = true; P.speedHold = 1.2;
    Snd.S.jump(); return;
  }
  if (g.s <= 0 || g.s >= R.len) {
    P.vel.set(tan.x * g.dir * g.v, Math.max(4, tan.y * g.dir * g.v + 4), tan.z * g.dir * g.v);
    P.grind = null; P.railCd = 0.35; P.state = 'normal'; P.stateT = 0; P.speedHold = 1.5;
    return;
  }
  railPoint(R, g.s, P.pos); P.pos.y += 0.12;
  P.vel.set(tan.x * g.dir * g.v, tan.y * g.dir * g.v, tan.z * g.dir * g.v);
  P.facing = Math.atan2(tan.x * g.dir, tan.z * g.dir);
  g.spark -= dt;
  if (g.spark <= 0) { g.spark = 0.045; burst(P.pos.x, P.pos.y, P.pos.z, P.boosting ? 0x7af6ff : 0xffb43a, 2, 3, 0.25, 6, 0.8); }
  g.snd -= dt; if (g.snd <= 0) { g.snd = 0.16; if (Snd.S.grind) Snd.S.grind(); }
  boostTouchEnemies();
}
function tryAttachRail() {
  if (P.grind || P.railCd > 0 || P.state === 'dead' || P.state === 'hurt' || P.state === 'homing' || P.frozen) return false;
  if (P.vel.y > 2.5 && !P.grounded) return false;
  for (const R of W.boost.rails) {
    const hit = nearestOnRail(R, P.pos);
    if (!hit) continue;
    const tan = railPoint(R, hit.s, _t2);
    const hx = P.vel.x, hz = P.vel.z;
    let along = hx * tan.x + hz * tan.z + P.vel.y * tan.y;
    let dir = along >= 0 ? 1 : -1;
    if (Math.abs(along) < 3) { dir = (Math.sin(P.facing) * tan.x + Math.cos(P.facing) * tan.z) >= 0 ? 1 : -1; }
    if (hit.s < 1.5) dir = 1; else if (hit.s > R.len - 1.5) dir = -1;
    P.grind = { rail: R, s: hit.s, dir, v: Math.max(BOOST.RAIL_MIN, Math.abs(along), Math.hypot(hx, hz)), spark: 0, snd: 0 };
    P.state = 'grind'; P.stateT = 0; P.jumping = false;
    Snd.S.land && Snd.S.land();
    ringFx(P.pos.x, P.pos.y, P.pos.z, 0x7af6ff, 1.6);
    return true;
  }
  return false;
}
function homingTarget() {
  let best = null, bd = Infinity;
  const fx = Math.sin(P.facing), fz = Math.cos(P.facing);
  const consider = (p, obj) => {
    const dx = p.x - P.pos.x, dy = p.y - (P.pos.y + 0.6), dz = p.z - P.pos.z;
    const d = Math.hypot(dx, dy, dz);
    if (d > BOOST.HOMING_R || d < 0.5 || dy > 7 || dy < -9) return;
    const dh = Math.hypot(dx, dz) || 1;
    const facing = (dx * fx + dz * fz) / dh;
    if (facing < 0.25 && d > 4) return;
    const score = d * (1.6 - facing);
    if (score < bd) { bd = score; best = obj; }
  };
  for (const e of W.enemies) if (e.alive && e.spinnable !== false) consider(_t1.set(e.pos.x, e.pos.y + e.h * 0.5, e.pos.z), e);
  for (const pd of W.boost.pods) if (pd.active) consider(pd.pos, pd);
  return best;
}
function boostAirAction() { // called on ACTION in mid-air in a boost zone
  const t = homingTarget();
  if (t) { P.state = 'homing'; P.stateT = 0; P.homing = t; P.jumping = false; Snd.S.spin(); ringFx(P.pos.x, P.pos.y + 0.6, P.pos.z, 0x3ff0ff, 2); return true; }
  if (!P.airDashed) {
    const hs = Math.max(Math.hypot(P.vel.x, P.vel.z), 24);
    P.vel.x = Math.sin(P.facing) * hs; P.vel.z = Math.cos(P.facing) * hs; P.vel.y = Math.max(P.vel.y, 2);
    P.airDashed = true; P.speedHold = 0.9; P.state = 'normal'; P.stateT = 0;
    Snd.S.longjump(); ringFx(P.pos.x, P.pos.y + 0.6, P.pos.z, 0xffffff, 1.6); dust(P.pos.x, P.pos.y + 0.5, P.pos.z, 6);
    return true;
  }
  return true; // already used the air dash: do nothing (no ground pound in boost zones)
}
function homingTick(dt) {
  const t = P.homing;
  const tp = t.isPod ? t.pos : _t1.set(t.pos.x, t.pos.y + t.h * 0.5, t.pos.z);
  const alive = t.isPod ? t.active : t.alive;
  const dx = tp.x - P.pos.x, dy = tp.y - (P.pos.y + 0.6), dz = tp.z - P.pos.z, d = Math.hypot(dx, dy, dz);
  if (!alive || P.stateT > 0.7) { P.state = 'normal'; P.stateT = 0; P.homing = null; return; }
  if (d < 1.1) {
    if (t.isPod) { t.active = false; t.t = 2.6; t.g.visible = false; burst(tp.x, tp.y, tp.z, 0x56c8ff, 14, 6, 0.5); Snd.S.stomp(); }
    else killEnemy(t, 'spin');
    P.meter = Math.min(100, P.meter + 8);
    P.vel.set(dx * 0.4, 14.5, dz * 0.4); P.state = 'normal'; P.stateT = 0; P.homing = null; P.canDouble = true; P.airDashed = false; P.flip = 1;
    shakeAmt = Math.max(shakeAmt, 0.12);
    return;
  }
  P.vel.set(dx / d * BOOST.HOMING_V, dy / d * BOOST.HOMING_V, dz / d * BOOST.HOMING_V);
  P.facing = Math.atan2(dx, dz);
  P.grounded = false; P.ground = null;
  pMove('x', P.vel.x * dt); pMove('z', P.vel.z * dt); pMove('y', P.vel.y * dt);
  if (P.grounded) { P.state = 'normal'; P.stateT = 0; P.homing = null; }
}
function boostTouchEnemies() {
  for (const e of W.enemies) {
    if (!e.alive) continue;
    const dx = e.pos.x - P.pos.x, dz = e.pos.z - P.pos.z, dy = e.pos.y - P.pos.y;
    if (dx * dx + dz * dz < 2.6 && dy > -1.2 && dy < 1.6) {
      if (e.spinnable !== false && (P.boosting || P.grind)) { killEnemy(e, 'spin'); P.meter = Math.min(100, P.meter + 5); }
    }
  }
}
// after normal movement: rails, panels, hoops, crashes, boost-kills
function boostPost(dt) {
  if (P.state === 'dead' || P.frozen) return;
  if (P.grounded) P.airDashed = false;
  // fell off a rail or a jump into the valley below: never leave the player stranded down there.
  // Costs the rings you carry (or a heart with none), then puts you back on the last solid ground.
  if (P.grounded && !P.grind && P.pos.y > -1.5) { if (!W.boost.safe) W.boost.safe = new V3(); W.boost.safe.copy(P.pos); W.boost.safeYaw = P.facing; }
  if (P.pos.y < -3.5 && !P.grind) {
    if (!W.boost.safe) W.boost.safe = new V3(0, 0.2, 10);
    const had = W.boost.rings;
    if (had > 0) { W.boost.rings = 0; showToast('<b>SPLASH!</b> You dropped your ' + had + ' rings. Back on track!', 2.2); }
    else { P.health = Math.max(1, P.health - 1); updateHUD(true); showToast('<b>SPLASH!</b> That cost a heart. Back on track!', 2.2); }
    P.meter = Math.max(0, P.meter - 20);
    P.pos.copy(W.boost.safe); P.pos.y += 0.3; P.vel.set(0, 0, 0); P.facing = W.boost.safeYaw || 0; P.boosting = false;
    P.invuln = HURT_INVULN; cam.target.set(P.pos.x, P.pos.y + 1.4, P.pos.z); Snd.S.hurt();
    return;
  }
  // crash: slamming into a wall at boost speed has a real cost
  if (P.crashV > 21 && P.state !== 'hurt' && P.invuln <= 0) boostCrash(P.crashV);
  P.crashV = 0;
  if (tryAttachRail()) return;
  for (const pn of W.boost.panels) {
    if (pn.cd > 0 || !P.grounded) continue;
    const dx = P.pos.x - pn.x, dz = P.pos.z - pn.z;
    const c = Math.cos(pn.yaw), s = Math.sin(pn.yaw);
    const lx = dx * c - dz * s, lz = dx * s + dz * c;
    if (Math.abs(lx) < 1.4 && Math.abs(lz) < 1.7 && Math.abs(P.pos.y - pn.top) < 0.5) {
      const fx = -Math.sin(pn.yaw), fz = -Math.cos(pn.yaw);
      P.vel.x = fx * pn.speed; P.vel.z = fz * pn.speed; P.facing = Math.atan2(fx, fz); P.speedHold = 1.1; pn.cd = 0.5;
      cam.yaw = angleLerp(cam.yaw, P.facing + Math.PI, 0.5);
      Snd.S.boost(); ringFx(P.pos.x, P.pos.y, P.pos.z, 0x3ff0ff, 2);
    }
  }
  for (const h of W.boost.hoops) {
    if (h.cd > 0) continue;
    if (P.pos.distanceToSquared(_t1.set(h.pos.x, h.pos.y - 0.7, h.pos.z)) < 2.4 * 2.4) {
      P.vel.copy(h.dir).multiplyScalar(h.speed); P.state = 'launch'; P.stateT = 0; P.grounded = false; P.canDouble = true; P.airDashed = false; P.jumping = false; h.cd = 0.6;
      P.facing = Math.atan2(h.dir.x, h.dir.z); P.speedHold = 1.5;
      Snd.S.spring(); ringFx(h.pos.x, h.pos.y - 0.7, h.pos.z, 0xff4fd8, 2.5);
    }
  }
  if (P.boosting) boostTouchEnemies();
}
function boostCrash(v) {
  const lost = Math.min(W.boost.rings, 10);
  W.boost.rings -= lost;
  P.meter = Math.max(0, P.meter - 25);
  P.state = 'hurt'; P.stateT = 0; P.invuln = 1.0; P.boosting = false; P.speedHold = 0;
  const fx = Math.sin(P.facing), fz = Math.cos(P.facing);
  P.vel.set(-fx * 7, 7, -fz * 7);
  shakeAmt = Math.max(shakeAmt, 0.45); Snd.S.thud(); burst(P.pos.x + fx, P.pos.y + 1, P.pos.z + fz, 0xffffff, 14, 6, 0.5);
  if (lost > 0) { scatterRings(Math.min(lost, 6)); showToast('<b>CRASH!</b> Lost ' + lost + ' rings and boost. Grab them back fast!', 2.6); }
  else { P.health--; updateHUD(true); showToast('<b>CRASH!</b> No rings to protect you: -1 heart', 2.6); if (P.health <= 0) killPlayer(); }
  void v;
}
// rings spill out and blink away after a few seconds (like the real thing)
function scatterRings(n) {
  const seq = W.itemSeq; // spilled rings are local-only: don't shift co-op item ids
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, it = addItem('coin', P.pos.x, P.pos.y + 1.2, P.pos.z);
    it.spill = { vx: Math.cos(a) * 5, vy: 7, vz: Math.sin(a) * 5, life: 4 }; it.id = 'spill' + Math.random();
  }
  if (seq !== undefined) W.itemSeq = seq;
}
function boostHurt(from) { // rings protect you in boost zones
  if (!W.boost || W.boost.rings <= 0) return false;
  const lost = W.boost.rings; W.boost.rings = 0;
  scatterRings(Math.min(lost, 8));
  P.invuln = HURT_INVULN; P.state = 'hurt'; P.stateT = 0; P.jumping = false; P.grind = null; P.boosting = false;
  let dx = P.pos.x - from.x, dz = P.pos.z - from.z; const d = Math.hypot(dx, dz) || 1;
  P.vel.set(dx / d * 8, 8, dz / d * 8);
  Snd.S.hurt(); shakeAmt = Math.max(shakeAmt, 0.25);
  showToast('<b>OUCH!</b> You dropped your ' + lost + ' rings!', 2.2);
  return true;
}
function boostRing() { if (!W.boost) return; W.boost.rings++; P.meter = Math.min(100, P.meter + 3.5); }
// ---- per-frame visuals: FOV, speed lines, HUD, trail ----
let speedFx = 0;
function boostFrame(dt) {
  const hs = W.boost ? Math.hypot(P.vel.x, P.vel.z, P.grind ? P.vel.y : 0) : 0;
  const k = clamp((hs - 14) / 18, 0, 1);
  speedFx = lerp(speedFx, mode === 'playing' ? k : 0, damp(5, dt));
  const baseFov = window.innerWidth < window.innerHeight ? 72 : 60;
  const f = baseFov + speedFx * 16;
  if (Math.abs(camera.fov - f) > 0.05) { camera.fov = f; camera.updateProjectionMatrix(); }
  const sl = $('speedlines'); if (sl) sl.style.opacity = (speedFx * 0.85).toFixed(2);
  const bh = $('boost-hud'); if (bh) bh.classList.toggle('hidden', !W.boost || (mode !== 'playing' && mode !== 'paused'));
  if (!W.boost) return;
  $('boost-fill').style.width = P.meter.toFixed(1) + '%';
  $('boost-hud').classList.toggle('on', !!P.boosting);
  $('boost-rings').textContent = W.boost.rings;
  $('boost-speed').textContent = Math.round(hs * 3.6) + ' km/h';
  if (P.boosting && mode === 'playing' && Math.random() < 0.6) burst(P.pos.x, P.pos.y + 0.7, P.pos.z, 0x7af6ff, 1, 1, 0.3, 0, 1.2);
}
// pose tweaks for grind / homing (after the normal hero animation)
function boostAnim(dt) {
  const m = P.model; if (!m) return;
  if (P.state === 'homing') { m.body.rotation.x = (W.time * 26) % TAU; m.body.position.y = 0.4; m.armL.rotation.set(-2.5, 0, 0); m.armR.rotation.set(-2.5, 0, 0); }
  else if (P.grind) { m.body.rotation.z = Math.sin(W.time * 3) * 0.08; m.armL.rotation.set(0, 0, -1.3); m.armR.rotation.set(0, 0, 1.3); m.legL.rotation.set(0.3, 0, 0); m.legR.rotation.set(-0.3, 0, 0); m.body.rotation.y = 0.5; }
  else if (P.boosting && P.grounded) { m.body.rotation.x = 0.35; }
  void dt;
}

// =====================================================================
// GROK LAND 2 props (static ones go to W.deco and get batched)
// =====================================================================
Object.assign(STYLE, {
  park: { side: 0x9a6a40, top: 0x5fcf4a, cap: 0.5 },
  path: { side: 0xbfa77a, top: 0xe8d6a8, cap: 0 },
  barn: { side: 0xb83a2e, top: 0x7a2a22, cap: 0.3 },
  hay: { side: 0xe8c55a, top: 0xf4d978, cap: 0.12 },
  mesa: { side: 0xc8643a, top: 0xe8a060, cap: 0.4 },
  redrock: { side: 0xa84a2a, top: 0xd07a48, cap: 0.3 },
  desert: { side: 0xc8915a, top: 0xf0cf8e, cap: 0.4 },
  mine: { side: 0x6a4a32, top: 0x8a6a4a, cap: 0.2 },
  lab: { side: 0xc8ccd8, top: 0xeef0f6, cap: 0.18 },
  cheese: { side: 0xf5c542, top: 0xffdf6e, cap: 0.15, emissive: 0x2a1a00 },
  tech: { side: 0x3a7a5a, top: 0x9ee6b8, cap: 0.18 },
  shell: { side: 0x8a6a3a, top: 0xc8a060, cap: 0.25 },
});
// a static, batched ground/wall block (no per-frame cost, joins the merged mesh)
const PRISM = (() => { const g = new THREE.CylinderGeometry(1 / 1.732, 1 / 1.732, 1, 3); g.rotateZ(Math.PI / 2); g.rotateX(-Math.PI / 2); g.translate(0, 0.2887, 0); return g; })();
function gnd(x, top, z, w, d, h, style) {
  h = h || 1;
  const mesh = styledMesh(w, h, d, style);
  mesh.position.set(x, top - h / 2, z);
  (W.deco || W.root).add(mesh);
  const s = addSolid(x, top - h / 2, z, w / 2, h / 2, d / 2, 'static', null);
  s.style = style;
  return s;
}
// stair ramp from (z0, y0) to (z1, y1) along -z, each step <= 0.3 high so you run straight up it
function stairs(x, z0, z1, y0, y1, w, style, base) {
  const n = Math.max(1, Math.ceil((y1 - y0) / 0.3));
  const dz = (z1 - z0) / n;
  for (let i = 0; i < n; i++) {
    const top = y0 + (y1 - y0) * (i + 1) / n;
    gnd(x, top, z0 + dz * (i + 0.5), w, Math.abs(dz) + 0.02, top - (base === undefined ? y0 - 4 : base), style);
  }
}
function dTree(x, top, z, s, leaf) {
  s = s || 1;
  const t = buildTree(s, leaf); deco(t, x, top, z, (x * 7 + z * 3) % TAU);
  addSolid(x, top + 1.2 * s, z, 0.3 * s, 1.2 * s, 0.3 * s, 'static', null).noCam = true;
}
function dPine(x, top, z, s, col) {
  s = s || 1;
  const g = new THREE.Group();
  const trunk = M(G.cyl8, 0x7a4a24, 0.2 * s, 1 * s, 0.2 * s); trunk.position.y = 0.5 * s; g.add(trunk);
  for (let i = 0; i < 3; i++) { const c = M(G.cone, col || [0x2f8a4a, 0x3a9a55, 0x2a7a40][i], (1.3 - i * 0.3) * s, 1.5 * s, (1.3 - i * 0.3) * s); c.position.y = (1.3 + i * 0.85) * s; g.add(c); }
  deco(g, x, top, z);
  addSolid(x, top + 1.2 * s, z, 0.3 * s, 1.2 * s, 0.3 * s, 'static', null).noCam = true;
}
function dLamp(x, top, z, col) {
  const g = new THREE.Group();
  const post = M(G.cyl8, 0x2b2f48, 0.08, 3, 0.08); post.position.y = 1.5; g.add(post);
  const base = M(G.cyl8, 0x2b2f48, 0.2, 0.3, 0.2); base.position.y = 0.15; g.add(base);
  const arm = M(G.box, 0x2b2f48, 0.6, 0.06, 0.06); arm.position.set(0.25, 2.95, 0); g.add(arm);
  const lamp = new THREE.Mesh(G.sphereLo, basic(col || 0xfff1b0)); lamp.scale.set(0.22, 0.18, 0.22); lamp.position.set(0.5, 2.82, 0); g.add(lamp);
  const cap = M(G.cone6, 0x2b2f48, 0.28, 0.2, 0.28); cap.position.set(0.5, 3.0, 0); g.add(cap);
  deco(g, x, top, z, x > 0 ? Math.PI : 0);
  addSolid(x, top + 1.5, z, 0.12, 1.5, 0.12, 'static', null).noCam = true;
}
function dFence(x1, z1, x2, z2, top, col) {
  const L = Math.hypot(x2 - x1, z2 - z1), n = Math.max(1, Math.round(L / 2.2));
  const c = col || 0xf4efe6;
  for (let i = 0; i <= n; i++) { const t = i / n; const p = M(G.box, c, 0.18, 1.1, 0.18); p.position.set(lerp(x1, x2, t), top + 0.55, lerp(z1, z2, t)); (W.deco || W.root).add(p); }
  const a = Math.atan2(x2 - x1, z2 - z1);
  for (const hy of [0.45, 0.85]) { const r = M(G.box, c, 0.08, 0.12, L); r.position.set((x1 + x2) / 2, top + hy, (z1 + z2) / 2); r.rotation.y = a; (W.deco || W.root).add(r); }
  // thin solid so you can't pass, but it is low enough to hop
  const ax = Math.abs(x2 - x1) > Math.abs(z2 - z1);
  addSolid((x1 + x2) / 2, top + 0.55, (z1 + z2) / 2, ax ? L / 2 : 0.12, 0.55, ax ? 0.12 : L / 2, 'static', null).noCam = true;
}
const FLOWER_SET = [0xff5a8a, 0xffffff, 0xff9d2e, 0xb06bff, 0xffe14a];
function dFlowerBed(x, top, z, w, d, seed) {
  const r = mulberry(seed || (x * 31 + z * 17) | 0);
  const g = new THREE.Group();
  const soil = M(G.box, 0x6a4128, w, 0.18, d); soil.position.y = 0.09; g.add(soil);
  for (const [sx, sz, lw, ld] of [[0, d / 2, w + 0.2, 0.2], [0, -d / 2, w + 0.2, 0.2], [w / 2, 0, 0.2, d], [-w / 2, 0, 0.2, d]]) { const b = M(G.box, 0xc98a4b, lw, 0.3, ld); b.position.set(sx, 0.15, sz); g.add(b); }
  const nx = Math.max(1, Math.floor(w / 0.6)), nz = Math.max(1, Math.floor(d / 0.6));
  const col = FLOWER_SET[(r() * FLOWER_SET.length) | 0], col2 = FLOWER_SET[(r() * FLOWER_SET.length) | 0];
  for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) { const f = buildFlower((i + k) % 2 ? col : col2); f.position.set(-w / 2 + (i + 0.5) * w / nx, 0.15, -d / 2 + (k + 0.5) * d / nz); g.add(f); }
  deco(g, x, top, z);
}
function dRocks(x, top, z, n, seed, col) {
  const r = mulberry(seed || 3);
  for (let i = 0; i < n; i++) { const s = 0.4 + r() * 0.9; const m = M(G.dodeca, col || [0x9a9a9a, 0x8a8f99, 0xb0aaa0][i % 3], s, s * 0.7, s); m.position.set(x + (r() - 0.5) * 3, top + s * 0.3, z + (r() - 0.5) * 3); m.rotation.set(r() * 3, r() * 3, 0); (W.deco || W.root).add(m); }
}
function dBench(x, top, z, ry) {
  const g = new THREE.Group();
  const seat = M(G.box, 0xc07f3f, 1.8, 0.1, 0.5); seat.position.y = 0.5; g.add(seat);
  const back = M(G.box, 0xc07f3f, 1.8, 0.45, 0.08); back.position.set(0, 0.8, -0.22); g.add(back);
  for (const s of [-0.75, 0.75]) { const l = M(G.box, 0x2b2f48, 0.08, 0.5, 0.45); l.position.set(s, 0.25, 0); g.add(l); }
  deco(g, x, top, z, ry);
}
function dPicnic(x, top, z, ry, cloth) {
  const g = new THREE.Group();
  const t = M(G.box, 0xc07f3f, 1.4, 0.1, 2.2); t.position.y = 0.8; g.add(t);
  const cl = M(G.box, cloth || 0xff4d4d, 1.2, 0.02, 1.4); cl.position.y = 0.86; g.add(cl);
  for (const s of [-1, 1]) { const b = M(G.box, 0xa86b3c, 0.4, 0.08, 2.2); b.position.set(s * 1.0, 0.45, 0); g.add(b); const l = M(G.box, 0x7a4a24, 0.1, 0.8, 0.1); l.position.set(s * 0.5, 0.4, 0.9); g.add(l); const l2 = l.clone(); l2.position.z = -0.9; g.add(l2); }
  const basket = M(G.box, 0xd89a48, 0.4, 0.3, 0.3); basket.position.set(0.2, 1.0, 0.3); g.add(basket);
  const pie = M(G.cyl, 0xe8a060, 0.22, 0.08, 0.22); pie.position.set(-0.3, 0.92, -0.4); g.add(pie);
  deco(g, x, top, z, ry);
  addSolid(x, top + 0.45, z, 0.9, 0.45, 0.9, 'static', null).noCam = true;
}
function signTex(text, bg, fg) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d'); g.fillStyle = bg || '#c98a4b'; g.fillRect(0, 0, 256, 128);
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 8; g.strokeRect(4, 4, 248, 120);
  g.fillStyle = fg || '#fff6d0'; g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = 48; g.font = 'bold ' + fs + 'px "Trebuchet MS",Arial';
  while (g.measureText(text).width > 228 && fs > 18) { fs -= 2; g.font = 'bold ' + fs + 'px "Trebuchet MS",Arial'; }
  g.fillText(text, 128, 66);
  return new THREE.CanvasTexture(c);
}
// signboard: the 2:1 canvas sits on a 2:1 board, so the words are never stretched
function dSign(x, top, z, ry, text, bg, w) {
  w = w || 2.4;
  const g = new THREE.Group();
  for (const s of [-1, 1]) { const p = M(G.box, 0x7a4a24, 0.14, 2, 0.14); p.position.set(s * w * 0.4, 1, 0); g.add(p); }
  const tm = new THREE.MeshBasicMaterial({ map: signTex(text, bg) });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 2), tm); board.position.set(0, 1.9, 0.08); board.userData.noMerge = true; g.add(board);
  const back = M(G.box, 0x7a4a24, w + 0.1, w / 2 + 0.1, 0.12); back.position.set(0, 1.9, 0); g.add(back);
  g.position.set(x, top, z); g.rotation.y = ry || 0; W.root.add(g);
}
function dHay(x, top, z, w, d, h) { return gnd(x, top + (h || 1.4), z, w || 2, d || 2, h || 1.4, 'hay'); }
function dBarn(x, top, z, w, d, h, ry) {
  const s = gnd(x, top + h, z, w, d, h, 'barn');
  const roof = new THREE.Group();
  const pr = new THREE.Mesh(PRISM, mat(0x5a2a22)); pr.scale.set(w + 0.5, h * 0.55, d + 0.5); roof.add(pr);
  const ridge = M(G.box, 0xf4efe6, w + 0.7, 0.18, 0.3); ridge.position.y = h * 0.55 * 0.866 + 0.05; roof.add(ridge);
  const gab = new THREE.Mesh(PRISM, mat(0xb83a2e)); gab.scale.set(w + 0.02, h * 0.55 - 0.1, d - 0.2); roof.add(gab);
  void ry;
  // big doors and windows painted on (the barn is closed: nothing inside to walk into)
  const door = M(G.box, 0xf4efe6, 3.2, 3.4, 0.12); door.position.set(0, 1.7, d / 2 + 0.06); const door2 = M(G.box, 0x8a2a20, 2.8, 3.0, 0.14); door2.position.set(0, 1.6, d / 2 + 0.07);
  const xb = M(G.box, 0xf4efe6, 0.16, 3.6, 0.16); xb.rotation.z = 0.7; xb.position.set(0, 1.6, d / 2 + 0.12); const xb2 = xb.clone(); xb2.rotation.z = -0.7;
  const win = M(G.box, 0xf4efe6, 1.4, 1.2, 0.12); win.position.set(0, h - 1.2, d / 2 + 0.06); const win2 = M(G.box, 0x2b2f48, 1.1, 0.9, 0.14); win2.position.set(0, h - 1.2, d / 2 + 0.07);
  const g = new THREE.Group(); [door, door2, xb, xb2, win, win2].forEach((m) => g.add(m));
  deco(g, x, top, z);
  roof.position.set(x, top + h, z); (W.deco || W.root).add(roof);
  return s;
}
function addWindmill(x, top, z, h) {
  h = h || 9;
  const tower = new THREE.Group();
  const body = M(G.cyl8, 0xf4efe6, 1.6, h, 2.2); body.position.y = h / 2; tower.add(body);
  const cap = M(G.cone, 0x7a2a22, 2.0, 2, 2.0); cap.position.y = h + 1; tower.add(cap);
  const door = M(G.box, 0x7a4a24, 1, 1.8, 0.2); door.position.set(0, 0.9, 2.05); tower.add(door);
  deco(tower, x, top, z);
  addSolid(x, top + h / 2, z, 1.7, h / 2, 1.7, 'static', null);
  const hub = new THREE.Group(); hub.position.set(x, top + h - 0.5, z + 2.3); W.root.add(hub);
  for (let i = 0; i < 4; i++) { const b = M(G.box, 0xf4efe6, 0.7, 4.6, 0.08); b.position.y = 2.4; const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 2; arm.add(b); const lat = M(G.box, 0xc98a4b, 0.1, 4.4, 0.1); lat.position.set(-0.3, 2.4, 0.05); arm.add(lat); hub.add(arm); }
  W.things.push({ update(dt) { hub.rotation.z += dt * 0.8; } });
}
function dBleachers(x, top, z, w, ry) {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) { const st = M(G.box, i % 2 ? 0x3b8bff : 0xf4efe6, w, 0.4 + i * 0.5, 1); st.position.set(0, (0.4 + i * 0.5) / 2, -i * 1); g.add(st); }
  const r = mulberry(w * 13 | 0);
  for (let i = 0; i < Math.floor(w * 1.2); i++) { // a little cheering crowd
    const row = (r() * 4) | 0, fx = -w / 2 + 0.5 + r() * (w - 1);
    const b = M(G.sphereLo, [0xff4d4d, 0xffd23f, 0x59d65a, 0x38b6ff, 0xff6bd6][i % 5], 0.22, 0.3, 0.2); b.position.set(fx, 0.4 + row * 0.5 + 0.35, -row * 1); g.add(b);
    const hd = M(G.sphereLo, 0xffc996, 0.17); hd.position.set(fx, 0.4 + row * 0.5 + 0.75, -row * 1); g.add(hd);
  }
  deco(g, x, top, z, ry);
}
function dFlagLine(x1, z1, x2, z2, y) {
  const n = Math.max(2, Math.round(Math.hypot(x2 - x1, z2 - z1) / 1.2));
  const cols = [0xff4d4d, 0xffd23f, 0x59d65a, 0x38b6ff, 0xff6bd6];
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; const f = M(G.cone6, cols[i % 5], 0.25, 0.5, 0.06); f.rotation.x = Math.PI; f.position.set(lerp(x1, x2, t), y - Math.sin(t * Math.PI) * 0.8, lerp(z1, z2, t)); (W.deco || W.root).add(f); }
}
function dCrops(x, top, z, w, d, col) {
  const g = new THREE.Group();
  for (let i = 0; i < Math.floor(w / 1.2); i++) {
    const row = M(G.box, 0x6a4128, 0.8, 0.3, d); row.position.set(-w / 2 + 0.6 + i * 1.2, 0.15, 0); g.add(row);
    for (let k = 0; k < Math.floor(d / 0.9); k++) { const p = M(G.ico, col || 0x59d65a, 0.28); p.position.set(-w / 2 + 0.6 + i * 1.2, 0.5, -d / 2 + 0.45 + k * 0.9); g.add(p); }
  }
  deco(g, x, top, z);
}
function dHedgeWall(x, top, z, w, d, h) { return gnd(x, top + (h || 2.4), z, w, d, h || 2.4, 'hedge'); }
function dArch(x, top, z, w, text, col) {
  for (const s of [-1, 1]) gnd(x + s * w / 2, top + 5, z, 1.2, 1.2, 5, 'stone');
  const beam = M(G.box, col || 0x3b8bff, w + 1.6, 1.0, 1.0); beam.position.set(x, top + 5.5, z); (W.deco || W.root).add(beam);
  const tm = new THREE.MeshBasicMaterial({ map: signTex(text, '#1b1440', '#ffe14d') });
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), tm); b.position.set(x, top + 5.5, z + s * 0.52); if (s < 0) b.rotation.y = Math.PI; W.root.add(b); }
}

// =====================================================================
// NEW WORLD PROPS + HELPERS
// =====================================================================
function canyonEnv(c) {
  setupEnv(Object.assign({ top: 0x3a8cff, horizon: 0xffd9a8, bottom: 0xe8a070, fog: 0xffd9a8, fogNear: 90, fogFar: 300, hemiSky: 0xfff4e0, hemiGround: 0xb07040, hemiI: 0.8, sunColor: 0xffe2b8, sunI: 1.05, amb: 0.22, sunSprite: 0xfff0c0 }, c || {}));
  W.killY = -6;
  const river = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), mat(0x4aa8a0, { transparent: true, opacity: 0.9, roughness: 0.25, metalness: 0.1 }));
  river.rotation.x = -Math.PI / 2; river.position.y = -3.4; W.root.add(river); W.water = river;
  const r = mulberry(41);
  // canyon walls and far mesas so every direction has layered red rock
  for (const s of [-1, 1]) for (let i = 0; i < 9; i++) {
    const h = 18 + r() * 16, w = 14 + r() * 10, z = 30 - i * 26 - r() * 8;
    const m = styledMesh(w, h + 6, 22, i % 2 ? 'mesa' : 'redrock'); m.position.set(s * (34 + r() * 10), h / 2 - 6, z); (W.deco || W.root).add(m);
  }
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU, d = 190 + r() * 60, h = 30 + r() * 40, w = 30 + r() * 30;
    const m = styledMesh(w, h, w * 0.8, i % 3 ? 'mesa' : 'redrock'); m.position.set(Math.cos(a) * d, h / 2 - 10, Math.sin(a) * d - 60); (W.deco || W.root).add(m);
  }
  skyClouds(10, 45, 80, 80, 240, 7);
  W.scenery = (dt, t) => { river.position.y = -3.4 + Math.sin(t * 0.7) * 0.06; };
}
function dCactus(x, top, z, s) {
  s = s || 1;
  const g = new THREE.Group(), c = 0x3a9a55;
  const trunk = M(G.cyl8, c, 0.35 * s, 3 * s, 0.35 * s); trunk.position.y = 1.5 * s; g.add(trunk);
  const cap = M(G.sphereLo, c, 0.35 * s); cap.position.y = 3 * s; g.add(cap);
  for (const sd of [-1, 1]) {
    const arm = M(G.cyl8, c, 0.22 * s, 1.1 * s, 0.22 * s); arm.position.set(sd * 0.75 * s, (1.6 + (sd > 0 ? 0.4 : 0)) * s + 0.55 * s, 0); g.add(arm);
    const elbow = M(G.cyl8, c, 0.22 * s, 0.7 * s, 0.22 * s); elbow.rotation.z = Math.PI / 2; elbow.position.set(sd * 0.45 * s, (1.6 + (sd > 0 ? 0.4 : 0)) * s, 0); g.add(elbow);
  }
  const fl = M(G.ico, 0xff6bd6, 0.16 * s); fl.position.set(0.1, 3.3 * s, 0.1); g.add(fl);
  deco(g, x, top, z, (x + z) % 3);
  addSolid(x, top + 1.5 * s, z, 0.4 * s, 1.5 * s, 0.4 * s, 'static', null).noCam = true;
}
function dSkull(x, top, z, ry) {
  const g = new THREE.Group();
  const sk = M(G.sphereLo, 0xf4efe6, 0.4, 0.3, 0.5); sk.position.y = 0.25; g.add(sk);
  for (const s of [-1, 1]) { const h = M(G.cone6, 0xf4efe6, 0.09, 0.6, 0.09); h.rotation.z = s * -1.2; h.position.set(s * 0.5, 0.4, -0.1); g.add(h); const e = M(G.sphereLo, 0x2b1d14, 0.08); e.position.set(s * 0.15, 0.32, 0.38); g.add(e); }
  deco(g, x, top, z, ry);
}
function dWagon(x, top, z, ry) {
  const g = new THREE.Group();
  const bed = M(G.box, 0xa86b3c, 2.2, 0.6, 3.6); bed.position.y = 1.0; g.add(bed);
  for (const sx of [-1.15, 1.15]) for (const sz of [-1.2, 1.2]) { const wh = M(G.cyl, 0x6b3b1f, 0.6, 0.12, 0.6); wh.rotation.z = Math.PI / 2; wh.position.set(sx, 0.6, sz); g.add(wh); }
  const cover = M(new THREE.CylinderGeometry(1, 1, 1, 12, 1, false, 0, Math.PI), 0xf4efe6, 1.15, 3.4, 1.0); cover.rotation.x = Math.PI / 2; cover.rotation.z = Math.PI / 2; cover.position.y = 1.3; g.add(cover);
  deco(g, x, top, z, ry);
  addSolid(x, top + 1.1, z, 1.1, 1.1, 1.8, 'static', null);
}
function dTent(x, top, z, ry, col) {
  const g = new THREE.Group();
  const t = new THREE.Mesh(PRISM, mat(col || 0xff9d2e)); t.scale.set(2.6, 2, 2.4); g.add(t);
  const flap = M(G.box, 0x2b1d14, 0.05, 1.2, 0.8); flap.position.set(1.31, 0.6, 0); g.add(flap);
  deco(g, x, top, z, ry);
  addSolid(x, top + 0.9, z, 1.2, 0.9, 1.1, 'static', null).noCam = true;
}
function dCrate(x, top, z, s) { const m = new THREE.Mesh(G.box, mat(0xffffff, { map: crateTex })); m.scale.setScalar(s || 1); deco(m, x, top + (s || 1) / 2, z); addSolid(x, top + (s || 1) / 2, z, (s || 1) / 2, (s || 1) / 2, (s || 1) / 2, 'static', null); }
function dBarrel(x, top, z, col) { const g = new THREE.Group(); const b = M(G.cyl, col || 0x8a5a2b, 0.45, 1.1, 0.45); b.position.y = 0.55; g.add(b); for (const y of [0.2, 0.9]) { const h = M(G.cyl, 0x3a3f4a, 0.47, 0.08, 0.47); h.position.y = y; g.add(h); } deco(g, x, top, z); addSolid(x, top + 0.55, z, 0.45, 0.55, 0.45, 'static', null).noCam = true; }
function dTorchPost(x, top, z) { addTorchDecor(x, top, z); addSolid(x, top + 0.7, z, 0.15, 0.7, 0.15, 'static', null).noCam = true; }
function buildBuzzard() {
  const m = buildFlyer('gull');
  m.root.traverse((o) => { if (o.isMesh && o.material && o.material.color) { const c = o.material.color.getHex(); if (c === 0xffffff) o.material = mat(0x4a3428); else if (c === 0xdde4ee) o.material = mat(0x2b1d14); } });
  const neck = M(G.sphereLo, 0xff8f8f, 0.16); neck.position.set(0, 0.62, 0.42); m.body.add(neck);
  return m;
}
function addBuzzard(x, y, z) { const e = makeEnemy('bee', x, y, z, buildBuzzard(), { r: 0.5, h: 0.95 }); const blob = new THREE.Mesh(G.circle, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false })); blob.scale.setScalar(0.45); W.root.add(blob); e.blob = blob; return e; }
function buildTumbleweed() {
  const g = new THREE.Group(); const b = new THREE.Group(); g.add(b);
  const core = new THREE.Mesh(G.ico, mat(0xb08a4e, { wireframe: false })); core.scale.setScalar(0.62); core.position.y = 0.62; b.add(core);
  for (let i = 0; i < 10; i++) { const t = M(G.torus, 0x8a6a3a, 0.62, 0.62, 2.2); t.rotation.set(i * 0.9, i * 1.7, i * 0.4); t.position.y = 0.62; b.add(t); }
  eyesOn(b, 0.75, 0.55, 0.16, 0.1, true);
  shadowy(g, true, false);
  return { root: g, body: b };
}
function addTumbleweed(x, top, z, x2, z2) { const e = makeEnemy('spiky', x, top, z, buildTumbleweed(), { r: 0.62, h: 1.2, stompable: false, spinnable: false, a: new V3(x, top, z), b: new V3(x2, top, z2), toB: true }); e.tumble = true; return e; }
// Candy's buried bones: ground pound the X to dig one up
function addDigSpot(x, top, z, tracker) {
  const g = new THREE.Group();
  const soil = M(G.cyl, 0x8a5a36, 1.0, 0.1, 1.0); soil.position.y = 0.05; g.add(soil);
  for (const a of [0.78, -0.78]) { const x1 = M(G.box, 0xff4d4d, 1.5, 0.06, 0.24); x1.rotation.y = a; x1.position.y = 0.12; g.add(x1); }
  const paw = M(G.sphereLo, 0x7b8088, 0.14, 0.05, 0.14); paw.position.set(0.7, 0.12, 0.6); g.add(paw);
  g.position.set(x, top, z); W.root.add(g);
  const spot = { done: false };
  W.things.push({ update() {
    if (spot.done) return;
    if (P.state === 'poundLand' && P.stateT < 0.02 && Math.abs(P.pos.x - x) < 1.4 && Math.abs(P.pos.z - z) < 1.4 && Math.abs(P.pos.y - top) < 0.5) {
      spot.done = true; tracker.n++;
      soil.material = mat(0x5a3a22); g.children.slice(1, 3).forEach((m) => { m.visible = false; });
      const bone = new THREE.Group(); const sh = M(G.cyl8, 0xf4efe6, 0.12, 1.0, 0.12); sh.rotation.z = Math.PI / 2; bone.add(sh);
      for (const s of [-1, 1]) for (const k of [-1, 1]) { const kn = M(G.sphereLo, 0xf4efe6, 0.17); kn.position.set(s * 0.55, k * 0.12, 0); bone.add(kn); }
      bone.position.set(x, top + 0.5, z); W.root.add(bone);
      W.anim.push({ t: 0, f(dt, a) { a.t += dt; bone.position.y = top + 0.5 + Math.min(1.5, a.t * 4) - Math.max(0, a.t - 0.6) * 2; bone.rotation.y += dt * 8; if (a.t > 1.2) { W.root.remove(bone); return true; } return false; } });
      Snd.S.key(); burst(x, top + 0.4, z, 0x8a5a36, 16, 5, 0.6);
      showToast('<b>BONE ' + tracker.n + ' / ' + tracker.need + '</b> dug up for Candy!' + (tracker.n >= tracker.need ? ' The bone gate is opening!' : ''), 3);
      if (tracker.n >= tracker.need && tracker.onDone) tracker.onDone();
    }
  } });
  return spot;
}
function dMinecart(parent, col) {
  const g = new THREE.Group();
  const tub = M(G.box, col || 0x6a6f7a, 2.0, 1.0, 2.6); tub.position.y = 0.8; g.add(tub);
  const rim = M(G.box, 0x3a3f4a, 2.15, 0.12, 2.75); rim.position.y = 1.3; g.add(rim);
  const ore = M(G.dodeca, 0xffd23f, 0.5); ore.position.set(0.4, 1.4, -0.5); g.add(ore);
  for (const sx of [-0.9, 0.9]) for (const sz of [-0.9, 0.9]) { const wh = M(G.cyl, 0x2b2f38, 0.32, 0.15, 0.32); wh.rotation.z = Math.PI / 2; wh.position.set(sx, 0.32, sz); g.add(wh); }
  if (parent) parent.add(g);
  return g;
}
function trackLine(x, top, z1, z2) {
  const L = Math.abs(z2 - z1);
  for (const s of [-0.8, 0.8]) { const r = M(G.box, 0x7a7f8a, 0.12, 0.12, L); r.position.set(x + s, top + 0.06, (z1 + z2) / 2); (W.deco || W.root).add(r); }
  for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z += 1.2) { const t = M(G.box, 0x6b3b1f, 2.2, 0.08, 0.35); t.position.set(x, top + 0.02, z); (W.deco || W.root).add(t); }
}

// =====================================================================
// WORLD 1-1 — RED ROCK TRAIL (Candy's Canyon)
// =====================================================================
function buildCanyon1() {
  canyonEnv();
  const bones = { n: 0, need: 3, onDone: null };
  // start mesa
  gnd(0, 0, -2, 16, 20, 10, 'mesa');
  dArch(0, 0, -9.5, 8, "CANDY'S CANYON", 0xc8643a);
  addPet('candy', 3.8, 0, 3.5, -2.2, 'Woof woof! I buried <b>3 bones</b> in my canyon. Find the red <b>X</b> spots and <b>GROUND POUND</b> them (jump, then SHIFT) to dig them up. That opens the bone gate!', 'Woof woof! I buried <b>3 bones</b>. Find the red <b>X</b> spots: jump, then tap <b>ACTION</b> to ground pound and dig!');
  addHint(-3, 0, 5, 'Move with <b>WASD</b> / arrows, <b>SPACE</b> jumps (again in mid-air for a double jump). Drag the mouse or use <b>Q</b>/<b>E</b> for the camera.', 'Stick to move, <b>JUMP</b> to jump (tap again in mid-air for a double jump). Drag on the right to turn the camera.', 2.6);
  dCactus(-6, 0, 6, 0.9); dCactus(6.3, 0, -6, 1.1); dSkull(-5, 0, -4, 0.7); dTent(-4.5, 0, 0.5, Math.PI / 2, 0xff9d2e); dBarrel(5.5, 0, 6.5); dBarrel(6.3, 0, 5.4, 0x6b3b1f);
  coinLine(0, 0.9, 3, 0, 0.9, -8, 5);
  // rope bridge with a tumbleweed rolling across
  for (let i = 0; i < 6; i++) gnd(0, 0, -13.2 - i * 2.2, 3.2, 2.0, 0.35, 'wood');
  for (const s of [-1, 1]) { for (let i = 0; i < 4; i++) { const p = M(G.cyl8, 0x7a4a24, 0.1, 1.4, 0.1); p.position.set(s * 1.7, 0.4, -12.2 - i * 4.2); W.deco.add(p); } const rope = M(G.box, 0xd8b878, 0.06, 0.06, 13.4); rope.position.set(s * 1.7, 0.95, -18.5); W.deco.add(rope); }
  addTumbleweed(-1.2, 0, -18, 1.2, -18);
  addHint(1.8, 0, -10.6, '<b>Tumbleweeds</b> are prickly: you can\'t stomp them. Jump over!', null, 2);
  coinLine(0, 1.2, -13, 0, 1.2, -24, 5);
  // mesa B: dig spot 1, spring pillar star
  gnd(0, 0, -34, 20, 20, 10, 'mesa');
  addCheckpoint(-2, 0, -26, 0);
  addDigSpot(-5.5, 0, -32, bones);
  addHint(-3, 0, -28.5, 'A red <b>X</b>! Jump and press <b>SHIFT</b> in mid-air to <b>GROUND POUND</b> it.', 'A red <b>X</b>! Jump, then tap <b>ACTION</b> in mid-air to <b>GROUND POUND</b> it.', 2.2);
  addWalker(3, 0, -36); addWalker(-3, 0, -40);
  gnd(6.5, 6, -40.5, 2.6, 2.6, 16, 'redrock'); addSpring(6.5, 0, -35.5);
  addItem('star', 6.5, 7.3, -40.5, { idx: 0 });
  dCactus(-8, 0, -27, 1); dCactus(8.5, 0, -28, 0.8); dCactus(-8.5, 0, -42, 1.2); dSkull(3, 0, -27.5, 2); dWagon(-6, 0, -38.5, 0.2); dRocks(8, 0, -43, 4, 5);
  addQBlock(0, 3.4, -33, 'coins');
  // mine cart ferry over the river
  trackLine(0, -0.6, -44, -58);
  const cart = addMover(0, 0, -47, 3.2, 3.2, [0, 0, -9], 6, 0, 'metal'); dMinecart(cart.mesh).position.y = -0.4;
  addHint(2.2, 0, -42.5, 'Hop in the <b>mine cart</b> to ride across the river!', null, 2);
  coinLine(0, 1.6, -48, 0, 1.6, -56, 4);
  // mesa C: dig spot 2, buzzards, secret ledge star
  gnd(0, 0, -70, 22, 22, 10, 'mesa');
  addCheckpoint(-2, 0, -61, 0);
  addDigSpot(5, 0, -72, bones);
  addBuzzard(-3, 3, -68); addBuzzard(4, 3.2, -76); addWalker(-6, 0, -74);
  addQBlock(-2, 3.4, -66, 'coins'); addQBlock(-0.9, 3.4, -66, '1up');
  addSecretBlock(12.6, 0.4, -70, 2.2, 2.2, 'redrock'); addSecretBlock(15.4, 1.6, -71.5, 2.2, 2.2, 'redrock');
  gnd(18.6, 2.8, -73, 3, 3, 6, 'mesa'); addItem('star', 18.6, 4.1, -73, { idx: 1 });
  addHint(9, 0, -70, 'Candy sniffs something to the <b>east</b>... walk to the edge.', null, 2);
  dTent(-8, 0, -63, 0.4, 0xff4d4d); dCactus(9, 0, -62, 1); dCactus(-9.5, 0, -79, 0.9); dBarrel(8.8, 0, -79); dCrate(7.7, 0, -79.5, 1); dSkull(-3, 0, -79, 1); dTorchPost(-9.5, 0, -66);
  // steps up to the high mesa
  gnd(-4, 1.4, -83.5, 3, 3, 4, 'redrock'); gnd(0, 2.8, -86.5, 3, 3, 6, 'redrock'); gnd(4, 4.2, -89.5, 3, 3, 8, 'redrock');
  coinLine(-4, 2.3, -83.5, 4, 5.1, -89.5, 5);
  // mesa D: dig spot 3, hot-spring geyser star, bone gate
  gnd(0, 4, -103, 22, 24, 14, 'mesa');
  addCheckpoint(2, 4, -94, 0);
  addDigSpot(-4, 4, -100, bones);
  addTumbleweed(-6, 4, -106, 6, -106); addWalker(5, 4, -100); addBuzzard(0, 7.5, -103);
  addGeyser(-7.5, 4, -110, 7.5, 4, 2.5, 0); gnd(-7.5, 11, -113.6, 3, 3, 1.2, 'redrock'); addItem('star', -7.5, 12.3, -113.6, { idx: 2 });
  addHint(-4, 4, -107.5, 'A <b>hot spring</b>! Ride the steam up and steer onto the ledge.', null, 2.2);
  dCactus(8.5, 4, -95, 1); dCactus(-9.5, 4, -94, 0.8); dWagon(7, 4, -108, -0.3); dRocks(9, 4, -113, 4, 9); dTorchPost(3, 4, -113); dTorchPost(-3, 4, -113);
  gnd(-6.5, 9, -115.5, 9, 1.2, 5, 'redrock'); gnd(6.5, 9, -115.5, 9, 1.2, 5, 'redrock');
  const gate = addGate(0, 9, -115.5, 4, 1, 5);
  bones.onDone = () => { gate.open(); Snd.S.solve(); };
  addHint(0, 4, -112.2, 'The <b>BONE GATE</b> opens when Candy\'s <b>3 bones</b> are dug up.', null, 2.2);
  // goal ledge
  gnd(0, 4, -124, 12, 16, 14, 'mesa');
  addBox(0, 4.8, -127, 4, 4, 0.8, 'redrock');
  addGoal(0, 4.8, -127, 'flag');
  dCactus(-4.5, 4, -129, 1); dCactus(4.5, 4, -121, 0.8);
  W.titleFocus = new V3(0, 1, -20);
}

// =====================================================================
// WORLD 1-2 — MESA MINES (an open-pit gold mine)
// =====================================================================
function buildCanyon2() {
  canyonEnv({ horizon: 0xffc890, fog: 0xffc890, sunColor: 0xffd0a0 });
  gnd(0, 0, 0, 16, 16, 10, 'desert');
  dSign(-4.5, 0, -6, 0.3, 'MESA MINES', '#6a4a32');
  addPet('candy', 4, 0, 1, -2.4, 'Woof! The old gold mine is full of <b>lever lamps</b>. Light all three to open the mine gate. Watch out for the rolling carts!');
  deco(dMinecart(null), -5, 0, 3, 0.4);
  dCrate(5.5, 0, -5, 1.2); dCrate(5.5, 1.2, -5, 0.9); dBarrel(-5.8, 0, -3.5); dTorchPost(-6.5, 0, 6); dTorchPost(6.5, 0, 6);
  coinLine(0, 0.9, 2, 0, 0.9, -6, 4);
  // conveyor bridge of ore
  addConveyor(0, 0, -13, 3, 10, 0, 3.2);
  addHint(2, 0, -7, 'Ore <b>conveyors</b> push you back. Keep running!', null, 2);
  coinLine(0, 1.2, -9, 0, 1.2, -17, 4);
  // pit floor A: walkers and falling planks to the star
  gnd(0, 0, -30, 24, 18, 10, 'mine');
  addCheckpoint(-2, 0, -22.5, 0);
  addWalker(4, 0, -28); addWalker(-5, 0, -33); addRobot(-8, 0, -36, 8, -36);
  for (let i = 0; i < 4; i++) { const b = M(G.box, 0x6b3b1f, 0.5, 6, 0.5); b.position.set(-11.5, 3, -22 - i * 4); W.deco.add(b); const b2 = b.clone(); b2.position.x = 11.5; W.deco.add(b2); const top = M(G.box, 0x6b3b1f, 23.4, 0.5, 0.5); top.position.set(0, 6.1, -22 - i * 4); W.deco.add(top); }
  addFalling(-9, 2.5, -40, 2.5, 2.5); addFalling(-9, 4, -44, 2.5, 2.5); gnd(-9, 5.5, -48, 3, 3, 2, 'mine');
  addItem('star', -9, 6.8, -48, { idx: 0 });
  addBox(-9, 1.2, -37, 2.4, 2.4, 1.2, 'wood');
  trackLine(6, 0, -24, -38); deco(dMinecart(null), 6, 0, -27);
  dCrate(9.5, 0, -24, 1); dBarrel(10, 0, -26); dBarrel(10, 0, -27.2, 0x6b3b1f); dTorchPost(-10.5, 0, -30); dTorchPost(10.5, 0, -34);
  // the lever-lamp puzzle on floor B
  gnd(0, 0, -56, 24, 18, 10, 'mine');
  addCheckpoint(3, 0, -48.5, 0);
  addLeverPuzzle({ top: 0, init: [0, 1, 0], levers: [[-7, -54, [0, 1], 'A'], [0, -58, [1, 2], 'B'], [7, -54, [0, 2], 'C']],
    lamps: [[-4, 0, -63.5, 3], [0, 0, -63.5, 3], [4, 0, -63.5, 3]], msg: '<b>ALL LAMPS LIT!</b> The mine gate creaks open!', onSolve: () => mgate.open() });
  addHint(-2.5, 0, -50, '<b>LEVER LAMPS:</b> each lever flips two lamps. Step on the levers to light <b>all three</b>.', null, 2.6);
  gnd(-7.5, 5, -65, 9, 1.2, 5, 'redrock'); gnd(7.5, 5, -65, 9, 1.2, 5, 'redrock');
  const mgate = addGate(0, 5, -65, 6, 1, 5);
  dCrate(-10, 0, -50, 1); dCrate(10, 0, -60, 1.2); dBarrel(-10.4, 0, -60); dTorchPost(-10.5, 0, -55); dTorchPost(10.5, 0, -55);
  // mine-shaft facade with a cart track into the cliff (decorative, closed off by a gate)
  const shaft = new THREE.Group();
  const frame = M(G.box, 0x6b3b1f, 5, 0.6, 0.8); frame.position.set(0, 4.2, 0); shaft.add(frame);
  for (const s of [-1, 1]) { const p = M(G.box, 0x6b3b1f, 0.6, 4.2, 0.8); p.position.set(s * 2.2, 2.1, 0); shaft.add(p); }
  const dark = new THREE.Mesh(G.box, basic(0x140a04)); dark.scale.set(3.8, 3.9, 0.2); dark.position.set(0, 1.95, -0.3); shaft.add(dark);
  deco(shaft, -15, 0, -54, Math.PI / 2);
  gnd(-17, 9, -54, 4, 18, 9, 'redrock');
  // floor C: star 2 on the crane, star 3 behind the rolling carts
  gnd(0, 0, -78, 24, 24, 10, 'mine');
  addCheckpoint(-2, 0, -68, 0);
  const crane = new THREE.Group();
  const mast = M(G.box, 0xffb627, 0.6, 9, 0.6); mast.position.y = 4.5; crane.add(mast);
  const boom = M(G.box, 0xffb627, 7, 0.5, 0.5); boom.position.set(3, 9, 0); crane.add(boom);
  const hook = M(G.box, 0x3a3f4a, 0.12, 3, 0.12); hook.position.set(6, 7.5, 0); crane.add(hook);
  deco(crane, -9, 0, -84); addSolid(-9, 4.5, -84, 0.4, 4.5, 0.4, 'static', null);
  gnd(-3, 3, -84, 2.4, 2.4, 3, 'wood'); addMover(-3, 6.2, -84.5, 2.4, 2.4, [0, 0, 4], 4, 0, 'wood');
  addItem('star', -3, 9.4, -82, { idx: 1 });
  addLog(5, 0, -76, 9, 1.2);
  addTumbleweed(-4, 0, -90, 6, -90);
  trackLine(9, 0, -68, -90);
  const runCart = { root: dMinecart(null, 0x8a3a2a) }; W.root.add(runCart.root);
  W.things.push({ update() { const t = (W.time * 0.35) % 1; const z = -68 - t * 22; runCart.root.position.set(9, 0, z); if (P.state !== 'dead' && Math.abs(P.pos.x - 9) < 1.6 && Math.abs(P.pos.z - z) < 1.8 && P.pos.y < 1.8) hurtPlayer(new V3(9, 0, z), 'cart'); } });
  gnd(13.5, 1.5, -88, 3, 3, 1.5, 'wood'); addItem('star', 13.5, 2.8, -88, { idx: 2 });
  addHint(6, 0, -70, 'Runaway <b>mine cart</b> on the track! Time your crossing.', null, 2.2);
  dCrate(-10, 0, -72, 1); dCrate(-10, 1, -72, 0.8); dBarrel(10.5, 0, -72); dTorchPost(-10.5, 0, -90); dTorchPost(5, 0, -89.5);
  addBox(0, 0.8, -88, 4, 4, 0.8, 'gold');
  addGoal(0, 0.8, -88, 'star');
  W.titleFocus = new V3(0, 1, -30);
}

// =====================================================================
// WORLD 2-1 — CHEESE CONVEYOR (Ratita Works, with Luna, Pi-rat and Snowie)
// =====================================================================
function labEnv() {
  setupEnv({ top: 0x16123a, horizon: 0x6a4aa8, bottom: 0x241a50, fog: 0x4a3a88, fogNear: 70, fogFar: 260, hemiSky: 0xd8d0ff, hemiGround: 0x403060, hemiI: 0.85, sunColor: 0xffffff, sunI: 0.9, amb: 0.28 });
  W.killY = -12;
  const r = mulberry(61);
  for (let i = 0; i < 18; i++) { // the Ratita Industries skyline
    const a = (i / 18) * TAU, d = 150 + r() * 70, h = 30 + r() * 50, w = 14 + r() * 16;
    const m = styledMesh(w, h, w, i % 2 ? 'lab' : 'metal'); m.position.set(Math.cos(a) * d, h / 2 - 20, Math.sin(a) * d - 40); (W.deco || W.root).add(m);
    for (let k = 0; k < 4; k++) { const win = new THREE.Mesh(G.box, basic(k % 2 ? 0xffe14d : 0x56f0ff)); win.scale.set(w * 0.7, 1.2, 0.2); win.position.set(Math.cos(a) * d - Math.cos(a) * w * 0.52, h * 0.2 + k * 6 - 20, Math.sin(a) * d - 40 - Math.sin(a) * w * 0.52); win.lookAt(0, win.position.y, -40); (W.deco || W.root).add(win); }
  }
  addStarfield(300);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), mat(0x1a1440)); floor.rotation.x = -Math.PI / 2; floor.position.y = -14; W.root.add(floor);
}
function dRatSign(x, top, z, ry) { dSign(x, top, z, ry, 'RATITA INDUSTRIES', '#1b1440'); }
function dCheese(x, top, z, s) { const m = new THREE.Mesh(PRISM, mat(0xffd23f, { emissive: 0x2a1a00 })); m.scale.set(1.4 * (s || 1), 0.9 * (s || 1), 1.2 * (s || 1)); deco(m, x, top, z, 0.3); for (let i = 0; i < 3; i++) { const h = M(G.sphereLo, 0xe0a820, 0.12 * (s || 1)); h.position.set(x + (i - 1) * 0.35, top + 0.25, z + 0.5 * (s || 1)); W.deco.add(h); } }
function dConsole(x, top, z, ry) {
  const g = new THREE.Group();
  const desk = M(G.box, 0x3a3f58, 2.4, 1.0, 1.0); desk.position.y = 0.5; g.add(desk);
  const scr = new THREE.Mesh(G.box, basic(0x3ff0ff)); scr.scale.set(1.8, 0.9, 0.06); scr.position.set(0, 1.55, -0.3); scr.rotation.x = -0.2; g.add(scr);
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(G.box, basic([0xff4d4d, 0xffe14d, 0x59d65a][i % 3])); b.scale.set(0.16, 0.06, 0.16); b.position.set(-0.8 + i * 0.4, 1.02, 0.2); g.add(b); }
  deco(g, x, top, z, ry); addSolid(x, top + 0.5, z, 1.2, 0.5, 0.6, 'static', null).noCam = true;
}
function dTank(x, top, z, col) {
  const g = new THREE.Group();
  const t = new THREE.Mesh(G.cyl, mat(col || 0x56f0ff, { emissive: 0x0a3a40, transparent: true, opacity: 0.75 })); t.scale.set(0.9, 2.6, 0.9); t.position.y = 1.5; g.add(t);
  for (const y of [0.15, 2.85]) { const c = M(G.cyl, 0x5d6673, 1.0, 0.3, 1.0); c.position.y = y; g.add(c); }
  const bub = M(G.sphereLo, 0xffffff, 0.15); bub.position.set(0.2, 1.4, 0.2); g.add(bub);
  g.position.set(x, top, z); W.root.add(g);
  addSolid(x, top + 1.5, z, 0.9, 1.5, 0.9, 'static', null).noCam = true;
}
function buildRatita1() {
  labEnv();
  gnd(0, 0, 0, 16, 16, 6, 'lab');
  dRatSign(-4.5, 0, -6.5, 0.3);
  addPet('luna', 3.5, 0, 2.5, -2.4, 'Squeak! Welcome to <b>Ratita Works</b>! Some bad bots are loose in the cheese factory. Ride the conveyors and push the <b>cheese crates</b> onto the switches!');
  dConsole(-5, 0, 4, Math.PI / 2); dCheese(5.5, 0, -5); dTank(-6, 0, -5);
  coinLine(0, 0.9, 3, 0, 0.9, -6, 4);
  // conveyor gauntlet
  addConveyor(0, 0, -13, 4, 10, 2.5, 0); addConveyor(0, 0, -23, 4, 10, -2.5, 0);
  for (const z of [-12, -22]) { gnd(-3.4, 1.2, z, 0.6, 9, 1.2, 'metal'); gnd(3.4, 1.2, z, 0.6, 9, 1.2, 'metal'); }
  addHint(2, 0, -7, '<b>Sideways conveyors</b> try to push you off. Walk against them!', null, 2.2);
  coinLine(0, 1.3, -10, 0, 1.3, -26, 6);
  // floor A: crate puzzle
  gnd(0, 0, -40, 24, 20, 6, 'lab');
  addCheckpoint(-2, 0, -31.5, 0);
  addPet('pirat', -8.5, 0, -32, 0.8, 'Arr! Push both <b>cheese crates</b> onto the yellow switches and the vault door opens. The blue pad puts the crates back if you get stuck!');
  const cA = addPushBlock(-5, 0, -37), cB = addPushBlock(5, 0, -37);
  for (const c of [cA, cB]) if (c.mesh) c.mesh.traverse((o) => { if (o.isMesh) o.material = mat(0xffd23f, { emissive: 0x2a1a00, map: crateTex }); });
  const sA = addPressureSwitch(-5, 0, -45), sB = addPressureSwitch(5, 0, -45);
  addResetPad(0, 0, -33, [cA, cB]);
  gnd(-7.5, 6, -50.5, 9, 1, 6, 'metal'); gnd(7.5, 6, -50.5, 9, 1, 6, 'metal');
  const vault = addGate(0, 6, -50.5, 6, 1, 6);
  W.things.push({ update() { if (!vault.opening && sA.pressed && sB.pressed) { vault.open(); showToast('<b>VAULT OPEN!</b>', 3); Snd.S.solve(); } } });
  addRobot(-9, 0, -42, -9, -48); addRobot(9, 0, -48, 9, -42, 1);
  dConsole(-10, 0, -36, Math.PI / 2); dTank(10, 0, -34, 0xff6bd6); dCheese(9.5, 0, -38, 0.8); dBarrel(-10.5, 0, -46, 0x3a7a5a);
  addQBlock(0, 3.4, -40, 'coins');
  // star 1 on top of the tanks (laser-lit catwalk)
  gnd(10, 3, -45.5, 3, 3, 3, 'metal'); gnd(10, 4.6, -48.5, 3, 3, 4.6, 'metal'); addItem('star', 10, 5.9, -48.5, { idx: 0 });
  // floor B: pistons + lasers to the lab
  gnd(0, 0, -64, 20, 26, 6, 'lab');
  addCheckpoint(2, 0, -53.5, 0);
  addLaser(0, 0, -58, 9, 'x', 1.6, 1.6, 0);
  addLaser(0, 0, -66, 9, 'x', 1.6, 1.6, 1.6);
  addHint(-3, 0, -55, '<b>Laser fences</b> blink on and off. They flicker right before they switch on!', null, 2.2);
  addPiston(-8.4, 0, -62, 2, 3, 2, 'x', 3, 3, 0);
  addPet('snowie', 7.5, 0, -70, -1, 'Squeak! I saw a <b>secret star</b> up on the cheese silo. Teleport pads are behind me!');
  addTeleporter(4, 0, -74, 13, 8, -74);
  gnd(13, 8, -74, 4, 4, 2, 'cheese'); dCheese(13, 8, -75.4, 0.9); addItem('star', 13, 9.6, -73, { idx: 1 });
  const silo = M(G.cyl, 0xffd23f, 2.4, 14, 2.4); silo.position.set(16, 1, -76); W.deco.add(silo);
  dConsole(-7, 0, -72, 0.5); dTank(-8.5, 0, -68); dCrate(8.5, 0, -57, 1); dCrate(8.5, 1, -57, 0.8);
  // floor C: gear lift + secret star, goal
  addGear(0, 0, -82, 3.2, 0.9);
  gnd(0, 0, -96, 18, 18, 6, 'lab');
  addCheckpoint(-3, 0, -88, 0);
  addRobot(-5, 0, -94, 5, -94); addBee(0, 2.5, -98);
  addSecretBlock(-10.6, 1.2, -96, 2.2, 2.2, 'cheese'); addSecretBlock(-13.4, 2.6, -98, 2.2, 2.2, 'cheese');
  gnd(-16.4, 3.6, -100, 3, 3, 6, 'lab'); addItem('star', -16.4, 4.9, -100, { idx: 2 });
  addBox(0, 0.8, -101, 4, 4, 0.8, 'cheese');
  addGoal(0, 0.8, -101, 'star');
  dConsole(7, 0, -90, -Math.PI / 2); dTank(7.5, 0, -98, 0xffd23f); dCheese(-6.5, 0, -103, 0.8); dRatSign(5, 0, -104, -0.4);
  W.titleFocus = new V3(0, 1, -30);
}

// =====================================================================
// WORLD 3-1 — SHELL-TOUGH TEST TRACK (Tortuga Tech, with Torty)
// =====================================================================
function techEnv(long) {
  setupEnv({ top: 0x3a9aff, horizon: 0xd8fff0, bottom: 0x8ad8c0, fog: 0xd8fff0, fogNear: 90, fogFar: 300, hemiSky: 0xffffff, hemiGround: 0x5a9a7a, hemiI: 0.8, sunColor: 0xfff6e0, sunI: 1.0, amb: 0.22, sunSprite: 0xfff3b0 });
  W.killY = -6;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), mat(0x2fc0b0, { transparent: true, opacity: 0.88, roughness: 0.2 })); water.rotation.x = -Math.PI / 2; water.position.y = -3.2; W.root.add(water); W.water = water;
  const r = mulberry(71);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, d = 170 + r() * 60, s = 30 + r() * 30; const h = M(G.sphereLo, [0x59d65a, 0x3fbf4a][i % 2], s, s * 0.5, s); if (long) h.position.set(Math.cos(a) * (d + 40), -10, Math.sin(a) * (d + 40) * 1.9 - 290); else h.position.set(Math.cos(a) * d, -10, Math.sin(a) * d - 50); (W.deco || W.root).add(h); }
  skyClouds(16, 35, 70, 70, 220, 9);
}
function dTestDummy(x, top, z) {
  const g = new THREE.Group();
  const b = M(G.box, 0xffd23f, 0.8, 1.2, 0.5); b.position.y = 1.2; g.add(b);
  const h = M(G.sphereLo, 0xffd23f, 0.32); h.position.y = 2.1; g.add(h);
  for (const s of [-1, 1]) { const l = M(G.box, 0x2b2f38, 0.25, 0.7, 0.25); l.position.set(s * 0.2, 0.35, 0); g.add(l); const t = new THREE.Mesh(G.cyl, basic(0x1b1440)); t.scale.set(0.12, 0.02, 0.12); t.rotation.x = Math.PI / 2; t.position.set(s * 0.18, 1.4, 0.26); g.add(t); }
  deco(g, x, top, z);
}
function dShellSign(x, top, z, ry, txt) { dSign(x, top, z, ry, txt || 'TORTUGA TECH', '#2f7a52'); }
function buildTortuga1() {
  techEnv();
  gnd(0, 0, 0, 18, 16, 8, 'tech');
  dShellSign(-5, 0, -6, 0.3);
  addPet('torty', 4, 0, 1.5, -2.3, 'Hello! I\'m <b>Torty</b>, boss of <b>Tortuga Tech</b>. We test things to make them <b>shell-tough</b>. Survive the crash-test track and you\'re hired!');
  dTestDummy(-6, 0, 3); dTestDummy(-7, 0, 1.5); dConsole(6, 0, -4, -Math.PI / 2);
  coinLine(0, 0.9, 3, 0, 0.9, -6, 4);
  // the crusher alley (thwomps) on a narrow bridge
  gnd(0, 0, -16, 4, 14, 1.2, 'metal');
  addThwomp(0, 0, -13.5, 4.2); addThwomp(0, 0, -19.5, 4.2);
  addHint(2.4, 0, -8, '<b>CRASH TEST!</b> Crushers slam down. Run under when they rise!', null, 2.2);
  coinLine(0, 1, -10, 0, 1, -22, 5);
  // floor A: spinning logs and the dummy range
  gnd(0, 0, -34, 22, 18, 8, 'tech');
  addCheckpoint(-2, 0, -26, 0);
  addLog(0, 0, -32, 10, 1.2); addLog(0, 0, -38, 10, -1.0);
  addWalker(-6, 0, -36); addWalker(6, 0, -30); addSpiky(-7, 0, -41, 7, -41);
  for (let i = 0; i < 4; i++) dTestDummy(-9.5, 0, -27 - i * 3.5);
  dShellSign(9.7, 0, -27, -Math.PI / 2, 'SHELL-TOUGH');
  gnd(9, 2.5, -40, 3, 3, 2.5, 'shell'); gnd(9, 5, -36.5, 3, 3, 5, 'shell'); addItem('star', 9, 6.3, -36.5, { idx: 0 });
  // firebar furnace bridge
  gnd(0, 0, -50, 4, 10, 1.2, 'metal'); addFirebar(0, 1.2, -50, 5, 1.6, 0);
  coinLine(0, 1.2, -46, 0, 1.2, -54, 4);
  // floor B: color-switch test with Torty's robots
  gnd(0, 0, -66, 22, 22, 8, 'tech');
  addCheckpoint(2, 0, -57, 0);
  addRobot(-6, 0, -62, -6, -72); addRobot(6, 0, -72, 6, -62, 1.2);
  addToggleSwitch(-4, 0, -60);
  addColorBlock(-8, 1.6, -66, 2.4, 2.4, 'red', 1.6); addColorBlock(-8, 3.2, -69.5, 2.4, 2.4, 'blue', 1.6); addColorBlock(-8, 4.8, -73, 2.4, 2.4, 'red', 1.6);
  gnd(-8, 6, -76.5, 3, 3, 6, 'shell'); addItem('star', -8, 7.3, -76.5, { idx: 1 });
  addHint(-1.5, 0, -59, 'Stomp the <b>switch</b> to swap the <b>red</b> and <b>blue</b> blocks. Swap at the right moment to climb!', null, 2.4);
  dConsole(8.5, 0, -58, -Math.PI / 2); dTestDummy(9.5, 0, -64); dTestDummy(9.5, 0, -67); dCrate(9, 0, -75, 1.2);
  // the shell-drop tower: springs + falling platforms, star 3
  addSpring(4, 0, -72);
  addFalling(4, 6, -77, 2.6, 2.6); addFalling(1, 7, -80, 2.6, 2.6);
  gnd(-2.5, 8, -83, 3, 3, 1.2, 'shell'); addItem('star', -2.5, 9.3, -83, { idx: 2 });
  // goal: Torty's hiring stage
  gnd(0, 0, -86, 10, 18, 8, 'tech');
  addBox(0, 0.8, -90, 4, 4, 0.8, 'shell');
  addGoal(0, 0.8, -90, 'flag');
  dShellSign(-3.5, 0, -82, 0.4, 'YOU\'RE HIRED!'); dTestDummy(3.5, 0, -92);
  W.titleFocus = new V3(0, 1, -30);
}
function newLevelDefs() {
  return [
    { name: 'RED ROCK TRAIL', sub: 'WORLD 1-1', world: 1, worldName: "CANDY'S CANYON", song: 8, build: buildCanyon1, start: [0, 0, 5], blurb: "Dig up Candy's 3 bones · mine cart · hot springs", isNew: true, tz: { e: -9, s: 'mesa', w: 'redrock' } },
    { name: 'MESA MINES', sub: 'WORLD 1-2', world: 1, worldName: "CANDY'S CANYON", song: 8, build: buildCanyon2, start: [0, 0, 5], blurb: 'Lever lamps · runaway carts · the crane', isNew: true, tz: { e: -9, s: 'desert', w: 'mine' } },
    { name: 'CHEESE CONVEYOR', sub: 'WORLD 2-1', world: 2, worldName: 'RATITA WORKS', song: 9, build: buildRatita1, start: [0, 0, 5], blurb: 'Cheese-crate vault · lasers · teleporters', isNew: true, tz: { e: -9, s: 'lab', w: 'metal' } },
    { name: 'SHELL-TOUGH TEST TRACK', sub: 'WORLD 3-1', world: 3, worldName: 'TORTUGA TECH', song: 11, build: buildTortuga1, start: [0, 0, 5], blurb: 'Crushers · firebars · color-swap tower', isNew: true, tz: { e: -10, s: 'tech', w: 'shell' } },
  ];
}

// =====================================================================
// BOOST ZONE helpers shared by Canyon Rush + Shell Speedway
// =====================================================================
// a rail loop: enters at (x, z) heading -z, exits at (x + 3, z - 34)
function loopRail(x, top, z, glow) {
  const y = top;
  return addRail([[x, y + 0.3, z], [x, y + 0.3, z - 8], [x, y + 0.6, z - 15], [x + 0.4, y + 3.2, z - 21], [x + 0.9, y + 7.2, z - 22.5], [x + 1.4, y + 9.2, z - 18], [x + 1.9, y + 7.2, z - 13.5], [x + 2.4, y + 3.2, z - 15], [x + 2.8, y + 0.8, z - 21], [x + 3, y + 0.3, z - 28], [x + 3, y + 0.3, z - 34]], { glow: glow || 0xff4fd8 });
}
// a tiled lane along -z with curbs (the texture repeats, it never stretches)
function rushLane(x, top, z0, z1, w, col, curb) {
  const L = Math.abs(z1 - z0), zc = (z0 + z1) / 2;
  const lane = new THREE.Mesh(boxGeoUV(w, 0.06, L, 3, 1), texMat(col, 'speck')); lane.position.set(x, top + 0.03, zc); W.deco.add(lane);
  for (const s of [-1, 1]) {
    if (curb === 'race') { for (let z = Math.max(z0, z1); z > Math.min(z0, z1); z -= 2) { const c = M(G.box, ((z / 2) | 0) % 2 ? 0xff3b3b : 0xf4efe6, 0.6, 0.14, 2); c.position.set(x + s * (w / 2 + 0.3), top + 0.07, z - 1); W.deco.add(c); } }
    else { const c = M(G.box, curb || 0xf4efe6, 0.3, 0.12, L); c.position.set(x + s * (w / 2 + 0.15), top + 0.06, zc); W.deco.add(c); }
  }
}
function dCone(x, top, z) { const c = M(G.cone, 0xff7a1a, 0.32, 0.8, 0.32); c.position.set(x, top + 0.4, z); W.deco.add(c); const b = M(G.box, 0xf4efe6, 0.5, 0.06, 0.5); b.position.set(x, top + 0.03, z); W.deco.add(b); const s = M(G.cyl8, 0xffffff, 0.2, 0.12, 0.2); s.position.set(x, top + 0.45, z); W.deco.add(s); }
function dTire(x, top, z, n) { for (let i = 0; i < (n || 3); i++) { const t = M(G.torus, 0x23262e, 0.55, 0.55, 0.9); t.rotation.x = Math.PI / 2; t.position.set(x, top + 0.2 + i * 0.36, z); W.deco.add(t); } addSolid(x, top + 0.6, z, 0.6, 0.6, 0.6, 'static', null).noCam = true; }
function dHut(x, top, z, w, d, h, style, roofCol, ry, sign, signBg) {
  gnd(x, top + h, z, w, d, h, style);
  const roof = new THREE.Mesh(PRISM, mat(roofCol || 0x7a2a22)); roof.scale.set(w + 0.6, h * 0.45, d + 0.6); roof.rotation.y = (ry || 0) + Math.PI / 2; roof.position.set(x, top + h, z); W.deco.add(roof);
  const door = M(G.box, 0x3a2414, 1.2, 1.9, 0.08); const s = Math.sign(-x) || 1; door.position.set(x + s * (w / 2 + 0.03), top + 0.95, z); door.rotation.y = Math.PI / 2; W.deco.add(door);
  if (sign) dSign(x + s * (w / 2 + 1.2), top, z + d / 2 - 0.6, s > 0 ? Math.PI / 2 : -Math.PI / 2, sign, signBg);
}
function dSunflower(x, top, z, s) { s = s || 1; const g = new THREE.Group(); const st = M(G.cyl8, 0x3a9a40, 0.06 * s, 1.8 * s, 0.06 * s); st.position.y = 0.9 * s; g.add(st); const h = M(G.cyl, 0xffc21a, 0.42 * s, 0.08, 0.42 * s); h.rotation.x = Math.PI / 2.4; h.position.set(0, 1.85 * s, 0.05); g.add(h); const c = M(G.cyl, 0x6b3b1f, 0.2 * s, 0.1, 0.2 * s); c.rotation.x = Math.PI / 2.4; c.position.set(0, 1.86 * s, 0.1); g.add(c); deco(g, x, top, z, 0.3); }
function dBeehive(x, top, z) { const g = new THREE.Group(); const st = M(G.box, 0x7a4a24, 0.9, 0.5, 0.9); st.position.y = 0.25; g.add(st); for (let i = 0; i < 3; i++) { const b = M(G.box, i % 2 ? 0xffd23f : 0xf5c542, 1.0, 0.4, 1.0); b.position.y = 0.7 + i * 0.42; g.add(b); } const r = M(G.box, 0xf4efe6, 1.2, 0.12, 1.2); r.position.y = 1.95; g.add(r); deco(g, x, top, z); addSolid(x, top + 1, z, 0.5, 1, 0.5, 'static', null).noCam = true; }
function dScarecrow(x, top, z) { const g = new THREE.Group(); const p = M(G.cyl8, 0x7a4a24, 0.08, 2.4, 0.08); p.position.y = 1.2; g.add(p); const arm = M(G.cyl8, 0x7a4a24, 0.06, 1.8, 0.06); arm.rotation.z = Math.PI / 2; arm.position.y = 1.7; g.add(arm); const sh = M(G.box, 0x3b8bff, 0.7, 0.8, 0.35); sh.position.y = 1.6; g.add(sh); const hd = M(G.sphereLo, 0xf4d978, 0.3); hd.position.y = 2.3; g.add(hd); const hat = M(G.cone, 0xc98a4b, 0.45, 0.4, 0.45); hat.position.y = 2.65; g.add(hat); deco(g, x, top, z); }
function dRockArch(x, top, z) { // decorative canyon arch over the lane (pillars stand well outside it)
  gnd(x - 9, top + 7, z, 2.4, 2.4, 7, 'redrock'); gnd(x + 9, top + 7, z, 2.4, 2.4, 7, 'redrock');
  const b = styledMesh(20.4, 2, 3, 'redrock'); b.position.set(x, top + 8, z); W.deco.add(b);
}
function dMineMouth(x, top, z, ry) { // a tunnel entrance set in a cliff
  const g = new THREE.Group();
  const cliff = styledMesh(10, 9, 4, 'redrock'); cliff.position.y = 4.5; g.add(cliff);
  const hole = M(G.box, 0x120c08, 3.2, 3.6, 0.1); hole.position.set(0, 1.8, 2.02); g.add(hole);
  for (const s of [-1, 1]) { const p = M(G.box, 0x7a4a24, 0.35, 3.9, 0.35); p.position.set(s * 1.8, 1.95, 2.15); g.add(p); }
  const beam = M(G.box, 0x7a4a24, 4.2, 0.4, 0.4); beam.position.set(0, 3.95, 2.15); g.add(beam);
  deco(g, x, top, z, ry);
  const c = Math.abs(Math.sin(ry || 0)) > 0.5; addSolid(x, top + 4.5, z, c ? 2 : 5, 4.5, c ? 5 : 2, 'static', null);
}
function dGarage(x, top, z, ry, label) { // Tortuga Tech pit garage
  const g = new THREE.Group();
  const body = styledMesh(6, 4, 6, 'tech'); body.position.y = 2; g.add(body);
  const door = M(G.box, 0x2b2f38, 4.2, 3, 0.08); door.position.set(0, 1.5, 3.03); g.add(door);
  for (let i = 0; i < 6; i++) { const l = M(G.box, 0x4a505c, 4.2, 0.06, 0.1); l.position.set(0, 0.3 + i * 0.5, 3.06); g.add(l); }
  const stripe = M(G.box, 0xffd23f, 6.05, 0.3, 6.05); stripe.position.y = 3.6; g.add(stripe);
  deco(g, x, top, z, ry);
  addSolid(x, top + 2, z, 3, 2, 3, 'static', null);
  if (label) { const s = Math.sin(ry || 0), c = Math.cos(ry || 0); dShellSign(x + s * 3.6, top + 2.6, z + c * 3.6, ry, label); }
}

// =====================================================================
// BOOST ZONE 2 — CANYON RUSH (Candy's Canyon at full speed)
// =====================================================================

// fill the open water between mesas / decks so the gaps never look empty
function rushGap(z0, z1, kind, seed) {
  const r = mulberry(seed || 7);
  for (let z = z0 - 6; z > z1 + 4; z -= 9 + r() * 5) {
    for (const sx of [-1, 1]) {
      const x = sx * (14 + r() * 10);
      if (kind === 'canyon') {
        const h = 6 + r() * 9, w = 2.6 + r() * 2.4;
        gnd(x, -3.4 + h, z, w, w * (0.8 + r() * 0.4), h + 2, 'redrock');
        dRocks(x + sx * 3, -3.4, z + 2, 3, (seed || 7) + z | 0);
      } else {
        const p = M(G.cyl8, 0x5d6673, 0.5, 9, 0.5); p.position.set(x, 0.6, z); W.deco.add(p);
        const b = M(G.sphereLo, r() < 0.5 ? 0xff7a1a : 0xffd23f, 1.1, 1.1, 1.1); b.position.set(x + sx * 2.5, -3.1, z + 3); W.deco.add(b);
      }
    }
  }
}
function buildCanyonRush() {
  canyonEnv();
  boostSetup({ rank: CANYON_RANK });
  // ---------- START MESA (top 0, z 20 .. -130) ----------
  gnd(0, 0, -55, 44, 150, 10, 'mesa');
  rushLane(0, 0, 18, -128, 12, 0xf0cf8e, 0xc8643a);
  dArch(0, 0, 6, 12, 'CANYON RUSH', 0xc8643a);
  addHint(-3.6, 0, 12.5, '<b>CANYON RUSH!</b> Hold <b>C</b> to BOOST down the canyon. Grind the mine rails and chain the blue pods with <b>SHIFT</b>!',
    '<b>CANYON RUSH!</b> Hold <b>BOOST</b> down the canyon. Grind the mine rails and chain the blue pods with <b>ACTION</b>!', 3);
  addPet('candy', 4.5, 0, 9, -2.4, 'Woof! This is MY canyon! Tumbleweeds are prickly: <b>jump</b> them, don\'t boost into them!');
  dTent(-10, 0, 12, Math.PI / 2, 0xff9d2e); dTent(10, 0, 12, -Math.PI / 2, 0x3b8bff); dBarrel(-8, 0, 15); dBarrel(8.5, 0, 15.5, 0x6b3b1f); dCrate(-8.5, 0, 9, 1);
  coinLine(0, 1, 2, 0, 1, -12, 8);
  addDashPanel(0, 0, -16, 0, 34);
  coinLine(0, 1, -22, 0, 1, -58, 14);
  addWalker(0, 0, -34); addWalker(-2.5, 0, -42); addWalker(2.5, 0, -50);
  addTumbleweed(-3.5, 0, -64, 3.5, -64);
  coinRing(0, 2.4, -64, 1.6, 8);
  addDashPanel(0, 0, -76, 0, 36);
  coinLine(3, 1, -82, -3, 1, -112, 10);
  addBuzzard(-2, 3, -94); addBuzzard(2, 3.2, -104);
  addQBlock(0, 3.4, -88, 'coins'); addQBlock(0, 3.4, -108, 'coins');
  dRockArch(0, 0, -46); dRockArch(0, 0, -100);
  for (let z = 0; z >= -122; z -= 12) { dCactus(-9.5, 0, z - 3, 0.9); dCactus(9.5, 0, z - 9, 1.05); dTorchPost(-7.4, 0, z - 8); dTorchPost(7.4, 0, z - 2); }
  // west: the camp + medal 1 on a rock pillar (spring up)
  dWagon(-15, 0, -20, 0.3); dTent(-18, 0, -30, 0.2, 0xff4d4d); dTent(-15, 0, -60, -0.3, 0xffd23f);
  const fire = M(G.cyl, 0x5a3a22, 0.8, 0.15, 0.8); fire.position.set(-16, 0.08, -40); W.deco.add(fire); addTorchDecor(-16, 0, -40);
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; const lg = M(G.cyl8, 0x7a4a24, 0.25, 1.6, 0.25); lg.rotation.z = Math.PI / 2; lg.rotation.y = a; lg.position.set(-16 + Math.cos(a) * 1.8, 0.25, -40 + Math.sin(a) * 1.8); W.deco.add(lg); }
  gnd(-19, 6, -52, 2.6, 2.6, 16, 'redrock'); addSpring(-19, 0, -47.5); addItem('star', -19, 7.3, -52, { idx: 0 });
  addHint(-14, 0, -46, 'A <b>BOOST MEDAL</b> on the rock pillar! Bounce up from the spring.', null, 2.4);
  for (let i = 0; i < 5; i++) dBarrel(-17 + (i % 2) * 1.1, 0, -76 - i * 1.3); dCrate(-14, 0, -86, 1.2); dCrate(-14, 1.2, -86, 0.9); dSkull(-17, 0, -96, 0.6); dCactus(-18, 0, -110, 1.2);
  // east: the gold mine (tracks, carts, ore, tunnel)
  trackLine(16, 0, -6, -118);
  for (const z of [-24, -58, -92]) { const c = dMinecart(null); deco(c, 16, 0, z); addSolid(16, 0.8, z, 1, 0.8, 1.3, 'static', null).noCam = true; }
  dMineMouth(16, 0, -124, 0); dSign(12, 0, -114, -0.3, 'GOLD MINE', '#7a3a1a');
  dRocks(19.5, 0, -40, 5, 51, 0xffd23f); dRocks(19.5, 0, -76, 5, 52, 0xffd23f); dCrate(12.5, 0, -40, 1); dBarrel(12.5, 0, -72, 0x6b3b1f); dWagon(19, 0, -10, -0.2);
  for (const s of [-1, 1]) gnd(s * 21.6, 1, -55, 0.8, 150, 11, 'redrock');
  gnd(0, 1, 19.6, 44, 0.8, 11, 'redrock');
  // ---------- MINE RAIL over the river ----------
  addCheckpoint(-5.5, 0, -118, 0);
  addRail([[0, 0.3, -122], [0, 0.4, -130], [0, 2.4, -144], [-5, 3.4, -158], [-7, 2.6, -172], [-3, 1.6, -188], [0, 0.8, -200], [0, 0.3, -212], [0, 0.3, -218]], { glow: 0xffb43a });
  addHint(-3, 0, -124, '<b>MINE RAIL!</b> Run onto it to grind over the river. Or try the blue pods on the right...', null, 2.6);
  coinLine(-5, 4.2, -158, -7, 3.4, -172, 4);
  addPod(7, 5, -140); addPod(9, 6, -151); addPod(10, 6.5, -162); addPod(8, 6, -174); addPod(5, 5, -186); addPod(3, 4, -197);
  addItem('star', 10, 9.7, -162, { idx: 1 });
  for (let z = -140; z >= -196; z -= 14) { const t = M(G.box, 0x7a4a24, 0.5, 6, 0.5); t.position.set(-12, -1, z); W.deco.add(t); } // old trestle posts in the river
  // ---------- MESA B: the camp + loop (top 0, z -207 .. -283) ----------
  gnd(0, 0, -245, 44, 76, 10, 'mesa');
  rushLane(0, 0, -208, -282, 10, 0xf0cf8e, 0xc8643a);
  addCheckpoint(-6, 0, -212, 0);
  addPet('luna', -9, 0, -218, 0.6, 'Squeak! I\'m on a canyon road trip! Ride the <b>loop</b> ahead, it\'s the <b>Gold Rush Loop</b>!');
  addDashPanel(0, 0, -222, 0, 34);
  loopRail(0, 0, -236, 0xffb43a);
  addItem('star', 1.4, 10.1, -254, { idx: 2 });
  addPet('snowie', 10, 0, -232, -0.6, 'Squeak squeak! Something shiny sits at the very top of the loop...');
  coinRing(-10, 1.4, -250, 2.2, 8); coinRing(11, 1.4, -264, 2.2, 8);
  addBuzzard(-6, 3, -244); addWalker(7, 0, -270); addWalker(-7, 0, -276);
  dTent(-16, 0, -222, 0.4, 0x59d65a); dWagon(-15, 0, -240, 0.1); dBarrel(-17, 0, -256); dBarrel(-16, 0, -257.4, 0x6b3b1f); dCactus(-18, 0, -268, 1.1); dSkull(-14, 0, -278, 1.2);
  dCactus(17, 0, -214, 1); dCrate(15, 0, -246, 1.2); dRocks(18, 0, -258, 5, 61); dCactus(16, 0, -276, 0.9); dTorchPost(-6, 0, -228); dTorchPost(6, 0, -228);
  for (const s of [-1, 1]) gnd(s * 21.6, 1, -245, 0.8, 76, 11, 'redrock');
  addHoop(3, 1.6, -279, [0, 0.5, -1], 31);
  addHint(6.5, 0, -272, 'Jump through the pink <b>DASH HOOP</b> to fly over the river!', null, 2.4);
  // ---------- MESA C: buzzard flats (top 0, z -293 .. -397) ----------
  gnd(0, 0, -345, 44, 104, 10, 'mesa');
  rushLane(0, 0, -294, -396, 12, 0xf0cf8e, 0xc8643a);
  addCheckpoint(-7, 0, -298, 0);
  addDashPanel(0, 0, -306, 0, 36);
  coinLine(0, 1, -310, 0, 1, -340, 12);
  addTumbleweed(-3.5, 0, -322, 3.5, -322); addWalker(-2, 0, -332); addWalker(2, 0, -338);
  addBuzzard(0, 3, -350); addBuzzard(-3, 3.4, -356);
  addPet('pirat', -9, 0, -346, 0.5, 'Arr! Bop the buzzards with a <b>homing attack</b>: jump and press <b>SHIFT</b> when they\'re close!', 'Arr! Bop the buzzards with a <b>homing attack</b>: jump and tap <b>ACTION</b>!');
  addDashPanel(0, 0, -362, 0, 36);
  coinLine(-3, 1, -366, 3, 1, -384, 8); addTumbleweed(-3.5, 0, -374, 3.5, -374);
  dRockArch(0, 0, -330); dRockArch(0, 0, -380);
  for (let z = -300; z >= -392; z -= 12) { dCactus(-9.5, 0, z - 2, 1); dCactus(9.5, 0, z - 8, 0.9); }
  dWagon(-16, 0, -310, -0.4); dTent(-17, 0, -325, 0.1, 0xff9d2e); dRocks(-17, 0, -362, 5, 71); dSkull(-15, 0, -372, 2); dBarrel(-14, 0, -388);
  trackLine(16, 0, -300, -390); { const c = dMinecart(null); deco(c, 16, 0, -330); addSolid(16, 0.8, -330, 1, 0.8, 1.3, 'static', null).noCam = true; }
  dRocks(19.5, 0, -350, 5, 72, 0xffd23f); dMineMouth(16, 0, -396, 0); dCrate(13, 0, -370, 1);
  for (const s of [-1, 1]) gnd(s * 21.6, 1, -345, 0.8, 104, 11, 'redrock');
  // ---------- CANYON RIM RAIL (the long one) ----------
  addCheckpoint(-5.5, 0, -386, 0);
  addRail([[0, 0.3, -388], [0, 0.5, -398], [4, 3, -412], [8, 4.5, -428], [6, 5, -444], [0, 4.6, -458], [-4, 3.6, -472], [0, 2.6, -484], [0, 2.3, -494], [0, 2.3, -500]], { glow: 0xffb43a });
  coinLine(4, 3.9, -412, 8, 5.4, -428, 4); coinLine(0, 5.4, -458, -4, 4.4, -472, 4);
  addPod(-6, 6, -420); addPod(-8, 7, -434); addPod(-6, 7, -448);
  for (let z = -410; z >= -480; z -= 14) { const t = M(G.box, 0x7a4a24, 0.5, 8, 0.5); t.position.set(12, 0, z); W.deco.add(t); }
  // ---------- TRADING POST + GOAL (top 2, z -490 .. -570) ----------
  gnd(0, 2, -530, 44, 80, 12, 'mesa');
  rushLane(0, 2, -491, -569, 12, 0xf0cf8e, 0xc8643a);
  addCheckpoint(-7, 2, -496, 0);
  addDashPanel(0, 2, -506, 0, 34);
  coinLine(0, 3, -510, 0, 3, -540, 10);
  addWalker(-2, 2, -522); addWalker(2, 2, -530);
  addGoalRing(0, 2, -556);
  addPet('torty', 9, 2, -552, -0.8, 'Shell-tough canyon run! Tortuga Tech clocked you. Get under <b>' + CANYON_RANK[0] + ' seconds</b> for an <b>S RANK</b>!');
  dHut(-15, 2, -512, 7, 8, 4, 'wood', 0x7a2a22, 0, 'TRADING POST', '#7a3a1a'); dHut(-15, 2, -540, 7, 8, 4, 'wood', 0x3a5a7a, 0, 'CANDY\'S BONES', '#5a3a1a');
  dHut(15, 2, -526, 7, 10, 4, 'wood', 0x5a3a22, 0, 'WATER TOWER', '#3a5a7a');
  dBleachers(14, 2, -548, 8, -Math.PI / 2); dFlagLine(-12, -566, 12, -566, 6);
  for (const s of [-1, 1]) { const pole = M(G.cyl8, 0x7a4a24, 0.12, 6, 0.12); pole.position.set(s * 12, 5, -566); W.deco.add(pole); }
  dBarrel(-9, 2, -500); dBarrel(9, 2, -500, 0x6b3b1f); dCactus(-18, 2, -560, 1.2); dCactus(18, 2, -500, 1); dCrate(-9, 2, -552, 1); dTorchPost(-6, 2, -546); dTorchPost(6, 2, -546);
  for (const s of [-1, 1]) gnd(s * 21.6, 3, -530, 0.8, 80, 13, 'redrock');
  gnd(0, 3, -569.6, 44, 0.8, 13, 'redrock');
  // far walls so the long canyon keeps layered rock past the first stretch
  const wr = mulberry(77);
  for (const s of [-1, 1]) for (let i = 0; i < 10; i++) { const h = 18 + wr() * 16, w = 14 + wr() * 10, z = -230 - i * 36; const m = styledMesh(w, h + 6, 30, i % 2 ? 'mesa' : 'redrock'); m.position.set(s * (36 + wr() * 10), h / 2 - 6, z); W.deco.add(m); }
  rushGap(-130, -207, 'canyon', 11); rushGap(-397, -490, 'canyon', 23);
  W.titleFocus = new V3(0, 2, -40);
}
const CANYON_RANK = [23, 30, 42];

// =====================================================================
// BOOST ZONE 3 — SHELL SPEEDWAY (Tortuga Tech's test speedway)
// =====================================================================
function buildSpeedwayRush() {
  techEnv(true);
  boostSetup({ rank: SPEED_RANK });
  // ---------- PIT STRAIGHT (top 0, z 20 .. -130) ----------
  gnd(0, 0, -55, 44, 150, 10, 'tech');
  rushLane(0, 0, 18, -128, 14, 0x3a3f4a, 'race');
  for (let z = 14; z > -126; z -= 6) { const d = M(G.box, 0xf4efe6, 0.25, 0.07, 2.5); d.position.set(0, 0.04, z); W.deco.add(d); }
  dArch(0, 0, 6, 14, 'SHELL SPEEDWAY', 0x2f7a52);
  for (let i = 0; i < 8; i++) { const c = M(G.box, i % 2 ? 0x111111 : 0xffffff, 1.75, 0.07, 1); c.position.set(-6.125 + i * 1.75, 0.045, 3); W.deco.add(c); }
  addHint(-4, 0, 12.5, '<b>SHELL SPEEDWAY!</b> Tortuga Tech\'s fastest track. Hit every <b>dash panel</b>, grind the banked rails, and don\'t slam the walls!', null, 3);
  addPet('torty', 5, 0, 10, -2.4, 'Welcome to my <b>speedway</b>! Tortuga Tech builds things <b>shell-tough</b>, but crashing still costs you rings. Go go go!');
  dTestDummy(-9, 0, 12); dTestDummy(-10, 0, 10); dConsole(9, 0, 14, -Math.PI / 2);
  coinLine(0, 1, 0, 0, 1, -12, 7);
  addDashPanel(0, 0, -16, 0, 36); addDashPanel(-3, 0, -50, 0, 36); addDashPanel(3, 0, -84, 0, 36);
  coinLine(0, 1, -22, 0, 1, -46, 10); coinLine(-3, 1, -54, -3, 1, -80, 10); coinLine(3, 1, -88, 3, 1, -112, 9);
  addRobot(-3, 0, -36, 3, -36); addRobot(3, 0, -66, -3, -66, 1.2); addWalker(0, 0, -100); addWalker(-3, 0, -106);
  addQBlock(0, 3.4, -60, 'coins'); addQBlock(0, 3.4, -96, 'coins');
  for (let z = 4; z >= -122; z -= 8) { dCone(-8.4, 0, z); dCone(8.4, 0, z - 4); }
  // west: grandstands + scoreboard
  dBleachers(-15, 0, -24, 16, Math.PI / 2); dBleachers(-15, 0, -66, 16, Math.PI / 2); dBleachers(-15, 0, -104, 14, Math.PI / 2);
  for (const s of [-1, 1]) { const p = M(G.cyl8, 0x5d6673, 0.2, 9, 0.2); p.position.set(-19, 4.5, -45 + s * 3); W.deco.add(p); }
  dShellSign(-19, 6, -45, Math.PI / 2, 'LAP 1 / 1');
  // east: pit garages, tyres, the medal on a garage roof
  dGarage(16, 0, -14, -Math.PI / 2, 'PIT 1'); dGarage(16, 0, -34, -Math.PI / 2, 'PIT 2'); dGarage(16, 0, -54, -Math.PI / 2); dGarage(16, 0, -74, -Math.PI / 2, 'PIT 4');
  addSpring(11.5, 0, -54); addItem('star', 16, 5.3, -54, { idx: 0 });
  addHint(11, 0, -48, 'A <b>BOOST MEDAL</b> on the garage roof! Spring up!', null, 2.2);
  dTire(11, 0, -24); dTire(11, 0, -44, 2); dTire(11.5, 0, -88); dTire(12.5, 0, -90, 2); dCrate(17, 0, -96, 1.2); dTestDummy(17, 0, -104); dTestDummy(18, 0, -108); dConsole(16, 0, -116, -Math.PI / 2);
  addPet('snowie', 11.5, 0, -64, -1.2, 'Squeak! I\'m the <b>pit crew</b>! There\'s a medal up on the roof of Pit 3.');
  for (const s of [-1, 1]) gnd(s * 21.6, 1, -55, 0.8, 150, 11, 'shell');
  gnd(0, 1, 19.6, 44, 0.8, 11, 'shell');
  // ---------- BANKED SWEEPER RAIL over the bay ----------
  addCheckpoint(-6, 0, -118, 0);
  addRail([[0, 0.3, -122], [0, 0.5, -132], [6, 3, -146], [14, 5, -160], [16, 6, -176], [10, 6, -190], [0, 4.6, -200], [-8, 3, -210], [-6, 1.4, -222], [0, 0.3, -232], [0, 0.3, -238]], { glow: 0x3ff0ff });
  coinLine(14, 5.9, -160, 16, 6.9, -176, 4); coinLine(0, 5.4, -200, -8, 3.9, -210, 4);
  addPod(2, 6, -150); addPod(4, 7, -162); addPod(4, 7.5, -174); addPod(2, 7, -186);
  addItem('star', 4, 10.7, -174, { idx: 1 });
  addHint(-3, 0, -124, '<b>BANKED RAIL!</b> Grind the big sweeper over the bay. Pods in the middle hide a medal...', null, 2.4);
  for (let z = -140; z >= -224; z -= 14) { const b = M(G.box, 0xffd23f, 1.2, 0.8, 0.9); b.position.set(-14, -3, z); W.deco.add(b); } // buoys
  // ---------- CRASH-TEST LAB + LOOP (top 0, z -227 .. -303) ----------
  gnd(0, 0, -265, 44, 76, 10, 'tech');
  rushLane(0, 0, -228, -302, 12, 0x3a3f4a, 'race');
  addCheckpoint(-6, 0, -232, 0);
  addDashPanel(0, 0, -242, 0, 34);
  loopRail(0, 0, -254, 0x3ff0ff);
  addPet('luna', -10, 0, -246, 0.6, 'Squeak! Tortuga Tech tests everything here, even this <b>loop</b>! Grab the medal at the top!');
  addItem('star', 1.4, 10.1, -272, { idx: 2 });
  coinRing(-10, 1.4, -270, 2.2, 8); coinRing(11, 1.4, -282, 2.2, 8);
  addRobot(-7, 0, -292, 7, -292);
  for (let i = 0; i < 5; i++) dTestDummy(-16, 0, -236 - i * 3.5);
  dConsole(-15, 0, -258, Math.PI / 2); dConsole(-15, 0, -264, Math.PI / 2); dTank(-17, 0, -276, 0x59d65a); dTank(-17, 0, -284, 0x56f0ff);
  dShellSign(14, 0, -236, -Math.PI / 2, 'CRASH TEST'); dCrate(15, 0, -250, 1.2); dCrate(16.4, 0, -250, 1.2); dCrate(15.7, 1.2, -250, 1.2); dTire(15, 0, -266); dTire(16.4, 0, -268, 2); dTestDummy(15, 0, -282); dCone(12, 0, -290); dCone(13, 0, -293);
  for (const s of [-1, 1]) gnd(s * 21.6, 1, -265, 0.8, 76, 11, 'shell');
  addHoop(3, 1.6, -299, [0, 0.5, -1], 31);
  // ---------- CHICANE (top 0, z -313 .. -417) ----------
  gnd(0, 0, -365, 44, 104, 10, 'tech');
  rushLane(0, 0, -314, -416, 14, 0x3a3f4a, 'race');
  addCheckpoint(-7, 0, -318, 0);
  addDashPanel(0, 0, -326, 0, 36);
  coinLine(-4, 1, -330, 4, 1, -350, 8); coinLine(4, 1, -352, -4, 1, -372, 8);
  addRobot(-3, 0, -342, 3, -342); addRobot(3, 0, -360, -3, -360, 0.8); addWalker(0, 0, -380);
  addDashPanel(0, 0, -386, 0, 36); coinLine(0, 1, -390, 0, 1, -408, 7);
  for (let z = -320; z >= -410; z -= 10) { dCone(-6.2, 0, z - (z % 20 ? 0 : 5)); dCone(6.2, 0, z - 5); }
  addPet('pirat', 10, 0, -340, -0.6, 'Arr! I fixed the <b>chicane</b>. Dodge the cones, or hold BOOST and bop the robots!');
  dBleachers(-15, 0, -350, 16, Math.PI / 2); dBleachers(-15, 0, -390, 14, Math.PI / 2);
  dGarage(16, 0, -366, -Math.PI / 2, 'TORTUGA TECH'); dTire(12, 0, -390); dTire(13.4, 0, -394, 2); dConsole(15, 0, -404, -Math.PI / 2);
  for (const s of [-1, 1]) gnd(s * 21.6, 1, -365, 0.8, 104, 11, 'shell');
  // ---------- FINAL BANKED RAIL ----------
  addCheckpoint(-6, 0, -406, 0);
  addRail([[0, 0.3, -408], [0, 0.5, -418], [-6, 3, -432], [-12, 5, -446], [-10, 5.4, -462], [0, 5, -472], [8, 4, -484], [4, 2.8, -496], [0, 2.3, -506], [0, 2.3, -512]], { glow: 0x3ff0ff });
  coinLine(-6, 3.9, -432, -12, 5.9, -446, 4); coinLine(0, 5.9, -472, 8, 4.9, -484, 4);
  addPod(-2, 7, -440); addPod(-3, 8, -452);
  for (let z = -430; z >= -500; z -= 14) { const b = M(G.box, 0xffd23f, 1.2, 0.8, 0.9); b.position.set(14, -3, z); W.deco.add(b); }
  // ---------- WINNER'S CIRCLE + GOAL (top 2, z -502 .. -582) ----------
  gnd(0, 2, -542, 44, 80, 12, 'tech');
  rushLane(0, 2, -503, -581, 14, 0x3a3f4a, 'race');
  addCheckpoint(-7, 2, -508, 0);
  addDashPanel(0, 2, -518, 0, 34);
  coinLine(0, 3, -522, 0, 3, -552, 10);
  addRobot(-3, 2, -534, 3, -534);
  for (let i = 0; i < 8; i++) { const c = M(G.box, i % 2 ? 0x111111 : 0xffffff, 1.75, 0.07, 1); c.position.set(-6.125 + i * 1.75, 2.045, -560); W.deco.add(c); }
  addGoalRing(0, 2, -566);
  addPet('candy', 9, 2, -562, -0.8, 'Woof! You\'re a speedway champ! Torty says under <b>' + SPEED_RANK[0] + ' seconds</b> is an <b>S RANK</b>!');
  // podium
  gnd(-14, 3.6, -560, 3, 3, 1.6, 'shell'); gnd(-17, 3, -560, 3, 3, 1, 'shell'); gnd(-11, 2.6, -560, 3, 3, 0.6, 'shell');
  dShellSign(-14, 3.6, -563, 0, 'WINNERS');
  dBleachers(15, 2, -540, 14, -Math.PI / 2); dBleachers(15, 2, -566, 10, -Math.PI / 2);
  dFlagLine(-12, -576, 12, -576, 6); for (const s of [-1, 1]) { const pole = M(G.cyl8, 0xf4efe6, 0.1, 6, 0.1); pole.position.set(s * 12, 5, -576); W.deco.add(pole); }
  dTestDummy(-16, 2, -530); dConsole(-15, 2, -520, Math.PI / 2); dTire(-10, 2, -548); dCone(-8.6, 2, -540); dCone(8.6, 2, -526);
  for (const s of [-1, 1]) gnd(s * 21.6, 3, -542, 0.8, 80, 13, 'shell');
  gnd(0, 3, -581.6, 44, 0.8, 13, 'shell');
  // Tortuga Tech HQ on the horizon
  const hq = styledMesh(40, 30, 20, 'tech'); hq.position.set(-70, 10, -620); W.deco.add(hq);
  const dome = M(G.sphereLo, 0x3a9a6a, 16, 10, 12); dome.position.set(-70, 25, -620); W.deco.add(dome);
  rushGap(-130, -227, 'tech', 5); rushGap(-417, -502, 'tech', 9);
  W.titleFocus = new V3(0, 2, -40);
}
const SPEED_RANK = [24, 32, 45];

function rushEnv(c) {
  setupEnv(Object.assign({ top: 0x2a78ff, horizon: 0xcfeeff, bottom: 0x7cc6ff, fog: 0xcfeeff, fogNear: 110, fogFar: 360, hemiSky: 0xffffff, hemiGround: 0x6a9a50, hemiI: 0.75, sunColor: 0xfff2d8, sunI: 1.0, amb: 0.2, sunSprite: 0xfff3b0 }, c || {}));
  W.killY = -6;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), mat(0x3aa8f0, { transparent: true, opacity: 0.88, roughness: 0.2, metalness: 0.1 }));
  water.rotation.x = -Math.PI / 2; water.position.y = -3.2; W.root.add(water); W.water = water;
  if (SHADOWS) water.receiveShadow = true;
  const hr = mulberry(9);
  for (let i = 0; i < 22; i++) { // rolling hills ring the zone so the horizon is never empty
    const a = (i / 22) * TAU + hr() * 0.2, d = 230 + hr() * 60, s = 40 + hr() * 40;
    const hill = M(G.sphereLo, [0x59d65a, 0x3fbf4a, 0x86e05a][i % 3], s, s * (0.5 + hr() * 0.4), s);
    hill.position.set(Math.cos(a) * d, -14, Math.sin(a) * d * 1.75 - 300); (W.deco || W.root).add(hill); // ellipse around the longer course
  }
  skyClouds(24, 40, 80, 80, 260, 5);
  W.scenery = (dt, t) => { water.position.y = -3.2 + Math.sin(t * 0.8) * 0.08; };
}
const MEADOW_RANK = [24, 32, 45];
function buildRush() {
  rushEnv();
  boostSetup({ rank: MEADOW_RANK });
  // ---------- START PLAZA + BOOST STRAIGHT (top 0, z 20 .. -130) ----------
  gnd(0, 0, -55, 74, 150, 8, 'park');
  const path = new THREE.Mesh(boxGeoUV(12, 0.06, 146, 3, 1), texMat(0xe8d6a8, 'speck')); path.position.set(0, 0.03, -57); W.deco.add(path);
  for (const s of [-1, 1]) { const curb = M(G.box, 0xf4efe6, 0.3, 0.12, 146); curb.position.set(s * 6.1, 0.06, -57); W.deco.add(curb); }
  dArch(0, 0, 6, 12, 'BOOST ZONE');
  addHint(-3.6, 0, 12.5, '<b>BOOST MODE!</b> Hold <b>C</b> (or <b>B</b>) to <b>BOOST</b>. Rings refill the blue boost meter. In mid-air press <b>SHIFT</b> near an enemy or a blue pod for a <b>HOMING ATTACK</b>.',
    '<b>BOOST MODE!</b> Hold <b>BOOST</b> to blast off. Rings refill the meter. In mid-air tap <b>ACTION</b> near an enemy or blue pod for a <b>HOMING ATTACK</b>.', 3);
  addPet('candy', 4.5, 0, 9, -2.4, 'Woof! Hold <b>BOOST</b> and blast through those mushroom guys! Hitting a wall at full speed costs rings though, so steer!', 'Woof! Hold <b>BOOST</b> and blast through enemies! Hitting a wall at full speed costs rings, so steer!');
  dFlowerBed(-8, 0, 12, 4, 2); dFlowerBed(8, 0, 12, 4, 2); dBench(-9, 0, 4, Math.PI / 2); dBench(9, 0, 4, -Math.PI / 2);
  coinLine(0, 1, 2, 0, 1, -12, 8);
  addDashPanel(0, 0, -16, 0, 34);
  coinLine(0, 1, -22, 0, 1, -60, 14);
  addWalker(0, 0, -36); addWalker(-2.5, 0, -44); addWalker(2.5, 0, -52);
  addSpiky(-3, 0, -64, 3, -64);
  addHint(4, 0, -28, 'Spiky guys can\'t be boosted through: <b>jump</b> over them!', null, 2.5);
  coinRing(0, 2.4, -64, 1.6, 8);
  addDashPanel(0, 0, -76, 0, 36);
  coinLine(-3, 1, -82, 3, 1, -110, 10);
  addWalker(1.5, 0, -92); addWalker(-1.5, 0, -100);
  addQBlock(0, 3.4, -86, 'coins'); addQBlock(0, 3.4, -104, 'coins');
  // lining: trees, lamps and fences keep the straight tidy
  for (let z = 0; z >= -125; z -= 10) {
    dTree(-9.5, 0, z - 2, 0.95); dTree(9.5, 0, z - 7, 0.95);
    dLamp(-7.2, 0, z - 6); dLamp(7.2, 0, z - 1);
  }
  dFence(-12, 16, -12, -36, 0); dFence(-12, -44, -12, -126, 0);
  dFence(12, 16, 12, -86, 0); dFence(12, -94, 12, -126, 0);
  dSign(-12.6, 0, -40, Math.PI / 2, 'FARM', '#b83a2e'); dSign(12.6, 0, -90, -Math.PI / 2, 'ORCHARD', '#3a7a3a');
  // ---------- WEST: the farm (medal 1 on the barn roof) ----------
  dBarn(-27, 0, -24, 10, 12, 6);
  dHay(-19, 0, -36, 2, 2, 1.4); dHay(-21, 0, -34, 2, 2, 2.8); dHay(-23.5, 0, -32.5, 2, 2, 4.2); dHay(-17, 0, -38, 2, 2, 1.4);
  addItem('star', -27, 7.4, -24, { idx: 0 });
  coinLine(-19, 2.2, -36, -23.5, 5.2, -32.5, 3);
  addHint(-16, 0, -40, 'A <b>BOOST MEDAL</b> is shining on the barn roof. Climb the hay!', null, 2.4);
  addWindmill(-27, 0, -58, 10);
  dCrops(-24, 0, -78, 14, 12, 0x59d65a); dCrops(-24, 0, -96, 14, 10, 0xff9d2e);
  for (let i = 0; i < 6; i++) dHay(-33 + (i % 2) * 2.4, 0, -108 - (i >> 1) * 2.6, 2, 2, 1.4);
  dFence(-16, -70, -32, -70, 0, 0xc98a4b); dFence(-16, -103, -32, -103, 0, 0xc98a4b);
  addWalker(-22, 0, -50); addWalker(-28, 0, -88);
  dRocks(-34, 0, -14, 4, 11); dRocks(-34, 0, -122, 4, 12);
  // ---------- EAST: orchard + picnic + duck pond ----------
  for (let x = 17; x <= 33; x += 5.5) for (let z = 4; z >= -60; z -= 7) dTree(x, 0, z + ((x | 0) % 2) * 2, 0.85, [0x3fbf4a, 0x59d65a, 0x2fa84a][((x + z) & 3) % 3]);
  dPicnic(18, 0, -70, 0.2); dPicnic(26, 0, -72, -0.3, 0x3b8bff); dPicnic(22, 0, -80, 0.1, 0xffd23f);
  addPet('luna', 20, 0, -75, 0, 'Squeak! Did you know the boost meter fills up faster with every <b>ring</b>? Try the blue <b>dash panels</b> too!');
  const pond = new THREE.Mesh(new THREE.CircleGeometry(6, 28), mat(0x3aa8f0, { roughness: 0.2, metalness: 0.1 })); pond.rotation.x = -Math.PI / 2; pond.position.set(26, 0.04, -100); W.deco.add(pond);
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; const rk = M(G.dodeca, 0x9a9a9a, 0.6, 0.4, 0.6); rk.position.set(26 + Math.cos(a) * 6.2, 0.2, -100 + Math.sin(a) * 6.2); W.deco.add(rk); }
  for (let i = 0; i < 5; i++) { const lp = M(G.cyl, 0x3fbf4a, 0.5, 0.03, 0.5); lp.position.set(24 + i * 1.3, 0.08, -98 - (i % 2) * 2); W.deco.add(lp); }
  addSolid(26, -0.3, -100, 4.5, 0.3, 4.5, 'static', null); // the pond is shallow: you can splash right across
  dBench(18, 0, -110, Math.PI / 2); dFlowerBed(30, 0, -116, 4, 2); dRocks(34, 0, -122, 4, 13);
  // perimeter hedges so the zone has edges instead of empty space
  dHedgeWall(-36.5, 0, -55, 1.2, 150, 2.6); dHedgeWall(36.5, 0, -55, 1.2, 150, 2.6); dHedgeWall(0, 0, 19.4, 74, 1.2, 2.6);
  // ---------- CLIFF + STAIRS up to the rail plateau (top 6) ----------
  gnd(-22.5, 6, -140, 29, 20, 14, 'rock'); gnd(22.5, 6, -140, 29, 20, 14, 'rock');
  stairs(0, -130, -150, 0, 6, 16, 'stone', -8);
  addCheckpoint(-5.5, 0, -124, 0);
  coinLine(0, 1.3, -132, 0, 6.8, -148, 7);
  // ---------- RAIL PLATEAU ----------
  gnd(0, 6, -162, 44, 24, 14, 'park');
  addCheckpoint(-6, 6, -154, 0);
  addPet('pirat', 7, 6, -155, -0.6, 'Arr! Run onto the <b>rail</b> to grind. Hold <b>BOOST</b> to grind faster and <b>JUMP</b> to hop off! Or follow the blue <b>pods</b> with homing attacks...');
  dLamp(-10, 6, -158); dLamp(10, 6, -158); dRocks(-18, 6, -170, 5, 21); dRocks(18, 6, -170, 5, 22); dBench(-14, 6, -160, Math.PI / 2);
  dFlowerBed(-4, 6, -160, 3, 1.6); dFlowerBed(4, 6, -160, 3, 1.6);
  // lighthouse on the lake shore
  const lh = new THREE.Group();
  for (let i = 0; i < 4; i++) { const b = M(G.cyl, i % 2 ? 0xff4d4d : 0xf4efe6, 1.3 - i * 0.12, 2.2, 1.3 - i * 0.12); b.position.y = 1.1 + i * 2.2; lh.add(b); }
  const lamp = new THREE.Mesh(G.cyl8, basic(0xfff1b0)); lamp.scale.set(0.8, 1, 0.8); lamp.position.y = 9.4; lh.add(lamp);
  const roof = M(G.cone, 0x2b2f48, 1.1, 1.2, 1.1); roof.position.y = 10.5; lh.add(roof);
  deco(lh, 17, 6, -168); addSolid(17, 11, -168, 1.3, 5, 1.3, 'static', null);
  // the lake rail
  addRail([[0, 6.3, -166], [0, 6.2, -178], [-5, 5.0, -192], [-8, 4.4, -206], [-4, 5.6, -222], [0, 5.2, -238], [0, 4.4, -250]]);
  coinLine(-5, 6.2, -192, -8, 5.6, -206, 4);
  addHint(-3, 6, -170, '<b>GRIND RAIL!</b> Run onto it, hold <b>BOOST</b> to speed up, <b>JUMP</b> to hop off.', null, 2.6);
  // homing pod chain (alternate route + medal 2)
  addPod(8, 9, -181); addPod(10, 10, -191); addPod(10, 10.5, -201); addPod(8, 10, -211); addPod(6, 9.5, -222); addPod(4, 8.8, -233);
  addItem('star', 10, 13.2, -201, { idx: 1 });
  // ---------- LOOP ISLAND (top 4) ----------
  gnd(0, 4, -276, 46, 60, 12, 'park');
  addCheckpoint(-6, 4, -252, 0);
  addPet('snowie', -12, 4, -256, 0.5, 'Squeak squeak! Ride the <b>LOOP</b>! Something shiny sits right at the very top...');
  addRail([[0, 4.3, -258], [0, 4.3, -266], [0, 4.6, -273], [0.4, 7.2, -279], [0.9, 11.2, -280.5], [1.4, 13.2, -276], [1.9, 11.2, -271.5], [2.4, 7.2, -273], [2.8, 4.8, -279], [3, 4.3, -286], [3, 4.3, -292]], { glow: 0xff4fd8 });
  addItem('star', 1.4, 14.1, -276, { idx: 2 });
  addFlyer('gull', -8, 7, -268); addFlyer('gull', 9, 7, -284); addBee(-6, 6.5, -290); addBee(8, 6.5, -262);
  coinRing(-10, 5.2, -280, 2.2, 8); coinRing(11, 5.2, -270, 2.2, 8);
  for (let z = -250; z >= -304; z -= 9) { dTree(-20, 4, z, 0.9); dTree(20, 4, z - 4, 0.9); }
  dFlowerBed(-14, 4, -296, 4, 2); dFlowerBed(14, 4, -250, 4, 2); dRocks(-20, 4, -303, 4, 31); dRocks(20, 4, -248, 4, 32);
  // jump hoop over the water gap to the goal field
  addHoop(3, 5.6, -300, [0, 0.5, -1], 31);
  coinLine(3, 7.5, -306, 3, 6, -316, 4);
  addHint(6.5, 4, -296, 'Jump through the pink <b>DASH HOOP</b> to fly over the water!', null, 2.4);
  // ---------- WINDMILL FIELD (top 2, z -316 .. -368) ----------
  gnd(0, 2, -342, 44, 52, 10, 'park');
  rushLane(0, 2, -317, -367, 10, 0xe8d6a8);
  addCheckpoint(-7, 2, -322, 0);
  addDashPanel(0, 2, -330, 0, 34);
  coinLine(0, 3, -334, 0, 3, -358, 8);
  addWalker(-2, 2, -346); addWalker(2, 2, -352);
  dCrops(-14, 2, -332, 10, 12, 0xffc21a); dCrops(-14, 2, -350, 10, 10, 0x59d65a); addWindmill(15, 2, -334, 9);
  for (let i = 0; i < 4; i++) dHay(13 + (i % 2) * 2.4, 2, -350 - (i >> 1) * 2.6, 2, 2, 1.4);
  dScarecrow(-14, 2, -362); dLamp(-7, 2, -340); dLamp(7, 2, -350); dRocks(18, 2, -362, 4, 41);
  dHedgeWall(-21.4, 2, -342, 1.2, 52, 2.2); dHedgeWall(21.4, 2, -342, 1.2, 52, 2.2);
  // ---------- LAKE RAIL 2 ----------
  addRail([[0, 2.3, -360], [0, 2.4, -370], [3, 3.6, -384], [7, 4.4, -398], [4, 4.8, -412], [-3, 4.6, -426], [-5, 4.2, -440], [-1, 4.3, -452], [0, 4.3, -460], [0, 4.3, -466]]);
  coinLine(3, 4.5, -384, 7, 5.3, -398, 4); coinLine(-3, 5.5, -426, -5, 5.1, -440, 4);
  addPod(-6, 8, -390); addPod(-8, 9, -402); addPod(-6, 9, -414);
  addFlyer('gull', 10, 8, -420); addFlyer('gull', -12, 9, -400);
  for (let i = 0; i < 4; i++) { const lp = M(G.cyl, 0x3fbf4a, 0.9, 0.03, 0.9); lp.position.set(-12 + i * 7, -3.15, -380 - i * 18); W.deco.add(lp); }
  // ---------- SUNFLOWER HILLS (top 4, z -450 .. -530) ----------
  gnd(0, 4, -490, 46, 80, 12, 'park');
  rushLane(0, 4, -451, -529, 10, 0xe8d6a8);
  addCheckpoint(-6, 4, -456, 0);
  addDashPanel(0, 4, -462, 0, 32);
  loopRail(0, 4, -474, 0x3ff0ff);
  coinRing(-10, 5.4, -488, 2.2, 8); coinRing(11, 5.4, -500, 2.2, 8);
  addBee(-7, 6.5, -470); addBee(8, 6.5, -512); addWalker(-6, 4, -518); addWalker(7, 4, -478);
  for (let z = -454; z >= -526; z -= 4) { dSunflower(-15 - ((z / 4) & 1) * 1.2, 4, z, 1); dSunflower(-18, 4, z - 2, 1.1); dSunflower(15 + ((z / 4) & 1) * 1.2, 4, z - 1, 1); }
  dBeehive(-11, 4, -462); dBeehive(-11, 4, -466); dBeehive(11, 4, -506); dWagon(11, 4, -466, 0.2); dScarecrow(-11, 4, -500); dPicnic(-11, 4, -520, 0.3, 0xff4d4d);
  dHedgeWall(-22.4, 4, -490, 1.2, 80, 2.2); dHedgeWall(22.4, 4, -490, 1.2, 80, 2.2);
  addHoop(3, 5.6, -526, [0, 0.5, -1], 31);
  coinLine(3, 7.5, -532, 3, 6, -540, 3);
  // ---------- GOAL FIELD (top 2, z -540 .. -600) ----------
  gnd(0, 2, -570, 44, 60, 10, 'park');
  rushLane(0, 2, -541, -599, 10, 0xe8d6a8);
  addCheckpoint(-7, 2, -546, 0);
  addDashPanel(0, 2, -552, 0, 34);
  coinLine(0, 3, -556, 0, 3, -576, 6);
  addGoalRing(0, 2, -584);
  addPet('torty', 9, 2, -580, -0.8, 'Shell-tough run! Tortuga Tech clocked your time. Get under <b>' + MEADOW_RANK[0] + ' seconds</b> for an <b>S RANK</b>!');
  dBleachers(-14, 2, -578, 10, Math.PI / 2); dBleachers(16, 2, -568, 8, -Math.PI / 2);
  dFlagLine(-12, -592, 12, -592, 6);
  for (const s of [-1, 1]) { const pole = M(G.cyl8, 0xf4efe6, 0.1, 6, 0.1); pole.position.set(s * 12, 5, -592); W.deco.add(pole); }
  for (let x = -18; x <= 18; x += 6) dTree(x, 2, -596, 0.9);
  dLamp(-6, 2, -566); dLamp(6, 2, -572); dFlowerBed(-12, 2, -556, 4, 2); dFlowerBed(12, 2, -556, 4, 2);
  W.titleFocus = new V3(0, 2, -40);
}

// GROK LAND 2 level list: new worlds first, then Boost Zones, then the classic worlds remastered
const TEAM_ZONES_OLD = [
  { e: -10, s: 'grass', w: 'stone' }, { e: -7, s: 'grass', w: 'stone' }, { e: -7, s: 'castle', w: 'castle' },
  { e: -8, s: 'snow', w: 'ice' }, { e: -8, s: 'grave', w: 'manor' }, { e: -7, s: 'metal', w: 'brass' },
  { e: -7, s: 'sand', w: 'coral' }, { e: -7, s: 'sand', w: 'coral' }, { e: -7, s: 'reef', w: 'coral' },
  { e: -7, s: 'moon', w: 'hull' }, { e: -7, s: 'hull', w: 'neon' }, { e: -7, s: 'hull', w: 'neon' },
];
const NEW_LEVELS = (typeof newLevelDefs === 'function') ? newLevelDefs() : [];
const CLASSIC_DEFS = [
  { name: 'GROK MEADOWS', build: buildMeadows, start: [0, 0, 8], blurb: 'Crate puzzle · key & cage' },
  { name: 'SKY ISLANDS', build: buildSky, start: [0, 0, 4], blurb: 'Color switches · memory pads' },
  { name: 'LAVA CASTLE', build: buildLava, start: [0, 0, 5], blurb: 'Lava bridge · locked castle' },
  { name: 'FROSTBITE PEAKS', build: buildFrost, start: [0, 0, 5], blurb: 'Sliding ice-crate puzzle · icicles · snowmen' },
  { name: 'GHOST MANOR', build: buildManor, start: [0, 0, 5], blurb: 'Candle puzzle · phantom floors · shy ghosts' },
  { name: 'CLOCKWORK FACTORY', build: buildFactory, start: [0, 0, 5], blurb: 'Lever-light puzzle · gears · conveyors · robots' },
  { name: 'SUNNY SHORE', cw: 7, build: buildShore, start: [0, 0, 5], blurb: 'Jellyfish bounces · tide sandbars · water spout' },
  { name: 'TIDE POOLS', cw: 7, build: buildTidePools, start: [0, 0, 5], blurb: 'Timed spouts · shell-crate puzzle · seagulls' },
  { name: 'SUNKEN REEF', cw: 7, build: buildReef, start: [0, 0, 5], blurb: 'Bobbing jellies · coral lamps · turtle ferries' },
  { name: 'MOON BASE', cw: 8, build: buildMoon, start: [0, 0, 5], blurb: 'Low gravity · boost pads · UFOs' },
  { name: 'LASER LABS', cw: 8, build: buildLabs, start: [0, 0, 5], blurb: 'Laser fences · teleporters · power-cell puzzle' },
  { name: 'STAR CORE', cw: 8, build: buildCore, start: [0, 0, 5], blurb: 'Everything at once · the grand finale' },
];
const LEVELS = [];
NEW_LEVELS.forEach((L) => LEVELS.push(L));
const BOOST_W = (LEVELS.length ? LEVELS[LEVELS.length - 1].world : 0) + 1;
LEVELS.push({ name: 'MEADOW RUSH', sub: 'BOOST 1', world: BOOST_W, worldName: 'BOOST ZONES', song: 10, build: buildRush, start: [0, 0, 13], blurb: 'Open zone · grind rails · homing pods · a rail loop', isNew: true, boost: true });
if (typeof buildCanyonRush === 'function') LEVELS.push({ name: 'CANYON RUSH', sub: 'BOOST 2', world: BOOST_W, worldName: 'BOOST ZONES', song: 10, build: buildCanyonRush, start: [0, 0, 13], blurb: 'Desert open zone · mine rails · the Gold Rush Loop', isNew: true, boost: true });
if (typeof buildSpeedwayRush === 'function') LEVELS.push({ name: 'SHELL SPEEDWAY', sub: 'BOOST 3', world: BOOST_W, worldName: 'BOOST ZONES', song: 11, build: buildSpeedwayRush, start: [0, 0, 13], blurb: 'Tortuga Tech race track · banked rails · chicane', isNew: true, boost: true });
const CLASSIC_W0 = BOOST_W;
CLASSIC_DEFS.forEach((L, k) => {
  const cw = L.cw || (k + 1), sub = cw >= 7 ? 'CLASSIC ' + cw + '-' + (k - (cw === 7 ? 6 : 9) + 1) : 'CLASSIC ' + cw;
  LEVELS.push(Object.assign({}, L, { sub, world: CLASSIC_W0 + cw, worldName: cw === 7 ? 'CORAL COAST' : cw === 8 ? 'STARLIGHT STATION' : undefined, song: cw - 1, classic: true, tz: TEAM_ZONES_OLD[k] }));
});
function songOf(i) { return LEVELS[i] && LEVELS[i].song !== undefined ? LEVELS[i].song : i; }
// 3.0: worlds 7 & 8 have three levels each; the map shows one node per world
const WORLDS = [];
LEVELS.forEach((L, i) => { (WORLDS[L.world - 1] = WORLDS[L.world - 1] || []).push(i); });
function loadLevel(i) {
  clearWorld();
  decoRand = mulberry(7 + i * 13);
  W.levelIdx = i;
  LEVELS[i].build();
  if (NET.on) buildTeamZone(i);
  if (W.deco) {
    const t0 = performance.now();
    W.root.remove(W.deco);
    const mg = mergeStatic(W.deco);
    W.root.add(mg.group);
    W.deco = null;
    W.batchStats = { verts: mg.verts, buckets: mg.buckets, ms: Math.round(performance.now() - t0) };
  }
  const s = LEVELS[i].start;
  W.checkpoint.pos.set(s[0], s[1], s[2]); W.checkpoint.yaw = 0;
  resetPlayerAt(W.checkpoint.pos, 0);
}

// =====================================================================
// HUD / UI
// =====================================================================
const hudEls = { hearts: $('hearts'), lives: $('lives'), coins: $('coins'), stars: $('stars'), key: $('key-pill') };
const hudCache = {};
function updateHUD(force, bumpWhich) {
  if (hudEls.hearts.children.length !== P.maxHealth) {
    hudEls.hearts.innerHTML = '';
    for (let i = 0; i < P.maxHealth; i++) { const h = document.createElement('span'); h.className = 'heart on'; h.innerHTML = '&#9829;'; hudEls.hearts.appendChild(h); }
  }
  const hs = hudEls.hearts.children;
  for (let i = 0; i < hs.length; i++) hs[i].className = 'heart ' + (i < P.health ? 'on' : 'off');
  const vals = { lives: (save.easy || NET.on) ? '\u221e' : run.lives, coins: run.levelCoins || 0, stars: run.stars.filter(Boolean).length };
  for (const k in vals) {
    if (hudCache[k] !== vals[k] || force) {
      hudEls[k].textContent = vals[k];
      if (hudCache[k] !== undefined && hudCache[k] !== vals[k]) {
        const el = hudEls[k].parentElement;
        el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
      }
      hudCache[k] = vals[k];
    }
  }
  hudEls.key.classList.toggle('hidden', !P.hasKey);
  void bumpWhich;
}
function heartPop() {
  updateHUD(true);
  const h = hudEls.hearts.children[P.health - 1];
  if (h) { h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop'); }
  Snd.S.oneup();
}
let toastTimer = null;
function showToast(html, secs) {
  const t = $('toast');
  t.innerHTML = html;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), (secs || 3) * 1000);
}
let bannerTimer = null;
function showBanner(sub, title) {
  $('banner-sub').textContent = sub; $('banner-title').textContent = title;
  const b = $('banner'); b.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => b.classList.remove('show'), 2600);
}
const CARDS = ['title-card', 'map-card', 'pause-card', 'complete-card', 'gameover-card', 'mp-card', 'online-card'];
let curCard = 'title-card';
function showCard(id) {
  $('overlay').classList.add('show');
  for (const c of CARDS) $(c).classList.toggle('hidden', c !== id);
  curCard = id;
  const btn = $(id).querySelector('.btn.primary');
  if (btn && !IS_TOUCH) setTimeout(() => btn.focus({ preventScroll: true }), 50);
}
function hideOverlay() { $('overlay').classList.remove('show'); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }
function setPlayingUI(on) {
  $('hud').classList.toggle('hidden', !on);
  $('pause-btn').classList.toggle('hidden', !on);
  $('touch-ui').classList.toggle('hidden', !(on && IS_TOUCH));
  document.body.classList.toggle('title-mode', !on);
}
// ---- 2.0 world map ----
const MAP_POS = (() => { const n = WORLDS.length, per = Math.ceil(n / 2), out = [];
  for (let w = 0; w < n; w++) { const row = w < per ? 0 : 1, k = row ? n - 1 - w : w, cnt = row ? n - per : per; const x = 7 + (cnt > 1 ? (k - (row ? per : 0)) / (cnt - 1) : 0.5) * 86; out.push([row ? 7 + ((n - 1 - w) / Math.max(1, cnt - 1)) * 86 : x, (row ? 72 : 22) + ((w % 2) ? 8 : -6)]); }
  return out; })();
const MAP_COLORS = ['#e07a3a', '#f5c542', '#3a9a6a', '#3ff0ff', '#3fbf46', '#9b6bff', '#e0502c', '#38b6ff', '#7a4ad8', '#d08a2a', '#14b8a6', '#3a3f9a', '#ff4fd8', '#4ade80'];
let mapSel = 0;
function totalStars() { return save.stars.slice(0, LEVELS.length).reduce((a, s) => a + s.reduce((x, y) => x + y, 0), 0); }
function starsHtml(got, n) { return '&#9733;'.repeat(got) + '<span class="no">' + '&#9733;'.repeat(n - got) + '</span>'; }
function renderMap() {
  const wrap = $('world-map');
  wrap.innerHTML = '';
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('class', 'map-path');
  const path = document.createElementNS(NS, 'path');
  let d = '';
  MAP_POS.forEach((p, i) => {
    if (!i) { d += 'M ' + p[0] + ' ' + p[1]; return; }
    const q = MAP_POS[i - 1];
    d += ' C ' + ((q[0] + p[0]) / 2) + ' ' + q[1] + ', ' + ((q[0] + p[0]) / 2) + ' ' + p[1] + ', ' + p[0] + ' ' + p[1];
  });
  path.setAttribute('d', d); svg.appendChild(path);
  wrap.appendChild(svg);
  const selW = LEVELS[mapSel].world - 1;
  WORLDS.forEach((lv, w) => {
    const b = document.createElement('button');
    b.type = 'button';
    const allClear = lv.every((i) => save.cleared[i]);
    b.className = 'map-node' + (w === selW ? ' sel' : '') + (allClear ? ' cleared' : '');
    b.style.left = MAP_POS[w][0] + '%'; b.style.top = MAP_POS[w][1] + '%';
    b.style.setProperty('--nc', MAP_COLORS[w]);
    const got = lv.reduce((a, i) => a + save.stars[i].reduce((x, y) => x + y, 0), 0);
    const L0 = LEVELS[lv[0]];
    b.innerHTML = '<span class="num">' + (w + 1) + '</span><span class="ms">' + (lv.length > 1 ? '&#9733;' + got + '/' + lv.length * 3 : starsHtml(got, 3)) + '</span>' +
      (L0.isNew && !allClear ? '<span class="new">NEW</span>' : '') + (allClear ? '<span class="ok">&#10004;</span>' : '');
    b.setAttribute('aria-label', 'WORLD ' + (w + 1) + ' ' + (L0.worldName || L0.name));
    b.addEventListener('click', () => {
      Snd.init(); Snd.S.click();
      if (selW === w) { playFromMap(); return; }
      const f = lv.find((i) => !save.cleared[i]);
      mapSel = f === undefined ? lv[0] : f; renderMap();
    });
    wrap.appendChild(b);
  });
  const hero = document.createElement('div'); hero.className = 'map-hero';
  hero.style.left = MAP_POS[selW][0] + '%'; hero.style.top = MAP_POS[selW][1] + '%';
  wrap.appendChild(hero);
  const L = LEVELS[mapSel];
  $('map-name').textContent = L.sub + ' \u00b7 ' + L.name;
  $('map-blurb').textContent = (L.worldName ? L.worldName + ' \u2014 ' : '') + L.blurb;
  let chips = $('map-levels');
  if (!chips) { chips = document.createElement('div'); chips.id = 'map-levels'; $('map-stars').parentNode.insertBefore(chips, $('map-stars')); }
  chips.innerHTML = '';
  const lv = WORLDS[selW];
  chips.classList.toggle('hidden', lv.length < 2);
  if (lv.length > 1) lv.forEach((i, k) => {
    const c = document.createElement('button'); c.type = 'button';
    c.className = 'lvl-chip' + (i === mapSel ? ' sel' : '') + (save.cleared[i] ? ' cleared' : '');
    const g = save.stars[i].reduce((a, x) => a + x, 0);
    c.innerHTML = (selW + 1) + '-' + (k + 1) + ' <small>' + starsHtml(g, 3) + '</small>';
    c.setAttribute('aria-label', LEVELS[i].sub + ' ' + LEVELS[i].name);
    c.addEventListener('click', () => { Snd.init(); Snd.S.click(); if (mapSel === i) { playFromMap(); return; } mapSel = i; renderMap(); });
    chips.appendChild(c);
  });
  const got = save.stars[mapSel];
  $('map-stars').innerHTML = got.map((s) => (s ? '<span class="got">&#9733;</span>' : '<span class="no">&#9733;</span>')).join('') +
    (save.bestTime[mapSel] ? ' <span class="bt">best ' + fmtTime(save.bestTime[mapSel]) + '</span>' : '');
  $('map-total').textContent = totalStars() + ' / ' + (LEVELS.length * 3) + ' \u2605';
}
function openMap(sel) {
  if (sel !== undefined) mapSel = sel;
  else { const f = save.cleared.findIndex((c, i) => i < LEVELS.length && !c); mapSel = f < 0 ? 0 : f; }
  renderMap();
  showCard('map-card');
}
function playFromMap() { run.lives = 5; run.coins = 0; startLevel(mapSel); }
function renderEasy() {
  const b = $('easy-btn');
  b.classList.toggle('on', !!save.easy);
  b.innerHTML = 'EASY MODE: <b>' + (save.easy ? 'ON' : 'OFF') + '</b><small>' + (save.easy ? '5 hearts &middot; infinite lives &middot; extra ledge help' : 'tap for 5 hearts &amp; infinite lives') + '</small>';
}
function setEasy(v) { save.easy = !!v; persist(); renderEasy(); }
function renderLevelSelect() {
  $('title-stars').textContent = totalStars() + ' / ' + (LEVELS.length * 3);
  renderEasy();
}

// =====================================================================
// Game flow
// =====================================================================
let curLevel = 0;
function startLevel(i) {
  if (NET.on && !NET.applying) { if (!NET.host) return; netAnnounceStart(i); } // co-op: only the host picks worlds
  Snd.init();
  curLevel = i;
  run.stars = [false, false, false]; run.levelCoins = 0; run.time = 0; run.enemies = 0;
  if (run.lives <= 0) run.lives = 5;
  P.maxHealth = save.easy ? 5 : 3;
  P.health = P.maxHealth; P.hasKey = false; P.invuln = 0;
  loadLevel(i);
  mode = 'playing';
  hideOverlay();
  setPlayingUI(true);
  $('fade').classList.remove('on');
  $('level-name').textContent = LEVELS[i].sub + ' \u00b7 ' + LEVELS[i].name;
  showBanner(LEVELS[i].sub, LEVELS[i].name);
  Snd.playMusic(i);
  updateHUD(true);
  $('toast').classList.remove('show');
  if (NET.on) netLevelStarted();
}
function winLevel(goal) {
  P.state = 'win'; P.stateT = 0; P.vel.set(0, 0, 0); P.invuln = 0;
  Snd.stopMusic(); Snd.S.clear();
  const gp = goal.position;
  for (let i = 0; i < 6; i++) setTimeout(() => {
    const cols = [0xff4d4d, 0xffd23f, 0x59d65a, 0x38b6ff, 0xff6bd6, 0x8f6bff];
    burst(P.pos.x + (Math.random() - 0.5) * 3, P.pos.y + 3 + Math.random() * 2, P.pos.z + (Math.random() - 0.5) * 3, cols[i], 22, 8, 1.3, 10, 1.3);
  }, i * 220);
  burst(gp.x, gp.y + 2, gp.z, 0xffe14a, 40, 10, 1);
  showBanner(LEVELS[curLevel].sub, 'COURSE CLEAR!');
  // save progress
  save.cleared[curLevel] = 1;
  run.stars.forEach((s, i) => { if (s) save.stars[curLevel][i] = 1; });
  save.bestCoins[curLevel] = Math.max(save.bestCoins[curLevel] || 0, run.levelCoins);
  if (!save.bestTime[curLevel] || run.time < save.bestTime[curLevel]) save.bestTime[curLevel] = Math.round(run.time);
  if (run.team && run.team.some(Boolean)) { save.team = save.team || {}; const tt = save.team[curLevel] || [0, 0]; run.team.forEach((v, k) => { if (v) tt[k] = 1; }); save.team[curLevel] = tt; }
  persist();
  setTimeout(showComplete, 2700);
}
function fmtTime(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + String(s).padStart(2, '0'); }
function showComplete() {
  if (mode !== 'playing') return;
  mode = 'complete';
  setPlayingUI(false);
  const last = curLevel === LEVELS.length - 1;
  $('complete-kicker').textContent = LEVELS[curLevel].sub + ' \u00b7 ' + LEVELS[curLevel].name;
  const allStars = totalStars();
  $('complete-title').textContent = last ? 'YOU BEAT GROK LAND 2!' : (LEVELS[curLevel].boost ? 'ZONE CLEAR!' : 'COURSE CLEAR!');
  $('complete-stars').innerHTML = run.stars.map((s, i) => '<span class="' + (s ? 'got' : 'no') + '" style="animation-delay:' + (0.2 + i * 0.25) + 's">&#9733;</span>').join('');
  const rows = [['Coins', run.levelCoins], ['Stars found', run.stars.filter(Boolean).length + ' / 3'], ['Enemies bopped', run.enemies], ['Time', fmtTime(run.time)], ['Lives left', save.easy ? '\u221e' : run.lives]];
  if (W.boost) { const rk = W.boost.rank, t = run.time, R = t <= rk[0] ? 'S' : t <= rk[1] ? 'A' : t <= rk[2] ? 'B' : 'C'; rows.splice(0, 1, ['Rank', '<b class="rank">' + R + '</b>'], ['Rings', W.boost.rings]); save.rank = save.rank || {}; const order = 'CBAS'; if (!save.rank[curLevel] || order.indexOf(R) > order.indexOf(save.rank[curLevel])) { save.rank[curLevel] = R; persist(); } }
  rows.push(['All-time stars', allStars + ' / ' + (LEVELS.length * 3)]);
  if (NET.on) netCompleteRows(rows);
  $('complete-stats').innerHTML = rows.map((r) => '<div>' + r[0] + '</div><div>' + r[1] + '</div>').join('');
  $('next-btn').textContent = last ? 'WORLD MAP' : (LEVELS[curLevel + 1].world === LEVELS[curLevel].world ? 'NEXT LEVEL \u25b6' : 'NEXT WORLD \u25b6');
  showCard('complete-card');
  renderLevelSelect();
  netCompleteUI();
}
function gameOver() {
  mode = 'gameover';
  Snd.stopMusic(); Snd.S.gameover();
  setPlayingUI(false);
  showCard('gameover-card');
}
function goTitle() {
  if (NET.on && NET.host) netBroadcast({ t: 'menu' });
  Snd.stopMusic();
  mode = 'title';
  loadLevel(curLevel);
  P.frozen = true;
  setPlayingUI(false);
  renderLevelSelect();
  showCard('title-card');
  $('toast').classList.remove('show');
  $('banner').classList.remove('show');
  if (Snd.isMuted() === false) Snd.playMusic(0);
}
function togglePause() {
  if (NET.on) { netToggleMenu(); return; } // co-op can't pause the world: open the co-op menu instead
  if (mode === 'playing') {
    if (P.state === 'win') return;
    mode = 'paused';
    Snd.stopMusic(); Snd.S.pause();
    $('pause-tip').innerHTML = 'Stars this run: <b>' + run.stars.filter(Boolean).length + ' / 3</b> &middot; Coins: <b>' + run.levelCoins + '</b>' + (save.easy ? ' &middot; <b>EASY MODE</b>' : '');
    showCard('pause-card');
  } else if (mode === 'paused') {
    resume();
  }
}
function resume() {
  mode = 'playing';
  hideOverlay();
  Snd.playMusic(curLevel);
  lastT = performance.now();
}
function toggleMute() {
  Snd.init();
  save.muted = !Snd.isMuted();
  Snd.setMuted(save.muted);
  persist();
  $('mute-btn').classList.toggle('off', save.muted);
}

// ---- buttons ----
function onBtn(id, fn) {
  $(id).addEventListener('click', (e) => { Snd.init(); Snd.S.click(); fn(e); e.currentTarget.blur(); });
}
onBtn('play-btn', () => { run.lives = 5; run.coins = 0; let first = save.cleared.findIndex((c, i) => i < LEVELS.length && !c); if (first < 0) first = 0; startLevel(first); });
onBtn('map-btn', () => openMap());
onBtn('boost-btn', () => { run.lives = 5; run.coins = 0; startLevel(LEVELS.findIndex((L) => L.boost)); });
onBtn('online-btn', openOnline);
onBtn('on-host', () => onlineGo('host'));
onBtn('on-join', () => onlineGo('join'));
onBtn('on-back', () => showCard('title-card'));
onBtn('easy-btn', () => setEasy(!save.easy));
onBtn('map-play', playFromMap);
onBtn('map-back', () => { renderLevelSelect(); showCard('title-card'); });
onBtn('complete-map-btn', () => { goTitle(); openMap(Math.min(curLevel + 1, LEVELS.length - 1)); });
onBtn('resume-btn', resume);
onBtn('restart-btn', () => startLevel(curLevel));
onBtn('pause-title-btn', goTitle);
onBtn('next-btn', () => { if (curLevel === LEVELS.length - 1) { goTitle(); openMap(curLevel); } else startLevel(curLevel + 1); });
onBtn('replay-btn', () => startLevel(curLevel));
onBtn('complete-title-btn', () => { if (NET.on) netLobby(); else goTitle(); });
onBtn('retry-btn', () => { run.lives = 5; run.coins = 0; startLevel(curLevel); });
onBtn('go-title-btn', () => { run.lives = 5; goTitle(); });
$('pause-btn').addEventListener('click', (e) => { Snd.init(); togglePause(); e.currentTarget.blur(); });
$('mute-btn').addEventListener('click', (e) => { toggleMute(); e.currentTarget.blur(); });
$('mute-btn').classList.toggle('off', !!save.muted);

// =====================================================================
// Input wiring
// =====================================================================
function handleEnter() {
  if (mode === 'title') { if (curCard === 'map-card') playFromMap(); else $('play-btn').click(); }
  else if (mode === 'complete') $('next-btn').click();
  else if (mode === 'gameover') $('retry-btn').click();
  else if (mode === 'paused') resume();
}
const GAME_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight']);
window.addEventListener('keydown', (e) => {
  if (GAME_KEYS.has(e.code) && (mode === 'playing' || e.code !== 'Space' || document.activeElement === document.body)) e.preventDefault();
  if (mode === 'playing' && document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur();
  Snd.init();
  if (e.repeat) return;
  keys[e.code] = true;
  if (JUMP_KEYS.has(e.code)) input.jumpPressed = true;
  if (ACTION_KEYS.has(e.code)) input.actionPressed = true;
  if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'Enter' && mode !== 'playing') { e.preventDefault(); handleEnter(); }
  if (mode === 'title' && curCard === 'map-card' && (e.code === 'ArrowRight' || e.code === 'ArrowLeft' || e.code === 'KeyD' || e.code === 'KeyA')) {
    mapSel = (mapSel + (e.code === 'ArrowRight' || e.code === 'KeyD' ? 1 : LEVELS.length - 1)) % LEVELS.length; renderMap(); Snd.S.click();
  }
  if (mode === 'title' && curCard === 'map-card' && e.code === 'Escape') { renderLevelSelect(); showCard('title-card'); }
});
window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
  if (GAME_KEYS.has(e.code) && mode === 'playing') e.preventDefault();
});
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (mode === 'playing' && !NET.on) togglePause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'playing' && !NET.on) togglePause(); });

// mouse camera drag
let mouseDrag = null;
canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse') return;
  mouseDrag = { x: e.clientX, y: e.clientY };
  Snd.init();
});
window.addEventListener('pointermove', (e) => {
  if (!mouseDrag || e.pointerType !== 'mouse') return;
  const dx = e.clientX - mouseDrag.x, dy = e.clientY - mouseDrag.y;
  mouseDrag.x = e.clientX; mouseDrag.y = e.clientY;
  if (mode !== 'playing') return;
  cam.yaw -= dx * 0.0055;
  cam.pitch = clamp(cam.pitch + dy * 0.004, 0.02, 1.2);
  cam.manualT = 0;
});
window.addEventListener('pointerup', (e) => { if (e.pointerType === 'mouse') mouseDrag = null; });
canvas.addEventListener('wheel', (e) => { if (mode === 'playing') { cam.dist = clamp(cam.dist + Math.sign(e.deltaY) * 0.8, 6, 16); e.preventDefault(); } }, { passive: false });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// touch controls
function enableTouch() {
  if (!IS_TOUCH) { IS_TOUCH = true; }
  document.body.classList.add('touch');
  if (mode === 'playing') $('touch-ui').classList.remove('hidden');
}
if (IS_TOUCH) document.body.classList.add('touch');
window.addEventListener('touchstart', enableTouch, { passive: true });
const joyBase = $('joy-base'), joyStick = $('joy-stick');
const JOY_R = 55;
let joy = null, camTouch = null;
function joyDefault() { joyBase.style.left = ''; joyBase.style.top = ''; joyBase.style.bottom = ''; joyStick.style.transform = ''; }
$('joy-zone').addEventListener('pointerdown', (e) => {
  e.preventDefault(); Snd.init();
  if (joy) return;
  joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY };
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  joyBase.style.left = (e.clientX - 65) + 'px'; joyBase.style.top = (e.clientY - 65) + 'px'; joyBase.style.bottom = 'auto';
  touchState.jx = 0; touchState.jy = 0;
});
$('joy-zone').addEventListener('pointermove', (e) => {
  if (!joy || e.pointerId !== joy.id) return;
  let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy;
  const d = Math.hypot(dx, dy);
  if (d > JOY_R) { dx *= JOY_R / d; dy *= JOY_R / d; }
  joyStick.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
  const k = Math.min(1, d / JOY_R);
  const dead = 0.12;
  const mag = k < dead ? 0 : (k - dead) / (1 - dead);
  const n = Math.hypot(dx, dy) || 1;
  touchState.jx = (dx / n) * mag; touchState.jy = (-dy / n) * mag;
});
function joyEnd(e) { if (!joy || e.pointerId !== joy.id) return; joy = null; touchState.jx = 0; touchState.jy = 0; joyDefault(); }
$('joy-zone').addEventListener('pointerup', joyEnd);
$('joy-zone').addEventListener('pointercancel', joyEnd);
$('cam-zone').addEventListener('pointerdown', (e) => {
  e.preventDefault(); Snd.init();
  if (camTouch) return;
  camTouch = { id: e.pointerId, x: e.clientX, y: e.clientY };
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
});
$('cam-zone').addEventListener('pointermove', (e) => {
  if (!camTouch || e.pointerId !== camTouch.id) return;
  const dx = e.clientX - camTouch.x, dy = e.clientY - camTouch.y;
  camTouch.x = e.clientX; camTouch.y = e.clientY;
  cam.yaw -= dx * 0.008;
  cam.pitch = clamp(cam.pitch + dy * 0.005, 0.02, 1.2);
  cam.manualT = 0;
});
function camEnd(e) { if (camTouch && e.pointerId === camTouch.id) camTouch = null; }
$('cam-zone').addEventListener('pointerup', camEnd);
$('cam-zone').addEventListener('pointercancel', camEnd);
function bindTouchBtn(id, key) {
  const el = $(id);
  const down = (e) => {
    e.preventDefault(); Snd.init();
    touchState[key] = true; el.classList.add('down');
    if (key === 'jump') input.jumpPressed = true; else if (key === 'action') input.actionPressed = true;
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  };
  const up = (e) => { e.preventDefault(); touchState[key] = false; el.classList.remove('down'); };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('lostpointercapture', up);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}
bindTouchBtn('btn-jump', 'jump');
bindTouchBtn('btn-action', 'action');
bindTouchBtn('btn-boost', 'boost');

function readInput() {
  let x = 0, y = 0;
  if (keys.KeyD || keys.ArrowRight) x += 1;
  if (keys.KeyA || keys.ArrowLeft) x -= 1;
  if (keys.KeyW || keys.ArrowUp) y += 1;
  if (keys.KeyS || keys.ArrowDown) y -= 1;
  const l = Math.hypot(x, y);
  if (l > 1) { x /= l; y /= l; }
  if (Math.abs(touchState.jx) + Math.abs(touchState.jy) > 0.01) { x = touchState.jx; y = touchState.jy; }
  input.mx = x; input.my = y;
  input.jump = !!(keys.Space || keys.KeyJ || keys.KeyZ || touchState.jump);
  input.action = !!(keys.ShiftLeft || keys.ShiftRight || keys.KeyX || keys.KeyF || keys.KeyK || touchState.action);
  input.boost = !!(keys.KeyC || keys.KeyB || keys.KeyL || touchState.boost);
  if (NET.menu) { input.mx = 0; input.my = 0; input.jump = false; input.action = false; input.jumpPressed = false; input.actionPressed = false; }
}

// =====================================================================
// Main loop
// =====================================================================
function worldTick(dt) {
  W.time += dt;
  if (mode === 'playing' && P.state !== 'win') run.time += dt;
  for (const s of W.solids) { s.dx = 0; s.dy = 0; s.dz = 0; }
  if (NET.on) netPreTick(dt);
  for (let i = 0; i < W.things.length; i++) W.things[i].update(dt);
  updatePushBlocks(dt);
  for (let i = W.anim.length - 1; i >= 0; i--) { const a = W.anim[i]; if (a.f(dt, a)) W.anim.splice(i, 1); }
  const g = P.ground;
  if (g && g.active && (g.dx || g.dy || g.dz) && P.state !== 'dead' && !P.frozen) { P.pos.x += g.dx; P.pos.y += g.dy; P.pos.z += g.dz; }
  if (g && g.active && P.grounded && P.state !== 'dead' && !P.frozen) {
    if (g.conv) { P.wasGrounded = true; pMove('x', g.conv[0] * dt); pMove('z', g.conv[1] * dt); }
    if (g.spinD) {
      const ox = P.pos.x - g.x, oz = P.pos.z - g.z, c = Math.cos(g.spinD), sn = Math.sin(g.spinD);
      P.wasGrounded = true;
      pMove('x', (ox * c + oz * sn) - ox); pMove('z', (-ox * sn + oz * c) - oz);
      P.facing += g.spinD;
    }
  }
  if (P.state !== 'dead' && !P.frozen) resolveOverlaps();
  playerTick(dt);
  updateEnemies(dt);
  updateProjectiles(dt);
  updateItems(dt);
  if (NET.on) netPostTick(dt);
}
let lastT = performance.now(), acc = 0, firstFrame = true, manualTick = false;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, Math.max(0, (now - lastT) / 1000));
  lastT = now;
  readInput();
  if (manualTick) { acc = 0; }
  else if (mode === 'playing' || mode === 'title') {
    acc += dt;
    let steps = 0;
    while (acc >= FIXED && steps < 12) {
      worldTick(FIXED);
      acc -= FIXED; steps++;
      input.jumpPressed = false; input.actionPressed = false;
    }
    if (steps >= 12) acc = 0;
  } else { input.jumpPressed = false; input.actionPressed = false; }
  updateFx(dt);
  animatePlayer(dt);
  if (W.boost) boostAnim(dt);
  boostFrame(dt);
  if (NET.on) netFrame(dt);
  updateCamera(dt);
  const t = now / 1000;
  for (const c of W.clouds) { if (c.speed) { c.m.position.x += c.speed * dt; if (c.m.position.x > 260) c.m.position.x = -260; } }
  for (let ti = 0; ti < W.torches.length; ti++) { const f = W.torches[ti]; const s = 0.8 + Math.sin(t * 17 + ti * 1.7) * 0.12 + Math.random() * 0.08; f.scale.set(0.24 * s, 0.6 * s, 0.24 * s); }
  if (W.scenery) W.scenery(dt, t);
  if (W.sky) W.sky.position.copy(camera.position);
  const fx = mode === 'title' ? (W.titleFocus || P.pos) : P.pos;
  sun.position.set(fx.x + 18, fx.y + 38, fx.z + 14);
  sun.target.position.set(fx.x, fx.y, fx.z);
  sun.target.updateMatrixWorld();
  renderer.render(scene, camera);
  if (firstFrame) { firstFrame = false; const l = $('loading'); if (l) l.remove(); }
}

// =====================================================================
// ONLINE CO-OP (2 players, up to 3). Only active with ?mp=host|join&code=... (sent by the Grok Arcade
// lobby). Every player simulates their own hero and streams it ~15x a second; partners are drawn
// ~120 ms behind and interpolated. The host is the referee for coins, stars, enemies, switches and
// crates so nothing is counted twice. Without mp params nothing here runs.
// =====================================================================
const NET_DT = 1 / 15, INTERP_MS = 120, HEAD_BOUNCE = 18.5;
const NET_LOG = { took: 1, ekill: 1, press: 1, door: 1, solve: 1, qb: 1 };
let room = null, netBadge = null;
function r2(v) { return Math.round(v * 100) / 100; }
function r3(v) { return Math.round(v * 1000) / 1000; }
function colorNum(c) { const n = parseInt(String(c || '').replace('#', ''), 16); return isFinite(n) ? n : 0xff3b3b; }
function netEsc(s) { return window.GrokNet ? window.GrokNet.esc(s) : String(s); }
// client -> host only
function netSend(d) { if (!room || NET.host) return; d.g = NET.gen; room.send(d); }
// host -> everyone else (remembered so late joiners can catch up)
function netBroadcast(d) {
  if (!room || !NET.host) return;
  d.g = NET.gen;
  if (NET_LOG[d.t]) NET.log.push(d);
  room.broadcast(d);
}
// anyone -> everyone else (a joiner's event is relayed by the host)
function netEvent(d) { if (!room || NET.applying) return; d.g = NET.gen; room.broadcast(d); }
function netInfo(pid) {
  const l = room ? room.players() : [];
  for (const p of l) if (p.pid === pid) return p;
  return { pid, name: 'Partner', color: '#3ff0ff', slot: 9 };
}
function netName(pid) { return pid === NET.pid ? 'You' : netInfo(pid).name; }
let noticeT = null;
function netNotice(html, secs) { // co-op status line (joins, leaves, reconnects) that toasts can't overwrite
  const el = $('mp-notice');
  el.innerHTML = html; el.classList.add('show');
  clearTimeout(noticeT);
  noticeT = setTimeout(() => el.classList.remove('show'), (secs || 4) * 1000);
}
function netAlone() { return !NET.on || !room || room.count() < 2; }
function netHostName() { const l = room ? room.players() : []; for (const p of l) if (p.host) return p.name; return 'the host'; }

// ---------- partner heroes ----------
function makeNameTag(name, color) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 72;
  const g = c.getContext('2d');
  g.font = 'bold 34px "Trebuchet MS", Arial, sans-serif';
  const w = Math.min(248, g.measureText(name).width + 40), x0 = (256 - w) / 2, y0 = 8, h = 56, rr = 22;
  g.beginPath();
  g.moveTo(x0 + rr, y0); g.lineTo(x0 + w - rr, y0); g.arcTo(x0 + w, y0, x0 + w, y0 + rr, rr); g.lineTo(x0 + w, y0 + h - rr);
  g.arcTo(x0 + w, y0 + h, x0 + w - rr, y0 + h, rr); g.lineTo(x0 + rr, y0 + h); g.arcTo(x0, y0 + h, x0, y0 + h - rr, rr); g.lineTo(x0, y0 + rr); g.arcTo(x0, y0, x0 + rr, y0, rr);
  g.closePath();
  g.fillStyle = 'rgba(20,12,48,0.85)'; g.fill();
  g.lineWidth = 6; g.strokeStyle = color; g.stroke();
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name, 128, 37, 220);
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
  sp.scale.set(2.3, 0.65, 1); sp.renderOrder = 999;
  return sp;
}
function netRemote(pid) {
  let R = NET.remotes.get(pid);
  if (R) return R;
  const info = netInfo(pid);
  R = {
    pid, name: info.name, color: info.color, snaps: [], last: null, ls: new V3(),
    view: { remote: true, pos: new V3(0, -999, 0), vel: new V3(), facing: 0, state: 'normal', stateT: 0, grounded: true, flip: 0, squash: 1, animT: 0, invuln: 0, frozen: false, pushing: false, model: null, blob: null, ring: null },
    head: { kind: 'head', active: false, x: 0, y: -999, z: 0, hx: 0.42, hy: 0.06, hz: 0.42, dx: 0, dy: 0, dz: 0 },
    tgt: { pos: new V3(), vel: new V3(), facing: 0, state: 'dead', frozen: true },
  };
  R.view.model = buildHero(colorNum(R.color)); scene.add(R.view.model.root);
  R.view.blob = new THREE.Mesh(G.circle, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false }));
  R.view.blob.renderOrder = 2; scene.add(R.view.blob);
  R.tag = makeNameTag(R.name, R.color); scene.add(R.tag);
  R.arrow = document.createElement('div'); R.arrow.className = 'mp-arrow hidden';
  R.arrow.innerHTML = '<i></i><span></span>'; R.arrow.style.setProperty('--c', R.color);
  $('mp-arrows').appendChild(R.arrow);
  NET.remotes.set(pid, R);
  return R;
}
function netDropRemote(pid) {
  const R = NET.remotes.get(pid);
  if (!R) return;
  scene.remove(R.view.model.root); scene.remove(R.view.blob); scene.remove(R.tag);
  R.arrow.remove();
  if (P.ground === R.head) { P.ground = null; P.grounded = false; }
  NET.remotes.delete(pid);
}
function netOnPlayer(d, from) {
  if (from === NET.pid || !NET.inLevel) return;
  const R = netRemote(from);
  if (!R.last || R.last.g !== d.g) R.snaps.length = 0;
  if (R.last && R.last.dj !== d.dj && d.g === NET.gen) R.view.flip = 1;
  R.last = d;
  R.snaps.push({ t: performance.now(), x: d.x, y: d.y, z: d.z, f: d.f });
  if (R.snaps.length > 30) R.snaps.shift();
  R.tgt.pos.set(d.x, d.y, d.z); R.tgt.vel.set(d.vx, d.vy, d.vz); R.tgt.facing = d.f;
  R.tgt.state = d.g === NET.gen ? d.s : 'dead'; R.tgt.frozen = !!d.fr || d.g !== NET.gen;
  if (d.ls) R.ls.set(d.ls[0], d.ls[1], d.ls[2]);
}
const _ns = { x: 0, y: 0, z: 0, f: 0 };
function netSample(snaps, t) {
  const n = snaps.length;
  if (!n) return null;
  const last = snaps[n - 1];
  if (t >= last.t) return last;
  let i = n - 1;
  while (i > 0 && snaps[i - 1].t > t) i--;
  if (i === 0) return snaps[0];
  const a = snaps[i - 1], b = snaps[i];
  const k = clamp((t - a.t) / Math.max(1, b.t - a.t), 0, 1);
  if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z) > 6) return k < 0.5 ? a : b; // teleport: don't smear
  _ns.x = lerp(a.x, b.x, k); _ns.y = lerp(a.y, b.y, k); _ns.z = lerp(a.z, b.z, k); _ns.f = angleLerp(a.f, b.f, k);
  return _ns;
}
function netRemoteLive(R) { const L = R.last; return !!L && L.g === NET.gen && NET.inLevel; }
// nearest player an enemy should care about (host only)
function netTarget(e) {
  let best = P, bd = Infinity;
  if (P.state !== 'dead' && P.state !== 'win' && !P.frozen) bd = e.pos.distanceToSquared(P.pos);
  for (const R of NET.remotes.values()) {
    const T = R.tgt;
    if (!netRemoteLive(R) || T.state === 'dead' || T.state === 'win' || T.frozen) continue;
    const d = e.pos.distanceToSquared(T.pos);
    if (d < bd) { bd = d; best = T; }
  }
  return best;
}
// where to pop back in: next to a partner who is safely on the ground
function netPartnerSpot() {
  for (const R of NET.remotes.values()) {
    const L = R.last;
    if (!netRemoteLive(R) || L.fr || L.s === 'dead' || L.s === 'win') continue;
    const bases = [];
    if (L.gr) bases.push(new V3(L.x, L.y, L.z)); // right next to where they stand now
    bases.push(R.ls);                            // else their last safe ground
    for (const b of bases) {
      for (const o of [[1.1, 0], [-1.1, 0], [0, 1.1], [0, -1.1], [0, 0]]) {
        const x = b.x + o[0], z = b.z + o[1];
        const gt = groundTopAt(x, z, b.y + 0.6);
        if (Math.abs(gt - b.y) < 0.35 && boxFree(x, gt + P.h / 2 + 0.06, z, P.r, P.h / 2, P.r, null)) return new V3(x, gt, z);
      }
    }
    const b = R.ls;
    return b.clone();
  }
  return null;
}
// standing / bouncing on a partner's head (called from pMove after a downward move)
function netHeadLand(p, amt) {
  if (P.grounded || P.state === 'dead') return;
  const prevY = p.y - amt;
  for (const R of NET.remotes.values()) {
    const h = R.head;
    if (!h.active) continue;
    const top = h.y + h.hy;
    if (Math.abs(p.x - h.x) > P.r + h.hx || Math.abs(p.z - h.z) > P.r + h.hz) continue;
    if (prevY < top - 0.05 || p.y > top) continue;
    p.y = top;
    P.landVy = Math.min(P.landVy, P.vel.y);
    if (input.jump && P.state !== 'pound') {
      P.bounceV = HEAD_BOUNCE; // big boost: reach ledges nobody can reach alone
      netEvent({ t: 'bop', to: R.pid });
      R.view.squash = 0.6;
    } else {
      if (P.vel.y < 0) P.vel.y = 0;
      P.grounded = true; P.ground = h;
      if (P.state === 'pound') { P.state = 'normal'; P.stateT = 0; }
    }
    return;
  }
}

// ---------- per-tick hooks ----------
function netPreTick(dt) {
  for (const R of NET.remotes.values()) {
    const h = R.head, v = R.view, L = R.last;
    const ok = netRemoteLive(R) && !L.fr && L.s !== 'dead' && v.pos.y > -900;
    if (!ok) { h.active = false; h.dx = h.dy = h.dz = 0; continue; }
    const nx = v.pos.x, ny = v.pos.y + P.h - h.hy, nz = v.pos.z;
    if (h.active && Math.abs(nx - h.x) + Math.abs(ny - h.y) + Math.abs(nz - h.z) < 3) { h.dx = nx - h.x; h.dy = ny - h.y; h.dz = nz - h.z; }
    else { h.dx = h.dy = h.dz = 0; }
    h.x = nx; h.y = ny; h.z = nz; h.active = true;
  }
  if (!NET.host) { // joiner: ease crates toward the host's positions (unless I'm pushing that crate)
    for (const b of W.pushBlocks) {
      if (!b.nt || b.slide || W.time - (b.netPush === undefined ? -9 : b.netPush) < 0.6) continue;
      const dx = b.nt[0] - b.x, dy = b.nt[1] - b.y, dz = b.nt[2] - b.z;
      if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) < 0.003) continue;
      if (dx * dx + dy * dy + dz * dz > 9) setSolidPos(b, b.nt[0], b.nt[1], b.nt[2]);
      else { const k = damp(14, dt); setSolidPos(b, b.x + dx * k, b.y + dy * k, b.z + dz * k); }
    }
  }
}
function netPostTick() {
  if (P.flip > NET.prevFlip + 0.5) NET.dj++;
  NET.prevFlip = P.flip;
  if (NET.host) NET.pounds.clear();
}
function netPad(x, top, z, half, local) {
  const key = x + '|' + top + '|' + z;
  if (!NET.host) return NET.padsHost.has(key);
  let on = local;
  if (!on) {
    for (const R of NET.remotes.values()) {
      const L = R.last;
      if (netRemoteLive(R) && L.gr && L.s !== 'dead' && !L.fr && Math.abs(L.x - x) < half && Math.abs(L.z - z) < half && Math.abs(L.y - top) < 0.3) { on = true; break; }
    }
  }
  if (on) NET.padsAcc.add(key);
  return on;
}
function netPounded(ped) { return NET.host && NET.pounds.has(W.solids.indexOf(ped)); }

// ---------- per-frame: draw partners, arrows, send state ----------
const _proj = new V3();
function netFrame(dt) {
  const now = performance.now(), rt = now - INTERP_MS;
  const showWorld = NET.inLevel && (mode === 'playing' || mode === 'complete');
  for (const R of NET.remotes.values()) {
    const v = R.view, L = R.last;
    const vis = showWorld && netRemoteLive(R);
    if (!vis) { v.model.root.visible = false; v.blob.visible = false; R.tag.visible = false; R.arrow.classList.add('hidden'); continue; }
    const s = netSample(R.snaps, rt);
    if (s) { v.pos.set(s.x, s.y, s.z); v.facing = s.f; }
    v.vel.set(L.vx, L.vy, L.vz); v.grounded = !!L.gr; v.frozen = !!L.fr; v.pushing = !!L.pu;
    v.invuln = L.iv ? 0.02 + ((now / 1000) % 1) : 0;
    if (L.s !== v.state) { v.state = L.s; v.stateT = 0; } else v.stateT += dt;
    animateHero(v, dt);
    R.tag.visible = !v.frozen && v.state !== 'dead';
    R.tag.position.set(v.pos.x, v.pos.y + 2.4, v.pos.z);
    netArrow(R, v);
  }
  NET.sendT += dt;
  if (NET.sendT >= NET_DT) {
    NET.sendT = Math.min(NET.sendT - NET_DT, NET_DT);
    netSendState();
    if (NET.host) netSendWorld();
  }
}
function netArrow(R, v) {
  const el = R.arrow;
  if (mode !== 'playing' || v.frozen) { el.classList.add('hidden'); return; }
  _proj.set(v.pos.x, v.pos.y + 1, v.pos.z).project(camera);
  const behind = _proj.z > 1;
  let x = _proj.x, y = _proj.y;
  if (!behind && Math.abs(x) < 0.92 && Math.abs(y) < 0.88) { el.classList.add('hidden'); return; }
  if (behind) { x = -x; y = -y; if (Math.abs(x) < 0.01 && Math.abs(y) < 0.01) y = -1; }
  const m = Math.max(Math.abs(x) / 0.86, Math.abs(y) / 0.8, 0.0001);
  x /= m; y /= m;
  const W2 = innerWidth / 2, H2 = innerHeight / 2;
  const px = W2 + x * W2, py = H2 - y * H2;
  const ang = Math.atan2(-y, x);
  el.classList.remove('hidden');
  el.style.transform = 'translate(' + Math.round(px) + 'px,' + Math.round(py) + 'px)';
  el.firstChild.style.transform = 'translate(-50%,-50%) rotate(' + ang.toFixed(2) + 'rad)';
  const dist = Math.round(Math.hypot(v.pos.x - P.pos.x, v.pos.y - P.pos.y, v.pos.z - P.pos.z));
  const txt = R.name + ' ' + dist + 'm';
  if (el.lastChild.textContent !== txt) el.lastChild.textContent = txt;
  // keep the name label fully on screen (the arrow sits right at the edge)
  const lw = el.lastChild.offsetWidth || 80;
  el.lastChild.style.transform = 'none';
  el.lastChild.style.left = Math.round(Math.max(6, Math.min(innerWidth - lw - 6, px - lw / 2)) - px) + 'px';
  el.lastChild.style.top = (py > innerHeight - 60 ? -48 : 22) + 'px';
}
function netSendState() {
  if (!room || !NET.inLevel) return;
  if (mode !== 'playing' && mode !== 'complete') return;
  room.broadcast({ t: 'p', g: NET.gen, x: r2(P.pos.x), y: r2(P.pos.y), z: r2(P.pos.z), f: r2(P.facing), s: P.state,
    vx: r2(P.vel.x), vy: r2(P.vel.y), vz: r2(P.vel.z), gr: P.grounded ? 1 : 0, iv: P.invuln > 0 ? 1 : 0, fr: P.frozen ? 1 : 0,
    pu: P.pushing ? 1 : 0, dj: NET.dj, ls: [r2(P.lastSafe.x), r2(P.lastSafe.y), r2(P.lastSafe.z)] });
  if (!NET.host) {
    W.pushBlocks.forEach((b, i) => {
      if (b.seated || b.netPush === undefined || W.time - b.netPush > 0.2) return;
      if (b.slide && !b.netSlideSent) { b.netSlideSent = true; netSend({ t: 'blk', i, x: r3(b.x), z: r3(b.z), sl: [b.slide.axis, b.slide.dir] }); }
      else if (!b.slide) netSend({ t: 'blk', i, x: r3(b.x), z: r3(b.z) });
    });
  }
}
const PMODES = ['walk', 'aim', 'slide', 'recover'];
function enemySnap(e) {
  const m = e.model;
  let a = 0, b = 0;
  if (e.type === 'walker') a = e.alert ? 1 : 0;
  else if (e.type === 'turret') { a = r2(m.head.rotation.y); b = m.head.scale.x > 1.05 ? 1 : 0; }
  else if (e.type === 'snowman') a = m.armR.rotation.x < -1 ? 1 : 0;
  else if (e.type === 'penguin') a = Math.max(0, PMODES.indexOf(e.pmode));
  else if (e.type === 'ghost') { const al = e.alpha === undefined ? 0.88 : e.alpha; a = Math.round(al * 100); b = (al < 0.6 ? 1 : 0) | (m.tongue.visible ? 2 : 0); }
  else if (e.type === 'robot') { const cyc = (e.t + e.ph) % 4.6; a = cyc > 3.2 ? 1 : cyc > 2.5 ? 2 : 0; }
  return [e.id, r2(e.pos.x), r2(e.pos.y), r2(e.pos.z), r2(e.dir), a, b];
}
function netSendWorld() {
  if (!room || !NET.inLevel || mode !== 'playing' || room.count() < 2) { NET.padsAcc.clear(); return; }
  const d = { t: 'w', tm: r3(W.time), pads: Array.from(NET.padsAcc), cs: W.colorState, e: [], bl: [] };
  NET.padsAcc.clear();
  for (const e of W.enemies) if (e.alive) d.e.push(enemySnap(e));
  for (const b of W.pushBlocks) d.bl.push([r3(b.x), r3(b.y), r3(b.z)]);
  if (W.candles) { d.cd = W.candles.candles.map((c) => Math.max(0, Math.ceil(c.t * 10))); d.cds = W.candles.solved ? 1 : 0; }
  if (W.levers) d.lv = [W.levers.state.slice(), W.levers.solved ? 1 : 0];
  if (W.simon) d.sm = W.simon.state === 'done' ? 1 : 0;
  d.g = NET.gen;
  room.broadcast(d);
}
function netOnWorld(d) {
  const drift = d.tm + 0.04 - W.time;
  if (Math.abs(drift) > 0.4) W.time = d.tm; else W.time += drift * 0.08;
  NET.padsHost = new Set(d.pads);
  if (d.cs !== W.colorState) { if (++NET.csBad >= 4) { toggleColors(); NET.csBad = 0; } } else NET.csBad = 0;
  const now = performance.now(), seen = new Set();
  for (const s of d.e) {
    const e = NET.enemyMap.get(s[0]);
    if (!e || !e.alive) continue;
    seen.add(e);
    if (!e.snaps) e.snaps = [];
    e.snaps.push({ t: now, x: s[1], y: s[2], z: s[3], f: s[4] });
    if (e.snaps.length > 20) e.snaps.shift();
    e.na = s[5]; e.nb = s[6]; e.miss = 0;
  }
  for (const e of W.enemies) {
    if (e.alive && !seen.has(e) && ++e.miss >= 3) { e.alive = false; e.dying = 0; if (e.blob) e.blob.visible = false; }
  }
  d.bl.forEach((v, i) => { const b = W.pushBlocks[i]; if (b) b.nt = v; });
  if (d.cd && W.candles) W.candles.netApply(d.cd);
  if (d.lv && W.levers) W.levers.netSet(d.lv[0], d.lv[1]);
  if (d.sm && W.simon && W.simon.state !== 'done') W.simon.solve();
}
// joiner: host-driven enemies, animated from the snapshot flags
function netPuppetEnemies(dt) {
  const rt = performance.now() - INTERP_MS;
  for (let i = W.enemies.length - 1; i >= 0; i--) {
    const e = W.enemies[i], m = e.model;
    if (!e.alive) {
      e.dying -= dt;
      if (e.deathKind === 'spin') { e.vy -= 30 * dt; e.pos.y += e.vy * dt; e.pos.x += e.kx * dt; e.pos.z += e.kz * dt; m.root.rotation.x += dt * 14; }
      m.root.position.copy(e.pos);
      if (!e.deathKind) m.root.visible = false;
      if (e.dying <= 0) { W.root.remove(m.root); if (e.blob) W.root.remove(e.blob); W.enemies.splice(i, 1); }
      continue;
    }
    e.t += dt;
    const s = e.snaps ? netSample(e.snaps, rt) : null;
    if (s) { e.pos.set(s.x, s.y, s.z); e.dir = s.f; }
    const a = e.na || 0, b = e.nb || 0;
    m.root.position.copy(e.pos);
    if (e.type !== 'turret') m.root.rotation.y = e.dir;
    if (e.type === 'walker') {
      const sp = a ? 16 : 9;
      m.body.rotation.z = Math.sin(e.t * sp) * 0.12;
      m.fL.position.z = 0.05 + Math.sin(e.t * sp) * 0.15; m.fR.position.z = 0.05 - Math.sin(e.t * sp) * 0.15;
    } else if (e.type === 'spiky') {
      m.body.position.y = Math.abs(Math.sin(e.t * 8)) * 0.1; m.body.rotation.z = Math.sin(e.t * 8) * 0.08;
    } else if (e.type === 'bee' || e.type === 'ghost') {
      if (e.type === 'bee') { m.wL.rotation.z = Math.sin(e.t * 50) * 0.6; m.wR.rotation.z = -Math.sin(e.t * 50) * 0.6; m.body.position.y = Math.sin(e.t * 5) * 0.08; }
      else {
        const shy = b & 1;
        e.alpha = a / 100; m.mat.opacity = e.alpha;
        m.armL.position.set(shy ? -0.2 : -0.62, shy ? 0.95 : 0.75 + Math.sin(e.t * 6) * 0.08, shy ? 0.55 : 0.15);
        m.armR.position.set(shy ? 0.2 : 0.62, shy ? 0.95 : 0.75 - Math.sin(e.t * 6) * 0.08, shy ? 0.55 : 0.15);
        m.tongue.visible = !!(b & 2);
        m.body.position.y = Math.sin(e.t * 2.2) * 0.12; m.body.rotation.z = Math.sin(e.t * 1.4) * 0.1;
      }
      const gt = groundTopAt(e.pos.x, e.pos.z, e.pos.y);
      if (gt > -Infinity) { e.blob.visible = true; e.blob.position.set(e.pos.x, gt + 0.03, e.pos.z); } else e.blob.visible = false;
    } else if (e.type === 'turret') {
      m.head.rotation.y = angleLerp(m.head.rotation.y, a, Math.min(1, dt * 10));
      m.head.scale.setScalar(b ? 1.1 : 1);
      m.eye.scale.setScalar(b ? 0.16 + Math.sin(e.t * 40) * 0.05 : 0.12);
      m.head.position.z = lerp(m.head.position.z, 0, dt * 6);
    } else if (e.type === 'snowman') {
      m.body.rotation.z = Math.sin(e.t * 2) * 0.04;
      m.armR.rotation.x = a ? -2.4 : lerp(m.armR.rotation.x, 0, dt * 4);
    } else if (e.type === 'penguin') {
      if (a === 0) { m.body.rotation.set(0, 0, Math.sin(e.t * 10) * 0.15); m.body.position.y = 0; m.fL.rotation.z = 0.4 + Math.sin(e.t * 10) * 0.3; m.fR.rotation.z = -0.4 - Math.sin(e.t * 10) * 0.3; }
      else if (a === 1) m.body.rotation.set(-0.3, 0, 0);
      else if (a === 2) { m.body.rotation.set(1.35, 0, 0); m.body.position.y = -0.25; m.fL.rotation.z = 1.4; m.fR.rotation.z = -1.4; }
      else { m.body.rotation.set(lerp(m.body.rotation.x, 0, dt * 6), 0, Math.sin(e.t * 20) * 0.1); m.body.position.y = 0; }
    } else if (e.type === 'robot') {
      const sparking = a === 1, tele = a === 2;
      if (sparking && !e.sparking) Snd.S.spark();
      e.sparking = sparking;
      e.stompable = e.spinnable = !sparking;
      if (!sparking) { m.wheelL.rotation.x += dt * 8; m.wheelR.rotation.x += dt * 8; }
      m.bulb.material.color.setHex(sparking ? 0x55ddff : tele ? (Math.floor(e.t * 12) % 2 ? 0xffffff : 0xff3355) : 0xff3355);
      m.spark.material.opacity = sparking ? 0.55 + Math.random() * 0.45 : 0;
      m.body.position.y = sparking ? (Math.random() - 0.5) * 0.06 : 0;
    }
    enemyContact(e);
  }
}

// ---------- items / coins ----------
function netItem(id) { for (const it of W.items) if (it.id === id) return it; return null; }
function netTouchItem(it) {
  if (it.netPending !== undefined && W.time - it.netPending < 1.5) return;
  if (NET.host) { netTake(it, NET.pid); return; }
  it.netPending = W.time; it.mesh.visible = false; // predicted pickup; the host confirms
  if (it.type === 'coin') { Snd.S.coin(); burst(it.x, it.mesh.position.y, it.z, 0xffe14a, 5, 3, 0.35, 4); }
  netSend({ t: 'take', id: it.id });
}
function netTake(it, by) { // host
  const idx = W.items.indexOf(it);
  if (idx < 0) return;
  W.items.splice(idx, 1); W.root.remove(it.mesh);
  let n = 0;
  if (it.type === 'coin') { NET.coins[by] = (NET.coins[by] || 0) + 1; n = NET.coins[by]; }
  netBroadcast({ t: 'took', id: it.id, by, n });
  netApplyTook(it, by, n);
}
function netApplyTook(it, by, n) {
  const me = by === NET.pid, y = it.mesh.position.y, predicted = it.netPending !== undefined;
  if (it.type === 'coin') { if (me) netMyCoin(n, it.x, y, it.z, predicted); else burst(it.x, y, it.z, 0xffe14a, 5, 3, 0.35, 4); }
  else if (it.type === 'star') {
    run.stars[it.idx] = true;
    const c = run.stars.filter(Boolean).length;
    Snd.S.star(); burst(it.x, y, it.z, 0xffe14a, 30, 8, 0.9); ringFx(it.x, y - 0.5, it.z, 0xffe14a, 4);
    showToast('<b>&#9733; GROK STAR!</b> ' + (me ? '' : netEsc(netName(by)) + ' found it! ') + c + ' / 3 found', 3);
    updateHUD(false, 'stars');
  } else if (it.type === 'tstar') {
    run.team[it.idx] = true;
    const c = run.team.filter(Boolean).length;
    Snd.S.star(); burst(it.x, y, it.z, 0x3ff0ff, 30, 8, 0.9); ringFx(it.x, y - 0.5, it.z, 0x3ff0ff, 4);
    showToast('<b>&#9733; TEAM STAR!</b> Teamwork! ' + c + ' / 2 team stars', 3.5);
  } else if (it.type === 'oneup') {
    if (me) { P.health = P.maxHealth; heartPop(); showToast('<b>1-UP!</b> Full health', 2); updateHUD(true); }
    burst(it.x, y, it.z, 0x3fd34a, 16, 5, 0.6);
  } else if (it.type === 'key') {
    P.hasKey = true; Snd.S.key(); burst(it.x, y, it.z, 0xffd23f, 24, 6, 0.8);
    showToast((me ? 'You got' : netEsc(netName(by)) + ' got') + ' the <b>KEY</b>! Find the locked door.', 3);
    updateHUD(true);
  }
}
function netMyCoin(n, x, y, z, quiet) {
  run.coins++; run.levelCoins = n;
  if (!quiet) { Snd.S.coin(); burst(x, y, z, 0xffe14a, 5, 3, 0.35, 4); }
  if (n % 10 === 0 && P.health < P.maxHealth && P.state !== 'dead') { P.health++; heartPop(); }
  updateHUD(false, 'coins');
}
function netCoin(x, y, z) { // collectCoin() in co-op: only the host counts
  if (!NET.host) return;
  const by = NET.credit || NET.pid;
  NET.coins[by] = (NET.coins[by] || 0) + 1;
  const n = NET.coins[by];
  netBroadcast({ t: 'coin', by, n, x: r2(x), y: r2(y), z: r2(z) });
  if (by === NET.pid) netMyCoin(n, x, y, z);
}

// ---------- goal ----------
function netReachGoal(goal) {
  NET.goalObj = goal;
  P.state = 'win'; P.stateT = 0; P.vel.set(0, 0, 0); P.invuln = 0;
  Snd.S.checkpoint(); burst(P.pos.x, P.pos.y + 2, P.pos.z, 0xffe14a, 24, 7, 0.9);
  if (NET.host) netReached(NET.pid); else { NET.reached.add(NET.pid); netSend({ t: 'goal' }); netGoalToast(); }
}
function netReached(pid) { // host
  if (!NET.reached.has(pid)) { NET.reached.add(pid); netBroadcast({ t: 'reach', pid }); netOnReach(pid); }
  netCheckClear();
}
function netOnReach(pid) {
  NET.reached.add(pid);
  if (pid !== NET.pid && P.state !== 'win') showToast('<b>' + netEsc(netName(pid)) + '</b> reached the flag! Head there too!', 4);
  else netGoalToast();
}
function netGoalToast() {
  if (P.state !== 'win' || NET.cleared) return;
  const wait = (room ? room.players() : []).filter((p) => !NET.reached.has(p.pid)).map((p) => netEsc(p.name));
  if (wait.length) showToast('<b>You made it!</b> Waiting for ' + wait.join(' &amp; ') + ' to reach the flag&hellip;', 60);
}
function netCheckClear() {
  if (!NET.host || NET.cleared || !NET.inLevel || mode !== 'playing' || !NET.reached.has(NET.pid)) return;
  const ids = room.players().map((p) => p.pid);
  if (!ids.every((id) => NET.reached.has(id))) return;
  const names = {};
  room.players().forEach((p) => { names[p.pid] = [p.name, p.color]; });
  const d = { t: 'clear', coins: Object.assign({}, NET.coins), stars: run.stars.slice(), team: run.team.slice(), names };
  netBroadcast(d);
  netClear(d);
}
function netClear(d) {
  if (NET.cleared) return;
  NET.cleared = true; NET.clearInfo = d;
  d.stars.forEach((s, i) => { if (s) run.stars[i] = true; });
  d.team.forEach((s, i) => { if (s) run.team[i] = true; });
  run.levelCoins = d.coins[NET.pid] || 0;
  W.goalDone = true;
  $('toast').classList.remove('show');
  winLevel(NET.goalObj || { position: P.pos.clone() });
}
function netCompleteRows(rows) {
  const d = NET.clearInfo;
  if (!d) return;
  rows.length = 0;
  for (const pid in d.names) {
    const nm = d.names[pid];
    rows.push(['<span class="mp-dot" style="background:' + netEsc(nm[1]) + '"></span>' + netEsc(nm[0]) + (pid === NET.pid ? ' (you)' : ''), (d.coins[pid] || 0) + ' coins']);
  }
  rows.push(['Stars found', run.stars.filter(Boolean).length + ' / 3']);
  rows.push(['Team stars', run.team.filter(Boolean).length + ' / 2']);
  rows.push(['Time', fmtTime(run.time)]);
  rows.push(['Your enemy bops', run.enemies]);
}
function netCompleteUI() {
  const host = !NET.on || NET.host;
  ['next-btn', 'replay-btn', 'complete-map-btn'].forEach((id) => $(id).classList.toggle('hidden', !host));
  $('complete-title-btn').textContent = !NET.on ? 'TITLE SCREEN' : NET.host ? 'BACK TO LOBBY' : 'LEAVE GAME';
  let note = $('mp-complete-note');
  if (!note) { note = document.createElement('p'); note.id = 'mp-complete-note'; note.className = 'mp-note'; $('complete-stats').after(note); }
  note.classList.toggle('hidden', host);
  if (!host) note.innerHTML = 'Waiting for <b>' + netEsc(netHostName()) + '</b> to pick what&rsquo;s next&hellip;';
}

// ---------- level flow ----------
function netAnnounceStart(i) { // host
  NET.gen++;
  room.setMeta({ game: 'land2', lvl: i, gen: NET.gen, easy: !!save.easy, playing: true });
  netBroadcast({ t: 'start', lvl: i, easy: !!save.easy });
}
function netStartFromHost(lvl, gen, easy) { // joiner
  if (gen === NET.gen && NET.inLevel && curLevel === lvl) return;
  NET.gen = gen;
  save.easy = !!easy;
  if (window.GrokNet) window.GrokNet.ui.hide();
  NET.applying = true;
  try { startLevel(lvl); } finally { NET.applying = false; }
}
function netLevelStarted() {
  NET.inLevel = true; NET.cleared = false; NET.clearInfo = null; NET.goalObj = null;
  NET.coins = {}; NET.reached = new Set(); NET.padsAcc = new Set(); NET.padsHost = new Set(); NET.pounds = new Set();
  if (NET.host) NET.log = [];
  NET.enemyMap = new Map(); for (const e of W.enemies) NET.enemyMap.set(e.id, e);
  run.team = [false, false];
  NET.soloHint = false;
  netCloseMenu();
  for (const R of NET.remotes.values()) { R.snaps.length = 0; R.last = null; R.head.active = false; }
}
function netWaitCard(title, msg) {
  NET.inLevel = false;
  mode = 'title';
  Snd.stopMusic();
  P.frozen = true;
  setPlayingUI(false);
  $('toast').classList.remove('show'); $('banner').classList.remove('show');
  $('mp-kicker').textContent = 'CO-OP \u00b7 ROOM ' + NET.code;
  $('mp-title').textContent = title;
  $('mp-msg').innerHTML = msg;
  $('mp-btns').innerHTML = '';
  netMenuBtn('LEAVE GAME', netLeave, true);
  netRoster();
  showCard('mp-card');
}
function netRoster() {
  const el = $('mp-roster');
  if (!el || !room) return;
  el.innerHTML = room.players().map((p) => '<div class="mp-pl"><span class="mp-dot" style="background:' + netEsc(p.color) + '"></span>' +
    netEsc(p.name) + (p.pid === NET.pid ? ' <small>(you)</small>' : '') + (p.host ? ' <small>HOST</small>' : '') + '</div>').join('');
}
function netMenuBtn(label, fn, alt) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'btn' + (alt ? '' : ' primary'); b.textContent = label;
  b.addEventListener('click', (e) => { Snd.init(); Snd.S.click(); e.currentTarget.blur(); fn(); });
  $('mp-btns').appendChild(b);
  return b;
}
function netToggleMenu() {
  if (mode !== 'playing') return;
  if (NET.menu) { netCloseMenu(); return; }
  NET.menu = true;
  $('mp-kicker').textContent = 'CO-OP \u00b7 ROOM ' + NET.code;
  $('mp-title').textContent = 'CO-OP MENU';
  $('mp-msg').innerHTML = 'The world keeps going while this menu is open.<br>Stars: <b>' + run.stars.filter(Boolean).length + ' / 3</b> &middot; Team stars: <b>' + run.team.filter(Boolean).length + ' / 2</b> &middot; Your coins: <b>' + run.levelCoins + '</b>';
  $('mp-btns').innerHTML = '';
  netMenuBtn('RESUME', netCloseMenu);
  if (NET.host) {
    netMenuBtn('RESTART WORLD', () => startLevel(curLevel), true);
    netMenuBtn('WORLD MAP', () => { goTitle(); openMap(curLevel); }, true);
    netMenuBtn('BACK TO LOBBY', netLobby, true);
  } else netMenuBtn('LEAVE GAME', netLeave, true);
  netRoster();
  showCard('mp-card');
}
function netCloseMenu() {
  if (!NET.menu) return;
  NET.menu = false;
  if (curCard === 'mp-card' && mode === 'playing') hideOverlay();
}
function netGoLobby() {
  const GN = window.GrokNet, me = room.me() || {};
  room.markNavigating();
  if (NET.prm && NET.prm.q && NET.prm.q.get('local')) { location.href = GN.soloUrl(); return; }
  location.href = GN.buildUrl(GN.hubUrl(), { mode: room.isHost ? 'host' : 'join', code: room.code, name: NET.prm.name, color: NET.prm.color, pid: room.pid, slot: me.slot });
}
function netLobby() {
  if (!NET.host) { netLeave(); return; }
  room.broadcast({ t: 'lobby' });
  setTimeout(netGoLobby, 250);
}
function netLeave() {
  const GN = window.GrokNet;
  try { if (room) room.leave(); } catch (e) { /* ignore */ }
  location.href = GN.hubUrl();
}
function netGoSolo() { // host left: keep playing this world alone
  NET.on = false; NET.menu = false;
  for (const pid of Array.from(NET.remotes.keys())) netDropRemote(pid);
  if (netBadge) { netBadge.remove(); netBadge = null; }
  document.body.classList.remove('mp');
  if (window.GrokNet) window.GrokNet.ui.hide();
  save.easy = NET.myEasy;
  P.maxHealth = save.easy ? 5 : 3; P.health = Math.min(P.health, P.maxHealth);
  for (const e of W.enemies) { if (e.snaps) e.snaps.length = 0; }
  if (NET.inLevel && mode === 'playing') { hideOverlay(); updateHUD(true); showToast('Playing solo now. The team spots open up for you.', 4); }
  else goTitle();
}

// ---------- messages ----------
function netMsg(d, from) {
  if (!d || typeof d !== 'object' || !NET.on) return;
  const t = d.t;
  if (t === 'p') { netOnPlayer(d, from); return; }
  if (t === 'start') { if (!NET.host) netStartFromHost(d.lvl, d.g, d.easy); return; }
  if (t === 'menu') { if (!NET.host) netWaitCard('HOST IS PICKING', 'Waiting for <b>' + netEsc(netHostName()) + '</b> to pick a world on the map&hellip;'); return; }
  if (t === 'lobby') { if (!NET.host) netGoLobby(); return; }
  if (t === 'log') { if (!NET.host && d.g === NET.gen) for (const ev of d.ev) netMsg(ev, ev.f || from); return; }
  if (d.g !== NET.gen || !NET.inLevel) return;
  if (NET.host) {
    switch (t) {
      case 'take': { const it = netItem(d.id); if (it) netTake(it, from); return; }
      case 'kill': { const e = NET.enemyMap.get(d.id); if (e && e.alive) { NET.credit = from; killEnemy(e, d.k); NET.credit = null; } return; }
      case 'bump': { const s = W.solids[d.k]; if (s && s.onBump && !s.used) { NET.credit = from; s.onBump(); NET.credit = null; } return; }
      case 'door': { const s = W.solids[d.k]; if (s && s.doOpen && !s.opening) { netBroadcast({ t: 'door', k: d.k }); s.doOpen(); } return; }
      case 'pound': NET.pounds.add(d.k); return;
      case 'goal': netReached(from); return;
      case 'blk': {
        const b = W.pushBlocks[d.i];
        if (!b || b.seated) return;
        if (boxFree(d.x, b.y + 0.02, d.z, b.hx - 0.03, b.hy - 0.03, b.hz - 0.03, b)) setSolidPos(b, d.x, b.y, d.z);
        if (d.sl && !b.slide) { b.slide = { axis: d.sl[0], dir: d.sl[1] }; Snd.S.slide(); }
        return;
      }
    }
  }
  NET.applying = true;
  try {
    switch (t) {
      case 'fall': { const s = W.solids[d.k]; if (s && s.onLand) s.onLand(); break; }
      case 'ici': { const ic = W.icicles[d.k]; if (ic) ic.trigger(); break; }
      case 'thw': { const s = W.solids[d.k]; if (s && s.trigger) s.trigger(); break; }
      case 'bop': if (d.to === NET.pid) { P.squash = 0.6; Snd.S.bump(); } break;
      case 'reach': if (!NET.host) netOnReach(d.pid); break;
      case 'w': if (!NET.host) netOnWorld(d); break;
      case 'qb': { const s = W.solids[d.k]; if (!NET.host && s && s.onBump && !s.used) { W.itemSeq = d.id; s.onBump(); } break; }
      case 'took': { const it = netItem(d.id); if (!NET.host && it) { W.items.splice(W.items.indexOf(it), 1); W.root.remove(it.mesh); netApplyTook(it, d.by, d.n); } break; }
      case 'coin': if (!NET.host && d.by === NET.pid) netMyCoin(d.n, d.x, d.y, d.z); break;
      case 'ekill': { const e = NET.enemyMap.get(d.id); if (!NET.host && e && e.alive) { NET.applyBy = d.by; killEnemy(e, d.k); } break; }
      case 'proj': if (!NET.host) fireProjectile(d.p[0], d.p[1], d.p[2], new V3(d.d[0], d.d[1], d.d[2]), d.s, d.k ? { kind: 'snow', grav: d.gr } : { grav: d.gr }); break;
      case 'press': { const sw = W.netSw[d.k]; if (!NET.host && sw) sw.press(W.pushBlocks[d.b]); break; }
      case 'door': { const s = W.solids[d.k]; if (!NET.host && s && s.doOpen) s.doOpen(); break; }
      case 'solve': if (!NET.host && W.simon) W.simon.solve(); break;
      case 'clear': if (!NET.host) netClear(d); break;
    }
  } finally { NET.applying = false; NET.applyBy = undefined; }
}

// ---------- boot ----------
function netLoadScript(src, ok, fail) {
  if (window.Peer) { ok(); return; }
  const s = document.createElement('script');
  s.src = src; s.onload = ok; s.onerror = fail;
  document.head.appendChild(s);
}
function netBoot() {
  const GN = window.GrokNet;
  if (!GN) return;
  const prm = GN.params();
  if (!prm) return;
  NET.on = true; NET.host = prm.mode === 'host'; NET.prm = prm; NET.pid = prm.pid; NET.code = prm.code;
  NET.myEasy = !!save.easy; NET.sendT = 0; NET.dj = 0; NET.prevFlip = 0; NET.log = []; NET.csBad = 0; NET.inLevel = false;
  NET.coins = {}; NET.reached = new Set(); NET.padsAcc = new Set(); NET.padsHost = new Set(); NET.pounds = new Set(); NET.enemyMap = new Map();
  let h = 7; for (const ch of prm.code) h = (h * 31 + ch.charCodeAt(0)) & 0xffff;
  NET.seed = h;
  run.team = [false, false];
  document.body.classList.add('mp');
  // my hero wears my lobby colour
  scene.remove(P.model.root);
  P.model = buildHero(colorNum(prm.color));
  scene.add(P.model.root);
  resetPlayerAt(P.pos.clone(), 0); P.frozen = true;
  $('title-card').classList.add('hidden');
  GN.ui.status(NET.host ? 'Opening co-op room\u2026' : 'Joining co-op room\u2026', 'Room code ' + prm.code);
  netLoadScript('peerjs.min.js', () => {
    room = GN.joinFromParams(prm, { max: 3 });
    room.on('open', () => {
      GN.ui.hide();
      if (!netBadge) netBadge = GN.ui.badge(room, { pos: 'tc', label: room.code });
      if (NET.host) {
        room.setMeta({ game: 'land2', playing: false, gen: NET.gen });
        if (!NET.inLevel) { mode = 'title'; openMap(); showToast('<b>You are the host.</b> Room code <b>' + netEsc(room.code) + '</b> (top of the screen): friends type it in ONLINE CO-OP. Then pick a world!', 8); }
      } else {
        const m = room._meta || {};
        if (m.playing && m.gen) netStartFromHost(m.lvl, m.gen, m.easy);
        else netWaitCard('HOST IS PICKING', 'Waiting for <b>' + netEsc(netHostName()) + '</b> to pick a world on the map&hellip;');
      }
    });
    room.on('meta', (m) => {
      if (NET.host || !m) return;
      if (m.playing && m.gen && m.gen !== NET.gen) netStartFromHost(m.lvl, m.gen, m.easy);
    });
    room.on('message', netMsg);
    room.on('players', (list) => {
      for (const p of list) { const R = NET.remotes.get(p.pid); if (R && (R.name !== p.name || R.color !== p.color)) { netDropRemote(p.pid); } }
      for (const pid of Array.from(NET.remotes.keys())) if (!list.some((p) => p.pid === pid)) netDropRemote(pid);
      if (curCard === 'mp-card') netRoster();
    });
    room.on('join', (p) => {
      if (p.pid === NET.pid) return;
      netNotice('<b>' + netEsc(p.name) + '</b> joined the game!', 3.5);
      if (NET.host && NET.inLevel && (mode === 'playing' || mode === 'complete')) {
        room.sendTo(p.pid, { t: 'start', lvl: curLevel, easy: !!save.easy, g: NET.gen });
        room.sendTo(p.pid, { t: 'log', g: NET.gen, ev: NET.log });
      }
    });
    room.on('leave', (p) => {
      if (p.pid === NET.pid) return;
      netDropRemote(p.pid);
      if (p.host) return; // handled by the hostleft error
      netNotice('<b>' + netEsc(p.name) + '</b> left the game.' + (netAlone() ? ' Team spots now work solo.' : ''), 6);
      if (NET.host) { NET.reached.delete(p.pid); netCheckClear(); }
      else netGoalToast();
    });
    room.on('reconnecting', () => netNotice('Connection to the host dropped &mdash; reconnecting&hellip;', 13));
    room.on('reconnected', () => netNotice('Reconnected!', 2.5));
    room.on('error', (err) => {
      if (err.code === 'hostleft' && NET.inLevel) {
        GN.ui.dialog({ title: 'Host left', message: netHostName() + ' left, so the co-op game ended. You can finish this world solo.', error: true, buttons: [
          { label: 'KEEP PLAYING SOLO', id: 'mp-solo-btn', action: netGoSolo },
          { label: 'BACK TO ARCADE', href: GN.hubUrl() }] });
      } else GN.ui.error(err);
      if (netBadge) netBadge.update();
    });
    room.start();
  }, () => GN.ui.error('nopeer'));
}
// ---- in-game ONLINE CO-OP (host a room or join with a 5-letter code; same GrokNet rooms as the Arcade lobby) ----
let onlineColor = '#3ff0ff';
function openOnline() {
  const GN = window.GrokNet;
  if (!GN) { showToast('Online play did not load. Check your internet.', 3); return; }
  const prof = GN.savedProfile();
  $('on-name').value = prof.hasName ? prof.name : '';
  onlineColor = prof.color || GN.COLORS[1];
  const sw = $('on-colors'); sw.innerHTML = '';
  GN.COLORS.forEach((c) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'swatch' + (c === onlineColor ? ' sel' : ''); b.style.background = c; b.setAttribute('aria-label', 'color ' + c);
    b.addEventListener('click', () => { onlineColor = c; Snd.S.click(); for (const x of sw.children) x.classList.toggle('sel', x === b); });
    sw.appendChild(b);
  });
  $('on-err').textContent = '';
  showCard('online-card');
}
function onlineGo(m) {
  const GN = window.GrokNet;
  const name = GN.cleanName($('on-name').value || 'Player');
  let code;
  if (m === 'host') code = GN.makeCode();
  else {
    code = GN.normalizeCode($('on-code').value || '');
    if (!GN.validCode(code)) { $('on-err').textContent = 'Type the 5-letter room code your friend sees at the top of their screen.'; return; }
  }
  GN.saveProfile(name, onlineColor);
  location.href = GN.buildUrl(GN.soloUrl(), { mode: m, code, name, color: onlineColor, pid: GN.pid(), n: 3 }, { local: 1 });
}
function netDebug() {
  return { on: NET.on, host: NET.host, gen: NET.gen, inLevel: NET.inLevel, pid: NET.pid, coins: Object.assign({}, NET.coins), reached: Array.from(NET.reached || []),
    remotes: Array.from(NET.remotes.values()).map((R) => ({ pid: R.pid, name: R.name, x: R.view.pos.x, y: R.view.pos.y, z: R.view.pos.z, vis: R.view.model.root.visible, head: R.head.active, st: R.last && R.last.s })),
    count: room ? room.count() : 0, team: run.team, cleared: NET.cleared, menu: NET.menu };
}

// ---------- co-op team zones (built only in co-op, next to each start island) ----------
const TEAM_ZONES = [
  { e: -10, s: 'grass', w: 'stone' }, { e: -7, s: 'grass', w: 'stone' }, { e: -7, s: 'castle', w: 'castle' },
  { e: -8, s: 'snow', w: 'ice' }, { e: -8, s: 'grave', w: 'manor' }, { e: -7, s: 'metal', w: 'brass' },
  { e: -7, s: 'sand', w: 'coral' }, { e: -7, s: 'sand', w: 'coral' }, { e: -7, s: 'reef', w: 'coral' },
  { e: -7, s: 'moon', w: 'hull' }, { e: -7, s: 'hull', w: 'neon' }, { e: -7, s: 'hull', w: 'neon' },
];
const holdTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#1e8fff'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = '#ffffff'; g.font = 'bold 36px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('HOLD', w / 2, h / 2 + 2);
});
function teamPlate(x, z, r) {
  const g = new THREE.Group();
  const frame = M(G.cyl, 0x1b1440, r + 0.15, 0.12, r + 0.15); frame.position.y = 0.06; g.add(frame);
  const top = new THREE.Mesh(G.cyl, mat(0xffffff, { map: holdTex, emissive: 0x0a2a55 }));
  top.scale.set(r, 0.14, r); top.position.y = 0.12; g.add(top);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0x3fa0ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.scale.setScalar(r * 4); glow.position.y = 0.6; g.add(glow);
  g.position.set(x, 0, z); W.root.add(g);
  return { top, glow };
}
function buildTeamZone(i) {
  const Z = LEVELS[i].tz;
  if (!Z) return;
  const cx = Z.e - 15, H = 6.5;
  addIsland(cx, 0, 0, 16, 14, Z.s, 3, { bare: true });
  addBox(Z.e - 3.5, 0, 0, 7.8, 2.8, 0.8, 'wood');
  // the vault: a little house whose door only opens while someone holds the blue plate
  const vx = cx - 4.2;
  addBox(vx - 2.1, H, 0, 0.6, 4.8, H, Z.w);
  addBox(vx, H, -2.1, 4.8, 0.6, H, Z.w);
  addBox(vx, H, 2.1, 4.8, 0.6, H, Z.w);
  addBox(vx + 2.1, H, -1.6, 0.6, 1.6, H, Z.w);
  addBox(vx + 2.1, H, 1.6, 0.6, 1.6, H, Z.w);
  addBox(vx + 2.1, H, 0, 0.6, 1.6, H - 3.4, Z.w);
  addBox(vx, H + 0.35, 0, 5.4, 5.4, 0.35, 'gold');
  const dg = new THREE.Group();
  const pane = new THREE.Mesh(G.box, new THREE.MeshBasicMaterial({ color: 0x3fd0ff, transparent: true, opacity: 0.45 }));
  pane.scale.set(0.2, 3.4, 1.6); dg.add(pane);
  for (const zz of [-0.55, 0, 0.55]) { const bar = M(G.box, 0x2fa8ff, 0.16, 3.4, 0.12); bar.position.z = zz; dg.add(bar); }
  const lock = M(G.sphereLo, 0xffe14a, 0.22); lock.position.set(0.15, 0, 0); dg.add(lock);
  dg.position.set(vx + 2.1, 1.7, 0); W.root.add(dg);
  const door = addSolid(vx + 2.1, 1.7, 0, 0.18, 1.7, 0.8, 'gate', dg);
  const plate = teamPlate(cx + 2.6, 4.4, 1.15);
  const inner = teamPlate(vx - 0.9, 1.0, 0.75);
  addItem('tstar', vx - 0.6, 1.5, -0.9, { idx: 0 });
  coinLine(vx - 1.2, 0.8, 1.2, vx + 0.6, 0.8, 1.2, 3);
  let k = 0, hold = 0, wasOpen = false;
  W.things.push({ update(dt) {
    const pOn = onPad(cx + 2.6, 0, 4.4, 1.15), iOn = onPad(vx - 0.9, 0, 1.0, 0.75), alone = netAlone();
    if (pOn || iOn || alone) hold = 0.6; else hold -= dt;
    let open = hold > 0;
    if (!open && k > 0) { // never shut on someone standing in the doorway
      const inDoor = (x, y, z) => Math.abs(x - door.x) < 0.75 && Math.abs(z) < 1.25 && y < 3.6 && y > -1;
      if (inDoor(P.pos.x, P.pos.y, P.pos.z)) open = true;
      for (const R of NET.remotes.values()) if (netRemoteLive(R) && inDoor(R.last.x, R.last.y, R.last.z)) open = true;
    }
    if (open && !wasOpen && !alone) Snd.S.door();
    wasOpen = open;
    const nk = clamp(k + (open ? dt * 2.8 : -dt * 2.2), 0, 1);
    if (nk !== k) { k = nk; setSolidPos(door, door.x, 1.7 - k * 3.45, door.z); }
    plate.top.position.y = pOn ? 0.06 : 0.12; plate.glow.material.opacity = pOn ? 0.8 : 0;
    inner.top.position.y = iOn ? 0.06 : 0.12; inner.glow.material.opacity = iOn ? 0.8 : 0;
    if (alone && !NET.soloHint && Math.abs(P.pos.x - cx) < 9 && Math.abs(P.pos.z) < 8 && mode === 'playing') {
      NET.soloHint = true;
      showToast('Playing solo: the vault door stays open and a <b>spring</b> appears by the tall pillar.', 5);
    }
  } });
  // tall pillar: stand on your partner's head (or bounce off it) to reach the top
  addBox(cx + 4.5, H, -3.6, 3, 3, H, Z.w);
  addItem('tstar', cx + 4.5, H + 1.3, -3.6, { idx: 1 });
  coinRing(cx + 4.5, H + 0.7, -3.6, 1.1, 4);
  const spring = addSpring(cx + 4.5, 0, -0.6);
  spring.active = false; spring.group.visible = false;
  W.things.push({ update() { const a = netAlone(); spring.active = a; spring.group.visible = a; } });
  addHint(cx + 6.8, 0, 3.2,
    '<b>TEAM ZONE!</b> One player stands on the blue <b>HOLD</b> plate so the vault door stays open for the other. ' +
    'For the tall pillar, land on your partner&rsquo;s <b>head</b> to stand on it, or hold <b>JUMP</b> as you land to bounce way up!',
    '<b>TEAM ZONE!</b> One player stands on the blue <b>HOLD</b> plate so the vault door opens for the other. ' +
    'Tall pillar: land on your partner&rsquo;s <b>head</b>, or keep holding <b>JUMP</b> as you land to bounce way up!', 3.4);
}

// =====================================================================
// Boot
// =====================================================================
P.model = buildHero();
scene.add(P.model.root);
P.blob = new THREE.Mesh(G.circle, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false }));
P.blob.renderOrder = 2;
scene.add(P.blob);
P.ring = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, depthWrite: false }));
P.ring.renderOrder = 3; P.ring.visible = false;
scene.add(P.ring);
mode = 'title';
loadLevel(0);
P.frozen = true;
setPlayingUI(false);
renderLevelSelect();
showCard('title-card');
updateHUD(true);
netBoot();
requestAnimationFrame(frame);

// debug/test hook (harmless in production)
window.__grok = {
  W, P, run, cam, startLevel, LEVELS, renderer, updateCamera, input, keys, touchState, save, openMap, setEasy, goTitle, NET, netDebug: () => netDebug(),
  get mode() { return mode; },
  get card() { return curCard; },
  get mapSel() { return mapSel; },
  setManual(v) { manualTick = !!v; },
  // advance the simulation deterministically (used by automated tests)
  sim(n, mv, press) {
    touchState.jx = mv ? mv[0] || 0 : 0; touchState.jy = mv ? mv[1] || 0 : 0;
    touchState.jump = !!(press && press.holdJump); touchState.action = false; touchState.boost = !!(press && press.boost);
    if (press && press.jump) input.jumpPressed = true;
    if (press && press.action) input.actionPressed = true;
    for (let i = 0; i < n; i++) {
      readInput(); worldTick(FIXED); input.jumpPressed = false; input.actionPressed = false;
      if (mode !== 'playing') break;
    }
    return { x: P.pos.x, y: P.pos.y, z: P.pos.z, g: P.grounded, st: P.state, hp: P.health, mode };
  },
  tp(x, y, z) { P.pos.set(x, y, z); P.vel.set(0, 0, 0); cam.target.set(x, y + 1.4, z); },
};
})();
