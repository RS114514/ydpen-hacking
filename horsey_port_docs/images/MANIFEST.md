# Horsey Game — Reference Image Manifest

Game: **Horsey Game** (Steam AppID **3602570**, released Feb 2026 — flat pixel-art horse ragdoll / breeding sim).
Folder: `/Volumes/500GB/Ydpen/horsey_port_docs/images/`
Collected: 2026-10-29. **29 usable images** (all verified as real images, >15 KB, correct game).

## Source-access notes (what worked / what was blocked)
- **Steam store HTML page** (`store.steampowered.com/app/3602570/`) and **steamcommunity.com** screenshots: **TLS-blocked** from this machine (curl exit 35 / HTTP 000). Matches the prior-agent note.
- **`r.jina.ai` reader**: returned empty (unusable here).
- **`fandom.com` wiki, `reddit.com/r/HorseyGame`, `giantbomb.com`, `tposegaming.com`**: blocked (exit 35) or 403 bot-wall.
- **`store.steampowered.com/api/appdetails`**: intermittently succeeds (retry until 200). This is where the **18 official store screenshots + header** came from.
- **Steam CDN `shared.akamai.steamstatic.com/store_item_assets/...`**: **reachable and serves the real files** (the older `cdn.cloudflare.../steam/apps/...` path 404s — assets moved to the `store_item_assets` + hash-subdir layout).
- **Chinese portals**: `931158.com` serves an anti-bot 403 challenge (can't crawl the page), but its `/d/file/...` CDN images download fine directly. `hdslb.com` (bilibili) covers download with `Referer: https://www.bilibili.com/`.
- Two candidates were **rejected**: `baike-horse-01.jpg` (a different, realistic 3D show-jumping mobile game) and `17173-horsey-01.jpg` (exact duplicate of official racing shot `steam-official-04`).

## HUD / interface cheat-sheet (recurring layout, seen across most shots)
- **Money counter**: bright-green `$NNNN` in a white box, **fixed top-left**. A small grey delta (`+500`, `-25`) appears beside it on change.
- **`MAP` button**: red-bordered box with a red pickup-truck icon, **fixed top-right** (on overworld/location screens). A teal **hamburger menu** replaces it on some screens.
- **Tool / inventory slots**: **vertical stack on the far-left edge** (treat/bone, lasso, shovel, gun…), each an orange/white tile with a blue **count** badge (e.g. lasso `×6`, shovel `×1`).
- **Build palette**: horizontal green bar **bottom-left** with placeable icons (person / shovel / object / horse) + `×1` multiplier (see `steam-official-18`, `bili-remilia-01`).
- **Name labels**: white tooltip with a grey **magnifier icon** and the horse's name in orange/pink (e.g. `Daïsy`, `Fettuccine Alfredo`, `Wishlist On Steam`).
- **Dialogue boxes**: white panel, **light-blue border**, bold orange text; a green **▼** arrow marks "advance".
- **Fonts**: chunky pixel/monospace display face for titles & names; all-caps serif-ish pixel for horse names on the track.

---

## 1. HUD / interface

| File | Source URL | Size | What it shows |
|---|---|---|---|
| `steam-official-14.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/f03e4e1f55984e911bcaf4f5f0f86b0c76f2031b/ss_f03e4e1f55984e911bcaf4f5f0f86b0c76f2031b.1920x1080.jpg?t=1777070557 | 1920×1080 | **Horse inspect / pedigree card panel**: name "Hay Fever", stat icons, `Age 3/8 · Races 5 · Ht 16.7 · Wt 884`, Parents (Minty Fresh, Zeke), Offspring (Murder She Wrote), DNA helix with count `16`, green `Close` button, horse on blue graph-paper grid. |
| `steam-official-16.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/f8380aaa77bf40ca09ec256777c0085c5b15aa97/ss_f8380aaa77bf40ca09ec256777c0085c5b15aa97.1920x1080.jpg?t=1777070557 | 1920×1080 | **Zoologist research screen**: framed **"De Horsey Island" pixel world map** with coloured dots, `TOOLS $50` shop panel (guns, fence ×50), `Research Goals` checkbox board (pop. 400 / gen div. 50%), blue `CHART` population/gene-div bar graph, `Zoologist` name tag + dialogue. |
| `steam-official-11.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/7ca2a5053fab3d85005b959c447fb893bd00c12b/ss_7ca2a5053fab3d85005b959c447fb893bd00c12b.1920x1080.jpg?t=1777070557 | 1920×1080 | **CRISPR DNA-editing minigame** (top-down): purple wavy field, chromosome double-helices built from A/C/G/T blocks labelled 1/4/5/8/9/12, a `Cas9` enzyme blob dragging a lasso, water tiles; left tool slots (treat, lasso ×6, gun ×4), `$237` money. |
| `steam-official-10.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/781f87312c1bd5db7af4b5a5c7a687f5c42a46d1/ss_781f87312c1bd5db7af4b5a5c7a687f5c42a46d1.1920x1080.jpg?t=1777070557 | 1920×1080 | **Stable / paddock + `Sleep ☾` button** top-centre; `Wishlist On Steam` magnifier tooltip; house + barn structures, horses (one in top-hat & tie), water trough, thought-bubble numbers, `$2902` money, `MAP` button. |
| `steam-official-17.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/f95e9fcfc96e72fc9e01e5ed339ef90d759ef46a/ss_f95e9fcfc96e72fc9e01e5ed339ef90d759ef46a.1920x1080.jpg?t=1777070557 | 1920×1080 | **Sumo ring scoreboard HUD**: `K.O.` banner, `Bout 1-0 · Prize $100 · 0:54` timer, `NORSE HORSE VS MELBA TOAST` matchup line, two horses in a yellow dohyo ring, audience stands, gong; `$78` money. |
| `bili-remilia-01.jpg` | http://i2.hdslb.com/bfs/archive/b9d0ebb1bf17ab5f7c239602eb53536ab601ca83.jpg | 1920×1080 | Full **desktop capture** of the running game (window title `Horsey Game`): `$50` money, fence/tool slot top-left, **build palette bottom-left** (person/shovel/object/horse `×1`), teal hamburger menu top-right. World rendered as a big pixel-art image. ⚠ contains the player's OS taskbar (not pure game frame). |

## 2. Top-down overworld / island map

| File | Source URL | Size | What it shows |
|---|---|---|---|
| `steam-official-03.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/2e17b7d63a22aa4f3268bfa32ee599a95c6b6cab/ss_2e17b7d63a22aa4f3268bfa32ee599a95c6b6cab.1920x1080.jpg?t=1777070557 | 1920×1080 | **Top-down overworld** at normal zoom: green grass field with grass-tuft tiles meeting a yellow sand biome, grazing horses, red car towing a teal trailer, a **lasso mid-throw**, a fenced stable on the right; left tool slots, `$1280` money, hamburger menu. |
| `steam-official-18.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/fc0185dda32bf1aa71363afbec10293d47c2ba17/ss_fc0185dda32bf1aa71363afbec10293d47c2ba17.1920x1080.jpg?t=1777070557 | 1920×1080 | **Zoomed-out world map** (island terrain): large grass/sand/water regions, fences, trees, rocks, many tiny horses, small **minimap top-right**, **build-palette bar bottom-left**. Shows the tile-art world layout and camera pull-back. |

## 3. Interiors / locations

| File | Source URL | Size | What it shows |
|---|---|---|---|
| `steam-official-01.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/19492ce504fbb861582decda2cf41366f894823c/ss_19492ce504fbb861582decda2cf41366f894823c.1920x1080.jpg?t=1777070557 | 1920×1080 | **CIRCUS frontage**: row of coloured tents/stalls — Diving, Strong Horse, Trampoline, Acrobat, locked stalls (padlocks), `???`, `FREAKS $10`; ringmaster NPC, `Daïsy` name tooltip, blue dialogue box, horse trailer; `$450` money, `MAP` button. |
| `steam-official-05.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/421c90760e63c99122f0df9571caad8026da824a/ss_421c90760e63c99122f0df9571caad8026da824a.1920x1080.jpg?t=1777070557 | 1920×1080 | **SALOON interior**: "Saloon" title, `Beer $10` sign, orange wall, NPCs drinking (`*Glug*` dialogue), a wall TV showing a race replay, horse in trailer; `$3525` money, `MAP` button. |
| `steam-official-07.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/53aa96e4295e807d8f35f149ada62bdfd903238e/ss_53aa96e4295e807d8f35f149ada62bdfd903238e.1920x1080.jpg?t=1777070557 | 1920×1080 | **HORSE-MART shop interior**: "Horse-Mart" title, shopkeeper (`Shopkeep`) with "Being a cowboy is easy" dialogue, green price board `Hay $5 / Lasso $50 / Shovel $100 / Hay Bale $150`, shelves of tools, long-neck green horse in trailer; `$625` money. |
| `steam-official-08.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/597ae8af02e5ece15cf7d564fe2a7d45d35b2f64/ss_597ae8af02e5ece15cf7d564fe2a7d45d35b2f64.1920x1080.jpg?t=1777070557 | 1920×1080 | **C.R.I.S.P.R. LAB interior**: grey `C.R.I.S.P.R. LAB` sign, `DNA EXTRACT` machine with helix readouts, flask, `CRISPR` computer, a horse on the extraction table (glass box + chip), scientist NPC "Commencing EXTRACTION!", floating A/C/G/T blocks; `$12` money. |
| `steam-official-09.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/674a45df9968bfac4ebea549915eead9da48c986/ss_674a45df9968bfac4ebea549915eead9da48c986.1920x1080.jpg?t=1777070557 | 1920×1080 | **Circus tent / talent-show stage**: dark purple interior with spotlights, packed audience stands, `APPLAUSE` banner, `$5/$10/$20/$50` bills flying, a horse pulling an orange tractor-cart on the ring floor; `$950 +500` money. |
| `steam-official-12.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/c0b253d3611b5d7b88a796858fe1b7cb504401bd/ss_c0b253d3611b5d7b88a796858fe1b7cb504401bd.1920x1080.jpg?t=1777070557 | 1920×1080 | **Stable / paddock**: green fenced pen with 3 horses, `Fettuccine Alfredo` magnifier name label, barn/house top-left, NPC "These horses are useless!!" dialogue (with ▼ advance arrow), trailer with striped + pinto horses, `25` price tag; `$700` money. |
| `bili-stealhorse-01.jpg` | http://i1.hdslb.com/bfs/archive/21848dfabfd74550606caa43073748a2918f27ea.jpg | 1920×1080 | **Breeding barn ("Studs")**: blue `Studs $25` sign, orange barn with two horse stalls + heart on roof, fenced paddock, antlered NPC, trailer loaded with horses showing stat numbers (34/38/41/42) + apple/flower items; `$190` money, `MAP` button. |

## 4. Horses (procedural gene variety)

| File | Source URL | Size | What it shows |
|---|---|---|---|
| `steam-official-15.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/f7f8f0cf8fe118e7c1e0b3841435cab23d60881f/ss_f7f8f0cf8fe118e7c1e0b3841435cab23d60881f.1920x1080.jpg?t=1777070557 | 1920×1080 | **Paddock full of varied horses** (brown, black, pinto, pink-striped, tan) + "Lost Horse! Reward $500 / answers to *Sprinkles On Top*" quest poster, NPC "I lost my horse" dialogue, trailer with pinto/gray/**green** horses; `$2902` money. |
| `bili-jellyfish-01.jpg` | http://i2.hdslb.com/bfs/archive/db4ac9dd6b870d36912d5ac0e5cfb185ecd2f1c9.jpg | 1920×1080 | **CRISPR result / DNA-strand horse**: a horse body rendered as a chain of A/C/G/T nucleotide blocks on the race track, names "...Ontario / Of India / Shock", grandstand top-right. Shows the gene-editing visual + a very long-necked/legged specimen. |

## 5. Racing / betting / results

| File | Source URL | Size | What it shows |
|---|---|---|---|
| `steam-official-02.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/205fa0300c4c75b15240d4e1c9cf8435a4ff8dbb/ss_205fa0300c4c75b15240d4e1c9cf8435a4ff8dbb.1920x1080.jpg?t=1777070557 | 1920×1080 | **Pre-race betting / paddock screen**: `Race 8`, `8 FURLONG` sign, 5 horses in lanes with names + saddle-cloth numbers, `Win`/`Place`/`Show` buttons, purple **`VIP Betting`** window with NPC "This will be an exciting race!", `Your Bet $25` teal box, `♦$♦` button, `Paddock` sign, `odds 40-1 prize $1025`, green `Race!` button; `$1209` money. |
| `steam-official-04.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/2e4ba3a1f037f0d7972ac815a48bc47d80beb81e/ss_2e4ba3a1f037f0d7972ac815a48bc47d80beb81e.1920x1080.jpg?t=1777070557 | 1920×1080 | **Race in progress + finish/result**: side-scroll lanes, horses (Where's The Beef, In Heaven, Slam Duncle, Poke Mongo, Potted Plant), finish-line pole, `1st` + `Win` markers, green `$WINNER$` banners, `odds 4-1 prize $125`; `$680 Race 6`. |
| `steam-official-06.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/503da0ff49b5f6c8168ee01ce7ff48cb53e824e7/ss_503da0ff49b5f6c8168ee01ce7ff48cb53e824e7.1920x1080.jpg?t=1777070557 | 1920×1080 | **Race + photo-finish/result** (Race 5, `4 FURLONG`): horses Astrobl-Damus/Clover/Flanks Of Titanium/Lasagna crossing the white finish line, `1st` + `Win`, `odds 4-1 prize $50`; `$705`. |
| `steam-official-13.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/c1f446520647b0aa47e5ffda82279c3f60da2b81/ss_c1f446520647b0aa47e5ffda82279c3f60da2b81.1920x1080.jpg?t=1777070557 | 1920×1080 | **Race-entry / track gate**: `Entry Fee $25`, `Champions Fee $250` board, `Prize $500` (goblet) and `Prize $2500` (basket) cards, `Track` sign, grandstand, NPC "Now go to the track to watch Cubic Zircon race"; `$425 -25`. |
| `steam-page-bg.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/a97ae90c9ffa39eecbd67e72a56ec5ff9c693c6d/page_bg_raw.jpg?t=1777070557 | 1438×810 | **Clean race-finish frame** (store background, no HUD): 4 numbered horses crossing the white finish line on the green track — good for studying the track/lanes art without UI. |
| `bili-cover-01.jpg` | http://i1.hdslb.com/bfs/archive/492f037d9a66817d9ac1080520ac59056bae8c42.jpg | 1920×1080 | **Race screen** (Race 13, `8 FURLONG`): horses Lusitania/Larper/Liang Zi/Pluck, finish pole, `Win`, `Prize $500` card, `$393` money. ⚠ video cover — thin Chinese caption text along the top edge. |
| `bili-cover-02.jpg` | http://i1.hdslb.com/bfs/archive/6972277af03e8ef81b12568f14005c97f5b823dd.jpg | 1920×1080 | **Starting-gate moment**: 5 horses stacked at the white start line on the green track, grandstand behind. ⚠ video cover (no HUD visible). |
| `bili-freakshow-01.jpg` | http://i1.hdslb.com/bfs/archive/9a01640bdca833b1ca6774f8a48e73858f9120e4.jpg | 1280×720 | **Paddock / race-entry with stat tiles**: `8 FURLONG` sign, `Race!` button, `Horse` magnifier name label, trailer showing per-horse stat badges (23/28/19/30/29/16) + trophy/shoe icons, `MAP` button. ⚠ lower-res video cover. |
| `bili-playtest-01.jpg` | http://i1.hdslb.com/bfs/archive/b0a0f73a9d63c217228e832ba9e120254ba591b8.jpg | 1920×1080 | Race-finish background (same scene as official-04) with a cartoon horse-head + trophy and a **large Chinese title overlay** "不正常的养马模拟器". ⚠ creator thumbnail — heavy watermark/overlay text. |

## Key art / logo

| File | Source URL | Size | What it shows |
|---|---|---|---|
| `steam-header.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3602570/945b3e12201603882fedbbf7abcb5fc3f3ad3fcb/header.jpg?t=1777070557 | 460×215 | Official store **header banner**: "Horsey Game" carved-wood sign surrounded by pixel horses, a lasso and a DNA helix (green field / blue sky). |
| `steam-movie-poster.jpg` | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/257274083/90665d3803fd886e736dc554ed89585098cb85d3/movie_600x337.jpg?t=1769544111 | 600×337 | Trailer poster: "Horsey Game" logo over a race frame (horses 1 & 3, grandstand). |
| `931158-crispr-01.png` | http://www.931158.com/d/file/p/2026/05-13/06252129fafe0539582ec7fe7d916010.png | 589×328 | Title-screen logo art (wooden "Horsey Game" sign, 4 pixel horses) — pulled from a Chinese CRISPR/gene-editing walkthrough header. |

---

## Coverage vs. the 5 priorities — and remaining gaps
- **(1) HUD / interface — STRONG.** Money counter, `MAP`/hamburger buttons, left tool slots, build palette, name tooltips, dialogue boxes, horse pedigree card, sumo scoreboard, research panels all captured.
- **(2) Overworld / island map — GOOD.** Two true top-down views (`steam-official-03` normal zoom, `steam-official-18` zoomed world) plus the framed **"De Horsey Island"** map (`steam-official-16`). Locations are marked by coloured dots on the island map and by walk-up building frontages (circus, saloon, mart, lab, barn) rather than icons on the field.
- **(3) Interiors — PARTIAL.** Captured: circus frontage + circus show, saloon, Horse-Mart shop, CRISPR lab, stable/paddock, breeding barn, sumo ring, race entry/betting. **STILL EMPTY: race-track grandstand interior, power plant, glue factory, car lot, and the "HORSE-SIM 9000" machine.** None of these appear in the 18 official screenshots and could not be reached via blocked wiki/reddit/guide sites or noisy image search (which returned only unrelated games).
- **(4) Horses at varied genes — GOOD.** Pinto, black, brown, tan, green, pink-striped, long-neck/long-leg, top-hat-and-tie, DNA-strand forms seen across shots 08/11/12/15/17/18 + bili-jellyfish. **Weakest sub-items: antlers and multi-leg (>4) monsters** — only a hint (antlered NPCs) but no clean dedicated horse specimen.
- **(5) Racing + photo-finish/result — STRONG.** Betting/paddock (02), mid-race + finish (04/06), entry fees (13), starting gate (bili-02), plus stat-tile paddock (bili-freakshow). A true "photo-finish" close-up panel wasn't found; the finish/result is shown as the white line + `1st`/`Win`/`$WINNER$` banners.
