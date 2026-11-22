# Chinese portals & Bilibili coverage (ali213, sohu, 32r, 233leyuan + video corpus)

**Sources fetched 2026-10-26 with curl** (Chinese hosts are reachable from this network; Steam/Fandom/Reddit/Polygon are not):
- `https://3g.ali213.net/down/rseame.html` — 《小马游戏》(Horsey Game) 免安装绿色版 Build 22948587 page, dated 2026-05-08
- `https://www.sohu.com/a/1021586387_121699124` — 原创《Horsey Game基因编辑攻略》by 香菜酱, 2026-05-12
- `https://www.32r.com/soft/144472.html` — 赛马游戏(Horsey Game) 下载 Build 23259279, dated 2026-09-29, includes a long DNA-code appendix
- Bilibili videos indexed by search (not downloaded): 老番茄 `BV1BM9fB8Eds`, 逍遥散人 `BV1CNduBKEfc` (5P, 103 min), 少年怀特Weiss `BV1CYdWBVEwB` (CaseOh translation, 132 min), 林永季 `BV17ARbBjEjx`, 风笑试玩 `BV18BoJB7EFk`
- `https://www.233leyuan.com/post-detail/2076332357383544832` — 《小马模拟器》实况解说 pointer page (no mechanics)
**Confidence: `single-source`** for each numeric claim, `uncited-community` overall. These pages are aggregate/copy sites; their value is (a) the Chinese naming of locations/NPCs that Western guides only paraphrase, (b) complete `NN:<base>` genome dumps usable as parser fixtures, (c) confirmation of the machine chain.

## Gameplay description (ali213, 32r)
- Publisher/developer listed as **Captain Games**; English client; ~43–62 MB; Windows 10/11; the game is categorised 模拟经营 (simulation/management). Chinese storefront title: 《小马游戏》("little horse game"), also 赛马游戏 ("horse racing game") and 小马模拟器 ("pony simulator").
- 32r's summary: collect horses, enter races, **win rewards by betting**; breed horses and combine horse DNA with other creatures **or objects** to create new species; almost everything in the world can be hybridised — animals, plants and everyday items; free exploration, facility upgrades, entering the power plant and hidden scenes, and influencing world change through horse genes and environment.
- **ali213's CRISPR description is the most useful Chinese text:** "在 Power Plant 通电之后，玩家可以前往左侧的 CRISPR Lab，将动物（或骨头）放入左侧空箱，通过操作旋扭和摇杆生成基因溶液，然后将基因溶液注入到其他动物体内，实现基因融合" → after the Power Plant is powered, go to the **CRISPR Lab on the left**, put an **animal (or a bone)** into the **empty box on the left**, then operate **knobs and a joystick/lever** to generate a **gene solution**, and inject that solution into another animal to fuse genes.
- …"玩家还可以进入微观地图，用套马索抓走基因链，在车厢内进行编辑" → the player can **enter a microscopic map and lasso away gene chains, editing inside a carriage/van**. This is the Chinese community's description of the helix-editing screen as *its own zoomed-in location you enter* — consistent with the `PointerEnter` cursor art, `EnterLocation*` entity events, `Helix`/`Meiosis`/`LetterA/C/G/T` sprites, and the separate `powerplant.jpg` interior background.
- "DNA from a retired horse can be copied and modified" style retirement/DNA interplay is echoed by 32r's cloning steps: bring your horse to the CRISPR lab → extract its DNA → copy the target horse's genes → **click the CRISPR computer and choose "Paste (粘贴)"** → activate the **gene drive device (基因驱动装置)** → **warning: CRISPR cloning is not 100% accurate**, the result may differ slightly.

## sohu's gene-editing primer (the site's own 4-helix abstraction)
Claims: (1) DNA is A/T/C/G programming of every horse attribute; (2) DNA is divided into multiple **helices**, each responsible for a class of property (skeleton, appearance, behaviour, system functions); (3) editing a base changes that trait, and **because bases are complementary (A–T, C–G), editing one base auto-syncs its partner on the opposite strand** — which is exactly what the two-line-per-index export format looks like from the inside; (4) a coarse mapping: **Helix 0 = base skeleton & body size; Helix 1 = skin/hair/colour/pattern; Helix 2 = movement & behaviour; Helix 3 = physiological systems & special functions (granting abilities of other creatures or non-living things).**
**This 4-group model is wrong against the shipped data** (colour is helix index 16/17, behaviour/locomotion is 18, limb neural wiring 19, skeleton 0, and index 1 is gut/reproduction/litter/old-age/omnivore). Keep its *concept* (complementarity + per-class grouping), discard its *numbers*.

## Genome dumps published in Chinese (format evidence)
32r publishes complete 40-line "基本马型 DNA 样本" sets keyed by appearance ("square-spotted orange-and-white pony wearing glasses", "black-and-white pony"), and sohu publishes themed presets — "适合抢跑的马" (a horse suited to a fast start) and "规则内最强车" (the strongest car within the rules). Sample helix-0/1/2 lines:
```
00:CTATGGTTTC   00:ATATGGTATC      (10 + 10)
01:GACAACATACTCA 01:GACAGCATACTCA  (13 + 13)
02:CATACCTGAGGGG 02:CACCCGTTAGCGA  (13 + 13)
```
Observed per-index lengths across all dumps agree with horseygame.com's template: **0→10, 1→13, 2→13, 3→15, 4→9, 5→6, 6→9, 7→8, 8→9, 9→9, 10→11–13, 11→15, 12→13, 13→11, 14→11, 15→13, 16→15, 17→11, 18→9, 19→16**. Index 10 is the only length that varies between published genomes (11 in some, 13 in others) — verify against your own extraction.

## Video corpus (why the Chinese sources dominate every number)
老番茄's 21-minute video has **7.34M views** and is the single most-cited primary source for prices, odds, ageing and the nuclear-plant unlock; its comment thread is the origin of the speedrun and hidden-secrets lists. 逍遥散人's 103-minute run is the source of the VIP betting ladder, the hay age-trigger and the $150 shovel reading. 林永季's 5-minute clip is the on-screen proof of the bone→treasure-map→$5,000 chain and of centaur creation. 少年怀特Weiss's 132-minute CaseOh translation supplies generation labels ("generation H") and odds-display formats. None of these videos could be re-watched here (no transcript access), so all their content reaches me second-hand through horseygame.net's timestamps.

## Conflicts
- sohu's helix grouping vs `genes.xml`/`horseygamegm` — see above; Chinese primer is out of date.
- 逍遥散人's $150 shovel vs official "lowered to $95" (v1.1) — same conflict as everywhere else; Chinese video was likely recorded on the pre-1.1 build.
- ali213 describes the gene solution as being made in a **box + knobs + joystick**, while horseygame.com describes **dial → DNA EXTRACT → lever → beaker**. Both are descriptions of the same multi-part machine seen from different clips; no source is authoritative on the exact UI, and horseygame.net explicitly lists "the specific UI elements / button labels on the CRISPR Lab" as unverified.
- 32r/ali213 say CRISPR cloning "is not 100% accurate" — matches official 1.1111 ("Crispr device has been made more reliable at gene copying", i.e. previously unreliable) but no source quantifies the error rate.
