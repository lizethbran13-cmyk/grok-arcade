/* Grok Blocks - three.js voxel renderer */
(function () {
'use strict';
const GB = window.GB, THREE = window.THREE;
const V = GB.View = {};
let renderer, scene, cam, sun, amb, hemi, clock;
const TEX = {};
const groups = {};
let ground = null, water = null;
const dummy = new THREE.Object3D();
const CAM = { yaw: 0, dist: 11, pitch: 0.42 };

/* Re-Blocked engine: three.js r158, ACES filmic tone mapping, sRGB, soft sun shadows that follow you,
   a gradient sky with sun, moon and stars, image-based reflections for shiny blocks, block textures with
   per-corner ambient occlusion, unlit glow blocks, and pooled point lights for torches and crystals. */
const DPR = Math.min(2, window.devicePixelRatio || 1);
let skyMesh = null, clouds = null, envRT = null, headlamp = null, glowPool = [], ceilMesh = null, lavaMat = null, waterMat = null;
V.boot = function () {
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: DPR < 1.5, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR);
  renderer.setSize(innerWidth, innerHeight);
  renderer.useLegacyLights = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  cam = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 420);
  hemi = new THREE.HemisphereLight(0xcfe6ff, 0x6a8a4a, 0.55); scene.add(hemi);
  amb = new THREE.AmbientLight(0xffffff, 0.35); scene.add(amb);
  sun = new THREE.DirectionalLight(0xfff4d2, 0.95); sun.position.set(40, 80, 20); scene.add(sun); scene.add(sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -46; sc.right = 46; sc.top = 46; sc.bottom = -46; sc.near = 1; sc.far = 220; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
  // headlamp: a warm spotlight on your helmet, on in caves and at night
  headlamp = new THREE.SpotLight(0xfff0c8, 0, 34, 0.62, 0.55, 1.2); scene.add(headlamp); scene.add(headlamp.target);
  // pooled point lights that hop to the nearest torches / crystals / lava
  for (let i = 0; i < 6; i++) { const l = new THREE.PointLight(0xffaa55, 0, 13, 1.6); scene.add(l); glowPool.push(l); }
  buildSky();
  clock = new THREE.Clock();
  addEventListener('resize', () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
  V.scene = scene; V.cam = cam; V.clock = clock;
};
function tex(color, noise) {
  const key = color + ':' + noise;
  if (TEX[key]) return TEX[key];
  const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d');
  g.fillStyle = '#' + (color >>> 0).toString(16).padStart(6, '0'); g.fillRect(0, 0, 16, 16);
  if (noise) { for (let i = 0; i < 34; i++) { const v = (Math.random() * 50 - 25) | 0; g.fillStyle = 'rgba(' + (v > 0 ? '255,255,255' : '0,0,0') + ',' + (Math.abs(v) / 90) + ')'; g.fillRect((Math.random() * 16) | 0, (Math.random() * 16) | 0, 2, 2); } }
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return TEX[key] = t;
}
const MC = {};
function mat(color, noise) { const k = color + ':' + (noise !== false); return MC[k] || (MC[k] = new THREE.MeshStandardMaterial({ map: tex(color, noise !== false), roughness: 0.72, metalness: 0.02, envMapIntensity: 0.6 }), MCset.add(MC[k]), MC[k]); }
const GMC = {};
function gmat(color) { if (!GMC[color]) { GMC[color] = new THREE.MeshBasicMaterial({ color: color }); MCset.add(GMC[color]); } return GMC[color]; }
// one shared 16x16 grey block texture: pixel speckle + a soft dark rim so every block reads as a block.
// UVs are in world units (1 tile per block) so it is never stretched.
let BLOCKTEX = null;
function blockTex() {
  if (BLOCKTEX) return BLOCKTEX;
  const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d');
  const r = GB.World.rng(1234);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { let v = 214 + (r() * 42 - 21); if (x === 0 || y === 0 || x === 15 || y === 15) v -= 34; else if (x === 1 || y === 1) v += 10; g.fillStyle = 'rgb(' + (v | 0) + ',' + (v | 0) + ',' + (v | 0) + ')'; g.fillRect(x, y, 1, 1); }
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return BLOCKTEX = t;
}
const COL = { grass: 0x7db84a, dgrass: 0x3f8a38, dry: 0xc8a84a, sand: 0xead08a, snow: 0xf6f9fc, rock: 0x8f857c, mud: 0x8a6a42, bed: 0x3a6a8a, red: 0xc8603a, ice: 0xbfe8f6, road: 0x75695b, plank: 0x6e5038, moss: 0x5d8a46, pad: 0xd8d2c4, gate: 0xf0c24b,
  crys: 0x7af0ff, deep: 0x4a4a58, lava: 0xff6a1a, pink: 0xf6a8c8, cobble: 0x7a7a80, glow: 0xffe08a };
const MATS = {};
function M(name) { return MATS[name] || (MATS[name] = mat(COL[name] || 0x888888)); }
const MAT_ORDER = ['grass', 'road', 'sand', 'snow', 'rock', 'mud', 'bed', 'dgrass', 'red', 'ice', 'plank', 'dry', 'moss', 'pad', 'gate', 'crys', 'deep', 'lava', 'pink', 'cobble', 'glow'];
// which bucket a block lives in: 0 matte, 1 shiny (ice/crystal: sharp reflections), 2 glowing (unlit lava/glowstone)
const BUCKET = { ice: 1, crys: 1, gate: 1, snow: 1, lava: 2, glow: 2 };
const ROUGH = [0.86, 0.12, 1];

/* ---------- terrain ---------- */
function disposeObj(o) { o.traverse((q) => { if (q.geometry && !q.geometry.userData.shared) q.geometry.dispose(); const mm = q.material; if (mm && !MCset.has(mm)) { if (q.isSprite && mm.map) mm.map.dispose(); mm.dispose(); } }); }
const MCset = new Set();
V.buildTerrain = function (map) {
  for (const k in groups) { scene.remove(groups[k]); disposeObj(groups[k]); }
  for (const k in groups) delete groups[k];
  if (ground) { scene.remove(ground); disposeObj(ground); ground = null; }
  if (water) { scene.remove(water); water.geometry.dispose(); water = null; }
  if (ceilMesh) { scene.remove(ceilMesh); disposeObj(ceilMesh); ceilMesh = null; }
  const m = map, N = m.N, H = m.H, Mt = m.Mt;
  const B = [0, 1, 2].map(() => ({ P: [], Nn: [], U: [], C: [], I: [], base: 0 }));
  const col = new THREE.Color();
  const hAt = (i, k) => (i < 0 || k < 0 || i >= N || k >= N) ? 99 : H[k * N + i];
  for (let k = 0; k < N; k++) for (let i = 0; i < N; i++) {
    const j = k * N + i, h = H[j]; if (h <= 0) continue;
    const x0 = i - m.half, z0 = k - m.half, y1 = h;
    const mname = MAT_ORDER[Mt[j]] || 'grass', bk = BUCKET[mname] || 0, b = B[bk];
    col.set(COL[mname] || 0x888888);
    const shade = 0.88 + GB.World.hash(i, k, 99) * 0.2;
    const lavaTop = mname === 'lava';
    // top face with per-corner AO from the 3 neighbours that touch each corner
    const ao = (dx, dz) => { const a = hAt(i + dx, k) > h, c = hAt(i, k + dz) > h, d = hAt(i + dx, k + dz) > h; return (a && c) ? 0.55 : 1 - ((a ? 1 : 0) + (c ? 1 : 0) + (d ? 1 : 0)) * 0.13; };
    const ty = lavaTop ? y1 - 0.3 : y1;
    const tq = [[x0, ty, z0, -1, -1], [x0, ty, z0 + 1, -1, 1], [x0 + 1, ty, z0 + 1, 1, 1], [x0 + 1, ty, z0, 1, -1]];
    for (const q of tq) { b.P.push(q[0], q[1], q[2]); b.Nn.push(0, 1, 0); b.U.push(q[0], q[2]); const a = bk === 2 ? 1 : ao(q[3], q[4]) * shade; b.C.push(col.r * a, col.g * a, col.b * a); }
    b.I.push(b.base, b.base + 1, b.base + 2, b.base, b.base + 2, b.base + 3); b.base += 4;
    // sides toward lower neighbours; side colour: grass tops get a dirt side like real blocks
    const side = (mname === 'grass' || mname === 'dgrass' || mname === 'pink' || mname === 'moss') ? 0x8a6440 : (mname === 'snow' ? 0x9a8a7a : (COL[mname] || 0x888888));
    const nb = [[i - 1, k, -1, 0], [i + 1, k, 1, 0], [i, k - 1, 0, -1], [i, k + 1, 0, 1]];
    for (const f of nb) {
      const hh = hAt(f[0], f[1]); if (hh >= h) continue;
      const yb = Math.max(0, hh), nx = f[2], nz = f[3];
      let p;
      if (nx) { const x = x0 + (nx > 0 ? 1 : 0); p = nx > 0 ? [[x, yb, z0 + 1], [x, yb, z0], [x, y1, z0], [x, y1, z0 + 1]] : [[x, yb, z0], [x, yb, z0 + 1], [x, y1, z0 + 1], [x, y1, z0]]; }
      else { const z = z0 + (nz > 0 ? 1 : 0); p = nz > 0 ? [[x0, yb, z], [x0 + 1, yb, z], [x0 + 1, y1, z], [x0, y1, z]] : [[x0 + 1, yb, z], [x0, yb, z], [x0, y1, z], [x0 + 1, y1, z]]; }
      // grass/snow: top block keeps its colour band, the rest is dirt; split into two quads
      const band = side !== (COL[mname] || 0x888888) && y1 - yb > 1 ? 1 : 0;
      const segs = band ? [[yb, y1 - 1, side], [y1 - 1, y1, COL[mname]]] : [[yb, y1, side !== (COL[mname] || 0x888888) ? COL[mname] : side]];
      for (const sg of segs) {
        col.set(sg[2]); const sh = shade * 0.8 * (nz ? 0.92 : 1);
        for (const q of p) { const y = q[1] === yb ? sg[0] : sg[1]; b.P.push(q[0], y, q[2]); b.Nn.push(nx, 0, nz); b.U.push(nx ? q[2] : q[0], y); const dk = y === sg[0] && sg[0] === yb ? 0.72 : 1; const a = bk === 2 ? 1 : sh * dk; b.C.push(col.r * a, col.g * a, col.b * a); }
        b.I.push(b.base, b.base + 1, b.base + 2, b.base, b.base + 2, b.base + 3); b.base += 4;
      }
    }
  }
  ground = new THREE.Group();
  B.forEach((b, bi) => {
    if (!b.base) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(b.P, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(b.Nn, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(b.U, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(b.C, 3));
    geo.setIndex(b.I);
    let mtl;
    if (bi === 2) { mtl = lavaMat = new THREE.MeshBasicMaterial({ vertexColors: true, map: blockTex() }); }
    else mtl = new THREE.MeshStandardMaterial({ vertexColors: true, map: blockTex(), roughness: ROUGH[bi], metalness: bi === 1 ? 0.15 : 0, envMapIntensity: bi === 1 ? 1.4 : 0.35 });
    const mesh = new THREE.Mesh(geo, mtl); mesh.receiveShadow = bi !== 2; mesh.castShadow = bi === 0; ground.add(mesh);
  });
  scene.add(ground);
  if (m.wl > 0 && m.id !== 'camp') {
    const g2 = new THREE.PlaneGeometry(N, N); g2.rotateX(-Math.PI / 2);
    waterMat = new THREE.MeshStandardMaterial({ color: 0x2f86c0, transparent: true, opacity: 0.74, roughness: 0.06, metalness: 0.25, envMapIntensity: 1.6 });
    water = new THREE.Mesh(g2, waterMat); water.receiveShadow = true;
    water.position.y = m.wl - 0.25; scene.add(water);
  }
  if (m.ceil) buildCeiling(m);
  buildProps(m);
  const b = GB.BIOMES[m.biome] || GB.BIOMES.camp;
  scene.background = new THREE.Color(b.sky); scene.fog = new THREE.Fog(b.fog, 30, m.id === 'camp' ? 130 : 150);
  if (clouds) clouds.visible = !m.ceil; if (skyMesh) skyMesh.visible = !m.ceil;
  V.map = m; lastNight = null;
  if (GB.X) GB.X.onMap(m, scene);
};
// cave roof: faces point down only, so from below it is a rocky ceiling with glowing crystal veins,
// and the follow camera (which can rise above it) never gets blocked.
function buildCeiling(m) {
  const P = [], Nn = [], U = [], C = [], I = []; let base = 0; const col = new THREE.Color(); const N = m.N;
  const GP = [], GC = [], GI = []; let gb = 0;
  for (let k = 0; k < N; k += 1) for (let i = 0; i < N; i += 1) {
    const x0 = i - m.half, z0 = k - m.half, hsh = GB.World.hash(i, k, 77), y = m.ceil + (hsh < 0.12 ? -1 : 0);
    const vein = GB.World.hash(i >> 1, k >> 1, 78) < 0.06;
    if (vein) { col.set(0x7af0ff); for (const q of [[x0, y, z0], [x0 + 1, y, z0], [x0 + 1, y, z0 + 1], [x0, y, z0 + 1]]) { GP.push(q[0], q[1] - 0.01, q[2]); GC.push(col.r, col.g, col.b); } GI.push(gb, gb + 1, gb + 2, gb, gb + 2, gb + 3); gb += 4; continue; }
    col.set(hsh < 0.3 ? 0x54546a : 0x646478); const a = 0.8 + hsh * 0.3;
    for (const q of [[x0, y, z0], [x0 + 1, y, z0], [x0 + 1, y, z0 + 1], [x0, y, z0 + 1]]) { P.push(q[0], q[1], q[2]); Nn.push(0, -1, 0); U.push(q[0], q[2]); C.push(col.r * a, col.g * a, col.b * a); }
    I.push(base, base + 1, base + 2, base, base + 2, base + 3); base += 4;
  }
  ceilMesh = new THREE.Group();
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); geo.setIndex(I);
  ceilMesh.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map: blockTex(), roughness: 0.9, side: THREE.FrontSide })));
  const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(GP, 3)); g2.setAttribute('color', new THREE.Float32BufferAttribute(GC, 3)); g2.setIndex(GI);
  ceilMesh.add(new THREE.Mesh(g2, new THREE.MeshBasicMaterial({ vertexColors: true })));
  scene.add(ceilMesh);
}
/* sky dome: gradient + sun disc + moon + twinkly stars, all in one cheap shader */
function buildSky() {
  const geo = new THREE.SphereGeometry(380, 24, 16);
  const mt = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x3d8fe0) }, hor: { value: new THREE.Color(0xcfe8ff) }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, night: { value: 0 }, sunCol: { value: new THREE.Color(0xfff2c2) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }',
    fragmentShader: 'uniform vec3 top; uniform vec3 hor; uniform vec3 sunDir; uniform float night; uniform vec3 sunCol; varying vec3 vP;' +
      'float h3(vec3 p){ p = fract(p*0.3183099+.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }' +
      'void main(){ float y = max(vP.y, 0.0); vec3 c = mix(hor, top, pow(y, 0.55));' +
      'float sd = max(dot(vP, sunDir), 0.0); c += sunCol * (pow(sd, 900.0) * 3.0 + pow(sd, 12.0) * 0.28) * (1.0 - night);' +
      'vec3 md = -sunDir; float mdd = max(dot(vP, md), 0.0); c += vec3(0.85,0.9,1.0) * (smoothstep(0.9993, 0.9996, mdd) * 1.4 + pow(mdd, 40.0) * 0.12) * night;' +
      'vec3 q = floor(vP * 220.0); float st = step(0.9965, h3(q)) * night * smoothstep(0.0, 0.25, y); c += vec3(st);' +
      'if (vP.y < 0.0) c = hor; gl_FragColor = vec4(c, 1.0);' +
      '\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}' });
  skyMesh = new THREE.Mesh(geo, mt); skyMesh.renderOrder = -10; skyMesh.frustumCulled = false; scene.add(skyMesh);
  // blocky clouds, Minecraft style: flat slabs drifting overhead
  const cg = new THREE.BoxGeometry(1, 1, 1), n = 46;
  clouds = new THREE.InstancedMesh(cg, new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, fog: false }), n);
  const d = new THREE.Object3D(), r = GB.World.rng(55);
  for (let i = 0; i < n; i++) { d.position.set((r() * 2 - 1) * 240, 70 + r() * 10, (r() * 2 - 1) * 240); d.scale.set(10 + r() * 26, 3, 8 + r() * 18); d.updateMatrix(); clouds.setMatrixAt(i, d.matrix); }
  clouds.frustumCulled = false; scene.add(clouds);
  // reflections for shiny blocks/water: a small prefiltered sky environment
  const es = new THREE.Scene(); const eg = new THREE.SphereGeometry(10, 16, 8); const ec = [];
  const p = eg.attributes.position, tc = new THREE.Color(0x4a9ae8), hc = new THREE.Color(0xeaf6ff), gc = new THREE.Color(0x5a7a48);
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 10; const c = y > 0 ? hc.clone().lerp(tc, Math.pow(y, 0.6)) : hc.clone().lerp(gc, Math.min(1, -y * 3)); ec.push(c.r, c.g, c.b); }
  eg.setAttribute('color', new THREE.Float32BufferAttribute(ec, 3));
  es.add(new THREE.Mesh(eg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const sm = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); sm.position.set(4, 8, 3); es.add(sm);
  const pm = new THREE.PMREMGenerator(renderer); envRT = pm.fromScene(es, 0.02); scene.environment = envRT.texture; pm.dispose(); eg.dispose();
}
function buildProps(m) {
  const grp = groups.props = new THREE.Group(); scene.add(grp);
  const P = [], N = [], C = [], I = [], U = []; let base = 0; const col = new THREE.Color();
  const GPp = [], GCc = [], GIi = []; let gbase = 0; // glowing (unlit) boxes
  const FACES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  let G0 = null; let GLOW = false; const lights = [];
  const rnd = GB.World.rng((m.seed || 1) * 7 + 3);
  function box(w, h, d, color, x, y, z, g) {
    const ox = g.x + x, oy = g.y + y, oz = g.z + z, hw = w / 2, hh = h / 2, hd = d / 2;
    col.set(color); const sh = 0.9 + rnd() * 0.2;
    for (const f of FACES) {
      const [nx, ny, nz] = f; let q;
      if (nx) q = [[nx * hw, -hh, -hd * nx], [nx * hw, -hh, hd * nx], [nx * hw, hh, hd * nx], [nx * hw, hh, -hd * nx]];
      else if (ny) q = [[-hw, ny * hh, -hd * ny], [-hw, ny * hh, hd * ny], [hw, ny * hh, hd * ny], [hw, ny * hh, -hd * ny]];
      else q = [[hw * nz, -hh, nz * hd], [-hw * nz, -hh, nz * hd], [-hw * nz, hh, nz * hd], [hw * nz, hh, nz * hd]];
      if (GLOW) { for (const v of q) { GPp.push(ox + v[0], oy + v[1], oz + v[2]); GCc.push(col.r, col.g, col.b); } GIi.push(gbase, gbase + 2, gbase + 1, gbase, gbase + 3, gbase + 2); gbase += 4; continue; }
      const k = (ny > 0 ? 1 : ny < 0 ? 0.6 : nx ? 0.88 : 0.8) * sh;
      for (const v of q) { P.push(ox + v[0], oy + v[1], oz + v[2]); N.push(nx, ny, nz); C.push(col.r * k, col.g * k, col.b * k); U.push(nx ? oz + v[2] : ox + v[0], ny ? oz + v[2] : oy + v[1]); }
      I.push(base, base + 2, base + 1, base, base + 3, base + 2); base += 4;
    }
  }
  const glow = (w, h, d, color, x, y, z, g) => { GLOW = true; box(w, h, d, color, x, y, z, g); GLOW = false; };
  const light = (x, y, z, color, kind) => lights.push({ x, y, z, color, kind });
  const signs = [];
  for (const p of m.props) {
    const s = p.s || 1, g = { x: p.x, y: m.h(p.x, p.z), z: p.z }; G0 = g;
    if (p.k === 'tree') { box(0.5, 2.4 * s, 0.5, 0x6b4423, 0, 1.2 * s, 0, g); box(2.2 * s, 1.6 * s, 2.2 * s, 0x3f8a3a, 0, 2.6 * s, 0, g); box(1.4 * s, 1.1 * s, 1.4 * s, 0x58b24a, 0, 3.6 * s, 0, g); }
    else if (p.k === 'jtree') { box(0.6, 3.4 * s, 0.6, 0x5a3a22, 0, 1.7 * s, 0, g); box(2.6 * s, 1.2 * s, 2.6 * s, 0x1f6b30, 0, 3.4 * s, 0, g); box(1.8 * s, 1 * s, 1.8 * s, 0x2f8a40, 0.4, 4.2 * s, 0, g); }
    else if (p.k === 'pine') { box(0.4, 2.6 * s, 0.4, 0x6b4a2a, 0, 1.3 * s, 0, g); box(1.8 * s, 1 * s, 1.8 * s, 0x2f6b4a, 0, 2.2 * s, 0, g); box(1.2 * s, 1.4 * s, 1.2 * s, 0xeaf2f6, 0, 3.2 * s, 0, g); }
    else if (p.k === 'acacia') { box(0.4, 2.2 * s, 0.4, 0x8a5a2a, 0, 1.1 * s, 0, g); box(3 * s, 0.6 * s, 3 * s, 0x7a9a3a, 0.4, 2.6 * s, 0, g); }
    else if (p.k === 'mangrove') { box(0.35, 2 * s, 0.35, 0x6b4a2a, 0, s, 0, g); box(1.8 * s, 0.9 * s, 1.8 * s, 0x2f7a44, 0, 2.2 * s, 0, g); }
    else if (p.k === 'cactus') { box(0.6, 2.4 * s, 0.6, 0x3a8a44, 0, 1.2 * s, 0, g); box(0.9, 0.4, 0.4, 0x3a8a44, 0.6, 1.6 * s, 0, g); box(0.35, 0.8, 0.35, 0x3a8a44, 0.95, 2.0 * s, 0, g); }
    else if (p.k === 'bush') box(1.3 * s, 0.9 * s, 1.3 * s, 0x4a8a3a, 0, 0.45 * s, 0, g);
    else if (p.k === 'fern') box(1 * s, 0.6 * s, 1 * s, 0x2f8a4a, 0, 0.3, 0, g);
    else if (p.k === 'reed') { box(0.15, 1.3 * s, 0.15, 0xc2b45a, 0, 0.65, 0, g); box(0.15, 1.0 * s, 0.15, 0xa8a04a, 0.3, 0.5, 0.2, g); }
    else if (p.k === 'lily') box(0.7, 0.1, 0.7, 0x5aa04a, 0, m.wl - g.y - 0.2, 0, g);
    else if (p.k === 'rock') { box(1.6 * s, 1.1 * s, 1.4 * s, 0x8a8278, 0, 0.55 * s, 0, g); box(0.9 * s, 0.7 * s, 0.9 * s, 0x9a948a, 0.3, 1.3 * s, 0.1, g); }
    else if (p.k === 'mound') box(1.2 * s, 1.6 * s, 1.2 * s, 0xb8884a, 0, 0.8 * s, 0, g);
    else if (p.k === 'bones') { box(0.9, 0.2, 0.3, 0xeee6d4, 0, 0.1, 0, g); box(0.2, 0.2, 0.7, 0xeee6d4, 0.4, 0.1, 0, g); }
    else if (p.k === 'grass') box(0.3, 0.5 * s, 0.3, 0x9aba4a, 0, 0.25, 0, g);
    else if (p.k === 'tent') { box(3, 1.4, 2.4, 0xf2f2ea, 0, 0.7, 0, g); box(3.1, 0.2, 2.5, 0xe25b4a, 0, 1.45, 0, g); }
    else if (p.k === 'ptent') { box(2.8, 1.4, 2.2, 0x5a6a3a, 0, 0.7, 0, g); box(0.8, 0.9, 0.1, 0x222222, 0, 0.5, 1.12, g); }
    else if (p.k === 'cage') { for (const dx of [-0.9, 0.9]) for (const dz of [-0.9, 0.9]) box(0.15, 1.6, 0.15, 0x7a8a9a, dx, 0.8, dz, g); box(1.95, 0.15, 1.95, 0x7a8a9a, 0, 1.6, 0, g); for (const dz of [-0.45, 0, 0.45]) { box(0.08, 1.6, 0.08, 0x9aa8b8, -0.9, 0.8, dz, g); box(0.08, 1.6, 0.08, 0x9aa8b8, 0.9, 0.8, dz, g); } }
    else if (p.k === 'crates') { box(1, 1, 1, 0x8a5a2a, -0.4, 0.5, 0, g); box(0.8, 0.8, 0.8, 0xa8723a, 0.5, 0.4, 0.2, g); }
    else if (p.k === 'hq') { box(11, 3.2, 7, 0xd8d2c2, 0, 1.6, 0, g); box(11.6, 0.6, 7.6, 0x2f6b4a, 0, 3.5, 0, g); box(1.6, 2, 0.2, 0x6b4423, 0, 1, 3.55, g); box(3, 0.8, 0.2, 0xf0c24b, 0, 2.6, 3.6, g); box(1.2, 0.9, 0.2, 0x9ad0f0, -3, 1.8, 3.55, g); box(1.2, 0.9, 0.2, 0x9ad0f0, 3, 1.8, 3.55, g); }
    else if (p.k === 'shed') { box(6, 2.8, 5, 0xc2b48a, 0, 1.4, 0, g); box(6.4, 0.4, 5.4, 0x8a4a2a, 0, 3, 0, g); box(2.4, 1.8, 0.2, 0x6b4423, 0, 0.9, 2.55, g); }
    else if (p.k === 'supply') { box(5, 2.2, 3, 0xb8c8d2, 0, 1.1, 0, g); box(1.2, 0.8, 0.8, 0xf0c24b, -1, 0.4, 2, g); box(1, 0.6, 0.8, 0xe25b4a, 1, 0.3, 2, g); }
    else if (p.k === 'board') { box(4.4, 2.6, 0.3, 0x6b4423, 0, 1.6, 0, g); box(4, 2, 0.2, 0xf4f0e2, 0, 1.7, 0.2, g); box(0.8, 0.6, 0.1, 0xe25b4a, -1, 2, 0.32, g); box(0.8, 0.6, 0.1, 0x3a8ad2, 0.4, 1.4, 0.32, g); box(0.8, 0.6, 0.1, 0x2f8a4a, 1.2, 2.1, 0.32, g); }
    else if (p.k === 'fire') { box(1.2, 0.3, 1.2, 0x6b4423, 0, 0.15, 0, g); box(0.5, 0.8, 0.5, 0xff8a2a, 0, 0.6, 0, g); box(0.3, 0.5, 0.3, 0xffd24a, 0, 1, 0, g); }
    else if (p.k === 'flag') { box(0.15, 4, 0.15, 0x999999, 0, 2, 0, g); box(1.6, 0.9, 0.08, 0x2f8a4a, 0.8, 3.4, 0, g); }
    else if (p.k === 'arch') { const pc = p.cave ? 0x5a5a66 : p.to === 'blossom' ? 0xd23a3a : 0x6b4423, tc = p.cave ? 0x7af0ff : p.to === 'blossom' ? 0x2a2a2a : 0xf0c24b; box(0.8, 4, 0.8, pc, -4.4, 2, 0, g); box(0.8, 4, 0.8, pc, 4.4, 2, 0, g); if (p.cave) glow(9.6, 0.8, 0.9, tc, 0, 4.2, 0, g); else box(9.6, 0.8, 0.9, tc, 0, 4.2, 0, g); if (p.to === 'blossom') box(11, 0.4, 1, 0xd23a3a, 0, 4.8, 0, g); if (p.cave) { light(g.x - 4.4, g.y + 4.5, g.z, 0x7af0ff, 'crystal'); } }
    else if (p.k === 'sign') { box(0.2, 1.4, 3, p.color || 0xf4f0e2, 0, 1.6, 0, g); box(0.2, 1.6, 0.2, 0x6b4423, 0, 0.6, -1.2, g); box(0.2, 1.6, 0.2, 0x6b4423, 0, 0.6, 1.2, g); }
    /* ---- Re-Blocked props ---- */
    else if (p.k === 'crystal') { if (p.wall) { g.x += p.wall[0] * 0.35; g.z += p.wall[1] * 0.35; } const c = rnd() < 0.5 ? 0x7af0ff : 0xc08aff; glow(0.5 * s, 1.8 * s, 0.5 * s, c, 0, 0.9 * s, 0, g); glow(0.35 * s, 1.1 * s, 0.35 * s, c, 0.45 * s, 0.55 * s, 0.2, g); glow(0.3 * s, 0.8 * s, 0.3 * s, c, -0.35 * s, 0.4 * s, -0.25, g); box(1.3 * s, 0.3, 1.1 * s, 0x4a4a58, 0, 0.15, 0, g); light(g.x, g.y + 1.4, g.z, c, 'crystal'); }
    else if (p.k === 'stalag') { box(0.9 * s, 1.2 * s, 0.9 * s, 0x6a6470, 0, 0.6 * s, 0, g); box(0.5 * s, 1.0 * s, 0.5 * s, 0x7a7480, 0, 1.6 * s, 0, g); box(0.25, 0.7 * s, 0.25, 0x8a8490, 0, 2.4 * s, 0, g); if (m.ceil) { const cy = m.ceil - g.y; box(0.8 * s, 1.0 * s, 0.8 * s, 0x5a5462, 0.6, cy - 0.5 * s, 0.4, g); box(0.35, 0.8 * s, 0.35, 0x6a6470, 0.6, cy - 1.3 * s, 0.4, g); } }
    else if (p.k === 'gshroom') { const c = rnd() < 0.5 ? 0x5affb0 : 0xffd84a, cd = c === 0x5affb0 ? 0x2a9a6a : 0xc8962a;
      const one = (ox, oz, sc) => { box(0.22 * sc, 0.9 * sc, 0.22 * sc, 0xe8e0d0, ox, 0.45 * sc, oz, g); box(0.34 * sc, 0.12 * sc, 0.34 * sc, 0xd8ccb8, ox, 0.12 * sc, oz, g); box(0.85 * sc, 0.12 * sc, 0.85 * sc, cd, ox, 0.86 * sc, oz, g); glow(0.75 * sc, 0.28 * sc, 0.75 * sc, c, ox, 1.05 * sc, oz, g); glow(0.42 * sc, 0.16 * sc, 0.42 * sc, c, ox, 1.25 * sc, oz, g); box(0.12 * sc, 0.06, 0.12 * sc, 0xffffff, ox + 0.2 * sc, 1.2 * sc, oz + 0.1 * sc, g); };
      one(0, 0, s); one(0.5, 0.3, s * 0.6); one(-0.35, 0.4, s * 0.45); }
    else if (p.k === 'rockform') { box(2.2 * s, 1.4 * s, 1.8 * s, 0x5a5a66, 0, 0.7 * s, 0, g); box(1.4 * s, 1.2 * s, 1.2 * s, 0x6a6a76, 0.3, 1.9 * s, -0.2, g); box(0.7 * s, 0.9 * s, 0.7 * s, 0x7a7a86, 0.2, 2.9 * s, 0, g); box(1 * s, 0.7 * s, 1 * s, 0x4a4a56, -1.1 * s, 0.35 * s, 0.6, g); glow(0.25, 0.6, 0.25, 0xc08aff, -0.6 * s, 1.6 * s, 0.5, g); }
    else if (p.k === 'rubble') { for (let q = 0; q < 4; q++) { const w = 0.25 + rnd() * 0.35; box(w, w * 0.7, w, rnd() < 0.5 ? 0x6a6a74 : 0x56566a, (rnd() - 0.5) * 1.4, w * 0.35, (rnd() - 0.5) * 1.4, g); } }
    else if (p.k === 'puddle') { box(2.4 * s, 0.06, 1.6 * s, 0x2a5a8a, 0, 0.03, 0, g); box(1.6 * s, 0.07, 2.2 * s, 0x2f6a9a, 0.3, 0.035, 0.2, g); glow(0.3, 0.08, 0.3, 0x7af0ff, 0.5, 0.06, -0.3, g); }
    else if (p.k === 'ratplay') { box(5, 0.25, 3, 0xc8a06a, 0, 0.12, 0, g); for (let q = 0; q < 10; q++) box(0.3, 0.08, 0.3, 0xe8d8a8, -2.2 + (q % 5) * 1.1, 0.29, q < 5 ? -1 : 1, g);
      box(1.6, 1.4, 1.4, 0x6a4a8a, -1.5, 0.95, 0, g); box(1.8, 0.4, 1.6, 0xf0c24b, -1.5, 1.85, 0, g); box(0.6, 0.6, 0.1, 0x2a1a1a, -1.5, 0.6, 0.71, g); box(0.4, 0.4, 0.1, 0x9ad0f0, -1.1, 1.2, 0.71, g);
      box(2.2, 0.4, 0.4, 0x7ad2ff, 0.4, 1.9, 0, g); box(0.4, 1.4, 0.4, 0x7ad2ff, 1.5, 1.4, 0, g); box(0.4, 0.4, 1.2, 0xff7ab8, 1.5, 0.5, 0.6, g);
      box(0.6, 0.12, 1.8, 0x9a6a3a, 0.4, 0.75, -0.9, g); box(0.12, 1.4, 0.12, 0xb8c0c8, 2.1, 0.8, -1.3, g); box(0.12, 1.4, 0.12, 0xb8c0c8, 2.1, 0.8, 1.3, g); box(0.1, 0.08, 2.6, 0xe25b4a, 2.1, 1.1, 0, g); box(0.4, 0.3, 2.2, 0xe25b4a, 2.1, 0.95, 0, g);
      box(0.15, 1.1, 1.1, 0x9a9aa8, 0.4, 0.8, 1.0, g); box(0.6, 0.3, 0.6, 0xffd23f, -0.3, 0.4, 1.1, g); }
    else if (p.k === 'bedding') { box(2.6, 0.2, 1.4, 0xe8d8a8, 0, 0.1, 0, g); box(0.6, 0.3, 0.6, 0xf4f0e2, -0.6, 0.25, 0.2, g); box(0.5, 0.25, 0.5, 0xff9ad0, 0.7, 0.22, -0.1, g); }
    else if (p.k === 'zsign') { box(0.12, 1.5, 0.12, 0x6b4423, -0.9, 0.75, 0, g); box(0.12, 1.5, 0.12, 0x6b4423, 0.9, 0.75, 0, g); box(2.1, 0.62, 0.1, 0x6b4423, 0, 1.45, 0, g); signs.push({ t: p.t, c: p.c, x: g.x, y: g.y + 1.45, z: g.z + 0.06 }); }
    else if (p.k === 'torch') { box(0.18, 1.6, 0.18, 0x6b4423, 0, 0.8, 0, g); box(0.3, 0.2, 0.3, 0x3a3a3a, 0, 1.65, 0, g); glow(0.22, 0.3, 0.22, 0xffb02a, 0, 1.9, 0, g); glow(0.12, 0.18, 0.12, 0xfff0a0, 0, 2.1, 0, g); light(g.x, g.y + 2.1, g.z, 0xffa040, 'torch'); }
    else if (p.k === 'cart') { box(0.15, 0.1, 3.4, 0x8a8a90, -0.5, 0.1, 0, g); box(0.15, 0.1, 3.4, 0x8a8a90, 0.5, 0.1, 0, g); for (const tz of [-1.4, -0.7, 0, 0.7, 1.4]) box(1.4, 0.08, 0.25, 0x6b4423, 0, 0.04, tz, g); box(1.2, 0.7, 1.4, 0x5a5a62, 0, 0.6, 0, g); box(1.0, 0.25, 1.2, 0x2a2a2a, 0, 1.0, 0, g); glow(0.3, 0.2, 0.3, 0x7af0ff, -0.2, 1.15, 0.1, g); glow(0.25, 0.18, 0.25, 0xffd84a, 0.25, 1.12, -0.2, g); }
    else if (p.k === 'cherry') { box(0.5, 2.6 * s, 0.5, 0x5a3a2a, 0, 1.3 * s, 0, g); box(0.3, 0.3, 1.4 * s, 0x5a3a2a, 0, 2.2 * s, 0.5, g); box(2.8 * s, 1.4 * s, 2.8 * s, 0xf6a8c8, 0, 3.0 * s, 0, g); box(2 * s, 1 * s, 2 * s, 0xffc4dc, 0.3, 3.9 * s, -0.2, g); box(1.2 * s, 0.6 * s, 1.2 * s, 0xf090b8, -0.8, 2.4 * s, 0.9, g); box(1.6 * s, 0.05, 1.4 * s, 0xf8b8d0, 0.6, 0.03, 0.5, g); }
    else if (p.k === 'bamboo') { for (const o of [[0, 0, 3.6], [0.45, 0.3, 3], [-0.35, 0.4, 2.6]]) { box(0.2, o[2] * s, 0.2, 0x7ab84a, o[0], o[2] * s / 2, o[1], g); box(0.24, 0.08, 0.24, 0x5a9a3a, o[0], o[2] * s * 0.5, o[1], g); box(0.6, 0.08, 0.2, 0x8ac85a, o[0] + 0.3, o[2] * s - 0.2, o[1], g); } }
    else if (p.k === 'flowers') { const cs = [0xff5a8a, 0xffd84a, 0xffffff, 0xb88aff, 0xff8a3a]; for (let f = 0; f < 3; f++) { const fx = (rnd() - 0.5) * 0.8, fz = (rnd() - 0.5) * 0.8; box(0.06, 0.4, 0.06, 0x4a8a3a, fx, 0.2, fz, g); box(0.2, 0.15, 0.2, cs[(rnd() * cs.length) | 0], fx, 0.45, fz, g); } }
    else if (p.k === 'slantern') { box(0.7, 0.3, 0.7, 0x9a9a92, 0, 0.15, 0, g); box(0.3, 0.9, 0.3, 0xa8a8a0, 0, 0.75, 0, g); box(0.8, 0.15, 0.8, 0x9a9a92, 0, 1.25, 0, g); glow(0.45, 0.45, 0.45, 0xffd890, 0, 1.55, 0, g); box(1.0, 0.18, 1.0, 0x8a8a82, 0, 1.88, 0, g); box(0.3, 0.2, 0.3, 0x8a8a82, 0, 2.05, 0, g); light(g.x, g.y + 1.6, g.z, 0xffc070, 'lantern'); }
    else if (p.k === 'igloo') { box(3.4, 1.6, 3.4, 0xf2f8fc, 0, 0.8, 0, g); box(2.4, 0.9, 2.4, 0xeaf2f8, 0, 2, 0, g); box(1.1, 1.1, 1.0, 0xe2ecf4, 0, 0.55, 1.9, g); box(0.7, 0.8, 0.1, 0x2a3a4a, 0, 0.45, 2.42, g); }
    else if (p.k === 'lamp') { box(0.2, 3.2, 0.2, 0x3a3a40, 0, 1.6, 0, g); box(0.6, 0.15, 0.6, 0x2a2a30, 0, 3.25, 0, g); glow(0.4, 0.45, 0.4, 0xfff0b0, 0, 3.0, 0, g); light(g.x, g.y + 3, g.z, 0xffe0a0, 'lamp'); }
    else if (p.k === 'bench') { const r = p.rot || 0, cx = Math.cos(r), sx = Math.sin(r); void cx; void sx; box(2.2, 0.15, 0.6, 0x9a6a3a, 0, 0.55, 0, g); box(2.2, 0.5, 0.12, 0x8a5a2a, 0, 0.9, r ? 0.3 : -0.3, g); box(0.15, 0.5, 0.5, 0x3a3a3a, -0.9, 0.25, 0, g); box(0.15, 0.5, 0.5, 0x3a3a3a, 0.9, 0.25, 0, g); }
    else if (p.k === 'flowerbed') { box(3, 0.4, 1.4, 0x7a5a3a, 0, 0.2, 0, g); box(2.8, 0.1, 1.2, 0x5a3a22, 0, 0.42, 0, g); const cs = [0xff5a8a, 0xffd84a, 0xb88aff, 0xff8a3a, 0xffffff]; for (let f = 0; f < 10; f++) { const fx = -1.2 + (f % 5) * 0.6, fz = f < 5 ? -0.3 : 0.3; box(0.06, 0.35, 0.06, 0x4a8a3a, fx, 0.6, fz, g); box(0.22, 0.16, 0.22, cs[f % cs.length], fx, 0.8, fz, g); } }
    else if (p.k === 'pond') { box(6, 0.3, 4, 0x8a8a8a, 0, 0.15, 0, g); box(5.2, 0.32, 3.2, 0x3a9ad0, 0, 0.17, 0, g); box(0.9, 0.1, 0.9, 0x5aa04a, -1.5, 0.36, 0.5, g); box(0.7, 0.1, 0.7, 0x5aa04a, 1.2, 0.36, -0.6, g); box(1.2, 0.6, 1.0, 0x9a9a9a, 2.4, 0.3, 1.4, g); box(0.5, 0.15, 0.3, 0xff8a3a, 0.4, 0.36, 0.3, g); }
    else if (p.k === 'kennel') { box(3, 2, 2.4, 0xd25a7a, 0, 1, 0, g); box(3.3, 0.3, 2.7, 0x8a3a4a, 0, 2.1, 0, g); box(1.2, 1.2, 0.1, 0x2a1a1a, 0, 0.6, 1.22, g); box(1.6, 0.3, 0.1, 0xffffff, 0, 1.6, 1.24, g); box(0.6, 0.25, 0.6, 0x3a6ad2, 1.8, 0.12, 1.4, g); box(0.4, 0.1, 0.4, 0xc8a06a, 1.8, 0.28, 1.4, g); box(0.25, 0.25, 0.7, 0xf2f2f2, -1.9, 0.12, 1.3, g); }
    else if (p.k === 'rathouse') { box(3.4, 2.2, 2.6, 0xf0c24b, 0, 1.1, 0, g); box(3.7, 0.3, 2.9, 0x6a4a8a, 0, 2.3, 0, g); box(2.4, 0.6, 2, 0x6a4a8a, 0, 2.7, 0, g); box(0.8, 0.8, 0.1, 0x2a1a1a, -0.8, 0.4, 1.32, g); box(0.6, 0.6, 0.1, 0x9ad0f0, 0.8, 1.3, 1.32, g); box(0.8, 0.5, 0.8, 0xf2d24a, 2.1, 0.25, 1, g); box(0.3, 0.3, 0.3, 0xe8a83a, 2.1, 0.6, 1, g); }
    else if (p.k === 'rails') { const L = p.len || 12; box(0.15, 0.1, L, 0x8a8a90, -0.5, 0.1, 0, g); box(0.15, 0.1, L, 0x8a8a90, 0.5, 0.1, 0, g); for (let tz = -L / 2 + 0.4; tz < L / 2; tz += 0.8) box(1.4, 0.08, 0.25, 0x6b4423, 0, 0.04, tz, g); box(1.6, 0.6, 0.3, 0x6b4423, 0, 0.3, L / 2, g); }
    else if (p.k === 'minetent') { box(4, 0.15, 3, 0x6b4423, 0, 0.08, 0, g); box(0.15, 2.4, 0.15, 0x6b4423, -1.9, 1.2, -1.4, g); box(0.15, 2.4, 0.15, 0x6b4423, 1.9, 1.2, -1.4, g); box(0.15, 2.4, 0.15, 0x6b4423, -1.9, 1.2, 1.4, g); box(0.15, 2.4, 0.15, 0x6b4423, 1.9, 1.2, 1.4, g); box(4.3, 0.2, 3.3, 0xc8a24a, 0, 2.45, 0, g); box(1.6, 0.6, 0.8, 0x8a5a2a, -0.9, 0.45, -0.6, g); box(0.8, 0.5, 0.8, 0x5a7a9a, 1, 0.33, 0.6, g); glow(0.25, 0.3, 0.25, 0xffc070, -0.9, 0.95, -0.6, g); light(g.x, g.y + 1.6, g.z, 0xffb060, 'torch'); }
    else if (p.k === 'pickrack') { box(2.4, 0.15, 0.4, 0x6b4423, 0, 1.4, 0, g); box(0.15, 1.5, 0.15, 0x6b4423, -1.1, 0.75, 0, g); box(0.15, 1.5, 0.15, 0x6b4423, 1.1, 0.75, 0, g); for (const x of [-0.6, 0, 0.6]) { box(0.08, 1.1, 0.08, 0x8a5a2a, x, 0.85, 0.15, g); box(0.5, 0.1, 0.1, 0x9aa0a8, x, 1.3, 0.15, g); } }
    else if (p.k === 'barrel') { box(0.8, 1, 0.8, 0x8a5a2a, 0, 0.5, 0, g); box(0.84, 0.1, 0.84, 0x3a3a3a, 0, 0.25, 0, g); box(0.84, 0.1, 0.84, 0x3a3a3a, 0, 0.75, 0, g); }
    else if (p.k === 'minesign') { box(0.15, 1.6, 0.15, 0x6b4423, -1, 0.8, 0, g); box(0.15, 1.6, 0.15, 0x6b4423, 1, 0.8, 0, g); box(2.6, 0.8, 0.12, 0x9a6a3a, 0, 1.5, 0, g); glow(0.3, 0.3, 0.13, 0xffd23f, -0.8, 1.5, 0.01, g); }
    else if (p.k === 'lantern') { box(0.15, 2.2, 0.15, 0x3a3a3a, 0, 1.1, 0, g); box(0.5, 0.08, 0.08, 0x3a3a3a, 0.2, 2.15, 0, g); glow(0.3, 0.35, 0.3, 0xffc070, 0.4, 1.9, 0, g); light(g.x + 0.4, g.y + 1.9, g.z, 0xffb060, 'torch'); }
    else if (p.k === 'pfence') { const c = p.c || 0xffffff; box(0.2, 1.0, 0.2, c, 0, 0.5, 0, g); box(2, 0.14, 0.1, c, 1, 0.75, 0, g); box(2, 0.14, 0.1, c, 1, 0.4, 0, g); }
    else if (p.k === 'pfencez') { const c = p.c || 0xffffff; box(0.2, 1.0, 0.2, c, 0, 0.5, 0, g); box(0.1, 0.14, 2, c, 0, 0.75, 1, g); box(0.1, 0.14, 2, c, 0, 0.4, 1, g); }
    else if (p.k === 'burrow') { box(4, 1.4, 3, 0x8a6440, 0, 0.7, 0, g); box(3, 0.8, 2.4, 0x9a7450, 0, 1.6, 0, g); box(1.4, 0.9, 0.2, 0x2a1a10, 0, 0.45, 1.5, g); box(1.8, 0.2, 0.4, 0x7a5430, 0, 0.1, 1.8, g); box(0.6, 0.5, 0.6, 0x5aa04a, 1.4, 2.1, -0.4, g); box(0.4, 0.4, 0.4, 0x7ad25a, -1.2, 2.0, 0.5, g); }
    else if (p.k === 'bone') { box(0.7, 0.15, 0.2, 0xf4f0e2, 0, 0.08, 0, g); box(0.2, 0.2, 0.35, 0xf4f0e2, -0.35, 0.1, 0, g); box(0.2, 0.2, 0.35, 0xf4f0e2, 0.35, 0.1, 0, g); }
    else if (p.k === 'tug') { box(1.4, 0.12, 0.12, 0xe25b4a, 0, 0.06, 0, g); box(0.2, 0.2, 0.2, 0xf4f4f4, -0.7, 0.1, 0, g); box(0.2, 0.2, 0.2, 0x3a8ad2, 0.7, 0.1, 0, g); }
    else if (p.k === 'hoop') { box(0.15, 1.4, 0.15, 0xffffff, -0.9, 0.7, 0, g); box(0.15, 1.4, 0.15, 0xffffff, 0.9, 0.7, 0, g); box(1.6, 0.15, 0.12, 0xff4fa0, 0, 1.1, 0, g); box(0.15, 0.8, 0.12, 0xff4fa0, -0.75, 0.75, 0, g); box(0.15, 0.8, 0.12, 0xff4fa0, 0.75, 0.75, 0, g); box(1.6, 0.15, 0.12, 0xff4fa0, 0, 0.4, 0, g); }
    else if (p.k === 'tire') { box(1.2, 0.35, 1.2, 0x2a2a2a, 0, 0.18, 0, g); box(0.6, 0.37, 0.6, 0x3f8a38, 0, 0.18, 0, g); }
    else if (p.k === 'ratcage') { box(4.4, 0.3, 4.4, 0xd8d2c4, 0, 0.15, 0, g); for (const dx of [-2.1, -1.05, 0, 1.05, 2.1]) for (const dz of [-2.1, 2.1]) { box(0.06, 2.6, 0.06, 0xb8c0c8, dx, 1.45, dz, g); box(0.06, 2.6, 0.06, 0xb8c0c8, dz, 1.45, dx, g); } box(4.4, 0.12, 4.4, 0xb8c0c8, 0, 2.8, 0, g); box(4.4, 0.12, 0.08, 0xb8c0c8, 0, 1.5, 2.1, g); box(3.6, 0.15, 1.4, 0xf0c24b, 0, 1.4, -1.2, g); box(1.2, 0.8, 1.0, 0x6a4a8a, -1.3, 0.7, 1.2, g); box(0.5, 0.5, 0.1, 0x2a1a1a, -1.3, 0.6, 1.71, g); box(0.4, 0.4, 2.6, 0x7ad2ff, 1.4, 1.8, 0, g); box(0.15, 1.2, 0.5, 0x9a6a3a, 0.4, 0.9, -0.3, g); box(1.2, 0.08, 0.7, 0xe25b4a, -0.6, 2.2, 0.6, g); box(0.9, 0.12, 0.6, 0xc8a06a, 1.2, 0.36, 1.3, g); }
    else if (p.k === 'hlamp') { box(0.2, 1.6, 0.2, 0x6b4423, 0, 0.8, 0, g); glow(0.5, 0.3, 0.5, 0xffc070, 0, 1.75, 0, g); light(g.x, g.y + 1.8, g.z, 0xffb060, 'lamp'); }
    else if (p.k === 'bowl') { box(0.6, 0.2, 0.6, p.c || 0xff4fa0, 0, 0.1, 0, g); box(0.45, 0.06, 0.45, 0xc8a06a, 0, 0.21, 0, g); }
    else if (p.k === 'ball') { box(0.45, 0.45, 0.45, 0xffd84a, 0, 0.23, 0, g); box(0.47, 0.1, 0.47, 0xe25b4a, 0, 0.23, 0, g); }
    else if (p.k === 'cheese') { box(1.0, 0.5, 0.8, 0xffd23f, 0, 0.25, 0, g); box(0.15, 0.15, 0.02, 0xe0a820, 0.2, 0.3, 0.41, g); box(0.12, 0.12, 0.02, 0xe0a820, -0.25, 0.18, 0.41, g); }
    else if (p.k === 'hay') { box(1.4, 0.7, 0.9, 0xe2c26a, 0, 0.35, 0, g); box(1.42, 0.08, 0.92, 0xb8984a, 0, 0.35, 0, g); }
    else if (p.k === 'lettuce') { box(0.5, 0.35, 0.5, 0x7ad25a, 0, 0.18, 0, g); box(0.3, 0.2, 0.3, 0xa8e87a, 0, 0.4, 0, g); box(0.5, 0.2, 0.3, 0xff7a3a, 0.6, 0.1, 0, g); }
    else if (p.k === 'wheel') { box(0.15, 1.3, 1.3, 0x9a9aa8, 0, 0.75, 0, g); box(0.5, 0.25, 0.25, 0x6a6a78, 0.2, 0.75, 0, g); box(0.3, 0.4, 0.3, 0x6a6a78, 0.3, 0.2, 0, g); }
    else if (p.k === 'ttsign') { box(0.15, 1.4, 0.15, 0x6b4423, 0, 0.7, 0, g); box(1.6, 0.8, 0.12, 0x3a8ad2, 0, 1.5, 0, g); box(0.5, 0.3, 0.13, 0x9aa86a, 0, 1.5, 0.01, g); }
    else if (p.k === 'petsign') { box(0.2, 1.6, 0.2, 0x6b4423, -1.6, 0.8, 0, g); box(0.2, 1.6, 0.2, 0x6b4423, 1.6, 0.8, 0, g); box(3.8, 1, 0.2, 0xff7ab8, 0, 1.7, 0, g); }
  }
  void G0;
  // sanctuary fences
  for (const sc of (m.sanct || [])) {
    for (let x = sc.x0; x <= sc.x1; x++) for (let z = sc.z0; z <= sc.z1; z++) {
      const edge = x === sc.x0 || x === sc.x1 || z === sc.z0 || z === sc.z1; if (!edge) continue;
      const j = m.idx(x + 0.5, z + 0.5); if (j < 0 || m.S[j] !== 3) continue;
      const g = { x: x + 0.5, y: m.H[j], z: z + 0.5 };
      box(0.25, 1.4, 0.25, 0x8a5a2a, 0, 0.7, 0, g); box(x === sc.x0 || x === sc.x1 ? 0.12 : 1, 0.15, x === sc.x0 || x === sc.x1 ? 1 : 0.12, 0xb8884a, 0, 1.1, 0, g);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  geo.setIndex(I);
  const pm = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map: blockTex(), roughness: 0.78, envMapIntensity: 0.4, side: THREE.DoubleSide })); pm.castShadow = true; pm.receiveShadow = true; grp.add(pm);
  if (gbase) { const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(GPp, 3)); g2.setAttribute('color', new THREE.Float32BufferAttribute(GCc, 3)); g2.setIndex(GIi); grp.add(new THREE.Mesh(g2, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }))); }
  V.lights = lights;
  // world-space sign faces: 4:1 canvas on a 2:0.5 plane (never stretched), they sit on posts and never float over the HUD
  signs.forEach((sg) => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#f4ead2'; x.fillRect(0, 0, 256, 64); x.strokeStyle = sg.c; x.lineWidth = 8; x.strokeRect(4, 4, 248, 56); x.fillStyle = '#2a1a10'; x.font = 'bold 30px Trebuchet MS, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(sg.t, 128, 34);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const pl = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.5), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 })); pl.position.set(sg.x, sg.y, sg.z); grp.add(pl); const b2 = pl.clone(); b2.rotation.y = Math.PI; b2.position.z -= 0.12; grp.add(b2); });
  // floating labels for gates / sanctuaries / camp spots
  const lab = (text, x, y, z, color, w) => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
    g.fillStyle = 'rgba(20,30,20,0.78)'; g.fillRect(0, 0, 512, 128); g.strokeStyle = color || '#f0c24b'; g.lineWidth = 10; g.strokeRect(5, 5, 502, 118);
    g.fillStyle = '#fff'; g.font = 'bold 54px Trebuchet MS, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 66);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, fog: false, toneMapped: false })); sp.scale.set(w || 7, (w || 7) / 4, 1); sp.position.set(x, y, z); grp.add(sp);
  };
  m.gates.forEach((gt) => lab(gt.label, gt.x, m.h(gt.x, gt.z) + 6.5, gt.z + (m.id === 'camp' ? (gt.south ? -1 : 1) : -1)));
  (m.sanct || []).forEach((sc) => lab(sc.name.toUpperCase(), sc.x, 7, sc.z, '#' + sc.color.toString(16), 12));
  if (m.board) lab('CASE BOARD', m.board.x, 5, m.board.z - 0.5, '#e25b4a', 6);
  if (m.shop) lab('UPGRADES', m.shop.x + 1, 5.6, m.shop.z - 4, '#3fc8ff', 6);
  if (m.supply) lab('DART SUPPLY', m.supply.x - 0.5, 5, m.supply.z - 4, '#f0c24b', 6);
  if (m.pcamp) lab('POACHER CAMP', m.pcamp.x, m.h(m.pcamp.x, m.pcamp.z) + 6, m.pcamp.z, '#ff4d4d', 8);
}

