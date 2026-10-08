/* Grok Arcade - Prize Counter catalog + hand-drawn "3D" prize art (2D canvas, shaded like vinyl/plush toys).
   Every prize is drawn in a 100x100 box; GA.PrizeArt.icon(id, px, locked) returns a cached canvas. */
(function () {
  'use strict';
  /* ---------- the prizes (one of each; prices go from pocket-money to big goals) ---------- */
  GA.PRIZE_CATS = [
    { id: 'fun', name: 'Fun Stuff', icon: '\uD83C\uDF9F\uFE0F' },
    { id: 'plush', name: 'Plushies', icon: '\uD83E\uDDF8' },
    { id: 'model', name: 'Models & Figures', icon: '\u2708\uFE0F' },
    { id: 'trophy', name: 'Trophies', icon: '\uD83C\uDFC6' }
  ];
  GA.PRIZES = [
    { id: 'kc_snake', cat: 'fun', name: 'Grok Snake Keychain', price: 10, desc: 'A squishy neon snake for your keys.' },
    { id: 'kc_joy', cat: 'fun', name: 'Mini Joystick Keychain', price: 15, desc: 'Clicky tiny joystick. Very satisfying.' },
    { id: 'poster_arcade', cat: 'fun', name: 'Grok Arcade Poster', price: 20, desc: 'Glow-in-the-dark arcade poster.' },
    { id: 'poster_brawl', cat: 'fun', name: 'Grok Brawl Poster', price: 30, desc: 'BLAZE vs VOLT, the big fight poster.' },
    { id: 'cap', cat: 'fun', name: 'Neon Arcade Cap', price: 35, desc: 'The pink cap with the cyan brim. Iconic.' },
    { id: 'propeller', cat: 'fun', name: 'Propeller Hat', price: 50, desc: 'Spins when you run. Probably.' },
    { id: 'kc_flash', cat: 'fun', name: 'Ghost Flashlight Keychain', price: 25, desc: 'A tiny Grok Spooks flashlight. Click it and a little ghost glows!' },
    { id: 'goo_jar', cat: 'fun', name: 'Glow Goo Jar', price: 30, desc: 'A jar of wobbly green goo that glows in the dark. Don\u2019t eat it.' },
    { id: 'lava_lamp', cat: 'fun', name: 'Retro Lava Lamp', price: 45, desc: 'Pink and purple blobs float up and down forever. Very chill.' },
    { id: 'pl_luna', cat: 'plush', name: 'Luna Plush', price: 40, desc: 'Silver sweetheart rat plushie.' },
    { id: 'pl_pirat', cat: 'plush', name: 'Pi-rat Plush', price: 40, desc: 'One eye, big heart, extra soft.' },
    { id: 'pl_snowie', cat: 'plush', name: 'Snowie Plush', price: 40, desc: 'Snow-white speedster plushie.' },
    { id: 'pl_invader', cat: 'plush', name: 'Grok Invaders Plush', price: 50, desc: 'The alien from Grok Invaders, now huggable.' },
    { id: 'pl_candy', cat: 'plush', name: 'Candy Plush', price: 60, desc: 'Candy the mini schnauzer, with her beard!' },
    { id: 'pl_brutus', cat: 'plush', name: 'Brutus Plush', price: 55, desc: 'Brutus the bulldog. Tough guard dog, scared of squirrels.' },
    { id: 'pl_floaty', cat: 'plush', name: 'Floaty Plush', price: 65, desc: 'Grok Dash\u2019s floaty glider with the propeller ears.' },
    { id: 'pl_speedy', cat: 'plush', name: 'Speedy Plush', price: 65, desc: 'Grok Dash\u2019s red speedster. Gotta go fast!' },
    { id: 'pl_dash', cat: 'plush', name: 'Grok Dash Hero Plush', price: 80, desc: 'The hero of Grok Dash with floating hands, golden tuft and scarf.' },
    { id: 'pl_goob', cat: 'plush', name: 'Goob Ghost Plush', price: 45, desc: 'The little green ghost from Grok Spooks. Squishy and only a bit spooky.' },
    { id: 'pl_boo', cat: 'plush', name: 'Shy Boo Plush', price: 55, desc: 'A hidden Boo from Grok Manor, covering its face. Too shy to say hi!' },
    { id: 'pl_waltzy', cat: 'plush', name: 'Countess Waltzy Plush', price: 90, desc: 'The dancing boss ghost of the Ballroom, with her golden tiara.' },
    { id: 'pl_blaze', cat: 'plush', name: 'BLAZE Plush', price: 75, desc: 'Grok Brawl\u2019s fire brawler.' },
    { id: 'pl_volt', cat: 'plush', name: 'VOLT Plush', price: 75, desc: 'Grok Brawl\u2019s lightning speedster.' },
    { id: 'pl_boulder', cat: 'plush', name: 'BOULDER Plush', price: 75, desc: 'Grok Brawl\u2019s stone titan.' },
    { id: 'pl_nova', cat: 'plush', name: 'NOVA Plush', price: 75, desc: 'Grok Brawl\u2019s star ninja.' },
    { id: 'pl_frost', cat: 'plush', name: 'FROST Plush', price: 75, desc: 'Grok Brawl\u2019s ice knight.' },
    { id: 'pl_sakura', cat: 'plush', name: 'SAKURA Plush', price: 75, desc: 'Grok Brawl\u2019s cyclone kicker.' },
    { id: 'pl_prime', cat: 'plush', name: 'GROK PRIME Plush', price: 120, desc: 'The final boss, in plush form.' },
    { id: 'fc_ball', cat: 'model', name: 'Signed Grok FC Ball', price: 100, desc: 'Signed by the whole Grok FC team.' },
    { id: 'gary_bobble', cat: 'model', name: 'Gary Bobblehead', price: 120, desc: 'Gary from IT. Nods yes to every question.' },
    { id: 'land_fig', cat: 'model', name: 'Grok Land Hero Figure', price: 150, desc: 'The hero of all 8 worlds on a grass block.' },
    { id: 'sky_plane', cat: 'model', name: 'Grok Sky Airliner Model', price: 180, desc: 'A shiny display model of your airliner.' },
    { id: 'vac_replica', cat: 'model', name: 'Grok-Vac Replica', price: 220, desc: 'A full-size Grok-Vac 3000 on a stand, glowing ghost tank and all.' },
    { id: 'grid_car', cat: 'model', name: 'Grok Grid F1 Car Model', price: 200, desc: 'Pole-position racer on a display stand.' },
    { id: 'tr_bronze', cat: 'trophy', name: 'Bronze Trophy', price: 200, desc: 'A real arcade champion trophy.' },
    { id: 'tr_silver', cat: 'trophy', name: 'Silver Trophy', price: 300, desc: 'Shiny! Shows you mean business.' },
    { id: 'tr_gold', cat: 'trophy', name: 'Gold Trophy', price: 450, desc: 'The big one. Almost.' },
    { id: 'tr_ring', cat: 'trophy', name: 'Golden Ring Trophy', price: 350, desc: 'A giant spinning Grok Dash ring on a stand. Shiny!' },
    { id: 'golden_joy', cat: 'trophy', name: 'Golden Joystick', price: 750, desc: 'The legendary Golden Joystick. The ultimate prize!' }
  ];
  GA.findPrize = function (id) { return GA.PRIZES.find(function (p) { return p.id === id; }); };

  /* ---------- colour + shading helpers ---------- */
  function rgb(c) { c = c.replace('#', ''); if (c.length === 3) c = c.split('').map(function (x) { return x + x; }).join(''); var n = parseInt(c, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(c, t, k) { var a = rgb(c), b = rgb(t); return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * k); }).join(',') + ')'; }
  function lt(c, k) { return mix(c, '#ffffff', k); }
  function dk(c, k) { return mix(c, '#000000', k); }
  function ball(g, x, y, rx, ry, col, rot) {
    var r = Math.max(rx, ry), gr = g.createRadialGradient(x - rx * 0.35, y - ry * 0.42, r * 0.08, x, y, r * 1.08);
    gr.addColorStop(0, lt(col, 0.6)); gr.addColorStop(0.45, col); gr.addColorStop(1, dk(col, 0.42));
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 7); g.fill();
  }
  function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function slab(g, x, y, w, h, r, col) { // a rounded box lit from the top-left
    var gr = g.createLinearGradient(x, y, x + w * 0.4, y + h); gr.addColorStop(0, lt(col, 0.45)); gr.addColorStop(0.5, col); gr.addColorStop(1, dk(col, 0.38));
    g.fillStyle = gr; rr(g, x, y, w, h, r); g.fill();
  }
  function metal(g, x0, x1, col) { var gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, dk(col, 0.25)); gr.addColorStop(0.28, lt(col, 0.75)); gr.addColorStop(0.5, col); gr.addColorStop(0.85, dk(col, 0.35)); gr.addColorStop(1, dk(col, 0.15)); return gr; }
  function shadow(g, x, y, rx) { var gr = g.createRadialGradient(x, y, 1, x, y, rx); gr.addColorStop(0, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, rx * 0.28, 0, 0, 7); g.fill(); }
  function shine(g, x, y, rx, ry, a) { g.fillStyle = 'rgba(255,255,255,' + (a || 0.55) + ')'; g.beginPath(); g.ellipse(x, y, rx, ry, -0.5, 0, 7); g.fill(); }
  function eye(g, x, y, r) { g.fillStyle = '#16101f'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - r * 0.35, y - r * 0.35, r * 0.38, 0, 7); g.fill(); }
  function stitch(g, x0, y0, x1, y1, col) { g.save(); g.setLineDash([2.2, 2.2]); g.strokeStyle = col || 'rgba(255,255,255,0.55)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.restore(); }
  function star(g, x, y, r, col, pts) { pts = pts || 5; g.fillStyle = col; g.beginPath(); for (var i = 0; i < pts * 2; i++) { var a = -Math.PI / 2 + i * Math.PI / pts, q = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); g.fill(); }
  function smile(g, x, y, w) { g.strokeStyle = '#3a1020'; g.lineWidth = 1.8; g.lineCap = 'round'; g.beginPath(); g.arc(x, y - w * 0.3, w * 0.6, 0.35, Math.PI - 0.35); g.stroke(); }
  function blush(g, x, y) { g.fillStyle = 'rgba(255,110,150,0.45)'; g.beginPath(); g.ellipse(x, y, 4, 2.5, 0, 0, 7); g.fill(); }
  function sparkle(g, x, y, r) { g.fillStyle = '#fffbe0'; g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill(); }
  function tag(g, x, y) { g.fillStyle = '#fff'; rr(g, x, y, 9, 7, 2); g.fill(); g.fillStyle = '#ff4fd8'; g.beginPath(); g.arc(x + 3.2, y + 3, 1.5, 0, 7); g.arc(x + 5.8, y + 3, 1.5, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + 1.8, y + 3.6); g.lineTo(x + 4.5, y + 6); g.lineTo(x + 7.2, y + 3.6); g.fill(); }

  /* ---------- plush fighters (Grok Brawl) ---------- */
  var FIGHTERS = {
    blaze: { body: '#ff4a2e', acc: '#ffb020', skin: '#ffcfa6' }, volt: { body: '#2b2f7a', acc: '#ffd400', skin: '#ffe0bd' },
    boulder: { body: '#4fbf5a', acc: '#a8a29e', skin: '#b8b0a6' }, nova: { body: '#a259ff', acc: '#ff6be6', skin: '#ffd9c2' },
    frost: { body: '#3fd8ff', acc: '#e8fbff', skin: '#ffe6d6' }, sakura: { body: '#ffffff', acc: '#ff5fb0', skin: '#ffe0cc' },
    prime: { body: '#262640', acc: '#ffc531', skin: '#ffd9a8' }
  };
  function plushFighter(g, id) {
    var F = FIGHTERS[id];
    shadow(g, 50, 91, 30);
    ball(g, 38, 86, 9, 6, dk(F.body, 0.15)); ball(g, 62, 86, 9, 6, dk(F.body, 0.15));
    ball(g, 26, 66, 7, 11, F.body, 0.35); ball(g, 74, 66, 7, 11, F.body, -0.35);
    ball(g, 50, 70, 22, 18, F.body);
    g.fillStyle = F.acc; rr(g, 30, 67, 40, 6, 3); g.fill(); stitch(g, 50, 74, 50, 86);
    if (id === 'volt') { g.fillStyle = '#ffd400'; g.beginPath(); g.moveTo(52, 74); g.lineTo(45, 82); g.lineTo(50, 82); g.lineTo(47, 89); g.lineTo(56, 79); g.lineTo(51, 79); g.closePath(); g.fill(); }
    if (id === 'nova' || id === 'prime') star(g, 50, 80, 5, F.acc);
    if (id === 'sakura') { g.fillStyle = '#ff5fb0'; for (var p = 0; p < 5; p++) { var a = p * 1.2566; g.beginPath(); g.ellipse(50 + Math.cos(a) * 3, 80 + Math.sin(a) * 3, 2.6, 1.6, a, 0, 7); g.fill(); } }
    // head
    var hc = id === 'boulder' ? '#9a958c' : F.skin;
    ball(g, 50, 38, 25, 23, hc);
    if (id === 'boulder') { ball(g, 36, 26, 7, 5, '#6f6a62'); ball(g, 64, 30, 6, 5, '#7c776f'); ball(g, 48, 18, 9, 5, '#4fbf5a'); ball(g, 60, 52, 5, 4, '#6f6a62'); }
    if (id === 'blaze') { [[34, 22, 8], [44, 14, 10], [56, 12, 11], [66, 20, 8]].forEach(function (f) { g.fillStyle = '#ff7a1a'; g.beginPath(); g.moveTo(f[0] - f[2] * 0.7, 26); g.quadraticCurveTo(f[0] - f[2] * 0.4, f[1], f[0], f[1] - f[2]); g.quadraticCurveTo(f[0] + f[2] * 0.6, f[1], f[0] + f[2] * 0.8, 26); g.fill(); g.fillStyle = '#ffd23b'; g.beginPath(); g.ellipse(f[0], f[1] + 3, f[2] * 0.3, f[2] * 0.55, 0, 0, 7); g.fill(); });
      g.fillStyle = '#d61f1f'; rr(g, 26, 25, 48, 6, 3); g.fill(); }
    if (id === 'volt') { g.fillStyle = '#ffd400'; g.beginPath(); g.moveTo(26, 32); [[30, 12], [38, 24], [44, 6], [52, 22], [60, 6], [64, 22], [74, 12], [74, 32]].forEach(function (q) { g.lineTo(q[0], q[1]); }); g.quadraticCurveTo(50, 20, 26, 32); g.fill(); shine(g, 42, 16, 5, 2, 0.5); }
    if (id === 'nova') { var hg = g.createRadialGradient(42, 26, 3, 50, 38, 28); hg.addColorStop(0, lt('#a259ff', 0.4)); hg.addColorStop(1, dk('#a259ff', 0.35)); g.fillStyle = hg; g.beginPath(); g.arc(50, 38, 25.5, 0, 7); g.fill(); g.fillStyle = F.skin; rr(g, 31, 33, 38, 13, 6); g.fill(); g.fillStyle = '#ff6be6'; rr(g, 26, 26, 48, 4, 2); g.fill(); g.beginPath(); g.moveTo(72, 28); g.lineTo(84, 22); g.lineTo(82, 31); g.fill(); }
    if (id === 'frost') { var ig = g.createLinearGradient(30, 12, 70, 40); ig.addColorStop(0, '#e8fbff'); ig.addColorStop(1, '#3fb6e0'); g.fillStyle = ig; g.beginPath(); g.arc(50, 36, 26, Math.PI * 1.02, Math.PI * 1.98); g.lineTo(76, 34); g.lineTo(24, 34); g.fill(); g.fillStyle = '#bff4ff'; g.beginPath(); g.moveTo(44, 13); g.lineTo(50, -2); g.lineTo(56, 13); g.fill(); shine(g, 38, 22, 6, 3); }
    if (id === 'sakura') { ball(g, 30, 20, 9, 9, '#ff5fb0'); ball(g, 70, 20, 9, 9, '#ff5fb0'); g.fillStyle = '#ff5fb0'; g.beginPath(); g.arc(50, 34, 25, Math.PI * 1.05, Math.PI * 1.95); g.quadraticCurveTo(50, 26, 26, 32); g.fill(); g.fillStyle = '#fff'; for (var q = 0; q < 5; q++) { var b = q * 1.2566; g.beginPath(); g.ellipse(70 + Math.cos(b) * 3.4, 20 + Math.sin(b) * 3.4, 2.8, 1.8, b, 0, 7); g.fill(); } g.fillStyle = '#ffd23b'; g.beginPath(); g.arc(70, 20, 1.8, 0, 7); g.fill(); }
    if (id === 'prime') { var cg = metal(g, 32, 68, '#ffc531'); g.fillStyle = cg; g.beginPath(); g.moveTo(32, 22); g.lineTo(32, 8); g.lineTo(40, 15); g.lineTo(50, 4); g.lineTo(60, 15); g.lineTo(68, 8); g.lineTo(68, 22); g.closePath(); g.fill(); g.fillStyle = '#ff3d6e'; g.beginPath(); g.arc(50, 15, 2.6, 0, 7); g.fill(); }
    // face
    if (id === 'prime') { g.fillStyle = '#ffc531'; g.shadowColor = '#ffc531'; g.shadowBlur = 6; g.beginPath(); g.ellipse(41, 39, 4, 3, 0, 0, 7); g.ellipse(59, 39, 4, 3, 0, 0, 7); g.fill(); g.shadowBlur = 0; }
    else { eye(g, 41, 39, 3.6); eye(g, 59, 39, 3.6); }
    blush(g, 34, 46); blush(g, 66, 46); smile(g, 50, 49, 5);
    shine(g, 39, 26, 6, 3, 0.35);
  }

  /* ---------- other plushies ---------- */
  function plushInvader(g) {
    var P = ['..X.....X..', '...X...X...', '..XXXXXXX..', '.XX.XXX.XX.', 'XXXXXXXXXXX', 'X.XXXXXXX.X', 'X.X.....X.X', '...XX.XX...'];
    shadow(g, 50, 90, 34);
    var s = 8, ox = 50 - 5.5 * s, oy = 20;
    for (var y = 0; y < 8; y++) for (var x = 0; x < 11; x++) if (P[y][x] === 'X') { slab(g, ox + x * s - 0.6, oy + y * s - 0.6, s + 1.2, s + 1.2, 3, '#4ade80'); }
    g.save(); g.globalAlpha = 0.35; stitch(g, ox + 1, oy + 4.5 * s, ox + 11 * s - 1, oy + 4.5 * s, '#0b5a2b'); g.restore();
    [[3, 3], [7, 3]].forEach(function (e) { var ex = ox + e[0] * s + s / 2, ey = oy + e[1] * s + s / 2; g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, 5.2, 0, 7); g.fill(); eye(g, ex + 0.8, ey + 0.8, 2.8); });
    blush(g, ox + 2.5 * s, oy + 5 * s); blush(g, ox + 8.5 * s, oy + 5 * s);
    shine(g, ox + 3 * s, oy + 2.3 * s, 7, 2.5, 0.4); tag(g, ox + 9.2 * s, oy + 6.6 * s);
  }
  function plushRat(g, type) {
    shadow(g, 50, 91, 30);
    if (GA.drawRat) { GA.drawRat(g, type, 50, 36, 56, true); }
    else ball(g, 50, 60, 26, 24, type === 'snowie' ? '#ffffff' : type === 'luna' ? '#c3c8d6' : '#e0b080');
    var sg = g.createRadialGradient(38, 30, 4, 50, 58, 50); sg.addColorStop(0, 'rgba(255,255,255,0.25)'); sg.addColorStop(1, 'rgba(0,0,0,0.3)');
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = sg; g.fillRect(0, 0, 100, 100); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#ff4fd8'; g.beginPath(); g.moveTo(50, 60); g.lineTo(40, 55); g.lineTo(40, 66); g.closePath(); g.moveTo(50, 60); g.lineTo(60, 55); g.lineTo(60, 66); g.closePath(); g.fill(); ball(g, 50, 60, 3, 3, '#ff4fd8');
    tag(g, 66, 78);
  }
  function plushCandy(g) {
    shadow(g, 50, 91, 32);
    var s = 1.08; g.save(); g.translate(36, 88); g.scale(s, s);
    var gray = '#7b8088', light = '#9ea3ab', dark = '#5d6168', white = '#eceef2';
    [-15, -8, 9, 16].forEach(function (lx) { slab(g, lx - 3.5, -18, 7, 18, 3, dark); g.fillStyle = '#d9dade'; rr(g, lx - 3.5, -5, 7, 5, 2); g.fill(); });
    slab(g, -25, -40, 48, 26, 11, gray); ball(g, -2, -24, 18, 6, light);
    g.strokeStyle = dark; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-22, -36); g.lineTo(-29, -48); g.stroke();
    g.save(); g.translate(24, -42);
    slab(g, -13, -15, 26, 24, 8, gray); slab(g, 5, -7, 18, 13, 4, light);
    g.fillStyle = white; g.beginPath(); g.moveTo(5, 4); g.lineTo(24, 4); g.lineTo(19, 17); g.lineTo(9, 15); g.fill();
    g.fillRect(-3, -13, 14, 4);
    eye(g, 4, -6, 2.8); g.fillStyle = '#111'; g.beginPath(); g.arc(23, -2, 3.6, 0, 7); g.fill();
    g.fillStyle = '#4e5259'; g.beginPath(); g.moveTo(-11, -12); g.lineTo(-5, -26); g.lineTo(1, -12); g.fill();
    g.fillStyle = '#ff7ab6'; rr(g, -9, 6, 15, 4, 2); g.fill(); ball(g, -1, 13, 3, 3, '#ffd23b');
    g.restore(); g.restore();
    tag(g, 14, 70); shine(g, 32, 48, 8, 3, 0.25);
  }

  /* ---------- fun stuff ---------- */
  function keyRing(g) { g.strokeStyle = metal(g, 38, 62, '#c9ced8'); g.lineWidth = 3.5; g.beginPath(); g.arc(50, 18, 11, 0, 7); g.stroke(); g.strokeStyle = '#9aa1ad'; g.lineWidth = 2.2; for (var i = 0; i < 3; i++) { g.beginPath(); g.ellipse(50, 33 + i * 6, 2.2, 3.6, 0, 0, 7); g.stroke(); } }
  function kcSnake(g) {
    keyRing(g); shadow(g, 50, 92, 26);
    var pts = []; for (var i = 0; i <= 40; i++) { var t = i / 40, a = t * Math.PI * 3.2; pts.push([50 + Math.cos(a) * (22 - t * 12), 66 + Math.sin(a) * (16 - t * 8)]); }
    for (var k = pts.length - 1; k >= 0; k--) ball(g, pts[k][0], pts[k][1], 7 - k * 0.08, 7 - k * 0.08, k % 6 < 3 ? '#4ade80' : '#22c55e');
    var h = pts[0]; ball(g, h[0] + 2, h[1], 9, 8, '#4ade80'); eye(g, h[0] + 5, h[1] - 3, 2.2);
    g.fillStyle = '#ff4fd8'; g.beginPath(); g.moveTo(h[0] + 10, h[1] + 2); g.lineTo(h[0] + 16, h[1]); g.lineTo(h[0] + 16, h[1] + 4); g.fill();
  }
  function joystick(g, cx, by, sc, base, stick, knob, glow) {
    g.save(); g.translate(cx, by); g.scale(sc, sc);
    shadow(g, 0, 2, 36);
    g.fillStyle = dk(base, 0.4); rr(g, -32, -16, 64, 18, 6); g.fill();
    slab(g, -32, -22, 64, 18, 6, base);
    ball(g, -18, -18, 5, 3, '#ff3d5a'); ball(g, 18, -18, 5, 3, '#3ff0ff');
    g.fillStyle = metal(g, -3, 3, stick); g.fillRect(-3, -54, 6, 36);
    ball(g, 0, -20, 9, 3.5, dk(stick, 0.2));
    if (glow) { g.shadowColor = glow; g.shadowBlur = 14; }
    ball(g, 0, -58, 12, 12, knob); g.shadowBlur = 0; shine(g, -4, -63, 4, 2.5, 0.7);
    g.restore();
  }
  function kcJoy(g) { keyRing(g); joystick(g, 50, 88, 0.62, '#7c3aed', '#cfd3dc', '#ff3d5a'); }
  function poster(g, kind) {
    shadow(g, 50, 92, 32);
    g.save(); g.translate(50, 50); g.rotate(-0.06);
    g.fillStyle = '#2a1a10'; rr(g, -33, -42, 66, 84, 3); g.fill();
    var bg = g.createLinearGradient(0, -38, 0, 38);
    if (kind === 'brawl') { bg.addColorStop(0, '#1a0638'); bg.addColorStop(1, '#ff3d6e'); } else { bg.addColorStop(0, '#140a2b'); bg.addColorStop(1, '#3b1a78'); }
    g.fillStyle = bg; g.fillRect(-29, -38, 58, 76);
    if (kind === 'brawl') {
      g.fillStyle = '#ffe14d'; g.font = 'bold 11px "Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.fillText('GROK', 0, -24); g.fillText('BRAWL', 0, -12);
      g.fillStyle = '#ff4a2e'; rr(g, -22, -2, 14, 22, 4); g.fill(); ball(g, -15, -8, 7, 7, '#ffcfa6');
      g.fillStyle = '#ffd400'; rr(g, 8, -2, 14, 22, 4); g.fill(); ball(g, 15, -8, 7, 7, '#ffe0bd');
      star(g, 0, 6, 8, '#fff59a', 8); g.fillStyle = '#fff'; g.font = 'bold 8px sans-serif'; g.fillText('VS', 0, 32);
    } else {
      g.shadowColor = '#3ff0ff'; g.shadowBlur = 8; g.fillStyle = '#3ff0ff'; g.font = 'bold 12px "Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.fillText('GROK', 0, -22);
      g.shadowColor = '#ff4fd8'; g.fillStyle = '#ff4fd8'; g.font = 'bold 10px "Trebuchet MS",sans-serif'; g.fillText('ARCADE', 0, -10); g.shadowBlur = 0;
      g.fillStyle = '#1c1236'; g.fillRect(-11, -2, 22, 34); g.strokeStyle = '#ffe14d'; g.lineWidth = 1.5; g.strokeRect(-11, -2, 22, 34);
      g.fillStyle = '#3ff0ff'; g.fillRect(-8, 2, 16, 12); g.fillStyle = '#ff3d5a'; g.beginPath(); g.arc(-4, 20, 2, 0, 7); g.fill(); g.fillStyle = '#ffe14d'; g.beginPath(); g.arc(4, 20, 2, 0, 7); g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(-29, -38); g.lineTo(0, -38); g.lineTo(-29, 0); g.fill();
    ball(g, -26, -36, 2.6, 2.6, '#ff3d5a'); ball(g, 26, -36, 2.6, 2.6, '#3ff0ff');
    g.restore();
  }
  function cap(g) {
    shadow(g, 50, 88, 36);
    g.save(); g.translate(50, 62);
    var bg2 = g.createLinearGradient(0, -12, 0, 12); bg2.addColorStop(0, lt('#3ff0ff', 0.4)); bg2.addColorStop(1, dk('#3ff0ff', 0.35));
    g.fillStyle = bg2; g.beginPath(); g.ellipse(12, 14, 34, 10, 0.08, 0, 7); g.fill();
    var dg = g.createRadialGradient(-10, -24, 4, 0, -6, 34); dg.addColorStop(0, lt('#ff4fd8', 0.55)); dg.addColorStop(0.5, '#ff4fd8'); dg.addColorStop(1, dk('#ff4fd8', 0.4));
    g.fillStyle = dg; g.beginPath(); g.moveTo(-30, 10); g.bezierCurveTo(-32, -34, 30, -34, 30, 10); g.closePath(); g.fill();
    stitch(g, 0, -24, 0, 9); stitch(g, -16, -18, -18, 9); stitch(g, 16, -18, 18, 9);
    ball(g, 0, -25, 3.5, 2.5, '#ff4fd8');
    g.fillStyle = '#fff'; g.font = 'bold 18px "Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('G', -8, -6);
    shine(g, -14, -16, 7, 3, 0.4);
    g.restore();
  }
  function propeller(g) {
    shadow(g, 50, 88, 32);
    var cols = ['#ff3b4f', '#ffe14d', '#3ba7ff', '#4ade80'];
    g.save(); g.beginPath(); g.moveTo(22, 80); g.bezierCurveTo(20, 30, 80, 30, 78, 80); g.closePath(); g.clip();
    for (var i = 0; i < 4; i++) { g.fillStyle = cols[i]; g.beginPath(); g.moveTo(50, 36); g.lineTo(14 + i * 18, 84); g.lineTo(32 + i * 18, 84); g.closePath(); g.fill(); }
    var sg = g.createRadialGradient(40, 46, 4, 50, 62, 36); sg.addColorStop(0, 'rgba(255,255,255,0.35)'); sg.addColorStop(1, 'rgba(0,0,0,0.35)'); g.fillStyle = sg; g.fillRect(0, 0, 100, 100);
    g.restore();
    g.fillStyle = dk('#3ba7ff', 0.2); rr(g, 20, 76, 60, 8, 4); g.fill();
    g.fillStyle = '#cfd3dc'; g.fillRect(48.5, 22, 3, 16);
    g.save(); g.translate(50, 22); g.rotate(0.15);
    ball(g, -16, 0, 16, 4, '#ff3b4f'); ball(g, 16, 0, 16, 4, '#ffe14d'); ball(g, 0, 0, 3.5, 3.5, '#cfd3dc');
    g.restore();
  }

  /* ---------- models + figures ---------- */
  function standBase(g, col, label) {
    shadow(g, 50, 92, 36);
    g.fillStyle = dk(col, 0.45); rr(g, 16, 80, 68, 10, 4); g.fill();
    slab(g, 16, 76, 68, 9, 4, col);
    if (label) { g.fillStyle = '#ffe14d'; rr(g, 38, 78.5, 24, 5, 1.5); g.fill(); }
  }
  function skyPlane(g) {
    standBase(g, '#2b1a55', true);
    g.fillStyle = metal(g, 47, 53, '#cfd3dc'); g.fillRect(48, 52, 4, 26);
    g.save(); g.translate(54, 44); g.rotate(-0.18); g.scale(0.92, 0.92);
    ball(g, 6, 9, 22, 4, '#64748b', 0.1);
    var fg = g.createLinearGradient(0, -8, 0, 8); fg.addColorStop(0, '#ffffff'); fg.addColorStop(0.6, '#e2e8f0'); fg.addColorStop(1, '#94a3b8');
    g.fillStyle = fg; rr(g, -40, -6.5, 76, 13, 6.5); g.fill();
    g.fillStyle = '#e11d48'; g.beginPath(); g.moveTo(-36, -4); g.lineTo(-44, -24); g.lineTo(-30, -24); g.lineTo(-22, -4); g.fill();
    g.fillStyle = '#fde047'; g.beginPath(); g.moveTo(-41, -18); g.lineTo(-31, -18); g.lineTo(-29, -14); g.lineTo(-39, -14); g.fill();
    g.fillStyle = '#38bdf8'; rr(g, -36, -1, 72, 3, 1.5); g.fill();
    g.fillStyle = '#0ea5e9'; for (var i = 0; i < 9; i++) { g.beginPath(); g.arc(-26 + i * 6, -2.5, 1.3, 0, 7); g.fill(); }
    g.fillStyle = '#1e293b'; g.beginPath(); g.moveTo(31, -3); g.quadraticCurveTo(36, -3, 37, 0); g.lineTo(31, 0); g.fill();
    g.fillStyle = '#94a3b8'; g.beginPath(); g.moveTo(-6, 2); g.lineTo(-20, 22); g.lineTo(-12, 22); g.lineTo(6, 3); g.fill();
    ball(g, -11, 12, 6, 3, '#64748b');
    shine(g, -10, -4, 18, 1.6, 0.6);
    g.restore();
  }
  function gridCar(g) {
    standBase(g, '#1f1f2e', true);
    g.save(); g.translate(51, 62); g.scale(0.92, 0.92);
    function wheel(x) { ball(g, x, 6, 9, 9, '#1a1a1a'); ball(g, x, 6, 4, 4, '#9ca3af'); }
    wheel(-24); wheel(26);
    var bg3 = g.createLinearGradient(0, -12, 0, 8); bg3.addColorStop(0, lt('#f43f5e', 0.45)); bg3.addColorStop(0.5, '#f43f5e'); bg3.addColorStop(1, dk('#f43f5e', 0.4));
    g.fillStyle = bg3; g.beginPath(); g.moveTo(-40, 2); g.lineTo(-34, -8); g.lineTo(-8, -10); g.lineTo(2, -18); g.lineTo(14, -18); g.lineTo(20, -8); g.lineTo(44, -2); g.lineTo(44, 4); g.closePath(); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.moveTo(-2, -12); g.lineTo(4, -18); g.lineTo(12, -18); g.lineTo(16, -12); g.fill();
    g.strokeStyle = '#222'; g.lineWidth = 2; g.beginPath(); g.moveTo(-2, -12); g.quadraticCurveTo(8, -24, 18, -12); g.stroke();
    slab(g, -44, -18, 8, 14, 2, '#f43f5e'); g.fillStyle = '#fff'; g.fillRect(-46, -20, 12, 3);
    g.fillStyle = '#fff'; g.fillRect(36, 2, 12, 3);
    g.fillStyle = '#fff'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillText('1', -18, -1);
    shine(g, -16, -8, 14, 1.4, 0.55);
    g.restore();
  }
  function fcBall(g) {
    shadow(g, 50, 91, 28);
    g.fillStyle = metal(g, 34, 66, '#ffe14d'); g.beginPath(); g.ellipse(50, 84, 18, 5, 0, 0, 7); g.fill();
    ball(g, 50, 52, 30, 30, '#f8fafc');
    g.save(); g.beginPath(); g.arc(50, 52, 30, 0, 7); g.clip();
    g.fillStyle = '#1e1e2a';
    function pent(x, y, r, a) { g.beginPath(); for (var i = 0; i < 5; i++) { var q = a + i * 1.2566; g.lineTo(x + Math.cos(q) * r, y + Math.sin(q) * r); } g.closePath(); g.fill(); }
    pent(50, 50, 9, -1.57); pent(26, 38, 8, 0.3); pent(74, 38, 8, 2.8); pent(32, 74, 8, -0.6); pent(68, 74, 8, 3.7); pent(50, 18, 6, 1.57);
    g.strokeStyle = '#1d4ed8'; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(30, 60); g.bezierCurveTo(36, 52, 38, 66, 44, 58); g.bezierCurveTo(48, 54, 50, 64, 56, 60); g.stroke();
    g.strokeStyle = '#e11d48'; g.beginPath(); g.moveTo(56, 30); g.bezierCurveTo(60, 24, 64, 34, 70, 28); g.stroke();
    var sg = g.createRadialGradient(40, 40, 4, 52, 54, 34); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(0,0,0,0.35)'); g.fillStyle = sg; g.fillRect(0, 0, 100, 100);
    g.restore(); shine(g, 38, 36, 8, 4, 0.6);
  }
  function garyBobble(g) {
    standBase(g, '#8b5a2b', true);
    slab(g, 38, 52, 24, 26, 6, '#14b8a6');
    ball(g, 34, 64, 4, 8, '#14b8a6'); ball(g, 66, 64, 4, 8, '#14b8a6');
    g.fillStyle = '#fff'; g.fillRect(45, 58, 10, 8); g.fillStyle = '#2563eb'; g.fillRect(46, 52, 1.6, 8); g.fillRect(52.4, 52, 1.6, 8);
    g.strokeStyle = '#9ca3af'; g.lineWidth = 1.5; g.beginPath(); for (var i = 0; i < 5; i++) { g.lineTo(i % 2 ? 46 : 54, 52 - i * 1.6); } g.stroke();
    ball(g, 50, 30, 23, 22, '#f1c7a0');
    g.fillStyle = '#6b5a4a'; g.beginPath(); g.ellipse(50, 41, 18, 11, 0, 0, Math.PI); g.fill(); g.beginPath(); g.ellipse(50, 41, 18, 5, 0, Math.PI, 7); g.fill();
    g.fillStyle = '#6b5a4a'; [[40, 9, 0.4], [50, 7, -0.2], [59, 10, -0.6]].forEach(function (t) { g.save(); g.translate(t[0], t[1]); g.rotate(t[2]); rr(g, -5, -4, 10, 10, 3); g.fill(); g.restore(); });
    g.fillStyle = '#c98d6b'; rr(g, 45, 36, 10, 3, 1.5); g.fill();
    [41, 59].forEach(function (x) { g.fillStyle = '#1b1030'; rr(g, x - 7, 23, 14, 10, 2); g.fill(); g.fillStyle = '#bfe9ff'; rr(g, x - 5, 25, 10, 6, 1.5); g.fill(); eye(g, x, 28, 1.6); });
    g.fillStyle = '#1b1030'; g.fillRect(48, 26, 4, 2);
    shine(g, 40, 16, 7, 3, 0.4);
  }
  function landFig(g) {
    shadow(g, 50, 92, 34);
    g.fillStyle = '#8b5a2b'; g.beginPath(); g.moveTo(22, 74); g.lineTo(50, 66); g.lineTo(78, 74); g.lineTo(78, 88); g.lineTo(50, 96); g.lineTo(22, 88); g.closePath(); g.fill();
    g.fillStyle = '#6b4220'; g.beginPath(); g.moveTo(50, 81); g.lineTo(78, 74); g.lineTo(78, 88); g.lineTo(50, 96); g.closePath(); g.fill();
    g.fillStyle = '#4ade80'; g.beginPath(); g.moveTo(22, 74); g.lineTo(50, 66); g.lineTo(78, 74); g.lineTo(50, 82); g.closePath(); g.fill();
    g.fillStyle = '#22c55e'; g.beginPath(); g.moveTo(22, 74); g.lineTo(50, 82); g.lineTo(50, 85); g.lineTo(22, 77); g.fill();
    slab(g, 34, 30, 32, 40, 6, '#f97316');
    g.fillStyle = '#fff'; rr(g, 40, 38, 7, 8, 2); g.fill(); rr(g, 53, 38, 7, 8, 2); g.fill(); g.fillStyle = '#16101f'; g.fillRect(43, 41, 3, 4); g.fillRect(56, 41, 3, 4);
    smile(g, 50, 54, 5);
    ball(g, 28, 46, 5, 8, '#f97316', 0.4); ball(g, 72, 40, 5, 8, '#f97316', -0.8);
    g.save(); g.translate(76, 26); g.rotate(Math.sin(1) * 0.2); g.fillStyle = metal(g, -8, 8, '#facc15'); g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill(); g.fillStyle = '#b45309'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('\u2605', 0, 0.5); g.restore();
    shine(g, 41, 33, 6, 2, 0.4);
  }

  /* ---------- trophies ---------- */
  function trophy(g, col, big) {
    shadow(g, 50, 92, 32);
    var M = metal(g, 26, 74, col);
    g.fillStyle = dk(col, 0.55); rr(g, 28, 80, 44, 10, 3); g.fill();
    g.fillStyle = '#2a1a10'; rr(g, 30, 74, 40, 10, 2); g.fill(); g.fillStyle = metal(g, 38, 62, col); rr(g, 38, 77, 24, 4, 1); g.fill();
    g.fillStyle = M; g.fillRect(44, 58, 12, 16); rr(g, 36, 70, 28, 5, 2); g.fill();
    g.strokeStyle = M; g.lineWidth = 5; g.beginPath(); g.arc(28, 30, 9, Math.PI * 0.5, Math.PI * 1.5); g.stroke(); g.beginPath(); g.arc(72, 30, 9, -Math.PI * 0.5, Math.PI * 0.5); g.stroke();
    g.fillStyle = M; g.beginPath(); g.moveTo(24, 16); g.lineTo(76, 16); g.bezierCurveTo(76, 46, 64, 58, 50, 60); g.bezierCurveTo(36, 58, 24, 46, 24, 16); g.fill();
    g.fillStyle = dk(col, 0.3); g.beginPath(); g.ellipse(50, 16, 26, 4.5, 0, 0, 7); g.fill();
    star(g, 50, 34, 9, lt(col, 0.6)); star(g, 50, 34, 6, dk(col, 0.1));
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.moveTo(30, 20); g.quadraticCurveTo(31, 42, 42, 52); g.quadraticCurveTo(34, 40, 34, 20); g.fill();
    if (big) { sparkle(g, 80, 14, 6); sparkle(g, 18, 46, 4); }
  }
  /* ---------- Grok Dash prizes ---------- */
  var DASHC = { grok: ['#7c4dff', '#ffd23f'], speedy: ['#ff3b3b', '#ffe14d'], floaty: ['#ff6bd6', '#7df9ff'] };
  function plushDash(g, kind) {
    var b = DASHC[kind][0], a = DASHC[kind][1];
    shadow(g, 50, 91, 30);
    ball(g, 36, 85, 11, 6, a); ball(g, 64, 85, 11, 6, a);
    if (kind === 'speedy') { g.fillStyle = dk(b, 0.25); [[-1, 30], [1, 30], [-1, 48], [1, 48]].forEach(function (q) { g.beginPath(); g.moveTo(50 + q[0] * 18, q[1]); g.lineTo(50 + q[0] * 34, q[1] - 10); g.lineTo(50 + q[0] * 22, q[1] + 12); g.fill(); }); }
    if (kind === 'floaty') { ball(g, 34, 20, 7, 17, a, -0.5); ball(g, 66, 20, 7, 17, a, 0.5); }
    ball(g, 50, 52, 26, 26, b);
    ball(g, 50, 62, 15, 11, lt(b, 0.55));
    ball(g, 15, 58, 8, 8, '#ffffff'); ball(g, 85, 58, 8, 8, '#ffffff');
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(42, 45, 7, 9, 0, 0, 7); g.ellipse(58, 45, 7, 9, 0, 0, 7); g.fill();
    eye(g, 43, 46, 4); eye(g, 59, 46, 4);
    blush(g, 34, 56); blush(g, 66, 56); smile(g, 50, 58, 5);
    if (kind === 'grok') { ball(g, 46, 25, 5, 9, a, -0.4); ball(g, 53, 23, 5, 10, a, 0.2); slab(g, 26, 70, 48, 8, 4, a); slab(g, 60, 72, 9, 14, 3, a); }
    if (kind === 'speedy') slab(g, 25, 31, 50, 6, 3, a);
    shine(g, 40, 34, 8, 4, 0.4); tag(g, 66, 76);
  }
  function plushBrutus(g) {
    var tan = '#d6a66a', cream = '#fff4e6', dkT = '#a8773f';
    shadow(g, 50, 91, 34);
    [26, 40, 60, 74].forEach(function (lx) { slab(g, lx - 5, 72, 10, 16, 4, tan); ball(g, lx, 87, 6, 3, cream); });
    ball(g, 50, 70, 32, 17, tan); ball(g, 50, 74, 18, 10, cream);
    ball(g, 32, 28, 8, 7, dkT, -0.6); ball(g, 68, 28, 8, 7, dkT, 0.6);
    ball(g, 50, 44, 26, 23, tan);
    ball(g, 50, 54, 17, 12, cream); ball(g, 38, 56, 8, 7, cream); ball(g, 62, 56, 8, 7, cream);
    ball(g, 50, 47, 6, 4, '#2a1a10'); eye(g, 40, 38, 3.4); eye(g, 60, 38, 3.4);
    g.fillStyle = '#fff'; [[44, 58], [56, 58]].forEach(function (q) { g.beginPath(); g.moveTo(q[0] - 2.5, q[1]); g.lineTo(q[0], q[1] - 6); g.lineTo(q[0] + 2.5, q[1]); g.fill(); });
    slab(g, 28, 62, 44, 6, 3, '#e11d48'); ball(g, 50, 69, 3.5, 3.5, '#ffd23b');
    shine(g, 42, 30, 8, 3, 0.35); tag(g, 70, 76);
  }
  function ringTrophy(g) {
    var gl = g.createRadialGradient(50, 42, 4, 50, 42, 44); gl.addColorStop(0, 'rgba(255,214,64,0.45)'); gl.addColorStop(1, 'rgba(255,214,64,0)'); g.fillStyle = gl; g.fillRect(0, 0, 100, 100);
    shadow(g, 50, 92, 30); slab(g, 24, 78, 52, 12, 3, '#5a3418'); slab(g, 44, 66, 12, 14, 2, '#ffcf3a');
    var gr = g.createLinearGradient(20, 0, 80, 0); gr.addColorStop(0, '#b8860b'); gr.addColorStop(0.3, '#fff3b0'); gr.addColorStop(0.55, '#ffcf3a'); gr.addColorStop(1, '#a0700a');
    g.strokeStyle = gr; g.lineWidth = 11; g.beginPath(); g.ellipse(50, 38, 24, 27, 0, 0, 7); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(50, 38, 24, 27, 0, 3.6, 4.6); g.stroke();
    sparkle(g, 80, 16, 6); sparkle(g, 20, 26, 4); sparkle(g, 82, 58, 4);
  }

  /* ---------- Grok Spooks prizes ---------- */
  function ghostBody(g, col, x, y, s) {
    var gr = g.createRadialGradient(x - 8 * s, y - 14 * s, 2, x, y, 36 * s); gr.addColorStop(0, lt(col, 0.75)); gr.addColorStop(0.5, col); gr.addColorStop(1, dk(col, 0.35));
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - 26 * s, y + 22 * s); g.lineTo(x - 26 * s, y - 4 * s);
    g.bezierCurveTo(x - 26 * s, y - 40 * s, x + 26 * s, y - 40 * s, x + 26 * s, y - 4 * s); g.lineTo(x + 26 * s, y + 22 * s);
    for (var i = 0; i < 4; i++) { var x0 = x + 26 * s - i * 13 * s; g.quadraticCurveTo(x0 - 3 * s, y + 30 * s, x0 - 6.5 * s, y + 22 * s); g.quadraticCurveTo(x0 - 10 * s, y + 14 * s, x0 - 13 * s, y + 22 * s); }
    g.closePath(); g.fill();
  }
  function glowHalo(g, col, a) { var gl = g.createRadialGradient(50, 48, 4, 50, 48, 48); gl.addColorStop(0, 'rgba(' + rgb(col).join(',') + ',' + (a || 0.4) + ')'); gl.addColorStop(1, 'rgba(' + rgb(col).join(',') + ',0)'); g.fillStyle = gl; g.fillRect(0, 0, 100, 100); }
  function plushGoob(g) {
    glowHalo(g, '#5dff8a', 0.35); shadow(g, 50, 92, 28); ghostBody(g, '#5dff8a', 50, 58, 1);
    ball(g, 22, 60, 7, 6, '#5dff8a'); ball(g, 78, 56, 7, 6, '#5dff8a', 0.4);
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(41, 48, 7, 9, 0, 0, 7); g.ellipse(59, 48, 7, 9, 0, 0, 7); g.fill(); eye(g, 42, 49, 4); eye(g, 60, 49, 4);
    g.fillStyle = '#3a1020'; g.beginPath(); g.ellipse(50, 62, 6, 5, 0, 0, 7); g.fill(); g.fillStyle = '#ff6b8a'; g.beginPath(); g.ellipse(50, 64.5, 3.5, 2.2, 0, 0, 7); g.fill();
    blush(g, 33, 58); blush(g, 67, 58); shine(g, 38, 30, 8, 4, 0.45); tag(g, 66, 74);
  }
  function plushBoo(g) {
    glowHalo(g, '#ffffff', 0.35); shadow(g, 50, 92, 30); ball(g, 50, 54, 30, 29, '#f4f2ff');
    ball(g, 30, 30, 6, 9, '#e6e1ff', -0.6); ball(g, 70, 30, 6, 9, '#e6e1ff', 0.6);
    g.fillStyle = '#ff7a9e'; g.beginPath(); g.moveTo(42, 66); g.quadraticCurveTo(50, 76, 58, 66); g.closePath(); g.fill();
    g.fillStyle = '#fff'; [[44, 66], [56, 66]].forEach(function (q) { g.beginPath(); g.moveTo(q[0] - 2, q[1]); g.lineTo(q[0], q[1] + 4); g.lineTo(q[0] + 2, q[1]); g.fill(); });
    ball(g, 36, 48, 11, 9, '#ffffff', 0.3); ball(g, 64, 48, 11, 9, '#ffffff', -0.3);
    blush(g, 28, 60); blush(g, 72, 60); g.fillStyle = '#d0c8ff'; g.beginPath(); g.ellipse(50, 86, 10, 4, 0, 0, 7); g.fill();
    shine(g, 38, 32, 8, 4, 0.5); tag(g, 70, 74);
  }
  function plushWaltzy(g) {
    glowHalo(g, '#ff6bd6', 0.4); shadow(g, 50, 93, 32);
    g.fillStyle = dk('#ff6bd6', 0.15); g.beginPath(); g.moveTo(22, 88); g.quadraticCurveTo(50, 60, 78, 88); g.closePath(); g.fill();
    ghostBody(g, '#ff8fe0', 50, 60, 1.05);
    ball(g, 20, 56, 7, 6, '#ff8fe0', -0.5); ball(g, 80, 52, 7, 6, '#ff8fe0', 0.5);
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(41, 49, 6.5, 8.5, 0, 0, 7); g.ellipse(59, 49, 6.5, 8.5, 0, 0, 7); g.fill(); eye(g, 42, 50, 3.8); eye(g, 60, 50, 3.8);
    g.strokeStyle = '#16101f'; g.lineWidth = 1.5; [[36, 41], [64, 41]].forEach(function (q, i) { g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q[0] + (i ? 4 : -4), q[1] - 3); g.stroke(); });
    smile(g, 50, 63, 6); blush(g, 33, 58); blush(g, 67, 58);
    g.fillStyle = metal(g, 36, 64, '#ffcf3a'); g.beginPath(); g.moveTo(36, 30); g.lineTo(38, 20); g.lineTo(43, 26); g.lineTo(50, 15); g.lineTo(57, 26); g.lineTo(62, 20); g.lineTo(64, 30); g.closePath(); g.fill();
    ball(g, 50, 23, 3, 3, '#3ff0ff'); ball(g, 50, 74, 6, 4, '#ffcf3a');
    sparkle(g, 82, 18, 5); sparkle(g, 18, 26, 3.5); tag(g, 68, 76);
  }
  function vacReplica(g) {
    standBase(g, '#3a2466', true);
    slab(g, 30, 22, 34, 52, 8, '#5b6b8c');
    var gl = g.createLinearGradient(36, 0, 58, 0); gl.addColorStop(0, '#2fbf5a'); gl.addColorStop(0.4, '#9dffb8'); gl.addColorStop(1, '#2fbf5a'); g.fillStyle = gl; rr(g, 36, 30, 22, 30, 6); g.fill();
    ghostBody(g, '#ffffff', 47, 46, 0.25); g.fillStyle = '#16101f'; g.beginPath(); g.arc(45, 44, 1, 0, 7); g.arc(49, 44, 1, 0, 7); g.fill();
    slab(g, 28, 18, 38, 8, 3, '#ffcf3a'); slab(g, 28, 68, 38, 7, 3, '#ffcf3a');
    g.strokeStyle = '#2a2f3a'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(64, 60); g.bezierCurveTo(80, 64, 84, 50, 78, 40); g.stroke();
    slab(g, 72, 24, 12, 20, 4, '#9aa6c0'); ball(g, 78, 22, 7, 4, '#2a2f3a');
    shine(g, 40, 34, 4, 8, 0.4); sparkle(g, 20, 20, 5); sparkle(g, 86, 60, 3.5);
  }
  function kcFlash(g) {
    keyRing(g); g.save(); g.translate(50, 60); g.rotate(-0.35);
    slab(g, -8, -8, 16, 34, 5, '#ff4fd8'); slab(g, -11, -18, 22, 12, 4, '#ffcf3a'); slab(g, -6, 2, 12, 5, 2, '#ffe14d');
    g.restore();
    var gl = g.createRadialGradient(40, 32, 2, 40, 32, 22); gl.addColorStop(0, 'rgba(255,250,200,0.9)'); gl.addColorStop(1, 'rgba(255,250,200,0)'); g.fillStyle = gl; g.beginPath(); g.arc(40, 32, 22, 0, 7); g.fill();
    ghostBody(g, '#7dffb0', 30, 30, 0.32); g.fillStyle = '#16101f'; g.beginPath(); g.arc(28, 28, 1.4, 0, 7); g.arc(33, 28, 1.4, 0, 7); g.fill();
  }
  function gooJar(g) {
    glowHalo(g, '#39ff6a', 0.45); shadow(g, 50, 92, 28);
    g.fillStyle = 'rgba(200,255,220,0.25)'; rr(g, 26, 26, 48, 64, 12); g.fill();
    var gr = g.createLinearGradient(0, 44, 0, 88); gr.addColorStop(0, '#9dffb8'); gr.addColorStop(1, '#1fbf4a'); g.fillStyle = gr; g.beginPath(); g.moveTo(28, 52); g.quadraticCurveTo(38, 44, 50, 52); g.quadraticCurveTo(62, 60, 72, 50); g.lineTo(72, 80); g.quadraticCurveTo(72, 88, 64, 88); g.lineTo(36, 88); g.quadraticCurveTo(28, 88, 28, 80); g.closePath(); g.fill();
    ball(g, 40, 70, 4, 4, '#ccffd9'); ball(g, 58, 64, 3, 3, '#ccffd9'); ball(g, 52, 78, 2.5, 2.5, '#ccffd9');
    eye(g, 44, 66, 3); eye(g, 56, 66, 3);
    slab(g, 24, 18, 52, 12, 4, '#7c4dff'); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(31, 34); g.lineTo(31, 80); g.stroke();
  }
  function lavaLamp(g) {
    shadow(g, 50, 93, 24);
    g.fillStyle = metal(g, 34, 66, '#b8c0d0'); g.beginPath(); g.moveTo(34, 92); g.lineTo(40, 74); g.lineTo(60, 74); g.lineTo(66, 92); g.closePath(); g.fill();
    var gl = g.createLinearGradient(0, 22, 0, 74); gl.addColorStop(0, '#5b21b6'); gl.addColorStop(1, '#a78bfa'); g.fillStyle = gl; g.beginPath(); g.moveTo(44, 20); g.lineTo(56, 20); g.lineTo(64, 74); g.lineTo(36, 74); g.closePath(); g.fill();
    ball(g, 50, 62, 9, 7, '#ff4fd8'); ball(g, 47, 44, 5, 7, '#ff6bd6'); ball(g, 53, 30, 3.5, 4, '#ff8fe0');
    g.fillStyle = metal(g, 42, 58, '#b8c0d0'); g.beginPath(); g.moveTo(42, 22); g.lineTo(46, 10); g.lineTo(54, 10); g.lineTo(58, 22); g.closePath(); g.fill();
    shine(g, 42, 46, 2, 14, 0.35);
  }
  function goldenJoy(g) {
    var gl = g.createRadialGradient(50, 46, 4, 50, 46, 48); gl.addColorStop(0, 'rgba(255,214,64,0.55)'); gl.addColorStop(1, 'rgba(255,214,64,0)'); g.fillStyle = gl; g.fillRect(0, 0, 100, 100);
    joystick(g, 50, 86, 1.05, '#e6a817', '#ffd54a', '#ffcf3a', '#ffe680');
    sparkle(g, 78, 18, 7); sparkle(g, 22, 30, 5); sparkle(g, 84, 54, 4);
  }

  var DRAW = {
    kc_snake: kcSnake, kc_joy: kcJoy, poster_arcade: function (g) { poster(g, 'arcade'); }, poster_brawl: function (g) { poster(g, 'brawl'); }, cap: cap, propeller: propeller,
    pl_luna: function (g) { plushRat(g, 'luna'); }, pl_pirat: function (g) { plushRat(g, 'pirat'); }, pl_snowie: function (g) { plushRat(g, 'snowie'); },
    pl_invader: plushInvader, pl_candy: plushCandy, pl_brutus: plushBrutus, tr_ring: ringTrophy,
    pl_goob: plushGoob, pl_boo: plushBoo, pl_waltzy: plushWaltzy, vac_replica: vacReplica, kc_flash: kcFlash, goo_jar: gooJar, lava_lamp: lavaLamp,
    pl_dash: function (g) { plushDash(g, 'grok'); }, pl_speedy: function (g) { plushDash(g, 'speedy'); }, pl_floaty: function (g) { plushDash(g, 'floaty'); },
    pl_blaze: function (g) { plushFighter(g, 'blaze'); }, pl_volt: function (g) { plushFighter(g, 'volt'); }, pl_boulder: function (g) { plushFighter(g, 'boulder'); },
    pl_nova: function (g) { plushFighter(g, 'nova'); }, pl_frost: function (g) { plushFighter(g, 'frost'); }, pl_sakura: function (g) { plushFighter(g, 'sakura'); }, pl_prime: function (g) { plushFighter(g, 'prime'); },
    fc_ball: fcBall, gary_bobble: garyBobble, land_fig: landFig, sky_plane: skyPlane, grid_car: gridCar,
    tr_bronze: function (g) { trophy(g, '#cd7f32'); }, tr_silver: function (g) { trophy(g, '#c0c7d0'); }, tr_gold: function (g) { trophy(g, '#ffcf3a', true); }, golden_joy: goldenJoy
  };

  var cache = {};
  function icon(id, px, locked) {
    px = Math.round(px || 128); var key = id + ':' + px + ':' + (locked ? 1 : 0);
    if (cache[key]) return cache[key];
    var c = document.createElement('canvas'); c.width = c.height = px; var g = c.getContext('2d');
    g.save(); g.scale(px / 100, px / 100);
    try { (DRAW[id] || function (q) { star(q, 50, 50, 30, '#ffe14d'); })(g); } catch (e) { /* never break the UI over art */ }
    g.restore();
    if (locked) { g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgba(60,40,110,0.85)'; g.fillRect(0, 0, px, px); g.globalCompositeOperation = 'source-over'; }
    cache[key] = c; return c;
  }
  var urls = {};
  function url(id, px, locked) { var k = id + ':' + px + ':' + (locked ? 1 : 0); if (!urls[k]) { try { urls[k] = icon(id, px, locked).toDataURL('image/png'); } catch (e) { urls[k] = ''; } } return urls[k]; }
  GA.PrizeArt = { icon: icon, url: url, draw: function (g, id) { (DRAW[id] || function () {})(g); }, ids: Object.keys(DRAW),
    // extension point (claw machine prizes add their own art)
    register: function (id, fn) { DRAW[id] = fn; GA.PrizeArt.ids = Object.keys(DRAW); },
    H: { ball: ball, slab: slab, rr: rr, shadow: shadow, shine: shine, eye: eye, stitch: stitch, star: star, smile: smile, blush: blush, sparkle: sparkle, tag: tag, lt: lt, dk: dk, mix: mix, metal: metal, rgb: rgb } };
})();
