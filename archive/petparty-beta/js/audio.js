// Tiny WebAudio synth: host jingles (Ratita Industries, Tortuga Tech, Tortuga TV) + game sounds. No audio files to load.
let ac = null, master = null; export const A = { on: true };
function ctx() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = 0.35; master.connect(ac.destination); } catch (e) { return null; } } if (ac.state === 'suspended') ac.resume(); return ac; }
export function unlock() { ctx(); }
function tone(f, t0, d, type = 'square', v = 0.25, slide) { const c = ctx(); if (!c || !A.on) return; const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, c.currentTime + t0); if (slide) o.frequency.exponentialRampToValueAtTime(slide, c.currentTime + t0 + d);
  g.gain.setValueAtTime(0, c.currentTime + t0); g.gain.linearRampToValueAtTime(v, c.currentTime + t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t0 + d); o.connect(g); g.connect(master); o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + d + 0.02); }
const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
const seq = (notes, step = 0.12, type = 'square', v = 0.2) => notes.forEach((n, i) => n && tone(N(n), i * step, step * 0.95, type, v));
export const JINGLE = {
  show: () => { seq([72, 76, 79, 84, 0, 79, 84, 88], 0.11, 'square', 0.16); seq([48, 0, 55, 0, 52, 0, 60], 0.11, 'triangle', 0.25); },
  ratita: () => seq([79, 77, 76, 72, 0, 84], 0.1, 'sawtooth', 0.12), // "Ra-ti-ta In-dus-tries!"
  tortuga: () => { seq([60, 64, 67, 0, 67, 72], 0.16, 'triangle', 0.22); }, // slow and steady, shell-tough
  tv: () => seq([84, 0, 84, 79, 88], 0.09, 'sine', 0.2),
  guest: () => seq([67, 71, 74, 79, 74, 79, 83], 0.09, 'square', 0.14),
  win: () => { seq([72, 76, 79, 84, 79, 84, 88, 91], 0.12, 'square', 0.16); seq([48, 52, 55, 60, 55, 60, 64, 67], 0.12, 'triangle', 0.22); },
  final: () => { seq([60, 0, 60, 63, 67, 0, 72, 75, 79], 0.13, 'sawtooth', 0.12); seq([36, 0, 36, 0, 43, 0, 48], 0.13, 'triangle', 0.3); },
};
export function sfx(n) { switch (n) {
  case 'coin': tone(988, 0, 0.07, 'square', 0.12); tone(1319, 0.06, 0.12, 'square', 0.12); break;
  case 'gold': seq([84, 88, 91, 96], 0.06, 'square', 0.14); break;
  case 'jump': tone(300, 0, 0.18, 'square', 0.1, 700); break;
  case 'snap': case 'boom': tone(140, 0, 0.3, 'sawtooth', 0.3, 50); break;
  case 'splash': case 'goo': case 'sink': tone(500, 0, 0.35, 'sine', 0.2, 80); break;
  case 'hit': case 'bounce': tone(660, 0, 0.05, 'triangle', 0.25); break;
  case 'smash': tone(880, 0, 0.12, 'sawtooth', 0.2, 220); break;
  case 'bump': case 'dash': case 'steal': tone(220, 0, 0.12, 'square', 0.18, 440); break;
  case 'point': seq([76, 81], 0.08, 'square', 0.14); break;
  case 'buzz': tone(110, 0, 0.3, 'sawtooth', 0.15); break;
  case 'whoosh': tone(200, 0, 0.3, 'triangle', 0.15, 900); break;
  case 'pop': tone(500, 0, 0.06, 'sine', 0.12, 900); break;
  case 'warn': tone(1200, 0, 0.05, 'square', 0.06); break;
  case 'tick': tone(1000, 0, 0.04, 'square', 0.08); break;
  case 'go': tone(1500, 0, 0.25, 'square', 0.14); break;
} }