/* ---------- actors ---------- */
const actors = {};
function ensure(key, build) { if (!actors[key]) { actors[key] = build(); scene.add(actors[key]); V._envDirty = 1; } return actors[key]; }
const BOXG = {};
function boxG(w, h, d) { const k = w + ',' + h + ',' + d; return BOXG[k] || (BOXG[k] = new THREE.BoxGeometry(w, h, d)); }
function blocky(parts) { const g = new THREE.Group(); for (const p of parts) { const mesh = new THREE.Mesh(boxG(p[0], p[1], p[2]), p[7] ? gmat(p[3]) : mat(p[3], false)); mesh.position.set(p[4], p[5], p[6]); mesh.castShadow = !p[7]; g.add(mesh); } return g; }
V.blocky = blocky;
V.meKind = () => (actors.me ? actors.me.userData.kind : null);
V.clearActors = function () { for (const k in actors) { scene.remove(actors[k]); } for (const k in actors) delete actors[k]; };
V.ensure = ensure;

function ranger(color) { return blocky([[0.32, 0.8, 0.36, 0x3a3a3a, -0.18, 0.4, 0], [0.32, 0.8, 0.36, 0x3a3a3a, 0.18, 0.4, 0], [0.34, 0.12, 0.42, 0x5a3a22, -0.18, 0.06, 0.03], [0.34, 0.12, 0.42, 0x5a3a22, 0.18, 0.06, 0.03], [0.8, 0.7, 0.5, color, 0, 1.15, 0], [0.82, 0.1, 0.52, 0x6b4423, 0, 0.84, 0], [0.22, 0.65, 0.24, color, -0.52, 1.15, 0], [0.22, 0.65, 0.24, color, 0.52, 1.15, 0], [0.2, 0.2, 0.22, 0xf2c8a2, -0.52, 0.75, 0], [0.2, 0.2, 0.22, 0xf2c8a2, 0.52, 0.75, 0], [0.5, 0.5, 0.5, 0xf2c8a2, 0, 1.75, 0], [0.08, 0.08, 0.02, 0x1a1a1a, -0.11, 1.8, 0.26], [0.08, 0.08, 0.02, 0x1a1a1a, 0.11, 1.8, 0.26], [0.62, 0.22, 0.62, 0xf0c24b, 0, 2.08, 0], [0.78, 0.06, 0.78, 0xf0c24b, 0, 1.98, 0], [0.16, 0.12, 0.06, 0xfff4b0, 0, 2.0, 0.34, 1], [0.5, 0.55, 0.22, 0x6b5a3a, 0, 1.2, -0.36]]); }
function animalMesh(sp) {
  const d = GB.SPECIES[sp], c = d.color, c2 = d.color2, s = d.size;
  if (sp === 'giraffe') return blocky([[0.5, 2.6, 0.5, c, -0.3, 1.5, 0.2], [0.5, 2.6, 0.5, c, 0.3, 1.5, 0.2], [0.5, 2.4, 0.5, c, -0.3, 1.4, -0.7], [0.5, 2.4, 0.5, c, 0.3, 1.4, -0.7], [1.3, 1.2, 2.2, c, 0, 3.1, -0.3], [0.45, 1.5, 0.45, c, 0, 4.2, 0.9], [0.55, 0.7, 0.9, c, 0, 4.7, 1.4], [0.1, 0.5, 0.1, c2, -0.15, 5.2, 1.3], [0.1, 0.5, 0.1, c2, 0.15, 5.2, 1.3]]);
  if (sp === 'elephant') return blocky([[0.7, 1.6, 0.7, c, -0.6, 0.9, 0.4], [0.7, 1.6, 0.7, c, 0.6, 0.9, 0.4], [0.7, 1.5, 0.7, c, -0.6, 0.85, -0.8], [0.7, 1.5, 0.7, c, 0.6, 0.85, -0.8], [2.2, 1.8, 3, c, 0, 2.2, -0.2], [1.4, 1.3, 1.4, c, 0, 3, 1.3], [0.5, 1.4, 0.5, c, 0, 1.6, 2], [0.9, 0.3, 0.7, c2, -0.9, 3.2, 0.2], [0.9, 0.3, 0.7, c2, 0.9, 3.2, 0.2]]);
  if (sp === 'zebra') {
    const P = [[1, 0.9, 1.8, c, 0, 1.4, -0.1], [0.45, 0.7, 0.7, c, 0, 1.9, 0.9], [0.5, 0.5, 0.45, c, 0, 2.05, 1.35], [0.52, 0.3, 0.2, c2, 0, 1.95, 1.62], [0.16, 0.9, 0.16, c2, 0, 2.1, 0.75], [0.15, 0.7, 0.15, c2, 0, 1.6, -1.1]];
    for (const lx of [-0.3, 0.3]) for (const lz of [0.4, -0.5]) { P.push([0.3, 1, 0.3, c, lx, 0.6, lz], [0.34, 0.12, 0.34, c2, lx, 0.45, lz], [0.34, 0.12, 0.34, c2, lx, 0.8, lz], [0.34, 0.14, 0.34, c2, lx, 0.1, lz]); }
    for (const z of [-0.78, -0.45, -0.12, 0.2, 0.5]) P.push([1.06, 0.94, 0.15, c2, 0, 1.42, z]);
    for (const z of [0.72, 0.98, 1.2]) P.push([0.5, 0.74, 0.1, c2, 0, 1.9 + (z - 0.72) * 0.2, z]);
    return blocky(P);
  }
  if (sp === 'lion') return blocky([[0.35, 0.9, 0.35, c, -0.3, 0.5, 0.35], [0.35, 0.9, 0.35, c, 0.3, 0.5, 0.35], [0.35, 0.9, 0.35, c, -0.3, 0.5, -0.4], [0.35, 0.9, 0.35, c, 0.3, 0.5, -0.4], [1, 0.9, 1.8, c, 0, 1.2, 0], [0.7, 0.7, 0.7, c, 0, 1.7, 0.9], [1.3, 1.3, 0.5, c2, 0, 1.9, 0.7], [0.2, 0.9, 0.2, c2, 0, 1.2, -1]]);
  if (sp === 'rhino') return blocky([[0.55, 1, 0.55, c, -0.5, 0.6, 0.5], [0.55, 1, 0.55, c, 0.5, 0.6, 0.5], [0.55, 1, 0.55, c, -0.5, 0.6, -0.6], [0.55, 1, 0.55, c, 0.5, 0.6, -0.6], [1.7, 1.3, 2.6, c, 0, 1.6, -0.1], [1, 0.9, 1.1, c, 0, 1.7, 1.3], [0.25, 0.7, 0.25, c2, 0, 2.2, 1.9]]);
  if (sp === 'gorilla') return blocky([[0.5, 0.9, 0.5, c, -0.4, 0.5, 0.2], [0.5, 0.9, 0.5, c, 0.4, 0.5, 0.2], [1.6, 1.3, 1.1, c, 0, 1.3, 0], [0.9, 0.9, 0.9, c2, 0, 2.2, 0.3], [0.4, 1.1, 0.4, c, -0.9, 0.9, 0.4], [0.4, 1.1, 0.4, c, 0.9, 0.9, 0.4]]);
  if (sp === 'parrot') return blocky([[0.5, 0.5, 0.8, c, 0, 0.9, 0], [0.25, 0.4, 0.7, c2, -0.45, 1, -0.1], [0.25, 0.4, 0.7, 0x2a6ad4, 0.45, 1, -0.1], [0.3, 0.3, 0.4, 0xf2c24b, 0, 1.2, 0.5], [0.1, 0.4, 0.1, c2, 0, 0.5, 0]]);
  if (sp === 'croc') return blocky([[0.4, 0.4, 0.7, c, -0.4, 0.3, 0.6], [0.4, 0.4, 0.7, c, 0.4, 0.3, 0.6], [0.4, 0.4, 0.7, c, -0.4, 0.3, -0.8], [0.4, 0.4, 0.7, c, 0.4, 0.3, -0.8], [1.1, 0.6, 2.6, c, 0, 0.6, -0.2], [0.7, 0.5, 1.4, c2, 0, 0.7, 1.4], [0.9, 0.3, 1.2, c, 0, 0.5, -1.8]]);
  if (sp === 'flamingo') return blocky([[0.1, 1.1, 0.1, c, -0.1, 0.6, 0], [0.1, 1.1, 0.1, c, 0.1, 0.6, 0], [0.5, 0.5, 0.7, c, 0, 1.3, 0], [0.15, 0.5, 0.15, c, 0, 1.7, 0.4], [0.25, 0.2, 0.4, c2, 0, 1.6, 0.7]]);
  if (sp === 'leopard') return blocky([[0.25, 0.7, 0.25, c, -0.25, 0.4, 0.3], [0.25, 0.7, 0.25, c2, 0.25, 0.4, 0.3], [0.25, 0.7, 0.25, c, -0.25, 0.4, -0.35], [0.25, 0.7, 0.25, c2, 0.25, 0.4, -0.35], [0.8, 0.7, 1.5, c, 0, 1, 0], [0.55, 0.5, 0.55, c, 0, 1.3, 0.8], [0.7, 0.15, 0.4, c2, 0, 1.1, -0.9]]);
  if (sp === 'fox') return blocky([[0.2, 0.5, 0.2, c, -0.15, 0.3, 0.2], [0.2, 0.5, 0.2, c, 0.15, 0.3, 0.2], [0.2, 0.5, 0.2, c, -0.15, 0.3, -0.25], [0.2, 0.5, 0.2, c, 0.15, 0.3, -0.25], [0.6, 0.5, 0.9, c, 0, 0.7, 0], [0.45, 0.4, 0.45, c, 0, 1.05, 0.45], [0.12, 0.45, 0.12, c, -0.15, 1.4, 0.45], [0.12, 0.45, 0.12, c, 0.15, 1.4, 0.45], [0.3, 0.3, 0.4, c2, 0, 0.6, -0.6]]);
  if (sp === 'camel') return blocky([[0.35, 1.4, 0.35, c, -0.35, 0.8, 0.5], [0.35, 1.4, 0.35, c, 0.35, 0.8, 0.5], [0.35, 1.4, 0.35, c, -0.35, 0.8, -0.6], [0.35, 1.4, 0.35, c, 0.35, 0.8, -0.6], [1.2, 1.1, 2.2, c, 0, 2, -0.1], [0.5, 0.7, 0.5, c2, -0.2, 2.7, 0], [0.5, 0.7, 0.5, c2, 0.2, 2.7, -0.5], [0.5, 0.8, 0.6, c, 0, 2.4, 1.2]]);
  if (sp === 'axolotl') return blocky([[0.5, 0.3, 1.0, c, 0, 0.25, 0], [0.6, 0.32, 0.4, c, 0, 0.3, 0.6], [0.16, 0.3, 0.06, c2, -0.34, 0.45, 0.62, 1], [0.16, 0.3, 0.06, c2, 0.34, 0.45, 0.62, 1], [0.16, 0.22, 0.06, c2, -0.36, 0.3, 0.5, 1], [0.16, 0.22, 0.06, c2, 0.36, 0.3, 0.5, 1], [0.08, 0.08, 0.04, 0x1a1a1a, -0.16, 0.38, 0.81], [0.08, 0.08, 0.04, 0x1a1a1a, 0.16, 0.38, 0.81], [0.12, 0.3, 0.8, c, 0, 0.3, -0.8], [0.15, 0.15, 0.2, c, -0.3, 0.1, 0.3], [0.15, 0.15, 0.2, c, 0.3, 0.1, 0.3], [0.15, 0.15, 0.2, c, -0.3, 0.1, -0.3], [0.15, 0.15, 0.2, c, 0.3, 0.1, -0.3]]);
  if (sp === 'glowbat') return blocky([[0.4, 0.4, 0.45, c, 0, 1.4, 0], [0.32, 0.3, 0.3, c, 0, 1.68, 0.12], [0.08, 0.2, 0.08, c, -0.12, 1.9, 0.1], [0.08, 0.2, 0.08, c, 0.12, 1.9, 0.1], [0.08, 0.08, 0.04, c2, -0.08, 1.72, 0.28, 1], [0.08, 0.08, 0.04, c2, 0.08, 1.72, 0.28, 1], [0.9, 0.06, 0.5, 0x4a3a5a, -0.62, 1.48, 0], [0.9, 0.06, 0.5, 0x4a3a5a, 0.62, 1.48, 0], [0.5, 0.04, 0.1, c2, -0.7, 1.5, 0.2, 1], [0.5, 0.04, 0.1, c2, 0.7, 1.5, 0.2, 1]]);
  if (sp === 'cavebear') return blocky([[0.55, 1.0, 0.55, c, -0.5, 0.5, 0.6], [0.55, 1.0, 0.55, c, 0.5, 0.5, 0.6], [0.55, 1.0, 0.55, c, -0.5, 0.5, -0.6], [0.55, 1.0, 0.55, c, 0.5, 0.5, -0.6], [1.5, 1.3, 2.4, c, 0, 1.5, 0], [1.0, 0.9, 0.9, c, 0, 2.0, 1.4], [0.5, 0.4, 0.4, 0x8a6a50, 0, 1.8, 1.95], [0.2, 0.15, 0.1, 0x1a1a1a, 0, 1.95, 2.16], [0.25, 0.25, 0.2, c2, -0.38, 2.55, 1.3], [0.25, 0.25, 0.2, c2, 0.38, 2.55, 1.3], [0.1, 0.1, 0.04, 0xffd84a, -0.25, 2.2, 1.86, 1], [0.1, 0.1, 0.04, 0xffd84a, 0.25, 2.2, 1.86, 1]]);
  if (sp === 'gpanda') return blocky([[0.45, 0.7, 0.45, c2, -0.45, 0.35, 0.5], [0.45, 0.7, 0.45, c2, 0.45, 0.35, 0.5], [0.45, 0.7, 0.45, c2, -0.45, 0.35, -0.5], [0.45, 0.7, 0.45, c2, 0.45, 0.35, -0.5], [1.3, 1.0, 1.9, c, 0, 1.1, 0], [1.32, 0.5, 0.6, c2, 0, 1.25, 0.5], [0.9, 0.85, 0.8, c, 0, 1.6, 1.15], [0.25, 0.25, 0.15, c2, -0.4, 2.1, 1.05], [0.25, 0.25, 0.15, c2, 0.4, 2.1, 1.05], [0.22, 0.25, 0.05, c2, -0.2, 1.65, 1.56], [0.22, 0.25, 0.05, c2, 0.2, 1.65, 1.56], [0.2, 0.12, 0.08, c2, 0, 1.45, 1.58], [0.1, 1.2, 0.1, 0x7ab84a, 0.55, 1.4, 1.3]]);
  if (sp === 'crane') return blocky([[0.08, 1.2, 0.08, 0x2a2a2a, -0.12, 0.6, 0], [0.08, 1.2, 0.08, 0x2a2a2a, 0.12, 0.6, 0], [0.55, 0.5, 0.9, c, 0, 1.45, 0], [0.5, 0.3, 0.5, 0x1a1a1a, 0, 1.4, -0.55], [0.14, 0.9, 0.14, 0x1a1a1a, 0, 1.95, 0.4], [0.22, 0.22, 0.32, c, 0, 2.45, 0.5], [0.12, 0.08, 0.12, c2, 0, 2.6, 0.5], [0.08, 0.08, 0.35, 0xd8b04a, 0, 2.42, 0.82]]);
  if (sp === 'macaque') return blocky([[0.22, 0.6, 0.22, c, -0.25, 0.3, 0.25], [0.22, 0.6, 0.22, c, 0.25, 0.3, 0.25], [0.22, 0.6, 0.22, c, -0.25, 0.3, -0.25], [0.22, 0.6, 0.22, c, 0.25, 0.3, -0.25], [0.7, 0.6, 1.0, c, 0, 0.85, 0], [0.55, 0.55, 0.5, c, 0, 1.35, 0.5], [0.4, 0.35, 0.1, c2, 0, 1.33, 0.76], [0.07, 0.07, 0.03, 0x1a1a1a, -0.1, 1.4, 0.82], [0.07, 0.07, 0.03, 0x1a1a1a, 0.1, 1.4, 0.82], [0.1, 0.1, 0.25, c, 0, 0.95, -0.6]]);
  // generic blocky quadruped
  const L = sp === 'panda' || sp === 'capy' ? 0.45 : 0.9, bw = 0.8 * s, bl = 1.6 * s, bh = 0.8 * s;
  const parts = [[0.28, L, 0.28, c2, -bw / 3, L / 2, bl / 3], [0.28, L, 0.28, c2, bw / 3, L / 2, bl / 3], [0.28, L, 0.28, c2, -bw / 3, L / 2, -bl / 3], [0.28, L, 0.28, c2, bw / 3, L / 2, -bl / 3],
    [bw, bh, bl, c, 0, L + bh / 2, 0], [0.55 * s, 0.55 * s, 0.6 * s, c, 0, L + bh + 0.1, bl / 2 + 0.2]];
  if (sp === 'ibex') parts.push([0.12, 0.7, 0.12, c2, -0.15, L + bh + 0.6, bl / 2], [0.12, 0.7, 0.12, c2, 0.15, L + bh + 0.6, bl / 2]);
  if (sp === 'oryx') parts.push([0.08, 1.1, 0.08, c2, -0.12, L + bh + 0.8, bl / 2], [0.08, 1.1, 0.08, c2, 0.12, L + bh + 0.8, bl / 2], [bw + 0.02, 0.15, bl * 0.8, c2, 0, L + bh * 0.3, 0]);
  if (sp === 'okapi') parts.push([0.3, 0.2, 0.3, c2, -bw / 3, L * 0.7, -bl / 3], [0.3, 0.2, 0.3, c2, bw / 3, L * 0.7, -bl / 3], [0.4 * s, 0.6 * s, 0.4 * s, c, 0, L + bh + 0.3, bl / 2]);
  if (sp === 'panda') parts.push([0.3, 0.3, 0.9, c, 0, L + 0.5, -bl / 2 - 0.3], [0.62 * s, 0.2, 0.2, 0xf2f2f2, 0, L + bh + 0.2, bl / 2 + 0.5]);
  if (sp === 'tapir') parts.push([0.25, 0.25, 0.4, c, 0, L + bh - 0.1, bl / 2 + 0.6], [bw + 0.02, bh * 0.9, 0.5 * s, c2, 0, L + bh / 2, -0.05]);
  return blocky(parts);
}
function truckMesh() {
  return blocky([
    [2.1, 0.7, 4.4, 0x2f6b4a, 0, 0.8, 0], [2, 0.5, 1.5, 0xd8efe2, 0, 1.5, 0.9], [1.9, 0.9, 2.2, 0x24563a, 0, 1.5, -1.1],
    [0.5, 0.5, 0.3, 0x222, -0.8, 0.45, 1.5], [0.5, 0.5, 0.3, 0x222, 0.8, 0.45, 1.5], [0.5, 0.5, 0.3, 0x222, -0.8, 0.45, -1.5], [0.5, 0.5, 0.3, 0x222, 0.8, 0.45, -1.5],
    [0.3, 0.3, 0.1, 0xf2e27a, -0.6, 1.1, 2.2], [0.3, 0.3, 0.1, 0xf2e27a, 0.6, 1.1, 2.2]
  ]);
}
function poacherMesh() { return blocky([[0.6, 0.8, 0.4, 0x2a2a2a, 0, 0.8, 0], [0.8, 0.8, 0.5, 0x6a4a2a, 0, 1.5, 0], [0.5, 0.5, 0.5, 0xf2c8a2, 0, 2.05, 0], [0.7, 0.3, 0.7, 0x222, 0, 2.4, 0]]); }
function jeepMesh() { return blocky([[1.8, 0.6, 3.2, 0x5a4632, 0, 0.7, 0], [1.6, 0.7, 1.2, 0x3a3228, 0, 1.3, 0.4], [0.4, 0.4, 0.2, 0x222, -0.7, 0.4, 1.1], [0.4, 0.4, 0.2, 0x222, 0.7, 0.4, 1.1], [0.4, 0.4, 0.2, 0x222, -0.7, 0.4, -1.1], [0.4, 0.4, 0.2, 0x222, 0.7, 0.4, -1.1]]); }
function rangerJeep() { return blocky([[1.8, 0.6, 3.2, 0x2f6b4a, 0, 0.7, 0], [1.6, 0.7, 1.2, 0xd8efe2, 0, 1.3, 0.4], [0.4, 0.4, 0.2, 0x222, -0.7, 0.4, 1.1], [0.4, 0.4, 0.2, 0x222, 0.7, 0.4, 1.1], [0.4, 0.4, 0.2, 0x222, -0.7, 0.4, -1.1], [0.4, 0.4, 0.2, 0x222, 0.7, 0.4, -1.1]]); }
function droneMesh() { return blocky([[0.95, 0.16, 0.95, 0xd8f6ff, 0, 0, 0], [0.28, 0.12, 0.28, 0x1f6ab0, 0, 0.16, 0], [1.55, 0.06, 0.12, 0x1a1a1a, 0, 0.08, 0], [0.12, 0.06, 1.55, 0x1a1a1a, 0, 0.08, 0], [0.3, 0.08, 0.3, 0x9ee7ff, -0.7, 0.14, 0], [0.3, 0.08, 0.3, 0x9ee7ff, 0.7, 0.14, 0], [0.3, 0.08, 0.3, 0x9ee7ff, 0, 0.14, -0.7], [0.3, 0.08, 0.3, 0x9ee7ff, 0, 0.14, 0.7]]); }
function vanMesh() { return blocky([[2.4, 1.05, 3.6, 0x2c2c36, 0, 0.85, 0], [1.5, 0.7, 1.2, 0x141820, 0, 1.55, 0.35], [0.45, 0.45, 0.28, 0x222, -0.85, 0.32, 1.25], [0.45, 0.45, 0.28, 0x222, 0.85, 0.32, 1.25], [0.45, 0.45, 0.28, 0x222, -0.85, 0.32, -1.25], [0.45, 0.45, 0.28, 0x222, 0.85, 0.32, -1.25], [1.1, 0.28, 0.08, 0xc86bff, 0, 1.15, 1.82]]); }


