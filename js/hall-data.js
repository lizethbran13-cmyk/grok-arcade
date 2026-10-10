/* Grok Arcade - Hall of Game Records data: screenshots, update history (from each game repo's git log, in plain words) and playable old versions.
   Old versions live in each game repo under versions/<label>/ and keep a separate save (localStorage keys are prefixed). */
GA.HALL_DATA = {
"sky": {
"repo": "grok-sky",
"history": [
{
"date": "Oct 1",
"ver": "1.0",
"title": "First flight",
"text": "A voxel airliner you can crash on purpose. Planes break apart in big chunky pieces!"
},
{
"date": "Oct 2",
"ver": "2.0",
"title": "Real airports & cities",
"text": "Mini airports and mini cities to fly between, plus places you can walk into in every city."
},
{
"date": "Oct 2",
"ver": "3.5",
"title": "Auto-land & Grok Jail",
"text": "Auto-land help, running around on foot, cars, police, airport clinics, taxi-to-gate arrows and the famous Grok Jail."
},
{
"date": "Oct 2",
"ver": "3.5",
"title": "Fly with friends",
"text": "Online multiplayer for 2-3 players."
},
{
"date": "Oct 7",
"ver": "4.0",
"title": "Real planes & Starship",
"text": "Six real planes from the Cessna to the A380, London, Rio and Quito, Starbase with Mechazilla, and Starship rides to the Moon and Mars. Board a friend\u2019s plane in co-op."
},
{
"date": "Oct 8",
"ver": "4.1",
"title": "Disasters!",
"text": "Engine fires, blowouts, meteor showers and lightning storms, with checklists, alarms, mayday calls and a safe-landing score."
}
],
"versions": [
{
"label": "v1",
"ver": "1.0",
"title": "Destructible plane sim",
"commit": "34020f7",
"url": "https://lizethbran13-cmyk.github.io/grok-sky/versions/v1/",
"thumb": "assets/hall/sky/v-v1.webp"
},
{
"label": "v2",
"ver": "2.0",
"title": "Mini airports, cities & places to walk into",
"commit": "bad78d0",
"url": "https://lizethbran13-cmyk.github.io/grok-sky/versions/v2/",
"thumb": "assets/hall/sky/v-v2.webp"
},
{
"label": "v3-5",
"ver": "3.5",
"title": "Auto-land, cars, police, Grok Jail + online",
"commit": "5333d55",
"url": "https://lizethbran13-cmyk.github.io/grok-sky/versions/v3-5/",
"thumb": "assets/hall/sky/v-v3-5.webp"
},
{
"label": "v4",
"ver": "4.0",
"title": "Real planes, London/Rio/Quito, Starship to the Moon & Mars",
"commit": "3e33544",
"url": "https://lizethbran13-cmyk.github.io/grok-sky/versions/v4/",
"thumb": "assets/hall/sky/v-v4.webp"
}
],
"pics": [
{
"src": "assets/hall/sky/1.webp",
"cap": "Lined up on the runway",
"w": 960,
"h": 444
},
{
"src": "assets/hall/sky/2.webp",
"cap": "Up in the air",
"w": 960,
"h": 444
},
{
"src": "assets/hall/sky/3.webp",
"cap": "Six real planes, Cessna to A380",
"w": 960,
"h": 360
},
{
"src": "assets/hall/sky/4.webp",
"cap": "Starship to the Moon and Mars",
"w": 960,
"h": 360
},
{
"src": "assets/hall/sky/5.webp",
"cap": "Flying together with friends",
"w": 960,
"h": 540
},
{
"src": "assets/hall/sky/6.webp",
"cap": "Parked at the jet bridge",
"w": 960,
"h": 560
}
],
"cover": "assets/hall/sky/cover.webp",
"quip": "Planes. Always crashing. Guess who sweeps up the little voxel bits? Me.",
"noOld": ""
},
"land": {
"repo": "grok-land",
"history": [
{
"date": "Sep 24",
"ver": "1.0",
"title": "The first adventure",
"text": "A 3D platformer with jumping, coins and the first worlds."
},
{
"date": "Oct 2",
"ver": "2.0",
"title": "Three new worlds",
"text": "Three new worlds, fairer jumps and an easy mode."
},
{
"date": "Oct 2",
"ver": "2.0",
"title": "Play together",
"text": "Online multiplayer with friends."
},
{
"date": "Oct 3",
"ver": "3.0",
"title": "Worlds 7 & 8",
"text": "Two more worlds (8 in total), every route checked by a robot player, plus a warmer sandy look."
}
],
"versions": [
{
"label": "v1",
"ver": "1.0",
"title": "The first 3D platformer",
"commit": "f2381b8",
"url": "https://lizethbran13-cmyk.github.io/grok-land/versions/v1/",
"thumb": "assets/hall/land/v-v1.webp"
},
{
"label": "v2",
"ver": "2.0",
"title": "3 new worlds, easy mode + online",
"commit": "fc79ee1",
"url": "https://lizethbran13-cmyk.github.io/grok-land/versions/v2/",
"thumb": "assets/hall/land/v-v2.webp"
}
],
"pics": [
{
"src": "assets/hall/land/1.webp",
"cap": "Hopping across the islands",
"w": 960,
"h": 444
},
{
"src": "assets/hall/land/2.webp",
"cap": "Coins and question blocks",
"w": 960,
"h": 444
},
{
"src": "assets/hall/land/3.webp",
"cap": "Jumping between platforms",
"w": 960,
"h": 444
},
{
"src": "assets/hall/land/4.webp",
"cap": "A brand-new world",
"w": 844,
"h": 390
},
{
"src": "assets/hall/land/5.webp",
"cap": "Title screen",
"w": 960,
"h": 444
}
],
"cover": "assets/hall/land/cover.webp",
"quip": "Jumping on blocks. In MY day we jumped on nothing and liked it.",
"noOld": ""
},
"grid": {
"repo": "grok-grid",
"history": [
{
"date": "Aug 28",
"ver": "1.0",
"title": "Lights out!",
"text": "An F1-style racer with crash damage."
},
{
"date": "Oct 2",
"ver": "2.0",
"title": "Championship",
"text": "6 tracks, smarter AI drivers and a full championship."
},
{
"date": "Oct 2",
"ver": "2.0",
"title": "Race your friends",
"text": "Online multiplayer races."
},
{
"date": "Oct 7",
"ver": "3.0",
"title": "Easier steering",
"text": "Freer steering, a phone thumb-stick zone, steer assist and two new tracks: Jungle Temple and Lunar Base (8 tracks total)."
}
],
"versions": [
{
"label": "v1",
"ver": "1.0",
"title": "F1 racer with crash damage",
"commit": "2ad4b51",
"url": "https://lizethbran13-cmyk.github.io/grok-grid/versions/v1/",
"thumb": "assets/hall/grid/v-v1.webp"
},
{
"label": "v2",
"ver": "2.0",
"title": "6 tracks, championship + online",
"commit": "0e0c3b6",
"url": "https://lizethbran13-cmyk.github.io/grok-grid/versions/v2/",
"thumb": "assets/hall/grid/v-v2.webp"
}
],
"pics": [
{
"src": "assets/hall/grid/1.webp",
"cap": "Grok Grid 3.0 racing",
"w": 844,
"h": 390
},
{
"src": "assets/hall/grid/2.webp",
"cap": "Canyon race",
"w": 960,
"h": 540
},
{
"src": "assets/hall/grid/3.webp",
"cap": "The night track",
"w": 960,
"h": 540
},
{
"src": "assets/hall/grid/4.webp",
"cap": "Championship standings",
"w": 960,
"h": 540
},
{
"src": "assets/hall/grid/5.webp",
"cap": "Title screen",
"w": 960,
"h": 444
}
],
"cover": "assets/hall/grid/cover.webp",
"quip": "Fast cars going in circles. Very productive.",
"noOld": ""
},
"voxels": {
"repo": "grok-voxels",
"history": [
{
"date": "Aug 27",
"ver": "1.0",
"title": "Blocky blaster",
"text": "The original voxel shooter. Aim, blast, survive."
},
{
"date": "Oct 2",
"ver": "2.0",
"title": "Player feedback update",
"text": "Lots of fixes and tweaks from your feedback."
},
{
"date": "Oct 2",
"ver": "2.0",
"title": "Online",
"text": "Team up online."
},
{
"date": "Oct 8",
"ver": "3.0",
"title": "Five real levels",
"text": "Secret Lab, Area 51 Hangar with a boss, Neon Rooftops, Volcano Forge and Frozen Base, plus a laser, rockets, a freeze ray, 5 new enemies and a real HARD mode."
}
],
"versions": [
{
"label": "v1",
"ver": "1.0",
"title": "The original blocky shooter",
"commit": "22d56ea",
"url": "https://lizethbran13-cmyk.github.io/grok-voxels/versions/v1/",
"thumb": "assets/hall/voxels/v-v1.webp"
},
{
"label": "v2",
"ver": "2.0",
"title": "Player-feedback update + online",
"commit": "ddc7828",
"url": "https://lizethbran13-cmyk.github.io/grok-voxels/versions/v2/",
"thumb": "assets/hall/voxels/v-v2.webp"
}
],
"pics": [
{
"src": "assets/hall/voxels/1.webp",
"cap": "Boss fight in the Area 51 Hangar",
"w": 960,
"h": 540
},
{
"src": "assets/hall/voxels/2.webp",
"cap": "Blasting through the Secret Lab",
"w": 960,
"h": 444
},
{
"src": "assets/hall/voxels/3.webp",
"cap": "Exploring a level",
"w": 960,
"h": 444
},
{
"src": "assets/hall/voxels/4.webp",
"cap": "Title screen",
"w": 960,
"h": 444
}
],
"cover": "assets/hall/voxels/cover.webp",
"quip": "Lasers indoors. Who approved this? Not me.",
"noOld": ""
},
"surfers": {
"repo": "grok-surfers",
"history": [
{
"date": "Aug 27",
"ver": "1.0",
"title": "First run",
"text": "An endless runner: dodge, jump and grab coins."
},
{
"date": "Oct 2",
"ver": "2.0",
"title": "Player feedback update",
"text": "Smoother running and fixes from your feedback."
}
],
"versions": [
{
"label": "v1",
"ver": "1.0",
"title": "The original endless runner",
"commit": "5896293",
"url": "https://lizethbran13-cmyk.github.io/grok-surfers/versions/v1/",
"thumb": "assets/hall/surfers/v-v1.webp"
}
],
"pics": [
{
"src": "assets/hall/surfers/1.webp",
"cap": "Running the tracks",
"w": 960,
"h": 444
},
{
"src": "assets/hall/surfers/2.webp",
"cap": "Dodging trains",
"w": 960,
"h": 444
},
{
"src": "assets/hall/surfers/3.webp",
"cap": "Grabbing coins",
"w": 960,
"h": 444
},
{
"src": "assets/hall/surfers/4.webp",
"cap": "Title screen",
"w": 960,
"h": 444
}
],
"cover": "assets/hall/surfers/cover.webp",
"quip": "Running from trains forever. Relatable, honestly.",
"noOld": ""
},
"fc": {
"repo": "grok-fc",
"history": [
{
"date": "Sep 7",
"ver": "1.0",
"title": "Kick off",
"text": "Soccer with slide tackles and a VERY strict referee."
},
{
"date": "Oct 2",
"ver": "2.0",
"title": "Feedback update",
"text": "A big update based on player feedback."
},
{
"date": "Oct 2",
"ver": "2.0",
"title": "Online 1 v 1",
"text": "Play a friend online, plus the Penalty Kick cabinet in the Arcade."
},
{
"date": "Oct 7",
"ver": "3.0",
"title": "Full 3D",
"text": "Real 3D, new touch controls, 5 stadiums, a Dream Team, commentary and online co-op."
},
{
"date": "Oct 7",
"ver": "3.0.1",
"title": "iPhone fix + smarter AI",
"text": "Fixed the flickering pitch on iPhone and added 5 AI levels from Rookie to Pro."
}
],
"versions": [
{
"label": "v1",
"ver": "1.0",
"title": "Slide tackles & the strict referee",
"commit": "c44c6ee",
"url": "https://lizethbran13-cmyk.github.io/grok-fc/versions/v1/",
"thumb": "assets/hall/fc/v-v1.webp"
},
{
"label": "v2",
"ver": "2.0",
"title": "Feedback update + online 1 v 1",
"commit": "bfccacf",
"url": "https://lizethbran13-cmyk.github.io/grok-fc/versions/v2/",
"thumb": "assets/hall/fc/v-v2.webp"
}
],
"pics": [
{
"src": "assets/hall/fc/1.webp",
"cap": "The 5 stadiums",
"w": 960,
"h": 402
},
{
"src": "assets/hall/fc/2.webp",
"cap": "Kick off!",
"w": 960,
"h": 444
},
{
"src": "assets/hall/fc/3.webp",
"cap": "Attacking down the wing",
"w": 960,
"h": 444
},
{
"src": "assets/hall/fc/4.webp",
"cap": "In the box",
"w": 960,
"h": 444
},
{
"src": "assets/hall/fc/5.webp",
"cap": "Phone controls",
"w": 444,
"h": 960
}
],
"cover": "assets/hall/fc/cover.webp",
"quip": "I was a goalie once. Saved nothing. Still bitter.",
"noOld": ""
},
"brawl": {
"repo": "grok-brawl",
"history": [
{
"date": "Oct 2",
"ver": "1.0",
"title": "Fight!",
"text": "A 3D arena fighter with punches, combos and supers."
},
{
"date": "Oct 2",
"ver": "1.1",
"title": "Movement patch",
"text": "Triple jump, cross-overs and snappier moves."
},
{
"date": "Oct 2",
"ver": "1.2",
"title": "Online",
"text": "Fight your friends online."
},
{
"date": "Oct 7",
"ver": "1.3",
"title": "New fighters & arenas",
"text": "Riptide and Glitch join the roster, plus the Moon Base and Gumball Factory arenas."
}
],
"versions": [
{
"label": "v1",
"ver": "1.0",
"title": "Launch-day brawler",
"commit": "af6291e",
"url": "https://lizethbran13-cmyk.github.io/grok-brawl/versions/v1/",
"thumb": "assets/hall/brawl/v-v1.webp"
},
{
"label": "v1-2",
"ver": "1.2",
"title": "Triple jump + online multiplayer",
"commit": "74649fd",
"url": "https://lizethbran13-cmyk.github.io/grok-brawl/versions/v1-2/",
"thumb": "assets/hall/brawl/v-v1-2.webp"
}
],
"pics": [
{
"src": "assets/hall/brawl/1.webp",
"cap": "Combo sparks",
"w": 960,
"h": 540
},
{
"src": "assets/hall/brawl/2.webp",
"cap": "Super move cinematic",
"w": 960,
"h": 540
},
{
"src": "assets/hall/brawl/3.webp",
"cap": "INFERNO BEAM",
"w": 960,
"h": 540
},
{
"src": "assets/hall/brawl/4.webp",
"cap": "Character select",
"w": 960,
"h": 540
},
{
"src": "assets/hall/brawl/5.webp",
"cap": "Moon Base arena",
"w": 960,
"h": 540
},
{
"src": "assets/hall/brawl/6.webp",
"cap": "Victory!",
"w": 960,
"h": 540
}
],
"cover": "assets/hall/brawl/cover.webp",
"quip": "Punching. Shouting. Supers. My ears hurt just looking at it.",
"noOld": ""
},
"party": {
"repo": "grok-land-party",
"history": [
{
"date": "Oct 3",
"ver": "1.0",
"title": "Party time",
"text": "4 boards, 13 mini games and online multiplayer."
},
{
"date": "Oct 3",
"ver": "1.0.1",
"title": "Brighter candy",
"text": "The Candy Clouds board got brighter so it looks great on phones."
}
],
"versions": [],
"pics": [
{
"src": "assets/hall/party/1.webp",
"cap": "The frozen board",
"w": 960,
"h": 540
},
{
"src": "assets/hall/party/2.webp",
"cap": "Candy Clouds board",
"w": 960,
"h": 444
},
{
"src": "assets/hall/party/3.webp",
"cap": "Coin mini game",
"w": 960,
"h": 444
},
{
"src": "assets/hall/party/4.webp",
"cap": "The final podium",
"w": 960,
"h": 540
},
{
"src": "assets/hall/party/5.webp",
"cap": "Online lobby",
"w": 960,
"h": 540
}
],
"cover": "assets/hall/party/cover.webp",
"quip": "A party. Great. Nobody invited Gus. As usual.",
"noOld": "Grok Land Party went live already finished, so there\u2019s no older version to dig up. Yet."
},
"detective": {
"repo": "grok-detective",
"history": [
{
"date": "Oct 7",
"ver": "1.0",
"title": "Case open",
"text": "Explore 5 places, find clues, question suspects and catch the culprit, with co-op."
},
{
"date": "Oct 7",
"ver": "1.0",
"title": "Hard case",
"text": "The Mayor\u2019s Missing Crown: 3 clues and 5 suspects."
},
{
"date": "Oct 7",
"ver": "1.0",
"title": "Phone polish",
"text": "Easier tapping, bigger labels and better co-op colors."
}
],
"versions": [],
"pics": [
{
"src": "assets/hall/detective/1.webp",
"cap": "Searching the town",
"w": 960,
"h": 444
},
{
"src": "assets/hall/detective/2.webp",
"cap": "Co-op case solving",
"w": 444,
"h": 960
},
{
"src": "assets/hall/detective/3.webp",
"cap": "Following the clues",
"w": 444,
"h": 960
},
{
"src": "assets/hall/detective/4.webp",
"cap": "Title screen",
"w": 960,
"h": 444
}
],
"cover": "assets/hall/detective/cover.webp",
"quip": "A mystery game. The real mystery is who keeps moving my stapler.",
"noOld": "Grok Detective was finished before it ever hit the Arcade. No old versions. Case closed."
},
"pets": {
"repo": "grok-pets",
"history": [
{
"date": "Oct 7",
"ver": "1.0",
"title": "Adopt a pet",
"text": "Adopt, cuddle and train pets, decorate your home and play mini games with friends."
},
{
"date": "Oct 7",
"ver": "1.1",
"title": "Making friends",
"text": "NPCs you can talk to, friendship, daily jobs, playdates and Sudsy Sam the groomer."
},
{
"date": "Oct 7",
"ver": "1.2",
"title": "Old Man Grumbleton",
"text": "A grumpy neighbor and Brutus the bulldog. Win them over with secret treats!"
},
{
"date": "Oct 8",
"ver": "1.3",
"title": "Animal Chaos",
"text": "Play AS your pet: make messes, confuse your owner and escape Animal Control (Suggestion Booth #5)."
},
{
"date": "Oct 9",
"ver": "1.3.1",
"title": "Co-op fix",
"text": "Mini game results no longer get stuck in co-op (Suggestion Booth #12)."
}
],
"versions": [
{
"label": "v1",
"ver": "1.0",
"title": "Launch: adopt, care, mini games",
"commit": "792f3a3",
"url": "https://lizethbran13-cmyk.github.io/grok-pets/versions/v1/",
"thumb": "assets/hall/pets/v-v1.webp"
},
{
"label": "v1-2",
"ver": "1.2",
"title": "NPC friends, groomer + Old Man Grumbleton",
"commit": "b56c2d9",
"url": "https://lizethbran13-cmyk.github.io/grok-pets/versions/v1-2/",
"thumb": "assets/hall/pets/v-v1-2.webp"
}
],
"pics": [
{
"src": "assets/hall/pets/1.webp",
"cap": "Taking care of Candy",
"w": 390,
"h": 844
},
{
"src": "assets/hall/pets/2.webp",
"cap": "Old Man Grumbleton",
"w": 390,
"h": 844
},
{
"src": "assets/hall/pets/3.webp",
"cap": "Animal Chaos mode",
"w": 390,
"h": 844
},
{
"src": "assets/hall/pets/4.webp",
"cap": "Town with a friend",
"w": 390,
"h": 844
},
{
"src": "assets/hall/pets/5.webp",
"cap": "Talking to neighbors",
"w": 390,
"h": 844
},
{
"src": "assets/hall/pets/6.webp",
"cap": "Title screen",
"w": 390,
"h": 844
}
],
"cover": "assets/hall/pets/cover.webp",
"quip": "Pets. Adorable. Shedding all over my nice carpet.",
"noOld": ""
},
"life": {
"repo": "grok-life",
"history": [
{
"date": "Oct 7",
"ver": "1.0",
"title": "Welcome to Maple Town",
"text": "Make a character, get a job, buy a house and a car, and adopt pets."
},
{
"date": "Oct 8",
"ver": "1.1",
"title": "Health & heists",
"text": "Health, the clinic, ambulance and insurance, cartoon crime with police chases, plus the Animal Shelter (Suggestion Booth #6)."
},
{
"date": "Oct 8",
"ver": "1.2",
"title": "Cars & mechanics",
"text": "Car damage, breakdowns, tow trucks, two mechanics and a free camera."
},
{
"date": "Oct 8",
"ver": "1.3",
"title": "Weather & disasters",
"text": "Rain, storms, snow, floods, hurricanes, power outages and a Weather app."
},
{
"date": "Oct 8",
"ver": "1.4",
"title": "Scenarios & 911",
"text": "A Scenarios app (trips, food poisoning, kitchen fires and more) and a working 911 app."
},
{
"date": "Oct 9",
"ver": "1.5",
"title": "Decorating",
"text": "Tap-to-place decorating like Grok Pets, with rotate buttons and a ghost preview."
}
],
"versions": [
{
"label": "v1",
"ver": "1.0",
"title": "Launch: Maple Town, jobs, cars, pets",
"commit": "bbec883",
"url": "https://lizethbran13-cmyk.github.io/grok-life/versions/v1/",
"thumb": "assets/hall/life/v-v1.webp"
},
{
"label": "v1-1",
"ver": "1.1",
"title": "Health, clinic, cartoon crime + shelter",
"commit": "da9ed7b",
"url": "https://lizethbran13-cmyk.github.io/grok-life/versions/v1-1/",
"thumb": "assets/hall/life/v-v1-1.webp"
},
{
"label": "v1-3",
"ver": "1.3",
"title": "Weather & disasters",
"commit": "101e5a0",
"url": "https://lizethbran13-cmyk.github.io/grok-life/versions/v1-3/",
"thumb": "assets/hall/life/v-v1-3.webp"
},
{
"label": "v1-4",
"ver": "1.4",
"title": "Scenarios app + 911",
"commit": "37e78f7",
"url": "https://lizethbran13-cmyk.github.io/grok-life/versions/v1-4/",
"thumb": "assets/hall/life/v-v1-4.webp"
}
],
"pics": [
{
"src": "assets/hall/life/1.webp",
"cap": "Decorating your home",
"w": 390,
"h": 844
},
{
"src": "assets/hall/life/2.webp",
"cap": "A big storm rolls in",
"w": 390,
"h": 844
},
{
"src": "assets/hall/life/3.webp",
"cap": "Cartoon heist",
"w": 390,
"h": 844
},
{
"src": "assets/hall/life/4.webp",
"cap": "Pet check-up at the vet",
"w": 390,
"h": 844
},
{
"src": "assets/hall/life/5.webp",
"cap": "The ambulance",
"w": 390,
"h": 844
},
{
"src": "assets/hall/life/6.webp",
"cap": "Animal shelter",
"w": 390,
"h": 844
}
],
"cover": "assets/hall/life/cover.webp",
"quip": "A whole life sim. I live a whole life too. It\u2019s mostly filing.",
"noOld": ""
},
"dash": {
"repo": "grok-dash",
"history": [
{
"date": "Oct 7",
"ver": "1.0",
"title": "Gotta dash",
"text": "A speedy 2.5D platformer: 30 levels in 5 worlds, bosses, critters to free and co-op."
}
],
"versions": [],
"pics": [
{
"src": "assets/hall/dash/1.webp",
"cap": "Running through the hills",
"w": 960,
"h": 444
},
{
"src": "assets/hall/dash/2.webp",
"cap": "Downtown Dash",
"w": 960,
"h": 444
},
{
"src": "assets/hall/dash/3.webp",
"cap": "Springs launch you sky high",
"w": 844,
"h": 390
},
{
"src": "assets/hall/dash/4.webp",
"cap": "The world map",
"w": 960,
"h": 444
},
{
"src": "assets/hall/dash/5.webp",
"cap": "Title screen",
"w": 960,
"h": 444
}
],
"cover": "assets/hall/dash/cover.webp",
"quip": "Speedy. Loud. Bouncy. Three things I am not.",
"noOld": "Grok Dash dashed straight to the finished version. Nothing older in the vault."
},
"spooks": {
"repo": "grok-spooks",
"history": [
{
"date": "Oct 7",
"ver": "1.0",
"title": "Who you gonna call?",
"text": "A cute-spooky co-op ghost hunt: 6 areas, 35 rooms and 6 boss ghosts."
},
{
"date": "Oct 7",
"ver": "1.0.1",
"title": "Better camera",
"text": "The camera frames the action and the phone layout got cleaner."
}
],
"versions": [],
"pics": [
{
"src": "assets/hall/spooks/1.webp",
"cap": "Boss ghost fight",
"w": 390,
"h": 844
},
{
"src": "assets/hall/spooks/2.webp",
"cap": "Ghost hunting",
"w": 960,
"h": 444
},
{
"src": "assets/hall/spooks/3.webp",
"cap": "Exploring the haunted rooms",
"w": 960,
"h": 444
},
{
"src": "assets/hall/spooks/4.webp",
"cap": "Title screen",
"w": 960,
"h": 444
}
],
"cover": "assets/hall/spooks/cover.webp",
"quip": "Ghosts! Finally, visitors quieter than you.",
"noOld": "Grok Spooks launched in one go. No older version. Spooky, right?"
},
"blocks": {
"repo": "grok-blocks",
"history": [
{
"date": "Oct 8",
"ver": "1.0",
"title": "Rescue time",
"text": "A blocky wildlife rescue across 5 biomes with 18 kinds of animals."
},
{
"date": "Oct 8",
"ver": "1.0.1",
"title": "Arrival grace",
"text": "Poachers can\u2019t bust you in your first 4 seconds in a new area."
},
{
"date": "Oct 8",
"ver": "1.1",
"title": "Drone & Poacher mode",
"text": "A ranger drone and a cartoon Poacher mode."
},
{
"date": "Oct 8",
"ver": "1.2",
"title": "Mode switching",
"text": "Clean switching between Ranger and Poacher modes, and co-op guests stay on the job."
}
],
"versions": [
{
"label": "v1",
"ver": "1.0",
"title": "Launch: wildlife rescue in 5 biomes",
"commit": "2541891",
"url": "https://lizethbran13-cmyk.github.io/grok-blocks/versions/v1/",
"thumb": "assets/hall/blocks/v-v1.webp"
},
{
"label": "v1-1",
"ver": "1.1",
"title": "Ranger drone + Poacher mode",
"commit": "3aa446f",
"url": "https://lizethbran13-cmyk.github.io/grok-blocks/versions/v1-1/",
"thumb": "assets/hall/blocks/v-v1-1.webp"
}
],
"pics": [
{
"src": "assets/hall/blocks/1.webp",
"cap": "Rescuing a zebra",
"w": 444,
"h": 960
},
{
"src": "assets/hall/blocks/2.webp",
"cap": "The ranger drone",
"w": 444,
"h": 960
},
{
"src": "assets/hall/blocks/3.webp",
"cap": "Poacher mode",
"w": 444,
"h": 960
},
{
"src": "assets/hall/blocks/4.webp",
"cap": "Spotted by rangers!",
"w": 390,
"h": 844
}
],
"cover": "assets/hall/blocks/cover.webp",
"quip": "Saving animals. Fine. That one\u2019s actually nice. Don\u2019t tell anyone I said that.",
"noOld": ""
},
"rides": {
"repo": "grok-rides",
"history": [
{
"date": "Oct 8",
"ver": "1.0",
"title": "Start your engines",
"text": "A big free-roam world with cars, races, jobs and co-op."
},
{
"date": "Oct 8",
"ver": "1.1",
"title": "Walk-in places",
"text": "Get out and walk! 17 interiors with shops, snacks, jobs and races."
},
{
"date": "Oct 8",
"ver": "1.2",
"title": "Smooth traffic",
"text": "Smoother traffic and buses, glossy rounded cars and real sun shadows."
},
{
"date": "Oct 9",
"ver": "2.0",
"title": "The big overhaul",
"text": "Real 3D buildings, day and night with headlights, drift and nitro, and every building enterable (Suggestion Booth #8)."
},
{
"date": "Oct 9",
"ver": "2.1",
"title": "New rides + homes",
"text": "BMX, road bike, scooter, moped, go-kart, cruiser, sport bike and jet ski, plus 3 houses with garages."
}
],
"versions": [
{
"label": "v1",
"ver": "1.0",
"title": "Launch: free-roam world + races",
"commit": "29d1e6d",
"url": "https://lizethbran13-cmyk.github.io/grok-rides/versions/v1/",
"thumb": "assets/hall/rides/v-v1.webp"
},
{
"label": "v1-1",
"ver": "1.1",
"title": "Walk-in places & 17 interiors",
"commit": "620f58a",
"url": "https://lizethbran13-cmyk.github.io/grok-rides/versions/v1-1/",
"thumb": "assets/hall/rides/v-v1-1.webp"
},
{
"label": "v2",
"ver": "2.0",
"title": "Big overhaul: day/night, drift + nitro",
"commit": "bfc0bc0",
"url": "https://lizethbran13-cmyk.github.io/grok-rides/versions/v2/",
"thumb": "assets/hall/rides/v-v2.webp"
}
],
"pics": [
{
"src": "assets/hall/rides/1.webp",
"cap": "Night driving with headlights",
"w": 444,
"h": 960
},
{
"src": "assets/hall/rides/2.webp",
"cap": "Sport bike wheelie",
"w": 444,
"h": 960
},
{
"src": "assets/hall/rides/3.webp",
"cap": "Grok City traffic",
"w": 444,
"h": 960
},
{
"src": "assets/hall/rides/4.webp",
"cap": "Racing through the city",
"w": 390,
"h": 844
},
{
"src": "assets/hall/rides/5.webp",
"cap": "Your own garage",
"w": 444,
"h": 960
},
{
"src": "assets/hall/rides/6.webp",
"cap": "Inside Burger Blast",
"w": 444,
"h": 960
},
{
"src": "assets/hall/rides/7.webp",
"cap": "Jet ski",
"w": 444,
"h": 960
}
],
"cover": "assets/hall/rides/cover.webp",
"quip": "Monster trucks. In MY museum. Wipe the tires first.",
"noOld": ""
},
"poke": {
"repo": "grok-poke",
"history": [
{
"date": "Oct 9",
"ver": "1.0",
"title": "Gotta befriend \u2019em",
"text": "A big 3D adventure: 7 regions, 39 critters, real-time battles, 5 dungeons and co-op."
},
{
"date": "Oct 9",
"ver": "1.1",
"title": "Color polish",
"text": "Brighter colors and shadows, cuter critters, decorated interiors and 16 monster camps."
}
],
"versions": [
{
"label": "v1",
"ver": "1.0",
"title": "Launch build (before the color polish)",
"commit": "e2babce",
"url": "https://lizethbran13-cmyk.github.io/grok-poke/versions/v1/",
"thumb": "assets/hall/poke/v-v1.webp"
}
],
"pics": [
{
"src": "assets/hall/poke/1.webp",
"cap": "Exploring the overworld",
"w": 390,
"h": 844
},
{
"src": "assets/hall/poke/2.webp",
"cap": "A wild Zipferret!",
"w": 390,
"h": 844
},
{
"src": "assets/hall/poke/3.webp",
"cap": "Whisperwood Temple",
"w": 390,
"h": 844
},
{
"src": "assets/hall/poke/4.webp",
"cap": "Inside the healing center",
"w": 390,
"h": 844
},
{
"src": "assets/hall/poke/5.webp",
"cap": "Night time",
"w": 390,
"h": 844
},
{
"src": "assets/hall/poke/6.webp",
"cap": "The Creature Dex",
"w": 390,
"h": 844
}
],
"cover": "assets/hall/poke/cover.webp",
"quip": "Critters. Thirty-nine of them. I counted. Twice. Grumble.",
"noOld": ""
},
"heist": {
"repo": "grok-heist",
"history": [
{
"date": "Oct 9",
"ver": "1.0",
"title": "First heist",
"text": "Built in a day: a hideout, 5 heists (Candy Factory, City Museum, Cruise Ship, Cloud Castle, Toy Tower), 4 roles, gadgets, guards and co-op for 3."
},
{
"date": "Oct 9",
"ver": "1.1",
"title": "Brighter and fairer",
"text": "Fixed washed-out colors, smarter camera, fairer guards, saves, touch controls and co-op fixes."
},
{
"date": "Oct 9",
"ver": "1.2",
"title": "Two-storey buildings",
"text": "Buildings got upper floors, windows, name signs and rooftops to explore, plus an x-ray view so walls never hide the crew."
},
{
"date": "Oct 9",
"ver": "1.3",
"title": "The big polish",
"text": "Walls now drop down Sims-style, a real curved cruise ship with lifeboats and a pool, guards that comically grab you, banana pratfalls and the crew waving from the getaway van."
},
{
"date": "Oct 9",
"ver": "1.4",
"title": "Greenlit!",
"text": "David greenlit it, so Grok Heist Crew went live in the Arcade."
}
],
"versions": [],
"pics": [
{
"src": "assets/hall/heist/1.webp",
"cap": "Sweet Tooth Candy Co. from outside",
"w": 390,
"h": 844
},
{
"src": "assets/hall/heist/2.webp",
"cap": "Sneaking past a guard\u2019s flashlight cone",
"w": 390,
"h": 844
},
{
"src": "assets/hall/heist/3.webp",
"cap": "Hacker vs. the museum lasers",
"w": 390,
"h": 844
},
{
"src": "assets/hall/heist/4.webp",
"cap": "The cruise ship heist",
"w": 390,
"h": 844
},
{
"src": "assets/hall/heist/5.webp",
"cap": "Smoke bomb, x-ray ping and a decoy",
"w": 390,
"h": 844
},
{
"src": "assets/hall/heist/6.webp",
"cap": "GOTCHA! Caught by a guard",
"w": 390,
"h": 844
},
{
"src": "assets/hall/heist/7.webp",
"cap": "Getaway! The whole crew in the van",
"w": 390,
"h": 844
},
{
"src": "assets/hall/heist/8.webp",
"cap": "Co-op crew at the vault door",
"w": 390,
"h": 844
}
],
"cover": "assets/hall/heist/cover.webp",
"quip": "Thieves. In MY museum. I\u2019m counting the diamonds every night now.",
"noOld": "Grok Heist Crew snuck in fully polished. No old versions. I checked the vault. Twice."
},
"pickle": {
"repo": "grok-pickleball",
"history": [
{
"date": "Oct 9",
"ver": "1.0",
"title": "First serve",
"text": "Real pickleball in 3D: underhand serves, the two-bounce rule, the kitchen, side-out or rally scoring, Assist Mode, a tutorial, the 8-player Pickle Cup, 4 mini games, 5 courts and online play for up to 3."
},
{
"date": "Oct 9",
"ver": "1.1",
"title": "Faces & fixes",
"text": "Cuter players with real eyes and faces, team rings, a clearer HUD (no overlapping hints or names), no fence blocking the view, a TV-style replay camera and shorter doubles rallies."
}
],
"versions": [],
"pics": [
{
"src": "assets/hall/pickle/1.webp",
"cap": "Title screen",
"w": 390,
"h": 844
},
{
"src": "assets/hall/pickle/2.webp",
"cap": "Serving at the park",
"w": 390,
"h": 844
},
{
"src": "assets/hall/pickle/3.webp",
"cap": "Doubles in Vegas (neon!)",
"w": 390,
"h": 844
},
{
"src": "assets/hall/pickle/4.webp",
"cap": "Rally at the beach",
"w": 390,
"h": 844
},
{
"src": "assets/hall/pickle/5.webp",
"cap": "Night rooftop court",
"w": 390,
"h": 844
},
{
"src": "assets/hall/pickle/6.webp",
"cap": "The locker: paddles & outfits",
"w": 390,
"h": 844
}
],
"cover": "assets/hall/pickle/cover.webp",
"quip": "Pickleball. The ball has HOLES in it. Nobody can explain that to me.",
"noOld": "Grok Pickleball arrived already polished. No old versions. Stay out of my kitchen."
},
"sports": {
"repo": "grok-sports",
"history": [
{
"date": "Oct 9",
"ver": "1.0",
"title": "Opening day",
"text": "A walkable 3D sports plaza with 10 sports (soccer, basketball, tennis, bowling, beach volleyball, mini golf, badminton, dodgeball, archery, table tennis), easy touch controls, Assist Mode, how-to-play cards, ranks, coins, daily challenges, a locker room, a trophy hall, a records board, doors to Grok FC and Grok Pickleball, and online play for up to 3."
},
{
"date": "Oct 9",
"ver": "1.1",
"title": "A real bowling alley",
"text": "Bowling got a proper neon alley (wood lanes with arrows, gutters, other bowlers, a ball return, a pinsetter, glowing scoreboards and seats) and a real frame-by-frame scorecard. Badminton and table tennis got stands and crowds too."
}
],
"versions": [],
"pics": [
{
"src": "assets/hall/sports/1.webp",
"cap": "The sports plaza: walk into a door to play",
"w": 390,
"h": 844
},
{
"src": "assets/hall/sports/2.webp",
"cap": "Soccer 3v3 under the stadium lights",
"w": 390,
"h": 844
},
{
"src": "assets/hall/sports/3.webp",
"cap": "Basketball 2v2 street court",
"w": 390,
"h": 844
},
{
"src": "assets/hall/sports/4.webp",
"cap": "The neon Grok Bowl alley",
"w": 390,
"h": 844
},
{
"src": "assets/hall/sports/5.webp",
"cap": "Mini golf: the windmill hole",
"w": 390,
"h": 844
},
{
"src": "assets/hall/sports/6.webp",
"cap": "Beach volleyball 2v2",
"w": 390,
"h": 844
},
{
"src": "assets/hall/sports/7.webp",
"cap": "Dodgeball 3v3 in the arena",
"w": 390,
"h": 844
},
{
"src": "assets/hall/sports/8.webp",
"cap": "Results: XP, coins, records and trophies",
"w": 390,
"h": 844
}
],
"cover": "assets/hall/sports/cover.webp",
"quip": "Ten sports. TEN. Somebody bowled a ball into my filing cabinet already.",
"noOld": "Grok Sports Command showed up already in uniform. No old versions. No running in the Hall."
},
"kart": {
"repo": "grok-kart",
"history": [
{
"date": "Oct 9",
"ver": "1.0",
"title": "Green flag!",
"text": "A brand new bright cartoon 3D engine built just for karts: glossy paint, soft shadows, bloom and sunny skies. 8 tracks in the Sunny Cup and Star Cup (Grok City, Canyon Rush, Candy Coaster, Breezy Beach, a haunted castle, a snowy pass, a volcano and a neon space road), with ramps, tricks, gliders, boost pads, shortcuts and hazards."
},
{
"date": "Oct 9",
"ver": "1.0",
"title": "Ten racers, eleven items",
"text": "Grok, Martina, Chinchino and seven more racers, kart bodies, wheels, gliders and paint to unlock with coins. Drift mini-turbos (blue, orange, purple), rocket starts, and 11 original items like the homing Seeker, Slime puddles, the Zap shrink and the Nova star."
},
{
"date": "Oct 9",
"ver": "1.0",
"title": "Modes for everyone",
"text": "Grand Prix cups, Time Trial against your own ghost, VS races, Balloon Battle and Coin Runners in two arenas, and online racing for up to 3 friends with a 5-letter code (CPUs fill the grid)."
},
{
"date": "Oct 9",
"ver": "1.0",
"title": "Polish lap",
"text": "Smoother kart backs with tail lights, lighter scenery for phones, a battle camera that never gets stuck in a pillar, and online races that keep everyone connected while a slow phone loads the track."
}
],
"versions": [],
"pics": [
{
"src": "assets/hall/kart/1.webp",
"cap": "The garage stage: your kart on the turntable",
"w": 390,
"h": 844
},
{
"src": "assets/hall/kart/2.webp",
"cap": "Grok City Circuit: the pack heading into turn one",
"w": 390,
"h": 844
},
{
"src": "assets/hall/kart/3.webp",
"cap": "Candy Coaster: cupcakes, gumdrops and sprinkles",
"w": 390,
"h": 844
},
{
"src": "assets/hall/kart/4.webp",
"cap": "The haunted castle at night",
"w": 390,
"h": 844
},
{
"src": "assets/hall/kart/5.webp",
"cap": "Gliding over the volcano",
"w": 390,
"h": 844
},
{
"src": "assets/hall/kart/6.webp",
"cap": "Neon space road above the planets",
"w": 390,
"h": 844
},
{
"src": "assets/hall/kart/7.webp",
"cap": "Balloon Battle in Block Party Plaza",
"w": 390,
"h": 844
},
{
"src": "assets/hall/kart/8.webp",
"cap": "Pick your racer, kart, wheels, glider and paint",
"w": 390,
"h": 844
}
],
"cover": "assets/hall/kart/cover.webp",
"quip": "Karts! In MY Hall! Chinchino did a purple drift right past my desk and I'm still finding sparks.",
"noOld": "Grok Kart Party just crossed the finish line for the first time. No old versions yet. No drifting in the Hall."
},
"disaster": {
"repo": "grok-disaster",
"history": [
{
"date": "Oct 9",
"ver": "1.0",
"title": "Opening day",
"text": "A brand new bright cartoon 3D engine with soft shadows and glow, 4 maps (Area 51, Grok City, Sunny Beach, Pine Peak), 9 disasters (kaiju attack, lightning, meteors, tornado, flood/tsunami, earthquake, volcano, blizzard and an alien invasion), enterable buildings with real rooms, basements, a subway, a mine and a nuclear bunker, coins, a shop with upgrades and hats, trophies, and online co-op for up to 3."
},
{
"date": "Oct 9",
"ver": "1.1",
"title": "A livelier town",
"text": "The camera now goes inside bunkers, basements and houses. The towns got busy: townsfolk who run for cover, cars on the roads, birds, shop signs, flowers, props and distant hills. Flood water got real waves, foam and depth, and the tsunami became a giant curling wave."
}
],
"versions": [],
"pics": [
{
"src": "assets/hall/disaster/1.webp",
"cap": "Roargon the kaiju stomps through Grok City",
"w": 390,
"h": 844
},
{
"src": "assets/hall/disaster/2.webp",
"cap": "A tornado rips through Pine Peak",
"w": 390,
"h": 844
},
{
"src": "assets/hall/disaster/3.webp",
"cap": "Tsunami! Climb the lifeguard tower",
"w": 390,
"h": 844
},
{
"src": "assets/hall/disaster/4.webp",
"cap": "Safe in the Area 51 nuclear bunker",
"w": 390,
"h": 844
},
{
"src": "assets/hall/disaster/5.webp",
"cap": "Alien invasion: run from the UFO beams",
"w": 390,
"h": 844
},
{
"src": "assets/hall/disaster/6.webp",
"cap": "A volcano erupts behind the city",
"w": 390,
"h": 844
},
{
"src": "assets/hall/disaster/7.webp",
"cap": "Flash flood: foam swirls around the town",
"w": 390,
"h": 844
},
{
"src": "assets/hall/disaster/8.webp",
"cap": "Hide inside a house during a tornado",
"w": 390,
"h": 844
}
],
"cover": "assets/hall/disaster/cover.webp",
"quip": "A kaiju, a tornado AND aliens? I'm filing this one under 'Do Not Open Indoors'.",
"noOld": "Grok Disaster Zone arrived in one piece (somehow). No old versions yet. Please keep the meteors out of the Hall."
}
};
/* the Arcade's own update history (from the grok-arcade git log, in plain words) - shown on the ARCADE card in Gus's directory */
GA.ARCADE_HISTORY = [
  { date: 'Oct 2', ver: '1.0', title: 'The Arcade opens', text: 'A neon 3D room with a few game cabinets you can walk up to and play.' },
  { date: 'Oct 2', ver: '1.2', title: 'Play together', text: 'Online multiplayer, Grok Brawl, Grok FC and the Penalty Kick cabinet.' },
  { date: 'Oct 3', ver: '1.5', title: 'Bonus Zone', text: 'Grok Land Party, Candy\u2019s Fetch, Rat Maze Dash and the Bonus Zone of mini games that pay tickets.' },
  { date: 'Oct 7', ver: '2.0', title: 'Prizes & achievements', text: 'The Prize Counter, the Achievement Gallery, 3D prizes you can carry and wear, Skee-Ball and walking around together online.' },
  { date: 'Oct 7', ver: '2.5', title: 'More cabinets', text: 'Grok Pets, Grok Life, Grok Dash and Grok Spooks cabinets, the Suggestion Booth, and lots of new bonus games and prizes.' },
  { date: 'Oct 8', ver: '3.0', title: 'Claw machines', text: 'Two real claw machines with 18 claw-only prizes, Grok Blocks, Grok Rides and Rush Hour.' },
  { date: 'Oct 9', ver: '3.5', title: 'Hall of Game Records', text: 'This very Hall, with Gus, every game\u2019s history and old versions, plus the DLC Machine 3000.' },
  { date: 'Oct 9', ver: '3.8', title: 'Heists, pickleball & sports', text: 'Grok Heist Crew, Grok Pickleball and Grok Sports Command cabinets, bonus games #17-#19, DLC packs with free starter vouchers and a roomier bonus wall.' },
  { date: 'Oct 9', ver: '4.0', title: 'Food Court, Rooftop & Secret Basement', text: 'Three new places! A Food Court with Chef Gio, snacks that give boosts and a pizza oven you cook at. A Rooftop Party Deck with a DJ booth, dance emotes, fireworks and a weekly party schedule. And a Secret Basement retro arcade with rare cabinets, puzzles and rare prizes. Get in with Gus\u2019s key (it hides somewhere new every week) or pick the lock. Plus bonus game #20 Lockpick Panic.' }
];
