# Ratita Preview Center: how it works

The Preview Center is the room behind the Food Court (door between the slushie machine and the ice cream freezer).
Lili runs it. It has three data-driven parts:

| Part | Where the data comes from |
|---|---|
| **Poster wall** (11 posters) | Open `dlc` / `suggestion` issues on `lizethbran13-cmyk/grok-arcade` (in-progress first, then queued), with nicer names and blurbs from `preview.json` |
| **Scheduled Additions board** | Same merge: `in-progress` label = BUILDING NOW, open = UP NEXT, closed / `shipped` = JUST SHIPPED (closed as "not planned" or `wontfix` is hidden) |
| **Time Jumper** | Only the `previews` list in `preview.json`, and only entries that are `"playable": true`, live on this site, and answer when pinged |
| **Save Vault** (Time Jumper Save Booth) | The `archive` list in `preview.json` (Final Betas of shipped games, `archive/<id>-beta/`), plus the current `previews` shown as waiting |

New issues show up on the wall and the board by themselves. Nothing needs a code change.
Offline, the arcade uses the last good copy it saved, then a small built-in fallback.

## `preview.json`

```json
{
  "updated": "2026-10-10",
  "items": [
    { "issue": 28, "game": "kart", "name": "Super Kart Expansion", "size": "Expansion",
      "what": "4 new racers, 2 new tracks ...", "stage": "building", "when": "In the lab now" }
  ],
  "previews": [
    { "id": "kart-expansion", "game": "kart", "issue": 28, "name": "Super Kart Expansion",
      "url": "previews/kart-expansion/", "playable": true, "built": "2026-10-11",
      "notes": "2 of the 4 new racers are in" }
  ]
}
```

* `items`: optional nicer copy for the posters and the board. `game` is a game id from `js/catalog.js` (or `arcade`), and its cover is used on the poster. `stage` is only used when GitHub can't be reached; live labels win. Things that shipped without a GitHub issue (like Ratita HQ) can be listed with `"stage": "shipped"` plus a `"shippedAt"` ISO time, so they sort into JUST SHIPPED (newest first, top 6).
* `previews`: what the Time Jumper can play. **Leave it empty unless a build really runs.** Unfinished builds belong on the posters and the board, not in the Jumper. When `previews` is empty, the Jumper says "Nothing in the Jumper right now" and offers a harmless calibration jump instead.

## Adding a playable preview (builders)

1. Make sure the work-in-progress build actually loads and plays.
2. From the arcade repo:
   ```
   node tools/make-preview.js ../grok-kart kart-expansion --game kart --issue 28 --name "Super Kart Expansion" --notes "2 of 4 racers so far"
   ```
   This copies the build into `previews/kart-expansion/`, injects the preview shim into every HTML page, and adds the entry to `preview.json`.
3. Commit and push. The Jumper picks it up on the next visit.
4. When the real thing ships, **archive** the snapshot (never delete it): `node tools/make-preview.js --archive kart-expansion` (also: `--list`).
   It moves to the Save Booth as that game's **Final Beta (Time Jumper)**, see below. `--remove` does the same thing now; previews are never deleted.
   If you forget, the Jumper hides any preview whose issue is already closed as shipped (the folder stays until you archive it).

### What the shim does (why your real saves are safe)

All the Grok games share one origin (`lizethbran13-cmyk.github.io`), so they share `localStorage`. The shim runs first in the preview's `<head>` and:

* prefixes every `localStorage` / `sessionStorage` key with `grokPreview.<id>.` (getItem, setItem, removeItem, key, length, clear), so the preview has its own sandbox save and never reads or overwrites the real game's or the arcade's keys;
* prefixes IndexedDB database names the same way;
* adds a striped **WORK IN PROGRESS · may be buggy** banner with a "back to the arcade" link;
* adds `noindex` so search engines skip the snapshot.

Limit: code that reads storage as plain properties (`localStorage.foo`) skips the shim. The Grok games use `getItem`/`setItem`, but check a build that doesn't.

