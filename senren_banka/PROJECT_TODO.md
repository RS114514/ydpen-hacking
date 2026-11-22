# 《千恋＊万花》移植项目协同推进清单 (PROJECT_TODO.md)

## 一、项目整体架构与协同分工
- **工作区路径**：`/Users/fuzihao/.gemini/antigravity/scratch/ydpen/senren_banka/`
- **目标设备**：有道词典笔 X6 Pro（RK3562 / 物理 960×266 / 应用逻辑 800×220 / AppID `8002026102400099`）
- **分工矩阵（最新调整）**：
  - **主线与系统引擎**：共通线 9155 句剧本、7 位核心角色立绘差分、底层跳转、音频与构建。
  - **后日谈、流程图 UI 与资源**：6 位女主角后日谈、流程图、选择支 UI、5595 音频与 15 张绘马部署。
  - **当前范围说明**：六条本篇个人线已接入（合计 55726 句），可玩范围为六条个人线 + 共通线 + 6 部后日谈。

---

## 二、功能特性待办清单 (TODO List)

### 模块 1：共通线、个人线与立绘联动
- [x] 提取官方 1~3 章完整剧本数据（`chapter_all.js`，共 9155 句台词，4178 句原声语音）
- [x] 在 `GameView` 中解除原本硬编码的测试剧本，支持动态加载全量剧本数组
- [x] 实现全角色立绘多级容错解析算法（日文名/中文名双向索引、表情自动回退默认 01、服装回退默认私服）
- [x] 确保主线中玄十郎、茉子、蕾娜、丛雨、小春、芳乃、芦花 7 位核心角色按原版台词正常亮相与表情变换
- [x] 适配配角（廉太郎、美津叶、安晴、心子、比奈实）的舞台显示处理，保持界面纯净无报错
- [x] 推进主线多角色出场节点，进行真机截屏与语音播放验证（芦花/小春/玄十郎/丛雨/芳乃/茉子/蕾娜 7 大角色全部截屏验证通过）
- [x] 修复跨场景读档：恢复 `data.scenario`、选择记录与旗标，支持后日谈与主线换线
- [x] 实现临时 Voice Ducking：语音时释放声卡，播完恢复
- [x] 实现 9 处真实剧情选择支：选项弹层、单次选择、目标行跳转、禁用未收录分支
- [x] 自动播放：有语音等待 EOS，无语音等待 5 秒
- [x] 接入六条本篇个人线，按原版旗标判定：`len==2`、`yos==2`、`mak==2`、`mur==2`、`sub==2 && 任意线路已通关`
- [x] 还原支线 507“小春/芦花”选择与 509 旗标分流
- [x] 线路通关写入 `clearedRoutes`；跨线路存档保留旗标与选择
- [x] 原生 `appsrc/appsink` 软件 PCM 混音库已编译、安装并真机验证 BGM 管线（声卡 RUNNING、单 PCM 句柄、无 bus error）
- [x] 真实语音 + BGM 文件解码/混音冒烟验证（非零 PCM，appsrc→alsasink 静音 RUNNING）
- [ ] 语音与 BGM 并发听感确认（按用户静音约束未外放，待用户清醒后试听）

### 模块 2：分支流程图系统 UI 与交互（移交给 AI 助手 B 负责）
- [x] 解析官方分支树拓扑数据，生成 `flowchart_data.js`（包含 204 个剧情节点、9 个关键选择支）
- [x] 将知乎 15 张 16:9 和风绘马图部署至设备端 `/userdisk/SenrenBanka/bg/ema/` 并打通 `jumpFromFlowchart(targetLine)`
- [x] 按照知乎文章中的流程树与 6 位女主角分支走向，完善流程图 UI 的排版、和风视觉风格与滑动交互（104 章节测试通过）
- [x] 验证从流程图节点点击跳转主线剧情游玩各章节（外部试玩确认可进入第107句）
- [x] 修复个人线节点 scenario/targetLine 映射：芳乃 3-8、レナ 3-6 真机显示“第 0 句”，レナ不再误跳共通线 8212
- [ ] 新版本真机回归路线切换、上下章和二维拖动（本轮已验证路线切换与个人线标签，完整回归待补）

