/* Grok Arcade - CARRIE'S GIFT BOOTH (issue #64):
   Main Hall along the south divider wall (x = 5.74, z = 6.9, facing West into the main floor, right near her dad Gary's IT Help Desk).
   Features:
   - Carrie (Gary's daughter: glasses, Gary's family pocket protector with 3 pens, teal shirt + magenta/gold gift apron, festive bow).
   - The Ratita Industries x Tortuga Tech Gift-O-Matic 3000 (glass dome with tumbling gift capsules, brass crank, ticket chute, status screen).
   - Dense gift booth shelves, wrapped presents with bows, ribbon spools, glass display counter, and Gary & Carrie family photo + mug.
   - All 5 pet cameos in 3D: Luna, Torty, Pi-rat, Snowie, and Candy! */
(function () {
  'use strict';
  var G3 = GA.Gift3D = {}, T = window.THREE, A = null;
  var POS = { x: 5.02, z: 6.9, rot: -Math.PI / 2, front: { x: 2.6, z: 6.9, face: -Math.PI / 2 } };
  var carrie = null, screenMat = null, screenCvs = null, domeCaps = [], crankGrp = null, spinBoost = 0, pets3d = [];

  function cvs(w, h, fn) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    fn(c.getContext('2d'), w, h);
    var t = new T.CanvasTexture(c); t.anisotropy = 4;
    return { t: t, c: c };
  }
  function mat(col, r, m, e, ei) {
    var o = { color: col, roughness: r == null ? 0.5 : r, metalness: m || 0 };
    if (e != null) { o.emissive = e; o.emissiveIntensity = ei == null ? 0.6 : ei; }
    return new T.MeshStandardMaterial(o);
  }
  function box(w, h, d, m, x, y, z, p) {
    var o = new T.Mesh(new T.BoxGeometry(w, h, d), m);
    o.position.set(x || 0, y || 0, z || 0);
    o.castShadow = o.receiveShadow = true;
    if (p) p.add(o);
    return o;
  }
  function cyl(rt, rb, h, s, m, x, y, z, p) {
    var o = new T.Mesh(new T.CylinderGeometry(rt, rb, h, s || 14), m);
    o.position.set(x || 0, y || 0, z || 0);
    o.castShadow = true;
    if (p) p.add(o);
    return o;
  }
  function sph(r, m, x, y, z, p) {
    var o = new T.Mesh(new T.SphereGeometry(r, 14, 12), m);
    o.position.set(x || 0, y || 0, z || 0);
    o.castShadow = true;
    if (p) p.add(o);
    return o;
  }
  function F(px, w) { return (w || 'bold') + ' ' + px + 'px "Trebuchet MS",system-ui,sans-serif'; }
  function fitTxt(c, s, x, y, px, col, mw, wt) { c.save(); c.font = F(px, wt); var tw = c.measureText(s).width; if (mw && tw > mw) c.font = F(Math.max(10, Math.floor(px * mw / tw)), wt); c.fillStyle = col; c.textAlign = 'center'; c.fillText(s, x, y, mw || undefined); c.restore(); }

  /* Helper: build a wrapped present with crisscross ribbon + top bow */
  function giftBox(w, h, d, boxCol, ribCol, x, y, z, ry, p) {
    var g = new T.Group(); g.userData.noBatch = true;
    g.position.set(x, y + h / 2, z);
    if (ry) g.rotation.y = ry;
    var bm = mat(boxCol, 0.45, 0.08), rm = mat(ribCol, 0.3, 0.25, ribCol, 0.18);
    box(w, h, d, bm, 0, 0, 0, g);
    box(w + 0.012, h + 0.012, d * 0.22, rm, 0, 0, 0, g);
    box(w * 0.22, h + 0.012, d + 0.012, rm, 0, 0, 0, g);
    // bow loops on top
    var b1 = box(w * 0.36, h * 0.22, d * 0.18, rm, -w * 0.14, h / 2 + h * 0.09, 0, g); b1.rotation.z = 0.35;
    var b2 = box(w * 0.36, h * 0.22, d * 0.18, rm, w * 0.14, h / 2 + h * 0.09, 0, g); b2.rotation.z = -0.35;
    sph(Math.min(w, d) * 0.12, rm, 0, h / 2 + h * 0.1, 0, g);
    p.add(g);
    return g;
  }

  /* ---------- Build the Booth, Gift-O-Matic 3000, Carrie & 5 Pet Cameos ---------- */
  G3.build = function (api) {
    A = api;
    var g = new T.Group();
    g.position.set(POS.x, 0, POS.z);
    g.rotation.y = POS.rot; // local +Z points West (-X in world), local +X points South (+Z in world)

    // 1) Festive floor rug (noAud so floor decal check ignores it)
    var rugTex = cvs(256, 160, function (c, w, h) {
      c.fillStyle = '#3b0764'; c.fillRect(0, 0, w, h);
      for (var ix = 0; ix < 8; ix++) for (var iz = 0; iz < 5; iz++) {
        if ((ix + iz) % 2 === 0) { c.fillStyle = '#581c87'; c.fillRect(ix * 32, iz * 32, 32, 32); }
      }
      c.strokeStyle = '#fbbf24'; c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10);
      c.strokeStyle = '#f472b6'; c.lineWidth = 4; c.strokeRect(14, 14, w - 28, h - 28);
    }).t;
    var rug = A.noAud(new T.Mesh(new T.BoxGeometry(3.2, 0.012, 1.95), new T.MeshStandardMaterial({ map: rugTex, roughness: 0.85 })));
    rug.position.set(0, 0.006, 0.28);
    g.add(rug);

    // 2) Back wall & side pillars (local z = -0.68..0.85 so world X is 4.17..5.70, safely clear of divider wall S at x=5.80)
    var woodDark = mat(0x2e1065, 0.55, 0.12), trimGold = mat(0xfbbf24, 0.28, 0.65, 0xf59e0b, 0.22);
    var tealMat = mat(0x14b8a6, 0.42, 0.18, 0x0d9488, 0.15), pinkMat = mat(0xec4899, 0.4, 0.15, 0xdb2777, 0.18);
    var creamMat = mat(0xfef3c7, 0.6, 0.05), steelMat = mat(0x64748b, 0.35, 0.72);

    // Back wall board + gold frame
    box(3.0, 2.75, 0.12, woodDark, 0, 1.38, -0.62, g);
    box(3.06, 0.08, 0.16, trimGold, 0, 2.76, -0.62, g);
    box(3.06, 0.08, 0.16, trimGold, 0, 0.04, -0.62, g);

    // Wallpaper panel on back wall with festive ribbon pattern
    var wallTex = cvs(512, 256, function (c, w, h) {
      var gr = c.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#1e1b4b'); gr.addColorStop(1, '#3b0764');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(251,191,36,0.18)'; c.lineWidth = 3;
      for (var i = -h; i < w + h; i += 36) {
        c.beginPath(); c.moveTo(i, 0); c.lineTo(i + h, h); c.stroke();
        c.beginPath(); c.moveTo(i + h, 0); c.lineTo(i, h); c.stroke();
      }
      c.fillStyle = '#0f172a'; c.fillRect(18, 16, 210, 68);
      c.strokeStyle = '#fbbf24'; c.lineWidth = 4; c.strokeRect(18, 16, 210, 68);
      c.fillStyle = '#fde68a'; c.font = F(19); c.fillText('\uD83E\uDDC0 RATITA INDUSTRIES', 28, 42);
      c.fillStyle = '#5eead4'; c.font = F(19); c.fillText('\uD83D\uDC22 \u00d7 TORTUGA TECH', 28, 68);
    }).t;
    var wallPlane = new T.Mesh(new T.PlaneGeometry(2.84, 2.52), new T.MeshStandardMaterial({ map: wallTex, roughness: 0.5 }));
    wallPlane.position.set(0, 1.4, -0.55);
    g.add(wallPlane);

    // Two candy/gold striped front-corner columns supporting the canopy
    [-1.42, 1.42].forEach(function (px) {
      cyl(0.07, 0.07, 2.82, 12, trimGold, px, 1.41, 0.52, g);
      cyl(0.095, 0.095, 0.14, 12, pinkMat, px, 0.07, 0.52, g);
      cyl(0.095, 0.095, 0.14, 12, tealMat, px, 1.4, 0.52, g);
      cyl(0.095, 0.095, 0.14, 12, pinkMat, px, 2.74, 0.52, g);
    });

    // 3) Overhead Striped Gift Canopy + Marquee Sign + Fairy Lights
    var canopyTex = cvs(512, 256, function (c, w, h) {
      var sw = w / 8;
      for (var i = 0; i < 8; i++) {
        c.fillStyle = i % 2 === 0 ? '#db2777' : '#14b8a6';
        c.fillRect(i * sw, 0, sw, h);
      }
      c.fillStyle = '#fbbf24';
      c.fillRect(0, h - 18, w, 18);
    }).t;
    var canopy = box(3.12, 0.14, 1.42, new T.MeshStandardMaterial({ map: canopyTex, roughness: 0.45 }), 0, 2.88, 0.02, g);
    canopy.rotation.x = 0.12;

    // Overhead Main Marquee Sign
    var marqTex = cvs(768, 192, function (c, w, h) {
      var bg = c.createLinearGradient(0, 0, w, 0);
      bg.addColorStop(0, '#be185d'); bg.addColorStop(0.5, '#6d28d9'); bg.addColorStop(1, '#0f766e');
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#fbbf24'; c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10);
      fitTxt(c, '\uD83C\uDF81 CARRIE\u2019S GIFT BOOTH \uD83C\uDF81', w / 2, 72, 42, '#ffffff', w - 80, '900');
      fitTxt(c, 'GARY\u2019S DAUGHTER \u00b7 RATITA \u00d7 TORTUGA GIFT-O-MATIC 3000', w / 2, 120, 22, '#fde68a', w - 80);
      fitTxt(c, 'DAILY CAPSULES \u00b7 MILESTONE BOXES \u00b7 BONUS TICKETS \u00b7 PET CREW', w / 2, 158, 19, '#a7f3d0', w - 80);
    }).t;
    box(2.96, 0.64, 0.1, trimGold, 0, 3.24, 0.62, g);
    var marq = new T.Mesh(new T.PlaneGeometry(2.86, 0.56), new T.MeshStandardMaterial({ map: marqTex, emissiveMap: marqTex, emissive: 0xffffff, emissiveIntensity: 0.68, roughness: 0.25 }));
    marq.position.set(0, 3.24, 0.675);
    g.add(marq);

    // Giant 3D Golden Bow on top of the marquee!
    var topBowL = box(0.42, 0.24, 0.12, trimGold, -0.2, 3.66, 0.62, g); topBowL.rotation.z = 0.32;
    var topBowR = box(0.42, 0.24, 0.12, trimGold, 0.2, 3.66, 0.62, g); topBowR.rotation.z = -0.32;
    sph(0.11, pinkMat, 0, 3.66, 0.64, g);

    // Hanging warm fairy lights along canopy front
    var bulbMat = mat(0xfef08a, 0.2, 0, 0xfde047, 1.1);
    for (var bi = -5; bi <= 5; bi++) {
      sph(0.038, bulbMat, bi * 0.26, 2.74, 0.66, g);
    }
    var boothLight = new T.PointLight(0xffd6f5, 0.75, 4.5, 2);
    boothLight.position.set(0, 2.65, 0.45);
    g.add(boothLight);

    // 4) Back Shelves Loaded with Gifts, Spools & Gary/Carrie Family Photo
    box(1.75, 0.06, 0.34, trimGold, -0.48, 1.52, -0.42, g);
    box(1.75, 0.06, 0.34, trimGold, -0.48, 2.12, -0.42, g);
    // Gifts on upper & lower shelves
    giftBox(0.32, 0.28, 0.26, 0xec4899, 0xfbbf24, -1.12, 1.55, -0.42, 0.12, g);
    giftBox(0.28, 0.34, 0.26, 0x14b8a6, 0xf472b6, -0.72, 1.55, -0.42, -0.08, g);
    giftBox(0.34, 0.24, 0.28, 0x8b5cf6, 0x34d399, -0.28, 1.55, -0.42, 0.15, g);
    giftBox(0.26, 0.26, 0.24, 0xf59e0b, 0x38bdf8, 0.14, 1.55, -0.42, -0.14, g);
    giftBox(0.30, 0.30, 0.26, 0x3b82f6, 0xfbbf24, -1.06, 2.15, -0.42, -0.1, g);
    giftBox(0.36, 0.26, 0.26, 0x10b981, 0xf472b6, -0.60, 2.15, -0.42, 0.08, g);

    // Framed Family Photo on top shelf: "GARY & CARRIE · IT + GIFTS"
    var famTex = cvs(192, 160, function (c, w, h) {
      c.fillStyle = '#0f172a'; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#fbbf24'; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8);
      // Gary (left) + Carrie (right)
      c.fillStyle = '#14b8a6'; c.fillRect(34, 78, 46, 50);
      c.fillStyle = '#f1c27d'; c.beginPath(); c.arc(57, 56, 20, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#e2e8f0'; c.lineWidth = 3; c.strokeRect(42, 48, 12, 9); c.strokeRect(58, 48, 12, 9);
      c.fillStyle = '#ec4899'; c.fillRect(108, 82, 46, 46);
      c.fillStyle = '#f5cfa0'; c.beginPath(); c.arc(131, 58, 19, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#fde68a'; c.lineWidth = 3; c.strokeRect(117, 50, 11, 8); c.strokeRect(132, 50, 11, 8);
      c.fillStyle = '#fde68a'; c.font = F(15); c.textAlign = 'center';
      c.fillText('GARY & CARRIE', w / 2, 144);
    }).t;
    box(0.38, 0.32, 0.04, trimGold, -0.1, 2.31, -0.42, g);
    var famPic = new T.Mesh(new T.PlaneGeometry(0.33, 0.27), new T.MeshStandardMaterial({ map: famTex, roughness: 0.4 }));
    famPic.position.set(-0.1, 2.31, -0.398);
    g.add(famPic);

    // 5) Main Gift Counter (left + center) with Glass Display Window & Gary's #1 DAD Mug
    box(1.92, 1.02, 0.62, woodDark, -0.42, 0.51, 0.46, g);
    box(1.98, 0.07, 0.68, trimGold, -0.42, 1.03, 0.46, g);
    // Front sign on counter
    var ctrTex = cvs(640, 180, function (c, w, h) {
      c.fillStyle = '#1e1b4b'; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#fbbf24'; c.lineWidth = 6; c.strokeRect(8, 8, w - 16, h - 16);
      c.strokeStyle = '#f472b6'; c.lineWidth = 2; c.strokeRect(18, 18, w - 36, h - 36);
      fitTxt(c, 'DAILY CAPSULES \u00b7 MILESTONE BOXES', w / 2, 62, 20, '#f472b6', w - 180, '900');
      fitTxt(c, 'Synced with Bob\u2019s Desk \u00b7 Ratita \u00d7 Tortuga', w / 2, 104, 16, '#5eead4', w - 180);
      fitTxt(c, '\u201CDad wired the lights, Luna & Torty built the gears!\u201D', w / 2, 142, 14, '#fde68a', w - 180);
    }).t;
    var ctrSign = new T.Mesh(new T.PlaneGeometry(1.64, 0.50), new T.MeshStandardMaterial({ map: ctrTex, emissiveMap: ctrTex, emissive: 0xffffff, emissiveIntensity: 0.45, roughness: 0.35 }));
    ctrSign.position.set(-0.42, 0.52, 0.775);
    g.add(ctrSign);

    // Ribbon spool rack on counter + Gary's matching coffee mug ("#1 DAD - GARY")
    var spoolCols = [0xf472b6, 0xfbbf24, 0x38bdf8, 0x34d399];
    for (var si = 0; si < 4; si++) {
      cyl(0.055, 0.055, 0.08, 12, mat(spoolCols[si], 0.35, 0.15), -0.78 + si * 0.13, 1.11, 0.38, g);
    }
    // Coffee mug from her dad Gary
    cyl(0.055, 0.05, 0.13, 10, mat(0x4ade80, 0.3, 0.1), 0.12, 1.13, 0.52, g);

    // 6) THE RATITA INDUSTRIES × TORTUGA TECH GIFT-O-MATIC 3000 (right side of booth, x_local = 0.92, z_local = 0.25)
    var mach = new T.Group();
    mach.position.set(0.96, 0, 0.24);
    g.add(mach);

    // Heavy Tortuga/Ratita base pedestal
    box(0.88, 1.12, 0.78, mat(0x0f766e, 0.42, 0.35), 0, 0.56, 0, mach);
    box(0.92, 0.08, 0.82, trimGold, 0, 1.12, 0, mach);
    box(0.92, 0.08, 0.82, trimGold, 0, 0.04, 0, mach);

    // Maker plaque + status screen on front of Gift-O-Matic 3000
    screenCvs = cvs(320, 220, function (c, w, h) {
      c.fillStyle = '#042f2e'; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#fbbf24'; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8);
      c.fillStyle = '#fde68a'; c.font = F(20); c.textAlign = 'center';
      c.fillText('\uD83E\uDDC0 RATITA \u00d7 \uD83D\uDC22 TORTUGA', w / 2, 34);
      c.fillStyle = '#ffffff'; c.font = F(28);
      c.fillText('GIFT-O-MATIC 3000', w / 2, 70);
      c.fillStyle = '#064e3b'; c.fillRect(24, 86, w - 48, 62);
      c.strokeStyle = '#34d399'; c.lineWidth = 3; c.strokeRect(24, 86, w - 48, 62);
      c.fillStyle = '#4ade80'; c.font = F(24);
      c.fillText('\uD83C\uDF81 CAPSULE READY!', w / 2, 125);
      c.fillStyle = '#a7f3d0'; c.font = F(17);
      c.fillText('SPIN DAILY + MILESTONE BOXES', w / 2, 182);
    });
    screenMat = new T.MeshStandardMaterial({ map: screenCvs.t, emissiveMap: screenCvs.t, emissive: 0xffffff, emissiveIntensity: 0.75, roughness: 0.25 });
    var scrMesh = new T.Mesh(new T.PlaneGeometry(0.74, 0.52), screenMat);
    scrMesh.position.set(0, 0.76, 0.396);
    mach.add(scrMesh);

    // Capsule dispense chute + golden ticket slot on front lower half
    box(0.36, 0.26, 0.12, steelMat, -0.14, 0.28, 0.38, mach);
    box(0.30, 0.18, 0.08, mat(0x090d16, 0.8), -0.14, 0.26, 0.42, mach);
    // Golden ticket dispenser on right of chute
    box(0.24, 0.22, 0.10, trimGold, 0.22, 0.28, 0.38, mach);
    var tixStrip = box(0.14, 0.18, 0.02, mat(0xfef08a, 0.3, 0.1, 0xfacc15, 0.35), 0.22, 0.22, 0.45, mach);
    tixStrip.rotation.x = 0.35;

    // Glass Capsule Dome + Ring Cap
    var domeGlass = new T.Mesh(
      new T.CylinderGeometry(0.38, 0.40, 0.78, 20),
      new T.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.34, roughness: 0.12, metalness: 0.15 })
    );
    domeGlass.position.set(0, 1.54, 0);
    mach.add(domeGlass);
    cyl(0.41, 0.41, 0.09, 20, trimGold, 0, 1.95, 0, mach);
    sph(0.40, new T.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.28, roughness: 0.12 }), 0, 1.95, 0, mach);

    // Colorful Gift Capsules inside the dome (animated in A.anims)
    var capColors = [0xfbbf24, 0xec4899, 0x38bdf8, 0x34d399, 0xa855f7, 0xf97316, 0x2dd4bf, 0xf43f5e, 0xeab308];
    domeCaps = [];
    for (var ci = 0; ci < capColors.length; ci++) {
      var cg = new T.Group();
      var ang = (ci / capColors.length) * Math.PI * 2;
      var rad = (ci % 2 === 0) ? 0.21 : 0.12;
      var baseY = 1.28 + (ci % 3) * 0.19;
      cg.position.set(Math.cos(ang) * rad, baseY, Math.sin(ang) * rad);
      sph(0.085, mat(capColors[ci], 0.25, 0.2, capColors[ci], 0.22), 0, 0, 0, cg);
      cyl(0.088, 0.088, 0.022, 12, trimGold, 0, 0, 0, cg);
      mach.add(cg);
      domeCaps.push({ g: cg, ang: ang, rad: rad, baseY: baseY, phase: ci * 0.9 });
    }

    // Side Brass Crank Wheel on the Gift-O-Matic 3000
    crankGrp = new T.Group();
    crankGrp.position.set(-0.46, 0.72, 0.12);
    mach.add(crankGrp);
    var axle = cyl(0.04, 0.04, 0.12, 10, steelMat, 0, 0, 0, crankGrp); axle.rotation.z = Math.PI / 2;
    var wheel = cyl(0.18, 0.18, 0.03, 14, trimGold, -0.05, 0, 0, crankGrp); wheel.rotation.z = Math.PI / 2;
    var knob = cyl(0.025, 0.025, 0.12, 10, pinkMat, -0.11, 0.12, 0, crankGrp); knob.rotation.z = Math.PI / 2;

    // 7) CARRIE (Gary's Daughter) standing behind the counter (x_local = -0.35, z_local = -0.02)
    carrie = buildCarrie();
    carrie.g.position.set(-0.35, 0, -0.02);
    g.add(carrie.g);

    // 8) ALL 5 PET CAMEOS IN 3D (Luna, Torty, Pi-rat, Snowie, Candy)
    pets3d = [];
    // Luna on top of the Gift-O-Matic dome with her Ratita engineer helmet
    var pLuna = buildPetLuna(); pLuna.position.set(0.96, 2.24, 0.24); g.add(pLuna);
    pets3d.push({ g: pLuna, baseY: 2.24, phase: 0.2 });

    // Torty on the right counter corner next to the Gift-O-Matic with Tortuga Tech goggles
    var pTorty = buildPetTorty(); pTorty.position.set(0.36, 1.07, 0.48); g.add(pTorty);
    pets3d.push({ g: pTorty, baseY: 1.07, phase: 1.4 });

    // Pi-rat on the left counter corner with tricorn hat & treasure chest of tickets
    var pPirat = buildPetPirat(); pPirat.position.set(-1.16, 1.07, 0.48); g.add(pPirat);
    pets3d.push({ g: pPirat, baseY: 1.07, phase: 2.6 });

    // Snowie sitting on the front-left corner of the gift rug with a gift bow
    var pSnowie = buildPetSnowie(); pSnowie.position.set(-1.18, 0.02, 0.96); pSnowie.rotation.y = 0.35; g.add(pSnowie);
    pets3d.push({ g: pSnowie, baseY: 0.02, phase: 3.8 });

    // Candy perched on the counter beside the ribbon spools
    var pCandy = buildPetCandy(); pCandy.position.set(-0.56, 1.07, 0.50); g.add(pCandy);
    pets3d.push({ g: pCandy, baseY: 1.07, phase: 5.0 });

    A.scene.add(g);

    // Glow floor mat at walk-up spot
    var glowMat = new T.MeshBasicMaterial({ map: A.glowTex, color: '#f472b6', transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending });
    var glowMesh = new T.Mesh(new T.PlaneGeometry(1.6, 1.4), glowMat);
    glowMesh.position.set(POS.front.x, 0.03, POS.front.z);
    glowMesh.rotation.x = -Math.PI / 2;
    glowMesh.renderOrder = 2;
    A.noAud(glowMesh);
    A.scene.add(glowMesh);

    // Solid collision box & audit registration (keeps maxX <= 5.70 so it never touches divider wall S at 5.80)
    A.addSolid(POS.x - 0.82, POS.x + 0.68, POS.z - 1.56, POS.z + 1.56, 'Carrie\u2019s Gift Booth');
    g.updateMatrixWorld(true);
    A.regItem('Carrie\u2019s Gift Booth', 'prop', g);

    // Register walk-up cabinet entry for AreasUI + Mimi's directory
    var an = new T.Object3D();
    an.name = 'anchor gf_booth';
    an.position.set(POS.front.x + 1.75, 0, POS.front.z);
    an.rotation.y = -Math.PI / 2;
    A.scene.add(an);
    an.updateMatrixWorld(true);
    A.cabinets.push({
      id: 'gf_booth',
      kind: 'gf_booth',
      ar: true,
      area: 'main',
      name: 'Carrie\u2019s Gift Booth',
      x: POS.front.x,
      z: POS.front.z,
      front: new T.Vector3(POS.front.x, 0, POS.front.z),
      dir: new T.Vector3(-1, 0, 0),
      glow: glowMat,
      group: an,
      rot: an.rotation.y,
      nextDraw: Infinity,
      r: 1.5,
      data: {},
      game: { id: 'gf_booth', name: 'Carrie\u2019s Gift Booth', desc: 'Gary\u2019s daughter \u00b7 Ratita \u00d7 Tortuga Gift-O-Matic 3000', color: '#f472b6' }
    });

    // Animation loop for Carrie, Gift-O-Matic capsules, crank, and all 5 pets
    A.anims.push(function (t, dt) {
      animateCarrie(t, dt || 0.016);
      var spd = 1.2 + spinBoost * 8.0;
      spinBoost = Math.max(0, spinBoost - (dt || 0.016) * 0.9);
      for (var i = 0; i < domeCaps.length; i++) {
        var dc = domeCaps[i];
        var a = dc.ang + t * spd * (i % 2 === 0 ? 1 : -1);
        dc.g.position.x = Math.cos(a) * dc.rad;
        dc.g.position.z = Math.sin(a) * dc.rad;
        dc.g.position.y = dc.baseY + Math.sin(t * 3.2 + dc.phase) * (0.04 + spinBoost * 0.08);
        dc.g.rotation.y = a;
        dc.g.rotation.z = Math.sin(t * 2.5 + dc.phase) * 0.35;
      }
      if (crankGrp) crankGrp.rotation.x = t * (0.8 + spinBoost * 10);
      for (var pi = 0; pi < pets3d.length; pi++) {
        var pt = pets3d[pi];
        pt.g.position.y = pt.baseY + Math.abs(Math.sin(t * 2.6 + pt.phase)) * 0.035;
        pt.g.rotation.y = Math.sin(t * 1.4 + pt.phase) * 0.18;
      }
    });

    G3.refresh();
  };

  /* ---------- Build Carrie (Gary's daughter: glasses, pocket protector with 3 pens, teal shirt + pink/gold gift apron) ---------- */
  function buildCarrie() {
    var g = new T.Group();
    var skin = mat(0xf5cfa0, 0.65), tealShirt = mat(0x14b8a6, 0.55), apron = mat(0xdb2777, 0.48, 0.08);
    var hair = mat(0x2a1b10, 0.8), dark = mat(0x1e293b, 0.5), gold = mat(0xfbbf24, 0.3, 0.5, 0xf59e0b, 0.2);
    var white = mat(0xffffff, 0.4), glassFrame = mat(0xfde68a, 0.25, 0.65);

    // Legs & Torso (Gary's signature teal shirt + festive magenta gift apron)
    box(0.17, 0.65, 0.17, dark, -0.11, 0.33, 0, g);
    box(0.17, 0.65, 0.17, dark, 0.11, 0.33, 0, g);
    box(0.46, 0.66, 0.26, tealShirt, 0, 0.98, 0, g);
    box(0.38, 0.54, 0.04, apron, 0, 0.94, 0.135, g);
    box(0.40, 0.05, 0.05, gold, 0, 1.18, 0.14, g);

    // Gary's Family Pocket Protector on her chest (white pouch + 3 colored pens: red, yellow, cyan!)
    box(0.11, 0.11, 0.02, white, -0.11, 1.08, 0.155, g);
    box(0.018, 0.06, 0.02, mat(0xef4444, 0.3), -0.135, 1.15, 0.16, g);
    box(0.018, 0.06, 0.02, mat(0xfacc15, 0.3), -0.11, 1.155, 0.16, g);
    box(0.018, 0.06, 0.02, mat(0x38bdf8, 0.3), -0.085, 1.15, 0.16, g);
    // Gold "CARRIE" badge on right chest
    box(0.12, 0.055, 0.02, gold, 0.11, 1.10, 0.155, g);

    // Arms (right arm waves!)
    var armL = new T.Group(); armL.position.set(-0.29, 1.24, 0); g.add(armL);
    box(0.13, 0.50, 0.13, tealShirt, 0, -0.21, 0, armL);
    sph(0.075, skin, 0, -0.48, 0, armL);

    var armR = new T.Group(); armR.position.set(0.29, 1.24, 0); g.add(armR);
    box(0.13, 0.50, 0.13, tealShirt, 0, -0.21, 0, armR);
    sph(0.075, skin, 0, -0.48, 0, armR);

    // Head, Hair, Festive Bow & Gary-style Glasses
    var head = new T.Group(); head.position.set(0, 1.50, 0); g.add(head);
    sph(0.21, skin, 0, 0, 0, head);
    // Hair cap + side locks + ponytail
    box(0.43, 0.17, 0.42, hair, 0, 0.12, -0.02, head);
    box(0.43, 0.32, 0.16, hair, 0, 0.0, -0.14, head);
    box(0.09, 0.26, 0.12, hair, -0.19, -0.02, 0.05, head);
    box(0.09, 0.26, 0.12, hair, 0.19, -0.02, 0.05, head);
    sph(0.11, hair, 0, 0.06, -0.24, head);
    // Festive pink & gold gift bow on top of her hair
    var hbL = box(0.14, 0.08, 0.05, apron, -0.07, 0.23, 0.02, head); hbL.rotation.z = 0.28;
    var hbR = box(0.14, 0.08, 0.05, apron, 0.07, 0.23, 0.02, head); hbR.rotation.z = -0.28;
    sph(0.04, gold, 0, 0.23, 0.03, head);

    // Eyes, Brows, Smile & Glasses (just like her dad Gary!)
    var eyeL = sph(0.026, dark, -0.075, 0.02, 0.19, head);
    var eyeR = sph(0.026, dark, 0.075, 0.02, 0.19, head);
    box(0.11, 0.075, 0.02, glassFrame, -0.075, 0.02, 0.205, head);
    box(0.11, 0.075, 0.02, glassFrame, 0.075, 0.02, 0.205, head);
    box(0.04, 0.018, 0.02, glassFrame, 0, 0.025, 0.208, head);
    var mouth = box(0.09, 0.026, 0.02, mat(0xbe123c, 0.4), 0, -0.075, 0.195, head);

    return { g: g, head: head, armL: armL, armR: armR, eyeL: eyeL, eyeR: eyeR, mouth: mouth, waveT: 0, mood: 'happy', moodT: 0, blinkT: 2 };
  }

  function animateCarrie(t, dt) {
    if (!carrie) return;
    carrie.g.position.y = Math.abs(Math.sin(t * 2.2)) * 0.02;
    carrie.head.rotation.y = Math.sin(t * 0.9) * 0.18;
    carrie.head.rotation.z = Math.sin(t * 1.4) * 0.04;
    carrie.blinkT -= dt;
    if (carrie.blinkT < 0) carrie.blinkT = 2.4 + Math.random() * 2.2;
    var blink = carrie.blinkT < 0.11 ? 0.15 : 1;
    carrie.eyeL.scale.y = carrie.eyeR.scale.y = blink;
    if (carrie.waveT > 0) {
      carrie.waveT = Math.max(0, carrie.waveT - dt);
      carrie.armR.rotation.z = -2.35 + Math.sin(t * 12) * 0.35;
      carrie.armR.rotation.x = -0.35;
    } else {
      carrie.armR.rotation.z = -0.15 - Math.sin(t * 1.8) * 0.06;
      carrie.armR.rotation.x = 0;
    }
    carrie.armL.rotation.z = 0.15 + Math.sin(t * 1.6) * 0.05;
  }

  /* ---------- 5 Pet Cameo 3D Models ---------- */
  function buildPetLuna() {
    var g = new T.Group();
    var white = mat(0xf8fafc, 0.5), pink = mat(0xf472b6, 0.5), helmet = mat(0xfbbf24, 0.3, 0.3, 0xf59e0b, 0.2), dark = mat(0x0f172a, 0.4);
    sph(0.13, white, 0, 0.12, 0, g); // body
    sph(0.11, white, 0, 0.26, 0.05, g); // head
    sph(0.055, pink, -0.085, 0.34, 0.03, g); // left ear
    sph(0.055, pink, 0.085, 0.34, 0.03, g); // right ear
    // Ratita yellow engineer hard-hat
    cyl(0.09, 0.10, 0.06, 12, helmet, 0, 0.36, 0.05, g);
    sph(0.02, dark, -0.04, 0.27, 0.14, g);
    sph(0.02, dark, 0.04, 0.27, 0.14, g);
    sph(0.022, pink, 0, 0.25, 0.16, g); // nose
    // Tiny silver wrench in paw
    box(0.025, 0.14, 0.025, mat(0xcbd5e1, 0.25, 0.8), 0.11, 0.18, 0.08, g);
    return g;
  }
  function buildPetTorty() {
    var g = new T.Group();
    var green = mat(0x22c55e, 0.5), shell = mat(0x065f46, 0.4, 0.15), gold = mat(0xfbbf24, 0.3, 0.5), dark = mat(0x0f172a, 0.4);
    // Dome shell + gold trim ring
    sph(0.15, shell, 0, 0.12, -0.02, g);
    cyl(0.155, 0.155, 0.03, 12, gold, 0, 0.06, -0.02, g);
    // Head + Tortuga Tech brass goggles
    sph(0.095, green, 0, 0.18, 0.13, g);
    box(0.14, 0.045, 0.04, gold, 0, 0.21, 0.20, g);
    sph(0.02, dark, -0.035, 0.18, 0.21, g);
    sph(0.02, dark, 0.035, 0.18, 0.21, g);
    return g;
  }
  function buildPetPirat() {
    var g = new T.Group();
    var fur = mat(0x9ca3af, 0.55), hat = mat(0x111827, 0.5), red = mat(0xdc2626, 0.5), gold = mat(0xfbbf24, 0.3, 0.5);
    sph(0.12, fur, 0, 0.11, 0, g);
    sph(0.10, fur, 0, 0.24, 0.04, g);
    sph(0.05, fur, -0.08, 0.31, 0.02, g);
    sph(0.05, fur, 0.08, 0.31, 0.02, g);
    // Red pirate bandana + black tricorn hat with gold trim
    cyl(0.102, 0.102, 0.035, 12, red, 0, 0.29, 0.04, g);
    box(0.24, 0.06, 0.18, hat, 0, 0.34, 0.04, g);
    box(0.06, 0.04, 0.02, gold, 0, 0.34, 0.135, g);
    // Eye patch
    sph(0.022, hat, -0.038, 0.25, 0.13, g);
    sph(0.02, hat, 0.038, 0.25, 0.13, g);
    // Mini treasure chest beside Pi-rat
    box(0.16, 0.11, 0.12, mat(0x78350f, 0.6), 0.18, 0.055, 0.02, g);
    box(0.165, 0.025, 0.125, gold, 0.18, 0.09, 0.02, g);
    return g;
  }
  function buildPetSnowie() {
    var g = new T.Group();
    var snow = mat(0xffffff, 0.4, 0.05, 0xe0f2fe, 0.15), scarf = mat(0x0ea5e9, 0.45), pink = mat(0xec4899, 0.4), dark = mat(0x0f172a, 0.4);
    sph(0.16, snow, 0, 0.15, 0, g);
    sph(0.13, snow, 0, 0.33, 0.04, g);
    sph(0.06, snow, -0.09, 0.42, 0.02, g);
    sph(0.06, snow, 0.09, 0.42, 0.02, g);
    // Sky-blue scarf + pink gift bow on head
    cyl(0.12, 0.12, 0.045, 12, scarf, 0, 0.24, 0.03, g);
    box(0.11, 0.05, 0.04, pink, 0, 0.46, 0.05, g);
    sph(0.022, dark, -0.045, 0.34, 0.15, g);
    sph(0.022, dark, 0.045, 0.34, 0.15, g);
    return g;
  }
  function buildPetCandy() {
    var g = new T.Group();
    var coat = mat(0x64748b, 0.5), beard = mat(0xf8fafc, 0.45), bow = mat(0xec4899, 0.35, 0.15, 0xf472b6, 0.2), gold = mat(0xfbbf24, 0.3, 0.4), dark = mat(0x0f172a, 0.4);
    // Miniature schnauzer body + head
    box(0.18, 0.18, 0.22, coat, 0, 0.10, 0, g);
    box(0.16, 0.15, 0.16, coat, 0, 0.25, 0.05, g);
    // Iconic white bushy schnauzer beard + eyebrows
    box(0.14, 0.09, 0.10, beard, 0, 0.21, 0.13, g);
    box(0.05, 0.025, 0.03, beard, -0.045, 0.30, 0.13, g);
    box(0.05, 0.025, 0.03, beard, 0.045, 0.30, 0.13, g);
    // Folded schnauzer ears + pink/gold ribbon bow
    box(0.045, 0.09, 0.06, coat, -0.09, 0.29, 0.04, g);
    box(0.045, 0.09, 0.06, coat, 0.09, 0.29, 0.04, g);
    box(0.11, 0.045, 0.04, bow, 0, 0.34, 0.06, g);
    sph(0.022, gold, 0, 0.34, 0.075, g);
    sph(0.02, dark, -0.04, 0.26, 0.135, g);
    sph(0.02, dark, 0.04, 0.26, 0.135, g);
    sph(0.024, dark, 0, 0.24, 0.18, g);
    return g;
  }

  /* ---------- Public Hooks for GiftUI ---------- */
  G3.wave = function (secs) { if (carrie) carrie.waveT = Math.max(carrie.waveT, secs || 2.5); };
  G3.spinAnim = function () { spinBoost = 1.6; G3.wave(3); G3.refresh(); };
  G3.refresh = function () {
    if (!screenCvs || !GA.Prog || !GA.Prog.giftBoothState) return;
    var st = GA.Prog.giftBoothState();
    var c = screenCvs.c.getContext('2d'), w = screenCvs.c.width, h = screenCvs.c.height;
    c.fillStyle = '#042f2e'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#fbbf24'; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8);
    c.fillStyle = '#fde68a'; c.font = F(19); c.textAlign = 'center';
    c.fillText('\uD83E\uDDC0 RATITA \u00d7 \uD83D\uDC22 TORTUGA', w / 2, 34);
    c.fillStyle = '#ffffff'; c.font = F(26);
    c.fillText('GIFT-O-MATIC 3000', w / 2, 68);
    c.fillStyle = st.readyCount > 0 ? '#064e3b' : '#1e293b';
    c.fillRect(22, 84, w - 44, 64);
    c.strokeStyle = st.readyCount > 0 ? '#34d399' : '#38bdf8';
    c.lineWidth = 3; c.strokeRect(22, 84, w - 44, 64);
    c.fillStyle = st.readyCount > 0 ? '#4ade80' : '#7dd3fc';
    c.font = F(22);
    c.fillText(st.readyCount > 0 ? '\uD83C\uDF81 ' + st.readyCount + (st.readyCount === 1 ? ' GIFT READY!' : ' GIFTS READY!') : '\u2705 ALL CAUGHT UP!', w / 2, 124);
    c.fillStyle = '#a7f3d0'; c.font = F(16);
    c.fillText('SPINS: ' + st.spins + ' \u00b7 SYNCED BY BOB\u2019S DESK', w / 2, 182);
    screenCvs.t.needsUpdate = true;
  };
})();
