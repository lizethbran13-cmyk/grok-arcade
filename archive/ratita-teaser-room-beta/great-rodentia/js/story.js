// Complete lore, districts, clues, missions, and dialogues for Grok Great Rodentia (Year 000 1).

export const LORE_INTRO = {
  year: '000 1 (301 Post-Departure)',
  calendarNote: '301 years ago, humans moved to Australia ("different name, no time to tell") and the old calendar was abolished. In the USM Calendar, every "0" equals 100 years and a space + number equals single years: 000 1 = Year 301!',
  city: 'Great Rodentia — Capital Metropolis of the State of Rodentia & the United States of Mammalia (USM)',
  summary: 'Great Rodentia supplies 3 billion pounds of cheese every 2–3 years to all of USM. Now the sky burns crimson-amber over a city in unrest: the real Ratita Industries gang (Luna, Pi-rat & Snowie) is locked in National Ratita Prison for a classified crime nobody in the public even knows! Dr. Evilest cloned them into their Evil Twin Sisters, launched the crime movement "Ratita Now➡️", drained hundreds of thousands of pounds from the cheese banks to spark the Great Cheese Shortage of 000 1, framed Torty\'s emergency Cheese Banks as "poisonous", and ambushed Candy to seize RuffSources!',
};

export const DISTRICTS = [
  {
    id: 1,
    name: 'District 1: Rats Isle & Torty Cheese Bank Plaza',
    short: 'Rats Isle & Bank Plaza',
    zRange: [-46, -15],
    spawn: [0, -34],
    badge: '🏡🧀 DISTRICT 01',
    lore: 'Brie\'s home neighborhood on Rats Isle! Brie grew up in a house of 4 (her parents, her older brother Bram, and herself). After her parents went missing guarding the Cheese Vaults during a Ratita Now➡️ raid, Brie moved in with her sweet Grandma Nana Gouda—who knows every rat conspiracy in USM! Across the street sits Torty\'s Emergency Cheese Bank (stocked with Torty Town & Tortuga Isles cheese) and the Government Task Force outpost run by Grandpa Commander Cheddar and Brother Bram.',
    reqText: 'Starting District — Always Open',
    goodGoal: 'Decode Grandma\'s Rat Conspiracy Board & prove Torty\'s emergency cheese was framed to unlock District 2!',
    evilGoal: 'Spike Torty\'s Cheese Bank sample under a fake alias & jam the Task Force Outpost scanner to unlock District 2!',
  },
  {
    id: 2,
    name: 'District 2: Dog Sub-City & Seized RuffSources',
    short: 'Dog Sub-City & RuffSources',
    zRange: [-15, 13],
    spawn: [0, -4],
    badge: '🐶🍽️ DISTRICT 02',
    lore: 'In the United States of Mammalia, tortoises are beloved while dogs are unfairly stereotyped and segregated into the Dog Sub-City—except beloved nice dogs like Candy, head of RuffSources! Candy formed the Civil Task Force of Dogs to help citizens and prove dogs are good. But Ratita Now➡️ ambushed Candy at the Golden Bone Dinner Hall, tried filing a fake complaint under their busted alias "Claudia Marry Weather" (which got rejected!), and seized RuffSources HQ anyway!',
    reqText: 'Requires District 1 Missions Complete (Grandma\'s Conspiracy Board + Torty\'s Cheese Bank Lab)',
    goodGoal: 'Uncover the rejected "Claudia Marry Weather" complaint at the Dinner Hall & free Candy at Seized RuffSources HQ to unlock District 3!',
    evilGoal: 'Ambush the Golden Bone Dinner Hall & lock down RuffSources HQ into the Ratita Now➡️ network to unlock District 3!',
  },
  {
    id: 3,
    name: 'District 3: Unsecure Gov Vaults & Ratita Now➡️ Underground',
    short: 'Gov Vaults & Underground',
    zRange: [13, 41],
    spawn: [0, 24],
    badge: '🏦🧪 DISTRICT 03',
    lore: 'After Torty was arrested and Tortuga Tech was forced to pause operations under close watch, all cold-storage cheese was handed over to the Unsecure Government Cheese Vaults—right where Brie\'s Mom and Dad worked security before disappearing! Across the avenue lies the neon-lit Ratita Now➡️ Underground Network & Dr. Evilest\'s secret Shadowlight Clone Lab where the Evil Twin Sisters were born.',
    reqText: 'Requires District 2 Missions Complete ("Claudia Marry Weather" Proof + RuffSources HQ)',
    goodGoal: 'Rescue Brie\'s Mom & Dad from the Unsecure Gov Cheese Vaults & hack Dr. Evilest\'s Clone Lab manifest to unlock District 4!',
    evilGoal: 'Drain 300,000 lbs of cheese from the Unsecure Gov Vaults & overclock Dr. Evilest\'s Clone Vats to unlock District 4!',
  },
  {
    id: 4,
    name: 'District 4: National Ratita Prison & Golden Gouda Capitol Vault',
    short: 'Prison & Capitol Vault',
    zRange: [41, 74],
    spawn: [0, 52],
    badge: '🏛️👑 DISTRICT 04',
    lore: 'The high-security heart of Great Rodentia and all of USM! On the west side stands National Ratita Prison, where the real Luna, Pi-rat, Snowie, and Torty are locked away—even though no citizen in USM knows what crime the OG gang was even charged with! On the east rises the USM Capitol Rotunda & Relic Vault housing the priceless Golden Gouda Relics and the final showdown for the fate of Mammalia.',
    reqText: 'Requires District 3 Missions Complete (Brie\'s Parents Rescued + Dr. Evilest\'s Clone Manifest)',
    goodGoal: 'Free the real Luna, Pi-rat, Snowie & Torty from National Ratita Prison and solve the Golden Gouda Mystery to save USM!',
    evilGoal: 'Lock down National Ratita Prison and seize the Golden Gouda Relics to force USM to surrender to Ratita Now➡️!',
  },
];

