/* Grok Arcade — RETRO CENTRAL (1995) Data, Consoles (1983-1995), NPCs, Pets & Save State (Issue #88) */
(function () {
  'use strict';
  var RC = window.RC95 = window.RC95 || {};

  var KEY_SAVE = 'grokArcade.retro95';
  var KEY_TIX = 'grokArcade.tickets';

  /* ---------- WebAudio 1983-1995 Chiptune & N64 Synth SFX ---------- */
  var actx = null;
  function ctx() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) try { actx = new AC(); } catch (e) {}
    }
    if (actx && actx.state === 'suspended') { try { actx.resume(); } catch (e) {} }
    return actx;
  }
  RC.sfx = function (kind) {
    var c = ctx();
    if (!c) return;
    var now = c.currentTime;
    function tone(freq, type, dur, delay, vol, slideTo) {
      try {
        var o = c.createOscillator(), g = c.createGain();
        o.type = type || 'square';
        o.frequency.setValueAtTime(freq, now + (delay || 0));
        if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, now + (delay || 0) + dur);
        g.gain.setValueAtTime(vol || 0.08, now + (delay || 0));
        g.gain.exponentialRampToValueAtTime(0.001, now + (delay || 0) + dur);
        o.connect(g); g.connect(c.destination);
        o.start(now + (delay || 0));
        o.stop(now + (delay || 0) + dur + 0.01);
      } catch (e) {}
    }
    if (kind === 'ring') { tone(987.77, 'square', 0.07, 0, 0.07); tone(1318.5, 'square', 0.18, 0.07, 0.08); }
    else if (kind === 'star') {
      [523, 659, 784, 1046, 1318, 1568].forEach(function (f, i) { tone(f, 'triangle', 0.12, i * 0.06, 0.1); });
    }
    else if (kind === 'jump') { tone(240, 'square', 0.16, 0, 0.08, 620); }
    else if (kind === 'triple') { tone(330, 'square', 0.09, 0, 0.08, 520); tone(520, 'square', 0.12, 0.08, 0.09, 880); tone(880, 'triangle', 0.18, 0.18, 0.1, 1320); }
    else if (kind === 'spindash') { tone(180, 'sawtooth', 0.22, 0, 0.09, 740); }
    else if (kind === 'spring') { tone(220, 'triangle', 0.25, 0, 0.1, 960); }
    else if (kind === 'buy') { [440, 554, 659, 880].forEach(function (f, i) { tone(f, 'square', 0.11, i * 0.06, 0.09); }); }
    else if (kind === 'hit') { tone(160, 'sawtooth', 0.2, 0, 0.09, 65); }
    else if (kind === 'talk') { tone(480, 'triangle', 0.06, 0, 0.06); tone(620, 'triangle', 0.07, 0.06, 0.06); }
    else if (kind === 'warp') { [300, 450, 600, 900, 1200].forEach(function (f, i) { tone(f, 'sine', 0.14, i * 0.05, 0.08); }); }
    else { tone(520, 'square', 0.06, 0, 0.05); }
  };

  /* ---------- 6 Copycat & Made-Up Consoles (1983–1995) ---------- */
  RC.CONSOLES = [
    {
      id: 'res83',
      name: 'Ratita Entertainment System (RES-83)',
      shortName: 'RES-83 (8-Bit)',
      year: 1983,
      era: '1983–1985 · 8-Bit Classic Copycat',
      maker: 'Ratita Home Video · Copycat of NES / Famicom',
      price: 0, // Starter console included free so you can play in your Retro Home right away!
      color: '#ef4444',
      shellColor: 0xd1d5db,
      accentColor: 0xef4444,
      gameId: 'plumber85',
      gameTitle: '8-Bit Plumber Bros. \'85 & Super Dash Rat',
      gameSub: '1985 8-Bit / 1991 16-Bit Platformer Copycat',
      badge: 'STARTER CONSOLE (OWNED)',
      desc: 'Two-tone grey 8-bit toaster box with front-loading cartridge door, rectangular 2-button pads, and orange Cheese-Zapper! Plays 8-Bit Plumber Bros. \'85!',
      shelfSlot: 0
    },
    {
      id: 'segapaw',
      name: 'Sega-Paw Genesis Drive 16-Bit',
      shortName: 'Sega-Paw 16-Bit',
      year: 1989,
      era: '1989–1991 · 16-Bit Blast Processing Copycat',
      maker: 'Sega-Paw Corp · Copycat of Sega Genesis / Mega Drive',
      price: 60,
      color: '#38bdf8',
      shellColor: 0x1e293b,
      accentColor: 0xfacc15,
      gameId: 'speedrat1',
      gameTitle: 'Speed Rat 1991: Green Hill Zone',
      gameSub: '1991 Sonic the Hedgehog 1 Copycat · Loops, Rings & Dr. Egg-Rat!',
      badge: '16-BIT BLAST PROCESSING',
      desc: 'Sleek jet-black 16-bit console with a gold "16-BIT" emblem, headphone volume slider, and 3-button curved pad. Includes Speed Rat 1991 (Sonic 1 copycat)!',
      shelfSlot: 1
    },
    {
      id: 'sres91',
      name: 'Super Ratita Entertainment System (SRES)',
      shortName: 'Super Ratita SRES',
      year: 1991,
      era: '1991 · 16-Bit Mode-7 Copycat',
      maker: 'Ratita Home Video · Copycat of Super Nintendo (SNES)',
      price: 75,
      color: '#a855f7',
      shellColor: 0xe2e8f0,
      accentColor: 0x9333ea,
      gameId: 'speedrat2',
      gameTitle: 'Speed Rat 2: Spin Dash Chemical Zone',
      gameSub: '1992–1995 Sonic 2 Copycat · Spin-Dash Turbo & Sidekick Squeaks!',
      badge: 'SUPER 16-BIT EDITION',
      desc: 'Cool light-grey & lavender 16-bit deck with purple eject switch and 4-color shoulder-button controller. Bundled with Speed Rat 2: Spin Dash!',
      shelfSlot: 2
    },
    {
      id: 'nintortuga64',
      name: 'Nintortuga 64 (Ultra 64 Launch Deck)',
      shortName: 'Nintortuga 64',
      year: 1995,
      era: '1995 · 64-Bit 3D Polygon Copycat',
      maker: 'Nintortuga × Tortuga Tech · Copycat of Nintendo 64',
      price: 110,
      color: '#facc15',
      shellColor: 0x334155,
      accentColor: 0xfacc15,
      gameId: 'torty64',
      gameTitle: 'Super Torty 64',
      gameSub: '1995 Super Mario 64 Copycat · 3D Courtyard, Triple-Jump & 5 Power Stars!',
      badge: '🔥 1995 FLAGSHIP 64-BIT!',
      desc: 'The hottest console of 1995! Charcoal curved 64-bit powerhouse with 4 controller ports and the famous 3-prong analog stick controller. Plays Super Torty 64!',
      shelfSlot: 3
    },
    {
      id: 'dreambox94',
      name: 'Tortuga DreamBox 32X-CD',
      shortName: 'DreamBox 32X-CD',
      year: 1994,
      era: '1994–1995 · Made-Up Dual Cart/CD Console',
      maker: 'Tortuga Tech Inc. (Made-Up Original Console!)',
      price: 85,
      color: '#10b981',
      shellColor: 0x065f46,
      accentColor: 0x34d399,
      gameId: 'shellfighter95',
      gameTitle: 'Polygonal Shell Fighter \'95',
      gameSub: '1995 Flat-Shaded 3D Polygon Arcade Fighter on Tortuga DreamBox!',
      badge: 'MADE-UP TORTUGA CONSOLE',
      desc: 'Martina "Torty" built this dual-slot Cartridge + CD-ROM tower-of-power with a flip-top emerald lid and arcade fight stick! Plays Polygonal Shell Fighter \'95!',
      shelfSlot: 4
    },
    {
      id: 'visor95',
      name: 'Ratita Virtual-Visor 95 & Pocket-Cheese',
      shortName: 'Virtual-Visor 95',
      year: 1995,
      era: '1995 · Made-Up Red-Wireframe VR Console',
      maker: 'Ratita Industries (Luna, Pi-rat & Snowie Original!)',
      price: 70,
      color: '#f43f5e',
      shellColor: 0xbe123c,
      accentColor: 0xfda4af,
      gameId: 'cybermaze95',
      gameTitle: 'Wireframe Cyber-Maze \'95',
      gameSub: '1995 Red-LED Stereoscopic 3D Vector Tank & Maze Shooter!',
      badge: 'MADE-UP VR VISOR + HANDHELD',
      desc: 'Ruby-red tabletop stereoscopic 3D visor on a steel bipod stand (plus a matching yellow Pocket-Cheese Boy handheld)! Plays glowing red Wireframe Cyber-Maze \'95!',
      shelfSlot: 5
    }
  ];

  /* Extra cartridges shown in the CRT console menu alongside each console's pack-in game */
  RC.EXTRA_CARTS = [
    { consoleId: 'sres91', gameId: 'chronocheese', label: 'Super Ratita SRES: Chrono Cheese (16-Bit RPG)' }
  ];

  /* ---------- Playable Games Catalog ---------- */
  RC.GAMES = {
    torty64: {
      id: 'torty64',
      title: 'SUPER TORTY 64',
      year: '1995',
      consoleId: 'nintortuga64',
      consoleName: 'Nintortuga 64 (N64 Copycat)',
      genre: '3D Courtyard Star-Collector (Mario 64 Copycat)',
      controls: 'WASD / Arrows: Run in 3D · SPACE: Jump / Double / Triple Jump · X / Shift: Spin Stomp',
      goal: 'Explore Castle Courtyard in 3D, stomp Goomba-Bots, and collect 5 Golden Power Stars!'
    },
    speedrat1: {
      id: 'speedrat1',
      title: 'SPEED RAT 1991: GREEN HILL',
      year: '1991',
      consoleId: 'segapaw',
      consoleName: 'Sega-Paw Genesis 16-Bit (Sonic 1 Copycat)',
      genre: 'High-Speed Loop & Ring Runner (Sonic 1 Copycat)',
      controls: 'Left / Right: Run · SPACE: Spin-Jump · Down: Roll through Loops & Badniks',
      goal: 'Blast through Green Hill Zone loops, collect Golden Rings, bounce on Springs & defeat Dr. Egg-Rat!'
    },
    speedrat2: {
      id: 'speedrat2',
      title: 'SPEED RAT 2: SPIN DASH',
      year: '1992–1995',
      consoleId: 'sres91',
      consoleName: 'Super Ratita SRES / Sega-Paw II (Sonic 2 Copycat)',
      genre: 'Supersonic Spin-Dash Sequel w/ Sidekick Squeaks (Sonic 2 Copycat)',
      controls: 'Left / Right: Run · SPACE: Jump · X (or Down+Space): REV UP SPIN DASH TURBO!',
      goal: 'Use Spin Dash to rocket across Chemical Zone corkscrews with your two-tailed pal Squeaks!'
    },
    plumber85: {
      id: 'plumber85',
      title: '8-BIT PLUMBER BROS. \'85',
      year: '1983–1991',
      consoleId: 'res83',
      consoleName: 'Ratita RES-83 & SRES (NES/SNES Copycat)',
      genre: 'Classic Brick-Smashing Platformer (Super Mario Bros. Copycat)',
      controls: 'Left / Right: Run · SPACE: Jump & Bump ? Blocks · X: Dash / Fireball',
      goal: 'Bump ? Mystery Blocks for Super Cheese, stomp Koopa-Bots, and grab the top of the Castle Flagpole!'
    },
    shellfighter95: {
      id: 'shellfighter95',
      title: 'POLYGONAL SHELL FIGHTER \'95',
      year: '1994–1995',
      consoleId: 'dreambox94',
      consoleName: 'Tortuga DreamBox 32X-CD (Made-Up Console)',
      genre: 'Flat-Shaded 3D Polygon Ring Fighter (Virtua Fighter Copycat)',
      controls: 'Left / Right: Footwork · Z: Polygon Jab · X: Heavy Kick · SPACE: Shell Tornado Special!',
      goal: 'Win 2 rounds or knock Mecha-Rat 32X out of the 3D Arena Ring!'
    },
    chronocheese: {
      id: 'chronocheese',
      title: 'CHRONO CHEESE',
      year: '1995',
      consoleId: 'sres91',
      consoleName: 'Super Ratita SRES 16-Bit (Chrono Trigger Copycat RPG)',
      genre: '16-Bit Time-Travel Active-Time-Battle RPG (Chrono Trigger Copycat)',
      controls: 'Arrows / WASD: Walk · SPACE: Talk / Attack · X: Cheese Beam Dual Tech',
      goal: 'Meet Luna, Pi-rat, Snowie, Candy & Torty in 600 A.D. and beat the Time Slimes leaking from the Time Gate!'
    },
    cybermaze95: {
      id: 'cybermaze95',
      title: 'WIREFRAME CYBER-MAZE \'95',
      year: '1995',
      consoleId: 'visor95',
      consoleName: 'Ratita Virtual-Visor 95 (Made-Up VR Visor)',
      genre: 'Red-LED Stereoscopic 3D Vector Shooter',
      controls: 'Left / Right: Steer Cyber-Tank · Up / Down: Thrust · SPACE / X: Fire Red Laser',
      goal: 'Blast wireframe drones and collect 5 Red Data Cores inside the Virtual-Visor grid!'
    }
  };

  /* ---------- Arcade Gang & 5 Family Pets in 1995 ---------- */
  RC.NPCS = {
    gary95: {
      id: 'gary95',
      name: '1995 Gary (Console Stand Manager)',
      role: 'Gary\'s \'95 Console Emporium · Frosted Tips & Flannel Era',
      quotes: [
        'Welcome to RETRO CENTRAL 1995, dude! Check out my frosted tips and flannel shirt—pretty radical, right? In 1983 I worked the prize counter, and now in \'95 I run the Console Stand!',
        'We\'ve got copycat consoles from 1983 all the way to 1995: the brand-new 64-bit Nintortuga 64 with Super Torty 64, the Sega-Paw 16-Bit with Speed Rat 1 & 2, the Super Ratita SRES, AND made-up consoles by Tortuga Tech and Ratita Industries!',
        'Every console you buy here gets delivered straight to your walk-in 1995 Retro Home through the east archway—hooked right up to your 32-inch CRT Tube TV!'
      ]
    },
    gus95: {
      id: 'gus95',
      name: '1995 Gus (Token & Pogs Booth)',
      role: 'Arcade Manager · Still Grumpy in 1995',
      quotes: [
        'Hmph! Welcome to 1995. Everybody\'s yelling about "64 bits" and "Blast Processing" and "Polygons." Back in 1983 we had EIGHT bits and we were grateful!',
        'Rule #1 of 1995: No Pogs slammers on the glass counters. Rule #2: No rollerblades on the neon carpet. Rule #3: Turn down that synthwave!',
        'My kid Gus Jr. keeps begging me for a Nintortuga 64 so he can play Super Torty 64. I told him he can play the 1983 cabinet until he learns some respect!'
      ]
    },
    larry95: {
      id: 'larry95',
      name: '1995 Larry (CRT Video Wall Tech)',
      role: 'Chief Maintenance · Backwards 90s Cap Edition',
      quotes: [
        'Howdy! Nothing beats the hum of six 1995 CRT television tubes warming up at once! You can feel the static electricity in your eyebrows!',
        'Gary hooked up the Nintortuga 64 and the Tortuga DreamBox 32X-CD to the main splitter. I just hit the degaussing button every twenty minutes—BWOOOONG!',
        'Have you checked out your 1995 Retro Home next door? I wired your living room entertainment center so every console you buy at Gary\'s stand switches automatically on your big CRT TV!'
      ]
    },
    comms95: {
      id: 'comms95',
      name: 'Lily & Mimi Chrono-Comms (1983 ◄► 1995 ◄► Present)',
      role: 'Ratita Industries Temporal Link · Time Lab & Time Jumper',
      quotes: [
        'MIMI: "HI HI HI FROM THE FUTURE!! You made it to Retro Central 1995!! Look at the neon carpet! Look at Super Torty 64 and Speed Rat!!"',
        'LILY: "Temporal coordinates confirmed: October 1995. The bridge between our 1983 opening year and the present day is stable. Also, Lili says your real saves are 100% safe."',
        'LILI: "QA report for 1995: Nintortuga 64 framerate is nominal. Speed Rat loop-de-loops are within safety tolerances. Do not feed pizza to the VCR."'
      ]
    },
    pet_luna: {
      id: 'pet_luna',
      name: 'Luna (Ratita Industries CEO · \'95 Windbreaker)',
      role: 'Family Pet Cameo #1 · By the Nintortuga 64 Kiosk',
      sound: 'Squeak!',
      quotes: [
        'Squeak! (Luna adjusts her 1995 neon windbreaker and backwards cap, pointing proudly at the Nintortuga 64 controller\'s analog stick!)',
        'Squeak! Squeak! (She helped wire the Virtual-Visor 95 and already got all 5 Golden Power Stars in Super Torty 64!)'
      ]
    },
    pet_pirat: {
      id: 'pet_pirat',
      name: 'Pi-rat (Chief Pirate Officer · \'95 Skateboard)',
      role: 'Family Pet Cameo #2 · By the Speed Rat \'91 Kiosk',
      sound: 'Squeak!',
      quotes: [
        'Squeak! (Pi-rat kickflips his 1995 neon skateboard and salutes with his eyepatch! He loves Speed Rat 1991\'s loop-de-loops and golden rings!)',
        'Squeak! (He whispers that holding X or Down+Space in Speed Rat 2 charges a supersonic Spin Dash!)'
      ]
    },
    pet_snowie: {
      id: 'pet_snowie',
      name: 'Snowie (Chief Fluff Engineer · \'95 Walkman & Legwarmers)',
      role: 'Family Pet Cameo #3 · By Gary\'s Console Stand',
      sound: 'Squeak!',
      quotes: [
        'Squeak! (Snowie bobs her head to 1995 synthwave on her yellow Walkman headphones and taps the Super Ratita SRES box!)',
        'Squeak! Squeak! (She packed a 250-ticket 1995 Launch Grant for you so you can buy consoles for your Retro Home right away!)'
      ]
    },
    pet_torty: {
      id: 'pet_torty',
      name: 'Torty / Martina (Tortuga Tech Founder · Red Plumber Cap)',
      role: 'Family Pet Cameo #4 · Star of Super Torty 64 & DreamBox',
      sound: 'Chomp-peep!',
      quotes: [
        'Torty tips her red "T" plumber cap! She starred in Super Torty 64 AND engineered the Tortuga DreamBox 32X-CD console!',
        'She points toward the Castle Courtyard in Super Torty 64—press SPACE three times while running to pull off a Triple Jump!'
      ]
    },
    pet_candy: {
      id: 'pet_candy',
      name: 'Candy (Ruffsources Director · \'95 Living Room VIP)',
      role: 'Family Pet Cameo #5 · Guarding Your 1995 Retro Home CRT TV',
      sound: 'Woof!',
      quotes: [
        'Woof! Woof! (Candy wags her fluffy tail on the beanbag rug in your 1995 Retro Home, guarding your pizza box and CRT Tube TV!)',
        'Woof! (She nudges the controller toward you—walk up to your CRT TV to play any console you bought at Gary\'s Console Stand!)'
      ]
    }
  };

  /* ---------- Persistent Save State ---------- */
  function defaultState() {
    return {
      welcomed95: true,
      owned: { res83: true, nintortuga64: true, segapaw: true }, // Start with 3 iconic consoles (RES-83, Nintortuga 64, Sega-Paw) ready + 3 more to buy at the stand!
      activeConsole: 'nintortuga64',
      stars64: 0,
      bestScores: { torty64: 0, speedrat1: 0, speedrat2: 0, plumber85: 0, shellfighter95: 0, cybermaze95: 0 },
      petsMet: {},
      scanlines: true
    };
  }

  var state = null;
  RC.load = function () {
    if (state) return state;
    try {
      var raw = JSON.parse(localStorage.getItem(KEY_SAVE));
      state = Object.assign(defaultState(), raw || {});
      state.owned = Object.assign({ res83: true, nintortuga64: true, segapaw: true }, (raw && raw.owned) || {});
      state.bestScores = Object.assign({ torty64: 0, speedrat1: 0, speedrat2: 0, plumber85: 0, shellfighter95: 0, cybermaze95: 0 }, (raw && raw.bestScores) || {});
      state.petsMet = Object.assign({}, (raw && raw.petsMet) || {});
    } catch (e) {
      state = defaultState();
    }
    // Ensure player has at least 350 tickets on first visit so they can buy all consoles right away if they want!
    try {
      var t = parseInt(localStorage.getItem(KEY_TIX), 10);
      if (isNaN(t) || t < 350) {
        localStorage.setItem(KEY_TIX, String(isNaN(t) ? 450 : Math.max(t, 350)));
      }
    } catch (e) {}
    return state;
  };

  RC.save = function () {
    if (!state) RC.load();
    try { localStorage.setItem(KEY_SAVE, JSON.stringify(state)); } catch (e) {}
  };

  RC.getTickets = function () {
    try {
      var t = parseInt(localStorage.getItem(KEY_TIX), 10);
      return isNaN(t) ? 450 : t;
    } catch (e) { return 450; }
  };

  RC.addTickets = function (n) {
    var next = Math.max(0, RC.getTickets() + (n | 0));
    try { localStorage.setItem(KEY_TIX, String(next)); } catch (e) {}
    if (RC.onHudChange) RC.onHudChange();
    return next;
  };

  RC.owns = function (cid) {
    var s = RC.load();
    return !!s.owned[cid];
  };

  RC.ownedCount = function () {
    var s = RC.load();
    return RC.CONSOLES.filter(function (c) { return !!s.owned[c.id]; }).length;
  };

  RC.buyConsole = function (cid) {
    var s = RC.load();
    var c = RC.CONSOLES.find(function (x) { return x.id === cid; });
    if (!c) return { ok: false, msg: 'Unknown console.' };
    if (s.owned[cid]) {
      s.activeConsole = cid;
      RC.save();
      if (RC.onConsolesChanged) RC.onConsolesChanged();
      return { ok: true, already: true, console: c };
    }
    var tix = RC.getTickets();
    if (tix < c.price) {
      return { ok: false, msg: 'Need ' + c.price + ' tickets (you have ' + tix + '). Play any mini-game or click "+200 1995 Promo Tickets"!' };
    }
    RC.addTickets(-c.price);
    s.owned[cid] = true;
    s.activeConsole = cid;
    RC.save();
    RC.sfx('buy');
    if (RC.onConsolesChanged) RC.onConsolesChanged();
    if (RC.onHudChange) RC.onHudChange();
    return { ok: true, console: c };
  };

  RC.unlockAllConsoles = function () {
    var s = RC.load();
    RC.CONSOLES.forEach(function (c) { s.owned[c.id] = true; });
    s.activeConsole = 'nintortuga64';
    RC.save();
    RC.sfx('star');
    if (RC.onConsolesChanged) RC.onConsolesChanged();
    if (RC.onHudChange) RC.onHudChange();
  };

  RC.recordScore = function (gameId, score, ticketsEarned) {
    var s = RC.load();
    if (score > (s.bestScores[gameId] || 0)) s.bestScores[gameId] = score;
    if (gameId === 'torty64') s.stars64 = Math.max(s.stars64 || 0, Math.min(5, Math.floor(score / 100)));
    RC.save();
    if (ticketsEarned > 0) RC.addTickets(ticketsEarned);
    if (RC.onHudChange) RC.onHudChange();
  };
})();
