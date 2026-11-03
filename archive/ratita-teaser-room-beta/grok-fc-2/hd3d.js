/* Grok FC 2 - HD SHADOW-LIGHT ENGINE (three.js r128): PBR-ish materials, ACES tone mapping, soft sun shadows,
   floodlight towers, weather (sun / floodlight night / rain / snow), detailed players (face, hair, kit, boots) and pet models. */
(function () {
  'use strict';
  const T = THREE, H = window.FC2H = {};
  const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  H.PW = 64; H.PH = 40; // pitch size (m)
  const geoCache = {}, matCache = {};
  const G = (k, f) => geoCache[k] || (geoCache[k] = f());
  const M = (col, o) => { const k = col + JSON.stringify(o || {}); return matCache[k] || (matCache[k] = new T.MeshStandardMaterial(Object.assign({ color: col, roughness: 0.6, metalness: 0.02 }, o || {}))); };
  H.init = function (canvas) {
    const R = H.R = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, IOS ? 1.5 : 2));
    R.outputEncoding = T.sRGBEncoding; R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
    R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
    H.scene = new T.Scene(); H.cam = new T.PerspectiveCamera(42, 1, 0.5, 600);
    H.hemi = new T.HemisphereLight('#cfe8ff', '#35602a', 0.55); H.scene.add(H.hemi);
    const sun = H.sun = new T.DirectionalLight('#fff1d6', 2.2); sun.position.set(-30, 55, 25); sun.castShadow = true;
    const ms = IOS ? 1024 : 2048; sun.shadow.mapSize.set(ms, ms); const c = sun.shadow.camera; c.left = -48; c.right = 48; c.top = 34; c.bottom = -34; c.near = 5; c.far = 160;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; H.scene.add(sun); H.scene.add(sun.target);
    H.world = new T.Group(); H.scene.add(H.world);
    H.resize(); addEventListener('resize', H.resize);
  };
  H.resize = function () { if (!H.R) return; H.R.setSize(innerWidth, innerHeight, false); H.cam.aspect = innerWidth / innerHeight; H.cam.fov = H.fpOn ? (innerWidth < innerHeight ? 82 : 66) : innerWidth < innerHeight ? 62 : 42; H.cam.near = H.fpOn ? 0.1 : 0.5; H.cam.updateProjectionMatrix(); };
  H.fp = function (on) { on = !!on; if (on === !!H.fpOn) return; H.fpOn = on; H.resize(); };
  H.clear = function () {
    H.world.traverse((o) => { if (o.userData.own && o.geometry) o.geometry.dispose(); const ms = o.material ? [].concat(o.material) : []; ms.forEach((mt) => { if (o.userData.own || mt.userData.own) { ['map', 'emissiveMap'].forEach((k) => { if (mt[k]) mt[k].dispose(); }); mt.dispose(); } }); });
    H.world.traverse((o) => { if (o.isLight && o.shadow && o.shadow.map) { o.shadow.map.dispose(); o.shadow.map = null; } });
    H.scene.remove(H.world); H.world = new T.Group(); H.scene.add(H.world); H.precip = null; H.lamps = []; H.anims = [];
  };
  H.anims = [];
  function own(m) { m.userData.own = true; return m; }
  function canvasTex(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t; }
  /* ---------------- stadium ---------------- */
  H.buildStadium = function (homeKit) {
    H.clear(); const W = H.PW, L = H.PH, w = H.world;
    const grassTex = canvasTex(1024, 640, (g, cw, ch) => {
      for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#3f9a3a' : '#378a33'; g.fillRect(i * cw / 16, 0, cw / 16 + 1, ch); }
      for (let i = 0; i < 2600; i++) { g.fillStyle = 'rgba(' + (20 + Math.random() * 40) + ',' + (90 + Math.random() * 60) + ',30,0.25)'; g.fillRect(Math.random() * cw, Math.random() * ch, 2, 3); }
      const sx = cw / (W + 6), sy = ch / (L + 6), X = (x) => (x + (W + 6) / 2) * sx, Y = (y) => (y + (L + 6) / 2) * sy;
      g.strokeStyle = 'rgba(255,255,255,0.92)'; g.lineWidth = 3;
      g.strokeRect(X(-W / 2), Y(-L / 2), W * sx, L * sy); g.beginPath(); g.moveTo(X(0), Y(-L / 2)); g.lineTo(X(0), Y(L / 2)); g.stroke();
      g.beginPath(); g.ellipse(X(0), Y(0), 6 * sx, 6 * sy, 0, 0, 7); g.stroke();
      [-1, 1].forEach((s) => { g.strokeRect(X(s > 0 ? W / 2 - 10 : -W / 2), Y(-11), 10 * sx, 22 * sy); g.strokeRect(X(s > 0 ? W / 2 - 4 : -W / 2), Y(-5.5), 4 * sx, 11 * sy); g.beginPath(); g.arc(X(s * (W / 2 - 7)), Y(0), 3, 0, 7); g.fillStyle = '#fff'; g.fill(); });
      g.beginPath(); g.arc(X(0), Y(0), 3, 0, 7); g.fill();
    });
    H.grassMat = own(new T.MeshStandardMaterial({ map: grassTex, roughness: 0.9, metalness: 0 }));
    const pitch = own(new T.Mesh(new T.PlaneGeometry(W + 6, L + 6), H.grassMat)); pitch.rotation.x = -Math.PI / 2; pitch.receiveShadow = true; w.add(pitch);
    const apron = own(new T.Mesh(new T.PlaneGeometry(W + 30, L + 30), M('#2b5d28', { roughness: 1 }))); apron.rotation.x = -Math.PI / 2; apron.position.y = -0.02; apron.receiveShadow = true; w.add(apron);
    // goals
    [-1, 1].forEach((s) => {
      const gp = new T.Group(); gp.position.x = s * W / 2; const pm = M('#f8fafc', { roughness: 0.3, metalness: 0.4 }), pg = G('post', () => new T.CylinderGeometry(0.09, 0.09, 2.44, 12));
      [-3.66, 3.66].forEach((z) => { const p = new T.Mesh(pg, pm); p.position.set(0, 1.22, z); p.castShadow = true; gp.add(p); });
      const bar = new T.Mesh(G('bar', () => new T.CylinderGeometry(0.09, 0.09, 7.32, 12)), pm); bar.rotation.x = Math.PI / 2; bar.position.y = 2.44; bar.castShadow = true; gp.add(bar);
      const net = new T.Mesh(G('net', () => new T.BoxGeometry(1.8, 2.44, 7.32, 6, 8, 18)), new T.MeshBasicMaterial({ color: '#e5e7eb', wireframe: true, transparent: true, opacity: 0.45 })); own(net); net.position.set(s * 0.9, 1.22, 0); gp.add(net);
      w.add(gp);
    });
    // stands + crowd (instanced)
    const standM = M('#1f2937', { roughness: 0.8 });
    const sides = [[0, -L / 2 - 12, W + 24, 0], [0, L / 2 + 12, W + 24, Math.PI], [-W / 2 - 13, 0, L + 10, Math.PI / 2], [W / 2 + 13, 0, L + 10, -Math.PI / 2]];
    const crowdN = IOS ? 1400 : 2600, cg = G('fan', () => new T.BoxGeometry(0.55, 0.8, 0.45)), crowd = own(new T.InstancedMesh(cg, own(new T.MeshStandardMaterial({ roughness: 0.8 })), crowdN));
    const cols = ['#ef4444', '#3b82f6', '#facc15', '#ffffff', '#22c55e', '#f472b6', homeKit || '#7dd3fc', homeKit || '#7dd3fc'];
    const dm = new T.Object3D(), col = new T.Color(); let ci = 0; H.fans = [];
    sides.forEach(([x, z, len, ry]) => {
      for (let r = 0; r < 6; r++) { const step = own(new T.Mesh(new T.BoxGeometry(len, 1, 2.2), standM)); step.position.set(0, r * 1.1 + 0.5, r * 2.0); const grp = new T.Group(); grp.position.set(x, 0, z); grp.rotation.y = ry; grp.add(step); step.receiveShadow = true; w.add(grp);
        const per = Math.floor(crowdN / 24); for (let i = 0; i < per && ci < crowdN; i++, ci++) { const lx = (i / per - 0.5) * (len - 2) + (Math.random() - 0.5) * 0.4; const v = new T.Vector3(lx, r * 1.1 + 1.4, r * 2.0 - 0.2); v.applyAxisAngle(new T.Vector3(0, 1, 0), ry); v.x += x; v.z += z; dm.position.copy(v); dm.rotation.y = ry; dm.updateMatrix(); crowd.setMatrixAt(ci, dm.matrix); crowd.setColorAt(ci, col.set(cols[(Math.random() * cols.length) | 0])); H.fans.push({ p: v, ry, ph: Math.random() * 6 }); } }
    });
    crowd.count = ci; w.add(crowd); H.crowd = crowd;
    // ad boards
    const adTex = canvasTex(1024, 64, (g) => { const ads = ['GROK FC 2', 'RATITA CHEESE', 'TORTY TURBO', 'CANDY KIBBLE', 'HD SHADOW-LIGHT', 'PI-RAT TV']; for (let i = 0; i < 6; i++) { g.fillStyle = ['#0ea5e9', '#f59e0b', '#16a34a', '#db2777', '#7c3aed', '#dc2626'][i]; g.fillRect(i * 171, 0, 171, 64); g.fillStyle = '#fff'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.fillText(ads[i], i * 171 + 85, 42); } });
    adTex.wrapS = T.RepeatWrapping; adTex.repeat.x = 3; const adM = own(new T.MeshStandardMaterial({ map: adTex, emissive: '#ffffff', emissiveMap: adTex, emissiveIntensity: 0.35 }));
    [[0, -L / 2 - 4, W + 8, 0], [0, L / 2 + 4, W + 8, Math.PI]].forEach(([x, z, len, ry]) => { const b = own(new T.Mesh(new T.BoxGeometry(len, 0.9, 0.2), adM)); b.position.set(x, 0.45, z); b.rotation.y = ry; b.castShadow = true; w.add(b); });
    // floodlight towers
    H.lamps = [];
    [[-W / 2 - 16, -L / 2 - 16], [W / 2 + 16, -L / 2 - 16], [-W / 2 - 16, L / 2 + 16], [W / 2 + 16, L / 2 + 16]].forEach(([x, z]) => {
      const pole = own(new T.Mesh(new T.CylinderGeometry(0.35, 0.6, 30, 10), M('#94a3b8', { metalness: 0.6, roughness: 0.4 }))); pole.position.set(x, 15, z); w.add(pole);
      const head = own(new T.Mesh(new T.BoxGeometry(5, 3, 0.6), own(new T.MeshStandardMaterial({ color: '#fff', emissive: '#fffbe6', emissiveIntensity: 0.1 })))); head.position.set(x, 30.5, z); head.lookAt(0, 0, 0); w.add(head);
      const sl = new T.SpotLight('#fff6e0', 0, 140, 0.55, 0.5, 1.2); sl.position.set(x, 30, z); sl.target.position.set(x * 0.2, 0, z * 0.2); w.add(sl); w.add(sl.target); H.lamps.push({ sl, head });
    });
  };
  /* ---------------- weather ---------------- */
  H.weather = function (kind) {
    H.wx = kind; const night = kind === 'night', rain = kind === 'rain', snow = kind === 'snow';
    H.scene.background = (H.scene.background || new T.Color()).set(night ? '#060b1c' : rain ? '#6b7280' : snow ? '#cbd5e1' : '#7cc4ff');
    if (!H.scene.fog) H.scene.fog = new T.Fog(0); H.scene.fog.color.copy(H.scene.background); H.scene.fog.near = night ? 90 : rain ? 50 : snow ? 60 : 140; H.scene.fog.far = night ? 260 : rain ? 170 : snow ? 190 : 380;
    H.sun.intensity = night ? 0.12 : rain ? 0.9 : snow ? 1.3 : 2.4; H.sun.color.set(night ? '#9db4ff' : rain ? '#dfe6f0' : '#fff1d6');
    H.sun.position.set(night ? 10 : -30, night ? 60 : 55, 25); H.hemi.intensity = night ? 0.25 : rain ? 0.7 : snow ? 0.85 : 0.55;
    H.R.toneMappingExposure = night ? 1.25 : rain ? 0.95 : 1.05;
    (H.lamps || []).forEach((l) => { l.sl.intensity = night ? 3.2 : rain ? 1.3 : 0; l.head.material.emissiveIntensity = night ? 2.5 : rain ? 1 : 0.1; });
    if (H.grassMat) { H.grassMat.color.set(snow ? '#e7f0ff' : rain ? '#b9c9b5' : '#ffffff'); H.grassMat.roughness = rain ? 0.35 : 0.9; H.grassMat.metalness = rain ? 0.15 : 0; }
    if (H.precip) { H.world.remove(H.precip); H.precip.geometry.dispose(); H.precip.material.dispose(); H.precip = null; }
    if (rain || snow) {
      const n = IOS ? 1500 : 3000, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 110; pos[i * 3 + 1] = Math.random() * 40; pos[i * 3 + 2] = (Math.random() - 0.5) * 80; }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
      H.precip = new T.Points(g, new T.PointsMaterial({ color: snow ? '#ffffff' : '#c7d7ee', size: snow ? 0.32 : 0.12, transparent: true, opacity: snow ? 0.95 : 0.65, depthWrite: false })); H.precip.userData.snow = snow; H.world.add(H.precip);
    }
  };
  H.tick = function (dt, t) {
    if (H.grassMat && H.wx === 'rain') { H.grassMat.roughness = H.fpOn ? 0.75 : 0.35; H.grassMat.metalness = H.fpOn ? 0.04 : 0.15; }
    if (H.precip) { const sn = H.precip.userData.snow; const pm = H.precip.material, att = !H.fpOn; if (pm.sizeAttenuation !== att) { pm.sizeAttenuation = att; pm.needsUpdate = true; } pm.size = H.fpOn ? (sn ? 3 : 1.6) : (sn ? 0.32 : 0.12); }
    if (H.precip) { const a = H.precip.geometry.attributes.position, s = H.precip.userData.snow; for (let i = 0; i < a.count; i++) { let y = a.getY(i) - dt * (s ? 3 : 28); if (y < 0) y += 40; a.setY(i, y); if (s) a.setX(i, a.getX(i) + Math.sin(t + i) * dt * 0.5); } a.needsUpdate = true; }
    for (let i = 0; i < H.anims.length; i++) H.anims[i](dt, t);
  };
  H.cheer = function (t, k) { const c = H.crowd; if (!c) return; const dm = new T.Object3D(); for (let i = 0; i < c.count; i += 2) { const f = H.fans[i]; dm.position.copy(f.p); dm.position.y += Math.max(0, Math.sin(t * 9 + f.ph)) * 0.35 * k; dm.rotation.y = f.ry; dm.updateMatrix(); c.setMatrixAt(i, dm.matrix); } c.instanceMatrix.needsUpdate = true; };
  /* ---------------- players ---------------- */
  function shirtTex(kit, num) {
    return canvasTex(128, 128, (g) => {
      const base = kit[0];
      if (base === 'checker') { for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++) { g.fillStyle = (x + y) % 2 ? '#dc2626' : '#ffffff'; g.fillRect(x * 16, y * 16, 16, 16); } }
      else if (base === 'stripe') { for (let x = 0; x < 8; x++) { g.fillStyle = x % 2 ? '#7dd3fc' : '#ffffff'; g.fillRect(x * 16, 0, 16, 128); } }
      else { g.fillStyle = base; g.fillRect(0, 0, 128, 128); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, 0, 128, 10); }
      const dark = base === 'checker' || base === 'stripe' || /^#(f|e|d|c)/i.test(base) && !/^#dc|^#ca|^#cb/i.test(base);
      g.fillStyle = dark ? '#111827' : '#ffffff'; g.font = 'bold 62px Impact, sans-serif'; g.textAlign = 'center'; g.fillText(String(num), 64, 92);
    });
  }
  H.makePlayer = function (p, kit, gk) {
    const look = p.look || {}; if (look.pet) return H.makePet(look.pet, 1.4);
    const g = new T.Group(), skin = M(look.skin || '#e0ac85', { roughness: 0.55 }), hairM = M(look.hair || '#2a1a10', { roughness: 0.85 });
    const shirtCol = gk ? '#a3e635' : null;
    const tex = gk ? null : shirtTex(kit, p.num || 7), shirt = own(new T.MeshStandardMaterial(tex ? { map: tex, roughness: 0.65 } : { color: shirtCol, roughness: 0.65 }));
    const shortsM = M(gk ? '#111827' : kit[1]), sockM = M(gk ? '#111827' : kit[2]), bootM = M(look.boot || '#111', { roughness: 0.3, metalness: 0.2 });
    const torso = new T.Mesh(G('torso', () => new T.CylinderGeometry(0.27, 0.22, 0.62, 14)), shirt); torso.position.y = 1.17; torso.castShadow = true; g.add(torso);
    const hips = new T.Mesh(G('hips', () => new T.CylinderGeometry(0.23, 0.24, 0.24, 12)), shortsM); hips.position.y = 0.82; hips.castShadow = true; g.add(hips);
    const legs = []; [-0.12, 0.12].forEach((x) => { const leg = new T.Group(); leg.position.set(x, 0.78, 0);
      const thigh = new T.Mesh(G('thigh', () => new T.CylinderGeometry(0.095, 0.08, 0.36, 10)), skin); thigh.position.y = -0.2; leg.add(thigh);
      const sock = new T.Mesh(G('sock', () => new T.CylinderGeometry(0.08, 0.07, 0.34, 10)), sockM); sock.position.y = -0.52; leg.add(sock);
      const boot = new T.Mesh(G('boot', () => new T.BoxGeometry(0.13, 0.09, 0.27)), bootM); boot.position.set(0, -0.72, 0.05); boot.castShadow = true; leg.add(boot);
      thigh.castShadow = sock.castShadow = true; g.add(leg); legs.push(leg); });
    const arms = []; [-0.33, 0.33].forEach((x) => { const arm = new T.Group(); arm.position.set(x, 1.42, 0);
      const sl = new T.Mesh(G('sleeve', () => new T.CylinderGeometry(0.085, 0.075, 0.22, 10)), shirt); sl.position.y = -0.1; arm.add(sl);
      const fa = new T.Mesh(G('fore', () => new T.CylinderGeometry(0.065, 0.055, 0.34, 10)), gk ? M('#f59e0b') : skin); fa.position.y = -0.36; arm.add(fa); sl.castShadow = fa.castShadow = true; g.add(arm); arms.push(arm); });
    const neck = new T.Mesh(G('neck', () => new T.CylinderGeometry(0.07, 0.08, 0.1, 10)), skin); neck.position.y = 1.52; g.add(neck);
    const head = new T.Group(); head.position.y = 1.7; g.add(head);
    const skull = new T.Mesh(G('head', () => new T.SphereGeometry(0.17, 20, 16)), skin); skull.scale.set(1, 1.12, 1); skull.castShadow = true; head.add(skull);
    const eyeW = M('#ffffff', { roughness: 0.2 }), eyeB = M('#1f2937', { roughness: 0.2 });
    [-0.06, 0.06].forEach((x) => { const e = new T.Mesh(G('eye', () => new T.SphereGeometry(0.03, 10, 8)), eyeW); e.position.set(x, 0.02, 0.145); head.add(e); const pu = new T.Mesh(G('pupil', () => new T.SphereGeometry(0.016, 8, 6)), eyeB); pu.position.set(x, 0.02, 0.17); head.add(pu);
      const br = new T.Mesh(G('brow', () => new T.BoxGeometry(0.06, 0.014, 0.02)), hairM); br.position.set(x, 0.07, 0.16); head.add(br); });
    const nose = new T.Mesh(G('nose', () => new T.ConeGeometry(0.025, 0.06, 8)), skin); nose.rotation.x = Math.PI / 2; nose.position.set(0, -0.02, 0.18); head.add(nose);
    const mouth = new T.Mesh(G('mouth', () => new T.BoxGeometry(0.06, 0.012, 0.01)), M('#7f1d1d')); mouth.position.set(0, -0.08, 0.16); head.add(mouth);
    [-0.17, 0.17].forEach((x) => { const ear = new T.Mesh(G('ear', () => new T.SphereGeometry(0.035, 8, 6)), skin); ear.position.set(x, 0, 0); head.add(ear); });
    const st = look.style || 0;
    if (st !== 4) { // 4 = shaved
      const cap = new T.Mesh(G('hair' + st, () => st === 5 ? new T.SphereGeometry(0.24, 16, 12) : new T.SphereGeometry(0.182, 18, 12, 0, Math.PI * 2, 0, Math.PI * (st === 0 ? 0.42 : 0.55))), hairM);
      cap.position.y = st === 5 ? 0.06 : 0.02; cap.rotation.x = -0.25; cap.scale.y = st === 5 ? 0.9 : 1.1; head.add(cap);
      if (st === 1) { const back = new T.Mesh(G('long', () => new T.BoxGeometry(0.32, 0.3, 0.1)), hairM); back.position.set(0, -0.1, -0.13); head.add(back); }
      if (st === 2) { const bun = new T.Mesh(G('bun', () => new T.SphereGeometry(0.08, 12, 10)), hairM); bun.position.set(0, 0.12, -0.16); head.add(bun); const band = new T.Mesh(G('band', () => new T.TorusGeometry(0.17, 0.015, 6, 24)), M('#111')); band.rotation.x = Math.PI / 2 - 0.3; band.position.y = 0.06; head.add(band); }
      if (st === 3) { const mo = new T.Mesh(G('mohawk', () => new T.BoxGeometry(0.06, 0.12, 0.3)), hairM); mo.position.set(0, 0.2, -0.01); head.add(mo); }
    }
    if (look.beard) { const b = new T.Mesh(G('beard', () => new T.SphereGeometry(0.15, 14, 10, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45)), hairM); b.position.set(0, -0.02, 0.03); head.add(b); }
    g.userData = { legs, arms, head, ph: Math.random() * 6 };
    return g;
  };
  H.animPlayer = function (g, speed, t) {
    const u = g.userData; if (!u.legs) { if (u.bob) u.bob(t, speed); return; }
    const s = Math.min(1, speed / 6), a = Math.sin(t * 11 + u.ph) * 0.9 * s;
    u.legs[0].rotation.x = a; u.legs[1].rotation.x = -a; u.arms[0].rotation.x = -a * 0.8; u.arms[1].rotation.x = a * 0.8;
  };
  /* ---------------- family pets ---------------- */
  H.makePet = function (id, sc) {
    const g = new T.Group(), s = sc || 1;
    if (id === 'candy') { // miniature schnauzer
      const fur = M('#9ca3af', { roughness: 0.95 }), dark = M('#4b5563', { roughness: 0.95 }), wh = M('#e5e7eb', { roughness: 0.95 });
      const body = new T.Mesh(G('dbody', () => new T.BoxGeometry(0.42, 0.34, 0.75)), fur); body.position.y = 0.48; g.add(body);
      [[-0.15, 0.28], [0.15, 0.28], [-0.15, -0.28], [0.15, -0.28]].forEach(([x, z]) => { const l = new T.Mesh(G('dleg', () => new T.CylinderGeometry(0.06, 0.06, 0.34, 8)), wh); l.position.set(x, 0.17, z); g.add(l); });
      const head = new T.Mesh(G('dhead', () => new T.BoxGeometry(0.3, 0.3, 0.32)), fur); head.position.set(0, 0.78, 0.42); g.add(head);
      const snout = new T.Mesh(G('dsnout', () => new T.BoxGeometry(0.2, 0.16, 0.22)), dark); snout.position.set(0, 0.72, 0.64); g.add(snout);
      const beard = new T.Mesh(G('dbeard', () => new T.BoxGeometry(0.22, 0.16, 0.18)), wh); beard.position.set(0, 0.6, 0.62); g.add(beard);
      const nose = new T.Mesh(G('dnose', () => new T.SphereGeometry(0.04, 8, 6)), M('#111')); nose.position.set(0, 0.78, 0.76); g.add(nose);
      [-0.08, 0.08].forEach((x) => { const e = new T.Mesh(G('deye', () => new T.SphereGeometry(0.03, 8, 6)), M('#111', { roughness: 0.2 })); e.position.set(x, 0.86, 0.58); g.add(e); const br = new T.Mesh(G('dbrow', () => new T.BoxGeometry(0.1, 0.04, 0.06)), wh); br.position.set(x, 0.92, 0.58); g.add(br);
        const ear = new T.Mesh(G('dear', () => new T.ConeGeometry(0.06, 0.14, 4)), dark); ear.position.set(x * 1.6, 0.98, 0.4); g.add(ear); });
      const tail = new T.Mesh(G('dtail', () => new T.CylinderGeometry(0.03, 0.04, 0.2, 6)), fur); tail.position.set(0, 0.7, -0.4); tail.rotation.x = -0.6; g.add(tail); g.userData.tail = tail;
    } else if (id === 'torty') { // desert tortoise
      const shell = new T.Mesh(G('shell', () => new T.SphereGeometry(0.45, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2)), M('#8b6b3d', { roughness: 0.7 })); shell.scale.set(1, 0.75, 1.2); shell.position.y = 0.18; g.add(shell);
      const rim = new T.Mesh(G('rim', () => new T.CylinderGeometry(0.47, 0.47, 0.1, 18)), M('#5b4524')); rim.scale.z = 1.2; rim.position.y = 0.18; g.add(rim);
      for (let i = 0; i < 6; i++) { const sc2 = new T.Mesh(G('scute', () => new T.CylinderGeometry(0.1, 0.1, 0.03, 6)), M('#a7854c')); const a = i / 6 * Math.PI * 2; sc2.position.set(Math.cos(a) * 0.22, 0.43, Math.sin(a) * 0.26); sc2.lookAt(0, 2, 0); g.add(sc2); }
      const skinT = M('#8a9a5b', { roughness: 0.8 });
      const head = new T.Mesh(G('thead', () => new T.SphereGeometry(0.13, 12, 10)), skinT); head.scale.z = 1.3; head.position.set(0, 0.25, 0.62); g.add(head);
      [-0.06, 0.06].forEach((x) => { const e = new T.Mesh(G('teye', () => new T.SphereGeometry(0.022, 8, 6)), M('#111', { roughness: 0.2 })); e.position.set(x, 0.3, 0.74); g.add(e); });
      [[-0.3, 0.35], [0.3, 0.35], [-0.3, -0.35], [0.3, -0.35]].forEach(([x, z]) => { const l = new T.Mesh(G('tleg', () => new T.CylinderGeometry(0.08, 0.09, 0.2, 8)), skinT); l.position.set(x, 0.1, z); g.add(l); });
    } else { // fancy rats: luna (agouti/brown), pirat (one eye, darker), snowie (white)
      const col = id === 'snowie' ? '#f8fafc' : id === 'pirat' ? '#6b5b4b' : '#b08968', fur = M(col, { roughness: 0.9 }), pink = M('#f9a8d4', { roughness: 0.6 });
      const body = new T.Mesh(G('rbody', () => new T.SphereGeometry(0.3, 16, 12)), fur); body.scale.set(0.85, 0.75, 1.3); body.position.y = 0.3; g.add(body);
      if (id === 'luna') { const belly = new T.Mesh(G('rbelly', () => new T.SphereGeometry(0.26, 14, 10)), M('#f5e6d3')); belly.scale.set(0.8, 0.7, 1.2); belly.position.set(0, 0.26, 0.04); g.add(belly); }
      const head = new T.Mesh(G('rhead', () => new T.ConeGeometry(0.17, 0.4, 14)), fur); head.rotation.x = Math.PI / 2; head.position.set(0, 0.4, 0.5); g.add(head);
      const nose = new T.Mesh(G('rnose', () => new T.SphereGeometry(0.035, 8, 6)), pink); nose.position.set(0, 0.4, 0.71); g.add(nose);
      [-0.1, 0.1].forEach((x, i) => { const ear = new T.Mesh(G('rear', () => new T.SphereGeometry(0.09, 10, 8)), pink); ear.scale.z = 0.3; ear.position.set(x * 1.3, 0.56, 0.38); g.add(ear);
        if (id === 'pirat' && i === 0) { const patch = new T.Mesh(G('patch', () => new T.CylinderGeometry(0.045, 0.045, 0.02, 10)), M('#111')); patch.rotation.x = Math.PI / 2; patch.rotation.z = 0.3; patch.position.set(x * 0.7, 0.47, 0.55); g.add(patch); const strap = new T.Mesh(G('strap', () => new T.TorusGeometry(0.15, 0.01, 4, 20)), M('#111')); strap.position.set(0, 0.47, 0.45); strap.rotation.y = 0.5; g.add(strap); }
        else { const e = new T.Mesh(G('reye', () => new T.SphereGeometry(0.03, 8, 6)), M(id === 'snowie' ? '#be123c' : '#111', { roughness: 0.15 })); e.position.set(x * 0.7, 0.47, 0.56); g.add(e); } });
      const tail = new T.Mesh(G('rtail', () => new T.CylinderGeometry(0.015, 0.04, 0.8, 6)), pink); tail.rotation.x = Math.PI / 2 - 0.3; tail.position.set(0, 0.22, -0.68); g.add(tail); g.userData.tail = tail;
      [[-0.15, 0.25], [0.15, 0.25], [-0.15, -0.2], [0.15, -0.2]].forEach(([x, z]) => { const f = new T.Mesh(G('rfoot', () => new T.SphereGeometry(0.05, 8, 6)), pink); f.position.set(x, 0.04, z); g.add(f); });
    }
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    g.scale.setScalar(s);
    g.userData.bob = (t, sp) => { g.position.y = (g.userData.baseY || 0) + Math.abs(Math.sin(t * 6 + (g.userData.ph || 0))) * 0.06 * (1 + (sp || 0)); if (g.userData.tail) g.userData.tail.rotation.z = Math.sin(t * 5) * 0.5; };
    return g;
  };
  H.makeBall = function () {
    const tex = canvasTex(256, 128, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#111827'; for (let i = 0; i < 10; i++) { g.beginPath(); const x = (i % 5) * 52 + (i > 4 ? 26 : 0), y = i > 4 ? 90 : 36; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; g.lineTo(x + Math.cos(a) * 13, y + Math.sin(a) * 13); } g.fill(); } });
    const b = own(new T.Mesh(new T.SphereGeometry(0.22, 24, 16), own(new T.MeshStandardMaterial({ map: tex, roughness: 0.35 })))); b.castShadow = true; return b;
  };
  H.text = function (str, w, h, bg, fg) {
    const tex = canvasTex(512, 128, (g) => { g.fillStyle = bg || '#111827'; g.fillRect(0, 0, 512, 128); g.fillStyle = fg || '#facc15'; g.font = 'bold 54px Impact, sans-serif'; g.textAlign = 'center'; g.fillText(str, 256, 84); });
    return own(new T.Mesh(new T.PlaneGeometry(w, h), own(new T.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.5 }))));
  };
  /* ---------------- MOTM ceremony stage ---------------- */
  H.buildCeremony = function () {
    H.weather('night');
    const w = H.world, stage = own(new T.Mesh(new T.CylinderGeometry(6, 6.4, 0.5, 40), M('#1e293b', { metalness: 0.5, roughness: 0.3 }))); stage.position.set(0, 0.25, 0); stage.receiveShadow = true; stage.castShadow = true; w.add(stage);
    const pod = own(new T.Mesh(new T.CylinderGeometry(1.2, 1.3, 0.8, 32), M('#ca8a04', { metalness: 0.8, roughness: 0.25 }))); pod.position.set(0, 0.9, 0); pod.castShadow = pod.receiveShadow = true; w.add(pod);
    const cup = new T.Group(); const gold = M('#facc15', { metalness: 1, roughness: 0.18 });
    const bowl = own(new T.Mesh(new T.SphereGeometry(0.35, 20, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), gold)); bowl.position.y = 0.6; cup.add(bowl);
    const stem = own(new T.Mesh(new T.CylinderGeometry(0.06, 0.12, 0.5, 12), gold)); stem.position.y = 0.25; cup.add(stem);
    [-1, 1].forEach((s) => { const hd = own(new T.Mesh(new T.TorusGeometry(0.14, 0.03, 8, 16), gold)); hd.position.set(s * 0.38, 0.5, 0); cup.add(hd); });
    cup.position.set(1.6, 0.5, 1.6); cup.traverse((o) => { if (o.isMesh) o.castShadow = true; }); w.add(cup); H.cup = cup;
    const banner = H.text('MAN OF THE MATCH', 10, 2.5); banner.position.set(0, 6, -5); w.add(banner);
    [[-7, 9, 6, '#fde68a'], [7, 9, 6, '#a5f3fc'], [0, 12, -6, '#ffffff'], [0, 10, 9, '#ffe4f1']].forEach(([x, y, z, c], i) => { const L = H.lamps[i]; if (!L) return; const sl = L.sl; sl.color.set(c); sl.intensity = 1.6; sl.distance = 40; sl.angle = 0.4; sl.penumbra = 0.4; sl.decay = 1; sl.position.set(x, y, z); sl.target.position.set(0, 1, 0); }); H.sun.intensity = 0.9; H.sun.position.set(4, 20, 12);
    // confetti
    const n = 400, pos = new Float32Array(n * 3), colA = new Float32Array(n * 3), cl = new T.Color(); for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 14; pos[i * 3 + 1] = Math.random() * 10; pos[i * 3 + 2] = (Math.random() - 0.5) * 10; cl.set(['#facc15', '#f472b6', '#38bdf8', '#4ade80', '#ffffff'][i % 5]); colA.set([cl.r, cl.g, cl.b], i * 3); }
    const cg = new T.BufferGeometry(); cg.setAttribute('position', new T.BufferAttribute(pos, 3)); cg.setAttribute('color', new T.BufferAttribute(colA, 3));
    const conf = own(new T.Points(cg, own(new T.PointsMaterial({ size: 0.18, vertexColors: true })))); w.add(conf);
    H.anims.push((dt, t) => { const a = cg.attributes.position; for (let i = 0; i < n; i++) { let y = a.getY(i) - dt * 1.6; if (y < 0) y += 10; a.setY(i, y); } a.needsUpdate = true; cup.rotation.y = t * 0.8; });
  };
})();
