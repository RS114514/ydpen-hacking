# Breeding, CRISPR Lab, HORSE-SIM 9000 & gene mechanics

**Sources (fetched 2026-10-26):**
- `https://horseygame.net/guides/horsey-game-crispr-dna-lab` (verified workflow, video-timestamped)
- `https://horseygame.net/guides/dna-actually-works` (structure model from the community genome dataset)
- `https://horseygame.net/guides/player-genome-dna-verification` (round-trip test of 3 player genomes)
- `https://horseygame.com/guides/crispr-complete-guide` + `/guides/crispr-tutorial` + `/guides/breeding-guide` + `/guides/gene-mechanics` (fan wiki; low trust overall, but its gene recommendations check out against shipped data — see §6)
- `https://horseygame.blog/floppy-disk-guide/`, `/breeding-guide/`, `/dna-codes/`
- Shipped `game/data/genes.xml` + `game/data/pop.xml` via `github.com/woahhcrackers/HorseyGameWeb`; gene↔helix table via `github.com/hikazey/horseygamegm`
- `https://hinamizawa.ai/steam/horsey/beginner-guide/` (snippet only), `https://www.bilibili.com/video/BV1BM9fB8Eds` (老番茄, via horseygame.net timestamps)

**Confidence:** structure + gene→helix assignments **`verified`** (game data + two independent tools agree); in-game UI sequence **`single-source`** (video timestamps, "may be the same room or two separate locations" per horseygame.net itself); per-machine step wording **`uncited-community`**.

---

## 1. The genetics buildings are three different things
| Place | `Locs` type / coords | What it does | Power/upgrade |
|---|---|---|---|
| **CRISPR Lab** | `crispr` (3872, 3872) — a second sprite `LocCrispr2` exists | DNA extraction, gene editing, gene drive, genome copy/paste computer | Needs electricity. 老番茄 @ 7:45 shows it unusable with no power; official 1.108/1.2 note crashes "if no qualified geneticist to operate Crispr machine" |
| **HORSE-SIM 9000** (the "horsey sim" / simulator computer) | inside the lab complex | Reads the DNA in the vat and outputs an *optimised* genome (to a floppy disk), i.e. a search over the sample | **RAM upgrade** (`ItemMemory` / `ItemRambar`, `CasRam` art) → faster/better output; HeTheLyon @ 19:56 "With the RAM, we can upgrade our horse simulator. It'll make even faster horses." Drops times ~7s → 5s range |
| **Biohacker / "Normal Suburban House"** | `biohackers` (3584, 3616) | NPC service that performs genetic modification for you; needs a **16g RAM memory chip** to upgrade | horseygame.com: "most players report poor results from this character, even after purchasing the RAM upgrade"; official 1.5 fixes a Biohacker crash "if the vat contained only a single homozygous genome" |
| **Power Plant** | `powerplant` (5664, 3872) | Generates the lab's electricity via a horse-sized running wheel; surrounded by buried plutonium (`buried` zones at (3168,4000)=40, (4480,4480)=47, (9280,3264)=15) | 老番茄 @ 12:13: "can be reactivated by placing a horse that can run on a wheel" |

horseygame.net explicitly refuses to assert whether "DNA Lab" and "CRISPR Lab" are one room or two — the shipped `Locs` layer has **one** `crispr` object (plus `LocCrispr2` art used for the alternate/dark exterior) and no separate `dnalab` type, so model **one CRISPR building with several machines inside** (extractor, vat, simulator computer, gene-drive device).

## 2. Machine-by-machine step sequences (as reported)

**Power up (prerequisite)**
1. Drive to the Power Plant. 2. Put an animal that can run inside on the wheel — low, fast, spinning-leg animals beat tall horses that tip out (`horseygamemap.org`: "use a low fast animal; avoid tall horses that tip out of the wheel"; horseygame.com: "crocodiles work great"). 3. Fill the output meter (four gauges exist as art: `PowLift`, `PowRambar`, `PowStopwatch`, `PowStripe` + `Dis*` display variants; patch v1.1 added "high-res volt meter graphics"). 4. Patch 1.25: "Putting a wheeled horse in the powerplant was not working correctly"; 1.1111: bowties dropped in the world crashed it. 5. Return to the CRISPR lab.

