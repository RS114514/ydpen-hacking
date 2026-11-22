# GitHub tool ecosystem (genome tables, save/export formats, map editor, web port, mods)

**Sources fetched 2026-10-26** via `api.github.com` (raw.githubusercontent.com is blocked from this network; the contents API + base64 works):
- `https://github.com/hikazey/horseygamegm` ★7 — README, `horsey-game-gene-function-reference.pdf` (127 KB), `horsey-game-genome-mapper.html` (46 KB)
- `https://github.com/steve02081504/horsey-crispr-database` ★7 — README + `data/default-database.json` (24,913 B, 18 genomes)
- `https://github.com/ZyonixGaming/genome` — "Horsey Game Genome Lookup Table", single-file HTML ("Value for every pair of bases")
- `https://github.com/alexjthomson/horsey-crispr`, `alexjthomson/horsey-save-editor`, `eldritch-hue/hhgm-EGM`, `Hinamizawa-Forks/crispr`, `skyecraft92/horsey-race-planner`
- `https://github.com/ghosticus-dev/unofficial-horsey-map-editor` ★2 — README + `tile_defs.json` (3,625 B)
- `https://github.com/woahhcrackers/HorseyGameWeb` ★3 — the web port whose shipped data I mined in `game-data-files-map-and-genes.md`
- `https://github.com/MaxminMods/HorseyGameCaseOhMod` (uncapped SIM9000 mod tool), `MaxminMods/HorseyMultiplayer` (race friends on the Old Abandoned Track), `NickPetrone/HorseyLiveTweaks` (ImGui DLL injector), `abix-/modforge` (Rust framework with a `horsey-mod` target)
**Confidence:** `verified` for file contents read directly from those repos (they are the primary artefacts); `uncited-community` for the *claims* the tools make about the game, since most are self-described as models rather than extractions.

## 1. `hikazey/horseygamegm` — the gene↔helix table (best available)
README states the model plainly: **each horse has 20 double-stranded helices; every position in every helix maps to exactly one gene, and the base (A/T/C/G) at that position selects one of four allele values, whose magnitudes are the `g0..g3` in the gene table.** 240 genes across helices labelled **in-game 0–19**. Gene↔position assignment was **"extracted directly from the game executable"** (README credits the RE pass to an AI assistant, data collection to "Hikaze" via in-game sequencing). Extras:
- Base→in-game colour: **A yellow, T red, C blue, G green**.
- **How to read a helix on the lab computer:** it renders as an **X**; read strands **top→bottom**, position 0 at the top; left strand and right strand at the same position control the same gene independently.
- **`SIZE` has no helix position in the executable** — it appears to evaluate at its baseline 95; the README guesses helix 6 position 0 as a convention only.
- The repo ships a `horsey-game-gene-function-reference.pdf` (same table as prose; no PDF text extractor available on this machine, so I read the JSON-in-HTML version instead). The full 20-row layout is transcribed in `horseygame-net-and-community-crispr-breeding.md` §4.
- A companion **Steam Guide** is linked (`steamcommunity.com/sharedfiles/filedetails/?id=3677395605`) — unreachable from this network, so its text is unharvested. If you can open it in a browser, it is the most likely place a *written* controls/gene reference exists.
- Self-declared limitation: "This is an unofficial fan tool."

## 2. `steve02081504/horsey-crispr-database` — the 18-genome corpus that defines the export format
`data/default-database.json` (24,913 B) holds 18 known-good genomes: **horse, dog, cow, bug, goat, man, bear, tiger, giraffe, monster, car, rabbit, duck, sea, moose, croc, goblin, wheels**. This dataset is what horseygame.net used to derive the structural claims (20 helices × 2 alleles × variable-length GCAT, fixed length per helix index). Cross-species layout is identical helix-for-helix, which is why splicing works. The shipped `pop.xml` has 30 named populations, so the corpus is a subset (it lacks centaur, jockey, leprechaun, dino, centipede, dachshund, fish, yeast, hay, pepper, appletree, helix, freak, scratch, fest/crazy horse, impala, paradise-type herds).

