/* Grok Blocks Re-Blocked - new stuff: family pet cameos, mineable ore + pickaxe, ambient particles */
(function () {
'use strict';
const GB = window.GB, THREE = window.THREE;
const X = GB.X = {};
const V = () => GB.View;
let pets = [], ores = [], parts = null, partKind = '', mineHits = {}, talkT = 0, lastTalk = '';
/* ---- the family pets, built from blocks ---- */
const LINES = {
  torty: ['Torty here! Tortuga Tech built your new headlamp. Slow and steady finds every animal.', 'Everybody calls me Torty, but my real name is Martina. Want to race? I\u2019ll win eventually.', 'Psst: the Crystal Caves are through the south gate. Bring darts!'],
  candy: ['Woof! Ruffsources is sending extra rangers to Blossom Hills today!', 'Candy reporting: I sniffed out a panda in the bamboo. Good ranger, good ranger!', 'Torty is slow, but she never loses the case file.'],
  luna: ['Ratita Industries made your shiny new pickaxe. Mine the gold, it\u2019s worth the most!', 'Luna here. Gems glow purple and blue in the caves, coal is just grey.', 'Torty and I are building a bigger sanctuary. Keep rescuing!'],
  pirat: ['Arr! Pi-rat here. Gold ore be the best treasure in these caves!', 'One eye on the lava, matey. Step in it and you\u2019ll drop a dart.', 'Watch the cave bear. It charges like a cannonball. Sneak up on it!'],
  snowie: ['Snowie Sky Tours says hi! Snow leopards love the high peaks.', 'Brrr! I\u2019m Snowie, I blend right in up here.', 'At night the snow sparkles under the stars. So pretty!'],
};
function ratMesh(id) {
  const C = { luna: [0xa9afbd, 0x7d8394, 0xeceef3], pirat: [0xc99a6b, 0x9c7148, 0xf6e7d4], snowie: [0xf4f4f6, 0xdedee6, 0xffffff] }[id];
  const P = [[0.5, 0.42, 0.75, C[0], 0, 0.3, -0.05], [0.4, 0.36, 0.38, C[0], 0, 0.38, 0.45], [0.18, 0.16, 0.16, 0xffb3c8, 0, 0.32, 0.7], [0.07, 0.07, 0.03, 0x1b1b24, 0, 0.36, 0.79],
    [0.18, 0.2, 0.06, 0xffb3c8, -0.17, 0.62, 0.42], [0.18, 0.2, 0.06, 0xffb3c8, 0.17, 0.62, 0.42], [0.34, 0.2, 0.06, C[2], 0, 0.22, 0.32],
    [0.07, 0.07, 0.03, 0x1b1b24, -0.1, 0.45, 0.64], [0.07, 0.07, 0.03, 0x1b1b24, 0.1, 0.45, 0.64],
    [0.08, 0.08, 0.8, 0xffb3c8, 0, 0.16, -0.8], [0.12, 0.1, 0.16, 0xffb3c8, -0.16, 0.05, 0.25], [0.12, 0.1, 0.16, 0xffb3c8, 0.16, 0.05, 0.25], [0.12, 0.1, 0.16, 0xffb3c8, -0.16, 0.05, -0.3], [0.12, 0.1, 0.16, 0xffb3c8, 0.16, 0.05, -0.3]];
  if (id === 'luna') P.push([0.42, 0.08, 0.5, C[1], 0, 0.53, -0.1], [0.36, 0.1, 0.36, 0xf0c24b, 0, 0.62, 0.45], [0.08, 0.1, 0.08, 0xf0c24b, -0.12, 0.72, 0.45], [0.08, 0.1, 0.08, 0xf0c24b, 0.12, 0.72, 0.45]); // tiny boss crown
  if (id === 'pirat') P.push([0.12, 0.1, 0.03, 0x111111, 0.1, 0.45, 0.66], [0.42, 0.03, 0.03, 0x111111, 0, 0.5, 0.62], [0.46, 0.14, 0.46, 0x222222, 0, 0.62, 0.42], [0.3, 0.12, 0.1, 0xffffff, 0, 0.64, 0.66]);
  if (id === 'snowie') P.push([0.46, 0.06, 0.12, 0x7eb6e0, 0, 0.5, 0.3], [0.4, 0.06, 0.3, 0x7eb6e0, 0, 0.32, -0.2]); // Sky Tours scarf
  return V().blocky(P);
}
function candyMesh() {
  const g = 0x8a8a92, l = 0xd8d8dc;
  return V().blocky([[0.25, 0.4, 0.25, l, -0.2, 0.2, 0.35], [0.25, 0.4, 0.25, l, 0.2, 0.2, 0.35], [0.25, 0.4, 0.25, l, -0.2, 0.2, -0.35], [0.25, 0.4, 0.25, l, 0.2, 0.2, -0.35],
    [0.6, 0.45, 1.0, g, 0, 0.6, 0], [0.46, 0.46, 0.5, g, 0, 0.92, 0.6], [0.34, 0.2, 0.3, l, 0, 0.75, 0.9], [0.36, 0.14, 0.2, l, 0, 0.62, 0.92], [0.1, 0.08, 0.06, 0x111111, 0, 0.84, 1.06],
    [0.4, 0.07, 0.08, l, 0, 1.08, 0.86], [0.07, 0.07, 0.03, 0x111111, -0.11, 0.98, 0.86], [0.07, 0.07, 0.03, 0x111111, 0.11, 0.98, 0.86],
    [0.14, 0.18, 0.08, g, -0.17, 1.22, 0.55], [0.14, 0.18, 0.08, g, 0.17, 1.22, 0.55], [0.5, 0.1, 0.12, 0xff4fa0, 0, 0.72, 0.38], [0.1, 0.1, 0.06, 0xf0c24b, 0, 0.65, 0.45], [0.1, 0.3, 0.1, g, 0, 0.9, -0.55]]);
}
function tortyMesh() {
  const sh = 0x7a6a3a, sh2 = 0xa8904a, sk = 0x9aa86a;
  return V().blocky([[1.2, 0.5, 1.4, sh, 0, 0.55, 0], [0.9, 0.3, 1.1, sh2, 0, 0.9, 0], [0.5, 0.15, 0.6, sh, 0, 1.1, 0], [1.3, 0.12, 1.5, 0x5a4a2a, 0, 0.3, 0],
    [0.32, 0.3, 0.4, sk, 0, 0.45, 0.85], [0.06, 0.06, 0.03, 0x111111, -0.1, 0.52, 1.06], [0.06, 0.06, 0.03, 0x111111, 0.1, 0.52, 1.06],
    [0.25, 0.25, 0.25, sk, -0.5, 0.15, 0.5], [0.25, 0.25, 0.25, sk, 0.5, 0.15, 0.5], [0.25, 0.25, 0.25, sk, -0.5, 0.15, -0.5], [0.25, 0.25, 0.25, sk, 0.5, 0.15, -0.5],
    [0.5, 0.12, 0.08, 0x3a8ad2, 0, 0.62, 0.72], [0.12, 0.12, 0.2, sk, 0, 0.3, -0.8], [0.3, 0.2, 0.05, 0xffffff, 0, 1.02, 0.56]]); // Tortuga Tech badge
}
function petMesh(id) { const m = id === 'candy' ? candyMesh() : id === 'torty' ? tortyMesh() : ratMesh(id); m.scale.setScalar(id === 'torty' ? 1.1 : 1.45); return m; }
function nameTag(text, color) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = 'rgba(20,20,30,0.75)'; g.fillRect(0, 0, 256, 64); g.strokeStyle = color; g.lineWidth = 6; g.strokeRect(3, 3, 250, 58);
  g.fillStyle = '#fff'; g.font = 'bold 34px Trebuchet MS, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, toneMapped: false, depthTest: true }));
  s.scale.set(2.4, 0.6, 1); return s; // 4:1 canvas, 4:1 sprite: never stretched
}
const PETNAME = { torty: 'Torty', candy: 'Candy', luna: 'Luna', pirat: 'Pi-rat', snowie: 'Snowie' };
const PETCOL = { torty: '#5ad27a', candy: '#ff4fa0', luna: '#f0c24b', pirat: '#e25b4a', snowie: '#7eb6e0' };
/* ---- ore ---- */
const ORE = { coal: { c: 0x2a2a2e, pts: 10, name: 'Coal' }, gem: { c: 0xc08aff, pts: 30, name: 'Gem', glow: 1 }, gold: { c: 0xffd23f, pts: 50, name: 'Gold', glow: 1 } };
function oreMesh(kind) {
  const o = ORE[kind], st = 0x6a6a74;
  const P = [[1, 1, 1, st, 0, 0.5, 0]];
  const spots = [[0.25, 0.7, 0.51], [-0.2, 0.3, 0.51], [0.51, 0.45, -0.1], [-0.51, 0.65, 0.2], [0.1, 1.01, -0.2], [-0.25, 0.4, -0.51]];
  spots.forEach((sp) => { const w = Math.abs(sp[0]) === 0.51 ? [0.04, 0.22, 0.22] : Math.abs(sp[2]) === 0.51 ? [0.22, 0.22, 0.04] : [0.22, 0.04, 0.22]; P.push([w[0], w[1], w[2], o.c, sp[0], sp[1], sp[2], o.glow ? 1 : 0]); });
  return V().blocky(P);
}
X.onMap = function (m, scene) {
  pets.forEach((p) => { scene.remove(p.g); p.g.traverse((q) => { if (q.isSprite) { q.material.map.dispose(); q.material.dispose(); } }); }); ores.forEach((o) => scene.remove(o.g)); pets = []; ores = []; mineHits = {};
  (m.pets || []).forEach((pd) => {
    const g = new THREE.Group(); const body = petMesh(pd.id); g.add(body); const tag = nameTag(PETNAME[pd.id], PETCOL[pd.id]); tag.position.y = pd.id === 'torty' ? 1.9 : 2.0; g.add(tag);
    const y = m.h(pd.x, pd.z); g.position.set(pd.x, y, pd.z); g.rotation.y = pd.ang || 0; scene.add(g);
    GB.View._envDirty = 1; pets.push({ id: pd.id, g, body, x: pd.x, z: pd.z, y, ang: pd.ang || 0, t: Math.random() * 9 });
  });
  (m.ores || []).forEach((od) => { const g = oreMesh(od.kind); g.position.set(od.x, m.h(od.x, od.z), od.z); scene.add(g); ores.push({ id: od.id, kind: od.kind, x: od.x, z: od.z, g, left: true }); });
  // ambient particles: fireflies, petals, snow, cave motes
  const kind = m.ceil ? 'motes' : m.biome === 'blossom' ? 'petals' : m.biome === 'snow' ? 'snow' : 'flies';
  if (!parts) {
    const n = 240, geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
    parts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.16, color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false, fog: true }));
    parts.frustumCulled = false; parts.userData.seed = new Float32Array(n * 3); for (let i = 0; i < n * 3; i++) parts.userData.seed[i] = Math.random();
    scene.add(parts);
  }
  partKind = kind;
  parts.material.color.set(kind === 'petals' ? 0xffb8d8 : kind === 'snow' ? 0xffffff : kind === 'motes' ? 0x9af6ff : 0xe8ff7a);
  parts.material.size = kind === 'petals' ? 0.2 : kind === 'snow' ? 0.14 : 0.12;
};
X.nearOre = function (x, z) { for (const o of ores) if (o.left && Math.hypot(o.x - x, o.z - z) < 2.2) return o; return null; };
X.tryMine = function (x, z) {
  const o = X.nearOre(x, z); if (!o) return false;
  const G = GB.G, save = G.save(), lvl = (save.upg.pick || 0), need = Math.max(1, 3 - lvl);
  mineHits[o.id] = (mineHits[o.id] || 0) + 1;
  GB.Snd.fx('dart');
  o.g.position.y += 0.05; setTimeout(() => { o.g.position.y -= 0.05; }, 90);
  if (mineHits[o.id] < need) { G.toast('\u26CF\uFE0F Mining ' + ORE[o.kind].name + '... ' + mineHits[o.id] + '/' + need); return true; }
  o.left = false; o.g.visible = false;
  const pts = Math.round(ORE[o.kind].pts * (1 + lvl * 0.25));
  save.points += pts; save.mined = (save.mined || 0) + 1; if (o.kind !== 'coal') save.gems = (save.gems || 0) + 1; G.persist(); G.UI.hud();
  G.toast('\u26CF\uFE0F Mined ' + ORE[o.kind].name + '! +' + pts + ' pts'); GB.Snd.fx('deliver');
  return true;
};
X.frame = function (t, night, cave) {
  const G = GB.G, me = G && G.GS && G.GS.me;
  for (const p of pets) {
    p.t += 0.016;
    p.body.position.y = Math.abs(Math.sin(p.t * 3)) * 0.06; // happy little bounce
    if (me) { const dx = me.x - p.x, dz = me.z - p.z, d = Math.hypot(dx, dz); if (d < 8) { let want = Math.atan2(dx, dz), dy = want - p.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); p.g.rotation.y += dy * 0.08; }
      if (d < 3.6 && G.GS.ui === 'game' && performance.now() > talkT) { const L = LINES[p.id]; let line = L[(Math.random() * L.length) | 0]; if (line === lastTalk) line = L[(L.indexOf(line) + 1) % L.length]; lastTalk = line; G.hint(PETNAME[p.id] + ': ' + line, 6); talkT = performance.now() + 9000; } }
  }
  for (const o of ores) if (o.left && o.kind !== 'coal') { const s = 1 + Math.sin(t * 3 + o.id) * 0.02; o.g.scale.setScalar(s); }
  if (parts) {
    const cam = V().cam, pos = parts.geometry.attributes.position, sd = parts.userData.seed, n = pos.count;
    const show = partKind === 'flies' ? night > 0.35 : true; parts.visible = show && !!cam;
    if (parts.visible) {
      for (let i = 0; i < n; i++) {
        const a = sd[i * 3], b = sd[i * 3 + 1], c = sd[i * 3 + 2]; let x = (a - 0.5) * 60, z = (b - 0.5) * 60, y;
        if (partKind === 'snow' || partKind === 'petals') { y = 18 - ((t * (partKind === 'snow' ? 1.6 : 0.9) + c * 18) % 18); x += Math.sin(t * 0.7 + c * 9) * 1.5; }
        else { y = 1 + c * 6 + Math.sin(t * 0.8 + a * 20) * 0.6; x += Math.sin(t * 0.5 + b * 12) * 1.2; z += Math.cos(t * 0.4 + c * 12) * 1.2; }
        pos.setXYZ(i, cam.position.x + x, (V()._tgtY || 0) + y, cam.position.z + z);
      }
      pos.needsUpdate = true;
      parts.material.opacity = partKind === 'flies' ? 0.6 + Math.sin(t * 4) * 0.3 : 0.9;
    }
  }
};
})();
