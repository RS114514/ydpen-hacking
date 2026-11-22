# Side activities — circus, sumo, power plant, digging/fossils, balloon, truck, conservation

**Sources (fetched 2026-10-26):**
- Official patch notes (Steam News API) — see `steam-patch-notes-official.md`
- `https://github.com/woahhcrackers/HorseyGameWeb` `game/data/sprites.xml` + `horsey.tmx` (`verified` object list & art)
- `https://horseygame.com/guides/circus-challenges`, `/guides/sumo-wrestling`, `/guides/swamp-guide` (fan wiki; the *numbers* in them match nothing else, the *structure* is plausible — `single-source` at best)
- `https://horseygamemap.org/guides/horsey-game-sumo-guide`, `/guides/horsey-game-tools-terraforming-guide`, `/guides/how-to-unlock-normal-suburban-house`, `/guides/what-does-the-ram-bar-do-in-horsey-game`, `/locations/*` (see the big warning below)
- `https://horseygame.net/guides/horsey-game-horse-lifecycle`, `/guides/late-game-troubleshooting`, `/guides/hidden-secrets`
**Confidence: mixed per section, tagged inline.**

> **⚠ Fabrication alert — horseygamemap.org's *narrative* guides.** Its location pages list coordinates that match the shipped `horsey.tmx` exactly (so those pages are derived from real map data), but its tutorial pages contain invented content: a "Normal Suburban House" quest with **three hidden pressure pads** (green trash can / oak tree / dog house), a **"200 gold coins"** price, a **"Good Neighbor achievement"** (no such achievement exists in the 26-name roster) and a "neighbor alert → teleported to town square" mechanic. Worse, it places the "Normal Suburban House" at **X 3360, Y 3488**, which in the shipped map is the location typed **`acres`**. **Do not port anything from that page.** Its sumo/terraforming pages are generic-sounding and mostly unverifiable; use them only as hypothesis lists.

## 1. Circus (`circus` loc at 2464, 3520)
Four event types, each rewarded with a **ribbon** (shipped art: `ItemRibbon1`…`ItemRibbon4`, `Plinth`, `PrizeBox`, `GrandStand`):
| Event | Reported rule | Build advice | Evidence |
|---|---|---|---|
| **Diving / balloon-the-bucket** | small horse, low steady propulsion, light enough not to shatter on landing; land in the green bucket, don't touch the floor | compact body, centred balance | `single-source` (horseygame.com) |
| **Car pull** | pull a car uphill without stalling; matches the Steam achievement **"Strong — Pull a truck"** | large mount, low head set, long neck as counterbalance, heavy for traction | achievement name is `verified`; build advice `uncited-community` |
| **Trampoline** | reach a target height **four times** without erratic spins; achievement **"Trampoline — Perform on the trampoline"** | medium size, smooth symmetrical body, land on all four legs | achievement `verified`; count 4 `single-source` |
| **Acrobatics** | cross a yellow-green strip while an acrobat flails on your back without tipping backwards; achievement **"Acrobat — Do some acrobatics"** | forward weight bias, low CoG, momentum before the acrobat mounts | achievement `verified`; rest `single-source` |
- Factual anchors: official 1.26 "Horses will get tired when exiting the game in the middle of a **circus event**" → circus events are timed/ongoing and consume horse fatigue; horseygame.net lists "Freak Show — exists as a separate event ('enter them to a freak show'), entry mechanic and prize structure not shown". `pop.xml` has a **`freak`** population, and art includes `ItemClownNose`, `ItemStilts`, `ItemRollerblades`, `ItemSneakers`, `ItemSpikedBall`, `Deco*` accessories → the circus is the destination for freak/deco-built horses.
- Sumo + circus + a race on one horse is the public guess for the hidden **Diety** achievement (unconfirmed).

