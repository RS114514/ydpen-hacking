# horseygame.net — racing rules, records & horse lifecycle

**Sources (fetched 2026-10-26):**
- `https://horseygame.net/guides/racing-optimization-master-guide`
- `https://horseygame.net/guides/horsey-game-horse-lifecycle`
- `https://horseygame.net/guides/complete-beginners-walkthrough` (§3–§9, the "six income layers" audit of Joe Bartolozzi's 2h15m session)
**Confidence: `single-source`** per claim (each is pinned to one video timestamp); the lifecycle clock (1 day = 1 year, age-8 wall) is corroborated by two independent Chinese playthroughs → **`verified`**.

## Race structure & eligibility
- Two live tiers at the track: **Regular** ($25 entry → $500 + silver cup, 20× ROI) and **Champions** ($250 entry → $2,500 + golden basket, 10× ROI).
- **Champion qualification: the horse needs 2 prior cup wins** — 老番茄 @ 10:22 reads the tab ("only for horses that have won two championships") and Cheru @ 29:50 describes the same rule tentatively ("I think our horse needs to have won at least two cups prior"). Treat as reported-but-not-hard-confirmed.
- **Per-horse regular-win cap: 3.** After 3 regular wins the horse silently cannot be entered in regular races (entry behaves as if empty); championship remains available. Eligibility table: 0–1 wins → regular yes/champ no; 2 → both; 3 → regular no/champ yes; 4+ impossible. (r/HorseyGame via the troubleshooting page — community-confirmed, the game never explains it.)
- **Champion pool starvation:** if *you* win every regular race, NPC horses never reach 2 wins, so the Championship tab shows empty / "try again later". Fixes: fast-forward the saloon TV (advances the sim), bet on the most-winning NPC horse without entering your own, or enter deliberately losing horses.
- **Field size:** 4 (early), 5 (4 opponents + yours, most common), 6 (5 opponents + yours).
- **Track distance is posted in furlongs** (1 furlong ≈ 201 m): 8-furlong and 12-furlong races both observed in Joe's session; shipped art has `Furlong4/6/8/12/20/FurlongHalf` markers, `FinishPost`, `GrandStand`/`GrandStandOld` — so the port should draw distance markers every furlong with a half marker.
- **"Catch your stride" → "long strides" → "consistency"** is called out during races in commentary; whether the player inputs anything during a race is *explicitly unverified* by the site (arrow keys are only documented for camera panning at the track).
- Race counter increments across a session (Race 25 → 68 → 72, ≈30 races/hour) and appears on the racing screen.
- Horses must be **able to run** to enter: a horse that "flat-out refuses to run" is reported for first-generation descendants of converted farm owners ("strike" behaviour) — community/speedrun lore, unverified.
- **Bribing to race:** official 1.107 "Recalcitrant horses may be bribed to race with a beverage" → beer unlocks a reluctant runner.

## Verified race-time optimisation curve (HeTheLyon "Only Humans" run)
60s baseline (unmodified human) → 30s stated goal → **27s** (first sim) → 22 → 20 → 19 → pogo-leg win → 12 → 9 → 7.9 → **6.9s** after RAM upgrade → 5.2 → **5.0s floor**. Creator quote: "there's got to be like a soft cap … they can't go below 5."
- Only sub-5 claim ever recorded is speculative: "The hot sauce might have made them faster" (@ 22:21), no clean screenshot. → Model a **5.0 s soft floor**, treat hot sauce as an unknown bonus.
- Documented speed interventions: empty the vat between iterations (avoid "gene pollution"), feed plutonium (side effect: hoof feet), weird morphology can win (pogo front leg), **RAM upgrade to the horse simulator** drops times from ~7s into the 5s range.
- Distance/stat trade-off from commentary: "short legs is stable but slow" → 8 furlongs favour long-leg speed, 12 furlongs favour short-leg stability/stamina.
- Not verified (and explicitly refused by the site): pace sliders at 50/75/90/100/110%, +12% Feed Bonus/Warm-Up/Track Affinity stacks, rain −3% / heat +20% stamina drain / cold 1.5 s start delay, per-track stat thresholds (e.g. "Meadow Sprint Speed ≥ 85"), any allele-letter→trait table.

## Lifecycle / care rules
- **1 in-game day = 1 horse-year** (逍遥散人 @ 19:24) — the master clock. Rest/Sleep advances it.
- **Hay instantly ages a foal to 1 year** (逍遥散人 @ 23:15) — the fastest route from newborn to raceable.
- **Age 8 = forced retirement** (老番茄 @ 8:53 read on screen: "at age 8 they must retire") → a horse's racing window is effectively 7 days.
- **Daily activity cap: 1 activity per horse per day** — a horse that raced cannot mate that day and vice versa; newborns cannot race on their birth day (老番茄 @ 8:39).
- **Sleep is mandatory** between active days ("They all got to sleep again", MoreCaseOh @ 15:35); the **Sleep button is top-right of the yard view** and fast-forwards *every* horse through a rest cycle at once — a global action, not per horse.
- **Food is consumable** ("They need food", @ 11:00) and horses will eat items dropped in the world (patch 1.3002); **plutonium now counts as food** (patch 1.3).
- **Stable cap: 10 horses** — bwhatsonn @ 3:08 "it's only 10 horses". Roles are tracked by the game (breeding stock vs racing stock, "priority" slots; @ 2:29, @ 12:42). With 10 slots × 1 activity/day, the daily theoretical max is 10 race entries.
- **Retirement paths:** (1) pay **$100** at **远方田野 / Distant Field**; (2) sell to a neighbouring farm (no clear payout); (3) glue factory / slaughterhouse at 3¢/lb (≈$24). Retirement does **not** lock the genome — "DNA from a retired horse can be copied and modified" (老番茄 @ 13:45).
- **Death:** unverified whether horses can die before old age (illness/injury). Patch 1.3002: "Horses that become deceased in the world may drop their equipment", and `StatusDead` exists → death is a real state; `ItemCarcass`/`ItemMeat` imply a corpse becomes an item. The `WHITE_IS_LETHAL` gene is the likely cause of lethal colour combos (1.2 "many anomolies from odd gene combinations").
- **Glue factory:** conveyor + scale; worn gear items get returned to you (horseygamemap.org); patch 1.3: a horse touching conveyor and scale simultaneously used to crash; "If you shoot a horse you can get your stuff back".

## Conflicts
- **Age cutoff**: only one on-screen reading (age 8). The 1-year-per-day clock makes that a 7-day career, which sits awkwardly against 老番茄's own "day 5 → year 1" phrasing; both come from the same video, so no real conflict, but the "8" is a *forced retirement*, not death — no source documents the death age.
- **Sleep semantics:** horseygamemap.org says "rest advances the age of horses at home **and in the trailer**"; horseygame.net only claims the yard-wide Sleep button. Model both, flag as inferred.
- **Champion "two cups" wording** is ambiguous between "regular cup wins" and "championship wins"; the 3-win-cap evidence from r/HorseyGame implies the intended reading is 2 *regular* wins → eligible → 3rd win locks regulars. That reconstruction is the site's own inference, labelled as such.