**Extract DNA** (horseygame.com sequence; verb confirmed on video by HeTheLyon @ 0:36 "Pull it out. Put it into a vial" and MoreCaseOh @ 14:56 "Put it on one of them and then DNA extract?")
1. Put the creature on the examination table/holder. 2. Turn the middle dial to **DNA EXTRACT**. 3. Pull the side lever. 4. DNA lands in a **vial/flask** item (`ItemVial`, `VialEmpty`, `VialBubble1-3`). 5. Optional: click the lab computer and choose **COPY** → genome goes to the *real* system clipboard (official 1.2 "You can cut and paste genomes to your real life clipboard with the Crispr lab computer").
Hazards from patch notes: a vial dropped outside in a pasture could be eaten by a horse (1.107 crash); plutonium dropped in an empty vat froze the game (1.3002); "Plutonium now counts as food" (1.3).

**Optimise / simulate (HORSE-SIM 9000)**
1. Drop vial(s) into the **vat** (`Meiosis` + `Meiosis2..11` art = the mixing animation). 2. Run the simulator → it emits an **optimal result on a floppy disk** (`ItemDiskette`; achievement "Floppy Disk — Save a horse to a floppy"; 老番茄 @ 15:13 "can simulate DNA combinations and output an optimal result on a floppy disk"). 3. **Clear the vat between iterations** — leftover vials dilute the output (HeTheLyon @ 6:08). 4. Simulator output is only as good as its sample: "Computer simulation only produces the best result within the sample; if added genes are incompatible, the result may be poor" (老番茄 @ 17:23).
Community ordering (horseygame.blog): **scanner → DNA flask → vat → simulator → CRISPR lab**, with the floppy produced at the vat/simulator stage; labels are version-sensitive.

**Inject / paste (gene drive)**
1. Put the target creature in the CRISPR device. 2. **PASTE** the genome on the computer, or insert the disk/vial. 3. Run the **gene drive** (基因驱动) to overwrite the target's helices. 4. Device reliability was poor pre-1.1111 ("Crispr device has been made more reliable at gene copying"); odd gene combinations produced anomalies fixed in 1.2; "Many gene tweaks to reduce glitch-outs" in 1.25.
horseygamemap.org warns: genetic edits **spread through breeding and released horses** — contaminating your breeding pool early is hard to undo.

## 3. Breeding (non-CRISPR)
- Location: the **breeding barn at My House** (fandom: "The house has paddock for horses, breeding building for breeding and test race track to test horses"); art `Barn`, `BarnHeart`, `BarnHeart2`, `BarnHi`, `BarnOpen`, `HintBarn`.
- Cost/time: "Breeding costs money and time" (horseygame.com, unquantified anywhere verified).
- **One mate per horse per day** — mating consumes the same daily activity budget as racing (老番茄 @ 8:39).
- The child gets **one allele from each parent per helix**; both alleles persist, so recessives can resurface generations later (horseygame.net, consistent with the two-allele data model).
- **A champion horse gets an extra breed** (bwhatsonn @ 12:23/12:25 — tentative "I think").
- `LITTER_SIZE` and `GUT_IS_UDDER` genes exist → litter size is genetic.
- **Community claim, unverified:** "Dragging a horse onto a farm owner makes the horse become the new farm owner" (老番茄 @ 18:58) — genome-conversion via drag, the basis of the speedrun's drug-and-drag exploit.
- Feeding: place a **hay bale in the paddock and horses auto-feed** (fandom My House description); hay also instantly ages a foal to 1 year (逍遥散人 @ 23:15).