V.sync = function (W, me, others) {
  // truck
  if (W.truck) { const t = ensure('truck', truckMesh); t.visible = true; t.position.set(W.truck.x, (W.truck.y || W.M.h(W.truck.x, W.truck.z)), W.truck.z); t.rotation.y = W.truck.ang; }
  // animals
  const seen = {};
  for (const e of W.ents) {
    seen['a' + e.id] = 1; const g = ensure('a' + e.id, () => animalMesh(e.sp)); g.visible = e.st !== 'cargo'; g.scale.setScalar(1);
    g.position.set(e.x, W.M.h(e.x, e.z), e.z); g.rotation.y = e.ang;
    const asleep = e.st === 'asleep'; g.rotation.z = asleep ? Math.PI / 2 : 0; g.position.y += asleep ? 0.2 : 0;
    if (e.st === 'windup') g.position.y += Math.sin(performance.now() / 60) * 0.15;
  }
  const mark = (key, kind, x, y, z) => { seen[key] = 1; const g = ensure(key, () => kind === 'ice' ? blocky([[0.9, 0.18, 0.9, 0xbff6ff, 0, 0.15, 0], [0.4, 0.4, 0.4, 0xeafbff, 0, 0.45, 0]]) : kind === 'warn' ? blocky([[0.3, 0.8, 0.3, 0xff2d2d, 0, 0.7, 0], [0.3, 0.3, 0.3, 0xff2d2d, 0, 0, 0]]) : kind === 'zzz' ? blocky([[0.6, 0.15, 0.15, 0x9ad0ff, 0, 0.5, 0], [0.15, 0.4, 0.15, 0x9ad0ff, 0, 0.25, 0], [0.6, 0.15, 0.15, 0x9ad0ff, 0, 0, 0]]) : (() => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.35, 14, 0.35), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.45, fog: false })); const gg = new THREE.Group(); gg.add(m); m.position.y = 7; return gg; })()); g.visible = true; g.position.set(x, y + (kind === 'beacon' ? 0 : Math.sin(performance.now() / 200) * 0.15), z); if (kind !== 'beacon') g.rotation.y = cam.rotation.y; };
  for (const e of W.ents) {
    if (e.st === 'cargo' || e.st === 'safe') continue;
    const top = W.M.h(e.x, e.z) + GB.SPECIES[e.sp].size * 2 + 1.2;
    if (e.st === 'windup' || e.st === 'charge') mark('w' + e.id, 'warn', e.x, top, e.z);
    else if (e.st === 'asleep') mark('z' + e.id, 'zzz', e.x, top - 0.6, e.z);
    if (e.frost) mark('i' + e.id, 'ice', e.x, top - 0.4, e.z);
    if (e.caseAnimal && e.st !== 'caged') mark('b' + e.id, 'beacon', e.x, W.M.h(e.x, e.z), e.z);
  }
  for (const p of W.poachers) { if (p.st === 'alert' || p.st === 'chase') mark('w' + p.id, 'warn', p.x, W.M.h(p.x, p.z) + 3.2, p.z); }
  for (const j of W.jeeps) { if (j.chase || j.cargo) mark('w' + j.id, 'warn', j.x, W.M.h(j.x, j.z) + 3, j.z); if (j.cargo) { const e = W.ents.find((q) => q.id === j.cargo); if (e) { const ga = actors['a' + e.id]; if (ga) { ga.scale.setScalar(0.6); ga.position.y += 1.1; } } } }
  for (const p of W.poachers) { seen['p' + p.id] = 1; const g = ensure('p' + p.id, W.mode === 'poacher' ? (() => ranger(0x2f8a4a)) : poacherMesh); g.position.set(p.x, W.M.h(p.x, p.z), p.z); g.rotation.y = p.ang; if (p.st === 'chase') g.position.y += 0.1; }
  for (const j of W.jeeps) { seen['j' + j.id] = 1; const g = ensure('j' + j.id, W.mode === 'poacher' ? rangerJeep : jeepMesh); g.position.set(j.x, W.M.h(j.x, j.z), j.z); g.rotation.y = j.ang; }
  for (const f of W.flares) { const k = 'f' + f.x.toFixed(1) + '_' + f.z.toFixed(1); seen[k] = 1; const g = ensure(k, () => blocky([[0.5, 0.8, 0.5, 0xff5a2a, 0, 0.6, 0]])); g.position.set(f.x, W.M.h(f.x, f.z) + 0.5, f.z); }
  for (let i = 0; i < W.darts.length; i++) { const d = W.darts[i]; const k = 'd' + i; seen[k] = 1; const g = ensure(k, () => blocky([[0.12, 0.12, 0.5, 0xf2e27a, 0, 0, 0]])); g.position.set(d.x, W.M.h(d.x, d.z) + 1.2, d.z); }
  // players
  if (me) { seen.me = 1; const kind = W.mode === 'poacher' ? 'poacher' : 'ranger'; if (actors.me && actors.me.userData.kind !== kind) { scene.remove(actors.me); delete actors.me; } const g = ensure('me', () => { const m = kind === 'poacher' ? poacherMesh() : ranger(0x2f8a4a); m.userData.kind = kind; return m; }); g.visible = me.onFoot; g.position.set(me.x, W.M.h(me.x, me.z), me.z); g.rotation.y = me.ang; g.scale.y = me.crouch ? 0.65 : 1; }
  let oi = 0;
  for (const id in others) { const o = others[id]; if (!o || !o.s) continue; seen['o' + oi] = 1; const g = ensure('o' + oi, () => ranger(parseInt(o.color.slice(1), 16) || 0x3aa0d8)); g.visible = true; g.position.set(o.s.x, W.M.h(o.s.x, o.s.z), o.s.z); g.rotation.y = o.s.a; oi++; }
  // crew riders shown when seats hold crew ids
  if (W.truck) W.truck.seats.forEach((sid, i) => { const decor = !sid && i > 0 && W.truck.seats.some((q) => q); if ((sid && String(sid).indexOf('crew') === 0) || decor) { seen['c' + i] = 1; const g = ensure('c' + i, () => ranger(i ? 0xd23b6b : 0x3a6ad2)); const side = i === 1 ? 1 : i === 2 ? -1 : 0; g.position.set(W.truck.x + Math.cos(W.truck.ang) * side * 0.7, W.M.h(W.truck.x, W.truck.z) + 0.6, W.truck.z - Math.sin(W.truck.ang) * side * 0.7); g.rotation.y = W.truck.ang; } });
  if (W.drone) {
    seen.drone = 1; const g = ensure('drone', droneMesh); const y = W.M.h(W.drone.x, W.drone.z) + 8;
    g.visible = true; g.position.set(W.drone.x, y, W.drone.z); g.rotation.y = W.drone.ang || 0;
    g.rotation.z = Math.sin(performance.now() / 80) * 0.08;
    if (W.drone.beam && W.drone.target) {
      const e = W.ents.find((q) => q.id === W.drone.target);
      if (e) {
        seen.beam = 1;
        const b = ensure('beam', () => new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 1), new THREE.MeshBasicMaterial({ color: 0xbff6ff, transparent: true, opacity: 0.9, fog: false })));
        const ey = W.M.h(e.x, e.z) + 1.3, dx = e.x - W.drone.x, dy = ey - y, dz = e.z - W.drone.z, len = Math.max(0.4, Math.hypot(dx, dy, dz));
        b.visible = true; b.scale.set(1, 1, len); b.position.set(W.drone.x + dx / 2, y + dy / 2, W.drone.z + dz / 2); b.lookAt(e.x, ey, e.z);
      }
    }
  }
  if (W.dealer) { seen.van = 1; const g = ensure('van', vanMesh); g.visible = true; g.position.set(W.dealer.x, W.M.h(W.dealer.x, W.dealer.z), W.dealer.z); }
  for (const k in actors) if (!seen[k] && k !== 'truck') actors[k].visible = false;
};