**The community share format** (confirmed identical across this DB, 32r.com's Chinese DNA list, sohu's codes, and horseygame.com's templates):
```
NN:<base string>     ← allele 1, helix NN (00–19)
NN:<base string>     ← allele 2, same helix NN
```
40 lines total, zero-padded two-digit index, only the letters A/C/G/T, per-index string length fixed. The `antares-scion` "Equine Genome Mapper" and `eldritch-hue/hhgm-EGM` are repackages of `horseygamegm`; `ZyonixGaming/genome` is an independent lookup table ("Value for every pair of bases"); `Hinamizawa-Forks/crispr` is hinamizawa.ai's gene editor.

## 3. `ghosticus-dev/unofficial-horsey-map-editor` — confirms the map pipeline
README (alpha 0.2.1): the editor "load[s] and save[s] **Horsey TMX maps**", paints terrain from `tile_defs.json`, and inspects/places **"Locs" objects while preserving game-critical TMX object GIDs**; "the game depends on TMX object GIDs. If object GIDs change, the game may fail to load"; **"New maps require a new game/save file. Horsey bakes map data into save data."** First launch asks for the folder containing `Horsey.exe`, and it backs up the official map before export.
⇒ Direct porting guidance: keep the `Locs` layer's gid numbers stable, expect map data to be snapshotted into the save, and treat the `.tmx` as the live terrain source.
Its `tile_defs.json` names the tile IDs the game uses (1–4 Sand variants, 5 Grass, 6 Tundra, 7 PalmTree, 8 Cactus, 9 Water, 10 Pond, 11 Bush, 12 Stump, 13 OrangeTree, 14/15 BlueRoadH/V, 16 RedDirt, 17–20 Mountain1-4, 21 TallTree, 22 Rock, 23/24 Blank, 25 Tree, 26 AppleTree, 27 DeadTree, 28 Cave, 29/30 FenceH/V, …). Note this numbering **differs** from `terrain.xml`'s sprite names/order (`GrassLand`, `BogLand`, `BadLand`, `AcaciaLand`, `Birch`, `Fir`, `Tumbleweed`, `Pebbles`, `Goop`, `Glass`, `Gray`), i.e. the editor's tile defs come from a Tiled `.tsx` with its own ordering — re-derive the authoritative id→sprite table from `horsey.tmx` + `terrain.tsx` before porting terrain ids.

## 4. `woahhcrackers/HorseyGameWeb`
An Emscripten/web port (`horseygame.js`, `horseygame.wasm`, `horseygame_gfx.js/.wasm`, `image.bin`, `gfx_worker.js`) whose repository also commits the game's `data/`, `sound/` and `save/` folders. Its `manifest.json` is a file→byte-size index used to reassemble the directory. Useful extracts (all in `game-data-files-map-and-genes.md`): 12,800×7,200 px world, `settings.xml` schema (no keybindings), `log.txt` init sequence with **screen size 960×540**, the 294-sprite UI atlas, `genes.xml` (240 genes with `n` permutations), `pop.xml` (30 populations), plus the sound set (`animal_car1`, `animal_carsmart1`, `animal_carnivore1-3`, `animal_chomp1-2`, `animal_dogsmart`, `animal_drunk1-2`, `animal_ducksmart`, `animal_fallimpact`, `animal_fish1-2`, `animal_fishsmart`, `animal_giraffe1`, `animal_glug1-2`, `animal_herbavorelarge1-2`, …). The `…smart…` variants are the audible proof that `HIGH_INTELLECT` creatures get a distinct AI voice set, and `glug` is the beer-drinking sound.

## 5. Modding surface (relevant because ports get asked about it)
`MaxminMods/HorseyGameCaseOhMod` — "Safe branch **uncapped Sim9000** mod tool" (batch launchers `00_START_HERE_CaseOh90000.bat`, `01_LAUNCH_PANEL…`, `02_PLAY_CASEOH_HORSEY.bat`): the public mod scene's main target is removing the HORSE-SIM 9000's caps. `MaxminMods/HorseyMultiplayer` adds racing on the **Old Abandoned Track**. `NickPetrone/HorseyLiveTweaks` injects a DLL exposing an ImGui window over the running game. `abix-/modforge` lists Horsey Game among its DLL-injection targets. `horseygame.blog` reports a Steam discussion project for a **timer and race settings**, plus a Nexus Mods listing, and that **there is no Workshop integration**.

## Conflicts
- `horseygamegm` (executable-extracted, 0-based helix labels) vs `horseygame.com` (1-based labels) vs `sohu` (a 4-group abstraction) — reconciled in the CRISPR file; the executable-extracted table is the authority.
- "240 genes" vs the mapper's 243 entries (SIZE plus two unplaced/variant entries) and `genes.xml`'s 240 `<gene>` elements — the count that matches the shipped file is **240**.
- `horsey-crispr-database`'s 18 presets vs `pop.xml`'s 30 populations — the DB is incomplete, not wrong.
- Map-editor tile ids vs `terrain.xml` names (see §3) — unresolved, needs a direct `.tsx` read.
