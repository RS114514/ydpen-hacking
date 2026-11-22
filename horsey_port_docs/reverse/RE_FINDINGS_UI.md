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
