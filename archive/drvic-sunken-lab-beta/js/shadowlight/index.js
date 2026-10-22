// SHADOWLIGHT engine - the spooky upgrade of the Turbo render core (PBR + soft shadows + GTAO + bloom), built for Grok Dr. Vic and reusable by future games.
// Adds: shadow-casting flashlight (soft PCF, wide blur radius = PCSS-style penumbra), flickering lights with a moving shadow-casting "hero" light,
// triplanar PBR surface detail (albedo/roughness/cavity + normal maps) injected into the shared batched materials (works on merged geometry with no UVs),
// volumetric-style light shafts, drifting dust motes, and goo emissives tuned for bloom. Nothing here lowers quality automatically.
import * as THREE from 'three';
import { E } from '../engine.js?v=vic3mp';
import { MATS } from '../mats.js?v=vic3mp';
import { surface } from './textures.js?v=vic3mp';
export const SL = { lights: [], flash: null, hero: null, dust: null, shafts: [], t: 0, set: null };
// ---- triplanar detail injected into shared materials
const SETS = { lab: { m: ['plaster', 0.55, 1.1], w: ['plaster', 0.7, 1.2], x: ['rust', 0.9, 1.4], g: ['tile', 0.45, 0.9], f: ['plaster', 0.3, 2.2] },
  street: { m: ['brick', 0.65, 0.55], w: ['brick', 0.65, 0.55], x: ['rust', 0.9, 1.4], g: ['plaster', 0.4, 1.0], f: ['plaster', 0.3, 2.2] },
  home: { m: ['plaster', 0.35, 1.3], w: ['plaster', 0.45, 1.2], x: ['rust', 0.4, 1.6], g: ['tile', 0.25, 1.1], f: ['plaster', 0.25, 2.4] } };
