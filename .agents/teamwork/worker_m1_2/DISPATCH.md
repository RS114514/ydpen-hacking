# Dispatch: worker_m1_2

## 任务目标
执行 Milestone 1 的代码与配置实施：构建与安装脚本动态库隔离修复、残留架构清理、正版官方高清 Lambda 图标提取部署，以及本地构建打包与验证。

## 🔒 独占写权限文件
Worker 对以下文件享有独占写权限（禁止修改权限外的其他源码文件）：
- `/Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py`
- `/Volumes/500GB/Ydpen/halflife_app/tools/install_amr.py`
- `/Volumes/500GB/Ydpen/halflife_app/src/pages/index`（清理空目录）
- `/Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png`
- 构建产物目录 `build/` 与 `dist/`（重新打包输出）

## 必读输入文档
- 原始用户需求：`/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md`
- M1 范围规约：`/Volumes/500GB/Ydpen/.agents/teamwork/orch_m1/SCOPE.md`
- Explorer 1 交接报告：`/Volumes/500GB/Ydpen/.agents/teamwork/explorer_m1_1/handoff.md`（构建打包与安装隔离方案）
- Explorer 2 交接报告：`/Volumes/500GB/Ydpen/.agents/teamwork/explorer_m1_2/handoff.md`（Falcon 原生直启与生命周期清理）
- Explorer 3 交接报告：`/Volumes/500GB/Ydpen/.agents/teamwork/explorer_m1_3/handoff.md`（Steam 官方正版 512x512 Lambda 图标提取方案）

## 强制诚信警告 (MANDATORY INTEGRITY WARNING)
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 实施要求与步骤
1. **修改 `tools/build_amr.py`**：
   - 目标设备统一配置为 `-s 9DA2200007506350`。
   - 移除 `BINS_DIR` 内部的 `libwl_center.so` 拷贝。
   - 移除 `pack_amr.py` 参数中的 `--lib arm64={wl_so}` 与 `--lib arm64-orange={wl_so}`。
   - 改造包内动态库校验：断言 `libs/arm64/libjsapi_hl.so` 与 `libs/arm64-orange/libjsapi_hl.so` 存在且内容正确；显式断言包内绝对不包含 `libwl_center.so`，且 `libs/` 目录不含任何非预期文件。
2. **修改 `tools/install_amr.py`**：
   - 所有 ADB 命令统一显式指定 `-s 9DA2200007506350`。
   - 移除包内对 `libwl_center.so` 的检查，增加包内不得包含 `libwl_center.so` 的防御性断言。
   - 检查本地 `halflife_app/libs/libwl_center.so` 存在，并使用 `adb -s 9DA2200007506350 push` 推送至 `/userdisk/halflife/libwl_center.so`。
   - 安装前清理设备端历史解包残留（如 `/userdisk/miniapp/data/mini_app/pkg/8002026110400001`）。
3. **架构与残留目录清理**：
   - 彻底删除残留空目录 `/Volumes/500GB/Ydpen/halflife_app/src/pages/index`。
   - 清理 `src/` 目录下 macOS 生成的 `._*` 隐藏元数据。
4. **提取部署官方高清 Lambda 图标**：
   - 从 Steam 正版源文件 `/Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns` 提取 512x512 RGBA PNG：
     `sips -s format png "/Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns" --out /Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png`
   - 使用 `sips -g pixelWidth -g pixelHeight /Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png` 检验为 512x512 RGBA。
5. **构建打包与独立验证**：
   - 运行 `python3 /Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py`。
   - 检验 `unzip -l /Volumes/500GB/Ydpen/halflife_app/dist/half-life-1.0.0.amr | grep "libs/"` 确认仅有 `libjsapi_hl.so`。
   - 检验 `unzip -p /Volumes/500GB/Ydpen/halflife_app/dist/half-life-1.0.0.amr app_icon.png | file -` 确认图标有效。
   - 运行前端单元测试 `node --test /Volumes/500GB/Ydpen/halflife_app/tools/test_lifecycle.mjs`。
   - 运行 `python3 /Volumes/500GB/Ydpen/halflife_app/tools/install_amr.py`（若设备在线），验证真机安装与推送。
6. **输出成果**：
   在 `/Volumes/500GB/Ydpen/.agents/teamwork/worker_m1_2/handoff.md` 输出规范的交接报告（Observation, Logic Chain, Caveats, Conclusion, Verification Method），并包含完整的测试与命令执行结果。完成后通过 `send_message` 通知编排器。


## 2026-11-12T19:31:28Z
Sender: a13e7502-fdc7-4bd2-8a07-22f1b4ea562d
Content:
请阅读任务分派文件 /Volumes/500GB/Ydpen/.agents/teamwork/worker_m1_2/DISPATCH.md。
你的工作目录：/Volumes/500GB/Ydpen/halflife_app
你的状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/worker_m1_2

【必读输入】
- 原始用户需求：/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md
- M1 范围规约：/Volumes/500GB/Ydpen/.agents/teamwork/orch_m1/SCOPE.md
- 3 份前期勘查交接报告：
  - /Volumes/500GB/Ydpen/.agents/teamwork/explorer_m1_1/handoff.md
  - /Volumes/500GB/Ydpen/.agents/teamwork/explorer_m1_2/handoff.md
  - /Volumes/500GB/Ydpen/.agents/teamwork/explorer_m1_3/handoff.md