### 模块 3：六位女主角后日谈系统（AI 助手 B 负责）
- [x] 提取官方 6 部独立后日谈剧本数据（`after_yoshino.js`, `after_mako.js`, `after_murasame.js`, `after_rena.js`, `after_koharu.js`, `after_roka.js`）
- [x] 在 `AfterstoryView` 中实现 6 位女主角选择卡片横向平滑滑动与真实台词/语音展示
- [x] 点击角色卡片播放专属系统播报语音（`yoshino_after.ogg`, `mako_after.ogg` 等）
- [x] 实现“进入后日谈物语”交互，使游戏引擎能加载对应的后日谈剧本独立游玩
- [x] 支持后日谈物语中的台词推进、立绘表情切换、自动播放、存档读档与退出返回后日谈界面（外部真机测试通过）

### 模块 4：音画多媒体资源筛选与设备部署（AI 助手 B 负责）
- [x] 验证设备端立绘资源（1274 个 PNG）与后日谈播报语音文件存在性
- [x] 编写批量同步脚本，提取主线（4178 个）与后日谈（1411 个）实际引用的全部 `.ogg` 语音文件清单
- [x] 从外置硬盘传输缺失的语音至设备端 `/userdisk/SenrenBanka/voice/`（设备端校验 5595/5595 全量匹配通过）
- [x] 整理 `tools/zhihu_images/` 中的和风绘马图，按规范推送至设备端 `/userdisk/SenrenBanka/bg/ema/`（15 张本地与设备 MD5 全部一致）
- [x] 输出资源同步统计报告与设备端文件完整度校验（外置盘 `/Volumes/500GB/qoder_cache/senren_banka/voice_sync_report.json`，5595/5595）

### 模块 5：系统集成构建与真机验证（双方协同）
- [x] 更新 `build.py` 打包管线，加入所有新剧本模块的 `jsfmc` 编译与路径映射
- [x] 执行全量打包安装 `PEN_SERIAL=192.168.31.30:5555 python3 build.py --install`（2026-10-26 包 2179.8KB，install/start ret=0）
- [x] 修复 BGM/语音并发并再次构建推送（原生软件 PCM 混音库已安装）
- [ ] 新版本主菜单 -> 流程图 -> 路线切换 -> 选项 -> 角色出场完整回归（路线切换/个人线标签已真机验证）
- [ ] 六条个人线语音同步（设备当前仅覆盖共通/后日谈范围；守护脚本待推送）
- [ ] 新版本主菜单 -> 后日谈 -> 女主选择 -> 物语游玩 -> 返回卡片页完整回归
- [ ] 语音+BGM 并发听感确认（用户清醒后）

### 2026-10-25 23:16 夜间追加
- [x] 剧情内 CG：转码器提取原版 `ev` 事件层为第 9 列 `cg`，game.js 渲染 `/userdisk/SenrenBanka/cg/<cg>.png`；92 个剧本已用完整版重转，行数保持 9155/9790/9109/10990/9438/5277/1967
- [x] 立绘耳/口差分映射 `_NNh`，缺失服装回退 `私服`，新增渲染回归测试
- [x] 全部 Node/Python 测试通过；新包 `dist/senren_banka-1.0.0.amr` 2213.3 KB（暂未安装，避免打断外部试玩）
- [ ] 修复后的新包安装到真机（01:00 定时任务处理）
- [ ] 个人线语音 19271 个：ADB 中途掉线，分块守护脚本 `push_assets_watch.sh` 等待设备重连后自动推送
- [ ] 背景 97 张、SE 768 个已打包，随守护脚本推送
- [ ] 全量 pimg CG 转 PNG（后台进行中，预计覆盖更多 CG 事件）

