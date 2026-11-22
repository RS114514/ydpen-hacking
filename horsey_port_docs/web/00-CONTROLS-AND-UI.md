# CONTROLS & UI LAYOUT — synthesis (lead document)

**Sources consolidated**
- Steam News API `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=3602570&count=100` (fetched 2026-10-26) — official patch notes
- Game data files as shipped in the public web-port repo `https://github.com/woahhcrackers/HorseyGameWeb` (paths `game/save/settings.xml.0`, `game/save/log.txt.0`, `game/data/sprites.xml.0`, `game/data/locs.xml.0`, `game/data/horsey.tmx.0`, `game/data/pop.xml.0`) — fetched 2026-10-26
- `https://horseygame.net/guides/complete-beginners-walkthrough` (video-screenshot derived; cached copy present in `/tmp/hg/guides_complete-beginners-walkthrough.txt`)
- `https://hinamizawa.ai/steam/horsey/beginner-guide/` (page is Cloudflare-blocked from this machine; only search-engine snippets readable)
- `https://tposegaming.com/horsey-game-guide/` (Cloudflare-blocked; snippet only)

**Confidence: `verified`** for everything attributed to official patch notes or to the shipped data files (two independent classes of evidence). **`single-source`** for the screenshot-derived HUD positions from horseygame.net. **`uncited-community`** for the tool-throwing description from tposegaming.

---

## ★ 0. THE CONTROLS REFERENCE (found — full table)

A real keybinding list exists: **`https://hinamizawa.ai/steam/horsey/cheats/`** (read 2026-10-26 via local browser; that host returns 403 to curl/WebFetch and `r.jina.ai` is blocked from this machine). Full details in `hinamizawa-ai-controls-tips-and-debug-menu.md`. Transcribed:

**Normal save ("the game tutorial only surfaces the lasso; everything else is on you to discover"):**
| Input | Effect |
|---|---|
| `Esc` | pause menu (music pauses) |
| `E` | **quick-close any popup / exit to the world map; from the racetrack it exits back to the paddock** |
| `Space` | advance dialogue |
| `F` | collect DNA from a target |
| `R` | switch to the gene drive (in the CRISPR lab) |
| `Ctrl+V` | paste the cure's genome from the clipboard |
| `G` (cursor over a horse) | "giddy up"/prance — paddock, stables, CRISPR lab only |
| `← ↑ → ↓` | pan the camera at the race track |
| mouse wheel | zoom (unnamed by any source, but zoom is real) |
| click-hold / release | grab–drag / drop; lasso aim–throw |
| hover only | pet |

**Debug-mode only** (after `Esc` → type `debug` → reopen pause): `Ctrl+Shift+E` spawn horse at cursor X · `R` respawn last · `Delete` delete horse under cursor · `T` trailer render mode · `U`/`Esc` exit.