const U = {};
function inject(key, mat) { const u = U[key] = { tDet: { value: null }, tNrm: { value: null }, uAmt: { value: 0.5 }, uScale: { value: 1 } };
  mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSLw; varying vec3 vSLn;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vSLw = (modelMatrix * vec4(transformed,1.0)).xyz; vSLn = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vSLw; varying vec3 vSLn; uniform sampler2D tDet; uniform sampler2D tNrm; uniform float uAmt; uniform float uScale;
vec3 slW(){ vec3 b = pow(abs(vSLn), vec3(4.0)); return b / (b.x + b.y + b.z + 1e-4); }
vec4 slTri(sampler2D t){ vec3 p = vSLw * uScale * 0.5; vec3 b = slW(); return texture2D(t, p.zy) * b.x + texture2D(t, p.xz) * b.y + texture2D(t, p.xy) * b.z; }
vec3 slNrm(){ vec3 p = vSLw * uScale * 0.5; vec3 b = slW(); vec3 nx = texture2D(tNrm, p.zy).xyz * 2.0 - 1.0, ny = texture2D(tNrm, p.xz).xyz * 2.0 - 1.0, nz = texture2D(tNrm, p.xy).xyz * 2.0 - 1.0;
  vec3 wx = vec3(0.0, nx.y, nx.x) * sign(vSLn.x), wy = vec3(ny.x, 0.0, ny.y) * sign(vSLn.y), wz = vec3(nz.x, nz.y, 0.0) * sign(vSLn.z); return wx * b.x + wy * b.y + wz * b.z; }`)
      .replace('#include <color_fragment>', '#include <color_fragment>\n vec4 slD = slTri(tDet); diffuseColor.rgb *= mix(1.0, slD.r * 1.3 * (0.55 + slD.b * 0.75), uAmt);')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = clamp(mix(roughnessFactor, slD.g, uAmt * 0.8), 0.04, 1.0);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n normal = normalize(normal + (viewMatrix * vec4(slNrm(), 0.0)).xyz * uAmt * 1.4);'); };
  mat.customProgramCacheKey = () => 'sl-' + key; mat.needsUpdate = true; }
export function initShadowlight() { for (const k of ['m', 'w', 'x', 'g', 'f']) if (MATS[k] && !U[k]) inject(k, MATS[k]);
  // flashlight: soft shadow-casting spot that follows the player's view
  const f = SL.flash = new THREE.SpotLight(0xfff2d6, 0, 26, 0.52, 0.55, 1.4); f.castShadow = true; f.shadow.mapSize.set(1024, 1024); f.shadow.radius = 6; f.shadow.blurSamples = 16; f.shadow.bias = -0.0006; f.shadow.normalBias = 0.03; f.shadow.camera.near = 0.3; f.shadow.camera.far = 26; E.scene.add(f, f.target);
  // hero light: the nearest flickering lamp also casts (moving) shadows
  const h = SL.hero = new THREE.PointLight(0xffe2b0, 0, 16, 1.5); h.castShadow = true; h.shadow.mapSize.set(512, 512); h.shadow.radius = 5; h.shadow.bias = -0.002; h.shadow.camera.near = 0.2; h.shadow.camera.far = 16; E.scene.add(h);
  for (let i = 0; i < 5; i++) { const p = new THREE.PointLight(0xffffff, 0, 16, 1.6); E.scene.add(p); SL.lights.push(p); }
  // dust motes: one Points cloud that wraps around the camera
  const n = 900, pos = new Float32Array(n * 3); for (let i = 0; i < n * 3; i++) pos[i] = (Math.random() - 0.5) * 16; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dc = document.createElement('canvas'); dc.width = dc.height = 32; const dx = dc.getContext('2d'), gr = dx.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); dx.fillStyle = gr; dx.fillRect(0, 0, 32, 32);
  SL.dust = new THREE.Points(g, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(dc), color: 0xfff4dc, size: 0.028, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true })); SL.dust.frustumCulled = false; E.scene.add(SL.dust);
  SL.shaftMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { c: { value: new THREE.Color(0xffe8c0) }, a: { value: 0.12 }, t: { value: 0 } },
    vertexShader: 'varying vec2 vU; varying vec3 vN; varying vec3 vV; void main(){ vU = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 c; uniform float a; uniform float t; varying vec2 vU; varying vec3 vN; varying vec3 vV; void main(){ float rim = pow(abs(dot(vN, vV)), 1.5); float fall = pow(vU.y, 1.6); float wob = 0.85 + 0.15*sin(t*1.3 + vU.x*12.0); gl_FragColor = vec4(c * a * rim * fall * wob, 1.0); }' });
  SL.shaftGeo = new THREE.CylinderGeometry(0.15, 1.7, 1, 24, 1, true).translate(0, -0.5, 0); }
export function useSurfaceSet(name) { const S = SETS[name] || SETS.lab; SL.set = name; for (const k in S) { if (!U[k]) continue; const s = surface(S[k][0]); U[k].tDet.value = s.det; U[k].tNrm.value = s.nrm; U[k].uAmt.value = S[k][1]; U[k].uScale.value = S[k][2]; } }
// spots: [{x,y,z,c,i,d,flick}] - light shafts are added under the strongest ceiling lamps
export function setSpots(spots, o = {}) { SL.spots = spots; SL.flashOn = !!o.flash; clearShafts(); for (const s of spots.filter((q) => q.shaft).slice(0, 14)) { const m = new THREE.Mesh(SL.shaftGeo, SL.shaftMat); m.position.set(s.x, s.y + 0.6, s.z); m.scale.set(1, s.y + 0.6, 1); m.renderOrder = 5; E.scene.add(m); SL.shafts.push(m); } SL.pick = 0; }
function clearShafts() { for (const m of SL.shafts) E.scene.remove(m); SL.shafts = []; }
const flick = (t, k) => { const a = Math.sin(t * 13.1 + k * 7) * Math.sin(t * 4.7 + k * 3) * Math.sin(t * 29 + k); const drop = (Math.sin(t * 0.9 + k * 11) > 0.93) ? 0.08 : 1; return (0.78 + 0.22 * a) * drop; };
const _v = new THREE.Vector3();
export function updateShadowlight(dt, me, cam, o = {}) { SL.t += dt; const t = SL.t; SL.shaftMat.uniforms.t.value = t; const S = SL.spots || [];
  SL.pick -= dt; if (SL.pick <= 0 && S.length) { SL.pick = 0.3; const near = S.map((s) => [s, (s.x - me.x) ** 2 + (s.z - me.z) ** 2 + (s.y - me.y - 1) ** 2]).sort((a, b) => a[1] - b[1]); SL.near = near.slice(0, 5).map((a) => a[0]); SL.heroSpot = (near.find((a) => a[0].flick && a[1] < 200) || near[0])[0]; }
  (SL.near || []).forEach((s, i) => { const p = SL.lights[i]; if (s === SL.heroSpot) { p.intensity = 0; return; } p.position.set(s.x, s.y, s.z); p.color.setHex(s.c); p.distance = s.d || 16; p.intensity = (s.i || 20) * (s.flick ? flick(t, i + s.x) : 1) * 0.6; });
  const hs = SL.heroSpot; if (hs) { SL.hero.position.set(hs.x, hs.y, hs.z); SL.hero.color.setHex(hs.c); SL.hero.distance = (hs.d || 16) * 1.1; SL.hero.intensity = (hs.i || 20) * 0.7 * (hs.flick ? flick(t, 99 + hs.x) : 1); }
  for (const m of SL.shafts) { const s = SL.spots.find((q) => q.x === m.position.x && q.z === m.position.z); m.material.uniforms.a.value = 0.12; }
  // flashlight from just above the shoulder toward where the camera looks
  const f = SL.flash; if (SL.flashOn) { cam.getWorldDirection(_v); f.position.set(me.x + _v.x * 0.2, me.y + 1.7, me.z + _v.z * 0.2); f.target.position.set(me.x + _v.x * 10, me.y + 1.2 + _v.y * 10, me.z + _v.z * 10); f.target.updateMatrixWorld(); f.intensity = (o.fpv ? 60 : 45) * (o.lowBat ? 0.4 + 0.3 * flick(t, 5) : 1); } else f.intensity = 0;
  // dust: keep motes in a 16 m box around the camera, drifting
  const P = SL.dust.geometry.attributes.position, a = P.array, cx = cam.position.x, cy = cam.position.y, cz = cam.position.z; for (let i = 0; i < a.length; i += 3) { a[i] += Math.sin(t * 0.3 + i) * dt * 0.08; a[i + 1] -= dt * 0.03; a[i + 2] += Math.cos(t * 0.27 + i) * dt * 0.08;
    let dx = a[i] - cx, dy = a[i + 1] - cy, dz = a[i + 2] - cz; if (dx > 8) a[i] -= 16; else if (dx < -8) a[i] += 16; if (dy > 6) a[i + 1] -= 12; else if (dy < -6) a[i + 1] += 12; if (dz > 8) a[i + 2] -= 16; else if (dz < -8) a[i + 2] += 16; } P.needsUpdate = true; SL.dust.material.opacity = o.dust ?? 0.5; }
export function setAmt(a) { for (const k in U) U[k].uAmt.value = a; }
