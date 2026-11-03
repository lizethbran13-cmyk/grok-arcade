/* Grok Arcade — RETRO CENTRAL (1995) 3D Walk-In World (Issue #88)
   - 1995 Retro Central Mall & Arcade Hall (neon geometric 90s carpet, synthwave signs, CRT Video Wall, Pogs & Token Booth, 4 Playable Kiosks)
   - Gary's 1995 Console Emporium (displaying all 6 1983–1995 copycat & made-up consoles)
   - Walk-in 1995 Retro Home Living Room (east wing through archway: wood-grain 32-inch CRT Tube TV, 6 console shelf slots that appear as you own/buy them, lava lamp, beanbag, pizza box, VCR, posters)
   - All 5 Family Pets in 1995 Retro Outfits (Luna, Pi-rat, Snowie, Torty/Martina, Candy)
*/
(function () {
  'use strict';
  var RC = window.RC95 = window.RC95 || {};

  var scene, camera, renderer;
  var player = { x: 0, z: 10, rotY: Math.PI, speed: 0.16, mesh: null };
  var walkKeys = { w: false, a: false, s: false, d: false, left: false, right: false };
  var interactables = [];
  var homeConsoleMeshes = {};
  var standBoxMeshes = {};
  var animatedProps = [];
  var homeScreenTex = null, homeScreenCtx = null, homeScreenCanvas = null;
  var clock = 0;

  function mat(color, opts) {
    opts = opts || {};
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: opts.roughness != null ? opts.roughness : 0.45,
      metalness: opts.metalness != null ? opts.metalness : 0.15,
      emissive: opts.emissive != null ? opts.emissive : 0x000000,
      emissiveIntensity: opts.emissiveIntensity != null ? opts.emissiveIntensity : 0
    });
  }

  function makeSignTexture(title, sub, bgHex, borderHex, titleColor, subColor) {
    var c = document.createElement('canvas');
    c.width = 512;
    c.height = 160;
    var g = c.getContext('2d');
    g.fillStyle = bgHex || '#13072e';
    g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = borderHex || '#f43f5e';
    g.lineWidth = 10;
    g.strokeRect(8, 8, c.width - 16, c.height - 16);

    g.fillStyle = titleColor || '#facc15';
    g.font = '900 42px Trebuchet MS, sans-serif';
    g.textAlign = 'center';
    g.fillText(title, c.width * 0.5, 76);

    if (sub) {
      g.fillStyle = subColor || '#67e8f9';
      g.font = '800 24px Trebuchet MS, sans-serif';
      g.fillText(sub, c.width * 0.5, 122);
    }
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  function makeNeonCarpetTexture() {
    var c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    var g = c.getContext('2d');
    g.fillStyle = '#12082b';
    g.fillRect(0, 0, 256, 256);

    // 1995 bowling-alley / arcade neon confetti squiggles, triangles, and grid
    g.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    g.lineWidth = 2;
    for (var i = 0; i <= 256; i += 32) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
    }

    var colors = ['#f43f5e', '#38bdf8', '#facc15', '#a855f7', '#10b981'];
    for (var k = 0; k < 28; k++) {
      g.fillStyle = colors[k % colors.length];
      g.strokeStyle = colors[(k + 2) % colors.length];
      g.lineWidth = 3;
      var x = (k * 47 + 19) % 230 + 12;
      var y = (k * 73 + 11) % 230 + 12;
      if (k % 3 === 0) {
        g.beginPath();
        g.moveTo(x, y - 8); g.lineTo(x + 9, y + 8); g.lineTo(x - 9, y + 8);
        g.closePath();
        g.fill();
      } else if (k % 3 === 1) {
        g.beginPath();
        g.arc(x, y, 6, 0, Math.PI * 2);
        g.stroke();
      } else {
        g.beginPath();
        g.moveTo(x - 10, y - 5);
        g.lineTo(x - 3, y + 5);
        g.lineTo(x + 4, y - 5);
        g.lineTo(x + 11, y + 5);
        g.stroke();
      }
    }

    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 10);
    return tex;
  }

  function makeConsoleMesh(cData, scale) {
    var s = scale || 1;
    var grp = new THREE.Group();
    var bodyMat = mat(cData.shellColor, { roughness: 0.35 });
    var accMat = mat(cData.accentColor, { emissive: cData.accentColor, emissiveIntensity: 0.25 });

    if (cData.id === 'nintortuga64') {
      // Curved charcoal N64 deck + yellow cartridge + 3-prong controller
      var base = new THREE.Mesh(new THREE.BoxGeometry(1.05 * s, 0.28 * s, 0.82 * s), bodyMat);
      base.position.y = 0.14 * s;
      grp.add(base);
      var cart = new THREE.Mesh(new THREE.BoxGeometry(0.46 * s, 0.22 * s, 0.16 * s), accMat);
      cart.position.set(0, 0.32 * s, -0.08 * s);
      grp.add(cart);
      // 3-prong N64 controller in front
      var pad = new THREE.Mesh(new THREE.BoxGeometry(0.42 * s, 0.08 * s, 0.28 * s), accMat);
      pad.position.set(0, 0.06 * s, 0.58 * s);
      grp.add(pad);
    } else if (cData.id === 'segapaw') {
      // Jet-black Sega Genesis 16-bit deck with circular ring & gold badge
      var base2 = new THREE.Mesh(new THREE.BoxGeometry(1.02 * s, 0.22 * s, 0.78 * s), bodyMat);
      base2.position.y = 0.11 * s;
      grp.add(base2);
      var ring = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * s, 0.28 * s, 0.08 * s, 20), accMat);
      ring.position.set(-0.12 * s, 0.24 * s, 0);
      grp.add(ring);
    } else if (cData.id === 'visor95') {
      // Ruby-red Virtual-Visor 95 on steel bipod legs
      var visor = new THREE.Mesh(new THREE.BoxGeometry(0.75 * s, 0.36 * s, 0.45 * s), bodyMat);
      visor.position.y = 0.48 * s;
      grp.add(visor);
      var legL = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * s, 0.04 * s, 0.48 * s, 8), mat(0x94a3b8));
      legL.position.set(-0.22 * s, 0.24 * s, 0.08 * s);
      legL.rotation.z = -0.2;
      var legR = legL.clone();
      legR.position.x = 0.22 * s;
      legR.rotation.z = 0.2;
      grp.add(legL, legR);
    } else {
      // Classic toaster/tower console + cartridge slot
      var box = new THREE.Mesh(new THREE.BoxGeometry(0.96 * s, 0.26 * s, 0.76 * s), bodyMat);
      box.position.y = 0.13 * s;
      grp.add(box);
      var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.55 * s, 0.14 * s, 0.45 * s), accMat);
      stripe.position.set(0, 0.27 * s, 0);
      grp.add(stripe);
    }
    return grp;
  }

  /* ---------- Build the 5 Family Pets in 1995 Retro Outfits ---------- */
  function buildPetRat(colorBody, outfitColor, hatType) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 14), mat(colorBody));
    body.scale.set(0.95, 1.05, 1.15);
    body.position.y = 0.48;
    g.add(body);

    // 1995 Windbreaker / Vest
    var vest = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.48, 0.42, 16), mat(outfitColor, { emissive: outfitColor, emissiveIntensity: 0.15 }));
    vest.position.y = 0.46;
    g.add(vest);

    var head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 14), mat(colorBody));
    head.position.set(0, 0.96, 0.12);
    g.add(head);

    // Pink ears
    var earMat = mat(0xfda4af);
    var earL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), earMat);
    earL.scale.set(1, 1, 0.35);
    earL.position.set(-0.28, 1.24, 0.05);
    var earR = earL.clone();
    earR.position.x = 0.28;
    g.add(earL, earR);

    // Eyes & nose
    var eyeMat = mat(0x111827);
    var eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), eyeMat);
    eyeL.position.set(-0.13, 1.02, 0.43);
    var eyeR = eyeL.clone();
    eyeR.position.x = 0.13;
    var nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat(0xf43f5e));
    nose.position.set(0, 0.94, 0.48);
    g.add(eyeL, eyeR, nose);

    if (hatType === 'cap95') {
      // Backwards 1995 neon cap for Luna
      var cap = new THREE.Mesh(new THREE.SphereGeometry(0.37, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(0xec4899));
      cap.position.set(0, 1.04, 0.12);
      var brim = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.28), mat(0x38bdf8));
      brim.position.set(0, 1.06, -0.24);
      g.add(cap, brim);
    } else if (hatType === 'skate95') {
      // Eyepatch + 1995 Neon Skateboard under Pi-rat
      var patch = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), mat(0x111827));
      patch.position.set(0.13, 1.02, 0.44);
      var board = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.07, 1.35), mat(0xa855f7, { emissive: 0xa855f7, emissiveIntensity: 0.2 }));
      board.position.set(0, 0.08, 0);
      g.add(patch, board);
    } else if (hatType === 'walkman95') {
      // Yellow 1995 Sony-style Walkman headphones for Snowie
      var band = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.045, 8, 20, Math.PI), mat(0xfacc15));
      band.position.set(0, 1.02, 0.12);
      var cupL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 12), mat(0xfacc15));
      cupL.rotation.z = Math.PI * 0.5;
      cupL.position.set(-0.37, 0.98, 0.12);
      var cupR = cupL.clone();
      cupR.position.x = 0.37;
      g.add(band, cupL, cupR);
    }
    return g;
  }

  function buildPetTorty() {
    var g = new THREE.Group();
    var shell = new THREE.Mesh(new THREE.SphereGeometry(0.58, 18, 14), mat(0x10b981, { roughness: 0.35 }));
    shell.scale.set(1.05, 0.78, 1.18);
    shell.position.y = 0.46;
    g.add(shell);

    var head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), mat(0x6ee7b7));
    head.position.set(0, 0.68, 0.62);
    g.add(head);

    // Super Torty 64 Red Plumber Cap!
    var cap = new THREE.Mesh(new THREE.SphereGeometry(0.29, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(0xef4444));
    cap.position.set(0, 0.75, 0.62);
    var brim = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.26), mat(0xdc2626));
    brim.position.set(0, 0.76, 0.84);
    g.add(cap, brim);
    return g;
  }

  function buildPetCandy() {
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.SphereGeometry(0.54, 16, 14), mat(0xfef3c7));
    body.scale.set(0.95, 0.85, 1.25);
    body.position.y = 0.48;
    g.add(body);

    var head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 14), mat(0xfef3c7));
    head.position.set(0, 0.88, 0.46);
    g.add(head);

    // 1995 Neon Bandana Collar
    var collar = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.06, 8, 18), mat(0xf43f5e, { emissive: 0xf43f5e, emissiveIntensity: 0.25 }));
    collar.rotation.x = Math.PI * 0.5;
    collar.position.set(0, 0.68, 0.38);
    g.add(collar);

    var earL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.34, 0.18), mat(0xfde68a));
    earL.position.set(-0.34, 0.86, 0.44);
    var earR = earL.clone();
    earR.position.x = 0.34;
    g.add(earL, earR);
    return g;
  }

  function buildHumanNpc(shirtHex, hairHex, hasVisor) {
    var g = new THREE.Group();
    var legs = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.75, 12), mat(0x1d4ed8));
    legs.position.y = 0.38;
    var torso = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.32, 0.78, 14), mat(shirtHex));
    torso.position.y = 1.12;
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), mat(0xfde68a));
    head.position.y = 1.74;
    var hair = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.35, 10), mat(hairHex));
    hair.position.y = 2.02;
    g.add(legs, torso, head, hair);
    if (hasVisor) {
      var v = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.28), mat(0x38bdf8, { emissive: 0x38bdf8, emissiveIntensity: 0.3 }));
      v.position.set(0, 1.82, 0.16);
      g.add(v);
    }
    return g;
  }

  function buildArcadeKiosk(title, sub, cabColor, screenHex, gameId, x, z, rotY) {
    var g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY || 0;

    var base = new THREE.Mesh(new THREE.BoxGeometry(1.75, 2.85, 1.35), mat(cabColor, { roughness: 0.35 }));
    base.position.y = 1.42;
    g.add(base);

    // Neon side trim
    var trimL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.9, 1.42), mat(screenHex, { emissive: screenHex, emissiveIntensity: 0.55 }));
    trimL.position.set(-0.88, 1.45, 0);
    var trimR = trimL.clone();
    trimR.position.x = 0.88;
    g.add(trimL, trimR);

    // Glowing CRT Screen on cabinet
    var scrTex = makeSignTexture(title, sub, '#090418', '#38bdf8', '#facc15', '#a7f3d0');
    var scr = new THREE.Mesh(
      new THREE.PlaneGeometry(1.42, 0.92),
      new THREE.MeshBasicMaterial({ map: scrTex })
    );
    scr.position.set(0, 1.78, 0.69);
    g.add(scr);

    // Control deck
    var deck = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.22, 0.65), mat(0x1e293b));
    deck.position.set(0, 1.12, 0.68);
    g.add(deck);

    scene.add(g);

    interactables.push({
      id: 'kiosk_' + gameId,
      kind: 'game',
      gameId: gameId,
      x: x + Math.sin(rotY || 0) * 1.4,
      z: z + Math.cos(rotY || 0) * 1.4,
      labelY: 3.25,
      wx: x,
      wz: z,
      label: '🕹️ ' + title,
      prompt: 'Play ' + title + ' (' + sub + ')',
      cssClass: 'console'
    });
  }

  /* ---------- Build the Entire 1995 Retro Central + Walk-in Retro Home ---------- */
  function buildWorld() {
    // 1. Main Mall Floor with 1995 Neon Geometric Carpet
    var carpetTex = makeNeonCarpetTexture();
    var mallFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 32),
      new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.65 })
    );
    mallFloor.rotation.x = -Math.PI / 2;
    mallFloor.position.set(-2, 0, 0);
    scene.add(mallFloor);

    // Mall Neon Archways & Synthwave Back Banner
    var archMat = mat(0xdb2777, { emissive: 0xdb2777, emissiveIntensity: 0.45 });
    for (var az = -12; az <= 8; az += 10) {
      var pL = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 6.5, 12), archMat);
      pL.position.set(-16, 3.25, az);
      var pR = pL.clone();
      pR.position.x = 9.5;
      var beam = new THREE.Mesh(new THREE.BoxGeometry(26, 0.38, 0.38), mat(0x38bdf8, { emissive: 0x38bdf8, emissiveIntensity: 0.5 }));
      beam.position.set(-3.2, 6.4, az);
      scene.add(pL, pR, beam);
    }

    // Giant Overhead 1995 Marquee Sign
    var mainSignTex = makeSignTexture(
      'RETRO CENTRAL · OCTOBER 1995',
      '64-BIT NINTORTUGA · SPEED RAT 1 & 2 · GARY\'S CONSOLE STAND · WALK-IN RETRO HOME',
      '#180636', '#f43f5e', '#facc15', '#67e8f9'
    );
    var mainSign = new THREE.Mesh(
      new THREE.PlaneGeometry(16.5, 3.4),
      new THREE.MeshBasicMaterial({ map: mainSignTex })
    );
    mainSign.position.set(-2.5, 5.2, -14.2);
    scene.add(mainSign);

    // 2. Gary's 1995 Console Stand (Center-North Plaza, x = -2.5, z = -8.5)
    var standGroup = new THREE.Group();
    standGroup.position.set(-2.5, 0, -8.5);
    var counter = new THREE.Mesh(new THREE.BoxGeometry(10.8, 1.25, 2.4), mat(0x1e1b4b, { roughness: 0.3 }));
    counter.position.y = 0.625;
    standGroup.add(counter);

    var neonStrip = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.16, 2.52), mat(0xf43f5e, { emissive: 0xf43f5e, emissiveIntensity: 0.7 }));
    neonStrip.position.y = 1.22;
    standGroup.add(neonStrip);

    // Canopy sign over Gary's Console Stand
    var standSignTex = makeSignTexture(
      'GARY\'S 1995 CONSOLE EMPORIUM (1983–1995)',
      'BUY CONSOLES → DELIVERED TO YOUR WALK-IN 1995 RETRO HOME CRT TV!',
      '#1e1b4b', '#facc15', '#fef08a', '#38bdf8'
    );
    var standSign = new THREE.Mesh(
      new THREE.PlaneGeometry(10.4, 2.1),
      new THREE.MeshBasicMaterial({ map: standSignTex })
    );
    standSign.position.set(0, 3.65, -0.6);
    standGroup.add(standSign);

    // Display all 6 consoles on pedestals along Gary's counter!
    RC.CONSOLES.forEach(function (c, idx) {
      var cx = -4.25 + idx * 1.7;
      var ped = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.22, 16), mat(0x334155));
      ped.position.set(cx, 1.36, 0.15);
      standGroup.add(ped);

      var cMesh = makeConsoleMesh(c, 0.82);
      cMesh.position.set(cx, 1.47, 0.15);
      standGroup.add(cMesh);
      standBoxMeshes[c.id] = cMesh;
      animatedProps.push({ mesh: cMesh, baseY: 1.47, speed: 1.8, phase: idx * 0.9 });
    });

    // 1995 Gary behind the counter (Frosted Tips & Flannel)
    var garyMesh = buildHumanNpc(0xdc2626, 0xfef08a, false);
    garyMesh.position.set(0, 0, -1.55);
    standGroup.add(garyMesh);

    scene.add(standGroup);

    interactables.push({
      id: 'console_stand',
      kind: 'stand',
      x: -2.5,
      z: -6.2,
      wx: -2.5,
      wz: -8.5,
      labelY: 2.8,
      label: '🏪 Gary\'s 1995 Console Stand (6 Consoles)',
      prompt: 'Open Gary\'s 1995 Console Stand (Buy & Switch Consoles)',
      cssClass: 'console'
    });

    // 3. Four Playable Kiosks in the 1995 Mall Plaza
    buildArcadeKiosk('SUPER TORTY 64', '1995 Nintortuga 64 · 3D Stars', 0x334155, 0xfacc15, 'torty64', -11.5, -3.5, Math.PI * 0.22);
    buildArcadeKiosk('SPEED RAT 1991', 'Sega-Paw 16-Bit · Loops & Rings', 0x1e3a8a, 0x38bdf8, 'speedrat1', -11.5, 3.2, Math.PI * 0.28);
    buildArcadeKiosk('SPEED RAT 2: SPIN DASH', '1992 Super 16-Bit · Spin Dash', 0x581c87, 0xa855f7, 'speedrat2', -4.8, 4.8, 0);
    buildArcadeKiosk('SHELL FIGHTER & VR \'95', 'DreamBox 32X & Virtual-Visor', 0x065f46, 0x10b981, 'shellfighter95', 2.2, 4.8, 0);

    // 4. 1995 Gus's Token & Pogs Booth + Larry's CRT Video Wall + Lily/Mimi Chrono-Comms
    var gusBooth = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 2.2), mat(0x312e81));
    gusBooth.position.set(-12.5, 1.1, -9.5);
    scene.add(gusBooth);
    var gusNpc = buildHumanNpc(0xf59e0b, 0x9ca3af, false);
    gusNpc.position.set(-12.5, 0, -8.1);
    scene.add(gusNpc);
    interactables.push({
      id: 'npc_gus95',
      kind: 'npc',
      npcId: 'gus95',
      x: -11.2,
      z: -8.0,
      wx: -12.5,
      wz: -8.1,
      labelY: 2.5,
      label: '🪙 1995 Gus (Tokens & No Pogs)',
      prompt: 'Talk to 1995 Manager Gus',
      cssClass: ''
    });

    var larryNpc = buildHumanNpc(0x0284c7, 0x78350f, true);
    larryNpc.position.set(5.2, 0, -8.2);
    scene.add(larryNpc);
    interactables.push({
      id: 'npc_larry95',
      kind: 'npc',
      npcId: 'larry95',
      x: 5.2,
      z: -6.8,
      wx: 5.2,
      wz: -8.2,
      labelY: 2.5,
      label: '📺 1995 Larry (CRT Wall Tech)',
      prompt: 'Talk to 1995 CRT Tech Larry',
      cssClass: ''
    });

    // Chrono-Comms Holo Pedestal (Lily, Mimi & Lili)
    var holoBase = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 1.1, 18), mat(0x0f172a));
    holoBase.position.set(-8.2, 0.55, 8.2);
    var holoBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 2.1, 16), mat(0x38bdf8, { emissive: 0x38bdf8, emissiveIntensity: 0.55 }));
    holoBeam.position.set(-8.2, 2.0, 8.2);
    scene.add(holoBase, holoBeam);
    interactables.push({
      id: 'npc_comms95',
      kind: 'npc',
      npcId: 'comms95',
      x: -8.2,
      z: 6.8,
      wx: -8.2,
      wz: 8.2,
      labelY: 3.3,
      label: '⚡ Lily & Mimi Chrono-Comms',
      prompt: 'Answer Lily, Mimi & Lili\'s 1995 Temporal Link',
      cssClass: ''
    });

    // 5. WALK-IN 1995 RETRO HOME LIVING ROOM (East Wing, x = 11..25, z = -9..9)
    buildWalkInRetroHome();

    // 6. All 5 Family Pets in 1995 Retro Outfits!
    // Luna by Super Torty 64 Kiosk
    var luna = buildPetRat(0xf8fafc, 0xec4899, 'cap95');
    luna.position.set(-9.2, 0, -3.2);
    luna.rotation.y = 0.4;
    scene.add(luna);
    interactables.push({
      id: 'pet_luna',
      kind: 'npc',
      npcId: 'pet_luna',
      x: -9.2,
      z: -2.2,
      wx: -9.2,
      wz: -3.2,
      labelY: 1.85,
      label: '🐭 Luna (\'95 Windbreaker · Squeak!)',
      prompt: 'Pet Luna (Squeak!)',
      cssClass: 'pet'
    });

    // Pi-rat on his 1995 Skateboard by Speed Rat '91 Kiosk
    var pirat = buildPetRat(0xd6d3d1, 0x38bdf8, 'skate95');
    pirat.position.set(-9.1, 0, 2.8);
    pirat.rotation.y = 0.5;
    scene.add(pirat);
    interactables.push({
      id: 'pet_pirat',
      kind: 'npc',
      npcId: 'pet_pirat',
      x: -9.1,
      z: 3.8,
      wx: -9.1,
      wz: 2.8,
      labelY: 1.85,
      label: '🏴‍☠️ Pi-rat (\'95 Skateboard · Squeak!)',
      prompt: 'Pet Pi-rat (Squeak!)',
      cssClass: 'pet'
    });

    // Snowie with her 1995 yellow Walkman headphones by Gary's Console Stand
    var snowie = buildPetRat(0xffffff, 0xa855f7, 'walkman95');
    snowie.position.set(2.4, 0, -6.2);
    snowie.rotation.y = -0.35;
    scene.add(snowie);
    interactables.push({
      id: 'pet_snowie',
      kind: 'npc',
      npcId: 'pet_snowie',
      x: 2.4,
      z: -5.2,
      wx: 2.4,
      wz: -6.2,
      labelY: 1.85,
      label: '🎧 Snowie (\'95 Walkman · Squeak!)',
      prompt: 'Pet Snowie (Squeak!)',
      cssClass: 'pet'
    });

    // Torty / Martina in her Super Torty 64 Red Plumber Cap at the Plaza Hub
    var torty = buildPetTorty();
    torty.position.set(-1.2, 0, 1.2);
    scene.add(torty);
    interactables.push({
      id: 'pet_torty',
      kind: 'npc',
      npcId: 'pet_torty',
      x: -1.2,
      z: 2.2,
      wx: -1.2,
      wz: 1.2,
      labelY: 1.55,
      label: '🐢 Torty / Martina (Super Torty 64 Star)',
      prompt: 'Say hi to Torty / Martina',
      cssClass: 'pet'
    });

    // Candy inside your walk-in 1995 Retro Home Living Room next to the CRT TV!
    var candy = buildPetCandy();
    candy.position.set(15.6, 0.1, 2.2);
    candy.rotation.y = -0.7;
    scene.add(candy);
    interactables.push({
      id: 'pet_candy',
      kind: 'npc',
      npcId: 'pet_candy',
      x: 15.6,
      z: 2.2,
      wx: 15.6,
      wz: 2.2,
      labelY: 1.65,
      label: '🐶 Candy (Retro Home VIP · Woof!)',
      prompt: 'Pet Candy in your 1995 Living Room (Woof!)',
      cssClass: 'pet'
    });
  }

  function buildWalkInRetroHome() {
    var homeGroup = new THREE.Group();
    homeGroup.position.set(17.5, 0, 0);

    // Warm 1995 Hardwood + Checkered Living Room Rug
    var woodFloor = new THREE.Mesh(
      new THREE.BoxGeometry(13.5, 0.14, 15.5),
      mat(0x78350f, { roughness: 0.55 })
    );
    woodFloor.position.y = 0.07;
    homeGroup.add(woodFloor);

    var rug = new THREE.Mesh(
      new THREE.CylinderGeometry(4.4, 4.4, 0.06, 28),
      mat(0x4c1d95, { roughness: 0.75 })
    );
    rug.position.set(0, 0.15, 0.8);
    homeGroup.add(rug);

    // Living Room Walls (Back & Right Wall, open walk-in front/west archway)
    var backWall = new THREE.Mesh(new THREE.BoxGeometry(13.5, 5.2, 0.35), mat(0x1e293b));
    backWall.position.set(0, 2.6, -7.6);
    var eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5.2, 15.5), mat(0x1e293b));
    eastWall.position.set(6.6, 2.6, 0);
    homeGroup.add(backWall, eastWall);

    // Archway Banner welcoming you into your 1995 Retro Home
    var homeSignTex = makeSignTexture(
      'YOUR 1995 RETRO HOME LIVING ROOM',
      '32" CRT TUBE TV · CONSOLES DELIVERED HERE FROM GARY\'S STAND!',
      '#064e3b', '#34d399', '#fef08a', '#a7f3d0'
    );
    var homeSign = new THREE.Mesh(
      new THREE.PlaneGeometry(9.6, 1.95),
      new THREE.MeshBasicMaterial({ map: homeSignTex })
    );
    homeSign.position.set(0, 4.35, -7.35);
    homeGroup.add(homeSign);

    // Wood-grain 1995 Entertainment Center & 32-Inch CRT Tube TV (at z = -5.2)
    var entUnit = new THREE.Mesh(new THREE.BoxGeometry(8.8, 1.45, 2.1), mat(0x451a03, { roughness: 0.5 }));
    entUnit.position.set(0, 0.8, -5.2);
    homeGroup.add(entUnit);

    // Giant 1995 32-Inch Charcoal CRT Tube TV Cabinet
    var crtBox = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.65, 1.85), mat(0x27272a, { roughness: 0.35 }));
    crtBox.position.set(0, 2.82, -5.2);
    homeGroup.add(crtBox);

    // Live Dynamic Canvas Texture on the Home 32" CRT Tube Screen
    homeScreenCanvas = document.createElement('canvas');
    homeScreenCanvas.width = 512;
    homeScreenCanvas.height = 320;
    homeScreenCtx = homeScreenCanvas.getContext('2d');
    homeScreenTex = new THREE.CanvasTexture(homeScreenCanvas);

    var crtScreenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 2.1),
      new THREE.MeshBasicMaterial({ map: homeScreenTex })
    );
    crtScreenMesh.position.set(0, 2.86, -4.25);
    homeGroup.add(crtScreenMesh);

    // 6 Console Shelf Slots around the Entertainment Center (appear when owned!)
    var slotOffsets = [
      { x: -3.2, y: 1.55, z: -4.9 },
      { x: -1.9, y: 1.55, z: -4.9 },
      { x: 1.9,  y: 1.55, z: -4.9 },
      { x: 3.2,  y: 1.55, z: -4.9 },
      { x: -2.7, y: 0.78, z: -4.1 },
      { x: 2.7,  y: 0.78, z: -4.1 }
    ];

    RC.CONSOLES.forEach(function (c, i) {
      var off = slotOffsets[i] || { x: 0, y: 1.55, z: -4.9 };
      var m = makeConsoleMesh(c, 0.88);
      m.position.set(off.x, off.y, off.z);
      homeGroup.add(m);
      homeConsoleMeshes[c.id] = m;
    });

    // Cozy 1995 Living Room Couch, Beanbag, Pizza Box & Glowing Lava Lamp!
    var couchBase = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.65, 1.8), mat(0x7c2d12));
    couchBase.position.set(0, 0.45, 2.2);
    var couchBack = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.15, 0.45), mat(0x9a3412));
    couchBack.position.set(0, 0.95, 2.95);
    homeGroup.add(couchBase, couchBack);

    var beanbag = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 12), mat(0xdb2777));
    beanbag.scale.set(1.1, 0.65, 1.1);
    beanbag.position.set(-2.8, 0.45, 0.6);
    homeGroup.add(beanbag);

    // 1995 Lava Lamp on side table
    var lampTable = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.95, 14), mat(0x334155));
    lampTable.position.set(4.5, 0.55, -4.6);
    var lavaGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.95, 14), mat(0xf43f5e, { emissive: 0xf43f5e, emissiveIntensity: 0.75 }));
    lavaGlass.position.set(4.5, 1.45, -4.6);
    homeGroup.add(lampTable, lavaGlass);

    scene.add(homeGroup);

    interactables.push({
      id: 'home_crt_tv',
      kind: 'home_tv',
      x: 17.5,
      z: -2.4,
      wx: 17.5,
      wz: -4.5,
      labelY: 4.35,
      label: '📺 1995 Home 32" CRT Tube TV (Play Owned Consoles)',
      prompt: 'Play Owned Consoles on Your 32" CRT Tube TV',
      cssClass: 'home'
    });

    RC.refreshHomeConsoles();
  }

  RC.refreshHomeConsoles = function () {
    var s = RC.load();
    RC.CONSOLES.forEach(function (c) {
      var m = homeConsoleMeshes[c.id];
      if (m) m.visible = !!s.owned[c.id];
    });
    drawHomeCrtAttractScreen();
  };

  function drawHomeCrtAttractScreen() {
    if (!homeScreenCtx || !homeScreenCanvas) return;
    var s = RC.load();
    var active = RC.CONSOLES.find(function (c) { return c.id === s.activeConsole; }) || RC.CONSOLES[3];
    var g = homeScreenCtx;
    var W = homeScreenCanvas.width, H = homeScreenCanvas.height;

    g.fillStyle = '#090d16';
    g.fillRect(0, 0, W, H);

    // Channel 3 green OSD in corner
    g.fillStyle = '#22c55e';
    g.font = '900 22px monospace';
    g.textAlign = 'right';
    g.fillText('CH 03 · STEREO', W - 20, 36);

    g.fillStyle = active.color || '#facc15';
    g.font = '900 24px Trebuchet MS, sans-serif';
    g.textAlign = 'center';
    g.fillText(active.shortName.toUpperCase() + ' (' + active.year + ')', W * 0.5, 92);

    g.fillStyle = '#ffffff';
    g.font = '900 34px Trebuchet MS, sans-serif';
    g.fillText(active.gameTitle.toUpperCase(), W * 0.5, 148);

    g.fillStyle = '#67e8f9';
    g.font = '800 19px Trebuchet MS, sans-serif';
    g.fillText('CONSOLES HOOKED UP: ' + RC.ownedCount() + ' / ' + RC.CONSOLES.length, W * 0.5, 204);

    g.fillStyle = '#fde047';
    g.font = '900 22px Trebuchet MS, sans-serif';
    g.fillText('► PRESS [E] OR TAP TO PLAY ON CRT TV!', W * 0.5, 265);

    if (homeScreenTex) homeScreenTex.needsUpdate = true;
  }

  function buildPlayerAvatar() {
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.9, 14), mat(0x06b6d4));
    body.position.y = 0.65;
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), mat(0xfde68a));
    head.position.y = 1.32;
    var jacket = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.37, 0.55, 14), mat(0xec4899, { emissive: 0xec4899, emissiveIntensity: 0.2 }));
    jacket.position.y = 0.78;
    g.add(body, jacket, head);
    g.position.set(player.x, 0, player.z);
    scene.add(g);
    player.mesh = g;
  }

  /* ---------- Warp Player to Named 1995 Zone for Quick Navigation & Screenshots ---------- */
  RC.warpTo = function (zone) {
    RC.sfx('warp');
    if (zone === 'plaza') {
      player.x = -2.5; player.z = 7.5; player.rotY = Math.PI;
    } else if (zone === 'stand') {
      player.x = -2.5; player.z = -5.2; player.rotY = Math.PI;
    } else if (zone === 'home') {
      player.x = 16.8; player.z = -0.2; player.rotY = Math.PI;
    } else if (zone === 'pets') {
      player.x = -6.8; player.z = 0.8; player.rotY = Math.PI * 0.85;
    }
    if (player.mesh) {
      player.mesh.position.set(player.x, 0, player.z);
      player.mesh.rotation.y = player.rotY;
    }
  };

  RC.getInteractables = function () { return interactables; };
  RC.getPlayer = function () { return player; };
  RC.getCamera = function () { return camera; };

  RC.setWalkKey = function (k, v) { walkKeys[k] = !!v; };

  function bindWalkControls() {
    window.addEventListener('keydown', function (e) {
      if (RC.isGameOpen && RC.isGameOpen()) return;
      var c = e.code || e.key;
      if (c === 'KeyW' || c === 'ArrowUp') walkKeys.w = true;
      else if (c === 'KeyS' || c === 'ArrowDown') walkKeys.s = true;
      else if (c === 'KeyA') walkKeys.a = true;
      else if (c === 'KeyD') walkKeys.d = true;
      else if (c === 'ArrowLeft') walkKeys.left = true;
      else if (c === 'ArrowRight') walkKeys.right = true;
      else if (c === 'KeyE' || c === 'Enter') {
        if (RC.triggerNearestInteractable) RC.triggerNearestInteractable();
      }
    });
    window.addEventListener('keyup', function (e) {
      var c = e.code || e.key;
      if (c === 'KeyW' || c === 'ArrowUp') walkKeys.w = false;
      else if (c === 'KeyS' || c === 'ArrowDown') walkKeys.s = false;
      else if (c === 'KeyA') walkKeys.a = false;
      else if (c === 'KeyD') walkKeys.d = false;
      else if (c === 'ArrowLeft') walkKeys.left = false;
      else if (c === 'ArrowRight') walkKeys.right = false;
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    clock += 0.016;

    if (!RC.isGameOpen || !RC.isGameOpen()) {
      var dx = (walkKeys.d || walkKeys.right ? 1 : 0) - (walkKeys.a || walkKeys.left ? 1 : 0);
      var dz = (walkKeys.s ? 1 : 0) - (walkKeys.w ? 1 : 0);
      if (dx !== 0 || dz !== 0) {
        var len = Math.hypot(dx, dz) || 1;
        player.x = Math.max(-15.5, Math.min(22.5, player.x + (dx / len) * player.speed));
        player.z = Math.max(-11.5, Math.min(12.5, player.z + (dz / len) * player.speed));
        player.rotY = Math.atan2(dx, dz);
        if (player.mesh) {
          player.mesh.position.set(player.x, Math.abs(Math.sin(clock * 10)) * 0.08, player.z);
          player.mesh.rotation.y = player.rotY;
        }
      }

      // Smooth follow camera behind player
      var targetCamX = player.x * 0.85;
      var targetCamZ = player.z + 9.2;
      camera.position.x += (targetCamX - camera.position.x) * 0.1;
      camera.position.z += (targetCamZ - camera.position.z) * 0.1;
      camera.position.y = 6.2;
      camera.lookAt(player.x, 1.5, player.z - 3.2);
    }

    // Float console displays on Gary's counter
    animatedProps.forEach(function (p) {
      p.mesh.position.y = p.baseY + Math.sin(clock * p.speed + p.phase) * 0.06;
      p.mesh.rotation.y += 0.012;
    });

    renderer.render(scene, camera);
    if (RC.updateWorldLabels) RC.updateWorldLabels();
  }

  RC.init3D = function () {
    var canvas = document.getElementById('viewport3d');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b041d);
    scene.fog = new THREE.FogExp2(0x0b041d, 0.018);

    camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.1, 120);
    camera.position.set(-2.5, 6.2, 16.5);

    var amb = new THREE.AmbientLight(0xd8b4fe, 0.85);
    scene.add(amb);

    var dir = new THREE.DirectionalLight(0xfef08a, 0.9);
    dir.position.set(8, 18, 12);
    scene.add(dir);

    var neonPink = new THREE.PointLight(0xf43f5e, 1.2, 26);
    neonPink.position.set(-3, 5, -7);
    var neonCyan = new THREE.PointLight(0x38bdf8, 1.1, 26);
    neonCyan.position.set(17, 4.5, -2);
    scene.add(neonPink, neonCyan);

    buildWorld();
    buildPlayerAvatar();
    RC.warpTo('plaza');
    bindWalkControls();

    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    RC.onConsolesChanged = function () {
      RC.refreshHomeConsoles();
    };

    animate();
  };
})();
