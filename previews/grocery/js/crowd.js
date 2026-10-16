// Grok Grocery Tycoon - the crowd: every shopper, staff member and townsperson is drawn with ONE shared set of InstancedMeshes
// (torso, head, face, two hair styles, legs, arms, staff apron, shopping cart, carried case), so 60 smooth cartoon people
// cost about a dozen draw calls. Shirt / skin / hair / pants colours come from per-instance tints.
import * as THREE from 'three';
import { Builder, P } from './geo.js?v=ggt12';
import { lathe, torus, rcyl } from './shapes.js?v=ggt12';
import { compact } from './compact.js?v=ggt12';
import { MATS } from './mats.js?v=ggt12';
const PI = Math.PI;
const SK = [0xffe0c7, 0xf5c9a4, 0xe0a87c, 0xc68658, 0x9a6440, 0x6b4128], HC = [0x2b1d14, 0x6b4226, 0xc98b4b, 0xf2d27a, 0xe0603a, 0xd8d8e0, 0x1f1f2a],
  SH = [0xff5a5f, 0x3fa7ff, 0x4ade80, 0xffc93c, 0xa78bfa, 0xff8f3d, 0x22d3ee, 0xf472b6, 0x94a3b8, 0xffffff, 0x10b981, 0xfb7185], PA = [0x334155, 0x1e3a8a, 0x6b4f2a, 0x3f3f46, 0x7c2d12, 0x0f766e];
