# 《千恋＊万花》词典笔移植项目 —— Agent 接力开发指南 (AGENTS.md)

本文件为后续接棒的 AI Agent（Codex / DeepSeek / Antigravity 等）提供完整的上下文、已交付成果、当前任务、后续任务与测试命令指南。

---

## 零、运行环境与核心架构

- **目标硬件**：网易有道词典笔 X6 Pro
- **系统架构**：Rockchip RK3562（4核 A53 / Mali-G52 GPU / aarch64 Linux 5.10 / Weston Wayland）
- **屏幕规格**：
  - 物理屏幕：**960 × 266**
  - 应用逻辑坐标：**800 × 220**（Weston 合成器放大 1.2 倍）
- **应用信息**：
  - AppID：`8002026102400099`
  - 运行框架：Falcon / JQuick（Weex 语法规范 + Vue 2.6.12 + QuickJS 字节码）
- **重要路径**：
  - 宿主机工程根目录：`/Users/fuzihao/.gemini/antigravity/scratch/ydpen/senren_banka/`
  - 500GB 外部资源库：`/Volumes/500GB/千恋万花_移植资源库/assets_ready/`
  - 设备端多媒体存储：
    - 语音目录：`/userdisk/SenrenBanka/voice/`（共 5595 个 `.ogg`）
    - 背景目录：`/userdisk/SenrenBanka/bg/`（48 张 960×540 高清 PNG + 15 张绘马）
    - 立绘目录：`/userdisk/SenrenBanka/fg/`（1274 张 780×440 2x高清 PNG）
    - 存档目录：`/userdisk/gal_data/senren_banka_saves.json` 与 `/userdisk/SenrenBanka/saves.json`
