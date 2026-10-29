// Grok Pickleball Park - a live 3D pickleball match (or drill) on any court in the park.
// Real rules come from PB.Match (side-out scoring, two-bounce rule, kitchen, diagonal underhand serve). This file draws it and handles touch.
import * as THREE from 'three';
import { E, setEnvironment } from './engine.js?v=ppk2';
import { makeHuman, animHuman } from './humans.js?v=ppk2';
import { makePet, animPet } from './pets.js?v=ppk2';
import { MB, toGroup } from './models.js?v=ppk2';
import { P } from './geo.js?v=ppk2';
import { S, persist } from './save.js?v=ppk2';
import { PADDLES, BALLS, COURTS, DRILLS, SMASHERS } from './data.js?v=ppk2';
import { BUILDINGS } from './bld.js?v=ppk2';
import { SPOTS, ENV, NIGHT } from './map.js?v=ppk2';
import { sfx, playMusic } from './audio.js?v=ppk2';
import { IN } from './input.js?v=ppk2';
import { UMP } from './story.js?v=ppk2';

const PB = window.PB, D = PB.D, R = PB.Rules, PI = Math.PI;
const Y0 = 0.08; // top of the court surface
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k, ease = (k) => k * k * (3 - 2 * k);
const $ = (id) => document.getElementById(id);

// ---------- shared models ----------
export function paddleModel(def) { const b = MB(), a = def.a, c = def.b;
  b.g.add(P.rbox, a, 0, 0.175, 0, 0, 0, 0, 0.2, 0.27, 0.016);
  b.m.add(P.rbox, c, 0, 0.175, 0, 0, 0, 0, 0.214, 0.284, 0.011);
  b.f.add(P.capsule, 0x1f2937, 0, -0.055, 0, 0, 0, 0, 0.044, 0.15, 0.04);
  b.m.add(P.sphere, c, 0, -0.14, 0, 0, 0, 0, 0.03, 0.02, 0.028);
  [-1, 1].forEach((s) => { b.g.add(P.rbox, c, 0, 0.11, s * 0.0085, 0, 0, 0, 0.15, 0.028, 0.002); if (def.star) b.l.add(P.sphere, 0xffd1d1, 0, 0.24, s * 0.009, 0, 0, 0, 0.03, 0.03, 0.003, 0.8); });
  if (def.face === 'grit') for (let i = 0; i < 18; i++) { const x = ((i * 37) % 17) / 17 * 0.16 - 0.08, y = 0.07 + ((i * 53) % 19) / 19 * 0.2; [-1, 1].forEach((s) => b.m.add(P.sphere, 0x9ca3af, x, y, s * 0.0088, 0, 0, 0, 0.009, 0.009, 0.002)); }
  if (def.face === 'carbon') [-1, 1].forEach((s) => { for (let i = 0; i < 4; i++) b.x.add(P.rbox, 0x6b7280, 0, 0.07 + i * 0.06, s * 0.0086, 0, 0, 0.6, 0.16, 0.006, 0.002); });
  return toGroup(b); }
export function hatModel(id) { if (!id || id === 'none') return null; const b = MB();
  if (id === 'visor') { b.f.add(P.torus, 0xffffff, 0, -0.1, 0, PI / 2, 0, 0, 0.265, 0.265, 0.15); b.g.add(P.sphere, 0x111827, 0, -0.1, 0.22, 0, 0, 0, 0.17, 0.014, 0.12); }
  else if (id === 'cap') { b.f.add(P.sphere, 0x2563eb, 0, -0.08, -0.01, 0, 0, 0, 0.285, 0.16, 0.285); b.g.add(P.sphere, 0x1d4ed8, 0, -0.1, 0.22, 0, 0, 0, 0.18, 0.014, 0.14); b.g.add(P.sphere, 0xffffff, 0, 0.07, 0, 0, 0, 0, 0.03, 0.02, 0.03); }
  else if (id === 'headband') b.f.add(P.torus, 0xef4444, 0, -0.14, 0, PI / 2, 0, 0, 0.27, 0.27, 0.2);
  else if (id === 'pickle') { b.g.add(P.capsule, 0x4ade80, 0, 0.02, 0, 0, 0, PI / 2, 0.34, 0.5, 0.3); for (let i = 0; i < 9; i++) b.g.add(P.sphere, 0x22c55e, -0.3 + i * 0.075, 0.1 + Math.sin(i * 2.1) * 0.05, 0.12 - (i % 3) * 0.09, 0, 0, 0, 0.03, 0.03, 0.03); b.g.add(P.cone, 0xfcd34d, 0, 0.21, 0, 0, 0, 0, 0.12, 0.14, 0.12); }
  return toGroup(b); }
function ballTex(def) { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const g = cv.getContext('2d'); const c = '#' + def.col.toString(16).padStart(6, '0'); g.fillStyle = c; g.fillRect(0, 0, 256, 128);
  if (!def.quiet) { g.fillStyle = 'rgba(40,40,10,.55)'; const rows = [[20, 6], [44, 10], [64, 12], [84, 10], [108, 6]]; rows.forEach(([y, n], r) => { for (let i = 0; i < n; i++) { const x = (i + (r % 2) * 0.5) / n * 256; g.beginPath(); g.ellipse(x, y, 7, 7, 0, 0, PI * 2); g.fill(); } }); }
  else { g.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 90; i++) g.fillRect((i * 97) % 256, (i * 61) % 128, 2, 2); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }
function machineModel() { const b = MB(); b.g.add(P.rbox, 0x1f2937, 0, 0.45, 0, 0, 0, 0, 0.7, 0.6, 0.6); b.e.add(P.sphere, 0xe6ff3b, 0, 0.95, 0, 0, 0, 0, 0.32, 0.22, 0.32); b.x.add(P.cyl, 0x94a3b8, 0, 0.62, 0.36, PI / 2 - 0.25, 0, 0, 0.08, 0.3, 0.08);
  [-1, 1].forEach((s) => b.f.add(P.torus, 0x111827, s * 0.36, 0.12, 0.18, 0, PI / 2, 0, 0.11, 0.11, 0.2)); b.l.add(P.sphere, 0x22c55e, 0.2, 0.6, 0.31, 0, 0, 0, 0.03, 0.03, 0.01, 1); return toGroup(b); }

