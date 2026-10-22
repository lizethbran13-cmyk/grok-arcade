// Canvas textures. Every sign is drawn on a canvas with the SAME aspect as the plane it goes on, so nothing is ever stretched.
import * as THREE from 'three';
const cache = new Map();
export function canvasTex(key, wPx, hPx, draw) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = wPx; c.height = hPx; const g = c.getContext('2d'); draw(g, wPx, hPx);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.userData.keep = true; cache.set(key, t); return t;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export const LOGO = {
  ratita: (g, w, h) => { // Ratita Industries: magenta + cheese yellow
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ff3fb4'); gr.addColorStop(1, '#a3127a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffd23f'; const s = h * 0.36, cx = h * 0.55, cy = h * 0.5; // rat-head badge
    g.beginPath(); g.arc(cx, cy, s, 0, 7); g.fill(); g.fillStyle = '#a3127a'; g.beginPath(); g.arc(cx - s * 0.55, cy - s * 0.75, s * 0.42, 0, 7); g.arc(cx + s * 0.55, cy - s * 0.75, s * 0.42, 0, 7); g.fill();
    g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(cx - s * 0.55, cy - s * 0.75, s * 0.3, 0, 7); g.arc(cx + s * 0.55, cy - s * 0.75, s * 0.3, 0, 7); g.fill();
    g.fillStyle = '#2b0a22'; g.beginPath(); g.arc(cx - s * 0.3, cy - s * 0.05, s * 0.12, 0, 7); g.arc(cx + s * 0.3, cy - s * 0.05, s * 0.12, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.font = `900 ${h * 0.34}px system-ui,sans-serif`; g.fillText('RATITA', h * 1.05, h * 0.38);
    g.font = `800 ${h * 0.2}px system-ui,sans-serif`; g.fillStyle = '#ffe58a'; g.fillText('INDUSTRIES', h * 1.07, h * 0.72);
  },
  tortuga: (g, w, h) => { // Tortuga Tech: teal + shell hexes
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#16c79a'); gr.addColorStop(1, '#0b6e5a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const cx = h * 0.55, cy = h * 0.5, s = h * 0.36; g.fillStyle = '#e8ffef'; g.beginPath(); g.ellipse(cx, cy, s, s * 0.8, 0, 0, 7); g.fill();
    g.strokeStyle = '#0b6e5a'; g.lineWidth = h * 0.035; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s * 0.8); g.stroke(); }
    g.beginPath(); g.ellipse(cx, cy, s * 0.45, s * 0.36, 0, 0, 7); g.stroke();
    g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.font = `900 ${h * 0.34}px system-ui,sans-serif`; g.fillText('TORTUGA', h * 1.05, h * 0.38);
    g.font = `800 ${h * 0.2}px system-ui,sans-serif`; g.fillStyle = '#c9ffe9'; g.fillText('TECH · SHELL-TOUGH', h * 1.07, h * 0.72);
  },
};
// logo sign texture: aspect 3.6:1
export const logoTex = (k) => canvasTex('logo_' + k, 720, 200, LOGO[k]);
export function textTex(key, lines, wPx, hPx, o = {}) {
  return canvasTex(key, wPx, hPx, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, o.bg1 || '#2a1060'); gr.addColorStop(1, o.bg2 || '#120630'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    if (o.border !== false) { g.strokeStyle = o.border || '#ffd23f'; g.lineWidth = h * 0.05; rr(g, h * 0.04, h * 0.04, w - h * 0.08, h - h * 0.08, h * 0.1); g.stroke(); }
    g.textAlign = 'center'; g.textBaseline = 'middle'; const n = lines.length;
    lines.forEach((l, i) => { const fs = (o.size || 0.5) * h / n * (i === 0 ? 1 : 0.8); g.font = `900 ${fs}px system-ui,sans-serif`; g.fillStyle = i === 0 ? (o.fg || '#fff') : (o.fg2 || '#ffe58a'); g.fillText(l, w / 2, h * (i + 0.5) / n, w * 0.9); });
  });
}
export function stripeTex(key, a, b, n = 8) { const t = canvasTex(key, 64, 64, (g, w, h) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(i * w / n, 0, w / n, h); } }); return t; }
export function checkerTex(key, a, b, n = 8) { return canvasTex(key, 128, 128, (g, w, h) => { const s = w / n; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = (x + y) % 2 ? a : b; g.fillRect(x * s, y * s, s, s); } }); }
export function noiseTex(key, base, spread, n = 128) { return canvasTex(key, n, n, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${spread},${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }); }
LOGO.tv = (g, w, h) => { // Tortuga TV Network bug
  g.fillStyle = 'rgba(8,40,34,0.85)'; rr(g, 0, 0, w, h, h * 0.25); g.fill();
  const cx = h * 0.5, cy = h * 0.5, s = h * 0.32; g.fillStyle = '#16c79a'; g.beginPath(); g.ellipse(cx, cy, s, s * 0.82, 0, 0, 7); g.fill();
  g.fillStyle = '#e8ffef'; g.font = `900 ${h * 0.3}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TV', cx, cy + 1);
  g.textAlign = 'left'; g.font = `900 ${h * 0.3}px system-ui,sans-serif`; g.fillStyle = '#fff'; g.fillText('TORTUGA TV', h * 0.95, h * 0.38);
  g.font = `800 ${h * 0.18}px system-ui,sans-serif`; g.fillStyle = '#7fffd0'; g.fillText('● LIVE  NETWORK', h * 0.97, h * 0.72);
};
LOGO.ruff = (g, w, h) => { // Ruffsources guest booking
  g.fillStyle = '#3b4a8f'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(h * 0.5, h * 0.5, h * 0.33, 0, 7); g.fill();
  g.fillStyle = '#3b4a8f'; for (const [x, y, r] of [[0.5, 0.58, 0.13], [0.36, 0.38, 0.07], [0.5, 0.32, 0.07], [0.64, 0.38, 0.07]]) { g.beginPath(); g.arc(h * x, h * y, h * r, 0, 7); g.fill(); }
  g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.font = `900 ${h * 0.3}px system-ui,sans-serif`; g.fillText('RUFFSOURCES', h * 0.98, h * 0.38);
  g.font = `800 ${h * 0.18}px system-ui,sans-serif`; g.fillStyle = '#ffe58a'; g.fillText('GUEST BOOKING', h * 1.0, h * 0.72);
};