export const CLUES = [
  {
    id: 'c01_calendar',
    district: 1,
    title: '000 1 USM Almanac & Calendar Decree',
    where: 'Grandma\'s Conspiracy House',
    summary: 'Explains why the year is written "000 1": 301 years ago, humans moved to Australia ("different name, no time to tell") and the old calendar was abolished. Each "0" is 100 years and space + digit is single years!',
  },
  {
    id: 'c02_parents_badge',
    district: 1,
    title: 'Mom & Dad\'s Cracked Vault Security Badges',
    where: 'Grandma\'s Conspiracy House',
    summary: 'Brie\'s parents (Camembert & Roquefort) worked together at Cheese Vault Security. Their badges recorded two identical sets of Luna, Pi-rat, and Snowie on the night of the raid!',
  },
  {
    id: 'c03_torty_toxin',
    district: 1,
    title: 'Falsified Tortuga Isles "Poison" Report',
    where: 'Torty\'s Emergency Cheese Bank',
    summary: 'Torty imported emergency cheese from Torty Town and the Tortuga Isles to stop the Great Cheese Shortage. Spectral analysis proves the "toxin" was harmless synthetic dye planted by Ratita Now➡️ under fake aliases!',
  },
  {
    id: 'c04_house_raid',
    district: 1,
    title: 'Task Force House Raid Dossier',
    where: 'Gov Task Force Outpost (Torty Bank)',
    summary: 'Grandpa & Brother Bram\'s file: the Evil Twins initially "helped" the government expose the OG gang—until a Task Force house raid revealed the Twins were the real masterminds, triggering the city lockdown!',
  },
  {
    id: 'c05_marryweather',
    district: 2,
    title: 'Rejected "Claudia Marry Weather" Complaint',
    where: 'Golden Bone Dinner Hall',
    summary: 'Stamped REJECTED BY USM CLERK: Ratita Now➡️ tried to shut down Candy\'s RuffSources using the fake alias "Claudia Marry Weather"—an alias they were already busted using before!',
  },
  {
    id: 'c06_civil_dogs',
    district: 2,
    title: 'Candy\'s Civil Task Force of Dogs Charter',
    where: 'Golden Bone Dinner Hall',
    summary: 'Even though dogs are unfairly segregated into Dog Sub-City while tortoises are beloved, Candy founded the Civil Task Force of Dogs to help starving citizens across Great Rodentia.',
  },
  {
    id: 'c07_ruffsources_tunnel',
    district: 2,
    title: 'Ratita Now➡️ Underground Conduit Map',
    where: 'Seized RuffSources HQ',
    summary: 'Shows how the Evil Twins wired the seized RuffSources building directly into the Ratita Now➡️ underground cheese smuggling network.',
  },
  {
    id: 'c08_unsecure_vault',
    district: 3,
    title: 'Unsecure Gov Vault Transfer Order',
    where: 'Unsecure Government Cheese Vaults',
    summary: 'When Torty was arrested and Tortuga Tech paused operations under close watch, millions of pounds of cold-storage cheese were moved into these poorly guarded government vaults—making them easy prey for Ratita Now➡️!',
  },
  {
    id: 'c09_parents_log',
    district: 3,
    title: 'Camembert & Roquefort\'s Eyewitness Log',
    where: 'Unsecure Government Cheese Vaults',
    summary: 'Brie\'s parents saw Dr. Evilest directing three crimson-eyed clones while the real Luna, Pi-rat, and Snowie were knocked out with sleep gas and planted at the Capitol!',
  },
  {
    id: 'c10_evilest_clones',
    district: 3,
    title: 'Dr. Evilest\'s Shadowlight Cloning Blueprint',
    where: 'Ratita Now➡️ Underground Clone Lab',
    summary: 'Reveals how Dr. Evilest (now in hiding) spliced DNA from Luna, Pi-rat, and Snowie to create the Evil Twin Sisters—programmed to starve Great Rodentia (which produces 3 billion lbs of cheese every 2–3 years) until USM surrenders!',
  },
  {
    id: 'c11_secret_charge',
    district: 4,
    title: 'Classified Prison Warrant #0001-GG',
    where: 'National Ratita Prison',
    summary: 'Answers why nobody in the public knew what crime the OG gang committed: the warrant was classified TOP SECRET because the stolen Golden Gouda relic contains the original USM Founding Charter!',
  },
  {
    id: 'c12_golden_gouda_truth',
    district: 4,
    title: 'The Secret of the Golden Gouda Relics',
    where: 'USM Capitol Golden Gouda Vault',
    summary: 'THE BIGGEST MYSTERY SOLVED: The priceless Golden Gouda isn\'t just ancient cheese—inside its wax seal is the USM Emergency Supreme Authority Key! Whoever holds it during a national famine legally becomes Ruler of the United States of Mammalia!',
  },
];