**Consequence for the port:** the control surface is **six hard-coded keys + a contextual mouse cursor**. There is no movement key because there is no walking avatar; `E` is the exit/close key (which is exactly what official 1.3001's "Removed the press E to nuke your safe file feature" implies). Location-to-location travel = truck, or the `E` quick-exit.

---

## 1. The controls documented in the official patch notes

| Control | Evidence | Version |
|---|---|---|
| Mouse **grab / drag** of horses and items | Patch 1.3: "You can grab items with the silver lasso"; 1.1111: "Shopkeepers can be dragged back to their post"; 1.2: "You can't steal horses by flinging them off screen"; 1.25: "Carnivores may be captured with a silver lasso". RTTI string `b2MouseJoint` in the binary. Sprite atlas contains `GrabHand`, `GrabHand2`, `DragHorseHere`, `DragHorseHere2` (the latter two are *rendered hint text* sprites). | multiple |
| Hover-only **petting** | Not in patch notes. hinamizawa.ai: "Hover the cursor over any horse without clicking to pet it". Sprite atlas contains a dedicated cursor icon `PointerPet`. | single-source + data |
| **`G` = "giddy up" on a hovered horse** | 1.26 "Seize The Hay": "Secret hotkey: in the paddock, stables, and Crispr lab you can hover over a horse and press 'g' to make it 'giddy up'." Re-stated in 1.3002 Excalibur: "One mayest press 'G' in certain locations whilst hovering over a horse to maketh it go". (Dev-build `W` = whinny was superseded.) | official |
| **Arrow keys pan the camera at the racetrack** | v1.107: "You many now pan the camera in the race track with the arrow keys" (typo is the dev's). Sprite atlas also has `PointerPan` → a pan-cursor mode exists outside the track too. | official |
| **`E` used to do something destructive** | 1.3001: "Removed the press E to nuke your safe file feature." Proves `E` was bound in at least one context pre-1.3001 (a dev/debug binding). Nothing in the notes says what replaced it. | official |
| **Zoom exists** | 1.3: "Improved frame rate when zoomed out and drawing many horses." No patch note names the zoom input; the atlas has `EcoZoomIn`/`EcoZoomOut` icons but those belong to the conservation-tent UI. | official (feature) / unknown (key) |
| **Compass to home** | v1.107: "A compass will appear to guide you home if you get 1280 pixels away from it"; 1.108: "Compass hidden while situated in certain situations". Sprite `Compass`. Note the unit is **pixels**, i.e. world coordinates. | official |
| **Keyboard text entry on Steam Deck** | 1.5 "Hard Boiled": "You can name your horses with a keyboard on Steam Deck again" — naming is a text field; on Deck it uses the OSK. | official |
| **Keyboard text entry generally / renaming** | v1.1: "Can now rename horses on inspection screen"; 1.107: "Fixed a crash when renaming a horse while not connected to Steam" → rename happens in the *inspection screen* (a UI panel, not a hotkey). | official |
| **Mouse left-click aim/throw for the lasso** | tposegaming snippet: "equip a lasso from your toolbar. Select the lasso icon, hold left click to aim and throw it like a loop." | uncited-community |

## 2. Why there is **no keybinding list anywhere** — hard evidence

`game/save/settings.xml` (156 bytes, complete file):

```
<settings sound="1" volume="100" music="100" fullscreen="0" winx="160" winy="90"
          winw="1280" winh="720" vsync="0" background_draw="1" background_sim="1" />
```

That is the entire settings persistence. There are **no key fields**, so the shipped game has **no remappable controls and no keyboard-binding screen**. Every "controls page" a player could screenshot is therefore just this list: sound, volume, music, fullscreen, window size, vsync, plus the two odd `background_draw` / `background_sim` toggles (background layers rendered vs. simulated — this is what makes off-screen herds keep living). Anything a site publishes as a "keybinding table" is invented.

`game/save/log.txt` init line `Horsey screen size 960x540` → the game renders to a **logical 960×540 canvas** (scaled to the window). Use this as the design resolution for HUD coordinates; all guide claims about "top-left / top-right / bottom" bars are relative to it.

## 3. Cursor states (from `sprites.xml` atlas names — the full interaction vocabulary)

`Pointer`, `Pointer2`, `PointerAttach`, `PointerDig`, `PointerEat`, `PointerEnter`, `PointerGo`, `PointerInspect`, `PointerLasso`, `PointerMallet`, `PointerPan`, `PointerPet`, `PointerShoot`, `PointerTalk`, `PointerText`, `PointerThis`, `GrabHand`, `GrabHand2`, `Lasso`, `Lasso2`, `SilverLasso`, `SilverLasso2`, `AnimShovel`, `AnimShovelSilver`, `GunProj`.

Reading for the port: the cursor is **contextual** — hovering a target changes the pointer icon between pet / eat / dig / inspect / talk / attach / enter / lasso / mallet / shoot / text, and the grab state swaps to the `GrabHand` art. `PointerEnter` + `PointerGo` are almost certainly the "enter location" and "set vehicle destination" affordances (see §5). `PointerText` is the click-to-open-Keypress-text affordance (used for naming, hence the Steam Deck OSK bug).

## 4. Is there a walkable avatar? — best current answer: **no, a disembodied cursor**

Evidence for **no avatar**:
- `sprites.xml` (294 sprites) contains **no** player/human/hand-body avatar sprite. The only "hand" art is `GrabHand`/`GrabHand2`, i.e. the cursor.
- All creatures (including "human") are built procedurally from genes; `pop.xml` lists a population named **`human`** (plus `centaur`, `jockey`, `leprechaun`), and `genes.xml` contains `QUADRUPED` and `BIPED` genes. So "people" are just animal configurations — no dedicated avatar art needed, and no avatar controller.
- Interaction is a Box2D `b2MouseJoint` grab, and every documented verb is cursor-relative ("hover over a horse").
- No patch note ever mentions a movement key, walking, or a player entity's position.

Evidence that used to look like an avatar, now explained:
- Entity string `Player 1` → almost certainly the *Steam/local-player* slot name, not a world entity.
- `SmartHuman` AI + `animal_*smart*.wav` sounds → the `HIGH_INTELLECT` gene (helix 18) applied to a biped genome; the guide claim "convert owner to horse" (老番茄 @ 18:58) shows humans are animals to the simulation.
- "My House", `home` loc, compass "guide you home" → a *home location*, not a character's home position.
- Inventory bar + truck + `EnterLocation*` → the player owns things and drives, but the transport is a **click-to-drive vehicle** (see §5).

**Residual risk:** the truck's `DriveDest` marker sprite + achievement "Truck: Drive a sweet truck" prove driving exists, but no source states whether steering is arrow keys, `WASD`, or clicking a destination point. Treat "no movement key for a walking avatar" as settled, and "how the truck is steered" as the remaining open control question.

## 5. Travel / vehicle controls (partial)

- A `truck` object exists on the world map at **x=3104, y=3744** (immediately next to `home` 3040,3744≈3712) in `horsey.tmx`; sprite art: `Truck`, `TruckB`, `TruckO`, `TruckT`, `TruckTires(2)`, `TruckRam`, `TruckStripe`, `ChevyStar`; trailer: `Trailer`, `TrailerB`, `TrailerB2`, `TrailerO`, `TrailerT`, `TrailerW`.
- `DriveDest` sprite = a destination flag placed in the world → the game has a "drive to this point" interaction, consistent with click-to-steer rather than analog steering.
- The trailer is the mobile inventory/holding pen; horses are grabbed into it with the lasso (regular lasso auto-yanks the horse to your trailer, silver lasso requires you to drag it manually — r/HorseyGame via horseygame.net).
- Patch 1.3002: "Horses will accidentally escape the trailer less often." 1.1: "Unusual horses do a better job of locating the floor while in the trailer."
- The horn (`InvTrumpet`/`Trumpet` art, community "🎺 Horn" in Joe's footage) pushes/herds horses; per horseygamemap.org it "can push horses away from your vehicle".

## 6. HUD / screen layout (assembled; positions are `single-source`)

From horseygame.net's screenshot audit of Joe Bartolozzi's session (v1.0.4), plus atlas-art corroboration:

| Screen element | Position | Corroborating art |
|---|---|---|
| Bank / money counter | **top-left** ("$3169 in Joe's frame") | plain text rendering (`n64.fnt`, "Softsquare", "Picory" bitmap fonts) |
| **Sleep** button | **top-right** of the yard/stable view | `AnimSleep`, `AnimSleep2`, `SleepMoon` |
| Inventory / tool bar | **bottom**, small icons with stack counts | `InvLasso`, `InvShovel`, `InvTrumpet`, `InvGun`, `InvBalloon`, `InvFence`, silver variants `InvSLasso`, `InvSShovel`, `InvSGun`, `InvSBalloon`, `InvSFence`, plus `InvTab`, `InvTab2`, `InvTab3`, `InvTab4` (tab switchers) |
| Compass | floats toward home when >1280 px away | `Compass` |
| Race number / counter | corner of the racing screen ("Race 25" → "Race 72") | `Newspaper`, `RacerInfo`, `RacerInfo2` |
| Odds & trophy badges | per-runner rows next to the name | `MiniTrophy`, `TrophyGrey`, `StakesIcon`, `StakesIcon2`, `StakesIcon3`, `RaiseBet`, `WinningTicket`, `WinningHorse`, `StatusTrophy` |
| Status icons over each horse | floating above the animal | `StatusTired`, `StatusHungry`, `StatusHungry2`, `StatusOld`, `StatusFoal`, `StatusDead`, `StatusChamp`, `StatusTrophy`; thought bubbles `ThoughtHungry`, `ThoughtTired`; `PoofExclaim`, `WowStar`, `Tear*` |
| Dialogue / hint boxes | "Text boxes are always on screen now" (patch 1.3) — so text boxes exist and are clamped to the screen edges | `PointerText`, `HintBarn`, `HintTrack`, `DragHorseHere`, `DownHere`, `AgeWord`, `FurlongHalf` |
| Glue factory readout | wall price board "Now Paying: 3 cents/lb"; scale dial 0–3000 lb | `ScaleNeedle`, `WeightScale`, `Conveyor(2-4)`, `GlueHaus`, `Shred(2-4)`, `Scissors` |
| Inspection screen | panel opened by `PointerInspect`; supports rename | `PCMenu`, `PCMenuText` |
| Pause screen | `Pause` sprite; music pauses there (1.1111) | |
| Conservation tent | population bar + sim-speed + zoom controls | `EcoBar`, `EcoFaster`, `EcoSlower`, `EcoZoomIn`, `EcoZoomOut` |
| Power plant meters | four gauges (lift, ram bar, stopwatch, stripe) | `PowLift`, `PowRambar`, `PowStopwatch`, `PowStripe`, `DisLift`, `DisRambar`, `DisStopwatch`, `DisStripe`, `powerplant.jpg` background |
| Circus | ribbons as awards | `ItemRibbon1..4`, `Plinth`, `PrizeBox`, `PrizePresent` |
| Sumo | KO state + belt | `KO`, `KO2`, `SumoBelt`, `ChampRing`, `ChampSign`, `StakesIcon` |
| CRISPR lab | computer menu (COPY/PASTE), helix X-view, meiosis animation | `PCMenu(Text)`, `Helix`, `Meiosis`, `Meiosis2..11`, `LetterA/C/G/T`, `Cas9`, `Cas9b`, `CasRam`, `CasStripe`, `CasTires`, `GMO`, `Vial*`, `ItemDiskette`, `ItemMemory`, `ItemRambar`, `Scissors`, `Shred` |

Design consequence for the port: HUD is **absolute-positioned over a 960×540 logical canvas**, mouse-driven, with contextual cursor art; money top-left, Sleep top-right, tools bottom.

---

## Conflicts
1. **"Movement key" claims.** Several SEO sites imply a player character walks. horseygame.net's own opening-speedrun guide says "Walk over to the ace horse and drag it home too" — but that is narration of a video where the *cursor* moves. No official patch note, and none of the shipped data, supports a walking avatar. Weight: trust the data files.
2. **Petting input.** horseygame.net never documents it; hinamizawa.ai and the user's earlier pass both say hover-only; `PointerPet` proves a pet affordance exists but not whether click also pets.
3. **`G` vs `W`.** Dev build `W` = whinny (earlier pass), official 1.26/1.3002 say `G` = "giddy up" in paddock/stables/CRISPR lab only. Ship `G`.
4. **Zoom input.** Feature confirmed by patch 1.3; the key/wheel is not named anywhere. `EcoZoomIn/Out` art is conservation-tent UI, not world camera — do not map it to the mouse wheel.
5. **Lasso throw mechanics.** horseygame.net/tposegaming describe "hold left click to aim and throw a loop"; other sources describe lassos as an instant grab. Patch 1.25 ("Carnivores may be captured with a silver lasso") and 1.3 ("grab items with the silver lasso") imply grab semantics differ per tool. Unresolved.

## STILL UNKNOWN (controls)
- Truck steering input (keys vs click-to-destination) and horn trigger.
- Zoom control and whether arrow-key panning works outside the racetrack (`PointerPan` suggests it does).
- Whether `EnterLocation*` needs a click on a `PointerEnter` hotspot or a key.
- What `PointerMallet` / `PointerAttach` / `PointerDig` map to for input (click vs hold) — mallet appears in guides as "likely a stun tool", patch 1.1 mentions `Odin's Hammer`.
- Full Steam-deck control scheme (the game ships no Steam Input template that any reachable page describes).
- Steam community's 12 guides (`https://steamcommunity.com/app/3602570/guides/`) are unreachable from this network (connection reset), so no first-party controls reference has been read.
