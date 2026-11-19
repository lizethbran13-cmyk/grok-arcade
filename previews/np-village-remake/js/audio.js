// Synth audio: squeaky SFX and a bouncy loop per room.
export const SND = { ctx: null, on: true, music: true };
export function initAudio() {
  if (SND.ctx) { if (SND.ctx.state === 'suspended') SND.ctx.resume(); return; }
  try { SND.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  const c = SND.ctx; SND.master = c.createGain(); SND.master.gain.value = SND.on ? 0.6 : 0; SND.master.connect(c.destination);
  SND.mus = c.createGain(); SND.mus.gain.value = SND.music ? 0.16 : 0; SND.mus.connect(SND.master); SND.sfx = c.createGain(); SND.sfx.gain.value = 0.8; SND.sfx.connect(SND.master);
}
export function setSound(on, music) { SND.on = on; SND.music = music; if (SND.master) SND.master.gain.value = on ? 0.6 : 0; if (SND.mus) SND.mus.gain.value = music ? 0.16 : 0; }
function tone(f, d, type = 'square', vol = 0.3, slide = 0, delay = 0, dest) { const c = SND.ctx; if (!c) return; const t = c.currentTime + delay; const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(dest || SND.sfx); o.start(t); o.stop(t + d + 0.02); }
function noise(d, vol = 0.3, f = 1200, delay = 0) { const c = SND.ctx; if (!c) return; const t = c.currentTime + delay; const n = (c.sampleRate * d) | 0, b = c.createBuffer(1, n, c.sampleRate), a = b.getChannelData(0); for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(); s.buffer = b; const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = f; const g = c.createGain(); g.gain.value = vol; s.connect(fl); fl.connect(g); g.connect(SND.sfx); s.start(t); }
export function sfx(name) {
  if (!SND.ctx || !SND.on) return;
  switch (name) {
    case 'jump': tone(520, 0.12, 'square', 0.12, 500); break;
    case 'jump2': tone(700, 0.14, 'square', 0.12, 700); tone(1000, 0.1, 'triangle', 0.08, 300, 0.05); break;
    case 'land': noise(0.08, 0.12, 500); break;
    case 'crumb': tone(1400 + Math.random() * 300, 0.05, 'square', 0.07); break;
    case 'cheese': [880, 1175, 1568].forEach((f, i) => tone(f, 0.1, 'square', 0.12, 0, i * 0.05)); break;
    case 'part': [660, 990, 1320, 1760].forEach((f, i) => tone(f, 0.12, 'triangle', 0.18, 0, i * 0.07)); break;
    case 'baby': [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(f, 0.14, 'triangle', 0.18, 0, i * 0.08)); tone(2400, 0.2, 'sine', 0.1, -600, 0.45); break;
    case 'heart': tone(660, 0.1, 'sine', 0.2, 300); tone(990, 0.15, 'sine', 0.15, 300, 0.08); break;
    case 'spin': noise(0.25, 0.15, 2500); tone(300, 0.25, 'triangle', 0.1, 400); break;
    case 'blast': tone(320, 0.12, 'square', 0.12, -150); noise(0.08, 0.12, 1800); break;
    case 'splat': noise(0.15, 0.2, 900); tone(200, 0.1, 'sine', 0.15, -80); break;
    case 'pop': tone(900, 0.06, 'square', 0.15, -500); noise(0.06, 0.15, 3000); break;
    case 'hurt': tone(500, 0.25, 'sawtooth', 0.15, -350); tone(1200, 0.08, 'square', 0.08); break;
    case 'squeak': tone(1800, 0.08, 'sine', 0.15, 600); tone(2200, 0.06, 'sine', 0.1, -400, 0.08); break;
    case 'bark': tone(260, 0.12, 'sawtooth', 0.22, -90); noise(0.1, 0.2, 700); tone(240, 0.12, 'sawtooth', 0.2, -90, 0.18); noise(0.1, 0.18, 700, 0.18); break;
    case 'bounce': tone(220, 0.25, 'sine', 0.25, 500); break;
    case 'hook': tone(1200, 0.25, 'sawtooth', 0.08, -900); break;
    case 'glide': tone(400, 0.25, 'triangle', 0.06, 200); break;
    case 'check': [523, 784, 1046].forEach((f, i) => tone(f, 0.15, 'triangle', 0.18, 0, i * 0.08)); break;
    case 'door': tone(160, 0.5, 'sawtooth', 0.12, 120); noise(0.4, 0.1, 400); break;
    case 'click': tone(900, 0.04, 'square', 0.1); break;
    case 'boss': [196, 233, 196, 175].forEach((f, i) => tone(f, 0.2, 'sawtooth', 0.15, 0, i * 0.18)); break;
    case 'bosshit': tone(150, 0.3, 'square', 0.2, -60); noise(0.25, 0.25, 1200); break;
    case 'win': [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, 0.18, 'square', 0.18, 0, i * 0.11)); break;
    case 'splash': noise(0.5, 0.25, 1500); tone(400, 0.3, 'sine', 0.1, -250); break;
    case 'buy': [784, 1046, 1318].forEach((f, i) => tone(f, 0.12, 'square', 0.14, 0, i * 0.07)); break;
    case 'deny': tone(200, 0.2, 'square', 0.12, -60); break;
    case 'honk': tone(330, 0.22, 'square', 0.16, -20); tone(415, 0.22, 'square', 0.12, -20); tone(330, 0.22, 'square', 0.16, -20, 0.28); tone(415, 0.22, 'square', 0.12, -20, 0.28); break;
    case 'ding': tone(1568, 0.5, 'sine', 0.22, 0, 0); tone(1175, 0.8, 'sine', 0.22, 0, 0.28); break;
    case 'sputter': for (let i = 0; i < 4; i++) { noise(0.07, 0.16, 300 + i * 80, i * 0.11); tone(90 + Math.random() * 40, 0.06, 'square', 0.08, -30, i * 0.11); } break;
    case 'bell': [1318, 1046, 1318, 1046].forEach((f, i) => tone(f, 0.35, 'triangle', 0.18, 0, i * 0.22)); break;
    case 'tune': [523, 659, 784, 659, 880, 784, 659, 523].forEach((f, i) => tone(f, 0.16, 'square', 0.12, 0, i * 0.14)); break;
    case 'hit': tone(700, 0.08, 'square', 0.12, -400); break;
  }
}
// music: simple bouncy sequencer
const SONGS = {
  town: { bpm: 108, lead: [76, 79, 84, 79, 81, 79, 76, 72, 74, 77, 81, 77, 79, 76, 74, 72], bass: [48, 48, 53, 53, 55, 55, 48, 48] },
  hq: { bpm: 112, lead: [72, 76, 79, 76, 74, 77, 81, 77, 72, 76, 79, 84, 83, 79, 76, 74], bass: [48, 48, 55, 55, 50, 50, 57, 57] },
  kitchen: { bpm: 128, lead: [76, 79, 81, 79, 76, 74, 72, 74, 76, 79, 83, 81, 79, 76, 74, 72], bass: [45, 45, 52, 52, 48, 48, 55, 55] },
  living: { bpm: 118, lead: [72, 74, 76, 79, 76, 74, 72, 67, 69, 72, 74, 76, 74, 72, 69, 67], bass: [48, 48, 53, 53, 45, 45, 50, 50] },
  vents: { bpm: 136, lead: [69, 72, 76, 72, 69, 72, 77, 76, 69, 72, 76, 79, 77, 76, 72, 69], bass: [45, 45, 45, 45, 41, 41, 43, 43] },
  garden: { bpm: 120, lead: [79, 76, 72, 76, 79, 81, 79, 76, 77, 74, 71, 74, 77, 79, 77, 74], bass: [48, 52, 55, 52, 50, 53, 57, 53] },
  garage: { bpm: 132, lead: [64, 67, 69, 71, 69, 67, 64, 62, 64, 67, 71, 74, 71, 69, 67, 64], bass: [40, 40, 43, 43, 45, 45, 43, 43] },
  toyroom: { bpm: 124, lead: [84, 79, 76, 79, 84, 86, 84, 79, 81, 77, 74, 77, 81, 83, 81, 77], bass: [48, 48, 53, 53, 55, 55, 48, 48] },
  attic: { bpm: 104, lead: [69, 72, 76, 74, 72, 71, 69, 64, 65, 69, 72, 71, 69, 68, 69, 71], bass: [45, 45, 41, 41, 43, 43, 40, 40] },
  boss: { bpm: 146, lead: [64, 64, 67, 64, 70, 69, 67, 64, 64, 64, 67, 64, 71, 70, 69, 67], bass: [40, 40, 40, 40, 43, 43, 42, 42] },
};
let musT = null, step = 0, cur = null;
const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
export function playMusic(id) {
  if (cur === id) return; cur = id; if (musT) clearInterval(musT); musT = null; if (!id || !SONGS[id]) return; const s = SONGS[id]; step = 0;
  musT = setInterval(() => { const c = SND.ctx; if (!c || !SND.music || document.hidden) return; const i = step++ % 16;
    tone(hz(s.lead[i]), 60 / s.bpm * 0.45, 'triangle', 0.18, 0, 0, SND.mus); if (i % 2 === 0) tone(hz(s.bass[(i / 2) | 0]), 60 / s.bpm * 0.8, 'square', 0.08, 0, 0, SND.mus);
    if (i % 4 === 0) noise(0.05, 0.08, 400); else if (i % 4 === 2) noise(0.04, 0.05, 6000);
  }, 60000 / s.bpm / 2);
}
