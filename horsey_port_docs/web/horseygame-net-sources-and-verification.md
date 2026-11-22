# horseygame.net — sourcing methodology, tiering & the external evidence base

**Source:** `https://horseygame.net/sources` and `https://horseygame.net/corrections` (cached `/tmp/hg/sources.txt`, `/tmp/hg/corrections.txt`), fetched 2026-10-26.
**Confidence: `verified`** as a description of *that site's* claims (it is self-reporting); the underlying videos themselves were not re-watched here.

Why this file exists: every other horseygame.net note in this folder inherits its citation style (author + video timestamp). If a number in those files matters to your port, this is the list to chase down.

## Claim tiers the site applies
`Video-verified` (seen on screen in a timestamped playthrough) · `Save-file verified` (confirmed against an exported save/genome) · `Community report` (player-reported, not re-verified) · `Speculative` (their own inference) · `Deprecated` (published, now known wrong). It states plainly that anonymous comments are never treated as equal to on-screen proof, and that unconfirmed mechanics are labelled rather than guessed.

## The 13 external sources it indexes
**YouTube (4)**
- HeTheLyon, *I Beat Horsey Game With Only Humans*, 26 min, 543k views — `youtube.com/watch?v=iSYZvzz--NQ`. Race-time curve 60s→5.0s floor, "soft cap at 5" quote, hot-sauce sub-5 speculation, CRISPR vat workflow, plutonium hoof-feet, pogo-leg winner, RAM simulator upgrade.
- Cheru, *I 100% Solved Horse Racing—Using CRISPR and a Broken Broken Moral Compass*, 49 min, 69k — `watch?v=CoiOVMPzUWM`. Shop prices ($5 hay, $50 lasso, $95 shovel, $150 bale, $25 entry, $0.03/lb glue, $50/scoop), Bubba's $2,000 quest, Sweetie $300 trophy sale, three achievement softlocks, $10K/$70K/$100K bet ladder, Strange Bedfellow spec, conservation-tent UI.
- MoreCaseOh, *We Created The Fastest Horse Of All Time…*, 36 min, 251k — `watch?v=I4f8FkUT8rc`. Sumo→rocket reward, rocket non-cloneable, glue-attach, food+sleep needed, multiple horses per tournament, cure $62,000.
- bwhatsonn, *Mixing THE BEST Horse Genes*, 23 min, 6.8k — `watch?v=A9dgl_TSBRA`. 10-horse stable cap, breeding-vs-racing roles, retirement, Ted Mosby champion + extra breed, lasso wild capture.
Additional playthroughs cited inside individual guides but not in the index: **Joe Bartolozzi** *I've Mastered The Art Of Horsey Game* (2h15m, the HUD/economy audit), **Drae** *This Horse Game Got Weird Fast* (`watch?v=7m-bTKeOqxY`), **xQc** *This Game is Addicting | HORSEY GAME* (`watch?v=KtJ3rl1BoUI`).

**Bilibili (4)**
- 老番茄 *这是什么马？？* 21 min, **7.34M views** — `BV1BM9fB8Eds`. $62,375 cure, $50 start, 1:5 default odds + 1:2 trophy bump, $5→$130 win+place, Champion $250→$2,500, 1-year-per-day, age-8 wall, Old Bu $2,000 rabbit-ear quest, nuclear-plant DNA-Lab unlock chain. The comment thread under it is the origin of the 6-step opening speedrun and the hidden-secrets list.
- 逍遥散人 *爆笑赛马 养马仙人成长之路* 103 min — `BV1CNduBKEfc`. VIP betting unlock + $25 min bet + 3:1/5:1 widened odds, hay age-trigger, shovel $150, lasso confirmation.
- 少年怀特Weiss (CaseOh translation, 132 min) — `BV1CYdWBVEwB`. Generation labels ("generation H"), odds display formats, Bubba details.
- 林永季 *人+熊+豹子+鳄鱼+兔子+鱼+狗+马=？* 5 min — `BV17ARbBjEjx`. Cave bones → treasure map → $5,000 on screen; centaur from human DNA.

**GitHub (3)** `steve02081504/horsey-crispr-database` (18-genome JSON, ~23 KB, source of the GCAT×20×2 structural claims); `hikazey/horseygamegm` (original genome mapper: breeding simulator, optimizer, save library); `antares-scion/…/equine-genome-mapper` (hosted derivative). See `github-gene-tables-and-genome-databases.md`.

**Reddit (1)** `r/HorseyGame` top-30 posts feed their /discoveries page; the late-game hidden-mechanic quotes come from comment threads (usernames listed but not permalinked: u/EfficiencyArtistic, u/NoSquash137, u/MajoraMajoris, u/jumbods64, u/Spawncer67, u/Ill_Wall9902, u/Manathemana, u/blingman_x, u/tytorthebarbarian, u/MoonlitPinkKitten).

**Steam (1)** app 3602570 — price **$9.99**, 26 achievements, screenshots.

## Their published corrections (all of them)
1. **2026-05** — removed a fake "20-slider DNA model"; the game really uses 20 helices × 2 alleles × variable-length GCAT strings (40 export lines).
2. **2026-05** — flagged weather modifiers and allele→trait mappings as unverified.
3. **2026-06-04** — dropped "Definitive" branding for "Verified".
4. **2026-06-04** — re-labelled build pages as concept archetypes, not real genomes ("the DNA strings on build pages are illustrative concepts, not values extracted from the game's actual export format").
5. **2026-06-04** — badged their CRISPR Mapper tool EXPERIMENTAL: "the real allele-to-trait mapping has not been confirmed from save-file data".
6. **2026-06-04** — removed homepage overclaims ("mapped every track to the helix loadout that wins it", a $1k→$100k economy path).
Earlier content also deleted: a 5-generation breeding plan with genotype strings (`H1=B H2=D…`), stallion prices ($2,400 Endurance Sire, $5,800 Hybrid Stallion), an "~8% gen-1 inexperience penalty for the first 6 days", an "H6=C 3% market rarity", stat lines (Speed 87/Stamina 89/Power 84/Looks 73), and a starter-horse ranking. **If your port's design doc contains any of those numbers, they came from a retracted guide.**

## Site-level caveats for using this source
- Their guides are stamped "**Last verified: 2026-05-09 · Game version: 1.0.4**" while the live build progressed to 1.3–1.59 before that date, and their page footers say "Updated 2026-10-24". Several mechanics they call "unverified" *were* later confirmed in official patch notes (e.g. abandoned track, hotkey G, silver-shovel cooldown, compass 1280 px). Prefer the official notes where they overlap.
- All dollar figures are one-timestamp-per-figure. Nothing is save-file-verified except the genome structure claims.
- They state plainly: **"We have not documented a controls reference."**
