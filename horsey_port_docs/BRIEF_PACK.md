# Horsey Game 移植资料包（合并版）

生成时间 2026-10-26。以下各节按原文件顺序拼接，原文件位于 `/Volumes/500GB/Ydpen/horsey_port_docs/`。



---

# ▶ README.md

# Horsey Game 移植资料包

本目录是**移植前的证据汇总**，不属于代码仓库。三路来源交叉验证：
本地二进制/数据文件逆向、B 站实况逐帧观察、网络图文教程。

## 目录

| 路径 | 内容 | 是否入 git |
|---|---|---|
| `VISUAL_REFERENCE.md` | **实况观察转述**：HUD 布局、顶视大地图、拖车、马匹检视卡、赛马下注面板、CRISPR 实验室、HORSE-SIM 9000、马戏六棚、Horse-Mart 价目、胶水厂秤、马厩 Sleep 按钮、酒馆；末尾附「与当前移植的 13 条差距清单」按严重度排序 | 否（描述性，可入） |
| `reverse/RE_FINDINGS_UI.md` | **逆向侧结论**：检视卡字段顺序、徽章集合、下注面板标签、存档布局、基因显隐公式验证、躯干构造公式，以及 6 条尚未攻下的逆向目标 | 可入 |
| `reverse/fn_140056420_horse_card.c` | Ghidra 反编译输出（标签驻留函数），供复核解码 | 可入 |
| `images/` | 29 张已验证参考图，含 **18 张官方 Steam 1920×1080 商店截图**（最权威的色彩与 UI 位置来源）+ B 站封面帧；`MANIFEST.md` 逐张标注来源与内容 | **禁止入 git** |
| `frames/` | 49 张**联络表**（5 段实况，场景切换表 + 均匀网格表），每格 480px；每个子目录有 `MAP.md` 说明如何把格子换算回视频时间 | **禁止入 git** |
| `keyframes/` | 58 张全分辨率关键帧（受限于未登录，源为 360p），按 `kf_<分秒>s.jpg` 命名 | **禁止入 git** |
| `videos/` | 5 段实况原片，共 218MB | **禁止入 git** |
| `web/` | 图文教程/攻略摘要（后台采集中） | 摘要可入，原文摘录不入 |
| `data/` | 从游戏数据文件提取的结构化资料 | 可入（几何/参数，非美术） |
| `frames.sh` | 联络表生成脚本，`./frames.sh <video> <label> [场景阈值] [均匀间隔秒]` | 可入 |

## 素材来源清单

实况视频（B 站，未登录 360p）：

| 文件 | 标题 | UP | 时长 | 用途 |
|---|---|---|---|---|
| `BV18BoJB7EFk` | 风笑试玩 | 逆风笑 | 46:45 | 最完整的系统巡览，检视卡/下注面板/马戏/商店/胶水厂都在里面 |
| `BV1CZGj6DETv` | 全成就攻略 | 我就是悠悠 | 13:41 | 按成就顺序走，覆盖全部机制；简介里还公开了多份完整 DNA 导出串 |
| `BV1BSRdBZELt` | 20 个隐藏知识 | 花狸木 | 6:30 | 冷门机制（辐射草变异、栅栏填海、化石洞穴、神秘小屋） |
| `BV1BM9fB8Eds` | 这是什么马？？ | 老番茄 | 21:31 | 1559 万播放，新手视角与节奏 |
| `BV1uhGh6iE2k` | 手机版 | 比利fire | 22:39 | **确认手机版无专门触控 UI，即桌面版等比缩放** |

## 读法建议

1. 先看 `VISUAL_REFERENCE.md` 第 12 节差距清单，那是行动项。
2. 要画某个界面时，去 `images/` 找对应官方截图定色彩与位置，再去 `frames/` 对应表看动态与上下文。
3. 需要精确数值时，以 `reverse/RE_FINDINGS_UI.md` 和 `data/` 为准 —— 图文攻略的数字多为口播转述，可信度低于二进制里的格式化字符串。

## 已知矛盾与待裁决

| 议题 | 图文攻略说法 | 更可信的依据 |
|---|---|---|
| 显性优先级 | 来自 `n` 字段排列 | 实测 `n[0]` 恒为显性位，与「下标小者显性」等价；`NECK_ANGLE` 代入得 48°，双方一致 |
| 年龄上限 | 8 岁 | UI 用 `Age: %d/%d` 打印上限，说明是运行期值，可能受 `OLD_AGE` 基因影响，**不能当常量写死** |
| 马戏棚数 | 4 个项目 | 实况清楚画出**六顶帐篷**（Diving / 紫 / Trampoline / Acrobats / 问号 / FREAKS $10），4 是缎带数不是棚数 |
| 下注交互 | 「选马→选票种→选金额」 | 实况是右侧常驻面板，**每匹马一行三个 `Win?`/`Place?`/`Show?` 按钮** |
| 铲粪 | 稳定收入 | 收入随野马灭绝而消失（存档文案），是**生态衍生收入**不是无条件水龙头 |

## 版权与使用边界

`videos/`、`frames/`、`keyframes/`、`images/` 是第三方实况与官方商店图，**仅供本地研究比对**，
已由本目录 `.gitignore` 排除，不得提交或分发。
移植代码中的美术（马、地形、图标）与 5×7 点阵字体均为程序化自绘，不含原作素材；
原作字体文件（n64 / picory / classified 等，署名 Chevy Ray Johnston）未使用。


---

# ▶ VISUAL_REFERENCE.md

# Horsey Game — 界面与地图实况规格（据 5 段 B 站实况逐帧观察）

观察材料：`videos/` 5 段实况（共约 90 分钟），`frames/` 49 张联络表，`keyframes/` 全分辨率关键帧。
所有描述是我自己的观察转述，只保留必要的界面文字标签与数值（这些是可事实核查的功能性信息）。

引用格式：`<视频>/<表号> 第 N 格`。均匀表换算时间：`秒 = ((表号-1)*25 + 格号) * 间隔`。
`achievements` 间隔 8s、`hidden20` 10s、`laofanqie` 15s、`mobile` 15s、`playthrough` 20s。

---

## 0. 全局 HUD（所有场景共有）

| 元素 | 位置 | 外观 |
|---|---|---|
| 金钱 | **左上** | 白底方块，绿色数字，前面一个小图标 |
| MAP 按钮 | **右上** | 白底红框方块，里面一个红色小车图标 + "MAP" 字样 |
| 工具/物品栏 | **左边缘竖排** | 约 6 格橙黄色方块槽，每格一个小图标；下方还有一个蓝色圆形指示 |
| 场景名 | 顶部中央 | 大字（如 `C.R.I.S.P.R. LAB`、`CIRCUS`、`Horse-Mart`、`Saloon`） |
| 对话气泡 | 角色头顶 | 白底小方框，橙/黑字 |
| 马的状态泡 | 马头顶 | `*neigh*`、`ZZZ`（睡）、`*m*` 等 |

**关键结论：HUD 是常驻的，不随场景切换而消失。** 我的移植目前每个场景各画一套 HUD，位置还不一致。

---

## 1. 顶视大地图

- 陆地底色**淡黄**，草地**浅绿**斑块，水**蓝**，路**灰**成网格状。
- 树是**成片的三角锥形**（青绿/墨绿两色混布），不是单棵画。
- 地面上散布**黑色小圆点 = 粪球**，这是铲粪收入的来源，直接分布在野外。
- 马在地图上是很小的侧视剪影，**成群站着/吃草**。
- **红色卡车拖着一个青边白箱拖车**在路上开——这是主要运输手段。
- 建筑在地图上就是小色块房子（红顶谷仓、绿穹顶建筑等）。
- 有**深棕色长条 = 木栅栏**，玩家可自建围栏圈地（`FencePlace`）。
- 存在**暗红色带点的区域 = 辐射区**（发电厂附近）。

> 我的 `world.js` 底色和路网是对的，但缺：粪球层、卡车+拖车实体、自建围栏、辐射区、成片三角树。

---

## 2. 拖车（Trailer）— 我完全漏掉的核心物件

- 外观：**白色长方形箱体 + 青色描边 + 底部两个黑色轮子**。
- 里面**堆着多匹马和各种道具**，每个物件上有一个**黄色数字角标**。
- 左上角有一个**放大镜图标 + 马名标签**，用于检视箱内的马。
- 它出现在**几乎所有室内场景里**（CRISPR 实验室、马厩、商店、胶水厂），说明它是**跟着玩家走的移动仓库/马匹载体**。
- 文案证据 `< Drag horse outside trailer to set free >` 与之对应：把马拖出拖车 = 放生。

> 这是移植的一个结构性缺口：马不是"养在马厩里"，而是**装在拖车里随身带**。

---

## 3. 马匹检视卡 — 原作最常用的面板，我完全没有

白底 + **淡蓝方格纸纹理**面板，尺寸约占屏幕右半：

```
HORSE            ← 或马名，橙色大字
Age: 6/8         ← 年龄显示为 n/8，最大寿命直接写在 UI 上
Ht: 12.6         ← 身高
Wt: 654          ← 体重（磅，对应胶水厂 3 cents/lb）
[彩虹DNA螺旋图标]   [该马的侧视剪影，画在方格纸上]
                                    [Close]  ← 右下，白底绿框
```

- **`Age: n/8` 直接证实了 8 岁上限**，比我按社区说法设的 `age>=8` 更明确：UI 层就把上限告诉玩家。
- **`Ht` / `Wt` 是公开数值**，说明体重是真实算出来的（胶水厂按磅计价、相扑按体重对抗都依赖它）。
- DNA 螺旋图标可点，进入基因编辑视图。

---

## 4. 赛马与下注界面

**布局（与我的实现差别最大的一处）**：

- **左侧**：马匹在**起跑门里竖直堆叠**，每匹一个**彩色编号方块**（1/2/3/4/5），马名用**不同颜色的字**标在左边，名字下方是**赔率**（如 `3-1`、`7-1`）。
- **右侧**：一个**棕色竖向下注面板**，顶部写着 `BETTING`，里面有一个蓝底骑师图标，往下**每一匹马对应一个白色 `Win?` 按钮**，面板底部是 `Your Bet` + 一个绿色金额框（如 `$5`）+ `◀$▶` 调节箭头。
- **顶部**：白色看台建筑 + 小旗子，橙色 `FURLONG` 箭头路牌，左上 `Race 11`。
- **底部**：白底黑字 `odds 7-1  prize $400`。
- 赛道本身是绿色场地，马向右跑；终点处有蓝色 `Win` 箭头牌。
- 左下角有 `Paddock` 木牌。

**下注交互**：点某匹马那一行的 `Win?` → 用 `◀$▶` 调金额 → 开赛。**不是**我做的"先选卡片再选票种再选金额"三段式弹窗。
`Win?` 按钮的存在也印证了 Win/Place/Show 是**同一面板上的多个按钮**，而不是切换模式。

---

## 5. CRISPR 实验室

**双层房间**：上半**浅蓝墙**，下半**紫红地板**。

- 顶部 `C.R.I.S.P.R. LAB` 招牌。
- 一台机器：绿色模式标签 `DNA EXTRACT` / `GENE DRIVE`，标签下方**三个旋钮/拨杆**。
- 机器右侧一个**橙色框架的烧瓶装置**（里面紫色液体）。
- 再右侧一台**米黄色电脑终端**，蓝色屏幕，机身标 `CRISPR`。
- 一个**穿黑衣戴尖帽的科学家 NPC**，气泡 `Commencing EXTRACTION!` / `I'm a geneticist`。
- 拖车就停在房间里，马从拖车里拖上机器台子。
- **基因编辑视图**：紫红底，左边一团**像素化的马形色块**，右边一个**彩色碱基组成的梯状双螺旋**——在这里直接改碱基。

## 6. HORSE-SIM 9000（生物黑客，另一栋建筑）

- **黑色 CRT 显示器**，绿色文字 `SAMPLING DNA...` / `SIMULATING...`。
- 显示器右边是**蓝色立式机箱**，带多个驱动器仓位。
- 房间上半浅蓝、下半紫色，有**一棵绿树**和**木栅栏**。
- NPC 气泡：`I call it HORSE-SIM 9000!` / `I hope you brought more DNA` / `The genes of the most optimal horse are on that disk!`
- 证实了调研结论：**提取器和模拟器是两台不同的机器、在两处不同的建筑**。

---

## 7. 马戏团

**外景**：一排**彩色尖顶帐篷**，上方一块浅蓝底粉红字的 `CIRCUS` 招牌。帐篷从左到右：

| 帐篷 | 颜色 | 标签 |
|---|---|---|
| 1 | 粉 | `Diving` |
| 2 | 紫 | （项目名，被遮挡） |
| 3 | 橙 | `Trampoline` |
| 4 | 绿 | `Acrobats` |
| 5 | 青 | `? ?`（未解锁显示问号） |
| 6 | 深蓝 | `FREAKS $10` |

**内景**：暗紫近黑的帐篷内部，**顶部两道聚光灯光束**，**观众是一排排彩色小圆点**，地板暗红并带星形装饰边。跳水棚里有**绿色跳台 + 梯子**，右下角一个**蓝色水池**。

> 帐篷是**六个而不是四个**，且第五个用问号表示未解锁 —— 与"集齐 4 条缎带才能进奖棚"的文案吻合（第 6 个 FREAKS 就是奖棚/怪胎棚）。

---

## 8. Horse-Mart（商店）

