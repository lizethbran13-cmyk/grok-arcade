// Low-poly models: shared geometries/materials so memory stays tiny.
import * as THREE from 'three';
const MC = new Map();
export const mat = (c, o = {}) => { const k = c + JSON.stringify(o); if (!MC.has(k)) MC.set(k, new THREE.MeshLambertMaterial(Object.assign({ color: c }, o))); return MC.get(k); };
export const G = {
  box: new THREE.BoxGeometry(1, 1, 1), sph: new THREE.SphereGeometry(0.5, 14, 10), cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 14),
  cone: new THREE.ConeGeometry(0.5, 1, 12), plane: new THREE.PlaneGeometry(1, 1),
};
export function part(geo, c, x, y, z, sx = 1, sy = sx, sz = sx, o) { const m = new THREE.Mesh(G[geo], mat(c, o)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = false; return m; }
export function grp(...ch) { const g = new THREE.Group(); ch.forEach((c) => g.add(c)); return g; }

// Canvas text sign; plane sized to the canvas aspect so text is never stretched.
const TX = new Map();
export function sign(text, h = 0.6, bg = '#0f172a', fg = '#fde047', pad = 18) {
  const k = text + h + bg + fg; let t = TX.get(k);
  if (!t) { const c = document.createElement('canvas'), x = c.getContext('2d'), fs = 56; x.font = `900 ${fs}px system-ui, sans-serif`; const w = Math.ceil(x.measureText(text).width + pad * 2); c.width = Math.min(1024, w); c.height = fs + pad * 1.4 | 0;
    x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); x.fillStyle = fg; x.font = `900 ${fs}px system-ui, sans-serif`; x.textBaseline = 'middle'; x.textAlign = 'center'; const sc = Math.min(1, (c.width - pad * 2) / (w - pad * 2)); x.save(); x.translate(c.width / 2, c.height / 2); x.scale(sc, 1); x.fillText(text, 0, 2); x.restore();
    t = { tex: new THREE.CanvasTexture(c), a: c.width / c.height }; t.tex.colorSpace = THREE.SRGBColorSpace; t.tex.anisotropy = 4; TX.set(k, t); }
  const m = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ map: t.tex })); m.scale.set(h * t.a, h, 1); return m;
}

