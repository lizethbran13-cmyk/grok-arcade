/* Grok Sports Re-Commanded (issue #83) - TURBO/TEMPEST ENGINE: filmic renderer, instanced crowd, floodlights,
   5 family pet mascots in every venue, all DLC bundled. Wraps the original view layer without changing gameplay. */
(function () {
  'use strict';
  const SP = window.SP, V = SP.V, D = SP.D, T = THREE;
  const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  D.dlcOwned = () => true; // Re-Commanded bundles every DLC
  const init0 = V.init;
  V.init = function (c) {
    init0(c); const R = V.renderer;
    R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 1.35;
    R.setPixelRatio(Math.min(devicePixelRatio || 1, IOS ? 1.5 : 2));
    V.sun.shadow.mapSize.set(IOS ? 1024 : 2048, IOS ? 1024 : 2048); V.sun.shadow.radius = 3;
    V.rim = new T.DirectionalLight('#ffd6a8', 0.35); V.rim.position.set(30, 25, -40); V.scene.add(V.rim);
  };
  const sq0 = V.setQuality; V.setQuality = function (q) { sq0(q); if (IOS) V.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); };
  const env0 = V.env; let night = false;
  V.env = function (e) { env0(e); night = !!e.night; V.hemi.intensity *= 1.08; schedule(); };
  const clr0 = V.clearWorld; V.clearWorld = function () { const old = V.world; old.traverse((o) => { if (o.userData.tmp && o.material) { [].concat(o.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); } }); clr0(); schedule(); };
  let tmr = 0; function schedule() { clearTimeout(tmr); tmr = setTimeout(dress, 400); }
  const tag = (o) => { o.userData.tmp = true; return o; };
  const fanGeo = new T.BoxGeometry(0.5, 0.8, 0.4); fanGeo.translate(0, 0.4, 0); fanGeo.userData = {};
  const cols = ['#ef4444', '#3b82f6', '#facc15', '#22c55e', '#f472b6', '#a855f7', '#f97316', '#e5e7eb', '#14b8a6'];
  const PET_LOOK = [['Luna', '#b08968', 'rat'], ['Pi-rat', '#6b5b4b', 'pirat'], ['Snowie', '#f8fafc', 'rat'], ['Candy', '#9ca3af', 'dog'], ['Torty', '#65a30d', 'tort']];
  function std(c, o) { return tag(new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o || {}))); }
  function mesh(g, m) { const x = new T.Mesh(g, m); x.castShadow = true; x.userData.tmp = true; return x; }
  function pet(kind, col) {
    const g = new T.Group(), m = std(col), dark = std('#111'), pink = std('#f9a8d4');
    if (kind === 'tort') { const sh = mesh(new T.SphereGeometry(0.6, 16, 10, 0, 6.3, 0, 1.6), std('#4d7c0f')); sh.scale.y = 0.7; sh.position.y = 0.25; g.add(sh); const hd = mesh(new T.SphereGeometry(0.2, 12, 8), std('#a3a36a')); hd.position.set(0, 0.3, 0.7); g.add(hd); [[-.35, .35], [.35, .35], [-.35, -.35], [.35, -.35]].forEach(([x, z]) => { const l = mesh(new T.CylinderGeometry(0.1, 0.1, 0.25, 8), std('#a3a36a')); l.position.set(x, 0.12, z); g.add(l); }); }
    else if (kind === 'dog') { const b = mesh(new T.BoxGeometry(0.45, 0.4, 0.8), m); b.position.y = 0.5; g.add(b); const h = mesh(new T.BoxGeometry(0.35, 0.35, 0.4), m); h.position.set(0, 0.8, 0.5); g.add(h); const beard = mesh(new T.BoxGeometry(0.3, 0.15, 0.2), std('#e5e7eb')); beard.position.set(0, 0.65, 0.7); g.add(beard); [[-.15, .3], [.15, .3], [-.15, -.3], [.15, -.3]].forEach(([x, z]) => { const l = mesh(new T.BoxGeometry(0.1, 0.35, 0.1), m); l.position.set(x, 0.17, z); g.add(l); }); [-.1, .1].forEach((x) => { const e = mesh(new T.SphereGeometry(0.035, 6, 4), dark); e.position.set(x, 0.88, 0.71); g.add(e); }); }
    else { const b = mesh(new T.SphereGeometry(0.32, 16, 10), m); b.scale.set(1, 0.8, 1.4); b.position.y = 0.3; g.add(b); const h = mesh(new T.SphereGeometry(0.2, 12, 8), m); h.position.set(0, 0.38, 0.45); g.add(h); [-.12, .12].forEach((x) => { const ear = mesh(new T.SphereGeometry(0.09, 8, 6), pink); ear.position.set(x, 0.55, 0.4); g.add(ear); }); [-.08, .08].forEach((x, i) => { const e = mesh(new T.SphereGeometry(0.035, 6, 4), kind === 'pirat' && i === 0 ? std('#000') : (col === '#f8fafc' ? std('#e11d48') : dark)); e.position.set(x, 0.44, 0.62); if (kind === 'pirat' && i === 0) e.scale.set(2, 2, 0.6); g.add(e); }); const t = mesh(new T.CylinderGeometry(0.03, 0.015, 0.7, 6), pink); t.rotation.x = 1.3; t.position.set(0, 0.25, -0.75); g.add(t); }
    return g;
  }
  function dress() {
    const w = V.world; if (!w || w.userData.tempest || !w.children.length) return; const st = SP.G && SP.G.state; if (st === 'hub' || st === 'title') return; w.userData.tempest = true;
    const box = new T.Box3(), tb = new T.Box3(), ts = new T.Vector3(); w.children.forEach((ch) => { tb.setFromObject(ch); if (tb.isEmpty()) return; tb.getSize(ts); if (ts.x > 120 || ts.z > 120) return; box.union(tb); }); if (box.isEmpty()) box.set(new T.Vector3(-15, 0, -15), new T.Vector3(15, 1, 15)); const sz = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3());
    const rx = Math.min(Math.max(sz.x * 0.5 + 6, 18), 70), rz = Math.min(Math.max(sz.z * 0.5 + 6, 18), 70), y0 = box.min.y;
    const n = IOS ? 500 : 1100, crowd = new T.InstancedMesh(fanGeo, std('#fff', { roughness: 0.85 }), n); crowd.userData.tmp = true; crowd.userData.keepGeo = true;
    const mt = new T.Matrix4(), q = new T.Quaternion(), col = new T.Color(), base = [];
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, row = (i % 5), r = 1 + row * 0.06; const x = c.x + Math.sin(a) * rx * r, z = c.z + Math.cos(a) * rz * r, y = y0 + row * 0.9; q.setFromAxisAngle(new T.Vector3(0, 1, 0), a + Math.PI); mt.compose(new T.Vector3(x, y, z), q, new T.Vector3(1, 1, 1)); crowd.setMatrixAt(i, mt); crowd.setColorAt(i, col.set(cols[i % cols.length])); base.push([x, y, z, q.clone(), Math.random() * 6]); }
    w.add(crowd);
    V.anim((dt, t) => { if (IOS && ((t * 30) | 0) % 2) return; for (let i = 0; i < n; i += 1) { const b = base[i], h = Math.max(0, Math.sin(t * 4 + b[4])) * 0.25; mt.compose(new T.Vector3(b[0], b[1] + h, b[2]), b[3], new T.Vector3(1, 1, 1)); crowd.setMatrixAt(i, mt); } crowd.instanceMatrix.needsUpdate = true; });
    // floodlight towers
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz2]) => { const x = c.x + sx * rx * 1.15, z = c.z + sz2 * rz * 1.15, pole = mesh(new T.CylinderGeometry(0.25, 0.4, 22, 8), std('#94a3b8', { metalness: 0.6 })); pole.position.set(x, y0 + 11, z); w.add(pole); const head = mesh(new T.BoxGeometry(3, 1.6, 0.4), std('#fff', { emissive: night ? '#fffbe6' : '#555', emissiveIntensity: night ? 1.4 : 0.3 })); head.position.set(x, y0 + 22.5, z); head.lookAt(c.x, y0, c.z); w.add(head); if (night) { const sl = new T.SpotLight('#fff6dc', 0.9, 160, 0.6, 0.5, 1); sl.position.copy(head.position); sl.target.position.copy(c); w.add(sl); w.add(sl.target); } });
    // the 5 family pets as touchline mascots
    PET_LOOK.forEach(([nm, cl, k], i) => { const g = pet(k, cl); const cp = V.cam.position, d = new T.Vector3(c.x - cp.x, 0, c.z - cp.z).normalize(), sd = new T.Vector3(-d.z, 0, d.x), R = Math.max(6, Math.min(rx, rz) - 8), side = i < 3 ? -1 : 1, kk = i < 3 ? i : i - 3; g.position.set(c.x + d.x * R * 0.2 + sd.x * side * (R * 0.75 + kk * 1.6), y0, c.z + d.z * R * 0.2 + sd.z * side * (R * 0.75 + kk * 1.6)); g.lookAt(c.x, y0, c.z); g.scale.setScalar(2.2); w.add(g); const ph = i; V.anim((dt, t) => { g.position.y = y0 + Math.abs(Math.sin(t * 3 + ph)) * 0.3; }); });
  }
  SP.Tempest = { dress, IOS };
})();