- 深棕室内，顶部**粉红霓虹 `Horse-Mart` 招牌**。
- 右侧一块**绿色价目表**：`Hay $5` / `Lasso $50` / `Shovel $95` / `Hay Bale $150`。
- 地面有**绿色地垫 + 商品图标**（套索圈、马蹄铁）。
- 木质柜台，店员戴尖帽，气泡 `Hey!` / `Let me get that for you`。
- **这是全套经济数值的权威来源**，与调研的社区数字完全一致。

## 9. 胶水厂（Sue's Glues）

- **暗红/酒红室内**。
- 一台**大秤**，刻度横条标 `0 / 1000 / 2000 / 3000`。
- 招牌 `Now Paying 3 cents/lb`。
- 马被拖上秤称重计价 —— 与检视卡的 `Wt` 字段直接呼应。

## 10. 马厩 / 家

- 橙棕色**双开木门谷仓**（对应 `BarnDoorOpen/Close`）。
- **右上角一个 `Sleep` 按钮 + 绿色圆点** —— 休息是显式按钮，不是"把马拖到某处"。
- 里面有**床 + 床头柜**、**围栏圈**（圈里一个绿色数字角标）、干草堆。
- 马在圈里会冒 `ZZZ`。

## 11. 酒馆（Saloon）

- 橙黄室内，墙上一台**绿色屏幕的电视**（播马赛，可 `TVPause/TVPlay/TVFF`）。
- 吧台 `Bar/Bar2/Bar3`、`BeerSign`、`BeerTap`。
- 客人是**戴高帽的火柴人**，有醉态（`drunk %d`）。

---

## 12. 与我的移植的差距清单（按严重度）

| # | 差距 | 严重度 | 证据位置 |
|---|---|---|---|
| 1 | 缺**马匹检视卡**（方格纸 + Age n/8 + Ht + Wt + 剪影 + Close） | 致命 | playthrough/s04 格6,7,11,12,15 |
| 2 | 缺**拖车**这一随身载体，马匹组织方式整个错了 | 致命 | 几乎每张表 |
| 3 | 下注 UI 应为**右侧常驻面板 + 每马一个 Win? 按钮**，不是模态卡片三段式 | 高 | playthrough/s04 格1 |
| 4 | HUD 应**全局常驻统一**（左上钱、右上 MAP、左侧竖排工具栏） | 高 | 所有表 |
| 5 | 马戏是**六顶彩色帐篷一排**（含问号未解锁态 + FREAKS $10） | 高 | playthrough/s04 格5,8,9 |
| 6 | 休息是**马厩右上 Sleep 按钮**，不是拖到草料位 | 中 | playthrough/s04 格15 |
| 7 | 缺**野外粪球层**（铲粪收入的视觉来源） | 中 | playthrough/u01 格3,13 |
| 8 | 缺**卡车实体与驾驶** | 中 | 多张表 |
| 9 | 缺**胶水厂秤 + 3 cents/lb** | 中 | playthrough/s04 格4 |
| 10 | 缺 **Horse-Mart 价目表**与商店交互 | 中 | playthrough/s04 格5 |
| 11 | CRISPR 机器布局（模式标签+三旋钮+烧瓶+终端）与基因编辑视图未实现 | 中 | mobile/u01 |
| 12 | 顶视地图缺成片三角树、自建围栏、辐射区 | 低 | playthrough/u01 |
| 13 | 马的对话气泡（`*neigh*`/`ZZZ`）未实现 | 低 | 多张表 |

## 14. 手机版说明

`mobile` 那份是**手机串流/移植桌面版**，画面与桌面完全一致，**没有任何触控适配层**。
所以词典笔的触控方案（点选/拖拽/两段式）确实需要我们自己设计，原作没有可抄的触屏范式。


---

# ▶ web/00-CONTROLS-AND-UI.md

# CONTROLS & UI LAYOUT — synthesis (lead document)

**Sources consolidated**
- Steam News API `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=3602570&count=100` (fetched 2026-10-26) — official patch notes
- Game data files as shipped in the public web-port repo `https://github.com/woahhcrackers/HorseyGameWeb` (paths `game/save/settings.xml.0`, `game/save/log.txt.0`, `game/data/sprites.xml.0`, `game/data/locs.xml.0`, `game/data/horsey.tmx.0`, `game/data/pop.xml.0`) — fetched 2026-10-26
- `https://horseygame.net/guides/complete-beginners-walkthrough` (video-screenshot derived; cached copy present in `/tmp/hg/guides_complete-beginners-walkthrough.txt`)
- `https://hinamizawa.ai/steam/horsey/beginner-guide/` (page is Cloudflare-blocked from this machine; only search-engine snippets readable)
- `https://tposegaming.com/horsey-game-guide/` (Cloudflare-blocked; snippet only)

**Confidence: `verified`** for everything attributed to official patch notes or to the shipped data files (two independent classes of evidence). **`single-source`** for the screenshot-derived HUD positions from horseygame.net. **`uncited-community`** for the tool-throwing description from tposegaming.

---

## ★ 0. THE CONTROLS REFERENCE (found — full table)

A real keybinding list exists: **`https://hinamizawa.ai/steam/horsey/cheats/`** (read 2026-10-26 via local browser; that host returns 403 to curl/WebFetch and `r.jina.ai` is blocked from this machine). Full details in `hinamizawa-ai-controls-tips-and-debug-menu.md`. Transcribed:

**Normal save ("the game tutorial only surfaces the lasso; everything else is on you to discover"):**
| Input | Effect |
|---|---|
| `Esc` | pause menu (music pauses) |
| `E` | **quick-close any popup / exit to the world map; from the racetrack it exits back to the paddock** |
| `Space` | advance dialogue |
| `F` | collect DNA from a target |
| `R` | switch to the gene drive (in the CRISPR lab) |
| `Ctrl+V` | paste the cure's genome from the clipboard |
| `G` (cursor over a horse) | "giddy up"/prance — paddock, stables, CRISPR lab only |
| `← ↑ → ↓` | pan the camera at the race track |
| mouse wheel | zoom (unnamed by any source, but zoom is real) |
| click-hold / release | grab–drag / drop; lasso aim–throw |
| hover only | pet |

**Debug-mode only** (after `Esc` → type `debug` → reopen pause): `Ctrl+Shift+E` spawn horse at cursor X · `R` respawn last · `Delete` delete horse under cursor · `T` trailer render mode · `U`/`Esc` exit.

