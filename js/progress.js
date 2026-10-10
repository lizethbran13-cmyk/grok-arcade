/* Grok Arcade - progress: lifetime ticket stats, prize redemption, and the achievement system.
   Everything lives in localStorage under grokArcade.prog (tickets stay in grokArcade.tickets).
   Only things the arcade can really see are tracked: bonus game rounds + scores, hub actions, and main games LAUNCHED from the arcade. */
(function () {
  'use strict';
  var P = GA.Prog = {};
  var S = GA.store.get('prog', null), firstRun = !S;
  S = S || {};
  S.unlocked = S.unlocked || {}; S.owned = S.owned || {}; S.unseen = S.unseen || [];
  var st = S.stats = S.stats || {};
  st.earned = st.earned || 0; st.spent = st.spent || 0; st.rounds = st.rounds || 0; st.bests = st.bests || 0;
  st.played = st.played || {}; st.launched = st.launched || {}; st.ev = st.ev || {};
  if (firstRun) st.earned = Math.max(st.earned, GA.getTickets()); // tickets earned before achievements existed still count
  function save() { GA.store.set('prog', S); }

  /* ---------- tickets ---------- */
  var rawAdd = GA.addTickets;
  GA.addTickets = function (n) { var t = rawAdd(n); if (n > 0) { st.earned += n; save(); check(); } return t; };
  GA.spendTickets = function (n) {
    n = Math.floor(+n || 0); if (n <= 0) return false;
    var have = GA.getTickets(); if (have < n) return false; // never overspend
    GA.store.set('tickets', have - n); st.spent += n; save();
    if (GA.onTickets) GA.onTickets(have - n);
    return true;
  };

  /* ---------- prizes ---------- */
  P.owns = function (id) { return !!S.owned[id]; };
  P.ownedIds = function () { return GA.PRIZES.filter(function (p) { return S.owned[p.id]; }).map(function (p) { return p.id; }); };
  P.redeem = function (id) {
    var pr = GA.findPrize(id); if (!pr) return { ok: false, why: 'unknown' };
    if (pr.claw) return { ok: false, why: 'claw' };
    if (pr.vault) return { ok: false, why: 'vault' }; // basement rares: safe / Rare Prize Vault only // claw prizes are only won in the claw machines
    if (S.owned[id]) return { ok: false, why: 'owned' };
    if (GA.getTickets() < pr.price) return { ok: false, why: 'tickets', need: pr.price - GA.getTickets() };
    if (!GA.spendTickets(pr.price)) return { ok: false, why: 'tickets' };
    S.owned[id] = Date.now(); save(); check();
    if (GA.Hub && GA.Hub.refreshBoards) GA.Hub.refreshBoards();
    return { ok: true, left: GA.getTickets() };
  };
  // no category = Prize Counter prizes only (claw-machine prizes have their own goals, so old goals don't move)
  function nOwned(cat) { return GA.PRIZES.filter(function (p) { return S.owned[p.id] && (cat ? p.cat === cat : !p.claw && !p.vault); }).length; }
  function nPrizes(cat) { return GA.PRIZES.filter(function (p) { return cat ? p.cat === cat : !p.claw && !p.vault; }).length; }
  /* claw machine wins: the prize goes straight onto your gallery shelf (a repeat catch gives 2 bonus tickets instead) */
  P.clawWin = function (id, machine) {
    var pr = GA.findPrize(id); if (!pr || !pr.claw) return { ok: false };
    var dupe = !!S.owned[id];
    st.ev.clawWins = ev('clawWins') + 1; if (machine === 'tricky') st.ev.clawTricky = ev('clawTricky') + 1;
    if (!dupe) S.owned[id] = Date.now();
    save(); if (dupe) GA.addTickets(2); check();
    if (GA.Hub && GA.Hub.refreshBoards) GA.Hub.refreshBoards();
    return { ok: true, dupe: dupe };
  };
  /* Secret Basement / Rooftop rewards: put a prize on your shelf for free (safe -> Golden Key, Party Night -> Party Hat) */
  P.grant = function (id) { var pr = GA.findPrize(id); if (!pr || S.owned[id]) return false; S.owned[id] = Date.now(); save(); check(); if (GA.Hub && GA.Hub.refreshBoards) GA.Hub.refreshBoards(); return true; };
  /* the Rare Prize Vault in the Secret Basement sells vault prizes for tickets (only while you're down there) */
  P.vaultBuy = function (id) { var pr = GA.findPrize(id); if (!pr || !pr.vault || !pr.price) return { ok: false, why: 'unknown' }; if (S.owned[id]) return { ok: false, why: 'owned' };
    if (GA.getTickets() < pr.price) return { ok: false, why: 'tickets', need: pr.price - GA.getTickets() }; if (!GA.spendTickets(pr.price)) return { ok: false, why: 'tickets' };
    S.owned[id] = Date.now(); save(); check(); if (GA.Hub && GA.Hub.refreshBoards) GA.Hub.refreshBoards(); return { ok: true, left: GA.getTickets() }; };
  P.clawPlay = function (machine) { st.ev.clawPlays = ev('clawPlays') + 1; save(); check(); };

  /* ---------- achievements ---------- */
  function best(id) { return GA.getBest(id); }
  function bonusPlayed() { return GA.BONUS_GAMES.filter(function (g) { return st.played[g.id] || best(g.id) > 0; }).length; }
  function ev(k) { return st.ev[k] || 0; }
  var HS = { // per-game high score goals (tuned to each game's scoring)
    snake: [15, 'Long Snake', 'Score 15 in Grok Snake', '\uD83D\uDC0D'], bricks: [500, 'Brick Smasher', 'Score 500 in Brick Breaker', '\uD83E\uDDF1'],
    jet: [10, 'Ace Pilot', 'Fly through 10 gaps in Grok Jet', '\uD83D\uDE80'], rats: [20, 'Rat Booper', 'Score 20 in Whack-a-Rat', '\uD83D\uDC00'],
    stack: [15, 'Skyscraper', 'Stack 15 blocks in Stack Tower', '\uD83C\uDFD7\uFE0F'], wires: [30, 'Gary\u2019s Apprentice', 'Score 30 in Gary\u2019s Wire Rush', '\uD83D\uDD0C'],
    penalty: [6, 'Top Bins', 'Score 6 in Penalty Kick', '\u26BD'], fetch: [15, 'Good Girl, Candy!', 'Score 15 in Candy\u2019s Fetch', '\uD83D\uDC15'],
    ratmaze: [150, 'Maze Master', 'Score 150 in Rat Maze Dash', '\uD83E\uDDC0'], slice: [40, 'Neon Ninja', 'Score 40 in Neon Slice', '\uD83C\uDF49'],
    skee: [250, 'Skee-Ball Wizard', 'Score 250 in Skee-Ball', '\uD83C\uDFB3'],
    snack: [200, 'Snack Chef', 'Score 200 in Snack Stack', '\uD83E\uDDC1'],
    parking: [15, 'Parking Pro', 'Score 15 in Parking Panic', '\uD83C\uDD7F\uFE0F'],
    rush: [30, 'Rush Hour Hero', 'Score 30 in Rush Hour', '\uD83D\uDE95'],
    catch: [40, 'Critter Wrangler', 'Score 40 in Critter Catch', '\uD83D\uDC3E'],
    filing: [40, 'Master Archivist', 'Score 40 in Gus\u2019s Filing Frenzy', '\uD83D\uDDC4\uFE0F'],
    laser: [60, 'Laser Legend', 'Score 60 in Laser Dash', '\uD83D\uDD34'],
    dink: [40, 'Dink Master', 'Score 40 in Dink Duel', '\uD83C\uDFD3'],
    hoop: [45, 'Hoop Hero', 'Score 45 in Hoop Frenzy', '\uD83C\uDFC0'],
    drift: [40, 'Drift King', 'Score 40 in Spark Drift', '\uD83C\uDFCE\uFE0F'],
    meteor: [40, 'Disaster Master', 'Score 40 in Meteor Mayhem', '\u2604\uFE0F'],
    swing: [40, 'Tail Swinger', 'Score 40 in Tail Swing', '\uD83D\uDC00'],
    tame: [60, 'Monster Tamer', 'Score 60 in Tame Rush', '\uD83D\uDC32'],
    lockpick: [40, 'Master Locksmith', 'Score 40 in Lockpick Panic', '\uD83D\uDD10'],
    ghost: [45, 'Lantern Legend', 'Score 45 in Ghost Lantern \u201983', '\uD83C\uDFEE']
  };
  var A = [
    { id: 'first_ticket', cat: 'Tickets', icon: '\uD83C\uDF9F\uFE0F', name: 'First Ticket!', desc: 'Earn your first ticket in the Bonus Zone', p: function () { return [st.earned, 1]; } },
    { id: 'tickets_100', cat: 'Tickets', icon: '\uD83C\uDFAB', name: 'Ticket Collector', desc: 'Earn 100 tickets in total', p: function () { return [st.earned, 100]; } },
    { id: 'tickets_500', cat: 'Tickets', icon: '\uD83D\uDCB0', name: 'Ticket Tycoon', desc: 'Earn 500 tickets in total', p: function () { return [st.earned, 500]; } },
    { id: 'tickets_1000', cat: 'Tickets', icon: '\uD83D\uDC8E', name: 'Ticket Legend', desc: 'Earn 1,000 tickets in total', p: function () { return [st.earned, 1000]; } },
    { id: 'window_shop', cat: 'Prizes', icon: '\uD83D\uDC40', name: 'Window Shopper', desc: 'Visit the Prize Counter', p: function () { return [ev('counter'), 1]; } },
    { id: 'curator', cat: 'Prizes', icon: '\uD83D\uDDBC\uFE0F', name: 'Curator', desc: 'Visit the Achievement Gallery', p: function () { return [ev('gallery'), 1]; } },
    { id: 'first_prize', cat: 'Prizes', icon: '\uD83C\uDF81', name: 'First Prize', desc: 'Redeem your first prize', p: function () { return [nOwned(), 1]; } },
    { id: 'plush_3', cat: 'Prizes', icon: '\uD83E\uDDF8', name: 'Plush Pals', desc: 'Own 3 plushies', p: function () { return [nOwned('plush'), 3]; } },
    { id: 'rat_pack', cat: 'Prizes', icon: '\uD83D\uDC2D', name: 'The Rat Pack', desc: 'Own the Luna, Pi-rat and Snowie plushies', p: function () { return [['pl_luna', 'pl_pirat', 'pl_snowie'].filter(function (k) { return S.owned[k]; }).length, 3]; } },
    { id: 'plush_all', cat: 'Prizes', icon: '\uD83D\uDECF\uFE0F', name: 'Plush Paradise', desc: 'Collect every plushie', p: function () { return [nOwned('plush'), nPrizes('plush')]; } },
    { id: 'spend_500', cat: 'Prizes', icon: '\uD83D\uDCB8', name: 'Big Spender', desc: 'Spend 500 tickets at the Prize Counter', p: function () { return [st.spent, 500]; } },
    { id: 'half_shelf', cat: 'Prizes', icon: '\uD83D\uDDC4\uFE0F', name: 'Half-Full Shelves', desc: 'Own half of all the prizes', p: function () { return [nOwned(), Math.ceil(nPrizes() / 2)]; } },
    { id: 'golden_joy', cat: 'Prizes', icon: '\uD83D\uDD79\uFE0F', name: 'Golden Gamer', desc: 'Win the legendary Golden Joystick', p: function () { return [S.owned.golden_joy ? 1 : 0, 1]; } },
    { id: 'collection', cat: 'Prizes', icon: '\uD83D\uDC51', name: 'Completionist', desc: 'Own every prize from the Prize Counter', p: function () { return [nOwned(), nPrizes()]; } },
    { id: 'bonus_zone', cat: 'Arcade', icon: '\uD83D\uDEAA', name: 'Into the Bonus Zone', desc: 'Walk through the door into the Bonus Zone', p: function () { return [ev('bonusZone'), 1]; } },
    { id: 'all_bonus', cat: 'Arcade', icon: '\uD83C\uDFAE', name: 'Bonus Explorer', desc: 'Play every bonus mini game cabinet', p: function () { return [bonusPlayed(), GA.BONUS_GAMES.length]; } },
    { id: 'all_main', cat: 'Arcade', icon: '\uD83C\uDF0D', name: 'World Tour', desc: 'Launch every main game from the arcade', p: function () { return [GA.MAIN_GAMES.filter(function (g) { return st.launched[g.id]; }).length, GA.MAIN_GAMES.length]; } },
    { id: 'rounds_25', cat: 'Arcade', icon: '\u23F1\uFE0F', name: 'Arcade Regular', desc: 'Play 25 bonus game rounds', p: function () { return [st.rounds, 25]; } },
    { id: 'rounds_100', cat: 'Arcade', icon: '\uD83C\uDFC5', name: 'Arcade Legend', desc: 'Play 100 bonus game rounds', p: function () { return [st.rounds, 100]; } },
    { id: 'record_10', cat: 'Arcade', icon: '\uD83D\uDCC8', name: 'Record Breaker', desc: 'Beat your own best score 10 times', p: function () { return [st.bests, 10]; } },
    { id: 'antenna', cat: 'Antenna', icon: '\uD83D\uDCE1', name: 'On the Air', desc: 'Open the Multiplayer Antenna lobby', p: function () { return [ev('antenna'), 1]; } },
    { id: 'room', cat: 'Antenna', icon: '\uD83E\uDD1D', name: 'Squad Up', desc: 'Host or join a multiplayer room', p: function () { return [ev('room'), 1]; } },
    { id: 'gary_fix', cat: 'Antenna', icon: '\uD83D\uDD27', name: 'Call IT!', desc: 'Get Gary from IT to fix the antenna', p: function () { return [ev('garyFix'), 1]; } },
    { id: 'wire_fix', cat: 'Antenna', icon: '\u26A1', name: 'Wire Wizard', desc: 'Fix the antenna wires yourself', p: function () { return [ev('wireFix'), 1]; } },
    { id: 'zapped', cat: 'Antenna', icon: '\uD83D\uDE35', name: 'Shocking!', desc: 'Cross the wires and get zapped', p: function () { return [ev('zapped'), 1]; } },
    { id: 'gary_chat', cat: 'Antenna', icon: '\u2615', name: 'Small Talk', desc: 'Chat with Gary when nothing is broken', p: function () { return [ev('garyChat'), 1]; } }
  ];
  GA.BONUS_GAMES.forEach(function (g) {
    var h = HS[g.id]; if (!h) return;
    A.push({ id: 'hs_' + g.id, cat: 'High Scores', icon: h[3], name: h[1], desc: h[2], game: g.id, p: function () { return [best(g.id), h[0]]; } });
  });
  A.push({ id: 'slice_combo', cat: 'High Scores', icon: '\uD83D\uDD2A', name: 'Combo Chef', desc: 'Slice 4 fruits with one swipe in Neon Slice', p: function () { return [ev('sliceCombo'), 4]; } });
  A.push({ id: 'slice_clean', cat: 'High Scores', icon: '\uD83E\uDDFC', name: 'Clean Cut', desc: 'Score 20 in Neon Slice without dropping a fruit', p: function () { return [ev('sliceClean'), 20]; } });
  A.push({ id: 'skee_100', cat: 'High Scores', icon: '\uD83D\uDCAF', name: 'Hundred Club', desc: 'Sink a Skee-Ball in a 100 pocket', p: function () { return [ev('skee100') ? 1 : 0, 1]; } });
  A.push({ id: 'snack_tower', cat: 'High Scores', icon: '\uD83C\uDF70', name: 'Tower of Treats', desc: 'Serve a pile of 10+ snacks in Snack Stack', p: function () { return [ev('snack10') ? 1 : 0, 1]; } });
  A.push({ id: 'rush_streak', cat: 'High Scores', icon: '\uD83D\uDEE3\uFE0F', name: 'Smooth Operator', desc: 'Pass 25 cars in a row without a bonk in Rush Hour', p: function () { return [ev('rush25') ? 1 : 0, 1]; } });
  A.push({ id: 'catch_shiny', cat: 'High Scores', icon: '\u2728', name: 'Shiny Hunter', desc: 'Catch 3 shiny critters in one game of Critter Catch', p: function () { return [ev('catchShiny3') ? 1 : 0, 1]; } });
  A.push({ id: 'park_streak', cat: 'High Scores', icon: '\uD83D\uDE97', name: 'Valet Legend', desc: 'Park 10 cars in a row in Parking Panic', p: function () { return [ev('park10') ? 1 : 0, 1]; } });
  A.push({ id: 'dash_team', cat: 'Prizes', icon: '\uD83D\uDCA8', name: 'Team Dash', desc: 'Own the Grok Dash Hero, Speedy and Floaty plushies', p: function () { return [['pl_dash', 'pl_speedy', 'pl_floaty'].filter(function (k) { return S.owned[k]; }).length, 3]; } });
  A.push({ id: 'ring_lord', cat: 'Prizes', icon: '\uD83D\uDCAB', name: 'Lord of the Ring', desc: 'Win the Golden Ring Trophy', p: function () { return [S.owned.tr_ring ? 1 : 0, 1]; } });
  A.push({ id: 'spook_squad', cat: 'Prizes', icon: '\uD83D\uDC7B', name: 'Spook Squad', desc: 'Own the Goob, Shy Boo and Countess Waltzy plushies', p: function () { return [['pl_goob', 'pl_boo', 'pl_waltzy'].filter(function (k) { return S.owned[k]; }).length, 3]; } });
  A.push({ id: 'vac_owner', cat: 'Prizes', icon: '\uD83C\uDF00', name: 'Who You Gonna Call?', desc: 'Win the Grok-Vac Replica', p: function () { return [S.owned.vac_replica ? 1 : 0, 1]; } });
  A.push({ id: 'sanctuary', cat: 'Prizes', icon: '\uD83E\uDD93', name: 'Sanctuary Keeper', desc: 'Own the Blocky Zebra, Baby Rhino and Snow Leopard plushies', p: function () { return [['pl_zebra', 'pl_rhino', 'pl_leopard'].filter(function (k) { return S.owned[k]; }).length, 3]; } });
  A.push({ id: 'road_trip', cat: 'Prizes', icon: '\uD83D\uDE97', name: 'Road Trip Crew', desc: 'Own the Grokloon Plush, Monster Truck Replica and Taxi Roof Light Hat', p: function () { return [['pl_grokloon', 'rides_monster', 'taxi_hat'].filter(function (k) { return S.owned[k]; }).length, 3]; } });
  A.push({ id: 'filing_streak', cat: 'High Scores', icon: '\uD83D\uDCC1', name: 'Gus Almost Smiled', desc: 'File 20 folders in a row in Gus\u2019s Filing Frenzy', p: function () { return [ev('filingCombo20') ? 1 : 0, 1]; } });
  A.push({ id: 'hall_visit', cat: 'Arcade', icon: '\uD83C\uDFDB\uFE0F', name: 'Museum Goer', desc: 'Visit an exhibit in the Hall of Game Records', p: function () { return [ev('hallSeen'), 1]; } });
  A.push({ id: 'hall_all', cat: 'Arcade', icon: '\uD83D\uDCDC', name: 'Records Keeper', desc: 'Visit every exhibit in the Hall of Game Records', p: function () { return [ev('hallSeen'), GA.MAIN_GAMES.length]; } });
  A.push({ id: 'old_version', cat: 'Arcade', icon: '\uD83D\uDCFC', name: 'Retro Gamer', desc: 'Play an old version of a game from the Hall of Game Records', p: function () { return [ev('oldVersion'), 1]; } });
  A.push({ id: 'dlc_idea', cat: 'Arcade', icon: '\uD83D\uDDA8\uFE0F', name: 'DLC Dreamer', desc: 'Submit a DLC idea at the DLC Machine 3000', p: function () { return [ev('dlcIdea'), 1]; } });
  A.push({ id: 'dlc_owner', cat: 'Prizes', icon: '\uD83C\uDF81', name: 'Day-One DLC', desc: 'Unlock a shipped DLC with tickets', p: function () { return [ev('dlcBuy'), 1]; } });
  A.push({ id: 'gus_fan', cat: 'Prizes', icon: '\uD83E\uDDD3', name: 'Gus\u2019s Biggest Fan', desc: 'Own the Grumpy Gus Plush and the DLC Machine 3000 Replica', p: function () { return [['pl_gus', 'dlc_replica'].filter(function (k) { return S.owned[k]; }).length, 2]; } });
  A.push({ id: 'poke_pals', cat: 'Prizes', icon: '\uD83D\uDC3E', name: 'Critter Collector', desc: 'Own the Embercub, Puddlepup and Leafkit plushies', p: function () { return [['pl_embercub', 'pl_puddlepup', 'pl_leafkit'].filter(function (k) { return S.owned[k]; }).length, 3]; } });
  A.push({ id: 'laser_streak', cat: 'High Scores', icon: '\uD83E\uDD77', name: 'Untouchable', desc: 'Pass 20 lasers in a row without an alarm in Laser Dash', p: function () { return [ev('laser20') ? 1 : 0, 1]; } });
  A.push({ id: 'master_thief', cat: 'Prizes', icon: '\uD83D\uDC8E', name: 'Master Thief', desc: 'Own the Baron Grumble Plush, the Moonstone Diamond Replica and the Getaway Van Replica', p: function () { return [['pl_baron', 'moonstone', 'heist_van'].filter(function (k) { return S.owned[k]; }).length, 3]; } });
  A.push({ id: 'dink_perfect', cat: 'High Scores', icon: '\uD83E\uDD52', name: 'Soft Hands', desc: 'Hit 5 PERFECT dinks in one game of Dink Duel', p: function () { return [ev('dinkPerfect5') ? 1 : 0, 1]; } });
  A.push({ id: 'pickle_squad', cat: 'Prizes', icon: '\uD83E\uDD52', name: 'Pickle Squad', desc: 'Own the Pickle Pal Plush, the Golden Paddle Trophy and the Pickleball Visor', p: function () { return [['pl_pickle', 'tr_paddle', 'pb_visor'].filter(function (k) { return S.owned[k]; }).length, 3]; } });
  A.push({ id: 'hoop_streak', cat: 'High Scores', icon: '\uD83D\uDD25', name: 'On Fire', desc: 'Make 5 shots in a row in Hoop Frenzy', p: function () { return [ev('hoop5') ? 1 : 0, 1]; } });
  A.push({ id: 'drift_ultra', cat: 'High Scores', icon: '\uD83D\uDFE3', name: 'Purple Streak', desc: 'Fire 5 ULTRA turbos in a row in Spark Drift', p: function () { return [ev('drift5') ? 1 : 0, 1]; } });
  A.push({ id: 'kart_champ', cat: 'Prizes', icon: '\uD83C\uDFC1', name: 'Kart Party Champ', desc: 'Own the Chinchino Racer Plush, the Party Kart Replica and the Grand Prix Gold Cup', p: function () { return [['pl_chinchino', 'kart_model', 'tr_kart'].filter(function (k) { return S.owned[k]; }).length, 3]; } });
  A.push({ id: 'all_star', cat: 'Prizes', icon: '\u2B50', name: 'All-Star', desc: 'Own the MVP Bear Plush, the Golden Bowling Pin and the Sports Command Cup', p: function () { return [['pl_mvp', 'gold_pin', 'tr_sports'].filter(function (k) { return S.owned[k]; }).length, 3]; } });
  A.push({ id: 'meteor_close', cat: 'High Scores', icon: '\uD83D\uDE2E', name: 'Daredevil', desc: 'Get 10 CLOSE CALLS in one game of Meteor Mayhem', p: function () { return [ev('meteorClose10') ? 1 : 0, 1]; } });
  A.push({ id: 'storm_chaser', cat: 'Prizes', icon: '\uD83C\uDF2A\uFE0F', name: 'Storm Chaser', desc: 'Own the Roargon Plush, the Area 51 UFO Model and the Disaster Survivor Cup', p: function () { return [['pl_roargon', 'ufo_model', 'tr_disaster'].filter(function (k) { return S.owned[k]; }).length, 3]; } });
  A.push({ id: 'swing_rings', cat: 'High Scores', icon: '\uD83E\uDE9D', name: 'Ring Zipper', desc: 'Swing from 25 rings in one game of Tail Swing', p: function () { return [ev('swing25') ? 1 : 0, 1]; } });
  A.push({ id: 'house_hero', cat: 'Prizes', icon: '\uD83E\uDDC0', name: 'House Hero', desc: 'Own the Pi-rat Plush, the Martina & Friends Figure and the House Rescued Cup', p: function () { return [['pl_pirat', 'md_martina', 'tr_ratita'].filter(function (k) { return S.owned[k]; }).length, 3]; } });
  A.push({ id: 'tame_three', cat: 'High Scores', icon: '\uD83D\uDC96', name: 'Beast Friend', desc: 'Tame 3 monsters in one game of Tame Rush', p: function () { return [ev('tame3') ? 1 : 0, 1]; } });
  A.push({ id: 'hunter_master', cat: 'Prizes', icon: '\uD83D\uDDE1\uFE0F', name: 'Master Hunter', desc: 'Own the Mochi Buddy Plush, the Starfang Statue and the Monster Hunters Cup', p: function () { return [['pl_mochi', 'starfang_statue', 'tr_hunters'].filter(function (k) { return S.owned[k]; }).length, 3]; } });
  A.push({ id: 'designer', cat: 'Arcade', icon: '\uD83D\uDCA1', name: 'Game Designer', desc: 'Send your first patch suggestion from the Suggestion Booth', p: function () { return [ev('suggest') ? 1 : 0, 1]; } });
  A.push({ id: 'claw_first', cat: 'Claw', icon: '\uD83E\uDE9D', name: 'Claw Catcher', desc: 'Win a prize from a claw machine', p: function () { return [ev('clawWins') ? 1 : 0, 1]; } });
  A.push({ id: 'claw_tricky', cat: 'Claw', icon: '\uD83C\uDFAF', name: 'Steady Hands', desc: 'Win a prize from the Tricky Claw', p: function () { return [ev('clawTricky') ? 1 : 0, 1]; } });
  A.push({ id: 'claw_10', cat: 'Claw', icon: '\uD83E\uDDF2', name: 'Claw Collector', desc: 'Collect 10 different claw machine prizes', p: function () { return [nOwned('claw'), 10]; } });
  A.push({ id: 'view3d', cat: 'Prizes', icon: '\uD83D\uDD0D', name: 'Up Close', desc: 'Look at a prize or medal in 3D view', p: function () { return [ev('view3d') ? 1 : 0, 1]; } });
  A.push({ id: 'carry', cat: 'Prizes', icon: '\u270B', name: 'Show-Off', desc: 'Carry a prize around the arcade', p: function () { return [ev('carry') ? 1 : 0, 1]; } });
  A.push({ id: 'hat_on', cat: 'Prizes', icon: '\uD83E\uDDE2', name: 'Hat Day', desc: 'Wear a hat from the Prize Counter', p: function () { return [ev('wearHat') ? 1 : 0, 1]; } });
  A.push({ id: 'hub_friends', cat: 'Antenna', icon: '\uD83D\uDC6F', name: 'Arcade Buddies', desc: 'Walk around the arcade with a friend in your room', p: function () { return [ev('hubFriends') ? 1 : 0, 1]; } });
  A.push({ id: 'battle_win', cat: 'Antenna', icon: '\u2694\uFE0F', name: 'Arcade Rival', desc: 'Win a Bonus Zone battle against a friend', p: function () { return [ev('battleWin') ? 1 : 0, 1]; } });
  // Food Court / Rooftop Party Deck / Secret Basement
  A.push({ id: 'area_tour', cat: 'Arcade', icon: '\uD83D\uDDFA\uFE0F', name: 'Grand Tour', desc: 'Visit the Food Court, the Rooftop Party Deck and the Secret Basement', p: function () { return [['fcVisit', 'rfVisit', 'bsVisit'].filter(function (k) { return ev(k); }).length, 3]; } });
  A.push({ id: 'fc_snack', cat: 'Arcade', icon: '\uD83C\uDF55', name: 'Snack Time', desc: 'Buy a snack at the Food Court Snack Bar', p: function () { return [ev('fcSnack') ? 1 : 0, 1]; } });
  // The Mysterious Attic
  A.push({ id: 'mimi_hi', cat: 'Attic', icon: '\uD83E\uDD16', name: 'New Best Friend', desc: 'Say hi to Mimi the Bot at Customer Relations', p: function () { return [ev('mimiTalk') ? 1 : 0, 1]; } });
  A.push({ id: 'mimi_nav', cat: 'Attic', icon: '\uD83E\uDDED', name: 'Follow the Arrows', desc: 'Let Mimi guide you somewhere', p: function () { return [ev('mimiNav') ? 1 : 0, 1]; } });
  A.push({ id: 'mimi_gift', cat: 'Attic', icon: '\uD83C\uDF81', name: 'Mimi\u2019s Gift', desc: 'Get Mimi\u2019s daily ticket gift', p: function () { return [ev('mimiGift') ? 1 : 0, 1]; } });
  A.push({ id: 'mimi_reboot', cat: 'Attic', icon: '\u26A1', name: 'Have You Tried Turning It Off and On?', desc: 'Reset the main breaker during a power outage', p: function () { return [ev('mimiReboot') ? 1 : 0, 1]; } });
  A.push({ id: 'at_find', cat: 'Attic', icon: '\uD83D\uDD78\uFE0F', name: 'Something Creaks', desc: 'Find the hidden attic hatch', p: function () { return [ev('atFound') ? 1 : 0, 1]; } });
  A.push({ id: 'at_ladder', cat: 'Attic', icon: '\uD83E\uDE9C', name: 'Ladder Lugger', desc: 'Borrow Gary\u2019s ladder and set it up under the hatch', p: function () { return [(ev('atLadderGet') ? 1 : 0) + (ev('atLadder') ? 1 : 0), 2]; } });
  A.push({ id: 'at_fuse', cat: 'Attic', icon: '\u26A1', name: 'Fuse Fixer', desc: 'Sort Larry\u2019s fuse rack and install the fuse', p: function () { return [(ev('atFuse') ? 1 : 0) + (ev('atFuseIn') ? 1 : 0), 2]; } });
  A.push({ id: 'at_reunion', cat: 'Attic', icon: '\uD83E\uDD17', name: 'Family Reunion', desc: 'Bring Larry\u2019s postcard to his little brother Gary', p: function () { return [ev('atReunion') ? 1 : 0, 1]; } });
  A.push({ id: 'at_ghost', cat: 'Attic', icon: '\uD83D\uDC7B', name: 'Lantern Lit', desc: 'Beat the target score on Ghost Lantern \u201983', p: function () { return [ev('atGhost') ? 1 : 0, 1]; } });
  A.push({ id: 'at_open', cat: 'Attic', icon: '\uD83C\uDFDA\uFE0F', name: 'Up We Go', desc: 'Crack the keypad and climb into the Mysterious Attic', p: function () { return [ev('atOpen') ? 1 : 0, 1]; } });
  A.push({ id: 'at_clues', cat: 'Attic', icon: '\uD83D\uDD0D', name: 'Clue Hunter', desc: 'Find all 3 clues in the attic', p: function () { return [Math.min(3, ev('atClues')), 3]; } });
  A.push({ id: 'at_library', cat: 'Attic', icon: '\uD83D\uDCDA', name: 'Bookworm', desc: 'Open the long corridor and the library\u2019s secret bookcase', p: function () { return [(ev('atDoor1') ? 1 : 0) + (ev('atBooks') ? 1 : 0), 2]; } });
  A.push({ id: 'at_stars', cat: 'Attic', icon: '\uD83D\uDD2D', name: 'Stargazer', desc: 'Find a ghost constellation through the observatory telescope', p: function () { return [ev('atStars') ? 1 : 0, 1]; } });
  A.push({ id: 'at_orbs', cat: 'Attic', icon: '\uD83D\uDD2E', name: 'Marble Collector', desc: 'Find all 8 spirit marbles hidden around the attic', p: function () { return [Math.min(8, ev('atOrbs')), 8]; } });
  A.push({ id: 'at_weekly', cat: 'Attic', icon: '\u2699\uFE0F', name: 'Weekly Ghostbuster', desc: 'Solve the attic\u2019s weekly puzzle room', p: function () { return [ev('atWeekly') ? 1 : 0, 1]; } });
  A.push({ id: 'at_opus', cat: 'Attic', icon: '\uD83C\uDFBC', name: 'Mystery Opus', desc: 'Find a week\u2019s hidden sheet of mystery music', p: function () { return [ev('atOpus') ? 1 : 0, 1]; } });
  A.push({ id: 'gal_pick', cat: 'Arcade', icon: '\uD83E\uDDE2', name: 'Gus Jr. Approved', desc: 'Visit the Game Gallery and ask Gus Jr. the 2nd what to play', p: function () { return [(ev('galVisit') ? 1 : 0) + (ev('gjRec') ? 1 : 0), 2]; } });
  A.push({ id: 'fc_chef', cat: 'Arcade', icon: '\uD83D\uDC68\u200D\uD83C\uDF73', name: 'Sous Chef', desc: 'Cook a PERFECT pizza with Chef Gio', p: function () { return [ev('fcPerfect') ? 1 : 0, 1]; } });
  A.push({ id: 'rf_party', cat: 'Arcade', icon: '\uD83C\uDF86', name: 'Party Animal', desc: 'Dance on the rooftop floor and launch a firework', p: function () { return [(ev('rfDance') ? 1 : 0) + (ev('rfFirework') ? 1 : 0), 2]; } });
  A.push({ id: 'bs_key', cat: 'Arcade', icon: '\uD83D\uDD11', name: 'Finders Keepers', desc: 'Find Gus\u2019s hidden basement key', p: function () { return [ev('bsKey') ? 1 : 0, 1]; } });
  A.push({ id: 'bs_pick', cat: 'Arcade', icon: '\uD83D\uDD13', name: 'Lock Picker', desc: 'Pick the lock on the basement door', p: function () { return [ev('bsPick') ? 1 : 0, 1]; } });
  A.push({ id: 'bs_puzzle', cat: 'Arcade', icon: '\uD83E\uDDE9', name: 'Puzzle Master', desc: 'Fix the basement fuse box and crack Gus\u2019s code safe', p: function () { return [(ev('bsFuse') ? 1 : 0) + (ev('bsSafe') ? 1 : 0), 2]; } });
  A.push({ id: 'bs_retro', cat: 'High Scores', icon: '\uD83D\uDCFA', name: 'Retro Legend', desc: 'Play both rare cabinets in the Secret Basement (Paddle Pong + Galaxy Groks)', p: function () { return [['rt_pong', 'rt_invaders'].filter(function (k) { return st.played[k] || best(k) > 0; }).length, 2]; } });
  A.push({ id: 'party_set', cat: 'Prizes', icon: '\uD83E\uDD73', name: 'Life of the Party', desc: 'Own the Chef Gio Plush, the Rooftop Party Hat and the Mini Disco Ball', p: function () { return [['pl_chef', 'party_hat', 'disco_ball'].filter(function (k) { return S.owned[k]; }).length, 3]; } });
  A.push({ id: 'vault_rares', cat: 'Prizes', icon: '\uD83D\uDC8E', name: 'Vault Keeper', desc: 'Own both Basement Rares: Gus\u2019s Golden Key and the Mini Retro Cabinet', p: function () { return [['gold_key', 'retro_cab'].filter(function (k) { return S.owned[k]; }).length, 2]; } });
  GA.ACHIEVEMENTS = A;

  function prog(a) { var r = a.p(); return { cur: Math.min(r[0] || 0, r[1]), goal: r[1] }; }
  function check(silent) {
    var fresh = [];
    A.forEach(function (a) {
      if (S.unlocked[a.id]) return;
      var q = prog(a); if (q.goal > 0 && q.cur >= q.goal) { S.unlocked[a.id] = Date.now(); fresh.push(a.id); }
    });
    if (fresh.length) {
      if (!silent) { S.unseen = S.unseen.concat(fresh); }
      save(); if (!silent) pump();
      if (GA.Hub && GA.Hub.refreshBoards) try { GA.Hub.refreshBoards(); } catch (e) {}
    }
    return fresh;
  }

  /* ---------- events from the arcade ---------- */
  P.event = function (k, v) {
    if (v != null) st.ev[k] = Math.max(ev(k), +v || 0); else st.ev[k] = ev(k) + 1;
    save(); check();
  };
  P.onGameOver = function (id, score, isNew) {
    st.rounds++; st.played[id] = (st.played[id] || 0) + 1; if (isNew && score > 0) st.bests++;
    save(); check();
  };
  P.onLaunch = function (id) { st.launched[id] = 1; save(); check(); };

  /* ---------- unlock toasts (queued; unseen ones survive a page change) ---------- */
  var toastEl = null, showing = false;
  function pump() {
    if (showing || !S.unseen.length || !document.body) return;
    var id = S.unseen.shift(); save();
    var a = A.find(function (x) { return x.id === id; }); if (!a) { pump(); return; }
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.id = 'achToast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); document.body.appendChild(toastEl); toastEl.addEventListener('click', function () { toastEl.classList.remove('on'); }); }
    toastEl.innerHTML = '<div class="atIcon"></div><div class="atTxt"><small>ACHIEVEMENT UNLOCKED</small><b></b><span></span></div>';
    toastEl.querySelector('.atIcon').textContent = a.icon; toastEl.querySelector('b').textContent = a.name; toastEl.querySelector('span').textContent = a.desc;
    toastEl.setAttribute('data-ach', a.id);
    showing = true; void toastEl.offsetWidth; toastEl.classList.add('on');
    try { GA.Audio.play('best'); } catch (e) {}
    P._lastToast = a.id; P._toasts = (P._toasts || 0) + 1;
    setTimeout(function () { toastEl.classList.remove('on'); setTimeout(function () { showing = false; pump(); }, 380); }, 3000);
  }

  /* ---------- public reads (UI + tests) ---------- */
  P.list = function () { return A.map(function (a) { var q = prog(a); return { id: a.id, cat: a.cat, icon: a.icon, name: a.name, desc: a.desc, cur: q.cur, goal: q.goal, unlocked: !!S.unlocked[a.id], at: S.unlocked[a.id] || 0 }; }); };
  P.isUnlocked = function (id) { return !!S.unlocked[id]; };
  P.counts = function () { return { ach: Object.keys(S.unlocked).filter(function (k) { return A.some(function (a) { return a.id === k; }); }).length, achTotal: A.length, prizes: GA.PRIZES.filter(function (p) { return S.owned[p.id]; }).length, prizeTotal: GA.PRIZES.length, claw: nOwned('claw'), clawTotal: nPrizes('claw') }; };
  P.stats = function () { return JSON.parse(JSON.stringify(st)); };
  P.check = check;

  function init() {
    var got = check(firstRun);
    if (firstRun) {
      save();
      // wait until the player is in the hub (not on the title screen) before announcing
      if (got.length) { var tries = 0, iv = setInterval(function () { var hud = document.getElementById('hud'); if (++tries > 240) clearInterval(iv); if (hud && !hud.classList.contains('hidden')) { clearInterval(iv); setTimeout(function () { if (GA.Fix && GA.Fix.toast) GA.Fix.toast('New: Achievements! You already unlocked ' + got.length + '. See them in the Achievement Gallery.', 4500); }, 1200); } }, 500); }
    }
    pump();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
