// Shadowlight - procedural PBR surface textures (canvas): detail (R albedo multiplier, G roughness, B cavity/AO) + tangent normal map.
// Small (512²), generated once, shared by every zone: ~11 MB GPU total.
import * as THREE from 'three';
function noiseGen(seed) { const p = new Uint8Array(512); let s = seed * 9301 + 49297; for (let i = 0; i < 256; i++) p[i] = i; for (let i = 255; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = (s / 233280 * (i + 1)) | 0; [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 256; i++) p[i + 256] = p[i];
  const f = (t) => t * t * (3 - 2 * t), g = (h, x, y) => ((h & 1) ? x : -x) + ((h & 2) ? y : -y);
  const n = (x, y) => { const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y); const u = f(x), v = f(y), a = p[X] + Y, b = p[X + 1] + Y; return (1 - v) * ((1 - u) * g(p[a], x, y) + u * g(p[b], x - 1, y)) + v * ((1 - u) * g(p[a + 1], x, y - 1) + u * g(p[b + 1], x - 1, y - 1)); };
  return (x, y, oct = 4, per = 8) => { let t = 0, a = 0.5, fr = 1; for (let o = 0; o < oct; o++) { const P = per * fr; t += a * n((x * P) % (P) , (y * P) % P); a *= 0.5; fr *= 2; } return t; }; }
const N = 512;
function make(kind, seed) { const H = new Float32Array(N * N), A = new Float32Array(N * N), Rg = new Float32Array(N * N), nz = noiseGen(seed), nz2 = noiseGen(seed + 7);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const u = x / N, v = y / N, i = y * N + x; let h = 0, a = 1, r = 0.7; const n1 = nz(u, v, 5, 6), n2 = nz2(u, v, 3, 3);
    if (kind === 'plaster') { const crack = Math.abs(nz2(u, v, 4, 4)); h = n1 * 0.4 - (crack < 0.025 ? 0.8 : 0); a = 0.86 + n2 * 0.25 - (crack < 0.025 ? 0.3 : 0); r = 0.8 + n1 * 0.15; }
    else if (kind === 'rust') { const rs = n2 + n1 * 0.5; h = n1 * 0.5 + (rs > 0.15 ? 0.3 : 0); a = rs > 0.15 ? 0.7 + n1 * 0.2 : 1.0 + n1 * 0.15; r = rs > 0.15 ? 0.9 : 0.35 + n1 * 0.2; }
    else if (kind === 'tile') { const tx = (u * 8) % 1, ty = (v * 8) % 1, grout = tx < 0.05 || ty < 0.05; h = grout ? -0.6 : n1 * 0.12; a = grout ? 0.55 : 0.95 + n2 * 0.2 - Math.max(0, n1) * 0.4; r = grout ? 0.95 : 0.25 + Math.max(0, n2) * 0.6; }
    else if (kind === 'brick') { const row = Math.floor(v * 8), bx = (u * 4 + (row % 2) * 0.5) % 1, by = (v * 8) % 1, mortar = bx < 0.05 || by < 0.09; const moss = n2 + n1 * 0.4 > 0.12;
      h = mortar ? -0.6 : 0.2 + n1 * 0.3; a = mortar ? 0.6 : 0.9 + n1 * 0.3; if (moss) { h += 0.15; a *= 0.85; } r = moss ? 0.95 : 0.85; A[i] = a; H[i] = h; Rg[i] = r; continue; }
    H[i] = h; A[i] = a; Rg[i] = r; }
  const det = document.createElement('canvas'), nm = document.createElement('canvas'); det.width = det.height = nm.width = nm.height = N; const dc = det.getContext('2d'), nc = nm.getContext('2d'); const di = dc.createImageData(N, N), ni = nc.createImageData(N, N); const st = kind === 'tile' || kind === 'brick' ? 5 : 3;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x, j = i * 4; const hx = H[y * N + ((x + 1) % N)] - H[y * N + ((x - 1 + N) % N)], hy = H[((y + 1) % N) * N + x] - H[((y - 1 + N) % N) * N + x];
    let nx = -hx * st, ny = -hy * st, nzv = 1; const l = Math.hypot(nx, ny, nzv); nx /= l; ny /= l; nzv /= l; ni.data[j] = (nx * 0.5 + 0.5) * 255; ni.data[j + 1] = (ny * 0.5 + 0.5) * 255; ni.data[j + 2] = (nzv * 0.5 + 0.5) * 255; ni.data[j + 3] = 255;
    di.data[j] = Math.max(0, Math.min(1, A[i] / 1.3)) * 255; di.data[j + 1] = Math.max(0, Math.min(1, Rg[i])) * 255; di.data[j + 2] = Math.max(0, Math.min(1, 0.6 + H[i] * 0.5)) * 255; di.data[j + 3] = 255; }
  dc.putImageData(di, 0, 0); nc.putImageData(ni, 0, 0);
  const T = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t; };
  return { det: T(det), nrm: T(nm), canvas: det, ncanvas: nm }; }
const cache = {};
export function surface(kind) { return cache[kind] || (cache[kind] = make(kind, { plaster: 3, rust: 11, tile: 17, brick: 29 }[kind] || 5)); }
