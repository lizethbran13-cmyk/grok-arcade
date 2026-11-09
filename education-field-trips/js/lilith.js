// Lilith the Bot (Ratita Industries teacher, tested by Tortuga Tech). She is bolted to her stand in the Education Center and CAN'T MOVE,
// so on field trips she rides along on a tablet: a 3D tablet on Pi-rat's class-helper backpack, the big Depot screen, and the HUD tablet.
import * as THREE from 'three';
const PI = Math.PI;
// 2D face: navy screen, lavender eyes, yellow square glasses, smile, purple mortarboard cap (same look as her classroom body)
export function drawLilith(g, w, h, t = 0, mood = 'happy', talking = false, opts = {}) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0b1026'; g.fillRect(0, 0, w, h);
  const s = Math.min(w, h), cx = w / 2, cy = h * 0.56;
  // cap
  g.fillStyle = '#1e1b4b'; g.beginPath(); g.moveTo(cx - s * 0.42, cy - s * 0.36); g.lineTo(cx, cy - s * 0.5); g.lineTo(cx + s * 0.42, cy - s * 0.36); g.lineTo(cx, cy - s * 0.24); g.closePath(); g.fill();
  g.fillStyle = '#7c3aed'; g.fillRect(cx - s * 0.17, cy - s * 0.33, s * 0.34, s * 0.09); g.strokeStyle = '#facc15'; g.lineWidth = s * 0.018; g.beginPath(); g.moveTo(cx, cy - s * 0.37); g.lineTo(cx + s * 0.34, cy - s * 0.3); g.lineTo(cx + s * 0.34, cy - s * 0.14); g.stroke();
  g.fillStyle = '#facc15'; g.beginPath(); g.arc(cx + s * 0.34, cy - s * 0.12, s * 0.03, 0, 7); g.fill();
  // eyes
  const blink = (t % 3.6) < 0.12, ex = s * 0.19, ey = cy - s * 0.03; g.fillStyle = '#a78bfa'; g.shadowColor = '#a78bfa'; g.shadowBlur = s * 0.05;
  [-1, 1].forEach((sd) => { g.beginPath(); if (blink) g.fillRect(cx + sd * ex - s * 0.07, ey - s * 0.01, s * 0.14, s * 0.025); else if (mood === 'sad') g.ellipse(cx + sd * ex, ey + s * 0.02, s * 0.06, s * 0.06, 0, 0, 7); else g.ellipse(cx + sd * ex, ey, s * 0.065, s * 0.085, 0, 0, 7); g.fill(); });
  g.shadowBlur = 0; g.strokeStyle = '#fde68a'; g.lineWidth = s * 0.022; [-1, 1].forEach((sd) => g.strokeRect(cx + sd * ex - s * 0.11, ey - s * 0.11, s * 0.22, s * 0.22)); g.beginPath(); g.moveTo(cx - ex + s * 0.11, ey - s * 0.02); g.lineTo(cx + ex - s * 0.11, ey - s * 0.02); g.stroke();
  // mouth
  g.strokeStyle = '#a78bfa'; g.lineWidth = s * 0.04; g.lineCap = 'round'; g.beginPath();
  if (talking && Math.sin(t * 18) > 0) { g.fillStyle = '#a78bfa'; g.ellipse(cx, cy + s * 0.2, s * 0.08, s * 0.05, 0, 0, 7); g.fill(); }
  else if (mood === 'sad') { g.arc(cx, cy + s * 0.28, s * 0.09, PI * 1.15, PI * 1.85); g.stroke(); } else { g.arc(cx, cy + s * 0.13, s * 0.1, 0.2, PI - 0.2); g.stroke(); }
  // phone link to Lily + battery
  if (opts.lily !== false) { g.fillStyle = '#22c55e'; g.font = `900 ${Math.round(s * 0.085)}px system-ui`; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('📱 Lily', w * 0.04, h * 0.04); }
  if (opts.battery != null) { const b = opts.battery; g.strokeStyle = '#e2e8f0'; g.lineWidth = s * 0.012; const bw = s * 0.16, bh = s * 0.07, bx = w - bw - w * 0.06, by = h * 0.05; g.strokeRect(bx, by, bw, bh); g.fillStyle = b > 50 ? '#22c55e' : b > 25 ? '#facc15' : '#ef4444'; g.fillRect(bx + 2, by + 2, (bw - 4) * b / 100, bh - 4); g.fillRect(bx + bw, by + bh * 0.3, s * 0.015, bh * 0.4); }
  g.restore();
}
// live canvas texture whose plane matches the canvas aspect (never stretched)
export function lilithScreen(pw, ph, px = 256) { const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * ph / pw); const g = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); return { c, g, tex, m, draw(t, mood, talking, o) { drawLilith(g, c.width, c.height, t, mood, talking, o); tex.needsUpdate = true; } }; }
// the tablet that rides on Pi-rat's class-helper backpack (she can't walk, so she rides along)
export function makeTabletPack() { const root = new THREE.Group(); const mat = (c, r = 0.5, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.16), mat(0x7c3aed, 0.8)); pack.position.set(0, 0.42, -0.24); root.add(pack);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 8), mat(0x94a3b8, 0.3, 0.8)); pole.position.set(0, 0.8, -0.28); root.add(pole);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.03), mat(0x111827, 0.4)); frame.position.set(0, 1.12, -0.28); root.add(frame);
  const scr = lilithScreen(0.42, 0.3, 192); scr.m.position.set(0, 1.12, -0.297); scr.m.rotation.y = PI; root.add(scr.m);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), new THREE.MeshBasicMaterial({ color: 0x4c1d95 })); back.position.set(0, 1.12, -0.262); root.add(back);
  root.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return { root, scr }; }
