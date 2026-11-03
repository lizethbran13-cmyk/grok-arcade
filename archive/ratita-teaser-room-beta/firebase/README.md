# Live Sync save server (Firebase project `grok-arcade-1`)

Bob's Account Desk Live Sync (`js/account-sync.js`) stores saves in **Cloud Firestore**.
The web config in `js/account-sync.js` is public by design; **the security rules are what protect the saves.**

## Put the rules in (one time, about 1 minute)
1. Open https://console.firebase.google.com/project/grok-arcade-1/firestore/rules
2. Select everything in the editor and delete it.
3. Paste the whole of [`firestore.rules`](firestore.rules).
4. Press **Publish**.

Until then the database runs in **test mode** (anyone can read/write everything, and Google turns test mode off
automatically after ~30 days, which would make Live Sync show "server locked").

## What the rules allow
| Path | Who | What |
|---|---|---|
| `grokSync/{id}` (live) / `grokSyncBeta/{id}` (Time Jumper + tests) | anyone with the 6-digit ID | read the friend card (name, device count, stats only if sharing is on) |
| same | only linked devices | change the card (hash-chain secret derived from the vault key) |
| `.../{id}/req/{random}` | a new device | ask to link; a linked device answers once (encrypted for the asking device only) |
| `.../{id}/vault/{43-char key}` | only devices that know the key | read/write the save (no listing, max 3 devices, blob <= 1 MB) |
| anything else | nobody | locked |

Rules were tested with the Firestore emulator (28 allow/deny cases).
