# Achievements (26) & known softlocks

**Sources (fetched 2026-10-26):**
- `https://horseygame.net/guides/horsey-game-26-achievements` (count + softlocks, all from Cheru's 49-minute 100% playthrough)
- `https://horseygame.blog/achievements-guide/` (contains the 26-name roster; the blog's other pages are filler, but its achievement table reads like a transcription of the Steam roster)
- `https://github.com/woahhcrackers/HorseyGameWeb` `game/data/sprites.xml` — independent corroboration: art exists for boots, diskette, balloon, beer, truck, sumo belt, ribbons, shovel, jet engine, etc.
- Steam store page (`store.steampowered.com/app/3602570`) lists 26 achievements per horseygame.net — **the page itself was unreachable from this machine**, so the count is second-hand.
**Confidence: `verified`** for the count of 26 (two independent sites + corroborating in-game art); **`single-source`** for the three softlocks (all from Cheru's one run); **`uncited-community`** for the name list (transcribed by a fan blog, names match what the shipped art implies).

## The 26 achievements
| # | Name | Reported condition |
|---|---|---|
| 1 | Lasso | Lasso a horse |
| 2 | Bet | Win a bet |
| 3 | Breeding | Mate two horses |
| 4 | Race | Win a race |
| 5 | GMO | Create a GMO horse |
| 6 | Champ | Win a championship race |
| 7 | Truck | Drive a sweet truck |
| 8 | Fossil | Dig up a fossil |
| 9 | Cowboy Boots | Put on cowboy boots |
| 10 | Grand | Win $1,000 on a bet |
| 11 | Sumo | Win a sumo bout |
| 12 | Floppy Disk | Save a horse to a floppy |
| 13 | Beer | Buy a pal a beer |
| 14 | A Cure | Cure Sweetie's flu |
| 15 | Bubber | Breed a winner for Bubber |
| 16 | Strong | Pull a truck |
| 17 | CRISPR | CRISPR a gene |
| 18 | Dive | Dive into a small pool |
| 19 | Trampoline | Perform on the trampoline |
| 20 | Acrobat | Do some acrobatics |
| 21 | Sumo Belt | Win the sumo belt |
| 22 | Balloon | Acquire a hot air balloon |
| 23 | Win/Place/Show | Win that bet format |
| 24 | High Achiever | Own a horse named *High Achiever* |
| 25 | Lost Horse | Return a lost horse |
| 26 | Diety | Hidden condition; public clues vary (sic — the odd spelling is presumably in-game) |

Notes on reliability: "Bubber" here vs "Bubba" in horseygame.net's quest pages vs `bobs`/`willaby` in the shipped `Locs` layer — the NPC's real name is unresolved; three spellings exist across sources. Official patch 1.25 says "Two achievements that weren't working are [fixed]", so at least two achievements were broken at launch and their triggers are documented only by the patch, not by any guide.

## Three documented softlocks (Cheru's post-run debrief)
1. **"Place Bet" / bet-type achievement.** "If you earn too much money early in the game … it never appears." Threshold unknown. Mitigation (unconfirmed): don't inflate your bankroll before the place-bet prompt exists; otherwise a fresh save.
2. **"Lost Horse" (quest name *Strange Bedfellow*).** Quest text read on screen: **"Strange Bedfellow. Brown body, black everything else."** The target horse can despawn for reasons Cheru couldn't reproduce → achievement lost. Mitigation: return it the moment you spot it (brown body, all-black mane/tail/legs/face).
3. **"Balloon" (hot air balloon).** "…because there's no freaking carnivores in the entire world because they all ate each other." Carnivores eat each other once herbivore prey runs out; once the last carnivore dies the balloon achievement stayed locked for the rest of that save. Mitigation: watch the conservation tent's red-dot count and intervene (add herbivores / relocate carnivores). Bone-revival in the DNA Lab is a *community-reported* countermeasure, not verified.

Related late-game trap (not an achievement): **empty Championship tab** — dominating regular races starves the NPC champion pool. Fix by fast-forwarding the saloon TV, betting on NPC winners, or entering losing horses.
Another reported bug-trap: **championship trophies "devolved into sneakers"** after many championship wins — the community reads this as the game running out of "grand prize" entries (`ItemSneakers` art exists, and `PrizeBox`/`PrizePresent` are generic). No fix known; some players avoid repeating Championships on one save.

## Conservation tent readouts (Cheru, the only UI footage available)
- Population **400**, "genetic division" **50%**, separate "genetic diversity" **43%** (the two readouts are different stats — possibly inter- vs intra-species spread).
- Diet colour legend read aloud: **"Green is herbivores. Red is carnivores. Orange is omnivores."**
- Shipped art corroborates the panel: `EcoBar`, `EcoFaster`, `EcoSlower`, `EcoZoomIn`, `EcoZoomOut` (+ "2" hot/active variants) → the tent UI has a population bar, a **simulation-speed control** and a **zoom control**.
- `ecologist` location at (5024, 5024) in the shipped `Locs` layer; `LocEcologist` sprite.

## What is still missing
The per-achievement Steam IDs/icons/description strings, unlock percentages, and the true condition for **Diety** (public guesses: finish a circus event + a race + a sumo bout on the same horse) and for **High Achiever** (own a horse literally named "High Achiever" — a name-field trap). No reachable source lists all 26 descriptions verbatim.
