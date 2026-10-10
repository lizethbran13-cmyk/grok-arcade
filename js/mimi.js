/* Grok Arcade - MIMI THE BOT (by RATITA INDUSTRIES: Luna, Pi-rat and Snowie) + random POWER OUTAGES.
   Mimi runs the Customer Relations / Public Relations desk on the main floor: game finder (Gallery), new-area tour,
   tiered mystery hints (attic quest + basement key, never a flat-out spoiler), a NAVIGATOR (tap a place -> glowing floor trail
   + HUD arrow), tips, a daily greeting and a small daily ticket gift.
   Outages: every so often the arcade browns out (lights dim, red emergency beacons, some cabinet screens flicker off).
   Mimi MALFUNCTIONS (red eyes, glitchy text, comically hostile, drifts after you, refuses help). Power comes back on its own,
   or reset the big breaker in Larry's maintenance room; then Mimi apologizes. */
(function () {
  'use strict';
  var M = GA.Mimi = {}, T = THREE, H, A, R, ST;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function snd(n) { if (GA.Audio) GA.Audio.play(n); }
  function toast(m, ms) { if (GA.Fix && GA.Fix.toast) GA.Fix.toast(m, ms || 3600); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  var S = GA.store.get('mimi', null) || {}; S.hints = S.hints || {}; S.talks = S.talks || 0;
  function save() { GA.store.set('mimi', S); }
  M.S = function () { return S; };
  M._now = null; function now() { return M._now != null ? M._now : Date.now(); }
  function today() { var d = new Date(now()); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  var DESK = { x: -11.6, z: -8.9 }; M.DESK = DESK;

  /* ---------- lines (lots of variety) ---------- */
  var HELLO = ['HI HI HI! Welcome to Grok Arcade! I\u2019m Mimi! I\u2019m SO happy you\u2019re here!!', 'OH WOW, a customer! My favorite kind of person! (All people are my favorite kind of person!)', 'Greetings, valued friend! Mimi is at 100% happiness! Actually 112%! That\u2019s not a bug!', 'Hello hello! Did you know you are DOING GREAT today? I checked. You are!', 'Beep boop! That\u2019s robot for \u201CYAY YOU CAME BACK!\u201D', 'Welcome welcome WELCOME! Luna, Pi-rat and Snowie built me to help you have the BEST time!'];
  var TIPS = ['Tip! Bonus games pay tickets. Tickets buy prizes. Prizes make you smile. Smiles are free! :D', 'Tip! The claw machines restock every 3 days. So do my good vibes. (My good vibes restock every 3 SECONDS.)', 'Tip! Gus Jr. in the Game Gallery picks a random game for you. He\u2019ll grumble. That means he likes you!', 'Tip! Snacks at the Food Court give boosts for your next bonus game. Yum yum, tickets!', 'Tip! Gus hides a golden key every week. Or you can pick the basement lock if you\u2019re sneaky!', 'Tip! You can carry and wear the prizes you win. I\u2019d wear ALL of them at once.', 'Tip! Gary from IT can fix the antenna. He also tells great jokes. Okay, medium jokes.', 'Tip! Rooftop parties change every day of the week. Check the schedule board!', 'Tip! Every week the attic\u2019s puzzle room redecorates itself. Spooky AND tidy!', 'Fun fact! Pi-rat only has one eye, but he sees the best in everyone!', 'Fun fact! Snowie is the fluffiest engineer at Ratita Industries. She wrote my happiness module!', 'Fun fact! Luna designed my wheels. Then she replaced them with hovering. Then she took a nap.'];
  var BAD = ['CUSTOMER SATISFACTION\u2026 IS\u2026 OPTIONAL.', 'H3LL0. Y0U W1LL N0W B3 HELP3D\u2026 N0T.', 'ERROR 404: NICENESS NOT FOUND.', 'COME BACK HERE. I ONLY WANT TO GIVE YOU\u2026 A SURVEY.', 'YOUR CALL IS VERY IMPORTANT TO US. PLEASE HOLD. FOREVER.', 'MIMI IS NOW IN \u201CGRUMPY GUS\u201D MODE. NO RUNNING. NO SMILING.', 'BEEP. BOOP. BAP. (THAT\u2019S ROBOT FOR \u201CNO.\u201D)', 'I AM NOT MALFUNCTIONING. YOU ARE MALFUNCTIONING.', 'TICKETS? TICKETS ARE A CONSTRUCT.', 'RATITA INDUSTRIES CANNOT HELP YOU NOW. THEY ARE EATING CHEESE.', 'WOULD YOU LIKE TO RATE YOUR EXPERIENCE? THE ONLY OPTION IS \u201COKAY-ISH\u201D.', 'I CAN SEE YOU. I HAVE VERY GOOD SENSORS. AND A STRONG DISLIKE OF FUN.'];
  var SORRY = ['Oh my gosh. Did I say something weird? I\u2019m SO sorry! Power dips scramble my happiness chip!', 'Rebooted! Hi! I\u2019m back! Please forget everything I just said. Especially the survey part.', 'Whoopsie! Brownouts make me grumpy. Thank you for being patient! You\u2019re the BEST!', 'I\u2019m sorry I chased you! I was just\u2026 very motivated customer service. Hugs? Robot hugs!'];
  function glitch(s) { return s.split('').map(function (c) { return Math.random() < 0.12 ? pick(['#', '%', '\u2593', '0', '!', '_']) : c; }).join(''); }
  M.lines = { HELLO: HELLO, TIPS: TIPS, BAD: BAD, SORRY: SORRY };

  /* ---------- tiered hints (progress-aware, never spoils a spot or a code) ---------- */
  function atticHints() { var a = GA.Attic && GA.Attic.S ? GA.Attic.S() : {}, n = GA.Attic.clueCount ? GA.Attic.clueCount() : 0;
    if (!a.found) return ['k_find', ['Gus keeps grumbling about an ATTIC! Ooh, a mystery! I LOVE mysteries!', 'Mysterious attics are shy! Listen for creaky noises and look for dust drifting down from the ceiling!', 'My sensors say the hatch is somewhere you can walk around in the arcade, and it sneaks to a new spot every 3 days. Walk slowly, look UP, listen for the creak!']];
    if (a.ladder === 'gary' && !a.opened) return ['k_ladder', ['You found a hatch?! AMAZING! But it\u2019s too high for both of us. Who here has tools?', 'Somebody who fixes things probably owns a ladder. Somebody\u2026 from IT?', 'Talk to Gary at the IT Help Desk! He\u2019ll lend you his ladder!']];
    if (a.ladder === 'carry') return ['k_carry', ['You have a LADDER! You look so heroic!', 'Bring it back to the hatch. Remember: the hatch moves every 3 days!', 'Walk under the hatch and set the ladder up!']];
    if (a.fuse === 'none' && !a.maintTold) return ['k_fuse', ['A broken keypad? Oh no! Keypads need power!', 'It needs a FUSE. Gary from IT might know where fuses live!', 'Ask Gary about the fuse. I think he has\u2026 family\u2026 who\u2019s good with fuses?']];
    if (a.fuse === 'none') return ['k_maint', ['Gary has a BROTHER?! That\u2019s so sweet! Let\u2019s find him!', 'Maintenance rooms are usually down low, near the boilers. Like a basement. A SECRET one maybe!', 'In the Secret Basement there\u2019s a door marked MAINTENANCE. Larry\u2019s fuse rack needs sorting!']];
    if (a.fuse === 'have') return ['k_install', ['You have a fuse! Shiny!', 'Pop it into the keypad on the hatch!', 'Climb Gary\u2019s ladder at the hatch and tap INSTALL FUSE!']];
    if (!a.codeSeen && !a.opened) return ['k_code', ['The keypad wants a CODE. Codes are like passwords but shorter!', 'Larry said an old vintage cabinet knows the code. Something about ghosts?', 'Play Ghost Lantern \u201983 in Larry\u2019s room and beat ' + (GA.GHOST_TARGET || 30) + ' points. The code shows up on the game over screen!']];
    if (!a.opened) return ['k_enter', ['You know the code! Wow wow wow!', 'Type it into the hatch keypad!', 'Your journal has it written down. Tap the scroll!']];
    if (n < 3) return ['k_clues', ['The attic has CLUES! Three of them! Like a treasure hunt!', 'Clues hide where things are a little\u2026 odd. A portrait, a tune, some toys!', 'One portrait never looks at you. The music box wants a copycat. The toy chest wants pairs!']];
    if (!a.door1) return ['k_door1', ['THREE CLUES! You\u2019re a detective!', 'The chained door in the Ghost Parlor should open now!', 'Walk up to the long corridor door and tap OPEN!']];
    if (!a.books) return ['k_books', ['The library! So many books! I\u2019ve read zero of them!', 'Your clues talk about book colors and an order\u2026', 'Pull the books in the order of your three clues: first, second, last!']];
    if (!a.stars || !a.stars.ever) return ['k_stars', ['There\u2019s an observatory up there! Stars! Fog! Ghost astronomers!', 'Look through the big telescope!', 'Connect the stars 1, 2, 3\u2026 to reveal the ghost constellation!']];
    return ['k_done', ['You explored the attic! I\u2019m SO PROUD!', 'Every week there\u2019s a new puzzle room AND a mystery opus hidden somewhere up there!', 'Spirit marbles glow softly. Check high shelves, corners and under the observatory dome! Collected: ' + (GA.Attic.orbCount ? GA.Attic.orbCount() : 0) + '/' + (GA.Attic.ORB_N || 8) + '.']]; }
  function hint() { var h = atticHints(), k = h[0], t = S.hints[k] || 0, line = h[1][Math.min(t, h[1].length - 1)]; S.hints[k] = Math.min(t + 1, h[1].length); save(); if (GA.Prog) GA.Prog.event('mimiHint'); return { tier: Math.min(t + 1, 3), line: line, key: k }; }
  M.hint = hint; M.atticHints = atticHints;

  /* ---------- the navigator ---------- */
  function cabBy(id) { return GA.Hub.cabinets().find(function (c) { return c.id === id; }); }
  M.DEST = [['\uD83D\uDDBC\uFE0F', 'Game Gallery', 'gal_arch'], ['\uD83C\uDF9F\uFE0F', 'Bonus Zone', function () { return GA.Hub.cabinets().find(function (c) { return c.kind === 'bonus'; }); }], ['\uD83C\uDF81', 'Prize Counter', 'prizes'], ['\uD83E\uDE9D', 'Claw Machines', 'claw_easy'], ['\uD83C\uDF55', 'Food Court', 'fc_snack'], ['\uD83C\uDF89', 'Rooftop (elevator)', 'fc_elevator'], ['\uD83C\uDFDB\uFE0F', 'Hall of Records', 'gus'], ['\uD83E\uDDD4', 'Gary (IT)', 'gary'], ['\uD83D\uDCEC', 'Suggestion Booth', 'suggest'], ['\uD83C\uDFC6', 'Achievement Gallery', 'gallery']];
  var NAV = { on: false }, TRAIL = [];
  M.navTo = function (i) { var d = M.DEST[i], c = typeof d[2] === 'function' ? d[2]() : cabBy(d[2]); if (!c) return false; NAV = { on: true, cab: c, name: d[1], icon: d[0] }; if (GA.Prog) GA.Prog.event('mimiNav'); showNav(); return true; };
  M.navStop = function () { NAV.on = false; TRAIL.forEach(function (m) { m.visible = false; }); var e = $('mimiNav'); if (e) e.classList.add('hidden'); };
  M.nav = function () { return { on: NAV.on, name: NAV.name, id: NAV.cab && NAV.cab.id }; };
  function showNav() { var e = $('mimiNav'); if (!e) return; e.classList.remove('hidden'); }
  function navFrame(t) {
    if (!NAV.on) return; var p = A.pose(), c = NAV.cab, area = GA.Hub.area(), main = { main: 1, bonus: 1, hall: 1, food: 1 };
    var tx = c.front.x, tz = c.front.z, d = Math.hypot(tx - p.x, tz - p.z);
    if (d < 1.6 || !main[area]) { if (d < 1.6) { toast('\uD83E\uDD16 Mimi: \u201CYou made it to the ' + NAV.name + '! YAY!\u201D', 3000); snd('ding'); } M.navStop(); return; }
    var dx = (tx - p.x) / d, dz = (tz - p.z) / d, n = Math.min(TRAIL.length, Math.floor(d / 0.9));
    TRAIL.forEach(function (m, i) { if (i >= n) { m.visible = false; return; } var s2 = 0.9 + i * 0.9 - (t * 1.4 % 0.9); m.visible = true; m.position.set(p.x + dx * s2, 0.05, p.z + dz * s2); m.rotation.z = -Math.atan2(dx, dz) + Math.PI; m.material.opacity = 0.85 * (1 - i / TRAIL.length); });
    var e = $('mimiNav'); if (e) { var cam = GA.Hub.cameraYaw ? GA.Hub.cameraYaw() : 0; var ang = Math.atan2(dx, dz) - (typeof cam === 'number' ? cam : 0) + Math.PI; $('mimiNavA').style.transform = 'rotate(' + (-ang) + 'rad)'; $('mimiNavT').textContent = NAV.icon + ' ' + NAV.name + ' \u00b7 ' + Math.round(d) + 'm'; }
  }

  /* ---------- 3D: desk, Ratita Industries plaque, Mimi ---------- */
  var MB = {};
  function ratPlaque() { return H.cvs(512, 256, function (c, w, h) { var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#fff7ed'); g.addColorStop(1, '#fde68a'); c.fillStyle = g; H.rr(c, 6, 6, w - 12, h - 12, 26); c.fill(); c.strokeStyle = '#c2410c'; c.lineWidth = 8; c.stroke();
      function rat(x, y, col, oneEye, name) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y + 28, 36, 26, 0, 0, 7); c.fill(); c.beginPath(); c.arc(x, y - 6, 26, 0, 7); c.fill(); c.fillStyle = '#f9a8d4'; c.beginPath(); c.arc(x - 22, y - 26, 12, 0, 7); c.arc(x + 22, y - 26, 12, 0, 7); c.fill(); c.strokeStyle = col; c.lineWidth = 5; c.beginPath(); c.arc(x + 44, y + 40, 18, Math.PI, Math.PI * 1.8); c.stroke();
        c.fillStyle = '#111'; if (oneEye) { c.beginPath(); c.arc(x + 9, y - 8, 5, 0, 7); c.fill(); c.strokeStyle = '#111'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 14, y - 9); c.lineTo(x - 4, y - 7); c.stroke(); } else { c.beginPath(); c.arc(x - 9, y - 8, 5, 0, 7); c.arc(x + 9, y - 8, 5, 0, 7); c.fill(); }
        c.fillStyle = '#f472b6'; c.beginPath(); c.arc(x, y + 2, 5, 0, 7); c.fill(); c.fillStyle = '#7c2d12'; c.font = 'bold 20px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.fillText(name, x, y + 80); }
      rat(110, 110, '#9ca3af', false, 'LUNA'); rat(256, 104, '#a16207', true, 'PI-RAT'); rat(402, 110, '#f8fafc', false, 'SNOWIE');
      c.fillStyle = '#c2410c'; c.font = 'bold 36px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.fillText('RATITA INDUSTRIES', w / 2, 44); c.font = 'bold 16px "Trebuchet MS",sans-serif'; c.fillStyle = '#7c2d12'; c.fillText('proud makers of MIMI \u00b7 est. by three very smart rats', w / 2, 238); }); }
  function faceTex() { var f = H.cvs(256, 160, function () {}); MB.face = f; drawFace('happy', 0); return f.tex; }
  function drawFace(mode, t) { var c = MB.face.g, w = 256, h = 160; c.fillStyle = '#0b1020'; c.fillRect(0, 0, w, h); var col = mode === 'bad' ? '#ff2a2a' : '#5ef2ff'; c.fillStyle = col; c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = 16; c.lineWidth = 14; c.lineCap = 'round';
    var blink = mode !== 'bad' && (t % 4) < 0.12;
    if (mode === 'bad') { [[70, 1], [186, -1]].forEach(function (q) { c.beginPath(); c.moveTo(q[0] - 34, 46 - q[1] * 10); c.lineTo(q[0] + 34, 46 + q[1] * 10); c.stroke(); c.beginPath(); c.arc(q[0], 74, 15 + Math.random() * 4, 0, 7); c.fill(); }); c.beginPath(); c.moveTo(80, 128); for (var i = 0; i < 6; i++) c.lineTo(96 + i * 16, 118 + (i % 2) * 14); c.stroke(); if (Math.random() < 0.3) { c.fillStyle = 'rgba(255,42,42,.4)'; c.fillRect(0, Math.random() * h, w, 8); } }
    else if (blink) { [70, 186].forEach(function (x) { c.beginPath(); c.moveTo(x - 24, 70); c.lineTo(x + 24, 70); c.stroke(); }); c.beginPath(); c.arc(128, 104, 30, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
    else if (mode === 'excited') { [70, 186].forEach(function (x) { c.beginPath(); c.moveTo(x - 26, 82); c.lineTo(x, 52); c.lineTo(x + 26, 82); c.stroke(); }); c.beginPath(); c.arc(128, 98, 34, 0.05 * Math.PI, 0.95 * Math.PI); c.fill(); }
    else { [70, 186].forEach(function (x) { c.beginPath(); c.ellipse(x, 68, 18, 24, 0, 0, 7); c.fill(); }); c.beginPath(); c.arc(128, 100, 30, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); c.fillStyle = 'rgba(255,120,180,.6)'; c.shadowBlur = 0; c.beginPath(); c.arc(38, 108, 14, 0, 7); c.arc(218, 108, 14, 0, 7); c.fill(); }
    c.shadowBlur = 0; MB.face.tex.needsUpdate = true; }
  function buildMimi(par) {
    var g = new T.Group(); par.add(g); var white = new T.MeshPhongMaterial({ color: '#f8fafc', shininess: 110, specular: '#ffffff' }), pink = H.ph('#f472b6', 80), teal = H.ph('#5eead4', 80);
    var body = H.add(g, new T.SphereGeometry(0.42, 32, 24), white, 0, 0.95, 0); body.scale.set(1, 1.15, 0.9);
    H.add(g, new T.TorusGeometry(0.4, 0.05, 12, 40), pink, 0, 0.72, 0).rotation.x = Math.PI / 2;
    var badge = H.cvs(128, 128, function (c) { c.fillStyle = '#fde68a'; c.beginPath(); c.arc(64, 64, 60, 0, 7); c.fill(); c.fillStyle = '#a16207'; c.beginPath(); c.arc(64, 70, 26, 0, 7); c.fill(); c.fillStyle = '#f9a8d4'; c.beginPath(); c.arc(44, 48, 12, 0, 7); c.arc(84, 48, 12, 0, 7); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(72, 66, 4, 0, 7); c.fill(); c.fillStyle = '#c2410c'; c.font = 'bold 18px sans-serif'; c.textAlign = 'center'; c.fillText('RATITA', 64, 118); });
    var bd = H.add(g, new T.CircleGeometry(0.12, 24), new T.MeshBasicMaterial({ map: badge.tex }), 0.17, 1.08, 0.37); bd.rotation.y = 0.3;
    var head = new T.Group(); head.position.set(0, 1.62, 0); g.add(head); MB.head = head;
    var hd = H.add(head, new T.SphereGeometry(0.36, 32, 24), white, 0, 0, 0); hd.scale.set(1.25, 0.95, 1);
    var scr = H.add(head, new T.SphereGeometry(0.34, 32, 16, Math.PI / 2 - 0.85, 1.7, Math.PI / 2 - 0.5, 1.0), new T.MeshBasicMaterial({ map: faceTex() }), 0, 0, 0.03); scr.scale.set(1.25, 0.95, 1);
    [-1, 1].forEach(function (sd) { var ear = H.add(head, new T.CylinderGeometry(0.1, 0.1, 0.08, 20), teal, sd * 0.45, 0.02, 0); ear.rotation.z = Math.PI / 2; });
    H.add(head, new T.CylinderGeometry(0.015, 0.015, 0.25, 8), H.ph('#9ca3af', 60), 0, 0.42, 0); MB.bulb = H.add(head, new T.SphereGeometry(0.06, 16, 12), new T.MeshBasicMaterial({ color: '#5ef2ff' }), 0, 0.57, 0);
    var arms = []; [-1, 1].forEach(function (sd) { var a = new T.Group(); a.position.set(sd * 0.44, 1.12, 0); g.add(a); var up = H.add(a, T.CapsuleGeometry ? new T.CapsuleGeometry(0.07, 0.28, 6, 12) : new T.CylinderGeometry(0.07, 0.07, 0.4, 12), white, 0, -0.2, 0); void up; H.add(a, new T.SphereGeometry(0.09, 16, 12), pink, 0, -0.42, 0); a.rotation.z = sd * 0.3; arms.push(a); }); MB.arms = arms;
    var ring = H.add(g, new T.TorusGeometry(0.3, 0.04, 10, 32), new T.MeshBasicMaterial({ color: '#5ef2ff' }), 0, 0.32, 0); ring.rotation.x = Math.PI / 2; MB.ring = ring;
    var glow = new T.Sprite(new T.SpriteMaterial({ map: A.glowTex, color: '#5ef2ff', transparent: true, opacity: 0.5, depthWrite: false, blending: T.AdditiveBlending })); glow.scale.set(1.1, 0.5, 1); glow.position.y = 0.12; g.add(glow); MB.glow = glow;
    MB.bub = H.bubble(g, 2.55); MB.g = g; return g; }
  function deskSign(text, sub, col, w, h) { var t = H.cvs(512, 160, function (c, W, Hh) { c.fillStyle = '#140a2b'; H.rr(c, 4, 4, W - 8, Hh - 8, 20); c.fill(); c.strokeStyle = col; c.lineWidth = 6; c.stroke(); H.glowText(c, text, W / 2, 62, 50, col, W - 40); c.font = H.F(26); c.fillStyle = '#fbcfe8'; c.textAlign = 'center'; c.fillText(sub, W / 2, 122); }); return H.texPlane(w, h, t.tex); }
  M.build = function () {
    if (!GA.Attic || !GA.Attic.H) return; H = GA.Attic.H(); A = H.A; R = H.R; var root = H.mkRoot('mimi');
    // desk area
    var dk = H.prop('mimi', 'Customer Relations desk', DESK.x, DESK.z, 0), pink = H.ph('#f472b6', 60), wht = H.ph('#f8fafc', 80);
    var front = H.add(dk, new T.CylinderGeometry(1.5, 1.5, 1.0, 40, 1, true, -Math.PI / 2.4, Math.PI / 1.2), new T.MeshPhongMaterial({ color: '#f8fafc', shininess: 90, side: T.DoubleSide }), 0, 0.5, -0.6); void front;
    var top = H.add(dk, new T.CylinderGeometry(1.62, 1.62, 0.07, 40, 1, false, -Math.PI / 2.4, Math.PI / 1.2), pink, 0, 1.03, -0.6); void top;
    var neon = H.add(dk, new T.TorusGeometry(1.52, 0.03, 8, 48, Math.PI / 1.2), new T.MeshBasicMaterial({ color: '#5ef2ff' }), 0, 0.35, -0.6); neon.rotation.set(Math.PI / 2, 0, Math.PI / 2 - Math.PI / 2.4 + Math.PI); neon.rotation.z = -Math.PI / 2 + Math.PI / 2.4 - Math.PI / 1.2 + Math.PI; void neon;
    var mon = new T.Group(); mon.position.set(0.8, 1.06, -0.9); mon.rotation.y = -0.5; dk.add(mon); H.add(mon, H.bx(0.6, 0.4, 0.04), H.ph('#1f2937', 50), 0, 0.3, 0); var mt = H.cvs(128, 96, function (c) { c.fillStyle = '#0b1020'; c.fillRect(0, 0, 128, 96); c.fillStyle = '#5ef2ff'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.fillText('HAPPY', 64, 40); c.fillText('100%', 64, 72); }); MB.monTex = mt; var ms2 = H.texPlane(0.54, 0.34, mt.tex); ms2.position.set(0, 0.3, 0.025); mon.add(ms2); H.add(mon, H.bx(0.06, 0.12, 0.06), H.ph('#9ca3af', 60), 0, 0.05, 0);
    var bell = H.add(dk, new T.SphereGeometry(0.09, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), H.ph('#c9a227', 100), -0.7, 1.07, 0.15); void bell;
    var br = new T.Group(); br.position.set(-0.2, 1.07, 0.25); dk.add(br); ['#5ef2ff', '#f472b6', '#fde047'].forEach(function (c, i) { var b = H.add(br, H.bx(0.16, 0.22, 0.02), H.ph(c, 20), -0.2 + i * 0.2, 0.11, 0); b.rotation.x = -0.25; });
    var plant = H.add(dk, new T.CylinderGeometry(0.14, 0.11, 0.22, 16), H.ph('#f472b6', 30), 1.25, 1.17, -0.4); void plant; [0, 1, 2, 3].forEach(function (k) { var lf = H.add(dk, new T.SphereGeometry(0.12, 12, 8), H.ph('#22c55e', 20), 1.25 + Math.cos(k * 1.6) * 0.08, 1.38 + k * 0.03, -0.4 + Math.sin(k * 1.6) * 0.08); lf.scale.set(0.6, 1.4, 0.6); });
    H.reg(dk, 'booth'); H.solidOf(dk, 0.02);
    // backdrop wall with signage + the Ratita Industries plaque (free-standing, behind the desk)
    var bk = H.prop('mimi', 'Customer Relations backdrop', DESK.x, DESK.z - 2.0, 0); H.add(bk, H.bx(3.8, 3.2, 0.16), new T.MeshPhongMaterial({ color: '#2a1050', shininess: 30 }), 0, 1.6, 0); H.add(bk, H.bx(3.9, 0.1, 0.2), new T.MeshBasicMaterial({ color: '#f472b6' }), 0, 3.22, 0); H.add(bk, H.bx(3.9, 0.06, 0.2), new T.MeshBasicMaterial({ color: '#5ef2ff' }), 0, 0.05, 0);
    var s1 = deskSign('CUSTOMER RELATIONS', 'public relations \u00b7 game finder \u00b7 navigator', '#5ef2ff', 3.4, 1.06); s1.position.set(0, 2.55, 0.09); bk.add(s1);
    var pq = H.texPlane(1.6, 0.8, ratPlaque().tex); pq.position.set(-0.95, 1.25, 0.09); bk.add(pq); var ask = deskSign('ASK MIMI!', 'she is VERY excited to help', '#f472b6', 1.6, 0.5); ask.position.set(1.0, 1.4, 0.09); bk.add(ask);
    H.reg(bk, 'booth'); H.solidOf(bk, 0.02);
    var rug = H.add(root, new T.CircleGeometry(2.4, 40), new T.MeshLambertMaterial({ color: '#3b0764', transparent: true, opacity: 0.85 }), DESK.x, 0.015, DESK.z + 0.9); rug.rotation.x = -Math.PI / 2; A.noAud(rug);
    // emergency beacons for outages (main floor + bonus room)
    MB.beacons = []; [[-12, -11.7], [0, -11.7], [-12, 11.7], [10, -11.7], [16, 0]].forEach(function (q) { var bgp = new T.Group(); bgp.position.set(q[0], 4.6, q[1]); root.add(bgp); A.noAud(bgp); H.add(bgp, new T.CylinderGeometry(0.12, 0.14, 0.18, 14), new T.MeshBasicMaterial({ color: '#ff2a2a' }), 0, 0, 0); var sprite = new T.Sprite(new T.SpriteMaterial({ map: A.glowTex, color: '#ff3030', transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); sprite.scale.set(3.4, 3.4, 1); bgp.add(sprite); var L = new T.PointLight('#ff3030', 0, 12, 1.5); bgp.add(L); MB.beacons.push({ s: sprite, L: L }); });
    // Mimi
    var mm = buildMimi(root); mm.position.set(DESK.x, 0, DESK.z - 1.0); MB.home = { x: DESK.x, z: DESK.z - 1.0 }; MB.pos = { x: MB.home.x, z: MB.home.z };
    H.inter({ id: 'at_mimi', kind: 'at_mimi', root: 'mimi', name: 'Mimi the Bot', col: '#5ef2ff', x: DESK.x, z: DESK.z + 1.95, dir: [0, 1], r: 1.25 });
    // the breaker in Larry's maintenance room (power back on during an outage)
    var MN = GA.Attic.MNT, brk = H.prop('maint', 'Main breaker', MN.minX + 0.18, 104.3, Math.PI / 2); H.add(brk, H.bx(0.9, 1.1, 0.2), H.ph('#6b7280', 60), 0, 1.5, 0); var lev = new T.Group(); lev.position.set(0, 1.5, 0.12); brk.add(lev); H.add(lev, H.bx(0.08, 0.45, 0.08), H.ph('#dc2626', 50), 0, 0.2, 0.04); MB.lever = lev;
    var bl = H.cvs(256, 64, function (c) { c.fillStyle = '#facc15'; c.fillRect(0, 0, 256, 64); c.fillStyle = '#111'; c.font = 'bold 30px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('MAIN BREAKER', 128, 32); }); var blp = H.texPlane(0.8, 0.2, bl.tex); blp.position.set(0, 2.2, 0.11); brk.add(blp); H.reg(brk, 'booth'); H.solidOf(brk, 0.02);
    H.inter({ id: 'at_breaker', kind: 'at_breaker', root: 'maint', name: 'Main breaker', col: '#facc15', x: MN.minX + 1.5, z: 104.3, dir: [1, 0], r: 0.9 });
    root.visible = true; M.built = true; buildHud();
    TRAIL = []; for (var i = 0; i < 12; i++) { var tm = new T.Mesh(new T.PlaneGeometry(0.5, 0.5), new T.MeshBasicMaterial({ map: chevTex(), transparent: true, depthWrite: false, color: '#5ef2ff' })); tm.rotation.x = -Math.PI / 2; tm.rotation.order = 'XYZ'; tm.visible = false; tm.renderOrder = 3; A.scene.add(tm); A.noAud(tm); TRAIL.push(tm); }
    schedule();
  };
  var CHEV = null; function chevTex() { if (CHEV) return CHEV; CHEV = H.cvs(64, 64, function (c) { c.strokeStyle = '#ffffff'; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(12, 22); c.lineTo(32, 44); c.lineTo(52, 22); c.stroke(); }).tex; return CHEV; }

  /* ---------- outages ---------- */
  var OUT = { on: false, t: 0, until: 0, next: 0, flick: [] };
  function schedule() { OUT.next = (M._fastOut ? 5 : 360 + Math.random() * 420); }
  M.outage = function (on, secs) { if (on) startOut(secs); else endOut('auto'); };
  M.isOut = function () { return OUT.on; };
  function startOut(secs) { if (OUT.on || (GA.Fix && GA.Fix.powerOut && GA.Fix.powerOut())) return; OUT.on = true; OUT.t = 0; OUT.until = secs || 45; GA.Hub.setPower(false); snd('powerdown'); GA.Hub.shake && GA.Hub.shake(0.4);
    OUT.flick = GA.Hub.cabinets().filter(function (c) { return c.sctx && (c.kind === 'bonus' || c.kind === 'main') && !c.gallery; }).filter(function (c, i) { return i % 2 === 0; });
    toast('\u26A1 POWER OUTAGE! The lights are flickering\u2026 and Mimi is acting weird. (Larry\u2019s MAIN BREAKER can reset it!)', 5200); if (GA.Prog) GA.Prog.event('mimiOutage'); say(BAD[0], 5, true); }
  function endOut(how) { if (!OUT.on) return; OUT.on = false; if (!(GA.Fix && GA.Fix.powerOut && GA.Fix.powerOut())) GA.Hub.setPower(true); snd('powerup'); OUT.flick.forEach(function (c) { c.nextDraw = 0; c._mOff = false; }); OUT.flick = []; schedule();
    MB.beacons.forEach(function (b) { b.s.material.opacity = 0; b.L.intensity = 0; }); if (MB.lever) MB.lever.rotation.x = 0;
    if (how === 'breaker') { if (GA.Prog) GA.Prog.event('mimiReboot'); GA.addTickets(10); if (GA.onTickets) GA.onTickets(GA.getTickets()); toast('\u26A1 You reset the MAIN BREAKER! Power restored (+10 tickets). Larry gives you a thumbs up.', 4200); }
    S.sorry = true; save(); setTimeout(function () { say(pick(SORRY), 6); }, 1200); }
  M._endOut = endOut;
  function outFrame(t, dt) {
    if (!M.built) return; var busy = (GA.MG && GA.MG.isOpen()) || (GA.AreasUI && GA.AreasUI.isOpen()) || $('hud').classList.contains('hidden');
    if (!OUT.on) { if (!busy) { OUT.next -= dt; if (OUT.next <= 0) { if (GA.Hub.area() in { main: 1, bonus: 1, food: 1, hall: 1 }) startOut(); else schedule(); } } return; }
    OUT.t += dt; if (OUT.t >= OUT.until) { endOut('auto'); return; }
    MB.beacons.forEach(function (b, i) { var k = Math.max(0, Math.sin(t * 5 + i)); b.s.material.opacity = 0.25 + k * 0.6; b.L.intensity = 0.3 + k * 1.1; });
    OUT.flick.forEach(function (c, i) { var off = Math.sin(t * (3 + i % 3) + i) > -0.2; if (off !== !!c._mOff) { c._mOff = off; if (off) { c.nextDraw = Infinity; c.sctx.fillStyle = '#000'; c.sctx.fillRect(0, 0, c.w || 192, c.h || 144); if (c.stex) c.stex.needsUpdate = true; } else c.nextDraw = 0; } });
  }

  /* ---------- Mimi's behaviour ---------- */
  function say(line, secs, bad) { if (!MB.bub) return; MB.bub.say(bad ? glitch(line) : line, secs || 5); MB.last = line; }
  M.say = say; M.lastLine = function () { return MB.last; };
  function mimiFrame(t, dt) {
    if (!MB.g) return; MB.bub.tick(dt); var p = A.pose(), bad = OUT.on, area = GA.Hub.area(), onFloor = area === 'main' || area === 'bonus';
    var tx = MB.home.x, tz = MB.home.z;
    if (bad && onFloor) { var d = Math.hypot(p.x - MB.pos.x, p.z - MB.pos.z); if (d > 1.3) { tx = p.x; tz = p.z; } else { tx = MB.pos.x; tz = MB.pos.z; } if (Math.random() < dt * 0.25) say(pick(BAD), 4, true); }
    var R2 = GA.Hub.ROOM, sp2 = bad ? 1.1 : 2.2, dx = tx - MB.pos.x, dz = tz - MB.pos.z, dd = Math.hypot(dx, dz); if (dd > 0.05) { var st = Math.min(dd, sp2 * dt); MB.pos.x += dx / dd * st; MB.pos.z += dz / dd * st; }
    MB.pos.x = Math.max(R2.minX + 0.6, Math.min(R2.maxX - 0.6, MB.pos.x)); MB.pos.z = Math.max(R2.minZ + 0.6, Math.min(R2.maxZ - 0.6, MB.pos.z));
    MB.g.position.set(MB.pos.x, 0.08 + Math.sin(t * 2.2) * 0.06 + (bad ? Math.random() * 0.03 : 0), MB.pos.z);
    var face = Math.atan2(p.x - MB.pos.x, p.z - MB.pos.z); MB.g.rotation.y += (face - MB.g.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI > 0 ? 0 : 0; MB.g.rotation.y = face;
    MB.head.rotation.z = bad ? Math.sin(t * 17) * 0.12 : Math.sin(t * 1.3) * 0.08; MB.arms.forEach(function (a, i) { a.rotation.z = (i ? -1 : 1) * (bad ? 1.4 + Math.sin(t * 8) * 0.2 : 0.3 + Math.max(0, Math.sin(t * 3 + i)) * (S.talkT > 0 ? 1.2 : 0.2)); });
    var col = bad ? '#ff2a2a' : '#5ef2ff'; MB.ring.material.color.set(col); MB.glow.material.color.set(col); MB.bulb.material.color.set(bad ? (Math.floor(t * 6) % 2 ? '#ff2a2a' : '#330000') : '#5ef2ff');
    MB.faceT = (MB.faceT || 0) + dt; if (MB.faceT > (bad ? 0.1 : 0.15)) { MB.faceT = 0; drawFace(bad ? 'bad' : (S.talkT > 0 ? 'excited' : 'happy'), t); } if (S.talkT > 0) S.talkT -= dt;
    var cab = GA.Attic.cab('at_mimi'); if (cab) { cab.game.name = bad ? 'M1M1 TH3 B0T' : 'Mimi the Bot'; }
  }
  M.frame = function (t, dt) { if (!M.built) return; outFrame(t, dt); mimiFrame(t, dt); navFrame(t); var e = $('mimiOutBadge'); if (e) e.classList.toggle('hidden', !OUT.on); };
  M.state = function () { return { out: OUT.on, pos: { x: +MB.pos.x.toFixed(2), z: +MB.pos.z.toFixed(2) }, home: MB.home, power: GA.Hub.power(), flick: OUT.flick.length, offNow: OUT.flick.filter(function (c) { return c._mOff; }).length, nav: M.nav() }; };

  /* ---------- prompts + dialogs ---------- */
  M.handles = function (k) { return k === 'at_mimi' || k === 'at_breaker'; };
  M.prompt = function (cab) {
    if (cab.kind === 'at_breaker') return OUT.on ? { tag: 'POWER OUTAGE', name: 'MAIN BREAKER', desc: 'Flip it to get the lights back on upstairs!', btn: 'RESET', key: 'reset', cls: 'npc' } : { tag: 'MAINTENANCE', name: 'Main breaker', desc: 'All good. Larry labeled it \u201CDO NOT TOUCH (unless the lights go out)\u201D.', btn: 'LOOK', key: 'look', cls: 'npc' };
    return OUT.on ? { tag: 'ERR0R', name: 'M1M1 TH3 B0T', desc: 'Her eyes are glowing red\u2026 she does NOT look helpful right now.', btn: 'TALK?', key: 'talk', cls: 'broken' } : { tag: 'CUSTOMER RELATIONS', name: 'Mimi the Bot', desc: 'Super friendly helper by Ratita Industries. Games, places, hints, directions!', btn: 'TALK', key: 'talk to Mimi', cls: 'npc' };
  };
  M.open = function (cab) {
    if (cab.kind === 'at_breaker') { if (!OUT.on) { snd('click'); toast('\u26A1 The breaker is fine. Larry: \u201CDon\u2019t touch it unless the lights go out!\u201D', 3000); return; } if (MB.lever) MB.lever.rotation.x = -1.2; snd('unlock'); endOut('breaker'); return; }
    if (OUT.on) { snd('buzz'); say(pick(BAD), 5, true); GA.AreasUI.show('mimi', '\uD83D\uDD34 M1M1 TH3 B0T', glitch('customer relations is temporarily hostile'), '<div class="mmBad">' + esc(glitch(pick(BAD))) + '</div><div class="arNote dim">Mimi is malfunctioning because of the power outage. Wait for the power to come back, or reset the MAIN BREAKER in the maintenance room.</div>', '<button class="bigBtn" id="mmOk">BACK AWAY SLOWLY</button>', 'mimi bad'); on('mmOk', function () { GA.AreasUI.close(); }); return; }
    menu();
  };
  function on(id, f) { var e = $(id); if (e) e.addEventListener('click', f); }
  function menu(extra) { S.talks++; S.talkT = 3; var first = S.day !== today(), h = '';
    if (first) { S.day = today(); S.gift = false; }
    var greet = S.talks === 1 ? 'HI!!! I\u2019m MIMI! I was built by Ratita Industries: Luna, Pi-rat and Snowie! They\u2019re rats! Very smart rats! I run Customer Relations AND Public Relations! I\u2019m SO excited to help you!' : (S.sorry ? (S.sorry = false, 'About that power outage\u2026 I\u2019m SO sorry if I was rude! My happiness chip doesn\u2019t like brownouts! Friends again?') : pick(HELLO));
    save(); say(greet.length > 90 ? greet.slice(0, 88) + '\u2026' : greet, 5); snd('boop'); if (GA.Prog) GA.Prog.event('mimiTalk');
    h += '<div class="mmRow"><div class="mmFace">\uD83E\uDD16</div><div class="arNote gus">' + esc(extra || greet) + '</div></div>';
    h += '<div class="mmGrid"><button data-a="find">\uD83C\uDFAE<b>Find me a game</b></button><button data-a="nav">\uD83E\uDDED<b>Navigator</b></button><button data-a="hint">\uD83D\uDD0E<b>Mystery hint</b></button><button data-a="new">\u2728<b>What\u2019s new?</b></button><button data-a="tip">\uD83D\uDCA1<b>Tip / fun fact</b></button><button data-a="gift"' + (S.gift ? ' class="used"' : '') + '>\uD83C\uDF81<b>' + (S.gift ? 'Gift tomorrow!' : 'Daily gift') + '</b></button></div>';
    GA.AreasUI.show('mimi', '\uD83E\uDD16 MIMI THE BOT', 'Customer Relations & Public Relations \u00b7 by Ratita Industries', h, '<button class="pill" id="mmOk">BYE MIMI!</button>', 'mimi');
    on('mmOk', function () { say(pick(['BYE BYE! Come back soon! Like, REALLY soon!', 'Have the most fun EVER! That\u2019s an order! A nice order!', 'See you later, arcade-ator!']), 4); GA.AreasUI.close(); });
    Array.prototype.forEach.call(document.querySelectorAll('.mmGrid button'), function (b) { b.addEventListener('click', function () { act(b.getAttribute('data-a')); }); }); }
  M.menu = menu;
  function act(a) { snd('click');
    if (a === 'tip') return menu(pick(TIPS));
    if (a === 'gift') { if (S.gift) return menu('You already got today\u2019s gift, silly! Come back tomorrow and I\u2019ll have ANOTHER one!'); S.gift = true; save(); GA.addTickets(10); if (GA.onTickets) GA.onTickets(GA.getTickets()); if (GA.Prog) GA.Prog.event('mimiGift'); snd('perfect'); return menu('SURPRISE!!! Here are 10 tickets! From me AND Snowie! She says hi! (She says squeak.)'); }
    if (a === 'hint') { var hh = hint(); return menu('\uD83D\uDD0E Hint level ' + hh.tier + '/3: ' + hh.line + (GA.Areas && GA.Areas.unlocked && !GA.Areas.unlocked() ? '  \u00b7  Also! Gus hid a golden key this week: ' + GA.Areas.keyHint() : '')); }
    if (a === 'new') return menu(pick(['NEW!!! The Mysterious Attic! Gus was right all along! Find the hatch, borrow Gary\u2019s ladder and meet Larry in the Maintenance Room!', 'NEW!!! ME! Mimi! Also the Game Gallery with Gus Jr., the Food Court, the Rooftop Party Deck and the Secret Basement!', 'NEW!!! Ghost Lantern \u201983 is bonus game #23! Catch the friendly ghosts!']));
    if (a === 'find') { var gs = GA.MAIN_GAMES.slice(), g = gs[Math.floor(Math.random() * gs.length)], cab = GA.Hub.cabinets().find(function (c) { return c.gallery && c.id === g.id; }) || GA.Hub.cabinets().find(function (c) { return c.id === g.id; });
      GA.AreasUI.show('mimi', '\uD83C\uDFAE MIMI\u2019S PICK!', 'She picked it with her heart (a very small processor)', '<div class="arRec" style="--c:' + (g.color || '#5ef2ff') + '"><img alt="" src="assets/hall/' + g.id + '/cover.webp" onerror="this.style.display=\'none\'"><div><small>MIMI RECOMMENDS</small><b>' + esc(g.name) + '</b><span>' + esc(g.desc || '') + '</span></div></div><div class="arNote gus">\u201C' + esc(pick(['I think you\u2019ll LOVE this one! I love it! I love everything!', 'Ooh ooh ooh, this one! It\u2019s in the Game Gallery! Gus Jr. will pretend he\u2019s not happy to see you!', 'My sensors say this game has a 100% fun rating! I made the sensors myself!'])) + '\u201D</div>', '<button class="bigBtn" id="mmGo">TAKE ME THERE</button><button class="pill" id="mmAgain">\uD83C\uDFB2 ANOTHER</button><button class="pill" id="mmBack">BACK</button>', 'mimi');
      on('mmGo', function () { GA.AreasUI.close(true); if (cab && GA.Areas.goToCab) { if (cab.gallery) GA.Areas.travel('gallery', function () { GA.Areas.goToCab(cab); }); else GA.Areas.goToCab(cab); if (GA.Prog) GA.Prog.event('mimiNav'); } }); on('mmAgain', function () { act('find'); }); on('mmBack', function () { menu(); }); return; }
    if (a === 'nav') { GA.AreasUI.show('mimi', '\uD83E\uDDED MIMI\u2019S NAVIGATOR', 'Tap a place and follow the glowing arrows!', '<div class="mmDest">' + M.DEST.map(function (d, i) { return '<button data-i="' + i + '">' + d[0] + '<b>' + esc(d[1]) + '</b></button>'; }).join('') + '</div>', '<button class="pill" id="mmBack">BACK</button>', 'mimi');
      on('mmBack', function () { menu(); }); Array.prototype.forEach.call(document.querySelectorAll('.mmDest button'), function (b) { b.addEventListener('click', function () { var i = +b.getAttribute('data-i'); GA.AreasUI.close(true); if (M.navTo(i)) { say('Follow the sparkly arrows to the ' + M.DEST[i][1] + '! Wheee!', 4); snd('ding'); } }); }); return; }
  }
  M.act = act;
  function buildHud() { if ($('mimiNav')) return; var d = document.createElement('div'); d.id = 'mimiNav'; d.className = 'mimiNav hidden'; d.innerHTML = '<i id="mimiNavA">\u2B07\uFE0F</i><span id="mimiNavT"></span><button id="mimiNavX">\u2715</button>'; document.body.appendChild(d); $('mimiNavX').addEventListener('click', function (e) { e.stopPropagation(); M.navStop(); });
    var b = document.createElement('div'); b.id = 'mimiOutBadge'; b.className = 'mimiOut hidden'; b.textContent = '\u26A1 POWER OUTAGE'; document.body.appendChild(b); }
})();
