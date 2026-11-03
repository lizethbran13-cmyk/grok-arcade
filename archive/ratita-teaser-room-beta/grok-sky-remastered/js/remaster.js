'use strict';
// GROK SKY REMASTERED (Tortuga Remaster Works, issue #62): puffy lit clouds, moving weather fronts (rain, snow, thunder cells),
// a glass-cockpit PFD with weather radar, and the Pet Crew weather station at every start airport.
(() => {
const G = SKY.Game, low = SKY.lowSpec, $ = (id) => document.getElementById(id);
const R = SKY.Remaster = { fronts: [], pfdOn: true, inFront: null, zapCd: 0, flashT: 0 };
const rng = (s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
// ------------------------------------------------------------ clouds: lit cumulus puffs (1 draw call)
function buildClouds(sc) {
  sc.children.forEach((o) => { if (o.isInstancedMesh && o.geometry.type === 'BoxGeometry' && o.material.opacity === 0.85) o.visible = false; }); // old box clouds
  const src = SKY.World.clouds || [], r = rng(4242), puffs = [];
  const step = low ? 2 : 1;
  for (let i = 0; i < src.length; i += 4 * step) { const c = src[i]; const n = low ? 5 : 8, R0 = c[3];
    for (let k = 0; k < n; k++) { const a = r() * 6.283, d = r() * R0 * 0.9; puffs.push([c[0] + Math.cos(a) * d, c[2] + (k < 2 ? R0 * 0.18 : r() * R0 * 0.2), c[1] + Math.sin(a) * d * 0.7, R0 * (0.35 + r() * 0.35)]); }
  }
  const geo = new THREE.IcosahedronGeometry(1, 1); geo.translate(0, 0.25, 0);
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x8aa0b8, emissiveIntensity: 0.35, flatShading: true });
  const im = new THREE.InstancedMesh(geo, mat, puffs.length), m4 = new THREE.Matrix4();
  puffs.forEach((p, i) => { m4.makeScale(p[3], p[3] * 0.55, p[3]); m4.setPosition(p[0], p[1], p[2]); im.setMatrixAt(i, m4); });
  im.frustumCulled = false; sc.add(im); R.clouds = im;
}
// ------------------------------------------------------------ weather fronts
const KINDS = { rain: { col: 0x8f9aa8, name: '🌧 Rain front', turb: 0.6 }, snow: { col: 0xd9e2ec, name: '🌨 Snow squall', turb: 0.5 }, thunder: { col: 0x4b5263, name: '⛈ Thunder cell', turb: 1.2 } };
function buildFronts(sc) {
  const defs = [['thunder', 7000, -4500, 0.6, 2], ['rain', 26000, -8000, -0.5, 1], ['snow', 50000, -24000, 0.4, 1.3], ['rain', 20000, 22000, 0.3, -1], ['thunder', 36000, 30000, -0.7, 0.5], ['rain', -20000, -2000, 0.9, 0.2]];
  const geo = new THREE.IcosahedronGeometry(1, 1), m4 = new THREE.Matrix4(), r = rng(77);
  for (const d of defs) {
    const K = KINDS[d[0]], rad = d[0] === 'thunder' ? 2600 : 3800, n = low ? 18 : 30;
    const mat = new THREE.MeshLambertMaterial({ color: K.col, emissive: d[0] === 'snow' ? 0xb8c4d0 : 0x20242c, emissiveIntensity: d[0] === 'snow' ? 0.6 : 0.4, flatShading: true });
    const im = new THREE.InstancedMesh(geo, mat, n);
    for (let k = 0; k < n; k++) { const a = r() * 6.283, dd = Math.sqrt(r()) * rad * 0.8, s = 500 + r() * 700; m4.makeScale(s, s * (d[0] === 'thunder' ? 1.4 : 0.6), s); m4.setPosition(Math.cos(a) * dd, 1500 + r() * 900 + (d[0] === 'thunder' ? r() * 1200 : 0), Math.sin(a) * dd); im.setMatrixAt(k, m4); }
    im.frustumCulled = false; im.position.set(d[1], 0, d[2]); sc.add(im);
    R.fronts.push({ kind: d[0], K, x: d[1], z: d[2], x0: d[1], z0: d[2], vx: d[3] * 14, vz: d[4] * 9, rad, mesh: im, warned: false });
  }
  // precipitation box around the camera (1 draw call)
  const N = low ? 900 : 1800, pos = new Float32Array(N * 6); R.rainN = N;
  for (let i = 0; i < N; i++) { const x = (Math.random() - 0.5) * 120, y = Math.random() * 90, z = (Math.random() - 0.5) * 120; pos.set([x, y, z, x, y - 2.2, z], i * 6); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  R.rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xc8d6e6, transparent: true, opacity: 0.55, depthWrite: false })); R.rain.frustumCulled = false; R.rain.visible = false; sc.add(R.rain);
}
function updateFronts(dt) {
  const pl = G.plane, cam = G.camPos; R.inFront = null; let best = 1e9;
  for (const f of R.fronts) {
    f.x += f.vx * dt; f.z += f.vz * dt; if (Math.hypot(f.x - f.x0, f.z - f.z0) > 14000) { f.vx = -f.vx; f.vz = -f.vz; }
    f.mesh.position.set(f.x, 0, f.z); f.mesh.rotation.y += dt * 0.01;
    const d = Math.hypot(cam.x - f.x, cam.z - f.z); if (d < f.rad && d < best) { best = d; R.inFront = f; R.frontK = 1 - d / f.rad; }
  }
  const f = R.inFront, inPlay = G.state === 'play';
  R.rain.visible = !!f && cam.y < 3200;
  if (f) {
    const snow = f.kind === 'snow'; R.rain.material.color.setHex(snow ? 0xffffff : 0xc8d6e6);
    const a = R.rain.geometry.attributes.position, A = a.array, sp = (snow ? 9 : 55) * dt;
    for (let i = 0; i < R.rainN; i++) { const o = i * 6; A[o + 1] -= sp; A[o + 4] -= sp; if (snow) { A[o] += Math.sin(i + G.time) * dt * 2; A[o + 3] = A[o]; A[o + 4] = A[o + 1] - 0.5; } else A[o + 4] = A[o + 1] - 2.2; if (A[o + 1] < 0) { A[o + 1] += 90; A[o + 4] = A[o + 1] - (snow ? 0.4 : 2.2); } }
    a.needsUpdate = true; R.rain.position.set(cam.x, cam.y - 45, cam.z);
    if (inPlay && !pl.onGround && pl.pos.y > 300 && Math.hypot(pl.pos.x - f.x, pl.pos.z - f.z) < f.rad) {
      if (!f.warned) { f.warned = true; SKY.toast(f.K.name + ' — bumpy air! ' + (f.kind === 'thunder' ? 'Stay out of the dark core or you WILL get zapped ⚡' : 'Seatbelt sign on.'), 'warn'); G.onTurbulence && G.onTurbulence(f.K.turb); }
      if (pl.turb.on <= 0) { pl.turb.on = 3; pl.turb.str = f.K.turb * (0.6 + R.frontK); pl.turb.t = 3; }
      // consequence: the core of a thunder cell trips the lightning-storm emergency (checklist + safe-landing score, never a dead end)
      R.zapCd -= dt;
      if (f.kind === 'thunder' && R.frontK > 0.55 && R.zapCd <= 0 && SKY.Disasters) { R.zapCd = 40; R.flashT = 0.25; if (!SKY.Disasters.has('storm') && !SKY.Disasters.mirrored) SKY.Disasters.trigger('storm', { by: 'Thunder cell' }); }
      if (f.kind === 'snow' && R.frontK > 0.6) pl.vel.multiplyScalar(1 - dt * 0.02); // icing drag
    }
  } else for (const q of R.fronts) if (Math.hypot(pl.pos.x - q.x, pl.pos.z - q.z) > q.rad * 1.3) q.warned = false;
}
function skyTint() {
  const f = R.inFront; if (!f || G.state === 'title') return;
  const bg = G.scene.background, k = Math.min(1, R.frontK * 1.6) * (f.kind === 'thunder' ? 0.7 : 0.45);
  bg.lerp(new THREE.Color(f.kind === 'snow' ? 0xc8d0da : 0x5d6674), k);
  if (R.flashT > 0) bg.setRGB(0.9, 0.93, 1); else if (f.kind === 'thunder' && Math.random() < 0.004) { R.flashT = 0.12; SKY.Audio.play && SKY.Audio.play('boom'); }
  G.scene.fog.color.copy(bg);
}
// ------------------------------------------------------------ glass cockpit PFD + weather radar
function buildPFD() {
  const c = document.createElement('canvas'); c.id = 'pfd'; c.width = 360; c.height = 220;
  c.setAttribute('style', 'position:absolute;left:50%;bottom:10px;transform:translateX(-50%);width:300px;height:183px;border-radius:12px;border:2px solid #334155;background:#0b1220;box-shadow:0 4px 18px rgba(0,0,0,.5);pointer-events:none;display:none;z-index:5');
  $('hud').appendChild(c); R.pfd = c; R.ctx = c.getContext('2d');
  const b = document.createElement('button'); b.id = 'pfdbtn'; b.textContent = '🖥 PFD';
  b.setAttribute('style', 'position:fixed;right:8px;top:46%;z-index:30;padding:6px 9px;border-radius:10px;border:1px solid #64748b;background:#0f172acc;color:#e2e8f0;font:bold 12px system-ui;display:none');
  b.onclick = (e) => { e.stopPropagation(); R.pfdOn = !R.pfdOn; try { localStorage.setItem('grokSkyPFD', R.pfdOn ? '1' : '0'); } catch (er) { } };
  document.body.appendChild(b); R.pfdBtn = b;
  try { R.pfdOn = localStorage.getItem('grokSkyPFD') !== '0'; } catch (e) { }
}
function drawPFD() {
  const P = SKY.Player, pl = G.plane, show = G.state === 'play' && P.mode === 'pilot' && P.frame === 'plane';
  R.pfdBtn.style.display = show ? 'block' : 'none'; const on = show && R.pfdOn; R.pfd.style.display = on ? 'block' : 'none';
  const ins = $('instr'); if (ins) ins.style.visibility = on ? 'hidden' : '';
  if (!on) return;
  const x = R.ctx, W = 360, H = 220, elec = SKY.Disasters && SKY.Disasters.elecOut();
  x.fillStyle = '#0b1220'; x.fillRect(0, 0, W, H);
  if (elec) { x.fillStyle = '#f87171'; x.font = 'bold 18px monospace'; x.fillText('⚠ PFD FAIL — ELEC', 70, 110); x.font = '12px monospace'; x.fillText('start the APU (checklist)', 92, 132); return; }
  const e = new THREE.Euler().setFromQuaternion(pl.quat, 'YXZ'), pitch = e.x, roll = e.z;
  // attitude ball
  const cx = 150, cy = 100, rr = 72; x.save(); x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.clip(); x.translate(cx, cy); x.rotate(roll);
  const py = pitch * 180 / Math.PI * 2.4; x.fillStyle = '#2f7de1'; x.fillRect(-150, -300 + py, 300, 300); x.fillStyle = '#8a5a2b'; x.fillRect(-150, py, 300, 300);
  x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.moveTo(-150, py); x.lineTo(150, py); x.stroke(); x.font = '10px monospace'; x.fillStyle = '#fff';
  for (let d = -20; d <= 20; d += 10) if (d) { const yy = py - d * 2.4; x.beginPath(); x.moveTo(-18, yy); x.lineTo(18, yy); x.stroke(); x.fillText(Math.abs(d), 22, yy + 3); }
  x.restore(); x.strokeStyle = '#fde047'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 40, cy); x.lineTo(cx - 12, cy); x.lineTo(cx, cy + 8); x.lineTo(cx + 12, cy); x.lineTo(cx + 40, cy); x.stroke();
  x.strokeStyle = '#475569'; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.stroke();
  // tapes
  const kts = Math.round(pl.speed() * 1.944), ft = Math.round(pl.altitude() * 3.281), vs = Math.round(pl.vel.y * 196.85);
  const tape = (tx, val, step, col, lab) => { x.fillStyle = '#111827'; x.fillRect(tx, 20, 52, 160); x.save(); x.beginPath(); x.rect(tx, 20, 52, 160); x.clip(); x.fillStyle = '#cbd5e1'; x.font = '10px monospace';
    const base = Math.floor(val / step) * step; for (let k = -4; k <= 4; k++) { const v = base + k * step; if (v < 0) continue; const yy = 100 - (v - val) / step * 18; x.fillText(String(v), tx + 6, yy + 3); } x.restore();
    x.fillStyle = col; x.fillRect(tx - 2, 90, 56, 20); x.fillStyle = '#000'; x.font = 'bold 13px monospace'; x.fillText(String(val), tx + 3, 105); x.fillStyle = '#94a3b8'; x.font = '10px monospace'; x.fillText(lab, tx + 8, 16); };
  tape(18, kts, 10, kts < pl.T.vr * 1.944 * 0.8 && !pl.onGround ? '#f87171' : '#e2e8f0', 'KTS'); tape(232 - 0, ft, 100, ft < 500 && pl.vel.y < -8 ? '#f87171' : '#e2e8f0', 'FT');
  x.fillStyle = vs < -1500 ? '#f87171' : '#86efac'; x.font = 'bold 11px monospace'; x.fillText('V/S ' + vs, 232, 196);
  // heading strip
  const hd = pl.heading(); x.fillStyle = '#111827'; x.fillRect(80, 182, 140, 30); x.fillStyle = '#e2e8f0'; x.font = 'bold 13px monospace'; x.fillText(String(Math.round(hd)).padStart(3, '0') + '°', 132, 202);
  x.fillStyle = '#94a3b8'; x.font = '10px monospace'; x.fillText('THR ' + Math.round(pl.throttle * 100) + '%', 18, 196); if (pl.stall) { x.fillStyle = '#f87171'; x.font = 'bold 14px monospace'; x.fillText('STALL', 128, 40); }
  // weather radar (top-right): fronts within 20 km, nose up
  const rx = 320, ry = 60, rs = 36, hr = hd * Math.PI / 180; x.fillStyle = '#020617'; x.beginPath(); x.arc(rx, ry, rs, Math.PI, 0); x.lineTo(rx + rs, ry + 4); x.lineTo(rx - rs, ry + 4); x.fill();
  for (const f of R.fronts) { const dx = f.x - pl.pos.x, dz = f.z - pl.pos.z, fw = dx * Math.sin(hr) - dz * Math.cos(hr), rt = dx * Math.cos(hr) + dz * Math.sin(hr), s = rs / 20000;
    if (fw < -2000 || Math.hypot(fw, rt) > 22000) continue; x.fillStyle = f.kind === 'thunder' ? 'rgba(239,68,68,.85)' : f.kind === 'snow' ? 'rgba(226,232,240,.8)' : 'rgba(34,197,94,.8)'; x.beginPath(); x.arc(rx + rt * s, ry - fw * s, Math.max(3, f.rad * s), 0, 7); x.fill(); }
  x.fillStyle = '#fde047'; x.fillRect(rx - 2, ry - 2, 4, 4); x.fillStyle = '#94a3b8'; x.font = '9px monospace'; x.fillText('WX 20km', rx - 22, ry + 16);
  if (R.inFront) { x.fillStyle = R.inFront.kind === 'thunder' ? '#f87171' : '#fde047'; x.font = 'bold 10px monospace'; x.fillText(R.inFront.K.name.split(' ').slice(1).join(' ').toUpperCase(), 290, 122); }
  x.fillStyle = '#f9a8d4'; x.font = '10px system-ui'; x.fillText('🐀 Snowie', 296, 140); x.fillText('co-pilot', 300, 154);
}
// ------------------------------------------------------------ Pet Crew weather station (cameos)
function box(g, w, h, d, col, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: col })); m.position.set(x, y, z); g.add(m); return m; }
function rat(col, eyePatch) { const g = new THREE.Group(); box(g, 0.5, 0.4, 0.9, col, 0, 0.3, 0); box(g, 0.38, 0.34, 0.4, col, 0, 0.45, -0.58); box(g, 0.14, 0.14, 0.04, 0xf9a8d4, -0.14, 0.68, -0.6); box(g, 0.14, 0.14, 0.04, 0xf9a8d4, 0.14, 0.68, -0.6); box(g, 0.08, 0.08, 0.06, 0xfb7185, 0, 0.42, -0.8);
  box(g, 0.06, 0.06, 0.04, 0x111111, 0.1, 0.52, -0.78); if (eyePatch) box(g, 0.14, 0.12, 0.04, 0x111111, -0.1, 0.52, -0.79); else box(g, 0.06, 0.06, 0.04, 0x111111, -0.1, 0.52, -0.78);
  const t = box(g, 0.06, 0.06, 0.9, 0xf0b4c0, 0, 0.3, 0.85); t.rotation.x = 0.3; g.scale.setScalar(1.6); return g; }