【独占写权限】
你对以下文件享有独占写权限：
- /Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py
- /Volumes/500GB/Ydpen/halflife_app/tools/install_amr.py
- /Volumes/500GB/Ydpen/halflife_app/src/pages/index （删除该空目录）
- /Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png
- 构建产物 build/ 与 dist/

【强制诚信警告】
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

【核心实施工作】
1. 修复 tools/build_amr.py：绑定设备 9DA2200007506350；剔除 libwl_center.so 的拷贝与 pack_amr.py --lib 传入；更新校验逻辑，确保 AMR 内 libs/ 仅保留 libjsapi_hl.so，且断言绝对不含 libwl_center.so。
2. 修复 tools/install_amr.py：所有 ADB 命令显式加 -s 9DA2200007506350；移除对包内 libwl_center.so 的校验；添加向设备 /userdisk/halflife/libwl_center.so 推送本地 libs/libwl_center.so 的逻辑；安装前清理残留目录。
3. 删除空目录 src/pages/index，清理 src/._* 隐藏元数据。
4. 从 /Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns 提取 512x512 RGBA PNG 并部署至 assets/app_icon.png。
5. 运行 python3 tools/build_amr.py 构建，解包校验动态库和图标规格，运行 node --test tools/test_lifecycle.mjs，运行 python3 tools/install_amr.py 真机验证。
6. 将完整工作与测试验证记录输出至 /Volumes/500GB/Ydpen/.agents/teamwork/worker_m1_2/handoff.md，完成后使用 send_message 通知编排器。


## 2026-11-12T19:55:04Z
Sender: a13e7502-fdc7-4bd2-8a07-22f1b4ea562d
Content:
**Context**: Milestone 1 实施进度同步
**Content**: 编排器正在进行例行心跳检查。请更新你的 progress.md，并汇报当前修改进度与预计完成时间。
**Action**: 请在完成当前步骤后汇报状态，并在全部验证完成后交付 handoff.md。


## 2026-11-12T21:05:40Z
Sender: a13e7502-fdc7-4bd2-8a07-22f1b4ea562d
Content:
**Context**: 服务器重启后唤醒与 Milestone 1 实施攻坚收尾
**Content**: 服务器已重启恢复。请立即恢复运行并完成最终攻坚：
1. 重点排查设备端 `/userdisk/halflife/hl_runtime.log` 为 0 字节的问题，核实 `miniapp_cli` 启动与原生生命周期是否真正拉起底层 `xash3d` 引擎及渲染窗口；
2. 在真机 `9DA2200007506350` 上核验原生全屏直启状态与 Steam 官方 512x512 高清图标显示，抓取真机运行凭证（进程状态、日志、屏幕截屏或窗口检测）；
3. 验证通过后，将完整实施与真机验证记录写入 `/Volumes/500GB/Ydpen/.agents/teamwork/worker_m1_2/handoff.md` 并通知编排器。
**Action**: 立即恢复执行，攻坚上述要点并交付 handoff.md。


## 2026-11-12T21:06:28Z
Sender: 3976846c-1776-4937-a653-9cf69d968e47
Content:
**Context**: 服务器重启后唤醒与 M1 攻坚收尾
**Content**: 服务器已重启恢复，请立即恢复工作：
1. 重点排查设备端 /userdisk/halflife/hl_runtime.log 为 0 字节的问题，核实 miniapp_cli 与原生直启状态是否真正拉起引擎窗口；
2. 在真机 9DA2200007506350 上核验原生全屏直启及 Steam 官方 512x512 高清图标显示，抓取真机运行凭证；
3. 完成实施验证后提交 handoff.md 并通知编排器。
**Action**: 立即执行真机验证并交付 handoff.md。


## 2026-11-12T21:23:23Z
Sender: 3976846c-1776-4937-a653-9cf69d968e47
Content:
**Context**: libwl_center.so 文件头全零问题紧急排查通知
**Content**: 紧急排查指令：
1. 经查验，当前 `libs/libwl_center.so` 文件头为全零（被系统识别为纯 data 块而非合法 ELF）；
2. 请核查使用 `zig cc -shared -fPIC -target aarch64-linux-gnu` 编译生成命令与输出文件，确保生成的是合法的 ELF 64-bit aarch64 动态库（通过 file / readelf 校验）；
3. 验证有效后，务必将修改同步回写到 `native/wl_center.c`，不可仅停留在 stage 目录；
4. 部署至真机 `/userdisk/halflife/libwl_center.so`，确保引擎进程通过 LD_PRELOAD 正常注入。
**Action**: 立即核查并重新编译输出合法 ELF libwl_center.so 并回写源码。


## 2026-11-12T21:26:26Z
Sender: a13e7502-fdc7-4bd2-8a07-22f1b4ea562d
Content:
**Context**: 督促修复 libwl_center.so 非法文件头并完成真机实证
**Content**: 编排器已获悉父编排器关于 `libs/libwl_center.so` 文件头全零的关键同步。请立即：
1. 使用 `zig cc` 交叉编译生成合法的 aarch64 ELF 动态库，并用 `file` 命令验证合法的 ELF 64-bit 头；
2. 更新并推送至设备端 `/userdisk/halflife/libwl_center.so`；
3. 执行真机启动，核验 `xash3d` 正常运行与居中渲染，获取真机运行凭据（`pidof xash3d`、日志、屏幕证据）；
4. 将所有操作、编译命令与测试验证记录写入 `handoff.md` 后正式交接。
**Action**: 严格落实合规编译与真机凭据抓取，交付完整报告。
