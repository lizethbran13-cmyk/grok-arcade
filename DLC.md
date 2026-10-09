# DLC Machine 3000: how shipped DLC unlocks work

Players invent DLC ideas at the DLC Machine 3000 (in the Hall of Game Records). Each idea becomes a GitHub issue on
this repo with the `dlc` label. Mark an idea `in-progress` while it is being built and `shipped` (or close it) when it is done.

## Prices (tickets)
| Size | Example | Unlock price |
| --- | --- | --- |
| Mini Pack | new items, skins, outfits | 25 |
| Expansion | a new level, area or mode | 75 |
| MEGA Expansion | a whole new world or campaign | 200 |

A good bonus-game round pays about 8-15 tickets, so a Mini Pack is roughly 5 rounds, an Expansion about 15
and a MEGA about 30 (similar to the Silver Trophy at the Prize Counter). Submitting an idea is free the first time, then 5 tickets.

## Shipping a DLC
1. Build the content in the game, behind a check like:
   ```js
   var owned = !!localStorage.getItem('grokDLC.rides.neon_paint'); // set by the arcade when the player buys it
   ```
   All games live on the same origin (lizethbran13-cmyk.github.io), so they share localStorage with the arcade.
   `localStorage['grokDLC.owned']` also holds a JSON list of every unlocked key.
2. Add it to `GA.DLC_SHOP` in `js/dlc.js`:
   ```js
   { id: 'neon_paint', game: 'rides', name: 'Neon Paint Pack', size: 'mini', desc: 'Glow paint for every car' }
   ```
   It then shows up in the machine's DLC Shop as LOCKED with its price, and buying it deducts the tickets
   (never below zero) and sets the key.
