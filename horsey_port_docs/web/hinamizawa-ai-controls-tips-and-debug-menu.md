# hinamizawa.ai — the actual controls reference, tips, cheats & debug menu

**Source:** `https://hinamizawa.ai/steam/horsey/beginner-guide/`, `/steam/horsey/tips/`, `/steam/horsey/cheats/` (plus `/steam/horsey/` hub: Sprite Sheets, DNA Database, World Map "all 45 locations").
Read 2026-10-26 through the local browser (direct curl/WebFetch get Cloudflare 403; `r.jina.ai` is network-blocked). Pages are dated **Published May 2 2026 / Updated May 16 2026**, self-labelled "Community-sourced", and cite: horseygame.com wiki, **Steam Community guides ("Horsey 101", "the CRISPR DNA & Genome Mapping Tool guide")**, **Speedrun.com forums "for keybinds and hidden mechanics"**, **ChapterCheats** for the achievement roster, **MobyGames + Glitchwave** for the release record.
**Confidence: `uncited-community` as published, but `verified` wherever it agrees with official patch notes or shipped data — which is most of it.** Its helix/gene table agrees with `horseygamegm` (executable-extracted) and with `genes.xml` allele values at ~19 of 20 checked points, so the page is clearly written against the real gene table, not generated.

## ★ THE KEYBIND TABLE (this is the missing reference)
**Normal save — no debug needed.** The page notes: *"The game tutorial only surfaces the lasso; everything else is on you to discover."*
| Key / input | Effect | Corroboration |
|---|---|---|
| **Mouse: click + hold on a creature/item** | grab & drag it (the drag state lives **on the cursor**, not in the room) | `b2MouseJoint` in the binary; `GrabHand` art; many patch notes |
| **Mouse: hover without clicking** | **pet** the horse | `PointerPet` art |
| **Left mouse hold + release (lasso equipped)** | aim and throw the loop | tposegaming snippet |
| **`E`** | **quick-close any popup; exit to the world map; from the racetrack it exits back to the paddock** | explains official 1.3001 "Removed the press E to nuke your safe file feature" (E is the global exit/close key) |
| **`Space`** | advance dialogue | matches `PointerText` and patch 1.3 "Text boxes are always on screen now" |
| **`F`** | **collect DNA from a target** | alternative to the "dial → DNA EXTRACT → lever" description |
| **`R`** | switch to the **gene drive** in the CRISPR lab | lab computer verb set |
| **`Ctrl + V`** | **paste the cure's genome** (once it is on the clipboard) | official 1.2 "cut and paste genomes to your real life clipboard" |
| **`G`** (cursor over a horse) | easter egg: "giddy up" / prance — **paddock, stables, CRISPR lab only** | official 1.26 + 1.3002, verbatim |
| **`← ↑ → ↓`** | pan the camera **at the race track** | official v1.107 |
| **`Esc`** | pause menu (music pauses there) | official 1.1111 |
| **mouse wheel / zoom out** | zoom exists | official 1.3 framerate note; *input unnamed by any source* |
| **Steam Deck** | on-screen keyboard for naming; no native gamepad scheme documented | official 1.5 |

**There is still no movement key, and now positively so:** every documented key is a UI/interaction verb (close, advance, collect, switch, paste, pause) and the one locomotion-ish claim in the community is *"Walk into an NPC house…"* → **walking means moving the cursor / camera, and travel between locations is done by truck or by the `E` quick-exit to the map.** The robbing trick proves the model: *"Click and hold the horse… press E while still holding… the pickup state survives the transition because it lives on the cursor, not the room. Drop the horse in your truck… release the click over the trailer slot."*

**Debug-mode keybinds** (only while the debug menu is enabled): `Ctrl+Shift+E` spawn a horse at the cursor's X (Y fixed by spawn rules); `R` re-spawn the last spawned horse; `Delete` delete the horse under the cursor; `T` enter **trailer render mode** (place horses directly into the trailer slot); `U` or `Esc` exit.