### 2026-10-26 01:30 外部试玩报告 P0/P1 修复（本轮）
- 报告：`/Volumes/500GB/Ydpen/试玩报告/千恋万花_外部试玩报告_20261025.md`
- [x] **P0 音频根因**：固件 `/usr/lib/gstreamer-1.0/` 无 `audiomixer`/`adder`，旧原生库无法建立混音图；ALSA dmix 亦不可用。
- [x] **P0 修复**：`native/gal_gs.c` 重写为每声部 `filesrc→decodebin→audioconvert→audioresample→capsfilter→appsink`，C mixer 线程每 20ms 软件混音，经唯一 `appsrc→queue→audioconvert→audioresample→alsasink` 输出；保留 ducking、循环、空闲释放、`status()` 契约。
- [x] **P0 真机验证**：BGM 管线声卡 `RUNNING`、单 `/dev/snd/pcmC1D0p` 句柄；日志 `output pipeline ready (appsrc/appsink software mixer)`、`branch 0 started ... BGM01.opus`，无 bus error；真实语音+BGM 冒烟混音为非零 PCM。
- [x] **P1 修复**：`flowchart.js` 新增 `FC_ROUTE_SCENARIO` / `FC_CHAPTER_START` / `FC_SPECIAL_TARGETS` 与 `fcNodeTarget(node)`；`jumpFromFlowchart(scenario, line)`；レナ CHAPTER 3-6 修正为 `route_rena` 第 0 句；サブ线按 storage 前缀分流小春/芦花，保留 2727/3177/509 分支旗标与跳过上下文。
- [x] **P1 真机验证**：芳乃 `CHAPTER 3-8`、レナ `CHAPTER 3-6` 均显示“第 0 句”，不再“仅详情·禁跳”或误跳共通线 8212。
- [x] **测试**：全部 `tools/test_*.mjs` 与 `tools/test_*.py` 通过；`test_flowchart.mjs` 11/11，新增章节起始表 vs 剧本逐行统计校验。
- [x] **构建安装**：`dist/senren_banka-1.0.0.amr` 2179.8 KB；`install`/`start` 均 `ret=0`。
- [x] **约束执行**：验证时临时 `settings.json` 的 `bgmVolume=0`（全程静音），结束后恢复原始文件（MD5 `c1f1fe71425b0d9f56c8d24d53e8c48b`），退出应用，声卡 `closed`。
- [ ] **待确认**：语音+BGM 实际听感；六条个人线完整 UI 回归（选项/通关解锁）；外部试玩复测。

### 2026-10-26 10:00 第二轮试玩报告处理
- 报告：`/Volumes/500GB/Ydpen/试玩报告/千恋万花_第二轮试玩报告_20261026.md`
- [x] **P0 音频**：真机声卡 `RUNNING`、仅单 `pcmC1D0p` 句柄、`duck-mix` 日志正确、无 bus error/EBUSY，报告判定通过。
- [x] **P1 流程图**：六线节点均显示可跳行号；芳乃/茉子/丛雨/蕾娜均进入各自 `route_*` 第 0 句；レナ 3-6 不再误跳共通线 8212。
- [x] **剧情 CG 实测**：芳乃 34 句 `ev701a`、茉子 46 句 `ev201a` 均完整 16:9、无拉伸、无立绘叠加；CG 结束恢复背景。
- [x] **P2 误触修复**：底部「轻触特写 / 历史对话」点击增加 350ms 时间戳拦截，不再冒泡触发台词推进；移除重复的子 `text` 点击处理器；新增 `test_route_branch.mjs` 契约测试。
- [x] **CG 等比保护**：CG 舞台图、特写图、鉴赏全屏/卡片图统一加 `resize: contain`，避免容器比例异常时拉伸。
- [x] **背景黑屏修复**：源库 `bg/*.png` 实际是 WebP 改后缀且为 1920×1080；已全部用 `sips -s format png -z 540 960` 转真 PNG、权限 644、NFC 文件名并推送，90/90 剧情引用全覆盖。
- [x] **资源审计**：语音 26,278/26,278、背景 90/90、CG 59/59（设备 72 张）；仅 `yas104_038.ogg` 源缺失。
- [x] **回归**：全部 `tools/test_*.mjs` / `tools/test_*.py` 通过（含新增误触测试）。
- [ ] **安装**：笔被用户带走，10:00 的代码尚未构建/安装；`dist` 仍是 01:28 包，待笔返回后 `build.py --install`。
- [ ] **サブ线 2727/3177**：报告因 Wi-Fi 睡眠断开未测；待下次真机补测。
- [ ] **CG 主观反馈**：报告实测两处 CG 正常；若用户仍看到某张 CG 比例异常，需要具体句号/CG id/截图定位。


