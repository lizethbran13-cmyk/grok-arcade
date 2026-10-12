// Ratita Industries HQ: extra smooth 3D models (the bot cousins, Sweepy, Bitsy, test rigs). No flat cut-outs: screens are real screens.
import * as THREE from 'three';
import { P } from './geo.js?v=np6';
import { MB, toGroup } from './models.js?v=np6';
import { rcyl, lathe, torus, capsule, cone, cyl, tube, wedge, gear, star } from './shapes.js?v=np6';
const PI = Math.PI;
// ---------------------------------------------------------------- screen faces (canvas sized to the exact plane aspect)
function faceScreen(wpx, hpx, pw, ph) { const c = document.createElement('canvas'); c.width = wpx; c.height = hpx; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); return { c, g: c.getContext('2d'), tex, m }; }
// mood: idle|happy|talk|wow|sad|glitch|cool|wink ; mouth 0..1 (talking), blink bool
export function drawFace(kind, F, mood, mouth, blink, t) { const g = F.g, w = F.c.width, h = F.c.height; g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const col = kind === 'mimi' ? '#5ef2ff' : kind === 'lily' ? (mood === 'sad' ? '#fca5a5' : '#c4b5fd') : (mood === 'glitch' ? '#fb7185' : '#5eead4');
  g.fillStyle = kind === 'mimi' ? '#0b1020' : kind === 'lily' ? '#0f0726' : '#04201e'; g.fillRect(0, 0, w, h);
  g.strokeStyle = g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 12; g.lineCap = 'round'; g.lineWidth = h * 0.07;
  const ex = w * 0.3, ey = kind === 'lili' ? h * 0.45 : h * 0.42, er = Math.min(w, h) * (kind === 'lili' ? 0.2 : 0.13), my = kind === 'lili' ? h * 0.82 : h * 0.74;
  const eyes = (fn) => { fn(w / 2 - ex * 0.55 - (kind === 'lili' ? w * 0.06 : 0), ey); fn(w / 2 + ex * 0.55 + (kind === 'lili' ? w * 0.06 : 0), ey); };
  if (mood === 'glitch') { g.font = `bold ${h * 0.4}px monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((t * 7 | 0) % 2 ? 'x_x' : 'X_X', w / 2, h * 0.45); }
  else if (blink) eyes((x, y) => { g.beginPath(); g.moveTo(x - er, y); g.lineTo(x + er, y); g.stroke(); });
  else if (mood === 'happy' || mood === 'talk' && kind === 'mimi') eyes((x, y) => { g.beginPath(); g.arc(x, y + er * 0.4, er, PI * 1.1, PI * 1.9); g.stroke(); });
  else if (mood === 'cool') eyes((x, y) => { g.beginPath(); g.moveTo(x - er * 1.1, y); g.lineTo(x + er * 1.1, y); g.stroke(); g.lineWidth = h * 0.04; g.beginPath(); g.moveTo(x - er * 0.8, y + er * 0.45); g.lineTo(x + er * 0.8, y + er * 0.45); g.stroke(); g.lineWidth = h * 0.07; });
  else if (mood === 'wink') { g.beginPath(); g.arc(w / 2 - ex * 0.55, ey, er * 0.75, 0, 7); g.fill(); g.beginPath(); g.moveTo(w / 2 + ex * 0.55 - er, ey); g.lineTo(w / 2 + ex * 0.55 + er, ey); g.stroke(); }
  else if (mood === 'wow') eyes((x, y) => { g.beginPath(); g.arc(x, y, er * 1.15, 0, 7); g.stroke(); g.beginPath(); g.arc(x, y, er * 0.4, 0, 7); g.fill(); });
  else if (mood === 'sad') eyes((x, y) => { g.beginPath(); g.arc(x, y, er * 0.6, 0, 7); g.fill(); g.beginPath(); g.moveTo(x - er, y - er * 1.3 + (x < w / 2 ? er * 0.5 : 0)); g.lineTo(x + er, y - er * 1.3 + (x < w / 2 ? 0 : er * 0.5)); g.stroke(); });
  else if (kind === 'lili') eyes((x, y) => { g.fillRect(x - er, y - er * 0.8, er * 2, er * 1.6); });
  else eyes((x, y) => { g.beginPath(); g.ellipse(x, y, er * 0.8, er, 0, 0, 7); g.fill(); });
  if (mood !== 'glitch') { const o = Math.max(0, Math.min(1, mouth)); g.beginPath();
    if (o > 0.05) { g.ellipse(w / 2, my, w * 0.09 + o * w * 0.02, h * 0.04 + o * h * 0.09, 0, 0, 7); g.fill(); }
    else if (mood === 'sad') { g.arc(w / 2, my + h * 0.08, w * 0.1, PI * 1.15, PI * 1.85); g.stroke(); }
    else if (mood === 'cool') { g.moveTo(w / 2 - w * 0.08, my); g.lineTo(w / 2 + w * 0.09, my - h * 0.03); g.stroke(); }
    else { g.arc(w / 2, my - h * 0.08, w * 0.11, 0.25, PI - 0.25); g.stroke(); } }
  g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,.05)'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1); g.restore(); if (F.tex) F.tex.needsUpdate = true; }
// ---------------------------------------------------------------- MIMI (white round bot, pink trim, teal ears, antenna bulb)
export function makeMimi() { const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const b = MB();
  b.g.add(P.sphere, 0xf8fafc, 0, 0.95, 0, 0, 0, 0, 0.42, 0.48, 0.38); b.g.add(P.torus, 0xf472b6, 0, 0.72, 0, PI / 2, 0, 0, 0.4, 0.4, 0.17); b.l.add(P.torus, 0x5ef2ff, 0, 0.32, 0, PI / 2, 0, 0, 0.3, 0.3, 0.13, 0.6);
  b.g.add(P.sphere, 0xfde68a, 0.18, 1.08, 0.33, 0, 0.3, 0, 0.11, 0.11, 0.03); b.g.add(P.sphere, 0xa16207, 0.18, 1.07, 0.355, 0, 0.3, 0, 0.05, 0.05, 0.02);
  body.add(toGroup(b));
  const head = new THREE.Group(); head.position.set(0, 1.62, 0); body.add(head); const h = MB();
  h.g.add(P.sphere, 0xf8fafc, 0, 0, 0, 0, 0, 0, 0.45, 0.34, 0.36); h.g.add(P.sphere, 0x0b1020, 0, 0, 0.12, 0, 0, 0, 0.38, 0.27, 0.26);
  [-1, 1].forEach((s) => h.g.add(P.cyl, 0x5eead4, s * 0.45, 0.02, 0, 0, 0, PI / 2, 0.1, 0.08, 0.1)); h.x.add(P.cyl, 0x9ca3af, 0, 0.42, 0, 0, 0, 0, 0.015, 0.25, 0.015); h.l.add(P.sphere, 0x5ef2ff, 0, 0.57, 0, 0, 0, 0, 0.06, 0.06, 0.06, 0.8);
  head.add(toGroup(h)); const F = faceScreen(256, 160, 0.48, 0.3); F.m.position.set(0, 0, 0.385); head.add(F.m);
  const arms = [-1, 1].map((s) => { const a = new THREE.Group(); a.position.set(s * 0.44, 1.12, 0); a.rotation.z = s * 0.3; const ab = MB(); ab.g.add(P.capsule, 0xf8fafc, 0, -0.2, 0, 0, 0, 0, 0.14, 0.2, 0.14); ab.g.add(P.sphere, 0xf472b6, 0, -0.42, 0, 0, 0, 0, 0.09); a.add(toGroup(ab)); body.add(a); return a; });
  return { root, body, head, arms, F, kind: 'mimi', t: 0, h: 2.2 }; }
// ---------------------------------------------------------------- LILY (tall lavender bot, square CRT head, lab coat, clock antenna)
export function makeLily() { const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const b = MB(); const lav = 0xb9a3ff, sil = 0xcfd8e6, coat = 0xf8fafc, dk = 0x2e1065;
  [-1, 1].forEach((s) => { b.x.add(P.cyl, sil, s * 0.13, 0.36, 0, 0, 0, 0, 0.05, 0.62, 0.05); b.g.add(P.sphere, dk, s * 0.13, 0.06, 0.04, 0, 0, 0, 0.11, 0.07, 0.15); b.x.add(P.cyl, sil, s * 0.13, 0.15, 0.01, 0, 0, 0, 0.085, 0.22, 0.085); });
  b.g.add(P.capsule, lav, 0, 1.06, 0, 0, 0, 0, 0.48, 0.42, 0.36); b.f.add(lathe([[0.38, 0], [0.33, 0.5], [0.29, 0.95], [0, 0.95]], 32, 'lilyCoat'), coat, 0, 0.45, 0); b.g.add(P.cyl, 0x7c3aed, 0, 1.38, 0, 0, 0, 0, 0.27, 0.05, 0.27);
  [-1, 1].forEach((s) => { b.f.add(P.rboxS, coat, s * 0.1, 1.25, 0.24, 0, 0, s * -0.3, 0.1, 0.36, 0.02); b.g.add(P.cone, 0x7c3aed, s * 0.04, 1.37, 0.26, 0, 0, s * PI / 2, 0.05, 0.08, 0.04); b.x.add(P.sphere, sil, s * 0.3, 1.36, 0, 0, 0, 0, 0.14, 0.1, 0.12); });
  b.l.add(P.sphere, 0xf0abfc, 0, 1.2, 0.27, 0, 0, 0, 0.08, 0.08, 0.02, 0.5); b.g.add(P.cyl, 0x4c1d95, 0, 0.82, 0, 0, 0, 0, 0.3, 0.06, 0.3);
  body.add(toGroup(b)); const head = new THREE.Group(); head.position.set(0, 1.72, 0); body.add(head); const h = MB();
  h.g.add(P.rbox, lav, 0, 0, 0, 0, 0, 0, 0.62, 0.48, 0.42); h.g.add(P.rboxS, dk, 0, 0, 0.2, 0, 0, 0, 0.56, 0.42, 0.04); [-1, 1].forEach((s) => { h.x.add(P.cyl, sil, s * 0.34, 0.02, 0, 0, 0, PI / 2, 0.07, 0.06, 0.07); h.g.add(P.rboxS, 0x7c3aed, s * 0.33, 0.2, -0.08, -0.5, 0, s * -0.25, 0.04, 0.22, 0.26); });
  h.x.add(P.cyl, sil, 0.12, 0.38, 0, 0, 0, -0.25, 0.012, 0.28, 0.012); h.g.add(P.cyl, 0xfef3c7, 0.19, 0.53, 0, PI / 2, 0, 0, 0.07, 0.025, 0.07); h.x.add(P.torus, 0xd4a017, 0.19, 0.53, 0.0, 0, 0, 0, 0.07, 0.07, 0.07);
  head.add(toGroup(h)); const F = faceScreen(256, 184, 0.5, 0.36); F.m.position.set(0, 0, 0.225); head.add(F.m);
  const arms = [-1, 1].map((s) => { const a = new THREE.Group(); a.position.set(s * 0.32, 1.32, 0); a.rotation.z = s * 0.15; const ab = MB(); ab.f.add(P.capsule, coat, 0, -0.2, 0, 0, 0, 0, 0.11, 0.2, 0.11); ab.x.add(P.sphere, sil, 0, -0.44, 0, 0, 0, 0, 0.07); a.add(toGroup(ab)); body.add(a); return a; });
  return { root, body, head, arms, F, kind: 'lily', t: 0, h: 2.4 }; }
// ---------------------------------------------------------------- LILI (mint hover-bot, coral trim, visor face, three mouse-ear antennas)
export function makeLili() { const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const b = MB(); const mint = 0x5eead4, coral = 0xfb7185, sil = 0xcfd8e6;
  b.g.add(P.sphere, mint, 0, 0.88, 0, 0, 0, 0, 0.38, 0.4, 0.35); b.g.add(P.torus, coral, 0, 0.8, 0, PI / 2, 0, 0, 0.385, 0.385, 0.1); b.x.add(P.cone, sil, 0, 0.42, 0, PI, 0, 0, 0.16, 0.3, 0.16);
  b.g.add(P.sphere, 0xecfeff, 0, 0.86, 0.33, 0, 0, 0, 0.14, 0.14, 0.03); b.l.add(P.sphere, 0x99f6e4, 0, 0.22, 0, PI, 0, 0, 0.1, 0.14, 0.1, 0.6);
  body.add(toGroup(b)); const head = new THREE.Group(); head.position.set(0, 1.42, 0); body.add(head); const h = MB();
  h.g.add(P.sphere, mint, 0, 0, 0, 0, 0, 0, 0.33, 0.28, 0.3); h.g.add(P.cyl, 0x111827, 0, 0.02, 0, 0, 0, 0, 0.33, 0.2, 0.31); h.x.add(P.cyl, sil, 0, -0.28, 0, 0, 0, 0, 0.12, 0.08, 0.12);
  [-1, 1].forEach((s) => h.g.add(P.cyl, coral, s * 0.34, 0.02, 0, 0, 0, PI / 2, 0.06, 0.05, 0.06));
  [[0x9ca3af, -0.17], [0xd6a26b, 0], [0xffffff, 0.17]].forEach(([c, x], i) => { h.x.add(P.cyl, sil, x, 0.32 + (i === 1 ? 0.04 : 0), -0.02, 0, 0, -x * 1.2, 0.012, 0.16, 0.012); h.g.add(P.cyl, c, x * 1.25, 0.42 + (i === 1 ? 0.05 : 0), -0.02, PI / 2, 0, 0, 0.075, 0.025, 0.075); h.g.add(P.cyl, 0xfbcfe8, x * 1.25, 0.42 + (i === 1 ? 0.05 : 0), -0.004, PI / 2, 0, 0, 0.045, 0.028, 0.045); });
  head.add(toGroup(h)); const F = faceScreen(256, 96, 0.42, 0.1575); F.m.position.set(0, 0.02, 0.322); head.add(F.m);
  const arms = [-1, 1].map((s) => { const a = new THREE.Group(); a.position.set(s * 0.38, 1.0, 0); a.rotation.z = s * 0.35; const ab = MB(); ab.x.add(P.cyl, sil, 0, -0.18, 0, 0, 0, 0, 0.025, 0.36, 0.025); ab.g.add(P.sphere, coral, 0, -0.38, 0, 0, 0, 0, 0.05); a.add(toGroup(ab)); body.add(a); return a; });
  return { root, body, head, arms, F, kind: 'lili', t: 0, h: 2.0, hover: true }; }
export function animBot(B, dt, talking, mood) { B.t += dt; const t = B.t; const blink = (t % 3.7) < 0.12;
  B.body.position.y = B.hover ? 0.1 + Math.sin(t * 2) * 0.05 : Math.sin(t * 2) * 0.015; B.head.rotation.z = Math.sin(t * 1.3) * 0.06 + (talking ? Math.sin(t * 9) * 0.03 : 0); B.head.rotation.x = talking ? Math.sin(t * 7) * 0.04 : 0;
  B.arms.forEach((a, i) => { a.rotation.x = talking ? Math.sin(t * 5 + i * 2) * 0.4 : Math.sin(t * 1.5 + i) * 0.06; });
  if ((B._ft = (B._ft || 0) - dt) <= 0) { B._ft = 1 / 15; drawFace(B.kind, B.F, mood, talking ? Math.abs(Math.sin(t * 13)) * 0.8 + 0.1 : 0, blink && mood !== 'glitch', t); } }
// ---------------------------------------------------------------- SWEEPY the robo-vac (cute, a little guilty)
export function makeSweepy() { const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const b = MB();
  b.g.add(rcyl(0.75, 0.32, 0.12, 36), 0xf1f5f9, 0, 0.06, 0); b.g.add(rcyl(0.62, 0.08, 0.04, 36), 0xff4fa0, 0, 0.38, 0); b.l.add(P.torus, 0x22d3ee, 0, 0.24, 0, PI / 2, 0, 0, 0.74, 0.74, 0.18, 0.5);
  b.g.add(P.sphere, 0x0f172a, 0, 0.42, 0.3, 0, 0, 0, 0.36, 0.14, 0.26); [-1, 1].forEach((s) => { b.g.add(P.sphere, 0xffffff, s * 0.13, 0.5, 0.48, 0, 0, 0, 0.09, 0.11, 0.05); b.g.add(P.sphere, 0x111827, s * 0.13, 0.5, 0.52, 0, 0, 0, 0.05, 0.065, 0.03); b.l.add(P.sphere, 0xffffff, s * 0.13 + 0.03, 0.54, 0.54, 0, 0, 0, 0.018, 0.018, 0.01, 0.5); });
  b.g.add(P.cyl, 0x111827, 0, 0.06, 0, 0, 0, 0, 0.8, 0.06, 0.8); b.x.add(P.cyl, 0x9ca3af, 0, 0.55, -0.2, 0, 0, 0, 0.012, 0.3, 0.012); b.l.add(P.sphere, 0xffd23f, 0, 0.72, -0.2, 0, 0, 0, 0.05, 0.05, 0.05, 0.8);
  body.add(toGroup(b)); const brushes = [-1, 1].map((s) => { const k = MB(); for (let i = 0; i < 3; i++) k.m.add(P.cyl, 0xfbbf24, Math.cos(i * 2.1) * 0.12, 0, Math.sin(i * 2.1) * 0.12, PI / 2, -i * 2.1, 0, 0.015, 0.26, 0.015); const g = toGroup(k); g.position.set(s * 0.5, 0.05, 0.5); body.add(g); return g; });
  const stars = (() => { const k = MB(); for (let i = 0; i < 3; i++) k.l.add(star(), 0xffe14d, Math.cos(i * 2.1) * 0.35, 0, Math.sin(i * 2.1) * 0.35, 0, 0, 0, 0.09, 0.09, 0.09, 0.6); return toGroup(k, false); })(); stars.position.y = 0.95; stars.visible = false; body.add(stars);
  const gouda = (() => { const k = MB(); k.x.add(wedge(), 0xffc400, 0, 0, 0, 0, 0, 0, 0.7); return toGroup(k); })(); gouda.position.set(0, 0.55, -0.1); gouda.visible = false; body.add(gouda);
  return { root, body, brushes, stars, gouda, t: 0 }; }
export function animSweepy(S, dt, speed, dizzy) { S.t += dt; S.brushes.forEach((b, i) => b.rotation.y = S.t * (dizzy ? 2 : 18) * (i ? 1 : -1)); S.body.position.y = Math.abs(Math.sin(S.t * 14)) * 0.02 * Math.min(1, speed);
  S.stars.visible = !!dizzy; if (dizzy) { S.stars.rotation.y = S.t * 5; S.body.rotation.z = Math.sin(S.t * 6) * 0.12; } else S.body.rotation.z = 0; }
// ---------------------------------------------------------------- BITSY (tiny follower bot you assemble)
export function makeBitsy() { const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const b = MB();
  b.m.add(P.torus, 0x1f2937, 0, 0.16, 0, 0, PI / 2, 0, 0.13, 0.13, 0.2); b.x.add(P.cyl, 0xd1d5db, 0, 0.16, 0, 0, 0, PI / 2, 0.08, 0.1, 0.08); b.x.add(P.cyl, 0x9ca3af, 0, 0.32, 0, 0, 0, 0, 0.04, 0.2, 0.04);
  b.g.add(P.sphere, 0xffd23f, 0, 0.55, 0, 0, 0, 0, 0.22, 0.2, 0.2); b.g.add(P.sphere, 0x0f172a, 0, 0.56, 0.1, 0, 0, 0, 0.17, 0.12, 0.12); [-1, 1].forEach((s) => b.l.add(P.sphere, 0x3ff0ff, s * 0.06, 0.57, 0.21, 0, 0, 0, 0.035, 0.045, 0.02, 0.8));
  b.x.add(P.cyl, 0x9ca3af, 0, 0.8, 0, 0, 0, 0, 0.01, 0.14, 0.01); b.l.add(P.sphere, 0xff4fa0, 0, 0.88, 0, 0, 0, 0, 0.035, 0.035, 0.035, 0.8); [-1, 1].forEach((s) => b.g.add(P.capsule, 0xff4fa0, s * 0.22, 0.5, 0, 0, 0, s * 0.4, 0.06, 0.14, 0.06));
  body.add(toGroup(b)); return { root, body, t: 0 }; }
// ---------------------------------------------------------------- test rigs
export function makeWalker() { // "Clanky Jr." test robot for the obstacle course
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const b = MB();
  b.g.add(P.rbox, 0x60a5fa, 0, 1.55, 0, 0, 0, 0, 1.0, 0.9, 0.7); b.g.add(P.rboxS, 0xffd23f, 0, 1.6, 0.36, 0, 0, 0, 0.5, 0.35, 0.04); [0, 1, 2].forEach((i) => b.l.add(P.sphere, [0xef4444, 0x22c55e, 0x3b82f6][i], -0.15 + i * 0.15, 1.6, 0.39, 0, 0, 0, 0.04, 0.04, 0.02, 0.6));
  b.x.add(P.cyl, 0x9ca3af, 0, 2.05, 0, 0, 0, 0, 0.12, 0.15, 0.12); body.add(toGroup(b));
  const head = new THREE.Group(); head.position.set(0, 2.35, 0); body.add(head); { const h = MB(); h.g.add(P.rbox, 0x93c5fd, 0, 0, 0, 0, 0, 0, 0.7, 0.45, 0.5); [-1, 1].forEach((s) => { h.g.add(P.sphere, 0xffffff, s * 0.16, 0.03, 0.24, 0, 0, 0, 0.11, 0.11, 0.05); h.g.add(P.sphere, 0x111827, s * 0.16, 0.03, 0.28, 0, 0, 0, 0.06, 0.06, 0.03); }); h.x.add(P.cyl, 0x9ca3af, 0, 0.3, 0, 0, 0, 0, 0.015, 0.2, 0.015); h.l.add(P.sphere, 0xff4fa0, 0, 0.42, 0, 0, 0, 0, 0.06, 0.06, 0.06, 0.8); head.add(toGroup(h)); }
  const legs = [-1, 1].map((s) => { const l = new THREE.Group(); l.position.set(s * 0.28, 1.1, 0); const k = MB(); k.x.add(P.cyl, 0x9ca3af, 0, -0.45, 0, 0, 0, 0, 0.08, 0.9, 0.08); k.g.add(P.rbox, 0x1e3a8a, 0, -0.98, 0.08, 0, 0, 0, 0.32, 0.16, 0.5); l.add(toGroup(k)); body.add(l); return l; });
  const arms = [-1, 1].map((s) => { const a = new THREE.Group(); a.position.set(s * 0.6, 1.85, 0); const k = MB(); k.x.add(P.cyl, 0x9ca3af, 0, -0.35, 0, 0, 0, 0, 0.06, 0.7, 0.06); k.x.add(P.torus, 0xd1d5db, 0, -0.75, 0, 0, PI / 2, 0, 0.12, 0.12, 0.2); a.add(toGroup(k)); body.add(a); return a; });
  return { root, body, head, legs, arms, t: 0 }; }
export function makeRocket() { const root = new THREE.Group(); const b = MB();
  b.g.add(lathe([[0, 0], [0.42, 0.05], [0.5, 0.6], [0.5, 2.0], [0.42, 2.6], [0.22, 3.1], [0, 3.35]], 36, 'rkt'), 0xf8fafc, 0, 0, 0); b.g.add(P.cyl, 0xff4fa0, 0, 2.15, 0, 0, 0, 0, 0.505, 0.35, 0.505); b.g.add(P.cyl, 0xff4fa0, 0, 0.75, 0, 0, 0, 0, 0.505, 0.2, 0.505);
  for (let i = 0; i < 4; i++) { const a = i * PI / 2; b.g.add(P.rbox, 0xffd23f, Math.sin(a) * 0.62, 0.45, Math.cos(a) * 0.62, 0, a, 0, 0.06, 0.8, 0.4); }
  b.x.add(P.torus, 0xd1d5db, 0, 1.55, 0.45, 0, 0, 0, 0.16, 0.16, 0.2); b.e.add(P.sphere, 0xbfe9ff, 0, 1.55, 0.48, 0, 0, 0, 0.14, 0.14, 0.05); b.f.add(P.sphere, 0xa9afbd, 0, 1.52, 0.4, 0, 0, 0, 0.1, 0.09, 0.08); b.x.add(lathe([[0.25, 0], [0.32, -0.3], [0.2, -0.3]], 24, 'noz'), 0x6b7280, 0, 0.02, 0);
  root.add(toGroup(b));
  const flame = (() => { const k = MB(); k.l.add(P.cone, 0xffd23f, 0, -0.55, 0, PI, 0, 0, 0.26, 0.9, 0.26, 1.2); k.l.add(P.cone, 0xff7a1a, 0, -0.8, 0, PI, 0, 0, 0.18, 1.0, 0.18, 1.0); return toGroup(k, false); })(); root.add(flame); flame.visible = false;
  const chute = (() => { const k = MB(); k.f.addFn(lathe([[0.02, 1.2], [0.9, 1.05], [1.5, 0.6], [1.7, 0.2], [0, 1.25]], 24, 'chute'), (c, x, y, z) => c.set(Math.sin(Math.atan2(z, x) * 4) > 0 ? 0xffd23f : 0xff4fa0), 0, 0, 0); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; k.m.add(P.cyl, 0xffffff, Math.cos(a) * 0.85, -0.6, Math.sin(a) * 0.85, Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55, 0.01, 1.9, 0.01); } return toGroup(k); })(); chute.position.y = 4.4; chute.visible = false; root.add(chute);
  return { root, flame, chute }; }
export function makeCatapult() { const root = new THREE.Group(); const b = MB();
  b.m.add(P.rbox, 0x8b5a2b, 0, 0.3, 0, 0, 0, 0, 2.6, 0.5, 1.8); [-1, 1].forEach((s) => { b.m.add(P.rbox, 0x7a4b22, s * 0.7, 1.1, 0, 0, 0, 0, 0.25, 1.6, 0.3); b.m.add(P.torus, 0x3f2a16, s * 1.2, 0.3, 0.9, 0, PI / 2, 0, 0.38, 0.38, 0.4); b.m.add(P.torus, 0x3f2a16, s * 1.2, 0.3, -0.9, 0, PI / 2, 0, 0.38, 0.38, 0.4); });
  b.x.add(P.cyl, 0x9ca3af, 0, 1.85, 0, 0, 0, PI / 2, 0.09, 1.6, 0.09); b.g.add(P.rbox, 0xff4fa0, 0, 0.7, 0, 0, 0, 0, 0.6, 0.3, 0.6); root.add(toGroup(b));
  const arm = new THREE.Group(); arm.position.set(0, 1.85, 0); { const k = MB(); k.m.add(P.rbox, 0xb07a45, 0, 0, -1.2, 0, 0, 0, 0.22, 0.2, 2.8); k.m.add(lathe([[0, 0], [0.5, 0.05], [0.55, 0.3], [0.5, 0.32], [0.45, 0.1], [0, 0.1]], 24, 'cup'), 0x8b5a2b, 0, 0.05, -2.5); arm.add(toGroup(k)); } root.add(arm); arm.rotation.x = 0.5;
  return { root, arm }; }
export function cheeseWheel() { const k = MB(); k.g.add(rcyl(0.6, 0.45, 0.12, 32), 0xffc93c, 0, -0.22, 0); for (let i = 0; i < 5; i++) { const a = i * 1.3; k.m.add(P.sphere, 0xe0a420, Math.cos(a) * 0.4, 0.23, Math.sin(a) * 0.4, 0, 0, 0, 0.08, 0.02, 0.08); } k.m.add(P.cyl, 0xe9b030, 0, 0, 0, 0, 0, 0, 0.605, 0.12, 0.605); return toGroup(k); }
export function gooBall(col) { const k = MB(); k.g.add(P.sphere, col, 0, 0, 0, 0, 0, 0, 0.45); k.l.add(P.sphere, 0xffffff, 0.15, 0.18, 0.3, 0, 0, 0, 0.08, 0.06, 0.04, 0.3); [-1, 1].forEach((s) => k.g.add(P.sphere, 0x111827, s * 0.13, 0.08, 0.38, 0, 0, 0, 0.05, 0.07, 0.03)); return toGroup(k); }
export function makeCannon() { const root = new THREE.Group(); const b = MB(); b.x.add(rcyl(0.9, 0.5, 0.1, 28), 0x475569, 0, 0, 0); b.g.add(P.rbox, 0x22c55e, 0, 0.8, 0, 0, 0, 0, 1.2, 0.7, 1.2); root.add(toGroup(b));
  const barrel = new THREE.Group(); barrel.position.y = 1.3; { const k = MB(); k.g.add(P.cyl, 0x16a34a, 0, 0, 0.6, PI / 2, 0, 0, 0.38, 1.8, 0.38); k.x.add(P.torus, 0xd1d5db, 0, 0, 1.5, 0, 0, 0, 0.4, 0.4, 0.4); k.e.add(P.sphere, 0x86efac, 0, 0.35, -0.2, 0, 0, 0, 0.35, 0.35, 0.35); k.l.add(P.sphere, 0x4ade80, 0, 0.35, -0.2, 0, 0, 0, 0.22, 0.22, 0.22, 0.4); barrel.add(toGroup(k)); } root.add(barrel); barrel.rotation.x = -0.5;
  return { root, barrel }; }
export function makeFizz() { const root = new THREE.Group(); const b = MB(); b.e.add(lathe([[0, 0], [0.7, 0.05], [0.75, 1.6], [0.35, 2.4], [0.25, 2.9], [0, 2.9]], 32, 'fizzB'), 0xa7f3d0, 0, 0, 0); b.g.add(lathe([[0, 0.05], [0.66, 0.08], [0.7, 1.5], [0, 1.5]], 28, 'fizzL'), 0xf97316, 0, 0, 0);
  b.g.add(P.cyl, 0xef4444, 0, 2.95, 0, 0, 0, 0, 0.27, 0.15, 0.27); b.g.add(P.cyl, 0xffffff, 0, 1.0, 0, 0, 0, 0, 0.76, 0.5, 0.76); root.add(toGroup(b)); return { root }; }
export { faceScreen };
// ---------------------------------------------------------------- Ruffsources dogs: small, compact, clearly-different breeds
// schnauzer (Candy): salt-and-pepper, boxy muzzle, silver beard + moustache, bushy white brows, folded ears, docked perky tail
// corgi (Biscuit): ginger + white, long low body, tall pointy ears, fluffy rump.  beagle (Pepper): tri-colour, long floppy ears
export function makeDog(breed = 'schnauzer') { const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const B = { schnauzer: { fur: 0x8a9099, dark: 0x4b5058, light: 0xe8eaee, legH: 0.42, len: 0.5, hy: 0.98 }, corgi: { fur: 0xe8924a, dark: 0xc96f2a, light: 0xfffaf2, legH: 0.24, len: 0.62, hy: 0.78 },
    beagle: { fur: 0xb8763a, dark: 0x2b2b30, light: 0xfffaf2, legH: 0.4, len: 0.52, hy: 0.95 } }[breed];
  const { fur, dark, light, legH, len } = B, by = legH + 0.22;
  const t = MB(); t.f.add(P.sphere, breed === 'beagle' ? light : fur, 0, by, 0, 0, 0, 0, 0.3, 0.27, len); t.f.add(P.sphere, light, 0, by - 0.06, len * 0.55, 0, 0, 0, 0.24, 0.24, 0.24);
  if (breed !== 'corgi') t.f.add(P.sphere, dark, 0, by + 0.08, -0.04, 0, 0, 0, 0.27, 0.2, len * 0.9); else { t.f.add(P.sphere, light, 0, by - 0.1, 0.05, 0, 0, 0, 0.25, 0.18, len * 0.8); t.f.add(P.sphere, fur, 0, by + 0.02, -len * 0.8, 0, 0, 0, 0.28, 0.25, 0.22); }
  if (breed === 'schnauzer') { t.f.add(P.sphere, light, 0, by - 0.18, 0.1, 0, 0, 0, 0.2, 0.12, len * 0.7); } // silver skirt furnishings
  t.g.add(P.torus, 0xff4fa0, 0, by + 0.18, len * 0.78, PI / 2 - 0.5, 0, 0, 0.17, 0.17, 0.22); t.x.add(rcyl(0.06, 0.02, 0.008, 18), 0xffd23f, 0, by + 0.04, len * 0.92, PI / 2 - 0.3, 0, 0);
  body.add(toGroup(t));
  const legs = [[-0.15, len * 0.62], [0.15, len * 0.62], [-0.15, -len * 0.62], [0.15, -len * 0.62]].map(([x, z]) => { const g = new THREE.Group(); g.position.set(x, legH + 0.06, z); const b = MB();
    b.f.add(P.capsule, breed === 'corgi' ? light : breed === 'beagle' ? light : light, 0, -legH * 0.5, 0, 0, 0, 0, 0.13, legH * 0.55, 0.13); b.f.add(P.sphere, light, 0, -legH - 0.02, 0.04, 0, 0, 0, 0.085, 0.055, 0.11); g.add(toGroup(b)); body.add(g); return g; });
  const tail = new THREE.Group(); tail.position.set(0, by + 0.15, -len * 0.92); body.add(tail); { const b = MB();
    if (breed === 'schnauzer') b.f.add(P.capsule, dark, 0, 0.08, 0, 0, 0, 0, 0.08, 0.09, 0.08); else if (breed === 'beagle') { b.f.add(P.capsule, dark, 0, 0.14, -0.03, -0.3, 0, 0, 0.07, 0.17, 0.07); b.f.add(P.sphere, light, 0, 0.3, -0.08, 0, 0, 0, 0.055); } else b.f.add(P.sphere, light, 0, -0.02, -0.02, 0, 0, 0, 0.11);
    tail.add(toGroup(b)); }
  const head = new THREE.Group(); head.position.set(0, B.hy, len * 0.88); body.add(head); const h = MB();
  const eye = (x, y, z) => { h.g.add(P.sphere, 0x15151b, x, y, z, 0, 0, 0, 0.045, 0.05, 0.035); h.l.add(P.sphere, 0xffffff, x + 0.012, y + 0.016, z + 0.025, 0, 0, 0, 0.012, 0.012, 0.008, 0.7); };
  if (breed === 'schnauzer') { // boxy brick-shaped head with a square muzzle
    h.f.add(P.rbox, fur, 0, 0.02, 0, 0, 0, 0, 0.3, 0.27, 0.3); h.f.add(P.rbox, fur, 0, -0.04, 0.2, 0, 0, 0, 0.21, 0.17, 0.26); h.f.add(P.rbox, dark, 0, 0.13, -0.02, 0, 0, 0, 0.28, 0.06, 0.26);
    h.f.add(P.sphere, light, 0, -0.17, 0.25, 0, 0, 0, 0.13, 0.13, 0.15); [-1, 1].forEach((s) => { h.f.add(P.sphere, light, s * 0.075, -0.12, 0.3, 0, 0, 0, 0.09, 0.12, 0.1); // beard
      h.f.add(P.sphere, light, s * 0.055, -0.035, 0.34, 0, 0, s * 0.35, 0.075, 0.05, 0.06); // moustache
      h.f.add(P.capsule, light, s * 0.075, 0.105, 0.145, 0.5, 0, s * 0.35, 0.075, 0.07, 0.07); h.f.add(P.sphere, light, s * 0.09, 0.115, 0.19, 0, 0, 0, 0.05, 0.035, 0.045); // bushy brows
      h.f.add(P.sphere, dark, s * 0.15, 0.1, 0.02, 0.6, 0, s * 0.95, 0.11, 0.03, 0.12); }); // folded ears
    eye(-0.07, 0.055, 0.14); eye(0.07, 0.055, 0.14); h.g.add(P.rbox, 0x111111, 0, 0.02, 0.335, 0, 0, 0, 0.09, 0.06, 0.05); }
  else if (breed === 'corgi') { h.f.add(P.sphere, fur, 0, 0.03, 0, 0, 0, 0, 0.24, 0.22, 0.23); h.f.add(P.sphere, light, 0, -0.05, 0.16, 0, 0, 0, 0.13, 0.11, 0.15); h.f.add(P.capsule, light, 0, 0.1, 0.17, 0.4, 0, 0, 0.05, 0.07, 0.04);
    [-1, 1].forEach((s) => { h.f.add(P.cone, fur, s * 0.13, 0.27, -0.02, 0, 0, -s * 0.3, 0.1, 0.22, 0.05); h.g.add(P.cone, 0xffb3c8, s * 0.13, 0.26, 0.004, 0, 0, -s * 0.3, 0.06, 0.15, 0.02); h.g.add(P.sphere, 0xff9fb0, s * 0.13, -0.04, 0.17, 0, 0, 0, 0.04, 0.025, 0.02); });
    eye(-0.08, 0.06, 0.19); eye(0.08, 0.06, 0.19); h.g.add(P.sphere, 0x111111, 0, -0.01, 0.31, 0, 0, 0, 0.05, 0.04, 0.035); }
  else { h.f.add(P.sphere, fur, 0, 0.03, 0, 0, 0, 0, 0.23, 0.23, 0.24); h.f.add(P.capsule, light, 0, 0.0, 0.14, 0.4, 0, 0, 0.07, 0.12, 0.05); h.f.add(P.sphere, light, 0, -0.07, 0.2, 0, 0, 0, 0.12, 0.1, 0.14);
    [-1, 1].forEach((s) => h.f.add(P.capsule, 0x8a5428, s * 0.21, -0.08, 0.0, 0, 0, s * 0.12, 0.09, 0.2, 0.15)); // long floppy ears
    eye(-0.08, 0.07, 0.19); eye(0.08, 0.07, 0.19); h.g.add(P.sphere, 0x111111, 0, -0.03, 0.33, 0, 0, 0, 0.05, 0.04, 0.035); }
  head.add(toGroup(h));
  const tongue = (() => { const b = MB(); b.g.add(P.capsule, 0xff6f91, 0, -0.04, 0, 0.3, 0, 0, 0.07, 0.08, 0.03); return toGroup(b); })(); tongue.position.set(0.02, breed === 'schnauzer' ? -0.24 : -0.12, breed === 'schnauzer' ? 0.3 : 0.24); head.add(tongue);
  return { root, body, head, legs, tail, tongue, t: Math.random() * 5, breed }; }
// small-dog anim (same moods as animCandy, scaled bob)
export function animDog(r, dt, speed, mode) { r.t += dt; const t = r.t, run = Math.min(1, speed / 5), f = 9 + run * 7;
  r.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * f + (i < 2 ? 0 : PI) + (i % 2) * 0.4) * 0.7 * run; });
  r.body.position.y = Math.abs(Math.sin(t * f)) * 0.05 * run + Math.sin(t * 2.4) * 0.005; r.tail.rotation.z = Math.sin(t * (mode === 'happy' ? 26 : 10)) * 0.6;
  r.head.rotation.x = Math.sin(t * 2.6) * 0.06; r.head.rotation.z = mode === 'happy' ? Math.sin(t * 4) * 0.18 : Math.sin(t * 0.9) * 0.05; r.tongue.visible = mode === 'happy' || run > 0.5; }
