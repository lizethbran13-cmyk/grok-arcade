# Grok Blocks: Re-Blocked 🦓⛏️💎

**A remaster of [Grok Blocks](https://lizethbran13-cmyk.github.io/grok-blocks/) on a new engine** (Suggestion Booth #55). It's still blocky, but now it's Minecraft-shiny and bright, and dark underground. All of the original game is still here, and there's lots of new stuff.

**Play:** https://lizethbran13-cmyk.github.io/grok-blocks-reblocked/ *(work in progress: Time Jumper preview first, it ships after David's greenlight)*

## New in Re-Blocked
- **New engine (three.js r158):**
  - Filmic tone mapping and sRGB colour.
  - Soft sun shadows that follow you.
  - A gradient sky with a moving sun, a moon, twinkling stars and drifting blocky clouds.
  - Sky reflections on ice, crystals and water.
  - Every block has a real pixel texture, with per-corner shading in the gaps. Grass blocks have dirt sides.
- **Day/night cycle:** on by default. Lamps, torches and lanterns light up at night, fireflies come out, and **your headlamp switches on** after dusk and underground.
- **New biome: Crystal Caves** (south gate):
  - It's really dark down here: a rocky ceiling, glowing crystal veins, glow mushrooms, torches along the trail, stalagmites and old mine carts.
  - **Lava pools.** Step in one and you drop a dart and get carried to the gate. Drive the truck into lava and the cargo jumps out and runs, so you have to find it again. Nobody ever gets stuck.
  - **Mine ore** with your pickaxe: coal +10, gems +30, gold +50.
- **New biome: Blossom Hills** (south gate): cherry trees, bamboo groves, a koi pond, stone lanterns, flower fields and falling petals.
- **6 new animals:** Glow Axolotl, Glow Bat, Cave Bear, Giant Panda, Red-crowned Crane and Snow Monkey.
- **4 new cases:** Into the Crystal Caves, Blossom Trouble, Bear in the Dark and Monkey Business (night).
- **New tools and upgrades:**
  - Pickaxe and headlamp.
  - Mega Headlamp upgrade: brighter and farther.
  - Diamond Pickaxe upgrade: fewer swings and more points.
- **Family pet cameos:**
  - Luna, Pi-rat, Snowie, Candy and Torty at the new **Pet Corner** in Base Camp, with a pond, kennel, rat house, cheese, a hamster wheel and toys.
  - Out in the biomes: Pi-rat and Luna in the caves, Snowie in the snow, Candy in Blossom Hills, and Torty in the jungle and wetlands.
  - Walk up and they talk to you.
- **Own save** (`grokBlocksRB_*`), so your original Grok Blocks progress is untouched.

---

## Everything from the original Grok Blocks

A blocky voxel-world **wildlife rescue** game for phones and desktop. You're a ranger on the case: explore five biomes, calm animals with limited tranquilizer darts, load them onto your truck and get them to a sanctuary before the poachers do.

**Play:** https://lizethbran13-cmyk.github.io/grok-blocks/

## What's in it
- **Base Camp + 5 biomes:** Golden Savanna, Deep Jungle, Snow Peaks, Mist Wetlands and Desert Canyon. Each is a deterministic voxel heightmap with its own palette, cover, roads, trails and a poacher camp.
- **18 species**, each with a temperament:
  - **chill:** walk up and dart.
  - **runner:** bolts, so chase it in the truck and cut it off.
  - **feisty:** winds up and charges. Approach downwind, sneak through cover, or send the crew to distract it.
- **Capture loop:** limited darts (restock at the camp supply crate) → LOAD the sleeping animal → drive back through the camp gate → UNLOAD in the **Sunlands** or **Frostmarsh** sanctuary. Delivered animals live there for good.
- **Truck:** gas, brake/reverse, steering and handbrake. Take the SEAT in the back and the crew drives while you dart. Ramming an animal spooks it and costs a star.
- **Poachers** on foot and in jeeps:
  - They flash a "!" before chasing, so you get a warning.
  - Getting caught confiscates the truck's cargo and sends you back to camp. Delivered animals and case progress are kept.
  - Use flares or the crew's siren to scare them off.
  - If you take too long, they go after the case animals. Bump their jeep to free a caged animal.
- **Drone:** when a runner bolts, tap DRONE. It follows and slows them with a visible freeze ray, so you don't have to corner them. Tap again to fly it yourself (recon), mark animals and poachers on the minimap, then send it home when the battery runs out. Case **Sky Eye** is a recon job in the snow.
- **Poacher mode** (separate save): cartoon contracts where you crate animals alive, sneak into a sanctuary to unlock a pen, and sell the crates to a shady collector at a hideout van. Rangers, ranger jeeps and a heat meter chase you. A bust drops the haul, not your cash. Six contracts and black-market gear.
- **9 cases** with a tracker, a yellow objective arrow and 1–3 stars, plus free roam:
  - First Rescue (tutorial)
  - Stripe Chase
  - Relocate the Rhino
  - Jungle Hush
  - Night Rescue
  - Wetland Watch
  - Stop the Convoy
  - The Big Herd
  - Sky Eye (drone recon)
- **Points** buy upgrades: darts, range, softer dose, engine, cargo bed, flares.
- **Fair play:**
  - Assist mode
  - No game over; a bust sends you back to camp with your progress kept
  - Radio back to camp from the pause menu
  - A tutorial
- **Polish:**
  - Procedural music and sound effects with mute
  - An optional day/night cycle
  - Minimap and wind indicator
  - Field guide
- **Co-op (2–3 players):** the host runs the game, friends join with a 5-letter room code (PeerJS), and everyone gets a name tag. Friends can ride in the truck and dart from the back. If someone leaves, the game keeps going.
- **Touch controls** built for iPhone Safari in portrait and landscape (buttons ≥ 58 px). On a keyboard: WASD or the arrows to walk or drive, Shift for the handbrake, Space or F to dart, E to use, Q for a flare, C to sneak, T to switch seats, R for the crew, Esc to pause.

Built with three.js. All art is generated in code from blocks, with no external assets.