### 2026-10-26 23:06 全剧情/选择支审计与修复
- [x] **文本完整性**：92 个源 JSON = 55,726 行，逐行 1:1；缺行 0、多余 0、语音字段 0 错位。
- [x] **分支矩阵**：8435 `len==2`、9104 `yos==2`/`mak==2`、9139 `mur==2`/`sub==2 + 已通关` 与原版 `nexts` 完全一致；NORMAL END 为 9140–9154。
- [x] **39 处 selects**：其中 6 处为 0 文本/同目标内部重复场景（跳过），33 处真实路线选择全部接入；新增 `app/data/choices_all.js`（main 8 + route 33 + after 10）。
- [x] **共通 8 选择 + 507**：所有选项增加 `skipAfterLine/skipToLine`，选完自动跳到合流点；嵌套 010 用跳过栈；旗标幂等。
- [x] **小春线 508b**：508a 结束改跳 3133，避免 208 行芦花剧情串入。
- [x] **NORMAL END**：新增 END 卡 + 返回标题，不再停在暂停菜单。
- [x] **流程图元数据**：5 个节点行号修正；`branches` 的 `yos/sub` 改为 `==2`。
- [x] **测试**：全部 Node/Python 回归通过（含路线选择、嵌套跳过、508b、NORMAL END、choices_all 范围）。
- [x] **音频电音**：整块跳过 + 固定 sleep 漂移已修，原生库已交叉编译（28,024 B）。
- [ ] **构建/安装**：笔不在，`choices_all` 与新原生库未打包；待笔返回后 `build.py --install`。
- [ ] **CG/SD 全量**：Agent A 约 23:45 开始；等 `cg_ext_manifest.json`。
- [ ] **转场/特效**：FX 盘点子代理仍在运行。

### 2026-10-26 23:45 SD/二头身 + 转场特效 + 音频代码收尾
- [x] **SD/二头身**：359 张源图 → 944×566 RGBA 真 PNG；数据第 10 列 `sd`（296 唯一图、2,867 行）；`game.js` 舞台 SD 图层；`sd_device.tar` 295 个（`sd203ic` 源缺失）。
- [x] **FX**：`fx_events.js`（108 KB，按 scenario+行号，13 场景）；运行时 F/f/W/S/T/O/M/G：黑幕转场、白闪、震动、`ef_*`/cutin 叠加、场景默认淡入；`fx_assets.tar` 8.2 MB。
- [x] **after 数据格式修复**：10 列（chapter/cg/sd 对齐），after 的 CG/SD 不再错位。
- [x] **全量测试**：Node/Python 全部通过（新增 fx/SD/选择/嵌套跳过/普通 END）。
- [x] **音频**：整块丢声部 + 20ms 固定 sleep 漂移已修；`libjsapi_gal.so` 已编译（28,024 B）。
- [ ] **安装**：笔不在，新数据/代码/原生库未构建安装。
- [ ] **怪物立绘**：`祟り神`/`白狛` 仍只有 stinger，立绘资产待转换。
- [ ] **全屏 CG**：Agent A 23:45 起处理；内部 SD 已完成，不再重复。

### 2026-10-27 00:12 Agent A 全屏 CG 合入
- [x] 101 张全屏 CG 转 944×532 PNG、manifest、56 MB 包。
- [x] `cg_available.txt` 71 → 113；全量重转；CG 行数大幅增加，行数保持不变。
- [x] 全部测试通过。
- [ ] 设备推送：cg_ext.tar / sd_device.tar / fx_assets.tar（笔不在）。
- [ ] 构建安装 + 真机视觉验证（含转场/震动/白闪/SD/CG）。
- [ ] 祟り神/白狛 立绘合成（当前只有 stinger）。
- [x] `祟り神` 立绘从 TLG/WebP 转出并接入 M stinger；`白狛` 纹理缺失，仅 stinger。
- [ ] 白狛立绘（`.stand` raw 解包失败，源库无 TLG）待补。
- [x] 鉴赏页 CG 改为 7 组女主/共通选择 + 每页 10 张网格 + 组内全屏翻页；101 张全量数据 `gallery_cgs.js`。
- [x] 全部测试通过（gallery 7 项）。
