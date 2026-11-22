# Official Steam patch notes — v1.1 → 1.59 ("Filly Cheese Steak")

**Source:** `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=3602570&count=100` (Steam News API, the `contents` field is the developer's own announcement body).
**Fetch date:** 2026-10-26
**Confidence: `verified`** (first-party; retrieved straight from Steam's API, no proxy or transcription).

Full-text patch notes for Horsey Game are available through the Steam News API even though `store.steampowered.com/news` and `steamdb.info` are blocked from this machine. There are exactly **14 announcements**, all `steam_community_announcements`, spanning 2026-02-24 → 2026-05-14. The launch build (Feb 18 2026) has no announcement, so anything before v1.1 must come from other sources.

Chronological digest, with the mechanically-load-bearing lines kept close to the dev's wording:

## 1.59 "$1.59 Filly Cheese Steak" — 2026-05-14
- Temporarily removed the **test track at Surebreed Steeples**.
- New renderer (SDL) error checking for a black-screen bug; transparency fixes; "glitchy lines in the world map greatly reduced"; alt-tab lag fix; music fix attempt.

## 1.5 "Hard Boiled" — 2026-05-08
- Race music sometimes not playing → fixed.
- **"You can name your horses with a keyboard on Steam Deck again."**
- A condition blocked **parlay bets** → fixed (so parlays exist).
- Biohacker crashed if the vat held a single **homozygous** genome.
- Renderer rewritten from OpenGL to **SDL_Render**.

## 1.4 "Macaroni Mambo" — 2026-04-24
- Ported to Mac; upgraded to **SDL3**; Windows version maybe better re: graphics glitches.

## 1.3002 "Excalibur" — 2026-04-17
- "Fixed the unlawful stealing of horses"; horses eat dropped items more realistically; deceased horses in the world may **drop their equipment**; **"'G' in certain locations whilst hovering over a horse to maketh it go"**; horses escape the trailer less often; plutonium in an empty vat no longer freezes the game.

## 1.3001 "Lickety Split" — 2026-03-27
- **"Removed the press E to nuke your safe file feature."**
- Horse names sometimes blank → fixed; **trophies no longer show the attachment cursor**; shooting a horse lets you get your stuff back.

## 1.3 "Flipso Facto" — 2026-03-25
- **Infinite silver shovel is back** with a **two-second cooldown** ("dig away! Go ahead and fill your world with junk and potholes").
- **Grab items with the silver lasso and drop them in holes to bury them and fill up the hole.**
- "Text boxes are always on screen now."
- "Fixed the stealing of various objects. Thank you speedrunners aka beta testers."
- **Caves can be destroyed with the shovel**; **plutonium counts as food**; large horses smash fences less indiscriminately; better framerate when **zoomed out** with many horses; attaching footwear no longer teleports horses; **Sumo 10% less janky**; abandoned-track crash fix; loose ends in extreme population cases.

## 1.26 "Seize The Hay" — 2026-03-17
- **An old abandoned racetrack** added: bring your horses to race each other, **"Look to the south-east of the Crispr lab."**
- Horses get tired when exiting mid-circus-event.
- **"Secret hotkey: in the paddock, stables, and Crispr lab you can hover over a horse and press 'g' to make it 'giddy up'."**

## 1.25 "Stampede Pancakes" — 2026-03-14
- "Bipeds fall over less"; wheeled horse in the powerplant wasn't working; two achievements fixed; gene tweaks to reduce glitch-outs; big carnivores smash fences instead of ghosting; **limbs may detach under high stress**; **carnivores may be captured with a silver lasso**.

## 1.2 "Minty Fresh" — 2026-03-07
- **"You can cut and paste genomes to your real life clipboard with the Crispr lab computer."**
- Fixed the release-&-recapture cheat; anomalies from odd gene combos; **"You can't go to the track until you collect your dung monies."**; can't steal horses by flinging them off screen.

## 1.1112 "Odin's Hammer" — 2026-03-04
- "I have fixed the last remaining crash bug… 100% crash free!"

## 1.1111 "Sexy Molasses" — 2026-03-03
- Can't accidentally drop the thing in the thing; CRISPR device more reliable at **gene copying**; **"Shopkeepers can be dragged back to their post to resume their jobs"**; free glitchy horses to dispose of them; no crash if a horse touches conveyor **and** scale simultaneously; **horse mass calculation tweaked**; horses facing-left fixes; music pauses on the pause screen; shovelling on water fixed.

## 1.108 "Distant Bagpipes" — 2026-03-01
- **"Compass hidden while situated in certain situations."**
- Crash if no qualified geneticist to operate the CRISPR machine; save-game crash from helices with "a quantum number of arms"; **"Legs with prismatic joints (in Box2D parlance) will sort behind the body"**; bowties dropped in the world crashed the powerplant; gift baskets repeated the same item; **"Shovel exhibits less infinitude."**

## 1.107 "Iridium Gaskins" — 2026-02-27
- Crash renaming a horse while offline; crash when a horse eats a vial dropped outside; **"A compass will appear to guide you home if you get 1280 pixels away from it."**
- **"Recalcitrant horses may be bribed to race with a beverage."**
- **"You many now pan the camera in the race track with the arrow keys."**
- Levenshtein-distance de-duplication of horse names; less delay between races on TV; "positive net cash flow when **dragging horses around in the paddock**" fixed.

## v1.1 "Nostril-Damus" — 2026-02-24
- **"Due to player requests, shovel price has been lowered to $95."** ← the only official price statement in the patch notes.
- Added confirmation to game reset; **Mabel's eyebrow obsession** more fleshed out; high-res **volt meter graphics in the powerplant**; **"Can now rename horses on inspection screen"**; **"Esoteric changes to Clide's inventory"** (Clide = the car dealer); achievements crash on Linux fixed.

---

## Conflicts / notes on this source
- The shovel price here ($95, v1.1, 2026-02-24) directly supports horseygame.net's flagged discrepancy: Cheru's video shows $95 while 逍遥散人's later video shows $150 → the community figures were recorded on different patches, **or** one creator misread. Official note says $95 as of v1.1.
- 1.59 removes the **test track at Surebreed Steeples** "temporarily" — a port that models a practice track should note it exists at the `surebreed` location and was disabled in the live build as of 2026-05-14.
- 1.3 says infinite silver shovel came **back**, i.e. an earlier build had it, it was removed, then restored with a cooldown. Guide claims about "shovel exhibits less infinitude" (1.108) are the same arc.
- No announcement exists for a `1.27`–`1.29` or `1.31+` line; version numbering is idiosyncratic (1.26 → 1.3001), so don't infer missing content from gaps.