// ---------- match view ----------
export class MatchView {
  constructor(game, cfg) {
    this.game = game; this.cfg = cfg; this.C = COURTS[cfg.court]; this.cid = cfg.court; this.drill = cfg.mode === 'drill' ? DRILLS.find((d) => d.id === cfg.drill) : null;
    this.building = this.C.kind === 'indoor' ? BUILDINGS.find((b) => b.id === (this.C.bld || 'train')) : null; this.night = this.C.kind === 'night'; this.cheerT = 0; this.fp = !!S.opts.fp; this.T = 0; this.done = false;
    this.exitSpot = SPOTS['court_' + cfg.court] || (cfg.court === 'center' ? SPOTS.stadium : [this.C.x, this.C.z + 10]);
    this.group = new THREE.Group(); E.scene.add(this.group);
    const pad = PADDLES.find((p) => p.id === S.eq.paddle) || PADDLES[0];
    let ball = BALLS.find((b) => b.id === (cfg.ball || S.eq.ball)) || BALLS[0]; if (this.C.kind === 'quiet') ball = BALLS.find((b) => b.id === 'silent'); if (this.night && S.own.ball.includes('glow') && !cfg.ball) ball = BALLS.find((b) => b.id === 'glow');
    if (cfg.mode !== 'drill' && cfg.mode !== 'quick' && cfg.mode !== 'dillers' && this.C.bld !== 'dillers' && !ball.legal) ball = BALLS[0]; this.ballDef = ball; this.pad = pad;
    // who is playing: index 0 is always you (team 0, near side). Doubles: 0,1 = your team; 2,3 = them.
    const me = { n: S.name || 'You', look: S.look, hat: S.eq.hat, pad, ctrl: 'human' };
    const list = [me]; if (cfg.doubles) list.push(Object.assign({ ctrl: 'ai' }, cfg.partner)); (cfg.opps || []).forEach((o) => list.push(Object.assign({ ctrl: 'ai' }, o)));
    if (this.drill) list.length = 1, list.push({ n: 'Ball Machine', ctrl: 'ai', machine: true, diff: 'easy' });
    this.defs = list.map((d, i) => Object.assign({ pad: PADDLES[(i * 3 + 1) % PADDLES.length] }, d));
    this.defs.forEach((d) => { if (d.pet) this.game.petBusy(d.pet, true); });
    const assist = S.opts.assist !== false;
    this.smashMode = !!(cfg.smashMode || this.C.kind === 'smash');
    this.mySmasher = SMASHERS.find((s) => s.id === (cfg.smasher || (S.smash && S.smash.smasher) || 'rita')) || SMASHERS[0];
    this.oppSmasher = SMASHERS.find((s) => s.id === (cfg.oppSmasher || (S.smash && S.smash.oppSmasher) || 'bo')) || SMASHERS[2];
    this.superCharge = [0, 0]; this.superArmed = false; this.superActive = null;
    const cond0 = Math.max(0, Math.min(100, S.padCond == null ? 100 : S.padCond));
    const gritK = cond0 <= 30 ? 0.82 : 1.0;
    const players = this.defs.map((d, i) => ({ ctrl: i === 0 ? 'human' : 'ai', name: d.n, diff: d.diff || 'medium', style: d.style, assist: i === 0 ? assist : true, pad: { pow: d.pad.pow * (i === 0 ? gritK : 1), ctl: d.pad.ctl, spin: d.pad.spin * (i === 0 ? gritK : 1) } }));
    this.m = new PB.Match({ doubles: !!cfg.doubles, to: cfg.to || 11, players, drag: ball.drag, bounce: ball.bounce, practice: !!this.drill, slowAI: assist && (cfg.diffK || 0) < 1, autoServeAfter: this.drill ? 0 : 12, seed: (Math.random() * 1e6) | 0, hooks: { ev: (e) => this.onEv(e), bounce: (m, ev, f) => this.onBounce(ev, f), fault: (m, f) => this.onFault(f) } });
    const mp = this.m.players[0]; mp.ai.reach = 1 + ((S.eq.shoe === 'swift') ? 0.06 : 0); if (S.buff === 'pop') { this.buffed = true; S.buff = null; persist(); }
    this.figs = this.defs.map((d, i) => this.mkFig(d, i));
    this.mkBall(); this.mkMarks(); this.mkOverlay();
    if (this.cid === 'center') this.mkBoard();
    if (this.night) setEnvironment(NIGHT);
    if (this.drill) this.startDrill(); else { this.say(cfg.title || (cfg.doubles ? 'Doubles' : 'Singles') + ' to ' + (cfg.to || 11), this.smashMode ? '💥 Super Smash Mode: Smash = 2 pts • Super Smash = 3 pts!' : 'Side-out scoring \u2022 win by 2'); }
    playMusic(this.night ? 'night' : this.drill ? 'garage' : 'arcade');
    this.camPos = new THREE.Vector3(); this.camLook = new THREE.Vector3(); this.snap = true; this.lastScore = '0-0';
    this.stats = { hits: 0, spins: 0, shots: {}, longest: 0 };
    this.applyFP(); if (!this.drill) { this.updScore(); this.onEv({ t: 'callout', text: R.callout(this.m.game) }); }
  }
  // ---------------- 3D bits ----------------
  mkFig(d, i) { const holder = new THREE.Group(); this.group.add(holder); const f = { d, holder, rig: null, pet: null, piv: null };
    if (d.machine) { holder.add(machineModel()); f.machine = true; return f; }
    if (d.pet) { f.pet = makePet(d.pet, { s: 1.3 }); f.pet.noTurn = true; holder.add(f.pet.root); f.piv = new THREE.Group(); f.piv.position.set(-0.3, 0.52, 0.16); holder.add(f.piv); }
    else { f.rig = makeHuman(d.look); holder.add(f.rig.root); const h = hatModel(d.hat); if (h) f.rig.hat.add(h); f.piv = new THREE.Group(); f.piv.position.set(0, -0.5, 0.03); f.rig.arms[0].add(f.piv); }
    const pm = paddleModel(d.pad); pm.rotation.x = f.pet ? -0.4 : PI; f.piv.add(pm); f.pm = pm;
    holder.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    return f; }
  mkBall() { const d = this.ballDef; this.ballTex = ballTex(d);
    const mat = new THREE.MeshStandardMaterial({ map: this.ballTex, roughness: d.quiet ? 0.85 : 0.4, emissive: d.glow ? d.col : 0x000000, emissiveIntensity: d.glow ? (this.night ? 1.6 : 0.5) : 0 });
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(D.BR * 1.45, 20, 14), mat); this.ball.castShadow = true; this.group.add(this.ball);
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })); this.shadow.rotation.x = -PI / 2; this.group.add(this.shadow);
    this.trail = new THREE.InstancedMesh(new THREE.SphereGeometry(D.BR * 1.2, 10, 8), new THREE.MeshBasicMaterial({ color: d.col, transparent: true, opacity: 0.22, depthWrite: false }), 7); this.trail.frustumCulled = false; this.group.add(this.trail); this.hist = []; }
  mkMarks() { const C = this.C;
    this.land = new THREE.Mesh(new THREE.RingGeometry(0.13, 0.19, 28), new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.85, depthWrite: false })); this.land.rotation.x = -PI / 2; this.land.visible = false; this.group.add(this.land);
    this.kz = new THREE.Mesh(new THREE.PlaneGeometry(D.HW * 2, D.K), new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: 0, depthWrite: false })); this.kz.rotation.x = -PI / 2; this.kz.position.set(C.x, Y0 + 0.012, C.z + D.K / 2); this.group.add(this.kz);
    this.box = new THREE.Mesh(new THREE.PlaneGeometry(D.HW, D.HL - D.K), new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0, depthWrite: false })); this.box.rotation.x = -PI / 2; this.group.add(this.box);
    this.rings = []; if (this.drill && this.drill.id === 'serve') [-1, 1].forEach((s) => { const r = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.8, 32), new THREE.MeshBasicMaterial({ color: 0xff4fa0, transparent: true, opacity: 0.8, depthWrite: false })); r.rotation.x = -PI / 2; r.position.set(C.x + s * 1.55, Y0 + 0.015, C.z - 5.0); this.group.add(r); this.rings.push(r); });
    if (this.drill && this.drill.id !== 'serve') { const z = new THREE.Mesh(new THREE.PlaneGeometry(D.HW * 2, this.drill.id === 'dink' || this.drill.id === 'drop' ? D.K : D.HL), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.16, depthWrite: false })); z.rotation.x = -PI / 2; const L = this.drill.id === 'dink' || this.drill.id === 'drop' ? D.K : D.HL; z.position.set(C.x, Y0 + 0.012, C.z - L / 2); this.group.add(z); } }
  // stadium scoreboard: canvas is exactly the board's aspect (6.4 x 3.4 m -> 640 x 340) so nothing stretches
  mkBoard() { const s = SPOTS.score; if (!s) return; const cv = document.createElement('canvas'); cv.width = 640; cv.height = Math.round(640 * s[4] / s[3]); this.bcv = cv; this.btex = new THREE.CanvasTexture(cv); this.btex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(s[3], s[4]), new THREE.MeshBasicMaterial({ map: this.btex, toneMapped: false })); mesh.position.set(s[0], s[1] + s[4] / 2, s[2] + 0.02); this.group.add(mesh); this.drawBoard(); }
  drawBoard() { if (!this.bcv) return; const g = this.bcv.getContext('2d'), W = this.bcv.width, H = this.bcv.height, m = this.m, gm = m.game; g.fillStyle = '#0b1020'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fde047'; g.font = 'bold 34px system-ui,sans-serif'; g.textAlign = 'center'; g.fillText('GROK PICKLE PARK \u2022 STADIUM COURT', W / 2, 46);
    const nm = (t) => this.defs.filter((d, i) => m.players[i].team === t).map((d) => d.n).join(' & ');
    [0, 1].forEach((t) => { const y = 120 + t * 96; g.fillStyle = t === 0 ? '#38bdf8' : '#f87171'; g.textAlign = 'left'; g.font = 'bold 38px system-ui,sans-serif'; g.fillText((gm.st === t ? '\u25CF ' : '   ') + nm(t).slice(0, 22), 28, y + 14); g.textAlign = 'right'; g.fillStyle = '#fff'; g.font = 'bold 76px system-ui,sans-serif'; g.fillText(String(gm.score[t]), W - 34, y + 26); });
    g.fillStyle = '#a5b4fc'; g.textAlign = 'center'; g.font = 'bold 30px system-ui,sans-serif'; g.fillText('Call: ' + R.callout(gm) + '   \u2022   Umpire: Pi-rat \uD83C\uDFF4\u200D\u2620\uFE0F', W / 2, H - 22); this.btex.needsUpdate = true; }
  // ---------------- overlay + touch ----------------
  mkOverlay() { const o = document.createElement('div'); o.id = 'mt'; const dr = !!this.drill;
    o.innerHTML = `<div class="mzone" id="mZone"></div><div class="mtop"><button class="mb" data-a="pause">\u23F8</button><div class="mscore" id="mScore"></div><button class="mb" data-a="view">\uD83D\uDC41\uFE0F</button></div>
      <div id="smHud" class="${this.smashMode ? '' : 'hidden'}">
        <div class="smBar t0" id="smB0"><span class="ic">${this.mySmasher.icon}</span><div class="tr"><i id="smF0" style="background:${this.mySmasher.col}"></i></div><span class="ct" id="smC0">0%</span></div>
        <div class="smGrit" id="smGrit">🏓 ${Math.round(S.padCond ?? 100)}%</div>
        <div class="smBar t1" id="smB1"><span class="ic">${this.oppSmasher.icon}</span><div class="tr"><i id="smF1" style="background:${this.oppSmasher.col}"></i></div><span class="ct" id="smC1">0%</span></div>
      </div>
      <div class="mcall" id="mCall"></div><div class="mhint" id="mHint"></div><div class="mump" id="mUmp"></div>
      <div class="mring" id="mRing"></div><div class="mknob" id="mKnob"></div>
      <div class="mshots">${[['dink', '\uD83E\uDEB6', 'DINK'], ['drop', '\uD83C\uDFAF', 'DROP'], ['drive', '\u26A1', 'DRIVE'], ['lob', '\uD83C\uDF19', 'LOB'], ['smash', '\uD83D\uDCA5', 'SMASH']].map(([k, i, n]) => `<button class="ms" data-s="${k}"><i>${i}</i><b>${n}</b></button>`).join('')}<button class="ms spin" data-s="spin"><i>\uD83C\uDF00</i><b>SPIN</b></button></div>
      <button class="ms super ${this.smashMode ? '' : 'hidden'}" id="bSuper"><span id="bSupF"></span><i>${this.mySmasher.icon}</i><b>SUPER</b></button>
      <div class="mtip" id="mTip">${dr ? '' : this.smashMode ? '💥 Smash winners = 2 pts • Fill Super Bar to 100% & tap SUPER (or Space/6) for 3 pts!' : 'Swipe or tap the right side to hit \u2022 left thumb to move'}</div>`;
    document.body.appendChild(o); this.ov = o; this.spin = false; this.armed = null;
    o.querySelectorAll('[data-a]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); sfx('click'); if (b.dataset.a === 'pause') this.game.app.ui.pause(true); else this.toggleFP(); });
    o.querySelectorAll('[data-s]').forEach((b) => { const f = (e) => { e.preventDefault(); e.stopPropagation(); const k = b.dataset.s; if (k === 'spin') { this.spin = !this.spin; b.classList.toggle('on', this.spin); sfx('click'); return; }
        this.armed = k; o.querySelectorAll('[data-s]').forEach((x) => x.classList.toggle('arm', x.dataset.s === k && k !== 'spin')); this.swing(k, 0, 0.6); }; b.addEventListener('pointerdown', f); });
    const bSup = o.querySelector('#bSuper');
    if (bSup) bSup.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.armSuper(); });
    this.updSmashHud();
    const z = o.querySelector('#mZone'), ring = o.querySelector('#mRing'), knob = o.querySelector('#mKnob'); this.stick = { id: null, x: 0, y: 0 }; const sw = {};
    z.addEventListener('pointerdown', (e) => { e.preventDefault(); const left = e.clientX < innerWidth * 0.42;
      if (left && this.stick.id === null) { const s = this.stick; s.id = e.pointerId; s.x0 = e.clientX; s.y0 = e.clientY; s.x = s.y = 0; ring.style.left = knob.style.left = e.clientX + 'px'; ring.style.top = knob.style.top = e.clientY + 'px'; ring.classList.add('on'); knob.classList.add('on'); }
      else sw[e.pointerId] = { x: e.clientX, y: e.clientY, t: performance.now() }; try { z.setPointerCapture(e.pointerId); } catch (x) {} });
    z.addEventListener('pointermove', (e) => { const s = this.stick; if (e.pointerId !== s.id) return; let dx = e.clientX - s.x0, dy = e.clientY - s.y0; const d = Math.hypot(dx, dy), Rr = 50; if (d > Rr) { dx *= Rr / d; dy *= Rr / d; } s.x = dx / Rr; s.y = -dy / Rr; knob.style.left = (s.x0 + dx) + 'px'; knob.style.top = (s.y0 + dy) + 'px'; });
    const up = (e) => { const s = this.stick; if (e.pointerId === s.id) { s.id = null; s.x = s.y = 0; ring.classList.remove('on'); knob.classList.remove('on'); return; } const q = sw[e.pointerId]; if (!q) return; delete sw[e.pointerId];
      const dx = e.clientX - q.x, dy = e.clientY - q.y, L = Math.hypot(dx, dy), dt = performance.now() - q.t; this.gesture(dx, dy, L, dt); };
    z.addEventListener('pointerup', up); z.addEventListener('pointercancel', up);
    this.keyD = (e) => { if (this.game.app.busy) return; const k = e.code; const sh = { Digit1: 'dink', Digit2: 'drop', Digit3: 'drive', Digit4: 'lob', Digit5: 'smash' }; if (sh[k]) { this.armed = sh[k]; this.swing(sh[k], 0, 0.6); } else if (k === 'Space' || k === 'KeyE' || k === 'Enter') { this.swing(this.armed || 'auto', 0, 0.6); e.preventDefault(); } else if (k === 'KeyQ' || k === 'KeyJ') { this.spin = !this.spin; o.querySelector('.spin').classList.toggle('on', this.spin); } else if (k === 'Digit6' || k === 'KeyR' || k === 'KeyF') this.armSuper(); else if (k === 'KeyV') this.toggleFP(); };
    window.addEventListener('keydown', this.keyD); const tz = $('touch'); if (tz) tz.style.display = 'none'; const hud = $('hud'); if (hud) hud.classList.add('inmatch'); }
  armSuper() {
    if (!this.smashMode || this.done) return;
    if (this.superCharge[0] < 100) {
      sfx('click');
      this.hint('⚡ Charge Super Bar to 100% by rallying & hitting smashes! (' + Math.round(this.superCharge[0]) + '%)');
      return;
    }
    this.superArmed = !this.superArmed;
    sfx(this.superArmed ? 'win' : 'click');
    if (this.superArmed) {
      this.armed = 'smash';
      this.pop(this.mySmasher.superName + ' ARMED!');
      this.swing('smash', 0, 0.95);
    }
    this.updSmashHud();
  }
  updSmashHud() {
    if (!this.ov) return;
    const gEl = this.ov.querySelector('#smGrit');
    if (gEl) {
      const cond = Math.max(0, Math.min(100, Math.round(S.padCond ?? 100)));
      gEl.textContent = '🏓 ' + cond + '%';
      gEl.style.borderColor = cond <= 25 ? '#ef4444' : cond <= 55 ? '#facc15' : '#fde047';
    }
    if (!this.smashMode) return;
    [0, 1].forEach((t) => {
      const pct = Math.max(0, Math.min(100, Math.round(this.superCharge[t] || 0)));
      const bar = this.ov.querySelector('#smB' + t), fill = this.ov.querySelector('#smF' + t), ct = this.ov.querySelector('#smC' + t);
      if (fill) fill.style.width = pct + '%';
      if (ct) ct.textContent = pct >= 100 ? 'MAX' : pct + '%';
      if (bar) {
        bar.classList.toggle('full', pct >= 100);
        if (t === 0) bar.classList.toggle('armed', !!this.superArmed);
      }
    });
    const bSup = this.ov.querySelector('#bSuper'), bSupF = this.ov.querySelector('#bSupF');
    if (bSup && bSupF) {
      const pct = Math.max(0, Math.min(100, Math.round(this.superCharge[0] || 0)));
      bSupF.style.height = pct + '%';
      bSup.classList.toggle('ready', pct >= 100);
      bSup.classList.toggle('armed', !!this.superArmed);
    }
  }
  gesture(dx, dy, L, dt) { const me = this.m.players[0]; let type, pow, ax = clamp(dx / 140, -1.3, 1.3);
    if (L < 18) { this.swing(this.armed || 'auto', 0, 0.55); return; }
    const near = Math.abs(me.z) < D.K + 1.4;
    if (dy > 30 && dy > Math.abs(dx) * 0.6) { type = 'smash'; pow = 0.9; }
    else if (-dy > 40) { const fast = L / Math.max(60, dt); if (L > 230 || (dt > 380 && L > 120)) { type = 'lob'; pow = 0.6; } else if (fast > 1.3 && L > 110) { type = 'drive'; pow = clamp(L / 260, 0.5, 1); } else { type = near ? 'dink' : 'drop'; pow = clamp(L / 200, 0.25, 0.7); } }
    else { type = this.armed || 'auto'; pow = 0.6; }
    this.swing(type, ax, pow); }
  swing(type, ax, pow) { const m = this.m; if (this.done) return; if (m.phase === 'serve' && m.game.server !== 0 && !this.drill) return; m.request(0, type, ax, pow, this.spin); this.swingReq = 0.25; }
  // ---------------- drills ----------------
  startDrill() { const d = this.drill, m = this.m; this.drillT = 60; this.reps = 0; this.tries = 0; this.combo = 0; m.players[1].noHit = true; m.players[1].home = { x: 0, z: -D.HL - 1.4 }; m.phase = 'idle'; m.phaseT = 0; this.nextT = 1.6;
    this.say(d.icon + ' ' + d.n, d.d); if (d.id === 'serve') { m.players[1].x = 0; } }
  placeMe() { const d = this.drill, p = this.m.players[0], z = { dink: D.K + 0.35, drop: D.HL + 0.2, volley: D.K + 0.45, smash: D.K + 1.8 }[d.id]; if (z != null) { p.x = (Math.random() - 0.5) * 1.2; p.z = z; p.vx = p.vz = 0; } const f = this.m.players[1]; f.x = 0; f.z = -D.HL - 1.4; }
  feedNext() { const d = this.drill, m = this.m; if (d.id === 'serve') { m.game.score[0] = this.tries % 2; R.setServer && R.setServer(m.game); m.game.server = 0; m.setPhase('pre'); this.tries++; return; }
    this.placeMe(); const me = m.players[0], r = Math.random, fx = (r() - 0.5) * 1.6, fz = -D.HL - 0.9; this.tries++;
    if (d.id === 'dink') m.feed({ x: fx * 0.6, y: 0.5, z: -D.K - 0.3, tx: clamp(me.x + (r() - 0.5) * 2, -2.4, 2.4), tz: 0.9 + r() * 1.0, vh: 5.4, s: -0.3, hits: 5, team: 1, p: 1, type: 'dink', clear: 0.12 });
    else if (d.id === 'drop') m.feed({ x: fx, y: 0.8, z: fz, tx: clamp(me.x + (r() - 0.5) * 1.6, -2.4, 2.4), tz: D.HL - 1.0 - r() * 0.8, vh: 10.5, s: 0.4, hits: 2, team: 1, p: 1, type: 'drive', clear: 0.5 });
    else if (d.id === 'volley') m.feed({ x: fx, y: 0.9, z: fz, tx: clamp(me.x + (r() - 0.5) * 0.9, -2.6, 2.6), tz: me.z + 2.6, vh: 12.5, s: 0.5, hits: 5, team: 1, p: 1, type: 'drive', clear: 0.3 });
    else m.feed({ x: fx, y: 0.8, z: fz, tx: clamp(me.x + (r() - 0.5) * 1.4, -2.4, 2.4), tz: me.z - 0.2 + r() * 0.8, vh: 8, s: 0.1, hits: 5, team: 1, p: 1, type: 'lob', minApex: 4.4, clear: 1.2 }); }
  drillScore(ok, bonus, why) { if (ok) { this.reps += bonus || 1; this.combo++; sfx('coin'); this.pop(bonus > 1 ? '\uD83C\uDFAF BULLSEYE +' + bonus : ['\u2728 Nice!', '\uD83D\uDD25 Great!', '\uD83D\uDC4C Clean!', '\uD83C\uDF1F Perfect!'][Math.min(3, this.combo - 1)]); if (this.combo >= 3) this.cheerT = 1.2; }
    else { this.combo = 0; this.pop(why || 'Miss!', true); } }
  onBounce(ev, f) { const m = this.m, r = m.rally; this.lastBounce = ev;
    if (!this.drill) return false;
    if (r.lastPlayer !== 0 || ev.z > 0) return false; // only judge YOUR shot landing on the far side
    const d = this.drill.id, inC = R.inCourt(ev.x, ev.z); let ok = false, bonus = 1, why = '';
    if (d === 'serve') { ok = !f; if (ok && this.rings.some((g) => Math.hypot(this.C.x + ev.x - g.position.x, this.C.z + ev.z - g.position.z) < 0.85)) bonus = 3; why = f ? f.why : ''; }
    else if (d === 'dink' || d === 'drop') { ok = inC && ev.z >= -D.K - 0.05; why = !inC ? 'Out!' : 'Too deep \u2014 aim for the kitchen'; }
    else if (d === 'smash') { ok = inC && m.players[0].swingType === 'smash'; why = !inC ? 'Out!' : 'Swipe DOWN to smash it'; }
    else { ok = inC; why = 'Out!'; }
    this.drillScore(ok, bonus, why); m.phase = 'dead'; m.phaseT = 0; return true; }
  onFault(f) { if (this.drill) { const m = this.m; if (m.phase === 'rally' && !(m.rally.lastPlayer === 0 && this.lastBounce && this.lastBounce.z < 0)) this.drillScore(false, 1, /net/i.test(f.why) ? 'Into the net' : /Kitchen/.test(f.why) ? '\uD83D\uDEAB Kitchen fault!' : /bounce/.test(f.why) ? 'Let it bounce first!' : 'Missed it'); } return false; }
  // ---------------- match events ----------------
  onEv(e) { const m = this.m; if (!m || !this.ov) return; const quiet = this.ballDef.quiet;
    if (e.t === 'hit') {
      sfx(quiet ? 'foam' : 'pock');
      const hp = m.players[e.p], hTeam = hp ? hp.team : 0;
      if (e.p === 0) {
        this.stats.hits++;
        this.stats.shots[e.type] = (this.stats.shots[e.type] || 0) + 1;
        if (e.type === 'smash') S.stats.smashes = (S.stats.smashes || 0) + 1;
        const wear = e.type === 'smash' ? (this.superArmed ? 1.8 : 0.9) : e.type === 'drive' ? 0.35 : 0.15;
        S.padCond = Math.max(0, +((S.padCond == null ? 100 : S.padCond) - wear).toFixed(1));
        if (e.spin) { this.stats.spins++; this.pop('\uD83C\uDF00 ' + (e.type === 'dink' || e.type === 'drop' ? 'Slice!' : 'Topspin!')); }
        this.armed = null; this.ov.querySelectorAll('[data-s]').forEach((x) => x.classList.remove('arm'));
        if (e.perfect) this.pop('\u2B50 Perfect timing!');
      }
      if (this.smashMode && !this.drill) {
        const gain = (e.type === 'smash' ? 34 : e.type === 'drive' ? 22 : 16) * (hTeam === 0 && this.pad && this.pad.id === 'rocket' ? 1.2 : 1);
        if (hTeam === 0 && this.superArmed && this.superCharge[0] >= 100) {
          this.superCharge[0] = 0; this.superArmed = false;
          this.superActive = { team: 0, sm: this.mySmasher };
          S.stats.superSmashes = (S.stats.superSmashes || 0) + 1;
          m.ball.vx *= 1.28; m.ball.vz *= 1.28;
          this.pop('⚡ ' + this.mySmasher.superName + '!!');
          sfx('win');
        } else if (hTeam === 1 && this.superCharge[1] >= 100 && (e.type === 'smash' || e.type === 'drive')) {
          this.superCharge[1] = 0;
          this.superActive = { team: 1, sm: this.oppSmasher };
          m.ball.vx *= 1.18; m.ball.vz *= 1.18;
          this.pop('⚠️ ' + this.oppSmasher.superName + '!');
        } else {
          this.superCharge[hTeam] = Math.min(100, (this.superCharge[hTeam] || 0) + gain);
          if (e.type === 'smash' && (!this.superActive || this.superActive.team !== hTeam)) this.pop('💥 SMASH SHOT!');
        }
        this.updSmashHud();
      } else {
        this.updSmashHud();
      }
    }
    else if (e.t === 'bounce') sfx(quiet ? 'foamb' : 'bnc');
    else if (e.t === 'net') sfx('net');
    else if (e.t === 'hint') { if (e.p === 0) this.hint(e.text, e.kitchen); }
    else if (e.t === 'callout' && !this.drill) { this.superActive = null; this.updScore(); const meServe = m.players[m.game.server] && m.players[m.game.server].team === 0; this.hint(meServe && m.game.server === 0 ? '\uD83C\uDFBE Your serve! Tap or swipe up \u2014 underhand, diagonal' : meServe ? 'Your partner serves' : 'Get ready to return \u2014 let the serve bounce!'); if (this.cid === 'center' || this.cfg.ump) this.ump(e.text); else this.call(e.text, 900); this.drawBoard(); }
    else if (e.t === 'point' && !e.practice) { const res = e.res, mine = e.w === 0; this.stats.longest = Math.max(this.stats.longest, e.hits || 0);
      let bonusPts = 0, smashTag = '';
      if (this.smashMode && res.point) {
        const isSuper = this.superActive && this.superActive.team === e.w;
        const isSmash = e.lastShot === 'smash' && e.winnerShot;
        if (isSuper) { bonusPts = 2; smashTag = ' ⚡ SUPER SMASH +3 PTS!'; }
        else if (isSmash) { bonusPts = 1; smashTag = ' 💥 SMASH WINNER +2 PTS!'; }
        if (bonusPts > 0) {
          m.game.score[e.w] += bonusPts;
          const sc = m.game.score, to = m.game.to;
          if (sc[e.w] >= to && sc[e.w] - sc[1 - e.w] >= 2) { m.game.over = true; m.game.winner = e.w; res.over = true; }
        }
      }
      this.superActive = null;
      let t = e.why || ''; if (/^Winner|^Ace/.test(t)) t = mine ? (t.startsWith('Ace') ? '\uD83D\uDE80 ACE!' : '\uD83C\uDFC6 Winner!') : (t.startsWith('Ace') ? 'Aced!' : 'Got past you!');
      this.call(t + (smashTag || (res.sideout ? '  \u2022  Side out!' : res.secondServer ? '  \u2022  Second server' : res.point ? (mine ? '  \u2022  Point!' : '') : '')), 1500, !mine);
      sfx(mine ? (res.point ? 'point' : 'click') : 'miss'); if (mine) this.cheerT = e.great || bonusPts > 0 ? 3 : 1.4; if (smashTag) this.pop(smashTag); else if (e.great) this.pop('\uD83D\uDD25 What a rally! ' + e.hits + ' shots');
      this.updScore(); this.updSmashHud(); this.drawBoard(); }
    else if (e.t === 'over') this.finish(e.winner); }
  updScore() { const g = this.m.game, el = $('mScore'); if (!el) return; const nm = (t) => this.defs.filter((d, i) => this.m.players[i].team === t).map((d) => d.n.split(' ').slice(-1)[0]).join(' & ');
    el.innerHTML = `<span class="t0 ${g.st === 0 ? 'srv' : ''}">${nm(0)} <b>${g.score[0]}</b></span><span class="t1 ${g.st === 1 ? 'srv' : ''}"><b>${g.score[1]}</b> ${nm(1)}</span><em>${R.callout(g)}${g.doubles ? '' : ''} \u2022 to ${g.to}</em>`; }
  drillHud() { const el = $('mScore'); if (el) el.innerHTML = `<span class="t0">${this.drill.icon} ${this.drill.n}</span><span class="t1"><b>${this.reps}</b> ${this.drill.best}</span><em>\u23F1 ${Math.ceil(this.drillT)} s \u2022 best ${S.drills[this.drill.id] || 0}</em>`; }
  say(a, b) { this.call(a, 2200); if (b) this.hint(b); }
  call(t, ms = 1400, bad) { const el = $('mCall'); if (!el) return; el.textContent = t; el.className = 'mcall on' + (bad ? ' bad' : ''); clearTimeout(this._ct); this._ct = setTimeout(() => { if (el) el.className = 'mcall'; }, ms); }
  hint(t, warn) { const el = $('mHint'); if (!el) return; el.textContent = t; el.className = 'mhint on' + (warn ? ' warn' : ''); clearTimeout(this._ht); this._ht = setTimeout(() => { if (el) el.className = 'mhint'; }, 2600); }
  pop(t, bad) { const o = document.createElement('div'); o.className = 'mpop' + (bad ? ' bad' : ''); o.textContent = t; this.ov.appendChild(o); setTimeout(() => o.remove(), 1300); }
  ump(score) { const el = $('mUmp'); if (!el) return; const extra = UMP[(Math.random() * UMP.length) | 0]; el.innerHTML = `<i>\uD83C\uDFF4\u200D\u2620\uFE0F</i><div><b>Umpire Pi-rat</b>"${score}!"${Math.random() < 0.3 ? ' ' + extra : ''}</div>`; el.className = 'mump on'; clearTimeout(this._ut); this._ut = setTimeout(() => { if (el) el.className = 'mump'; }, 2300); sfx('squeak'); }
  finish(w) { if (this.done) return; this.done = true; const win = w === 0, g = this.m.game; this.cheerT = win ? 5 : 0; sfx(win ? 'win' : 'lose'); this.call(win ? '\uD83C\uDFC6 YOU WIN! ' + g.score[0] + '-' + g.score[1] : 'Game! ' + g.score[1] + '-' + g.score[0], 2600, !win);
    const res = { win, score: [g.score[0], g.score[1]], stats: this.stats, cfg: this.cfg, buffed: this.buffed, me: this.m.players[0].stats };
    setTimeout(() => this.game.app.ui.matchOver(res), 2700); }
  finishDrill() { if (this.done) return; this.done = true; const d = this.drill; const best = S.drills[d.id] || 0, nb = this.reps > best; if (nb) S.drills[d.id] = this.reps; persist(); this.call('\u23F1 Time! ' + this.reps + ' ' + d.best, 2200);
    setTimeout(() => this.game.app.ui.drillOver({ drill: d, reps: this.reps, tries: this.tries, best: nb, prev: best, cfg: this.cfg }), 1800); }
  // ---------------- per frame ----------------
  update(dt) { const app = this.game.app; if (app.busy) { this.place(0); return; } this.T += dt; const m = this.m, me = m.players[0];
    // movement: left thumb / WASD steers (overrides auto-move); with assist off you move yourself
    const K = IN.keys; let mx = this.stick.x, my = this.stick.y; if (K.KeyA || K.ArrowLeft) mx -= 1; if (K.KeyD || K.ArrowRight) mx += 1; if (K.KeyW || K.ArrowUp) my += 1; if (K.KeyS || K.ArrowDown) my -= 1;
    if (this.fp && false) {} m.move(0, clamp(mx, -1, 1), clamp(my, -1, 1));
    // auto-swing: in assist mode you choose the shot, the game times the swing when the ball arrives
    if (S.opts.autoswing !== false && m.phase === 'rally' && !me.req && m.rally.lastTeam === 1 && Math.hypot(m.ball.x - me.x, m.ball.z - me.z) < 1.9) m.request(0, this.armed || 'auto', 0, 0.55, this.spin);
    if (this.buffed) me.ai.reach = 1.08;
    m.update(dt);
    if (this.drill) { if (!this.done) { this.drillT -= dt; if (this.drillT <= 0 && m.phase !== 'rally') this.finishDrill(); else if (m.phase === 'idle' || m.phase === 'dead') { this.nextT -= dt; if (this.nextT <= 0 && this.drillT > 0) { this.nextT = this.drill.id === 'serve' ? 0.4 : 0.9; this.feedNext(); } } else this.nextT = m.phase === 'pre' || m.phase === 'serve' ? 0.6 : 0.7; } this.drillHud(); }
    if (this.cheerT > 0) this.cheerT -= dt;
    this.place(dt); this.camera(dt); }
  place(dt) { const m = this.m, C = this.C, b = m.ball;
    m.players.forEach((p, i) => { const f = this.figs[i]; f.holder.position.set(C.x + p.x, Y0, C.z + p.z); f.holder.rotation.y = f.machine ? PI * 0 : p.face; if (f.machine) { f.holder.rotation.y = 0; return; }
      const st = p.swingT, sw = st < 0.42 ? st / 0.42 : 1, over = p.swingType === 'smash' || (p.swingType === 'serve' ? false : st < 0.42 && b.y > 1.5 && Math.abs(b.z - p.z) < 1.4 && p.swingType !== 'dink' && p.swingType !== 'drop' && p.swingType !== 'lob' && false);
      if (f.rig) { animHuman(f.rig, dt, { speed: p.spd || 0 }); const A = f.rig.arms[0]; let ax;
        if (sw < 1) ax = over ? lerp(-3.0, -0.3, ease(sw)) : lerp(0.95, -1.45, ease(sw)); else ax = -0.55 + Math.sin(this.T * 3 + i) * 0.04 - Math.min(0.35, (p.spd || 0) * 0.05);
        if (p.celebT > 0 && m.phase !== 'rally') { ax = -2.7 + Math.sin(this.T * 14) * 0.25; f.rig.arms[1].rotation.x = -2.7 - Math.sin(this.T * 14) * 0.25; f.rig.body.position.y = Math.abs(Math.sin(this.T * 9)) * 0.12; }
        A.rotation.x = ax; A.rotation.z = -0.28; f.rig.body.rotation.y = sw < 1 ? Math.sin(sw * PI) * (over ? 0.2 : 0.45) : 0; f.piv.rotation.z = sw < 1 ? -Math.sin(sw * PI) * 0.4 : 0.15; }
      else if (f.pet) { const pt = f.pet; pt.x = pt.y = pt.z = 0; pt.yaw = 0; pt.speed = (p.spd || 0) * 0.6; animPet(pt, dt, null); f.piv.rotation.x = sw < 1 ? lerp(0.9, -1.6, ease(sw)) : -0.2 + Math.sin(this.T * 3) * 0.05; if (p.celebT > 0) pt.root.position.y = Math.abs(Math.sin(this.T * 9)) * 0.2; } });
    // ball, shadow, trail, landing ring
    const vis = b.live || m.phase === 'serve' || m.phase === 'pre'; this.ball.visible = vis; this.shadow.visible = vis;
    this.ball.position.set(C.x + b.x, Y0 + b.y, C.z + b.z); this.ball.rotation.x += (b.s || 0) * dt * 6 + dt * 3; this.ball.scale.setScalar(this.superActive && this.superActive.sm && this.superActive.sm.superKind === 'giant' ? 2.4 : this.superActive ? 1.35 : 1);
    const hy = Math.max(0, b.y); this.shadow.position.set(C.x + b.x, Y0 + 0.01, C.z + b.z); this.shadow.scale.setScalar(1 + hy * 0.35); this.shadow.material.opacity = clamp(0.42 - hy * 0.06, 0.08, 0.42);
    const sp = Math.hypot(b.vx, b.vy, b.vz); if (b.live && sp > 3) this.hist.unshift([this.ball.position.x, this.ball.position.y, this.ball.position.z]); else this.hist.length = 0; if (this.hist.length > 7) this.hist.length = 7;
    const _m = new THREE.Matrix4(); this.hist.forEach((h, k) => { const s = 1 - k / 8; _m.makeScale(s, s, s).setPosition(h[0], h[1], h[2]); this.trail.setMatrixAt(k, _m); }); this.trail.count = this.hist.length; this.trail.instanceMatrix.needsUpdate = true;
    const me = m.players[0], assist = S.opts.assist !== false; let lb = null; if (assist && m.phase === 'rally' && m.rally.lastTeam !== me.team && b.vz > 0) lb = m.landing();
    this.land.visible = !!(lb && lb.z > 0); if (lb && this.land.visible) { this.land.position.set(C.x + lb.x, Y0 + 0.014, C.z + lb.z); const out = !R.inCourt(lb.x, lb.z); this.land.material.color.setHex(out ? 0xff4d4d : 0xfde047); }
    const kd = m.kitchenDanger(me); this.kz.material.opacity = lerp(this.kz.material.opacity, kd ? 0.22 + Math.sin(this.T * 12) * 0.08 : 0, 0.2);
    const g = m.game, serving = m.phase === 'serve' && g.server === 0; if (serving) { const want = -Math.sign(R.sideX(0, g.serverSide)); this.box.position.set(C.x + want * D.HW / 2, Y0 + 0.013, C.z - (D.K + (D.HL - D.K) / 2)); }
    this.box.material.opacity = lerp(this.box.material.opacity, serving ? 0.2 + Math.sin(this.T * 5) * 0.06 : 0, 0.15); }
  camera(dt) { const c = E.camera, m = this.m, me = m.players[0], b = m.ball, C = this.C, k = this.snap ? 1 : Math.min(1, dt * 4.5); this.snap = false;
    if (this.fp) { this.camPos.set(C.x + me.x, Y0 + 1.6, C.z + me.z + 0.05); const bz = b.live ? Math.min(b.z, me.z - 1.5) : -D.HL; this.camLook.lerp(new THREE.Vector3(C.x + (b.live ? b.x : 0) * 0.85, Y0 + (b.live ? clamp(b.y, 0.3, 3) * 0.7 + 0.3 : 0.6), C.z + bz), this.snap ? 1 : Math.min(1, dt * 7)); c.position.copy(this.camPos); }
    else { const port = c.aspect < 1, pa_ = m.players[1] && m.players[1].team === 0 ? m.players[1] : null, mx = pa_ ? me.x * 0.55 + pa_.x * 0.45 : me.x, tx = C.x + mx * (port ? (pa_ ? 0.2 : 0.35) : 0.6), back = (port ? 8.6 : 5.8), pz = m.players[1] && m.players[1].team === 0 ? m.players[1].z + 1.2 : 0, zl = Math.min(Math.max(me.z, pz, D.K) + back, this.C.kind === 'night' || this.C.kind === 'quiet' ? 10.6 : this.C.kind === 'indoor' ? 12.5 : 15), tz = C.z + zl, ty = Y0 + (port ? 6.4 : 4.3) + Math.max(0, Math.max(me.z, D.K) + back - zl) * 0.55; this.camPos.lerp(new THREE.Vector3(tx, ty, tz), k); c.position.copy(this.camPos); this.camLook.lerp(new THREE.Vector3(C.x + me.x * 0.25 + (b.live ? b.x * 0.15 : 0), Y0 + 0.2, C.z - (port ? 2.2 : 1.6) + me.z * 0.15 + Math.max(0, Math.max(me.z, D.K) + back - zl) * 0.45), k); }
    c.lookAt(this.camLook); const fov = this.fp ? 74 : (c.aspect < 1 ? 62 : 54); if (Math.abs(c.fov - fov) > 0.1) { c.fov = fov; c.updateProjectionMatrix(); } }
  applyFP() { const f = this.figs[0]; if (f.rig) { f.rig.head.visible = !this.fp; } this.snap = true; }
  toggleFP() { this.fp = !this.fp; S.opts.fp = this.fp; persist(); this.applyFP(); this.hint(this.fp ? '\uD83D\uDC41\uFE0F First-person: you ARE the player' : '\uD83C\uDFA5 Third-person view'); }
  focus() { const p = this.m.players[0]; return { x: this.C.x + p.x, y: 0, z: this.C.z + p.z }; }
  dispose() { E.scene.remove(this.group); this.group.traverse((o) => { if (o.isMesh || o.isInstancedMesh) { if (o.geometry && !o.geometry._shared) o.geometry.dispose(); const mm = Array.isArray(o.material) ? o.material : [o.material]; mm.forEach((x) => { if (x && !x._shared && x.map) x.map.dispose(); }); } });
    if (this.btex) this.btex.dispose(); this.ballTex.dispose(); [this.ball, this.shadow, this.trail, this.land, this.kz, this.box, ...this.rings].forEach((o) => o.material.dispose());
    this.defs.forEach((d) => { if (d.pet) this.game.petBusy(d.pet, false); }); if (this.night) setEnvironment(ENV);
    window.removeEventListener('keydown', this.keyD); if (this.ov) this.ov.remove(); const tz = $('touch'); if (tz) tz.style.display = ''; const hud = $('hud'); if (hud) hud.classList.remove('inmatch'); clearTimeout(this._ct); clearTimeout(this._ht); clearTimeout(this._ut); }
}