## 2. Sumo Ring (`sumo` loc at 3680, 4128)
- Art: `KO`, `KO2`, `SumoBelt`, `ChampRing`, `ChampRingHi`, `ChampRingSign`, `StakesIcon1-3` → bouts end in a KO state, there is a **traveling champion ring + sign**, and bets are placed with stake chips.
- Achievements: **Sumo** (win a bout) and **Sumo Belt** (win the belt) — two tiers, so there is a belt tournament.
- Rules reported (`uncited-community`): short bouts; you lose by being pushed out, tipping over, or failing to control the ring before time runs out; **winners replace the champion**, and unseated champions "regain full energy upon recapture"; difficulty escalates as you progress.
- Build target (`single-source`, horseygame.com): **≥1,000 lb**, forward weight bias, low centre of gravity, short legs, wide stance, rapid pushing stride, "about one third of the screen without tipping". Gene levers named: `GIANT_DWARF` at max (in `genes.xml`, `GIANT_DWARF` n=GACT → G=100, A=66, **C=133**, T=100, so 'C' really is the size-max allele), `GUT`/`DERRIERE` (helix 1) for mass distribution, leg-length/angle genes (helix 3/8) and `MUSCLE_USE`/`LEG_STRENGTH`.
- Official patches: 1.3 "Sumo 10% less janky"; 1.1 "Sumo gong has more dynamic range and better vibration simulation" (there is a **gong**), `SumoBelt` art.
- Reward reported on video: a **rocket** item, and "a rocket cannot be cloned in the simulator (not biological) but can be glued onto a horse" (MoreCaseOh @ 15:15, @ 19:35).

## 3. Power Plant (`powerplant` loc at 5664, 3872)
- Purpose: supplies electricity to the CRISPR Lab (老番茄 @ 7:45 lab has no power, @ 12:13 "reactivated by placing a horse that can run on a wheel").
- Mechanism: horse-sized **running wheels**; put an animal that can run inside; keep it running until the output meter fills; low/fast animals outperform tall horses that tip out. Art: `Lift`, `ItemLift`, `PowLift`, `PowRambar`, `PowStopwatch`, `PowStripe`, `Dis*` counterparts, `ItemJetEngine`, plus a dedicated full-screen background `powerplant.jpg` (328 KB) → the plant is a distinct interior scene with its own backdrop, i.e. it is entered via `EnterLocation`, not scrolled to.
- Hazards/quirks from official notes: patch 1.25 "Putting a **wheeled horse** in the powerplant was not working correctly"; 1.1111 "**Bowties** dropped in world would cause a crash when the powerplant was operational"; v1.1 "Add high-res **volt meter** graphics to powerplant".
- Plutonium: the plant area is "surrounded by a field of buried plutonium leaking radiation" (`horseygamemap.org`, and corroborated by three `buried` objects in `horsey.tmx` with values 40/47/15 → an amount-per-zone, at (3168,4000), (4480,4480), (9280,3264)). `ItemPlutonium(2)` art; plutonium feeding speeds creatures and grows hoof-feet (HeTheLyon @ 7:11/7:15); patch 1.3 "Plutonium now counts as food", "Plutonium dropped in an empty vat will no longer freeze the game"; grazing irradiated grass is reported to create mutated outliers used to rescue a damaged gene pool (`uncited-community`).
- Late-game consequence: mutated escapees breed with wild herds, so by in-game year ~500+ much of the wild horse population becomes non-race-viable (`uncited-community`, r/HorseyGame).

## 4. Digging, holes & fossils
- Tool: **shovel** ($95 after v1.1; $150 reported pre-patch/pre-fix), **silver shovel** = unlimited with a 2-second cooldown restored in 1.3 (`TinyGoldenShovel` art exists; 1.108 "Shovel exhibits less infinitude"). Art: `AnimShovel`, `AnimShovelSilver`, `Hole`, `HoleG`, `PointerDig`.
- 1.3 added: **"You can grab items with the silver lasso and drop them in holes to bury them and fill up the hole"** and **"Caves can be destroyed with the shovel"** → holes are entities with a fill state, caves are destructible terrain tiles.
- Fossil chain: dig up a fossil/bone (`ItemBones`) → **achievement Fossil** → scan the bone → **treasure map** (`treasuremap.png`) → dig at the marked spot → **$5,000** (`verified`: 林永季). Alternative reported use: bones revive extinct species in the DNA Lab (`uncited-community`).
- Reported terrain manipulation (`horseygamemap.org`, hypothesis-grade): hay/hay bales spread grass over time (matches the separate `veg.xml` 5-state spreading layer in the data); digging removes grass/creates travel hazards; uneaten apples become apple trees (`Apple`→`AppleTree` exist in both atlases); water↔land conversion by fencing/digging; terrain can make movement permanently worse. The **truck+trailer** is what gets damaged by potholes, per patch 1.3's "fill your world with junk and potholes. That's your business."

