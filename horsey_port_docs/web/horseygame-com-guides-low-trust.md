# horseygame.com — "Horsey Game Wiki" (fan site; low trust)

**Source:** `https://horseygame.com/` + `/guides/*` (getting-started, how-to-play-horsey-game, tips, racing, racing-optimization, money-making, breeding-basics, breeding-guide, gene-mechanics, crispr-tutorial, crispr-complete-guide, circus-challenges, sumo-wrestling, swamp-guide, fastest-horse, fastest-horses-showcase, caseoh-videos, faq, map, dna-database, gene-editor, crispr-mapper, mobile, is-free) — fetched 2026-10-26.
**Confidence: `uncited-community` overall** (no timestamps, no named testers, prose reads AI-generated), **except** its genetics pages, which are **`verified` against shipped data** — see `horseygame-net-and-community-crispr-breeding.md` §6 where 10 of its 12 gene recommendations match `genes.xml` exactly under a 1-based→0-based helix offset.

## What is worth keeping
- **Helix→gene recommendations with concrete base values** (OLD_AGE→A/T, BRAIN_SPASTIC→T/C, MUSCLE_USE→C/G, BREAK_FORCE→T/G, LEG_STRENGTH→C, TEETH_SHAPE→diet, NARCOLEPSY→A/T/C, HIGH_INTELLECT→disable, LOCO_SYNC→T, SPEED_FACTOR→T, SPINAL_LOCO→C/G, WHITE_IS_LETHAL→disable) — validated against data, use the corrected 0-based indices.
- **The in-game CRISPR computer's menu verbs**: `COPY` and `PASTE` on the lab computer, and the extractor dial mode **"DNA EXTRACT"** + side lever. Cross-checks the official 1.2 clipboard note.
- **Power-plant recipe**: "place a horse into the wheel (crocodiles work great)… the wheel will start turning and restore power to the lab."
- **The "Merge All" idea** (force strand 1 onto strand 2 to homogenise a genome) is their name for creating homozygosity; the community tools implement it, and official 1.5 mentions a vat bug with "a single homozygous genome", so homozygosity is real.
- **Biohacker NPC reputation**: "most players report poor results from this character, even after purchasing the RAM upgrade".
- **Sumo numbers**: ≥1,000 lb, "about one third of the screen", ring-out/tip-out/time-out loss conditions — plausible, unverified elsewhere.
- **A complete working race genome** ("Perfect Specimen Template", 40-line `NN:<GCAT>` export, all-homozygous except helix 06/15) plus a second one under `fastest-horses-showcase` (`00:CGATGGAATC 00:CCATCACCTC …`) — useful as test fixtures for a port's parser; format is correct (20 indices × 2 lines, per-helix lengths match the community corpus).

## What to ignore (contradicts hard evidence)
- **A four-stat model "Speed / Stamina / Strength / Agility" with icons** — the game has no such stat panel; performance emerges from the 240-gene build (see `genes.xml`). Same for "Start with beginner races — they have lower entry fees" (only two tiers are documented: $25 and $250).
- **"Use your lasso to capture horses (costs energy)"** — lassos cost **$50 each and are single-use**; no energy resource exists anywhere in the data or patch notes.
- **"Selling horses to other players"** and "unlock higher-tier competitions" — no player-to-player selling; there is no multiplayer.
- **The map page's facility list** (Base / Facility / Competition / Shop; "Market", "Breeding Center", "Race Track", "Sumo Arena", "Circus Tent" as generic icons) does not match the shipped `Locs` types (`home`, `track`, `paddock`, `supply`, `saloon`, `glue`, `crispr`, `biohackers`, `sumo`, `circus`, `zoo`, `junk`, `car lot`, `acres`, `hacienda`, `willaby`, `bobs`, `mabels`, `surebreed`, `hutch`, `ecologist`, `hermit`, `paradise`, `club`, `abandoned`, `powerplant`, `circled`, `vial world`, `truck`, plus herd spawners).
- **"Helix 18 genes for speed"** — with their own 1-based numbering that's helix 18 = index **17** (patterns); speed lives at index **18**. Their offset is right in the gene table above but sloppy in prose.
- **Swamp guide specifics** ("swamp = the Reeds biome", "hay bales don't work in the swamp", "drive east until you see it") — no source supports a named swamp biome; `Reeds` is a spreading-vegetation type in `veg.xml`, and alligator/moose spawner coordinates (7840,4000 / 3200,3040) are not co-located.
- **FAQ filler** ("excellent value", "multiple game modes", "join the community") — no facts.
- `/guides/caseoh-videos` is a list of stream timestamps with no extracted mechanics.

## Conflicts
- Site-wide it disagrees with horseygame.net on abstraction (stats vs genes), with horseygame.blog on naming ("Dive into a small pool" is an achievement; com calls the circus event a "diving challenge" — actually consistent, but com presents it as a minigame category rather than an achievement), and with itself on helix numbering.
- It is the only source claiming **`WHITE_IS_LETHAL` "C, G or A"** disables neonatal death; the data says A/C/T give 0 and **G gives 1** (enabled). Their guidance would kill the foal.