export const TWIN_PROFILES = {
  evil_luna: {
    id: 'evil_luna',
    name: 'Shadow Luna (Evil Twin)',
    role: 'Supreme Strategist of Ratita Now➡️',
    ability: 'Shadow Cloak & Forged Alias Warrants',
    color: '#ef4444',
  },
  evil_pirat: {
    id: 'evil_pirat',
    name: 'Dread Pi-rat (Evil Twin)',
    role: 'Underground Vault Raider',
    ability: 'Grapple Hook & Heavy Cheese Siphon',
    color: '#f97316',
  },
  evil_snowie: {
    id: 'evil_snowie',
    name: 'Frostbite Snowie (Evil Twin)',
    role: 'Cryo-Toxin & Security Hacker',
    ability: 'Cryo-Stun Blaster & Drone Override',
    color: '#ec4899',
  },
};

for (const c of CLUES) {
  if (!c.loc) c.loc = c.where;
  if (!c.body) c.body = c.summary;
}

export const ENDINGS = {
  good_win: {
    badge: '🏆 CANON VICTORY — GREAT RODENTIA SAVED (YEAR 000 1)',
    color: '#10b981',
    title: 'Brie Clears the OG Gang & Saves the Golden Gouda!',
    subtitle: 'Year 000 1 (301 Post-Departure) • United States of Mammalia',
    paragraphs: [
      'With all 12 clues pinned to Grandma Nana Gouda\'s Conspiracy Board, Brie storms the USM Capitol Rotunda alongside Grandpa Cheddar, Brother Bram, her rescued Mom & Dad, Candy\'s Dog Civil Task Force, Torty (Martina), and the freed founders of Ratita Industries: Luna, Pi-rat, and Snowie!',
      'Using the spectral toxin analysis from Torty\'s Cheese Bank and the rejected "Claudia Marry Weather" dinner ledger, Brie exposes Shadow Luna, Dread Pi-rat, and Frostbite Snowie as Dr. Evilest\'s Shadowlight Clones!',
      'The priceless Golden Gouda Relic—and the USM Emergency Supreme Authority Key sealed inside its golden wax—is returned to the Capitol Vault. Tortuga Tech\'s emergency cheese banks reopen, RuffSources restores Dog Sub-City\'s rights, and Great Rodentia celebrates its youngest hero!'
    ],
  },
  good_lose: {
    badge: '🚨 CAPTURED — RATITA NOW➡️ SEIZES THE CAPITOL',
    color: '#ef4444',
    title: 'Brie Ambushed by the Evil Twin Sisters!',
    subtitle: 'Year 000 1 • National Ratita Prison Lockdown',
    paragraphs: [
      'Before Brie could expose the clone conspiracy, Shadow Luna, Dread Pi-rat, and Frostbite Snowie triggered the Capitol Rotunda laser trap and overwhelmed her!',
      'With Brie locked in National Ratita Prison beside her parents, Candy, Torty, and the real sisters, Ratita Now➡️ cracks open the Golden Gouda Relic and claims the USM Emergency Supreme Authority Key.',
      'Don\'t give up! Regroup at Grandma Nana Gouda\'s Conspiracy House or retry the District to turn the tables on Dr. Evilest\'s clones!'
    ],
  },
  evil_win: {
    badge: '😈 NON-CANON EVIL TWIN VICTORY — SUPREME TAKEOVER',
    color: '#dc2626',
    title: 'The Evil Twin Sisters Rule Great Rodentia!',
    subtitle: 'Non-Canon "What If?" Ending • Ratita Now➡️ Triumphant',
    paragraphs: [
      'Switching seamlessly between Shadow Luna, Dread Pi-rat, and Frostbite Snowie, Dr. Evilest\'s clones locked down Torty\'s Cheese Bank, crushed Candy\'s Dog Civil Task Force at RuffSources, drained the Unsecure Gov Cheese Vaults, and outmaneuvered Grandpa Cheddar\'s Task Force!',
      'In the USM Capitol Rotunda, the Evil Twins shattered the wax seal of the Golden Gouda Relic and claimed the USM Emergency Supreme Authority Key during the engineered cheese famine.',
      'With 3 billion pounds of cheese under Ratita Now➡️ control, Great Rodentia bows to the Evil Twin Sisters—until Brie\'s next canon run!'
    ],
  },
  evil_lose: {
    badge: '⚖️ EVIL TWINS EXPOSED — CLONE MATRIX SHUT DOWN',
    color: '#f59e0b',
    title: 'Brie & Grandpa\'s Task Force Foil the Evil Twins!',
    subtitle: 'Non-Canon "What If?" Defeat • Clone Takeover Stopped',
    paragraphs: [
      'Despite the Evil Twins\' sabotage across Great Rodentia, Brie, Grandpa Commander Cheddar, Brother Bram, and Candy\'s Dog Civil Task Force cornered the clones inside the Capitol Rotunda!',
      'Broadcasting Dr. Evilest\'s Cloning Blueprints across every screen in the United States of Mammalia, Brie proved that the real Luna, Pi-rat, Snowie, and Torty were innocent all along.',
      'You can retry Evil Twin Mode anytime or switch back to Brie\'s Canon Detective Mode!'
    ],
  },
};