## 4. Genome data model (this is the part to port exactly)
- **20 helices, indexed 00–19** in-game (`horseygamegm`: "labeled in-game 0–19").
- **2 alleles per helix** (two lines with the same index prefix). Homozygous = both alleles identical ("locked"); heterozygous leaks the other strand to ~half the offspring.
- **Alleles are GCAT strings of fixed length per helix index** (not per creature). Lengths observed across many community genomes: `00`=10, `01`=13, `02`=13, `03`=15, `04`=9, `05`=6, `06`=9, `07`=8, `08`=9, `09`=9, `10`=13, `11`=15, `12`=13, `13`=11, `14`=11, `15`=13, `16`=15, `17`=11, `18`=9, `19`=16 (sampled from the 32r/sohu presets; helix 10 shows both 11 and 13 in different posts — treat 10–11 as *likely* variable and re-derive from your own dump).
- ⇒ ~4^240 per strand; the site's earlier "1.1 trillion combinations" figure was wrong and was corrected.
- **You cannot change allele length**, only which letter sits at each position.
- **Positional gene model (from the executable):** 240 genes laid out at fixed (helix, position) slots; each slot's base picks one of 4 allele values. `hikazey/horseygamegm` publishes the full 20-row table; `SIZE` has **no** helix position (evaluates at its baseline 95) but is assumed to sit at helix 6 position 0. Row-by-row (0-based helix index, gene names in slot order):
  - **00** BONES, BONES2, OSTODERM, OSTO_SIZE, GIANT_DWARF, TAIL_BOTTOM, LEG_STRETCH2, ARM_STRETCH2, HEAD_THICK_SKULL, NECK_STIFF — *frame & mass*
  - **01** GUT, GUT_IS_UDDER, DERRIERE, LEG_IS_CIRCLE, FOOT_IS_CIRCLE, TONGUE, TONGUE_SEGS, BELLY_ALT, PAT_BELLY, LITTER_SIZE, OLD_AGE, OMNIVORE, LIMP
  - **02** MUSCLE_USE, TAIL_STIFF, LEG_FLEXIBILITY, LEG_FLEX_BIAS, TAIL_FLEXIBILITY, TAIL_SPEED, LEG_AND_ARM_LIMP, ARM_STRENGTH, ARM_FLEXIBILITY, ARM_FLEX_BIAS, NECK_FLEXIBILITY, NECK_FLEX_BIAS, BRAIN_SPASTIC
  - **03** SPLAY, LEG_IN, LEG_IN2, TAIL_ANGLE, TAIL_JOINT_TYPE, LEG_JOINT_TYPE, HAS_KNEE, KNEE_MIN, KNEE_MAX, ARM_JOINT_TYPE, HAS_ELBOW, ELBOW_RANGE, NECK_JOINT_TYPE, HEAD_JOINTED, STIFF_JOINTS
  - **04** LEG_TAG, LEG_HAS_FOOT, LEG_COUNT, LEG_THRUST_BACK, ARM_TAG, ARM_HAS_HAND, NECK_TAG, NECK_SLOUCH, NECK_ONTOP, BREAK_FORCE, EAR_X
  - **05** QUADRUPED, BIPED, UPARM_TAG, UPARM_Y, UPARM_GOOFY, ARM_FORWARD, UPARM_ANGLE, WHITE_IS_LETHAL
  - **06** ASPECT, SKINNY, CHEST_BIG, CHEST_SMALL, NECK_TYPE, NECK_LENGTH, NECK_GIRAFFE, NECK_THICKNESS, NECK_ANGLE, NECK_COCK
  - **07** TAIL_TAG, TAIL_EXISTS, TAIL_SIZE, TAIL_SHORT, TAIL_ASPECT, TAIL_SHAPE, TAIL_SEGMENTS, TAIL_WAG
  - **08** LEG_TYPE, LEG_LENGTH, LEG_STRETCH, LEG_SKEW, LEG_STRENGTH, LEG_PENCIL, ARM_TYPE, ARM_LENGTH, ARM_STRETCH, ARM_SKEW, ARM_NODE_SCALE
  - **09** HAS_FOOT, FOOT_SIZE, FOOT_CLOWN, FOOT_THICKNESS, FOOT_TOE, FOOT_BACKWARDS, HAS_HAND, HAND_WIDTH, HAND_LENGTH, HAND_FINGER, SKIN_HANDS
  - **10** HEAD_SIZE, HEAD_X_GROWTH, HEAD_Y_GROWTH, HEAD_ASPECT, HEAD_SQUARE, HEAD_HAS_BACK, HEAD_GIANT, HEAD_SHRUNK, HEAD_CHIMERA, EYEBOX_X, EYEBOX_Y, EYEBOX_SIZE, SKIN_HEAD
  - **11** EYE_STYLE, BUGEYE, EYE_SIZE, PUPIL_SIZE, HAS_PUPIL, BROW_SIZE, BROW_SLANT, EYE_HUE, EAR_STYLE, EAR_SHAPE, EAR_SIZE, EAR_ASPECT, EAR_SLANT, EAR_INTERIOR, EAR_FLOP
  - **12** TEETH_SHAPE, HAS_MOUTH, MOUTH_Y, MOUTH_SIZE, JAW, TEETH_UPPER, TEETH_UPPER2, NOSE_STYLE, NOSE_INNY, NOSE_Y, NOSE_SIZE, NOSE_INTERIOR, **FLU_IMMUNITY**
  - **13** HAS_ANTLERS, ANTLER_X/W/H, ANTLER_TAPER, ANTLER_POM, ANTLER_COLOR, POM_COLOR, POM_USECOLOR, HAT_POM, HAT_POM_IS_LID
  - **14** ANTLER_REC, ANTLER_REC2, ANTLER_FLIP, ANTLER_MOD, ANTLER_SCALEH/W, ANTLER_ANGLE, ANTLER_ANGLE2, ANTLER_ANGLE_RAND, ANTLER_T1, ANTLER_T2
  - **15** HAT_EXISTS, HAT_SIZE, HAT_RAKE, HAT_ASPECT, HAT_TAPER, HAT_CLONE, HAT_BACK_SCALE, HAT_FRONT_SCALE, HAT_BACK_ANGLE, HAT_FRONT_ANGLE, HAT_ANGLE_RAND, HAT_FLIP, HAT_T
  - **16** BASE_BROWN, BASE_BLACK, BASE_RED, BASE_GREEN, GREEN_KNOCKOUT, BASE_CREAM, ALT_BLUE, SPOT_YELLOW, SKIN_HUE, SKIN_HUE2, SWAP_BASE_SPOT, SWAP_ALT_SPOT, WHITE, NOSE_HUE, HOOF_COLOR — *coat colour*
  - **17** AGOUTI, FOOT_IS_HOOF, COON_EYE, EAR_COMP, TAIL_ALT, PAT_SPLIT, PAT_STRIPE, PAT_SPOT, PAT_PERLIN, PAT_PERLIN2, PAT_PERLIN_SIZE — *patterns*
  - **18** NARCOLEPSY, **SPEED_FACTOR**, NECK_SPEED, RAMPAGE, SPINAL_LOCO, **HIGH_INTELLECT**, L_LEG_SIGNAL, L_ARM_SIGNAL, L_TAIL_SIGNAL, L_NECK_SIGNAL, LOCO_SYNC — *behaviour & locomotion*
  - **19** L_*_FTOB_REACT/EVENT and L_*_BTOF_REACT/EVENT for leg/arm/tail/neck (16 slots) — *neural limb wiring*