// ---------------- the family pets (correct species) ----------------
export function tortoise() { // Torty: desert tortoise, high domed tan/brown shell with scutes, scaly grey-tan legs
  const g = new THREE.Group();
  g.add(part('sph', 0x8b6a3e, 0, 0.42, 0, 1.15, 0.78, 1.35));
  for (const [x, z] of [[0, 0], [0.28, 0.3], [-0.28, 0.3], [0.28, -0.3], [-0.28, -0.3], [0, 0.5], [0, -0.5]]) g.add(part('sph', 0x6b4f2a, x, 0.62 + (x || z ? -0.06 : 0.12), z, 0.34, 0.12, 0.34));
  g.add(part('box', 0xc9a86a, 0, 0.18, 0, 1.0, 0.1, 1.2)); // plastron rim
  g.add(part('sph', 0xa8916b, 0, 0.36, 0.78, 0.36, 0.3, 0.42)); // head
  g.add(part('sph', 0x111111, 0.1, 0.42, 0.95, 0.05)); g.add(part('sph', 0x111111, -0.1, 0.42, 0.95, 0.05));
  for (const [x, z] of [[0.42, 0.45], [-0.42, 0.45], [0.42, -0.45], [-0.42, -0.45]]) g.add(part('cyl', 0x9c8560, x, 0.12, z, 0.24, 0.26, 0.24));
  { const tl = part('cone', 0x9c8560, 0, 0.22, -0.75, 0.12, 0.25, 0.12); tl.rotation.x = -Math.PI / 2; g.add(tl); }
  // manager badge
  g.add(part('box', 0xfde047, 0.3, 0.55, 0.55, 0.16, 0.16, 0.03));
  return g;
}
export function schnauzer() { // Candy: miniature schnauzer, salt-and-pepper grey, white beard & brows, folded ears
  const g = new THREE.Group(), grey = 0x6b7280, lt = 0xe5e7eb;
  g.add(part('box', grey, 0, 0.5, 0, 0.42, 0.38, 0.85));
  for (const [x, z] of [[0.14, 0.3], [-0.14, 0.3], [0.14, -0.3], [-0.14, -0.3]]) g.add(part('box', lt, x, 0.18, z, 0.12, 0.36, 0.12));
  g.add(part('box', grey, 0, 0.78, 0.48, 0.34, 0.32, 0.34)); g.add(part('box', grey, 0, 0.72, 0.72, 0.22, 0.2, 0.22)); // head + muzzle
  g.add(part('box', lt, 0, 0.6, 0.76, 0.24, 0.16, 0.24)); // beard
  g.add(part('box', lt, 0.08, 0.92, 0.66, 0.1, 0.05, 0.08)); g.add(part('box', lt, -0.08, 0.92, 0.66, 0.1, 0.05, 0.08)); // brows
  g.add(part('sph', 0x111111, 0, 0.78, 0.84, 0.07)); g.add(part('sph', 0x111111, 0.08, 0.85, 0.66, 0.045)); g.add(part('sph', 0x111111, -0.08, 0.85, 0.66, 0.045));
  g.add(part('box', 0x4b5563, 0.15, 0.95, 0.44, 0.08, 0.14, 0.12)); g.add(part('box', 0x4b5563, -0.15, 0.95, 0.44, 0.08, 0.14, 0.12));
  g.add(part('box', grey, 0, 0.75, -0.46, 0.08, 0.2, 0.08)); // docked tail
  g.add(part('box', 0x0ea5e9, 0, 0.66, 0.36, 0.44, 0.06, 0.08)); // K9 collar
  return g;
}
export function fancyRat(kind) { // Luna grey, Snowie white (pink eyes), Pi-rat brown with eye patch (one eye)
  const col = { luna: 0x9ca3af, snowie: 0xf8fafc, pirat: 0x8b5a2b }[kind], g = new THREE.Group();
  g.add(part('sph', col, 0, 0.22, 0, 0.36, 0.3, 0.6)); g.add(part('sph', col, 0, 0.27, 0.32, 0.26, 0.24, 0.3));
  g.add(part('sph', 0xf9a8d4, 0, 0.26, 0.48, 0.06)); // nose
  g.add(part('sph', 0xfbcfe8, 0.11, 0.42, 0.26, 0.13, 0.13, 0.05)); g.add(part('sph', 0xfbcfe8, -0.11, 0.42, 0.26, 0.13, 0.13, 0.05));
  const eye = kind === 'snowie' ? 0xdc2626 : 0x111111;
  g.add(part('sph', eye, 0.09, 0.32, 0.43, 0.05));
  if (kind === 'pirat') { g.add(part('box', 0x111111, -0.09, 0.32, 0.43, 0.09, 0.09, 0.03)); g.add(part('box', 0x111111, 0, 0.36, 0.38, 0.27, 0.02, 0.2)); }
  else g.add(part('sph', eye, -0.09, 0.32, 0.43, 0.05));
  const tail = part('cyl', 0xf9a8d4, 0, 0.12, -0.55, 0.04, 0.6, 0.04); tail.rotation.x = Math.PI / 2.4; g.add(tail);
  return g;
}
// passenger: shared parts, colour varies
const SKIN = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac], SHIRT = [0xef4444, 0x3b82f6, 0x22c55e, 0xa855f7, 0xf59e0b, 0x14b8a6, 0xec4899, 0x64748b];
export function person(i) {
  const g = new THREE.Group();
  g.add(part('cyl', 0x1e293b, 0, 0.32, 0, 0.32, 0.64, 0.26));
  g.add(part('cyl', SHIRT[i % SHIRT.length], 0, 0.85, 0, 0.42, 0.5, 0.3));
  g.add(part('sph', SKIN[i % SKIN.length], 0, 1.28, 0, 0.34));
  g.add(part('box', [0x111827, 0x78350f, 0xfde68a, 0x7c2d12][i % 4], 0, 1.43, -0.02, 0.34, 0.1, 0.34));
  g.add(part('box', [0x1d4ed8, 0xb91c1c, 0x15803d, 0x334155][(i >> 2) % 4], 0.3, 0.45, -0.1, 0.22, 0.4, 0.32)); // suitcase
  return g;
}
export function plane(col = 0x0ea5e9) {
  const g = new THREE.Group();
  const f = part('cyl', 0xf8fafc, 0, 2, 0, 2.2, 12, 2.2); f.rotation.x = Math.PI / 2; g.add(f);
  const n = part('sph', 0xf8fafc, 0, 2, 6, 2.2, 2.2, 2.4); g.add(n);
  const t = part('cone', 0xf8fafc, 0, 2.1, -7, 2.2, 3, 2.2); t.rotation.x = -Math.PI / 2; g.add(t);
  g.add(part('box', 0xe2e8f0, 0, 1.6, 0.5, 15, 0.25, 2.6));
  g.add(part('box', col, 0, 4, -7.2, 0.3, 3.2, 2.2));
  g.add(part('box', 0xe2e8f0, 0, 2.3, -7.4, 5.5, 0.2, 1.4));
  g.add(part('box', col, 0, 2.1, 0, 2.25, 0.35, 12.2));
  g.add(part('box', 0x0f172a, 0, 2.7, 6.6, 1.3, 0.4, 0.6));
  for (const x of [-4, 4]) { const e = part('cyl', 0x94a3b8, x, 1.1, 1.4, 0.8, 2, 0.8); e.rotation.x = Math.PI / 2; g.add(e); }
  return g;
}