## 5. Hot air balloon (`ItemBalloon`, `InvBalloon`, `Balloon`, `BalloonShadow`)
- Achievement **Balloon — "Acquire a hot air balloon"**. No written acquisition guide exists anywhere reachable.
- The only concrete lead: Cheru's softlock — he could not get the balloon "because there's no freaking carnivores in the entire world because they all ate each other" ⇒ the balloon's requirement involves **living carnivores** in the conservation area (tiger/alligator/crocodile populations), i.e. probably a carnivore-sourced item or a carnivore-feeding task. Confidence: `single-source`, cause inferred from a complaint, not from a documented rule.
- horseygamemap.org mentions "hot air balloons" as a late-game map-travel tool (filler, no detail).

## 6. Truck & trailer
- Location: `truck` object at **(3104, 3744)**, i.e. parked directly next to `home` (3040, 3712) and the paddock (3136, 3712). Achievement **Truck — "Drive a sweet truck"**; achievement **Strong — "Pull a truck"** (so a truck can be *pulled by* a horse, and something must be strong enough to pull it).
- Art: `Truck`, `TruckTires`, `TruckTires2`, `TruckRam`, `TruckStripe`, `ChevyStar` (a truck model name), `Trailer`, `TrailerB`, `TrailerB2`, `TrailerO` (open), `TrailerT`, `TrailerW`, `DriveDest`, `animal_car1/carsmart1.wav` (cars are *alive* — they have animal sounds and a `car` gene population).
- Trailer = mobile inventory/holding pen; regular lasso auto-yanks a captured horse **into your trailer**, silver lasso does not (you must drag it); patch 1.3002 "Horses will accidentally escape the trailer less often"; v1.1 "Unusual horses do a better job of locating the floor while in the trailer"; 1.1111 "You can no longer accidentally drop the thing in the thing".
- Beer-sleep exploit (`uncited-community`): 3 beers → horse falls asleep **on the trailer** → drive out and back → it wakes rested.
- Horn (`InvTrumpet`, art `Trumpet`) pushes horses away from the vehicle — used for herding and clearing blocked roads.

## 7. Conservation / Ecologist tent (`ecologist` loc at 5024, 5024)
See `horseygame-net-achievements-and-softlocks.md` — population 400, genetic division 50%, genetic diversity 43%, green/red/orange diet legend, sim-speed and zoom controls in the UI, carnivore-extinction softlock.

## 8. Other map locations with no written coverage
From the shipped `Locs` layer: `zoo` (3168,3872), `junk` (3296,3872), `hutch` (3488,4064), `circled` (3040,4512), `surebreed` (4224,4576 — Surebreed Steeples, had a test track removed in 1.59), `abandoned` (4224,4032 — Old Abandoned Track, "tested for several minutes" at ship time; official 1.3 "Abandoned track crash fix"; a community multiplayer mod races there), `club` (160,7072), `paradise` (8096,4896), `hermit` (11392,3616 — the hermit cave + treasure-map route per horseygame.net), `vial world` (576,800), `mabels` (3264,4800). No reachable source describes the club, hutch, circled, junk or vial-world interiors.

## Conflicts
1. **horseygamemap.org's quest content** is demonstrably invented (see the alert box) even though its coordinates are real. Everything else on that site is `uncited-community` at best.
2. **Sumo weight target (1,000 lb)** comes only from horseygame.com; nothing in official notes or data states a threshold, and the glue scale's 0–3000 lb range means 1,000 lb is plausible but unproven. Patch 1.1111 "Tweaked horse mass calculation" implies mass values shifted between versions.
3. **Circus event list** differs across sources: horseygame.com says diving board/car pull/trampoline/acrobatics; horseygame.net mentions a separate **"Freak Show"**; the blog mentions "stunts". Art supports `ItemBallAndChain`, `ItemStilts`, `ItemClownNose`, ribbons, `Plinth`.
4. **Balloon requirement** is inferred from a single complaint, and horseygamemap.org implies it is simply a placeable travel tool. Unresolved.
