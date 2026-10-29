/* Grok Arcade - game catalog */
window.GA = window.GA || {};
/* #60: every GitHub board read (Suggestion Board, DLC Board, Lili's board) goes through here: it always revalidates (so a stale copy never
   sticks; an unchanged answer is a free 304 that doesn't use up GitHub's 60-an-hour limit) and gives up after 12 s instead of
   leaving a board stuck on "Loading..." forever (a stalled request on a phone used to block every later refresh). */
GA.ghFetch = function (url, ms) {
  var ac = null, tm = 0; try { ac = new AbortController(); } catch (e) {}
  var p = fetch(url, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-cache', signal: ac ? ac.signal : undefined });
  var to = new Promise(function (_, rej) { tm = setTimeout(function () { try { if (ac) ac.abort(); } catch (e) {} rej(new Error('timeout')); }, ms || 12000); });
  return Promise.race([p, to]).then(function (r) { clearTimeout(tm); return r; }, function (e) { clearTimeout(tm); throw e; });
};
/* #60: ONE GitHub request feeds all three boards (Suggestion Board, DLC Board, Lili's board): each board used to make its own, so a
   couple of visits (or reloads) used up GitHub's 60-checks-an-hour limit for the whole house and the boards stopped updating.
   Requests in flight are shared, and an answer less than 45 s old is reused. */
(function () {
  var URL = 'https://api.github.com/repos/lizethbran13-cmyk/grok-arcade/issues?state=all&per_page=100&sort=updated', last = null, inflight = null;
  GA.ghIssues = function (force) {
    if (inflight) return inflight;
    if (last && Date.now() - last.t < (force ? 45000 : 120000)) return Promise.resolve(last.a);
    inflight = GA.ghFetch(URL).then(function (r) {
      if (!r.ok) { var e = new Error('http ' + r.status); e.status = r.status; e.reset = +r.headers.get('x-ratelimit-reset') || 0; throw e; }
      return r.json();
    }).then(function (a) { if (!Array.isArray(a)) throw new Error('bad data'); last = { t: Date.now(), a: a }; inflight = null; return a; },
      function (e) { inflight = null; throw e; });
    return inflight;
  };
  GA.ghLabeled = function (a, lab) { return (a || []).filter(function (it) { return (it.labels || []).some(function (l) { return String(l.name || l).toLowerCase() === lab; }); }); };
})();
GA.MAIN_GAMES = [
  { id: 'sky', mp: true, name: 'Grok Sky', desc: 'REMASTERED on the Cloudfront Engine! Fly real planes, from a Cessna to the A380, across 10 cities with friends, then ride Starship to the Moon and Mars. Now with puffy 3D cumulus & anvil cloud banks, 6 live moving weather fronts (Clear, Scattered, Rain Squall, Thunderhead, Snow Front, Golden Sunset), a glass-cockpit PFD with live weather radar, and the Pet Crew Weather Station with Tortuga & Ratita co-pilots!',
    url: 'https://lizethbran13-cmyk.github.io/grok-arcade/grok-sky-remastered/', color: '#38bdf8', color2: '#fde047' },
  { id: 'land', mp: true, name: 'Grok Land', desc: 'A 3D platformer adventure across 8 worlds.',
    url: 'https://lizethbran13-cmyk.github.io/grok-land/', color: '#4ade80', color2: '#f97316' },
  { id: 'land2', mp: true, name: 'Grok Land 2', desc: 'THE SEQUEL! Three high-speed Boost Zones (Meadow Rush, Canyon Rush and Shell Speedway) with a boost meter, grind rails, loops, homing attacks, air dash and S-A-B-C ranks. New worlds: Red Rock Trail, Mesa Mines, Ratita\u2019s Cheese Conveyor and Tortuga Tech\u2019s Shell-Tough Test Track, plus all 12 classic levels with new graphics. Online co-op and cameos from Luna, Pi-rat, Snowie, Candy and Torty!',
    url: 'https://lizethbran13-cmyk.github.io/grok-land-2/', color: '#22d3ee', color2: '#facc15' },
  { id: 'grid', mp: true, name: 'Grok Grid', desc: 'F1-style racing on 8 tracks, now with easier steering. Go for pole! NEW DLC: Super Grid Expansion.',
    url: 'https://lizethbran13-cmyk.github.io/grok-grid/', color: '#f43f5e', color2: '#ffffff' },
  { id: 'grid2', mp: true, name: 'Grok Grid 2', desc: 'THE SEQUEL! High-speed racing across 14 circuits (including Tortuga Superspeedway, Indy Brickyard GP and Tokyo Neon Drift) in 4 racing series (Formula, IndyCar, Stock Car & Drift), 8 rides, Drift Boost Chains (x1 to x5 Overdrive), Luna\u2019s Garage Tuning, Candy\u2019s Pit Tow, and all 5 family pets in the Super Grid Hub!',
    url: 'https://lizethbran13-cmyk.github.io/grok-arcade/grok-grid-2/', color: '#ff4a1c', color2: '#00e8ff' },
  { id: 'voxels', mp: true, name: 'Grok Voxels: Re-Voxeled', desc: 'REMASTERED on the Re-Voxeled 4.0 engine! Up to 8 real-time dynamic point lights, directional sun shadows + voxel ambient occlusion, 3 live shader modes (Re-Voxeled Ultra, Neon Overdrive, Classic), physical 3D ammo & ejected casings, 7 courses including Tortuga Bio-Dome & Solar Citadel, Exo-Armor & Thermal Jam with Field Repair, and all 5 family pets in the Tortuga Forward Base. Co-op online!',
    url: 'https://lizethbran13-cmyk.github.io/grok-arcade/voxels-re-voxeled/', color: '#a855f7', color2: '#22d3ee' },
  { id: 'surfers', name: 'Grok Surfers', desc: 'An endless runner. Dodge, jump and grab coins.',
    url: 'https://lizethbran13-cmyk.github.io/grok-surfers/', color: '#fb923c', color2: '#facc15' },
  { id: 'fc', mp: true, name: 'Grok FC', desc: '3D soccer, 5 stadiums, Dream Team. 1 v 1 or co-op online!',
    url: 'https://lizethbran13-cmyk.github.io/grok-fc/', color: '#22c55e', color2: '#ffffff' },
  { id: 'fc2', mp: true, name: 'Grok FC 2', desc: 'THE SEQUEL on the HD Shadow-Light Engine! Directional stadium floodlights, mowed grass stripes, real shadows, dynamic Day / Dusk / Night & Rain weather, and an 8-Stop World Tour Cup across Pup Town, Torty Town, Ratita Dome, North Pole, Pumpkin Hollow, Sky Tours Airfield, Shopsville and the Champions Final. Play 5v5 matches, Penalty Shootout, Free-Kick Challenge, 2-Player Local Versus, or Pet Mascot XI with Luna, Pi-rat, Snowie, Candy and Torty!',
    url: 'https://lizethbran13-cmyk.github.io/grok-arcade/grok-fc-2/', color: '#22c55e', color2: '#facc15' },
  { id: 'brawl', mp: true, name: 'Grok Brawl', desc: 'A 3D arena fighter. Punch, combo and unleash supers!',
    url: 'https://lizethbran13-cmyk.github.io/grok-brawl/', color: '#ff3d6e', color2: '#ffe14d' },
  { id: 'party', mp: true, name: 'Grok Land Party', desc: 'A party board game! Roll dice, collect stars, win mini games with friends.',
    url: 'https://lizethbran13-cmyk.github.io/grok-land-party/', color: '#ff6bd6', color2: '#ffe14d' },
  { id: 'detective', mp: true, name: 'Grok Detective', desc: 'Explore 5 places, find clues, question suspects and catch the culprit. Co-op!',
    url: 'https://lizethbran13-cmyk.github.io/grok-detective/', color: '#ffd23f', color2: '#38bdf8' },
  { id: 'pets', mp: true, name: 'Grok Pets', desc: 'Adopt, cuddle and train 17 kinds of pets (Candy, Martina, Luna, Pi-rat & Snowie too!), decorate your home and play pet mini games with friends.',
    url: 'https://lizethbran13-cmyk.github.io/grok-pets/', color: '#ff6bd6', color2: '#ffd23f' },
  { id: 'life', mp: true, name: 'Grok Life', desc: 'A cozy 3D life sim! Make a character, get a job, buy a house and a car, adopt pets (Candy, Martina, Luna, Pi-rat & Snowie!) and live in Maple Town with friends.',
    url: 'https://lizethbran13-cmyk.github.io/grok-life/', color: '#38bdf8', color2: '#ff6bd6' },
  { id: 'dash', mp: true, name: 'Grok Dash', desc: 'A speedy 2.5D platformer! Run loops, bounce on springs, glide and punch through 5 worlds with Grok, Speedy, Floaty & Candy. Free the critters, beat the bosses, co-op with friends!',
    url: 'https://lizethbran13-cmyk.github.io/grok-dash/', color: '#7c4dff', color2: '#ffd23f' },
  { id: 'spooks', mp: true, name: 'Grok Spooks', desc: 'A cute-spooky 3D ghost hunt! Flash, vacuum and tug ghosts, solve co-op puzzles (or use your Goo clone), light up 6 haunted areas and beat 6 boss ghosts with a friend.',
    url: 'https://lizethbran13-cmyk.github.io/grok-spooks/', color: '#5dff8a', color2: '#b06bff' },
  { id: 'blocks', mp: true, name: 'Grok Blocks', desc: 'A blocky wildlife rescue! Explore 5 biomes, calm 18 kinds of animals with darts, chase runners in your truck and outsmart poachers. Co-op online!',
    url: 'https://lizethbran13-cmyk.github.io/grok-blocks/', color: '#4ade80', color2: '#fbbf24' },
  { id: 'blocksrb', mp: true, name: 'Grok Blocks: Re-Blocked', desc: 'REMASTERED on a shiny new engine! Grok Blocks with soft shadows, day and night, and the dark, glowing Crystal Caves (lava, a mining camp, mine ore with your pickaxe) plus Blossom Hills. 24 animals, 13 cases, and the Pet Corner with Luna, Pi-rat, Snowie, Candy and Torty. Co-op online!',
    url: 'https://lizethbran13-cmyk.github.io/grok-blocks-reblocked/', color: '#7af0ff', color2: '#c08aff' },
  { id: 'rides', mp: true, name: 'Grok Rides', desc: 'REMASTERED on the Tempest engine! A huge free-roam world: Grok City, Pine Hollow, the Sunny Shores beach town, the desert, icy tundra and a winding mountain road. 31 rides: cars, buses, bikes, a monster truck, boats, a helicopter, seaplane, hovercraft, hot air balloon, the Ratita hover-car, plus an ice cream truck, fire truck and tow truck with real jobs. Street races, deliveries, police chases, gas stations, a car wash, rain and puddles, day and night, 3 homes and co-op for 3!',
    url: 'https://lizethbran13-cmyk.github.io/grok-rides-remastered/', color: '#ff4fd8', color2: '#38bdf8' },
  { id: 'poke', mp: true, name: 'Grok Poke', desc: 'A big 3D adventure: explore 7 regions, befriend 39 critters, real-time battles, 5 dungeons with bosses, towns you can walk into, and trade or explore with friends online!',
    url: 'https://lizethbran13-cmyk.github.io/grok-poke/', color: '#5dd66f', color2: '#ffd23f' },
  { id: 'heist', mp: true, name: 'Grok Heist Crew', desc: 'A cartoony co-op stealth heist! Pick Hacker, Lookout, Acrobat or Muscle, sneak past guards, hack doors and lasers and grab Baron Grumble\u2019s treasures from 5 heists. Up to 3 friends online!',
    url: 'https://lizethbran13-cmyk.github.io/grok-heist/', color: '#a855f7', color2: '#ffd23f' },
  { id: 'pickle', mp: true, name: 'Grok Pickleball', desc: 'Real 3D pickleball with easy swipe-to-hit controls and an Assist Mode! Serve, dink and smash on 5 courts, beat 8 rivals in the Pickle Cup, play 4 mini games, and team up with friends online (up to 3).',
    url: 'https://lizethbran13-cmyk.github.io/grok-pickleball/', color: '#22c55e', color2: '#e6ff3b' },
  { id: 'sports', mp: true, name: 'Grok Sports: Re-Commanded', desc: 'REMASTERED on the Turbo / Tempest Engine! A giant 3D sports plaza with all 14 sports included: soccer, basketball, tennis, bowling, beach volleyball, mini golf, badminton, dodgeball, archery, table tennis, plus the night-lights Ratita Stadium (ice hockey, glow mini-golf, cheese curling, mascot race + the Ratita Cup). Directional sunlight, real shadows, Day / Golden Hour / Stadium Night lighting, Pet Mascot Parade, easy touch controls, Assist Mode, and up to 3 friends online.',
    url: 'https://lizethbran13-cmyk.github.io/grok-arcade/sports-recommanded/', color: '#2563eb', color2: '#facc15' },
  { id: 'kart', mp: true, name: 'Grok Kart Party', desc: 'A bright cartoony 3D kart racer! 8 tracks in 2 cups (city, canyon, candy, beach, haunted castle, snow, volcano, space), drifts and mini-turbos, ramps and gliders, 11 wacky items, Grand Prix, Time Trial ghosts, Balloon Battle and Coin Runners, 10 racers and kart parts to unlock, and online racing for up to 3.',
    url: 'https://lizethbran13-cmyk.github.io/grok-kart/', color: '#ff4fd8', color2: '#3ff0ff' },
  { id: 'disaster', mp: true, name: 'Grok Disaster Zone', desc: 'Survive cartoon disasters! A kaiju attack, tornadoes, meteors, tsunamis, lightning, volcanoes, quakes, blizzards and an alien invasion on 4 maps (Super Thunder Expansion DLC adds acid storms, a dragon, dinos, 3 maps and Weather Hunter mode). Hide in bunkers, basements and rooftops, earn coins, buy upgrades, and team up with up to 3 friends online!',
    url: 'https://lizethbran13-cmyk.github.io/grok-disaster/', color: '#ff7b00', color2: '#7b5cd6' },
  { id: 'hunters', mp: true, name: 'Grok Monster Hunters', desc: 'A cartoony 3D co-op monster hunting adventure! Tame 13 big monsters across 6 regions (forest, canyon, marsh, volcano, frozen peaks and the Starfall Summit boss) with 5 weapons, combos, dodge rolls and lock-on. Forge gear, cook meals, decorate your house in Pawprint Village, bring your buddy Mochi, and hunt with up to 3 friends online!',
    url: 'https://lizethbran13-cmyk.github.io/grok-hunters/', color: '#f59e0b', color2: '#22d3ee' },
  { id: 'relics', mp: true, name: 'Grok Lost Relics', desc: 'Be an urban explorer with a whip and a torch! Swing over croc rivers, sneak past the Relic Patrol (they think YOU are the thief), dodge rolling boulders, dart walls and spike floors, solve temple puzzles and beat Professor Vintage\u2019s crazy machines to bring 5 ancient relics home to your museum. Outfits, a journal, gear upgrades and co-op for 3!',
    url: 'https://lizethbran13-cmyk.github.io/grok-lost-relics/', color: '#22c55e', color2: '#facc15' },
  { id: 'ratita', mp: true, name: 'Grok Ratita Rescue', desc: 'A cartoony 3D platformer! Play as Luna, Pi-rat or Snowie and sneak through a GIANT house: kitchen, living room, vents, garden, garage, toy room and attic. Grab cheese, rescue baby rats, earn Ratita Industries gadgets (glider, grapple tail, jet tail...), dodge Candy the schnauzer and beat 7 goofy bosses. Martina the tortoise helps out! Co-op for 3 online.',
    url: 'https://lizethbran13-cmyk.github.io/grok-ratita/', color: '#ff4fa0', color2: '#ffd23f' },
  { id: 'ratitahq', mp: true, name: 'Grok Ratita Industries HQ', desc: 'A cartoony 3D hub world! You\u2019re the new intern at Ratita Industries: meet Luna, Pi-rat and Snowie, explore labs, the Cheese Caf\u00e9, the glass-dome Atrium and the Test Yard, solve two mysteries, find Candy\u2019s Ruffsources department, and visit Martina \u201cTorty\u201d in the NEW Tortuga Tech Inc. Expansion Wing (3 Shell-Tough Test Chambers, 4 Crossover Gadgets & Plato\u2019s Repair Bench!). Explore with up to 3 friends online.',
    url: 'https://lizethbran13-cmyk.github.io/grok-arcade/ratita-hq/', color: '#ff8a3d', color2: '#3ff0ff' },
  { id: 'puptown', mp: true, name: 'Grok Pup Town', desc: 'A cozy cartoon 3D dog town, Candy\u2019s hometown! Explore the town square and fountain, Bone App\u00e9tit bakery, Paw Park, the Fluff & Puff groomer, the Pup Fire Station, the Barkade, the library, Town Hall, Candy\u2019s house and Torty\u2019s garden shop. Meet 30+ dog townsfolk, ride the Dog-Bus, bake treats, groom pups, run the agility course and solve the mystery of the stolen Golden Bone. Explore with up to 3 friends online!',
    url: 'https://lizethbran13-cmyk.github.io/grok-pup-town/', color: '#ff8fc8', color2: '#ffd23f' },
  { id: 'torty', mp: true, name: 'Grok Torty Town', desc: 'A sunny cartoon 3D desert oasis, Torty\u2019s hometown, where everything moves at turtle pace! Explore the palm-ringed Oasis Square, Market Street, the Burrows (meet Torty\u2019s family), Hot Spring Hill, the Old Adobe Quarter, Fiesta Plaza, the Slow-Mo Derby racetrack, the lettuce farm and TORTUGA TECH INC., Torty\u2019s own durability-testing company. 25+ walk-in buildings, 90+ tortoise townsfolk and desert critters, visitors Candy, Luna, Pi-rat and Snowie, the mystery of the swiped Sunstone, 6 mini-games, Sun Shells, badges and well-kept secrets. Co-op for 3 online.',
    url: 'https://lizethbran13-cmyk.github.io/grok-torty-town/?v=tt6', color: '#ffb020', color2: '#2dd4bf' },
  { id: 'eatsville', mp: true, name: 'Grok Eatsville Tycoon', desc: 'A cartoon 3D restaurant tycoon in the town of Eatsville! Start as a trainee at Mega Munch and work your way up, or open your own diner right away. Cook and serve, hire staff, design menus and decor, run deliveries in your car, build and decorate your house, and grow a food empire against Mega Munch and Pizza Palooza. Keep every branch spotless for grumpy Inspector Grumbleton, and fix the Ratita Industries kitchen gadgets when they go haywire. Explore mode, 10 hidden Golden Spatulas, and co-op for up to 3 friends online!',
    url: 'https://lizethbran13-cmyk.github.io/grok-eatsville/', color: '#ff7a3d', color2: '#14b8a6' },
  { id: 'northpole', mp: true, name: 'Grok North Pole Village', desc: 'A snowy cartoon 3D Christmas village at the North Pole! Visit Santa at Town Hall, ride the North Pole Express, explore Santa\u2019s Toy Workshop, the Santa Update Newsroom, North Pole Flight Command and the Post Office, then walk down Operations Row: the giant Wrapping Department plus 20 departments, from Snow Removal to Reindeer Operations, each with its own activity. Meet 80 named elves from santaupdate.com at their real jobs, check Wish Lists twice, solve a holiday mystery and play with visitors Torty, Candy, Luna, Pi-rat and Snowie. Co-op for 3 online.',
    url: 'https://lizethbran13-cmyk.github.io/grok-north-pole/', color: '#ef4444', color2: '#22c55e' },
  { id: 'pumpkinhollow', mp: true, name: 'Grok Pumpkin Hollow', desc: 'A moonlit cartoon 3D Halloween town of friendly ghosts and pumpkinheads! Ride the Ghost Train, explore Pumpkin Square, Spooky Street, the Abandoned Village, Haunted Hill, the Pumpkin Patch and the Bat Caves, catch a scary movie at the Scream-o-Vision Picture House, then walk down Boo Row: the Haunted Costume Shop, Witch\u2019s Potion Shoppe, Ghost Post Office, Skeleton Dance Hall, Candy Corn Factory, Monster Bakery, Fortune Teller, Mummy Spa, Carving Studio and Haunted Hotel, each with its own activity. Solve Who swiped the Moon Lantern? with visitors Torty, Candy, Luna, Pi-rat and Snowie. Co-op for 3 online.',
    url: 'https://lizethbran13-cmyk.github.io/grok-pumpkin-hollow/', color: '#f97316', color2: '#7c3aed' },
  { id: 'ruffsources', name: 'Grok Ruffsources HQ', desc: 'A cartoon 3D walk-in HR office run by dogs! Explore Ruffsources HQ: the lobby with Biscuit the corgi receptionist, the mail room, the break room, the filing archive, the interview room and Candy\u2019s office. Sort the mail, file the paperwork, interview new hires (HIRE or PASS?) and solve the mystery of Candy\u2019s missing squeaky toy. Find all 26 golden bones, then head out to the plaza, the dog park and the Bark & Brew caf\u00e9. Save your progress and keep playing any time.',
    url: 'https://lizethbran13-cmyk.github.io/grok-ruffsources/', color: '#ff8a3d', color2: '#14b8a6' },
  { id: 'skytours', name: 'Grok Snowie Sky Tours', desc: 'Fly Snowie\u2019s tour copter over a big open cartoon 3D world inspired by Pup Town, Torty Town and North Pole Village! Fly tour stops, rescue stranded pets, race the ring courses and collect passport stamps. Crashes are harmless: the friendly tow-drone carries you home. Land on any pad and walk into 9 packed buildings and 14 cottages, each with its own mini-game or chore: Ticket Rush, Sky Ace, Gift Wrap Rush, Marshmallow Catch and more. Save your progress and keep flying any time.',
    url: 'https://lizethbran13-cmyk.github.io/grok-sky-tours/', color: '#38bdf8', color2: '#ff4fa0' },
  { id: 'grocery', name: 'Grok Grocery Tycoon', desc: 'Run a store in the cartoon 3D town of Shopsville! Start as a courtesy clerk (bag groceries, push carts, stock shelves, mop spills) and get promoted all the way to owner, or start as the boss and build an empire of 11 store types: supermarkets, supercenters, markets, toy, shoe, electronics, pet, clothing, home goods, pharmacies and convenience stores. Walk into every store and all 9 rival shops, switch to first-person, run deliveries from your own distribution center and hire Luna, Pi-rat, Snowie, Candy and Torty. Save your progress and keep playing any time.',
    url: 'https://lizethbran13-cmyk.github.io/grok-grocery-tycoon/', color: '#16a34a', color2: '#f97316' },
  { id: 'pickleballpark', name: 'Grok Pickleball Park', desc: 'A giant cartoon 3D sports park built around real pickleball! Serve, dink, drop, drive, lob and smash with easy touch controls (real kitchen and two-bounce rules), play singles or doubles with Coach Kai, Luna, Snowie or Rally Rita, climb the 10-rung Park Ladder to Pickle King and win 4 tournaments for coins. Play on the Stadium Court with Umpire Pi-rat, 8 open courts and the Night Lights Court, shop for MaxGrit paddles and Silent Serve balls in Torty\u2019s Pro Shop, and visit the Clubhouse, the Snack Shack and the Training Center. Save your progress and keep playing any time.',
    url: 'https://lizethbran13-cmyk.github.io/grok-pickleball-park/', color: '#16a34a', color2: '#e6ff3b' },
  { id: 'drvic', name: 'Grok Dr. Vic: The Lost Lab', desc: 'A spooky Halloween exploration game on the brand-new Shadowlight engine! Dr. Victor\u2019s inventions keep flopping (Ratita Goo was a total disaster), so he becomes an urban explorer who needs to go viral. Sneak down abandoned Old Town Street, find the hidden Ratita Industries lab behind the bushes and explore its 2 floors and 11 underground levels with your flashlight: the Goo Factory, the Robot Workshop, the brick sewer and the Goo Core. Film anomalies for followers and uncover what Luna, Pi-rat and Snowie\u2019s great-great-great-grandparents really did. Save your progress and keep exploring any time.',
    url: 'https://lizethbran13-cmyk.github.io/grok-dr-vic/', color: '#4ade80', color2: '#7c3aed' },
  { id: 'petparty', name: 'Grok Pet Party', desc: 'A party game show live on the Tortuga TV Network, sponsored by Ratita Industries and Tortuga Tech! Play with up to 4 friends using a room code, or solo against bots. Hosts Rico and Martina \u201cTorty\u201d run 7 mini-games in random order (Cheese Dash, Shell Slide, Candy\u2019s Catch, Goo Floor, Pickleball Smash, Pi-rat\u2019s Treasure Dig and Bumper Shells), then the Crown Chase finale crowns the Party Champ. Between rounds, Candy from Ruffsources brings out celebrity guests!',
    url: 'https://lizethbran13-cmyk.github.io/grok-pet-party/', color: '#ff4fd8', color2: '#38bdf8' },
  { id: 'rodentia', name: 'Grok Great Rodentia', desc: 'A shadow-light mystery in Year 000 1! Luna, Pi-rat and Snowie were framed by their evil twin clones and locked in National Ratita Prison, and Torty got arrested too. Play Brie the detective, explore 4 districts of the USM crimson capital and 8 walk-in buildings with your flashlight, find 12 conspiracy clues and Golden Gouda Wedges, free Candy from the seized RuffSources HQ and break the real sisters out. Or switch to Evil Twin Mode and play as Evil Luna, Evil Pi-rat or Evil Snowie. 4 endings, and your progress saves.',
    url: 'https://lizethbran13-cmyk.github.io/grok-arcade/great-rodentia/', color: '#dc2626', color2: '#facc15' }
];
GA.BONUS_GAMES = [
  { id: 'snake', name: 'Grok Snake', desc: 'Swipe to steer, eat glowing fruit, grow long.', color: '#4ade80', color2: '#ff4fd8' },
  { id: 'bricks', name: 'Brick Breaker', desc: 'Drag the paddle and smash every neon brick.', color: '#3ff0ff', color2: '#ffe14d' },
  { id: 'jet', name: 'Grok Jet', desc: 'Tap to flap your jet through the neon gaps.', color: '#ffe14d', color2: '#ff4fd8' },
  { id: 'rats', name: 'Whack-a-Rat', desc: 'Boop Luna, Pi-rat & Snowie before they hide!', color: '#ff8fd0', color2: '#ffffff' },
  { id: 'stack', name: 'Stack Tower', desc: 'Tap to drop blocks and build the tallest tower.', color: '#ff7a3d', color2: '#3ff0ff' },
  { id: 'wires', name: 'Gary\'s Wire Rush', desc: 'Drag each wire to its matching socket before time runs out. Don\'t cross them!', color: '#ffd23b', color2: '#4ade80' },
  { id: 'penalty', name: 'Penalty Kick', desc: 'Tap or swipe to aim, beat the goalie. 5 shots, tickets for goals!', color: '#3bff7a', color2: '#ffffff' },
  { id: 'fetch', name: 'Candy\'s Fetch', desc: 'Tap to make Candy the schnauzer jump for tennis balls. Hop over bushes!', color: '#c7ccd4', color2: '#d7ff3b' },
  { id: 'ratmaze', name: 'Rat Maze Dash', desc: 'Pick Luna, Pi-rat or Snowie and race through the maze for seeds & cheese. Dodge the cat!', color: '#ffb347', color2: '#b18cff' },
  { id: 'slice', name: 'Neon Slice', desc: 'Swipe through flying neon fruit to slice it. Combos, golden stars, and watch out for bombs!', color: '#3ff0ff', color2: '#ff4fd8' },
  { id: 'skee', name: 'Skee-Ball', desc: 'The classic ticket game! Drag up to roll the ball into the rings. Corner pockets are 100, last ball is GOLDEN!', color: '#ffb020', color2: '#a78bfa' },
  { id: 'snack', name: 'Snack Stack', desc: 'Catch falling pet snacks on your tray, keep the wobbly pile balanced and serve it to Candy & Luna. No chocolate!', color: '#ff8fd0', color2: '#ffd23b' },
  { id: 'parking', name: 'Parking Panic', desc: 'Your car slides along the street. Tap to zoom into the glowing empty parking spot. Don\'t bump the parked cars! A Grok Life game.', color: '#ff4fd8', color2: '#4ade80' },
  { id: 'rush', name: 'Rush Hour', desc: 'Swerve your Grok Rides car through highway traffic. Tap left or right to switch lanes, grab coins, don\'t bonk! A Grok Rides game.', color: '#38bdf8', color2: '#ffd23f' },
  { id: 'catch', name: 'Critter Catch', desc: 'Critters pop out of the bushes! Tap them fast to toss an orb and catch them. Shiny critters are worth extra, but don\'t tap the Gloom blobs! A Grok Poke game.', color: '#5dd66f', color2: '#ff6b6b' },
  { id: 'filing', name: 'Gus\u2019s Filing Frenzy', desc: 'Folders rain down on Gus\u2019s cabinet! Tap the drawer that matches each folder\u2019s color and toss the junk mail. Gold-bordered RECORD folders are worth 5. A Hall of Game Records game.', color: '#e8b84a', color2: '#ff4fd8' },
  { id: 'laser', name: 'Laser Dash', desc: 'Sneak down the museum hall! Tap the top to JUMP the low lasers and the bottom to DUCK the high ones. Grab diamonds, don\u2019t trip the alarm! A Grok Heist Crew game.', color: '#ff3d6e', color2: '#a855f7' },
  { id: 'dink', name: 'Dink Duel', desc: 'The CPU dinks it over the net. Let it BOUNCE (it\u2019s the kitchen rule!), then tap to dink it back. Tap at the top of the hop for PERFECT. A Grok Pickleball game.', color: '#e6ff3b', color2: '#22c55e' },
  { id: 'hoop', name: 'Hoop Frenzy', desc: 'The hoop slides back and forth! Tap to shoot and lead the hoop so the ball drops right in. Swish = 3, rainbow money balls count double. A Grok Sports Command game.', color: '#f97316', color2: '#2563eb' },
  { id: 'lockpick', name: 'Lockpick Panic', desc: 'Pick Gus\u2019s locks against the clock! Tap when each bobbing pin lines up with the green shear line. Gold master locks wobble. A Secret Basement game.', color: '#ffd23f', color2: '#ff4fd8' },
  { id: 'drift', name: 'Spark Drift', desc: 'Corners ahead! HOLD to drift and charge the sparks blue, orange, PURPLE, then let go for a mini-turbo. Hold too long and you spin out! A Grok Kart Party game.', color: '#c084fc', color2: '#ff4fd8' },
  { id: 'meteor', name: 'Meteor Mayhem', desc: 'Meteors rain on Grok City! Red circles show where they will land, so drag to run out of the way. Grab coins and gold stars, and score CLOSE CALLS for near misses. A Grok Disaster Zone game.', color: '#ff7b00', color2: '#7b5cd6' },
  { id: 'ghost', name: 'Ghost Lantern \u201983', desc: 'A dusty 1983 cabinet from the basement! Friendly ghosts drift toward your candle. TAP them to catch them in your lantern before they blow it out. Big grumpy ghosts need 3 taps, golden ghosts are worth 5. 3 candles. Rumor says a high score shows a secret code\u2026', color: '#a7f3d0', color2: '#7c3aed' },
  { id: 'tame', name: 'Tame Rush', desc: 'A big cartoon monster stomps around! Drag to run in close and your hunter swings by itself. Dodge the RED stomp circles and tail sweeps, hit the glowing weak spot for extra points, and tame monster after monster. A Grok Monster Hunters game.', color: '#f59e0b', color2: '#22d3ee' },
  { id: 'swing', name: 'Tail Swing', desc: 'Luna zips through the giant kitchen with her Grapple Tail! HOLD to grab a glowing ring and swing, LET GO to fly. Grab crumbs and cheese, and don\u2019t fall where Candy can boop you! A Grok Ratita Rescue game.', color: '#3ff0ff', color2: '#ff4fa0' },
  /* #26-#31: the 1983 RETRO games. They live in the OLD Grok Arcade (Lily's Time Machine), not on the Bonus Zone wall */
  { id: 'tm_munch', era: 1983, name: 'Munch Maze \u201980', desc: 'A 1983 cabinet! Swipe to steer Gobbo through the maze and eat every dot. Star dots make the Byte Bugs scared, so chomp them for +10! Found in the OLD Grok Arcade.', color: '#c084fc', color2: '#2563eb' },
  { id: 'tm_swoop', era: 1983, name: 'Star Swoopers \u201981', desc: 'A 1983 cabinet! Drag your ship (it fires by itself). The Swoopers sway in formation, then dive at you in loops. Found in the OLD Grok Arcade.', color: '#3ff0ff', color2: '#7c3aed' },
  { id: 'tm_toad', era: 1983, name: 'Toad Road \u201981', desc: 'A 1983 cabinet! Tap to hop, swipe to hop sideways. Cross the busy road, ride the logs and turtles, fill all 5 lily pads. Found in the OLD Grok Arcade.', color: '#4ade80', color2: '#facc15' },
  { id: 'tm_centi', era: 1983, name: 'Centi-Bug \u201981', desc: 'A 1983 cabinet! Drag your bug zapper (it fires by itself) and split the Centi-Bug snaking through the mushrooms. Watch the spider! Found in the OLD Grok Arcade.', color: '#22c55e', color2: '#ec4899' },
  { id: 'tm_pogo', era: 1983, name: 'Pogo Pete \u201983', desc: 'A brand-new 1983 game! Pete bounces on his pogo stick by himself; drag to steer him onto the clouds and climb as high as you can. Found in the OLD Grok Arcade.', color: '#60a5fa', color2: '#f97316' },
  { id: 'tm_tangle', era: 1983, name: 'Time Tangle \u201983', desc: 'Lily\u2019s own game! Tap when the clock hand is inside the glowing slice. It speeds up and flips direction every hit. Found in the OLD Grok Arcade.', color: '#a78bfa', color2: '#facc15' },
  /* #32: lives in the Ratita Preview Center (behind the Food Court), not on the Bonus Zone wall */
  { id: 'chrono', room: 'preview', name: 'Chrono Courier', desc: 'Ratita Industries time-mail! Send each parcel through the portal for its era (dinos, 1983, today, the future). Leave the glitchy ones alone, and watch out: the portals SHUFFLE! Cabinet in the Ratita Preview Center.', color: '#5eead4', color2: '#fb7185' },
  /* #33: Crumb Patrol (Ratita HQ), on the Bonus Zone wall */
  { id: 'crumbs', name: 'Crumb Patrol', desc: 'You\u2019re Sweepy the robo-vac! Drag to steer around the Ratita HQ caf\u00e9, slurp up crumbs and cheese, DON\u2019T suck up the Golden Gouda, dodge goo puddles and move out from under the big sneaker shadows before they stomp. A Grok Ratita Industries HQ game.', color: '#ff8a3d', color2: '#3ff0ff' },
  /* #34: Bone Dig (Pup Town), on the Bonus Zone wall */
  { id: 'dig', name: 'Bone Dig', desc: 'Help Candy dig up Paw Park! PRESS AND HOLD a dirt mound to dig. Bones, biscuits and the rare GOLDEN BONE score points, but WIGGLY mounds hide a sprinkler that soaks Candy. A Grok Pup Town game.', color: '#86dc93', color2: '#ffd23f' },
  /* #35: Sparkle Car Wash (Grok Rides Remastered), on the Bonus Zone wall */
  { id: 'wash', name: 'Sparkle Car Wash', desc: 'Muddy cars roll through the Sparkle Car Wash! DRAG over the mud splats to scrub them off before each car rolls out. Spotless cars score a bonus, GOLDEN cars count double, and hands off the WET PAINT cars! A Grok Rides Remastered game.', color: '#38bdf8', color2: '#f472b6' },
  /* #36: Boulder Run (Grok Lost Relics), on the Bonus Zone wall */
  { id: 'boulder', name: 'Boulder Run', desc: 'A giant boulder is rolling after you down a temple corridor! TAP left or right to hop between 3 lanes, dodge spike tiles and fallen pillars, and grab coins and golden Jade Monkey idols. Every trap lets the boulder roll closer! A Grok Lost Relics game.', color: '#22c55e', color2: '#facc15' },
  /* #37: Patty Panic (Grok Eatsville Tycoon), on the Bonus Zone wall */
  { id: 'flip', name: 'Patty Panic', desc: 'Work the grill at the Main St Diner! TAP patties when they glow GOLDEN to flip them, then again to serve. Don\u2019t let them burn, catch the patties the Ratita grill LAUNCHES into the air, and wipe the grease before Inspector Grumbleton notices. A Grok Eatsville Tycoon game.', color: '#ff7a3d', color2: '#14b8a6' },
  /* #38: Shell Drop (Grok Torty Town), on the Bonus Zone wall */
  { id: 'shelldrop', name: 'Shell Drop', desc: 'Tortuga Tech drop test! Gadgets tumble down Torty\u2019s drop tower: TAP the cracked ones to bolt on a shell plate before they land. Golden gadgets score big, but leave the Rubber Lettuce alone. A Grok Torty Town game.', color: '#ffb020', color2: '#0f9d8a' },
  /* #39: Chimney Drop (Grok North Pole Village), on the Bonus Zone wall */
  { id: 'chimneydrop', name: 'Chimney Drop', desc: 'Help Santa deliver! The sleigh glides across the night sky: TAP to drop presents into the chimneys rolling past below. Golden chimneys score big, but don\u2019t bonk the snowman. A Grok North Pole Village game.', color: '#ef4444', color2: '#22c55e' },
  /* #40: Boo Drop (Grok Pumpkin Hollow), on the Bonus Zone wall */
  { id: 'boodrop', name: 'Boo Drop', desc: 'Trick or treat on Boo Row! Wisp the little ghost floats over the rooftops: TAP to drop candy into the jack-o\u2019-lantern buckets rolling past below. Golden pumpkins score big, but don\u2019t wake the sleeping black cat. A Grok Pumpkin Hollow game.', color: '#f97316', color2: '#7c3aed' },
  /* #41: Paw Stamp Rush (Grok Ruffsources HQ), on the Bonus Zone wall */
  { id: 'pawstamp', name: 'Paw Stamp Rush', desc: 'Paperwork time at Ruffsources HQ! Forms ride the conveyor past Biscuit\u2019s desk: TAP to paw-stamp each one as it slides under the stamp. Golden hire forms score big, but don\u2019t stamp Candy\u2019s squeaky toy. A Grok Ruffsources HQ game.', color: '#ff8a3d', color2: '#14b8a6' },
  /* #42: Ring Dash (Grok Snowie Sky Tours), on the Bonus Zone wall */
  { id: 'ringdash', name: 'Ring Dash', desc: 'Fly with Snowie! HOLD to climb and let go to dip as the tour copter zooms through the sky rings. Golden rings score big, but watch out for the seagulls. A Grok Snowie Sky Tours game.', color: '#38bdf8', color2: '#ff4fa0' },
  /* #43: Cart Dash (Grok Grocery Tycoon), on the Bonus Zone wall */
  { id: 'cartdash', name: 'Cart Dash', desc: 'Shopping spree in Shopsville! Push your Grok cart up the aisle: TAP left or right to swerve between 3 lanes, catch groceries and golden Grok Goods, and dodge spills and runaway carts. A Grok Grocery Tycoon game.', color: '#16a34a', color2: '#f97316' },
  /* #44: Target Drill (Grok Pickleball Park), on the Bonus Zone wall */
  { id: 'targetdrill', name: 'Target Drill', desc: 'Coach Luna\u2019s ball machine drill at the Grok Pickleball Park Training Center! DRAG your MaxGrit paddle under each ball, and use the paddle edges to aim your returns into the gold target ring for big points. Let the OUT balls go, and watch out when a second machine joins in! A Grok Pickleball Park game.', color: '#16a34a', color2: '#e6ff3b' },
  /* #45: Goo Cam (Grok Dr. Vic: The Lost Lab), on the Bonus Zone wall */
  { id: 'goocam', name: 'Goo Cam', desc: 'Help Dr. Vic go viral in the abandoned Ratita Industries lab! DRAG your flashlight through the dark: anomalies only show up in the light, so HOLD it on each ghost until the REC ring fills to film it. Gold Ghost Rats are worth extra, but keep the light off the green GOO blobs or they splat your camera! A Grok Dr. Vic: The Lost Lab game.', color: '#4ade80', color2: '#7c3aed' },
  /* #46: Buzzer Blitz (Grok Pet Party), on the Bonus Zone wall */
  { id: 'buzzer', name: 'Buzzer Blitz', desc: 'Be the fastest pet on the Tortuga TV Network! Rico calls out a pet and its podium lights up: TAP that buzzer before the timer runs out. Fast buzzes score extra and gold STAR rounds are worth 3, but when Dr. Vic\u2019s GOO card shows up, keep your paws OFF the buzzers! A Grok Pet Party game.', color: '#ff4fd8', color2: '#facc15' },
];
/* bonus games that have a cabinet on the Bonus Zone wall (1983 retro games live in the old arcade instead) */
GA.wallBonus = function () { return GA.BONUS_GAMES.filter(function (g) { return !g.era && !g.room; }); };
/* games that support online multiplayer through the Multiplayer Antenna */
GA.mpGames = function () { return GA.MAIN_GAMES.filter(function (g) { return g.mp; }); };
/* dev/test only: localStorage 'grokArcade.devUrls' = {"brawl":"http://127.0.0.1:8821/"} points games at local servers */
GA.gameUrl = function (g) { try { var o = JSON.parse(localStorage.getItem('grokArcade.devUrls') || 'null'); if (o && o[g.id]) return o[g.id]; } catch (e) {} return g.url; };
GA.allGames = function () { return GA.MAIN_GAMES.concat(GA.BONUS_GAMES); };
GA.findGame = function (id) { return GA.allGames().find(function (g) { return g.id === id; }); };
GA.isBonus = function (id) { return GA.BONUS_GAMES.some(function (g) { return g.id === id; }); };

/* persistent storage helpers (safe if storage is blocked) */
GA.store = {
  get: function (k, d) { try { var v = localStorage.getItem('grokArcade.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem('grokArcade.' + k, JSON.stringify(v)); } catch (e) {} }
};
GA.getBest = function (id) { return +GA.store.get('best.' + id, 0) || 0; };
GA.setBest = function (id, v) { GA.store.set('best.' + id, v); };
GA.getTickets = function () { return +GA.store.get('tickets', 0) || 0; };
GA.addTickets = function (n) { var t = GA.getTickets() + n; GA.store.set('tickets', t); return t; };