function dog() { const g = new THREE.Group(), c = 0x8b8f96; box(g, 0.6, 0.5, 1.1, c, 0, 0.7, 0); [[-0.2, -0.4], [0.2, -0.4], [-0.2, 0.4], [0.2, 0.4]].forEach((p) => box(g, 0.15, 0.45, 0.15, 0x5b5f66, p[0], 0.23, p[1])); box(g, 0.45, 0.45, 0.45, c, 0, 1.05, -0.62); box(g, 0.3, 0.2, 0.3, 0xd4d4d8, 0, 0.85, -0.85); box(g, 0.1, 0.1, 0.05, 0x111111, 0, 0.98, -1.0); box(g, 0.08, 0.06, 0.04, 0x111111, -0.12, 1.15, -0.86); box(g, 0.08, 0.06, 0.04, 0x111111, 0.12, 1.15, -0.86); box(g, 0.12, 0.2, 0.08, 0x5b5f66, -0.17, 1.35, -0.6); box(g, 0.12, 0.2, 0.08, 0x5b5f66, 0.17, 1.35, -0.6); box(g, 0.08, 0.25, 0.08, c, 0, 1.0, 0.6); g.scale.setScalar(1.5); return g; }
function tortoise() { const g = new THREE.Group(); box(g, 1.1, 0.5, 1.3, 0x8a6b3c, 0, 0.45, 0); box(g, 0.8, 0.25, 1.0, 0xa3824a, 0, 0.8, 0); box(g, 0.36, 0.3, 0.4, 0x9a8a5a, 0, 0.4, -0.85); box(g, 0.06, 0.06, 0.04, 0x111111, 0.1, 0.48, -1.05); box(g, 0.06, 0.06, 0.04, 0x111111, -0.1, 0.48, -1.05);
  [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].forEach((p) => box(g, 0.25, 0.3, 0.25, 0x9a8a5a, p[0], 0.15, p[1])); g.scale.setScalar(1.6); return g; }