function geo(fn, b = 'f') { const B = new Builder(); fn(B); return compact(B.build(), b); }
export class Crowd {
  constructor(scene, N = 72) { this.N = N; this.list = []; const W = 0xffffff;
    const parts = {
      torso: [geo((b) => { b.add(lathe([[0, 0], [0.22, 0.02], [0.28, 0.18], [0.28, 0.42], [0.24, 0.56], [0.14, 0.64], [0, 0.66]], 16), W, 0, 0.8, 0); b.add(P.sphereLo, W, 0, 1.38, 0, 0, 0, 0, 0.2, 0.08, 0.16); }), MATS.f, true],
      head: [geo((b) => { b.add(P.sphereLo, W, 0, 1.66, 0, 0, 0, 0, 0.25, 0.27, 0.24); b.add(P.sphereLo, W, 0, 1.6, 0.235, 0, 0, 0, 0.04, 0.035, 0.035); [-1, 1].forEach((s) => b.add(P.sphereLo, W, s * 0.245, 1.64, 0, 0, 0, 0, 0.045, 0.065, 0.035)); b.add(P.cyl, W, 0, 1.4, 0, 0, 0, 0, 0.08, 0.12, 0.08); }, 'g'), MATS.g, true],
      face: [geo((b) => { [-1, 1].forEach((s) => { b.add(P.sphereLo, 0xffffff, s * 0.09, 1.7, 0.2, 0, 0, 0, 0.055, 0.065, 0.04); b.add(P.sphereLo, 0x1b1b24, s * 0.09, 1.695, 0.235, 0, 0, 0, 0.032, 0.04, 0.02); b.add(P.sphereLo, 0xff9fb0, s * 0.15, 1.6, 0.19, 0, 0, 0, 0.045, 0.026, 0.02); }); b.add(torus(0.3, 12, PI), 0x7a2e2e, 0, 1.56, 0.225, 0.25, 0, PI, 0.06, 0.05, 0.05); }, 'g'), MATS.g, false],
      hairA: [geo((b) => { b.add(P.sphereLo, W, 0, 1.76, -0.03, -0.25, 0, 0, 0.27, 0.22, 0.27); b.add(P.sphereLo, W, -0.07, 1.86, 0.15, 0.5, 0, 0.3, 0.15, 0.07, 0.11); b.add(P.sphereLo, W, 0.09, 1.85, 0.16, 0.5, 0, -0.4, 0.13, 0.07, 0.1); }), MATS.f, true],
      hairB: [geo((b) => { b.add(P.sphereLo, W, 0, 1.75, -0.04, -0.2, 0, 0, 0.28, 0.24, 0.28); b.add(P.capsuleLo, W, 0, 1.5, -0.2, 0.2, 0, 0, 0.42, 0.42, 0.22); b.add(P.sphereLo, W, 0, 1.95, -0.16, 0, 0, 0, 0.11, 0.11, 0.11); }), MATS.f, true],
      cap: [geo((b) => { b.add(P.sphereLo, 0x16a34a, 0, 1.78, -0.01, 0, 0, 0, 0.27, 0.16, 0.27); b.add(rcyl(0.2, 0.03, 0.01, 14), 0x15803d, 0, 1.79, 0.2, 0, 0, 0, 1, 1, 0.9); b.add(P.sphereLo, 0xffffff, 0, 1.92, 0.14, 0, 0, 0, 0.06, 0.05, 0.03); }, 'g'), MATS.g, true],
      legL: [geo((b) => { b.add(P.capsuleLo, W, 0, -0.36, 0, 0, 0, 0, 0.19, 0.36, 0.19); b.add(P.sphereLo, W, 0, -0.77, 0.06, 0, 0, 0, 0.11, 0.08, 0.18); }), MATS.f, true],
      arm: [geo((b) => { b.add(P.capsuleLo, W, 0, -0.24, 0, 0, 0, 0, 0.12, 0.3, 0.12); b.add(P.sphereLo, W, 0, -0.48, 0.01, 0, 0, 0, 0.07, 0.075, 0.07); }, 'g'), MATS.g, true],
      apron: [geo((b) => { b.add(P.rbox, 0x16a34a, 0, 1.0, 0.24, 0.06, 0, 0, 0.44, 0.5, 0.05); b.add(P.rbox, 0xffffff, 0, 1.12, 0.27, 0.06, 0, 0, 0.16, 0.08, 0.02); b.add(torus(0.12, 16), 0x16a34a, 0, 1.28, 0, PI / 2, 0, 0, 0.27, 0.27, 0.16); }), MATS.f, true],
      cart: [geo((b) => { b.add(P.rboxS, 0xcbd5e1, 0, 0.62, 0, 0, 0, 0, 0.62, 0.45, 0.85); b.add(P.rboxS, 0x64748b, 0, 0.66, 0, 0, 0, 0, 0.55, 0.38, 0.78); b.add(P.cyl, 0x94a3b8, 0, 0.25, 0, 0, 0, 0, 0.03, 0.5, 0.03); b.add(P.rboxS, 0x94a3b8, 0, 0.2, 0, 0, 0, 0, 0.55, 0.05, 0.75);
        b.add(P.cyl, 0xdc2626, 0, 0.98, -0.5, 0, 0, PI / 2, 0.035, 0.62, 0.035); [-0.25, 0.25].forEach((x) => [-0.32, 0.32].forEach((z) => b.add(P.sphereLo, 0x111827, x, 0.07, z, 0, 0, 0, 0.07)));
        [[-0.12, 0xfacc15], [0.1, 0x22c55e], [0, 0xef4444]].forEach(([x, c], i) => b.add(P.rboxS, c, x, 0.9, -0.1 + i * 0.15, 0, i, 0, 0.18, 0.22, 0.14)); }, 'g'), MATS.g, true],
      case: [geo((b) => { b.add(P.rboxS, 0xc9a06a, 0, 0, 0, 0, 0, 0, 0.5, 0.36, 0.4); b.add(P.rboxS, 0x16a34a, 0, 0, 0.205, 0, 0, 0, 0.2, 0.14, 0.01); }, 'm'), MATS.m, true],
    };
    this.M = {}; const tint = ['torso', 'head', 'hairA', 'hairB', 'legL', 'arm'];
    const mk = (k, n) => { const [g, mat, sh] = parts[k]; const m = new THREE.InstancedMesh(g, mat, n); m.frustumCulled = false; m.castShadow = sh; m.receiveShadow = true; m.count = 0; scene.add(m); if (tint.includes(k)) m.setColorAt(0, new THREE.Color(1, 1, 1)); return m; };
    for (const k of ['torso', 'head', 'face', 'hairA', 'hairB', 'cap', 'apron', 'case']) this.M[k] = mk(k, N);
    this.M.legL = mk('legL', N * 2); this.M.arm = mk('arm', N * 2); this.M.cart = mk('cart', N + 40);
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._v = new THREE.Vector3(); this._s = new THREE.Vector3(); this._c = new THREE.Color(); this._p = new THREE.Matrix4(); this.carts = [];
  }
  // a new person look (seeded): staff wear the green apron + cap
  look(seed, staff) { const r = (k) => ((seed * 9301 + k * 49297) % 233280) / 233280; return { skin: SK[(r(1) * SK.length) | 0], hair: HC[(r(2) * HC.length) | 0], hs: r(3) < 0.5 ? 0 : 1, shirt: staff ? 0xffffff : SH[(r(4) * SH.length) | 0], pants: PA[(r(5) * PA.length) | 0], kid: !staff && r(6) < 0.14, w: 0.92 + r(7) * 0.2, staff: !!staff, phase: r(8) * 6 }; }
  draw(list, loose, t) { const M = this.M, m = this._m, q = this._q, e = this._e, v = this._v, s = this._s, c = this._c, P0 = this._p; let n = 0, nc = 0;
    const put = (mesh, i, mat, col) => { mesh.setMatrixAt(i, mat); if (col !== undefined) { c.setHex(col); mesh.setColorAt(i, c); } };
    for (const a of list) { if (!a.vis || n >= this.N) continue; const L = a.look, sc = L.kid ? 0.72 : 1; const sp = a.sp || 0, ph = (a.wt = (a.wt || L.phase) + 0) ; const sw = Math.sin(a.wt) * Math.min(1, sp / 1.6) * 0.6;
      e.set(0, a.ry, 0); q.setFromEuler(e); P0.compose(v.set(a.x, (a.y || 0) + Math.abs(Math.sin(a.wt)) * 0.04 * Math.min(1, sp), a.z), q, s.set(sc * L.w, sc, sc * L.w));
      put(M.torso, n, P0, L.shirt); put(M.head, n, P0, L.skin); put(M.face, n, P0); m.copy(P0); if (L.staff || a.cap) { put(M.cap, n, P0); m.makeScale(0, 0, 0); put(M.hairA, n, m, L.hair); put(M.hairB, n, m, L.hair); } else { m.makeScale(0, 0, 0); put(M.cap, n, m); put(L.hs ? M.hairA : M.hairB, n, m, L.hair); put(L.hs ? M.hairB : M.hairA, n, P0, L.hair); }
      if (L.staff) put(M.apron, n, P0); else { m.makeScale(0, 0, 0); put(M.apron, n, m); }
      for (let k = 0; k < 2; k++) { const sd = k ? 1 : -1; e.set(sd * sw, 0, 0); q.setFromEuler(e); m.compose(v.set(sd * 0.12, 0.84, 0), q, s.set(1, 1, 1)); m.premultiply(P0); put(M.legL, n * 2 + k, m, L.pants);
        const ar = a.cart ? -1.1 : a.carry ? -1.3 : -sd * sw * 0.8; e.set(ar, 0, sd * 0.12); q.setFromEuler(e); m.compose(v.set(sd * 0.27, 1.32, 0), q, s.set(1, 1, 1)); m.premultiply(P0); put(M.arm, n * 2 + k, m, L.skin); }
      if (a.carry) { m.compose(v.set(0, 1.0, 0.42), this._q.identity(), s.set(1, 1, 1)); m.premultiply(P0); put(M.case, n, m); } else { m.makeScale(0, 0, 0); put(M.case, n, m); }
      if (a.cart && nc < M.cart.instanceMatrix.count) { e.set(0, a.ry, 0); q.setFromEuler(e); m.compose(v.set(a.x + Math.sin(a.ry) * 0.95 * sc, 0, a.z + Math.cos(a.ry) * 0.95 * sc), q, s.set(sc, sc, sc)); put(M.cart, nc++, m); }
      n++; }
    for (const L of loose) { if (!L.vis || nc >= this.N + 40) continue; e.set(0, L.ry, 0); q.setFromEuler(e); m.compose(v.set(L.x, 0, L.z), q, s.set(1, 1, 1)); put(M.cart, nc++, m); }
    for (const k of ['torso', 'head', 'face', 'hairA', 'hairB', 'cap', 'apron', 'case']) { M[k].count = n; M[k].instanceMatrix.needsUpdate = true; if (M[k].instanceColor) M[k].instanceColor.needsUpdate = true; }
    M.legL.count = M.arm.count = n * 2; for (const k of ['legL', 'arm']) { M[k].instanceMatrix.needsUpdate = true; M[k].instanceColor.needsUpdate = true; } M.cart.count = nc; M.cart.instanceMatrix.needsUpdate = true; return n; }
}
