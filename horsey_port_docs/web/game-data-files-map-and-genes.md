# Shipped game data (map, locations, sprites, genes, populations)

**Source:** public repository `https://github.com/woahhcrackers/HorseyGameWeb` (a web port that commits the game's `data/` and `save/` folders). Files read via the GitHub contents API on 2026-10-26:
`game/data/horsey.tmx.0` (190,285 B), `game/data/locs.xml.0`, `game/data/terrain.xml.0`, `game/data/veg.xml.0`, `game/data/sprites.xml.0` (294 sprites), `game/data/genes.xml.0` (20,487 B, 240 genes), `game/data/pop.xml.0` (139,073 B), `game/save/settings.xml.0`, `game/save/log.txt.0`.
**Fetch date:** 2026-10-26
**Confidence: `verified`** for structure/values as shipped (this *is* the game's own data, one build, version string `$1.59 Filly Cheese Steak` per `log.txt`). Caveat: the repo is a third-party mirror, so treat it as one build snapshot, not as official documentation. Do not redistribute the assets; facts below are extracted.

## World / map format (topic: overworld map)
- Map is a **Tiled TMX**: `version="1.1" tiledversion="2018.09.12"`, orthogonal, `renderorder="right-down"`, **width=400, height=225, tilewidth=32, tileheight=32**, `infinite="0"`.
- ⇒ World pixel size **12,800 × 7,200**. Home at (3040, 3712) sits at tile (95,116) — a bit left of centre.
- Two tilesets: `terrain.tsx` (firstgid 1) and `locs.tsx` (firstgid **97**).
- Layers: exactly one tile layer **`Tiles`** (CSV encoded) and one object group **`Locs`** (47 objects, `nextobjectid=76`).
- **Orientation proof:** patch 1.26 places the abandoned track "south-east of the Crispr lab"; lab = (3872,3872), abandoned = (4224,4032) → larger x = east, larger y = south. Standard screen coordinates, no flipping. This matches a `right-down` TMX layer.
- No minimap and no separate map *screen* in the data: there is no map tileset/layer, and the only navigation aids in `sprites.xml` are `Compass`, `DriveDest`, `MarkStart`, `MarkHerd`, `DownHere`, `FurlongHalf`. (Community sites claiming "press a key to open the map" are not supported by any shipped asset.)
- `island.png` (80 KB) and `treasuremap.png` exist as full-art images — the island silhouette is a baked PNG, plus a separate treasure-map image used by the fossil→map→dig chain.

## Terrain vocabulary (`terrain.xml`, 32×32 tiles)
`Plain`(4 variants) `GrassLand` `BogLand` `PalmLand` `CactusLand` `AcaciaLand` `NGrassLand` `Water` `Pond` `Bush` `Stump` `Birch` `Fir` `BridgeH` `BridgeV` `BadLand` `Mountain`(4) `Boulder`/`Un1` `AppleTree` `DeadTree` `Cave` `FenceIcon` `FenceIconNotNeeded` `Tumbleweed` `Pebbles` `Road`(8 rot) `Road8`(8) `DirtRoad`(8) `DirtRoad8`(8) `Goop`(2) `Glass` `GlassBG` `Gray`.
Spreading vegetation is a **separate layer atlas** (`veg.xml`): `Grass`, `Reeds`, `Acacia`, `Apple`, `Palm`, `Cactus`, `NGrass`, each 5-state — this is the "hay makes grass spread / apples become apple trees" mechanic that guides describe, and it is simulated independently of the base terrain tile.
`horseygame.blog`'s terraforming claims (grass spread, dig holes, caves destructible) line up with `Cave` being a *terrain tile* (patch 1.3: "Caves can be destroyed with the shovel") and `Hole`/`HoleG` being **sprites**, i.e. dug holes are runtime objects, not map tiles.

## Locations (`Locs` object layer — exact world coordinates)
Every named place is a 32×32 tile object in the `Locs` layer with a `type` string. These are the location IDs a port needs:

| type | x | y | tile gid | notes |
|---|---|---|---|---|
| `home` | 3040 | 3712 | 97 (LocStable) | player's yard/stable; compass target |
| `paddock` | 3136 | 3712 | 111 | race entry / own-horse racing |
| `track` | 3168 | 3712 | 110 | betting track (adjacent tiles) |
| `sweetie` | 3264 | 3680 | 125 | Sweetie's House (campaign/cure) |
| `supply` | 3072 | 3808 | 117 | The Store (lasso/hay/bale/shovel) |
| `saloon` | 3072 | 3552 | 123 | The Bar (beer, TV fast-forward, leaderboards) |
| `zoo` | 3168 | 3872 | 121 | |
| `junk` | 3296 | 3872 | 127 | |
| `car lot` | 3232 | 3872 | 115 | Clide's Rides |
| `glue` | 3488 | 3840 | 114 | Glue Factory ($/lb scale) |
| `biohackers` | 3584 | 3616 | 128 | Biohacker / Normal Suburban House route |
| `sumo` | 3680 | 4128 | 126 | Sumo Ring |
| `crispr` | 3872 | 3872 | 113 | CRISPR Lab (needs power) |
| `hacienda` | 3872 | 3424 | 103 | farm |
| `acres` | 3360 | 3488 | 122 | farm |
| `willaby` | 2528 | 3808 | 98 | farm |
| `bobs` | 3008 | 3968 | 100 | farm |
| `mabels` | 3264 | 4800 | 101 | Mabel's (stables manager; patch 1.1 "Mabel's eyebrow obsession") |
| `surebreed` | 4224 | 4576 | 102 | Surebreed Steeples (had a test track, removed in 1.59) |
| `hutch` | 3488 | 4064 | 119 | |
| `circus` | 2464 | 3520 | 120 | Circus tent |
| `powerplant` | 5664 | 3872 | 124 | abandoned nuclear plant, plutonium field |
| `abandoned` | 4224 | 4032 | 134 | Old Abandoned Track (SE of CRISPR, per 1.26) |
| `ecologist` | 5024 | 5024 | 118 | conservation tent |
| `hermit` | 11392 | 3616 | 112 | far east |
| `paradise` | 8096 | 4896 | 104 | horse paradise |
| `club` | 160 | 7072 | 133 | far south-west corner (VIP betting club?) |
| `vial world` | 576 | 800 | 153 | north-west, off-island/odd area |
| `circled` | 3040 | 4512 | 99 | "circled" marker area |
| `truck` | 3104 | 3744 | 145 | the player's truck, parked beside home |
| `fest horse` (×5) | 2112/4864-group | various | 146 | herd spawners, `count`/`radius` properties |
| `crazy horse` (×4) | 4256,3360 / 6464,2528 / 7744,5664 / 5664,3840 | | 146 | herd spawners |
| `tiger` (×2) | 2304,4992 & 1312,4256 | 147 | carnivore herds |
| `giraffe` | 7424 | 4032 | 148 | count 40, radius 10 |
| `alligator` | 7840 | 4000 | 149 | count 10, radius 3 |
| `moose` | 3200 | 3040 | 150 | count 14, radius 4 |
| `impala` | 9088 | 4032 | 146 | count 16, radius 5 |
| *(unnamed, `buried`)* | 3168,4000 · 4480,4480 · 9280,3264 | 154 | buried-plutonium/radioactivity zones (`buried` = 40, 47, 15) |

Herd objects carry `<property name="count">` and `name="radius"`, e.g. `fest horse` at (2112,4224) has count 50 radius 1 — **this is how wild populations are seeded**, and the one at (5664,3840) has count 0 with radius 7 (the powerplant's irradiated empty paddock).

Layout summary for the port: a compact **town cluster** around x≈2400–4300 / y≈3400–4900 (home, track, paddock, sweetie, store, saloon, zoo, junk, car lot, glue, biohackers, sumo, crispr, four farms, circus, mabels, surebreed, hutch, circled), then a **desert/industrial east band** (powerplant, crazy-horse herds, plutonium patches), an **east/wild half** (giraffe, alligator, impala, paradise, ecologist south-east, hermit at the far east edge), and two odd corners (**club** at the extreme south-west, **vial world** at the extreme north-west). Farm buildings are art-swapped from a set of 12 (`FarmHouse1`…`FarmHouse12`), plus `PaddockBarns`, `GrandStand`/`GrandStandOld` for tracks.

## Creature/persona roster (`pop.xml` — 30 named gene populations)
`default`, `scratch`, `fest horse`, `crazy horse`, `impala`, `alligator`, `giraffe`, `rabbit`, `duck`, `dino`, `centipede`, `tiger`, `moose`, `dachshund`, `bear`, `cow`, **`human`**, **`centaur`**, `test`, **`jockey`**, `leprechaun`, `pepper`, `car`, `appletree`, `yeast`, `hay`, `fish`, `helix`, `freak`.
Readings that matter for a port:
- Non-animal "species" are real populations with gene priors: **car**, **hay**, **yeast** (beer!), **appletree**, **pepper** (hot sauce), **helix** — so beer/hay/apple are organisms the CRISPR loop can extract from, exactly as the community describes ("DNA of a beer, apple and wild horse into the simulator").
- **`jockey`** and **`human`** exist as creature templates (the "SmartHuman"/biped cases).
- **`freak`**, **`crazy horse`**, **`fest horse`**, **`scratch`** are wild-herd templates — matching the herd spawners above.
- Each `<pop>` is a list of `<gene name p0..p3>` **weights**, i.e. the prior distribution over the 4 alleles per gene. This is the mechanism behind "recessive traits resurfacing later".

## Gene file (`genes.xml`)
- 240 `<gene>` entries. Schema per gene: `name`, `m`, `s`, `g0 g1 g2 g3` (the four allele values), `n` (a 4-letter permutation of `ATCG`).
- The permutation `n` is how a base selects an allele: position *k* of the helix allele is read as base `n[k]`, and the allele's index (0–3) selects `g0…g3`. `m` looks like the max/base magnitude and `s` a scale (e.g. `SIZE m=95 s=100 g=[100,50,35,75]`, `QUADRUPED m=100 s=1 g=[1,0,1,0]`).
- Named genes relevant to gameplay: `SIZE`, `ASPECT`, `SKINNY`, `BONES/BONES2`, `GIANT_DWARF` (mass/size → sumo), `MUSCLE_USE`, `QUADRUPED`, `BIPED`, `LEG_COUNT`, `LEG_LENGTH`, `LEG_STRETCH`, `LEG_STRENGTH`, `LEG_THRUST_BACK`, `LEG_IS_CIRCLE`, `FOOT_IS_CIRCLE`, `FOOT_IS_HOOF`, `HAS_HAND`, `SPEED_FACTOR`, `NECK_SPEED`, `SPINAL_LOCO`, `LOCO_SYNC`, `NARCOLEPSY`, `RAMPAGE`, **`HIGH_INTELLECT`** (the "smart" variants), **`FLU_IMMUNITY`** (Sweetie's cure path), `OMNIVORE`, `GUT`, `GUT_IS_UDDER`, `LITTER_SIZE`, `OLD_AGE` (the ageing cutoff!), `LIMP`, `WHITE_IS_LETHAL`, `BREAK_FORCE` (limb detach), `OSTODERM`/`OSTO_SIZE`, plus large cosmetic families (`TAIL_*`, `EAR_*`, `HAT_*`, `ANTLER_*`, `PAT_*`, `BASE_BROWN/BLACK/RED/GREEN`, `GREEN_KNOCKOUT`, `NOSE_HUE`, `HOOF_COLOR`, `SKIN_HUE`).

## Sprite/UI atlas vocabulary
See `00-CONTROLS-AND-UI.md` §3–§6 for the full pointer/tool/HUD reading. Additional UI-relevant art: `SleepMoon`, `AgeWord`, `Newspaper`, `RacerInfo`, `RaiseBet`, `StakesIcon1-3`, `WinningTicket`, `ChampRingSign`, `PaddockIcon`, `StakesIcon`, `PrizeBox`, `PrizePresent`, `Plinth`, `LostButton`, `ExitIcon`, `Pause`, `PCMenu(Text)`, `Tear1-4`, `Poof*`, `WowStar`, `GrandStand(Old)`, `FenceI/IV/PV`, `InvTab1-4`.
Item art (the full consumable/equipment set): `ItemHay`, `ItemBale`, `ItemApple`, `ItemCactus`, `ItemDung`, `ItemBeer`, `ItemHotsauce`, `ItemVial`, `ItemDiskette`, `ItemMemory`, `ItemRambar`, `ItemPlutonium(2)`, `ItemBones`, `ItemCarcass`, `ItemMeat`, `ItemFenceBox`, `ItemBalloon`, `ItemJetEngine`, `ItemLift`, `ItemBallAndChain`, `ItemStilts`, `ItemSneakers`, `ItemRollerblades`, `ItemCowboyBoots1-4`, `ItemGlasses`, `ItemSunglasses`, `ItemTopHat`, `ItemCrown`, `ItemCravat`, `ItemBowTie`, `ItemToque`, `ItemClownNose`, `ItemSpikedBall`, `ItemVase`, `ItemBriefcase`, `ItemChest`, `ItemChampTrophy`, `ItemTrophy`, `ItemRibbon1-4`, `ItemStripe`, plus gene-letter items `ItemA/B/C/G/T/TM`.

## Conflicts
- This build is **1.59** (per `log.txt`); guide sites describe 1.0.4 behaviour. The `Locs` set here includes `abandoned` (added in 1.26) but has **no explicit test-track object**, consistent with 1.59's "temporarily removed test track at Surebreed Steeples". A port following pre-1.26 guides will have the wrong location list.
- horseygame.com's map page lists a generic "Market / Breeding Center" set of facilities that does **not** correspond to any `Locs` type; horseygamemap.org's list *does* (same coordinates). Weight: data file + horseygamemap.org.
- horseygame.net guides mention a "DNA bottle in the top-left corner of the map": the north-west `vial world` loc (576,800) is the plausible object behind that report — unconfirmed.