- **Base→value rule** (`genes.xml`): each gene has `g0..g3` plus a 4-letter permutation `n`. Read the base at that helix position, find its index in `n`, take `g<index>`. `m` = magnitude/max, `s` = scale (many boolean-ish genes use `s=1`, `m=100`). Colours in-game: **A = yellow, T = red, C = blue, G = green** (mapper README).
- **Strand reading direction in the lab computer:** helices render as an **X**; read each strand **top → bottom**, position 0 at the top; left and right strands are alleles 1 and 2 and act independently.
- **Export/share format (community):** 40 lines, `NN:<GCAT string>` where `NN` is the 0-based helix index and the two lines per index are the two alleles. Example head from a widely shared preset:
```
00:AGAGGTCATA
00:AAGTGGCATA
01:TATTACAACATCA
01:TACTACAACATCA
02:CTGCGCTCCGCAA
…
19:CGAAATGCCTGTGCCC
19:CGATATGCCTGTGCCC
```
- **Species presets:** the community dataset catalogues 18 presets (horse, dog, cow, bug, goat, man, bear, tiger, giraffe, monster, car, rabbit, duck, sea, moose, croc, goblin, wheels); the shipped `pop.xml` has 30 named populations including car, hay, yeast, pepper, appletree, helix, jockey, centaur, human, dino, centipede, dachshund, fish, freak — so the real roster is larger than the tool's default database. Genome layout is species-agnostic (helix *k* has the same shape for a tiger and for a car), which is what makes cross-species splicing legal.