## Debug / developer menu
- Unlock: **`Esc` → type the word `debug`** (no input field; the game listens for the keystroke sequence in the background) → close and reopen the pause menu; the debug panel appears **to the right of the normal pause options**. Persists until the executable restarts.
- Options: **Money** +$1,000 per click · **Loaded** unlocks every gadget (lasso, shovel, shotgun, fence, hot air balloon…) and adds 20 of each · **Inventory editor** (cash, lasso, shovel, shotgun, fence quantities) · **Restart** · **Restart+** (keeps a small carry-over inventory) · **Junk Shop (debug)** and **The Secret Zoo** — two extra buildings that spawn next to *Clyde's* Rides on a **new** save started with debug on (the Junk Shop sells one of every item) · **Betting Mode** — **"DO NOT CLICK": it locks the save into an endless race that only exits by restarting the executable, with no payoff** ← the single worst documented softlock in the game.
- Achievements reportedly still fire with debug enabled; they advise a clean save anyway.
- Save location: **`save1.dat` and `save1.dat.prev` in the game's Steam local-data folder** (copy both to back up).
- This is consistent with the Fandom wiki's "Norse Horse / Güilty Pasture / Daïsy… appear in **Debug Mode** in certain versions" and with horseygame.blog's "the game does not need a cheat download" hedging.

