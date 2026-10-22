// The Grok Pet Party studio: Tortuga TV Network set, sponsor towers, host desk, contestant podiums,
// Ruffsources guest-booking desk + green room, camera crew, light rigs, crowd.
import * as THREE from 'three';
import { G, mat, part, makeChar, animChar, makeHuman, animHuman } from './models.js';
import { Batch, sign, bleachers, lightTower, speaker, plant, crate, tvCamera, balloons, sky } from './props.js';
import { logoTex, textTex, canvasTex } from './tex.js';
import { E } from './engine.js';
import { damp } from './util.js';
export const GUESTS = [
  { id: 'vic', n: 'Dr. Vic', look: { suit: '#f4f4f8', hair: '#b8bcc8', tie: '#5cff3b', pants: '#4a4a5a' }, line: "My Ratita Goo is EXTRA bouncy tonight. That's… probably fine!", gift: 'Goo-powered bonus: +1 ⭐ for last place!' },
  { id: 'penny', n: 'Penny', look: { suit: '#ff7a3d', hair: '#c2401c', tie: '#ffd23f', long: true }, line: 'I came all the way here just to see Torty slide. Go go go!', gift: 'Penny\u2019s lucky penny: +1 ⭐ for last place!' },
  { id: 'mimi', n: 'Mimi', look: { suit: '#ff8fcf', hair: '#5a2a1a', tie: '#ffffff', long: true }, line: 'Everyone wave to the camera! Hi Tortuga TV!', gift: 'Mimi\u2019s cheer: +1 ⭐ for last place!' },
  { id: 'lily', n: 'Lily', look: { suit: '#a78bfa', hair: '#f0d27a', tie: '#3ff0ff', long: true }, line: 'I brought snacks for the crowd! Cheese for the rats, of course.', gift: 'Lily\u2019s snack boost: +1 ⭐ for last place!' },
  { id: 'lili', n: 'Lili', look: { suit: '#7a3ff0', hair: '#2a1a40', tie: '#ffd23f', long: true }, line: 'Fun fact: this whole show was in my Time Jumper first. Shh!', gift: 'Lili\u2019s time boost: +1 ⭐ for last place!' },
  { id: 'gary', n: 'Gary from IT', look: { suit: '#3a6fd0', hair: '#4a3020', tie: '#222222', pants: '#2a2a33' }, line: 'Have you tried turning the party off and on again? …Just kidding!', gift: 'Gary rebooted the scoreboard: +1 ⭐ for last place!' },
];
export class Studio {
  constructor() { this.grp = new THREE.Group(); this.pods = []; this.build(); this.shot = 'wide'; this.guest = null; this.celebrate = 0; }
  build() {
    const g = this.grp, b = new Batch();
    const fl = new THREE.Mesh(G.plane(), mat('#22163f', { roughness: 0.25, metalness: 0.3 })); fl.rotation.x = -Math.PI / 2; fl.scale.set(80, 80, 1); fl.receiveShadow = true; g.add(fl);
    // stage disc + LED edge + steps
    const st = part(G.cyl(), mat('#3a1f6e', { roughness: 0.3, metalness: 0.3 }), 0, 0.2, -2, 8, 0.4, 6, g); st.receiveShadow = true;
    const ftx = canvasTex('stagefl', 512, 512, (c, w) => { const cx = w / 2; for (let k = 10; k > 0; k--) { c.fillStyle = k % 2 ? '#5a2fa0' : '#7a3fd0'; c.beginPath(); c.arc(cx, cx, cx * k / 10, 0, 7); c.fill(); } c.strokeStyle = '#ffd23f'; c.lineWidth = 4; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; c.beginPath(); c.moveTo(cx, cx); c.lineTo(cx + Math.cos(a) * cx, cx + Math.sin(a) * cx); c.stroke(); } });
    const top = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshStandardMaterial({ map: ftx, roughness: 0.25, metalness: 0.4 })); top.rotation.x = -Math.PI / 2; top.scale.set(7.8, 5.8, 1); top.position.set(0, 0.405, -2); top.receiveShadow = true; g.add(top);
    for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; b.add(G.sph(), mat(k % 2 ? '#3ff0ff' : '#ff4fd8', { emissive: k % 2 ? '#3ff0ff' : '#ff4fd8', emissiveIntensity: 2 }), Math.cos(a) * 8, 0.3, -2 + Math.sin(a) * 6, 0.12, 0.08, 0.12); }
    for (let k = 0; k < 2; k++) b.add(G.box(), mat('#2a1650'), 0, 0.07 + k * 0.13, 4.2 - k * 0.35, 5, 0.14 + k * 0.13, 0.6);
    // back wall: giant 16:9 screen, Tortuga TV network logo, LED pillars
    b.add(G.box(), mat('#160e30'), 0, 5, -9.5, 34, 10, 0.4);
    this.scr = canvasTex('screen', 1024, 576, () => {}); this.scrC = this.scr.image; sign(g, this.scr, 9.6, 0, 4.4, -8.9, 0, 16 / 9, '#0a0a14');
    sign(g, logoTex('tv'), 5.4, 0, 8.6, -9.0, 0, 3.6, '#0b2a24');
    for (let k = 0; k < 10; k++) { const x = -15 + k * 3.33; if (Math.abs(x) < 6) continue; b.add(G.box(), mat(k % 2 ? '#ff4fd8' : '#3ff0ff', { emissive: k % 2 ? '#ff4fd8' : '#3ff0ff', emissiveIntensity: 1.4 }), x, 4.5, -9.25, 0.18, 8, 0.05); }
    // sponsor towers
    for (const [x, k] of [[-7.2, 'ratita'], [7.2, 'tortuga']]) { b.add(G.box(), mat('#1d1240'), x, 3.2, -7.6, 3.2, 6.4, 0.6); sign(g, logoTex(k), 3.0, x, 5.6, -7.25, 0, 3.6); sign(g, logoTex(k), 3.0, x, 2.0, -7.25, 0, 3.6);
      sign(g, textTex('spons' + k, ['PROUD SPONSOR'], 512, 128, { bg1: '#ffd23f', bg2: '#ffb000', fg: '#2a0a4a', border: '#2a0a4a', size: 0.7 }), 2.4, x, 3.8, -7.25, 0, 4); }
    // contestant podiums
    for (let i = 0; i < 4; i++) { const x = -3.6 + i * 2.4, z = -3.4, pg = new THREE.Group(); pg.position.set(x, 0.4, z); g.add(pg);
      part(G.cyl(), mat('#2a1a50', { metalness: 0.5, roughness: 0.3 }), 0, 0.55, 0, 0.8, 1.1, 0.8, pg); part(G.cyl(), mat('#ffd23f', { emissive: '#ffb000', emissiveIntensity: 0.8 }), 0, 1.12, 0, 0.84, 0.06, 0.84, pg);
      const nt = canvasTex('pod' + i, 512, 160, () => {}); const s = sign(pg, nt, 1.5, 0, 0.6, 0.82, 0, 512 / 160, '#111'); const btn = part(G.sph(), mat('#ff3b3b', { emissive: '#ff2020', emissiveIntensity: 1 }), 0.5, 1.2, 0.4, 0.14, 0.08, 0.14, pg);
      this.pods.push({ g: pg, tex: nt, c: nt.image, mesh: null, key: '' }); }
    // host desk (left) with Rico (Ratita Industries) and Martina "Torty" (Tortuga Tech)
    const hd = new THREE.Group(); hd.position.set(-5.6, 0.4, -1.2); hd.rotation.y = 0.55; g.add(hd);
    part(G.box(), mat('#16c79a', { roughness: 0.3 }), 0, 0.55, 0, 2.6, 1.1, 0.9, hd); part(G.box(), mat('#ffffff', { roughness: 0.2 }), 0, 1.12, 0, 2.7, 0.06, 1.0, hd); sign(hd, logoTex('tv'), 2.2, 0, 0.55, 0.47, 0, 3.6, '#0b2a24');
    part(G.box(), mat('#1a1a22'), -0.6, 1.25, -0.1, 0.5, 0.25, 0.04, hd); part(G.cylLo(), mat('#ffffff'), 0.5, 1.22, 0.1, 0.06, 0.16, 0.06, hd); part(G.box(), mat('#ffd23f'), 0.9, 1.16, 0.15, 0.3, 0.04, 0.22, hd);
    this.rico = makeHuman({ suit: '#ff3fb4', hair: '#2a1a1a', tie: '#ffd23f', mic: true }); this.rico.position.set(-0.6, 0, -0.75); hd.add(this.rico);
    this.martina = makeHuman({ suit: '#16c79a', hair: '#3a2010', tie: '#ffffff', long: true, mic: true }); this.martina.position.set(0.65, 0, -0.75); hd.add(this.martina);
    // Ruffsources guest-booking desk + green room (right)
    const gr = new THREE.Group(); gr.position.set(9.6, 0, -3.2); gr.rotation.y = -0.5; g.add(gr); this.green = gr;
    part(G.box(), mat('#2e8a4a'), 0, 1.8, -1.8, 5.2, 3.6, 0.2, gr); part(G.box(), mat('#2e8a4a'), -2.6, 1.8, -0.4, 0.2, 3.6, 2.8, gr);
    sign(gr, logoTex('ruff'), 3.2, 0.2, 2.9, -1.68, 0, 3.6, '#22285a'); sign(gr, textTex('greenroom', ['GREEN ROOM', 'guests booked by Ruffsources'], 512, 160, { bg1: '#2e8a4a', bg2: '#14502a', border: '#ffffff' }), 1.7, -1.6, 1.7, -1.68, 0, 3.2);
    part(G.box(), mat('#3b4a8f', { roughness: 0.4 }), 1.2, 0.5, 0.2, 1.8, 1.0, 0.8, gr); part(G.box(), mat('#ffffff'), 1.2, 1.02, 0.2, 1.9, 0.05, 0.9, gr); sign(gr, logoTex('ruff'), 1.6, 1.2, 0.55, 0.62, 0, 3.6, '#22285a');
    part(G.box(), mat('#22222a'), 0.8, 1.2, 0.1, 0.5, 0.32, 0.04, gr).rotation.x = -0.3; part(G.box(), mat('#ffffff'), 1.6, 1.07, 0.3, 0.3, 0.04, 0.22, gr); part(G.cylLo(), mat('#ffd23f'), 1.85, 1.13, 0.05, 0.05, 0.16, 0.05, gr);
    this.candy = makeChar('candy', '#ff4f8b'); this.candy.scale.setScalar(1.3); this.candy.position.set(1.2, 1.05, -0.35); gr.add(this.candy);
    part(G.box(), mat('#7a3ff0'), -1.0, 0.3, -1.2, 2.0, 0.6, 0.8, gr); part(G.box(), mat('#7a3ff0'), -1.0, 0.75, -1.55, 2.0, 0.7, 0.2, gr); for (const s of [-1, 1]) part(G.box(), mat('#6a2fe0'), -1.0 + s * 1.0, 0.5, -1.2, 0.2, 0.5, 0.8, gr);
    part(G.cyl(), mat('#8b5a2b'), -1.0, 0.25, -0.2, 0.5, 0.06, 0.35, gr); part(G.cylLo(), mat('#ff7ab8'), -1.2, 0.33, -0.2, 0.08, 0.12, 0.08, gr); part(G.sph(), mat('#ffd23f'), -0.8, 0.33, -0.2, 0.09, 0.05, 0.09, gr);
    b.add(G.cyl(), mat('#d96a3b'), 9.6 - 2.1 * Math.cos(0.5), 0.25, -3.2 + 2.1 * Math.sin(0.5) - 1.4, 0.3, 0.5, 0.3); b.add(G.sphLo(), mat('#3fae54'), 9.6 - 2.1 * Math.cos(0.5), 0.8, -3.2 + 2.1 * Math.sin(0.5) - 1.4, 0.45, 0.6, 0.45);
    // camera crew, light rigs, speakers, crowd, prize table
    tvCamera(b, -3.5, 7.5, Math.PI + 0.3); tvCamera(b, 3.8, 7.2, Math.PI - 0.35); tvCamera(b, -8.5, 3.5, Math.PI * 0.7);
    this.crew = [[-3.5, 8.1], [3.8, 7.8], [-9.1, 4.0]].map(([x, z], k) => { const h = makeHuman({ suit: '#222', hair: ['#3a2a1a', '#a0522d', '#111'][k], tie: '#16c79a' }); h.position.set(x, 0, z); h.rotation.y = Math.PI + (k - 1) * 0.3; g.add(h); return h; });
    for (const x of [-10.5, 10.5]) { lightTower(b, x, -6, 8, x < 0 ? '#ff4fd8' : '#3ff0ff'); speaker(b, x * 0.86, -5.2, x < 0 ? 0.6 : -0.6, 3); }
    b.add(G.box(), mat('#2a2640', { metalness: 0.6 }), 0, 9, -3, 24, 0.25, 0.25); b.add(G.box(), mat('#2a2640', { metalness: 0.6 }), 0, 9, 2, 24, 0.25, 0.25);
    this.spots = []; for (let k = 0; k < 6; k++) { const x = -8 + k * 3.2; b.add(G.cyl(), mat('#111', { metalness: 0.5 }), x, 8.7, -3, 0.25, 0.5, 0.25);
      const cone = new THREE.Mesh(geoCone(), new THREE.MeshBasicMaterial({ color: k % 2 ? '#ff7ae0' : '#7af0ff', transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false })); cone.position.set(x, 8.5, -3); g.add(cone); this.spots.push(cone); }
    bleachers(b, -12, 2.5, -Math.PI / 2 - 0.25, 10, 5); bleachers(b, 12.5, 4, Math.PI / 2 + 0.25, 8, 5);
    const pt = new THREE.Group(); pt.position.set(5.4, 0.4, -1.0); pt.rotation.y = -0.4; g.add(pt); part(G.box(), mat('#ffd23f'), 0, 0.45, 0, 1.8, 0.9, 0.7, pt); part(G.box(), mat('#ff3fb4'), 0, 0.92, 0, 1.9, 0.05, 0.8, pt);
    for (let k = 0; k < 3; k++) { const x = -0.6 + k * 0.6, s = [0.8, 1.1, 0.7][k]; part(G.cyl(), mat(['#c0c4cc', '#ffd23f', '#cd7f32'][k], { metalness: 0.9, roughness: 0.2 }), x, 1.1 * s + 0.2, 0, 0.12 * s, 0.4 * s, 0.12 * s, pt); part(G.sph(), mat(['#c0c4cc', '#ffd23f', '#cd7f32'][k], { metalness: 0.9, roughness: 0.2 }), x, 1.4 * s + 0.3, 0, 0.2 * s, 0.16 * s, 0.2 * s, pt); }
    sign(pt, textTex('prizes', ['TROPHIES & TICKETS'], 512, 96, { bg1: '#2a0a4a', size: 0.6 }), 1.6, 0, 0.45, 0.36, 0, 512 / 96);
    for (const [x, z] of [[-7.6, 2.5], [7.8, 1.6], [-4.8, 4.8], [5, 4.8]]) balloons(b, x, z, 6);
    for (const [x, z] of [[-6.5, 4.5], [6.5, 4.0], [-8.8, -4.6], [8.6, -6.2]]) plant(b, x, z, 1.1);
    for (let k = 0; k < 5; k++) crate(b, -9.6 + (k % 2) * 0.1, Math.floor(k / 2) * 0.7, -1.6 + (k % 2) * 0.75, 0.7, k * 0.3);
    this.crownM = new THREE.Group(); part(G.cyl(), mat('#ffd23f', { metalness: 0.9, roughness: 0.2, emissive: '#aa6600', emissiveIntensity: 0.5 }), 0, 0.15, 0, 0.36, 0.3, 0.36, this.crownM, false);
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; part(G.cone(), mat('#ffd23f', { metalness: 0.9, roughness: 0.2 }), Math.cos(a) * 0.3, 0.42, Math.sin(a) * 0.3, 0.09, 0.26, 0.09, this.crownM, false); part(G.sph(), mat(['#ff3fb4', '#3ff0ff', '#5cff3b', '#ff3b3b', '#a78bfa'][k], { emissive: '#ffffff', emissiveIntensity: 0.4 }), Math.cos(a) * 0.36, 0.15, Math.sin(a) * 0.36, 0.06, 0.06, 0.06, this.crownM, false); }
    this.crownM.visible = false; g.add(this.crownM);
    b.build(g);
    // walking-on characters shown on the podiums
    this.drawScreen('GROK PET PARTY', 'LIVE on Tortuga TV');
  }
  setRoster(roster, stars) { roster.forEach((p, i) => { const pd = this.pods[i]; if (!pd) return; const key = p.char + p.color; if (pd.key !== key) { if (pd.mesh) pd.g.remove(pd.mesh); pd.mesh = makeChar(p.char, p.color); pd.mesh.scale.setScalar(1.5); pd.mesh.position.y = 1.15; pd.g.add(pd.mesh); pd.key = key; }
      const c = pd.c.getContext('2d'); c.fillStyle = '#0d0820'; c.fillRect(0, 0, 512, 160); c.fillStyle = p.color; c.fillRect(0, 0, 512, 14); c.font = '900 52px system-ui'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(p.name, 256, 72, 480); c.font = '900 50px system-ui'; c.fillStyle = '#ffd23f'; c.fillText('⭐ ' + (stars ? stars[i] : 0), 256, 136); pd.tex.needsUpdate = true; });
    this.pods.forEach((pd, i) => pd.g.visible = i < roster.length); }
  drawScreen(t1, t2, col = '#ff3fb4', ic = '') { const c = this.scrC.getContext('2d'), w = 1024, h = 576; const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, col); gr.addColorStop(1, '#2a0a4a'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.globalAlpha = 0.15; c.fillStyle = '#fff'; for (let k = 0; k < 14; k++) { c.beginPath(); c.moveTo(w / 2, h * 0.3); c.arc(w / 2, h * 0.3, w, k / 14 * Math.PI * 2, (k + 0.5) / 14 * Math.PI * 2); c.fill(); } c.globalAlpha = 1;
    // everything sits in the TOP part of the screen: the podium heads cover the bottom from the podium camera
    c.textAlign = 'center'; c.font = '800 22px system-ui'; c.fillStyle = '#c9ffe9'; c.fillText('RATITA INDUSTRIES × TORTUGA TECH', w / 2, 34, w * 0.44);
    if (Array.isArray(t2)) { // standings: one centred column in the middle 46% of the screen, so a portrait phone always sees all of it
      const x0 = w * 0.27, cw = w * 0.46; c.font = '900 56px system-ui'; c.fillStyle = '#fff'; c.fillText(t1, w / 2, 100, cw);
      t2.forEach((r, k) => { const y = 124 + k * 62; c.fillStyle = '#000a'; c.fillRect(x0, y, cw, 54); c.fillStyle = r[2]; c.fillRect(x0, y, 12, 54); c.textAlign = 'left'; c.font = '900 32px system-ui'; c.fillStyle = '#fff'; c.fillText(`${k + 1}. ${r[0]}`, x0 + 24, y + 38, cw * 0.62); c.textAlign = 'right'; c.fillStyle = '#ffd23f'; c.fillText(r[1] + ' ⭐', x0 + cw - 14, y + 38); });
      c.textAlign = 'center'; this.scr.needsUpdate = true; return; }
    c.fillStyle = '#fff'; if (ic) { c.font = '110px system-ui'; c.fillText(ic, w / 2, 160); }
    c.font = `900 ${ic ? 70 : 90}px system-ui`; c.fillText(t1, w / 2, ic ? 245 : 170, w - 80); c.font = '800 42px system-ui'; c.fillStyle = '#ffe58a'; c.fillText(t2 || '', w / 2, ic ? 305 : 240, w - 80); this.scr.needsUpdate = true; }
  showGuest(gd) { if (this.guest) { this.grp.remove(this.guest); this.guest = null; } if (!gd) return; const h = makeHuman(gd.look); h.position.set(8.2, 0, -1.6); this.grp.add(h); this.guest = h; this.guestT = 0; }
  update(dt, talk) { const t = E.t; animHuman(this.rico, t, talk === 'rico'); animHuman(this.martina, t + 1, talk === 'martina'); animChar(this.candy, t, talk === 'candy' ? 1.5 : 0, false); this.candy.rotation.y = Math.sin(t * 0.8) * 0.4;
    this.crew.forEach((h, k) => animHuman(h, t + k, false)); this.spots.forEach((s, k) => { s.rotation.z = Math.sin(t * 0.7 + k) * 0.35; s.rotation.x = Math.cos(t * 0.5 + k * 1.3) * 0.25; });
    this.pods.forEach((p, k) => { if (p.mesh) { animChar(p.mesh, t, this.celebrate && k === this.champ ? 3 : 0, false); p.mesh.position.y = 1.15 + (this.celebrate && k === this.champ ? Math.abs(Math.sin(t * 6)) * 0.4 : 0); p.mesh.rotation.y = Math.sin(t * 0.6 + k) * 0.3; } });
    if (this.guest) { this.guestT += dt; const g = this.guest, tx = 4.4, tz = 0.6; g.position.x = damp(g.position.x, tx, 1.6, dt); g.position.z = damp(g.position.z, tz, 1.6, dt); g.position.y = 0.4 * Math.min(1, Math.max(0, (8.2 - g.position.x) / 1.5)); g.rotation.y = Math.abs(g.position.x - tx) > 0.3 ? -Math.PI / 2 : -0.3; animHuman(g, t, talk === 'guest'); }
    if (this.crownM) { this.crownM.visible = !!this.celebrate; const p = this.pods[this.champ || 0]; if (p && this.celebrate) { this.crownM.position.set(p.g.position.x, 0.4 + 1.15 + 1.2 + (p.mesh ? p.mesh.position.y - 1.15 : 0) + 0.15, p.g.position.z + 0.2); this.crownM.rotation.y = t * 1.5; } } }
  camShot(name) { if (name !== this.shot) this._ci = 0; this.shot = name; } // TV-style hard cuts between camera shots
  camera(dt) { const cam = E.camera, S = { wide: [[0, 5.4, 13], [0, 2.2, -3]], podium: [[0, 3.6, 4.8], [0, 1.8, -3.4]], host: [[-1.5, 2.8, 3.5], [-5.6, 1.8, -1.6]], guest: [[2.4, 2.8, 6.4], [5.6, 1.5, -1.2]], screen: [[0, 4.2, 6.0], [0, 4.0, -9]], board: [[0, 6.2, 3.0], [0, 5.6, -9]], champ: [[this.champX || 0, 3.4, 4.6], [this.champX || 0, 2.4, -3.4]] }[this.shot] || [[0, 5.4, 13], [0, 2.2, -3]];
    const fit = Math.max(1, 0.75 / cam.aspect) ** 0.95; const want = new THREE.Vector3(...S[0]).sub(new THREE.Vector3(...S[1])).multiplyScalar(fit).add(new THREE.Vector3(...S[1]));
    if (!this._ci) { cam.position.copy(want); this._look = new THREE.Vector3(...S[1]); this._ci = 1; } cam.position.lerp(want, 1 - Math.exp(-3 * dt)); this._look.lerp(new THREE.Vector3(...S[1]), 1 - Math.exp(-3 * dt)); cam.lookAt(this._look); }
}
function geoCone() { const g = new THREE.ConeGeometry(1.6, 9, 20, 1, true); g.translate(0, -4.5, 0); return g; }