- **协作看板文件**：
  - 协同通信流水：[`AGENT_COMM.md`](file:///Users/fuzihao/.gemini/antigravity/scratch/ydpen/senren_banka/AGENT_COMM.md)
  - 任务进度总表：[`PROJECT_TODO.md`](file:///Users/fuzihao/.gemini/antigravity/scratch/ydpen/senren_banka/PROJECT_TODO.md)

---

## 一、你在做的工作（当前正在处理的问题）

1. **解决角色台词无语音发声问题**：
   - **根本原因**：词典笔系统 `/etc/asound.conf` 未启用 ALSA dmix 混音器。标题界面和主线剧情播放 BGM 时，BGM GStreamer 管道独占了硬件声卡 `/dev/snd/pcmC1D0p`。当台词触发 `G.playVoice()` 时，GStreamer 内部报错 `Device 'default' is busy. Could not open audio device for playback`，导致所有语音无法发声。
   - **解决方案**：在 `app/pages/game/game.js` 的 `applyCurrentLine` 和 `replayVoice` 中实现了语音避让机制（Voice Ducking）。当台词有语音时，先调用 `G.stopBgm()` 释放声卡句柄，再启动语音播放；同时启动 `startVoiceWatcher()`，通过 `G.status()` 监听语音播放结束（EOS）后自动恢复播放章节 BGM。
2. **解决游玩界面画质发糊问题**：
   - **根本原因**：此前设备端背景和立绘文件多为 390×220 的低分辨率缩略图，在 960×266 物理屏及舞台特写放大（1.5x/2.0x/2.5x）下拉伸产生双线性插值模糊。
   - **解决方案**：
     - 背景图：从 500GB 硬盘的 2220×1280 原画中提取 48 张主线背景，通过 CoreGraphics 高抗锯齿重采样生成 960×540（16:9 标准高清无损）并已推送到设备端；
     - 立绘：通过 Swift 多核合成引擎，将 1274 张立绘差分从 390×220 画布升级为 780×440（Retina 2x 高清舞台），也已全部推送到设备端。
3. **跨剧本读档契约对齐**：
   - 在 `game.js` 的 `executeLoadFromSlot` 中补齐了 `this.currentScenario = data.scenario || 'main'`，与 `storage.js` 中的持久化完全闭合，避免跨后日谈与主线读档串剧本。

---

## 二、你做完的工作（已完成且验证的成果）

1. **官方全量剧本与章节接入**：
   - 完成主线 17 个官方章节（`chapter_all.js`，共 9155 句台词，4178 句语音）接入 `GameView`；
   - 顶部进度条自适应显示为 `X / 9155`，底部精准展示官方章节编号（`CHAPTER 1-1` 至 `CHAPTER 3-7`）。
2. **7 大核心角色立绘差分与真机验证**：
   - 实现了全角色多级容错立绘解析算法（日文名/中文名双向索引、表情自动回退 01、服装回退默认私服）；
   - **7 位角色全部在真机剧情中登场并获得截屏验证**：芦花（第 47 句）、小春（第 302 句）、玄十郎（第 388 句）、丛雨（第 587 句）、芳乃（第 744 句）、茉子（第 1063 句）、蕾娜（第 3495 句）；立绘差分命中率达到 100.00%（7470 处出场无遗漏）。
3. **舞台特写人物压扁形变彻底修复**：
   - 修复了此前在特写放大模式下，立绘被错误指定固定宽度导致人物被压扁变窄的问题；
   - 将特写立绘图层与背景图层的尺寸（`z.w`, `z.h`）和位移（`gImgLeft`, `gImgTop`）完全同步绑定，经真机 1.0x 与 1.5x 实测，人物比例完全舒展匀称。
4. **后日谈与流程图数据准备**：
   - 提取了官方 6 部独立后日谈剧本（芳乃、茉子、丛雨、蕾娜、小春、芦花）存放在 `app/data/after_*.js`；
   - 解析官方流程图分支拓扑生成 `flowchart_data.js`（包含 204 个剧情节点、9 个关键选择支）；
   - 部署了 15 张 16:9 和风绘马插图到 `/userdisk/SenrenBanka/bg/ema/`。
5. **副 Agent 的协同交付**：
   - 编写 `tools/sync_scenario_voices.py` 完成设备端 5595 个全量语音同步校验；
   - 完成主菜单“系统设置”（BGM 开关与音量持久化）和“退出游戏”（`$page.finish()`）；
   - 完成后日谈 6 角色真实台词/语音展示卡片；
   - 完成流程图 104 章节契约测试。

---

## 三、你接下来要做的工作（接棒 Agent 的待办任务）

1. **联合构建与全流程回归打包**：
   - 运行 `python3 build.py --install`，将包含最新避让逻辑的 `game.js`、更新后的 `title.js`、`afterstory.js`、`flowchart.js` 统一编译打包并安装至词典笔。
2. **真机验证语音避让与恢复效果**：
   - 点击主菜单“继续游戏”（或读取第 52 句芦花存档），确认角色台词 `rok001_005.ogg` 能否正常清脆发声；
   - 确认语音播放期间 BGM 是否正常避让，语音播完后 BGM 是否自动恢复播放；
   - 点击界面右侧“重播语音”，验证重播流程是否发声正常。
3. **真机截屏验证高清画质与放大效果**：
   - 截屏检查左侧舞台区（390×220）下的 960×540 高清背景与 780×440 高清立绘，确认边缘平滑锐利；
   - 点击左侧舞台进入放大看图特写模式，缩放至 1.5x / 2.0x，截屏验证放大后画面依然清晰无锯齿。
4. **验证流程图与后日谈真机跳转**：
   - 从主菜单进入“流程图”，点击任意章节节点，验证调用 `jumpFromFlowchart(targetLine)` 是否能无缝载入主线对应台词游玩；
   - 从主菜单进入“后日谈”，选择一位女主角进入物语，验证后日谈剧本推进、表情变换、读档与退出返回后日谈界面的完整链路。

---

## 四、测试的方法与操作命令指南

### 1. 编译、打包与真机安装
在宿主机工程根目录下执行：
```bash
export PATH="/opt/homebrew/bin:$PATH"
python3 build.py --install
```
> 注：该命令会自动校验 CSS 尺寸（严格 <= 800x220）、通过词典笔上的 `jsfmc` 将 JS 源码编译为 QuickJS 字节码 `.js.bin`，组装 `.amr` 并通过 ADB 安装启动应用。

### 2. 真机截图与查看
词典笔截屏必须使用 `miniapp_cli capture`（严禁使用 screencap，screencap 在 Wayland 下只有黑屏）：
```bash
export PATH="/opt/homebrew/bin:$PATH"
adb shell "miniapp_cli capture /tmp/shot_verify.png"
adb pull /tmp/shot_verify.png ./shot_verify.png
```

### 3. 查看应用与声卡运行状态
- 查看 miniapp 进程与打开的声卡文件描述符：
  ```bash
  adb shell "ls -l /proc/\$(pidof miniapp)/fd | grep /dev/snd"
  ```
- 检查声卡硬件播放测试（在 miniapp 停止时独立验证音频）：
  ```bash
  adb shell "gst-launch-1.0 filesrc location=\"/userdisk/SenrenBanka/voice/uts001_001.ogg\" ! decodebin ! audioconvert ! audioresample ! alsasink"
  ```

### 4. 离线逻辑单元测试
运行已有测试套件验证数据与状态逻辑：
```bash
node tools/test_storage_scenario.mjs   # 测试存档与读档 scenario 字段持久化
node tools/test_flowchart.mjs          # 测试流程图 104 章节与分支遍历
node tools/test_afterstory.mjs         # 测试后日谈选择卡片与数据绑定
node tools/test_title.mjs              # 测试主菜单 BGM 开关与音量持久化
```

### 5. 模拟屏幕点击（如果需要）
设备触摸屏驱动为 `/dev/input/event1`（`fts_ts`）。设备上有预置的 tap 工具：
```bash
adb shell "/tmp/tap /dev/input/event1 <x> <y>"
```
> 注：亦可直接读取或写入 `/userdisk/gal_data/senren_banka_saves.json` 设置 `latest` 槽位，并在启动时点击“继续游戏”。