## 5. Verified splice results (video)
Centaur from human DNA (林永季 @ 1:28); car-leg horse whose legs rotate in place (老番茄 @ 17:05); duck-horse that still wins (@ 17:56); gene copying onto wild horses to clone winners (@ 18:23); pogo-stick front leg that wins races; plutonium-fed creatures grow hoof-feet and run faster; **a rocket cannot be cloned** ("A rocket isn't biological", MoreCaseOh @ 15:15) but **can be glued onto** a creature (@ 19:35); wheels *can* be inherited ("I guess wheels are hard-coded into their genetics", @ 17:04 — matches `LEG_IS_CIRCLE`/`FOOT_IS_CIRCLE` genes).

## 6. Cross-validation of horseygame.com's gene table against shipped data
horseygame.com uses **1-based** helix labels; the game data and `horseygamegm` use **0-based**. `N_com = index + 1`. Under that offset, every recommendation it makes matches the shipped `genes.xml` values:
| Gene | com's advice | shipped `n` / `g0..g3` | verdict |
|---|---|---|---|
| OLD_AGE (H2→idx 01) | "A or T prevents degradation" | n=TACG → T=0, A=0 (C=−1, G=+2) | ✔ |
| BRAIN_SPASTIC (H3→02) | "T or C" | n=TGAC → T=0, C=0 | ✔ |
| MUSCLE_USE (H3→02) | "C or G optimal" | n=CTAG → C=100, G=100 | ✔ |
| BREAK_FORCE (H5→04) | "T or G = infinite stamina" | n=GATC → T=0, G=0 (A=54, C=35) | ✔ |
| LEG_STRENGTH (H9→08) | "C is best" | n=GCTA → C=120 (max of 95/120/80/104) | ✔ |
| SPEED_FACTOR (H19→18) | "T best" | n=GCAT → T=133 (max) | ✔ |
| NARCOLEPSY (H19→18) | "A, T or C prevents sleeping" | n=TCGA → T=0, C=0, A=0 (G=1) | ✔ |
| HIGH_INTELLECT (H19→18) | "disable for obedient racers" | n=CTAG → C=0, A=0 (T=1, G=1) | ✔ |
| LOCO_SYNC (H19→18) | "T keeps limbs coordinated" | n=CTGA → T=1 (enabled) | ✔ |
| SPINAL_LOCO (H19→18) | "C or G safest" | n=CTGA → C=0, G=2 | ≈ ✔ (two "safe" modes) |
| TEETH_SHAPE (H13→12) | "controls diet" | n=TCGA → 0,1,2,3 = four diet states | ✔ structurally |
| WHITE_IS_LETHAL (H6→05) | "set to C, G or A to disable" | n=AGCT → A=0, C=0, **G=1**, T=0 | ✘ one value wrong (G enables lethality) |
Consequence: the com site's *genetics* pages are usable evidence (they were clearly written against a real gene table); its *gameplay/feature* pages (stats list "Speed/Stamina/Strength/Agility", "lasso costs energy", generic "Market/Breeding Center" locations) are still AI filler and should be ignored.

## Conflicts
1. **Helix→trait summaries.** The sohu/17173-style Chinese guides claim a 4-group model (H0 skeleton, H1 appearance/colour, H2 movement/behaviour, H3 physiology). Shipped data: colour is helix **16/17**, movement/behaviour is **18**, limb wiring **19**; H1 is gut/repro/litter/old-age/omnivore. The Chinese 4-helix model is a simplification written before the full table existed — do not port it.
2. **`SIZE` has no slot** (mapper: evaluates at baseline 95). Any port that reads `SIZE` from helix 6 position 0 is guessing.
3. **"DNA Lab" vs "CRISPR Lab"** naming: 老番茄's subtitles (via horseygame.net) treat the power-plant-unlocked room as "DNA Lab"; official notes only ever say "Crispr lab"/"Crispr machine". Use one building.
4. **Biohacker quality:** horseygame.com says the NPC gives garbage results even with RAM; horseygamemap.org treats the Normal Suburban House + RAM chip as *the* biohacking upgrade path. Both may be true (NPC is weak; the chip upgrades the simulator instead).
5. **Allele lengths for helices 10/11/13/16/19** differ between the two community genome dumps I compared (11 vs 13 bases etc.). Confirm against your own extraction before hard-coding a length table.
6. **Dominance.** "Recessive traits resurface later" is community inference; the data model shows both alleles are always *present* and each position acts independently, so "dominance" may really be per-gene expression order rather than a lookup table. horseygame.net lists a dominance table as an open question.