/* ---------- camera ---------- */
V.frame = function (target, dt, lookYaw) {
  const y = V.map.h(target.x, target.z);
  const behind = CAM.yaw;
  const caveCam = V.map && V.map.ceil && CAM.dist === 11;
  const dist = caveCam ? 7.5 : CAM.dist, pitch = caveCam ? 0.66 : CAM.pitch;
  const cx = target.x - Math.sin(behind) * dist * Math.cos(pitch);
  const cz = target.z - Math.cos(behind) * dist * Math.cos(pitch);
  const cy = y + 2.2 + Math.sin(pitch) * dist;
  cam.position.x += (cx - cam.position.x) * Math.min(1, dt * 4);
  cam.position.y += (cy - cam.position.y) * Math.min(1, dt * 4);
  cam.position.z += (cz - cam.position.z) * Math.min(1, dt * 4);
  cam.lookAt(target.x, y + 1.4, target.z);
  V._tgt = target; V._tgtY = y;
  // keep camera above ground
  const gh = V.map.h(cam.position.x, cam.position.z);
  if (cam.position.y < gh + 1.2) cam.position.y = gh + 1.2;
};
V.snapCam = function (target) { CAM.yaw = target.ang || 0; V.frame(target, 10); };
V.camYaw = () => CAM.yaw;
let dragT = 0;
V.follow = function (ang, dt) { dragT -= dt; if (dragT > 0) return; let d = ang - CAM.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; CAM.yaw += d * Math.min(1, dt * 2.5); };
V.orbit = (dx) => { CAM.yaw -= dx * 0.006; dragT = 1.5; };
V.setCam = (o) => Object.assign(CAM, o);
let lastNight = null; const _c1 = new THREE.Color(), _c2 = new THREE.Color(), _v = new THREE.Vector3();
let cloudT = 0;
// mix two colours in sRGB (how your eye sees them) so dusk/night really get dark
function mixHex(a, b, t) { const r = ((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t, g = ((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t, bb = (a & 255) * (1 - t) + (b & 255) * t; return ((r | 0) << 16) | ((g | 0) << 8) | (bb | 0); }
V.render = function (night) {
  if (!V.map) { renderer.render(scene, cam); return; }
  const b = GB.BIOMES[V.map.biome] || GB.BIOMES.camp, cave = !!V.map.ceil;
  const n = cave ? 1 : Math.max(0, Math.min(1, +night || 0)), q = Math.round(n * 40) / 40;
  const tg = V._tgt || { x: 0, z: 0 }, ty = V._tgtY || 0;
  // sun arc follows the day/night phase: high at noon, sinks at dusk, the moon takes over at night
  const t = performance.now() / 1000;
  const elev = cave ? 1.2 : (0.18 + (1 - n) * 0.95), az = 0.7 + Math.sin(t * 0.004) * 0.4;
  _v.set(Math.cos(az) * Math.cos(elev), Math.sin(elev), Math.sin(az) * Math.cos(elev));
  sun.position.set(tg.x + _v.x * 90, ty + _v.y * 90, tg.z + _v.z * 90); sun.target.position.set(tg.x, ty, tg.z);
  if (lastNight !== q || V._fogMap !== V.map || V._envDirty) {
    lastNight = q; V._fogMap = V.map; V._envDirty = 0;
    // sky reflections fade with the daylight (and stay faint underground)
    const ef = cave ? 0.22 : 1 - 0.85 * q;
    scene.traverse((o) => { const mm = o.material; if (!mm || !mm.isMeshStandardMaterial) return; if (mm.userData.envBase == null) mm.userData.envBase = mm.envMapIntensity; mm.envMapIntensity = mm.userData.envBase * ef; });
    if (cave) {
      scene.fog.color.set(b.fog); scene.fog.near = 16; scene.fog.far = 72;
      scene.background = new THREE.Color(b.sky);
      sun.color.set(0x8aa0ff); hemi.color.set(0x8a9aff); hemi.groundColor.set(0x7a6a9a);
    } else {
      scene.fog.color.set(mixHex(b.fog, 0x0b1230, q));
      scene.background = null;
      const far = V.map.id === 'camp' ? 150 : 170; scene.fog.near = 40 - 16 * q; scene.fog.far = far - (far - 100) * q;
      sun.color.copy(_c1.set(b.sun).lerp(_c2.set(0x9aaadd), q));
      hemi.color.set(mixHex(0xcfe6ff, 0x5a6aa0, q)); hemi.groundColor.set(mixHex(0x6a8a4a, 0x2a2a3a, q));
      if (skyMesh) { const u = skyMesh.material.uniforms; const top = mixHex(b.id === 'camp' ? 0x3d8fe0 : b.sky, 0x2a6ad0, 0.45); u.top.value.set(mixHex(top, 0x040818, q)); u.hor.value.set(mixHex(b.fog, 0x141c3a, q)); u.night.value = q; u.sunCol.value.set(b.sun); }
    }
  }
  if (skyMesh && !cave) { skyMesh.position.copy(cam.position); skyMesh.material.uniforms.sunDir.value.copy(_v); }
  if (clouds && !cave) { cloudT += 0.016; clouds.position.set(cam.position.x * 0.9 + (cloudT * 1.2) % 120 - 60, 0, cam.position.z * 0.9); clouds.material.opacity = 0.92 - 0.55 * n; clouds.material.color.setScalar(1 - 0.6 * n); }
  if (cave) { sun.intensity = 0.16; amb.intensity = 0.2; hemi.intensity = 0.34; renderer.toneMappingExposure = 1.3; }
  else { sun.intensity = 1.05 * (1 - 0.82 * n); amb.intensity = 0.32 - 0.2 * n; hemi.intensity = 0.62 - 0.4 * n; renderer.toneMappingExposure = 1.12 + 0.1 * n; }
  // headlamp on in caves and after dusk
  const lamp = cave || n > 0.45, up = (GB.G && GB.G.save().upg.lamp) || 0;
  headlamp.intensity = lamp ? (cave ? 2.4 : 1.6) * (1 + up * 0.35) : 0; headlamp.distance = 30 + up * 10;
  if (lamp) { const a = (V._tgt && V._tgt.ang) || 0; headlamp.position.set(tg.x, ty + 2.4, tg.z); headlamp.target.position.set(tg.x + Math.sin(a) * 10, ty + 0.2, tg.z + Math.cos(a) * 10); }
  // the nearest glowing props borrow the pooled point lights
  const L = V.lights || [], wantGlow = cave || n > 0.3;
  if (wantGlow && L.length) {
    const best = []; for (const l of L) { const d = (l.x - tg.x) * (l.x - tg.x) + (l.z - tg.z) * (l.z - tg.z); if (d > 1600) continue; best.push([d, l]); }
    best.sort((a2, b2) => a2[0] - b2[0]);
    glowPool.forEach((pl, i) => { const e = best[i]; if (!e) { pl.intensity = 0; return; } pl.position.set(e[1].x, e[1].y, e[1].z); pl.color.set(e[1].color); pl.intensity = (e[1].kind === 'crystal' ? 1.6 : 2.0) * (0.92 + Math.sin(t * 9 + i) * 0.08 * (e[1].kind === 'torch' ? 1 : 0.2)); });
  } else glowPool.forEach((pl) => { pl.intensity = 0; });
  if (lavaMat) { const k = 0.85 + Math.sin(t * 2.2) * 0.15; lavaMat.color.setRGB(1, k, k * 0.9); }
  if (GB.X) GB.X.frame(t, n, cave);
  renderer.render(scene, cam);
};
V.renderer = () => renderer;
V.project = function (x, y, z) { const v = new THREE.Vector3(x, y, z).project(cam); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight, z: v.z }; };
})();
