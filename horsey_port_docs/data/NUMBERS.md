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