## Time Jumper Save Booth (the Save Vault)

Lili's **Save Vault** terminal stands next to the Time Jumper queue. It keeps the **last** preview of every game that has been in the Time Jumper, playable forever, even after the real release.

* `node tools/make-preview.js --archive <id>` (run it when the game ships):
  * moves `previews/<id>/` to `archive/<id>-beta/` (nothing is deleted),
  * re-shims every page as the **FINAL BETA** (teal banner, "back to the arcade" link, `noindex`),
  * moves the entry from `previews` to `archive` in `preview.json`: `{ id, game, issue, name, label: "Final Beta (Time Jumper)", url: "archive/<id>-beta/", built, archived, notes }`.
* Saves: an archived beta uses its **own** prefix, `grokBeta.<id>.`. It's separate from the real game and the arcade, like previews. On the first visit it copies the old `grokPreview.<id>.` save, so Time Jumper progress carries over.
* The Vault lists every archived beta (PLAY BETA, only once the page answers), shows **Nothing archived yet** when the list is empty, and lists games still in the Jumper as *in the Jumper now (will be archived at release)*. Each slot in the 2 x 5 cartridge bay fills up: green = archived, blinking amber = still in the Jumper.
* Hall of Records: each archived beta also shows up in that game's **Old Versions** list as **Final Beta (Time Jumper)** (merged at runtime from `preview.json`, so there's no `hall-data.js` edit). It's listed first because it came before the real release.
* Re-making a preview for an id that already has an archived beta is allowed. The beta stays in the Vault.

## Time Jumper malfunctions

It's Ratita Industries tech, so it sometimes misfires. The rules:

* never on a player's very first jump, then about **1 in 4** (`GA.PreviewUI.CHANCE`); the jump right after a malfunction always works;
* every outcome is harmless and quick to get out of, and none of them touch saves (only the `grokArcade.pv*` keys);
* it does **not** use the Chrono-Gate fuses or tele-juice.

| Malfunction | What happens | Way out |
|---|---|---|
| Sparks | sparks, screen static, Lili grumbles, then the jump finishes | automatic |
| GL1TCH R00M | you land in a silly glitch room (floating junk, upside-down chair, glitch cheese worth 5 tickets once a day) | the exit portal is 2 m away, plus a **JUMP BACK** button |
| Jump drift | with 2+ previews, you land in a different preview | play it, or use the banner's back link |
| Reboot | 15 s cooldown while Lili reboots it | tap REBOOT 5 times to finish early |
| Whack the panel | tap the rattling panel 6 times | "Let Lili handle it" (6 s) |
| Rewire | plug 4 colored wires into matching sockets | "Let Lili handle it" (6 s) |
| Loose part | a cheese-cog rolls somewhere in the room; bring it back to the console | "Let Lili find it" (8 s) |

Fixing it yourself pays 2 tickets. Surviving any malfunction unlocks **Glitch Tourist**.

## Prizes and achievements

* **Sneak Peek**: finish Lili's QA checklist (say hi, inspect 3 posters, read the board, take a jump, play Chrono Courier). Reward: 15 tickets + the rare **Lili Plush**.
* **Glitch Tourist**: survive a Time Jumper malfunction.
* Bonus #32 **Chrono Courier** (cabinet in the Preview Center): 30+ wins the rare **Mini Time Jumper**. "Right On Time" is its high-score badge.

## Code map

* `js/preview-data.js`: loads `preview.json` and the GitHub issues, merges them, caches them, and checks that previews respond
* `js/preview.js`: the 3D room, Lili, the Time Jumper, posters, the board, props, the cheese-cog, and the GL1TCH R00M
* `js/preview-ui.js`: prompts and overlays, Lili's lines, the QA checklist, the jump sequence, and malfunctions
* `js/preview-prizes.js`: the Lili Plush and the Mini Time Jumper
* `js/game-chrono.js`: bonus #32 Chrono Courier
* `tools/make-preview.js`: makes, removes, and lists previews
