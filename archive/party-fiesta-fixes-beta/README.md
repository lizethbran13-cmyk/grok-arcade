# Grok Land Party

A Mario Party-style board game set in the Grok Land universe. Play online with friends (2-3 players) or against AI bots, right in the browser. It works on phones in portrait and landscape.

**Play:** https://lizethbran13-cmyk.github.io/grok-land-party/

## Features
- **4 party boards:** Candy Clouds, Lava Volcano, Frozen Peaks, Haunted Forest. Each has dice, coin, star, event and lucky spaces, plus shortcuts (some have a toll) and a star to buy for 20 coins.
- **Game length:** 5, 10 or 15 turns. The last 3 turns are a Final Frenzy where coin spaces count double. At the end you get bonus stars for most mini game wins and most coins held at one time.
- **13 mini games** (free-for-all and 1 vs 2): Coin Dash, King of the Hill, Block Drop, Mash Race, Memory Switch, Hot Potato, Stomp Party, Ice Sumo, Simon Says, Balloon Pop, Quick Draw, Cannon Chaos, Tug o' War.
- **Mini Game Free Play** mode.
- **Online play:** tap PLAY ONLINE, then HOST to get a 5-letter room code; friends enter that code to JOIN. Empty seats are filled by AI (Easy or Normal). If a player leaves, an AI takes over their seat.
- **Controls:** touch joystick and buttons on phones. On a computer use WASD/arrows, Space, keys 1-6, Esc for the menu and M for mute.

## DLC: Super Fiesta Expansion (MEGA, 200 tickets)
Unlock it at the **DLC Machine 3000** in the [Grok Arcade](https://lizethbran13-cmyk.github.io/grok-arcade/). It unlocks right away, with no reload needed (localStorage key `grokDLC.party.s_per_fiesta_expansion`). Without it you see a locked 🎉 FIESTA MODE button and a teaser.
- **FIESTA MODE:** a free-roam party with no turns, played with friends online or with CPU pals. Walk around the new **Fiesta Isles** world and into its 3 towns: **Piñata Plaza**, **Taco Pueblo** and **Maraca Bay**. Use the gates or ride the free **Fiesta Bus**.
- **24 townsfolk** with their own lines: mariachi band, DJ, food vendors, a lifeguard, a sea captain and more. 6 of them challenge you to a mini game (beat them for +8 coins). Walk up to any friend or CPU pal to challenge them too. Everyone at the fiesta plays, and then you go right back to roaming.
- **Things to do:** collect coins; eat street food that gives silly power-ups (taco = speed, elote = double coins, churro = coin magnet, paleta = brain freeze, agua fresca = dance bonus); play the rhythm **dance floor** (ranks S–C); smash the **piñata** (8 hits and it bursts into coins); request a song from the mariachi band; make a wish at the fountain; nap in a hammock; build a sandcastle together; and fool around with emotes (wave, dance, backflip, laugh).
- **Fiesta Passport:** 10 stamps. Get all of them to wear the **Golden Sombrero**.
- **Bonus board:** **Fiesta Isles** for Party Board mode, with Piñata Party and Mariachi Parade events.
- **Co-op:** if the host owns the expansion, guests can play Fiesta Mode and the Fiesta board in the host's room.
- Controls: joystick/WASD to move, A button/Space for the action shown on it, 1-4 for emotes and Q for the passport.

Built with Three.js and PeerJS (WebRTC). No build step is needed: it is a plain static site.
