# Quests, NPCs, map secrets and the community opening route

**Sources (fetched 2026-10-26):**
- `https://horseygame.net/guides/horsey-game-quest-npcs`
- `https://horseygame.net/guides/hidden-secrets`
- `https://horseygame.net/guides/opening-speedrun`
- `https://horseygame.net/guides/late-game-troubleshooting`
**Confidence:** quest payouts **`single-source`** (one video timestamp each, several corroborated by a second creator); the drug-and-drag speedrun chain **`uncited-community`** (originates from an anonymous Bilibili comment and is flagged by the site itself as never reproduced); late-game hidden mechanics **`uncited-community`** (r/HorseyGame comments, no permalinks).

## NPC roster & quests
| NPC | Requirement | Reward | Source |
|---|---|---|---|
| **Sweetie** (the flu patient, `sweetie` loc at 3264,3680) | campaign goal | cure costs **$62,375**; she auto-sells unclaimed trophies for **$300** each | Cheru @ 1:12 / 15:35 |
| **Old Bu** (a farmer with useless horses) | horse with **rabbit ears** AND a **championship win** | **$2,000** | 老番茄 @ 7:58, 11:21 |
| **Bubba / Bubber** | descended from *Russian mafia* or *coronal mass ejection* (or a third, partially-audible lineage) AND **big ears** | **$2,000** | Cheru @ 28:00, 28:40 |
| **The Alien** ("alien guy") | sells a **certification license** | $3 cost; what it unlocks was not visible on screen | 老番茄 @ 8:14 |
| **"Lady" buyer** | pay for a horse specifically named **"Lady"** | **$2,000** | 逍遥散人 @ 38:21 |
| **Lost-horse owner** | return **Strange Bedfellow** (brown body, black everything else) | achievement | Cheru @ 46:00 |
| **Bankrupt-state job giver** | triggered when cash hits zero | **$50** immediate for pooping-scooping | 老番茄 @ 6:54 |
| **Trophy-buying NPC** | give trophies (identity unknown) | cash, amount unknown | Bilibili comment, via hidden-secrets |
| **Mabel** (`mabels` loc 3264,4800) | stables manager; patch v1.1: "Mabel's eyebrow obsession is more fleshed out" | — | official notes |
| **Clide** (`car lot` loc 3232,3872) | sells cars; patch 1.1111: "Esoteric changes to Clide's inventory" | cars $799 / $1,289 (Fandom-derived) | official notes + blog |
| **Zoologist / Biohacker** (`biohackers` 3584,3616; `zoo` 3168,3872) | geneticist required to run CRISPR (1.108 crash if none) ; RAM-chip service | — | official notes + horseygamemap.org |
| **Farm owners** (hacienda 3872,3424 · acres 3360,3488 · willaby 2528,3808 · bobs 3008,3968) | can be **drunk** → "If the farm owner is drunk, you cannot trade"; can be **converted** by dragging a horse onto them; shopkeepers can be dragged back to their post (official 1.1111) | horse refunds | 老番茄 @ 18:48, 18:58 |

## Map secrets (all `uncited-community` unless marked)
- **Cave with three bones** → scanning the first fossil bone yields a **treasure map**; digging at the marked spot pays **$5,000** (`verified` on screen: 林永季 @ 0:26/0:26). Cave is a *terrain tile* (`Cave` in `terrain.xml`) and per patch 1.3 **caves can be destroyed with the shovel** — so the chain is destructible by the player. Art: `treasuremap.png`, `ItemBones`.
- **Bones have a second use:** dug bones can be revived in the DNA Lab to bring back extinct species (single community report; the exact UI sequence is undocumented and NOT video-verified).
- **Rope in water = fishing** — drop a rope (lasso) into water and you catch fish. Reward undocumented. `fish` and `yeast`/`pepper` populations exist in `pop.xml`, and `animal_fish1/2/fishsmart.wav` ship, so fish are real creatures.
- **DNA bottle in the top-left corner of the map** — a free DNA sample; genome unknown. Most plausible object in the shipped map: the `vial world` loc at (576, 800).
- **Give trophies to named NPCs until one pays** — do not sell trophies to the generic shopkeeper.
- **Five farms, one ace horse each** (1 left, 3 along the bottom, 1 top-right) with the best natural genome — speedrun lore, unverified.
- **Weather-triggered events** — only *suspected*, no evidence.

## The community opening route ("$50 → a champion in one in-game day")
Origin: a player comment under 老番茄's Bilibili video (7.3M views); the DNA-Lab half is demonstrated on screen at 12:01–12:42. Steps as written:
1. **Settings → Reset once** on a fresh save; starting cash reportedly snaps $50 → $100 (site marks this "verification still pending").
2. **Buy 4 beers ($40) at the tavern upstairs, steal 2 more from the seated couple** → 6 beers, $60 left.
3. **Drug-and-drag each farm's ace horse:** give the owner 3 beers → they pass out → drag the unconscious owner home → drag the ace horse home → convert the owner into a horse via the DNA-Lab genome-swap → drug the converted horse with another beer, drag it back to its farm and **sell it back to the farm system** for a refund.
4. **Do not race gen-0 conversions or their gen-1 offspring** — they "go on strike" and refuse to run; mark them breeding-only.
5. **Power the abandoned nuclear plant** (drive to the far-right desert, put a wheel-capable horse on each running wheel) → unlocks the DNA Lab.
6. **Splice:** put each ace horse on the left rack → extract DNA to a drive/floppy → feed ≥3 saved genomes to the **Horse Simulator 9000** computer → take its optimal output → gene-drive it into the remaining aces → sleep → enter all 5 in races ("at least one will win").
Failure modes the route warns about: skipping the reset, spending all 6 beers on 2 farms, selling a converted horse to the *wrong* farm, racing gen-1 offspring, splicing with fewer than 3 saved genomes (no error, just mediocre output).
Patch-level rebuttals: official **1.2 "Fixed the release & recapture cheat"** and "You can't steal horses by flinging them off screen", **1.25/1.3 "Fixed the stealing of various objects / Thank you speedrunners aka beta testers"**, **1.3002 "Fixed the unlawful stealing of horses"** — i.e. the exploit surface this route depends on was deliberately closed in later builds. A port should implement the *closed* behaviour as default and keep the old exploits behind a flag if it wants to reproduce 1.0.4 play.

## Conflicts
- **Old Bu vs Bubba** are consistently described as two different $2,000 quests (rabbit ears + championship vs lineage + big ears), but horseygame.net admits the third lineage name is only partially audible; a port cannot reproduce Bubba's lineage list.
- **"Reset gives free $50"** is contradicted by official v1.1 "Added confirmation to game reset" — the confirmation dialog was added *because* players abused reset; whether the double-grant still works post-1.1 is untested.
- **"5 farms"** vs the shipped `Locs` layer, which has **4** farm-style types with `FarmHouse1…12` art (`hacienda`, `acres`, `willaby`, `bobs`) plus `mabels`, `surebreed`, `circled`, `hutch`. The count of "5 ace-horse farms" is community narration, not data.
- **"Steal 2 beers from the couple"** vs 1.3's object-stealing fixes — likely no longer possible.