**Consequence for the port:** the control surface is **six hard-coded keys + a contextual mouse cursor**. There is no movement key because there is no walking avatar; `E` is the exit/close key (which is exactly what official 1.3001's "Removed the press E to nuke your safe file feature" implies). Location-to-location travel = truck, or the `E` quick-exit.

---

## 1. The controls documented in the official patch notes

| Control | Evidence | Version |
|---|---|---|
| Mouse **grab / drag** of horses and items | Patch 1.3: "You can grab items with the silver lasso"; 1.1111: "Shopkeepers can be dragged back to their post"; 1.2: "You can't steal horses by flinging them off screen"; 1.25: "Carnivores may be captured with a silver lasso". RTTI string `b2MouseJoint` in the binary. Sprite atlas contains `GrabHand`, `GrabHand2`, `DragHorseHere`, `DragHorseHere2` (the latter two are *rendered hint text* sprites). | multiple |
| Hover-only **petting** | Not in patch notes. hinamizawa.ai: "Hover the cursor over any horse without clicking to pet it". Sprite atlas contains a dedicated cursor icon `PointerPet`. | single-source + data |
| **`G` = "giddy up" on a hovered horse** | 1.26 "Seize The Hay": "Secret hotkey: in the paddock, stables, and Crispr lab you can hover over a horse and press 'g' to make it 'giddy up'." Re-stated in 1.3002 Excalibur: "One mayest press 'G' in certain locations whilst hovering over a horse to maketh it go". (Dev-build `W` = whinny was superseded.) | official |
| **Arrow keys pan the camera at the racetrack** | v1.107: "You many now pan the camera in the race track with the arrow keys" (typo is the dev's). Sprite atlas also has `PointerPan` → a pan-cursor mode exists outside the track too. | official |
| **`E` used to do something destructive** | 1.3001: "Removed the press E to nuke your safe file feature." Proves `E` was bound in at least one context pre-1.3001 (a dev/debug binding). Nothing in the notes says what replaced it. | official |
| **Zoom exists** | 1.3: "Improved frame rate when zoomed out and drawing many horses." No patch note names the zoom input; the atlas has `EcoZoomIn`/`EcoZoomOut` icons but those belong to the conservation-tent UI. | official (feature) / unknown (key) |
| **Compass to home** | v1.107: "A compass will appear to guide you home if you get 1280 pixels away from it"; 1.108: "Compass hidden while situated in certain situations". Sprite `Compass`. Note the unit is **pixels**, i.e. world coordinates. | official |
| **Keyboard text entry on Steam Deck** | 1.5 "Hard Boiled": "You can name your horses with a keyboard on Steam Deck again" — naming is a text field; on Deck it uses the OSK. | official |
| **Keyboard text entry generally / renaming** | v1.1: "Can now rename horses on inspection screen"; 1.107: "Fixed a crash when renaming a horse while not connected to Steam" → rename happens in the *inspection screen* (a UI panel, not a hotkey). | official |
| **Mouse left-click aim/throw for the lasso** | tposegaming snippet: "equip a lasso from your toolbar. Select the lasso icon, hold left click to aim and throw it like a loop." | uncited-community |

## 2. Why there is **no keybinding list anywhere** — hard evidence

`game/save/settings.xml` (156 bytes, complete file):

```
<settings sound="1" volume="100" music="100" fullscreen="0" winx="160" winy="90"
          winw="1280" winh="720" vsync="0" background_draw="1" background_sim="1" />
```

That is the entire settings persistence. There are **no key fields**, so the shipped game has **no remappable controls and no keyboard-binding screen**. Every "controls page" a player could screenshot is therefore just this list: sound, volume, music, fullscreen, window size, vsync, plus the two odd `background_draw` / `background_sim` toggles (background layers rendered vs. simulated — this is what makes off-screen herds keep living). Anything a site publishes as a "keybinding table" is invented.

`game/save/log.txt` init line `Horsey screen size 960x540` → the game renders to a **logical 960×540 canvas** (scaled to the window). Use this as the design resolution for HUD coordinates; all guide claims about "top-left / top-right / bottom" bars are relative to it.

## 3. Cursor states (from `sprites.xml` atlas names — the full interaction vocabulary)

`Pointer`, `Pointer2`, `PointerAttach`, `PointerDig`, `PointerEat`, `PointerEnter`, `PointerGo`, `PointerInspect`, `PointerLasso`, `PointerMallet`, `PointerPan`, `PointerPet`, `PointerShoot`, `PointerTalk`, `PointerText`, `PointerThis`, `GrabHand`, `GrabHand2`, `Lasso`, `Lasso2`, `SilverLasso`, `SilverLasso2`, `AnimShovel`, `AnimShovelSilver`, `GunProj`.

Reading for the port: the cursor is **contextual** — hovering a target changes the pointer icon between pet / eat / dig / inspect / talk / attach / enter / lasso / mallet / shoot / text, and the grab state swaps to the `GrabHand` art. `PointerEnter` + `PointerGo` are almost certainly the "enter location" and "set vehicle destination" affordances (see §5). `PointerText` is the click-to-open-Keypress-text affordance (used for naming, hence the Steam Deck OSK bug).

## 4. Is there a walkable avatar? — best current answer: **no, a disembodied cursor**

Evidence for **no avatar**:
- `sprites.xml` (294 sprites) contains **no** player/human/hand-body avatar sprite. The only "hand" art is `GrabHand`/`GrabHand2`, i.e. the cursor.
- All creatures (including "human") are built procedurally from genes; `pop.xml` lists a population named **`human`** (plus `centaur`, `jockey`, `leprechaun`), and `genes.xml` contains `QUADRUPED` and `BIPED` genes. So "people" are just animal configurations — no dedicated avatar art needed, and no avatar controller.
- Interaction is a Box2D `b2MouseJoint` grab, and every documented verb is cursor-relative ("hover over a horse").
- No patch note ever mentions a movement key, walking, or a player entity's position.

Evidence that used to look like an avatar, now explained:
- Entity string `Player 1` → almost certainly the *Steam/local-player* slot name, not a world entity.
- `SmartHuman` AI + `animal_*smart*.wav` sounds → the `HIGH_INTELLECT` gene (helix 18) applied to a biped genome; the guide claim "convert owner to horse" (老番茄 @ 18:58) shows humans are animals to the simulation.
- "My House", `home` loc, compass "guide you home" → a *home location*, not a character's home position.
- Inventory bar + truck + `EnterLocation*` → the player owns things and drives, but the transport is a **click-to-drive vehicle** (see §5).

**Residual risk:** the truck's `DriveDest` marker sprite + achievement "Truck: Drive a sweet truck" prove driving exists, but no source states whether steering is arrow keys, `WASD`, or clicking a destination point. Treat "no movement key for a walking avatar" as settled, and "how the truck is steered" as the remaining open control question.

## 5. Travel / vehicle controls (partial)

- A `truck` object exists on the world map at **x=3104, y=3744** (immediately next to `home` 3040,3744≈3712) in `horsey.tmx`; sprite art: `Truck`, `TruckB`, `TruckO`, `TruckT`, `TruckTires(2)`, `TruckRam`, `TruckStripe`, `ChevyStar`; trailer: `Trailer`, `TrailerB`, `TrailerB2`, `TrailerO`, `TrailerT`, `TrailerW`.
- `DriveDest` sprite = a destination flag placed in the world → the game has a "drive to this point" interaction, consistent with click-to-steer rather than analog steering.
- The trailer is the mobile inventory/holding pen; horses are grabbed into it with the lasso (regular lasso auto-yanks the horse to your trailer, silver lasso requires you to drag it manually — r/HorseyGame via horseygame.net).
- Patch 1.3002: "Horses will accidentally escape the trailer less often." 1.1: "Unusual horses do a better job of locating the floor while in the trailer."
- The horn (`InvTrumpet`/`Trumpet` art, community "🎺 Horn" in Joe's footage) pushes/herds horses; per horseygamemap.org it "can push horses away from your vehicle".

## 6. HUD / screen layout (assembled; positions are `single-source`)

From horseygame.net's screenshot audit of Joe Bartolozzi's session (v1.0.4), plus atlas-art corroboration:

| Screen element | Position | Corroborating art |
|---|---|---|
| Bank / money counter | **top-left** ("$3169 in Joe's frame") | plain text rendering (`n64.fnt`, "Softsquare", "Picory" bitmap fonts) |
| **Sleep** button | **top-right** of the yard/stable view | `AnimSleep`, `AnimSleep2`, `SleepMoon` |
| Inventory / tool bar | **bottom**, small icons with stack counts | `InvLasso`, `InvShovel`, `InvTrumpet`, `InvGun`, `InvBalloon`, `InvFence`, silver variants `InvSLasso`, `InvSShovel`, `InvSGun`, `InvSBalloon`, `InvSFence`, plus `InvTab`, `InvTab2`, `InvTab3`, `InvTab4` (tab switchers) |
| Compass | floats toward home when >1280 px away | `Compass` |
| Race number / counter | corner of the racing screen ("Race 25" → "Race 72") | `Newspaper`, `RacerInfo`, `RacerInfo2` |
| Odds & trophy badges | per-runner rows next to the name | `MiniTrophy`, `TrophyGrey`, `StakesIcon`, `StakesIcon2`, `StakesIcon3`, `RaiseBet`, `WinningTicket`, `WinningHorse`, `StatusTrophy` |
| Status icons over each horse | floating above the animal | `StatusTired`, `StatusHungry`, `StatusHungry2`, `StatusOld`, `StatusFoal`, `StatusDead`, `StatusChamp`, `StatusTrophy`; thought bubbles `ThoughtHungry`, `ThoughtTired`; `PoofExclaim`, `WowStar`, `Tear*` |
| Dialogue / hint boxes | "Text boxes are always on screen now" (patch 1.3) — so text boxes exist and are clamped to the screen edges | `PointerText`, `HintBarn`, `HintTrack`, `DragHorseHere`, `DownHere`, `AgeWord`, `FurlongHalf` |
| Glue factory readout | wall price board "Now Paying: 3 cents/lb"; scale dial 0–3000 lb | `ScaleNeedle`, `WeightScale`, `Conveyor(2-4)`, `GlueHaus`, `Shred(2-4)`, `Scissors` |
| Inspection screen | panel opened by `PointerInspect`; supports rename | `PCMenu`, `PCMenuText` |
| Pause screen | `Pause` sprite; music pauses there (1.1111) | |
| Conservation tent | population bar + sim-speed + zoom controls | `EcoBar`, `EcoFaster`, `EcoSlower`, `EcoZoomIn`, `EcoZoomOut` |
| Power plant meters | four gauges (lift, ram bar, stopwatch, stripe) | `PowLift`, `PowRambar`, `PowStopwatch`, `PowStripe`, `DisLift`, `DisRambar`, `DisStopwatch`, `DisStripe`, `powerplant.jpg` background |
| Circus | ribbons as awards | `ItemRibbon1..4`, `Plinth`, `PrizeBox`, `PrizePresent` |
| Sumo | KO state + belt | `KO`, `KO2`, `SumoBelt`, `ChampRing`, `ChampSign`, `StakesIcon` |
| CRISPR lab | computer menu (COPY/PASTE), helix X-view, meiosis animation | `PCMenu(Text)`, `Helix`, `Meiosis`, `Meiosis2..11`, `LetterA/C/G/T`, `Cas9`, `Cas9b`, `CasRam`, `CasStripe`, `CasTires`, `GMO`, `Vial*`, `ItemDiskette`, `ItemMemory`, `ItemRambar`, `Scissors`, `Shred` |

Design consequence for the port: HUD is **absolute-positioned over a 960×540 logical canvas**, mouse-driven, with contextual cursor art; money top-left, Sleep top-right, tools bottom.

---

## Conflicts
1. **"Movement key" claims.** Several SEO sites imply a player character walks. horseygame.net's own opening-speedrun guide says "Walk over to the ace horse and drag it home too" — but that is narration of a video where the *cursor* moves. No official patch note, and none of the shipped data, supports a walking avatar. Weight: trust the data files.
2. **Petting input.** horseygame.net never documents it; hinamizawa.ai and the user's earlier pass both say hover-only; `PointerPet` proves a pet affordance exists but not whether click also pets.
3. **`G` vs `W`.** Dev build `W` = whinny (earlier pass), official 1.26/1.3002 say `G` = "giddy up" in paddock/stables/CRISPR lab only. Ship `G`.
4. **Zoom input.** Feature confirmed by patch 1.3; the key/wheel is not named anywhere. `EcoZoomIn/Out` art is conservation-tent UI, not world camera — do not map it to the mouse wheel.
5. **Lasso throw mechanics.** horseygame.net/tposegaming describe "hold left click to aim and throw a loop"; other sources describe lassos as an instant grab. Patch 1.25 ("Carnivores may be captured with a silver lasso") and 1.3 ("grab items with the silver lasso") imply grab semantics differ per tool. Unresolved.

## STILL UNKNOWN (controls)
- Truck steering input (keys vs click-to-destination) and horn trigger.
- Zoom control and whether arrow-key panning works outside the racetrack (`PointerPan` suggests it does).
- Whether `EnterLocation*` needs a click on a `PointerEnter` hotspot or a key.
- What `PointerMallet` / `PointerAttach` / `PointerDig` map to for input (click vs hold) — mallet appears in guides as "likely a stun tool", patch 1.1 mentions `Odin's Hammer`.
- Full Steam-deck control scheme (the game ships no Steam Input template that any reachable page describes).
- Steam community's 12 guides (`https://steamcommunity.com/app/3602570/guides/`) are unreachable from this network (connection reset), so no first-party controls reference has been read.


---

# ▶ data/NUMBERS.md

# 数值事实表（按证据强度分级）

`A` = 二进制里的格式化字符串或数据文件（最硬，值在运行期填入）
`B` = 官方商店截图/实况画面里能直接读到的数字
`C` = 图文攻略口播转述（单一来源，可能有版本差）

## 经济

| 项目 | 值 | 级 | 证据 |
|---|---|---|---|
| 起始资金 | $50（早期）/ $100（现版本） | C | 攻略，版本差异未定 |
| 干草 Hay | **$5** | B | Horse-Mart 价目牌（playthrough/s04 格5） |
| 套索 Lasso | **$50** | B | 同上；且为**一次性**消耗品 |
| 铲子 Shovel | **$95** | B | 同上 |
| 草捆 Hay Bale | **$150** | B | 同上 |
| 啤酒 Beer | **$10** | B | 酒馆招牌「Beer $10」 |
| 怪胎棚门票 FREAKS | **$10** | B | 马戏帐篷标签 |
| 普通赛报名费 | **$25** | B | 赛场「Entry Fee $25」 |
| 普通赛奖金 | **$500** 起，随场次增长 | B | 「Prize $500」；实测画面另见 $400/$1200 |
| 冠军赛报名费 | $250 | C | 攻略 |
| 冠军赛奖金 | $2500 起，随场次增长 | C | 攻略，Race 68 时读到 $3600 |
| 铲粪付酬 | **$50**/次 | A+C | 文案 `Good job. Here you go, fifty smackeroos` + `Scoop this dung into the cart and I'll pay you $%d` |
| 胶水厂单价 | **3 cents/lb**，秤量程 0–3000 lb | B | 厂内招牌 + 秤刻度 |
| 一匹马路约 | $23（≈767 lb） | B | 厂内读数 |
| 退役寄养 | **$100**/匹 | A | `I'll take care of your old horses for $100` |
| 走失马赏金 | **$500** | B | 告示牌「Lost Horse! Reward $500」 |
| Bubber 血统任务 | **$2000** | A | `I'll give you $2000` |
| 股票债券 | $50 | A | `I've sold some stocks and bonds for $50` |
| 配种费 | `Studding service is $%d firm` | A | 值运行期 |
| 参赛费 | `You'll need $%d to enter a horse to race` | A | 值运行期 |
| 最低赌注阶梯 | $5 → $25(VIP) → $100(精英) | A+C | `Minimum bet is now $%d` + 面板 `Your Bet $5` 实测 |
| 特效药（通关目标） | **$62,375** | C | 攻略读数，中文门户独立称"赚够62000" |

## 马匹参数

| 项目 | 值 | 级 | 证据 |
|---|---|---|---|
| 寿命上限显示 | `Age: n/%d`，实测画面 `6/8` | A+B | 格式串 + 检视卡 |
| 检视卡字段 | Age / Races / Ht / Wt / Parents / Offspring | A | `.rdata 0x14025a760` 连续块 |
| 体重单位 | 磅（整数） | B | `Wt: 654`、`Wt: 1268`、`Wt: 1810`；与胶水厂按磅计价一致 |
| 身高单位 | 一位小数的相对量 | B | `Ht: 12.6`、`Ht: 18.1`、`Ht: 18.2` |
| 马厩容量上限 | 10 匹 | C | 攻略，未见 UI 直接证据 |
| 普通赛连胜上限 | 3 场后普通赛报名静默失败 | C | 社区多例 |
| 冠军赛资格 | **2 场普通赛胜利** | A | `Your horse needs to win 2 races / Before it can enter the Champion race` |

## 赔率与结算

| 项目 | 值 | 级 | 证据 |
|---|---|---|---|
| 无历史马的初始赔率 | 5-1 | A+C | 检视卡 `Races:` 为 0 时；实测画面 `odds 5-1` |
| 有奖杯后赔率 | 降至 2-1 | C | 攻略 |
| 赔率显示格式 | `odds %d-%d` | A | X-to-1 |
| 奖金显示格式 | `prize $%d` | A | |
| 票种 | `Win?` / `Place?` / `Show?` 三按钮同行 | A+B | 标签块 + 面板实图 |
| 赔率生成方式 | 后台模拟多场，再用「每匹马各投 $100 的净收益」自检账面 | A | `Race %d-%s champs %d aborts %d time %d`、`$100 on each horse nets: $%d`、`Extrapolated Winner: %s` |
| 模拟反作弊 | 剔除异常马 | A | `culled one glitchy cheating horse` |

## 世界模拟

| 项目 | 值/行为 | 级 | 证据 |
|---|---|---|---|
| 暂停界面计数 | `Year %d` / `Sleeps %d` / `Races %d` | A | 三个独立计数器 |
| 时间换算 | 1 游戏日 = 1 马龄岁 | C | 攻略 |
| 种群遥测 | `year %d herb %d %s %d max %d gendiv %d` | A | 遗传多样性是显式统计量 |
| 牧场自建 | 选址→建立 | A | `Looking for stable site` → `Found site at %d,%d` → `%s founded at %d,%d` |
| 基因漂移 | 稀有等位随机消失，游戏内自称 "Genetic Tokyo Drift" | A | |
| 灭绝后果 | 野马耗尽 → 粪球消失 → 铲粪收入断源 | A | `All the horses are gone. There's no more dung. You've ruined everything.` |
| 保护站目标 | Goal 1 种群数量、Goal 2 遗传多样性 | A | `Goal 1: get the horse population to %d` 等 |

## 地图

| 项目 | 值 | 级 | 证据 |
|---|---|---|---|
| 地图尺寸 | 400×225 tile × 32px = **12800×7200 px** | A | `horsey.tmx` |
| 海洋占比 | 60950/90000 = **67.7%** | A | tile 统计 |
| 地点数 | **47**（含 20+ 城镇建筑、10+ 野生群、3 个 `buried` 挖掘点、14 个带 `radius`） | A | `Locs` objectgroup |
| 种群数 | **25**（马/人/骑师/车/苹果树/干草/鱼/酵母/DNA 螺旋/鳄/龙/虎/驼鹿/牛/鸭/兔/腊肠犬/熊/虫/矮精灵/椒/ freak…） | A | `pop.xml` |
| 道具/家具 | **136** 个具名 | A | `furniture.xml` |
| 精灵图 | 512×512 图集，**无马的贴图** → 马是程序化绘制 | A | `sprites.xml` 无 horse 条目 |

## 尚未取得可信数值的项

- `Ht` / `Wt` 的**计算公式**（只知道显示格式与量级）
- 疲劳/饥饿的自然增速与衰减率（只知有 `Sleeps` 计数与三态 gate）
- 相扑局时 60s 之外的力量/体重换算
- 马戏各项目的具体达标阈值（蹦床"4 次"、跳水"入绿桶"来自口播）
- 卡车速度、拖车容量


---

# ▶ reverse/RE_FINDINGS_UI.md

# REA / Ghidra 逆向侧结论汇总

工具：REA 6.7.0 + Ghidra 12.1.4（自建 arm64 原生反编译器），持久工程
`/Volumes/500GB/qoder_cache/horsey_re/ghidra_project/HorseyProj`，自写脚本
`DataXrefs.java`（数据交叉引用）、`HorseyDecomp.java`（反编译）、`Callers.java`、`ListRange.java`、`HorseyScan.java`。
目标：`Horsey.exe`，PE32+，imagebase `0x140000000`，`.rdata` 文件偏移→VA 增量 `0x1a00`。

## 1. 检视卡字段（一手证据）

`.rdata` 连续块 `0x258d60–0x258dc0`（VA `0x14025a760` 起）按内存顺序排列的标签串：

```
Age:   /%d    Races:   Ht:   Wt:   %.1f   Parents:   Unknown   Offspring:   %02d
```

由此确定卡片字段与顺序：
- `Age: <当前>/<上限>` —— **上限由 `/%d` 格式化，说明最大寿命是运行期常量而非硬编码 8**
- `Races:` —— 出赛场次
- `Ht:` + `%.1f` —— 身高，一位小数
- `Wt:` —— 体重（整数磅，对应胶水厂 `3 cents/lb` 与相扑体重对抗）
- `Parents:` —— 父母名，缺失时打 `Unknown`
- `Offspring:` + `%02d` —— 后代数，两位补零

**移植含义**：马必须携带 `parents` 与 `offspring` 双向引用（我的 `parse_save.py` 已经在真实存档里验证过 189/189 条父子回指成立），并且要能算出 `Ht`/`Wt` 两个可显示量。

## 2. 检视卡徽章集合

`0x140056420`（5169 字节）不是画卡函数，而是**标签字符串驻留**函数。反编译里的 64 位立即数按小端解出即为其内容：

| 立即数 | 解码 |
|---|---|
| `0x746c65426f6d7553` | `SumoBelt` |
| `0x7461654d6d657449` | `ItemMeat` |
| 符号引用 | `StatusFoal`、`ItemTrophy`、`ItemRibbon1`、`Brain`、`GMO`、`High Achiever`、`SelectInv`、`Horse` |

即卡片上会挂的徽章/标记：幼马状态、奖杯、缎带、大脑（智力）、GMO、肉、相扑腰带，以及成就专用标记 `High Achiever`。

## 3. 下注面板（一手证据）

`.rdata` 块 `0x25f1e0–0x25f3c0`（VA `0x140260c00` 起）：

```
Win?   Place?   Show?   odds %d-%d   prize $%d
All Money   Max Bet   Your Bet   Elite Bet   WinningTicket
Click Race when ready!   But the odds are slim
You can pick a horse to finish second   Pick a horse to finish third   If you're a real gambler
"And They're Off!!"   TV Time Out %d   flip win %d
StartNextRace   WinArrowAppear   GrandStand   Booth   SpelunkyRock   Clapping
```

交叉验证实况截图（`frames/playthrough/s_sheet_04` 第 1 格）：右侧棕色面板里**每一行马对应一个 `Win?` 按钮**，底部是 `Your Bet` + 金额 + `◀$▶`。
所以 Win/Place/Show 是**同一面板上的三列按钮**，不是模式切换；`Place?`/`Show?` 只在满足条件时出现（`You can pick a horse to finish second` 是解锁提示）。
`flip win %d` + `TV Time Out %d` 说明转播层有独立的暂停/快进状态。

## 4. 已确认的其它逆向事实（前几轮，保留索引）

- 存档头 **20 字节**：`version=11, seed, flags, live_horses=185, registry_count=287`；名册从 `0x14` 起 287 条，结束于 `0x2A0A`。
- 名册记录：`u32 name_len | name | u8[6] raw | i32 parent_a | i32 parent_b | i32 reserved | u32 child_count | u32 children[]`。
- 存档 `0x33974–0x3cc1c` 的 37.5KB 静态区是**地图/地形块**（含地点名），不是基因数据。
- 基因表达：`hi=max(allele), lo=min(allele)`，`value = (1-m/100)*(g[hi]/s) + (m/100)*(g[lo]/s)`；`n` 字段只是等位槽的字母命名，`n[0]` 恒为显性位，故与「下标小者显性」等价。已用 `NECK_ANGLE` 代入验证得 48°。
- 躯干：`mass = 2*SIZE*(1+BONES+BONES2)*CHEST_BIG*CHEST_SMALL*GIANT_DWARF`，`ratio = CHEST_SMALL*SKINNY*ASPECT/CHEST_BIG`，四足时 `bodyLen=sqrt(mass*ratio)`、`bodyH=mass/bodyLen`。
- 引擎含 `b2MouseJoint`（RTTI），与实况中「拖拽马匹」一致。
- 音效事件名表 486 条（`/tmp/horsey_sfx.txt`），其中 `EnterLocation*` 13 个、`Smart*` 14 个、`Grab*` 29 个，是玩法系统最密集的单一证据源。

## 5. 尚未攻下的逆向目标（下一步该挖的）

1. **`Ht` / `Wt` 的具体算式**：标签驻留函数不是画卡函数，需要改为交叉引用驻留后的 `DAT_14030ae**` 全局 string 对象，或从 `FUN_140091710`（11719 字节，含 `Win?` 引用，疑似赛马/下注主循环）反推。
2. **顶视→侧视的场景切换与相机缩放**：`ZoomIn/ZoomOut/ZoomTruck/UnzoomTruck` 对应的相机参数。
3. **卡车与拖车的实体模型**：拖车里物件的编号角标含义（价格？年龄？）。
4. **`Age: n/%d` 的上限常量**从哪来（`OLD_AGE` 基因？还是全局常量）。
5. **相扑 60 秒局时与三种胜判定的代码位置**。
6. **活马记录的二进制布局**（含 480 字节基因组的序列化方式）与金钱/年份偏移 —— 仍未定位。

## 6. 本目录文件

- `fn_140056420_horse_card.c` —— 该函数的反编译输出（Ghidra 日志清洗后），473 行。实际内容是标签驻留，保留以便复核第 2 节的解码。


---

# ▶ web/steam-patch-notes-official.md

# Official Steam patch notes — v1.1 → 1.59 ("Filly Cheese Steak")

**Source:** `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=3602570&count=100` (Steam News API, the `contents` field is the developer's own announcement body).
**Fetch date:** 2026-10-26
**Confidence: `verified`** (first-party; retrieved straight from Steam's API, no proxy or transcription).

Full-text patch notes for Horsey Game are available through the Steam News API even though `store.steampowered.com/news` and `steamdb.info` are blocked from this machine. There are exactly **14 announcements**, all `steam_community_announcements`, spanning 2026-02-24 → 2026-05-14. The launch build (Feb 18 2026) has no announcement, so anything before v1.1 must come from other sources.

Chronological digest, with the mechanically-load-bearing lines kept close to the dev's wording:

## 1.59 "$1.59 Filly Cheese Steak" — 2026-05-14
- Temporarily removed the **test track at Surebreed Steeples**.
- New renderer (SDL) error checking for a black-screen bug; transparency fixes; "glitchy lines in the world map greatly reduced"; alt-tab lag fix; music fix attempt.

## 1.5 "Hard Boiled" — 2026-05-08
- Race music sometimes not playing → fixed.
- **"You can name your horses with a keyboard on Steam Deck again."**
- A condition blocked **parlay bets** → fixed (so parlays exist).
- Biohacker crashed if the vat held a single **homozygous** genome.
- Renderer rewritten from OpenGL to **SDL_Render**.

## 1.4 "Macaroni Mambo" — 2026-04-24
- Ported to Mac; upgraded to **SDL3**; Windows version maybe better re: graphics glitches.

## 1.3002 "Excalibur" — 2026-04-17
- "Fixed the unlawful stealing of horses"; horses eat dropped items more realistically; deceased horses in the world may **drop their equipment**; **"'G' in certain locations whilst hovering over a horse to maketh it go"**; horses escape the trailer less often; plutonium in an empty vat no longer freezes the game.

## 1.3001 "Lickety Split" — 2026-03-27
- **"Removed the press E to nuke your safe file feature."**
- Horse names sometimes blank → fixed; **trophies no longer show the attachment cursor**; shooting a horse lets you get your stuff back.

## 1.3 "Flipso Facto" — 2026-03-25
- **Infinite silver shovel is back** with a **two-second cooldown** ("dig away! Go ahead and fill your world with junk and potholes").
- **Grab items with the silver lasso and drop them in holes to bury them and fill up the hole.**
- "Text boxes are always on screen now."
- "Fixed the stealing of various objects. Thank you speedrunners aka beta testers."
- **Caves can be destroyed with the shovel**; **plutonium counts as food**; large horses smash fences less indiscriminately; better framerate when **zoomed out** with many horses; attaching footwear no longer teleports horses; **Sumo 10% less janky**; abandoned-track crash fix; loose ends in extreme population cases.

## 1.26 "Seize The Hay" — 2026-03-17
- **An old abandoned racetrack** added: bring your horses to race each other, **"Look to the south-east of the Crispr lab."**
- Horses get tired when exiting mid-circus-event.
- **"Secret hotkey: in the paddock, stables, and Crispr lab you can hover over a horse and press 'g' to make it 'giddy up'."**

## 1.25 "Stampede Pancakes" — 2026-03-14
- "Bipeds fall over less"; wheeled horse in the powerplant wasn't working; two achievements fixed; gene tweaks to reduce glitch-outs; big carnivores smash fences instead of ghosting; **limbs may detach under high stress**; **carnivores may be captured with a silver lasso**.

## 1.2 "Minty Fresh" — 2026-03-07
- **"You can cut and paste genomes to your real life clipboard with the Crispr lab computer."**
- Fixed the release-&-recapture cheat; anomalies from odd gene combos; **"You can't go to the track until you collect your dung monies."**; can't steal horses by flinging them off screen.

## 1.1112 "Odin's Hammer" — 2026-03-04
- "I have fixed the last remaining crash bug… 100% crash free!"

## 1.1111 "Sexy Molasses" — 2026-03-03
- Can't accidentally drop the thing in the thing; CRISPR device more reliable at **gene copying**; **"Shopkeepers can be dragged back to their post to resume their jobs"**; free glitchy horses to dispose of them; no crash if a horse touches conveyor **and** scale simultaneously; **horse mass calculation tweaked**; horses facing-left fixes; music pauses on the pause screen; shovelling on water fixed.

## 1.108 "Distant Bagpipes" — 2026-03-01
- **"Compass hidden while situated in certain situations."**
- Crash if no qualified geneticist to operate the CRISPR machine; save-game crash from helices with "a quantum number of arms"; **"Legs with prismatic joints (in Box2D parlance) will sort behind the body"**; bowties dropped in the world crashed the powerplant; gift baskets repeated the same item; **"Shovel exhibits less infinitude."**

## 1.107 "Iridium Gaskins" — 2026-02-27
- Crash renaming a horse while offline; crash when a horse eats a vial dropped outside; **"A compass will appear to guide you home if you get 1280 pixels away from it."**
- **"Recalcitrant horses may be bribed to race with a beverage."**
- **"You many now pan the camera in the race track with the arrow keys."**
- Levenshtein-distance de-duplication of horse names; less delay between races on TV; "positive net cash flow when **dragging horses around in the paddock**" fixed.

## v1.1 "Nostril-Damus" — 2026-02-24
- **"Due to player requests, shovel price has been lowered to $95."** ← the only official price statement in the patch notes.
- Added confirmation to game reset; **Mabel's eyebrow obsession** more fleshed out; high-res **volt meter graphics in the powerplant**; **"Can now rename horses on inspection screen"**; **"Esoteric changes to Clide's inventory"** (Clide = the car dealer); achievements crash on Linux fixed.

---

## Conflicts / notes on this source
- The shovel price here ($95, v1.1, 2026-02-24) directly supports horseygame.net's flagged discrepancy: Cheru's video shows $95 while 逍遥散人's later video shows $150 → the community figures were recorded on different patches, **or** one creator misread. Official note says $95 as of v1.1.
- 1.59 removes the **test track at Surebreed Steeples** "temporarily" — a port that models a practice track should note it exists at the `surebreed` location and was disabled in the live build as of 2026-05-14.
- 1.3 says infinite silver shovel came **back**, i.e. an earlier build had it, it was removed, then restored with a cooldown. Guide claims about "shovel exhibits less infinitude" (1.108) are the same arc.
- No announcement exists for a `1.27`–`1.29` or `1.31+` line; version numbering is idiosyncratic (1.26 → 1.3001), so don't infer missing content from gaps.


---

# ▶ data/sfx_by_system.md

# 音效事件清单（按系统归类）

来源：`data/sound.xml` 的 486 条事件名。事件名即开发者写代码时给动作起的名字，
是玩法系统最密集、最不容易造假的单一证据源。

> 注：同一事件名出现多次代表有多个变体（例如 `Horse` 有 51 个变体、`SmartHuman` 有 88 个），
> 下表已去重，保留的是**系统名**而非样本数。

## locations  (16)

  EnterLocationBiohacker  EnterLocationCarLot     EnterLocationCircus     EnterLocationCrispr     EnterLocationGlue       EnterLocationHome       EnterLocationMart       EnterLocationPaddock
  EnterLocationPowerPlant  EnterLocationSaloon     EnterLocationStable     EnterLocationSumo       EnterLocationTent       EnterTent               Paddock                 Stable

## ai_controllers  (14)

  SmartAlligator          SmartCar                SmartCow                SmartDino               SmartDog                SmartDuck               SmartGiraffe            SmartHorse
  SmartHuman              SmartInsect             SmartLeprechaun         SmartMoose              SmartRabbit             SmartTiger

## grab_items  (29)

  GrabApple               GrabBale                GrabBallAndChain        GrabBalloon             GrabBeer                GrabBriefcase           GrabCactus              GrabCarcass
  GrabCard                GrabClothing            GrabClownNose           GrabDisk                GrabDung                GrabFlowers             GrabFossil              GrabGATC
  GrabGlasses             GrabHay                 GrabHorse               GrabHotSauce            GrabPlutonium           GrabRacingStripes       GrabRamBar              GrabRocket
  GrabStilts              GrabSuspensionLift      GrabTrophy              GrabVial                GrabWatch

## race  (16)

  ConveyorStart           CrossFinishLine         Drumroll                Gong                    GongWood                GongWoodLight           LoseMoney               LoseRace
  OnYourMark              RaceGetSet              RaceGo                  SimStartRace            StartDNAExtract         StartGeneDrive          StartNextRace           WonRace

## betting  (8)

  BetMax                  BetMore                 Betting                 GainMoney               LoseMoney               NotEnoughMoney          OpenPrize               PrizeAppear

## crispr_sim  (26)

  BalloonSimFaster        BalloonSimSlower        Cas9Motor               Crispr                  EnterLocationCrispr     GrabDisk                GrabVial                HelixAttach
  HelixPluck              InsertDisk              Mutate                  ProcessHorse            SampleDNA               SimHorseFinished        SimSavingToDisk         SimSpawnDisk
  SimStartRace            StartDNAExtract         StartGeneDrive          SwitchToExtract         SwitchToGeneDrive       VialExplode             VialFill                VialWorld
  VialZoomIn              VialZoomOut

## hoof_gear  (7)

  Hoof                    HoofRollerblades        HoofSneakers            HoofStilts              LiftOn                  RamOn                   StripesOn

## stable_chores  (16)

  BarnDoorClose           BarnDoorOpen            BarnMating              Dig                     DigFinish               DigLoop                 Dung                    DungInCart
  FencePlace              FillHole                GrabBale                GrabDung                GrabHay                 SmashFence              Sweep                   VialFill

## circus  (12)

  Bounce                  Cannon                  Circus                  CircusTimpani           Clapping                CurtainClose            CurtainOpen             EnterLocationCircus
  EnterLocationTent       EnterTent               LoneClap                Tent

## power  (12)

  EnterLocationPowerPlant  GongWoodLight           GrabSuspensionLift      HorseTouchingTurbine    JetEngineLoop           LiftOff                 LiftOn                  LightsOn
  PowerOff                PowerOn                 PowerPlant              TurbineSpin

## wildlife  (25)

  Alligator               Cow                     Dino                    Dog                     Duck                    Fish                    Giraffe                 Human
  Insect                  Leprechaun              Moose                   Rabbit                  SmartAlligator          SmartCow                SmartDino               SmartDog
  SmartDuck               SmartGiraffe            SmartHuman              SmartInsect             SmartLeprechaun         SmartMoose              SmartRabbit             SmartTiger
  Tiger

## sumo  (4)

  EnterLocationSumo       ImpactHard              SmashFence              SumoBattle

## truck  (20)

  BriefcaseOpen           Car                     CarLot                  DungInCart              EnterLocationCarLot     GarageDoorOpen          GrabBriefcase           GrabCarcass
  GrabCard                Honk                    SmartCar                TitleCard               TruckEnterLocation      TruckIdle               TruckLeaveLocation      TruckMotor
  TruckPotholeIn          TruckPotholeOut         UnzoomTruck             ZoomTruck

## ui  (31)

  AttachItem              BarnDoorClose           BarnDoorOpen            BiohackerDoorOpen       BriefcaseOpen           Check                   CloseNews               ComputerBeep
  ComputerCopy            ComputerMenu            ComputerPaste           CurtainClose            CurtainOpen             Dialog                  DropHorseFail           GarageDoorOpen
  HelixAttach             JustSwitch              LerpHorse               LockBreak               LockRattle              OpenNews                OpenPrize               PutOnShelf
  SelectInv               SwitchToExtract         SwitchToGeneDrive       Uncheck                 VialZoomIn              VialZoomOut             ZoomTruck


---

# ▶ 其余图文攻略摘要（web/）


## chinese-portals-and-bilibili-corpus.md

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


## game-data-files-map-and-genes.md

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


## github-tools-genome-tables-and-map-editor.md

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


## hinamizawa-ai-controls-tips-and-debug-menu.md

# hinamizawa.ai — the actual controls reference, tips, cheats & debug menu

**Source:** `https://hinamizawa.ai/steam/horsey/beginner-guide/`, `/steam/horsey/tips/`, `/steam/horsey/cheats/` (plus `/steam/horsey/` hub: Sprite Sheets, DNA Database, World Map "all 45 locations").
Read 2026-10-26 through the local browser (direct curl/WebFetch get Cloudflare 403; `r.jina.ai` is network-blocked). Pages are dated **Published May 2 2026 / Updated May 16 2026**, self-labelled "Community-sourced", and cite: horseygame.com wiki, **Steam Community guides ("Horsey 101", "the CRISPR DNA & Genome Mapping Tool guide")**, **Speedrun.com forums "for keybinds and hidden mechanics"**, **ChapterCheats** for the achievement roster, **MobyGames + Glitchwave** for the release record.
**Confidence: `uncited-community` as published, but `verified` wherever it agrees with official patch notes or shipped data — which is most of it.** Its helix/gene table agrees with `horseygamegm` (executable-extracted) and with `genes.xml` allele values at ~19 of 20 checked points, so the page is clearly written against the real gene table, not generated.

## ★ THE KEYBIND TABLE (this is the missing reference)
**Normal save — no debug needed.** The page notes: *"The game tutorial only surfaces the lasso; everything else is on you to discover."*
| Key / input | Effect | Corroboration |
|---|---|---|
| **Mouse: click + hold on a creature/item** | grab & drag it (the drag state lives **on the cursor**, not in the room) | `b2MouseJoint` in the binary; `GrabHand` art; many patch notes |
| **Mouse: hover without clicking** | **pet** the horse | `PointerPet` art |
| **Left mouse hold + release (lasso equipped)** | aim and throw the loop | tposegaming snippet |
| **`E`** | **quick-close any popup; exit to the world map; from the racetrack it exits back to the paddock** | explains official 1.3001 "Removed the press E to nuke your safe file feature" (E is the global exit/close key) |
| **`Space`** | advance dialogue | matches `PointerText` and patch 1.3 "Text boxes are always on screen now" |
| **`F`** | **collect DNA from a target** | alternative to the "dial → DNA EXTRACT → lever" description |
| **`R`** | switch to the **gene drive** in the CRISPR lab | lab computer verb set |
| **`Ctrl + V`** | **paste the cure's genome** (once it is on the clipboard) | official 1.2 "cut and paste genomes to your real life clipboard" |
| **`G`** (cursor over a horse) | easter egg: "giddy up" / prance — **paddock, stables, CRISPR lab only** | official 1.26 + 1.3002, verbatim |
| **`← ↑ → ↓`** | pan the camera **at the race track** | official v1.107 |
| **`Esc`** | pause menu (music pauses there) | official 1.1111 |
| **mouse wheel / zoom out** | zoom exists | official 1.3 framerate note; *input unnamed by any source* |
| **Steam Deck** | on-screen keyboard for naming; no native gamepad scheme documented | official 1.5 |

**There is still no movement key, and now positively so:** every documented key is a UI/interaction verb (close, advance, collect, switch, paste, pause) and the one locomotion-ish claim in the community is *"Walk into an NPC house…"* → **walking means moving the cursor / camera, and travel between locations is done by truck or by the `E` quick-exit to the map.** The robbing trick proves the model: *"Click and hold the horse… press E while still holding… the pickup state survives the transition because it lives on the cursor, not the room. Drop the horse in your truck… release the click over the trailer slot."*

**Debug-mode keybinds** (only while the debug menu is enabled): `Ctrl+Shift+E` spawn a horse at the cursor's X (Y fixed by spawn rules); `R` re-spawn the last spawned horse; `Delete` delete the horse under the cursor; `T` enter **trailer render mode** (place horses directly into the trailer slot); `U` or `Esc` exit.

## Debug / developer menu
- Unlock: **`Esc` → type the word `debug`** (no input field; the game listens for the keystroke sequence in the background) → close and reopen the pause menu; the debug panel appears **to the right of the normal pause options**. Persists until the executable restarts.
- Options: **Money** +$1,000 per click · **Loaded** unlocks every gadget (lasso, shovel, shotgun, fence, hot air balloon…) and adds 20 of each · **Inventory editor** (cash, lasso, shovel, shotgun, fence quantities) · **Restart** · **Restart+** (keeps a small carry-over inventory) · **Junk Shop (debug)** and **The Secret Zoo** — two extra buildings that spawn next to *Clyde's* Rides on a **new** save started with debug on (the Junk Shop sells one of every item) · **Betting Mode** — **"DO NOT CLICK": it locks the save into an endless race that only exits by restarting the executable, with no payoff** ← the single worst documented softlock in the game.
- Achievements reportedly still fire with debug enabled; they advise a clean save anyway.
- Save location: **`save1.dat` and `save1.dat.prev` in the game's Steam local-data folder** (copy both to back up).
- This is consistent with the Fandom wiki's "Norse Horse / Güilty Pasture / Daïsy… appear in **Debug Mode** in certain versions" and with horseygame.blog's "the game does not need a cheat download" hedging.

## Hidden mechanics list (tips page §5, all reproducible)
- **Walkies:** release a tired horse and immediately re-capture → stamina resets, only one age cycle ticks. (Matches official 1.2 "Fixed the release & recapture cheat" — so this is a *reintroduced/soft* behaviour, patch-version-dependent.)
- **CRISPR power bypass:** spam-click the **light fixture** inside the lab while power is off; it eventually toggles power on. (So the lab has a literal light switch and the puzzle can be skipped.)
- **Sabotage:** feed rival horses consumables/DNA flasks before a race — **hot sauce speeds stride, beer slows it**, weird DNA can break a stride entirely; **no reputation penalty**, and you can do it at the rival barn.
- **Hot sauce also removes exhaustion** (matches r/HorseyGame's "hot sauce eliminates the sleep requirement"), and is scarcer than beer: barn sales, shovel digs, gift baskets, the hermit's cave.
- **Floppy disks bypass the flask flow** — a disk can go straight into the DNA vat.
- **Roads are suggestions** — the truck/trailer cross most terrain.
- **Move NPCs by parking a horse on their tile** (they walk off; remove it and they walk back). Matches official 1.1111's dragged-shopkeepers fix.
- **Lasso sleeping animals first** — they don't move, "the rope lands every time".
- **A `ZZZ` bubble = exhausted** and the horse is useless until it sleeps; **resting any one horse advances every horse you own by one age cycle**; age caps at 8.
- **A defeated sumo champion is released into the wild** — lasso it back and you keep its DNA.
- **Carnivore horses, if released, eat the wild population then starve** → quarantine or cull (this is the actual mechanism behind Cheru's carnivore-extinction balloon softlock).
- **Toss horses into the radiation pen near the power plant for forced mutations**; fence them in.
- **Caterpillars** spawn from random shovel digs anywhere; the spade can't catch one — swap to the lasso when the `+` capture icon appears. (Explains `pop.xml`'s `centipede` population.)
- **Lasso fish from any water tile** (not just the swamp) — the water-rope fishing rumour, now with a mechanic description.
- **Racing is physics-deterministic, not RNG** → "bet only on observed winners; watch three or four NPC races first."
- **The bar acts as a leaderboard.**
- **Save-crash failure mode:** aggressive edits can produce a "freak of physics" whose geometry the engine cannot simulate — the save crashes the moment it steps. Always keep backup flasks; the Bio Hacker NPC at the suburban house is the usual offender.

## Genetics content worth keeping (validated against `genes.xml`)
- **Heterozygous expression formula (community-stated):** `Final = (m% × high-priority base) + ((100−m)% × low-priority base)` — i.e. `m` from the gene table is the **mixing percentage between the two alleles**, and priority order comes from the `n` permutation; same alleles in different positions can give different phenotypes; base *order* within the pair doesn't matter (TG = GT). This is the single most useful mechanic statement for a port. (Consistent with `SIZE m=95`, `ASPECT m=95`, boolean genes `s=1 m=100`.)
- **Helix-position notation is 0-based** and matches the executable-extracted table exactly: `H0.4 GIANT_DWARF`, `H1.0 GUT`, `H1.2 DERRIERE`, `H1.9 LITTER_SIZE`, `H1.10 OLD_AGE`, `H2.12 BRAIN_SPASTIC`, `H3.0 SPLAY`, `H4.9 BREAK_FORCE`, `H5.7 WHITE_IS_LETHAL`, `H8.1 LEG_LENGTH`, `H8.2 LEG_STRETCH`, `H8.4 LEG_STRENGTH`, `H18.0 NARCOLEPSY`, `H18.1 SPEED_FACTOR`, `H18.4 SPINAL_LOCO`. Every stated value matches `genes.xml` through the `n` permutation (GIANT_DWARF C=133 ✔, GUT A=45 ✔, DERRIERE G=70 ✔, LITTER_SIZE G=5 ✔, OLD_AGE G=2 ✔, SPLAY G=45 ✔, LEG_LENGTH T=120 ✔, LEG_STRENGTH C=120 ✔, SPEED_FACTOR T=133 ✔, SPINAL_LOCO A=2 ✔, NARCOLEPSY G=1 the only non-zero ✔, WHITE_IS_LETHAL G=1 the only non-zero ✔, BRAIN_SPASTIC T/C=0 ✔). **Only mismatch: `BREAK_FORCE` — they print "A = 50"; the data says A = 54.**
- Racing essentials: **avoid `NARCOLEPSY G`** (random mid-race sleep), **never `WHITE_IS_LETHAL G` + white coat** (lethal foal), `LEG_PENCIL` makes a horse fragile, forward-set eyes "better start detection".
- Sumo targets: 1,000+ lb, short splayed legs, low forward head, **wedge then rear up to flip the opponent**; 60-second bout.
- **Easter-egg species switches** (reverse-engineered from the wiki): Fish needs `SKIN_HEAD=2 AND SKIN_HUE=1 AND SKIN_HUE2=3`; Crocodile needs 2 of 3 (`TEETH_SHAPE=3`, joint configs, green colour values); "intelligent monster" from `HAS_ANTLERS=1 + HAT_SIZE>50` grants intelligence even with `HIGH_INTELLECT=0`.
- **DNA carrier rule for the vat:** *"the DNA vending machine"* accepts organics only — apples, beer, hot sauce, meat dropped from shot animals — and rejects boots, balloons, glasses, trophies. Acceptance message: **"That's the stuff!"** (in-game UI text).
- Chamber capacity: **six horses** for blended extractions.

## Economy / progression claims unique to this site (treat as `uncited-community`)
- Income ladder table: glue ~$20–30/horse · paddock work small/variable · standard race $25 → $500 ($475 profit) · championship $250 → escalating · **sumo "wager-based, nothing to enter, generally higher than racing per match"** · conservation goals high · **circus Prize Tent = infinite tools + freak horses** · aggressive betting needs $10k+ net worth.
- Net-worth bands: $0–500 glue+paddock · $500–2,000 standard races · $2,000–10,000 championships/circus/conservation + start CRISPR · $10,000+ aggressive betting.
- **CRISPR lab unlock claim:** "behind tutorial races, **$50,000 in the bank**, a **$10,000 editing licence**, and a junker car dropped into the hamster wheel for power." — see Conflicts.
- **Hot air balloon unlock (the first concrete answer anywhere):** clear the Conservationist's twin goals — **Population 400 AND Genetic Diversity 50% simultaneously**; diversity is scored by species, so 400 near-identical horses read as low diversity (they show 34% as a failing example). Alternative: the debug **Loaded** command grants it free.
- **Four circus tents → Prize Tent (infinite tools)**; events named **High Dive, Car Pull, Trampoline, Acrobatics** with per-event body plans; Trampoline is the hardest.
- **The swamp is directly north of the starting town** (grass → reeds transition), contains sleeping alligators and moose herds, has **no radiation**, and **hay bales cannot expand its fixed boundary**.
- **Cowboy Boots** are bought at the general store; **Fossil** digs are "specific dig tiles, community spots near the power plant"; **Dive** is triggered by a **small pool near the suburban houses**; **Truck** achievement = "buy a non-starter truck from the dealership"; **Strong** = clear the circus **Car Pull** event; **Trampoline** achievement needs only participation.
- **Robbing NPC houses** (live as of 2026-05-10, video timestamp 7:28): pick up an indoor horse, `E` to exit, drop it in the truck. High-value targets: the Conservationist's tent (south-east), suburban houses in the central neighbourhood, farmsteads near the racetrack (pre-tuned `SPEED_FACTOR T`/`LEG_LENGTH T`), and **Bubber's house** (championship-tier collection pieces). Indoor horses **respawn on re-entry but stolen ones don't**. Trailer capacity still applies (full → the "put back" animation plays).

## Achievement roster per this site — **25, not 26**
They list 25 names (A Cure, Acrobat, Balloon, Beer, Bet, Breeding, Bubber, Champ, Cowboy Boots, CRISPR, Diety, Dive, Floppy Disk, Fossil, GMO, Grand, High Achiever, Lasso, Lost Horse, Race, Strong, Sumo, Trampoline, Truck, Win/Place/Show) — identical to horseygame.blog's 26 **minus** `Win/Place/Show`? No: identical minus nothing; their set is the blog's 26 with **"Bet" and the rest all present** — the difference is they say 25 total across ChapterCheats + the Steam stats page, i.e. one of the blog's names is likely a duplicate/misread. Flagged in Conflicts.

## Dev / release facts (first non-Steam confirmation)
Developer **Captain Games / Justin Smith**, socials **@manbearcar** (X) and `manbearcar.bsky.social`; music by **Marlon Wiebe** (alias *Hero Is Not Strong*, Vancouver) — the credit panel is visible inside the in-game **furniture sprite sheet**; released **2026-02-18** on Steam PC; genre tags per MobyGames/Glitchwave: open-world, sports management, business simulation, ecosystem simulator, breeding sim, side-scroller, procedural generation, pixel art, absurdist comedy. (Their footer's "property of Stand Software" contradicts their own body text and the Steam data — treat as a template error.)

## Conflicts
1. **CRISPR unlock cost** — $50,000 bank + $10,000 editing licence (hinamizawa) vs horseygame.net's "unlock cost not on camera, unknown" vs 老番茄's power-plant-only chain vs official 1.108's "no qualified geneticist to operate Crispr machine" crash. The $10k licence may be the same thing as the alien's **$3 certification license** mispriced; **unresolved — do not hard-code the $50k/$10k gate.**
2. **26 vs 25 achievements** — horseygame.net says 26 ("Steam concurs"), horseygame.blog lists 26 names, hinamizawa says 25 after checking ChapterCheats + Steam. One roster must be off by one; nobody has resolved which.
3. **"Bubber" vs "Bubba"** — hinamizawa and horseygamemap.org both say **Bubber**; horseygame.net's transcription of Cheru's audio says Bubba; horseygame.blog's achievement name is **Bubber**. Weight favours *Bubber*.
4. **Balloon requirement** — carnivores (Cheru's complaint) vs Conservationist population+diversity goals (hinamizawa). Reconcilable: diversity requires many species including carnivores, which is why Cheru's carnivore-free world blocked it. **Adopt population 400 + diversity 50% as the trigger.**
5. **DNA collection input** — `F` (hinamizawa) vs dial-to-"DNA EXTRACT"+lever (horseygame.com) vs "put it on one of them and then DNA extract?" (MoreCaseOh). Probably: hold/inspect the creature and press F at the machine.
6. **`R` is overloaded** — gene drive in the lab, re-spawn in debug mode.
7. hinamizawa claims **45 map locations**; the shipped `horsey.tmx` has **47** Locs objects (including herd spawners) and ~31 named place types. Neither matches the other exactly.
8. The blog's `Diety` "community clue" (circus+race+sumo on one horse) is called **undocumented** here — no source has it.


## horseygame-blog-guides-low-trust.md

# horseygame.blog — multilingual fan blog (mostly content-free filler)

**Source:** `https://horseygame.blog/` + `/achievements-guide/`, `/car-guide/`, `/map-guide/`, `/sleep-guide/`, `/power-plant-guide/`, `/fossils-guide/`, `/racing-guide/`, `/race-not-working/`, `/breeding-guide/`, `/dna-codes/`, `/floppy-disk-guide/`, `/lost-horse-guide/`, `/hot-sauce/`, `/meat-guide/`, `/dino-guide/`, `/mods-guide/`, `/save-file-guide/`, `/cheats/`, `/horsey-game-speedrun/`, `/steam-download/`, `/horsey-game-free/`, plus `/de/`, `/es/`, `/ja/`, `/fr/`, `/pt/`, `/ko/`, `/it/` mirrors of every page. Fetched 2026-10-26.
**Confidence: `uncited-community`** — the site is SEO scaffolding. Almost every page spends its length telling you *how to test a claim safely* rather than making one. Its own pages admit it: "No invented fossil coordinates", "This page does not promise a fixed coordinate, a hidden switch…". The exceptions are the achievement roster (`horseygame-net-achievements-and-softlocks.md`) and the four facts below.

## Facts actually extractable
1. **Clide's Rides** is the car shop, **south of My House**, selling **two cars at $799 and $1,289**; the page explicitly attributes this to the community Fandom wiki ("CC BY-SA page, not official documentation"). Cross-check: the shipped map has a `car lot` loc at (3232, 3872) and a `LocCarLot` + `LocCarLot2` sprite; patch 1.1111 mentions "Clide's inventory". The prices are unverified by any video.
2. **A car sitting still is normal** — wheels ≠ self-propulsion; the reported workflow is to breed a car with a creature that already has repeatable rotational motion (crocodiles / spinning-leg creatures), i.e. `LEG_IS_CIRCLE` / `FOOT_IS_CIRCLE` inheritance (both genes exist in `genes.xml`, helix index 01). Rockets are "assisted movement" and must be tested separately. Matches HeTheLyon's "wheels are hard-coded into their genetics".
3. **The Sleep action is visible in an official Steam screenshot** — the blog repeatedly says the only evidence it has for Sleep is *a store screenshot showing a visible Sleep prompt in a ranch scene*, and explicitly refuses to infer a keybind from it ("A visible UI action and a keyboard binding are different pieces of evidence"). This is the strongest written confirmation that **Sleep is a button, not a key** — align with the `00-CONTROLS-AND-UI.md` finding that no keybinding system exists.
4. **Machine chain naming for the floppy achievement**: scanner → DNA flask → vat → simulator → CRISPR lab, with the floppy produced by the vat+simulator step. Labels "version-sensitive"; this is the only source that uses the word *scanner*.
5. **Shovel price**: the blog's breeding/economy pages repeat "$150 vs $95" as an unresolved discrepancy rather than resolving it — official note says lowered to $95 in v1.1.

## Anti-facts (things the blog says that are unsupported and should not be ported)
- "The official Steam media … shows a visible Sleep action" — fine; but its map page answers *"How can you pull up the map in Horsey Game?"* with "Use the in-game map prompt or the map reference available for your current build… Key bindings and unlocks can vary." That's a hedge, not evidence of a map screen. **There is no map screen in the shipped data.** Do not build one because this page implies it.
- `/cheats/`, `/horsey-game-free/`, `/steam-download/`, `/save-file-guide/`, `/mods-guide/`, `/fossils-guide/`, `/power-plant-guide/`, `/race-not-working/` contain **zero** game-specific mechanics. `/mods-guide/` is the only one with any signal: it reports that Steam discussion threads active in July 2026 include a **"timer and race-setting project"**, **SIM9000 customization**, and requests for broader mod support; and that Horsey Game is listed on **Nexus Mods**, with no Steam Workshop integration.
- `/dino-guide/`, `/meat-guide/`, `/hot-sauce/`, `/lost-horse-guide/` are troubleshooting-shaped filler. `dino` and `pepper`/`yeast` are real populations in `pop.xml`, so the *subjects* exist even though the pages say nothing about them.
- The site's own analytics asides ("Similarweb 2,030; difficulty 23; GSC 127 impressions at position 8.58") leak into the guide text — a reliable tell that a page is keyword-driven, not play-driven.

## Conflicts
- None material, because the site makes almost no claims. Where it does (Clide's Rides prices; the scanner/flask/vat/simulator chain) no other source contradicts or confirms them → left as `uncited-community`.


## horseygame-com-guides-low-trust.md

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


## horseygame-net-achievements-and-softlocks.md

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


## horseygame-net-and-community-crispr-breeding.md

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


## horseygame-net-economy-and-betting.md

# horseygame.net — economy, prices, betting & odds

**Sources (fetched 2026-10-26, cached as `/tmp/hg/guides_*.txt`):**
- `https://horseygame.net/guides/money-making-master-guide` ("Horsey Game Economy — Verified Prices, Race Entry, Payouts", 2026-05-09)
- `https://horseygame.net/guides/horsey-game-betting-odds-mechanics` (Betting & Odds, updated 2026-10-24)
Every dollar figure on those pages carries a video timestamp (Cheru, HeTheLyon, MoreCaseOh, bwhatsonn on YouTube; 老番茄, 逍遥散人, 少年怀特Weiss on Bilibili). Their verification tiers are documented in `horseygame-net-sources-and-verification.md`.
**Confidence: `single-source`** per number (one timestamped video each), but the *set* is the best-attributed price table available anywhere; several numbers are corroborated twice (noted inline).

## Campaign goal
- Cure for Sweetie's horse flu: **$62,375** displayed (Cheru @ 1:12); narrated as "$62,000" (Cheru @ 0:42); post-cure cash observed $62,000 (MoreCaseOh @ 32:45). 老番茄's run shows **$62,375** too.
- Starting cash: **$50** (老番茄; also "You start with $50 USD and a truck" in the opening-speedrun page).
- Community "reset the game once in the settings menu → starting capital snaps $50 → $100" — flagged by the site itself as **not reproduced on every patch**.

## Shop / item prices
| Item | Price | Source |
|---|---|---|
| Hay (bag) | **$5** | Cheru @ 3:38 |
| Hay bale | **$150** | Cheru @ 3:38 |
| Lasso (single-use) | **$50** | Cheru @ 3:38 + 老番茄 @ 3:16 (single-use confirmed) |
| Shovel | **$95** (Cheru @ 3:38) / **$150** (逍遥散人 @ 17:04) | conflict, likely patch. Official v1.1 note: "shovel price has been lowered to $95" |
| Beer (tavern/bar) | **$10** | 老番茄 @ 10:59 |
| Certification license ("the alien guy") | **$3** | 老番茄 @ 8:14 |
| Wild/sample horse purchase | **$48** | 逍遥散人 @ 9:49 |
| "Sample horse" for Blessing-in-Disguise | **$900** | Cheru @ 10:55 |
| Retiring a horse at 远方田野 / Distant Field | **$100** | 老番茄 @ 10:00 (also @ 11:49) |
| Horse named '偷' (Steal) | **$25** | 逍遥散人 @ 36:00 |
| Car (Clide's Rides) | **$799** and **$1,289** (two shop cars) | horseygame.blog citing the Fandom wiki — *not* in horseygame.net's verified table |

## Income (honest)
| Activity | Payout | Source |
|---|---|---|
| Scooping dung/poop | **$50 per scoop** | Cheru @ 6:23, and again @ 27:05 ($50 per turd); 老番茄 @ 6:54 records the same $50 as the *bankrupt-state* emergency job |
| Glue factory | **$0.03 per lb**, ≈ **$20–$30** per horse | Cheru @ 5:16; a wall board reads **"Now Paying: 3 cents/lb"**, scale runs **0–3000 lb**, and a live frame showed "Horse gets you $23" (≈767 lb) |
| Slaughterhouse direct sale | **$24** per horse | 逍遥散人 @ 22:02 (same 3¢/lb math, small horse) |
| Race entry | **$25** | Cheru @ 4:35; 老番茄 @ 3:46 |
| Regular race prize (1st) | **$500** + silver cup | HeTheLyon @ 1:18 ("easiest race" guaranteed payout $500); walkthrough table |
| Champion race | entry **$250** → prize **$2,500** + golden basket | 老番茄 @ 10:22 (tab text read on screen); corroborated Cheru @ 29:50 |
| Champion prize scaling | $2,500 at low race numbers → **$3,600 observed at Race 68** | Joe Bartolozzi session; formula unknown |
| Selling trophies via Sweetie | **$300** each (happens automatically if trophies are left near her) | Cheru @ 15:35 |
| Treasure map dig (fossil bone → map → dig) | **$5,000** | 林永季 @ 0:26 (video-verified) |
| Old Bu quest (rabbit-ear champion) | **$2,000** | 老番茄 @ 7:58 & 11:21 |
| Bubba quest (lineage + big ears) | **$2,000** | Cheru @ 28:00 / 28:40 |
| "Lady" horse sale offer | **$2,000** | 逍遥散人 @ 38:21 |
| Sumo win | reward is a **rocket** (item) | MoreCaseOh; no cash figure recorded |

## Betting / odds mechanics
- **Default odds for a horse with no history: 1:5** (老番茄 @ 0:52) — bet $10 → win $50 (@0:54); bet $5 → $25.
- **Trophy rule:** after a win, a trophy icon appears next to the name and odds drop to **1:2** (老番茄 @ 5:15).
- **Win + Place combo:** "You can bet on both first and second place; a 5-dollar bet can win 130 dollars" (老番茄 @ 5:25) → 26× for calling the top two **in any order**.
- **Field size varies:** 4-horse fields early (逍遥散人 @ 0:34), 5–6 in longer runs; the 6-horse field example is Hecktor, Corduroy Prince, Wild Heart, Blazer, Chex, Heart of the Sun. Site's advice: treat 4 as the common early case, not a rule.
- **Minimum-bet ladder:** $5 start (逍遥散人 @ 0:08) → **$25** after VIP unlock (Cheru @ 12:48; 逍遥散人 @ 25:26) → **$100** elite club "dues" tier (Cheru @ 26:50). VIP also **widens the odds board** (3:1, 5:1, 10:1 seen at 逍遥散人 @ 25:38).
- Bet sizes seen on screen: $12,000 "on the line" (Cheru @ 29:10); $10,000 bet aiming at $70,000 on a fire-breathing elk (@ 35:00); **max single win $46,000** (@ 29:40); bankroll $100,000 (@ 35:30).
- **Parlay bets exist** (fixed in official 1.5) and **"Win/Place/Show" is an achievement**, so a triple-type wager exists even though no video shows its payout.
- Trophy badges under opponent names = career win count (13–1 trophy rows visible) — the cheapest betting edge; not measured.
- **Elite Bet box at $900** appears in the right-hand panel of Champion screens (Joe's session) — a separate high-stake wager slot; multiplier never shown.

## Explicitly rejected numbers (site deleted them as unverifiable)
Carrot-stacking/dance-contest/fishing/circus payouts; "mid-tier sumo prize pool $1,400"; "Chapter-2 racing license $1,200"; "premium feed $150"; "Endurance Sire $2,400 / Hybrid Stallion $5,800"; "stud fees $4–8K per session, 3 sessions/week"; saddle market flips; stable-expansion cost; paddock layout cost; Champion League entry fee. **If a port needs one of these, it must invent it — no source has evidence.**

## Conflicts
1. **Shovel $95 vs $150** — official patch note (v1.1) says lowered to $95, so $150 is either the pre-1.1 price or a misread. Recommend $95.
2. **Glue factory vs slaughterhouse** — same 3¢/lb rate appears as "Glue Factory" (Cheru) and "Slaughterhouse … $24" (逍遥散人); likely the same building (`glue` loc) with the payout varying by weight, but two sites present them as different places. Treat as one location.
3. **$50 starting cash vs "$50 → $100 by resetting"** — the reset trick is `uncited-community` and unverified.
4. **Bet ladder attribution** — horseygame.net claims a single $5→$25→$100 ladder; 老番茄's video shows a **$10 base bet** on a 1:5 horse, i.e. the *minimum* is $5 but the *observed* bets are $10. Do not model "min bet $10".


## horseygame-net-quests-secrets-and-speedrun.md

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


## horseygame-net-racing-and-lifecycle.md

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


## horseygame-net-sources-and-verification.md

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


## horseygamemap-org-locations-and-guides.md

# horseygamemap.org — interactive map, locations & route guides

**Source:** `https://horseygamemap.org/` (Next.js site; `/locations/*` 50 pages, `/guides/*` 10 pages, `/wiki/items/*`, `/wiki/npc/*`, `/breeding-simulator`, `/genome-reference`, plus a full `/zh` mirror). All pages fetched 2026-10-26.
**Confidence: split verdict.**
- **`verified`** — every coordinate. All 41 coordinate pairs it publishes match the shipped `game/data/horsey.tmx` object layer byte-for-byte (see `game-data-files-map-and-genes.md`), and its "south-east of the Crispr lab" style directions match patch 1.26's own wording. The site has a GitHub-linked community map dataset behind it, so the location table is a real extraction.
- **`uncited-community`, and in at least one case demonstrably fabricated** — the `/guides/*` prose. See the alert below.

> **⚠ Fabrication evidence.** `/guides/how-to-unlock-normal-suburban-house` describes a quest with three hidden **pressure pads** (green trash can, oak tree, inside the dog house), a **"200 gold coins"** price, a **"Good Neighbor achievement"**, and a "neighbor alert → teleport back to the town square" fail state. None of it is in the shipped achievement roster (26 names, see `horseygame-net-achievements-and-softlocks.md`), none of it is in any patch note, and the coordinates it gives for the "Normal Suburban House" (3360, 3488) are, in the actual map file, the location typed **`acres`**. Its `/guides/what-does-the-ram-bar-do-in-horsey-game` confuses the RAM **bar** (an in-game gauge art element `Rambar`/`ItemRambar`/`PowRambar`/`DisRambar`) with "The Bar" saloon. Treat their guide text as untrusted and check every claim against `steam-patch-notes-official.md` or the data file before porting.

## Location descriptions worth keeping (with my own cross-checks)
| Loc | Their description | Cross-check |
|---|---|---|
| `supply` (3072,3808) The Store | "Buy lassos, hay, hay bales and shovels here. **Exit and re-enter to refresh merchandise.**" | Only source for shop-inventory refresh; consistent with 1.1111's "Esoteric changes to Clide's inventory" and with location interiors being separate screens. `single-source` |
| `saloon` (3072,3552) The Bar | "Purchase beer, chat with regulars for gossip, view leaderboards. **TV controls work, and watching races counts towards leaderboards.**" | Matches r/HorseyGame's "fast forward on the races on TV" champion-pool fix (`verified` by that thread) |
| `glue` (3488,3840) | "$0.03 per lb ($20–$30 average). **Worn gear items will be returned.**" | rate matches Cheru; "worn gear returned" is `single-source` |
| `track` (3168,3712) / `paddock` (3136,3712) | "Entry fee $25 for $500 payout; championship entry $250 with escalating payouts." paddock = "spacious grassland suitable for horse rest and natural growth" | matches horseygame.net; note track and paddock are **adjacent 32-px objects** — one site, two doors |
| `sumo` (3680,4128) | "Horses compete in **60-second bouts**. Defeating the world champion rewards prizes **starting at $100, escalating by $100 per win**." | The only cash figure for sumo anywhere; `uncited-community`. horseygame.com says the reward is a rocket; horseygame.net (MoreCaseOh) says rocket. Both can be true (cash + item). |
| `circus` (2464,3520) | "Enter horses to perform for money and ribbons. The **'freaks' tent costs $10** to display a horse with butchered DNA for amusement." | aligns with the "Freak Show" report in horseygame.net and with `pop.xml`'s `freak` population |
| `hutch` (3488,4064) | "**Pay $100 to store elder horses to stop aging and feeding. Reload them back into your trailer anytime.**" | Conflicts/overlaps with "pay $100 at 远方田野 (Distant Field) to retire a horse" (老番茄). Likely the same $100 service under two names. |
| `mabels` (3264,4800) | "**7 initial barns** with different quests, horse purchasing or breeding options. **Intelligent horses may create new barns over time.**" | Mabel is the stables manager (patch 1.1's "Mabel's eyebrow obsession"); "intelligent horses build barns" is the only written description of `HIGH_INTELLECT`'s downside besides horseygame.com's "they may even open rival yards" |
| `abandoned` (4224,4032) | "Evaluate horse viability on a **full-length track without submitting to a race or causing exhaustion**." | matches official 1.26's abandoned racetrack; a free practice track |
| `surebreed` (4224,4576) | no description | official 1.59: "temporarily removed **test track at Surebreed Steeples**" ← name+function confirmed by patch note |
| `sweetie` (3264,3680) | "Talk to your sweetie, pay the doctor for treatment, and **store trophies (at the risk of Sweetie selling them for spare cash). Sweetie stops selling items once cured.**" | matches Cheru @ 15:35 $300 trophies; adds the post-cure stop condition |
| `acres` (3360,3488) | "**Biohack residence.** Bring DNA here to unlock biohacking. Place a **16g RAM memory chip** to refine all future biohacking results." | chip capacity (16g) is their number only; horseygamemap's own "Normal Suburban House" hallucination is anchored to this coordinate |
| `biohackers` (3584,3616) | "Unofficial genetic research point providing illegal but powerful biological enhancement tech." | consistent with the "Biohacker" NPC in patch 1.5 |
| `hermit` (11392,3616) | "Wilderness cave, far east by the sea. The hermit has **fossils, hot sauce, and a story to tell**." | hot-sauce source list + fossil/treasure chain |
| `club` (160,7072) | "**Not built yet.** Located in the bottom-left corner. Fly over with a **hot air balloon** and **terraform water to land**." | strongest available lead on how the balloon is used: it is a *travel/terraforming* tool to reach the unfinished south-west club. `uncited-community` |
| `car lot` (3232,3872) | "Buy used cars… **none of them can hitch your trailer yet.**" | explains why the trailer is truck-fixed |
| `junk` (3296,3872) | "Resource points scattered around the map; collect basic building/crafting materials." | `ItemFenceBox`, `Fence*` art supports fence-building as a crafting loop |
| `zoo` (3168,3872) | "Collect and display rare creatures; learn about species evolution." | matches `LocZoo` + the Zoologist NPC on the CRISPR page |
| `ecologist` (5024,5024) | "View wild-population metrics, take conservation tasks for rewards. **A reference image of how horses should look is here.**" | matches the conservation tent UI (Eco* art) |
| `powerplant` (5664,3872) | "Provides power to the CRISPR lab. Surrounded by a field of **buried plutonium leaking radiation**." | matches 3 `buried` map objects |
| `home` (3040,3712) | "Rest, breed, test and keep horses; stack and keep any other gear or consumables there." | matches fandom's My House description |
| Herd spawners | `fest horse` count 50 r1 @ (2112,4224), count 20 r8 @ (3776,4864) & (4576,4864), count 10 r7 @ (2752,4032); `crazy horse` 20/·15/·0 r7 @ (4256,3360)/(6464,2528)/(7744,5664)/(5664,3840); `tiger` 9 r3 ×2; `giraffe` 40 r10; `alligator` 10 r3; `moose` 14 r4; `impala` 16 r5 | these come straight from the map file, not from prose |

## Guide pages summarised (route-level, all `uncited-community`)
- **Beginner walkthrough** — first-day route Home → Store → open-world herds → track/paddock → Bar → Glue Factory; warns "keep cash unspent; running out while all horses are tired is the classic beginner trap". Useful structural claims: **the truck+trailer is a movable holding area**, "keep food inside the same enclosure as the horses that need it", "**rest advances the age of horses at home and in the trailer**", "don't overbreed early", "**Old Abandoned Track is a testing location — use it before risking fees**".
- **Tools & terraforming** — hay/hay bales spread grass over time; digging removes grass, reveals items, creates holes that alter travel; apples become apple trees if uneaten; fencing converts water↔land to reach island routes; plutonium converts grassland to *irradiated* grassland and raises local mutation pressure; mountains/edge features can be dug away. Planning questions ("will my truck and trailer still pass? am I blocking an NPC route?") reflect real pathing needs.
- **CRISPR genetics route** — power-plant → lab → Normal Suburban House/biohacker + RAM chip; "save useful DNA before serious editing, because edits spread through breeding and released horses".
- **Sumo** — low CoG, forward pressure, wide stance, explosive short stride; "if it pushes but falls, breed lower/wider; if it survives but moves nobody, add propulsion".
- **Hot sauce / treasure map** — hot sauce sources listed as The Bar, The Circus, Hermit Cave; treasure map route via Hermit Cave + fossils + the north-east coastline (explicitly *not* a generic swamp hunt).

## Conflicts with better sources
1. `$100 sumo prize ladder` vs "sumo win → **rocket**" (MoreCaseOh via horseygame.net).
2. `hutch elder-horse storage ($100, stops aging)` vs `远方田野/Distant Field retirement ($100)` — same price, different location name; and horseygame.net's version says the retired horse's DNA can still be extracted while map-site's version says you can **reload the horse back into your trailer** (i.e. not permanent).
3. Their "Normal Suburban House" page vs `acres` being a biohack residence — same coordinate, two different invented identities.
4. Their "7 initial barns" at mabels vs the shipped `FarmHouse1…12` art set (12 variants, count not evidence of 7 barns).
5. Their breeding-simulator/genome-reference tools are their own re-implementations; horseygame.net's corrections log specifically warns that this family of tools (including their own mapper) is illustrative, not extracted from the executable.


## side-activities-circus-sumo-powerplant-digging-balloon-truck.md

# Side activities — circus, sumo, power plant, digging/fossils, balloon, truck, conservation

**Sources (fetched 2026-10-26):**
- Official patch notes (Steam News API) — see `steam-patch-notes-official.md`
- `https://github.com/woahhcrackers/HorseyGameWeb` `game/data/sprites.xml` + `horsey.tmx` (`verified` object list & art)
- `https://horseygame.com/guides/circus-challenges`, `/guides/sumo-wrestling`, `/guides/swamp-guide` (fan wiki; the *numbers* in them match nothing else, the *structure* is plausible — `single-source` at best)
- `https://horseygamemap.org/guides/horsey-game-sumo-guide`, `/guides/horsey-game-tools-terraforming-guide`, `/guides/how-to-unlock-normal-suburban-house`, `/guides/what-does-the-ram-bar-do-in-horsey-game`, `/locations/*` (see the big warning below)
- `https://horseygame.net/guides/horsey-game-horse-lifecycle`, `/guides/late-game-troubleshooting`, `/guides/hidden-secrets`
**Confidence: mixed per section, tagged inline.**

> **⚠ Fabrication alert — horseygamemap.org's *narrative* guides.** Its location pages list coordinates that match the shipped `horsey.tmx` exactly (so those pages are derived from real map data), but its tutorial pages contain invented content: a "Normal Suburban House" quest with **three hidden pressure pads** (green trash can / oak tree / dog house), a **"200 gold coins"** price, a **"Good Neighbor achievement"** (no such achievement exists in the 26-name roster) and a "neighbor alert → teleported to town square" mechanic. Worse, it places the "Normal Suburban House" at **X 3360, Y 3488**, which in the shipped map is the location typed **`acres`**. **Do not port anything from that page.** Its sumo/terraforming pages are generic-sounding and mostly unverifiable; use them only as hypothesis lists.

## 1. Circus (`circus` loc at 2464, 3520)
Four event types, each rewarded with a **ribbon** (shipped art: `ItemRibbon1`…`ItemRibbon4`, `Plinth`, `PrizeBox`, `GrandStand`):
| Event | Reported rule | Build advice | Evidence |
|---|---|---|---|
| **Diving / balloon-the-bucket** | small horse, low steady propulsion, light enough not to shatter on landing; land in the green bucket, don't touch the floor | compact body, centred balance | `single-source` (horseygame.com) |
| **Car pull** | pull a car uphill without stalling; matches the Steam achievement **"Strong — Pull a truck"** | large mount, low head set, long neck as counterbalance, heavy for traction | achievement name is `verified`; build advice `uncited-community` |
| **Trampoline** | reach a target height **four times** without erratic spins; achievement **"Trampoline — Perform on the trampoline"** | medium size, smooth symmetrical body, land on all four legs | achievement `verified`; count 4 `single-source` |
| **Acrobatics** | cross a yellow-green strip while an acrobat flails on your back without tipping backwards; achievement **"Acrobat — Do some acrobatics"** | forward weight bias, low CoG, momentum before the acrobat mounts | achievement `verified`; rest `single-source` |
- Factual anchors: official 1.26 "Horses will get tired when exiting the game in the middle of a **circus event**" → circus events are timed/ongoing and consume horse fatigue; horseygame.net lists "Freak Show — exists as a separate event ('enter them to a freak show'), entry mechanic and prize structure not shown". `pop.xml` has a **`freak`** population, and art includes `ItemClownNose`, `ItemStilts`, `ItemRollerblades`, `ItemSneakers`, `ItemSpikedBall`, `Deco*` accessories → the circus is the destination for freak/deco-built horses.
- Sumo + circus + a race on one horse is the public guess for the hidden **Diety** achievement (unconfirmed).

## 2. Sumo Ring (`sumo` loc at 3680, 4128)
- Art: `KO`, `KO2`, `SumoBelt`, `ChampRing`, `ChampRingHi`, `ChampRingSign`, `StakesIcon1-3` → bouts end in a KO state, there is a **traveling champion ring + sign**, and bets are placed with stake chips.
- Achievements: **Sumo** (win a bout) and **Sumo Belt** (win the belt) — two tiers, so there is a belt tournament.
- Rules reported (`uncited-community`): short bouts; you lose by being pushed out, tipping over, or failing to control the ring before time runs out; **winners replace the champion**, and unseated champions "regain full energy upon recapture"; difficulty escalates as you progress.
- Build target (`single-source`, horseygame.com): **≥1,000 lb**, forward weight bias, low centre of gravity, short legs, wide stance, rapid pushing stride, "about one third of the screen without tipping". Gene levers named: `GIANT_DWARF` at max (in `genes.xml`, `GIANT_DWARF` n=GACT → G=100, A=66, **C=133**, T=100, so 'C' really is the size-max allele), `GUT`/`DERRIERE` (helix 1) for mass distribution, leg-length/angle genes (helix 3/8) and `MUSCLE_USE`/`LEG_STRENGTH`.
- Official patches: 1.3 "Sumo 10% less janky"; 1.1 "Sumo gong has more dynamic range and better vibration simulation" (there is a **gong**), `SumoBelt` art.
- Reward reported on video: a **rocket** item, and "a rocket cannot be cloned in the simulator (not biological) but can be glued onto a horse" (MoreCaseOh @ 15:15, @ 19:35).

## 3. Power Plant (`powerplant` loc at 5664, 3872)
- Purpose: supplies electricity to the CRISPR Lab (老番茄 @ 7:45 lab has no power, @ 12:13 "reactivated by placing a horse that can run on a wheel").
- Mechanism: horse-sized **running wheels**; put an animal that can run inside; keep it running until the output meter fills; low/fast animals outperform tall horses that tip out. Art: `Lift`, `ItemLift`, `PowLift`, `PowRambar`, `PowStopwatch`, `PowStripe`, `Dis*` counterparts, `ItemJetEngine`, plus a dedicated full-screen background `powerplant.jpg` (328 KB) → the plant is a distinct interior scene with its own backdrop, i.e. it is entered via `EnterLocation`, not scrolled to.
- Hazards/quirks from official notes: patch 1.25 "Putting a **wheeled horse** in the powerplant was not working correctly"; 1.1111 "**Bowties** dropped in world would cause a crash when the powerplant was operational"; v1.1 "Add high-res **volt meter** graphics to powerplant".
- Plutonium: the plant area is "surrounded by a field of buried plutonium leaking radiation" (`horseygamemap.org`, and corroborated by three `buried` objects in `horsey.tmx` with values 40/47/15 → an amount-per-zone, at (3168,4000), (4480,4480), (9280,3264)). `ItemPlutonium(2)` art; plutonium feeding speeds creatures and grows hoof-feet (HeTheLyon @ 7:11/7:15); patch 1.3 "Plutonium now counts as food", "Plutonium dropped in an empty vat will no longer freeze the game"; grazing irradiated grass is reported to create mutated outliers used to rescue a damaged gene pool (`uncited-community`).
- Late-game consequence: mutated escapees breed with wild herds, so by in-game year ~500+ much of the wild horse population becomes non-race-viable (`uncited-community`, r/HorseyGame).

## 4. Digging, holes & fossils
- Tool: **shovel** ($95 after v1.1; $150 reported pre-patch/pre-fix), **silver shovel** = unlimited with a 2-second cooldown restored in 1.3 (`TinyGoldenShovel` art exists; 1.108 "Shovel exhibits less infinitude"). Art: `AnimShovel`, `AnimShovelSilver`, `Hole`, `HoleG`, `PointerDig`.
- 1.3 added: **"You can grab items with the silver lasso and drop them in holes to bury them and fill up the hole"** and **"Caves can be destroyed with the shovel"** → holes are entities with a fill state, caves are destructible terrain tiles.
- Fossil chain: dig up a fossil/bone (`ItemBones`) → **achievement Fossil** → scan the bone → **treasure map** (`treasuremap.png`) → dig at the marked spot → **$5,000** (`verified`: 林永季). Alternative reported use: bones revive extinct species in the DNA Lab (`uncited-community`).
- Reported terrain manipulation (`horseygamemap.org`, hypothesis-grade): hay/hay bales spread grass over time (matches the separate `veg.xml` 5-state spreading layer in the data); digging removes grass/creates travel hazards; uneaten apples become apple trees (`Apple`→`AppleTree` exist in both atlases); water↔land conversion by fencing/digging; terrain can make movement permanently worse. The **truck+trailer** is what gets damaged by potholes, per patch 1.3's "fill your world with junk and potholes. That's your business."

## 5. Hot air balloon (`ItemBalloon`, `InvBalloon`, `Balloon`, `BalloonShadow`)
- Achievement **Balloon — "Acquire a hot air balloon"**. No written acquisition guide exists anywhere reachable.
- The only concrete lead: Cheru's softlock — he could not get the balloon "because there's no freaking carnivores in the entire world because they all ate each other" ⇒ the balloon's requirement involves **living carnivores** in the conservation area (tiger/alligator/crocodile populations), i.e. probably a carnivore-sourced item or a carnivore-feeding task. Confidence: `single-source`, cause inferred from a complaint, not from a documented rule.
- horseygamemap.org mentions "hot air balloons" as a late-game map-travel tool (filler, no detail).

## 6. Truck & trailer
- Location: `truck` object at **(3104, 3744)**, i.e. parked directly next to `home` (3040, 3712) and the paddock (3136, 3712). Achievement **Truck — "Drive a sweet truck"**; achievement **Strong — "Pull a truck"** (so a truck can be *pulled by* a horse, and something must be strong enough to pull it).
- Art: `Truck`, `TruckTires`, `TruckTires2`, `TruckRam`, `TruckStripe`, `ChevyStar` (a truck model name), `Trailer`, `TrailerB`, `TrailerB2`, `TrailerO` (open), `TrailerT`, `TrailerW`, `DriveDest`, `animal_car1/carsmart1.wav` (cars are *alive* — they have animal sounds and a `car` gene population).
- Trailer = mobile inventory/holding pen; regular lasso auto-yanks a captured horse **into your trailer**, silver lasso does not (you must drag it); patch 1.3002 "Horses will accidentally escape the trailer less often"; v1.1 "Unusual horses do a better job of locating the floor while in the trailer"; 1.1111 "You can no longer accidentally drop the thing in the thing".
- Beer-sleep exploit (`uncited-community`): 3 beers → horse falls asleep **on the trailer** → drive out and back → it wakes rested.
- Horn (`InvTrumpet`, art `Trumpet`) pushes horses away from the vehicle — used for herding and clearing blocked roads.

## 7. Conservation / Ecologist tent (`ecologist` loc at 5024, 5024)
See `horseygame-net-achievements-and-softlocks.md` — population 400, genetic division 50%, genetic diversity 43%, green/red/orange diet legend, sim-speed and zoom controls in the UI, carnivore-extinction softlock.

## 8. Other map locations with no written coverage
From the shipped `Locs` layer: `zoo` (3168,3872), `junk` (3296,3872), `hutch` (3488,4064), `circled` (3040,4512), `surebreed` (4224,4576 — Surebreed Steeples, had a test track removed in 1.59), `abandoned` (4224,4032 — Old Abandoned Track, "tested for several minutes" at ship time; official 1.3 "Abandoned track crash fix"; a community multiplayer mod races there), `club` (160,7072), `paradise` (8096,4896), `hermit` (11392,3616 — the hermit cave + treasure-map route per horseygame.net), `vial world` (576,800), `mabels` (3264,4800). No reachable source describes the club, hutch, circled, junk or vial-world interiors.

## Conflicts
1. **horseygamemap.org's quest content** is demonstrably invented (see the alert box) even though its coordinates are real. Everything else on that site is `uncited-community` at best.
2. **Sumo weight target (1,000 lb)** comes only from horseygame.com; nothing in official notes or data states a threshold, and the glue scale's 0–3000 lb range means 1,000 lb is plausible but unproven. Patch 1.1111 "Tweaked horse mass calculation" implies mass values shifted between versions.
3. **Circus event list** differs across sources: horseygame.com says diving board/car pull/trampoline/acrobatics; horseygame.net mentions a separate **"Freak Show"**; the blog mentions "stunts". Art supports `ItemBallAndChain`, `ItemStilts`, `ItemClownNose`, ribbons, `Plinth`.
4. **Balloon requirement** is inferred from a single complaint, and horseygamemap.org implies it is simply a placeable travel tool. Unresolved.