## Hidden mechanics list (tips page §5, all reproducible)
- **Walkies:** release a tired horse and immediately re-capture → stamina resets, only one age cycle ticks. (Matches official 1.2 "Fixed the release & recapture cheat" — so this is a *reintroduced/soft* behaviour, patch-version-dependent.)
- **CRISPR power bypass:** spam-click the **light fixture** inside the lab while power is off; it eventually toggles power on. (So the lab has a literal light switch and the puzzle can be skipped.)
- **Sabotage:** feed rival horses consumables/DNA flasks before a race — **hot sauce speeds stride, beer slows it**, weird DNA can break a stride entirely; **no reputation penalty**, and you can do it at the rival barn.
- **Hot sauce also removes exhaustion** (matches r/HorseyGame's "hot sauce eliminates the sleep requirement"), and is scarcer than beer: barn sales, shovel digs, gift baskets, the hermit's cave.
- **Floppy disks bypass the flask flow** — a disk can go straight into the DNA vat.
- **Roads are suggestions** — the truck/trailer cross most terrain.
- **Move NPCs by parking a horse on their tile** (they walk off; remove it and they walk back). Matches official 1.1111's dragged-shopkeepers fix.
- **Lasso sleeping animals first** — they don't move, "the rope lands every time".
- **A `ZZZ` bubble = exhausted** and the horse is useless until it sleeps; **resting any one horse advances every horse you own by one age cycle**; age caps at 8.
- **A defeated sumo champion is released into the wild** — lasso it back and you keep its DNA.
- **Carnivore horses, if released, eat the wild population then starve** → quarantine or cull (this is the actual mechanism behind Cheru's carnivore-extinction balloon softlock).
- **Toss horses into the radiation pen near the power plant for forced mutations**; fence them in.
- **Caterpillars** spawn from random shovel digs anywhere; the spade can't catch one — swap to the lasso when the `+` capture icon appears. (Explains `pop.xml`'s `centipede` population.)
- **Lasso fish from any water tile** (not just the swamp) — the water-rope fishing rumour, now with a mechanic description.
- **Racing is physics-deterministic, not RNG** → "bet only on observed winners; watch three or four NPC races first."
- **The bar acts as a leaderboard.**
- **Save-crash failure mode:** aggressive edits can produce a "freak of physics" whose geometry the engine cannot simulate — the save crashes the moment it steps. Always keep backup flasks; the Bio Hacker NPC at the suburban house is the usual offender.

## Genetics content worth keeping (validated against `genes.xml`)
- **Heterozygous expression formula (community-stated):** `Final = (m% × high-priority base) + ((100−m)% × low-priority base)` — i.e. `m` from the gene table is the **mixing percentage between the two alleles**, and priority order comes from the `n` permutation; same alleles in different positions can give different phenotypes; base *order* within the pair doesn't matter (TG = GT). This is the single most useful mechanic statement for a port. (Consistent with `SIZE m=95`, `ASPECT m=95`, boolean genes `s=1 m=100`.)
- **Helix-position notation is 0-based** and matches the executable-extracted table exactly: `H0.4 GIANT_DWARF`, `H1.0 GUT`, `H1.2 DERRIERE`, `H1.9 LITTER_SIZE`, `H1.10 OLD_AGE`, `H2.12 BRAIN_SPASTIC`, `H3.0 SPLAY`, `H4.9 BREAK_FORCE`, `H5.7 WHITE_IS_LETHAL`, `H8.1 LEG_LENGTH`, `H8.2 LEG_STRETCH`, `H8.4 LEG_STRENGTH`, `H18.0 NARCOLEPSY`, `H18.1 SPEED_FACTOR`, `H18.4 SPINAL_LOCO`. Every stated value matches `genes.xml` through the `n` permutation (GIANT_DWARF C=133 ✔, GUT A=45 ✔, DERRIERE G=70 ✔, LITTER_SIZE G=5 ✔, OLD_AGE G=2 ✔, SPLAY G=45 ✔, LEG_LENGTH T=120 ✔, LEG_STRENGTH C=120 ✔, SPEED_FACTOR T=133 ✔, SPINAL_LOCO A=2 ✔, NARCOLEPSY G=1 the only non-zero ✔, WHITE_IS_LETHAL G=1 the only non-zero ✔, BRAIN_SPASTIC T/C=0 ✔). **Only mismatch: `BREAK_FORCE` — they print "A = 50"; the data says A = 54.**
- Racing essentials: **avoid `NARCOLEPSY G`** (random mid-race sleep), **never `WHITE_IS_LETHAL G` + white coat** (lethal foal), `LEG_PENCIL` makes a horse fragile, forward-set eyes "better start detection".
- Sumo targets: 1,000+ lb, short splayed legs, low forward head, **wedge then rear up to flip the opponent**; 60-second bout.
- **Easter-egg species switches** (reverse-engineered from the wiki): Fish needs `SKIN_HEAD=2 AND SKIN_HUE=1 AND SKIN_HUE2=3`; Crocodile needs 2 of 3 (`TEETH_SHAPE=3`, joint configs, green colour values); "intelligent monster" from `HAS_ANTLERS=1 + HAT_SIZE>50` grants intelligence even with `HIGH_INTELLECT=0`.
- **DNA carrier rule for the vat:** *"the DNA vending machine"* accepts organics only — apples, beer, hot sauce, meat dropped from shot animals — and rejects boots, balloons, glasses, trophies. Acceptance message: **"That's the stuff!"** (in-game UI text).
- Chamber capacity: **six horses** for blended extractions.

## Economy / progression claims unique to this site (treat as `uncited-community`)
- Income ladder table: glue ~$20–30/horse · paddock work small/variable · standard race $25 → $500 ($475 profit) · championship $250 → escalating · **sumo "wager-based, nothing to enter, generally higher than racing per match"** · conservation goals high · **circus Prize Tent = infinite tools + freak horses** · aggressive betting needs $10k+ net worth.
- Net-worth bands: $0–500 glue+paddock · $500–2,000 standard races · $2,000–10,000 championships/circus/conservation + start CRISPR · $10,000+ aggressive betting.
- **CRISPR lab unlock claim:** "behind tutorial races, **$50,000 in the bank**, a **$10,000 editing licence**, and a junker car dropped into the hamster wheel for power." — see Conflicts.
- **Hot air balloon unlock (the first concrete answer anywhere):** clear the Conservationist's twin goals — **Population 400 AND Genetic Diversity 50% simultaneously**; diversity is scored by species, so 400 near-identical horses read as low diversity (they show 34% as a failing example). Alternative: the debug **Loaded** command grants it free.
- **Four circus tents → Prize Tent (infinite tools)**; events named **High Dive, Car Pull, Trampoline, Acrobatics** with per-event body plans; Trampoline is the hardest.
- **The swamp is directly north of the starting town** (grass → reeds transition), contains sleeping alligators and moose herds, has **no radiation**, and **hay bales cannot expand its fixed boundary**.
- **Cowboy Boots** are bought at the general store; **Fossil** digs are "specific dig tiles, community spots near the power plant"; **Dive** is triggered by a **small pool near the suburban houses**; **Truck** achievement = "buy a non-starter truck from the dealership"; **Strong** = clear the circus **Car Pull** event; **Trampoline** achievement needs only participation.
- **Robbing NPC houses** (live as of 2026-05-10, video timestamp 7:28): pick up an indoor horse, `E` to exit, drop it in the truck. High-value targets: the Conservationist's tent (south-east), suburban houses in the central neighbourhood, farmsteads near the racetrack (pre-tuned `SPEED_FACTOR T`/`LEG_LENGTH T`), and **Bubber's house** (championship-tier collection pieces). Indoor horses **respawn on re-entry but stolen ones don't**. Trailer capacity still applies (full → the "put back" animation plays).

## Achievement roster per this site — **25, not 26**
They list 25 names (A Cure, Acrobat, Balloon, Beer, Bet, Breeding, Bubber, Champ, Cowboy Boots, CRISPR, Diety, Dive, Floppy Disk, Fossil, GMO, Grand, High Achiever, Lasso, Lost Horse, Race, Strong, Sumo, Trampoline, Truck, Win/Place/Show) — identical to horseygame.blog's 26 **minus** `Win/Place/Show`? No: identical minus nothing; their set is the blog's 26 with **"Bet" and the rest all present** — the difference is they say 25 total across ChapterCheats + the Steam stats page, i.e. one of the blog's names is likely a duplicate/misread. Flagged in Conflicts.

## Dev / release facts (first non-Steam confirmation)
Developer **Captain Games / Justin Smith**, socials **@manbearcar** (X) and `manbearcar.bsky.social`; music by **Marlon Wiebe** (alias *Hero Is Not Strong*, Vancouver) — the credit panel is visible inside the in-game **furniture sprite sheet**; released **2026-02-18** on Steam PC; genre tags per MobyGames/Glitchwave: open-world, sports management, business simulation, ecosystem simulator, breeding sim, side-scroller, procedural generation, pixel art, absurdist comedy. (Their footer's "property of Stand Software" contradicts their own body text and the Steam data — treat as a template error.)

## Conflicts
1. **CRISPR unlock cost** — $50,000 bank + $10,000 editing licence (hinamizawa) vs horseygame.net's "unlock cost not on camera, unknown" vs 老番茄's power-plant-only chain vs official 1.108's "no qualified geneticist to operate Crispr machine" crash. The $10k licence may be the same thing as the alien's **$3 certification license** mispriced; **unresolved — do not hard-code the $50k/$10k gate.**
2. **26 vs 25 achievements** — horseygame.net says 26 ("Steam concurs"), horseygame.blog lists 26 names, hinamizawa says 25 after checking ChapterCheats + Steam. One roster must be off by one; nobody has resolved which.
3. **"Bubber" vs "Bubba"** — hinamizawa and horseygamemap.org both say **Bubber**; horseygame.net's transcription of Cheru's audio says Bubba; horseygame.blog's achievement name is **Bubber**. Weight favours *Bubber*.
4. **Balloon requirement** — carnivores (Cheru's complaint) vs Conservationist population+diversity goals (hinamizawa). Reconcilable: diversity requires many species including carnivores, which is why Cheru's carnivore-free world blocked it. **Adopt population 400 + diversity 50% as the trigger.**
5. **DNA collection input** — `F` (hinamizawa) vs dial-to-"DNA EXTRACT"+lever (horseygame.com) vs "put it on one of them and then DNA extract?" (MoreCaseOh). Probably: hold/inspect the creature and press F at the machine.
6. **`R` is overloaded** — gene drive in the lab, re-spawn in debug mode.
7. hinamizawa claims **45 map locations**; the shipped `horsey.tmx` has **47** Locs objects (including herd spawners) and ~31 named place types. Neither matches the other exactly.
8. The blog's `Diety` "community clue" (circus+race+sumo on one horse) is called **undocumented** here — no source has it.
