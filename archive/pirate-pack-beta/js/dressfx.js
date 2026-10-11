// Dresser Shop wearables: fur skins, clothes, extras and pirate hats, baked into the rat model (smooth merged primitives).
import { P } from './geo.js';
import { torus, cone, leaf, sph, cyl, capsule, rcyl } from './shapes.js';
const PI = Math.PI;
// fur recolours (fur / dark ears / belly / eye). metal = shiny body, glow = glowing belly, pat = pattern
export const SKINS = {
  ocean: { fur: 0x3b82f6, dark: 0x1e40af, belly: 0xbfe3ff }, mint: { fur: 0x86efac, dark: 0x4ade80, belly: 0xf0fdf4 },
  bubblegum: { fur: 0xff8fd0, dark: 0xec4899, belly: 0xffe4f3 }, midnight: { fur: 0x312e81, dark: 0x1e1b4b, belly: 0x6366f1, pat: 'stars' },
  calico: { fur: 0xfff3e0, dark: 0xb45309, belly: 0xffffff, pat: 'calico' }, zebra: { fur: 0xf8fafc, dark: 0x111827, belly: 0xffffff, pat: 'zebra' },
  lava: { fur: 0x3f2a2a, dark: 0x1f1414, belly: 0xff7a1a, glow: true, eye: 0xffb020 }, ghost: { fur: 0xe6f6ff, dark: 0xbfdbfe, belly: 0xffffff, eye: 0x22d3ee, glowEye: true },
  gold: { fur: 0xffc93c, dark: 0xd4a017, belly: 0xffe68a, metal: true }, rainbow: { fur: 0xff6b6b, dark: 0xa855f7, belly: 0xfff7ae, pat: 'rainbow' },
};
const RB = [0xff4d4d, 0xff9f1c, 0xffe14d, 0x4ade80, 0x38bdf8, 0x8b5cf6];
// torso pattern extras (t = torso multi-builder)
export function skinPattern(t, S) {
  if (!S || !S.pat) return;
  if (S.pat === 'calico') [[0.2, 0.5, -0.1, 0xb45309], [-0.18, 0.55, -0.35, 0x111827], [0.05, 0.6, 0.1, 0xf59e0b], [-0.25, 0.42, 0.05, 0xb45309]].forEach(([x, y, z, c]) => t.f.add(P.sphere, c, x, y, z, 0, 0, 0, 0.17, 0.09, 0.18));
  if (S.pat === 'zebra') for (let i = 0; i < 6; i++) t.f.add(torus(0.1, 40, PI), 0x111827, 0, 0.36, -0.5 + i * 0.13, 0, 0, 0, 0.355 * Math.sqrt(Math.max(0.2, 1 - Math.pow((-0.5 + i * 0.13 + 0.08) / 0.55, 2))), 0.31, 0.25);
  if (S.pat === 'rainbow') for (let i = 0; i < 6; i++) t.f.add(torus(0.16, 40, PI), RB[i], 0, 0.36, -0.52 + i * 0.13, 0, 0, 0, 0.36 * Math.sqrt(Math.max(0.2, 1 - Math.pow((-0.52 + i * 0.13 + 0.08) / 0.56, 2))), 0.31, 0.3);
  if (S.pat === 'stars') for (let i = 0; i < 7; i++) t.l.add(P.sphere, 0xfff7ae, Math.cos(i * 2.4) * 0.2, 0.6 + Math.sin(i * 1.3) * 0.05, -0.4 + i * 0.09, 0, 0, 0, 0.025, 0.025, 0.025, 1);
  if (S.glow) t.l.add(P.sphere, 0xff7a1a, 0, 0.25, 0.06, 0, 0, 0, 0.25, 0.17, 0.35, 0.8);
}
// clothes + body extras on the torso (t), head extras on the head builder (h)
export function dressParts(t, h, d) {
  if (!d) return; const top = d.top, acc = d.acc;
  const shell = (col, cy, ry, rz, cz, bucket = 'f', fn) => { if (fn) t[bucket].addFn(P.sphere, fn, 0, cy, cz, 0, 0, 0, 0.378, ry, rz); else t[bucket].add(P.sphere, col, 0, cy, cz, 0, 0, 0, 0.378, ry, rz); };
  const buttons = (col, n = 3) => { for (let i = 0; i < n; i++) t.x.add(P.sphere, col, 0, 0.26 + i * 0.09, 0.4 - i * 0.04, 0, 0, 0, 0.035, 0.035, 0.02); };
  if (top === 'sash') { t.f.add(torus(0.13, 40), 0xdc2626, 0, 0.38, -0.02, 0.45, 0, 0, 0.375, 0.33, 0.3); t.x.add(P.sphere, 0xffc83d, 0.3, 0.32, 0.08, 0, 0, 0, 0.06, 0.06, 0.03); t.f.add(P.capsule, 0xdc2626, 0.33, 0.18, 0.12, 0.2, 0, 0.3, 0.06, 0.14, 0.04); }
  else if (top === 'stripes') shell(0, 0.42, 0.27, 0.44, -0.04, 'f', (c, x, y, z) => c.set(Math.sin(z * 48) > 0 ? 0xffffff : 0x1d4ed8));
  else if (top === 'vest') { shell(0x8b5a2b, 0.44, 0.26, 0.3, 0.02, 'm'); buttons(0xffc83d); t.m.add(P.torus, 0x6b3f1d, 0, 0.42, 0.3, 0, 0, 0, 0.32, 0.27, 0.15); }
  else if (top === 'pcoat') { shell(0xb91c1c, 0.41, 0.29, 0.54, -0.1); t.x.add(torus(0.08, 40), 0xffc83d, 0, 0.4, 0.4, 0, 0, 0, 0.3, 0.26, 0.4); buttons(0xffc83d, 4); [-1, 1].forEach((s) => t.f.add(P.sphere, 0x991b1b, s * 0.14, 0.32, -0.66, 0.5, 0, 0, 0.12, 0.05, 0.2)); }
  else if (top === 'captcoat') { shell(0x1e3a8a, 0.41, 0.29, 0.54, -0.1); buttons(0xffc83d, 4); t.x.add(torus(0.08, 40), 0xffc83d, 0, 0.4, 0.4, 0, 0, 0, 0.3, 0.26, 0.4);
    [-1, 1].forEach((s) => { t.x.add(P.sphere, 0xffc83d, s * 0.3, 0.6, 0.12, 0, 0, s * 0.4, 0.12, 0.04, 0.12); for (let i = 0; i < 5; i++) t.x.add(P.cyl, 0xffd56a, s * (0.36 + Math.cos(i) * 0.02), 0.54, 0.04 + i * 0.04, 0, 0, s * 0.4, 0.008, 0.09, 0.008); }); }
  else if (top === 'lifevest') { t.g.add(P.rbox, 0xff7a1a, 0, 0.44, 0.02, 0, 0, 0, 0.8, 0.46, 0.56); [0.12, -0.12].forEach((z) => t.g.add(P.rboxS, 0xffffff, 0, 0.45, z, 0, 0, 0, 0.82, 0.08, 0.06)); t.x.add(P.sphere, 0xd1d5db, 0, 0.3, 0.3, 0, 0, 0, 0.04, 0.04, 0.02); }
  else if (top === 'hoodie') { shell(0xff6fb5, 0.42, 0.28, 0.48, -0.08); t.f.add(P.sphere, 0xff6fb5, 0, 0.6, 0.2, 0.4, 0, 0, 0.22, 0.12, 0.18); [-1, 1].forEach((s) => t.f.add(P.cyl, 0xffffff, s * 0.07, 0.36, 0.42, 0, 0, 0, 0.012, 0.16, 0.012)); t.l.add(P.sphere, 0x3ff0ff, 0, 0.62, -0.25, 0, 0, 0, 0.06, 0.06, 0.02, 0.6); }
  else if (top === 'cape') { t.f.add(P.sphere, 0x7c3aed, 0, 0.6, -0.3, 0.12, 0, 0, 0.42, 0.06, 0.55); t.f.add(P.torus, 0x5b21b6, 0, 0.5, 0.22, 0, 0, 0, 0.24, 0.2, 0.2); t.x.add(P.sphere, 0xffc83d, 0, 0.42, 0.33, 0, 0, 0, 0.05, 0.05, 0.03); }
  else if (top === 'scarf') { t.f.addFn(torus(0.3, 40), (c, x, y, z) => c.set(Math.sin(Math.atan2(y - 0.48, x) * 6) > 0 ? 0xef4444 : 0xfef3c7), 0, 0.48, 0.24, 0, 0, 0, 0.25, 0.23, 0.3); t.f.add(P.capsule, 0xef4444, 0.16, 0.32, 0.36, 0.3, 0, 0.4, 0.07, 0.22, 0.04); }
  else if (top === 'tutu') { for (let i = 0; i < 18; i++) { const a = i / 18 * PI * 2; t.f.add(P.sphere, i % 2 ? 0xff8fd0 : 0xffc2e6, Math.cos(a) * 0.38, 0.36 + Math.sin(a) * 0.33, -0.2, 0, 0, a, 0.14, 0.07, 0.1); } t.l.add(P.sphere, 0xfff3b0, 0, 0.7, -0.2, 0, 0, 0, 0.04, 0.04, 0.04, 1); }
  // body extras
  if (acc === 'spyglass') { t.x.add(P.cyl, 0xd4a017, 0.18, 0.72, -0.25, 0.3, 0, 1.1, 0.05, 0.5, 0.05); t.x.add(P.cyl, 0xb08d57, 0.38, 0.85, -0.2, 0.3, 0, 1.1, 0.065, 0.12, 0.065); t.m.add(torus(0.08, 40), 0x6b3f1d, 0, 0.4, 0, 0.6, 0, 0, 0.37, 0.33, 0.3); }
  if (acc === 'bowtie') { [-1, 1].forEach((s) => t.g.add(P.cone, 0xdc2626, s * 0.07, 0.37, 0.38, 0, 0, s * PI / 2, 0.06, 0.12, 0.04)); t.g.add(P.sphere, 0xb91c1c, 0, 0.37, 0.39, 0, 0, 0, 0.035); }
  if (acc === 'lei') for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2; t.g.add(P.sphere, [0xff4fa0, 0xffd23f, 0xffffff, 0xa78bfa][i % 4], Math.cos(a) * 0.25, 0.48 + Math.sin(a) * 0.23, 0.24, 0, 0, 0, 0.055, 0.055, 0.045); }
  if (!h) return;
  if (acc === 'patch') { h.g.add(P.sphere, 0x111111, 0.11, 0.06, 0.245, 0, 0, 0, 0.085, 0.08, 0.03); h.m.add(torus(0.07, 40), 0x111111, 0, 0.08, 0.0, PI / 2 + 0.05, 0, -0.28, 0.275, 0.275, 0.275); }
  else if (acc === 'hoop') h.x.add(torus(0.18, 24), 0xffc83d, -0.23, 0.04, -0.02, 0, PI / 2, 0, 0.05);
  else if (acc === 'shades') { [-1, 1].forEach((s) => h.g.add(P.rboxS, 0x111827, s * 0.11, 0.06, 0.25, 0, 0, 0, 0.13, 0.08, 0.03)); h.x.add(P.cyl, 0x111827, 0, 0.08, 0.255, 0, 0, PI / 2, 0.01, 0.08, 0.01); h.l.add(P.sphere, 0xffffff, 0.14, 0.085, 0.27, 0, 0, 0, 0.02, 0.012, 0.005, 0.3); }
  else if (acc === 'monocle') { h.x.add(torus(0.12, 24), 0xffc83d, -0.11, 0.05, 0.25, 0, 0, 0, 0.075); h.e.add(P.sphere, 0xe0f2fe, -0.11, 0.05, 0.25, 0, 0, 0, 0.07, 0.07, 0.01); h.x.add(P.cyl, 0xffc83d, -0.15, -0.08, 0.22, 0.2, 0, 0.3, 0.006, 0.2, 0.006); }
}
// dresser hats (into the outfit hat group builder b, local to the top of the head)
export function hatParts(b, o) {
  if (o === 'tricorn') { b.m.add(P.sphere, 0x1f1f2a, 0, 0.03, 0, 0, 0, 0, 0.2, 0.13, 0.2); for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + PI / 2; b.m.add(P.capsule, 0x1f1f2a, Math.cos(a) * 0.17, 0.0, Math.sin(a) * 0.17, 0, -a, PI / 2 - 0.35, 0.09, 0.32, 0.05); b.x.add(P.capsule, 0xffc83d, Math.cos(a) * 0.205, 0.035, Math.sin(a) * 0.205, 0, -a, PI / 2 - 0.35, 0.02, 0.33, 0.02); }
    b.g.add(P.sphere, 0xffffff, 0, 0.06, 0.2, 0, 0, 0, 0.05, 0.05, 0.02); b.g.add(P.sphere, 0x111111, -0.017, 0.065, 0.214, 0, 0, 0, 0.012); b.g.add(P.sphere, 0x111111, 0.017, 0.065, 0.214, 0, 0, 0, 0.012); return true; }
  if (o === 'bicorne') { b.m.add(P.sphere, 0x1e3a8a, 0, 0.08, 0, 0, 0, 0, 0.44, 0.17, 0.12); b.x.add(torus(0.12, 32, PI), 0xffc83d, 0, 0.0, 0.0, 0, 0, 0, 0.42, 0.24, 0.6); b.g.add(leaf(), 0xffffff, 0.1, 0.18, 0.02, 0, 0, -0.9, 0.18, 0.4, 0.18); b.g.add(P.sphere, 0xdc2626, 0, 0.08, 0.11, 0, 0, 0, 0.05, 0.05, 0.02); return true; }
  if (o === 'parrot') { b.g.add(P.sphere, 0x22c55e, 0, 0.1, -0.02, 0.3, 0, 0, 0.09, 0.12, 0.09); b.g.add(P.sphere, 0x16a34a, 0, 0.23, 0.02, 0, 0, 0, 0.075); b.g.add(P.cone, 0xff9f1c, 0, 0.21, 0.1, PI / 2, 0, 0, 0.03, 0.06, 0.03); [-1, 1].forEach((s) => { b.g.add(P.sphere, 0xffffff, s * 0.035, 0.25, 0.06, 0, 0, 0, 0.022); b.g.add(P.sphere, 0x111111, s * 0.037, 0.25, 0.075, 0, 0, 0, 0.011); b.g.add(P.capsule, 0x14532d, s * 0.04, 0.28, 0.06, 0, 0, s * 0.5, 0.012, 0.035, 0.012); b.g.add(P.sphere, 0x3b82f6, s * 0.08, 0.1, -0.02, 0, 0, s * 0.3, 0.03, 0.09, 0.06); });
    b.g.add(P.capsule, 0xef4444, 0, 0.02, -0.12, -1.0, 0, 0, 0.04, 0.14, 0.02); return true; }
  if (o === 'beanie') { b.f.add(P.sphere, 0xdc2626, 0, 0, 0, 0, 0, 0, 0.25, 0.2, 0.25); b.f.add(P.torus, 0xb91c1c, 0, -0.04, 0, PI / 2, 0, 0, 0.25, 0.25, 0.25); b.f.add(P.sphere, 0xffffff, 0, 0.2, 0, 0, 0, 0, 0.07); return true; }
  if (o === 'tophat') { b.m.add(P.cyl, 0x111111, 0, 0.14, 0, 0, 0, 0, 0.15, 0.28, 0.15); b.m.add(P.cyl, 0x111111, 0, 0.0, 0, 0, 0, 0, 0.27, 0.02, 0.27); b.g.add(P.cyl, 0xdc2626, 0, 0.04, 0, 0, 0, 0, 0.155, 0.05, 0.155); return true; }
  if (o === 'viking') { b.x.add(P.sphere, 0x9ca3af, 0, 0, 0, 0, 0, 0, 0.25, 0.2, 0.25); b.x.add(P.torus, 0xa16207, 0, -0.02, 0, PI / 2, 0, 0, 0.25, 0.25, 0.3); [-1, 1].forEach((s) => b.g.add(cone(16), 0xfff7ed, s * 0.22, 0.06, 0, 0, 0, s * -0.8, 0.05, 0.22, 0.05)); return true; }
  if (o === 'sombrero') { b.f.add(P.cyl, 0xf5c76a, 0, -0.02, 0, 0, 0, 0, 0.5, 0.025, 0.5); b.f.add(P.cone, 0xf5c76a, 0, 0.1, 0, 0, 0, 0, 0.18, 0.26, 0.18); b.g.add(P.torus, 0xef4444, 0, 0.02, 0, PI / 2, 0, 0, 0.18, 0.18, 0.3); for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; b.g.add(P.sphere, [0x22c55e, 0xef4444, 0xffffff][i % 3], Math.cos(a) * 0.45, 0.0, Math.sin(a) * 0.45, 0, 0, 0, 0.03); } return true; }
  if (o === 'shellcrown') { for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; b.g.add(P.sphere, i % 2 ? 0xffc2e6 : 0xfff7ed, Math.cos(a) * 0.16, 0.06, Math.sin(a) * 0.16, -0.4, -a, 0, 0.07, 0.1, 0.03); } b.g.add(P.torus, 0xffd6a5, 0, 0.0, 0, PI / 2, 0, 0, 0.17, 0.17, 0.2); b.e.add(P.sphere, 0xf8fafc, 0, 0.12, 0.17, 0, 0, 0, 0.04); return true; }
  return false;
}