function tag(txt, w) { w = w || 256; const c = document.createElement('canvas'); c.width = w; c.height = 64; const x = c.getContext('2d'); x.font = 'bold 26px system-ui'; const tw = Math.min(w - 8, x.measureText(txt).width + 24); x.fillStyle = 'rgba(15,23,42,.85)'; x.fillRect((w - tw) / 2, 8, tw, 48); x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(txt, w / 2, 42);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false })); s.scale.set(w / 64, 1, 1); return s; }
function buildStation(sc) {
  const g = R.station = new THREE.Group();
  box(g, 12, 0.3, 9, 0x94a3b8, 0, 0.15, 0); box(g, 4, 3.2, 3, 0xf8fafc, -2, 1.9, 1.5); box(g, 4.2, 0.3, 3.2, 0x0ea5e9, -2, 3.6, 1.5); box(g, 1.2, 1.6, 0.1, 0x1e293b, -2, 1.7, -0.01); box(g, 0.9, 0.9, 0.1, 0x7dd3fc, -3.2, 2.3, -0.01);
  box(g, 0.12, 6, 0.12, 0xcbd5e1, 3, 3, 2); const vane = box(g, 1.6, 0.1, 0.1, 0xef4444, 3, 6, 2); R.vane = vane; box(g, 0.6, 0.6, 0.6, 0xf8fafc, 3, 6.4, 2);
  const sock = box(g, 0.5, 0.5, 1.6, 0xf97316, 3.3, 5, 2.9); sock.rotation.y = 0.6; box(g, 1.8, 1.1, 0.12, 0x0f172a, 1, 1.2, -2.8); box(g, 1.6, 0.9, 0.05, 0x22c55e, 1, 1.2, -2.87); box(g, 0.1, 0.8, 0.1, 0x334155, 1, 0.4, -2.8);
  box(g, 2, 0.6, 1, 0x7c2d12, -2, 0.45, -2.3); box(g, 0.5, 0.4, 0.5, 0xfde047, -2.5, 0.95, -2.3);
  const pets = [['Luna', rat(0x9ca3af), -4.2, -2.2, 2.4], ['Pi-rat', rat(0x8b5a2b, true), -1.4, -2.6, 3.4], ['Snowie', rat(0xffffff), 1.4, -2.2, 2.4], ['Candy', dog(), 3.8, -0.6, 3.4], ['Torty', tortoise(), 4.6, -3.6, 2.2]];
  R.pets = pets.map(([n, m, px, pz, ty], i) => { m.position.set(px, 0.3, pz); m.rotation.y = 0.25 - i * 0.12; m.scale.multiplyScalar(n === 'Torty' ? 0.9 : 1.4); g.add(m); const t = tag(n, 160); t.position.set(px, ty + 0.6, pz); g.add(t); return m; });
  const t = tag('☁ Pet Crew Weather Station', 512); t.scale.multiplyScalar(1.1); t.position.set(-2, 6.4, 1.5); g.add(t);
  g.visible = false; sc.add(g);
}
function placeStation() {
  const pl = G.plane, a = pl.axes(), p = pl.pos.clone().addScaledVector(a.r, -48).addScaledVector(a.f, 30);
  p.y = SKY.World.heightAt(p.x, p.z) + 0.05; R.station.position.copy(p); R.station.rotation.y = Math.atan2(-a.r.x, -a.r.z) + Math.PI; R.station.visible = true;
}
// ------------------------------------------------------------ hooks
const _init = G.init.bind(G);
G.init = function () { _init(); buildClouds(this.scene); buildFronts(this.scene); buildPFD(); buildStation(this.scene);
  const vt = document.querySelector('#title .vertag'); if (vt) vt.innerHTML = '✨ <b style="color:#fde047">REMASTERED</b> · ☁ new clouds · ⛈ moving weather fronts · 🖥 glass cockpit + weather radar · 🐀 Pet Crew weather station<br>' + vt.innerHTML;
  const lg = document.querySelector('#hud .ver'); if (lg) lg.textContent = '4.2R'; };
const _start = G.start.bind(G);
G.start = function (c, m) { _start(c, m); R.zapCd = 0; try { placeStation(); } catch (e) { } };
const _update = G.update.bind(G);
G.update = function (dt) { _update(dt); try { updateFronts(dt); if (R.flashT > 0) R.flashT -= dt; if (R.vane) R.vane.rotation.y += dt * 0.6; if (R.pets && R.station.visible) R.pets.forEach((m, i) => { m.position.y = 0.3 + Math.abs(Math.sin(G.time * 3 + i)) * 0.15; }); } catch (e) { console.warn(e); } };
const _render = G.render.bind(G);
G.render = function (dt) { if (R.fronts.length) { const sc = this.scene; const old = this.renderer.render; this.renderer.render = (s, c) => { skyTint(); if (R.camOverride) R.camOverride(c); old.call(this.renderer, s, c); }; _render(dt); this.renderer.render = old; } else _render(dt); try { if (R.pfd) drawPFD(); } catch (e) { console.warn(e); } };
})();
