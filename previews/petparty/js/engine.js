// Grok Pet Party - "Showtime" render core (Kart Party / Disaster Zone family): PBR + soft shadows + bloom + neutral tone mapping.
// Smart performance, never a visual downgrade: one quality only. Static shadows are rendered only when the set changes,
// decor is instanced, offscreen work is skipped and old sets are freed before the next one is built.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const E = { t: 0, dt: 0, frameCb: null, shadowDirty: 2 };
export function initEngine(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = 1.05;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; r.shadowMap.autoUpdate = false;
  E.renderer = r;
  E.scene = new THREE.Scene();
  E.camera = new THREE.PerspectiveCamera(50, 1, 0.3, 400);
  E.sun = new THREE.DirectionalLight(0xfff3e0, 2.4); E.sun.castShadow = true; E.sun.shadow.mapSize.set(2048, 2048);
  const sc = E.sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 120;
  E.sun.shadow.bias = -0.0005; E.sun.shadow.normalBias = 0.03; E.sun.shadow.radius = 3;
  E.sun.position.set(14, 30, 12);
  E.hemi = new THREE.HemisphereLight(0xdff0ff, 0x7a5a8a, 0.9);
  E.scene.add(E.sun, E.sun.target, E.hemi);
  const dpr = Math.min(window.devicePixelRatio || 1, 2); r.setPixelRatio(dpr); E.dpr = dpr;
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const c = new EffectComposer(r, rt);
  c.addPass(new RenderPass(E.scene, E.camera));
  E.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.42, 0.5, 1.0); c.addPass(E.bloom);
  c.addPass(new OutputPass());
  E.composer = c;
  window.addEventListener('resize', resize); resize();
  let last = performance.now();
  const loop = (now) => {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; E.dt = dt; E.t += dt;
    if (E.frameCb) E.frameCb(dt);
    if (E.shadowDirty > 0 || E.shadowLive) { r.shadowMap.needsUpdate = true; if (E.shadowDirty > 0) E.shadowDirty--; }
    c.render();
  };
  requestAnimationFrame(loop);
  return E;
}
export function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  E.renderer.setSize(w, h, false); E.composer.setSize(w, h); E.composer.setPixelRatio(E.dpr);
  E.camera.aspect = w / h; E.camera.updateProjectionMatrix();
  E.bloom.resolution.set(Math.round(w / 2), Math.round(h / 2));
}
// fit a horizontal width W (metres) on screen at distance from the look point; portrait phones need the camera further back
export function fitDist(W, H) {
  const v = THREE.MathUtils.degToRad(E.camera.fov), hf = 2 * Math.atan(Math.tan(v / 2) * E.camera.aspect);
  return Math.max((W / 2) / Math.tan(hf / 2), (H / 2) / Math.tan(v / 2));
}
export function disposeTree(root) {
  root.traverse((o) => {
    if (o.geometry && !o.geometry.userData.keep) o.geometry.dispose();
    if (o.material) for (const m of [].concat(o.material)) { if (m.userData.keep) continue; for (const k in m) { const v = m[k]; if (v && v.isTexture && !v.userData.keep) v.dispose(); } m.dispose(); }
  });
}
